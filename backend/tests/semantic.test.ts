import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { EMBEDDING_DIMENSIONS, EmbeddingError, GeminiEmbeddings, normalize, setEmbeddingProvider, type EmbeddingProvider } from "../src/ai/embeddings.js";
import { indexPublishedContent, invalidateIndex, semanticSearch } from "../src/modules/learning/semantic.js";
import { retrieveWithMode } from "../src/ai/answer.js";
import { prisma } from "../src/lib/prisma.js";

/**
 * Deterministic "meaning": words map to shared concept dimensions, so "unauthorized" and "JWT"
 * are close even though they share no keyword — exactly what keyword search can't do.
 */
const CONCEPTS: Record<string, number> = { unauthorized: 1, jwt: 1, token: 1, login: 1, auth: 1, "401": 1, hash: 2, hashing: 2, bcrypt: 2, password: 2, cache: 3, redis: 3, fast: 3 };
class FakeEmbeddings implements EmbeddingProvider {
  readonly name = "fake";
  readonly model = "fake-embed-1";
  readonly dimensions = EMBEDDING_DIMENSIONS;
  documentCalls = 0;
  failBatchesAfter = Infinity;
  failQueries = false;
  private vec(text: string) {
    const v = new Array(this.dimensions).fill(0);
    for (const w of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) v[CONCEPTS[w] ?? 0] += 1;
    v[0] += 0.01;
    return normalize(v);
  }
  async embedDocuments(texts: { text: string }[]) {
    if (this.documentCalls >= this.failBatchesAfter) throw new EmbeddingError("quota", "rate_limited", 429);
    this.documentCalls++;
    return texts.map((t) => this.vec(t.text));
  }
  async embedQuery(text: string) {
    if (this.failQueries) throw new EmbeddingError("down", "unavailable", 503);
    return this.vec(text);
  }
}

const fake = new FakeEmbeddings();
const ai = new FakeAI();

/** Rewrites one section of a topic's PUBLISHED snapshot (what learners see). */
async function setPublishedText(slug: string, sectionIdx: number, en: string) {
  const t = await prisma.topic.findUniqueOrThrow({ where: { slug } });
  const v = await prisma.topicVersion.findUniqueOrThrow({ where: { topicId_version: { topicId: t.id, version: t.publishedVersion } } });
  const snap = v.snapshot as { sections: { content: Record<string, string> }[] };
  snap.sections[sectionIdx].content = { en, hinglish: en };
  await prisma.topicVersion.update({ where: { id: v.id }, data: { snapshot: snap as object } });
}

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await setPublishedText("beta", 0, "Verify the JWT token in middleware before every protected route.");
  await setPublishedText("gamma", 0, "Use bcrypt to hash a password; never store it in plain text.");
  setEmbeddingProvider(fake);
  setAIProvider(ai);
});
afterAll(() => {
  setEmbeddingProvider(undefined);
  setAIProvider(undefined);
});
afterEach(() => {
  fake.failBatchesAfter = Infinity;
  fake.failQueries = false;
  invalidateIndex();
});

describe("lesson embedding index", () => {
  it("embeds every published section once, and nothing again while text is unchanged", async () => {
    const first = await indexPublishedContent({ paceMs: 0 });
    const published = await prisma.topic.count({ where: { status: "PUBLISHED" } });
    expect(first.embedded).toBe(first.sections);
    expect(first.sections).toBeGreaterThan(0);
    expect(new Set((await prisma.contentEmbedding.findMany({ select: { topicId: true } })).map((r) => r.topicId)).size).toBe(published);
    expect((await prisma.contentEmbedding.findFirstOrThrow()).vector).toHaveLength(EMBEDDING_DIMENSIONS);
    const calls = fake.documentCalls;
    const again = await indexPublishedContent({ paceMs: 0 });
    expect(again).toMatchObject({ embedded: 0, unchanged: first.sections, removed: 0 });
    expect(fake.documentCalls).toBe(calls);
  });

  it("re-embeds only the section whose published text changed", async () => {
    await indexPublishedContent({ paceMs: 0 });
    await setPublishedText("alpha", 1, "Cache hot reads in Redis so pages load fast.");
    const run = await indexPublishedContent({ paceMs: 0 });
    expect(run.embedded).toBe(1);
  });

  it("never indexes drafts, and drops a topic once it is unpublished", async () => {
    await indexPublishedContent({ paceMs: 0 });
    const alpha = await prisma.topic.findUniqueOrThrow({ where: { slug: "alpha" } });
    // A draft edit (TopicSection) is not what learners see — it must not be embedded.
    await prisma.topicSection.updateMany({ where: { topicId: alpha.id }, data: { content: { en: "SECRET DRAFT", hinglish: "SECRET DRAFT" } } });
    expect((await indexPublishedContent({ paceMs: 0 })).embedded).toBe(0);
    await prisma.topic.update({ where: { id: alpha.id }, data: { status: "DRAFT" } });
    const run = await indexPublishedContent({ paceMs: 0 });
    expect(run.removed).toBeGreaterThan(0);
    expect(await prisma.contentEmbedding.count({ where: { topicId: alpha.id } })).toBe(0);
    await prisma.topic.update({ where: { id: alpha.id }, data: { status: "PUBLISHED" } });
  });

  it("stops at a rate limit without losing finished batches, and resumes next run", async () => {
    await prisma.contentEmbedding.deleteMany();
    fake.failBatchesAfter = fake.documentCalls + 1; // first batch OK, second rate-limited
    const partial = await indexPublishedContent({ batchSize: 5, paceMs: 0 });
    expect(partial.stoppedEarly).toBe(true);
    expect(partial.embedded).toBe(5);
    fake.failBatchesAfter = Infinity;
    const rest = await indexPublishedContent({ batchSize: 5, paceMs: 0 });
    expect(rest.embedded).toBe(partial.sections - 5);
    expect(rest.stoppedEarly).toBe(false);
  });
});

