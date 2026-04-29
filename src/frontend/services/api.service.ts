import type {
  ApiResponse,
  LoginRequest,
  AuthResponse,
} from "@/frontend/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    return response.json();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiService = new ApiService();

export const AuthApi = {
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const result = await apiService.post<AuthResponse>(
      "/api/auth/login",
      data
    );
    if (result.success && result.data?.token) {
      apiService.setToken(result.data.token);
    }
    return result;
  },

  async me(): Promise<ApiResponse<AuthResponse["user"]>> {
    return apiService.get<AuthResponse["user"]>("/api/auth/me");
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const result = await apiService.post<{ message: string }>(
      "/api/auth/logout"
    );
    apiService.setToken(null);
    return result;
  },
};
