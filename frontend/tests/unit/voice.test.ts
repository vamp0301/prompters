import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addChunk, chooseVoice, initialRoom, RECORDING_LIMIT_BYTES, roomReducer, transcriptQuality, type Room, type RoomEvent } from "@/features/career/live/voice-core";
import { useAnswerRecorder, useDictation, useManishaVoice } from "@/features/career/live/use-voice";

const run = (events: RoomEvent[], from: Room = initialRoom) => events.reduce(roomReducer, from);

describe("voice choice", () => {
  it("returns nothing when the browser has no voices yet", () => {
    expect(chooseVoice([])).toBeNull();
  });
  it("prefers an en-IN voice and reports Indian English only from the browser's language", () => {
    const voices = [
      { name: "Samantha", lang: "en-US" },
      { name: "Rishi", lang: "en-IN" },
      { name: "Veena", lang: "en-IN" },
    ];
    const c = chooseVoice(voices)!;
    expect(c.voice.name).toBe("Veena");
    expect(c.indianEnglish).toBe(true);
  });
  it("never calls a voice Indian English because of its name", () => {
    const c = chooseVoice([{ name: "Microsoft Neerja (India) Online", lang: "en-US" }, { name: "Google Deutsch", lang: "de-DE" }])!;
    expect(c.voice.name).toMatch(/Neerja/);
    expect(c.indianEnglish).toBe(false);
  });
  it("falls back to the closest English voice, then anything", () => {
    expect(chooseVoice([{ name: "Thomas", lang: "fr-FR" }, { name: "Karen", lang: "en_AU" }])!.voice.name).toBe("Karen");
    expect(chooseVoice([{ name: "Thomas", lang: "fr-FR" }])!.indianEnglish).toBe(false);
  });
});

describe("transcript quality", () => {
  it("empty, filler-only and looping transcripts are not answers", () => {
    expect(transcriptQuality("")).toBe("empty");
    expect(transcriptQuality("   ...  ")).toBe("empty");
    expect(transcriptQuality("uh um hmm")).toBe("garbled");
    expect(transcriptQuality("token token token token token")).toBe("garbled");
    expect(transcriptQuality("JWT")).toBe("garbled");
  });
  it("a normal answer is fine", () => {
    expect(transcriptQuality("I store the token in an HTTP-only cookie so scripts can't read it")).toBe("ok");
  });
});

describe("recording limit", () => {
  it("drops a recording that would pass 4 MB", () => {
    expect(addChunk(0, 1000)).toEqual({ total: 1000, overLimit: false });
    expect(addChunk(RECORDING_LIMIT_BYTES - 10, 10).overLimit).toBe(false);
    expect(addChunk(RECORDING_LIMIT_BYTES - 10, 11).overLimit).toBe(true);
  });
});

describe("interview room state machine", () => {
  it("never listens while Manisha is speaking", () => {
    expect(run([{ type: "SPEAK" }, { type: "LISTEN" }]).state).toBe("SPEAKING");
    expect(run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "LISTEN" }]).state).toBe("LISTENING");
  });
  it("voice answer: listening → transcribing → review → submit → processing → next", () => {
    const r = run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "LISTEN" }, { type: "STOP_LISTENING" }, { type: "TRANSCRIBED", quality: "ok" }, { type: "SUBMIT" }, { type: "SENT" }, { type: "NEXT" }]);
    expect(r.state).toBe("NEXT_QUESTION");
  });
  it("an empty or garbled transcript is asked again, never submitted", () => {
    const unclear = run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "LISTEN" }, { type: "STOP_LISTENING" }, { type: "TRANSCRIBED", quality: "empty" }]);
    expect(unclear.state).toBe("UNCLEAR");
    expect(roomReducer(unclear, { type: "SUBMIT" }).state).toBe("UNCLEAR");
    expect(roomReducer(unclear, { type: "RETRY_VOICE" }).state).toBe("LISTENING");
    expect(roomReducer(unclear, { type: "TYPE" }).state).toBe("REVIEW");
  });
  it("typing is always available, including mid-listening", () => {
    expect(run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "TYPE" }]).state).toBe("REVIEW");
    expect(run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "LISTEN" }, { type: "TYPE" }]).state).toBe("REVIEW");
  });
  it("a second submit or a new question can't start while an answer is processing", () => {
    const processing = run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "TYPE" }, { type: "SUBMIT" }, { type: "SENT" }]);
    expect(processing.state).toBe("PROCESSING");
    expect(roomReducer(processing, { type: "SUBMIT" }).state).toBe("PROCESSING");
    expect(roomReducer(processing, { type: "SPEAK" }).state).toBe("PROCESSING");
    expect(roomReducer(processing, { type: "LISTEN" }).state).toBe("PROCESSING");
  });
  it("microphone denied or recognition unavailable leaves the candidate typing", () => {
    const listening = run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "LISTEN" }]);
    expect(roomReducer(listening, { type: "FAIL", error: "mic-denied" })).toEqual({ state: "REVIEW", error: "mic-denied" });
    expect(roomReducer(listening, { type: "FAIL", error: "recognition-unavailable" }).state).toBe("REVIEW");
  });
  it("speech synthesis failure shows the question and moves on", () => {
    expect(run([{ type: "SPEAK" }, { type: "FAIL", error: "speech-failed" }])).toEqual({ state: "YOUR_TURN", error: "speech-failed" });
  });
  it("network and AI failures keep the answer in an error state that can be retried", () => {
    const failed = run([{ type: "SPEAK" }, { type: "SPOKEN" }, { type: "TYPE" }, { type: "SUBMIT" }, { type: "SENT" }, { type: "FAIL", error: "network" }]);
    expect(failed).toEqual({ state: "ERROR", error: "network" });
    expect(roomReducer(failed, { type: "SUBMIT" }).state).toBe("SUBMITTING");
  });
});

