import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, DownloadSimpleIcon, GearIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listContexts, DEFAULT_PREFS, type UserPrefs } from "@/lib/session";
import { readJson } from "@/lib/json";
import { formatPhone } from "@/lib/phone";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/push-toggle";
import { AppearanceForm } from "@/app/account/appearance-form";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { UnlinkChild } from "./unlink-child";
import { FamilyAssistantCard } from "@/components/assistant/family-card";
import { mayUse } from "@/lib/platform-features";

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
      select: { prefs: true, phone: true },
    }),
    listContexts(session.user.id),
  ]);

  const prefs = readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);
  const { children } = contexts;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("parent.settings")} description={t("parent.settingsBody")} />

      {/* ---------- notifications ---------- */}
      <Card>
        <CardHeader
          icon={<BellIcon weight="duotone" className="size-5" />}
          title={t("parent.notifications")}
          description={t("parent.whatYouAreTold")}
        />
        <CardBody className="space-y-4">
          <PushToggle />
          <AppearanceForm prefs={prefs} section="notifications" phone={user.phone ? formatPhone(user.phone) : null} />
        </CardBody>
      </Card>

      {/* ---------- children ---------- */}
      <Card>
        <CardHeader
          icon={<UsersIcon weight="duotone" className="size-5" />}
          title={t("parent.whoYouHearAbout")}
          description={
            children.length === 1 ? t("parent.oneChildLinked") : t("parent.childrenLinked", { count: children.length })
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3"
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
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="accent" size="sm">
                    {t("parent.linked")}
                  </Badge>
                  {/* The school's stand-in link is the school's to end: only a family link offers "Remove". */}
                  {child.relation !== "SCHOOL" && <UnlinkChild studentMembershipId={child.studentMembershipId} name={child.name} />}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            {t("parent.settingsApplyAll")}
          </p>
        </CardBody>
      </Card>

      {/* ---------- the assistant, per child (Phase C, 10 Oct 2026) ----------
          On by default for every pupil (decision 0005); the guardian turns it off for a child here, and the
          assistant's first screen sends a guardian to this card (#assistant). */}
      {(await mayUse("ASSISTANT", session)) && <FamilyAssistantCard />}

      {/* ---------- the family's own data (DPDP s.11) ---------- */}
      <Card>
        <CardHeader
          icon={<DownloadSimpleIcon weight="duotone" className="size-5" />}
          title={t("exports.myDataTitle")}
          description={t("exports.childDataBody")}
        />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-3" data-testid="family-export">
            {children.map((child) => (
              <Button key={child.guardianshipId} asChild size="sm" variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
                <a href={`/api/v1/family/export?student=${child.studentMembershipId}`} download>
                  {t("exports.downloadFor", { name: child.name })}
                </a>
              </Button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">{t("exports.fewPerHour")}</p>
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
