import { StyleSheet, Text } from "react-native";

import { BackendGapsCard } from "@/src/components/backend-gaps-card";
import { Screen } from "@/src/components/screen";

export default function TenantServiceProvidersScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Service providers</Text>
      <Text style={styles.copy}>
        Service providers are now owner-managed per property. Tenant lookup is still blocked until a tenant-scoped directory endpoint is exposed.
      </Text>
      <BackendGapsCard />
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
