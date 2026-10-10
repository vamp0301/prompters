/**
 * Pure building blocks for Manisha's voice: choosing a speech-synthesis voice, judging a transcript,
 * the recording size limit and the room's state machine. No browser APIs here, so all of it is unit-tested.
 */

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

export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

export interface VoiceChoice<V extends VoiceLike = VoiceLike> {
  voice: V;
  /** True only when the browser itself reports the voice's language as en-IN. */
  indianEnglish: boolean;
}

// Browsers don't report a voice's gender. Names are used only to *rank* candidates (prefer a likely
// female voice for Manisha) — never to tell the candidate what the voice is.
const LIKELY_FEMALE = /\b(neerja|heera|veena|isha|lekha|kiyara|swara|kalpana|aditi|raveena|priya|ananya|samantha|karen|moira|tessa|serena|victoria|allison|ava|susan|zira|hazel|libby|sonia|natasha|jenny|aria|female)\b|google uk english female/i;
const LIKELY_MALE = /\b(rishi|prabhat|madhur|ravi|hemant|aarav|daniel|alex|fred|aaron|arthur|oliver|thomas|george|david|mark|james|guy|ryan|tom|male)\b/i;

const langOf = (v: VoiceLike) => v.lang.replace("_", "-").toLowerCase();

/**
 * Picks Manisha's voice. Order: an en-IN voice (likely-female names first), then other English voices
 * (likely-female first), then anything. Returns null when the browser has no voices at all.
 */
export function chooseVoice<V extends VoiceLike>(voices: readonly V[]): VoiceChoice<V> | null {
  if (!voices.length) return null;
  const score = (v: V) => {
    const lang = langOf(v);
    let s = 0;
    if (lang === "en-in") s += 100;
    else if (lang.startsWith("en")) s += 50;
    if (LIKELY_FEMALE.test(v.name)) s += 20;
    else if (LIKELY_MALE.test(v.name)) s -= 20;
    if (/natural|neural|enhanced|premium|online/i.test(v.name)) s += 3;
    return s;
  };
  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  return { voice: best, indianEnglish: langOf(best) === "en-in" };
}

export type TranscriptQuality = "empty" | "garbled" | "ok";

/**
 * A quick local check before anything is sent: empty or clearly broken speech-to-text is asked again
 * instead of being submitted (and never scored). The server makes the final call on subtler cases.
 */
export function transcriptQuality(text: string): TranscriptQuality {
  const words = text.toLowerCase().match(/[a-z0-9ऀ-ॿ]+/g) ?? [];
  if (!words.length) return "empty";
  const meaningful = words.filter((w) => !/^(uh+|um+|hmm+|ah+|er+|mm+)$/.test(w));
  if (meaningful.length < 2) return "garbled";
  // The same word over and over is a recognition loop, not an answer.
  const counts = new Map<string, number>();
  for (const w of meaningful) counts.set(w, (counts.get(w) ?? 0) + 1);
  const top = Math.max(...counts.values());
  if (meaningful.length >= 4 && top / meaningful.length > 0.6) return "garbled";
  return "ok";
}

/** Largest answer recording the API accepts. */
export const RECORDING_LIMIT_BYTES = 4 * 1024 * 1024;

/** Adds a recorded chunk; once the limit would be passed the recording is dropped, never cut short and uploaded. */
export function addChunk(total: number, size: number): { total: number; overLimit: boolean } {
  const next = total + size;
  return { total: next, overLimit: next > RECORDING_LIMIT_BYTES };
}

// ───────────────────────── interview room state machine ─────────────────────────

/**
 * IDLE        — nothing happening (before the first question, or paused)
 * SPEAKING    — Manisha is reading the question aloud (no listening allowed)
 * YOUR_TURN   — question shown, thinking time running; choose voice or typing
 * LISTENING   — speech recognition running
 * TRANSCRIBING— recognition stopped, waiting for its last words
 * REVIEW      — answer text editable (voice transcript or typed); Submit / Try again
 * UNCLEAR     — the transcript was empty or garbled; Try again / Type instead (nothing is scored)
 * SUBMITTING  — preparing the answer (audio) for upload
 * PROCESSING  — sent; Manisha is evaluating it (no new question can start)
 * NEXT_QUESTION — the next question has arrived and is about to be spoken
 * ERROR       — something failed; the answer text is kept
 */
export type RoomState = "IDLE" | "SPEAKING" | "YOUR_TURN" | "LISTENING" | "TRANSCRIBING" | "REVIEW" | "UNCLEAR" | "SUBMITTING" | "PROCESSING" | "NEXT_QUESTION" | "ERROR";

export type RoomError = "network" | "ai" | "mic-denied" | "recognition-unavailable" | "speech-failed" | "processing";

