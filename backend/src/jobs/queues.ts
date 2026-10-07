import { Queue, QueueEvents } from "bullmq";
import { bullConnection } from "../lib/redis.js";
import type { RunRequest, RunResult } from "../sandbox/types.js";

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
export async function executeCode(req: RunRequest): Promise<RunResult> {
  const { queue: q, events: ev } = codeQueue();
  const job = await q.add("run", req);
  return (await job.waitUntilFinished(ev, 20_000)) as RunResult;
}

export async function closeQueues() {
  await events?.close();
  await queue?.close();
  events = undefined;
  queue = undefined;
}
