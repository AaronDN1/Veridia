from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import AdminUserOverrideUpdate, AdminUserSummary
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


@router.patch("/users/{user_id}", response_model=AdminUserSummary)
def update_user_manual_override(
    user_id: UUID,
    payload: AdminUserOverrideUpdate,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_unlimited = payload.manual_unlimited_override
    db.commit()
    db.refresh(user)
    return serialize_admin_user(db, user)
