import type { Metadata } from "next";
import { BrainIcon, DownloadSimpleIcon, GraduationCapIcon, SealCheckIcon, TrophyIcon, UserIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getBadges } from "@/lib/badges";
import { myRecords } from "@/lib/school-record";
import { SchoolRecordList } from "@/components/school-record-list";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./form";
import { BadgeGrid } from "./badges";
import { getT } from "@/lib/i18n/server";
import { mayEditOwnBirthdate } from "@/lib/birthdate";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myProfile") };
}

export default async function StudentProfilePage() {
  const t = await getT();
  const ctx = await requireRole("STUDENT");

  const membership = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    include: {
      user: {
        select: { name: true, preferredName: true, bio: true, avatarKey: true, email: true, birthdate: true },
      },
      school: { select: { name: true, timezone: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { select: { name: true } } },
      },
    },
  });

  // Schools this child has been at BEFORE this one. They read it through their
  // own user id rather than through a school — see school-record.ts — which is
  // the only reason it survives their leaving the school that wrote it.
  const previous = await myRecords(ctx);

  const badges = await getBadges(ctx.schoolId, ctx.membershipId, membership.school.timezone);
  const earned = badges.filter((b) => b.earned);

  // What the practising has added up to, and where they have competed —
  // numbers and titles only, the same aggregates their other pages show.
  const [topicsPractised, topicsCompleted, competitionEntries] = await Promise.all([
    db.quizMastery.count({
      where: { schoolId: ctx.schoolId, studentMembershipId: ctx.membershipId, seenCount: { gt: 0 } },
    }),
    db.quizMastery.count({
      where: {
        schoolId: ctx.schoolId,
        studentMembershipId: ctx.membershipId,
        cleanCompletionAt: { not: null },
      },
    }),
    db.competitionEntry.findMany({
      where: { studentMembershipId: ctx.membershipId },
      select: {
        id: true,
        status: true,
        rank: true,
        competition: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // A self-joined student's "email" is an internal handle, not a real address.
  const handle = membership.user.email?.endsWith("@edulink.local")
    ? membership.user.email.replace("@edulink.local", "")
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("student.myProfile")} description={<>{membership.school.name}
          {membership.enrollments[0] ? ` · ${membership.enrollments[0].class.name}` : ""}</>} />

      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title={t("student.howYouLook")}
          description={t("student.classmatesSee")}
        />
        <CardBody>
          <ProfileForm
            fullName={membership.user.name}
            preferredName={membership.user.preferredName ?? ""}
            bio={membership.user.bio ?? ""}
            birthdate={membership.user.birthdate?.toISOString().slice(0, 10) ?? ""}
            birthdateEditable={await mayEditOwnBirthdate(ctx)}
            avatarKey={membership.user.avatarKey}
            handle={handle}
            studentCode={membership.studentCode}
          />
        </CardBody>
      </Card>

      {previous.length > 0 && (
        <Card>
          <CardHeader
            icon={<GraduationCapIcon weight="duotone" className="size-5" />}
            title={t("student.schoolsBeenTo")}
            description={t("student.recordNote")}
          />
          <CardBody>
            <SchoolRecordList records={previous} t={t} />
          </CardBody>
        </Card>
      )}

      {topicsPractised > 0 && (
        <Card>
          <CardHeader
            icon={<BrainIcon weight="duotone" className="size-5" />}
            title={t("student.practiceCardTitle")}
            description={t("student.practiceCardBody")}
          />
          <CardBody>
            <dl className="grid grid-cols-2 gap-2">
              {[
                [t("student.topicsPractised"), topicsPractised],
                [t("student.topicsCompleted"), topicsCompleted],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-[--radius-md] border border-border bg-surface px-3 py-2">
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
                  <dd className="text-lg font-bold tabular-nums text-fg">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm">
              <Link href="/student/practice" className="font-medium text-accent hover:underline">
                {t("student.keepPractising")}
              </Link>
            </p>
          </CardBody>
        </Card>
      )}

      {competitionEntries.length > 0 && (
        <Card>
          <CardHeader
            icon={<TrophyIcon weight="duotone" className="size-5" />}
            title={t("student.competitionsCardTitle")}
            description={t("student.competitionsCardBody")}
          />
          <CardBody>
            <ul className="space-y-1.5">
              {competitionEntries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-fg">{entry.competition.title}</span>
                  <span className="text-fg-muted">
                    {entry.rank !== null
                      ? t("student.placedRank", { rank: entry.rank })
                      : entry.status === "SUBMITTED"
                        ? t("student.entrySubmitted")
                        : entry.status === "RESULTS"
                          ? t("student.entryResults")
                          : t("student.entryRegistered")}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<SealCheckIcon weight="duotone" className="size-5" />}
          title={t("student.yourBadges")}
          /*
           * Deliberately NOT "3 of 7".
           *
           * Badges are derived on every read, so a total is a number that goes
           * DOWN — a child who slips below 95% attendance watches "3 of 7"
           * become "2 of 7" and has lost something. badges.tsx promises there is
           * no total score anywhere and that nothing can be lost; this line was
           * quietly breaking both. The badge tests only assert that the badge
           * OBJECTS carry no aggregate, so they passed while the view computed
           * one — which is why the promise needs to hold in the markup too.
           */
          description={
            earned.length === 0
              ? t("student.badgesNothingYet")
              : t("student.badgesSoFar")
          }
        />
        <CardBody>
          <BadgeGrid badges={badges} />
        </CardBody>
      </Card>

      {/* ---------- the pupil's own data (DPDP s.11) ---------- */}
      <Card>
        <CardHeader
          icon={<DownloadSimpleIcon weight="duotone" className="size-5" />}
          title={t("exports.myDataTitle")}
          description={t("exports.myDataBody")}
        />
        <CardBody className="space-y-3">
          <div data-testid="family-export">
            <Button asChild size="sm" variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
              <a href="/api/v1/family/export" download>
                {t("exports.download")}
              </a>
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">{t("exports.fewPerHour")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
