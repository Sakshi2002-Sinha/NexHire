import { FileUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { getErrorMessage } from "../api/axiosClient";
import { uploadResumeApi } from "../api/interviewApi";
import { analyzeResumeApi, getResumeTreeApi, listResumesApi } from "../api/resumeApi";
import TreeExplorer from "../components/resume/TreeExplorer";
import { EmptyState, ErrorNotice, Loading } from "../components/ui/States";

const MAX_BYTES = 5 * 1024 * 1024;
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

function UploadButton({ busy, onFile, primary = false }) {
  return (
    <label className={`${primary ? "btn-primary" : "btn-secondary"} cursor-pointer focus-within:ring-2 focus-within:ring-accent ${busy ? "pointer-events-none opacity-50" : ""}`}>
      <FileUp size={15} />
      {busy ? "Building your tree..." : "Upload resume"}
      <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }} />
    </label>
  );
}

function ResumePage() {
  const [resumes, setResumes] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // upload | analyze

  useEffect(() => {
    let current = true;
    listResumesApi()
      .then((rows) => {
        if (!current) return;
        setResumes(rows);
        setSelectedId(rows[0]?.resume_id ?? null);
      })
      .catch((err) => current && setError(getErrorMessage(err, "Could not load your resumes.")));
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return undefined;
    let current = true;
    getResumeTreeApi(selectedId)
      .then((data) => current && setTreeData(data))
      .catch((err) => current && setError(getErrorMessage(err, "Could not load this resume.")));
    return () => {
      current = false;
    };
  }, [selectedId]);

  const handleUpload = async (file) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Resume must be 5 MB or smaller.");
      return;
    }
    setBusy("upload");
    try {
      const uploaded = await uploadResumeApi(file);
      setResumes(await listResumesApi());
      setSelectedId(uploaded.resume_id);
    } catch (err) {
      setError(getErrorMessage(err, "Could not read this resume."));
    } finally {
      setBusy(null);
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    setBusy("analyze");
    try {
      const data = await analyzeResumeApi(selectedId);
      setTreeData(data);
      if (data.source === "basic") setError("AI analysis is unavailable right now. Please try again shortly.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not analyze this resume."));
    } finally {
      setBusy(null);
    }
  };

  const tree = treeData?.resume_id === selectedId ? treeData : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Resume skill tree</h1>
          <p className="mt-1 text-muted">Pick any project or skill, then prove you can defend it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resumes?.length > 1 && (
            <select aria-label="Choose resume" className="field w-auto max-w-56" value={selectedId ?? ""}
              onChange={(e) => {
                setError(null);
                setSelectedId(e.target.value);
              }}>
              {resumes.map((r) => (
                <option key={r.resume_id} value={r.resume_id}>
                  {r.filename} ({new Date(r.uploaded_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
          {resumes?.length > 0 && <UploadButton busy={busy === "upload"} onFile={handleUpload} />}
        </div>
      </div>

      <ErrorNotice message={error} />

      {!resumes && !error && <Loading label="Loading your resumes..." />}

      {resumes?.length === 0 && (
        <EmptyState title="Map your resume"
          body="Upload a text-based PDF to see your projects, experience, and skills as an interactive tree. Your email, phone number, and links are removed before AI analysis."
          action={<UploadButton primary busy={busy === "upload"} onFile={handleUpload} />} />
      )}

      {selectedId && !tree && !error && <Loading label="Loading your tree..." />}

      {tree && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {plural(tree.stats.projects, "project")} · {plural(tree.stats.experience, "role")} ·{" "}
              {plural(tree.stats.skills, "skill")}
            </p>
            {tree.source === "basic" && (
              <button onClick={handleAnalyze} disabled={!!busy} className="btn-secondary">
                <Sparkles size={15} /> {busy === "analyze" ? "Analyzing..." : "Build detailed tree with AI"}
              </button>
            )}
          </div>
          <TreeExplorer key={`${tree.resume_id}-${tree.source}`} tree={tree.tree} resumeId={tree.resume_id} />
        </>
      )}
    </div>
  );
}

export default ResumePage;
