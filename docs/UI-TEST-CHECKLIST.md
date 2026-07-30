# EduLink — end-to-end UI test checklist

Manual walkthrough of **every feature built so far**. Written in the order that
one person can complete in a single sitting, because each section leaves the data
the next section needs.

**Run it against a production build.** The service worker, offline mode, install
prompt and push notifications do not exist in `npm run dev`.

```bash
npm run db:reset          # wipe + reseed; prints the class join codes
npm run build
npm start                 # http://localhost:3000
```

Keep a second terminal open for the dev mailbox and DB checks:

```bash
npx prisma studio
```

### Accounts

Password for **every** seeded account: `copper-lantern-47-brook`

| Who | Login | Notes |
|---|---|---|
| Priya | `priya@riverside.school` | ADMIN **and** TEACHER → lands on role picker |
| Tom | `tom@riverside.school` | TEACHER, one class only |
| Sam | `sam@oakfield.school` | ADMIN of the **second** school |
| Jordan | `parent@example.com` | PARENT, children in **both** schools |
| A student | see `/admin/people` for codes | seeded students use `firstname@riverside.school` |

Emails are never sent. Read them at **`/dev/mailbox`** (404s in production —
use `npm run dev` for that one page, or read the `OutboundEmail` table).

Legend: ☐ to do · **⚠️** = the check most likely to catch a regression

---

## 0. Appearance and accessibility (do this once, applies everywhere)

- ☐ Load `/` — no layout shift, no flash of the wrong colour scheme
- ☐ **⚠️** Set OS to dark mode, hard-reload — page is dark from the *first paint*
  (a blocking inline script does this; a flash means it regressed)
- ☐ Tab through the landing page — every focused element has a visible ring
- ☐ Press Tab from a cold load — first stop is "Skip to main content", and it works
- ☐ Zoom the browser to 200% — nothing is clipped or unreachable
- ☐ Pinch-zoom on a phone — **must not** be blocked
- ☐ Narrow the window to 320px — no horizontal scrollbar anywhere
- ☐ At ≥1024px the desktop side rail appears; below it, the bottom bar
- ☐ **⚠️** Every tappable target is ≥48px tall (attendance buttons, nav items)

---

## 1. Landing page and PWA install

- ☐ `/` renders: hero, the four role cards, three feature cards, three-step
  set-up, footer
- ☐ **⚠️** Each role card is tinted differently (teacher blue, student green,
  parent purple, admin slate) — and in **dark mode** those tints are dark, not
  pale. (A pale card on a dark page was a real bug: the dark role variants only
  matched when `data-theme` and `data-role` sat on the same element.)
- ☐ `/manifest.webmanifest` returns JSON with `display: "standalone"`, 4 icons
  incl. two `maskable`, and 3 shortcuts
- ☐ In Chrome DevTools → Application → Manifest: no errors, icons render
- ☐ **⚠️** Chrome shows an install affordance; clicking "Install EduLink"
  installs it. Reopen from the home screen: **no address bar**
- ☐ In the installed app the landing page shows "Running as an installed app"
- ☐ On iOS Safari the button is replaced by "tap Share, then Add to Home Screen"
- ☐ Long-press the installed icon → 3 shortcuts (Attendance / Assignment / Messages)
- ☐ DevTools → Application → Service Workers: one active worker, no errors

---

## 2. School registration

- ☐ `/register` → step 1 of 3, progress bar, "Your school" highlighted
- ☐ Continue with an empty name → inline error, does not advance
- ☐ Enter website `riverside.school` (no scheme) → **⚠️** "Start with http:// or
  https://" and it does not advance
- ☐ Fix it, Continue → step 2
- ☐ Password `priyaraman123` with name "Priya Raman" → **⚠️** "Do not include
  your name or email in your password"
- ☐ Password `short` → "Use at least 10 characters"
- ☐ Password `copper-lantern-47-brook` → meter reads "Excellent password"
- ☐ Type an email already in use → on blur, "An account already uses this email"
- ☐ Continue → step 3 shows a review table matching what you typed
- ☐ Submit without ticking authorisation → **⚠️** blocked with an inline error
- ☐ Tick and submit → success panel with a code shaped `XXXXX-XXXX`
- ☐ Copy button copies it (toast confirms)
- ☐ **⚠️** Refresh mid-wizard (step 2) → your typed answers are still there
  (sessionStorage draft)
