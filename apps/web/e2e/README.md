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

- `signatures.spec.ts` — a signature signed in the box and kept, a paper that waits opened
  and signed by the head, and no way offered to sign a line that is somebody else's.
- `report-card-rules.spec.ts` — the rules' four sections: the scale drawn as it is typed,
  the totals of the weights, the areas as a list, the sample card following the form, and
  one save that writes the terms' shares with the rest. ZZ Northgate's rules are put back.

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
