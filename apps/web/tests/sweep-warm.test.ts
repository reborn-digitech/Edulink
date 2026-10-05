/**
 * R-29 (5 Oct 2026, risks batch): the page sweep warms a cold dev server with the cheap pages before it counts,
 * and the dev client's interactive transactions have room for a compile (development only).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WARM_PUBLIC, warmPlan, warmUp } from "../scripts/sweep-warm";
import { DEV_TRANSACTION_OPTIONS, transactionOptionsFor } from "@/lib/db-transaction-options";

describe("the page sweep's warm pass", () => {
  it("asks for the public pages signed out first, then each distinct home once, in the actors' order", () => {
    const plan = warmPlan([
      { label: "admin", cookie: "a", home: "/admin" },
      { label: "teacher", cookie: "t", home: "/teacher" },
      { label: "oakfield-admin", cookie: "o", home: "/admin" },
      { label: "parent", cookie: "p", home: "/parent" },
    ]);
    expect(plan.map((s) => `${s.who} ${s.path}`)).toEqual([...WARM_PUBLIC.map((p) => `anonymous ${p}`), "admin /admin", "teacher /teacher", "parent /parent"]);
    expect(plan.slice(0, WARM_PUBLIC.length).every((s) => s.cookie === null)).toBe(true);
  });

  it("makes one request per step in order, sends the actor's cookie, and swallows a dropped socket", async () => {
    const seen: string[] = [];
    const fetcher = async (url: string, init: { headers: Record<string, string> }) => {
      seen.push(`${url} ${init.headers.cookie ?? "-"}`);
      if (url.endsWith("/offline")) throw new Error("other side closed");
      return { status: 200, arrayBuffer: async () => new ArrayBuffer(0) };
    };
    const out = await warmUp("http://x", warmPlan([{ label: "admin", cookie: "c=1", home: "/admin" }]), fetcher);
    expect(seen).toEqual(["http://x/api/health -", "http://x/login -", "http://x/ -", "http://x/offline -", "http://x/admin c=1"]);
    expect(out.answered).toBe(4);
  });

  it("runs in sweep.ts after the actors are minted and before the first counted check", () => {
    const src = readFileSync(join(process.cwd(), "scripts", "sweep.ts"), "utf8");
    const main = src.slice(src.indexOf("async function main()"));
    const warm = main.indexOf("await warmUp(BASE, warmPlan(");
    expect(warm).toBeGreaterThan(main.indexOf('const student: Actor = { label: "student"'));
    expect(warm).toBeLessThan(main.indexOf("await check("));
  });
});

describe("the dev client's interactive transactions", () => {
  it("have room for a compile in development, and Prisma's defaults everywhere else", () => {
    expect(transactionOptionsFor("development")).toEqual({ maxWait: 10_000, timeout: 30_000 });
    expect(DEV_TRANSACTION_OPTIONS.timeout).toBeGreaterThan(5_000);
    expect(transactionOptionsFor("production")).toBeUndefined();
    expect(transactionOptionsFor("test")).toBeUndefined();
    expect(transactionOptionsFor(undefined)).toBeUndefined();
  });

  it("are given to the client in db.ts", () => {
    const src = readFileSync(join(process.cwd(), "src", "lib", "db.ts"), "utf8");
    expect(src).toMatch(/transactionOptions: transactionOptionsFor\(process\.env\.NODE_ENV\)/);
  });
});
