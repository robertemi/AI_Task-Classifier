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
                self._client.table("tasks")
                .insert(
                    {
                        "project_id": req.projectId,
                        "title": req.task_title,
                        "description": req.user_description,
                        "ai_description": req.ai_description,
                        "story_points": "5",
                        "status": req.status,
                    }
                )
                .execute()
            )

            if response.data:
                new_id = response.data[0]["id"]

                # indexăm în RAG cu id-ul real din DB
                self._rag.index_task(
                    IndexEnrichedTaskRequest(
                        taskId=new_id,
                        projectId=req.projectId,
                        task_title=req.task_title,
                        user_description=req.user_description,
                        ai_description=req.ai_description,
                        epic=req.epic,
                        status=req.status,
                    )
                )
                return True

            print("Insert task failed")
            return False

        except Exception as e:
            print(f"Unhandled exception in insert task: {e}")
            return False

    def update_task(self, task_id: str, req: IndexTaskRequest) -> bool:
        try:
            update_data = {
                "project_id": req.projectId,
                "title": req.task_title,
                "description": req.user_description,
                "status": req.status,
            }

            response = (
                self._client.table("tasks")
                .update(update_data)
                .eq("id", task_id)
                .execute()
            )

            print("update_task supabase response:", response)

            if response.data and len(response.data) > 0:
                row = response.data[0]

                ai_desc = row.get("ai_description") or ""

                self._rag.index_task(
                    IndexEnrichedTaskRequest(
                        taskId=task_id,
                        projectId=req.projectId,
                        task_title=req.task_title,
                        user_description=req.user_description,
                        ai_description=ai_desc,
                        epic=getattr(req, "epic", None),
                        status=req.status,
                    )
                )
                return True

            print(f"Update task {task_id} failed: not found")
            return False

        except Exception as e:
            print(f"Unhandled exception in update task: {e}")
            return False

    def delete_task(self, task_id: str) -> bool:
        try:
            response = (
                self._client.table("tasks")
                .delete()
                .eq("id", task_id)
                .execute()
            )

            print("delete_task supabase response:", response)

            if response.data and len(response.data) > 0:
                # aici poți apela delete și în RAG dacă ai
                # self._rag.delete_task(task_id)
                return True

            print(f"Delete task {task_id} failed: not found")
            return False

        except Exception as e:
            print(f"Unhandled exception in delete task: {e}")
            return False
