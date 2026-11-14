/**
 * The owner's decision on TA-538 of the testing analysis of 13 November 2026 (option 1, 14 Nov 2026): where a
 * stream lists more than one council the programme form has no default regulator; the registrar picks it, and the
 * form shows the attendance threshold that follows before saving. Programmes that already exist are not changed;
 * the office can correct the regulator on each.
 *
 * One ZZ college of this suite's own, made through the operator's createSchool with HEALTH_SCIENCES, PHARMACY and
 * ENGINEERING and removed after, with an ADMIN and a department. What is proved: the library (and so the API door
 * and the web's action) refuses a programme of a stream of several councils that leaves the regulator out, naming
 * the councils, and stores nothing; INC stores 80, DCI and NMC 75; a stream of one council keeps its default; an
 * existing NMC programme is left as it is, an edit of it that leaves the regulator out is refused, and the office's
 * correction through the programmes page's new action stores INC at 80 with everything else kept; the form's fields
 * start with no regulator for such a stream and say the threshold that follows; the sentences are in en, hi and mr.
 */
import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { regulatorChoiceNeeded, STREAMS, type StreamCode } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { RuleRefusal } from "@/lib/rule-refusal";
import { translator } from "@/lib/i18n/dictionary";

const state = vi.hoisted(() => ({ ctx: null as unknown }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireApiUser: async () => state.ctx,
}));

import { saveProgramme } from "@/lib/academics";
import { saveProgrammeRegulatorAction } from "@/app/(app)/admin/academics/actions";
import { POST as programmesPost } from "@/app/api/v1/academics/programmes/route";
import { ProgrammeRegulatorFields } from "@/components/academics/programme-regulator-fields";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

