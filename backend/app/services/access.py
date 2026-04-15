from sqlalchemy.orm import Session

from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import PlanType, User
from app.core.config import settings


UNLIMITED_SUBSCRIPTION_STATUSES = {
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.PAST_DUE,
}


def normalize_email(value: str | None) -> str:
    return value.strip().lower() if value else ""


def is_admin_email(email: str | None) -> bool:
    admin_email = normalize_email(settings.admin_email)
    return bool(admin_email) and normalize_email(email) == admin_email


def has_manual_unlimited_override(user: User) -> bool:
    return bool(user.is_unlimited)


def has_paid_unlimited_access(db: Session, user: User) -> bool:
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if subscription and subscription.status in UNLIMITED_SUBSCRIPTION_STATUSES:
        return True
    return user.plan_type == PlanType.UNLIMITED


def has_effective_unlimited_access(db: Session, user: User) -> bool:
    return has_manual_unlimited_override(user) or has_paid_unlimited_access(db, user)


def get_effective_access_status(db: Session, user: User) -> str:
    return "unlimited" if has_effective_unlimited_access(db, user) else "public_beta"


def get_effective_access_source(db: Session, user: User) -> str:
    if has_manual_unlimited_override(user):
        return "manual_override"
    if has_paid_unlimited_access(db, user):
        return "paid_unlimited"
    return "public_beta"