export type RoomEvent =
  | { type: "SPEAK" }
  | { type: "SPOKEN" }
  | { type: "LISTEN" }
  | { type: "STOP_LISTENING" }
  | { type: "TRANSCRIBED"; quality: TranscriptQuality }
  | { type: "TYPE" }
  | { type: "RETRY_VOICE" }
  | { type: "SUBMIT" }
  | { type: "SENT" }
  | { type: "NEXT" }
  | { type: "FAIL"; error: RoomError }
  | { type: "RESET" };

export interface Room {
  state: RoomState;
  error: RoomError | null;
}

export const initialRoom: Room = { state: "IDLE", error: null };

/** Where an answer can be started from: never while Manisha speaks or an answer is in flight. */
const CAN_ANSWER: RoomState[] = ["YOUR_TURN", "REVIEW", "UNCLEAR", "ERROR"];

export function roomReducer(room: Room, e: RoomEvent): Room {
  const to = (state: RoomState, error: RoomError | null = null): Room => ({ state, error });
  switch (e.type) {
    case "SPEAK":
      // A new question can only be spoken once the previous answer is done processing.
      return room.state === "SUBMITTING" || room.state === "PROCESSING" ? room : to("SPEAKING");
    case "SPOKEN":
      return room.state === "SPEAKING" || room.state === "NEXT_QUESTION" ? to("YOUR_TURN") : room;
    case "LISTEN":
      // One recognition session at a time, and never over Manisha's voice.
      return CAN_ANSWER.includes(room.state) ? to("LISTENING") : room;
    case "STOP_LISTENING":
      return room.state === "LISTENING" ? to("TRANSCRIBING") : room;
    case "TRANSCRIBED":
      if (room.state !== "TRANSCRIBING" && room.state !== "LISTENING") return room;
      return e.quality === "ok" ? to("REVIEW") : to("UNCLEAR");
    case "TYPE":
      return CAN_ANSWER.includes(room.state) || room.state === "LISTENING" ? to("REVIEW") : room;
    case "RETRY_VOICE":
      return CAN_ANSWER.includes(room.state) ? to("LISTENING") : room;
    case "SUBMIT":
      return room.state === "REVIEW" || room.state === "ERROR" || room.state === "YOUR_TURN" ? to("SUBMITTING") : room;
    case "SENT":
      return room.state === "SUBMITTING" ? to("PROCESSING") : room;
    case "NEXT":
      return room.state === "PROCESSING" ? to("NEXT_QUESTION") : room;
    case "FAIL":
      // Microphone/recognition problems leave the candidate on the answer screen to type instead.
      if (e.error === "mic-denied" || e.error === "recognition-unavailable") return to("REVIEW", e.error);
      if (e.error === "speech-failed") return room.state === "SPEAKING" ? to("YOUR_TURN", e.error) : { ...room, error: e.error };
      return to("ERROR", e.error);
    case "RESET":
      return initialRoom;
  }
}

/** True while it is safe to run speech recognition. */
export const canListen = (s: RoomState) => s === "LISTENING";
/** True while the answer box should be editable. */
export const canEdit = (s: RoomState) => s === "REVIEW" || s === "ERROR" || s === "UNCLEAR" || s === "YOUR_TURN";

// ───────────────────────── cloud speech-to-text (Deepgram) ─────────────────────────

export type SttEvent =
  | { kind: "interim"; text: string }
  | { kind: "final"; text: string; confidence: number }
  | { kind: "utterance-end" }
  | { kind: "ignore" };

/** One streaming message → what the room cares about. Unknown or malformed messages are ignored. */
export function parseSttMessage(raw: unknown): SttEvent {
  let m: { type?: string; is_final?: boolean; channel?: { alternatives?: { transcript?: string; confidence?: number }[] } };
  try {
    m = typeof raw === "string" ? JSON.parse(raw) : (raw as typeof m);
  } catch {
    return { kind: "ignore" };
  }
  if (!m || typeof m !== "object") return { kind: "ignore" };
  if (m.type === "UtteranceEnd") return { kind: "utterance-end" };
  if (m.type !== "Results") return { kind: "ignore" };
  const alt = m.channel?.alternatives?.[0];
  const text = (alt?.transcript ?? "").trim();
  if (!m.is_final) return { kind: "interim", text };
  // A final with no words (silence, noise) is not an answer fragment.
  if (!text) return { kind: "ignore" };
  return { kind: "final", text, confidence: typeof alt?.confidence === "number" ? alt.confidence : 1 };
}

/** Below this average confidence the transcript is treated as "didn't catch that", never scored. */
export const LOW_CONFIDENCE = 0.55;

/** Word-weighted average confidence of the final segments (1 when there are none). */
export function averageConfidence(segments: readonly { text: string; confidence: number }[]) {
  let words = 0;
  let sum = 0;
  for (const s of segments) {
    const n = s.text.split(/\s+/).filter(Boolean).length;
    words += n;
    sum += n * s.confidence;
  }
  return words ? sum / words : 1;
}

export function listenUrl(base: string, params: Record<string, string>) {
  return `${base}?${new URLSearchParams(params).toString()}`;
}
