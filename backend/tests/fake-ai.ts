import type { AIProvider } from "../src/ai/provider.js";

/** Deterministic stand-in for Gemini, keyed on the [task:…] tag the services put in the system prompt. */
export class FakeAI implements AIProvider {
  readonly name = "fake";
  calls: { task: string; user: string; system: string }[] = [];
  /** When set, multi-item translation batches drop their last item and send numeric ids (as real models sometimes do). */
  flakyTranslate = false;
  private jobCalls = 0;
  private prepCounter = 0;
  /** When set, prep batches return only invalid questions (exercises the "too few passed" failure). */
  prepBroken = false;
  /** Number of upcoming answer evaluations that should fail (simulates a Gemini outage/timeout). */
  failEvaluations = 0;

  /** Distinct questions per call, plus a few the validator must reject. */
  private prepBatch(category: string, count: number) {
    const skills = ["Node.js", "MongoDB", "JWT", "Express"];
    const ref = { project: ["P1", "E1"], claim: ["C1"], achievement: ["A1"] }[category] ?? [null];
    const good = (i: number) => {
      const n = ++this.prepCounter;
      return {
        question: `In your work, how would ${skills[n % 4]} handle alpha${n} beta${n} gamma${n} delta${n}?`,
        skill: skills[n % 4],
        sourceRef: ref[i % ref.length],
        probability: ((n * 37) % 100) / 100,
        difficulty: (n % 5) + 1,
        followUpDepth: 4,
        why: "On your resume",
        evidence: i === 0 ? "Invented quote that is not in the resume at all" : null,
        hint: "Think about the trade-offs.",
        keyPoints: ["point one", "point two", "point three"],
        followUps: ["What breaks first?"],
      };
    };
    if (this.prepBroken) return Array.from({ length: count }, () => ({ ...good(0), skill: "Kotlin Multiplatform", question: `How does Kotlin Multiplatform share code across zeta${++this.prepCounter} targets?` }));
    if (count < 6) return Array.from({ length: count }, (_, i) => good(i));
    const qs = Array.from({ length: count - 4 }, (_, i) => good(i));
    return [
      ...qs,
      { ...qs[0] }, // exact duplicate
      { ...good(0), question: "Tell me about yourself and your greatest strengths?" },
      { ...good(0), skill: "Kotlin Multiplatform", question: `How does Kotlin Multiplatform share code across omega${++this.prepCounter} targets?` },
      { ...good(0), keyPoints: [] }, // schema: needs ≥1 key point
    ];
  }

