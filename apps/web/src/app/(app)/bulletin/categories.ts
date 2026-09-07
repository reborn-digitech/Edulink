import type { PostCategory } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The i18n key of each category's display name and one-line description.
 *
 * A plain data module, importable from server pages and client components
 * alike — the words themselves live in the dictionaries, and the stable keys
 * (PEOPLE, CAMPUS, …) live in `constants.ts`. The English hashtag forms a
 * GLOBAL post signs itself with are a third thing again, in `bulletin.ts`,
 * because hashtags are shared identifiers and deliberately do not translate.
 */
export const CATEGORY_KEYS: Record<PostCategory, { name: TranslationKey; hint: TranslationKey }> = {
  PEOPLE: { name: "bulletin.catPeople", hint: "bulletin.catPeopleHint" },
  CAMPUS: { name: "bulletin.catCampus", hint: "bulletin.catCampusHint" },
  EVENTS: { name: "bulletin.catEvents", hint: "bulletin.catEventsHint" },
  LEARNING: { name: "bulletin.catLearning", hint: "bulletin.catLearningHint" },
  UPDATES: { name: "bulletin.catUpdates", hint: "bulletin.catUpdatesHint" },
};
