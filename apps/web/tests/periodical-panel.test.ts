/**
 * G4-21, the form (risks batch, 5 Oct 2026): a periodical's subscription and its volumes at the library desk — the
 * subscription (how often, the days it runs), the volumes received newest first, a volume added and one removed —
 * through the library calls of the /api/v1/library/titles/{titleId}/subscription and /volumes doors (package 1B's,
 * tested there for the refusals on a book and a repeated volume). A book's page shows no such card.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { translator } from "@/lib/i18n/dictionary";
import { FORM_IDLE } from "@/lib/form-state";
import { RuleRefusal } from "@/lib/rule-refusal";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
const calls = vi.hoisted(() => ({ sub: [] as unknown[][], add: [] as unknown[][], remove: [] as unknown[][] }));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireApiUser: async () => ({ user: { id: "zz-lib" }, role: "LIBRARIAN", schoolId: "zz-college", membershipId: "zz-m" }),
}));
vi.mock("@/lib/library-periodicals", () => ({
  savePeriodicalSubscription: async (...args: unknown[]) => void calls.sub.push(args),
  addVolume: async (...args: unknown[]) => {
    calls.add.push(args);
    if ((args[2] as { volume: string }).volume === "12") throw new RuleRefusal("riskDecisions.refuseVolumeTaken", 409, undefined, "volume");
  },
  removeVolume: async (...args: unknown[]) => void calls.remove.push(args),
  periodicalView: async () => null,
}));

import { addVolumeAction, removeVolumeAction, saveSubscriptionAction } from "@/app/(app)/library/actions";
import { PeriodicalPanel } from "@/components/library/periodical-panel";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};
const view = { titleId: "zz-title", title: "ZZ Journal of Physics", frequency: "MONTHLY" as const, subscriptionFrom: "2026-04-01", subscriptionUntil: "2027-03-31", active: true, volumes: [{ id: "zz-v1", volume: "11", issue: "3", receivedOn: "2026-09-02" }], canEdit: true };
const render = (v: typeof view) =>
  renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, React.createElement(PeriodicalPanel, { view: v, back: "/library/titles/zz-title", today: "2026-10-05", t }))));

describe("a periodical's subscription and volumes at the desk (G4-21)", () => {
  it("shows the subscription, the volumes with their day, and the desk's forms", () => {
    const html = render(view);
    expect(html).toContain(t("risksWeb.subscriptionActive", { frequency: t("risksWeb.freq_MONTHLY"), from: "01/04/2026", until: "31/03/2027" }));
    expect(html).toContain(t("risksWeb.volumeLine", { volume: "11", issue: "3", date: "02/09/2026" }));
    expect(html).toMatch(/name="frequency"/);
    expect(html).toMatch(/name="volume"/);
    const reader = render({ ...view, canEdit: false });
    expect(reader).not.toMatch(/name="volume"/);
    expect(reader).not.toMatch(/name="frequency"/);
  });

  it("the three forms post to the library and answer in place", async () => {
    expect(await saveSubscriptionAction(FORM_IDLE, form({ titleId: "zz-title", back: "/library/titles/zz-title", frequency: "WEEKLY", subscriptionFrom: "2026-04-01", subscriptionUntil: "" }))).toMatchObject({ ok: true, message: t("risksWeb.subscriptionSaved") });
    expect(calls.sub[0]?.slice(1)).toEqual(["zz-title", { frequency: "WEEKLY", subscriptionFrom: "2026-04-01", subscriptionUntil: null }]);
    expect(await addVolumeAction(FORM_IDLE, form({ titleId: "zz-title", volume: "11", issue: "4", receivedOn: "2026-10-05" }))).toMatchObject({ ok: true, message: t("risksWeb.volumeAdded", { volume: "11", issue: "4" }) });
    const taken = await addVolumeAction(FORM_IDLE, form({ titleId: "zz-title", volume: "12", issue: "1", receivedOn: "2026-10-05" }));
    expect(taken).toMatchObject({ ok: false, field: "volume", message: t("riskDecisions.refuseVolumeTaken"), values: { volume: "12", issue: "1" } });
    expect(await removeVolumeAction(FORM_IDLE, form({ titleId: "zz-title", volumeId: "zz-v1" }))).toMatchObject({ ok: true, message: t("risksWeb.volumeRemoved") });
    expect(calls.remove[0]?.slice(1)).toEqual(["zz-title", "zz-v1"]);
  });

  it("the title page draws the card for a periodical only", () => {
    const page = readFileSync(join(process.cwd(), "src", "app/(app)/library/titles/[titleId]/page.tsx"), "utf8");
    expect(page).toContain('b.category === "PERIODICAL" ? await periodicalView(ctx, titleId) : null');
    expect(page).toContain("<PeriodicalPanel view={periodical}");
  });
});
