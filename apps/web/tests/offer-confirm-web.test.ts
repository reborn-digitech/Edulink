/**
 * A3-journeys-18, the web half (risks batch, 5 Oct 2026): the offer panel's "the figure is right" tick. An offer far
 * above the drive's top package (HIGH_OFFER_RATIO times it) is refused under the package box before any letter is
 * stored, with what was typed kept, until the recorder ticks the box; then the library records it with
 * confirmedHigh, which its audit row carries (the library's half is tested in tests/placement.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FORM_IDLE } from "@/lib/form-state";
import { translator } from "@/lib/i18n/dictionary";
import { HIGH_OFFER_RATIO } from "@/lib/placement-rules";

const calls = vi.hoisted(() => ({ recordOffer: [] as unknown[][], stored: 0 }));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireApiUser: async () => ({ user: { id: "zz-offer-cell" }, role: "TPO", schoolId: "zz-school", membershipId: "zz-m" }),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  consume: async () => ({ allowed: true, retryAfterSeconds: 0 }),
}));
vi.mock("@/lib/uploads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/uploads")>()),
  storeAttachments: async () => {
    calls.stored += 1;
    return [{ fileId: "zz-letter" }];
  },
}));
vi.mock("@/lib/placement", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/placement")>()),
  cellActor: async () => ({ userId: "zz-offer-cell", via: "CELL", drive: { id: "zz-drive", schoolId: "zz-school", status: "OPEN", packageMaxRupees: 800_000 } }),
  recordOffer: async (...args: unknown[]) => {
    calls.recordOffer.push(args);
    return { studentName: "ZZ Offer Student" };
  },
}));

import { offerAction } from "@/app/(app)/placement/actions";

const t = translator("en");
function offerForm(lakh: string, confirm: boolean): FormData {
  const f = new FormData();
  f.set("back", "/placement/drives/zz-drive");
  f.set("driveId", "zz-drive");
  f.set("studentMembershipId", "zz-student");
  f.set("package", lakh);
  f.set("letter", new File(["%PDF-1.4"], "letter.pdf", { type: "application/pdf" }));
  if (confirm) f.set("confirmedHigh", "on");
  return f;
}

beforeEach(() => {
  calls.recordOffer.length = 0;
  calls.stored = 0;
});

describe("the offer panel's confirm tick (A3-journeys-18)", () => {
  it("refuses ₹25 lakh on an ₹8 lakh drive under the package box, the figure kept and no letter stored", async () => {
    const answer = await offerAction(FORM_IDLE, offerForm("25", false));
    expect(answer).toMatchObject({ ok: false, field: "package", message: t("placement.confirmHighOffer", { offer: "25", max: "8" }) });
    expect(answer.values).toMatchObject({ package: "25", studentMembershipId: "zz-student" });
    expect(calls.stored).toBe(0);
    expect(calls.recordOffer).toEqual([]);
  });

  it("records it once the tick says the figure is right, and tells the library so", async () => {
    const answer = await offerAction(FORM_IDLE, offerForm("25", true));
    expect(answer).toMatchObject({ ok: true, message: t("placement.offerRecorded", { name: "ZZ Offer Student" }) });
    expect(calls.stored).toBe(1);
    expect(calls.recordOffer[0]?.[1]).toMatchObject({ studentMembershipId: "zz-student", packageRupees: 2_500_000, confirmedHigh: true });
  });

  it("lets an ordinary offer through without the tick", async () => {
    const answer = await offerAction(FORM_IDLE, offerForm("7.5", false));
    expect(answer.ok).toBe(true);
    expect(calls.recordOffer[0]?.[1]).toMatchObject({ packageRupees: 750_000, confirmedHigh: false });
  });

  it("the panel carries the tick, labelled with the ratio, 44 px tall", () => {
    const panel = readFileSync(join(process.cwd(), "src", "components/placement/rounds.tsx"), "utf8");
    expect(panel).toContain('name="confirmedHigh"');
    expect(panel).toContain('t("risksWeb.offerConfirmHigh", { ratio: HIGH_OFFER_RATIO })');
    expect(panel).toMatch(/<label className="flex min-h-11[^"]*">\s*<input type="checkbox" name="confirmedHigh"/);
    expect(t("risksWeb.offerConfirmHigh", { ratio: HIGH_OFFER_RATIO })).toContain("1.5");
  });
});
