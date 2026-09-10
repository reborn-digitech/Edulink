import { contestBankTopicSchema } from "@edulink/contracts";
import { AccessError, requireApiAppAdmin } from "@/lib/tenancy";
import { getBankTopic, listBankQuestions } from "@/lib/app-admin";
import { translationConfigured } from "@/lib/translate";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/bank/{topicId} — one chapter and every question in it, with the languages each exists in. */
export async function GET(_request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { topicId } = await params;
    const topic = await getBankTopic(ctx, topicId);
    if (!topic) throw new AccessError("appadmin.noSuchTopic", "NOT_FOUND");
    const questions = await listBankQuestions(ctx, topic.id);
    return ok(
      contestBankTopicSchema.parse({
        translationOn: translationConfigured(),
        topic: { id: topic.id, subject: topic.subject, classLevel: topic.classLevel, chapter: topic.chapter, name: topic.name },
        questions,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/[topicId]");
  }
}
