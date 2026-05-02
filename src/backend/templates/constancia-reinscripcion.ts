import "server-only";

import type { TemplateDefinition, AnyTemplateSection } from "./types";
import {
  formatDateSpanish,
  genderize,
  semesterText,
  fullName,
  programArticle,
} from "./rules";
import { wrapWithLayout } from "./document-layout";

export const constanciaReinscripcion: TemplateDefinition = {
  id: "constancia-reinscripcion",
  name: "Constancia de Reinscripción",
  docTypeId: 2,
  target: "student",
  buildSections(ctx): AnyTemplateSection[] {
    const studentName = ctx.student
      ? fullName(ctx.student.user.name, ctx.student.user.lastName)
      : "NOMBRE DEL ALUMNO";
    const sem = ctx.student ? semesterText(ctx.student.semester) : "primer";
    const prog = programArticle(ctx.program.name);
    const gender = genderize(ctx.gender, "student");
    const enrolled = genderize(ctx.gender, "enrolled");
    const registration = ctx.student?.registration ?? "N/A";
    const cycleName = ctx.cycle.cycle;
    const dateStr = formatDateSpanish(ctx.date);

    return wrapWithLayout(ctx, [
      {
        type: "title",
        content: "CONSTANCIA DE REINSCRIPCIÓN",
        style: { fontSize: 15, font: "sans-bold", align: "center" },
        marginTop: 16,
      },
      {
        type: "body",
        content: () =>
          `A quien corresponda:\n\nPor medio de la presente se hace constar que ${gender} ${studentName}, con número de registro ${registration}, ha sido reinscrito(a) en el ${sem} semestre ${prog}, correspondiente al ciclo escolar ${cycleName}, en el Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada, Unidad Morelos, del Instituto Politécnico Nacional.\n\nEl/La alumno(a) se encuentra actualmente ${enrolled} y al corriente en sus obligaciones académicas.\n\nSe extiende la presente constancia para los fines legales que a ${genderize(ctx.gender, "article")} interesado(a) convengan, en la ciudad de Xochitepec, Morelos, a ${dateStr}.`,
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
