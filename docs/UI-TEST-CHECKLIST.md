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
- ☐ **⚠️** Add three pictures at once. Each gets its OWN "Describe picture N"
  field — one caption read out for three photographs describes none of them
- ☐ Leave the middle one blank and send → refused, and it is the MIDDLE field
  that is marked, not the first or the whole form
- ☐ Fill it in and send → all three arrive, each with its own words, in order
- ☐ Remove one, then pick the same file again → accepted
- ☐ Approved post shows one picture full-width and keeps its proportions; two or
  more become a cropped grid, so the comments are not pushed off the screen
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

Reclaiming the disk. Not a screen — a terminal.

- ☐ Attach a file, then delete the post or assignment it belonged to
- ☐ `npm run files:check` → the file is listed as unreferenced, and **is still on
  disk afterwards**. Reporting is the default because the failure mode is
  deleting a child's work
- ☐ **⚠️** A file uploaded in the last hour is never listed, even with nothing
  referencing it — an upload writes its bytes before the row that points at them
- ☐ `npm run files:reclaim` → it goes, and the count of reclaimed bytes matches
- ☐ Run it twice → the second run is a no-op, not an error
- ☐ **⚠️** Anything in `storage/` that is not a UUID-named file is reported as
  "not ours" and **never deleted**

---

## 12f. Class detail and student profile

As **Tom (teacher)**.

- ☐ `/teacher/classes` lists only the classes **you** teach, each with a
  "Register done / to do" badge for today
- ☐ Open one → tiles for register, work to mark, **attendance concern** (below
  90%) and **⚠️ "No guardian"** — the count of children whose notifications reach
  nobody, which is the thing a teacher can actually act on
- ☐ **⚠️** On Grade 5 · Sunflower the concern count is **4**, not 0. The seed
  deliberately puts two children on 70% and two on 80%; a count that is always
  zero means the threshold has never actually been seen to work
- ☐ Roster shows each child's 28-day attendance, colour-coded, with absences.
  A child on 70% shows **2** absences, not 3 — the third was excused, which
  counts against attendance but is not something to chase a family about
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
- ☐ **⚠️** Command palette results are real **links** — middle-click one and it
  opens in a new tab, and a screen reader calls it a link, not a button. They
  were `<button>` with a `router.push` once, which looks identical and loses both
- ☐ ⌘K opens it, ⌘K again closes it, Escape closes it

- ☐ Badges: earned ones are highlighted, unearned ones are dimmed under "On the
  way" — **⚠️** there is no score, no rank, no leaderboard, and nothing that can
  go down
- ☐ **⚠️** The badge card header says "What you have earned so far" — **not
  "3 of 7"**. Badges are derived, so a total is a number that drops when a child
  slips below 95% attendance, and watching it drop is losing something
- ☐ **⚠️** Mark a child absent for a fortnight, then reload their profile: the
  attendance badges are **still there**. They describe what happened, not what is
  still happening, and being off ill is not a thing to take a reward away for.
  "Rock solid" reads *Reached 95% attendance*, past tense, on purpose
- ☐ The teacher's class page still counts that child under "attendance concern".
  Both are correct at once: the school should follow up, and the child should
  not be punished for having been unwell
- ☐ Have a teacher approve one of your bulletin posts → the "Shared something"
  badge appears. Delete the post → **⚠️** it disappears again (badges are derived
  from live data, not stored)
- ☐ **⚠️** As a teacher, `/student/profile` → redirected away. As a student,
  `/teacher/classes` → redirected away

---

## 12g. Competitions and parent consent

The catalogue is the ONE thing in this app that is not school-scoped: the same
competition is the same competition at both schools. What is scoped is who has
entered it. Both halves are worth checking.

- ☐ As **Amara (student)**: `/competitions` lists the open ones. The closed
  *Autumn Science Fair* and the draft *Summer Art Prize* are **absent**
- ☐ "Show closed ones too" brings the science fair back, still not the draft
- ☐ Open **Junior Maths Challenge** → *Enter this*, and read the line under it:
  it must warn that a grown-up is asked first
- ☐ **⚠️** Straight after entering, the page says **"Waiting for a grown-up to
  say yes"** and the competition reports **no** pupils taking part. An entry
  before consent counts for nothing
- ☐ As **Jordan (parent)**: the request is on `/parent` — **even with the other
  child selected in the switcher**. A consent deadline must not hide behind a tab
- ☐ Press **Allow** → Amara is told, and only now does the competition report one
  pupil from your school
