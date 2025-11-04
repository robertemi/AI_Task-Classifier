from __future__ import annotations
from typing import Dict, Any
from backend.types.types import IndexTaskRequest, IndexEnrichedTaskRequest

class TaskService:

    def __init__(self) -> None:
        self._tasks: Dict[int, Dict[str, Any]] = {}
        self._auto_id: int = 5000

    def create_task(self, req: IndexTaskRequest) -> Dict[str, Any]:
        task_id = req.taskId or self._next_id()
        obj = {
            "taskId": task_id,
            "projectId": req.projectId,
            "task_title": req.task_title,
            "user_description": req.user_description,
            "epic": req.epic,
            "status": req.status,
        }
        self._tasks[task_id] = obj
        return obj

    def save_enriched(self, req: IndexEnrichedTaskRequest) -> Dict[str, Any]:
        task_id = req.taskId or self._next_id()
        obj = req.model_dump()
        obj["taskId"] = task_id
        self._tasks[task_id] = obj
        return obj

    def _next_id(self) -> int:
        self._auto_id += 1
        return self._auto_id
