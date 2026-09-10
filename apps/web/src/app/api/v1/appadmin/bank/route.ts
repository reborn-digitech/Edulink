import { contestBankSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { listBankTopics } from "@/lib/app-admin";
import { translationConfigured } from "@/lib/translate";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/bank — the practice bank's chapters and their question counts, the web's /appadmin/bank. */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    const topics = await listBankTopics(ctx);
    return ok(
      contestBankSchema.parse({
        translationOn: translationConfigured(),
        topics: topics.map((topic) => ({ id: topic.id, subject: topic.subject, classLevel: topic.classLevel, chapter: topic.chapter, name: topic.name, questionCount: topic.questionCount })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank");
  }
}
