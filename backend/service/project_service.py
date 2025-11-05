from __future__ import annotations

from backend.core.config import get_supabase_client
from backend.types.types import IndexProjectRequest
from backend.rag.retriever import RAGService

class ProjectService:

    def __init__(self) -> None:
        self._client = get_supabase_client() 
        self._rag = RAGService()


    def create_project(self, req: IndexProjectRequest) -> bool:
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

            if response.data:
                new_id = response.data[0]['id']
                self._rag.index_project(
                    IndexProjectRequest(
                        projectId=new_id,
                        userId=req.userId,
                        name=req.name,
                        description=req.description
                    )
                )
                return True
            
            else:
                print(f'Insert project failed')
                return False
            
        except Exception as e:
            print(f'Unhandled exception in insert project: {e}')