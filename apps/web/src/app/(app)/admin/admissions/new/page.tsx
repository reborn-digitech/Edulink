import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { cyclesView } from "@/lib/admissions";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { CycleEditor } from "../cycle-editor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admissions.newCycle") };
}

/** A new cycle, started on the current year. */
export default async function NewCyclePage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await cyclesView(ctx);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t("admissions.newCycle")}
        description={t("admissions.noCyclesBody")}
        back={{ href: "/admin/admissions", label: t("admissions.title") }}
      />
      <CycleEditor years={view.years} structures={view.structures} />
    </div>
  );
}
