import "server-only";

import { queryOne, execute } from "@/backend/database/pool";
import type { LetterheadConfigRow } from "@/backend/types";

const IMAGE_SLOTS = ["logoHeader", "topRight", "footerBottom", "watermark"] as const;

export const LetterheadRepository = {
  async get(): Promise<LetterheadConfigRow | null> {
    return queryOne<LetterheadConfigRow>(
      "SELECT * FROM letterheadConfig WHERE id = 1"
    );
  },

  /** Generic field updater — caller is responsible for validation */
  async update(fields: Record<string, string | number | boolean | null | Date | Buffer>): Promise<void> {
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;
    const setClauses = entries.map(([k]) => `\`${k}\` = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    await execute(`UPDATE letterheadConfig SET ${setClauses} WHERE id = 1`, values);
  },

  async clearSlot(slot: typeof IMAGE_SLOTS[number]): Promise<void> {
    await execute(
      `UPDATE letterheadConfig SET \`${slot}\` = NULL WHERE id = 1`,
      []
    );
  },
};
