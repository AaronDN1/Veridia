from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_ROOT = BASE_DIR / "storage"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Sigma Solve API"
    environment: str = "development"
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
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
    admin_email: str = "adnathans@gmail.com"
    beta_free_mode: bool = False
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
            return value
        return [item.strip() for item in value.split(",") if item.strip()]

    @field_validator("google_client_id", "admin_email", mode="before")
    @classmethod
    def strip_optional_strings(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.graphs_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
