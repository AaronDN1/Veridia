from fastapi import APIRouter

from app.api.routes import admin, analytics, auth, billing, graphing, usage, workspace


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["workspace"])
api_router.include_router(graphing.router, prefix="/graphing", tags=["graphing"])
api_router.include_router(usage.router, prefix="/usage", tags=["usage"])
