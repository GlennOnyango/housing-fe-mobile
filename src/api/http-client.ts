import axios, { AxiosHeaders } from "axios";

import { env } from "@/src/config/env";
import { tokenStore } from "@/src/auth/token-store";
import { normalizeApiError } from "@/src/api/problem";
import { createRequestId } from "@/src/utils/request-id";
import { cooldownStore } from "@/src/api/cooldown-store";
import type { TokenPair } from "@/src/types/contracts";

type AuthFailureHandler = () => Promise<void> | void;

let onAuthFailure: AuthFailureHandler | null = null;
let refreshInFlight: Promise<string> | null = null;

export const rawHttp = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
});

export const http = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
});

function extractRetryAfter(headers: unknown): string | null {
  if (!headers || typeof headers !== "object") {
    return null;
  }

  const source = headers as Record<string, unknown>;
  const value = source["retry-after"];
  return typeof value === "string" ? value : null;
}

async function refreshAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Missing refresh token.");
    }

    const response = await rawHttp.post<TokenPair>(
      "/auth/refresh",
      { refreshToken },
      {
        _skipAuth: true,
        headers: {
          "x-request-id": createRequestId(),
        },
      },
    );

    await tokenStore.setTokens(response.data);
    return response.data.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

http.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("x-request-id", createRequestId());

  if (!config._skipAuth) {
    const token = tokenStore.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  config.headers = headers;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    const cooldownKey = error.config?._cooldownKey;
    if (error.response?.status === 429 && cooldownKey) {
      cooldownStore.captureRetryAfter(
        cooldownKey,
        extractRetryAfter(error.response.headers),
      );
    }

    const status = error.response?.status;
    if (status !== 401) {
      return Promise.reject(normalizeApiError(error));
    }

    if (!error.config || error.config._skipAuth || error.config._retry) {
      return Promise.reject(normalizeApiError(error));
    }

    try {
      await refreshAccessToken();
      error.config._retry = true;
      return http.request(error.config);
    } catch (refreshError) {
      await tokenStore.clear();
      if (onAuthFailure) {
        await onAuthFailure();
      }
      return Promise.reject(normalizeApiError(refreshError));
    }
  },
);

export function setAuthFailureHandler(handler: AuthFailureHandler) {
  onAuthFailure = handler;
}
