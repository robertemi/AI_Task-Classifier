from fastapi import FastAPI, APIRouter

from backend.model.model import enrich_task_details
from backend.rag.retriever import RAGService
from backend.types.types import IndexProjectRequest

import asyncio
from contextlib import asynccontextmanager

app = FastAPI() 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # create mock project and task Data 
    pass