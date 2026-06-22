import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

// ────────────────────────────────────────────────────────────────────────────
// TYPES  (matched exactly to backend DTOs)
// ────────────────────────────────────────────────────────────────────────────
export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  category: string;
  publishedAt: string;
}

// ✅ Used by FactCheck (keyword-based, not ML) — matches backend FactCheckResponse
export interface FactCheckResponse {
  verified: boolean;
  source: string;
  summary: string;
}

export interface PredictionHistory {
  id: string;
  newsTitle: string;
  content: string;
  // M-1: backend supports UNCERTAIN too; keep it end-to-end.
  result: "REAL" | "FAKE" | "UNCERTAIN";
  confidence: number;
  createdAt: string;
}

export interface DetectionResult {
  label: "REAL" | "FAKE" | "UNCERTAIN";
  confidence: number;
}

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NoteRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalPredictions: number;
  fakeNews: number;
  realNews: number;
}

export interface DashboardResponse {
  stats: { title: string; value: string; change: string; trend: string }[];
  activityData: any[];
  pieData: any[];
  categoryData: any[];
  recentActivity: any[];
}

export interface NotificationItem {
  id: string;
  userEmail?: string;
  title?: string;
  message: string;
  type?: string;
  link?: string;
  read: boolean;
  createdAt?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getToken(): string | null {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getRefreshToken(): string | null {
  return (
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken")
  );
}

function storeAccessToken(token: string) {
  // Store back into whichever storage currently holds the refresh token.
  if (localStorage.getItem("refreshToken")) {
    localStorage.setItem("token", token);
  } else {
    sessionStorage.setItem("token", token);
  }
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
}

// ────────────────────────────────────────────────────────────────────────────
// API SERVICE CLASS
// ────────────────────────────────────────────────────────────────────────────
class APIService {
  private api: AxiosInstance;
  // De-dupe concurrent refreshes so a burst of 401s triggers a single refresh.
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // Attach JWT token to every request
    this.api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // FIX H-4: on 401, try ONE silent refresh and replay the original request.
    // Only log the user out if the refresh itself fails. (Previously every 401
    // wiped storage and redirected, so sessions died abruptly at token expiry
    // and the entire refresh-token infrastructure was dead weight.)
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = (error.config || {}) as AxiosRequestConfig & {
          _retry?: boolean;
        };

        const isRefreshCall = original.url?.includes("/api/auth/refresh");

        if (
          error.response?.status === 401 &&
          !original._retry &&
          !isRefreshCall &&
          getRefreshToken()
        ) {
          original._retry = true;
          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              original.headers = original.headers || {};
              (original.headers as Record<string, string>).Authorization =
                `Bearer ${newToken}`;
              return this.api(original);
            }
          } catch {
            // fall through to logout below
          }
        }

        if (error.response?.status === 401) {
          clearSession();
          window.location.href = "/auth/login";
        }

