import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { averageConfidence, listenUrl, LOW_CONFIDENCE, parseSttMessage } from "@/features/career/live/voice-core";

// The API client is the only way the hooks reach the server.
const post = vi.fn();
const blob = vi.fn();
vi.mock("@/lib/api/client", async (orig) => {
  const real = await orig<typeof import("@/lib/api/client")>();
  return { ...real, api: { ...real.api, post: (...a: unknown[]) => post(...a), blob: (...a: unknown[]) => blob(...a) } };
});
const { useCloudDictation } = await import("@/features/career/live/cloud-voice");
const { useManishaVoice } = await import("@/features/career/live/use-voice");
const { ApiError } = await import("@/lib/api/client");

describe("streaming transcript messages", () => {
  const results = (transcript: string, is_final: boolean, confidence = 0.9) => JSON.stringify({ type: "Results", is_final, channel: { alternatives: [{ transcript, confidence }] } });
  it("separates interim words, final phrases and the end of an utterance", () => {
    expect(parseSttMessage(results("I used", false))).toEqual({ kind: "interim", text: "I used" });
    expect(parseSttMessage(results("I used JWT.", true, 0.8))).toEqual({ kind: "final", text: "I used JWT.", confidence: 0.8 });
    expect(parseSttMessage(JSON.stringify({ type: "UtteranceEnd" }))).toEqual({ kind: "utterance-end" });
  });
  it("ignores silence, metadata and malformed messages", () => {
    expect(parseSttMessage(results("  ", true))).toEqual({ kind: "ignore" });
    expect(parseSttMessage(JSON.stringify({ type: "Metadata" }))).toEqual({ kind: "ignore" });
    expect(parseSttMessage("{not json")).toEqual({ kind: "ignore" });
    expect(parseSttMessage(JSON.stringify({ type: "Results" }))).toEqual({ kind: "interim", text: "" });
  });
  it("weights confidence by words, so one mumbled word doesn't sink a clear answer", () => {
    expect(averageConfidence([])).toBe(1);
    expect(averageConfidence([{ text: "I stored the token in an http only cookie", confidence: 0.95 }, { text: "uh", confidence: 0.1 }])).toBeGreaterThan(LOW_CONFIDENCE);
    expect(averageConfidence([{ text: "mm the", confidence: 0.3 }, { text: "hmm", confidence: 0.4 }])).toBeLessThan(LOW_CONFIDENCE);
  });
  it("builds the streaming URL from the server's parameters", () => {
    expect(listenUrl("wss://x/v1/listen", { model: "nova-3", mip_opt_out: "true" })).toBe("wss://x/v1/listen?model=nova-3&mip_opt_out=true");
  });
});

// ───────────────────────── fakes: socket, recorder, microphone ─────────────────────────

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(
    public url: string,
    public protocols: string[],
  ) {
    FakeSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }
  send(d: unknown) {
    this.sent.push(d);
    // The server answers CloseStream by flushing and closing.
    if (typeof d === "string" && d.includes("CloseStream")) queueMicrotask(() => this.drop());
  }
  close() {
    this.drop();
  }
  drop() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose?.();
  }
  say(text: string, confidence = 0.9) {
    this.onmessage?.({ data: JSON.stringify({ type: "Results", is_final: true, channel: { alternatives: [{ transcript: text, confidence }] } }) });
  }
}
class FakeRecorder {
  static isTypeSupported = (m: string) => m.startsWith("audio/webm");
  state = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown) {}
  start() {
    this.state = "recording";
    this.ondataavailable?.({ data: new Blob(["audio"]) });
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => this.onstop?.());
  }
}
const track = { stop: vi.fn() };
const getUserMedia = vi.fn();

beforeEach(() => {
  FakeSocket.instances = [];
  post.mockReset();
  blob.mockReset();
  post.mockImplementation(async () => ({ url: "wss://stt.example/v1/listen", params: { model: "nova-3" }, token: `tok-${post.mock.calls.length}` }));
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue({ getTracks: () => [track] });
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as Record<string, unknown>).speechSynthesis;
});

const flush = () => act(async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
});

