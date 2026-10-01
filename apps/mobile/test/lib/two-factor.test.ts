import { isTwoFactor } from "@/lib/two-factor";

describe("a sign-in door's answer", () => {
  it("is the second step only with TWO_FACTOR and a challenge", () => {
    expect(isTwoFactor({ code: "TWO_FACTOR", challenge: "abc" })).toBe(true);
    expect(isTwoFactor({ code: "TWO_FACTOR" })).toBe(false);
    expect(isTwoFactor({ token: "t", sessionId: "s" })).toBe(false);
    expect(isTwoFactor(null)).toBe(false);
    expect(isTwoFactor("TWO_FACTOR")).toBe(false);
  });
});
