import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";

import RoleSelector from "../components/RoleSelector";
import QuestionCard from "../components/QuestionCard";
import AnswerInput from "../components/AnswerInput";
import FeedbackPanel from "../components/FeedbackPanel";
import SessionSummary from "../components/SessionSummary";

import {
endInterview,
loadNextQuestion,
} from "../store/interviewSlice";

function InterviewPage() {
const dispatch = useDispatch();

const {
currentQuestion,
lastFeedback,
nextQuestion,
sessionId,
sessionStatus,
totalScore,
summary,
isLoading,
} = useSelector((state) => state.interview);

const [resume, setResume] = useState(null);
const [uploading, setUploading] = useState(false);

const handleResumeUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const formData = new FormData();

  formData.append("file", file);

  try {
    setUploading(true);

    const data = await uploadResumeApi(formData);

    setResume(data);

  } catch (err) {
    console.error(err);
  } finally {
    setUploading(false);
  }
};

// Completed Interview
if (sessionStatus === "completed") {
return (
<SessionSummary
totalScore={totalScore}
strengths={summary?.strengths || []}
improvements={summary?.improvements || []}
/>
);
}

return ( <div className="space-y-6">
{/* Page Header */} <div className="mb-1"> <h1 className="text-2xl font-medium text-slate-900">
Mock Interview </h1>


    <p className="mt-1 text-sm text-slate-500">
      Practice with AI-generated questions
    </p>
  </div>

  {/* Loading State */}
  {isLoading && (
    <div
      className="
        bg-white
        border border-slate-200/70
        rounded-2xl
        px-5 py-4
      "
    >
      {/* <p className="text-[13px] text-slate-500">
        AI is reviewing your answer...
      </p> */}
    </div>
  )}

  {/* Interview Setup */}
  {!currentQuestion && <RoleSelector />}

  {/* Active Interview */}
  {currentQuestion && (
    <div className="max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-5 flex items-center">
        <div className="h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />

        <div className="mx-2 h-px flex-1 bg-slate-200" />

        <div className="h-2 w-2 rounded-full bg-slate-200" />

        <div className="mx-2 h-px flex-1 bg-slate-200" />

        <div className="h-2 w-2 rounded-full bg-slate-200" />
      </div>

      {/* Question */}
      <QuestionCard question={currentQuestion} />

      {/* Answer Box */}
      {!lastFeedback && <AnswerInput />}

      {/* Feedback + Actions */}
      {lastFeedback && (
        <>
          <FeedbackPanel feedback={lastFeedback} />

          <div className="mt-4">
            {nextQuestion ? (
              <button
                onClick={() =>
                  dispatch(loadNextQuestion())
                }
                className="
                  inline-flex items-center gap-1.5
                  px-4 py-2
                  rounded-lg
                  border border-indigo-600
                  bg-indigo-600
                  text-white
                  text-[13px]
                  hover:bg-indigo-700
                  transition-colors
                "
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() =>
                  dispatch(
                    endInterview({
                      session_id: sessionId,
                    })
                  )
                }
                className="
                  inline-flex items-center gap-1.5
                  px-4 py-2
                  rounded-lg
                  bg-emerald-500
                  text-white
                  text-[13px]
                  hover:bg-emerald-600
                  transition-colors
                "
              >
                Finish Interview
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )}
</div>


);
}

export default InterviewPage;
