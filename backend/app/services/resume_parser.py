"""Deterministic resume parsing: free, fast, and no raw resume is sent to the LLM."""
import re

SKILLS_DB = [
    "Python", "Java", "C++", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI",
    "Django", "Flask", "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes",
    "AWS", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "LLM", "LangChain", "Git",
]
_HEADINGS = (
    "experience|work experience|education|skills|technical skills|achievements|"
    "certifications|positions of responsibility|publications|awards|interests"
)
_PROJECT_HEADING = re.compile(r"^\s*(academic |personal |key )?projects?\s*:?\s*$", re.I | re.M)
_NEXT_HEADING = re.compile(rf"^\s*({_HEADINGS})\s*:?\s*$", re.I | re.M)
_BULLET = ("-", "–", "—", "•", "*", "●", "▪")
MAX_PROJECTS = 8


def extract_skills(text: str) -> list[str]:
    # Whole-token match: "Java" must not match "JavaScript", nor "Git" match "digital".
    return [
        skill for skill in SKILLS_DB
        if re.search(rf"(?<![\w+#.]){re.escape(skill)}(?![\w+#])", text, re.I)
    ]


def extract_projects(text: str) -> list[str]:
    start = _PROJECT_HEADING.search(text)
    if not start:
        return []
    end = _NEXT_HEADING.search(text, start.end())
    section = text[start.end(): end.start() if end else len(text)]

    projects: list[str] = []
    for raw in section.splitlines():
        line = raw.strip()
        if not line or line.startswith(_BULLET) or len(line) >= 80 or line.endswith("."):
            continue
        title = re.split(r"\s+[|–—]\s+|\s+-\s+", line)[0]
        title = re.sub(r"\s*\(?(19|20)\d{2}.*$", "", title).strip(" :,")
        if len(title) >= 3 and title not in projects:
            projects.append(title)
    return projects[:MAX_PROJECTS]
