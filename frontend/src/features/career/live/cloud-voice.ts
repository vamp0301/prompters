"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useDictation, type DictationError } from "./use-voice";
import { LOW_CONFIDENCE, averageConfidence, listenUrl, parseSttMessage } from "./voice-core";

export type VoiceConfig = { stt: "deepgram" | "browser"; tts: "elevenlabs" | "browser" };
const BROWSER_ONLY: VoiceConfig = { stt: "browser", tts: "browser" };

/** Which engines the server offers. Any problem → the browser's own engines. */
export function useVoiceConfig() {
  const q = useQuery({ queryKey: ["career", "voice-config"], queryFn: () => api.get<VoiceConfig>("/career/voice/config"), staleTime: 5 * 60_000, retry: false });
  return q.data ?? BROWSER_ONLY;
}

type Token = { url: string; params: Record<string, string>; token: string };

/** Audio format the browser can stream and the transcriber understands (webm/opus; Safari before 18.4 has none). */
function streamMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

const MAX_RECONNECTS = 2;

/**
 * Streaming speech-to-text through the server's provider (Deepgram). The browser gets a 30-second
 * token per connection — never the API key. Same shape as useDictation. When the cloud can't be
 * reached, `onFallback` gets a chance to take over (the browser recogniser) before an error shows.
 */
export function useCloudDictation(sessionId: string, onFinal: (text: string) => void, onFallback: () => boolean) {
  const supported = typeof window !== "undefined" && typeof WebSocket !== "undefined" && !!navigator.mediaDevices?.getUserMedia && !!streamMime();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<DictationError | null>(null);
  const wantRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const segmentsRef = useRef<{ text: string; confidence: number }[]>([]);
  const retriesRef = useRef(0);
  const doneRef = useRef<(() => void) | null>(null);
  const connectRef = useRef<() => Promise<void>>(async () => undefined);
  const onFinalRef = useRef(onFinal);
  const onFallbackRef = useRef(onFallback);
  useEffect(() => {
    onFinalRef.current = onFinal;
    onFallbackRef.current = onFallback;
  }, [onFinal, onFallback]);

  const stopRecorder = () => {
    const rec = recRef.current;
    recRef.current = null;
    if (rec && rec.state !== "inactive") {
      rec.ondataavailable = null;
      rec.stop();
    }
  };

  const finish = useCallback(() => {
    setListening(false);
    setInterim("");
    doneRef.current?.();
    doneRef.current = null;
  }, []);

  const fail = useCallback(
    (kind: DictationError) => {
      wantRef.current = false;
      stopRecorder();
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      finish();
      if (kind === "mic-denied" || !onFallbackRef.current()) setError(kind);
    },
    [finish],
  );

  const connect = useCallback(async (): Promise<void> => {
    const t = await api.post<Token>(`/career/voice/${sessionId}/token`);
    if (!wantRef.current) return;
    streamRef.current ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    if (!wantRef.current) return;
    const ws = new WebSocket(listenUrl(t.url, t.params), ["bearer", t.token]);
    wsRef.current = ws;
    ws.onopen = () => {
      const rec = new MediaRecorder(streamRef.current!, { mimeType: streamMime()! });
      rec.ondataavailable = (e) => {
        if (e.data.size && ws.readyState === WebSocket.OPEN) ws.send(e.data);
      };
      // The last chunk is out: ask for the remaining words, then the server closes the stream.
      rec.onstop = () => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "CloseStream" }));
      };
      rec.start(250);
      recRef.current = rec;
    };
    ws.onmessage = (e) => {
      const ev = parseSttMessage(e.data);
      if (ev.kind === "interim") setInterim(ev.text);
      else if (ev.kind === "final") {
        segmentsRef.current.push({ text: ev.text, confidence: ev.confidence });
        setInterim("");
        onFinalRef.current(ev.text);
      }
    };
    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      if (!wantRef.current) return finish(); // closed after we asked it to — all words are in
      // Dropped mid-answer: new token, new connection (the words so far are already kept).
      stopRecorder();
      if (retriesRef.current++ < MAX_RECONNECTS) void connectRef.current().catch(() => fail("network"));
      else fail("network");
    };
  }, [sessionId, finish, fail]);
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const start = useCallback(() => {
    if (!supported) return false;
    if (wantRef.current) return true;
    wantRef.current = true;
    segmentsRef.current = [];
    retriesRef.current = 0;
    setError(null);
    setInterim("");
    setListening(true);
    void connect().catch((e: unknown) => fail(e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "mic-denied" : e instanceof DOMException ? "no-microphone" : "network"));
    return true;
  }, [supported, connect, fail]);

  /** Stops listening; resolves once the last words are in (or after 3 s). */
  const stop = useCallback(
    () =>
      new Promise<void>((resolve) => {
        wantRef.current = false;
        const ws = wsRef.current;
        if (!ws) {
          finish();
          return resolve();
        }
        const t = window.setTimeout(() => {
          ws.onclose = null;
          ws.close();
          if (wsRef.current === ws) wsRef.current = null;
          finish();
        }, 3000);
        doneRef.current = () => {
          window.clearTimeout(t);
          resolve();
        };
        if (recRef.current) stopRecorder(); // onstop sends CloseStream
        else if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "CloseStream" }));
        else ws.close();
      }),
    [finish],
  );

  // Nothing may outlive the interview room: socket, recorder, microphone.
  useEffect(
    () => () => {
      wantRef.current = false;
      stopRecorder();
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.onmessage = null;
        ws.close();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    [],
  );

  /** True when the transcript is too uncertain to score — the room asks again instead. */
  const lowConfidence = useCallback(() => averageConfidence(segmentsRef.current) < LOW_CONFIDENCE, []);

  return { supported, listening, interim, error, blocked: error === "mic-denied", start, stop, lowConfidence };
}

/**
 * The interview's dictation: cloud when the server offers it, otherwise (or once the cloud fails)
 * the browser recogniser — mid-answer if need be, keeping the words already transcribed.
 */
export function useInterviewDictation(sessionId: string, cloudEnabled: boolean, onFinal: (text: string) => void) {
  const browser = useDictation(onFinal);
  const browserRef = useRef(browser);
  useEffect(() => {
    browserRef.current = browser;
  });
  const [cloudOff, setCloudOff] = useState(false);
  const fallback = useCallback(() => {
    setCloudOff(true);
    return browserRef.current.supported && browserRef.current.start();
  }, []);
  const cloud = useCloudDictation(sessionId, onFinal, fallback);
  const useCloud = cloudEnabled && !cloudOff && cloud.supported;
  if (useCloud) return { ...cloud, engine: "cloud" as const };
  return { ...browser, lowConfidence: () => false, engine: "browser" as const };
}
