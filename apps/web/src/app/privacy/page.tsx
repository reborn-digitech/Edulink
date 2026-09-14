import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.privacy"), description: t("privacy.intro") };
}

/**
 * The privacy policy, public and outside the role shell like /join: both
 * stores need a URL a reviewer can open signed out, and so does a parent
 * deciding whether to claim a child.
 *
 * Every sentence derives from docs/decisions/0002-minors-data-policy.md,
 * written for a parent rather than an auditor. When the code changes what the
 * app holds or asks for, the policy changes first and these strings follow —
 * the store listings in apps/mobile/store point here as PRIVACY_URL.
 *
 * SUPPORT_EMAIL is optional. Without it the page says to go through the school,
 * which is the fiduciary and the right first stop either way.
 */
export default async function PrivacyPage() {
  const [t, session] = await Promise.all([getT(), getSession()]);
  const email = process.env.SUPPORT_EMAIL?.trim() || null;
  const items = ["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8", "i9", "i10", "i11"] as const;

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          {!session && (
            <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
              {t("login.title")}
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{t("privacy.title")}</h1>
        <p className="mt-1 text-sm text-fg-subtle">{t("privacy.updated")}</p>
        <p className="mt-4 text-fg-muted">{t("privacy.intro")}</p>

        <Section id="who" title={t("privacy.s1Title")}>
          <p>{t("privacy.s1a")}</p>
          <p>{t("privacy.s1b")}</p>
        </Section>

        <Section id="held" title={t("privacy.s2Title")}>
          <p>{t("privacy.s2Intro")}</p>
          <ul className="list-disc space-y-1.5 pl-5">
            {items.map((k) => (
              <li key={k}>{t(`privacy.${k}`)}</li>
            ))}
          </ul>
        </Section>

        <Section id="sees" title={t("privacy.s3Title")}>
          <p>{t("privacy.s3a")}</p>
          <p>{t("privacy.s3b")}</p>
          <p>{t("privacy.s3c")}</p>
          <p>{t("privacy.s3d")}</p>
        </Section>

        <Section id="not" title={t("privacy.s4Title")}>
          <p>{t("privacy.s4a")}</p>
          <p>{t("privacy.s4b")}</p>
          <p>{t("privacy.s4c")}</p>
        </Section>

        <Section id="goes" title={t("privacy.s5Title")}>
          <p>{t("privacy.s5Intro")}</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>{t("privacy.s5a")}</li>
            <li>{t("privacy.s5b")}</li>
            <li>{t("privacy.s5c")}</li>
            <li>{t("privacy.s5d")}</li>
            <li>{t("privacy.s5e")}</li>
          </ul>
        </Section>

        <Section id="phone" title={t("privacy.s6Title")}>
          <p>{t("privacy.s6a")}</p>
          <p>{t("privacy.s6b")}</p>
          <p>{t("privacy.s6c")}</p>
          <p>{t("privacy.s6d")}</p>
        </Section>

        <Section id="long" title={t("privacy.s7Title")}>
          <p>{t("privacy.s7a")}</p>
          <p>{t("privacy.s7b")}</p>
        </Section>

        <Section id="rights" title={t("privacy.s8Title")}>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>{t("privacy.s8see")}</li>
            <li>{t("privacy.s8correct")}</li>
            <li>{t("privacy.s8choose")}</li>
            <li>
              {t("privacy.s8erase")}{" "}
              <Link href="/delete-account" className="font-medium text-accent-strong underline underline-offset-4">
                {t("privacy.s8eraseLink")}
              </Link>
            </li>
            <li>{t("privacy.s8complain")}</li>
          </ul>
        </Section>

        <Section id="contact" title={t("privacy.s9Title")}>
          <p>{t("privacy.s9a")}</p>
          {email && (
            <p>
              <WithEmail sentence={t("privacy.s9email", { email: "\u0000" })} email={email} />
            </p>
          )}
          <p className="text-sm text-fg-subtle">{t("privacy.s9changes")}</p>
        </Section>
      </main>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-9 space-y-3 text-fg">
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** The translated sentence with the address rendered as a link where {email} sits, whatever the language's word order. */
function WithEmail({ sentence, email }: { sentence: string; email: string }) {
  const [before, after] = sentence.split("\u0000");
  return (
    <>
      {before}
      <a href={`mailto:${email}`} className="font-medium text-accent-strong underline underline-offset-4">
        {email}
      </a>
      {after}
    </>
  );
}
