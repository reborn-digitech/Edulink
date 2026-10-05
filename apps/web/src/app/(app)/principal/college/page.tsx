import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BankIcon,
  BriefcaseIcon,
  ChalkboardTeacherIcon,
  ChartLineUpIcon,
  CheckSquareIcon,
  GaugeIcon,
  GraduationCapIcon,
  MedalIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf } from "@/lib/modules";
import { principalCollege, type ApprovalLine } from "@/lib/college-principal";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { TableScroll } from "@/components/ui/table-scroll";
import { StreamHome } from "@/components/college/stream-home";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("collegeHub.title") };
}

const APPROVAL_KEY: Record<ApprovalLine["key"], TranslationKey> = {
  leave: "collegeHub.approvalLeave",
  condonation: "collegeHub.approvalCondonation",
  concession: "collegeHub.approvalConcession",
  grace: "collegeHub.approvalGrace",
  lateRegistration: "collegeHub.approvalLate",
  signoff: "collegeHub.approvalSignoff",
  payroll: "collegeHub.approvalPayroll",
  refundException: "collegeDesks.approvalRefund",
  expulsion: "collegeDesks.approvalExpulsion",
};

/**
 * The principal's college (the integration builder, 4 Oct 2026): the college
 * at a glance, what waits for the head's word, results and outcomes, faculty,
 * governance, placements and alumni, money and the accreditation file. Every
 * figure comes from the owning module's function (lib/college-principal.ts);
 * a module the college has not switched on is a missing card, not an error.
 * The head reads; each decision is made on its module's page, linked here.
 */
