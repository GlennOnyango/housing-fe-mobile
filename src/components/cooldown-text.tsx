import { useEffect, useMemo, useState } from "react";
import { Text, StyleSheet } from "react-native";

import { cooldownStore } from "@/src/api/cooldown-store";

interface CooldownTextProps {
  cooldownKey: string;
}

export function CooldownText({ cooldownKey }: CooldownTextProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = useMemo(
    () => cooldownStore.getRemainingMs(cooldownKey),
    [cooldownKey, now],
  );

  if (!remaining) {
    return null;
  }

  return (
    <Text style={styles.copy}>
      Retry available in {Math.ceil(remaining / 1000)}s.
    </Text>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: "#b45309",
    fontSize: 12,
  },
});
