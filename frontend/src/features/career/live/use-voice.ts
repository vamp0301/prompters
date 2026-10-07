"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewLanguage } from "@/lib/api/types";

/** Strips Markdown so the voice doesn't read out asterisks and backticks. */
export function speakable(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[#*_>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const speechLang = (l: InterviewLanguage) => (l === "hi" ? "hi-IN" : "en-IN");

// Browsers don't expose a voice's gender, so we rank by known voice names across macOS/iOS, Windows/Edge, Chrome and Android.
const FEMALE_VOICES = /\b(tara|veena|isha|lekha|kiyara|neerja|swara|heera|kalpana|aarohi|ananya|priya|aditi|raveena|kajal|sangeeta|vani|pallavi|shruti|samantha|karen|moira|tessa|serena|victoria|allison|ava|susan|zira|hazel|catherine|libby|sonia|natasha|jenny|aria|female|frau|femme)\b|google हिन्दी|google us english|google uk english female/i;
const MALE_VOICES = /\b(aman|rishi|prabhat|madhur|ravi|hemant|kunal|aarav|daniel|alex|fred|aaron|arthur|oliver|thomas|george|david|mark|james|guy|ryan|tom|male)\b/i;

/**
 * Manisha is a female Indian interviewer. Ranking:
 *   1. female + Indian locale matching the interview (en-IN / hi-IN)
 *   2. female + any Indian locale (an Indian accent matters more than the language: a hi-IN voice reads Hinglish naturally)
 *   3. female + same language elsewhere (e.g. en-US)
 * Known male voices are never chosen.
 */
export type VoiceQuality = "female-indian" | "female" | "fallback";

export function pickFemaleVoice(voices: SpeechSynthesisVoice[], lang: string): { voice: SpeechSynthesisVoice; female: boolean; quality: VoiceQuality } | null {
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
  const score = (v: SpeechSynthesisVoice) => {
    const female = FEMALE_VOICES.test(v.name);
    const male = MALE_VOICES.test(v.name) && !female;
    if (male) return -1;
    let s = female ? 100 : 10;
    if (norm(v) === lang.toLowerCase()) s += 50;
    else if (/-in$/.test(norm(v))) s += 30;
    else if (norm(v).startsWith(lang.slice(0, 2).toLowerCase())) s += 10;
    if (/natural|neural|enhanced|premium|online/i.test(v.name)) s += 5;
    return s;
  };
  const ranked = voices.map((v) => ({ v, s: score(v) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s);
  const best = ranked[0]?.v ?? null;
  if (!best) return null;
  const female = FEMALE_VOICES.test(best.name);
  return { voice: best, female, quality: female && /-in$/.test(norm(best)) ? "female-indian" : female ? "female" : "fallback" };
}

/**
 * Manisha's voice via the browser's built-in speech synthesis.
 * Prefers an Indian voice (en-IN / hi-IN); falls back to any English voice.
 */
export function useManishaVoice(language: InterviewLanguage) {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [quality, setQuality] = useState<VoiceQuality>("fallback");
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const femaleRef = useRef(true);

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const chosen = pickFemaleVoice(window.speechSynthesis.getVoices(), speechLang(language));
      voiceRef.current = chosen?.voice ?? null;
      femaleRef.current = !!chosen?.female;
      setVoiceName(chosen ? `${chosen.voice.name} (${chosen.voice.lang})` : null);
      setQuality(chosen?.quality ?? "fallback");
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, [language, supported]);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!supported || muted || !text.trim()) return resolve();
        window.speechSynthesis.cancel();
        const clean = speakable(text);
        const u = new SpeechSynthesisUtterance(clean);
        // Some browsers never fire `end` (no voices, background tab): never let the interview hang on it.
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          setSpeaking(false);
          resolve();
        };
        setTimeout(settle, 2500 + clean.split(/\s+/).length * 450);
        u.lang = speechLang(language);
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 0.97;
        // Known female voice: natural pitch. Unknown/neutral fallback: lift the pitch so Manisha still sounds female.
        u.pitch = femaleRef.current ? 1.05 : 1.3;
        u.onstart = () => setSpeaking(true);
        u.onend = u.onerror = settle;
        window.speechSynthesis.speak(u);
      }),
    [language, muted, supported],
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, muted, setMuted, supported, voiceName, quality };
}

type RecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
};

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Live speech-to-text (Chrome / Edge). Final phrases are appended through
 * `onFinal`; the candidate can always edit or type instead.
 */
export function useDictation(language: InterviewLanguage, onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supported = !!recognitionCtor();
  const recRef = useRef<InstanceType<RecognitionCtor> | null>(null);
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = speechLang(language);
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") setError("Microphone access was blocked — you can type your answer instead.");
    };
    // Chrome stops recognition after silence; restart while we still want it.
    rec.onend = () => {
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      } else setListening(false);
    };
    recRef.current = rec;
    wantRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [language]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    setInterim("");
    setListening(false);
  }, []);

  useEffect(() => () => {
    wantRef.current = false;
    recRef.current?.stop();
  }, []);

  return { start, stop, listening, interim, supported, error };
}

/** Records one answer from the microphone stream as compressed audio. */
export function useAnswerRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const start = useCallback(() => {
    if (!stream || typeof MediaRecorder === "undefined") return;
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
  }, [stream]);

  const pause = useCallback(() => recorderRef.current?.state === "recording" && recorderRef.current.pause(), []);
  const resume = useCallback(() => recorderRef.current?.state === "paused" && recorderRef.current.resume(), []);

  /** Stops and returns base64 audio, or null if nothing was recorded. */
  const finish = useCallback(
    () =>
      new Promise<{ base64: string; mime: string } | null>((resolve) => {
        const rec = recorderRef.current;
        if (!rec || rec.state === "inactive") return resolve(null);
        rec.onstop = async () => {
          setRecording(false);
          const blob = new Blob(chunksRef.current, { type: rec.mimeType });
          recorderRef.current = null;
          if (!blob.size || blob.size > 4 * 1024 * 1024) return resolve(null);
          const buf = new Uint8Array(await blob.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          resolve({ base64: btoa(bin), mime: rec.mimeType });
        };
        rec.stop();
      }),
    [],
  );

  return { start, pause, resume, finish, recording };
}
