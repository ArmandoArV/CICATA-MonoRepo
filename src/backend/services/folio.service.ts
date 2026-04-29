import "server-only";

import { DocFolioRepository } from "@/backend/repositories";

const FOLIO_PREFIX = "CICATA";

/**
 * Generate the next sequential folio for a given docType and cycle.
 * Format: CICATA-{docTypeId}-{cycleId}-{sequentialNumber}
 */
export const FolioService = {
  async generateFolio(
    docTypeId: number,
    cycleId: number
  ): Promise<{ folioNumber: number; fullFolio: string }> {
    const existing = await DocFolioRepository.findAll();
    const matching = existing.filter(
      (f) => f.docTypeId === docTypeId && f.cycleId === cycleId
    );

    const maxFolio = matching.reduce(
      (max, f) => Math.max(max, f.folioNumber),
      0
    );
    const folioNumber = maxFolio + 1;

    const paddedNumber = String(folioNumber).padStart(4, "0");
    const fullFolio = `${FOLIO_PREFIX}-${docTypeId}-${cycleId}-${paddedNumber}`;

    return { folioNumber, fullFolio };
  },
};
