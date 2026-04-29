import "server-only";

import { NextRequest } from "next/server";
import { authenticate, isAuthenticated } from "@/backend/middleware";
import { success, error, serverError } from "@/backend/utils";
import { getTemplate, listTemplates } from "@/backend/templates";
import type { GenerateDocumentRequest, TemplateContext } from "@/backend/templates";
import { DocumentService } from "@/backend/services/document.service";
import { FolioService } from "@/backend/services/folio.service";
import {
  StudentRepository,
  ProfessorRepository,
  UserRepository,
} from "@/backend/repositories";
import {
  ProgramRepository,
  SchoolCycleRepository,
} from "@/backend/repositories";
import { toSafeStudent, toSafeProfessor } from "@/backend/models";
import { Gender } from "@/shared/types";

export const DocumentController = {
  async generate(request: NextRequest) {
    const auth = await authenticate(request);
    if (!isAuthenticated(auth)) return auth;

    try {
      const body: GenerateDocumentRequest = await request.json();

      if (!body.templateId) {
        return error("templateId is required");
      }
      if (!body.cycleId) {
        return error("cycleId is required");
      }

      const template = getTemplate(body.templateId);
      if (!template) {
        return error(`Template "${body.templateId}" not found`, 404);
      }

      // Resolve cycle
      const cycle = await SchoolCycleRepository.findById(body.cycleId);
      if (!cycle) {
        return error("School cycle not found", 404);
      }

      // Generate folio
      const { folioNumber, fullFolio } = await FolioService.generateFolio(
        template.docTypeId,
        body.cycleId
      );

      // Build template context
      const ctx: TemplateContext = {
        program: { id: 0, name: "Programa", isSocialService: false },
        cycle: {
          id: cycle.idCycle,
          cycle: cycle.cycle,
          description: cycle.description,
          startDate: cycle.startDate.toISOString(),
          endDate: cycle.endDate.toISOString(),
        },
        folio: fullFolio,
        date: new Date(),
        gender: Gender.M,
        signatures: body.customFields?.signatoryName
          ? [{
              name: body.customFields.signatoryName,
              title: body.customFields.signatoryTitle ?? "Director(a)",
              subtitle: body.customFields.signatorySubtitle,
            }]
          : [{
              name: "Director(a) CICATA Morelos",
              title: "Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada",
            }],
        customFields: body.customFields,
      };

      // Resolve student if provided
      if (body.studentId) {
        const studentRow = await StudentRepository.findById(body.studentId);
        if (!studentRow) return error("Student not found", 404);

        const userRow = await UserRepository.findById(studentRow.userId);
        if (!userRow) return error("Student user record not found", 404);

        const program = await ProgramRepository.findById(studentRow.programId);
        if (program) {
          ctx.program = {
            id: program.idProgram,
            name: program.name,
            isSocialService: program.isSocialService,
          };
        }

        ctx.student = toSafeStudent(studentRow, userRow, "STUDENT");
        ctx.gender = userRow.gender as Gender;
      }

      // Resolve professor if provided
      if (body.professorId) {
        const profRow = await ProfessorRepository.findById(body.professorId);
        if (!profRow) return error("Professor not found", 404);

        const userRow = await UserRepository.findById(profRow.userId);
        if (!userRow) return error("Professor user record not found", 404);

        const program = await ProgramRepository.findById(profRow.programId);
        if (program) {
          ctx.program = {
            id: program.idProgram,
            name: program.name,
            isSocialService: program.isSocialService,
          };
        }

        ctx.professor = toSafeProfessor(profRow, userRow, "PROFESSOR");
        ctx.gender = userRow.gender as Gender;
      }

      // Parse grades from customFields if present
      if (body.customFields?.grades) {
        try {
          ctx.grades = JSON.parse(body.customFields.grades);
        } catch {
          return error("Invalid grades JSON format");
        }
      }

      // Generate PDF
      const pdfBytes = await DocumentService.generate(template, ctx);
      const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

      const studentName = ctx.student
        ? `${ctx.student.user.lastName}_${ctx.student.user.name}`.replace(/\s+/g, "_")
        : "document";
      const fileName = `${template.id}_${studentName}_${fullFolio}.pdf`;

      // Store folio record
      const { DocFolioRepository } = await import("@/backend/repositories");
      await DocFolioRepository.create({
        professorId: body.professorId ?? 0,
        docTypeId: template.docTypeId,
        studentId: body.studentId ?? null,
        cycleId: body.cycleId,
        folioNumber,
        fullFolio,
        signatoryTitle: ctx.signatures[0]?.title ?? "Director(a)",
        elaboratedBy: auth.adminId,
        reviewedBy: null,
        ccList: null,
      });

      return success({
        pdf: pdfBase64,
        folio: fullFolio,
        fileName,
      });
    } catch (err) {
      console.error("Document generation error:", err);
      return serverError();
    }
  },

  async listAvailableTemplates() {
    const templates = listTemplates();
    return success(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        target: t.target,
      }))
    );
  },
};
