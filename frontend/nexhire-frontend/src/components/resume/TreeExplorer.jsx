import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useNavigate } from "react-router-dom";

import { startInterview } from "../../store/interviewSlice";
import { formatScore } from "../scoreFormat";
import { ErrorNotice } from "../ui/States";
import SkillTree from "./SkillTree";

const KIND_LABELS = {
  root: "Resume",
  section: "Section",
  project: "Project",
  experience: "Experience",
  skill_group: "Skill group",
  education: "Education",
  technology: "Technology",
  skill: "Skill",
};
const STATUS_TEXT = {
  untested: "Not tested yet",
  weak: "Weak",
  developing: "Developing",
  verified: "Verified",
};
const ROLES = ["SDE", "Backend Developer", "Frontend Developer", "ML Engineer", "Product Manager"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function DefensePanel({ node, resumeId }) {
  const dispatch = useDispatch();
  const store = useStore();
  const navigate = useNavigate();
  const pending = useSelector((state) => state.interview.pending);
  const [role, setRole] = useState("SDE");
  const [difficulty, setDifficulty] = useState("Medium");
  const [error, setError] = useState(null);

  const start = async () => {
    setError(null);
    const action = await dispatch(startInterview({ role, difficulty, resume_id: resumeId, focus_node_id: node.id }));
    // A 409 resumes the interview already in progress, so go there too.
    if (startInterview.fulfilled.match(action) || store.getState().interview.status === "active") {
      navigate("/interview");
    } else {
      setError(action.payload);
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-5">
      <h3 className="text-sm font-semibold">Resume Defense</h3>
      <p className="mt-1 text-sm text-muted">Three questions that test whether you can back this up.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select aria-label="Role" className="field px-2" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Difficulty" className="field px-2" value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}>
          {DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {error && <div className="mt-3"><ErrorNotice message={error} /></div>}
      <button onClick={start} disabled={pending === "start"} className="btn-primary mt-3 w-full">
        <ShieldCheck size={15} /> {pending === "start" ? "Preparing..." : `Defend ${node.label}`}
      </button>
    </div>
  );
}

function NodeDetails({ node, resumeId }) {
  const related = node.children.map((child) => child.label);
  return (
    <aside key={node.id} className="card enter lg:sticky lg:top-20" aria-live="polite">
      <p className="eyebrow">{KIND_LABELS[node.kind] || "Item"}</p>
      <h2 className="mt-1 text-xl leading-snug">{node.label}</h2>
      {node.status && (
        <p className="mt-2 text-sm font-medium text-accent-dark">
          {STATUS_TEXT[node.status]}{node.score != null && ` · ${formatScore(node.score)}/10`}
        </p>
      )}
      {node.summary && <p className="mt-3 text-sm leading-relaxed text-muted">{node.summary}</p>}

      {node.claims.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Claims an interviewer may challenge</h3>
          <ul className="mt-2 space-y-2">
            {node.claims.map((claim) => (
              <li key={claim} className="border-l-2 border-accent pl-3 text-sm leading-relaxed text-muted">{claim}</li>
            ))}
          </ul>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Includes</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {related.map((label) => (
              <span key={label} className="rounded-md bg-accent-soft px-2 py-0.5 text-xs text-accent-dark">{label}</span>
            ))}
          </div>
        </div>
      )}

      {node.can_defend && <DefensePanel node={node} resumeId={resumeId} />}

      {!node.can_defend && !node.summary && !related.length && (
        <p className="mt-3 text-sm text-muted">Listed on your resume.</p>
      )}
    </aside>
  );
}

function TreeExplorer({ tree, resumeId }) {
  const [selected, setSelected] = useState(tree);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card min-w-0 p-3">
        <SkillTree data={tree} selectedId={selected.id} onSelect={setSelected} />
      </section>
      <NodeDetails node={selected} resumeId={resumeId} />
    </div>
  );
}

export default TreeExplorer;
