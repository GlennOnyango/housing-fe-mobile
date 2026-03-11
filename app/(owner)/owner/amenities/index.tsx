import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function AmenitiesScreen() {
  const queryClient = useQueryClient();
  const [createName, setCreateName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [amenityId, setAmenityId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amenitiesQuery = useQuery({
    queryKey: ["owner", "amenities"],
    queryFn: () => ownerApi.listAmenities({ page: 1, pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: async () => ownerApi.createAmenity({ name: createName }),
    onSuccess: () => {
      setMessage("Amenity created.");
      setError(null);
      setCreateName("");
      void queryClient.invalidateQueries({ queryKey: ["owner", "amenities"] });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.amenities.create", mutationError));
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => ownerApi.assignAmenity(unitId, amenityId),
    onSuccess: () => {
      setMessage("Amenity assigned to unit.");
      setError(null);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.amenities.assign", mutationError));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async () => ownerApi.unassignAmenity(unitId, amenityId),
    onSuccess: () => {
      setMessage("Amenity unassigned from unit.");
      setError(null);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.amenities.unassign", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Amenities</Text>

      <SectionCard title="Create amenity">
        <LabeledInput label="Amenity name" value={createName} onChangeText={setCreateName} />
        <PrimaryButton
          onPress={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={!createName.trim()}
        >
          Create
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="Assign or unassign">
        <LabeledInput label="Unit ID" value={unitId} onChangeText={setUnitId} />
        <LabeledInput label="Amenity ID" value={amenityId} onChangeText={setAmenityId} />
        <PrimaryButton
          onPress={() => assignMutation.mutate()}
          loading={assignMutation.isPending}
          disabled={!unitId || !amenityId}
        >
          Assign amenity
        </PrimaryButton>
        <PrimaryButton
          onPress={() => unassignMutation.mutate()}
          loading={unassignMutation.isPending}
          tone="light"
          disabled={!unitId || !amenityId}
        >
          Unassign amenity
        </PrimaryButton>
      </SectionCard>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="Amenity list">
        {amenitiesQuery.isLoading ? <Text>Loading amenities...</Text> : null}
        {amenitiesQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(amenitiesQuery.error))}</Text>
        ) : null}
        {(amenitiesQuery.data?.items ?? []).map((item) => (
          <Text key={item.id} style={styles.item}>
            {item.name} ({item.id})
          </Text>
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
  item: {
    color: "#334155",
  },
});
