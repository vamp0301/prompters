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

/** A4 portrait, in points. The frame is drawn FRAME pt inside the paper edge; text stays well inside it. */
export const PAGE = { width: 595.28, height: 841.89 } as const;
const FRAME = 22;
const MARGINS = { top: 74, bottom: 66, left: 54, right: 54 };

// Brand palette (frontend/src/app/globals.css): ink, sage accent, terracotta; plus priority colours.
export const COLORS = {
  text: "#1f1b17", muted: "#57514a", subtle: "#9a928a", rule: "#e6e0d6", paper: "#fbf9f5", card: "#f4f1ea",
  ink: "#292521", accent: "#4e7352", accentSoft: "#e4efe3", accent2: "#b05a34",
  INTENSE: "#c2410c", IMPORTANT: "#d97706", GOOD: "#2563eb", MAY_BE_ASKED: "#6b7280",
} as const;
/** Distinct, print-friendly colours for flow steps and chart bars. */
export const PALETTE = ["#4e7352", "#2563eb", "#b05a34", "#7c3aed", "#0f766e", "#be185d", "#a16207"] as const;

// The Prompters mark (frontend/public/brand/prompters-mark-*.svg, 64×64 viewBox).
const MARK_P = "M12 4H34A18.5 18.5 0 0 1 34 41H12ZM24 16V29H34A6.5 6.5 0 0 0 34 16Z";

/** Draws the Prompters mark with its top-left at (x, y), `size` pt wide. */
export function drawMark(doc: Doc, x: number, y: number, size: number, colors: { body?: string; foot?: string } = {}) {
  const k = size / 64;
  doc.save().translate(x, y).scale(k);
  doc.path(MARK_P).fill(colors.body ?? COLORS.ink, "even-odd");
  doc.rect(12, 46, 12, 14).fill(colors.foot ?? COLORS.accent);
  doc.restore();
}

/** Very faint centred logo + wordmark, drawn first so every word on the page sits on top of it. */
function watermark(doc: Doc) {
  doc.save().opacity(0.05);
  const size = 250;
  drawMark(doc, (PAGE.width - size) / 2, PAGE.height / 2 - size * 0.72, size);
  doc.font("bold").fontSize(64).fillColor(COLORS.ink).text("PROMPTERS", 0, PAGE.height / 2 + size * 0.36, { width: PAGE.width, align: "center", lineBreak: false, characterSpacing: 6 });
  doc.restore();
}

/** Border frame, header strip and watermark: drawn on every page as it is created. */
function decorate(doc: Doc, header: string, cover: boolean) {
  const { x, y } = { x: doc.x, y: doc.y };
  watermark(doc);
  doc.save().lineWidth(0.8).strokeColor(COLORS.ink).roundedRect(FRAME, FRAME, PAGE.width - FRAME * 2, PAGE.height - FRAME * 2, 6).stroke();
  doc.lineWidth(0.4).strokeColor(COLORS.accent).roundedRect(FRAME + 4, FRAME + 4, PAGE.width - FRAME * 2 - 8, PAGE.height - FRAME * 2 - 8, 4).stroke().restore();
  if (!cover) {
    drawMark(doc, MARGINS.left, 36, 16);
    doc.font("bold").fontSize(9).fillColor(COLORS.ink).text("PROMPTERS", MARGINS.left + 21, 39.5, { lineBreak: false, characterSpacing: 1.5 });
    textAt(doc, header, { x: PAGE.width / 2, y: 40, width: PAGE.width / 2 - MARGINS.right, size: 8, color: COLORS.subtle, align: "right" });
    doc.save().moveTo(MARGINS.left, 58).lineTo(PAGE.width - MARGINS.right, 58).lineWidth(1.2).strokeColor(COLORS.accent).stroke().restore();
  }
  doc.font("regular");
  doc.x = x;
  doc.y = y;
}

export function createDoc(info: { title: string; author: string; header?: string }) {
  const doc = new PDFDocument({ size: "A4", margins: MARGINS, bufferPages: true, info: { Title: info.title, Author: info.author, Creator: "Prompters" } });
  for (const [k, file] of Object.entries(FONTS)) doc.registerFont(k, path.join(FONT_DIR, file));
  doc.font("regular");
  decorate(doc, info.header ?? info.title, true);
  doc.on("pageAdded", () => decorate(doc, info.header ?? info.title, false));
  return doc;
}

/** Text at an exact position and width (mixed scripts). Returns the y just below it. */
export function textAt(doc: Doc, text: string, o: { x: number; y: number; width: number; size?: number; bold?: boolean; color?: string; align?: "left" | "center" | "right"; lineGap?: number }) {
  const runs = fontRuns(text, o.bold);
  if (!runs.length) return o.y;
  doc.fontSize(o.size ?? 10).fillColor(o.color ?? COLORS.text);
  const bottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // positioned text must never trigger an automatic page break
  runs.forEach(([font, chunk], i) => {
    doc.font(font);
    const last = i === runs.length - 1;
    if (i === 0) doc.text(chunk, o.x, o.y, { width: o.width, continued: !last, align: o.align ?? "left", lineGap: o.lineGap ?? 1 });
    else doc.text(chunk, { continued: !last, lineGap: o.lineGap ?? 1 });
  });
  doc.page.margins.bottom = bottom;
  doc.font("regular");
  return doc.y;
}

