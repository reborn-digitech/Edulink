import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Machine translation for the shared question bank.
 *
 * WHY A MODEL AND NOT A GLOSSARY. The bank's translations were hand-authored in
 * the content scripts; a question typed into the app admin's dashboard has no
 * author waiting to translate it, and shipping it English-only would mean a
 * Hindi reader gets the fallback forever. So a new question is translated at
 * save time, by Claude, into both Indic languages in one call.
 *
 * FAIL SOFT, ALWAYS. The reading path already falls back field-by-field to
 * English (see quiz.ts `pick`), so a failed or skipped translation costs a
 * reader the language, never the question. Nothing here may make saving a
 * question fail: no key configured, a refusal, a malformed response — all of
 * them return null and the caller saves the English original alone.
 *
 * THE SHAPE RULE IS THE ONE THAT MATTERS. `answerIndex` lives on the original
 * and indexes its choices array; a translation with a different number of
 * options would mark a child wrong for being right in Marathi. The schema
 * pins the choice count per language, and `translateQuestion` re-checks it
 * anyway — a guarantee this important is not left to one layer.
 */

export type QuestionText = {
  stem: string;
  choices: string[];
  solution: string;
};

export type QuestionTranslations = {
  hi: QuestionText;
  mr: QuestionText;
};

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

function questionSchema(choiceCount: number) {
  const text = {
    type: "object",
    properties: {
      stem: { type: "string" },
      choices: {
        type: "array",
        items: { type: "string" },
        // Same order, same length as the original — the invariant the whole
        // translation table is designed around.
        minItems: choiceCount,
        maxItems: choiceCount,
      },
      solution: { type: "string" },
    },
    required: ["stem", "choices", "solution"],
    additionalProperties: false,
  } as const;

  return {
    type: "object",
    properties: { hi: text, mr: text },
    required: ["hi", "mr"],
    additionalProperties: false,
  } as const;
}

/**
 * Translates one question into Hindi and Marathi, or returns null.
 *
 * The prompt states the constraints the schema cannot: keep mathematical
 * notation, numbers, units and proper nouns as they are, and translate meaning
 * rather than transliterating words. The choices array order is load-bearing
 * and is said twice — once to the model, once by the schema's length pin.
 */
export async function translateQuestion(
  original: QuestionText,
): Promise<QuestionTranslations | null> {
  const anthropic = client();
  if (!anthropic) return null;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      system:
        "You translate school practice questions from English into Hindi and Marathi for Indian students following the NCERT syllabus. " +
        "Write natural Devanagari — never transliterate English words that have an ordinary Hindi or Marathi equivalent. " +
        "Keep numbers, mathematical expressions, chemical formulae, units and proper nouns exactly as written. " +
        "The choices array MUST keep the same order and the same number of entries as the English original: " +
        "choice 1 translates choice 1, choice 2 translates choice 2, and so on.",
      output_config: {
        format: {
          type: "json_schema",
          schema: questionSchema(original.choices.length),
        },
      },
      messages: [
        {
          role: "user",
          content:
            "Translate this practice question into Hindi (hi) and Marathi (mr):\n\n" +
            JSON.stringify(original),
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;

    const text = response.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") return null;

    const parsed = JSON.parse(text.text) as QuestionTranslations;

    // Belt and braces on the invariant the schema already pins.
    for (const lang of ["hi", "mr"] as const) {
      const t = parsed[lang];
      if (
        !t ||
        typeof t.stem !== "string" ||
        typeof t.solution !== "string" ||
        !Array.isArray(t.choices) ||
        t.choices.length !== original.choices.length ||
        t.choices.some((c) => typeof c !== "string")
      ) {
        return null;
      }
    }
    return parsed;
  } catch (error) {
    // A translation that failed is a question that ships English-only, not an
    // error the author has to see twice. Logged so an operator can notice.
    console.error("[translate]", error);
    return null;
  }
}

/** Whether auto-translation is configured at all, for honest UI copy. */
export function translationConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
