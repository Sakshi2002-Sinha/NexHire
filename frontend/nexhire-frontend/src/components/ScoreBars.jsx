import { formatScore } from "./scoreFormat";

const DIMENSIONS = [
  ["technical_depth", "Technical depth"],
  ["problem_solving", "Problem solving"],
  ["communication", "Communication"],
  ["confidence", "Confidence"],
];

function ScoreBars({ scores }) {
  return (
    <dl className="space-y-3">
      {DIMENSIONS.map(([key, label]) => {
        const value = scores?.[key];
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold tabular-nums">{formatScore(value)}/10</dd>
            </div>
            <div className="h-1.5 rounded-full bg-line/60" aria-hidden="true">
              <div className="bar-fill h-full rounded-full bg-accent" style={{ width: `${(value ?? 0) * 10}%` }} />
            </div>
          </div>
        );
      })}
    </dl>
  );
}

export default ScoreBars;
