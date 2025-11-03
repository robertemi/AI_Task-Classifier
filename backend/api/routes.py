import json


from fastapi import APIRouter, HTTPException

from backend.types.types import (
    EnrichTaskRequest,
    IndexResponse,
    IndexProjectRequest,
    IndexTaskRequest
)
from backend.rag.retriever import RAGService
from backend.types.types import EnrichTaskRequest
from backend.model.model import enrich_task_details


_rag = RAGService()
_rag_init_error = None

router = APIRouter(prefix="/index", tags=["indexing"])


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

        enriched = await enrich_task_details(
            IndexTaskRequest(
                projectId=req.projectId,
                task_title=req.task_title,
                taskId=req.taskId,
                user_description=req.user_description
            ))

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


        return IndexResponse(ok=True, data={"enriched": ai_text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrich+Index failed: {e}") from e
