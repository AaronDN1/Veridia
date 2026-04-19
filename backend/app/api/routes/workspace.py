from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.generated_output import GeneratedOutput
from app.models.uploaded_file import UploadPurpose, UploadedFile
from app.schemas.workspace import (
    DashboardResponse,
    LabHelperRequest,
    PromptContinueRequest,
    PromptConversationThreadResponse,
    PromptConversationThreadSummary,
    PromptRequest,
    PromptResponse,
    ToolTextResponse,
)
from app.services.files import save_upload, upload_to_response
from app.services.graphing import cleanup_expired_graphs
from app.services.openai_service import generate_lab_report
from app.services.prompt_threads import (
    continue_prompt_thread,
    create_prompt_thread,
    delete_prompt_thread,
    get_thread_or_404,
    list_history_threads,
    list_recent_threads,
    serialize_thread,
)
from app.services.usage import ensure_usage_available, record_usage


router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)):
    cleanup_expired_graphs(db, user)
    recent_outputs = (
        db.query(GeneratedOutput)
        .filter(GeneratedOutput.user_id == user.id)
        .order_by(GeneratedOutput.created_at.desc())
        .limit(6)
        .all()
    )
    uploads = (
        db.query(UploadedFile)
        .filter(UploadedFile.user_id == user.id)
        .order_by(UploadedFile.created_at.desc())
        .limit(8)
        .all()
    )
    return {
        "recent_outputs": [
            {
                "id": output.id,
                "title": output.title,
                "output_type": output.output_type.value,
                "created_at": output.created_at,
            }
            for output in recent_outputs
        ],
        "uploaded_files": [upload_to_response(upload) for upload in uploads],
    }


@router.post("/upload")
def upload_file(
    purpose: UploadPurpose = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = save_upload(db, user, file, purpose)
    return upload_to_response(upload)


@router.post("/prompt", response_model=PromptResponse)
def prompt_tool(payload: PromptRequest, request: Request, user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_usage_available(db, user)
    uploads = db.query(UploadedFile).filter(UploadedFile.user_id == user.id, UploadedFile.id.in_(payload.file_ids)).all()
    try:
        if payload.thread_id:
            thread, content = continue_prompt_thread(
                db,
                user,
                payload.thread_id,
                payload.prompt,
                uploads,
                session_id=request.headers.get("x-sigma-session-id"),
            )
        else:
            thread, content = create_prompt_thread(
                db,
                user,
                payload.subject,
                payload.prompt,
                uploads,
                session_id=request.headers.get("x-sigma-session-id"),
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI request failed. Please try again.") from exc
    usage_remaining = record_usage(db, user, "ai_prompt")
    return {"content": content, "usage_remaining": usage_remaining, "thread": serialize_thread(thread)}


@router.post("/prompt/threads", response_model=PromptResponse)
def create_prompt_thread_route(payload: PromptRequest, request: Request, user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_usage_available(db, user)
    uploads = db.query(UploadedFile).filter(UploadedFile.user_id == user.id, UploadedFile.id.in_(payload.file_ids)).all()
    try:
        thread, content = create_prompt_thread(
            db,
            user,
            payload.subject,
            payload.prompt,
            uploads,
            session_id=request.headers.get("x-sigma-session-id"),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI request failed. Please try again.") from exc
    usage_remaining = record_usage(db, user, "ai_prompt")
    return {"content": content, "usage_remaining": usage_remaining, "thread": serialize_thread(thread)}


@router.post("/prompt/threads/{thread_id}/messages", response_model=PromptResponse)
def continue_prompt_thread_route(
    thread_id: UUID,
    payload: PromptContinueRequest,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_usage_available(db, user)
    uploads = db.query(UploadedFile).filter(UploadedFile.user_id == user.id, UploadedFile.id.in_(payload.file_ids)).all()
    try:
        thread, content = continue_prompt_thread(
            db,
            user,
            thread_id,
            payload.prompt,
            uploads,
            session_id=request.headers.get("x-sigma-session-id"),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI request failed. Please try again.") from exc
    usage_remaining = record_usage(db, user, "ai_prompt")
    return {"content": content, "usage_remaining": usage_remaining, "thread": serialize_thread(thread)}


@router.get("/prompt/threads/recent", response_model=list[PromptConversationThreadSummary])
def recent_prompt_threads(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return list_recent_threads(db, user)


@router.get("/prompt/threads/history", response_model=list[PromptConversationThreadSummary])
def prompt_thread_history(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return list_history_threads(db, user)


@router.get("/prompt/threads/{thread_id}", response_model=PromptConversationThreadResponse)
def get_prompt_thread(thread_id: UUID, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_thread(get_thread_or_404(db, user, thread_id))


@router.delete("/prompt/threads/{thread_id}")
def delete_prompt_thread_route(thread_id: UUID, user=Depends(get_current_user), db: Session = Depends(get_db)):
    delete_prompt_thread(db, user, thread_id)
    return {"success": True}


@router.get("/uploads/{upload_id}/file/{stored_name}")
def download_upload_file(
    upload_id: UUID,
    stored_name: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(UploadedFile).filter(UploadedFile.id == upload_id, UploadedFile.user_id == user.id).first()
    if not upload or upload.stored_name != stored_name:
        raise HTTPException(status_code=404, detail="File not found.")

    path = Path(upload.file_path).resolve()
    upload_root = settings.upload_dir.resolve()
    if upload_root not in path.parents or not path.exists():
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(path, filename=upload.original_name, media_type=upload.mime_type)


@router.post("/lab-helper", response_model=ToolTextResponse)
def lab_helper_tool(payload: LabHelperRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_usage_available(db, user)
    uploads = db.query(UploadedFile).filter(UploadedFile.user_id == user.id, UploadedFile.id.in_(payload.file_ids)).all()
    content = generate_lab_report(db, user, payload, uploads)
    usage_remaining = record_usage(db, user, "lab_helper")
    return {"content": content, "usage_remaining": usage_remaining}
