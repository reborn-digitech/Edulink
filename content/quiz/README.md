# The Abhyaas question bank

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
