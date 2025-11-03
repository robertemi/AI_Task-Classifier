from typing import Optional, Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from Backend.types.types import IndexTaskRequest, IndexProjectRequest
from Backend.rag.retriever import RAGService

from Backend.types.types import EnrichTaskRequest
from Backend.model.model import enrich_task_details
import json


_rag = RAGService()
_rag_init_error = None

router = APIRouter(prefix="/index", tags=["indexing"])


class TaskForIndex(IndexTaskRequest):
    ai_description: Optional[str] = None


class IndexResponse(BaseModel):
    ok: bool
    data: Optional[Dict[str, Any]] = None
    detail: Optional[str] = None


class _EnrichShim(BaseModel):
    projectId: int
    taskId: int
    title: str
    user_description: str


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
    if _rag is None:
        raise HTTPException(status_code=500, detail=f"RAGService indisponibil: {_rag_init_error}")
    try:
        result = _rag.index_project(req)
        return IndexResponse(ok=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project indexing failed: {e}") from e


@router.post("/task/enrich_and_index", response_model=IndexResponse)
async def enrich_and_index(req: EnrichTaskRequest) -> IndexResponse:
    if _rag is None:
        raise HTTPException(status_code=500, detail=f"RAGService indisponibil: {_rag_init_error}")
    try:
        shim = _EnrichShim(
            projectId=req.projectId,
            taskId=req.taskId,
            title=req.task_title,
            user_description=req.task_description,
        )

        enriched = await enrich_task_details(shim)

        if hasattr(enriched, "model_dump"):
            enriched = enriched.model_dump()
        elif hasattr(enriched, "dict"):
            enriched = enriched.dict()

        ai_text = (
            enriched.get("ai_description")
            or enriched.get("enriched_text")
            or enriched
        )
        if isinstance(ai_text, str):
            try:
                ai_text_obj = json.loads(ai_text)
                ai_text = ai_text_obj.get("description", ai_text)
            except json.JSONDecodeError:
                pass

        adapter = TaskForIndex(
            projectId=shim.projectId,
            taskId=shim.taskId,
            title=shim.title,
            user_description=shim.user_description,
            ai_description=ai_text,
        )
        result = _rag.index_task(adapter)

        return IndexResponse(ok=True, data={"enriched": ai_text, "index_result": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrich+Index failed: {e}") from e
