
import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { submitAnswer } from "../store/interviewSlice";

function AnswerInput() {
  const dispatch = useDispatch();

  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] =
    useState(false);

  const recognitionRef = useRef(null);

  const {
    sessionId,
    currentQuestion,
    isLoading,
  } = useSelector(
    (state) => state.interview
  );

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognitionRef.current =
      recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript =
        Array.from(event.results)
          .map(
            (result) =>
              result[0].transcript
          )
          .join(" ");

      setAnswer(transcript);
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleSubmit = () => {
    if (isLoading) return;

    if (!answer.trim()) return;

    dispatch(
      submitAnswer({
        session_id: sessionId,
        question_id: currentQuestion.id,
        answer,
      })
    );

    setAnswer("");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <textarea
        className="
          w-full
          h-[110px]
          border border-slate-200
          rounded-lg
          px-3.5 py-3
          text-[14px]
          resize-none
          bg-white
          text-slate-900
          outline-none
          focus:border-indigo-600
        "
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) =>
          setAnswer(e.target.value)
        }
      />

      <p className="text-xs text-slate-400 mt-1.5 mb-4">
        Provide a detailed answer with examples where possible.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {!isListening ? (
          <button
            type="button"
            onClick={startListening}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-lg
              border border-slate-300
              bg-white
              text-slate-700
              text-[13px]
              hover:bg-slate-50
            "
          >
            🎤 Speak Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={stopListening}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-lg
              bg-red-500
              text-white
              text-[13px]
              hover:bg-red-600
            "
          >
            ⏹ Stop Recording
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="
            inline-flex items-center gap-1.5
            px-4 py-2
            rounded-lg
            border border-indigo-600
            bg-indigo-600
            text-white
            text-[13px]
            hover:bg-indigo-700
            disabled:opacity-50
          "
        >
          {isLoading
            ? "Evaluating..."
            : "Submit Answer"}
        </button>
      </div>

      {isListening && (
        <div
          className="
            mt-3
            inline-flex items-center gap-2
            rounded-lg
            bg-red-50
            px-3 py-2
            text-sm
            text-red-600
          "
        >
          <span className="animate-pulse">
            🔴
          </span>
          Listening...
        </div>
      )}
    </div>
  );
}

export default AnswerInput;

