import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FacebookLogoIcon, InstagramLogoIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { pagesToPick, socialView } from "@/lib/social";
import { META_PICK_COOKIE } from "@/lib/social-meta";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisconnectButton, PagePicker } from "./panel";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("social.title") };
}

/** The reasons the callback lands back here with, worded. */
const CALLBACK_ERRORS: Record<string, TranslationKey> = {
  denied: "social.errorDenied",
  state: "social.errorState",
  exchange: "social.errorExchange",
  nopages: "social.errorNoPages",
  sealing: "social.noSealing",
  role: "social.refuseRole",
};

/**
 * THE SCHOOL'S FACEBOOK PAGE AND INSTAGRAM ACCOUNT (meta-posting, 16 October 2026). The school's ADMIN connects
 * once: "Connect Facebook" goes through Facebook Login (/api/social/meta/start), the callback lists the Pages the
 * admin manages, and the admin picks one here; the Instagram professional account linked to it, if any, comes with
 * it. From then on the composer of a school-wide post offers "Also post to Facebook" and "Also post to Instagram".
 * With no Meta app on the platform the page says so and offers nothing. The library is src/lib/social.ts.
 */
export default async function SocialSettingsPage({ searchParams }: { searchParams: Promise<{ meta?: string; pick?: string }> }) {
  const ctx = await requireRole("ADMIN");
  const t = await getT();
  const relative = await getRelativeTime();
  const sp = await searchParams;
  const view = await socialView(ctx);
  const connection = view.connection;
  const picks = view.configured && view.sealing ? await pagesToPick(ctx, (await cookies()).get(META_PICK_COOKIE)?.value) : null;
  const callbackError = sp.meta ? CALLBACK_ERRORS[sp.meta] : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("social.title")} description={t("social.intro")} back={{ href: "/admin/settings", label: t("settings.title") }} />

      {callbackError ? (
        <p role="alert" className="rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger" data-testid="social-callback-error">
          {t(callbackError)}
        </p>
      ) : null}

      {!view.configured ? (
        <Card data-testid="social-not-configured">
          <CardHeader icon={<FacebookLogoIcon weight="duotone" className="size-5" />} title={t("social.notConfiguredTitle")} description={t("social.notConfigured")} />
        </Card>
      ) : !view.sealing ? (
        <Card data-testid="social-no-sealing">
          <CardHeader icon={<FacebookLogoIcon weight="duotone" className="size-5" />} title={t("social.notConfiguredTitle")} description={t("social.noSealing")} />
        </Card>
      ) : (
        <>
          {picks ? (
            <Card data-testid="social-pick-card">
              <CardHeader icon={<FacebookLogoIcon weight="duotone" className="size-5" />} title={t("social.pickTitle")} description={t("social.pickIntro")} />
              <CardBody>{picks.ok ? <PagePicker pages={picks.value} /> : <p role="alert" className="text-sm font-medium text-danger">{t("social.pickFailed")}</p>}</CardBody>
            </Card>
          ) : null}

          {connection ? (
            <Card data-testid="social-connection" data-reconnect={connection.needsReconnect ? "1" : "0"}>
              <CardHeader
                icon={<FacebookLogoIcon weight="duotone" className="size-5" />}
                title={connection.pageName}
                description={t("social.connectedWhen", { when: relative(new Date(connection.connectedAt)) })}
                action={connection.needsReconnect ? <Badge tone="danger">{t("social.reconnectBadge")}</Badge> : <Badge tone="ok">{t("social.connectedBadge")}</Badge>}
              />
              <CardBody className="space-y-4">
                {connection.needsReconnect ? (
                  <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-danger-soft p-3 text-sm text-danger" data-testid="social-reconnect">
                    <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
                    <span>{t("social.reconnectBody")}</span>
                  </p>
                ) : null}
                <p className="flex items-center gap-2 text-sm text-fg">
                  <InstagramLogoIcon weight="duotone" className="size-5 shrink-0 text-fg-muted" />
                  {connection.igUsername ? t("social.instagramLinked", { username: connection.igUsername }) : t("social.instagramNone")}
                </p>
                {connection.lastCheckedAt ? <p className="text-xs text-fg-subtle">{t("social.lastChecked", { when: relative(new Date(connection.lastCheckedAt)) })}</p> : null}
                <p className="text-xs text-fg-muted">{t("social.leavesPlatform")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant={connection.needsReconnect ? "primary" : "secondary"}>
                    <a href="/api/social/meta/start">{connection.needsReconnect ? t("social.reconnect") : t("social.connectAnother")}</a>
                  </Button>
                  <DisconnectButton pageId={connection.pageId} pageName={connection.pageName} />
                </div>
              </CardBody>
            </Card>
          ) : !picks ? (
            <Card data-testid="social-connect-card">
              <CardHeader icon={<FacebookLogoIcon weight="duotone" className="size-5" />} title={t("social.connectTitle")} description={t("social.connectIntro")} />
              <CardBody className="space-y-3">
                <p className="text-xs text-fg-muted">{t("social.leavesPlatform")}</p>
                <Button asChild>
                  <a href="/api/social/meta/start" data-testid="social-connect">
                    {t("social.connect")}
                  </a>
                </Button>
              </CardBody>
            </Card>
          ) : null}

          <p className="text-xs text-fg-subtle">{t("social.deleteNote")}</p>
        </>
      )}
    </div>
  );
}
