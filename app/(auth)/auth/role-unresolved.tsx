import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";

import { useSession } from "@/src/auth/session-context";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

export default function RoleUnresolvedScreen() {
  const { retryRoleProbe, logout } = useSession();

  const retryMutation = useMutation({
    mutationFn: async () => {
      await retryRoleProbe();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout();
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Role unresolved</Text>
      <Text style={styles.copy}>
        Tokens are valid, but role bootstrap was not deterministic. This fallback
        remains until `GET /auth/me` is available.
      </Text>
      <PrimaryButton onPress={() => retryMutation.mutate()} loading={retryMutation.isPending}>
        Retry role probe
      </PrimaryButton>
      <PrimaryButton
        onPress={() => logoutMutation.mutate()}
        loading={logoutMutation.isPending}
        tone="light"
      >
        Logout
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
});
