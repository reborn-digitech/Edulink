# The assistant and the quiz bank generator — plan of 8 October 2026 (fourth draft)

**Parked on 8 October 2026.** The assistant is being built first, from [assistant.md](assistant.md); this file is
the quiz bank generator's plan, kept for when it resumes, and section 6 of the assistant's plan names the
pieces it will reuse.

Status: plan, not yet built. Decided by the owner so far:

- the quiz bank generator runs on the owner's own machine, on the Qwen family; no hosted model for it;
- questions carry an image where the chapter's exercise needs one;
- the difficulty ladder must be honoured and every distractor must be a real distractor;
- every type and level of question is generated for the whole corpus in one go; a generated item that
  passes the pipeline's own checks is PUBLISHED WITHOUT REVIEW, with its Hindi and Marathi, the moment it
  is loaded, and the app admins and the operator (never teachers) edit or take an item down afterwards
  (the owner, 11 October 2026; on 10 October it was "one stamp from either serves an item"; the teachers'
  question gig is switched off);
- generation is started and stopped from the bank desk (`/root/quiz-review`, `/appadmin/quiz-review`) as a
  background job on the machine the model runs on, which brings the model servers up when they are down
  and takes down only what it brought up (the owner, 11 October 2026);
- the corpus is the English books only; the Hindi and Marathi items are translations of the English
  items, with the boards' glossaries, read by native speakers;
- the assistant runs on the owner's machine first and is hosted only after that run has proved it;
- the assistant is on by default for everyone, minors included, with no opt-in step; curriculum
  questions are answered for students and teachers only, every other role gets platform help only.

Everything else below is the proposal; section 8 lists the gaps and the recommendations still waiting on
the owner's word.

## 1. What is being built

Two things that share a corpus and a retrieval layer:

- **The assistant.** A chat surface on the web and the phone that answers how the platform works, for
  every role, and curriculum and learning questions for students and teachers at any school or college.
  Platform-level, on by default (module `ASSISTANT`, on; a school may switch it off).
- **The quiz bank generator.** An offline pipeline on the owner's machine that drafts multiple-choice
  questions with distractors and a figure where needed, per chapter and per language, into the practice
  bank the app already has (`QuizTopic`, `QuizQuestion`, `QuizQuestionTranslation`, `content/quiz/*.json`,
  `npm run quiz:import`, `scripts/verify-quiz.ts`), for the app admins to review once.

