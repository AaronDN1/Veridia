from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import PlanType, User
from app.services.auth import decode_session_token
from app.services.usage import get_or_create_daily_usage


def get_current_user(
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    try:
        payload = decode_session_token(session_token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session.") from exc

    user = db.query(User).filter(User.id == UUID(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    if settings.beta_free_mode:
        return user

    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if subscription and subscription.status in {
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIALING,
        SubscriptionStatus.PAST_DUE,
    }:
        user.plan_type = PlanType.UNLIMITED
    else:
        user.plan_type = PlanType.FREE
    db.commit()
    return user


def build_user_response(db: Session, user: User) -> dict:
    usage = get_or_create_daily_usage(db, user)
    is_unlimited = user.is_unlimited or user.plan_type == PlanType.UNLIMITED
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "plan_type": PlanType.FREE.value if settings.beta_free_mode else user.plan_type.value,
        "active_subscription": False if settings.beta_free_mode else is_unlimited,
        "daily_usage_count": usage.total_uses,
        "daily_usage_limit": settings.free_daily_limit if settings.beta_free_mode else (None if is_unlimited else settings.free_daily_limit),
        "created_at": user.created_at,
    }
