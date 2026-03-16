import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";

export default function PropertyAmenitiesScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();

  const amenitiesQuery = useQuery({
    queryKey: ["owner", "amenities", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listAmenities(propertyId, { page: 1, pageSize: 200 }),
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Property Amenities" }} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Property Amenities</Text>
          <Text style={styles.copy}>This amenity will belong to the property, and you can attach it to a unit after creation.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/owner/amenities/new",
              params: { propertyId, lockProperty: "1" },
            })
          }
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </Pressable>
      </View>

      {amenitiesQuery.isLoading ? <Text>Loading amenities...</Text> : null}
      {amenitiesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(amenitiesQuery.error))}</Text>
      ) : null}

      <View style={styles.list}>
        {(amenitiesQuery.data?.items ?? []).map((amenity) => (
          <Pressable
            key={amenity.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/owner/amenities/new",
                params: {
                  amenityId: amenity.id,
                  propertyId,
                  lockProperty: "1",
                  name: amenity.name,
                  price: amenity.price,
                  condition: amenity.condition,
                  fixedOn: amenity.fixedOn ?? "",
                },
              })
            }
            style={styles.card}
          >
            <Text style={styles.cardTitle}>{amenity.name}</Text>
            <Text style={styles.cardCopy}>Price: {amenity.price}</Text>
            <Text style={styles.cardCopy}>Condition: {amenity.condition}</Text>
            <Text style={styles.cardCopy}>Unit: {amenity.houseUnitId ?? "Not attached"}</Text>
            <Text style={styles.cardCopy}>Fixed on: {amenity.fixedOn ?? "Not set"}</Text>
            <Text style={styles.cardHint}>Tap to edit</Text>
          </Pressable>
        ))}
      </View>

      {!amenitiesQuery.isLoading && !(amenitiesQuery.data?.items ?? []).length ? (
        <Text style={styles.copy}>No amenities have been created for this property yet.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
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
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  cardCopy: {
    color: "#475569",
  },
  cardHint: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  createButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0f172a",
  },
  createButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
