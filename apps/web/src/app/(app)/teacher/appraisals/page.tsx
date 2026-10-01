import type { Metadata } from "next";
import { NotebookIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { myAppraisals } from "@/lib/appraisal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { EntryView } from "../../principal/staff/[membershipId]/appraisal/appraisal-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("appraisal.myTitle") };
}

/** What the head has shown me: my observations, targets and appraisals marked visible, newest first. Read-only. */
export default async function MyAppraisalsPage() {
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const t = await getT();
  const { items } = await myAppraisals(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("appraisal.myTitle")} description={t("appraisal.myIntro")} />
      {items.length === 0 ? (
        <EmptyState icon={<NotebookIcon weight="duotone" className="size-8" />} title={t("appraisal.myEmpty")} description={t("appraisal.myEmptyBody")} />
      ) : (
        <Card>
          <CardHeader icon={<NotebookIcon weight="duotone" className="size-5" />} title={t("appraisal.timeline")} />
          <CardBody>
            <ol className="divide-y divide-border">
              {items.map((e) => (
                <li key={e.id} className="py-3">
                  <EntryView entry={e} canEdit={false} membershipId={e.staffMembershipId} />
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
