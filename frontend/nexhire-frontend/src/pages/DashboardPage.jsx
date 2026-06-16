import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboardApi";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

function DashboardPage() {
  const [stats, setStats] = useState(null);

   const navigate = useNavigate();
   
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
        
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <h2>Loading...</h2>;
  }
  const formatRole = (role) =>
  role
    .replace(/-/g, " ")
    .replace(
      /\b\w/g,
      (c) => c.toUpperCase()
    );
    const roleChartData = Object.entries(
  stats.avg_score_by_role
).map(([role, score]) => ({
  role: role
    .replace(/-/g, " ")
    .replace(
      /\b\w/g,
      (c) => c.toUpperCase()
    ),
  score,
}));
  return (
   
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Welcome Back 👋
        </h1>

        <p className="mt-2 text-slate-500">
          Track your interview performance and continue improving.
        </p>
      </div>

      <button
        onClick={() => navigate("/interview")}
        className="
          rounded-xl
          bg-indigo-600
          px-5 py-3
          font-medium
          text-white
          hover:bg-indigo-700
          transition-colors
        "
      >
        Start Interview
      </button>
    </div>

    {/* Stats */}
<div className="grid gap-4 md:grid-cols-3">
  {Object.entries(
    stats.avg_score_by_role
  ).map(([role, score]) => (
    <div
      key={formatRole(role)}
      className="
        rounded-2xl
        border border-slate-200
        bg-white
        p-6
        shadow-sm
      "
    >
      <p className="text-sm text-slate-400">
        Role
      </p>

      <h3 className="mt-2 text-lg font-medium text-slate-900">
        {formatRole(role)}
      </h3>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold text-indigo-600">
          {score}
        </span>

        <span className="mb-1 text-sm text-slate-400">
          /10
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        Average interview score
      </p>
    </div>
  ))}
</div>

    {/* Chart */}
    <div className="grid gap-6 lg:grid-cols-2">

  {/* Score Trend */}
  <div
    className="
      rounded-2xl
      border border-slate-200
      bg-white
      p-6
      shadow-sm
    "
  >
    <h2 className="mb-4 text-[15px] font-medium text-slate-900">
      Score Trend
    </h2>

    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={stats.score_over_time}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString()
            }
          />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#4F46E5"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Role Comparison */}
  <div
    className="
      rounded-2xl
      border border-slate-200
      bg-white
      p-6
      shadow-sm
    "
  >
    <h2 className="mb-4 text-[15px] font-medium text-slate-900">
      Performance By Role
    </h2>

    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={roleChartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="role" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="score"
            fill="#4F46E5"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

</div>
<h2 className="mb-5 text-[15px] font-medium text-slate-900">
    Areas To Improve
  </h2>
    {/* Topics */}
  <div className="rounded-xl bg-slate-50 p-5">
  <ul className="space-y-3">
    {stats.weak_topics.map((item, index) => (
      <li
        key={index}
        className="flex gap-3"
      >
        <span className="mt-2 h-2 w-2 rounded-full bg-amber-500" />

        <span className="text-sm leading-6 text-slate-700">
          {item}
        </span>
      </li>
    ))}
  </ul>
</div>
  </div>
);
  
}

export default DashboardPage;