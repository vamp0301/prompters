/**
 * Built-in career catalogue, version TAXONOMY_VERSION. It seeds the database taxonomy (CareerRole,
 * Competency, RoleCompetency) and is the fallback when the database has none. Add careers here or
 * in the database — never as conditionals in controllers or components.
 *
 * Content status: curated from general professional knowledge for interview preparation. It has NOT
 * been reviewed by practitioners of each profession yet (see `reviewed` on each role).
 */

export const TAXONOMY_VERSION = 1;

export const FAMILIES = {
  software: { name: "Software & IT", description: "Building, testing, securing and running software." },
  data: { name: "Data & Analytics", description: "Turning data into decisions: SQL, spreadsheets, statistics, dashboards and models." },
  product: { name: "Product", description: "Deciding what to build and why: users, metrics, prioritisation and strategy." },
  business: { name: "Business & Consulting", description: "Structured problem solving, business analysis and recommendations." },
  mba: { name: "MBA specialisations", description: "Marketing, finance, HR and operations roles." },
  sales: { name: "Sales & Customer Success", description: "Finding, winning and keeping customers." },
  design: { name: "Design", description: "Research-led UI/UX and product design." },
  other: { name: "Operations, projects & marketing", description: "Project management, supply chain and digital marketing." },
} as const;
export type FamilyKey = keyof typeof FAMILIES;

export const COMPETENCY_KINDS = ["TOOL", "TECHNICAL", "ANALYTICAL", "PRODUCT", "BUSINESS", "DOMAIN", "COMMUNICATION", "PEOPLE", "DESIGN"] as const;
export type CompetencyKind = (typeof COMPETENCY_KINDS)[number];

export const ASSESSMENT_TYPES = [
  "CONCEPT_CHECK", "CODING", "DEBUGGING", "SYSTEM_DESIGN", "SQL", "DATA_INTERPRETATION", "SPREADSHEET", "STATISTICS",
  "BUSINESS_CASE", "PRODUCT_CASE", "MARKETING_CASE", "FINANCE_CASE", "HR_SCENARIO", "SALES_ROLEPLAY", "DESIGN_CRITIQUE",
  "PORTFOLIO_REVIEW", "PROJECT_SCENARIO", "WRITTEN_COMMUNICATION", "BEHAVIOURAL",
] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];
/** Assessment types that need code execution or code writing. */
export const CODE_ASSESSMENTS: ReadonlySet<AssessmentType> = new Set(["CODING", "DEBUGGING"]);

export interface Area {
  key: string;
  label: string;
  description: string;
  weight: number;
}
export interface RubricDim {
  key: string;
  label: string;
  description: string;
}

/** Scored for every role. Never accent, grammar, appearance or any personal characteristic. */
export const COMMON_RUBRIC: RubricDim[] = [
  { key: "reasoning", label: "Reasoning", description: "Explains why, not just what; logic holds together." },
  { key: "clarity", label: "Clarity", description: "Structured, easy to follow, answers the question asked." },
  { key: "evidence", label: "Evidence", description: "Backs claims with specifics from real work, data or examples." },
  { key: "judgment", label: "Practical judgment", description: "Sensible trade-offs and awareness of constraints and risks." },
];

const BEHAVIOURAL: Area = { key: "BEHAVIOURAL", label: "Experience & behaviour", description: "Past situations told with context, actions and results (STAR).", weight: 0.15 };

interface FamilyProfile {
  areas: Area[];
  rubric: RubricDim[];
  assessments: AssessmentType[];
  /** Whether coding tasks may appear for roles in this family (a role can override). */
  code: boolean;
}

