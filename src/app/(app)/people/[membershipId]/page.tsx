import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ChalkboardTeacherIcon, PaperPlaneTiltIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { isStaffRole, mayConverse, standingAt } from "@/lib/conversations";
import { readJsonArray } from "@/lib/json";
import { formatInZone } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ROLE_META, type Role } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { openConversationAction } from "../../remarks/conversation-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("person.meta"), robots: { index: false, follow: false } };
}

/**
 * Somebody at the school, seen by somebody else at the school.
 *
 * The one page the social feed and the people picker point at: a name, a
 * role, what they teach or which class they are in, since when — and the
 * door to write to them, when the rule in `mayConverse` allows it. Nothing
 * private lives here: no marks, no attendance, no contact details. It is a
 * staff-room noticeboard portrait, not a record.
 *
 * WHO MAY LOOK. Anyone standing at the school may open a staff member's
 * page. A pupil's page opens for staff and for that pupil's own guardians;
 * a pupil cannot browse other pupils, and a parent cannot browse the roll.
 * Refusals are 404s, so the page never confirms who is on the roll.
 */
export default async function PersonPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const t = await getT();
  const session = await requireUser();
  const { membershipId } = await params;

  const member = await db.membership.findFirst({
    where: { id: membershipId, status: "ACTIVE", leftAt: null },
    select: {
      id: true,
      schoolId: true,
      role: true,
      subjects: true,
      joinedAt: true,
      userId: true,
      user: { select: { name: true, preferredName: true, avatarKey: true, bio: true } },
      school: { select: { name: true, timezone: true } },
      classTeachers: {
        where: { class: { archivedAt: null } },
        select: { role: true, class: { select: { id: true, name: true } } },
        orderBy: { class: { name: "asc" } },
      },
      enrollments: {
        where: { status: "ACTIVE", class: { archivedAt: null } },
        select: { class: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });
  if (!member) notFound();

  const me = await standingAt(session, member.schoolId);
  if (!me) notFound();
  const role = member.role as Role;
  const self = member.userId === session.user.id;

  if (role === "STUDENT" && !isStaffRole(me) && !self) {
    const guardian = await db.guardianship.findFirst({
      where: { parentUserId: session.user.id, studentMembershipId: member.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (!guardian) notFound();
  }

  const name = member.user.preferredName ?? member.user.name;
  const subjects = readJsonArray<string>(member.subjects);
  const leads = member.classTeachers.filter((ct) => ct.role === "LEAD" || ct.role === "CO");
  const teaches = member.classTeachers.filter((ct) => ct.role === "SUBJECT");
  const canMessage = !self && mayConverse(me, role);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/remarks/people" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("convo.pickPerson")}
      </Link>

      {/* Stacked on a phone, a row on a desk: an avatar, a name and a button
          sharing one row at 360px squeezed the name into one word a line. */}
      <header className="flex flex-col gap-4 rounded-[--radius-lg] border border-border bg-surface p-5 sm:flex-row sm:items-center">
        <Avatar avatarKey={member.user.avatarKey} name={name} size="lg" ring />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-fg">
            {name}
            <Badge tone="accent" size="sm">
              {t(ROLE_META[role].labelKey)}
            </Badge>
          </h1>
          <p className="mt-0.5 text-sm text-fg-muted">
            {t("person.atSince", {
              school: member.school.name,
              date: formatInZone(member.joinedAt, member.school.timezone, { month: "long", year: "numeric" }),
            })}
          </p>
          {member.user.bio && <p className="mt-2 max-w-prose text-sm leading-relaxed text-fg">{member.user.bio}</p>}
        </div>
        {canMessage ? (
          <form action={openConversationAction} className="sm:shrink-0">
            <input type="hidden" name="schoolId" value={member.schoolId} />
            <input type="hidden" name="userId" value={member.userId} />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:w-auto"
            >
              <PaperPlaneTiltIcon weight="bold" className="size-4" />
              {t("person.message")}
            </button>
          </form>
        ) : self ? (
          <Badge tone="neutral">{t("person.thisIsYou")}</Badge>
        ) : (
          <p className="max-w-[16rem] text-xs text-fg-muted">{t("person.cannotMessage")}</p>
        )}
      </header>

      {role === "TEACHER" && (
        <Card>
          <CardHeader
            icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
            title={t("person.teaching")}
            description={subjects.length > 0 ? subjects.join(" · ") : t("person.noSubjectsYet")}
          />
          {(leads.length > 0 || teaches.length > 0) && (
            <CardBody className="space-y-3">
              {leads.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("person.classTeacherOf")}</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {leads.map((ct) => (
                      <li key={ct.class.id}>
                        <Badge tone="accent" size="sm">{ct.class.name}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {teaches.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("person.subjectTeacherIn")}</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {teaches.map((ct) => (
                      <li key={ct.class.id}>
                        <Badge tone="neutral" size="sm">{ct.class.name}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          )}
        </Card>
      )}

      {role === "STUDENT" && (
        <Card>
          <CardHeader
            icon={<UsersThreeIcon weight="duotone" className="size-5" />}
            title={t("person.class")}
            description={member.enrollments[0]?.class.name ?? t("person.noClassYet")}
          />
        </Card>
      )}
    </div>
  );
}
