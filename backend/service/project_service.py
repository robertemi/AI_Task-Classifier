from __future__ import annotations
from typing import Dict, Any, Optional
import time

from backend.types.types import IndexProjectRequest

class ProjectService:

    def __init__(self) -> None:
        self._store: Dict[int, Dict[str, Any]] = {}
        self._auto_id: int = 1000  # doar ca fallback daca nu primim projectId

    def create_project(self, req: IndexProjectRequest) -> Dict[str, Any]:
        project_id: int = req.projectId or self._next_id()

        project_obj: Dict[str, Any] = {
            "projectId": project_id,
            "userId": req.userId,
            "name": req.name,
            "description": req.description,
            "status": req.status,
        }

        self._store[project_id] = project_obj
        return project_obj

    def _next_id(self) -> int:
        self._auto_id += 1
        return self._auto_id
