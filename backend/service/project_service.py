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

    def update_project(self, project_id: str, req: IndexProjectRequest) -> bool:
        try:
            response = (
                self._client.table('projects')
                .update(
                    {
                        "name": req.name,
                        "description": req.description,
                        "status": req.status,
                    }
                )
                .eq("id", project_id)
                .execute()
            )

            if response.data:
                self._rag.index_project(
                    IndexProjectRequest(
                        projectId=project_id,
                        userId=req.userId,
                        name=req.name,
                        description=req.description,
                        status=req.status,
                    )
                )
                return True
            else:
                print(f'Update project {project_id} failed: not found')
                return False

        except Exception as e:
            print(f'Unhandled exception in update project: {e}')
            return False

    def delete_project(self, project_id: str) -> bool:
        try:
            response = (
                self._client.table('projects')
                .delete()
                .eq("id", project_id)
                .execute()
            )

            if response.data:
                # Dacă aveți funcție separată în RAG pentru delete, se poate apela aici.
                # self._rag.delete_project(project_id)
                return True
            else:
                print(f'Delete project {project_id} failed: not found')
                return False

        except Exception as e:
            print(f'Unhandled exception in delete project: {e}')
            return False