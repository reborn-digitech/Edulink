# Release checklist

Written on 5 October 2026 (risks batch, R-15 in `docs/audit-2026-10-05/08-remaining-risks.md`). It is the list
to tick before a release is called ready, after the code is in: the runs a builder or the coordinator does on
the development machine, then the device pass that needs people and devices and that no builder can do. The
production go-live steps are in [docs/runbooks/go-live.md](runbooks/go-live.md) and the phone's store release in
[docs/runbooks/mobile-release.md](runbooks/mobile-release.md); this list comes before both.

Tick each line with the date, who did it and the number it gave. A line that was not run says so; it is never
ticked on a neighbouring line's result.

## 1. The runs (the coordinator, on the development machine)

Keep `:3000` and `:8081` up between steps and check `/api/health` before and after each sweep or probe
(`uptimeSeconds` is the server process's age since 5 October 2026, so a drop means a real restart).

- [ ] `npm run sweep` twice against the running dev server: the first run warms it (the sweep also warms the
      cheap pages itself before it counts, `scripts/sweep-warm.ts`), the second is the count. "got 0" means the
      server is down.
- [ ] `npm run api:sweep` twice (warm-up, then count), then `--cross=school` and `--cross=person`. Only when
      the owner has asked for it in the session (13 to 22 minutes a pass). Its sessions last two hours and are
      renewed while it runs; a stopped run deletes them on the signal.
- [ ] `npm run build` with the dev server stopped, then `rm -rf .next`, then the dev server restarted.
- [ ] The axe gate on the pages added since the last walk (`apps/web/e2e`, the viewport matrix at 390 px).
- [ ] `npm run data:audit`: 0 FAIL (the report is `docs/data-audit/latest.md`).
- [ ] `corepack pnpm audit` from the repository root: the count recorded here and in
      `docs/audit-2026-10-05/08-remaining-risks.md` (R-17), the two policy ignores and the `package.json`
      overrides kept. `decode-uri-component` sits in the phone's bundle but on no deep-link path.
      Last run 5 October 2026 (risks batch): 7 vulnerabilities, 4 moderate and 3 high (2 ignored by policy): braces
      (build and lint), uuid (prebuild), vitest and @vitest/mocker (tests), decode-uri-component (phone bundle,
      not on a deep-link path); none reaches the web runtime.
- [ ] The Linux e2e baselines through a CI dispatch with `update_snapshots=true`, once GitHub Actions is no
      longer refused on billing (R-16, the owner's).

## 2. The device pass (the owner, with people and devices)

None of these has been done by a builder; each needs a real device, a real inbox or a real person in a role.

- [ ] **A real phone.** The release build (or an EAS preview build) installed on one Android and one iPhone,
      signed in as a teacher, a guardian, a college student and a college faculty member; the register taken
      offline and delivered when the network returns; the notification rows open what they name.
- [ ] **Mail and push on a device.** `npm run email:test -- <address>` arrives in a real inbox (and a Hindi
      and a Marathi account's mail reads right); `npm run push:test` reaches the phone above with the app in
      the background and closed; a real notification from the app (a published result, a leave decision)
      arrives as a push.
- [ ] **The phone's empty states at a fresh college.** A college onboarded through `/root/onboard` with no
      rows yet: every role's home, the registers, the exam cell, placement, IQAC and accounts screens on the
      phone say what is missing and where it is made, with no blank screen, spinner that never ends or "Try
      again" that cannot help.
- [ ] **The NBA SAR sign-off with a real HOD.** A department's SAR drafted, three criteria written by the HOD
      in their own words, signed off, the worksheet then read-only; the figures checked by the HOD against the
      department's own records.
- [ ] **Lab-batch marking.** A faculty member with two lab batches marks a LAB hour for one batch on the
      phone and on the web; only that batch's students are on the register; a re-split of the batches takes
      effect from the day the office is told.

## 3. Before a store release only

- [ ] Hindi and Marathi read by native speakers on the web and the phone (R-14); the reviewers' names here.
- [ ] Counsel's answer on `CONSENT_AGE = 13` as a gate (G4-34) and the consent sentence at apply (G4-4).
