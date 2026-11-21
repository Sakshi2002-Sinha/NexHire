import { Mic, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { submitAnswer } from "../store/interviewSlice";

const MAX_LENGTH = 8000;
const draftKey = (questionId) => `nexhire-draft-${questionId}`;

function AnswerInput() {
  const dispatch = useDispatch();
  const { sessionId, currentQuestion, pending } = useSelector((state) => state.interview);
  const isSubmitting = pending === "answer";
  // A draft survives refresh; sessionStorage is cleared when the tab closes.
  const [answer, setAnswer] = useState(() => sessionStorage.getItem(draftKey(currentQuestion.id)) || "");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem(draftKey(currentQuestion.id), answer);
  }, [answer, currentQuestion.id]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

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
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") setVoiceError("Microphone access was blocked.");
      else if (event.error !== "aborted" && event.error !== "no-speech") setVoiceError("Voice input stopped.");
    };
    recognition.onresult = (event) => {
      // Only new results are appended, so anything already typed is preserved.
      let spoken = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) spoken += event.results[i][0].transcript;
      }
      if (spoken) setAnswer((text) => `${text}${text && !text.endsWith(" ") ? " " : ""}${spoken.trim()}`);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async () => {
    const text = answer.trim();
    if (!text || isSubmitting) return;
    recognitionRef.current?.stop();
    const action = await dispatch(
      submitAnswer({ session_id: sessionId, question_id: currentQuestion.id, answer: text })
    );
    // Clear only on success, so a failed request never loses what the candidate wrote.
    if (submitAnswer.fulfilled.match(action)) sessionStorage.removeItem(draftKey(currentQuestion.id));
  };

  return (
    <section className="card">
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
