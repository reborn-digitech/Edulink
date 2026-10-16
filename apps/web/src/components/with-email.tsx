import { cn } from "@/lib/cn";

/** What a sentence's {email} is translated with, so the address can be cut back out as a link. */
export const EMAIL_SLOT = "\u0000";

/**
 * A translated sentence with the address drawn as a mailto link where {email} sits, whatever the language's word
 * order (the sentence is translated with `{ email: EMAIL_SLOT }`). The same split /privacy makes, for the company
 * site and the sign-in page (company-site, 16 Oct 2026).
 */
export function WithEmail({ sentence, email, className }: { sentence: string; email: string; className?: string }) {
  const [before, after = ""] = sentence.split(EMAIL_SLOT);
  return (
    <>
      {before}
      <a href={`mailto:${email}`} className={cn("font-medium text-accent-strong underline underline-offset-4", className)}>
        {email}
      </a>
      {after}
    </>
  );
}
