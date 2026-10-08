export type Role = "STUDENT" | "AUTHOR" | "ADMIN" | "SUPER_ADMIN";
export type Locale = "hinglish" | "en" | "hi";
export type TopicState = "COMING_SOON" | "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "MASTERED" | "NEEDS_REVIEW";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  profile: { onboardedAt: string | null; startLanguage: "PYTHON" | "JAVASCRIPT" | null; explanationLocale: Locale; goalRole: string | null; avatarUrl: string | null } | null;
  flags: Record<string, boolean>;
  hasPassword?: boolean;
}

export interface PathTopic {
  id: string;
  slug: string;
  title: string;
  estMinutes: number;
  difficulty: number;
  hasContent: boolean;
  state: TopicState;
  missingPrerequisites: { slug: string; title: string }[];
  mastery: { bestScore: number; status: string; nextReviewAt: string | null; masteredAt: string | null; recallScore: number | null } | null;
}

export interface PathStage {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  track: "COMMON" | "PYTHON" | "JAVASCRIPT";
  estHours: number;
  targetRoles: string[];
  unlocked: boolean;
  lockReason: string | null;
  passed: boolean;
  bestExamScore: number | null;
  examSlug: string | null;
  progress: { mastered: number; total: number; percent: number };
  modules: { id: string; slug: string; title: string; description: string; topics: PathTopic[] }[];
}

export interface Roadmap {
  language: "PYTHON" | "JAVASCRIPT" | null;
  stages: PathStage[];
}

export interface Section {
  type: string;
  order: number;
  content: Partial<Record<Locale, string>> & { en: string };
  codeJs: string | null;
  codePython: string | null;
}

export interface VisualStep {
  title: string;
  description: string;
  highlight?: string;
  durationMs?: number;
}

export interface Visualization {
  kind: string;
  title: string;
  steps: VisualStep[];
}

export interface TopicPage {
  comingSoon: false;
  id: string;
  slug: string;
  title: string;
  version: number;
  difficulty: number;
  estMinutes: number;
  objectives: string[];
  technicalDefinition: string | null;
  module: { slug: string; title: string };
  stage: { slug: string; code: string; title: string };
  sections: Section[];
  visualization: Visualization | null;
  prerequisites: { slug: string; title: string }[];
  state: TopicState;
  mastery: { status: string; bestScore: number; attempts: number; masteredAt: string | null; readAt: string | null; nextReviewAt: string | null } | null;
  quiz: { size: number; poolSize: number };
  buildTasks: { slug: string; title: string; estMinutes: number; difficulty: number; submission: { status: string; independenceScore: number | null } | null }[];
  promptCards: { id: string; title: string; category: string; locked: boolean; task?: string }[];
  interview: InterviewQ[];
  next: { slug: string; title: string; state: TopicState } | null;
}

export interface ComingSoonTopic {
  comingSoon: true;
  slug: string;
  title: string;
  stage: { slug: string; title: string };
}

export interface InterviewQ {
  id: string;
  question: string;
  short: string;
  deep: string;
  followUps: string[];
  commonMistake: string;
  difficulty: number;
  category?: string;
  roles?: string[];
  topic?: { slug: string; title: string } | null;
  bestScore?: number | null;
}

export type QuestionType = "MCQ" | "MULTI" | "PREDICT_OUTPUT" | "SPOT_BUG" | "FILL_CODE" | "SCENARIO" | "ORDER_STEPS" | "EXPLAIN";
export type AnswerValue = number | number[] | string | null;

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  code: string | null;
  codeLanguage: string | null;
  points: number;
  options: string[];
}

export interface AssessmentRules {
  title: string;
  durationMinutes: number;
  tabSwitchLimit: number;
  violationPolicy: "LOG" | "FLAG" | "AUTO_SUBMIT";
  blockClipboard: boolean;
  requireFullscreen: boolean;
  passingScore: number;
}

export type AttemptKind = "PLACEMENT" | "MASTERY" | "REVIEW" | "PRACTICE" | "STAGE_EXAM" | "MOCK_TEST";

export interface Attempt {
  id: string;
  kind: AttemptKind;
  status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
  topicId: string | null;
  startedAt: string;
  expiresAt: string | null;
  draftAnswers: Record<string, AnswerValue>;
  questions: QuizQuestion[];
  assessment?: AssessmentRules | null;
  result?: AttemptResult;
}

export interface GradedQuestion {
  questionId: string;
  topicId: string;
  prompt: string;
  code: string | null;
  type: QuestionType;
  options: string[];
  correct: boolean;
  earned: number;
  points: number;
  answer: AnswerValue;
  correctAnswer: number[] | null;
  explanation: string;
  matched?: string[];
  missing?: string[];
}

export interface AttemptResult {
  id: string;
  kind: AttemptKind;
  status: string;
  score: number | null;
  passed: boolean | null;
  flagged: boolean;
  integrityScore: number | null;
  timed: boolean;
  questions: GradedQuestion[];
  effects?: Record<string, unknown>;
}

export interface Readiness {
  score: number;
  status: string;
  role: string;
  factors: Record<"mastery" | "projects" | "dsa" | "recall" | "interview" | "resume", number>;
  weights: Record<string, number>;
  areas: { key: string; label: string; value: number }[];
  weakestAreas: { key: string; label: string; value: number }[];
  nextActions: { label: string; href: string; reason: string }[];
  history: { score: number; createdAt: string }[];
  sevenDaysAgo: number | null;
  thirtyDaysAgo: number | null;
}

