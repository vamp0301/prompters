"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Mic, MicOff, MonitorUp, Pause, Play, ShieldCheck, SkipForward, Volume2, VolumeX, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { paperCard } from "@/components/ui/paper";
import { Dialog, Tabs } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { useMe } from "@/features/auth/use-me";
import { api, ApiError } from "@/lib/api/client";
import type { InterviewLanguage, InterviewSessionView, InterviewTurnView } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useAnswerRecorder, useDictation, useManishaVoice } from "./use-voice";

type Phase = "preflight" | "asking" | "thinking" | "answering" | "submitting" | "done" | "ended";
type Lang = "javascript" | "python";
type IntegrityType = "TAB_HIDDEN" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "SCREEN_SHARE_STOPPED" | "SCREEN_SHARE_RESUMED" | "MIC_DISCONNECTED" | "COPY" | "PASTE" | "LARGE_PASTE" | "CUT";

interface AnswerResponse {
  done: boolean;
  lead: string;
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

const CATEGORY_LABEL: Record<string, string> = { IMPORTANT: "High probability", GOOD: "Good to know", BETTER: "Deeper", MAY_BE_ASKED: "Possible follow-up", CONCEPTUAL: "Conceptual" };
const LEVEL_LABEL = ["", "Fundamental", "Practical", "Deep technical", "Scenario", "Architecture"];

function introText(name: string, job: string, n: number, minutes: number, resumed: boolean) {
  const first = name.split(" ")[0];
  if (resumed) return `Welcome back ${first}, let's continue where we left off. Please keep answering in English.`;
  return `Hi ${first}, I'm Manisha. I'll be conducting your technical interview today for the ${job} role, based on your resume and the job description. There will be about ${n} questions over ${minutes} minutes. Please answer in English. Take your time to think before you answer.`;
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function ManishaAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent ring-1 ring-accent/30">
      M
      <span className={cn("absolute -bottom-1 flex h-3 items-end gap-0.5 rounded bg-surface px-1", !speaking && "opacity-0")} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-0.5 animate-pulse rounded bg-accent" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 120}ms` }} />
        ))}
      </span>
    </div>
  );
}

