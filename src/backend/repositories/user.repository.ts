import "server-only";

import { query, queryOne, execute } from "@/backend/database/pool";
import type { UserRow } from "@/backend/types";

export const UserRepository = {
  async findById(id: number): Promise<UserRow | null> {
    return queryOne<UserRow>("SELECT * FROM users WHERE idUser = ?", [id]);
  },

  async create(data: Omit<UserRow, "idUser">): Promise<UserRow> {
    const result = await execute(
      "INSERT INTO users (name, lastName, roleId, gender, academicDegree) VALUES (?, ?, ?, ?, ?)",
      [data.name, data.lastName, data.roleId, data.gender, data.academicDegree]
    );
    return { idUser: result.insertId, ...data };
  },

  async update(id: number, data: Partial<Omit<UserRow, "idUser">>): Promise<UserRow | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value as string | number | boolean | null);
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await execute(`UPDATE users SET ${fields.join(", ")} WHERE idUser = ?`, values);
    return this.findById(id);
  },

  async delete(id: number): Promise<boolean> {
    const result = await execute("DELETE FROM users WHERE idUser = ?", [id]);
    return result.affectedRows > 0;
  },

  async findAll(): Promise<UserRow[]> {
    return query<UserRow>("SELECT * FROM users");
  },
};
