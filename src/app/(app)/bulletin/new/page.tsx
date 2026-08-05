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
  const session = await requireUser();

  if (!session.schoolId || !session.role) {
    return (
      <EmptyState
        title="No school selected"
        description="Pick a school before posting."
        action={
          <Button asChild>
            <Link href="/switch">Choose a school</Link>
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
        title="You are not in a class yet"
        description="Once you are in a class you can share things with it."
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
        Bulletin
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">
        {isStudent ? "Share something" : "New post"}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        {isStudent
          ? "A teacher reads it before anyone else does. If they ask for a change they will tell you why."
          : "This publishes straight away to everyone you choose."}
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
