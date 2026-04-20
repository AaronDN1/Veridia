from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_ROOT = BASE_DIR / "storage"


def _is_local_url(value: str) -> bool:
    normalized = value.strip().lower()
    return "localhost" in normalized or "127.0.0.1" in normalized


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Sigma Solve API"
    environment: str = "development"
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
    server_host: str | None = None
    port: int = Field(default=8000, alias="PORT")
    secret_key: str = "change-me"
    database_url: str
    backend_cors_origins: list[str] | str = Field(default_factory=lambda: ["http://localhost:3000"])
    google_client_id: str
    google_client_secret: str = ""
    openai_api_key: str
    openai_model: str = "gpt-4.1-mini"
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_price_id: str
    session_cookie_name: str = "sigma_solve_session"
    session_cookie_secure: bool | None = None
    session_cookie_samesite: Literal["lax", "strict", "none"] | None = None
    session_cookie_domain: str | None = None
    admin_email: str = "adnathans@gmail.com"
    beta_free_mode: bool = False
    storage_mode: Literal["ephemeral", "persistent"] = "ephemeral"
    storage_root: Path = STORAGE_ROOT
    upload_dir: Path = STORAGE_ROOT / "uploads"
    graphs_dir: Path = STORAGE_ROOT / "graphs"
    free_daily_limit: int = 20
    analytics_enabled: bool = False
    posthog_host: str = "https://us.i.posthog.com"
    posthog_project_api_key: str = ""
    analytics_slow_request_ms: int = 4000

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, list):
            return [item.strip().rstrip("/") for item in value if item.strip()]
        return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]

    @field_validator("environment", mode="before")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("app_url", "api_url", mode="before")
    @classmethod
    def normalize_urls(cls, value: str) -> str:
        return value.strip().rstrip("/") if isinstance(value, str) else value

    @field_validator("google_client_id", "admin_email", "server_host", "session_cookie_domain", mode="before")
    @classmethod
    def strip_optional_strings(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("storage_root", "upload_dir", "graphs_dir", mode="before")
    @classmethod
    def normalize_paths(cls, value: str | Path) -> Path:
        return Path(value).expanduser() if isinstance(value, str) else value

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str, info) -> str:
        environment = (info.data.get("environment") or "development").strip().lower()
        if environment != "development":
            normalized = value.strip()
            if len(normalized) < 32 or normalized.startswith("change-me"):
                raise ValueError("SECRET_KEY must be a strong non-default value outside development.")
        return value

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def resolved_server_host(self) -> str:
        if self.server_host:
            return self.server_host
        return "127.0.0.1" if self.is_development else "0.0.0.0"

    @property
    def resolved_session_cookie_secure(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        return not self.is_development

    @property
    def resolved_session_cookie_samesite(self) -> Literal["lax", "strict", "none"]:
        value = self.session_cookie_samesite or ("lax" if self.is_development else "none")
        if value == "none" and not self.resolved_session_cookie_secure:
            raise ValueError("SESSION_COOKIE_SAMESITE='none' requires SESSION_COOKIE_SECURE=true.")
        return value


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    _ = settings.resolved_session_cookie_samesite
    if not settings.is_development:
        if _is_local_url(settings.app_url):
            raise ValueError("APP_URL must be set to a non-localhost public origin outside development.")
        if _is_local_url(settings.api_url):
            raise ValueError("API_URL must be set to a non-localhost public origin outside development.")
        if any(_is_local_url(origin) for origin in settings.backend_cors_origins):
            raise ValueError("BACKEND_CORS_ORIGINS must be set to public frontend origins outside development.")
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.graphs_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
