import os
from dotenv import load_dotenv
import json
import re
import httpx

from backend.types.types import (
    IndexEnrichedTaskRequest,
    IndexTaskRequest,
    EnrichResult
)
from backend.service.task_service import TaskService
from backend.rag.retriever import RAGService
from backend.core.config import get_redis_client


task_service = TaskService()
_rag = RAGService()
http_client: httpx.AsyncClient | None = None
_redis_client = None

async def ensure_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = await get_redis_client()

async def get_http_client() -> httpx.AsyncClient:
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(timeout=15)
    return http_client


load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

DEFAULT_STORY_POINTS = 0

SYSTEM_PROMPT = (
    "You are an intelligent and detail-oriented project manager. "
    "You receive information about a project, its previously completed or ongoing tasks, "
    "and a newly created task that requires refinement. "
    "Your goal is to generate a more detailed, well-structured description for the new task, "
    "ensuring it aligns with the project's goals, tone, and prior work.\n\n"
    "OUTPUT FORMAT (must follow exactly):\n"
    "**Task Title:** <title>\n"
    "**Description:** <details>\n"
    "**Story Points:** <number from [1, 2, 3, 5, 8, 13]>\n\n"
    "Guidelines:\n"
    "1. Use the project details to understand the broader context and objectives.\n"
    "2. Reference relevant previous tasks if they provide useful patterns or dependencies.\n"
    "3. Maintain clarity and conciseness while enriching the technical and functional details.\n"
    "4. Avoid repeating information from the project summary unless it provides context.\n"
    "5. Output *only* the final formatted result, with no explanations or extra commentary.\n"
    "6. The '**Story Points:**' line is mandatory and must always appear as the final line.\n"
)

model_providers = {
    1 : 'deepseek/deepseek-chat-v3.1:free',
    2 : 'openai/gpt-oss-20b:free',
    3 : 'meta-llama/llama-3.3-8b-instruct:free'
}

async def get_project_context(project_id: str, user_id: str):
    await ensure_redis_client()
    cache_key = f'user:{user_id}:project:{project_id}:embeddings'

    # look for cached project
    cached = await _redis_client.get(cache_key)
    if cached:
        print(f'cache hit for {cache_key}')
        return cached

    print(f'cache missed for {cache_key}')    
    # if not cached, query RAG
    project_text = _rag.get_project_by_id(project_id)

    # save to cache
    if project_text:
        await _redis_client.set(cache_key, project_text, ex=3600) 

    return project_text


async def get_previous_tasks_context(project_id: str):
    await ensure_redis_client()
    cache_key = f"project:{project_id}:tasks"

    cached = await _redis_client.get(cache_key)
    if cached:
        try:
            tasks = json.loads(cached)
            print(f'cache hit for {cache_key}')
            return "\n\n".join(t["text"] if isinstance(t, dict) else t for t in tasks)
        except json.JSONDecodeError:
            pass

    print(f'cache miss for {cache_key}')
    previous_tasks = _rag.get_previous_tasks(project_id)
    await _redis_client.set(cache_key, json.dumps(previous_tasks), ex=3600)

    return "\n\n".join(previous_tasks)


async def get_context(project_id: str, user_id: str, new_task_title: str, new_task_user_description: str):
    project_text = await get_project_context(project_id, user_id)
    previous_tasks_text = await get_previous_tasks_context(project_id)

    context = (
        f"PROJECT OVERVIEW:\n{project_text}\n\n"
        f"PREVIOUS TASKS:\n{previous_tasks_text}\n\n"
        f"NEW TASK:\ntask_Title: {new_task_title}\nDescription: {new_task_user_description}\n"
    )

    return context


"""
Enrich and persist a newly created AI task.

This method receives the required task attributes, queries the Retrieval-Augmented Generation (RAG) system
to generate an enriched AI-powered task description, and delegates the following responsibilities to the server:
  • Inserting the new task record into the relational database.
  • Embedding the task details and storing them within the RAG for future retrieval and context enrichment.

Notes:
  - The task's `status` field should be inserted into the database with the default value `"pending"`.
  - The `created_at` and `updated_at` fields should default to the current timestamp (`NOW()`).

Args:
    projectId (int): Unique identifier of the project this task belongs to.
    title (str): Short descriptive title of the task.
    description (str): Initial task description provided by the user.
    story_points (int): Estimated effort or complexity of the task, in story points.

Returns:
    None
"""



