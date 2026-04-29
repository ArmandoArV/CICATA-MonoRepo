import "server-only";

import { AdminRepository } from "@/backend/repositories";
import { UserRepository } from "@/backend/repositories";
import { UserRoleRepository } from "@/backend/repositories";
import { toSafeAdmin } from "@/backend/models";
import { comparePassword, signToken, Logger } from "@/backend/utils";
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
    Logger.debug("Auth", `Login attempt for: ${data.usernameOrEmail}`);
    const admin = await AdminRepository.findByUsernameOrEmail(
      data.usernameOrEmail
    );
    if (!admin) {
      Logger.warn("Auth", `Admin not found: ${data.usernameOrEmail}`);
      throw new Error("Invalid credentials");
    }

    const valid = comparePassword(data.password, admin.password);
    if (!valid) {
      Logger.warn("Auth", `Invalid password for: ${data.usernameOrEmail}`);
      throw new Error("Invalid credentials");
    }

    Logger.info("Auth", `Login successful: ${data.usernameOrEmail}`);

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
