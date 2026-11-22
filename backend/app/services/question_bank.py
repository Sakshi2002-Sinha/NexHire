"""Curated questions used when the AI provider is unavailable."""

_GENERAL = [
    "Tell me about a technically difficult problem you solved. What trade-offs did you weigh?",
    "Describe a time a design decision of yours turned out wrong. How did you correct it?",
    "How do you decide when a solution is good enough to ship?",
]

QUESTION_BANK = {
    "SDE": [
        "How would you design a URL shortener that handles 1,000 writes per second?",
        "Explain how a database index works and when adding one makes performance worse.",
        "How would you prevent overselling in an e-commerce inventory system under concurrency?",
        "Compare horizontal and vertical scaling, including when you would choose each.",
        "What is the N+1 query problem and how do you detect and fix it?",
    ],
    "Backend Developer": [
        "How would you implement rate limiting for a public API across multiple servers?",
        "Explain ACID transactions and the isolation anomalies each level prevents.",
        "How would you make a payment endpoint idempotent?",
        "When would you introduce a message queue, and what new failure modes does it add?",
        "How does connection pooling work and what happens when the pool is exhausted?",
    ],
    "Frontend Developer": [
        "Explain how React decides what to re-render and how you would fix excessive renders.",
        "How would you store auth tokens in a browser app, and what are the security trade-offs?",
        "How would you improve the load time of a slow single-page application?",
        "Compare server state and client state. How would you manage each?",
        "How would you make a complex form accessible?",
    ],
    "ML Engineer": [
        "Explain the bias-variance trade-off using a model you have worked with.",
        "How would you detect and respond to data drift in a production model?",
        "How do you evaluate a classifier on a heavily imbalanced dataset?",
        "What is data leakage? Give an example and explain how to prevent it.",
        "How would you design a feature pipeline that stays consistent in training and serving?",
    ],
    "Product Manager": [
        "How would you decide whether to launch a feature that lifts engagement but lowers revenue?",
        "Daily active users dropped 10% last week. How do you investigate?",
        "How would you prioritize a roadmap with limited engineering capacity?",
        "What success metrics would you define for a mock interview product?",
        "How would you design an A/B test for a new onboarding flow?",
    ],
}


_DEFENSE = [
    "Walk me through {label}. What was your specific contribution?",
    "What was the hardest technical decision in {label}, and what alternatives did you reject?",
    "If {label} had to handle ten times the load, what would break first?",
]


def fallback_defense_question(label: str, asked: list[str]) -> str:
    for template in _DEFENSE:
        question = template.format(label=label)
        if question not in asked:
            return question
    return f"What would you change about {label} if you started again?"


def fallback_question(role: str, asked: list[str]) -> str:
    """Return the first curated question not yet asked in this session."""
    seen = set(asked)
    for question in QUESTION_BANK.get(role, []) + _GENERAL:
        if question not in seen:
            return question
    return f"Walk me through the most challenging {role} project you have worked on."
