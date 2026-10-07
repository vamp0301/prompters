import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "../config/env.js";
import { runProcess } from "./spawn.js";
import type { RunRequest, RunResult, SandboxDriver } from "./types.js";

/**
 * DEVELOPMENT driver. Runs code in a child process of the worker with a clean env,
 * an empty temp working dir, a hard timeout and (for Node) the permission model
 * which blocks file writes, child processes and workers.
 *
 * This is NOT a security boundary — Python can still reach the network and the
 * file system. Production must use SANDBOX_DRIVER=docker (or disabled); startup refuses process.
 */
export class ProcessDriver implements SandboxDriver {
  readonly name = "process";

  async run(req: RunRequest): Promise<RunResult> {
    const dir = await mkdtemp(path.join(tmpdir(), "prompters-run-"));
    const baseEnv: Record<string, string> = { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: dir, LANG: "C.UTF-8", ...req.env };
    const timeoutMs = req.timeoutMs ?? env.SANDBOX_TIMEOUT_MS;
    try {
      if (req.language === "javascript") {
        return await runProcess(
          process.execPath,
          ["--permission", `--allow-fs-read=${dir}`, `--max-old-space-size=${env.SANDBOX_MEMORY_MB}`, "-"],
          { stdin: req.code, timeoutMs, env: { ...baseEnv, NODE_OPTIONS: "" }, cwd: dir },
        );
      }
      return await runProcess("python3", ["-I", "-"], {
        stdin: req.code,
        timeoutMs,
        env: { ...baseEnv, PYTHONDONTWRITEBYTECODE: "1", PYTHONIOENCODING: "utf-8" },
        cwd: dir,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
