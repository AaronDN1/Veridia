from datetime import datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.generated_output import GeneratedOutput, OutputType
from app.models.prompt_thread import (
    PromptConversationMessage,
    PromptConversationRole,
    PromptConversationThread,
)
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.schemas.workspace import (
    PromptConversationMessageResponse,
    PromptConversationThreadResponse,
    PromptConversationThreadSummary,
)
from app.services.openai_service import create_thread_completion


HISTORY_WINDOW_DAYS = 14
RECENT_THREAD_LIMIT = 3


def build_thread_title(subject: str, prompt: str) -> str:
    trimmed_prompt = " ".join(prompt.split())
    if not trimmed_prompt:
        return subject
    preview = trimmed_prompt[:64].rstrip()
    if len(trimmed_prompt) > 64:
        preview = f"{preview}..."
    return f"{subject}: {preview}"


def build_preview(content: str, limit: int = 72) -> str:
    trimmed = " ".join(content.split())
    if len(trimmed) <= limit:
        return trimmed
    return f"{trimmed[:limit].rstrip()}..."


def serialize_thread(thread: PromptConversationThread) -> PromptConversationThreadResponse:
    ordered_messages = sorted(thread.messages, key=lambda message: message.created_at)
    return PromptConversationThreadResponse(
        id=thread.id,
        title=thread.title,
        subject=thread.subject,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        messages=[
            PromptConversationMessageResponse(
                id=message.id,
                role=message.role.value,
                content=message.content,
                created_at=message.created_at,
            )
            for message in ordered_messages
        ],
    )


def serialize_thread_summary(thread: PromptConversationThread) -> PromptConversationThreadSummary:
    latest_message = max(thread.messages, key=lambda message: message.created_at)
    return PromptConversationThreadSummary(
        id=thread.id,
        title=thread.title,
        subject=thread.subject,
        updated_at=thread.updated_at,
        latest_message_preview=build_preview(latest_message.content),
    )


def get_thread_or_404(db: Session, user: User, thread_id: UUID) -> PromptConversationThread:
    thread = (
        db.query(PromptConversationThread)
        .options(selectinload(PromptConversationThread.messages))
        .filter(PromptConversationThread.id == thread_id, PromptConversationThread.user_id == user.id)
        .first()
    )
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation thread not found.")
    return thread


def create_prompt_thread(
    db: Session,
    user: User,
    subject: str,
    prompt: str,
    uploads: list[UploadedFile],
) -> tuple[PromptConversationThread, str]:
    assistant_content = create_thread_completion(subject=subject, prompt=prompt, uploads=uploads)
    now = datetime.utcnow()
    assistant_at = now + timedelta(microseconds=1)
    thread = PromptConversationThread(
        user_id=user.id,
        subject=subject,
        title=build_thread_title(subject, prompt),
        created_at=now,
        updated_at=assistant_at,
    )
    db.add(thread)
    db.flush()

    db.add_all(
        [
            PromptConversationMessage(
                thread_id=thread.id,
                role=PromptConversationRole.USER,
                content=prompt.strip(),
                created_at=now,
            ),
            PromptConversationMessage(
                thread_id=thread.id,
                role=PromptConversationRole.ASSISTANT,
                content=assistant_content,
                created_at=assistant_at,
            ),
            GeneratedOutput(
                user_id=user.id,
                output_type=OutputType.AI_PROMPT,
                title=thread.title,
                content=assistant_content,
                created_at=assistant_at,
            ),
        ]
    )
    db.commit()
    return get_thread_or_404(db, user, thread.id), assistant_content


def continue_prompt_thread(
    db: Session,
    user: User,
    thread_id: UUID,
    prompt: str,
    uploads: list[UploadedFile],
) -> tuple[PromptConversationThread, str]:
    thread = get_thread_or_404(db, user, thread_id)
    ordered_messages = sorted(thread.messages, key=lambda message: message.created_at)
    assistant_content = create_thread_completion(
        subject=thread.subject,
        prompt=prompt,
        uploads=uploads,
        history=ordered_messages,
    )

    now = datetime.utcnow()
    assistant_at = now + timedelta(microseconds=1)
    db.add_all(
        [
            PromptConversationMessage(
                thread_id=thread.id,
                role=PromptConversationRole.USER,
                content=prompt.strip(),
                created_at=now,
            ),
            PromptConversationMessage(
                thread_id=thread.id,
                role=PromptConversationRole.ASSISTANT,
                content=assistant_content,
                created_at=assistant_at,
            ),
            GeneratedOutput(
                user_id=user.id,
                output_type=OutputType.AI_PROMPT,
                title=thread.title,
                content=assistant_content,
                created_at=assistant_at,
            ),
        ]
    )
    thread.updated_at = assistant_at
    db.commit()
    return get_thread_or_404(db, user, thread.id), assistant_content


def list_recent_threads(db: Session, user: User) -> list[PromptConversationThreadSummary]:
    threads = (
        db.query(PromptConversationThread)
        .options(selectinload(PromptConversationThread.messages))
        .filter(PromptConversationThread.user_id == user.id)
        .order_by(PromptConversationThread.updated_at.desc())
        .limit(RECENT_THREAD_LIMIT)
        .all()
    )
    return [serialize_thread_summary(thread) for thread in threads if thread.messages]


def list_history_threads(db: Session, user: User) -> list[PromptConversationThreadSummary]:
    cutoff = datetime.utcnow() - timedelta(days=HISTORY_WINDOW_DAYS)
    threads = (
        db.query(PromptConversationThread)
        .options(selectinload(PromptConversationThread.messages))
        .filter(PromptConversationThread.user_id == user.id, PromptConversationThread.updated_at >= cutoff)
        .order_by(PromptConversationThread.updated_at.desc())
        .all()
    )
    return [serialize_thread_summary(thread) for thread in threads if thread.messages]
