/**
 * R-11, the page (risks batch, 5 Oct 2026): the office corrects a taken hostel roll call on /hostel/rollcall — a
 * second form under the locked sheet, for ADMIN only (the sheet's `canCorrect`, package 1B's), each boarder's status
 * and a reason, posted to the same library call as POST /api/v1/hostel/rollcall/{id}/correct (which is tested for the
 * audit row, the warden's refusal and the family's notice with the library). The warden sees the locked sheet alone.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";
import { FORM_IDLE } from "@/lib/form-state";
import { RuleRefusal } from "@/lib/rule-refusal";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
const state = vi.hoisted(() => ({ role: "ADMIN", calls: [] as unknown[][] }));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireRole: async () => ({ user: { id: "zz-u" }, role: state.role, schoolId: "zz-college", membershipId: "zz-m" }),
  requireApiUser: async () => ({ user: { id: "zz-u" }, role: state.role, schoolId: "zz-college", membershipId: "zz-m" }),
}));
vi.mock("@/lib/modules", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/modules")>()), isModuleOn: async () => true }));
vi.mock("@/lib/db", () => ({ db: { school: { findUnique: async () => ({ timezone: "Asia/Kolkata" }) } } }));
vi.mock("@/lib/hostel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/hostel")>()),
  hostelsView: async () => ({ hostels: [{ id: "zz-h", name: "ZZ Boys Hostel" }] }),
  rollCallSheet: async () => ({
    hostelId: "zz-h",
    hostelName: "ZZ Boys Hostel",
    dateKey: "2026-10-05",
    slot: "NIGHT",
    taken: { at: "2026-10-05T16:00:00.000Z", byName: "ZZ Warden" },
    rollCallId: "zz-call",
    canCorrect: state.role === "ADMIN",
    entries: [
      { allotmentId: "zz-a1", membershipId: "zz-s1", name: "ZZ Boarder One", roomNumber: "101", bed: 1, status: "ABSENT", onLeave: false },
      { allotmentId: "zz-a2", membershipId: "zz-s2", name: "ZZ Boarder Two", roomNumber: "101", bed: 2, status: "PRESENT", onLeave: false },
    ],
  }),
  correctRollCall: async (...args: unknown[]) => {
    state.calls.push(args);
    const input = args[2] as { reason: string };
    if (input.reason === "refuse me") throw new RuleRefusal("riskDecisions.refuseCorrectionReason", 422, undefined, "reason");
    return { rollCallId: "zz-call", changed: 1, present: 2, onLeave: 0, absent: 0 };
  },
}));

import HostelRollCallPage from "@/app/(app)/hostel/rollcall/page";
import { correctRollCallAction } from "@/app/(app)/hostel/actions";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const render = async () =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, await HostelRollCallPage({ searchParams: Promise.resolve({}) }))));

beforeEach(() => {
  state.calls.length = 0;
});

describe("the office corrects a taken roll call (R-11)", () => {
  it("shows the correction form under the locked sheet to the office", async () => {
    state.role = "ADMIN";
    const html = await render();
    expect(html).toContain('data-testid="rollcall-correct"');
    expect(html).toContain(t("risksWeb.rollCallCorrectTitle"));
    expect(html).toMatch(/name="fix-zz-a1" checked="" value="ABSENT"/);
    expect(html).toContain('name="rollCallId" value="zz-call"');
  });

  it("shows the warden the locked sheet and no correction", async () => {
    state.role = "WARDEN";
    expect(await render()).not.toContain('data-testid="rollcall-correct"');
  });

  it("posts each boarder's status and the reason to the library, and says what changed", async () => {
    state.role = "ADMIN";
    const f = new FormData();
    f.set("back", "/hostel/rollcall?hostel=zz-h&slot=NIGHT");
    f.set("rollCallId", "zz-call");
    f.append("allotmentId", "cmzzallotment000000000001");
    f.append("allotmentId", "cmzzallotment000000000002");
    f.set("fix-cmzzallotment000000000001", "PRESENT");
    f.set("fix-cmzzallotment000000000002", "PRESENT");
    f.set("reason", "Was in the common room");
    const done = await correctRollCallAction(FORM_IDLE, f);
    expect(done).toMatchObject({ ok: true, message: t("risksWeb.rollCallCorrected", { changed: 1, present: 2, onLeave: 0, absent: 0 }) });
    expect(state.calls[0]?.[1]).toBe("zz-call");
    expect(state.calls[0]?.[2]).toEqual({ entries: [{ allotmentId: "cmzzallotment000000000001", status: "PRESENT" }, { allotmentId: "cmzzallotment000000000002", status: "PRESENT" }], reason: "Was in the common room" });
  });

  it("a refusal stays by its box with the marks kept", async () => {
    const f = new FormData();
    f.set("rollCallId", "zz-call");
    f.append("allotmentId", "cmzzallotment000000000001");
    f.set("fix-cmzzallotment000000000001", "PRESENT");
    f.set("reason", "refuse me");
    const refused = await correctRollCallAction(FORM_IDLE, f);
    expect(refused).toMatchObject({ ok: false, field: "reason", message: t("riskDecisions.refuseCorrectionReason") });
    expect(refused.values).toMatchObject({ "fix-cmzzallotment000000000001": "PRESENT" });
  });
});
