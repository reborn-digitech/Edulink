import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { publishedDisclosure } from "@/lib/iqac-filings";
import { publicFaculty } from "@/lib/faculty-profile";
import { getT } from "@/lib/i18n/server";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getT();
  const { slug } = await params;
  const doc = /^[a-z0-9-]{1,80}$/.test(slug) ? await publishedDisclosure(slug) : null;
  return { title: doc ? `${doc.title} · ${doc.school}` : t("iqac.publicNotFoundTitle") };
}

/**
 * A college's AICTE mandatory disclosure (the IQAC module, 4 Oct 2026),
 * OUTSIDE EVERY SHELL and with no session: AICTE asks every approved
 * institution to publish it, and an applicant reads it signed in to nothing.
 * What shows is the frozen snapshot the college published — programmes,
 * faculty, results, placement, committees — never a student or a PAN; the
 * row is readable by anyone only while it is published (DisclosurePage in
 * scripts/gen-rls.ts). The document's own words are the regulator's English.
 */
export default async function DisclosurePage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getT();
  const { slug } = await params;
  const doc = /^[a-z0-9-]{1,80}$/.test(slug) ? await publishedDisclosure(slug) : null;
  // The faculty's own published pages (5 Oct 2026, faculty-profile.ts), linked when any teacher has put one up.
  const faculty = doc ? await publicFaculty(slug) : null;
  return (
    <div className="min-h-safe bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link href="/" className="inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>
        {!doc ? (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{t("iqac.publicNotFoundTitle")}</h1>
            <p className="mt-1.5 text-sm text-fg-muted">{t("iqac.publicNotFoundBody")}</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-fg">{doc.title}</h1>
              <p className="mt-1 text-sm text-fg-muted">{doc.subtitle}</p>
              <p className="mt-1 text-xs text-fg-muted">{t("iqac.publicIntro")}</p>
              {faculty && faculty.profiles.length > 0 ? (
                <Link className="mt-2 inline-flex min-h-11 items-center text-sm text-accent-strong underline" href={`/public/faculty/${slug}`}>
                  {t("collegeDesks.disclosureFacultyLink")}
                </Link>
              ) : null}
            </div>
            {doc.sections.map((s, i) => (
              <section key={i} className="space-y-2">
                <h2 className="text-lg font-semibold text-fg">{s.heading}</h2>
                {s.rows ? (
                  <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    {s.rows.map(([k, v], j) => (
                      <div key={j} className="contents">
                        <dt className="text-fg-muted">{k}</dt>
                        <dd className="text-fg">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {s.table ? (
                  <TableScroll>
                    <table className="w-full text-left text-sm">
                      <thead className="text-fg-muted">
                        <tr>
                          {s.table.head.map((h, j) => (
                            <th key={j} className="py-1.5 pr-3 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((r, j) => (
                          <tr key={j} className="border-t border-border">
                            {r.map((c, k) => (
                              <td key={k} className="py-1.5 pr-3">
                                {String(c)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                ) : null}
                {s.paragraphs?.map((p, j) => (
                  <p key={j} className="text-sm">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
