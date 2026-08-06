import type { Metadata } from "next";
import { GraduationCapIcon, SealCheckIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getBadges } from "@/lib/badges";
import { myRecords } from "@/lib/school-record";
import { SchoolRecordList } from "@/components/school-record-list";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProfileForm } from "./form";
import { BadgeGrid } from "./badges";
import { getT } from "@/lib/i18n/server";

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
        select: { name: true, preferredName: true, bio: true, avatarKey: true, email: true },
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

  // A self-joined student's "email" is an internal handle, not a real address.
  const handle = membership.user.email?.endsWith("@edulink.local")
    ? membership.user.email.replace("@edulink.local", "")
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("student.myProfile")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {membership.school.name}
          {membership.enrollments[0] ? ` · ${membership.enrollments[0].class.name}` : ""}
        </p>
      </div>

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
    </div>
  );
}
