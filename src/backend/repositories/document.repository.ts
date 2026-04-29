import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type {
  DocTypeRow,
  DocFormatRow,
  DocFolioRow,
} from "@/backend/types";

// ── Doc Types ─────────────────────────────────────────

export const DocTypeRepository = {
  async findById(id: number): Promise<DocTypeRow | null> {
    return queryOne<DocTypeRow>("SELECT * FROM docTypes WHERE idDocType = ?", [id]);
  },

  async findAll(): Promise<DocTypeRow[]> {
    return query<DocTypeRow>("SELECT * FROM docTypes");
  },

  async create(data: Omit<DocTypeRow, "idDocType">): Promise<DocTypeRow> {
    const result = await execute(
      "INSERT INTO docTypes (name, target) VALUES (?, ?)",
      [data.name, data.target]
    );
    return { idDocType: result.insertId, ...data };
  },
};

// ── Doc Formats ───────────────────────────────────────

export const DocFormatRepository = {
  async findById(id: number): Promise<DocFormatRow | null> {
    return queryOne<DocFormatRow>("SELECT * FROM docFormats WHERE idFormat = ?", [id]);
  },

  async findByDocTypeId(docTypeId: number): Promise<DocFormatRow[]> {
    return query<DocFormatRow>("SELECT * FROM docFormats WHERE docTypeId = ?", [docTypeId]);
  },

  async create(data: Omit<DocFormatRow, "idFormat" | "uploadedAt">): Promise<DocFormatRow> {
    const result = await execute(
      "INSERT INTO docFormats (docTypeId, year, mimeType, format) VALUES (?, ?, ?, ?)",
      [data.docTypeId, data.year, data.mimeType, data.format]
    );
    return { idFormat: result.insertId, uploadedAt: new Date(), ...data };
  },
};

// ── Doc Folios ────────────────────────────────────────

export const DocFolioRepository = {
  async findById(id: number): Promise<DocFolioRow | null> {
    return queryOne<DocFolioRow>("SELECT * FROM docFolios WHERE idFolio = ?", [id]);
  },

  async findByFullFolio(fullFolio: string): Promise<DocFolioRow | null> {
    return queryOne<DocFolioRow>("SELECT * FROM docFolios WHERE fullFolio = ?", [fullFolio]);
  },

  async findByProfessorId(professorId: number): Promise<DocFolioRow[]> {
    return query<DocFolioRow>("SELECT * FROM docFolios WHERE professorId = ?", [professorId]);
  },

  async findByStudentId(studentId: number): Promise<DocFolioRow[]> {
    return query<DocFolioRow>("SELECT * FROM docFolios WHERE studentId = ?", [studentId]);
  },

  async create(data: Omit<DocFolioRow, "idFolio" | "issuedAt">): Promise<DocFolioRow> {
    const result = await execute(
      `INSERT INTO docFolios (professorId, docTypeId, studentId, cycleId, folioNumber, fullFolio, signatoryTitle, elaboratedBy, reviewedBy, ccList)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.professorId, data.docTypeId, data.studentId, data.cycleId, data.folioNumber, data.fullFolio, data.signatoryTitle, data.elaboratedBy, data.reviewedBy, data.ccList]
    );
    return { idFolio: result.insertId, issuedAt: new Date(), ...data };
  },

  async findAll(): Promise<DocFolioRow[]> {
    return query<DocFolioRow>("SELECT * FROM docFolios");
  },
};