export const FAMILY_PROFILES: Record<FamilyKey, FamilyProfile> = {
  software: {
    // Same areas the interview blueprint already uses for engineering roles.
    areas: [
      { key: "FUNDAMENTALS", label: "Core fundamentals", description: "Language, CS and platform concepts.", weight: 0.3 },
      { key: "PRACTICAL", label: "Practical engineering", description: "Building, debugging and shipping real software.", weight: 0.3 },
      { key: "PROBLEM_SOLVING", label: "Problem solving", description: "Algorithms and coding problems.", weight: 0.2 },
      { key: "SYSTEM_DESIGN", label: "System & design thinking", description: "Architecture, scale and trade-offs.", weight: 0.2 },
    ],
    rubric: [
      { key: "technical", label: "Technical correctness", description: "Accurate concepts and working solutions." },
      { key: "engineering", label: "Engineering judgment", description: "Design choices, trade-offs, failure handling." },
      { key: "code", label: "Code quality", description: "Readable, correct, efficient code when code is asked for." },
    ],
    assessments: ["CONCEPT_CHECK", "CODING", "DEBUGGING", "SYSTEM_DESIGN", "BEHAVIOURAL"],
    code: true,
  },
  data: {
    areas: [
      { key: "FUNDAMENTALS", label: "SQL & statistics fundamentals", description: "Joins, aggregation, distributions, sampling, significance.", weight: 0.3 },
      { key: "ANALYSIS", label: "Analysis & data interpretation", description: "Reading data correctly, data quality, choosing the right analysis.", weight: 0.3 },
      { key: "BUSINESS_CASE", label: "Business interpretation", description: "Turning numbers into decisions; KPIs and recommendations.", weight: 0.25 },
      BEHAVIOURAL,
    ],
    rubric: [
      { key: "analysis", label: "Analytical correctness", description: "Correct query logic, statistics and calculations." },
      { key: "data_quality", label: "Data quality awareness", description: "Checks assumptions, missing data, bias and edge cases." },
      { key: "business", label: "Business interpretation", description: "Connects findings to a decision or KPI." },
    ],
    assessments: ["CONCEPT_CHECK", "SQL", "DATA_INTERPRETATION", "SPREADSHEET", "STATISTICS", "BUSINESS_CASE", "BEHAVIOURAL"],
    code: false,
  },
  product: {
    areas: [
      { key: "PRODUCT_SENSE", label: "Product sense", description: "Users, problems, solutions and the reasoning between them.", weight: 0.3 },
      { key: "METRICS", label: "Metrics & analytics", description: "North-star and guardrail metrics, funnels, experiments.", weight: 0.25 },
      { key: "PRIORITIZATION", label: "Prioritisation & strategy", description: "Trade-offs, roadmaps, market and competition.", weight: 0.25 },
      { key: "STAKEHOLDERS", label: "Stakeholders & execution", description: "Alignment, conflict, delivery and communication.", weight: 0.2 },
    ],
    rubric: [
      { key: "user", label: "User & problem framing", description: "Starts from a real user and a clearly stated problem." },
      { key: "prioritization", label: "Prioritisation & trade-offs", description: "Chooses deliberately and explains what is given up." },
      { key: "metrics", label: "Metrics", description: "Defines how success is measured and what could go wrong." },
    ],
    assessments: ["CONCEPT_CHECK", "PRODUCT_CASE", "DATA_INTERPRETATION", "WRITTEN_COMMUNICATION", "BEHAVIOURAL"],
    code: false,
  },
  business: {
    areas: [
      { key: "STRUCTURING", label: "Case structuring", description: "Breaking an ambiguous problem into a clear structure.", weight: 0.3 },
      { key: "ANALYSIS", label: "Quantitative analysis", description: "Market sizing, profitability, reading charts and tables.", weight: 0.3 },
      { key: "SYNTHESIS", label: "Synthesis & recommendation", description: "A clear answer, its assumptions and next steps.", weight: 0.25 },
      BEHAVIOURAL,
    ],
    rubric: [
      { key: "structure", label: "Structure", description: "MECE, hypothesis-driven breakdown of the problem." },
      { key: "assumptions", label: "Assumptions & numbers", description: "States assumptions; arithmetic and estimates are sound." },
      { key: "synthesis", label: "Synthesis", description: "Lands on a recommendation with risks and next steps." },
    ],
    assessments: ["CONCEPT_CHECK", "BUSINESS_CASE", "DATA_INTERPRETATION", "SPREADSHEET", "WRITTEN_COMMUNICATION", "BEHAVIOURAL"],
    code: false,
  },
  mba: {
    areas: [
      { key: "DOMAIN", label: "Domain knowledge", description: "Core concepts and frameworks of the function.", weight: 0.3 },
      { key: "CASE", label: "Functional case", description: "Applying the function's tools to a business situation.", weight: 0.3 },
      { key: "METRICS", label: "Metrics & decisions", description: "The numbers that matter in the function and what they imply.", weight: 0.2 },
      { ...BEHAVIOURAL, weight: 0.2 },
    ],
    rubric: [
      { key: "domain", label: "Domain accuracy", description: "Concepts and frameworks used correctly." },
      { key: "application", label: "Application", description: "Applies them to the specific situation, not generically." },
      { key: "measurement", label: "Measurement", description: "Knows how outcomes are measured and judged." },
    ],
    assessments: ["CONCEPT_CHECK", "BUSINESS_CASE", "MARKETING_CASE", "FINANCE_CASE", "HR_SCENARIO", "SPREADSHEET", "BEHAVIOURAL"],
    code: false,
  },
  sales: {
    areas: [
      { key: "DISCOVERY", label: "Discovery", description: "Understanding the customer's situation, needs and buying process.", weight: 0.3 },
      { key: "OBJECTIONS", label: "Objections & negotiation", description: "Handling pushback and negotiating value.", weight: 0.25 },
      { key: "PIPELINE", label: "Pipeline & metrics", description: "Forecasting, conversion, retention and account health.", weight: 0.2 },
      { key: "BEHAVIOURAL", label: "Experience & behaviour", description: "Real situations told with results (STAR).", weight: 0.25 },
    ],
    rubric: [
      { key: "discovery", label: "Discovery", description: "Asks good questions; listens before pitching." },
      { key: "value", label: "Value & objection handling", description: "Ties the offer to the customer's problem; handles pushback calmly." },
      { key: "next_steps", label: "Next steps", description: "Moves the conversation to a clear, agreed next step." },
    ],
    assessments: ["CONCEPT_CHECK", "SALES_ROLEPLAY", "DATA_INTERPRETATION", "WRITTEN_COMMUNICATION", "BEHAVIOURAL"],
    code: false,
  },
  design: {
    areas: [
      { key: "RESEARCH", label: "User research", description: "Finding and validating real user needs.", weight: 0.25 },
      { key: "PROCESS", label: "Design process & rationale", description: "From problem to solution, with the reasoning behind each choice.", weight: 0.3 },
      { key: "CRITIQUE", label: "Design critique", description: "Evaluating designs against users, goals and accessibility.", weight: 0.25 },
      { key: "COLLABORATION", label: "Collaboration", description: "Working with product, engineering and stakeholders.", weight: 0.2 },
    ],
    rubric: [
      { key: "user", label: "User grounding", description: "Decisions trace back to research or user evidence." },
      { key: "rationale", label: "Design rationale", description: "Explains why this solution, and what was rejected." },
      { key: "craft", label: "Craft & accessibility", description: "Usability, hierarchy and accessibility considered." },
    ],
    assessments: ["CONCEPT_CHECK", "DESIGN_CRITIQUE", "PORTFOLIO_REVIEW", "PRODUCT_CASE", "BEHAVIOURAL"],
    code: false,
  },
  other: {
    areas: [
      { key: "DOMAIN", label: "Domain knowledge", description: "Core concepts, methods and tools of the role.", weight: 0.3 },
      { key: "SCENARIO", label: "Scenarios", description: "Handling realistic situations in the role.", weight: 0.3 },
      { key: "METRICS", label: "Metrics & reporting", description: "Measuring and reporting what matters.", weight: 0.2 },
      { ...BEHAVIOURAL, weight: 0.2 },
    ],
    rubric: [
      { key: "domain", label: "Domain accuracy", description: "Methods and terms used correctly." },
      { key: "planning", label: "Planning & risk", description: "Anticipates constraints, dependencies and risks." },
      { key: "measurement", label: "Measurement", description: "Tracks the right indicators and acts on them." },
    ],
    assessments: ["CONCEPT_CHECK", "PROJECT_SCENARIO", "BUSINESS_CASE", "MARKETING_CASE", "SPREADSHEET", "DATA_INTERPRETATION", "BEHAVIOURAL"],
    code: false,
  },
};

export interface CompetencyDef {
  kind: CompetencyKind;
  description: string;
  assessments: AssessmentType[];
  /** Learning content and tasks may contain code (programming, SQL, scripts). */
  code?: boolean;
  aliases?: string[];
  /** Competency names learned first. */
  prereqs?: string[];
}

const tool = (description: string, extra: Partial<CompetencyDef> = {}): CompetencyDef => ({ kind: "TOOL", description, assessments: ["CONCEPT_CHECK"], ...extra });
const tech = (description: string, extra: Partial<CompetencyDef> = {}): CompetencyDef => ({ kind: "TECHNICAL", description, assessments: ["CONCEPT_CHECK"], ...extra });
const c = (kind: CompetencyKind, description: string, assessments: AssessmentType[], extra: Partial<CompetencyDef> = {}): CompetencyDef => ({ kind, description, assessments, ...extra });
const prog = (description: string, extra: Partial<CompetencyDef> = {}) => tool(description, { assessments: ["CONCEPT_CHECK", "CODING", "DEBUGGING"], code: true, ...extra });

