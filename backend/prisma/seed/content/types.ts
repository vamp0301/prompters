/**
 * Seed content format for Prompters.
 *
 * Every learner-facing explanation is localised. `hinglish` is the default
 * teaching language, `en` is simple English. `hi` (Devanagari Hindi) is optional;
 * when missing the app falls back to English.
 *
 * Section bodies are a small Markdown subset: paragraphs, **bold**, `inline code`,
 * bullet lists ("- "), numbered lists and fenced code blocks. No raw HTML.
 */

export type Locale = "hinglish" | "en" | "hi";

export type L10n = { hinglish: string; en: string; hi?: string };

export type SectionType =
  | "DEFINITION" // 01 What is it? (one or two lines)
  | "ANALOGY" // 02 Explain like I'm new (everyday analogy)
  | "WHY" // 03 Why does it exist? (problem without it)
  | "USAGE" // 04 Where is it used? (2–3 real products/companies)
  | "INTERNALS" // 05 How it works inside (pairs with the visualization)
  | "CODE" // 06 Implement it (runnable codeJs / codePython, explained)
  | "MISTAKES" // 07 Common beginner mistakes
  | "DEBUGGING" // 08 How to debug problems with it
  | "TRADEOFFS" // 09 When NOT to use it, alternatives
  | "REAL_PROJECT"; // 10 How it shows up in a real project

export type QuestionType =
  | "MCQ" // single correct option
  | "MULTI" // several correct options
  | "PREDICT_OUTPUT" // code + options, one correct
  | "SPOT_BUG" // code + options, one correct
  | "FILL_CODE" // code with ____ + options, one correct
  | "SCENARIO" // situation + options, one correct
  | "ORDER_STEPS" // options listed in the CORRECT order; app shuffles
  | "EXPLAIN"; // free text graded by keyword rubric

export interface SeedQuestion {
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  /** Question text in simple English. */
  prompt: string;
  /** Optional code snippet shown with the question. */
  code?: string;
  codeLanguage?: "javascript" | "python";
  /** Required for every type except EXPLAIN. */
  options?: string[];
  /** Indices into options. Omit for ORDER_STEPS (order is the answer) and EXPLAIN. */
  correct?: number[];
  /** EXPLAIN only: key ideas; answer passes when it mentions at least half of them. */
  keywords?: string[];
  /** Shown after answering. Hinglish-friendly, explains WHY. */
  explanation: string;
  tags?: string[];
}

export interface SeedVisualization {
  kind:
    | "FLOW"
    | "TIMELINE"
    | "STACK"
    | "QUEUE"
    | "TREE"
    | "NETWORK"
    | "REQUEST_RESPONSE"
    | "CODE_EXECUTION"
    | "CUSTOM_STEPS";
  title: string;
  steps: { title: string; description: string; highlight?: string }[];
}

export interface SeedBuildTask {
  title: string;
  /** Markdown, Hinglish-friendly task statement. */
  description: string;
  /** Name of the function the student must implement (same in JS and Python). */
  functionName: string;
  starterJs: string;
  starterPython: string;
  /** args is the argument list; expected is compared with deep equality (JSON). */
  tests: { name: string; args: unknown[]; expected: unknown; hidden?: boolean }[];
  /** Exactly three: [concept hint, step hint, partial code hint]. */
  hints: [string, string, string];
  /** Asked after tests pass ("Explain your code"). */
  explainQuestions: { question: string; keywords: string[] }[];
  estMinutes: number;
}

export interface SeedInterviewQuestion {
  question: string;
  /** "Say it in 30 seconds" answer, interview English. */
  short: string;
  /** Deeper answer, interview English, can use Markdown. */
  deep: string;
  followUps: string[];
  commonMistake: string;
  keywords: string[];
  difficulty: 1 | 2 | 3;
  roles: ("BACKEND" | "FRONTEND" | "FULLSTACK" | "DEVOPS" | "SDE" | "AI")[];
}

export interface SeedPromptCard {
  title: string;
  category:
    | "LEARNING"
    | "DEBUGGING"
    | "CODE_REVIEW"
    | "TESTING"
    | "SECURITY"
    | "SQL"
    | "OPTIMIZATION"
    | "DOCKER"
    | "CICD"
    | "SYSTEM_DESIGN"
    | "RESUME"
    | "INTERVIEW"
    | "PROJECT_PLANNING";
  task: string;
  whenToUse: string;
  /** Use [UPPER_SNAKE] placeholders for blanks, e.g. [PASTE_CODE]. */
  template: string;
  variables: { key: string; label: string }[];
  whyItWorks: { part: string; why: string }[];
  verifyChecklist: string[];
  sampleOutput: string;
}

export interface SeedTopicContent {
  /** Must match a topic slug in curriculum.ts */
  slug: string;
  estMinutes: number;
  difficulty: 1 | 2 | 3;
  /** Slugs of topics that should be learned first. */
  prerequisites: string[];
  objectives: string[];
  /** Technical-English one-liner (textbook-accurate). */
  technicalDefinition: string;
  sections: { type: SectionType; content: L10n; codeJs?: string; codePython?: string }[];
  visualization?: SeedVisualization;
  /** Pool for the mastery quiz (quiz draws 5). Aim for 8+. */
  questions: SeedQuestion[];
  buildTask?: SeedBuildTask;
  interview: SeedInterviewQuestion[];
  promptCard?: SeedPromptCard;
}
