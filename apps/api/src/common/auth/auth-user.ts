import type { Role } from '@repo/contracts';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Transport details recorded against a session so users can recognise devices. */
export interface ClientInfo {
  userAgent: string | null;
  ip: string | null;
}
