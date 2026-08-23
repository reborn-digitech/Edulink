import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { todayKey } from "@/lib/dates";
import { IntakeForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.intake") };
}

export default async function IntakePage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");

  const [classes, school] = await Promise.all([
    db.class.findMany({
      where: { schoolId: ctx.schoolId, archivedAt: null },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/people"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("intake.backToPeople")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">{t("intake.title")}</h1>
      <p className="mt-1.5 text-sm text-fg-muted">{t("intake.subtitle")}</p>

      <IntakeForm className="mt-7" classNames={classes.map((c) => c.name)} today={todayKey(school.timezone)} />
    </div>
  );
}
