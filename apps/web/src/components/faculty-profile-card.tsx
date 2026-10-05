import type { FacultyProfileSnapshot } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * One faculty member's public page as it reads (5 Oct 2026): the teacher's
 * preview at /faculty/profile and the college's signed-out list at
 * /public/faculty/<slug> draw the same card from the same snapshot. Codes are
 * said in the reader's language; the titles are the teacher's own.
 */
export function FacultyProfileCard({ p, t, footer }: { p: FacultyProfileSnapshot; t: Translate; footer?: string }) {
  const tt = (key: string) => t(key as TranslationKey);
  const said = (key: string, code: string) => {
    const word = tt(`${key}.${code}`);
    return word === `${key}.${code}` ? code : word;
  };
  return (
    <article className="space-y-2 rounded-[--radius-lg] border border-border bg-surface p-4">
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
