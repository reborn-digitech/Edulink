/**
 * Every array a request schema accepts has a maximum (item 16's follow-up, 2 November 2026).
 *
 * The server reads a JSON body of at most 1 MB (JSON_BODY_LIMIT), which is room for 500,000 elements
 * of `[0,0,0,…]`. The patched zod 3 (patches/zod@3.25.76.patch, colinhacks/zod#6652) fails an array over
 * its `.max()` before it parses a single element, so a capped array costs one issue; an array with no
 * cap builds one issue per element: 185 MB of heap on zod 3 and 259 MB on zod 4.6.7 for that one body.
 * So a request-side array without a maximum is a memory hole the body limit does not close, and this
 * suite refuses one. It walks the `request` schema of every catalogued door (bodies and query schemas,
 * nested objects, unions, effects, records, tuples, lazies and pipelines included) and the schemas the
 * web's own forms, server actions and the browser-only doors parse (src/lib/validation.ts), and fails on
 * any ZodArray with neither `.max()` nor `.length()` and any ZodSet without `.max()`. Response schemas
 * carry no cap by design: the server builds them from its own rows and nobody parses a response here.
 *
 * To let one through, add it to EXEMPT with the reason; today nothing is exempt, because every one of
 * the arrays walked has a cap chosen from its domain (a class list, a CSV of pupils, a question's
 * choices, a UTR sheet). The caps themselves live beside the schemas in packages/contracts/src/v1 and
 * src/lib/validation.ts.
 */
import { describe, expect, it } from "vitest";
import { z, type ZodTypeAny } from "zod";
import { ENDPOINTS } from "@/lib/api-catalog";
import * as validation from "@/lib/validation";

/** `${METHOD} ${path} ${innerPath}` (or `validation.${name} ${innerPath}`) → why this collection may be unbounded. */
const EXEMPT: Record<string, string> = {};

/** The walk must meet at least this many arrays, or it has stopped seeing the schemas (176 catalogued on 2 Nov 2026). */
const ARRAYS_FLOOR = 150;

type Finding = { key: string; kind: "array" | "set" };

const typeName = (s: unknown): string | undefined => (s as { _def?: { typeName?: string } } | undefined)?._def?.typeName;

/**
 * Walk one schema, naming every collection with no maximum. `seen` is per walk: a schema reused twice in
 * one request is reported at its first path, which is enough to find it.
 */
function walk(schema: ZodTypeAny, path: string, out: Finding[], seen: Set<ZodTypeAny>, met: { arrays: number }): void {
  if (!schema || typeof schema !== "object" || seen.has(schema)) return;
  seen.add(schema);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod 3's _def is untyped across its node kinds
  const d: any = (schema as any)._def;
  switch (typeName(schema)) {
    case "ZodArray":
      met.arrays++;
      if (d.maxLength == null && d.exactLength == null) out.push({ key: path, kind: "array" });
      walk(d.type, `${path}[]`, out, seen, met);
      return;
    case "ZodSet":
      if (d.maxSize == null) out.push({ key: path, kind: "set" });
      walk(d.valueType, `${path}{}`, out, seen, met);
      return;
    case "ZodObject": {
      const shape = d.shape();
      for (const k of Object.keys(shape)) walk(shape[k], `${path}.${k}`, out, seen, met);
      if (d.catchall && typeName(d.catchall) !== "ZodNever") walk(d.catchall, `${path}.*`, out, seen, met);
      return;
    }
    case "ZodOptional":
    case "ZodNullable":
    case "ZodDefault":
    case "ZodCatch":
    case "ZodBranded":
    case "ZodReadonly":
    case "ZodPromise":
      walk(d.innerType ?? d.type, path, out, seen, met);
      return;
    case "ZodEffects":
      walk(d.schema, path, out, seen, met);
      return;
    case "ZodUnion":
    case "ZodDiscriminatedUnion":
      (d.options as ZodTypeAny[]).forEach((o, i) => walk(o, `${path}|${i}`, out, seen, met));
      return;
    case "ZodIntersection":
      walk(d.left, `${path}&left`, out, seen, met);
      walk(d.right, `${path}&right`, out, seen, met);
      return;
    case "ZodRecord":
    case "ZodMap":
      walk(d.keyType, `${path}.{key}`, out, seen, met);
      walk(d.valueType, `${path}.{}`, out, seen, met);
      return;
    case "ZodTuple":
      (d.items as ZodTypeAny[]).forEach((o, i) => walk(o, `${path}[${i}]`, out, seen, met));
      if (d.rest) walk(d.rest, `${path}[...]`, out, seen, met);
      return;
    case "ZodLazy":
      walk(d.getter(), path, out, seen, met);
      return;
    case "ZodPipeline":
      walk(d.in, `${path}>in`, out, seen, met);
      walk(d.out, `${path}>out`, out, seen, met);
      return;
    default:
      return; // a leaf: string, number, enum, literal, boolean, date, …
  }
}

