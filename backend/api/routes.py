import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from backend.types.types import (
    EnrichTaskRequest,
    IndexResponse,
    IndexProjectRequest,
    IndexTaskRequest,
    EditProjectRequest,
    EditEnrichedTaskRequest,
    DeleteProjectRequest,
    DeleteEnrichedTaskRequest
)
from backend.rag.retriever import RAGService
from backend.model.model import enrich_task_details
from backend.service.project_service import ProjectService
from backend.service.task_service import TaskService

from backend.rag.singleton import rag_service


_rag = rag_service
_rag_init_error = None

router = APIRouter(prefix="/index", tags=["indexing"])
_project_service = ProjectService(rag=_rag)
_task_service = TaskService(rag=_rag)


@router.get("/health", response_model=IndexResponse)
def health() -> IndexResponse:
    ready = _rag is not None and _rag_init_error is None
    return IndexResponse(
        ok=ready,
        data={"service": "index", "rag_ready": ready},
        detail=None if ready else f"RAGService init error: {_rag_init_error}",
    )


@router.post("/project", response_model=IndexResponse)
async def index_project(req: IndexProjectRequest) -> IndexResponse:
    try:
        project_obj = await _project_service.create_project(req)

        if project_obj:
            return JSONResponse(content={
                "succes": True,
                "message": project_obj
            })
        else:
            return JSONResponse(content={
                "succes": False,
                "message": project_obj
            })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project creation failed: {e}") from e


@router.put("/project/{project_id}", response_model=IndexResponse)
async def update_project1(project_id: str, req: IndexProjectRequest) -> IndexResponse:
    try:
        updated = await _project_service.update_project(project_id, req)

        if not updated:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        return IndexResponse(
            ok=True,
            data={"projectId": project_id},
            detail="Project updated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project update failed: {e}") from e

@router.put('/edit/project')
async def update_project(req: EditProjectRequest):
    try:
        updated = await _project_service.update_project(req)

        if updated:
            return JSONResponse(content={
                'success': True
            })
        else:
            return JSONResponse(content={
                'success': False
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Edit project failed: {e}') from e


@router.delete("/delete/project", response_model=IndexResponse)
async def delete_project(req: DeleteProjectRequest):
    try:
        deleted = await _project_service.delete_project(req)

        if not deleted:
            raise HTTPException(status_code=404, detail=f"Project {req.projectId} or User {req.userId} not found")

        return IndexResponse(
            ok=True,
            data={"projectId": req.projectId},
            detail="Project deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project deletion failed: {e}") from e



@router.post("/task/enrich_and_index", response_model=IndexResponse)
async def enrich_and_index(req: EnrichTaskRequest) -> IndexResponse:
    if _rag is None:
        raise HTTPException(status_code=500, detail=f"RAGService indisponibil: {_rag_init_error}")
    try:

        enriched = await enrich_task_details(
            IndexTaskRequest(
                projectId=req.projectId,
                task_title=req.task_title,
                taskId=req.taskId,
                user_description=req.user_description,
                selected_model=req.selected_model
            )
            )
        
        if enriched:
            return JSONResponse(content={
                "succes": True
            })
        else:
            return JSONResponse(content={
                "success": False
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrich+Index failed: {e}") from e


@router.put("/edit/task", response_model=IndexResponse)
async def update_task(req: EditEnrichedTaskRequest) -> IndexResponse:
    try:
        updated = await _task_service.update_task(req)

        if not updated:
            raise HTTPException(status_code=404, detail=f"Task {req.taskId} not found")

        return IndexResponse(
            ok=True,
            data={"taskId": req.taskId},
            detail="Task updated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task update failed: {e}") from e


@router.delete("/delete/task", response_model=IndexResponse)
async def delete_task(req: DeleteEnrichedTaskRequest) -> IndexResponse:
    try:
        deleted = await _task_service.delete_task(req)

        if not deleted:
            raise HTTPException(status_code=404, detail=f"Task {req.taskId} not found")

        return IndexResponse(
            ok=True,
            data={"taskId": req.taskId},
            detail="Task deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task deletion failed: {e}") from e
