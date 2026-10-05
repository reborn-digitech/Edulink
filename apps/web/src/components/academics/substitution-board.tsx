import type { z } from "zod";
import type { lectureSubstitutionsSchema } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { fieldClass } from "@/components/ui/field-class";
import { setSubstituteAction } from "@/app/(app)/admin/academics/actions";
import { clock } from "./parts";
import type { Translate } from "@/lib/i18n/dictionary";
import { isoToDisplayDate } from "@/lib/dates";

/** The day's lectures whose faculty member is away, and who stands in: the office for any, an HOD for their department's. */
export function SubstitutionBoard({ t, board, canAssign, back }: { t: Translate; board: z.infer<typeof lectureSubstitutionsSchema>; canAssign: boolean; back: string }) {
  if (board.lectures.length === 0) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.boardEmpty")} description={t("academics.boardEmptyBody", { date: isoToDisplayDate(board.dateKey) })} />;
  return (
    <ul className="divide-y divide-border text-sm">
      {board.lectures.map((l) => (
        <li key={l.lectureId} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span>
            <span className="tabular-nums text-fg-muted">{clock(l.startMinute, l.endMinute)}</span> <span className="font-medium text-fg">{l.courseCode}</span> <span className="text-fg-muted">{[l.divisionName, l.facultyName].filter(Boolean).join(" · ")}</span>{" "}
            <Badge tone="warn">{t(l.reason === "ON_LEAVE" ? "academics.awayLeave" : "academics.awayAbsent")}</Badge>
          </span>
          {canAssign ? (
            <form action={setSubstituteAction} className="flex items-center gap-2">
              <input type="hidden" name="lectureId" value={l.lectureId} />
              <input type="hidden" name="back" value={back} />
              <select aria-label={t("academics.fieldSubstitute")} className={fieldClass()} name="substituteMembershipId" defaultValue={l.substituteMembershipId ?? ""}>
                <option value="">{t("academics.noSubstitute")}</option>
                {board.candidates.map((c) => <option key={c.membershipId} value={c.membershipId}>{c.name}</option>)}
              </select>
              <Button type="submit" size="sm" variant="secondary">{t("common.save")}</Button>
            </form>
          ) : (
            <span className="text-fg-muted">{l.substituteName ?? t("academics.noSubstitute")}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
