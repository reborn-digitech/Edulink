import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardTextIcon,
  DoorOpenIcon,
  PlusIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { cyclesView } from "@/lib/admissions";
import { formatDateKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import {
  CYCLE_STATUS_KEY,
  CYCLE_STATUS_TONE,
} from "@/components/admissions/labels";
import { CycleRowActions } from "./cycle-row-actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admissions.metaTitle") };
}

/**
 * The office's admission cycles: one card each with the grades it takes,
 * the seats in each and how many applications stand at every stage. The
 * door is opened and closed from here; a closed cycle can shed the forms of
 * the families it did not admit.
 */
export default async function AdmissionsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await cyclesView(ctx);
  // Designing a cycle and deleting families' forms are the admin's; the head opens, closes and decides.
  const canSetUp = ctx.role === "ADMIN";
  const columns = [
    t("admissions.grade"),
    t("admissions.seats"),
    t("admissions.applied"),
    t("admissions.offeredCount"),
    t("admissions.acceptedCount"),
    t("admissions.admittedCount"),
    t("admissions.waitlistedCount"),
    t("admissions.remaining"),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admissions.title")}
        description={t("admissions.intro")}
        actions={
          <span className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="secondary"
              size="sm"
              icon={<ClipboardTextIcon weight="bold" />}
            >
              <Link href="/admin/admissions/applications">
                {t("admissions.pipelineTitle")}
              </Link>
            </Button>
            {canSetUp && (
              <Button asChild size="sm" icon={<PlusIcon weight="bold" />}>
                <Link href="/admin/admissions/new">
                  {t("admissions.newCycle")}
                </Link>
              </Button>
            )}
          </span>
        }
      />

      {view.cycles.length === 0 ? (
        <EmptyState
          icon={<DoorOpenIcon weight="duotone" className="size-6" />}
          title={t("admissions.noCycles")}
          description={t("admissions.noCyclesBody")}
          action={
            canSetUp ? (
              <Button asChild size="sm" icon={<PlusIcon weight="bold" />}>
                <Link href="/admin/admissions/new">
                  {t("admissions.newCycle")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4" data-testid="admission-cycles">
          {view.cycles.map((cycle) => (
            <li key={cycle.id}>
              <Card>
                <CardHeader
                  icon={<DoorOpenIcon weight="duotone" className="size-5" />}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/admissions/${cycle.id}`}
                        className="hover:underline"
                      >
                        {cycle.name}
                      </Link>
                      <Badge tone={CYCLE_STATUS_TONE[cycle.status]} size="sm">
                        {t(CYCLE_STATUS_KEY[cycle.status])}
                      </Badge>
                    </span>
                  }
                  description={[
                    cycle.academicYearName,
                    cycle.opensAt
                      ? `${t("admissions.opensAt")}: ${formatDateKey(cycle.opensAt)}`
                      : null,
                    cycle.closesAt
                      ? t("admissions.closesOn", {
                          date: formatDateKey(cycle.closesAt),
                        })
                      : null,
                    cycle.testRequired ? t("admissions.testRequired") : null,
                    cycle.feeStructureName
                      ? `${t("admissions.feeStructure")}: ${cycle.feeStructureName}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  action={
                    <CycleRowActions
                      cycleId={cycle.id}
                      status={cycle.status}
                      name={cycle.name}
                      canPurge={canSetUp}
                    />
                  }
                />
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
                          {columns.map((c) => (
                            <th
                              key={c}
                              scope="col"
                              className="py-1.5 pr-3 font-medium first:pl-0"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cycle.seats.map((row) => (
                          <tr key={row.grade} className="tabular-nums">
                            <td className="py-2 pr-3 font-semibold text-fg">
                              {row.grade}
                            </td>
                            <td className="py-2 pr-3">{row.seats}</td>
                            <td className="py-2 pr-3">{row.applied}</td>
                            <td className="py-2 pr-3">{row.offered}</td>
                            <td className="py-2 pr-3">{row.accepted}</td>
                            <td className="py-2 pr-3">{row.admitted}</td>
                            <td className="py-2 pr-3">{row.waitlisted}</td>
                            <td className="py-2 pr-3 font-semibold text-fg">
                              {Math.max(0, row.seats - row.admitted)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {cycle.documents.length > 0 && (
                    <p className="mt-3 text-xs text-fg-muted">
                      {t("admissions.documentsAsked", {
                        names: cycle.documents.map((d) => d.name).join(", "),
                      })}
                    </p>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
