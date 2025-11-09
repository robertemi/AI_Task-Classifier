from __future__ import annotations

from backend.types.types import (
    IndexEnrichedTaskRequest,
    EditEnrichedTaskRequest,
    DeleteEnrichedTaskRequest
)
from backend.core.config import get_supabase_client
from backend.rag.retriever import RAGService
from backend.core.config import get_supabase_client


class TaskService:

    def __init__(self):
        self._rag = RAGService()
        self._client = None

    async def ensure_client(self):
        if self._client is None:
            self._client = await get_supabase_client()

    async def create_task(self, req: IndexEnrichedTaskRequest):
        await self.ensure_client()
        try:
            response = (
                self._client
                .table("tasks")
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
            )

            response = await response.execute()

            if response.data:
                new_id = response.data[0]["id"]

                # save newly created task in RAG
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

    async def update_task(self, req: EditEnrichedTaskRequest):
        await self.ensure_client()
        try:
            update_data = {
                **({"project_id": req.projectId}),
                **({"id": req.taskId}),
                **({"title": req.task_title} if req.task_title else {}),
                **({"description": req.user_description} if req.user_description else {}),
                **({"ai_description": req.ai_description} if req.ai_description else {})
            }

            response = (
                self._client
                .table("tasks")
                .update(update_data)
                .match({
                    "id": req.taskId,
                    "project_id": req.projectId
                })
            )

            response = await response.execute()

            print("update_task supabase response:", response)

            if response.data and len(response.data) > 0:
                row = response.data[0]

                ai_desc = row.get("ai_description") or ""

                # TODO call edit task method from RAG
                # self._rag.index_task(
                #     IndexEnrichedTaskRequest(
                #         taskId=task_id,
                #         projectId=req.projectId,
                #         task_title=req.task_title,
                #         user_description=req.user_description,
                #         ai_description=ai_desc,
                #         epic=getattr(req, "epic", None),
                #         status=req.status,
                #     )
                # )
                return True

            print(f"Update task {req.taskId} or User has no permission on given task")
            return False

        except Exception as e:
            print(f"Unhandled exception in update task: {e}")
            return False

    async def delete_task(self, req: DeleteEnrichedTaskRequest):
        await self.ensure_client()
        try:
            response = (
                self._client
                .table("tasks")
                .delete()
                .match({
                    "id": req.taskId,
                    "project_id": req.projectId
                })
            )

            response = await response.execute()

            print("delete_task supabase response:", response)

            if response.data and len(response.data) > 0:
                # TODO call edit task method from RAG
                return True

            print(f"Delete task {req.taskId} failed: not found")
            return False

        except Exception as e:
            print(f"Unhandled exception in delete task: {e}")
            return False
