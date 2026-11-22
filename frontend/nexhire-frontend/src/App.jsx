import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { Loading } from "./components/ui/States";
import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { fetchMe } from "./store/authSlice";

// Charts are the heaviest dependency, so these pages load only when visited.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const InterviewPage = lazy(() => import("./pages/InterviewPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const HistoryDetailsPage = lazy(() => import("./pages/HistoryDetailsPage"));
const ResumePage = lazy(() => import("./pages/ResumePage"));

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [dispatch, token, user]);

  const guestOnly = (page) => (token ? <Navigate to="/dashboard" replace /> : page);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={guestOnly(<LandingPage />)} />
          <Route path="/login" element={guestOnly(<LoginPage />)} />
          <Route path="/register" element={guestOnly(<RegisterPage />)} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:sessionId" element={<HistoryDetailsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
