import { useNavigate } from "react-router-dom";

function HistorySessionRow({ session }) {
  const navigate = useNavigate();

  const score = Number(session.score || 0);

  const badgeClass =
    session.status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : session.status === "active"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-4 last:border-b-0">
      <div>
        <h3 className="font-medium">
          {session.role} — {session.difficulty}
        </h3>

        <p className="text-sm text-slate-500">
          {new Date(
            session.created_at
          ).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded bg-slate-200">
            <div
              className="h-full bg-indigo-600"
              style={{
                width: `${score * 10}%`,
              }}
            />
          </div>

          <span className="text-sm font-medium text-indigo-600">
            {score}
          </span>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
        >
          {session.status}
        </span>

        <button
          onClick={() =>
            navigate(
              `/history/${session.session_id}`
            )
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          View
        </button>
      </div>
    </div>
  );
}

export default HistorySessionRow;