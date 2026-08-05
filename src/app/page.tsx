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
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.tagline"),
  description:
    "Attendance in ten seconds. Grades parents actually see. A calm, safe place for schools, students and families. Installs as an app and works offline.",
};
}

export default async function LandingPage() {
  // Signed-in visitors get a route back to their own dashboard rather than a
  // marketing page they have already been sold. (§7 no dead ends)
  const session = await getSession();
  const home = session?.role ? ROLE_HOME[session.role] : null;

  return (
    <div className="min-h-safe bg-bg">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-md">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link href="/" className="rounded-[--radius-sm]" aria-label="EduLink home">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/join">Join with a code</Link>
            </Button>
            {home ? (
              <Button asChild size="sm" iconRight={<ArrowRightIcon weight="bold" />}>
                <Link href={home}>Go to my dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Register your school</Link>
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
              Works offline · Installs like a real app
            </span>

            <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.08] tracking-tight text-fg sm:text-6xl">
              School and home,
              <span className="block bg-gradient-to-r from-[#4f8dfb] to-[#7e22ce] bg-clip-text text-transparent">
                finally on the same page.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
              Take the register in ten seconds — even with no signal. Parents see attendance,
              grades and teacher notes the moment they happen. Children get a place that is
              genuinely theirs, and genuinely safe.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" iconRight={<ArrowRightIcon weight="bold" />}>
                <Link href="/register">Register your school — free</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/join">I have a school code</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-fg-muted">
              No card needed. Set up in about five minutes.
            </p>

            <div className="mt-6 flex justify-center">
              <InstallButton />
            </div>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <AttendancePreview />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-border bg-surface px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              One app. Four very different days.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-fg-muted">
              EduLink shows each person exactly what they need and nothing they do not.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <RoleCard
                role="teacher"
                icon={<ChalkboardTeacherIcon weight="duotone" className="size-7" />}
                title="Teachers"
                lead="Ten seconds, not ten minutes."
                points={[
                  "One-tap register that works with no signal",
                  "Assignments and grading in the same place",
                  "Message a parent without giving out your number",
                ]}
              />
              <RoleCard
                role="student"
                icon={<GraduationCapIcon weight="duotone" className="size-7" />}
                title="Students"
                lead="A place that feels like yours."
                points={[
                  "Today's work, no scrolling required",
                  "Pick an avatar, collect gentle streaks",
                  "Share what you have made — safely reviewed first",
                ]}
              />
              <RoleCard
                role="parent"
                icon={<HandHeartIcon weight="duotone" className="size-7" />}
                title="Parents"
                lead="Know before you have to ask."
                points={[
                  "Attendance and grades for every child, one screen",
                  "Reply to a teacher without a phone-tag chain",
                  "Choose what you get told, and when",
                ]}
              />
              <RoleCard
                role="admin"
                icon={<UsersThreeIcon weight="duotone" className="size-7" />}
                title="School admins"
                lead="See the whole school clearly."
                points={[
                  "Invite staff and classes in bulk",
                  "Attendance and engagement trends",
                  "Moderation queue and full audit trail",
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
              title="Built for the back of the field trip bus"
              body="Mark the register with no bars at all. Your changes queue on the device and sync themselves the moment signal returns — nothing to remember, nothing to re-enter."
            />
            <Feature
              icon={<DeviceMobileIcon weight="duotone" className="size-6" />}
              title="A real app, without an app store"
              body="Install straight from the browser on Android. Home-screen icon, full screen, push notifications that arrive when the app is closed. No downloads, no approvals, no waiting."
            />
            <Feature
              icon={<LockKeyIcon weight="duotone" className="size-6" />}
              title="Safe by construction, not by policy"
              body="Every school's data is walled off. Children's posts are reviewed before anyone sees them. No public profiles, no student-to-stranger messaging, full export and deletion on request."
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Set up your school before your tea goes cold
            </h2>
            <ol className="mx-auto mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                { n: 1, title: "Register the school", body: "Name, logo, contact. You get a code like RIVER-7X9K." },
                { n: 2, title: "Invite your teachers", body: "Paste a list of emails or upload a CSV. One click each to accept." },
                { n: 3, title: "Share the class code", body: "Students join with a code or the classroom QR. Parents link to their child." },
              ].map((step) => (
                <li key={step.n} className="rounded-[--radius-lg] border border-border bg-bg p-5">
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
                <Link href="/register">Start with your school</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-fg-muted sm:flex-row">
          <Wordmark size={24} />
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/login" className="hover:text-fg">Log in</Link>
            <Link href="/join" className="hover:text-fg">Join with a code</Link>
            <Link href="/register" className="hover:text-fg">Register a school</Link>
            <Link href="/offline" className="hover:text-fg">Offline</Link>
          </nav>
          <p>Built for schools, students and families.</p>
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
      className="rounded-[--radius-lg] border border-border bg-bg p-5 transition-[transform,box-shadow] duration-[--dur] ease-[--ease-out] hover:-translate-y-1 hover:shadow-md"
    >
      <span className="grid size-12 place-items-center rounded-[--radius-md] bg-accent-soft text-accent-strong">
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
    <div className="rounded-[--radius-lg] border border-border bg-surface p-6">
      <span className="grid size-11 place-items-center rounded-[--radius-md] bg-accent-soft text-accent-strong">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

/** Static preview of the register screen — the product's core moment. */
function AttendancePreview() {
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
      className="mx-auto max-w-md overflow-hidden rounded-[--radius-xl] border border-border bg-surface shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-accent-soft px-4 py-3">
        <div>
          <p className="text-sm font-bold text-fg">Grade 5 · Sunflower</p>
          <p className="text-xs text-fg-muted">Monday 27 July · 24 students</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
          <WifiSlashIcon weight="bold" className="size-3.5" />
          Offline
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
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `var(--att-${student.status.toLowerCase()}-soft)`,
                color: `var(--att-${student.status.toLowerCase()})`,
              }}
            >
              {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted">
          <ClipboardTextIcon weight="bold" className="size-4" />
          6 saved on this device
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong">
          <ChatCircleDotsIcon weight="fill" className="size-4" />
          Parents notified on sync
        </span>
      </div>
    </div>
  );
}
