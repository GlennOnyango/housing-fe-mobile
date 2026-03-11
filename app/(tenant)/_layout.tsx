import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Pressable } from "react-native";

import { useSession } from "@/src/auth/session-context";

const TENANT_TITLES: Record<string, string> = {
  "tenant/index": "Tenant Dashboard",
  "tenant/invoices/index": "Invoices",
  "tenant/invoices/[invoiceId]": "Invoice Details",
  "tenant/notices/index": "Notices",
  "tenant/tickets/new": "Create Ticket",
  "tenant/service-providers/index": "Service Providers",
  "tenant/public-invoice": "Public Invoice",
  "tenant/security": "Security",
};

function formatRouteTitle(name: string) {
  if (TENANT_TITLES[name]) {
    return TENANT_TITLES[name];
  }

  const segment = name.split("/").filter(Boolean).at(-1) ?? "Tenant";
  if (segment === "index") {
    return "Tenant";
  }

  return segment
    .replace(/^\[|\]$/g, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function TenantLayout() {
  const { logout } = useSession();

  const screenOptions = ({ route }: { route: { name: string } }): NativeStackNavigationOptions => ({
    headerTitleAlign: "center",
    headerBackButtonDisplayMode: "minimal",
    title: formatRouteTitle(route.name),
    headerRight: () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Logout"
        hitSlop={8}
        onPress={() => void logout()}
        style={{ paddingHorizontal: 6, paddingVertical: 4 }}
      >
        <Ionicons name="log-out-outline" size={20} color="#0f172a" />
      </Pressable>
    ),
  });

  return (
    <Stack screenOptions={screenOptions} />
  );
}
