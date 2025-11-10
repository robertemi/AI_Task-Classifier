from __future__ import annotations
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from .chunking import chunk_text, normalize_text, sha256_of
from .vector_store import VectorStore
from ..types.types import (
    IndexProjectRequest, IndexEnrichedTaskRequest,
    RetrieveRequest, RetrieveResponse, ContextChunk
)

@dataclass
class RAGService:
# before
    """
    Main class that handles all AI memory (RAG) operations.

    - Saves projects and tasks to ChromaDB.
    - Searches for related information when the AI needs context.
    """
# currently
    """
       Handles all RAG operations: indexing, retrieval, deterministic lookups.
       Now with simple in-memory caching for deterministic reads.
    """
    vs: VectorStore = VectorStore()
    _project_cache: Dict[str, str] = field(default_factory=dict)
    _tasks_cache: Dict[str, List[str]] = field(default_factory=dict)

    def index_project(self, req: IndexProjectRequest):
        """Save a new project in the vector store."""
        text = f"{req.name}. {req.description}"
        chunks = chunk_text(text)
        items = [{
            "id": f"proj-{req.projectId}-{i}",
            "text": ch,
            "metadata": {
                "projectId": req.projectId, "type": "project",
                "taskId": None, "title": req.name,
                "status": req.status, "epic": None,
                # "version": req.version, 
                "hash": sha256_of(ch),
            },
        } for i, ch in enumerate(chunks)]
        inserted = self.vs.upsert_texts(req.projectId, items)

        # invalidate cache for this project
        pid = str(req.projectId)
        self._project_cache.pop(pid, None)

        return {"chunks_indexed": inserted, "skipped": 0}


    def index_task(self, req: IndexEnrichedTaskRequest):
        """Save or update a task with all its details."""

        merged = " \n".join([f for f in [req.task_title, req.user_description or None] if f])
        chunks = chunk_text(merged)
        items = [{
            "id": f"task-{req.taskId}-{i}",
            "text": ch,
            "metadata": {
                "projectId": req.projectId, "type": "task",
                "taskId": req.taskId, "title": req.task_title,
                "status": req.status, "epic": req.epic,
                "ai_description": req.ai_description,
                # "version": req.version, 
                "hash": sha256_of(ch),
            },
        } for i, ch in enumerate(chunks)]
        inserted = self.vs.upsert_texts(req.projectId, items)

        # tasks changed -> invalidate cache for this project
        pid = str(req.projectId)
        self._tasks_cache.pop(pid, None)

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
    
    """
    Deterministric project retrieval
    
    """
    def get_project_by_id(self, projectId: str)-> str:
        """
        Retrieve the project chunks (deterministically) for a given projectId.
        """
        pid = str(projectId)
        if pid in self._project_cache:
            return self._project_cache[pid]

        raw = self.vs.query(
            project_id=projectId,
            query_text="",  # no semantic filter
            k=50,
            where={"type": "project"}
        )
        docs = raw.get("documents", [[]])[0]
        text = "\n".join(docs) if docs else ""
        self._project_cache[pid] = text
        return text
    

    """
    Deterministic task retrieval
    
    """

    def get_previous_tasks(self, projectId: str):
        """
        Retrieve all previously indexed task chunks under the given projectId.
        """

        pid = str(projectId)
        if pid in self._tasks_cache:
            return self._tasks_cache[pid]

        raw = self.vs.query(
            project_id=projectId,
            query_text="",  # return all
            k=50,
            where={"type": "task"}
        )
        docs = raw.get("documents", [[]])[0]
        self._tasks_cache[pid] = docs
        return docs  # return as a list of text chunks


    def delete_task(self, projectId: str, taskId: str) -> int:
        """
        Delete all RAG chunks associated with a specific task.
        """
        deleted = self.vs.delete_by_task(project_id=projectId, task_id=taskId)
        self._tasks_cache.pop(str(projectId), None)
        return deleted

    def delete_project(self, projectId: str) -> None:
        """
        Delete all RAG data associated with a specific project.
        """
        self.vs.delete_project(project_id=projectId)
        pid = str(projectId)
        self._project_cache.pop(pid, None)
        self._tasks_cache.pop(pid, None)