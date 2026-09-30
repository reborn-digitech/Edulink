import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import { requireRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { classFeeRoster, getStructure, listHeads } from "@/lib/fees";
import { formatDateKey, todayKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StructureEditor } from "../editor";
import { StructureButtons } from "./structure-buttons";
import { AssignCard } from "./assign-card";
import { pupilHref } from "../../labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeStructure") };
}

/**
 * One structure. A DRAFT is the editor; a PUBLISHED one is the frozen table
 * with the assign card beside it, and the note says why it cannot change.
 * `?classId` draws that class's roster underneath: who is on what, and how
 * they stand.
 */
export default async function StructurePage({ params, searchParams }: { params: Promise<{ structureId: string }>; searchParams: Promise<{ classId?: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const { structureId } = await params;
  const { classId } = await searchParams;
  const money = (paise: number) => formatPaise(paise, locale);

  let s;
  try {
    s = await getStructure(ctx, structureId);
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const draft = !s.publishedAt && !s.archivedAt;
  const [heads, classes] = await Promise.all([
    draft && office ? listHeads(ctx.schoolId) : [],
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true, name: true, gradeLevel: true }, orderBy: { name: "asc" } }),
  ]);
  const roster = classId && classes.some((c) => c.id === classId) ? await classFeeRoster(ctx, classId, today) : null;

  const status = s.archivedAt ? (
    <Badge tone="neutral">{t("fees.structureArchived")}</Badge>
  ) : s.publishedAt ? (
    <Badge tone="ok">{t("fees.structurePublished")}</Badge>
  ) : (
    <Badge tone="warn">{t("fees.structureDraft")}</Badge>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        meta={status}
        description={[s.gradeLevel ?? t("fees.structureAllGrades"), s.yearName, [t("fees.structureTotal"), money(s.totalPaise)].join(" "), [t("fees.structurePupils"), s.pupils].join(" ")].join(" · ")}
        back={{ href: "/admin/fees/structures", label: t("fees.structuresTitle") }}
        actions={office ? <StructureButtons structureId={s.id} published={Boolean(s.publishedAt)} archived={Boolean(s.archivedAt)} /> : undefined}
      />

      {draft && office ? (
        <Card>
          <CardBody className="pt-5">
            <StructureEditor
              structureId={s.id}
              initial={{
                name: s.name,
                gradeLevel: s.gradeLevel ?? "",
                instalments: s.instalmentRows.map((i) => ({ label: i.label, dueDateKey: i.dueDateKey, lines: i.lines.map((l) => ({ headId: l.headId, amount: String(l.amountPaise / 100) })) })),
              }}
              heads={heads.map((h) => ({ id: h.id, name: h.name, code: h.code }))}
              todayKey={today}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={t("fees.structureInstalments")}
            description={
              s.publishedAt ? (
                <>
                  {t("fees.structureFrozenNote")}
                  {s.paidDemands > 0 && <> {t("fees.structurePaidNote", { count: s.paidDemands })}</>}
                </>
              ) : undefined
            }
          />
          <CardBody>
            <ol className="divide-y divide-border">
              {s.instalmentRows.map((i) => (
                <li key={i.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-fg">{i.label}</span>
                    <span className="text-sm text-fg-muted">
                      {t("fees.structureDueDate")} {formatDateKey(i.dueDateKey, { day: "numeric", month: "short", year: "numeric" }, locale)} ·{" "}
                      <strong className="tabular-nums text-fg">{money(i.totalPaise)}</strong>
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-fg-muted">
                    {i.lines.map((l) => (
                      <li key={l.id} className="flex justify-between gap-3">
                        <span>
                          {l.headName} <span className="font-mono text-xs">{l.headCode}</span>
                        </span>
                        <span className="tabular-nums">{money(l.amountPaise)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      {office && s.publishedAt && !s.archivedAt && (
        <Card>
          <CardHeader title={t("fees.assignTitle")} />
          <CardBody>
            <AssignCard structureId={s.id} classes={classes} selectedClassId={classId ?? null} />
          </CardBody>
        </Card>
      )}

      {roster && (
        <Card>
          <CardHeader title={roster.klass.name} description={roster.year?.name} />
          <CardBody>
            {roster.pupils.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-muted">{t("fees.duesEmpty")}</p>
            ) : (
              <div className="overflow-x-auto" tabIndex={0}>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">{t("fees.duesColPupil")}</th>
                      <th className="py-2 pr-3 font-medium">{t("fees.pupilPlan")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.duesColDue")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.duesColPaid")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.duesColOutstanding")}</th>
                      <th className="py-2 text-right font-medium">{t("fees.duesColOverdue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {roster.pupils.map((p) => (
                      <tr key={p.studentMembershipId}>
                        <td className="py-2 pr-3">
                          <Link href={pupilHref(p.studentMembershipId)} className="font-medium text-fg hover:underline">
                            {p.name}
                          </Link>
                          {p.studentCode && <span className="ml-2 text-xs text-fg-muted">{p.studentCode}</span>}
                        </td>
                        <td className="py-2 pr-3">{p.structureId === s.id ? <Badge tone="ok" size="sm">{p.structureName}</Badge> : p.structureName ? <Badge tone="neutral" size="sm">{p.structureName}</Badge> : <span className="text-fg-muted">—</span>}</td>
                        <td className="py-2 pr-3 text-right">{money(p.netPaise)}</td>
                        <td className="py-2 pr-3 text-right text-ok">{money(p.paidPaise)}</td>
                        <td className="py-2 pr-3 text-right">{money(p.outstandingPaise)}</td>
                        <td className={`py-2 text-right ${p.overduePaise > 0 ? "text-danger" : ""}`}>{money(p.overduePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
