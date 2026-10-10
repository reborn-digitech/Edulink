# The assistant on the owner's machine (Phase A)

How to bring up the assistant's two local model servers, fetch the curriculum corpus, ingest and
embed it, build the platform-help index, and ask a question end to end. The plan is
[docs/plans/assistant.md](../plans/assistant.md); this is Phase A of it. Nothing here is a product
surface yet: the doors, the panel and the safety layer are Phases B and C.

Everything runs from `apps/web` with Node 24 and Postgres 16 on PATH:

```sh
export PATH="/opt/homebrew/opt/node@24/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
cd apps/web
```

## 1. The two model servers

`scripts/model-serve.sh` runs llama.cpp's `llama-server` (Homebrew's `llama.cpp`), OpenAI-compatible,
on 127.0.0.1 only:

| Server | Model | Weights | Port | Memory in use |
| --- | --- | --- | --- | --- |
| chat | Qwen3-30B-A3B, Q8_0 (`Qwen/Qwen3-30B-A3B-GGUF:Q8_0`) | 32.5 GB | 8180 | about 34 GB |
| embeddings | Qwen3-Embedding-0.6B, Q8_0 (`Qwen/Qwen3-Embedding-0.6B-GGUF:Q8_0`), 1024 dimensions, last-token pooling, one slot, flash attention off | 0.64 GB | 8181 | about 2.5 GB |

```sh
npm run model:serve -- both     # both in the background; logs and pid files in storage/models/
npm run model:serve -- stop     # stops the two it started
npm run model:serve -- restart-embed   # the embeddings server alone
npm run model:serve -- chat     # one in the foreground (or embed)
```

The first start downloads the weights from the official Qwen repositories on Hugging Face into
`~/.cache/llama.cpp` (`LLAMA_CACHE`); later starts load from there in under a minute. Override the
ports with `ASSISTANT_CHAT_PORT` / `ASSISTANT_EMBED_PORT` and the quantisation with
`ASSISTANT_CHAT_REPO` (Q6_K is 25 GB, Q4_K_M 18.6 GB, for a machine with less memory).

**The embeddings server's one known fault.** llama.cpp b11429 on Metal answered vectors of nulls
when several sequences shared a micro-batch (four slots with 8k micro-batches, or flash attention
on), and once it had, every later answer too, until a restart. The script's settings (one slot,
flash attention off) gave 0 broken vectors in 2,400 test inputs and in the batch that broke the
others. The client refuses a broken vector (`EmbeddingBroken` in `src/lib/assistant-model.ts`) and
never stores one; the ingest retries, then embeds one chunk at a time, and stops with "restart it"
when the server answers every input broken. Check for stored damage with
`SELECT count(*) FROM "ContentChunk" WHERE vector_norm(embedding) = 0 OR vector_norm(embedding) = 'NaN'`
(0 expected); a non-zero count is mended by `npm run corpus:ingest -- --embed-only --reembed`.

The four variables the scripts read (`src/lib/assistant-env.ts`; `.env.example` has them):

```sh
ASSISTANT_MODEL_URL="http://127.0.0.1:8180/v1"
ASSISTANT_MODEL="qwen3-30b-a3b"
ASSISTANT_EMBED_URL="http://127.0.0.1:8181/v1"
ASSISTANT_EMBED_MODEL="qwen3-embedding-0.6b"
```

The ingest, the help index and the smoke script refuse to start without them. A hosted endpoint
is decision 0005's (Phase B): never point these at a host before it is written, since what a
person types would then leave the machine (decision 0002).

Check them:

```sh
curl -s 127.0.0.1:8181/v1/embeddings -H 'content-type: application/json' \
  -d '{"model":"qwen3-embedding-0.6b","input":["hello"]}' | head -c 200
curl -s 127.0.0.1:8180/v1/chat/completions -H 'content-type: application/json' \
  -d '{"model":"qwen3-30b-a3b","messages":[{"role":"user","content":"Say hello /no_think"}]}'
```

## 2. Fetch the corpus

```sh
npm run corpus:fetch -- --source=all --dry          # index pages only: what would be fetched
npm run corpus:fetch -- --source=ncert --grade=8    # one source, one class
npm run corpus:fetch -- --source=all                # everything (hours: one request at a time per host)
```

