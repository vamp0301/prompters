import { env } from "../config/env.js";
import { DockerDriver } from "./docker-driver.js";
import { ProcessDriver } from "./process-driver.js";
import type { SandboxDriver } from "./types.js";

let driver: SandboxDriver | undefined;

export function sandbox(): SandboxDriver {
  // Defence in depth: the queue already refuses jobs when disabled; never fall back to the process runner.
  if (env.SANDBOX_DRIVER === "disabled") throw new Error("Code execution is disabled (SANDBOX_DRIVER=disabled)");
  driver ??= env.SANDBOX_DRIVER === "docker" ? new DockerDriver() : new ProcessDriver();
  return driver;
}

export * from "./types.js";
