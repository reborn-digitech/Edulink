import "server-only";
import { notFound } from "next/navigation";
import type { DutyCode, SchoolModuleCode } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { hasDuty } from "@/lib/duties";
import type { Role } from "@/lib/constants";

/**
 * A duty's page's first lines (5 Oct 2026), as the anti-ragging register's:
 * the roles that may open it, a college, a FACULTY or HOD holding the duty
 * (the session's gate already refuses the page to one without — this answers
 * a page that is not here should it be reached another way), and whether the
 * desk's module is on (`moduleOn` false draws <ModuleOff/>).
 */
export async function dutyPageContext(duty: DutyCode, module: SchoolModuleCode, office: Role[] = ["ADMIN", "PRINCIPAL"]) {
  const ctx = await requireRole(...(["FACULTY", "HOD", ...office] as Role[]));
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if ((ctx.role === "FACULTY" || ctx.role === "HOD") && !(await hasDuty(ctx, duty))) notFound();
  return { ctx, moduleOn: await isModuleOn(ctx.schoolId, module) };
}