Sources: `ncert` (the English textbooks, classes 1 to 12, chapter by chapter, and the exemplar
problems; a book whose chapters are not served one by one is taken from its complete-book zip),
`balbharati` (the English-medium textbooks, standards 1 to 12, from books.ebalbharati.in),
`nios` (the secondary and senior secondary course material in English), `glossaries` (NCERT's
trilingual dictionaries; Balbharati's library lists none), `syllabi` (SPPU's syllabus libraries
for 2024, 2025 and 2026, AICTE's model curriculum, PCI, MPKV; MUHS, BCI, NCTE, COA and ICAR are
recorded as refused, see below), `papers` (the past entrance, olympiad and board sample papers, a
style corpus for the quiz bank's levels 5 and 6 only: section 8). No Hindi or Marathi book, no
commercial book, no login.

Files land in `storage/corpus/<board>/<grade or programme>/<subject>/<file>` with the folder's
`manifest.json` (title, board, grade or programme, subject, language, edition and year as the site
states them, source URL, licence text or link as published, retrieval date, SHA-256, size). The run
is idempotent by checksum and resumable: run it again and it fetches only what is missing. It
waits `CORPUS_PAUSE_MS` (1500) between two requests to one host and names `CORPUS_CONTACT` in its
User-Agent; set that to a real address before a full run.

**When a site refuses.** The run never retries past three attempts, never solves a CAPTCHA and never
logs in. A refused index page is written to `storage/corpus/<board>/_refused/index/manifest.json`
with `fetched: false` and the reason; a refused file keeps its own manifest entry with
`fetched: false`. The table at the end lists them. What to do: try the source alone a day later
(`--source=syllabi`); if a site is rendered by script (MUHS, BCI), a person downloads the syllabus
PDFs by hand into the right folder and runs `npm run corpus:ingest` (the ingest reads any PDF that
has a manifest entry; copy an entry from a neighbouring folder and change the fields). A site whose
certificate does not match its name is not fetched around (www.coa.gov.in on 8 October 2026; the seed is now coa.gov.in, whose certificate matches, and whose pages link no syllabus a plain fetch can see).

## 3. Ingest and embed

```sh
npm run corpus:ingest                                  # extract every new PDF, then embed every chunk without a vector
npm run corpus:ingest -- --source=ncert --prefix=ncert/8
npm run corpus:ingest -- --extract-only --shard=3/8    # eight of these side by side: pdfjs is single-threaded
npm run corpus:ingest -- --embed-only                  # one process, after the shards
npm run corpus:ingest -- --reembed --source=ncert      # new vectors for a source (a new embedding model)
```

Extract reads each PDF page by page with pdfjs-dist (`scripts/corpus-pdf.ts`), cuts the figures
(embedded images at least 150 px a side and drawn at least 60 pt) to
`<folder>/figures/<file>-p<page>-<n>.png` with `<file>.captions.json` beside them, reads a page with
no text layer by OCR (tesseract.js with the eng, hin and mar data from npm, never fetched at run
time; `CORPUS_OCR=0` turns it off), and chunks by chapter and section at about 500 tokens with the
heading path, the page range, the figure keys and the edition on every chunk
(`scripts/corpus-chunk.ts`). A document whose checksum is already in the table is skipped.

Embed sends `title › heading path` plus the chunk's text to `/v1/embeddings` in batches of 32, two
batches in flight (`CORPUS_EMBED_BATCH`, `CORPUS_EMBED_PARALLEL`), and prints chunks per minute.

Both run as the owner (the content tables are owner-written) and refuse a database that is not on
this machine.

## 4. The help index

```sh
npm run help:index -- --dry   # counts only
npm run help:index            # write, embed, then drop older commits' rows
```

One `HelpEntry` per door of the API catalog, per docs paragraph that says how to do something
(`docs/*.md`, `HANDOFF.md`, the "Where to look" columns of `docs/demo-schools.md`), and per nav
label, quick action and page heading in English, Hindi and Marathi, tagged with the commit. Rebuild
it after a release; it takes about two minutes.

## 5. Ask

```sh
npm run assistant:ask -- --role=STUDENT --grade=8 "explain newton's third law to me"
npm run assistant:ask -- --role=STUDENT --grade=8 --language=hi "मुझे न्यूटन का तीसरा नियम समझाइए"
npm run assistant:ask -- --role=ADMIN "where do I record a pupil's departure"
npm run assistant:ask -- --role=PARENT --json "what is photosynthesis"
```

It reads as the app role (DATABASE_URL), searches the help and, for STUDENT, TEACHER, FACULTY and
HOD, the curriculum (the class's own books first; the classes either side when nothing close is
there), builds the prompt in the asked language and prints the answer with its citations and the
model's tokens per second. A topic question from another role gets one sentence saying whom the
tutor is for.

## 6. The first full run (8–9 October 2026), disk and memory

| Source | Files on disk | Refused (`fetched: false`) | Documents ingested | Pages | Chunks |
| --- | --- | --- | --- | --- | --- |
| NCERT textbooks and exemplars | 1,747 (plus 180 optional prelims and answers the site does not have) | 255 (books the page lists and the site no longer serves, 404, zip too) | 1,607 (prelims read for the edition only) | 28,137 | 20,800 |
| Balbharati English medium | 160 books | 0 | 160 | 23,866 | 17,837 |
| NIOS secondary and senior secondary | 2,684 (143 Hindi- and Sanskrit-medium files removed after the run; the filter now catches them) | 8 | 2,684 | 57,225 | 44,001 |
| Syllabi (SPPU 769, AICTE 28, PCI 4, MPKV 15) | 813 | 3, and five sites (below) | 813 | 45,267 | 35,891 |
| Glossaries (NCERT trilingual: economics, geography, sociology) | 3 | Balbharati lists none | 3 (read by OCR) | 485 | 836 |
| **Total** | **5,406 PDFs, 19 GB** | | **5,267** | **154,980** | **119,365, all embedded** |

Sites refused or unreadable: MUHS and BCI (pages rendered by script), NCTE (timed out), ICAR (no
syllabus linked from a page a plain fetch can read), COA (see section 2), one NIOS course page (404).

| What | Where | Size |
| --- | --- | --- |
| Model weights | `~/.cache/llama.cpp` | 31 GB |
| Corpus PDFs and manifests | `apps/web/storage/corpus` | 19 GB |
| Figures: 64,148 PNG, long side 1400 px | `…/figures/` beside each PDF | 21 GB |
| `ContentChunk` with its HNSW index (932 MB) | Postgres | 1.9 GB |
| `HelpEntry` (2,700 entries) | Postgres | 79 MB |

Times on this machine (M-series, 128 GB): the fetch about 2 hours at one request per host; the
extract about 13 minutes for 3,000 documents on eight shards; the embedding 757 chunks a minute
(137 minutes for 103,679 chunks); the help index under a minute. A search: 30 ms for help, 90 ms
over the whole corpus, 190 ms scoped to one board and class. The chat model writes about 105 tokens
a second (60 for a long Marathi answer) when the embeddings server is idle, about 10 while it is
embedding at full tilt: do not embed and demonstrate at once.

Memory while both servers run: about 37 GB (34 chat, 2.5 embeddings). The extract shards take
about 1 GB each.

## 7. Where things are

| File | What |
| --- | --- |
| `scripts/model-serve.sh` | the two llama-server processes |
| `scripts/corpus-fetch.ts`, `scripts/corpus-lib.ts` | the downloader and the manifest layout |
| `scripts/corpus-pdf.ts`, `scripts/corpus-chunk.ts`, `scripts/corpus-ingest.ts` | PDF to runs and figures, chunking, the ingest |
| `scripts/help-index.ts` | the platform-help corpus |
| `src/lib/assistant-env.ts`, `src/lib/assistant-model.ts` | the endpoints' configuration, embeddings and chat calls |
| `src/lib/assistant-retrieval.ts` | `searchCurriculum`, `searchHelp`, the fusion, the reranker stub, the citation shape |
| `scripts/assistant-ask.ts` | the smoke script; since Phase B it runs the service's own path (`previewAnswer` in `src/lib/assistant/service.ts`): the same gates, prompt and answer gate as the doors |
| `tests/assistant-retrieval.test.ts` | fusion, chunking, configuration, and the fixture-corpus search (skipped without the endpoint) |
| `scripts/corpus-papers.ts`, `scripts/corpus-papers-chunk.ts` | the papers source (section 8): the bodies' pages read, and a paper cut by question |
| `src/lib/quiz-style.ts` | `papersStyleFor`, the style excerpts for quiz levels 5 and 6 |
| `tests/papers-corpus.test.ts` | the pages' parsers, the question chunker, the ranking, the tutor never citing a paper, and the style read against the ingested papers |
| `scripts/assistant-eval.ts`, `scripts/assistant-eval-score.ts`, `content/assistant-eval/` | the evaluation harness (`npm run assistant:eval`, `-- --pilot` through the doors on the demo tenants, about 50 minutes; the refusal set must be 180/180 or it exits 1), its pure scoring rules and the nine sets; output under `storage/assistant-eval/<stamp>` |
| `prisma/migrations/20261008152105_assistant_content` | the three tables, pgvector, the HNSW and full-text indexes |

## 8. The past papers: a style corpus for quiz levels 5 and 6 (10 October 2026)

Levels 5 (competitive) and 6 (olympiad) of the quiz bank's ladder are styles, not chapters (plan §8
item 6). The `papers` source collects the past question papers the bodies publish free of charge on
their own sites, never a coaching site or a mirror, and the ingest keeps them apart from the books:
every paper is a `ContentDocument` with `source` "papers", `styleOnly` true and `kind`
"entrance-paper", "olympiad-paper" or "board-sample-paper"; `searchCurriculum` excludes them in every
search (`STYLE_CORPUS_EXCLUDED` in `src/lib/assistant-retrieval.ts`), so the tutor never quotes or cites a
paper; the quiz generator reads them through `papersStyleFor` (`src/lib/quiz-style.ts`).

