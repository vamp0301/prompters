import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseVoice } from "@/features/career/live/voice-core";
import { answerScript, chunks } from "@/features/learning/read-aloud";
import { SolutionAnswer } from "@/features/learning/solution-answer";
import type { TutorAnswer } from "@/lib/api/types";

const voices = [
  { name: "Daniel", lang: "en-GB" },
  { name: "Rishi", lang: "en-IN" },
  { name: "Veena", lang: "en-IN" },
  { name: "Lekha", lang: "hi-IN" },
];
const structured: TutorAnswer["structured"] = {
  answer: "Use a **line chart** for trends.", solution: { summary: "", steps: ["Check the X axis"] }, explanation: { concept: "Shapes are fast to read.", whyItWorks: "", tradeoffs: [] },
  examples: [{ title: "Revenue", input: "Jan–Mar", output: "Upward line", explanation: "" }],
  code: [{ language: "python", title: "plot.py", code: "SECRET_CODE_SHOULD_NOT_BE_READ()", explanation: [] }],
  diagram: null, testing: [], pitfalls: [], interviewAnswer: "I pick line charts for continuous time.", followUps: [{ question: "Missing dates?", answer: "Resample first." }],
  sources: [], assumptions: [], limitations: [], nextActions: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("read aloud", () => {
  it("prefers an Indian-English female voice, and a Hindi voice for Hindi script", () => {
    expect(chooseVoice(voices)?.voice.name).toBe("Veena");
    expect(chooseVoice(voices, "hi-in")?.voice.name).toBe("Lekha");
  });

  it("reads the answer, steps, example, interview answer and follow-ups — never the code", () => {
    const s = answerScript(structured);
    expect(s).toContain("Use a line chart for trends."); // markdown stripped
    expect(s).toContain("Step 1. Check the X axis");
    expect(s).toContain("Input: Jan–Mar");
    expect(s).toContain("In an interview, you can say");
    expect(s).toContain("Follow-up question: Missing dates?");
    expect(s).not.toContain("SECRET_CODE");
  });

  it("splits long text into short chunks without breaking words", () => {
    const parts = chunks(`${"word ".repeat(120)}end. Next sentence.`, 100);
    expect(parts.every((p) => p.length <= 100)).toBe(true);
    expect(parts.join(" ").replace(/\s+/g, " ")).toContain("end. Next sentence.");
  });

  it("Listen speaks with the chosen voice; Stop cancels", () => {
    const spoken: SpeechSynthesisUtterance[] = [];
    const synth = { getVoices: () => voices, speak: vi.fn((u: SpeechSynthesisUtterance) => spoken.push(u)), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    vi.stubGlobal("speechSynthesis", synth);
    vi.stubGlobal("SpeechSynthesisUtterance", class { text: string; voice: unknown; lang = ""; rate = 1; onend: (() => void) | null = null; onerror: (() => void) | null = null; constructor(t: string) { this.text = t; } });
    const data: TutorAnswer = { answer: "x", mode: "solution", structured, sources: [], verification: { sourcesRetrieved: 0, sourcesCited: 0, inventedSources: 0, diagram: "none", grounded: false } };
    render(<SolutionAnswer data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Listen to this answer" }));
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect((spoken[0] as unknown as { voice: { name: string } }).voice.name).toBe("Veena");
    expect(spoken[0].text).toContain("line chart");
    fireEvent.click(screen.getByRole("button", { name: "Stop reading" }));
    expect(synth.cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Listen to this answer" })).toBeInTheDocument();
  });
});
