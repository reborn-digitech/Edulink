# 0006 — Plans sold per person, and sessions sold per seat

Status: accepted by the owner (16 October 2026), from the owner's decisions of 15 and 16 October 2026. Amends decision 0004 in two places (below). Governs `apps/web/src/lib/person-plans.ts`, the `mayUse` seam in `apps/web/src/lib/platform-features.ts`, the `PersonPlan` and `Entitlement` tables, the plan card (`apps/web/src/components/plan-card.tsx`), `/account/plan`, the Plans section of `/root/features`, the `/api/v1/operator/person-plans` and `/api/v1/operator/entitlements` doors and the `plans:expire` job. Decision 0003 is unchanged and still governs school fees: nothing here touches a school's money.

## Decision

The platform sells three plans, each to one person.

| Plan | What it opens | Who pays |
|---|---|---|
| **STUDENT** | the question bank's practice, the assistant | a guardian for a pupil under eighteen; a college student for themselves |
| **TEACHER** | the teachers' question gig, offering teaching sessions, the job board as a reader, the assistant | the teacher |
| **EXPERT** | offering any time as an expert (sessions and mentoring); required before an expert may offer time | the expert |

- **Sessions are sold per seat, for everyone, and are in no plan.** A plan lets a teacher or an expert *offer* sessions; a family pays for each seat it books.
- **A school posting a vacancy needs no plan.** Only reading the board as a job seeker is the teacher's plan.
- **The platform's feature switches stay above the plans** (`/root/features`, decision of 15 October 2026). A feature the operator has off is off for everyone, plan or not.

## Amendments to decision 0004

1. **A one-to-one may be priced.** 0004's second amendment of 2 October 2026 said a one-to-one is never priced; that is withdrawn. How a priced one-to-one is sold is the second half of this work (Razorpay, per seat).
2. **A teacher's sessions may be sold.** 0004 kept a teacher's one-to-one guidance always free. A teacher may now offer sessions under the TEACHER plan, and a family pays per seat for them as for an expert's. The rule that a teacher's guidance is for their own school's pupils and that the school switches it on is unchanged.

## How it is built (first half, 16 October 2026)

