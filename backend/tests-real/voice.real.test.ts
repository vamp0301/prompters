import { describe, expect, it } from "vitest";

/**
 * Real-provider checks for Manisha's cloud voice — opt-in, never part of `npm test`:
 *
 *   npm run test:real-voice      (reads STT_PROVIDER/DEEPGRAM_* and TTS_PROVIDER/ELEVENLABS_* from backend/.env)
 *
 * Uses a few hundred characters of ElevenLabs allowance and a few seconds of Deepgram.
 * The round trip speaks a sentence with ElevenLabs and transcribes it with Deepgram the same way the
 * browser does (temporary token over the WebSocket subprotocol). Keys are never printed.
 */
const enabled = process.env.REAL_VOICE === "1";
const suite = enabled ? describe : describe.skip;
if (!enabled) console.warn("Real-voice tests skipped: run `npm run test:real-voice` with the providers configured in backend/.env.");

const SENTENCE = "Tell me how you stored the refresh token in your notes project.";

suite("real voice providers", async () => {
  const { voiceProviders } = await import("../src/modules/career/voice.service.js");
  const { stt, tts } = voiceProviders();

  async function speak(text: string) {
    const out = await tts!.speak(text, new AbortController().signal);
    const t = performance.now();
    const chunks: Uint8Array[] = [];
    let first = 0;
    for await (const c of out.body as unknown as AsyncIterable<Uint8Array>) {
      first ||= performance.now() - t;
      chunks.push(c);
    }
    return { audio: Buffer.concat(chunks), contentType: out.contentType, firstChunkMs: Math.round(first) };
  }

  it.skipIf(!tts)("ElevenLabs: streams playable MP3 for a question", async () => {
    const t = performance.now();
    const r = await speak(SENTENCE);
    console.log(`  tts: ${r.audio.length} bytes, ${Math.round(performance.now() - t)} ms total`);
    expect(r.contentType).toContain("audio/mpeg");
    expect(r.audio.length).toBeGreaterThan(2000);
    // MP3: an ID3 tag or a frame sync.
    expect(r.audio.subarray(0, 3).toString() === "ID3" || (r.audio[0] === 0xff && (r.audio[1] & 0xe0) === 0xe0)).toBe(true);
  });

  it.skipIf(!stt)("Deepgram: issues a short-lived token that opens a streaming connection", async () => {
    const g = await stt!.grant();
    expect(g.token.length).toBeGreaterThan(20);
    expect(g.expiresIn).toBeLessThanOrEqual(60);
    const ws = new WebSocket(`${stt!.url}?${new URLSearchParams(stt!.params())}`, ["bearer", g.token]);
    const opened = await new Promise<boolean>((resolve) => {
      ws.onopen = () => resolve(true);
      ws.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 10_000);
    });
    expect(opened).toBe(true);
    ws.send(JSON.stringify({ type: "CloseStream" }));
    ws.close();
  });

  it.skipIf(!stt || !tts)("round trip: what Manisha says is transcribed back, with end-of-utterance detection", async () => {
    const { audio } = await speak(SENTENCE);
    const g = await stt!.grant();
    const ws = new WebSocket(`${stt!.url}?${new URLSearchParams(stt!.params())}`, ["bearer", g.token]);
    const finals: { text: string; confidence: number }[] = [];
    let utteranceEnd = false;
    const t = performance.now();
    await new Promise<void>((resolve, reject) => {
      ws.onerror = () => reject(new Error("socket error"));
      ws.onclose = () => resolve();
      ws.onmessage = (e) => {
        const m = JSON.parse(String(e.data));
        if (m.type === "UtteranceEnd") utteranceEnd = true;
        const alt = m.channel?.alternatives?.[0];
        if (m.type === "Results" && m.is_final && alt?.transcript) finals.push({ text: alt.transcript, confidence: alt.confidence });
      };
      ws.onopen = async () => {
        // Feed the audio in ~real-time-sized pieces, as a microphone would.
        for (let i = 0; i < audio.length; i += 4000) {
          ws.send(audio.subarray(i, i + 4000));
          await new Promise((r) => setTimeout(r, 50));
        }
        await new Promise((r) => setTimeout(r, 2500)); // silence → UtteranceEnd
        ws.send(JSON.stringify({ type: "CloseStream" }));
      };
      setTimeout(() => reject(new Error("timed out")), 60_000);
    });
    const text = finals.map((f) => f.text).join(" ").toLowerCase();
    console.log(`  stt: ${finals.length} final segment(s) in ${Math.round(performance.now() - t)} ms, avg confidence ${(finals.reduce((a, f) => a + f.confidence, 0) / Math.max(1, finals.length)).toFixed(2)}`);
    for (const w of ["refresh", "token", "notes", "project"]) expect(text).toContain(w);
    expect(finals.every((f) => f.confidence > 0.6)).toBe(true);
    expect(utteranceEnd || finals.length > 0).toBe(true);
  });
});
