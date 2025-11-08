from __future__ import annotations
from typing import List, Optional, Dict
from dataclasses import dataclass
import chromadb
from chromadb.utils import embedding_functions
from backend.core.config import get_settings


settings = get_settings()


@dataclass
class VSConfig:
    """Configuration for Chroma (the AI vector database)."""
    persist_dir: str

class VectorStore:
    """
    A small helper class to communicate with ChromaDB.

    It stores text chunks and can search them by similarity.
    Each project has its own "collection" (memory shelf).
    """
    
    def __init__(self, cfg: Optional[VSConfig] = None):
        self.cfg = cfg or VSConfig(persist_dir=settings.CHROMA_DIR)
        self.client = chromadb.PersistentClient(path=self.cfg.persist_dir)
        self.embed = embedding_functions.DefaultEmbeddingFunction()


    def _collection(self, project_id: int):
        """Get or create the Chroma collection for this project."""
        return self.client.get_or_create_collection(
            name=f"proj_{project_id}", embedding_function=self.embed
        )


    def upsert_texts(self, project_id: int, items: List[Dict[str, object]]) -> int:
        """
        Save or update multiple text chunks at once.
        If the chunk already exists, it gets updated (upsert).
        """
        if not items:
            return 0
        coll = self._collection(project_id)
        coll.upsert(
            ids=[str(it["id"]) for it in items],
            documents=[str(it["text"]) for it in items],
            metadatas=[it["metadata"] for it in items],
        )
        return len(items)


    def delete_by_task(self, project_id: int, task_id: int) -> int:
        """Remove all chunks related to a specific task."""
        coll = self._collection(project_id)
        results = coll.get()
        ids_to_del: List[str] = []
        for i, md in enumerate(results.get("metadatas", [])):
            if md and md.get("taskId") == task_id:
                ids_to_del.append(results["ids"][i])
        if ids_to_del:
            coll.delete(ids=ids_to_del)
        return len(ids_to_del)


    def query(self, project_id: int, query_text: str, k: int = 12, where: Optional[Dict[str, object]] = None):
        """
        Find the most similar chunks for a given text.
        Used when AI wants context about a task or project.
        """
        coll = self._collection(project_id)
        return coll.query(query_texts=[query_text], n_results=k, where=where or {})
