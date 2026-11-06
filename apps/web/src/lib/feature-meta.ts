import type { FeatureCode } from "@edulink/contracts";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The words for each platform feature (15 Oct 2026; src/lib/platform-features.ts), as keys: its name, the one
 * line that says what it is, and the line its explaining count is shown in on the operator's page. Kept apart
 * from the library (which is server-only) so a client component can name a feature too.
 */
export const FEATURE_META: Record<FeatureCode, { nameKey: TranslationKey; whatKey: TranslationKey; countKey: TranslationKey }> = {
  ASSISTANT: { nameKey: "platformFeatures.assistantName", whatKey: "platformFeatures.assistantWhat", countKey: "platformFeatures.assistantCount" },
  QUESTION_BANK: { nameKey: "platformFeatures.questionBankName", whatKey: "platformFeatures.questionBankWhat", countKey: "platformFeatures.questionBankCount" },
  QUESTION_GIG: { nameKey: "platformFeatures.questionGigName", whatKey: "platformFeatures.questionGigWhat", countKey: "platformFeatures.questionGigCount" },
  EXPERT_SESSIONS: { nameKey: "platformFeatures.expertSessionsName", whatKey: "platformFeatures.expertSessionsWhat", countKey: "platformFeatures.expertSessionsCount" },
  TEACHER_SESSIONS: { nameKey: "platformFeatures.teacherSessionsName", whatKey: "platformFeatures.teacherSessionsWhat", countKey: "platformFeatures.teacherSessionsCount" },
  JOB_BOARD: { nameKey: "platformFeatures.jobBoardName", whatKey: "platformFeatures.jobBoardWhat", countKey: "platformFeatures.jobBoardCount" },
  TEXT_MESSAGING: { nameKey: "platformFeatures.textMessagingName", whatKey: "platformFeatures.textMessagingWhat", countKey: "platformFeatures.textMessagingCount" },
  // decision 0007 (6 Nov 2026): the competition marketplace; a school's own competitions are calendar events and never behind it.
  COMPETITIONS: { nameKey: "platformFeatures.competitionsName", whatKey: "platformFeatures.competitionsWhat", countKey: "platformFeatures.competitionsCount" },
};
