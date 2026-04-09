import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes";
import { AuthProvider } from "./context/AuthContext";
import "./styles/index.css";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" /> {/* ✅ only once */}
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);