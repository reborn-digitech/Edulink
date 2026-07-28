import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChalkboardTeacherIcon,
  ConfettiIcon,
  EnvelopeSimpleIcon,
  GraduationCapIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getChecklist } from "@/lib/onboarding";
import { db } from "@/lib/db";
import { todayKey, formatDateKey } from "@/lib/dates";
import { Card, CardHeader, CardBody, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { WelcomeBanner } from "./welcome-banner";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "School overview" };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const ctx = await requireRole("ADMIN");
  const { welcome } = await searchParams;

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { name: true, code: true, timezone: true },
  });

  const dateKey = todayKey(school.timezone);

  const [checklist, teacherCount, studentCount, classCount, pendingInvites, todaySessions, classesTotal] =
    await Promise.all([
      getChecklist(ctx.schoolId),
      db.membership.count({ where: { schoolId: ctx.schoolId, role: "TEACHER", status: "ACTIVE" } }),
      db.membership.count({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE" } }),
      db.class.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
      db.invite.count({ where: { schoolId: ctx.schoolId, status: "PENDING" } }),
      db.attendanceSession.count({ where: { schoolId: ctx.schoolId, dateKey } }),
      db.class.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
    ]);

  const attendanceTaken = classesTotal === 0 ? 0 : Math.round((todaySessions / classesTotal) * 100);

  return (
    <div className="space-y-6">
      {welcome === "1" && <WelcomeBanner schoolName={school.name} schoolCode={school.code} />}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{school.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" })} · School
            code{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg">
              {school.code}
            </code>
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/invites/new">Invite people</Link>
        </Button>
      </div>

      {/* ---------------- setup checklist ---------------- */}
      {!checklist.complete ? (
        <Card>
          <CardHeader
            icon={<ConfettiIcon weight="duotone" className="size-5" />}
            title="Finish setting up"
            description={`${checklist.done} of ${checklist.total} done — you can come back to this any time.`}
            action={
              <span className="text-sm font-bold tabular-nums text-accent-strong">
                {Math.round((checklist.done / checklist.total) * 100)}%
              </span>
            }
          />
          <CardBody>
            <div
              className="mb-4 h-2 overflow-hidden rounded-full bg-surface-sunken"
              role="progressbar"
              aria-valuenow={checklist.done}
              aria-valuemin={0}
              aria-valuemax={checklist.total}
              aria-label="Setup progress"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-[--dur-slow] ease-[--ease-out]"
                style={{ width: `${(checklist.done / checklist.total) * 100}%` }}
              />
            </div>

            <ul className="space-y-1.5">
              {checklist.steps.map((step) => (
                <li key={step.id}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-[--radius-md] border p-3",
                      step.done ? "border-transparent bg-ok-soft/50" : "border-border bg-surface",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full",
                        step.done ? "bg-ok text-white" : "border-2 border-border-strong",
                      )}
                    >
                      {step.done && <CheckCircleIcon weight="fill" className="size-5" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          step.done ? "text-fg-muted line-through" : "text-fg",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="truncate text-xs text-fg-muted">{step.description}</p>
                    </div>

                    {!step.done &&
                      (step.blockedBy ? (
                        <Badge tone="neutral" size="sm">
                          Create a class first
                        </Badge>
                      ) : (
                        <Button asChild size="sm" variant="soft">
                          <Link href={step.href}>{step.cta}</Link>
                        </Button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-ok/40 bg-ok-soft/40">
          <CardBody className="flex items-center gap-3 pt-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ok text-white">
              <CheckCircleIcon weight="fill" className="size-6" />
            </span>
            <div>
              <p className="font-semibold text-fg">Your school is fully set up</p>
              <p className="text-sm text-fg-muted">Everything on the checklist is done. Nice work.</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- at a glance ---------------- */}
      <section aria-labelledby="glance">
        <h2 id="glance" className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          At a glance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Teachers"
            value={teacherCount}
            icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
            hint={pendingInvites > 0 ? `${pendingInvites} invite${pendingInvites === 1 ? "" : "s"} pending` : "All invites accepted"}
          />
          <StatTile
            label="Students"
            value={studentCount}
            icon={<GraduationCapIcon weight="duotone" className="size-5" />}
            hint={studentCount === 0 ? "None yet" : `Across ${classCount} class${classCount === 1 ? "" : "es"}`}
          />
          <StatTile
            label="Classes"
            value={classCount}
            icon={<UsersThreeIcon weight="duotone" className="size-5" />}
            hint={classCount === 0 ? "None yet" : "Active this term"}
          />
          <StatTile
            label="Register taken"
            value={classesTotal === 0 ? "—" : `${attendanceTaken}%`}
            tone={attendanceTaken === 100 ? "ok" : attendanceTaken > 0 ? "warn" : "neutral"}
            icon={<EnvelopeSimpleIcon weight="duotone" className="size-5" />}
            hint={classesTotal === 0 ? "No classes yet" : `${todaySessions} of ${classesTotal} today`}
          />
        </div>
      </section>

      {/* ---------------- next steps ---------------- */}
      {teacherCount === 0 && (
        <EmptyState
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
          title="No teachers yet"
          description="Teachers are the fastest way to bring the rest of the school in — they create classes, and their students follow."
          action={
            <Button asChild iconRight={<ArrowRightIcon weight="bold" />}>
              <Link href="/admin/invites/new?role=TEACHER">Invite your first teacher</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="ghost">
              <Link href="/admin/classes/new">Or create a class first</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
