import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

/**
 * Manisha's interview room in a real browser, with the browser's speech engines replaced by
 * scripted fakes so every state can be driven deterministically. Needs the fake-AI stack
 * (API with FakeAI, SANDBOX_DRIVER=disabled): run with E2E_FAKE_AI=1 E2E_BASE_URL=… E2E_DB_URL=….
 *
 * These tests prove the state machine, fallbacks, API calls and recovery. They do NOT prove how
 * Manisha sounds or how accurate real speech recognition is — that needs a person and a microphone.
 */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");
test.use({
  permissions: ["microphone"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--auto-select-desktop-capture-source=Entire screen"] },
});

const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const GOOD = "I keep the token in an HTTP-only cookie so scripts cannot read it";

type Fakes = { voices?: "indian" | "none" | "absent"; speechFails?: boolean; recognition?: "ok" | "absent" | "denied" };

function sql(q: string) {
  return execSync(`psql -qtA ${process.env.E2E_DB_URL} -c "${q.replace(/"/g, '\\"')}"`).toString().trim();
}

async function installFakes(page: Page, f: Fakes) {
  await page.addInitScript((f: Fakes) => {
    const w = window as unknown as Record<string, unknown>;
    Element.prototype.requestFullscreen = () => Promise.resolve();
    w.__spoken = [] as string[];
    w.__say = [] as string[];
    if (f.voices === "absent") {
      delete w.speechSynthesis;
      Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
    } else {
      const voices = f.voices === "none" ? [] : [{ name: "Veena", lang: "en-IN", localService: true, default: true, voiceURI: "veena" }];
      let current: { onstart?: () => void; onend?: () => void; onerror?: (e: { error: string }) => void } | null = null;
      const synth = {
        getVoices: () => voices,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        speaking: false,
        speak(u: { text: string; onstart?: () => void; onend?: () => void; onerror?: (e: { error: string }) => void }) {
          (w.__spoken as string[]).push(u.text);
          current = u;
          setTimeout(() => {
            u.onstart?.();
            setTimeout(() => (f.speechFails ? u.onerror?.({ error: "synthesis-failed" }) : u.onend?.()), 40);
          }, 10);
        },
        cancel() {
          const u = current;
          current = null;
          u?.onerror?.({ error: "canceled" });
        },
      };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    }
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
    if (f.recognition !== "absent") {
      class FakeRecognition {
        lang = "";
        continuous = false;
        interimResults = false;
        onresult: ((e: unknown) => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((e: { error: string }) => void) | null = null;
        start() {
          (w.__recognitionStarts as number) = ((w.__recognitionStarts as number) ?? 0) + 1;
          if (f.recognition === "denied") {
            setTimeout(() => {
              this.onerror?.({ error: "not-allowed" });
              this.onend?.();
            }, 20);
            return;
          }
          const text = (w.__say as string[]).shift();
          if (text !== undefined) setTimeout(() => this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: text } }] }), 60);
        }
        stop() {
          setTimeout(() => this.onend?.(), 20);
        }
        abort() {}
      }
      w.webkitSpeechRecognition = FakeRecognition;
    }
  }, f);
}

async function startInterview(page: Page, f: Fakes = {}) {
  await installFakes(page, { voices: "indian", recognition: "ok", ...f });
  await page.request.post("/api/auth/register", { data: { name: "Riya Sharma", email: `voice${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`, password: "Password123" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "JAVASCRIPT", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "BEGINNER", weeklyHours: 10 } });
  const resume = await (await page.request.post("/api/career/resumes", { data: { text: RESUME } })).json();
  const start = await (await page.request.post("/api/career/sessions", { data: { resumeId: resume.data.id, targetRole: "backend", durationMinutes: 15, consent: { analysis: true, integrity: true, preparationOnly: true } } })).json();
  const id = start.data.id as string;
  await page.goto(`/career/live/${id}`);
  return id;
}

async function enterRoom(page: Page) {
  await page.getByRole("button", { name: "Share screen" }).click();
  await page.getByRole("button", { name: /^Continue( interview)?$/ }).click();
  await expect(page.getByText("Your turn").or(page.getByText("Thinking", { exact: true }))).toBeVisible({ timeout: 20_000 });
}

const say = (page: Page, text: string) => page.evaluate((t) => ((window as unknown as { __say: string[] }).__say.push(t)), text);
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

