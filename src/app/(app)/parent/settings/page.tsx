import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, GearIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listContexts, DEFAULT_PREFS, type UserPrefs } from "@/lib/session";
import { readJson } from "@/lib/json";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/push-toggle";
import { AppearanceForm } from "@/app/account/appearance-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.settings") };
}

/**
 * Parent settings.
 *
 * The nav has always linked here and the command palette calls it "Notification
 * settings", so this page owns exactly that: the channels a guardian is reached
 * on, and the hours they are left alone. Appearance, devices and signing out
 * stay on /account rather than being duplicated — two pages that both write
 * `User.prefs` drift, and the one a parent lands on first wins by accident.
 *
 * The empty case is handled before this renders: `requireParent` sends a user
 * with no ACTIVE guardianship to /parent/link, because settings about children
 * you have not linked yet is not a page, it is a dead end.
 */
export default async function ParentSettingsPage() {
  const session = await requireParent();
  const t = await getT();

  const [user, contexts] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { prefs: true },
    }),
    listContexts(session.user.id),
  ]);

  const prefs = readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);
  const { children } = contexts;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("parent.settings")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("parent.settingsBody")}</p>
      </div>

      {/* ---------- notifications ---------- */}
      <Card>
        <CardHeader
          icon={<BellIcon weight="duotone" className="size-5" />}
          title={t("parent.notifications")}
          description={t("parent.whatYouAreTold")}
        />
        <CardBody className="space-y-4">
          <PushToggle />
          <AppearanceForm prefs={prefs} section="notifications" />
        </CardBody>
      </Card>

      {/* ---------- children ---------- */}
      <Card>
        <CardHeader
          icon={<UsersIcon weight="duotone" className="size-5" />}
          title={t("parent.whoYouHearAbout")}
          description={
            children.length === 1 ? "One child linked" : `${children.length} children linked`
          }
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/parent/link">{t("parent.linkAnotherShort")}</Link>
            </Button>
          }
        />
        <CardBody>
          <ul className="space-y-1.5">
            {children.map((child) => (
              <li
                key={child.guardianshipId}
                className="flex items-center justify-between gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar avatarKey={null} name={child.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{child.name}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {child.schoolName}
                    </span>
                  </span>
                </span>
                <Badge tone="accent" size="sm">
                  {t("parent.linked")}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            These settings apply to every child above. Turning notifications off here stops
            messages about all of them.
          </p>
        </CardBody>
      </Card>

      {/* ---------- everything else ---------- */}
      <Card>
        <CardHeader
          icon={<GearIcon weight="duotone" className="size-5" />}
          title={t("parent.yourAccount")}
          description={t("parent.accountBody")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/account">{t("parent.open")}</Link>
            </Button>
          }
        />
      </Card>
    </div>
  );
}
