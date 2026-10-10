import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SolutionAnswer } from "@/features/learning/solution-answer";
import type { TutorAnswer } from "@/lib/api/types";

const base: TutorAnswer = {
  answer: "**Use a hash map.**",
  mode: "solution",
  structured: {
    answer: "Use a hash map: O(1) lookups, so the check is O(n).",
    solution: { summary: "Store each value as you scan.", steps: ["Create a set", "Check, then add"] },
    explanation: { concept: "Buckets by key.", whyItWorks: "Constant-time lookups.", tradeoffs: ["O(n) memory"] },
    examples: [{ title: "Find a duplicate", input: "[3, 1, 3]", output: "3", explanation: "3 repeats" }],
    code: [{ language: "javascript", title: "firstDuplicate.js", code: "const seen = new Set();", explanation: ["Set.has is O(1)"] }],
    diagram: { kind: "flow", title: "Duplicate check", objective: "Show the scan", steps: [{ label: "Read value" }, { label: "Seen before?" }, { label: "Return or remember" }] },
    testing: ["Empty array returns null"],
    pitfalls: ["Objects compare by reference"],
    interviewAnswer: "I'd use a hash set for O(n) time.",
    sources: ["S1"],
    assumptions: [],
    limitations: ["Assumes values are primitives"],
    nextActions: [],
  },
  sources: [{ id: "S1", topicSlug: "hashing", topicTitle: "Hashing", section: "DEFINITION" }],
  verification: { sourcesRetrieved: 3, sourcesCited: 1, inventedSources: 0, diagram: "valid", grounded: true },
};

describe("SolutionAnswer", () => {
  it("shows the solution first, then the example, code, diagram, sources and limitations", () => {
    const { container } = render(<SolutionAnswer data={base} />);
    const text = container.textContent ?? "";
    expect(text.indexOf("Use a hash map")).toBeLessThan(text.indexOf("Find a duplicate"));
    expect(text.indexOf("Find a duplicate")).toBeLessThan(text.indexOf("Why it works"));
    expect(screen.getByText("Solution")).toBeInTheDocument();
    expect(screen.getByText("const seen = new Set();")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy the whole answer" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Copy firstDuplicate.js/)).toBeInTheDocument();
    expect(screen.getAllByText(/Duplicate check/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Hashing · definition/)).toBeInTheDocument();
    expect(screen.getByText("Assumes values are primitives")).toBeInTheDocument();
  });

  it("labels hint mode and renders without optional parts", () => {
    const hints: TutorAnswer = { ...base, mode: "hints", sources: [], structured: { ...base.structured, code: [], examples: [], diagram: null, sources: [], assumptions: ["General knowledge"] } };
    const { container } = render(<SolutionAnswer data={hints} />);
    const view = within(container);
    expect(view.getByText("Hint")).toBeInTheDocument();
    expect(view.queryByText("const seen = new Set();")).toBeNull();
    expect(view.queryByText(/Based on Prompters lessons/)).toBeNull();
    expect(view.getByText("General knowledge")).toBeInTheDocument();
  });
});
