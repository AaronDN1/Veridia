import base64
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.uploaded_file import UploadPurpose, UploadedFile
from app.models.user import User

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_UPLOAD_SUFFIXES = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".txt", ".md", ".csv"}


def _validate_upload(file: UploadFile) -> tuple[str, bytes]:
    suffix = Path(file.filename or "upload").suffix.lower()
    mime_type = (file.content_type or "application/octet-stream").lower()
    if suffix not in ALLOWED_UPLOAD_SUFFIXES and not mime_type.startswith(("image/", "text/")) and "pdf" not in mime_type:
        raise HTTPException(status_code=415, detail="Unsupported file type.")

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file is too large.")
    return suffix, content


def save_upload(db: Session, user: User, file: UploadFile, purpose: UploadPurpose) -> UploadedFile:
    suffix, content = _validate_upload(file)
    stored_name = f"{uuid.uuid4()}{suffix}"
    destination = settings.upload_dir / stored_name

    with destination.open("wb") as output:
        output.write(content)

    upload = UploadedFile(
        user_id=user.id,
        purpose=purpose,
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        mime_type=file.content_type or "application/octet-stream",
        file_path=str(destination),
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


def upload_to_response(upload: UploadedFile) -> dict[str, str]:
    return {
        "id": str(upload.id),
        "original_name": upload.original_name,
        "mime_type": upload.mime_type,
        "url": f"{settings.api_url}/api/workspace/uploads/{upload.id}/file/{upload.stored_name}",
    }


def extract_file_context(upload: UploadedFile) -> dict[str, str]:
    path = Path(upload.file_path)
    mime = upload.mime_type.lower()

    if "pdf" in mime:
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return {"type": "text", "text": text[:15000]}

    if mime.startswith("text/"):
        return {"type": "text", "text": path.read_text(encoding="utf-8", errors="ignore")[:15000]}

    if mime.startswith("image/"):
        encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
        return {"type": "image", "data_url": f"data:{upload.mime_type};base64,{encoded}"}

    return {"type": "text", "text": f"Uploaded file: {upload.original_name} ({upload.mime_type})."}