- ☐ **⚠️** As a **different** parent (or with a second child's entry): you can
  only ever see and allow your own children's requests

### As an admin, posting one

- ☐ As **Priya (admin)**: `/competitions` → *Post one*
- ☐ Enter an `http://` link and an end date **before** the start → both fields
  are flagged **at once**, and **everything you typed is still there**
- ☐ Fix them, save → it is a **draft**, and says nobody else can see it
- ☐ *Publish it* → now sign in as **Sam (Oakfield admin)** and open
  `/competitions`: **Riverside's competition is in Oakfield's list.** That is the
  marketplace working
- ☐ **⚠️** It does **not** say "Checked by EduLink". A school cannot verify its
  own competition
- ☐ **⚠️** As Sam, try the URL of Riverside's **draft** → **404**

### Handing in and results

- ☐ As **Amara**, before consent: there is **no hand-in box at all**, just a line
  saying one is needed
- ☐ Once consented, hand in `https://example.org/my-work` → "Handed in"
- ☐ Paste `http://…` (no s) → refused, and what you typed is still there
- ☐ As **Tom or Priya**: the competition page offers *Your school's entries and
  results* → the list shows Amara, her link, and a score box
- ☐ Type `18.5` and place `3`, Save → check Prisma Studio: **`scoreMilli` is
  18500**, never a float
- ☐ **⚠️** Amara sees "3rd place · 18.5 points", and both she and Jordan have a
  notification
- ☐ **⚠️** Clear BOTH boxes and Save → the result goes, and the entry says
  "Handed in" again — clearing is not the same as scoring nought
- ☐ Now type `0` and Save → that IS a score, and it stays
- ☐ **⚠️** As **Amara**, open `/competitions/<id>/entries` directly → **404**.
  It is a staff page

## 12h. Progress report

- ☐ As **Jordan (parent)**: `/parent` → **Progress report** on the grades card
- ☐ The sheet shows attendance with the four counts, the overall grade, every
  marked piece of work with its class, and any badges
- ☐ **⚠️** The attendance % and the overall % are the SAME numbers `/parent/attendance`
  and `/parent/grades` show. A report that disagrees with the app is worse than
  no report
- ☐ **Print or save as PDF** → the preview has **no nav, no buttons** — just the
  report
- ☐ Add `?from=2026-05-01&to=2026-06-30` → the header and footer both say that
  window, and the figures shrink to match
- ☐ As **Tom (teacher)**: a class page → the document icon next to a pupil opens
  the same report
- ☐ **⚠️** As Tom, open the report of a pupil in a class he does **not** teach →
  **404**. "Same school" is not enough
- ☐ **⚠️** As a pupil, open a classmate's report → **404**; their own → 200
- ☐ **⚠️** As **Sam (Oakfield)**, open a Riverside pupil's report → **404**
- ☐ If a badge disagrees with the attendance figure above it, that is **not a
  bug** — the page says so. An attendance badge describes the **last 20 school
  days**; the report describes its own window

## 12i. The school calendar and the academic year (admin only)

The two are on one page because they are one afternoon's work.

- ☐ As **Priya (admin)** on a school with **no year set up**: `/admin` shows a
  **“Start your academic year”** card with a **Set up the year** button
- ☐ Press it → `/admin/calendar`, and the year form is **already open** with a
  suggested name and dates. Check the suggestion: in **February 2027** it should
  suggest **2026–27**, not 2027–28 — the Indian school year starts in June
- ☐ Save it → the card on `/admin` is **replaced** by a quiet one-line strip
  showing the year and **Update the calendar**. A banner that never changes is
  wallpaper
- ☐ Add a single-day entry (**Republic Day**, 26 January, Holiday). The end-date
  field is **hidden** until you click *It lasts more than a day*
- ☐ Add a multi-day one (**Diwali**, 5 days, Holiday) and an **Exam** week
- ☐ Entries group by **month**; a break spanning two months appears **once**, with
  its full range — not twice
- ☐ The exam week's pill says **Exam** in words, not just a different colour
- ☐ Edit an entry inline → **Save** → the list updates. Cancel → nothing changes
- ☐ Remove one → it asks **Remove / Keep** first
- ☐ **⚠️** Set the end date **before** the start → refused, with a reason
- ☐ **⚠️** Try a range longer than a year (e.g. 2026-01-01 → 2028-01-01) →
  refused. It must **not** silently store the first 366 days
- ☐ `/admin` now says **“Next up: …”** with the nearest entry ahead. A finished
  break must **not** appear there

### The Monday-to-Saturday week

- ☐ **⚠️** Declare a **Saturday** as a Holiday → as Tom, open
  `/teacher/attendance?date=<that Saturday>` → the **school-is-shut warning
  appears**. Saturday is a teaching day here, so a Saturday holiday is a real
  one — under a Mon–Fri week this was a silent no-op
- ☐ Open the register on an **undeclared Saturday** → **no warning**. It is an
  ordinary school day
- ☐ Open it on a **Sunday** → the warning appears without anyone declaring
  anything
- ☐ As **Jordan (parent)** on `/parent/attendance`: a Saturday session is listed
  with **no "Sunday session" caption**. Only a Sunday gets one

### The register warning — the reason the calendar exists

- ☐ Put a **Holiday** on today's date, then as **Tom (teacher)** open
  `/teacher/attendance`
- ☐ A **warning strip** says the school is shut, names the holiday, and says
  absences will still count
- ☐ **⚠️** The register is **still usable**. This warns, it does not block —
  schools do run catch-up classes over a break, and a teacher in front of a real
  class must not be told the class does not exist
- ☐ Change the entry to an **Exam** → the strip turns **neutral** and says the
  school is open and the register is taken as usual
- ☐ Remove the entry → the strip disappears

### Closing the year — the irreversible one

- ☐ Add a **second** year (*Add next year*). It shows as **Waiting**, and the
  current one is **unchanged** — adding next year's dates must not end this one
- ☐ Note which badges a pupil holds (`/student/profile` as that child)
- ☐ Back as admin: choose the next year under **Move into** → **Close the year**
  → it asks to confirm and states that badges are archived, not deleted
- ☐ Confirm → the toast reports how many badges were kept, across how many pupils
- ☐ **⚠️** The pupil's **live** attendance badges are now **gone** — the new year
  starts empty and nobody has 20 days of register in it yet
- ☐ **⚠️** The badges they held are still on their profile, labelled with the
  **old year's name**. Lost within a year, kept forever after it
- ☐ Press **Close the year** twice (re-run it) → nothing is double-archived

- ☐ **⚠️** As **Tom (teacher)** and as a pupil, open `/admin/calendar` →
  **redirected**, not shown

## 12j. Practice — adaptive practice (student)

- ☐ As **Amara (student)**: the bottom bar shows **Practice**. Open it
- ☐ Topics are listed with the hybrid names — **Ganit · Maths**, **Vigyan ·
  Science**, **Itihaas · History**
- ☐ **⚠️** There is **no leaderboard, no total, no "3 of 7"**. Every number on the
  page is about this child and nobody else
- ☐ Open **Linear Equations** → the first question is a **level 1** ("Yaad rakho ·
  Remember") one, and the badge shows that level
- ☐ **⚠️** View source / inspect the page → the **answer and the solution are not
  in it**. They arrive only after you answer

### The ladder

- ☐ Answer **one** correctly → the level does **not** move (a guess is right a
  quarter of the time)
- ☐ Answer a **second** correctly → the level moves up, and the next question is
  visibly harder
- ☐ Get **two wrong in a row** → it eases back down
- ☐ Leave the page and come back → you resume at the level you reached, **not** at
  level 1

### The reveal, and what it costs

- ☐ Press **Show me how it works** → it asks first, and says in words that the
  badge for this topic is forfeited
- ☐ Press **I'll keep trying** → nothing is revealed and nothing is lost
- ☐ Press **Yes, show me** → the working appears, and a line explains the badge is
  not available this run
- ☐ **⚠️** Answer a question normally → the solution appears **free**, with no
  warning. Reading why you were wrong is marking, not peeking

### The badge

- ☐ Finish a topic having revealed **nothing** → the finish screen shows a medal
  and says the badge is **yours for good**
- ☐ Check `/student/profile` → the badge is listed
- ☐ **⚠️** As an admin, close the academic year → the quiz badge is **still there**.
  Attendance badges reset; this one never does
- ☐ Start a fresh topic, reveal **one** solution, then finish it → **no badge**,
  and the finish screen explains why rather than just omitting it
- ☐ **⚠️** Reveal a solution, then **close the tab and come back** → the run is
  resumed and the badge is **still forfeited**. Closing the tab must not launder a
  peek
- ☐ Finish a topic getting every answer **wrong**, revealing nothing → the badge
  **is** awarded. It says "finished without peeking", not "got them right"

### Not a pupil

- ☐ **⚠️** As **Tom (teacher)** and as **Jordan (parent)**, open
  `/student/practice/maths-8-linear-equations` → **redirected**
- ☐ **⚠️** Open `/student/practice/not-a-real-topic` → **404**

## 12k. Language (every role)

English, हिन्दी and मराठी. One setting, stored on the user row, so it follows the
account to a different device rather than living in the browser.

### Switching

- ☐ As anyone, open `/account` → a **Language** card with three buttons, each
  labelled in its **own script** (English / हिन्दी / मराठी)
- ☐ Tap **मराठी** → the whole side rail and bottom bar re-label **immediately**
  (आढावा, निर्देशिका, वर्ग…), and a "भाषा बदलली" toast appears
- ☐ **⚠️** The card's own sentence says the translation is **partial**. Confirm it
  is there — a reader who then meets an English page must have been warned
- ☐ Open **⌘K** → the placeholder, the group headings and every entry are in
  Marathi too
- ☐ Reload the page → still Marathi. Sign out, sign in again → still Marathi

### It is one setting, not two

- ☐ As **Amara (student)** set the language to **हिन्दी** from `/account`, then
  open `/student/practice` → the heading reads **अभ्यास** and the "Read in"
  switcher already shows Hindi selected. There is no second choice to make
- ☐ Change it on the practice page instead → `/account` agrees when you go back

### Signed out

- ☐ Set Marathi, then sign out and open `/login` → the login page is in Marathi
  (the choice is mirrored to a cookie, because there is no user row to read yet)
- ☐ **⚠️** In devtools set the `edulink_locale` cookie to `zz` and reload →
  the page renders in **English**, status **200**. An unreadable language
  preference must never be a 500

### Accessibility

- ☐ **⚠️** With Marathi selected, inspect `<html>` → `lang="mr"`. This is what
  makes a screen reader pick a Marathi voice; an English voice reading Devanagari
  is unusable
- ☐ Each language button carries its own `lang` attribute, so "मराठी" is
  announced correctly even while the page is still in English

## 12l. Pausing somebody's access (admin only)

A school can stop somebody opening it, and give it back. It is a **membership**
that is paused, never an account.

### Pausing

- ☐ As **Priya (admin)**, open `/admin/people` → every row except your own has a
  **Pause** button. **⚠️** Your own row has none
- ☐ Pause **Tom (teacher)** → a box asks *why*. Leave it empty and press Pause →
  **refused**, with a message. Type a reason → the row moves out of the list
- ☐ A **Paused (1)** tab appears. Open it → Tom is there, with the reason and how
  long ago underneath
- ☐ Open `/admin/safety` → the audit trail shows **membership.suspend** against
  your name

### What Tom sees

- ☐ In another browser, signed in as **Tom**, reload → he lands on `/suspended`,
  which **names the school** and says nothing has been deleted
- ☐ **⚠️** Try `/teacher`, `/teacher/attendance`, `/bulletin` → every one sends
  him back. His session cookie is still valid; the school no longer claims him
- ☐ **⚠️** He is never shown "You are not part of a school yet — join with a
  code". He is part of one, and no code would help
- ☐ Set his language to मराठी beforehand → the whole page is in Marathi

### What it does not touch

- ☐ **⚠️** As Priya, check Tom's class → his past marks, attendance and
  assignments are all still there, unchanged
- ☐ **⚠️** If Tom also belongs to **Oakfield**, sign in and confirm Oakfield
  still works exactly as before. Riverside must not be able to lock him out of
  a school it does not run

### The guards

- ☐ **⚠️** Make yourself the only admin (pause or remove the others), then try to
  pause yourself → **refused**, "you cannot pause your own access"
- ☐ **⚠️** With one admin left, ask a second admin to pause them → **refused**,
  "this is the school's only admin". A school with no admin cannot be recovered
  from inside the app
- ☐ As **Sam (Oakfield admin)**, try to pause a Riverside teacher → **refused**

### Restoring

- ☐ Open the **Paused** tab and press **Restore** → Tom is back in the list, the
  reason is gone, and he gets a notification
- ☐ Tom reloads → he is back in his school with everything where he left it

## 12m0. THE WHOLE CHAIN, ONCE — onboarding a school from nothing

**Do this one first, and do it in a browser against `npm start`.** Every other
section here tests a screen; this tests the joins between them, and it is where
five bugs were found that no test could see because every page involved was a
healthy 200 throughout.

Budget twenty minutes. Use a school name you will recognise and delete after.

### The operator sets it up

- ☐ `npm run superuser -- priya@riverside.school`, log in as Priya
- ☐ **⚠️** The role switcher offers **Server administration** alongside her two
  school roles. The page asks where you would like to go; the operator area is a
  place you can go
- ☐ `/root` → **Add a school** → name, contact email, grade range **3 to 10**,
  timezone **Asia/Kolkata** → created, with a join code
- ☐ **⚠️** Back on `/root`, the new school does **not** say *Needs setup* — you
  gave it a grade range. Neither do the seeded ones
- ☐ On the school page, the **Details** form is filled in with what you typed,
  not blank. (A blank form here would wipe the school on Save)
- ☐ Invite an **Administrator** by email

### The admin arrives

- ☐ Open the invite link from `/dev/mailbox` (dev) or the `OutboundEmail` table
  (production — the field is `text`, not `body`)
- ☐ **⚠️ THE ONE THAT WAS BROKEN.** The page names **who the invitation is for**
  — the email address — even though no human sent it. This is the only
  invitation in the system with no sender, and it used to show neither
- ☐ **⚠️** If you are still signed in as somebody else, it says so, and warns
  that accepting will sign you out
- ☐ Accept → you land on the **new school's** overview, checklist at 0 of 6
- ☐ **⚠️** The date in the header is the school's **own timezone**. Compare with
  Riverside in another tab: they can differ by a day
- ☐ **⚠️** No *Server administration* in this admin's side rail — they are not
  the operator

### Classes, and the grade range doing its job

- ☐ Create a class → **⚠️** the Grade dropdown offers **exactly 3 to 10** and
  says "This school teaches 3 to 10". Not 1–12, not a free text box
- ☐ Give it a **section** (A) → created, with its own class join code
- ☐ Invite a **teacher**, assigning them to that class in the same step
- ☐ Accept as the teacher → **⚠️** their invite page names both the sender and
  the recipient, unlike the operator's
- ☐ They land on **Today** with **1 register still to take** — the class from
  their invitation is already theirs

### A pupil joins, and the register closes the loop

- ☐ Sign out. From the login page follow **join with a code**
- ☐ **⚠️** If you did NOT sign out, `/join` says who is signed in and offers
  **Sign out and join**. It used to bounce you to their dashboard in silence
- ☐ Enter the **class** code → **⚠️** it resolves the school and class before you
  are anybody. This is the join-code bootstrap; it works with no session
- ☐ Finish the four steps → you land on the pupil dashboard with a **login
  handle** shown once. Save it
- ☐ **⚠️** Attendance reads `—`, not `0%`. Nobody has marked them yet
- ☐ Log back in as the teacher → **Register** → the pupil is on it → mark them
  present → **⚠️** reload: it stuck

### Dates are day-first

- ☐ **⚠️** Any date box in the app — the calendar, leave, a competition, the
  pupil-join birthday — reads **`dd/mm/yyyy`**, not `mm/dd/yyyy`, whatever
  language your browser is set to. This is the one thing `<input type="date">`
  will not do; if you see `mm/dd/yyyy` the component has been swapped back
- ☐ Type **05/04/2026** and save → it means **5 April**. Reopen it: still 5 April
- ☐ **⚠️** Type **31/02/2026** → refused, with a message. It must NOT silently
  become 3 March, which is what `new Date` would do
- ☐ Type **29/02/2024** → accepted. **29/02/2026** → refused
- ☐ `5/4/2026`, `05-04-2026` and `05.04.2026` all work — people type what their
  keyboard makes easy
- ☐ The **calendar button** beside the box opens the native picker; pick a date
  there and the text box shows it day-first

### The language trap

- ☐ On `/login`, **⚠️** there is a language switcher. Pick **मराठी** → the page
  is Marathi **with no session**
- ☐ **⚠️** The switcher is still visible, so you can get back. This is the whole
  point: a shared school computer keeps the last person's choice, and the next
  person must not be stranded in a language they cannot read
- ☐ Switch back to English
- ☐ **⚠️** With Marathi selected, turn on a screen reader (or read the DOM) at a
  required field: it announces **(आवश्यक)**, not "(required)". It was the last
  English word on a fully translated form, aimed at the readers least able to
  work around it
- ☐ **⚠️** The date placeholder stays **dd/mm/yyyy** in every language. It is a
  shape, not prose — दद/मम/वववव is a pattern nobody has seen on a real form

---

## 12m. Whoever runs the server (`/root`)

Nobody has this in the seed. Grant it first:

```bash
npm run superuser -- priya@riverside.school
```

### Getting in

- ☐ As **Priya**, open `/root` → both schools are listed, with join codes and
  grade ranges
- ☐ Sign in as **Tom** and open `/root` → sent away to `/`
- ☐ Signed out, open `/root` → sent to `/login`
- ☐ **⚠️** The page says out loud that an operator cannot see inside a school.
  Confirm that sentence is there — it is the whole boundary, stated

### Adding a school

- ☐ **Add a school** → fill in name, contact email, timezone and a grade range of
  **3 to 10** → created, with a join code shown
- ☐ Set the lowest grade to 10 and the highest to 3 → **refused**
- ☐ Set the range to **K to 5** → accepted. A school that names its first year
  "K" is not named wrong
- ☐ Create a second school with the *same name* → both exist, with different
  slugs. Two schools genuinely can be called the same thing

### Inviting somebody to run it

- ☐ Open the new school → invite an **Administrator** by email → appears as
  *pending*, and the email is in `/dev/mailbox`
- ☐ Invite the same address again → **refused**
- ☐ **Revoke** it → status changes; revoke again → refused
- ☐ **⚠️** Check `/admin/people` for that school does not exist for you. An
  operator creates a school and invites its admin; they do not get a membership

### Finding your way back in

- ☐ **⚠️** Priya has the flag **and** runs Riverside. Sign in as her normally →
  she lands on `/admin`, and the side rail carries **Server administration** at
  the bottom, set apart from the school's own links. Before this she had to type
  the URL: the automatic redirect to `/root` only fires for an operator with no
  school at all
- ☐ ⌘K → search "server" → the same entry. The side rail is desktop-only and the
  person who runs the server is as likely to be on a phone
- ☐ As **Tom**, neither appears anywhere

### The server log

- ☐ `/root` → **Server log** in the header → the schools you added and the
  administrators you invited, newest first
- ☐ **⚠️** Now open **`/admin/safety` → Audit log** for either school. **None of
  those lines is there.** An operator's actions belong to the operator, not to a
  tenant — that is why they are written with no school at all
- ☐ **⚠️** And the converse: nothing from inside a school appears in the server
  log. No register, no marks, no sign-ins
- ☐ As **Tom**, open `/root/audit` → sent away. Signed out → sent to `/login`

### The boundary, from the database's side

- ☐ Run `npm run rls:verify` → the superuser block passes: every school visible,
  **no** membership, attendance, grade, message, enrolment or school-scoped audit
  rows, and a Membership write refused
- ☐ **⚠️** …and the two new lines: the operator **can** read the audit rows that
  belong to no school, and **no school can**. The trail was written for months
  with nothing able to read it, which is worse than none because it is trusted
- ☐ `npm run superuser -- --list` → shows who has it
- ☐ Try to revoke the only superuser → **refused**, with the reason

## 12n. Class setup, staffing and the roll (admin only)

### Sections

- ☐ As **Priya (admin)**, `/admin/classes` → **New class**. If the school has a
  numeric grade range, "Grade or year" is a **dropdown of exactly those grades**
- ☐ Create **Class 5**, section **A** → the list shows `Class 5 · A`
- ☐ Create one with the section left empty → accepted. A school with one Class 5
  should not have to invent a section

### Who marks the register

- ☐ Open a class → **staffing** → assign **Tom** as **Class teacher** → he
  appears with *Takes the register* on
- ☐ Assign somebody as **Also teaches** → they appear with *Does not*.
  **⚠️** A co-teacher does not mark the register by default
- ☐ Turn Tom's register off → as **Tom**, `/teacher/attendance` no longer offers
  that class
- ☐ **⚠️** With Tom's register off, POST to `/api/attendance` for that class
  (devtools → copy as fetch from a working save) → **403**, not 200. The page
  hiding the class is not the boundary
- ☐ Turn every teacher's register off → the page warns that **only an admin** can
  mark it. As Priya, `/teacher/attendance` still offers it — the last failsafe

### Cover

- ☐ **Arrange cover** for that class: somebody who does not teach it, today only
- ☐ As that person → `/teacher/attendance` offers the class, with a banner saying
  they are covering and until when
- ☐ **⚠️** As **Tom** (the class teacher) → he can **still** mark it. Cover adds
  a taker and never removes one
- ☐ Change the date to tomorrow → the coverer no longer sees it
- ☐ **⚠️ THE PERSON DOING THE WORK IS TOLD.** As the coverer, check their
  notifications → *"You are marking …"*, naming the class and the dates, linking
  to `/teacher/attendance`. Cover used to be arranged in silence: correct in the
  database, and discovered only by noticing a class you do not teach
- ☐ It arrives **during quiet hours** too (§12a). Cover set at ten at night is
  for tomorrow morning; a notification that waits until eight is not a plan
- ☐ Cancel the cover → gone immediately, **and they are told again**: *"You are
  no longer marking …"*. Being told you are covering and never told you are not
  is how somebody walks into a room that already has a teacher in it
- ☐ Same when the **leave** that caused it is withdrawn (§12o), not only when the
  cover is cancelled by hand

### The roll

- ☐ **Add students** → search, tick several, add them in one go
- ☐ **⚠️** Grade 5 pupils are listed **first**, and pupils of other grades are
  still on the list. A child repeating a year must be addable
- ☐ A pupil already in another class shows **which** class, rather than being
  hidden
- ☐ Remove somebody → they leave the roll. **⚠️** Open their profile: their marks
  and attendance for that class are **still there**
- ☐ Add them back → they return, and there is still exactly one enrolment row

## 12o. Leave (teacher, then principal)

Make somebody a principal first — invite them from `/root`, or add a PRINCIPAL
membership directly.

### Applying

- ☐ As **Tom**, `/teacher/leave` → **Apply for leave** → dates, kind, a reason,
  and a suggested cover → sent
- ☐ **⚠️** The reason box says *the principal reads this and nobody else*.
  Confirm that sentence is there before typing anything private
- ☐ Leave the reason empty → **refused**
- ☐ Apply again for **overlapping** dates → **refused**
- ☐ Set the end date before the start → **refused**

### Deciding

- ☐ As the **principal**, `/principal/leave` → the request is waiting, with the
  reason and how many registers Tom is down to mark
- ☐ **Approve and arrange cover** → toast names how many classes were covered
- ☐ **⚠️** As the nominated coverer → `/teacher/attendance` now offers Tom's
  class for those dates
- ☐ **⚠️** As **Tom** → he can still mark it too
- ☐ As the principal, apply for your *own* leave, then try to approve it →
  **refused**. Ask an admin to approve it instead → works
- ☐ **⚠️ AND THE ADMIN CAN FIND IT.** Sign in as **Priya** and look at the side
  rail → **Leave**, and ⌘K offers *Review leave requests*. `decideLeave` has
  always accepted an admin — a school whose principal is the one on leave still
  has to approve somebody's — but until now nothing linked to the queue and the
  only way in was typing `/principal/leave`

### Staff-only

- ☐ As the principal, `/admin/calendar` → **Staff away** lists the approved
  leave, with dates and kind — and **⚠️ not the reason**
- ☐ **⚠️** As a **pupil** and as a **parent**, open `/admin/calendar` → sent away.
  Leave is never on a calendar a family reads
- ☐ Withdraw the leave as Tom → the cover disappears with it
- ☐ **⚠️** Arrange a separate cover by hand for the same class, approve leave,
  then withdraw the leave → the **hand-arranged** cover survives

## 12p. Report cards (class teacher)

### Building

- ☐ As the class teacher, open the class → **Report cards**
- ☐ Pick two or three assessments. **⚠️** Each says how many of the class are
  marked; an unmarked one is flagged
- ☐ Name it `Term 1` → **Generate for the class** → a draft per pupil
- ☐ **⚠️** As a **pupil**, open `/report-cards/<id>` for their own draft → **404**.
  As their **parent** → **404**. A draft is not "not linked yet"
- ☐ As the class teacher → 200
- ☐ Write a remark on one card → saved

### Publishing, and what freezes

- ☐ **Publish all** → the pupil and their guardian both get a notification
- ☐ As the pupil → `/student/grades` lists the card, and it opens
- ☐ **⚠️ THE ONE THAT MATTERS.** Go to the gradebook and **change a mark** that is
  on a published card. Reopen the card → **the number has not moved**
- ☐ **⚠️** Rename that assignment → the card still shows the **old title**
- ☐ Press **Generate** again → the report says N were already published and left
  alone; the card is unchanged
- ☐ **Withdraw all** → back to draft. Generate again → now it picks up the new
  mark

### Who may write them

- ☐ **⚠️** As a **co-teacher** of the same class, open the report-cards page →
  **404**
- ☐ **⚠️** As the **principal**, on a class they do **not** teach → 404. They read
  cards, they do not write them
- ☐ **⚠️ AND THE OTHER HALF.** Have an admin make that principal the **LEAD**
  class teacher of a class (§12n), then open its report-cards page as the
  principal → **200**. In a small school the head takes Class 5 on Tuesdays, and
  those cards are theirs to write. The test is the job, not the role
- ☐ As an **admin** → 200, and get there **by clicking**: `/admin/classes/<id>`
  → *Report cards*. There is no longer a URL to type

### And the family actually receives it

- ☐ **⚠️ THE ONE THAT WAS BROKEN.** After publishing, sign in as the **parent**,
  open the notification → it lands on `/parent/grades` and the **report card is
  there**, at the top, above the marks. For a whole release the notification
  arrived and the page it pointed at had no report card on it
- ☐ Open the card from that link → the same document the teacher previewed
- ☐ **⚠️** With **two children at two different schools**, use the child switcher
  → each child's own cards appear. The switcher does not change which school the
  session is pointed at, so this is the case that silently returned nothing

### On paper

- ☐ Print the card (⌘P) → the school **logo** and name are at the top, it is
  **black on white**, and the app chrome is gone
- ☐ **⚠️** An unmarked assessment reads **"not marked"**, not `0`

## 12q. The principal's dashboard

- ☐ As the **principal**, `/principal` → registers not taken today, leave
  waiting, attendance, pupils
- ☐ Change the window (7 days / 30 / a term) → the figures change **and the URL
  changes**. Paste the URL in another tab → same view
- ☐ Put nonsense in it — `/principal?days=99999` → falls back, **200**, no error
- ☐ `/principal/classes` → every class with attendance and progress, and a line
  saying how many report cards are published per term
- ☐ Open a class → pupils, each with attendance, progress and their latest report
  card
- ☐ **⚠️ THE ONE THAT MATTERS.** The pupils are in **alphabetical order**. Give
  one child a much higher mark than the rest and reload → still alphabetical.
  This app does not rank children
- ☐ **⚠️** A pupil with no marks shows `—` for progress and is named under
  *No marks recorded yet* — not scored 0%
- ☐ **⚠️** A class with no register taken shows `—` for attendance, not 0%
- ☐ As a **teacher**, open `/principal` and `/principal/classes` → sent away
- ☐ **⚠️** As the principal, open another school's class by pasting its id into
  `/principal/classes/<id>` → **404**

## 12s. A pupil leaving, and their school record

The feature whose whole risk is the tenant boundary. Walk it with **two schools**
and take your time over the last block — it is the one that either holds or
hands one school a window into another.

### Recording it

- ☐ As **Priya (admin)**, `/admin/people` → find a pupil → **Left**
- ☐ The box says, before you type anything: their access ends, they come off
  every roll, **nothing is deleted**, the family gets a record, and you can undo
- ☐ Pick *Transferred*, put "Oakfield Academy" in **where they went**, leave the
  date blank, write a line for their next school → **Record it**
- ☐ The note field says the **family reads this**. It is not an internal note

### What it did

- ☐ The directory gains a **Left (n)** tab, beside *Paused*. **⚠️** They are two
  different facts — a school in September needs to know which children are
  coming back
- ☐ Their row says *Left …* and *went to Oakfield Academy*
- ☐ **⚠️** Open the class they were in → they are **off the roll**
- ☐ **⚠️** Open a register from last term → their marks are **still there**.
  Open their progress report → attendance and marks intact. The school still
  holds everything; it just is not teaching them
- ☐ Their **family** gets a notification. Tap it → it lands on the page the
  record is actually **on**, not one click short of it

### They cannot get back in

- ☐ Sign in as that pupil → **⚠️** their old school is closed to them. Not a
  blank page: they are sent away, and the register, their marks and their work
  are all refused
- ☐ **⚠️** This is the database, not the screen. Nothing was revoked by hand —
  every query already filtered on `leftAt`, and the tenant set went empty

### The record travels — the block that matters

- ☐ Join that same child to **Oakfield** (join code, or an invite)
- ☐ As the child, `/student/profile` → **Schools you have been to** → the
  Riverside record, with the dates, the grade they left in, and attendance
- ☐ As **Sam (Oakfield admin)**, open that child's progress report →
  **Before … came here** → the same record
- ☐ **⚠️ NOW THE HALF THAT MUST FAIL.** Still as Sam, take the child's *Riverside*
  membership id and paste it into `/reports/<that id>` → **404**. Oakfield can
  read what Riverside certified about a child who is now theirs, and **nothing
  else of Riverside's**
- ☐ **⚠️** Take a child who has **never** been to Oakfield, record them as
  leaving Riverside, and check Sam cannot reach their record by any route. The
  clause is a handover, not a browse
- ☐ **⚠️** The figures on the record do not move. Mark another Riverside register
  for that child, or publish another report card, then reopen the record — the
  numbers are the ones from the day it was issued. A certificate that recomputes
  is a query wearing one
- ☐ Rename Riverside in `/admin/settings`, reopen the record → it still says the
  **old name**. A certificate signed in 2026 does not start saying something else
  because the school rebranded

### Undoing it

- ☐ Back as Priya, `/admin/people` → **Left** tab → **Undo leaving**
- ☐ They are back on the directory, and can sign in again
- ☐ **⚠️** They are **not** back in their classes — that is the school's decision,
  one click away on the class page. Guessing would re-add a child to a class the
  school had moved them out of
- ☐ **⚠️** The record is **gone**, from the child's profile too. A retracted
  certificate must not still be readable by the school it was shown to
- ☐ Their marks and attendance are untouched

### Not for staff

- ☐ **⚠️** A teacher's row has no **Left** button. Try the action anyway and it
  is refused. A departing teacher is owed a reference, not a document describing
  their attendance

---

## 12x. Listing an expert, and what they agreed to offer

### The queue

- ☐ Sign in as the server operator → `/root` → **Experts**
- ☐ **⚠️** An expert who has accepted an invitation appears under **Waiting for
  you**, not mixed into the list of people already dealt with
- ☐ **⚠️** Open `/experts` as a school admin — that person is **not** there
- ☐ Back in `/root/experts`, press **List them**
- ☐ **⚠️** Now they appear on `/experts`, and **without** a Verified badge.
  Listing and identity-checking are separate claims
- ☐ Press **Mark identity checked** → the badge appears
- ☐ **⚠️** Try to list somebody whose profile has no headline → refused. A blank
  card in a marketplace is worse than an empty marketplace

### What they offer

- ☐ As the expert, `/expert/profile` → choose **Workshops and sessions**
- ☐ **⚠️** As an admin, try to set up a mentorship with them → refused
- ☐ Switch them to **Mentoring one child at a time**
- ☐ **⚠️** On `/experts` their card says so and offers **no booking button**
- ☐ Set **Both**, and a cap of **1**
- ☐ Pair one child with them. Try a second → refused
- ☐ **⚠️** Now do the second from a **different school**. Still refused — the cap
  is a promise to children, not a per-school allowance
- ☐ End the first mentorship → a place frees up
- ☐ **⚠️** Take them off the list. The child who has them as a mentor **keeps
  them** — it stops them being found, not being anybody's mentor

---

## 12y. Birthdays on the calendar

- ☐ Accept an invitation and fill in **Your date of birth** (dd/mm/yyyy)
- ☐ **⚠️** Leave it blank on another invitation — it still accepts. Optional
- ☐ `/admin/calendar` → **Birthdays**
- ☐ Names, dates in **dd/mm/yyyy**, ages, and Student/Teacher badges
- ☐ **⚠️** Somebody recorded as having **left** does not appear
- ☐ **⚠️** Somebody **paused** does not appear
- ☐ **⚠️** Sign in as a pupil and try `/admin/calendar` → redirected. A date of
  birth is what a parent proves a claim with, so this is staff-only on purpose
- ☐ **⚠️** A school with nobody's birthday on file gets a sentence explaining
  that dates arrive as people join — not an empty box that reads as broken

---

## 12w. An alumnus — signed in, no school, record intact

**The state nothing else in this file reaches.** Set it up by recording the same
pupil as having left **every** school they are at.

### They are not sent to a join code

- ☐ Sign out, then log in as that pupil
- ☐ **⚠️** You land on `/record`, not on "join with a code". There is no code
  that helps somebody who is not joining anything

### What they keep

- ☐ **⚠️** Every school they attended, newest first, each marked **Left**
- ☐ Each school's attendance **percentage and day count** — and a school where
  no register was ever marked says so, rather than showing 0%
- ☐ Each school's **published** report cards, with the assessments on them
- ☐ **⚠️** An unmarked assessment shows **—**, never 0
- ☐ **⚠️** A **draft** report card appears nowhere. Ask a teacher to leave one
  in draft and check again
- ☐ The leaving certificate for each school, with where they went
- ☐ Badges they earned
- ☐ **⚠️** "Frozen as this school left it" on every school they have left

### What they do not keep

- ☐ **⚠️** Type `/bulletin` into the address bar → redirected
- ☐ **⚠️** `/student/practice` → redirected. Adaptive quizzing is a school's
- ☐ **⚠️** `/student`, `/student/grades` → redirected
- ☐ **⚠️** There is **no navigation** on the record page to any of them. This is
  not a hidden button; the shell does not exist here
- ☐ Sign out works from the record page (it is the only other control)

### Their parent, too

- ☐ Log in as a guardian of that pupil
- ☐ **⚠️** The same journey, across every school the parent is linked at
- ☐ **⚠️** One child at two schools appears **once**, not twice
- ☐ **⚠️** Change the URL to another family's child id → **404**, never "that is
  not your child"

---

## 12u. A transfer done properly — the new school invites

**This is the path that does not fork**, and the one a school should actually
use. Do it with a pupil who has a real email address.

- ☐ As the OLD school's admin, `/admin/people` → **Left** on that pupil
- ☐ As the NEW school's admin, `/admin/invites/new` → invite them at **the same
  email address**
- ☐ Open the link (dev mailbox at `/dev/mailbox`)

### What the invitation says

- ☐ **⚠️** The heading reads **Add {new school} to your account**, not "Join"
- ☐ **⚠️** There is **no password field at all**, and the page says *your
  password does not change*
- ☐ **⚠️** It names the address, and says the record from their last school
  travels with the account
- ☐ Accept it

### What it did

- ☐ **⚠️** `/student/profile` shows the old school's record — with **no merge
  needed**, because it was always on this account
- ☐ **⚠️** Sign out and log in with the password they had **before** the
  transfer. It works. It was never overwritten
- ☐ `/switch` shows both schools on one account

### And the other direction still works

- ☐ Invite a brand-new address. The password field **is** there, and is required
  — an account with no password could never be signed into again

---

## 12v. Removing a pupil — the third verb

- ☐ `/admin/people` → a pupil's row now offers **Pause**, **Left** and
  **Remove**. Three different facts

### It refuses anybody who was actually here

- ☐ Pick a pupil with attendance or marks → **Remove** → **Remove them**
- ☐ **⚠️** Refused, and it names **what** is in the way with counts — "3 days on
  a register", "1 mark" — not just "cannot remove"
- ☐ **⚠️** It points at **Left** as the thing that keeps the record
- ☐ They are still in the directory

### It removes somebody who never was

- ☐ Add a pupil to a class, then immediately **Remove** them
- ☐ Gone from the directory, and the headline count drops by one
- ☐ **⚠️** Gone from the class roll too — no ghost on the register
- ☐ **⚠️** Their **account still exists**. They may be a pupil at another school
  or somebody's parent; a school may not delete a person
- ☐ **⚠️** `/admin/safety` shows the removal. It is the only evidence left that
  they were ever on the roll

### What it will not touch

- ☐ **⚠️** A teacher's row has **no** Remove button
- ☐ **⚠️** Your own row has none either
- ☐ Somebody already recorded as having **Left** has none — that is a document,
  and undoing the leaving is the honest route

---

## 12t. Joining two accounts, which is what a transfer really leaves behind

**Set the fork up first**, because it is the default outcome and not an edge
case: after §12s, sign out and **join the new school with a code** (`/join` →
I'm a student). That mints a SECOND account. Note both login names.

### The gap, before you fix it

- ☐ Signed in as the NEW account, `/student/profile` shows **no** "Schools you
  have been to". The certificate exists — it is on the other account
- ☐ **⚠️** This is the whole reason the feature exists. If you can see the old
  school here, you are signed in as the old account

### Joining them

- ☐ `/account` → **Another account?** → **Join them**
- ☐ Enter the old login name with a **wrong** password. The refusal is generic
- ☐ **⚠️** Enter a login name that does not exist at all. **Word for word the
  same message.** Anything else makes this a way to ask which logins are real
- ☐ Now the right password → a confirm screen naming **the person, the school
  and the date they left**, in dd/mm/yyyy
- ☐ **⚠️** Nothing has happened yet. Press **No, go back**, then check
  `/student/profile` — still no previous school. The screen most likely to be
  reached by mistake must be safe to reach by mistake
- ☐ Do it again and press **Yes, join these accounts**

### What it did

- ☐ **⚠️** `/student/profile` now shows the old school, its dates, the
  attendance figure and the report-card count — the leaving certificate, on the
  account they actually sign in with
- ☐ `/switch` lists **both** schools on this one account
- ☐ **⚠️** Sign out and try the OLD login name and password. It is refused. That
  sentence is written on the confirm screen, so it is a promise
- ☐ Sign back in with the new one; everything is still there

### What it must refuse

- ☐ **⚠️** Enter **your own** login name and password. Refused, and it says so
  plainly rather than generically — you have just proved that account is yours
- ☐ **⚠️** Try the same merge a second time. Refused: that account is gone
- ☐ If either account has two-factor on, the password alone is **not** enough —
  a code is demanded. This is the check that stops the merge being a way past
  somebody's second factor

### The thing that is not there

- ☐ **⚠️** Sign in, then visit `/join`. You are still told to sign out and start
  again — there is no "add this school to my account". So the fork happens by
  default and this page repairs it afterwards. Known, and in the README

---

## 12r. The expert's own profile

The rest of the expert and mentoring flow has **never** had a section here, and
still does not — see Known gaps. This covers the page that was a **404** in the
expert's side rail and their ⌘K palette for months while nothing noticed.

Sign in as an expert first: `npm run expert:invite -- them@example.com`, accept
the link, or set `publishedAt` on an `ExpertProfile` by hand.

- ☐ `/expert` → the side rail shows **Profile**. Click it → it **opens**. It used
  to 404 from here and from ⌘K
- ☐ Fill in a headline, a description, where you work → **Save profile** →
  reload → still there
- ☐ Clear the headline → **refused**. It is the first thing a school reads
- ☐ Add specialisms one at a time → they become chips. Add the same one again in
  different case → **not** duplicated. Add a blank → nothing happens
- ☐ Keep adding → it stops at **12** and the box says so
- ☐ Remove one by clicking its ✕
- ☐ Type a timezone that does not exist → **refused**, and the old one is kept.
  Silently correcting it to UTC would put your slots at an hour you did not mean
- ☐ **⚠️ THE ONE THAT MATTERS.** *Listed* and *Verified* are shown at the top and
  there is **no control for either**. Whoever runs the server decides whether a
  school can see you; a profile that could publish itself would make that step
  decorative
- ☐ An **unpublished** expert is told why nobody is booking them, rather than
  being left with an empty bookings page
- ☐ Correct your headline while **published** → you stay listed. Check
  `/experts` as an admin → the corrected headline, still there
- ☐ Sign in as an **admin or teacher** and open `/expert/profile` → sent away

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
- ☐ **⚠️** As Tom: `/root` → sent away. The operator area is not a school role
- ☐ **⚠️** As Tom: `/principal`, `/principal/classes`, `/principal/leave` →
  sent away
- ☐ **⚠️** As a **principal**: `/teacher/attendance`, `/admin/people`,
  `/admin/classes/new` → sent away. They read the school and decide leave; they
  do not mark registers or set it up
- ☐ **⚠️** As a **pupil** or a **parent**: `/admin/calendar` → sent away. Staff
  leave appears there
- ☐ **⚠️** As a pupil: `/report-cards/<their own DRAFT card>` → **404**
- ☐ **⚠️** As a co-teacher of a class:
  `/teacher/classes/<id>/report-cards` → **404**
- ☐ **⚠️** With register duty withdrawn: `POST /api/attendance` for that class →
  **403**. The page hiding it is not the boundary
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

Every route in the navigation now renders — all 235 checks in `npm run sweep`
were requested as a signed-in user of the owning role and returned the status
that role should get. **That claim is now derived rather than maintained**: the
sweep reads the navigation model itself and follows every static link, so "every
route in the navigation" means the actual list. It did not used to, which is how
`/expert/profile` sat in the expert's side rail as a 404 for months.

Still not built, per the README: a real QR code on the join poster, awards
uploads on the student profile, competition **leaderboards** (entering one IS
built — see §12g), cross-school moderation, progress-report export, SSO, SMS,
real email delivery.

**Built but with no section here:** the expert marketplace, booking an expert,
and mentoring threads. Only the expert's own profile (§12r) is covered, because
that is the page the role audit found broken. The rest is untested by hand.

Built since this list was last trimmed, and now with sections of their own:
global feed, weighted grade categories, suspend-user (§12l), two-factor
authentication, the operator area and its server log (§12m), class sections and
register duty (§12n), staff leave (§12o), report cards (§12p), the principal's
dashboard (§12q), the expert's profile (§12r) and a pupil leaving school with
their record (§12s).

**§12m0 is new and should be walked first.** It is the only section that tests
the JOINS between screens rather than a screen, and the first time anybody
walked it, it turned up five bugs — every one of them on a page that was
returning 200 the whole time.

These are absent rather than linked-and-broken. If you find a nav link that
404s or 500s, that is a bug now, not a deliberate gap — and check it while
signed in as the owning role, because a redirect to `/login` will hide both.

**And the newest lesson, which cost eight bugs at once: a page that renders is
not a page anybody can reach.** Six of the eight gaps a role-by-role audit found
were a capability built correctly, authorised correctly and tested correctly,
with nothing linking to it — or a link pointing at nothing. Unit tests exercise
functions that exist; a route sweep exercises URLs somebody typed into it. Only
a person clicking finds a missing link. When you walk a role here, **walk it by
clicking**, never by pasting URLs from this document — the URLs are here so you
can check where you ended up, not so you can skip the journey.

**And the corollary that four bugs in a row have now taught this codebase: walk
the signed-OUT sections too.** Registration (§2), invitations (§5), student
self-join (§7) and the parent claim (§8) all happen before anybody has a session,
a membership or a school — and that is precisely the state tenant scoping breaks
in, silently, while every signed-in page keeps working. If a join code ever reads
"we could not find that code" for a code straight off the seed, the bug is not in
the code.
