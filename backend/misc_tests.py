from fastapi import FastAPI
from fastapi.responses import JSONResponse

from backend.model.model import enrich_task_details
from backend.types.types import EnrichTaskRequest , IndexTaskRequest

import asyncio
from contextlib import asynccontextmanager

app = FastAPI()




@app.post('/test')
async def test_enrichment_on_mock(req: EnrichTaskRequest):
    result = await enrich_task_details(IndexTaskRequest(
        projectId=req.projectId,
        taskId=req.taskId,
        title=req.task_title,
        user_description=req.task_description
    ))    

    return JSONResponse(content=result)
