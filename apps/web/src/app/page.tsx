import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  BuildingsIcon,
  CheckCircleIcon,
  ChalkboardTeacherIcon,
  CurrencyInrIcon,
  GraduationCapIcon,
  LockKeyIcon,
} from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";
import { InstallButton } from "@/components/install-button";
import { LanguageSwitch } from "@/components/language-switch";
import { EMAIL_SLOT, WithEmail } from "@/components/with-email";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { company, companyHasDetails, type Company } from "@/lib/company";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.tagline"), description: t("landing.metaDescription") };
}

/** The per-school modules a school switches on itself (modules page), named and described in the modules' own words. */
const SCHOOL_MODULES = ["transport", "library", "hostel", "inventory", "payroll", "website"] as const;
/** What a college has beside a school's day: the academics every college has, the exam cell, the quality cell, placement. */
const COLLEGE_MODULES = ["academics", "exams", "iqac", "placement"] as const;

/**
 * THE COMPANY'S OWN SITE (company-site, 16 Oct 2026): what www.shalaghar.com shows somebody who is not signed in.
 *
 * Plain and true. It lists what a school and a college can use today and nothing behind a platform switch (the
 * assistant, the question bank, sessions, the job board, texts): those say "more is being added" until they are on
 * for everybody. Prices are "ask us". The company's legal details come from the server's environment alone
 * (src/lib/company.ts) and each one appears only once it is set; with none set the "About the company" section is not
 * drawn at all, and the operator's /root says what is still to fill.
 *
 * A signed-in person is sent to their own home, as the sign-in page sends them; one with no role yet (the operator,
 * the content team, somebody between schools) goes to /switch, which knows where each of them belongs.
 */
