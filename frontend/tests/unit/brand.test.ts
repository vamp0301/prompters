import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARK } from "@/components/brand/brand-mark";

// The favicon, app icons and downloadable SVGs are static files: they must keep the mark's exact geometry.
const FILES = ["src/app/icon.svg", ...["mark-black", "mark-white", "mark-accent", "mark-accent-dark", "app-icon", "app-icon-white"].map((f) => `public/brand/prompters-${f}.svg`)];

describe("brand files", () => {
  it.each(FILES)("%s uses the same bubble and cursor as <BrandMark>", (file) => {
    const svg = readFileSync(path.join(__dirname, "../..", file), "utf8");
    expect(svg).toContain(`d="${MARK.bubble}"`);
    const { x, y, width, height } = MARK.cursor;
    expect(svg).toContain(`x="${x}" y="${y}" width="${width}" height="${height}"`);
  });
});
