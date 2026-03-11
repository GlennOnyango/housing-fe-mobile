import type { PropsWithChildren } from "react";

import { StyleSheet, Text, View } from "react-native";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  title: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
  },
  subtitle: {
    color: "#475569",
    fontSize: 13,
  },
  body: {
    gap: 8,
  },
});
