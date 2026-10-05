import type { Metadata } from "next";
import { CalendarPlusIcon, GiftIcon, HandshakeIcon, TableIcon } from "@phosphor-icons/react/ssr";
import { ALUMNI_GIFT_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { alumniCollegeAdmin } from "@/lib/placement-alumni";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { EmptyState } from "@/components/ui/states";
import { Flash, GIFT_KIND_KEY, TABLE, TD, TH } from "@/components/placement/parts";
import { createMeetAction, giftAction } from "@/app/(app)/placement/actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.adminAlumniTitle"), robots: { index: false, follow: false } };
}

const BACK = "/admin/alumni/college";

/**
 * The office's side of a college's alumni (4 October 2026): gifts recorded
 * with the receipt the college issued outside the app (decision 0003), meets
 * and reunions put on the calendar, the referrals alumni sent the cell, and
 * the batch table the AQAR asks for.
 */
export default async function AdminAlumniCollegePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { ok, error } = await searchParams;
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "ALUMNI"), institutionKindOf(ctx.schoolId)]);
  if (!on || !isCollegeKind(kind)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("placement.adminAlumniTitle")} />
        {on ? <EmptyState title={t("placement.notCollegeTitle")} description={t("placement.notCollegeBody")} /> : <ModuleOff module="ALUMNI" t={t} college={isCollegeKind(kind)} />}
      </div>
    );
  }
  const a = await alumniCollegeAdmin(ctx);
  const canWrite = ctx.role === "ADMIN";
  return (
    <div className="space-y-5">
      <PageHeader title={t("placement.adminAlumniTitle")} description={t("placement.adminAlumniIntro")} back={{ href: "/admin/alumni", label: t("modules.alumniName") }} />
      <Flash ok={ok} error={error} />
      <Card>
        <CardHeader icon={<TableIcon weight="duotone" className="size-5" />} title={t("placement.batchTableTitle")} description={t("placement.batchTableIntro")} />
        <CardBody className="p-0">
          <TableScroll>
            <table className={TABLE}>
              <thead>
                <tr className="border-b border-border">
                  <th className={TH}>{t("placement.colBatch")}</th>
                  <th className={TH}>{t("placement.colAlumni")}</th>
                  <th className={TH}>{t("placement.colListed")}</th>
                  <th className={TH}>{t("placement.colMentors")}</th>
                  <th className={TH}>{t("placement.colGifts")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {a.batches.map((b) => (
                  <tr key={b.batchYear}>
                    <td className={TD}>{b.batchYear}</td>
                    <td className={TD}>{b.alumni}</td>
                    <td className={TD}>{b.listed}</td>
                    <td className={TD}>{b.mentors}</td>
                    <td className={TD}>{b.gifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<GiftIcon weight="duotone" className="size-5" />} title={t("placement.giftsTitle")} description={t("placement.giftsIntroOffice")} />
        <CardBody className="space-y-4 text-sm">
          {a.gifts.map((g) => <div key={g.id}>{g.on} · {g.alumnusName}{g.batchYear ? ` (${g.batchYear})` : ""} · {t(GIFT_KIND_KEY[g.kind]!)}{g.amountRupees !== null ? ` · ₹${g.amountRupees}` : ""} · {t("placement.receiptRef", { ref: g.receiptRef })}</div>)}
          {canWrite && a.alumni.length ? (
            <form action={giftAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <input type="hidden" name="back" value={BACK} />
              <SelectField label={t("placement.fieldAlumnus")} name="alumnusMembershipId" required>
                {a.alumni.map((m) => <option key={m.membershipId} value={m.membershipId}>{m.name} ({m.batchYear})</option>)}
              </SelectField>
              <SelectField label={t("placement.fieldGiftKind")} name="kind" defaultValue="DONATION">
                {ALUMNI_GIFT_KINDS.map((k) => <option key={k} value={k}>{t(GIFT_KIND_KEY[k]!)}</option>)}
              </SelectField>
              <TextField label={t("placement.fieldAmount")} name="amount" type="number" min="0" step="1" />
              <TextField label={t("placement.fieldReceiptRef")} name="receiptRef" required maxLength={80} />
              <TextField label={t("placement.fieldGiftOn")} name="on" type="date" required />
              <TextField label={t("placement.fieldGiftNote")} name="note" maxLength={500} />
              <Button type="submit" className="sm:col-span-3 sm:justify-self-start">{t("placement.recordGift")}</Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<CalendarPlusIcon weight="duotone" className="size-5" />} title={t("placement.meetsTitle")} />
        <CardBody className="space-y-4 text-sm">
          {a.meets.map((m) => <div key={m.id}>{m.on} · {m.title}{m.batchYear ? ` (${m.batchYear})` : ""} · {t("placement.goingN", { count: m.registered })}</div>)}
          {canWrite ? (
            <form action={createMeetAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <input type="hidden" name="back" value={BACK} />
              <TextField label={t("placement.fieldMeetTitle")} name="title" required maxLength={160} />
              <TextField label={t("placement.fieldMeetOn")} name="on" type="date" required />
              <TextField label={t("placement.fieldVenues")} name="venue" maxLength={200} />
              <TextField label={t("placement.fieldMeetBatch")} name="batchYear" type="number" min="1950" max="2100" hint={t("placement.fieldMeetBatchHint")} />
              <TextField label={t("placement.fieldGiftNote")} name="note" maxLength={1000} className="sm:col-span-2" />
              <Button type="submit" className="sm:col-span-3 sm:justify-self-start">{t("placement.createMeet")}</Button>
            </form>
          ) : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<HandshakeIcon weight="duotone" className="size-5" />} title={t("placement.referralsTitle")} />
        <CardBody className="space-y-1 text-sm">
          {a.referrals.length === 0 ? <p className="text-fg-muted">{t("placement.noReferrals")}</p> : null}
          {a.referrals.map((r) => <div key={r.id}>{r.alumnusName} · {r.driveTitle ?? r.companyName} · <span className="text-fg-muted">{r.note}</span></div>)}
        </CardBody>
      </Card>
    </div>
  );
}
