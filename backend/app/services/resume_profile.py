"""Turns resume text into a structured profile, and that profile into a tree for the UI."""
import re

from app.models import Resume
from app.services import gemini_service as llm

MAX_ITEMS = 8
MAX_TECH = 10
MAX_CLAIMS = 4
MAX_SKILLS_PER_GROUP = 12
MAX_FIELD_CHARS = 240
MAX_PROMPT_CHARS = 12_000

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_URL = re.compile(r"(?:https?://|www\.)\S+|\b(?:linkedin|github|gitlab|leetcode)\.com/\S*", re.I)
_PHONE = re.compile(r"(?<![\w])\+?\d(?:[\s().-]?\d){9,13}(?![\w])")
_NAME_LINE = re.compile(r"[^\W\d_]+(?:[ .'-]+[^\W\d_]+){0,3}")
_NOT_A_NAME = {
    "resume", "cv", "curriculum vitae", "summary", "profile", "education", "experience", "projects", "skills",
}


def redact_contact(text: str) -> str:
    """Remove contact details and the name header before the text leaves our server."""
    text = _EMAIL.sub("[email]", text)
    text = _URL.sub("[link]", text)
    text = _PHONE.sub("[phone]", text)
    lines = text.strip().splitlines()
    if lines:
        first = lines[0].strip()
        if _NAME_LINE.fullmatch(first) and first.lower() not in _NOT_A_NAME:
            lines = lines[1:]
    return "\n".join(lines).strip()


def _text(value, limit: int = MAX_FIELD_CHARS) -> str:
    return " ".join(str(value or "").split())[:limit]


def _unique(values, limit: int) -> list[str]:
    seen, result = set(), []
    for value in values or []:
        clean = _text(value)
        if clean and clean.lower() not in seen:
            seen.add(clean.lower())
            result.append(clean)
    return result[:limit]


def _clean_profile(raw: dict) -> dict:
    """Model output is untrusted, so bound every list and string before storing it."""
    groups = []
    for group in raw.get("skill_groups", [])[:MAX_ITEMS]:
        skills = _unique(group.get("skills"), MAX_SKILLS_PER_GROUP)
        if skills:
            groups.append({"category": _text(group.get("category"), 40) or "Skills", "skills": skills})

    projects = [
        {
            "name": _text(item.get("name"), 80),
            "summary": _text(item.get("summary")),
            "technologies": _unique(item.get("technologies"), MAX_TECH),
            "claims": _unique(item.get("claims"), MAX_CLAIMS),
        }
        for item in raw.get("projects", [])[:MAX_ITEMS]
        if _text(item.get("name"))
    ]
    experience = [
        {
            "title": _text(item.get("title"), 80),
            "organization": _text(item.get("organization"), 80),
            "technologies": _unique(item.get("technologies"), MAX_TECH),
            "claims": _unique(item.get("claims"), MAX_CLAIMS),
        }
        for item in raw.get("experience", [])[:MAX_ITEMS]
        if _text(item.get("title"))
    ]
    education = [
        {"degree": _text(item.get("degree"), 100), "institution": _text(item.get("institution"), 100)}
        for item in raw.get("education", [])[:MAX_ITEMS]
        if _text(item.get("degree"))
    ]
    return {"source": "ai", "skill_groups": groups, "projects": projects, "experience": experience,
            "education": education}


def basic_profile(skills: list[str] | None, projects: list[str] | None) -> dict:
    """Deterministic fallback, so a resume still gets a tree when the AI is unavailable."""
    return {
        "source": "basic",
        "skill_groups": [{"category": "Skills", "skills": list(skills or [])}] if skills else [],
        "projects": [{"name": name, "summary": "", "technologies": [], "claims": []} for name in projects or []],
        "experience": [],
        "education": [],
    }


