/**
 * Two readings of a request, from the testing analysis of 13 November 2026 (nothing is written).
 *
 *   TA-579: the OpenAPI document published every GET door's request schema as a required JSON body and never as
 *           query parameters, while the handlers read it from the query string. A GET's schema is now one `in: query`
 *           parameter per key (scripts/openapi-params.ts, which gen-openapi.ts calls); other methods keep the body.
 *   TA-277: the expert's web form read a `datetime-local` value in the browser's zone while the page prints UTC and the
 *           phone's form reads UTC; the web now reads it as UTC (utcInstantOfLocalInput).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { ENDPOINTS } from "@/lib/api-catalog";
import type { Endpoint } from "@/lib/api-catalog/types";
import { utcInstantOfLocalInput } from "@/lib/dates";
import { operationInputs } from "../scripts/openapi-params";

describe("TA-579: a GET door's request in the OpenAPI document", () => {
  it("TA-579: is published as query parameters, required as the schema says, with no request body", () => {
    const door = { method: "GET", path: "/api/v1/zz/{classId}/things", request: z.object({ month: z.string(), page: z.coerce.number().optional(), includeArchived: z.enum(["0", "1"]).default("0") }) } as Pick<Endpoint, "method" | "path" | "request">;
    const inputs = operationInputs(door);
    expect(inputs.requestBody).toBeUndefined();
    expect((inputs.parameters ?? []).map((p) => [p.name, p.in, p.required])).toEqual([
      ["classId", "path", true],
      ["month", "query", true],
      ["page", "query", false],
      ["includeArchived", "query", false],
    ]);
  });

  it("TA-579: a POST and a DELETE keep the JSON body", () => {
    for (const method of ["POST", "DELETE"] as const) {
      const inputs = operationInputs({ method, path: "/api/v1/zz/things", request: z.object({ name: z.string() }) });
      expect(inputs.requestBody).toMatchObject({ required: true, content: { "application/json": { schema: { type: "object" } } } });
      expect(inputs.parameters).toBeUndefined();
    }
  });

  it("TA-579: the catalog's GET /api/v1/fees/structures publishes academicYearId and includeArchived as query parameters", () => {
    const e = ENDPOINTS.find((d) => d.method === "GET" && d.path === "/api/v1/fees/structures");
    expect(e?.request).toBeDefined();
    const names = (operationInputs(e!).parameters ?? []).filter((p) => p.in === "query").map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["academicYearId", "includeArchived"]));
    expect(operationInputs(e!).requestBody).toBeUndefined();
  });

  it("TA-579: gen-openapi.ts builds each operation's inputs through operationInputs", () => {
    const source = readFileSync(resolve(__dirname, "../scripts/gen-openapi.ts"), "utf8");
    expect(source).toMatch(/operationInputs\(e\)/);
    expect(source).not.toMatch(/if \(e\.request\) op\.requestBody/);
  });
});

describe("TA-277: the expert's web form reads its times in UTC", () => {
  it("TA-277: a typed 15 December 10:00 is 10:00 UTC whatever the browser's zone, as the phone's form reads it", () => {
    expect(utcInstantOfLocalInput("2026-12-15T10:00")).toBe("2026-12-15T10:00:00.000Z");
    expect(utcInstantOfLocalInput("2026-12-15T10:00:30")).toBe("2026-12-15T10:00:30.000Z");
    expect(utcInstantOfLocalInput("")).toBeNull();
    expect(utcInstantOfLocalInput("15/12/2026 10:00")).toBeNull();
  });

  it("TA-277: the web form sends that reading and not the browser's", () => {
    const source = readFileSync(resolve(__dirname, "../src/app/(app)/expert/availability/slots.tsx"), "utf8");
    expect(source).toMatch(/utcInstantOfLocalInput\(start\)/);
    expect(source).not.toMatch(/new Date\(start\)\.toISOString\(\)/);
  });
});
