"use client";

import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import {
  SITE_ACHIEVEMENTS_MAX,
  SITE_ALBUM_PICTURES_MAX,
  SITE_ALBUMS_MAX,
  SITE_DOWNLOAD_KINDS,
  SITE_DOWNLOADS_MAX,
  SITE_ENQUIRY_FIELDS,
  SITE_FACILITIES,
  SITE_FACILITIES_MAX,
  SITE_GALLERY_MAX,
  SITE_NEWS_MAX,
  type SiteConfig,
  type SiteEnquiryField,
  type SiteFacility,
  type SitePage,
} from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { SITE_DOWNLOAD_NAME, SITE_FACILITY_NAME } from "@/lib/site-content";
import { PageHead } from "./page-head";
import { PdfPicker, PicturePicker } from "./picture";
import type { SectionProps } from "./types";
import { useDay } from "./when";

/**
 * THE SITE'S PAGES BESIDES HOME (website-two, 16 October 2026), each its settings (PageHead) and what it holds: About
 * and Contact print the school's words from About the school; Academics the classes, subjects and departments the
 * platform already knows; Admissions how to apply, the open cycle's dates, the prospectus and the enquiry form;
 * Facilities, Achievements and Downloads what the office types and uploads; Gallery and News what the school already
 * posted (each picture with the consent tick); Events the school calendar. Never a named pupil: Achievements says so.
 */

