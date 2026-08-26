import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";
import { forSchool } from "./tenant-context";
import { writeJson } from "./json";

/**
 * Append-only audit trail. The Safety Center reads it, and it is the only way
 * to answer "who changed this child's grade" after the fact. (§3 Safety Center)
 *
 * Writing an audit row must never take down the action it describes, so
 * failures are logged and swallowed here — this is the documented exception to
 * the no-silent-catch rule (§5), and the reason is that losing an audit line is
 * strictly better than failing a teacher's attendance save.
 *
 * THAT EXCEPTION HID A BUG FOR AS LONG AS ROW-LEVEL SECURITY HAS BEEN ON. The
 * most interesting things to audit happen BEFORE a school is bound — a login, a
 * failed login, a school being registered, an invitation accepted, a child
 * joining with a code. Every one of those was refused by the policy and
 * swallowed here, so the trail was missing precisely the events that answer "how
 * did this person get access". A log with a hole in it is worse than no log,
 * because it is trusted.
 *
 * So this binds the school it is being asked to record against, for the length
 * of the insert. THE INVARIANT THAT MAKES THAT SAFE: `schoolId` here always
 * comes from server-resolved context — a session, an `assert*` helper, or a row
 * just written — and NEVER from client input. Pass a client-supplied id and you
 * would be letting somebody write a line into another school's history. Nothing
 * reads this binding but the insert below.
 *
 * An entry with no school at all stays unbound and is written unattributed; the
 * policy allows that for this table alone, and no school can see it. See the
 * NULL_SCHOOL_WRITABLE note in scripts/gen-rls.ts.
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
    /**
     * The IP is best-effort CONTEXT, not the record. `headers()` throws
     * outside a request scope — cron jobs, scripts, the simulation harness —
     * and for as long as that throw sat inside this function's main try, it
     * took the WHOLE entry with it: every audit line written from outside a
     * request was lost, loudly, a full stack per call. The three-school
     * simulation showed the cost — enquiries opened, marks saved and pupils
     * departing, none of it on the record. An audit row with a null IP is a
     * record; a stack trace instead of a row is not.
     */
    const ip = await headers()
      .then((hdrs) => hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null)
      .catch(() => null);
    const meta = writeJson(entry.meta ?? {});

    if (entry.schoolId) {
      await forSchool(entry.schoolId, () =>
        db.auditLog.create({
          data: {
            schoolId: entry.schoolId ?? null,
            actorUserId: entry.actorUserId ?? null,
            action: entry.action,
            targetType: entry.targetType ?? null,
            targetId: entry.targetId ?? null,
            meta,
            ip,
          },
        }),
      );
      return;
    }

    /**
     * No school: a failed login, or one that resolved to no school at all.
     *
     * RAW, and NOT `create()`, for a reason that is easy to lose. Prisma's
     * `create` issues `INSERT ... RETURNING`, and RETURNING has to READ the row
     * back — which sends it through the policy's USING clause, where a row
     * belonging to no school matches nothing. The insert is permitted and the
     * read of it is not, so the whole statement is refused.
     *
     * Widening USING to let anyone read unattributed rows would fix it and
     * would be wrong: a failed login carries the email that was tried, and every
     * school would be able to read every other school's. So the row goes in
     * without being read back. Nothing here needs it.
     */
    // AN ISO STRING CAST TO `timestamp`, and neither `now()` nor a JS Date.
    // `createdAt` holds UTC — that is what Prisma writes into it everywhere else
    // — but this column has no time zone, so both of the obvious spellings put
    // LOCAL time in it: `now()` is the database session's clock, and a Date
    // parameter is converted to that session's zone on the way in. Both landed
    // these rows seven hours in the past next to every other row in the table,
    // in a log where "when" is half of what is being recorded.
    await db.$executeRaw`
      INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
      VALUES (${randomUUID()}, NULL, ${entry.actorUserId ?? null}, ${entry.action},
              ${entry.targetType ?? null}, ${entry.targetId ?? null}, ${meta}, ${ip},
              ${new Date().toISOString()}::timestamp)
    `;
  } catch (error) {
    console.error("[audit] failed to record", entry.action, error);
  }
}
