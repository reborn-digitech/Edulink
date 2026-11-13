/**
 * TA-507 (testing analysis of 13 November 2026, 'campus-transport-hostel' batch): opening an e-resource
 * (openEResource, reached by the web's GET and the /api/v1 door) added one to its count every time, with no
 * budget, and the count is the library's NAAC 4.2 figure. It is now counted once a person a resource a day.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) with LIBRARY on and one e-resource.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { openEResource } from "@/lib/college-campus";

let c: College;
let resourceId = "";

beforeAll(async () => {
  c = await makeCollege("cthlib");
  await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "LIBRARY" } });
  resourceId = (await c.db.libraryEResource.create({ data: { schoolId: c.schoolId, name: `ZZ TA-507 Journal ${c.stamp}`, nameKey: `zz ta-507 journal ${c.stamp}`, url: "https://example.org/zz-ta-507", kind: "EJOURNAL" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await c.db.rateLimit.deleteMany({ where: { bucket: { startsWith: "eresource-open:" }, OR: [{ bucket: { contains: c.adult.userId } }, { bucket: { contains: c.minor.userId } }] } });
  await c.cleanup();
});

describe("TA-507: an e-resource's opens", () => {
  it("TA-507: one student opening a resource fifty times adds one to its count; another student adds one more; each open still gives the link", async () => {
    const clicks = async () => (await c.db.libraryEResource.findUniqueOrThrow({ where: { id: resourceId }, select: { clicks: true } })).clicks;
    const before = await clicks();
    for (let i = 0; i < 50; i++) expect((await openEResource(c.ctx(c.adult, "STUDENT"), resourceId)).url).toBe("https://example.org/zz-ta-507");
    expect(await clicks()).toBe(before + 1);
    await openEResource(c.ctx(c.minor, "STUDENT"), resourceId);
    await openEResource(c.ctx(c.minor, "STUDENT"), resourceId);
    expect(await clicks()).toBe(before + 2);
  });
});
