import { AccessError } from "./tenancy";
import { db } from "./db"; // quiz-board (11 Oct 2026): the payee door reads what is owed
import { mayUse, type WhoLike } from "./platform-features";
import { FeatureOffError } from "./access-error";

/**
 * THE TEACHERS' QUESTION GIG, behind one switch (the owner, 10 October 2026): the generated bank is
 * reviewed by the app admins and the operator, and teachers no longer write or review questions for
 * the bank. Since 15 October 2026 the switch is the QUESTION_GIG PLATFORM FEATURE, switched by the
 * operator at /root/features and read at run time (src/lib/platform-features.ts `mayUse`); it was the
 * build-time QUESTION_GIG_FOR_TEACHERS in packages/contracts, which now only the help index's build
 * reads. While it is off:
 *
 *   - the web's nav drops /teacher/contributions (its entry carries `feature`) and its three pages
 *     answer 404;
 *   - the teacher's seven question doors (/api/v1/gigs/questions…) answer 404 FEATURE_OFF from the
 *     session's gate (the catalog's `feature`), and again here after the role check;
 *   - the payee door decides for itself (below);
 *   - the phone's menu drops the entry and its two screens show the generic screen (/api/v1/me's `features`).
 *
 * Nothing is deleted: src/lib/gig-questions.ts is untouched, the QuestionContribution rows stay, the
 * content team still reads them at /appadmin/contributions, and the operator still records payments.
 */
export async function questionGigOpen(who: WhoLike): Promise<boolean> {
  return mayUse("QUESTION_GIG", who);
}

/** For the doors and actions: 404 FEATURE_OFF while the gig is off. Call after the role check. */
export async function assertQuestionGigOpen(who: WhoLike): Promise<void> {
  if (!(await questionGigOpen(who))) throw new FeatureOffError("QUESTION_GIG", "quizReview.gigClosed");
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
  return (await questionGigOpen({ userId, schoolId: null })) || (await owedForQuestionsPaise(userId)) > 0;
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
