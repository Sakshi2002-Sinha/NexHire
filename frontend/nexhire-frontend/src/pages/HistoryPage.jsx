import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getErrorMessage } from "../api/axiosClient";
import { getHistory } from "../api/historyApi";
import HistorySessionRow from "../components/history/HistorySessionRow";
import { EmptyState, ErrorNotice, Loading } from "../components/ui/States";

function HistoryPage() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    getHistory()
      .then((data) => {
        if (!current) return;
        setSessions(data.sessions);
        setError(null);
      })
      .catch((err) => current && setError(getErrorMessage(err, "Could not load your history.")));
    return () => {
      current = false;
    };
  }, [attempt]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl">Interview history</h1>
        <p className="mt-1 text-muted">Review past answers and the feedback on each one.</p>
      </div>
      {error ? (
        <ErrorNotice message={error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : !sessions ? (
        <Loading label="Loading sessions..." />
      ) : sessions.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Your completed interviews will be saved here."
          action={<Link to="/interview" className="btn-primary">Start an interview</Link>} />
      ) : (
        <section className="card py-2">
          {sessions.map((session) => <HistorySessionRow key={session.session_id} session={session} />)}
        </section>
      )}
    </div>
  );
}

export default HistoryPage;
