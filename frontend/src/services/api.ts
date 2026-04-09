import axios from "axios";

// ✅ Axios instance — reads VITE_API_URL from .env
// Set VITE_API_URL=http://localhost:8080/api in your .env file
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ✅ Request interceptor — attaches JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Response interceptor — auto-logout on token expiry
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────
// 🔐 AUTH — /api/auth/*
// ─────────────────────────────────────────
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    API.post("/auth/login", data),

  register: (data: { fullName: string; email: string; password: string }) =>
    API.post("/auth/register", data),

  logout: (token: string) =>
    API.post("/auth/logout", null, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  refresh: (refreshToken: string) =>
    API.post("/auth/refresh", { refreshToken }),
};

// ─────────────────────────────────────────
// 📝 NOTES — /api/notes/*
// ─────────────────────────────────────────
export const notesAPI = {
  getAll: () => API.get("/notes"),

  getById: (id: string) => API.get(`/notes/${id}`),

  // ✅ FIX: backend NoteController uses @RequestParam "keyword", not "query"
  search: (keyword: string) => API.get(`/notes/search?keyword=${keyword}`),

  create: (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => API.post("/notes", data),

  update: (
    id: string,
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    },
  ) => API.put(`/notes/${id}`, data),

  delete: (id: string) => API.delete(`/notes/${id}`),
};

// ─────────────────────────────────────────
// 🔍 FACT CHECK — /api/fact-check
// ─────────────────────────────────────────
// ✅ FIX: backend is mapped to GET /api/fact-check?title=...  (not POST /factcheck/check)
export const factCheckAPI = {
  check: (title: string) => API.get("/fact-check", { params: { title } }),
};

// ─────────────────────────────────────────
// 📊 PREDICTION HISTORY — /api/predictions/*
// ─────────────────────────────────────────
export const predictionAPI = {
  // ✅ FIX: backend PredictionHistoryController is at /api/predictions  (no /history suffix)
  getHistory: () => API.get("/predictions"),
};

// ─────────────────────────────────────────
// 📰 NEWS — /api/news/*
// ─────────────────────────────────────────
export const newsAPI = {
  getAll: (params?: { category?: string; search?: string; page?: number }) =>
    API.get("/news", { params }),
};

// ─────────────────────────────────────────
// 👑 ADMIN — /api/admin/*
// ─────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => API.get("/admin/dashboard"),
  getAnalytics: () => API.get("/admin/analytics"),
  getAllUsers: () => API.get("/admin/users"),
  deleteUser: (userId: string) => API.delete(`/admin/users/${userId}`),
  deleteNote: (noteId: string) => API.delete(`/admin/notes/${noteId}`),
};

export default API;
