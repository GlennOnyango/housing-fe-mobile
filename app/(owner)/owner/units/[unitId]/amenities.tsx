import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";

export default function UnitAmenitiesScreen() {
  const { unitId, unitLabel } = useLocalSearchParams<{ unitId: string; unitLabel?: string }>();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const unitAmenitiesQuery = useQuery({
    queryKey: ["owner", "unit-amenities", unitId],
    enabled: Boolean(unitId),
    queryFn: () => ownerApi.listUnitAmenities(unitId, { page: 1, pageSize: 200 }),
  });

  const detachMutation = useMutation({
    mutationFn: async (amenityId: string) => ownerApi.unassignAmenity(unitId, amenityId),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities", unitId] });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.unassign", mutationError));
    },
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: unitLabel || "Unit Amenities" }} />
      <View style={styles.top}>
        <Text style={styles.title}>{unitLabel || "Unit Amenities"}</Text>
        <Text style={styles.copy}>Attach or detach amenities for this unit.</Text>
      </View>

      <View style={styles.middle}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {unitAmenitiesQuery.isLoading ? <Text>Loading amenities...</Text> : null}
          {unitAmenitiesQuery.isError ? (
            <Text style={styles.error}>{problemToMessage(normalizeApiError(unitAmenitiesQuery.error))}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {(unitAmenitiesQuery.data?.items ?? []).map((amenity) => (
            <View key={amenity.id} style={styles.card}>
              <Text style={styles.cardTitle}>{amenity.name}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => detachMutation.mutate(amenity.id)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Detach</Text>
              </Pressable>
            </View>
          ))}

          {!unitAmenitiesQuery.isLoading && !(unitAmenitiesQuery.data?.items ?? []).length ? (
            <Text style={styles.copy}>No amenities currently attached to this unit.</Text>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/owner/units/[unitId]/amenities/attach",
              params: { unitId, unitLabel: unitLabel ?? "" },
            })
          }
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Attach Amenities</Text>
        </Pressable>
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
  copy: {
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
    gap: 8,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  actionButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  actionButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  createButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  createButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
