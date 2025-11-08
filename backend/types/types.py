from __future__ import annotations
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

TaskStatus = Literal["created", "todo", "in_progress", "in_review", "done", "archived"]

class IndexProjectRequest(BaseModel):
    projectId: Optional[str] = None
    userId: str
    name: str
    description: str
    status: Optional[str] = None
    # version: int = 1

class IndexTaskRequest(BaseModel):
    projectId: Optional[str] = None
    taskId: Optional[str] = None
    task_title: str
    user_description: str
    epic: Optional[str] = None
    status: TaskStatus = "created"
    # version: int = 1

class IndexEnrichedTaskRequest(BaseModel):
    projectId: str
    taskId: Optional[str] = None
    task_title: str
    user_description: str
    ai_description: str
    epic: Optional[str] = None
    status: Optional[str] = None

class RetrieveRequest(BaseModel):
    projectId: str
    title: str
    user_description: str
    epic: Optional[str] = None

class ContextChunk(BaseModel):
    doc_id: str
    text: str
    type: Literal["project", "task"]
    taskId: Optional[str]
    status: Optional[TaskStatus] = None
    epic: Optional[str] = None
    title: Optional[str] = None

class RetrieveResponse(BaseModel):
    contexts: List[ContextChunk]
    retrieval_stats: Dict[str, object]

class EnrichTaskRequest(BaseModel):
    taskId: Optional[str] = None
    projectId: str
    task_title: str
    user_description: str
    # expected_version: int

class EnrichResult(BaseModel):
    ai_description: str
    story_points: int = Field(..., description="One of {1,2,3,5,8,13}")
    # confidence: float = 0.0
    used_context_ids: List[str] = Field(default_factory=list),
    used_context_text: str


class IndexResponse(BaseModel):
    ok: bool
    data: Optional[Dict[str, Any]] = None
    detail: Optional[str] = None
