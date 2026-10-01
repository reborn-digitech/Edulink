import type { Metadata } from "next";
import Link from "next/link";
import {
  BellIcon,
  DevicesIcon,
  PaletteIcon,
  TranslateIcon,
  UserIcon,
  DeviceMobileIcon,
  UsersThreeIcon,
  CertificateIcon,
  CaretRightIcon,
  UserMinusIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getSession, listContexts, DEFAULT_PREFS, type UserPrefs } from "@/lib/session";
import { readJson } from "@/lib/json";
import { formatPhone } from "@/lib/phone";
import { relativeTime } from "@/lib/dates";
import { HANDLE_DOMAIN, toDisplayLoginName } from "@/lib/login-name";
import { hasRecord } from "@/lib/student-record";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/push-toggle";
import { AppearanceForm } from "./appearance-form";
import { LanguageForm } from "./language-form";
import { EmailForm } from "./email-form";
import { MobileForm } from "./mobile-form";
import { DeviceList } from "./device-list";
import { TotpCard } from "./totp-card";
import { twoFactorStatus } from "@/lib/two-factor";
import { ROLE_META, type Role } from "@/lib/constants";
import { switchContext } from "@/app/switch/actions";
import { getT } from "@/lib/i18n/server";
import { TabBar } from "@/components/ui/tabs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.yourAccount") };
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "prefs" || rawTab === "devices" ? rawTab : "profile";
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
        phone: true,
        phoneVerifiedAt: true,
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
  const isHandle = user.email?.endsWith(`@${HANDLE_DOMAIN}`) ?? false;

  const showRecord = await hasRecord(session);
  // Two-step sign-in is offered to the office, the head and the operator alone.
  const twoFactor = await twoFactorStatus(session.user.id);

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
                  {toDisplayLoginName(user.email)}
                </code>
              </>
            ) : (
              (user.email ?? t("account.noEmail"))
            )}
          </p>
        </div>
      </div>

      {/* Eight cards in a column made a scroll; three tabs make a page.
          Anything that was here is still here, one press away. */}
      <TabBar
        ariaLabel={t("nav.account")}
        current={tab}
        tabs={[
          { key: "profile", href: "/account", label: t("account.tabProfile") },
          { key: "prefs", href: "/account?tab=prefs", label: t("account.tabPrefs") },
          { key: "devices", href: "/account?tab=devices", label: t("account.tabDevices"), count: sessions.length },
        ]}
      />

      <div hidden={tab !== "profile"} className="space-y-5">
      {/* ---------- how you sign in ---------- */}
      <Card>
        <CardHeader
          icon={<DeviceMobileIcon weight="duotone" className="size-5" />}
          title={t("account.signInTitle")}
          description={t("account.signInDescription")}
        />
        <CardBody className="space-y-5">
          <EmailForm
            current={user.email}
            confirmed={user.emailVerifiedAt !== null}
            isHandle={isHandle}
            loginName={toDisplayLoginName(user.email)}
          />
          <div className="border-t border-border pt-5">
            <MobileForm current={user.phone} confirmed={user.phoneVerifiedAt !== null} />
          </div>
        </CardBody>
      </Card>

      {/* ---------- two-step sign-in ---------- */}
      {twoFactor.eligible && <TotpCard enabled={twoFactor.enabled} recoveryLeft={twoFactor.recoveryLeft} available={twoFactor.available} />}

      {/* ---------- roles ---------- */}
      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title={t("account.belongTitle")}
          description={
            /**
             * THREE STATES, NOT TWO. "You can switch at any time" over an empty
             * list is what this card said to an alumnus the moment `/account`
             * became reachable without a role — a heading, a reassurance about
             * switching, and nothing to switch between. Somebody who has left
             * every school is exactly who this page now exists for.
             */
            contexts.memberships.length + contexts.children.length === 0
              ? t("account.belongNone")
              : contexts.memberships.length + contexts.children.length === 1
                ? t("account.belongOne")
                : t("account.belongMany")
          }
        />
        <CardBody>
          {contexts.memberships.length + contexts.children.length === 0 && (
            <p className="text-sm leading-relaxed text-fg-muted">{t("account.belongNoneBody")}</p>
          )}
          {/* Each row IS the switch. This list used to be a picture of the
              picker at /switch — the same schools, drawn again, with nothing
              to press — so changing school from here was two clicks: Switch,
              then the school. Now the row you are not on is a form that posts
              the same server action the picker does, and the row you are on
              says so instead of offering to take you where you already are. */}
          <ul className="space-y-1.5">
            {contexts.memberships.map((membership) => {
              const here =
                live.role === membership.role && live.schoolId === membership.schoolId;
              return (
                <li key={membership.membershipId}>
                  <BelongRow
                    here={here}
                    title={membership.schoolName}
                    roleLabel={t(ROLE_META[membership.role as Role].labelKey)}
                    hereLabel={t("account.hereNow")}
                    goLabel={t("account.goThere")}
                    schoolId={membership.schoolId}
                    role={membership.role}
                  />
                </li>
              );
            })}
            {contexts.children.length > 0 && (
              <li>
                <BelongRow
                  here={live.role === "PARENT"}
                  // The same words the switcher uses: one child by name, a
                  // family by count, and a school's stand-in for forty
                  // guardianless pupils as what it is — not forty names.
                  title={
                    contexts.children.every((c) => c.relation === "SCHOOL")
                      ? t("switch.standinCount", { count: contexts.children.length })
                      : contexts.children.length === 1
                        ? contexts.children[0]!.name
                        : t("switch.childrenCount", { count: contexts.children.length })
                  }
                  roleLabel={t("role.parent")}
                  hereLabel={t("account.hereNow")}
                  goLabel={t("account.goThere")}
                  schoolId={null}
                  role="PARENT"
                />
              </li>
            )}
          </ul>
        </CardBody>
      </Card>

      {/* ---------- the permanent record ---------- */}
      {/*
        Only shown to somebody who has one. A teacher with no pupil history and
        no children would be offered a page that says "nothing here yet", which
        is a worse answer than not offering it.
      */}
      {showRecord && (
        <Card>
          <CardHeader
            icon={<CertificateIcon weight="duotone" className="size-5" />}
            title={t("account.recordTitle")}
            description={t("account.recordDescription")}
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href="/record">{t("account.recordAction")}</Link>
              </Button>
            }
          />
        </Card>
      )}

      {/* ---------- closing the account ----------
        No button, on purpose: the school is the fiduciary and closes an
        account by ending the membership (docs/decisions/0002). The page says
        how; Play's deletion requirement points at the same page signed out. */}
      <Card>
        <CardHeader
          icon={<UserMinusIcon weight="duotone" className="size-5" />}
          title={t("account.closeTitle")}
          description={t("account.closeDescription")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/delete-account">{t("account.closeAction")}</Link>
            </Button>
          }
        />
      </Card>

      {/* ---------- another account ---------- */}
      {/*
        Signposted from the account page and nowhere else, because the actor is
        the person. It is here rather than buried because the people who need it
        do not know the word "merge" — they know "I changed school and had to
        start again", which is what the description says.
      */}
      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("account.mergeTitle")}
          description={t("account.mergeDescription")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/account/merge">{t("account.mergeAction")}</Link>
            </Button>
          }
        />
      </Card>

      </div>

      {/* ---------- preferences: notifications, language, appearance ---------- */}
      <div hidden={tab !== "prefs"} className="space-y-5">
        <Card>
          <CardHeader
            icon={<BellIcon weight="duotone" className="size-5" />}
            title={t("account.notificationsTitle")}
            description={t("account.notificationsDescription")}
          />
          <CardBody className="space-y-4">
            <PushToggle />
            <AppearanceForm prefs={prefs} section="notifications" phone={user.phone ? formatPhone(user.phone) : null} />
          </CardBody>
          <CardHeader
            id="language"
            icon={<TranslateIcon weight="duotone" className="size-5" />}
            title={t("language.title")}
            description={t("language.description")}
            className="scroll-mt-20 border-t border-border"
          />
          <CardBody>
            <LanguageForm />
          </CardBody>
          <CardHeader
            icon={<PaletteIcon weight="duotone" className="size-5" />}
            title={t("account.appearanceTitle")}
            description={t("account.appearanceDescription")}
            className="border-t border-border"
          />
          <CardBody>
            <AppearanceForm prefs={prefs} section="appearance" />
          </CardBody>
        </Card>
      </div>

      {/* ---------- devices ---------- */}
      <div hidden={tab !== "devices"}>
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
              // The relative times inside are VALUES and render in English —
              // the sentence around them is the part that translates.
              meta: t("account.deviceMeta", {
                lastSeen: relativeTime(s.lastSeenAt),
                since: relativeTime(s.createdAt),
              }),
            }))}
          />
        </CardBody>
      </Card>
      </div>

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

