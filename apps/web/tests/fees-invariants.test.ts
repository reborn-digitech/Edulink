import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ALLOWED_CALLS } from "@/lib/gateway";

/**
 * ⚠ THE MONEY NEVER PASSES THROUGH THE PLATFORM — as code, not prose.
 *
 * docs/decisions/0003 records the decision: a parent pays the school, into
 * the school's own gateway account or its own UPI id; Relay creates the
 * order and hears the webhook, holds nothing, pools nothing, splits nothing,
 * takes no share. Under the RBI's Payment Aggregator directions that is the
 * line between a technology provider and an entity that needs authorisation,
 * so it must not drift. Each check below reads the source and fails the
 * moment somebody adds a platform account, a fee column or a transfer call.
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const SCHEMA = read("prisma/schema.prisma");
const GATEWAY = read("src/lib/gateway.ts");
const FEES_SOURCES = ["src/lib/fees.ts", "src/lib/fees-payments.ts", "src/lib/fees-reports.ts", "src/lib/gateway.ts", "src/lib/api-reads/fees.ts", "src/lib/api-catalog/fees.ts", "src/app/api/webhooks/razorpay/[schoolId]/route.ts"].map((p) => [p, read(p)] as const);

function model(name: string): string {
  const m = new RegExp(`^model ${name} \\{([\\s\\S]*?)^\\}`, "m").exec(SCHEMA);
  if (!m) throw new Error(`no model ${name}`);
  return m[1]!;
}

describe("invariant 1 — money moves parent → school, never through a platform account", () => {
  it("the gateway account is one per SCHOOL and there is no platform-level account anywhere", () => {
    expect(model("FeeGatewayAccount")).toMatch(/schoolId\s+String\s+@unique/);
    expect(SCHEMA).not.toMatch(/model (Platform|Wallet|Escrow|Nodal|Settlement|Payout)\w*/);
    // No environment variable names a platform gateway account.
    const env = read("src/lib/env.ts");
    expect(env).not.toMatch(/RAZORPAY_KEY|FEES_GATEWAY_KEY|FEES_GATEWAY_SECRET|PLATFORM_KEY/);
  });

  it("no fees table carries a fee, share, markup or commission column", () => {
    for (const name of ["FeeHead", "FeeStructure", "FeeInstalment", "FeeLine", "StudentFeePlan", "FeeConcession", "FeeDemand", "FeePayment", "FeeAllocation", "FeeReceipt", "FeeRefund", "FeeGatewayAccount", "GatewayEvent"]) {
      const body = model(name).replace(/\/\/\/.*$/gm, "").replace(/\/\/.*$/gm, "");
      expect(body, name).not.toMatch(/^\s*\w*(platform|commission|markup|share|convenience|surcharge|split)\w*\s+(Int|Float|Decimal|String)/im);
    }
  });
});

describe("invariant 2 — the adapter may make four calls, and no call moves money between accounts", () => {
  it("ALLOWED_CALLS is exactly order-create, payment-read, order-payments-read and refund", () => {
    expect(ALLOWED_CALLS.map((c) => `${c.method} ${c.path}`).sort()).toEqual(["GET /v1/orders/{orderId}/payments", "GET /v1/payments/{paymentId}", "POST /v1/orders", "POST /v1/payments/{paymentId}/refund"]);
  });

  it("every fetch in gateway.ts goes through the one allow-listed call()", () => {
    // One `fetch(` — inside call() — and no other network verb.
    expect(GATEWAY.match(/\bfetch\(/g)?.length).toBe(1);
    expect(GATEWAY).toMatch(/if \(!ALLOWED_CALLS\.some/);
    expect(GATEWAY).not.toMatch(/\/v1\/(transfers|payouts|contacts|fund_accounts|accounts|settlements|routes?|linked_accounts)/);
  });

  it("no fees source names a transfer, payout, split or linked-account concept", () => {
    for (const [path, src] of FEES_SOURCES) {
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(code, path).not.toMatch(/\b(transfer_id|linked_account|on_hold|payout|split_settlement|route_transfer)\b/i);
    }
  });
});

describe("invariant 3 — the amount a family pays is the sum of its dues, nothing added", () => {
  it("the checkout amount is computed on the server from the demands, and the order is refused if the gateway reports another amount", () => {
    const payments = read("src/lib/fees-payments.ts");
    expect(payments).toMatch(/const amountPaise = demands\.reduce\(\(a, d\) => a \+ d\.netPaise - d\.paidPaise, 0\)/);
    expect(payments).toMatch(/if \(p\.amountPaise !== input\.amountPaise\)/);
    expect(payments).toMatch(/refuseOverpayment/);
  });
});

describe("invariant 4 — receipts are issued in the school's name", () => {
  it("the receipt snapshot carries the school and the payee note names the school, not the platform", () => {
    const payments = read("src/lib/fees-payments.ts");
    expect(payments).toMatch(/school: \{ name: school\.name/);
    const en = read("../../packages/i18n/src/en.ts");
    expect(en).toMatch(/parentPayeeNote: "You are paying \{school\}\. Relay does not receive or hold this payment/);
    expect(en).toMatch(/receiptFooter: ".*Relay neither receives nor holds fees\."/);
  });
});

describe("invariant 5 — refunds go back through the school's gateway from the school's balance", () => {
  it("an online refund is the gateway's refund call on the original payment, started by the office with a reason", () => {
    const payments = read("src/lib/fees-payments.ts");
    expect(payments).toMatch(/refundPayment\(account, p\.gatewayPaymentId, input\.amountPaise/);
    expect(payments).toMatch(/requireFeesOffice\(ctx\);\s*\n\s*const why = input\.reason/);
  });
});
