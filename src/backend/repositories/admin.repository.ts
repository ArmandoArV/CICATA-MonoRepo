import "server-only";

import type { AdminRow } from "@/backend/types";

const admins = new Map<number, AdminRow>();
let nextId = 1;

export const AdminRepository = {
  async findById(id: number): Promise<AdminRow | null> {
    return admins.get(id) ?? null;
  },

  async findByUserId(userId: number): Promise<AdminRow | null> {
    for (const admin of admins.values()) {
      if (admin.userId === userId) return admin;
    }
    return null;
  },

  async findByEmail(email: string): Promise<AdminRow | null> {
    for (const admin of admins.values()) {
      if (admin.email === email) return admin;
    }
    return null;
  },

  async findByUsername(username: string): Promise<AdminRow | null> {
    for (const admin of admins.values()) {
      if (admin.username === username) return admin;
    }
    return null;
  },

  async findByUsernameOrEmail(identifier: string): Promise<AdminRow | null> {
    for (const admin of admins.values()) {
      if (admin.username === identifier || admin.email === identifier) {
        return admin;
      }
    }
    return null;
  },

  async existsByEmail(email: string): Promise<boolean> {
    for (const admin of admins.values()) {
      if (admin.email === email) return true;
    }
    return false;
  },

  async existsByUsername(username: string): Promise<boolean> {
    for (const admin of admins.values()) {
      if (admin.username === username) return true;
    }
    return false;
  },

  async existsByUserId(userId: number): Promise<boolean> {
    for (const admin of admins.values()) {
      if (admin.userId === userId) return true;
    }
    return false;
  },

  async create(data: Omit<AdminRow, "idAdmin">): Promise<AdminRow> {
    if (await AdminRepository.existsByEmail(data.email)) {
      throw new Error("Email already registered");
    }
    if (await AdminRepository.existsByUsername(data.username)) {
      throw new Error("Username already taken");
    }
    if (await AdminRepository.existsByUserId(data.userId)) {
      throw new Error("User already has an admin account");
    }
    const row: AdminRow = { idAdmin: nextId++, ...data };
    admins.set(row.idAdmin, row);
    return row;
  },

  async findAll(): Promise<AdminRow[]> {
    return Array.from(admins.values());
  },
};
