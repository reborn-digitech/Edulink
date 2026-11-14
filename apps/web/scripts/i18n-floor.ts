/**
 * THE ONE I18N FLOOR (TA-468). CI asserts `npm run i18n -- --max "$I18N_FLOOR"` with the floor in
 * .github/workflows/battery.yml, and the local battery ran `npm run i18n` with no --max, so it passed whatever the
 * count. `npm run i18n -- --ci-floor` reads the same number from the workflow, so the two cannot drift apart.
 */

/** The I18N_FLOOR the battery workflow sets, or null when it sets none. */
export function ciI18nFloor(workflow: string): number | null {
  const match = /^\s*I18N_FLOOR:\s*"?(\d+)"?\s*$/m.exec(workflow);
  return match ? Number(match[1]) : null;
}
