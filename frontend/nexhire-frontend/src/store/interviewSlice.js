import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getErrorMessage } from "../api/axiosClient";
import {
  endInterviewApi,
  getActiveInterviewApi,
  startInterviewApi,
  submitAnswerApi,
} from "../api/interviewApi";
import { logout } from "./authSlice";

// The database is the source of truth. Redux is a view of it that can be rebuilt after a refresh.
export const restoreInterview = createAsyncThunk(
  "interview/restore",
  async (_, { rejectWithValue }) => {
    try {
      return await getActiveInterviewApi();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Could not check for an interview in progress."));
    }
  },
  { condition: (_, { getState }) => getState().interview.status !== "restoring" }
);

export const startInterview = createAsyncThunk(
  "interview/start",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      return { ...(await startInterviewApi(payload)), role: payload.role, difficulty: payload.difficulty };
    } catch (error) {
      if (error.response?.status === 409) {
        await dispatch(restoreInterview());
        return rejectWithValue("You already had an interview in progress, so we resumed it.");
      }
      return rejectWithValue(getErrorMessage(error, "Could not start the interview."));
    }
  }
);

export const submitAnswer = createAsyncThunk("interview/answer", async (payload, { rejectWithValue }) => {
  try {
    return await submitAnswerApi(payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not evaluate your answer."));
  }
});

export const endInterview = createAsyncThunk("interview/end", async (payload, { rejectWithValue }) => {
  try {
    return await endInterviewApi(payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Could not finish the interview."));
  }
});

const initialState = {
  status: "unknown", // unknown | restoring | idle | active | completed
  pending: null, // start | answer | end
  sessionId: null,
  role: null,
  difficulty: null,
  maxQuestions: 5,
  currentQuestion: null,
  nextQuestion: null,
  lastFeedback: null,
  previousFeedback: null,
  result: null,
  error: null,
};

const interviewSlice = createSlice({
  name: "interview",
  initialState,
  reducers: {
    loadNextQuestion: (state) => {
      state.previousFeedback = null;
      state.currentQuestion = state.nextQuestion;
      state.nextQuestion = null;
      state.lastFeedback = null;
    },
    resetInterview: () => ({ ...initialState, status: "idle" }),
    clearInterviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pendingAs = (name) => (state) => {
      state.pending = name;
      state.error = null;
    };
    const rejected = (state, action) => {
      state.pending = null;
      state.error = action.payload || "Request failed";
    };
    builder
      .addCase(logout, () => initialState)
      .addCase(restoreInterview.pending, (state) => {
        state.status = "restoring";
      })
      .addCase(restoreInterview.fulfilled, (state, { payload }) => {
        if (!payload) {
          state.status = "idle";
          return;
        }
        state.status = "active";
        state.sessionId = payload.session_id;
        state.role = payload.role;
        state.difficulty = payload.difficulty;
        state.maxQuestions = payload.max_questions;
        state.currentQuestion = payload.current_question;
        state.lastFeedback = payload.current_feedback;
        state.previousFeedback = payload.previous_feedback;
        state.nextQuestion = null;
      })
      .addCase(restoreInterview.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(startInterview.pending, pendingAs("start"))
      .addCase(startInterview.fulfilled, (state, { payload }) => {
        state.pending = null;
        state.status = "active";
        state.sessionId = payload.session_id;
        state.role = payload.role;
        state.difficulty = payload.difficulty;
        state.maxQuestions = payload.max_questions;
        state.currentQuestion = payload.question;
      })
      .addCase(startInterview.rejected, rejected)
      .addCase(submitAnswer.pending, pendingAs("answer"))
      .addCase(submitAnswer.fulfilled, (state, { payload }) => {
        state.pending = null;
        state.previousFeedback = null;
        state.lastFeedback = payload.feedback;
        state.nextQuestion = payload.next_question;
      })
      .addCase(submitAnswer.rejected, rejected)
      .addCase(endInterview.pending, pendingAs("end"))
      .addCase(endInterview.fulfilled, (state, { payload }) => {
        state.pending = null;
        if (payload.status === "abandoned") return { ...initialState, status: "idle" };
        state.status = "completed";
        state.result = payload;
      })
      .addCase(endInterview.rejected, rejected);
  },
});

export const { loadNextQuestion, resetInterview, clearInterviewError } = interviewSlice.actions;
export default interviewSlice.reducer;
