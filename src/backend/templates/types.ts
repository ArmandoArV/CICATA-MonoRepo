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
  | "footer"
  | "watermark";

export interface TemplateSection {
  type: SectionType;
  content: string | ((ctx: TemplateContext) => string);
  style: TextStyle;
  /** Extra vertical spacing before this section (in points) */
  marginTop?: number;
}

// ── Image sections ────────────────────────────────────

export interface ImageStyle {
  width: number;
  height: number;
  align?: "left" | "center" | "right";
  /** Absolute x position in points (overrides align) */
  x?: number;
  /** Offset from page top in points (used with position: "absolute") */
  y?: number;
  /** If "absolute", image is positioned by x/y from page edges, ignores flow */
  position?: "absolute";
  /** Anchor image to the page bottom (absolute position, ignores flow) */
  pageBottom?: boolean;
}

export interface ImageSection {
  type: "image" | "watermark";
  /** Absolute file path to the image (png/jpg) or buffer:base64 */
  content: string;
  style: ImageStyle;
  marginTop?: number;
}

/** Union of all renderable section types */
export type AnyTemplateSection = TemplateSection | ImageSection;

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

export interface LetterheadOverrides {
  logoHeader?: Buffer | null;
  topRight?: Buffer | null;
  footerBottom?: Buffer | null;
  watermark?: Buffer | null;
  headerBarColor?: string;
  accentColor?: string;
  footerText?: string | null;
  folioPrefix?: string;
  cityLocation?: string;
  footerLineThickness?: number;
  logoHeaderW?: number;
  logoHeaderH?: number;
  topRightW?: number;
  topRightH?: number;
  footerBottomW?: number;
  footerBottomH?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
}

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
  letterheadOverrides?: LetterheadOverrides;
}

// ── Template definition ───────────────────────────────

export interface TemplateDefinition {
  id: string;
  name: string;
  docTypeId: number;
  target: "student" | "professor";
  buildSections: (ctx: TemplateContext) => AnyTemplateSection[];
}

// ── AI metadata ───────────────────────────────────────

export interface AiMetadata {
  aiRequested: boolean;
  aiUsed: boolean;
  model?: string;
  promptVersion?: string;
  fallbackReason?: string;
}

// ── API request / response ────────────────────────────

export interface GenerateDocumentRequest {
  templateId: string;
  studentId?: number;
  professorId?: number;
  cycleId: number;
  useAI?: boolean;
  customFields?: Record<string, string>;
}

export interface GenerateDocumentResponse {
  pdf: string; // base64
  folio: string;
  fileName: string;
  ai: AiMetadata;
}
