# The Practice question bank

One JSON file per topic. `npm run quiz:import` loads them; `npm run quiz:verify`
checks them and refuses to let a broken one through.

## Why these are authored, not scraped

Olympiad papers, textbook exercises and commercial test-prep collections are
copyrighted — individually, and again as curated collections. Scraping them into
a database served to schoolchildren is infringement, and no amount of
reformatting changes that.

Facts are not copyrightable. "Sodium's symbol is Na" belongs to nobody, and
neither does the quadratic formula. So every question here is **written for this
bank**, covering the same syllabus that published banks cover, and every row
records where its subject matter came from and under what licence.

`source` and `licence` are NOT NULL in the schema for that reason: the question a
question bank gets asked, once, years later, by somebody who is not you, is
"where did this come from and may we serve it".

## File format

```jsonc
{
  "subject": "MATHS",              // MATHS SCIENCE HISTORY GEOGRAPHY CIVICS ECONOMICS
  "classLevel": 8,
  "chapter": "Chapter 2 — Linear Equations in One Variable",
  "name": "Linear Equations",
  "slug": "maths-8-linear-equations", // NEVER changes: badge ids are built from it
  "summary": "Solving for one unknown, and the word problems behind it.",
  "position": 2,
  "source": "NCERT Class 8 Mathematics syllabus (topic coverage)",
  "licence": "Original questions written for EduLink · CC BY-SA 4.0",
  "questions": [
    {
      "difficulty": 1,               // 1 recall … 6 Olympiad
      "stem": "What is the standard form of a linear equation in one variable?",
      "choices": ["ax + b = 0, a ≠ 0", "ax² + bx + c = 0", "x = a", "a/x = b"],
      "answerIndex": 0,
      "solution": "Linear means degree one...",
      "checkExpr": null              // set for anything a machine can evaluate
    }
  ]
}
```

## `checkExpr` — the only correctness check worth anything without a person

For a question whose answer is computable, put the answer as an arithmetic
expression the verifier can evaluate: `"7*8"`, `"(180-90)/2"`, `"22/7"`. The
verifier evaluates it and compares against `choices[answerIndex]`. A mismatch is
a hard failure.

For everything else — a date, a discoverer, a definition — there is nothing to
evaluate, and `quiz:verify` says so in its output rather than implying it checked.
That number is the honest measure of how much of the bank is machine-verified.

## The generated bank: published without review, taken down afterwards (11 October 2026)

The generator's batches live in `content/quiz/generated/`. `npm run quiz:queue` (and the generation job
started from the bank desk, which loads each chapter as it finishes) writes every item into the database
as a `generated` row, and **it is served at once**, with its Hindi and Marathi rows: an item in a batch
has already passed the generator's own checks (the critique, the blind solver, the form checks, the
verifier). The owner decided this on 11 October 2026; on 10 October items waited for a stamp in a review
queue. Teachers take no part (the owner's decision).

The bank desk at `/appadmin/quiz-review` (the content team) and `/root/quiz-review` (the operator):

- **Edit** — the English, the Hindi and the Marathi in one press; the earlier words are kept on the record
  and named in the audit log, and an English change keeps the solver's answers with an "edited after
  solving" mark. Served as edited at once.
- **Take down** — with a reason from a coded list (`QUIZ_TAKEDOWN_REASONS` in packages/contracts): not
  served from that moment, anywhere (practice, revision, worksheets, the phone); the answers pupils gave
  stay attached.
- **Put back** — a taken-down item is served again.
- An item whose figure failed to draw is loaded but held until its figure is stored.

Every act is a `QuizReviewStamp` row with the person, their role, the action, the reason and the words
before; `src/lib/quiz-review.ts` is its only writer, and `src/lib/quiz-served.ts` is the one filter every
pupil-facing read uses. The bank editor and the translations page refuse a generated item: the desk is its
words' one writer. The authored files in this folder are served as before, and `quiz:import` never touches
a generated row. Re-running `quiz:queue` refreshes an item in place and leaves one a person edited or took
down (or the review queue stamped, before 11 October) alone.

## Boards, figures and the one way in (11 October 2026)

- **Every chapter has a board.** `QuizTopic.board` is `NCERT` or `BALBHARATI`
  (`QUIZ_BOARDS` in packages/contracts). The authored files here are NCERT's:
  `quiz:import` writes NCERT on every topic it loads (a file may name another
  `board`, one of the codes). A generated batch must carry `board` (the verifier
  refuses one without a code) and that is its topic's board; a batch whose
  chapter is already the other board's refuses the queue load. The placement
  banks have no board and list under either.
- **Pupils see their school's board first.** `School.board` CBSE reads NCERT,
  MSBSHSE reads Balbharati, anything else shows both; the practice page, the
  guardian's page and the phone have a switch to the other board and to both.
- **One way in.** A generated item enters the bank through `npm run quiz:queue`
  only (`scripts/quiz-queue-load.ts` is the only writer of a `generated` row);
  `quiz:import` loads the authored files only.
- **Figures are drawn on load.** `quiz:queue` draws an item's `figure` spec in
  English, Hindi and Marathi and stores the three PNGs (the figure builder's
  `prepareFigure`/`finishFigure`), so the item is served with its figure. A figure
  that cannot be drawn does not stop the load: the item comes in held, with the
  reason, and the bank desk shows "Figure failed"; the verifier reports it as a warning on
  a generated batch (an error on an authored file).
