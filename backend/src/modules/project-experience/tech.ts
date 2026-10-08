import { canonicalSkill, normalize } from "../prep/text.js";

/**
 * Known technologies: their category (to fill the Project Facts panel and group decisions) and a fair
 * default alternative to compare against ("why this, not that"). Also the list the validator uses to
 * spot a technology the project doesn't actually use. Categories, not rankings — no technology here
 * is "better", only better suited to some requirements.
 */

export type TechCategory = "frontend" | "backend" | "language" | "database" | "cache" | "ai" | "queue" | "cloud" | "storage" | "auth" | "realtime" | "testing" | "devops" | "search" | "orm" | "styling" | "payments" | "messaging";

interface Tech {
  name: string;
  category: TechCategory;
  aliases?: string[];
  /** Keys of the alternatives worth comparing against. */
  alternatives: string[];
}

const T: Record<string, Tech> = {
  // frontend
  react: { name: "React", category: "frontend", alternatives: ["vue", "angular"] },
  nextjs: { name: "Next.js", category: "frontend", aliases: ["next"], alternatives: ["react vite", "remix"] },
  "react vite": { name: "React + Vite", category: "frontend", aliases: ["vite"], alternatives: ["nextjs"] },
  vue: { name: "Vue", category: "frontend", aliases: ["vuejs", "nuxt"], alternatives: ["react"] },
  angular: { name: "Angular", category: "frontend", alternatives: ["react"] },
  remix: { name: "Remix", category: "frontend", alternatives: ["nextjs"] },
  "react native": { name: "React Native", category: "frontend", alternatives: ["flutter"] },
  flutter: { name: "Flutter", category: "frontend", alternatives: ["react native"] },
  redux: { name: "Redux", category: "frontend", aliases: ["redux toolkit"], alternatives: ["zustand", "react query"] },
  zustand: { name: "Zustand", category: "frontend", alternatives: ["redux"] },
  "react query": { name: "TanStack Query", category: "frontend", aliases: ["tanstack query"], alternatives: ["redux"] },
  tailwind: { name: "Tailwind CSS", category: "styling", aliases: ["tailwind css", "tailwindcss"], alternatives: ["css modules"] },
  "css modules": { name: "CSS Modules", category: "styling", alternatives: ["tailwind"] },
  // backend & languages
  nodejs: { name: "Node.js", category: "backend", aliases: ["node"], alternatives: ["spring boot", "fastapi"] },
  expressjs: { name: "Express", category: "backend", aliases: ["express"], alternatives: ["nestjs", "fastify"] },
  nestjs: { name: "NestJS", category: "backend", alternatives: ["expressjs"] },
  fastify: { name: "Fastify", category: "backend", alternatives: ["expressjs"] },
  "spring boot": { name: "Spring Boot", category: "backend", aliases: ["spring"], alternatives: ["nodejs"] },
  fastapi: { name: "FastAPI", category: "backend", alternatives: ["django", "expressjs"] },
  django: { name: "Django", category: "backend", alternatives: ["fastapi"] },
  flask: { name: "Flask", category: "backend", alternatives: ["fastapi"] },
  typescript: { name: "TypeScript", category: "language", alternatives: ["javascript"] },
  javascript: { name: "JavaScript", category: "language", alternatives: ["typescript"] },
  python: { name: "Python", category: "language", alternatives: ["javascript"] },
  java: { name: "Java", category: "language", alternatives: ["python"] },
  go: { name: "Go", category: "language", aliases: ["golang"], alternatives: ["nodejs"] },
  "c++": { name: "C++", category: "language", aliases: ["cpp"], alternatives: ["java"] },
  graphql: { name: "GraphQL", category: "backend", alternatives: ["rest"] },
  rest: { name: "REST APIs", category: "backend", aliases: ["rest api", "rest apis", "restful"], alternatives: ["graphql"] },
  trpc: { name: "tRPC", category: "backend", alternatives: ["rest"] },
  zod: { name: "Zod", category: "backend", alternatives: ["joi"] },
  joi: { name: "Joi", category: "backend", alternatives: ["zod"] },
  // data
  mongodb: { name: "MongoDB", category: "database", aliases: ["mongo"], alternatives: ["postgresql"] },
  postgresql: { name: "PostgreSQL", category: "database", aliases: ["postgres", "neon", "supabase"], alternatives: ["mongodb", "mysql"] },
  mysql: { name: "MySQL", category: "database", alternatives: ["postgresql"] },
  sqlite: { name: "SQLite", category: "database", alternatives: ["postgresql"] },
  firebase: { name: "Firebase", category: "database", aliases: ["firestore"], alternatives: ["postgresql", "mongodb"] },
  dynamodb: { name: "DynamoDB", category: "database", alternatives: ["mongodb"] },
  redis: { name: "Redis", category: "cache", aliases: ["upstash"], alternatives: ["in memory cache", "memcached"] },
  "in memory cache": { name: "In-memory cache", category: "cache", alternatives: ["redis"] },
  memcached: { name: "Memcached", category: "cache", alternatives: ["redis"] },
  prisma: { name: "Prisma", category: "orm", alternatives: ["drizzle", "raw sql"] },
  drizzle: { name: "Drizzle", category: "orm", alternatives: ["prisma"] },
  mongoose: { name: "Mongoose", category: "orm", alternatives: ["mongodb driver"] },
  "mongodb driver": { name: "MongoDB driver", category: "orm", alternatives: ["mongoose"] },
  "raw sql": { name: "Raw SQL", category: "orm", alternatives: ["prisma"] },
  elasticsearch: { name: "Elasticsearch", category: "search", alternatives: ["postgresql full text"] },
  "postgresql full text": { name: "PostgreSQL full-text search", category: "search", alternatives: ["elasticsearch"] },
  qdrant: { name: "Qdrant", category: "search", alternatives: ["pgvector", "pinecone"] },
  pgvector: { name: "pgvector", category: "search", alternatives: ["qdrant"] },
  pinecone: { name: "Pinecone", category: "search", alternatives: ["qdrant", "pgvector"] },
  // async & realtime
  bullmq: { name: "BullMQ", category: "queue", aliases: ["bull"], alternatives: ["rabbitmq", "cron"] },
  rabbitmq: { name: "RabbitMQ", category: "queue", alternatives: ["kafka", "bullmq"] },
  kafka: { name: "Kafka", category: "queue", alternatives: ["rabbitmq"] },
  cron: { name: "Cron jobs", category: "queue", aliases: ["node cron"], alternatives: ["bullmq"] },
  qstash: { name: "QStash", category: "queue", aliases: ["upstash qstash"], alternatives: ["bullmq"] },
  websockets: { name: "WebSockets", category: "realtime", aliases: ["websocket", "ws"], alternatives: ["sse", "polling"] },
  "socketio": { name: "Socket.IO", category: "realtime", aliases: ["socket io", "socket.io"], alternatives: ["websockets", "sse"] },
  sse: { name: "Server-Sent Events", category: "realtime", aliases: ["server sent events"], alternatives: ["websockets"] },
  polling: { name: "Polling", category: "realtime", alternatives: ["websockets"] },
  // AI
  gemini: { name: "Gemini", category: "ai", aliases: ["google gemini", "gemini api"], alternatives: ["openai", "ollama"] },
  openai: { name: "OpenAI API", category: "ai", aliases: ["gpt", "chatgpt", "gpt 4", "gpt4"], alternatives: ["gemini", "ollama"] },
  claude: { name: "Claude API", category: "ai", aliases: ["anthropic"], alternatives: ["openai", "gemini"] },
  ollama: { name: "Ollama", category: "ai", alternatives: ["gemini", "openai"] },
  groq: { name: "Groq", category: "ai", aliases: ["groq api"], alternatives: ["openai", "ollama"] },
  "hugging face": { name: "Hugging Face", category: "ai", aliases: ["huggingface", "transformers"], alternatives: ["openai"] },
  langchain: { name: "LangChain", category: "ai", alternatives: ["direct sdk"] },
  "direct sdk": { name: "Direct provider SDK", category: "ai", alternatives: ["langchain"] },
  rag: { name: "RAG", category: "ai", aliases: ["retrieval augmented generation"], alternatives: ["fine tuning"] },
  "fine tuning": { name: "Fine-tuning", category: "ai", alternatives: ["rag"] },
  // auth & infra
  jwt: { name: "JWT", category: "auth", aliases: ["json web token"], alternatives: ["server sessions"] },
  "server sessions": { name: "Server-side sessions", category: "auth", alternatives: ["jwt"] },
  oauth: { name: "OAuth", category: "auth", aliases: ["google oauth", "oauth2"], alternatives: ["jwt"] },
  nextauth: { name: "NextAuth / Auth.js", category: "auth", aliases: ["next auth", "authjs"], alternatives: ["clerk", "jwt"] },
  clerk: { name: "Clerk", category: "auth", alternatives: ["nextauth"] },
  docker: { name: "Docker", category: "devops", alternatives: ["bare vm"] },
  "bare vm": { name: "Bare VM deployment", category: "devops", alternatives: ["docker"] },
  kubernetes: { name: "Kubernetes", category: "devops", aliases: ["k8s"], alternatives: ["docker"] },
  pm2: { name: "PM2", category: "devops", alternatives: ["docker", "systemd"] },
  systemd: { name: "systemd", category: "devops", alternatives: ["pm2"] },
  nginx: { name: "Nginx", category: "devops", alternatives: ["caddy"] },
  caddy: { name: "Caddy", category: "devops", alternatives: ["nginx"] },
  "github actions": { name: "GitHub Actions", category: "devops", aliases: ["ci cd", "ci/cd"], alternatives: ["jenkins"] },
  jenkins: { name: "Jenkins", category: "devops", alternatives: ["github actions"] },
  aws: { name: "AWS", category: "cloud", aliases: ["ec2", "aws ec2", "lambda", "aws lambda"], alternatives: ["gcp", "vercel"] },
  gcp: { name: "Google Cloud", category: "cloud", aliases: ["google cloud"], alternatives: ["aws"] },
  azure: { name: "Azure", category: "cloud", alternatives: ["aws"] },
  vercel: { name: "Vercel", category: "cloud", alternatives: ["aws", "render"] },
  render: { name: "Render", category: "cloud", alternatives: ["vercel", "aws"] },
  s3: { name: "Amazon S3", category: "storage", aliases: ["aws s3"], alternatives: ["cloudflare r2"] },
  "cloudflare r2": { name: "Cloudflare R2", category: "storage", aliases: ["r2"], alternatives: ["s3"] },
  cloudinary: { name: "Cloudinary", category: "storage", alternatives: ["s3"] },
  stripe: { name: "Stripe", category: "payments", alternatives: ["razorpay"] },
  razorpay: { name: "Razorpay", category: "payments", alternatives: ["stripe"] },
  "whatsapp cloud api": { name: "WhatsApp Cloud API", category: "messaging", aliases: ["meta whatsapp", "whatsapp api", "meta cloud api"], alternatives: ["twilio"] },
  twilio: { name: "Twilio", category: "messaging", alternatives: ["whatsapp cloud api"] },
  jest: { name: "Jest", category: "testing", alternatives: ["vitest"] },
  vitest: { name: "Vitest", category: "testing", alternatives: ["jest"] },
  playwright: { name: "Playwright", category: "testing", alternatives: ["cypress"] },
  cypress: { name: "Cypress", category: "testing", alternatives: ["playwright"] },
};

