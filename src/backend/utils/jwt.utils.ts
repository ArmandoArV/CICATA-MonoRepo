import "server-only";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { AuthTokenPayload } from "@/backend/types";
import { UserRole } from "@/shared/types";

const getSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
};

const EXPIRATION = process.env.JWT_EXPIRATION || "24h";

export async function signToken(payload: {
  sub: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as JWTPayload & AuthTokenPayload;
  } catch {
    return null;
  }
}
