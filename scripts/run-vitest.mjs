#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);
const vitestArgs = ["run"];

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (arg === "--filter") {
    const pattern = rawArgs[index + 1];

    if (!pattern) {
      console.error("Missing value for --filter");
      process.exit(1);
    }

    vitestArgs.push("--testNamePattern", pattern);
    index += 1;
    continue;
  }

  vitestArgs.push(arg);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const binary = process.platform === "win32" ? "vitest.cmd" : "vitest";
const vitestBinPath = resolve(scriptDir, "../node_modules/.bin", binary);

const child = spawn(vitestBinPath, vitestArgs, { stdio: "inherit" });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
