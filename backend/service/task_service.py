from __future__ import annotations
from typing import Dict, Any
from backend.types.types import IndexTaskRequest, IndexEnrichedTaskRequest
from backend.core.config import get_supabase_client


class TaskService:

    def __init__(self) -> None:
        self._client = get_supabase_client()

    def create_task(self, req: IndexEnrichedTaskRequest) -> None:
        try:
            response = (
                self._client.table('tasks')
                .insert({})
                .execute()
            )
        except Exception as e:
            print(f'Unhandled exception in insert task: {e}')


        # obj = {
        #     "taskId": task_id,
        #     "projectId": req.projectId,
        #     "task_title": req.task_title,
        #     "user_description": req.user_description,
        #     "epic": req.epic,
        #     "status": req.status,
        # }
        # self._tasks[task_id] = obj
        # return obj

    # def save_enriched(self, req: IndexEnrichedTaskRequest) -> Dict[str, Any]:
    #     task_id = req.taskId or self._next_id()
    #     obj = req.model_dump()
    #     obj["taskId"] = task_id
    #     self._tasks[task_id] = obj
    #     return obj


