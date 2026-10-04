import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, QuestionIcon } from "@phosphor-icons/react/ssr";
import { SURVEY_SCALE } from "@edulink/contracts";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { linkSurveyView } from "@/lib/iqac";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { answerByLinkAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.navParentVoice"), robots: { index: false, follow: false } };
}

/**
 * AN EMPLOYER'S (OR A PARENT'S) SURVEY THROUGH ITS SIGNED LINK (G-5, 4 Oct
 * 2026). Outside every shell and with no session: the respondent is an
 * employer signed in to nothing. The link names one survey of one college
 * and takes one answer; a forged, closed or used link says so and shows
 * nothing else. Anonymous, as the kinds are: nothing about the respondent is
 * kept beyond the answers.
 */
export default async function SurveyLinkPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const t = await getT();
  const { token } = await params;
  const { done, error } = await searchParams;
  const gate = await consumeByCaller("survey-link", CODE_LOOKUPS);
  const view = gate.allowed ? await linkSurveyView(decodeURIComponent(token), t) : null;
  const errorText = error === "limited" || !gate.allowed ? t("common.tryAgainMoment") : error ? t(error as TranslationKey) : null;

  return (
    <div className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>
        {errorText ? (
          <p role="alert" className="mb-4 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-3 py-2 text-sm font-medium text-warn">
            {errorText}
          </p>
        ) : null}
        {!view ? (
          <section aria-live="polite">
            <QuestionIcon weight="duotone" className="size-9 text-fg-muted" />
            <h1 className="mt-3 text-xl font-bold tracking-tight text-fg">{t("iqac.linkNotFound")}</h1>
          </section>
        ) : view.answered || done ? (
          <section aria-live="polite" data-testid="survey-thanks">
            <CheckCircleIcon weight="duotone" className="size-9 text-ok" />
            <h1 className="mt-3 text-xl font-bold tracking-tight text-fg">{view.title}</h1>
            <p className="mt-1.5 text-sm text-fg-muted">{t("iqac.linkThanks")}</p>
          </section>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{view.title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("iqac.linkPageIntro")}</p>
            <form action={answerByLinkAction} className="mt-6 space-y-4">
              <input type="hidden" name="token" value={decodeURIComponent(token)} />
              {view.questions.map((q) => (
                <fieldset key={q.code} className="space-y-2">
                  <legend className="text-sm font-medium text-fg">{q.label}</legend>
                  <div className="flex flex-wrap gap-2">
                    {SURVEY_SCALE.map((v) => (
                      <label key={v} className="flex min-h-11 items-center gap-2 rounded-[--radius-md] border border-border px-3 text-sm">
                        <input type="radio" name={`q_${q.code}`} value={v} required />
                        {t(`iqac.scale.s${v}` as TranslationKey)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <Button type="submit">{t("iqac.answerButton")}</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
