import type { Metadata } from "next";
import { TagIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listHeads } from "@/lib/fees";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HeadList } from "./head-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeHeads") };
}

/** The lines a receipt is made of: tuition, transport, exams. The office's alone. */
export default async function FeeHeadsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const heads = await listHeads(ctx.schoolId, { includeRetired: true });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("fees.headsTitle")} description={t("fees.headsIntro")} back={{ href: "/admin/fees", label: t("fees.title") }} />
      <Card>
        <CardHeader icon={<TagIcon weight="duotone" className="size-5" />} title={t("fees.headsTitle")} />
        <CardBody>
          <HeadList heads={heads.map((h) => ({ id: h.id, name: h.name, code: h.code, kind: h.kind, sortOrder: h.sortOrder, retired: h.retiredAt !== null, inUse: h.inUse }))} />
        </CardBody>
      </Card>
    </div>
  );
}
