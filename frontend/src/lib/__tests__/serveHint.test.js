import { describe, expect, it } from "vitest";
import { FIRST_SERVE_HINT_KEY, hasSeenFirstServeHint, markFirstServeHintSeen } from "../serveHint";

describe("first serve instructions", () => {
  it("remembers when the player has seen the toss and timing instructions", () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };

    expect(hasSeenFirstServeHint(storage)).toBe(false);
    markFirstServeHintSeen(storage);
    expect(values.get(FIRST_SERVE_HINT_KEY)).toBe("seen");
    expect(hasSeenFirstServeHint(storage)).toBe(true);
  });

  it("keeps the hint usable when storage is unavailable", () => {
    const unavailable = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    expect(hasSeenFirstServeHint(unavailable)).toBe(false);
    expect(() => markFirstServeHintSeen(unavailable)).not.toThrow();
  });
});