- ☐ "Go to my dashboard" → `/admin?welcome=1`
- ☐ Check `/dev/mailbox` → a "Confirm your email" message exists

---

## 3. Admin dashboard and checklist

Log in as **Priya** → role picker → **School admin**.

- ☐ `/admin` shows the school name, today's date, and the school code
- ☐ **⚠️** The checklist is *derived*, not stored: it reads 3/6 on the seeded
  school (teachers, classes, students already done). Archive every class and it
  should drop — it must never claim a step is done when the data says otherwise
- ☐ "Add your students" shows "Create a class first" when there are no classes
- ☐ Progress bar percentage matches the "N of 6 done" text
- ☐ Stat tiles: Teachers, Students, Classes, Register taken
- ☐ **⚠️** "Register taken" reads `—` (not `0%`) when there are no classes
- ☐ With 0 teachers, the bottom empty state appears with two CTAs

---

## 4. Classes

- ☐ `/admin/classes` lists the 3 seeded classes with join codes
- ☐ `/admin/classes/new` → create "Grade 6 · Science", subject, grade, room,
  pick a colour and a teacher
- ☐ Duplicate an existing class name → **⚠️** "A class with that name already exists"
- ☐ On success: a code shaped `XXX-XXXX`, copyable
- ☐ "Create another" resets the form; "Done" returns to the list
- ☐ Row menu → **Copy join code** → toast
- ☐ Row menu → **New join code** → **⚠️** toast says the old one no longer works,
  and the displayed code changed
- ☐ Row menu → **Archive class** → confirmation names the student count and says
  history is kept
- ☐ Cancel → nothing changes. Confirm → class moves to the Archived tab
- ☐ Archived tab → **Restore class** → back to Active
- ☐ **⚠️** Attendance/grade history for the archived class still exists in Prisma
  Studio (archive must never delete)

---

## 5. Invitations and CSV import

- ☐ `/admin/invites/new?role=TEACHER`
- ☐ Paste this deliberately messy CSV:

```csv
name,email,subjects
"Nakamura, Yuki",yuki@riverside.school,Physics;Chemistry
Ana Silva,ana@riverside.school,Art
Broken Row,not-an-email
No Address,
Yuki Again,YUKI@riverside.school
Priya Raman,priya@riverside.school,Maths
```

- ☐ **⚠️** Live preview reads "3 ready to invite · 3 need a look" before you send
- ☐ Problems list line numbers: 4 (invalid), 5 (no email), 6 (duplicate of line 2)
- ☐ Send → **⚠️** "2 invitations on the way" and "4 not sent", with Priya listed
  as *"Already in your school with this role"*. **Nothing may be silently dropped**
- ☐ Upload the same content as a `.csv` file → identical preview
- ☐ `/admin/invites` → Pending tab shows both, with expiry
- ☐ **Resend** → toast says the previous link stopped working
- ☐ **Withdraw** → moves to the Withdrawn tab
- ☐ Copy Yuki's link from `/dev/mailbox` and open it
- ☐ **⚠️** Name is pre-filled as `Nakamura, Yuki` — the quoted comma survived
  CSV → invite → form
- ☐ Subjects pre-filled as Physics + Chemistry chips; remove one, add another
- ☐ Accept → lands in `/teacher` signed in
- ☐ **⚠️** Reload the same invite URL → "This invitation is no longer valid"
- ☐ **⚠️** Open a made-up token → **identical** message (no enumeration oracle)

---

## 6. Directory and export

Back as **Priya (admin)**.

- ☐ `/admin/people` lists everyone with role badges and student codes
- ☐ Search "Amara" → filters; the URL contains `?q=Amara` (shareable)
- ☐ Clear search via the × button
- ☐ Role chips: Everyone / Admins / Teachers / Students
- ☐ Class filter and sort (name / recently joined)
- ☐ Search nonsense → empty state with a "Clear filters" button
- ☐ Pagination appears above 50 members
- ☐ **Export CSV** → downloads `edulink-directory-YYYY-MM-DD.csv`
- ☐ **⚠️** Open it: **zero** Oakfield rows (no `Ava Bennett`, `Sam Whitfield`)
- ☐ Apply the Teachers filter, export again → only teachers
- ☐ **⚠️** Visit `/admin/people/export?classId=NONSENSE` → the forged id is
  ignored, not honoured (full school, no error)

