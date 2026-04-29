"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SafeAdmin, LoginRequest } from "@/frontend/types";
import { AuthApi, apiService } from "@/frontend/services";

interface AuthContextValue {
  user: SafeAdmin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "cicata-auth-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      apiService.setToken(stored);
      setToken(stored);
      AuthApi.me()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            apiService.setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          apiService.setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const result = await AuthApi.login(data);
    if (result.success && result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
      localStorage.setItem(TOKEN_KEY, result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error || "Login failed" };
  }, []);

  const logout = useCallback(async () => {
    await AuthApi.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