(globalThis as { React?: typeof React }).React = React;
const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta538-${who}-${STAMP}@test.invalid`;
const ids = { operator: "", college: "", admin: "", dept: "" };
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const en = translator("en");

async function as(userId: string, role: string, schoolId: string | null, route: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession().catch(() => null);
  return ctx as ActiveContext;
}
const admin = () => as(ids.admin, "ADMIN", ids.college, null);
const base = (code: string) => ({ departmentId: ids.dept, code, name: `ZZ ${code}`, level: "UG" as const, durationYears: 4, intake: 60, exitPoints: [] });
const rowOf = (code: string) => db.programme.findFirst({ where: { schoolId: ids.college, code }, select: { id: true, code: true, name: true, regulator: true, attendanceThreshold: true, stream: true, exitPoints: true, intake: true } });
async function refusal(work: Promise<unknown>): Promise<RuleRefusal> {
  const error = await work.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(RuleRefusal);
  return error as RuleRefusal;
}
const render = (props: Parameters<typeof ProgrammeRegulatorFields>[0]) =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ProgrammeRegulatorFields, props)));

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ TA538 Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ TA538 College ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "AUTONOMOUS_COLLEGE", streams: ["HEALTH_SCIENCES", "PHARMACY", "ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  ids.admin = (await db.user.create({ data: { name: "ZZ TA538 Admin", email: MAIL("admin") }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" } });
  ids.dept = (await db.department.create({ data: { schoolId: ids.college, code: "NURS", name: "ZZ Nursing" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }, { actorUserId: { in: users.map((u) => u.id) } }] } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-538: a stream of several councils has no default regulator", () => {
  it("TA-538: the streams that list more than one council are the ones that must name it", () => {
    expect(STREAMS.filter((s) => regulatorChoiceNeeded(s))).toEqual(["MANAGEMENT", "PHARMACY", "LAW", "HEALTH_SCIENCES"]);
  });

  it("TA-538: a nursing programme saved without a regulator is refused, naming the councils, and nothing is stored", async () => {
    const r = await refusal(saveProgramme(await admin(), { ...base("ZZBSCN"), stream: "HEALTH_SCIENCES" }));
    expect(r.key).toBe("streams.refuseChooseRegulator");
    expect(r.status).toBe(422);
    expect(r.field).toBe("regulator");
    expect(r.vars).toEqual({ councils: "NMC, DCI, INC" });
    expect(await rowOf("ZZBSCN")).toBeNull();
    // Pharmacy lists PCI and AICTE: no silent PCI either.
    expect((await refusal(saveProgramme(await admin(), { ...base("ZZBPHA"), stream: "PHARMACY" }))).key).toBe("streams.refuseChooseRegulator");
    expect(await rowOf("ZZBPHA")).toBeNull();
  });

  it("TA-538: the API door answers the same refusal 422 and stores nothing", async () => {
    state.ctx = await as(ids.admin, "ADMIN", ids.college, "POST /api/v1/academics/programmes");
    const res = await programmesPost(new Request("http://localhost/api/v1/academics/programmes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base("ZZBSCD"), stream: "HEALTH_SCIENCES" }) }));
    expect(res.status).toBe(422);
    expect(JSON.stringify(await res.json())).toContain(en("streams.refuseChooseRegulator", { councils: "NMC, DCI, INC" }));
    expect(await rowOf("ZZBSCD")).toBeNull();
  });

  it("TA-538: the registrar's pick stores the threshold that follows: INC 80, DCI 75, NMC 75; a stream of one council keeps its default", async () => {
    const ctx = await admin();
    await saveProgramme(ctx, { ...base("ZZINC"), stream: "HEALTH_SCIENCES", regulator: "INC" });
    await saveProgramme(ctx, { ...base("ZZDCI"), stream: "HEALTH_SCIENCES", regulator: "DCI" });
    await saveProgramme(ctx, { ...base("ZZNMC"), stream: "HEALTH_SCIENCES", regulator: "NMC" });
    await saveProgramme(ctx, { ...base("ZZENG"), stream: "ENGINEERING" });
    expect(await rowOf("ZZINC")).toMatchObject({ regulator: "INC", attendanceThreshold: 80, stream: "HEALTH_SCIENCES" });
    expect(await rowOf("ZZDCI")).toMatchObject({ regulator: "DCI", attendanceThreshold: 75 });
    expect(await rowOf("ZZNMC")).toMatchObject({ regulator: "NMC", attendanceThreshold: 75 });
    expect(await rowOf("ZZENG")).toMatchObject({ regulator: "AICTE", attendanceThreshold: 75, stream: "ENGINEERING" });
  });

  it("TA-538: an existing programme is left as it is, an edit that leaves the regulator out is refused, and the office corrects it to INC at 80 with the rest kept", async () => {
    const exits = [{ afterYear: 1, award: "CERTIFICATE", credits: 44 }];
    const made = await db.programme.create({ data: { schoolId: ids.college, departmentId: ids.dept, code: "ZZOLD", name: "ZZ B.Sc. Nursing", level: "UG", durationYears: 4, intake: 40, regulator: "NMC", stream: "HEALTH_SCIENCES", attendanceThreshold: 75, exitPoints: JSON.stringify(exits) }, select: { id: true } });
    const before = await rowOf("ZZOLD");
    expect(before).toMatchObject({ regulator: "NMC", attendanceThreshold: 75 });
    expect((await refusal(saveProgramme(await admin(), { ...base("ZZOLD"), id: made.id, intake: 40, stream: "HEALTH_SCIENCES" }))).key).toBe("streams.refuseChooseRegulator");
    expect(await rowOf("ZZOLD")).toEqual(before);

    state.ctx = await admin();
    const form = new FormData();
    form.set("id", made.id);
    form.set("regulator", "INC");
    form.set("attendanceThreshold", "");
    await expect(saveProgrammeRegulatorAction(form)).rejects.toThrow(/REDIRECT \/admin\/academics\/programmes\?done=academics\.saved/);
    const after = await rowOf("ZZOLD");
    expect(after).toMatchObject({ regulator: "INC", attendanceThreshold: 80, stream: "HEALTH_SCIENCES", code: "ZZOLD", name: "ZZ B.Sc. Nursing", intake: 40 });
    expect(JSON.parse(String(after?.exitPoints))).toEqual(exits);
  });
});

describe("TA-538: the form says the threshold before saving", () => {
  it("TA-538: a stream of several councils starts with no regulator, required, and asks for it before saying a threshold", () => {
    const html = render({ streams: ["HEALTH_SCIENCES"], streamLabels: { HEALTH_SCIENCES: "Health sciences" } });
    expect(html).toContain("Health sciences · NMC / DCI / INC");
    const regulatorSelect = html.match(/<select[^>]*name="regulator"[^>]*>/)?.[0] ?? "";
    expect(regulatorSelect).toContain('required=""');
    expect(html).toContain(`<option value="" disabled="" selected="">${en("streams.regulatorChoose")}</option>`);
    expect(html).not.toContain(en("streams.regulatorFromStream"));
    expect(html).toContain(en("streams.regulatorChooseHint").replace(/'/g, "&#x27;"));
    expect(html).toContain(en("streams.thresholdChooseFirst"));
    expect(html).toMatch(/name="attendanceThreshold"[^>]*value=""/);
  });

  it("TA-538: a stream of one council keeps \"As the stream says\" and says its threshold", () => {
    const html = render({ streams: ["ENGINEERING"] as StreamCode[], streamLabels: { ENGINEERING: "Engineering" } });
    expect(html).toContain(en("streams.regulatorFromStream"));
    expect(html).toContain(en("streams.thresholdFollows", { regulator: "AICTE", threshold: 75 }));
    expect(html).toMatch(/name="attendanceThreshold"[^>]*value="75"/);
  });

  it("TA-538: an existing programme's correction starts on its own regulator and threshold", () => {
    const html = render({ stream: "HEALTH_SCIENCES", initialRegulator: "NMC", initialThreshold: 75 });
    expect(html).not.toContain('name="stream"');
    expect(html).toContain('<option value="NMC" selected="">NMC</option>');
    expect(html).toContain(en("streams.thresholdFollows", { regulator: "NMC", threshold: 75 }));
  });

  it("TA-538: the programmes page draws the fields on the new programme and the correction under each", () => {
    const page = readFileSync("src/app/(app)/admin/academics/programmes/page.tsx", "utf8");
    expect(page).not.toContain("defaultRegulatorFor(st)");
    expect(page).toContain("<ProgrammeRegulatorFields streams={streams}");
    expect(page).toContain("<form action={saveProgrammeRegulatorAction}");
    expect(page).toContain('t("streams.correctRegulator")');
  });

  it("TA-538: the sentences are in en, hi and mr, Hindi with the danda and Marathi with a full stop", () => {
    const hi = translator("hi");
    const mr = translator("mr");
    for (const key of ["streams.regulatorChoose", "streams.regulatorChooseHint", "streams.refuseChooseRegulator", "streams.thresholdFollows", "streams.thresholdChooseFirst", "streams.correctRegulator"] as const) {
      for (const tr of [en, hi, mr]) expect(tr(key, { councils: "NMC, DCI, INC", regulator: "INC", threshold: 80 })).not.toBe(key);
      expect(hi(key)).not.toBe(en(key));
      expect(mr(key)).not.toBe(en(key));
    }
    for (const key of ["streams.regulatorChooseHint", "streams.refuseChooseRegulator", "streams.thresholdFollows", "streams.thresholdChooseFirst"] as const) {
      expect(hi(key).endsWith("।")).toBe(true);
      expect(mr(key).endsWith(".")).toBe(true);
    }
  });
});
