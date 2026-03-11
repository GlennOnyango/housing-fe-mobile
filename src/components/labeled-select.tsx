import { useMemo, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface LabeledSelectOption {
  label: string;
  value: string;
}

interface LabeledSelectProps {
  label: string;
  value: string;
  options: readonly LabeledSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function LabeledSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  error,
}: LabeledSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!value) {
      return placeholder;
    }
    return options.find((option) => option.value === value)?.label ?? value;
  }, [options, placeholder, value]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={[styles.select, error ? styles.selectError : null]}
      >
        <Text style={[styles.selectedText, !value ? styles.placeholder : null]}>
          {selectedLabel}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.optionsContainer}>
          <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
            {options.map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
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
  select: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    borderRadius: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
  },
  selectedText: {
    color: "#0f172a",
    fontSize: 16,
  },
  placeholder: {
    color: "#64748b",
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    maxHeight: 220,
  },
  optionsScroll: {
    maxHeight: 220,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionText: {
    color: "#0f172a",
    fontSize: 15,
  },
  selectError: {
    borderColor: "#b91c1c",
  },
  error: {
    color: "#b91c1c",
    fontSize: 12,
  },
});
