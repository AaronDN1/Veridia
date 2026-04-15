from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import PlanType
from app.schemas.usage import UsageStatusResponse
from app.services.access import has_effective_unlimited_access
from app.services.usage import get_or_create_daily_usage


router = APIRouter()


@router.get("/status", response_model=UsageStatusResponse)
def usage_status(user=Depends(get_current_user), db: Session = Depends(get_db)):
    usage = get_or_create_daily_usage(db, user)
    if has_effective_unlimited_access(db, user):
        return {
            "plan_type": PlanType.UNLIMITED.value,
            "total_used_today": usage.total_uses,
            "daily_limit": None,
            "remaining_today": None,
        }
    return {
        "plan_type": PlanType.FREE.value if settings.beta_free_mode else user.plan_type.value,
        "total_used_today": usage.total_uses,
        "daily_limit": settings.free_daily_limit,
        "remaining_today": max(settings.free_daily_limit - usage.total_uses, 0),
    }
