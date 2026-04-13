import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.schemas.billing import CheckoutSessionRequest, CheckoutSessionResponse
from app.services.billing import create_checkout_session, ensure_customer, sync_subscription_from_stripe


router = APIRouter()


@router.post("/checkout", response_model=CheckoutSessionResponse)
def start_checkout(
    payload: CheckoutSessionRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.beta_free_mode:
        raise HTTPException(status_code=403, detail="Checkout is disabled while Sigma Solve is in public beta mode.")
    ensure_customer(db, user)
    checkout_url = create_checkout_session(
        user,
        success_url=f"{settings.app_url}{payload.success_path}",
        cancel_url=f"{settings.app_url}{payload.cancel_path}",
    )
    return {"checkout_url": checkout_url}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    body = await request.body()
    try:
        event = stripe.Webhook.construct_event(body, stripe_signature, settings.stripe_webhook_secret)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook.") from exc

    if event["type"] in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        sync_subscription_from_stripe(db, event["data"]["object"])

    return {"received": True}
