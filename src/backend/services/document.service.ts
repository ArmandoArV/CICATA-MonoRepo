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

// ── Page constants ────────────────────────────────────

const PAGE_WIDTH = 612; // Letter
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 72; // 1 inch
const MARGIN_RIGHT = 72;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

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
    const doc = await PDFDocument.create();
    const fonts = await loadFonts(doc);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    let y = PAGE_HEIGHT - MARGIN_TOP;

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
      if (section.type === "image") {
        const img = section as ImageSection;
        if (img.style.pageBottom || img.style.position === "absolute") {
          await drawImage(doc, page, img, y);
        }
      }
      if (section.type === "footer") {
        drawFooter(page, fonts, section as TemplateSection);
      }
    }

    for (const section of sections) {
      if (section.marginTop) y -= section.marginTop;

      // Skip pre-rendered sections
      if (section.type === "image") {
        const img = section as ImageSection;
        if (img.style.pageBottom || img.style.position === "absolute") continue;
        y = await drawImage(doc, page, img, y);
        continue;
      }

      const textSection = section as TemplateSection;
      if (textSection.type === "footer") continue;

      switch (textSection.type) {
        case "header":
          y = drawHeader(page, fonts, textSection, y);
          break;
        case "folio-date":
          y = drawFolioDate(page, fonts, ctx, y);
          break;
        case "title":
          y = drawTitle(page, fonts, textSection, y);
          break;
        case "body":
          y = drawBody(page, fonts, textSection, ctx, y);
          break;
        case "grades-table":
          y = drawGradesTable(page, fonts, ctx.grades ?? [], y);
          break;
        case "signature":
          y = drawSignatures(page, fonts, ctx, y);
          break;
      }

      if (y < MARGIN_BOTTOM + 60) {
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

function drawHeader(page: PDFPage, fonts: FontMap, section: TemplateSection, y: number): number {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = typeof section.content === "string" ? section.content : "";

  for (const line of text.split("\n")) {
    const width = font.widthOfTextAtSize(line, size);
    const x =
      section.style.align === "center"
        ? MARGIN_LEFT + (CONTENT_WIDTH - width) / 2
        : MARGIN_LEFT;

    page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= size * (section.style.lineHeight ?? 1.4);
  }

  return y;
}

function drawFolioDate(page: PDFPage, fonts: FontMap, ctx: TemplateContext, y: number): number {
  const font = fonts["sans"];
  const size = 9;

  page.drawText(ctx.folio, {
    x: MARGIN_LEFT, y, size, font, color: rgb(0.3, 0.3, 0.3),
  });

  const dateStr = formatDateSpanish(ctx.date);
  const dateWidth = font.widthOfTextAtSize(dateStr, size);
  page.drawText(dateStr, {
    x: PAGE_WIDTH - MARGIN_RIGHT - dateWidth, y, size, font, color: rgb(0.3, 0.3, 0.3),
  });

  return y - 24;
}

function drawTitle(page: PDFPage, fonts: FontMap, section: TemplateSection, y: number): number {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = typeof section.content === "string" ? section.content : "";

  const width = font.widthOfTextAtSize(text, size);
  const x = MARGIN_LEFT + (CONTENT_WIDTH - width) / 2;

  page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  return y - size * 2.5;
}

function drawBody(
  page: PDFPage, fonts: FontMap, section: TemplateSection, ctx: TemplateContext, y: number
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

    const lines = wrapText(para, size, CONTENT_WIDTH, font);

    for (const line of lines) {
      let x = MARGIN_LEFT;
      if (section.style.align === "center") {
        x = MARGIN_LEFT + (CONTENT_WIDTH - font.widthOfTextAtSize(line, size)) / 2;
      } else if (section.style.align === "right") {
        x = PAGE_WIDTH - MARGIN_RIGHT - font.widthOfTextAtSize(line, size);
      }

      page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }

    y -= lineHeight * 0.3;
  }

  return y;
}

function drawGradesTable(page: PDFPage, fonts: FontMap, grades: GradeEntry[], y: number): number {
  if (grades.length === 0) return y;

  const font = fonts["sans"];
  const boldFont = fonts["sans-bold"];
  const size = 9;
  const rowHeight = 16;

  const cols = {
    subject: MARGIN_LEFT,
    credits: MARGIN_LEFT + 270,
    semester: MARGIN_LEFT + 340,
    grade: MARGIN_LEFT + 410,
  };

  page.drawText("Materia", { x: cols.subject, y, size, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("Créditos", { x: cols.credits, y, size, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("Semestre", { x: cols.semester, y, size, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("Calif.", { x: cols.grade, y, size, font: boldFont, color: rgb(0, 0, 0) });

  y -= 4;
  page.drawLine({
    start: { x: MARGIN_LEFT, y }, end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
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
    start: { x: MARGIN_LEFT, y: y + 12 }, end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: y + 12 },
    thickness: 0.5, color: rgb(0, 0, 0),
  });

  return y - 8;
}

function drawSignatures(page: PDFPage, fonts: FontMap, ctx: TemplateContext, y: number): number {
  const boldFont = fonts["sans-bold"];
  const font = fonts["sans"];
  const nameSize = 10;
  const titleSize = 8;
  const lemaSize = 9;

  // IPN lema per identity manual (before signature)
  const lemaPrefix = "A T E N T A M E N T E";
  const lema = '"La Técnica al Servicio de la Patria"';

  y -= 20;
  const prefixW = font.widthOfTextAtSize(lemaPrefix, lemaSize);
  page.drawText(lemaPrefix, {
    x: MARGIN_LEFT + (CONTENT_WIDTH - prefixW) / 2, y,
    size: lemaSize, font, color: rgb(0, 0, 0),
  });

  y -= lemaSize + 6;
  const lemaW = font.widthOfTextAtSize(lema, lemaSize);
  page.drawText(lema, {
    x: MARGIN_LEFT + (CONTENT_WIDTH - lemaW) / 2, y,
    size: lemaSize, font, color: rgb(0, 0, 0),
  });

  y -= 30;

  for (const sig of ctx.signatures) {
    const lineWidth = 200;
    const lineX = MARGIN_LEFT + (CONTENT_WIDTH - lineWidth) / 2;

    page.drawLine({
      start: { x: lineX, y }, end: { x: lineX + lineWidth, y },
      thickness: 0.8, color: rgb(0, 0, 0),
    });

    y -= nameSize + 4;
    const nameW = boldFont.widthOfTextAtSize(sig.name, nameSize);
    page.drawText(sig.name, {
      x: MARGIN_LEFT + (CONTENT_WIDTH - nameW) / 2, y,
      size: nameSize, font: boldFont, color: rgb(0, 0, 0),
    });

    y -= titleSize + 4;
    const titleW = font.widthOfTextAtSize(sig.title, titleSize);
    page.drawText(sig.title, {
      x: MARGIN_LEFT + (CONTENT_WIDTH - titleW) / 2, y,
      size: titleSize, font, color: rgb(0.3, 0.3, 0.3),
    });

    if (sig.subtitle) {
      y -= titleSize + 2;
      const subW = font.widthOfTextAtSize(sig.subtitle, titleSize);
      page.drawText(sig.subtitle, {
        x: MARGIN_LEFT + (CONTENT_WIDTH - subW) / 2, y,
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
  y: number
): Promise<number> {
  const filePath = section.content;

  if (!fs.existsSync(filePath)) {
    Logger.warn("PDF", `Image not found, skipping: ${filePath}`);
    return y;
  }

  const bytes = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const image =
    ext === ".jpg" || ext === ".jpeg"
      ? await doc.embedJpg(bytes)
      : await doc.embedPng(bytes);

  const { width, height } = section.style;

  let x: number;
  if (section.style.x !== undefined) {
    x = section.style.x;
  } else if (section.style.align === "center") {
    x = MARGIN_LEFT + (CONTENT_WIDTH - width) / 2;
  } else if (section.style.align === "right") {
    x = PAGE_WIDTH - MARGIN_RIGHT - width;
  } else {
    x = MARGIN_LEFT;
  }

  if (section.style.pageBottom) {
    page.drawImage(image, { x, y: 10, width, height });
    return y;
  }

  // Absolute positioning: y is offset from page top, doesn't affect flow
  if (section.style.position === "absolute") {
    const topOffset = section.style.y ?? 0;
    const pdfY = PAGE_HEIGHT - topOffset - height;
    page.drawImage(image, { x, y: pdfY, width, height });
    return y;
  }

  page.drawImage(image, { x, y: y - height, width, height });

  return y - height;
}

function drawFooter(page: PDFPage, fonts: FontMap, section: TemplateSection): void {
  const font = fonts[section.style.font];
  const size = section.style.fontSize;
  const text = typeof section.content === "string" ? section.content : "";

  // Identity manual 2026: maroon line + address at page bottom
  const lineStartX = 120;
  const lineEndX = PAGE_WIDTH - 35;
  const lineY = 48;

  page.drawLine({
    start: { x: lineStartX, y: lineY },
    end: { x: lineEndX, y: lineY },
    thickness: 1.8,
    color: rgb(0.545, 0.094, 0.129),
  });

  if (text) {
    const maxWidth = lineEndX - lineStartX;
    const lines = wrapText(text, size, maxWidth, font);
    let textY = lineY - 10;
    for (const line of lines) {
      page.drawText(line, {
        x: lineStartX, y: textY, size, font,
        color: rgb(0.35, 0.08, 0.12),
      });
      textY -= size * 1.3;
    }
  }
}