describe("semantic retrieval", () => {
  it("reuses a repeated question's vector instead of calling the provider again", async () => {
    await indexPublishedContent({ paceMs: 0 });
    const spy = vi.spyOn(fake, "embedQuery");
    await semanticSearch("how do I hash a password safely", { k: 3 });
    await semanticSearch("How do I hash a password safely ", { k: 3 });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("finds a lesson by meaning when no keyword matches, and keyword search alone would miss it", async () => {
    await indexPublishedContent({ paceMs: 0 });
    const alpha = await prisma.topic.findUniqueOrThrow({ where: { slug: "alpha" } });
    const q = "why does my api say unauthorized 401";
    const hits = await semanticSearch(q, { k: 3, excludeTopicId: alpha.id });
    expect(hits[0]).toMatchObject({ slug: "beta" });
    const { sources, mode } = await retrieveWithMode(alpha.id, q, "en");
    expect(mode).toBe("hybrid");
    expect(sources.some((s) => s.topicSlug === "beta" && /JWT/.test(s.text))).toBe(true);
    // Embeddings off → keyword only, and the keyword path can't find it.
    setEmbeddingProvider(null);
    const kw = await retrieveWithMode(alpha.id, q, "en");
    setEmbeddingProvider(fake);
    expect(kw.mode).toBe("keyword");
    expect(kw.sources.some((s) => s.topicSlug === "beta")).toBe(false);
  });

  it("falls back to keyword search when the embedding service fails", async () => {
    await indexPublishedContent({ paceMs: 0 });
    fake.failQueries = true;
    const alpha = await prisma.topic.findUniqueOrThrow({ where: { slug: "alpha" } });
    const { sources, mode } = await retrieveWithMode(alpha.id, "beta definition", "en");
    expect(mode).toBe("keyword");
    expect(sources.length).toBeGreaterThan(0);
  });

  it("never returns a topic unpublished after indexing (stale vector)", async () => {
    await indexPublishedContent({ paceMs: 0 });
    const beta = await prisma.topic.findUniqueOrThrow({ where: { slug: "beta" } });
    await prisma.topic.update({ where: { id: beta.id }, data: { status: "DRAFT" } });
    invalidateIndex();
    const hits = await semanticSearch("unauthorized jwt token", { k: 5 });
    await prisma.topic.update({ where: { id: beta.id }, data: { status: "PUBLISHED" } });
    expect(hits.some((h) => h.slug === "beta")).toBe(false);
  });

  it("reports the retrieval mode in tutor answers", async () => {
    await prisma.featureFlag.upsert({ where: { key: "AI_TUTOR" }, update: { enabled: true }, create: { key: "AI_TUTOR", description: "", enabled: true } });
    await indexPublishedContent({ paceMs: 0 });
    const { agent } = await login();
    const res = await agent.post("/api/ai/explain").send({ topicSlug: "alpha", question: "why does my api say unauthorized" });
    expect(res.status).toBe(200);
    expect(res.body.data.verification.retrieval).toBe("hybrid");
  });
});

describe("Gemini embedding client", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  afterEach(() => vi.unstubAllGlobals());

  it("asks for 768 dimensions with the right task type, and returns unit vectors", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return url.includes("batchEmbedContents") ? ok({ embeddings: [{ values: new Array(768).fill(2) }, { values: new Array(768).fill(-1) }] }) : ok({ embedding: { values: new Array(768).fill(3) } });
    }));
    const g = new GeminiEmbeddings("k");
    const docs = await g.embedDocuments([{ text: "a", title: "A" }, { text: "b" }]);
    expect(docs).toHaveLength(2);
    expect(Math.hypot(...docs[0])).toBeCloseTo(1, 6);
    expect(calls[0].url).toContain("gemini-embedding-001:batchEmbedContents");
    expect((calls[0].body.requests as { taskType: string; outputDimensionality: number }[])[0]).toMatchObject({ taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 });
    const q = await g.embedQuery("why 401?");
    expect(Math.hypot(...q)).toBeCloseTo(1, 6);
    expect(calls[1].body).toMatchObject({ taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 });
  });

  it("rejects wrong dimensions and reports rate limits and outages distinctly", async () => {
    const g = new GeminiEmbeddings("k");
    vi.stubGlobal("fetch", vi.fn(async () => ok({ embedding: { values: [1, 2, 3] } })));
    await expect(g.embedQuery("x")).rejects.toMatchObject({ kind: "bad_response" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429 })));
    await expect(g.embedQuery("x")).rejects.toMatchObject({ kind: "rate_limited", status: 429 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
    await expect(g.embedQuery("x")).rejects.toMatchObject({ kind: "unavailable", status: 503 });
    vi.stubGlobal("fetch", vi.fn(async () => ok({ embeddings: [{ values: new Array(768).fill(1) }] })));
    await expect(g.embedDocuments([{ text: "a" }, { text: "b" }])).rejects.toMatchObject({ kind: "bad_response" });
  });
});
