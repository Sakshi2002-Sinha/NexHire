import { Check, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { resetInterview } from "../store/interviewSlice";
import PointList from "./PointList";
import ScoreBars from "./ScoreBars";
import { formatScore, scoreLabel } from "./scoreFormat";

function SessionSummary({ result, role, difficulty }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const leaveTo = (path) => {
    dispatch(resetInterview());
    if (path) navigate(path);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="eyebrow">{role} · {difficulty}</p>
        <h1 className="mt-1 text-3xl">Interview report</h1>
      </div>

      <section className="card">
        <div className="grid gap-6 md:grid-cols-[170px_1fr]">
          <div>
            <p className="eyebrow">Overall</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-6xl font-bold">{formatScore(result.total_score)}</span>
              <span className="text-muted">/10</span>
            </div>
            <p className="mt-1 text-sm font-medium text-accent-dark">{scoreLabel(result.total_score)}</p>
          </div>
          <ScoreBars scores={result.competencies} />
        </div>
        {result.summary && (
          <div className="mt-6 border-t border-line pt-5 text-sm leading-relaxed">
            <ReactMarkdown>{result.summary}</ReactMarkdown>
          </div>
        )}
      </section>

      <section className="card grid gap-6 md:grid-cols-2">
        <PointList title="Top strengths" items={result.strengths} icon={Check} iconClass="text-accent" />
        <PointList title="Focus next" items={result.improvements} icon={TrendingUp} iconClass="text-warn" />
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Link to={`/history/${result.session_id}`} onClick={() => leaveTo()} className="btn-quiet">
          Review answers
        </Link>
        <button onClick={() => leaveTo("/dashboard")} className="btn-secondary">Dashboard</button>
        <button onClick={() => leaveTo()} className="btn-primary">New interview</button>
      </div>
    </div>
  );
}

export default SessionSummary;
