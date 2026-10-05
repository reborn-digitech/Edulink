import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { InviteForm } from "./form";
import { invitableRolesFor, type InvitableRole } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.invitePeople") };
}

export default async function NewInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const { role } = await searchParams;

  const [classes, school] = await Promise.all([
    db.class.findMany({
      where: { schoolId: ctx.schoolId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { code: true, name: true, kind: true },
    }),
  ]);
  // A college offers its six staff roles and no TEACHER (4 Oct 2026); its first choice is FACULTY.
  const roles = invitableRolesFor(school.kind);
  const initialRole: InvitableRole = roles.includes(role as InvitableRole) ? (role as InvitableRole) : roles.includes("TEACHER") ? "TEACHER" : "FACULTY";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("invites.invitePeople")} description={t("invites.newSubtitle")} back={{ href: "/admin/invites", label: t("invites.allInvitations") }} />


      <InviteForm
        className="mt-7"
        initialRole={initialRole}
        roles={roles}
        classes={classes}
        schoolCode={school.code}
      />
    </div>
  );
}
