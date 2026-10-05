"use server";

import { corpsActivitySaveSchema, corpsEnrolSchema, corpsLeaveSchema, examSquadVisitSaveSchema, labBreakageSaveSchema, lessonObservationSaveSchema, practicePostingSaveSchema, practiceSchoolSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { recordLabBreakage, recordSquadVisit } from "@/lib/duty-desks";
import { addLessonObservation, savePracticePosting, savePracticeSchool } from "@/lib/teaching-practice";
import { addCorpsActivity, enrolInCorps, leaveCorps } from "@/lib/corps";

/**
 * The duties' desks' writes from the web (5 Oct 2026): a breakage in a lab,
 * the teaching-practice schools, postings and observations, the NSS and NCC
 * units' enrolments and activities, a flying squad's visit. Who may make each
 * is the library's to decide (deskCaller: the duty, or the office). Only async
 * functions are exported.
 */

export async function labBreakageAction(form: FormData): Promise<void> {
  await runAction("/duties/lab", async () => {
    await recordLabBreakage(await requireApiUser(), labBreakageSaveSchema.parse({ roomId: field(form, "roomId"), itemCode: field(form, "itemCode"), quantity: intField(form, "quantity"), note: field(form, "note") }));
    return "duties.lab.breakageSaved";
  });
}

export async function practiceSchoolAction(form: FormData): Promise<void> {
  await runAction("/duties/teaching-practice", async () => {
    const udise = field(form, "udise");
    await savePracticeSchool(await requireApiUser(), practiceSchoolSaveSchema.parse({ name: field(form, "name"), udise: udise || null, contact: field(form, "contact") }));
    return "duties.teachingPractice.schoolSaved";
  });
}

export async function practicePostingAction(form: FormData): Promise<void> {
  await runAction("/duties/teaching-practice", async () => {
    await savePracticePosting(await requireApiUser(), practicePostingSaveSchema.parse({ studentMembershipId: field(form, "studentMembershipId"), practiceSchoolId: field(form, "practiceSchoolId"), from: field(form, "from"), to: field(form, "to"), lessonsPlanned: intField(form, "lessonsPlanned") }));
    return "duties.teachingPractice.postingSaved";
  });
}

export async function lessonObservationAction(form: FormData): Promise<void> {
  await runAction("/duties/teaching-practice", async () => {
    await addLessonObservation(await requireApiUser(), field(form, "postingId"), lessonObservationSaveSchema.parse({ at: field(form, "at"), grade: field(form, "grade"), note: field(form, "note") }));
    return "duties.teachingPractice.observationSaved";
  });
}

const corpsOf = (form: FormData) => (field(form, "corps") === "NCC" ? "NCC" : "NSS");
const corpsPath = (corps: "NSS" | "NCC") => (corps === "NCC" ? "/duties/ncc" : "/duties/nss");

export async function enrolCorpsAction(form: FormData): Promise<void> {
  const corps = corpsOf(form);
  await runAction(corpsPath(corps), async () => {
    const ids = form.getAll("student").map(String).filter(Boolean);
    if (!ids.length) throw new RuleRefusal("streamRecords.chooseStudents", 422);
    await enrolInCorps(await requireApiUser(), corps, corpsEnrolSchema.parse({ studentMembershipIds: ids, unit: field(form, "unit") }));
    return "duties.corps.enrolled";
  });
}

export async function leaveCorpsAction(form: FormData): Promise<void> {
  const corps = corpsOf(form);
  await runAction(corpsPath(corps), async () => {
    await leaveCorps(await requireApiUser(), corps, corpsLeaveSchema.parse({ studentMembershipIds: [field(form, "studentMembershipId")], on: field(form, "on") }));
    return "duties.corps.left";
  });
}

export async function corpsActivityAction(form: FormData): Promise<void> {
  const corps = corpsOf(form);
  await runAction(corpsPath(corps), async () => {
    const hours = Number(field(form, "hours").replace(",", "."));
    if (!Number.isFinite(hours)) throw new RuleRefusal("duties.corps.refuseHours", 422);
    await addCorpsActivity(await requireApiUser(), corps, corpsActivitySaveSchema.parse({ title: field(form, "title"), at: field(form, "at"), hours, camp: field(form, "camp") === "on", participantMembershipIds: form.getAll("participant").map(String).filter(Boolean) }));
    return "duties.corps.activitySaved";
  });
}

export async function squadVisitAction(form: FormData): Promise<void> {
  await runAction("/duties/exam-squad", async () => {
    const [scheduleId, examRoomId] = field(form, "hall").split("|");
    await recordSquadVisit(await requireApiUser(), examSquadVisitSaveSchema.parse({ scheduleId: scheduleId ?? "", examRoomId: examRoomId || null, members: field(form, "members"), flagged: field(form, "flagged") === "on", note: field(form, "note") }));
    return "duties.examSquad.visitSaved";
  });
}