// ───────────────────────── hooks against fake browser APIs ─────────────────────────

type Utter = { text: string; onstart?: () => void; onend?: () => void; onerror?: (e: { error: string }) => void; voice?: unknown; lang?: string };

function fakeSpeech(opts: { voices?: { name: string; lang: string }[]; fail?: boolean; manualEnd?: boolean } = {}) {
  let voices = opts.voices ?? [];
  const listeners = new Set<() => void>();
  const spoken: Utter[] = [];
  let pending: Utter | null = null;
  const synth = {
    getVoices: () => voices,
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
    speak: (u: Utter) => {
      spoken.push(u);
      pending = u;
      u.onstart?.();
      if (opts.fail) queueMicrotask(() => u.onerror?.({ error: "synthesis-failed" }));
      else if (!opts.manualEnd) queueMicrotask(() => u.onend?.());
    },
    cancel: vi.fn(() => {
      const u = pending;
      pending = null;
      u?.onerror?.({ error: "canceled" });
    }),
  };
  vi.stubGlobal("speechSynthesis", synth);
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      constructor(t: string) {
        this.text = t;
      }
    },
  );
  return {
    synth,
    spoken,
    loadVoices: (v: { name: string; lang: string }[]) => {
      voices = v;
      listeners.forEach((f) => f());
    },
  };
}

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  static failWith: string | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  running = false;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.running = true;
    if (FakeRecognition.failWith) {
      const err = FakeRecognition.failWith;
      FakeRecognition.failWith = null; // fail once, like a real recogniser
      queueMicrotask(() => {
        this.onerror?.({ error: err });
        this.running = false;
        this.onend?.();
      });
    }
  }
  stop() {
    this.running = false;
    queueMicrotask(() => this.onend?.());
  }
  abort() {
    this.running = false;
  }
  say(text: string) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: text } }] });
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  FakeRecognition.instances = [];
  FakeRecognition.failWith = null;
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  delete (window as unknown as Record<string, unknown>).speechSynthesis;
});

describe("useManishaVoice", () => {
  it("voice unavailable: speaking resolves without crashing", async () => {
    delete (window as unknown as Record<string, unknown>).speechSynthesis;
    const { result } = renderHook(() => useManishaVoice());
    expect(result.current.supported).toBe(false);
    await expect(result.current.speak("Hello")).resolves.toEqual({ ok: false, reason: "unsupported" });
  });

  it("handles voices that arrive late through voiceschanged", async () => {
    const fake = fakeSpeech({ voices: [] });
    const { result } = renderHook(() => useManishaVoice());
    expect(result.current.choice).toBeNull();
    act(() => fake.loadVoices([{ name: "Veena", lang: "en-IN" }]));
    expect(result.current.choice?.indianEnglish).toBe(true);
  });

  it("reports a synthesis failure instead of hanging", async () => {
    fakeSpeech({ voices: [{ name: "Karen", lang: "en-AU" }], fail: true });
    const { result } = renderHook(() => useManishaVoice());
    let r;
    await act(async () => {
      r = await result.current.speak("What is a closure?");
    });
    expect(r).toEqual({ ok: false, reason: "error" });
  });

  it("mute stops Manisha mid-sentence and keeps her quiet; it doesn't touch anything else", async () => {
    const fake = fakeSpeech({ voices: [{ name: "Veena", lang: "en-IN" }], manualEnd: true });
    const { result } = renderHook(() => useManishaVoice());
    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.speak("A long question");
    });
    act(() => result.current.setMuted(true));
    await expect(pending).resolves.toBeDefined();
    expect(fake.synth.cancel).toHaveBeenCalled();
    expect(result.current.muted).toBe(true);
    await expect(result.current.speak("Next")).resolves.toEqual({ ok: false, reason: "muted" });
    expect(fake.spoken).toHaveLength(1);
  });

  it("strips Markdown before speaking and cancels speech on unmount", async () => {
    const fake = fakeSpeech({ voices: [{ name: "Veena", lang: "en-IN" }] });
    const { result, unmount } = renderHook(() => useManishaVoice());
    await act(async () => {
      await result.current.speak("Implement **sum** with `reduce`");
    });
    expect(fake.spoken[0].text).toBe("Implement sum with reduce");
    unmount();
    expect(fake.synth.cancel).toHaveBeenCalled();
  });
});

