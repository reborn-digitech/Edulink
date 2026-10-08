# The assistant and the quiz bank generator — plan of 8 October 2026 (fourth draft)

Status: plan, not yet built. Decided by the owner so far:

- the quiz bank generator runs on the owner's own machine, on the Qwen family; no hosted model for it;
- questions carry an image where the chapter's exercise needs one;
- the difficulty ladder must be honoured and every distractor must be a real distractor;
- every type and level of question is generated for the whole corpus in one go; review is done by the
  app admins and by many teachers, as a one-time pass over the generated bank;
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
`QuizQuestionTranslation` beside the English row, the bank's existing shape, with `hiReviewedAt` and
`mrReviewedAt` null until a native speaker among the reviewers stamps them; as the bank does today, an
unreviewed translation is still served once the English item is stamped, because a draft a child can
read beats an English question a child cannot (decision 0002, gap 8). College and CISCE items are
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
"generated against NCERT Science, Class 8, chapter 4 (2024 edition)" and `reviewedAt` null. Review is a
one-time pass by many hands: the app admins at `/appadmin`, and **teachers as reviewers**, invited by the
app admins from any school on the platform for the subjects and grades they teach, through a review
queue on the teacher's side (the path the bank already has for teachers' own contributions,
`QuestionContribution` and the gig-questions desk, extended with the generated queue). A reviewer sees
the distractor reasons and the solver's five answers, and can accept, edit or discard; an item is served
after **two stamps** (two teachers, or a teacher and an app admin), and a Hindi or Marathi row after a
native speaker's stamp. The stamp names the reviewer and their school. Review can be paid as a gig under
decision 0004 (the company collects and pays per stamped item), which is the owner's call. The importer
refuses a generated file into a served topic without the stamps; the licence is set at review once a
reviewer confirms the stem is original. The whole bank is about 200,000 items (both boards, grades 1 to
12, every subject, every level, plus the colleges); at a minute an item and two stamps each that is
about 6,500 reviewer hours, which is why the queue is ordered as section 8 says and spread over many
teachers.

**Throughput and cost.** About 15 to 25 seconds an item for the draft, the critique and the five solver
runs, and a few seconds more for the two translations, so the whole bank of about 200,000 items is
roughly six to eight weeks of the laptop running, or three to four with a second machine; electricity
about ₹500 to ₹1,000 a week. Generation runs ahead of review and never waits for it.

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

Generation: ₹0 in fees; electricity about ₹500 to ₹1,000 a week of running; the one-time review pass by
the app admins and the teachers (about 6,500 hours for 200,000 items at two stamps each; paid as a gig
or not, the owner's call).

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
   published) as a style corpus for those two levels only, and generate them last.
7. **Mathematics notation.** Figures do not solve notation in stems and options. Recommendation: plain
   text with the existing `checkExpr` for numbers in the first version; a notation renderer on web and
   phone as a separate, later change.
8. **Editions.** Every item names the edition it was written against; the manifest carries the edition
   and year; a changed edition re-runs the chapter and the reviewer sees a diff, not a fresh batch.
9. **Order of generation:** grades 6 to 10, mathematics and science, Marathi medium for MSBSHSE and
   English for CBSE first, then languages and social science, grades 11 and 12, then colleges.
10. **Review capacity, decided.** Everything is generated in one run and reviewed by many teachers and
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

