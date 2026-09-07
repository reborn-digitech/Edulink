import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { NewCompetitionForm } from "./form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.postCompetition") };
}

export default async function NewCompetitionPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { name: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("competitions.title")}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("competitions.postACompetition")}</h1>
        <p className="text-sm text-fg-muted">{t("competitions.postIntro")}</p>
      </header>

      <NewCompetitionForm schoolName={school.name} />
    </div>
  );
}
