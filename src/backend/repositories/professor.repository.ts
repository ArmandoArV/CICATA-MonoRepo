import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type { ProfessorRow } from "@/backend/types";

export const ProfessorRepository = {
  async findById(id: number): Promise<ProfessorRow | null> {
    return queryOne<ProfessorRow>("SELECT * FROM professors WHERE idProfessor = ?", [id]);
  },

  async findByUserId(userId: number): Promise<ProfessorRow | null> {
    return queryOne<ProfessorRow>("SELECT * FROM professors WHERE userId = ?", [userId]);
  },

  async findByEmployeeNumber(empNum: string): Promise<ProfessorRow | null> {
    return queryOne<ProfessorRow>("SELECT * FROM professors WHERE employeeNumber = ?", [empNum]);
  },

  async create(data: Omit<ProfessorRow, "idProfessor">): Promise<ProfessorRow> {
    const result = await execute(
      `INSERT INTO professors (userId, ipnRegistration, employeeNumber, academicLoad, availableHours, programId, statusId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.userId, data.ipnRegistration, data.employeeNumber, data.academicLoad, data.availableHours, data.programId, data.statusId]
    );
    return { idProfessor: result.insertId, ...data };
  },

  async update(id: number, data: Partial<Omit<ProfessorRow, "idProfessor">>): Promise<ProfessorRow | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | boolean | null);
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await execute(`UPDATE professors SET ${fields.join(", ")} WHERE idProfessor = ?`, values);
    return this.findById(id);
  },

  async findAll(): Promise<ProfessorRow[]> {
    return query<ProfessorRow>("SELECT * FROM professors");
  },

  async findByProgramId(programId: number): Promise<ProfessorRow[]> {
    return query<ProfessorRow>("SELECT * FROM professors WHERE programId = ?", [programId]);
  },
};