export interface Dashboard {
  user: { name: string; onboarded: boolean; placementDone: boolean; language: string | null; goalRole: string | null };
  readiness: Readiness;
  plan: { key: string; label: string; href: string; minutes: number; done: boolean }[];
  continue: { topic: { slug: string; title: string; state: TopicState }; module: string; stage: { slug: string; title: string; percent: number } } | null;
  weakAreas: { key: string; label: string; value: number }[];
  dueReviews: number;
  recentBuilds: { slug: string; title: string; status: string; independenceScore: number | null; projectScore: number | null }[];
  streak: { current: number; activeDays: number; activeToday: boolean };
  totals: { mastered: number; available: number };
}

export interface TestView {
  name: string;
  hidden: boolean;
  passed: boolean;
  args?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

export interface BuildTask {
  slug: string;
  title: string;
  description: string;
  functionName: string;
  difficulty: number;
  estMinutes: number;
  topic: { slug: string; title: string } | null;
  starter: { javascript: string; python: string };
  publicTests: { name: string; args: unknown[]; expected: unknown }[];
  hiddenTestCount: number;
  hints: { total: number; revealed: string[] };
  hintPenalties: number[];
  explainQuestions: string[] | null;
  submission: {
    language: "javascript" | "python";
    code: string;
    status: "IN_PROGRESS" | "TESTS_PASSED" | "COMPLETED";
    hintsUsed: number;
    runs: number;
    submits: number;
    passedCount: number;
    totalCount: number;
    testResult: { tests: TestView[]; output: string; stderr: string } | null;
    explainScore: number | null;
    independenceScore: number;
    projectScore: number | null;
    completedAt: string | null;
  } | null;
  ai: { chat: boolean; autocomplete: boolean };
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ───────────────────────── Practice, reviews, build, projects ───────────────────────── */

export type MasteryStatus = "LEARNING" | "MASTERED" | "NEEDS_REVIEW";

/** Row from GET /reviews/due (Mastery + topic). */
export interface MasteryRow {
  topicId: string;
  status: MasteryStatus;
  bestScore: number;
  lastScore: number | null;
  attempts: number;
  masteredAt: string | null;
  reviewStep: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  recallScore: number | null;
  topic: { slug: string; title: string };
}

export interface ReviewsDue {
  due: MasteryRow[];
  upcoming: MasteryRow[];
}

export type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "TESTS_PASSED" | "COMPLETED";

/** Item from GET /build-tasks. */
export interface BuildTaskSummary {
  slug: string;
  title: string;
  difficulty: number;
  estMinutes: number;
  topic: { slug: string; title: string } | null;
  stage: { slug: string; title: string } | null;
  locked: boolean;
  status: WorkStatus;
  independenceScore: number | null;
  projectScore: number | null;
}

/** Item from GET /projects. */
export interface ProjectSummary {
  slug: string;
  rung: number;
  title: string;
  description: string;
  skills: string[];
  technologies: string[];
  difficulty: number;
  unlocked: boolean;
  comingSoon: boolean;
  status: WorkStatus;
  independenceScore: number | null;
  explainScore: number | null;
}

export interface HowIBuiltIt {
  approach: string;
  bugFixed: string;
  tradeoff: string;
}

export interface ProjectSubmissionRecord {
  id: string;
  repoUrl: string;
  liveUrl: string | null;
  howIBuiltIt: HowIBuiltIt;
  explainAnswers: { question: string; answer: string; score: number }[];
  explainScore: number;
  milestonesDone: number;
  hintsUsed: number;
  independenceScore: number;
  status: Exclude<WorkStatus, "NOT_STARTED">;
  createdAt: string;
  updatedAt: string;
}

/** GET /projects/:slug */
export interface ProjectDetail {
  id: string;
  slug: string;
  rung: number;
  title: string;
  description: string;
  skills: string[];
  technologies: string[];
  requirements: string[];
  milestones: { title: string; description: string }[];
  explainQuestions: string[];
  hints: { total: number; revealed: string[] };
  stageSlug: string | null;
  difficulty: number;
  status: string;
  unlocked: boolean;
  submission: ProjectSubmissionRecord | null;
}

export interface ProjectSubmitResult {
  submission: ProjectSubmissionRecord;
  complete: boolean;
  feedback: { question: string; score: number; missing: string[] }[];
  reason: string | null;
}

export interface ProjectHintResult {
  level: number;
  revealed: string[];
  independenceScore: number;
}

/* ───────────────────────── Prompts & interviews ───────────────────────── */

export interface PromptSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  topic: { slug: string; title: string };
  task: string | null;
  unlocked: boolean;
  favorite: boolean;
  rating: { average: number; count: number } | null;
}

export interface PromptDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  task: string;
  whenToUse: string;
  template: string;
  variables: { key: string; label: string }[];
  whyItWorks: { part: string; why: string }[];
  verifyChecklist: string[];
  sampleOutput: string;
  version: number;
  topic: { slug: string; title: string };
  favorite: boolean;
  myRating: number | null;
}

export interface InterviewList extends Paged<InterviewQ> {
  categories: { category: string; count: number }[];
}

export interface InterviewPracticeResult {
  score: number;
  matched: string[];
  missing: string[];
  modelShort: string;
  modelDeep: string;
  followUps: string[];
  commonMistake: string;
}

/* ───────────────────────── Assessments ───────────────────────── */

/** Item from GET /assessments. */
export interface AssessmentSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: "STAGE_EXAM" | "MOCK_TEST";
  durationMinutes: number;
  questionCount: number;
  passingScore: number;
  maxAttempts: number | null;
  tabSwitchLimit: number;
  violationPolicy: "LOG" | "FLAG" | "AUTO_SUBMIT";
  blockClipboard: boolean;
  requireFullscreen: boolean;
  stage: { slug: string; title: string; track: string } | null;
  attemptsUsed: number;
  bestScore: number | null;
}

