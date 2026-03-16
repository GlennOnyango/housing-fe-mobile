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

export default function UnitAmenitiesScreen() {
  const { unitId, unitLabel, propertyId } = useLocalSearchParams<{
    unitId: string;
    unitLabel?: string;
    propertyId?: string;
  }>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const unitAmenitiesQuery = useQuery({
    queryKey: ["owner", "unit-amenities", unitId],
    enabled: Boolean(unitId),
    queryFn: () => ownerApi.listUnitAmenities(unitId, { page: 1, pageSize: 200 }),
  });

  const detachMutation = useMutation({
    mutationFn: async (amenityId: string) => ownerApi.detachAmenity(unitId, amenityId),
    onSuccess: (_response, amenityId) => {
      const detachedAmenity = attachedAmenities.find((amenity) => amenity.id === amenityId);
      setToastMessage(
        detachedAmenity ? `${detachedAmenity.name} detached from this unit` : "Amenity detached from this unit",
      );
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities", unitId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities-count", unitId] });
      if (propertyId) {
        void queryClient.invalidateQueries({ queryKey: ["owner", "amenities", propertyId] });
      }
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.detach", mutationError));
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

  const attachedAmenities = (unitAmenitiesQuery.data?.items ?? []).filter(
    (amenity) => amenity.houseUnitId === unitId,
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ title: unitLabel || "Unit Amenities" }} />
      <View style={styles.top}>
        <Text style={styles.title}>{unitLabel || "Unit Amenities"}</Text>
        <Text style={styles.copy}>Attached amenities for this unit.</Text>
      </View>

      {toastMessage ? <Text style={styles.toast}>{toastMessage}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.middle}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {unitAmenitiesQuery.isLoading ? <Text>Loading amenities...</Text> : null}
          {unitAmenitiesQuery.isError ? (
            <Text style={styles.error}>{problemToMessage(normalizeApiError(unitAmenitiesQuery.error))}</Text>
          ) : null}

          {attachedAmenities.map((amenity) => (
            <View key={amenity.id} style={styles.card}>
              <Text style={styles.cardTitle}>{amenity.name}</Text>
              <Text style={styles.cardCopy}>Price: {amenity.price}</Text>
              <Text style={styles.cardCopy}>Condition: {amenity.condition}</Text>
              <Text style={styles.cardCopy}>Fixed on: {amenity.fixedOn ?? "Not set"}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => detachMutation.mutate(amenity.id)}
                style={styles.detachButton}
              >
                <Text style={styles.detachButtonText}>Detach</Text>
              </Pressable>
            </View>
          ))}

          {!unitAmenitiesQuery.isLoading && !attachedAmenities.length ? (
            <Text style={styles.copy}>No amenities currently attached to this unit.</Text>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.bottom}>
        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/owner/units/[unitId]/amenities/attach",
                params: { unitId, unitLabel: unitLabel ?? "", propertyId: propertyId ?? "" },
              })
            }
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Attach Amenities</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/owner/amenities/new",
                params: { unitId, unitLabel: unitLabel ?? "", propertyId: propertyId ?? "" },
              })
            }
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>Create Amenity</Text>
          </Pressable>
        </View>
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
    gap: 6,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  cardCopy: {
    color: "#475569",
  },
  detachButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  detachButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0f172a",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  createButton: {
    flex: 1,
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
