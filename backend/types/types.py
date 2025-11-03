from __future__ import annotations
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field

TaskStatus = Literal["created", "todo", "in_progress", "in_review", "done", "archived"]

class IndexProjectRequest(BaseModel):
    projectId: Optional[int] = None
    userId: int
    name: str
    description: str
    status: TaskStatus = "todo"
    # version: int = 1

class IndexTaskRequest(BaseModel):
    projectId: int
    taskId: Optional[int] = None
    title: str
    user_description: str
    ai_description: Optional[str] = None
    epic: Optional[str] = None
    status: TaskStatus = "todo"
    # version: int = 1

class RetrieveRequest(BaseModel):
    projectId: int
    title: str
    user_description: str
    epic: Optional[str] = None

class ContextChunk(BaseModel):
    doc_id: str
    text: str
    type: Literal["project", "task"]
    taskId: Optional[int] = None
    status: Optional[TaskStatus] = None
    epic: Optional[str] = None
    title: Optional[str] = None

class RetrieveResponse(BaseModel):
    contexts: List[ContextChunk]
    retrieval_stats: Dict[str, object]

class EnrichTaskRequest(BaseModel):
    taskId: int
    expected_version: int

class EnrichResult(BaseModel):
    ai_description: str
    story_points: int = Field(..., description="One of {1,2,3,5,8,13}")
    confidence: float = 0.0
    used_context_ids: List[str] = Field(default_factory=list)
