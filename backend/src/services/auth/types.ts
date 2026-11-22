import type { User } from "@/db/schema";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
  emailVerified: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}