test("setup screen: voice availability, test voice, mute; then the room", async ({ page }) => {
  await startInterview(page);
  await expect(page.getByRole("heading", { name: "AI technical interview" })).toBeVisible();
  for (const label of ["Role", "Difficulty", "Duration", "Language"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.getByText("Indian English voice (en-IN)")).toBeVisible();
  await expect(page.getByText("Manisha will use: Veena (en-IN).")).toBeVisible();
  await expect(page.getByText("Voice quality depends on your browser and device.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Test voice" }).click();
  await expect.poll(async () => (await spoken(page)).join(" ")).toMatch(/Can you hear me clearly/);
  // Mute is about Manisha's voice only.
  await page.getByRole("button", { name: "Mute Manisha's voice" }).click();
  await expect(page.getByRole("button", { name: "Unmute Manisha's voice" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Test voice" })).toBeDisabled();
  await page.getByRole("button", { name: "Unmute Manisha's voice" }).click();
  await enterRoom(page);
  await expect(page.getByText(/Question 1 \/ 8/)).toBeVisible();
  await expect.poll(async () => (await spoken(page)).some((t) => /I'm Manisha/.test(t))).toBe(true);
});

test("voice answer: consent → listening → transcript → edit → submit → next question, audio stored", async ({ page }) => {
  const id = await startInterview(page);
  await enterRoom(page);
  await say(page, "I keep the token in a cookie");
  await page.getByRole("button", { name: "Answer by voice" }).click();
  await expect(page.getByRole("dialog", { name: "Record your answer audio?" })).toContainText("Your answer audio may be recorded and analyzed for this interview.");
  await page.getByRole("button", { name: "Allow recording" }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Live transcript")).toContainText("I keep the token in a cookie");
  // Recording starts asynchronously after consent; stop only once it is actually running.
  await expect(page.getByText("Recording your answer audio (you allowed this).")).toBeVisible();
  await page.getByRole("button", { name: /Stop & review/ }).click();
  const box = page.getByLabel("Your answer");
  await expect(box).toHaveValue("I keep the token in a cookie");
  await box.fill(`${GOOD} — edited`);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
  expect(sql(`SELECT count(*) FROM "InterviewTurn" WHERE "sessionId"='${id}' AND "audioKey" IS NOT NULL`)).toBe("1");
  expect(sql(`SELECT "answerText" FROM "InterviewTurn" WHERE "sessionId"='${id}' AND "order"=0`)).toBe(`${GOOD} — edited`);
});

test("recording declined: voice answering still works and no audio is kept", async ({ page }) => {
  const id = await startInterview(page);
  await enterRoom(page);
  await say(page, GOOD);
  await page.getByRole("button", { name: "Answer by voice" }).click();
  await page.getByRole("button", { name: "Continue without recording" }).click();
  await expect(page.getByLabel("Live transcript")).toContainText(GOOD);
  await page.getByRole("button", { name: /Stop & review/ }).click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
  expect(sql(`SELECT count(*) FROM "InterviewTurn" WHERE "sessionId"='${id}' AND "audioKey" IS NOT NULL`)).toBe("0");
  expect(sql(`SELECT consent->>'recordAudio' FROM "InterviewSession" WHERE id='${id}'`)).toBe("false");
});

test("empty or garbled speech: Manisha asks again, nothing is submitted; typing is offered", async ({ page }) => {
  const id = await startInterview(page);
  await enterRoom(page);
  await say(page, "uh um");
  await page.getByRole("button", { name: "Answer by voice" }).click();
  await page.getByRole("button", { name: "Continue without recording" }).click();
  await page.getByRole("button", { name: /Stop & review/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "didn't catch that" })).toContainText("I didn't catch that clearly. Could you repeat your answer?");
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(/didn't catch that clearly/);
  expect(sql(`SELECT count(*) FROM "InterviewTurn" WHERE "sessionId"='${id}' AND "answeredAt" IS NOT NULL`)).toBe("0");
  await page.getByRole("button", { name: "Type instead" }).click();
  await expect(page.getByLabel("Your answer")).toBeEditable();
});

test("a transcript the server finds unclear is asked again and not scored", async ({ page }) => {
  const id = await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill("so the the [unclear] token is uh stored somewhere");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("Asked again")).toBeVisible({ timeout: 20_000 });
  expect(sql(`SELECT excluded FROM "InterviewTurn" WHERE "sessionId"='${id}' AND "order"=0`)).toBe("t");
});

test("microphone denied: a clear message, typing works, no permission loop", async ({ page }) => {
  await startInterview(page, { recognition: "denied" });
  await enterRoom(page);
  await page.getByRole("button", { name: "Answer by voice" }).click();
  await page.getByRole("button", { name: "Continue without recording" }).click();
  await expect(page.getByText("Microphone permission is blocked", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Answer (again )?by voice/ })).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { __recognitionStarts: number }).__recognitionStarts)).toBe(1);
  await page.getByLabel("Your answer").fill(GOOD);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
});

test("speech recognition unavailable: setup says so and typing carries the interview", async ({ page }) => {
  await startInterview(page, { recognition: "absent" });
  await expect(page.getByText("Voice answering isn't available in this browser. You can type your answer instead.")).toBeVisible();
  await enterRoom(page);
  await expect(page.getByRole("button", { name: "Answer by voice" })).toBeDisabled();
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill(GOOD);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
});

test("no voices on the device: setup is honest and the interview still runs", async ({ page }) => {
  await startInterview(page, { voices: "absent" });
  await expect(page.getByText("Your browser has no speech voices. Questions will appear on screen as text.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Test voice" })).toBeDisabled();
  await enterRoom(page);
  await expect(page.locator("#question-h")).not.toBeEmpty();
});

test("speech synthesis failure: the question is on screen and the interview continues", async ({ page }) => {
  await startInterview(page, { speechFails: true });
  await page.getByRole("button", { name: "Test voice" }).click();
  await expect(page.getByText("The test voice couldn't play on this device.", { exact: false })).toBeVisible();
  await enterRoom(page);
  await expect(page.getByText("Manisha's voice couldn't play on this device", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Type answer" })).toBeVisible();
});

test("mute during the interview silences Manisha but not the microphone or typing", async ({ page }) => {
  await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Mute Manisha's voice" }).first().click();
  const before = (await spoken(page)).length;
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill(GOOD);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
  expect((await spoken(page)).length).toBe(before);
  await expect(page.getByRole("button", { name: "Answer by voice" })).toBeEnabled();
});

test("refresh mid-answer restores the interview and the typed answer", async ({ page }) => {
  await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill("Half-written answer about cookies");
  await page.reload();
  await expect(page.getByRole("heading", { name: "AI technical interview" })).toBeVisible();
  await enterRoom(page);
  await page.getByRole("button", { name: "Type answer" }).click();
  await expect(page.getByLabel("Your answer")).toHaveValue("Half-written answer about cookies");
});

test("double-clicking Submit sends one answer", async ({ page }) => {
  const id = await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill(GOOD);
  await page.getByRole("button", { name: "Submit answer" }).dblclick();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
  expect(sql(`SELECT count(*) FROM "InterviewTurn" WHERE "sessionId"='${id}' AND "answeredAt" IS NOT NULL`)).toBe("1");
  expect(sql(`SELECT count(*) FROM "InterviewTurn" WHERE "sessionId"='${id}'`)).toBe("2");
});

test("network failure keeps the answer; retry continues", async ({ page }) => {
  await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill(GOOD);
  await page.route("**/answer", (r) => r.abort("internetdisconnected"));
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "offline" })).toContainText("You seem to be offline. Your answer is saved");
  await expect(page.getByLabel("Your answer")).toHaveValue(GOOD);
  await page.unroute("**/answer");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText(/Question 2 \/ 8/)).toBeVisible({ timeout: 20_000 });
});

