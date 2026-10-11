"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { chooseVoice, speakable } from "@/features/career/live/voice-core";
import type { TutorAnswer } from "@/lib/api/types";

/** What is read aloud: the answer and its explanation, never the code. */
export function answerScript(a: TutorAnswer["structured"]): string {
  const parts = [
    a.answer,
    a.solution.summary,
    ...a.solution.steps.map((s, i) => `Step ${i + 1}. ${s}`),
    a.explanation.concept,
    a.explanation.whyItWorks,
    ...a.examples.map((e) => [`Example: ${e.title}.`, e.input && `Input: ${e.input}.`, e.output && `Output: ${e.output}.`, e.explanation].filter(Boolean).join(" ")),
    a.interviewAnswer && `In an interview, you can say: ${a.interviewAnswer}`,
    ...(a.followUps ?? []).map((f) => `Follow-up question: ${f.question} Answer: ${f.answer}`),
  ];
  return parts.filter(Boolean).map((p) => speakable(p as string)).join(" ");
}

/** Short sentence-sized chunks: Chrome stops long utterances after ~15 seconds. */
export function chunks(text: string, max = 220): string[] {
  const out: string[] = [];
  for (const sentence of text.match(/[^.!?।]+[.!?।]?/g) ?? [text]) {
    let s = sentence.trim();
    while (s.length > max) {
      const cut = s.lastIndexOf(" ", max) > 40 ? s.lastIndexOf(" ", max) : max;
      out.push(s.slice(0, cut));
      s = s.slice(cut).trim();
    }
    if (s) out.push(s);
  }
  return out;
}

/**
 * Reads text aloud with the browser's own voices: an Indian-English female voice when the device has
 * one (Hindi script → a Hindi voice). Free and on-device; the exact voice depends on the browser.
 */
export function useReadAloud() {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const queue = useRef<string[]>([]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    queue.current = [];
    if (supported) window.speechSynthesis.cancel();
    setState("idle");
  }, [supported]);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    (text: string) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const hindi = /[ऀ-ॿ]/.test(text);
      const choice = chooseVoice(synth.getVoices(), hindi ? "hi-in" : "en-in");
      queue.current = chunks(text);
      const next = () => {
        const part = queue.current.shift();
        if (!part) return setState("idle");
        const u = new SpeechSynthesisUtterance(part);
        if (choice) {
          u.voice = choice.voice;
          u.lang = choice.voice.lang;
        } else u.lang = hindi ? "hi-IN" : "en-IN";
        u.rate = 0.95;
        u.onend = next;
        u.onerror = () => setState("idle");
        synth.speak(u);
      };
      setState("playing");
      next();
    },
    [supported],
  );

  const toggle = useCallback(() => {
    if (!supported) return;
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
    }
  }, [state, supported]);

  return { supported, state, play, toggle, stop };
}
