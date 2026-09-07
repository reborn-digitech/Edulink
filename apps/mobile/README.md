# @edulink/mobile

The EduLink phone app: Expo SDK 57, expo-router, React Query, the same
dictionaries (`@edulink/i18n`), tokens (`@edulink/tokens`) and API contracts
(`@edulink/contracts`, `@edulink/api-client`) as the web. It talks only to
`/api/v1` (`docs/api/README.md`).

```bash
pnpm --filter @edulink/mobile start          # Expo dev server; press w for the web target
EXPO_PUBLIC_API_URL=http://localhost:3000    # where the API is (default)
pnpm --filter @edulink/mobile battery        # tsc, eslint (expo + a11y), jest
EDULINK_API_BASE=http://localhost:3000 EDULINK_TOKEN_TEACHER=… pnpm --filter @edulink/mobile test:contract
```

What runs where:

- **Phone** (Expo Go for anything without a native module; a development
  build via `npx expo run:ios|android` or EAS for secure storage, SQLite,
  push and biometrics) — the product.
- **Web target** (`expo start --web`) — a development convenience for walking
  screens in a browser; the session token then lives in localStorage and the
  outbox in memory. Not a deployment.
- **Jest** (`jest-expo` + React Native Testing Library) — every lib module and
  every screen's empty, loading, error and populated states, with native
  modules faked in `test/setup.ts`.
- **Contract tests** (`test/contract/`) — the API client against a running
  server, with bearer tokens minted on the ZZ fixture by the web's
  `npm run zz:token -- TEACHER`; CI runs them in the sweep job.

Layout: `src/app` (routes), `src/lib` (session, api, i18n, theme, outbox,
links), `src/components` (the shared set: Screen, Text, Button, Card, states).
