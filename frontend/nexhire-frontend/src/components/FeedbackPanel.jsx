function FeedbackPanel({ feedback }) {
  if (!feedback) return null;

  const metrics = [
    {
      label: "Communication",
      value: feedback.communication,
    },
    {
      label: "Technical Depth",
      value: feedback.technical_depth,
    },
    {
      label: "Problem Solving",
      value: feedback.problem_solving,
    },
    {
      label: "Confidence",
      value: feedback.confidence,
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Overall Score
        </h3>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl font-bold text-indigo-600">
            {feedback.score}
          </span>

          <span className="mb-2 text-slate-400">
            /10
          </span>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">
                {metric.label}
              </span>

              <span className="font-medium">
                {metric.value}/10
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-indigo-600"
                style={{
                  width: `${metric.value * 10}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h4 className="mb-2 font-semibold">
          Feedback
        </h4>

        <p className="text-slate-600">
          {feedback.feedback}
        </p>
      </div>

      <div className="mb-6">
        <h4 className="mb-2 font-semibold text-emerald-700">
          Strengths
        </h4>

        <ul className="space-y-2">
          {feedback.strengths?.map(
            (item, index) => (
              <li
                key={index}
                className="text-slate-600"
              >
                ✓ {item}
              </li>
            )
          )}
        </ul>
      </div>

      <div>
        <h4 className="mb-2 font-semibold text-amber-700">
          Improvements
        </h4>

        <ul className="space-y-2">
          {feedback.improvements?.map(
            (item, index) => (
              <li
                key={index}
                className="text-slate-600"
              >
                • {item}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

export default FeedbackPanel;