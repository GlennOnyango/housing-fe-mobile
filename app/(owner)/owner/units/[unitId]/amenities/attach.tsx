import { useEffect, useState } from "react";

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

export default function AttachAmenitiesScreen() {
  const { unitId, unitLabel, propertyId } = useLocalSearchParams<{
    unitId: string;
    unitLabel?: string;
    propertyId?: string;
  }>();
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const allAmenitiesQuery = useQuery({
    queryKey: ["owner", "amenities", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listAmenities(propertyId as string, { page: 1, pageSize: 200 }),
  });

  const attachMutation = useMutation({
    mutationFn: async (amenityId: string) => ownerApi.assignAmenity(unitId, amenityId),
    onSuccess: (amenity) => {
      setError(null);
      setToastMessage(`${amenity.name} attached to this unit`);
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities", unitId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities-count", unitId] });
      if (propertyId) {
        void queryClient.invalidateQueries({ queryKey: ["owner", "amenities", propertyId] });
      }
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.attach", mutationError));
    },
  });

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const availableAmenities = (allAmenitiesQuery.data?.items ?? []).filter(
    (amenity) => !amenity.houseUnitId,
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: "Attach Amenities" }} />
      <View style={styles.top}>
        <Text style={styles.title}>Attach Amenities</Text>
        <Text style={styles.copy}>{unitLabel ? `Unit: ${unitLabel}` : "Select amenities for this unit."}</Text>
      </View>

      {toastMessage ? <Text style={styles.toast}>{toastMessage}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/owner/amenities/new",
              params: { unitId, unitLabel: unitLabel ?? "", propertyId: propertyId ?? "" },
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Create amenity</Text>
        </Pressable>
      </View>

      <View style={styles.middle}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {allAmenitiesQuery.isLoading ? <Text>Loading amenities...</Text> : null}
          {allAmenitiesQuery.isError ? (
            <Text style={styles.error}>{problemToMessage(normalizeApiError(allAmenitiesQuery.error))}</Text>
          ) : null}

          {availableAmenities.map((amenity) => (
            <View key={amenity.id} style={styles.card}>
              <Text style={styles.cardTitle}>{amenity.name}</Text>
              <Text style={styles.cardCopy}>Price: {amenity.price}</Text>
              <Text style={styles.cardCopy}>Condition: {amenity.condition}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => attachMutation.mutate(amenity.id)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Attach to this unit</Text>
              </Pressable>
            </View>
          ))}

          {!allAmenitiesQuery.isLoading && !availableAmenities.length ? (
            <Text style={styles.copy}>No unattached property amenities found. Create one first.</Text>
          ) : null}
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
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  toast: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    color: "#166534",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "600",
  },
  error: {
    color: "#b91c1c",
    marginHorizontal: 16,
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
  cardCopy: {
    color: "#475569",
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
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
