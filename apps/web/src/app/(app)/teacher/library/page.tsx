import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { MyLibrary } from "@/components/library/mine";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName"), robots: { index: false, follow: false } };
}

/** A teacher's own library: their loans, dues and queue, and the catalogue. */
export default async function TeacherLibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; error?: string }> }) {
  const ctx = await requireRole("TEACHER");
  const { q = "", ok, error } = await searchParams;
  return <MyLibrary ctx={ctx} schoolId={ctx.schoolId} path="/teacher/library" q={q} ok={ok} error={error} />;
}
