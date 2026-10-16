"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type DragEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, DotsSixVerticalIcon, PlusIcon } from "@phosphor-icons/react";
import { LOCALES } from "@edulink/i18n";
import { SITE_CUSTOM_PAGES_MAX, type SiteConfig, type SiteLanguage, type SitePage } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";
import { pageHasContent, siteChecklist, SITE_PAGE_PATH, SITE_PAGE_TITLE } from "@/lib/site-content";
import { publishSiteAction, saveSiteDraftAction } from "../actions";
import type { EditorFile, EditorProps, SetDraft } from "./types";
import { LookSection } from "./look-section";
import { AboutSection } from "./about-section";
import { HomeSection } from "./home-section";
import { PageSection } from "./page-sections";
import { CustomPageSection } from "./custom-page-section";
import { PublishSection } from "./publish-section";
import { EnquiriesSection } from "./enquiries-section";
import { ShareButton } from "./share";
import { useWhen } from "./when";

/**
 * THE WEBSITE EDITOR (website-two, 16 October 2026): one screen in place of the six of 15 October, which are its
 * sections. On the left a rail of the site's parts — Look and About, then the pages with an on/off dot each and a drag
 * handle (and Move up / Move down for the keyboard), the custom pages, then Publish, the enquiries and the domain; in
 * the middle the chosen part's form; on the right the page as it would publish, drawn again from the draft a moment
 * after each change (POST /admin/website/preview into a srcdoc frame: the app's pages refuse to be framed, its own
 * included) at a phone's, a tablet's or a desk's width. Above them the site's state, Save (and a save each time a field
 * is left), Preview in a tab, the review link and Publish, which stays one click away.
 */

type Width = "phone" | "tablet" | "desktop";
const WIDTH_CLASS: Record<Width, string> = { phone: "max-w-[390px]", tablet: "max-w-[768px]", desktop: "max-w-none" };

