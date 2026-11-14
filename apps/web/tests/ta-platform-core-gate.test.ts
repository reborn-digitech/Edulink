/**
 * The platform's front door, from the testing analysis of 13 November 2026 (no database rows are written here).
 *
 *   TA-368: the role gate looked a door up by the exact method, so a HEAD (served by the GET handler) found no entry
 *           and met none of the door's rules; and an unreadable path passed every role but the limited ones.
 *   TA-595: the app store link check accepted http:// while its sentence said https.
 *   TA-489: GET /api/v1/principal/college said "404 at a school" while the module gate answers 403 MODULE_OFF.
 *   TA-580: four GET doors parsed a query schema the catalog did not name.
 *   TA-328: a body the contract refused was answered with the validator's English or a bare tag under each field.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import * as contracts from "@edulink/contracts";
import { gateRequest, endpointFor } from "@/lib/role-gate";
import { AccessError } from "@/lib/access-error";
import { ENDPOINTS } from "@/lib/api-catalog";
import type { Endpoint } from "@/lib/api-catalog/types";
import { readAppReleaseConfig } from "@/lib/env";
import { apiInvalid } from "@/lib/api-v1";
import { translator } from "@/lib/i18n/dictionary";
import { LOCALE_COOKIE } from "@/lib/i18n/locales";
import { __resetCookies, __setCookie } from "./stubs/next-headers";

afterEach(() => __resetCookies());

/** A two-door catalog: one GET behind the head's pages, one POST beside it. */
const CATALOG: readonly Endpoint[] = [
  { method: "GET", path: "/api/v1/zz/head-door", summary: "ZZ a head's door", access: ["ADMIN", "PRINCIPAL"], duties: ["HEAD_PAGES"], response: z.object({}) },
  { method: "POST", path: "/api/v1/zz/other", summary: "ZZ another door", access: ["ADMIN"], response: z.object({}) },
] as unknown as Endpoint[];

describe("TA-368: the gate for a HEAD and for a path it cannot read", () => {
  it("TA-368: a HEAD is the GET door's, so an admin without the head's pages is refused as the GET is", async () => {
    expect(endpointFor("HEAD", "/api/v1/zz/head-door", CATALOG)?.method).toBe("GET");
    await expect(gateRequest("GET /api/v1/zz/head-door", { role: "ADMIN", schoolId: "zz-school", duties: [] }, CATALOG)).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("HEAD /api/v1/zz/head-door", { role: "ADMIN", schoolId: "zz-school", duties: [] }, CATALOG)).rejects.toBeInstanceOf(AccessError);
    // The head, and an admin holding the duty, pass a HEAD as they pass the GET.
    await expect(gateRequest("HEAD /api/v1/zz/head-door", { role: "PRINCIPAL", schoolId: "zz-school", duties: [] }, CATALOG)).resolves.toBe("pass");
    await expect(gateRequest("HEAD /api/v1/zz/head-door", { role: "ADMIN", schoolId: "zz-school", duties: ["HEAD_PAGES"] }, CATALOG)).resolves.toBe("pass");
  });

  it("TA-368: a stamp whose path does not decode serves no role with a school, an ADMIN or a TEACHER as much as a DRIVER", async () => {
    for (const role of ["ADMIN", "TEACHER", "PRINCIPAL", "STUDENT", "PARENT", "DRIVER"] as const) {
      await expect(gateRequest("GET !", { role, schoolId: "zz-school" }, CATALOG), role).resolves.toBe("no-context");
    }
  });
});

