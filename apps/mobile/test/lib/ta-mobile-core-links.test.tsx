/**
 * The links-and-release batch of the testing analysis of 13 November 2026 (mobile-core):
 *
 * TA-499 a tapped notice opened the system browser for some thirty kinds whose screen the phone has;
 * TA-432 a push that arrived with the app open was never shown;
 * TA-585 the document picker offered Word files the server always refuses;
 * TA-264 the over-the-air guard did not see a native module moved by the lockfile, the root or a workspace package;
 * TA-590 Maestro flow 08 waited for an "Open on the web" door the practice screen no longer draws.
 */
import fs from "node:fs";
import path from "node:path";
import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import * as DocumentPicker from "expo-document-picker";
import { screenFor } from "@/lib/links";
import { useDeepLinks } from "@/lib/deep-links";
import { SessionProvider } from "@/lib/session";
import { pickAndUpload } from "@/lib/pick-file";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock("expo-linking", () => ({ getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }), parse: () => ({ hostname: null, path: null, queryParams: {} }), openURL: jest.fn() }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: null })) }));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- a CommonJS script
const rules = require("../../scripts/ota-guard-rules.js") as typeof import("../../scripts/ota-guard-rules.js");

const WEB_LIB = path.resolve(__dirname, "../../../web/src/lib");

/** An id in a URL the server builds. */
const ID = "zzid";

/** Every notice URL the server writes as a literal beside a notify call: `url: "/…"` or `url: \`/…${id}…\``, the id read as ID. */
function serverNoticeUrls(): string[] {
  const out = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
        for (const m of fs.readFileSync(full, "utf8").matchAll(/\burl: (?:"(\/[^"]*)"|`(\/[^`]*)`)/g)) {
          const raw = (m[1] ?? m[2])!.replace(/\$\{[^}]*\}/g, ID).split("?")[0]!;
          if (raw.startsWith("/api/") || raw.startsWith("/public/")) continue;
          out.add(raw);
        }
      }
    }
  };
  walk(WEB_LIB);
  return [...out].sort();
}

/**
 * The notices whose page the phone does not have: they open the web, signed in, as QA-70 made the fallback. Each with
 * its reason, so a new notice must either get a screen or be named here.
 */
const WEB_ONLY: Record<string, string> = {
  "/account/plan": "plans are bought on the web (decision 0006)",
  "/account/letters/zzid": "a letter's PDF page is the web's",
  "/admin/academics/condonations": "the condonation desk is on the web",
  "/admin/academics/registration": "the registration desk is on the web",
  "/admin/college-admissions/zzid": "a college application by id is the web's",
  "/admin/fees/settings": "fee settings are edited on the web",
  "/admin/settings/modules": "the modules switch is on the web",
  "/exam-cell/sessions/zzid/marks": "a session's marks sheet is the web's",
  "/exam-cell/sessions/zzid/results": "a session's results are published on the web",
  "/expert/earnings": "an expert's earnings are on the web",
  "/fees/receipts/zzid": "a receipt's printable page is the web's",
  "/hod/condonations": "the condonation desk is on the web",
  "/join/waiting": "the waiting page is the web's sign-up flow",
  "/parent/placement": "a guardian's placement consent is on the web (QA-70)",
  "/people/zzid": "the phone's person screen needs the name the directory row carries",
  "/principal/accreditation": "accreditation is on the web",
  "/reports/zzid": "a report's page is the web's",
  "/student/fees": "a college student's ledger page is the web's",
};

describe("a tapped notice opens the phone's own screen where it has one (TA-499)", () => {
  it("TA-499: the hostel, incident, academics, record, lecture and certificate notices map to the phone's screens, with the query", () => {
    expect(screenFor("/parent/hostel?child=m1")).toEqual({ pathname: "/(app)/hostel", params: { child: "m1" } });
    expect(screenFor("/student/hostel")).toEqual({ pathname: "/(app)/hostel" });
    expect(screenFor("/parent/incidents?child=m1&incident=i1")).toEqual({ pathname: "/(app)/family-incidents", params: { child: "m1", incident: "i1" } });
    expect(screenFor("/student/academics")).toEqual({ pathname: "/(app)/academics" });
    expect(screenFor("/student/registration")).toEqual({ pathname: "/(app)/registration" });
    expect(screenFor("/student/voice")).toEqual({ pathname: "/(app)/voice" });
    expect(screenFor("/faculty/lectures/l1")).toEqual({ pathname: "/(app)/lecture", params: { id: "l1" } });
    expect(screenFor("/faculty/offerings/o1")).toEqual({ pathname: "/(app)/offering", params: { id: "o1" } });
    expect(screenFor("/certificates/c1")).toEqual({ pathname: "/(app)/certificate", params: { id: "c1" } });
    expect(screenFor("/admin/records/m9")).toEqual({ pathname: "/(app)/pupil-record", params: { membershipId: "m9" } });
    expect(screenFor("/admin/fees/pupils/m9")).toEqual({ pathname: "/(app)/fee-pupil", params: { studentMembershipId: "m9" } });
    expect(screenFor("/admin/certificates/issue?membershipId=m9&requestId=r1")).toEqual({ pathname: "/(app)/certificate-issue", params: { membershipId: "m9", requestId: "r1" } });
    for (const home of ["/faculty", "/alumni", "/recruiter"]) expect(screenFor(home)).toEqual({ pathname: "/(app)" });
  });

  it("TA-499: every notice URL the server writes has a screen on the phone or a written reason to open the web", () => {
    const urls = serverNoticeUrls();
    expect(urls.length).toBeGreaterThan(50);
    const unmapped = urls.filter((u) => screenFor(u.replace(/zzid/g, "x1")) === null && !(u in WEB_ONLY));
    expect(unmapped).toEqual([]);
  });
});

