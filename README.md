# Shalaghar

One workspace, three kinds of thing:

| Path | What it is |
| --- | --- |
| `apps/web` | The Next.js app — the whole product as it runs today. Its own [README](apps/web/README.md) is the operator's manual. |
| `apps/mobile` | The React Native (Expo) app. Reserved in Phase 0, built in Phase 4. |
| `packages/i18n` | The language list today; the en/hi/mr dictionaries after Phase 2. |
| `packages/contracts` | zod schemas for every `/api/v1` request and response. |
| `packages/api-client` | The bearer-token fetch wrapper the phone uses. |
| `docs/decisions` | Why the layout is what it is. Start with [0001](docs/decisions/0001-mobile-monorepo-and-production.md). |

```bash
corepack enable          # once: gives you the pinned pnpm
pnpm install             # every package, one lockfile
cd apps/web && cp .env.example .env && npm run vapid && npm run setup
pnpm dev                 # the web app on :3000 (this machine only), from anywhere in the repo
pnpm dev:network         # the same, open to the network for a phone; /dev/mailbox then asks for the operator
pnpm battery             # tsc x2, eslint, vitest, rls, quiz, i18n, sweep, then the packages' tests
```

Every `npm run …` command the web README names still works, run from `apps/web`.
The database, `.env`, uploads (`storage/`) and the Prisma schema all live there too.