---

## 7. Student self-join (kid-first)

Sign out. Use a class join code printed by the seed.

- ☐ `/join` → three options, each role-tinted
- ☐ `/join/student` → step 1 of 4 with dots, not a percentage
- ☐ Type the code **lowercase and without the hyphen** (e.g. `773wc4w`)
  → **⚠️** auto-formats to `773-WC4W`
- ☐ Enter `ZZZ-9999` → "We could not find that code. Check each letter — it is
  easy to mix up a 3 and an E."
- ☐ Correct code → green panel confirms the **school and class name**
- ☐ Step 2: full name, preferred name, birthday
- ☐ Step 3: **⚠️** 72 avatars in a scrollable grid; picking one updates the large
  preview and the description ("Mint frog")
- ☐ Step 4: password meter reads "Great password!" for a passphrase
- ☐ "Let's go!" → `/student`, greeting uses the **preferred** name
- ☐ **⚠️** Welcome banner shows a login handle like `rosie.kvjn` with a copy
  button — this is how a child with no email gets back in
- ☐ Dismiss the banner; reload → it stays dismissed
- ☐ **⚠️** Sign out, log in with the **bare handle** (no `@`) and the password → works
- ☐ Back button from step 3 → returns to step 2 with answers intact
- ☐ Steps cannot be skipped forward by clicking ahead in the progress bar

---

## 8. Parent sign-up and child claim

- ☐ `/join/parent` → name, email, password, two separate consents
- ☐ Submit without the data-sharing consent → **⚠️** blocked with an inline error
- ☐ Tick and submit → `/parent/link`
- ☐ Get the new student's code from `/admin/people` (shape `STU-XXXX-XXXX`)
- ☐ Correct code + **wrong** birthdate → refused
- ☐ **Wrong** code + correct birthdate → **⚠️** *byte-identical* message.
  Compare them literally — a different message here is an oracle for probing
  codes and brute-forcing a child's date of birth
- ☐ Correct code + correct birthdate → "You're linked to <name>"
- ☐ **⚠️** "See their dashboard" → `/parent` directly, **no role picker detour**
- ☐ "Link another child" → the already-linked child is listed above the form
- ☐ Claim the same child twice → "You are already linked to this student"
- ☐ Log in as **Jordan** (`parent@example.com`, two children)
- ☐ **⚠️** Child switcher rail appears; switching changes every card, and the
  URL carries `?child=…` so it is bookmarkable

---

## 9. Attendance — the core loop

Log in as **Priya** → **Teacher**.

- ☐ `/teacher` shows registers outstanding, classes, to-grade
- ☐ `/teacher/attendance` → class picker with Done / To do per class
- ☐ Open a class → roster sorted by display name, accented names in the right
  place (Chloé after Ben, not after Z)
- ☐ **⚠️** "Mark all N present" → all fill instantly; toast offers **Undo**;
  Undo restores the previous state
- ☐ Tap P / L / A / E on individual students — instant, never waits on network
- ☐ Each button's accessible name is the full word ("Late — arrived after the
  bell"), not just the letter
- ☐ Summary chips at top update live
- ☐ Note icon → sheet → type a note → saves, shows under the name
- ☐ Search filters the roster; clearing restores it
- ☐ Sync pill: "Saving…" → "Register complete"

### Offline (the marquee behaviour)

- ☐ DevTools → Network → **Offline**
- ☐ Amber banner slides down: "Offline — your changes are saved and will sync"
- ☐ Mark 2–3 students — **⚠️** the UI behaves exactly as when online
- ☐ Sync pill reads "Saved on this device" / "N waiting to sync"
- ☐ **⚠️** DevTools → Application → IndexedDB → `edulink` → `outbox`: your
  payload is there with a `clientId` and `markedAt`
- ☐ **⚠️** Prisma Studio: the server has **no** record yet
- ☐ Set Network back to **Online**
- ☐ Banner retracts; toast "Synced N changes"
- ☐ **⚠️** `outbox` is now empty; the server record exists with the **same
  `clientId`** (proves idempotency, not a re-write)
- ☐ Reload → marks persist
- ☐ **Idempotency:** mark offline, go online, then immediately reload before the
  flush finishes → exactly one record per student, never duplicates
