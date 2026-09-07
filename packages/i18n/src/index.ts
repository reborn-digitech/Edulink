/**
 * @edulink/i18n — what both the web app and the mobile app say, in one place.
 *
 * Phase 0 moves the language list here and nothing else: it is the smallest
 * seam that proves a workspace package builds into Next, vitest, tsx and tsc.
 * The dictionaries (en/hi/mr) and the translator follow in Phase 2, once the
 * i18n audit has been taught to read them from this package.
 */
export * from "./locales";
