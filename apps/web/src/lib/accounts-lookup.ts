import "server-only";
import type { AccountsLookup } from "@edulink/contracts";
import { db } from "./db";
import type { ActiveContext } from "./session";
import { MONEY_READ, collegeDesk } from "./college-office";

/**
 * THE COUNTER QUESTION, FROM A PHONE (5 Oct 2026, the campaign's ACCOUNTS
 * recommendation: "a read-only ledger look-up by PRN"). A student of the
 * caller's college found by the start of their PRN or college code, or by a
 * part of their name — at most twenty, live students only — so the desk can
 * open the ledger (GET /api/v1/accounts/ledger/{id}) and the no-dues
 * (GET /api/v1/accounts/no-dues/{id}) it already reads. The PRN is the
 * record's own (PupilRecord.prn, its one writer); the seat gives the
 * programme. Reads only; the desk roles the ledger names, nobody else.
 */
export async function lookupStudents(ctx: ActiveContext, q: string): Promise<AccountsLookup> {
  const desk = await collegeDesk(ctx, MONEY_READ);
  const needle = q.trim();
  const rows = await db.membership.findMany({
    where: {
      schoolId: desk.schoolId,
      role: "STUDENT",
      status: "ACTIVE",
      leftAt: null,
      OR: [
        { pupilRecord: { prn: { startsWith: needle, mode: "insensitive" } } },
        { studentCode: { startsWith: needle, mode: "insensitive" } },
        { user: { name: { contains: needle, mode: "insensitive" } } },
      ],
    },
    orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
    take: 20,
    select: {
      id: true,
      studentCode: true,
      user: { select: { name: true } },
      pupilRecord: { select: { prn: true } },
      academicSeat: { select: { yearOfStudy: true, programme: { select: { name: true } } } },
    },
  });
  return {
    items: rows.map((m) => ({
      studentMembershipId: m.id,
      name: m.user.name,
      prn: m.pupilRecord?.prn ?? null,
      studentCode: m.studentCode,
      programme: m.academicSeat?.programme.name ?? null,
      yearOfStudy: m.academicSeat?.yearOfStudy ?? null,
    })),
  };
}