/** Every competency, by display name. The canonical key is canonicalSkill(name). */
export const COMPETENCIES: Record<string, CompetencyDef> = {
  // ── Software tools ──
  "Node.js": prog("JavaScript runtime for servers."), Express: prog("Minimal Node.js web framework."), Python: prog("General-purpose language; scripting, data, web."),
  Java: prog("Typed, object-oriented language for large systems."), "C++": prog("Systems language with manual memory control."), JavaScript: prog("The language of the web."),
  TypeScript: prog("JavaScript with static types."), HTML: tool("Structure of web pages.", { code: true }), CSS: tool("Styling and layout of web pages.", { code: true }),
  React: prog("UI library built from components."), "Next.js": prog("React framework with routing and server rendering."), Redux: prog("Predictable state container."),
  "Tailwind CSS": tool("Utility-first CSS framework.", { code: true }), "REST APIs": tech("Resource-oriented HTTP APIs.", { code: true, assessments: ["CONCEPT_CHECK", "CODING"] }),
  SQL: tool("Querying and shaping relational data.", { code: true, assessments: ["CONCEPT_CHECK", "SQL"] }), PostgreSQL: tool("Relational database.", { code: true, assessments: ["CONCEPT_CHECK", "SQL"] }),
  MySQL: tool("Relational database.", { code: true, assessments: ["CONCEPT_CHECK", "SQL"] }), MongoDB: tool("Document database.", { code: true }), Redis: tool("In-memory data store and cache.", { code: true }),
  Authentication: tech("Proving who a user is.", { code: true }), JWT: tech("Signed tokens for stateless auth.", { code: true }), Docker: tool("Packaging apps into containers.", { code: true }),
  Git: tool("Version control.", { code: true }), Testing: tech("Automated tests that prove code works.", { code: true, assessments: ["CONCEPT_CHECK", "CODING"] }),
  Accessibility: c("DESIGN", "Making products usable for people with disabilities.", ["CONCEPT_CHECK", "DESIGN_CRITIQUE"], { aliases: ["a11y"] }),
  "Data structures": tech("Arrays, lists, trees, graphs, hash maps.", { code: true, assessments: ["CONCEPT_CHECK", "CODING"] }),
  Algorithms: tech("Searching, sorting, recursion, dynamic programming.", { code: true, assessments: ["CONCEPT_CHECK", "CODING"], prereqs: ["Data structures"] }),
  OOP: tech("Objects, classes, encapsulation, polymorphism.", { code: true }), Linux: tool("The operating system most servers run.", { code: true }),
  Bash: prog("Shell scripting."), Kubernetes: tool("Container orchestration.", { code: true, prereqs: ["Docker"] }), AWS: tool("Amazon's cloud platform."),
  "CI/CD": tech("Automated build, test and deploy pipelines.", { code: true }), Terraform: tool("Infrastructure as code.", { code: true }), Nginx: tool("Web server and reverse proxy.", { code: true }),
  Monitoring: tech("Metrics, logs and alerts for running systems."), Pandas: prog("Python library for tabular data.", { prereqs: ["Python"] }), NumPy: prog("Python library for numeric arrays.", { prereqs: ["Python"] }),
  "scikit-learn": prog("Classical machine learning in Python.", { prereqs: ["Python"] }), PyTorch: prog("Deep learning framework."), TensorFlow: prog("Deep learning framework."),
  "Machine learning": tech("Learning patterns from data to predict or classify.", { code: true, assessments: ["CONCEPT_CHECK", "CODING", "STATISTICS"], prereqs: ["Statistics"] }),
  "Deep learning": tech("Neural networks with many layers.", { code: true, prereqs: ["Machine learning"] }), LLMs: tech("Large language models and how to use them."),
  Selenium: tool("Browser automation for testing.", { code: true }), Cypress: tool("End-to-end testing for web apps.", { code: true }), Playwright: tool("Cross-browser end-to-end testing.", { code: true }),
  Postman: tool("API testing and exploration."), JIRA: tool("Issue and project tracking.", { aliases: ["jira"] }), Wireshark: tool("Network packet analysis."), Nmap: tool("Network discovery and port scanning."),
  "Burp Suite": tool("Web application security testing."), SIEM: tool("Security event collection and alerting.", { aliases: ["splunk", "security information and event management"] }),
  // ── Software concepts ──
  HTTP: tech("The request/response protocol of the web."), REST: tech("Resource-based API style."), Databases: tech("Storing and querying data reliably."), Indexing: tech("Making lookups fast.", { prereqs: ["Databases"] }),
  Transactions: tech("All-or-nothing changes; ACID.", { prereqs: ["Databases"] }), Caching: tech("Keeping hot data close."), Authorization: tech("Deciding what a user may do.", { prereqs: ["Authentication"] }),
  Concurrency: tech("Many things at once: threads, async, races."), "API design": tech("Designing clear, stable interfaces."), Scalability: tech("Handling more load gracefully."),
  "System design": tech("Architecting systems for scale and reliability.", { assessments: ["CONCEPT_CHECK", "SYSTEM_DESIGN"] }), "Operating systems": tech("Processes, memory, files, scheduling."),
  Networking: tech("How machines talk: TCP/IP, DNS, HTTP."), Security: tech("Protecting systems and data."), DOM: tech("The browser's document model.", { code: true }), "Browser rendering": tech("How browsers paint pages."),
  "Event loop": tech("How JavaScript runs async work.", { code: true }), Closures: tech("Functions remembering their scope.", { code: true }), Promises: tech("Values that arrive later.", { code: true }),
  "State management": tech("Keeping UI state consistent.", { code: true }), Performance: tech("Making things fast and efficient."), "Responsive design": c("DESIGN", "Layouts that work on every screen.", ["CONCEPT_CHECK"], { code: true }),
  "Time complexity": tech("How cost grows with input size.", { code: true }), "Design patterns": tech("Reusable solutions to design problems.", { code: true }), DBMS: tech("Database management systems theory."),
  Recursion: tech("Functions defined in terms of themselves.", { code: true }), "Dynamic programming": tech("Solving problems by reusing sub-results.", { code: true, prereqs: ["Recursion"] }),
  Containers: tech("Isolated, portable runtime environments."), Orchestration: tech("Running many containers reliably."), "Infrastructure as code": tech("Infrastructure defined in versioned files."),
  Observability: tech("Understanding a system from its outputs."), "High availability": tech("Staying up through failures."), "Linear algebra": tech("Vectors and matrices behind ML."),
  "Bias-variance": tech("The trade-off between under- and over-fitting."), Overfitting: tech("Learning noise instead of signal."), Regularization: tech("Constraining models to generalise."),
  "Evaluation metrics": c("ANALYTICAL", "Accuracy, precision, recall, AUC and when each fits.", ["CONCEPT_CHECK", "STATISTICS"]), "Feature engineering": tech("Shaping raw data into model inputs."),
  "Neural networks": tech("Layered models trained by gradient descent."), Transformers: tech("Attention-based neural architecture."), "Model deployment": tech("Serving models in production."),
  "Test design": tech("Choosing cases that find bugs.", { assessments: ["CONCEPT_CHECK", "PROJECT_SCENARIO"] }), "Test automation": tech("Tests that run without a human.", { code: true }),
  "Regression testing": tech("Checking old features still work."), "API testing": tech("Verifying API behaviour and contracts."), "Performance testing": tech("Measuring speed and capacity under load."),
  "Bug reporting": c("COMMUNICATION", "Clear, reproducible defect reports.", ["CONCEPT_CHECK", "WRITTEN_COMMUNICATION"]), SDLC: tech("Stages of building software."),
  "Network security": tech("Protecting networks: firewalls, segmentation, VPNs."), "OWASP Top 10": tech("The most common web application risks."), "Threat modeling": tech("Finding what could go wrong before attackers do."),
  "Incident response": tech("Detecting, containing and recovering from attacks.", { assessments: ["CONCEPT_CHECK", "PROJECT_SCENARIO"] }), "Vulnerability assessment": tech("Finding and rating weaknesses."),
  Cryptography: tech("Encryption, hashing and signatures."), IAM: tech("Identity and access management."),

  // ── Data & analytics ──
  Excel: tool("Spreadsheets: formulas, lookups, pivots, charts.", { assessments: ["CONCEPT_CHECK", "SPREADSHEET"], aliases: ["ms excel", "microsoft excel", "spreadsheets", "google sheets"] }),
  "Power BI": tool("Microsoft's BI and dashboard tool.", { assessments: ["CONCEPT_CHECK", "DATA_INTERPRETATION"] }), Tableau: tool("Visual analytics and dashboards.", { assessments: ["CONCEPT_CHECK", "DATA_INTERPRETATION"] }),
  Statistics: c("ANALYTICAL", "Distributions, sampling, inference and their pitfalls.", ["CONCEPT_CHECK", "STATISTICS"]), "Data visualization": c("ANALYTICAL", "Choosing charts that tell the truth.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"]),
  "Data cleaning": c("ANALYTICAL", "Fixing missing, duplicate and inconsistent data.", ["CONCEPT_CHECK", "DATA_INTERPRETATION", "SPREADSHEET"]),
  Joins: c("ANALYTICAL", "Combining tables correctly.", ["CONCEPT_CHECK", "SQL"], { code: true, prereqs: ["SQL"] }), Aggregation: c("ANALYTICAL", "GROUP BY, sums, averages, counts.", ["CONCEPT_CHECK", "SQL"], { code: true, prereqs: ["SQL"] }),
  "Window functions": c("ANALYTICAL", "Running totals, ranks and comparisons across rows.", ["CONCEPT_CHECK", "SQL"], { code: true, prereqs: ["Aggregation"] }),
  "Hypothesis testing": c("ANALYTICAL", "Deciding whether an effect is real.", ["CONCEPT_CHECK", "STATISTICS"], { prereqs: ["Statistics"] }), Probability: c("ANALYTICAL", "Reasoning about chance.", ["CONCEPT_CHECK", "STATISTICS"]),
  "A/B testing": c("ANALYTICAL", "Controlled experiments to compare options.", ["CONCEPT_CHECK", "STATISTICS", "PRODUCT_CASE"], { prereqs: ["Hypothesis testing"], aliases: ["ab testing", "experimentation"] }),
  "Data modeling": c("ANALYTICAL", "Structuring tables and relationships for analysis.", ["CONCEPT_CHECK", "SQL"]), KPIs: c("BUSINESS", "Key performance indicators and how to choose them.", ["CONCEPT_CHECK", "BUSINESS_CASE"], { aliases: ["kpi", "key performance indicators"] }),
  "Dashboard design": c("ANALYTICAL", "Dashboards people actually use to decide.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"], { aliases: ["dashboards"] }),
  "Business interpretation": c("BUSINESS", "Turning analysis into a recommendation.", ["BUSINESS_CASE", "DATA_INTERPRETATION"]), "Experiment design": c("ANALYTICAL", "Designing tests that give trustworthy answers.", ["CONCEPT_CHECK", "STATISTICS"], { prereqs: ["A/B testing"] }),
  "Business problem framing": c("BUSINESS", "Turning a vague question into an analysable one.", ["BUSINESS_CASE"]),
  "Cohort analysis": c("ANALYTICAL", "Comparing groups over time; retention curves.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"], { aliases: ["retention analysis"] }),
  "Funnel analysis": c("ANALYTICAL", "Where users drop off between steps.", ["CONCEPT_CHECK", "DATA_INTERPRETATION", "PRODUCT_CASE"]),

  // ── Product ──
  "Product sense": c("PRODUCT", "Understanding users and designing the right solution for them.", ["PRODUCT_CASE"], { aliases: ["product thinking", "product design sense"] }),
  "User research": c("PRODUCT", "Learning what users need: interviews, surveys, observation.", ["CONCEPT_CHECK", "PRODUCT_CASE", "DESIGN_CRITIQUE"]),
  "Problem framing": c("PRODUCT", "Defining the problem before the solution.", ["PRODUCT_CASE", "BUSINESS_CASE"]), Prioritization: c("PRODUCT", "Choosing what to do first and what not to do (RICE, impact/effort).", ["PRODUCT_CASE"], { aliases: ["prioritisation", "feature prioritization"] }),
  "Product metrics": c("PRODUCT", "North-star, input and guardrail metrics; funnels and retention.", ["CONCEPT_CHECK", "PRODUCT_CASE", "DATA_INTERPRETATION"], { aliases: ["metrics"] }),
  Roadmapping: c("PRODUCT", "Sequencing work toward outcomes over time.", ["PRODUCT_CASE"], { aliases: ["product roadmap", "roadmaps"] }), "Product strategy": c("PRODUCT", "Where to play and how to win.", ["PRODUCT_CASE"]),
  "Market analysis": c("BUSINESS", "Market size, segments, competitors and trends.", ["BUSINESS_CASE"], { aliases: ["competitor analysis", "competitive analysis", "market research"] }),
  "Stakeholder management": c("PEOPLE", "Aligning people with different goals.", ["BEHAVIOURAL"], { aliases: ["stakeholder communication"] }),
  "Writing PRDs": c("COMMUNICATION", "Clear product requirement documents.", ["WRITTEN_COMMUNICATION"], { aliases: ["prd", "product requirements"] }),
  "Go-to-market": c("BUSINESS", "Launching to the right customers with the right message.", ["BUSINESS_CASE", "MARKETING_CASE"], { aliases: ["gtm", "go to market"] }),
  "Technical fluency": c("PRODUCT", "Enough technical understanding to work well with engineers — not coding.", ["CONCEPT_CHECK"]),
  "Backlog management": c("PRODUCT", "Keeping a groomed, ordered backlog.", ["PROJECT_SCENARIO"]), "User stories": c("PRODUCT", "User stories with clear acceptance criteria.", ["WRITTEN_COMMUNICATION"], { aliases: ["acceptance criteria"] }),
  "Agile & Scrum": c("BUSINESS", "Iterative delivery: sprints, ceremonies, roles.", ["CONCEPT_CHECK", "PROJECT_SCENARIO"], { aliases: ["agile", "scrum"] }),

  // ── Business & consulting ──
  "Requirements analysis": c("BUSINESS", "Eliciting and documenting what the business needs.", ["BUSINESS_CASE", "WRITTEN_COMMUNICATION"], { aliases: ["requirements gathering", "brd", "frd"] }),
  "Process mapping": c("BUSINESS", "Documenting how work flows today and how it should.", ["BUSINESS_CASE"], { aliases: ["process modelling", "bpmn"] }),
  "Structured problem solving": c("BUSINESS", "MECE issue trees and hypothesis-driven analysis.", ["BUSINESS_CASE"], { aliases: ["case interviews", "issue trees"] }),
  "Market sizing": c("ANALYTICAL", "Estimating markets from sound assumptions.", ["BUSINESS_CASE"], { aliases: ["guesstimates", "guesstimate"] }),
  "Profitability analysis": c("BUSINESS", "Revenue and cost drivers behind profit changes.", ["BUSINESS_CASE", "FINANCE_CASE"]), "Business frameworks": c("BUSINESS", "Porter's five forces, SWOT, 3Cs — and when they don't fit.", ["CONCEPT_CHECK", "BUSINESS_CASE"]),
  "Excel modeling": c("ANALYTICAL", "Building transparent spreadsheet models.", ["SPREADSHEET"], { prereqs: ["Excel"], aliases: ["financial modelling in excel"] }),
  Synthesis: c("COMMUNICATION", "Landing on a clear recommendation from many findings.", ["BUSINESS_CASE", "WRITTEN_COMMUNICATION"], { aliases: ["recommendation", "executive summary"] }),
  "Executive communication": c("COMMUNICATION", "Saying the important thing first, briefly.", ["WRITTEN_COMMUNICATION", "BEHAVIOURAL"], { aliases: ["presentation skills", "storytelling"] }),
  "Strategic planning": c("BUSINESS", "Goals, options and plans over years, not sprints.", ["BUSINESS_CASE"]),
  "Financial analysis": c("BUSINESS", "Reading financials to judge performance.", ["FINANCE_CASE", "CONCEPT_CHECK"]),

  // ── MBA: marketing ──
  Segmentation: c("DOMAIN", "Segmentation, targeting and positioning (STP).", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["stp", "targeting", "positioning", "market segmentation"] }),
  "Consumer behaviour": c("DOMAIN", "How and why customers decide.", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["consumer behavior"] }),
  "Brand management": c("DOMAIN", "Building and protecting brand equity.", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["branding"] }),
  "Marketing mix": c("DOMAIN", "Product, price, place, promotion — and their interplay.", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["4ps", "4 ps", "7ps"] }),
  "Campaign planning": c("DOMAIN", "Objectives, audience, channels, budget and measurement.", ["MARKETING_CASE"]), "Marketing metrics": c("ANALYTICAL", "CAC, LTV, ROAS, conversion and ROI.", ["CONCEPT_CHECK", "MARKETING_CASE", "DATA_INTERPRETATION"], { aliases: ["marketing roi", "roi", "roas", "cac", "ltv"] }),
  // ── MBA: finance ──
  "Financial statements": c("DOMAIN", "P&L, balance sheet, cash flow and how they link.", ["CONCEPT_CHECK", "FINANCE_CASE"], { aliases: ["financial statement analysis"] }),
  "Ratio analysis": c("ANALYTICAL", "Liquidity, profitability, leverage and efficiency ratios.", ["CONCEPT_CHECK", "FINANCE_CASE"], { prereqs: ["Financial statements"] }),
  "Financial modeling": c("ANALYTICAL", "Three-statement and operating models.", ["SPREADSHEET", "FINANCE_CASE"], { prereqs: ["Financial statements", "Excel"], aliases: ["financial modelling"] }),
  Valuation: c("DOMAIN", "DCF, multiples and what drives value.", ["CONCEPT_CHECK", "FINANCE_CASE"], { prereqs: ["Financial statements"], aliases: ["dcf"] }),
  "Budgeting & forecasting": c("DOMAIN", "Plans, variances and rolling forecasts.", ["FINANCE_CASE", "SPREADSHEET"], { aliases: ["budgeting", "forecasting", "fp&a"] }),
  Accounting: c("DOMAIN", "Accounting principles: accruals, double entry, Ind AS/IFRS basics.", ["CONCEPT_CHECK"], { aliases: ["accounting principles"] }),
  "Corporate finance": c("DOMAIN", "Capital structure, cost of capital, investment decisions.", ["CONCEPT_CHECK", "FINANCE_CASE"]), "Working capital": c("DOMAIN", "Receivables, payables, inventory and cash cycles.", ["CONCEPT_CHECK", "FINANCE_CASE"]),
  // ── MBA: HR ──
  "Talent acquisition": c("DOMAIN", "Sourcing, screening and hiring well.", ["CONCEPT_CHECK", "HR_SCENARIO"], { aliases: ["recruitment", "recruiting", "hiring"] }),
  "Employee relations": c("PEOPLE", "Grievances, discipline and a fair workplace.", ["HR_SCENARIO"]), "Performance management": c("PEOPLE", "Goals, reviews and feedback that improve performance.", ["CONCEPT_CHECK", "HR_SCENARIO"]),
  "Compensation & benefits": c("DOMAIN", "Pay structures, benefits and equity.", ["CONCEPT_CHECK", "HR_SCENARIO"], { aliases: ["compensation", "c&b"] }),
  "Labour law": c("DOMAIN", "Employment law basics (India: the labour codes, POSH).", ["CONCEPT_CHECK", "HR_SCENARIO"], { aliases: ["labor law", "employment law"] }),
  "HR metrics": c("ANALYTICAL", "Attrition, time-to-hire, engagement and cost per hire.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"], { aliases: ["hr analytics", "people analytics"] }),
  "Learning & development": c("PEOPLE", "Training that changes how people work.", ["HR_SCENARIO"], { aliases: ["l&d", "training"] }), "Conflict resolution": c("PEOPLE", "Resolving disagreements fairly.", ["HR_SCENARIO", "BEHAVIOURAL"]),
  // ── MBA: operations ──
  "Process improvement": c("BUSINESS", "Removing waste and variation from how work gets done.", ["BUSINESS_CASE", "PROJECT_SCENARIO"], { aliases: ["process optimization"] }),
  "Lean & Six Sigma": c("DOMAIN", "Lean waste removal and Six Sigma variation reduction (DMAIC).", ["CONCEPT_CHECK", "PROJECT_SCENARIO"], { aliases: ["lean", "six sigma", "dmaic"] }),
  "Inventory management": c("DOMAIN", "EOQ, safety stock, turns and stock-outs.", ["CONCEPT_CHECK", "BUSINESS_CASE"]), "Capacity planning": c("DOMAIN", "Matching capacity to demand.", ["BUSINESS_CASE"]),
  "Operations KPIs": c("ANALYTICAL", "OTIF, throughput, utilisation, cycle time.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"]), "Quality management": c("DOMAIN", "Standards, inspection and continuous improvement.", ["CONCEPT_CHECK"]),
  "Vendor management": c("BUSINESS", "Selecting, contracting and managing suppliers.", ["BUSINESS_CASE"]),
  // ── Sales & customer success ──
  "Sales discovery": c("PEOPLE", "Questions that uncover needs, impact and decision process.", ["SALES_ROLEPLAY"], { aliases: ["discovery", "needs analysis"] }),
  Prospecting: c("PEOPLE", "Finding and opening conversations with the right buyers.", ["SALES_ROLEPLAY", "WRITTEN_COMMUNICATION"], { aliases: ["lead generation", "cold calling"] }),
  "Objection handling": c("PEOPLE", "Responding to pushback with understanding and value.", ["SALES_ROLEPLAY"]), Negotiation: c("PEOPLE", "Trading value, not just discounts.", ["SALES_ROLEPLAY", "BEHAVIOURAL"]),
  Closing: c("PEOPLE", "Moving to a committed decision.", ["SALES_ROLEPLAY"]), CRM: tool("Customer relationship management tools (Salesforce, HubSpot).", { aliases: ["salesforce", "hubspot"] }),
  "Pipeline management": c("ANALYTICAL", "Stages, conversion and forecast accuracy.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"], { aliases: ["sales forecasting", "sales pipeline"] }),
  "Sales metrics": c("ANALYTICAL", "Quota attainment, win rate, ACV, cycle length.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"]),
  "Customer onboarding": c("PEOPLE", "Getting customers to first value fast.", ["SALES_ROLEPLAY", "PROJECT_SCENARIO"]),
  "Churn & retention": c("ANALYTICAL", "Why customers leave and how to keep them.", ["CONCEPT_CHECK", "BUSINESS_CASE", "DATA_INTERPRETATION"], { aliases: ["churn", "retention"] }),
  "Account management": c("PEOPLE", "Growing relationships: renewals, upsell, account plans.", ["SALES_ROLEPLAY"], { aliases: ["renewals", "upsell", "account planning"] }),
  "Escalation handling": c("PEOPLE", "Calming and resolving unhappy customers.", ["SALES_ROLEPLAY", "BEHAVIOURAL"]),
  // ── Design ──
  "Usability testing": c("DESIGN", "Watching real users try a design.", ["CONCEPT_CHECK", "DESIGN_CRITIQUE"]), "Information architecture": c("DESIGN", "Organising content so people find it.", ["DESIGN_CRITIQUE"]),
  "Wireframing & prototyping": c("DESIGN", "Low- to high-fidelity designs to test ideas.", ["PORTFOLIO_REVIEW"], { aliases: ["wireframing", "prototyping"] }),
  "Interaction design": c("DESIGN", "How interfaces respond to people.", ["DESIGN_CRITIQUE"]), "Visual design": c("DESIGN", "Hierarchy, typography, colour and layout.", ["DESIGN_CRITIQUE", "PORTFOLIO_REVIEW"]),
  Figma: tool("Collaborative interface design tool."), "Design systems": c("DESIGN", "Reusable components and rules for consistency.", ["CONCEPT_CHECK", "DESIGN_CRITIQUE"]),
  "Design critique": c("DESIGN", "Giving and taking structured feedback on designs.", ["DESIGN_CRITIQUE"]), "Portfolio storytelling": c("COMMUNICATION", "Presenting case studies: problem, process, impact.", ["PORTFOLIO_REVIEW"], { aliases: ["portfolio", "case studies"] }),
  // ── Projects, supply chain, digital marketing ──
  "Project planning": c("BUSINESS", "Scope, schedule, resources and milestones.", ["PROJECT_SCENARIO"], { aliases: ["project management", "scheduling", "scope management"] }),
  "Risk management": c("BUSINESS", "Identifying, rating and mitigating risks.", ["PROJECT_SCENARIO"]), "Budget control": c("BUSINESS", "Tracking cost against plan.", ["PROJECT_SCENARIO", "SPREADSHEET"], { aliases: ["cost control"] }),
  "Status reporting": c("COMMUNICATION", "Honest, useful progress updates.", ["WRITTEN_COMMUNICATION"]),
  "Demand forecasting": c("ANALYTICAL", "Predicting demand from history and drivers.", ["CONCEPT_CHECK", "SPREADSHEET", "DATA_INTERPRETATION"]), Logistics: c("DOMAIN", "Moving goods: transport, warehousing, distribution.", ["CONCEPT_CHECK", "BUSINESS_CASE"]),
  Procurement: c("DOMAIN", "Buying well: sourcing, contracts, cost.", ["CONCEPT_CHECK", "BUSINESS_CASE"], { aliases: ["purchasing", "sourcing"] }),
  "Supply chain KPIs": c("ANALYTICAL", "Fill rate, lead time, inventory turns, OTIF.", ["CONCEPT_CHECK", "DATA_INTERPRETATION"]), "ERP systems": tool("SAP, Oracle and other ERP software.", { aliases: ["sap", "erp"] }),
  SEO: c("DOMAIN", "Ranking in organic search.", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["search engine optimization", "search engine optimisation"] }),
  "Performance marketing": c("DOMAIN", "Paid search and social: bidding, targeting, ROAS.", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["sem", "google ads", "paid ads", "ppc"] }),
  "Social media marketing": c("DOMAIN", "Organic and paid social for growth and brand.", ["CONCEPT_CHECK", "MARKETING_CASE"], { aliases: ["smm", "social media"] }),
  "Content marketing": c("DOMAIN", "Content that attracts and converts the right audience.", ["MARKETING_CASE", "WRITTEN_COMMUNICATION"]), "Email marketing": c("DOMAIN", "Lifecycle and campaign email.", ["MARKETING_CASE"]),
  "Marketing analytics": c("ANALYTICAL", "Attribution, funnels and campaign measurement (e.g. Google Analytics).", ["CONCEPT_CHECK", "DATA_INTERPRETATION"], { aliases: ["google analytics", "ga4", "web analytics"] }),
  "Conversion optimization": c("ANALYTICAL", "Improving conversion with tests and UX changes.", ["MARKETING_CASE", "DATA_INTERPRETATION"], { aliases: ["cro", "conversion rate optimization"] }),
  Copywriting: c("COMMUNICATION", "Persuasive, clear marketing writing.", ["WRITTEN_COMMUNICATION"]),
  // ── Cross-role ──
  Communication: c("COMMUNICATION", "Explaining clearly to the audience in front of you.", ["BEHAVIOURAL", "WRITTEN_COMMUNICATION"], { aliases: ["communication skills"] }),
  "Analytical thinking": c("ANALYTICAL", "Breaking problems down and reasoning with data.", ["BUSINESS_CASE", "DATA_INTERPRETATION"], { aliases: ["problem solving", "critical thinking"] }),
};

