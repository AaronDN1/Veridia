from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import build_user_response, ensure_account_is_active, get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.feedback import FeedbackSubmission
from app.schemas.auth import GoogleSignInRequest, SessionResponse
from app.services.analytics import capture_analytics_event
from app.services.auth import create_session_token, get_or_create_user_from_google, verify_google_credential


router = APIRouter()


@router.post("/google", response_model=SessionResponse)
def google_sign_in(payload: GoogleSignInRequest, response: Response, db: Session = Depends(get_db)):
    try:
        claims = verify_google_credential(payload.credential)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google sign-in failed.") from exc

    try:
        user, _ = get_or_create_user_from_google(
            db,
            claims,
            accepted_terms=payload.accepted_terms,
            accepted_privacy=payload.accepted_privacy,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    ensure_account_is_active(user)
    token = create_session_token(user)
    capture_analytics_event(
        "user_signed_in",
        distinct_id=str(user.id),
        properties={
            "user_id": str(user.id),
            "auth_provider": "google",
        },
    )
    cookie_domain = settings.session_cookie_domain or None
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.resolved_session_cookie_secure,
        samesite=settings.resolved_session_cookie_samesite,
        domain=cookie_domain,
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return {"user": build_user_response(db, user)}


@router.get("/session", response_model=SessionResponse)
def get_session(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {"user": build_user_response(db, user)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(settings.session_cookie_name, domain=settings.session_cookie_domain or None, path="/")
    return {"success": True}


@router.delete("/account")
def delete_account(response: Response, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(FeedbackSubmission).filter(FeedbackSubmission.user_id == user.id).update(
        {FeedbackSubmission.user_id: None},
        synchronize_session=False,
    )
    db.delete(user)
    db.commit()
    response.delete_cookie(settings.session_cookie_name, domain=settings.session_cookie_domain or None, path="/")
    return {"success": True}
