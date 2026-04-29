import "server-only";

import type { TemplateDefinition } from "./types";
import { constanciaInscripcion } from "./constancia-inscripcion";
import { constanciaReinscripcion } from "./constancia-reinscripcion";
import { constanciaPromedio } from "./constancia-promedio";
import { cartaAceptacion } from "./carta-aceptacion";

const templates: Map<string, TemplateDefinition> = new Map([
  [constanciaInscripcion.id, constanciaInscripcion],
  [constanciaReinscripcion.id, constanciaReinscripcion],
  [constanciaPromedio.id, constanciaPromedio],
  [cartaAceptacion.id, cartaAceptacion],
]);

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.get(id);
}

export function listTemplates(): TemplateDefinition[] {
  return Array.from(templates.values());
}

export type { TemplateDefinition, TemplateContext, GenerateDocumentRequest, GenerateDocumentResponse, AiMetadata } from "./types";
