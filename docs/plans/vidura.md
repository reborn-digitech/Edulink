# Vidura — the assistant's next shape (plan of 12 October 2026)

Status: pass 1 built on 17 October 2026 (below); passes 2 to 4 planned, not built. The owner's decisions of 11–12 October 2026 and the coordinator's recommendations,
in four passes, each a builder's brief. Run with `/vidura <pass>` (`.claude/commands/vidura.md`). Pass 1 was
meant for the week of 12 October; passes 2 to 4 after the weekly reset of 17 October. Everything here sits on
the assistant as built in [assistant.md](assistant.md) (Phases A–D, the exam-scope reader, the data questions,
the user guide) and keeps its rules: the two scopes, the gates before and after the model, stripping, the
minors' policy (decision 0002), the counsellor route, caps, retention.

## The owner's decisions
1. The assistant is named **Vidura** in every language (code identifiers keep "assistant").
2. One entry point: a round button at the bottom right of every page opening a docked side drawer on desktop
   (the page stays usable beside it) and a bottom sheet on the phone; the rail entry, the phone-width top-bar
   launcher, the `/assistant` page and the phone's More entry go. History lives inside the drawer.
3. Three modes, picked by the gate and shown as a chip the person can change:
   - **Using Shalaghar** · शालाघर कैसे चलाएँ · शालाघर कसे वापरावे — how the platform works;
   - **My records** · मेरे रिकॉर्ड · माझ्या नोंदी — the person's own data, counts and links;
   - **Learning** · सीखना · शिकणे — concepts and the syllabus (pupils and teachers at a school, students and
     faculty at a college).
4. Questions in Hindi and Marathi must find the same help as English.
5. Personal questions ("my timetable for next week") answer with the data and where to see it on the platform.
6. Answers are organised: a fixed shape per mode, restricted Markdown, length by the question's kind (a
   definition 60 words, a how-to up to 250 with numbered steps, a worked explanation up to 350 with the check
   question, a data answer as long as its rows need), "go on" continuing a cut answer. No uncapped answers
   (time per answer, rambling, the gate's second pass, the school's budget).
7. College students' knowledge questions are answered (a law student's constitutional question today finds
   no passage because the college corpus is syllabi, not books).
8. Reference links: guide sections for platform answers; the book first for learning, then an operator-managed
   allow-list of public education sources (NCERT's channel, NPTEL, SWAYAM, Khan Academy India, India Code),
   shown to staff and adult students; to a pupil only if decision 0002 is relaxed for the allow-list. No Medium.

## The coordinator's recommendations (accepted into the plan)
- **Page-aware**: the drawer knows the page it opened on; "how do I do this?" resolves against that page's
  card and the person's data for it.
- **Suggested questions**: three chips on an empty drawer, per role and page, from the help index.
- **Ask a person**: when Vidura cannot answer, one tap to the right human (the office, the class teacher, the
  registrar) through the existing messaging rules.
- **Speaker-review queue** on the operator's panel for the Hindi and Marathi guide renderings and the
  generated items (one-shot publishing left no place for a native speaker).
- **"Explain this to me"** links beside a fee demand, a report-card line, an attendance figure, opening
  Vidura with that row in context.
- **Latency**: the two gate classifier calls on a small model (Qwen3-4B), the system prompt kept in the
  server's cache; roughly half the time to the first word.
- **Cached answers** for the common how-to questions, served from a checked answer, counted on the office's card.
- **Unanswered-questions report** on the operator's panel: refusals and discards by mode, role and school,
  counts only — where the guide and the corpus have holes.
- **Evaluation runs from the panel**, like generation: Start the nine sets, read the scores.

## The passes

### Pass 1 — what people see (about 10 to 14 points of an all-models week, on Opus)
The drawer and the button on web and phone (the old entry points removed; the axe matrix and the 360 px test
rewritten for the button and the drawer; Escape and focus return kept); the name Vidura in en/hi/mr keys, the
guides and the persona; the three modes (the gate's label → the chip; a manual switch re-routes the next
question); the answer shape per mode with restricted Markdown rendered in the drawer and on the phone, the
length rule, "go on"; suggested questions; page awareness; "Ask a person". Measured on the nine sets (the
refusal gate must stay 180/180) and the metrics set; a live walk of every actor's home with the drawer.

**Built, 17 October 2026 (pass 1).** One entry point: the round button at the bottom right of every page
(`components/nav/app-shell.tsx`, drawn where `accessTo(["ASSISTANT"])` in `signed-in-shell.tsx` says Vidura is the
person's, as the way to the plan card where only the plan is missing) opening `components/assistant/drawer.tsx`, docked
and not modal at a desk's width, a modal bottom sheet below it, the history inside; the menu entry, the rail's button,
the top bar's launcher and the `/assistant` pages are gone (`/assistant` sends the person back with `?vidura=open`).
The phone: `screens/shared/vidura.tsx` (the button above the tab bar and the sheet), the More entry gone. The name in
the dictionaries (`assistantUi`, the new `viduraUi`), the seventeen guides and the persona (`prompt.ts`). The three
modes as `AssistantChip` (contracts), the gate's label made the chip (`vidura.ts`, kept in the message's `mode`
column, HELP and TUTOR read as before), a person's pick re-routing the next question only between the scopes the gate
allows (`gate.ts` `prefer`). The answer's shape per mode in restricted Markdown (`prompt.ts`; one parser for both
apps, `packages/contracts v1/assistant-markdown.ts`, narrowed before the answer gate), the length rule as token caps
by kind and language (`config.ts` `ANSWER_TOKENS`), "go on" for an answer cut at its cap (at most twice, each a
question of the day). Suggested questions (`suggestions.ts`, `GET /api/v1/assistant/suggestions`), page awareness
(`page` on the ask, the page's card first for a question pointing at it, the doors its data comes from), "Ask a
person" (`ask-person.ts`, through `POST /api/v1/shared/conversations`). The builder's report has the measurements.

### Pass 2 — languages and personal answers (8 to 12 points)
The question rendered into English by the local model for retrieval only (the answer in the question's
language); the guide sections indexed in Hindi and Marathi renderings made once by the local model, marked
unreviewed, with the speaker-review queue on the operator's panel; week and day offsets in the data router
("next week", "tomorrow", "last month"); composite answers (data, then "where to see it"); "Explain this to
me" links on the family's and the staff's own pages. Measured: the help set's Hindi and Marathi page-named
scores (21/30 and 25/29 today) and the metrics set.

### Pass 3 — speed and operations (6 to 9 points)
The small-model gate and prompt caching (time to first word before and after, pasted); cached common
answers with their count; the unanswered-questions report; evaluation runs from the panel.

### Pass 4 — college knowledge and references (8 to 12 points)
The college tutor searching the whole corpus first (NCERT 11–12, NIOS), then public-domain legal texts (the
Constitution, bare acts from India Code), NPTEL and SWAYAM material, a licensed Wikipedia subset for the
professional streams, each named as a source; the reference allow-list managed by the operator and shown by
role under decision 0002. Measured on a new college knowledge set (ten questions a stream).

## Costs and capacity (for the record)
- Serving: about 4,000 tokens a question with the gate; three questions a school day per active user ≈ 2.4 M
  tokens a year ≈ ₹40–80 per active user per year on a hosted API, or a fixed ₹2–3 lakh a year per mid-range
  GPU (8–16 questions in flight, ~2,000–4,000 registered users at that rate; an 80 GB GPU four times that).
- The generator and the crawler run from the owner's laptop always: a one-way push of their output to the
  hosted database and a small polling agent so the panel's Start and Stop reach the laptop (about a day).
