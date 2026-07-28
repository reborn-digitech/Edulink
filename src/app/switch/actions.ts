"use server";

import { redirect } from "next/navigation";
import { getSession, setActiveContext } from "@/lib/session";
import { ROLE_HOME, ROLES, type Role } from "@/lib/constants";

/**
 * Switches the active role/school on the current session.
 *
 * The schoolId and role arrive from a form the user controls, so they are
 * treated as a *request*, not a fact: `setActiveContext` re-checks that a live,
 * ACTIVE membership (or guardianship, for PARENT) actually backs the pair
 * before it writes anything. A forged form field gets a redirect, not access.
 */
export async function switchContext(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const rawRole = String(formData.get("role") ?? "");
  const rawSchoolId = formData.get("schoolId");
  const schoolId = typeof rawSchoolId === "string" && rawSchoolId ? rawSchoolId : null;

  if (!ROLES.includes(rawRole as Role)) redirect("/switch");
  const role = rawRole as Role;

  const ok = await setActiveContext(session.sessionId, session.user.id, {
    schoolId: role === "PARENT" ? null : schoolId,
    role,
  });

  // Back to the picker rather than a dead end or a misleading error page.
  if (!ok) redirect("/switch");

  redirect(ROLE_HOME[role]);
}
