import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ownerApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";

export default function UnitDetailsScreen() {
  const params = useLocalSearchParams<{
    unitId: string;
    propertyId?: string;
    unitLabel?: string;
    floor?: string;
    status?: string;
    rent?: string;
    deposit?: string;
    serviceCharge?: string;
  }>();

  const unitLabel = params.unitLabel || "Unit Details";

  const amenitiesCountQuery = useQuery({
    queryKey: ["owner", "unit-amenities-count", params.unitId],
    enabled: Boolean(params.unitId),
    queryFn: async () => {
      const response = await ownerApi.listUnitAmenities(params.unitId, { page: 1, pageSize: 200 });
      return response.items.filter((amenity) => amenity.houseUnitId === params.unitId).length;
    },
  });

  const cards = [
    {
      key: "edit",
      title: "Edit Unit",
      icon: "create-outline" as const,
      pathname: "/owner/units/[unitId]/edit",
    },
    {
      key: "invite",
      title: "Invite Tenant",
      icon: "person-add-outline" as const,
      pathname: "/owner/units/[unitId]/invite-tenant",
    },
    {
      key: "invited",
      title: "Invited Tenants",
      icon: "people-outline" as const,
      pathname: "/owner/units/[unitId]/invites",
    },
    {
      key: "amenities",
      title: "Amenities Attached",
      icon: "apps-outline" as const,
      pathname: "/owner/units/[unitId]/amenities",
      count: amenitiesCountQuery.data,
    },
    {
      key: "lease",
      title: "Lease Agreement",
      icon: "document-text-outline" as const,
      pathname: "/owner/units/[unitId]/lease",
    },
    {
      key: "invoices",
      title: "Unit Invoices",
      icon: "receipt-outline" as const,
      pathname: "/owner/units/[unitId]/invoices",
    },
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title: unitLabel }} />
      <Text style={styles.title}>{unitLabel}</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.key}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: card.pathname as never,
                params: {
                  unitId: params.unitId,
                  propertyId: params.propertyId ?? "",
                  unitLabel: params.unitLabel ?? "",
                  floor: params.floor ?? "",
                  status: params.status ?? "",
                  rent: params.rent ?? "",
                  deposit: params.deposit ?? "",
                  serviceCharge: params.serviceCharge ?? "",
                },
              })
            }
            style={styles.card}
          >
            <Ionicons name={card.icon} size={20} color="#1d4ed8" />
            <Text style={styles.cardCount}>{typeof card.count === "number" ? card.count : ""}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
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
  cardCount: {
    color: "#1e293b",
    fontSize: 22,
    fontWeight: "700",
    minHeight: 28,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
});
