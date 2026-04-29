import "server-only";

import type { ProfessorRow } from "@/backend/types";

const professors = new Map<number, ProfessorRow>();
let nextId = 1;

export const ProfessorRepository = {
  async findById(id: number): Promise<ProfessorRow | null> {
    return professors.get(id) ?? null;
  },

  async findByUserId(userId: number): Promise<ProfessorRow | null> {
    for (const prof of professors.values()) {
      if (prof.userId === userId) return prof;
    }
    return null;
  },

  async findByEmployeeNumber(empNum: string): Promise<ProfessorRow | null> {
    for (const prof of professors.values()) {
      if (prof.employeeNumber === empNum) return prof;
    }
    return null;
  },

  async create(data: Omit<ProfessorRow, "idProfessor">): Promise<ProfessorRow> {
    const row: ProfessorRow = { idProfessor: nextId++, ...data };
    professors.set(row.idProfessor, row);
    return row;
  },

  async update(
    id: number,
    data: Partial<Omit<ProfessorRow, "idProfessor">>
  ): Promise<ProfessorRow | null> {
    const existing = professors.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    professors.set(id, updated);
    return updated;
  },

  async findAll(): Promise<ProfessorRow[]> {
    return Array.from(professors.values());
  },

  async findByProgramId(programId: number): Promise<ProfessorRow[]> {
    return Array.from(professors.values()).filter(
      (p) => p.programId === programId
    );
  },
};
