/**
 * The Practice bank's arithmetic evaluator, shared between the verifier
 * (scripts/verify-quiz.ts) and the generator (scripts/gen-quiz-bank.ts).
 *
 * ONE implementation on purpose: the generator proves every question it emits
 * by evaluating its `checkExpr` against the marked answer, and that proof is
 * only worth something if it is the SAME evaluation the verifier will run
 * later. Two evaluators drift; a drifted pair would let the generator pass a
 * question the verifier rejects — or worse, the reverse.
 *
 * Recursive-descent, over `+ - * / ^ ( )` and numbers. NOT `eval` — see the
 * note in verify-quiz.ts: content files are exactly the kind of thing that
 * gets a pull request from somebody who is not on the team.
 *
 * Returns null for anything it does not understand, which callers treat as
 * "not machine-checkable" rather than as a failure.
 */
export function evaluate(expression: string): number | null {
  let index = 0;
  const src = expression.replace(/\s+/g, "");

  function peek(): string | undefined {
    return src[index];
  }
  function eat(char: string): boolean {
    if (src[index] === char) {
      index++;
      return true;
    }
    return false;
  }

  function primary(): number | null {
    if (eat("(")) {
      const value = addition();
      if (value === null || !eat(")")) return null;
      return value;
    }
    if (eat("-")) {
      const value = primary();
      return value === null ? null : -value;
    }
    const start = index;
    while (index < src.length && /[0-9.]/.test(src[index]!)) index++;
    if (index === start) return null;
    const parsed = Number(src.slice(start, index));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function power(): number | null {
    const base = primary();
    if (base === null) return null;
    if (eat("^")) {
      const exponent = power();
      return exponent === null ? null : Math.pow(base, exponent);
    }
    return base;
  }

  function multiplication(): number | null {
    let value = power();
    if (value === null) return null;
    for (;;) {
      if (eat("*")) {
        const rhs = power();
        if (rhs === null) return null;
        value *= rhs;
      } else if (eat("/")) {
        const rhs = power();
        if (rhs === null || rhs === 0) return null;
        value /= rhs;
      } else break;
    }
    return value;
  }

  function addition(): number | null {
    let value = multiplication();
    if (value === null) return null;
    for (;;) {
      if (eat("+")) {
        const rhs = multiplication();
        if (rhs === null) return null;
        value += rhs;
      } else if (eat("-")) {
        const rhs = multiplication();
        if (rhs === null) return null;
        value -= rhs;
      } else break;
    }
    return value;
  }

  const result = addition();
  // Trailing junk means we understood only part of it, which is not the same
  // as understanding it.
  if (peek() !== undefined) return null;
  return result;
}

/**
 * The number an option states, if it states one.
 *
 * Options read like "12 cm" or "x = 7" or "−3", so this pulls the first
 * numeric token rather than demanding the whole string be a number. The
 * unicode minus is normalised because it is what a properly typeset option
 * actually contains.
 */
export function numberIn(option: string): number | null {
  const normalised = option.replace(/[−–—]/g, "-").replace(/,/g, "");
  const match = normalised.match(/-?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?/);
  if (!match) return null;
  const token = match[0]!;
  if (token.includes("/")) {
    const [a, b] = token.split("/").map(Number) as [number, number];
    return b === 0 ? null : a / b;
  }
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}
