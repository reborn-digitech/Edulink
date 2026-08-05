import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { InviteForm } from "./form";
import { SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

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

  const initialRole: SchoolRole = SCHOOL_ROLES.includes(role as SchoolRole)
    ? (role as SchoolRole)
    : "TEACHER";

  const classes = await db.class.findMany({
    where: { schoolId: ctx.schoolId, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { code: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/invites"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("invites.allInvitations")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">{t("invites.invitePeople")}</h1>
      <p className="mt-1.5 text-sm text-fg-muted">{t("invites.newSubtitle")}</p>

      <InviteForm
        className="mt-7"
        initialRole={initialRole}
        classes={classes}
        schoolCode={school.code}
      />
    </div>
  );
}
