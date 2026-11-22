import os
import tempfile

# Set before importing the app, so tests can never reach a real database or the AI provider.
_db_file = os.path.join(tempfile.mkdtemp(prefix="nexhire-test-"), "test.db")
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", f"sqlite:///{_db_file}")
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-123"
os.environ["GEMINI_API_KEY"] = ""
os.environ.pop("DIRECT_URL", None)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.limits import ai_limiter, login_limiter  # noqa: E402
from app.main import app  # noqa: E402
from app.services import gemini_service as llm  # noqa: E402


class FakeLLM:
    def __init__(self):
        self.fail_evaluation = False
        self.fail_questions = False
        self.score = 8
        self.calls = []
        self.count = 0
        self.drafted = {}
        self.next_contexts = []

    def question(self, role, difficulty, asked=None, recent=None, follow_up=None, resume=None, focus=None):
        self.calls.append({"asked": asked, "recent": recent, "follow_up": follow_up, "resume": resume, "focus": focus})
        if self.fail_questions:
            raise llm.LLMUnavailable("down")
        self.count += 1
        return f"Generated question {self.count}"

    def evaluate(self, question, answer, role, difficulty="Medium", next_context=None):
        self.next_contexts.append(next_context)
        if self.fail_evaluation:
            raise llm.LLMUnavailable("down")
        s = self.score
        return {
            "score": s,
            "communication": s,
            "technical_depth": s,
            "problem_solving": s,
            "confidence": s,
            "feedback": "Good, with gaps",
            "strengths": ["Clear, structured reasoning"],
            "improvements": ["Discuss trade-offs"],
            "weak_topics": ["caching"],
            "next_questions": self.drafted,
        }


@pytest.fixture(autouse=True)
def clean_state():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    ai_limiter.reset()
    login_limiter.reset()
    llm.gemini_budget.reset()
    llm._quota_blocked_until = 0.0
    yield


@pytest.fixture
def fake_llm(monkeypatch):
    fake = FakeLLM()
    monkeypatch.setattr(llm, "generate_question", fake.question)
    monkeypatch.setattr(llm, "evaluate_answer", fake.evaluate)
    return fake


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def make_user(client, email="a@example.com"):
    body = {"name": "Test", "email": email, "password": "password123"}
    assert client.post("/auth/register", json=body).status_code == 201
    token = client.post("/auth/login", data={"username": email, "password": "password123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth(client):
    return make_user(client)


@pytest.fixture
def other_auth(client):
    return make_user(client, "b@example.com")
