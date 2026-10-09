import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { S3Storage } from "../src/lib/storage.js";

/**
 * The S3/R2 driver against a minimal in-process S3-compatible server (path-style, like R2 with an
 * endpoint). It records every request so we can check objects are written privately and deleted.
 * Real R2 bucket privacy is checked by the smoke suite against a deployment (scripts/smoke.ts).
 */
const objects = new Map<string, { body: Buffer; type: string }>();
const requests: { method: string; url: string; acl: string | undefined }[] = [];
let server: Server;
let s3: S3Storage;

const read = (req: IncomingMessage) => new Promise<Buffer>((r) => {
  const parts: Buffer[] = [];
  req.on("data", (c) => parts.push(c));
  req.on("end", () => r(Buffer.concat(parts)));
});

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    requests.push({ method: req.method ?? "", url: req.url ?? "", acl: req.headers["x-amz-acl"] as string | undefined });
    const [, bucket, ...rest] = url.pathname.split("/");
    const key = decodeURIComponent(rest.join("/"));
    const body = await read(req);
    if (bucket !== "private-bucket") return res.writeHead(404).end();
    if (req.method === "PUT" && key) {
      objects.set(key, { body, type: String(req.headers["content-type"] ?? "application/octet-stream") });
      return res.writeHead(200, { etag: '"x"' }).end();
    }
    if (req.method === "GET" && key) {
      const o = objects.get(key);
      if (!o) return res.writeHead(404, { "content-type": "application/xml" }).end("<Error><Code>NoSuchKey</Code></Error>");
      return res.writeHead(200, { "content-type": o.type, "content-length": o.body.length }).end(o.body);
    }
    if (req.method === "DELETE" && key) {
      objects.delete(key);
      return res.writeHead(204).end();
    }
    if (req.method === "GET" && url.searchParams.get("list-type") === "2") {
      const prefix = url.searchParams.get("prefix") ?? "";
      const keys = [...objects.keys()].filter((k) => k.startsWith(prefix));
      return res.writeHead(200, { "content-type": "application/xml" }).end(`<?xml version="1.0"?><ListBucketResult><Name>private-bucket</Name><Prefix>${prefix}</Prefix><KeyCount>${keys.length}</KeyCount><IsTruncated>false</IsTruncated>${keys.map((k) => `<Contents><Key>${k}</Key></Contents>`).join("")}</ListBucketResult>`);
    }
    if (req.method === "POST" && url.searchParams.has("delete")) {
      for (const m of body.toString().matchAll(/<Key>([^<]+)<\/Key>/g)) objects.delete(m[1]);
      return res.writeHead(200, { "content-type": "application/xml" }).end('<?xml version="1.0"?><DeleteResult></DeleteResult>');
    }
    res.writeHead(400).end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  s3 = new S3Storage({ endpoint: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, region: "auto", bucket: "private-bucket", accessKeyId: "test", secretAccessKey: "test" });
});
afterAll(async () => new Promise((r) => server.close(r)));

describe("S3 / R2 storage driver", () => {
  it("stores and reads private objects, and never asks for a public ACL", async () => {
    await s3.put("resumes/u1/cv.pdf", Buffer.from("%PDF-1"), "application/pdf");
    const got = await s3.get("resumes/u1/cv.pdf");
    expect(got?.body.toString()).toBe("%PDF-1");
    expect(got?.contentType).toBe("application/pdf");
    expect(requests.filter((r) => r.method === "PUT").every((r) => !r.acl)).toBe(true);
    expect(await s3.get("resumes/u1/missing.pdf")).toBeNull();
  });

  it("rejects unsafe keys and prefixes before any request is made", async () => {
    const before = requests.length;
    await expect(s3.put("../etc/passwd", Buffer.from("x"), "text/plain")).rejects.toThrow(/Invalid storage key/);
    await expect(s3.deletePrefix("resumes/")).rejects.toThrow(/Invalid storage prefix/); // never the whole area
    expect(requests.length).toBe(before);
  });

  it("deletes one object, and everything of one user without touching anyone else's", async () => {
    await s3.put("interviews/u1/a.webm", Buffer.from("a"), "audio/webm");
    await s3.put("interviews/u1/b.webm", Buffer.from("b"), "audio/webm");
    await s3.put("interviews/u2/c.webm", Buffer.from("c"), "audio/webm");
    await s3.delete("resumes/u1/cv.pdf");
    expect(objects.has("resumes/u1/cv.pdf")).toBe(false);
    expect(await s3.deletePrefix("interviews/u1/")).toBe(2);
    expect([...objects.keys()].sort()).toEqual(["interviews/u2/c.webm"]);
    expect(await s3.deletePrefix("interviews/u1/")).toBe(0); // idempotent
  });
});
