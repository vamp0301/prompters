import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagramView } from "@/features/knowledge/diagram";
import { SolutionAnswer } from "@/features/learning/solution-answer";
import type { Diagram, TutorAnswer } from "@/lib/api/types";

vi.mock("motion/react", async (orig) => ({ ...(await orig<typeof import("motion/react")>()), useReducedMotion: () => false }));

const diagram = {
  kind: "flow", title: "Duplicate check", objective: "Show the scan",
  steps: [{ label: "Read next value" }, { label: "Seen before?" }, { label: "Return it" }],
  walkthrough: [{ label: "Take the next number", highlight: "Read next value" }, { label: "Look it up", highlight: "Seen before?" }, { label: "Return or store it", highlight: "Return it" }],
} as Diagram;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("animated diagram walkthrough", () => {
  it("plays through every step, highlighting each part, then offers a replay", () => {
    vi.useFakeTimers();
    render(<DiagramView diagram={diagram} />);
    expect(screen.getByText("Take the next number")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
    act(() => void vi.advanceTimersByTime(2400));
    expect(screen.getByText("Look it up")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(2400));
    expect(screen.getByText("Return or store it")).toBeInTheDocument();
    // The highlighted node is marked active.
    expect(document.querySelector('[data-active="true"]')?.textContent).toContain("Return it");
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByText("Take the next number")).toBeInTheDocument();
  });

  it("stops playing when the student steps manually", () => {
    vi.useFakeTimers();
    render(<DiagramView diagram={diagram} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByText("Look it up")).toBeInTheDocument();
  });
});

describe("full answer follow-ups", () => {
  it("shows follow-up questions with their answers", () => {
    const data: TutorAnswer = {
      answer: "x", mode: "solution", sources: [], verification: { sourcesRetrieved: 0, sourcesCited: 0, inventedSources: 0, diagram: "valid", grounded: false },
      structured: { answer: "Use a set.", solution: { summary: "", steps: [] }, explanation: { concept: "", whyItWorks: "", tradeoffs: [] }, examples: [], code: [], diagram, testing: [], pitfalls: [], interviewAnswer: "", followUps: [{ question: "What if memory is limited?", answer: "Sort first." }], sources: [], assumptions: [], limitations: [], nextActions: [] },
    };
    render(<SolutionAnswer data={data} />);
    expect(screen.getByText("Follow-up questions")).toBeInTheDocument();
    expect(screen.getByText("What if memory is limited?")).toBeInTheDocument();
    expect(screen.getByText("Sort first.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
});
