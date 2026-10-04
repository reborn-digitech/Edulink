import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";

/**
 * The office's academics pages' common top (4 October 2026): the office
 * writes, the head reads (and decides late registrations and forwarded
 * condonations); a school, which is never offered ACADEMICS, sees the
 * module-off page.
 */
export async function academicsGate() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "ACADEMICS"), institutionKindOf(ctx.schoolId)]);
  return { ctx, t, locale, on, college: isCollegeKind(kind), canEdit: ctx.role === "ADMIN" };
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
