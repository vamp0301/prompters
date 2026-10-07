/**
 * A resume chosen on the landing page before the visitor has an account. It stays in this
 * browser only (IndexedDB) and is uploaded after sign-up, then deleted. Nothing is sent to the
 * server while the visitor is logged out.
 */
export interface PendingResume {
  name: string;
  mimeType: string;
  base64: string;
  size: number;
  targetRole: string;
  savedAt: number;
}

const DB = "prompters";
const STORE = "pending";
const KEY = "resume";
/** A forgotten upload shouldn't surprise someone days later. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB failed"));
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
    });
  } finally {
    db.close();
  }
}

/** Returns false when the browser blocks storage (private mode, disabled site data). */
export async function savePendingResume(r: PendingResume): Promise<boolean> {
  try {
    await run("readwrite", (s) => s.put(r, KEY));
    return true;
  } catch {
    return false;
  }
}

export async function loadPendingResume(): Promise<PendingResume | null> {
  try {
    const r = await run<PendingResume | undefined>("readonly", (s) => s.get(KEY));
    if (!r) return null;
    if (Date.now() - r.savedAt > MAX_AGE_MS) {
      await clearPendingResume();
      return null;
    }
    return r;
  } catch {
    return null;
  }
}

export async function clearPendingResume() {
  try {
    await run("readwrite", (s) => s.delete(KEY));
  } catch {
    /* nothing stored or storage blocked */
  }
}
