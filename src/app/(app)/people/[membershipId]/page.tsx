import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  BuildingsIcon,
  ChalkboardTeacherIcon,
  MedalIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { isStaffRole, mayConverse, standingAt } from "@/lib/conversations";
import { getBadges } from "@/lib/badges";
import { readJsonArray } from "@/lib/json";
import { formatInZone } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PersonLink } from "@/components/person-link";
import { ROLE_META, type Role } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { openConversationAction } from "../../remarks/conversation-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("person.meta"), robots: { index: false, follow: false } };
}

/**
 * The class page the VIEWER may open for a class, or none. Three roles have
 * a class page each and a pupil or a parent has none — so a class on a
 * profile is a link for the office and a word for everybody else.
 */
function classHref(viewer: Role, classId: string): string | null {
  if (viewer === "ADMIN") return `/admin/classes/${classId}`;
  if (viewer === "PRINCIPAL") return `/principal/classes/${classId}`;
  if (viewer === "TEACHER") return `/teacher/classes/${classId}`;
  return null;
}

/**
 * Somebody at the school, seen by somebody else at the school.
 *
 * The one page every name in the app now points at: who they are, where
 * they stand at the school, what they teach or which class they are in and
 * who teaches it, the badges a pupil has earned — and the door to write to
 * them, when the rule in `mayConverse` allows it. Nothing private lives
 * here: no marks, no attendance, no contact details. It is a staff-room
 * noticeboard portrait, not a record. Every fact on it is a link where the
 * viewer has a page for it: the school's public profile, a class, a
 * colleague.
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
      school: {
        select: {
          name: true,
          timezone: true,
          city: true,
          profilePublishedAt: true,
          _count: { select: { jobPostings: { where: { status: "OPEN" } } } },
        },
      },
      classTeachers: {
        where: { class: { archivedAt: null } },
        select: {
          role: true,
          class: { select: { id: true, name: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } },
        },
        orderBy: { class: { name: "asc" } },
      },
      enrollments: {
        where: { status: "ACTIVE", class: { archivedAt: null } },
        select: {
          class: {
            select: {
              id: true,
              name: true,
              teachers: {
                where: { role: { in: ["LEAD", "CO"] } },
                select: { teacher: { select: { id: true, user: { select: { name: true, preferredName: true } } } } },
              },
            },
          },
        },
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
  const pupilsTaught = new Set(member.classTeachers.map((ct) => ct.class.id)).size
    ? member.classTeachers.reduce((n, ct) => n + ct.class._count.enrollments, 0)
    : 0;
  const canMessage = !self && mayConverse(me, role);
  // The school's public profile opens for anyone signed in once it is
  // published or hiring — the same rule the directory uses — so the name
  // links only then; otherwise it is the fact and not a door.
  const schoolHref =
    member.school.profilePublishedAt || member.school._count.jobPostings > 0 ? `/explore/${member.schoolId}` : null;
  const pupilClass = member.enrollments[0]?.class ?? null;
  const badges = role === "STUDENT" ? (await getBadges(member.schoolId, member.id, member.school.timezone)).filter((b) => b.earned) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/remarks" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("remarks.all")}
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
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm text-fg-muted">
            <BuildingsIcon weight="duotone" className="size-4" aria-hidden="true" />
            {schoolHref ? (
              <Link href={schoolHref} className="inline-flex items-center gap-1 font-medium text-fg hover:underline">
                {member.school.name}
                <ArrowSquareOutIcon className="size-3.5 text-fg-subtle" aria-hidden="true" />
              </Link>
            ) : (
              <span className="font-medium text-fg">{member.school.name}</span>
            )}
            {member.school.city && <span>· {member.school.city}</span>}
            <span>
              · {t("person.since", { date: formatInZone(member.joinedAt, member.school.timezone, { month: "long", year: "numeric" }) })}
            </span>
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
            description={
              subjects.length > 0
                ? `${subjects.join(" · ")}${pupilsTaught > 0 ? ` · ${t("person.pupilsTaught", { count: pupilsTaught })}` : ""}`
                : t("person.noSubjectsYet")
            }
          />
          {(leads.length > 0 || teaches.length > 0) && (
            <CardBody className="space-y-3">
              {leads.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("person.classTeacherOf")}</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {leads.map((ct) => (
                      <li key={ct.class.id}>
                        <ClassChip href={classHref(me, ct.class.id)} name={ct.class.name} tone="accent" />
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
                        <ClassChip href={classHref(me, ct.class.id)} name={ct.class.name} tone="neutral" />
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
        <>
          <Card>
            <CardHeader
              icon={<UsersThreeIcon weight="duotone" className="size-5" />}
              title={t("person.class")}
              description={pupilClass ? undefined : t("person.noClassYet")}
            />
            {pupilClass && (
              <CardBody className="space-y-2">
                <ClassChip href={classHref(me, pupilClass.id)} name={pupilClass.name} tone="accent" />
                {pupilClass.teachers.length > 0 && (
                  <p className="text-sm text-fg-muted">
                    {t("person.classTeacher")}{" "}
                    {pupilClass.teachers.map((ct, i) => (
                      <span key={ct.teacher.id}>
                        {i > 0 && ", "}
                        <PersonLink
                          membershipId={ct.teacher.id}
                          name={ct.teacher.user.preferredName ?? ct.teacher.user.name}
                          className="font-medium text-fg"
                        />
                      </span>
                    ))}
                  </p>
                )}
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader
              icon={<MedalIcon weight="duotone" className="size-5" />}
              title={t("person.badges")}
              description={badges.length === 0 ? t("person.noBadgesYet") : t("person.badgesEarned", { count: badges.length })}
            />
            {badges.length > 0 && (
              <CardBody>
                <ul className="flex flex-wrap gap-1.5">
                  {badges.map((badge) => (
                    <li key={badge.id}>
                      <span title={t(badge.descriptionKey)}>
                        <Badge tone="accent">{t(badge.labelKey)}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ClassChip({ href, name, tone }: { href: string | null; name: string; tone: "accent" | "neutral" }) {
  const chip = (
    <Badge tone={tone} size="sm">
      {name}
    </Badge>
  );
  if (!href) return chip;
  return (
    <Link href={href} className="inline-block rounded-full hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
      {chip}
    </Link>
  );
}
