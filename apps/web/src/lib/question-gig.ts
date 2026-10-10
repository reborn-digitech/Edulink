import { QUESTION_GIG_FOR_TEACHERS } from "@edulink/contracts";
import { AccessError } from "./tenancy";
import { db } from "./db"; // quiz-board (11 Oct 2026): the payee door reads what is owed

/**
 * THE TEACHERS' QUESTION GIG, behind one switch (the owner, 10 October 2026): the generated bank is
 * reviewed by the app admins and the operator, and teachers no longer write or review questions for
 * the bank. QUESTION_GIG_FOR_TEACHERS lives in packages/contracts so the web and the phone read the
 * same value. While it is false:
 *
 *   - the web's nav drops /teacher/contributions (src/lib/nav.ts) and its three pages answer 404;
 *   - the teacher's eight doors (/api/v1/gigs/questions…, /api/v1/gigs/payee) answer 404 AFTER the
 *     role check, so a signed-out caller is still a 401 and another role still a 403 (the catalog's
 *     statusByRole says TEACHER 404 for the sweep);
 *   - the phone's menu drops the entry and its two screens show the generic screen.
 *
 * Nothing is deleted: src/lib/gig-questions.ts is untouched, the QuestionContribution rows stay, the
 * content team still reads them at /appadmin/contributions, and the operator still records payments.
 */
export function questionGigOpen(): boolean {
  return QUESTION_GIG_FOR_TEACHERS;
}

/** For the doors: a 404 while the gig is off. Call after the role check. */
export function assertQuestionGigOpen(): void {
  if (!QUESTION_GIG_FOR_TEACHERS) throw new AccessError("quizReview.gigClosed", "NOT_FOUND");
}

/* ---- quiz-board (11 October 2026): the payee door stays open for a teacher still owed money ---- */

/**
 * What a teacher is still owed for questions the bank took while the gig was open: earnings not yet
 * paid (the operator records each payment against the saved payee, src/lib/gig-questions.ts). The same
 * sum as the gig page's "Earned, not yet paid".
 */
export async function owedForQuestionsPaise(userId: string): Promise<number> {
  const due = await db.gigEarning.aggregate({ where: { userId, paymentId: null, amountPaise: { gt: 0 } }, _sum: { amountPaise: true } });
  return due._sum.amountPaise ?? 0;
}

/**
 * THE ONE DOOR THE CLOSED GIG KEEPS: where a teacher is paid (POST /api/v1/gigs/payee, the
 * /teacher/payee page and its form). With the gig off, a teacher still owed money for earlier questions
 * must be able to correct their UPI id before the operator pays it; anyone else gets the gig's 404.
 */
export async function payeeDoorOpen(userId: string): Promise<boolean> {
  return QUESTION_GIG_FOR_TEACHERS || (await owedForQuestionsPaise(userId)) > 0;
}

/** For the payee door and its action: a 404 unless the gig is open or the teacher is owed money. Call after the role check. */
export async function assertPayeeDoorOpen(userId: string): Promise<void> {
  if (!(await payeeDoorOpen(userId))) throw new AccessError("quizReview.gigClosed", "NOT_FOUND");
}

/** The teacher's saved payee, for the page. */
export async function savedPayee(userId: string): Promise<{ upiId: string; payeeName: string } | null> {
  return db.gigPayee.findUnique({ where: { userId }, select: { upiId: true, payeeName: true } });
}
/* ---- end quiz-board ---- */
