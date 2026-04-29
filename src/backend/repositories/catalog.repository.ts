import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type {
  UserRoleRow,
  ProgramRow,
  SchoolCycleRow,
  StatusCatalogRow,
} from "@/backend/types";

// ── User Roles ────────────────────────────────────────

export const UserRoleRepository = {
  async findById(id: number): Promise<UserRoleRow | null> {
    return queryOne<UserRoleRow>("SELECT * FROM userRoles WHERE idRole = ?", [id]);
  },

  async findByName(role: string): Promise<UserRoleRow | null> {
    return queryOne<UserRoleRow>("SELECT * FROM userRoles WHERE role = ?", [role]);
  },

  async create(role: string): Promise<UserRoleRow> {
    const result = await execute("INSERT INTO userRoles (role) VALUES (?)", [role]);
    return { idRole: result.insertId, role };
  },

  async findAll(): Promise<UserRoleRow[]> {
    return query<UserRoleRow>("SELECT * FROM userRoles");
  },
};

// ── Programs ──────────────────────────────────────────

export const ProgramRepository = {
  async findById(id: number): Promise<ProgramRow | null> {
    return queryOne<ProgramRow>("SELECT * FROM programs WHERE idProgram = ?", [id]);
  },

  async findAll(includeDeleted = false): Promise<ProgramRow[]> {
    if (includeDeleted) return query<ProgramRow>("SELECT * FROM programs");
    return query<ProgramRow>("SELECT * FROM programs WHERE isDeleted = 0");
  },

  async create(data: { name: string; isSocialService: boolean }): Promise<ProgramRow> {
    const result = await execute(
      "INSERT INTO programs (name, isSocialService) VALUES (?, ?)",
      [data.name, data.isSocialService ? 1 : 0]
    );
    return { idProgram: result.insertId, name: data.name, isSocialService: data.isSocialService, isDeleted: false };
  },

  async softDelete(id: number): Promise<boolean> {
    const result = await execute("UPDATE programs SET isDeleted = 1 WHERE idProgram = ?", [id]);
    return result.affectedRows > 0;
  },
};

// ── School Cycles ─────────────────────────────────────

export const SchoolCycleRepository = {
  async findById(id: number): Promise<SchoolCycleRow | null> {
    return queryOne<SchoolCycleRow>("SELECT * FROM schoolCycles WHERE idCycle = ?", [id]);
  },

  async findAll(): Promise<SchoolCycleRow[]> {
    return query<SchoolCycleRow>("SELECT * FROM schoolCycles");
  },

  async create(data: Omit<SchoolCycleRow, "idCycle">): Promise<SchoolCycleRow> {
    const result = await execute(
      "INSERT INTO schoolCycles (cycle, description, startDate, endDate) VALUES (?, ?, ?, ?)",
      [data.cycle, data.description, data.startDate, data.endDate]
    );
    return { idCycle: result.insertId, ...data };
  },
};

// ── Status Catalog ────────────────────────────────────

export const StatusCatalogRepository = {
  async findById(id: number): Promise<StatusCatalogRow | null> {
    return queryOne<StatusCatalogRow>("SELECT * FROM statusCatalog WHERE idStatus = ?", [id]);
  },

  async findByType(type: string): Promise<StatusCatalogRow | null> {
    return queryOne<StatusCatalogRow>("SELECT * FROM statusCatalog WHERE type = ?", [type]);
  },

  async findAll(): Promise<StatusCatalogRow[]> {
    return query<StatusCatalogRow>("SELECT * FROM statusCatalog");
  },
};
