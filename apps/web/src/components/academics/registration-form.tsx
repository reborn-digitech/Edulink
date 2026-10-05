import type { RegistrationView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { AWARD_KEY, KIND_KEY } from "./parts";
import type { Translate } from "@/lib/i18n/dictionary";
import { isoToDisplayDate } from "@/lib/dates";

/**
 * A term's registration as a form: core courses ticked and fixed, the rest
 * to choose, the credits against the scheme's, the exits. The same form for
 * a student (/student/registration) and the office on their behalf.
 */
export function RegistrationForm({ t, view, action, hidden = {} }: { t: Translate; view: RegistrationView; action: (form: FormData) => Promise<void>; hidden?: Record<string, string> }) {
  if (!view.programme) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noSeatTitle")} description={t("academics.noSeatBody")} />;
  if (!view.term) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noTermTitle")} description={t("academics.noTermBody")} />;
  const p = view.programme;
  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        {t("academics.seatLine", { programme: `${p.code} ${p.name}`, scheme: p.schemeName, semester: p.semester, division: p.divisionName ?? "—", roll: p.rollNumber ?? "—" })}
        {p.prn ? ` · ${t("academics.prnLine", { prn: p.prn })}` : ""}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        {view.open ? <Badge tone="ok">{view.lateUntil ? t("academics.lateOpenUntil", { until: isoToDisplayDate(view.lateUntil) }) : t("academics.windowOpen", { to: isoToDisplayDate(view.term.registrationClosesOn) })}</Badge> : <Badge tone="neutral">{t("academics.windowShut", { from: isoToDisplayDate(view.term.registrationOpensOn), to: isoToDisplayDate(view.term.registrationClosesOn) })}</Badge>}
        <span className="text-fg-muted">{t("academics.creditsBand", { chosen: view.chosenCredits, min: view.minCredits, max: view.maxCredits })}</span>
      </p>
      {view.offerings.length === 0 ? (
        <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noOfferingsTitle")} description={t("academics.noOfferingsBody")} />
      ) : (
        <form action={action} className="space-y-3">
          {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <input type="hidden" name="termId" value={view.term.id} />
          <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border text-sm">
            {view.offerings.map((o) => (
              <li key={o.offeringId}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2">
                  <input type="checkbox" name="offeringId" value={o.offeringId} defaultChecked={o.chosen || o.required} disabled={o.required || !view.open} className="size-5" />
                  <span className="flex-1">
                    <span className="font-medium text-fg">{o.courseCode}</span> {o.courseName}
                    <span className="block text-fg-muted">{[t(KIND_KEY[o.kind]!), t("academics.creditsN", { n: o.credits }), o.facultyName, o.divisionName ?? t("academics.sharedAcrossDivisions"), o.seatsLeft === null ? null : t("academics.seatsLeft", { n: o.seatsLeft })].filter(Boolean).join(" · ")}</span>
                  </span>
                  {o.required ? <Badge tone="info">{t("academics.required")}</Badge> : null}
                </label>
              </li>
            ))}
          </ul>
          {view.open ? <Button type="submit">{t("academics.register")}</Button> : null}
        </form>
      )}
      {view.exitPoints.length ? <p className="text-sm text-fg-muted">{t("academics.exitsLine", { exits: view.exitPoints.map((e) => t("academics.exitAfter", { year: e.afterYear, award: t(AWARD_KEY[e.award]!), credits: e.credits })).join(" · ") })}</p> : null}
    </div>
  );
}
