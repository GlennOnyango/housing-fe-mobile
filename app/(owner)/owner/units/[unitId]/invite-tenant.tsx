import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Stack, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email.").or(z.literal("")),
    phone: z.string().trim().min(1, "Phone is required."),
  });

type FormValue = z.infer<typeof schema>;

export default function InviteTenantScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) =>
      ownerApi.inviteTenant(unitId, {
        email: payload.email || undefined,
        phone: payload.phone || undefined,
      }),
    onSuccess: (result) => {
      setError(null);
      setInviteToken(result.token);
      setMessage("Invite token issued.");
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.invite-tenant", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Invite Tenant" }} />
      <Text style={styles.title}>Invite Tenant</Text>
      <Text style={styles.copy}>Unit ID: {unitId}</Text>

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Tenant email (optional)"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Tenant phone"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="phone-pad"
            error={fieldState.error?.message}
          />
        )}
      />

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {inviteToken ? (
        <Pressable
          style={styles.tokenRow}
          onPress={async () => {
            try {
              await Clipboard.setStringAsync(inviteToken);
              setMessage("Invite token copied.");
              setError(null);
              Alert.alert("Copy status", "Invite token copied successfully.");
            } catch {
              Alert.alert("Copy status", "Failed to copy invite token.");
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Copy invite token"
        >
          <View style={styles.tokenTextWrap}>
            <Text style={styles.tokenLabel}>Invite token</Text>
            <Text style={styles.tokenText} selectable>
              {inviteToken}
            </Text>
          </View>
          <Ionicons name="copy-outline" size={18} color="#1d4ed8" />
        </Pressable>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Invite Tenant
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
  success: {
    color: "#166534",
  },
  tokenRow: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tokenTextWrap: {
    flex: 1,
    gap: 2,
  },
  tokenLabel: {
    color: "#1e3a8a",
    fontWeight: "600",
    fontSize: 12,
  },
  tokenText: {
    color: "#0f172a",
  },
  error: {
    color: "#b91c1c",
  },
});
