import { describe, expect, it } from "vitest";
import { pageWindow } from "@/components/ui/pagination";

describe("pageWindow", () => {
  it("shows first, last and neighbours of the current page with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 5)).toEqual([1, 2, "…", 5]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(5, 5)).toEqual([1, "…", 4, 5]);
    expect(pageWindow(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
  });
});
