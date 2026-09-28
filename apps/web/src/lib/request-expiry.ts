import "server-only";
import { db } from "./db";
import { notify } from "./notify";
import { forSchool } from "./tenant-context";

/**
 * How long a request to join, or a claim to be a guardian, stays alive.
 *
 * THIRTY DAYS TO DECIDE. A request nobody decides is not a standing offer:
 * a name left in a queue since last term is a name somebody will one day
 * approve without remembering why. After thirty days it is EXPIRED, the
 * asker is told, and they may ask again.
 *
 * SEVEN DAYS AFTER A NO. A declined asker could ask again the same minute,
 * and a queue that fills as fast as it is emptied is a way to wear a
 * teacher down to a yes. For seven days after a decline the same person
 * cannot ask the same school and class, or claim the same child, again.
 *
 * THE DATE DECIDES, NOT THE JOB. Every reader of a waiting request asks for
 * PENDING and younger than the cutoff (`stillWaiting`), so a request past
 * its thirty days is out of every queue whether or not the nightly job has
 * run. The job (`expireRequests`, in accounts:tidy) writes the status and
 * tells the asker; it changes what nobody can already see.
 */
export const REQUEST_TTL_DAYS = 30;
export const COOL_OFF_DAYS = 7;

const DAY = 86_400_000;

/** Older than this, a PENDING request no longer waits. */
export const waitingCutoff = (now: Date = new Date()) => new Date(now.getTime() - REQUEST_TTL_DAYS * DAY);
/** Declined after this, the asker may not ask again yet. */
export const coolOffCutoff = (now: Date = new Date()) => new Date(now.getTime() - COOL_OFF_DAYS * DAY);
/** The where-clause of a request that still waits. */
export const stillWaiting = (now: Date = new Date()) => ({ status: "PENDING", createdAt: { gte: waitingCutoff(now) } }) as const;
/** A row's status as its reader should see it: PENDING past the cutoff is EXPIRED, whatever the column says. */
export const statusNow = (row: { status: string; createdAt: Date }, now: Date = new Date()): string =>
  row.status === "PENDING" && row.createdAt < waitingCutoff(now) ? "EXPIRED" : row.status;

/** For tests alone: the job sweeps every school; a test sweeps its own. */
export type ExpiryScope = { schoolIds?: string[] };

/**
 * Marks every request and claim past its thirty days EXPIRED and tells each
 * asker, for the daily `accounts:tidy` job. Counts per school, never a name.
 * Repeatable: a second run finds nothing.
 */
export async function expireRequests(
  now: Date = new Date(),
  scope: ExpiryScope = {},
): Promise<{ joins: number; claims: number; perSchool: Record<string, { joinsExpired?: number; claimsExpired?: number }> }> {
  const stale = { status: "PENDING", createdAt: { lt: waitingCutoff(now) }, ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) };
  const [joins, claims] = await Promise.all([
    db.joinRequest.findMany({ where: stale, select: { id: true, schoolId: true, userId: true, school: { select: { name: true } } } }),
    db.guardianClaim.findMany({ where: stale, select: { id: true, schoolId: true, claimantUserId: true, school: { select: { name: true } } } }),
  ]);
  const perSchool: Record<string, { joinsExpired?: number; claimsExpired?: number }> = {};
  let joinsExpired = 0;
  let claimsExpired = 0;

  for (const row of joins) {
    // Conditional on PENDING: somebody deciding it this minute wins.
    const moved = await db.joinRequest.updateMany({ where: { id: row.id, status: "PENDING" }, data: { status: "EXPIRED", decidedAt: now } });
    if (moved.count === 0) continue;
    joinsExpired += 1;
    (perSchool[row.schoolId] ??= {}).joinsExpired = (perSchool[row.schoolId]?.joinsExpired ?? 0) + 1;
    await forSchool(row.schoolId, () =>
      notify({
        userId: row.userId,
        schoolId: row.schoolId,
        kind: "SYSTEM",
        titleKey: "joinRequests.notifExpired",
        titleVars: { school: row.school.name },
        bodyKey: "joinRequests.notifExpiredBody",
        url: "/join/waiting",
      }),
    ).catch((error) => console.error("[expireRequests] notice failed", error));
  }
  for (const row of claims) {
    const moved = await db.guardianClaim.updateMany({ where: { id: row.id, status: "PENDING" }, data: { status: "EXPIRED", decidedAt: now } });
    if (moved.count === 0) continue;
    claimsExpired += 1;
    (perSchool[row.schoolId] ??= {}).claimsExpired = (perSchool[row.schoolId]?.claimsExpired ?? 0) + 1;
    await forSchool(row.schoolId, () =>
      notify({
        userId: row.claimantUserId,
        schoolId: row.schoolId,
        kind: "SYSTEM",
        titleKey: "claim.notifExpired",
        titleVars: { school: row.school.name },
        bodyKey: "claim.notifExpiredBody",
        url: "/parent/link",
      }),
    ).catch((error) => console.error("[expireRequests] notice failed", error));
  }
  return { joins: joinsExpired, claims: claimsExpired, perSchool };
}
