import type { Metadata } from "next";
import { SealCheckIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getBadges } from "@/lib/badges";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProfileForm } from "./form";
import { BadgeGrid } from "./badges";

export const metadata: Metadata = { title: "My profile" };

export default async function StudentProfilePage() {
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

  const badges = await getBadges(ctx.schoolId, ctx.membershipId, membership.school.timezone);
  const earned = badges.filter((b) => b.earned);

  // A self-joined student's "email" is an internal handle, not a real address.
  const handle = membership.user.email?.endsWith("@edulink.local")
    ? membership.user.email.replace("@edulink.local", "")
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">My profile</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {membership.school.name}
          {membership.enrollments[0] ? ` · ${membership.enrollments[0].class.name}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title="How you look"
          description="Your teacher and classmates see this"
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

      <Card>
        <CardHeader
          icon={<SealCheckIcon weight="duotone" className="size-5" />}
          title="Your badges"
          description={
            earned.length === 0
              ? "Nothing yet — they arrive on their own"
              : `${earned.length} of ${badges.length}`
          }
        />
        <CardBody>
          <BadgeGrid badges={badges} />
        </CardBody>
      </Card>
    </div>
  );
}
