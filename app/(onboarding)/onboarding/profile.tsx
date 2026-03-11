import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { onboardingApi } from "@/src/api/services";
import { CooldownText } from "@/src/components/cooldown-text";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().optional(),
});

type FormValue = z.infer<typeof schema>;

export default function OnboardingProfileScreen() {
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => {
      if (!inviteToken) {
        throw new Error("Missing invite token.");
      }

      return onboardingApi.completeProfile(inviteToken, payload);
    },
    onSuccess: (result) => {
      setError(null);
      router.replace({
        pathname: "/onboarding/sign",
        params: {
          inviteToken,
          leaseId: result.leaseId,
        },
      });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("onboarding.complete-profile", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Complete profile</Text>
      <Text style={styles.copy}>Invite token header is sent via `x-invite-token`.</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="First name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Last name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Phone"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="phone-pad"
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CooldownText cooldownKey="onboarding.complete-profile" />

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Save profile
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
