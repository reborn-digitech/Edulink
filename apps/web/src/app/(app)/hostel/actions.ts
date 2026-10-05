"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  familyHostelLeaveCreateSchema,
  hostelAllotSchema,
  hostelIncidentCreateSchema,
  hostelRollCallTakeSchema,
  hostelRoomSaveSchema,
  hostelSaveSchema,
  hostelVisitorCreateSchema,
  MESS_MEALS,
} from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";
import { db } from "@/lib/db";
import { zonedStartOfDay } from "@/lib/dates";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import {
  allotBed,
  cancelLeave,
  consentLeave,
  decideLeave,
  endAllotment,
  gateIn,
  gateOut,
  recordHostelIncident,
  requestLeave,
  saveHostel,
  saveMessAttendance,
  saveMessMenu,
  saveRoom,
  signVisitorIn,
  signVisitorOut,
  takeRollCall,
} from "@/lib/hostel";

/**
 * The hostel's forms (module HOSTEL, 3 Oct 2026). Each posts with `back`, the
 * page it came from, and returns there with ?ok= or ?error= in the reader's
 * language. The rules — who may allot, approve, consent, take the roll call —
 * are src/lib/hostel.ts's, the same the /api/v1 doors and the phone meet.
 */

const BACK = /^\/(hostel|admin\/hostel|parent\/hostel|student\/hostel)(\/[\w-]*)*$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/hostel";
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}

