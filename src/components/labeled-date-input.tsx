import { useEffect, useMemo, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { LabeledSelect } from "@/src/components/labeled-select";

function parseDateParts(value?: string) {
  if (!value) {
    return { year: "", month: "", day: "" };
  }

  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function daysInMonth(year: string, month: string) {
  const yearNumber = Number(year);
  const monthNumber = Number(month);

  if (!yearNumber || !monthNumber) {
    return 31;
  }

  return new Date(yearNumber, monthNumber, 0).getDate();
}

interface LabeledDateInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const MONTH_OPTIONS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
] as const;

export function LabeledDateInput({
  label,
  value,
  onChangeText,
  placeholder = "Select date",
  error,
}: LabeledDateInputProps) {
  const [parts, setParts] = useState(() => parseDateParts(value));

  useEffect(() => {
    setParts(parseDateParts(value));
  }, [value]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 51 }, (_, index) => {
      const year = `${currentYear - 25 + index}`;
      return { label: year, value: year };
    });
  }, []);

  const dayOptions = useMemo(() => {
    const totalDays = daysInMonth(parts.year, parts.month);
    return Array.from({ length: totalDays }, (_, index) => {
      const day = `${index + 1}`.padStart(2, "0");
      return { label: day, value: day };
    });
  }, [parts.month, parts.year]);

  useEffect(() => {
    if (parts.year && parts.month && parts.day) {
      const maxDay = daysInMonth(parts.year, parts.month);
      if (Number(parts.day) > maxDay) {
        const nextDay = `${maxDay}`.padStart(2, "0");
        setParts((current) => ({ ...current, day: nextDay }));
        onChangeText(`${parts.year}-${parts.month}-${nextDay}`);
        return;
      }

      const nextValue = `${parts.year}-${parts.month}-${parts.day}`;
      if (nextValue !== value) {
        onChangeText(nextValue);
      }
      return;
    }

    if (value) {
      onChangeText("");
    }
  }, [onChangeText, parts.day, parts.month, parts.year, value]);

  function updatePart(key: "year" | "month" | "day", nextValue: string) {
    setParts((current) => {
      const nextParts = { ...current, [key]: nextValue };

      if ((key === "year" || key === "month") && nextParts.day) {
        const maxDay = daysInMonth(nextParts.year, nextParts.month);
        if (Number(nextParts.day) > maxDay) {
          nextParts.day = `${maxDay}`.padStart(2, "0");
        }
      }

      return nextParts;
    });
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.helper}>{placeholder}</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <LabeledSelect
            label="Year"
            value={parts.year}
            options={yearOptions}
            onValueChange={(nextValue) => updatePart("year", nextValue)}
            placeholder="Year"
            error={error}
          />
        </View>
        <View style={styles.field}>
          <LabeledSelect
            label="Month"
            value={parts.month}
            options={MONTH_OPTIONS}
            onValueChange={(nextValue) => updatePart("month", nextValue)}
            placeholder="Month"
            error={error}
          />
        </View>
        <View style={styles.field}>
          <LabeledSelect
            label="Day"
            value={parts.day}
            options={dayOptions}
            onValueChange={(nextValue) => updatePart("day", nextValue)}
            placeholder="Day"
            error={error}
          />
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: "#0f172a",
    fontWeight: "600",
  },
  helper: {
    color: "#64748b",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  field: {
    flex: 1,
  },
  error: {
    color: "#b91c1c",
    fontSize: 12,
  },
});
