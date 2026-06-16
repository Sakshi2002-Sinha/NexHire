import { useState } from "react";
import { useDispatch } from "react-redux";
import { Code2, Brain, Briefcase } from "lucide-react";
import { startInterview } from "../store/interviewSlice";

import { uploadResumeApi } from "../api/interviewApi";

const roles = [
  {
    name: "SDE",
    description: "DSA, System Design, OOP",
    icon: Code2,
  },
  {
    name: "ML Engineer",
    description: "ML Systems, Statistics",
    icon: Brain,
  },
  {
    name: "Product Manager",
    description: "Product Sense, Metrics",
    icon: Briefcase,
  },
];

const difficulties = [
  "Easy",
  "Medium",
  "Hard",
];

function RoleSelector() {
  const dispatch = useDispatch();
  const [resume, setResume] = useState(null);
const [uploading, setUploading] = useState(false);

  const [role, setRole] =
    useState("SDE");

  const [difficulty, setDifficulty] =
    useState("Medium");
  
  const handleResumeUpload = async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    setUploading(true);

    const formData = new FormData();

    formData.append("file", file);

    const data = await uploadResumeApi(formData);

    setResume(data);
  } catch (err) {
    console.error(err);
  } finally {
    setUploading(false);
  }
};  

  const handleStart = () => {
    dispatch(
      startInterview({
        role,
        difficulty,
        resume_id: resume?.resume_id,
      })
    );
  };

  return (
    <div className="bg-white
    border border-slate-200/70
    rounded-2xl
    px-6 py-5
    "
    >
      <div>
        <h2 className="text-xl font-semibold">
          Start New Interview
        </h2>

        <p className="mt-1 text-slate-500">
          Select role and difficulty
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-5">
        {roles.map((r) => {
          const Icon = r.icon;

          return (
            <button
              key={r.name}
              onClick={() =>
                setRole(r.name)
              }
              className={`
                  border border-slate-200
                  rounded-2xl
                  p-3.5 px-4
                  text-left
                  cursor-pointer
                  transition-all
                  ${
                    role === r.name
                      ? "border-indigo-600 bg-indigo-50"
                      : "hover:border-indigo-400 hover:bg-indigo-50"
                  }
                  `}
            >
              <Icon className="mb-3 h-6 w-6 text-indigo-600" />

              <h3 className="font-semibold">
                {r.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {r.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-5">
        {difficulties.map((level) => (
          <button
            key={level}
            onClick={() =>
              setDifficulty(level)
            }
            className={`
              flex-1 py-2
              border border-slate-200
              rounded-lg
              text-[13px]
              transition-all
              ${
                difficulty === level
                  ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-medium"
                  : "text-slate-500"
              }
              `}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="space-y-3 mt-5">
  <label className="block font-medium text-slate-700">
    Upload Resume (Optional)
  </label>

  <input
    type="file"
    accept=".pdf"
    onChange={handleResumeUpload}
    className="
      block w-full
      rounded-lg
      border border-slate-300
      p-2
      text-sm
    "
  />

  {uploading && (
    <p className="text-sm text-slate-500">
      Uploading resume...
    </p>
  )}
  {resume && (
  <div
    className="
      mt-4
      rounded-xl
      border border-green-200
      bg-green-50
      p-4
    "
  >
    <h3 className="font-semibold text-green-700">
      ✓ Resume Loaded
    </h3>

    <div className="mt-3 text-sm">
      Skills Found: {resume.skills?.length || 0}
    </div>

    <div className="text-sm">
      Projects Found: {resume.projects?.length || 0}
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      {resume.skills?.map((skill) => (
        <span
          key={skill}
          className="
            rounded-md
            bg-blue-100
            px-2
            py-1
            text-xs
          "
        >
          {skill}
        </span>
      ))}
    </div>
  </div>
)}
</div>
      <button
        onClick={handleStart}
        className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
      >
        Start Interview
      </button>
    </div>
  );
}

export default RoleSelector;