describe("a push that arrives with the app open is shown (TA-432)", () => {
  it("TA-432: a handler presents it, and its arrival re-reads the notices", async () => {
    // No timer outlives the test (harness-open-handles.test.ts).
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity } } });
    const invalidate = jest.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    );
    const { unmount } = await renderHook(() => useDeepLinks(), { wrapper });
    const handler = (Notifications.setNotificationHandler as jest.Mock).mock.calls.at(-1)?.[0] as { handleNotification: () => Promise<Record<string, boolean>> } | undefined;
    expect(handler).toBeTruthy();
    await expect(handler!.handleNotification()).resolves.toMatchObject({ shouldShowBanner: true, shouldShowList: true });
    const received = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls.at(-1)?.[0] as (() => void) | undefined;
    expect(received).toBeTruthy();
    received!();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
    // A tapped notice marks what is on screen old too (TA-164).
    const tapped = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls.at(-1)?.[0] as (r: unknown) => void;
    invalidate.mockClear();
    tapped({ notification: { request: { content: { data: { url: "/parent/attendance?child=m1" } } } } });
    expect(invalidate).toHaveBeenCalledWith();
    unmount();
    client.clear();
  });
});

describe("the document picker offers what the server stores (TA-585)", () => {
  it("TA-585: PDF and pictures, no Word file", async () => {
    await pickAndUpload("document", "Could not upload");
    const asked = (DocumentPicker.getDocumentAsync as jest.Mock).mock.calls.at(-1)?.[0] as { type: string[] };
    expect(asked.type).toEqual(["application/pdf", "image/*"]);
    expect(asked.type.join(" ")).not.toMatch(/msword|wordprocessingml/);
  });
});

describe("the over-the-air guard sees every way a native module moves (TA-264)", () => {
  const bundled = { "expo-sqlite": "~57.0.2", "expo-camera": "~17.0.0" };
  const lock = (sqlite: string, zod: string) => ["lockfileVersion: '9.0'", "", "importers:", "  apps/mobile: {}", "", "packages:", "", `  expo-sqlite@${sqlite}:`, "    resolution: {integrity: sha512-x}", "", `  zod@${zod}:`, "    resolution: {integrity: sha512-y}", "", "snapshots:", `  expo-sqlite@${sqlite}(expo@57.0.20): {}`, ""].join("\n");

  it("TA-264: a lockfile-only move of a native module inside its range is a store release; a JS one is not", () => {
    const moved = rules.classify(["pnpm-lock.yaml"], { before: {}, after: {}, bundled, lockBefore: lock("57.0.2", "3.25.76"), lockAfter: lock("57.0.9", "3.25.76") });
    expect(moved).toEqual({ native: [], deps: ["expo-sqlite"], ok: false });
    const js = rules.classify(["pnpm-lock.yaml"], { before: {}, after: {}, bundled, lockBefore: lock("57.0.2", "3.25.76"), lockAfter: lock("57.0.2", "3.25.77") });
    expect(js.ok).toBe(true);
  });

  it("TA-264: a root patch or override of a native module, and a workspace package adding one, are store releases", () => {
    expect(rules.classify(["patches/expo-sqlite@57.0.2.patch"], { before: {}, after: {}, bundled }).ok).toBe(false);
    expect(rules.classify(["patches/zod@3.25.76.patch"], { before: {}, after: {}, bundled }).ok).toBe(true);
    const root = rules.classify(["package.json"], { before: {}, after: {}, bundled, rootBefore: { pnpm: { overrides: {} } }, rootAfter: { pnpm: { overrides: { "expo-sqlite": "57.0.9" } } } });
    expect(root).toEqual({ native: [], deps: ["expo-sqlite"], ok: false });
    const workspace = rules.classify(["packages/ui/package.json"], { before: {}, after: {}, bundled, workspaceBefore: { "packages/ui/package.json": {} }, workspaceAfter: { "packages/ui/package.json": { dependencies: { "expo-camera": "~17.0.0" } } } });
    expect(workspace.deps).toEqual(["expo-camera"]);
  });

  it("TA-264: the lockfile reader finds this repository's own resolved native versions", () => {
    const versions = rules.lockVersions(fs.readFileSync(path.resolve(__dirname, "../../../../pnpm-lock.yaml"), "utf8"));
    expect(versions.get("expo-sqlite")).toMatch(/^57\./);
    expect(versions.get("react-native")).toMatch(/^0\./);
    expect(versions.get("@expo/ui")).toMatch(/^57\./);
  });
});

describe("Maestro flow 08 asks for what the practice screen draws (TA-590)", () => {
  const flow = fs.readFileSync(path.resolve(__dirname, "../../maestro/08-practice-question.yaml"), "utf8");

  it("TA-590: no web door, and the testIDs it taps are drawn by the practice screens", () => {
    expect(flow).not.toMatch(/Open on the web/);
    const ids = [...flow.matchAll(/\bid: "([^"]+)"/g)].map((m) => m[1]!);
    expect(ids.length).toBeGreaterThan(0);
    const practice = fs.readFileSync(path.resolve(__dirname, "../../src/screens/family/practice.tsx"), "utf8");
    const quiz = fs.readFileSync(path.resolve(__dirname, "../../src/screens/practice/quiz.tsx"), "utf8");
    for (const id of ids) {
      const drawn = practice.includes(`testID="${id}"`) || quiz.includes(`testID="${id}"`) || (/^choice-\d+$/.test(id) && quiz.includes("testID={`choice-${i}`}"));
      expect({ id, drawn }).toEqual({ id, drawn: true });
    }
    // It answers in the phone's player: the verdict and the next question.
    expect(flow).toMatch(/Got it right!/);
    expect(flow).toMatch(/Next question/);
  });
});
