"use server";

import {
  academicsSettingsSaveSchema,
  condonationDecideSchema,
  courseMappingSaveSchema,
  courseSaveSchema,
  departmentSaveSchema,
  divisionSaveSchema,
  lateRegistrationAskSchema,
  offeringSaveSchema,
  programmeOutcomesSaveSchema,
  programmeSaveSchema,
  registrationSaveSchema,
  roomSaveSchema,
  schemeSaveSchema,
  seatSaveSchema,
  termSaveSchema,
  timetableSlotSaveSchema,
} from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";
import { AccessError } from "@/lib/access-error";
import {
  academicsStructure,
  createDivision,
  removeTimetableSlot,
  saveAcademicsSettings,
  saveCourse,
  saveCourseMapping,
  saveDepartment,
  saveOffering,
  saveProgramme,
  saveProgrammeOutcomes,
  saveRoom,
  saveScheme,
  saveSeat,
  saveTerm,
  saveTimetableSlot,
  setFacultyDepartment,
  setLectureSubstitute,
} from "@/lib/academics";
import { askLateRegistration, decideLateRegistration, saveRegistration } from "@/lib/academics-registration";
import { decideCondonation } from "@/lib/academics-attendance";

/**
 * The college office's academics writes (4 October 2026). Who may make each
 * is the library's to decide; this file reads the form, checks its shape
 * with the contract the API uses, and goes back with the outcome. Only async
 * functions are exported (tests/use-server-exports).
 */
const orNull = (v: string) => (v ? v : null);
const intOrNull = (form: FormData, name: string) => {
  const v = field(form, name);
  return v ? Number.parseInt(v, 10) : null;
};

/** "CO1 | Explain …" lines, one outcome each ("|", ":" or a tab between code and text). */
async function outcomesOf(text: string): Promise<{ code: string; text: string }[]> {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = /^([A-Za-z]{1,4}\d{1,2})\s*[|:\t-]\s*(.+)$/.exec(l);
      if (!m) throw new RuleRefusal("academics.refuseOutcomeLine", 422, { line: l.slice(0, 40) }, "outcomes");
      return { code: m[1]!.toUpperCase(), text: m[2]!.trim() };
    });
}

export async function saveSettingsAction(form: FormData): Promise<void> {
  await runAction("/admin/academics", async () => {
    await saveAcademicsSettings(await requireApiUser(), academicsSettingsSaveSchema.parse({ loadMinHours: intField(form, "loadMinHours"), loadMaxHours: intField(form, "loadMaxHours"), studentsPerFaculty: intField(form, "studentsPerFaculty"), menteesPerMentor: intField(form, "menteesPerMentor") }));
    return "academics.saved";
  });
}

export async function saveDepartmentAction(form: FormData): Promise<void> {
  await runAction("/admin/academics", async () => {
    await saveDepartment(await requireApiUser(), departmentSaveSchema.parse({ id: field(form, "id") || undefined, code: field(form, "code"), name: field(form, "name"), hodMembershipId: orNull(field(form, "hodMembershipId")), condoneFloorPercent: intField(form, "condoneFloorPercent") || 65 }));
    return "academics.saved";
  });
}

export async function setFacultyDepartmentAction(form: FormData): Promise<void> {
  await runAction("/admin/academics", async () => {
    await setFacultyDepartment(await requireApiUser(), { membershipId: field(form, "membershipId"), departmentId: orNull(field(form, "departmentId")) });
    return "academics.saved";
  });
}

export async function saveProgrammeAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/programmes", async () => {
    const exits = ["1", "2", "3", "4"].flatMap((y) => {
      const award = field(form, `exit${y}`);
      return award ? [{ afterYear: Number(y), award, credits: Number(y) * 40 }] : [];
    });
    const threshold = field(form, "attendanceThreshold");
    await saveProgramme(await requireApiUser(), programmeSaveSchema.parse({ id: field(form, "id") || undefined, departmentId: field(form, "departmentId"), code: field(form, "code"), name: field(form, "name"), level: field(form, "level"), durationYears: intField(form, "durationYears"), intake: intField(form, "intake"), regulator: field(form, "regulator") || undefined, stream: field(form, "stream") || undefined, attendanceThreshold: threshold ? Number(threshold) : undefined, exitPoints: exits }));
    return "academics.saved";
  });
}

