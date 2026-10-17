"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import type { SiteCheck, SiteConfig } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { STATUS_KEYS } from "@/lib/site-domain-words";
import { restoreSiteVersionAction, unpublishSiteAction } from "../actions";
import type { EditorVersion, EditorVisits } from "./types";

/**
 * PUBLISH (the fifth screen, grown — website-two): where the site stands and where it lives, the "Ready to publish"
 * card with a link to each thing missing, Publish and Unpublish, the versions with Restore and Back to published,
 * and the thirty days of page views counted on the server.
 */

const CHECK: Record<SiteCheck, { key: TranslationKey; section: string | null }> = {
  LOGO: { key: "siteEditor.checkLogo", section: null },
  ABOUT: { key: "siteEditor.checkAbout", section: "about" },
  HERO_PICTURE: { key: "siteEditor.checkHero", section: "look" },
  CONTACT: { key: "siteEditor.checkContact", section: "about" },
  ADMISSIONS: { key: "siteEditor.checkAdmissions", section: "page:ADMISSIONS" },
  PICTURE_CONSENT: { key: "siteEditor.checkConsent", section: "page:GALLERY" },
  DOMAIN: { key: "siteEditor.checkDomain", section: null },
};

export function PublishSection(props: {
  published: boolean;
  publishedAt: string | null;
  address: string | null;
  localPath: string;
  domain: { name: string; status: string } | null;
  checklist: { code: SiteCheck; done: boolean }[];
  versions: EditorVersion[];
  visits: EditorVisits;
  when: (iso: string) => string;
  goTo: (section: string) => void;
  onRestored: (config: SiteConfig, draftVersion?: number) => void;
  publishing: boolean;
  onPublish: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [downPending, startDown] = useTransition();
  const [restoring, startRestore] = useTransition();
  const [showVersions, setShowVersions] = useState(false);
  const done = props.checklist.filter((c) => c.done).length;

  const restore = (versionId: string | null) => {
    if (!window.confirm(t(versionId ? "siteEditor.restoreConfirm" : "siteEditor.revertConfirm"))) return;
    startRestore(async () => {
      const r = await restoreSiteVersionAction(versionId);
      if (!r.ok || !r.config) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      props.onRestored(r.config, r.draftVersion);
      toast({ tone: "ok", title: t(versionId ? "siteEditor.restored" : "siteEditor.reverted") });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card data-testid="site-checklist">
        <CardHeader title={t("siteEditor.readyTitle", { done, total: props.checklist.length })} description={t("siteEditor.readyIntro")} />
        <CardBody>
          <ul className="space-y-1">
            {props.checklist.map((c) => {
              const item = CHECK[c.code];
              const label = t(item.key);
              return (
                <li key={c.code} className="flex min-h-11 items-center gap-2 text-sm">
                  {c.done ? <CheckCircleIcon aria-hidden="true" weight="fill" className="size-5 text-ok" /> : <CircleIcon aria-hidden="true" className="size-5 text-fg-subtle" />}
                  <span className="sr-only">{t(c.done ? "siteEditor.checkDone" : "siteEditor.checkMissing")}</span>
                  {c.done ? (
                    <span className="text-fg">{label}</span>
                  ) : c.code === "LOGO" ? (
                    <Link href="/admin/settings" className="text-accent-strong underline">
                      {label}
                    </Link>
                  ) : c.code === "DOMAIN" ? (
                    <Link href="/admin/website/domain" className="text-accent-strong underline">
                      {label}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => item.section && props.goTo(item.section)} className="text-left text-accent-strong underline">
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("website.publishTitle")}
          description={props.published && props.publishedAt ? t("website.publishedSince", { when: props.when(props.publishedAt) }) : t("website.notPublished")}
          action={props.published ? <Badge tone="ok">{t("website.liveBadge")}</Badge> : <Badge>{t("website.draftBadge")}</Badge>}
        />
        <CardBody className="space-y-4">
          {props.address ? (
            <div data-testid="site-address">
              <p className="text-sm font-medium text-fg">{t("website.siteAddressLabel")}</p>
              <a className="inline-flex min-h-11 items-center break-all text-base font-semibold text-accent-strong underline" href={props.address} target="_blank" rel="noopener noreferrer">
                {props.address}
              </a>
            </div>
          ) : (
            <div className="space-y-2" data-testid="site-awaiting-domain">
              <p className="text-sm text-fg">{t(props.published ? "website.publishedAwaitingDomain" : "website.publishBeforeDomain")}</p>
              {props.domain ? <p className="text-xs text-fg-muted">{t("siteEditor.domainState", { domain: props.domain.name, state: t(STATUS_KEYS[props.domain.status as keyof typeof STATUS_KEYS]?.label ?? "siteDomains.statusPendingDns") })}</p> : null}
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/website/domain">{t("website.connectDomain")}</Link>
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={props.onPublish} loading={props.publishing}>
              {props.published ? t("website.publishChanges") : t("website.publish")}
            </Button>
            {props.published ? (
              <>
                <Button asChild variant="secondary">
                  <a href={props.localPath} target="_blank" rel="noopener">
                    {t("website.openHere")}
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={downPending}
                  onClick={() => {
                    if (!window.confirm(t("website.unpublishConfirm"))) return;
                    startDown(async () => {
                      const r = await unpublishSiteAction();
                      if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
                      toast({ tone: "ok", title: t("website.unpublished") });
                      router.refresh();
                    });
                  }}
                >
                  {t("website.unpublish")}
                </Button>
              </>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card data-testid="site-versions">
        <CardHeader
          title={t("siteEditor.versionsTitle")}
          description={t("siteEditor.versionsIntro")}
          action={
            <Button type="button" variant="secondary" size="sm" aria-expanded={showVersions} aria-controls="site-versions-list" onClick={() => setShowVersions((s) => !s)}>
              {t(showVersions ? "siteEditor.versionsHide" : "siteEditor.versionsShow", { count: props.versions.length })}
            </Button>
          }
        />
        {showVersions ? (
          <CardBody id="site-versions-list" className="space-y-3">
            {props.published ? (
              <Button type="button" variant="secondary" size="sm" loading={restoring} onClick={() => restore(null)}>
                {t("siteEditor.backToPublished")}
              </Button>
            ) : null}
            {props.versions.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("siteEditor.versionsNone")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {props.versions.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="text-sm">
                      <p className="font-medium text-fg">
                        {props.when(v.renderedAt)} {v.live ? <Badge tone="ok" size="sm">{t("siteEditor.versionLive")}</Badge> : null}
                      </p>
                      <p className="text-xs text-fg-muted">{v.nightly ? t("siteEditor.versionNightly") : v.byName ? t("siteEditor.versionBy", { name: v.byName }) : t("siteEditor.versionByGone")}</p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" loading={restoring} onClick={() => restore(v.id)}>
                      {t("siteEditor.restore")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        ) : null}
      </Card>

      <Card data-testid="site-visits">
        <CardHeader title={t("siteEditor.visitsTitle")} description={t("siteEditor.visitsIntro")} />
        <CardBody className="space-y-3">
          <p className="text-sm text-fg">{t("siteEditor.visitsTotal", { count: props.visits.total })}</p>
          <Sparkline days={props.visits.days} label={t("siteEditor.visitsChart", { count: props.visits.total })} />
          {props.visits.pages.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {props.visits.pages.slice(0, 8).map((p) => (
                <li key={p.page} className="flex justify-between gap-3">
                  <span className="text-fg">/{p.page === "home" ? "" : p.page}</span>
                  <span className="tabular-nums text-fg-muted">{p.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">{t("siteEditor.visitsNone")}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/** Thirty days of views as a line: one point a day, the highest at the top. Its words are its label. */
function Sparkline({ days, label }: { days: { dateKey: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const w = 300;
  const h = 48;
  const step = days.length > 1 ? w / (days.length - 1) : w;
  const points = days.map((d, i) => `${(i * step).toFixed(1)},${(h - 4 - (d.count / max) * (h - 8)).toFixed(1)}`).join(" ");
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="h-12 w-full max-w-sm text-accent" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
