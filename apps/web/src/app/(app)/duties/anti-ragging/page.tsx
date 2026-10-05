import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheckIcon, UsersThreeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { TD, TH } from "@/components/module-flash";
import { TableScroll } from "@/components/ui/table-scroll";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { antiRaggingRegister } from "@/lib/anti-ragging";
import { hasDuty } from "@/lib/duties";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.antiRagging.title") };
}

const STATUS_KEY: Record<string, TranslationKey> = {
  OPEN: "duties.antiRagging.statusOPEN",
  ACKNOWLEDGED: "duties.antiRagging.statusACKNOWLEDGED",
  RESOLVED: "duties.antiRagging.statusRESOLVED",
  ESCALATED: "duties.antiRagging.statusESCALATED",
};

/**
 * THE ANTI-RAGGING REGISTER (5 Oct 2026), the duties framework's model page:
 * a FACULTY or HOD on the squad (the duty ANTI_RAGGING_SQUAD — the session's
 * gate already refuses the page to one without it), the office and the head.
 * The squad's hostel rounds, the complaints to the committee by state and due
 * day without their words, and the committee. lib/anti-ragging.ts reads it.
 */
export default async function AntiRaggingPage() {
  const ctx = await requireRole("FACULTY", "HOD", "ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if ((ctx.role === "FACULTY" || ctx.role === "HOD") && !(await hasDuty(ctx, "ANTI_RAGGING_SQUAD"))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) return <ModuleOff page module="IQAC" t={t} college />;
  const [r, school] = await Promise.all([antiRaggingRegister(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const when = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: school.timezone }).format(new Date(iso));
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.antiRagging.title")} description={t("duties.antiRagging.intro")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.antiRagging.statRounds")} value={r.summary.rounds30} />
        <StatTile label={t("duties.antiRagging.statFlagged")} value={r.summary.flagged30} tone={r.summary.flagged30 ? "warn" : "neutral"} />
        <StatTile label={t("duties.antiRagging.statOpen")} value={r.summary.open} tone={r.summary.open ? "warn" : "ok"} />
        <StatTile label={t("duties.antiRagging.statOverdue")} value={r.summary.overdue} tone={r.summary.overdue ? "danger" : "ok"} />
      </div>

      <Card>
        <CardHeader icon={<ShieldCheckIcon weight="duotone" className="size-5" />} title={t("duties.antiRagging.roundsTitle")} description={t("duties.antiRagging.roundsBody")} />
        <CardBody>
          {!r.hostelOn ? (
            <p className="text-sm text-fg-muted">{t("duties.antiRagging.noHostel")}</p>
          ) : r.rounds.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("duties.antiRagging.roundsNone")} description={t("duties.antiRagging.roundsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("duties.antiRagging.colWhen")}</th>
                    <th className={TH}>{t("duties.antiRagging.colHostel")}</th>
                    <th className={TH}>{t("duties.antiRagging.colMembers")}</th>
                    <th className={TH}>{t("duties.antiRagging.colFound")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.rounds.map((round) => (
                    <tr key={round.id}>
                      <td className={TD}>{when(round.at)}</td>
                      <td className={TD}>{round.hostelName}</td>
                      <td className={TD}>{round.members}</td>
                      <td className={TD}>{round.flagged ? <Badge tone="warn">{t("duties.antiRagging.flagged")}</Badge> : t("duties.antiRagging.nothingFound")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<WarningIcon weight="duotone" className="size-5" />} title={t("duties.antiRagging.complaintsTitle")} description={t("duties.antiRagging.complaintsBody")} />
        <CardBody>
          {r.complaints.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("duties.antiRagging.complaintsNone")} description={t("duties.antiRagging.complaintsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {r.complaints.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{t("duties.antiRagging.complaintLine", { filed: formatDateKey(c.filedOn, { dateStyle: "medium" }, locale), due: formatDateKey(c.dueOn, { dateStyle: "medium" }, locale) })}</span>
                  <span className="flex gap-1.5">
                    <Badge tone={c.status === "RESOLVED" ? "ok" : c.status === "ESCALATED" ? "info" : "warn"}>{t(STATUS_KEY[c.status]!)}</Badge>
                    {c.overdue ? <Badge tone="danger">{t("duties.antiRagging.overdue")}</Badge> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("duties.antiRagging.committeeTitle")} description={r.committee?.name ?? t("duties.antiRagging.committeeNone")} />
        {r.committee && r.committee.members.length > 0 ? (
          <CardBody>
            <ul className="list-inside list-disc text-sm text-fg">
              {r.committee.members.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </CardBody>
        ) : null}
      </Card>
    </div>
  );
}
