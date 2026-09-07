import { describe, expect, it } from "vitest";
import { formatBytes, readJson, readJsonArray, writeJson } from "@/lib/json";

/**
 * The String-backed JSON columns promise that EVERY read is total: a corrupt
 * or hand-edited column returns the caller's fallback rather than throwing
 * inside a render. Nothing pinned that promise until now, and half the app
 * reads through these three functions.
 */
describe("json column helpers", () => {
  it("returns the fallback for empty, null, corrupt and null-literal columns", () => {
    expect(readJson<{ a: number }>(null, { a: 1 })).toEqual({ a: 1 });
    expect(readJson<{ a: number }>(undefined, { a: 1 })).toEqual({ a: 1 });
    expect(readJson<{ a: number }>("", { a: 1 })).toEqual({ a: 1 });
    expect(readJson<{ a: number }>("{not json", { a: 1 })).toEqual({ a: 1 });
    expect(readJson<{ a: number }>("null", { a: 1 })).toEqual({ a: 1 });
  });

  it("shallow-merges an object written before a field existed", () => {
    expect(readJson<{ a: number; b: string }>('{"a":2}', { a: 1, b: "x" })).toEqual({ a: 2, b: "x" });
  });

  it("does not merge when either side is an array or a primitive", () => {
    expect(readJson<number[]>("[1,2]", [])).toEqual([1, 2]);
    expect(readJson<number>("7", 0)).toBe(7);
    // An array where an object was expected comes back as written — the
    // caller's shape check is theirs, but the read never throws.
    expect(readJson<unknown>("[1]", { a: 1 })).toEqual([1]);
  });

  it("readJsonArray always yields an array, whatever the column holds", () => {
    expect(readJsonArray<string>('["a","b"]')).toEqual(["a", "b"]);
    expect(readJsonArray<string>('{"a":1}')).toEqual([]);
    expect(readJsonArray<string>("garbage")).toEqual([]);
    expect(readJsonArray<string>(null)).toEqual([]);
  });

  it("writeJson never writes the string 'undefined'", () => {
    expect(writeJson(undefined)).toBe("null");
    expect(writeJson({ a: 1 })).toBe('{"a":1}');
    expect(readJson(writeJson([1, 2]), [])).toEqual([1, 2]);
  });

  it("formatBytes picks the unit a person would", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1536 * 1024)).toBe("1.5 MB");
  });
});
