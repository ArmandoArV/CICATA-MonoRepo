import "server-only";

import type {
  SafeStudent,
  SafeProfessor,
  ProgramDTO,
  SchoolCycleDTO,
} from "@/shared/types";
import type { Gender } from "@/shared/types";

// ── Text styling ──────────────────────────────────────

export interface TextStyle {
  fontSize: number;
  font: "serif" | "sans" | "serif-bold" | "sans-bold";
  align: "left" | "center" | "right";
  lineHeight?: number;
  color?: [number, number, number]; // RGB 0-1
}

// ── Template sections ─────────────────────────────────

export type SectionType =
  | "header"
  | "folio-date"
  | "title"
  | "body"
  | "grades-table"
  | "signature"
  | "footer";

export interface TemplateSection {
  type: SectionType;
  content: string | ((ctx: TemplateContext) => string);
  style: TextStyle;
  /** Extra vertical spacing before this section (in points) */
  marginTop?: number;
}

export interface SignatureBlock {
  name: string;
  title: string;
  subtitle?: string;
}

export interface GradeEntry {
  subject: string;
  grade: string;
  credits: number;
  semester: number;
}

// ── Template context (data passed to render) ──────────

export interface TemplateContext {
  student?: SafeStudent;
  professor?: SafeProfessor;
  program: ProgramDTO;
  cycle: SchoolCycleDTO;
  folio: string;
  date: Date;
  gender: Gender;
  grades?: GradeEntry[];
  signatures: SignatureBlock[];
  customFields?: Record<string, string>;
}

// ── Template definition ───────────────────────────────

export interface TemplateDefinition {
  id: string;
  name: string;
  docTypeId: number;
  target: "student" | "professor";
  buildSections: (ctx: TemplateContext) => TemplateSection[];
}

// ── API request / response ────────────────────────────

export interface GenerateDocumentRequest {
  templateId: string;
  studentId?: number;
  professorId?: number;
  cycleId: number;
  customFields?: Record<string, string>;
}

export interface GenerateDocumentResponse {
  pdf: string; // base64
  folio: string;
  fileName: string;
}
