# app/test_evaluation.py

from app.services.gemini_service import evaluate_answer

result = evaluate_answer(
    question="What is database indexing?",
    answer="Indexing improves query performance by allowing faster lookups.",
    role="Backend Developer"
)

print(result)
print(type(result))