describe("TA-595: the app store links", () => {
  const saved = { ios: process.env.APP_STORE_URL_IOS, android: process.env.APP_STORE_URL_ANDROID };
  afterEach(() => {
    for (const [key, value] of [["APP_STORE_URL_IOS", saved.ios], ["APP_STORE_URL_ANDROID", saved.android]] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("TA-595: an http:// link is served as unset with a problem keyed to it; an https:// one is served", () => {
    process.env.APP_STORE_URL_IOS = "http://apps.apple.com/app/zz";
    process.env.APP_STORE_URL_ANDROID = "https://play.google.com/store/apps/details?id=zz";
    const { config, problems } = readAppReleaseConfig();
    expect(config.storeUrls).toEqual({ ios: null, android: "https://play.google.com/store/apps/details?id=zz" });
    expect(problems.map((p) => p.key)).toEqual(["APP_STORE_URL_IOS"]);
    expect(problems[0]!.message).toMatch(/https:\/\//);
  });
});

describe("TA-489: what the catalog says a door answers at a school", () => {
  it("TA-489: no door the module gate holds says it is a 404 at a school (the gate answers 403 MODULE_OFF first)", () => {
    const wrong = ENDPOINTS.filter((e) => e.module && !e.kinds && /404 at a school/.test(e.summary)).map((e) => `${e.method} ${e.path}`);
    expect(wrong).toEqual([]);
    const college = ENDPOINTS.find((e) => e.method === "GET" && e.path === "/api/v1/principal/college");
    expect(college?.summary).toMatch(/403 MODULE_OFF/);
  });
});

describe("TA-580: the query schema a GET door parses is the one the catalog names", () => {
  const exported = contracts as unknown as Record<string, unknown>;
  /** The contract schemas a route's GET handler calls `.safeParse` on. */
  function parsedByGet(e: Endpoint): string[] {
    const file = resolve(__dirname, `../src/app${e.path.replace(/\{(\w+)\}/g, "[$1]")}/route.ts`);
    if (!existsSync(file)) return [];
    const source = readFileSync(file, "utf8");
    const start = source.indexOf("export async function GET");
    if (start < 0) return [];
    const next = source.indexOf("export async function", start + 10);
    const body = source.slice(start, next < 0 ? undefined : next);
    return [...body.matchAll(/(\w+QuerySchema)\.safeParse\(/g)].map((m) => m[1]!).filter((name) => name in exported);
  }

  it("TA-580: every GET door whose handler parses a contract's query schema names that schema as its request", () => {
    const unnamed = ENDPOINTS.filter((e) => e.method === "GET" && e.path.startsWith("/api/v1/"))
      .flatMap((e) => parsedByGet(e).filter((name) => e.request !== exported[name]).map((name) => `${e.path} ${name}`));
    expect(unnamed).toEqual([]);
  });
});

describe("TA-328: a refused field is answered in the reader's language", () => {
  const schema = z.object({
    applicantEmail: z.string().email(),
    endDateKey: z.string().refine(() => false, "date"),
    quietStart: z.string().refine(() => false, "refusal.useHHMM"),
    title: z.string().min(3, "Give it a title."),
  });

  it("TA-328: in Marathi, the validator's English and a bare tag become the field's sentence, a key is translated, a written sentence stays", async () => {
    __setCookie(LOCALE_COOKIE, "mr");
    const parsed = schema.safeParse({ applicantEmail: "ramesh@gmail", endDateKey: "2026-01-01", quietStart: "25:99", title: "Z" });
    if (parsed.success) throw new Error("the sample should be refused");
    const body = (await (await apiInvalid(parsed)).json()) as { issues: Record<string, string> };
    const mr = translator("mr");
    expect(body.issues).toEqual({
      applicantEmail: mr("common.checkThisField"),
      endDateKey: mr("common.checkThisField"),
      quietStart: mr("refusal.useHHMM"),
      title: "Give it a title.",
    });
    for (const value of [body.issues.applicantEmail, body.issues.endDateKey, body.issues.quietStart]) expect(value).toMatch(/[ऀ-ॿ]/);
  });

  it("TA-328: in Hindi, a contract's tag naming two fields ('classId or studentMembershipIds' and the rest) becomes the field's sentence", async () => {
    __setCookie(LOCALE_COOKIE, "hi");
    const hi = translator("hi");
    const samples: Array<[z.ZodTypeAny, unknown, string]> = [
      [contracts.feeAssignBodySchema, { structureId: "ckzzzzzzzzzzzzzzzzzzzzzzz" }, "classId"],
      [contracts.readingRoomScanSchema, { action: "IN" }, "code"],
      [contracts.practiceBeginBodySchema, {}, "slug"],
      [contracts.tripStartSchema, {}, "reason"],
      [contracts.tripBoardingSchema, { allotmentId: "ckzzzzzzzzzzzzzzzzzzzzzzz" }, "boarded"],
    ];
    for (const [schema, sample, field] of samples) {
      const parsed = schema.safeParse(sample);
      if (parsed.success) throw new Error(`the sample for ${field} should be refused`);
      expect(parsed.error.issues.map((i) => i.message).some((m) => / or /.test(m))).toBe(true);
      const body = (await (await apiInvalid(parsed)).json()) as { issues: Record<string, string> };
      expect(body.issues[field]).toBe(hi("common.checkThisField"));
      for (const value of Object.values(body.issues)) expect(value).not.toMatch(/^[A-Za-z]+( or [A-Za-z]+)+$/);
    }
  });
});
