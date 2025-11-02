from fastapi import APIRouter

from Backend.rag.retriever import RAGService
from Backend.rag.model_provider import ModelProvider
from Backend.rag.worker import EnrichmentWorker
from Backend.rag.types import (
    IndexProjectRequest, IndexTaskRequest,
    RetrieveRequest, EnrichTaskRequest, RetrieveResponse
)

from fastapi import APIRouter, BackgroundTasks
router = APIRouter(prefix="/rag", tags=["RAG"])

# singletons for MVP -> basically create single shared objects for our app
_rag = RAGService()
_model = ModelProvider()
_worker = EnrichmentWorker(_rag, _model)


@router.post("/index/project")
def index_project(req: IndexProjectRequest):
    """
    Store (or update) a project in the AI memory (vector database).
    The project text will be split into small parts ("chunks")
    and saved so the AI can use them later as context.
    """
    return {"status": "ok", **_rag.index_project(req)}

@router.post("/index/task")
def index_task(req: IndexTaskRequest):
    """
    Add a task to a specific project in the AI memory.
    Each task is saved with a projectId and taskId so
    they stay separate and can be found later.
    """
    return {"status": "ok", **_rag.index_task(req)}

@router.post("/retrieve", response_model=RetrieveResponse)
def retrieve(req: RetrieveRequest):
    """
    Search for information related to a given task or project.
    Returns the most similar saved chunks (context)
    that the AI model can use when thinking or generating answers.
    """
    return _rag.retrieve(req)

@router.post("/enrich")
def enrich(bt: BackgroundTasks, req: EnrichTaskRequest, task_snapshot: IndexTaskRequest):
    # TODO in real flow we have to load task by id from DB. For MVP we pass a snapshot.
    """
    Ask the AI to improve a task description and estimate its story points.
    The work runs in the background so it doesn’t block the user.
    """
    _worker.enqueue(bt, req, task_snapshot)
    return {"status": "queued"}
