/**
 * R-24, the page (risks batch, 5 Oct 2026): the office's lab-batches page says, before it acts, the day a re-split or
 * a move made now takes effect (the division's `changesFrom`, package 1B's), and the split and move answer with that
 * day; with no marked batch lab the page says a re-split rewrites from the start.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";
import { FORM_IDLE } from "@/lib/form-state";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");

const division = (id: string, changesFrom: string | null) => ({
  divisionId: id,
  name: `ZZ ${id}`,
  programmeCode: "BE",
  yearOfStudy: 2,
  academicYear: "2026-27",
  students: 2,
  batches: [
    { id: `${id}-a`, name: "A", capacity: 20, members: [{ studentMembershipId: `${id}-s1`, name: "ZZ One", rollNumber: 1 }] },
    { id: `${id}-b`, name: "B", capacity: 20, members: [{ studentMembershipId: `${id}-s2`, name: "ZZ Two", rollNumber: 2 }] },
  ],
  unbatched: [],
  changesFrom,
});

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireRole: async () => ({ user: { id: "zz-u" }, role: "ADMIN", schoolId: "zz-college", membershipId: "zz-m" }),
  requireApiUser: async () => ({ user: { id: "zz-u" }, role: "ADMIN", schoolId: "zz-college", membershipId: "zz-m" }),
}));
vi.mock("@/lib/modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/modules")>()),
  institutionKindOf: async () => "COLLEGE",
  isModuleOn: async () => true,
}));
vi.mock("@/lib/stream-records", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stream-records")>()),
  labBatches: async () => ({ offered: true, defaultSize: 20, canEdit: true, divisions: [division("marked", "2026-10-06"), division("fresh", null)] }),
  splitLabBatches: async () => ({ offered: true, defaultSize: 20, canEdit: true, divisions: [], effectiveFrom: "2026-10-06" }),
  moveToLabBatch: async () => ({ offered: true, defaultSize: 20, canEdit: true, divisions: [], effectiveFrom: null }),
}));

import LabBatchesPage from "@/app/(app)/admin/stream-records/lab-batches/page";
import { moveToLabBatchAction, splitLabBatchesAction } from "@/app/(app)/admin/stream-records/actions";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const html = (text: string) => text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");

describe("the lab batches page names the day a change takes effect (R-24)", () => {
  it("says the day for a division with marked labs, and 'from the start' for one with none", async () => {
    const page = await LabBatchesPage({ searchParams: Promise.resolve({}) });
    const out = renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, page)));
    expect(out).toContain(html(t("riskDecisions.labChangesFrom", { date: "06/10/2026" })));
    expect(out).toContain(html(t("riskDecisions.labChangesFromStart")));
  });

  it("the split and the move answer with the day they took effect", async () => {
    const split = new FormData();
    split.set("divisionId", "cmzzdivision0000000000000");
    expect(await splitLabBatchesAction(FORM_IDLE, split)).toMatchObject({ ok: true, message: t("riskDecisions.labChangedFrom", { date: "06/10/2026" }) });
    const move = new FormData();
    move.set("batchId", "zz-b");
    move.append("student", "cmzzstudent00000000000000");
    expect(await moveToLabBatchAction(FORM_IDLE, move)).toMatchObject({ ok: true, message: t("streamRecords.batchMoved") });
  });
});
