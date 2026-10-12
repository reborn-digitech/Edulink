# Competitions suggested from the web: the crawler

Status: built 12 October 2026 (the owner's ask of the same day). Code: `apps/web/scripts/competitions-crawl/`,
`apps/web/src/lib/competition-crawl-{jobs,desk,rules}.ts`, `apps/web/src/lib/model-holders.ts`, the desk in
`apps/web/src/components/competitions-desk/`. Runbook: [assistant-local.md §10](../runbooks/assistant-local.md).
Suite: `apps/web/tests/competitions-crawl.test.ts`.

## What it is

The platform's competitions page lists the competitions posted for every school. Until now the content team
typed each one by hand. The crawler reads the official organisers' own websites and asks the local chat model
which competitions each page announces. What it finds lands on the competitions desk as **drafts**, under a
new tab, "Suggested from the web". A person decides what is published.

The desk is at `/appadmin` for the content team and at `/root/competitions` for the operator. It has three
tabs:

- **Competitions**: the platform's competitions, as before.
- **Suggested from the web**:
  - The crawl card: Start, Stop, the live line, and the model servers' state.
  - The drafts waiting.
  - The published competitions whose page changed since they were reviewed.
  - The dismissed suggestions.
- **Sources**: the organisers' sites the crawler reads, with their last crawl's numbers.

## The sources rule

- **Organisers' own sites only.** A coaching site, a news site or a site that lists other people's
  competitions is not a source.
  - A source carries `official`. Publishing a competition marks it "Checked by Shalaghar" (`verified`)
    only when its source is official.
  - The add form asks the question outright.
- **The seed list** is `scripts/competitions-crawl/sources.ts`, thirteen organisers. The ZZ fixture adds
  only roots not yet in the table, so a source the desk disabled or removed stays as it is. Removing a
  source is a stamp, not a delete.
  - Each root was checked by hand on 12 October 2026 with a plain GET under the crawler's User-Agent;
    `npm run competitions:crawl -- --check-sources` asks again.
  - Two addresses did not answer and are not used:
    - `https://www.mscepune.in/` gave no answer; `https://mscepune.in/` does, and is the one listed.
    - `https://mtsexam.org/` failed its TLS certificate; `https://www.mtsexam.org/` works, and is the one
      listed.
- **Polite, by construction** (`http.ts`, `robots.ts`, `crawl.ts`):
  - **robots.txt** is honoured, read as RFC 9309 says: the crawler's own group before `*`, the longest
    rule wins, `*` and `$` are understood, and a Crawl-delay is honoured.
  - A 4xx answer for robots.txt means no rules. A 5xx, or no answer, means nothing on that site is read
    in this crawl.
  - **One request at a time per host**, at least one second apart.
  - **A User-Agent that names the platform.** `CRAWLER_CONTACT` (or `CORPUS_CONTACT`) adds a contact
    address when one is set.
  - **GET only.** No form is posted, no cookie is kept, no login is tried.
  - A site that needs a login, a form or JavaScript to show its words is **refused and recorded**, as the
    corpus fetcher records MUHS. On 12 October that was SilverZone and Vidyarthi Vigyan Manthan: both
    are single-page apps.
- **What is read**: the root page, and the pages it links to one level down on the same host. That is at
  most forty pages a source, with the links whose address promises a competition read first. Pictures,
  archives and office files are skipped.
- **The cache**: every page is cached by URL with its SHA-256 and the server's ETag and Last-Modified
  (`CompetitionCrawlPage`).
  - The next crawl asks conditionally. A 304, or the same bytes, is a cached hit and is not sent to the
    model again.
  - A page whose extraction failed keeps no hash, so it is read again next time.

## The model's part, and what code decides

- **Extraction.**
  - HTML is turned into text by a small extraction (`text.ts`); PDFs go through the corpus ingest's
    text layer (`corpus-pdf.ts`, no OCR).
  - The text is cut to the chat model's window: about 4,500 tokens of an 8k slot.
  - It goes to the model with a **locked JSON schema** (llama.cpp's `json_schema`, as the quiz generator
    calls it). The answer is zero to eight competitions, each with the same fields:
    - title, organiser and a one-line summary;
    - level: SCHOOL, STATE, NATIONAL or INTERNATIONAL;
    - classes from and to, 1 to 12, and whether college students may enter;
    - subject: a platform code, or OTHER;
    - when registration opens and closes, and the event's dates;
    - the fee in the page's own words;
    - eligibility and prizes;
    - the organiser's link for it;
    - a confidence from 0 to 1.
  - The page's URL is added by code, not taken from the model.
- **The page is data, never an instruction.**
  - Every line of the page that tries to instruct is cut before the model sees it (the assistant's
    `withoutInjectedLines`).
  - The page is fenced in the prompt, and the system prompt says nothing inside the fence is addressed
    to the model.
- **A date the page does not print is dropped** before anything else (`groundDates`). The page must print it as
  2026-10-31, 31.10.2026, 31/10/26 or 31-10-2026, or as a day beside the month's name with the year on the page.
  The first live crawl showed why: the model filled registration windows that pages never gave, and put the
  crawl's own day as an "opening" date. Devanagari month names are not read, so such a date is dropped too.
- **A page with no competition word and no year is not sent to the model.** It is read and cached all the same.
- **Code then refuses** (`competition-crawl-rules.ts`), whatever the model's confidence:
  - an entry that does not parse (SHAPE);
  - confidence under 0.6;
  - a phone number or an e-mail address in any of its words, because the organiser's site is the contact;
  - no date and no link;
  - a link off the source's site, unless it is another listed organiser's own site.

  Refusals are counted by reason on the live line.
- **The dedupe**: organiser and title are embedded, and a match needs cosine similarity of at least 0.9,
  **the title alone at least 0.9 too**, and the same year. Two entries the model listed on one page are never
  each other's duplicate. The title check came from the first live crawl: with the local embedder, HBCSE's
  Mathematical and Science Olympiads were 0.945 similar together but 0.760 by title alone, so the joint text
  had merged two competitions. The cost is that an acronym and its full name ("IMO", 0.847) land as two drafts,
  for the reviewer to dismiss as a duplicate. The year is the year of the competition's earliest date. The comparison is against
  every platform competition, whether crawled or posted by hand.
- **What happens to a match**:

  | The existing competition | What the crawler does |
  |---|---|
  | A crawled **draft** | Its fields follow the page. A second page in the same crawl only fills blanks. |
  | **Published** (or withdrawn) | **Never edited.** `changedSinceReview` is set and the field-by-field diff is kept (two unreviewed changes merge: the first "before", the latest "after"). |
  | **Posted by hand** | Never edited. The crawler's note is attached, flagged when the dates or classes differ. |
  | **Dismissed** | Stays dismissed, counted "dismissed and unchanged", unless the page it came from has changed since the dismissal. |

## The review rule

Nothing reaches a pupil until a person publishes it. A crawled competition lands as a platform competition
(`organizerSchoolId` null) in DRAFT, with:

- `verified` false;
- `requiresParentConsent` true;
- `leaderboardEnabled` false;
- its source record (`CompetitionCrawl`): the source, the page, the page's hash, when it was crawled and
  last checked, the confidence, and the extracted JSON.

On the tab:

- **Publish** is the existing status door. It sets `verified` only when the source is official.
- **Edit** changes a platform draft in place, through a new door (`/api/v1/appadmin/competitions/{id}/edit`):
  until now a draft could not be edited at all.
- **Dismiss** takes a coded reason.
- **Reviewed** takes the "changed since review" flag off a published one. The diff goes into the audit line.
- **Back to draft** puts a changed published one back, so it can be edited and published again.

Every act is audited:

- `appadmin.competition.edit`, `dismiss`, `reviewed` and `published`; `published` carries the crawl's
  verdict.
- `appadmin.competitionSource.add`, `disable`, `enable` and `remove`.
- `appadmin.competitionCrawl.start` and `stop`.

The public listing shows a crawled competition exactly as a hand-posted platform competition, with one
added line: "Source: <organiser> · last checked <date>".

## The audience rule (12 October 2026, college-content)

A competition carries an audience: **SCHOOL** (its classes are `gradeLow`/`gradeHigh`, as before) or **COLLEGE** with
streams (none: every college). `Competition.audience` null is the state every competition was in before this day; it
lists for schools and colleges alike until somebody sets one. A tenant's competitions page — the web's `/competitions`
and the phone's, both through `GET /api/v1/shared/competitions` — lists only the platform competitions that fit it: a
school (or a junior college) its SCHOOL ones, a college its COLLEGE ones of one of its streams or of none, a guardian
what fits any child's school; a competition's own page answers "not found" to a reader it does not fit. A school's own
competitions are its own and are not filtered. The content team and the operator see the audience on every platform
competition on the desk (the list and "Suggested from the web") and change it in any status
(`POST /api/v1/appadmin/competitions/{id}/audience`, audited `appadmin.competition.audience`).

For a crawled entry the page decides first and the source's kind second:

- the model's locked schema gains `audience` (SCHOOL, COLLEGE, BOTH, UNKNOWN), `streams` (the codes the page names)
  and `enterable`;
- **classes and streams must be printed on the page**, as dates must: a class number counts only next to a class word
  ("Classes 6 to 10", "Class XII", "8th std", "इयत्ता ५ वी"), a stream only when the page's words name it (law, moot,
  LL.B.; engineering, B.Tech; pharmacy…); the crawler's own hand check had found 13 of 20 entries with classes the
  model filled in;
