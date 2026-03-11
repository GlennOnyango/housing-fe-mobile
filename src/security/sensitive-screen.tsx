import type { PropsWithChildren } from "react";

import { usePreventScreenCapture } from "expo-screen-capture";

export function SensitiveScreen({ children }: PropsWithChildren) {
  usePreventScreenCapture();
  return children;
}
