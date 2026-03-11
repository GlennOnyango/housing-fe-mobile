import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type FormValue = z.infer<typeof schema>;

export default function EditPropertyScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const propertyQuery = useQuery({
    queryKey: ["owner", "property", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.getProperty(propertyId),
  });

  const { control, handleSubmit, reset } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      addressLine1: "",
      city: "",
      country: "",
    },
  });

  useEffect(() => {
    if (!propertyQuery.data) {
      return;
    }

    reset({
      name: propertyQuery.data.name,
      addressLine1: propertyQuery.data.addressLine1 ?? "",
      city: propertyQuery.data.city ?? "",
      country: propertyQuery.data.country ?? "",
    });
  }, [propertyQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: async (payload: FormValue) => ownerApi.updateProperty(propertyId, payload),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "property", propertyId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "properties"] });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.properties.update", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Edit Property Details" }} />
      <Text style={styles.title}>Edit Property Details</Text>
      {propertyQuery.isLoading ? <Text>Loading property...</Text> : null}
      {propertyQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(propertyQuery.error))}</Text>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="addressLine1"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Address line"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="City"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Country"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleSubmit((payload) => updateMutation.mutate(payload))}
        loading={updateMutation.isPending}
      >
        Save property
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
