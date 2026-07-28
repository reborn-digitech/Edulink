import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { writeJson } from "./json";

/**
 * Append-only audit trail. The Safety Center reads it, and it is the only way
 * to answer "who changed this child's grade" after the fact. (§3 Safety Center)
 *
 * Writing an audit row must never take down the action it describes, so
 * failures are logged and swallowed here — this is the documented exception to
 * the no-silent-catch rule (§5), and the reason is that losing an audit line is
 * strictly better than failing a teacher's attendance save.
 */
export async function audit(entry: {
  schoolId?: string | null;
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const hdrs = await headers();
    await db.auditLog.create({
      data: {
        schoolId: entry.schoolId ?? null,
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        meta: writeJson(entry.meta ?? {}),
        ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", entry.action, error);
  }
}
