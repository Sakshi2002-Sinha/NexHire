import logging
import time
import uuid

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.history import router as history_router
from app.routes.interview import router as interview_router
from app.routes.resume import router as resume_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("nexhire.api")

# The schema is owned by Alembic migrations; the app never creates tables at startup.
app = FastAPI(title="NexHire API", version="1.0.0")


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("unhandled_error id=%s path=%s", request_id, request.url.path)
        response = JSONResponse({"detail": "Internal server error", "request_id": request_id}, status_code=500)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request id=%s method=%s path=%s status=%d ms=%d",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        (time.perf_counter() - started) * 1000,
    )
    return response


# Added last so it is outermost: even error responses carry CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Request-ID", "Retry-After"],
)

app.include_router(auth_router)
app.include_router(interview_router)
app.include_router(resume_router)
app.include_router(history_router)
app.include_router(dashboard_router)


@app.get("/health", tags=["Ops"])
def health():
    """Liveness: the process is up. Deliberately does not touch the database."""
    return {"status": "ok"}


@app.get("/ready", tags=["Ops"])
def ready(db: Session = Depends(get_db)):
    """Readiness: the instance can reach its database."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("readiness_failed")
        return JSONResponse({"status": "unavailable"}, status_code=503)
    return {"status": "ready"}
