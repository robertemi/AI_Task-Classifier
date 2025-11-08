import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from backend.types.types import (
    EnrichTaskRequest,
    IndexResponse,
    IndexProjectRequest,
    IndexTaskRequest
)
from backend.rag.retriever import RAGService
from backend.model.model import enrich_task_details
from backend.service.project_service import ProjectService
from backend.service.task_service import TaskService


_rag = RAGService()
_rag_init_error = None

router = APIRouter(prefix="/index", tags=["indexing"])
_project_service = ProjectService()
_task_service = TaskService()


@router.get("/health", response_model=IndexResponse)
def health() -> IndexResponse:
    ready = _rag is not None and _rag_init_error is None
    return IndexResponse(
        ok=ready,
        data={"service": "index", "rag_ready": ready},
        detail=None if ready else f"RAGService init error: {_rag_init_error}",
    )


@router.post("/project", response_model=IndexResponse)
def index_project(req: IndexProjectRequest) -> IndexResponse:
    try:
        project_obj = _project_service.create_project(req)

        if project_obj:
            return JSONResponse(content={
                "succes": True
            })
        else:
            return JSONResponse(content={
                "succes": False
            })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project creation failed: {e}") from e


@router.put("/project/{project_id}", response_model=IndexResponse)
def update_project(project_id: str, req: IndexProjectRequest) -> IndexResponse:
    try:
        updated = _project_service.update_project(project_id, req)

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


@router.delete("/project/{project_id}", response_model=IndexResponse)
def delete_project(project_id: str) -> IndexResponse:
    try:
        deleted = _project_service.delete_project(project_id)

        if not deleted:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        return IndexResponse(
            ok=True,
            data={"projectId": project_id},
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
                user_description=req.user_description
            ))
        
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


@router.put("/task/{task_id}", response_model=IndexResponse)
def update_task(task_id: str, req: IndexTaskRequest) -> IndexResponse:
    try:
        updated = _task_service.update_task(task_id, req)

        if not updated:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

        return IndexResponse(
            ok=True,
            data={"taskId": task_id},
            detail="Task updated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task update failed: {e}") from e


@router.delete("/task/{task_id}", response_model=IndexResponse)
def delete_task(task_id: str) -> IndexResponse:
    try:
        deleted = _task_service.delete_task(task_id)

        if not deleted:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

        return IndexResponse(
            ok=True,
            data={"taskId": task_id},
            detail="Task deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task deletion failed: {e}") from e
