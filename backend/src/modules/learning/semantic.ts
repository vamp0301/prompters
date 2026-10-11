import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { embeddingProvider, EmbeddingError, MAX_BATCH, type EmbeddingProvider } from "../../ai/embeddings.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import type { TopicSnapshot } from "./snapshot.js";

/**
 * Meaning-based lesson search.
 *
 * Index: one vector per section of each PUBLISHED topic version (never drafts). The worker re-embeds a
 * section only when its text, the model or the dimensions change (contentHash), and stops at the first
 * rate limit instead of hammering the quota — the next run continues where it stopped.
 *
 * Search: the query is embedded once and compared with every vector in memory (dot product of unit
 * vectors = cosine). Each hit is re-checked against the topic's CURRENT published version before use,
 * so an unpublished or re-published topic can never leak through a stale vector.
 */

type SnapSection = TopicSnapshot["sections"][number];

/** What is embedded for a section: title, section type, English text (else Hinglish), a little code. */
export function embedText(title: string, s: Pick<SnapSection, "type" | "content" | "codeJs" | "codePython">) {
  const c = (s.content ?? {}) as Record<string, string | undefined>;
  const text = (c.en ?? c.hinglish ?? c.hi ?? "").trim();
  const code = (s.codeJs ?? s.codePython ?? "").slice(0, 500);
  return [`${title} — ${s.type.toLowerCase()}`, text, code].filter(Boolean).join("\n").slice(0, 4000);
}

const hashOf = (p: EmbeddingProvider, text: string) => createHash("sha256").update(`${p.model}|${p.dimensions}|${text}`).digest("hex");

export interface IndexStats {
  sections: number;
  embedded: number;
  unchanged: number;
  removed: number;
  stoppedEarly: boolean;
}

/**
 * Gemini's free tier allows 100 embedding requests per minute (each text in a batch counts), so the
 * indexer sends 45 texts and waits 30 s between batches (~90/min). 420 sections ≈ 5 minutes, in the
 * background; anything left over is picked up by the next run.
 */
const DEFAULT_BATCH = 45;
const DEFAULT_PACE_MS = 30_000;

/** Brings the index in line with published content. Safe to run repeatedly; cheap when nothing changed. */
export async function indexPublishedContent(opts: { batchSize?: number; maxBatches?: number; paceMs?: number } = {}): Promise<IndexStats> {
  const p = embeddingProvider();
  const stats: IndexStats = { sections: 0, embedded: 0, unchanged: 0, removed: 0, stoppedEarly: false };
  if (!p) return stats;
  const topics = await prisma.topic.findMany({ where: { status: "PUBLISHED", publishedVersion: { gt: 0 } }, select: { id: true, title: true, publishedVersion: true } });
  const versions = await prisma.topicVersion.findMany({ where: { OR: topics.map((t) => ({ topicId: t.id, version: t.publishedVersion })) }, select: { topicId: true, version: true, snapshot: true } });
  const existing = await prisma.contentEmbedding.findMany({ where: { model: p.model }, select: { id: true, topicId: true, section: true, contentHash: true, version: true } });
  const have = new Map(existing.map((e) => [`${e.topicId}|${e.section}`, e]));
  const wanted = new Set<string>();
  const todo: { topicId: string; version: number; section: string; text: string; title: string; hash: string }[] = [];
  for (const v of versions) {
    const snap = v.snapshot as unknown as TopicSnapshot;
    for (const s of snap?.sections ?? []) {
      const key = `${v.topicId}|${s.type}`;
      wanted.add(key);
      stats.sections++;
      const text = embedText(snap.title, s);
      const hash = hashOf(p, text);
      const row = have.get(key);
      if (row && row.contentHash === hash) {
        stats.unchanged++;
        // Same text under a new version number: just move the pointer, no embedding call.
        if (row.version !== v.version) await prisma.contentEmbedding.update({ where: { id: row.id }, data: { version: v.version } });
      } else todo.push({ topicId: v.topicId, version: v.version, section: s.type, text, title: snap.title, hash });
    }
  }
  // Unpublished topics and removed sections leave the index.
  const stale = existing.filter((e) => !wanted.has(`${e.topicId}|${e.section}`)).map((e) => e.id);
  if (stale.length) stats.removed = (await prisma.contentEmbedding.deleteMany({ where: { id: { in: stale } } })).count;

  const size = Math.min(opts.batchSize ?? DEFAULT_BATCH, MAX_BATCH);
  const maxBatches = opts.maxBatches ?? Infinity;
  const pace = opts.paceMs ?? DEFAULT_PACE_MS;
  for (let i = 0, n = 0; i < todo.length && n < maxBatches; i += size, n++) {
    if (n > 0 && pace > 0) await new Promise((r) => setTimeout(r, pace));
    const batch = todo.slice(i, i + size);
    let vectors: number[][];
    try {
      vectors = await p.embedDocuments(batch.map((b) => ({ text: b.text, title: b.title })));
    } catch (e) {
      stats.stoppedEarly = true;
      logger.warn({ err: e instanceof Error ? e.message : e, kind: e instanceof EmbeddingError ? e.kind : "unknown", embedded: stats.embedded, remaining: todo.length - i }, "Embedding index run stopped early");
      break;
    }
    await prisma.$transaction(
      batch.map((b, j) =>
        prisma.contentEmbedding.upsert({
          where: { topicId_section_model: { topicId: b.topicId, section: b.section, model: p.model } },
          update: { version: b.version, contentHash: b.hash, dimensions: p.dimensions, vector: vectors[j] },
          create: { topicId: b.topicId, version: b.version, section: b.section, contentHash: b.hash, model: p.model, dimensions: p.dimensions, vector: vectors[j] },
        }),
      ),
    );
    stats.embedded += batch.length;
  }
  if (todo.length > stats.embedded && !stats.stoppedEarly) stats.stoppedEarly = true;
  if (stats.embedded || stats.removed) invalidateIndex();
  return stats;
}