/** Item from GET /attempts (finished attempts only, newest first, max 50). */
export interface AttemptSummary {
  id: string;
  kind: AttemptKind;
  score: number | null;
  passed: boolean | null;
  flagged: boolean;
  integrityScore: number | null;
  startedAt: string;
  finishedAt: string | null;
  topic: { slug: string; title: string } | null;
  assessment: { title: string } | null;
}

/* ───────────────────────── Journey ───────────────────────── */

export interface Journey {
  milestones: { label: string; at: string | null }[];
  stages: { slug: string; title: string; code: string; percent: number; mastered: number; total: number; passed: boolean }[];
  stats: {
    topicsMastered: number;
    topicsLearning: number;
    quizzesTaken: number;
    quizzesFailed: number;
    reviewsDone: number;
    reviewsFailed: number;
    buildsCompleted: number;
    hintsUsed: number;
    avgIndependence: number | null;
    interviewPractice: number;
    mockTests: number;
    estLearningMinutes: number;
    streak: { current: number; activeDays: number; activeToday: boolean };
  };
  forgotten: { slug: string; title: string; recallScore: number | null }[];
  strong: { slug: string; title: string; score: number }[];
  readiness: { score: number; createdAt: string }[];
}

export interface JourneyEvent {
  id: string;
  type: string;
  topicId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  topic: { id: string; slug: string; title: string } | null;
}

/* ───────────────────────── Applications & profile ───────────────────────── */

export type ApplicationStatus = "APPLIED" | "ASSESSMENT" | "TECHNICAL" | "HR" | "OFFER" | "REJECTED" | "WITHDRAWN";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  round: string | null;
  appliedAt: string | null;
  nextStepAt: string | null;
  interviewAt: string | null;
  result: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoalRole = "BACKEND" | "FRONTEND" | "FULLSTACK" | "DEVOPS" | "SDE" | "AI";
export type CodingLevel = "ZERO" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface UserProfileRecord {
  avatarUrl: string | null;
  education: string | null;
  year: number | null;
  codingLevel: CodingLevel | null;
  startLanguage: "PYTHON" | "JAVASCRIPT" | null;
  explanationLocale: Locale;
  goalRole: GoalRole | null;
  targetCompanies: string[];
  targetSalary: string | null;
  targetDate: string | null;
  weeklyHours: number | null;
  skills: string[];
  goals: string | null;
  headline: string | null;
  summary: string | null;
  links: Record<string, string> | null;
  onboardedAt: string | null;
  placementCompletedAt: string | null;
  updatedAt: string;
}

/** GET /profile */
export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  profile: UserProfileRecord | null;
}

/* ───────────────────────── Public curriculum ───────────────────────── */

export interface PublicStage {
  slug: string;
  code: string;
  title: string;
  description: string;
  track: "COMMON" | "PYTHON" | "JAVASCRIPT";
  estHours: number;
  targetRoles: string[];
  modules: { slug: string; title: string; description: string; topics: { slug: string; title: string; available: boolean }[] }[];
}

// ───────────────────────── Admin ─────────────────────────

export type ContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "COMING_SOON" | "ARCHIVED";

export interface AdminDashboard {
  totals: {
    users: number;
    newUsers7d: number;
    activeUsers7d: number;
    learningHours: number;
    topicsMastered: number;
    quizAttempts: number;
    masteryRate: number | null;
    projectSubmissions: number;
    avgReadiness: number | null;
    integrityEvents: number;
    flaggedAttempts: number;
    aiUsage: number;
    retention7d: number | null;
  };
  daily: { day: string; active: number; signups: number; quizzes: number; avgScore: number | null }[];
  readinessDistribution: { range: string; users: number }[];
  hardestTopics: { slug: string; title: string; avg: number; attempts: number }[];
  mostFailedQuestions: { questionId: string; prompt: string | null; wrong: number; total: number }[];
  mostAbandonedTopics: { slug: string; title: string; learners: number }[];
  popularBuilds: { slug: string; title: string; submissions: number }[];
}

export interface ContentHealth {
  totals: { topics: number; withContent: number; complete: number; incomplete: number; published: number; comingSoon: number };
  languages: { hinglish: number; en: number; hi: number };
  coverage: { quiz: number; quizPool3x: number; build: number; interview: number; visual: number; prompt: number; code: number };
  incomplete: {
    id: string;
    slug: string;
    title: string;
    status: ContentStatus;
    stage: { code: string; title: string };
    module: string;
    percent: number;
    missing: { label: string; required: boolean }[];
  }[];
}

export interface AdminSearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface AdminStage {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  track: "COMMON" | "PYTHON" | "JAVASCRIPT";
  order: number;
  estHours: number;
  targetRoles: string[];
  icon: string | null;
  color: string | null;
  status: ContentStatus;
  _count: { modules: number };
}

export interface AdminModule {
  id: string;
  stageId: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  difficulty: number;
  status: ContentStatus;
  stage: { slug: string; title: string; code: string };
  _count: { topics: number };
}

export interface CompletenessCheck {
  key: string;
  label: string;
  ok: boolean;
  required: boolean;
}

export interface Completeness {
  percent: number;
  checks: CompletenessCheck[];
  missingRequired: string[];
  publishable: boolean;
}

export interface AdminTopicRow {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  publishedVersion: number;
  updatedAt: string;
  module: { title: string; stage: { code: string; title: string } };
  completeness: number;
  missing: string[];
  counts: { questions: number; buildTasks: number; interviewQs: number; promptCards: number };
}

export interface AdminQuestion {
  id: string;
  topicId: string;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  code: string | null;
  codeLanguage: "javascript" | "python" | null;
  options: string[] | null;
  correct: number[] | null;
  keywords: string[];
  explanation: string;
  tags: string[];
  points: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  topic?: { slug: string; title: string };
}