export function LiveRoom({ session }: { session: InterviewSessionView }) {
  const router = useRouter();
  const { data: me } = useMe();
  // Interviews are strictly English: Manisha speaks en-IN and dictation listens for English.
  const language: InterviewLanguage = "en";
  const voice = useManishaVoice(language);
  const [phase, setPhase] = useState<Phase>("preflight");
  const [current, setCurrent] = useState<InterviewTurnView | null>(session.current);
  const [lead, setLead] = useState<string | null>(null);
  const [progress, setProgress] = useState(session.progress);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState<Record<Lang, string>>({ javascript: "", python: "" });
  const [codeLang, setCodeLang] = useState<Lang>("javascript");
  const [run, setRun] = useState<RunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [mic, setMic] = useState<MediaStream | null>(null);
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [warning, setWarning] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<"skip" | "end" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const answerStart = useRef(0);
  const phaseRef = useRef<Phase>("preflight");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const recorder = useAnswerRecorder(mic);
  const appendFinal = useCallback((t: string) => setAnswer((a) => (a ? `${a} ${t}` : t)), []);
  const dictation = useDictation(language, appendFinal);
  const displaySupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
  const isCoding = current?.kind === "CODING";

  // ── integrity logging ──
  const log = useCallback(
    async (type: IntegrityType, meta?: Record<string, unknown>) => {
      if (["preflight", "done", "ended"].includes(phaseRef.current)) return null;
      try {
        const r = await api.post<{ warning: number; ended: boolean; limit?: number }>(`/career/sessions/${session.id}/integrity`, { events: [{ type, meta }] });
        if (r.ended) {
          setPhase("ended");
          voice.stop();
          dictation.stop();
        }
        return r;
      } catch {
        return null;
      }
    },
    [session.id, voice, dictation],
  );

  useEffect(() => {
    if (phase === "preflight" || phase === "done" || phase === "ended") return;
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
  }, [phase, log]);

  // Clean up media when leaving the page.
  useEffect(
    () => () => {
      mic?.getTracks().forEach((t) => t.stop());
      screen?.getTracks().forEach((t) => t.stop());
    },
    [mic, screen],
  );

  // ── media setup ──
  const enableMic = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      s.getAudioTracks()[0].addEventListener("ended", () => {
        setMic(null);
        log("MIC_DISCONNECTED");
        toast.warning("Microphone disconnected — you can keep typing your answers.");
      });
      setMic(s);
    } catch {
      toast.error("Microphone access was blocked. You can still type your answers.");
    }
  };

  const shareScreen = async () => {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      s.getVideoTracks()[0].addEventListener("ended", async () => {
        setScreen(null);
        setPaused(true);
        const r = await log("SCREEN_SHARE_STOPPED");
        if (r && !r.ended) setWarning(r.warning);
      });
      setScreen(s);
      if (phaseRef.current !== "preflight") {
        await log("SCREEN_SHARE_RESUMED");
        setWarning(null);
        setPaused(false);
      }
    } catch {
      toast.error("Screen sharing is required for the interview. Please allow it to continue.");
    }
  };

  // ── question flow ──
  const askTurn = useCallback(
    async (turn: InterviewTurnView, leadText: string | null) => {
      setCurrent(turn);
      setLead(leadText);
      setAnswer("");
      setRun(null);
      if (turn.coding) setCode({ javascript: turn.coding.starter.javascript, python: turn.coding.starter.python });
      setPhase("asking");
      const spoken = turn.kind === "CODING" ? `${leadText ?? ""} Here's a coding problem. Read it on screen, then start when you're ready.` : `${leadText ?? ""} ${turn.question}`;
      await voice.speak(spoken);
      if (phaseRef.current !== "asking") return;
      setSecondsLeft(turn.timing.thinkingSeconds);
      setPhase("thinking");
    },
    [voice],
  );

  const begin = async () => {
    if (!current) return;
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
    setPhase("asking");
    await voice.speak(introText(me?.name ?? "there", session.job.title, session.questionTarget, session.durationMinutes, session.progress.answered > 0));
    await askTurn(current, null);
  };

  const startAnswer = useCallback(() => {
    if (!current) return;
    voice.stop();
    setSecondsLeft(current.timing.answerSeconds);
    setPaused(false);
    answerStart.current = Date.now();
    setPhase("answering");
    if (current.kind !== "CODING") {
      recorder.start();
      if (dictation.supported) dictation.start();
    }
  }, [current, voice, recorder, dictation]);

  const finishWithReport = useCallback(
    async (closing: string | undefined) => {
      setPhase("done");
      mic?.getTracks().forEach((t) => t.stop());
      screen?.getTracks().forEach((t) => t.stop());
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      await voice.speak(closing ?? "Thank you, that's the end of the interview.");
      router.replace(`/career/interview/${session.id}`);
    },
    [mic, screen, voice, router, session.id],
  );

  const submit = useCallback(
    async (skipped = false) => {
      if (!current || phaseRef.current === "submitting") return;
      dictation.stop();
      const audio = current.kind === "CODING" ? null : await recorder.finish();
      setPhase("submitting");
      const text = [answer, dictation.interim].filter(Boolean).join(" ").trim();
      try {
        const r = await api.post<AnswerResponse>(`/career/sessions/${session.id}/answer`, {
          turnId: current.id,
          skipped,
          answerText: skipped ? undefined : text || undefined,
          durationSec: Math.round((Date.now() - answerStart.current) / 1000),
          ...(audio && !skipped ? { audioBase64: audio.base64, audioMime: audio.mime } : {}),
          ...(current.kind === "CODING" && !skipped ? { code: code[codeLang], codeLanguage: codeLang } : {}),
        });
        if (r.progress) setProgress(r.progress);
        if (r.done) await finishWithReport(r.closing);
        else if (r.current) await askTurn(r.current, r.lead);
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          router.replace(`/career/interview/${session.id}`);
          return;
        }
        toast.error(e instanceof Error ? e.message : "Couldn't send your answer. Try again.");
        setPhase("answering");
      }
    },
    [current, dictation, recorder, answer, code, codeLang, session.id, askTurn, finishWithReport, router],
  );

  // ── timers (state changes happen inside the interval callback) ──
  useEffect(() => {
    if ((phase !== "thinking" && phase !== "answering") || paused) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        clearInterval(t);
        queueMicrotask(() => (phaseRef.current === "thinking" ? startAnswer() : submit()));
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, paused, startAnswer, submit]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const overallLeft = Math.max(0, Math.round((new Date(session.endsAt).getTime() - now) / 1000));

  const togglePause = () => {
    if (paused) {
      recorder.resume();
      if (!isCoding && dictation.supported) dictation.start();
    } else {
      recorder.pause();
      dictation.stop();
    }
    setPaused((p) => !p);
  };

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

  const endNow = async () => {
    setConfirm(null);
    dictation.stop();
    voice.stop();
    await api.post(`/career/sessions/${session.id}/end`).catch(() => undefined);
    await finishWithReport("Alright, let's end the interview here. Thank you.");
  };

  // ───────────────────────── render ─────────────────────────

  if (phase === "ended") {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-2xl border border-danger/30 bg-surface p-6 text-center">
          <XCircle className="mx-auto size-10 text-danger" />
          <h1 className="mt-3 text-lg font-semibold">The interview has ended</h1>
          <p className="mt-2 text-sm text-muted">The required interview environment wasn&apos;t maintained — screen sharing was interrupted three times. Your answers so far are in your report.</p>
          <Link href={`/career/interview/${session.id}`} className="mt-5 inline-block text-sm text-accent underline-offset-4 hover:underline">View report</Link>
        </div>
      </div>
    );
  }

  if (phase === "preflight") {
    const ready = !!screen;
    return (
      <div className="bg-grid min-h-screen px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <ManishaAvatar speaking={voice.speaking} />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-accent">AI technical interview</div>
              <h1 className="text-xl font-semibold">Manisha · {session.interviewer.role}</h1>
              <p className="text-sm text-muted">{session.job.title}{session.job.company ? ` · ${session.job.company}` : ""} · {session.questionTarget} questions · {session.durationMinutes} min · English</p>
            </div>
          </div>

          <ol className="mt-6 space-y-3">
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-3 text-sm">
                {mic ? <CheckCircle2 className="size-5 text-accent" /> : <Mic className="size-5 text-muted" />}
                <div><div className="font-medium">Microphone</div><div className="text-xs text-muted">Speak your answers (recommended). You can always type instead.</div></div>
              </div>
              {!mic && <Button size="sm" variant="secondary" onClick={enableMic}>Allow</Button>}
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-3 text-sm">
                {screen ? <CheckCircle2 className="size-5 text-accent" /> : <MonitorUp className="size-5 text-muted" />}
                <div><div className="font-medium">Screen sharing <span className="text-danger">(required)</span></div><div className="text-xs text-muted">Share your entire screen. Interrupting it 3 times ends the interview. It is never recorded or uploaded.</div></div>
              </div>
              {!screen && <Button size="sm" variant="secondary" onClick={shareScreen} disabled={!displaySupported}>Share screen</Button>}
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-3 text-sm">
                <Volume2 className="size-5 text-muted" />
                <div>
                  <div className="font-medium">Manisha&apos;s voice</div>
                  <div className="text-xs text-muted">{voice.supported ? voice.voiceName ?? "Default voice" : "Your browser can't speak — questions will be shown as text."}</div>
                  {voice.supported && voice.quality !== "female-indian" && (
                    <div className="mt-1 text-xs text-warn">
                      No female Indian voice found on this device, so Manisha uses the closest available voice. For the best experience add one:
                      {" "}Mac — System Settings → Accessibility → Spoken Content → System voice → Manage Voices → English (India) / Hindi (India);
                      {" "}Windows — Settings → Time &amp; language → Speech → Add voices → English (India) (Neerja/Heera); or use Microsoft Edge, which includes Neerja. Then reload this page.
                    </div>
                  )}
                </div>
              </div>
              {voice.supported && <Button size="sm" variant="ghost" onClick={() => voice.speak("Hi, I'm Manisha. Can you hear me clearly?")}>Test</Button>}
            </li>
          </ol>

          {!displaySupported && <p className="mt-4 rounded-lg bg-warn-soft p-3 text-sm text-warn">Screen sharing isn&apos;t available in this browser. Please use Chrome or Edge on a laptop or desktop.</p>}
          {!dictation.supported && <p className="mt-4 text-xs text-muted">Live transcription works in Chrome and Edge. In this browser you&apos;ll type your answers (audio is still recorded if the mic is on).</p>}

          <div className="mt-6 rounded-lg border border-border p-3 text-xs text-muted">
            <ShieldCheck className="mr-1 inline size-4 text-accent" /> AI help is off. Tab switches, fullscreen exits and clipboard use are logged as integrity signals. Eye contact and your face are never tracked or scored. Your report is a preparation assessment, not a hiring decision.
          </div>
          <Button className="mt-6 w-full" size="lg" disabled={!ready} onClick={begin}>{session.progress.answered > 0 ? "Resume interview" : "Begin interview"}</Button>
        </div>
      </div>
    );
  }

  const listeningLabel = dictation.listening ? "Listening…" : recorder.recording ? "Recording" : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent">AI technical interview · {session.job.title}</div>
          <div className="text-sm font-semibold">Question {Math.min(progress.answered + 1, progress.target)} of {progress.target}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone={screen ? "accent" : "danger"}><MonitorUp className="size-3" /> {screen ? "Sharing" : "Not sharing"}</Badge>
          <Badge tone={mic ? "accent" : "neutral"}>{mic ? <Mic className="size-3" /> : <MicOff className="size-3" />} {mic ? "Mic on" : "Typing"}</Badge>
          <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", overallLeft < 300 && "text-warn")} role="timer"><Clock className="size-3.5" /> {fmt(overallLeft)}</span>
          <button onClick={() => voice.setMuted(!voice.muted)} aria-label={voice.muted ? "Unmute Manisha" : "Mute Manisha"} className="rounded-md p-1.5 text-muted hover:bg-surface-2">{voice.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}</button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm("end")}>End</Button>
        </div>
      </header>
      <Progress value={(progress.answered / progress.target) * 100} className="rounded-none" label="Interview progress" />

      <main className={cn("mx-auto grid w-full flex-1 gap-5 p-4 sm:p-6", isCoding ? "max-w-[1500px] lg:grid-cols-[minmax(320px,440px)_1fr]" : "max-w-3xl")}>
        <section className={cn(paperCard, "glass h-fit p-5 pt-4")} aria-live="polite">
          <div className="mb-3 flex h-7 items-center justify-between font-mono text-[10px] font-semibold tracking-[0.2em] text-accent-2">
            <span>INTERVIEW SHEET</span>
            {current && <span className="text-subtle">QUESTION {String(progress.answered + 1).padStart(2, "0")}</span>}
          </div>
          <div className="flex items-start gap-4">
            <ManishaAvatar speaking={voice.speaking} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Manisha</div>
              {lead && <p className="text-sm text-muted">{lead}</p>}
              {current && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {current.kind === "FOLLOW_UP" && <Badge tone="info">Follow-up</Badge>}
                  {current.kind === "CODING" && <Badge tone="info">Coding</Badge>}
                  <Badge>{CATEGORY_LABEL[current.category]}</Badge>
                  <Badge>L{current.level} · {LEVEL_LABEL[current.level]}</Badge>
                  <Badge>{current.skill}</Badge>
                </div>
              )}
            </div>
          </div>
          {current && <div className="font-display mt-4 text-lg leading-relaxed"><Markdown>{current.question}</Markdown></div>}
          {isCoding && current?.coding && (
            <ul className="mt-4 space-y-1.5 font-mono text-[11px]">
              {current.coding.publicTests.map((t) => (
                <li key={t.name} className="rounded-md border border-border bg-surface-2 p-2">{current.coding!.functionName}({t.args.map((a) => JSON.stringify(a)).join(", ")}) → {JSON.stringify(t.expected)}</li>
              ))}
              <li className="text-subtle">+ {current.coding.hiddenTestCount} hidden tests on submit</li>
            </ul>
          )}

          {phase === "thinking" && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-info-soft p-3">
              <span className="text-sm">Thinking time <span className="font-mono tabular-nums">{fmt(secondsLeft)}</span></span>
              <Button size="sm" onClick={startAnswer}><Play className="size-3.5" /> Start answer</Button>
            </div>
          )}
          {phase === "asking" && <p className="mt-5 text-xs text-subtle">Manisha is asking…</p>}
          {phase === "submitting" && <p className="mt-5 animate-pulse text-sm text-muted">Manisha is noting your answer…</p>}
          {phase === "done" && <p className="mt-5 text-sm text-accent">Interview complete — preparing your report…</p>}
        </section>

        {phase === "answering" && current && !isCoding && (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {listeningLabel && <span className="size-2 animate-pulse rounded-full bg-danger" aria-hidden />}
                {paused ? "Paused" : listeningLabel ?? "Type your answer"}
              </span>
              <span className={cn("font-mono tabular-nums", secondsLeft < 20 && "text-warn")} role="timer">{fmt(secondsLeft)}</span>
            </div>
            <Textarea
              aria-label="Your answer"
              className="min-h-44"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={dictation.supported && mic ? "Speak — your words appear here. You can edit them before submitting." : "Type your answer in English."}
            />
            {dictation.interim && <p className="mt-1 text-xs italic text-subtle">{dictation.interim}</p>}
            {dictation.error && <p className="mt-1 text-xs text-warn">{dictation.error}</p>}
            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={togglePause}>{paused ? <><Play className="size-3.5" /> Resume</> : <><Pause className="size-3.5" /> Pause</>}</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm("skip")}><SkipForward className="size-3.5" /> Skip</Button>
              </div>
              <Button size="sm" onClick={() => submit(false)}>Submit answer</Button>
            </div>
          </section>
        )}

        {isCoding && current?.coding && (phase === "answering" || phase === "thinking" || phase === "submitting") && (
          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
              <Tabs value={codeLang} onChange={setCodeLang} items={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }]} />
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-xs tabular-nums", secondsLeft < 60 && "text-warn")}>{phase === "answering" ? fmt(secondsLeft) : "Reading"}</span>
                <Button size="sm" variant="secondary" onClick={runTests} loading={running} disabled={phase !== "answering"}><Play className="size-3.5" /> Run tests</Button>
                <Button size="sm" onClick={() => submit(false)} disabled={phase !== "answering"}>Submit</Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-code">
              <CodeEditor value={code[codeLang]} onChange={(v) => setCode((c) => ({ ...c, [codeLang]: v }))} language={codeLang} readOnly={phase !== "answering"} ariaLabel="Your solution" />
            </div>
            <div className="grid gap-3 border-t border-border bg-surface p-3 md:grid-cols-2">
              <Textarea aria-label="Explain your approach" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Briefly explain your approach and its time complexity." className="min-h-20" />
              <div className="max-h-40 overflow-y-auto font-mono text-[11px]" aria-live="polite">
                {run ? run.tests.map((t) => (
                  <div key={t.name} className={t.passed ? "text-accent" : "text-danger"}>{t.passed ? "✓" : "✗"} {t.name}{!t.passed && ` — got ${t.error ?? JSON.stringify(t.actual)}`}</div>
                )) : <span className="text-subtle">Run the visible tests while you work.</span>}
                {run?.stderr && <pre className="mt-1 whitespace-pre-wrap text-danger">{run.stderr.slice(0, 600)}</pre>}
              </div>
            </div>
          </section>
        )}
      </main>

      <Dialog open={warning !== null} onClose={() => undefined} title={`Warning #${warning}`}>
        <div className="flex gap-3">
          <AlertTriangle className="size-6 shrink-0 text-warn" />
          <div className="text-sm">
            <p className="font-medium">Screen sharing was interrupted.</p>
            <p className="mt-1 text-muted">Please resume screen sharing to continue the interview. The timer is paused. {warning !== null && warning >= 2 ? "One more interruption will end the interview." : ""}</p>
          </div>
        </div>
        <Button className="mt-5 w-full" onClick={shareScreen}><MonitorUp className="size-4" /> Resume screen sharing</Button>
      </Dialog>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "skip" ? "Skip this question?" : "End the interview now?"}>
        <p className="text-sm text-muted">{confirm === "skip" ? "A skipped question counts as unanswered in your report." : "Unanswered questions won't be scored. Your report will use the answers you've given so far."}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(null)}>Keep going</Button>
          <Button variant={confirm === "end" ? "danger" : "primary"} onClick={() => (confirm === "skip" ? (setConfirm(null), submit(true)) : endNow())}>{confirm === "skip" ? "Skip" : "End interview"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
