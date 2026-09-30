# 0004 — Gigs: work done for the platform, and what each pupil gets free

Status: accepted (2026-09-30). Governs `apps/web/src/lib/gig-questions.ts`, the `Gig*` and `QuestionContribution` tables, and the `/api/v1/gigs`, `/api/v1/appadmin/contributions` and `/api/v1/operator/gigs` areas. Decision 0003 is unchanged and still governs school fees.

## Decision

Experts and teachers may do work through the platform that is first given free and then paid. Every pupil gets a free allowance; past it a guardian pays, and the company keeps a commission. The owner chose the following on 2026-09-30, from options put with their arithmetic (the numbers are section 9 of the pricing document, `pricing-tiers-v3` + gigs).

| Question | Chosen |
|---|---|
| How a family's payment for an expert's session travels | **A licensed gateway's split settlement.** One checkout; the gateway holds the money and sends the commission to the company and the rest to the expert's own linked account. The company never receives or holds a family's money. |
| Who may charge | **Experts only.** A teacher's one-to-one guidance is always free (the Right to Education Act, section 28, bars teachers from private tuition); a teacher earns only by writing questions. |
| Who bears a pupil's free sessions | **The providers.** Each owes a standing free quota as the price of being listed; the company subsidises nothing. |
| Where a session happens | **The provider's own meeting link.** The platform books, asks the guardian's consent, reminds, records delivery and takes payment. |
| A pupil's free allowance | 2 one-to-ones and 2 workshop seats a year. |
| An expert's free duty | The first 10 one-to-ones and 2 workshops; then 2 free one-to-ones a month and 1 free workshop a quarter. |
| Price and commission | The expert sets a price within ₹150–600 for thirty minutes and ₹50–300 a workshop seat; 15 % commission, the gateway's fees paid out of it. |
| When an expert is paid, and cancelling | Held until the session is marked delivered plus 48 hours; free cancellation to 12 hours before; an expert's no-show is refunded in full, a pupil's is not. |
| Teachers' guidance | Their own school's pupils only, two half-hours a month asked, switched on by the school. |
| **Questions for the bank** | **₹10 a question, paid only when the content team or the operator adds it to the question bank.** A teacher's first 20 added are unpaid; at most 200 a month are paid per teacher; all inside a monthly budget the operator sets (₹5,000 to begin). When a teacher's month or the budget is used up, adding waits for next month: nothing is added unpaid by surprise. Questions are sent in English, Hindi and Marathi, with a machine draft of the two offered for the teacher to correct. The operator pays monthly by UPI from the company's bank and records the reference. |
| Order of building | The free tier and the questions first; paid sessions once the lawyer's opinion and the company's gateway account exist. Web first, the phone after. |

## What is built, and what is not

**Built (2026-09-30): questions for the bank.** `QuestionContribution` (the question in three languages, SUBMITTED → RETURNED / ACCEPTED / REJECTED / WITHDRAWN), `GigEarning` (written once, when a question is added; PAID or FREE_BLOCK), `GigPayment` (the operator's record of a transfer, by its UTR), `GigPayee` (a teacher's own UPI id) and `GigSettings` (the six dials). A teacher writes at `/teacher/contributions`; the content team reads at `/appadmin/contributions`; the operator holds the dials and records payments at `/root/gigs`.

**Not built:** sessions, workshops, allowances, teachers' guidance, and everything that takes a family's money.

## The invariants of what is built

1. **Only adding to the bank earns**, and only a member of the content team or the operator adds. The bank's row, its two translations, the contribution's status and the earning are one transaction (`decideContribution`).
2. **The limits are counted under a lock** on the settings row, so two reviewers adding at once cannot take a teacher past their month or the month past its budget (`tests/gig-questions.test.ts` adds two at once and expects one).
3. **The platform pays nobody.** A `GigPayment` is the operator's record of a transfer made from the company's bank outside the app. Its amount is the server's sum of the earnings it settles, never a typed one; a reference is recorded once; only months that have ended are settled. No gateway call exists in this area, and decision 0003's invariants test still passes untouched.
4. **The person is the fence.** These tables carry no school: the bank is every school's, the reviewer is the content team and the payer is the company. A teacher reads and changes only their own questions; another teacher's is a 404 (the cross-person probe tries it). A teacher's UPI id is read by that teacher and by the operator, and is never written to the audit log.
5. **An import does not delete a teacher's work.** `quiz:import` removes from a chapter only the questions a file wrote; one made in the app (`source` "Relay content team" or "teacher contribution") is left.

## Before paid sessions

- A **new decision** for the gateway split, with its own invariants (the fees test forbids transfer and route calls in `gateway.ts` and model names beginning Platform, Wallet, Escrow, Nodal, Settlement or Payout; the gig gateway is its own module).
- A **lawyer's opinion** on three things: that a split by a licensed aggregator keeps the company outside the payment-aggregator directions; how section 28 of the Right to Education Act bears on teachers' free guidance and on paid question-writing; and contracts with the guardians of minors.
- A **chartered accountant** for GST on the commission, the duties of an e-commerce operator, and whether tax is to be deducted from what teachers are paid (₹24,000 a year at the limit).
- Each expert's **KYC with the gateway** before they may charge.
