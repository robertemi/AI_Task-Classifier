from __future__ import annotations
import json
from backend.types.types import (
    IndexEnrichedTaskRequest,
    EditEnrichedTaskRequest,
    DeleteEnrichedTaskRequest
)

from backend.rag.retriever import RAGService
from backend.core.config import get_supabase_client
from backend.core.config import get_redis_client


class TaskService:

    def __init__(self):
        self._rag = RAGService()
        self._supabase_client = None
        self._redis_client = None

    async def ensure_clients(self):
        if self._supabase_client is None:
            self._supabase_client = await get_supabase_client()
        if self._redis_client is None:
            self._redis_client = await get_redis_client()
        

    async def create_task(self, req: IndexEnrichedTaskRequest):
        await self.ensure_clients()
        try:
            response = (
                self._supabase_client
                .table("tasks")
                .insert(
                    {
                        "project_id": req.projectId,
                        "title": req.task_title,
                        "description": req.user_description,
                        "ai_description": req.ai_description,
                        "story_points": req.story_points,
                        "status": req.status,
                    }
                )
            )

            response = await response.execute()

            if response.data:
                new_id = response.data[0]["id"]

                # save newly created task in RAG
                self._rag.index_task(
                    IndexEnrichedTaskRequest(
                        taskId=new_id,
                        projectId=req.projectId,
                        task_title=req.task_title,
                        user_description=req.user_description,
                        ai_description=req.ai_description,
                        epic=req.epic,
                        status=req.status,
                        story_points=req.story_points
                    )
                )

                # cache newly created task
                cache_key = f'project:{req.projectId}:tasks'
                new_task_entry = {
                    "taskId": new_id,
                    "title": req.task_title,
                    "user_description": req.user_description or "",
                    "ai_description": req.ai_description or "",
                    "text": "\n".join([
                        req.task_title,
                        req.user_description or "",
                        req.ai_description or ""
                    ]).strip(),
                    "story_points": req.story_points
                }

                # get previously cached tasks
                cached = await self._redis_client.get(cache_key)

                if cached:
                    try:
                        tasks = json.loads(cached)
                    except json.JSONDecodeError:
                        # first task to be cached
                        tasks = []
                else:
                    tasks = []

                # append and re-cache
                tasks.append(new_task_entry)
                await self._redis_client.set(cache_key, json.dumps(tasks), ex=1800)

                return True

            print("Insert task failed")
            return False

        except Exception as e:
            print(f"Unhandled exception in insert task: {e}")
            return False

    # it doesn't overwrite the id/project_id in update data. After DB update -> it will call _rag.index_task with the latest row.
    # index_task uses upsert -> RAG is updated.
    async def update_task(self, req: EditEnrichedTaskRequest):
        from backend.model.model import enrich_edited_task  # local import avoids circular init
        await self.ensure_clients()
        try:
                needs_ai_regeneration = bool(req.task_title or req.user_description)
                new_ai_description, new_ai_story_points = None, None

                if needs_ai_regeneration:
                    new_ai_description, new_ai_story_points = await enrich_edited_task(
                        taskId=req.taskId,
                        projectId=req.projectId,
                        user_id=req.userId,
                        new_task_title=req.task_title,
                        new_task_user_description=req.user_description
                    )

                # Only update provided fields
                update_data = {
                    **({"title": req.task_title} if req.task_title else {}),
                    **({"description": req.user_description} if req.user_description else {}),
                    **(
                        {"ai_description": new_ai_description}
                        if needs_ai_regeneration
                        else ({"ai_description": req.ai_description} if req.ai_description else {})
                    ),
                    **({"story_points": new_ai_story_points} if needs_ai_regeneration else {}),
                }


                if not update_data:
                    print("No fields to update for task", req.taskId)
                    return False

                response = (
                    self._supabase_client
                    .table("tasks")
                    .update(update_data)
                    .match({
                        "id": req.taskId,
                        "project_id": req.projectId
                    })
                )

                response = await response.execute()

                if response.data and len(response.data) > 0:
                    row = response.data[0]
                    # Re-sync updated task in RAG
                    self._rag.index_task(
                        IndexEnrichedTaskRequest(
                            taskId=row["id"],
                            projectId=row["project_id"],
                            task_title=row.get("title", ""),
                            user_description=row.get("description", "") or "",
                            ai_description=row.get("ai_description", "") or "",
                            epic=row.get("epic"),
                            story_points=int(row.get("story_points", "")) or 0,
                            status=row.get("status"),
                        )
                    )

                    # cache edited task
                    cache_key = f'project:{req.projectId}:tasks'
                    # get previously cached tasks
                    cached = await self._redis_client.get(cache_key)
                    tasks = json.loads(cached) if cached else []

                    new_task_entry = {
                        "taskId": req.taskId,
                        "title": row.get("title", req.task_title or ""),
                        "user_description": row.get("description", req.user_description or ""),
                        "ai_description": row.get("ai_description", req.ai_description or ""),
                    }
                    new_task_entry['text'] = "\n".join([
                        new_task_entry['title'],
                        new_task_entry['user_description'],
                        new_task_entry['ai_description'],
                    ]).strip()

                    task_id = str(req.taskId).strip()

                    for i, t in enumerate(tasks):
                        cached_id = str(t.get("taskId")).strip() if t.get("taskId") else ""
                        if cached_id == task_id:
                            tasks[i] = new_task_entry
                    
                            break
                    else:
                        tasks.append(new_task_entry)

                    await self._redis_client.set(cache_key, json.dumps(tasks), ex=1800)
                    return True

                print(f"Update task {req.taskId} or User has no permission on given task")
                return False                

        except Exception as e:
            print(f"Unhandled exception in update task: {e}")
            return False

    
    # delete in DB -> delete in RAG
    async def delete_task(self, req: DeleteEnrichedTaskRequest):
        await self.ensure_clients()
        try:
            response = (
                self._supabase_client
                .table("tasks")
                .delete()
                .match({
                    "id": req.taskId,
                    "project_id": req.projectId
                })
            )

            response = await response.execute()

            print("delete_task supabase response:", response)

            if response.data and len(response.data) > 0:
                self._rag.delete_task(
                    projectId=req.projectId,
                    taskId=req.taskId
                )

                cache_key = f'project:{req.projectId}:tasks'
                deleted_task_id = req.taskId

                cached = await self._redis_client.get(cache_key)
                if cached:
                    try:
                        tasks = json.loads(cached)
                    except json.JSONDecodeError:
                        tasks = []

                    # filter out deleted task
                    updated_tasks = [t for t in tasks if t.get('taskId') != deleted_task_id]

                    if updated_tasks:
                        # if other tasks exist other than the deleted one cache them
                        await self._redis_client.set(cache_key, json.dumps(updated_tasks), ex=1800)
                    else:
                        # deleted task is the only task
                        await self._redis_client.delete(cache_key)

                return True

            print(f"Delete task {req.taskId} failed: not found")
            return False

        except Exception as e:
            print(f"Unhandled exception in delete task: {e}")
            return False
