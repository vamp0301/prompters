/**
 * Compare AI models on Project Experience modules — same projects, same validator, nothing saved.
 *
 *   npm run project:benchmark -- --user <userId> --models gemini:gemini-flash-latest,gemini:gemini-flash-lite-latest [--projects docrud|eduos] [--out bench.json]
 *
 * Providers: gemini (AI_API_KEY) · openai (OPENAI_API_KEY) · openrouter (OPENROUTER_API_KEY) · ollama (OLLAMA_BASE_URL, local).
 * Each project costs at least 3 calls per model: mind free-tier daily quotas.
 * Measures what can be counted. Question quality is NOT scored: compare the saved samples by reading them.
 */
import "../src/config/load-env.js";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { assess, CountingProvider, providerFor, summarizeBench, type BenchResult } from "../src/modules/project-experience/benchmark.js";
import { buildContent, contextOf, listProjects } from "../src/modules/project-experience/project.service.js";

const { values } = parseArgs({ options: { user: { type: "string" }, models: { type: "string" }, projects: { type: "string" }, out: { type: "string" } } });
if (!values.user || !values.models) {
  console.error("Usage: --user <userId> --models provider:model[,provider:model] [--projects regex] [--out file.json]");
  process.exit(1);
}
const list = await listProjects(values.user);
const projects = list.projects.filter((p) => !values.projects || new RegExp(values.projects, "i").test(p.name));
console.log(`${projects.length} project(s) × ${values.models.split(",").length} model(s) — nothing is saved.`);
const rows: BenchResult[] = [];
const samples: Record<string, unknown> = {};
for (const spec of values.models.split(",").map((m) => m.trim()).filter(Boolean)) {
  for (const p of projects) {
    const row = await prisma.projectExperience.findUniqueOrThrow({ where: { id: p.id } });
    const counter = new CountingProvider(providerFor(spec, process.env));
    setAIProvider(counter);
    const t0 = Date.now();
    try {
      const content = await buildContent(row);
      const r = assess(spec, p.name, contextOf(row), content, Math.round((Date.now() - t0) / 1000), counter.calls);
      rows.push(r);
      samples[`${spec} · ${p.name}`] = [1, 2, 3, 4, 5].map((l) => content.questions.find((q) => q.level === l)).map((q) => q && { level: q.level, question: q.question, answer: q.answer, followUp: q.followUp });
      console.log(`OK   ${spec} · ${p.name} · ${r.seconds}s · calls ${r.calls} · fixes ${r.autoFixes} · invented ${r.inventedNumbers.length} · unused tech ${r.unusedTechs.length} · missing [${r.missing.join(", ")}] · tech coverage ${Math.round(r.techCoverage * 100)}%`);
    } catch (e) {
      rows.push({ model: spec, project: p.name, ok: false, error: (e as Error).message, seconds: Math.round((Date.now() - t0) / 1000), calls: counter.calls, retries: Math.max(0, counter.calls - 3), autoFixes: 0, levels: [], techCoverage: 0, missing: [], inventedNumbers: [], unusedTechs: [] });
      console.log(`FAIL ${spec} · ${p.name} · ${(e as Error).message}`);
    }
  }
}
setAIProvider(undefined);
const summary = summarizeBench(rows);
console.table(summary);
if (values.out) writeFileSync(values.out, JSON.stringify({ ranAt: new Date().toISOString(), summary, rows, samples }, null, 2));
await prisma.$disconnect();
