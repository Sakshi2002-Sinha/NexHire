import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import {
  startInterviewApi,
  submitAnswerApi,
  endInterviewApi,
} from "../api/interviewApi";

export const startInterview = createAsyncThunk(
  "interview/startInterview",
  async (data) => {
    return await startInterviewApi(data);
  }
);

export const submitAnswer = createAsyncThunk(
  "interview/submitAnswer",
  async (data) => {
    return await submitAnswerApi(data);
  }
);

export const endInterview = createAsyncThunk(
  "interview/endInterview",
  async (data) => {
    return await endInterviewApi(data);
  }
);

const initialState = {
  sessionId: null,
  currentQuestion: null,
  lastFeedback: null,
  nextQuestion: null,
  totalScore: null,
  summary: null,
  sessionStatus: "idle",
  isLoading: false,
  error: null,
};

const interviewSlice = createSlice({
  name: "interview",
  initialState,

  reducers: {
    loadNextQuestion: (state) => {
      state.currentQuestion = state.nextQuestion;
      state.nextQuestion = null;
      state.lastFeedback = null;
    },

    resetInterview: (state) => {
      state.sessionId = null;
      state.currentQuestion = null;
      state.lastFeedback = null;
      state.nextQuestion = null;
      state.totalScore = null;
      state.summary = null;
      state.sessionStatus = "idle";
      state.isLoading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // START INTERVIEW
      .addCase(startInterview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(
        startInterview.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.sessionId =
            action.payload.session_id;

          state.currentQuestion = {
            id: action.payload.question_id,
            text: action.payload.question,
            number: 1,
          };

          state.sessionStatus = "active";
        }
      )

      .addCase(
        startInterview.rejected,
        (state, action) => {
          state.isLoading = false;
          state.error = action.error.message;
        }
      )

      // SUBMIT ANSWER
      .addCase(submitAnswer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(
        submitAnswer.fulfilled,
        (state, action) => {
          state.isLoading = false;

// console.log(action.payload);

          state.lastFeedback = {
  score: action.payload.score,

  communication:
    action.payload.communication,

  technical_depth:
    action.payload.technical_depth,

  problem_solving:
    action.payload.problem_solving,

  confidence:
    action.payload.confidence,

  feedback:
    action.payload.feedback,

  strengths:
    action.payload.strengths,

  improvements:
    action.payload.improvements,
};

          if (
            action.payload.next_question &&
            action.payload.next_question_id
          ) {
            state.nextQuestion = {
              id:
                action.payload.next_question_id,

              text:
                action.payload.next_question,

              number:
                state.currentQuestion.number + 1,
            };
          } else {
            state.nextQuestion = null;
          }
        }
      )

      .addCase(
        submitAnswer.rejected,
        (state, action) => {
          state.isLoading = false;
          state.error = action.error.message;
        }
      )

      // END INTERVIEW
      .addCase(endInterview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(
        endInterview.fulfilled,
        (state, action) => {
          state.isLoading = false;

          state.totalScore =
            action.payload.total_score;

          state.summary = {
            strengths:
              action.payload.strengths || [],
            improvements:
              action.payload.improvements || [],
          };

          state.sessionStatus = "completed";
        }
      )

      .addCase(
        endInterview.rejected,
        (state, action) => {
          state.isLoading = false;
          state.error = action.error.message;
        }
      );
  },
});

export const {
  loadNextQuestion,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;