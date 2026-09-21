import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { cyclesView } from "@/lib/admissions";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { WalkInForm } from "./walk-in-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admissions.walkIn") };
}

/** A family that came to the office with a paper form: the office writes the application for them, on an open cycle. */
export default async function WalkInPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await cyclesView(ctx);
  const open = view.cycles
    .filter((c) => c.status === "OPEN")
    .map((c) => ({
      id: c.id,
      name: c.name,
      year: c.academicYearName,
      grades: c.grades.map((g) => g.grade),
    }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t("admissions.walkIn")}
        description={t("admissions.walkInIntro")}
        back={{
          href: "/admin/admissions/applications",
          label: t("admissions.pipelineTitle"),
        }}
      />
      {open.length === 0 ? (
        <EmptyState
          title={t("admissions.noCycles")}
          description={t("admissions.refuseClosed")}
          action={
            <Button asChild size="sm">
              <Link href="/admin/admissions">{t("admissions.title")}</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardBody className="pt-5">
            <WalkInForm cycles={open} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
