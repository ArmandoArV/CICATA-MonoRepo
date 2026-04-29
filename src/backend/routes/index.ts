import "server-only";

export const ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
    LOGOUT: "/api/auth/logout",
  },
  HEALTH: "/api/health",
} as const;
