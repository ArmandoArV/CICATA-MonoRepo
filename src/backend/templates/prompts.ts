import "server-only";

import type { TemplateContext } from "./types";
import { fullName, formatDateSpanish, semesterText, programArticle } from "./rules";
import type { AiBodyRequest } from "@/backend/services/llm.service";

// ── Constants ─────────────────────────────────────────

const PROMPT_VERSION = "1.0.0";

const SYSTEM_PROMPT = `Eres un redactor institucional del Instituto Politécnico Nacional (IPN), específicamente del Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada (CICATA), Unidad Morelos.

Tu tarea es generar el texto del cuerpo de documentos académicos oficiales en español mexicano formal e institucional.

REGLAS ESTRICTAS:
1. Usa ÚNICAMENTE los datos proporcionados. NO inventes nombres, fechas, programas, calificaciones ni ningún otro dato.
2. Mantén un tono formal, institucional y jurídico apropiado para documentos oficiales del IPN.
3. Respeta el género gramatical indicado (M=masculino, F=femenino, X=inclusivo con terminaciones como alumno(a)).
4. NO uses markdown, viñetas, negritas ni ningún formato especial. Solo texto plano.
5. Incluye la frase "A quien corresponda:" al inicio cuando sea apropiado.
6. Cierra siempre con una frase que indique que el documento se extiende para los fines legales que convengan.
7. Menciona la ciudad de Xochitepec, Morelos y la fecha proporcionada al cierre.
8. NO incluyas encabezado, folio, título, firmas ni pie de página — solo el cuerpo del documento.

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido con la estructura:
{
  "paragraphs": ["párrafo 1", "párrafo 2", ...]
}

Cada párrafo debe ser una cadena de texto plano. No incluyas saltos de línea dentro de los párrafos.`;

// ── Sanitized input builder ───────────────────────────

interface AiInput {
  documentType: string;
  studentName?: string;
  gender?: string;
  registration?: string;
  program?: string;
  semester?: string;
  cycle?: string;
  date: string;
  grades?: Array<{ subject: string; grade: string; credits: number; semester: number }>;
  averageGrade?: string;
  recipient?: string;
  projectName?: string;
  originInstitution?: string;
}

function buildSanitizedInput(
  templateId: string,
  ctx: TemplateContext
): AiInput {
  const input: AiInput = {
    documentType: templateId,
    date: formatDateSpanish(ctx.date),
  };

  if (ctx.student) {
    input.studentName = fullName(ctx.student.user.name, ctx.student.user.lastName);
    input.gender = ctx.gender;
    input.registration = ctx.student.registration ?? "N/A";
    input.semester = semesterText(ctx.student.semester);
  }

  input.program = ctx.program.name;
  input.cycle = ctx.cycle.cycle;

  if (ctx.grades && ctx.grades.length > 0) {
    input.grades = ctx.grades.map((g) => ({
      subject: g.subject,
      grade: g.grade,
      credits: g.credits,
      semester: g.semester,
    }));
    const totalCredits = ctx.grades.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = ctx.grades.reduce(
      (sum, g) => sum + parseFloat(g.grade) * g.credits,
      0
    );
    if (totalCredits > 0) {
      input.averageGrade = (weightedSum / totalCredits).toFixed(2);
    }
  }

  if (ctx.customFields?.recipient) input.recipient = ctx.customFields.recipient;
  if (ctx.customFields?.projectName) input.projectName = ctx.customFields.projectName;
  if (ctx.customFields?.originInstitution) input.originInstitution = ctx.customFields.originInstitution;

  return input;
}

// ── Per-template prompt builders ──────────────────────

const templatePrompts: Record<
  string,
  {
    buildUserPrompt: (input: AiInput) => string;
    maxParagraphs: number;
    maxCharsPerParagraph: number;
  }