export default async function CompanySite() {
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);
  if (session) redirect("/switch");

  const t = await getT();
  const c = company();

  return (
    <div className="min-h-safe bg-bg">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur-md">
        <nav
          aria-label={t("common.mainContent")}
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6"
        >
          <Link href="/" className="shrink-0 rounded-[var(--radius-sm)]" aria-label={t("common.homeLink")}>
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Under 360 px the bar holds the wordmark and one button; the hero and the footer keep the other ways in. */}
            <Button asChild variant="ghost" size="sm" className="hidden min-[360px]:inline-flex">
              <Link href="/login">{t("login.title")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/register/expert">{t("landing.becomeExpert")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">{t("landing.registerSchool")}</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main id="main" data-testid="company-site">
        <section className="border-b border-border px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-fg sm:text-5xl">{t("landing.heroTitle")}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">{t("landing.heroBody")}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" iconRight={<ArrowRightIcon weight="bold" />}>
                <Link href="/register">{t("landing.registerSchool")}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/join">{t("landing.joinWithCode")}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">{t("login.title")}</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-fg-muted">
              <Link href="/register/expert" className="font-medium text-accent-strong underline underline-offset-4">
                {t("landing.becomeExpert")}
              </Link>
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <LanguageSwitch showLabel />
              <InstallButton />
            </div>
          </div>
        </section>

        <section id="schools" aria-labelledby="schools-title" className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionHeading id="schools-title" icon={<ChalkboardTeacherIcon weight="duotone" className="size-6" />} title={t("landing.schoolsTitle")} lead={t("landing.schoolsLead")} />
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {(
                [
                  "landing.schoolsAttendance",
                  "landing.schoolsFees",
                  "landing.schoolsCirculars",
                  "landing.schoolsPapers",
                  "landing.schoolsFilings",
                  "landing.schoolsAdmissions",
                ] as const
              ).map((key) => (
                <li key={key} className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-border bg-surface p-4 text-sm leading-relaxed text-fg">
                  <CheckCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <p className="mt-8 font-semibold text-fg">{t("landing.modulesLead")}</p>
            <ModuleGrid t={t} modules={SCHOOL_MODULES} />
          </div>
        </section>

        <section id="colleges" aria-labelledby="colleges-title" className="border-y border-border bg-surface px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <SectionHeading id="colleges-title" icon={<GraduationCapIcon weight="duotone" className="size-6" />} title={t("landing.collegesTitle")} lead={t("landing.collegesLead")} />
            <ModuleGrid t={t} modules={COLLEGE_MODULES} />
            <p className="mt-6 text-sm text-fg-muted">{t("landing.moreComing")}</p>
          </div>
        </section>

        <section id="data" aria-labelledby="data-title" className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <SectionHeading id="data-title" icon={<LockKeyIcon weight="duotone" className="size-6" />} title={t("landing.dataTitle")} />
            <ul className="mt-6 space-y-3 text-fg-muted">
              {(
                [
                  "landing.dataResponsible",
                  "landing.dataFence",
                  "landing.dataMinors",
                  "landing.dataAadhaar",
                  "landing.dataDeletion",
                  "landing.dataLanguages",
                ] as const
              ).map((key) => (
                <li key={key} className="leading-relaxed">
                  {t(key)}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href="/privacy" className="font-medium text-accent-strong underline underline-offset-4">
                {t("landing.dataPrivacy")}
              </Link>
              <Link href="/delete-account" className="font-medium text-accent-strong underline underline-offset-4">
                {t("landing.footerDeletion")}
              </Link>
            </p>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pricing-title" className="border-t border-border bg-surface px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <SectionHeading id="pricing-title" icon={<CurrencyInrIcon weight="duotone" className="size-6" />} title={t("landing.pricingTitle")} />
            <p className="mt-4 text-fg-muted">
              {t("landing.pricingBody")}
              {c.supportEmail && (
                <>
                  {" "}
                  <WithEmail sentence={t("landing.pricingAsk", { email: EMAIL_SLOT })} email={c.supportEmail} />
                </>
              )}
            </p>
          </div>
        </section>

        {companyHasDetails(c) && <About t={t} c={c} />}
      </main>

      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-sm text-fg-muted">
          <Wordmark size={24} />
          <nav aria-label={t("common.footerNav")} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/login" className="inline-flex min-h-11 items-center hover:text-fg">{t("login.title")}</Link>
            <Link href="/join" className="inline-flex min-h-11 items-center hover:text-fg">{t("landing.joinWithCode")}</Link>
            <Link href="/register" className="inline-flex min-h-11 items-center hover:text-fg">{t("landing.footerRegister")}</Link>
            <Link href="/register/expert" className="inline-flex min-h-11 items-center hover:text-fg">{t("expertApply.footerLink")}</Link>
            <Link href="/offline" className="inline-flex min-h-11 items-center hover:text-fg">{t("landing.footerOffline")}</Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-fg">{t("landing.footerPrivacy")}</Link>
            <Link href="/delete-account" className="inline-flex min-h-11 items-center hover:text-fg">{t("landing.footerDeletion")}</Link>
          </nav>
          {/* Terms are left out until the owner provides them (company-site brief): no placeholder page. */}
          {c.legalName && <p data-testid="built-by">{t("landing.footerBuiltBy", { name: c.legalName })}</p>}
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionHeading({ id, icon, title, lead }: { id: string; icon: React.ReactNode; title: string; lead?: string }) {
  return (
    <div>
      <h2 id={id} className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
          {icon}
        </span>
        {title}
      </h2>
      {lead && <p className="mt-2 text-fg-muted">{lead}</p>}
    </div>
  );
}

type ModuleName = (typeof SCHOOL_MODULES)[number] | (typeof COLLEGE_MODULES)[number];

function ModuleGrid({ t, modules }: { t: Translate; modules: readonly ModuleName[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m) => (
        <li key={m} className="rounded-[var(--radius-md)] border border-border bg-bg p-4">
          <p className="font-semibold text-fg">{t(`modules.${m}Name` as const)}</p>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t(`modules.${m}What` as const)}</p>
        </li>
      ))}
    </ul>
  );
}

/** One label and its value; nothing is drawn for a value that is not set. */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-fg-muted">{label}</dt>
      <dd className="mt-1 text-fg sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <address className="not-italic">
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}

/**
 * "About the company": the fields the owner has set and no others. The grievance officer's block carries what the
 * DPDP Act, 2023 asks a data fiduciary to publish (s.8(9): who answers questions about the processing of personal data,
 * and how to reach them) and the route to the Data Protection Board once that is used (s.13).
 */
function About({ t, c }: { t: Translate; c: Company }) {
  const g = c.grievanceOfficer;
  return (
    <section id="about" aria-labelledby="about-title" data-testid="company-about" className="border-t border-border px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading id="about-title" icon={<BuildingsIcon weight="duotone" className="size-6" />} title={t("landing.aboutTitle")} />
        {c.brandLine && <p className="mt-4 text-fg-muted">{c.brandLine}</p>}
        <dl className="mt-6">
          {c.legalName && <Detail label={t("company.legalName")}>{c.legalName}</Detail>}
          {c.cin && <Detail label={t("company.cin")}><span className="font-mono">{c.cin}</span></Detail>}
          {c.gstin && <Detail label={t("company.gstin")}><span className="font-mono">{c.gstin}</span></Detail>}
          {c.registeredAddress && <Detail label={t("company.registeredAddress")}><Lines lines={c.registeredAddress} /></Detail>}
          {c.correspondenceAddress && <Detail label={t("company.correspondenceAddress")}><Lines lines={c.correspondenceAddress} /></Detail>}
          {c.supportEmail && (
            <Detail label={t("company.supportEmail")}>
              <a href={`mailto:${c.supportEmail}`} className="font-medium text-accent-strong underline underline-offset-4">{c.supportEmail}</a>
            </Detail>
          )}
          {c.supportPhone && (
            <Detail label={t("company.supportPhone")}>
              <a href={`tel:${c.supportPhone.replace(/[^\d+]/g, "")}`} className="font-medium text-accent-strong underline underline-offset-4">{c.supportPhone}</a>
            </Detail>
          )}
          {c.foundedYear !== undefined && <Detail label={t("company.foundedYear")}>{c.foundedYear}</Detail>}
          {c.directors && (
            <Detail label={t("company.directors")}>
              <ul>
                {c.directors.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Detail>
          )}
        </dl>

        {g && (
          <div data-testid="grievance-officer" className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h3 className="font-semibold text-fg">{t("landing.grievanceTitle")}</h3>
            {(g.name || g.designation) && <p className="mt-2 text-fg">{[g.name, g.designation].filter(Boolean).join(", ")}</p>}
            {g.email && (
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                <WithEmail sentence={t("landing.grievanceWrite", { email: EMAIL_SLOT })} email={g.email} />
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("landing.grievanceBoard")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
