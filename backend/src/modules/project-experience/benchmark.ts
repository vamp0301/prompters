import { Gemini, OpenAICompatible, type AIProvider, type CompleteOptions } from "../../ai/provider.js";
import type { ProjectContext } from "./content.js";
import type { ProjectContent } from "./project.service.js";
import { evidenceText, foreignTechs, projectTechKeys, unverifiedMetrics } from "./validate.js";
import { techKey } from "./tech.js";

/**
 * Model benchmark for project modules: the same resume + facts through each model, measured by the
 * same validator. Everything here is countable (time, calls, retries, fixes, rule violations,
 * missing sections). Question QUALITY is not scored — read the saved samples for that.
 */

/** "gemini:gemini-flash-latest", "openai:gpt-4.1-mini", "openrouter:<model>", "ollama:llama3.1". */
export function providerFor(spec: string, keys: Record<string, string | undefined>): AIProvider {
  const i = spec.indexOf(":");
  const [kind, model] = i > 0 ? [spec.slice(0, i), spec.slice(i + 1)] : [spec, ""];
  if (!model) throw new Error(`Model missing in "${spec}" (expected provider:model)`);
  const need = (k: string) => {
    const v = keys[k];
    if (!v) throw new Error(`${spec} needs ${k} in the environment`);
    return v;
  };
  // One model, no fallbacks: every result is attributable to exactly the model named.
  if (kind === "gemini") return new Gemini("https://generativelanguage.googleapis.com/v1beta", [model], need("AI_API_KEY"));
  if (kind === "openai") return new OpenAICompatible("openai", "https://api.openai.com/v1", model, need("OPENAI_API_KEY"));
  if (kind === "openrouter") return new OpenAICompatible("openrouter", "https://openrouter.ai/api/v1", model, need("OPENROUTER_API_KEY"));
  if (kind === "ollama") return new OpenAICompatible("ollama", keys.OLLAMA_BASE_URL ?? "http://localhost:11434/v1", model);
  throw new Error(`Unknown provider "${kind}" (gemini | openai | openrouter | ollama)`);
}

/** Counts calls so retries are measured, not guessed. */
export class CountingProvider implements AIProvider {
  calls = 0;
  constructor(private inner: AIProvider) {}
  get name() {
    return this.inner.name;
  }
  complete(system: string, user: string, opts?: CompleteOptions) {
    this.calls++;
    return this.inner.complete(system, user, opts);
  }
}

/** Sections a complete module must have. */
export function missingSections(c: ProjectContent, ctx: ProjectContext): string[] {
  const s = c.story;
  const missing: [boolean, string][] = [
    [!s.pitches.sec30 || !s.pitches.sec60, "pitches"],
    [!s.architecture.diagram, "architecture diagram"],
    [!s.dataFlow.length, "data flow"],
    [!s.scaling.length, "scaling"],
    [!s.ifBuiltToday.length, "if built today"],
    [s.skillLadder.length < 5, "skill ladder L1–L5"],
    [!s.tradeoffs.length, "trade-offs"],
    [c.drillDown.length < 6, "drill-down"],
    [ctx.evidence.claims.length > 0 && !c.claimDefense.length, "claim defense"],
    [ctx.source !== "PROJECT" && c.experienceQuestions.length < 4, "experience questions"],
  ];
  return missing.filter(([m]) => m).map(([, name]) => name);
}

export interface BenchResult {
  model: string;
  project: string;
  ok: boolean;
  error?: string;
  seconds: number;
  calls: number;
  /** Calls beyond the 3 a clean build needs (one per part). */
  retries: number;
  autoFixes: number;
  levels: number[];
  /** Share of the project's technologies that got a decision card. */
  techCoverage: number;
  missing: string[];
  inventedNumbers: string[];
  unusedTechs: string[];
}

export function assess(model: string, project: string, ctx: ProjectContext, c: ProjectContent, seconds: number, calls: number): BenchResult {
  const ev = evidenceText(ctx);
  const s = c.story;
  const factual = [s.overview.whatBuilt.text, ...s.experience.map((e) => e.answer), s.pitches.sec30, s.pitches.sec60, ...s.pitches.min2, ...s.pitches.min5, s.performance.result.text, ...s.challenges.real.map((x) => x.text)].join("\n");
  const answers = c.questions.map((q) => `${q.answer} ${q.followUpAnswer} ${q.deepFollowUpAnswer}`).join("\n");
  const carded = new Set(c.technologies.map((t) => techKey(t.technology) ?? t.technology.toLowerCase()));
  const techs = ctx.technologies.map((t) => techKey(t) ?? t.toLowerCase());
  return {
    model,
    project,
    ok: true,
    seconds,
    calls,
    retries: Math.max(0, calls - 3),
    autoFixes: c.autoFixes.length,
    levels: [1, 2, 3, 4, 5].map((l) => c.questions.filter((q) => q.level === l).length),
    techCoverage: techs.length ? techs.filter((t) => carded.has(t)).length / techs.length : 1,
    missing: missingSections(c, ctx),
    inventedNumbers: [...unverifiedMetrics(factual, ev), ...unverifiedMetrics(answers, ev + "\n" + c.questions.map((q) => q.question).join("\n"))],
    unusedTechs: foreignTechs(factual, projectTechKeys(ctx)),
  };
}

export function summarizeBench(rows: BenchResult[]) {
  const models = [...new Set(rows.map((r) => r.model))];
  return models.map((model) => {
    const rs = rows.filter((r) => r.model === model);
    const ok = rs.filter((r) => r.ok);
    const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
    return {
      model,
      projects: rs.length,
      built: ok.length,
      failures: rs.length - ok.length,
      avgSeconds: avg(ok.map((r) => r.seconds)),
      calls: rs.reduce((a, r) => a + r.calls, 0),
      retries: rs.reduce((a, r) => a + r.retries, 0),
      autoFixes: ok.reduce((a, r) => a + r.autoFixes, 0),
      inventedNumbers: ok.reduce((a, r) => a + r.inventedNumbers.length, 0),
      unusedTechs: ok.reduce((a, r) => a + r.unusedTechs.length, 0),
      missingSections: ok.reduce((a, r) => a + r.missing.length, 0),
      techCoverage: avg(ok.map((r) => Math.round(r.techCoverage * 100))),
    };
  });
}
