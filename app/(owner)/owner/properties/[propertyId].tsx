import { useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

export default function PropertyDetailScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const orgId = session.orgId;

  const propertyQuery = useQuery({
    queryKey: ["owner", "property", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.getProperty(propertyId),
  });
  const unitsCountQuery = useQuery({
    queryKey: ["owner", "property-units-count", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listUnits(propertyId, { page: 1, pageSize: 1 }),
  });
  const amenitiesCountQuery = useQuery({
    queryKey: ["owner", "property-amenities-count", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listAmenities(propertyId, { page: 1, pageSize: 1 }),
  });
  const servicesCountQuery = useQuery({
    queryKey: ["owner", "property-services-count", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listServiceProviders(propertyId, undefined, { page: 1, pageSize: 1 }),
  });
  const propertyInvoiceCountQuery = useQuery({
    queryKey: ["owner", "property-invoices-count", orgId, propertyId],
    enabled: Boolean(orgId && propertyId),
    queryFn: async () => {
      const [units, invoices] = await Promise.all([
        ownerApi.listUnits(propertyId, { page: 1, pageSize: 200 }),
        ownerApi.listInvoices(orgId as string),
      ]);
      const unitIds = new Set(units.items.map((unit) => unit.id));
      return invoices.filter((invoice) => unitIds.has(invoice.houseUnitId)).length;
    },
  });
  const activeTenantsCountQuery = useQuery({
    queryKey: ["owner", "property-active-tenants-count", propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const units = await ownerApi.listUnits(propertyId, { page: 1, pageSize: 100 });
      const inviteLists = await Promise.all(
        units.items.map(async (unit) => ownerApi.listUnitInvites(unit.id, { page: 1, pageSize: 100 })),
      );

      return inviteLists
        .flatMap((list) => list.items)
        .filter((invite) => Boolean(invite.claimedAt || invite.consumedAt)).length;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => ownerApi.deleteProperty(propertyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["owner", "properties"] });
      router.replace("/owner/properties");
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.properties.delete", mutationError));
    },
  });

  const actionCards = [
    {
      key: "units",
      title: "Units",
      icon: "business-outline" as const,
      route: `/owner/properties/${propertyId}/units`,
      count: unitsCountQuery.data?.total,
    },
    {
      key: "edit",
      title: "Edit Property Details",
      icon: "create-outline" as const,
      route: `/owner/properties/${propertyId}/edit`,
      count: 1,
    },
    {
      key: "tenants",
      title: "Tenants",
      icon: "people-outline" as const,
      route: `/owner/properties/${propertyId}/tenants`,
      count: activeTenantsCountQuery.data,
    },
    {
      key: "amenities",
      title: "Amenities",
      icon: "apps-outline" as const,
      route: `/owner/properties/${propertyId}/amenities`,
      count: amenitiesCountQuery.data?.total,
    },
    {
      key: "services",
      title: "Services",
      icon: "construct-outline" as const,
      route: `/owner/properties/${propertyId}/services`,
      count: servicesCountQuery.data?.total,
    },
    {
      key: "invoices",
      title: "Invoices",
      icon: "receipt-outline" as const,
      route: `/owner/properties/${propertyId}/invoices`,
      count: propertyInvoiceCountQuery.data,
    },
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title: propertyQuery.data?.name ?? "Property Details" }} />

      <Text style={styles.title}>{propertyQuery.data?.name ?? "Property Details"}</Text>
      {propertyQuery.isLoading ? <Text>Loading property...</Text> : null}
      {propertyQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(propertyQuery.error))}</Text>
      ) : null}

      <View style={styles.grid}>
        {actionCards.map((card) => (
          <Pressable
            key={card.key}
            accessibilityRole="button"
            onPress={() => router.push(card.route as never)}
            style={styles.card}
          >
            <Ionicons name={card.icon} size={20} color="#1d4ed8" />
            <Text style={styles.cardCount}>
              {typeof card.count === "number" ? card.count : "..."}
            </Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={() => deleteMutation.mutate()}
        tone="light"
        loading={deleteMutation.isPending}
      >
        Delete property
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
  error: {
    color: "#b91c1c",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "600",
  },
  cardCount: {
    color: "#1e293b",
    fontSize: 22,
    fontWeight: "700",
  },
});
