/**
 * Content integrity check (PRD: "every code sample is tested automatically").
 * Runs every runnable code sample in the seed content and validates quiz structure.
 * Exits non-zero on any failure — wired into CI.
 */
import "../src/config/load-env.js";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ProcessDriver } from "../src/sandbox/process-driver.js";
import { curriculum } from "../prisma/seed/content/curriculum.js";
import type { SeedTopicContent } from "../prisma/seed/content/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "../prisma/seed/content");
const SECTIONS = ["DEFINITION", "ANALOGY", "WHY", "USAGE", "INTERNALS", "CODE", "MISTAKES", "DEBUGGING", "TRADEOFFS", "REAL_PROJECT"];

const known = new Set(curriculum.flatMap((s) => s.modules.flatMap((m) => m.topics.map(([slug]) => slug))));
const driver = new ProcessDriver();
const failures: string[] = [];
let samples = 0;
let topics = 0;

for (const file of (await readdir(dir)).filter((f) => /^stage.*\.ts$/.test(f))) {
  const { topics: list } = (await import(pathToFileURL(path.join(dir, file)).href)) as { topics: SeedTopicContent[] };
  for (const t of list) {
    topics++;
    const where = `${file}:${t.slug}`;
    if (!known.has(t.slug)) failures.push(`${where} — slug not in curriculum`);
    for (const p of t.prerequisites) if (!known.has(p)) failures.push(`${where} — unknown prerequisite ${p}`);
    const types = t.sections.map((s) => s.type);
    if (types.join() !== SECTIONS.join()) failures.push(`${where} — sections must be ${SECTIONS.join(", ")}`);
    for (const s of t.sections) {
      if (!s.content.hinglish?.trim() || !s.content.en?.trim()) failures.push(`${where} — ${s.type} missing hinglish/en`);
      for (const [language, code] of [["javascript", s.codeJs], ["python", s.codePython]] as const) {
        if (!code) continue;
        samples++;
        const r = await driver.run({ language, code, timeoutMs: 5000 });
        if (r.exitCode !== 0 || r.timedOut) failures.push(`${where} — ${s.type} ${language} sample failed: ${(r.timedOut ? "timeout" : r.stderr).slice(0, 300)}`);
      }
    }
    t.questions.forEach((q, i) => {
      const n = q.options?.length ?? 0;
      if (q.type === "EXPLAIN") {
        if (!q.keywords?.length) failures.push(`${where} q${i} — EXPLAIN needs keywords`);
      } else if (n < 2) failures.push(`${where} q${i} — needs options`);
      else if (q.type !== "ORDER_STEPS" && (!q.correct?.length || q.correct.some((c) => c < 0 || c >= n))) failures.push(`${where} q${i} — bad correct indices`);
    });
    if (t.questions.length < 5) failures.push(`${where} — fewer than 5 questions`);
    if (t.interview.length < 1) failures.push(`${where} — no interview questions`);
    if (t.buildTask) {
      if (t.buildTask.hints.length !== 3) failures.push(`${where} — build task needs 3 hints`);
      if (!t.buildTask.tests.some((x) => !x.hidden)) failures.push(`${where} — build task needs a visible test`);
    }
  }
}

console.log(`Checked ${topics} topics and ran ${samples} code samples.`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("All content checks passed.");
