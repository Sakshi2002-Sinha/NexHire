from test_api import pdf_with_text, upload

from app.database import SessionLocal
from app.models import Resume
from app.services import gemini_service as llm
from app.services.resume_profile import basic_profile, build_profile, build_tree, redact_contact

AI_PROFILE = {
    "skill_groups": [{"category": "Languages", "skills": ["Python", "python", "SQL"]}],
    "projects": [
        {
            "name": "NexHire",
            "summary": "AI mock interview platform.",
            "technologies": ["FastAPI", "PostgreSQL"],
            "claims": ["Reduced latency by 40%"],
        }
    ],
    "experience": [{"title": "Intern", "organization": "Acme", "technologies": ["AWS"], "claims": []}],
    "education": [{"degree": "M.Tech", "institution": "Example Institute"}],
}


def test_redaction_removes_contact_details_and_name():
    text = (
        "Priya Sharma\npriya.s@example.com | +91 98765 43210\n"
        "https://github.com/priya linkedin.com/in/priya\nBuilt APIs from 2021 - 2023"
    )
    clean = redact_contact(text)
    for private in ("Priya", "example.com", "98765", "github.com", "linkedin.com"):
        assert private not in clean
    assert "2021 - 2023" in clean


def test_redaction_keeps_a_heading_on_the_first_line():
    assert redact_contact("Education\nBTech").startswith("Education")


def test_only_redacted_text_reaches_the_model(monkeypatch):
    sent = {}
    monkeypatch.setattr(llm, "extract_resume_profile", lambda text: sent.update(text=text) or AI_PROFILE)
    build_profile("Jane Doe\njane@example.com\nProjects", [], [])
    assert "jane@example.com" not in sent["text"] and "Jane" not in sent["text"]


def test_profile_is_cleaned_and_deduplicated(monkeypatch):
    monkeypatch.setattr(llm, "extract_resume_profile", lambda text: AI_PROFILE)
    profile = build_profile("text", [], [])
    assert profile["source"] == "ai"
    assert profile["skill_groups"][0]["skills"] == ["Python", "SQL"]


def test_ai_failure_falls_back_to_basic_profile(monkeypatch):
    def unavailable(text):
        raise llm.LLMUnavailable("down")

    monkeypatch.setattr(llm, "extract_resume_profile", unavailable)
    profile = build_profile("text", ["Python"], ["NexHire"])
    assert profile["source"] == "basic" and profile["projects"][0]["name"] == "NexHire"


def test_tree_structure():
    tree = build_tree({**AI_PROFILE, "source": "ai"}, "Candidate")
    assert [s["label"] for s in tree["children"]] == ["Projects", "Experience", "Skills", "Education"]
    project = tree["children"][0]["children"][0]
    assert project["claims"] == ["Reduced latency by 40%"]
    assert [c["label"] for c in project["children"]] == ["FastAPI", "PostgreSQL"]
    ids = []

    def collect(node):
        ids.append(node["id"])
        for child in node["children"]:
            collect(child)

    collect(tree)
    assert len(ids) == len(set(ids)), "node IDs must be unique"


def test_empty_sections_are_omitted():
    assert build_tree(basic_profile(["Python"], []), "C")["children"][0]["label"] == "Skills"


def test_upload_saves_profile_and_serves_tree(client, auth, monkeypatch):
    monkeypatch.setattr(llm, "extract_resume_profile", lambda text: AI_PROFILE)
    resume_id = upload(client, auth, pdf_with_text()).json()["resume_id"]
    with SessionLocal() as db:
        assert db.get(Resume, resume_id).profile["projects"][0]["name"] == "NexHire"

    # Viewing must not call the AI again.
    def fail(text):
        raise AssertionError("tree view must use the stored profile")

    monkeypatch.setattr(llm, "extract_resume_profile", fail)
    body = client.get(f"/resumes/{resume_id}/tree", headers=auth).json()
    assert body["source"] == "ai" and body["stats"] == {"projects": 1, "experience": 1, "skills": 2}
    assert client.get("/resumes", headers=auth).json()["resumes"][0]["resume_id"] == resume_id


def test_analyze_upgrades_a_basic_tree(client, auth, monkeypatch):
    resume_id = upload(client, auth, pdf_with_text()).json()["resume_id"]
    assert client.get(f"/resumes/{resume_id}/tree", headers=auth).json()["source"] == "basic"
    monkeypatch.setattr(llm, "extract_resume_profile", lambda text: AI_PROFILE)
    assert client.post(f"/resumes/{resume_id}/analyze", headers=auth).json()["source"] == "ai"


def test_resume_tree_ownership(client, auth, other_auth):
    resume_id = upload(client, auth, pdf_with_text()).json()["resume_id"]
    assert client.get(f"/resumes/{resume_id}/tree", headers=other_auth).status_code == 404
    assert client.post(f"/resumes/{resume_id}/analyze", headers=other_auth).status_code == 404
    assert client.get("/resumes", headers=other_auth).json()["resumes"] == []
