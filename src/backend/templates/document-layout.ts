import "server-only";

import path from "path";
import type {
  AnyTemplateSection,
  ImageSection,
  TemplateSection,
  TemplateContext,
} from "./types";
import { formatDateSpanish } from "./rules";

/**
 * Shared document "brochure" layout.
 *
 * Defines the fixed visual elements (header images, footer image, maroon line,
 * address text) and safe content zones so text never overlaps images.
 *
 * Each template only needs to provide its inner content sections (title, body,
 * grades-table, signature). This file wraps them with the standard layout.
 */

// ── Asset paths (fallback when no DB overrides) ───────

const ASSETS_DIR = path.join(process.cwd(), "src/backend/assets");

export const ASSETS = {
  header: path.join(ASSETS_DIR, "LogoHeader.png"),
  footer: path.join(ASSETS_DIR, "FooterBottomLeft.png"),
  topRight: path.join(ASSETS_DIR, "TopRight.png"),
};

// ── Letterhead override data (loaded from DB) ─────────

export interface LetterheadOverrides {
  logoHeader?: Buffer | null;
  topRight?: Buffer | null;
  footerBottom?: Buffer | null;
  headerBarColor?: string;
  accentColor?: string;
}

// ── Layout constants (safe content boundaries in points) ──

/** Top of content area (below header images). */
export const CONTENT_START_MARGIN_TOP = 60;

/** The fixed image sections that form the page "brochure" */
function headerImages(overrides?: LetterheadOverrides): AnyTemplateSection[] {
  const headerContent =
    overrides?.logoHeader && overrides.logoHeader.length > 0
      ? `buffer:${overrides.logoHeader.toString("base64")}`
      : ASSETS.header;

  const topRightContent =
    overrides?.topRight && overrides.topRight.length > 0
      ? `buffer:${overrides.topRight.toString("base64")}`
      : ASSETS.topRight;

  return [
    {
      type: "image",
      content: headerContent,
      style: {
        width: 350,
        height: 65,
        x: 40,
        y: 30,
        position: "absolute",
      },
    } as ImageSection,
    {
      type: "image",
      content: topRightContent,
      style: {
        width: 90,
        height: 90,
        x: 490,
        y: 10,
        position: "absolute",
      },
    } as ImageSection,
  ];
}

/** Folio + date row that sits just below the header images */
function folioDateSection(ctx: TemplateContext): AnyTemplateSection {
  const dateStr = formatDateSpanish(ctx.date);
  return {
    type: "folio-date",
    content: () =>
      `Folio\nSIP-DI-DDCYT-CICATAMOR-${ctx.folio ?? "0000-2026"}\n\nXochitepec, Morelos a ${dateStr}`,
    style: { fontSize: 9, font: "sans", align: "left", lineHeight: 1.4 },
    marginTop: CONTENT_START_MARGIN_TOP,
  } as TemplateSection;
}

/** Footer image (bottom-left corner) + maroon line + address */
function footerSections(overrides?: LetterheadOverrides): AnyTemplateSection[] {
  const footerContent =
    overrides?.footerBottom && overrides.footerBottom.length > 0
      ? `buffer:${overrides.footerBottom.toString("base64")}`
      : ASSETS.footer;

  return [
    {
      type: "image",
      content: footerContent,
      style: { width: 80, height: 80, x: 25, pageBottom: true },
    } as ImageSection,
    {
      type: "footer",
      content:
        "Boulevard de la Tecnología, 1036, Atlacholoaya, Código Postal 62790, Xochitepec, | Morelos. Tel: 777 308 61 01 | www.ipn.mx | www.cicatamorelos.ipn.mx",
      style: { fontSize: 6, font: "sans", align: "left" },
      // Attach color overrides for the footer renderer
      _colors: overrides
        ? { headerBarColor: overrides.headerBarColor, accentColor: overrides.accentColor }
        : undefined,
    } as TemplateSection & { _colors?: { headerBarColor?: string; accentColor?: string } },
  ];
}

// ── Public API ────────────────────────────────────────

/**
 * Wraps an array of content sections (title, body, grades-table, signature)
 * with the standard brochure layout (header images → folio/date → [content] → footer).
 *
 * Templates only need to provide their unique middle content.
 */
export function wrapWithLayout(
  ctx: TemplateContext,
  contentSections: AnyTemplateSection[],
  overrides?: LetterheadOverrides,
): AnyTemplateSection[] {
  const ov = overrides ?? ctx.letterheadOverrides;
  return [
    ...headerImages(ov),
    folioDateSection(ctx),
    ...contentSections,
    ...footerSections(ov),
  ];
}
