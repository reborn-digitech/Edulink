/**
 * THE ALUMNUS ROW (3 Oct 2026). A pupil who leaves keeps a connection to the
 * old school: their STUDENT membership is closed with `leftAt`, as it always
 * was, and a second Membership is opened beside it with role ALUMNUS, status
 * ACTIVE — the row itself is what "alumnus of this school" means. They may be
 * a STUDENT at a new school at the same time; the role chooser offers both.
 *
 * Opened by a departure (school-record.ts recordDeparture, every door into it:
 * the office's leaving, the scheduled departures job, promotion's graduates)
 * and by nothing else — the alumnus is never invited. Closed (`leftAt`) when
 * the departure is undone or the pupil is taken back on the roll, and opened
 * again by the next departure. Closed rather than deleted, so whatever the
 * alumni module later hangs on the row is not cascaded away by an undo.
 *
 * No "server-only" and no db import: the callers hand in the transaction the
 * departure or the re-admission is already running in.
 */
type MembershipClient = {
  membership: {
    findUnique: (args: { where: { userId_schoolId_role: { userId: string; schoolId: string; role: string } }; select: { id: true; leftAt: true } }) => Promise<{ id: string; leftAt: Date | null } | null>;
    create: (args: { data: { userId: string; schoolId: string; role: string; status: string; joinedAt: Date } }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: { status?: string; leftAt: Date | null; joinedAt?: Date; suspendedAt?: null; suspendedReason?: null } }) => Promise<unknown>;
  };
};

/** Open (or reopen) the alumnus row of `userId` at `schoolId`, from the day they left. */
export async function openAlumnus(client: MembershipClient, userId: string, schoolId: string, leftAt: Date): Promise<void> {
  const existing = await client.membership.findUnique({ where: { userId_schoolId_role: { userId, schoolId, role: "ALUMNUS" } }, select: { id: true, leftAt: true } });
  if (!existing) {
    await client.membership.create({ data: { userId, schoolId, role: "ALUMNUS", status: "ACTIVE", joinedAt: leftAt } });
    return;
  }
  if (existing.leftAt) await client.membership.update({ where: { id: existing.id }, data: { status: "ACTIVE", leftAt: null, joinedAt: leftAt, suspendedAt: null, suspendedReason: null } });
}

/** Close the alumnus row, if there is an open one: the departure was undone, or the pupil is back on the roll. */
export async function closeAlumnus(client: MembershipClient, userId: string, schoolId: string, at: Date = new Date()): Promise<void> {
  const existing = await client.membership.findUnique({ where: { userId_schoolId_role: { userId, schoolId, role: "ALUMNUS" } }, select: { id: true, leftAt: true } });
  if (existing && !existing.leftAt) await client.membership.update({ where: { id: existing.id }, data: { leftAt: at } });
}
