import { useState } from "react";

import { Switch, StyleSheet, Text, View } from "react-native";

import { useSession } from "@/src/auth/session-context";
import { BackendGapsCard } from "@/src/components/backend-gaps-card";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { useAppLock } from "@/src/security/app-lock-context";
import { maskEmail, maskPhone } from "@/src/utils/pii";

export default function SecurityScreen() {
  const { logout } = useSession();
  const { enabled, pinSet, setEnabled, setPin, lockNow } = useAppLock();
  const [pin, setPinInput] = useState("");
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const applyPin = async () => {
    if (!pin.trim()) {
      await setPin(null);
      setPinMessage("PIN removed.");
      return;
    }

    await setPin(pin.trim());
    setPinMessage("PIN updated.");
    setPinInput("");
  };

  return (
    <Screen>
      <Text style={styles.title}>Security settings</Text>

      <SectionCard title="App lock">
        <View style={styles.switchRow}>
          <Text style={styles.label}>Enable biometric/PIN lock</Text>
          <Switch value={enabled} onValueChange={(value) => void setEnabled(value)} />
        </View>
        <LabeledInput
          label={`PIN ${pinSet ? "(currently set)" : "(optional fallback)"}`}
          value={pin}
          onChangeText={setPinInput}
          secureTextEntry
          keyboardType="number-pad"
        />
        {pinMessage ? <Text style={styles.success}>{pinMessage}</Text> : null}
        <PrimaryButton onPress={() => void applyPin()} tone="light">
          Save PIN
        </PrimaryButton>
        <PrimaryButton onPress={() => void lockNow()} tone="light">
          Test lock now
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="PII masking policy">
        <Text>Masked email: {maskEmail("tenant@example.com")}</Text>
        <Text>Masked phone: {maskPhone("+254700123456")}</Text>
        <Text style={styles.copy}>Sensitive fields should not be persisted unencrypted.</Text>
      </SectionCard>

      <SectionCard title="Session management">
        <PrimaryButton onPress={() => void logout()}>Logout this device</PrimaryButton>
        <PrimaryButton onPress={() => {}} tone="light" disabled>
          Device list (blocked by backend)
        </PrimaryButton>
        <PrimaryButton onPress={() => {}} tone="light" disabled>
          Logout all devices (blocked by backend)
        </PrimaryButton>
      </SectionCard>

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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#0f172a",
    fontWeight: "600",
  },
  success: {
    color: "#166534",
  },
  copy: {
    color: "#475569",
  },
});