export interface AdminSection {
  id?: string;
  type: string;
  order: number;
  content: Record<string, string>;
  codeJs: string | null;
  codePython: string | null;
}

export interface TopicSnapshot {
  slug: string;
  title: string;
  difficulty: number;
  estMinutes: number;
  objectives: string[];
  technicalDefinition: string | null;
  module: { slug: string; title: string };
  stage: { slug: string; code: string; title: string };
  sections: AdminSection[];
  visualization: { kind: string; title: string; steps: VisualStep[] } | null;
  prerequisites: { slug: string; title: string }[];
}

export interface AdminTopicDetail {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  order: number;
  difficulty: number;
  estMinutes: number;
  objectives: string[];
  technicalDefinition: string | null;
  tags: string[];
  status: ContentStatus;
  publishedVersion: number;
  quizSize: number;
  createdAt: string;
  updatedAt: string;
  sections: AdminSection[];
  visualization: { id: string; topicId: string; kind: string; title: string; steps: VisualStep[] } | null;
  module: { id: string; slug: string; title: string; stage: { id: string; slug: string; code: string; title: string } };
  prerequisites: { topicId: string; prerequisiteId: string; prerequisite: { slug: string; title: string } }[];
  versions: { version: number; createdAt: string; publishedById: string | null; note: string | null }[];
  questions: AdminQuestion[];
  buildTasks: { id: string; slug: string; title: string; status: ContentStatus }[];
  promptCards: { id: string; slug: string; title: string; status: ContentStatus }[];
  interviewQs: { id: string; question: string; status: ContentStatus }[];
  completeness: Completeness;
}

export interface AdminTopicVersion {
  id: string;
  topicId: string;
  version: number;
  snapshot: TopicSnapshot;
  publishedById: string | null;
  note: string | null;
  createdAt: string;
}

export interface CodeFailure {
  section: string;
  language: string;
  error: string;
}

export interface AdminTestCase {
  name: string;
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface AdminExplainQ {
  question: string;
  keywords: string[];
}

export interface AdminBuildTask {
  id: string;
  slug: string;
  topicId: string | null;
  title: string;
  description: string;
  functionName: string;
  starterJs: string;
  starterPython: string;
  tests: AdminTestCase[];
  hints: string[];
  explainQuestions: AdminExplainQ[];
  difficulty: number;
  estMinutes: number;
  status: ContentStatus;
  updatedAt: string;
  topic: { slug: string; title: string } | null;
  _count: { submissions: number };
}

export interface AdminProject {
  id: string;
  slug: string;
  rung: number;
  title: string;
  description: string;
  skills: string[];
  technologies: string[];
  requirements: string[];
  milestones: { title: string; description: string }[];
  explainQuestions: AdminExplainQ[];
  hints: string[];
  stageSlug: string | null;
  difficulty: number;
  status: ContentStatus;
  updatedAt: string;
  _count: { submissions: number };
}

export interface AdminPromptCard {
  id: string;
  slug: string;
  topicId: string;
  title: string;
  category: string;
  task: string;
  whenToUse: string;
  template: string;
  variables: { key: string; label: string }[];
  whyItWorks: { part: string; why: string }[];
  verifyChecklist: string[];
  sampleOutput: string;
  version: number;
  status: ContentStatus;
  updatedAt: string;
  topic: { slug: string; title: string };
  _count: { favorites: number; ratings: number };
}

export interface AdminInterviewQ {
  id: string;
  topicId: string | null;
  category: string;
  question: string;
  short: string;
  deep: string;
  followUps: string[];
  commonMistake: string;
  keywords: string[];
  difficulty: number;
  roles: string[];
  status: ContentStatus;
  updatedAt: string;
  topic: { slug: string; title: string } | null;
}

export interface AdminAssessment {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: "STAGE_EXAM" | "MOCK_TEST" | "PLACEMENT" | "PRACTICE";
  stageId: string | null;
  topicSlugs: string[];
  durationMinutes: number;
  questionCount: number;
  passingScore: number;
  maxAttempts: number | null;
  tabSwitchLimit: number;
  violationPolicy: "LOG" | "FLAG" | "AUTO_SUBMIT";
  blockClipboard: boolean;
  requireFullscreen: boolean;
  status: ContentStatus;
  updatedAt: string;
  stage: { slug: string; title: string } | null;
  _count: { attempts: number };
}

export interface TranslationRow {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  coverage: Record<string, number>;
}

export interface IntegrityRow {
  id: string;
  kind: AttemptKind;
  score: number | null;
  passed: boolean | null;
  flagged: boolean;
  integrityScore: number | null;
  startedAt: string;
  finishedAt: string | null;
  user: { id: string; name: string; email: string };
  assessment: { title: string } | null;
  integrityEvents: { type: string; createdAt: string }[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastActiveAt: string | null;
  profile: { startLanguage: "PYTHON" | "JAVASCRIPT" | null; goalRole: string | null } | null;
  readiness: { score: number }[];
  _count: { masteries: number };
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastActiveAt: string | null;
  googleId: boolean;
  profile: Record<string, unknown> | null;
  masteries: {
    topicId: string;
    status: "LEARNING" | "MASTERED" | "NEEDS_REVIEW";
    bestScore: number;
    lastScore: number | null;
    attempts: number;
    masteredAt: string | null;
    nextReviewAt: string | null;
    recallScore: number | null;
    updatedAt: string;
    topic: { slug: string; title: string };
  }[];
  quizAttempts: {
    id: string;
    kind: AttemptKind;
    score: number | null;
    passed: boolean | null;
    flagged: boolean;
    integrityScore: number | null;
    startedAt: string;
    topic: { title: string } | null;
    assessment: { title: string } | null;
    _count: { integrityEvents: number };
  }[];
  submissions: {
    id: string;
    language: string;
    status: string;
    hintsUsed: number;
    passedCount: number;
    totalCount: number;
    independenceScore: number | null;
    projectScore: number | null;
    updatedAt: string;
    buildTask: { slug: string; title: string };
  }[];
  projectSubmissions: { id: string; repoUrl: string; liveUrl: string | null; explainScore: number; independenceScore: number; status: string; createdAt: string; project: { title: string } }[];
  readiness: { score: number; createdAt: string }[];
  events: { id: string; type: string; topicId: string | null; meta: unknown; createdAt: string }[];
  applications: { id: string; company: string; role: string; status: string; round: string | null; appliedAt: string | null; result: string | null }[];
}

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  userIds: string[];
  updatedAt: string | null;
}

export interface ScoringConfig {
  masteryThreshold: number;
  reviewIntervalsDays: number[];
  stageExamPassingScore: number;
  stageGating: boolean;
  topicGating: boolean;
  quiz: { masterySize: number; reviewSize: number; practiceSize: number };
  hintPenalties: [number, number, number];
  minExplainScore: number;
  projectScoreWeights: { tests: number; explanation: number; independence: number };
  readinessWeights: { mastery: number; projects: number; dsa: number; recall: number; interview: number; resume: number };
  integrityPenaltyPerEvent: number;
}

export interface ScoringResponse {
  active: ScoringConfig;
  defaults: ScoringConfig;
  versions: { id: string; version: number; config: Partial<ScoringConfig>; active: boolean; createdById: string | null; note: string | null; createdAt: string }[];
}

export interface AuditLogRow {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
  actor: { email: string; name: string };
}

// ───────────────────────── Career intelligence (AI interview) ─────────────────────────

export type QuestionCategory = "IMPORTANT" | "GOOD" | "BETTER" | "MAY_BE_ASKED" | "CONCEPTUAL";
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
export type InterviewLanguage = "hinglish" | "en" | "hi";

export interface Interviewer {
  name: string;
  role: string;
  company: string;
  tone: string;
  thinkingSeconds: number;
  answerSeconds: number;
  problemSeconds?: number;
  codingSeconds: number;
}

export interface CareerStatus {
  available: boolean;
  reason: "NO_PROVIDER" | "FEATURE_DISABLED" | null;
  interviewer: Interviewer;
  matchWeights: Record<string, number>;
}

export interface BankQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  level: number;
  skill: string;
  claimId?: string | null;
  why: string;
}

