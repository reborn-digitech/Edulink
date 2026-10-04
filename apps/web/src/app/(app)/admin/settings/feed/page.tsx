import type { Metadata } from "next";
import { GlobeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { globalFeedKinds } from "@/lib/college-profile";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FeedKindsForm } from "./kinds-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("feedKinds.title") };
}

/**
 * The global feed's settings (4 Oct 2026): whose shared posts this
 * institution's people read — schools', colleges' or both. The admin
 * chooses; the head reads. A school's own hides stay on each post.
 */
export default async function FeedSettingsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { choice } = await globalFeedKinds(ctx);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("feedKinds.title")} description={t("feedKinds.intro")} />
      <Card>
        <CardHeader icon={<GlobeIcon weight="duotone" className="size-5" />} title={t("feedKinds.cardTitle")} description={t("feedKinds.cardBody")} />
        <CardBody>
          <FeedKindsForm choice={choice} canWrite={ctx.role === "ADMIN"} />
        </CardBody>
      </Card>
    </div>
  );
}
