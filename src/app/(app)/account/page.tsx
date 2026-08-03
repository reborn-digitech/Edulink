import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, DevicesIcon, PaletteIcon, TranslateIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getSession, listContexts, DEFAULT_PREFS, type UserPrefs } from "@/lib/session";
import { readJson } from "@/lib/json";
import { relativeTime } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/push-toggle";
import { AppearanceForm } from "./appearance-form";
import { LanguageForm } from "./language-form";
import { DeviceList } from "./device-list";
import { ROLE_META, type Role } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { status as twoFactorStatus } from "@/lib/two-factor";
import { TwoFactor } from "./two-factor";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const session = await requireUser();
  const live = (await getSession())!;
  const t = await getT();

  const [user, contexts, sessions] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        name: true,
        preferredName: true,
        email: true,
        avatarKey: true,
        prefs: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    }),
    listContexts(session.user.id),
    db.session.findMany({
      where: { userId: session.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, userAgent: true, ip: true, createdAt: true, lastSeenAt: true },
    }),
  ]);

  const prefs = readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);
  const displayName = user.preferredName ?? user.name;
  // A self-joined student's login handle lives in the email column against a
  // non-routable domain; showing "amara@edulink.local" as an email is a lie.
  const isHandle = user.email?.endsWith("@edulink.local") ?? false;

  const twoFactor = await twoFactorStatus(session);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-4">
        <Avatar avatarKey={user.avatarKey} name={user.name} size="lg" ring />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg">{displayName}</h1>
          <p className="truncate text-sm text-fg-muted">
            {isHandle ? (
              <>
                {t("account.loginName")}{" "}
                <code className="rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg">
                  {user.email?.replace("@edulink.local", "")}
                </code>
              </>
            ) : (
              (user.email ?? t("account.noEmail"))
            )}
          </p>
        </div>
      </div>

      <TwoFactor
        enabled={twoFactor.enabled}
        hasPassword={twoFactor.hasPassword}
        remaining={twoFactor.remainingRecoveryCodes}
      />

      {/* ---------- roles ---------- */}
      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title={t("account.belongTitle")}
          description={
            contexts.memberships.length + contexts.children.length === 1
              ? t("account.belongOne")
              : t("account.belongMany")
          }
          action={
            contexts.memberships.length + (contexts.children.length > 0 ? 1 : 0) > 1 ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/switch">{t("account.switch")}</Link>
              </Button>
            ) : null
          }
        />
        <CardBody>
          <ul className="space-y-1.5">
            {contexts.memberships.map((membership) => (
              <li
                key={membership.membershipId}
                className="flex items-center justify-between gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-fg">
                  {membership.schoolName}
                </span>
                <Badge tone="accent" size="sm">
                  {t(ROLE_META[membership.role as Role].labelKey)}
                </Badge>
              </li>
            ))}
            {contexts.children.length > 0 && (
              <li className="flex items-center justify-between gap-3 rounded-[--radius-sm] bg-surface-muted p-3">
                <span className="min-w-0 truncate text-sm font-medium text-fg">
                  {contexts.children.map((c) => c.name).join(", ")}
                </span>
                <Badge tone="accent" size="sm">
                  {t("role.parent")}
                </Badge>
              </li>
            )}
          </ul>
        </CardBody>
      </Card>

      {/* ---------- notifications ---------- */}
      <Card>
        <CardHeader
          icon={<BellIcon weight="duotone" className="size-5" />}
          title={t("account.notificationsTitle")}
          description={t("account.notificationsDescription")}
        />
        <CardBody className="space-y-4">
          <PushToggle />
          <AppearanceForm prefs={prefs} section="notifications" />
        </CardBody>
      </Card>

      {/* ---------- language ---------- */}
      <Card>
        <CardHeader
          icon={<TranslateIcon weight="duotone" className="size-5" />}
          title={t("language.title")}
          description={t("language.description")}
        />
        <CardBody>
          <LanguageForm />
        </CardBody>
      </Card>

      {/* ---------- appearance ---------- */}
      <Card>
        <CardHeader
          icon={<PaletteIcon weight="duotone" className="size-5" />}
          title={t("account.appearanceTitle")}
          description={t("account.appearanceDescription")}
        />
        <CardBody>
          <AppearanceForm prefs={prefs} section="appearance" />
        </CardBody>
      </Card>

      {/* ---------- devices ---------- */}
      <Card>
        <CardHeader
          icon={<DevicesIcon weight="duotone" className="size-5" />}
          title={t("account.devicesTitle")}
          description={t("account.devicesCount", { count: sessions.length })}
        />
        <CardBody>
          <DeviceList
            currentSessionId={live.sessionId}
            devices={sessions.map((s) => ({
              id: s.id,
              label: describeDevice(s.userAgent) ?? t("account.unknownDevice"),
              ip: s.ip,
              lastSeen: relativeTime(s.lastSeenAt),
              since: relativeTime(s.createdAt),
            }))}
          />
        </CardBody>
      </Card>

      <form action="/api/auth/logout" method="post" className="pb-4">
        <Button type="submit" variant="secondary" block>
          {t("shell.signOut")}
        </Button>
      </form>
    </div>
  );
}

/**
 * Turns a user-agent string into something a parent can recognise.
 *
 * Deliberately coarse. Precise UA parsing needs a library that goes stale, and
 * "Chrome on Android" is all anyone needs to answer "is that phone mine?".
 */
function describeDevice(userAgent: string | null): string | null {
  // Null rather than a string, so the ONE part of this that is prose rather
  // than a product name gets translated by the caller. "Chrome on Android" is
  // two proper nouns and stays as it is in every language.
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();

  const os = ua.includes("android")
    ? "Android"
    : ua.includes("iphone")
      ? "iPhone"
      : ua.includes("ipad")
        ? "iPad"
        : ua.includes("mac os")
          ? "Mac"
          : ua.includes("windows")
            ? "Windows"
            : ua.includes("linux")
              ? "Linux"
              : "Unknown";

  // Order matters: Edge and Chrome both claim Safari, Chrome claims Edge's
  // token in reverse. Most specific first.
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("firefox")
      ? "Firefox"
      : ua.includes("chrome") || ua.includes("crios")
        ? "Chrome"
        : ua.includes("safari")
          ? "Safari"
          : "Browser";

  return `${browser} on ${os}`;
}
