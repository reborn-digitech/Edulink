import "server-only";
import type { Prisma } from "@prisma/client";
import type { db } from "./db";

/**
 * WHAT A TEXT KEEPS, AND FOR HOW LONG (TA-457; the owner's decision of 14 November 2026, option 1; decision 0002).
 *
 * Every text the platform decides on is an OutboundMessage row with the number it went to and the rendered words,
 * the SKIPPED ones included. Three rules hold here and in the nightly sweep (retention.ts):
 *
 *  - A SKIPPED text keeps no words: it was never sent, and the office's report needs only who, why and when. The row
 *    is written with an empty body and no variables (SKIPPED_WORDS), and the sweep blanks the words of any written
 *    before the decision.
 *  - THE RECORD THAT A NUMBER REPLIED STOP IS NEVER DELETED: the only record of it is the text row the provider
 *    refused with error 21610 (messaging.ts answeredStop), so that row keeps its number for as long as the school
 *    stands. Past the year, and when its person leaves the school, it loses its words and keeps the number.
 *  - WHEN A PUPIL OR GUARDIAN LEAVES THE SCHOOL the number and the words of every text to them at that school are
 *    blanked (blankTextsOfLeavers), a STOP row keeping its number. Nobody can delete their own account (decision
 *    0002, Rights), so leaving the school is the moment: a pupil's departure or removal, a guardian's last link to a
 *    pupil on the roll ended, a seat given up.
 */

/** A provider's STOP answer on a text, as the status callback ("21610: …") and a refusal at send time ("… (code 21610)") write it. */
export const STOP_REPLY = { OR: [{ error: { startsWith: "21610" } }, { error: { contains: "(code 21610)" } }] } satisfies Prisma.OutboundMessageWhereInput;

/** Not a STOP reply's row: no error at all, or one that is not 21610. */
export const NOT_A_STOP_REPLY = { OR: [{ error: null }, { NOT: STOP_REPLY.OR }] } satisfies Prisma.OutboundMessageWhereInput;

/** What a skipped text, and a STOP row past its use, keeps of its words: nothing. */
export const SKIPPED_WORDS = { body: "", varsJson: "{}" } as const;

type TextClient = Pick<typeof db, "outboundMessage" | "membership" | "guardianship">;

/**
 * Of these people, the ones who no longer belong to the school: no membership there that is current (not left, and
 * not the alumnus row a departure opens), and no active family link to a pupil still on its roll.
 */
export async function leaversAmong(rawTx: unknown, schoolId: string, userIds: string[]): Promise<string[]> {
  const tx = rawTx as TextClient;
  const people = [...new Set(userIds)];
  if (people.length === 0) return [];
  const [members, guardians] = await Promise.all([
    tx.membership.findMany({ where: { schoolId, userId: { in: people }, leftAt: null, role: { not: "ALUMNUS" } }, select: { userId: true } }),
    tx.guardianship.findMany({ where: { studentSchoolId: schoolId, parentUserId: { in: people }, status: "ACTIVE", relation: { not: "SCHOOL" }, student: { leftAt: null } }, select: { parentUserId: true } }),
  ]);
  const staying = new Set([...members.map((m) => m.userId), ...guardians.map((g) => g.parentUserId)]);
  return people.filter((id) => !staying.has(id));
}

/**
 * Blank the number and the words of every text at this school to those of these people who have left it (a STOP
 * row keeps its number). Run in the transaction of the leaving itself; returns how many rows were blanked, for the
 * leaving's audit row. Idempotent: a row already blank is not counted again.
 */
export async function blankTextsOfLeavers(rawTx: unknown, schoolId: string, userIds: string[]): Promise<number> {
  const tx = rawTx as TextClient;
  const leavers = await leaversAmong(rawTx, schoolId, userIds);
  if (leavers.length === 0) return 0;
  const theirs = { schoolId, userId: { in: leavers } };
  const texts = await tx.outboundMessage.updateMany({ where: { ...theirs, ...NOT_A_STOP_REPLY, NOT: { to: "", body: "", varsJson: "{}" } }, data: { to: "", ...SKIPPED_WORDS } });
  const stops = await tx.outboundMessage.updateMany({ where: { AND: [theirs, STOP_REPLY, { NOT: { body: "", varsJson: "{}" } }] }, data: SKIPPED_WORDS });
  return texts.count + stops.count;
}

/** The family guardians of a pupil at a school (the people a pupil's leaving may take out of the school with them). */
export async function familyGuardiansOfPupil(rawTx: unknown, studentMembershipId: string): Promise<string[]> {
  const tx = rawTx as TextClient;
  const rows = await tx.guardianship.findMany({ where: { studentMembershipId, relation: { not: "SCHOOL" } }, select: { parentUserId: true } });
  return rows.map((r) => r.parentUserId);
}
