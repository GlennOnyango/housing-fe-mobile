import Constants from "expo-constants";
import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
  APP_SCHEME: z.string().min(1),
  SENTRY_DSN: z.union([z.literal(""), z.string().url()]).optional(),
});

function hostFromValue(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    if (value.includes("://")) {
      return new URL(value).hostname || null;
    }

    return value.split(":")[0] || null;
  } catch {
    return null;
  }
}

function getExpoHost(): string | null {
  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    manifest?: { debuggerHost?: string };
    linkingUri?: string;
  };

  const candidates = [
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest2?.extra?.expoClient?.hostUri,
    constants.manifest?.debuggerHost,
    constants.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = hostFromValue(candidate);
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }

  return null;
}

function remapLoopbackToExpoHost(url: string) {
  const expoHost = getExpoHost();
  if (!expoHost) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.hostname = expoHost;
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return url;
  }

  return url;
}

const configuredApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.API_BASE_URL as string | undefined);

const rawEnv = {
  API_BASE_URL: remapLoopbackToExpoHost(configuredApiBaseUrl ?? "http://localhost:3000"),
  APP_SCHEME:
    process.env.EXPO_PUBLIC_APP_SCHEME ??
    (Constants.expoConfig?.extra?.APP_SCHEME as string | undefined) ??
    Constants.expoConfig?.scheme ??
    "housingmobile",
  SENTRY_DSN:
    process.env.EXPO_PUBLIC_SENTRY_DSN ??
    (Constants.expoConfig?.extra?.SENTRY_DSN as string | undefined) ??
    "",
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  throw new Error(
    `Invalid app environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const env = {
  API_BASE_URL: parsed.data.API_BASE_URL,
  APP_SCHEME: parsed.data.APP_SCHEME,
  SENTRY_DSN: parsed.data.SENTRY_DSN || undefined,
};
