import { spawn } from "node:child_process";
import { MAX_OUTPUT_BYTES, type RunResult } from "./types.js";

/** Spawns a process, feeds `stdin`, enforces a hard timeout and caps captured output. */
export function runProcess(
  command: string,
  args: string[],
  opts: { stdin: string; timeoutMs: number; env: Record<string, string>; cwd?: string },
): Promise<RunResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { env: opts.env, cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let truncated = false;
    let timedOut = false;

    const collect = (which: "out" | "err") => (chunk: Buffer) => {
      const current = which === "out" ? stdout : stderr;
      if (current.length >= MAX_OUTPUT_BYTES) {
        truncated = true;
        return;
      }
      const next = current + chunk.toString("utf8");
      const capped = next.length > MAX_OUTPUT_BYTES ? next.slice(0, MAX_OUTPUT_BYTES) : next;
      if (capped.length < next.length) truncated = true;
      if (which === "out") stdout = capped;
      else stderr = capped;
    };
    child.stdout.on("data", collect("out"));
    child.stderr.on("data", collect("err"));

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, opts.timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr + String(err.message), exitCode: -1, timedOut, durationMs: Date.now() - started, truncated });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, timedOut, durationMs: Date.now() - started, truncated });
    });

    child.stdin.on("error", () => undefined);
    child.stdin.end(opts.stdin);
  });
}