export default async function PrincipalCollegePage() {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const c = await principalCollege(ctx);
  const money = (p: number) => formatPaise(p, locale);
  const waiting = c.approvals.filter((a) => a.count > 0);
  const g = c.glance;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("collegeHub.title")}
        description={[c.school.name, c.school.affiliatingUniversity, c.term ? c.term.name : t("collegeHub.noTerm")].filter(Boolean).join(" · ")}
      />

      {/* The college's streams, its tiles in their order and what is not built yet (5 Oct 2026); the head's, so the office reads its own on /admin. */}
      {ctx.role === "PRINCIPAL" && <StreamHome schoolId={ctx.schoolId} role="PRINCIPAL" t={t} />}

      {/* ---------------- what waits for the head ---------------- */}
      <Card>
        <CardHeader icon={<CheckSquareIcon weight="duotone" className="size-5" />} title={t("collegeHub.approvalsTitle")} description={t("collegeHub.approvalsBody")} />
        <CardBody>
          {waiting.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("collegeHub.approvalsNone")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {waiting.map((a) => (
                <li key={a.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>{t(APPROVAL_KEY[a.key], { count: a.count })}</span>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={a.href}>{t("collegeHub.decide")}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---------------- the college at a glance ---------------- */}
      <section aria-labelledby="glance" className="space-y-3">
        <h2 id="glance" className="text-base font-semibold text-fg">{t("collegeHub.glanceTitle", { date: c.today })}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {g.faculty ? (
            <StatTile
              icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
              label={t("collegeHub.facultyPresent")}
              value={g.faculty.closed ? "—" : t("collegeHub.ofTotal", { n: g.faculty.present, total: g.faculty.total })}
              hint={g.faculty.closed ? t("collegeHub.closedToday") : t("collegeHub.facultyHint", { leave: g.faculty.onLeave, absent: g.faculty.absent, unmarked: g.faculty.unmarked })}
            />
          ) : null}
          {g.fees ? (
            <StatTile
              icon={<BankIcon weight="duotone" className="size-5" />}
              label={t("collegeHub.feesCollected", { year: g.fees.year ?? "—" })}
              value={money(g.fees.collectedPaise)}
              hint={t("collegeHub.feesHint", { demand: money(g.fees.demandPaise), outstanding: money(g.fees.outstandingPaise), defaulters: g.fees.defaulters })}
              tone={g.fees.outstandingPaise > 0 ? "warn" : "ok"}
            />
          ) : null}
          {g.scholarships ? (
            <StatTile
              icon={<GraduationCapIcon weight="duotone" className="size-5" />}
              label={t("collegeHub.scholarships")}
              value={money(g.scholarships.disbursedPaise)}
              hint={t("collegeHub.scholarshipsHint", { applied: g.scholarships.applied, sanctioned: g.scholarships.sanctioned, disbursed: g.scholarships.disbursed, sanctionedAmount: money(g.scholarships.sanctionedPaise) })}
            />
          ) : null}
          {g.hostel ? (
            <StatTile icon={<UsersThreeIcon weight="duotone" className="size-5" />} label={t("collegeHub.hostel")} value={`${g.hostel.occupancyPercent} %`} hint={t("collegeHub.hostelHint", { occupied: g.hostel.occupied, beds: g.hostel.beds })} />
          ) : null}
          {g.grievances ? (
            <StatTile icon={<CheckSquareIcon weight="duotone" className="size-5" />} label={t("collegeHub.grievances")} value={String(g.grievances.open)} hint={t("collegeHub.grievancesHint", { overdue: g.grievances.overdue })} tone={g.grievances.overdue > 0 ? "danger" : "neutral"} />
          ) : null}
          {g.incidentsOpen !== null ? <StatTile icon={<CheckSquareIcon weight="duotone" className="size-5" />} label={t("collegeHub.incidents")} value={String(g.incidentsOpen)} /> : null}
          {g.predictor?.cycle ? (
            <StatTile
              icon={<MedalIcon weight="duotone" className="size-5" />}
              label={t("collegeHub.predictor")}
              value={g.predictor.cycle.cgpa === null ? "—" : `${g.predictor.cycle.cgpa.toFixed(2)} · ${g.predictor.cycle.grade ?? "—"}`}
              hint={g.predictor.nextBand ? t("collegeHub.nextBand", { grade: g.predictor.nextBand.grade, distance: g.predictor.nextBand.distance.toFixed(2) }) : t("collegeHub.notAScore")}
              tone="accent"
            />
          ) : null}
          {g.nirf ? <StatTile icon={<GaugeIcon weight="duotone" className="size-5" />} label={t("collegeHub.nirf")} value={g.nirf.partial.toFixed(2)} hint={t("collegeHub.nirfHint", { covered: g.nirf.coveredMarks })} /> : null}
        </div>
        <Card>
          <CardHeader title={t("collegeHub.lecturesTitle")} description={t("collegeHub.lecturesBody")} />
          <CardBody>
            {g.lectures.every((d) => d.lectures === 0) ? (
              <p className="text-sm text-fg-muted">{t("collegeHub.lecturesNone")}</p>
            ) : (
              <TableScroll>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={TH}>{t("collegeHub.department")}</th>
                      <th className={TH}>{t("collegeHub.lecturesMarked")}</th>
                      <th className={TH}>{t("collegeHub.presentPercent")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.lectures.map((d) => (
                      <tr key={d.departmentId} className="border-t border-border">
                        <td className={TD}>{d.name}</td>
                        <td className={NUM}>{t("collegeHub.ofTotal", { n: d.marked, total: d.lectures })}</td>
                        <td className={NUM}>{d.presentPercent === null ? "—" : `${d.presentPercent} %`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </CardBody>
        </Card>
        {g.predictor && g.predictor.cheapest.length > 0 ? (
          <Card>
            <CardHeader icon={<MedalIcon weight="duotone" className="size-5" />} title={t("collegeHub.cheapestTitle")} description={t("collegeHub.notAScore")} action={<Button asChild size="sm" variant="secondary"><Link href="/iqac/predictor">{t("collegeHub.openPredictor")}</Link></Button>} />
            <CardBody>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {g.predictor.cheapest.map((m) => (
                  <li key={m.code}>
                    <span className="font-medium">{m.code}</span> {m.text} <span className="text-fg-muted">· {t("collegeHub.gainPer", { gain: m.gainPerUnit.toFixed(3), unit: m.unit })}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        ) : null}
      </section>

      {/* ---------------- results and outcomes ---------------- */}
      <Card>
        <CardHeader icon={<ChartLineUpIcon weight="duotone" className="size-5" />} title={t("collegeHub.resultsTitle")} description={c.results.termName ? t("collegeHub.resultsBody", { term: c.results.termName }) : t("collegeHub.resultsNone")} action={c.modules.includes("EXAMS") ? <Button asChild size="sm" variant="secondary"><Link href="/exam-cell/analytics">{t("collegeHub.openAnalytics")}</Link></Button> : undefined} />
        <CardBody className="space-y-4">
          {c.results.byDepartment.length > 0 ? (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("collegeHub.department")}</th>
                    <th className={TH}>{t("collegeHub.passRate")}</th>
                    <th className={TH}>{t("collegeHub.backlogs")}</th>
                    <th className={TH}>{t("collegeHub.toppers")}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.results.byDepartment.map((d) => (
                    <tr key={d.departmentId} className="border-t border-border">
                      <td className={TD}>{d.name}</td>
                      <td className={NUM}>{d.appeared ? t("collegeHub.passRateLine", { passed: d.passed, appeared: d.appeared, rate: d.passRatePercent }) : "—"}</td>
                      <td className={NUM}>{d.openBacklogs}</td>
                      <td className={TD}>{d.toppers.slice(0, 3).map((x) => t("collegeHub.topperOne", { name: x.name, sgpa: x.sgpa.toFixed(2) })).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          ) : null}
          {c.results.analytics?.firstYear.appeared ? (
            <p className="text-sm text-fg-muted">{t("collegeHub.firstYear", { appeared: c.results.analytics.firstYear.appeared, api: c.results.analytics.firstYear.api ?? "—", success: c.results.analytics.firstYear.successRatePercent ?? "—" })}</p>
          ) : null}
          {c.results.analytics && c.results.analytics.trend.length > 1 ? (
            <p className="text-sm text-fg-muted">{t("collegeHub.trend", { list: c.results.analytics.trend.map((x) => `${x.sessionName} ${x.passRatePercent} %`).join(" · ") })}</p>
          ) : null}
          <div>
            <h3 className="mb-1 text-sm font-semibold">{t("collegeHub.attainmentTitle")}</h3>
            {c.results.attainment.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("collegeHub.attainmentNone")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {c.results.attainment.map((a) => (
                  <li key={a.offeringId}>
                    <span className="font-medium">{a.code}</span>{" "}
                    <span className="text-fg-muted">{a.pos.length ? a.pos.map((p) => `${p.code} ${p.attainment ?? "—"}`).join(" · ") : t("collegeHub.attainmentCosOnly", { n: a.cos.length })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ---------------- faculty ---------------- */}
      <Card>
        <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("collegeHub.facultyTitle")} description={t("collegeHub.facultyBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/principal/staff">{t("collegeHub.openStaff")}</Link></Button>} />
        <CardBody className="space-y-3 text-sm">
          {c.faculty.ratios.length === 0 ? <p className="text-fg-muted">{t("collegeHub.ratiosNone")}</p> : null}
          <ul className="space-y-1">
            {c.faculty.ratios.map((r) => (
              <li key={r.departmentId} className="flex flex-wrap items-center justify-between gap-2">
                <span>{r.name}</span>
                <span className="flex items-center gap-2 text-fg-muted">
                  {t("collegeHub.ratioLine", { students: r.students, faculty: r.faculty, per: r.perFaculty ?? "—" })}
                  <Badge tone={r.withinNorm ? "ok" : "warn"}>{t(r.withinNorm ? "collegeHub.withinNorm" : "collegeHub.overNorm", { norm: r.norm })}</Badge>
                </span>
              </li>
            ))}
          </ul>
          {c.faculty.load.length ? (
            <p className="text-fg-muted">{t("collegeHub.loadLine", { over: c.faculty.load.filter((l) => l.state === "OVER").length, under: c.faculty.load.filter((l) => l.state === "UNDER").length, total: c.faculty.load.length })}</p>
          ) : null}
          {c.faculty.research ? <p className="text-fg-muted">{t("collegeHub.researchLine", { items: c.faculty.research.items, activities: c.faculty.research.activities })}</p> : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- governance ---------------- */}
        <Card>
          <CardHeader title={t("collegeHub.governanceTitle")} description={t("collegeHub.governanceBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/principal/decisions">{t("collegeHub.openDecisions")}</Link></Button>} />
          <CardBody>
            {!c.governance.committees || c.governance.committees.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("collegeHub.committeesNone")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {c.governance.committees.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3">
                    <span>{m.name}</span>
                    <span className="text-fg-muted">{m.meetings[0] ? t("collegeHub.lastMet", { date: String(m.meetings[0].at).slice(0, 10) }) : t("collegeHub.neverMet")}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm">
              <Link className={LINK} href="/admin/committees">{t("collegeHub.openCommittees")}</Link>
            </p>
          </CardBody>
        </Card>

        {/* ---------------- placements and alumni ---------------- */}
        <Card>
          <CardHeader icon={<BriefcaseIcon weight="duotone" className="size-5" />} title={t("collegeHub.placementTitle")} />
          <CardBody className="space-y-1 text-sm">
            {c.placement?.on ? (
              <p>{t("collegeHub.placementLine", { batch: c.placement.batchYear ?? "—", placed: c.placement.placed, finalYear: c.placement.finalYear, pct: c.placement.placedPct ?? "—", open: c.placement.drivesOpen, offers: c.placement.offers })}</p>
            ) : (
              <p className="text-fg-muted">{t("collegeHub.placementOff")}</p>
            )}
            {c.alumni ? <p className="text-fg-muted">{t("collegeHub.alumniLine", { total: c.alumni.total, mentors: c.alumni.mentors, listed: c.alumni.listed, gifts: c.alumni.gifts, meets: c.alumni.meets })}</p> : null}
            <p className="flex flex-wrap gap-3">
              {c.placement?.on ? <Link className={LINK} href="/placement">{t("collegeHub.openPlacement")}</Link> : null}
              {c.alumni ? <Link className={LINK} href="/admin/alumni/college">{t("collegeHub.openAlumni")}</Link> : null}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* ---------------- money ---------------- */}
      <Card>
        <CardHeader icon={<BankIcon weight="duotone" className="size-5" />} title={t("collegeHub.moneyTitle")} description={t("collegeHub.moneyBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/accounts">{t("collegeHub.openAccounts")}</Link></Button>} />
        <CardBody className="space-y-3">
          {c.money.finance.length === 0 ? (
            <EmptyState title={t("collegeHub.financeNone")} description={t("collegeHub.moneyBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/accounts">{t("collegeHub.openAccounts")}</Link></Button>} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("collegeHub.year")}</th>
                    <th className={TH}>{t("collegeHub.feesDemanded")}</th>
                    <th className={TH}>{t("collegeHub.feesReceived")}</th>
                    <th className={TH}>{t("collegeHub.scholarshipsReceived")}</th>
                    <th className={TH}>{t("collegeHub.salaries")}</th>
                    <th className={TH}>{t("collegeHub.purchases")}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.money.finance.map((y) => (
                    <tr key={y.academicYear} className="border-t border-border">
                      <td className={TD}>{y.academicYear}</td>
                      <td className={NUM}>{money(y.feesDemandedPaise)}</td>
                      <td className={NUM}>{money(y.feesCollectedPaise)}</td>
                      <td className={NUM}>{money(y.scholarshipsDisbursedPaise)}</td>
                      <td className={NUM}>{money(y.salariesPaise)}</td>
                      <td className={NUM}>{money(y.purchasesPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {c.money.payrollByDepartment && c.money.payrollByDepartment.length > 0 ? (
            <p className="text-sm text-fg-muted">{t("collegeHub.payrollLine", { month: c.money.latestPayrollMonth ?? "—", list: c.money.payrollByDepartment.map((d) => `${d.department || "—"} ${money(d.grossPaise + d.employerPaise)}`).join(" · ") })}</p>
          ) : null}
          <p className="text-sm text-fg-muted">{t("collegeHub.noMoneyMoves")}</p>
        </CardBody>
      </Card>

      {/* ---------------- the accreditation file ---------------- */}
      {c.accreditation ? (
        <Card>
          <CardHeader icon={<MedalIcon weight="duotone" className="size-5" />} title={t("collegeHub.accreditationTitle")} description={c.school.naacGrade ? t("collegeHub.naacLine", { grade: c.school.naacGrade, until: c.school.naacValidUntil ?? "—" }) : t("collegeHub.accreditationBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/principal/accreditation">{t("collegeHub.openAccreditation")}</Link></Button>} />
          <CardBody>
            {c.accreditation.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("collegeHub.filingsNone")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {c.accreditation.map((f) => (
                  <li key={f.id} className="flex justify-between gap-3">
                    <span>{t("collegeHub.filingLine", { kind: f.kind, year: f.year })}</span>
                    <Badge tone={f.status === "AWAITING_SIGNOFF" ? "warn" : "ok"}>{t(f.status === "AWAITING_SIGNOFF" ? "collegeHub.filingAwaiting" : f.status === "FILED" ? "collegeHub.filingFiled" : "collegeHub.filingSigned")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