        return Promise.reject(error);
      },
    );
  }

  // Single-flight refresh. Uses a bare axios instance to avoid interceptor recursion.
  private refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.resolve(null);

    this.refreshPromise = axios
      .post<ApiResult<string>>(`${BASE_URL}/api/auth/refresh`, { refreshToken })
      .then((resp) => {
        const newToken = resp.data?.data;
        if (newToken) {
          storeAccessToken(newToken);
          return newToken;
        }
        return null;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  // ─── AUTH ───────────────────────────────────────────────────────────────
  async login(
    email: string,
    password: string,
  ): Promise<ApiResult<AuthResponse>> {
    const response = await this.api.post<ApiResult<AuthResponse>>(
      "/api/auth/login",
      { email, password },
    );
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.accessToken);
      localStorage.setItem("refreshToken", response.data.data.refreshToken);
    }
    return response.data;
  }

  async register(
    fullName: string,
    email: string,
    password: string,
  ): Promise<ApiResult<string>> {
    const response = await this.api.post<ApiResult<string>>(
      "/api/auth/register",
      { fullName, email, password },
    );
    return response.data;
  }

  // PHASE 3: email verification + password reset
  async verifyEmail(token: string): Promise<ApiResult<string>> {
    const r = await this.api.post<ApiResult<string>>("/api/auth/verify-email", { token });
    return r.data;
  }

  async resendVerification(email: string): Promise<ApiResult<string>> {
    const r = await this.api.post<ApiResult<string>>("/api/auth/resend-verification", { email });
    return r.data;
  }

  async forgotPassword(email: string): Promise<ApiResult<string>> {
    const r = await this.api.post<ApiResult<string>>("/api/auth/forgot-password", { email });
    return r.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResult<string>> {
    const r = await this.api.post<ApiResult<string>>("/api/auth/reset-password", { token, newPassword });
    return r.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/api/auth/logout");
    } finally {
      clearSession();
    }
  }

  // ─── USER ───────────────────────────────────────────────────────────────
  async getUserProfile(): Promise<ApiResult<UserProfile>> {
    const response = await this.api.get<ApiResult<UserProfile>>("/api/user/me");
    return response.data;
  }

  // ─── NEWS ───────────────────────────────────────────────────────────────
  async getNews(params?: {
    category?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResult<NewsArticle[]>> {
    const response = await this.api.get<ApiResult<NewsArticle[]>>("/api/news", {
      params,
    });
    return response.data;
  }

  // ─── FACT CHECK (keyword-based fallback, no ML) ──────────────────────────
  async checkFactuality(title: string): Promise<FactCheckResponse> {
    const response = await this.api.get("/api/fact-check", {
      params: { title },
    });
    return response.data;
  }

  // ─── DETECTOR (ML) ───────────────────────────────────────────────────────
  // NOTE (FIX H-9): /api/detect already persists the result server-side for the
  // authenticated user. There is no separate client-side "save" call any more —
  // that produced duplicate history rows and inflated every analytics count.
  async detectFakeNews(text: string): Promise<DetectionResult> {
    const res = await this.api.post("/api/detect", { text });

    const data = res.data;
    const raw = String(data.prediction || data.label || "").toUpperCase();

    // M-1: preserve UNCERTAIN instead of collapsing it to FAKE.
    let label: "REAL" | "FAKE" | "UNCERTAIN";
    if (raw === "REAL") label = "REAL";
    else if (raw === "UNCERTAIN") label = "UNCERTAIN";
    else label = "FAKE";

    return { label, confidence: data.confidence };
  }

  // ─── HISTORY ──────────────────────────────────────────────────────────────
  // Returns ONLY the current user's history (backend C-1 fix scopes by auth user).
  async getPredictionHistory(): Promise<PredictionHistory[]> {
    const res = await this.api.get("/api/predictions");
    return res.data;
  }

  // ─── SENTIMENT ANALYSIS ───────────────────────────────────────────────────
  // FIX C-5: now calls the backend (key stays server-side). Previously this hit
  // Hugging Face directly with the HF token inlined into the public JS bundle.
  async analyzeSentiment(text: string): Promise<{
    sentiment: "Positive" | "Neutral" | "Negative";
    score: number;
  }> {
    const cleanedText = text?.trim();
    if (!cleanedText) {
      return { sentiment: "Neutral", score: 0 };
    }

    try {
      const response = await this.api.post("/api/sentiment", {
        text: cleanedText,
      });
      const data = response.data || {};
      const sentiment =
        data.sentiment === "Positive" || data.sentiment === "Negative"
          ? data.sentiment
          : "Neutral";
      return { sentiment, score: data.score ?? 0 };
    } catch (err) {
      console.error("Sentiment API error:", err);
      return { sentiment: "Neutral", score: 0 };
    }
  }

  // ─── CATEGORY EXTRACTION ───────────────────────────────────────────────────
  async categorizeNews(text: string): Promise<{ category: string }> {
    const safeText = JSON.stringify(text);
    const response = await this.api.post("/api/chat", {
      message: `Categorize this news article into ONE of these categories: Politics, Sports, Technology, Health, Business, Entertainment, Science, World, Other. Respond ONLY with the category name.\nArticle: ${safeText}`,
    });

    const raw =
      typeof response.data === "string" ? response.data : response.data?.message;

    if (!raw) {
      return { category: "General" };
    }

    const category = raw.trim().split("\n")[0].split(" ")[0];

    const validCategories = [
      "Politics",
      "Sports",
      "Technology",
      "Health",
      "Business",
      "Entertainment",
      "Science",
      "World",
      "Other",
    ];
    if (validCategories.includes(category)) {
      return { category };
    }

    return { category: "General" };
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────
  async getNotes(): Promise<ApiResult<NoteResponse[]>> {
    const response = await this.api.get("/api/notes");
    return response.data;
  }

  async getNoteById(id: string): Promise<ApiResult<NoteResponse>> {
    const response = await this.api.get(`/api/notes/${id}`);
    return response.data;
  }

  async searchNotes(keyword: string): Promise<ApiResult<NoteResponse[]>> {
    const response = await this.api.get("/api/notes/search", {
      params: { keyword },
    });
    return response.data;
  }

  async createNote(data: NoteRequest): Promise<ApiResult<NoteResponse>> {
    const response = await this.api.post("/api/notes", data);
    return response.data;
  }

  async updateNote(
    id: string,
    data: NoteRequest,
  ): Promise<ApiResult<NoteResponse>> {
    const response = await this.api.put(`/api/notes/${id}`, data);
    return response.data;
  }

  async deleteNote(id: string): Promise<ApiResult<void>> {
    const response = await this.api.delete(`/api/notes/${id}`);
    return response.data;
  }

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  async getAdminDashboard(): Promise<ApiResult<DashboardResponse>> {
    const response = await this.api.get("/api/admin/dashboard");
    return response.data;
  }

  async getAllUsers(): Promise<ApiResult<{ users: any[] }>> {
    const response = await this.api.get("/api/admin/users");
    return response.data;
  }

  async deleteUser(userId: string): Promise<ApiResult<void>> {
    const response = await this.api.delete(`/api/admin/user/${userId}`);
    return response.data;
  }

  async banUser(userId: string): Promise<ApiResult<void>> {
    const response = await this.api.put(`/api/admin/user/ban/${userId}`);
    return response.data;
  }

  async unbanUser(userId: string): Promise<ApiResult<void>> {
    const response = await this.api.put(`/api/admin/user/unban/${userId}`);
    return response.data;
  }

  // FIX H-2: backend now implements DELETE /api/admin/notes/{id}.
  async deleteNoteAsAdmin(noteId: string): Promise<ApiResult<void>> {
    const response = await this.api.delete(`/api/admin/notes/${noteId}`);
    return response.data;
  }

  async getDashboardStats(): Promise<ApiResult<DashboardResponse>> {
    const response = await this.api.get("/api/analytics/dashboard");
    return response.data;
  }

  async getAdminAnalytics(): Promise<ApiResult<DashboardResponse>> {
    const response = await this.api.get("/api/admin/dashboard");
    return response.data;
  }

  // ─── NOTIFICATIONS (PHASE 4) ──────────────────────────────────────────────
  async getNotifications(): Promise<ApiResult<NotificationItem[]>> {
    const r = await this.api.get("/api/notifications");
    return r.data;
  }

  async getUnreadCount(): Promise<ApiResult<{ count: number }>> {
    const r = await this.api.get("/api/notifications/unread-count");
    return r.data;
  }

  async markNotificationRead(id: string): Promise<ApiResult<string>> {
    const r = await this.api.put(`/api/notifications/${id}/read`);
    return r.data;
  }

  async markAllNotificationsRead(): Promise<ApiResult<string>> {
    const r = await this.api.put("/api/notifications/read-all");
    return r.data;
  }

  async deleteNotification(id: string): Promise<ApiResult<string>> {
    const r = await this.api.delete(`/api/notifications/${id}`);
    return r.data;
  }

  // ─── CHAT ───────────────────────────────────────────────────────────────
  async sendChatMessage(message: string): Promise<string> {
    const response = await this.api.post("/api/chat", { message });
    return response.data.message;
  }
}

export const apiService = new APIService();
export default apiService;
