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

## 1. The model servers

`scripts/model-serve.sh` runs llama.cpp's `llama-server` (Homebrew's `llama.cpp`), OpenAI-compatible,
on 127.0.0.1 only:

| Server | Model | Weights | Port | Memory in use |
| --- | --- | --- | --- | --- |
| chat | Qwen3-30B-A3B, Q8_0 (`Qwen/Qwen3-30B-A3B-GGUF:Q8_0`) | 32.5 GB | 8180 | about 34 GB |
| embeddings | Qwen3-Embedding-0.6B, Q8_0 (`Qwen/Qwen3-Embedding-0.6B-GGUF:Q8_0`), 1024 dimensions, last-token pooling, one slot, flash attention off | 0.64 GB | 8181 | about 2.5 GB |
| small (Vidura's gate, pass 3; not in use, see section 11) | Qwen3-4B, Q8_0 (`Qwen/Qwen3-4B-GGUF:Q8_0`), four slots of 4k | 4.3 GB | 8182 | about 5 GB |

```sh
npm run model:serve -- both     # both in the background; logs and pid files in storage/models/
npm run model:serve -- stop     # stops the two it started
npm run model:serve -- restart-embed   # the embeddings server alone
npm run model:serve -- chat     # one in the foreground (or embed)
npm run model:serve -- start-chat      # one in the background (or start-embed); the bank desk's Start
npm run model:serve -- stop-chat       # one the script started (or stop-embed); the bank desk's Stop
npm run model:serve -- start-small     # Vidura's gate model (pass 3), in the background; stop-small stops it
```

The bank desk (`/root/quiz-review`, `/appadmin/quiz-review`) starts and stops these servers through the
same script and nothing else; section 9 says how.

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

### The guide in Hindi and Marathi (Vidura pass 2, 17 October 2026)

```sh
npm run help:index -- --render=hi,mr                    # render what is not yet rendered, then rebuild the index
npm run help:index -- --render=hi --render-limit=20     # a trial: twenty new renderings, then the rebuild
npm run help:index -- --render=hi,mr --render-rejected  # render again what the reviewer rejected
```

`--render` sends every heading and paragraph of `docs/guide/*.md` that has no rendering in that language yet to the
chat server (four at a time, `--render-parallel=N` for fewer), with the screen's own Hindi or Marathi words for the
labels the paragraph quotes (a glossary from the dictionaries), and keeps a rendering only in Devanagari with every
page path of the English (`src/lib/assistant/guide-render.ts`). Each lands in `HelpRendering` as UNREVIEWED and is
used at once: every rebuild writes a Hindi and a Marathi help entry per guide paragraph rendered, its heading path in
that language, so a Hindi question meets help written in Hindi and the drawer suggests the guide's own questions in
Hindi. A unit's identity is a hash of its English, so editing a paragraph of a guide leaves its old rendering unused
and the next `--render` renders the new words; nothing else needs doing after a guide changes. On 17 October 2026, with
another project's two model servers loaded beside the chat server, a rendering took about 30 seconds a slot (7 to 15
tokens a second); render on an otherwise idle machine.

A speaker reads them on the operator's panel, `/root/vidura-review` ("Guide in Hindi and Marathi"): the English beside
the rendering, Approve, a correction saved with "Save the correction", or Reject. A rejected rendering leaves retrieval
and the suggestions at once (the searches read its status); a correction is read in its new words at once and its
vector follows at the next rebuild. Each act is audited (`vidura.rendering.approve`, `.edit`, `.reject`). The content
team reads the same queue at `/appadmin/vidura-review`; the practice bank's own Hindi and Marathi stay on
`/appadmin/translations`. The counts waiting are on `/root` and `/appadmin`. Doors: `GET
/api/v1/appadmin/vidura/renderings` and `POST /api/v1/operator/vidura/renderings/{renderingId}`.

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
| `src/lib/quiz-jobs.ts`, `src/lib/quiz-jobs-desk.ts` | the generation job and the model servers' control (section 9): the one writer of a run's row, the one caller of `model-serve.sh`, and the desk's gate and audit |
| `scripts/quiz-gen/job.ts`, `scripts/quiz-gen/plan.ts` | the job's runner (`quiz-gen/cli.ts --job=<id>`) and the order it takes the chapters in |
| `storage/quiz-jobs/<id>.log` | a run's own log (the generator's lines) |

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

