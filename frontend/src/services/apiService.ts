import axios, { AxiosInstance } from "axios";

// ─────────────────────────────────────────────────────────
// TYPES  (matched exactly to backend DTOs)
// ─────────────────────────────────────────────────────────
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
  id: number;
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
  id: number;
  newsTitle: string;
  content: string;
  result: "REAL" | "FAKE";
  confidence: number;
  createdAt: string;
}

export interface DetectionResult {
  label: "REAL" | "FAKE"; // ✅ FIXED (was prediction)
  confidence: number;
}

export interface NoteResponse {
  id: number;
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

// ─────────────────────────────────────────────────────────
// API SERVICE CLASS
// ─────────────────────────────────────────────────────────
class APIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
      headers: { "Content-Type": "application/json" },
    });

    // Attach JWT token to every request
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Auto logout on 401
    this.api.interceptors.response.use(
      (response) => response,
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
  }

  // ─── AUTH ─────────────────────────────────────────────
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

  async logout(): Promise<void> {
    try {
      await this.api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
  }

  // ─── USER ─────────────────────────────────────────────
  async getUserProfile(): Promise<ApiResult<UserProfile>> {
    const response = await this.api.get<ApiResult<UserProfile>>("/api/user/me");
    return response.data;
  }

  // ─── NEWS ─────────────────────────────────────────────
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

  // ─── FACT CHECK (keyword-based fallback, no ML) ───────────────────────
  // GET /api/fact-check?title=... → FactCheckController → FactCheckService
  async checkFactuality(title: string): Promise<FactCheckResponse> {
    const response = await this.api.get("/api/fact-check", {
      params: { title },
    });
    return response.data;
  }

  // ─── PREDICTIONS ──────────────────────────────────────

  // ─────────────────────────────────────
  // 🔥 DETECTOR (ML)
  // ─────────────────────────────────────
  async detectFakeNews(text: string): Promise<DetectionResult> {
    const res = await this.api.post("/api/detect", { text });

    const data = res.data;
    const predictionValue = data.prediction || data.label;

    return {
      label: String(predictionValue).toUpperCase() === "REAL" ? "REAL" : "FAKE",
      confidence: data.confidence,
    };
  }

  // ─────────────────────────────────────
  // 🔥 SAVE PREDICTION (FIXED)
  // ─────────────────────────────────────
  async savePrediction(data: {
    newsTitle: string;
    content: string;
    result: "REAL" | "FAKE";
    confidence: number;
    category?: string;
  }): Promise<PredictionHistory> {
    const res = await this.api.post("/api/predictions", data);
    return res.data;
  }

  // ─────────────────────────────────────
  // 🔥 GET HISTORY (FIXED)
  // ─────────────────────────────────────
  async getPredictionHistory(): Promise<PredictionHistory[]> {
    const res = await this.api.get("/api/predictions");

    // ✅ IMPORTANT: backend returns ARRAY directly
    return res.data;
  }

  async createPrediction(data: {
    newsTitle: string;
    content: string;
  }): Promise<ApiResult<PredictionHistory>> {
    const response = await this.api.post("/api/predictions", data);
    return response.data;
  }

  // ─── SENTIMENT ANALYSIS ────────────────────────────────────────────
  async analyzeSentiment(text: string): Promise<{
    sentiment: "Positive" | "Neutral" | "Negative";
    score: number;
  }> {
    const cleanedText = text?.trim();
    if (!cleanedText) {
      return { sentiment: "Neutral", score: 0 };
    }

    const MAX_HF_CHARS = 2000;
    let inferenceText = cleanedText;

    if (cleanedText.length > MAX_HF_CHARS) {
      const truncated = cleanedText.slice(0, MAX_HF_CHARS);
      const lastSpace = truncated.lastIndexOf(" ");
      inferenceText = truncated.slice(0, lastSpace > 0 ? lastSpace : MAX_HF_CHARS);
      console.warn(
        "Sentiment input text exceeded the model limit and was truncated to avoid token overflow."
      );
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_HF_API_KEY || 'YOUR_HF_TOKEN'}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: inferenceText,
          parameters: {
            truncation: true,
            max_length: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sentiment API Error:", errorText);
      return { sentiment: "Neutral", score: 0 };
    }

    const data = await response.json();
    const result = Array.isArray(data) && Array.isArray(data[0]) ? data[0][0] : data[0];

    if (!result || !result.label) {
      console.error("Sentiment API Error: unexpected response format", data);
      return { sentiment: "Neutral", score: 0 };
    }

    return {
      sentiment:
        result.label === "LABEL_2"
          ? "Positive"
          : result.label === "LABEL_0"
          ? "Negative"
          : "Neutral",
      score: result.score ?? 0,
    };
  }

  // ─── CATEGORY EXTRACTION ────────────────────────────────────────────
  async categorizeNews(text: string): Promise<{
    category: string;
  }> {
    const safeText = JSON.stringify(text);
    const response = await this.api.post("/api/chat", {
      message: `Categorize this news article into ONE of these categories: Politics, Sports, Technology, Health, Business, Entertainment, Science, World, Other. Respond ONLY with the category name.\nArticle: ${safeText}`,
    });

    const raw = typeof response.data === "string" ? response.data : response.data?.message;

    if (!raw) {
      return { category: "General" };
    }

    // Clean up the response - take the first line or word
    const category = raw.trim().split('\n')[0].split(' ')[0];

    // Validate it's one of our categories
    const validCategories = ["Politics", "Sports", "Technology", "Health", "Business", "Entertainment", "Science", "World", "Other"];
    if (validCategories.includes(category)) {
      return { category };
    }

    return { category: "General" };
  }

  // ─── NOTES ────────────────────────────────────────────
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

  // ─── ADMIN ────────────────────────────────────────────
  async getAdminDashboard(): Promise<ApiResult<DashboardResponse>> {
    const response = await this.api.get("/api/admin/dashboard");
    return response.data;
  }

  async getAllUsers(): Promise<ApiResult<{ users: any[] }>> {
    const response = await this.api.get("/api/admin/users");
    return response.data;
  }

  async deleteUser(userId: number): Promise<ApiResult<void>> {
    const response = await this.api.delete(`/api/admin/user/${userId}`);
    return response.data;
  }

  async banUser(userId: number): Promise<ApiResult<void>> {
    const response = await this.api.put(`/api/admin/user/ban/${userId}`);
    return response.data;
  }

  async unbanUser(userId: number): Promise<ApiResult<void>> {
    const response = await this.api.put(`/api/admin/user/unban/${userId}`);
    return response.data;
  }

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

  // ─── CHAT ─────────────────────────────────────────────
  async sendChatMessage(message: string): Promise<string> {
    const token = localStorage.getItem("token");

    const response = await this.api.post(
      "/api/chat",
      { message },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      },
    );

    return response.data.message;
  }
}

export const apiService = new APIService();
export default apiService;
