import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Markdown } from "@/components/ui/markdown";
import { Progress, ScoreRing } from "@/components/ui/progress";

describe("Markdown", () => {
  it("renders formatting but never raw HTML from content", () => {
    const { container } = render(<Markdown>{"**API** ek waiter hai <img src=x onerror=alert(1)>"}</Markdown>);
    expect(screen.getByText("API").tagName).toBe("STRONG");
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("Progress", () => {
  it("clamps and exposes an accessible value", () => {
    render(<Progress value={140} label="Stage" />);
    expect(screen.getByRole("progressbar", { name: "Stage" })).toHaveAttribute("aria-valuenow", "100");
  });
  it("ScoreRing announces the score", () => {
    render(<ScoreRing value={78} label="Readiness" />);
    expect(screen.getByLabelText("Readiness: 78 out of 100")).toBeInTheDocument();
  });
});
