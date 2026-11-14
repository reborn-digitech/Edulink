import type { TranslationKey } from "@edulink/i18n";
import { roleLabel } from "@/lib/role-label";

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/**
 * The feed's tag for an author (the alumni module, 3 Oct 2026): a former
 * pupil reads "Alumni · 2026" (the year they left), everyone else their
 * role — "Student" for a pupil, a staff role for staff. As the web's.
 */
export function authorTag(t: Translate, role: string, batch?: number | null): string {
  if (role === "ALUMNUS" && batch) return t("alumni.tag", { year: batch });
  // The one helper that names a role (TA-327): EXAM_CONTROLLER is role.examController, not role.exam_controller.
  return roleLabel(t, role);
}
