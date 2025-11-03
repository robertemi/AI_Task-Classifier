# from fastapi import APIRouter

# from rag.retriever import RAGService
# from rag.model_provider import ModelProvider
# from rag.worker import EnrichmentWorker
# from rag.types import (
#     IndexProjectRequest, IndexTaskRequest,
#     RetrieveRequest, EnrichTaskRequest, RetrieveResponse
# )

# from fastapi import APIRouter, BackgroundTasks
# router = APIRouter(prefix="/rag", tags=["RAG"])

# # singletons for MVP -> basically create single shared objects for our app
# _rag = RAGService()


# @router.post("/index/project")
# def index_project(req: IndexProjectRequest):
#     """
#     Store (or update) a project in the AI memory (vector database).
#     The project text will be split into small parts ("chunks")
#     and saved so the AI can use them later as context.
#     """
#     return {"status": "ok", **_rag.index_project(req)}

# @router.post("/index/task")
# def index_task(req: IndexTaskRequest):
#     """
#     Add a task to a specific project in the AI memory.
#     Each task is saved with a projectId and taskId so
#     they stay separate and can be found later.
#     """
#     return {"status": "ok", **_rag.index_task(req)}

# @router.post("/retrieve", response_model=RetrieveResponse)
# def retrieve(req: RetrieveRequest):
#     """
#     Search for information related to a given task or project.
#     Returns the most similar saved chunks (context)
#     that the AI model can use when thinking or generating answers.
#     """
#     return _rag.retrieve(req)
