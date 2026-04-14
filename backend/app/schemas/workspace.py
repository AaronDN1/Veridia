from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UploadedFileResponse(BaseModel):
    id: UUID
    original_name: str
    mime_type: str
    url: str


class PromptRequest(BaseModel):
    subject: str
    prompt: str = Field(min_length=3)
    file_ids: list[UUID] = Field(default_factory=list)
    thread_id: UUID | None = None


class PromptConversationMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime


class PromptConversationThreadSummary(BaseModel):
    id: UUID
    title: str
    subject: str
    updated_at: datetime
    latest_message_preview: str


class PromptConversationThreadResponse(BaseModel):
    id: UUID
    title: str
    subject: str
    created_at: datetime
    updated_at: datetime
    messages: list[PromptConversationMessageResponse]


class PromptContinueRequest(BaseModel):
    prompt: str = Field(min_length=3)
    file_ids: list[UUID] = Field(default_factory=list)


class ToolTextResponse(BaseModel):
    content: str
    usage_remaining: int | None


class PromptResponse(ToolTextResponse):
    thread: PromptConversationThreadResponse


class LabHelperRequest(BaseModel):
    subject: str
    lab_title: str
    description: str
    observations: str = ""
    methods: str = ""
    results: str = ""
    notes: str = ""
    file_ids: list[UUID] = Field(default_factory=list)


class GraphSeries(BaseModel):
    x: list[float]
    y: list[float]
    label: str | None = None


class GraphRequest(BaseModel):
    title: str
    x_label: str = "x"
    y_label: str = "y"
    graph_type: str = "line"
    equation: str | None = None
    x_min: float = -10
    x_max: float = 10
    sample_count: int = 200
    series: list[GraphSeries] = Field(default_factory=list)


class GraphResponse(BaseModel):
    image_url: str
    download_url: str
    usage_remaining: int | None


class OutputSummary(BaseModel):
    id: UUID
    title: str
    output_type: str
    created_at: datetime


class DashboardResponse(BaseModel):
    recent_outputs: list[OutputSummary]
    uploaded_files: list[UploadedFileResponse]