- ☐ Kill the tab while offline with marks pending, reopen → they still sync
- ☐ Navigate to an unvisited page while offline → the `/offline` fallback page,
  which reassures that marked work is safe

---

## 10. Assignments and grading

As **Priya (Teacher)**.

- ☐ `/teacher/assignments` → seeded work, "N to mark" badges
- ☐ `/teacher/assignments/new` → pick the class Amara is in
- ☐ Points `-5` → **⚠️** "Points must be a number, and cannot be negative"
- ☐ Fill title, instructions, category, points 25, due date + time
- ☐ **Save as draft** → detail page shows an amber "still a draft" bar
- ☐ **Publish now** → toast says the class and guardians were told
- ☐ Create another and **Publish** directly → button reads "Publish to N students"
- ☐ Detail page tiles: Students / Handed in / Marked / Class average
- ☐ **⚠️** Class average reads `—` (not `0%`) before anything is marked
- ☐ Type `22.5` for one student → **⚠️** accepted (half marks are real)
- ☐ Type `250` into a 25-point task → **⚠️** row turns red, "1 not a usable
  number", and **Save is disabled** until fixed
- ☐ Type `27` (over 25) → accepted (bonus marks are legitimate)
- ☐ Note icon → per-student comment
- ☐ **⚠️** Sticky "N unsaved changes" bar stays until you save
- ☐ Save → toast counts saved/cleared, tiles update, average appears
- ☐ Verify in Prisma Studio: **⚠️** `scoreMilli` is `22500` — an integer, not a float
- ☐ Clear a mark (empty the box) → save → the grade row is removed
- ☐ **⚠️** Re-save the same mark → the student does **not** get a second
  "marked" notification (only first grades notify)

### Student view

Log in as a student in that class.

- ☐ `/student` → today, streak, attendance tiles; upcoming work
- ☐ `/student/work` → the new assignment with instructions
- ☐ **Hand it in** → type an answer → **⚠️** "Handed in 🎉", panel turns green
- ☐ "Change it" → edit → Update works
- ☐ **⚠️** As the teacher, the gradebook now shows "Handed in" for that student
  (and "Handed in late" if past the due date)
- ☐ **⚠️** After the teacher marks it, the student tries to change the submission
  → refused: "already been marked… message your teacher instead"
- ☐ `/student/grades` → Overall, Marked, Your best
- ☐ **⚠️** Overall is **points-weighted**, not an average of percentages. With a
  17/20 and a 19/25 the correct answer is 80%, not 81%. Compare against Prisma
  Studio by hand
- ☐ Nothing anywhere shows a red "OVERDUE" stamp — overdue reads as "2 days ago"

---

## 11. Remarks (private messages)

As **Priya (Teacher)**.

- ☐ `/remarks` → empty state explains nobody else sees these
- ☐ `/remarks/new` → student list is only students **you teach**
- ☐ **⚠️** Students with no linked guardian show a "No guardian" pill, and
  selecting one warns *before* you write that nobody will receive it
- ☐ Pick Amara (has a guardian) → no warning
- ☐ Use a subject suggestion chip; write a message; send
- ☐ Thread view shows the privacy line: "Only <teacher>, school admins and
  <child>'s guardians can see this"
- ☐ **⚠️** Your own message reads "· Sent", **not** "· Read" (a read receipt
  against yourself was a real bug)
- ☐ Log in as **Jordan** → `/remarks` → unread dot on the thread
- ☐ Open it → dot clears; reply
- ☐ Back as the teacher → **⚠️** your message now reads "· Read"
- ☐ Enter inside the reply box inserts a newline; **⌘/Ctrl+Enter** sends
- ☐ Copy the thread URL. Log in as **Tom** (same school, different teacher)
- ☐ **⚠️** Open that URL → **404**. View source: the subject appears **nowhere**
- ☐ `/remarks` as Tom → the thread is absent from the list
- ☐ Log in as **Sam** (other school) → same URL → 404
- ☐ Log in as the **student** the note is about → same URL → 404

---

## 12. Notifications, push and account settings

- ☐ Bell icon in the mobile header shows an unread count
- ☐ `/notifications` lists everything, newest first, unread rows tinted
- ☐ Tabs: All / Unread (N)
- ☐ Click a notification → navigates to its target **and** clears the unread dot
- ☐ "Mark all as read" → count in the toast matches
- ☐ **⚠️** "Clear N read" → toast says *"Anything still unread was kept"*, and
  unread items are genuinely still there. Clearing must never be able to make an
  unseen message about a child vanish
