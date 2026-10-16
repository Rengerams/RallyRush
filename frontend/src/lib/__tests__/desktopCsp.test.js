import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { createContentSecurityPolicy } = require("../../../desktop/csp.cjs");

describe("desktop Content Security Policy", () => {
  it("keeps production scripts restricted to packaged same-origin files", () => {
    const policy = createContentSecurityPolicy();
    expect(policy).toContain("script-src 'self'");
    expect(policy.split("; ").find((directive) => directive.startsWith("script-src"))).not.toContain("unsafe-inline");
  });

  it("allows the nonce Vite uses for its development refresh scripts", () => {
    const policy = createContentSecurityPolicy({ development: true, nonce: "safe_nonce-123" });
    expect(policy).toContain("script-src 'self' 'nonce-safe_nonce-123'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("requires a generated nonce for desktop development", () => {
    expect(() => createContentSecurityPolicy({ development: true })).toThrow(/requires a generated nonce/i);
    expect(() => createContentSecurityPolicy({ development: true, nonce: "bad nonce" })).toThrow(/requires a generated nonce/i);
  });
});
