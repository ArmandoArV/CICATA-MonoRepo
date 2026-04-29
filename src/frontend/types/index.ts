export type {
  SafeUser,
  SafeAdmin,
  SafeProfessor,
  SafeStudent,
  AuthTokenPayload,
  LoginRequest,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  ProgramDTO,
  SchoolCycleDTO,
  StatusDTO,
  UserRoleDTO,
  SubjectDTO,
  StudyGroupDTO,
} from "@/shared/types";

export {
  Gender,
  TimeModality,
  ProjectType,
  DocTarget,
  StudentStatus,
} from "@/shared/types";

export interface AuthState {
  user: import("@/shared/types").SafeAdmin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