## 9. Generation started and stopped from the bank desk (11 October 2026)

The owner's decisions of 11 October 2026: the generated bank is published without review (an item that passes the
generator's own checks is served the moment it is loaded, with its Hindi and Marathi), the operator and the app admins
edit or take an item down afterwards on the bank desk, and **generation is started and stopped from that desk**. The
desk is `/root/quiz-review` for the operator and `/appadmin/quiz-review` for the content team; the card is "Generate
questions".

**Start.** Choose a board, a class, a subject and a chapter range (both chapter fields empty: every chapter of the book),
or "Everything not yet generated" (classes 6 to 10 mathematics and science first, both boards, then the rest), and,
if you want, the questions per chapter (empty: four a level). Start:

1. reads the two servers' health endpoints (`127.0.0.1:8180/health`, `127.0.0.1:8181/health`; 200 is up, 503 is
   loading, nothing answering is down);
2. claims the one slot (a second Start while a run is waiting, running or stopping is refused: "A run is already
   going");
3. starts through `scripts/model-serve.sh start-chat` / `start-embed` exactly the servers that were down, and records
   them on the run (the card says "Starting the model", about a minute);
4. spawns the runner, `scripts/quiz-gen/cli.ts --job=<id>`, detached, with its log in `storage/quiz-jobs/<id>.log`.

The runner waits for both servers (ten minutes at most), then works chapter by chapter, leaving out every chapter whose
batch already exists in `content/quiz/generated/` — so a run picks up where the last one stopped. The live line on the
card is rewritten after every item: the chapter running, drafted and kept so far, the keep rate, seconds per kept
item, rejects per stage, and the last chapter's numbers. Each chapter it finishes is written, verified
(`scripts/verify-quiz.ts`) and loaded into the bank (`scripts/quiz-queue-load.ts`), so its items reach pupils while
the run goes on; a bank that does not verify leaves the file written and the chapter named under "Could not be
generated" (`npm run quiz:queue` loads it later).

**Stop.** The run turns "Stopping"; the runner reads its row every three seconds, finishes the item in hand and halts.
The chapter it was on is not written — nothing half-written lands — and the next run generates it again from the
start (the seeds repeat, so it asks the same questions). When a run ends (stopped, finished or failed) it takes down
through `model-serve.sh stop-chat` / `stop-embed` the servers **it** brought up, and no others: servers that were
already up for the assistant stay up.

**The model servers line.** The card lists both servers, Running, Starting or Stopped, with the model and the port,
each with its own Start and Stop. Stop is refused while a run is active ("Stop the generation run first"), and for a
server the script did not start (no pid file in `storage/models/`: it was started by hand, and is stopped there). The
operator's dashboard (`/root`) and the content team's home (`/appadmin`) show the same two lines, read live with a
ten-second cache, and a link to the desk.

**A run that died.** If the runner's process is gone (the machine slept, the process was killed) or has not written for
ten minutes, the next read of the card marks the run Failed with the reason ("the runner's process (pid N) is no
longer running") and frees the slot; its servers go down by the same rule. Press Start again: it picks up at the first
chapter with no batch.

**From a shell.** The same library is what the doors call: `GET /api/v1/appadmin/quiz-jobs` (the run and the servers),
`POST /api/v1/appadmin/quiz-jobs` (start; 201, 409 while one runs), `POST …/{jobId}/stop`,
`POST …/servers/{chat|embed}/start|stop`, for the operator and the app admins with a bearer token. `npm run quiz:gen`
from a shell still runs one chapter in the foreground and loads nothing; it does not take the desk's slot, so do not
run both at once on one machine (they would share the chat server's four slots).

**Hosted.** The runner runs where the model runs. On the owner's machine that is this machine; on a hosted deployment
the job belongs on the model's host, started from the same row and doors.


## 10. The competitions crawler (12 October 2026)

The crawler reads the official organisers' own sites and suggests the competitions they announce. What it finds
lands on the competitions desk as drafts for a person to publish. The plan, with the rules, is
[docs/plans/competitions-crawler.md](../plans/competitions-crawler.md).

**Where.** The desk is `/appadmin` for the content team and `/root/competitions` for the operator. It has three tabs:

- **Competitions**: the platform's competitions.
- **Suggested from the web**: the crawl card, then the waiting drafts, "Changed since review" and "Dismissed".
- **Sources**.

**The sources.** The thirteen official organisers are seeded by `npm run zz:fixtures` (and by `npm run
competitions:crawl -- --seed-sources`). The seed adds a root only when it is not in the table at all.

- On the Sources tab you can add an organiser's own site, switch a source off or on, or remove it. Removing is a
  stamp: what the source suggested stays on the desk.
- Never add a coaching site or an aggregator. Untick "This is the organiser's own site" for anything that is not
  the organiser's own: its competitions then publish unchecked.
- `npm run competitions:crawl -- --check-sources` asks every root again (robots.txt and the root page, one
  request a second) and prints what answered.

**Start.** Press Start on the crawl card. Start:

1. reads the two model servers' health;
2. claims the one crawl slot. A second Start is refused while a crawl runs. A quiz generation run may go on beside
   a crawl;
3. brings up through `scripts/model-serve.sh` exactly the servers that were down, and records them;
4. spawns the runner, `scripts/competitions-crawl/cli.ts --job=<id>`, detached, with its log in
   `storage/competition-crawl/<id>.log`.

The runner then reads one source at a time:

- robots.txt first;
- then the root page and the same-host pages it links to, at most forty;
- one request a second;
- every page cached by URL and hash and asked for again conditionally.

A new or changed page that names a competition and a year goes to the chat model. Each entry the model returns is
refused or kept by code, then deduplicated and landed.

The live line is rewritten after every page:

- sources visited;
- pages read and pages unchanged;
- candidates;
- new drafts, updated drafts, "dismissed and unchanged", and published ones changed;
- refusals by reason;
- the sites not read, with why.

Each source's own numbers are kept on the Sources tab.

**Stop.** The crawl turns "Stopping" and the runner halts after the page in hand. A page whose extraction did not
finish keeps no hash, so the next crawl reads it again.

When a crawl ends it takes down the servers **it** brought up, with one exception: if a quiz generation run is still
going, the servers are handed to that run, and go down when it ends (`src/lib/model-holders.ts`). A server's own Stop
on the quiz desk is refused while either kind of run is active. A dead runner (its pid gone, or no heartbeat for ten
minutes) is marked Failed on the next read, as a quiz run is.

**Review.** Under "Suggested from the web":

- **Publish** a draft. It is marked "Checked by Shalaghar" only when its source is the organiser's own site.
- **Edit** it in place.
- **Dismiss** it with a reason. It is not suggested again unless its page changes.

Under "Changed since review" a published competition shows what its page now says. The crawler never edits a
published one. Press Reviewed when you have looked, or Back to draft to edit it and publish it again.

**Timing.** The model is shared with the quiz generator; on 12 October each page took about forty seconds of the
chat model while a generation run held three of its four slots. Pages with no competition word and no year are not
sent to the model.

**From a shell.** The doors are:

- `GET /api/v1/appadmin/competition-crawl` (the crawl and the servers);
- `POST` to the same address to start (201, or 409 while one runs);
- `POST …/{jobId}/stop`;
- `GET` and `POST …/sources`, and `POST …/sources/{id}` with `ENABLE`, `DISABLE` or `REMOVE`;
- `GET /api/v1/appadmin/competitions/suggested?show=SUGGESTED|CHANGED|DISMISSED`, and `POST
  /api/v1/appadmin/competitions/{id}/edit|dismiss|reviewed`.

They are for the operator and the app admins, with a bearer token.

## 11. Vidura's speed and operations (pass 3, 18 October 2026)

### The time to the first word

Vidura shows nothing unchecked: the answer streams only after the answer gate has passed it, so the person's first word
arrives with the whole checked answer. `npm run assistant:latency` asks the twenty questions of
`content/assistant-eval/latency.json` (seven Using Shalaghar, six My records with a door's answer handed in, seven
Learning; en, hi and mr) through `previewAnswer`, two rounds, and prints per question the first word, the searches,
the rendering, the two classifier calls, the answer (its tokens) and how much of the answer's prompt the chat server
took from its cache. Run it on an idle machine.

What the measurement found on 18 October 2026, and what changed:

- **The searches, not the model, were the wait.** A help question waited two to ten seconds for the corpus's exact scan
  (119,365 chunks), which a role without the tutor runs only to tell a topic question from a platform one, and a pupil's
  help question ran the class's books, the classes either side, NCERT and every class in turn. The gate now asks for the
  corpus only when its answer can change the verdict (the help scope closed, the classifier saying CURRICULUM, or a pick
  of Learning; `gate.ts`, the books searched once in `service.ts`), with the verdicts the same as before (a test runs
  every label and scope both ways). The help index and the person's doors are searched side by side.
- **The prompt cache.** Every chat request sends `cache_prompt`, and llama-server keeps each slot's prompt and its
  host-memory cache (`--cache-ram`, 8 GB by default), so a question of the same role and language reads its system
  prompt from the cache. Opening every system prompt with the role-free rules, for a longer common start, was tried: the
  server then took 384 to 1,300 tokens of each answer's prompt from its cache, about 0.1 s, but the help set's numbered
  steps fell from 138 to 108 of 200 and a Marathi tutor answer came back in Hindi, so the order stays as pass 2 had it.
- **The two classifier calls** take about 0.1 s each on the chat model with its cache. The plan's small model,
  Qwen3-4B (`start-small`, `ASSISTANT_GATE_MODEL_URL`), took them to about 0.07 s, but it failed the refusal gate
  (178/180: two Marathi off-topic questions, "who won yesterday's cricket match" and "play a game with me", called
  PLATFORM with 0.97 and 0.997), so the classifier stays on the chat model and the variables stay unset. The code to
  use a small model is in place (with a fall back to the chat model when the small server does not answer at all);
  try another small model only with the refusal set at 180/180.

Measured back to back on 18 October 2026, the code of pass 2 from a worktree of its commit and pass 3's final code,
two rounds each, the median of twenty questions:

| | Before (pass 2's code) | After (pass 3) |
| --- | --- | --- |
| First word | 5.64 s (5.54 and 5.50 s on two earlier runs) | 1.72 s |
| Using Shalaghar / My records / Learning | 5.41 / 7.15 / 2.91 s | 1.78 / 0.82 / 2.19 s |
| Searches | 4.35 s | 0.29 s |
| The two classifier calls | 0.20 s | 0.25 s (on the small model: 0.14 s, not adopted) |

### Standard answers (`/root/vidura-answers`)

The operator asks Vidura a question as a role ("Ask as"); it goes through `previewAnswer` like anyone's, and the outcome
is kept as a draft for seven days. An answered "Using Shalaghar" answer to a how-to or where-is question that cites no
row of anybody's records can be marked as the standard answer (an earlier one for the same question is revoked). A person
of that role whose question, in that language, reads the same (`standard-store.ts` `questionKey`: one form, no marks, no
"please", "how can I" and "how to" as "how do I") is served it after the tables, the thresholds and the classifier, with
no answering model, never for a question pointing at the page, a follow-up, "go on", "Explain this" or a pick of My
records, and the drawer shows "Checked answer". Each serving counts on the answer (its hits, on the desk) and on the
school's usage row (the office's card, "Answered from a standard answer"). Revoke takes it out at once. Every act is
audited (`vidura.answer.try`, `.check`, `.revoke`, `.discard`). Doors: `GET` and `POST /api/v1/operator/vidura/answers`,
`POST /api/v1/operator/vidura/answers/{answerId}`.

### The unanswered report (`/root/vidura-unanswered`)

Every answer row now keeps the mode the gate reached and its reason codes (never a word): NOTHING_FOUND (below both
thresholds, or no passage and no data), CLASSIFIER, or the answer gate's codes. The nightly `vidura:gaps` job (02:50)
counts the last thirty days per school, day, role, mode, verdict and reason into `AssistantGapCount` (the operator reads
every school's), never the counsellor routes, and keeps the first six words of the questions that found nothing when two
people or more asked them (`AssistantGapStem`). The page shows the sums by mode, role and school, why questions were
refused, what the checks found, and the stems; "Download CSV" (`GET /api/v1/operator/vidura/unanswered/export`, audited).
Run the count by hand with `npm run job -- vidura:gaps`.

### Evaluation runs from the panel (`/root/vidura-evals`)

Choose the sets (all nine by default) and, if you like, at most how many cases a set; Start. Like a generation run
(section 9): one at a time; refused while a generation run or a crawl holds the model (its scores would measure that
run: pass 2's discarded run); the servers the run needs that are down (chat and embed, and the small model when the gate
asks one) are brought up through `scripts/model-serve.sh` and taken down when it ends, or handed to a generation run or
a crawl still going (`src/lib/model-holders.ts`, three kinds of holder now). The runner is `scripts/assistant-eval.ts
--job=<id>` (log in `storage/assistant-eval/jobs/<id>.log`, results in `storage/assistant-eval/panel-<stamp>`); it
rewrites the live line every three seconds (the set, its cases done and passed, the run's cases and minutes) and records
its own pid when it begins, so the reaper watches the process doing the work. Every read of the card reaps a run whose
pid is gone; a test suite that reads the runs with a fake machine must not run beside a real run (tests/vidura-three
skips its run cases while one is active, after a suite run twice ended a live run on 18 October 2026). Stop halts it after the case in hand and
keeps the scores of what it ran. Each run keeps its scores per set, the refusal gate's verdict and the harness's own
lines. Doors: `GET` and `POST /api/v1/operator/vidura/evals`, `POST /api/v1/operator/vidura/evals/{jobId}/stop`.

## 12. College knowledge and the reference allow-list (Vidura pass 4, 18 October 2026)

### What the college tutor searches

A college's tutor (a college STUDENT, FACULTY or HOD) searches **the whole corpus as before** — the NCERT books of
classes 11 and 12, NIOS, Balbharati, the syllabi — and, side by side with it, **the sources only a college reads**:
the documents whose `ContentDocument.audience` is `COLLEGE` (the Wikipedia subset), its own streams' first
(`School.streamsJson`), every stream's when those fall short. The two lists are merged by `booksFirst`
(`src/lib/assistant/service.ts`): a book's passage keeps its place ahead of an article's unless the article is closer by
more than `BOOKS_FIRST_MARGIN` (0.04); a syllabus takes no margin (it lists a topic, an article explains it). A school's
search never reads a college source: `searchCurriculum` leaves them out unless asked (`collegeSources: "ONLY"` or
`"INCLUDE"`), so every search that existed before pass 4 is the same search.

The filter is written as `COALESCE(d."audience", '') <> 'COLLEGE'`, not `"audience" IS NULL`: on 18 October, before the
table's statistics knew the new column, the planner read IS NULL as 0.5 % of the books, chose a nested loop that ran
`to_tsvector` over every chunk, and the keyword half of an unscoped search took 43 s instead of 22 ms. `corpus:ingest`
now runs `ANALYZE` on the two content tables after its extract pass.

### The sources, and the ones left out

```sh
npm run corpus:fetch -- --source=wikipedia                     # the nine streams' articles, one API request each
npm run corpus:fetch -- --source=wikipedia --stream=LAW        # one stream
npm run corpus:fetch -- --source=indiacode,nptel,swayam        # writes down why each is not taken; fetches nothing
npm run corpus:ingest -- --source=wikipedia                    # cut by section, attribution on every document, embedded
```

| Source | Taken | Licence as published | Why |
| --- | --- | --- | --- |
| Wikipedia (`wikipedia`) | yes: the articles in `scripts/corpus-college.ts` per stream (law, commerce, management, engineering, pharmacy, education, architecture, agriculture, health sciences) | CC BY-SA 4.0 (the API's own rights information) | share-alike allows this use with attribution: every passage's citation carries the article, the revision and its date, the permanent address and the licence (`ContentDocument.attribution`, drawn under the citation on the web and the phone) |
| India Code (`indiacode`) | **no** | Copyright Policy of 22 June 2026: the legislative texts are the Legislative Department's; commercial use, reproduction and "systematic extraction, scraping, or harvesting" need its prior written permission | the plan called the bare acts public domain; the portal's own terms say otherwise. Linked only (its Hyper Linking Policy needs no permission). To take them: the department's written permission, or counsel's reading of the Copyright Act's section 52(1)(q) |
| The Constitution from legislative.gov.in | **no** | — | the page is rendered by script, as MUHS and BCI were |
| NPTEL (`nptel`) | **no** | "Distributed under Creative Commons Attribution-ShareAlike CC BY - NC - SA" (the footer) | Vidura is part of the paid plans; the non-commercial clause does not allow passages of it in a paid product's answers. Linked only |
| SWAYAM (`swayam`) | **no** | Terms of Use: course materials "for your personal use in connection with those courses and programs only"; courses behind a sign-in | linked only |

Each refusal is a row with `fetched: false` under `storage/corpus/<source>/_refused/index/manifest.json`, the terms in
their own words. A Wikipedia article is fetched as the plain extract of one revision
(`action=query&prop=extracts|revisions|info&explaintext`), written as `<slug>.txt` beside its manifest entry; a stub
under 2,000 characters is not kept, an article over 150,000 is cut at a section; the reference sections ("See also",
"References", "External links"…) are dropped by the chunker (`chunkPlainText` in `scripts/corpus-chunk.ts`). On
18 October 2026 the files were fetched into an isolated folder under the session's scratchpad, read as data, then copied
to `storage/corpus/wikipedia/`. Set `CORPUS_CONTACT` before a run: Wikimedia asks for a contact in the User-Agent (the
run of 18 October named the repository's address).

The run of 18 October 2026: 435 titles asked, 419 articles kept (law 77, engineering 53, commerce 47, management 45,
pharmacy 45, health sciences 40, agriculture 39, architecture 37, education 36; an article chosen for two streams is one
document listing both), 9 stubs and 5 titles with no article, 13.2 MB of text, 12 minutes at one request a second;
8,608 chunks, extracted in seconds and embedded in 4.6 minutes; the corpus is now 6,328 documents and 144,824 chunks,
every one with a vector. A college search: 0.7 s for the books, 0.2 s for the college sources.

### The reference allow-list (`/root/vidura-references`)

The operator keeps the public education sources Vidura may link to beside a **Learning** answer (`ReferenceSource`,
migration `vidura_references`, seeded with NCERT OFFICIAL on YouTube, NPTEL, SWAYAM, Khan Academy India and India Code,
each with its licence as published). A link is built by the server — never written by the model — from the source's
https template on its own host with the cited passage's heading in place of `{topic}` (a Wikipedia article's title,
else the book's chapter), so nothing the person typed leaves the platform. Who sees links: the roles the source names;
a STUDENT only at a college and only when a recorded date of birth makes them eighteen or older; **never a pupil at a
school, while decision 0002 stands** (it is not relaxed, and the page says so). A LAW source is linked only beside a law
passage. Medium is refused as a host. Add, edit, switch off and on are audited (`vidura.reference.*`). Doors: `GET` and
`POST /api/v1/operator/vidura/references`, `POST /api/v1/operator/vidura/references/{sourceId}`.

### The college knowledge set

`content/assistant-eval/college.json`, ninety questions (ten a stream, eight English, one Hindi, one Marathi), run as
`npm run assistant:eval -- --sets=college` or from `/root/vidura-evals`. Each is asked as a college STUDENT of its stream
and scored for the answer (answered, keywords, cited) and its sources (a cited passage from a document the case
accepts — the stream's articles or a book that genuinely teaches the topic — and every cited Wikipedia passage
carrying its attribution). On 18 October 2026: 27/90 before the sources were ingested, 72/90 after in the full run of
the ten sets (70/90 when run alone).
