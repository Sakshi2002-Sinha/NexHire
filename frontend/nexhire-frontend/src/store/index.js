import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import interviewReducer from "./interviewSlice";
import { INTERVIEW_STORAGE_KEY } from "../constants";

// Restore an in-progress interview so a page refresh doesn't lose it.
function loadInterviewState() {
  try {
    const saved = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    if (!saved) return undefined;

    const state = JSON.parse(saved);
    // A request that was in flight when the page closed never finished.
    return { ...state, isLoading: false, error: null };
  } catch {
    return undefined;
  }
}

const savedInterview = loadInterviewState();

const store = configureStore({
  reducer: {
    auth: authReducer,
    interview: interviewReducer,
  },
  preloadedState: savedInterview
    ? { interview: savedInterview }
    : undefined,
});

let lastSaved = store.getState().interview;

store.subscribe(() => {
  const interview = store.getState().interview;
  if (interview === lastSaved) return;
  lastSaved = interview;

  try {
    if (interview.sessionStatus === "idle") {
      localStorage.removeItem(INTERVIEW_STORAGE_KEY);
    } else {
      localStorage.setItem(
        INTERVIEW_STORAGE_KEY,
        JSON.stringify(interview)
      );
    }
  } catch {
    // Storage can be unavailable (private mode); persistence is best-effort.
  }
});

export default store;
