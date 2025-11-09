from __future__ import annotations

from backend.core.config import get_supabase_client
from backend.types.types import (
    IndexProjectRequest,
    EditProjectRequest,
    DeleteProjectRequest
)
from backend.rag.retriever import RAGService
from backend.core.config import get_supabase_client

class ProjectService:

    def __init__(self) -> None:
        self._rag = RAGService()
        self._client = None

    async def ensure_client(self):
        if self._client is None:
            self._client = await get_supabase_client()

    async def create_project(self, req: IndexProjectRequest):
        await self.ensure_client()
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
            )
            response = await response.execute()

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

    async def update_project(self, req: EditProjectRequest):
        await self.ensure_client()
        try:
            update_data = {
                **({"name": req.name} if req.name else {}),
                **({"description": req.description} if req.description else {})
            }

            response = (
                self._client
                .table('projects')
                .update(update_data)
                .eq("id", req.projectId)
            )
            response = await response.execute()

            if response.data:
                # TODO call edit project method from RAG

                # self._rag.index_project(
                #     IndexProjectRequest(
                #         projectId=project_id,
                #         userId=req.userId,
                #         name=req.name,
                #         description=req.description,
                #         status=req.status,
                #     )
                # )
                return True
            else:
                print(f'Update project {req.projectId} failed: not found')
                return False

        except Exception as e:
            print(f'Unhandled exception in update project: {e}')
            return False

    async def delete_project(self, req: DeleteProjectRequest):
        await self.ensure_client()
        try:
            response = (
                self._client
                .table('projects')
                .delete()
                .match({
                    "id": req.projectId,
                    "user_id": req.userId
                })
            )

            response = await response.execute()

            if response.data:
                # TODO call delete project method from RAG
                return True
            else:
                print(f'Delete project {req.projectId} failed: not found')
                return False

        except Exception as e:
            print(f'Unhandled exception in delete project: {e}')
            return False