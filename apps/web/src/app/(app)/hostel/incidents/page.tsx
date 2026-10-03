import type { Metadata } from "next";
import { FirstAidKitIcon } from "@phosphor-icons/react/ssr";
import { INCIDENT_KINDS, INCIDENT_SEVERITIES } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { hostelIncidents, listBoarders } from "@/lib/hostel";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WardenFrame, inputClass, wardenContext, when } from "@/components/hostel/parts";
import { hostelIncidentAction } from "../actions";
import { INCIDENT_KIND_KEY as KIND_KEY, INCIDENT_SEVERITY_KEY as SEVERITY_KEY } from "@/lib/incident-labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.tabIncidents"), robots: { index: false, follow: false } };
}

/**
 * What happened in the hostel: written in the school's own incident log with
 * the hostel's tag — told to the family as the log tells it, followed up and
 * closed by the office there. The warden reads the hostel's part of the log.
 */
export default async function HostelIncidentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite, timeZone } = await wardenContext();
  const { ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="incidents" title={t("hostel.tabIncidents")}>{null}</WardenFrame>;
  const [list, boarders] = await Promise.all([hostelIncidents(ctx), canWrite ? listBoarders(ctx) : Promise.resolve({ items: [] })]);
  return (
    <WardenFrame t={t} on current="incidents" title={t("hostel.tabIncidents")} description={t("hostel.incidentsIntro")} ok={ok} error={error}>
      {canWrite && boarders.items.length > 0 ? (
        <Card>
          <CardHeader icon={<FirstAidKitIcon weight="duotone" className="size-5" />} title={t("hostel.recordIncident")} />
          <CardBody>
            <form action={hostelIncidentAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="back" value="/hostel/incidents" />
              <label className="text-sm font-medium text-fg">
                {t("hostel.pupil")}
                <select name="allotmentId" required className={inputClass}>
                  {boarders.items.map((b) => (
                    <option key={b.allotmentId} value={b.allotmentId}>
                      {b.name} · {b.hostelName} {b.roomNumber}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.incidentKind")}
                <select name="kind" required className={inputClass}>
                  {INCIDENT_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(KIND_KEY[k])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.incidentSeverity")}
                <select name="severity" className={inputClass}>
                  {INCIDENT_SEVERITIES.map((k) => (
                    <option key={k} value={k}>
                      {t(SEVERITY_KEY[k])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.incidentTitle")}
                <input name="title" required maxLength={120} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-fg sm:col-span-2">
                {t("hostel.incidentBody")}
                <textarea name="body" required maxLength={4000} rows={3} className="mt-1.5 block w-full rounded-[--radius-md] border border-border bg-surface px-3.5 py-3 text-[0.9375rem] text-fg" />
              </label>
              <label className="text-sm font-medium text-fg sm:col-span-2">
                {t("hostel.incidentAction")}
                <textarea name="actionTaken" maxLength={2000} rows={2} className="mt-1.5 block w-full rounded-[--radius-md] border border-border bg-surface px-3.5 py-3 text-[0.9375rem] text-fg" />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-fg sm:col-span-2">
                <input type="checkbox" name="notifyGuardians" defaultChecked className="size-4" />
                {t("hostel.tellFamily")}
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">{t("hostel.recordIncidentButton")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardBody className="p-0">
          {list.items.length === 0 ? (
            <p className="px-5 py-5 text-sm text-fg-muted">{t("hostel.noIncidents")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.items.map((i) => (
                <li key={i.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-fg">
                    {i.studentName} · {i.title}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {i.hostelName} · {t(KIND_KEY[i.kind])} · {t(SEVERITY_KEY[i.severity])} · {when(i.occurredAt, timeZone, locale)} · {i.status === "OPEN" ? t("hostel.incidentOpen") : t("hostel.incidentClosed")} · {t("hostel.reportedBy", { name: i.reportedByName })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </WardenFrame>
  );
}