```sh
npm run corpus:fetch -- --source=papers --dry     # what each body's pages list
npm run corpus:fetch -- --source=papers           # about 9 minutes, 640 files, 0.5 GB
npm run corpus:ingest -- --source=papers --extract-only --shard=1/4   # four of these side by side
npm run corpus:ingest -- --source=papers --embed-only                 # one process, after
```

**What is taken, from where.**

| Test | Body and page | Taken | Level |
| --- | --- | --- | --- |
| JEE (Advanced) | the organising IIT's archive, jeeadv.ac.in/archive.html | Papers 1 and 2, 2007 to 2025, English (the Hindi copies and the architecture aptitude test, a drawing test, are not) | 5 |
| JEE (Main) | NTA, the "Question Papers" menu of jeemain.nta.nic.in | the current session's B.E./B.Tech. papers (2026, nine shifts); NTA's PDFs carry the questions as pictures, read by OCR | 5 |
| NEET (UG) | NTA, neet.nta.nic.in/archive/ | one English set a year (2020, Set E1: the sets are the same questions reordered); a scan in two columns, read half by half by OCR | 5 |
| CBSE Class X and XII | cbseacademic.nic.in, its session pages and archive | sample question papers and marking schemes, sessions 2022-23 to 2026-27, the academic subjects in English (no language, music or art papers, no Hindi or visually impaired copies) | 5 |
| INMO, RMO, PRMO, IOQM, INPhO, INChO, INBO, INAO, INJSO | HBCSE, olympiads.hbcse.tifr.res.in/how-to-prepare/past-papers/ | the English papers, model solutions and keys, 2000 to 2026 | 6 |
| NSEP, NSEC, NSEB, NSEA, NSEJS | IAPT, iapt.org.in, its "Papers & Solution" page and its NSE year pages | the papers and answer keys it links (result lists, which name children, are never taken) | 6 |

