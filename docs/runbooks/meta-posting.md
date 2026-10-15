# A school's Facebook Page and Instagram account

What the platform's owner sets up once so that a school's office can post a school-wide
post to the school's own Facebook Page and Instagram account, and what the office then does.
The code is `apps/web/src/lib/social.ts` (connection, queue, sender, token check),
`apps/web/src/lib/social-meta.ts` (the Graph API calls), the routes under
`apps/web/src/app/api/social/meta/` (Facebook Login), the page `/admin/settings/social`, the
composer at `/bulletin/new`, and the jobs `social:send` (every minute) and `social:refresh`
(daily 04:10). Meta's Graph API is free; nothing here takes or moves money.

## What the school sees

1. The school's ADMIN opens Settings → Facebook and Instagram and presses **Connect Facebook**.
   Facebook asks them to sign in, to allow the permissions below and to choose which Pages
   Shalaghar may use. Back on the platform they pick the school's Page; the Instagram
   professional account linked to that Page (if any) comes with it.
2. On a **school-wide** post (never a class post, never a staff-only notice) the composer
   shows **Also post to Facebook** and, when an Instagram account is linked, **Also post to
   Instagram**. Ticking either shows "This copy leaves the platform and Meta's terms apply".
   A post with pictures needs the tick "The people shown have consented to publication"
   (decision 0002, the minors' data policy). Instagram needs a picture.
3. Within a minute or two the copy is on Facebook or Instagram. The post's own page shows,
   to the ADMIN, one line per network: Queued, Posted with a link, or Failed with the reason
   and a **Try again** button. Deleting or taking down the post on the platform does **not**
   delete it on Facebook or Instagram; the office deletes it there itself.
4. If Facebook stops accepting the school's key (the admin changed their password, removed the
   app, lost the Page role), the daily check marks the connection and both the settings page
   and the composer say **Reconnect Facebook**.

## The Meta app the owner creates (once, for the whole platform)

1. At <https://developers.facebook.com/apps> create an app of type **Business**, owned by the
   company's Business portfolio (Meta Business Suite). Name it as the product is called.
2. Add the products:
   - **Facebook Login for Business** (or Facebook Login): under its Settings, add the
     **Valid OAuth Redirect URI** exactly as the platform builds it:
     `https://<the app's public host>/api/social/meta/callback` (the value of
     `NEXT_PUBLIC_APP_URL` followed by `/api/social/meta/callback`; for local testing
     `http://localhost:3000/api/social/meta/callback`). Turn on **Use Strict Mode for
     redirect URIs** and **Enforce HTTPS**.
   - **Instagram Graph API** (listed as "Instagram" → "API setup with Facebook login").
3. Under App settings → Basic: note the **App ID** and **App Secret**, fill the privacy
   policy URL, terms URL, app icon, category (Education) and the data deletion instructions
   URL. Under App settings → Advanced, turn on **Require App Secret** (every call the platform
   makes carries `appsecret_proof`).
4. Put the App ID and App Secret in the platform's secrets:
   `fly secrets set META_APP_ID=… META_APP_SECRET=…` (see `apps/web/.env.example`;
   `META_GRAPH_VERSION` defaults to `v23.0` and should be moved forward before Meta retires it,
   about two years after its release). `FEES_SECRET_KEY` must be set too: each school's Page
   token is sealed under it, and with it unset nothing can be connected.
5. Instagram fetches the post's picture itself from
   `https://<the app's public host>/api/files/<file>?social=<token>`, so the app's public host
   must be reachable from the internet. Facebook does not need this (the picture is uploaded).

## The permissions to request in App Review

The platform asks for exactly these, and each needs **Advanced Access** through App Review
before any school outside the app's own roles can use them:

| Permission | Why the platform needs it |
| --- | --- |
| `pages_show_list` | to list the Pages the admin manages, so they can pick the school's |
| `pages_manage_posts` | to publish the school's post on its Page |
| `pages_read_engagement` | to read the Page post's permalink back after publishing |
| `instagram_basic` | to read the Instagram professional account linked to the Page |
| `instagram_content_publish` | to publish the post's picture and caption on Instagram |
| `business_management` | to reach Pages owned through a Business portfolio, as most schools' are |

For each, App Review asks for a description of the use and a screen recording: record an
admin connecting at `/admin/settings/social`, picking the Page, writing a school-wide post
with the box ticked, and the post appearing on the Page (and on Instagram), then the post's
status line with its link.

## Business verification

Advanced Access needs the company's **Business Verification** in Meta Business Suite
(Business settings → Security Centre): the company's legal name, address, phone and a
document (certificate of incorporation, GST certificate or a utility bill in the company's
name). It takes from a day to a few weeks. App Review cannot be submitted before it passes.

## Using it before App Review: tester roles

Until review is approved the app is in **Development mode**, and only people with a role on
the app can use it. That is enough for the owner to try the whole flow:

1. App roles → Roles: add the owner's (and any trial school admin's) Facebook account as
   **Administrator**, **Developer** or **Tester**; each accepts the invitation at
   <https://developers.facebook.com/requests>.
2. That person must also have a role on the school's **Page** (in the Page's settings, or in
   Business Suite under the Business portfolio that owns it), and the Instagram account must be
   a **professional** (business or creator) account linked to that Page.
3. Sign in to the platform as that school's ADMIN and press Connect Facebook. Everything works
   for these people only; a post made in Development mode is visible to the public as any
   Page post is.
4. When App Review approves the permissions, switch the app to **Live** mode (the toggle at
   the top of the app dashboard). Nothing changes on the platform.

## What the operator checks

- `/root/jobs`: `social:send` runs every minute and `social:refresh` daily at 04:10; their
  summaries count copies sent, failed and waiting, and Pages checked, fine and to reconnect.
- A copy is tried three times, an hour apart, then FAILED with Meta's own words beside the
  platform's; the office presses Try again. A token Meta no longer accepts, a missing
  permission, a post taken down or no picture for Instagram fail at once.
- The audit log records each connect, disconnect, queued post, retry, and the daily check's
  change of a connection's state (`social.*`).

## Untested

Nothing here has run against a live Meta app: the calls follow Meta's documented Graph API and
are proved against a fake in `apps/web/tests/social.test.ts`. Instagram refuses pictures whose
aspect ratio is outside 4:5 to 1.91:1; such a copy fails with "Meta could not take the picture".
