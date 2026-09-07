import type { Metadata } from "next";
import { PrinterIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { worksheetTopics } from "@/lib/worksheets";
import { SUBJECT_KEY, TIER_NAMES, MAX_LEVEL, type QuizSubject } from "@/lib/quiz";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { FreshSeedInput } from "./fresh-seed";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("worksheets.title") };
}

/**
 * The form is a GET to the print view, so the resulting worksheet is a URL —
 * reprintable, shareable with the office, and stable for a given seed.
 */
export default async function WorksheetsPage() {
  const ctx = await requireRole("TEACHER");
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const topics = await worksheetTopics(ctx);

  return (
    <div className="space-y-6">
      <PageHeader title={t("worksheets.title")} description={t("worksheets.intro")} />

      <Card>
        <CardHeader
          icon={<PrinterIcon weight="duotone" className="size-5" />}
          title={t("worksheets.formTitle")}
          description={t("worksheets.formHint")}
        />
        <CardBody>
          <form action="/teacher/worksheets/print" method="get" className="grid gap-3 sm:grid-cols-3">
            {/* Minted client-side after mount — a server render stays pure. */}
            <FreshSeedInput />
            <label className="block text-sm sm:col-span-3">
              <span className="mb-1 block font-medium text-fg">{t("practice.fieldChapter")}</span>
              <select
                name="slug"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              >
                {topics.map((topic) => (
                  <option key={topic.slug} value={topic.slug}>
                    {t("practice.classN", { n: topic.classLevel })} ·{" "}
                    {subjectName(topic.subject)} ·{" "}
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("practice.fieldTarget")}</span>
              <select
                name="level"
                required
                defaultValue="3"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              >
                {Array.from({ length: MAX_LEVEL }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    L{i + 1} · {TIER_NAMES[i]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("worksheets.fieldCount")}</span>
              <input
                type="number"
                name="count"
                min={1}
                max={30}
                defaultValue={10}
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" icon={<PrinterIcon weight="bold" />}>
                {t("worksheets.build")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
