import { contributionTopics } from "@/lib/gig-questions";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import type { ActiveContext } from "@/lib/session";

/** The chapters for the form's select, grouped by subject and named with their class. */
export async function topicOptions(ctx: ActiveContext): Promise<{ id: string; label: string; group: string }[]> {
  const t = await getT();
  return (await contributionTopics(ctx)).map((topic) => ({
    id: topic.id,
    group: SUBJECT_KEY[topic.subject as QuizSubject] ? t(SUBJECT_KEY[topic.subject as QuizSubject]) : topic.subject,
    label: [t("appadmin.classN", { n: topic.classLevel }), topic.name].join(" · "),
  }));
}
