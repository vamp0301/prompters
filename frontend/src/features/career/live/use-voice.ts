"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { addChunk, chooseVoice, speakable, type VoiceChoice } from "./voice-core";

export { speakable } from "./voice-core";

const LANG = "en-IN";

export type SpeakResult = { ok: true } | { ok: false; reason: "muted" | "unsupported" | "error" | "empty" };

/**
 * Manisha's voice through the browser's own speech synthesis. Voices often load after the page
 * (Chrome fires `voiceschanged` later), so the choice is re-made whenever the list changes.
 */
export function useManishaVoice() {
  const supported = typeof window !== "undefined" && !!window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined";
  const [choice, setChoice] = useState<VoiceChoice<SpeechSynthesisVoice> | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);
  const settleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const pick = () => {
      const voices = synth.getVoices() ?? [];
      setVoicesLoaded(voices.length > 0);
      setChoice(chooseVoice(voices));
    };
    pick();
    synth.addEventListener?.("voiceschanged", pick);
    // Some browsers never fire voiceschanged; check once more shortly after load.
    const t = window.setTimeout(pick, 1500);
    return () => {
      synth.removeEventListener?.("voiceschanged", pick);
      window.clearTimeout(t);
      synth.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    settleRef.current?.();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) =>
      new Promise<SpeakResult>((resolve) => {
        if (!supported) return resolve({ ok: false, reason: "unsupported" });
        if (mutedRef.current) return resolve({ ok: false, reason: "muted" });
        const clean = speakable(text);
        if (!clean) return resolve({ ok: false, reason: "empty" });
        const synth = window.speechSynthesis;
        synth.cancel();
        let done = false;
        const settle = (r: SpeakResult = { ok: true }) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          settleRef.current = null;
          setSpeaking(false);
          resolve(r);
        };
        settleRef.current = () => settle({ ok: false, reason: "muted" });
        // Some engines never fire `end` (no voices, background tab): never let the interview hang on it.
        const timer = window.setTimeout(() => settle(), 3000 + clean.split(/\s+/).length * 450);
        try {
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = choice?.voice.lang ?? LANG;
          try {
            if (choice) u.voice = choice.voice;
          } catch {
            /* the browser rejected the voice object — the language alone still picks a sensible voice */
          }
          u.rate = 0.97;
          u.onstart = () => setSpeaking(true);
          u.onend = () => settle();
          u.onerror = (e) => settle(e.error === "interrupted" || e.error === "canceled" ? { ok: true } : { ok: false, reason: "error" });
          synth.speak(u);
        } catch {
          settle({ ok: false, reason: "error" });
        }
      }),
    [supported, choice],
  );

  /** Mutes Manisha only — the microphone, speech-to-text and typing are unaffected. */
  const setMuted = useCallback(
    (m: boolean) => {
      mutedRef.current = m;
      setMutedState(m);
      if (m) stop();
    },
    [stop],
  );

  return { supported, voicesLoaded, choice, speaking, muted, setMuted, speak, stop };
}

// ───────────────────────── speech-to-text ─────────────────────────

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort?(): void;
}
type RecognitionCtor = new () => RecognitionLike;

export function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type DictationError = "mic-denied" | "no-microphone" | "network" | "failed";

/**
 * Live speech-to-text (Chrome / Edge). Exactly one recognition session can run; a denied microphone
 * is remembered and never re-requested in a loop. `stop()` resolves once the last words are in.
 */