def build_profile(text: str, skills: list[str], projects: list[str]) -> dict:
    try:
        raw = llm.extract_resume_profile(redact_contact(text)[:MAX_PROMPT_CHARS])
    except llm.LLMUnavailable:
        return basic_profile(skills, projects)
    profile = _clean_profile(raw)
    has_content = profile["skill_groups"] or profile["projects"] or profile["experience"]
    return profile if has_content else basic_profile(skills, projects)


DEFENDABLE_KINDS = {"project", "experience", "technology", "skill"}
VERIFIED_FROM = 7
DEVELOPING_FROM = 5


def _node(node_id: str, label: str, kind: str, children=None, summary: str = "", claims=None) -> dict:
    defendable = kind in DEFENDABLE_KINDS
    return {"id": node_id, "label": label, "kind": kind, "summary": summary, "claims": claims or [],
            "can_defend": defendable, "status": "untested" if defendable else None, "score": None,
            "children": children or []}


def find_focus(profile: dict, node_id: str) -> dict | None:
    """Resolve a client-supplied node ID against the stored resume, so only real items can be targeted."""

    def walk(node, parent_label):
        if node["id"] == node_id:
            if not node["can_defend"]:
                return None
            return {
                "node_id": node["id"],
                "label": node["label"],
                "kind": node["kind"],
                "summary": node["summary"],
                "claims": node["claims"],
                "related": [child["label"] for child in node["children"]],
                "context": parent_label,
            }
        for child in node["children"]:
            found = walk(child, node["label"])
            if found:
                return found
        return None

    return walk(build_tree(profile, "Candidate"), "")


def apply_mastery(node: dict, mastery: dict[tuple[str, str], float]) -> dict:
    """Mark nodes from their latest Defense score. The label check guards against re-analysis moving IDs."""
    score = mastery.get((node["id"], node["label"]))
    if node["can_defend"] and score is not None:
        node["score"] = score
        node["status"] = "verified" if score >= VERIFIED_FROM else "developing" if score >= DEVELOPING_FROM else "weak"
    for child in node["children"]:
        apply_mastery(child, mastery)
    return node


def _tech_nodes(parent: str, technologies: list[str]) -> list[dict]:
    return [_node(f"{parent}/tech/{i}", tech, "technology") for i, tech in enumerate(technologies)]


def build_tree(profile: dict, root_label: str) -> dict:
    sections = []
    if profile.get("projects"):
        sections.append(_node("projects", "Projects", "section", [
            _node(f"projects/{i}", p["name"], "project", _tech_nodes(f"projects/{i}", p["technologies"]),
                  p["summary"], p["claims"])
            for i, p in enumerate(profile["projects"])
        ]))
    if profile.get("experience"):
        sections.append(_node("experience", "Experience", "section", [
            _node(f"experience/{i}", e["title"], "experience", _tech_nodes(f"experience/{i}", e["technologies"]),
                  e["organization"], e["claims"])
            for i, e in enumerate(profile["experience"])
        ]))
    if profile.get("skill_groups"):
        sections.append(_node("skills", "Skills", "section", [
            _node(f"skills/{i}", g["category"], "skill_group",
                  [_node(f"skills/{i}/{j}", s, "skill") for j, s in enumerate(g["skills"])])
            for i, g in enumerate(profile["skill_groups"])
        ]))
    if profile.get("education"):
        sections.append(_node("education", "Education", "section", [
            _node(f"education/{i}", e["degree"], "education", summary=e["institution"])
            for i, e in enumerate(profile["education"])
        ]))
    return _node("root", root_label, "root", sections)


def resume_profile(resume: Resume) -> dict:
    """Resumes uploaded before this feature have no stored profile."""
    return resume.profile or basic_profile(resume.skills, resume.projects)


def tree_stats(profile: dict) -> dict:
    return {
        "projects": len(profile.get("projects", [])),
        "experience": len(profile.get("experience", [])),
        "skills": sum(len(g["skills"]) for g in profile.get("skill_groups", [])),
    }
