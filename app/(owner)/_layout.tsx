import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Pressable } from "react-native";

import { useSession } from "@/src/auth/session-context";

const OWNER_TITLES: Record<string, string> = {
  "owner/index": "Owner Dashboard",
  "owner/properties/index": "Properties",
  "owner/properties/new": "Create Property",
  "owner/properties/[propertyId]": "Property Details",
  "owner/properties/[propertyId]/edit": "Edit Property Details",
  "owner/properties/[propertyId]/units/index": "Property Units",
  "owner/properties/[propertyId]/units/new": "Create Unit",
  "owner/properties/[propertyId]/tenants": "Active Tenants",
  "owner/properties/[propertyId]/amenities": "Property Amenities",
  "owner/properties/[propertyId]/services": "Services",
  "owner/properties/[propertyId]/invoices": "Invoices",
  "owner/units/[unitId]": "Unit Details",
  "owner/units/[unitId]/edit": "Edit Unit",
  "owner/units/[unitId]/invite-tenant": "Invite Tenant",
  "owner/units/[unitId]/invites": "Invited Tenants",
  "owner/units/[unitId]/amenities": "Unit Amenities",
  "owner/units/[unitId]/lease": "Lease Agreement",
  "owner/units/[unitId]/invoices": "Unit Invoices",
  "owner/units/[unitId]/amenities/attach": "Attach Amenities",
  "owner/amenities/index": "Amenities",
  "owner/amenities/new": "Create Amenity",
  "owner/onboarding-admin": "Onboarding Admin",
  "owner/invoices/index": "Invoice Admin",
  "owner/tickets": "Ticket Triage",
  "owner/service-providers": "Service Providers",
};

function formatRouteTitle(name: string) {
  if (OWNER_TITLES[name]) {
    return OWNER_TITLES[name];
  }

  const segment = name.split("/").filter(Boolean).at(-1) ?? "Owner";
  if (segment === "index") {
    return "Owner";
  }

  return segment
    .replace(/^\[|\]$/g, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function OwnerLayout() {
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