export interface JobMatchDetail {
  id: string;
  score: number;
  breakdown: Record<"requiredSkills" | "technicalStack" | "experience" | "projects" | "keywords" | "responsibilities" | "education", number>;
  weights: Record<string, number>;
  strong: string[];
  missing: string[];
  risks: { severity: RiskLevel; message: string }[];
  claims: { id: string; claim: string; source: string; skills: string[]; risk: RiskLevel; why: string }[];
  questions: BankQuestion[];
  createdAt: string;
  job: { id: string; title: string; company: string | null; parsed: Record<string, unknown> };
  resume: { id: string; label: string; parsed: Record<string, unknown> };
  sessions: { id: string; status: InterviewStatus; readinessScore: number | null; result: string | null; startedAt: string }[];
}

export type InterviewStatus = "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "ENDED_INTEGRITY" | "ABANDONED";
/** QUESTION = main question · FOLLOW_UP = probe on the last answer · REPEAT = asked again (unclear transcript)
 *  CODING = editor + tests · PROBLEM = explain-your-approach problem (code execution off). */
export type InterviewTurnKind = "QUESTION" | "FOLLOW_UP" | "REPEAT" | "CODING" | "PROBLEM";
export type InterviewArea = "RESUME" | "PROJECTS" | "FUNDAMENTALS" | "ROLE" | "PRACTICAL" | "PROBLEM_SOLVING" | "SYSTEM_DESIGN";
export type InterviewDifficulty = "STANDARD" | "HARD";
export interface InterviewDimensions {
  overall: number | null;
  technical: number | null;
  projectUnderstanding: number | null;
  problemSolving: number | null;
  practicalEngineering: number | null;
  communication: number | null;
}

export interface InterviewTurnView {
  id: string;
  order: number;
  kind: InterviewTurnKind;
  lead: string | null;
  question: string;
  skill: string;
  category: string;
  area: InterviewArea | null;
  level: number;
  answered: boolean;
  /** An answer saved before it could be evaluated (restored after a refresh or failed attempt). */
  savedAnswer: string | null;
  coding: {
    functionName: string;
    starter: { javascript: string; python: string };
    publicTests: { name: string; args: unknown[]; expected: unknown }[];
    hiddenTestCount: number;
  } | null;
  timing: { thinkingSeconds: number; answerSeconds: number };
}

export interface InterviewReport {
  readiness: number;
  result: { key: "INTERVIEW_READY" | "NEEDS_IMPROVEMENT" | "NOT_YET_READY"; label: string };
  insufficientEvidence: boolean;
  counts: { total: number; correct: number; partial: number; incorrect: number; skipped: number; unclear?: number };
  communication: number | null;
  /** Added with the Manisha upgrade; older reports don't have the fields below. */
  dimensions?: InterviewDimensions;
  coverage?: { area: InterviewArea; label: string; planned: number; asked: number; score: number | null }[];
  strongQuestions?: { question: string; skill: string; score: number }[];
  needsWork?: { question: string; skill: string; score: number }[];
  claimsDefended?: string[];
  claimsToStrengthen?: string[];
  assessment?: string;
  recommendedQuestions?: { id: string; planId: string; question: string; skill: string; priority: string }[];
  revisionPlan?: { day: number; focus: string; detail: string }[];
  readinessChange?: { before: number | null; after: number | null; improved: string[]; declined: string[] };
  areas: { skill: string; score: number; questions: number }[];
  answeredWell: string[];
  struggled: string[];
  nextSteps: { label: string; href: string }[];
  integrity: { signals: Record<string, number>; total: number; screenShareWarnings: number; status: string };
  disclaimer: string;
}

