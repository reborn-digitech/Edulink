# EduLink app — UI/UX review checklist

One row per screen under `apps/mobile/src/screens/{family,staff,teacher}/`
(27 screens; `shared.tsx` and `support.tsx` are helpers, not screens). The
columns are the plan's items. Every cell says **how** it is verified, because
"looks fine" is not a method:

- **Code** — a property of the shared components or the lint/type gates, so
  every screen has it or the battery fails. What exactly is named in the
  legend below; the screen-level note says what the screen adds.
- **Person** — somebody looks, against the CI screenshots the Playwright
  layer at `apps/mobile/e2e/screens/` produces: **2 themes × 3 languages** per
  screen. A cell marked **Person (not in screenshots)** is one the screenshots
  cannot settle either — it needs a device in the hand, or a device set to a
  larger text size — and says so.
- **Test** — a jest test in the mobile battery asserts it; the result at the
  time of writing is quoted, honestly.

Nothing in this file was checked on a phone or a simulator: this Mac has
neither. The code column holds; the person column is a to-do list for the
first review against the screenshots.

## Legend — what the code verifies, and what it does not

| Item | Verified by code | Not verified by code |
|---|---|---|
| **Touch targets (48 pt)** | `tokens.tap = 48` (`packages/tokens/src/index.ts`). `Button` sets `minHeight: t.tap` and `hitSlop: 4`; `Row` (when pressable) `minHeight: t.tap`; `Field`'s input `minHeight: t.tap`; every raw `Pressable` in the screens and in both `shared.tsx` files (tabs, chips, radio chips, the status chips of the register, the language row, the child switcher, the bulletin reactions) sets `minHeight: th.tap` — `grep -n "<Pressable" -A6 src/screens` finds no exception. The tab bar is `minHeight: 56`. | Width. `minHeight` bounds height only; a chip's width is its label plus `space[3]`–`space[4]` padding, so a one-letter chip ("P") is wide only because the register's chips are `flex: 1`. Nothing measures a rendered box; there is no layout assertion in jest. Sizes were never seen on a device. |
| **Contrast, both themes** | No colour is typed into a screen: `react-native/no-color-literals` is an `error` in `eslint.config.js`, and `grep "#[0-9a-f]{3,6}" src/screens` finds none. Every colour is a token from `@edulink/tokens`, whose values mirror the web's `globals.css` (a test in the web app refuses drift), and the web's palette passed Lighthouse accessibility 100 on ten routes in both themes. `Text` takes its colour from a tone (`fg`, `muted`, `subtle`, `accent`, `danger`, `ok`, `warn`, `inverse`) and never a literal. | The **pairings**. The web audited its own foreground/background pairs; the phone puts the same tokens together in its own ways — `subtle` text on `surfaceMuted` (a `Stat`), `accent` text on `accentSoft` (a selected chip), the status-chip colours on their soft partners, `warn` text on `bg`. A token pair the web never draws was never audited. The screenshots (2 themes) are where a person checks these. A server-supplied class colour (`item.classColor`, a 6 pt stripe in `assignments.tsx`) is decorative and carries no text. |
| **Font scaling** | Every word goes through `Text` (`src/components/text.tsx`), which leaves `allowFontScaling` on and caps at `maxFontSizeMultiplier={2}`; `Field`'s `TextInput` scales too (default). Sizes come from the type scale in points, never pixels. | Whether the **layout survives 200 %**: fixed widths (`LessonList` 96 pt column, `Stat` `minWidth: 120`, `Figure` `minWidth: 140`, tab bar label `fontSize: 11`, the marks grid's per-pupil fields, chips that wrap vs. rails that scroll). The CI screenshots are taken at the default text size, so this is **Person (not in screenshots)**: a device with Larger Text on. |
| **Three languages** | Every string is `t("key")`: `grep 'label="[A-Z]\|title="[A-Z]\|placeholder="[A-Z]'` over the screens finds only `placeholder="YYYY-MM-DD"` (a date format, the same in all three languages). `hi.ts` and `mr.ts` are typed `Dictionary = typeof en`, so a missing key is a compile error; `useT` returns the key itself when a lookup misses, which makes a gap visible in a screenshot. Dates go through `Intl` with the reader's locale. | **Fit**: Hindi and Marathi run longer than English, and a chip, a tab label or a `Stat` caption may wrap or clip. Names, subjects and class names are server data and stay as entered (`"Mathematics"`, `"ZZ Grade 3 · A"`). The screenshots (3 languages) are where a person checks fit. |
| **One-handed reach** | Where the primary action sits in the tree is readable from the source and is noted per screen. `Screen` puts the title at the top and scrolls the body; a `Card`'s `action` slot is its **top-right** corner. | Reach is a property of a hand on a device. The screenshots show placement at phone size, so a person can see whether the action lives in the lower half; they cannot show a thumb. **Person (screenshots show placement, not reach)**. |
| **No dead ends** | `apps/mobile/test/components/no-dead-ends.test.ts` reads every screen source and requires every `<Empty …>` to carry `action=` (the door prop of `Empty` in `src/components/states.tsx`). | Doors that are on the screen but not on the `Empty` (a tab row above it, a Back button, a card-header button) — the test counts those as dead ends by design, because a person who has scrolled to the empty box is looking at the box. Empty lists drawn as a plain `Text` rather than `<Empty>` are outside the test. |

