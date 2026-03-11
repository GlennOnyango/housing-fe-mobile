import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.resolve(rootDir, "src/api/generated");
const backendCommand =
  process.env.BACKEND_OPENAPI_GENERATOR ??
  "npm --prefix ../housing run openapi:generate";

const isCheck = process.argv.includes("--check");

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log(`[api:types] Output directory: ${outputDir}`);
console.log(`[api:types] Command: ${backendCommand}`);

const child = spawn(backendCommand, {
  cwd: rootDir,
  shell: true,
  stdio: "inherit",
  env: {
    ...process.env,
    OPENAPI_OUTPUT: outputDir.replace(/\\/g, "/"),
  },
});

child.on("exit", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const generatedFiles = readdirSync(outputDir)
    .map((name) => path.join(outputDir, name))
    .filter((filePath) => statSync(filePath).isFile());

  if (!generatedFiles.length) {
    console.error("[api:types] Generator completed but no files were produced.");
    process.exit(1);
  }

  if (isCheck) {
    console.log("[api:types] Check completed.");
  } else {
    console.log("[api:types] Type generation completed.");
  }
});