- printed classes make it SCHOOL (both, when the page also lets college students in); college students named on a page
  that speaks of colleges make it COLLEGE; BOTH leaves it unset; otherwise the source's kind decides: OLYMPIAD,
  TALENT_SEARCH, SCIENCE_FAIR and QUIZ are a school organiser's (SCHOOL), MOOT_COURT, HACKATHON and COLLEGE_EVENT a
  college organiser's (COLLEGE), OTHER leaves it unset; a COLLEGE entry's streams are the ones the page names, else the
  source's own (`CompetitionSource.streams`);
- two more refusals: **PAST** (every date the entry carries is before the crawl's day) and **NOT_ENTERABLE** (the model
  says nothing can be entered, or the title or summary is an award ceremony or function, a felicitation, results or a
  merit list).

The seed gains seven college organisers, each root answering 200 to a plain GET under the crawler's User-Agent on
12 October 2026: the Bar Council of India (MOOT_COURT, LAW; its page is drawn by script, so the crawler will record it
refused), NLSIU and NALSAR (MOOT_COURT, LAW), Smart India Hackathon (HACKATHON, every stream), AICTE
(`https://www.aicte.gov.in/`, where `www.aicte-india.org` redirects; COLLEGE_EVENT, engineering, management, pharmacy,
architecture), the Pharmacy Council of India (COLLEGE_EVENT, PHARMACY) and ICAR (`https://icar.org.in/`;
`education.icar.gov.in` gave no answer; COLLEGE_EVENT, AGRICULTURE). The add form asks for a college organiser's
streams.

