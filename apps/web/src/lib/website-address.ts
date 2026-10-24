/**
 * A school's website, as the office's own form takes it (validation.ts
 * `schoolDetailsSchema`): an address that starts with http:// or https://.
 *
 * WRITTEN FOR QA-27 (24 Oct 2026). The operator's correction of a school stored
 * `javascript:alert(1)` as the website and "not an email" as the contact email,
 * because only the office's form carried the rule. The website is drawn as a
 * link on the families' school page and opened by the phone, so the rule is
 * kept on both sides: the operator's writes refuse anything else
 * (superuser.ts `checkSchoolContact`), and the pages draw a link only for an
 * http(s) address (`websiteHref`), whatever an older row holds.
 */
export const WEBSITE_ADDRESS = /^https?:\/\/[^\s]+\.[^\s]+$/;

/** Whether `value` is a website the office's form would take. */
export function isWebsiteAddress(value: string): boolean {
  return WEBSITE_ADDRESS.test(value.trim());
}

/** The address to put in an href, or null when it is not http(s) and must not be a link. */
export function websiteHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}
