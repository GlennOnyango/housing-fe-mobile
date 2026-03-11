import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import SignatureScreen from "react-native-signature-canvas";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { onboardingApi } from "@/src/api/services";
import { CooldownText } from "@/src/components/cooldown-text";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { uploadSignatureDataUrl } from "@/src/features/upload-signature";
import { SensitiveScreen } from "@/src/security/sensitive-screen";

export default function OnboardingSignScreen() {
  const params = useLocalSearchParams<{ inviteToken?: string; leaseId?: string }>();
  const [leaseId, setLeaseId] = useState(params.leaseId ?? "");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inviteToken = params.inviteToken;

  useEffect(() => {
    if (params.leaseId) {
      setLeaseId(params.leaseId);
    }
  }, [params.leaseId]);

  const htmlStyle = useMemo(
    () => `
      .m-signature-pad--footer { display: none; margin: 0px; }
      .m-signature-pad { box-shadow: none; border: 1px solid #cbd5e1; border-radius: 12px; }
      body,html { width: 100%; height: 100%; margin: 0; padding: 0; }
    `,
    [],
  );

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!inviteToken) {
        throw new Error("Missing invite token.");
      }

      if (!signatureDataUrl) {
        throw new Error("Draw a signature before submitting.");
      }
      if (!leaseId.trim()) {
        throw new Error("Lease ID is required.");
      }

      const signatureImageUrl = await uploadSignatureDataUrl(signatureDataUrl);
      await onboardingApi.signLease(inviteToken, { leaseId, signatureImageUrl });
    },
    onSuccess: () => {
      setError(null);
      setMessage("Lease signed. Proceed to magic-link authentication.");
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("onboarding.sign-lease", mutationError));
    },
  });

  const leasePreviewQuery = useQuery({
    queryKey: ["onboarding", "lease-preview", inviteToken, leaseId],
    queryFn: async () => {
      if (!inviteToken) {
        throw new Error("Missing invite token.");
      }
      if (!leaseId.trim()) {
        throw new Error("Lease ID is required.");
      }
      return onboardingApi.getLeasePreview(inviteToken, leaseId.trim());
    },
    enabled: Boolean(inviteToken && leaseId.trim()),
    retry: false,
  });

  return (
    <SensitiveScreen>
      <Screen>
        <Text style={styles.title}>Sign lease</Text>
        <Text style={styles.copy}>
          Signature image is uploaded via `/files/presign-upload` then attached to `/onboarding/sign-lease`.
        </Text>
        <LabeledInput label="Lease ID" value={leaseId} onChangeText={setLeaseId} />
        <Text style={styles.sectionTitle}>Lease preview</Text>
        {leasePreviewQuery.isPending ? (
          <Text style={styles.copy}>Loading lease preview...</Text>
        ) : null}
        {leasePreviewQuery.data?.documentHtml ? (
          <View style={styles.leasePreviewWrap}>
            <WebView source={{ html: leasePreviewQuery.data.documentHtml }} />
          </View>
        ) : leasePreviewQuery.data?.renderedPdfUrl ? (
          <View style={styles.leasePreviewWrap}>
            <WebView source={{ uri: leasePreviewQuery.data.renderedPdfUrl }} />
          </View>
        ) : null}
        {leasePreviewQuery.isError ? (
          <Text style={styles.error}>
            {messageFromLoggedApiError("onboarding.lease-preview", leasePreviewQuery.error)}
          </Text>
        ) : null}
        {!leasePreviewQuery.isPending &&
        !leasePreviewQuery.isError &&
        !leasePreviewQuery.data?.documentHtml &&
        !leasePreviewQuery.data?.renderedPdfUrl ? (
          <Text style={styles.copy}>No lease content available to preview.</Text>
        ) : null}
        <View style={styles.signatureWrap}>
          <SignatureScreen
            webStyle={htmlStyle}
            onOK={(result) => setSignatureDataUrl(result)}
            onEmpty={() => setSignatureDataUrl(null)}
            descriptionText="Sign inside the box"
            clearText="Clear"
            confirmText="Save"
          />
        </View>

        {signatureDataUrl ? <Text style={styles.success}>Signature captured.</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <CooldownText cooldownKey="onboarding.sign-lease" />

        <PrimaryButton onPress={() => signMutation.mutate()} loading={signMutation.isPending}>
          Submit signature
        </PrimaryButton>

        {message ? (
          <Link href="/auth/request-magic-link" style={styles.link}>
            Continue to tenant login
          </Link>
        ) : null}
      </Screen>
    </SensitiveScreen>
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
  signatureWrap: {
    height: 260,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  leasePreviewWrap: {
    height: 260,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
});
