import type { z } from "zod";
import type { slipReportSchema, slipViewSchema } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { TableScroll } from "@/components/ui/table-scroll";
import type { Translate } from "@/lib/i18n/dictionary";
import { answerSlipAction } from "./slip-actions";

/**
 * A permission slip on its post (5 Oct 2026, permission-slips.ts): the
 * family's yes or no for each child in the audience, changeable until the
 * day; and, for the staff who read the circular's reach, the answers child by
 * child with the unanswered first.
 */
export function SlipAnswers({ postId, slip, t, day }: { postId: string; slip: z.infer<typeof slipViewSchema>; t: Translate; day: (key: string) => string }) {
  return (
    <section aria-labelledby="slip" className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-border bg-accent-soft/30 p-3.5">
      <h2 id="slip" className="text-sm font-semibold text-fg">{slip.question}</h2>
      <p className="text-xs text-fg-muted">{slip.consentBy ? t(slip.open ? "collegeDesks.slipByLine" : "collegeDesks.slipClosedLine", { date: day(slip.consentBy) }) : t("collegeDesks.slipNoDay")}</p>
      {slip.children.length === 0 ? <p className="text-sm text-fg-muted">{t("collegeDesks.slipNoChild")}</p> : null}
      <ul className="space-y-2">
        {slip.children.map((c) => (
          <li key={c.studentMembershipId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-fg">
              {c.name}
              {c.answer ? <span className="ml-2 text-xs text-fg-muted">{t(c.answer === "YES" ? "collegeDesks.slipYesBy" : "collegeDesks.slipNoBy", { name: c.answeredByName ?? "" })}</span> : null}
            </span>
            {slip.open ? (
              <span className="flex gap-2">
                {(["YES", "NO"] as const).map((answer) => (
                  <ActionForm key={answer} action={answerSlipAction}>
                    <input type="hidden" name="postId" value={postId} />
                    <input type="hidden" name="studentMembershipId" value={c.studentMembershipId} />
                    <input type="hidden" name="answer" value={answer} />
                    <Button type="submit" size="sm" variant={c.answer === answer ? "primary" : "secondary"} aria-pressed={c.answer === answer} aria-label={t("collegeDesks.slipAnswerFor", { answer: t(answer === "YES" ? "collegeDesks.slipYes" : "collegeDesks.slipNo"), name: c.name })}>
                      {t(answer === "YES" ? "collegeDesks.slipYes" : "collegeDesks.slipNo")}
                    </Button>
                  </ActionForm>
                ))}
              </span>
            ) : (
              <Badge tone={c.answer === "YES" ? "ok" : c.answer === "NO" ? "danger" : "neutral"}>{t(c.answer === "YES" ? "collegeDesks.slipYes" : c.answer === "NO" ? "collegeDesks.slipNo" : "collegeDesks.slipNone")}</Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SlipReport({ report, t, day }: { report: z.infer<typeof slipReportSchema>; t: Translate; day: (key: string) => string }) {
  return (
    <section aria-labelledby="slip-report" className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 id="slip-report" className="text-base font-semibold text-fg">{t("collegeDesks.slipReportTitle")}</h2>
      <p className="text-sm text-fg-muted">
        {report.question} · {t("collegeDesks.slipCounts", { yes: report.yes, no: report.no, none: report.none })}
        {report.consentBy ? ` · ${t(report.open ? "collegeDesks.slipByLine" : "collegeDesks.slipClosedLine", { date: day(report.consentBy) })}` : ""}
      </p>
      <TableScroll>
        <table className="w-full text-left text-sm">
          <thead className="text-fg-muted">
            <tr>
              <th className="py-1.5 pr-3 font-medium">{t("collegeDesks.slipColChild")}</th>
              <th className="py-1.5 pr-3 font-medium">{t("collegeDesks.slipColClass")}</th>
              <th className="py-1.5 pr-3 font-medium">{t("collegeDesks.slipColAnswer")}</th>
              <th className="py-1.5 pr-3 font-medium">{t("collegeDesks.slipColBy")}</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.studentMembershipId} className="border-t border-border">
                <td className="py-1.5 pr-3">{r.name}</td>
                <td className="py-1.5 pr-3">{r.className ?? "—"}</td>
                <td className="py-1.5 pr-3">
                  <Badge tone={r.answer === "YES" ? "ok" : r.answer === "NO" ? "danger" : "warn"} size="sm">
                    {t(r.answer === "YES" ? "collegeDesks.slipYes" : r.answer === "NO" ? "collegeDesks.slipNo" : "collegeDesks.slipNone")}
                  </Badge>
                </td>
                <td className="py-1.5 pr-3">{r.answeredByName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </section>
  );
}
