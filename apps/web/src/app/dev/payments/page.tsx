import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { forSchool } from "@/lib/tenant-context";
import { requireSuperuser } from "@/lib/tenancy";
import { readFeesGatewayTransport } from "@/lib/env";
import { formatPaise } from "@edulink/i18n";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatInZone } from "@/lib/dates";
import { failAction, markPaidAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.devPayments"), robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

/**
 * The devbox gateway's dashboard: every online order still waiting, with a
 * button to "capture" it and one to fail it.
 *
 * Hard-gated on NODE_ENV like /dev/mailbox, and on the operator on top: this
 * page reads across every school, which no tenant session can, and its
 * buttons settle money — pretend money, but through the real code path.
 * Each school's rows are read inside forSchool because FeePayment is
 * tenant-isolated with no operator clause; the operator's key is kept on the
 * way in, and the list of schools itself is readable to the operator.
 */
export default async function DevPaymentsPage({ searchParams }: { searchParams: Promise<{ outcome?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  await requireSuperuser();
  const t = await getT();
  const locale = await getLocale();
  const { outcome } = await searchParams;
  const transport = readFeesGatewayTransport();

  const schools = await db.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 });
  const rows: { id: string; schoolId: string; schoolName: string; gatewayOrderId: string; amountPaise: number; createdAt: Date; studentMembershipId: string }[] = [];
  for (const school of schools) {
    const pending = await forSchool(school.id, () =>
      db.feePayment.findMany({
        where: { schoolId: school.id, method: "ONLINE", status: "INITIATED", gatewayOrderId: { not: null } },
        select: { id: true, gatewayOrderId: true, amountPaise: true, createdAt: true, studentMembershipId: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    );
    for (const p of pending) rows.push({ ...p, gatewayOrderId: p.gatewayOrderId!, schoolId: school.id, schoolName: school.name });
  }
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Badge tone="warn">Development only</Badge>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">{t("meta.devPayments")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every online order the devbox gateway is holding. Mark one paid and it settles through the same path the real webhook uses: allocation, receipt, and
          the family&apos;s notification.
        </p>
        <p className="mt-1 text-xs text-fg-subtle">
          <code>FEES_GATEWAY_TRANSPORT</code> = <code>{transport}</code>
          {transport === "razorpay" ? " — orders here were created at the real gateway; marking one paid settles it locally without a capture." : ""}
        </p>
      </div>

      {outcome && (
        <p className="mb-4 rounded-[--radius-md] border border-border bg-surface-muted px-4 py-2 text-sm text-fg" data-testid="dev-payments-outcome">
          <code>{outcome}</code>
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No orders waiting" description="Start an online payment from a parent's fees page and it will appear here." />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card>
                <CardHeader
                  title={formatPaise(row.amountPaise, locale, { always: true })}
                  description={[row.schoolName, formatInZone(row.createdAt, "Asia/Kolkata")].join(" · ")}
                  action={<Badge tone="accent" size="sm">{t("fees.payStatusInitiated")}</Badge>}
                />
                <CardBody className="space-y-3">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-fg-muted">
                    <dt>order</dt>
                    <dd className="font-mono text-fg">{row.gatewayOrderId}</dd>
                    <dt>payment</dt>
                    <dd className="font-mono text-fg">{row.id}</dd>
                    <dt>pupil</dt>
                    <dd className="font-mono text-fg">{row.studentMembershipId}</dd>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <form action={markPaidAction}>
                      <input type="hidden" name="schoolId" value={row.schoolId} />
                      <input type="hidden" name="orderId" value={row.gatewayOrderId} />
                      <input type="hidden" name="amountPaise" value={row.amountPaise} />
                      <Button type="submit" size="sm">
                        Mark paid
                      </Button>
                    </form>
                    <form action={failAction}>
                      <input type="hidden" name="schoolId" value={row.schoolId} />
                      <input type="hidden" name="orderId" value={row.gatewayOrderId} />
                      <Button type="submit" size="sm" variant="danger">
                        Fail
                      </Button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
