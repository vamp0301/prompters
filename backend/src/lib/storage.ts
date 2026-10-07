import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

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
}

/** Production: any S3-compatible bucket (AWS S3, Cloudflare R2, Neon Object Storage). Private objects only. */
class S3Storage implements StorageDriver {
  private client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: !!env.S3_ENDPOINT,
    credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY } : undefined,
  });
  private bucket = env.S3_BUCKET ?? "";
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
}

let driver: StorageDriver | undefined;
export function storage(): StorageDriver {
  if (!driver) {
    if (env.STORAGE_DRIVER === "s3" && !env.S3_BUCKET) throw new Error("STORAGE_DRIVER=s3 requires S3_BUCKET");
    driver = env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  }
  return driver;
}
