#!/usr/bin/env node

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const emulatorBinaryName = isWindows ? "emulator.exe" : "emulator";

const sdkRoots = [
  process.env.ANDROID_SDK_ROOT,
  process.env.ANDROID_HOME,
  process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "Android", "Sdk")
    : undefined,
  join(homedir(), "Android", "Sdk"),
].filter(Boolean);

const emulatorPath = sdkRoots
  .map((root) => join(root, "emulator", emulatorBinaryName))
  .find((candidate) => existsSync(candidate));

if (!emulatorPath) {
  console.error(
    "Android emulator binary not found. Set ANDROID_SDK_ROOT/ANDROID_HOME or install Android SDK."
  );
  process.exit(1);
}

const requestedName = process.argv[2] ?? process.env.AVD_NAME;

const list = spawn(emulatorPath, ["-list-avds"], { stdio: ["ignore", "pipe", "pipe"] });
let out = "";
let err = "";

list.stdout.on("data", (chunk) => {
  out += chunk.toString();
});

list.stderr.on("data", (chunk) => {
  err += chunk.toString();
});

list.on("close", (code) => {
  if (code !== 0) {
    console.error(err || "Failed to list AVDs.");
    process.exit(code ?? 1);
  }

  const avds = out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!avds.length) {
    console.error("No AVDs found. Create one in Android Studio Device Manager first.");
    process.exit(1);
  }

  const avdName = requestedName ?? avds[0];

  if (!avds.includes(avdName)) {
    console.error(`AVD "${avdName}" not found. Available: ${avds.join(", ")}`);
    process.exit(1);
  }

  const child = spawn(emulatorPath, ["-avd", avdName], {
    detached: true,
    stdio: "ignore",
  });

  child.unref();
  console.log(`Starting AVD: ${avdName}`);
});
