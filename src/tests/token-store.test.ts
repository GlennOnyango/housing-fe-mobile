import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

import { tokenStore } from "@/src/auth/token-store";

describe("tokenStore", () => {
  beforeEach(async () => {
    store.clear();
    tokenStore.setAccessToken(null);
    await tokenStore.clear();
  });

  it("keeps access token in memory only", async () => {
    tokenStore.setAccessToken("access-value");
    expect(tokenStore.getAccessToken()).toBe("access-value");
    expect(await tokenStore.getRefreshToken()).toBeNull();
  });

  it("persists refresh token in secure storage", async () => {
    await tokenStore.setRefreshToken("refresh-value");
    expect(await tokenStore.getRefreshToken()).toBe("refresh-value");
  });

  it("sets and clears token pair", async () => {
    await tokenStore.setTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(tokenStore.getAccessToken()).toBe("access-token");
    expect(await tokenStore.getRefreshToken()).toBe("refresh-token");

    await tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(await tokenStore.getRefreshToken()).toBeNull();
  });
});
