import type { PropsWithChildren } from "react";

import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface PrimaryButtonProps extends PropsWithChildren {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "dark" | "light";
}

export function PrimaryButton({
  children,
  onPress,
  loading,
  disabled,
  tone = "dark",
}: PrimaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={[
        styles.base,
        tone === "dark" ? styles.dark : styles.light,
        inactive ? styles.inactive : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === "dark" ? "#f8fafc" : "#0f172a"} />
      ) : (
        <Text style={tone === "dark" ? styles.darkText : styles.lightText}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dark: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  light: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
  },
  inactive: {
    opacity: 0.65,
  },
  darkText: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  lightText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
