# End-to-end matrix

Two suites, both against a running server (`BASE`, default `http://localhost:3000`),
signed in as each role through sessions minted in the database by `global-setup.ts`
on the ZZ fixture (`npm run zz:fixtures` first).

- `axe.spec.ts` — every navigation entry per role, phone width, light and dark:
  zero serious or critical axe-core violations.
- `viewport.spec.ts` — the register, the marks sheet, the timetable grid and a
  toolbar page at 360×800, 390×844, 412×915 and 768×1024, light and dark,
  English and Hindi: no horizontal overflow, every interactive element at least
  44 px tall, and a screenshot against the platform's baseline.

- `record.spec.ts` — the pupil record where the navigation sweep cannot reach: the
  family's form once "Ask for a change" is pressed, the office's page for one pupil
  with a family's ask waiting and its decline box open, the pupil's page with the
  office's door to the record, and the guardian's record page at the four sizes. It
  presses what opens a form and never what sends one. Its pictures are compared only
  where this platform has a baseline (`screenshotWhereBaselined` in `checks.ts`).

- `template-editor.spec.ts` — the certificate template editor at a desk and at phone
  width: a detail chosen from the list and shown as a chip, a row made by choosing what
  it prints, a detail inserted at the caret of its own paragraph, a code the certificate
  cannot fill stopping the save, and one template saved, read back from the database
  and removed ("ZZ e2e template …", ZZ Northgate's).

- `first-paint.spec.ts` — /login, /register and /parent opened with JavaScript off: the
  heading, the sentence under it and the form are in the server's shell and painted (no
  `hidden`, no opacity 0, no streamed segment), so nothing waits for hydration (LOAD-12).
- `signatures.spec.ts` — a signature signed in the box and kept, a paper that waits opened
  and signed by the head, and no way offered to sign a line that is somebody else's.
- `report-card-rules.spec.ts` — the rules' four sections: the scale drawn as it is typed,
  the totals of the weights, the areas as a list, the sample card following the form, and
  one save that writes the terms' shares with the rest. ZZ Northgate's rules are put back.

## The flows: one browser write per role

Seven specs, `flow-*.spec.ts`, each driving one role's primary write through the page at
phone width (390×844, light) and then taking the three measurements `checks.ts` makes on the
page after the write — no sideways scroll, no target under 44 px, no serious axe violation —
once the toast the write raised has gone (`sound` in `flow-helpers.ts`). Every spec makes
what it writes to in its own `beforeAll` through Prisma on the admin connection, ZZ-named
and scoped to ZZ Northgate's id, and deletes exactly those rows in `afterAll`; a fixture
row is never the thing written. The fixtures are still rebuilt (`npm run zz:fixtures`)
after a write-heavy run, because a receipt moves the year's counter on by one and an
admission, a leave and a cover leave audit rows behind.

- `flow-register.spec.ts` — a ZZ class of the e2e teacher's grade with three of the
  fixture's pupils enrolled beside their own class; two marked absent and one late (three
  taps, one debounced POST), the marks kept across a reload and read from
  `AttendanceSession`/`AttendanceRecord` for today; one marked present again is the same
  session, the same three rows, one changed.
- `flow-gradebook.spec.ts` — the same shape of class and a ZZ unit test of that grade with a
  paper out of 50; two pupils' marks saved and kept (the sitting's `Grade` rows in
  thousandths); a mark of 60 never leaves the page — the box's `max` fails the form's own
  validity and the first marks stand.
- `flow-office-payment.spec.ts` — a ZZ head, a published ZZ structure with one ₹2,500
  instalment and a plan for a fixture pupil on no plan this year; cash taken at the counter,
  the PAID row in the ledger with its allocation to the one due, the due settled, and the
  receipt page printing the amount and a serial of the year's series.
- `flow-upi-claim.spec.ts` — ZZ Northgate given a UPI id for the run (put back after) and
  the e2e pupil a fresh ZZ due; the guardian picks that due alone, claims it with a UTR, the
  office confirms it from the claims queue, the guardian's page shows it paid with the
  receipt; a second confirm from an office tab that still shows the claim is refused with
  "That payment is not waiting to be confirmed." and the ledger is unchanged.
