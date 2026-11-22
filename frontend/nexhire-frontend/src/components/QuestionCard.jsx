import { Square, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

const AUTO_READ_KEY = "nexhire-auto-read";
const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

function speak(text, onChange) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.onstart = () => onChange(true);
  utterance.onend = () => onChange(false);
  utterance.onerror = () => onChange(false);
  window.speechSynthesis.speak(utterance);
}

function QuestionCard({ question }) {
  const [speaking, setSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(() => localStorage.getItem(AUTO_READ_KEY) === "true");
  const text = question?.text;

  useEffect(() => {
    if (!text || !canSpeak()) return undefined;
    if (autoRead) speak(text, setSpeaking);
    return () => window.speechSynthesis.cancel();
  }, [text, autoRead]);

  if (!question) return null;

  const toggleAutoRead = (event) => {
    localStorage.setItem(AUTO_READ_KEY, String(event.target.checked));
    setAutoRead(event.target.checked);
  };

  return (
    <section key={question.id} className="card enter border-l-4 border-l-accent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">{question.is_followup ? "Follow-up" : `Question ${question.number}`}</p>
        {canSpeak() && (
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={autoRead} onChange={toggleAutoRead} className="accent-accent" />
              Auto-read
            </label>
            <button
              type="button"
              onClick={() => {
                if (speaking) {
                  window.speechSynthesis.cancel();
                  setSpeaking(false);
                } else {
                  speak(question.text, setSpeaking);
                }
              }}
              className="btn-quiet px-2 py-1 text-xs"
            >
              {speaking ? <Square size={13} /> : <Volume2 size={14} />}
              {speaking ? "Stop" : "Read aloud"}
            </button>
          </div>
        )}
      </div>
      <h1 className="mt-2 text-xl leading-snug sm:text-2xl">{question.text}</h1>
    </section>
  );
}

export default QuestionCard;
