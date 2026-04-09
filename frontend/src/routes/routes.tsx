import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminRoute } from "../components/AdminRoute";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";

import { AdminPanel } from "../pages/AdminPanel";
import { Analytics } from "../pages/Analytics";
import { ChatAssistant } from "../pages/ChatAssistant";
import { Dashboard } from "../pages/Dashboard";
import { FakeDetector } from "../pages/FakeDetector";
import { Login } from "../pages/Login";
import { NewsFeed } from "../pages/NewsFeed";
import { Notes } from "../pages/Notes";
import PredictionHistory from "../pages/PredictionHistory";
import { Profile } from "../pages/Profile";
import { Register } from "../pages/Register";
import Sentiment from "../pages/Sentiment";
import { Settings } from "../pages/Settings";
import UserProfile from "../pages/UserProfile";

export const router = createBrowserRouter([
  // 🔐 Protected routes
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },

      { path: "news", element: <NewsFeed /> },
      { path: "detector", element: <FakeDetector /> },
      { path: "chat", element: <ChatAssistant /> },
      { path: "notes", element: <Notes /> },
      { path: "analytics", element: <Analytics /> },
      { path: "sentiment", element: <Sentiment /> },
      { path: "predictions", element: <PredictionHistory /> },
      { path: "user-profile", element: <UserProfile /> },

      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        ),
      },

      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // 🔑 Auth routes
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },

  // ❌ fallback (important)
  {
    path: "*",
    element: <Navigate to="/" />,
  },
]);