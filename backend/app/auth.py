from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.models import User

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
# Verified when the email is unknown, so response time does not reveal which emails exist.
_DUMMY_HASH = pwd_context.hash("nexhire-timing-equalizer")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt only accepts 72 bytes; a longer password can never be valid here.
    if len(plain_password.encode()) > 72:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def authenticate(db: Session, email: str, password: str) -> User | None:
    # lower() on both sides: accounts created before email normalization may be mixed-case.
    user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if user is None:
        verify_password(password, _DUMMY_HASH)
        return None
    return user if verify_password(password, user.hashed_password) else None


def create_access_token(user_id: str) -> str:
    now = datetime.now(UTC)
    claims = {"sub": user_id, "iat": now, "exp": now + timedelta(minutes=settings.access_token_minutes)}
    return jwt.encode(claims, settings.secret_key, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM]).get("sub")
    except JWTError:
        raise unauthorized from None
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise unauthorized
    return user
