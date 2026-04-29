import "server-only";

import { z } from "zod";

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}