/** Height `text` takes at `width` (measured with every font its runs use, so Devanagari isn't under-measured). */
export function textHeight(doc: Doc, text: string, width: number, size = 10, bold = false) {
  const runs = fontRuns(text, bold);
  if (!runs.length) return 0;
  doc.fontSize(size);
  const plain = runs.map((r) => r[1]).join("");
  const h = Math.max(...[...new Set(runs.map((r) => r[0]))].map((f) => doc.font(f).heightOfString(plain, { width, lineGap: 1 })));
  doc.font("regular");
  return h;
}

/** Rounded label, e.g. a priority (mixed scripts). Returns its width. */
export function pill(doc: Doc, label: string, x: number, y: number, color: string, size = 7) {
  const runs = fontRuns(label, true);
  doc.fontSize(size);
  const textW = runs.reduce((sum, [font, chunk]) => sum + doc.font(font).widthOfString(chunk), 0);
  const w = textW + 10;
  doc.save().roundedRect(x, y, w, size + 6, (size + 6) / 2).fill(color).restore();
  textAt(doc, label, { x: x + 5, y: y + 2.5, width: textW + 6, size, bold: true, color: "#ffffff" });
  return w;
}

/** Section heading with a coloured marker bar. */
export function heading(doc: Doc, text: string, o: { size?: number; color?: string } = {}) {
  const size = o.size ?? 15;
  keepTogether(doc, size * 4);
  const y = doc.y;
  doc.save().roundedRect(doc.page.margins.left, y + 1, 4, size + 3, 2).fill(o.color ?? COLORS.accent).restore();
  doc.y = textAt(doc, text, { x: doc.page.margins.left + 12, y, width: contentWidth(doc) - 12, size, bold: true, color: COLORS.ink }) + size * 0.45;
  doc.x = doc.page.margins.left;
}

export const contentWidth = (doc: Doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;

function arrow(doc: Doc, x1: number, y1: number, x2: number, y2: number, color: string) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 5;
  doc.save().lineWidth(1.4).strokeColor(color).moveTo(x1, y1).lineTo(x2 - Math.cos(a) * head, y2 - Math.sin(a) * head).stroke();
  doc.moveTo(x2, y2).lineTo(x2 - head * Math.cos(a - 0.45) * 1.6, y2 - head * Math.sin(a - 0.45) * 1.6).lineTo(x2 - head * Math.cos(a + 0.45) * 1.6, y2 - head * Math.sin(a + 0.45) * 1.6).fill(color).restore();
}

/**
 * Horizontal flow chart: coloured, numbered step boxes joined by arrows, wrapping to a second row
 * when needed. Starts at doc.y and leaves doc.y below it.
 */
export function flowChart(doc: Doc, steps: { title: string; body?: string }[], o: { perRow?: number } = {}) {
  const perRow = Math.min(o.perRow ?? 5, steps.length);
  const gap = 16;
  const left = doc.page.margins.left;
  const w = (contentWidth(doc) - gap * (perRow - 1)) / perRow;
  const pad = 7;
  const inner = w - pad * 2;
  const heightOf = (st: { title: string; body?: string }) => 20 + textHeight(doc, st.title, inner, 8.5, true) + (st.body ? 4 + textHeight(doc, st.body, inner, 7.5) : 0) + pad;
  for (let row = 0; row * perRow < steps.length; row++) {
    const items = steps.slice(row * perRow, row * perRow + perRow);
    const h = Math.max(...items.map(heightOf));
    keepTogether(doc, h + 12);
    const y = doc.y;
    items.forEach((st, i) => {
      const n = row * perRow + i;
      const color = PALETTE[n % PALETTE.length];
      const x = left + i * (w + gap);
      doc.save().roundedRect(x, y, w, h, 6).fill(COLORS.paper).restore();
      doc.save().lineWidth(1).strokeColor(color).roundedRect(x, y, w, h, 6).stroke().restore();
      doc.save().roundedRect(x, y, w, 4, 2).fill(color).restore();
      doc.save().circle(x + pad + 7, y + 15, 7).fill(color).restore();
      doc.font("bold").fontSize(8).fillColor("#ffffff").text(String(n + 1), x + pad, y + 11, { width: 14, align: "center", lineBreak: false });
      const ty = textAt(doc, st.title, { x: x + pad, y: y + 26, width: inner, size: 8.5, bold: true, color: COLORS.ink });
      if (st.body) textAt(doc, st.body, { x: x + pad, y: ty + 3, width: inner, size: 7.5, color: COLORS.muted });
      if (i < items.length - 1) arrow(doc, x + w + 2, y + h / 2, x + w + gap - 2, y + h / 2, color);
    });
    doc.y = y + h + 12;
  }
  doc.x = left;
}

