
import os
import json

from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

genai.configure(
    api_key=GEMINI_API_KEY
)


def _to_score(value):
    """Coerce an AI score to an int in 0-10."""
    try:
        return max(0, min(10, int(round(float(value)))))
    except (TypeError, ValueError):
        return 0


def _to_str_list(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def get_gemini_client():
    return genai.GenerativeModel(
        "gemini-2.5-flash"
    )


def generate_question(
    role: str,
    difficulty: str,
    history=None,
    resume=None
):
    if history is None:
        history = []

    resume_context = ""

    if resume:
        skills = ", ".join(
            resume.skills or []
        )

        projects = ", ".join(
            resume.projects or []
        )

        resume_context = f"""
Candidate Skills:
{skills}

Candidate Projects:
{projects}
"""

    asked = "\n".join(f"- {q}" for q in history) or "None"

    model = get_gemini_client()

    prompt = f"""
You are a senior technical interviewer.

Generate ONE interview question.

Role:
{role}

Difficulty:
{difficulty}

{resume_context}

Already Asked Questions (do not repeat or rephrase these):
{asked}

Rules:

1. If candidate projects exist,
   prioritize project-based questions.

2. If candidate skills exist,
   ask questions around those skills.

3. Question should be realistic and asked in actual interviews.

4. Ask only ONE question.

5. Do not provide explanation.

6. Do not ask similar questions.

Return only the question.
"""

    try:
        response = model.generate_content(
            prompt
        )

        return response.text.strip() or None

    except Exception as e:
        # Caller picks a canned question that hasn't been asked yet.
        print(
            f"Error generating question: {e}"
        )
        return None


def evaluate_answer(
    question: str,
    answer: str,
    role: str
):
    model = get_gemini_client()

    prompt = f"""
You are an expert technical interviewer.

Evaluate the answer.

Return ONLY valid JSON.

All numeric scores must be integers between 0 and 10.

Do not include markdown.
Do not include explanations.
Do not wrap JSON in code blocks.

{{
  "score": 0,
  "communication": 0,
  "technical_depth": 0,
  "problem_solving": 0,
  "confidence": 0,
  "strengths": [],
  "improvements": [],
  "feedback": ""
}}

Question:
{question}

Answer:
{answer}

Role:
{role}
"""

    try:
        response = model.generate_content(
            prompt
        )

        text = response.text.strip()

        text = text.replace(
            "```json",
            ""
        )

        text = text.replace(
            "```",
            ""
        )

        text = text.strip()

        result = json.loads(text)

        return {
            "score": _to_score(result.get("score")),
            "communication": _to_score(result.get("communication")),
            "technical_depth": _to_score(result.get("technical_depth")),
            "problem_solving": _to_score(result.get("problem_solving")),
            "confidence": _to_score(result.get("confidence")),
            "feedback": str(result.get("feedback") or ""),
            "strengths": _to_str_list(result.get("strengths")),
            "improvements": _to_str_list(result.get("improvements")),
        }

    except json.JSONDecodeError as e:
        print(
            f"JSON parse error: {e}"
        )

    except Exception as e:
        print(
            f"Gemini evaluation error: {e}"
        )

    return {
        "score": 5,
        "communication": 5,
        "technical_depth": 5,
        "problem_solving": 5,
        "confidence": 5,
        "feedback":
            "AI evaluation is temporarily unavailable. A fallback score has been provided.",
        "strengths": [],
        "improvements": []
    }

