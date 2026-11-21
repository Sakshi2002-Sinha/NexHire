import { Check, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

import PointList from "./PointList";
import ScoreBars from "./ScoreBars";
import { scoreLabel } from "./scoreFormat";

function FeedbackPanel({ feedback, bare = false }) {
  if (!feedback) return null;
  return (
    <section className={bare ? "" : "card"} aria-label="Answer feedback">
      <div className="grid gap-6 md:grid-cols-[150px_1fr]">
        <div>
          <p className="eyebrow">Score</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-5xl font-bold">{feedback.score}</span>
            <span className="text-muted">/10</span>
          </div>
          <p className="mt-1 text-sm font-medium text-accent-dark">{scoreLabel(feedback.score)}</p>
        </div>
        <ScoreBars scores={feedback} />
      </div>
      <div className="mt-6 border-t border-line pt-5 text-sm leading-relaxed">
        <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <PointList title="What worked" items={feedback.strengths} icon={Check} iconClass="text-accent" />
        <PointList title="What to improve" items={feedback.improvements} icon={TrendingUp} iconClass="text-warn" />
      </div>
    </section>
  );
}

export default FeedbackPanel;
