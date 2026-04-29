import "server-only";

import type {
  UserRoleRow,
  ProgramRow,
  SchoolCycleRow,
  StatusCatalogRow,
} from "@/backend/types";

// ── User Roles ────────────────────────────────────────

const roles = new Map<number, UserRoleRow>();
let nextRoleId = 1;

export const UserRoleRepository = {
  async findById(id: number): Promise<UserRoleRow | null> {
    return roles.get(id) ?? null;
  },

  async findByName(role: string): Promise<UserRoleRow | null> {
    for (const r of roles.values()) {
      if (r.role === role) return r;
    }
    return null;
  },

  async create(role: string): Promise<UserRoleRow> {
    const row: UserRoleRow = { idRole: nextRoleId++, role };
    roles.set(row.idRole, row);
    return row;
  },

  async findAll(): Promise<UserRoleRow[]> {
    return Array.from(roles.values());
  },
};

// ── Programs ──────────────────────────────────────────

const programs = new Map<number, ProgramRow>();
let nextProgramId = 1;

export const ProgramRepository = {
  async findById(id: number): Promise<ProgramRow | null> {
    return programs.get(id) ?? null;
  },

  async findAll(includeDeleted = false): Promise<ProgramRow[]> {
    const all = Array.from(programs.values());
    return includeDeleted ? all : all.filter((p) => !p.isDeleted);
  },

  async create(data: {
    name: string;
    isSocialService: boolean;
  }): Promise<ProgramRow> {
    const row: ProgramRow = {
      idProgram: nextProgramId++,
      name: data.name,
      isSocialService: data.isSocialService,
      isDeleted: false,
    };
    programs.set(row.idProgram, row);
    return row;
  },

  async softDelete(id: number): Promise<boolean> {
    const row = programs.get(id);
    if (!row) return false;
    row.isDeleted = true;
    return true;
  },
};

// ── School Cycles ─────────────────────────────────────

const cycles = new Map<number, SchoolCycleRow>();
let nextCycleId = 1;

export const SchoolCycleRepository = {
  async findById(id: number): Promise<SchoolCycleRow | null> {
    return cycles.get(id) ?? null;
  },

  async findAll(): Promise<SchoolCycleRow[]> {
    return Array.from(cycles.values());
  },

  async create(data: Omit<SchoolCycleRow, "idCycle">): Promise<SchoolCycleRow> {
    const row: SchoolCycleRow = { idCycle: nextCycleId++, ...data };
    cycles.set(row.idCycle, row);
    return row;
  },
};

// ── Status Catalog ────────────────────────────────────

const statuses = new Map<number, StatusCatalogRow>();
let nextStatusId = 1;

function seedStatuses() {
  const seeds = [
    "ACTIVO",
    "INSCRITO",
    "GRADUADO",
    "BAJA TEMPORAL",
    "BAJA DEFINITIVA",
  ];
  for (const type of seeds) {
    const row: StatusCatalogRow = { idStatus: nextStatusId++, type };
    statuses.set(row.idStatus, row);
  }
}

seedStatuses();

export const StatusCatalogRepository = {
  async findById(id: number): Promise<StatusCatalogRow | null> {
    return statuses.get(id) ?? null;
  },

  async findByType(type: string): Promise<StatusCatalogRow | null> {
    for (const s of statuses.values()) {
      if (s.type === type) return s;
    }
    return null;
  },

  async findAll(): Promise<StatusCatalogRow[]> {
    return Array.from(statuses.values());
  },
};
