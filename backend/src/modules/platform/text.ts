/** Keyword rubric used for "explain in your words", explain-your-code and interview practice. */
export function keywordScore(answer: string, keywords: string[]) {
  const text = ` ${answer.toLowerCase().replace(/[^\p{L}\p{N}+#./ -]+/gu, " ")} `;
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of keywords) {
    const variants = kw.toLowerCase().split("|").map((v) => v.trim()).filter(Boolean);
    const hit = variants.some((v) => text.includes(v) || stem(v).length > 3 && text.includes(stem(v)));
    (hit ? matched : missing).push(kw);
  }
  const needed = Math.max(1, Math.ceil(keywords.length / 2));
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  // Very short answers can't demonstrate understanding even if they name-drop keywords.
  const lengthFactor = wordCount >= 8 ? 1 : wordCount / 8;
  const score = keywords.length === 0 ? (wordCount >= 8 ? 100 : 0) : Math.min(1, matched.length / needed) * 100 * lengthFactor;
  return { score: Math.round(score), matched, missing };
}

function stem(word: string) {
  return word.replace(/(ing|ed|es|s)$/, "");
}
