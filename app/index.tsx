import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";

import { tenantApi } from "@/src/api/services";
import { LoadingState } from "@/src/components/loading-state";
import { Screen } from "@/src/components/screen";
import { useSession } from "@/src/auth/session-context";

export default function IndexRoute() {
  const { session } = useSession();
  const pendingLeaseQuery = useQuery({
    queryKey: ["tenant", "leases", "pending-acceptance"],
    enabled: Boolean(
      session.accessToken &&
      session.bootstrapState === "authenticated" &&
      session.role === "tenant",
    ),
    queryFn: () => tenantApi.getPendingLeaseAcceptance(),
  });

  if (session.bootstrapState === "idle" || session.bootstrapState === "bootstrapping") {
    return (
      <Screen padded={false}>
        <LoadingState label="Bootstrapping session..." />
      </Screen>
    );
  }

  if (!session.accessToken) {
    return <Redirect href="/auth/login" />;
  }

  if (session.bootstrapState === "roleUnresolved") {
    return <Redirect href="/auth/role-unresolved" />;
  }

  if (session.role === "owner") {
    return <Redirect href="/owner" />;
  }

  if (session.role === "tenant") {
    if (pendingLeaseQuery.isPending) {
      return (
        <Screen padded={false}>
          <LoadingState label="Checking lease status..." />
        </Screen>
      );
    }

    if (pendingLeaseQuery.data?.hasPendingLease) {
      return <Redirect href="/tenant/accept-lease" />;
    }

    return <Redirect href="/tenant" />;
  }

  return <Redirect href="/auth/login" />;
}
