import "server-only";

import type { TemplateDefinition, TemplateSection } from "./types";
import {
  formatDateSpanish,
  genderize,
  fullName,
  programArticle,
} from "./rules";

const HEADER_TEXT = "INSTITUTO POLITÉCNICO NACIONAL\nCentro de Investigación en Ciencia Aplicada\ny Tecnología Avanzada — Unidad Morelos";

const FOOTER_TEXT = "CICATA-IPN Unidad Morelos\nBoulevard de la Tecnología 1036, Z-1, P2/2\nC.P. 62790, Xochitepec, Morelos, México";

export const constanciaPromedio: TemplateDefinition = {
  id: "constancia-promedio",
  name: "Constancia de Promedio Global",
  docTypeId: 3,
  target: "student",
  buildSections(ctx): TemplateSection[] {
    const studentName = ctx.student
      ? fullName(ctx.student.user.name, ctx.student.user.lastName)
      : "NOMBRE DEL ALUMNO";
    const prog = programArticle(ctx.program.name);
    const gender = genderize(ctx.gender, "student");
    const registration = ctx.student?.registration ?? "N/A";
    const dateStr = formatDateSpanish(ctx.date);

    // Calculate global average from grades
    const grades = ctx.grades ?? [];
    const numericGrades = grades
      .map((g) => parseFloat(g.grade))
      .filter((n) => !isNaN(n));
    const average =
      numericGrades.length > 0
        ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2)
        : "N/A";

    const semesterCount = grades.length > 0
      ? new Set(grades.map((g) => g.semester)).size
      : 0;

    return [
      {
        type: "header",
        content: HEADER_TEXT,
        style: { fontSize: 13, font: "sans-bold", align: "center", lineHeight: 1.5 },
      },
      {
        type: "folio-date",
        content: "",
        style: { fontSize: 9, font: "sans", align: "left" },
        marginTop: 20,
      },
      {
        type: "title",
        content: "CONSTANCIA DE PROMEDIO GLOBAL",
        style: { fontSize: 16, font: "serif-bold", align: "center" },
        marginTop: 20,
      },
      {
        type: "body",
        content: () =>
          `A quien corresponda:\n\nPor medio de la presente se hace constar que ${gender} ${studentName}, con número de registro ${registration}, inscrito(a) en el programa ${prog}, ha obtenido un promedio global de ${average} (${averageWords(average)}) correspondiente a ${semesterCount} semestre(s) cursado(s).\n\nA continuación se presenta el historial académico:`,
        style: { fontSize: 11, font: "serif", align: "left", lineHeight: 1.8 },
        marginTop: 10,
      },
      {
        type: "grades-table",
        content: "",
        style: { fontSize: 9, font: "sans", align: "left" },
        marginTop: 10,
      },
      {
        type: "body",
        content: () =>
          `\nSe extiende la presente constancia para los fines legales que a ${genderize(ctx.gender, "article")} interesado(a) convengan, en la ciudad de Xochitepec, Morelos, a ${dateStr}.`,
        style: { fontSize: 11, font: "serif", align: "left", lineHeight: 1.8 },
        marginTop: 6,
      },
      {
        type: "signature",
        content: "",
        style: { fontSize: 10, font: "sans", align: "center" },
        marginTop: 20,
      },
      {
        type: "footer",
        content: FOOTER_TEXT,
        style: { fontSize: 7, font: "sans", align: "center" },
      },
    ];
  },
};

function averageWords(avg: string): string {
  const num = parseFloat(avg);
  if (isNaN(num)) return "sin calificación";
  const whole = Math.floor(num);
  const decimal = Math.round((num - whole) * 100);
  return `${numberToWords(whole)} punto ${decimal < 10 ? "cero " : ""}${numberToWords(decimal)}`;
}

function numberToWords(n: number): string {
  const units = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  if (n < 30) return n === 20 ? "veinte" : `veinti${units[n - 20]}`;
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${tens[t]} y ${units[u]}`;
}
