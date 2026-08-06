import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { postableClasses } from "@/lib/bulletin";
import { ComposeForm } from "./form";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.newPost") };
}

export default async function NewPostPage() {
  const t = await getT();
  const session = await requireUser();

  if (!session.schoolId || !session.role) {
    return (
      <EmptyState
        title={t("bulletin.noSchool")}
        description={t("bulletin.pickBeforePosting")}
        action={
          <Button asChild>
            <Link href="/switch">{t("bulletin.chooseSchool")}</Link>
          </Button>
        }
      />
    );
  }

  const classes = await postableClasses(session);
  const isStudent = session.role === "STUDENT";

  if (isStudent && classes.length === 0) {
    return (
      <EmptyState
        title={t("bulletin.notInClassTitle")}
        description={t("bulletin.notInClassBody")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/bulletin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("bulletin.title")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">
        {isStudent ? t("bulletin.shareSomething") : t("bulletin.newPost")}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        {isStudent ? t("bulletin.studentIntro") : t("bulletin.staffIntro")}
      </p>

      <ComposeForm
        className="mt-7"
        classes={classes}
        role={session.role}
        // Students cannot post school-wide without an admin reviewing it, and
        // admins are the only ones who should be addressing the whole school
        // casually — teachers get both, defaulting to their class.
        allowSchoolWide={session.role !== "STUDENT"}
      />
    </div>
  );
}
