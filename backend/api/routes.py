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
from backend.types.types import EnrichTaskRequest
from backend.model.model import enrich_task_details
from backend.service.project_service import ProjectService


_rag = RAGService()
_rag_init_error = None

router = APIRouter(prefix="/index", tags=["indexing"])
_project_service = ProjectService()


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
