import "server-only";

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

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: number;
}

export interface AuthenticatedRequest {
  userId: string;
  email: string;
  role: string;
}
