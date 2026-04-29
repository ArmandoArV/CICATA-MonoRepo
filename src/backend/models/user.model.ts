import "server-only";

import type { StoredUser } from "@/backend/types";
import { UserRole } from "@/shared/types";

export interface UserModel {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toStoredUser(model: UserModel): StoredUser {
  return {
    id: model.id,
    email: model.email,
    name: model.name,
    role: model.role,
    passwordHash: model.passwordHash,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

export function toSafeUser(model: UserModel) {
  return {
    id: model.id,
    email: model.email,
    name: model.name,
    role: model.role,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
