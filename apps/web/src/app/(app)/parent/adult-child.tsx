import Link from "next/link";
import { CheckCircleIcon, ChartBarIcon, HandshakeIcon, LockSimpleIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { STUDENT_CONSENT_GRANTS, type StudentConsentGrant } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AttendanceTable } from "@/components/academics/parts";
import { PersonLink } from "@/components/person-link";
import { PAGE_TITLE } from "@/components/ui/page-header";
import { InstallCard } from "@/components/install-card";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n/server";
import { familyLectureAttendance } from "@/lib/family-college";
import type { FamilyChild } from "@/lib/family-child";
import type { ActiveContext } from "@/lib/session";
import { ChildSwitcher } from "./child-switcher";

/** Where each grant's page is, for the guardian (the entries of the family's nav that the grant opens). */
const GRANT_PAGES: Record<StudentConsentGrant, { href: string; byChild: boolean }[]> = {
  ATTENDANCE: [{ href: "/parent/academics", byChild: true }],
  RESULTS: [{ href: "/parent/results", byChild: true }],
  MONEY: [{ href: "/parent/money", byChild: true }],
  HOSTEL_TRANSPORT: [
    { href: "/parent/hostel", byChild: true },
    { href: "/parent/transport", byChild: true },
  ],
  PLACEMENT: [{ href: "/parent/placement", byChild: true }],
  MESSAGES: [{ href: "/remarks", byChild: false }],
};

/**
 * THE PARENT'S HOME FOR AN ADULT CHILD AT A COLLEGE (DS-1, 10 Oct 2026). The
 * ordinary home draws a school day — today's register, the streak, the
 * lessons, the homework due — none of which a college keeps, and all of
 * which the guardianship check refuses for an adult who has granted nothing.
 * So an adult's home says what they share: one line per grant, on or off,
 * each on one opening the page it guards; and, when attendance is shared,
 * the lecture attendance itself, since that is the figure a guardian comes
 * for. The switcher keeps the other children a tap away.
 */
export async function AdultChildHome({ session, child, pupils }: { session: ActiveContext; child: FamilyChild; pupils: FamilyChild[] }) {
  const t = await getT();
  const on = new Set(child.grants);
  const attendance = on.has("ATTENDANCE") ? await familyLectureAttendance(session, child.studentMembershipId) : null;
  return (
    <div className="space-y-6" data-testid="adult-child-home">
      {pupils.length > 1 && <ChildSwitcher pupils={pupils} selectedId={child.studentMembershipId} />}

      <div className="flex items-center gap-4">
        <Avatar avatarKey={null} name={child.name} size="lg" />
        <div className="min-w-0">
          <h1 className={cn(PAGE_TITLE, "block truncate")}>
            <PersonLink membershipId={child.studentMembershipId} name={child.name} />
          </h1>
          <p className="text-sm text-fg-muted">{child.schoolName}</p>
        </div>
      </div>

      <Card>
        <CardHeader icon={<HandshakeIcon weight="duotone" className="size-5" />} title={t("familyGaps.sharesTitle", { name: child.name })} description={t("familyGaps.sharesBody", { name: child.name })} />
        <CardBody>
          <ul className="divide-y divide-border" data-testid="adult-child-grants">
            {STUDENT_CONSENT_GRANTS.map((grant) => {
              const shared = on.has(grant);
              return (
                <li key={grant} className="flex flex-wrap items-center justify-between gap-3 py-2.5" data-grant={grant} data-shared={shared ? "on" : "off"}>
                  <span className="flex min-w-0 items-center gap-2">
                    {shared ? <CheckCircleIcon weight="duotone" className="size-5 shrink-0 text-ok" /> : <LockSimpleIcon weight="duotone" className="size-5 shrink-0 text-fg-muted" />}
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-fg">{t(`consent.grant.${grant}.name`)}</span>
                      <span className="block text-xs text-fg-muted">{shared ? t("familyGaps.grantOn") : t("familyGaps.grantOff")}</span>
                    </span>
                  </span>
                  {shared ? (
                    <span className="flex flex-wrap gap-2">
                      {GRANT_PAGES[grant].map((page) => (
                        <Button key={page.href} asChild size="sm" variant="secondary">
                          <Link href={page.byChild ? `${page.href}?child=${child.studentMembershipId}` : page.href}>{t("familyGaps.open")}</Link>
                        </Button>
                      ))}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {attendance ? (
        <Card>
          <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("familyGaps.lectureAttendanceTitle", { name: child.name })} description={t("familyGaps.lectureAttendanceBody")} />
          <CardBody>
            <AttendanceTable t={t} rows={attendance} />
          </CardBody>
        </Card>
      ) : null}

      <div className="flex justify-center pb-4">
        <Button asChild variant="secondary" icon={<PlusIcon weight="bold" />}>
          <Link href="/parent/link">{t("parent.linkAnother")}</Link>
        </Button>
      </div>
      <InstallCard />
    </div>
  );
}
