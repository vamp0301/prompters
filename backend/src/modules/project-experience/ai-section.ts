import type { Diagram } from "../career/knowledge.schemas.js";
import { techInfo, techKey } from "./tech.js";

/**
 * The AI decision section, written by hand (not generated) so it can't invent benchmarks: general,
 * checkable engineering knowledge about hosted model APIs vs local runtimes, framed as "potential"
 * advantages and "when to choose". Shown only when the project actually lists an AI provider.
 */

const HOSTED = new Set(["gemini", "openai", "claude", "groq"]);

const OPTIONS = [
  {
    key: "gemini",
    option: "Gemini (Google)",
    type: "Hosted model API",
    potentialAdvantages: ["No model serving to run yourself", "Official SDKs and structured (JSON) output support", "Free tier available for prototyping (with daily limits)", "Long-context and multimodal models are offered"],
    costsAndRisks: ["Per-request cost and rate limits at scale", "Dependency on an external service (outages, quota)", "Prompts and data leave your servers"],
    chooseWhen: "You want to ship quickly without running model infrastructure, and the data may be sent to a hosted provider.",
  },
  {
    key: "openai",
    option: "OpenAI API",
    type: "Hosted model API",
    potentialAdvantages: ["No model serving to run yourself", "Mature SDKs, structured output and tool calling", "Wide ecosystem and examples"],
    costsAndRisks: ["Per-request cost and rate limits", "External dependency", "Prompts and data leave your servers"],
    chooseWhen: "Its models measure better on YOUR task in a benchmark, or the team already depends on its ecosystem.",
  },
  {
    key: "ollama",
    option: "Ollama",
    type: "Local model runtime",
    potentialAdvantages: ["Runs models on your own machine or server", "Data can stay private / on-premises", "Works offline; no per-request API bill", "Easy to try many open models during development"],
    costsAndRisks: ["You provide the CPU/GPU and keep it running", "You own scaling, monitoring and upgrades", "Open models may be weaker on some tasks — needs benchmarking"],
    chooseWhen: "Privacy, offline use, self-hosting or predictable cost matter more than zero-ops convenience.",
  },
  {
    key: "open-source",
    option: "Self-hosted open-source models (e.g. via vLLM)",
    type: "Self-hosted inference",
    potentialAdvantages: ["Full control over the model and its versions", "Can be fine-tuned for your domain", "No vendor lock-in"],
    costsAndRisks: ["Serious infrastructure and ML-ops work", "GPU cost", "Quality depends on the model you pick — benchmark it"],
    chooseWhen: "At scale with a team able to operate inference, or when data must never leave your infrastructure.",
  },
];

const CONCERNS = [
  { topic: "Prompt injection", practice: "Treat user and document text as data: fence it in the prompt, never let it change instructions, and never give the model secrets or powers it doesn't need." },
  { topic: "Output validation", practice: "Ask for structured output and validate it against a schema (e.g. zod/pydantic) before using it; retry or fail clearly when it doesn't match." },
  { topic: "Rate limiting", practice: "Limit AI calls per user so one user can't exhaust the provider quota for everyone." },
  { topic: "Cost control", practice: "Cache results that don't change, cap tokens, and count calls per user and per day." },
  { topic: "Timeouts & retries", practice: "Set a timeout on every call and retry once with backoff; show the user a clear message instead of hanging." },
  { topic: "Fallback", practice: "Keep the feature usable when the provider is down (cached result, simpler path, or a clear 'try again')." },
  { topic: "Model & prompt versioning", practice: "Record which model and prompt version produced each result, so quality changes can be traced." },
  { topic: "Logging & privacy", practice: "Log metadata, not personal content; tell users what is sent to the AI provider." },
  { topic: "API keys", practice: "Keys stay on the server (environment/secret manager), never in the browser or the repository." },
];

