import "server-only";

import fs from "fs";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type {
  TemplateContext,
  TemplateSection,
  TemplateDefinition,
  GradeEntry,
  TextStyle,
  ImageSection,
  AnyTemplateSection,
} from "@/backend/templates/types";
import { formatDateSpanish } from "@/backend/templates/rules";
import { Logger } from "@/backend/utils";
import { LetterheadRepository } from "@/backend/repositories";

// ── Page defaults ─────────────────────────────────────

const PAGE_WIDTH = 612; // Letter
const PAGE_HEIGHT = 792;
const DEF_MARGIN = 72; // 1 inch

/** Resolved per-render layout (margins can be overridden from DB) */
interface Layout {
  pw: number; ph: number;
  ml: number; mr: number; mt: number; mb: number;
  cw: number; // content width
}

function buildLayout(ctx: TemplateContext): Layout {
  const ov = ctx.letterheadOverrides;
  const ml = ov?.marginLeft ?? DEF_MARGIN;
  const mr = ov?.marginRight ?? DEF_MARGIN;
  return {
    pw: PAGE_WIDTH, ph: PAGE_HEIGHT,
    ml, mr,
    mt: ov?.marginTop ?? DEF_MARGIN,
    mb: ov?.marginBottom ?? DEF_MARGIN,
    cw: PAGE_WIDTH - ml - mr,
  };
}

// ── Font map ──────────────────────────────────────────

type FontKey = TextStyle["font"];
type FontMap = Record<FontKey, PDFFont>;

async function loadFonts(doc: PDFDocument): Promise<FontMap> {
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  return { serif, "serif-bold": serifBold, sans, "sans-bold": sansBold };
}

// ── Text drawing helpers ──────────────────────────────

