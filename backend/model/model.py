import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')


SYSTEM_PROMPT = (
    "You are an intelligent and detail-oriented project manager. "
    "You receive information about a project, its previously completed or ongoing tasks, "
    "and a newly created task that requires refinement. "
    "Your goal is to generate a more detailed, well-structured description for the new task, "
    "ensuring it aligns with the project's goals, tone, and prior work. "
    "\n\n"
    "Guidelines:\n"
    "1. Use the project details to understand the broader context and objectives.\n"
    "2. Reference relevant previous tasks if they provide useful patterns, structure, or dependencies.\n"
    "3. Maintain clarity and conciseness while enriching the technical and functional details.\n"
    "4. Avoid repeating information from the project summary unless it provides context.\n"
    "5. Output only the final, improved task description — no explanations or commentary.\n"
)



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
        projectId: int,
        title: str,
        description: str,
        story_points: int
):
    pass
