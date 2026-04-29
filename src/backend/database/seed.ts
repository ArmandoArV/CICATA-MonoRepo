import "server-only";

import {
  UserRepository,
  AdminRepository,
  UserRoleRepository,
  ProgramRepository,
  SchoolCycleRepository,
} from "@/backend/repositories";
import { hashPassword } from "@/backend/utils";

let seeded = false;

export async function seedDevData(): Promise<void> {
  if (seeded) return;
  seeded = true;

  // 1. Create ADMIN role
  const role = await UserRoleRepository.create("ADMIN");

  // 2. Create base user
  const user = await UserRepository.create({
    name: "Administrador",
    lastName: "CICATA",
    roleId: role.idRole,
    gender: "M",
    academicDegree: null,
  });

  // 3. Create admin account with hashed password
  const hashedPw = await hashPassword("Admin123");
  await AdminRepository.create({
    userId: user.idUser,
    username: "admin",
    password: hashedPw,
    email: "admin@cicata.ipn.mx",
  });

  // 4. Seed a sample program
  await ProgramRepository.create({
    name: "Maestría en Tecnología Avanzada",
    isSocialService: false,
  });

  // 5. Seed a sample school cycle
  await SchoolCycleRepository.create({
    cycle: "2026A",
    description: "Primer semestre 2026",
    startDate: new Date("2026-01-13"),
    endDate: new Date("2026-06-30"),
  });

  console.log("[Seed] Dev data ready — admin/Admin123");
}
