/**
 * The Plan's old monthly price is written by nothing (decision 0010 decision 4; the brief's rule 16 and §5, phase 3): the
 * plans door still takes `priceMonthlyPaise` for one release and ignores it, and the console's form and its action write
 * none, so what an existing school pays is changed by setting its terms. A plan keeps its caps. The old price stays
 * readable: GET /api/v1/operator/plans keeps sending it (the phone's school screen reads it), and a partner's share of a
 * school whose terms are not set still reads it (tests/subscriptions-commission-v2.test.ts).
 *
 * As the database's owner (tests/setup.ts): an operator and plans of this suite's own, stamped and removed after.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { operatorPlansSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as plansGet, POST as plansPost } from "@/app/api/v1/operator/plans/route";
import { PATCH as planPatch } from "@/app/api/v1/operator/plans/[planId]/route";
import { createPlanAction, updatePlanAction } from "@/app/root/actions";
import { PlanRowCard } from "@/app/root/plans/plan-form";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import { ENDPOINTS } from "@/lib/api-catalog";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {}, push() {} }) }));

const db = new PrismaClient();
const STAMP = Date.now();
const CODE = `zz-ppo-${STAMP}`;
let operatorUserId = "";

const send = (method: "POST" | "PATCH", path: string, body: unknown) =>
  new Request(`http://localhost/api/v1${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  operatorUserId = (await db.user.create({ data: { name: "ZZ Price Out Operator", email: `zz-ppo-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const plans = (await db.plan.findMany({ where: { code: { startsWith: CODE } }, select: { id: true } })).map((p) => p.id);
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: operatorUserId }, { targetId: { in: plans } }] } });
  await db.plan.deleteMany({ where: { id: { in: plans } } });
  await db.session.deleteMany({ where: { userId: operatorUserId } });
  await db.user.deleteMany({ where: { id: operatorUserId } });
  await db.$disconnect();
});

describe("the Plan's old monthly price is written by nothing (rule 16)", () => {
  it("the door takes a price for one release and writes none; the caps save; the old price is still read", async () => {
    __resetCookies();
    await createSession(operatorUserId);
    const created = await plansPost(send("POST", "/operator/plans", { code: `${CODE}-a`, name: "ZZ Price Out", messageCap: 10, priceMonthlyPaise: 49_900 }));
    expect(created.status).toBe(201);
    const row = await db.plan.findUniqueOrThrow({ where: { code: `${CODE}-a` }, select: { id: true, messageCap: true, priceMonthlyPaise: true } });
    expect(row).toMatchObject({ messageCap: 10, priceMonthlyPaise: null });

    // A plan made before keeps its old price: a correction sent with a price leaves it and moves what else was sent.
    await db.plan.update({ where: { id: row.id }, data: { priceMonthlyPaise: 100_000 } });
    const params = { params: Promise.resolve({ planId: row.id }) };
    expect((await planPatch(send("PATCH", `/operator/plans/${row.id}`, { priceMonthlyPaise: 1, pupilCap: 50 }), params)).status).toBe(200);
    expect(await db.plan.findUniqueOrThrow({ where: { id: row.id }, select: { pupilCap: true, priceMonthlyPaise: true } })).toEqual({ pupilCap: 50, priceMonthlyPaise: 100_000 });
    // One that sends a price alone changes nothing, and writes no audit row.
    const audits = await db.auditLog.count({ where: { action: "superuser.plan.update", targetId: row.id } });
    expect((await planPatch(send("PATCH", `/operator/plans/${row.id}`, { priceMonthlyPaise: 2 }), params)).status).toBe(200);
    expect(await db.auditLog.count({ where: { action: "superuser.plan.update", targetId: row.id } })).toBe(audits);
    expect((await db.plan.findUniqueOrThrow({ where: { id: row.id }, select: { priceMonthlyPaise: true } })).priceMonthlyPaise).toBe(100_000);

    // The old price is still sent where it is read.
    const listed = operatorPlansSchema.parse(await (await plansGet()).json()).items.find((p) => p.id === row.id);
    expect(listed?.priceMonthlyPaise).toBe(100_000);
  });

  it("the console's form action writes no price either", async () => {
    __resetCookies();
    await createSession(operatorUserId);
    // Sent as an older form would send it: the action's input no longer names a price, so the call is cast.
    const made = await createPlanAction({ code: `${CODE}-b`, name: "ZZ Price Out B", priceMonthlyPaise: 49_900 } as Parameters<typeof createPlanAction>[0]);
    expect(made.ok).toBe(true);
    const row = await db.plan.findUniqueOrThrow({ where: { code: `${CODE}-b` }, select: { id: true, priceMonthlyPaise: true } });
    expect(row.priceMonthlyPaise).toBeNull();
    await db.plan.update({ where: { id: row.id }, data: { priceMonthlyPaise: 100_000 } });
    expect((await updatePlanAction(row.id, { name: "ZZ Price Out B2", priceMonthlyPaise: 1 } as Parameters<typeof updatePlanAction>[1])).ok).toBe(true);
    expect(await db.plan.findUniqueOrThrow({ where: { id: row.id }, select: { name: true, priceMonthlyPaise: true } })).toEqual({ name: "ZZ Price Out B2", priceMonthlyPaise: 100_000 });
  });

  it("nothing under apps/web/src can write it: no plan write's data names it, nor PlanInput, nor updatePlan's key list (C4 point 1, C4a point 6)", () => {
    const root = resolve(__dirname, "../src");
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
      });
    // A write position is the old price inside the arguments of a plan's create, update, updateMany or upsert; a read or a
    // select is not one.
    const writes = (text: string): string[] => {
      const out: string[] = [];
      const call = /\bplan\.(create|createMany|update|updateMany|upsert)\(/g;
      for (let m = call.exec(text); m; m = call.exec(text)) {
        let depth = 1;
        let i = call.lastIndex;
        while (i < text.length && depth > 0) {
          if (text[i] === "(") depth += 1;
          else if (text[i] === ")") depth -= 1;
          i += 1;
        }
        out.push(text.slice(call.lastIndex, i - 1));
      }
      return out;
    };
    const offenders = files(root).filter((file) => writes(readFileSync(file, "utf8")).some((args) => args.includes("priceMonthlyPaise")));
    expect(offenders).toEqual([]);
    const plans = readFileSync(join(root, "lib/plans.ts"), "utf8");
    expect(/export type PlanInput = \{([^}]*)\}/.exec(plans)?.[1]).not.toContain("priceMonthlyPaise");
    expect(plans).not.toMatch(/"storageCapMb", "priceMonthlyPaise"/);
  });
});

(globalThis as { React?: typeof React }).React = React;
const card = (plan: { code: string; priceMonthlyPaise: number | null }) =>
  renderToStaticMarkup(
    React.createElement(
      I18nProvider,
      { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0],
      React.createElement(ToastProvider, null, React.createElement(PlanRowCard, { plan: { id: "p", name: "ZZ plan", pupilCap: null, messageCap: null, storageCapMb: null, createdAt: new Date(0).toISOString(), schools: 0, ...plan } })),
    ),
  );

describe("an old price is shown only where something reads it (the coordinating session's review, A2)", () => {
  it("an ordinary plan's old price reads 'used only for schools whose terms are not set'; a college tier's, read by nothing, is not shown", () => {
    expect(card({ code: `${CODE}-plain`, priceMonthlyPaise: 500_000 })).toContain("used only for schools whose terms are not set");
    // A tier is reckoned from its code and this month's roll, never from a monthly price (decision 4; C4d point 4).
    expect(card({ code: "college-affiliated", priceMonthlyPaise: 500_000 })).not.toContain("used only for schools whose terms are not set");
    expect(card({ code: "college-autonomous", priceMonthlyPaise: 500_000 })).not.toContain("Old monthly price");
  });
});

describe("the partners door says the rule it answers (the coordinating session's review, D6)", () => {
  it("decision 6: a share of each school's subscription month over schools paid up to date, premium never shared; not the plan's recorded price", () => {
    const entry = ENDPOINTS.find((e) => e.method === "GET" && e.path === "/api/v1/operator/partners")!;
    expect(entry.summary).not.toMatch(/plan's recorded price/);
    expect(entry.summary).toMatch(/Shalaghar subscription/);
    expect(entry.summary).toMatch(/premium is never shared/i);
    // The two readings and the two lists said apart (the coordinating session's check of the review fixes, point 4).
    expect(entry.summary).toMatch(/Only Active schools are counted or listed/);
    expect(entry.summary).toMatch(/terms not set: of what it was on before, whatever its renewal date/i);
    expect(entry.summary).toMatch(/free by agreement earns nothing and is in neither list/i);
  });
});
