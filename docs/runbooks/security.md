# Security pass — Phase 1

What was read, what was changed, what is accepted as it stands.

## Headers (`next.config.ts`)

Content-Security-Policy on every response: `default-src 'self'`; scripts,
styles, images (`data:` and `blob:` for uploads and the lightbox), media,
fonts, fetches, workers and the manifest all from this origin only;
`frame-ancestors 'none'`; `form-action 'self'`; `base-uri 'self'`;
`object-src 'none'`. The app serves every asset itself, so the allow-list is
one word. Since 2026-09-29 a page's scripts run by nonce: the middleware mints
one per response (`src/lib/csp.ts`, `src/middleware.ts`), Next puts it on every
script it writes and the layout on the theme script, and the policy carries
`'nonce-…' 'strict-dynamic'` with no `'unsafe-inline'`. Everything that is not a
page gets the policy with no nonce, in which no inline script runs. Styles keep
`'unsafe-inline'`. HSTS two years with subdomains in production; `HSTS_PRELOAD=1`
adds `preload`, which is the operator's to set once the domain is fixed, since
browsers keep that promise for months after it is withdrawn.
`X-Frame-Options`, `nosniff`, referrer and permissions policies were already
there. Verified on the standalone production server and in the browser with
no violation on the admin, bulletin, attendance, practice and timetable pages.

## Cookies (`session.ts`)

`httpOnly`, `secure` in production, `SameSite=Lax` (strict would break a
magic-link landing). In production the session cookie is named
`__Host-edulink_session`: a browser takes that prefix only over HTTPS, with
`Path=/` and no `Domain`, so no other host under the domain can set it or be
sent it. Development keeps `edulink_session`. A deployment that changes to this
build signs everybody out once, because the old name is not read. The locale
cookie is not httpOnly by design: it carries no authority.

## Rate limits (`rate-limit.ts`)

Already at production thresholds, per bucket in the database so a fleet
shares one counter: login 10 per 15 min, reset and phone-verify and
email-change 3 per 15 min, claim 10 per 15 min and 20 per code per hour,
sign-ups 20 per hour, invite accepts 10 per hour, code lookups 120 per 15 min.
Cloudflare's own limits sit in front of these.

## `dangerouslySetInnerHTML`

One use, `theme-script.tsx`: a constant string with no interpolation. Accepted.

## File serving (`/api/files/[fileId]`)

Authorised per record through the tenant context; served with its own
`Content-Security-Policy: default-src 'none'; sandbox`, `nosniff`, and a
Content-Type from the sniffed magic bytes, not the upload's claim. Read, unchanged.

## Uploads

Photos have EXIF, XMP and PNG text chunks stripped. **Video passes through
unstripped** (`image-metadata.ts`): a phone MP4 can carry GPS in its
`moov/udta` atoms. Accepted for Phase 1 with the UI already saying videos are
shared as recorded; the atom-level strip with tests is a Phase 2 item.

## Dependencies

`pnpm audit --prod --audit-level high` in CI. `postcss` is overridden to a
patched release (Next pins an old one it uses only at build time). One
advisory is ignored by id: `deepmerge-ts` under `@prisma/config`, a CLI-only
dependency that never sees user input and that Prisma pins exactly.

## Not yet

- Nonce-based CSP (drops `'unsafe-inline'` for scripts).
- Sentry or equivalent, once an account exists.
- A penetration test by someone who did not write the code.
