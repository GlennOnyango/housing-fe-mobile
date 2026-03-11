import axios, { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { normalizeApiError } from "@/src/api/problem";

describe("normalizeApiError", () => {
  it("parses backend problem-details shape", () => {
    const error = new AxiosError("Bad request", undefined, undefined, undefined, {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {
        title: "Validation error",
        detail: "Input invalid",
        status: 400,
        errors: [{ field: "email", message: "Invalid email" }],
        requestId: "req-123",
      },
    });

    const problem = normalizeApiError(error);
    expect(problem.title).toBe("Validation error");
    expect(problem.detail).toBe("Input invalid");
    expect(problem.status).toBe(400);
    expect(problem.errors?.[0]?.field).toBe("email");
    expect(problem.requestId).toBe("req-123");
  });

  it("falls back to network message when shape is unknown", () => {
    const error = axios.AxiosError.from(new Error("Network down"));
    const problem = normalizeApiError(error);
    expect(problem.title).toBe("Network request failed");
  });

  it("uses message from non-error objects", () => {
    const problem = normalizeApiError({
      message: "Backend did not return expected shape",
    });

    expect(problem.detail).toBe("Backend did not return expected shape");
  });

  it("keeps already-normalized ApiProblem errors unchanged", () => {
    const input = {
      title: "Network request failed",
      detail: "Network Error",
      status: 0,
      requestId: undefined,
      raw: { marker: "original" },
    };

    const problem = normalizeApiError(input);
    expect(problem).toEqual(input);
  });
});