function wrapText(
  text: string,
  fontSize: number,
  maxWidth: number,
  font: PDFFont
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Main generator ────────────────────────────────────

export interface GenerateOptions {
  aiBodyParagraphs?: string[];
}

export const DocumentService = {
  async generate(
    template: TemplateDefinition,
    ctx: TemplateContext,
    options?: GenerateOptions
  ): Promise<Uint8Array> {
    // Load letterhead config from DB and inject into context
    if (!ctx.letterheadOverrides) {
      try {
        const lhRow = await LetterheadRepository.get();
        if (lhRow) {
          ctx.letterheadOverrides = {
            logoHeader: lhRow.logoHeader,
            topRight: lhRow.topRight,
            footerBottom: lhRow.footerBottom,
            watermark: lhRow.watermark,
            headerBarColor: lhRow.headerBarColor,
            accentColor: lhRow.accentColor,
            footerText: lhRow.footerText,
            folioPrefix: lhRow.folioPrefix,
            cityLocation: lhRow.cityLocation,
            footerLineThickness: Number(lhRow.footerLineThickness),
            logoHeaderW: lhRow.logoHeaderW,
            logoHeaderH: lhRow.logoHeaderH,
            topRightW: lhRow.topRightW,
            topRightH: lhRow.topRightH,
            footerBottomW: lhRow.footerBottomW,
            footerBottomH: lhRow.footerBottomH,
            marginLeft: lhRow.marginLeft,
            marginRight: lhRow.marginRight,
            marginTop: lhRow.marginTop,
            marginBottom: lhRow.marginBottom,
          };
        }
      } catch {
        Logger.warn("PDF", "Could not load letterhead config from DB, using static assets");
      }
    }

    const L = buildLayout(ctx);
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    const page = doc.addPage([L.pw, L.ph]);

    let y = L.ph - L.mt;

    const sections = template.buildSections(ctx);

    // If AI-generated body paragraphs are provided, replace the body section content
    if (options?.aiBodyParagraphs && options.aiBodyParagraphs.length > 0) {
      const bodyIdx = sections.findIndex((s) => s.type === "body");
      if (bodyIdx !== -1) {
        const bodySection = sections[bodyIdx] as TemplateSection;
        sections[bodyIdx] = {
          ...bodySection,
          content: options.aiBodyParagraphs.join("\n\n"),
        };
      }
    }

    // Pre-render absolute-positioned elements (independent of flow)
    for (const section of sections) {
      if (section.type === "watermark") {
        await drawWatermark(doc, page, section as ImageSection, L);
        continue;
      }
      if (section.type === "image") {
        const img = section as ImageSection;
        if (img.style.pageBottom || img.style.position === "absolute") {
          await drawImage(doc, page, img, y, L);
        }
      }
      if (section.type === "footer") {
        drawFooter(page, fonts, section as TemplateSection, L);
      }
    }

    for (const section of sections) {
      if (section.marginTop) y -= section.marginTop;

      if (section.type === "watermark") continue;

      if (section.type === "image") {
        const img = section as ImageSection;
        if (img.style.pageBottom || img.style.position === "absolute") continue;
        y = await drawImage(doc, page, img, y, L);
        continue;
      }

      const textSection = section as TemplateSection;
      if (textSection.type === "footer") continue;

      switch (textSection.type) {
        case "header":
          y = drawHeader(page, fonts, textSection, y, L);
          break;
        case "folio-date":
          y = drawFolioDate(page, fonts, ctx, y, L);
          break;
        case "title":
          y = drawTitle(page, fonts, textSection, y, L);
          break;
        case "body":
          y = drawBody(page, fonts, textSection, ctx, y, L);
          break;
        case "grades-table":
          y = drawGradesTable(page, fonts, ctx.grades ?? [], y, L);
          break;
        case "signature":
          y = drawSignatures(page, fonts, ctx, y, L);
          break;
      }

      if (y < L.mb + 60) {
        break;
      }
    }

    return doc.save();
  },
};

// ── Section renderers ─────────────────────────────────

function resolveContent(section: TemplateSection, ctx: TemplateContext): string {
  return typeof section.content === "function"
    ? section.content(ctx)
    : section.content;
}

function drawHeader(page: PDFPage, fonts: FontMap, section: TemplateSection, y: number, L: Layout): number {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = typeof section.content === "string" ? section.content : "";

  for (const line of text.split("\n")) {
    const width = font.widthOfTextAtSize(line, size);
    const x =
      section.style.align === "center"
        ? L.ml + (L.cw - width) / 2
        : L.ml;

    page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= size * (section.style.lineHeight ?? 1.4);
  }

  return y;
}

function drawFolioDate(page: PDFPage, fonts: FontMap, ctx: TemplateContext, y: number, L: Layout): number {
  const font = fonts["sans"];
  const size = 9;

  page.drawText(ctx.folio, {
    x: L.ml, y, size, font, color: rgb(0.3, 0.3, 0.3),
  });

  const dateStr = formatDateSpanish(ctx.date);
  const dateWidth = font.widthOfTextAtSize(dateStr, size);
  page.drawText(dateStr, {
    x: L.pw - L.mr - dateWidth, y, size, font, color: rgb(0.3, 0.3, 0.3),
  });

  return y - 24;
}

function drawTitle(page: PDFPage, fonts: FontMap, section: TemplateSection, y: number, L: Layout): number {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = typeof section.content === "string" ? section.content : "";

  const width = font.widthOfTextAtSize(text, size);
  const x = L.ml + (L.cw - width) / 2;

  page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  return y - size * 2.5;
}

function drawBody(
  page: PDFPage, fonts: FontMap, section: TemplateSection, ctx: TemplateContext, y: number, L: Layout
): number {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = resolveContent(section, ctx);
  const lineHeight = size * (section.style.lineHeight ?? 1.6);

  for (const para of text.split("\n")) {
    if (para.trim() === "") {
      y -= lineHeight;
      continue;
    }

    const lines = wrapText(para, size, L.cw, font);

    for (const line of lines) {
      let x = L.ml;
      if (section.style.align === "center") {
        x = L.ml + (L.cw - font.widthOfTextAtSize(line, size)) / 2;
      } else if (section.style.align === "right") {
        x = L.pw - L.mr - font.widthOfTextAtSize(line, size);
      }

      page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }

    y -= lineHeight * 0.3;
  }

  return y;
}

function drawGradesTable(page: PDFPage, fonts: FontMap, grades: GradeEntry[], y: number, L: Layout): number {
  if (grades.length === 0) return y;

  const font = fonts["sans"];
  const boldFont = fonts["sans-bold"];
  const size = 9;
  const rowHeight = 16;

  const cols = {
    subject: L.ml,
    credits: L.ml + 270,
    semester: L.ml + 340,
    grade: L.ml + 410,
  };

  page.drawText("Materia", { x: cols.subject, y, size, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("Créditos", { x: cols.credits, y, size, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("Semestre", { x: cols.semester, y, size, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("Calif.", { x: cols.grade, y, size, font: boldFont, color: rgb(0, 0, 0) });

  y -= 4;
  page.drawLine({
    start: { x: L.ml, y }, end: { x: L.pw - L.mr, y },
    thickness: 0.5, color: rgb(0, 0, 0),
  });
  y -= rowHeight;

  for (const g of grades) {
    page.drawText(g.subject, { x: cols.subject, y, size, font, color: rgb(0, 0, 0) });
    page.drawText(String(g.credits), { x: cols.credits, y, size, font, color: rgb(0, 0, 0) });
    page.drawText(String(g.semester), { x: cols.semester, y, size, font, color: rgb(0, 0, 0) });
    page.drawText(g.grade, { x: cols.grade, y, size, font, color: rgb(0, 0, 0) });
    y -= rowHeight;
  }

  page.drawLine({
    start: { x: L.ml, y: y + 12 }, end: { x: L.pw - L.mr, y: y + 12 },
    thickness: 0.5, color: rgb(0, 0, 0),
  });

  return y - 8;
}

function drawSignatures(page: PDFPage, fonts: FontMap, ctx: TemplateContext, y: number, L: Layout): number {
  const boldFont = fonts["sans-bold"];
  const font = fonts["sans"];
  const nameSize = 10;
  const titleSize = 8;
  const lemaSize = 9;

  const lemaPrefix = "A T E N T A M E N T E";
  const lema = '"La Técnica al Servicio de la Patria"';

  y -= 20;
  const prefixW = font.widthOfTextAtSize(lemaPrefix, lemaSize);
  page.drawText(lemaPrefix, {
    x: L.ml + (L.cw - prefixW) / 2, y,
    size: lemaSize, font, color: rgb(0, 0, 0),
  });

  y -= lemaSize + 6;
  const lemaW = font.widthOfTextAtSize(lema, lemaSize);
  page.drawText(lema, {
    x: L.ml + (L.cw - lemaW) / 2, y,
    size: lemaSize, font, color: rgb(0, 0, 0),
  });

  y -= 30;

  for (const sig of ctx.signatures) {
    const lineWidth = 200;
    const lineX = L.ml + (L.cw - lineWidth) / 2;

    page.drawLine({
      start: { x: lineX, y }, end: { x: lineX + lineWidth, y },
      thickness: 0.8, color: rgb(0, 0, 0),
    });

    y -= nameSize + 4;
    const nameW = boldFont.widthOfTextAtSize(sig.name, nameSize);
    page.drawText(sig.name, {
      x: L.ml + (L.cw - nameW) / 2, y,
      size: nameSize, font: boldFont, color: rgb(0, 0, 0),
    });

    y -= titleSize + 4;
    const titleW = font.widthOfTextAtSize(sig.title, titleSize);
    page.drawText(sig.title, {
      x: L.ml + (L.cw - titleW) / 2, y,
      size: titleSize, font, color: rgb(0.3, 0.3, 0.3),
    });

    if (sig.subtitle) {
      y -= titleSize + 2;
      const subW = font.widthOfTextAtSize(sig.subtitle, titleSize);
      page.drawText(sig.subtitle, {
        x: L.ml + (L.cw - subW) / 2, y,
        size: titleSize, font, color: rgb(0.3, 0.3, 0.3),
      });
    }

    y -= 30;
  }

  return y;
}

async function drawImage(
  doc: PDFDocument,
  page: PDFPage,
  section: ImageSection,
  y: number,
  L: Layout
): Promise<number> {
  const filePath = section.content;
  let bytes: Uint8Array;
  let ext: string;

  if (filePath.startsWith("buffer:")) {
    const b64 = filePath.slice(7);
    bytes = Uint8Array.from(Buffer.from(b64, "base64"));
    ext = bytes[0] === 0x89 && bytes[1] === 0x50 ? ".png" : ".jpg";
  } else {
    if (!fs.existsSync(filePath)) {
      Logger.warn("PDF", `Image not found, skipping: ${filePath}`);
      return y;
    }
    bytes = fs.readFileSync(filePath);
    ext = path.extname(filePath).toLowerCase();
  }

  const image =
    ext === ".jpg" || ext === ".jpeg"
      ? await doc.embedJpg(bytes)
      : await doc.embedPng(bytes);

  const { width, height } = section.style;

  let x: number;
  if (section.style.x !== undefined) {
    x = section.style.x;
  } else if (section.style.align === "center") {
    x = L.ml + (L.cw - width) / 2;
  } else if (section.style.align === "right") {
    x = L.pw - L.mr - width;
  } else {
    x = L.ml;
  }

  if (section.style.pageBottom) {
    page.drawImage(image, { x, y: 10, width, height });
    return y;
  }

  if (section.style.position === "absolute") {
    const topOffset = section.style.y ?? 0;
    const pdfY = L.ph - topOffset - height;
    page.drawImage(image, { x, y: pdfY, width, height });
    return y;
  }

  page.drawImage(image, { x, y: y - height, width, height });
  return y - height;
}

async function drawWatermark(
  doc: PDFDocument,
  page: PDFPage,
  section: ImageSection,
  L: Layout,
): Promise<void> {
  const filePath = section.content;
  let bytes: Uint8Array;
  let ext: string;

  if (filePath.startsWith("buffer:")) {
    const b64 = filePath.slice(7);
    bytes = Uint8Array.from(Buffer.from(b64, "base64"));
    ext = bytes[0] === 0x89 && bytes[1] === 0x50 ? ".png" : ".jpg";
  } else {
    return;
  }

  try {
    const image =
      ext === ".jpg" || ext === ".jpeg"
        ? await doc.embedJpg(bytes)
        : await doc.embedPng(bytes);

    const wmWidth = 200;
    const wmHeight = wmWidth * (image.height / image.width);
    page.drawImage(image, {
      x: (L.pw - wmWidth) / 2,
      y: (L.ph - wmHeight) / 2,
      width: wmWidth,
      height: wmHeight,
      opacity: 0.08,
    });
  } catch {
    Logger.warn("PDF", "Could not render watermark");
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function drawFooter(page: PDFPage, fonts: FontMap, section: TemplateSection & { _colors?: { headerBarColor?: string; accentColor?: string }; _lineThickness?: number }, L: Layout): void {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = typeof section.content === "string" ? section.content : "";

  const lineColor = section._colors?.headerBarColor
    ? hexToRgb(section._colors.headerBarColor)
    : [0.545, 0.094, 0.129] as [number, number, number];

  const textColor = section._colors?.accentColor
    ? hexToRgb(section._colors.accentColor)
    : [0.35, 0.08, 0.12] as [number, number, number];

  const lineStartX = 120;
  const lineEndX = L.pw - 35;
  const lineY = 48;
  const thickness = section._lineThickness ?? 1.8;

  page.drawLine({
    start: { x: lineStartX, y: lineY },
    end: { x: lineEndX, y: lineY },
    thickness,
    color: rgb(lineColor[0], lineColor[1], lineColor[2]),
  });

  if (text) {
    const maxWidth = lineEndX - lineStartX;
    const lines = wrapText(text, size, maxWidth, font);
    let textY = lineY - 10;
    for (const line of lines) {
      page.drawText(line, {
        x: lineStartX, y: textY, size, font,
        color: rgb(textColor[0], textColor[1], textColor[2]),
      });
      textY -= size * 1.3;
    }
  }
}