**No-dead-ends result at the time of writing (jest, `--ci`): FAIL — 37 of
43 `<Empty>` usages have no `action=`.** The six with a door: `parent-home:44`
(Link another child), `staff/people:116, 118` (Clear filters, Invite people),
`staff/classes:125, 127` (Clear search, Create a class), `staff/staff:64`
(Clear all). Line numbers are as of the working tree at the time of the run;
`family/exams.tsx` and `teacher/marks.tsx` were being edited by another hand.

## Screens

**Codes:** C = code · P = person against the CI screenshots · P! = person, not settled by the screenshots either · T✓ / T✗ = the jest test passes / fails for this screen.

### family/

| Screen | Touch targets | Contrast (2 themes) | Font scaling | 3 languages | One-handed reach (primary action) | No dead ends |
|---|---|---|---|---|---|---|
| `assignments.tsx` | C — Tabs, Rows, Buttons, Field all tap-height. Width: the three tab labels share one row (P in hi/mr). | C palette · P pairings: the `Pill` tones, the class-colour stripe, the `Note` boxes (ok/accent). | C `Text` · P! the `WorkCard` stripe row and a 3-tab row at 200 %. | C · P fit of "To do / Handed in / Marked" with counts in one row. | Pupil: **Hand it in** sits inside each work card, mid-scroll, then the panel's own button under the text box — lower half once open. Guardian: read-only, no primary action. P. | T✗ — `:67` (guardian, all three tabs) and `:136` (pupil) have no door. Needs: `:67` a door to Messages ("message the teacher") or the other tab; `:136` a door to Practice or the timetable. |
| `attendance.tsx` | C — month buttons, `messagesPageLink` ghost button. | C · P the register `StatusBadge` colours on their soft partners in dark. | C · P! the month grid (if drawn as fixed cells). | C · P long month names in hi/mr in the header line. | Month navigation (**Previous / Next / This month**) at the **top** of the body — a reach concern; "messages page" link mid-screen. P. | T✗ — `:83` (nothing in this month) and `:140` (register not taken yet) have no door. Needs: `:83` a "Previous month" door; `:140` a door to the timetable or Overview. |
| `bulletin.tsx` | C — the reaction chips set `minHeight` **and** `minWidth: th.tap`; Load more is a Button. | C · P reaction chip selected state (`accentSoft`) in both themes; post images are content. | C · P! post cards with images and a reaction rail at 200 %. | C · P reaction labels with counts. | Reactions per post, inline; **Load more** at the foot — reachable. P. | T✗ — `:83` (no school) and `:85` (empty feed) have no door. Needs: `:83` "Link a child" (the web's `/parent/link`); `:85` "Open on the web" or Overview. |
| `exams.tsx` | C — Tabs, kind Chips, Rows; **Back / Share** are Buttons in one row. | C · P the report card `Figure` (`muted` on `surfaceMuted`), the draft `Note` (warn). | C · P! `Figure` `minWidth: 140` × 2 in a row — likely to wrap at 200 %; tab row of three. | C · P tab labels with a count ("Report cards 3") in hi/mr. | **Back / Share** are the first row of the card view — **top of the screen**, a reach concern; tabs also at the top. P. | T✗ — `:81` (no marks), `:87` (nothing upcoming), `:117` (no report cards) have no door. The tab row above is a way out, but not on the box. Needs each: a door to the neighbouring tab (Upcoming / Marks) or to Overview. |
| `meetings.tsx` | C — **Book** per slot, **Cancel** per booking (ghost Button in the Row's right slot), child Chips. | C · P the `Note` (ok) and the slot separators (`border`) in dark. | C · P! a slot's time line and location in one `xs` line; Chips rail. | C · P "With {teacher} · about {child}" as a Row title in hi/mr. | **Book** under each slot, in the list — mid to lower screen; Cancel sits in the Row's right slot. P. | T✗ — `:25` (any role but a guardian) and `:100` (no open times) have no door. Needs: a door to Messages (ask the teacher) or Overview. |
| `parent-home.tsx` | C — Rows, card-header ghost Buttons, **Link another child** Button. | C · P `ExamMarksCards` percent figure, the "child left" `Note` (warn). | C · P! cards with a header action beside a long title (`flexWrap` is on). | C · P card titles with the child's name in hi/mr ("{name}’s lessons today"). | Card-header actions (**Open the timetable**, **Open**) sit **top-right of each card**; **Link another child** at the foot. Reach is mixed. P. | T✗ — `:175` (no messages) has no door; `:44` (no children) has **Link another child** (T✓ for that one). Needs `:175`: the card's own **Open** door repeated as the Empty's action. |
| `practice.tsx` | C — **Open on the web** Button, Rows, Chips. | C · P the goal progress bar (`accent` on `surfaceMuted`, 6 pt tall — a thin bar in dark), the medal icon. | C · P! two Chips rails and the `2xl` figure at 200 %. | C · P level names and "{seen} of {total} tried" lines in hi/mr. | **Open on the web** is the **first element under the title** — top of the screen, a reach concern; topic Rows open the web too, so each row is a door within reach. P. | T✗ — `:52` (guardian, nothing tried) and `:102` (pupil, no topics) have no door. The pupil's screen has the web door above the box, not on it. Needs: `:52` a door to Overview or the web; `:102` the same **Open on the web** as `action=`. |
| `student-home.tsx` | C — Rows, card-header ghost Button, `ExamMarksCards` see-all Button. | C · P the streak/`Pill` tones, `Stat` tiles. | C · P! `Stat` row (`minWidth: 120` each) wrapping. | C · P "Hi {name} 👋" and the "{count} to do" lines. | Card-header **Open the timetable** top-right; assignment Rows mid-screen. P. | T✗ — `:65` (nothing due) has no door. Needs: a door to Assignments or Practice. |
| `timetable.tsx` | C — week buttons (Previous / This week / Next), `LessonList` rows are `minHeight: tap` (not pressable). | C · P the `LessonList` period column (`muted` on `surface`). | C · P! the 96 pt period column beside the subject at 200 % — the likeliest clip in the app. | C · P weekday names from `Intl` in hi/mr; "Previous / Next" labels. | Week navigation at the **top** of the body — a reach concern. P. | T✗ — `:66` (no timetable yet) and `:68` (nothing this week) have no door. Needs: `:66` Overview; `:68` **Previous week / This week** as the action. |

### staff/

| Screen | Touch targets | Contrast (2 themes) | Font scaling | 3 languages | One-handed reach (primary action) | No dead ends |
|---|---|---|---|---|---|---|
| `admin-home.tsx` | C — five door Buttons, card-header ghost Buttons, Rows. | C · P `Stat` tones (warn/danger) on `surfaceMuted`. | C · P! stat tiles and card headers with actions. | C · P long admin sentences ("Exams: {scheduled} scheduled…"). | The doors (**Update the calendar**, **Set up the year**, **Open the timetable**) are spread down the body; card-header actions top-right. P. | No `<Empty>` on this screen; empty lists are plain `Text`. T not applicable — P: each text-only empty should name where to go. |
| `calendar.tsx` | C — window Chips, **Add** Button (admin), Rows. | C · P entry kinds if drawn in tones. | C · P! Chips rail. | C · P the `calendar.*` sentences. | **Add** (admin only) sits above the list — upper half; the list itself is read-only for the principal. P. | T✗ — `:65` (nothing yet / nothing ahead) has no door; the admin's **Add** is above it, the principal has nothing. Needs: `action=` "Add" for the admin, "Whole year" (switch the window) for both. |
| `class-detail.tsx` | C — card-header Buttons (**Class staffing**, attendance history), Rows. | C · P `Stat` tiles; percent figures in `danger`. | C · P! stat row and the roster rows with a right-hand figure. | C · P "Who marks" / "Everybody" headers. | Doors are **top-right card actions** — a reach concern on a large phone. P. | T✗ — `:94` (nobody on roll) has no door. Needs: the **Class staffing** / admit door as `action=`. |
| `classes.tsx` | C — search Field, Chips, Rows, Buttons. | C · P grade chips selected/unselected in dark. | C · P! search + chips rail + rows. | C · P "No results" copy and the chip labels. | Search field at the **top**; rows below. No single primary action. P. | T✗ — `:71` (principal, no classes) has no door; `:125` (no matches → **Clear search**) and `:127` (no classes → **Create a class**) have doors (T✓ for those two). Needs `:71`: the same **Create a class** web door. |
| `leave.tsx` | C — cover Chips, note Field, **Approve** / **Decline** / **Confirm decline** Buttons. | C · P the `Notice` (okSoft/dangerSoft), the cover box (`surfaceMuted`), `warn` status text. | C · P! a request card: date line, balance line, cover chips that wrap, two buttons in a row. | C · P "Approve and arrange cover" (long in hi/mr) in a half-width button. | **Approve / Decline** at the **foot of each request card** — lower half while the card is in view. P. | T✗ — `:60` (nothing waiting) has no door. Needs: a door to the calendar or to "Already decided". |
| `people.tsx` | C — tabs, search, Chips, Rows, revoke Buttons. | C · P role/status pills. | C · P! search + chips + rows. | C · P "Invite people", role names. | Search at the top; invite door top-right; rows. P. | T✗ — `:193` (no invites pending) has no door; `:116` (**Clear filters**) and `:118` (**Invite people**) have doors (T✓ for those two). Needs `:193`: **Invite people** as the action. |
| `principal-home.tsx` | C — window Chips, Rows, card-header ghost Buttons. | C · P attendance percent in `danger`, `Stat` tones. | C · P! stat row, rows with right-hand figures. | C · P "Attendance below {percent}% over this window". | Doors are **card-header actions (top-right)** and Rows. P. | T✗ — `:73` (no classes) has no door. Needs: the **Create a class** web door. |
| `reviews.tsx` | C — status Chips, `MultiChips` (checkbox chips), date Field, **Open a round** Button. | C · P checkbox chips (`accentSoft`) vs radio chips (`accent`) in dark. | C · P! a wrapping `MultiChips` grid at 200 %. | C · P round names and the status filter. | **Open a round** at the **foot of the form** — reachable. P. | T✗ — `:76` (no rounds) has no door. Needs: a door to the form below (or the web's reviews page). |
| `staff.tsx` | C — search, Chips, Rows. | C · P designation/subject pills. | C · P! search + chips + rows. | C · P "Class teacher of {classes}" captions. | Search at the top; rows. P. | T✗ — `:66` (no staff yet) has no door; `:64` (no matches → **Clear all**) has one (T✓). Needs `:66`: **Invite people** web door. |

### teacher/

| Screen | Touch targets | Contrast (2 themes) | Font scaling | 3 languages | One-handed reach (primary action) | No dead ends |
|---|---|---|---|---|---|---|
| `class-detail.tsx` | C — two Buttons under the stats, Rows. | C · P `Stat` tones (ok/warn/danger), `warn` "No guardian" text. | C · P! four `Stat` tiles (`minWidth: 120`) and two buttons in a row. | C · P "Mark the attendance" / "Enter exam marks" side by side in hi/mr. | **Mark the attendance** / **Enter exam marks** directly under the stats — **upper third**, a reach concern. P. | T✗ — `:57` (nobody joined) has no door. Its body says "Share the class code above", but this screen shows no code. Needs: a door to the web's class page (join code) as `action=`, and a body that does not point at something absent. |
| `classes.tsx` | C — Rows. | C · P "Attendance done / to do" in ok/accent. | C · P! rows with a two-part right slot (text + caret). | C · P captions "{subject} · {room} · {count} students". | Rows only. P. | T✗ — `:26` (no classes assigned) has no door. Needs: a door to Messages or More. |
| `home.tsx` | C — Rows, **Open the timetable** ghost Button. | C · P `Stat` tones, "Covering" accent text. | C · P! the stat row and lesson rows. | C · P "{count} still to take." and lesson captions. | Register Rows in the first card — upper half; timetable door mid-screen. P. | T✗ — `:34` (no classes yet) has no door. Needs: a door to More / Notifications or the timetable. |
| `leave.tsx` | C — Fields, kind Chips (`minHeight: tap`), cover Chips, **Send to the principal** Button. | C · P selected chip (`accentSoft` + `accent` text) in dark; balance card. | C · P! the wrapping chip groups and the multiline reason box (`minHeight: 96`). | C · P the long hint sentences ("The principal reads this…"); `YYYY-MM-DD` placeholder is a format, not a word. | **Send to the principal** at the **foot of the form card** — reachable after scrolling. P. | T✗ — `:135` (no requests yet) has no door; the form is directly above it. Needs: `action=` that scrolls to / names the form ("Apply for leave"), or drop the box for a line of text. |
| `marks.tsx` | C — Rows, paper chips (`minHeight: tap`), per-pupil Fields, **Save marks** Button, **Classes** ghost Button in the card header. | C · P paper chip selected state; `warn` unweighted note; `ok` saved note. | C · P! the paper chips wrap (`flexWrap`); a long paper label ("Mathematics · Term 1 (Unit test) · 6 Oct") at 200 %; one Field per pupil. | C · P paper labels mix server data and `t("exams.kind…")`. | **Save marks** at the **foot of the sheet card** — end of scroll, reachable. P. | T✗ — `:98` (no classes), `:110` (no papers), `:155` (empty roll) have no door; `:110` has the card's **Classes** action beside it, not on it. Needs: `:98` More/Messages; `:110` the **Classes** door as `action=`; `:155` the class page. |
| `messages.tsx` | C — Rows. | C · P unread markers, if toned. | C · P! rows with a timestamp right slot. | C · P conversation captions. | Rows only; no compose on this screen. P. | T✗ — `:41` (no messages yet) has no door. Needs: a door to People (start a conversation) or the web. |
| `register.tsx` | C — Rows; status chips are `Pressable` with `minHeight: tap` and `flex: 1` (so width is a quarter of the row); **Mark all present** and **Back** Buttons. | C · P the four status colours on their soft partners **selected**, and `fgMuted` on `surface` unselected — the pairings the web audited, but in the phone's chip shape; `warn` closed-day text on `bg`. | C · P! four chips in a row with one letter each; the "{marked} of {total} marked" line beside the save state. | C · P "P / L / A / E" are the `*Short` keys — check the hi/mr letters fit and mean something. | Status chips per pupil, inline down the list — within reach as you scroll; **Mark all {count} present** sits **above the roster** (upper half); **Back** at the very top. P. | T✗ — `:60` (no register today) and `:202` (nobody in class) have no door; `:202` has **Back** at the top of the screen. Needs: `:60` a door to Classes or the timetable; `:202` **Back** as the action. |
| `room.tsx` | C — message rows, composer Field, **Send** Button. | C · P own vs. others' bubbles (if toned), timestamps in `subtle`. | C · P! the composer row (Field + Button) at 200 %. | C · P "Say hello to {name}". | **Send** in the composer at the **foot of the screen** — reachable. P. | T✗ — `:74` (no messages in room) has no door; the composer below is the door in practice. Needs: either `action=` focusing the composer, or a plain `Text` instead of an `Empty`. |
| `thread.tsx` | C — as `room.tsx`. | C · P as `room.tsx`. | C · P! as `room.tsx`. | C · P. | **Send** at the foot. P. | T✗ — `:69` (no messages yet) has no door; same remedy as `room.tsx`. |

## Tally

27 screens × 6 items = **162 cells**.

| Item | Code-verified | Person-verified (screenshots) | Person, not settled by screenshots | Test |
|---|---|---|---|---|
| Touch targets | 27 (height, by component source) | 27 (width, in the screenshots) | — | — |
| Contrast, both themes | 27 (palette + no literals) | 27 (the phone's own pairings) | — | — |
| Font scaling | 27 (`Text` cap, scaling on) | — | 27 (layout at 200 % needs a device) | — |
| Three languages | 27 (every string through `t()`, typed dictionaries) | 27 (fit) | — | — |
| One-handed reach | 0 (placement is readable, reach is not) | — | 27 (screenshots show placement only) | — |
| No dead ends | — | 1 (`admin-home`, text-only empties) | — | 26 by the jest test: **0 pass, 26 fail** (37 `<Empty>` without a door) |

Honest reading: five of the six items have a **code half** that holds on every
screen — the shared components carry the property and the lint/type gates
keep a screen from stepping around them — and a **person half** that nobody
has done yet. Touch-target *width*, colour *pairings* and language *fit* are
the person half and the screenshots can settle them. Font scaling at 200 %
and one-handed reach cannot be settled from the screenshots at all. No dead
ends is the one item with a real test, and the test fails on 26 of 27
screens today; the per-screen "Needs" above is the list of doors to add.

## Doing the person half

1. Pull the CI screenshot artifact from `apps/mobile/e2e/screens/` (2 themes × 3 languages per screen).
2. For each screen, walk the row above; mark the P cells with a date and initials in a copy of this file, or move a finding into an issue.
3. For font scaling: an iOS simulator with Settings → Accessibility → Larger Text at the top of the scale (or a real device), each screen once, in English — the fit problems are geometric, not linguistic.
4. For reach: a real phone, one hand, the primary action named in the row — can the thumb land on it without shifting the grip?
