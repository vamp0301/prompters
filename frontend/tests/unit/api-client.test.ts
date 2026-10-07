import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, qs } from "@/lib/api/client";

afterEach(() => vi.restoreAllMocks());

describe("api client", () => {
  it("unwraps { success, data }", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true, data: { ok: 1 } }), { status: 200 }));
    await expect(api.get("/x")).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledWith("/api/x", expect.objectContaining({ credentials: "include", method: "GET" }));
  });
  it("throws ApiError with the server's friendly message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: "LOCKED", message: "Learn X first", requestId: "r1" } }), { status: 423 }));
    const err = await api.post("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 423, code: "LOCKED", message: "Learn X first", requestId: "r1" });
  });
  it("never surfaces raw network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const err = (await api.get("/x").catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.message).toMatch(/progress is safe/);
  });
  it("builds query strings without empty values", () => {
    expect(qs({ a: 1, b: "", c: undefined, d: "x y" })).toBe("?a=1&d=x+y");
  });
});
