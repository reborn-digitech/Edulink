import type { Metadata } from "next";
import Link from "next/link";
import { ListChecksIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf } from "@/lib/modules";
import { DESK_ROLES, NO_DUES_EVENTS, noDuesList, noDuesView, type NoDuesEvent } from "@/lib/no-dues";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { DESK_KEY, EVENT_KEY, Flash, Hidden, NotCollege, Table, money } from "@/components/college-office/parts";
import { clearLineAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.navNoDues") };
}

/**
 * NO-DUES (4 Oct 2026): for an event — an exam form, leaving the hostel,
 * leaving the college — the students with a line still open and the desks
 * that hold it; one student's lines with what is owed and out; each desk (the
 * accounts, the library, the hostel, the lab's head of department) clears its
 * own line, and a new due afterwards reopens it.
 */
export default async function NoDuesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; event?: string; student?: string }> }) {
  const ctx = await requireRole("ACCOUNTS", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "HOD");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  const event: NoDuesEvent = (NO_DUES_EVENTS as readonly string[]).includes(sp.event ?? "") ? (sp.event as NoDuesEvent) : "EXAM_FORM";
  const [list, one] = await Promise.all([noDuesList(ctx, event), sp.student ? noDuesView(ctx, sp.student, event).catch(() => null) : Promise.resolve(null)]);
  const back = `/accounts/no-dues?event=${event}${sp.student ? `&student=${sp.student}` : ""}`;
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.navNoDues")} description={t("collegeOffice.noDuesIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardBody className="flex flex-wrap gap-2 pt-5">
          {NO_DUES_EVENTS.map((e) => (
            <Button key={e} asChild size="sm" variant={e === event ? "primary" : "secondary"}>
              <Link href={`/accounts/no-dues?event=${e}`}>{t(EVENT_KEY(e))}</Link>
            </Button>
          ))}
        </CardBody>
      </Card>
      {one ? (
        <Card>
          <CardHeader title={t("collegeOffice.noDuesOf", { name: one.studentName, event: t(EVENT_KEY(event)) })} description={one.completed ? t("collegeOffice.noDuesComplete") : t("collegeOffice.noDuesOpen")} />
          <CardBody>
            <Table head={[t("collegeOffice.colDesk"), t("collegeOffice.colOwed"), t("collegeOffice.colOut"), t("collegeOffice.colStatus"), ""]} testId="no-dues-lines">
              {one.lines.map((l) => (
                <tr key={l.desk}>
                  <td className="py-2 pr-3">{t(DESK_KEY(l.desk))}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(l.owedPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{l.itemsOut}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={l.cleared ? "ok" : "warn"}>{l.cleared ? t("collegeOffice.cleared") : t("collegeOffice.notCleared")}</Badge>
                    {l.clearedByName ? <span className="ml-2 text-xs text-fg-muted">{t("collegeOffice.clearedBy", { name: l.clearedByName })}</span> : null}
                  </td>
                  <td className="py-2">
                    {!l.cleared && DESK_ROLES[l.desk].includes(ctx.role) ? (
                      <form action={clearLineAction} className="flex flex-wrap items-end gap-2">
                        <Hidden fields={{ back, studentMembershipId: one.studentMembershipId, event, desk: l.desk }} />
                        <TextField name="note" label={t("collegeOffice.note")} />
                        <Button type="submit" size="sm">{t("collegeOffice.clear")}</Button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </Table>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<ListChecksIcon weight="duotone" className="size-5" />} title={t("collegeOffice.noDuesOpenTitle", { event: t(EVENT_KEY(event)) })} />
        <CardBody>
          {list.items.length === 0 ? (
            <EmptyState title={t("collegeOffice.noDuesAllClear")} description={t("collegeOffice.noDuesAllClearBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/accounts">{t("role.accounts")}</Link></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colName"), t("collegeOffice.colOpenDesks")]}>
              {list.items.map((s) => (
                <tr key={s.studentMembershipId}>
                  <td className="py-2 pr-3">
                    <Link className="text-accent-strong hover:underline" href={`/accounts/no-dues?event=${event}&student=${s.studentMembershipId}`}>
                      {s.studentName}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{s.uncleared.map((d) => t(DESK_KEY(d))).join(", ")}</td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
