/**
 * TA-443 (testing analysis of 13 November 2026, operator-console batch, Low, Privacy): error messages went to the log
 * and to the error tracker unscrubbed. sentryEvent sent err.message as the exception's value although its comment
 * promised ids only, so a Prisma validation error carrying a query's arguments (a pupil's name, an address, a phone)
 * reached Sentry and the log. Now a Prisma error is reported by its class and code alone, and any other message has its
 * addresses and long digit runs blanked, in the tracker's event and in the log line; the invitation action logs a row's
 * place in the list rather than its address.
 */
import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { reportError, scrubErrorMessage, sentryEvent } from "@/lib/metrics";

const ADDRESS = "zz.parent1@zz.test";

function validationError(): Error {
  return new Prisma.PrismaClientValidationError(
    `Invalid \`prisma.user.create()\` invocation:\n\n{\n  data: {\n    email: "${ADDRESS}",\n    phone: "+919876543210"\n  }\n}\n\nUnknown argument \`phone\`.`,
    { clientVersion: "6.19.0" },
  );
}

describe("TA-443: what the error tracker and the log are told", () => {
  it("TA-443: a Prisma validation error holding an address reaches the tracker without it", () => {
    const event = sentryEvent(validationError(), { where: "api/v1/me", kind: "unexpected" }, {}, new Date("2026-11-14T00:00:00Z"));
    const value = event.exception.values[0]!.value;
    expect(value).not.toContain("@zz.test");
    expect(value).not.toContain("9876543210");
    expect(value).toBe("PrismaClientValidationError");
    expect(JSON.stringify(event)).not.toContain("@zz.test");
  });

  it("TA-443: a known request error is named by its code", () => {
    const err = new Prisma.PrismaClientKnownRequestError(`Unique constraint failed on the fields: (\`email\`) value ${ADDRESS}`, { code: "P2002", clientVersion: "6.19.0" });
    expect(scrubErrorMessage(err)).toBe("PrismaClientKnownRequestError P2002");
  });

  it("TA-443: any other message keeps its words and loses its addresses and long numbers", () => {
    expect(scrubErrorMessage(new Error(`mail to ${ADDRESS} refused for +91 98765 43210`))).not.toMatch(/@zz\.test|98765/);
    expect(scrubErrorMessage(new Error("db is down"))).toBe("db is down");
  });

  it("TA-443: the log line without a tracker carries the scrubbed message, not the address", async () => {
    const log = vi.fn();
    expect(await reportError(validationError(), { where: "api/v1/me", kind: "unexpected" }, { env: {}, log })).toBe(false);
    expect(log).toHaveBeenCalledTimes(1);
    const [, logged] = log.mock.calls[0]! as [string, Error];
    expect(logged).toBeInstanceOf(Error);
    expect(`${logged.message}\n${logged.stack ?? ""}`).not.toContain("@zz.test");
  });
});
