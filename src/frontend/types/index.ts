export type {
  User,
  AuthTokenPayload,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SafeUser,
  ApiResponse,
  PaginatedResponse,
} from "@/shared/types";

export { UserRole } from "@/shared/types";

export interface AuthState {
  user: import("@/shared/types").SafeUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