test("AI failure keeps the answer and offers retry / later / end", async ({ page }) => {
  await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Type answer" }).click();
  await page.getByLabel("Your answer").fill("indexing answer [simulate-ai-failure]");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "answer is saved" })).toContainText("Your answer is saved");
  for (const name of ["Try again", "Continue later", "End interview"]) await expect(page.getByRole("button", { name })).toBeVisible();
  await expect(page.getByLabel("Your answer")).toHaveValue("indexing answer [simulate-ai-failure]");
});

test("complete an interview by typing → report → history", async ({ page }) => {
  test.setTimeout(240_000);
  const id = await startInterview(page);
  await enterRoom(page);
  await page.getByRole("button", { name: "Mute Manisha's voice" }).first().click();
  for (let i = 0; i < 30 && !page.url().includes("/career/interview/"); i++) {
    const type = page.getByRole("button", { name: "Type answer" });
    if (await type.isVisible().catch(() => false)) {
      await type.click();
      await page.getByLabel(/^Your (answer|approach)$/).fill(`${GOOD}; O(n) time and I handle empty input.`);
      await page.getByRole("button", { name: "Submit answer" }).click();
    }
    await page.waitForTimeout(500);
  }
  await page.waitForURL(/\/career\/interview\//, { timeout: 60_000 });
  for (const t of ["Technical", "Project understanding", "Problem solving", "Communication", "Interviewer's assessment"]) await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
  await page.goto("/career?tab=interview");
  const row = page.getByRole("row").filter({ hasText: "Backend Developer" });
  await expect(row).toContainText("15 min");
  await expect(row).toContainText("Completed");
  expect(sql(`SELECT status FROM "InterviewSession" WHERE id='${id}'`)).toBe("COMPLETED");
});
