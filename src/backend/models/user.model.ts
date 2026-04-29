import "server-only";

import type { UserRow, AdminRow, ProfessorRow, StudentRow } from "@/backend/types";
import type { SafeUser, SafeAdmin, SafeProfessor, SafeStudent } from "@/shared/types";
import { Gender, TimeModality } from "@/shared/types";

export function toSafeUser(row: UserRow, roleName: string): SafeUser {
  return {
    id: row.idUser,
    name: row.name,
    lastName: row.lastName,
    role: roleName,
    gender: row.gender as Gender,
    academicDegree: row.academicDegree,
  };
}

export function toSafeAdmin(
  adminRow: AdminRow,
  userRow: UserRow,
  roleName: string
): SafeAdmin {
  return {
    id: adminRow.idAdmin,
    userId: adminRow.userId,
    username: adminRow.username,
    email: adminRow.email,
    user: toSafeUser(userRow, roleName),
  };
}

export function toSafeProfessor(
  profRow: ProfessorRow,
  userRow: UserRow,
  roleName: string
): SafeProfessor {
  return {
    id: profRow.idProfessor,
    userId: profRow.userId,
    ipnRegistration: profRow.ipnRegistration,
    employeeNumber: profRow.employeeNumber,
    academicLoad: profRow.academicLoad,
    availableHours: profRow.availableHours,
    programId: profRow.programId,
    statusId: profRow.statusId,
    user: toSafeUser(userRow, roleName),
  };
}

export function toSafeStudent(
  studentRow: StudentRow,
  userRow: UserRow,
  roleName: string
): SafeStudent {
  return {
    id: studentRow.idStudent,
    userId: studentRow.userId,
    curp: studentRow.curp,
    registration: studentRow.registration,
    timeModality: studentRow.timeModality as TimeModality,
    programId: studentRow.programId,
    localTutorId: studentRow.localTutorId,
    academicDirectorId: studentRow.academicDirectorId,
    enrollmentCycleId: studentRow.enrollmentCycleId,
    semester: studentRow.semester,
    statusId: studentRow.statusId,
    user: toSafeUser(userRow, roleName),
  };
}
