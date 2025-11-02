from __future__ import annotations
from typing import List
from dataclasses import dataclass
from .chunking import chunk_text, normalize_text, sha256_of
from .vector_store import VectorStore
from .types import (
    IndexProjectRequest, IndexTaskRequest,
    RetrieveRequest, RetrieveResponse, ContextChunk
)

@dataclass
class RAGService:
    """
    Main class that handles all AI memory (RAG) operations.

    - Saves projects and tasks to ChromaDB.
    - Searches for related information when the AI needs context.
    """
    vs: VectorStore = VectorStore()

    def index_project(self, req: IndexProjectRequest):
        """Save a new project in the vector store."""
        text = f"{req.name}. {req.description}"
        chunks = chunk_text(text)
        items = [{
            "id": f"proj-{req.projectId}-v{req.version}-{i}",
            "text": ch,
            "metadata": {
                "projectId": req.projectId, "type": "project",
                "taskId": None, "title": req.name,
                "status": req.status, "epic": None,
                "version": req.version, "hash": sha256_of(ch),
            },
        } for i, ch in enumerate(chunks)]
        inserted = self.vs.upsert_texts(req.projectId, items)
        return {"chunks_indexed": inserted, "skipped": 0}

    def index_task(self, req: IndexTaskRequest):
        """Save or update a task with all its details."""

        merged = " \n".join([f for f in [req.title, req.user_description, req.ai_description or None] if f])
        chunks = chunk_text(merged)
        items = [{
            "id": f"task-{req.taskId}-v{req.version}-{i}",
            "text": ch,
            "metadata": {
                "projectId": req.projectId, "type": "task",
                "taskId": req.taskId, "title": req.title,
                "status": req.status, "epic": req.epic,
                "version": req.version, "hash": sha256_of(ch),
            },
        } for i, ch in enumerate(chunks)]
        inserted = self.vs.upsert_texts(req.projectId, items)
        return {"chunks_indexed": inserted, "skipped": 0}

    def retrieve(self, req: RetrieveRequest) -> RetrieveResponse:
        """
        Search the vector store for text that is similar to a given task.
        Used to give the AI extra context about the project.
        """
        query = normalize_text("\n".join([
            req.title,
            req.user_description,
            f"Epic: {req.epic}" if req.epic else "",
            "Goal: estimate story points & expand acceptance criteria."
        ]))
        raw = self.vs.query(
            project_id=req.projectId,
            query_text=query,
            k=12,
            where={"status": {"$ne": "archived"}},
        )
        ids = raw.get("ids", [[]])[0]
        docs = raw.get("documents", [[]])[0]
        metas = raw.get("metadatas", [[]])[0]
        k_final = min(6, len(ids))
        contexts: List[ContextChunk] = []
        for i in range(k_final):
            md = metas[i] or {}
            contexts.append(ContextChunk(
                doc_id=str(ids[i]),
                text=str(docs[i]),
                type=md.get("type", "task"),
                taskId=md.get("taskId"),
                status=md.get("status"),
                epic=md.get("epic"),
                title=md.get("title"),
            ))
        return RetrieveResponse(
            contexts=contexts,
            retrieval_stats={
                "k": len(contexts),
                "collection": f"proj_{req.projectId}",
                "took_ms": raw.get("timings", {}).get("query", None),
            },
        )
