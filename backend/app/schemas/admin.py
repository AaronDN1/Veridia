from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AdminUserSummary(BaseModel):
    id: UUID
    email: str
    full_name: str
    account_status: str
    effective_access_status: str
    effective_access_source: str
    manual_unlimited_override: bool
    paid_unlimited_access: bool
    created_at: datetime


class AdminUserOverrideUpdate(BaseModel):
    manual_unlimited_override: bool | None = None
    account_status: str | None = None


class AdminFeedbackSummary(BaseModel):
    id: UUID
    user_id: UUID | None
    submitter_email: str | None
    subject: str
    body: str
    created_at: datetime
