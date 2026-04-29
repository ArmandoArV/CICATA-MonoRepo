import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type {
  SubjectRow,
  StudyGroupRow,
  GroupVisitingProfessorRow,
  StudentInGroupRow,
  ReenrollmentRow,
  StudentProjectRow,
} from "@/backend/types";

// ── Subjects ──────────────────────────────────────────

export const SubjectRepository = {
  async findById(id: number): Promise<SubjectRow | null> {
    return queryOne<SubjectRow>("SELECT * FROM subjects WHERE idSubject = ?", [id]);
  },

  async findAll(includeDeleted = false): Promise<SubjectRow[]> {
    if (includeDeleted) return query<SubjectRow>("SELECT * FROM subjects");
    return query<SubjectRow>("SELECT * FROM subjects WHERE isDeleted = 0");
  },

  async create(data: Omit<SubjectRow, "idSubject" | "isDeleted">): Promise<SubjectRow> {
    const result = await execute(
      "INSERT INTO subjects (name, subjectKey, credits, semester, topics) VALUES (?, ?, ?, ?, ?)",
      [data.name, data.subjectKey, data.credits, data.semester, data.topics]
    );
    return { idSubject: result.insertId, isDeleted: false, ...data };
  },

  async update(id: number, data: Partial<Omit<SubjectRow, "idSubject">>): Promise<SubjectRow | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | boolean | null);
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await execute(`UPDATE subjects SET ${fields.join(", ")} WHERE idSubject = ?`, values);
    return this.findById(id);
  },

  async softDelete(id: number): Promise<boolean> {
    const result = await execute("UPDATE subjects SET isDeleted = 1 WHERE idSubject = ?", [id]);
    return result.affectedRows > 0;
  },
};

// ── Study Groups ──────────────────────────────────────

export const StudyGroupRepository = {
  async findById(id: number): Promise<StudyGroupRow | null> {
    return queryOne<StudyGroupRow>("SELECT * FROM studyGroups WHERE idGroup = ?", [id]);
  },

  async findAll(): Promise<StudyGroupRow[]> {
    return query<StudyGroupRow>("SELECT * FROM studyGroups");
  },

  async findByCycleId(cycleId: number): Promise<StudyGroupRow[]> {
    return query<StudyGroupRow>("SELECT * FROM studyGroups WHERE cycleId = ?", [cycleId]);
  },

  async create(data: Omit<StudyGroupRow, "idGroup">): Promise<StudyGroupRow> {
    const result = await execute(
      `INSERT INTO studyGroups (groupKey, subjectId, campus, place, schedule, professorId, cycleId, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.groupKey, data.subjectId, data.campus, data.place, data.schedule, data.professorId, data.cycleId, data.observations]
    );
    return { idGroup: result.insertId, ...data };
  },
};

// ── Group Visiting Professors ─────────────────────────

export const GroupVisitingProfessorRepository = {
  async findByGroupId(groupId: number): Promise<GroupVisitingProfessorRow[]> {
    return query<GroupVisitingProfessorRow>(
      "SELECT * FROM groupVisitingProfessors WHERE groupId = ?", [groupId]
    );
  },

  async create(data: Omit<GroupVisitingProfessorRow, "idGroupVisitor">): Promise<GroupVisitingProfessorRow> {
    const result = await execute(
      "INSERT INTO groupVisitingProfessors (groupId, professorId, assignedHours) VALUES (?, ?, ?)",
      [data.groupId, data.professorId, data.assignedHours]
    );
    return { idGroupVisitor: result.insertId, ...data };
  },

  async delete(id: number): Promise<GroupVisitingProfessorRow | null> {
    const row = await queryOne<GroupVisitingProfessorRow>(
      "SELECT * FROM groupVisitingProfessors WHERE idGroupVisitor = ?", [id]
    );
    if (!row) return null;
    await execute("DELETE FROM groupVisitingProfessors WHERE idGroupVisitor = ?", [id]);
    return row;
  },
};

// ── Students In Groups ────────────────────────────────

export const StudentInGroupRepository = {
  async findByGroupId(groupId: number): Promise<StudentInGroupRow[]> {
    return query<StudentInGroupRow>("SELECT * FROM studentsInGroups WHERE groupId = ?", [groupId]);
  },

  async findByStudentId(studentId: number): Promise<StudentInGroupRow[]> {
    return query<StudentInGroupRow>("SELECT * FROM studentsInGroups WHERE studentId = ?", [studentId]);
  },

  async create(data: Omit<StudentInGroupRow, "idEnrollment">): Promise<StudentInGroupRow> {
    const result = await execute(
      "INSERT INTO studentsInGroups (studentId, groupId, grade, recordFolio, termType) VALUES (?, ?, ?, ?, ?)",
      [data.studentId, data.groupId, data.grade, data.recordFolio, data.termType]
    );
    return { idEnrollment: result.insertId, ...data };
  },

  async update(
    id: number,
    data: Partial<Pick<StudentInGroupRow, "grade" | "recordFolio" | "termType">>
  ): Promise<StudentInGroupRow | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | boolean | null);
    }
    if (fields.length === 0) return queryOne("SELECT * FROM studentsInGroups WHERE idEnrollment = ?", [id]);
    values.push(id);
    await execute(`UPDATE studentsInGroups SET ${fields.join(", ")} WHERE idEnrollment = ?`, values);
    return queryOne("SELECT * FROM studentsInGroups WHERE idEnrollment = ?", [id]);
  },
};

// ── Reenrollments ─────────────────────────────────────

export const ReenrollmentRepository = {
  async findByStudentId(studentId: number): Promise<ReenrollmentRow[]> {
    return query<ReenrollmentRow>("SELECT * FROM reenrollments WHERE studentId = ?", [studentId]);
  },

  async create(data: Omit<ReenrollmentRow, "idReenrollment">): Promise<ReenrollmentRow> {
    const result = await execute(
      "INSERT INTO reenrollments (studentId, cycleId, advisorId, academicDirectorId) VALUES (?, ?, ?, ?)",
      [data.studentId, data.cycleId, data.advisorId, data.academicDirectorId]
    );
    return { idReenrollment: result.insertId, ...data };
  },
};

// ── Student Projects ──────────────────────────────────

export const StudentProjectRepository = {
  async findById(id: number): Promise<StudentProjectRow | null> {
    return queryOne<StudentProjectRow>("SELECT * FROM studentProjects WHERE idProject = ?", [id]);
  },

  async findByStudentId(studentId: number): Promise<StudentProjectRow[]> {
    return query<StudentProjectRow>("SELECT * FROM studentProjects WHERE studentId = ?", [studentId]);
  },

  async create(data: Omit<StudentProjectRow, "idProject">): Promise<StudentProjectRow> {
    const result = await execute(
      `INSERT INTO studentProjects (studentId, advisorId, originInstitution, originCareer, projectType, projectName, totalHours, startDate, endDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.studentId, data.advisorId, data.originInstitution, data.originCareer, data.projectType, data.projectName, data.totalHours, data.startDate, data.endDate]
    );
    return { idProject: result.insertId, ...data };
  },

  async findAll(): Promise<StudentProjectRow[]> {
    return query<StudentProjectRow>("SELECT * FROM studentProjects");
  },
};