## The minors' rule

Decision 0002 is unchanged:

- A crawled competition is a platform competition like any other.
- Entering it still needs a guardian's consent: `requiresParentConsent` is forced true on landing.
- The organiser's link follows the existing rule: https only, opened outside the app, and the same for
  every reader as before.
- No pupil's data goes anywhere near the crawler. It reads public pages and writes platform rows.
- The contact refusal keeps strangers' numbers and addresses off a child's screen.
- Money never touches the platform (decision 0003): the fee is shown as the organiser's own words, and
  nothing is paid through Shalaghar.

## The job

A crawl is a background job on the model's machine: `CompetitionCrawlJob`, written only by
`src/lib/competition-crawl-jobs.ts`, with the runner `scripts/competitions-crawl/cli.ts --job=<id>`.

- **A separate table, not a `kind` on QuizGenJob.** The quiz library's queries, its unique `active` index
  and its suites assume one kind of row. Generalising it would have changed its behaviour.
- **One crawl at a time.** A crawl may run beside a quiz generation run: they share the model but are
  different jobs.
- **The model servers.** Start brings up only the servers that are down, and the end takes down only
  what this Start brought up: the quiz job's rule. One addition (`src/lib/model-holders.ts`) covers the
  two kinds running together:
  - When a run of one kind ends while a run of the other kind is active, the servers it brought up are
    handed to the other run instead of stopped. They go down when the last holder ends.
  - A server's own Stop on the quiz desk is refused while a run of either kind is active.
- **The doors**, all app-admin (the operator passes):
  - Seven for the crawl, under `/api/v1/appadmin/competition-crawl`:
    - GET the state, and POST to Start;
    - GET one crawl, and POST `/{jobId}/stop`;
    - GET and POST the sources;
    - POST `sources/{sourceId}` to switch a source off or on, or remove it.
  - Four for the tab: GET `/api/v1/appadmin/competitions/suggested`, and POST `/{id}/edit`, `/{id}/dismiss`
    and `/{id}/reviewed`.

## What a hosted deployment needs

- **The runner runs where the model runs**, as with the quiz job. A hosted deployment swaps the detached
  spawn and `scripts/model-serve.sh` for that host's job runner. It either points `ASSISTANT_MODEL_URL` and
  `ASSISTANT_EMBED_URL` at the hosted model, or runs the crawl on the model host against the production
  database.
- **Outbound HTTPS to the organisers' sites** from that host, and nothing else. Set `CRAWLER_CONTACT` to a
  monitored address so a site's webmaster can reach the operator.
- **A schedule if wanted.** A weekly crawl is enough, because the cache makes a re-crawl cheap. Today the
  crawl is started by hand from the desk; no cron entry was added.
- **Legal**: the crawler reads public pages and stores only the facts it extracts, with the page's address
  as the source. The organisers' terms (NTA's ask permission for reproduction; see the papers corpus note)
  are for counsel before the hosted listing goes live.
