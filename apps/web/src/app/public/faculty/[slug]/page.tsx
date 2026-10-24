import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { publicFaculty } from "@/lib/faculty-profile";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { FacultyProfileCard } from "@/components/faculty-profile-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getT();
  const { slug } = await params;
  const list = await publicFaculty(slug);
  return { title: list.collegeName ? t("collegeDesks.publicTitle", { college: list.collegeName }) : t("collegeDesks.publicTitleNone") };
}

/**
 * A COLLEGE'S FACULTY PAGES (5 Oct 2026; integration decision 10), OUTSIDE
 * EVERY SHELL and with no session, as the AICTE disclosure beside it: each
 * teacher who chose to publish, as they published it — name, designation,
 * department, qualification, years of teaching, research titles. The rows are
 * readable by anyone (FacultyPublicProfile in scripts/gen-rls.ts); nothing
 * else of the college is read.
 */
export default async function PublicFacultyPage({ params }: { params: Promise<{ slug: string }> }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { slug } = await params;
  const list = await publicFaculty(slug);
  return (
    <main id="main" className="min-h-safe bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link href="/" className="inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{list.collegeName ? t("collegeDesks.publicTitle", { college: list.collegeName }) : t("collegeDesks.publicTitleNone")}</h1>
          <p className="mt-1.5 text-sm text-fg-muted">{list.profiles.length ? t("collegeDesks.publicIntro") : t("collegeDesks.publicNoneBody")}</p>
        </div>
        {list.profiles.length === 0 ? <h2 className="text-lg font-semibold text-fg">{t("collegeDesks.publicNone")}</h2> : null}
        {list.profiles.map((p) => (
          <FacultyProfileCard key={p.id} p={p} t={t} photoFileId={p.photoFileId ?? null} footer={t("collegeDesks.publicAsOf", { date: formatDateKey(p.publishedAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }, locale) })} />
        ))}
      </div>
    </main>
  );
}
