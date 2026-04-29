import "server-only";

import { UserRepository } from "@/backend/repositories";
import { toSafeUser } from "@/backend/models";
import { hashPassword, comparePassword, signToken } from "@/backend/utils";
import type { SafeUser } from "@/shared/types";
import { UserRole } from "@/shared/types";

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export const AuthService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResult> {
    const exists = await UserRepository.existsByEmail(data.email);
    if (exists) {
      throw new Error("A user with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);
    const user = await UserRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return { user: toSafeUser(user), token };
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return { user: toSafeUser(user), token };
  },

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return toSafeUser(user);
  },
};