export function SiteEditor(props: EditorProps) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const when = useWhen(props.school.timezone);
  const [draft, setDraftState] = useState<SiteConfig>(props.config);
  // Every change counts one; the draft is saved up to `savedVersion`, so it is dirty while the two differ — a change
  // made while a save is on its way stays to be saved.
  const [version, setVersion] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const dirty = version !== savedVersion;
  const [section, setSectionState] = useState(() => normaliseSection(props.section, props.config));
  const [lastPath, setLastPath] = useState(() => pathForSection(normaliseSection(props.section, props.config), props.config) ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(props.draftSavedAt);
  const [changedSincePublish, setChangedSincePublish] = useState(props.unpublishedChanges);
  const [problem, setProblem] = useState<{ field?: string; message: string } | null>(null);
  const [files, setFiles] = useState<EditorFile[]>(props.files);
  const [publishing, startPublish] = useTransition();

  /** Open a section; the preview follows to the section's page, or stays where it was for Look, Publish and the inbox. */
  const setSection = (id: string) => {
    setSectionState(id);
    const next = pathForSection(id, draft);
    if (next !== null) setLastPath(next);
  };

  const setDraft: SetDraft = useCallback((key, value) => {
    setDraftState((d) => ({ ...d, [key]: value }));
    setVersion((v) => v + 1);
    setSaveState("idle");
  }, []);
  const replaceDraft = (config: SiteConfig) => {
    setDraftState(config);
    setVersion(version + 1);
    setSavedVersion(version + 1);
    setSaveState("idle");
  };

  const save = async (): Promise<boolean> => {
    if (!dirty) return true;
    setSaveState("saving");
    const sent = version;
    const r = await saveSiteDraftAction(draft as unknown as Record<string, unknown>);
    if (!r.ok) {
      setSaveState("error");
      setProblem({ field: r.field, message: r.error ?? t("common.tryAgain") });
      return false;
    }
    setSavedVersion((v) => Math.max(v, sent));
    setProblem(null);
    setSaveState("saved");
    setSavedAt(r.savedAt ?? new Date().toISOString());
    setChangedSincePublish(true);
    return true;
  };

  // Autosave: a field left (focus moving out of it) saves the draft when something changed.
  const onBlurCapture = () => {
    if (dirty) void save();
  };

  const publish = () =>
    startPublish(async () => {
      if (!(await save())) return;
      const r = await publishSiteAction();
      if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      toast({ tone: "ok", title: t("website.published") });
      setChangedSincePublish(false);
      router.refresh();
    });

  /* ---- the rail ---- */
  const pageOrder = draft.pages;
  const movePage = (from: number, to: number) => {
    if (from === to || from < 1 || to < 1 || to >= pageOrder.length) return;
    const next = [...pageOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    setDraft("pages", next);
  };
  const moveCustom = (from: number, to: number) => {
    if (to < 0 || to >= draft.customPages.length) return;
    const next = [...draft.customPages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    setDraft("customPages", next);
  };
  const dragFrom = useRef<{ list: "pages" | "custom"; index: number } | null>(null);
  const onDragStart = (list: "pages" | "custom", index: number) => () => {
    dragFrom.current = { list, index };
  };
  const onDrop = (list: "pages" | "custom", index: number) => (e: DragEvent) => {
    e.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!from || from.list !== list) return;
    if (list === "pages") movePage(from.index, index);
    else moveCustom(from.index, index);
  };
  const addCustomPage = () => {
    if (draft.customPages.length >= SITE_CUSTOM_PAGES_MAX) return;
    const id = `p${Date.now().toString(36)}`;
    const taken = new Set(draft.customPages.map((p) => p.slug));
    let n = draft.customPages.length + 1;
    while (taken.has(`page-${n}`)) n++;
    setDraft("customPages", [...draft.customPages, { id, slug: `page-${n}`, title: t("siteEditor.customNewTitle", { n }), on: false, html: "", seoDescription: "" }]);
    setSection(`custom:${id}`);
  };

  /* ---- the preview ---- */
  const [width, setWidth] = useState<Width>("desktop");
  const [chosenLang, setLang] = useState<SiteLanguage>(draft.language);
  const offered: SiteLanguage[] = draft.offerOtherLanguages ? ["en", "hi", "mr"] : [draft.language];
  const lang: SiteLanguage = offered.includes(chosenLang) ? chosenLang : draft.language;
  const previewPath = useMemo(() => pathForSection(section, draft), [section, draft]);
  const path = previewPath ?? lastPath;
  const [html, setHtml] = useState<string>("");
  const [previewState, setPreviewState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setPreviewState("loading");
        const res = await fetch(`/admin/website/preview?lang=${lang}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ config: draft, page: path }), signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setHtml(await res.text());
        setPreviewState("ready");
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") setPreviewState("failed");
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft, path, lang]);

  // The data the draft is drawn with, and the files uploaded in this sitting, so a new picture counts at once.
  const data = useMemo(() => ({ ...props.data, files: { ...props.data.files, ...Object.fromEntries(files.map((f) => [f.fileId, { size: f.size, kind: f.kind }])) } }), [props.data, files]);
  const checklist = useMemo(() => siteChecklist(draft, data, Boolean(props.address)), [draft, data, props.address]);
  const shownName = (code: SitePage, own: string) => own.trim() || t(SITE_PAGE_TITLE[code]);

  /* ---- the chosen section ---- */
  const common = { draft, setDraft, data, files, onFileAdded: (f: EditorFile) => setFiles((list) => [f, ...list]), posts: props.posts, problem };
  let body: ReactNode;
  if (section === "look") body = <LookSection {...common} fonts={props.fonts} logoColour={props.logoColour} hasLogo={Boolean(props.school.logoFileId)} />;
  else if (section === "about") body = <AboutSection {...common} schoolName={props.school.name} principalName={props.principalName} canName={props.canNamePrincipal} />;
  else if (section === "page:HOME") body = <HomeSection {...common} college={props.school.college} metricValues={props.metricValues} />;
  else if (section.startsWith("page:")) body = <PageSection {...common} code={section.slice(5) as SitePage} college={props.school.college} admissionsOn={props.admissionsOn} goTo={setSection} />;
  else if (section.startsWith("custom:")) body = <CustomPageSection {...common} id={section.slice(7)} onRemoved={() => setSection("page:HOME")} />;
  else if (section === "enquiries") body = <EnquiriesSection inbox={props.inbox} when={when} />;
  else
    body = (
      <PublishSection
        published={props.published}
        publishedAt={props.publishedAt}
        address={props.address}
        localPath={props.localPath}
        domain={props.domain}
        checklist={checklist}
        versions={props.versions}
        visits={props.visits}
        when={when}
        goTo={setSection}
        onRestored={replaceDraft}
        publishing={publishing}
        onPublish={publish}
      />
    );

  const done = checklist.filter((c) => c.done).length;
  const stateLine = props.published
    ? changedSincePublish && savedAt
      ? t("siteEditor.stateDraftSince", { when: when(savedAt) })
      : props.publishedAt
        ? t("siteEditor.statePublished", { when: when(props.publishedAt) })
        : t("website.liveBadge")
    : t("website.notPublished");

  return (
    <div className="space-y-4" data-testid="site-editor" data-section={section}>
      {/* The header: where the site stands, Save, a tab of the preview, the review link and Publish. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-fg" data-testid="site-state">
            {stateLine}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {props.published && changedSincePublish ? <Badge tone="warn">{t("siteEditor.unpublishedChanges")}</Badge> : null}
            {props.published ? <Badge tone="ok">{t("website.liveBadge")}</Badge> : <Badge>{t("website.draftBadge")}</Badge>}
            {props.address ? null : <Badge tone="outline">{t("siteEditor.noDomain")}</Badge>}
            <span role="status" aria-live="polite" className="text-xs text-fg-muted" data-testid="site-save-state">
              {saveState === "saving" ? t("siteEditor.saving") : saveState === "saved" ? t("siteEditor.saved") : saveState === "error" ? t("siteEditor.saveFailed") : dirty ? t("siteEditor.unsaved") : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void save()} loading={saveState === "saving"} disabled={!dirty}>
            {t("siteEditor.save")}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={`/admin/website/preview${path ? `/${path}` : ""}?lang=${lang}`} target="_blank" rel="noopener">
              {t("website.previewOpen")}
            </a>
          </Button>
          <ShareButton shares={props.shares} when={when} />
          <Button type="button" size="sm" onClick={publish} loading={publishing} data-testid="site-publish-now">
            {props.publishedOnce ? t("website.publishChanges") : t("website.publish")}
          </Button>
        </div>
      </div>

      {problem ? (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {problem.message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* The rail */}
        <nav aria-label={t("siteEditor.railLabel")} className="space-y-4">
          <RailGroup title={t("siteEditor.railSite")}>
            <RailItem id="look" current={section} onPick={setSection} label={t("website.stepLook")} />
            <RailItem id="about" current={section} onPick={setSection} label={t("website.stepAbout")} />
          </RailGroup>
          <RailGroup title={t("siteEditor.railPages")}>
            {pageOrder.map((p, i) => {
              const shows = pageHasContent(p.code, draft, data);
              const name = shownName(p.code, p.title);
              return (
                <li
                  key={p.code}
                  draggable={p.code !== "HOME"}
                  onDragStart={onDragStart("pages", i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop("pages", i)}
                  className="flex items-center gap-1"
                >
                  {p.code !== "HOME" ? <DotsSixVerticalIcon aria-hidden="true" className="size-4 shrink-0 cursor-grab text-fg-subtle" /> : <span className="size-4 shrink-0" />}
                  <RailButton id={`page:${p.code}`} current={section} onPick={setSection} label={name} dot={p.on || p.code === "HOME" ? (shows ? "on" : "empty") : "off"} t={t} />
                  {p.code !== "HOME" ? (
                    <span className="flex">
                      <Button type="button" variant="ghost" size="icon-sm" disabled={i <= 1} aria-label={t("website.moveUp", { section: name })} onClick={() => movePage(i, i - 1)}>
                        <ArrowUpIcon aria-hidden="true" className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={i === pageOrder.length - 1} aria-label={t("website.moveDown", { section: name })} onClick={() => movePage(i, i + 1)}>
                        <ArrowDownIcon aria-hidden="true" className="size-4" />
                      </Button>
                    </span>
                  ) : null}
                </li>
              );
            })}
            {draft.customPages.map((p, i) => (
              <li key={p.id} draggable onDragStart={onDragStart("custom", i)} onDragOver={(e) => e.preventDefault()} onDrop={onDrop("custom", i)} className="flex items-center gap-1">
                <DotsSixVerticalIcon aria-hidden="true" className="size-4 shrink-0 cursor-grab text-fg-subtle" />
                <RailButton id={`custom:${p.id}`} current={section} onPick={setSection} label={p.title} dot={p.on ? (p.html.replace(/<[^>]*>/g, "").trim() ? "on" : "empty") : "off"} t={t} />
                <span className="flex">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} aria-label={t("website.moveUp", { section: p.title })} onClick={() => moveCustom(i, i - 1)}>
                    <ArrowUpIcon aria-hidden="true" className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === draft.customPages.length - 1} aria-label={t("website.moveDown", { section: p.title })} onClick={() => moveCustom(i, i + 1)}>
                    <ArrowDownIcon aria-hidden="true" className="size-4" />
                  </Button>
                </span>
              </li>
            ))}
            <li>
              <Button type="button" variant="ghost" size="sm" onClick={addCustomPage} disabled={draft.customPages.length >= SITE_CUSTOM_PAGES_MAX}>
                <PlusIcon aria-hidden="true" className="size-4" />
                {t("siteEditor.customAdd", { max: SITE_CUSTOM_PAGES_MAX })}
              </Button>
            </li>
          </RailGroup>
          <RailGroup title={t("siteEditor.railPublish")}>
            <RailItem id="publish" current={section} onPick={setSection} label={t("siteEditor.readyCount", { done, total: checklist.length })} />
            <RailItem id="enquiries" current={section} onPick={setSection} label={t("siteEditor.enquiriesRail", { count: props.inbox.counts.NEW })} />
            <li>
              <Link href="/admin/website/domain" className="flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-sm text-fg hover:bg-surface-muted">
                {t("website.stepDomain")}
              </Link>
            </li>
          </RailGroup>
        </nav>

        {/* The chosen part */}
        <div className="min-w-0 space-y-4" onBlurCapture={onBlurCapture}>
          {body}
        </div>

        {/* The preview */}
        <section aria-label={t("website.previewTitle")} className="min-w-0 space-y-2 lg:col-span-2 xl:col-span-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label={t("website.previewWidth")} className="flex gap-1">
              {(["phone", "tablet", "desktop"] as const).map((w) => (
                <Button key={w} type="button" size="sm" variant={width === w ? "primary" : "secondary"} aria-pressed={width === w} onClick={() => setWidth(w)}>
                  {t(WIDTH_KEY[w])}
                </Button>
              ))}
            </div>
            {offered.length > 1 ? (
              <div role="group" aria-label={t("website.previewLanguage")} className="flex gap-1">
                {LOCALES.filter((l) => offered.includes(l.code)).map((l) => (
                  <Button key={l.code} type="button" size="sm" variant={lang === l.code ? "primary" : "secondary"} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
                    {l.native}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-fg-muted" role="status" aria-live="polite">
            {previewState === "loading" ? t("siteEditor.previewDrawing") : previewState === "failed" ? t("siteEditor.previewFailed") : t("siteEditor.previewShowing", { page: path ? path : t("siteWeb.homeTitle") })}
          </p>
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted p-2">
            <iframe title={t("website.previewFrameTitle")} srcDoc={html} sandbox="allow-same-origin" className={cn("mx-auto block h-[75vh] w-full rounded-[var(--radius-sm)] border border-border bg-white", WIDTH_CLASS[width])} />
          </div>
        </section>
      </div>
    </div>
  );
}

const WIDTH_KEY: Record<Width, TranslationKey> = { phone: "website.previewPhone", tablet: "siteEditor.previewTablet", desktop: "website.previewDesktop" };

/** The section a ?s= names (the six screens' old names included), or Look. */
function normaliseSection(raw: string, config: SiteConfig): string {
  const old: Record<string, string> = { look: "look", about: "about", sections: "page:HOME", home: "page:HOME", review: "publish", preview: "publish", publish: "publish", enquiries: "enquiries" };
  if (old[raw]) return old[raw]!;
  if (raw.startsWith("page:") && config.pages.some((p) => `page:${p.code}` === raw)) return raw;
  if (raw.startsWith("custom:") && config.customPages.some((p) => `custom:${p.id}` === raw)) return raw;
  return "look";
}

/** The page the preview shows for a section: a page's own path, or null to keep the last one. */
function pathForSection(section: string, config: SiteConfig): string | null {
  if (section.startsWith("page:")) return SITE_PAGE_PATH[section.slice(5) as SitePage] ?? "";
  if (section.startsWith("custom:")) return config.customPages.find((p) => `custom:${p.id}` === section)?.slug ?? "";
  if (section === "about") return "about";
  return null;
}

function RailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function RailItem({ id, current, onPick, label }: { id: string; current: string; onPick: (id: string) => void; label: string }) {
  return (
    <li>
      <RailButton id={id} current={current} onPick={onPick} label={label} />
    </li>
  );
}

function RailButton({ id, current, onPick, label, dot, t }: { id: string; current: string; onPick: (id: string) => void; label: string; dot?: "on" | "off" | "empty"; t?: ReturnType<typeof useT> }) {
  const here = id === current;
  return (
    <button
      type="button"
      onClick={() => onPick(id)}
      aria-current={here ? "true" : undefined}
      data-rail={id}
      className={cn("flex min-h-11 w-full min-w-0 items-center gap-2 rounded-[var(--radius-md)] px-3 text-left text-sm", here ? "bg-accent-soft font-semibold text-accent-strong" : "text-fg hover:bg-surface-muted")}
    >
      {dot && t ? (
        <span
          role="img"
          aria-label={t(dot === "on" ? "siteEditor.dotOn" : dot === "empty" ? "siteEditor.dotEmpty" : "siteEditor.dotOff")}
          className={cn("size-2.5 shrink-0 rounded-full", dot === "on" ? "bg-ok" : dot === "empty" ? "border-2 border-warn" : "bg-border-strong")}
        />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
