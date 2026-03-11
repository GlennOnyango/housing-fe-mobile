import axios from "axios";

import type { ApiProblem, ProblemFieldError } from "@/src/types/contracts";

function isApiProblem(value: unknown): value is ApiProblem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Record<string, unknown>;
  return (
    typeof source.title === "string" &&
    typeof source.detail === "string" &&
    typeof source.status === "number"
  );
}

function extractUnknownMessage(raw: unknown): string | undefined {
  if (typeof raw === "string" && raw.trim()) {
    return raw;
  }

  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const source = raw as Record<string, unknown>;

  if (typeof source.message === "string" && source.message.trim()) {
    return source.message;
  }

  if (Array.isArray(source.message)) {
    const messages = source.message.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (messages.length) {
      return messages.join(", ");
    }
  }

  return undefined;
}

function asProblem(raw: unknown): ApiProblem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const title = typeof source.title === "string" ? source.title : "Request failed";
  const detail =
    typeof source.detail === "string" ? source.detail : "An unexpected error occurred.";
  const status = typeof source.status === "number" ? source.status : 500;
  const requestId =
    typeof source.requestId === "string" ? source.requestId : undefined;

  const errors: ProblemFieldError[] | undefined = Array.isArray(source.errors)
    ? source.errors.reduce<ProblemFieldError[]>((acc, item) => {
        if (!item || typeof item !== "object") {
          return acc;
        }

        const value = item as Record<string, unknown>;
        if (typeof value.message !== "string") {
          return acc;
        }

        acc.push({
          field: typeof value.field === "string" ? value.field : undefined,
          message: value.message,
        });

        return acc;
      }, [])
    : undefined;

  return {
    title,
    detail,
    status,
    errors,
    requestId,
    raw,
  };
}

export function normalizeApiError(error: unknown): ApiProblem {
  if (isApiProblem(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const fromResponse = asProblem(error.response?.data);
    if (fromResponse) {
      return fromResponse;
    }

    return {
      title: "Network request failed",
      detail: error.message || "Unable to reach backend service.",
      status: error.response?.status ?? 0,
      requestId:
        typeof error.response?.headers?.["x-request-id"] === "string"
          ? error.response.headers["x-request-id"]
          : undefined,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Unexpected error",
      detail: error.message,
      status: 500,
      raw: error,
    };
  }

  const unknownMessage = extractUnknownMessage(error);

  return {
    title: "Unknown error",
    detail: unknownMessage ?? "An unknown error occurred.",
    status: 500,
    raw: error,
  };
}

export function problemToMessage(problem: ApiProblem) {
  if (problem.errors?.length) {
    return `${problem.detail} (${problem.errors.map((item) => item.message).join(", ")})`;
  }

  return problem.detail;
}

export function logApiError(context: string, error: unknown): ApiProblem {
  const problem = normalizeApiError(error);

  console.error(`[FormError] ${context}`, {
    title: problem.title,
    detail: problem.detail,
    status: problem.status,
    requestId: problem.requestId,
    errors: problem.errors,
    raw: problem.raw ?? error,
  });

  return problem;
}

export function messageFromLoggedApiError(context: string, error: unknown) {
  return problemToMessage(logApiError(context, error));
}
