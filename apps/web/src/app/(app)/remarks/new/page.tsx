import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { studentsForTeacher, teachersForStudent } from "@/lib/remarks";
import { db } from "@/lib/db";
import { AskForm } from "./ask-form";
import { ComposeForm } from "./form";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.newMessage") };
}

export default async function NewRemarkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  /**
   * THREE ROLES, ONE ROUTE, because it is one conversation.
   *
   * A teacher picks a pupil; a pupil picks a teacher; a guardian picks a child
   * and then a teacher. Three routes would mean three places to change when the
   * room changes shape, and the room has just changed shape once.
   */
  /**
   * `requireUser`, NOT `requireRole`, and the difference is a parent.
   *
   * `requireRole` insists on a schoolId and a membershipId, which a guardian has
   * neither of — they belong to their children rather than to a school, and
   * their session carries no school at all. Using it here sent every parent to
   * the role switcher, which is a dead end for the one role the page was being
   * opened for. The route sweep caught it as a 307 where a 200 was wanted.
   */
  const t = await getT();
  const ctx = await requireUser();
  if (ctx.role !== "TEACHER" && ctx.role !== "STUDENT" && ctx.role !== "PARENT") {
    redirect("/switch");
  }

  if (ctx.role === "STUDENT") {
    if (!ctx.schoolId || !ctx.membershipId) redirect("/switch");
    const teachers = await teachersForStudent(ctx.schoolId, ctx.membershipId);
    return (
      <AskShell title={t("remarks.messageATeacher")} t={t}>
        <AskForm pupils={[{ membershipId: ctx.membershipId, name: "", teachers }]} />
      </AskShell>
    );
  }

  if (ctx.role === "PARENT") {
    // Their children, each with the teachers who actually teach that child.
    const links = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE" },
      select: {
        studentMembershipId: true,
        studentSchoolId: true,
        student: { select: { user: { select: { name: true, preferredName: true } } } },
      },
    });

    const children = await Promise.all(
      links.map(async (link) => ({
        membershipId: link.studentMembershipId,
        name: link.student.user.preferredName ?? link.student.user.name,
        teachers: await teachersForStudent(link.studentSchoolId, link.studentMembershipId),
      })),
    );

    return (
      <AskShell title={t("remarks.messageATeacher")} t={t}>
        <AskForm pupils={children} />
      </AskShell>
    );
  }

  if (!ctx.schoolId || !ctx.membershipId) redirect("/switch");
  const { student } = await searchParams;

  const students = await studentsForTeacher(ctx.schoolId, ctx.membershipId);

  if (students.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader title={t("remarks.newMessage")} back={{ href: "/remarks", label: t("remarks.all") }} />
        <EmptyState
          title={t("remarks.noStudentsYet")}
          description={t("remarks.noStudentsBody")}
          action={
            <Button asChild variant="secondary">
              <Link href="/teacher">{t("remarks.backToToday")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const preselected = students.some((s) => s.membershipId === student) ? student : undefined;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={t("remarks.newMessage")}
        description={t("remarks.goesToGuardiansOnly")}
        back={{ href: "/remarks", label: t("remarks.all") }}
      />

      <ComposeForm className="mt-7" students={students} preselected={preselected} />
    </div>
  );
}

/** The same frame around the pupil's and the guardian's compose form. */
/* `t` is a prop — a plain function rendered by a server component has no hook
   provider above it (the week-grid precedent). */
function AskShell({ title, children, t }: { title: string; children: React.ReactNode; t: Translate }) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={title} description={t("remarks.oneConversation")} back={{ href: "/remarks", label: t("remarks.all") }} />
      {children}
    </div>

  );
}
