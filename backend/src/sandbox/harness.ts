import { randomBytes } from "node:crypto";
import type { RunResult, SandboxLanguage } from "./types.js";

export interface TestCase {
  name: string;
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface TestOutcome {
  name: string;
  passed: boolean;
  hidden: boolean;
  actual?: unknown;
  error?: string;
}

/**
 * Builds a program that runs the student's code and then calls `functionName`
 * against every test case, printing results on a line prefixed with a random
 * nonce (passed via env, removed before student code runs) so ordinary prints
 * cannot be mistaken for results.
 */
export function buildHarness(language: SandboxLanguage, code: string, functionName: string, tests: TestCase[]) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(functionName)) throw new Error("Invalid function name");
  const nonce = `__PROMPTERS_${randomBytes(12).toString("hex")}__`;
  const payload = JSON.stringify(tests.map((t) => ({ name: t.name, args: t.args, expected: t.expected })));

  if (language === "javascript") {
    const program = `const __prompters_h = (() => {
  const nonce = process.env.PROMPTERS_NONCE || "";
  delete process.env.PROMPTERS_NONCE;
  const write = process.stdout.write.bind(process.stdout);
  const stringify = JSON.stringify, parse = JSON.parse, isArray = Array.isArray, keys = Object.keys;
  const tests = parse(${JSON.stringify(payload)});
  const canon = (v) => {
    if (isArray(v)) return v.map(canon);
    if (v && typeof v === "object") { const o = {}; for (const k of keys(v).sort()) o[k] = canon(v[k]); return o; }
    return v;
  };
  const norm = (v) => (v === undefined ? null : parse(stringify(v) ?? "null"));
  return {
    run(fn) {
      const results = tests.map((t) => {
        if (typeof fn !== "function") return { passed: false, error: "Function ${functionName} is not defined" };
        try {
          const actual = norm(fn(...parse(stringify(t.args))));
          return { passed: stringify(canon(actual)) === stringify(canon(t.expected)), actual };
        } catch (e) {
          return { passed: false, error: String((e && e.message) || e) };
        }
      });
      write("\\n" + nonce + stringify(results) + "\\n");
    },
  };
})();
${code}
;__prompters_h.run(typeof ${functionName} === "function" ? ${functionName} : undefined);
`;
    return { program, nonce };
  }

  const program = `import json as __prompters_json, sys as __prompters_sys, os as __prompters_os
__prompters_nonce = __prompters_os.environ.pop("PROMPTERS_NONCE", "")
__prompters_dumps = __prompters_json.dumps
__prompters_loads = __prompters_json.loads
__prompters_write = __prompters_sys.stdout.write
__prompters_tests = __prompters_loads(${JSON.stringify(payload)})

${code}

def __prompters_norm(v):
    if isinstance(v, bool) or v is None:
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, (list, tuple)):
        return [__prompters_norm(x) for x in v]
    if isinstance(v, dict):
        return {str(k): __prompters_norm(x) for k, x in v.items()}
    return v

def __prompters_run(fn):
    results = []
    for t in __prompters_tests:
        if not callable(fn):
            results.append({"passed": False, "error": "Function ${functionName} is not defined"})
            continue
        try:
            actual = __prompters_norm(__prompters_loads(__prompters_dumps(__prompters_norm(fn(*__prompters_loads(__prompters_dumps(t["args"])))))))
            expected = __prompters_norm(t["expected"])
            results.append({"passed": __prompters_dumps(actual, sort_keys=True) == __prompters_dumps(expected, sort_keys=True), "actual": actual})
        except Exception as e:
            results.append({"passed": False, "error": str(e) or type(e).__name__})
    __prompters_sys.stdout.flush()
    __prompters_write("\\n" + __prompters_nonce + __prompters_dumps(results) + "\\n")

__prompters_run(globals().get("${functionName}"))
`;
  return { program, nonce };
}

export function parseHarnessResult(result: RunResult, nonce: string, tests: TestCase[]) {
  const lines = result.stdout.split("\n");
  const idx = lines.findIndex((l) => l.startsWith(nonce));
  const userOutput = (idx >= 0 ? lines.slice(0, idx) : lines).join("\n").replace(/\n$/, "");
  let outcomes: TestOutcome[];
  if (idx < 0) {
    const reason = result.timedOut ? "Time limit exceeded" : "Your code crashed before tests could run";
    outcomes = tests.map((t) => ({ name: t.name, passed: false, hidden: !!t.hidden, error: reason }));
  } else {
    const raw = JSON.parse(lines[idx].slice(nonce.length)) as { passed: boolean; actual?: unknown; error?: string }[];
    outcomes = tests.map((t, i) => ({
      name: t.name,
      hidden: !!t.hidden,
      passed: !!raw[i]?.passed,
      actual: raw[i]?.actual,
      error: raw[i]?.error,
    }));
  }
  return { outcomes, userOutput, stderr: result.stderr, timedOut: result.timedOut };
}