const ALIAS = new Map<string, string>();
const plain = (s: string) => normalize(s.replace(/\.js\b/gi, "js"));
for (const [key, t] of Object.entries(T)) {
  for (const n of [key, t.name, ...(t.aliases ?? [])]) {
    ALIAS.set(canonicalSkill(n), key);
    ALIAS.set(plain(n), key);
  }
}

/** The dictionary key for a technology name ("Node.js" → nodejs), or null if unknown. */
export function techKey(name: string): string | null {
  const c = canonicalSkill(name);
  const exact = ALIAS.get(c) ?? ALIAS.get(plain(name)) ?? ALIAS.get(c.replace(/\s+/g, ""));
  if (exact) return exact;
  // "Gemini 1.5 Flash", "MongoDB Atlas": the longest known name the text starts with.
  const p = plain(name);
  const prefix = [...ALIAS.keys()].filter((a) => a.length >= 3 && (p === a || p.startsWith(`${a} `))).sort((a, b) => b.length - a.length)[0];
  return prefix ? ALIAS.get(prefix)! : null;
}
export const techInfo = (key: string) => T[key] ?? null;
export const alternativesFor = (name: string) => {
  const k = techKey(name);
  return k ? T[k].alternatives.map((a) => T[a]?.name ?? a) : [];
};
export const categoryOf = (name: string): TechCategory | null => {
  const k = techKey(name);
  return k ? T[k].category : null;
};

/** Every alias the validator can recognise in free text, longest first so "react native" beats "react". */
const MATCHERS = [...ALIAS.keys()]
  .filter((a) => a.length >= 3 && !["rest", "rag", "ws", "go", "next", "node", "bull", "lambda", "spring", "cron", "polling", "vite", "anthropic"].includes(a))
  .sort((a, b) => b.length - a.length)
  .map((a) => ({ key: ALIAS.get(a)!, re: new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s.-]*")}($|[^a-z0-9])`, "i") }));

/** Known technologies mentioned in a piece of text (dictionary keys). */
export function techsMentioned(text: string): Set<string> {
  const found = new Set<string>();
  // Longest names first, and each match is blanked out: "React Native" doesn't also count as "React".
  let t = plain(text);
  for (const m of MATCHERS) {
    const g = new RegExp(m.re.source, "gi");
    if (g.test(t)) {
      found.add(m.key);
      t = t.replace(new RegExp(m.re.source, "gi"), "$1 $2");
    }
  }
  return found;
}

export const AI_KEYS = new Set(Object.entries(T).filter(([, t]) => t.category === "ai").map(([k]) => k));
export const PROVIDER_KEYS = new Set(["gemini", "openai", "claude", "ollama", "hugging face"]);
