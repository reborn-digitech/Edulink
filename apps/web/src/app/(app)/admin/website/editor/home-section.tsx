"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { SITE_METRICS, type SiteMetric, type SiteSection } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { sectionHasContent } from "@/lib/site-content";
import { PageHead } from "./page-head";
import type { SectionProps } from "./types";

/**
 * THE HOME PAGE (the third of the six screens, Sections, grown — website-two): which parts the home page carries and in
 * what order, each a switch with its own title and a short lead; the numbers one by one with today's value. A part
 * switched on with nothing to show is left off the site, and said so here.
 */

export const SECTION_KEYS: Record<SiteSection, { name: TranslationKey; what: TranslationKey }> = {
  NUMBERS: { name: "site.numbersTitle", what: "website.sectionNumbersWhat" },
  FACULTY: { name: "site.facultyTitle", what: "website.sectionFacultyWhat" },
  DISCLOSURE: { name: "site.disclosureTitle", what: "website.sectionDisclosureWhat" },
  ADMISSIONS: { name: "site.admissionsTitle", what: "website.sectionAdmissionsWhat" },
  NEWS: { name: "site.newsTitle", what: "website.sectionNewsWhat" },
  GALLERY: { name: "site.galleryTitle", what: "website.sectionGalleryWhat" },
  CONTACT: { name: "site.contactTitle", what: "website.sectionContactWhat" },
  EVENTS: { name: "siteWeb.eventsTitle", what: "siteEditor.sectionEventsWhat" },
  ACHIEVEMENTS: { name: "siteWeb.achievementsTitle", what: "siteEditor.sectionAchievementsWhat" },
  FACILITIES: { name: "siteWeb.facilitiesTitle", what: "siteEditor.sectionFacilitiesWhat" },
};

const METRIC_KEYS: Record<SiteMetric, TranslationKey> = {
  PUPILS: "site.metricPupils",
  TEACHING_STAFF: "site.metricTeachingStaff",
  ATTENDANCE_MONTH: "site.metricAttendanceMonth",
  CLASSES: "site.metricClasses",
  BOARD: "site.metricBoard",
  YEARS_SINCE_FOUNDING: "site.metricYearsSinceFounding",
  PASS_RATE: "site.metricPassRate",
  PROGRAMMES: "site.metricProgrammes",
  PLACEMENT_OFFERS: "site.metricPlacementOffers",
  PLACEMENT_HIGHEST: "site.metricPlacementHighest",
  PLACEMENT_MEDIAN: "site.metricPlacementMedian",
};
const COLLEGE_ONLY: SiteMetric[] = ["PROGRAMMES", "PLACEMENT_OFFERS", "PLACEMENT_HIGHEST", "PLACEMENT_MEDIAN"];

export function HomeSection(props: SectionProps & { college: boolean; metricValues: Partial<Record<string, string>> }) {
  const { draft, setDraft, data, college, metricValues } = props;
  const t = useT();
  const metricsOffered = SITE_METRICS.filter((m) => (college ? m !== "CLASSES" : !COLLEGE_ONLY.includes(m)));
  const sections = draft.sections;
  const move = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setDraft("sections", next);
  };
  const toggle = (code: SiteSection, on: boolean) => setDraft("sections", sections.map((r) => (r.code === code ? { ...r, on } : r)));
  const textOf = (code: SiteSection) => draft.sectionTexts.find((s) => s.code === code) ?? { code, title: "", lead: "" };
  const setText = (code: SiteSection, patch: { title?: string; lead?: string }) => {
    const others = draft.sectionTexts.filter((s) => s.code !== code);
    setDraft("sectionTexts", [...others, { ...textOf(code), ...patch }]);
  };

  return (
    <div className="space-y-4">
      <PageHead {...props} code="HOME" />
      <Card>
        <CardHeader title={t("siteEditor.homeSectionsTitle")} description={t("siteEditor.homeSectionsIntro")} />
        <CardBody className="space-y-3">
          <p className="text-sm text-fg-muted">{t("website.aboutAlwaysFirst")}</p>
          <ol className="space-y-3">
            {sections.map((row, i) => {
              const keys = SECTION_KEYS[row.code];
              const name = textOf(row.code).title.trim() || t(keys.name);
              const empty = row.on && !sectionHasContent(row.code, draft, data);
              return (
                <li key={row.code} className="rounded-[var(--radius-md)] border border-border p-3" data-home-section={row.code}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CheckboxField className="min-w-0 flex-1 basis-64" label={name} description={t(keys.what)} checked={row.on} onChange={(e) => toggle(row.code, e.target.checked)} />
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" disabled={i === 0} aria-label={t("website.moveUp", { section: name })} onClick={() => move(i, -1)}>
                        <ArrowUpIcon aria-hidden="true" className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" disabled={i === sections.length - 1} aria-label={t("website.moveDown", { section: name })} onClick={() => move(i, 1)}>
                        <ArrowDownIcon aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {empty ? (
                    <p className="mt-2 text-sm text-warn" data-testid="section-empty">
                      {t("siteEditor.sectionEmpty")}
                    </p>
                  ) : null}
                  {row.on ? (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TextField label={t("siteEditor.sectionTitleLabel")} hint={t("siteEditor.sectionTitleHint", { name: t(keys.name) })} maxLength={60} value={textOf(row.code).title} onChange={(e) => setText(row.code, { title: e.target.value })} />
                        <TextField label={t("siteEditor.leadLabel")} hint={t("siteEditor.leadHint")} maxLength={300} value={textOf(row.code).lead} onChange={(e) => setText(row.code, { lead: e.target.value })} />
                      </div>
                      {row.code === "NUMBERS" ? (
                        <fieldset className="grid gap-2 sm:grid-cols-2">
                          <legend className="sr-only">{t("website.numbersPick")}</legend>
                          {metricsOffered.map((m) => (
                            <CheckboxField
                              key={m}
                              label={t(METRIC_KEYS[m])}
                              description={metricValues[m] ? t("website.numberNow", { value: metricValues[m]! }) : t("website.numberNone")}
                              checked={draft.metrics.includes(m)}
                              onChange={(e) => setDraft("metrics", e.target.checked ? [...draft.metrics, m] : draft.metrics.filter((y) => y !== m))}
                            />
                          ))}
                        </fieldset>
                      ) : null}
                      {row.code === "FACULTY" ? <p className="text-sm text-fg-muted">{data.faculty.length > 0 ? t("website.facultyCount", { count: data.faculty.length }) : t("website.facultyNone")}</p> : null}
                      {row.code === "DISCLOSURE" ? <p className="text-sm text-fg-muted">{data.disclosurePublished ? t("website.disclosureYes") : t("website.disclosureNo")}</p> : null}
                      {row.code === "CONTACT" ? <p className="text-sm text-fg-muted">{t("website.contactFromAbout")}</p> : null}
                      {row.code === "NEWS" || row.code === "GALLERY" || row.code === "EVENTS" || row.code === "ACHIEVEMENTS" || row.code === "FACILITIES" ? <p className="text-sm text-fg-muted">{t("siteEditor.sectionFromPage")}</p> : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
