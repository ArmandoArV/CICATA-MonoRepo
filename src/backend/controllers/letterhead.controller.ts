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
const DIMENSION_FIELDS = [
  "logoHeaderW", "logoHeaderH",
  "topRightW", "topRightH",
  "footerBottomW", "footerBottomH",
  "footerLineThickness",
] as const;
const MARGIN_FIELDS = ["marginLeft", "marginRight", "marginTop", "marginBottom"] as const;

const hexPattern = /^#[0-9A-Fa-f]{6}$/;

type UpdateRecord = Record<string, string | number | boolean | null | Date | Buffer>;

/** Helper: authenticate + fetch updated config after mutation */
async function authAndReturn(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return { auth };
  return { auth: null };
}

async function respondWithConfig() {
  const row = await LetterheadRepository.get();
  if (!row) return error("Failed to retrieve config", 500);
  return success(toLetterheadConfigDTO(row));
}

export const LetterheadController = {
  /** GET /api/letterhead — full config */
  async get(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const row = await LetterheadRepository.get();
      if (!row) return error("Letterhead config not found", 404);
      return success(toLetterheadConfigDTO(row));
    } catch {
      return serverError();
    }
  },

  /** PUT /api/letterhead — images + colors (original endpoint, backward-compat) */
  async update(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const body = await request.json();
      const updates: UpdateRecord = {};

      for (const slot of IMAGE_SLOTS) {
        if (slot in body) {
          const val: string | null = body[slot];
          if (val === null) { updates[slot] = null; }
          else {
            const buf = Buffer.from(val, "base64");
            if (buf.length > MAX_IMAGE_SIZE) return error(`${slot} exceeds 5 MB limit`);
            updates[slot] = buf;
          }
        }
      }

      for (const field of HEX_FIELDS) {
        if (field in body && body[field]) {
          if (!hexPattern.test(body[field])) return error(`${field} must be valid hex (#RRGGBB)`);
          updates[field] = body[field];
        }
      }

      // Also accept text/dimension/margin fields for backward compat
      for (const field of STRING_FIELDS) {
        if (field in body) updates[field] = body[field] === "" ? null : body[field];
      }
      for (const field of [...DIMENSION_FIELDS, ...MARGIN_FIELDS]) {
        if (field in body) {
          const n = Number(body[field]);
          if (isNaN(n) || n < 0) return error(`${field} must be a non-negative number`);
          updates[field] = n;
        }
      }

      if (Object.keys(updates).length === 0) return error("No valid fields provided");
      await LetterheadRepository.update(updates);
      return respondWithConfig();
    } catch {
      return serverError();
    }
  },

  /** PUT /api/letterhead/text — footerText, folioPrefix, cityLocation */
  async updateText(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const body = await request.json();
      const updates: UpdateRecord = {};

      for (const field of STRING_FIELDS) {
        if (field in body) updates[field] = body[field] === "" ? null : body[field];
      }

      if (Object.keys(updates).length === 0) return error("Provide at least one text field: footerText, folioPrefix, cityLocation");
      await LetterheadRepository.update(updates);
      return respondWithConfig();
    } catch {
      return serverError();
    }
  },

  /** PUT /api/letterhead/dimensions — image sizes + line thickness */
  async updateDimensions(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const body = await request.json();
      const updates: UpdateRecord = {};

      for (const field of DIMENSION_FIELDS) {
        if (field in body) {
          const n = Number(body[field]);
          if (isNaN(n) || n < 0) return error(`${field} must be a non-negative number`);
          updates[field] = n;
        }
      }

      if (Object.keys(updates).length === 0) return error("Provide at least one dimension field");
      await LetterheadRepository.update(updates);
      return respondWithConfig();
    } catch {
      return serverError();
    }
  },

  /** PUT /api/letterhead/margins — page margins */
  async updateMargins(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const body = await request.json();
      const updates: UpdateRecord = {};

      for (const field of MARGIN_FIELDS) {
        if (field in body) {
          const n = Number(body[field]);
          if (isNaN(n) || n < 0) return error(`${field} must be a non-negative number`);
          updates[field] = n;
        }
      }

      if (Object.keys(updates).length === 0) return error("Provide at least one margin field: marginLeft, marginRight, marginTop, marginBottom");
      await LetterheadRepository.update(updates);
      return respondWithConfig();
    } catch {
      return serverError();
    }
  },

  /** PUT /api/letterhead/watermark — watermark image upload */
  async updateWatermark(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const body = await request.json();
      const updates: UpdateRecord = {};

      if (!("watermark" in body)) return error("Provide watermark (base64 string or null)");

      const val: string | null = body.watermark;
      if (val === null) {
        updates.watermark = null;
      } else {
        const buf = Buffer.from(val, "base64");
        if (buf.length > MAX_IMAGE_SIZE) return error("Watermark exceeds 5 MB limit");
        updates.watermark = buf;
      }

      await LetterheadRepository.update(updates);
      return respondWithConfig();
    } catch {
      return serverError();
    }
  },

  /** DELETE /api/letterhead — clear an image slot */
  async deleteSlot(request: NextRequest) {
    try {
      const { auth } = await authAndReturn(request);
      if (auth) return auth;

      const body = await request.json();
      const slot = body.slot as ImageSlot;

      if (!IMAGE_SLOTS.includes(slot)) {
        return error(`Invalid slot. Must be one of: ${IMAGE_SLOTS.join(", ")}`);
      }

      await LetterheadRepository.clearSlot(slot);
      return respondWithConfig();
    } catch {
      return serverError();
    }
  },
};
