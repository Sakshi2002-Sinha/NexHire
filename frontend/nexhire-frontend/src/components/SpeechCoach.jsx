const PACE_TEXT = {
  slow: "A little slow. Aim for 120 to 160 words per minute.",
  good: "Comfortable, easy-to-follow pace.",
  fast: "A little fast. Slow down on key points.",
};

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-paper px-3 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function SpeechCoach({ speech }) {
  if (!speech) return null;
  const fillers = Object.entries(speech.filler_breakdown);
  return (
    <div className="mt-5 border-t border-line pt-5">
      <h3 className="text-sm font-semibold">Speech coach</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Words/min" value={speech.words_per_minute} />
        <Metric label="Filler words" value={speech.filler_words} />
        <Metric label="Long pauses" value={speech.long_pauses} />
        <Metric label="Talk time" value={`${speech.duration_seconds}s`} />
      </dl>
      <p className="mt-3 text-sm text-muted">
        {PACE_TEXT[speech.pace]}
        {fillers.length > 0 && ` Most used: ${fillers.map(([word, count]) => `"${word}" (${count})`).join(", ")}.`}
      </p>
    </div>
  );
}

export default SpeechCoach;
