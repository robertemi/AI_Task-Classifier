from fastapi import FastAPI
from contextlib import asynccontextmanager

from backend.rag.retriever import RAGService
from backend.types.types import IndexProjectRequest, IndexTaskRequest
from backend.api.routes import router as api_router


app = FastAPI() 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # create mock project and task Data 
    rag = RAGService()

    rag.index_project(IndexProjectRequest(
        projectId=1,
        userId=101,
        name="AI Task Management Dashboard",
        description=(
            "A web-based platform that helps software teams automatically generate, "
            "enrich, and organize development tasks using AI. "
            "The system integrates with Jira and GitHub to streamline backlog refinement "
            "and estimate story points intelligently based on past work patterns."
        ),
        status="in_progress"
        )
    )

    rag.index_task(IndexTaskRequest(
        projectId=1,
        taskId=2,
        task_title='Login Screen',
        user_description='Create login screen'
    ))
    yield
    print(" App shutting down")

app.router.lifespan_context = lifespan

app.include_router(api_router)





