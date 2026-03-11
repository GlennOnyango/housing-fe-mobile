import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppState, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const APP_LOCK_ENABLED_KEY = "security.appLock.enabled";
const APP_LOCK_PIN_KEY = "security.appLock.pin";

interface AppLockContextValue {
  enabled: boolean;
  locked: boolean;
  pinSet: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  setPin: (pin: string | null) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockNow: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const lockNow = useCallback(async () => {
    if (!enabled) {
      setLocked(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware
      ? await LocalAuthentication.isEnrolledAsync()
      : false;

    if (enrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock housing app",
        disableDeviceFallback: false,
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        setLocked(false);
        return;
      }
    }

    if (pinSet) {
      setLocked(true);
      return;
    }

    setLocked(false);
  }, [enabled, pinSet]);

  const unlockWithPin = useCallback(async (pin: string) => {
    const savedPin = await SecureStore.getItemAsync(APP_LOCK_PIN_KEY);
    const success = Boolean(savedPin) && savedPin === pin;
    if (success) {
      setLocked(false);
    }

    return success;
  }, []);

  const setEnabled = useCallback(
    async (nextEnabled: boolean) => {
      setEnabledState(nextEnabled);
      await SecureStore.setItemAsync(
        APP_LOCK_ENABLED_KEY,
        nextEnabled ? "true" : "false",
      );

      if (nextEnabled) {
        await lockNow();
      } else {
        setLocked(false);
      }
    },
    [lockNow],
  );

  const setPin = useCallback(async (pin: string | null) => {
    if (!pin) {
      await SecureStore.deleteItemAsync(APP_LOCK_PIN_KEY);
      setPinSet(false);
      return;
    }

    await SecureStore.setItemAsync(APP_LOCK_PIN_KEY, pin);
    setPinSet(true);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const [storedEnabled, storedPin] = await Promise.all([
        SecureStore.getItemAsync(APP_LOCK_ENABLED_KEY),
        SecureStore.getItemAsync(APP_LOCK_PIN_KEY),
      ]);

      setEnabledState(storedEnabled === "true");
      setPinSet(Boolean(storedPin));
      setHydrated(true);
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || !enabled) {
      return;
    }

    void lockNow();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void lockNow();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, hydrated, lockNow]);

  const value = useMemo<AppLockContextValue>(
    () => ({
      enabled,
      locked,
      pinSet,
      setEnabled,
      setPin,
      unlockWithPin,
      lockNow,
    }),
    [enabled, locked, pinSet, setEnabled, setPin, unlockWithPin, lockNow],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error("useAppLock must be used inside AppLockProvider");
  }

  return context;
}

export function AppLockOverlay() {
  const { enabled, locked, unlockWithPin, pinSet } = useAppLock();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!enabled || !locked || !pinSet) {
    return null;
  }

  const handleUnlock = async () => {
    const success = await unlockWithPin(pin.trim());
    if (!success) {
      setError("Incorrect PIN.");
      return;
    }

    setError(null);
    setPin("");
  };

  return (
    <Modal visible transparent={false} animationType="fade">
      <View style={styles.overlay}>
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.copy}>Enter your PIN to continue.</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="PIN"
          placeholderTextColor="#64748b"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={handleUnlock}>
          <Text style={styles.buttonText}>Unlock</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  copy: {
    color: "#475569",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  error: {
    color: "#b91c1c",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#f8fafc",
    fontWeight: "600",
  },
});
