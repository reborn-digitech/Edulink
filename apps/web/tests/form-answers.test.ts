import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { termSaveSchema } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { formValues, refusalOf } from "@/lib/form-state";
import { registrationWindow } from "@/lib/academics-rules";

/**
 * A3-journeys-27 and -28 (audit of 5 October 2026): a server-action form's
 * refusal reaches the box it is about with what was typed kept, a schema
 * refusal says what is wrong rather than "Some of this needs another look.",
 * and a registration window still to come is not called closed.
 */
const t = translator("en");

describe("refusalOf: a refusal as the form shows it", () => {
  it("a RuleRefusal keeps the field the library named", () => {
    const r = refusalOf(new RuleRefusal("academics.refuseTermDates", 422, undefined, "endsOn"), t);
    expect(r).toEqual({ message: t("academics.refuseTermDates"), field: "endsOn" });
  });

  it("an AccessError names no field unless the action's map gives its key one", () => {
    const sunday = new AccessError("access.paperOnSunday", "FORBIDDEN", { date: "11 Oct 2026", name: "" });
    expect(refusalOf(sunday, t)).toEqual({ message: t("access.paperOnSunday", { date: "11 Oct 2026", name: "" }), field: undefined });
    expect(refusalOf(sunday, t, { "access.paperOnSunday": "dateKey" })?.field).toBe("dateKey");
  });

  it("an empty mapping puts the sentence by the button (no one box)", () => {
    expect(refusalOf(new RuleRefusal("academics.refuseNotRegistered", 422, undefined, "entries"), t, { entries: "" })?.field).toBeUndefined();
  });

  it("a ZodError names the box its path is about and says what is wrong, not the generic sentence", () => {
    const parsed = termSaveSchema.safeParse({ name: "ZZ Even term", academicYear: "next year", startsOn: "2026-12-10", endsOn: "2027-04-30", registrationOpensOn: "2026-11-01", registrationClosesOn: "2026-12-20" });
    expect(parsed.success).toBe(false);
    const r = refusalOf(!parsed.success ? parsed.error : null, t);
    expect(r?.field).toBe("academicYear");
    expect(r?.message).not.toBe(t("common.checkTheForm"));
    expect(r?.message).toBe(t("refusal.notValid"));
  });

  it("a schema's path is mapped to the form's own name (a fee checked in paise, typed in rupees)", () => {
    const error = Object.assign(new Error("form"), { cause: { name: "ZodError", issues: [{ code: "too_small", minimum: 0, inclusive: true, type: "number", path: ["feePerCoursePaise"], message: "x" }] } });
    expect(refusalOf(error, t, { feePerCoursePaise: "feePerCourse" })).toEqual({ message: t("refusal.numberAtLeast", { min: 0 }), field: "feePerCourse" });
    const slab = { name: "ZodError", issues: [{ code: "custom", path: ["lateFeeSlabs", 0, "paise"], message: "x" }] };
    expect(refusalOf(slab, t, { "lateFeeSlabs.0.paise": "slabFee1" })?.field).toBe("slabFee1");
  });

  it("a required box left empty says so under itself", () => {
    const parsed = termSaveSchema.safeParse({ name: "", academicYear: "2026-27", startsOn: "2026-12-10", endsOn: "2027-04-30", registrationOpensOn: "2026-11-01", registrationClosesOn: "2026-12-20" });
    const r = refusalOf(!parsed.success ? parsed.error : null, t);
    expect(r).toEqual({ message: t("refusal.atLeastChars", { count: 2 }), field: "name" });
  });

  it("an error carrying only formField (a date the action could not read) is about that box", () => {
    expect(refusalOf(Object.assign(new Error("form"), { formField: "toAt" }), t)).toEqual({ message: t("refusal.notValid"), field: "toAt" });
  });

  it("anything else is not a refusal (a crash, which the caller logs)", () => {
    expect(refusalOf(new Error("boom"), t)).toBeNull();
    expect(refusalOf("boom", t)).toBeNull();
  });

  it("formValues keeps what was typed, the first of each name, never the framework's keys or files", () => {
    const form = new FormData();
    form.set("$ACTION_ID_abc", "");
    form.set("name", "ZZ Even term");
    form.append("student", "a");
    form.append("student", "b");
    form.set("upload", new Blob(["x"]), "x.txt");
    expect(formValues(form)).toEqual({ name: "ZZ Even term", student: "a" });
  });
});

