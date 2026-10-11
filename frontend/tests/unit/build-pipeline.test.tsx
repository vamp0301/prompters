import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProjectDetail, ProjectPipeline } from "@/lib/api/types";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a) }, ApiError: class extends Error {} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const { BuildPipeline } = await import("@/features/projects/build-pipeline");

const project = { slug: "todo-api", unlocked: true } as unknown as ProjectDetail;
const stage = (key: string, title: string, extra: object = {}) => ({
  key, title, goal: `${title} goal`, dependsOn: [], covers: [1], tasks: [`Do ${title}`], acceptance: [{ id: `${key}-1`, text: `${title} works` }],
  status: "TODO", blockedBy: [], evidence: {}, solutionViewed: false, solution: null, ...extra,
});
const pipeline = (over: Partial<ProjectPipeline> = {}): ProjectPipeline => ({
  status: "READY", error: null, current: "core", stale: false, done: 1, total: 3, requirements: ["Store todos"], updatedAt: "2026-10-11T00:00:00Z",
  stages: [stage("setup", "Setup", { status: "DONE" }), stage("core", "Core logic", { dependsOn: ["setup"] }), stage("api", "HTTP API", { dependsOn: ["core"], blockedBy: ["core"] })] as ProjectPipeline["stages"],
  ...over,
});
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><BuildPipeline project={project} /></QueryClientProvider>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BuildPipeline", () => {
  it("offers to make a plan when there is none", async () => {
    get.mockResolvedValue({ pipeline: null });
    post.mockResolvedValue({ pipeline: pipeline({ status: "QUEUED", stages: [], total: 0, done: 0, current: null }) });
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Make my build plan/ }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/projects/todo-api/pipeline", { regenerate: false }));
    expect(await screen.findByText(/Building your plan/)).toBeInTheDocument();
  });

  it("shows progress, resumes at the current stage, and blocks stages whose dependencies aren't done", async () => {
    get.mockResolvedValue({ pipeline: pipeline() });
    mount();
    expect(await screen.findByText("Resume here")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
    const api = screen.getByText("HTTP API").closest("details")!;
    expect(within(api).getByText(/Needs first: Core logic/)).toBeInTheDocument();
    expect(within(api).getByRole("button", { name: "Mark stage done" })).toBeDisabled();
  });

  it("sends the student's evidence when marking a stage done", async () => {
    get.mockResolvedValue({ pipeline: pipeline() });
    patch.mockResolvedValue({ pipeline: pipeline({ done: 2 }) });
    mount();
    const core = (await screen.findByText("Core logic")).closest("details")!;
    fireEvent.change(within(core).getByLabelText("Evidence: Core logic works"), { target: { value: "Ran the unit tests: 4 passed" } });
    fireEvent.click(within(core).getByRole("button", { name: "Mark stage done" }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/projects/todo-api/pipeline/stages/core", { status: "DONE", evidence: { "core-1": { note: "Ran the unit tests: 4 passed", url: undefined } } }));
  });

  it("warns that opening a solution counts like a hint, and shows it once opened", async () => {
    get.mockResolvedValue({ pipeline: pipeline() });
    mount();
    const core = (await screen.findByText("Core logic")).closest("details")!;
    expect(within(core).getByText(/counts like a hint/)).toBeInTheDocument();
    cleanup();
    const opened = pipeline();
    opened.stages[1] = { ...opened.stages[1], solutionViewed: true, solution: { summary: "Use a Map", steps: ["Create it"], code: [{ language: "javascript", title: "core.js", code: "const todos = new Map();", explanation: [] }], diagram: null, pitfalls: [] } };
    get.mockResolvedValue({ pipeline: opened });
    mount();
    expect(await screen.findByText("const todos = new Map();")).toBeInTheDocument();
  });

  it("explains a failed build and offers a retry", async () => {
    get.mockResolvedValue({ pipeline: pipeline({ status: "FAILED", error: "Couldn't build a usable plan for this project.", stages: [], total: 0, done: 0, current: null }) });
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn't build a usable plan/);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
