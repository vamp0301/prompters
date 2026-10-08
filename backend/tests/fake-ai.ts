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
  /** Bad chapter drafts to return before good ones (exercises the validator + retry). */
  badChapters: ("mixed" | "no-visual" | "unrelated-code" | "missing-covers")[] = [];

  /** While set, batches for the Advanced stage wait on it (lets tests see Basics published first). */
  stageGate: Promise<void> | null = null;
  /** Skill guides to return without a usable flow diagram before a good one. */
  badGuides = 0;
  /** Project-module drafts to return with a planted fabrication (validator tests). */
  badProject: ("metrics" | "foreign" | "generic")[] = [];
  /** Project parts that keep fabricating even after the retry (forces the scrub path). */
  stubbornProject = false;
  /** Per-call faults for project_questions only (first draft, retry…), consumed in order. */
  questionDrafts: ("generic" | "genericHigh" | "hypothetical")[] = [];

  /** Distinct questions per call, plus a few the validator must reject. */
  private prepBatch(category: string, count: number, system = "", user = "") {
    const band = system.match(/difficulty must be between (\d) and (\d)/);
    const [lo, hi] = band ? [Number(band[1]), Number(band[2])] : [1, 5];
    const skills = ["Node.js", "MongoDB", "JWT", "Express"];
    const ref = { project: ["P1", "E1"], claim: ["C1"], achievement: ["A1"] }[category] ?? [null];
    const good = (i: number) => {
      const n = ++this.prepCounter;
      return {
        question: `In your work, how would ${skills[n % 4]} handle alpha${n} beta${n} gamma${n} delta${n}?`,
        skill: skills[n % 4],
        sourceRef: ref[i % ref.length],
        probability: ((n * 37) % 100) / 100,
        difficulty: lo + (n % (hi - lo + 1)),
        followUpDepth: 4,
        why: "On your resume",
        evidence: i === 0 ? "Invented quote that is not in the resume at all" : null,
        hint: "Think about the trade-offs.",
        keyPoints: ["point one", "point two", "point three"],
        followUps: ["What breaks first?"],
      };
    };
    if (this.prepBroken) return Array.from({ length: count }, () => ({ ...good(0), skill: "Kotlin Multiplatform", question: `How does Kotlin Multiplatform share code across zeta${++this.prepCounter} targets?` }));
    // A model that repeats one of the candidate's previous-plan questions (the validator must reject it).
    const asked = user.match(/previous plan[^\n]*\n- (.+)/)?.[1];
    const repeat = asked ? [{ ...good(0), question: asked }] : [];
    if (count < 6) return [...Array.from({ length: count }, (_, i) => good(i)), ...repeat];
    const qs = Array.from({ length: count - 4 }, (_, i) => good(i));
    return [
      ...qs,
      ...repeat,
      { ...qs[0] }, // exact duplicate
      { ...good(0), question: "Tell me about yourself and your greatest strengths?" },
      { ...good(0), skill: "Kotlin Multiplatform", question: `How does Kotlin Multiplatform share code across omega${++this.prepCounter} targets?` },
      { ...good(0), keyPoints: [] }, // schema: needs ≥1 key point
    ];
  }


  /** Project name, technologies and claim ids from a project prompt. */
  private projectCtx(user: string) {
    const name = user.match(/^Project: (.+)$/m)?.[1]?.trim() ?? "Project";
    const techBlock = user.match(/<technologies>\n([\s\S]*?)\n<\/technologies>/)?.[1] ?? "";
    const techs = techBlock.split("\n").map((l) => l.replace(/\s*\(compare with:.*\)$/, "").trim()).filter(Boolean);
    const claimIds = [...user.matchAll(/^- \[([^\]]+)\] /gm)].map((m) => m[1]);
    const experience = /Appears under: (WORK EXPERIENCE|PROJECTS and WORK EXPERIENCE)/.test(user);
    return { name, techs, claimIds, experience };
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
          requiredExperienceMonths: /senior/i.test(user) ? 72 : 0,
          seniority: /senior/i.test(user) ? "Senior" : null,
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
      case "concept_chapter": {
        const title = user.match(/<concept>\n([\s\S]*?)\n<\/concept>/)?.[1] ?? "Concept";
        const covers = (user.match(/Must cover: (.*)/)?.[1] ?? "").split(";").map((x) => x.trim()).filter(Boolean);
        const bad = this.badChapters.shift();
        const t = title.toLowerCase();
        const chapter = {
          oneLine: `${title} is explained here in one line for a beginner.`,
          explainLikeNew: `Think of ${title} like a helpful traffic police officer at a busy junction.`,
          why: { problem: `Without ${title}, one part of the system takes all the work.`, solution: `${title} spreads or organises the work.`, tradeoff: `${title} adds another component to run and monitor.` },
          mentalModel: { analogy: "A receptionist sending visitors to free counters.", explanation: `That is what ${title} does for requests.` },
          visuals: [
            {
              kind: "architecture", title: `With ${title}`, objective: `See where ${title} sits`, alt: `Users connect to ${title}, which forwards to three servers.`,
              layers: [{ label: "Clients", nodes: [{ label: "Users" }] }, { label: "Edge", nodes: [{ label: title.slice(0, 40) }] }, { label: "App", nodes: [{ label: "Server 1" }, { label: "Server 2" }, { label: "Server 3" }] }],
              walkthrough: [{ label: "A request arrives", highlight: "Users" }, { label: `${title} picks a server`, highlight: title.slice(0, 40) }, { label: "Server 2 answers", highlight: "Server 2" }],
            },
            { kind: "comparison", title: "Before vs after", objective: "Compare the two setups", alt: "One overloaded server versus several shared servers.", left: { title: "Single server", points: ["Overloaded", "Single point of failure"] }, right: { title: `With ${title}`, points: ["Load shared", "Survives one failure"] } },
          ],
          howItWorks: [`A client request reaches ${title}.`, `${title} chooses a target.`, "The target processes it and replies."],
          deepDives: Array.from({ length: Math.ceil(covers.length / 2) }, (_, i) => covers.slice(i * 2, i * 2 + 2)).map((group) => ({ title: group[0], body: `${group.join(" and ")} explained for ${title}.`, points: group.map((cv) => `${cv} in practice`) })),
          realWorld: [{ where: "E-commerce APIs", how: `${title} in front of app servers` }],
          implementation: { applicable: true, language: "nginx", snippet: `# ${title}\nupstream app { server a; server b; }`, explanation: `A minimal ${title} configuration.` },
          whenToUse: ["When one instance can't handle peak traffic or you need redundancy"],
          whenNotToUse: ["For a tiny internal tool with one instance and no availability need"],
          advantages: ["Higher availability"],
          disadvantages: ["One more component"],
          tradeoffs: ["Availability vs operational complexity"],
          mistakes: [{ wrong: `${title} makes the app faster by itself.`, right: `${title} spreads load; each server still does the work.` }],
          levels: [1, 2, 3, 4, 5].map((level) => ({ level, question: `Level ${level} question about ${title}?`, hint: `Think about ${title} at level ${level}.` })),
          quiz: [0, 1, 2].map((i) => ({ question: `Quiz ${i + 1} on ${title}?`, options: ["A", "B", "C", "D"], answer: i % 4, explanation: `Because of how ${title} works.` })),
          keyPoints: [`What ${title} is`, "Why it exists", "How it works", "Trade-offs"],
          internals: [`${title} keeps state about targets.`],
          interviewerExpects: ["Definition", "Mechanism", "Failure handling"],
          explainTask: `Explain ${title} in 60 seconds.`,
          cheatSheet: { definition: `${title} in one line.`, useFor: ["Spreading load"], remember: ["Check health"], interviewQuestion: `Why do we need ${title}?` },
        };
        if (bad === "mixed") {
          chapter.oneLine = "System design is about building large systems.";
          chapter.explainLikeNew = "Big systems need many parts.";
          chapter.howItWorks = ["Use Sharding to split data.", "Use Cache-Aside for reads.", "Use Message Queues for async work."];
        }
        if (bad === "no-visual") chapter.visuals = [{ kind: "flow", title: "Tiny", objective: "Nothing", alt: "Two boxes.", steps: [{ label: "A" }, { label: "A" }] } as never];
        if (bad === "unrelated-code") chapter.implementation = { applicable: true, language: "python", snippet: "from functools import lru_cache\n@lru_cache\ndef f(x): return x", explanation: "Memoises a function." };
        if (bad === "missing-covers") chapter.deepDives = [];
        void t;
        return JSON.stringify(chapter);
      }
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
        if (this.stageGate && /STAGE 3/.test(system)) await this.stageGate;
        return JSON.stringify({ questions: this.prepBatch(task.slice(5), Number(system.match(/Write exactly (\d+)/)?.[1] ?? 5), system, user) });
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
          flow:
            this.badGuides-- > 0
              ? { kind: "flow", title: "Too small", objective: "x", alt: "x", steps: [{ label: "Request" }, { label: "Request" }] }
              : {
                  // No `kind`: real models sometimes omit it; the shape says it is a flow.
                  title: "How a request is handled",
                  objective: "Follow one request through the event loop",
                  steps: [{ label: "Request arrives" }, { label: "Event loop picks it" }, { label: "I/O to thread pool", note: "libuv" }, { label: "Callback queued" }, { label: "Response sent" }],
                },
        });
      case "project_story": {
        const { name, techs } = this.projectCtx(user);
        const bad = this.stubbornProject ? this.badProject[0] : this.badProject.shift();
        const db = techs.find((t) => /mongo|postgres|mysql|sqlite/i.test(t));
        const story = {
          overview: { problem: { text: `${name} solves the problem described on the resume.`, basis: "RESUME" }, users: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, whatBuilt: { text: `${name} built with ${techs.slice(0, 3).join(", ")}.`, basis: "RESUME" } },
          experience: [
            { question: "What was the project?", answer: `${name}, built with ${techs.slice(0, 2).join(" and ")}.`, basis: "RESUME" },
            { question: "Who used it?", answer: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" },
            { question: "What did I personally implement?", answer: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" },
            { question: "What would I improve today?", answer: "Add tests around the core flow and measure the slow paths.", basis: "GENERAL" },
          ],
          pitches: { sec30: `${name} is a project using ${techs.join(", ")}.`, sec60: `${name}: what it does, how it is built with ${techs.join(", ")}, and the key decisions.`, min2: ["Problem", "Stack", "My part", "One decision"], min5: ["Problem", "Architecture", "Data flow", "Decisions", "Trade-offs", "What I would change"] },
          architecture: {
            diagram: { kind: "architecture", title: `${name} architecture`, objective: "Where each part sits", alt: `User to ${techs.join(", ")}`, layers: [{ label: "Client", nodes: [{ label: "User" }] }, { label: "App", nodes: techs.slice(0, 3).map((t) => ({ label: t })) }, { label: "Data", nodes: [{ label: db ?? "Storage" }] }] },
            requestFlow: ["User performs an action", "Request reaches the API", "Business logic runs", "Data is read or written", "Response returned"],
          },
          dataFlow: [
            { step: "Input", why: "User submits data", whatCanFail: "Invalid input", handling: "Validate and return a clear error", basis: "GENERAL" },
            { step: "Business logic", why: "Applies the rules", whatCanFail: "Unexpected state", handling: "Guard clauses and logging", basis: "GENERAL" },
            { step: "Database", why: "Persists data", whatCanFail: "Connection lost", handling: "Retry and surface an error", basis: "GENERAL" },
          ],
          database: db ? { name: db, whyChosen: { fact: null, explanation: `${db} fits structured application data.`, possibleReason: "The team may have known it already." }, dataModel: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, entities: [], questions: [{ q: `Why ${db}?`, a: `${db} fit the data access pattern.` }] } : null,
          security: [{ area: "Input validation", why: "User input reaches the API", risk: "Injection", change: "Validate every request body" }],
          performance: { problem: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, cause: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, identified: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, solution: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, whySolution: "Depends on the measured bottleneck.", tradeoff: "Complexity versus speed.", result: { text: "Not provided — add actual measurement.", basis: "NOT_SPECIFIED" } },
          challenges: { real: [], likely: ["Handling invalid data from users"] },
          tradeoffs: ["Simplicity over flexibility"],
          scaling: [{ at: "10×", bottleneck: "The database", change: "Add indexes and read replicas" }],
          ifBuiltToday: [{ current: `${techs[0] ?? "The app"} handles requests directly`, recommended: "Add automated tests and metrics", reason: "Safer changes and visible performance" }],
          skillLadder: [1, 2, 3, 4, 5].map((level) => ({ level, skills: [{ name: techs[level % Math.max(1, techs.length)] ?? "Programming", evidence: `Used in ${name}`, confidence: level <= 2 ? "HIGH" : "MEDIUM" }] })),
        };
        if (bad === "metrics") {
          story.performance.result = { text: "Reduced API latency by 70% for 100K users.", basis: "RESUME" };
          story.pitches.sec30 = `${name} handled 100K users with 99.99% uptime.`;
        }
        if (bad === "foreign") {
          story.overview.whatBuilt = { text: `${name} cached every response in Redis and queued work in Kafka.`, basis: "RESUME" };
          story.architecture.diagram.layers.push({ label: "Cache", nodes: [{ label: "Redis" }] });
        }
        return JSON.stringify(story);
      }
      case "project_tech": {
        const { name, techs } = this.projectCtx(user);
        const card = (t: string) => ({
          technology: t, whatItIs: `${t} is a widely used tool.`, whyUsed: { fact: null, explanation: `${t} fit ${name}'s needs.`, possibleReason: "The team may have known it." },
          problemSolved: `It handled one part of ${name}.`, howUsed: { text: "Not specified — edit this answer.", basis: "NOT_SPECIFIED" }, alternative: "An alternative", whyNotAlternative: "The requirements did not call for it.",
          alternativeBetterWhen: "When requirements change.", worseWhen: "When the current needs hold.", tradeoff: "Familiarity versus flexibility.", recommendation: "KEEP", recommendationReason: "No project-specific reason to change.",
          interviewQuestion: `Why did you choose ${t} for ${name}?`, answer: `${t} fit ${name}'s access pattern; I would revisit it if requirements changed.`, followUp: "Why not the alternative?", deeperFollowUp: "What would make you migrate?",
        });
        return JSON.stringify({ technologies: [...techs.map(card), card("Kafka")] });
      }
      case "project_questions": {
        const { name, techs, claimIds, experience } = this.projectCtx(user);
        const draft = this.questionDrafts.shift();
        const bad = draft ?? (this.stubbornProject ? this.badProject[0] : this.badProject.shift());
        const t = (i: number) => techs[i % Math.max(1, techs.length)] ?? "the stack";
        const dims = ["PROJECT", "ARCHITECTURE", "TECHNOLOGY", "DATABASE", "API", "SECURITY", "PERFORMANCE", "DEBUGGING", "TRADEOFFS", "SCALABILITY"];
        const questions = Array.from({ length: 20 }, (_, i) => {
          const level = Math.floor(i / 4) + 1;
          return {
            level, dimension: dims[(i + level) % dims.length], skill: t(i),
            question: (bad === "generic" && i < 3) || (bad === "genericHigh" && i >= 17) ? `What is a variable number ${i}?` : bad === "hypothetical" && i === 19 ? `L5 q20: how would ${name} handle a surge to 600,000 users?` : `L${level} q${i + 1}: how does ${t(i)} work in ${name}?`,
            answer: bad === "metrics" && i === 0 ? `In ${name} we cut response time by 70% using ${t(i)}.` : bad === "hypothetical" && i === 19 ? `At 600,000 users I would add caching in front of ${t(i)}.` : `In ${name}, ${t(i)} handles part of the flow; explain your own part.`,
            whyThisAnswer: "Shows you know your own project.", followUp: `Why ${t(i)} here?`, followUpAnswer: `It fit ${name}.`, deepFollowUp: "What would you change?", deepFollowUpAnswer: "Measure first, then change.",
          };
        });
        return JSON.stringify({
          questions,
          drillDown: Array.from({ length: 9 }, (_, i) => ({ question: `Drill ${i + 1} on ${name}`, lookingFor: "Specifics" })),
          claimDefense: claimIds.map((claimId) => ({ claimId, questions: ["What exactly did you build?", "How did you measure it?", "What would break first?", "What did it cost?", "What would you do differently?"] })),
          experienceQuestions: experience ? Array.from({ length: 6 }, (_, i) => ({ question: `Experience question ${i + 1} about your responsibility on ${name}`, hint: "Prepare a real example." })) : [],
        });
      }
      case "project_answer_eval": {
        const answer = user.match(/<candidate_answer>\n([\s\S]*?)\n<\/candidate_answer>/)?.[1] ?? "";
        const strong = /\bbecause\b/i.test(answer) && answer.length > 40;
        const s10 = strong ? 9 : 3;
        return JSON.stringify({
          correctness: s10, completeness: s10, depth: s10, reasoning: s10, understanding: s10, practical: s10, communication: s10,
          verdict: strong ? "CORRECT" : "PARTIAL",
          conceptsMentioned: strong ? ["data model", "trade-off"] : ["basics"], missingConcepts: strong ? [] : ["indexing", "failure handling"], unsupportedClaims: [],
          followUp: strong ? { needed: false } : { needed: true, question: `You said "${answer.slice(0, 30)}" — what exactly did you do?` },
          lead: "Okay.",
        });
      }
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
