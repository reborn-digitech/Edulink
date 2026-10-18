import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { listReferenceSources } from "@/lib/assistant/references";
import { PageHeader } from "@/components/ui/page-header";
import { ReferencesDesk } from "@/components/vidura-ops/references-desk";
import { ViduraOpsNav } from "@/components/vidura-ops/ops-nav";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("viduraOps.refTitle") };
}

/** Vidura's reference allow-list (pass 4): the public sources linked beside a Learning answer, and who sees the links. */
export default async function RootViduraReferencesPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const list = await listReferenceSources(session);
  return (
    <div className="space-y-5">
      <PageHeader title={t("viduraOps.refTitle")} description={t("viduraOps.refIntro")} />
      <ViduraOpsNav current="/root/vidura-references" t={t} />
      <ReferencesDesk initial={list} />
    </div>
  );
}
