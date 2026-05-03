// ── Enums ──────────────────────────────────────────────

export enum Gender {
  M = "M",
  F = "F",
  X = "X",
}

export enum TimeModality {
  TC = "TC",
  TP = "TP",
}

export enum ProjectType {
  RESIDENCIA = "Residencia Profesional",
  SERVICIO_SOCIAL = "Servicio Social",
  ESTANCIA = "Estancia Tecnológica",
}

export enum DocTarget {
  PROFESSOR = "professor",
  STUDENT = "student",
}

export enum StudentStatus {
  ACTIVO = "ACTIVO",
  INSCRITO = "INSCRITO",
  GRADUADO = "GRADUADO",
  BAJA_TEMPORAL = "BAJA TEMPORAL",
  BAJA_DEFINITIVA = "BAJA DEFINITIVA",
}

// ── API DTOs (safe for client consumption) ────────────

export interface SafeUser {
  id: number;
  name: string;
  lastName: string;
  role: string;
  gender: Gender;
  academicDegree: string | null;
}

export interface SafeAdmin {
  id: number;
  userId: number;
  username: string;
  email: string;
  user: SafeUser;
}

export interface SafeProfessor {
  id: number;
  userId: number;
  ipnRegistration: string | null;
  employeeNumber: string;
  academicLoad: number;
  availableHours: number;
  programId: number;
  statusId: number;
  user: SafeUser;
}

export interface SafeStudent {
  id: number;
  userId: number;
  curp: string;
  registration: string;
  timeModality: TimeModality;
  programId: number;
  localTutorId: number;
  academicDirectorId: number;
  enrollmentCycleId: number;
  semester: number;
  statusId: number;
  user: SafeUser;
}

export interface ProgramDTO {
  id: number;
  name: string;
  isSocialService: boolean;
}

export interface SchoolCycleDTO {
  id: number;
  cycle: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface StatusDTO {
  id: number;
  type: string;
}

export interface UserRoleDTO {
  id: number;
  role: string;
}

export interface SubjectDTO {
  id: number;
  name: string;
  subjectKey: string;
  credits: number;
  semester: number;
  topics: string;
}

export interface StudyGroupDTO {
  id: number;
  groupKey: string;
  subjectId: number;
  campus: string;
  place: string;
  schedule: string | null;
  professorId: number;
  cycleId: number;
  observations: string | null;
}

export interface StudentInGroupDTO {
  id: number;
  studentId: number;
  groupId: number;
  grade: string | null;
  recordFolio: string | null;
  termType: string | null;
}

export interface ReenrollmentDTO {
  id: number;
  studentId: number;
  cycleId: number;
  advisorId: number;
  academicDirectorId: number;
}

export interface StudentProjectDTO {
  id: number;
  studentId: number;
  advisorId: number;
  originInstitution: string | null;
  originCareer: string | null;
  projectType: ProjectType;
  projectName: string;
  totalHours: number;
  startDate: string;
  endDate: string;
}

export interface GroupVisitingProfessorDTO {
  id: number;
  groupId: number;
  professorId: number;
  assignedHours: number;
}

export interface DocTypeDTO {
  id: number;
  name: string;
  target: DocTarget;
}

export interface DocFormatDTO {
  id: number;
  docTypeId: number;
  year: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DocFolioDTO {
  id: number;
  professorId: number;
  docTypeId: number;
  studentId: number | null;
  cycleId: number;
  folioNumber: number;
  fullFolio: string;
  signatoryTitle: string;
  elaboratedBy: number | null;
  reviewedBy: number | null;
  ccList: string | null;
  issuedAt: string;
}

export interface LetterheadConfigDTO {
  logoHeader: string | null;
  topRight: string | null;
  footerBottom: string | null;
  headerBarColor: string;
  accentColor: string;
  updatedAt: string;
}

// ── Auth contracts ────────────────────────────────────

export interface AuthTokenPayload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  user: SafeAdmin;
  token: string;
}

// ── Table view DTOs (denormalized for display) ───────

export interface StudentTableRow {
  id: number;
  name: string;
  lastName: string;
  initials: string;
  registration: string;
  programName: string;
  cycleName: string;
  statusType: string;
}

export interface ProfessorTableRow {
  id: number;
  name: string;
  lastName: string;
  initials: string;
  academicDegree: string | null;
  employeeNumber: string;
  programName: string;
  academicLoad: number;
  statusType: string;
}

export interface SubjectTableRow {
  id: number;
  name: string;
  subjectKey: string;
  credits: number;
  semester: number;
}

export interface GroupTableRow {
  id: number;
  groupKey: string;
  subjectName: string;
  professorName: string;
  campus: string;
  place: string;
  schedule: string | null;
  cycleName: string;
}

// ── Generic API wrappers ──────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
