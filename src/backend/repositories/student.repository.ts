import "server-only";

import type { StudentRow } from "@/backend/types";

const students = new Map<number, StudentRow>();
let nextId = 1;

export const StudentRepository = {
  async findById(id: number): Promise<StudentRow | null> {
    return students.get(id) ?? null;
  },

  async findByUserId(userId: number): Promise<StudentRow | null> {
    for (const s of students.values()) {
      if (s.userId === userId) return s;
    }
    return null;
  },

  async findByCurp(curp: string): Promise<StudentRow | null> {
    for (const s of students.values()) {
      if (s.curp === curp) return s;
    }
    return null;
  },

  async findByRegistration(registration: string): Promise<StudentRow | null> {
    for (const s of students.values()) {
      if (s.registration === registration) return s;
    }
    return null;
  },

  async create(data: Omit<StudentRow, "idStudent">): Promise<StudentRow> {
    const row: StudentRow = { idStudent: nextId++, ...data };
    students.set(row.idStudent, row);
    return row;
  },

  async update(
    id: number,
    data: Partial<Omit<StudentRow, "idStudent">>
  ): Promise<StudentRow | null> {
    const existing = students.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    students.set(id, updated);
    return updated;
  },

  async findAll(): Promise<StudentRow[]> {
    return Array.from(students.values());
  },

  async findByProgramId(programId: number): Promise<StudentRow[]> {
    return Array.from(students.values()).filter(
      (s) => s.programId === programId
    );
  },

  async findByStatusId(statusId: number): Promise<StudentRow[]> {
    return Array.from(students.values()).filter(
      (s) => s.statusId === statusId
    );
  },
};