Each file's manifest entry carries, besides the book fields, `paper`: the body, the test, the sitting
("Paper 1", "Set E1", "Mathematics (Standard)"), the part ("paper", "answer-key" or "paper+answers"),
the level, the page the link was read from and the link's words. `board` is the body as it names
itself, `gradeOrProgramme` the test's class band ("11-12", "9-10", "10"), `subject` the paper's
("Physics", or "Physics, Chemistry, Mathematics" for a paper of several, whose questions the chunker
files by section). Files land in `storage/corpus/papers/<body>/<band>/<test>/`.

**What was refused on 10 October 2026** (rows with `fetched: false` under `papers/<body>/_refused/`):
MHT-CET (the State CET Cell links no question paper from its public pages; a candidate sees their own
paper behind the login, which is not used); NTSE (NCERT's page links scoring keys and blank OMR
sheets, no question paper, and a key without its paper is not taken); CUET (UG) (NTA links no sample
paper from the CUET pages); MSBSHSE (the board's site is rendered by script, SvelteKit, so a plain
fetch sees no documents); INMO 2021 (HBCSE prints the PDF's password beside it; a locked file is not
opened); and two HBCSE links that answer 404 (INMO 2008, RMO 2000 solutions). A person who wants
these downloads them by hand from the body's site into the right folder, with a manifest entry copied
from a neighbour (section 2).

