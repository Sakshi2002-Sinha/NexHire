"""Application rate limits and the FastAPI dependency that enforces them."""
from fastapi import Depends, HTTPException, status

from app.auth import get_current_user
from app.config import settings
from app.models import User
from app.rate_limit import SlidingWindowLimiter

ai_limiter = SlidingWindowLimiter(settings.ai_user_rpm)
login_limiter = SlidingWindowLimiter(settings.login_rpm)


def too_many_requests() -> HTTPException:
    return HTTPException(
        status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please wait a minute and try again.",
        headers={"Retry-After": "60"},
    )


def limit_ai_calls(current_user: User = Depends(get_current_user)) -> User:
    if not ai_limiter.allow(current_user.id):
        raise too_many_requests()
    return current_user
