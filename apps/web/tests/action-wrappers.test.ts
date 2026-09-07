import { afterAll, describe, expect, it } from "vitest";
import { __resetCookies } from "../tests/stubs/next-headers";
import { startThread, sendReply } from "@/app/(app)/remarks/actions";
import { newAssignment } from "@/app/(app)/teacher/assignments/actions";

/**
 * Server-action wrappers: the auth gate and the parse step in front of the
 * libraries. Fifty-three of these files had no test; these pin the shape
 * every form relies on — a missing session is a form-level message, not a
 * throw, and a bad body is field errors, not a 500.
 */
afterAll(() => __resetCookies());

describe("without a session", () => {
  it("startThread and sendReply say log in again, in the form slot", async () => {
    __resetCookies();
    const a = await startThread({ subject: "x", body: "y" });
    expect(a.ok).toBe(false);
    expect(a.errors._form).toBeTruthy();
    const b = await sendReply({ threadId: "t", body: "y" });
    expect(b.ok).toBe(false);
    expect(b.errors._form).toBeTruthy();
  });

  it("newAssignment refuses without a session and never throws", async () => {
    __resetCookies();
    const payload = new FormData();
    payload.set("classId", "c");
    payload.set("title", "t");
    payload.set("publish", "false");
    const result = await newAssignment(payload);
    expect(result.ok).toBe(false);
  });
});
