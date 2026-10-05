import { ApiRefused, isNotFound, makeQueryClient, unwrap } from "@/lib/query";

describe("server state", () => {
  it("retries a flicker or a 5xx once, never a refusal the server meant (A3-states-14)", () => {
    const retry = makeQueryClient().getDefaultOptions().queries!.retry as (count: number, error: unknown) => boolean;
    expect(retry(0, new Error("flicker"))).toBe(true);
    expect(retry(1, new Error("flicker"))).toBe(false);
    expect(retry(0, new ApiRefused(500, "Down", "SERVER"))).toBe(true);
    expect(retry(0, new ApiRefused(503, "Down", "SERVER"))).toBe(true);
    expect(retry(0, new ApiRefused(401, "Sign in again", "UNAUTHORIZED"))).toBe(false);
    expect(retry(0, new ApiRefused(403, "Not yours", "FORBIDDEN"))).toBe(false);
    expect(retry(0, new ApiRefused(404, "Gone", "NOT_FOUND"))).toBe(false);
    expect(retry(0, new ApiRefused(422, "Invalid", "INVALID"))).toBe(false);
    expect(retry(0, new ApiRefused(408, "Slow", "TIMEOUT"))).toBe(true);
    expect(retry(0, new ApiRefused(429, "Busy", "RATE_LIMITED"))).toBe(true);
  });

  it("names not found, not yours and gone as final", () => {
    expect(isNotFound(new ApiRefused(404, "Gone"))).toBe(true);
    expect(isNotFound(new ApiRefused(403, "Not yours"))).toBe(true);
    expect(isNotFound(new ApiRefused(410, "Gone"))).toBe(true);
    expect(isNotFound(new ApiRefused(500, "Down"))).toBe(false);
    expect(isNotFound(new Error("flicker"))).toBe(false);
    expect(isNotFound(undefined)).toBe(false);
  });

  it("runs a mutation even when the browser says it is offline, and tries a query once", () => {
    const defaults = makeQueryClient().getDefaultOptions();
    expect(defaults.mutations?.networkMode).toBe("always");
    expect(defaults.queries?.networkMode).toBe("offlineFirst");
  });

  it("unwraps a result into data or the envelope's sentence", () => {
    expect(unwrap({ ok: true, data: { a: 1 } })).toEqual({ a: 1 });
    expect(() => unwrap({ ok: false, status: 403, error: "Not yours.", code: "FORBIDDEN" })).toThrow(ApiRefused);
    try {
      unwrap({ ok: false, status: 404, error: "Gone." });
    } catch (e) {
      expect(e).toMatchObject({ name: "ApiRefused", status: 404, message: "Gone.", code: undefined });
    }
  });
});