- `flow-intake.spec.ts` — three ZZ rows pasted (name, date of birth, the e2e teacher's class,
  an @zz.test address each); the preview says three, the admit writes three with student
  codes and enrolments, the people list finds them by the stamp in their names. The three
  users go in `afterAll`, memberships and stand-in guardianships with them.
- `flow-leave-cover.spec.ts` — the e2e teacher applies for the next open school day on which
  they have lessons, nominating the first fixture ZZ teacher who is free for one of those
  periods (the board refuses a clash, and the fixture's four class teachers fill each other's
  days); the head approves with that cover (the `AttendanceCover` rows under the leave's id)
  and names the same teacher for a lesson on the substitution board for that day (the
  `Substitution` row); the cover, signed in with a session minted by the spec, sees "You are
  covering this attendance" on the register for that day and the lesson in
  `/api/v1/staff/substitutions/me?date=`. The Today card lists covers for the day itself
  only, so a future day is read through the register and the feed.
- `flow-parent-checkout.spec.ts` — ZZ Northgate given a sealed test gateway account and a
  UPI id for the run when it has none (both put back); the guardian starts an online checkout
  on a fresh ZZ due, the panel shows the devbox order waiting and names `/dev/payments`,
  where the operator marks it paid through the same settle door the webhook uses; the
  guardian's panel, polling, turns to "Paid. Receipt …", the due is settled; then the other
  ZZ due is claimed by UPI with a UTR and left waiting for the office. The devbox CAN finish
  a payment in a browser, so the flow is asserted to the receipt.

Hooks the flows use (`data-testid`, added to the pages without changing what they do):
`register-row[data-membership-id][data-status]`, `register-mark-{STATUS}`, `register-sync`;
`marks-save`, `marks-saved`, `marks-error`; `fee-take-form/-amount/-method/-reference/-go/-error`,
`fee-payment-row[data-payment-id][data-status]`, `fee-payment-receipt`; `fees-pay-demand[data-demand-id]`,
`fees-pay-online`, `fees-pay-upi`, `fees-upi-utr`, `fees-upi-claim`, `fees-upi-claimed`,
`fees-online-devbox[data-payment-id]`, `fees-online-paid`, `fees-demand[data-demand-id][data-status]`,
`fees-payment[data-payment-id][data-status]`; `claim-row[data-payment-id]`, `claim-confirm`;
`dev-payment[data-order-id][data-payment-id]`, `dev-payment-paid`; `intake-admit`; `leave-open`,
`leave-form`, `leave-from`, `leave-to`, `leave-reason`, `leave-nominee`, `leave-send`,
`leave-request[data-leave-id][data-status]`, `leave-decide[data-leave-id]`, `leave-cover`,
`leave-approve`; `substitution-row[data-slot-id]`, `substitution-choose` (options carry
`data-free`), `substitution-assign`.

Two things the flows found on their first run and the pages were put right for: the
intake's result table sat in a scrollable region with no keyboard access (`tabIndex={0}`
on its wrapper, as the other tables have), and the substitution board's covered row could not
shrink at phone width (95 px of sideways scroll from a `shrink-0` on its badges and buttons;
removed, and the controls wrap under the lesson). Two more the flows found in the shell and
the integration put right the same day: the toast's own "Dismiss notification" button was
28 px and the data toolbar's "Clear search" button, drawn only once a query is typed, was
32 px; both are 44 px now, and the people list is measured with the clear button showing.
The three lines are still taken once a toast has gone, so a page is measured at rest.

The suite runs ONE FILE AT A TIME (`workers: 1`): two of the files set their actor's
language to Hindi, and a file beside them signed in as the same actor failed on an English
word. Restart the dev server after the last edit and before a full run.

A picture of an element taller than the window is taken with everything pinned to the
window hidden (`hidePinned` in `checks.ts`); never run two Playwright runs at once.

The pupil and the guardian are zz.pupil01 and that pupil's own parent, by name.

```bash
npx playwright test                    # both
npx playwright test e2e/axe.spec.ts    # one
npx playwright test --update-snapshots # write baselines for this platform
```

Baselines live under `e2e/__screenshots__/<platform>/`. CI is Linux, laptops are
macOS, and fonts differ between them, so each platform keeps its own set; the
workflow's `update_snapshots` input writes a fresh Linux set as an artifact.
