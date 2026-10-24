import { CheckCircleIcon } from "@phosphor-icons/react/ssr";

/** A question as it was written, in its three languages side by side, the correct option marked in each. */
type Text = { stem: string; choices: string[]; solution: string };

/** `level` is the languages' heading level: 2 straight under the page's h1, 3 under a section's h2 (QA-68: heading-order). */
export function QuestionRead({ en, hi, mr, answerIndex, labels, level = 3 }: { en: Text; hi: Text; mr: Text; answerIndex: number; labels: { en: string; hi: string; mr: string; correct: string; solution: string }; level?: 2 | 3 }) {
  const Title = level === 2 ? "h2" : "h3";
  const Sub = level === 2 ? "h3" : "h4";
  const columns = [
    ["en", labels.en, en],
    ["hi", labels.hi, hi],
    ["mr", labels.mr, mr],
  ] as const;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map(([lang, name, text]) => (
        <section key={lang} lang={lang} className="min-w-0 space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4" data-testid={`gig-read-${lang}`}>
          <Title className="text-sm font-semibold text-fg">{name}</Title>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">{text.stem}</p>
          <ol className="space-y-1.5 text-sm text-fg">
            {text.choices.map((choice, index) => (
              <li key={index} className={`flex items-start gap-2 break-words ${index === answerIndex ? "font-semibold" : ""}`}>
                <span className="inline-flex size-5 shrink-0 items-center justify-center text-xs text-fg-muted">{index + 1}.</span>
                <span className="min-w-0 flex-1">{choice}</span>
                {index === answerIndex && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-ok">
                    <CheckCircleIcon weight="fill" className="size-4" aria-hidden="true" />
                    {labels.correct}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div>
            <Sub className="text-xs font-medium text-fg-muted">{labels.solution}</Sub>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">{text.solution}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
