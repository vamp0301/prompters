import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { login, resetDb } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";
import { redis } from "../src/lib/redis.js";
import { setVoiceProviders, type SttProvider, type TtsProvider } from "../src/modules/career/voice.service.js";

/** Manisha's cloud voice with fake providers: ownership, fallbacks, usage caps. Real providers: tests-real. */
let grants = 0;
let spoken: string[] = [];
let failSpeech = false;
const fakeStt: SttProvider = {
  name: "deepgram",
  url: "wss://stt.example/v1/listen",
  params: () => ({ model: "nova-3", mip_opt_out: "true" }),
  grant: async () => {
    grants++;
    return { token: "temp-jwt", expiresIn: 30 };
  },
};
const fakeTts: TtsProvider = {
  name: "elevenlabs",
  speak: async (text) => {
    if (failSpeech) throw new Error("provider down");
    spoken.push(text);
    return { body: new Blob([Buffer.from("ID3-fake-mp3")]).stream() as ReadableStream<Uint8Array>, contentType: "audio/mpeg" };
  },
};

type Agent = Awaited<ReturnType<typeof login>>["agent"];
let a: Awaited<ReturnType<typeof login>>;
let b: Awaited<ReturnType<typeof login>>;
let open: string;
let ended: string;
let paused: string;

beforeAll(async () => {
  await resetDb();
  a = await login();
  b = await login();
  open = (await prisma.interviewSession.create({ data: { userId: a.id, consent: {}, status: "IN_PROGRESS" } })).id;
  ended = (await prisma.interviewSession.create({ data: { userId: a.id, consent: {}, status: "COMPLETED" } })).id;
  paused = (await prisma.interviewSession.create({ data: { userId: a.id, consent: {}, status: "PAUSED" } })).id;
});
beforeEach(async () => {
  setVoiceProviders({ stt: fakeStt, tts: fakeTts });
  grants = 0;
  spoken = [];
  failSpeech = false;
  const keys = await redis().keys("voice:*");
  if (keys.length) await redis().del(...keys);
});
afterAll(() => setVoiceProviders(undefined));

const say = (agent: Agent, id: string, text: string) => agent.post(`/api/career/voice/${id}/speech`).send({ text }).buffer(true).parse((res, cb) => {
  const parts: Buffer[] = [];
  res.on("data", (c: Buffer) => parts.push(c));
  res.on("end", () => cb(null, Buffer.concat(parts)));
});

describe("voice config", () => {
  it("reports the browser engines when no cloud provider is configured", async () => {
    setVoiceProviders({});
    expect((await a.agent.get("/api/career/voice/config")).body.data).toEqual({ stt: "browser", tts: "browser" });
  });
  it("reports the cloud engines when configured", async () => {
    expect((await a.agent.get("/api/career/voice/config")).body.data).toEqual({ stt: "deepgram", tts: "elevenlabs" });
  });
  it("needs a login", async () => {
    const { default: request } = await import("supertest");
    const { app } = await import("./helpers.js");
    expect((await request(app).get("/api/career/voice/config")).status).toBe(401);
  });
});

