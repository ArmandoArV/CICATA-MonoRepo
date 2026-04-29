import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type { StudentRow } from "@/backend/types";

export const StudentRepository = {
  async findById(id: number): Promise<StudentRow | null> {
    return queryOne<StudentRow>("SELECT * FROM students WHERE idStudent = ?", [id]);
  },

  async findByUserId(userId: number): Promise<StudentRow | null> {
    return queryOne<StudentRow>("SELECT * FROM students WHERE userId = ?", [userId]);
  },

  async findByCurp(curp: string): Promise<StudentRow | null> {
    return queryOne<StudentRow>("SELECT * FROM students WHERE curp = ?", [curp]);
  },

  async findByRegistration(registration: string): Promise<StudentRow | null> {
    return queryOne<StudentRow>("SELECT * FROM students WHERE registration = ?", [registration]);
  },

  async create(data: Omit<StudentRow, "idStudent">): Promise<StudentRow> {
    const result = await execute(
      `INSERT INTO students (userId, curp, registration, timeModality, programId, localTutorId, academicDirectorId, enrollmentCycleId, semester, statusId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.userId, data.curp, data.registration, data.timeModality, data.programId, data.localTutorId, data.academicDirectorId, data.enrollmentCycleId, data.semester, data.statusId]
    );
    return { idStudent: result.insertId, ...data };
  },

  async update(id: number, data: Partial<Omit<StudentRow, "idStudent">>): Promise<StudentRow | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | boolean | null);
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await execute(`UPDATE students SET ${fields.join(", ")} WHERE idStudent = ?`, values);
    return this.findById(id);
  },

  async findAll(): Promise<StudentRow[]> {
    return query<StudentRow>("SELECT * FROM students");
  },

  async findByProgramId(programId: number): Promise<StudentRow[]> {
    return query<StudentRow>("SELECT * FROM students WHERE programId = ?", [programId]);
  },

  async findByStatusId(statusId: number): Promise<StudentRow[]> {
    return query<StudentRow>("SELECT * FROM students WHERE statusId = ?", [statusId]);
  },
};
