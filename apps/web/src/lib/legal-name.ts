import "server-only";
import { legalNameReasonSchema, type LegalNameReason } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The office corrects a legal name.
 *
 * TWO NAMES, TWO JOBS. `User.name` is the LEGAL name: what the leaving
 * certificate, the report card, UDISE+ and the boards print. `preferredName`
 * is what the app calls somebody, and is theirs to edit. The legal name was
 * typed once, at sign-up or intake, and nobody could change it afterwards —
 * so a misspelling went onto every paper the school issued.
 *
 * WHO: the school's office (an admin), for a pupil or a member of staff of
 * its own school. Not the person themselves: the office holds the admission
 * register, and a name on a certificate is the school's statement.
 *
 * WHY, AS A CODE. The reason is one of three codes and goes in the audit row
 * with the old and the new name, as a corrected date of birth does. No free
 * text: the log holds no sentences about a child (decision 0002).
 *
 * PAPERS ALREADY OUT DO NOT CHANGE. A certificate carries the name it was
 * issued with and a published report card the name it was published with
 * (their own `studentName`), so the paper in a family's drawer and the
 * public check by its code go on agreeing. A paper that printed the wrong
 * name is put right the way paper is: revoked, and issued again.
 *
 * TOLD. The person is told, and a pupil's guardians, with the name as it now
 * stands: it is theirs, and somebody else just wrote it.
 */

export type LegalNameResult = { ok: true; changed: boolean } | { ok: false; errorKey: TranslationKey };

/** Letters of any script with their marks, spaces, and the punctuation names carry. */
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

export function cleanLegalName(raw: string): string | null {
  const name = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 120) return null;
  return NAME.test(name) ? name : null;
}

export async function correctLegalName(ctx: ActiveContext, membershipId: string, rawName: string, rawReason: string): Promise<LegalNameResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyTheOfficeCorrectsLegalNames");

  const reason = legalNameReasonSchema.safeParse(rawReason);
  if (!reason.success) return { ok: false, errorKey: "people.legalNameChooseReason" };
  const name = cleanLegalName(rawName);
  if (!name) return { ok: false, errorKey: "people.legalNameNotAName" };

  const member = await db.membership.findFirst({
    where: { id: membershipId, schoolId: ctx.schoolId, status: { not: "REMOVED" }, role: { in: ["STUDENT", "TEACHER", "PRINCIPAL", "ADMIN"] } },
    select: { id: true, role: true, userId: true, user: { select: { name: true } } },
  });
  if (!member) return { ok: false, errorKey: "refusal.notAMemberHere" };
  if (member.user.name === name) return { ok: true, changed: false };

  await db.user.update({ where: { id: member.userId }, data: { name } });
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "user.legalname.set",
    targetType: "Membership",
    targetId: member.id,
    meta: { from: member.user.name, to: name, reason: reason.data satisfies LegalNameReason },
  });

  const guardians =
    member.role === "STUDENT"
      ? await db.guardianship.findMany({ where: { studentMembershipId: member.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, select: { parentUserId: true } })
      : [];
  const told = new Map<string, string>([[member.userId, member.role === "STUDENT" ? "/student/profile" : "/teacher/profile"]]);
  for (const g of guardians) if (!told.has(g.parentUserId)) told.set(g.parentUserId, "/parent");
  await Promise.all(
    [...told].map(([userId, url]) =>
      notify({
        userId,
        schoolId: ctx.schoolId!,
        kind: "SYSTEM",
        titleKey: "notifTitle.legalNameSet",
        bodyKey: "notifBody.legalNameSet",
        bodyVars: { name },
        url,
      }).catch(() => {}),
    ),
  );
  return { ok: true, changed: true };
}
