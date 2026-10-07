export type SandboxLanguage = "javascript" | "python";

export interface RunRequest {
  language: SandboxLanguage;
  code: string;
  timeoutMs?: number;
  /** Extra env vars visible to the program (used for the harness nonce). */
  env?: Record<string, string>;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
  truncated: boolean;
}

export interface SandboxDriver {
  readonly name: string;
  run(req: RunRequest): Promise<RunResult>;
}

export const MAX_OUTPUT_BYTES = 64 * 1024;
export const MAX_CODE_BYTES = 64 * 1024;
