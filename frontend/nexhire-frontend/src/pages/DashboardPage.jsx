import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { getErrorMessage } from "../api/axiosClient";
import { getDashboardStats } from "../api/dashboardApi";
import ScoreBars from "../components/ScoreBars";
import { formatScore } from "../components/scoreFormat";
import { EmptyState, ErrorNotice, Loading } from "../components/ui/States";

const ACCENT = "#0f766e";
const GRID = "#e9e6dd";
const AXIS = { fontSize: 12, fill: "#5b6663" };
const TOOLTIP = { borderRadius: 8, border: "1px solid #dfdcd2", fontSize: 13 };
const LABELS = {
  technical_depth: "Technical depth",
  problem_solving: "Problem solving",
  communication: "Communication",
  confidence: "Confidence",
};

const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Stat({ label, value, suffix }) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">
        {value}
        {suffix && <span className="ml-1 font-sans text-sm font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

function DashboardPage() {
  const name = useSelector((state) => state.auth.user?.name);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    getDashboardStats()
      .then((data) => {
        if (!current) return;
        setStats(data);
        setError(null);
      })
      .catch((err) => current && setError(getErrorMessage(err, "Could not load your dashboard.")));
    return () => {
      current = false;
    };
  }, [attempt]);

  if (error) return <ErrorNotice message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!stats) return <Loading label="Loading your progress..." />;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl">{name ? `Welcome back, ${name.split(" ")[0]}` : "Your progress"}</h1>
        <p className="mt-1 text-muted">See where you are improving and what to practice next.</p>
      </div>
      <Link to="/interview" className="btn-primary">Start interview</Link>
    </div>
  );

  if (stats.total_interviews === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState title="No completed interviews yet"
          body="Finish your first mock interview and your score trend, skills, and focus areas will appear here."
          action={<Link to="/interview" className="btn-primary">Start your first interview</Link>} />
      </div>
    );
  }

  const ranked = Object.entries(stats.competencies).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1]);
  const focus = ranked[0] ? LABELS[ranked[0][0]] : "–";
  const roles = Object.entries(stats.avg_score_by_role).map(([role, score]) => ({ role, score }));
  const trend = stats.score_over_time.map((point) => ({ ...point, label: shortDate(point.date) }));

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Interviews" value={stats.total_interviews} />
        <Stat label="Average" value={formatScore(stats.average_score)} suffix="/10" />
        <Stat label="Best" value={formatScore(stats.best_score)} suffix="/10" />
        <div className="card p-5">
          <p className="eyebrow">Focus skill</p>
          <p className="mt-3 font-display text-xl font-bold">{focus}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card">
          <h2 className="text-lg">Score trend</h2>
          <div className="mt-4 h-64" role="img"
            aria-label={`Line chart of your last ${trend.length} interview scores out of 10`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP} formatter={(value, _n, item) => [`${value}/10`, item.payload.role]} />
                <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2}
                  dot={{ r: 4, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg">Skills</h2>
          <div className="mt-5"><ScoreBars scores={stats.competencies} /></div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg">Average by role</h2>
          <div className="mt-4" style={{ height: Math.max(120, roles.length * 48) }} role="img"
            aria-label={roles.map((r) => `${r.role}: ${r.score} out of 10`).join(", ")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roles} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 10]} ticks={[0, 5, 10]} tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="role" width={124} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f6f4ee" }} contentStyle={TOOLTIP} formatter={(v) => [`${v}/10`, "Average"]} />
                <Bar dataKey="score" fill={ACCENT} barSize={16} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg">Topics to revisit</h2>
          {stats.weak_topics.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.weak_topics.map((topic) => (
                <span key={topic} className="rounded-md bg-warn-soft px-2.5 py-1 text-sm capitalize text-warn">{topic}</span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Topics appear here after your next interview.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
