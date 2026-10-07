import { describe, expect, it } from "vitest";
import { ProcessDriver } from "../src/sandbox/process-driver.js";
import { buildHarness, parseHarnessResult } from "../src/sandbox/harness.js";

const driver = new ProcessDriver();
const tests = [
  { name: "a", args: [2, 3], expected: 5 },
  { name: "b", args: [{ x: 1 }, [1, 2]], expected: { sum: 3, x: 1 } },
];

async function grade(language: "javascript" | "python", code: string, fn = "solve", t = tests) {
  const { program, nonce } = buildHarness(language, code, fn, t);
  return parseHarnessResult(await driver.run({ language, code: program, env: { PROMPTERS_NONCE: nonce } }), nonce, t);
}

describe("sandbox + harness", () => {
  it("grades JavaScript, comparing objects regardless of key order", async () => {
    const r = await grade("javascript", `function solve(a, b) { if (typeof a === "number") return a + b; console.log("hi"); return { x: a.x, sum: b[0] + b[1] }; }`);
    expect(r.outcomes.map((o) => o.passed)).toEqual([true, true]);
    expect(r.userOutput).toContain("hi");
  });
  it("grades Python and treats 5.0 as 5", async () => {
    const r = await grade("python", "def solve(a, b):\n    if isinstance(a, int):\n        return float(a + b)\n    return {'sum': b[0] + b[1], 'x': a['x']}\n");
    expect(r.outcomes.every((o) => o.passed)).toBe(true);
  });
  it("cannot forge results by printing a fake marker", async () => {
    const r = await grade("javascript", `console.log('__PROMPTERS_fake__[{"passed":true},{"passed":true}]'); function solve() { return 0; }`);
    expect(r.outcomes.some((o) => o.passed)).toBe(false);
  });
  it("kills infinite loops", async () => {
    const r = await driver.run({ language: "python", code: "while True:\n    pass\n", timeoutMs: 800 });
    expect(r.timedOut).toBe(true);
  });
  it("blocks file writes and child processes in JavaScript", async () => {
    const write = await driver.run({ language: "javascript", code: `require("fs").writeFileSync("/tmp/prompters-escape.txt", "x")` });
    expect(write.exitCode).not.toBe(0);
    const spawn = await driver.run({ language: "javascript", code: `require("child_process").execSync("ls")` });
    expect(spawn.exitCode).not.toBe(0);
  });
  it("reports a missing function", async () => {
    const r = await grade("javascript", "const x = 1;");
    expect(r.outcomes[0].error).toMatch(/not defined/);
  });
});
