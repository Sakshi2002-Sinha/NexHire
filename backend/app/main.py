import fastapi 
from fastapi import FastAPI,Depends,HTTPException
from sqlalchemy.orm import Session
from app.routes.auth import router as auth_router
from app.dependencies import get_db
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.models import User
from app.auth import get_current_user, hash_password, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from app.routes.interview import router as interview_router
from app.routes.history import router as history_router
from app.routes.dashboard import router as dashboard_router
from fastapi.middleware.cors import CORSMiddleware

from fastapi import APIRouter, Depends, UploadFile, File
from app.routes.interview import router as interview_router
from fastapi.middleware.cors import CORSMiddleware
from app import models
from app.database import engine
import os

print("DATABASE_URL =", os.getenv("DATABASE_URL"))
app=FastAPI()

print(models.Base.metadata.tables.keys())
models.Base.metadata.create_all(bind=engine)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed_pw = hash_password(user.password)

    # Create new user
    new_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_pw
    )

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user



@app.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {"sub": db_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
@app.get("/me")
def read_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }
    
app.include_router(interview_router)    
app.include_router(history_router)
app.include_router(dashboard_router)