const FOLLOW_UPS = [
  "Why not OpenAI?",
  "Why not an open-source model?",
  "Why not Ollama?",
  "What happens if the AI provider goes down?",
  "How do you control API costs?",
  "How do you handle rate limits?",
  "How do you validate AI output?",
  "How do you prevent prompt injection?",
  "How do you version prompts?",
  "How do you evaluate model quality?",
  "Can the architecture switch providers?",
  "How would you make the AI layer provider-independent?",
];

export interface AiSection {
  used: string[];
  fact: string;
  flow: Diagram;
  concerns: typeof CONCERNS;
  comparison: typeof OPTIONS;
  decision: { question: string; answer: string; otherAdvantages: string[]; otherDisadvantages: string[]; recommendation: string; why: string };
  followUps: string[];
  note: string;
}

export function aiSection(projectName: string, technologies: string[]): AiSection | null {
  const used = technologies.filter((t) => {
    const k = techKey(t);
    return !!k && techInfo(k)?.category === "ai";
  });
  const providers = used.map((t) => techKey(t)!).filter((k) => HOSTED.has(k) || k === "ollama" || k === "hugging face");
  if (!used.length) return null;
  const hosted = providers.find((k) => HOSTED.has(k));
  const usedName = hosted ? (techInfo(hosted)?.name ?? hosted) : used[0];
  const local = providers.includes("ollama");

  const decision = local && !hosted
    ? {
        question: `Why did you use Ollama instead of a hosted API like Gemini or OpenAI?`,
        answer:
          "Ollama runs models locally, while Gemini or OpenAI are hosted APIs — related tools for different needs. Running locally keeps data on our own machines, works offline and has no per-request bill. A hosted API would remove the model-serving work and may give stronger models for some tasks. So I wouldn't say either is universally better: I'd decide on privacy, cost, infrastructure, latency and quality — ideally behind a provider abstraction so we can benchmark both.",
        otherAdvantages: OPTIONS[0].potentialAdvantages,
        otherDisadvantages: OPTIONS[0].costsAndRisks,
        recommendation: "Use a provider abstraction and benchmark both",
        why: "The right choice depends on measured quality, latency and cost for this project's prompts — numbers you only get by benchmarking.",
      }
    : {
        question: `Why did you use ${usedName} instead of Ollama?`,
        answer: `${usedName} is a hosted AI model API, while Ollama is mainly a local model runtime — they solve related but different problems. For ${projectName}, a hosted API reduces infrastructure and model-serving work. Ollama becomes attractive when we need local inference, privacy, offline development or control over self-hosted models. So I wouldn't say ${usedName} is universally better: I'd choose on latency, cost, privacy, infrastructure and model quality — and keep the provider behind an abstraction so we could benchmark or switch without changing business logic.`,
        otherAdvantages: OPTIONS[2].potentialAdvantages,
        otherDisadvantages: OPTIONS[2].costsAndRisks,
        recommendation: "Use a provider abstraction and benchmark both",
        why: "It keeps the current choice working while making a switch cheap if requirements (privacy, cost, offline use) change. Which one is 'better' for this project is a measurement, not an opinion.",
      };

  return {
    used,
    fact: `${projectName} lists ${used.join(", ")} on the resume.`,
    flow: {
      kind: "flow",
      title: "How an AI request should flow",
      objective: "Where validation, limits and fallbacks belong around the model call",
      alt: "User → Frontend → Backend → Prompt builder (fences user data) → AI provider (timeout, retry) → Output validation (schema) → Business logic → Response",
      steps: [
        { label: "User", note: "asks for something" },
        { label: "Frontend", note: "sends the request" },
        { label: "Backend", note: "auth + rate limit" },
        { label: "Prompt builder", note: "user text fenced as data" },
        { label: "AI provider", note: "timeout, retry, fallback" },
        { label: "Output validation", note: "schema check" },
        { label: "Business logic", note: "uses validated data only" },
        { label: "Response" },
      ],
    },
    concerns: CONCERNS,
    comparison: OPTIONS,
    decision,
    followUps: FOLLOW_UPS,
    note: "General engineering guidance — no benchmark numbers are claimed. Which option is faster, cheaper or better for this project has to be measured.",
  };
}
