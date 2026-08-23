import type { Metadata } from "next";
import Link from "next/link";
import { IdentificationCardIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { leaveBalanceFor, STAFF_ROLES } from "@/lib/staff-records";
import { readJsonArray } from "@/lib/json";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("staff.rosterTitle") };
}

/**
 * The head's staff roster.
 *
 * WHAT THE DESK COULD NOT SHOW. The leave desk carries one line — used, left
 * — because a decision card is not a filing cabinet. The full record the
 * office keeps (staff number, designation, qualification, the joining date a
 * letter quotes) was readable by the head through the library and reachable
 * nowhere: `staffRecordFor` said yes and no page asked. This is that page:
 * one row per member of staff, record beside balance, READ-ONLY — the head
 * reads the file, the office keeps it, and the page says which is which.
 *
 * Admins are on the roster too: the head's view is of the staff, and the
 * office staff are staff. Balances are omitted for people with no
 * entitlement AND no leave — a row of "no entitlement set" for a school
 * that does not use entitlements would be noise pretending to be warning.
 */
export default async function PrincipalStaffPage() {
  const t = await getT();
  const ctx = await requireRole("PRINCIPAL", "ADMIN");

  const staff = await db.membership.findMany({
    where: { schoolId: ctx.schoolId, role: { in: [...STAFF_ROLES] }, status: "ACTIVE", leftAt: null },
    select: {
      id: true,
      role: true,
      subjects: true,
      staffRecord: true,
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      classTeachers: { where: { role: "LEAD" }, select: { class: { select: { name: true } } } },
    },
    orderBy: [{ role: "asc" }],
  });
  staff.sort((a, b) => (a.user.preferredName ?? a.user.name).localeCompare(b.user.preferredName ?? b.user.name, undefined, { sensitivity: "base" }));

  const balances = new Map<string, Awaited<ReturnType<typeof leaveBalanceFor>>>();
  for (const member of staff) balances.set(member.id, await leaveBalanceFor(ctx.schoolId!, member.id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("staff.rosterTitle")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("staff.rosterSubtitle")}</p>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={t("staff.rosterEmpty")}
          description={t("staff.rosterEmptyBody")}
        />
      ) : (
        <ul className="space-y-3" data-testid="staff-roster">
          {staff.map((member) => {
            const name = member.user.preferredName ?? member.user.name;
            const record = member.staffRecord;
            const balance = balances.get(member.id)!;
            const subjects = readJsonArray<string>(member.subjects);
            const leads = member.classTeachers.map((row) => row.class.name);
            const facts: [string, string][] = record
              ? ([
                  [t("staff.staffNumber"), record.staffNumber],
                  [t("staff.designation"), record.designation],
                  [t("staff.qualification"), record.qualification],
                  [t("staff.joinedOn"), record.joinedOn ? formatDate(record.joinedOn) : null],
                ].filter((row): row is [string, string] => Boolean(row[1])) as [string, string][])
              : [];
            const showBalance = balance.entitlement !== null || balance.used > 0 || balance.pending > 0;
            return (
              <li key={member.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar name={name} avatarKey={member.user.avatarKey} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                        {name}
                        <Badge tone="neutral" size="sm">{t(member.role === "TEACHER" ? "role.teacher" : member.role === "PRINCIPAL" ? "role.principal" : "role.admin")}</Badge>
                      </p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {[
                          leads.length > 0 ? t("staff.leadOf", { classes: leads.join(", ") }) : null,
                          subjects.length > 0 ? subjects.join(", ") : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {facts.length > 0 ? (
                        <dl className="mt-2 grid gap-x-6 gap-y-0.5 text-sm sm:grid-cols-2">
                          {facts.map(([label, value]) => (
                            <div key={label} className="flex flex-wrap gap-x-2">
                              <dt className="text-fg-muted">{label}</dt>
                              <dd className="min-w-0 break-words font-medium text-fg">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="mt-2 text-sm text-fg-subtle">{t("staff.nothingOnFile")}</p>
                      )}
                    </div>
                    {showBalance && (
                      <div className="w-full rounded-[--radius-md] bg-surface-muted px-3 py-2 sm:w-auto sm:shrink-0 sm:text-right">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-fg-subtle">{t("staff.balanceTitle")}</p>
                        <p className="mt-0.5 text-sm font-semibold text-fg">
                          {balance.entitlement === null
                            ? t("staff.noEntitlement", { used: balance.used })
                            : t("staff.balance", { used: balance.used, entitlement: balance.entitlement, remaining: balance.remaining ?? 0 })}
                        </p>
                        {balance.pending > 0 && <p className="text-xs text-fg-muted">{t("staff.balancePending", { pending: balance.pending })}</p>}
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-center gap-2 rounded-[--radius-md] bg-surface-muted p-3.5 text-xs leading-relaxed text-fg-muted">
        <IdentificationCardIcon className="size-4 shrink-0" aria-hidden="true" />
        <span>
          {t("staff.rosterReadOnly")}{" "}
          {ctx.role === "ADMIN" && (
            <Link href="/admin/people" className="font-medium text-accent-strong hover:underline">
              {t("staff.rosterEditLink")}
            </Link>
          )}
        </span>
      </p>
    </div>
  );
}
