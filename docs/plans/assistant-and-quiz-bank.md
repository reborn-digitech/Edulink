# The assistant and the quiz bank generator — plan of 8 October 2026

Status: plan, not yet built. Decided so far by the owner: the quiz bank generator runs on the owner's own
machine (no hosted model for generation); the assistant runs on the owner's machine first, against the
local dev servers and the demo schools, and is hosted only after that local run has proved it. Everything
else below is the proposal.

## 1. What is being built

Two things that share a corpus and a retrieval layer:

- **The assistant.** A chat surface on the web and the phone that answers two kinds of question: how the
  platform works, for every role (the office, teachers, families, college staff, the operator), and
  curriculum and learning questions for every student, whichever school or college they are at. It is a
  platform-level feature with a per-school switch (module `ASSISTANT`, off by default).
- **The quiz bank generator.** An offline pipeline that drafts multiple-choice questions with distractors,
  per chapter of the corpus, into the practice bank the app already has (`QuizTopic`, `QuizQuestion`,
  `content/quiz/*.json`, `npm run quiz:import`, `scripts/verify-quiz.ts`), for the content team to review.

What already exists and is reused, not replaced: the practice bank with its source and licence per
question, the 1 to 6 difficulty ladder, the structure verifier, the native-speaker review stamps and the
machine-translation drafts (`src/lib/translate.ts` already calls a model for them); the API catalog
(1,102 doors) as the truth of what a role may do; decision 0002 (minors' data; every third-party
destination the server talks to is listed there); the module gate; the SMS-style monthly cap.

## 2. The corpus

| Source | Collected | Not collected |
| --- | --- | --- |
| NCERT (CBSE) | every textbook grades 1 to 12 in English, Hindi and Urdu, the exemplars; PDFs from NCERT | — |
| Balbharati (MSBSHSE) | every textbook grades 1 to 12 in Marathi, Hindi, English and Urdu media; PDFs from ebalbharati | — |
| NIOS | its open course books | — |
| CISCE, IB, other state boards | the syllabus documents | the prescribed books (commercial publishers) |
| College streams | the syllabus PDFs of the affiliating universities and councils (SPPU, MUHS, MPKV, AICTE's model curriculum, BCI, PCI, NCTE, COA, ICAR), NPTEL and Swayam material, OpenStax and LibreTexts, NDLI's open holdings | the reference books the syllabi name (copyrighted; indexed by title and chapter only) |

Folder: `storage/corpus/<board or university>/<grade or programme>/<subject>/<file>` with a `manifest.json`
beside each file (title, source URL, licence as published, retrieval date, SHA-256). Kept in the storage
bucket, never in git. About 3 to 5 GB. Before launch counsel confirms the NCERT and Balbharati terms for use
inside a paid product; the assistant quotes at most a short passage with the citation, never a chapter.

## 3. Phases

### Phase 0 — corpus and licences (one week)

- `scripts/corpus-fetch.ts`: the downloader with the manifest, idempotent by checksum, resumable.
- PDF to text (the NCERT and Balbharati PDFs carry text; a Devanagari OCR fallback for scanned pages),
  chunking by chapter and section with headings kept, about 500 tokens a chunk.
- A `content` schema in the same Postgres with pgvector, no `schoolId` on the rows, outside the tenant
  policy the way `QuizTopic` already is. Embeddings with BGE-M3 (multilingual, Hindi and Marathi), keyword
  search beside the vectors, a reranker (bge-reranker-v2-m3). Embeddings are computed on the owner's
  machine for the whole corpus and loaded once; new chapters are embedded on the service machine's CPU.

### Phase 1 — the quiz bank generator, on the owner's machine (one to two weeks)

- Runs on the owner's laptop (an M5 Max with 128 GB runs a 30B-class model at full quality and a
  120B-class model quantised) through vLLM or llama.cpp, reading the corpus from the bucket or a local copy.
  Nothing is sent to a hosted model; the corpus never leaves the machine.
