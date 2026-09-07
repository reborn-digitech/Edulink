/**
 * The language list now lives in `@edulink/i18n`, the workspace package the
 * mobile app will share. Every `@/lib/i18n/locales` import in the web app keeps
 * working through this re-export; new code may import the package directly.
 */
export * from "@edulink/i18n";
