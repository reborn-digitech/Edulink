import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { EMAIL_SLOT, WithEmail } from "@/components/with-email";
import { company } from "@/lib/company";
import type { Translate } from "@/lib/i18n/dictionary";

/**
 * The panel beside the sign-in form (company-site, 16 Oct 2026). It held a quotation attributed to "A Year 5
 * teacher" whom nobody could name; it now says only what is true today: who signs in here, the two other ways in, the
 * three languages, and the support address once the owner has set one (src/lib/company.ts). Below the form on a
 * phone, beside it on a wide screen; the app's own tokens, so it reads in both themes.
 */
export function WhoSignsIn({ t }: { t: Translate }) {
  const email = company().supportEmail;
  return (
    <aside
      aria-labelledby="who-signs-in"
      data-testid="login-who"
      className="flex items-center justify-center border-t border-border bg-surface px-4 py-10 sm:px-8 lg:border-l lg:border-t-0 lg:p-12"
    >
      <div className="w-full max-w-sm space-y-5 text-sm leading-relaxed text-fg-muted">
        <h2 id="who-signs-in" className="text-lg font-semibold text-fg">
          {t("login.whoTitle")}
        </h2>
        <ul className="space-y-3">
          <li>{t("login.whoSchool")}</li>
          <li>{t("login.whoCollege")}</li>
        </ul>
        <ul className="space-y-2">
          <li>
            <Link href="/join" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent-strong underline underline-offset-4">
              {t("landing.joinWithCode")}
              <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link href="/register/expert" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent-strong underline underline-offset-4">
              {t("landing.becomeExpert")}
              <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
            </Link>
          </li>
        </ul>
        <p>{t("login.whoLanguages")}</p>
        {email && (
          <p data-testid="login-support">
            <WithEmail sentence={t("login.whoSupport", { email: EMAIL_SLOT })} email={email} />
          </p>
        )}
      </div>
    </aside>
  );
}
