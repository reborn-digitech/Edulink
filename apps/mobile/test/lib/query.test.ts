import { ApiRefused, makeQueryClient, unwrap } from "@/lib/query";

describe("server state", () => {
  it("retries once, never a 401", () => {
    const retry = makeQueryClient().getDefaultOptions().queries!.retry as (count: number, error: unknown) => boolean;
    expect(retry(0, new Error("flicker"))).toBe(true);
    expect(retry(1, new Error("flicker"))).toBe(false);
    expect(retry(0, new ApiRefused(401, "Sign in again", "UNAUTHORIZED"))).toBe(false);
    expect(retry(0, new ApiRefused(403, "Not yours", "FORBIDDEN"))).toBe(true);
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
