import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiErrorSchema, conversationMessageSchema, localeSchema, marksBatchSchema, page, pageQuerySchema, sessionTokenSchema } from "./index";

describe("@edulink/contracts", () => {
  it("accepts the error envelope the web actions already produce, and refuses an empty one", () => {
    expect(apiErrorSchema.safeParse({ error: "Name is required.", issues: { name: "Give it a name." } }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ error: "" }).success).toBe(false);
    expect(apiErrorSchema.safeParse({ error: "Slow down.", code: "RATE_LIMITED", retryAfterSeconds: 30 }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ error: "x", code: "TEAPOT" }).success).toBe(false);
  });

  it("knows the three languages and no fourth", () => {
    expect(localeSchema.options).toEqual(["en", "hi", "mr"]);
    expect(localeSchema.safeParse("fr").success).toBe(false);
  });

  it("caps a page at 100 and defaults to 30, coercing the query string", () => {
    expect(pageQuerySchema.parse({})).toEqual({ limit: 30 });
    expect(pageQuerySchema.parse({ limit: "10", cursor: "abc" })).toEqual({ limit: 10, cursor: "abc" });
    expect(pageQuerySchema.safeParse({ limit: 500 }).success).toBe(false);
    const feed = page(z.object({ id: z.string() }));
    expect(feed.parse({ items: [{ id: "a" }], nextCursor: null }).nextCursor).toBeNull();
  });

  it("stores a session with an ISO expiry and a real locale", () => {
    const ok = sessionTokenSchema.safeParse({ token: "t".repeat(40), expiresAt: "2026-09-08T10:00:00.000Z", locale: "mr" });
    expect(ok.success).toBe(true);
    expect(sessionTokenSchema.safeParse({ token: "short", expiresAt: "tomorrow", locale: "en" }).success).toBe(false);
  });

  it("a marks batch needs real ids and a bounded sheet; a message needs its client id", () => {
    const id = "c" + "k".repeat(24);
    expect(marksBatchSchema.safeParse({ slotId: id, classId: id, entries: [{ membershipId: id, marks: 42.5 }, { membershipId: id, marks: null }] }).success).toBe(true);
    expect(marksBatchSchema.safeParse({ slotId: "slot-1", classId: id, entries: [] }).success).toBe(false);
    expect(conversationMessageSchema.safeParse({ conversationId: id, body: "  hello  ", clientId: "abcdefgh" }).data?.body).toBe("hello");
    expect(conversationMessageSchema.safeParse({ conversationId: id, body: "hi", clientId: "short" }).success).toBe(false);
  });
});
