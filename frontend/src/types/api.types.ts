// API Response Types based on Backend Swagger Documentation

// Common API Result wrapper
export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  lastLogin?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  lastLogin?: string;
  totalPredictions: number;
  totalNotes: number;
  avatarUrl?: string;
  bio?: string;
}

// News Types
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  source: string;
  author: string;
  publishedAt: string;
  imageUrl: string;
  url: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  credibilityScore?: number;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

// Fact Check Types
export interface FactCheckRequest {
  headline: string;
  content: string;
  source?: string;
}

export interface FactCheckResponse {
  id: string;
  headline: string;
  content: string;
  prediction: 'REAL' | 'FAKE';
  confidence: number;
  credibilityScore: number;
  analysis: {
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    sentimentScore: number;
    biasDetected: boolean;
    redFlags: string[];
    verifiedFacts: number;
    contradictions: number;
  };
  sources: {
    name: string;
    url: string;
    credibility: number;
  }[];
  timestamp: string;
}

// Prediction History Types
export interface PredictionRequest {
  headline: string;
  content: string;
  source?: string;
}

export interface PredictionHistory {
  id: string;
  userId: string;
  headline: string;
  content: string;
  prediction: 'REAL' | 'FAKE';
  confidence: number;
  credibilityScore: number;
  createdAt: string;
  source?: string;
}

export interface PredictionHistoryResponse {
  predictions: PredictionHistory[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

// Notes Types
export interface NoteRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export interface NoteResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export interface NotesSearchRequest {
  query: string;
  category?: string;
  tags?: string[];
}

// Admin Types
export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPredictions: number;
  totalNotes: number;
  predictionAccuracy: number;
  userGrowth: {
    date: string;
    count: number;
  }[];
  predictionStats: {
    date: string;
    real: number;
    fake: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
  }[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  lastLogin?: string;
  totalPredictions: number;
  totalNotes: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

export interface BanUserRequest {
  reason: string;
}

// Analytics Types
export interface DashboardStats {
  totalArticles: number;
  totalPredictions: number;
  totalNotes: number;
  accuracyRate: number;
  recentPredictions: PredictionHistory[];
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
  sentimentTrends: {
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }[];
}

// Pageable request params
export interface PageableRequest {
  page?: number;
  size?: number;
  sort?: string;
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}
