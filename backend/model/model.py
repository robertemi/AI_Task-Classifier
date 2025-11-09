import os
from dotenv import load_dotenv
import json
import re
import httpx

from backend.rag.retriever import RAGService
from backend.types.types import (
    IndexEnrichedTaskRequest,
    IndexTaskRequest,
    EnrichResult
)
from backend.service.task_service import TaskService


load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

DEFAULT_STORY_POINTS = 3

SYSTEM_PROMPT = (
    "You are an intelligent and detail-oriented project manager. "
    "You receive information about a project, its previously completed or ongoing tasks, "
    "and a newly created task that requires refinement. "
    "Your goal is to generate a more detailed, well-structured description for the new task, "
    "ensuring it aligns with the project's goals, tone, and prior work. Also make sure to add the correct amount of story points," \
    "from the available choices of [1, 2, 3, 5, 8, 13]"
    "\n\n"
    "Guidelines:\n"
    "1. Use the project details to understand the broader context and objectives.\n"
    "2. Reference relevant previous tasks if they provide useful patterns, structure, or dependencies.\n"
    "3. Maintain clarity and conciseness while enriching the technical and functional details.\n"
    "4. Avoid repeating information from the project summary unless it provides context.\n"
    "5. Output only the final, improved task description — no explanations or commentary.\n"
)



async def get_project_context(project_id: str):
    rag = RAGService()

    project_text = rag.get_project_by_id(project_id)

    return project_text

async def get_previous_tasks_context(project_id: str):
    rag = RAGService()

    previous_tasks = rag.get_previous_tasks(project_id)
    previous_tasks_text = "\n\n".join(previous_tasks)

    return previous_tasks_text

async def get_context(project_id: str, new_task_title: str, new_task_user_description: str):
    project_text = await get_project_context(project_id)
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
    
    service = TaskService()
    
    context = await get_context(
        req.projectId,
        req.task_title,
        req.user_description
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "deepseek/deepseek-chat-v3.1:free",
                "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": context
                }
                ],
                "max_tokens": 800
            })
        )

        data = response.json()

        if response.status_code != 200:
            print('OpenRouter error')
            raise RuntimeError('Openrouter API Error')
        
        if 'choices' not in data:
            print('Unexpected Openrouter error')
            raise RuntimeError('Unexpected Openrouter response')

        ai_output = data["choices"][0]["message"]["content"].strip()

        # also extract story points
        match = re.search(
            r"(?:\*\*)?\s*Story\s*Points\s*[:\-–]\s*(\d+)\s*(?:\*\*)?",
            ai_output,
            re.IGNORECASE | re.MULTILINE
        )

        ai_story_points = int(match.group(1)) if match else DEFAULT_STORY_POINTS

        ai_description = re.sub(
            r"\*{0,2}\s*Story\s*Points\s*[:\-–]\s*\d+\s*\*{0,2}", 
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
            .replace("\\n", "\n")     # fix double-escaped newlines
            .replace("\n\n", "\n")    # collapse extra line breaks
            .replace("**", "")        # remove markdown bold markers
            .strip()
        )

        # persists newly created task to RAG

        enriched_task = IndexEnrichedTaskRequest(
            projectId=req.projectId,
            taskId=None, # generated later when inserting into the DB,
            task_title=req.task_title,
            user_description=req.user_description,
            ai_description=ai_description,
            status='todo',
            version=1
        )

        # insert new task into DB
        await service.create_task(enriched_task)

        # just for logging purposes
        return EnrichResult(
            ai_description=pretty_description,
            story_points=ai_story_points,
            used_context_ids=['project_text', 'previous_tasks_text'],
            used_context_text=pretty_context_text
        ).model_dump()
