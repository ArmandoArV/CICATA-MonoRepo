import "server-only";

import { NextResponse } from "next/server";
import type { ApiResponse } from "@/backend/types";

export function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return success(data, 201);
}

export function error(
  message: string,
  status = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export function unauthorized(
  message = "Unauthorized"
): NextResponse<ApiResponse<never>> {
  return error(message, 401);
}

export function forbidden(
  message = "Forbidden"
): NextResponse<ApiResponse<never>> {
  return error(message, 403);
}

export function notFound(
  message = "Not found"
): NextResponse<ApiResponse<never>> {
  return error(message, 404);
}

export function serverError(
  message = "Internal server error"
): NextResponse<ApiResponse<never>> {
  return error(message, 500);
}