const withMessage = (back: string, key: "ok" | "error", text: string) => `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/** A form the action could not read: the box it is about when known, the schema's error as the cause when it came from one (lib/form-state.ts reads both). */
class FormError extends Error {
  constructor(
    readonly formField?: string,
    cause?: unknown,
  ) {
    super("form", cause === undefined ? undefined : { cause });
  }
}
function parsed<T>(result: { success: true; data: T } | { success: false; error?: unknown }): T {
  if (!result.success) throw new FormError(undefined, result.error);
  return result.data;
}

type Done = TranslationKey | { key: TranslationKey; vars: Record<string, string | number> } | null;

async function run(formData: FormData, work: (ctx: ActiveContext) => Promise<Done>): Promise<void> {
  const back = backOf(formData);
  const t = await getT();
  let done: Done;
  try {
    const ctx = await requireApiUser();
    done = await work(ctx);
  } catch (error) {
    if (error instanceof AccessError) redirect(withMessage(back, "error", t(error.key, error.vars)));
    if (error instanceof FormError) redirect(withMessage(back, "error", t("common.checkTheForm")));
    throw error;
  }
  revalidatePath(back.split("?")[0]!);
  if (!done) redirect(back);
  redirect(withMessage(back, "ok", typeof done === "string" ? t(done) : t(done.key, done.vars)));
}

/** "2026-10-04T18:30" typed in the school's own time, as an instant. */
function instantIn(local: string, timeZone: string, name?: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new FormError(name);
  return new Date(zonedStartOfDay(m[1]!, timeZone).getTime() + (Number(m[2]) * 60 + Number(m[3])) * 60_000).toISOString();
}

export async function saveHostelAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const input = parsed(
      hostelSaveSchema.safeParse({
        id: str(formData, "id") || undefined,
        name: str(formData, "name"),
        kind: str(formData, "kind"),
        capacity: Number(str(formData, "capacity") || "0"),
        wardenMembershipId: str(formData, "wardenMembershipId") || null,
        messAttendance: formData.get("messAttendance") === "on",
      }),
    );
    await saveHostel(ctx, input);
    return "hostel.saved";
  });
}

export async function saveRoomAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const input = parsed(hostelRoomSaveSchema.safeParse({ id: str(formData, "id") || undefined, hostelId: str(formData, "hostelId"), number: str(formData, "number"), floor: str(formData, "floor"), beds: Number(str(formData, "beds")), kind: str(formData, "kind") || "SHARED" }));
    await saveRoom(ctx, input);
    return "hostel.saved";
  });
}

export async function allotAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const [roomId, bed] = str(formData, "bed").split(":");
    const input = parsed(hostelAllotSchema.safeParse({ membershipId: str(formData, "membershipId"), roomId, bed: Number(bed), fromDate: str(formData, "fromDate"), feeDemandId: str(formData, "feeDemandId") || null }));
    const b = await allotBed(ctx, input);
    return { key: "hostel.allotted", vars: { name: b.name, room: b.roomNumber, bed: b.bed } };
  });
}

export async function endAllotmentAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const toDate = str(formData, "toDate");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) throw new FormError();
    const b = await endAllotment(ctx, str(formData, "allotmentId"), toDate);
    return { key: "hostel.ended", vars: { name: b.name } };
  });
}

export async function rollCallAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const entries = formData
      .getAll("allotmentId")
      .map(String)
      .map((allotmentId) => ({ allotmentId, status: str(formData, `status-${allotmentId}`) }));
    const input = parsed(hostelRollCallTakeSchema.safeParse({ hostelId: str(formData, "hostelId"), dateKey: str(formData, "dateKey"), slot: str(formData, "slot"), clientId: str(formData, "clientId"), entries }));
    const r = await takeRollCall(ctx, input);
    return { key: "hostel.rollTaken", vars: { present: r.present, onLeave: r.onLeave, absent: r.absent } };
  });
}

export async function decideLeaveAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const approve = str(formData, "decision") === "APPROVE";
    await decideLeave(ctx, str(formData, "leaveId"), approve, str(formData, "note").slice(0, 300));
    return approve ? "hostel.leaveApproved" : "hostel.leaveDeclined";
  });
}

export async function gateOutAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const l = await gateOut(ctx, str(formData, "leaveId"));
    return { key: "hostel.wentOut", vars: { name: l.name } };
  });
}

export async function gateInAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const l = await gateIn(ctx, str(formData, "leaveId"));
    return { key: l.late ? "hostel.cameBackLate" : "hostel.cameBack", vars: { name: l.name } };
  });
}

export async function visitorInAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const input = parsed(hostelVisitorCreateSchema.safeParse({ allotmentId: str(formData, "allotmentId"), name: str(formData, "name"), relation: str(formData, "relation"), note: str(formData, "note") }));
    await signVisitorIn(ctx, input);
    return { key: "hostel.visitorIn", vars: { name: input.name } };
  });
}

export async function visitorOutAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    await signVisitorOut(ctx, str(formData, "visitorId"));
    return "hostel.visitorOut";
  });
}

export async function saveMenuAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const entries = [1, 2, 3, 4, 5, 6, 7].flatMap((weekday) => MESS_MEALS.map((meal) => ({ weekday, meal, items: str(formData, `m-${weekday}-${meal}`).slice(0, 300) })));
    await saveMessMenu(ctx, { hostelId: str(formData, "hostelId"), entries });
    return "hostel.saved";
  });
}

export async function hostelIncidentAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const input = parsed(hostelIncidentCreateSchema.safeParse({ allotmentId: str(formData, "allotmentId"), kind: str(formData, "kind"), severity: str(formData, "severity") || "MINOR", title: str(formData, "title"), body: str(formData, "body"), actionTaken: str(formData, "actionTaken"), notifyGuardians: formData.get("notifyGuardians") === "on" }));
    await recordHostelIncident(ctx, input);
    return "hostel.incidentRecorded";
  });
}

/**
 * Leave answers in place (A3-journeys-27): back-before-out keeps every box as
 * typed and is said under "back", not as "Some of this needs another look."
 * at the page's top.
 */
export async function requestLeaveAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      const childId = str(formData, "childId") || undefined;
      const membershipId = childId ?? ctx.membershipId ?? "";
      const school = await db.membership.findUnique({ where: { id: membershipId }, select: { school: { select: { timezone: true } } } });
      const tz = school?.school.timezone ?? "Asia/Kolkata";
      const input = parsed(familyHostelLeaveCreateSchema.safeParse({ childId, kind: str(formData, "kind"), fromAt: instantIn(str(formData, "fromAt"), tz, "fromAt"), toAt: instantIn(str(formData, "toAt"), tz, "toAt"), destination: str(formData, "destination"), reason: str(formData, "reason") }));
      const l = await requestLeave(ctx, input);
      return l.status === "AWAITING_CONSENT" ? "hostel.askedNeedsConsent" : "hostel.askedToWarden";
    },
    { revalidate: [backOf(formData)], fields: { "hostel.refuseLeaveDates": "fromAt", "collegeOffice.refuseNightOut": "kind" } },
  );
}

export async function consentAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const approve = str(formData, "decision") === "APPROVE";
    await consentLeave(ctx, str(formData, "leaveId"), approve);
    return approve ? "hostel.consented" : "hostel.consentRefused";
  });
}

export async function cancelLeaveAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    await cancelLeave(ctx, str(formData, "leaveId"));
    return "hostel.leaveCancelled";
  });
}

export async function messAttendanceAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx): Promise<Done> => {
    const meal = str(formData, "meal");
    if (!(MESS_MEALS as readonly string[]).includes(meal)) throw new FormError();
    const present = new Set(formData.getAll("present").map(String));
    const entries = formData.getAll("allotmentId").map(String).map((allotmentId) => ({ allotmentId, present: present.has(allotmentId) }));
    if (entries.length === 0) throw new FormError();
    const r = await saveMessAttendance(ctx, { hostelId: str(formData, "hostelId"), dateKey: str(formData, "dateKey"), meal: meal as (typeof MESS_MEALS)[number], entries });
    return { key: "hostel.messSaved", vars: { count: r.saved } };
  });
}