/**
 * One place this person belongs, as a row that takes them there.
 *
 * The row they are already on is not a button: pressing "go" to where you
 * already are is a round trip that changes nothing, and a row that cannot be
 * pressed says "you're here" instead. Everything else posts `switchContext`,
 * which re-checks the membership before it writes — the form is a request,
 * not a fact, exactly as it is on /switch.
 */
function BelongRow({
  here,
  title,
  roleLabel,
  hereLabel,
  goLabel,
  schoolId,
  role,
}: {
  here: boolean;
  title: string;
  roleLabel: string;
  hereLabel: string;
  goLabel: string;
  schoolId: string | null;
  role: Role;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{title}</span>
        <span className="block text-xs text-fg-muted">{roleLabel}</span>
      </span>
      {here ? (
        <Badge tone="accent" size="sm">
          {hereLabel}
        </Badge>
      ) : (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
          {goLabel}
          <CaretRightIcon weight="bold" className="size-4" aria-hidden="true" />
        </span>
      )}
    </>
  );
  if (here) {
    return (
      <div
        aria-current="true"
        className="flex items-center justify-between gap-3 rounded-[--radius-sm] border border-accent/40 bg-accent-soft/40 p-3"
      >
        {body}
      </div>
    );
  }
  return (
    <form action={switchContext}>
      {schoolId && <input type="hidden" name="schoolId" value={schoolId} />}
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        aria-label={[roleLabel, title].join(" — ")}
        className="flex w-full items-center justify-between gap-3 rounded-[--radius-sm] bg-surface-muted p-3 text-left transition-colors hover:bg-surface-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {body}
      </button>
    </form>
  );
}
