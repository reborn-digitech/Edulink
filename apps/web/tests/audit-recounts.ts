/**
 * Raw recounts the data audit (`npm run data:audit`) compares the app's
 * answers against, kept apart so an ordinary suite can hold the audit's own
 * arithmetic too (tests/college-year.test.ts runs this one on a graduation).
 */
import type { PrismaClient } from "@prisma/client";

/**
 * The guardians the office's messaging reaches, from the guardianship rows:
 * every ACTIVE link to a child still on the roll, once per guardian (S4B-2,
 * 5 Oct 2026). A pupil who leaves a school or a college — a transfer, a
 * graduation — keeps a real parent's guardianship ACTIVE on purpose (it is
 * how the family still reaches the record and the leaving certificate; see
 * recordDeparture in school-record.ts), and no notice, broadcast or count of
 * the office's goes to it. The recount used to take every ACTIVE link, so it
 * disagreed with the overview from the first leaver with a parent on.
 */
export async function reachableGuardians(db: PrismaClient, schoolId: string): Promise<{ total: number; withPhone: number }> {
  const rows = await db.guardianship.findMany({
    where: { studentSchoolId: schoolId, status: "ACTIVE", student: { role: "STUDENT", status: "ACTIVE", leftAt: null } },
    select: { parentUserId: true, parent: { select: { phone: true } } },
    distinct: ["parentUserId"],
  });
  return { total: rows.length, withPhone: rows.filter((g) => g.parent.phone).length };
}

/**
 * Each broadcast's stored counters against its own messages, as the data audit checks them; the disagreements, one
 * sentence each. KEPT A YEAR (TA-457, decision 0002): the nightly clean-up deletes a text a year after it was written
 * and keeps the row of a STOP reply, so a broadcast older than the texts' period no longer holds all its messages,
 * while its stored counters still say how the notice went. Such a broadcast is not compared whole: each count of the
 * messages it still holds may not exceed the stored one. A broadcast inside the period is compared whole, as
 * before. `textsKeptFrom` is the clean-up's own cut (cutoffs(now, config).textMessages in retention.ts).
 */
export async function broadcastCounterFails(db: PrismaClient, schoolId: string, textsKeptFrom: Date): Promise<string[]> {
  const fails: string[] = [];
  for (const b of await db.broadcast.findMany({ where: { schoolId }, select: { id: true, title: true, queued: true, sent: true, delivered: true, failed: true, skipped: true, recipients: true, status: true, createdAt: true, messages: { select: { status: true } } } })) {
    const c = (st: string) => b.messages.filter((m) => m.status === st).length;
    const e = { sent: c("SENT") + c("DELIVERED") + c("UNDELIVERED"), delivered: c("DELIVERED"), failed: c("FAILED") + c("UNDELIVERED"), skipped: c("SKIPPED") };
    const keys = Object.keys(e) as (keyof typeof e)[];
    if (b.createdAt < textsKeptFrom) {
      for (const k of keys) if (e[k] > b[k]) fails.push(`broadcast "${b.title}" ${k}: stored ${b[k]} vs more of its messages kept past the year ${e[k]}`);
      continue;
    }
    if (b.status === "DONE" && b.messages.length) for (const k of keys) if (b[k] !== e[k]) fails.push(`broadcast "${b.title}" ${k}: stored ${b[k]} vs its messages ${e[k]}`);
    if (b.sent + b.skipped + b.failed > b.messages.length + b.recipients) fails.push(`broadcast "${b.title}": counters exceed recipients`);
  }
  return fails;
}
