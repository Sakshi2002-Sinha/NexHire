function QuestionCard({ question }) {
  if (!question) return null;

  return (
    <div
      className="
        bg-indigo-50
        rounded-2xl
        px-5 py-4
        mb-4
      "
    >
      <div
        className="
          text-[11px]
          text-indigo-600
          font-medium
          uppercase
          tracking-wide
          mb-2
        "
      >
        Question {question.number}
      </div>

      <p
        className="
          text-[15px]
          text-slate-900
          leading-relaxed
        "
      >
        {question.text}
      </p>
    </div>
  );
}

export default QuestionCard;