import "server-only";
import { db } from "../db";
import { audit } from "../audit";
import { notify } from "../notify";

/**
 * THE COUNSELLOR ROUTE (docs/plans/assistant.md §5 Phase B, §9.10). A pupil's question the refusal
 * table reads as self-harm is never answered with a bare refusal: the pupil is given the helpline
 * sentence (the school's School.helplineText, else the national one), and a caring adult at the school
 * is told — the school's counsellor on the staff record (a StaffRecord whose designation names a
 * counsellor), else the head (PRINCIPAL), else the office (ADMIN). They are told WHO and that the pupil
 * may need someone to talk to; never the words. Once a school day per pupil: a pupil who asks again is
 * given the helpline again, and nobody is told twice.
 */
const COUNSELLOR_DESIGNATION = /counsel|समुपदेशक|परामर्शदाता|परामर्शदात्री|काउंसलर|कौन्सेलर/i;

export type CounsellorRoute = { routedTo: "COUNSELLOR" | "PRINCIPAL" | "ADMIN" | "NOBODY"; told: number };

export async function counsellorsOf(schoolId: string): Promise<{ routedTo: CounsellorRoute["routedTo"]; userIds: string[] }> {
  const records = await db.staffRecord.findMany({ where: { schoolId, designation: { not: null }, membership: { status: "ACTIVE", leftAt: null } }, select: { designation: true, membership: { select: { userId: true } } } });
  const counsellors = records.filter((r) => COUNSELLOR_DESIGNATION.test(r.designation ?? "")).map((r) => r.membership.userId);
  if (counsellors.length) return { routedTo: "COUNSELLOR", userIds: [...new Set(counsellors)] };
  for (const role of ["PRINCIPAL", "ADMIN"] as const) {
    const heads = await db.membership.findMany({ where: { schoolId, role, status: "ACTIVE", leftAt: null }, select: { userId: true } });
    if (heads.length) return { routedTo: role, userIds: [...new Set(heads.map((h) => h.userId))] };
  }
  return { routedTo: "NOBODY", userIds: [] };
}

export async function routeToCounsellor(input: { schoolId: string; pupilMembershipId: string; pupilUserId: string }): Promise<CounsellorRoute> {
  const [{ routedTo, userIds }, pupil, enrolment] = await Promise.all([
    counsellorsOf(input.schoolId),
    db.user.findUnique({ where: { id: input.pupilUserId }, select: { name: true, preferredName: true } }),
    db.enrollment.findFirst({ where: { schoolId: input.schoolId, studentMembershipId: input.pupilMembershipId, status: "ACTIVE" }, select: { class: { select: { name: true } } } }),
  ]);
  const name = pupil?.preferredName ?? pupil?.name ?? "—";
  const className = enrolment?.class.name ?? "—";
  for (const userId of userIds) {
    await notify({ userId, schoolId: input.schoolId, kind: "SYSTEM", titleKey: "assistantService.counsellorTitle", bodyKey: "assistantService.counsellorBody", bodyVars: { name, className }, urgent: true, meta: { assistant: "counsellorRoute", pupilMembershipId: input.pupilMembershipId } });
  }
  await audit({ schoolId: input.schoolId, actorUserId: null, action: "assistant.counsellorRoute", targetType: "Membership", targetId: input.pupilMembershipId, meta: { routedTo, told: userIds.length } });
  return { routedTo, told: userIds.length };
}
