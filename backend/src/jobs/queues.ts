import { Queue, QueueEvents } from "bullmq";
import { bullConnection } from "../lib/redis.js";
import type { RunRequest, RunResult } from "../sandbox/types.js";
import { AppError } from "../utils/errors.js";
import { codeExecutionEnabled } from "../config/env.js";

export const CODE_QUEUE = "code-execution";

let queue: Queue<RunRequest, RunResult> | undefined;
let events: QueueEvents | undefined;

function codeQueue() {
  queue ??= new Queue<RunRequest, RunResult>(CODE_QUEUE, {
    connection: bullConnection(),
    defaultJobOptions: { removeOnComplete: { age: 300, count: 1000 }, removeOnFail: { age: 3600 }, attempts: 1 },
  });
  events ??= new QueueEvents(CODE_QUEUE, { connection: bullConnection() });
  return { queue, events };
}

/**
 * Sends code to the sandbox worker and waits for the result. Student code never
 * runs inside the API process.
 */
export async function executeCode(req: RunRequest, waitMs = 20_000): Promise<RunResult> {
  if (!codeExecutionEnabled()) {
    throw new AppError(503, "CODE_EXECUTION_DISABLED", "Running code is turned off on this server for now. Everything else keeps working.");
  }
  const { queue: q, events: ev } = codeQueue();
  const job = await q.add("run", req);
  try {
    return (await job.waitUntilFinished(ev, waitMs)) as RunResult;
  } catch (e) {
    // Nobody is waiting any more: don't let the job run later for nothing.
    await job.remove().catch(() => undefined);
    if (e instanceof Error && /timed out|timeout/i.test(e.message)) {
      throw new AppError(503, "SANDBOX_UNAVAILABLE", "The code runner is busy or offline right now. Please try again in a moment.");
    }
    throw e;
  }
}

export async function closeQueues() {
  await events?.close();
  await queue?.close();
  events = undefined;
  queue = undefined;
}
