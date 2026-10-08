/**
 * Every editable string on the landing page. Defaults live here; a Super Admin can override any
 * field from Admin → Website, and the page merges those overrides on top of these defaults.
 */
export interface LandingContent {
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    titleTail: string;
    lede: string;
    primaryCta: string;
    secondaryCta: string;
    steps: [string, string, string];
  };
  upload: {
    tape: string;
    noteLine1: string;
    noteLine2: string;
    title: string;
    subtitle: string;
    dropTitle: string;
    dropHint: string;
    button: string;
    finePrint: string;
  };
  loop: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    cards: { title: string; text: string }[];
  };
  top100: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    cta: string;
    sample: { meta: string; question: string; why: string; resume: string };
  };
  finalCta: {
    eyebrow: string;
    line1: string;
    accent: string;
    button: string;
  };
  footer: { tagline: string };
  announcement: { enabled: boolean; text: string; linkLabel: string; linkHref: string };
}

export const DEFAULT_LANDING: LandingContent = {
  hero: {
    eyebrow: "✦ Interview prep built around you",
    titleLead: "Prepare for",
    titleAccent: "your",
    titleTail: "interview.",
    lede: "Learn it. Build it without AI. Explain it when it counts.",
    primaryCta: "Start preparing",
    secondaryCta: "See how it works",
    steps: ["Upload your resume", "Get your Top 100", "Practise & interview"],
  },
  upload: {
    tape: "Start here",
    noteLine1: "no busywork",
    noteLine2: "just progress",
    title: "Build your interview picture",
    subtitle: "Drop a resume here. We'll pull out the questions worth your time.",
    dropTitle: "Choose a resume",
    dropHint: "PDF or TXT · Max 5 MB",
    button: "Continue with a free account",
    finePrint: "Your resume stays yours. Delete it anytime.",
  },
  loop: {
    eyebrow: "The Prompters loop",
    title: "Not another course.",
    titleAccent: "A practice system.",
    cards: [
      { title: "Learn", text: "Understand the idea before you reach for a shortcut." },
      { title: "Build", text: "Make it work with AI switched off." },
      { title: "Explain", text: "Say what you built in words that hold up." },
      { title: "Prove", text: "Use fresh questions to find your real gaps." },
    ],
  },
  top100: {
    eyebrow: "Personalised question plan",
    title: "Your Top 100.",
    titleAccent: "The questions that matter.",
    body: "Questions from your resume, ranked by the kind of conversation an interviewer will actually have with you.",
    cta: "Explore your Top 100",
    sample: {
      meta: "Intense · Project · JWT",
      question: "How does authentication work in your project, and where is the token verified?",
      why: "Interviewers want to see that your implementation matches your explanation.",
      resume: "Built a secure Node.js API with JWT.",
    },
  },
  finalCta: {
    eyebrow: "Your next chapter",
    line1: "Your interview won't ask what you studied.",
    accent: "It will ask what you can explain.",
    button: "Prepare for my interview",
  },
  footer: { tagline: "Prepare for your interview — learn it, build it, explain it." },
  announcement: { enabled: false, text: "", linkLabel: "", linkHref: "" },
};

/** Deep-merges saved overrides onto the defaults, ignoring anything with the wrong shape. */
export function mergeLanding(saved: unknown): LandingContent {
  const merge = (base: unknown, over: unknown): unknown => {
    if (Array.isArray(base)) {
      if (!Array.isArray(over)) return base;
      return base.map((b, i) => (i < over.length ? merge(b, over[i]) : b));
    }
    if (base && typeof base === "object") {
      if (!over || typeof over !== "object" || Array.isArray(over)) return base;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(base)) out[k] = merge(v, (over as Record<string, unknown>)[k]);
      return out;
    }
    return typeof over === typeof base ? over : base;
  };
  return merge(DEFAULT_LANDING, saved) as LandingContent;
}
