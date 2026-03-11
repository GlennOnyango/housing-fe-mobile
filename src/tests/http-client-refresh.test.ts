import { beforeEach, describe, expect, it, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";

const secureStoreMap = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => secureStoreMap.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    secureStoreMap.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    secureStoreMap.delete(key);
  }),
}));

vi.mock("@/src/config/env", () => ({
  env: {
    API_BASE_URL: "https://example.test",
    APP_SCHEME: "housingmobile",
    SENTRY_DSN: undefined,
  },
}));

import { http, rawHttp, setAuthFailureHandler } from "@/src/api/http-client";
import { tokenStore } from "@/src/auth/token-store";

describe("http refresh rotation", () => {
  let httpMock: MockAdapter;
  let rawMock: MockAdapter;

  beforeEach(async () => {
    secureStoreMap.clear();
    await tokenStore.clear();
    tokenStore.setAccessToken(null);
    setAuthFailureHandler(() => undefined);

    httpMock = new MockAdapter(http);
    rawMock = new MockAdapter(rawHttp);
  });

  it("uses single-flight refresh across parallel 401 responses", async () => {
    await tokenStore.setRefreshToken("refresh-old");
    tokenStore.setAccessToken("expired-access");

    httpMock.onGet("/secure").reply((config) => {
      if (config.headers?.Authorization === "Bearer fresh-access") {
        return [200, { ok: true }];
      }

      return [401, { title: "Unauthorized", detail: "Expired token", status: 401 }];
    });

    rawMock.onPost("/auth/refresh").reply(200, {
      accessToken: "fresh-access",
      refreshToken: "refresh-new",
    });

    const [first, second] = await Promise.all([http.get("/secure"), http.get("/secure")]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(rawMock.history.post.length).toBe(1);
    expect(tokenStore.getAccessToken()).toBe("fresh-access");
    expect(await tokenStore.getRefreshToken()).toBe("refresh-new");
  });

  it("clears session and triggers auth failure callback when refresh fails", async () => {
    await tokenStore.setRefreshToken("refresh-old");
    tokenStore.setAccessToken("expired-access");

    let authFailureCalls = 0;
    setAuthFailureHandler(() => {
      authFailureCalls += 1;
    });

    httpMock.onGet("/secure").reply(401, {
      title: "Unauthorized",
      detail: "Expired token",
      status: 401,
    });

    rawMock.onPost("/auth/refresh").reply(401, {
      title: "Unauthorized",
      detail: "Refresh revoked",
      status: 401,
    });

    await expect(http.get("/secure")).rejects.toMatchObject({
      status: 401,
    });

    expect(authFailureCalls).toBe(1);
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(await tokenStore.getRefreshToken()).toBeNull();
  });
});
