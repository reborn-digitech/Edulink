import Link from "next/link";
import { CheckCircleIcon, InfoIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { SURVEY_SCALE, type SurveyKind } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { answerSurveyAction } from "@/app/(app)/iqac/actions";

/**
 * The IQAC module's shared pieces (4 Oct 2026): the message a form came back
 * with, the sentence that the platform does not score for NAAC (on every page
 * that shows a score), the desk's sub-navigation, and a survey as a form a
 * student, an alumnus or a teacher answers.
 */

/** A translator for dictionary keys built from a coded value ("iqac.kind." + the code): the coded lists and the keys are kept in step by the i18n tests. */
export const keyed = (t: Translate) => (key: string) => t(key as TranslationKey);

export function IqacFlash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <Card role={error ? "alert" : "status"}>
      <CardBody className={`flex items-center gap-2 pt-5 text-sm ${error ? "text-danger" : "text-ok"}`}>
        {error ? <WarningIcon weight="fill" className="size-4 shrink-0" aria-hidden /> : <CheckCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden />}
        {error ?? ok}
      </CardBody>
    </Card>
  );
}

/** Never a promise: said on every page that shows a score. */
export function NotAScore({ t }: { t: Translate }) {
  return (
    <p className="flex items-start gap-2 rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted" data-testid="iqac-not-a-score">
      <InfoIcon weight="duotone" className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t("iqac.notAScore")}
    </p>
  );
}

const DESK_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/iqac", key: "iqac.navHome" },
  { href: "/iqac/predictor", key: "iqac.navPredictor" },
  // The simulator (5 Oct 2026): the predictor's formulas over figures the IQAC changes.
  { href: "/iqac/simulator", key: "insights.navSimulator" },
  { href: "/iqac/documents", key: "iqac.navDocuments" },
  { href: "/iqac/surveys", key: "iqac.navSurveys" },
  { href: "/iqac/registers", key: "iqac.navRegisters" },
  { href: "/iqac/grievances", key: "iqac.navGrievances" },
];

/** The desk's pages, one row of links under the header. */
export function DeskNav({ t, here }: { t: Translate; here: string }) {
  return (
    <nav aria-label={t("iqac.title")} className="flex flex-wrap gap-2">
      {DESK_LINKS.map((l) => (
        <Button key={l.href} asChild size="sm" variant={l.href === here ? "soft" : "ghost"}>
          <Link href={l.href} aria-current={l.href === here ? "page" : undefined}>
            {t(l.key)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

export const day = (key: string, locale: string) => {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
};

export type VoiceSurvey = { id: string; kind: SurveyKind; title: string; closesOn: string; answered: boolean; questions: { code: string; label: string }[] };

/** The surveys open to the reader, each a form of 4-to-0 answers; an answered one says thank you. */
export function SurveyForms({ t, surveys, back, locale }: { t: Translate; surveys: VoiceSurvey[]; back: string; locale: string }) {
  const tt = keyed(t);
  if (surveys.length === 0) return <EmptyState title={t("iqac.noSurveysForYou")} description={t("iqac.anonymousNote")} />;
  return (
    <div className="space-y-4">
      {surveys.map((s) => (
        <Card key={s.id} data-testid={`survey-${s.id}`}>
          <CardHeader
            title={s.title}
            description={[tt("iqac.surveyKind." + s.kind), " · ", t("iqac.closesLine", { date: day(s.closesOn, locale) })].join("")}
            action={s.answered ? <Badge tone="ok">{t("iqac.alreadyAnswered")}</Badge> : undefined}
          />
          {s.answered ? null : (
            <CardBody>
              <p className="mb-3 text-sm text-fg-muted">{s.kind === "COURSE_FEEDBACK" ? t("iqac.namedNote") : t("iqac.anonymousNote")}</p>
              <form action={answerSurveyAction} className="space-y-4">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="surveyId" value={s.id} />
                {s.questions.map((q) => (
                  <fieldset key={q.code} className="space-y-2">
                    <legend className="text-sm font-medium text-fg">{q.label}</legend>
                    <div className="flex flex-wrap gap-2">
                      {SURVEY_SCALE.map((v) => (
                        <label key={v} className="flex min-h-11 items-center gap-2 rounded-[--radius-md] border border-border px-3 text-sm">
                          <input type="radio" name={`q_${q.code}`} value={v} required />
                          {tt("iqac.scale.s" + v)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <Button type="submit">{t("iqac.answerButton")}</Button>
              </form>
            </CardBody>
          )}
        </Card>
      ))}
    </div>
  );
}
