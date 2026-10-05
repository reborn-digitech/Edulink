/**
 * G4-28, the operator's control (risks batch, 5 Oct 2026): /root/experts closes an expert's account or opens it again
 * through the same library call as POST /api/v1/operator/experts/{profileId}/access (package 1B's, tested there for the
 * sign-in refusal, the bookings and the email). The row shows "Account closed" and the button that undoes it.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
const calls = vi.hoisted(() => ({ access: [] as unknown[][] }));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireSuperuser: async () => ({ user: { id: "zz-op", isSuperuser: true }, role: null, schoolId: null }),
}));
vi.mock("@/lib/operator-college", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/operator-college")>()),
  setExpertAccess: async (...args: unknown[]) => {
    calls.access.push(args);
    return args[1] === "zz-missing" ? { ok: false, errorKey: "riskDecisions.refuseNoExpert" } : { ok: true, sessionsEnded: 2 };
  },
}));

import { setExpertAccessAction } from "@/app/root/experts/actions";
import { CurationRow } from "@/app/root/experts/curation-row";
import type { CurationEntry } from "@/lib/superuser";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const entry = (disabledAt: Date | null): CurationEntry => ({
  profileId: "zz-profile",
  userId: "zz-expert",
  name: "ZZ Expert",
  email: "zz-expert@demo.relay.test",
  headline: "Careers",
  bio: "",
  organisation: null,
  specialisms: [],
  offering: "MENTORING",
  mentorCapacity: null,
  activeMentorships: 0,
  publishedAt: new Date("2026-09-01T00:00:00Z"),
  verifiedAt: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  kyc: { status: "NONE", submittedAt: null, decidedAt: null, note: null, documents: [] } as unknown as CurationEntry["kyc"],
  disabledAt,
});
const render = (e: CurationEntry) =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, React.createElement(CurationRow, { entry: e }))));

describe("the operator closes an expert's account (G4-28)", () => {
  it("passes the decision and the reason to the library and answers the sessions ended", async () => {
    expect(await setExpertAccessAction("zz-profile", { disabled: true, reason: "Complaint from a school" })).toEqual({ ok: true, sessionsEnded: 2 });
    expect(calls.access.at(-1)?.slice(1)).toEqual(["zz-profile", { disabled: true, reason: "Complaint from a school" }]);
    expect(await setExpertAccessAction("zz-missing", { disabled: true })).toEqual({ ok: false, error: t("riskDecisions.refuseNoExpert") });
    expect(await setExpertAccessAction("zz-profile", { disabled: "yes" as unknown as boolean })).toMatchObject({ ok: false });
  });

  it("an open account shows the close button; a closed one its badge and the way back", () => {
    const open = render(entry(null));
    expect(open).toContain('data-testid="expert-access"');
    expect(open).toContain(t("risksWeb.expertClose"));
    expect(open).not.toContain('data-testid="expert-closed"');
    const closed = render(entry(new Date("2026-10-05T10:00:00Z")));
    expect(closed).toContain('data-testid="expert-closed"');
    expect(closed).toContain(t("risksWeb.expertReopen"));
  });
});
