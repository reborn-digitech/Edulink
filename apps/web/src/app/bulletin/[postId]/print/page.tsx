import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessError, requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getPost } from "@/lib/bulletin";
import { readJsonArray, type MediaItem } from "@/lib/json";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PrintButton } from "@/app/certificate/[recordId]/print-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("circulars.printTitle"), robots: { index: false, follow: false } };
}

/**
 * A notice as a sheet for the notice board and the school gate: the school's
 * name, "Notice", the title, the words, the pictures, the date, and the line
 * that says how to acknowledge it. The families without the app read it
 * here; the reach report is for the office.
 *
 * WHO MAY OPEN IT is what `getPost` settles — anybody who may read the post
 * may print it; anybody else, and any guessed id, gets the same 404. No
 * shell, no nav: a document for printing.
 */
export default async function CircularPrintPage({ params }: { params: Promise<{ postId: string }> }) {
  const session = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const latin = locale === "en";
  const { postId } = await params;

  let post;
  try {
    post = await getPost(session, postId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  if (!post.schoolId || post.status !== "APPROVED") notFound();

  const school = await db.school.findUnique({ where: { id: post.schoolId }, select: { name: true, city: true, timezone: true, logoPath: true } });
  if (!school) notFound();
  const images = readJsonArray<MediaItem>(post.media).filter((item) => item.kind === "image");

  return (
    <div className="min-h-safe bg-bg px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link href={`/bulletin/${post.id}`} className="text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
          ← {t("circulars.viewOnBulletin")}
        </Link>
        <PrintButton label={t("circulars.print")} />
      </div>

      <article
        data-testid="circular-print"
        className="mx-auto max-w-[210mm] rounded-[--radius-lg] border border-border bg-white p-10 text-[#111] shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="flex items-start gap-4 border-b-2 border-[#111] pb-4">
          {school.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${school.logoPath}`} alt="" className="size-16 object-contain" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
            {school.city && <p className="text-sm text-[#444]">{school.city}</p>}
          </div>
          <p className="text-right text-xs text-[#444]">{formatDate(post.createdAt, school.timezone)}</p>
        </header>

        <h2 className={`mt-8 text-center text-xl font-bold uppercase ${latin ? "tracking-[0.2em]" : ""}`}>{t("circulars.printTitle")}</h2>

        <h3 className="mt-6 text-2xl font-bold leading-snug" data-testid="circular-print-title">
          {post.title}
        </h3>
        {post.class?.name && <p className="mt-1 text-sm text-[#444]">{post.class.name}</p>}

        {post.body && <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed">{post.body}</p>}

        {images.length > 0 && (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {images.map((item) => (
              <li key={item.fileId}>
                {/* Served through /api/files, which re-checks who may see the post; never next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${item.fileId}`} alt={item.alt} className="w-full rounded-[--radius-md] border border-[#ddd] object-contain" />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 border-t border-[#bbb] pt-3 text-sm leading-relaxed text-[#444]">{t("circulars.printFooter")}</p>
      </article>
    </div>
  );
}
