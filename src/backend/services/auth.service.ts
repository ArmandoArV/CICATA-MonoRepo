import "server-only";

import { AdminRepository } from "@/backend/repositories";
import { UserRepository } from "@/backend/repositories";
import { UserRoleRepository } from "@/backend/repositories";
import { toSafeAdmin } from "@/backend/models";
import { hashPassword, comparePassword, signToken } from "@/backend/utils";
import type { SafeAdmin } from "@/shared/types";

export interface AuthResult {
  user: SafeAdmin;
  token: string;
}

export const AuthService = {
  async login(data: {
    usernameOrEmail: string;
    password: string;
  }): Promise<AuthResult> {
    const admin = await AdminRepository.findByUsernameOrEmail(
      data.usernameOrEmail
    );
    if (!admin) {
      throw new Error("Invalid credentials");
    }

    const valid = await comparePassword(data.password, admin.password);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    const userRow = await UserRepository.findById(admin.userId);
    if (!userRow) {
      throw new Error("User record not found");
    }

    const role = await UserRoleRepository.findById(userRow.roleId);
    const roleName = role?.role ?? "UNKNOWN";

    const token = await signToken({
      sub: userRow.idUser,
      email: admin.email,
      role: roleName,
      adminId: admin.idAdmin,
    });

    return { user: toSafeAdmin(admin, userRow, roleName), token };
  },

  async getProfile(userId: number): Promise<SafeAdmin> {
    const userRow = await UserRepository.findById(userId);
    if (!userRow) {
      throw new Error("User not found");
    }

    const admin = await AdminRepository.findByUserId(userId);
    if (!admin) {
      throw new Error("Admin profile not found");
    }

    const role = await UserRoleRepository.findById(userRow.roleId);
    const roleName = role?.role ?? "UNKNOWN";

    return toSafeAdmin(admin, userRow, roleName);
  },
};
