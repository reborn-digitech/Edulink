import type { ReactNode } from "react";
import type { HostelLeaveRow } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ModuleOff } from "@/components/module-off";
import { Flash } from "@/components/library/parts";

/**
 * The hostel's shared pieces (module HOSTEL, 3 Oct 2026): the warden's frame
 * for /hostel and its pages (the WARDEN's home, the office's and the head's
 * from their NAV), and the words for the coded lists.
 */

export const LEAVE_KIND_KEY: Record<HostelLeaveRow["kind"], TranslationKey> = { HOME: "hostel.kindHOME", LOCAL: "hostel.kindLOCAL", MEDICAL: "hostel.kindMEDICAL", NIGHT_OUT: "collegeOffice.kindNIGHT_OUT" };
export const LEAVE_STATUS_KEY: Record<HostelLeaveRow["status"], TranslationKey> = { AWAITING_CONSENT: "hostel.statusAWAITING_CONSENT", PENDING: "hostel.statusPENDING", APPROVED: "hostel.statusAPPROVED", DECLINED: "hostel.statusDECLINED", CANCELLED: "hostel.statusCANCELLED" };
export const ROLL_STATUS_KEY: Record<"PRESENT" | "ON_LEAVE" | "ABSENT" | "NOT_TAKEN", TranslationKey> = { PRESENT: "hostel.rollPRESENT", ON_LEAVE: "hostel.rollON_LEAVE", ABSENT: "hostel.rollABSENT", NOT_TAKEN: "hostel.rollNOT_TAKEN" };
export const SLOT_KEY: Record<"MORNING" | "NIGHT", TranslationKey> = { MORNING: "hostel.slotMORNING", NIGHT: "hostel.slotNIGHT" };
export const MEAL_KEY: Record<"BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER", TranslationKey> = { BREAKFAST: "hostel.mealBREAKFAST", LUNCH: "hostel.mealLUNCH", SNACKS: "hostel.mealSNACKS", DINNER: "hostel.mealDINNER" };
export const HOSTEL_KIND_KEY: Record<"BOYS" | "GIRLS" | "MIXED", TranslationKey> = { BOYS: "hostel.hostelBOYS", GIRLS: "hostel.hostelGIRLS", MIXED: "hostel.hostelMIXED" };
export const ROOM_KIND_KEY: Record<"DORMITORY" | "SHARED" | "SINGLE" | "SICK_BAY", TranslationKey> = { DORMITORY: "hostel.roomDORMITORY", SHARED: "hostel.roomSHARED", SINGLE: "hostel.roomSINGLE", SICK_BAY: "hostel.roomSICK_BAY" };
export const WEEKDAY_KEY: Record<number, TranslationKey> = { 1: "hostel.day1", 2: "hostel.day2", 3: "hostel.day3", 4: "hostel.day4", 5: "hostel.day5", 6: "hostel.day6", 7: "hostel.day7" };

export const inputClass = "mt-1.5 block min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] text-fg";

export async function wardenContext() {
  const ctx = await requireRole("WARDEN", "ADMIN", "PRINCIPAL");
  const [t, locale, on, school] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "HOSTEL"), db.school.findUnique({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  return { ctx, t, locale, on, canWrite: ctx.role !== "PRINCIPAL", timeZone: school?.timezone ?? "Asia/Kolkata" };
}

const TABS = [
  ["home", "/hostel", "hostel.tabToday"],
  ["rollcall", "/hostel/rollcall", "hostel.tabRollCall"],
  ["leave", "/hostel/leave", "hostel.tabLeave"],
  // The night-out register and the curfew at the gate (5 Oct 2026).
  ["night", "/hostel/night", "collegeDesks.nightTab"],
  // A proposal to end a boarder's place, decided by the principal (5 Oct 2026).
  ["expulsions", "/hostel/expulsions", "collegeDesks.expulsionsTab"],
  ["rooms", "/hostel/rooms", "hostel.tabRooms"],
  ["visitors", "/hostel/visitors", "hostel.tabVisitors"],
  ["menu", "/hostel/menu", "hostel.tabMenu"],
  ["incidents", "/hostel/incidents", "hostel.tabIncidents"],
] as const;

export function WardenFrame({ t, on, current, title, description, ok, error, children, back }: { t: Translate; on: boolean; current: (typeof TABS)[number][0] | null; title: string; description?: string; ok?: string; error?: string; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={on ? description : undefined} back={back} />
      {on ? (
        <>
          <TabBar ariaLabel={t("hostel.wardenNav")} current={current ?? ""} tabs={TABS.map(([key, href, label]) => ({ key, href, label: t(label) }))} />
          <Flash ok={ok} error={error} />
          {children}
        </>
      ) : (
        <ModuleOff module="HOSTEL" t={t} />
      )}
    </div>
  );
}

export const when = (iso: string, timeZone: string, locale: string) => formatInZone(new Date(iso), timeZone, { dateStyle: "medium", timeStyle: "short" }, locale);

/** One leave in a line: who, where, from when to when, and where it stands. */
export function LeaveSummary({ l, t, timeZone, locale, showName }: { l: HostelLeaveRow; t: Translate; timeZone: string; locale: string; showName: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-fg">
        {showName ? `${l.name}${l.className ? ` (${l.className})` : ""} · ` : ""}
        {t(LEAVE_KIND_KEY[l.kind])} · {l.destination}
      </p>
      <p className="mt-0.5 text-xs text-fg-muted">
        {t("hostel.fromTo", { from: when(l.fromAt, timeZone, locale), to: when(l.toAt, timeZone, locale) })} · {t(LEAVE_STATUS_KEY[l.status])}
        {l.consentByName ? ` · ${t("hostel.consentBy", { name: l.consentByName })}` : ""}
        {l.outAt ? ` · ${t("hostel.outAt", { at: when(l.outAt, timeZone, locale) })}` : ""}
        {l.inAt ? ` · ${t("hostel.inAt", { at: when(l.inAt, timeZone, locale) })}` : ""}
        {l.late ? ` · ${t("hostel.late")}` : ""}
        {l.reason ? ` · ${l.reason}` : ""}
        {l.decisionNote ? ` · ${l.decisionNote}` : ""}
      </p>
    </div>
  );
}
