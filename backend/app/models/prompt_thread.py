import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PromptConversationRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class PromptConversationThread(Base):
    __tablename__ = "prompt_conversation_threads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    subject: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="prompt_threads")
    messages = relationship(
        "PromptConversationMessage",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="PromptConversationMessage.created_at",
    )


class PromptConversationMessage(Base):
    __tablename__ = "prompt_conversation_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prompt_conversation_threads.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[PromptConversationRole] = mapped_column(Enum(PromptConversationRole))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    thread = relationship("PromptConversationThread", back_populates="messages")
