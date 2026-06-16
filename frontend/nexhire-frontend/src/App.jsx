import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import HistoryPage from "./pages/HistoryPage";
import RegisterPage from "./pages/RegisterPage";
import InterviewPage from "./pages/InterviewPage";
import HistoryDetailsPage from "./pages/HistoryDetailsPage";
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

        <Route
          path="/"
          element={<Navigate to="/login" />}
        />
         
        <Route
  path="/register"
  element={
    <AppLayout>
      <RegisterPage />
    </AppLayout>
  }
/>

<Route
  path="/login"
  element={
    <AppLayout>
      <LoginPage />
    </AppLayout>
  }
/>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InterviewPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history/:sessionId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HistoryDetailsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;