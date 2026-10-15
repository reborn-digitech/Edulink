"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { SITE_GALLERY_MAX, SITE_METRICS, SITE_NEWS_MAX, type SiteMetric, type SiteSection } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { saveSiteDraftAction } from "../actions";
import { StepFooter } from "../steps";

type Picked = { postId: string; fileId: string; consent: boolean };
type Sections = {
  sections: { code: SiteSection; on: boolean }[];
  metrics: SiteMetric[];
  admissionsText: string;
  enquiryForm: boolean;
  newsPostIds: string[];
  gallery: Picked[];
};
type PostChoice = { id: string; title: string; day: string; images: { fileId: string; alt: string }[] };

const SECTION_KEYS: Record<SiteSection, { name: TranslationKey; what: TranslationKey }> = {
  NUMBERS: { name: "site.numbersTitle", what: "website.sectionNumbersWhat" },
  FACULTY: { name: "site.facultyTitle", what: "website.sectionFacultyWhat" },
  DISCLOSURE: { name: "site.disclosureTitle", what: "website.sectionDisclosureWhat" },
  ADMISSIONS: { name: "site.admissionsTitle", what: "website.sectionAdmissionsWhat" },
  NEWS: { name: "site.newsTitle", what: "website.sectionNewsWhat" },
  GALLERY: { name: "site.galleryTitle", what: "website.sectionGalleryWhat" },
  CONTACT: { name: "site.contactTitle", what: "website.sectionContactWhat" },
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

export function SectionsForm({
  initial,
  college,
  values,
  facultyCount,
  disclosurePublished,
  admissionsOn,
  posts,
}: {
  initial: Sections;
  college: boolean;
  values: Partial<Record<SiteMetric, string>>;
  facultyCount: number;
  disclosurePublished: boolean;
  admissionsOn: boolean;
  posts: PostChoice[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [s, setS] = useState<Sections>(initial);
  const metricsOffered = SITE_METRICS.filter((m) => (college ? m !== "CLASSES" : !COLLEGE_ONLY.includes(m)));

  const move = (i: number, by: -1 | 1) =>
    setS((x) => {
      const next = [...x.sections];
      const j = i + by;
      if (j < 0 || j >= next.length) return x;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return { ...x, sections: next };
    });
  const toggleSection = (code: SiteSection, on: boolean) => setS((x) => ({ ...x, sections: x.sections.map((r) => (r.code === code ? { ...r, on } : r)) }));
  const toggleMetric = (m: SiteMetric, on: boolean) => setS((x) => ({ ...x, metrics: on ? [...x.metrics, m] : x.metrics.filter((y) => y !== m) }));
  const toggleNews = (id: string, on: boolean) => setS((x) => ({ ...x, newsPostIds: on ? [...x.newsPostIds, id].slice(0, SITE_NEWS_MAX) : x.newsPostIds.filter((y) => y !== id) }));
  const pick = (postId: string, fileId: string, on: boolean) =>
    setS((x) => ({ ...x, gallery: on ? [...x.gallery, { postId, fileId, consent: false }].slice(0, SITE_GALLERY_MAX) : x.gallery.filter((g) => g.fileId !== fileId) }));
  const consent = (fileId: string, on: boolean) => setS((x) => ({ ...x, gallery: x.gallery.map((g) => (g.fileId === fileId ? { ...g, consent: on } : g)) }));

  const detail = (code: SiteSection) => {
    switch (code) {
      case "NUMBERS":
        return (
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">{t("website.numbersPick")}</legend>
            {metricsOffered.map((m) => (
              <CheckboxField
                key={m}
                label={t(METRIC_KEYS[m])}
                description={values[m] ? t("website.numberNow", { value: values[m]! }) : t("website.numberNone")}
                checked={s.metrics.includes(m)}
                onChange={(e) => toggleMetric(m, e.target.checked)}
              />
            ))}
          </fieldset>
        );
      case "FACULTY":
        return <p className="text-sm text-fg-muted">{facultyCount > 0 ? t("website.facultyCount", { count: facultyCount }) : t("website.facultyNone")}</p>;
      case "DISCLOSURE":
        return <p className="text-sm text-fg-muted">{disclosurePublished ? t("website.disclosureYes") : t("website.disclosureNo")}</p>;
      case "ADMISSIONS":
        return (
          <div className="space-y-3">
            {admissionsOn ? <p className="text-xs text-fg-muted">{t("website.admissionsModuleOn")}</p> : null}
            <TextAreaField label={t("website.admissionsTextLabel")} hint={t("website.admissionsTextHint")} maxLength={2000} rows={4} value={s.admissionsText} onChange={(e) => setS((x) => ({ ...x, admissionsText: e.target.value }))} />
            <CheckboxField label={t("website.enquiryFormLabel")} description={t("website.enquiryFormHint")} checked={s.enquiryForm} onChange={(e) => setS((x) => ({ ...x, enquiryForm: e.target.checked }))} />
          </div>
        );
      case "NEWS":
        return posts.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("website.postsNone")}</p>
        ) : (
          <fieldset className="space-y-2">
            <legend className="text-sm text-fg-muted">{t("website.newsChosen", { count: s.newsPostIds.length, max: SITE_NEWS_MAX })}</legend>
            {posts.map((p) => (
              <CheckboxField
                key={p.id}
                label={p.title}
                description={p.day}
                checked={s.newsPostIds.includes(p.id)}
                disabled={!s.newsPostIds.includes(p.id) && s.newsPostIds.length >= SITE_NEWS_MAX}
                onChange={(e) => toggleNews(p.id, e.target.checked)}
              />
            ))}
          </fieldset>
        );
      case "GALLERY": {
        const pictures = posts.flatMap((p) => p.images.map((img) => ({ ...img, postId: p.id, title: p.title })));
        return pictures.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("website.picturesNone")}</p>
        ) : (
          <fieldset className="space-y-3">
            <legend className="text-sm text-fg-muted">{t("website.galleryChosen", { count: s.gallery.length, max: SITE_GALLERY_MAX })}</legend>
            <p className="text-xs text-fg-muted">{t("website.consentRule")}</p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pictures.map((img) => {
                const chosen = s.gallery.find((g) => g.fileId === img.fileId);
                return (
                  <li key={img.fileId} className="space-y-2 rounded-[var(--radius-md)] border border-border p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w */}
                    <img src={`/api/files/${encodeURIComponent(img.fileId)}?w=320`} alt={img.alt} className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover" loading="lazy" />
                    <p className="truncate text-xs text-fg-muted">{img.title}</p>
                    <CheckboxField label={t("website.pictureUse")} checked={Boolean(chosen)} disabled={!chosen && s.gallery.length >= SITE_GALLERY_MAX} onChange={(e) => pick(img.postId, img.fileId, e.target.checked)} />
                    {chosen ? <CheckboxField label={t("website.pictureConsent")} checked={chosen.consent} onChange={(e) => consent(img.fileId, e.target.checked)} /> : null}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      }
      case "CONTACT":
        return <p className="text-sm text-fg-muted">{t("website.contactFromAbout")}</p>;
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSiteDraftAction(s);
          if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
          router.push("/admin/website/review");
        });
      }}
    >
      <p className="text-sm text-fg-muted">{t("website.aboutAlwaysFirst")}</p>
      <ol className="space-y-3">
        {s.sections.map((row, i) => {
          const keys = SECTION_KEYS[row.code];
          const name = t(keys.name);
          return (
            <li key={row.code} className="rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CheckboxField className="min-w-0 flex-1 basis-64" label={name} description={t(keys.what)} checked={row.on} onChange={(e) => toggleSection(row.code, e.target.checked)} />
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" disabled={i === 0} aria-label={t("website.moveUp", { section: name })} onClick={() => move(i, -1)}>
                    <ArrowUpIcon aria-hidden="true" className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={i === s.sections.length - 1} aria-label={t("website.moveDown", { section: name })} onClick={() => move(i, 1)}>
                    <ArrowDownIcon aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
              {row.on ? <div className="mt-3 border-t border-border pt-3">{detail(row.code)}</div> : null}
            </li>
          );
        })}
      </ol>
      <StepFooter back="/admin/website/about" pending={pending} />
    </form>
  );
}
