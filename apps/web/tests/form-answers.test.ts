import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { termSaveSchema } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { formValues, refusalOf } from "@/lib/form-state";
import { registrationWindow } from "@/lib/academics-rules";
import { FORM_IDLE } from "@/lib/form-state";
import { answerForm } from "@/lib/form-action";
import { __resetCookies } from "./stubs/next-headers";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

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
    // owner-batch-item5 (27 Oct 2026): a school's route fees and mess bill, and a house's mess charge.
    ["app/(app)/admin/transport/page.tsx", ["routeFeesAction"]],
    ["app/(app)/hostel/page.tsx", ["messBillAction"]],
    ["app/(app)/hostel/rooms/page.tsx", ["saveHostelAction"]],
    // owner-batch-item9 (27 Oct 2026): a school's e-resources, ISBN list and room change, and the head's pages given from the roster.
    ["app/(app)/library/e-resources/page.tsx", ["eResourceSaveAction"]],
    ["app/(app)/library/catalogue/page.tsx", ["isbnListAction"]],
    ["app/(app)/hostel/rooms/page.tsx", ["moveBoarderAction"]],
    ["app/(app)/principal/staff/page.tsx", ["headDutyAction"]],
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
    // The hostel's new mess bill (owner-batch-item5) goes through the file's own run() over answerForm, held by the sixteen's rule below.
    ["app/(app)/hostel/actions.ts", ["requestLeaveAction"]],
    ["app/(app)/admin/transport/actions.ts", ["routeFeesAction"]],
    // owner-batch-item9: the library's and the hostel's new actions are held by the sixteen's rule below; the head's here.
    ["app/(app)/principal/staff/actions.ts", ["headDutyAction"]],
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

/**
 * A3-journeys-27, the rest (risks batch, 5 Oct 2026): the sixteen action
 * files that still redirected a refusal to ?error= answer a FormState through
 * answerForm, every form posting to them is an <ActionForm>, and no file may
 * start redirecting a refusal to ?error= again.
 */
