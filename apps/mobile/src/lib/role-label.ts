import type { TranslationKey } from "@edulink/i18n";

/**
 * A role's name in the person's language, from its code. The one place the phone builds a role's key (TA-327, testing
 * analysis of 13 November 2026): the dictionary's keys are the code's words joined in camel case, so EXAM_CONTROLLER is
 * role.examController, and a key built by lower-casing the code ("role.exam_controller") does not exist and showed
 * itself raw. A code the dictionary does not know is shown as it is.
 */
export function roleLabel(t: (key: TranslationKey) => string, role: string, plural = false): string {
  const r = role.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  // "support": owner-batch-item2a (27 Oct 2026), support staff.
  if (!["admin", "principal", "teacher", "student", "parent", "expert", "driver", "librarian", "warden", "alumnus", "faculty", "hod", "examController", "iqac", "tpo", "accounts", "recruiter", "support"].includes(r)) return role;
  return t(`role.${r}${plural ? "Plural" : ""}` as TranslationKey);
}