export function useDictation(onFinal: (text: string) => void) {
  const supported = !!recognitionCtor();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<DictationError | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const wantRef = useRef(false);
  const blockedRef = useRef(false);
  const endedRef = useRef<(() => void) | null>(null);
  const restartsRef = useRef<number[]>([]);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || blockedRef.current) return false;
    if (recRef.current) return true; // already running — never two sessions
    const rec = new Ctor();
    rec.lang = LANG;
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
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        blockedRef.current = true;
        wantRef.current = false;
        setError("mic-denied");
      } else if (e.error === "audio-capture") {
        wantRef.current = false;
        setError("no-microphone");
      } else if (e.error === "network") {
        wantRef.current = false;
        setError("network");
      }
      // "no-speech" and "aborted" are normal: silence is not an error.
    };
    rec.onend = () => {
      // Chrome ends recognition after a pause in speech; carry on while the candidate is still answering.
      if (wantRef.current && recRef.current === rec) {
        // Guard against a recogniser that ends instantly over and over (a tight restart loop).
        const now = Date.now();
        restartsRef.current = [...restartsRef.current.filter((t) => now - t < 3000), now];
        if (restartsRef.current.length > 5) {
          wantRef.current = false;
          setError("failed");
        } else {
          try {
            rec.start();
            return;
          } catch {
            /* fall through and finish */
          }
        }
      }
      if (recRef.current === rec) recRef.current = null;
      setListening(false);
      setInterim("");
      endedRef.current?.();
      endedRef.current = null;
    };
    recRef.current = rec;
    wantRef.current = true;
    setError(null);
    try {
      rec.start();
      setListening(true);
      return true;
    } catch {
      recRef.current = null;
      wantRef.current = false;
      setError("failed");
      return false;
    }
  }, []);

  /** Stops listening; resolves when the recogniser has delivered its last words (or after 1.5 s). */
  const stop = useCallback(
    () =>
      new Promise<void>((resolve) => {
        wantRef.current = false;
        const rec = recRef.current;
        if (!rec) {
          setListening(false);
          return resolve();
        }
        const t = window.setTimeout(() => {
          if (recRef.current === rec) recRef.current = null;
          setListening(false);
          setInterim("");
          endedRef.current = null;
          resolve();
        }, 1500);
        endedRef.current = () => {
          window.clearTimeout(t);
          resolve();
        };
        try {
          rec.stop();
        } catch {
          rec.onend?.();
        }
      }),
    [],
  );

  // Clean up on unmount: no recogniser may outlive the interview room.
  useEffect(
    () => () => {
      wantRef.current = false;
      const rec = recRef.current;
      recRef.current = null;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          (rec.abort ?? rec.stop).call(rec);
        } catch {
          /* already stopped */
        }
      }
    },
    [],
  );

  return { supported, listening, interim, error, blocked: error === "mic-denied", start, stop };
}

// ───────────────────────── answer recording ─────────────────────────

export type RecordedAudio = { base64: string; mime: string } | null;

/**
 * Records answers only after the candidate allowed it. The microphone stream is opened on first use
 * and released on unmount. Recordings over the 4 MB limit are dropped — never cut short and uploaded.
 */
export function useAnswerRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const totalRef = useRef(0);
  const overRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [overLimit, setOverLimit] = useState(false);
  const supported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  /** Starts recording; resolves false when the microphone isn't available (the answer still works). */
  const start = useCallback(async (): Promise<"recording" | "denied" | "unavailable"> => {
    if (!supported) return "unavailable";
    if (recorderRef.current?.state === "recording") return "recording";
    try {
      streamRef.current ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      return e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "denied" : "unavailable";
    }
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime, audioBitsPerSecond: 32000 });
    chunksRef.current = [];
    totalRef.current = 0;
    overRef.current = false;
    setOverLimit(false);
    rec.ondataavailable = (e) => {
      if (!e.data.size || overRef.current) return;
      const r = addChunk(totalRef.current, e.data.size);
      totalRef.current = r.total;
      if (r.overLimit) {
        overRef.current = true;
        chunksRef.current = [];
        setOverLimit(true);
        if (rec.state !== "inactive") rec.stop();
        return;
      }
      chunksRef.current.push(e.data);
    };
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
    return "recording";
  }, [supported]);

  /** Stops and returns the audio, or null when nothing (or too much) was recorded. */
  const finish = useCallback(
    () =>
      new Promise<RecordedAudio>((resolve) => {
        const rec = recorderRef.current;
        recorderRef.current = null;
        const done = async () => {
          setRecording(false);
          if (overRef.current || !chunksRef.current.length) return resolve(null);
          const blob = new Blob(chunksRef.current, { type: rec?.mimeType || "audio/webm" });
          chunksRef.current = [];
          if (!blob.size || blob.size > 4 * 1024 * 1024) return resolve(null);
          const buf = new Uint8Array(await blob.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          resolve({ base64: btoa(bin), mime: rec?.mimeType || "audio/webm" });
        };
        if (!rec || rec.state === "inactive") return void done();
        rec.onstop = () => void done();
        rec.stop();
      }),
    [],
  );

  /** Throws the current recording away (e.g. "Try again"). */
  const discard = useCallback(() => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    chunksRef.current = [];
    if (rec && rec.state !== "inactive") {
      rec.onstop = null;
      rec.stop();
    }
    setRecording(false);
  }, []);

  useEffect(
    () => () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.ondataavailable = null;
        rec.onstop = null;
        rec.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    [],
  );

  return { supported, recording, overLimit, start, finish, discard };
}

/** Microphone status for the setup screen, without prompting: available / blocked / not found / unknown. */
export async function microphoneStatus(): Promise<"available" | "blocked" | "missing" | "unknown"> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return "missing";
  try {
    const p = await navigator.permissions?.query({ name: "microphone" as PermissionName });
    if (p?.state === "denied") return "blocked";
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (!devices.some((d) => d.kind === "audioinput")) return "missing";
    return p?.state === "granted" || p?.state === "prompt" ? "available" : "unknown";
  } catch {
    return "unknown";
  }
}
