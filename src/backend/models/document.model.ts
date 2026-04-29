import "server-only";

import type {
  DocTypeRow,
  DocFormatRow,
  DocFolioRow,
} from "@/backend/types";
import type {
  DocTypeDTO,
  DocFormatDTO,
  DocFolioDTO,
} from "@/shared/types";
import { DocTarget } from "@/shared/types";

export function toDocTypeDTO(row: DocTypeRow): DocTypeDTO {
  return {
    id: row.idDocType,
    name: row.name,
    target: row.target as DocTarget,
  };
}

export function toDocFormatDTO(row: DocFormatRow): DocFormatDTO {
  return {
    id: row.idFormat,
    docTypeId: row.docTypeId,
    year: row.year,
    mimeType: row.mimeType,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

export function toDocFolioDTO(row: DocFolioRow): DocFolioDTO {
  return {
    id: row.idFolio,
    professorId: row.professorId,
    docTypeId: row.docTypeId,
    studentId: row.studentId,
    cycleId: row.cycleId,
    folioNumber: row.folioNumber,
    fullFolio: row.fullFolio,
    signatoryTitle: row.signatoryTitle,
    elaboratedBy: row.elaboratedBy,
    reviewedBy: row.reviewedBy,
    ccList: row.ccList,
    issuedAt: row.issuedAt.toISOString(),
  };
}
