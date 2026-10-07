import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { DockerDriver } from "../src/sandbox/docker-driver.js";
import { MAX_OUTPUT_BYTES } from "../src/sandbox/types.js";

/**
 * Adversarial tests for the PRODUCTION sandbox. They need a Docker daemon, so they are skipped on
 * machines without one and run in CI (GitHub's Ubuntu runners have Docker). Don't call the Docker
 * sandbox "secure" anywhere these haven't passed.
 */
function dockerAvailable() {
  try {
    execFileSync("docker", ["info"], { stdio: "ignore", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
const hasDocker = dockerAvailable();
const driver = new DockerDriver();
const js = (code: string, timeoutMs?: number) => driver.run({ language: "javascript", code, timeoutMs });
const py = (code: string, timeoutMs?: number) => driver.run({ language: "python", code, timeoutMs });

describe.skipIf(!hasDocker)("docker sandbox (adversarial)", { timeout: 60_000 }, () => {
  it("runs ordinary code", async () => {
    const r = await js("console.log(1 + 1)");
    expect(r.stdout.trim()).toBe("2");
    expect(r.exitCode).toBe(0);
  });

  it("kills infinite loops and removes the container", async () => {
    const r = await js("while (true) {}", 1500);
    expect(r.timedOut).toBe(true);
    const leftover = execFileSync("docker", ["ps", "-aq", "--filter", "name=prompters-"]).toString().trim();
    expect(leftover).toBe("");
  });

  it("caps memory", async () => {
    const r = await py("x = []\nwhile True:\n    x.append(' ' * 10_000_000)\n", 10_000);
    expect(r.exitCode).not.toBe(0); // OOM-killed (137) or MemoryError
    expect(r.stdout).toBe("");
  });

  it("caps huge stdout and stderr", async () => {
    const r = await js("for (let i = 0; i < 1e6; i++) { console.log('x'.repeat(100)); console.error('y'.repeat(100)); }", 10_000);
    expect(r.truncated).toBe(true);
    expect(Buffer.byteLength(r.stdout)).toBeLessThanOrEqual(MAX_OUTPUT_BYTES);
    expect(Buffer.byteLength(r.stderr)).toBeLessThanOrEqual(MAX_OUTPUT_BYTES);
  });

  it("has no network", async () => {
    const r = await py("import socket\ntry:\n    socket.create_connection(('1.1.1.1', 53), timeout=2)\n    print('CONNECTED')\nexcept Exception as e:\n    print('BLOCKED', type(e).__name__)\n");
    expect(r.stdout).toContain("BLOCKED");
    expect(r.stdout).not.toContain("CONNECTED");
  });

  it("sees none of the backend's secrets or environment", async () => {
    const r = await js("console.log(JSON.stringify(process.env))");
    const seen = JSON.parse(r.stdout) as Record<string, string>;
    for (const secret of ["DATABASE_URL", "DIRECT_URL", "REDIS_URL", "JWT_SECRET", "AI_API_KEY", "S3_SECRET_ACCESS_KEY"]) expect(seen).not.toHaveProperty(secret);
  });

  it("can't write outside /tmp or read host files", async () => {
    const r = await py(
      [
        "import os",
        "for path in ['/etc/evil', '/app/evil', '/evil']:",
        "    try:\n        open(path, 'w').write('x')\n        print('WROTE', path)\n    except Exception:\n        print('DENIED', path)",
        "print('HOST_ENV' if os.path.exists('/app/.env') else 'NO_HOST_FILES')",
        "print('DOCKER_SOCK' if os.path.exists('/var/run/docker.sock') else 'NO_SOCK')",
      ].join("\n"),
    );
    expect(r.stdout).not.toContain("WROTE");
    expect(r.stdout).toContain("NO_HOST_FILES");
    expect(r.stdout).toContain("NO_SOCK");
  });

  it("runs as an unprivileged user", async () => {
    const r = await py("import os\nprint(os.getuid())");
    expect(r.stdout.trim()).toBe("65534");
  });

  it("survives a fork bomb (pids limit) without hurting the host", async () => {
    const r = await py("import os\nwhile True:\n    try:\n        os.fork()\n    except OSError:\n        print('LIMITED')\n        break\n", 8000);
    // Either the pids limit stopped forking, or the run was killed on timeout — never unbounded.
    expect(r.stdout.includes("LIMITED") || r.timedOut || r.exitCode !== 0).toBe(true);
    const leftover = execFileSync("docker", ["ps", "-aq", "--filter", "name=prompters-"]).toString().trim();
    expect(leftover).toBe("");
  });
});

describe.runIf(!hasDocker)("docker sandbox", () => {
  // CI sets REQUIRE_DOCKER_SANDBOX=1 so a missing daemon fails loudly instead of silently skipping.
  it.runIf(process.env.REQUIRE_DOCKER_SANDBOX === "1")("requires a Docker daemon in CI", () => {
    expect.fail("REQUIRE_DOCKER_SANDBOX=1 but no Docker daemon is available");
  });
  it.skip("adversarial tests need a Docker daemon (they run in CI)", () => {});
});
