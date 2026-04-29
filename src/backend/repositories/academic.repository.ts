import "server-only";

import type {
  SubjectRow,
  StudyGroupRow,
  GroupVisitingProfessorRow,
  StudentInGroupRow,
  ReenrollmentRow,
  StudentProjectRow,
} from "@/backend/types";

// ── Subjects ──────────────────────────────────────────

const subjects = new Map<number, SubjectRow>();
let nextSubjectId = 1;

export const SubjectRepository = {
  async findById(id: number): Promise<SubjectRow | null> {
    return subjects.get(id) ?? null;
  },

  async findAll(includeDeleted = false): Promise<SubjectRow[]> {
    const all = Array.from(subjects.values());
    return includeDeleted ? all : all.filter((s) => !s.isDeleted);
  },

  async create(data: Omit<SubjectRow, "idSubject" | "isDeleted">): Promise<SubjectRow> {
    const row: SubjectRow = { idSubject: nextSubjectId++, isDeleted: false, ...data };
    subjects.set(row.idSubject, row);
    return row;
  },

  async update(
    id: number,
    data: Partial<Omit<SubjectRow, "idSubject">>
  ): Promise<SubjectRow | null> {
    const existing = subjects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    subjects.set(id, updated);
    return updated;
  },

  async softDelete(id: number): Promise<boolean> {
    const row = subjects.get(id);
    if (!row) return false;
    row.isDeleted = true;
    return true;
  },
};

// ── Study Groups ──────────────────────────────────────

const groups = new Map<number, StudyGroupRow>();
let nextGroupId = 1;

export const StudyGroupRepository = {
  async findById(id: number): Promise<StudyGroupRow | null> {
    return groups.get(id) ?? null;
  },

  async findAll(): Promise<StudyGroupRow[]> {
    return Array.from(groups.values());
  },

  async findByCycleId(cycleId: number): Promise<StudyGroupRow[]> {
    return Array.from(groups.values()).filter((g) => g.cycleId === cycleId);
  },

  async create(data: Omit<StudyGroupRow, "idGroup">): Promise<StudyGroupRow> {
    const row: StudyGroupRow = { idGroup: nextGroupId++, ...data };
    groups.set(row.idGroup, row);
    return row;
  },
};

// ── Group Visiting Professors ─────────────────────────

const visitors = new Map<number, GroupVisitingProfessorRow>();
let nextVisitorId = 1;

const MAX_VISITORS_PER_GROUP = 4;

export const GroupVisitingProfessorRepository = {
  async findByGroupId(groupId: number): Promise<GroupVisitingProfessorRow[]> {
    return Array.from(visitors.values()).filter((v) => v.groupId === groupId);
  },

  async create(
    data: Omit<GroupVisitingProfessorRow, "idGroupVisitor">
  ): Promise<GroupVisitingProfessorRow> {
    const existing = await this.findByGroupId(data.groupId);
    if (existing.length >= MAX_VISITORS_PER_GROUP) {
      throw new Error(
        "No se pueden asignar más de 4 profesores visitantes por grupo."
      );
    }
    const duplicate = existing.find((v) => v.professorId === data.professorId);
    if (duplicate) {
      throw new Error("Professor already assigned to this group");
    }
    const row: GroupVisitingProfessorRow = {
      idGroupVisitor: nextVisitorId++,
      ...data,
    };
    visitors.set(row.idGroupVisitor, row);
    return row;
  },

  async delete(id: number): Promise<GroupVisitingProfessorRow | null> {
    const row = visitors.get(id);
    if (!row) return null;
    visitors.delete(id);
    return row;
  },
};

// ── Students In Groups ────────────────────────────────

const enrollments = new Map<number, StudentInGroupRow>();
let nextEnrollmentId = 1;

export const StudentInGroupRepository = {
  async findByGroupId(groupId: number): Promise<StudentInGroupRow[]> {
    return Array.from(enrollments.values()).filter(
      (e) => e.groupId === groupId
    );
  },

  async findByStudentId(studentId: number): Promise<StudentInGroupRow[]> {
    return Array.from(enrollments.values()).filter(
      (e) => e.studentId === studentId
    );
  },

  async create(
    data: Omit<StudentInGroupRow, "idEnrollment">
  ): Promise<StudentInGroupRow> {
    for (const e of enrollments.values()) {
      if (e.studentId === data.studentId && e.groupId === data.groupId) {
        throw new Error("Student already enrolled in this group");
      }
    }
    const row: StudentInGroupRow = { idEnrollment: nextEnrollmentId++, ...data };
    enrollments.set(row.idEnrollment, row);
    return row;
  },

  async update(
    id: number,
    data: Partial<Pick<StudentInGroupRow, "grade" | "recordFolio" | "termType">>
  ): Promise<StudentInGroupRow | null> {
    const existing = enrollments.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    enrollments.set(id, updated);
    return updated;
  },
};

// ── Reenrollments ─────────────────────────────────────

const reenrollments = new Map<number, ReenrollmentRow>();
let nextReenrollmentId = 1;

export const ReenrollmentRepository = {
  async findByStudentId(studentId: number): Promise<ReenrollmentRow[]> {
    return Array.from(reenrollments.values()).filter(
      (r) => r.studentId === studentId
    );
  },

  async create(
    data: Omit<ReenrollmentRow, "idReenrollment">
  ): Promise<ReenrollmentRow> {
    for (const r of reenrollments.values()) {
      if (r.studentId === data.studentId && r.cycleId === data.cycleId) {
        throw new Error("Student already reenrolled for this cycle");
      }
    }
    const row: ReenrollmentRow = { idReenrollment: nextReenrollmentId++, ...data };
    reenrollments.set(row.idReenrollment, row);
    return row;
  },
};

// ── Student Projects ──────────────────────────────────

const projects = new Map<number, StudentProjectRow>();
let nextProjectId = 1;

export const StudentProjectRepository = {
  async findById(id: number): Promise<StudentProjectRow | null> {
    return projects.get(id) ?? null;
  },

  async findByStudentId(studentId: number): Promise<StudentProjectRow[]> {
    return Array.from(projects.values()).filter(
      (p) => p.studentId === studentId
    );
  },

  async create(
    data: Omit<StudentProjectRow, "idProject">
  ): Promise<StudentProjectRow> {
    const row: StudentProjectRow = { idProject: nextProjectId++, ...data };
    projects.set(row.idProject, row);
    return row;
  },

  async findAll(): Promise<StudentProjectRow[]> {
    return Array.from(projects.values());
  },
};