- **A person is entitled to a feature while an unrevoked `Entitlement` row covers now.** A row names one feature, a window (`validFrom` ≤ now < `validTo`), where it came from (`ORDER` a paid pass, `GRANT` the operator's grant, `SEAT` one paid seat), the plan it came from, and, for an order or a seat, the payment order behind it.
- **Who needs a plan is one table**, by the role on the session (`PLAN_TABLE` in `person-plans.ts`): a STUDENT needs the STUDENT plan for practice and the assistant; a TEACHER the TEACHER plan for the gig, offering sessions, reading the job board and the assistant; an EXPERT the EXPERT plan for offering time. Every other role needs none. A guardian needs none of their own, but reads a child's practice only while the child holds the plan.
- **A plan is asked for only while the operator has made it active.** The three plan rows start inactive at no price, so that the migration locks nobody out; an inactive plan's features follow the platform switch alone. (The owner's model said "active"; reading it as "asked for" is the builder's, to be confirmed.)
- **What a person without the plan meets:** the page shows the plan card (its name, what it includes, the monthly and yearly price, Subscribe); a door answers `402` with code `PLAN_REQUIRED` and the plan; the menu keeps the entry so the card can be reached.
- **What a lapsed plan keeps open:** an expert's earnings, invoices, payout details and the sessions already booked with them; a provider marking or cancelling what they already offered; a teacher's payee details while they are owed for questions.
- **No payment yet.** Subscribe leads to a page that says payment opens soon and that the office or the operator can switch a plan on. The operator grants a plan for 1, 3, 6 or 12 months from `/root/features`, and can revoke any entitlement; both are audited.
- **When a window ends** the `plans:expire` job (04:20 daily) writes one audit line and tells the person in the app, once.

## The second half (not built)

Razorpay passes and seats: an order for a plan's month or year writes `ORDER` entitlements with the order's id when the payment is confirmed; a paid seat writes a `SEAT` row. Both go through the same `Entitlement` table and the same seam, so no gated page or door changes.

<!-- seats (17 Oct 2026) -->
## Seats, built (17 October 2026)

The two amendments to 0004 are now in the code (`apps/web/src/lib/gig-sessions.ts`, `gig-payments.ts`, `meeting-links.ts`; `tests/seats.test.ts`):

- **Pricing.** A one-to-one may carry a price within the operator's band (`GigSettings.seatPriceMinPaise`/`seatPriceMaxPaise`), like a workshop seat. An expert prices any time through 0004's paid gate (KYC, an active Route account, an open free one-to-one, the period's free one-to-ones given); a teacher prices guidance through the same slot code once paid seats are on and they have saved a UPI id for the company to pay them (`teacherPaidGate`). The school's guidance switch, the TEACHER or EXPERT plan and the platform switch stand above both, as before.
- **The free allowances apply to times priced 0 alone.** A pupil's two free one-to-ones and two workshop seats are spent only on free times; a priced time is always bought, whatever is left. An expert's starting block and standing quota, and a teacher's asked-for guidance, count free times delivered.
- **Who buys.** A guardian for a pupil under eighteen; a pupil of eighteen or more (a college student) for themselves; a pupil under eighteen sees "Ask your parent" and never a Pay button, and the ask waits for a guardian's consent and payment. No card details touch the platform (policy 0002): the gateway's own page takes them.
- **The money.** An expert's seat goes through `openCheckout` and the Route hold as 0004's third amendment says. A teacher has no linked account at the gateway, so a teacher's seat is a plain order on the company's account and takes the company-collects path of 0004's second amendment (HELD, then DUE into the teacher's open payout after the hold, paid by the operator to the teacher's UPI id with the GST tax invoice for the commission). **This is the company holding a teacher's share between capture and payout, the activity 0004's third amendment moved experts off for the RBI's payment-aggregator rules; counsel should confirm it before teacher seats are sold.** Commission and GST are `GigSettings`' as for any seat.
- **The meeting link** is a Google Meet, Zoom, Microsoft Teams or Jitsi room on https, checked by host on every slot (an alumnus mentor's too). It is shown to the provider always, and to a seat holder only once the seat is confirmed and, when priced, paid; never in the list of open times and never to the office. `GET /api/v1/gigs/sessions/{bookingId}/join` is the door; the job `sessions:remind` (every five minutes, `2-57/5 * * * *`) tells the family and the provider in the app, thirty minutes before the start, with a link to the join page.
<!-- end seats -->

<!-- plans-pay (17 Oct 2026) -->
## Passes, built (17 October 2026)

**The collection rule.** A pass is the company's own revenue, and the company collects it directly into its own gateway account: a plain order with no transfer, no Route and no split, so nobody else's money is ever held. Decision 0003 is untouched; a school's fees never come near it.

How it is built (`apps/web/src/lib/pass-orders.ts`; `tests/passes.test.ts`):

- **What is sold.** A month or a year of one plan. The plan's price (`PersonPlan`) is the taxable value; GST at the company's rate (`GigSettings.gstPercent`) is added on top, and the gateway charges the total. Both figures are frozen on the `PassOrder` row when the order is made. A period priced under ₹1 is not offered.
- **When a pass is on sale.** The plan is asked for (active), it is priced, the company's gateway is configured (the paid seats' transport, key and devbox), and the company's invoice details (legal name, GSTIN, state code) are complete, since a tax invoice cannot be issued without them. The paid-seats kill switch (`paymentsEnabled`, gated on Route) does not govern passes, which need no Route; an inactive plan is the switch for its passes.
- **Who pays.** A college student, a teacher and an expert buy their own plan, on a session of that role. A guardian buys the STUDENT plan for a child under eighteen, picked from their own children; a child who is eighteen or over buys their own. A pupil under eighteen never sees Pay: they ask, and each guardian is told in the app (once a day at most). No card or UPI detail touches the platform (policy 0002): the gateway's own page takes it, opened in the seat flow's checkout panel on the web; the phone opens the web's Plans page in the system browser.
- **One door for a capture** (`markPassPaid`): the checkout's signed confirm, the platform webhook `POST /api/webhooks/razorpay/platform` (the company's webhook secret; events stored once under the provider `RAZORPAY_PASS`) and the devbox page. It marks the order PAID, writes one `ORDER` entitlement per feature through `person-plans.ts` `grantPassFromOrder` (still the one writer of `Entitlement`), and issues the invoice, in one transaction. A renewal extends from the current end of the person's window, not from today. There is no auto-renewal and no mandate; the `pass:expiring` job (05:10 daily) tells the person in the app seven days and one day before a plan ends.
- **The invoice.** One GST tax invoice per paid pass (`PassInvoice`, the `GigInvoice` shape), the company as seller (the payouts' seller block), the payer as buyer, numbered in its own financial-year series `<prefix>-PASS/2026-27/0001` under the `GigSettings` row lock. While the buyer's address is not on record the place of supply is taken as the company's own state (CGST + SGST). **The accountant should confirm** this place-of-supply reading, the SAC the invoice prints (`GigSettings.invoiceSacCode`, chosen for commissions) and whether a pass sold to a consumer needs anything more on the invoice.
- **Refunds.** The operator's alone (`/root/features`, `POST /api/v1/operator/pass-orders/{id}/refund`): the whole total, within seven days of payment, revoking the entitlements the pass opened; audited, and the payer and the holder told. A refund the gateway reports failed puts the pass back.
- **Not built:** proration or a partial refund; a refund after seven days (a grant from the operator is the remedy); an office-side purchase for a whole class; moving pass orders and entitlements on an account merge.
<!-- end plans-pay -->

<!-- invoice-number (14 Nov 2026) -->
## Amendment: the invoice number's shape (14 November 2026)

**What the owner decided.** The testing analysis of 13 November 2026 found (TA-525) that every pass invoice number above was at least nineteen characters long (`SG-PASS/2026-27/0001` is twenty), and that a commission invoice number of 0004's series passed sixteen from a four-letter prefix, while rule 46(b) of the CGST Rules, 2017 asks for a consecutive serial number of not more than sixteen characters (the rule as the analysis quoted it from memory; it was not opened). On 14 November 2026 the owner chose option 1, the recommendation put to them, without asking for alternatives: both invoice series are shortened to fit sixteen characters, a prefix that would not fit is refused when the operator saves it, and the two numberers refuse to issue a number that does not fit.

How it is built (`apps/web/src/lib/gig-payments.ts` `invoiceSeriesOf` and `invoiceNumberOf`, `apps/web/src/lib/pass-orders.ts`; `tests/ta-decision-525-invoice-numbers.test.ts`):

- **The shape.** `<prefix of one or two letters><series letter>/<the financial year as 26-27>/<six-digit serial>`: `SGP/26-27/000001` for a pass, `SGC/26-27/000001` for the commission on an expert's or a teacher's payout. It replaces `<prefix>-PASS/2026-27/0001` above and 0004's `<prefix>/<FY>/<0001>`. The family's seat receipt is numbered by the same code (`nextInSeries`), so it takes the same shape with `R` (`SGR/26-27/000001`, where it was `SG-R/2026-27/0001`, seventeen characters); that letter is the builder's reading, the decision naming only the two invoice series.
- **The prefix.** `GigSettings.invoicePrefix` is one or two capital letters; anything else (a third letter, a digit, a hyphen) is refused when the operator saves it, on `/root/gigs` and through `POST /api/v1/operator/gigs/company`, with `gigs.refuseInvoicePrefixFit`. The default `SG` already fits.
- **The guard.** `nextPassNumber` and `nextInSeries` refuse to issue a number over sixteen characters or holding anything but letters, digits, hyphen and slash (`InvoiceNumberRefused`), so the transaction that would have written it is rolled back whole and no number is taken: a prefix saved before this rule, or a serial past 999,999 in one financial year. Recording a payout then answers `gigs.refuseInvoiceNumber` by name; the release job leaves the released seats waiting, as it does while the company's details are missing; a pass or seat capture is not settled, and the gateway's retry settles it once a prefix that fits is saved.
- **The six-digit serial is the assistant's own choice**, inferred and not chosen by the owner: it keeps a number at sixteen characters with a two-letter prefix up to 999,999 invoices a year.
- **The accountant confirms the shape before the first live invoice**, with the questions above and in 0004. No live invoice has been issued, so nothing is renumbered; a number already stored in the old shape (a development database, the ZZ fixtures' own `ZZ-PASS` series) is left as it is, since an issued number is never changed.
<!-- end invoice-number -->
