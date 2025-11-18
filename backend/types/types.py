from __future__ import annotations
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator

TaskStatus = Literal["created", "todo", "in_progress", "in_review", "done", "archived"]

class IndexProjectRequest(BaseModel):
    projectId: Optional[str] = None
    userId: str
    name: str
    description: str
    status: Optional[str] = None
    # version: int = 1

class EditProjectRequest(BaseModel):
    projectId: str
    userId: str
    name: str | None = None
    description: str | None = None

    @model_validator(mode='after')
    def check_fields(cls, values):
        if not values.name and not values.description:
            raise ValueError("Either 'name' or 'description' must be provided.")
        return values 

class DeleteProjectRequest(BaseModel):
    projectId: str
    userId: str

class IndexTaskRequest(BaseModel):
    userId: str
    projectId: str
    taskId: Optional[str] = None
    task_title: str
    user_description: str
    epic: Optional[str] = None
    status: TaskStatus = "created"
    selected_model: int
    # version: int = 1

class IndexEnrichedTaskRequest(BaseModel):
    projectId: str
    taskId: Optional[str] = None
    task_title: str
    user_description: str
    ai_description: str
    epic: Optional[str] = None
    status: Optional[str] = None
    story_points: int


class EditEnrichedTaskRequest(BaseModel):
    projectId: str
    taskId: str
    task_title: str | None = None
    user_description: str | None = None
    ai_description: str | None = None
    userId: str

    @model_validator(mode='after')
    def check_fields(cls, values):
        if not values.task_title and not values.user_description and not values.ai_description:
            raise ValueError("Either 'task title' or 'user description' or 'ai description' must be provided.")
        return values 


class DeleteEnrichedTaskRequest(BaseModel):
    projectId: str
    taskId: str


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
    userId: str
    projectId: str
    task_title: str
    user_description: str
    selected_model: int
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

class ProjectHandbookRequest(BaseModel):
    userId: str
    projectId: str
    selected_model: int = 1  # TODO make this dynamic