export interface InterviewTurnResult {
  id: string;
  order: number;
  kind: InterviewTurnKind;
  question: string;
  skill: string;
  category: string;
  area?: InterviewArea | null;
  excluded?: boolean;
  level: number;
  answerText: string | null;
  answerCode: string | null;
  codeLanguage: string | null;
  codeResult: { passed: number; total: number; review?: { understanding: number; practical: number; communication: number; timeComplexity: string; spaceComplexity: string; edgeCases: string[]; codeQuality: string[] }; tests?: { name: string; passed: boolean; hidden: boolean }[] } | null;
  skipped: boolean;
  durationSec: number | null;
  hasAudio: boolean;
  evaluation: {
    correctness: number; completeness: number; understanding: number; practical: number; communication: number;
    depth?: number; reasoning?: number;
    verdict: "CORRECT" | "PARTIAL" | "INCORRECT" | "NO_ANSWER" | "UNCLEAR";
    conceptsMentioned: string[]; missingConcepts: string[]; unsupportedClaims: string[];
  } | null;
  score: number;
}

export interface InterviewSessionView {
  id: string;
  status: InterviewStatus;
  language: InterviewLanguage;
  mode?: "JOB" | "ROLE";
  difficulty?: InterviewDifficulty;
  targetRole?: string | null;
  pausedAt?: string | null;
  resumeId?: string | null;
  /** The candidate's recording choice: null = not asked yet. */
  recordAudio?: boolean | null;
  durationMinutes: number;
  questionTarget: number;
  startedAt: string;
  endedAt: string | null;
  endsAt: string;
  screenShareWarnings: number;
  interviewer: Interviewer;
  job: { title: string; company: string | null };
  matchId: string | null;
  progress: { answered: number; target: number };
  current: InterviewTurnView | null;
  readinessScore: number | null;
  result: string | null;
  report: InterviewReport | null;
  turns: InterviewTurnResult[];
}

export interface CareerResume {
  id: string;
  label: string;
  fileName?: string | null;
  parsed: { headline?: string | null; skills?: Partial<Record<string, string[]>> } | null;
  createdAt: string;
}

export interface CareerJob {
  id: string;
  title: string;
  company: string | null;
  parsed: Record<string, unknown> | null;
  createdAt: string;
}

export interface CareerAnalysisItem {
  id: string;
  score: number;
  createdAt: string;
  job: { title: string; company: string | null };
  resume: { label: string };
  _count: { sessions: number };
}

export interface CareerSessionItem {
  id: string;
  status: InterviewStatus;
  readinessScore: number | null;
  result: string | null;
  startedAt: string;
  endedAt: string | null;
  matchId: string | null;
  targetRole: string | null;
  difficulty: InterviewDifficulty;
  durationMinutes: number;
  match: { job: { title: string; company: string | null } } | null;
  /** Job title, or the target role for role-only interviews. */
  role: string;
  dimensions: InterviewDimensions | null;
}

export interface StartInterviewResponse {
  id: string;
  interviewer: Interviewer;
  intro: string;
  current: InterviewTurnView;
  progress: { answered: number; target: number };
  endsAt: string;
}

// ───────────────────────── Top-100 interview preparation ─────────────────────────

export type PrepCategory = "GENERAL" | "SKILL" | "PROJECT" | "CLAIM" | "ACHIEVEMENT" | "CONCEPTUAL" | "SCENARIO";
export type PrepPriority = "INTENSE" | "IMPORTANT" | "GOOD" | "MAY_BE_ASKED";
export type PrepStatus = "QUEUED" | "RUNNING" | "READY" | "FAILED";
export type PrepPracticeStatus = "NEW" | "PRACTICED" | "CONFIDENT";
export type PrepPackVariant = "QUESTIONS" | "HINTS" | "GUIDE" | "TOPICS";
export type PrepPackLanguage = "en" | "hinglish" | "hi";
type StepState = "pending" | "running" | "done" | "failed";

export interface PrepMeta {
  roles: { key: string; label: string }[];
  total: number;
  defaultAllocation: Record<PrepCategory, number>;
  categories: Record<PrepCategory, string>;
}

export interface PrepPlanItem {
  id: string;
  title: string;
  status: PrepStatus;
  targetRole: string | null;
  createdAt: string;
  completedAt: string | null;
  resume: { label: string };
  job: { title: string; company: string | null } | null;
  _count: { questions: number };
}

export interface PrepPackItem {
  id: string;
  variant: PrepPackVariant;
  language: PrepPackLanguage;
  status: PrepStatus;
  error: string | null;
  createdAt: string;
}

export interface PrepPlanDetail {
  id: string;
  title: string;
  status: PrepStatus;
  targetRole: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  allocation: Partial<Record<PrepCategory, number>>;
  validation: { generated: number; accepted: number; adjusted: number; rejected: Record<string, number> } | null;
  /** Experience band the questions are pitched at (null for plans made before the ladder). */
  band: PrepBand | null;
  progress: {
    resume: { state: StepState; chunks?: number };
    /** Skill and project names found on the resume (shown while it is read). */
    skills: { state: StepState; count?: number; names?: string[] };
    projects: { state: StepState; count?: number; names?: string[] };
    categories: Partial<Record<PrepCategory, { target: number; done: number; state: StepState }>>;
    level?: { band: PrepBand; label: string; months: number };
    stages?: { stage: PrepStage; label: string; target: number; done: number; published: number; state: StepState }[];
    fresh?: { previousPlans: number; repeated: number };
    dedupe?: { state: StepState; removed?: number };
    ranking: { state: StepState };
  };
  resume: { id: string; label: string };
  job: { id: string; title: string; company: string | null } | null;
  packs: PrepPackItem[];
  practice: Partial<Record<PrepPracticeStatus, number>>;
  /** Questions visible so far (stages are published one by one). */
  published: number;
}

