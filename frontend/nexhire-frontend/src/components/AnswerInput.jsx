import { Mic, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { submitAnswer } from "../store/interviewSlice";

const MAX_LENGTH = 8000;
const LONG_PAUSE_MS = 2500;
const MIN_SPEECH_SECONDS = 3;
const draftKey = (questionId) => `nexhire-draft-${questionId}`;
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function AnswerInput() {
  const dispatch = useDispatch();
  const { sessionId, currentQuestion, pending } = useSelector((state) => state.interview);
  const isSubmitting = pending === "answer";
  // A draft survives refresh; sessionStorage is cleared when the tab closes.
  const [answer, setAnswer] = useState(() => sessionStorage.getItem(draftKey(currentQuestion.id)) || "");
  const [interim, setInterim] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);
  const timingRef = useRef({ spokenMs: 0, startedAt: null, lastSpeechAt: null, pauses: 0 });

  useEffect(() => {
    sessionStorage.setItem(draftKey(currentQuestion.id), answer);
  }, [answer, currentQuestion.id]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  useEffect(() => {
    if (!isListening) return undefined;
    const timer = setInterval(() => {
      const timing = timingRef.current;
      const current = timing.startedAt ? Date.now() - timing.startedAt : 0;
      setElapsed(Math.floor((timing.spokenMs + current) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [isListening]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input needs Chrome or Edge. You can still type your answer.");
      return;
    }
    setVoiceError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
      timingRef.current.startedAt = Date.now();
      timingRef.current.lastSpeechAt = Date.now();
      setIsListening(true);
    };
    recognition.onend = () => {
      const timing = timingRef.current;
      if (timing.startedAt) timing.spokenMs += Date.now() - timing.startedAt;
      timing.startedAt = null;
      setInterim("");
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") setVoiceError("Microphone access was blocked.");
      else if (event.error !== "aborted" && event.error !== "no-speech") setVoiceError("Voice input stopped.");
    };
    recognition.onresult = (event) => {
      const now = Date.now();
      if (now - timingRef.current.lastSpeechAt >= LONG_PAUSE_MS) timingRef.current.pauses += 1;
      timingRef.current.lastSpeechAt = now;
      // Only new results are appended, so anything already typed is preserved.
      let spoken = "";
      let pendingWords = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) spoken += event.results[i][0].transcript;
        else pendingWords += event.results[i][0].transcript;
      }
      setInterim(pendingWords);
      if (spoken) setAnswer((text) => `${text}${text && !text.endsWith(" ") ? " " : ""}${spoken.trim()}`);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const speechPayload = () => {
    const timing = timingRef.current;
    const current = timing.startedAt ? Date.now() - timing.startedAt : 0;
    const seconds = (timing.spokenMs + current) / 1000;
    if (seconds < MIN_SPEECH_SECONDS) return undefined;
    return { duration_seconds: Math.min(seconds, 1800), long_pauses: timing.pauses };
  };

  const handleSubmit = async () => {
    const text = answer.trim();
    if (!text || isSubmitting) return;
    const speech = speechPayload();
    recognitionRef.current?.stop();
    const action = await dispatch(
      submitAnswer({ session_id: sessionId, question_id: currentQuestion.id, answer: text, speech })
    );
    // Clear only on success, so a failed request never loses what the candidate wrote.
    if (submitAnswer.fulfilled.match(action)) sessionStorage.removeItem(draftKey(currentQuestion.id));
  };

  return (
    <section className="card enter">
      <label htmlFor="answer" className="mb-2 block text-sm font-medium">Your answer</label>
      <textarea
        id="answer"
        className="field min-h-44 resize-y leading-relaxed"
        placeholder="Explain your reasoning, the trade-offs, and an example if you have one."
        value={answer}
        maxLength={MAX_LENGTH}
        disabled={isSubmitting}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
        }}
      />
      {isListening && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-dark" aria-live="polite">
          <span className="recording-dot mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />
          <span className="font-medium tabular-nums">{clock(elapsed)}</span>
          <span className="min-w-0 flex-1 italic">{interim || "Listening..."}</span>
        </div>
      )}
      <div className="mt-1 text-right text-xs text-muted tabular-nums">{answer.length}/{MAX_LENGTH}</div>
      {voiceError && <p role="alert" className="mb-2 text-sm text-danger">{voiceError}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        {isListening ? (
          <button type="button" onClick={() => recognitionRef.current?.stop()} className="btn-secondary text-danger">
            <Square size={14} /> Stop recording
          </button>
        ) : (
          <button type="button" onClick={startListening} disabled={isSubmitting} className="btn-secondary">
            <Mic size={15} /> Speak answer
          </button>
        )}
        <button onClick={handleSubmit} disabled={isSubmitting || !answer.trim()} className="btn-primary">
          <Send size={15} /> {isSubmitting ? "Evaluating..." : "Submit answer"}
        </button>
      </div>
    </section>
  );
}

export default AnswerInput;
