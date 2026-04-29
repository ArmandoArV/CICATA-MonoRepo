import "server-only";

import { NextRequest } from "next/server";
import { AuthService } from "@/backend/services";
import { authenticate, isAuthenticated } from "@/backend/middleware";
import {
  success,
  created,
  error,
  serverError,
  validateBody,
  loginSchema,
  registerSchema,
} from "@/backend/utils";

export const AuthController = {
  async register(request: NextRequest) {
    try {
      const body = await request.json();
      const validation = validateBody(registerSchema, body);

      if (!validation.success) {
        return error(validation.error);
      }

      const result = await AuthService.register(validation.data);
      const response = created(result);

      response.cookies.set("auth-token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        return error(err.message, 409);
      }
      return serverError();
    }
  },

  async login(request: NextRequest) {
    try {
      const body = await request.json();
      const validation = validateBody(loginSchema, body);

      if (!validation.success) {
        return error(validation.error);
      }

      const result = await AuthService.login(validation.data);
      const response = success(result);

      response.cookies.set("auth-token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return response;
    } catch (err) {
      if (err instanceof Error && err.message.includes("Invalid")) {
        return error(err.message, 401);
      }
      return serverError();
    }
  },

  async me(request: NextRequest) {
    const auth = await authenticate(request);
    if (!isAuthenticated(auth)) return auth;

    try {
      const user = await AuthService.getProfile(auth.userId);
      return success(user);
    } catch {
      return serverError();
    }
  },

  async logout() {
    const response = success({ message: "Logged out successfully" });

    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  },
};