> = {
  "constancia-inscripcion": {
    maxParagraphs: 4,
    maxCharsPerParagraph: 600,
    buildUserPrompt: (input) =>
      `Genera el cuerpo de una CONSTANCIA DE INSCRIPCIÓN con los siguientes datos:

- Nombre del alumno: ${input.studentName}
- Género: ${input.gender} (M=masculino, F=femenino, X=inclusivo)
- Número de registro: ${input.registration}
- Semestre: ${input.semester}
- Programa: ${programArticle(input.program ?? "")}
- Ciclo escolar: ${input.cycle}
- Fecha: ${input.date}

El documento certifica que el alumno se encuentra inscrito en el programa mencionado, adscrito al CICATA Unidad Morelos del IPN.

Genera entre 2 y ${4} párrafos. Cada párrafo debe tener máximo ${600} caracteres.`,
  },

  "constancia-reinscripcion": {
    maxParagraphs: 4,
    maxCharsPerParagraph: 600,
    buildUserPrompt: (input) =>
      `Genera el cuerpo de una CONSTANCIA DE REINSCRIPCIÓN con los siguientes datos:

- Nombre del alumno: ${input.studentName}
- Género: ${input.gender} (M=masculino, F=femenino, X=inclusivo)
- Número de registro: ${input.registration}
- Semestre: ${input.semester}
- Programa: ${programArticle(input.program ?? "")}
- Ciclo escolar: ${input.cycle}
- Fecha: ${input.date}

El documento certifica que el alumno ha realizado su reinscripción al semestre indicado del programa mencionado, continuando sus estudios en el CICATA Unidad Morelos del IPN.

Genera entre 2 y ${4} párrafos. Cada párrafo debe tener máximo ${600} caracteres.`,
  },

  "constancia-promedio": {
    maxParagraphs: 5,
    maxCharsPerParagraph: 600,
    buildUserPrompt: (input) => {
      let gradesInfo = "";
      if (input.grades && input.grades.length > 0) {
        const lines = input.grades.map(
          (g) =>
            `  - ${g.subject}: calificación ${g.grade}, ${g.credits} créditos, semestre ${g.semester}`
        );
        gradesInfo = `
Calificaciones:
${lines.join("\n")}
Promedio global ponderado: ${input.averageGrade}`;
      }

      return `Genera el cuerpo de una CONSTANCIA DE PROMEDIO GLOBAL con los siguientes datos:

- Nombre del alumno: ${input.studentName}
- Género: ${input.gender} (M=masculino, F=femenino, X=inclusivo)
- Número de registro: ${input.registration}
- Programa: ${programArticle(input.program ?? "")}
- Ciclo escolar: ${input.cycle}
- Fecha: ${input.date}
${gradesInfo}

El documento certifica el promedio global del alumno. NO incluyas una tabla de calificaciones (esa se genera por separado). Menciona el promedio global en texto y, si es posible, exprésalo también en letra.

Genera entre 2 y ${5} párrafos. Cada párrafo debe tener máximo ${600} caracteres.`;
    },
  },

  "carta-aceptacion": {
    maxParagraphs: 5,
    maxCharsPerParagraph: 700,
    buildUserPrompt: (input) =>
      `Genera el cuerpo de una CARTA DE ACEPTACIÓN con los siguientes datos:

- Nombre del alumno: ${input.studentName}
- Género: ${input.gender} (M=masculino, F=femenino, X=inclusivo)
- Número de registro: ${input.registration}
- Programa: ${programArticle(input.program ?? "")}
- Ciclo escolar: ${input.cycle}
- Fecha: ${input.date}
${input.recipient ? `- Dirigida a: ${input.recipient}` : ""}
${input.projectName ? `- Proyecto de investigación: ${input.projectName}` : ""}
${input.originInstitution ? `- Institución de origen: ${input.originInstitution}` : ""}

La carta comunica la aceptación formal del alumno al programa de investigación del CICATA Unidad Morelos del IPN. Si hay un destinatario, dirígete a esa persona al inicio.

Genera entre 3 y ${5} párrafos. Cada párrafo debe tener máximo ${700} caracteres.`,
  },
};

// ── Public API ────────────────────────────────────────

export function buildAiRequest(
  templateId: string,
  ctx: TemplateContext
): AiBodyRequest | null {
  const config = templatePrompts[templateId];
  if (!config) return null;

  const input = buildSanitizedInput(templateId, ctx);

  return {
    templateId,
    promptVersion: PROMPT_VERSION,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: config.buildUserPrompt(input),
    maxParagraphs: config.maxParagraphs,
    maxCharsPerParagraph: config.maxCharsPerParagraph,
  };
}

export function getPromptVersion(): string {
  return PROMPT_VERSION;
}
