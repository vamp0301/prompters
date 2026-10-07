import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

/** Records an admin action. Audit rows are append-only: there is no delete endpoint. */
export async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  before?: unknown,
  after?: unknown,
) {
  const json = (v: unknown) => (v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));
  await prisma.adminAuditLog.create({
    data: { actorId, action, entityType, entityId, before: json(before), after: json(after) },
  });
}