- Per chapter chunk the model drafts items in the bank's own shape: stem, four options, `answerIndex`,
  `solution`, `checkExpr` where the answer is numeric, `difficulty` on the existing ladder, and distractors
  written from the chapter's common misconceptions, not random wrong values.
- A second pass with the same model critiques every item: exactly one defensible answer, distractors
  plausible but wrong, nothing lifted verbatim from the text, the solution consistent with the answer.
- `scripts/verify-quiz.ts` runs its structure checks; near-duplicates are dropped by embedding similarity
  against the bank and the batch.
- Items land in `content/quiz/generated/<board>-<grade>-<subject>.json` with `source` reading
  "generated against NCERT Science, Class 8, chapter 4" and `reviewedAt` null. **No generated item is
  served until a person on the content team has read it** at `/appadmin` and stamped it; the importer
  refuses a generated file into a served topic without the stamp. The licence field is set at review,
  once the reviewer confirms the stem is original.
- Throughput and cost: about 10 to 15 seconds an item for draft plus critique, so 60,000 items (both
  boards, grades 5 to 12, core subjects, about 30 a chapter) is 7 to 10 days of the machine running and
  about ₹500 to ₹1,000 of electricity. The real cost is review: a minute an item is 1,000 hours, which is
  the content team's work over months, so generation is batched per grade and subject in the order the
  schools on the platform teach them.
- Translations go through the existing path: machine drafts on save, a native speaker's stamp per language.

### Phase 2 — the assistant service (two to three weeks)

- A separate process beside the jobs machine (`apps/assistant` or a process group in `fly.toml`),
  reached only through catalogued doors under `/api/v1/assistant/*`, module `ASSISTANT`, roles: everyone.
- The model never reads tenant data. When a question needs it ("what is my child's fee balance"), the
  service calls the person's own GET doors with the person's session, so the tenant fence and the role
  gate stay exactly as they are and nothing the person could not open can reach the model.
- Platform-help corpus: the docs, HANDOFF, the catalog's door summaries, the dictionaries' sentences,
  `docs/college.md`; answers name the page to go to.
- Curriculum answers carry citations (board, book, chapter, page); an answer without a retrieved passage
  says so rather than guessing.
- Minors: guardian consent recorded as the notifications consent is; names, ids and codes stripped from
  what the model sees; transcripts on a retention dial (`RETENTION_ASSISTANT_DAYS`, default 30); a refusal
  set for off-topic and unsafe questions; the pupil's language from their account.
- Controls: a monthly token budget per school like the SMS cap, with the overview showing how much is
  used; a kill-switch environment variable like the phone's; every call audited by count, never by text.
- Decision 0005 records the model endpoint as a third-party destination (decision 0002's list), the
  consent, the retention and what is stripped.

### Phase 2a — the assistant on the owner's machine first (part of Phase 2)

- The service and the model both run locally before anything is deployed: the model through the same
  vLLM or llama.cpp server as the generator, exposing an OpenAI-compatible endpoint on localhost; the
  service reads `ASSISTANT_MODEL_URL` (and `ASSISTANT_MODEL`), so the hosted provider later is a change of
  two environment variables, not of code. The retrieval layer uses the local Postgres, the same database
  the dev servers on :3000 and :8081 use, so the demo schools and colleges are the pilot tenants.
- Model for the local run: Qwen3-30B-A3B or gpt-oss-20b at full quality on the M5 Max (about 40 to 60
  tokens a second, a few seconds an answer for one person at a time); the large model only for the
  evaluation's hardest set.
- What the local run proves: the answers, the citations, the refusals, the role-aware platform help, the
  consent and stripping path for minors, the budget and the kill switch, en/hi/mr on web and phone. What
  it cannot prove: concurrency and latency under many users, uptime, and the hosted model's own quality,
  so the golden sets of Phase 4 are run once more against the hosted model before the switch.
- The local run costs nothing beyond electricity; its transcripts are the owner's test data and are
  purged with the demo data.

### Phase 3 — surfaces (one week)

- Web: a panel reachable from every role's home when the module is on; phone: a tab under More, the
  screen reading the same doors; both on the kit, en/hi/mr.
- The content team's review page gains a "generated" queue with accept, edit and discard, and the stamp.

### Phase 4 — evaluation and rollout (two weeks)

- A golden set of about 200 questions per board and grade band, scored for correctness and citation
  (does the cited chapter contain the claim); the platform-help set scored per role.
- Hindi and Marathi answers read by a speaker (R-14 applies here too).
- A red-team pass for a minor's questions (self-harm, adult content, another pupil's data).
- Pilot at the demo schools and colleges, then one real school with the switch on.

