/**
 * G4-26, the page (risks batch, 5 Oct 2026): an alumni mentor's one-to-one draws on no free allowance (package 1B's
 * change to gig-sessions.ts, tested there); the booking page says so beside every alumni time, and the student's
 * placement page beside the mentors' times. An expert's time says nothing of the kind.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");

vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {}, push() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireUser: async () => ({ user: { id: "zz-u" }, role: "STUDENT", schoolId: "zz-college", membershipId: "zz-m" }),
}));
const slot = (id: string, providerKind: "EXPERT" | "ALUMNUS") => ({ id, kind: "ONE_TO_ONE", title: `ZZ ${providerKind} time`, startsAt: "2026-10-10T05:00:00.000Z", endsAt: "2026-10-10T05:30:00.000Z", seatsLeft: 1, providerName: `ZZ ${providerKind}`, providerKind, providerHeadline: null, pricePaise: 0, freeSeat: true });
vi.mock("@/lib/gig-sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/gig-sessions")>()),
  familySessions: async () => ({
    freeCancelHours: 24,
    paymentsOn: false,
    children: [{ id: "zz-m", name: "ZZ Student", schoolName: "ZZ College", timeZone: "Asia/Kolkata", allowance: { ONE_TO_ONE: { left: 0, allowed: 2 }, WORKSHOP: { left: 1, allowed: 2 } }, bookings: [], open: [slot("zz-expert", "EXPERT"), slot("zz-alumnus", "ALUMNUS")], series: [] }],
  }),
}));

import SessionsPage from "@/app/(app)/sessions/page";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

describe("the booking page says an alumni mentor's time is free (G4-26)", () => {
  it("beside the alumni time and not the expert's", async () => {
    const page = await SessionsPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, page)));
    const marks = html.match(/data-testid="session-alumni-free"/g) ?? [];
    expect(marks).toHaveLength(1);
    const alumni = html.indexOf("ZZ ALUMNUS time");
    expect(html.indexOf('data-testid="session-alumni-free"')).toBeGreaterThan(alumni);
    expect(html).toContain(t("riskDecisions.alumniSessionFree").replace(/'/g, "&#x27;"));
  });

  it("the student's placement page says it beside the mentors' times", () => {
    const page = readFileSync(join(process.cwd(), "src", "app/(app)/student/placement/page.tsx"), "utf8");
    expect(page).toContain('t("riskDecisions.alumniSessionFree")');
  });
});
