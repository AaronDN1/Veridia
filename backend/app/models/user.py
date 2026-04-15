import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PlanType(str, enum.Enum):
    FREE = "free"
    UNLIMITED = "unlimited"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    plan_type: Mapped[PlanType] = mapped_column(Enum(PlanType), default=PlanType.FREE)
    is_unlimited: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    identities = relationship("OAuthIdentity", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    daily_usage = relationship("DailyUsage", back_populates="user", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="user", cascade="all, delete-orphan")
    outputs = relationship("GeneratedOutput", back_populates="user", cascade="all, delete-orphan")
    prompt_threads = relationship("PromptConversationThread", back_populates="user", cascade="all, delete-orphan")
