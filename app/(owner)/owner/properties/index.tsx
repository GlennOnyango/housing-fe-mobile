import { Ionicons } from "@expo/vector-icons";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";

const propertiesQueryKey = ["owner", "properties"];

export default function PropertiesScreen() {
  const queryClient = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: propertiesQueryKey,
    queryFn: () => ownerApi.listProperties({ page: 1, pageSize: 50 }),
  });

  const items = propertiesQuery.data?.items ?? [];
  const unitCountQueries = useQueries({
    queries: items.map((property) => ({
      queryKey: ["owner", "property-units-count", property.id],
      queryFn: () => ownerApi.listUnits(property.id, { page: 1, pageSize: 1 }),
      enabled: items.length > 0,
    })),
  });
  const serviceCountQueries = useQueries({
    queries: items.map((property) => ({
      queryKey: ["owner", "property-services-count", property.id],
      queryFn: () => ownerApi.listServiceProviders(property.id, undefined, { page: 1, pageSize: 1 }),
      enabled: items.length > 0,
    })),
  });

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.title}>Properties</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/owner/properties/new")}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Create Property</Text>
        </Pressable>
      </View>

      {propertiesQuery.isLoading ? <Text>Loading properties...</Text> : null}
      {propertiesQuery.isError ? (
        <Text style={styles.error}>
          {problemToMessage(normalizeApiError(propertiesQuery.error))}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {items.map((property, index) => {
          const unitsTotal = unitCountQueries[index]?.data?.total;
          const servicesTotal = serviceCountQueries[index]?.data?.total;
          return (
            <Pressable
              key={property.id}
              accessibilityRole="button"
              onPress={() => router.push(`/owner/properties/${property.id}`)}
              style={styles.card}
            >
              <Ionicons name="business-outline" size={20} color="#1d4ed8" />
              <Text style={styles.cardName} numberOfLines={1}>
                {property.name}
              </Text>
              <Text style={styles.cardAddress} numberOfLines={2}>
                {property.addressLine1 ??
                  ([property.city, property.country].filter(Boolean).join(", ") || "-")}
              </Text>
              <Text style={styles.cardUnits}>
                Units: {typeof unitsTotal === "number" ? unitsTotal : "..."}
              </Text>
              <Text style={styles.cardUnits}>
                Services: {typeof servicesTotal === "number" ? servicesTotal : "..."}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!items.length && !propertiesQuery.isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No properties yet.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void queryClient.invalidateQueries({ queryKey: propertiesQueryKey })}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createButtonText: {
    color: "#ffffff",
    fontWeight: "700",
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
    padding: 12,
    gap: 6,
  },
  cardName: {
    color: "#0f172a",
    fontWeight: "700",
  },
  cardAddress: {
    color: "#475569",
    minHeight: 34,
  },
  cardUnits: {
    color: "#1e293b",
    fontWeight: "600",
  },
  empty: {
    gap: 10,
  },
  emptyText: {
    color: "#475569",
  },
  refreshButton: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
