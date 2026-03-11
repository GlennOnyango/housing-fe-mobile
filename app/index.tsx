import { Redirect } from "expo-router";

import { LoadingState } from "@/src/components/loading-state";
import { Screen } from "@/src/components/screen";
import { useSession } from "@/src/auth/session-context";

export default function IndexRoute() {
  const { session } = useSession();

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
    return <Redirect href="/tenant" />;
  }

  return <Redirect href="/auth/login" />;
}
