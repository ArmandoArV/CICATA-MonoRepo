import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type { AdminRow } from "@/backend/types";

export const AdminRepository = {
  async findById(id: number): Promise<AdminRow | null> {
    return queryOne<AdminRow>("SELECT * FROM admin WHERE idAdmin = ?", [id]);
  },

  async findByUserId(userId: number): Promise<AdminRow | null> {
    return queryOne<AdminRow>("SELECT * FROM admin WHERE userId = ?", [userId]);
  },

  async findByEmail(email: string): Promise<AdminRow | null> {
    return queryOne<AdminRow>("SELECT * FROM admin WHERE email = ?", [email]);
  },

  async findByUsername(username: string): Promise<AdminRow | null> {
    return queryOne<AdminRow>("SELECT * FROM admin WHERE username = ?", [username]);
  },

  async findByUsernameOrEmail(identifier: string): Promise<AdminRow | null> {
    return queryOne<AdminRow>(
      "SELECT * FROM admin WHERE username = ? OR email = ?",
      [identifier, identifier]
    );
  },

  async existsByEmail(email: string): Promise<boolean> {
    const row = await queryOne<{ c: number }>(
      "SELECT COUNT(*) AS c FROM admin WHERE email = ?", [email]
    );
    return (row?.c ?? 0) > 0;
  },

  async existsByUsername(username: string): Promise<boolean> {
    const row = await queryOne<{ c: number }>(
      "SELECT COUNT(*) AS c FROM admin WHERE username = ?", [username]
    );
    return (row?.c ?? 0) > 0;
  },

  async existsByUserId(userId: number): Promise<boolean> {
    const row = await queryOne<{ c: number }>(
      "SELECT COUNT(*) AS c FROM admin WHERE userId = ?", [userId]
    );
    return (row?.c ?? 0) > 0;
  },

  async create(data: Omit<AdminRow, "idAdmin">): Promise<AdminRow> {
    const result = await execute(
      "INSERT INTO admin (userId, username, password, email) VALUES (?, ?, ?, ?)",
      [data.userId, data.username, data.password, data.email]
    );
    return { idAdmin: result.insertId, ...data };
  },

  async findAll(): Promise<AdminRow[]> {
    return query<AdminRow>("SELECT * FROM admin");
  },
};
