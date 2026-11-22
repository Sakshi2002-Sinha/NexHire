from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer, StringConstraints, field_validator

Role = Literal["SDE", "Backend Developer", "Frontend Developer", "ML Engineer", "Product Manager"]
Difficulty = Literal["Easy", "Medium", "Hard"]
# DB stores naive UTC; the trailing Z stops browsers reading it as local time.
UTCDateTime = Annotated[
    datetime,
    PlainSerializer(lambda d: d.replace(tzinfo=UTC).isoformat().replace("+00:00", "Z"), return_type=str),
]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def fits_bcrypt(cls, value: str) -> str:
        if len(value.encode()) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return value


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class InterviewStartRequest(BaseModel):
    role: Role
    difficulty: Difficulty
    resume_id: str | None = None
    focus_node_id: str | None = Field(default=None, max_length=80)


class QuestionOut(BaseModel):
    id: str
    text: str
    number: int
    is_followup: bool = False


class InterviewStartResponse(BaseModel):
    session_id: str
    max_questions: int
    focus_label: str | None = None
    question: QuestionOut


class SpeechInput(BaseModel):
    duration_seconds: float = Field(gt=0, le=1800)
    long_pauses: int = Field(default=0, ge=0, le=500)


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=8000)]
    speech: SpeechInput | None = None


class SpeechMetrics(BaseModel):
    words: int
    words_per_minute: int
    filler_words: int
    filler_breakdown: dict[str, int]
    long_pauses: int
    duration_seconds: int
    pace: Literal["slow", "good", "fast"]


class FeedbackOut(BaseModel):
    score: int
    communication: int
    technical_depth: int
    problem_solving: int
    confidence: int
    feedback: str
    strengths: list[str]
    improvements: list[str]
    speech: SpeechMetrics | None = None


class AnswerResponse(BaseModel):
    feedback: FeedbackOut
    next_question: QuestionOut | None


class ActiveSessionResponse(BaseModel):
    session_id: str
    role: str
    difficulty: str
    max_questions: int
    focus_label: str | None = None
    current_question: QuestionOut
    # Set when the current question is already answered and only "finish" remains.
    current_feedback: FeedbackOut | None
    previous_feedback: FeedbackOut | None


class InterviewEndRequest(BaseModel):
    session_id: str


class CompetencyScores(BaseModel):
    communication: float | None = None
    technical_depth: float | None = None
    problem_solving: float | None = None
    confidence: float | None = None


class InterviewEndResponse(BaseModel):
    session_id: str
    status: str
    total_score: float | None
    competencies: CompetencyScores
    summary: str | None
    strengths: list[str]
    improvements: list[str]


class QuestionAnswerDetail(BaseModel):
    question_id: str
    question: str
    question_order: int
    is_followup: bool = False
    answer: str | None = None
    score: int | None = None
    communication: int | None = None
    technical_depth: int | None = None
    problem_solving: int | None = None
    confidence: int | None = None
    feedback: str | None = None
    strengths: list[str] = []
    improvements: list[str] = []
    speech: SpeechMetrics | None = None


class InterviewDetailResponse(BaseModel):
    session_id: str
    role: str
    difficulty: str
    status: str
    score: float | None = None
    competencies: CompetencyScores
    summary: str | None = None
    focus_label: str | None = None
    created_at: UTCDateTime
    questions: list[QuestionAnswerDetail]


class SessionSummary(BaseModel):
    session_id: str
    role: str
    difficulty: str
    status: str
    score: float | None = None
    questions_answered: int = 0
    created_at: UTCDateTime


class HistoryResponse(BaseModel):
    sessions: list[SessionSummary]
    total: int


class ScorePoint(BaseModel):
    date: UTCDateTime
    score: float
    role: str


class DashboardResponse(BaseModel):
    total_interviews: int
    average_score: float | None
    best_score: float | None
    avg_score_by_role: dict[str, float]
    score_over_time: list[ScorePoint]
    competencies: CompetencyScores
    weak_topics: list[str]


class ResumeUploadResponse(BaseModel):
    resume_id: str
    filename: str
    skills: list[str]
    projects: list[str]


class ResumeListItem(BaseModel):
    resume_id: str
    filename: str
    uploaded_at: UTCDateTime


class ResumeListResponse(BaseModel):
    resumes: list[ResumeListItem]


class TreeNode(BaseModel):
    id: str
    label: str
    kind: str
    summary: str = ""
    claims: list[str] = []
    can_defend: bool = False
    status: Literal["untested", "weak", "developing", "verified"] | None = None
    score: float | None = None
    children: list["TreeNode"] = []


class ResumeTreeStats(BaseModel):
    projects: int
    experience: int
    skills: int


class ResumeTreeResponse(BaseModel):
    resume_id: str
    filename: str
    uploaded_at: UTCDateTime
    source: Literal["ai", "basic"]
    stats: ResumeTreeStats
    tree: TreeNode
