import { randomBytes } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

/** Non-guessable, human-readable booking reference such as OC-7K3M9Q2P. */
export function generateBookingReference(): string {
  const bytes = randomBytes(8);
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    body += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  return `OC-${body}`;
}

export function isBookingReference(value: string): boolean {
  return /^OC-[A-Z2-9]{8}$/.test(value);
}
