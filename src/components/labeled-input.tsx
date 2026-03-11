import type { TextInputProps } from "react-native";

import { StyleSheet, Text, TextInput, View } from "react-native";

interface LabeledInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function LabeledInput({ label, error, ...rest }: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor="#64748b"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    color: "#0f172a",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    borderRadius: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  inputError: {
    borderColor: "#b91c1c",
  },
  error: {
    color: "#b91c1c",
    fontSize: 12,
  },
});
