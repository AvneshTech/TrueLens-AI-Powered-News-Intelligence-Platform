import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import type { ReactNode } from "react";
import { AdminRoute } from "../components/AdminRoute";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";

// PHASE 11: route-level code-splitting. Each page is its own lazily-loaded
// chunk, so the initial bundle only ships the shell + the first route the user
// hits, not every page at once. Named exports are adapted to the default-export
// shape React.lazy() requires.
const Dashboard = lazy(() => import("../pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const NewsFeed = lazy(() => import("../pages/NewsFeed").then((m) => ({ default: m.NewsFeed })));
const FakeDetector = lazy(() => import("../pages/FakeDetector").then((m) => ({ default: m.FakeDetector })));
const ChatAssistant = lazy(() => import("../pages/ChatAssistant").then((m) => ({ default: m.ChatAssistant })));
const Notes = lazy(() => import("../pages/Notes").then((m) => ({ default: m.Notes })));
const Analytics = lazy(() => import("../pages/Analytics").then((m) => ({ default: m.Analytics })));
const Sentiment = lazy(() => import("../pages/Sentiment"));
const PredictionHistory = lazy(() => import("../pages/PredictionHistory"));
const UserProfile = lazy(() => import("../pages/UserProfile"));
const AdminPanel = lazy(() => import("../pages/AdminPanel").then((m) => ({ default: m.AdminPanel })));
const Profile = lazy(() => import("../pages/Profile").then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import("../pages/Settings").then((m) => ({ default: m.Settings })));
const PublicNote = lazy(() => import("../pages/PublicNote").then((m) => ({ default: m.PublicNote })));
const Login = lazy(() => import("../pages/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("../pages/Register").then((m) => ({ default: m.Register })));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail").then((m) => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("../pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));

function PageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
    </div>
  );
}

const withSuspense = (node: ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

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
      { index: true, element: withSuspense(<Dashboard />) },

      { path: "news", element: withSuspense(<NewsFeed />) },
      { path: "detector", element: withSuspense(<FakeDetector />) },
      { path: "chat", element: withSuspense(<ChatAssistant />) },
      { path: "notes", element: withSuspense(<Notes />) },
      { path: "analytics", element: withSuspense(<Analytics />) },
      { path: "sentiment", element: withSuspense(<Sentiment />) },
      { path: "predictions", element: withSuspense(<PredictionHistory />) },
      { path: "user-profile", element: withSuspense(<UserProfile />) },

      {
        path: "admin",
        element: (
          <AdminRoute>{withSuspense(<AdminPanel />)}</AdminRoute>
        ),
      },

      { path: "profile", element: withSuspense(<Profile />) },
      { path: "settings", element: withSuspense(<Settings />) },
    ],
  },

  // 🌐 PHASE 7: public, unauthenticated — anyone with the link can view a shared
  // note without a TrueLens account, so this must sit outside both ProtectedRoute
  // and AuthLayout (which assumes a logged-out visitor, not a generic public page).
  {
    path: "/notes/shared/:shareToken",
    element: withSuspense(<PublicNote />),
  },

  // 🔑 Auth routes
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: withSuspense(<Login />) },
      { path: "register", element: withSuspense(<Register />) },
      { path: "verify-email", element: withSuspense(<VerifyEmail />) },
      { path: "forgot-password", element: withSuspense(<ForgotPassword />) },
      { path: "reset-password", element: withSuspense(<ResetPassword />) },
    ],
  },

  // ❌ fallback (important)
  {
    path: "*",
    element: <Navigate to="/" />,
  },
]);
