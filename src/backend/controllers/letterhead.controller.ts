import "server-only";

import { NextRequest } from "next/server";
import { LetterheadRepository } from "@/backend/repositories";
import { toLetterheadConfigDTO } from "@/backend/models";
import { authenticate, isAuthenticated } from "@/backend/middleware";
import { success, error, serverError } from "@/backend/utils";

const VALID_SLOTS = ["logoHeader", "topRight", "footerBottom"] as const;
type Slot = (typeof VALID_SLOTS)[number];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const LetterheadController = {
  async get(request: NextRequest) {
    try {
      const auth = await authenticate(request);
      if (!isAuthenticated(auth)) return auth;

      const row = await LetterheadRepository.get();
      if (!row) return error("Letterhead config not found", 404);

      return success(toLetterheadConfigDTO(row));
    } catch {
      return serverError();
    }
  },

  async update(request: NextRequest) {
    try {
      const auth = await authenticate(request);
      if (!isAuthenticated(auth)) return auth;

      const body = await request.json();

      // Update images (base64 strings)
      for (const slot of VALID_SLOTS) {
        if (slot in body && body[slot] !== undefined) {
          const b64: string | null = body[slot];
          if (b64 === null) {
            await LetterheadRepository.clearSlot(slot);
          } else {
            const buf = Buffer.from(b64, "base64");
            if (buf.length > MAX_IMAGE_SIZE) {
              return error(`${slot} exceeds 5 MB limit`);
            }
            await LetterheadRepository.upsertImages(slot, buf);
          }
        }
      }

      // Update colors
      if (body.headerBarColor || body.accentColor) {
        const row = await LetterheadRepository.get();
        const hbc = body.headerBarColor ?? row?.headerBarColor ?? "#8B1832";
        const ac = body.accentColor ?? row?.accentColor ?? "#591020";

        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        if (!hexPattern.test(hbc) || !hexPattern.test(ac)) {
          return error("Colors must be valid hex (#RRGGBB)");
        }
        await LetterheadRepository.upsertColors(hbc, ac);
      }

      const updated = await LetterheadRepository.get();
      if (!updated) return error("Failed to retrieve updated config", 500);

      return success(toLetterheadConfigDTO(updated));
    } catch {
      return serverError();
    }
  },

  async deleteSlot(request: NextRequest) {
    try {
      const auth = await authenticate(request);
      if (!isAuthenticated(auth)) return auth;

      const body = await request.json();
      const slot = body.slot as Slot;

      if (!VALID_SLOTS.includes(slot)) {
        return error(`Invalid slot. Must be one of: ${VALID_SLOTS.join(", ")}`);
      }

      await LetterheadRepository.clearSlot(slot);

      const updated = await LetterheadRepository.get();
      if (!updated) return error("Failed to retrieve updated config", 500);

      return success(toLetterheadConfigDTO(updated));
    } catch {
      return serverError();
    }
  },
};
