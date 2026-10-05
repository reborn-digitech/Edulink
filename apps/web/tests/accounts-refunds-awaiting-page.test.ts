/**
 * R-60, the page (risks batch, 5 Oct 2026): /accounts lists the cancelled seats awaiting their refund for the office
 * and the accounts desk (the door and the library are package 1B's, tested with them), with an entry among the desk's
 * links, each seat opening its page where the refund is recorded; the principal, whom the door refuses, sees no card.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;

const state = vi.hoisted(() => ({ role: "ACCOUNTS", asked: 0 }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireRole: async () => ({ user: { id: "zz-u" }, role: state.role, schoolId: "zz-college", membershipId: "zz-m" }),
}));
vi.mock("@/lib/modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/modules")>()),
  institutionKindOf: async () => "COLLEGE",
  isModuleOn: async () => true,
}));
vi.mock("@/lib/accounts", () => ({
  accountsOverview: async () => ({ year: { name: "2026-27" }, collection: [], defaulters: [], receivableAgeing: [], pendingConcessions: 0, incomeExpense: { feesCollectedPaise: 0, scholarshipsDisbursedPaise: 0, purchasesPaise: 0, payrollGrossPaise: 0 } }),
}));
vi.mock("@/lib/college-admissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/college-admissions")>()),
  refundsAwaiting: async () => {
    state.asked += 1;
    return { items: [{ applicationId: "zz-app-1", number: 41, applicantName: "ZZ Cancelled Applicant", programmeName: "B.Com", cancelledAt: "2026-09-20T06:30:00.000Z", admissionFeePaise: 2_500_000, refundPaise: 2_250_000, refundSlab: "15 days", askStatus: "ASKED" }] };
  },
}));
vi.mock("@/lib/db", () => ({
  db: { programme: { findMany: async () => [] }, school: { findUnique: async () => ({ timezone: "Asia/Kolkata" }) } },
}));

import AccountsPage from "@/app/(app)/accounts/page";

const t = translator("en");
beforeEach(() => {
  state.asked = 0;
});

describe("the seats awaiting their refund on /accounts (R-60)", () => {
  it("lists each cancelled seat for the accounts desk, linked to its page, with an entry among the links", async () => {
    state.role = "ACCOUNTS";
    const html = renderToStaticMarkup(await AccountsPage());
    expect(state.asked).toBe(1);
    expect(html).toContain('data-testid="refunds-awaiting"');
    expect(html).toContain(t("riskDecisions.refundsAwaitingTitle"));
    expect(html).toContain('href="/admin/college-admissions/zz-app-1"');
    expect(html).toContain("ZZ Cancelled Applicant · 41");
    expect(html).toContain("20/09/2026");
    expect(html).toContain(t("risksWeb.refundsAskWaiting"));
    expect(html).toContain('href="#refunds-awaiting"');
    expect(html).toContain(t("risksWeb.refundsAwaitingLink", { n: 1 }));
  });

  it("is not drawn for the principal, whom the door refuses", async () => {
    state.role = "PRINCIPAL";
    const html = renderToStaticMarkup(await AccountsPage());
    expect(state.asked).toBe(0);
    expect(html).not.toContain('data-testid="refunds-awaiting"');
  });
});
