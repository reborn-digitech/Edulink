import Link from "next/link";
import { DownloadSimpleIcon, QuestionIcon } from "@phosphor-icons/react/ssr";
import type { AssistantChip } from "@edulink/contracts";
import { requireSuperuser } from "@/lib/tenancy";
import { getT, getLocale } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { unansweredReport } from "@/lib/assistant/gaps";
import { ROLE_META, ROLES, type Role } from "@/lib/constants";
import { formatInZone } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";
import { ViduraOpsNav } from "@/components/vidura-ops/ops-nav";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("viduraOps.gapsTitle") };
}

/** The reason codes the report names in words; another code is shown as it is (it is a code, not a sentence). */
const REASONS = ["NOTHING_FOUND", "CLASSIFIER", "SCOPE", "CITATION", "FOREIGN_PAGE", "CATEGORY", "INJECTION", "LINK", "EMAIL", "PHONE", "ADDRESS", "PLACEHOLDER", "NAME", "EMPTY", "HINT_TOO_LONG", "EXAM_YES_NO"] as const;

/**
 * THE UNANSWERED-QUESTIONS REPORT (Vidura pass 3, 18 Oct 2026): the last thirty days of refusals and discards by mode,
 * role and school, counts only, and the stems of the questions that found no page or passage — where the guide and
 * the corpus have holes. Counted nightly by vidura:gaps (src/lib/assistant/gaps.ts); CSV through the export door.
 */
export default async function RootViduraUnansweredPage() {
  const session = await requireSuperuser();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const r = await unansweredReport(session);
  const n = (x: number) => new Intl.NumberFormat(`${locale}-IN`).format(x);
  const role = (code: string) => ((ROLES as readonly string[]).includes(code) ? t(ROLE_META[code as Role].labelKey) : code);
  const scope = (s: string) => (s === "NONE" ? t("viduraOps.scopeNONE") : t(`viduraUi.mode${s as AssistantChip}` as TranslationKey));
  const reason = (code: string) => ((REASONS as readonly string[]).includes(code) ? t(`viduraOps.reason.${code}` as TranslationKey) : code);
  const tallyHead = (first: string) => (
    <thead>
      <tr className="text-left text-xs text-fg-muted">
        <th className="py-1 pr-3">{first}</th>
        <th className="py-1 pr-3 text-right">{t("viduraOps.colQuestions")}</th>
        <th className="py-1 pr-3 text-right">{t("viduraOps.colRefused")}</th>
        <th className="py-1 text-right">{t("viduraOps.colDiscarded")}</th>
      </tr>
    </thead>
  );
  const tallyRow = (key: string, label: string, x: { questions: number; refused: number; discarded: number }) => (
    <tr key={key} className="border-t border-border">
      <td className="py-1.5 pr-3">{label}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{n(x.questions)}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{n(x.refused)}</td>
      <td className="py-1.5 text-right tabular-nums">{n(x.discarded)}</td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("viduraOps.gapsTitle")}
        description={t("viduraOps.gapsIntro", { from: r.from, to: r.to })}
        actions={
          <Button asChild variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
            <a href="/api/v1/operator/vidura/unanswered/export" download>
              {t("viduraOps.gapsCsv")}
            </a>
          </Button>
        }
      />
      <ViduraOpsNav current="/root/vidura-unanswered" t={t} />
      <p className="text-sm text-fg-muted">{r.computedAt ? t("viduraOps.gapsCounted", { when: formatInZone(new Date(r.computedAt), "Asia/Kolkata") }) : t("viduraOps.gapsNotCounted")}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={t("viduraOps.colQuestions")} value={n(r.totals.questions)} />
        <StatTile label={t("viduraOps.colRefused")} value={n(r.totals.refused)} tone={r.totals.refused ? "warn" : "neutral"} />
        <StatTile label={t("viduraOps.colDiscarded")} value={n(r.totals.discarded)} tone={r.totals.discarded ? "warn" : "neutral"} />
      </div>
      {r.totals.questions === 0 ? (
        <EmptyState icon={<QuestionIcon weight="duotone" className="size-8" />} title={t("viduraOps.gapsEmpty")} description={t("viduraOps.gapsEmptyBody")} />
      ) : (
        <>
          <Card>
            <CardHeader title={t("viduraOps.byMode")} />
            <CardBody>
              <TableScroll label={t("viduraOps.byMode")}>
                <table className="w-full text-sm">
                  {tallyHead(t("viduraOps.colMode"))}
                  <tbody>{r.byScope.map((x) => tallyRow(x.scope, scope(x.scope), x))}</tbody>
                </table>
              </TableScroll>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("viduraOps.byRole")} />
            <CardBody>
              <TableScroll label={t("viduraOps.byRole")}>
                <table className="w-full text-sm">
                  {tallyHead(t("viduraOps.colRole"))}
                  <tbody>{r.byRole.map((x) => tallyRow(x.role, role(x.role), x))}</tbody>
                </table>
              </TableScroll>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("viduraOps.bySchool")} />
            <CardBody>
              <TableScroll label={t("viduraOps.bySchool")}>
                <table className="w-full text-sm">
                  {tallyHead(t("viduraOps.colSchool"))}
                  <tbody>{r.bySchool.map((x) => tallyRow(x.schoolId, x.schoolName, x))}</tbody>
                </table>
              </TableScroll>
            </CardBody>
          </Card>
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader title={t("viduraOps.byVerdict")} />
              <CardBody>
                {r.byVerdict.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t("viduraOps.noneRefused")}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {r.byVerdict.map((x) => (
                      <li key={x.verdict} className="flex justify-between gap-3">
                        <span>{t(`viduraOps.verdict.${x.verdict}` as TranslationKey)}</span>
                        <span className="tabular-nums">{n(x.count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("viduraOps.byReason")} />
              <CardBody>
                {r.byReason.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t("viduraOps.noneRefused")}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {r.byReason.map((x) => (
                      <li key={x.reason} className="flex justify-between gap-3">
                        <span>{reason(x.reason)}</span>
                        <span className="tabular-nums">{n(x.count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
      <Card>
        <CardHeader title={t("viduraOps.stemsTitle")} description={t("viduraOps.stemsIntro", { people: r.minPeople })} />
        <CardBody>
          {r.stems.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("viduraOps.stemsNone")}</p>
          ) : (
            <TableScroll label={t("viduraOps.stemsTitle")}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-fg-muted">
                    <th className="py-1 pr-3">{t("viduraOps.colStem")}</th>
                    <th className="py-1 pr-3">{t("viduraOps.colRole")}</th>
                    <th className="py-1 pr-3 text-right">{t("viduraOps.colQuestions")}</th>
                    <th className="py-1 pr-3 text-right">{t("viduraOps.colPeople")}</th>
                    <th className="py-1">
                      <span className="sr-only">{t("viduraOps.colTry")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.stems.map((s) => (
                    <tr key={`${s.language}|${s.role}|${s.stem}`} className="border-t border-border">
                      <td className="py-1.5 pr-3" lang={s.language}>
                        {s.stem} …
                      </td>
                      <td className="py-1.5 pr-3">{role(s.role)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{n(s.questions)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{n(s.people)}</td>
                      <td className="py-1.5 text-right">
                        <Link className="inline-flex min-h-11 items-center text-accent-strong underline" href="/root/vidura-answers">
                          {t("viduraOps.tryOnDesk")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
