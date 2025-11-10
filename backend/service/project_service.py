from __future__ import annotations

from backend.core.config import get_supabase_client
from backend.types.types import (
    IndexProjectRequest,
    EditProjectRequest,
    DeleteProjectRequest
)
from backend.rag.retriever import RAGService
from backend.core.config import get_redis_client

class ProjectService:

    def __init__(self, rag: RAGService | None = None) -> None:
        self._rag = rag or RAGService()
        self._supabase_client = None
        self._redis_client = None


    async def ensure_clients(self):
        if self._supabase_client is None:
            self._supabase_client = await get_supabase_client()
        if self._redis_client is None:
            self._redis_client = await get_redis_client()


    async def create_project(self, req: IndexProjectRequest):
        await self.ensure_clients()
        try:
            response = (
                self._supabase_client.table('projects')
                .insert(
                    {
                        "user_id": req.userId,
                        "name": req.name,
                        "status": req.status,
                        "description": req.description
                    }
                )
            )
            response = await response.execute()

            if response.data:
                new_id = response.data[0]['id']
                project_embeddings = self._rag.index_project(
                    IndexProjectRequest(
                        projectId=new_id,
                        userId=req.userId,
                        name=req.name,
                        description=req.description
                    )
                )['chunks_indexed']

                cache_key = f'{set(req.userId, new_id)}:{project_embeddings}'
                

                return True
            
            else:
                print(f'Insert project failed')
                return False
            
        except Exception as e:
            print(f'Unhandled exception in insert project: {e}')

    async def update_project(self, req: EditProjectRequest):
        await self.ensure_clients()
        try:
            update_data = {
                **({"name": req.name} if req.name else {}),
                **({"description": req.description} if req.description else {})
            }

            response = (
                self._supabase_client
                .table('projects')
                .update(update_data)
                .eq("id", req.projectId)
            )
            response = await response.execute()

            if response.data:
                row = response.data[0]
                # resync project in RAG with latest update
                self._rag.index_project(
                    IndexProjectRequest(
                        projectId=row["id"],
                        userId=row.get("user_id", req.userId),
                        name=row["name"],
                        description=row.get("description", ""),
                        status=row.get("status")
                    )
                )
                return True
            else:
                print(f'Update project {req.projectId} failed: not found')
                return False

        except Exception as e:
            print(f'Unhandled exception in update project: {e}')
            return False

    async def delete_project(self, req: DeleteProjectRequest):
        await self.ensure_clients()
        try:
            response = (
                self._supabase_client
                .table('projects')
                .delete()
                .match({
                    "id": req.projectId,
                    "user_id": req.userId
                })
            )

            response = await response.execute()

            if response.data:
                # remove all RAG data from this project
                self._rag.delete_project(req.projectId)
                return True
            else:
                print(f'Delete project {req.projectId} failed: not found')
                return False

        except Exception as e:
            print(f'Unhandled exception in delete project: {e}')
            return False