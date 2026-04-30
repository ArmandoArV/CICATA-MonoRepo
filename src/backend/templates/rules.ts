import "server-only";

import { Gender } from "@/shared/types";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const ORDINALS = [
  "",
  "primer",
  "segundo",
  "tercer",
  "cuarto",
  "quinto",
  "sexto",
  "séptimo",
  "octavo",
  "noveno",
  "décimo",
];

/**
 * Format a Date as Spanish long-form: "29 de abril de 2026"
 */
export function formatDateSpanish(date: Date): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} del ${year}`;
}

/**
 * Semester ordinal in Spanish: 1 → "primer", 3 → "tercer"
 */
export function semesterText(n: number): string {
  if (n >= 1 && n <= 10) return ORDINALS[n];
  return `${n}°`;
}

/**
 * Gender-aware article + noun:
 *   M → "el alumno" / "del alumno"
 *   F → "la alumna" / "de la alumna"
 *   X → "el/la alumno(a)"
 */
export function genderize(
  gender: Gender,
  template: "article" | "student" | "enrolled" | "accepted",
): string {
  const map: Record<string, Record<Gender, string>> = {
    article: { [Gender.M]: "el", [Gender.F]: "la", [Gender.X]: "el/la" },
    student: {
      [Gender.M]: "el alumno",
      [Gender.F]: "la alumna",
      [Gender.X]: "el/la alumno(a)",
    },
    enrolled: {
      [Gender.M]: "inscrito",
      [Gender.F]: "inscrita",
      [Gender.X]: "inscrito(a)",
    },
    accepted: {
      [Gender.M]: "aceptado",
      [Gender.F]: "aceptada",
      [Gender.X]: "aceptado(a)",
    },
  };
  return map[template]?.[gender] ?? template;
}

/**
 * Correct Spanish article for a program name:
 * "Maestría en..." → "de la Maestría en..."
 * "Doctorado en..." → "del Doctorado en..."
 */
export function programArticle(programName: string): string {
  const lower = programName.toLowerCase();
  if (lower.startsWith("maestría") || lower.startsWith("especialidad")) {
    return `de la ${programName}`;
  }
  if (lower.startsWith("doctorado")) {
    return `del ${programName}`;
  }
  return `del programa ${programName}`;
}

/**
 * Build full student display name: "GAXIOLA FLORES MARCIO BERNARDO"
 */
export function fullName(name: string, lastName: string): string {
  return `${lastName} ${name}`.toUpperCase();
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}
