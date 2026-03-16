import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { router } from "expo-router";
import type { QueryClient } from "@tanstack/react-query";

import { authApi } from "@/src/api/services";
import type {
  ConsumeMagicLinkRequest,
  LoginRequest,
  RegisterOwnerRequest,
  RequestMagicLinkRequest,
} from "@/src/api/contracts";
import { tokenStore } from "@/src/auth/token-store";
import { detectRole } from "@/src/auth/role-bootstrap";
import { setAuthFailureHandler } from "@/src/api/http-client";
import type { AuthSession, TokenPair, UserRole } from "@/src/types/contracts";

const initialSession: AuthSession = {
  accessToken: null,
  refreshTokenPresent: false,
  role: null,
  bootstrapState: "idle",
};

interface SessionContextValue {
  session: AuthSession;
  isAuthenticated: boolean;
  bootstrap: () => Promise<void>;
  retryRoleProbe: () => Promise<void>;
  signInWithTokens: (tokens: TokenPair) => Promise<void>;
  registerOwner: (payload: RegisterOwnerRequest) => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  requestMagicLink: (payload: RequestMagicLinkRequest) => Promise<void>;
  consumeMagicLink: (payload: ConsumeMagicLinkRequest) => Promise<void>;
  logout: () => Promise<void>;
  setOrgId: (orgId?: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps extends PropsWithChildren {
  queryClient: QueryClient;
}

export function SessionProvider({ children, queryClient }: SessionProviderProps) {
  const [session, setSession] = useState<AuthSession>(initialSession);
  const bootstrappedOnce = useRef(false);

  const setSignedOut = useCallback(async () => {
    await tokenStore.clear();
    queryClient.clear();
    setSession({
      accessToken: null,
      refreshTokenPresent: false,
      role: null,
      orgId: undefined,
      userId: undefined,
      bootstrapState: "unauthenticated",
    });
  }, [queryClient]);

  const applyTokensAndResolveRole = useCallback(
    async (tokens: TokenPair) => {
      await tokenStore.setTokens(tokens);
      const role = await detectRole();

      setSession({
        accessToken: tokens.accessToken,
        refreshTokenPresent: true,
        role,
        bootstrapState: role ? "authenticated" : "roleUnresolved",
      });
    },
    [],
  );

  const bootstrap = useCallback(async () => {
    setSession((prev) => ({
      ...prev,
      bootstrapState: "bootstrapping",
    }));

    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      await setSignedOut();
      return;
    }

    try {
      const tokens = await authApi.refresh({ refreshToken });
      await applyTokensAndResolveRole(tokens);
    } catch {
      await setSignedOut();
    }
  }, [applyTokensAndResolveRole, setSignedOut]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const tokens = await authApi.login(payload);
      await applyTokensAndResolveRole(tokens);
    },
    [applyTokensAndResolveRole],
  );

  const registerOwner = useCallback(
    async (payload: RegisterOwnerRequest) => {
      const tokens = await authApi.registerOwner(payload);
      await applyTokensAndResolveRole(tokens);
    },
    [applyTokensAndResolveRole],
  );

  const requestMagicLink = useCallback(async (payload: RequestMagicLinkRequest) => {
    await authApi.requestMagicLink(payload);
  }, []);

  const consumeMagicLink = useCallback(
    async (payload: ConsumeMagicLinkRequest) => {
      const tokens = await authApi.consumeMagicLink(payload);
      await applyTokensAndResolveRole(tokens);
    },
    [applyTokensAndResolveRole],
  );

  const logout = useCallback(async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken });
      } catch {
        // If backend logout fails, local session must still be invalidated.
      }
    }

    await setSignedOut();
    router.replace("/auth/login");
  }, [setSignedOut]);

  const retryRoleProbe = useCallback(async () => {
    if (!session.accessToken) {
      return;
    }

    setSession((prev) => ({
      ...prev,
      bootstrapState: "bootstrapping",
    }));

    const role = await detectRole();

    setSession((prev) => ({
      ...prev,
      role,
      bootstrapState: role ? "authenticated" : "roleUnresolved",
    }));
  }, [session.accessToken]);

  const setOrgId = useCallback((orgId?: string) => {
    setSession((prev) => ({
      ...prev,
      orgId,
    }));
  }, []);

  useEffect(() => {
    setAuthFailureHandler(async () => {
      await setSignedOut();
      router.replace("/auth/login");
    });
  }, [setSignedOut]);

  useEffect(() => {
    if (bootstrappedOnce.current) {
      return;
    }

    bootstrappedOnce.current = true;
    void bootstrap();
  }, [bootstrap]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session.accessToken),
      bootstrap,
      retryRoleProbe,
      signInWithTokens: applyTokensAndResolveRole,
      registerOwner,
      login,
      requestMagicLink,
      consumeMagicLink,
      logout,
      setOrgId,
    }),
    [
      session,
      bootstrap,
      retryRoleProbe,
      applyTokensAndResolveRole,
      registerOwner,
      login,
      requestMagicLink,
      consumeMagicLink,
      logout,
      setOrgId,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