export type PrepBand = "STUDENT" | "JUNIOR" | "MID" | "SENIOR";
/** Ladder stage: 1 Basics, 2 Core, 3 Advanced (0 = plans made before stages). */
export type PrepStage = 0 | 1 | 2 | 3;

/** One card in the paged list (hint, key points and follow-ups load with the question). */
export type PrepQuestionItem = Pick<
  PrepQuestion,
  "id" | "rank" | "stage" | "category" | "priority" | "question" | "skill" | "probability" | "difficulty" | "followUpDepth" | "why" | "sourceType" | "sourceLabel" | "status"
> & {
  /** Present with sort=personal: this student's score and machine-readable reasons. */
  personal?: { score: number; reasons: string[] };
};

export interface PrepQuestionPage {
  items: PrepQuestionItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
  published: number;
  generating: boolean;
  facets: {
    stages: Partial<Record<string, number>>;
    priorities: Partial<Record<PrepPriority, number>>;
    categories: Partial<Record<PrepCategory, number>>;
    statuses: Partial<Record<PrepPracticeStatus, number>>;
    skills: { skill: string; count: number }[];
  };
}

export interface PrepQuestion {
  id: string;
  rank: number;
  stage: PrepStage;
  category: PrepCategory;
  priority: PrepPriority;
  question: string;
  skill: string;
  probability: number;
  difficulty: number;
  followUpDepth: number;
  why: string;
  evidence: string;
  sourceType: string;
  sourceLabel: string;
  hint: string;
  keyPoints: string[];
  followUps: string[];
  status: PrepPracticeStatus;
}

export interface PrepEvaluation {
  correctness: number;
  completeness: number;
  understanding: number;
  practical: number;
  communication: number;
  verdict: "CORRECT" | "PARTIAL" | "INCORRECT" | "NO_ANSWER";
  conceptsMentioned: string[];
  missingConcepts: string[];
  unsupportedClaims: string[];
  followUp: { needed: boolean; question?: string | null };
}

export interface PrepAttempt {
  id: string;
  answer: string;
  score: number;
  evaluation: PrepEvaluation;
  createdAt: string;
}

export interface PrepQuestionDetail extends PrepQuestion {
  source: {
    chunk: { id: string; type: string; title: string; text: string; technologies: string[] } | null;
    claim: { id: string; claim: string; evidence: string; risk: string; depth: number } | null;
  };
  attempts: PrepAttempt[];
}

export interface PrepPracticeResult {
  attempt: PrepAttempt;
  status: PrepPracticeStatus;
  keyPoints: string[];
  followUps: string[];
}

export interface PrepUsage {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string | null;
}

export interface CareerOverview {
  resume: null | {
    id: string;
    label: string;
    createdAt: string;
    analyzed: boolean;
    name: string | null;
    headline: string | null;
    experienceMonths: number;
    skills: { languages: string[]; frameworks: string[]; databases: string[]; cloud: string[]; devops: string[]; other: string[] } | null;
    projects: { name: string; description: string; technologies: string[] }[];
    experience: { role: string; company: string; months: number | null }[];
    education: { degree: string; institution: string; year?: string | null }[];
    achievements: string[];
    claims: { id: string; claim: string; evidence: string; risk: "HIGH" | "MEDIUM" | "LOW"; skills: string[] }[];
    claimCount: number;
  };
  plan: null | {
    id: string;
    title: string;
    status: PrepStatus;
    createdAt: string;
    total: number;
    byPriority: Partial<Record<PrepPriority, number>>;
    byCategory: Partial<Record<PrepCategory, number>>;
    practice: Partial<Record<PrepPracticeStatus, number>>;
    intense: { id: string; rank: number; question: string; skill: string; category: PrepCategory }[];
    topics: { topic: string; total: number; confident: number }[];
  };
  match: null | { id: string; score: number; missing: string[]; strong: string[]; job: { title: string; company: string | null } };
  interview: null | { id: string; readinessScore: number; result: string | null; startedAt: string };
}

export interface ResumeSkillList {
  resume: { id: string; label: string } | null;
  planId?: string | null;
  groups: { group: string; skills: { name: string; key: string; usedIn: string[]; questions: number; confident: number; guideReady: boolean }[] }[];
}

export interface SkillGuide {
  name: string;
  key: string;
  locale: "en" | "hinglish" | "hi";
  content: {
    summary: string;
    howItWorks: string[];
    realWorld: { where: string; how: string }[];
    implementation: { steps: string[]; code?: { language: string; snippet: string } | null };
    perks: string[];
    drawbacks: string[];
    whenToUse: string[];
    whenNotToUse: string[];
    alternatives: { name: string; whenBetter: string }[];
    mistakes: string[];
    interviewTips: string[];
    /** How the skill works end to end (guides made before diagrams have none). */
    flow?: Diagram;
  };
  usedIn: { name: string; description: string }[];
  planId: string | null;
  questions: { id: string; rank: number; question: string; priority: PrepPriority; status: PrepPracticeStatus; skill: string }[];
}

// ───────────────────────── Skill Intelligence: knowledge maps & concept chapters ─────────────────────────

export type ConceptImportance = "MUST" | "GOOD" | "ADVANCED";
export type ConceptStatus = "LEARNING" | "UNDERSTOOD" | "MASTERED";

export interface ConceptRef {
  key: string;
  title: string;
  difficulty: number;
  frequency: number;
  importance: ConceptImportance;
  prerequisites: string[];
}