## 4. The model

Retrieval first; no fine-tuning in the first version. Two roles for models:

| Role | Where it runs | Candidates (open weights) |
| --- | --- | --- |
| Quiz generation and critique | the owner's machine | Qwen3-235B-A22B or gpt-oss-120b quantised for drafting; Qwen3-30B-A3B or gpt-oss-20b for the critique pass; Sarvam-M 24B evaluated for Hindi and Marathi items |
| The assistant's answers | the owner's machine first (Phase 2a), then hosted open weights (Together, Fireworks, Groq or an Indian host such as Sarvam) through the same OpenAI-compatible endpoint | Qwen3-30B-A3B or gpt-oss-20b for chat; the large model only where retrieval returns nothing useful |
| Embeddings and reranking | the owner's machine for the corpus, the service machine's CPU afterwards | BGE-M3, bge-reranker-v2-m3 |

Licences to keep to: Apache 2.0 (Qwen3, gpt-oss, Sarvam-M, Mistral Small) or MIT (DeepSeek); Llama 4 and
Gemma 3 carry community terms counsel would have to read. The field moves quickly: confirm the choice
against the current leaderboards at the start of Phase 1.

Self-hosting the assistant's model (one H100, ₹1.8 to ₹2.5 lakh a month) is worth it only past roughly one
to two million questions a month or when data residency under the DPDP rules requires it; then on an
Indian GPU cloud.

## 5. Cost

Generation: ₹0 in fees; electricity about ₹500 to ₹1,000 a week of running; review time as above.

The assistant, hosted, about 3,000 tokens a question with retrieval, at ₹84 per dollar:

| Line | 1 school (8,000 questions a month) | 10 schools | 100 schools |
| --- | --- | --- | --- |
| Service machine | ₹1,800 | ₹1,800 | ₹3,600 |
| Vector store on the existing Postgres | ₹100 | ₹300 | ₹1,500 |
| Embeddings and reranking | CPU, ₹0 | ₹0 | a small GPU, ₹8,000 |
| Inference, hosted open weights (₹10 to ₹50 per million tokens) | ₹250 to ₹1,200 | ₹2,500 to ₹12,000 | ₹25,000 to ₹1.2 lakh |
| **Per month** | **₹2,200 to ₹3,100** | **₹4,600 to ₹14,000** | **₹38,000 to ₹1.3 lakh** |

## 6. What this plan does not do

- Bulk-download commercial reference books or ICSE, IB and private-publisher textbooks.
- Let the model query the database or read anything the signed-in person could not open.
- Serve a generated question without a person's review stamp.
- Fine-tune a model before retrieval has been measured.
- Ship the assistant to minors before counsel has read the consent, retention and third-party terms.

## 7. Order and effort

Phase 0 and the generator (Phases 0 and 1) first, since they need no hosting and produce the bank the
content team can start reviewing; then the assistant service and surfaces running entirely on the owner's
machine against the demo tenants (Phase 2a and 3), the evaluation, and only then the hosted deployment. Six to eight weeks
for a first version, as three or four builder waves; the corpus downloader and the manifest are the first
day's work.
