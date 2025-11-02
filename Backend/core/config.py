from __future__ import annotations
import os
from dataclasses import dataclass

@dataclass
class Settings:
    """
    Stores global settings for the RAG system.

    CHROMA_DIR: where the AI memory (ChromaDB) will save files
    MODEL_PROVIDER: which AI service to use (e.g., OpenAI or Gemini)
    MODEL_NAME: name of the model (empty for now since it's a stub)
    """
    CHROMA_DIR: str = os.getenv("CHROMA_DIR", ".chroma")
    MODEL_PROVIDER: str = os.getenv("MODEL_PROVIDER", "stub")  # replace later
    MODEL_NAME: str = os.getenv("MODEL_NAME", "")

settings = Settings()
