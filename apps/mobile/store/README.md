# Store submission copy

What the App Store and Google Play listings say, in the three languages the app speaks, and the answers to both stores' privacy forms. Everything here derives from [`docs/decisions/0002-minors-data-policy.md`](../../../docs/decisions/0002-minors-data-policy.md); when the code changes what the app holds or asks for, that policy changes first and these files follow.

| File | What it is |
|---|---|
| `listing.en.md` | The English listing: name, subtitle, short and full descriptions, keywords, category, age-rating notes, contacts, release notes, screenshot captions |
| `listing.hi.md` | The same in Hindi — written for a parent in Maharashtra or Gujarat, not translated from the English |
| `listing.mr.md` | The same in Marathi |
| `privacy-answers.md` | Apple App Privacy ("nutrition label") answers, Google Play Data safety answers, the Families / target-audience declarations, and the content-rating (IARC and Apple) questionnaire, each answer pointing at a row of the policy |

## Limits the copy is written to

| Field | Store | Limit | Where checked |
|---|---|---|---|
| Subtitle | App Store | 30 characters | the `Subtitle` line of each listing |
| Short description | Google Play | 80 characters | the `Short description` line |
| Full description | both | 4,000 characters | the `Full description` block |
| Keywords | App Store | 100 characters, comma-separated | the `Keywords` line |
| Release notes | both | 4,000 (Apple) / 500 (Play) characters | the `Release notes` block |
| Screenshot captions | both | no store limit; kept to one line | the numbered list |

Counts are Unicode code points, which is what both consoles count for Devanagari (a conjunct such as स्क is three code points). Re-check with `python3 -c 'import sys; print(len(sys.stdin.read().strip()))'` before pasting.

## Placeholders the founder fills

Written in ALL CAPS so a search finds them: `SUPPORT_EMAIL`, `PRIVACY_URL`, `ACCOUNT_DELETION_URL`, `REVIEWER_LOGIN`, `REVIEWER_PASSWORD`, `MARKETING_URL` (optional). The two URLs are pages the web app serves signed out: `PRIVACY_URL` is `<NEXT_PUBLIC_APP_URL>/privacy` and `ACCOUNT_DELETION_URL` is `<NEXT_PUBLIC_APP_URL>/delete-account`; `SUPPORT_EMAIL` is the same address the web app reads from its `SUPPORT_EMAIL` variable. The Apple `ascAppId` / `appleTeamId` and the Play service-account path live in `apps/mobile/eas.json`, not here.

## Screenshots

Six screens per language, portrait, taken on a device or simulator (this machine has neither — the Playwright screenshots in `apps/mobile/e2e/screens/` are the web target at phone size and are review aids, not store assets). The captions are in each listing, in this order: **Today**, **the register**, **marks**, **the guardian's overview**, **the pupil's practice**, **messages**. Use the ZZ fixture school so no real child appears in a store image.

## Honesty notes

- The Hindi and Marathi copy was written by the same hand as the app's dictionaries and has not been read by a native speaker (see the header of `packages/i18n/src/hi.ts`). Have one read it before it is pasted into a console.
- The listings promise nothing the code does not do: no photo upload from the phone, no app lock, no camera — those permissions are in `app.json` ahead of the features (policy Gap 1) and the listing does not mention them.
- Both stores require a working sign-in for review because nobody can create an account in the app. Provide `REVIEWER_LOGIN` / `REVIEWER_PASSWORD` on a demo school in the review notes (Apple Guideline 2.1; Play "App access").
