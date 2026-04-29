import "server-only";

import type {
  DocTypeRow,
  DocFormatRow,
  DocFolioRow,
} from "@/backend/types";

// ── Doc Types ─────────────────────────────────────────

const docTypes = new Map<number, DocTypeRow>();
let nextDocTypeId = 1;

export const DocTypeRepository = {
  async findById(id: number): Promise<DocTypeRow | null> {
    return docTypes.get(id) ?? null;
  },

  async findAll(): Promise<DocTypeRow[]> {
    return Array.from(docTypes.values());
  },

  async create(
    data: Omit<DocTypeRow, "idDocType">
  ): Promise<DocTypeRow> {
    const row: DocTypeRow = { idDocType: nextDocTypeId++, ...data };
    docTypes.set(row.idDocType, row);
    return row;
  },
};

// ── Doc Formats ───────────────────────────────────────

const docFormats = new Map<number, DocFormatRow>();
let nextFormatId = 1;

export const DocFormatRepository = {
  async findById(id: number): Promise<DocFormatRow | null> {
    return docFormats.get(id) ?? null;
  },

  async findByDocTypeId(docTypeId: number): Promise<DocFormatRow[]> {
    return Array.from(docFormats.values()).filter(
      (f) => f.docTypeId === docTypeId
    );
  },

  async create(
    data: Omit<DocFormatRow, "idFormat" | "uploadedAt">
  ): Promise<DocFormatRow> {
    for (const f of docFormats.values()) {
      if (f.docTypeId === data.docTypeId && f.year === data.year) {
        throw new Error("Format already exists for this doc type and year");
      }
    }
    const row: DocFormatRow = {
      idFormat: nextFormatId++,
      uploadedAt: new Date(),
      ...data,
    };
    docFormats.set(row.idFormat, row);
    return row;
  },
};

// ── Doc Folios ────────────────────────────────────────

const docFolios = new Map<number, DocFolioRow>();
let nextFolioId = 1;

export const DocFolioRepository = {
  async findById(id: number): Promise<DocFolioRow | null> {
    return docFolios.get(id) ?? null;
  },

  async findByFullFolio(fullFolio: string): Promise<DocFolioRow | null> {
    for (const f of docFolios.values()) {
      if (f.fullFolio === fullFolio) return f;
    }
    return null;
  },

  async findByProfessorId(professorId: number): Promise<DocFolioRow[]> {
    return Array.from(docFolios.values()).filter(
      (f) => f.professorId === professorId
    );
  },

  async findByStudentId(studentId: number): Promise<DocFolioRow[]> {
    return Array.from(docFolios.values()).filter(
      (f) => f.studentId === studentId
    );
  },

  async create(
    data: Omit<DocFolioRow, "idFolio" | "issuedAt">
  ): Promise<DocFolioRow> {
    for (const f of docFolios.values()) {
      if (f.fullFolio === data.fullFolio) {
        throw new Error("Folio already exists");
      }
    }
    const row: DocFolioRow = {
      idFolio: nextFolioId++,
      issuedAt: new Date(),
      ...data,
    };
    docFolios.set(row.idFolio, row);
    return row;
  },

  async findAll(): Promise<DocFolioRow[]> {
    return Array.from(docFolios.values());
  },
};
