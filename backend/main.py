from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.api.routes import router as api_router
from backend.core.config import get_redis_client, get_supabase_client



@asynccontextmanager
async def lifespan(app: FastAPI):
    # on start up
    app.state.supabase = await get_supabase_client()
    app.state.redis = await get_redis_client()


    yield

    # on shutdown
    await app.state.redis.close()
    

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

app.include_router(api_router)





