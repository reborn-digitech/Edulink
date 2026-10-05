import { BedIcon, ForkKnifeIcon, MoonStarsIcon, SuitcaseRollingIcon } from "@phosphor-icons/react/ssr";
import { HOSTEL_LEAVE_KINDS } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { familyHostel } from "@/lib/hostel";
import { isModuleOn } from "@/lib/modules";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleOff } from "@/components/module-off";
import { Flash } from "@/components/library/parts";
import { HOSTEL_KIND_KEY, LEAVE_KIND_KEY, LeaveSummary, MEAL_KEY, ROLL_STATUS_KEY, SLOT_KEY } from "./parts";
import { cancelLeaveAction, consentAction, requestLeaveAction } from "@/app/(app)/hostel/actions";
import type { ReactNode } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextField } from "@/components/ui/field";
import { DateTimeField } from "@/components/ui/date-time-field";

/**
 * A boarder's hostel, for the pupil (/student/hostel) and a guardian
 * (/parent/hostel, the child in the switcher): the room and bed, tonight's
 * roll call, today's menu, and leave — asked for here, consented to by a
 * guardian when the pupil asked, decided by the warden. src/lib/hostel.ts
 * reaches only the reader's own child.
 */
export async function FamilyHostelView({ ctx, schoolId, childId, path, ok, error, switcher }: { ctx: ActiveContext; schoolId: string | null; childId?: string; path: string; ok?: string; error?: string; switcher?: ReactNode }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(schoolId, "HOSTEL"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("modules.hostelName")} />
        {switcher}
        <ModuleOff module="HOSTEL" t={t} />
      </div>
    );
  }
  const [h, school] = await Promise.all([familyHostel(ctx, childId), db.school.findUnique({ where: { id: schoolId! }, select: { timezone: true } })]);
  const timeZone = school?.timezone ?? "Asia/Kolkata";
  const back = childId ? `${path}?child=${childId}` : path;
  const a = h.allotment;
  return (
    <div className="space-y-5">
      <PageHeader title={t("modules.hostelName")} description={a ? t("hostel.familyIntro", { name: h.child.name }) : t("hostel.notBoarding", { name: h.child.name })} />
      {switcher}
      <Flash ok={ok} error={error} />
      {a ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader icon={<BedIcon weight="duotone" className="size-5" />} title={a.hostelName} description={t(HOSTEL_KIND_KEY[a.hostelKind])} />
              <CardBody className="space-y-1 text-sm text-fg">
                <p>{t("hostel.roomBed", { room: a.roomNumber, bed: a.bed })}{a.floor ? ` · ${t("hostel.floorN", { floor: a.floor })}` : ""}</p>
                {a.wardenName ? <p className="text-fg-muted">{t("hostel.wardenIs", { name: a.wardenName })}</p> : null}
              </CardBody>
            </Card>
            <Card>
              <CardHeader icon={<MoonStarsIcon weight="duotone" className="size-5" />} title={t("hostel.tonightTitle")} />
              <CardBody className="text-sm">
                <p className={h.tonight.status === "ABSENT" ? "font-semibold text-danger" : "text-fg"}>
                  {h.tonight.status === "NOT_TAKEN" ? t("hostel.rollNOT_TAKEN") : `${t(SLOT_KEY[h.tonight.slot])}: ${t(ROLL_STATUS_KEY[h.tonight.status])}`}
                </p>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader icon={<ForkKnifeIcon weight="duotone" className="size-5" />} title={t("hostel.menuToday")} />
            <CardBody>
              {h.menuToday.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("hostel.noMenu")}</p>
              ) : (
                <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[8rem_1fr]">
                  {h.menuToday.map((m) => (
                    <div key={m.meal} className="contents">
                      <dt className="font-medium text-fg-muted">{t(MEAL_KEY[m.meal])}</dt>
                      <dd className="text-fg">{m.items}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader icon={<SuitcaseRollingIcon weight="duotone" className="size-5" />} title={t("hostel.askLeave")} description={h.canConsent ? t("hostel.askLeaveGuardian") : t("hostel.askLeavePupil")} />
            <CardBody>
              {/* Answers in place (A3-journeys-27): back-before-out keeps the form as typed and is said under "back". */}
              <ActionForm action={requestLeaveAction} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="back" value={back} />
                {childId ? <input type="hidden" name="childId" value={childId} /> : null}
                <SelectField label={t("hostel.leaveKind")} name="kind" required>
                  {HOSTEL_LEAVE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(LEAVE_KIND_KEY[k])}
                    </option>
                  ))}
                </SelectField>
                <TextField label={t("hostel.destination")} name="destination" required maxLength={120} />
                <DateTimeField label={t("hostel.leaveFrom")} name="fromAt" required />
                <DateTimeField label={t("hostel.leaveTo")} name="toAt" required />
                <TextField className="sm:col-span-2" label={t("hostel.leaveReason")} name="reason" maxLength={300} />
                <div className="sm:col-span-2">
                  <Button type="submit">{t("hostel.askLeaveButton")}</Button>
                </div>
              </ActionForm>
            </CardBody>
          </Card>
        </>
      ) : null}
      <Card>
        <CardHeader icon={<SuitcaseRollingIcon weight="duotone" className="size-5" />} title={t("hostel.leaveTitle")} />
        <CardBody className="p-0">
          {h.leave.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">{t("hostel.noLeave")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {h.leave.map((l) => (
                <li key={l.id} className="space-y-2 px-5 py-3">
                  <LeaveSummary l={l} t={t} timeZone={timeZone} locale={locale} showName={false} />
                  <div className="flex flex-wrap gap-2">
                    {h.canConsent && l.status === "AWAITING_CONSENT" ? (
                      <ActionForm action={consentAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="leaveId" value={l.id} />
                        <input type="hidden" name="back" value={back} />
                        <Button type="submit" size="sm" name="decision" value="APPROVE">
                          {t("hostel.consent")}
                        </Button>
                        <Button type="submit" size="sm" variant="ghost" name="decision" value="REFUSE">
                          {t("hostel.refuseConsent")}
                        </Button>
                      </ActionForm>
                    ) : null}
                    {!l.outAt && ["AWAITING_CONSENT", "PENDING", "APPROVED"].includes(l.status) ? (
                      <ActionForm action={cancelLeaveAction}>
                        <input type="hidden" name="leaveId" value={l.id} />
                        <input type="hidden" name="back" value={back} />
                        <Button type="submit" size="sm" variant="ghost">
                          {t("hostel.cancelLeave")}
                        </Button>
                      </ActionForm>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
