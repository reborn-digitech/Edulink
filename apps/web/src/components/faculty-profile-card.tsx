import type { FacultyProfileSnapshot } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * One faculty member's public page as it reads (5 Oct 2026): the teacher's
 * preview at /faculty/profile and the college's signed-out list at
 * /public/faculty/<slug> draw the same card from the same snapshot. Codes are
 * said in the reader's language; the titles are the teacher's own.
 * website-three (17 Oct 2026): `photoFileId`, the member's own photo.
 */
export function FacultyProfileCard({ p, t, footer, photoFileId }: { p: FacultyProfileSnapshot; t: Translate; footer?: string; photoFileId?: string | null }) {
  const tt = (key: string) => t(key as TranslationKey);
  const said = (key: string, code: string) => {
    const word = tt(`${key}.${code}`);
    return word === `${key}.${code}` ? code : word;
  };
  return (
    <article className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      {/* website-three (17 Oct 2026): the member's own photo, when they set one and (on the public page) while the college's website is live. */}
      {photoFileId ? (
        // eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w
        <img src={`/api/files/${encodeURIComponent(photoFileId)}?w=320`} alt={t("facultyPhoto.alt", { name: p.name })} className="size-20 rounded-full object-cover" />
      ) : null}
      <h2 className="text-lg font-semibold text-fg">{p.name}</h2>
      <p className="text-sm text-fg-muted">
        {[said("iqac.designation", p.designation), p.departmentName, said("iqac.qualification", p.qualification), p.netSetQualified ? t("collegeDesks.publicNetSet") : null, t("collegeDesks.publicYears", { years: p.experienceYears })].filter(Boolean).join(" · ")}
      </p>
      {p.research.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-fg">{t("collegeDesks.publicResearch")}</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-fg">
            {p.research.map((r, i) => (
              <li key={i}>
                {r.title} <span className="text-fg-muted">({[said("iqac.researchKind", r.kind), r.indexing !== "NONE" ? said("iqac.indexing", r.indexing) : null, r.year].filter(Boolean).join(", ")})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {footer ? <p className="text-xs text-fg-muted">{footer}</p> : null}
    </article>
  );
}
