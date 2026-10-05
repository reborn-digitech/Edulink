import type { Metadata } from "next";
import { momentFormatter } from "@/lib/school-zone";
import Link from "next/link";
import { CalendarCheckIcon, ChalkboardTeacherIcon, GiftIcon, HandshakeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { alumniCollege, mentorBookings } from "@/lib/placement-alumni";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { EmptyState } from "@/components/ui/states";
import { Flash, GIFT_KIND_KEY, LINK } from "@/components/placement/parts";
import { closeMentorBookingAction, companyLinkAction, meetAction, mentorSlotAction, referralAction } from "@/app/(app)/placement/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.alumniCollegeTitle"), robots: { index: false, follow: false } };
}

const BACK = "/alumni/college";

/**
 * What a college asks of its alumni (the placement module's part of the
 * alumni module, 4 October 2026): a mentor's free one-to-ones — the mock
 * interviews of the season, never priced — referrals of openings, the
 * company an alumnus recruits for, meets and reunions with registration, the
 * gifts the college recorded, and the alumni survey while one is open.
 */
export default async function AlumniCollegePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ALUMNUS");
  const moment = await momentFormatter(ctx.schoolId);
  const t = await getT();
  const { ok, error } = await searchParams;
  const [on, kind, placementOn] = await Promise.all([isModuleOn(ctx.schoolId, "ALUMNI"), institutionKindOf(ctx.schoolId), isModuleOn(ctx.schoolId, "PLACEMENT")]);
  if (!on || !isCollegeKind(kind)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("placement.alumniCollegeTitle")} />
        {on ? <EmptyState title={t("placement.notCollegeTitle")} description={t("placement.notCollegeBody")} /> : <ModuleOff module="ALUMNI" t={t} college={isCollegeKind(kind)} />}
      </div>
    );
  }
  const [c, bookings] = await Promise.all([alumniCollege(ctx), mentorBookings(ctx)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("placement.alumniCollegeTitle")} description={t("placement.alumniCollegeIntro")} back={{ href: "/alumni", label: t("modules.alumniName") }} />
      <Flash ok={ok} error={error} />
      {c.surveyUrl ? (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
            <span>{t("placement.surveyOpen")}</span>
            <Link className={LINK} href={c.surveyUrl}>{t("placement.answerSurvey")}</Link>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("placement.mentoringTitle")} description={c.mentor ? t("placement.mentoringIntroMentor") : t("placement.mentoringIntroNot")} />
        {c.mentor ? (
          <CardBody className="space-y-4 text-sm">
            {c.slots.map((s) => (
              <div key={s.id} className="flex justify-between gap-3">
                <span>{s.title}</span>
                <span className="text-fg-muted">{moment(s.startsAt)} · {s.seatsLeft > 0 ? t("placement.slotFree") : t("placement.slotTaken")}</span>
              </div>
            ))}
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-2">
                <span>{b.title} · {b.studentName} · <span className="text-fg-muted">{b.purpose}</span></span>
                {b.canClose ? (
                  <div className="flex gap-2">
                    <ActionForm action={closeMentorBookingAction}>
                      <input type="hidden" name="back" value={BACK} />
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="outcome" value="DELIVERED" />
                      <Button type="submit" size="sm">{t("placement.markHeld")}</Button>
                    </ActionForm>
                    <ActionForm action={closeMentorBookingAction}>
                      <input type="hidden" name="back" value={BACK} />
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="outcome" value="MISSED" />
                      <Button type="submit" size="sm" variant="secondary">{t("placement.markMissed")}</Button>
                    </ActionForm>
                  </div>
                ) : (
                  <Badge>{b.status}</Badge>
                )}
              </div>
            ))}
            <ActionForm action={mentorSlotAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-4 sm:items-end">
              <input type="hidden" name="back" value={BACK} />
              <TextField label={t("placement.fieldSlotTitle")} name="title" required maxLength={160} hint={t("placement.fieldSlotTitleHint")} />
              <TextField label={t("placement.fieldStartsAt")} name="startsAt" type="datetime-local" required />
              <SelectField label={t("placement.fieldMinutes")} name="minutes" defaultValue="30">
                {[30, 45, 60].map((m) => <option key={m} value={m}>{t("placement.minutesN", { minutes: m })}</option>)}
              </SelectField>
              <TextField label={t("placement.fieldMeetingUrl")} name="meetingUrl" type="url" required maxLength={500} />
              <Button type="submit" className="sm:col-span-4 sm:justify-self-start">{t("placement.offerSlot")}</Button>
            </ActionForm>
          </CardBody>
        ) : null}
      </Card>
      {placementOn ? (
        <Card>
          <CardHeader icon={<HandshakeIcon weight="duotone" className="size-5" />} title={t("placement.referTitle")} description={t("placement.referIntro")} />
          <CardBody className="space-y-4 text-sm">
            {c.referrals.map((r) => <div key={r.id}>{r.driveTitle ?? r.companyName} · <span className="text-fg-muted">{r.note}</span></div>)}
            <ActionForm action={referralAction} className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="back" value={BACK} />
              <SelectField label={t("placement.fieldReferDrive")} name="driveId" defaultValue="">
                <option value="">{t("placement.referNoDrive")}</option>
                {c.openDrives.map((d) => <option key={d.id} value={d.id}>{d.title} · {d.companyName}</option>)}
              </SelectField>
              <TextField label={t("placement.fieldReferCompany")} name="companyName" maxLength={160} />
              <TextField label={t("placement.fieldReferNote")} name="note" required maxLength={1000} />
              <Button type="submit" className="sm:col-span-3 sm:justify-self-start">{t("placement.sendReferral")}</Button>
            </ActionForm>
            <ActionForm action={companyLinkAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="back" value={BACK} />
              <TextField label={t("placement.fieldMyCompanyId")} name="identifier" maxLength={30} hint={t("placement.fieldMyCompanyHint")} />
              <TextField label={t("placement.fieldMyRole")} name="role" maxLength={120} />
              <Button type="submit" variant="secondary" className="sm:justify-self-start">{t("placement.saveMyCompany")}</Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("placement.meetsTitle")} />
        <CardBody className="space-y-3 text-sm">
          {c.meets.length === 0 ? <p className="text-fg-muted">{t("placement.noMeets")}</p> : null}
          {c.meets.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-fg-muted">{m.on}{m.venue ? ` · ${m.venue}` : ""} · {t("placement.goingN", { count: m.registered })}</div>
              </div>
              <ActionForm action={meetAction}>
                <input type="hidden" name="back" value={BACK} />
                <input type="hidden" name="meetId" value={m.id} />
                <input type="hidden" name="going" value={m.mine ? "0" : "1"} />
                <Button type="submit" size="sm" variant={m.mine ? "secondary" : "primary"}>{m.mine ? t("placement.notGoing") : t("placement.going")}</Button>
              </ActionForm>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<GiftIcon weight="duotone" className="size-5" />} title={t("placement.giftsTitle")} description={t("placement.giftsIntroAlumnus")} />
        <CardBody className="space-y-1 text-sm">
          {c.gifts.length === 0 ? <p className="text-fg-muted">{t("placement.noGifts")}</p> : null}
          {c.gifts.map((g) => <div key={g.id}>{g.on} · {t(GIFT_KIND_KEY[g.kind]!)}{g.amountRupees !== null ? ` · ₹${g.amountRupees}` : ""} · {t("placement.receiptRef", { ref: g.receiptRef })}</div>)}
        </CardBody>
      </Card>
    </div>
  );
}