const ENQUIRY_FIELD_KEYS: Record<SiteEnquiryField, TranslationKey> = { GRADE: "siteEditor.fieldGrade", EMAIL: "siteEditor.fieldEmail", VISIT: "siteEditor.fieldVisit" };
const newId = () => `i${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function moved<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function ListControls({ index, length, onMove, onRemove, name }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; name: string }) {
  const t = useT();
  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} aria-label={t("website.moveUp", { section: name })} onClick={() => onMove(index - 1)}>
        <ArrowUpIcon aria-hidden="true" className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === length - 1} aria-label={t("website.moveDown", { section: name })} onClick={() => onMove(index + 1)}>
        <ArrowDownIcon aria-hidden="true" className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={t("siteEditor.removeItem", { name })} onClick={onRemove}>
        <TrashIcon aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

export function PageSection(props: SectionProps & { code: SitePage; college: boolean; admissionsOn: boolean; goTo: (section: string) => void }) {
  const { code } = props;
  return (
    <div className="space-y-4">
      <PageHead {...props} code={code} />
      {code === "ABOUT" ? <WordsFromAbout goTo={props.goTo} which="about" /> : null}
      {code === "ACADEMICS" ? <AcademicsBody {...props} /> : null}
      {code === "ADMISSIONS" ? <AdmissionsBody {...props} /> : null}
      {code === "FACILITIES" ? <FacilitiesBody {...props} /> : null}
      {code === "FACULTY" ? <FacultyBody {...props} /> : null}
      {code === "GALLERY" ? <GalleryBody {...props} /> : null}
      {code === "NEWS" ? <NewsBody {...props} /> : null}
      {code === "EVENTS" ? <EventsBody {...props} /> : null}
      {code === "ACHIEVEMENTS" ? <AchievementsBody {...props} /> : null}
      {code === "DOWNLOADS" ? <DownloadsBody {...props} /> : null}
      {code === "CONTACT" ? (
        <>
          <WordsFromAbout goTo={props.goTo} which="contact" />
          <EnquiryFormCard {...props} />
        </>
      ) : null}
    </div>
  );
}

function WordsFromAbout({ goTo, which }: { goTo: (s: string) => void; which: "about" | "contact" }) {
  const t = useT();
  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{t(which === "about" ? "siteEditor.aboutFromAbout" : "website.contactFromAbout")}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => goTo("about")}>
          {t("siteEditor.openAbout")}
        </Button>
      </CardBody>
    </Card>
  );
}

function AcademicsBody({ draft, setDraft, data, college }: SectionProps & { college: boolean }) {
  const t = useT();
  const a = data.academics ?? { classes: [], departments: [] };
  return (
    <Card>
      <CardHeader title={t("siteWeb.academicsTitle")} description={t(college ? "siteEditor.academicsIntroCollege" : "siteEditor.academicsIntro")} />
      <CardBody className="space-y-4">
        <TextAreaField label={t("siteEditor.academicsTextLabel")} hint={t("siteEditor.academicsTextHint")} maxLength={2000} rows={5} value={draft.academicsText} onChange={(e) => setDraft("academicsText", e.target.value)} />
        {college ? (
          <p className="text-sm text-fg-muted">{t("siteEditor.academicsDepartments", { count: a.departments.length })}</p>
        ) : (
          <>
            <p className="text-sm text-fg-muted">{t("siteEditor.academicsClasses", { count: a.classes.length })}</p>
            <CheckboxField label={t("siteEditor.academicsSubjects")} description={t("siteEditor.academicsSubjectsHint")} checked={draft.academicsSubjects} onChange={(e) => setDraft("academicsSubjects", e.target.checked)} />
          </>
        )}
        <p className="text-xs text-fg-muted">{t("siteEditor.academicsBoardMedium")}</p>
      </CardBody>
    </Card>
  );
}

function EnquiryFormCard({ draft, setDraft }: SectionProps) {
  const t = useT();
  const toggleField = (f: SiteEnquiryField, on: boolean) => setDraft("enquiryFields", on ? [...draft.enquiryFields.filter((x) => x !== f), f] : draft.enquiryFields.filter((x) => x !== f));
  return (
    <Card>
      <CardHeader title={t("site.enquiryTitle")} description={t("siteEditor.enquiryFormIntro")} />
      <CardBody className="space-y-3">
        <CheckboxField label={t("website.enquiryFormLabel")} description={t("website.enquiryFormHint")} checked={draft.enquiryForm} onChange={(e) => setDraft("enquiryForm", e.target.checked)} />
        {draft.enquiryForm ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("siteEditor.enquiryFieldsLabel")}</legend>
            <p className="text-xs text-fg-muted">{t("siteEditor.enquiryFieldsAlways")}</p>
            {SITE_ENQUIRY_FIELDS.map((f) => (
              <CheckboxField key={f} label={t(ENQUIRY_FIELD_KEYS[f])} checked={draft.enquiryFields.includes(f)} onChange={(e) => toggleField(f, e.target.checked)} />
            ))}
            <p className="text-xs text-fg-muted">{t("siteWeb.enquiryRetention")}</p>
          </fieldset>
        ) : null}
      </CardBody>
    </Card>
  );
}

function AdmissionsBody(props: SectionProps & { admissionsOn: boolean }) {
  const { draft, setDraft, data, files, onFileAdded, admissionsOn } = props;
  const t = useT();
  const day = useDay();
  const cycle = data.admissionsCycle;
  return (
    <>
      <Card>
        <CardHeader title={t("site.admissionsTitle")} description={t("website.sectionAdmissionsWhat")} />
        <CardBody className="space-y-4">
          <TextAreaField label={t("website.admissionsTextLabel")} hint={t("website.admissionsTextHint")} maxLength={2000} rows={5} value={draft.admissionsText} onChange={(e) => setDraft("admissionsText", e.target.value)} />
          <p className="text-sm text-fg-muted" data-testid="admissions-cycle">
            {cycle
              ? t("siteEditor.cycleShown", { name: cycle.name, opens: cycle.opensKey ? day(cycle.opensKey) : "—", closes: cycle.closesKey ? day(cycle.closesKey) : "—" })
              : admissionsOn
                ? t("siteEditor.cycleNone")
                : t("siteEditor.cycleModuleOff")}
          </p>
          <PdfPicker label={t("siteEditor.prospectusLabel")} value={draft.prospectusFileId} onChange={(id) => setDraft("prospectusFileId", id)} files={files} onFileAdded={onFileAdded} />
        </CardBody>
      </Card>
      <EnquiryFormCard {...props} />
    </>
  );
}

function FacilitiesBody({ draft, setDraft, files, posts, onFileAdded, problem }: SectionProps) {
  const t = useT();
  const list = draft.facilities;
  const set = (next: SiteConfig["facilities"]) => setDraft("facilities", next);
  const nameOf = (f: SiteConfig["facilities"][number]) => (f.code === "CUSTOM" ? f.label || t("siteEditor.facilityCustom") : t(SITE_FACILITY_NAME[f.code]));
  return (
    <Card>
      <CardHeader title={t("siteWeb.facilitiesTitle")} description={t("siteEditor.facilitiesIntro")} />
      <CardBody className="space-y-4">
        {problem?.field === "facilities" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
        <ol className="space-y-3">
          {list.map((f, i) => (
            <li key={i} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <SelectField className="min-w-0 flex-1 basis-56" label={t("siteEditor.facilityKind")} value={f.code} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, code: e.target.value as SiteFacility } : x)))}>
                  {SITE_FACILITIES.map((c) => (
                    <option key={c} value={c}>
                      {c === "CUSTOM" ? t("siteEditor.facilityCustom") : t(SITE_FACILITY_NAME[c])}
                    </option>
                  ))}
                </SelectField>
                <ListControls index={i} length={list.length} name={nameOf(f)} onMove={(to) => set(moved(list, i, to))} onRemove={() => set(list.filter((_, j) => j !== i))} />
              </div>
              {f.code === "CUSTOM" ? <TextField label={t("siteEditor.facilityName")} maxLength={60} value={f.label} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /> : null}
              <TextField label={t("siteEditor.facilityLine")} maxLength={200} value={f.line} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, line: e.target.value } : x)))} />
              <PicturePicker label={t("siteEditor.facilityPicture")} value={f.picture} onChange={(p) => set(list.map((x, j) => (j === i ? { ...x, picture: p } : x)))} files={files} posts={posts} onFileAdded={onFileAdded} />
            </li>
          ))}
        </ol>
        <Button type="button" variant="secondary" size="sm" disabled={list.length >= SITE_FACILITIES_MAX} onClick={() => set([...list, { code: SITE_FACILITIES.find((c) => c !== "CUSTOM" && !list.some((x) => x.code === c)) ?? "CUSTOM", label: "", line: "", picture: null }])}>
          <PlusIcon aria-hidden="true" className="size-4" />
          {t("siteEditor.facilityAdd")}
        </Button>
      </CardBody>
    </Card>
  );
}

function FacultyBody({ data }: SectionProps) {
  const t = useT();
  return (
    <Card>
      <CardBody className="space-y-2">
        <p className="text-sm text-fg-muted">{data.faculty.length > 0 ? t("website.facultyCount", { count: data.faculty.length }) : t("website.facultyNone")}</p>
        <p className="text-xs text-fg-muted">{t("siteThree.facultyPhotosNote")}</p>
      </CardBody>
    </Card>
  );
}

function GalleryBody({ draft, setDraft, files, posts, onFileAdded, problem }: SectionProps) {
  const t = useT();
  const pictures = posts.flatMap((p) => p.images.map((img) => ({ ...img, postId: p.id, title: p.title })));
  const pick = (postId: string, fileId: string, on: boolean) => setDraft("gallery", on ? [...draft.gallery, { postId, fileId, consent: false }].slice(0, SITE_GALLERY_MAX) : draft.gallery.filter((g) => g.fileId !== fileId));
  const consent = (fileId: string, on: boolean) => setDraft("gallery", draft.gallery.map((g) => (g.fileId === fileId ? { ...g, consent: on } : g)));
  const albums = draft.albums;
  const setAlbums = (next: SiteConfig["albums"]) => setDraft("albums", next);
  return (
    <>
      <Card>
        <CardHeader title={t("siteEditor.highlightsTitle")} description={t("siteEditor.highlightsIntro")} />
        <CardBody className="space-y-3">
          <p className="text-xs text-fg-muted">{t("website.consentRule")}</p>
          {problem?.field === "gallery" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
          {pictures.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("website.picturesNone")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pictures.map((img) => {
                const chosen = draft.gallery.find((g) => g.fileId === img.fileId);
                return (
                  <li key={img.fileId} className="space-y-2 rounded-[var(--radius-md)] border border-border p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w */}
                    <img src={`/api/files/${encodeURIComponent(img.fileId)}?w=320`} alt={img.alt} className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover" loading="lazy" />
                    <p className="truncate text-xs text-fg-muted">{img.title}</p>
                    <CheckboxField label={t("website.pictureUse")} checked={Boolean(chosen)} disabled={!chosen && draft.gallery.length >= SITE_GALLERY_MAX} onChange={(e) => pick(img.postId, img.fileId, e.target.checked)} />
                    {chosen ? <CheckboxField label={t("website.pictureConsent")} checked={chosen.consent} onChange={(e) => consent(img.fileId, e.target.checked)} /> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("siteEditor.albumsTitle")} description={t("siteEditor.albumsIntro")} />
        <CardBody className="space-y-4">
          {problem?.field === "albums" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
          {albums.map((album, i) => (
            <div key={album.id} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <TextField className="min-w-0 flex-1 basis-56" label={t("siteEditor.albumTitle")} maxLength={80} value={album.title} onChange={(e) => setAlbums(albums.map((a, j) => (j === i ? { ...a, title: e.target.value } : a)))} />
                <ListControls index={i} length={albums.length} name={album.title} onMove={(to) => setAlbums(moved(albums, i, to))} onRemove={() => setAlbums(albums.filter((_, j) => j !== i))} />
              </div>
              {album.pictures.map((p, k) => (
                <PicturePicker
                  key={`${p.fileId}-${k}`}
                  label={t("siteEditor.albumPicture", { n: k + 1 })}
                  value={p}
                  onChange={(next) => setAlbums(albums.map((a, j) => (j === i ? { ...a, pictures: next ? a.pictures.map((x, m) => (m === k ? next : x)) : a.pictures.filter((_, m) => m !== k) } : a)))}
                  files={files}
                  posts={posts}
                  onFileAdded={onFileAdded}
                />
              ))}
              {album.pictures.length < SITE_ALBUM_PICTURES_MAX ? (
                <PicturePicker label={t("siteEditor.albumAddPicture")} value={null} onChange={(next) => next && setAlbums(albums.map((a, j) => (j === i ? { ...a, pictures: [...a.pictures, next] } : a)))} files={files} posts={posts} onFileAdded={onFileAdded} />
              ) : null}
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" disabled={albums.length >= SITE_ALBUMS_MAX} onClick={() => setAlbums([...albums, { id: newId(), title: t("siteEditor.albumNew", { n: albums.length + 1 }), pictures: [] }])}>
            <PlusIcon aria-hidden="true" className="size-4" />
            {t("siteEditor.albumAdd")}
          </Button>
        </CardBody>
      </Card>
    </>
  );
}

function NewsBody({ draft, setDraft, posts, problem }: SectionProps) {
  const t = useT();
  const toggle = (id: string, on: boolean) => setDraft("newsPostIds", on ? [...draft.newsPostIds, id].slice(0, SITE_NEWS_MAX) : draft.newsPostIds.filter((y) => y !== id));
  // TA-225 (14 Nov 2026): a news post's first picture goes on the site only once its consent is ticked here.
  const ticks = draft.newsPictures ?? [];
  const consent = (postId: string, fileId: string, on: boolean) => setDraft("newsPictures", [...ticks.filter((x) => !(x.postId === postId && x.fileId === fileId)), ...(on ? [{ postId, fileId, consent: true }] : [])]);
  return (
    <Card>
      <CardHeader title={t("site.newsTitle")} description={t("siteEditor.newsIntro")} />
      <CardBody className="space-y-2">
        {problem?.field === "newsPostIds" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
        {posts.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("website.postsNone")}</p>
        ) : (
          <fieldset className="space-y-2">
            <legend className="text-sm text-fg-muted">{t("website.newsChosen", { count: draft.newsPostIds.length, max: SITE_NEWS_MAX })}</legend>
            <p className="text-xs text-fg-muted">{t("siteEditor.newsPictureHint")}</p>
            {posts.map((p) => {
              const chosen = draft.newsPostIds.includes(p.id);
              const first = p.images[0];
              return (
                <div key={p.id} className="space-y-2">
                  <CheckboxField label={p.title} checked={chosen} disabled={!chosen && draft.newsPostIds.length >= SITE_NEWS_MAX} onChange={(e) => toggle(p.id, e.target.checked)} />
                  {chosen && first ? (
                    <div className="ms-6 flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w */}
                      <img src={`/api/files/${encodeURIComponent(first.fileId)}?w=320`} alt={first.alt} className="aspect-[4/3] w-24 shrink-0 rounded-[var(--radius-sm)] object-cover" loading="lazy" />
                      <CheckboxField label={t("website.pictureConsent")} checked={ticks.some((x) => x.postId === p.id && x.fileId === first.fileId && x.consent)} onChange={(e) => consent(p.id, first.fileId, e.target.checked)} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
        )}
      </CardBody>
    </Card>
  );
}

function EventsBody({ data }: SectionProps) {
  const t = useT();
  const day = useDay();
  const events = (data.events ?? []).slice(0, 12);
  return (
    <Card>
      <CardHeader title={t("siteWeb.eventsTitle")} description={t("siteEditor.eventsIntro")} />
      <CardBody className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("siteEditor.eventsNone")}</p>
        ) : (
          <ul className="space-y-1 text-sm text-fg">
            {events.map((e, i) => (
              <li key={`${e.startKey}-${i}`}>
                {e.title} · {e.startKey === e.endKey ? day(e.startKey) : `${day(e.startKey)} – ${day(e.endKey)}`}
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/calendar">{t("siteEditor.eventsOpenCalendar")}</Link>
        </Button>
      </CardBody>
    </Card>
  );
}

function AchievementsBody({ draft, setDraft, files, posts, onFileAdded, problem }: SectionProps) {
  const t = useT();
  const list = draft.achievements;
  const set = (next: SiteConfig["achievements"]) => setDraft("achievements", next);
  return (
    <Card>
      <CardHeader title={t("siteWeb.achievementsTitle")} description={t("siteEditor.achievementsIntro")} />
      <CardBody className="space-y-4">
        <p className="rounded-[var(--radius-md)] border border-warn bg-warn-soft px-3 py-2 text-sm text-fg" data-testid="achievements-policy">
          {t("siteEditor.achievementsPolicy")}
        </p>
        {problem?.field === "achievements" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
        {list.map((a, i) => (
          <div key={a.id} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <TextField className="min-w-0 flex-1 basis-56" label={t("siteEditor.achievementTitle")} maxLength={100} value={a.title} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <ListControls index={i} length={list.length} name={a.title} onMove={(to) => set(moved(list, i, to))} onRemove={() => set(list.filter((_, j) => j !== i))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField label={t("siteEditor.achievementDate")} value={a.dateKey} onChange={(e) => e.target.value && set(list.map((x, j) => (j === i ? { ...x, dateKey: e.target.value } : x)))} />
              <TextField label={t("siteEditor.achievementLine")} maxLength={300} value={a.line} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, line: e.target.value } : x)))} />
            </div>
            <PicturePicker label={t("siteEditor.achievementPicture")} value={a.picture} onChange={(p) => set(list.map((x, j) => (j === i ? { ...x, picture: p } : x)))} files={files} posts={posts} onFileAdded={onFileAdded} />
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" disabled={list.length >= SITE_ACHIEVEMENTS_MAX} onClick={() => set([...list, { id: newId(), title: t("siteEditor.achievementNew"), dateKey: new Date().toISOString().slice(0, 10), line: "", picture: null }])}>
          <PlusIcon aria-hidden="true" className="size-4" />
          {t("siteEditor.achievementAdd")}
        </Button>
      </CardBody>
    </Card>
  );
}

function DownloadsBody({ draft, setDraft, files, onFileAdded, problem, data }: SectionProps) {
  const t = useT();
  const list = draft.downloads;
  const set = (next: SiteConfig["downloads"]) => setDraft("downloads", next);
  return (
    <Card>
      <CardHeader title={t("siteWeb.downloadsTitle")} description={t("siteEditor.downloadsIntro")} />
      <CardBody className="space-y-4">
        {problem?.field === "downloads" || problem?.field === "prospectusFileId" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
        <p className="text-xs text-fg-muted">{t(draft.prospectusFileId ? "siteEditor.downloadsProspectusOn" : "siteEditor.downloadsProspectusOff")}</p>
        {data.disclosurePublished ? <p className="text-xs text-fg-muted">{t("siteEditor.downloadsDisclosure")}</p> : null}
        {list.map((d, i) => (
          <div key={d.id} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <SelectField className="min-w-0 flex-1 basis-56" label={t("siteEditor.downloadKind")} value={d.kind} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, kind: e.target.value as (typeof SITE_DOWNLOAD_KINDS)[number] } : x)))}>
                {SITE_DOWNLOAD_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(SITE_DOWNLOAD_NAME[k])}
                  </option>
                ))}
              </SelectField>
              <ListControls index={i} length={list.length} name={d.title} onMove={(to) => set(moved(list, i, to))} onRemove={() => set(list.filter((_, j) => j !== i))} />
            </div>
            <TextField label={t("siteEditor.downloadTitle")} maxLength={100} value={d.title} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <PdfPicker label={t("siteEditor.downloadFile")} value={d.fileId || null} onChange={(id) => set(list.map((x, j) => (j === i ? { ...x, fileId: id ?? "" } : x)))} files={files} onFileAdded={onFileAdded} />
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" disabled={list.length >= SITE_DOWNLOADS_MAX || !files.some((f) => f.kind === "PDF")} onClick={() => set([...list, { id: newId(), kind: "OTHER", title: t("siteEditor.downloadNew"), fileId: files.find((f) => f.kind === "PDF")?.fileId ?? "" }])}>
          <PlusIcon aria-hidden="true" className="size-4" />
          {t("siteEditor.downloadAdd")}
        </Button>
        {!files.some((f) => f.kind === "PDF") ? (
          <PdfPicker label={t("siteEditor.downloadFirst")} value={null} onChange={(id) => id && set([...list, { id: newId(), kind: "OTHER", title: t("siteEditor.downloadNew"), fileId: id }])} files={files} onFileAdded={onFileAdded} />
        ) : null}
      </CardBody>
    </Card>
  );
}
