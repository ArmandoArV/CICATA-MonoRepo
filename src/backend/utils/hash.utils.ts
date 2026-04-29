import "server-only";

import { createHash } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function comparePassword(
  password: string,
  hashedPassword: string
): boolean {
  return hashPassword(password) === hashedPassword;
}
