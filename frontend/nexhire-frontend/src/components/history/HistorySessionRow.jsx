import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { formatScore } from "../scoreFormat";

const STATUS = {
  completed: ["Completed", "bg-accent-soft text-accent-dark"],
  active: ["In progress", "bg-warn-soft text-warn"],
  abandoned: ["Ended early", "bg-line/60 text-muted"],
};

function HistorySessionRow({ session }) {
  const [label, badge] = STATUS[session.status] || [session.status, "bg-line/60 text-muted"];
  const to = session.status === "active" ? "/interview" : `/history/${session.session_id}`;

  return (
    <Link to={to} className="flex items-center gap-4 border-b border-line px-1 py-4 transition-colors last:border-b-0 hover:bg-paper">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{session.role} · {session.difficulty}</p>
        <p className="mt-0.5 text-sm text-muted">
          {new Date(session.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          {" · "}{session.questions_answered} answered
        </p>
      </div>
      <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${badge}`}>{label}</span>
      <span className="w-14 text-right font-display text-lg font-bold tabular-nums">{formatScore(session.score)}</span>
      <ChevronRight size={16} className="text-muted" aria-hidden="true" />
    </Link>
  );
}

export default HistorySessionRow;
