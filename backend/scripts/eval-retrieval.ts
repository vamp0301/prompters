/**
 * Retrieval evaluation: keyword vs semantic vs hybrid on real curriculum content.
 *
 *   DATABASE_URL=<a LOCAL db seeded with the curriculum> npx tsx scripts/eval-retrieval.ts
 *
 * Indexes published lessons with the configured embedding provider (EMBEDDINGS_PROVIDER, default
 * gemini via AI_API_KEY), then asks each question with no current topic and checks whether the
 * expected lesson appears. Metrics: Recall@3, Recall@5 and MRR over topics, plus latency.
 * Refuses to run against a non-local database: indexing writes rows.
 */
import "../src/config/load-env.js";
import { retrieveWithMode } from "../src/ai/answer.js";
import { embeddingProvider, EmbeddingError, setEmbeddingProvider } from "../src/ai/embeddings.js";
import { prisma } from "../src/lib/prisma.js";
import { indexPublishedContent, invalidateIndex, semanticSearch } from "../src/modules/learning/semantic.js";

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing to run: DATABASE_URL must point at a local database.");
  process.exit(1);
}

type Case = { q: string; lang: "en" | "hi" | "hinglish"; expect: string[]; paraphrase?: boolean };
/** expect: topic slugs any of which counts as a correct hit. paraphrase: few or no shared keywords. */
const CASES: Case[] = [
  { q: "What is JWT and how is it verified?", lang: "en", expect: ["jwt-authentication"] },
  { q: "Why does my API return 401 unauthorized after login?", lang: "en", expect: ["jwt-authentication", "http-methods-status"], paraphrase: true },
  { q: "How should I store user passwords safely?", lang: "en", expect: ["password-hashing"] },
  { q: "A user can open another user's order by changing the id in the URL — what is this bug?", lang: "en", expect: ["idor"], paraphrase: true },
  { q: "How do I speed up slow lookups on a big table?", lang: "en", expect: ["db-indexes"], paraphrase: true },
  { q: "How do hash maps give O(1) lookups?", lang: "en", expect: ["hashing"] },
  { q: "How do I keep frequently read data in memory to avoid hitting the database?", lang: "en", expect: ["redis-caching"], paraphrase: true },
  { q: "What runs first: setTimeout callback or a resolved promise?", lang: "en", expect: ["js-event-loop", "js-promises"], paraphrase: true },
  { q: "How do I wait for an API call without blocking in JavaScript?", lang: "en", expect: ["js-async-await", "js-promises"], paraphrase: true },
  { q: "A function that remembers variables from where it was created", lang: "en", expect: ["js-closures"], paraphrase: true },
  { q: "How fast is my algorithm as the input grows?", lang: "en", expect: ["big-o"], paraphrase: true },
  { q: "Find a value in a sorted array quickly", lang: "en", expect: ["binary-search"], paraphrase: true },
  { q: "Longest substring without repeating characters technique", lang: "en", expect: ["sliding-window"], paraphrase: true },
  { q: "A function calling itself until a base case", lang: "en", expect: ["recursion"], paraphrase: true },
  { q: "Which HTTP status code for a created resource?", lang: "en", expect: ["http-methods-status"] },
  { q: "How should I name the URLs of my API endpoints?", lang: "en", expect: ["rest-api-design"], paraphrase: true },
  { q: "Code that runs between the request and my route handler in Express", lang: "en", expect: ["express-middleware"], paraphrase: true },
  { q: "Never trust data coming from the client — how do I check it?", lang: "en", expect: ["input-validation"], paraphrase: true },
  { q: "How does a domain name turn into a server address?", lang: "en", expect: ["ip-ports-dns"], paraphrase: true },
  { q: "Undo my last commit and see history", lang: "en", expect: ["git-basics"], paraphrase: true },
  { q: "Difference between a compiler and an interpreter", lang: "en", expect: ["how-code-runs"] },
  { q: "How do I read and write JSON?", lang: "en", expect: ["json-basics"] },
  { q: "JOIN two tables and filter rows", lang: "en", expect: ["sql-basics"], paraphrase: true },
  { q: "Python mein dictionary aur set ka kya fark hai?", lang: "hinglish", expect: ["py-sets-dicts"] },
  { q: "Login ke baad bhi API 401 kyun de rahi hai?", lang: "hinglish", expect: ["jwt-authentication", "http-methods-status"], paraphrase: true },
  { q: "Password ko database mein kaise safely save karein?", lang: "hinglish", expect: ["password-hashing"] },
  { q: "Badi table par query slow hai, kaise fast karein?", lang: "hinglish", expect: ["db-indexes"], paraphrase: true },
  { q: "Ek user dusre user ka data id badal ke dekh pa raha hai, ye kya bug hai?", lang: "hinglish", expect: ["idor"], paraphrase: true },
  { q: "Promise aur async await mein kya fark hai?", lang: "hinglish", expect: ["js-async-await", "js-promises"] },
  { q: "Sorted list mein jaldi se element kaise dhundhein?", lang: "hinglish", expect: ["binary-search"], paraphrase: true },
  { q: "Same data baar baar DB se laana padta hai, isse kaise bachein?", lang: "hinglish", expect: ["redis-caching"], paraphrase: true },
  { q: "Python mein loop kaise likhte hain?", lang: "hinglish", expect: ["py-loops"] },
  { q: "Terminal mein folder kaise change karte hain?", lang: "hinglish", expect: ["terminal-basics", "files-and-paths"], paraphrase: true },
  { q: "JWT टोकन क्या होता है और यह कैसे काम करता है?", lang: "hi", expect: ["jwt-authentication"] },
  { q: "पासवर्ड को सुरक्षित तरीके से कैसे स्टोर करें?", lang: "hi", expect: ["password-hashing"], paraphrase: true },
  { q: "डेटाबेस में इंडेक्स क्या होता है?", lang: "hi", expect: ["db-indexes"], paraphrase: true },
  { q: "रिकर्शन क्या है? उदाहरण दीजिए", lang: "hi", expect: ["recursion"], paraphrase: true },
  { q: "कैशिंग से वेबसाइट तेज़ कैसे होती है?", lang: "hi", expect: ["redis-caching"], paraphrase: true },
  { q: "HTTP रिक्वेस्ट और रिस्पॉन्स में क्या होता है?", lang: "hi", expect: ["http-request-response"] },
  { q: "बाइनरी सर्च कैसे काम करता है?", lang: "hi", expect: ["binary-search"], paraphrase: true },
  { q: "कंप्यूटर में RAM और स्टोरेज में क्या अंतर है?", lang: "hi", expect: ["cpu-ram-storage"] },
  { q: "IP एड्रेस और पोर्ट क्या होते हैं?", lang: "hi", expect: ["ip-ports-dns"] },
];

