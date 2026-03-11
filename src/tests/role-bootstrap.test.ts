import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tenantApi: {
    getBalance: vi.fn(),
  },
  ownerApi: {
    listProperties: vi.fn(),
  },
}));

vi.mock("@/src/api/services", () => ({
  tenantApi: mocks.tenantApi,
  ownerApi: mocks.ownerApi,
}));

import { detectRole } from "@/src/auth/role-bootstrap";

describe("detectRole", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns tenant when tenant probe succeeds", async () => {
    mocks.tenantApi.getBalance.mockResolvedValue({
      amount: 0,
      currency: "USD",
    });
    mocks.ownerApi.listProperties.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 1,
      total: 0,
    });

    await expect(detectRole()).resolves.toBe("tenant");
  });

  it("returns owner when tenant probe misses and owner probe succeeds", async () => {
    mocks.tenantApi.getBalance.mockRejectedValue({
      title: "Unauthorized",
      detail: "No tenant role",
      status: 403,
    });
    mocks.ownerApi.listProperties.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 1,
      total: 0,
    });

    await expect(detectRole()).resolves.toBe("owner");
  });

  it("returns null when probes are inconclusive", async () => {
    mocks.tenantApi.getBalance.mockRejectedValue(new Error("Network down"));
    mocks.ownerApi.listProperties.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 1,
      total: 0,
    });

    await expect(detectRole()).resolves.toBeNull();
  });
});