/** Labelled horizontal bars (value / max), one per row. */
export function barChart(doc: Doc, rows: { label: string; value: number; color: string; note?: string }[], o: { labelWidth?: number } = {}) {
  const left = doc.page.margins.left;
  const labelW = o.labelWidth ?? 120;
  const barW = contentWidth(doc) - labelW - 40;
  const max = Math.max(1, ...rows.map((r) => r.value));
  for (const r of rows) {
    const noteH = r.note ? textHeight(doc, r.note, contentWidth(doc) - labelW, 7.5) + 2 : 0;
    keepTogether(doc, 18 + noteH);
    const y = doc.y;
    textAt(doc, r.label, { x: left, y: y + 1, width: labelW - 8, size: 8.5, bold: true, color: COLORS.ink });
    doc.save().roundedRect(left + labelW, y + 2, barW, 9, 4.5).fill(COLORS.card).restore();
    doc.save().roundedRect(left + labelW, y + 2, Math.max(9, (barW * r.value) / max), 9, 4.5).fill(r.color).restore();
    doc.font("bold").fontSize(8.5).fillColor(COLORS.ink).text(String(r.value), left + labelW + barW + 6, y + 1.5, { width: 34, lineBreak: false });
    doc.y = y + 16;
    if (r.note) doc.y = textAt(doc, r.note, { x: left + labelW, y: doc.y - 2, width: contentWidth(doc) - labelW, size: 7.5, color: COLORS.muted }) + 4;
  }
  doc.x = left;
}

/** One stacked bar showing shares of a whole, with a colour legend underneath. */
export function stackedBar(doc: Doc, parts: { label: string; value: number; color: string }[]) {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const total = Math.max(1, parts.reduce((a, p) => a + p.value, 0));
  keepTogether(doc, 44);
  const y = doc.y;
  doc.save().roundedRect(left, y, width, 14, 7).clip();
  let x = left;
  for (const p of parts) {
    const w = (width * p.value) / total;
    doc.rect(x, y, w, 14).fill(p.color);
    x += w;
  }
  doc.restore();
  let lx = left;
  const ly = y + 22;
  for (const p of parts) {
    doc.save().roundedRect(lx, ly + 1, 8, 8, 2).fill(p.color).restore();
    const label = `${p.label} ${p.value}`;
    doc.font("bold").fontSize(8);
    doc.fillColor(COLORS.ink).text(label, lx + 12, ly, { lineBreak: false });
    lx += 12 + doc.widthOfString(label) + 16;
  }
  doc.font("regular");
  doc.y = ly + 18;
  doc.x = left;
}

/** Vertical step flow: numbered coloured nodes on a connecting line, each with a title and detail. */
export function stepFlow(doc: Doc, steps: { label: string; title: string; detail?: string }[]) {
  const left = doc.page.margins.left;
  const textX = left + 40;
  const width = contentWidth(doc) - 40;
  steps.forEach((st, i) => {
    const color = PALETTE[i % PALETTE.length];
    const h = Math.max(30, textHeight(doc, st.title, width - 16, 9.5, true) + (st.detail ? textHeight(doc, st.detail, width - 16, 8) + 4 : 0) + 14);
    keepTogether(doc, h + 8);
    const y = doc.y;
    if (i < steps.length - 1) doc.save().lineWidth(2).strokeColor(COLORS.rule).moveTo(left + 13, y + 26).lineTo(left + 13, y + h + 8).stroke().restore();
    doc.save().circle(left + 13, y + 13, 13).fill(color).restore();
    doc.font("bold").fontSize(7).fillColor("#ffffff").text(st.label, left, y + 9.5, { width: 26, align: "center", lineBreak: false });
    doc.save().roundedRect(textX, y, width, h, 5).fill(COLORS.paper).restore();
    doc.save().lineWidth(0.6).strokeColor(color).roundedRect(textX, y, width, h, 5).stroke().restore();
    doc.save().rect(textX, y + 4, 3, h - 8).fill(color).restore();
    const ty = textAt(doc, st.title, { x: textX + 10, y: y + 7, width: width - 16, size: 9.5, bold: true, color: COLORS.ink });
    if (st.detail) textAt(doc, st.detail, { x: textX + 10, y: ty + 3, width: width - 16, size: 8, color: COLORS.muted });
    doc.y = y + h + 8;
  });
  doc.x = left;
}

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
    const y = doc.page.height - 48;
    doc.save().moveTo(doc.page.margins.left, y - 6).lineTo(doc.page.width - doc.page.margins.right, y - 6).lineWidth(0.5).strokeColor(COLORS.rule).stroke().restore();
    textAt(doc, label, { x: doc.page.margins.left, y, width: contentWidth(doc) - 60, size: 7.5, color: COLORS.subtle });
    doc.font("bold").fontSize(7.5).fillColor(COLORS.accent);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.text(`${i + 1} / ${range.count}`, doc.page.width - doc.page.margins.right - 60, y, { width: 60, align: "right", lineBreak: false });
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
