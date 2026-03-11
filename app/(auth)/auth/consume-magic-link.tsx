import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { useSession } from "@/src/auth/session-context";
import { CooldownText } from "@/src/components/cooldown-text";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z.object({
  token: z.string().min(6, "Invite/magic token is required."),
});

type FormValue = z.infer<typeof schema>;

export default function ConsumeMagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { consumeMagicLink } = useSession();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, setValue } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { token: "" },
  });

  useEffect(() => {
    if (token && typeof token === "string") {
      setValue("token", token);
    }
  }, [setValue, token]);

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => {
      await consumeMagicLink(payload);
    },
    onSuccess: () => {
      setError(null);
      router.replace("/");
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("auth.consume-magic-link", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Consume magic link</Text>
      <Text style={styles.copy}>Paste token from your email link to create session.</Text>

      <Controller
        control={control}
        name="token"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Token"
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CooldownText cooldownKey="auth.consume-magic-link" />

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Consume link
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
  copy: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
});
