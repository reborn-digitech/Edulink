# Go-live checklist

> Superseded on 2 October 2026 by `docs/runbooks/go-live.md`, which is step by step, names who does each step and how to verify it, and corrects two things below: the first school is onboarded by the operator through `/root/onboard`, not `/register`, and Cloudflare must not sit in front of Fly (the rate limiter trusts `Fly-Client-IP`, which would be Cloudflare's address). Kept for the record.

Tick each line with the date and who did it. Nothing here is optional.

## Infrastructure
- [ ] Managed Postgres created; point-in-time recovery enabled; `edulink_app` role created without BYPASSRLS or ownership
- [ ] Object storage bucket for uploads, with replication to a second bucket
- [ ] Secrets set from `docs/runbooks/deploy.md`; `APP_COMMIT` wired into the build
- [ ] DNS at Cloudflare, TLS full-strict, the origin reachable only through it
- [ ] Staging environment up on the same image with the ZZ fixture only

## Proven, not assumed
- [ ] `npm run email:test -- <you>` — the message arrived
- [ ] `npm run sms:test -- <your number>` — the text arrived
- [ ] `npm run push:test` — a real device received it
- [ ] `npm run sso:check` clean, and one real sign-in per configured provider
- [ ] `/api/health` 200 from outside; uptime checks on `/`, `/login` and `/api/health`
- [ ] `npm run cron:install` (or the scheduled machines) and `/root/jobs` green for a full day; the health digest email arrived
- [ ] Restore drill on staging recorded in `backup-restore.md`; rollback rehearsed and timed
- [ ] Load run from a second machine with the k6 scripts; p95s recorded against the machine count chosen

## Data hygiene
- [ ] The operator account minted through `npm run superuser -- <email>` on production
- [ ] The eight shared-password test accounts scrambled (`Sarathi-Kestrel-2026` is not a production password)
- [ ] The ZZ fixture absent from production (`npm run zz:fixtures -- --teardown` was never needed because it was never created there)
- [ ] The dev seed (Riverside, Oakfield) absent from production

## First school
- [ ] Onboarded through the real wizard at `/register`, not by script
- [ ] Their admin signed in, changed the password, invited one teacher, one teacher marked one register, one guardian saw it
