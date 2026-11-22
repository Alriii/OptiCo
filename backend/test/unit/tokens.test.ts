import { describe, expect, it } from "vitest";
import { generateOpaqueToken, hashToken } from "@/lib/tokens";

describe("Cryptographic Token Utilities", () => {
  it("generates URL-safe opaque tokens of sufficient entropy", () => {
    const token1 = generateOpaqueToken();
    const token2 = generateOpaqueToken();
    expect(token1).toBeDefined();
    expect(token1.length).toBeGreaterThanOrEqual(40);
    expect(token1).not.toBe(token2);
  });

  it("hashes tokens deterministically with SHA-256", () => {
    const raw = "sample-secret-guest-token-12345";
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
    expect(hash1).not.toBe(raw);
  });
});
