/**
 * G4-15, the pages (risks batch, 5 Oct 2026): every NAAC and NIRF figure the IQAC pages, the insights, the simulator,
 * the principal's accreditation page and the college hub print carries "Provisional" beside the not-a-score sentence
 * until the IQAC coordinator signs the benchmark list; the predictor shows the list with the coordinator's "sign"
 * button (the library and its door, IQAC-only and audited, are package 1B's, tested there).
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { translator } from "@/lib/i18n/dictionary";
import { FORM_IDLE } from "@/lib/form-state";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
const calls = vi.hoisted(() => ({ sign: [] as unknown[][] }));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireApiUser: async () => ({ user: { id: "zz-iqac" }, role: "IQAC", schoolId: "zz-college", membershipId: "zz-m" }),
}));
vi.mock("@/lib/iqac-benchmarks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/iqac-benchmarks")>()),
  signBenchmarks: async (...args: unknown[]) => void calls.sign.push(args),
}));

import { signBenchmarksAction } from "@/app/(app)/iqac/actions";
import { BenchmarkListCard } from "@/components/iqac/benchmark-status";
import { NotAScore } from "@/components/iqac/parts";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const shell = (child: React.ReactElement) => renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, child)));
const status = (provisional: boolean) => ({ provisional, version: "abcd1234", signedAt: provisional ? null : "2026-10-05T10:00:00.000Z", signedByName: provisional ? null : "ZZ Coordinator", sentence: provisional ? t("riskDecisions.benchmarksProvisional") : t("riskDecisions.benchmarksSigned", { name: "ZZ Coordinator", date: "5 October 2026" }) });
const list = (provisional: boolean, canSign: boolean) => ({ ...status(provisional), canSign, naac: [{ formula: "1.1.1", type: "LINEAR", benchmark: 75 }], nirfBands: [{ code: "TOP_100", min: 47.1 }] });

describe("provisional until the coordinator signs (G4-15)", () => {
  it("the not-a-score line says provisional, or who signed", () => {
    expect(shell(React.createElement(NotAScore, { t, benchmarks: status(true) }))).toContain('data-testid="benchmarks-provisional"');
    const signed = shell(React.createElement(NotAScore, { t, benchmarks: status(false) }));
    expect(signed).toContain('data-testid="benchmarks-signed"');
    expect(signed).toContain("ZZ Coordinator");
  });

  it("the list offers the coordinator the sign button with the version read; nobody else, and not once signed", () => {
    const coordinator = shell(React.createElement(BenchmarkListCard, { t, view: list(true, true), back: "/iqac/predictor" }));
    expect(coordinator).toContain('data-testid="benchmarks-sign"');
    expect(coordinator).toContain('name="version" value="abcd1234"');
    expect(coordinator).toContain(t("insights.nirfBand.TOP_100"));
    expect(shell(React.createElement(BenchmarkListCard, { t, view: list(true, false), back: "/iqac/predictor" }))).not.toContain('data-testid="benchmarks-sign"');
    expect(shell(React.createElement(BenchmarkListCard, { t, view: list(false, true), back: "/iqac/predictor" }))).not.toContain('data-testid="benchmarks-sign"');
  });

  it("the sign form posts the version to the library and says it is signed", async () => {
    const f = new FormData();
    f.set("back", "/iqac/predictor");
    f.set("version", "abcd1234");
    expect(await signBenchmarksAction(FORM_IDLE, f)).toMatchObject({ ok: true, message: t("risksWeb.benchmarkSignedToast") });
    expect(calls.sign[0]?.[1]).toEqual({ version: "abcd1234" });
  });

  it("every page that prints a NAAC or NIRF figure passes the status", () => {
    const read = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");
    for (const page of ["app/(app)/iqac/page.tsx", "app/(app)/iqac/simulator/page.tsx", "app/(app)/iqac/documents/page.tsx", "app/(app)/principal/accreditation/page.tsx"]) {
      expect(read(page), page).toContain("<NotAScore t={t} benchmarks={await benchmarkStatus(ctx.schoolId)} />");
    }
    const predictor = read("app/(app)/iqac/predictor/page.tsx");
    expect(predictor).toContain("<NotAScore t={t} benchmarks={benchmarks} />");
    expect(predictor).toContain("<BenchmarkListCard t={t} view={benchmarks} back={back} />");
    expect(read("app/(app)/principal/college/page.tsx")).toContain("<BenchmarkLabel t={t} status={await benchmarkStatus(ctx.schoolId)} />");
    const insights = read("components/iqac/insights.tsx");
    expect(insights.match(/<InsightsNotAScore t=\{t\} benchmarks=\{insights\.benchmarks\} \/>/g)).toHaveLength(3);
  });
});
