"use client";
import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Tabs } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface RunResult { stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; durationMs: number }
type Lang = "javascript" | "python";

export function CodePlayground({ codeJs, codePython, defaultLanguage, topicSlug }: { codeJs: string | null; codePython: string | null; defaultLanguage: Lang; topicSlug: string }) {
  const available: Lang[] = [codePython ? "python" : null, codeJs ? "javascript" : null].filter(Boolean) as Lang[];
  const [lang, setLang] = useState<Lang>(available.includes(defaultLanguage) ? defaultLanguage : available[0]);
  const original = { javascript: codeJs ?? "", python: codePython ?? "" };
  const [code, setCode] = useState(original);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      setResult(await api.post<RunResult>("/code/run", { language: lang, code: code[lang], topicSlug }));
    } catch (e) {
      setResult({ stdout: "", stderr: e instanceof Error ? e.message : "Couldn't run your code. Your work is saved — try again.", exitCode: 1, timedOut: false, durationMs: 0 });
    } finally {
      setRunning(false);
    }
  };

  if (!available.length) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
        {available.length > 1 ? (
          <Tabs value={lang} onChange={(v) => { setLang(v); setResult(null); }} items={[{ value: "python", label: "Python" }, { value: "javascript", label: "JavaScript" }].filter((t) => available.includes(t.value as Lang)) as { value: Lang; label: string }[]} />
        ) : <span className="font-mono text-xs text-muted">{lang}</span>}
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setCode(original); setResult(null); }}><RotateCcw className="size-3.5" /> Reset</Button>
          <Button size="sm" onClick={run} loading={running}><Play className="size-3.5" /> Run</Button>
        </div>
      </div>
      <div className="h-72 bg-code">
        <CodeEditor value={code[lang]} onChange={(v) => setCode((c) => ({ ...c, [lang]: v }))} language={lang} ariaLabel={`${lang} example code`} />
      </div>
      <div className="border-t border-border bg-code px-4 py-3 font-mono text-xs" aria-live="polite">
        <div className="mb-1 flex items-center justify-between text-subtle">
          <span>Output</span>
          {result && <span>{result.timedOut ? "timed out" : `exit ${result.exitCode} · ${result.durationMs}ms`}</span>}
        </div>
        {result ? (
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap leading-5">
            {result.stdout}
            {result.stderr && <span className={cn("block text-danger", result.stdout && "mt-2")}>{result.stderr}</span>}
          </pre>
        ) : <span className="text-subtle">Press Run to execute this code in a sandbox.</span>}
      </div>
    </div>
  );
}
