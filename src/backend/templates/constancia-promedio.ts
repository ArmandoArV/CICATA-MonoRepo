import "server-only";

import type { TemplateDefinition, AnyTemplateSection } from "./types";
import {
  formatDateSpanish,
  genderize,
  fullName,
  programArticle,
} from "./rules";
import { wrapWithLayout } from "./document-layout";

export const constanciaPromedio: TemplateDefinition = {
  id: "constancia-promedio",
  name: "Constancia de Promedio Global",
  docTypeId: 3,
  target: "student",

  buildSections(ctx): AnyTemplateSection[] {
    const studentName = ctx.student
      ? fullName(ctx.student.user.name, ctx.student.user.lastName)
      : "NOMBRE DEL ALUMNO";

    const prog = programArticle(ctx.program.name);
    const gender = genderize(ctx.gender, "student");
    const registration = ctx.student?.registration ?? "N/A";
    const dateStr = formatDateSpanish(ctx.date);

    const grades = ctx.grades ?? [];

    const numericGrades = grades
      .map((g) => parseFloat(g.grade))
      .filter((n) => !isNaN(n));

    const average =
      numericGrades.length > 0
        ? (
            numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
          ).toFixed(2)
        : "N/A";

    const semesterCount =
      grades.length > 0 ? new Set(grades.map((g) => g.semester)).size : 0;

    return wrapWithLayout(ctx, [
      {
        type: "title",
        content: "CONSTANCIA DE PROMEDIO GLOBAL",
        style: { fontSize: 15, font: "sans-bold", align: "center" },
        marginTop: 16,
      },
      {
        type: "body",
        content: () =>
          `A QUIEN CORRESPONDA:\n\nSe hace constar que ${gender} ${studentName}, con número de registro ${registration}, alumno(a) inscrito(a) en ${prog}, ha obtenido un promedio global de ${average} (${averageWords(average)}), correspondiente a ${semesterCount} semestre(s) cursado(s).\n\nAsimismo, se hace constar que las siguientes unidades de aprendizaje corresponden a las materias cursadas hasta la fecha:`,
        style: {
          fontSize: 10.5,
          font: "serif",
          align: "left",
          lineHeight: 1.7,
        },
        marginTop: 14,
      },
      {
        type: "grades-table",
        content: "",
        style: { fontSize: 8.5, font: "sans", align: "left" },
        marginTop: 10,
      },
      {
        type: "body",
        content: () =>
          `\nSe extiende la presente CONSTANCIA para los fines que a la interesada(o) convengan, en Xochitepec, Morelos, a ${dateStr}.`,
        style: {
          fontSize: 10.5,
          font: "serif",
          align: "left",
          lineHeight: 1.7,
        },
        marginTop: 8,
      },
      {
        type: "signature",
        content: "",
        style: { fontSize: 10, font: "sans", align: "center" },
        marginTop: 28,
      },
    ]);
  },
};

function averageWords(avg: string): string {
  const num = parseFloat(avg);
  if (isNaN(num)) return "sin calificación";

  const whole = Math.floor(num);
  const decimal = Math.round((num - whole) * 100);

  return `${numberToWords(whole)} punto ${
    decimal < 10 ? "cero " : ""
  }${numberToWords(decimal)}`;
}

function numberToWords(n: number): string {
  const units = [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];

  const teens = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];

  const tens = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];

  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  if (n < 30) return n === 20 ? "veinte" : `veinti${units[n - 20]}`;

  const t = Math.floor(n / 10);
  const u = n % 10;

  return u === 0 ? tens[t] : `${tens[t]} y ${units[u]}`;
}
