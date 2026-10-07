import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
import PDFDocument from "pdfkit";

/**
 * Small layout layer over pdfkit. The Latin font has no Devanagari glyphs and the
 * Devanagari font no Latin ones, so text is split into runs by glyph coverage and each
 * run is drawn with a font that has it (fontkit does the Devanagari shaping).
 */

const require = createRequire(import.meta.url);
const fontkit = require("fontkit") as { openSync(p: string): { hasGlyphForCodePoint(cp: number): boolean } };

// src/modules/prep (tsx) and dist/src/modules/prep (build) both resolve to backend/assets/fonts.
const here = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = [path.resolve(here, "../../../assets/fonts"), path.resolve(here, "../../../../assets/fonts")].find((d) => existsSync(d)) ?? path.resolve("assets/fonts");
const FONTS = {
  regular: "NotoSans-Regular.ttf",
  bold: "NotoSans-Bold.ttf",
  deva: "NotoSansDevanagari-Regular.ttf",
  devaBold: "NotoSansDevanagari-Bold.ttf",
  symbols: "NotoSansSymbols2-Regular.ttf",
} as const;
type FontKey = keyof typeof FONTS;

type Coverage = Record<FontKey, { hasGlyphForCodePoint(cp: number): boolean }>;
let coverage: Coverage | undefined;
function fonts(): Coverage {
  coverage ??= Object.fromEntries(Object.entries(FONTS).map(([k, f]) => [k, fontkit.openSync(path.join(FONT_DIR, f))])) as Coverage;
  return coverage;
}

const FALLBACK: Record<string, string> = { "→": "->", "←": "<-", "⇒": "=>", "↔": "<->", "≥": ">=", "≤": "<=", "≠": "!=", "…": "..." };

/** Splits text into [font, text] runs. Spaces and punctuation stay with the current run. */
export function fontRuns(text: string, bold = false): [FontKey, string][] {
  const f = fonts();
  const latin: FontKey = bold ? "bold" : "regular";
  const deva: FontKey = bold ? "devaBold" : "deva";
  const runs: [FontKey, string][] = [];
  for (const raw of text) {
    let ch = raw;
    const cp = ch.codePointAt(0)!;
    let font: FontKey;
    if (/\s/.test(ch)) font = runs.at(-1)?.[0] ?? latin;
    else if (cp >= 0x0900 && cp <= 0x097f) font = deva;
    else if (f[latin].hasGlyphForCodePoint(cp)) font = latin;
    else if (f[deva].hasGlyphForCodePoint(cp)) font = deva;
    else if (f.symbols.hasGlyphForCodePoint(cp)) font = "symbols";
    else {
      ch = FALLBACK[ch] ?? (cp === 0x200c || cp === 0x200d ? ch : "");
      font = cp === 0x200c || cp === 0x200d ? deva : latin;
      if (!ch) continue;
    }
    const last = runs.at(-1);
    if (last && last[0] === font) last[1] += ch;
    else runs.push([font, ch]);
  }
  return runs;
}

export type Doc = PDFKit.PDFDocument;

export function createDoc(info: { title: string; author: string }) {
  const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 56, right: 56 }, bufferPages: true, info: { Title: info.title, Author: info.author, Creator: "Prompters" } });
  for (const [k, file] of Object.entries(FONTS)) doc.registerFont(k, path.join(FONT_DIR, file));
  doc.font("regular");
  return doc;
}

export const COLORS = { text: "#111827", muted: "#4b5563", subtle: "#9ca3af", accent: "#059669", rule: "#e5e7eb", INTENSE: "#dc2626", IMPORTANT: "#ea580c", GOOD: "#2563eb", MAY_BE_ASKED: "#6b7280" } as const;

/** Writes mixed-script text as one flowing paragraph. */
export function write(doc: Doc, text: string, opts: { size?: number; bold?: boolean; color?: string; indent?: number; gap?: number; align?: "left" | "center" } = {}) {
  const runs = fontRuns(text, opts.bold);
  if (!runs.length) return;
  doc.fontSize(opts.size ?? 10).fillColor(opts.color ?? COLORS.text);
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right - (opts.indent ?? 0);
  const x = doc.page.margins.left + (opts.indent ?? 0);
  runs.forEach(([font, chunk], i) => {
    doc.font(font);
    const last = i === runs.length - 1;
    if (i === 0) doc.text(chunk, x, doc.y, { width, continued: !last, align: opts.align ?? "left", lineGap: 1.5 });
    else doc.text(chunk, { continued: !last, lineGap: 1.5 });
  });
  doc.font("regular");
  if (opts.gap) doc.moveDown(opts.gap);
}

export function rule(doc: Doc, gap = 0.6) {
  doc.moveDown(gap / 2);
  const y = doc.y;
  doc.save().moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).lineWidth(0.6).strokeColor(COLORS.rule).stroke().restore();
  doc.moveDown(gap / 2);
}

/** Starts a new page when fewer than `needed` points remain, so a question never splits from its heading. */
export function keepTogether(doc: Doc, needed: number) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

export function footer(doc: Doc, label: string) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font("regular").fontSize(8).fillColor(COLORS.subtle);
    doc.text(`${label} · ${i + 1} / ${range.count}`, doc.page.margins.left, doc.page.height - 36, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "center", lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
}

export function toBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    doc.on("data", (b: Buffer) => parts.push(b));
    doc.on("end", () => resolve(Buffer.concat(parts)));
    doc.on("error", reject);
    doc.end();
  });
}
