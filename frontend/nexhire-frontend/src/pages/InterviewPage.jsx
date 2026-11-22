import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import AnswerInput from "../components/AnswerInput";
import FeedbackPanel from "../components/FeedbackPanel";
import QuestionCard from "../components/QuestionCard";
import RoleSelector from "../components/RoleSelector";
import SessionSummary from "../components/SessionSummary";
import { ErrorNotice, Loading } from "../components/ui/States";
import { endInterview, loadNextQuestion, restoreInterview } from "../store/interviewSlice";

function InterviewPage() {
  const dispatch = useDispatch();
  const {
    status, pending, error, sessionId, role, difficulty, focusLabel, maxQuestions,
    currentQuestion, nextQuestion, lastFeedback, previousFeedback, result,
  } = useSelector((state) => state.interview);

  // After a refresh Redux is empty, so ask the server for the interview in progress.
  useEffect(() => {
    if (status === "unknown") dispatch(restoreInterview());
  }, [dispatch, status]);

  // Each new question and the final report should start at the top of the page.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [currentQuestion?.id, status]);

  const finish = () => dispatch(endInterview({ session_id: sessionId }));
  const quit = () => {
    if (window.confirm("End this interview now? Answered questions will still be scored.")) finish();
  };

  if (status === "unknown" || status === "restoring") return <Loading label="Checking for an interview in progress..." />;
  if (status === "completed") return <SessionSummary result={result} role={role} difficulty={difficulty} />;
  if (status === "idle") return <RoleSelector />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">
            {focusLabel ? `Resume Defense · ${focusLabel}` : `${role} · ${difficulty}`}
          </p>
          <p className="mt-1 text-sm text-muted">Question {currentQuestion.number} of {maxQuestions}</p>
        </div>
        <button onClick={quit} disabled={!!pending} className="btn-quiet">End interview</button>
      </div>

      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={maxQuestions}
        aria-valuenow={currentQuestion.number} aria-label="Interview progress">
        {Array.from({ length: maxQuestions }, (_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < currentQuestion.number ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>

      <ErrorNotice message={error} />

      {previousFeedback && !lastFeedback && (
        <details className="card py-4">
          <summary className="cursor-pointer text-sm font-medium">
            Feedback on your previous answer ({previousFeedback.score}/10)
          </summary>
          <div className="mt-4"><FeedbackPanel feedback={previousFeedback} bare /></div>
        </details>
      )}

      <QuestionCard question={currentQuestion} />

      {lastFeedback ? (
        <>
          <FeedbackPanel feedback={lastFeedback} />
          <div className="flex justify-end">
            {nextQuestion ? (
              <button onClick={() => dispatch(loadNextQuestion())} className="btn-primary">Next question</button>
            ) : (
              <button onClick={finish} disabled={pending === "end"} className="btn-primary">
                {pending === "end" ? "Preparing your report..." : "Finish and see report"}
              </button>
            )}
          </div>
        </>
      ) : (
        <AnswerInput key={currentQuestion.id} />
      )}
    </div>
  );
}

export default InterviewPage;