const SIXTEEN = [
  "app/(app)/faculty/profile/actions.ts",
  "app/(app)/iqac/actions.ts",
  "app/(app)/iqac/simulator/actions.ts",
  "app/(app)/hostel/actions.ts",
  "app/(app)/hostel/expulsions/actions.ts",
  "app/(app)/admin/attendance/actions.ts",
  "app/(app)/admin/college-admissions/refunds/actions.ts",
  "app/(app)/admin/stream-records/actions.ts",
  "app/(app)/admin/exams/actions.ts",
  "app/(app)/library/actions.ts",
  "app/(app)/accounts/actions.ts",
  "app/(app)/parent/meetings/actions.ts",
  "app/(app)/teacher/meetings/actions.ts",
  "app/(app)/exam-cell/actions.ts",
  "app/(app)/placement/actions.ts",
  "app/survey/[token]/actions.ts",
];
/** Each signed-in action file, loaded as a request would (parent/meetings and the survey link are tested apart). */
const SIGNED_IN: Record<string, () => Promise<Record<string, unknown>>> = {
  "app/(app)/faculty/profile/actions.ts": () => import("@/app/(app)/faculty/profile/actions"),
  "app/(app)/iqac/actions.ts": () => import("@/app/(app)/iqac/actions"),
  "app/(app)/iqac/simulator/actions.ts": () => import("@/app/(app)/iqac/simulator/actions"),
  "app/(app)/hostel/actions.ts": () => import("@/app/(app)/hostel/actions"),
  "app/(app)/hostel/expulsions/actions.ts": () => import("@/app/(app)/hostel/expulsions/actions"),
  "app/(app)/admin/attendance/actions.ts": () => import("@/app/(app)/admin/attendance/actions"),
  "app/(app)/admin/college-admissions/refunds/actions.ts": () => import("@/app/(app)/admin/college-admissions/refunds/actions"),
  "app/(app)/admin/stream-records/actions.ts": () => import("@/app/(app)/admin/stream-records/actions"),
  "app/(app)/admin/exams/actions.ts": () => import("@/app/(app)/admin/exams/actions"),
  "app/(app)/library/actions.ts": () => import("@/app/(app)/library/actions"),
  "app/(app)/accounts/actions.ts": () => import("@/app/(app)/accounts/actions"),
  "app/(app)/teacher/meetings/actions.ts": () => import("@/app/(app)/teacher/meetings/actions"),
  "app/(app)/exam-cell/actions.ts": () => import("@/app/(app)/exam-cell/actions"),
  "app/(app)/placement/actions.ts": () => import("@/app/(app)/placement/actions"),
};
const SRC = join(process.cwd(), "src");
const readSrc = (rel: string) => readFileSync(join(SRC, rel), "utf8");
function files(dir = SRC): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else if (/\.(ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}
const exportedActions = (text: string) => [...text.matchAll(/export async function (\w+)\(([^)]*)\)\s*(?::\s*([^{]+))?\{/g)].map((m) => ({ name: m[1]!, args: m[2]!, returns: (m[3] ?? "").trim() }));
/** The code of a file without its comments, so a sentence about ?error= in a doc comment is not a redirect. */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the sixteen action files answer in place (A3-journeys-27)", () => {
  it.each(SIXTEEN)("%s: every action takes the form's last answer and returns a FormState; nothing redirects to ?error=", (file) => {
    const text = readSrc(file);
    const actions = exportedActions(text);
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) {
      expect(a.args, a.name).toMatch(/^previous: FormState, \w+: FormData$/);
      expect(a.returns, a.name).toBe("Promise<FormState>");
    }
    expect(text).toContain("answerForm(");
    expect(code(text)).not.toMatch(/[?&]error=|withMessage\(/);
  });

  it("every form in src that posts to one of their actions is an <ActionForm>", () => {
    const targets = new Set(SIXTEEN.map((f) => f.replace(/\.ts$/, "")));
    const plain: string[] = [];
    let actionForms = 0;
    for (const file of files()) {
      if (!file.endsWith(".tsx")) continue;
      const text = readFileSync(file, "utf8");
      // The names this file imports from one of the sixteen ("@/app/…" or a relative path).
      const names = new Set<string>();
      for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
        const spec = m[2]!;
        const target = spec.startsWith("@/") ? spec.slice(2) : spec.startsWith(".") ? relative(SRC, join(file, "..", spec)) : null;
        if (!target || !targets.has(target)) continue;
        for (const n of m[1]!.split(",")) if (n.trim()) names.add(n.trim().split(/\s+as\s+/).pop()!);
      }
      for (const m of text.matchAll(/<(form|ActionForm)\b[^>]*?\baction=\{(\w+)\}/g)) {
        if (!names.has(m[2]!)) continue;
        if (m[1] === "form") plain.push(`${relative(process.cwd(), file)}: ${m[2]}`);
        else actionForms += 1;
      }
    }
    expect(plain).toEqual([]);
    // 202 forms were moved by this pass, beside the first pass's; a count far lower means the scan missed them.
    expect(actionForms).toBeGreaterThan(190);
  });

  it("a signed-out post to each keeps every value typed and says why, rather than redirecting", async () => {
    __resetCookies();
    const t = translator("en");
    // The family's meetings sign in through requireParent, which sends a stranger to /login (a Next interrupt, not a
    // refusal); the signed-out survey link is refused for its token below.
    expect(Object.keys(SIGNED_IN).sort()).toEqual(SIXTEEN.filter((f) => !f.includes("parent/meetings") && !f.includes("survey/")).sort());
    for (const [file, load] of Object.entries(SIGNED_IN)) {
      const mod = (await load()) as Record<string, (p: typeof FORM_IDLE, f: FormData) => Promise<{ ok: boolean; message?: string; values?: Record<string, string> }>>;
      const [name, action] = Object.entries(mod).find(([, v]) => typeof v === "function")!;
      const form = new FormData();
      form.set("back", "/nowhere");
      form.set("note", "ZZ typed by hand");
      const answer = await action(FORM_IDLE, form);
      expect(answer.ok, `${file} ${name}`).toBe(false);
      expect([t("access.pleaseLogInAgain"), t("access.notSignedIn")], `${file} ${name}`).toContain(answer.message);
      expect(answer.values?.note, `${file} ${name}`).toBe("ZZ typed by hand");
    }
  });

  it("the survey link refuses a forged token in place, the choices kept", async () => {
    const { answerByLinkAction } = await import("@/app/survey/[token]/actions");
    const form = new FormData();
    form.set("token", "zz-not-a-token");
    form.set("q_A1", "4");
    const answer = await answerByLinkAction(FORM_IDLE, form);
    expect(answer.ok).toBe(false);
    expect(answer.values).toMatchObject({ q_A1: "4" });
  });
});