/**
 * An existing programme's regulator corrected (the owner's decision on TA-538, 14 Nov 2026): everything else the
 * programme holds is sent back as it is, and the threshold is the one the form showed (left blank, the regulator's).
 */
export async function saveProgrammeRegulatorAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/programmes", async () => {
    const ctx = await requireApiUser();
    const p = (await academicsStructure(ctx)).programmes.find((x) => x.id === field(form, "id"));
    if (!p) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const threshold = field(form, "attendanceThreshold");
    await saveProgramme(ctx, programmeSaveSchema.parse({ id: p.id, departmentId: p.departmentId, code: p.code, name: p.name, level: p.level, durationYears: p.durationYears, intake: p.intake, regulator: field(form, "regulator") || undefined, attendanceThreshold: threshold ? Number(threshold) : undefined, exitPoints: p.exitPoints }));
    return "academics.saved";
  });
}

export async function saveOutcomesAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/programmes", async () => {
    await saveProgrammeOutcomes(await requireApiUser(), programmeOutcomesSaveSchema.parse({ programmeId: field(form, "programmeId"), outcomes: await outcomesOf(field(form, "outcomes")) }));
    return "academics.saved";
  });
}

/** The grading table as lines "O 10 90" — grade, points, lowest percentage. */
export async function saveSchemeAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/programmes", async () => {
    const gradingTable = field(form, "gradingTable")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [grade, points, minPercent] = l.split(/[\s,|]+/);
        return { grade, points: Number(points), minPercent: Number(minPercent) };
      });
    await saveScheme(
      await requireApiUser(),
      schemeSaveSchema.parse({
        id: field(form, "id") || undefined,
        programmeId: field(form, "programmeId"),
        name: field(form, "name"),
        effectiveYear: intField(form, "effectiveYear"),
        gradingTable,
        passingRules: { minPercentPerCourse: intField(form, "minPercentPerCourse"), atktLimit: intField(form, "atktLimit"), totalCredits: intField(form, "totalCredits"), internalMax: intField(form, "internalMax"), externalMax: intField(form, "externalMax"), minTermCredits: intField(form, "minTermCredits"), maxTermCredits: intField(form, "maxTermCredits") },
      }),
    );
    return "academics.saved";
  });
}

export async function saveCourseAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/programmes", async () => {
    await saveCourse(await requireApiUser(), courseSaveSchema.parse({ id: field(form, "id") || undefined, schemeId: field(form, "schemeId"), code: field(form, "code"), name: field(form, "name"), semester: intField(form, "semester"), creditsL: intField(form, "creditsL"), creditsT: intField(form, "creditsT"), creditsP: intField(form, "creditsP"), kind: field(form, "kind"), outcomes: await outcomesOf(field(form, "outcomes")) }));
    return "academics.saved";
  });
}

/** A course's articulation matrix as lines "CO1 PO2 3" — course outcome, programme outcome, strength 1–3. */
export async function saveMappingAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/programmes", async () => {
    const rows = field(form, "mapping")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [coCode = "", poCode = "", level = ""] = l.split(/[\s,|]+/);
        if (!/^[1-3]$/.test(level)) throw new RuleRefusal("academics.refuseMappingLine", 422, { line: l.slice(0, 40) }, "mapping");
        return { coCode: coCode.toUpperCase(), poCode: poCode.toUpperCase(), level: Number(level) };
      });
    await saveCourseMapping(await requireApiUser(), field(form, "courseId"), courseMappingSaveSchema.parse({ rows }));
    return "academics.saved";
  });
}

/** The term form answers in place (A3-journeys-27): a refusal keeps the dates typed and sits under the field it is about. */
export async function saveTermAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(previous, form, async () => {
    await saveTerm(await requireApiUser(), termSaveSchema.parse({ id: field(form, "id") || undefined, name: field(form, "name"), academicYear: field(form, "academicYear"), startsOn: field(form, "startsOn"), endsOn: field(form, "endsOn"), registrationOpensOn: field(form, "registrationOpensOn"), registrationClosesOn: field(form, "registrationClosesOn") }));
    return "academics.saved";
  }, { revalidate: ["/admin/academics/terms"] });
}

export async function saveRoomAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/terms", async () => {
    await saveRoom(await requireApiUser(), roomSaveSchema.parse({ id: field(form, "id") || undefined, name: field(form, "name"), capacity: intField(form, "capacity"), kind: field(form, "kind") || "CLASSROOM" }));
    return "academics.saved";
  });
}