export interface SkillMapContent {
  summary: string;
  domains: { key: string; title: string; concepts: ConceptRef[] }[];
  related: string[];
}

export interface SkillMapView {
  skill: { key: string; name: string; curated: boolean; source: string };
  map: SkillMapContent;
  progress: Record<string, { status: ConceptStatus; explainScore: number | null }>;
  stats: { concepts: number; started: number; understood: number; mastered: number; mustKnow: number; mustKnowMastered: number; averageExplain: number | null };
  domains: { key: string; mastered: number; total: number }[];
  claims: { id: string; claim: string; evidence: string; risk: string; depth: number; drill: { id: string; planId: string; question: string; difficulty: number; status: string }[] }[];
}

export interface KnowledgeTracks {
  tracks: { key: string; name: string; concepts: number; domains: number; started: number; mastered: number }[];
  skills: { key: string; name: string; concepts: number | null; started: number; mastered: number }[];
}

type DiagramBase = { title: string; objective: string; alt?: string; walkthrough?: { label: string; highlight?: string }[] };
export type Diagram =
  | (DiagramBase & { kind: "architecture"; layers: { label?: string; nodes: { label: string; note?: string }[] }[] })
  | (DiagramBase & { kind: "flow"; steps: { label: string; note?: string; branches?: { label: string; steps: string[] }[] }[] })
  | (DiagramBase & { kind: "comparison"; left: { title: string; points: string[] }; right: { title: string; points: string[] } })
  | (DiagramBase & { kind: "timeline"; actors: string[]; events: { from: string; to: string; label: string }[] })
  | (DiagramBase & { kind: "state"; states: string[]; transitions: { from: string; to: string; label?: string }[] })
  | (DiagramBase & { kind: "decision"; question: string; branches: { answer: string; result?: string; question?: string; branches?: { answer: string; result: string }[] }[] });

export interface ConceptContent {
  _v?: number;
  oneLine: string;
  explainLikeNew?: string;
  why: { problem: string; solution: string; tradeoff: string };
  mentalModel: { analogy: string; explanation: string };
  visuals: Diagram[];
  howItWorks: string[];
  deepDives?: { title: string; body: string; points: string[]; visual?: Diagram }[];
  realWorld: { where: string; how: string }[];
  code: { language: string; snippet: string; explanation: string } | null;
  /** Why there's no code ("Code is not the best way to understand this concept."). */
  codeNote?: string | null;
  tradeoffs?: string[];
  quiz?: { question: string; options: string[]; answer: number; explanation: string }[];
  explainTask?: string;
  whenToUse: string[];
  whenNotToUse: string[];
  advantages: string[];
  disadvantages: string[];
  mistakes: { wrong: string; right: string }[];
  levels: { level: number; question: string; hint: string }[];
  keyPoints: string[];
  internals: string[];
  interviewerExpects: string[];
  cheatSheet: { definition: string; useFor: string[]; remember: string[]; interviewQuestion: string };
}

export interface ConceptChapter {
  skill: { key: string; name: string; curated: boolean };
  domain: { key: string; title: string };
  concept: Omit<ConceptRef, "prerequisites"> & { prerequisites: { key: string; title: string }[] };
  content: ConceptContent;
  locale: "en" | "hinglish" | "hi";
  progress: { status: ConceptStatus; explainScore: number | null; explainAttempts: number };
  prev: { key: string; title: string } | null;
  next: { key: string; title: string } | null;
  unlocks: { key: string; title: string }[];
}

export interface ExplainResult {
  score: number;
  mastered: boolean;
  masteryScore: number;
  evaluation: { correctness: number; completeness: number; depth: number; clarity: number; covered: string[]; missing: string[]; incorrect: string[]; unnecessary: string[]; feedback: string };
  progress: { status: ConceptStatus; explainScore: number | null; explainAttempts: number };
}

// ───────────────────────── Personalization engine ─────────────────────────

export interface PersonalRec {
  id: string;
  action: "LEARN_TOPIC" | "TAKE_QUIZ" | "REVISE_TOPIC" | "REVISIT_PREREQUISITE" | "PRACTICE_SKILL" | "PRACTICE_QUESTION" | "FINISH_BUILD" | "LEARN_CONCEPT";
  actionLabel: string;
  itemType: string;
  itemId: string;
  title: string;
  subject: string;
  href: string;
  score: number;
  rank: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  difficulty: "easy" | "medium" | "hard" | null;
  reasons: { code: string; label: string }[];
  /** Built from the reasons and real numbers — never model-written. */
  why: string;
  modelName: string;
  modelVersion: string;
}

export interface PersonalSkillState {
  conceptId: string;
  label: string;
  kind: "topic" | "skill";
  mastery: number;
  confidence: number;
  forgettingRisk: number;
  attempts: number;
  correctAttempts: number;
  lastSeen: string | null;
  nextReview: string | null;
  interviewAverage: number | null;
  jobRelevance: number | null;
}

export interface PersonalEngine {
  mode: "ml" | "baseline";
  modelStatus: string;
  /** Rollout arm: baseline-arm students are never ranked by the model (comparison group). */
  arm: "ml" | "baseline";
  modelName: string;
  modelVersion: string;
}

export interface PersonalNext {
  next: PersonalRec | null;
  engine: PersonalEngine | null;
  coldStart: boolean;
  evidence: number;
  difficulty: { level: "easy" | "medium" | "hard"; status: "learned" | "cold_start"; trend: "increase" | "decrease" | "hold"; confidence: number | null } | null;
  skillGaps: PersonalSkillState[];
  dueRevisions: PersonalSkillState[];
  interviewWeaknesses: PersonalSkillState[];
  recommendedPractice: PersonalRec[];
}
