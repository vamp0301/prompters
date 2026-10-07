import { env } from "../config/env.js";
import { DockerDriver } from "./docker-driver.js";
import { ProcessDriver } from "./process-driver.js";
import type { SandboxDriver } from "./types.js";

let driver: SandboxDriver | undefined;

export function sandbox(): SandboxDriver {
  driver ??= env.SANDBOX_DRIVER === "docker" ? new DockerDriver() : new ProcessDriver();
  return driver;
}

export * from "./types.js";
