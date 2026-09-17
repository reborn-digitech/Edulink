# 0003 — Fees: the money never passes through the platform

Status: accepted (2026-09-17). Governs everything under `apps/web/src/lib/fees*.ts`, `gateway.ts`, the `Fee*` tables and the `/api/v1/fees` area.

## Decision

EduLink records what a school asks its families for and what arrived. It does not receive, hold, pool, split or pay out any of it, and it takes no commission, share, markup or convenience fee on any payment. A parent pays the **school**:

- **Online**, into the school's *own* payment-gateway account (Razorpay in this release). The school opens the account, completes its own KYC, and enters its key id, key secret and webhook secret on `/admin/fees/settings`. EduLink creates the order in that account, shows the checkout and hears that account's webhook. Settlement goes from the gateway to the school's bank.
- **By UPI**, straight to the school's own UPI id. EduLink builds a standard `upi://pay` intent with the school as payee; the parent pays from any UPI app and types the UTR back; the office confirms it against the bank statement before a receipt exists. No account, no keys, no fee.
- **At the counter**: cash, cheque or bank transfer the office already holds, recorded after the fact.

Under the Reserve Bank of India (Regulation of Payment Aggregators) Directions, 2025, an entity that receives customers' money and settles it to merchants is a payment aggregator and needs authorisation; a technology provider that routes data and never holds funds does not. This decision keeps EduLink on the second side of that line. It is recorded so that it is not crossed by accident — a "small" split-settlement feature would cross it.

## The five invariants, and what enforces them

| # | Invariant | Where it lives | What fails if it drifts |
|---|---|---|---|
| 1 | Money moves parent → school. There is no platform, pooled, nodal, escrow or settlement account, and no environment variable names a platform gateway key. | `FeeGatewayAccount.schoolId @unique`; no such model or variable exists | `tests/fees-invariants.test.ts` reads the schema and `env.ts` |
| 2 | The gateway adapter may make exactly four calls: create an order, read a payment, read an order's payments, refund a payment to its own instrument. No transfer, route, payout, linked-account or settlement call. | `ALLOWED_CALLS` in `src/lib/gateway.ts`, checked again at call time | the same suite reads `gateway.ts`; `tests/gateway.test.ts` pins the list |
| 3 | The amount a family pays is the server's sum of the demands they chose, nothing added; a gateway reporting any other amount is refused and audited. | `startOnlineCheckout`, `settleOnlinePayment` in `fees-payments.ts` | `tests/fees.test.ts` ("amount-mismatch"), invariants suite |
| 4 | Every receipt is issued in the school's name; the checkout and the receipt say the school is the payee and EduLink neither receives nor holds fees. | `issueReceipt` snapshot; `fees.parentPayeeNote`, `fees.receiptFooter` in all three languages | invariants suite reads the dictionary |
| 5 | Refunds go back to the original instrument from the school's own gateway balance, started by a school admin with a reason; for other methods the office pays the family back itself and records it. | `requestRefund` | `tests/fees.test.ts` |

## What the ledger is

Integer paise everywhere. A structure (instalments of head lines) is published and frozen; assigning a pupil generates one **demand** per instalment; concessions are applied per line and rounded half up to the paisa; a **payment** is allocated oldest-due-first (or to the demands named) and a **receipt** is numbered per school per academic year under a row lock in the same transaction. The ledger is append-only: a mistake is a reversal that keeps the row, and money back is a refund row. `tests/fees.test.ts` posts twenty payments at once and expects twenty different serials.

## What the school owns and must do

- Its gateway account and KYC (days, and the school's task), and the webhook URL `/api/webhooks/razorpay/<schoolId>` registered in its dashboard for `payment.captured`, `payment.failed` and `refund.processed`.
- Its UPI id and payee name, if it wants gateway-free UPI.
- Confirming UPI claims against its bank statement — the office's job, with a CSV matcher to make it a minute rather than an hour.

## What the operator owns

- `FEES_SECRET_KEY`, which seals every school's gateway secrets at rest (`src/lib/secret-box.ts`). Losing it means every school re-enters its keys.
- `FEES_GATEWAY_TRANSPORT=razorpay` on a deployed server; `devbox` mints pretend orders that `/dev/payments` settles, and a deployed server refuses it at boot.
- The two jobs: `fees:remind` (daily, 09:00 in `TZ`) and `fees:reconcile` (hourly, asks the gateway about orders the webhook never reported).

## Still to get in writing

A short opinion from an Indian fintech lawyer that the arrangement above is a technology service and not aggregation under the 2025 directions, to keep beside this file before the first school takes money through it. Nothing in the code depends on it; the decision does.
