"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Skeleton } from "./misc";

const Monaco = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false, loading: () => <Skeleton className="h-full min-h-60" /> });

function useMonacoTheme() {
  const [theme, setTheme] = useState("vs-dark");
  useEffect(() => {
    const read = () => setTheme(getComputedStyle(document.documentElement).colorScheme === "light" ? "light" : "vs-dark");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/**
 * Monaco with every AI-ish assistance off: no inline suggestions, no word-based
 * completion, no quick suggestions. Build-without-AI means the student types it.
 */
export function CodeEditor({ value, onChange, language, height = "100%", readOnly, ariaLabel = "Code editor" }: { value: string; onChange?: (v: string) => void; language: "javascript" | "python"; height?: string | number; readOnly?: boolean; ariaLabel?: string }) {
  const theme = useMonacoTheme();
  return (
    <Monaco
      height={height}
      language={language}
      value={value}
      theme={theme}
      onChange={(v) => onChange?.(v ?? "")}
      options={{
        readOnly,
        ariaLabel,
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: language === "python" ? 4 : 2,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        wordBasedSuggestions: "off",
        inlineSuggest: { enabled: false },
        parameterHints: { enabled: false },
        acceptSuggestionOnEnter: "off",
        tabCompletion: "off",
        snippetSuggestions: "none",
        lineNumbersMinChars: 3,
        renderLineHighlight: "line",
      }}
    />
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string | null }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-code p-4 font-mono text-[13px] leading-6" data-language={language ?? undefined}>
      <code>{code}</code>
    </pre>
  );
}
