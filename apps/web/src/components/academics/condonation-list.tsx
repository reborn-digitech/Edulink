import type { Condonation } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { INPUT } from "@/components/module-flash";
import { decideCondonationAction } from "@/app/(app)/admin/academics/actions";
import { CondonationBadge, GROUND_KEY } from "./parts";
import type { Translate } from "@/lib/i18n/dictionary";

/**
 * Condonation asks with their ground, the percentage they are about and the
 * department's floor; for the one who decides, the buttons: the HOD approves
 * (above the floor), forwards or refuses an ask, the principal approves or
 * refuses what was forwarded.
 */
export function CondonationList({ t, items, decider, back }: { t: Translate; items: Condonation[]; decider: "HOD" | "PRINCIPAL" | null; back: string }) {
  if (items.length === 0) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.condonationsNone")} description={t("academics.condonationsNoneBody")} />;
  return (
    <ul className="divide-y divide-border text-sm">
      {items.map((c) => {
        const mine = (decider === "HOD" && c.status === "ASKED") || (decider === "PRINCIPAL" && c.status === "FORWARDED");
        return (
          <li key={c.id} className="space-y-2 py-3">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-fg">{c.studentName}</span>
              <span className="text-fg-muted">{[c.termName, c.courseCode ?? t("academics.allCourses"), t(GROUND_KEY[c.ground]!)].join(" · ")}</span>
              <CondonationBadge t={t} c={c} />
            </p>
            <p className="text-fg-muted">{t("academics.condonationFacts", { percent: c.percent === null ? "—" : `${c.percent}%`, floor: c.floor })}</p>
            <p className="text-fg">{c.note}</p>
            {c.documentFileId ? (
              <p>
                <a className="font-medium text-accent-strong underline underline-offset-2" href={`/api/files/${encodeURIComponent(c.documentFileId)}`} target="_blank" rel="noreferrer">
                  {t("academics.document")}
                </a>
              </p>
            ) : null}
            {c.decisionNote ? <p className="text-fg-muted">{t("academics.decisionNote", { note: c.decisionNote })}</p> : null}
            {mine ? (
              <form action={decideCondonationAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="back" value={back} />
                <input aria-label={t("academics.fieldNote")} className={`${INPUT} max-w-xs`} name="note" maxLength={400} placeholder={t("academics.fieldNote")} />
                <Button type="submit" size="sm" name="decision" value="APPROVE">{t("academics.approve")}</Button>
                {decider === "HOD" ? <Button type="submit" size="sm" variant="secondary" name="decision" value="FORWARD">{t("academics.forward")}</Button> : null}
                <Button type="submit" size="sm" variant="ghost" name="decision" value="REFUSE">{t("academics.refuse")}</Button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