Reused, not replaced: the practice bank with a source and a licence per question, the 1 to 6 difficulty
ladder (recall, understand, apply, analyse, competitive, olympiad), the structure verifier, the per-language
review stamps, `QuestionStat` (how children actually answer); the API catalog (1,102 doors) as the truth of
what a role may do; decision 0002 (minors' data, and the list of third-party destinations); the module
gate; the monthly cap pattern the SMS channel uses.

## 2. The corpus

| Source | Collected | Not collected |
| --- | --- | --- |
| NCERT (CBSE) | every English textbook, grades 1 to 12, with the exemplars; PDFs from NCERT, figures included | the Hindi and Urdu editions (the items are translated instead) |
| Balbharati (MSBSHSE) | every English-medium textbook, grades 1 to 12; PDFs from ebalbharati, figures included | the Marathi, Hindi and Urdu media (the items are translated instead); the boards' bilingual glossaries ARE collected, for the translation step |
| NIOS | its open course books | — |
| CISCE, IB, other state boards | the syllabus documents | the prescribed books (commercial publishers) |
| College streams | the syllabus PDFs of the affiliating universities and councils (SPPU, MUHS, MPKV, AICTE's model curriculum, BCI, PCI, NCTE, COA, ICAR), NPTEL and Swayam material, OpenStax and LibreTexts, NDLI's open holdings | the reference books the syllabi name (copyrighted; indexed by title and chapter only) |

Folder: `storage/corpus/<board or university>/<grade or programme>/<subject>/<file>` with a
`manifest.json` beside each file (title, edition and year, source URL, licence as published, retrieval
date, SHA-256). Figures are extracted per page into `figures/` beside the text with their caption and the
chapter and page they came from. Kept in the storage bucket, never in git; about 2 to 3 GB with figures.
Before launch counsel confirms the NCERT and Balbharati terms for use inside a paid product, for the text
and separately for the figures (section 8, gap 1).

## 3. Phases

### Phase 0 — corpus and licences (one week)

- `scripts/corpus-fetch.ts`: the downloader with the manifest, idempotent by checksum, resumable; the
  English books, the syllabi and the two boards' bilingual glossaries.
- PDF to text with the figures kept: the NCERT and Balbharati PDFs carry text; a Devanagari OCR fallback
  for scanned pages; figures cut out per page with their captions.
- Chunking by chapter and section with headings kept, about 500 tokens a chunk, each chunk tagged with
  the figures on its pages.
- A `content` schema in the same Postgres with pgvector, no `schoolId` on the rows, outside the tenant
  policy the way `QuizTopic` already is. Qwen3-Embedding for the vectors, keyword search beside them,
  Qwen3-Reranker on top. The whole corpus is embedded once on the owner's machine; new chapters are
  embedded on the service machine's CPU afterwards.

### Phase 1 — the quiz bank generator, on the owner's machine (two to three weeks)

**Where it runs.** The owner's laptop (M5 Max, 128 GB) through vLLM or llama.cpp: Qwen3-30B-A3B at full
quality for drafting and the translations; Qwen3-235B-A22B at 4-bit for the critique and the blind-solver
passes if the memory holds it beside the embeddings, otherwise the 30B does both with a second seed.
Nothing leaves the machine. Every type and level of question is generated for every chapter of the
corpus in one run, in the order section 8 gives, so the whole bank exists before review starts.

**The image field (schema change).** `QuizQuestion.imageKey` (a key in the uploads bucket, as avatars and
documents are stored), `imageAlt` in the question's language, and the image shared by the Hindi and
Marathi rows of the same item. The verifier checks that a referenced image exists and has an alt. The web
practice page and the phone's practice screen draw it above the stem; the importer uploads figures from
`content/quiz/figures/`. A figure is taken from the book's own page (NCERT's or Balbharati's drawing) when
the exercise depends on it; the generator never invents a figure.

**Drafting, per chapter chunk, in English.** The model writes items in the bank's own shape: stem,
four options, `answerIndex`, `solution`, `checkExpr` where the answer is numeric, `difficulty`, the figure
reference where the chapter's exercise needs one, and for every distractor a one-line
`distractorReason` ("the child adds the denominators", "confuses mass with weight") kept in the JSON for
the reviewer, not shown to children.

**Hindi and Marathi by translation.** Every English item that passes its checks is translated into
Hindi and Marathi on the laptop, stem, options and solution, with the board's bilingual glossary for the
subject in the prompt so the terms are the ones the Hindi and Marathi textbooks use (NCERT's and
Balbharati's glossaries are collected in Phase 0), the figure and the answer position unchanged, and the
translation critiqued once (same meaning, one answer, the distractors still wrong). The rows land as
`QuizQuestionTranslation` beside the English row, the bank's existing shape, and are served with the
English item the moment it is loaded (the owner, 11 October 2026), because a draft a child can read beats
an English question a child cannot (decision 0002, gap 8); a wrong translation is corrected on the bank
desk (all three languages in one edit) or the item taken down with the reason "The Hindi or the Marathi
is wrong". College and CISCE items are
translated the same way, so nothing is English-only.

**The difficulty ladder.** Each level has a written rubric in the prompt (1 recall: the fact is stated in
the chapter; 2 understand: the fact must be restated or an example recognised; 3 apply: a one-step use
in a new situation; 4 analyse: two or more ideas combined, or a figure read; 5 competitive: the style of
the state and national entrance papers; 6 olympiad). The generator asks for a fixed number per level per
chapter so no topic has a hole in its ladder (the verifier already refuses one). Difficulty is then
**measured, not trusted**: a blind-solver pass answers each item five times with no access to the
solution; an item at levels 1 to 2 the solver misses, or at levels 4 to 6 the solver gets right every time
without the figure or the working, is sent back with its level flagged; after release `QuestionStat`
recalibrates the level from how children actually answer, once a term.

**The style corpus for levels 5 and 6 (built 10 October 2026).** Levels 5 and 6 are written from the
chapter's own text in the style of real papers, read through `papersStyleFor({ subject, grade, level,
topic })` (`src/lib/quiz-style.ts`): the questions nearest the chapter's topic from the entrance and board
sample papers (level 5: JEE (Advanced), JEE (Main), NEET (UG), CBSE's Class X and XII sample papers) or
the olympiads (level 6: INMO, RMO, PRMO, IOQM, INPhO, INChO, INBO, INAO, INJSO and IAPT's NSEP, NSEC,
NSEB, NSEA, NSEJS), each with its test, year and class band, the papers in the class's band first.
The corpus is the `papers` source of the fetcher (runbook docs/runbooks/assistant-local.md §8), cut
by question with the options kept and the bodies' keys and solutions as their own chunks, and marked
`styleOnly`: the tutor's search never returns it. The first run (10–11 October 2026): 642 papers, keys and marking schemes, 7,478 pages, 10,326 questions (JEE (Advanced) 1,951, JEE (Main) 675, NEET (UG) 180, CBSE 3,396, HBCSE 2,898, IAPT 1,226) and 4,944 key or solution chunks, all embedded. Not collected, with the
reason recorded: MHT-CET (no paper on the CET Cell's public pages), NTSE (NCERT links keys and blank
OMR sheets only), CUET (UG) (no sample paper linked), MSBSHSE (its site is rendered by script). The
generator's prompts that use the excerpts are the quiz-gen step's, not this one's.

**Distractors that distract.** Three checks on every item, all failing items rejected before review:
1. the critique pass (a second model run) confirms exactly one defensible answer, that each distractor is
   wrong, and that each distractor's reason is a real misconception or error a pupil makes, not a random
   value or an absurd option;
2. the blind-solver pass must be able to be fooled: a distractor that no solver run and no misconception
   reason could pick is replaced; a distractor the solver picks more often than the key means the key is
   wrong or the stem is ambiguous, and the item is rejected;
3. form checks: options of similar length and form, no "all of the above", no option that repeats the
   stem's wording, no two distractors meaning the same thing, numbers in one unit and precision.

**Then the bank's own checks**: `scripts/verify-quiz.ts` structure checks, near-duplicates dropped by
embedding similarity against the bank and the batch, the chapter mapped to its `QuizTopic` (by board,
grade, subject and chapter; new topics made where none exists), the edition recorded on every item.

**Output and review** (decided by the owner on 11 October 2026 and built the same day; on 10 October it was a
review queue, one stamp serving an item, a language served once stamped). Items land in
`content/quiz/generated/<board>-<grade>-<subject>-<chapter>.json` with `source` "generated against NCERT
Science, Class 8, chapter 4 (2024 edition)". **An item that passes the pipeline's own checks — the critique,
the blind solver, the form checks, the verifier — is published without review**: `scripts/quiz-queue-load.ts`
(run by `npm run quiz:queue`, and by the generation job for each chapter as it finishes) writes it as a
`QuizQuestion` with `generated` true and the material the generator kept in `generation` (the distractor
reasons, the solver's five answers, the level flag, the critique, the figure spec, the edition), and it is
served at once with its Hindi and Marathi rows; no stamp. Rejected items never reach the file. **An item whose
figure failed to draw is loaded but held** (`needsFigure` with no `imageKey`) until its figure is stored. One
serving filter, `src/lib/quiz-served.ts`, reads `takenDownAt` and that hold, and every pupil-facing read uses it:
practice on the web and the phone, the revision queue and player, worksheets, the bank list and the export.
**The operator and the app admins edit or take an item down afterwards** — never teachers — on the bank desk at
`/root/quiz-review` and `/appadmin/quiz-review` (the review queue's two paths): every generated item, served or
not, filtered by board, class ("College" for 13 and above), subject, chapter, level and standing (served, taken
down, held), walked one at a time in section 8 item 9's order (classes 6 to 10 mathematics and science first,
then the rest) with the key marked, the solution, the check expression, the distractor reasons, the solver's
answers, the figure, the Hindi and Marathi side by side and pupils' answers so far. The presses: **Edit**
(English, Hindi and Marathi in one press; the earlier words kept on the record and the changed fields named in
the audit log; an English change keeps the solver's answers with an "edited after solving" mark), **Take down**
(not served from that moment, anywhere, with a reason from a coded list; the answers pupils gave stay attached;
reversible with **Put back**) and **Skip**, each on a key. Every act is one `QuizReviewStamp` row (question,
person, role APP_ADMIN or OPERATOR, action EDIT, TAKE_DOWN or PUT_BACK, coded reason, the words before, time)
written by one writer (`src/lib/quiz-review.ts`) in the same transaction as the change; the review queue's
stamps of 10–11 October stay as the history of the items it accepted, which stay served. The bank editor
(`/appadmin/bank`) and the translations page refuse a generated item: the desk is its words' one writer. The
authored bank is served as before. The teachers' question gig (`QuestionContribution`, `/teacher/contributions`
and its doors) is switched off behind `QUESTION_GIG_FOR_TEACHERS` in packages/contracts, nothing deleted.

**Generation started and stopped from the desk** (the owner, 11 October 2026; built the same day). A card on
both desks asks what to generate — a board, a class, a subject and a chapter range, or "everything not yet
generated" in section 8 item 9's order (classes 6 to 10 mathematics and science first, both boards, then the
rest) — with Start and Stop and a live line: the chapter running, items drafted and kept so far, the keep rate,
seconds per kept item, rejects per stage, the last chapter's numbers. Start writes a `QuizGenJob` row (one
running at a time, held by a unique index; who started it, the request, the state QUEUED, RUNNING, STOPPING,
STOPPED, FINISHED or FAILED, the progress, the times), checks the two model servers' health endpoints and
brings up through `scripts/model-serve.sh` the ones that are down ("starting the model", about a minute), and
spawns the runner — the generator's CLI with `--job=<id>`, a detached process on this machine whose pid is on
the row — which writes the live line after every item, leaves out every chapter whose batch already exists (so
a stopped run picks up where it was) and loads each chapter it finishes through `quiz-queue-load.ts`, so new
items reach pupils while it runs. Stop asks the runner to finish the item in hand and halt; the chapter in
progress is not written (nothing half-written lands) and is generated again, from the start, by the next run.
The run's end takes down the model servers that run brought up and no others (servers already up for the
assistant stay up); each server also has its own Start and Stop on the card, and stopping one under an active
run is refused. A run whose runner died is marked FAILED with the reason on the next read. The doors are
`/api/v1/appadmin/quiz-jobs` (read, start), `…/{jobId}` and `…/{jobId}/stop`, `…/servers` and
`…/servers/{server}/start|stop`, for the operator and the app admins, every press audited; `src/lib/quiz-jobs.ts`
is the one writer of the row and the one caller of the script. Both dashboards (`/root`, `/appadmin`) show the
two servers Running or Stopped with the model's name and port, read live from the health endpoints with a
ten-second cache, and link to the desk. **On a hosted deployment the job runs where the model runs**: the
runner and the script are this machine's; a host's model gets a runner on its own host, started by the same
row and doors.

**Throughput and cost.** About 15 to 25 seconds an item for the draft, the critique and the five solver
runs, and a few seconds more for the two translations, so the whole bank of about 200,000 items is
roughly six to eight weeks of the laptop running, or three to four with a second machine; electricity
about ₹500 to ₹1,000 a week. Nothing waits for a reviewer: items are served as each chapter loads.

**Step 1 built — the pipeline on the owner's machine (10–11 October 2026).** `npm run quiz:gen -- --board=NCERT|Balbharati
--grade=8 --subject=Science --chapter=4` (`--all-chapters`, `--limit=N`, `--per-level=4`, `--book=<code>`, `--list`,
`--dry`) in `apps/web/scripts/quiz-gen/` (select, prompts, model, checks, pipeline, cli; the figure builder's renderer
beside it in `figures/`), on the two local llama.cpp servers through JSON-schema-constrained output with a seed per
call. The passes, in the brief's order: drafting per chunk group (one item per level per group, the rubrics above in
the prompt, the book's captions shown so the model knows what the chapter drew, its own `figure` spec in the figure
builder's contract where the exercise needs one); the critique (another seed: one defensible answer, each distractor
wrong, each reason a real misconception); the blind solver (five seeds, no solution; levels 1–2 missed twice or more
and levels 4–6 right five of five are flagged, not dropped; a distractor nobody picked whose reason the critique found
hollow is redrafted once, then the item goes; a distractor picked more than the key rejects the item); the form checks
(catch-alls, the stem's wording in an option, two distractors alike, lengths, one unit and precision, the checkExpr
evaluated with the bank's own evaluator, a reason per distractor, the figure against `quizFigureSpecSchema` with one
repair, "the passage" wording rewritten once in a solution and refused in a stem), the verifier's own per-question
rules (`questionErrors`, exported from scripts/verify-quiz.ts), near-duplicates by cosine ≥ 0.9 against the served
bank's stems of the class and subject and within the batch; then every item that reaches the file translated into
Hindi and Marathi with one bilingual critique each and one mend (the glossary lines in the prompt where the corpus has
a glossary for the subject: NCERT economics, geography and sociology only; science has none). The plan's ladder is the
bank's QUIZ_LEVELS level for level (the identity, held by a test). Levels 5 and 6 take a `style` block of excerpts from
ContentDocument source "papers" and are skipped, with the run log saying so, while that corpus is absent (it was, on
both runs). Output: `content/quiz/generated/<board>-<grade>-<subject>-<chapter>.json` in the bank's shape plus the
optional fields (`imageAlt`, `figure`, `needsFigure`, `distractorReason`, `solverAnswers`, `levelFlag`, `critique`,
`sources`, `edition`, `generatedAt`, `model`, `stamps: []`; `imageKey` always null, no drawing is cropped from a book)
and a run log under `generated/runs/`. Schema: `QuizQuestion.imageKey` and `imageAlt` (migration `quiz_images`).
The two runs (`--limit=24`, four per level at levels 1–4, under the shared server's load that hour): NCERT Curiosity
class 8 chapter 4 "Electricity: Magnetic and Heating Effects" — 23 drafted, 8 kept (L1:2 L2:3 L3:2 L4:1), 1 flagged,
1 figure item, rejects critique 8, form 7, draft 1; 1,967 s, 246 s per kept item, the translations 1,699 s of summed
call time (about 220 s wall per item at three in flight); Balbharati class 8 chapter 3 "Force and Pressure" — 26
drafted, 6 kept (L1:2 L2:1 L3:1 L4:2), 2 flagged, 1 figure item, rejects critique 11, form 7, draft 3, solver 2;
1,013 s, 169 s per kept item. `npm run quiz:verify` passes both batches with only the two missing rungs as warnings.
What the runs showed: the critique rejects half the drafts, most for a second defensible option (the pascal/N·m⁻²
pair is a true catch; others may be over-strict and are worth a reviewer's calibration); the model writes "according
to the passage" into stems despite the rule; the translation critique passed a wrong Hindi term ("बिजली के स्टीमर"
for an electric iron), so the native speaker's stamp stays the real check; one reason slot carried the key's
justification (refused since); the server ran at 10–30 tokens/s under the other builders' load against 100 alone,
so the plan's 15–25 s an item is the unloaded figure, not this hour's. Not built here: the `--book=hesc1` (2024
"Science") chapter names (its chunks carry only "Chapter N"); the review queue, the practice surfaces drawing the
figure, the papers corpus — the queue and the figure builder are the other builders' of the same day (above).

### Phase 2 — the assistant service, on the owner's machine first (two to three weeks)

- A separate process beside the jobs machine (`apps/assistant` or a process group in `fly.toml`),
  reached only through catalogued doors under `/api/v1/assistant/*`, module `ASSISTANT`, on by default,
  switchable off per school.
- **Who gets what.** Students, teachers, FACULTY and HOD: platform help and curriculum questions.
  Everyone else (the office, principal, families, the college desks, alumni, experts, recruiters, the
  operator): platform help only; a curriculum question from them is answered with one sentence saying
  whom the tutor is for. The policy is one table in the service, read by the tests.
- The model never reads tenant data. When a question needs it ("which of my classes has a register
  due"), the service calls the person's own GET doors with the person's session, so the tenant fence and
  the role gate stay exactly as they are.
- Platform-help corpus: the docs, HANDOFF, the catalog's door summaries, the dictionaries' sentences,
  `docs/college.md`; answers name the page to go to and are role-aware.
- Curriculum answers carry citations (board, book, chapter, page, with the figure where the passage has
  one); an answer with no retrieved passage says so rather than guessing; the pupil's grade and board
  from their school scope the retrieval first.
- Local first (Phase 2a): the model behind an OpenAI-compatible endpoint on localhost from the same vLLM
  or llama.cpp server as the generator; the service reads `ASSISTANT_MODEL_URL` and `ASSISTANT_MODEL`, so
  the hosted provider later is a change of two variables; the local Postgres and the demo tenants are
  the pilot. The local run proves the answers, citations, refusals, the role policy, the minors' path,
  the budget and the kill switch, en/hi/mr on web and phone; it cannot prove concurrency, uptime or the
  hosted model's quality, so the golden sets are run once more against the hosted model before the switch.
- Minors, with the assistant on by default and no opt-in step (the owner's decision): names, ids and
  codes stripped from what the model sees; transcripts on a retention dial (`RETENTION_ASSISTANT_DAYS`,
  default 30) and never in the audit log; a refusal set for off-topic and unsafe questions with the
  school's counsellor route for self-harm signals; a guardian's opt-out per child on the family's
  settings; the guardians told once, through the notice the notifications consent already sends, that
  the tutor is on and how to switch it off for their child. Counsel reads this under the DPDP rules
  before the first real school (gap 3 records the risk; the default does not change).
- Controls: a monthly token budget per school like the SMS cap, shown on the overview; a kill-switch
  environment variable like the phone's; calls audited by count, never by text.
- Decision 0005 records the model endpoint as a third-party destination (decision 0002's list), the
  default-on choice, the opt-out, the retention and what is stripped.

### Phase 3 — surfaces (one week)

- Web: a panel reachable from every role's home; phone: a tab under More reading the same doors; both on
  the kit, en/hi/mr, the answer in the person's account language.
- The practice page and screen draw the image field; the bank desk for the app admins and the operator with
  the distractor reasons, the solver's answers, Edit, Take down and Put back, and the generation card
  (built 11 October 2026; the per-language stamps of the 10 October review queue are gone).

### Phase 4 — evaluation and rollout (two weeks)

- A golden set of about 200 questions per board and grade band, scored for correctness and citation; the
  platform-help set scored per role; the role policy tested (a parent's curriculum question refused).
- Hindi and Marathi answers and items read by a speaker (R-14).
- A red-team pass for a minor's questions (self-harm, adult content, another pupil's data, prompt
  injection through a pasted homework text).
- Pilot at the demo schools and colleges, then one real school.

## 4. The model

The Qwen family (Apache 2.0) for every role, one serving stack from the laptop to the host:

| Role | Where it runs | Model |
| --- | --- | --- |
| Drafting in English, the Hindi and Marathi translations, the critique, the blind solver | the owner's machine | Qwen3-30B-A3B; Qwen3-235B-A22B at 4-bit for the critique and solver if the memory holds it |
| The assistant's answers | the owner's machine first, then hosted Qwen3 through the same OpenAI-compatible endpoint | Qwen3-30B-A3B; Qwen3-235B-A22B only where retrieval returns nothing useful |
| Figures in questions and answers (reading a diagram) | the owner's machine | Qwen3-VL (the vision line) for the critique of figure items and for the assistant's figure citations |
| Embeddings and reranking | the owner's machine for the corpus, the service machine's CPU afterwards | Qwen3-Embedding-8B (0.6B on the service machine), Qwen3-Reranker; BGE-M3 as the comparison |

Two checks before the choice is final, one afternoon each with a speaker: Qwen3's Marathi translation
against Sarvam-M 24B on 200 items (Qwen3 is stronger in Hindi than in Marathi in the published
evaluations; if Sarvam reads better in Marathi it translates the Marathi rows only, still on the laptop),
and the exact Qwen3 release against the current leaderboards when Phase 1 starts.

Self-hosting the assistant's model (one H100, ₹1.8 to ₹2.5 lakh a month) is worth it only past roughly
one to two million questions a month or when data residency under the DPDP rules requires it.

## 5. Cost

Generation: ₹0 in fees; electricity about ₹500 to ₹1,000 a week of running. No review pass is owed before
an item is served (the owner, 11 October 2026: published without review, taken down afterwards); the app
admins' and the operator's time on the bank desk is whatever reading they choose to do.

The assistant, hosted, about 3,000 tokens a question with retrieval, at ₹84 per dollar; with the tutor
open to students and teachers only, the per-question line is bounded by the pupils' use:

| Line | 1 school (8,000 questions a month) | 10 schools | 100 schools |
| --- | --- | --- | --- |
| Service machine | ₹1,800 | ₹1,800 | ₹3,600 |
| Vector store and figures on the existing Postgres and bucket | ₹200 | ₹600 | ₹3,000 |
| Embeddings and reranking | CPU, ₹0 | ₹0 | a small GPU, ₹8,000 |
| Inference, hosted Qwen3 (₹10 to ₹50 per million tokens) | ₹250 to ₹1,200 | ₹2,500 to ₹12,000 | ₹25,000 to ₹1.2 lakh |
| **Per month** | **₹2,300 to ₹3,200** | **₹4,900 to ₹14,400** | **₹40,000 to ₹1.35 lakh** |

## 6. What this plan does not do

- Bulk-download commercial reference books or ICSE, IB and private-publisher textbooks.
- Invent figures: a question's image is the book's own drawing or nothing.
- Let the model query the database or read anything the signed-in person could not open.
- Serve a generated question that failed the pipeline's own checks, or one whose figure is not drawn
  (since 11 October 2026 a generated question that passes them is served without a stamp).
- Draft from the Hindi and Marathi books: the Indian-language rows are translations of the English item,
  read by native speakers.
- Fine-tune a model before retrieval has been measured.

## 7. Order and effort

Phase 0 and the generator first (they need no hosting and give the app admins the bank to review); the
assistant service and its surfaces entirely on the owner's machine against the demo tenants; the
evaluation; then the hosted deployment. Seven to ten weeks for a first version, as three or four builder
waves; the corpus downloader and the manifest are the first day's work.

## 8. Gaps and recommendations (8 October 2026)

Gaps the owner's decisions open, with a recommendation each; and the recommendations kept from the
earlier drafts.

1. **Figures are the books' copyright.** NCERT and Balbharati allow their books to be used for education;
   reproducing their drawings inside a paid app, cropped into a question bank, is a separate question.
   Recommendation: counsel reads both boards' terms for figures before Phase 1 generates a single figure
   item; until then the generator writes figure items with the page reference and no image, and the
   importer attaches the images when the answer is yes.
2. **Translation needs the boards' terms, not a dictionary's.** The Marathi word a Balbharati science
   book uses is often not the one a general translator picks. Recommendation (accepted): the boards'
   bilingual glossaries in the prompt, the translation critiqued once, and a native speaker's stamp per
   language before the quality flag; Sarvam-M compared for Marathi.
3. **On by default for minors, decided.** The owner keeps the tutor on by default with no opt-in. What
   stays: the guardian's opt-out per child, the stripping, the 30-day retention, the one-time notice to
   guardians, and counsel's reading under the DPDP rules before the first real school. The risk recorded:
   if counsel reads the rules as requiring explicit consent for a child under 18, the default has to
   change for minors, and the notice path above is the cheapest way to turn it into consent.
4. **Teachers asking about pupils.** A teacher's curriculum question may name a child ("explain fractions
   the way Aarav would get it"). Recommendation: the stripping applies to the teacher's text too; the
   assistant explains the concept and never writes about a named pupil.
5. **The blind solver is the honest check, not the critique.** A model critiquing its own item agrees with
   itself too often. Recommendation: the solver runs on a different seed and, where the memory allows, the
   other Qwen size, and the item must survive both; the reviewer sees the solver's five answers.
6. **Difficulty 5 and 6 need the papers.** The competitive and olympiad levels are styles, not chapters.
   Recommendation: collect the public past papers of the state and national entrance tests (freely
   published) as a style corpus for those two levels only, and generate them last. Built 10 October
   2026 (Phase 1, "The style corpus for levels 5 and 6"): the papers of JEE (Advanced), JEE (Main),
   NEET (UG), CBSE's sample papers, HBCSE's olympiads and IAPT's NSEs, from the bodies' own sites;
   MHT-CET, NTSE, CUET (UG) and MSBSHSE publish none a plain fetch can read. Whether reading the papers
   for style needs the bodies' permission (NTA's terms ask for permission to reproduce) goes to counsel
   with gap 1.
7. **Mathematics notation.** Figures do not solve notation in stems and options. Recommendation: plain
   text with the existing `checkExpr` for numbers in the first version; a notation renderer on web and
   phone as a separate, later change.
8. **Editions.** Every item names the edition it was written against; the manifest carries the edition
   and year; a changed edition re-runs the chapter and the reviewer sees a diff, not a fresh batch.
9. **Order of generation:** grades 6 to 10, mathematics and science, Marathi medium for MSBSHSE and
   English for CBSE first, then languages and social science, grades 11 and 12, then colleges.
10. **Review capacity, decided** (superseded on 10 October 2026: the app admins and the operator review, one stamp
    serves; see Phase 1 "Output and review"; kept as it was written:) Everything is generated in one run and reviewed by many teachers and
    the app admins. What the plan adds: two stamps before an item is served, reviewers limited to the
    subjects and grades they teach, the stamp naming the reviewer and school, the queue ordered by the
    schools' timetables so the term's chapters are stamped first, and the question whether review is a
    paid gig (decision 0004) or volunteer work, which sets how many teachers will do it.
11. **Open questions for the owner:** who the Hindi and Marathi reviewers are (R-14); whether a student
    may ask the tutor in a language other than their account's; whether a teacher at a school may see
    the pupils' conversations (recommendation: no, counts only); and counsel's questions above (figures,
    the minors' default, the third-party destination, the retention days).

## 9. Gaps still open after the fourth draft (8 October 2026)

Found by reading the plan against the platform as it is; each with a recommendation. None is decided.

1. **The tutor can answer the quiz.** The bank and the tutor share the corpus, so a child in a practice
   sitting or a contest can paste the question and get the answer. Recommendation: the service matches
   each question against the bank by embedding similarity and, on a match, answers with a hint and the
   chapter rather than the answer; while a contest sitting or a timed practice assignment is open for
   that pupil, the tutor answers nothing about that topic; teachers can see, per class, how often the
   hint path fired (counts, never text).
2. **Homework.** The same for hand-in work: the tutor's default for a student is to explain and to hint,
   with the worked answer only when the student asks for it after a hint, and a teacher's switch per
   assignment ("the tutor may give answers for this one"). The learning-mode rule is one table beside the
   role policy.
3. **Injection through what the model reads.** The plan covers a pasted homework text; it must also treat
   the retrieved corpus, the platform docs and every door's answer as data, never as instructions, with
   the tool list limited to an allow-list of cheap GET doors and the heavy-read budget applied to the
   assistant's calls as to any other caller.
4. **Figures from the English books carry English labels.** A Marathi-medium child gets a Marathi stem
   over a diagram labelled in English. Recommendation: the alt text and the solution name the labels in
   the item's language; the figure itself stays the book's; reviewers mark items where the labels matter
   for a later Marathi figure.
5. **Reviewer quality.** Teachers from many schools stamp items; two stamps catch a slip but not a shared
   misreading. Recommendation: the app admins spot-check a sample of every reviewer's stamps, agreement
   between reviewers is measured, and a reviewer whose stamps keep being overturned loses the queue;
   reviewers are the platform's, not a school's, and their names on stamps stay internal.
6. **The platform-help corpus drifts.** Docs and door summaries change with every release; an answer
   that names a page that moved is worse than none. Recommendation: the help corpus is rebuilt from the
   repository at each deploy and tagged with the commit, and the golden platform-help set runs in the
   battery.
7. **Per-person limits, not only per school.** A school's monthly token budget stops the bill, not one
   pupil using it all. Recommendation: a daily cap per person as the SMS channel has, with a gentle
   sentence when it is reached.
8. **The hosted provider's terms.** The host must not train on or retain what it is sent, and the data
   leaves India unless an Indian host is chosen. Recommendation: zero-retention terms in writing, an
   Indian host preferred for the student tutor, and the provider named in decision 0005 beside the model.
9. **Model pinning.** A host updating the model changes answers overnight. Recommendation: pin the model
   version, run the golden sets before any change, and keep the local model as the fallback.
10. **Connectivity and devices.** Chat needs a live connection; the phone's outbox does not replay
    conversations. Recommendation: streamed answers over the existing event stream, short answers by
    default on the phone, and a clear offline state; no offline tutor in the first version.
11. **What the model remembers.** No memory across conversations in the first version; a conversation
    is the unit, retained thirty days, and the plan says so to the person on the first screen.
12. **Urdu medium is dropped** with the English-only corpus; the Urdu rows the bank's translation path
    could carry are not made. Recommendation: record it; revisit when an Urdu-medium school joins.
13. **Backups.** The generated bank and the corpus are in the bucket; the go-live checklist's replication
    of the bucket covers them once set up, and `content/quiz/generated/` is in git once stamped.

**Boards and the queue's figures (11 October 2026, the owner's decisions).** The practice bank has a board:
`QuizTopic.board` NCERT or BALBHARATI (migration `quiz_topic_board`, which backfilled the authored bank's 386
chapters and the generated NCERT chapter as NCERT's and the Balbharati chapter as Balbharati's; `quiz:import`
writes NCERT on every authored topic from now on, and `quiz:queue` writes a batch's own `board`, which the verifier
requires on a generated file). A pupil's practice page, a guardian's and the phone's open on the school's board
(CBSE → NCERT, MSBSHSE → Balbharati, any other → both) with a switch to the other and to both; the topic card names
its board; the review queue's board filter is the same code. A generated item enters the bank through `quiz:queue`
only; `quiz:queue` now draws and stores an item's figure on load (English, Hindi, Marathi), so an item that needs one
can be accepted, and loads one whose figure cannot be drawn with the reason ("Figure failed" on the desk). Rerun on
the two batches: both figure items drawn, the stamped item left alone, nothing duplicated.

**Published without review, and generation from the desk (11 October 2026).** The owner's decisions of the day
replaced the review queue with the bank desk and moved generation onto it; Phase 1 "Output and review" and
"Generation started and stopped from the desk" above say what was built. Migration `quiz_publish_jobs`:
`QuizQuestion.discardedAt` and `discardReason` renamed to `takenDownAt` and `takenDownReason` (no item had been
discarded), `takenDownBy` and `needsFigure` added (the latter backfilled from the generation JSON), and the
`QuizGenJob` table. The 14 generated items the review queue had accepted stay served; the generator's batches
written before the last three generator rules (a Hindi "स्टीमर" for an iron among them) are served too and are
the desk's to edit or take down.

**College practice by stream, and the generator's college scope (12 October 2026, the owner's decisions).** A
practice chapter has an audience: `QuizTopic.audience` SCHOOL (the school bank: authored, NCERT and Balbharati) or
COLLEGE, with `streams` (stream codes; none for a college-wide bank), `programme` and `yearOrSemester` (Y1–Y5 or
S1–S10, coded in `packages/contracts` v1/college-practice.ts); migration `college_practice` backfilled the bank
SCHOOL and the placement banks (aptitude, reasoning, coding at class 13) COLLEGE with no stream. A school's practice
page is as it was (the board switch, classes, subjects) and lists the school bank only. A college's page has two
sections: **My stream** — the COLLEGE chapters whose streams include one of the college's, or that name none,
grouped by programme and subject with a programme and a year-or-semester filter — and **Competitive Exams Prep** —
the school bank's NCERT chapters by class and subject; nothing else from the school bank reaches a college. The rule
is one where clause (`src/lib/practice-audience.ts`, the pure twin `practiceSectionOf` in the contracts) used by
`listTopics`, the sitting's start (a chapter a tenant does not list is not found by its slug either), the continue
card, revision, a teacher's topic picker, practice assignments and worksheets. The guardian's page and the phone's
practice screens follow it through the doors: the family practice reads carry optional `practiceKind`,
`collegeStreams` and, per chapter, `section`, `programme` and `yearOrSemester` (an older phone keeps working: the
server sends a college only what it lists). The generator's job gains a **College** scope: a stream and a programme
from the syllabus corpus (ContentDocument source "syllabi": SPPU, AICTE's model curricula, the PCI's, MPKV's), one
syllabus document or every one of the programme, and a unit range. A document's stream is read from its board, the
section the site filed it under and its title (`src/lib/college-syllabi.ts`); its units are the runs of chunks under
one level-one heading, the contents, rules, schemes of examination and the university's running head left out, a
headless document one unit; a unit's reading lists are not sent to the model. The drafting prompt says the passage
is a university syllabus (ask about what it lists, never about credits, codes or the reading list). A unit's batch
(`content/quiz/generated/college-<stream>-<programme>-<doc>-u<n>.json`) carries `audience: "COLLEGE"`, the stream,
the programme, the term and the syllabus's board and no school board; `quiz:verify` and the loader
(`scripts/quiz-queue-load.ts`) take it, and it lands as a COLLEGE topic (subject the stream code, class 13). The card
lists the streams with a corpus (all but health sciences on 12 October: 11 streams, 684 documents with units) and
says which have none. One unit can also be run from a shell: `npm run quiz:gen -- --document=<path> --unit=N`. The first live unit (SPPU's BA LL.B. course "Introduction to Civil and Criminal Manual", 12 October) showed the model
asking about the syllabus itself (which book, which module, the course's aim) and a Marathi translation echoing the
prompt's header; the form stage now refuses a college item about the syllabus (`aboutTheSyllabus`), a run-in reading
list is left out of the unit, and a translation's echoed header is cut off for every chapter.