describe("registrationWindow (A3-journeys-28)", () => {
  it("a window that opens later is upcoming, not closed", () => {
    expect(registrationWindow("2026-11-01", "2026-12-20", "2026-10-05")).toBe("UPCOMING");
  });
  it("open from the opening day through the closing day", () => {
    expect(registrationWindow("2026-11-01", "2026-12-20", "2026-11-01")).toBe("OPEN");
    expect(registrationWindow("2026-11-01", "2026-12-20", "2026-12-20")).toBe("OPEN");
  });
  it("closed only after the closing day", () => {
    expect(registrationWindow("2026-11-01", "2026-12-20", "2026-12-21")).toBe("CLOSED");
  });
  it("the terms page says so in words", () => {
    const page = readFileSync(join(process.cwd(), "src/app/(app)/admin/academics/terms/page.tsx"), "utf8");
    expect(page).toContain("registrationWindow(");
    expect(page).toContain('"academics.registrationOpensOn"');
    expect(page).not.toContain('type="date"');
  });
});

describe("the panels answer in place (A3-journeys-27)", () => {
  const read = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");
  const PANELS: [file: string, actions: string[]][] = [
    ["app/(app)/admin/exams/page.tsx", ["createSeriesAction", "addSlotAction"]],
    ["app/(app)/admin/academics/terms/page.tsx", ["saveTermAction", "createDivisionAction"]],
    ["components/stream-records/practicals-panel.tsx", ["savePracticalsAction"]],
    ["app/(app)/faculty/offerings/[offeringId]/page.tsx", ["saveComponentAction", "saveMarksAction"]],
    ["app/(app)/exam-cell/page.tsx", ["createSessionAction"]],
    ["app/(app)/accounts/scholarships/page.tsx", ["createClaimAction", "updateClaimAction"]],
    ["components/hostel/family.tsx", ["requestLeaveAction"]],
  ];
  it.each(PANELS)("%s posts through <ActionForm>, which keeps the values and puts the refusal by its box", (file, actions) => {
    const text = read(file);
    for (const action of actions) {
      expect(text).toContain(`<ActionForm action={${action}}`);
      expect(text).not.toContain(`<form action={${action}}`);
    }
  });

  const ACTIONS: [file: string, actions: string[]][] = [
    ["app/(app)/admin/exams/actions.ts", ["createSeriesAction", "addSlotAction"]],
    ["app/(app)/admin/academics/actions.ts", ["saveTermAction", "createDivisionAction"]],
    ["app/(app)/admin/stream-records/actions.ts", ["savePracticalsAction"]],
    ["app/(app)/faculty/actions.ts", ["saveComponentAction", "saveMarksAction"]],
    ["app/(app)/exam-cell/actions.ts", ["createSessionAction"]],
    ["app/(app)/accounts/actions.ts", ["createClaimAction", "updateClaimAction"]],
    ["app/(app)/hostel/actions.ts", ["requestLeaveAction"]],
  ];
  it.each(ACTIONS)("%s answers a FormState instead of redirecting", (file, actions) => {
    const text = read(file);
    for (const action of actions) {
      const start = text.indexOf(`export async function ${action}(`);
      expect(start).toBeGreaterThan(-1);
      const body = text.slice(start, text.indexOf("\nexport ", start + 10) === -1 ? undefined : text.indexOf("\nexport ", start + 10));
      expect(body).toMatch(/Promise<FormState>/);
      expect(body).toContain("answerForm(");
    }
  });

  it("a new exam series is announced and brought into view", () => {
    expect(read("app/(app)/admin/exams/actions.ts")).toContain("reveal: `series-${id}`");
    expect(read("app/(app)/admin/exams/page.tsx")).toContain("id={`series-${s.id}`}");
  });
});
