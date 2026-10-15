import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChalkboardTeacherIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  DeviceMobileIcon,
  GraduationCapIcon,
  HandHeartIcon,
  LockKeyIcon,
  SparkleIcon,
  UsersThreeIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";
import { InstallButton } from "@/components/install-button";
import { getSession } from "@/lib/session";
import { ROLE_HOME, ATTENDANCE_META } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.tagline"), description: t("landing.metaDescription") };
}

export default async function LandingPage() {
  const t = await getT();
  // Signed-in visitors get a route back to their own dashboard rather than a
  // marketing page they have already been sold. (§7 no dead ends)
  const session = await getSession();
  const home = session?.role ? ROLE_HOME[session.role] : null;

  return (
    <div className="min-h-safe bg-bg">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-md">
        <nav
          aria-label={t("common.mainContent")}
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link href="/" className="rounded-[var(--radius-sm)]" aria-label={t("common.homeLink")}>
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/join">{t("landing.joinWithCode")}</Link>
            </Button>
            {home ? (
              <Button asChild size="sm" iconRight={<ArrowRightIcon weight="bold" />}>
                {/* "Go to my dashboard" is 182 px; beside the wordmark it overflowed a 320 px bar. Under 360 px the bar says "Dashboard". */}
                <Link href={home} aria-label={t("landing.goToDashboard")}>
                  <span className="min-[360px]:hidden">{t("nav.dashboard")}</span>
                  <span className="hidden min-[360px]:inline">{t("landing.goToDashboard")}</span>
                </Link>
              </Button>
            ) : (
              <>
                {/* Under 360 px the pair overflowed the bar by 60 px and the whole page scrolled sideways; the footer keeps the link. */}
                <Button asChild variant="ghost" size="sm" className="hidden min-[360px]:inline-flex">
                  <Link href="/login">{t("login.title")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("landing.registerSchool")}</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main">
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-32 h-96 bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklab,#2563eb_18%,transparent),transparent)]"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-fg-muted shadow-sm">
              <SparkleIcon weight="fill" className="text-accent" />
              {t("landing.badge")}
            </span>

            <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.08] tracking-tight text-fg sm:text-6xl">
              {t("landing.heroLead")}
              <span className="block bg-gradient-to-r from-[#4f8dfb] to-[#7e22ce] bg-clip-text text-transparent">
                {t("landing.heroEmphasis")}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
              {t("landing.heroBody")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" iconRight={<ArrowRightIcon weight="bold" />}>
                <Link href="/register">{t("landing.ctaRegister")}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/join">{t("landing.ctaHaveCode")}</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-fg-muted">{t("landing.noCardNeeded")}</p>

            <div className="mt-6 flex justify-center">
              <InstallButton />
            </div>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <AttendancePreview t={t} />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-border bg-surface px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t("landing.rolesTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-fg-muted">
              {t("landing.rolesBody")}
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <RoleCard
                role="teacher"
                icon={<ChalkboardTeacherIcon weight="duotone" className="size-7" />}
                title={t("landing.teachers")}
                lead={t("landing.teachersLead")}
                points={[
                  t("landing.teachersPoint1"),
                  t("landing.teachersPoint2"),
                  t("landing.teachersPoint3"),
                ]}
              />
              <RoleCard
                role="student"
                icon={<GraduationCapIcon weight="duotone" className="size-7" />}
                title={t("landing.students")}
                lead={t("landing.studentsLead")}
                points={[
                  t("landing.studentsPoint1"),
                  t("landing.studentsPoint2"),
                  t("landing.studentsPoint3"),
                ]}
              />
              <RoleCard
                role="parent"
                icon={<HandHeartIcon weight="duotone" className="size-7" />}
                title={t("landing.parents")}
                lead={t("landing.parentsLead")}
                points={[
                  t("landing.parentsPoint1"),
                  t("landing.parentsPoint2"),
                  t("landing.parentsPoint3"),
                ]}
              />
              <RoleCard
                role="admin"
                icon={<UsersThreeIcon weight="duotone" className="size-7" />}
                title={t("landing.admins")}
                lead={t("landing.adminsLead")}
                points={[
                  t("landing.adminsPoint1"),
                  t("landing.adminsPoint2"),
                  t("landing.adminsPoint3"),
                ]}
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            <Feature
              icon={<WifiSlashIcon weight="duotone" className="size-6" />}
              title={t("landing.offlineTitle")}
              body={t("landing.offlineBody")}
            />
            <Feature
              icon={<DeviceMobileIcon weight="duotone" className="size-6" />}
              title={t("landing.installTitle")}
              body={t("landing.installBody")}
            />
            <Feature
              icon={<LockKeyIcon weight="duotone" className="size-6" />}
              title={t("landing.safeTitle")}
              body={t("landing.safeBody")}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t("landing.setupTitle")}
            </h2>
            <ol className="mx-auto mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                { n: 1, title: t("landing.step1Title"), body: t("landing.step1Body") },
                { n: 2, title: t("landing.step2Title"), body: t("landing.step2Body") },
                { n: 3, title: t("landing.step3Title"), body: t("landing.step3Body") },
              ].map((step) => (
                <li key={step.n} className="rounded-[var(--radius-lg)] border border-border bg-bg p-5">
                  <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                    {step.n}
                  </span>
                  <h3 className="mt-3 font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{step.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <Button asChild size="lg" iconRight={<ArrowRightIcon weight="bold" />}>
                <Link href="/register">{t("landing.startCta")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-fg-muted sm:flex-row">
          <Wordmark size={24} />
          <nav aria-label={t("common.footerNav")} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/login" className="hover:text-fg">{t("login.title")}</Link>
            <Link href="/join" className="hover:text-fg">{t("landing.joinWithCode")}</Link>
            <Link href="/register" className="hover:text-fg">{t("landing.footerRegister")}</Link>
            <Link href="/register/expert" className="hover:text-fg">{t("expertApply.footerLink")}</Link>
            <Link href="/offline" className="hover:text-fg">{t("landing.footerOffline")}</Link>
            <Link href="/privacy" className="hover:text-fg">{t("landing.footerPrivacy")}</Link>
            <Link href="/delete-account" className="hover:text-fg">{t("landing.footerDeletion")}</Link>
          </nav>
          <p>{t("landing.footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RoleCard({
  role,
  icon,
  title,
  lead,
  points,
}: {
  role: string;
  icon: React.ReactNode;
  title: string;
  lead: string;
  points: string[];
}) {
  return (
    // data-role re-tints the whole card via the accent tokens — the same
    // mechanism the real dashboards use, so this preview cannot drift.
    <div
      data-role={role}
      className="rounded-[var(--radius-lg)] border border-border bg-bg p-5 transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-md"
    >
      <span className="grid size-12 place-items-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-fg">{title}</h3>
      <p className="mt-0.5 text-sm font-medium text-accent-strong">{lead}</p>
      <ul className="mt-3 space-y-2">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted">
            <CheckCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-accent" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

/**
 * Static preview of the register screen — the product's core moment.
 *
 * TAKES `t` AS A PROP. There is no `"use client"` here and so no provider above
 * it; this is a plain function the server component calls, which is the same
 * shape `week-grid.tsx` settled on for the same reason.
 */
function AttendancePreview({ t }: { t: Translate }) {
  const roster = [
    { name: "Amara O.", status: "PRESENT" as const },
    { name: "Ben C.", status: "PRESENT" as const },
    { name: "Chloé D.", status: "LATE" as const },
    { name: "Dev P.", status: "PRESENT" as const },
    { name: "Elif K.", status: "ABSENT" as const },
    { name: "Farid H.", status: "EXCUSED" as const },
  ];

  return (
    <div
      data-role="teacher"
      className="mx-auto max-w-md overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-accent-soft px-4 py-3">
        <div>
          <p className="text-sm font-bold text-fg">{t("landing.previewClass")}</p>
          <p className="text-xs text-fg-muted">{t("landing.previewMeta")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
          <WifiSlashIcon weight="bold" className="size-3.5" />
          {t("landing.previewOffline")}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {roster.map((student) => (
          <li key={student.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-surface-muted text-xs font-bold text-fg-muted">
                {student.name.slice(0, 1)}
              </span>
              <span className="text-sm font-medium text-fg">{student.name}</span>
            </div>
            {/* ⚠ THE SAME TABLE THE REAL REGISTER USES, so the shop window
                cannot drift from the product — and so "Present" is not the one
                English word left on a Marathi front page. The colour token
                comes from the table too, rather than being re-lowercased here
                and quietly disagreeing with it. */}
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `var(--att-${ATTENDANCE_META[student.status].softToken})`,
                color: `var(--att-${ATTENDANCE_META[student.status].token})`,
              }}
            >
              {t(ATTENDANCE_META[student.status].labelKey)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted">
          <ClipboardTextIcon weight="bold" className="size-4" />
          {t("landing.previewSaved")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong">
          <ChatCircleDotsIcon weight="fill" className="size-4" />
          {t("landing.previewNotified")}
        </span>
      </div>
    </div>
  );
}