function report(findings: Finding[]): string[] {
  return findings.filter((f) => !(f.key in EXEMPT)).map((f) => `${f.key}: ${f.kind} without a maximum`);
}

describe("request schemas cap every array (item 16, zod#6652)", () => {
  it("every catalogued door's request schema has a maximum on every array and set it accepts", () => {
    const findings: Finding[] = [];
    const met = { arrays: 0 };
    let doors = 0;
    for (const e of ENDPOINTS) {
      if (!e.request) continue;
      doors++;
      walk(e.request, `${e.method} ${e.path} request`, findings, new Set(), met);
    }
    expect(doors).toBeGreaterThan(0);
    expect(met.arrays).toBeGreaterThanOrEqual(ARRAYS_FLOOR);
    expect(report(findings)).toEqual([]);
  });

  it("every schema the web's forms, actions and browser-only doors parse (src/lib/validation.ts) does too", () => {
    const findings: Finding[] = [];
    const met = { arrays: 0 };
    let schemas = 0;
    for (const [name, value] of Object.entries(validation)) {
      if (!typeName(value)) continue;
      schemas++;
      walk(value as ZodTypeAny, `validation.${name}`, findings, new Set(), met);
    }
    expect(schemas).toBeGreaterThan(0);
    expect(report(findings)).toEqual([]);
  });

  it("the walk itself sees an uncapped array under an optional, a union, an effect, a record and a tuple", () => {
    const uncapped = z
      .object({
        a: z.object({ ids: z.array(z.string()) }).optional(),
        b: z.union([z.string(), z.object({ rows: z.array(z.number()).min(1) })]),
        c: z.object({ tags: z.array(z.string()) }).refine(() => true),
        d: z.record(z.array(z.string())),
        e: z.tuple([z.array(z.string())]),
        f: z.set(z.string()),
        ok: z.array(z.string()).max(5).default([]),
        exact: z.array(z.string()).length(2),
        okSet: z.set(z.string()).max(3),
      })
      .strict();
    const findings: Finding[] = [];
    walk(uncapped, "x", findings, new Set(), { arrays: 0 });
    expect(report(findings)).toEqual([
      "x.a.ids: array without a maximum",
      "x.b|1.rows: array without a maximum",
      "x.c.tags: array without a maximum",
      "x.d.{}: array without a maximum",
      "x.e[0]: array without a maximum",
      "x.f: set without a maximum",
    ]);
  });

  it("every exemption names a collection the walk still meets, so a stale reason is noticed", () => {
    const keys = new Set<string>();
    const met = { arrays: 0 };
    const all: Finding[] = [];
    for (const e of ENDPOINTS) if (e.request) walk(e.request, `${e.method} ${e.path} request`, all, new Set(), met);
    for (const [name, value] of Object.entries(validation)) if (typeName(value)) walk(value as ZodTypeAny, `validation.${name}`, all, new Set(), met);
    for (const f of all) keys.add(f.key);
    const stale = Object.keys(EXEMPT).filter((k) => !keys.has(k));
    expect(stale).toEqual([]);
  });
});
