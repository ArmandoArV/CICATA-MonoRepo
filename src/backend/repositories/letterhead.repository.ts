import "server-only";

import { queryOne, execute } from "@/backend/database/pool";
import type { LetterheadConfigRow } from "@/backend/types";

export const LetterheadRepository = {
  async get(): Promise<LetterheadConfigRow | null> {
    return queryOne<LetterheadConfigRow>(
      "SELECT * FROM letterheadConfig WHERE id = 1"
    );
  },

  async upsertImages(
    slot: "logoHeader" | "topRight" | "footerBottom",
    data: Buffer | null
  ): Promise<void> {
    await execute(
      `UPDATE letterheadConfig SET ${slot} = ? WHERE id = 1`,
      [data]
    );
  },

  async upsertColors(
    headerBarColor: string,
    accentColor: string
  ): Promise<void> {
    await execute(
      "UPDATE letterheadConfig SET headerBarColor = ?, accentColor = ? WHERE id = 1",
      [headerBarColor, accentColor]
    );
  },

  async clearSlot(slot: "logoHeader" | "topRight" | "footerBottom"): Promise<void> {
    await execute(
      `UPDATE letterheadConfig SET ${slot} = NULL WHERE id = 1`,
      []
    );
  },
};
