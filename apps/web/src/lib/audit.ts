import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";
import { forSchool } from "./tenant-context";
import { clientAddress } from "./rate-limit";
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
/**
 * A transaction client the row may be written through instead of the module's
 * `db`: only `$queryRaw` and `$executeRaw`, which is all the raw insert needs.
 * Handed in by work that must keep its audit rows inside its own transaction —
 * the operator's onboarding, where a refused step rolls the school and its
 * record back together (subscriptions.ts).
 */
export type AuditTx = Pick<typeof db, "$queryRaw" | "$executeRaw">;

export async function audit(
  entry: {
    schoolId?: string | null;
    actorUserId?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  },
  tx?: AuditTx,
): Promise<string | null> {
  /**
   * Returns the row's id, or null when nothing was written. Almost every
   * caller ignores it; the app's problem report hands it back to the phone as
   * the report's id, and needs to know when the swallowed failure below has
   * left it with nothing to hand back.
   */
  try {
    if (tx) return await auditInTransaction(entry, tx);
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
    let ip: string | null = null;
    try {
      // A plain try/catch, NOT a promise .catch(): outside a request scope
      // Next throws from the headers() CALL itself, synchronously, before any
      // promise exists — so the .catch this used to be never engaged and the
      // throw fell through to the outer try, taking the whole entry with it
      // again. The three-year simulation caught the regression on its first
      // write.
      ip = await headers().then(
        // The address the rate limiter trusts (Fly's header, else the last hop), not the first hop a client can write.
        (hdrs) => clientAddress(hdrs),
      );
    } catch {
      ip = null;
    }
    const meta = writeJson(entry.meta ?? {});

    if (entry.schoolId) {
      const row = await forSchool(entry.schoolId, () =>
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
          select: { id: true },
        }),
      );
      return row.id;
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
    const id = randomUUID();
    await db.$executeRaw`
      INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
      VALUES (${id}, NULL, ${entry.actorUserId ?? null}, ${entry.action},
              ${entry.targetType ?? null}, ${entry.targetId ?? null}, ${meta}, ${ip},
              ${new Date().toISOString()}::timestamp)
    `;
    return id;
  } catch (error) {
    console.error("[audit] failed to record", entry.action, error);
    return null;
  }
}

/**
 * The same row, written ON the caller's transaction so it commits and rolls
 * back with the work it describes. The module's `db` is of no use here: inside
 * a tenant transaction its extension re-issues nothing and the query would run
 * on another connection, outside the transaction, against a school that does
 * not exist yet.
 *
 * ALWAYS THE RAW INSERT, for the reason the unattributed path gives — no
 * RETURNING, so no read-back through the policy — and for a school-bound row
 * the tenant setting is widened to that school for the length of the insert
 * and put back, the same narrowing `forSchool` does per query outside a
 * transaction. The id is minted here, as below.
 *
 * NOT SWALLOWED. A failed statement aborts the Postgres transaction, so there
 * is nothing left to protect by continuing; the throw reaches the caller's
 * `$tenantTransaction` and the whole unit rolls back, which is the point.
 */
async function auditInTransaction(entry: Parameters<typeof audit>[0], tx: AuditTx): Promise<string> {
  let ip: string | null = null;
  try {
    ip = await headers().then((hdrs) => clientAddress(hdrs));
  } catch {
    ip = null;
  }
  const meta = writeJson(entry.meta ?? {});
  const id = randomUUID();
  const schoolId = entry.schoolId ?? null;
  const before = schoolId
    ? await tx.$queryRaw<{ ids: string | null }[]>`
        SELECT current_setting('app.school_ids', true) AS ids
      `
    : null;
  if (schoolId) {
    const current = before?.[0]?.ids ?? "";
    const widened = [...current.split(",").filter(Boolean), schoolId].join(",");
    await tx.$executeRaw`
      SELECT set_config('app.school_ids', ${widened}, true)
    `;
  }
  await tx.$executeRaw`
    INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
    VALUES (${id}, ${schoolId}, ${entry.actorUserId ?? null}, ${entry.action},
            ${entry.targetType ?? null}, ${entry.targetId ?? null}, ${meta}, ${ip},
            ${new Date().toISOString()}::timestamp)
  `;
  if (schoolId) {
    await tx.$executeRaw`
      SELECT set_config('app.school_ids', ${before?.[0]?.ids ?? ""}, true)
    `;
  }
  return id;
}
