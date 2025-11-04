from __future__ import annotations
import os
from dataclasses import dataclass
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

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

def get_supabase_client() -> Client:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return supabase
