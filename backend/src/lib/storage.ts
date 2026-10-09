import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
  /** Deletes every object under a folder-like prefix (must end with "/"). Missing objects are fine. */
  deletePrefix(prefix: string): Promise<number>;
}

/** A prefix must be a non-empty, folder-like path ("resumes/<userId>/") so it can never match the whole store. */
const safePrefix = (prefix: string) => {
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/$/.test(prefix) || prefix.includes("..")) throw new Error("Invalid storage prefix");
  return prefix;
};

const safeKey = (key: string) => {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  return key;
};

/** Development: files under STORAGE_DIR (gitignored). */
class LocalStorage implements StorageDriver {
  private root = path.resolve(env.STORAGE_DIR);
  async put(key: string, body: Buffer, contentType: string) {
    const file = path.join(this.root, safeKey(key));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    await writeFile(`${file}.type`, contentType);
  }
  async get(key: string) {
    const file = path.join(this.root, safeKey(key));
    try {
      const [body, type] = await Promise.all([readFile(file), readFile(`${file}.type`, "utf8").catch(() => "application/octet-stream")]);
      return { body, contentType: type };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    const file = path.join(this.root, safeKey(key));
    await Promise.all([rm(file, { force: true }), rm(`${file}.type`, { force: true })]);
  }
  async deletePrefix(prefix: string) {
    const dir = path.join(this.root, safePrefix(prefix));
    const files = await readdir(dir, { recursive: true }).catch(() => [] as string[]);
    await rm(dir, { recursive: true, force: true });
    return files.filter((f) => !f.endsWith(".type")).length;
  }
}

/** Production: any S3-compatible bucket (AWS S3, Cloudflare R2, Neon Object Storage). Private objects only. */
export class S3Storage implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  /** Config defaults to the environment; tests pass a local S3-compatible endpoint. */
  constructor(cfg: { endpoint?: string; region?: string; bucket?: string; accessKeyId?: string; secretAccessKey?: string } = {}) {
    const endpoint = cfg.endpoint ?? env.S3_ENDPOINT;
    const accessKeyId = cfg.accessKeyId ?? env.S3_ACCESS_KEY_ID;
    const secretAccessKey = cfg.secretAccessKey ?? env.S3_SECRET_ACCESS_KEY;
    this.client = new S3Client({
      region: cfg.region ?? env.S3_REGION,
      endpoint,
      forcePathStyle: !!endpoint,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
    this.bucket = cfg.bucket ?? env.S3_BUCKET ?? "";
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: safeKey(key), Body: body, ContentType: contentType }));
  }
  async get(key: string) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }));
      if (!res.Body) return null;
      return { body: Buffer.from(await res.Body.transformToByteArray()), contentType: res.ContentType ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }));
  }
  async deletePrefix(prefix: string) {
    let deleted = 0;
    let token: string | undefined;
    do {
      const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: safePrefix(prefix), ContinuationToken: token }));
      const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
      if (keys.length) {
        await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys, Quiet: true } }));
        deleted += keys.length;
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return deleted;
  }
}

let driver: StorageDriver | undefined;
export function storage(): StorageDriver {
  if (!driver) {
    if (env.STORAGE_DRIVER === "s3" && !env.S3_BUCKET) throw new Error("STORAGE_DRIVER=s3 requires S3_BUCKET");
    driver = env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  }
  return driver;
}

/** Every storage area that holds per-user private files, keyed as `<area>/<userId>/…`. */
export const USER_STORAGE_AREAS = ["resumes", "interviews", "prep-packs"] as const;

/**
 * Deletes all of a user's stored files (resume originals, interview audio, PDF packs).
 * Idempotent: running it again, or for a user with no files, is a no-op.
 */
export async function deleteUserObjects(userId: string) {
  let deleted = 0;
  for (const area of USER_STORAGE_AREAS) deleted += await storage().deletePrefix(`${area}/${userId}/`);
  return deleted;
}
