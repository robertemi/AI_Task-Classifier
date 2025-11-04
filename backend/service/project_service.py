from __future__ import annotations
from typing import Dict, Any

from backend.core.config import get_supabase_client
from backend.types.types import IndexProjectRequest

class ProjectService:

    def __init__(self) -> None:
        self._client = get_supabase_client() 

    def create_project(self, req: IndexProjectRequest) -> Dict[str, Any]:
        try:
            response = (
                self._client.table('projects')
                .insert(
                    {
                        "user_id": req.userId,
                        "name": req.name,
                        "status": req.status,
                        "description": req.description
                    }
                )
                .execute()
            )
        except Exception as e:
            print(f'Unhandled exception in insert project: {e}')