describe("useDictation", () => {
  it("speech recognition unavailable is reported, not thrown", () => {
    const { result } = renderHook(() => useDictation(() => undefined));
    expect(result.current.supported).toBe(false);
    expect(result.current.start()).toBe(false);
  });

  it("never runs two recognition sessions at once and delivers final words", async () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    const heard: string[] = [];
    const { result } = renderHook(() => useDictation((t) => heard.push(t)));
    act(() => {
      result.current.start();
      result.current.start();
    });
    expect(FakeRecognition.instances).toHaveLength(1);
    act(() => FakeRecognition.instances[0].say("I store it in a cookie"));
    await act(async () => {
      await result.current.stop();
    });
    expect(heard).toEqual(["I store it in a cookie"]);
    expect(result.current.listening).toBe(false);
  });

  it("a denied microphone is remembered and never re-requested in a loop", async () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    FakeRecognition.failWith = "not-allowed";
    const { result } = renderHook(() => useDictation(() => undefined));
    await act(async () => {
      result.current.start();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.error).toBe("mic-denied");
    expect(result.current.blocked).toBe(true);
    expect(result.current.start()).toBe(false);
    expect(FakeRecognition.instances).toHaveLength(1);
  });

  it("silence ('no-speech') is not an error", async () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    FakeRecognition.failWith = "no-speech";
    const { result } = renderHook(() => useDictation(() => undefined));
    await act(async () => {
      result.current.start();
      await Promise.resolve();
    });
    expect(result.current.error).toBeNull();
  });

  it("a recogniser that keeps ending instantly is stopped, not restarted forever", async () => {
    class Flaky extends FakeRecognition {
      start() {
        this.running = true;
        queueMicrotask(() => this.onend?.());
      }
    }
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = Flaky;
    const { result } = renderHook(() => useDictation(() => undefined));
    await act(async () => {
      result.current.start();
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });
    expect(result.current.error).toBe("failed");
    expect(result.current.listening).toBe(false);
  });

  it("stops the recogniser when the room unmounts", () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    const { result, unmount } = renderHook(() => useDictation(() => undefined));
    act(() => {
      result.current.start();
    });
    unmount();
    expect(FakeRecognition.instances[0].running).toBe(false);
    expect(FakeRecognition.instances[0].onresult).toBeNull();
  });
});

describe("useAnswerRecorder", () => {
  class FakeRecorder {
    static isTypeSupported = () => true;
    static last: FakeRecorder;
    state: "inactive" | "recording" = "inactive";
    mimeType = "audio/webm";
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    constructor() {
      FakeRecorder.last = this;
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      queueMicrotask(() => this.onstop?.());
    }
  }

  it("microphone denied for recording is reported (the answer still works)", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.reject(new DOMException("no", "NotAllowedError")) } });
    const { result } = renderHook(() => useAnswerRecorder());
    let r;
    await act(async () => {
      r = await result.current.start();
    });
    expect(r).toBe("denied");
    expect(result.current.recording).toBe(false);
  });

  it("drops a recording over 4 MB instead of uploading a cut-off file", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    const track = { stop: vi.fn() };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.resolve({ getTracks: () => [track] }) } });
    const { result, unmount } = renderHook(() => useAnswerRecorder());
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      FakeRecorder.last.ondataavailable?.({ data: new Blob([new Uint8Array(3 * 1024 * 1024)]) });
      FakeRecorder.last.ondataavailable?.({ data: new Blob([new Uint8Array(2 * 1024 * 1024)]) });
    });
    expect(result.current.overLimit).toBe(true);
    let audio;
    await act(async () => {
      audio = await result.current.finish();
    });
    expect(audio).toBeNull();
    unmount();
    expect(track.stop).toHaveBeenCalled();
  });

  it("a normal answer comes back as base64 audio", async () => {
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.resolve({ getTracks: () => [] }) } });
    const { result } = renderHook(() => useAnswerRecorder());
    await act(async () => {
      await result.current.start();
    });
    act(() => FakeRecorder.last.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2, 3])]) }));
    let audio: { base64: string; mime: string } | null = null;
    await act(async () => {
      audio = await result.current.finish();
    });
    expect(audio).toEqual({ base64: "AQID", mime: "audio/webm" });
  });
});