export async function createDivisionAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(previous, form, async () => {
    await createDivision(await requireApiUser(), divisionSaveSchema.parse({ programmeId: field(form, "programmeId"), yearOfStudy: intField(form, "yearOfStudy"), name: field(form, "name"), academicYear: field(form, "academicYear") }));
    return "academics.saved";
  }, { revalidate: ["/admin/academics/terms"] });
}

export async function saveSeatAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/students", async () => {
    await saveSeat(await requireApiUser(), seatSaveSchema.parse({ studentMembershipId: field(form, "studentMembershipId"), programmeId: field(form, "programmeId"), schemeId: field(form, "schemeId"), entryYear: intField(form, "entryYear"), yearOfStudy: intField(form, "yearOfStudy"), semester: intField(form, "semester"), divisionId: orNull(field(form, "divisionId")), rollNumber: intOrNull(form, "rollNumber"), prn: orNull(field(form, "prn")) }));
    return "academics.saved";
  });
}

export async function saveOfferingAction(form: FormData): Promise<void> {
  const back = field(form, "back") || "/admin/academics/offerings";
  await runAction(back, async () => {
    await saveOffering(await requireApiUser(), offeringSaveSchema.parse({ id: field(form, "id") || undefined, termId: field(form, "termId"), courseId: field(form, "courseId"), divisionId: orNull(field(form, "divisionId")), facultyMembershipId: orNull(field(form, "facultyMembershipId")), lectureHours: intField(form, "lectureHours"), tutorialHours: intField(form, "tutorialHours"), practicalHours: intField(form, "practicalHours"), roomId: orNull(field(form, "roomId")), capacity: intOrNull(form, "capacity") }));
    return "academics.saved";
  });
}

export async function saveSlotAction(form: FormData): Promise<void> {
  await runAction(`/admin/academics/timetable?termId=${encodeURIComponent(field(form, "termId"))}`, async () => {
    await saveTimetableSlot(await requireApiUser(), timetableSlotSaveSchema.parse({ offeringId: field(form, "offeringId"), weekday: intField(form, "weekday"), periodId: field(form, "periodId"), kind: field(form, "kind") || "LECTURE", roomId: orNull(field(form, "roomId")), labBatchId: orNull(field(form, "labBatchId")) }));
    return "academics.slotSaved";
  });
}

export async function removeSlotAction(form: FormData): Promise<void> {
  await runAction(`/admin/academics/timetable?termId=${encodeURIComponent(field(form, "termId"))}`, async () => {
    await removeTimetableSlot(await requireApiUser(), field(form, "slotId"));
    return "academics.slotRemoved";
  });
}

export async function registerOnBehalfAction(form: FormData): Promise<void> {
  const student = field(form, "studentMembershipId");
  await runAction(`/admin/academics/registration?student=${encodeURIComponent(student)}`, async () => {
    await saveRegistration(await requireApiUser(), registrationSaveSchema.parse({ termId: field(form, "termId"), offeringIds: form.getAll("offeringId").map(String), studentMembershipId: student }));
    return "academics.registered";
  });
}

export async function askLateAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/registration", async () => {
    await askLateRegistration(await requireApiUser(), lateRegistrationAskSchema.parse({ studentMembershipId: field(form, "studentMembershipId"), termId: field(form, "termId"), reason: field(form, "reason"), openUntil: field(form, "openUntil") }));
    return "academics.lateAsked";
  });
}

export async function decideLateAction(form: FormData): Promise<void> {
  await runAction("/admin/academics/registration", async () => {
    await decideLateRegistration(await requireApiUser(), field(form, "id"), field(form, "approve") === "1");
    return "academics.decided";
  });
}

export async function decideCondonationAction(form: FormData): Promise<void> {
  const back = field(form, "back") || "/admin/academics/condonations";
  await runAction(back, async () => {
    await decideCondonation(await requireApiUser(), field(form, "id"), condonationDecideSchema.parse({ decision: field(form, "decision"), note: field(form, "note") }));
    return "academics.decided";
  });
}

export async function setSubstituteAction(form: FormData): Promise<void> {
  const back = field(form, "back") || "/admin/academics/substitutions";
  await runAction(back, async () => {
    await setLectureSubstitute(await requireApiUser(), { lectureId: field(form, "lectureId"), substituteMembershipId: orNull(field(form, "substituteMembershipId")) });
    return "academics.saved";
  });
}
