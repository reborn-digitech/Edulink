import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { gradesInRange } from "@/lib/superuser";
import { ClassForm } from "./form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.createClass") };
}

export default async function NewClassPage() {
  const ctx = await requireRole("ADMIN");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { gradeLow: true, gradeHigh: true },
  });
  const grades = gradesInRange(school.gradeLow, school.gradeHigh);
  const gradeRangeLabel =
    school.gradeLow && school.gradeHigh ? `${school.gradeLow} to ${school.gradeHigh}` : null;

  const teachers = await db.membership.findMany({
    where: { schoolId: ctx.schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null },
    include: { user: { select: { name: true, preferredName: true, avatarKey: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/classes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All classes
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">Create a class</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Every class gets its own join code, so students can add themselves without you
        typing in 30 email addresses.
      </p>

      <ClassForm
        className="mt-7"
        grades={grades}
        gradeRangeLabel={gradeRangeLabel}
        teachers={teachers.map((t) => ({
          membershipId: t.id,
          name: t.user.preferredName ?? t.user.name,
          avatarKey: t.user.avatarKey,
        }))}
      />
    </div>
  );
}
