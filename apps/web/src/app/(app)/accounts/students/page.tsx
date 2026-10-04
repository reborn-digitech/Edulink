import type { Metadata } from "next";
import Link from "next/link";
import { UserIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf } from "@/lib/modules";
import { officeLedger } from "@/lib/college-fees";
import { noDuesView } from "@/lib/no-dues";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { Flash, Hidden, NotCollege, SCHEME_KEY, CLAIM_STATUS_KEY, Table, day, money } from "@/components/college-office/parts";
import { leaveAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.navStudents") };
}

/**
 * ONE STUDENT AT THE ACCOUNTS DESK (4 Oct 2026): the year's ledger with the
 * scholarship receivable set against each term and what the family owes net
 * of it; the leaving clearance; and, for the office, the leaving itself —
 * refused until every desk has cleared, then the departure, the alumnus
 * opened and the caution deposit's return recorded.
 */
export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; student?: string }> }) {
  const ctx = await requireRole("ACCOUNTS", "ADMIN", "PRINCIPAL");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  const students = await db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, orderBy: { user: { name: "asc" } }, take: 1000, select: { id: true, studentCode: true, user: { select: { name: true } } } });
  const chosen = sp.student && students.some((s) => s.id === sp.student) ? sp.student : null;
  const [ledger, leaving] = chosen ? await Promise.all([officeLedger(ctx, chosen), noDuesView(ctx, chosen, "LEAVING")]) : [null, null];
  const back = `/accounts/students${chosen ? `?student=${chosen}` : ""}`;
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.navStudents")} description={t("collegeOffice.studentsIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardBody className="pt-5">
          <form className="flex flex-wrap items-end gap-3">
            <SelectField name="student" required label={t("collegeOffice.colName")} defaultValue={chosen ?? ""}>
              <option value="" disabled>
                {t("collegeOffice.pickStudent")}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name} {s.studentCode ? `(${s.studentCode})` : ""}
                </option>
              ))}
            </SelectField>
            <Button type="submit" variant="secondary">{t("collegeOffice.open")}</Button>
          </form>
        </CardBody>
      </Card>
      {!ledger ? (
        <EmptyState icon={<UserIcon weight="duotone" className="size-8" />} title={t("collegeOffice.pickStudent")} description={t("collegeOffice.pickStudentBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/accounts">{t("role.accounts")}</Link></Button>} />
      ) : (
        <>
          <Card>
            <CardHeader title={t("collegeOffice.ledgerOf", { name: ledger.student.name, year: ledger.year?.name ?? "—" })} description={t("collegeOffice.ledgerIntro")} />
            <CardBody className="space-y-4">
              <Table head={[t("collegeOffice.colTerm"), t("collegeOffice.colDue"), t("collegeOffice.colDemand"), t("collegeOffice.colScholarship"), t("collegeOffice.colPaid"), t("collegeOffice.colNetDue"), t("collegeOffice.colLateFee")]} testId="office-ledger">
                {ledger.terms.map((x) => (
                  <tr key={x.demandId}>
                    <td className="py-2 pr-3">{x.label}</td>
                    <td className="py-2 pr-3">{day(x.dueDateKey, locale)}</td>
                    <td className="py-2 pr-3 tabular-nums">{money(x.demandPaise, locale)}</td>
                    <td className="py-2 pr-3 tabular-nums">{money(x.scholarshipReceivablePaise, locale)}</td>
                    <td className="py-2 pr-3 tabular-nums">{money(x.paidPaise, locale)}</td>
                    <td className="py-2 pr-3 tabular-nums font-medium">{money(x.netDuePaise, locale)}</td>
                    <td className="py-2 pr-3 tabular-nums">{x.lateFeePaise > 0 ? money(x.lateFeePaise, locale) : "—"}</td>
                  </tr>
                ))}
              </Table>
              {ledger.claims.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {ledger.claims.map((c) => (
                    <li key={c.id}>
                      {t(SCHEME_KEY(c.scheme))}: {t(CLAIM_STATUS_KEY(c.status))} · {money(c.receivablePaise, locale)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardBody>
          </Card>
          {leaving ? (
            <Card>
              <CardHeader title={t("collegeOffice.leavingTitle")} description={leaving.completed ? t("collegeOffice.noDuesComplete") : t("collegeOffice.leavingBlocked")} />
              <CardBody className="space-y-3">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/accounts/no-dues?event=LEAVING&student=${ledger.student.studentMembershipId}`}>{t("collegeOffice.navNoDues")}</Link>
                </Button>
                {ctx.role === "ADMIN" && leaving.completed ? (
                  <form action={leaveAction} className="grid gap-3 sm:grid-cols-3">
                    <Hidden fields={{ back, studentMembershipId: ledger.student.studentMembershipId }} />
                    <TextField name="leftOn" type="date" required label={t("collegeOffice.leftOn")} />
                    <SelectField name="reason" required label={t("collegeOffice.colReason")}>
                      <option value="GRADUATED">{t("collegeOffice.leaveGraduated")}</option>
                      <option value="TRANSFERRED">{t("collegeOffice.leaveTransferred")}</option>
                      <option value="LEFT">{t("collegeOffice.leaveLeft")}</option>
                    </SelectField>
                    <TextField name="cautionReturnRef" label={t("collegeOffice.cautionRef")} />
                    <div className="sm:col-span-3">
                      <Button type="submit" variant="danger">{t("collegeOffice.recordLeaving")}</Button>
                    </div>
                  </form>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
