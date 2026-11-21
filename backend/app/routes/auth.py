from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import authenticate, create_access_token, get_current_user, hash_password
from app.dependencies import get_db
from app.limits import login_limiter, too_many_requests
from app.models import User
from app.schemas import Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(email=user.email, name=user.name, hashed_password=hash_password(user.password))
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        # Rely on the unique constraint: check-then-insert would race.
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered") from None
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not login_limiter.allow(f"{client}:{form.username.strip().lower()}"):
        raise too_many_requests()
    user = authenticate(db, form.username, form.password)
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user
