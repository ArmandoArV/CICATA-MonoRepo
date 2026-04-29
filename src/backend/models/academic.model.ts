import "server-only";

import type {
  SubjectRow,
  StudyGroupRow,
  GroupVisitingProfessorRow,
  StudentInGroupRow,
  ReenrollmentRow,
  StudentProjectRow,
} from "@/backend/types";
import type {
  SubjectDTO,
  StudyGroupDTO,
  GroupVisitingProfessorDTO,
  StudentInGroupDTO,
  ReenrollmentDTO,
  StudentProjectDTO,
} from "@/shared/types";
import { ProjectType } from "@/shared/types";

export function toSubjectDTO(row: SubjectRow): SubjectDTO {
  return {
    id: row.idSubject,
    name: row.name,
    subjectKey: row.subjectKey,
    credits: row.credits,
    semester: row.semester,
    topics: row.topics,
  };
}

export function toStudyGroupDTO(row: StudyGroupRow): StudyGroupDTO {
  return {
    id: row.idGroup,
    groupKey: row.groupKey,
    subjectId: row.subjectId,
    campus: row.campus,
    place: row.place,
    schedule: row.schedule,
    professorId: row.professorId,
    cycleId: row.cycleId,
    observations: row.observations,
  };
}

export function toGroupVisitingProfessorDTO(
  row: GroupVisitingProfessorRow
): GroupVisitingProfessorDTO {
  return {
    id: row.idGroupVisitor,
    groupId: row.groupId,
    professorId: row.professorId,
    assignedHours: row.assignedHours,
  };
}

export function toStudentInGroupDTO(row: StudentInGroupRow): StudentInGroupDTO {
  return {
    id: row.idEnrollment,
    studentId: row.studentId,
    groupId: row.groupId,
    grade: row.grade,
    recordFolio: row.recordFolio,
    termType: row.termType,
  };
}

export function toReenrollmentDTO(row: ReenrollmentRow): ReenrollmentDTO {
  return {
    id: row.idReenrollment,
    studentId: row.studentId,
    cycleId: row.cycleId,
    advisorId: row.advisorId,
    academicDirectorId: row.academicDirectorId,
  };
}

export function toStudentProjectDTO(row: StudentProjectRow): StudentProjectDTO {
  return {
    id: row.idProject,
    studentId: row.studentId,
    advisorId: row.advisorId,
    originInstitution: row.originInstitution,
    originCareer: row.originCareer,
    projectType: row.projectType as ProjectType,
    projectName: row.projectName,
    totalHours: row.totalHours,
    startDate: row.startDate.toISOString().split("T")[0],
    endDate: row.endDate.toISOString().split("T")[0],
  };
}
