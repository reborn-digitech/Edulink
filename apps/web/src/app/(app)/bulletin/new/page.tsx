import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { postableClasses } from "@/lib/bulletin";
import { ComposeForm } from "./form";
import { POSTABLE_CATEGORIES, type PostCategory } from "@/lib/constants";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { isCollegeKind } from "@edulink/contracts";
import { institutionKindOf } from "@/lib/modules";
// meta-posting (16 Oct 2026)
import { composerSocial } from "@/lib/social";
// end meta-posting

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.newPost") };
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; tag?: string; category?: string }>;
}) {
  // Prefill from a "Post a wish" link — a title, a tag, a category. Plain
  // query parameters so the link can be bookmarked; the form still validates.
  const prefill = await searchParams;
  const t = await getT();
  const session = await requireUser();

  const back = { href: "/bulletin", label: t("bulletin.title") };
  if (!session.schoolId || !session.role) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader title={t("bulletin.newPost")} back={back} />
        <EmptyState
          title={t("bulletin.noSchool")}
          description={t("bulletin.pickBeforePosting")}
          action={
            <Button asChild>
              <Link href="/switch">{t("bulletin.chooseSchool")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const classes = await postableClasses(session);
  const isStudent = session.role === "STUDENT";

  // The grades a staff notice can be narrowed to — the grades the school's
  // live classes actually name. Students never target, so they never pay for it.
  const grades = isStudent
    ? []
    : (
        await db.class.findMany({
          where: { schoolId: session.schoolId, archivedAt: null, gradeLevel: { not: null } },
          select: { gradeLevel: true },
          distinct: ["gradeLevel"],
        })
      )
        .map((c) => c.gradeLevel!)
        .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

  // A college narrows a notice to a programme, a department, a division or a batch (the office builder's
  // audienceTarget; the composer's picker, the integration builder, 4 Oct 2026). Staff only, as the grade is.
  const college = !isStudent && isCollegeKind(await institutionKindOf(session.schoolId));
  const targets: { value: string; label: string; group: "PROGRAMME" | "DEPARTMENT" | "DIVISION" | "BATCH" }[] = [];
  if (college) {
    const [programmes, departments, divisions, batches] = await Promise.all([
      db.programme.findMany({ where: { schoolId: session.schoolId, archivedAt: null }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
      db.department.findMany({ where: { schoolId: session.schoolId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      db.division.findMany({ where: { schoolId: session.schoolId, class: { archivedAt: null } }, select: { id: true, class: { select: { name: true } } }, orderBy: { class: { name: "asc" } } }),
      db.studentProgramme.findMany({ where: { schoolId: session.schoolId, status: "ACTIVE" }, select: { entryYear: true }, distinct: ["entryYear"], orderBy: { entryYear: "desc" } }),
    ]);
    for (const p of programmes) targets.push({ value: `PROGRAMME:${p.id}`, label: [p.code, p.name].join(" · "), group: "PROGRAMME" });
    for (const d of departments) targets.push({ value: `DEPARTMENT:${d.id}`, label: d.name, group: "DEPARTMENT" });
    for (const d of divisions) targets.push({ value: `DIVISION:${d.id}`, label: d.class.name, group: "DIVISION" });
    for (const b of batches) targets.push({ value: `BATCH:${b.entryYear}`, label: t("collegeHub.batchOf", { year: b.entryYear }), group: "BATCH" });
  }

  // meta-posting (16 Oct 2026): the school's Facebook Page and Instagram account, offered to the ADMIN on a school-wide post.
  const social = await composerSocial(session);
  // end meta-posting

  if (isStudent && classes.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader title={t("bulletin.shareSomething")} back={back} />
        <EmptyState
          title={t("bulletin.notInClassTitle")}
          description={t("bulletin.notInClassBody")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={isStudent ? t("bulletin.shareSomething") : t("bulletin.newPost")}
        description={isStudent ? t("bulletin.studentIntro") : t("bulletin.staffIntro")}
        back={back}
      />


      <ComposeForm
        initialTitle={prefill.title?.slice(0, 120)}
        initialTags={prefill.tag ? [prefill.tag.replace(/^#/, "").slice(0, 40)] : undefined}
        initialCategory={(POSTABLE_CATEGORIES as readonly string[]).includes(prefill.category ?? "") ? (prefill.category as PostCategory) : undefined}
        className="mt-7"
        classes={classes}
        grades={college ? [] : grades}
        targets={targets}
        role={session.role}
        // Students cannot post school-wide without an admin reviewing it, and
        // admins are the only ones who should be addressing the whole school
        // casually — teachers get both, defaulting to their class.
        allowSchoolWide={session.role !== "STUDENT"}
        social={social}
      />
    </div>
  );
}
