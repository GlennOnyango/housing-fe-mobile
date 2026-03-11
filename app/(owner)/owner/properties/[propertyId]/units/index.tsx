import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ownerApi } from "@/src/api/services";
import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { PrimaryButton } from "@/src/components/primary-button";

function statusPillStyle(status?: string) {
  if (status === "AVAILABLE") {
    return styles.statusAvailable;
  }
  if (status === "OCCUPIED") {
    return styles.statusOccupied;
  }
  if (status === "MAINTENANCE") {
    return styles.statusMaintenance;
  }
  return styles.statusUnknown;
}

export default function PropertyUnitsScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();

  const unitsQuery = useQuery({
    queryKey: ["owner", "units", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listUnits(propertyId, { page: 1, pageSize: 100 }),
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.title}>Units</Text>
      </View>

      <View style={styles.middle}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {unitsQuery.isLoading ? <Text>Loading units...</Text> : null}
          {unitsQuery.isError ? (
            <Text style={styles.error}>{problemToMessage(normalizeApiError(unitsQuery.error))}</Text>
          ) : null}
          {(unitsQuery.data?.items ?? []).map((unit) => (
            <Pressable
              key={unit.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/owner/units/[unitId]",
                  params: {
                    unitId: unit.id,
                    unitLabel: unit.unitLabel ?? unit.name ?? "",
                    floor: unit.floor?.toString() ?? "",
                    status: unit.status ?? "",
                    rent: unit.rent?.toString() ?? "",
                    deposit: unit.deposit?.toString() ?? "",
                    serviceCharge: unit.serviceCharge?.toString() ?? "",
                    effectiveAt: unit.effectiveAt ?? "",
                  },
                })
              }
              style={styles.card}
            >
              <View style={styles.cardHead}>
                <Ionicons name="business-outline" size={18} color="#1d4ed8" />
                <Text style={styles.cardTitle}>{unit.unitLabel ?? unit.name ?? `Unit ${unit.id}`}</Text>
                <View style={[styles.statusPill, statusPillStyle(unit.status)]}>
                  <Text style={styles.statusText}>{unit.status ?? "UNKNOWN"}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {typeof unit.floor === "number"
                  ? `Floor ${unit.floor}`
                  : (unit.number ?? "Floor -")}
              </Text>
              <Text style={styles.meta}>
                Rent: {unit.rent ?? "-"}  |  Deposit: {unit.deposit ?? "-"}  |  Service:{" "}
                {unit.serviceCharge ?? "-"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton onPress={() => router.push(`/owner/properties/${propertyId}/units/new`)}>
          Create Unit
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  middle: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  meta: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
  list: {
    gap: 10,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 6,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
    flex: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  statusAvailable: {
    backgroundColor: "#16a34a",
  },
  statusOccupied: {
    backgroundColor: "#f59e0b",
  },
  statusMaintenance: {
    backgroundColor: "#dc2626",
  },
  statusUnknown: {
    backgroundColor: "#64748b",
  },
});