describe("speech-to-text token", () => {
  it("gives the owner of an open interview a short-lived token, never the API key", async () => {
    const r = await a.agent.post(`/api/career/voice/${open}/token`);
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ provider: "deepgram", token: "temp-jwt", expiresIn: 30, url: "wss://stt.example/v1/listen" });
    expect(r.body.data.params.mip_opt_out).toBe("true");
  });
  it("refuses someone else's interview and an ended one", async () => {
    expect((await b.agent.post(`/api/career/voice/${open}/token`)).status).toBe(404);
    expect((await a.agent.post(`/api/career/voice/${ended}/token`)).status).toBe(409);
    expect(grants).toBe(0);
  });
  it("listening needs the interview in progress (paused: resume first); speaking works while paused", async () => {
    const r = await a.agent.post(`/api/career/voice/${paused}/token`);
    expect(r.status).toBe(409);
    expect(grants).toBe(0);
    expect((await say(a.agent, paused, "Welcome back.")).status).toBe(200);
  });
  it("caps streaming connections per student per day (a token only limits opening one)", async () => {
    await redis().set(`voice:stt:tokens:${a.id}:${new Date().toISOString().slice(0, 10)}`, "150");
    const r = await a.agent.post(`/api/career/voice/${open}/token`);
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe("VOICE_QUOTA");
    expect(grants).toBe(0);
  });
  it("answers 503 when the provider is off or failing, so the browser falls back", async () => {
    setVoiceProviders({ tts: fakeTts });
    expect((await a.agent.post(`/api/career/voice/${open}/token`)).body.error.code).toBe("VOICE_UNAVAILABLE");
    setVoiceProviders({ stt: { ...fakeStt, grant: async () => Promise.reject(new Error("down")) } });
    const r = await a.agent.post(`/api/career/voice/${open}/token`);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("VOICE_UNAVAILABLE");
  });
});

describe("text-to-speech", () => {
  it("streams audio for the owner's open interview", async () => {
    const r = await say(a.agent, open, "Tell me about your Notes API.");
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toContain("audio/mpeg");
    expect(r.headers["cache-control"]).toContain("no-store");
    expect(Buffer.from(r.body).toString()).toBe("ID3-fake-mp3");
    expect(spoken).toEqual(["Tell me about your Notes API."]);
  });
  it("refuses other users, ended interviews, empty and over-long text", async () => {
    expect((await say(b.agent, open, "hi")).status).toBe(404);
    expect((await say(a.agent, ended, "hi")).status).toBe(409);
    expect((await say(a.agent, open, "   ")).status).toBe(400);
    expect((await say(a.agent, open, "x".repeat(701))).status).toBe(400);
    expect(spoken).toHaveLength(0);
  });
  it("stops at the per-user daily cap with 429, and the config then still offers cloud to others", async () => {
    const text = "y".repeat(700);
    for (let i = 0; i < 4; i++) expect((await say(a.agent, open, text)).status).toBe(200); // 2800 of 3000
    const over = await say(a.agent, open, text);
    expect(over.status).toBe(429);
    expect(spoken).toHaveLength(4);
    expect(await redis().get(`voice:tts:user:${a.id}:${new Date().toISOString().slice(0, 10)}`)).toBe("2800"); // refused request not counted
    expect((await say(a.agent, open, "Short one.")).status).toBe(200); // still fits
  });
  it("enforces the cap atomically under concurrent requests: exactly what fits is spoken", async () => {
    const text = "z".repeat(700);
    const results = await Promise.all(Array.from({ length: 10 }, () => say(a.agent, open, text)));
    expect(results.filter((r) => r.status === 200)).toHaveLength(4); // 4 × 700 = 2800 ≤ 3000 < 3500
    expect(results.filter((r) => r.status === 429)).toHaveLength(6);
    expect(spoken).toHaveLength(4);
    expect(await redis().get(`voice:tts:user:${a.id}:${new Date().toISOString().slice(0, 10)}`)).toBe("2800");
    expect(await redis().get(`voice:tts:chars:${new Date().toISOString().slice(0, 7)}`)).toBe("2800");
  });
  it("switches everyone to the browser voice once the monthly cap is reached", async () => {
    await redis().set(`voice:tts:chars:${new Date().toISOString().slice(0, 7)}`, "9000");
    expect((await a.agent.get("/api/career/voice/config")).body.data.tts).toBe("browser");
    expect((await say(a.agent, open, "hello")).status).toBe(429);
  });
  it("gives back the characters when the provider fails (503)", async () => {
    failSpeech = true;
    const r = await say(a.agent, open, "hello there");
    expect(r.status).toBe(503);
    expect(Number((await redis().get(`voice:tts:chars:${new Date().toISOString().slice(0, 7)}`)) ?? 0)).toBe(0);
  });
});
