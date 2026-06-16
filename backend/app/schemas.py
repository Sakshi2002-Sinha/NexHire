from datetime import UTC, datetime
from app.database import Base

from pydantic import BaseModel, EmailStr, Field
from typing import Annotated, List, Optional
from pydantic import ConfigDict
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str    

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    model_config = ConfigDict(from_attributes=True)

    

class Token(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")    

class InterviewStartRequest(BaseModel):
    role: str
    difficulty: str
    resume_id: str | None = None
    
class InterviewStartResponse(BaseModel):
    session_id: str
    question_id:str
    question: str

class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str   
    
class AnswerResponse(BaseModel):
    score: int

    communication: int
    technical_depth: int
    problem_solving: int
    confidence: int

    feedback: str

    strengths: list[str]
    improvements: list[str]

    next_question_id: str | None
    next_question: str | None
    
class InterviewEndResponse(BaseModel):
    session_id: str
    total_score: float
    strengths: list[str]
    improvements: list[str]   
    
class InterviewEndRequest(BaseModel):
    session_id: str
    
class QuestionAnswerDetail(BaseModel):
    question_id: str
    question: str
    question_order: int

    answer: Optional[str] = None

    score: Optional[int] = None

    communication: Optional[int] = None
    technical_depth: Optional[int] = None
    problem_solving: Optional[int] = None
    confidence: Optional[int] = None

    feedback: Optional[str] = None

    strengths: List[str] = []
    improvements: List[str] = []
    
class InterviewDetailResponse(BaseModel):
    session_id:str
    role:str
    difficulty:str
    status:str
    questions:List[QuestionAnswerDetail]
    score:Optional[float]=None
    
class SessionSummary(BaseModel):
    session_id: str
    role: str
    difficulty: str
    status: str
    score: float | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    ) 

class HistoryResponse(BaseModel):
    sessions:List[SessionSummary]    
    
class ScorePoint(BaseModel):
    date: datetime
    score: float

class DashboardResponse(BaseModel):
    avg_score_by_role:dict[str,float]
    score_over_time:List[ScorePoint]
    weak_topics:List[str]        
        
class ResumeResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    extracted_text: str
    uploaded_at: datetime
