import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) }, ApiError: class extends Error {} }));
vi.mock("../../src/features/career/live/use-voice", () => ({ useDictation: () => ({}) }));
const { FullAnswer } = await import("@/features/career/prep/question-dialog");

const structured = {
  answer: "Classify by OSI layer, deployment and algorithm.", solution: { summary: "", steps: [] }, explanation: { concept: "", whyItWorks: "", tradeoffs: [] },
  examples: [{ title: "Example", input: "3 servers", output: "even spread", explanation: "" }], code: [], diagram: null, testing: [], pitfalls: [], interviewAnswer: "",
  followUps: [{ question: "What if the LB fails?", answer: "Run two in active-passive." }], sources: [], assumptions: [], limitations: [], nextActions: [],
};
const entry = (status: string, extra: object = {}) => ({ fullAnswer: { status, error: null, language: "hinglish", at: "2026-10-11T00:00:00Z", ...extra } });
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><FullAnswer planId="p1" questionId="q1" /></QueryClientProvider>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FullAnswer", () => {
  it("offers the full answer, then shows that it is being written", async () => {
    get.mockResolvedValue({ fullAnswer: null });
    post.mockResolvedValue(entry("QUEUED"));
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Full answer/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/career/prep/p1/questions/q1/full-answer", { regenerate: false }));
    expect(await screen.findByText(/Writing the complete answer/)).toBeInTheDocument();
  });

  it("shows a saved answer straight away, with its follow-ups", async () => {
    get.mockResolvedValue(entry("READY", { structured, sources: [], verification: { sourcesRetrieved: 0, sourcesCited: 0, inventedSources: 0, diagram: "none", grounded: false }, answer: "md" }));
    mount();
    expect(await screen.findByText(/Classify by OSI layer/)).toBeInTheDocument();
    expect(screen.getByText("What if the LB fails?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Write a fresh one" })).toBeInTheDocument();
  });

  it("explains a failure and offers to try again", async () => {
    get.mockResolvedValue(entry("FAILED", { error: "The AI service is busy or unavailable right now." }));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/busy or unavailable/);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
