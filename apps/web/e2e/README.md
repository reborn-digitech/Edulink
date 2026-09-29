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

The pupil and the guardian are zz.pupil01 and that pupil's own parent, by name.

```bash
npx playwright test                    # both
npx playwright test e2e/axe.spec.ts    # one
npx playwright test --update-snapshots # write baselines for this platform
```

Baselines live under `e2e/__screenshots__/<platform>/`. CI is Linux, laptops are
macOS, and fonts differ between them, so each platform keeps its own set; the
workflow's `update_snapshots` input writes a fresh Linux set as an artifact.
