import { LOCALES } from "@edulink/i18n";
import { QUIZ_BANK_PAGE_SIZE, QUIZ_BANK_STATES, quizBankChapterQuerySchema, type QuizBankChapterQuery, type QuizBankState } from "@edulink/contracts";
import { requireAppAdmin } from "@/lib/tenancy";
import { bankChapter } from "@/lib/bank-desk";
import { CURATED_FOLDER, curatedFileOf } from "@/lib/quiz-review";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatInZone } from "@/lib/dates";
import { ChipLink } from "@/components/ui/chip";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Pager } from "@/components/ui/pager";
import { ChapterItems } from "./chapter-items";
import { groupHeading } from "./bank-views";

type Params = Record<string, string | string[] | undefined>;

/** The query from the URL; a value that does not parse is dropped, never refused. */
function queryOf(sp: Params): QuizBankChapterQuery {
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const out: Record<string, unknown> = {};
  for (const key of ["lang", "state", "page"] as const) {
    const one = quizBankChapterQuerySchema.shape[key].safeParse(flat[key]);
    if (one.success && one.data !== undefined) out[key] = one.data;
  }
  return out as QuizBankChapterQuery;
}

/**
 * One chapter's questions on the bank desk (the owner's ask of 20 October 2026), /root/quiz-review/chapter/[slug] and
 * /appadmin/quiz-review/chapter/[slug]: every served question, fifty a page (taken down and held ones on their own
 * tabs), with a language toggle — English, हिन्दी, मराठी — that switches every stem, option and solution to that
 * language's stored translation and says plainly where there is none or it was taken down as wrong. The language, the
 * standing and the page live in the URL (?lang=&state=&page=). A chapter nobody may see is the app's 404.
 *
 * One bank (7 Nov 2026): the list has always held the curated and the generated questions together; each now carries its
 * kind badge, Take down and Put back work on either, and a curated item says the file its words are changed in
 * (content/quiz/<slug>.json, re-imported) or, for one written in the app, the folder, the chapter's slug and the bank editor.
 */
export async function ChapterQuestionsPage({ base, slug, searchParams, bankEditor }: { base: string; slug: string; searchParams: Promise<Params>; bankEditor: boolean }) {
  const session = await requireAppAdmin();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const query = queryOf(await searchParams);
  const data = await bankChapter(session, slug, query);
  const here = `${base}/chapter/${encodeURIComponent(data.topic.slug)}`;
  const href = (changes: { lang?: string; state?: QuizBankState; page?: number }) => {
    const next = { lang: data.language, state: data.state, page: data.page, ...changes };
    const q = new URLSearchParams();
    if (next.lang !== "en") q.set("lang", next.lang);
    if (next.state !== "SERVED") q.set("state", next.state);
    if (next.page > 1) q.set("page", String(next.page));
    const qs = q.toString();
    return qs ? `${here}?${qs}` : here;
  };
  const back = new URLSearchParams({ ...(data.topic.board ? { board: data.topic.board } : {}), grade: String(data.topic.grade), subject: data.topic.subject });
  const stateCount: Record<QuizBankState, number> = { SERVED: data.counts.served, DOWN: data.counts.down, HELD: data.counts.held };
  const first = (data.page - 1) * QUIZ_BANK_PAGE_SIZE;
  const items = data.items.map((item, i) => ({
    ...item,
    n: first + i + 1,
    made: t(item.generated ? "bankDesk.madeGenerated" : "bankDesk.madeAuthored", { date: formatInZone(new Date(item.madeAt), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale) }),
    file: curatedFileOf(item, data.topic.slug),
  }));

  return (
    <div className="space-y-5">
      <BackLink href={`${base}?${back.toString()}#chapters`} label={t("bankDesk.backToBank")} />
      <PageHeader title={data.topic.name} description={data.topic.book ? t("qbBank.chapterHeadingBook", { heading: groupHeading(data.topic, t), book: data.topic.book }) : groupHeading(data.topic, t)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <nav aria-label={t("bankDesk.languageLabel")} className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-fg-muted">{t("bankDesk.languageLabel")}</span>
          {LOCALES.map((l) => (
            <ChipLink key={l.code} href={href({ lang: l.code, page: 1 })} current={data.language === l.code} lang={l.code} scroll={false}>
              {l.native}
            </ChipLink>
          ))}
        </nav>
        <nav aria-label={t("quizReview.stateFacet")} className="flex flex-wrap items-center gap-2">
          {QUIZ_BANK_STATES.map((s) => (
            <ChipLink key={s} href={href({ state: s, page: 1 })} current={data.state === s} scroll={false}>
              {t(`quizReview.state${s}`)} <span className="tabular-nums">{stateCount[s]}</span>
            </ChipLink>
          ))}
        </nav>
      </div>
      <p className="text-sm text-fg-muted">
        {t("bankDesk.countsLine", { served: data.counts.served, down: data.counts.down, held: data.counts.held })} · {t("bankDesk.kindsLine", { curated: data.counts.curated, generated: data.counts.generated })}
      </p>

      {items.length === 0 ? <EmptyState title={t("quizReview.empty")} description={t("bankDesk.itemsNone")} /> : <ChapterItems items={items} topicId={data.topic.id} slug={data.topic.slug} folder={CURATED_FOLDER} bankEditor={bankEditor} />}

      {/* The shared pager (12 Nov 2026): Previous, "n–m of total", Next; the page in the URL, a language or standing chip back to page 1. */}
      <Pager
        page={data.page}
        pages={data.pages}
        from={items.length > 0 ? first + 1 : 0}
        to={first + items.length}
        total={stateCount[data.state]}
        hrefFor={(page) => href({ page })}
        labels={{
          previous: t("bankDesk.previousPage"),
          next: t("bankDesk.nextPage"),
          range: t("bankDesk.rangeOf", { from: items.length > 0 ? first + 1 : 0, to: first + items.length, total: stateCount[data.state] }),
          pageOf: t("bankDesk.pageOf", { page: data.page, pages: data.pages }),
        }}
      />
    </div>
  );
}
