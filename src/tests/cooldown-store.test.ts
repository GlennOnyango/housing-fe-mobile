import { describe, expect, it } from "vitest";

import { cooldownStore } from "@/src/api/cooldown-store";

describe("cooldownStore", () => {
  it("stores remaining duration", () => {
    cooldownStore.clear();
    cooldownStore.set("auth.request-magic-link", 1500);
    expect(cooldownStore.getRemainingMs("auth.request-magic-link")).toBeGreaterThan(0);
  });

  it("parses retry-after seconds", () => {
    cooldownStore.clear();
    cooldownStore.captureRetryAfter("onboarding.claim", "2");
    const remaining = cooldownStore.getRemainingMs("onboarding.claim");
    expect(remaining).toBeGreaterThan(1000);
    expect(remaining).toBeLessThanOrEqual(2000);
  });
});
