/**
 * G4-27, the web half (risks batch, 5 Oct 2026): the leave form names who answers by the same rule as the phone
 * (contracts `leaveDecidedBy`): "Send to the principal" for a teacher, FACULTY or HOD while a principal is active,
 * "Send to the office" for module staff and at an institution with no active principal.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
const state = vi.hoisted(() => ({ role: "HOD", principals: 1 }));

vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireUser: async () => ({ user: { id: "zz-u" }, role: state.role, schoolId: "zz-college", membershipId: "zz-m" }),
  requireRole: async () => ({ user: { id: "zz-u" }, role: state.role, schoolId: "zz-school", membershipId: "zz-m" }),
}));
vi.mock("@/lib/db", () => ({
  db: {
    school: { findUniqueOrThrow: async () => ({ timezone: "Asia/Kolkata" }) },
    membership: { findMany: async () => [], count: async () => state.principals },
  },
}));
vi.mock("@/lib/leave", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/leave")>()), myLeave: async () => [] }));
vi.mock("@/lib/staff-records", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/staff-records")>()), leaveBalanceFor: async () => null }));
vi.mock("@/components/leave-balance-card", () => ({ LeaveBalanceCard: () => null }));

import MyLeavePage from "@/app/account/leave/page";
import TeacherLeavePage from "@/app/(app)/teacher/leave/page";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const render = async (page: Promise<React.ReactElement>) =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, await page)));

describe("the web leave form names who answers (G4-27)", () => {
  it.each([
    ["HOD", 1, "teacher.sendToPrincipal"],
    ["FACULTY", 1, "teacher.sendToPrincipal"],
    ["FACULTY", 0, "leaveDecider.sendToOffice"],
    ["LIBRARIAN", 1, "leaveDecider.sendToOffice"],
    ["ACCOUNTS", 1, "leaveDecider.sendToOffice"],
  ] as const)("%s with %i active principal(s) reads %s", async (role, principals, key) => {
    state.role = role;
    state.principals = principals;
    const html = await render(MyLeavePage());
    expect(html).toContain(t(key));
    if (key === "leaveDecider.sendToOffice") expect(html).toContain(t("leaveDecider.whyHintOffice"));
  });

  it("a teacher at a school with a principal sends it to the principal; with none, to the office", async () => {
    state.role = "TEACHER";
    state.principals = 1;
    expect(await render(TeacherLeavePage())).toContain(t("teacher.sendToPrincipal"));
    state.principals = 0;
    const html = await render(TeacherLeavePage());
    expect(html).toContain(t("leaveDecider.sendToOffice"));
    expect(html).not.toContain(t("teacher.sendToPrincipal"));
  });
});
