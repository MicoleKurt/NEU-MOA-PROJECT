import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";

function Guard({ children, allow }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/" replace />;
  if (userProfile?.isBlocked) return <Navigate to="/" replace />;
  if (allow && userProfile?.role !== allow) {
    if (userProfile?.role === "admin") return <Navigate to="/admin" replace />;
    if (userProfile?.role === "faculty") return <Navigate to="/faculty" replace />;
    return <Navigate to="/student" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin"   element={<Guard allow="admin">  <AdminDashboard /></Guard>} />
          <Route path="/faculty" element={<Guard allow="faculty"><FacultyDashboard /></Guard>} />
          <Route path="/student" element={<Guard><StudentDashboard /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
