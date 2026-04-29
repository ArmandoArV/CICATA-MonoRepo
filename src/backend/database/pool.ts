import "server-only";

import mysql, { type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

type SqlParam = string | number | boolean | null | Date | Buffer;

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "CICATADocs",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      typeCast: function (field, next) {
        if (field.type === "TINY" && field.length === 1) {
          return field.string() === "1";
        }
        return next();
      },
    });
  }
  return pool;
}

export async function query<T>(
  sql: string,
  params?: SqlParam[]
): Promise<T[]> {
  const [rows] = await getPool().execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function queryOne<T>(
  sql: string,
  params?: SqlParam[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params?: SqlParam[]
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}
