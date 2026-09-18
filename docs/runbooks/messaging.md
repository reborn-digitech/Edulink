# Texts to families: SMS and WhatsApp

What a school office needs to know before switching a channel on, and what
the operator needs to set up once. The code is `apps/web/src/lib/messaging.ts`
(routing, sending, reports), `message-templates.ts` (every sentence that can
be sent), the pages under `/admin/messaging`, and the jobs `messages:send`.

## What is sent, and when

Only the fixed templates in `message-templates.ts`, in the reader's language:

| Key | Sent by | When |
| --- | --- | --- |
| `absence` | the office's absence alert | a pupil flagged as missing school lately |
| `feeDueSoon`, `feeOverdue` | `fees:remind` (daily 09:00) | a week before an instalment, on the day, a week and a month after |
| `feeReceived` | every receipt | a payment posted at the counter, online or by UPI |
| `circular` | a notice from `/admin/messaging/new` | when the office sends it |
| `test` | the office's own test button | on demand |

Each school switches the four automatic events on or off, switches SMS and
WhatsApp on or off, and sets a monthly cap. A guardian switches SMS or
WhatsApp off for themselves under their notification settings. WhatsApp is
tried before SMS when both are open. Every attempt is a row in
`OutboundMessage`, including the ones not sent, with the reason: no number,
opted out, channel off, event off, monthly cap, daily cap (five a day per
person), no transport.

## One-time setup by the operator

1. **SMS.** The existing `SMS_TRANSPORT=twilio` and `TWILIO_*` variables.
   For Indian numbers, the sender's entity and headers must be registered on
   a DLT platform (Jio, Airtel, Vodafone Idea or BSNL's portal — one is
   enough, they sync), and **every template must be registered verbatim**.
   Print them with `npm run messages:templates`; each language you will
   send is a separate registration. Put the ids that come back in
   `MESSAGE_TEMPLATE_IDS` under `sms`. Twilio itself needs the DLT entity id
   and the header attached to the Messaging Service named in `TWILIO_FROM`.
2. **WhatsApp.** `WHATSAPP_TRANSPORT=twilio` and `TWILIO_WHATSAPP_FROM`.
   Start with Twilio's sandbox number (each tester joins it by sending the
   join phrase once); production needs a WhatsApp Business sender approved
   through Twilio, which takes days. Create a content template per message
   per language from the same `npm run messages:templates` output (the
   `{{1}}` form) and put the content SIDs in `MESSAGE_TEMPLATE_IDS` under
   `whatsapp`. Without a SID a message is sent as a plain body, which
   WhatsApp only delivers inside a 24-hour window the family opened.
3. **Delivery status.** In the Twilio console set nothing: every message is
   sent with its own `StatusCallback`,
   `https://<app>/api/webhooks/twilio/status/<schoolId>`, and the route
   checks `X-Twilio-Signature` with the auth token before it reads a byte.
   `NEXT_PUBLIC_APP_URL` must be the public origin or the callback signs
   against the wrong URL.
4. **Prove it.** An admin at any school presses "Send a test to me" on
   `/admin/messaging`; the row's status and the phone in their hand are the
   proof. `devbox` transports file every message at `/dev/mailbox` instead.

## Cost and control

- A text costs the school, not the platform: the monthly cap per school
  (default 2,000 segments) and the daily cap per person are the brakes.
  A message past a cap is recorded, not lost silently, and the overview
  says how much of the cap is used.
- Devanagari SMS is UCS-2: 70 characters a segment, so a Hindi or Marathi
  reminder is usually two segments where the English one is one. The
  overview counts segments, not messages.
- WhatsApp is cheaper per conversation and carries a 300-character notice
  in one message, which is why it is tried first.

## The job

`messages:send` runs every minute and sends up to 300 queued rows, each
school's under its own tenant. A notice to up to 100 families is sent in
the request; larger ones are queued and drained. `/root/jobs` shows it.

## Consent

The guardianship's `consentNotificationsAt`, set when a parent claims a
child or accepts the office's invitation, is the consent to be contacted;
the per-channel switches let a person withdraw a channel at any time, and
the school's `privacyDefaults` still apply to new members. WhatsApp's own
rules require the recipient to have opted in to messages from the business;
a school should say so in its admission form.