async def enrich_task_details(
        req: IndexTaskRequest
):

    context = await get_context(
        req.projectId,
        req.userId,
        req.task_title,
        req.user_description
    )

    client = await get_http_client()

    response = await client.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": model_providers[req.selected_model],
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": context}
            ],
            "max_tokens": 1000
        })
    )

    data = response.json()

    if response.status_code != 200:
        print(f'OpenRouter error: {data}')
        raise RuntimeError(f'Openrouter API Error: {data}')

    if 'choices' not in data:
        print('Unexpected Openrouter error')
        raise RuntimeError('Unexpected Openrouter response')

    ai_output = data["choices"][0]["message"]["content"].strip()

    print("=== RAW AI OUTPUT START ===")
    print(ai_output)
    print("=== RAW AI OUTPUT END ===")

    # also extract story points
    match = re.search(
        r"(?:\*\*)?\s*Story\s*Points?\s*[:\-–—]\**\s*(\d+)\s*(?:\*\*)?",
        ai_output,
        re.IGNORECASE | re.MULTILINE
    )

    ai_story_points = int(match.group(1)) if match else DEFAULT_STORY_POINTS

    ai_description = re.sub(
        r"\*{0,2}\s*Story\s*Points?\s*[:\-–—]\**\s*\d+\s*\*{0,2}",
        "",
        ai_output,
        flags=re.IGNORECASE
    ).strip()

    pretty_description = (
        ai_description
        .replace("**", "")
        .replace("\\n", "\n")
        .replace("\n\n", "\n")
        .strip()
    )

    pretty_context_text = (
        context
        .replace("\\n", "\n")
        .replace("\n\n", "\n")
        .replace("**", "")
        .strip()
    )

    enriched_task = IndexEnrichedTaskRequest(
        projectId=req.projectId,
        taskId=None,
        task_title=req.task_title,
        user_description=req.user_description,
        ai_description=ai_description,
        status='todo',
        version=1,
        story_points=ai_story_points
    )

    await task_service.create_task(enriched_task)

    return EnrichResult(
        ai_description=pretty_description,
        story_points=ai_story_points,
        used_context_ids=['project_text', 'previous_tasks_text'],
        used_context_text=pretty_context_text
    ).model_dump()


async def enrich_edited_task(
        taskId: str,
        projectId: str,
        user_id: str,
        new_task_title: str | None = None,
        new_task_user_description: str | None = None,
        
):
    context = await get_context(
        project_id=projectId,
        user_id=user_id,
        new_task_title=new_task_title or '',
        new_task_user_description=new_task_user_description or ''
    )

    client = await get_http_client()

    response = await client.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": model_providers[2], # hardcoded model provider used of the automatic regeneration
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": context}
            ],
            "max_tokens": 1000
        })
    )

    data = response.json()

    if response.status_code != 200:
        print(f'OpenRouter error: {data}')
        raise RuntimeError(f'Openrouter API Error: {data}')

    if 'choices' not in data:
        print('Unexpected Openrouter error')
        raise RuntimeError('Unexpected Openrouter response')

    ai_output = data["choices"][0]["message"]["content"].strip()

    # also extract story points
    match = re.search(
        r"(?:\*\*)?\s*Story\s*Points?\s*[:\-–—]\**\s*(\d+)\s*(?:\*\*)?",
        ai_output,
        re.IGNORECASE | re.MULTILINE
    )

    ai_story_points = int(match.group(1)) if match else DEFAULT_STORY_POINTS

    ai_description = re.sub(
        r"\*{0,2}\s*Story\s*Points?\s*[:\-–—]\**\s*\d+\s*\*{0,2}",
        "",
        ai_output,
        flags=re.IGNORECASE
    ).strip()

    pretty_description = (
        ai_description
        .replace("**", "")
        .replace("\\n", "\n")
        .replace("\n\n", "\n")
        .strip()
    )

    pretty_context_text = (
        context
        .replace("\\n", "\n")
        .replace("\n\n", "\n")
        .replace("**", "")
        .strip()
    )

    return ai_description, ai_story_points