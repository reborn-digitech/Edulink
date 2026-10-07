# The assistant and the quiz bank generator — plan of 8 October 2026 (third draft)

Status: plan, not yet built. Decided by the owner so far:

- the quiz bank generator runs on the owner's own machine, on the Qwen family; no hosted model for it;
- questions carry an image where the chapter's exercise needs one;
- the difficulty ladder must be honoured and every distractor must be a real distractor;
- review is done by the app admins at `/appadmin`, as a mostly one-time pass over the generated bank;
- no translation step: the Hindi and Marathi items are drafted from the Hindi and Marathi books;
- the assistant runs on the owner's machine first and is hosted only after that run has proved it;
- the assistant is on by default for everyone; curriculum questions are answered for students and
  teachers only, every other role gets platform help only.

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
| NCERT (CBSE) | every textbook, grades 1 to 12, in English, Hindi and Urdu, with the exemplars; PDFs from NCERT, figures included | — |
| Balbharati (MSBSHSE) | every textbook, grades 1 to 12, Marathi, Hindi, English and Urdu media; PDFs from ebalbharati, figures included | — |
| NIOS | its open course books | — |
| CISCE, IB, other state boards | the syllabus documents | the prescribed books (commercial publishers) |
| College streams | the syllabus PDFs of the affiliating universities and councils (SPPU, MUHS, MPKV, AICTE's model curriculum, BCI, PCI, NCTE, COA, ICAR), NPTEL and Swayam material, OpenStax and LibreTexts, NDLI's open holdings | the reference books the syllabi name (copyrighted; indexed by title and chapter only) |

Folder: `storage/corpus/<board or university>/<grade or programme>/<subject>/<language>/<file>` with a
`manifest.json` beside each file (title, edition and year, source URL, licence as published, retrieval
date, SHA-256). Figures are extracted per page into `figures/` beside the text with their caption and the
chapter and page they came from. Kept in the storage bucket, never in git; about 4 to 6 GB with figures.
Before launch counsel confirms the NCERT and Balbharati terms for use inside a paid product, for the text
and separately for the figures (section 8, gap 1).

## 3. Phases

### Phase 0 — corpus and licences (one week)

- `scripts/corpus-fetch.ts`: the downloader with the manifest, idempotent by checksum, resumable, one
  language medium at a time.
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
quality for drafting and the Hindi and Marathi items; Qwen3-235B-A22B at 4-bit for the critique and the
blind-solver passes if the memory holds it beside the embeddings, otherwise the 30B does both with a
second seed. Nothing leaves the machine.

**The image field (schema change).** `QuizQuestion.imageKey` (a key in the uploads bucket, as avatars and
documents are stored), `imageAlt` in the question's language, and the image shared by the Hindi and
Marathi rows of the same item. The verifier checks that a referenced image exists and has an alt. The web
practice page and the phone's practice screen draw it above the stem; the importer uploads figures from
`content/quiz/figures/`. A figure is taken from the book's own page (NCERT's or Balbharati's drawing) when
the exercise depends on it; the generator never invents a figure.

**Drafting, per chapter chunk and per language.** The model writes items in the bank's own shape: stem,
four options, `answerIndex`, `solution`, `checkExpr` where the answer is numeric, `difficulty`, the figure
reference where the chapter's exercise needs one, and for every distractor a one-line
`distractorReason` ("the child adds the denominators", "confuses mass with weight") kept in the JSON for
the reviewer, not shown to children.

**Three languages, no translation.** The English item is drafted from the English book; the Hindi item
from the Hindi book and the Marathi item from the Marathi book, each with the English item as the anchor
(same concept, same figure, same answer position and the same four distractor reasons), so the terms are
the board's own in each language and the three rows are one item in the bank's shape
(`QuizQuestionTranslation` beside the English row). Where a board has no book in a medium (CISCE,
college material, see gap 2) the item is English-only and the topic says so.

**The difficulty ladder.** Each level has a written rubric in the prompt (1 recall: the fact is stated in
the chapter; 2 understand: the fact must be restated or an example recognised; 3 apply: a one-step use
in a new situation; 4 analyse: two or more ideas combined, or a figure read; 5 competitive: the style of
the state and national entrance papers; 6 olympiad). The generator asks for a fixed number per level per
chapter so no topic has a hole in its ladder (the verifier already refuses one). Difficulty is then
**measured, not trusted**: a blind-solver pass answers each item five times with no access to the
solution; an item at levels 1 to 2 the solver misses, or at levels 4 to 6 the solver gets right every time
without the figure or the working, is sent back with its level flagged; after release `QuestionStat`
recalibrates the level from how children actually answer, once a term.

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

**Output and review.** Items land in `content/quiz/generated/<board>-<grade>-<subject>.json` with `source`
"generated against Balbharati Science, Std 8, chapter 4 (2024 edition)" and `reviewedAt` null. The app
admins review at `/appadmin` with a generated queue (accept, edit, discard, and the per-language stamps);
the reviewer sees the distractor reasons and the solver's success rate. **No generated item is served
until stamped**; the importer refuses a generated file into a served topic without the stamp. The licence
is set at review once the reviewer confirms the stem is original. A one-time pass: about 60,000 items
(both boards, grades 5 to 12, core subjects, about 30 a chapter) is roughly 1,000 reviewer hours at a
minute an item; the queue is ordered as section 8's generation order says, so the useful part is reviewed
first.

**Throughput and cost.** About 15 to 25 seconds an item for the draft, the critique and the five solver
runs, so 60,000 items in three languages is roughly four to six weeks of the laptop running, or two with
a second machine; electricity about ₹500 to ₹1,000 a week.

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
- Minors, with the assistant on by default: names, ids and codes stripped from what the model sees;
  transcripts on a retention dial (`RETENTION_ASSISTANT_DAYS`, default 30) and never in the audit log;
  a refusal set for off-topic and unsafe questions with the school's counsellor route for self-harm
  signals; a guardian's opt-out per child on the family's settings; the consent question in gap 3.
- Controls: a monthly token budget per school like the SMS cap, shown on the overview; a kill-switch
  environment variable like the phone's; calls audited by count, never by text.
- Decision 0005 records the model endpoint as a third-party destination (decision 0002's list), the
  default-on choice, the opt-out, the retention and what is stripped.

### Phase 3 — surfaces (one week)

- Web: a panel reachable from every role's home; phone: a tab under More reading the same doors; both on
  the kit, en/hi/mr, the answer in the person's account language.
- The practice page and screen draw the image field; the app admins' review queue with the distractor
  reasons, the solver rate and the per-language stamps.

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
| Drafting in three languages, the critique, the blind solver | the owner's machine | Qwen3-30B-A3B; Qwen3-235B-A22B at 4-bit for the critique and solver if the memory holds it |
| The assistant's answers | the owner's machine first, then hosted Qwen3 through the same OpenAI-compatible endpoint | Qwen3-30B-A3B; Qwen3-235B-A22B only where retrieval returns nothing useful |
| Figures in questions and answers (reading a diagram) | the owner's machine | Qwen3-VL (the vision line) for the critique of figure items and for the assistant's figure citations |
| Embeddings and reranking | the owner's machine for the corpus, the service machine's CPU afterwards | Qwen3-Embedding-8B (0.6B on the service machine), Qwen3-Reranker; BGE-M3 as the comparison |

Two checks before the choice is final, one afternoon each with a speaker: Qwen3's Marathi drafting
against Sarvam-M 24B on 200 items (Qwen3 is stronger in Hindi than in Marathi in the published
evaluations; if Sarvam reads better in Marathi it drafts the Marathi items only, still on the laptop), and
the exact Qwen3 release against the current leaderboards when Phase 1 starts.

Self-hosting the assistant's model (one H100, ₹1.8 to ₹2.5 lakh a month) is worth it only past roughly
one to two million questions a month or when data residency under the DPDP rules requires it.

## 5. Cost

Generation: ₹0 in fees; electricity about ₹500 to ₹1,000 a week of running; the one-time review pass by
the app admins (about 1,000 hours for 60,000 items).

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
- Serve a generated question without an app admin's stamp.
- Translate: an item in a language the board has no book in is not made (gap 2).
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
2. **"Books in all three languages" is true for the two school boards only.** NIOS, CISCE's syllabi and
   nearly all college material exist in English (a few Marathi-medium arts and commerce texts aside).
   With no translation step those items are English-only. Recommendation: accept English-only for
   colleges and CISCE in the first version and say so on the topic; revisit translation for college
   first-year subjects later if Marathi-medium colleges ask.
3. **On by default for minors needs a consent answer.** Decision 0002 treats every new destination for a
   minor's words as something the guardian consents to. Recommendation: on by default, with the guardian's
   opt-out per child on the family's settings, the stripping and the 30-day retention as written, and
   counsel's reading of whether the DPDP rules let that stand for a child under 18 before a real school
   switches it on; if counsel says consent must be explicit, the switch becomes "on after the guardian's
   first visit to the settings", which the notifications consent already does.
4. **Teachers asking about pupils.** A teacher's curriculum question may name a child ("explain fractions
   the way Aarav would get it"). Recommendation: the stripping applies to the teacher's text too; the
   assistant explains the concept and never writes about a named pupil.
5. **The blind solver is the honest check, not the critique.** A model critiquing its own item agrees with
   itself too often. Recommendation: the solver runs on a different seed and, where the memory allows, the
   other Qwen size, and the item must survive both; the reviewer sees the solver's five answers.
6. **Difficulty 5 and 6 need the papers.** The competitive and olympiad levels are styles, not chapters.
   Recommendation: collect the public past papers of the state and national entrance tests (freely
   published) as a style corpus for those two levels only, and generate them last.
7. **Mathematics notation.** Figures do not solve notation in stems and options. Recommendation: plain
   text with the existing `checkExpr` for numbers in the first version; a notation renderer on web and
   phone as a separate, later change.
8. **Editions.** Every item names the edition it was written against; the manifest carries the edition
   and year; a changed edition re-runs the chapter and the reviewer sees a diff, not a fresh batch.
9. **Order of generation:** grades 6 to 10, mathematics and science, Marathi medium for MSBSHSE and
   English for CBSE first, then languages and social science, grades 11 and 12, then colleges.
10. **Review capacity.** One-time or not, 1,000 hours is a term of one person's work. Recommendation: two
    app admins reviewing in parallel, the queue ordered by the schools' timetables, and no batch generated
    beyond what the next four weeks can review, so the generated folder never grows stale.
11. **Open questions for the owner:** who the Hindi and Marathi reviewers are (R-14); whether a student
    may ask the tutor in a language other than their account's; whether a teacher at a school may see
    the pupils' conversations (recommendation: no, counts only); and counsel's questions above (figures,
    the minors' default, the third-party destination, the retention days).
