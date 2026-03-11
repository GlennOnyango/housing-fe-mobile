import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

const OWNER_ROUTES = [
  { href: "/owner/properties", title: "Properties", icon: "business-outline" },
  { href: "/owner/amenities", title: "Amenities", icon: "apps-outline" },
  { href: "/owner/onboarding-admin", title: "Onboarding", icon: "document-text-outline" },
  { href: "/owner/invoices", title: "Invoices", icon: "receipt-outline" },
  { href: "/owner/tickets", title: "Tickets", icon: "chatbubbles-outline" },
  {
    href: "/owner/service-providers",
    title: "Service Providers",
    icon: "construct-outline",
  },
] as const;

export default function OwnerDashboardScreen() {
  const { session } = useSession();
  const orgId = session.orgId;

  const propertiesQuery = useQuery({
    queryKey: ["owner", "dashboard", "properties-count"],
    queryFn: () => ownerApi.listProperties({ page: 1, pageSize: 1 }),
  });

  const amenitiesQuery = useQuery({
    queryKey: ["owner", "dashboard", "amenities-count"],
    queryFn: () => ownerApi.listAmenities({ page: 1, pageSize: 1 }),
  });

  const onboardingConfigQuery = useQuery({
    queryKey: ["owner", "dashboard", "onboarding-config", orgId],
    enabled: Boolean(orgId),
    queryFn: () => ownerApi.getOnboardingConfig(orgId as string),
  });

  const ticketsQuery = useQuery({
    queryKey: ["owner", "dashboard", "tickets", orgId],
    enabled: Boolean(orgId),
    queryFn: () => ownerApi.listOrgTickets(orgId as string, { page: 1, pageSize: 1 }),
  });

  const counts = {
    properties: propertiesQuery.data?.total ?? 0,
    amenities: amenitiesQuery.data?.total ?? 0,
    onboarding: onboardingConfigQuery.data
      ? Object.keys(onboardingConfigQuery.data.settings ?? {}).length
      : 0,
    invoices: 0,
    tickets: ticketsQuery.data?.total ?? 0,
    serviceProviders: 0,
  };

  return (
    <Screen>
      <Text style={styles.title}>Owner workspace</Text>
      <Text style={styles.copy}>
        Manage properties, units, amenities and invoice operations.
      </Text>

      <SectionCard title="Workspace">
        <View style={styles.grid}>
          {OWNER_ROUTES.map((route) => (
            <Pressable
              key={route.href}
              accessibilityRole="button"
              onPress={() => router.push(route.href)}
              style={styles.card}
            >
              <Ionicons name={route.icon} size={22} color="#1d4ed8" />
              <Text style={styles.cardCount}>
                {route.href === "/owner/properties"
                  ? counts.properties
                  : route.href === "/owner/amenities"
                    ? counts.amenities
                    : route.href === "/owner/onboarding-admin"
                      ? counts.onboarding
                      : route.href === "/owner/invoices"
                        ? counts.invoices
                        : route.href === "/owner/tickets"
                          ? counts.tickets
                          : counts.serviceProviders}
              </Text>
              <Text style={styles.cardTitle}>{route.title}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48%",
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "600",
  },
  cardCount: {
    color: "#1e293b",
    fontSize: 24,
    fontWeight: "700",
  },
});
