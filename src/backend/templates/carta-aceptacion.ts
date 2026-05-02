import "server-only";

import type { TemplateDefinition, AnyTemplateSection } from "./types";
import {
  formatDateSpanish,
  genderize,
  fullName,
  programArticle,
} from "./rules";
import { wrapWithLayout } from "./document-layout";

export const cartaAceptacion: TemplateDefinition = {
  id: "carta-aceptacion",
  name: "Carta de Aceptación",
  docTypeId: 4,
  target: "student",
  buildSections(ctx): AnyTemplateSection[] {
    const studentName = ctx.student
      ? fullName(ctx.student.user.name, ctx.student.user.lastName)
      : "NOMBRE DEL ALUMNO";
    const prog = programArticle(ctx.program.name);
    const gender = genderize(ctx.gender, "student");
    const accepted = genderize(ctx.gender, "accepted");
    const registration = ctx.student?.registration ?? "N/A";
    const cycleName = ctx.cycle.cycle;
    const dateStr = formatDateSpanish(ctx.date);
    const recipient = ctx.customFields?.recipient ?? "A quien corresponda";
    const projectName = ctx.customFields?.projectName ?? "";
    const originInstitution = ctx.customFields?.originInstitution ?? "";

    const projectLine = projectName
      ? `\n\nEl proyecto de investigación asignado es: "${projectName}".`
      : "";

    const originLine = originInstitution
      ? `, proveniente de ${originInstitution},`
      : "";

    return wrapWithLayout(ctx, [
      {
        type: "title",
        content: "CARTA DE ACEPTACIÓN",
        style: { fontSize: 15, font: "sans-bold", align: "center" },
        marginTop: 16,
      },
      {
        type: "body",
        content: () =>
          `${recipient}:\n\nPor medio de la presente se informa que ${gender} ${studentName}${originLine} con número de registro ${registration}, ha sido ${accepted} para cursar el programa ${prog} en el Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada, Unidad Morelos, del Instituto Politécnico Nacional, a partir del ciclo escolar ${cycleName}.${projectLine}\n\nSin otro particular, quedo de usted.\n\nAtentamente,\nXochitepec, Morelos, a ${dateStr}.`,
        style: { fontSize: 11, font: "serif", align: "left", lineHeight: 1.8 },
        marginTop: 10,
      },
      {
        type: "signature",
        content: "",
        style: { fontSize: 10, font: "sans", align: "center" },
        marginTop: 30,
      },
    ]);
  },
};
