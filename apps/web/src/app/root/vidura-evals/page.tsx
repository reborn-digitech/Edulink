import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { panelEvals } from "@/lib/eval-jobs-desk";
import { PageHeader } from "@/components/ui/page-header";
import { EvalsCard } from "@/components/vidura-ops/evals-card";
import { ViduraOpsNav } from "@/components/vidura-ops/ops-nav";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("viduraOps.evalsTitle") };
}

/** Evaluation runs from the panel (Vidura pass 3): the harness's sets started and stopped like a generation run, the scores kept per run. */
export default async function RootViduraEvalsPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const state = await panelEvals(session);
  return (
    <div className="space-y-5">
      <PageHeader title={t("viduraOps.evalsTitle")} description={t("viduraOps.evalsIntro")} />
      <ViduraOpsNav current="/root/vidura-evals" t={t} />
      <EvalsCard initial={state} />
    </div>
  );
}
