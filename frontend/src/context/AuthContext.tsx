import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

// ✅ User type
interface User {
  email: string;
  role: string;
  fullName: string; // ✅ ADD THIS
}

// ✅ Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔧 Decode JWT
function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ✅ Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restore user from token
  useEffect(() => {
    // Clear previous sessions on development app start (only if no active session)
    if (import.meta.env.DEV) {
      const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!hasToken) {
        localStorage.clear();
        sessionStorage.clear();
      }
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (token && user) {
      setUser(JSON.parse(user));
    }

    setLoading(false);
  }, []);

  // ✅ LOGIN
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<any> => {
    const res = await authAPI.login({ email, password });

    if (!res.data.success) {
      throw new Error(res.data.message || "Login failed");
    }

    const data = res.data.data; // 🔥 IMPORTANT

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", data.accessToken);
    if (data.refreshToken) {
      storage.setItem("refreshToken", data.refreshToken);
    }

    const userData: User = {
      email: data.email,
      role: data.role,
      fullName: data.fullName, // ✅ FIXED
    };

    storage.setItem("user", JSON.stringify(userData));

    setUser(userData);

    return { token: data.accessToken, user: userData };
  };

  // ✅ REGISTER
  const register = async (
    fullName: string,
    email: string,
    password: string,
  ) => {
    await authAPI.register({ fullName, email, password });
  };

  // ✅ LOGOUT
  const logout = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      authAPI.logout(token).catch(() => {});
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    setUser(null);
  };

  // ✅ Derived state
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
