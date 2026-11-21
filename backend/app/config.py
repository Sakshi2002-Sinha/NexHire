"""Central configuration. The app refuses to boot with unsafe settings."""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parents[1]
# Real environment variables always win; .env files are a local-dev convenience.
load_dotenv(_BACKEND_DIR / ".env")
load_dotenv(_BACKEND_DIR.parent / ".env")

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,https://nexhire-kappa.vercel.app"


def normalize_database_url(url: str) -> str:
    """Hosting dashboards use several URL spellings; the app ships one driver (psycopg2)."""
    for prefix in ("postgres://", "postgresql://", "postgresql+psycopg://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    database_url: str
    secret_key: str
    gemini_api_key: str
    gemini_model: str
    cors_origins: tuple[str, ...]
    access_token_minutes: int
    max_questions: int
    gemini_rpm: int
    ai_user_rpm: int
    login_rpm: int
    max_resume_bytes: int


def load_settings() -> Settings:
    secret = _required("SECRET_KEY")
    if len(secret) < 32:
        raise RuntimeError("SECRET_KEY must be at least 32 characters")
    origins = os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS)
    return Settings(
        database_url=normalize_database_url(_required("DATABASE_URL")),
        secret_key=secret,
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        cors_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
        access_token_minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "60")),
        max_questions=int(os.getenv("MAX_QUESTIONS", "5")),
        gemini_rpm=int(os.getenv("GEMINI_RPM", "15")),
        ai_user_rpm=int(os.getenv("AI_USER_RPM", "10")),
        login_rpm=int(os.getenv("LOGIN_RPM", "10")),
        max_resume_bytes=int(os.getenv("MAX_RESUME_BYTES", str(5 * 1024 * 1024))),
    )


settings = load_settings()
