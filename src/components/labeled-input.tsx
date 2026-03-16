import type { ReactNode } from "react";
import type { TextInputProps } from "react-native";

import { StyleSheet, Text, TextInput, View } from "react-native";

interface LabeledInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightElement?: ReactNode;
}

export function LabeledInput({ label, error, rightElement, ...rest }: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <TextInput style={styles.input} placeholderTextColor="#64748b" {...rest} />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
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
  inputWrap: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    borderRadius: 10,
    minHeight: 52,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingRight: 6,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  rightElement: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  inputError: {
    borderColor: "#b91c1c",
  },
  error: {
    color: "#b91c1c",
    fontSize: 12,
  },
});
