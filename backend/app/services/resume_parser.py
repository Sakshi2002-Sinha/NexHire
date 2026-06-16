import re

SKILLS_DB = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "FastAPI",
    "Django",
    "Flask",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "LLM",
    "LangChain",
    "Git"
]
def extract_skills(text):

    text_lower = text.lower()

    found = []

    for skill in SKILLS_DB:

        if skill.lower() in text_lower:
            found.append(skill)

    return list(set(found))





def extract_projects(text):

    projects = []

    match = re.search(
        r"projects?(.*?)(experience|education|skills|achievements|certifications|positions|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if not match:
        return []

    project_section = match.group(1)

    lines = project_section.split("\n")

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # Ignore bullet points
        if line.startswith("-") or line.startswith("–"):
            continue

        # Ignore technology stacks
        if any(
            tech in line.lower()
            for tech in [
                "python",
                "react",
                "javascript",
                "fastapi",
                "pytorch",
                "sql",
                "docker",
                "aws"
            ]
        ):
            continue

        # Likely project title
        if len(line) < 80:
            title = re.sub(
                r"\s*20\d{2}.*$",
                "",
                line
            ).strip()

            projects.append(title)

    return list(dict.fromkeys(projects))