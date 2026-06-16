from app.services.gemini_service import generate_question

question = generate_question(
    role="Backend Developer",
    difficulty="Medium"
)

print(question)