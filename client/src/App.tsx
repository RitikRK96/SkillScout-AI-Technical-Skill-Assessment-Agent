import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/useAuthStore";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NewAssessmentPage from "./pages/NewAssessmentPage";
import ResultsPage from "./pages/ResultsPage";
import LandingPage from "./pages/LandingPage";
import api from "./lib/axios";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  
  // On mount, try to restore session from httpOnly cookie
  useEffect(() => {
    api.post("/auth/refresh")
      .then((res) => {
        // Server returns user info on successful refresh
        if (res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        // No valid session — user stays logged out, no action needed
      });
  }, []);

  return (
    <Router>
      <div className="min-h-screen font-sans text-gray-900 bg-gray-50 ">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/assessment/new"
            element={
              <PrivateRoute>
                <NewAssessmentPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/assessment/:id/results"
            element={
              <PrivateRoute>
                <ResultsPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
