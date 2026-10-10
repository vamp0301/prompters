"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, Coffee, Keyboard, Mic, MicOff, MonitorUp, Play, RotateCcw, ShieldCheck, SkipForward, Square, Volume2, VolumeX, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { paperCard } from "@/components/ui/paper";
import { Dialog, Tabs } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { useAudioRecording, useMe } from "@/features/auth/use-me";
import { TARGET_ROLES } from "@/features/marketing/start-preparing";
import { api, ApiError } from "@/lib/api/client";
import type { InterviewSessionView, InterviewTurnView } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { microphoneStatus, useAnswerRecorder, useManishaVoice, type RecordedAudio } from "./use-voice";
import { useInterviewDictation, useVoiceConfig } from "./cloud-voice";
import { canEdit, initialRoom, roomReducer, transcriptQuality, type RoomError, type RoomState } from "./voice-core";

type Lang = "javascript" | "python";
type IntegrityType = "TAB_HIDDEN" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "SCREEN_SHARE_STOPPED" | "SCREEN_SHARE_RESUMED" | "MIC_DISCONNECTED" | "COPY" | "PASTE" | "LARGE_PASTE" | "CUT";
type Screen = "setup" | "room" | "paused" | "done" | "ended";

interface AnswerResponse {
  done: boolean;
  lead: string;
  replay?: boolean;
  closing?: string;
  current?: InterviewTurnView;
  progress?: { answered: number; target: number };
}
interface RunResponse {
  output: string;
  stderr: string;
  timedOut: boolean;
  tests: { name: string; passed: boolean; args: unknown[]; expected: unknown; actual?: unknown; error?: string }[];
}

const AREA_LABEL: Record<string, string> = {
  IMPORTANT: "High probability", GOOD: "Good to know", BETTER: "Deeper", MAY_BE_ASKED: "Possible follow-up", CONCEPTUAL: "Conceptual",
  RESUME: "Resume & background", PROJECTS: "Your projects", FUNDAMENTALS: "Fundamentals", ROLE: "Role-specific", PRACTICAL: "Practical engineering", PROBLEM_SOLVING: "Problem solving", SYSTEM_DESIGN: "System design",
};
const LEVEL_LABEL = ["", "Fundamental", "Practical", "Deep technical", "Scenario", "Architecture"];
const STATUS_TEXT: Record<RoomState, string> = {
  IDLE: "Getting ready",
  SPEAKING: "Manisha is asking",
  YOUR_TURN: "Your turn",
  LISTENING: "Listening",
  TRANSCRIBING: "Transcribing",
  REVIEW: "Review your answer",
  UNCLEAR: "Didn't catch that",
  SUBMITTING: "Sending",
  PROCESSING: "Manisha is noting your answer",
  NEXT_QUESTION: "Next question",
  ERROR: "Something went wrong",
};
const UNCLEAR_LINE = "I didn't catch that clearly. Could you repeat your answer?";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function introText(name: string, job: string, n: number, minutes: number, resumed: boolean, withJob: boolean) {
  const first = name.split(" ")[0];
  if (resumed) return `Welcome back ${first}, let's continue where we left off. Please keep answering in English.`;
  return `Hi ${first}, I'm Manisha. I'll be conducting your technical interview today for the ${job} role, based on your resume${withJob ? " and the job description" : ""}. There will be about ${n} questions over ${minutes} minutes. I'll ask one question at a time. Please answer in English, and take your time to think before you answer.`;
}

/** Typed or transcribed answers stay in this browser until submitted, so a refresh never loses them. */
const draftKey = (sessionId: string, turnId: string) => `manisha-draft:${sessionId}:${turnId}`;
function readDraft(k: string) {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
}
function writeDraft(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* storage blocked — the server keeps a copy once submitted */
  }
}

function ManishaMark({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-2xl text-accent ring-1 ring-accent/30">
      M
      <span className={cn("absolute -bottom-1 flex h-3 items-end gap-0.5 rounded bg-surface px-1", !speaking && "opacity-0")} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-0.5 animate-pulse rounded bg-accent" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 120}ms` }} />
        ))}
      </span>
    </div>
  );
}

function StatusRow({ ok, label, value, note }: { ok: boolean | null; label: string; value: string; note?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {note && <div className="mt-0.5 text-xs text-muted">{note}</div>}
      </div>
      <span className={cn("eyebrow shrink-0 rounded-full border px-2 py-0.5 text-[9px]", ok === true ? "border-accent/30 bg-accent-soft text-accent" : ok === false ? "border-warn/30 bg-warn-soft text-warn" : "border-border text-muted")}>{value}</span>
    </div>
  );
}

