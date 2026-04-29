import "server-only";

import type { TemplateDefinition, TemplateSection } from "./types";
import {
  formatDateSpanish,
  genderize,
  semesterText,
  fullName,
  programArticle,
} from "./rules";

const HEADER_TEXT = "INSTITUTO POLITÉCNICO NACIONAL\nCentro de Investigación en Ciencia Aplicada\ny Tecnología Avanzada — Unidad Morelos";

const FOOTER_TEXT = "CICATA-IPN Unidad Morelos\nBoulevard de la Tecnología 1036, Z-1, P2/2\nC.P. 62790, Xochitepec, Morelos, México";

export const constanciaInscripcion: TemplateDefinition = {
  id: "constancia-inscripcion",
  name: "Constancia de Inscripción",
  docTypeId: 1,
  target: "student",
  buildSections(ctx): TemplateSection[] {
    const studentName = ctx.student
      ? fullName(ctx.student.user.name, ctx.student.user.lastName)
      : "NOMBRE DEL ALUMNO";
    const sem = ctx.student ? semesterText(ctx.student.semester) : "primer";
    const prog = programArticle(ctx.program.name);
    const gender = genderize(ctx.gender, "student");
    const enrolled = genderize(ctx.gender, "enrolled");
    const registration = ctx.student?.registration ?? "N/A";
    const dateStr = formatDateSpanish(ctx.date);

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
        content: "CONSTANCIA DE INSCRIPCIÓN",
        style: { fontSize: 16, font: "serif-bold", align: "center" },
        marginTop: 20,
      },
      {
        type: "body",
        content: () =>
          `A quien corresponda:\n\nPor medio de la presente se hace constar que ${gender} ${studentName}, con número de registro ${registration}, se encuentra ${enrolled} en el ${sem} semestre ${prog}, adscrito(a) al Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada, Unidad Morelos, del Instituto Politécnico Nacional.\n\nSe extiende la presente constancia para los fines legales que a ${genderize(ctx.gender, "article")} interesado(a) convengan, en la ciudad de Xochitepec, Morelos, a ${dateStr}.`,
        style: { fontSize: 11, font: "serif", align: "left", lineHeight: 1.8 },
        marginTop: 10,
      },
      {
        type: "signature",
        content: "",
        style: { fontSize: 10, font: "sans", align: "center" },
        marginTop: 30,
      },
      {
        type: "footer",
        content: FOOTER_TEXT,
        style: { fontSize: 7, font: "sans", align: "center" },
      },
    ];
  },
};
