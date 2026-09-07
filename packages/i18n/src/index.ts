/**
 * @edulink/i18n — what both the web app and the mobile app say, in one place.
 *
 * The language list, the three dictionaries (en, hi, mr — one nested object
 * each, ~5,000 keys) and the translator core. The dictionaries are exported
 * by path (@edulink/i18n/en …) so a bundle takes only the language it asks
 * for; the web folds English under the reader's language on the server, the
 * phone does the same in memory once per language (see ./dictionaries).
 */
export * from "./locales";
export * from "./core";
export { dictionaryFor, DICTIONARIES } from "./dictionaries";
