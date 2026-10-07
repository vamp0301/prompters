import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { app, login, resetDb } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

beforeAll(resetDb);

describe("auth", () => {
  it("registers, reads /me and never exposes the password hash", async () => {
    const { agent } = await login();
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(JSON.stringify(me.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect(me.body.data.profile.startLanguage).toBe("JAVASCRIPT");
  });

  it("sets an httpOnly session cookie", async () => {
    const res = await supertest(app).post("/api/auth/register").send({ name: "Cookie", email: "cookie@test.dev", password: "Passw0rd!" });
    expect(res.headers["set-cookie"][0]).toMatch(/HttpOnly/);
    expect(res.headers["set-cookie"][0]).toMatch(/SameSite=Lax/);
  });

  it("rejects weak passwords and duplicate emails", async () => {
    const weak = await supertest(app).post("/api/auth/register").send({ name: "W", email: "weak@test.dev", password: "short" });
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe("VALIDATION_ERROR");
    const dup = await supertest(app).post("/api/auth/register").send({ name: "Cookie", email: "cookie@test.dev", password: "Passw0rd!" });
    expect(dup.status).toBe(409);
  });

  it("logs in with the right password only", async () => {
    const bad = await supertest(app).post("/api/auth/login").send({ email: "cookie@test.dev", password: "Wrong1234" });
    expect(bad.status).toBe(401);
    const good = await supertest(app).post("/api/auth/login").send({ email: "cookie@test.dev", password: "Passw0rd!" });
    expect(good.status).toBe(200);
  });

  it("protects routes and returns a consistent error shape", async () => {
    const res = await supertest(app).get("/api/dashboard");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: { code: "UNAUTHORIZED" } });
    expect(res.body.error.requestId).toBeTruthy();
  });

  it("signs out suspended users immediately", async () => {
    const { agent, id } = await login();
    await prisma.user.update({ where: { id }, data: { status: "SUSPENDED", tokenVersion: { increment: 1 } } });
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("rejects cross-origin writes (CSRF)", async () => {
    const res = await supertest(app).post("/api/auth/login").set("Origin", "https://evil.example").send({ email: "a@b.c", password: "x" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("CSRF_REJECTED");
  });

  it("logout clears the session", async () => {
    const { agent } = await login();
    await agent.post("/api/auth/logout");
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});
