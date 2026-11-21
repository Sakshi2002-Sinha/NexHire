# NexHire

AI mock interview platform that asks adaptive follow-up questions, scores answers across four skills, and tracks progress over time.

**Stack:** React 19, Redux Toolkit, Tailwind CSS, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Gemini, Docker, GitHub Actions

## Features

- Role and difficulty selection, with optional resume-aware questions
- Multi-turn interviews: a weak answer triggers one targeted follow-up
- Text or voice answers (Web Speech API)
- Scores for technical depth, problem solving, communication, and confidence
- Interviews survive page refreshes, including unsent drafts
- Dashboard with score trend, skill breakdown, and topics to revisit

## Architecture

```text
Browser (React + Redux)
        │  HTTPS, JWT bearer token
        ▼
FastAPI ── routes → services ──► Gemini API
        │                        (validated JSON, retry, fallback)
        ▼
PostgreSQL (users → sessions → questions → answers)
```

## Engineering highlights

- **Concurrency safety:** database constraints guarantee one active interview per user and one answer per question. Duplicate submissions are idempotent.
- **AI failure handling:** model output is schema-validated and retried. A failed evaluation returns a retryable error instead of storing a made-up score.
- **Connection management:** no database transaction stays open during an AI call.
- **Security:** ownership checks on every resource, bcrypt, rate limiting, upload validation, and prompt-injection fencing.
- **Delivery:** versioned migrations, 24 automated tests, and CI for lint, tests, migrations, and image builds.

## Run locally

With Docker:

```bash
cp .env.example .env   # set SECRET_KEY, and GEMINI_API_KEY for AI scoring
docker compose up --build
```

Open <http://localhost:8080>.

Without Docker, on Windows PowerShell:

```powershell
# Terminal 1: backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
alembic upgrade head   # Applies to whichever database DATABASE_URL points at
uvicorn app.main:app --reload

# Terminal 2: frontend
cd frontend\nexhire-frontend
npm ci
npm run dev
```

On macOS or Linux, activate with `source .venv/bin/activate`.

API docs are at <http://localhost:8000/docs>.

## Tests

```bash
cd backend && pytest
cd frontend/nexhire-frontend && npm run lint && npm run build
```

Tests use an isolated database and a fake AI provider, so they need no API key.

## Documentation

[Project guide](docs/NEXHIRE_PROJECT_GUIDE.md): architecture, trade-offs, code walkthrough, interview Q&A, and roadmap.
