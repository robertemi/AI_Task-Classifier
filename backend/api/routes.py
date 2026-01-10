import json
import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from backend.types.types import (
    EnrichTaskRequest,
    IndexResponse,
    IndexProjectRequest,
    IndexTaskRequest,
    EditProjectRequest,
    EditEnrichedTaskRequest,
    DeleteProjectRequest,
    DeleteEnrichedTaskRequest, ProjectHandbookRequest
)
from backend.rag.retriever import RAGService
from backend.model.model import enrich_task_details, generate_project_handbook_text, handbook_text_to_pdf_bytes
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
        raise HTTPException(status_code=500, detail=f"Unavailable RAGService: {_rag_init_error}")
    try:
        enriched = await enrich_task_details(
            IndexTaskRequest(
                projectId=req.projectId,
                task_title=req.task_title,
                taskId=req.taskId,
                user_description=req.user_description,
                selected_model=req.selected_model,
                userId=req.userId,
                status=req.status
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
        await _task_service.delete_task(req)

        return IndexResponse(
            ok=True,
            data={"taskId": req.taskId},
            detail="Task deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task deletion failed: {e}") from e

@router.post("/project/handbook/pdf")
async def generate_project_handbook_pdf(req: ProjectHandbookRequest):
    """
    Generate a structured project handbook using the LLM and return it as a downloadable PDF.
    This uses only Supabase data (no Redis or RAG in this flow).
    """
    try:
        # generate handbook text from Supabase data
        handbook_text = await generate_project_handbook_text(req)

        if not handbook_text:
            raise HTTPException(status_code=404, detail="No handbook content could be generated.")

        # convert text to PDF bytes
        pdf_bytes = handbook_text_to_pdf_bytes(
            handbook_text,
            title=f"Project {req.projectId} - Handbook"
        )

        # stream the PDF back to the client
        filename = f"project_{req.projectId}_handbook.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        print(f'Unexpected error in project handbook route: {e}')
        # raise HTTPException(status_code=500, detail=f"Handbook generation failed: {e}") from e  
        raise HTTPException(status_code=500, detail=f"Handbook generation failed unexpectedly: {e}")