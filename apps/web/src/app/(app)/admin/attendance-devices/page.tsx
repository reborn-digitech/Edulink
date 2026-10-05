import type { Metadata } from "next";
import { FingerprintIcon, IdentificationBadgeIcon, ListChecksIcon } from "@phosphor-icons/react/ssr";
import { DEVICE_KINDS, DEVICE_SCOPES, PUNCH_RECENT_DAYS, type DeviceKind, type DeviceScope, type PunchOutcome } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { devicesView } from "@/lib/attendance-devices";
import { momentFormatter } from "@/lib/school-zone";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextField } from "@/components/ui/field";
import { KeyForm } from "@/components/attendance-devices/key-form";
import { TABLE, TD, TH } from "@/components/placement/parts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { registerDeviceAction, removeBadgeAction, rotateKeyAction, saveBadgeAction, toggleDeviceAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("punch.title"), robots: { index: false, follow: false } };
}

const KIND_KEY: Record<DeviceKind, TranslationKey> = { BIOMETRIC: "punch.kindBIOMETRIC", RFID: "punch.kindRFID", FACE: "punch.kindFACE", OTHER: "punch.kindOTHER" };
const SCOPE_KEY: Record<DeviceScope, TranslationKey> = { STAFF: "punch.scopeSTAFF", STUDENTS: "punch.scopeSTUDENTS", BOTH: "punch.scopeBOTH" };
const OUTCOME_KEY: Record<PunchOutcome, TranslationKey> = {
  APPLIED: "punch.outcomeAPPLIED",
  ALREADY_MARKED: "punch.outcomeALREADY_MARKED",
  LOGGED: "punch.outcomeLOGGED",
  UNKNOWN_BADGE: "punch.outcomeUNKNOWN_BADGE",
  NO_REGISTER: "punch.outcomeNO_REGISTER",
  CLOSED_DAY: "punch.outcomeCLOSED_DAY",
  OUT_OF_SCOPE: "punch.outcomeOUT_OF_SCOPE",
  NOT_RECENT: "punch.outcomeNOT_RECENT",
};

/**
 * The attendance devices (R-2, 5 Oct 2026): the office registers a biometric
 * or RFID reader (its key shown once), rotates a key, disables a device, maps
 * the codes a device sends to people, and reads the last punches with what
 * became of each. The principal reads. A punch writes the staff check-in or
 * the class register through their own writers, never past a mark already made.
 */