- ☐ `/account` → roles, notifications, appearance, devices
- ☐ **⚠️** Appearance changes apply to the page **immediately**, before saving —
  someone enabling high contrast because they cannot read the page should not
  have to read a toast to find out if it worked
- ☐ Dyslexia-friendly → letter spacing and line height visibly widen
- ☐ Reduced motion → animations stop
- ☐ Reload after saving → settings survive, applied before first paint
- ☐ Quiet hours: enable → 21:00 to 07:00 defaults
- ☐ **⚠️** Set start and end to the *same* time → refused ("Start and end cannot
  be the same time") — otherwise it would silence everything forever
- ☐ Devices list shows "Chrome on Mac"-style labels, with "This device" badged
- ☐ Sign in from a second browser → both appear → sign the other one out from
  here → **⚠️** that browser is genuinely logged out on its next request
  (this is why sessions are server-side rows, not JWTs)
- ☐ "Sign out everywhere else" → toast confirms you are still signed in here

### Push

- ☐ **⚠️** `/account` → "Turn on" under Notifications. If push is unavailable the
  panel says *which* thing is missing (no service worker in dev / permission
  blocked / unsupported browser) — it must never show a button that silently
  does nothing
- ☐ Grant permission → "Notifications are on for this device"
- ☐ **⚠️** Mark a child absent as the teacher → the parent's device gets a Web
  Push *with the app closed* (requires HTTPS or localhost, real VAPID keys, and
  a production build)
- ☐ Click the push → opens the app at `/parent/attendance`
- ☐ Verify `Notification` rows in Prisma Studio regardless of push delivery
- ☐ **⚠️** In Prisma Studio, a `PushSubscription` row now exists for you. If it
  does not, push is dead no matter how correct everything else looks — that was
  a real bug: nothing created subscriptions, so `sendPush` always found zero and
  returned silently
- ☐ Reload `/account` → still reads "on" (the browser subscription and the
  server row are reconciled on load, and re-registered if the server lost it)
- ☐ Turn off → the `PushSubscription` row is deleted

---

## 12a. Parent settings

Log in as `parent@example.com`. A parent has **no Membership row** — the role
comes from an ACTIVE Guardianship, so `resolveContext` returns `PARENT` and
lands on `/parent`. Do not "fix" the seed by adding a membership.

- ☐ `/parent/settings` → notification channels, quiet hours, and the children
  the settings apply to
- ☐ The children listed are **only** your own — this page reads
  `listContexts`, not a school roster
- ☐ Turn Email off → Save → reload → still off
- ☐ **⚠️** Copy is explicit that turning notifications off applies to *every*
  child listed, not just the one on screen
- ☐ "Your account" card links to `/account` rather than repeating appearance and
  devices — two pages writing `User.prefs` would drift
- ☐ Signed out → `/parent/settings` redirects to `/login`, never renders

---

## 12b. Bulletin board and moderation

As a **student** (`amara@riverside.school`).

- ☐ `/bulletin` → **⚠️** a banner tells students their posts are reviewed *before*
  they post, not after the post vanishes
- ☐ Tabs are "Everything" and "My posts" — **⚠️** students get no "To review" tab
- ☐ `/bulletin/new` → **⚠️** only "One class" is offered; a student cannot address
  the whole school
- ☐ Button reads "Send to my teacher", not "Post"
- ☐ Post one with a tag → lands on My posts, marked "Waiting for a teacher to
  check it"

Pictures. Use a **photo straight off a phone**, which is the case that matters —
it will have EXIF, and it may have GPS.

- ☐ "Add a picture" → pick one → filename, size and a preview appear
- ☐ **⚠️** Send with no description → refused, and **nothing is uploaded**. An
  undescribed picture is unreadable to a child using a screen reader
- ☐ "Remove", then pick the *same* file again → it is accepted (the input is
  cleared, so the change event still fires)
- ☐ Pick something over 5 MB → refused immediately, before any upload
- ☐ Pick a non-image (a PDF) → refused. The server re-checks by sniffing the
  actual bytes, so renaming `.pdf` to `.jpg` is refused too
- ☐ **⚠️** Send it, then find the stored file under `storage/<first two chars>/`
  and run `exiftool` or `file` on it: **no GPS, no Exif block**, and it is still
  a valid image. A child's photo must not publish where they live

As **Priya (Teacher)**.

- ☐ `/bulletin` → "To review (1)"
- ☐ The queue shows the student's post with **Publish it** / **Send back**
- ☐ Click "Send back" → **⚠️** the confirm button is **disabled** until you type a
  reason. A rejection with no explanation teaches a child the system is arbitrary
- ☐ Type a reason → send back → the queue empties

Back as the **student**.

- ☐ **⚠️** My posts shows "Not published" *and the teacher's exact reason*
- ☐ Copy reads "nothing is held against you"
- ☐ Log in as a **classmate in the same class** → **⚠️** the post is invisible,
  and so is the reason. This is the single most important assertion in the
  feature: an unreviewed post from a nine-year-old must not be readable by the
  class
- ☐ **⚠️** As that classmate, request the picture's URL **directly** —
  `/api/files/<fileId>`, copied from the teacher's view. It must **404**. Hiding
  the post in the feed is not the same as protecting the file, and this is the
  step that tells them apart
- ☐ Have the teacher publish it → the same URL now returns the image for the
  classmate, and still 404s when signed out

Reactions, pinning, reporting.

- ☐ On an approved post, tap each of the four reactions — optimistic, no spinner
- ☐ Tap again → toggles off. Counts are per-kind
- ☐ **⚠️** There is no thumbs-down or any negative reaction available
- ☐ As **admin**: pin a post → it sorts to the top with "Pinned by the school"
- ☐ **⚠️** As a teacher or student, no pin control is offered
- ☐ Tap the flag on someone else's post → reasons in plain language, optional
  detail, and the confirmation says a teacher will look and *you need do nothing
  else*
- ☐ No flag appears on your own post
- ☐ As **admin**, check `Report` rows exist in Prisma Studio
- ☐ Comment as a **student** → **⚠️** held for review, and the box said so
  *before* you typed
- ☐ Comment as a **teacher** → posts immediately
- ☐ As a classmate, a held comment from someone else is **not** visible

---

## 12c. Safety centre (admin only)

Log in as **Priya → School admin**. To get something into the queue, report a
post as a student first (§12b), or seed one directly.

- ☐ `/admin/safety` → tabs: To deal with (N) / Resolved / Audit log
- ☐ **⚠️** Three reports of the *same* post appear as **one** card reading
  "3 reports", not three cards. An admin dismissing the same thing repeatedly
  loses track of what is actually outstanding
- ☐ The card shows the reported content inline — author, role, the actual words —
  so triage does not require opening another tab
- ☐ **⚠️** A post reported as *unkind* or *unsafe* sorts above a more-reported,
  more-recent spam report. Urgency beats both tie-breakers
- ☐ Expand "What reporters said" → each reporter, reason and free-text detail
- ☐ **⚠️** Delete the reported post directly in Prisma Studio, reload → the card
  reads "This content is no longer available", offers only *Close it*, and can
  still be cleared. A report that cannot be cleared clogs the queue forever
- ☐ "Take it down" → **⚠️** the confirm button is **disabled** until you write a
  note, because that note is what the author reads
- ☐ Confirm → the post becomes REJECTED with your note as the reason, all its
  reports close together, and the count drops
- ☐ **⚠️** The author gets "A post of yours was taken down" *with your note* — a
  takedown must explain itself, not silently vanish
- ☐ Check `/bulletin?filter=mine` as that student → the note is shown
- ☐ "Nothing wrong — close it" also requires a note, and leaves the content alone
- ☐ Resolved tab → shows Removed / Dismissed badges and the note you wrote
- ☐ A **USER** report offers no takedown, and says to use the school's own
  safeguarding process (there is no suspend-user action yet)

### Audit log

- ☐ `?tab=audit` → append-only, school-scoped, with a note saying nothing in
  EduLink can edit it
- ☐ Entries read in plain English ("Removed reported content"), with the raw
  action key underneath
- ☐ **⚠️** "Sensitive only" filters to directory exports, failed sign-ins, failed
  parent-claim attempts and report actions
- ☐ Search by person or action narrows instantly
- ☐ **⚠️** Log in as Sam (other school) → his audit log contains **none** of
  Riverside's entries

---

## 12d. School settings and logo upload (admin only)

- ☐ `/admin/settings` → school code shown as read-only
- ☐ Choose an image → **⚠️** crop controls appear (zoom, move sideways, move up
  and down) and the preview updates live
- ☐ **⚠️** Try an **SVG** → refused before upload, with a reason ("export it as a
  PNG first"). SVG is an executable document, not an image
- ☐ Try a `.txt` renamed to `.png` → refused. The server sniffs magic bytes and
  does not trust the browser's Content-Type
- ☐ Try a file over 8 MB → refused client-side with the size named
- ☐ Adjust the zoom, then Save → **⚠️** the stored logo matches the **adjusted**
  crop, not a centre crop
- ☐ In Prisma Studio, `School.logoPath` is a UUID filename
- ☐ **⚠️** The file is on disk under `storage/<2-char shard>/`, **not** under
  `public/` — anything in public is served with no authorisation at all
- ☐ The logo renders from `/api/files/<uuid>.png`
- ☐ `curl -D-` that URL → `Content-Type: image/png`,
  `X-Content-Type-Options: nosniff`, a CSP with `sandbox`, and an immutable
  `Cache-Control`
- ☐ Repeat with `If-None-Match: <etag>` → **304**
- ☐ **⚠️** Request `/api/files/../../.env` → **404**, and `.env` is not returned
- ☐ Request a well-formed but non-existent UUID → **404** (never 403, which
  would confirm it exists)
- ☐ Upload a **second** logo → **⚠️** the first file is gone from disk and its
  URL now 404s. No orphans accumulate
- ☐ "Remove" → logo cleared and the file deleted
- ☐ Pick an accent colour → **⚠️** the whole UI recolours immediately, before you
  save
- ☐ Change a detail → a sticky "Unsaved changes" bar appears; Save persists it
- ☐ Reload → everything survives, and the accent is applied on first paint
- ☐ Invalid contact email / a website without `http://` → inline errors, no save
- ☐ As a **teacher**, `/admin/settings` → redirected away

---

## 12e. File attachments

As a **teacher**, on `/teacher/assignments/new`.

- ☐ "Handouts" → attach a PDF *while setting the work*, before it exists. The
  file is stored with the assignment in one step
- ☐ Remove it, then pick the same file again → accepted
- ☐ Publish → the handout is on the assignment, and every child in the class can
  open it

As a **teacher**, on an assignment detail page.

- ☐ "Files for the class" → attach a PDF and an image
- ☐ Each chip shows the real filename and size, and opens in a new tab
- ☐ Remove one → gone from the list and from `storage/` on disk

As a **student**, on `/student/work`.

- ☐ Files the teacher attached appear under "From your teacher", **read-only**
  (no remove button)
- ☐ "Your files" → attach your own; it appears with a remove button
- ☐ Try a 6th file → refused, naming the limit
- ☐ Try a `.txt` renamed `.pdf` → refused by magic-byte sniffing, and the message
  names the file that failed

### The leak checks — do these with two accounts on ONE browser

- ☐ As the student, open your own attachment → 200
- ☐ **⚠️** `curl -D-` it (or check DevTools): `Cache-Control` must contain
  **`no-store`**. Anything like `private, max-age=3600` is the bug: a classmate
  on a shared tablet then reads it from the browser cache without the request
  ever reaching the server
- ☐ **⚠️** Sign out, sign in as a **classmate in the same class**, and fetch the
  same URL → **404**. Do it with a plain `fetch`, not a cache-busted one — the
  plain one is what leaked
- ☐ Repeat as a **teacher of a different class** → 404
- ☐ Repeat as the **other school's admin** → 404
- ☐ Repeat **signed out** → 404
- ☐ As the class's own teacher → 200. As a school admin → 200. As the student's
  **guardian** → 200
- ☐ **⚠️** DevTools → Application → Cache Storage → `edulink-images`: it must
  contain **no** `/api/files/` entries. That cache is per-origin, lasts 30 days
  and survives sign-out
- ☐ Attach a file to an **unpublished draft** assignment → **⚠️** a student in
  that class gets 404 on it until the assignment is published
- ☐ Fetch a well-formed UUID that nothing references → 404 (orphans are denied,
  not served)

---

## 12f. Class detail and student profile

As **Tom (teacher)**.

- ☐ `/teacher/classes` lists only the classes **you** teach, each with a
  "Register done / to do" badge for today
- ☐ Open one → tiles for register, work to mark, **attendance concern** (below
  90%) and **⚠️ "No guardian"** — the count of children whose notifications reach
  nobody, which is the thing a teacher can actually act on
- ☐ Roster shows each child's 28-day attendance, colour-coded, with absences
- ☐ The message icon beside a child opens a thread pre-targeted at them
- ☐ Join code card → Copy works; "Show poster" prints a large-type card
- ☐ **⚠️** The poster says plainly there is **no QR code yet**. If it ever claims
  one, check a QR is actually rendered
- ☐ **⚠️** Open a `classId` you do not teach → **404**, not a redirect

As a **student**.

- ☐ `/student/profile` → avatar, preferred name, bio, badges
- ☐ "Change my look" → 72 avatars; picking one updates the large preview
- ☐ Save → the new avatar appears in the nav and on the register
- ☐ **⚠️** Your **full name** is read-only, and says only a teacher can change it
  — it is what the register uses
- ☐ Student code is shown with "a grown-up at home needs this to link to you"
- ☐ Badges: earned ones are highlighted, unearned ones are dimmed under "On the
  way" — **⚠️** there is no score, no rank, no leaderboard, and nothing that can
  go down
- ☐ Have a teacher approve one of your bulletin posts → the "Shared something"
  badge appears. Delete the post → **⚠️** it disappears again (badges are derived
  from live data, not stored)
- ☐ **⚠️** As a teacher, `/student/profile` → redirected away. As a student,
  `/teacher/classes` → redirected away

---

## 13. Authorisation — try to break in

Each of these must **fail**. Run them logged out and as the wrong role.

- ☐ Logged out: `/admin`, `/teacher`, `/student`, `/parent`, `/remarks` → redirect to `/login`
- ☐ Logged out: `POST /api/attendance` → **401**
- ☐ Logged out: `/admin/people/export` → **401**
- ☐ As **Tom (teacher)**: every `/admin/*` page → redirected away
- ☐ **⚠️** As Tom: `/admin/people/export` → **403** (not 401 — he *is*
  authenticated, just the wrong role)
- ☐ **⚠️** As Tom: open `/teacher/attendance?classId=<Priya's class id>` → he
  must not be able to take another teacher's register
- ☐ **⚠️** As Sam (Oakfield): any Riverside class/assignment/thread/post id → 404
- ☐ **⚠️** As Tom (teaches a different class): open a pending post id from
  Priya's class → 404, and it is absent from his review queue
- ☐ **⚠️** As Tom (teacher): `/admin/safety` → redirected away. The safety centre
  and audit log are admin-only
- ☐ **⚠️** Any `/api/files/<uuid>` belonging to another school → 404, even for an
  admin
- ☐ As **Jordan**: `/parent?child=<a child who is not theirs>` → falls back to
  their own child, never shows the other
- ☐ `/dev/mailbox` in a production build → **404**
- ☐ `GET /api/auth/logout` (not POST) → does not log you out

---

## 14. Role switching and sessions

- ☐ Log in as Priya → role picker lists **Teacher** and **School admin**
- ☐ Pick one → the whole UI recolours to that role's accent
- ☐ **⚠️** `/switch` again and pick the other → nav items change to match
- ☐ Tom (single role) → straight to `/teacher`, no picker
- ☐ Jordan (parent only) → straight to `/parent`
- ☐ ⌘K / Ctrl+K → command palette; arrow keys + Enter navigate; Esc closes and
  **returns focus** to where you were
- ☐ Palette search for nonsense → helpful empty message

---

## 15. Error and empty states

- ☐ A brand-new school shows encouraging empty states, never blank panels
- ☐ Stop the server mid-session and click around → no white screen of death
- ☐ Every list you have emptied shows an empty state with a next action

---

## Known gaps (do not file these as bugs)

Every route in the navigation now renders — all 39 route/role combinations were
requested as a signed-in user of the owning role and returned 200. Still not
built, per the README: a real QR code on the join poster, awards uploads on the
student profile, global feed, competitions, suspend-user, weighted grade
categories, progress-report export, SSO, 2FA, SMS, real email delivery.

These are absent rather than linked-and-broken. If you find a nav link that
404s or 500s, that is a bug now, not a deliberate gap — and check it while
signed in as the owning role, because a redirect to `/login` will hide both.
