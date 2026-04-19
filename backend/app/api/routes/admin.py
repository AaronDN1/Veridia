from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.feedback import FeedbackSubmission
from app.models.user import AccountStatus, User
from app.schemas.admin import AdminFeedbackSummary, AdminUserOverrideUpdate, AdminUserSummary
from app.services.access import (
    get_effective_access_source,
    get_effective_access_status,
    has_manual_unlimited_override,
    has_paid_unlimited_access,
)


router = APIRouter()


def serialize_admin_user(db: Session, user: User) -> AdminUserSummary:
    return AdminUserSummary(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        account_status=user.account_status,
        effective_access_status=get_effective_access_status(db, user),
        effective_access_source=get_effective_access_source(db, user),
        manual_unlimited_override=has_manual_unlimited_override(user),
        paid_unlimited_access=has_paid_unlimited_access(db, user),
        created_at=user.created_at,
    )


@router.get("/users", response_model=list[AdminUserSummary])
def list_users(_: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [serialize_admin_user(db, user) for user in users]


@router.get("/feedback", response_model=list[AdminFeedbackSummary])
def list_feedback(_: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    feedback_items = db.query(FeedbackSubmission).order_by(FeedbackSubmission.created_at.desc()).all()
    return [
        AdminFeedbackSummary(
            id=item.id,
            user_id=item.user_id,
            submitter_email=item.submitter_email,
            subject=item.subject,
            body=item.body,
            created_at=item.created_at,
        )
        for item in feedback_items
    ]


@router.patch("/users/{user_id}", response_model=AdminUserSummary)
def update_user_manual_override(
    user_id: UUID,
    payload: AdminUserOverrideUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.manual_unlimited_override is None and payload.account_status is None:
        raise HTTPException(status_code=400, detail="No user update provided.")

    if payload.account_status is not None:
        allowed_statuses = {status.value for status in AccountStatus}
        if payload.account_status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid account status.")
        if user.id == admin_user.id and payload.account_status != AccountStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="You cannot suspend or terminate your own admin account.")
        user.account_status = payload.account_status

    if payload.manual_unlimited_override is not None:
        user.is_unlimited = payload.manual_unlimited_override

    db.commit()
    db.refresh(user)
    return serialize_admin_user(db, user)