// ───────────── in-memory index ─────────────

type Row = { topicId: string; version: number; section: string; vector: Float32Array };
let cache: { model: string; rows: Row[]; loadedAt: number } | null = null;
const CACHE_MS = 60_000;

export function invalidateIndex() {
  cache = null;
}

async function loadIndex(p: EmbeddingProvider) {
  if (cache && cache.model === p.model && Date.now() - cache.loadedAt < CACHE_MS) return cache.rows;
  const rows = await prisma.contentEmbedding.findMany({ where: { model: p.model, dimensions: p.dimensions }, select: { topicId: true, version: true, section: true, vector: true } });
  cache = { model: p.model, loadedAt: Date.now(), rows: rows.map((r) => ({ ...r, vector: Float32Array.from(r.vector) })) };
  return cache.rows;
}

const dot = (a: number[], b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < b.length; i++) s += a[i] * b[i];
  return s;
};

export type SemanticHit = { slug: string; title: string; section: SnapSection; score: number };

/** Repeated questions reuse their vector for an hour: saves quota (100 requests/minute on the free tier). */
const queryCache = new Map<string, { v: number[]; at: number }>();
const QUERY_TTL_MS = 60 * 60_000;
const QUERY_CACHE_MAX = 500;
async function queryVector(p: EmbeddingProvider, query: string) {
  const key = `${p.model}|${query.trim().toLowerCase()}`;
  const hit = queryCache.get(key);
  if (hit && Date.now() - hit.at < QUERY_TTL_MS) return hit.v;
  const v = await p.embedQuery(query);
  if (queryCache.size >= QUERY_CACHE_MAX) queryCache.delete(queryCache.keys().next().value!);
  queryCache.set(key, { v, at: Date.now() });
  return v;
}

/**
 * Top sections by meaning (excluding `excludeTopicId`), each verified against the topic's current
 * published version. Throws EmbeddingError when the provider fails — callers fall back to keywords.
 */
export async function semanticSearch(query: string, opts: { k?: number; excludeTopicId?: string; minScore?: number } = {}): Promise<SemanticHit[]> {
  const p = embeddingProvider();
  if (!p) return [];
  const rows = await loadIndex(p);
  if (!rows.length) return [];
  const q = await queryVector(p, query);
  const k = opts.k ?? 8;
  const scored = rows
    .filter((r) => r.topicId !== opts.excludeTopicId)
    .map((r) => ({ r, score: dot(q, r.vector) }))
    .filter((x) => x.score >= (opts.minScore ?? 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, k * 2);
  if (!scored.length) return [];
  const topicIds = [...new Set(scored.map((x) => x.r.topicId))];
  const topics = await prisma.topic.findMany({ where: { id: { in: topicIds }, status: "PUBLISHED" }, select: { id: true, publishedVersion: true } });
  const live = new Map(topics.map((t) => [t.id, t.publishedVersion]));
  const versions = await prisma.topicVersion.findMany({ where: { OR: topics.map((t) => ({ topicId: t.id, version: t.publishedVersion })) }, select: { topicId: true, snapshot: true } });
  const snaps = new Map(versions.map((v) => [v.topicId, v.snapshot as unknown as TopicSnapshot]));
  const hits: SemanticHit[] = [];
  for (const { r, score } of scored) {
    if (live.get(r.topicId) !== r.version) continue; // unpublished, or republished since indexing
    const snap = snaps.get(r.topicId);
    const section = snap?.sections.find((s) => s.type === r.section);
    if (snap && section) hits.push({ slug: snap.slug, title: snap.title, section, score });
    if (hits.length >= k) break;
  }
  return hits;
}

/** Retrieval mode actually used for an answer — reported in the answer's verification. */
export type RetrievalMode = "hybrid" | "keyword";

/** For admin/diagnostics: how much of the published content is indexed. */
export async function indexCoverage() {
  const p = embeddingProvider();
  const [published, indexed] = await Promise.all([
    prisma.topic.count({ where: { status: "PUBLISHED", publishedVersion: { gt: 0 } } }),
    p ? prisma.contentEmbedding.groupBy({ by: ["topicId"], where: { model: p.model } }).then((g) => g.length) : Promise.resolve(0),
  ]);
  return { provider: p?.name ?? "none", model: p?.model ?? null, publishedTopics: published, indexedTopics: indexed } as const satisfies Record<string, Prisma.JsonValue>;
}
