import "server-only";
import type { ActiveContext } from "@/lib/session";
import { getSchool, listSchoolAdmins } from "@/lib/superuser";
import { schoolUsage } from "@/lib/plans";

/**
 * The support card on the operator's school page, for the phone and the
 * web: who the school's office is (active admins and head, with their live
 * sessions), the plan the school is on, and this month's usage against it.
 * Reads the memberships bound to the school as the operator, which records
 * no visit (nothing of the school's work is read); the usage row is the
 * operator's own to read (SUPERUSER_READABLE). Null for no such school.
 */
export async function operatorSchoolSupport(ctx: ActiveContext, schoolId: string) {
  const school = await getSchool(ctx, schoolId);
  if (!school) return null;
  const [admins, usage] = await Promise.all([listSchoolAdmins(ctx, schoolId), schoolUsage(schoolId)]);
  return {
    admins: admins.map((a) => ({ userId: a.userId, name: a.name, email: a.email, role: a.role, liveSessions: a.liveSessions, lastSeenAt: a.lastSeenAt?.toISOString() ?? null })),
    plan: usage.plan,
    planSince: school.planSince?.toISOString() ?? null,
    usage: { month: usage.month, plan: usage.plan, counts: usage.counts, caps: usage.caps, over: usage.over, computedAt: usage.computedAt?.toISOString() ?? null },
  };
}
