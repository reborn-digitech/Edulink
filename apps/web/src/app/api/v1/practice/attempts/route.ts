import { practiceBeganSchema, practiceBeginBodySchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listTopics, nextQuestion, normaliseLanguage, startAttempt } from "@/lib/quiz";
import { assignmentsForStudent } from "@/lib/practice-insights";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { servedQuestion } from "../_shared";

/**
 * POST /api/v1/practice/attempts — the web's topic page and its `begin`
 * action in one call: open a sitting on the chapter, or pick up the one left
 * open (startAttempt resumes rather than starting afresh, which is what keeps
 * a revealed solution from being quietly forgiven), and serve the question to
 * answer now. `assignmentId` opens a chapter the teacher set for one of the
 * pupil's classes, and the answer carries their standing against its target.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceBeginBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const language = parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale);

    let slug = parsed.data.slug ?? "";
    let assignment = null;
    if (parsed.data.assignmentId) {
      const set = (await assignmentsForStudent(ctx, language)).find((a) => a.id === parsed.data.assignmentId);
      if (!set) throw new AccessError("access.noSuchTopic", "NOT_FOUND");
      slug = set.topicSlug;
      assignment = {
        id: set.id,
        targetLevel: set.targetLevel,
        targetTierName: set.targetTierName,
        myLevel: set.myLevel,
        reached: set.reached,
        note: set.note,
        dueAt: set.dueAt ? set.dueAt.toISOString() : null,
      };
    }

    const topic = await db.quizTopic.findUnique({ where: { slug }, select: { slug: true, name: true, chapter: true, subject: true, classLevel: true } });
    if (!topic) throw new AccessError("access.noSuchTopic", "NOT_FOUND");
    const { attemptId } = await startAttempt(ctx, topic.slug);
    // The pupil's own progress, read through the same helper the list uses so the two never disagree about the rung.
    const [question, topics] = await Promise.all([nextQuestion(ctx, attemptId, language), listTopics(ctx, { language })]);
    const mine = topics.find((t) => t.slug === topic.slug);

    return ok(
      practiceBeganSchema.parse({
        attemptId,
        resumed: question !== null && question.askedCount > 0,
        topic: {
          slug: topic.slug,
          name: mine?.name ?? topic.name,
          chapter: topic.chapter,
          subject: topic.subject,
          classLevel: topic.classLevel,
          questionCount: mine?.questionCount ?? question?.totalCount ?? 0,
          level: mine?.level ?? 1,
          tierCount: mine?.tierCount ?? 0,
          badgeEarned: mine?.badgeEarned ?? false,
          completed: mine?.completed ?? false,
        },
        assignment,
        question: question ? servedQuestion(question) : null,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/practice/attempts");
  }
}
