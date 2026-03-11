import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { BackendGapsCard } from "@/src/components/backend-gaps-card";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z.object({
  category: z.string().min(1, "Category is required."),
  description: z.string().min(1, "Description is required."),
});

type FormValue = z.infer<typeof schema>;

export default function TenantCreateTicketScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => tenantApi.createTicket(payload),
    onSuccess: (ticket) => {
      setError(null);
      setMessage(`Ticket ${ticket.id} created.`);
      reset();
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("tenant.tickets.create", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Create ticket</Text>
      <Controller
        control={control}
        name="category"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Category"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Description"
            value={field.value}
            onChangeText={field.onChange}
            multiline
            error={fieldState.error?.message}
          />
        )}
      />
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Submit ticket
      </PrimaryButton>

      <BackendGapsCard />
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
});
