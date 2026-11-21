import { Brain, Briefcase, Code2, FileUp, Layout, Server } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getErrorMessage } from "../api/axiosClient";
import { uploadResumeApi } from "../api/interviewApi";
import { startInterview } from "../store/interviewSlice";
import { ErrorNotice } from "./ui/States";

const ROLES = [
  { name: "SDE", description: "DSA, system design, OOP", icon: Code2 },
  { name: "Backend Developer", description: "APIs, databases, scaling", icon: Server },
  { name: "Frontend Developer", description: "React, performance, UX", icon: Layout },
  { name: "ML Engineer", description: "ML systems, statistics", icon: Brain },
  { name: "Product Manager", description: "Product sense, metrics", icon: Briefcase },
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const MAX_BYTES = 5 * 1024 * 1024;

function RoleSelector() {
  const dispatch = useDispatch();
  const { pending, error } = useSelector((state) => state.interview);
  const [role, setRole] = useState("SDE");
  const [difficulty, setDifficulty] = useState("Medium");
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const isStarting = pending === "start";

  const handleResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setResume(null);
    if (file.size > MAX_BYTES) {
      setUploadError("Resume must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      setResume(await uploadResumeApi(file));
    } catch (err) {
      setUploadError(getErrorMessage(err, "Could not read this resume."));
    } finally {
      setUploading(false);
    }
  };

  const start = () => dispatch(startInterview({ role, difficulty, resume_id: resume?.resume_id ?? null }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl">Set up your interview</h1>
        <p className="mt-1 text-muted">Five questions. Weak answers get a follow-up.</p>
      </div>

      <section className="card space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Role</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map(({ name, description, icon: Icon }) => (
              <button key={name} type="button" onClick={() => setRole(name)} aria-pressed={role === name}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  role === name ? "border-accent bg-accent-soft" : "border-line hover:bg-paper"
                }`}>
                <Icon size={18} className="shrink-0 text-accent-dark" />
                <span>
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="block text-xs text-muted">{description}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Difficulty</legend>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((level) => (
              <button key={level} type="button" onClick={() => setDifficulty(level)} aria-pressed={difficulty === level}
                className={`rounded-lg border py-2 text-sm transition-colors ${
                  difficulty === level ? "border-accent bg-accent-soft font-semibold text-accent-dark" : "border-line text-muted hover:bg-paper"
                }`}>
                {level}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="mb-2 text-sm font-semibold">Resume <span className="font-normal text-muted">(optional)</span></p>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line p-4 text-sm text-muted transition-colors focus-within:border-accent hover:bg-paper">
            <FileUp size={18} className="shrink-0" />
            <span>{uploading ? "Reading your resume..." : resume ? resume.filename : "Upload a text-based PDF, up to 5 MB"}</span>
            <input type="file" accept="application/pdf,.pdf" onChange={handleResume} className="sr-only" />
          </label>
          {resume && (
            <div className="mt-3">
              <p className="text-sm text-muted">
                Found {resume.skills.length} skills and {resume.projects.length} projects to ask about.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resume.skills.map((skill) => (
                  <span key={skill} className="rounded-md bg-accent-soft px-2 py-0.5 text-xs text-accent-dark">{skill}</span>
                ))}
              </div>
            </div>
          )}
          {uploadError && <div className="mt-3"><ErrorNotice message={uploadError} /></div>}
        </div>

        <ErrorNotice message={error} />
        <button onClick={start} disabled={isStarting || uploading} className="btn-primary w-full py-3">
          {isStarting ? "Preparing your first question..." : "Start interview"}
        </button>
      </section>
    </div>
  );
}

export default RoleSelector;
