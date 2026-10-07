import { ApiError } from "@/lib/api/client";

/** HTTP status of an API error (0 for network errors), or null for anything else. */
export const apiStatus = (err: unknown) => (err instanceof ApiError ? err.status : null);

/** `details` payload of an API error (e.g. 423 LOCKED responses carry `{ topic }`). */
export const apiDetails = <T,>(err: unknown) => (err instanceof ApiError ? (err.details as T | undefined) : undefined);