describe("cloud dictation", () => {
  it("streams with a short-lived token (never a key), collects final phrases and stops cleanly", async () => {
    const heard: string[] = [];
    const { result, unmount } = renderHook(() => useCloudDictation("s1", (t) => heard.push(t), () => false));
    expect(result.current.supported).toBe(true);
    act(() => void result.current.start());
    await flush();
    const ws = FakeSocket.instances[0];
    expect(post).toHaveBeenCalledWith("/career/voice/s1/token");
    expect(ws.protocols).toEqual(["bearer", "tok-1"]);
    expect(ws.url).toBe("wss://stt.example/v1/listen?model=nova-3");
    expect(ws.sent[0]).toBeInstanceOf(Blob); // audio is flowing
    act(() => ws.say("I used a refresh token"));
    act(() => ws.say("with rotation"));
    expect(heard).toEqual(["I used a refresh token", "with rotation"]);
    await act(async () => {
      await result.current.stop();
    });
    expect(ws.sent.some((d) => typeof d === "string" && d.includes("CloseStream"))).toBe(true);
    expect(result.current.listening).toBe(false);
    expect(result.current.lowConfidence()).toBe(false);
    unmount();
    expect(track.stop).toHaveBeenCalled(); // microphone released with the room
  });

  it("flags an answer the recogniser was unsure about", async () => {
    const { result } = renderHook(() => useCloudDictation("s1", () => undefined, () => false));
    act(() => void result.current.start());
    await flush();
    act(() => FakeSocket.instances[0].say("mm the thing", 0.2));
    expect(result.current.lowConfidence()).toBe(true);
  });

  it("reconnects with a fresh token when the connection drops mid-answer, keeping the words so far", async () => {
    const heard: string[] = [];
    const { result } = renderHook(() => useCloudDictation("s1", (t) => heard.push(t), () => false));
    act(() => void result.current.start());
    await flush();
    act(() => FakeSocket.instances[0].say("first part"));
    act(() => FakeSocket.instances[0].drop());
    await flush();
    expect(FakeSocket.instances).toHaveLength(2);
    expect(FakeSocket.instances[1].protocols).toEqual(["bearer", "tok-2"]);
    act(() => FakeSocket.instances[1].say("second part"));
    expect(heard).toEqual(["first part", "second part"]);
    expect(result.current.listening).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("hands over to the fallback after repeated drops; errors only when there is none", async () => {
    const fallback = vi.fn(() => true);
    const { result } = renderHook(() => useCloudDictation("s1", () => undefined, fallback));
    act(() => void result.current.start());
    for (let i = 0; i < 3; i++) {
      await flush();
      act(() => FakeSocket.instances.at(-1)!.drop());
    }
    await flush();
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();

    const none = renderHook(() => useCloudDictation("s1", () => undefined, () => false));
    post.mockRejectedValue(new Error("503"));
    act(() => void none.result.current.start());
    await flush();
    expect(none.result.current.error).toBe("network");
    expect(none.result.current.listening).toBe(false);
  });

  it("a denied microphone is reported, not papered over by the fallback", async () => {
    getUserMedia.mockRejectedValue(new DOMException("no", "NotAllowedError"));
    const fallback = vi.fn(() => true);
    const { result } = renderHook(() => useCloudDictation("s1", () => undefined, fallback));
    act(() => void result.current.start());
    await flush();
    expect(result.current.blocked).toBe(true);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("is unsupported where the browser can't stream webm audio (the browser recogniser is used instead)", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => false });
    const { result } = renderHook(() => useCloudDictation("s1", () => undefined, () => false));
    expect(result.current.supported).toBe(false);
    expect(result.current.start()).toBe(false);
  });
});

// ───────────────────────── cloud voice ─────────────────────────

function browserSpeech() {
  const spoken: string[] = [];
  const synth = {
    getVoices: () => [{ name: "Veena", lang: "en-IN" }],
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    cancel: vi.fn(),
    speak: (u: { text: string; onend?: () => void }) => {
      spoken.push(u.text);
      queueMicrotask(() => u.onend?.());
    },
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      lang = "";
      voice = null;
      rate = 1;
      onend?: () => void;
      constructor(public text: string) {}
    },
  );
  return spoken;
}

describe("Manisha's cloud voice", () => {
  let played: string[];
  beforeEach(() => {
    played = [];
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      played.push(this.src);
      queueMicrotask(() => this.onended?.(new Event("ended")));
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  it("speaks through the server and never through the browser when it works", async () => {
    const browser = browserSpeech();
    blob.mockResolvedValue(new Blob(["mp3"]));
    const { result } = renderHook(() => useManishaVoice({ sessionId: "s1" }));
    let r;
    await act(async () => {
      r = await result.current.speak("Tell me about **your** project.");
    });
    expect(r).toEqual({ ok: true });
    expect(blob).toHaveBeenCalledWith("/career/voice/s1/speech", { text: "Tell me about your project." }, expect.any(AbortSignal));
    expect(played).toHaveLength(1);
    expect(browser).toHaveLength(0);
  });

  it("falls back to the browser voice when the allowance is used up, and stops asking the server", async () => {
    const browser = browserSpeech();
    blob.mockRejectedValue(new ApiError(429, "VOICE_QUOTA", "used up"));
    const { result } = renderHook(() => useManishaVoice({ sessionId: "s1" }));
    await act(async () => {
      await result.current.speak("First question.");
      await result.current.speak("Second question.");
    });
    expect(browser).toEqual(["First question.", "Second question."]);
    expect(blob).toHaveBeenCalledTimes(1);
  });

  it("never plays a line that arrives after the interview moved on", async () => {
    browserSpeech();
    let resolve!: (b: Blob) => void;
    blob.mockReturnValue(new Promise<Blob>((r) => (resolve = r)));
    const { result } = renderHook(() => useManishaVoice({ sessionId: "s1" }));
    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.speak("Old question.");
    });
    await waitFor(() => expect(blob).toHaveBeenCalled());
    act(() => result.current.stop());
    expect((blob.mock.calls[0][2] as AbortSignal).aborted).toBe(true);
    await act(async () => {
      resolve(new Blob(["late"]));
      await pending;
    });
    expect(played).toHaveLength(0);
  });

  it("muted means silent, cloud or not", async () => {
    browserSpeech();
    const { result } = renderHook(() => useManishaVoice({ sessionId: "s1" }));
    act(() => result.current.setMuted(true));
    await expect(result.current.speak("Hello")).resolves.toEqual({ ok: false, reason: "muted" });
    expect(blob).not.toHaveBeenCalled();
  });
});
