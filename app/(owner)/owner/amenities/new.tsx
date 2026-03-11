import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

export default function CreateAmenityScreen() {
  const { unitId, unitLabel } = useLocalSearchParams<{ unitId?: string; unitLabel?: string }>();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => ownerApi.createAmenity({ name }),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "amenities"] });
      if (unitId) {
        router.replace({
          pathname: "/owner/units/[unitId]/amenities",
          params: { unitId, unitLabel: unitLabel ?? "" },
        });
        return;
      }
      router.back();
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.create", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Create Amenity" }} />
      <Text style={styles.title}>Create Amenity</Text>
      <LabeledInput label="Amenity name" value={name} onChangeText={setName} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        onPress={() => createMutation.mutate()}
        loading={createMutation.isPending}
        disabled={!name.trim()}
      >
        Create Amenity
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
});
