from __future__ import annotations
from backend.types.types import IndexEnrichedTaskRequest
from backend.core.config import get_supabase_client
# from backend.types.types2 import IndexEnrichedTaskRequest

class TaskService:

    def __init__(self) -> None:
        self._client = get_supabase_client()

    def create_task(self, req: IndexEnrichedTaskRequest) -> None:
        try:
            response = (
                self._client.table('tasks')
                .insert(
                    {
                        "project_id": req.projectId,
                        "title": req.task_title,
                        "description": req.user_description,
                        "ai_description": req.ai_description,
                        "story_points": "5",
                        "status": req.status
                    }
                )
                .execute()
            )
        except Exception as e:
            print(f'Unhandled exception in insert task: {e}')