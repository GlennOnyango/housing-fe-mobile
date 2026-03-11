import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { KENYA_COUNTIES } from "@/src/constants/kenya-counties";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type FormValue = z.infer<typeof schema>;

export default function NewPropertyScreen() {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      addressLine1: "",
      city: "",
      country: "Kenya",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => ownerApi.createProperty(payload),
    onSuccess: (property) => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "properties"] });
      router.replace(`/owner/properties/${property.id}`);
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.properties.create", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Create property</Text>
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
          <LabeledSelect
            label="City (County)"
            value={field.value ?? ""}
            onValueChange={field.onChange}
            options={KENYA_COUNTIES.map((county) => ({ label: county, value: county }))}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field, fieldState }) => (
          <LabeledSelect
            label="Country"
            value={field.value ?? "Kenya"}
            onValueChange={field.onChange}
            options={[{ label: "Kenya", value: "Kenya" }]}
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Create property
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