export function LiveRoom({ session }: { session: InterviewSessionView }) {
  const router = useRouter();
  const { data: me } = useMe();
  const recordingOn = useAudioRecording();
  const voiceConfig = useVoiceConfig();
  const voice = useManishaVoice(voiceConfig.tts === "elevenlabs" ? { sessionId: session.id } : null);
  const recorder = useAnswerRecorder();
  const [screen, setScreen] = useState<Screen>("setup");
  const [room, dispatch] = useReducer(roomReducer, initialRoom);
  const roomRef = useRef(room.state);
  useEffect(() => {
    roomRef.current = room.state;
  }, [room.state]);

  const [current, setCurrent] = useState<InterviewTurnView | null>(session.current);
  const [lead, setLead] = useState<string | null>(null);
  const [progress, setProgress] = useState(session.progress);
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState<Record<Lang, string>>({ javascript: "", python: "" });
  const [codeLang, setCodeLang] = useState<Lang>("javascript");
  const [run, setRun] = useState<RunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [share, setShare] = useState<MediaStream | null>(null);
  const [warning, setWarning] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<"skip" | "end" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pausing, setPausing] = useState(false);
  const [recordChoice, setRecordChoice] = useState<boolean | null>(session.recordAudio ?? null);
  const [askRecording, setAskRecording] = useState(false);
  const [micState, setMicState] = useState<"available" | "blocked" | "missing" | "unknown">("unknown");
  const [testState, setTestState] = useState<"idle" | "speaking" | "failed">("idle");
  const [thinkLeft, setThinkLeft] = useState(0);
  const [answerLeft, setAnswerLeft] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const answerStart = useRef(0);
  const answerRef = useRef("");
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const appendFinal = useCallback((t: string) => setAnswer((a) => (a ? `${a} ${t}` : t)), []);
  const dictation = useInterviewDictation(session.id, voiceConfig.stt === "deepgram", appendFinal);
  const displaySupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
  const isCoding = current?.kind === "CODING";
  const isProblem = current?.kind === "PROBLEM";
  const roleLabel = session.targetRole ? (TARGET_ROLES.find((r) => r.key === session.targetRole)?.label ?? session.job.title) : session.job.title;

  useEffect(() => {
    let alive = true;
    void microphoneStatus().then((s) => alive && setMicState(s));
    return () => {
      alive = false;
    };
  }, []);

  // Keep the open question's draft in this browser until it's submitted.
  useEffect(() => {
    if (current && canEdit(room.state)) writeDraft(draftKey(session.id, current.id), answer);
  }, [answer, current, room.state, session.id]);

  // Recognition errors move the candidate to typing (never a loop of permission prompts).
  useEffect(() => {
    if (!dictation.error) return;
    dispatch(dictation.error === "mic-denied" ? { type: "FAIL", error: "mic-denied" } : { type: "TYPE" });
  }, [dictation.error]);

  // ── integrity logging ──
  const log = useCallback(
    async (type: IntegrityType, meta?: Record<string, unknown>) => {
      if (screen !== "room") return null;
      try {
        const r = await api.post<{ warning: number; ended: boolean; limit?: number }>(`/career/sessions/${session.id}/integrity`, { events: [{ type, meta }] });
        if (r.ended) {
          setScreen("ended");
          voice.stop();
          void dictation.stop();
        }
        return r;
      } catch {
        return null;
      }
    },
    [screen, session.id, voice, dictation],
  );

  useEffect(() => {
    if (screen !== "room") return;
    const vis = () => document.visibilityState === "hidden" && log("TAB_HIDDEN");
    const blur = () => document.visibilityState === "visible" && log("WINDOW_BLUR");
    const fs = () => !document.fullscreenElement && log("FULLSCREEN_EXIT");
    const copy = () => log("COPY");
    const cut = () => log("CUT");
    const paste = (e: ClipboardEvent) => {
      const len = e.clipboardData?.getData("text").length ?? 0;
      log(len > 200 ? "LARGE_PASTE" : "PASTE", { length: len });
    };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("blur", blur);
    document.addEventListener("fullscreenchange", fs);
    document.addEventListener("copy", copy);
    document.addEventListener("cut", cut);
    document.addEventListener("paste", paste);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("blur", blur);
      document.removeEventListener("fullscreenchange", fs);
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", cut);
      document.removeEventListener("paste", paste);
    };
  }, [screen, log]);

  // Release the screen share when leaving the page.
  useEffect(() => () => share?.getTracks().forEach((t) => t.stop()), [share]);

  const shareScreen = async () => {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      s.getVideoTracks()[0].addEventListener("ended", async () => {
        setShare(null);
        const r = await log("SCREEN_SHARE_STOPPED");
        if (r && !r.ended) setWarning(r.warning);
      });
      setShare(s);
      if (screen === "room") {
        await log("SCREEN_SHARE_RESUMED");
        setWarning(null);
      }
    } catch {
      toast.error("Screen sharing is required for the interview. Please allow it to continue.");
    }
  };

  // ── voice test (setup screen) ──
  const testVoice = async () => {
    if (voice.speaking || testState === "speaking") {
      voice.stop();
      setTestState("idle");
      return;
    }
    setTestState("speaking");
    const r = await voice.speak("Hi, I'm Manisha. Can you hear me clearly? This is how I will read your interview questions.");
    setTestState(r.ok || r.reason === "muted" ? "idle" : "failed");
  };

  // ── question flow ──
  const askTurn = useCallback(
    async (turn: InterviewTurnView, leadText: string | null) => {
      await dictation.stop();
      recorder.discard();
      setCurrent(turn);
      setLead(leadText);
      setAnswer(turn.savedAnswer ?? readDraft(draftKey(session.id, turn.id)));
      setRun(null);
      setAnswerLeft(null);
      setErrorMessage(null);
      if (turn.coding) setCode({ javascript: turn.coding.starter.javascript, python: turn.coding.starter.python });
      dispatch({ type: "SPEAK" });
      const spoken =
        turn.kind === "CODING"
          ? `${leadText ?? ""} Here's a coding problem. Read it on screen, then start when you're ready.`
          : turn.kind === "PROBLEM"
            ? `${leadText ?? ""} Here's a problem to solve. Read it on screen, then walk me through your approach.`
            : `${leadText ?? ""} ${turn.question}`;
      const r = await voice.speak(spoken);
      dispatch(!r.ok && r.reason === "error" ? { type: "FAIL", error: "speech-failed" } : { type: "SPOKEN" });
      setThinkLeft(turn.timing.thinkingSeconds);
    },
    [voice, dictation, recorder, session.id],
  );

  const begin = async () => {
    if (!current) return;
    if (session.status === "PAUSED") {
      try {
        await api.post(`/career/sessions/${session.id}/resume`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "This interview can't be resumed.");
        router.replace(`/career/interview/${session.id}`);
        return;
      }
    }
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
    setScreen("room");
    dispatch({ type: "SPEAK" });
    await voice.speak(introText(me?.name ?? "there", roleLabel, session.questionTarget, session.durationMinutes, session.progress.answered > 0, session.mode !== "ROLE"));
    await askTurn(current, null);
  };

  const startAnswerClock = () => {
    if (answerLeft === null && current) {
      answerStart.current = Date.now();
      setAnswerLeft(current.timing.answerSeconds);
    }
  };

  /** "Answer by voice": asks about recording once, then starts recognition (and recording if allowed). */
  const answerByVoice = async (choice: boolean | null = recordChoice) => {
    if (!dictation.supported) {
      dispatch({ type: "FAIL", error: "recognition-unavailable" });
      return;
    }
    // Recording off on this server: never ask, never record.
    if (!recordingOn) choice = false;
    if (choice === null) {
      setAskRecording(true);
      return;
    }
    voice.stop();
    startAnswerClock();
    dispatch({ type: roomRef.current === "UNCLEAR" ? "RETRY_VOICE" : "LISTEN" });
    roomRef.current = "LISTENING";
    if (!dictation.start()) {
      dispatch({ type: "FAIL", error: dictation.blocked ? "mic-denied" : "recognition-unavailable" });
      return;
    }
    if (choice) {
      const r = await recorder.start();
      if (r === "denied") toast.message("Microphone recording was blocked — your answer is still transcribed and counts.");
    }
  };

  const decideRecording = async (allow: boolean) => {
    setAskRecording(false);
    setRecordChoice(allow);
    await api.post(`/career/sessions/${session.id}/recording`, { allow }).catch(() => undefined);
    await answerByVoice(allow);
  };

  /** Stop listening → wait for the last words → review (or "didn't catch that"). */
  const stopListening = useCallback(async () => {
    if (roomRef.current !== "LISTENING") return;
    dispatch({ type: "STOP_LISTENING" });
    roomRef.current = "TRANSCRIBING";
    await dictation.stop();
    // Let the last recognised words land in state before judging the transcript.
    await new Promise((r) => setTimeout(r, 0));
    // A transcript the recogniser itself wasn't sure about is "didn't catch that", never scored.
    const quality = transcriptQuality(answerRef.current);
    dispatch({ type: "TRANSCRIBED", quality: quality === "ok" && dictation.lowConfidence() ? "garbled" : quality });
  }, [dictation]);

  const typeAnswer = async () => {
    if (roomRef.current === "LISTENING") await dictation.stop();
    recorder.discard();
    startAnswerClock();
    dispatch({ type: "TYPE" });
  };

  // Manisha says "I didn't catch that" when a voice answer comes back empty or garbled.
  useEffect(() => {
    if (room.state === "UNCLEAR") void voice.speak(UNCLEAR_LINE);
  }, [room.state, voice]);

  const finishWithReport = useCallback(
    async (closing: string | undefined) => {
      setScreen("done");
      share?.getTracks().forEach((t) => t.stop());
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      await voice.speak(closing ?? "Thank you, that's the end of the interview.");
      router.replace(`/career/interview/${session.id}`);
    },
    [share, voice, router, session.id],
  );

  const submit = useCallback(
    async (skipped = false) => {
      if (!current) return;
      const state = roomRef.current;
      if (state === "SUBMITTING" || state === "PROCESSING") return; // never twice
      if (state === "LISTENING") await dictation.stop();
      const text = answer.trim();
      if (!skipped && !isCoding && transcriptQuality(text) === "empty") {
        toast.error("Write or say an answer first — or skip the question.");
        return;
      }
      dispatch({ type: "SUBMIT" });
      roomRef.current = "SUBMITTING";
      let audio: RecordedAudio = null;
      if (isCoding || skipped) recorder.discard();
      else audio = await recorder.finish();
      dispatch({ type: "SENT" });
      try {
        const r = await api.post<AnswerResponse>(`/career/sessions/${session.id}/answer`, {
          turnId: current.id,
          skipped,
          answerText: skipped ? undefined : text || undefined,
          durationSec: answerStart.current ? Math.round((Date.now() - answerStart.current) / 1000) : undefined,
          ...(audio && !skipped ? { audioBase64: audio.base64, audioMime: audio.mime } : {}),
          ...(isCoding && !skipped ? { code: code[codeLang], codeLanguage: codeLang } : {}),
        });
        writeDraft(draftKey(session.id, current.id), "");
        if (r.progress) setProgress(r.progress);
        dispatch({ type: "NEXT" });
        if (r.done) await finishWithReport(r.closing);
        else if (r.current) await askTurn(r.current, r.lead);
      } catch (e) {
        if (e instanceof ApiError && e.code === "ANSWER_PROCESSING") {
          // A double click or another tab is already sending this answer — pick up whatever comes next.
          const s = await api.get<InterviewSessionView>(`/career/sessions/${session.id}`).catch(() => null);
          if (s?.current && s.current.id !== current.id) {
            dispatch({ type: "NEXT" });
            return askTurn(s.current, s.current.lead);
          }
          setErrorMessage("Your answer is still being processed. Try again in a moment.");
          dispatch({ type: "FAIL", error: "processing" });
          return;
        }
        if (e instanceof ApiError && e.status === 409) {
          router.replace(`/career/interview/${session.id}`);
          return;
        }
        const kind: RoomError = e instanceof ApiError && e.code === "NETWORK_ERROR" ? "network" : "ai";
        setErrorMessage(
          kind === "network"
            ? "You seem to be offline. Your answer is saved on this device — try again when you're back online, continue later, or end the interview."
            : e instanceof ApiError && e.code === "AI_RETRY"
              ? e.message
              : "Manisha couldn't process that answer. Your answer is saved — try again, continue later, or end the interview.",
        );
        writeDraft(draftKey(session.id, current.id), text);
        dispatch({ type: "FAIL", error: kind });
      }
    },
    [current, answer, isCoding, recorder, code, codeLang, session.id, askTurn, finishWithReport, router, dictation],
  );

  // ── clocks (state changes happen inside interval callbacks) ──
  useEffect(() => {
    if (screen !== "room" || room.state !== "YOUR_TURN" || answerLeft !== null) return;
    const t = setInterval(() => {
      setThinkLeft((s) => {
        if (s > 1) return s - 1;
        clearInterval(t);
        // Thinking time is over: the answer clock starts. Voice is never started automatically.
        queueMicrotask(() => {
          answerStart.current = Date.now();
          setAnswerLeft(current?.timing.answerSeconds ?? 120);
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [screen, room.state, answerLeft, current]);

  useEffect(() => {
    if (screen !== "room" || answerLeft === null || answerLeft === 0 || !["YOUR_TURN", "LISTENING", "REVIEW", "UNCLEAR"].includes(room.state)) return;
    const t = setInterval(() => {
      setAnswerLeft((s) => {
        if (s === null || s > 1) return s === null ? s : s - 1;
        clearInterval(t);
        // Time's up: stop listening and let the candidate review — never auto-submit silence.
        queueMicrotask(() => {
          if (roomRef.current === "LISTENING") void stopListening();
          toast.message("Time's up for this question — review your answer and submit it.");
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [screen, answerLeft, room.state, stopListening]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const overallLeft = Math.max(0, Math.round((new Date(session.endsAt).getTime() - now) / 1000));

  const runTests = async () => {
    if (!current) return;
    setRunning(true);
    try {
      setRun(await api.post<RunResponse>(`/career/sessions/${session.id}/run-code`, { turnId: current.id, language: codeLang, code: code[codeLang] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't run your code.");
    } finally {
      setRunning(false);
    }
  };

  const pauseInterview = async () => {
    setPausing(true);
    voice.stop();
    await dictation.stop();
    recorder.discard();
    try {
      await api.post(`/career/sessions/${session.id}/pause`);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setScreen("paused");
      dispatch({ type: "RESET" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't pause the interview.");
    } finally {
      setPausing(false);
    }
  };

  const continueInterview = async () => {
    if (!current) return;
    try {
      await api.post(`/career/sessions/${session.id}/resume`);
      await document.documentElement.requestFullscreen?.().catch(() => undefined);
      setScreen("room");
      await askTurn(current, "Welcome back. Let's continue.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "This interview can't be resumed.");
      router.replace(`/career/interview/${session.id}`);
    }
  };

  const endNow = async () => {
    setConfirm(null);
    await dictation.stop();
    voice.stop();
    recorder.discard();
    await api.post(`/career/sessions/${session.id}/end`).catch(() => undefined);
    await finishWithReport("Alright, let's end the interview here. Thank you.");
  };

  const muteButton = (
    <Button size="sm" variant="secondary" onClick={() => voice.setMuted(!voice.muted)} aria-pressed={voice.muted} aria-label={voice.muted ? "Unmute Manisha's voice" : "Mute Manisha's voice"}>
      {voice.muted ? <VolumeX className="size-3.5" aria-hidden /> : <Volume2 className="size-3.5" aria-hidden />}
      {voice.muted ? "Manisha's voice: muted" : "Mute Manisha"}
    </Button>
  );

  // ───────────────────────── render ─────────────────────────

  if (screen === "ended") {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className={cn(paperCard, "max-w-md p-6 text-center")}>
          <XCircle className="mx-auto size-10 text-danger" aria-hidden />
          <h1 className="font-display mt-3 text-3xl">The interview has ended</h1>
          <p className="mt-2 text-sm text-muted">The required interview environment wasn&apos;t maintained — screen sharing was interrupted three times. Your answers so far are in your report.</p>
          <Link href={`/career/interview/${session.id}`} className="mt-5 inline-block text-sm text-accent underline-offset-4 hover:underline">View report</Link>
        </div>
      </div>
    );
  }

  if (screen === "paused") {
    return (
      <div className="bg-grid grid min-h-screen place-items-center p-6">
        <div className={cn(paperCard, "max-w-md p-7 text-center")}>
          <Coffee className="mx-auto size-9 text-accent" aria-hidden />
          <h1 className="font-display mt-3 text-3xl">Interview paused</h1>
          <p className="mt-2 text-sm text-muted">The clock is stopped. Continue now, or come back within 24 hours from Career AI — you&apos;ll pick up at question {Math.min(progress.answered + 1, progress.target)}.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={continueInterview}>
              <Play className="size-4" aria-hidden /> Continue now
            </Button>
            <Link href="/career?tab=interview" className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">
              Leave and continue later
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "setup") {
    const v = voice.choice;
    return (
      <div className="bg-grid min-h-screen px-4 py-10">
        <div className={cn(paperCard, "mx-auto max-w-2xl p-6 sm:p-8")}>
          <div className="flex items-center gap-4">
            <ManishaMark speaking={voice.speaking} />
            <div>
              <div className="eyebrow text-accent">Manisha</div>
              <h1 className="font-display text-3xl leading-tight">AI technical interview</h1>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border py-4 text-sm sm:grid-cols-4">
            {[
              ["Role", roleLabel],
              ["Difficulty", session.difficulty === "HARD" ? "Hard" : "Standard"],
              ["Duration", `${session.durationMinutes} min · ${session.questionTarget} questions`],
              ["Language", "English"],
            ].map(([k, val]) => (
              <div key={k}>
                <dt className="eyebrow text-[9px] text-muted">{k}</dt>
                <dd className="mt-1">{val}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="voice-h" className="mt-6">
            <h2 id="voice-h" className="eyebrow text-accent">Voice</h2>
            <div className="divide-y divide-border">
              {voice.cloud ? (
                <StatusRow ok label="Manisha's voice" value="Natural voice" note="Spoken by a cloud voice service. If it's unavailable, your browser's voice reads the questions instead." />
              ) : (
              <StatusRow
                ok={!voice.supported || !v ? false : v.indianEnglish}
                label="Indian English voice (en-IN)"
                value={!voice.supported ? "Not available" : !v ? (voice.voicesLoaded ? "Not available" : "Checking…") : v.indianEnglish ? "Available" : "Not available"}
                note={
                  !voice.supported || !v
                    ? "Your browser has no speech voices. Questions will appear on screen as text."
                    : v.indianEnglish
                      ? `Manisha will use: ${v.voice.name} (${v.voice.lang}).`
                      : `Your device does not provide the preferred Indian English voice. Manisha will use the closest available voice: ${v.voice.name} (${v.voice.lang}).`
                }
              />
              )}
              <div className="flex flex-wrap items-center gap-2 py-3">
                <Button size="sm" variant="secondary" onClick={testVoice} disabled={!voice.supported || voice.muted}>
                  {testState === "speaking" || voice.speaking ? (
                    <>
                      <Square className="size-3.5" aria-hidden /> Stop test
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3.5" aria-hidden /> Test voice
                    </>
                  )}
                </Button>
                {muteButton}
                <span role="status" aria-live="polite" className="text-xs text-muted">
                  {testState === "speaking" || voice.speaking ? "Manisha is speaking…" : testState === "failed" ? "The test voice couldn't play on this device. Questions will still appear on screen." : ""}
                </span>
              </div>
              <StatusRow
                ok={micState === "available" ? true : micState === "unknown" ? null : false}
                label="Microphone"
                value={{ available: "Available", blocked: "Blocked", missing: "Not found", unknown: "Not checked" }[micState]}
                note={
                  micState === "blocked"
                    ? "Microphone permission is blocked. To answer by voice, allow the microphone from the site settings next to the address bar, then reload. You can still type every answer."
                    : micState === "missing"
                      ? "No microphone found. You can type every answer."
                      : "Your browser asks for permission the first time you answer by voice."
                }
              />
              <StatusRow
                ok={dictation.supported}
                label="Speech-to-text"
                value={dictation.supported ? (dictation.engine === "cloud" ? "Cloud" : "Available") : "Not available"}
                note={
                  !dictation.supported
                    ? "Voice answering isn't available in this browser. You can type your answer instead."
                    : dictation.engine === "cloud"
                      ? `Your speech is transcribed live by a cloud service (Deepgram) and appears as text you can edit before submitting. Prompters doesn't keep the audio${recordingOn ? " unless you allow recording" : ""}.`
                      : "Your spoken answer appears as text you can edit before submitting."
                }
              />
              <StatusRow
                ok={share ? true : displaySupported ? null : false}
                label="Screen sharing (required)"
                value={share ? "Shared" : displaySupported ? "Not shared" : "Not available"}
                note={displaySupported ? "Share your entire screen. Interrupting it 3 times ends the interview. It is never recorded or uploaded." : "Screen sharing isn't available in this browser. Please use Chrome or Edge on a laptop or desktop."}
              />
            </div>
            <p className="mt-3 text-xs text-muted">Voice quality depends on your browser and device. Voice is optional — you can type every answer.</p>
          </section>

          <div className="mt-5 rounded-lg border border-border p-3 text-xs text-muted">
            <ShieldCheck className="mr-1 inline size-4 text-accent" aria-hidden /> AI help is off. Manisha asks one question at a time and won&apos;t give hints or answers — feedback comes in your report. Tab switches, fullscreen exits and clipboard use are logged as integrity signals. Your report is a preparation assessment, not a hiring decision.
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {!share && (
              <Button variant="secondary" className="sm:flex-1" onClick={shareScreen} disabled={!displaySupported}>
                <MonitorUp className="size-4" aria-hidden /> Share screen
              </Button>
            )}
            <Button className="sm:flex-1" size="lg" disabled={!share} onClick={begin}>
              {session.progress.answered > 0 || session.status === "PAUSED" ? "Continue interview" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── interview room ──
  const s = room.state;
  const busy = s === "SUBMITTING" || s === "PROCESSING" || s === "NEXT_QUESTION";
  const answering = ["YOUR_TURN", "LISTENING", "TRANSCRIBING", "REVIEW", "UNCLEAR", "ERROR"].includes(s);
  const voiceBlockedReason = !dictation.supported
    ? "Voice answering isn't available in this browser. You can type your answer instead."
    : dictation.blocked
      ? "Microphone permission is blocked. Allow it from the site settings next to the address bar, then reload — or type your answer."
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <div className="eyebrow text-accent">Manisha · Technical interview · {roleLabel}</div>
          <div className="text-sm font-semibold">
            Question {Math.min(progress.answered + 1, progress.target)} / {progress.target}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone={share ? "accent" : "danger"}>
            <MonitorUp className="size-3" aria-hidden /> {share ? "Sharing" : "Not sharing"}
          </Badge>
          <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", overallLeft < 300 && "text-warn")} role="timer" aria-label={`Interview time left ${fmt(overallLeft)}`}>
            <Clock className="size-3.5" aria-hidden /> {fmt(overallLeft)}
          </span>
          <Button size="sm" variant="secondary" onClick={pauseInterview} loading={pausing} disabled={busy}>
            <Coffee className="size-3.5" aria-hidden /> Pause
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm("end")} disabled={busy}>
            End
          </Button>
        </div>
      </header>
      <Progress value={(progress.answered / progress.target) * 100} className="rounded-none" label="Interview progress" />

      <main className={cn("mx-auto grid w-full flex-1 content-start gap-5 p-4 sm:p-6", isCoding ? "max-w-[1500px] lg:grid-cols-[minmax(320px,440px)_1fr]" : "max-w-3xl")}>
        {/* The interview sheet: the question, always readable. */}
        <section className={cn(paperCard, "h-fit p-5 pt-4")} aria-labelledby="question-h">
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow text-accent-2">Interview sheet</span>
            <span role="status" aria-live="polite" className={cn("eyebrow rounded-full border px-2 py-0.5 text-[9px]", s === "LISTENING" ? "border-danger/40 bg-danger-soft text-danger" : s === "ERROR" || s === "UNCLEAR" ? "border-warn/40 bg-warn-soft text-warn" : "border-border text-muted")}>
              {s === "LISTENING" && <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-danger align-middle" aria-hidden />}
              {s === "YOUR_TURN" && answerLeft === null ? "Thinking" : STATUS_TEXT[s]}
            </span>
          </div>
          <div className="flex items-start gap-4">
            <ManishaMark speaking={voice.speaking} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Manisha</div>
              {lead && <p className="text-sm text-muted">{lead}</p>}
              {current && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {current.kind === "FOLLOW_UP" && <Badge tone="info">Follow-up</Badge>}
                  {current.kind === "REPEAT" && <Badge tone="info">Asked again</Badge>}
                  {current.kind === "CODING" && <Badge tone="info">Coding</Badge>}
                  {current.kind === "PROBLEM" && <Badge tone="info">Problem solving</Badge>}
                  <Badge>{AREA_LABEL[current.area ?? current.category] ?? current.category}</Badge>
                  <Badge>
                    L{current.level} · {LEVEL_LABEL[current.level]}
                  </Badge>
                  <Badge>{current.skill}</Badge>
                </div>
              )}
            </div>
          </div>
          {current && (
            <div id="question-h" className="font-display mt-4 text-xl leading-relaxed">
              <Markdown>{current.question}</Markdown>
            </div>
          )}
          {isCoding && current?.coding && (
            <ul className="mt-4 space-y-1.5 font-mono text-[11px]">
              {current.coding.publicTests.map((t) => (
                <li key={t.name} className="rounded-md border border-border bg-surface-2 p-2">
                  {current.coding!.functionName}({t.args.map((a) => JSON.stringify(a)).join(", ")}) → {JSON.stringify(t.expected)}
                </li>
              ))}
              <li className="text-subtle">+ {current.coding.hiddenTestCount} hidden tests on submit</li>
            </ul>
          )}
          {room.error === "speech-failed" && s !== "SPEAKING" && <p className="mt-4 text-xs text-warn">Manisha&apos;s voice couldn&apos;t play on this device — read the question above.</p>}
          {s === "PROCESSING" || s === "SUBMITTING" ? <p className="mt-5 animate-pulse text-sm text-muted">Manisha is noting your answer…</p> : null}
          {screen === "done" && <p className="mt-5 text-sm text-accent">Interview complete — preparing your report…</p>}
        </section>

        {/* Answer area */}
        {!isCoding && current && screen === "room" && (answering || busy) && (
          <section className={cn(paperCard, "p-5")} aria-label="Answer area">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="eyebrow text-text">{isProblem ? "Your approach — pseudocode welcome" : "Your answer"}</span>
              <span className={cn("font-mono text-xs tabular-nums", (answerLeft ?? thinkLeft) < 20 && "text-warn")} role="timer" aria-label={answerLeft === null ? `Thinking time ${fmt(thinkLeft)}` : `Answer time ${fmt(answerLeft)}`}>
                {answerLeft === null ? `Thinking ${fmt(thinkLeft)}` : `Answer ${fmt(answerLeft)}`}
              </span>
            </div>

            {/* Voice controls — voice is never required. */}
            {(s === "YOUR_TURN" || s === "REVIEW" || s === "ERROR") && (
              <div className="mb-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void answerByVoice()} disabled={!!voiceBlockedReason}>
                  <Mic className="size-3.5" aria-hidden /> {s === "REVIEW" && answer ? "Answer again by voice" : "Answer by voice"}
                </Button>
                {s === "YOUR_TURN" && (
                  <Button size="sm" variant="secondary" onClick={() => void typeAnswer()}>
                    <Keyboard className="size-3.5" aria-hidden /> Type answer
                  </Button>
                )}
                {muteButton}
              </div>
            )}
            {voiceBlockedReason && (s === "YOUR_TURN" || s === "REVIEW") && (
              <p className="mb-3 flex gap-2 rounded-md border border-border bg-surface-2 p-2.5 text-xs text-muted">
                <MicOff className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {voiceBlockedReason}
              </p>
            )}

            {s === "LISTENING" || s === "TRANSCRIBING" ? (
              <div>
                <div aria-live="polite" aria-label="Live transcript" className="min-h-32 rounded-lg border border-danger/30 bg-surface-2/60 p-3 text-[15px] leading-relaxed">
                  {answer || dictation.interim ? (
                    <>
                      {answer} <span className="italic text-subtle">{dictation.interim}</span>
                    </>
                  ) : (
                    <span className="text-subtle">{s === "LISTENING" ? "Listening… speak your answer in English." : "Transcribing…"}</span>
                  )}
                </div>
                {recorder.recording && <p className="mt-1.5 text-[11px] text-muted">Recording your answer audio (you allowed this).</p>}
                {recorder.overLimit && <p className="mt-1.5 text-[11px] text-warn">This answer is too long to keep as audio — the transcript is kept, the recording won&apos;t be saved.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void stopListening()} disabled={s === "TRANSCRIBING"} loading={s === "TRANSCRIBING"}>
                    <Square className="size-3.5" aria-hidden /> Stop &amp; review
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void typeAnswer()}>
                    <Keyboard className="size-3.5" aria-hidden /> Switch to typing
                  </Button>
                  {muteButton}
                </div>
              </div>
            ) : s === "UNCLEAR" ? (
              <div role="alert" className="rounded-lg border border-warn/30 bg-warn-soft p-3 text-sm">
                <p className="font-medium">&ldquo;{UNCLEAR_LINE}&rdquo;</p>
                <p className="mt-1 text-xs text-muted">Nothing was scored. Try again, or type your answer.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void answerByVoice()} disabled={!!voiceBlockedReason}>
                    <RotateCcw className="size-3.5" aria-hidden /> Try again
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void typeAnswer()}>
                    <Keyboard className="size-3.5" aria-hidden /> Type instead
                  </Button>
                </div>
              </div>
            ) : s === "YOUR_TURN" ? (
              <p className="text-sm text-muted">Take a moment to think. When you&apos;re ready, answer by voice or type your answer.</p>
            ) : (
              <>
                <Textarea
                  aria-label={isProblem ? "Your approach" : "Your answer"}
                  className={cn(isProblem ? "min-h-64 font-mono text-[13px]" : "min-h-44")}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  readOnly={busy}
                  placeholder={isProblem ? "Explain your approach step by step. Pseudocode is fine. Finish with the time and space complexity and the edge cases you'd handle." : "Type your answer in English."}
                />
                {room.error === "mic-denied" && <p className="mt-1.5 text-xs text-warn">Microphone permission is blocked — you can type your answer.</p>}
                {s === "ERROR" && (
                  <div role="alert" className="mt-3 rounded-lg border border-warn/30 bg-warn-soft p-3 text-sm">
                    <p className="flex gap-2 text-warn">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {errorMessage}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void submit(false)}>
                        <RotateCcw className="size-3.5" aria-hidden /> Try again
                      </Button>
                      <Button size="sm" variant="secondary" onClick={pauseInterview} loading={pausing}>
                        <Coffee className="size-3.5" aria-hidden /> Continue later
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirm("end")}>
                        End interview
                      </Button>
                    </div>
                  </div>
                )}
                {s !== "ERROR" && (
                  <div className="mt-4 flex flex-wrap justify-between gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirm("skip")} disabled={busy}>
                      <SkipForward className="size-3.5" aria-hidden /> Skip
                    </Button>
                    <Button size="sm" onClick={() => void submit(false)} disabled={busy || !answer.trim()} loading={busy}>
                      <CheckCircle2 className="size-3.5" aria-hidden /> Submit answer
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {isCoding && current?.coding && screen === "room" && (
          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
              <Tabs value={codeLang} onChange={setCodeLang} items={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }]} />
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-xs tabular-nums", (answerLeft ?? 999) < 60 && "text-warn")}>{answerLeft === null ? `Reading ${fmt(thinkLeft)}` : fmt(answerLeft)}</span>
                {s === "YOUR_TURN" && (
                  <Button size="sm" variant="secondary" onClick={() => void typeAnswer()}>
                    <Play className="size-3.5" aria-hidden /> Start
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={runTests} loading={running} disabled={s !== "REVIEW"}>
                  <Play className="size-3.5" aria-hidden /> Run tests
                </Button>
                <Button size="sm" onClick={() => void submit(false)} disabled={s !== "REVIEW" && s !== "ERROR"} loading={busy}>
                  Submit
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-code">
              <CodeEditor value={code[codeLang]} onChange={(v) => setCode((c) => ({ ...c, [codeLang]: v }))} language={codeLang} readOnly={s !== "REVIEW"} ariaLabel="Your solution" />
            </div>
            <div className="grid gap-3 border-t border-border bg-surface p-3 md:grid-cols-2">
              <Textarea aria-label="Explain your approach" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Briefly explain your approach and its time complexity." className="min-h-20" />
              <div className="max-h-40 overflow-y-auto font-mono text-[11px]" aria-live="polite">
                {run ? (
                  run.tests.map((t) => (
                    <div key={t.name} className={t.passed ? "text-accent" : "text-danger"}>
                      {t.passed ? "✓" : "✗"} {t.name}
                      {!t.passed && ` — got ${t.error ?? JSON.stringify(t.actual)}`}
                    </div>
                  ))
                ) : (
                  <span className="text-subtle">Run the visible tests while you work.</span>
                )}
                {run?.stderr && <pre className="mt-1 whitespace-pre-wrap text-danger">{run.stderr.slice(0, 600)}</pre>}
              </div>
            </div>
            {s === "ERROR" && <p role="alert" className="border-t border-border bg-warn-soft p-3 text-sm text-warn">{errorMessage}</p>}
          </section>
        )}
      </main>

      {/* Recording consent — asked once, before the first voice answer. Declining never blocks anything. */}
      <Dialog open={askRecording} onClose={() => setAskRecording(false)} title="Record your answer audio?">
        <p className="text-sm">Your answer audio may be recorded and analyzed for this interview.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
          <li>Recordings let you replay your answers in the report.</li>
          <li>They are deleted automatically after 30 days, and you can delete them any time.</li>
          <li>You can continue without recording — your spoken answer is still turned into text and counts the same.</li>
        </ul>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => void decideRecording(false)}>
            Continue without recording
          </Button>
          <Button onClick={() => void decideRecording(true)}>
            <Mic className="size-4" aria-hidden /> Allow recording
          </Button>
        </div>
      </Dialog>

      <Dialog open={warning !== null} onClose={() => undefined} title={`Warning #${warning}`}>
        <div className="flex gap-3">
          <AlertTriangle className="size-6 shrink-0 text-warn" aria-hidden />
          <div className="text-sm">
            <p className="font-medium">Screen sharing was interrupted.</p>
            <p className="mt-1 text-muted">Please resume screen sharing to continue the interview. {warning !== null && warning >= 2 ? "One more interruption will end the interview." : ""}</p>
          </div>
        </div>
        <Button className="mt-5 w-full" onClick={shareScreen}>
          <MonitorUp className="size-4" aria-hidden /> Resume screen sharing
        </Button>
      </Dialog>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "skip" ? "Skip this question?" : "End the interview now?"}>
        <p className="text-sm text-muted">{confirm === "skip" ? "A skipped question counts as unanswered in your report." : "Unanswered questions won't be scored. Your report will use the answers you've given so far."}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Keep going
          </Button>
          <Button variant={confirm === "end" ? "danger" : "primary"} onClick={() => (confirm === "skip" ? (setConfirm(null), void submit(true)) : void endNow())}>
            {confirm === "skip" ? "Skip" : "End interview"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