const uniq = (xs: string[]) => [...new Set(xs)];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Free tier: 100 embedding requests/minute. Wait and retry instead of failing the run. */
async function withQuota<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof EmbeddingError && e.kind === "rate_limited") || attempt >= 6) throw e;
      await sleep(20_000);
    }
  }
}
type Result = { r3: number; r5: number; rr: number; ms: number };
const score = (ranked: string[], expect: string[], ms: number): Result => {
  const pos = ranked.findIndex((s) => expect.includes(s));
  return { r3: pos >= 0 && pos < 3 ? 1 : 0, r5: pos >= 0 && pos < 5 ? 1 : 0, rr: pos >= 0 ? 1 / (pos + 1) : 0, ms };
};

async function main() {
  const p = embeddingProvider();
  if (!p) throw new Error("No embedding provider configured (EMBEDDINGS_PROVIDER / AI_API_KEY).");
  const t0 = Date.now();
  // Run until everything is indexed (the indexer stops at a rate limit; the next pass resumes).
  let stats = await indexPublishedContent();
  for (let pass = 0; stats.stoppedEarly && pass < 10; pass++) {
    await sleep(60_000);
    stats = await indexPublishedContent();
  }
  console.log(`Index: ${JSON.stringify(stats)} in ${Math.round((Date.now() - t0) / 1000)}s (model ${p.model}, ${p.dimensions} dims)\n`);
  invalidateIndex();

  const methods = ["keyword", "semantic", "hybrid"] as const;
  const rows: Record<(typeof methods)[number], (Result & { lang: string; paraphrase: boolean })[]> = { keyword: [], semantic: [], hybrid: [] };
  const misses: string[] = [];
  for (const c of CASES) {
    // Embeds the question once (cached), so the hybrid run below reuses the same vector.
    await withQuota(() => semanticSearch(c.q, { k: 1 }));
    for (const m of methods) {
      const start = Date.now();
      let ranked: string[];
      if (m === "semantic") ranked = uniq((await withQuota(() => semanticSearch(c.q, { k: 10 }))).map((h) => h.slug));
      else {
        if (m === "keyword") setEmbeddingProvider(null);
        const { sources, mode } = await retrieveWithMode("", c.q, c.lang, 8);
        if (m === "keyword") setEmbeddingProvider(undefined);
        if (m === "hybrid" && mode !== "hybrid") misses.push(`hybrid fell back to keyword for: ${c.q}`);
        ranked = uniq(sources.map((s) => s.topicSlug));
      }
      const r = score(ranked, c.expect, Date.now() - start);
      rows[m].push({ ...r, lang: c.lang, paraphrase: !!c.paraphrase });
      if (m === "hybrid" && !r.r5) misses.push(`hybrid miss [${c.lang}] "${c.q}" → got ${ranked.slice(0, 5).join(", ") || "(nothing)"}`);
    }
  }

  const agg = (rs: Result[]) => ({ n: rs.length, "Recall@3": (rs.reduce((a, r) => a + r.r3, 0) / rs.length).toFixed(2), "Recall@5": (rs.reduce((a, r) => a + r.r5, 0) / rs.length).toFixed(2), MRR: (rs.reduce((a, r) => a + r.rr, 0) / rs.length).toFixed(2), "median ms": [...rs].sort((a, b) => a.ms - b.ms)[Math.floor(rs.length / 2)]?.ms ?? 0 });
  const table: Record<string, unknown> = {};
  for (const m of methods) {
    table[`${m} · all`] = agg(rows[m]);
    for (const lang of ["en", "hinglish", "hi"]) table[`${m} · ${lang}`] = agg(rows[m].filter((r) => r.lang === lang));
    table[`${m} · paraphrased`] = agg(rows[m].filter((r) => r.paraphrase));
  }
  console.table(table);
  if (misses.length) console.log(`\n${misses.join("\n")}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
