import type { TranslationKey } from "@edulink/i18n";

/**
 * The exam cell's coded words on the phone (module EXAMS, 4 Oct 2026), as the
 * web's components/exam-cell/parts.tsx says them.
 */
export const FORM_STATUS_KEY: Record<string, TranslationKey> = { DRAFT: "examCell.formDRAFT", SUBMITTED: "examCell.formSUBMITTED", APPROVED: "examCell.formAPPROVED", REFUSED: "examCell.formREFUSED" };
export const RESULT_KEY: Record<string, TranslationKey> = { PASS: "examCell.resultPASS", FAIL: "examCell.resultFAIL", ATKT: "examCell.resultATKT", ABSENT: "examCell.resultABSENT" };
export const CLASS_KEY: Record<string, TranslationKey> = { DISTINCTION: "examCell.classDISTINCTION", FIRST: "examCell.classFIRST", HIGHER_SECOND: "examCell.classHIGHER_SECOND", SECOND: "examCell.classSECOND", PASS: "examCell.classPASS" };
export const DOC_KIND_KEY: Record<string, TranslationKey> = { GRADE_CARD: "examCell.docGradeCard", TRANSCRIPT: "examCell.docTranscript", DEGREE: "examCell.docDegree" };
export const REVAL_KIND_KEY: Record<string, TranslationKey> = { PHOTOCOPY: "examCell.revalPHOTOCOPY", REVAL: "examCell.revalREVAL" };
export const REVAL_OUTCOME_KEY: Record<string, TranslationKey> = { PROVIDED: "examCell.outcomePROVIDED", UNCHANGED: "examCell.outcomeUNCHANGED", CHANGED: "examCell.outcomeCHANGED" };
export const BACKLOG_KEY: Record<string, TranslationKey> = { OPEN: "examCell.backlogOPEN", CLEARED: "examCell.backlogCLEARED", LAPSED: "examCell.backlogLAPSED" };
export const CREDIT_KEY: Record<string, TranslationKey> = { PENDING: "examCell.creditPENDING", SENT: "examCell.creditSENT", FAILED: "examCell.creditFAILED" };
export const SESSION_STATUS_KEY: Record<string, TranslationKey> = { DRAFT: "examCell.statusDRAFT", FORMS: "examCell.statusFORMS", CONDUCT: "examCell.statusCONDUCT", ASSESSMENT: "examCell.statusASSESSMENT", PUBLISHED: "examCell.statusPUBLISHED", CLOSED: "examCell.statusCLOSED" };
export const DUTY_KEY: Record<string, TranslationKey> = { ASSIGNED: "examCell.dutyASSIGNED", SWAPPED: "examCell.dutySWAPPED", DONE: "examCell.dutyDONE" };
export const PAPER_KEY: Record<string, TranslationKey> = { ASSIGNED: "examCell.paperASSIGNED", SUBMITTED: "examCell.paperSUBMITTED", MODERATED: "examCell.paperMODERATED" };
export const PAY_KEY: Record<string, TranslationKey> = { SETTER: "examCell.payKindSETTER", MODERATOR: "examCell.payKindMODERATOR", INVIGILATOR: "examCell.payKindINVIGILATOR", ASSESSOR: "examCell.payKindASSESSOR" };

/** Thousandths as marks: 45500 → "45.5". */
export const marks = (milli: number | null | undefined) => (milli === null || milli === undefined ? "—" : String(Math.round(milli) / 1000));
