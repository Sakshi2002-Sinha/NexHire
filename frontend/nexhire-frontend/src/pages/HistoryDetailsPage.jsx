import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getInterviewDetails } from "../api/historyApi";

function HistoryDetailPage() {
const { sessionId } = useParams();
const navigate = useNavigate();

const [session, setSession] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
const fetchDetails = async () => {
try {
const data =
await getInterviewDetails(
sessionId
);


    setSession(data);
  } catch (error) {
    console.error(
      "Failed to load interview:",
      error
    );
  } finally {
    setLoading(false);
  }
};

fetchDetails();


}, [sessionId]);

if (loading) {
return ( <div className="flex items-center justify-center py-16"> <p className="text-slate-500">
Loading interview details... </p> </div>
);
}

if (!session) {
return ( <div className="rounded-2xl border border-slate-200 bg-white p-6"> <h2 className="text-lg font-medium text-slate-900">
Interview details not found </h2> </div>
);
}

const score =
Number(session.score || 0);

return ( <div className="space-y-6">
{/* Header */} <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> <div> <h1 className="text-2xl font-medium text-slate-900">
Interview Details </h1>

      <p className="mt-1 text-sm text-slate-500">
        Review questions, answers and feedback
      </p>
    </div>

    <button
      onClick={() =>
        navigate("/history")
      }
      className="
        inline-flex items-center
        px-4 py-2
        rounded-lg
        border border-slate-200
        text-[13px]
        hover:bg-slate-50
      "
    >
      Back to History
    </button>
  </div>

  {/* Session Overview */}
  <div
    className="
      bg-white
      border border-slate-200/70
      rounded-2xl
      p-6
    "
  >
    <div className="grid gap-4 md:grid-cols-4">
      <div>
        <p className="text-xs text-slate-400">
          Role
        </p>

        <p className="mt-1 font-medium text-slate-900">
          {session.role}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Difficulty
        </p>

        <p className="mt-1 font-medium text-slate-900">
          {session.difficulty}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Status
        </p>

        <span
          className="
            mt-1 inline-flex
            rounded-full
            bg-emerald-100
            px-2.5 py-1
            text-xs
            text-emerald-700
          "
        >
          {session.status}
        </span>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Overall Score
        </p>

        <p className="mt-1 text-xl font-medium text-indigo-600">
          {score}
        </p>
      </div>
    </div>
  </div>

  {/* Questions */}
  <div className="space-y-5">
    {session.questions?.map((q) => (
      <div
        key={q.question_id}
        className="
          bg-white
          border border-slate-200/70
          rounded-2xl
          p-6
        "
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">
            Question {q.question_order}
          </h2>

          <span
            className="
              rounded-full
              bg-indigo-50
              px-3 py-1
              text-xs
              text-indigo-600
            "
          >
            Score: {q.score}
          </span>
        </div>

        {/* Question */}
        <div className="rounded-xl bg-indigo-50 p-4">
          <p className="text-xs uppercase tracking-wide text-indigo-600">
            Question
          </p>

          <p className="mt-2 text-sm text-slate-900">
            {q.question}
          </p>
        </div>

        {/* Answer */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Your Answer
          </p>

          <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
            {q.answer}
          </p>
        </div>

        {/* Feedback */}
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            AI Feedback
          </p>

          <p className="mt-2 text-sm text-slate-700">
            {q.feedback}
          </p>
        </div>

        {/* Strengths */}
        {!!q.strengths?.length && (
          <>
            <h3 className="mt-4 text-sm font-medium text-slate-900">
              Strengths
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              {q.strengths.map(
                (
                  strength,
                  index
                ) => (
                  <span
                    key={index}
                    className="
                      rounded-full
                      bg-emerald-100
                      px-3 py-1
                      text-xs
                      text-emerald-700
                    "
                  >
                    {strength}
                  </span>
                )
              )}
            </div>
          </>
        )}

        {/* Improvements */}
        {!!q.improvements?.length && (
          <>
            <h3 className="mt-4 text-sm font-medium text-slate-900">
              Improvements
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              {q.improvements.map(
                (
                  improvement,
                  index
                ) => (
                  <span
                    key={index}
                    className="
                      rounded-full
                      bg-red-100
                      px-3 py-1
                      text-xs
                      text-red-700
                    "
                  >
                    {improvement}
                  </span>
                )
              )}
            </div>
          </>
        )}
      </div>
    ))}
  </div>
</div>


);
}

export default HistoryDetailPage;