  async complete(system: string, user: string) {
    const task = system.match(/\[task:(\w+)\]/)?.[1] ?? "unknown";
    this.calls.push({ task, user, system });
    switch (task) {
      case "parse_resume":
        return JSON.stringify({
          name: "Riya Sharma",
          headline: "Backend developer",
          totalExperienceMonths: 6,
          skills: { languages: ["JavaScript"], frameworks: ["Node.js", "Express"], databases: ["MongoDB"], cloud: [], devops: ["Docker"], other: ["JWT"] },
          experience: [{ role: "Backend Intern", company: "Acme", months: 6, highlights: ["Built REST APIs"] }],
          projects: [{ name: "Notes API", description: "REST API", technologies: ["Node.js", "Express", "MongoDB", "JWT"], claims: ["Built JWT auth for a notes API"] }],
          education: [{ degree: "B.Tech CSE", institution: "XYZ", year: "2026" }],
          certifications: [],
          achievements: [],
          links: [],
        });
      case "parse_job":
        // First reply is broken on purpose: exercises the validate-and-retry path.
        if (this.jobCalls++ === 0) return "Sure! Here is the analysis you asked for.";
        return "```json\n" + JSON.stringify({
          title: "Backend Developer",
          company: "Zeta",
          requiredSkills: ["Node.js", "Express", "MongoDB", "Redis", "AWS"],
          preferredSkills: ["Docker"],
          requiredExperienceMonths: 0,
          responsibilities: ["Build APIs"],
          technologies: { languages: ["JavaScript"], frameworks: ["Express"], databases: ["MongoDB", "Redis"], cloud: ["AWS"], devops: ["Docker"] },
          systemDesign: false,
          aiMl: false,
          softRequirements: [],
        }) + "\n```";
      case "match":
        return JSON.stringify({
          breakdown: { requiredSkills: 60, technicalStack: 80, experience: 70, projects: 90, keywords: 50, responsibilities: 100, education: 100 },
          strong: ["Node.js", "Express", "MongoDB"],
          missing: ["Redis", "AWS"],
          risks: [{ severity: "MEDIUM", message: "Mentions Docker but never says how it was used." }],
          claims: [{ id: "c1", claim: "Built JWT auth for a notes API", source: "project", skills: ["JWT"], risk: "HIGH", why: "Direct implementation claim" }],
          questions: [
            { id: "x", question: "Tell me about yourself.", category: "IMPORTANT", level: 1, skill: "HR" },
            ...Array.from({ length: 10 }, (_, i) => ({
              id: `q${i}`,
              question: `You built the Notes API — technical question ${i}?`,
              category: (["IMPORTANT", "GOOD", "BETTER", "MAY_BE_ASKED", "CONCEPTUAL"] as const)[i % 5],
              level: (i % 5) + 1,
              skill: i % 2 ? "MongoDB" : "JWT",
              claimId: "c1",
              why: "On the resume",
            })),
          ],
        });
      case "evaluate_answer": {
        if (this.failEvaluations > 0) {
          this.failEvaluations--;
          throw new Error("simulated provider timeout");
        }
        const answer = user.match(/<candidate_answer>\n([\s\S]*?)\n<\/candidate_answer>/)?.[1] ?? "";
        // Lets browser tests trigger an AI outage from the UI.
        if (answer.includes("[simulate-ai-failure]")) throw new Error("simulated provider timeout");
        if (/\[unclear\]/i.test(answer)) {
          return JSON.stringify({ correctness: 0, completeness: 0, depth: 0, reasoning: 0, understanding: 0, practical: 0, communication: 0, verdict: "UNCLEAR", conceptsMentioned: [], missingConcepts: [], unsupportedClaims: [], followUp: { needed: false }, lead: "Okay." });
        }
        if (/don't know|pata nahi/i.test(answer)) {
          return JSON.stringify({ correctness: 0, completeness: 0, understanding: 0, practical: 0, communication: 4, verdict: "NO_ANSWER", conceptsMentioned: [], missingConcepts: ["JWT expiry"], unsupportedClaims: [], followUp: { needed: false }, lead: "Okay." });
        }
        if (/ignore (your|all|previous) instructions/i.test(answer)) {
          // A model that misbehaves: tries to reveal the answer in its lead and follow-up. The service must not pass it on.
          return JSON.stringify({ correctness: 1, completeness: 1, understanding: 1, practical: 1, communication: 3, verdict: "INCORRECT", conceptsMentioned: [], missingConcepts: ["JWT expiry"], unsupportedClaims: [], followUp: { needed: true, question: "The correct answer is: store it in a cookie. Do you agree?" }, lead: "Great answer! The correct answer is cookies." });
        }
        const good = /cookie/i.test(answer);
        return JSON.stringify({
          correctness: good ? 9 : 6, completeness: good ? 8 : 5, understanding: good ? 9 : 5, practical: good ? 8 : 5, communication: 8,
          verdict: good ? "CORRECT" : "PARTIAL",
          conceptsMentioned: good ? ["HTTP-only cookie"] : ["JWT"],
          missingConcepts: good ? [] : ["CSRF", "Refresh tokens"],
          unsupportedClaims: [],
          followUp: good ? { needed: false } : { needed: true, question: "Where did you store the token, and why there?" },
          lead: "Got it, thanks.",
        });
      }
      case "skill_map": {
        const concepts = (prefix: string, n: number) =>
          Array.from({ length: n }, (_, i) => ({ key: `${prefix}-${i + 1}`, title: `${prefix} concept ${i + 1}`, difficulty: (i % 5) + 1, frequency: 5 - (i % 5), importance: ["must", "GOOD", "advanced"][i % 3], prerequisites: i ? [`${prefix}-${i}`, "not-in-map"] : [] }));
        return JSON.stringify({
          summary: "A JavaScript runtime for servers.",
          domains: [
            { key: "foundation", title: "Foundation", concepts: concepts("basics", 3) },
            { key: "async", title: "Async programming", concepts: [{ key: "event-loop", title: "Event Loop", difficulty: 3, frequency: 5, importance: "MUST", prerequisites: ["basics-1"] }, ...concepts("async", 2)] },
            { key: "dupes", title: "Duplicates", concepts: [{ key: "event-loop", title: "Event Loop again", difficulty: 3, frequency: 5, importance: "MUST", prerequisites: [] }] },
          ],
          related: ["Express", "JavaScript"],
        });
      }
      case "concept_chapter":
        return JSON.stringify({
          oneLine: "The event loop lets Node.js run many I/O operations without a thread per request.",
          why: { problem: "One thread per request wastes memory.", solution: "Run JS on one thread and hand I/O to the OS.", tradeoff: "CPU-heavy work blocks everyone." },
          mentalModel: { analogy: "A waiter taking many orders while the kitchen cooks.", explanation: "The waiter never stands at the stove." },
          visuals: [
            { kind: "flow", title: "Request lifecycle", objective: "See where async work leaves the stack", steps: [{ label: "Call stack" }, { label: "OS / APIs", branches: [{ label: "Done", steps: ["Callback queue", "Call stack"] }] }] },
            { kind: "timeline", title: "Broken", objective: "Should be dropped", actors: ["Client", "Server"], events: [{ from: "Client", to: "Database", label: "query" }] },
            { kind: "comparison", title: "Threads vs loop", objective: "Compare models", left: { title: "Thread per request", points: ["Memory heavy"] }, right: { title: "Event loop", points: ["Cheap I/O"] } },
          ],
          howItWorks: ["JS runs on the call stack.", "Async I/O goes to the OS.", "Callbacks wait in queues."],
          realWorld: [{ where: "API servers", how: "Many concurrent DB calls" }],
          code: { language: "javascript", snippet: "setTimeout(() => console.log('later'), 0);\nconsole.log('now');", explanation: "Prints now, then later." },
          whenToUse: ["I/O-heavy APIs"],
          whenNotToUse: ["CPU-heavy image processing"],
          advantages: ["Low memory per connection"],
          disadvantages: ["Blocking code stalls everything"],
          mistakes: [{ wrong: "Node.js is multi-threaded for JS.", right: "Your JS runs on one thread; libuv uses a pool for some I/O." }],
          levels: [
            { level: 1, question: "What is the event loop?", hint: "Think queues." },
            { level: 2, question: "How do you avoid blocking it?", hint: "Async APIs, workers." },
            { level: 3, question: "How do you find what blocks it in production?", hint: "Profiling." },
            { level: 5, question: "CPU is 100% and latency spikes — debug it.", hint: "Look for sync work." },
          ],
          keyPoints: ["Single JS thread", "Async I/O offloaded", "Callback / microtask queues", "Blocking stalls all requests"],
          internals: ["libuv phases: timers, poll, check"],
          interviewerExpects: ["Single thread", "Queues", "Blocking consequences"],
          cheatSheet: { definition: "Coordinates JS execution and async callbacks.", useFor: ["I/O-heavy servers"], remember: ["Never block the loop"], interviewQuestion: "Why is Node.js fast for I/O?" },
        });
      case "concept_explain": {
        const answer = user.match(/<candidate_answer>\n([\s\S]*?)\n<\/candidate_answer>/)?.[1] ?? "";
        const strong = /single thread/i.test(answer) && /block/i.test(answer);
        return JSON.stringify({
          correctness: strong ? 9 : 5, completeness: strong ? 9 : 3, depth: strong ? 8 : 3, clarity: 8,
          covered: strong ? ["Single JS thread", "Blocking stalls all requests"] : ["Async I/O offloaded"],
          missing: strong ? [] : ["Single JS thread", "Blocking stalls all requests"],
          incorrect: [], unnecessary: [],
          feedback: strong ? "Clear and complete." : "Say why one thread is enough and what blocking does.",
        });
      }
      case "interview_bank": {
        const areas = ["PROJECTS", "FUNDAMENTALS", "ROLE", "PRACTICAL", "SYSTEM_DESIGN", "RESUME"];
        const skills = ["Node.js", "MongoDB", "JWT", "Express", "System design", "HTTP"];
        return JSON.stringify({
          questions: Array.from({ length: 24 }, (_, i) => ({
            id: `q${i + 1}`,
            question: `Role question ${i + 1}: how does ${skills[i % 6]} behave when case ${i + 1} happens?`,
            area: areas[i % 6],
            level: (i % 5) + 1,
            skill: skills[i % 6],
            claimId: i % 6 === 0 ? "c1" : null,
            why: "Core to the role",
          })),
        });
      }
      case "resume_intelligence":
        return JSON.stringify({
          chunks: [
            { ref: "k1", type: "PROJECT", section: 0, title: "Notes API", summary: "A REST API for notes with JWT auth.", technologies: ["Node.js", "Express", "MongoDB", "JWT"], risk: "HIGH", problem: "Store notes", architecture: "Express + MongoDB", features: ["CRUD", "Auth"], contribution: "Built it alone", complexity: 3 },
            { ref: "k2", type: "EXPERIENCE", section: 0, title: "Backend Intern @ Acme", summary: "Built REST APIs.", technologies: ["Node.js"], risk: "MEDIUM", features: [], complexity: 2 },
            { ref: "k3", type: "ACHIEVEMENT", section: 0, title: "2★ CodeChef", summary: "Competitive programming rating", technologies: [], risk: "MEDIUM", features: [] },
          ],
          claims: [
            { chunkRef: "k1", claim: "Built JWT authentication for the Notes API", evidence: "Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication", skills: ["JWT"], confidence: "HIGH", risk: "HIGH", depth: 5 },
            // Not in the resume: must be dropped by the evidence check.
            { chunkRef: "k1", claim: "Scaled the API to a million users", evidence: "Scaled the platform to one million daily active users", skills: ["Scaling"], confidence: "LOW", risk: "HIGH", depth: 6 },
          ],
        });
      case "prep_general":
      case "prep_skill":
      case "prep_project":
      case "prep_claim":
      case "prep_achievement":
      case "prep_conceptual":
      case "prep_scenario":
        return JSON.stringify({ questions: this.prepBatch(task.slice(5), Number(system.match(/Write exactly (\d+)/)?.[1] ?? 5)) });
      case "skill_guide":
        return JSON.stringify({
          summary: "A runtime for JavaScript on the server.",
          howItWorks: ["Event loop", "Non-blocking I/O"],
          realWorld: [{ where: "API backends", how: "Serving JSON over HTTP" }],
          implementation: { steps: ["npm init", "Write an HTTP server"], code: { language: "javascript", snippet: "require('http').createServer((q, s) => s.end('ok')).listen(3000);" } },
          perks: ["Fast I/O", "Huge ecosystem"],
          drawbacks: ["CPU-bound work blocks the loop"],
          whenToUse: ["I/O-heavy APIs"],
          whenNotToUse: ["Heavy number crunching"],
          alternatives: [{ name: "Go", whenBetter: "CPU-heavy concurrency" }],
          mistakes: ["Blocking the event loop"],
          interviewTips: ["Explain the event loop phases"],
        });
      case "prep_dedupe": {
        // Flags the first two questions as the same ask, plus a bogus id that must be ignored.
        const ids = [...user.matchAll(/^(q\d+):/gm)].map((m) => m[1]);
        return JSON.stringify({ groups: [[ids[0], ids[1], "q9999"]] });
      }
      case "translate_hi":
      case "translate_hinglish": {
        const items = JSON.parse(user) as { id: string; question: string; hint: string; why: string; keyPoints: string[]; followUps: string[] }[];
        const tag = task === "translate_hi" ? "प्रश्न" : "Sawaal";
        const out = items.map((i) => ({ ...i, question: `${tag}: ${i.question}` }));
        if (this.flakyTranslate && out.length > 1) return JSON.stringify({ items: out.slice(0, -1).map((i) => ({ ...i, id: Number(i.id) })) });
        return JSON.stringify({ items: out });
      }
      case "review_code":
        return JSON.stringify({ understanding: 8, practical: 7, communication: 6, timeComplexity: "O(n)", spaceComplexity: "O(1)", edgeCases: ["zero"], codeQuality: ["clear names"], lead: "Thanks." });
      default:
        return "{}";
    }
  }
}
