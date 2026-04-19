import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.services.analytics import (
    capture_analytics_event,
    get_request_feature_name,
    get_request_session_id,
    get_request_user_id,
)
from app.db.session import create_db_and_tables


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.middleware("http")
async def analytics_middleware(request: Request, call_next):
    started_at = time.perf_counter()
    request_path = request.url.path

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = int((time.perf_counter() - started_at) * 1000)
        if request_path.startswith("/api") and not request_path.startswith("/api/analytics"):
            user_id = get_request_user_id(request)
            capture_analytics_event(
                "api_call_failed",
                distinct_id=user_id,
                properties={
                    "user_id": user_id,
                    "session_id": get_request_session_id(request),
                    "feature_name": get_request_feature_name(request),
                    "method": request.method,
                    "path": request_path,
                    "response_time_ms": duration_ms,
                    "error_type": "unhandled_exception",
                    "source": "backend",
                },
            )
        raise

    duration_ms = int((time.perf_counter() - started_at) * 1000)

    if request_path.startswith("/api") and not request_path.startswith("/api/analytics"):
        user_id = get_request_user_id(request)
        shared_properties = {
            "user_id": user_id,
            "session_id": get_request_session_id(request),
            "feature_name": get_request_feature_name(request),
            "method": request.method,
            "path": request_path,
            "status_code": response.status_code,
            "response_time_ms": duration_ms,
            "source": "backend",
        }

        if response.status_code >= 400:
            capture_analytics_event(
                "api_call_failed",
                distinct_id=user_id,
                properties={**shared_properties, "error_type": f"http_{response.status_code}"},
            )

        if duration_ms >= settings.analytics_slow_request_ms:
            capture_analytics_event(
                "api_call_slow",
                distinct_id=user_id,
                properties=shared_properties,
            )

    return response


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
