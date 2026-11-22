from google.genai import errors
from test_api import answer, start

from app.services import gemini_service as llm


def finish(client, auth, data):
    question = data["question"]
    while question:
        question = answer(client, auth, data["session_id"], question["id"]).json()["next_question"]
    return client.post("/interview/end", json={"session_id": data["session_id"]}, headers=auth)


def test_interview_uses_one_ai_call_per_answer_when_drafts_exist(client, auth, fake_llm):
    fake_llm.drafted = {"follow_up": "Drafted follow-up?", "new_topic": "Drafted new topic?"}
    data = start(client, auth).json()
    question_calls_after_start = len(fake_llm.calls)
    next_q = answer(client, auth, data["session_id"], data["question"]["id"]).json()["next_question"]
    assert next_q["text"] == "Drafted new topic?" and next_q["is_followup"] is False
    assert len(fake_llm.calls) == question_calls_after_start, "no separate question request"
    assert fake_llm.next_contexts[0]["asked"] == [data["question"]["text"]]


def test_weak_answer_uses_drafted_follow_up(client, auth, fake_llm):
    fake_llm.score = 3
    fake_llm.drafted = {"follow_up": "Drafted follow-up?", "new_topic": "Drafted new topic?"}
    data = start(client, auth).json()
    next_q = answer(client, auth, data["session_id"], data["question"]["id"]).json()["next_question"]
    assert next_q["text"] == "Drafted follow-up?" and next_q["is_followup"] is True


def test_repeated_draft_falls_back_to_a_new_question(client, auth, fake_llm):
    data = start(client, auth).json()
    fake_llm.drafted = {"follow_up": data["question"]["text"], "new_topic": data["question"]["text"]}
    next_q = answer(client, auth, data["session_id"], data["question"]["id"]).json()["next_question"]
    assert next_q["text"] != data["question"]["text"]


def test_last_question_does_not_request_a_draft(client, auth, fake_llm):
    finish(client, auth, start(client, auth).json())
    assert fake_llm.next_contexts[-1] is None and all(fake_llm.next_contexts[:-1])


def test_daily_interview_limit(client, auth, fake_llm):
    for _ in range(3):
        data = start(client, auth).json()
        client.post("/interview/end", json={"session_id": data["session_id"]}, headers=auth)
    blocked = start(client, auth)
    assert blocked.status_code == 429 and "limit" in blocked.json()["detail"]


def test_daily_quota_stops_further_provider_calls(monkeypatch):
    calls = []

    def exhausted(*args):
        calls.append(1)
        raise errors.APIError(
            429,
            {"error": {"code": 429, "status": "RESOURCE_EXHAUSTED", "message": "quota",
                       "details": [{"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}},
        )

    monkeypatch.setattr(llm, "_call_model", exhausted)
    for _ in range(2):
        try:
            llm.generate_question("SDE", "Easy")
        except llm.LLMQuotaExceeded:
            pass
    assert len(calls) == 1


def test_quota_message_keeps_the_interview_usable(client, auth, fake_llm, monkeypatch):
    data = start(client, auth).json()

    def quota(*args, **kwargs):
        raise llm.LLMQuotaExceeded("quota")

    monkeypatch.setattr(llm, "evaluate_answer", quota)
    failed = answer(client, auth, data["session_id"], data["question"]["id"])
    assert failed.status_code == 503 and "tomorrow" in failed.json()["detail"]
    state = client.get("/interview/active", headers=auth).json()
    assert state["current_question"]["id"] == data["question"]["id"]
