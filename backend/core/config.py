from __future__ import annotations
import os
from dataclasses import dataclass
from supabase import acreate_client, AsyncClient
from dotenv import load_dotenv
from redis import asyncio as aioredis

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
REDIS_URL = os.getenv(
    "REDIS_URL",
    f"rediss://:{os.getenv('REDIS_PASSWORD', '')}@{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', 6379)}/0"
)
REDIS_HOST = os.getenv('REDIS_HOST')
REDIS_PORT = os.getenv('REDIS_PORT')
REDIS_USERNAME = os.getenv('REDIS_USERNAME')
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')


_supabase_client = None
_redis_client = None


@dataclass
class Settings:
    """
    Stores global settings for the RAG system.

    CHROMA_DIR: where the AI memory (ChromaDB) will save files
    MODEL_PROVIDER: which AI service to use (e.g., OpenAI or Gemini)
    MODEL_NAME: name of the model (empty for now since it's a stub)
    """
    CHROMA_DIR: str = os.getenv("CHROMA_DIR", ".chroma")
    


def get_settings():
    settings = Settings()
    return settings


async def get_supabase_client() -> AsyncClient:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = await acreate_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client

async def get_redis_client() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True,
            username=REDIS_USERNAME,
            password=REDIS_PASSWORD
        )
        # _redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client