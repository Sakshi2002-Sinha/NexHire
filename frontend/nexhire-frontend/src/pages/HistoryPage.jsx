import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getHistory,
  getInterviewDetails,
} from "../api/historyApi";

// import Navbar from "../components/Navbar";
import HistorySessionRow from "../components/history/HistorySessionRow";

function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  

  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();

        setSessions(data.sessions);
      } catch (error) {
        console.error(
          "Failed to fetch history:",
          error
        );
      }
    };

    fetchHistory();
  }, []);

  
  return (
    <div>
  <h1 className="text-3xl font-bold">
    Interview History
  </h1>

  <p className="mt-1 text-slate-500">
    Review previous interview sessions
  </p>

  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="font-semibold">
        All Sessions
      </h2>
    </div>

    {sessions.length === 0 ? (
      <p className="text-slate-500">
        No interview sessions found.
      </p>
    ) : (
      sessions.map((session) => (
        <HistorySessionRow
          key={session.session_id}
          session={session}
        />
      ))
    )}
  </div>
</div>
  );
}

export default HistoryPage;