/**
 * The Latin-to-Devanagari table moved to @edulink/i18n on 2026-10-01 so the
 * phone types with the same one; this path stays for the web's imports. The
 * package path, not its index: the index reaches the three dictionaries,
 * which a client component must never bundle.
 */
export * from "@edulink/i18n/transliterate";
