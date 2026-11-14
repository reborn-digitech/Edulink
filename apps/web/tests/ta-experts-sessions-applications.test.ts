/**
 * TA-335 (testing analysis of 13 November 2026, Low): the public expert application counted only valid applications
 * against its limit, so invalid posts were read and answered without end, and it said which addresses are experts
 * ("already an expert") or have an application waiting, the disclosure QA-25 closed on the school's and the
 * recruiter's sign-ups. (The body cap for a post that declares no length is TA-423's and already holds.)
 *
 * Signed out, through POST /api/v1/public/expert-applications, from a caller address of this suite's own. Every row
 * is this suite's (the stamp in each address), removed afterwards; mail is written to the outbox table, never sent.
 *
 * EXPECTED ONCE FIXED: an expert's address, a waiting address and a new one get the same 201; nothing is filed for
 * the first two and their holders are told by mail; every post counts against the caller before its body is read.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { ExpertApplicationBody } from "@edulink/contracts";
import { EXPERT_APPLICATION_TRIES } from "@/lib/expert-applications";
import { translator } from "@/lib/i18n/dictionary";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as applyPost } from "@/app/api/v1/public/expert-applications/route";

const db = new PrismaClient();
const STAMP = Date.now();
const mail = (key: string) => `zz-taesa-${key}-${STAMP}@test.invalid`;
const STORE = mkdtempSync(join(tmpdir(), "zz-taesa-"));
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = STORE;
const ADDRESS = `zz-taesa-${STAMP}`;

const body = (email: string): ExpertApplicationBody => ({
  name: "ZZ Meera Kulkarni",
  email,
  phone: "98765 43210",
  city: "Pune",
  organisation: "ZZ Robotics Lab",
  headline: "ZZ structural engineer and robotics coach",
  specialisms: ["ENGINEERING"],
  languages: ["en"],
  yearsExperience: 12,
  bio: "ZZ fixture: twelve years designing bridges, five coaching school robotics teams on Saturdays.",
  links: [],
  offering: "SESSIONS",
  declaration: true,
});
async function apply(email: string): Promise<{ status: number; json: unknown }> {
  const form = new FormData();
  form.set("application", JSON.stringify(body(email)));
  form.set("document", new File([Buffer.from("%PDF-1.4\n% ZZ\ntrailer <<>>\n%%EOF\n")], "zz.pdf", { type: "application/pdf" }));
  const response = await applyPost(new Request("http://localhost/api/v1/public/expert-applications", { method: "POST", body: form }));
  return { status: response.status, json: await response.json() };
}

beforeAll(async () => {
  const expert = await db.user.create({ data: { name: `ZZ TA esa expert ${STAMP}`, email: mail("expert"), isTestFixture: true }, select: { id: true } });
  await db.expertProfile.create({ data: { userId: expert.id, headline: "ZZ already an expert" } });
  await db.expertApplication.create({ data: { name: "ZZ Waiting", email: mail("waiting"), phone: "+919876543210", city: "Pune", headline: "ZZ waiting applicant", specialisms: "[]", languages: "[]", yearsExperience: 3, bio: "ZZ an application already waiting for the operator.", links: "[]", offering: "SESSIONS", declarationAt: new Date(), locale: "en" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.expertApplication.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.rateLimit.deleteMany({ where: { bucket: { contains: ADDRESS } } });
  await db.$disconnect();
  rmSync(STORE, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
});

describe("the public expert application", () => {
  it("TA-335: an expert's address and a waiting address are answered as a new one; nothing is filed for them and their holders are told by mail", async () => {
    __setHeaders({ "x-forwarded-for": `${ADDRESS}-a` });
    const fresh = await apply(mail("new"));
    const expert = await apply(mail("expert"));
    const waiting = await apply(mail("waiting"));
    expect(fresh).toEqual({ status: 201, json: { ok: true, email: mail("new") } });
    expect(expert).toEqual({ status: 201, json: { ok: true, email: mail("expert") } });
    expect(waiting).toEqual({ status: 201, json: { ok: true, email: mail("waiting") } });
    expect(await db.expertApplication.count({ where: { email: mail("expert") } })).toBe(0);
    expect(await db.expertApplication.count({ where: { email: mail("waiting") } })).toBe(1);
    const subject = translator("en")("expertApply.mailInUseSubject");
    expect(await db.outboundEmail.count({ where: { to: { in: [mail("expert"), mail("waiting")] }, subject } })).toBe(2);
  });

  it("TA-335: every post counts against the caller's address before its body is read, so invalid posts end in 429", async () => {
    __setHeaders({ "x-forwarded-for": `${ADDRESS}-b` });
    const bad = () => applyPost(new Request("http://localhost/api/v1/public/expert-applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Z" }) }));
    for (let i = 0; i < EXPERT_APPLICATION_TRIES.limit; i += 1) expect((await bad()).status).toBe(422);
    const limited = await bad();
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
