import "server-only";

import type { UserModel } from "@/backend/models";
import { UserRole } from "@/shared/types";

/**
 * In-memory user repository — development scaffold only.
 * Replace with a real database adapter (Prisma, Drizzle, etc.) for production.
 */
const users = new Map<string, UserModel>();

export const UserRepository = {
  async findById(id: string): Promise<UserModel | null> {
    return users.get(id) ?? null;
  },

  async findByEmail(email: string): Promise<UserModel | null> {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<UserModel> {
    const now = new Date();
    const user: UserModel = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      role: data.role ?? UserRole.RESEARCHER,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    users.set(user.id, user);
    return user;
  },

  async existsByEmail(email: string): Promise<boolean> {
    for (const user of users.values()) {
      if (user.email === email) return true;
    }
    return false;
  },

  async count(): Promise<number> {
    return users.size;
  },
};
