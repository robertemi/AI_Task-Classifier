from __future__ import annotations
from backend.types.types import IndexEnrichedTaskRequest, IndexTaskRequest
from backend.core.config import get_supabase_client
from backend.rag.retriever import RAGService

class TaskService:

    def __init__(self) -> None:
        self._client = get_supabase_client()
        self._rag = RAGService()

    def create_task(self, req: IndexEnrichedTaskRequest) -> bool:
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

            if response.data:
                new_id = response.data[0]['id']
                self._rag.index_task(
                    IndexEnrichedTaskRequest(
                        taskId=new_id,
                        projectId=req.projectId,
                        task_title=req.task_title,
                        user_description=req.user_description,
                        ai_description=req.ai_description,
                        epic=req.epic,
                        status=req.status
                    )
                )
                return True
            else:
                print(f'Insert task failed')
                return False
        except Exception as e:
            print(f'Unhandled exception in insert task: {e}')