import "server-only";

import type {
  ProgramRow,
  SchoolCycleRow,
  StatusCatalogRow,
  UserRoleRow,
} from "@/backend/types";
import type {
  ProgramDTO,
  SchoolCycleDTO,
  StatusDTO,
  UserRoleDTO,
} from "@/shared/types";

export function toProgramDTO(row: ProgramRow): ProgramDTO {
  return {
    id: row.idProgram,
    name: row.name,
    isSocialService: row.isSocialService,
  };
}

export function toSchoolCycleDTO(row: SchoolCycleRow): SchoolCycleDTO {
  return {
    id: row.idCycle,
    cycle: row.cycle,
    description: row.description,
    startDate: row.startDate.toISOString().split("T")[0],
    endDate: row.endDate.toISOString().split("T")[0],
  };
}

export function toStatusDTO(row: StatusCatalogRow): StatusDTO {
  return { id: row.idStatus, type: row.type };
}

export function toUserRoleDTO(row: UserRoleRow): UserRoleDTO {
  return { id: row.idRole, role: row.role };
}