describe("answerForm: what every converted action hands its form", () => {
  it("a schema refusal names the box and keeps what was typed", async () => {
    const form = new FormData();
    form.set("name", "");
    form.set("academicYear", "2026-27");
    const answer = await answerForm(FORM_IDLE, form, async () => {
      termSaveSchema.parse({ name: "", academicYear: "2026-27", startsOn: "2026-12-10", endsOn: "2027-04-30", registrationOpensOn: "2026-11-01", registrationClosesOn: "2026-12-20" });
      return null;
    });
    expect(answer).toMatchObject({ ok: false, field: "name", message: t("refusal.atLeastChars", { count: 2 }), values: { name: "", academicYear: "2026-27" } });
  });

  it("an action's own bare FormError reads as \"check the form\", not as a crash", async () => {
    class FormError extends Error {
      override name = "FormError";
    }
    expect(refusalOf(new FormError(), t)).toEqual({ message: t("common.checkTheForm") });
    const answer = await answerForm(FORM_IDLE, new FormData(), async () => {
      throw new FormError();
    });
    expect(answer).toMatchObject({ ok: false, message: t("common.checkTheForm") });
  });

  it("done with nothing to say starts the form clean with no toast; a library's own sentence is said as written", async () => {
    expect(await answerForm({ ok: true, n: 2 }, new FormData(), async () => null)).toEqual({ ok: true, n: 3 });
    expect(await answerForm(FORM_IDLE, new FormData(), async () => ({ text: "3 rows read" }))).toEqual({ ok: true, message: "3 rows read", n: 1 });
  });
});

describe("no new ?error= redirect (A3-journeys-27's source rule)", () => {
  /**
   * The files that still send a refusal back as ?error= (outside the sixteen,
   * each its own small form). This list may only shrink: a new file that
   * redirects a refusal to ?error= fails here, and moves onto <ActionForm>
   * with lib/form-action.ts answerForm instead.
   */
  const STILL_REDIRECTING = [
    "src/app/(app)/remarks/conversation-actions.ts",
    "src/app/(app)/teacher/exams/actions.ts",
    "src/app/(app)/teacher/practice/actions.ts",
    "src/app/(app)/iqac/documents/council-actions.ts",
    "src/lib/module-actions.ts",
  ];
  const producers = () =>
    files()
      .filter((f) => /[?&]error=|searchParams\.set\("error"|withMessage\([^)]*"error"/.test(code(readFileSync(f, "utf8"))))
      .map((f) => relative(process.cwd(), f))
      .sort();

  it("only the listed files build an ?error= address", () => {
    expect(producers().filter((f) => !STILL_REDIRECTING.includes(f))).toEqual([]);
  });
  it("every listed file still does (strike it from the list when it moves)", () => {
    expect(STILL_REDIRECTING.filter((f) => !producers().includes(f))).toEqual([]);
  });
});
