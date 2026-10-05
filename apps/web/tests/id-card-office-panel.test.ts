/**
 * R-52, the page (risks batch, 5 Oct 2026): the office's record page carries the reprint notice for cards printed
 * before 5 October, and for ADMIN a "give a new student code" button — the library call of POST
 * /api/v1/id-cards/claim-code (package 1B's, which tests that the old code then claims nothing). The new code is said
 * once in the toast; the head reads the notice but has no button, and is refused if the action is posted anyway.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { FORM_IDLE } from "@/lib/form-state";
import { translator } from "@/lib/i18n/dictionary";
import { studentCode } from "@/lib/codes";

(globalThis as { React?: typeof React }).React = React;
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
import { rotateClaimCodeAction } from "@/app/(app)/admin/records/[membershipId]/id-card-actions";
import { IdCardPanel } from "@/app/(app)/admin/records/[membershipId]/id-card-panel";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

/** The panel inside the providers the app shell gives it (the toast and the reader's words for <ActionForm>). */
const shell = (child: React.ReactElement) =>
  React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, child));

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const t = translator("en");
/** As React writes text into markup. */
const html = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");
const ids = { school: "", users: [] as string[], admin: "", principal: "", pupil: "", oldCode: "" };

async function as(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.school, role: role as never });
}
const form = (id: string) => {
  const f = new FormData();
  f.set("studentMembershipId", id);
  return f;
};

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Card Codes ${STAMP}`, slug: `zz-cardcodes-${STAMP}`, code: `ZCC${SUFFIX}`, contactEmail: `zz-cardcodes-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const user = async (who: string) => {
    const u = await db.user.create({ data: { name: `ZZ CardCodes ${who}`, email: `zz-cardcodes-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  ids.admin = await user("Admin");
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  ids.principal = await user("Principal");
  await db.membership.create({ data: { userId: ids.principal, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" } });
  ids.oldCode = studentCode();
  ids.pupil = (await db.membership.create({ data: { userId: await user("Pupil"), schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: ids.oldCode }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("the identity card's office panel (R-52)", () => {
  it("gives the student a new code for the office, says it once, and audits it", async () => {
    await as(ids.admin, "ADMIN");
    const done = await rotateClaimCodeAction(FORM_IDLE, form(ids.pupil));
    const now = (await db.membership.findUniqueOrThrow({ where: { id: ids.pupil }, select: { studentCode: true } })).studentCode!;
    expect(now).not.toBe(ids.oldCode);
    expect(done).toMatchObject({ ok: true, message: t("riskDecisions.claimCodeRotated", { code: now }) });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "idcard.claimCode.rotate", targetId: ids.pupil } })).toBe(1);
  });

  it("refuses the head in place, the code unchanged", async () => {
    const before = (await db.membership.findUniqueOrThrow({ where: { id: ids.pupil }, select: { studentCode: true } })).studentCode;
    await as(ids.principal, "PRINCIPAL");
    const refused = await rotateClaimCodeAction(FORM_IDLE, form(ids.pupil));
    expect(refused).toMatchObject({ ok: false, message: t("access.wrongRoleForThisAction") });
    expect((await db.membership.findUniqueOrThrow({ where: { id: ids.pupil }, select: { studentCode: true } })).studentCode).toBe(before);
  });

  it("shows the reprint notice to both and the button to the office only", () => {
    const admin = renderToStaticMarkup(shell(React.createElement(IdCardPanel, { studentMembershipId: "zz-p", studentName: "ZZ Pupil", canRotate: true, t })));
    expect(admin).toContain(html(t("riskDecisions.idCardsReprint")));
    expect(admin).toContain('data-testid="rotate-claim-code"');
    const head = renderToStaticMarkup(shell(React.createElement(IdCardPanel, { studentMembershipId: "zz-p", studentName: "ZZ Pupil", canRotate: false, t })));
    expect(head).toContain(html(t("riskDecisions.idCardsReprint")));
    expect(head).not.toContain('data-testid="rotate-claim-code"');
    const read = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");
    expect(read("app/(app)/admin/records/[membershipId]/page.tsx")).toContain('canRotate={ctx.role === "ADMIN"}');
    expect(read("app/(app)/admin/records/page.tsx")).toContain('data-testid="id-card-reprint-notice"');
  });
});
