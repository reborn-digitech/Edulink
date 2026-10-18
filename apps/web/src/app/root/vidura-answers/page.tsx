import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { listStandardAnswers } from "@/lib/assistant/standard";
import { PageHeader } from "@/components/ui/page-header";
import { AnswersDesk } from "@/components/vidura-ops/answers-desk";
import { ViduraOpsNav } from "@/components/vidura-ops/ops-nav";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("viduraOps.answersTitle") };
}

/** Standard answers for the common how-to questions (Vidura pass 3): ask as a role, mark, revoke, with their hits. */
export default async function RootViduraAnswersPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const answers = await listStandardAnswers(session);
  return (
    <div className="space-y-5">
      <PageHeader title={t("viduraOps.answersTitle")} description={t("viduraOps.answersIntro")} />
      <ViduraOpsNav current="/root/vidura-answers" t={t} />
      <AnswersDesk initial={answers} />
    </div>
  );
}
