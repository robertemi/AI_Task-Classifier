from __future__ import annotations
from typing import Dict, Any, Optional
import time
import os

from backend.core.config import get_supabase_client


from backend.types.types import IndexProjectRequest

class ProjectService:

    def __init__(self) -> None:
        self._client = get_supabase_client() 

    def create_project(self, req: IndexProjectRequest) -> Dict[str, Any]:
        try:
            response = (
                self._client.table('projects')
                .insert({})
                .execute()
            )
        except Exception as e:
            print(f'Unhandled exception in insert project: {e}')
            
        # project_obj: Dict[str, Any] = {
        #     "userId": req.userId,
        #     "name": req.name,
        #     "description": req.description,
        #     "status": req.status,
        # }


        # return project_obj
