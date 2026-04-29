import "server-only";

export type {
  SafeUser,
  SafeAdmin,
  SafeProfessor,
  SafeStudent,
  ProgramDTO,
  SchoolCycleDTO,
  StatusDTO,
  UserRoleDTO,
  SubjectDTO,
  StudyGroupDTO,
  StudentInGroupDTO,
  ReenrollmentDTO,
  StudentProjectDTO,
  GroupVisitingProfessorDTO,
  DocTypeDTO,
  DocFormatDTO,
  DocFolioDTO,
  AuthTokenPayload,
  LoginRequest,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
} from "@/shared/types";

export {
  Gender,
  TimeModality,
  ProjectType,
  DocTarget,
  StudentStatus,
} from "@/shared/types";

// ── DB Row Types (server-only, never sent to client) ──

export interface UserRow {
  idUser: number;
  name: string;
  lastName: string;
  roleId: number;
  gender: "M" | "F" | "X";
  academicDegree: string | null;
}

export interface AdminRow {
  idAdmin: number;
  userId: number;
  username: string;
  password: string;
  email: string;
}

export interface ProfessorRow {
  idProfessor: number;
  userId: number;
  ipnRegistration: string | null;
  employeeNumber: string;
  academicLoad: number;
  availableHours: number;
  programId: number;
  statusId: number;
}

export interface StudentRow {
  idStudent: number;
  userId: number;
  curp: string;
  registration: string;
  timeModality: "TC" | "TP";
  programId: number;
  localTutorId: number;
  academicDirectorId: number;
  enrollmentCycleId: number;
  semester: number;
  statusId: number;
}

export interface UserRoleRow {
  idRole: number;
  role: string;
}

export interface ProgramRow {
  idProgram: number;
  name: string;
  isSocialService: boolean;
  isDeleted: boolean;
}

export interface SchoolCycleRow {
  idCycle: number;
  cycle: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export interface StatusCatalogRow {
  idStatus: number;
  type: string;
}

export interface SubjectRow {
  idSubject: number;
  name: string;
  subjectKey: string;
  credits: number;
  semester: number;
  topics: string;
  isDeleted: boolean;
}

export interface StudyGroupRow {
  idGroup: number;
  groupKey: string;
  subjectId: number;
  campus: string;
  place: string;
  schedule: string | null;
  professorId: number;
  cycleId: number;
  observations: string | null;
}

export interface GroupVisitingProfessorRow {
  idGroupVisitor: number;
  groupId: number;
  professorId: number;
  assignedHours: number;
}

export interface StudentInGroupRow {
  idEnrollment: number;
  studentId: number;
  groupId: number;
  grade: string | null;
  recordFolio: string | null;
  termType: string | null;
}

export interface ReenrollmentRow {
  idReenrollment: number;
  studentId: number;
  cycleId: number;
  advisorId: number;
  academicDirectorId: number;
}

export interface StudentProjectRow {
  idProject: number;
  studentId: number;
  advisorId: number;
  originInstitution: string | null;
  originCareer: string | null;
  projectType: "Residencia Profesional" | "Servicio Social" | "Estancia Tecnológica";
  projectName: string;
  totalHours: number;
  startDate: Date;
  endDate: Date;
}

export interface DocTypeRow {
  idDocType: number;
  name: string;
  target: "professor" | "student";
}

export interface DocFormatRow {
  idFormat: number;
  docTypeId: number;
  year: number;
  mimeType: string;
  format: Buffer;
  uploadedAt: Date;
}

export interface DocFolioRow {
  idFolio: number;
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
  issuedAt: Date;
}

export interface AuthenticatedRequest {
  userId: number;
  adminId: number;
  email: string;
  role: string;
}
