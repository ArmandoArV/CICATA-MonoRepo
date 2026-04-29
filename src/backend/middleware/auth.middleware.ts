import "server-only";

import { NextRequest } from "next/server";
import { verifyToken } from "@/backend/utils";
import { unauthorized } from "@/backend/utils";
import type { AuthenticatedRequest } from "@/backend/types";

export async function authenticate(
  request: NextRequest
): Promise<AuthenticatedRequest | Response> {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("auth-token")?.value;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    return unauthorized("Missing authentication token");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return unauthorized("Invalid or expired token");
  }

  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export function isAuthenticated(
  result: AuthenticatedRequest | Response
): result is AuthenticatedRequest {
  return !(result instanceof Response);
}