export interface RoleDef {
  key: string;
  family: FamilyKey;
  name: string;
  description: string;
  /** Words that identify the role in a profile, resume headline or job title. */
  aliases: string[];
  specializations?: string[];
  /** Competency names by importance. Every name must exist in COMPETENCIES. */
  required: string[];
  preferred: string[];
  optional?: string[];
  /** Override the family's code setting (e.g. Data Scientist writes code). */
  code?: boolean;
  /** Override the family's interview areas or weights. */
  areas?: Area[];
  domain?: string;
}

const SOFTWARE_BASE = ["Git", "Data structures", "Algorithms", "OOP"];

export const ROLES: RoleDef[] = [
  // ── Software & IT (the original seven keep their keys and skill lists) ──
  { key: "backend", family: "software", name: "Backend Developer", description: "Builds APIs, data stores and server-side systems.", aliases: ["backend", "back end", "server side", "api developer", "node developer", "java developer"],
    required: ["Node.js", "Express", "REST APIs", "SQL", "Databases", "HTTP", "Authentication", "Git"], preferred: ["Python", "Java", "PostgreSQL", "MySQL", "MongoDB", "Redis", "JWT", "Docker", "Testing", "REST", "Indexing", "Transactions", "Caching", "Authorization", "Concurrency", "API design", "Scalability", "System design", "Data structures", "Algorithms", "OOP", "Operating systems", "Networking", "Security"] },
  { key: "frontend", family: "software", name: "Frontend Developer", description: "Builds the interfaces people use in the browser.", aliases: ["frontend", "front end", "ui developer", "react developer", "web developer"],
    required: ["HTML", "CSS", "JavaScript", "React", "DOM", "HTTP", "Git"], preferred: ["TypeScript", "Next.js", "Redux", "Tailwind CSS", "REST APIs", "Testing", "Accessibility", "Browser rendering", "Event loop", "Closures", "Promises", "State management", "Performance", "Responsive design", "Security", "Caching", "Data structures", "Algorithms"] },
  { key: "fullstack", family: "software", name: "Full Stack Developer", description: "Works across frontend, backend and data.", aliases: ["full stack", "fullstack", "mern", "mean stack"],
    required: ["JavaScript", "React", "Node.js", "Express", "REST APIs", "SQL", "HTTP", "Git"], preferred: ["TypeScript", "Next.js", "PostgreSQL", "MongoDB", "Redis", "Authentication", "JWT", "Docker", "Testing", "REST", "Event loop", "State management", "Databases", "Indexing", "Caching", "Security", "Performance", "API design", "System design", "Data structures", "Algorithms", "OOP"] },
  { key: "sde", family: "software", name: "Software Engineer", description: "General software engineering; DSA-heavy hiring.", aliases: ["software engineer", "sde", "software developer", "swe", "programmer"],
    required: ["Data structures", "Algorithms", "OOP", "Time complexity", "Git"], preferred: ["Java", "C++", "Python", "JavaScript", "SQL", "Design patterns", "DBMS", "Operating systems", "Networking", "Concurrency", "System design", "Testing", "Recursion", "Dynamic programming"] },
  { key: "data_analyst", family: "data", name: "Data Analyst", description: "Answers business questions with SQL, spreadsheets, statistics and dashboards.", aliases: ["data analyst", "analyst", "mis analyst", "reporting analyst"],
    required: ["SQL", "Excel", "Statistics", "Data cleaning", "Data visualization", "Joins", "Aggregation", "KPIs", "Business interpretation"], preferred: ["Python", "Pandas", "Power BI", "Tableau", "Window functions", "Hypothesis testing", "Probability", "A/B testing", "Data modeling", "Dashboard design", "Communication"], optional: ["NumPy", "Cohort analysis", "Funnel analysis"] },
  { key: "devops", family: "software", name: "DevOps Engineer", description: "Builds and runs delivery pipelines and infrastructure.", aliases: ["devops", "sre", "site reliability", "cloud engineer", "platform engineer"],
    required: ["Linux", "Docker", "CI/CD", "Git", "Networking", "Containers"], preferred: ["Bash", "Kubernetes", "AWS", "Terraform", "Nginx", "Monitoring", "Python", "Orchestration", "Infrastructure as code", "Observability", "Security", "Scalability", "High availability", "Operating systems"] },
  { key: "ml_engineer", family: "software", name: "ML Engineer", description: "Builds, evaluates and deploys machine learning models.", aliases: ["ml engineer", "machine learning engineer", "ai engineer"],
    required: ["Python", "Machine learning", "Statistics", "Evaluation metrics", "NumPy", "Pandas"], preferred: ["scikit-learn", "PyTorch", "TensorFlow", "SQL", "Deep learning", "LLMs", "Docker", "Linear algebra", "Bias-variance", "Overfitting", "Regularization", "Feature engineering", "Neural networks", "Transformers", "Model deployment", "Data structures", "Algorithms"] },
  { key: "qa_engineer", family: "software", name: "QA / Test Engineer", description: "Finds defects early and automates quality checks.", aliases: ["qa", "quality assurance", "test engineer", "sdet", "tester", "automation tester"],
    required: ["Test design", "Regression testing", "API testing", "Bug reporting", "SDLC"], preferred: ["Test automation", "Selenium", "Playwright", "Cypress", "Postman", "SQL", "JIRA", "Git", "Agile & Scrum", "Performance testing", "Java", "Python"] },
  { key: "cybersecurity_analyst", family: "software", name: "Cybersecurity Analyst", description: "Protects systems: monitoring, vulnerabilities and incident response.", aliases: ["cybersecurity", "security analyst", "soc analyst", "information security", "infosec"],
    required: ["Network security", "Networking", "Incident response", "Vulnerability assessment", "OWASP Top 10", "Linux"], preferred: ["SIEM", "Wireshark", "Nmap", "Burp Suite", "Threat modeling", "Cryptography", "IAM", "Python", "Security"], code: false,
    areas: [
      { key: "FUNDAMENTALS", label: "Security fundamentals", description: "Networks, cryptography, common vulnerabilities.", weight: 0.35 },
      { key: "PRACTICAL", label: "Detection & response", description: "Investigating alerts and handling incidents.", weight: 0.35 },
      { key: "SYSTEM_DESIGN", label: "Secure design", description: "Threat modelling and defence in depth.", weight: 0.15 },
      { key: "BEHAVIOURAL", label: "Experience & behaviour", description: "Real situations told with results (STAR).", weight: 0.15 },
    ] },
  // ── Data & analytics ──
  { key: "bi_analyst", family: "data", name: "BI Analyst", description: "Builds the dashboards and data models a business runs on.", aliases: ["bi analyst", "business intelligence", "power bi developer", "tableau developer"],
    required: ["SQL", "Data modeling", "Dashboard design", "KPIs", "Power BI", "Data cleaning"], preferred: ["Tableau", "Excel", "Joins", "Aggregation", "Window functions", "Data visualization", "Requirements analysis", "Communication"] },
  { key: "data_scientist", family: "data", name: "Data Scientist", description: "Uses statistics and machine learning to predict and explain.", aliases: ["data scientist", "data science"], code: true,
    required: ["Python", "Statistics", "Machine learning", "SQL", "Hypothesis testing", "Evaluation metrics", "Feature engineering"], preferred: ["Pandas", "NumPy", "scikit-learn", "A/B testing", "Experiment design", "Data visualization", "Business problem framing", "Probability", "Communication"], optional: ["Deep learning", "PyTorch"] },
  // ── Product ──
  { key: "product_manager", family: "product", name: "Product Manager / APM", description: "Decides what to build and why, and leads it to outcomes.", aliases: ["product manager", "apm", "associate product manager", "pm", "product management"],
    required: ["Product sense", "Problem framing", "Prioritization", "Product metrics", "User research", "Stakeholder management", "Communication"], preferred: ["Product strategy", "Roadmapping", "A/B testing", "Funnel analysis", "Market analysis", "Writing PRDs", "Go-to-market", "Analytical thinking", "Technical fluency"], optional: ["SQL", "Excel", "Agile & Scrum"] },
  { key: "product_analyst", family: "product", name: "Product Analyst", description: "Measures how a product is used and what to improve.", aliases: ["product analyst", "growth analyst"],
    required: ["SQL", "Product metrics", "Funnel analysis", "Cohort analysis", "A/B testing", "Statistics"], preferred: ["Excel", "Dashboard design", "Product sense", "Hypothesis testing", "Business interpretation", "Communication"], optional: ["Python", "Tableau", "Power BI"],
    areas: [
      { key: "METRICS", label: "Metrics & analytics", description: "Funnels, cohorts, experiments, SQL reasoning.", weight: 0.4 },
      { key: "PRODUCT_SENSE", label: "Product sense", description: "What the numbers mean for users and the product.", weight: 0.3 },
      { key: "STAKEHOLDERS", label: "Communication", description: "Explaining findings and influencing decisions.", weight: 0.3 },
    ] },
  { key: "product_owner", family: "product", name: "Product Owner", description: "Owns the backlog and turns goals into deliverable increments.", aliases: ["product owner", "po"],
    required: ["Backlog management", "User stories", "Agile & Scrum", "Prioritization", "Stakeholder management"], preferred: ["Requirements analysis", "Product metrics", "Writing PRDs", "Communication", "JIRA"] },
  // ── Business & consulting ──
  { key: "business_analyst", family: "business", name: "Business Analyst", description: "Translates business needs into clear requirements and analysis.", aliases: ["business analyst", "ba", "functional analyst"],
    required: ["Requirements analysis", "Process mapping", "Stakeholder management", "Excel", "Communication"], preferred: ["SQL", "User stories", "Agile & Scrum", "Data visualization", "Business interpretation", "Analytical thinking", "JIRA"] },
  { key: "management_consultant", family: "business", name: "Management Consultant", description: "Solves clients' business problems with structured analysis.", aliases: ["consultant", "management consultant", "strategy consultant", "consulting"],
    required: ["Structured problem solving", "Market sizing", "Profitability analysis", "Synthesis", "Executive communication", "Analytical thinking"], preferred: ["Business frameworks", "Excel modeling", "Market analysis", "Financial analysis", "Stakeholder management"] },
  { key: "strategy_analyst", family: "business", name: "Strategy Analyst", description: "Supports strategic decisions with market and financial analysis.", aliases: ["strategy analyst", "corporate strategy", "business strategy"],
    required: ["Market analysis", "Business frameworks", "Financial analysis", "Excel modeling", "Synthesis"], preferred: ["Market sizing", "Strategic planning", "Structured problem solving", "Executive communication"] },
  // ── MBA specialisations ──
  { key: "marketing_manager", family: "mba", name: "Marketing Manager", description: "Owns how a product reaches and wins its customers.", aliases: ["marketing", "marketing manager", "brand manager", "product marketing", "mba marketing"], specializations: ["Brand", "Product marketing", "Growth"],
    required: ["Segmentation", "Consumer behaviour", "Marketing mix", "Brand management", "Campaign planning", "Marketing metrics"], preferred: ["Market analysis", "Go-to-market", "Marketing analytics", "Performance marketing", "Communication", "Excel"] },
  { key: "finance_analyst", family: "mba", name: "Financial Analyst", description: "Analyses performance, builds models and supports financial decisions.", aliases: ["finance", "financial analyst", "fp&a", "investment analyst", "equity research", "mba finance"], specializations: ["FP&A", "Corporate finance", "Equity research", "Banking"],
    required: ["Financial statements", "Ratio analysis", "Financial modeling", "Valuation", "Excel"], preferred: ["Budgeting & forecasting", "Accounting", "Corporate finance", "Working capital", "Excel modeling", "Communication"] },
  { key: "hr_generalist", family: "mba", name: "HR Generalist / HRBP", description: "Hiring, people processes and employee relations.", aliases: ["hr", "human resources", "hrbp", "hr generalist", "talent acquisition", "recruiter", "mba hr"], specializations: ["Talent acquisition", "HR business partner", "L&D", "Compensation"],
    required: ["Talent acquisition", "Employee relations", "Performance management", "Labour law", "Communication"], preferred: ["Compensation & benefits", "HR metrics", "Learning & development", "Conflict resolution", "Stakeholder management", "Excel"] },
  { key: "operations_manager", family: "mba", name: "Operations Manager", description: "Runs and improves how the business delivers.", aliases: ["operations", "operations manager", "ops", "mba operations"],
    required: ["Process improvement", "Operations KPIs", "Capacity planning", "Inventory management", "Excel"], preferred: ["Lean & Six Sigma", "Quality management", "Vendor management", "Project planning", "Stakeholder management"] },
  // ── Sales & customer success ──
  { key: "account_executive", family: "sales", name: "Account Executive / Sales", description: "Finds, qualifies and closes customers.", aliases: ["sales", "account executive", "business development", "bde", "inside sales", "sales executive"],
    required: ["Sales discovery", "Prospecting", "Objection handling", "Negotiation", "Closing", "Communication"], preferred: ["CRM", "Pipeline management", "Account management", "Sales metrics"] },
  { key: "sales_analyst", family: "sales", name: "Sales Analyst", description: "Tracks and forecasts sales performance.", aliases: ["sales analyst", "sales operations", "revenue operations", "revops"],
    required: ["Excel", "Sales metrics", "Pipeline management", "Dashboard design", "KPIs"], preferred: ["SQL", "CRM", "Data visualization", "Communication", "Business interpretation"] },
  { key: "customer_success_manager", family: "sales", name: "Customer Success Manager", description: "Keeps customers succeeding, renewing and growing.", aliases: ["customer success", "csm", "account manager", "client success"],
    required: ["Customer onboarding", "Account management", "Churn & retention", "Escalation handling", "Communication"], preferred: ["CRM", "Product metrics", "Stakeholder management", "Negotiation"] },
  // ── Design ──
  { key: "ux_designer", family: "design", name: "UI/UX Designer", description: "Designs usable, accessible interfaces grounded in research.", aliases: ["ux designer", "ui designer", "ui/ux", "ux", "interaction designer"],
    required: ["User research", "Usability testing", "Wireframing & prototyping", "Interaction design", "Figma", "Portfolio storytelling"], preferred: ["Information architecture", "Visual design", "Accessibility", "Design systems", "Design critique", "Communication"] },
  { key: "product_designer", family: "design", name: "Product Designer", description: "Owns design end to end, tied to product outcomes.", aliases: ["product designer"],
    required: ["User research", "Interaction design", "Visual design", "Figma", "Product sense", "Portfolio storytelling"], preferred: ["Usability testing", "Design systems", "Product metrics", "Accessibility", "Design critique", "Stakeholder management"] },
  // ── Other careers ──
  { key: "project_manager", family: "other", name: "Project Manager", description: "Delivers projects on scope, time and budget.", aliases: ["project manager", "program manager", "pmp", "project coordinator", "scrum master"],
    required: ["Project planning", "Risk management", "Stakeholder management", "Status reporting", "Agile & Scrum"], preferred: ["Budget control", "JIRA", "Communication", "Conflict resolution", "Excel"] },
  { key: "supply_chain_analyst", family: "other", name: "Supply Chain Analyst", description: "Plans and improves how goods are bought, stored and moved.", aliases: ["supply chain", "logistics", "procurement", "scm"],
    required: ["Demand forecasting", "Inventory management", "Supply chain KPIs", "Logistics", "Excel"], preferred: ["Procurement", "ERP systems", "SQL", "Process improvement", "Vendor management"] },
  { key: "digital_marketing_specialist", family: "other", name: "Digital Marketing Specialist", description: "Grows audiences and conversions through digital channels.", aliases: ["digital marketing", "performance marketer", "seo specialist", "social media manager", "growth marketer"],
    required: ["Performance marketing", "SEO", "Marketing analytics", "Marketing metrics", "Content marketing"], preferred: ["Social media marketing", "Email marketing", "Conversion optimization", "Copywriting", "A/B testing", "Excel"],
    areas: [
      { key: "DOMAIN", label: "Channels & tactics", description: "Search, social, content and email.", weight: 0.3 },
      { key: "METRICS", label: "Measurement & ROI", description: "Attribution, funnels, CAC/ROAS.", weight: 0.3 },
      { key: "SCENARIO", label: "Campaign scenarios", description: "Planning and fixing real campaigns.", weight: 0.25 },
      { key: "BEHAVIOURAL", label: "Experience & behaviour", description: "Real situations told with results (STAR).", weight: 0.15 },
    ] },
];

/** Software roles always get the DSA/OOP base unless they override it. */
export const SOFTWARE_BASE_COMPETENCIES = SOFTWARE_BASE;
