import type { PropsWithChildren } from "react";
import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SessionProvider } from "@/src/auth/session-context";
import { AppLockProvider } from "@/src/security/app-lock-context";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider queryClient={queryClient}>
        <AppLockProvider>{children}</AppLockProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
