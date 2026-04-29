import "server-only";

import type { UserRow } from "@/backend/types";

const users = new Map<number, UserRow>();
let nextId = 1;

export const UserRepository = {
  async findById(id: number): Promise<UserRow | null> {
    return users.get(id) ?? null;
  },

  async create(data: Omit<UserRow, "idUser">): Promise<UserRow> {
    const row: UserRow = { idUser: nextId++, ...data };
    users.set(row.idUser, row);
    return row;
  },

  async update(id: number, data: Partial<Omit<UserRow, "idUser">>): Promise<UserRow | null> {
    const existing = users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    users.set(id, updated);
    return updated;
  },

  async delete(id: number): Promise<boolean> {
    return users.delete(id);
  },

  async findAll(): Promise<UserRow[]> {
    return Array.from(users.values());
  },
};
