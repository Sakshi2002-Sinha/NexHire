from test_api import answer, pdf_with_text, upload
from test_resume_tree import AI_PROFILE

from app.limits import ai_limiter
from app.services import gemini_service as llm
from app.services.speech_metrics import compute_speech_metrics

PROJECT_NODE = "projects/0"


def resume_with_profile(client, auth, monkeypatch):
    monkeypatch.setattr(llm, "extract_resume_profile", lambda text: AI_PROFILE)
    return upload(client, auth, pdf_with_text()).json()["resume_id"]


def defend(client, auth, resume_id, node=PROJECT_NODE):
    body = {"role": "SDE", "difficulty": "Medium", "resume_id": resume_id, "focus_node_id": node}
    return client.post("/interview/start", json=body, headers=auth)


def finish_defense(client, auth, data):
    ai_limiter.reset()  # Some tests run several interviews, faster than a real user could.
    question = data["question"]
    while question:
        question = answer(client, auth, data["session_id"], question["id"]).json()["next_question"]
    return client.post("/interview/end", json={"session_id": data["session_id"]}, headers=auth)


def node_by_id(node, node_id):
    if node["id"] == node_id:
        return node
    for child in node["children"]:
        found = node_by_id(child, node_id)
        if found:
            return found
    return None


def test_defense_targets_the_claim_and_runs_three_questions(client, auth, fake_llm, monkeypatch):
    resume_id = resume_with_profile(client, auth, monkeypatch)
    data = defend(client, auth, resume_id).json()
    assert data["max_questions"] == 3 and data["focus_label"] == "NexHire"
    assert fake_llm.calls[0]["focus"]["claims"] == ["Reduced latency by 40%"]
    assert finish_defense(client, auth, data).json()["status"] == "completed"
    assert len(client.get(f"/history/{data['session_id']}", headers=auth).json()["questions"]) == 3


def test_tree_shows_latest_defense_result(client, auth, fake_llm, monkeypatch):
    resume_id = resume_with_profile(client, auth, monkeypatch)
    tree = client.get(f"/resumes/{resume_id}/tree", headers=auth).json()["tree"]
    assert node_by_id(tree, PROJECT_NODE)["status"] == "untested"

    fake_llm.score = 3
    finish_defense(client, auth, defend(client, auth, resume_id).json())
    tree = client.get(f"/resumes/{resume_id}/tree", headers=auth).json()["tree"]
    assert node_by_id(tree, PROJECT_NODE)["status"] == "weak"

    fake_llm.score = 9
    finish_defense(client, auth, defend(client, auth, resume_id).json())
    tree = client.get(f"/resumes/{resume_id}/tree", headers=auth).json()["tree"]
    assert node_by_id(tree, PROJECT_NODE)["status"] == "verified" and node_by_id(tree, PROJECT_NODE)["score"] == 9


def test_defense_rejects_invalid_targets(client, auth, other_auth, fake_llm, monkeypatch):
    resume_id = resume_with_profile(client, auth, monkeypatch)
    assert defend(client, auth, resume_id, "projects/99").status_code == 404
    assert defend(client, auth, resume_id, "projects").status_code == 404  # A section can't be defended.
    assert defend(client, other_auth, resume_id).status_code == 404
    body = {"role": "SDE", "difficulty": "Easy", "focus_node_id": PROJECT_NODE}
    assert client.post("/interview/start", json=body, headers=auth).status_code == 422


def test_defense_survives_ai_outage(client, auth, fake_llm, monkeypatch):
    resume_id = resume_with_profile(client, auth, monkeypatch)
    fake_llm.fail_questions = True
    data = defend(client, auth, resume_id).json()
    assert "NexHire" in data["question"]["text"]
    next_q = answer(client, auth, data["session_id"], data["question"]["id"]).json()["next_question"]
    assert "NexHire" in next_q["text"] and next_q["text"] != data["question"]["text"]


def test_active_defense_restores_after_refresh(client, auth, fake_llm, monkeypatch):
    resume_id = resume_with_profile(client, auth, monkeypatch)
    defend(client, auth, resume_id)
    state = client.get("/interview/active", headers=auth).json()
    assert state["focus_label"] == "NexHire" and state["max_questions"] == 3


def test_speech_metrics():
    text = "Um I basically used Redis, you know, for caching and uh it actually worked like a charm"
    result = compute_speech_metrics(text, 10, 2)
    assert result["words"] == 17 and result["words_per_minute"] == 102 and result["pace"] == "slow"
    assert result["filler_words"] == 5 and result["long_pauses"] == 2
    assert "like" not in result["filler_breakdown"]


def test_speech_pace_bands():
    words = " ".join(["word"] * 30)
    assert compute_speech_metrics(words, 12, 0)["pace"] == "good"
    assert compute_speech_metrics(words, 6, 0)["pace"] == "fast"


def test_spoken_answer_saves_metrics(client, auth, fake_llm):
    data = client.post("/interview/start", json={"role": "SDE", "difficulty": "Easy"}, headers=auth).json()
    body = {
        "session_id": data["session_id"],
        "question_id": data["question"]["id"],
        "answer": "Um this is my spoken answer",
        "speech": {"duration_seconds": 6, "long_pauses": 1},
    }
    feedback = client.post("/interview/answer", json=body, headers=auth).json()["feedback"]
    assert feedback["speech"]["words"] == 6 and feedback["speech"]["filler_words"] == 1
    detail = client.get(f"/history/{data['session_id']}", headers=auth).json()
    assert detail["questions"][0]["speech"]["long_pauses"] == 1


def test_invalid_speech_input_is_rejected(client, auth, fake_llm):
    data = client.post("/interview/start", json={"role": "SDE", "difficulty": "Easy"}, headers=auth).json()
    body = {
        "session_id": data["session_id"],
        "question_id": data["question"]["id"],
        "answer": "x",
        "speech": {"duration_seconds": 0},
    }
    assert client.post("/interview/answer", json=body, headers=auth).status_code == 422
