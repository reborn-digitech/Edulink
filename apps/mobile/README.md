# @edulink/mobile

The React Native (Expo) app. This directory is reserved in Phase 0 so the
workspace, the shared packages and the CI layout are settled before a single
screen exists; `create-expo-app` runs here in Phase 4, after the `/api/v1`
surface (Phase 3) it will talk to is real.

What it will depend on, all already in the workspace:

- `@edulink/i18n` — the language list today, the dictionaries after Phase 2
- `@edulink/contracts` — zod schemas for every `/api/v1` request and response
- `@edulink/api-client` — the bearer-token fetch wrapper

See `docs/decisions/0001-mobile-monorepo-and-production.md` for the decisions
this layout follows and `docs/mobile-and-production-plan` for the phases.
