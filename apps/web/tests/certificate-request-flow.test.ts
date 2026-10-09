import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { certificateIssueSchema } from "@edulink/contracts";

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
