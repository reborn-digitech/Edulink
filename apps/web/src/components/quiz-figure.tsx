/**
 * A quiz question's figure, drawn above the stem (the quiz bank's figure builder, 10 Oct 2026): the
 * PNG the importer stored for the language the stem is read in, read through /api/files with the
 * session, and its words as the alt. The practice player and the review queue draw it the same way:
 *
 *   <QuizFigure fileId={question.image.fileId} alt={question.image.alt} />
 *
 * Full width of the column and never wider than the card it sits in; the figure's own white card keeps
 * it readable in the dark tone, since a textbook drawing is ink on paper. 1280 × 800 at source, so the
 * browser reserves the space before the bytes arrive and the stem does not jump.
 */
export function QuizFigure({ fileId, alt, className }: { fileId: string; alt: string; className?: string }) {
  return (
    <figure className={["m-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white", className].filter(Boolean).join(" ")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a stored file behind the session, not an optimisable asset */}
      <img src={`/api/files/${encodeURIComponent(fileId)}`} alt={alt} width={1280} height={800} decoding="async" className="block h-auto w-full" />
    </figure>
  );
}
