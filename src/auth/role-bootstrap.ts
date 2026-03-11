import { normalizeApiError } from "@/src/api/problem";
import { ownerApi, tenantApi } from "@/src/api/services";
import type { UserRole } from "@/src/types/contracts";

function isProbeMiss(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return [401, 403, 404].includes((error as { status: number }).status);
  }

  const problem = normalizeApiError(error);
  return [401, 403, 404].includes(problem.status);
}

export async function detectRole(): Promise<UserRole | null> {
  try {
    await tenantApi.getBalance();
    return "tenant";
  } catch (error) {
    if (!isProbeMiss(error)) {
      return null;
    }
  }

  try {
    await ownerApi.listProperties({ page: 1, pageSize: 1 });
    return "owner";
  } catch (error) {
    if (!isProbeMiss(error)) {
      return null;
    }
  }

  return null;
}