**Cut by question** (`scripts/corpus-papers-chunk.ts`). A paper is read with its one- and
two-character runs kept (question numbers, option letters) and no figures. A question starts at a
line beginning with its number ("Q.7", "Question Number : 7", "7.", or a number alone at the left
edge, as CBSE's tables print it), taken only in sequence or as 1 after a section heading, so a
numbered list inside a stem never cuts it; its options stay with it; numbered front-matter
instructions are given back to "instructions" when the real question 1 appears. Running heads, page
numbers and NTA's computer-based-test labels are dropped. A section or subject heading names the
questions' subject; a paper of several subjects that names none (JEE (Advanced)) gets, per question,
the subject most of its neighbours' words point to. Chunk kinds (`ContentChunk.kind`): "question",
"questions" (a paper whose numbering could not be read, cut by size), "answer-key" (a key, a model
solution or a marking scheme: by question where its entries are answers, by size where it is a grid
of letters), "instructions".

**The read for the generator.** `papersStyleFor({ subject, grade, level: 5 | 6, topic, limit, test? },
ctx)` embeds the chapter's topic and returns the nearest questions of the level's papers (5: entrance
and board sample papers; 6: olympiads), each with the test, the year, the sitting, the body, the class
band and whether the grade is in it. Ranking: similarity, less 0.03 a class outside the band, less
0.02 for a neighbouring subject (Physics for Science, Astronomy for Physics), at most two questions from
one paper. The excerpts are models of form and difficulty for the prompt, never questions to copy or
to show a pupil.

**The first run (10–11 October 2026).**

| Body | Files fetched | Pages | Question chunks | Keys and solutions | Instructions | Blocks (numbering unread) |
| --- | --- | --- | --- | --- | --- | --- |
| JEE (Advanced) | 38 (2007–2025) | 1,080 | 1,951 | 0 (the archive has no keys) | 241 | 16 |
| NTA: JEE (Main) 2026, NEET (UG) 2020 | 10 | 293 | 855 (675 + 180) | 0 | 42 | 0 |
| CBSE Class X and XII | 210 (105 papers, 105 marking schemes) | 2,306 | 3,396 | 3,258 | 441 | 66 |
| HBCSE olympiads | 279 (139 papers, 123 keys or solutions, 17 both) | 3,249 | 2,898 | 1,281 | 634 | 22 |
| IAPT NSEs | 105 (19 papers, 86 keys) | 550 | 1,226 | 405 | 318 | 0 |
| **Total** | **642 PDFs, 485 MB** | **7,478** | **10,326** | **4,944** | **1,676** | **104** |

All 17,050 chunks embedded (9.9 minutes for the first 16,961, about 1,900 a minute). The fetch took
9 minutes at one request per host. The extract ran on four shards for about forty minutes under a load
average above 200 (other runs on the machine); 80 papers were then read again with the garbled-page and
pictures rules (`ocrGarbled`, `ocrRenderAll`, and a second read with `ocrPictures` when fewer than three
questions were found), which took the JEE (Advanced) papers of 2007–2010 and 2015 and the old INMO, RMO
and INBO papers from a line of junk each to their questions. Left as they are: 15 papers whose
numbering the chunker cannot read (CBSE's Economics, Computer Science and Informatics Practices papers
of some sessions, the PRMO papers of 2012–2014, INMO 2010, JEE (Advanced) 2016 Paper 2), filed as
"questions" blocks; 51 chunks of the 17,050 whose text is still garbled; exponents and subscripts
printed apart from their base ("P N/m . … 2" for P N/m²), as every PDF text layer gives them.
A style read takes 25–110 ms.

**Terms.** The manifests carry each body's terms as published: NTA's copyright policy ("may be
reproduced free of charge after taking proper permission from National Testing Agency"), the
copyright lines of the JEE (Advanced) archive, HBCSE and IAPT, and the CBSE academic site's address
(it prints no terms). The papers are read for style and never reproduced or shown; whether that use
needs the bodies' permission is a question for counsel with the figures question (plan §8 gap 1).
