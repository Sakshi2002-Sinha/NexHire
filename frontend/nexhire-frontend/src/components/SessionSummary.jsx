import { useNavigate } from "react-router-dom";

function SessionSummary({
  totalScore,
  strengths,
  improvements,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="
        bg-white
        border border-slate-200/70
        rounded-2xl
        px-6 py-6
      "
    >
      <div className="text-center">
        <h2 className="text-xl font-medium text-slate-900">
          Interview Complete
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Session evaluation summary
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <div
          className="
            w-24 h-24
            rounded-full
            bg-indigo-50
            flex items-center justify-center
            text-3xl
            font-medium
            text-indigo-600
          "
        >
          {totalScore}
        </div>
      </div>

      {!!strengths?.length && (
        <>
          <h3 className="mt-6 text-[15px] font-medium text-slate-900">
            Strengths
          </h3>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {strengths.map((item, idx) => (
              <span
                key={idx}
                className="
                  px-2.5 py-[3px]
                  rounded-full
                  text-xs
                  bg-emerald-100
                  text-emerald-800
                "
              >
                {item}
              </span>
            ))}
          </div>
        </>
      )}

      {!!improvements?.length && (
        <>
          <h3 className="mt-5 text-[15px] font-medium text-slate-900">
            Improvements
          </h3>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {improvements.map((item, idx) => (
              <span
                key={idx}
                className="
                  px-2.5 py-[3px]
                  rounded-full
                  text-xs
                  bg-red-100
                  text-red-800
                "
              >
                {item}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="
            flex-1
            px-4 py-2
            rounded-lg
            border border-slate-200
            text-[13px]
            hover:bg-slate-50
          "
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/interview")}
          className="
            flex-1
            px-4 py-2
            rounded-lg
            border border-indigo-600
            bg-indigo-600
            text-white
            text-[13px]
            hover:bg-indigo-700
          "
        >
          New Interview
        </button>
      </div>
    </div>
  );
}

export default SessionSummary;