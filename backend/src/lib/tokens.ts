import { createHash, randomBytes } from "node:crypto";

/** Only the hash is stored; the raw token exists once in the email or response. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
