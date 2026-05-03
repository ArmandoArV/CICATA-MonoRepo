import "server-only";

import path from "path";
import type {
  AnyTemplateSection,
  ImageSection,
  TemplateSection,
  TemplateContext,
  LetterheadOverrides,
} from "./types";
import { formatDateSpanish } from "./rules";

// ── Asset paths (fallback when no DB overrides) ───────

const ASSETS_DIR = path.join(process.cwd(), "src/backend/assets");

export const ASSETS = {
  header: path.join(ASSETS_DIR, "LogoHeader.png"),
  footer: path.join(ASSETS_DIR, "FooterBottomLeft.png"),
  topRight: path.join(ASSETS_DIR, "TopRight.png"),
};

// Re-export so other modules can import from a single place
export type { LetterheadOverrides };

// ── Default footer text ───────────────────────────────

const DEFAULT_FOOTER_TEXT =
  "Boulevard de la Tecnología, 1036, Atlacholoaya, Código Postal 62790, Xochitepec, | Morelos. Tel: 777 308 61 01 | www.ipn.mx | www.cicatamorelos.ipn.mx";

// ── Layout constants ──────────────────────────────────

export const CONTENT_START_MARGIN_TOP = 60;

/** The fixed image sections that form the page header */
function headerImages(ov?: LetterheadOverrides): AnyTemplateSection[] {
  const headerContent =
    ov?.logoHeader && ov.logoHeader.length > 0
      ? `buffer:${ov.logoHeader.toString("base64")}`
      : ASSETS.header;

  const topRightContent =
    ov?.topRight && ov.topRight.length > 0
      ? `buffer:${ov.topRight.toString("base64")}`
      : ASSETS.topRight;

  return [
    {
      type: "image",
      content: headerContent,
      style: {
        width: ov?.logoHeaderW ?? 350,
        height: ov?.logoHeaderH ?? 65,
        x: ov?.marginLeft ?? 40,
        y: 30,
        position: "absolute",
      },
    } as ImageSection,
    {
      type: "image",
      content: topRightContent,
      style: {
        width: ov?.topRightW ?? 90,
        height: ov?.topRightH ?? 90,
        x: 490,
        y: 10,
        position: "absolute",
      },
    } as ImageSection,
  ];
}

/** Folio + date row */
function folioDateSection(ctx: TemplateContext): AnyTemplateSection {
  const ov = ctx.letterheadOverrides;
  const prefix = ov?.folioPrefix ?? "SIP-DI-DDCYT-CICATAMOR-";
  const city = ov?.cityLocation ?? "Xochitepec, Morelos";
  const dateStr = formatDateSpanish(ctx.date);
  return {
    type: "folio-date",
    content: () =>
      `Folio\n${prefix}${ctx.folio ?? "0000-2026"}\n\n${city} a ${dateStr}`,
    style: { fontSize: 9, font: "sans", align: "left", lineHeight: 1.4 },
    marginTop: CONTENT_START_MARGIN_TOP,
  } as TemplateSection;
}

/** Footer image + maroon line + address */
function footerSections(ov?: LetterheadOverrides): AnyTemplateSection[] {
  const footerContent =
    ov?.footerBottom && ov.footerBottom.length > 0
      ? `buffer:${ov.footerBottom.toString("base64")}`
      : ASSETS.footer;

  return [
    {
      type: "image",
      content: footerContent,
      style: {
        width: ov?.footerBottomW ?? 80,
        height: ov?.footerBottomH ?? 80,
        x: 25,
        pageBottom: true,
      },
    } as ImageSection,
    {
      type: "footer",
      content: ov?.footerText ?? DEFAULT_FOOTER_TEXT,
      style: { fontSize: 6, font: "sans", align: "left" },
      _colors: ov
        ? { headerBarColor: ov.headerBarColor, accentColor: ov.accentColor }
        : undefined,
      _lineThickness: ov?.footerLineThickness,
    } as TemplateSection & {
      _colors?: { headerBarColor?: string; accentColor?: string };
      _lineThickness?: number;
    },
  ];
}

/** Watermark section (if provided) */
function watermarkSection(ov?: LetterheadOverrides): AnyTemplateSection[] {
  if (!ov?.watermark || ov.watermark.length === 0) return [];
  return [
    {
      type: "watermark",
      content: `buffer:${ov.watermark.toString("base64")}`,
      style: { width: 200, height: 200, position: "absolute" },
    } as ImageSection,
  ];
}

// ── Public API ────────────────────────────────────────

export function wrapWithLayout(
  ctx: TemplateContext,
  contentSections: AnyTemplateSection[],
  overrides?: LetterheadOverrides,
): AnyTemplateSection[] {
  const ov = overrides ?? ctx.letterheadOverrides;
  return [
    ...headerImages(ov),
    ...watermarkSection(ov),
    folioDateSection(ctx),
    ...contentSections,
    ...footerSections(ov),
  ];
}
