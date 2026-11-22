import { ArrowLeft, Check, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

import { getErrorMessage } from "../api/axiosClient";
import { getInterviewDetails } from "../api/historyApi";
import PointList from "../components/PointList";
import ScoreBars from "../components/ScoreBars";
import { formatScore, scoreLabel } from "../components/scoreFormat";
import SpeechCoach from "../components/SpeechCoach";
import { ErrorNotice, Loading } from "../components/ui/States";

function HistoryDetailsPage() {
  const { sessionId } = useParams();
  const [state, setState] = useState({ id: null, session: null, error: null });

  useEffect(() => {
    let current = true;
    getInterviewDetails(sessionId)
      .then((session) => current && setState({ id: sessionId, session, error: null }))
      .catch((err) => current && setState({ id: sessionId, session: null, error: getErrorMessage(err, "Could not load this interview.") }));
    return () => {
      current = false;
    };
  }, [sessionId]);

  const back = (
    <Link to="/history" className="btn-quiet -ml-3"><ArrowLeft size={15} /> All interviews</Link>
  );
  if (state.id !== sessionId) return <Loading label="Loading interview..." />;
  if (state.error) return <div className="mx-auto max-w-3xl space-y-4">{back}<ErrorNotice message={state.error} /></div>;

  const { session } = state;
  const hasCompetencies = Object.values(session.competencies).some((value) => value != null);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {back}
      <div>
        <p className="eyebrow">
          {session.role} · {session.difficulty} · {new Date(session.created_at).toLocaleDateString()}
        </p>
        <h1 className="mt-1 text-3xl">{session.focus_label ? `Resume Defense: ${session.focus_label}` : "Interview review"}</h1>
      </div>

      <section className="card">
        <div className={hasCompetencies ? "grid gap-6 md:grid-cols-[170px_1fr]" : ""}>
          <div>
            <p className="eyebrow">Overall</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold">{formatScore(session.score)}</span>
              <span className="text-muted">/10</span>
            </div>
            <p className="mt-1 text-sm font-medium text-accent-dark">{scoreLabel(session.score)}</p>
          </div>
          {hasCompetencies && <ScoreBars scores={session.competencies} />}
        </div>
        {session.summary && (
          <div className="mt-5 border-t border-line pt-4 text-sm leading-relaxed">
            <ReactMarkdown>{session.summary}</ReactMarkdown>
          </div>
        )}
      </section>

      {session.questions.map((q) => (
        <article key={q.question_id} className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{q.is_followup ? "Follow-up" : `Question ${q.question_order}`}</p>
              <h2 className="mt-1 text-lg leading-snug">{q.question}</h2>
            </div>
            {q.score != null && <span className="shrink-0 font-display text-xl font-bold">{q.score}/10</span>}
          </div>
          {q.answer ? (
            <>
              <div className="mt-4 rounded-lg bg-paper p-4">
                <p className="eyebrow">Your answer</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{q.answer}</p>
              </div>
              {q.feedback && (
                <div className="mt-4 text-sm leading-relaxed text-muted"><ReactMarkdown>{q.feedback}</ReactMarkdown></div>
              )}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <PointList title="What worked" items={q.strengths} icon={Check} iconClass="text-accent" />
                <PointList title="What to improve" items={q.improvements} icon={TrendingUp} iconClass="text-warn" />
              </div>
              <SpeechCoach speech={q.speech} />
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Not answered.</p>
          )}
        </article>
      ))}
    </div>
  );
}

export default HistoryDetailsPage;
