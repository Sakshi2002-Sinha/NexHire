function QuestionCard({ question }) {
  if (!question) return null;
  return (
    <section className="card border-l-4 border-l-accent">
      <p className="eyebrow">{question.is_followup ? "Follow-up" : `Question ${question.number}`}</p>
      <h1 className="mt-2 text-xl leading-snug sm:text-2xl">{question.text}</h1>
    </section>
  );
}

export default QuestionCard;
