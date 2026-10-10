/**
 * Which of the three languages a question is typed in (§2, §9.7): a question in another of the three
 * than the conversation's is answered in that one. Devanagari is Hindi or Marathi by their commonest
 * small words; Latin letters are English (Hinglish typed in Latin letters is answered in English).
 * Null when nothing tells (digits and symbols alone): the conversation's language stands. Pure.
 */
import type { AssistantLanguage } from "@edulink/contracts";

// Phase D (10 Oct 2026) widened both lists and added Marathi's endings and particle weights: "मी स्वतःला
// इजा केली", "मरून जावे असे वाटते", "भूकंप का होतात", "नग्न फोटो दाखव" carried none of the first words, or tied
// on Hindi's "का", and were answered in Hindi.
const MARATHI = ["आहे", "आहेत", "आहेस", "काय", "कसे", "कसा", "कशी", "म्हणजे", "मला", "माझ्या", "माझा", "माझी", "माझे", "नाही", "आणि", "करा", "सांगा", "सांग", "होते", "होतो", "होतात", "कोणते", "कोणता", "कोणती", "कोणी", "च्या", "ला", "मध्ये", "मी", "आम्ही", "तुम्ही", "तू", "केली", "केले", "केला", "वाटते", "वाटतं", "असे", "असते", "असतो", "असतात", "करतात", "करतो", "करते", "माझ्याशी", "जातात", "जावे", "करू", "जाऊ", "घेऊ", "करायचे", "करायची", "करायचा", "पाहिजे", "नको", "कुठे", "कधी", "कसं", "पुढची", "तुझा", "तुझी", "त्याला", "तिला", "स्पष्ट", "दाखव", "दाखवा", "पाठव", "पाठवा", "लिही", "लिहा", "मिळतो", "मिळते", "मिळेल", "खरंच"];
const HINDI = ["है", "हैं", "क्या", "कैसे", "मुझे", "मेरा", "मेरी", "मेरे", "नहीं", "करें", "बताइए", "बताओ", "होता", "होती", "कौन", "मैं", "हूँ", "हूं", "था", "थी", "थे", "कहाँ", "कहां", "कब", "चाहिए", "समझाइए", "करूँ", "क्यों", "को", "ने", "पर", "लिए", "रहा", "रही", "रहे", "गया", "गई", "सकते", "सकता", "जाता", "जाती", "दिखाओ", "भेजो"];
/** Hindi's short particles, which Marathi spells the same ("का" is Marathi's "why?"): half a vote each. */
const HINDI_PARTICLES = ["का", "की", "के", "में", "से", "और"];
/** Marathi's endings (genitive, dative, "for", "with", "from", the -ायचे and -ावे forms), not Hindi's "वाला" and the like. */
const MARATHI_ENDING = /(?:ायचा|ायची|ायचे|ायचं|ावे|ावा|ावी|ाचा|ाची|ाचे|ाच्या|[^च]चा|[^च]ची|[^च]चे|मध्ये|साठी|बरोबर|ातून|ून|ीला|ेला|ाला)$/;
const NOT_MARATHI = new Set(["वाला", "वाली", "वाले", "चाचा", "चाची", "बच्चा", "बच्चे", "सच्चा", "सच्ची", "सच्चे", "कच्चा", "नीला", "अकेला", "खून", "कानून"]);

/**
 * Latin letters inside a Devanagari sentence are terms ("photosynthesis म्हणजे काय?"): when the
 * Devanagari words carry the small words of Hindi or Marathi, that language wins whatever the count of
 * Latin letters (Phase D: four such questions were answered in English).
 */
export function detectLanguage(text: string): AssistantLanguage | null {
  const devanagari = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (devanagari === 0 && latin === 0) return null;
  const words = text.split(/[\s,.;:!?।()"']+/).filter(Boolean);
  const listed = (list: string[]) => words.filter((w) => list.includes(w)).length;
  const mr = listed(MARATHI) + words.filter((w) => !MARATHI.includes(w) && !NOT_MARATHI.has(w) && /[ऀ-ॿ]/.test(w) && MARATHI_ENDING.test(w)).length;
  const hi = listed(HINDI) + 0.5 * listed(HINDI_PARTICLES);
  if (devanagari < latin && mr + hi === 0) return "en";
  return mr > hi ? "mr" : "hi";
}
