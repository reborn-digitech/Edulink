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
recorded as refused, see below). No Hindi or Marathi book, no commercial book, no login.

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
| `prisma/migrations/20261008152105_assistant_content` | the three tables, pgvector, the HNSW and full-text indexes |
