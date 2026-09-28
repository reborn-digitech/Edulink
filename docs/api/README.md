# The API for the phone

`/api/v1` is the app's door into the same library the web app uses. The
generated reference is [openapi.json](openapi.json); this page is the shape.

## Conventions

- **JSON in, JSON out.** Bodies are validated with the zod schemas in
  `packages/contracts` (`src/v1/*.ts`); responses are typed from the same
  package, so the app parses what the server wrote.
- **Versioned in the path.** A breaking change is `/api/v2/...`, never a
  changed `/v1`.
- **One error envelope**, `{ error, code?, issues?, retryAfterSeconds? }`.
  `error` is a sentence in the caller's language; `code` is one of
  `BAD_REQUEST UNAUTHORIZED FORBIDDEN NOT_FOUND CONFLICT RATE_LIMITED SERVER`;
  `issues` names fields on a 422. Another school's id is a **404**, never a
  hint that it exists.
- **Thin handlers.** Each route parses, calls the `src/lib` function the page
  or its server action calls, and answers. Tenancy, row-level security, duty
  and quiet-hours rules stay in the library, where the suites prove them.
- **The catalog is the truth.** `apps/web/src/lib/api-catalog/*.ts` lists
  every endpoint with its access and schemas; the OpenAPI document, the API
  sweep and a test all read it. An unlisted handler fails the test.

## Sessions

A bearer token is the same `Session` row a browser gets as a cookie.

| Step | Endpoint |
| --- | --- |
| Password | `POST /api/v1/auth/login` `{ identifier, password, device? }` |
| Magic link | `POST /api/v1/auth/magic-link` `{ email }`, then `POST /api/v1/auth/magic-link/consume` `{ token }` |
| Pupil's first sign-in | `POST /api/v1/auth/first-signin` `{ handle, code, password }` |
| SSO | make a PKCE verifier (43 to 128 unreserved characters) and keep it; open `/api/sso/{provider}/start?client=app&challenge=<base64url SHA-256 of the verifier>` in the system browser (400 without a challenge); the callback redirects to `edulink://sso?code=…`; `POST /api/v1/auth/sso/exchange` `{ code, verifier }` within two minutes. A code sent with the wrong verifier is refused and spent |
| Who am I | `GET /api/v1/me` |
| Switch school/role | `POST /api/v1/me/context` |
| Devices | `GET /api/v1/me/sessions`, `DELETE /api/v1/me/sessions/{id}` |
| Sign out | `POST /api/v1/auth/logout` |

Every sign-in answers `{ token, expiresAt, sessionId, context }`. Send
`Authorization: Bearer <token>`. A session used at least once in fifteen days
never expires (sliding expiry); `expiresAt` tells the app when to expect a
401 otherwise. A 401 means sign in again; a 403 means this role may not.

## Push and live updates

- `POST /api/v1/me/devices` `{ expoPushToken, platform, device? }` registers
  the phone; `DELETE` with the token removes it. `notify()` sends through Expo
  beside Web Push, with the person's quiet hours and preferences applied
  once. The payload's `data.url` is the in-app destination.
- `GET /api/v1/events` is server-sent events for the session: `ready`, then
  the realtime bus's events (`attendance.updated`, `conversation.message`,
  `notification`, …). Open on foreground, close on background, rely on push
  meanwhile.

## Uploads and files

`POST /api/v1/uploads` (multipart, one `file`) stores through the same path
the web uses — type sniffed, size capped, EXIF stripped — and answers
`{ fileId }`. Read files through `/api/files/{fileId}` (`?w=320|640|1280` for
a sized image copy); it accepts the bearer session.

## Testing an endpoint

Contract tests invoke the handler directly with a primed session
(`tests/api-v1-*.test.ts`), covering the happy path, 401, 403, 404 for a
foreign id, and 422. The API sweep (`npm run api:sweep`) walks the catalog as
every role against a running server. Both run in CI.
