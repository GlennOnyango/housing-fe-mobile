import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";

export default function AttachAmenitiesScreen() {
  const { unitId, unitLabel } = useLocalSearchParams<{ unitId: string; unitLabel?: string }>();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const allAmenitiesQuery = useQuery({
    queryKey: ["owner", "amenities"],
    queryFn: () => ownerApi.listAmenities({ page: 1, pageSize: 200 }),
  });

  const attachedAmenitiesQuery = useQuery({
    queryKey: ["owner", "unit-amenities", unitId],
    enabled: Boolean(unitId),
    queryFn: () => ownerApi.listUnitAmenities(unitId, { page: 1, pageSize: 200 }),
  });

  const attachMutation = useMutation({
    mutationFn: async (amenityId: string) => ownerApi.assignAmenity(unitId, amenityId),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities", unitId] });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.assign", mutationError));
    },
  });

  const attachedIds = new Set((attachedAmenitiesQuery.data?.items ?? []).map((amenity) => amenity.id));

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: "Attach Amenities" }} />
      <View style={styles.top}>
        <Text style={styles.title}>Attach Amenities</Text>
        <Text style={styles.copy}>{unitLabel ? `Unit: ${unitLabel}` : "Select amenities for this unit."}</Text>
      </View>

      <View style={styles.middle}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {allAmenitiesQuery.isLoading || attachedAmenitiesQuery.isLoading ? (
            <Text>Loading amenities...</Text>
          ) : null}
          {allAmenitiesQuery.isError ? (
            <Text style={styles.error}>{problemToMessage(normalizeApiError(allAmenitiesQuery.error))}</Text>
          ) : null}
          {attachedAmenitiesQuery.isError ? (
            <Text style={styles.error}>{problemToMessage(normalizeApiError(attachedAmenitiesQuery.error))}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {(allAmenitiesQuery.data?.items ?? []).map((amenity) => {
            const attached = attachedIds.has(amenity.id);
            return (
              <View key={amenity.id} style={styles.card}>
                <Text style={styles.cardTitle}>{amenity.name}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (!attached) {
                      attachMutation.mutate(amenity.id);
                    }
                  }}
                  style={[styles.actionButton, attached && styles.actionButtonDisabled]}
                  disabled={attached}
                >
                  <Text style={[styles.actionButtonText, attached && styles.actionButtonDisabledText]}>
                    {attached ? "Attached" : "Attach to this unit"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
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
  actionButtonDisabled: {
    borderColor: "#94a3b8",
  },
  actionButtonDisabledText: {
    color: "#64748b",
  },
});