export default async function AttendanceDevicesPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const [view, moment] = await Promise.all([devicesView(ctx), momentFormatter(ctx.schoolId)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("punch.title")} description={t("punch.intro", { days: PUNCH_RECENT_DAYS })} />
      <Card>
        <CardHeader icon={<FingerprintIcon weight="duotone" className="size-5" />} title={t("punch.devicesTitle")} />
        <CardBody className="space-y-4">
          {view.devices.length === 0 ? (
            <EmptyState icon={<FingerprintIcon weight="duotone" className="size-8" />} title={t("punch.noDevicesTitle")} description={t("punch.noDevicesBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {view.devices.map((d) => (
                <li key={d.id} className="space-y-2 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{d.name}</span>
                    <Badge tone="neutral">{t(KIND_KEY[d.kind])}</Badge>
                    <Badge tone="outline">{t(SCOPE_KEY[d.scope])}</Badge>
                    {d.disabled ? <Badge tone="danger">{t("punch.disabled")}</Badge> : null}
                  </div>
                  <p className="text-fg-muted">
                    {[d.location, t("punch.keyLine", { last4: d.keyLast4, version: d.keyVersion, when: moment(d.keyRotatedAt) }), d.lastPunchAt ? t("punch.lastPunch", { when: moment(d.lastPunchAt) }) : t("punch.noPunchYet"), t("punch.today", { count: d.punchesToday })].filter(Boolean).join(" · ")}
                  </p>
                  {view.canEdit ? (
                    <div className="flex flex-wrap items-start gap-3">
                      <KeyForm action={rotateKeyAction} submitLabel={t("punch.rotate")}>
                        <input type="hidden" name="deviceId" value={d.id} />
                      </KeyForm>
                      <ActionForm action={toggleDeviceAction}>
                        <input type="hidden" name="deviceId" value={d.id} />
                        <input type="hidden" name="disabled" value={d.disabled ? "false" : "true"} />
                        <Button type="submit" variant="secondary">{d.disabled ? t("punch.enable") : t("punch.disable")}</Button>
                      </ActionForm>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {view.canEdit ? (
            view.sealingAvailable ? (
              <KeyForm action={registerDeviceAction} submitLabel={t("punch.register")} className="grid gap-3 sm:grid-cols-2">
                <TextField name="name" label={t("punch.fieldName")} required minLength={2} maxLength={80} />
                <TextField name="location" label={t("punch.fieldLocation")} maxLength={120} />
                <SelectField name="kind" label={t("punch.fieldKind")} defaultValue="BIOMETRIC">
                  {DEVICE_KINDS.map((k) => (
                    <option key={k} value={k}>{t(KIND_KEY[k])}</option>
                  ))}
                </SelectField>
                <SelectField name="scope" label={t("punch.fieldScope")} defaultValue="BOTH">
                  {DEVICE_SCOPES.map((k) => (
                    <option key={k} value={k}>{t(SCOPE_KEY[k])}</option>
                  ))}
                </SelectField>
              </KeyForm>
            ) : (
              <p className="text-sm text-warn">{t("punch.refuseNoSealing")}</p>
            )
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<IdentificationBadgeIcon weight="duotone" className="size-5" />} title={t("punch.badgesTitle")} description={t("punch.badgesIntro")} />
        <CardBody className="space-y-4">
          {view.badges.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("punch.noBadges")}</p>
          ) : (
            <TableScroll label={t("punch.badgesTitle")}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>{t("punch.colCode")}</th>
                    <th className={TH}>{t("punch.colPerson")}</th>
                    {view.canEdit ? <th className={TH}><span className="sr-only">{t("punch.removeBadge")}</span></th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {view.badges.map((b) => (
                    <tr key={b.id}>
                      <td className={`${TD} font-mono`}>{b.code}</td>
                      <td className={TD}>{b.name}</td>
                      {view.canEdit ? (
                        <td className={TD}>
                          <ActionForm action={removeBadgeAction}>
                            <input type="hidden" name="badgeId" value={b.id} />
                            <Button type="submit" size="sm" variant="secondary">{t("punch.removeBadge")}</Button>
                          </ActionForm>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {view.canEdit ? (
            <ActionForm action={saveBadgeAction} className="grid gap-3 sm:grid-cols-3">
              <TextField name="code" label={t("punch.fieldCode")} required maxLength={64} hint={t("punch.fieldCodeHint")} />
              <SelectField name="membershipId" label={t("punch.fieldPerson")} required defaultValue="">
                <option value="" disabled>{t("punch.choosePerson")}</option>
                {view.people.map((p) => (
                  <option key={p.membershipId} value={p.membershipId}>{p.name}</option>
                ))}
              </SelectField>
              <div className="flex items-end">
                <Button type="submit" variant="secondary">{t("punch.saveBadge")}</Button>
              </div>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ListChecksIcon weight="duotone" className="size-5" />} title={t("punch.recentTitle")} />
        <CardBody className="p-0">
          {view.recent.length === 0 ? (
            <p className="p-5 text-sm text-fg-muted">{t("punch.noPunches")}</p>
          ) : (
            <TableScroll label={t("punch.recentTitle")}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>{t("punch.colWhen")}</th>
                    <th className={TH}>{t("punch.colDevice")}</th>
                    <th className={TH}>{t("punch.colCode")}</th>
                    <th className={TH}>{t("punch.colPerson")}</th>
                    <th className={TH}>{t("punch.colOutcome")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {view.recent.map((p) => (
                    <tr key={p.id}>
                      <td className={TD}>{moment(p.punchedAt)}{p.direction === "OUT" ? ` · ${t("punch.out")}` : ""}</td>
                      <td className={TD}>{p.deviceName}</td>
                      <td className={`${TD} font-mono`}>{p.code}</td>
                      <td className={TD}>{p.name ?? "—"}</td>
                      <td className={TD}><Badge tone={p.outcome === "APPLIED" ? "ok" : p.outcome === "ALREADY_MARKED" || p.outcome === "LOGGED" ? "neutral" : "warn"}>{t(OUTCOME_KEY[p.outcome])}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
