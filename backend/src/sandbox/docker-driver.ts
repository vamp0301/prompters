import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { runProcess } from "./spawn.js";
import type { RunRequest, RunResult, SandboxDriver } from "./types.js";

/**
 * PRODUCTION driver. Every run gets a fresh, throw-away container:
 * no network, read-only root fs, small tmpfs, non-root user, all capabilities
 * dropped, no-new-privileges, CPU / memory / pid limits. Code arrives on stdin,
 * so nothing from the host is mounted.
 */
export class DockerDriver implements SandboxDriver {
  readonly name = "docker";

  async run(req: RunRequest): Promise<RunResult> {
    const name = `prompters-${randomUUID()}`;
    const image = req.language === "javascript" ? env.SANDBOX_JS_IMAGE : env.SANDBOX_PY_IMAGE;
    const interpreter = req.language === "javascript" ? ["node", "-"] : ["python3", "-I", "-"];
    const envFlags = Object.entries(req.env ?? {}).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
    const timeoutMs = req.timeoutMs ?? env.SANDBOX_TIMEOUT_MS;

    const args = [
      "run", "--rm", "-i", "--name", name,
      "--network", "none",
      "--memory", `${env.SANDBOX_MEMORY_MB}m`, "--memory-swap", `${env.SANDBOX_MEMORY_MB}m`,
      "--cpus", "0.5",
      "--pids-limit", "64",
      "--read-only",
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
      "--workdir", "/tmp",
      "--user", "65534:65534",
      "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges",
      ...envFlags,
      image,
      ...interpreter,
    ];

    // Container start-up adds latency, so allow a little extra on top of the code timeout.
    const result = await runProcess("docker", args, {
      stdin: req.code,
      timeoutMs: timeoutMs + 2000,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });
    if (result.timedOut) {
      await runProcess("docker", ["rm", "-f", name], { stdin: "", timeoutMs: 5000, env: { PATH: process.env.PATH ?? "" } });
    }
    return result;
  }
}
