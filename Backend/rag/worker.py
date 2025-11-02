from __future__ import annotations
from fastapi import BackgroundTasks
from .retriever import RAGService
from .model_provider import ModelProvider
from .types import EnrichTaskRequest, IndexTaskRequest, RetrieveRequest

class EnrichmentWorker:
    """
    Background worker that asks the AI to improve (enrich) tasks.

    It runs in the background so the main app stays fast.
    """
    def __init__(self, rag: RAGService, model: ModelProvider):
        self.rag = rag
        self.model = model
        # TODO the database will be added here.
    def enqueue(self, bt: BackgroundTasks, req: EnrichTaskRequest, task_snapshot: IndexTaskRequest):
        """
        Schedule the enrichment job in FastAPI's background task system.
        """
        bt.add_task(self._run, req, task_snapshot)

    async def _run(self, req: EnrichTaskRequest, task_snapshot: IndexTaskRequest):
        """
        Main background job.

        1. Check if the task version is still current.
        2. Retrieve context (similar text from memory).
        3. Ask the model for AI-generated description and story points.
        4. Save the improved task back to the memory.
        """
         # Version guard (MVP: compare to snapshot)
        if req.expected_version != task_snapshot.version:
            return  # Skip outdated task

        # Step 1: Retrieve contexts, related info
        res = self.rag.retrieve(RetrieveRequest(
            projectId=task_snapshot.projectId,
            title=task_snapshot.title,
            user_description=task_snapshot.user_description,
            epic=task_snapshot.epic
        ))

        # Step 2: Call the AI model
        result = self.model.call(task_snapshot.title, task_snapshot.user_description, res.contexts)

        # Step 3: Save enriched data (temporary version, no real DB yet)
        enriched = IndexTaskRequest(
            **task_snapshot.model_dump(exclude_none=True),
            ai_description=result.ai_description
        )
        self.rag.index_task(enriched)

        # Step 4: TODO: persist ai_description, story_points, confidence,
        #  todo -> used_context_ids, enrichment_status='done' to Postgres.
