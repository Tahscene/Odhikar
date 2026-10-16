import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CaseDetail from "./pages/CaseDetail.jsx";
import Bot from "./pages/Bot.jsx";
import MamlaBazi from "./pages/MamlaBazi.jsx";
import ThanaAccountability from "./pages/ThanaAccountability.jsx";

function isLoggedIn() {
  return Boolean(localStorage.getItem("odhikar_token"));
}

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case/:id"
        element={
          <ProtectedRoute>
            <CaseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bot"
        element={
          <ProtectedRoute>
            <Bot />
          </ProtectedRoute>
        }
      />
      <Route path="/mamla-bazi" element={<MamlaBazi />} />
      <Route
        path="/thana-accountability"
        element={
          <ProtectedRoute>
            <ThanaAccountability />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
