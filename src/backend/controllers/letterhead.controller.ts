import "server-only";

import { NextRequest } from "next/server";
import { LetterheadRepository } from "@/backend/repositories";
import { toLetterheadConfigDTO } from "@/backend/models";
import { authenticate, isAuthenticated } from "@/backend/middleware";
import { success, error, serverError } from "@/backend/utils";

const IMAGE_SLOTS = ["logoHeader", "topRight", "footerBottom", "watermark"] as const;
type ImageSlot = (typeof IMAGE_SLOTS)[number];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const HEX_FIELDS = ["headerBarColor", "accentColor"] as const;
const STRING_FIELDS = ["footerText", "folioPrefix", "cityLocation"] as const;
const NUMBER_FIELDS = [
  "footerLineThickness",
  "logoHeaderW", "logoHeaderH",
  "topRightW", "topRightH",
  "footerBottomW", "footerBottomH",
  "marginLeft", "marginRight", "marginTop", "marginBottom",
] as const;

const hexPattern = /^#[0-9A-Fa-f]{6}$/;

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
      const updates: Record<string, string | number | boolean | null | Date | Buffer> = {};

      // ── Image blobs (base64 → Buffer or null) ──
      for (const slot of IMAGE_SLOTS) {
        if (slot in body) {
          const val: string | null = body[slot];
          if (val === null) {
            updates[slot] = null;
          } else {
            const buf = Buffer.from(val, "base64");
            if (buf.length > MAX_IMAGE_SIZE) return error(`${slot} exceeds 5 MB limit`);
            updates[slot] = buf;
          }
        }
      }

      // ── Hex colors ──
      for (const field of HEX_FIELDS) {
        if (field in body && body[field]) {
          if (!hexPattern.test(body[field])) return error(`${field} must be valid hex (#RRGGBB)`);
          updates[field] = body[field];
        }
      }

      // ── Strings ──
      for (const field of STRING_FIELDS) {
        if (field in body) {
          updates[field] = body[field] === "" ? null : body[field];
        }
      }

      // ── Numbers ──
      for (const field of NUMBER_FIELDS) {
        if (field in body) {
          const n = Number(body[field]);
          if (isNaN(n) || n < 0) return error(`${field} must be a non-negative number`);
          updates[field] = n;
        }
      }

      if (Object.keys(updates).length === 0) return error("No valid fields provided");

      await LetterheadRepository.update(updates);

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
      const slot = body.slot as ImageSlot;

      if (!IMAGE_SLOTS.includes(slot)) {
        return error(`Invalid slot. Must be one of: ${IMAGE_SLOTS.join(", ")}`);
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
