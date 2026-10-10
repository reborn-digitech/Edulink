import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { certificateIssueSchema } from "@edulink/contracts";
import { defaultLayoutFor } from "@/lib/certificate-rules";
import { readinessFrom } from "@/lib/signatures";

/**
 * The office's handoff from a family's certificate request to the paper, as
 * the page is WRITTEN (the library flow — ask, queue, issue from the ask,
 * decline, withdraw — is tests/api-v1-certificate-requests.test.ts).
 *
 * 10 October 2026: the owner pressed "Issue this" on a pending request and
 * "nothing happened". The link reloaded the same page with the request
 * preselected, but the form it filled sat under the queue of every request
 * the school has, so the screen did not move and the click looked dead; the
 * server action was never the fault. These rules keep the handoff visible:
 * the form comes first when a request is chosen, the link anchors to it, and
 * a refusal is announced where the person is looking.
 */
const DIR = join(process.cwd(), "src", "app", "(app)", "admin", "certificates", "issue");
const page = readFileSync(join(DIR, "page.tsx"), "utf8");
const queue = readFileSync(join(DIR, "request-queue.tsx"), "utf8");
const form = readFileSync(join(DIR, "issue-form.tsx"), "utf8");

describe("the issue page's handoff from a request", () => {
  it("renders the form card before the queue when a request is chosen, and after it otherwise", () => {
    expect(page).toMatch(/request \? \(\s*<>\s*\{formCard\}\s*<RequestQueue/);
    expect(page).toMatch(/<RequestQueue[^>]*\/>\s*\{formCard\}/);
  });

  it("the card carries the anchor the queue's link points at", () => {
    expect(page).toMatch(/<Card id="issue"/);
    expect(queue).toMatch(/href=\{`\/admin\/certificates\/issue\?membershipId=\$\{item\.studentMembershipId\}&requestId=\$\{item\.id\}&kind=\$\{item\.kind\}#issue`\}/);
  });

  it("a refusal is an alert, scrolled into view, not a line the person has to find", () => {
    expect(form).toMatch(/role="alert"/);
    expect(form).toMatch(/scrollIntoView/);
  });

  it("the body the form sends is the body the action's schema takes", () => {
    const body = { templateId: "c" + "a".repeat(24), studentMembershipId: "c" + "b".repeat(24), purpose: "a bank account", requestId: "c" + "d".repeat(24) };
    expect(certificateIssueSchema.safeParse(body).success).toBe(true);
    expect(certificateIssueSchema.safeParse({ ...body, remark: "x".repeat(401) }).success).toBe(false);
  });
});

describe("the paper prints signed (10 October 2026: both lines came out bare)", () => {
  it("a preset asks the office and the principal to sign, under the seal", () => {
    const layout = defaultLayoutFor();
    expect([layout.signerLeft, layout.signerRight, layout.showSeal]).toEqual(["ADMIN", "PRINCIPAL", true]);
  });

  it("the issuer is warned before issuing about every line that would print bare, and the seal", () => {
    const layout = { signerLeft: "ADMIN", signerRight: "PRINCIPAL", showSeal: true } as const;
    const bare = readinessFrom(layout, { myRole: "ADMIN", mineOnFile: false, onFileByRole: {}, sealOnFile: false });
    expect(bare.lines).toEqual([
      { slot: "LEFT", role: "ADMIN", mine: true, onFile: false },
      { slot: "RIGHT", role: "PRINCIPAL", mine: false, onFile: false },
    ]);
    expect(bare.sealMissing).toBe(true);
    const ready = readinessFrom(layout, { myRole: "ADMIN", mineOnFile: true, onFileByRole: { PRINCIPAL: true }, sealOnFile: true });
    expect(ready.lines.every((l) => l.onFile)).toBe(true);
    expect(ready.sealMissing).toBe(false);
    // A template that asks for nobody warns about nobody.
    expect(readinessFrom({ signerLeft: "NONE", signerRight: "NONE", showSeal: false }, { myRole: "ADMIN", mineOnFile: false, onFileByRole: {}, sealOnFile: false })).toEqual({ lines: [], sealMissing: false });
  });

  it("the issue page draws the warning with the way to Signatures", () => {
    expect(page).toMatch(/data-testid="signature-warning"/);
    expect(page).toMatch(/href="\/admin\/signatures"/);
  });
});

describe("a fee on a request reaches the family", () => {
  const list = readFileSync(join(process.cwd(), "src", "components", "certificates", "request-list.tsx"), "utf8");
  it("the family's list says the fee, whether it is paid, and where to pay", () => {
    expect(list).toMatch(/certificateRequests\.feeDue/);
    expect(list).toMatch(/certificateRequests\.feePaidLine/);
    expect(list).toMatch(/data-testid=\{`fee-\$\{item\.id\}`\}/);
  });
});

