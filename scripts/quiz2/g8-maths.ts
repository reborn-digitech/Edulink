/**
 * Class 8 Maths — NCERT, chapter by chapter. The algebra firms up here:
 * properties get names, equations grow fractions, polygons yield formulas,
 * and squares and cubes learn their roots. Same discipline throughout —
 * every question authored individually, every computable answer proven by
 * a checkExpr, every wrong option a real thirteen-year-old's mistake.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { L, OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 8)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/** Degree rendering, shared by the angle-heavy chapters. */
const deg = (n: number): L => ({ en: `${n}°`, hi: `${n}°`, mr: `${n}°` });

/** Percentage rendering. */
const pct = (n: number): L => ({ en: `${n}%`, hi: `${n}%`, mr: `${n}%` });

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Rational Numbers (properties get their names)                 */
/* ------------------------------------------------------------------------- */
function rationalNumbers8(): TopicFileOut {
  const rand = rng("maths-8-rational-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Which rational number is the ADDITIVE identity — leaving every number unchanged when added to it?",
          hi: "कौन-सी परिमेय संख्या योज्य तत्समक है — जिसे जोड़ने पर हर संख्या अपरिवर्तित रहती है?",
          mr: "कोणती परिमेय संख्या बेरजेची अविकारक आहे — जी मिळवल्यावर प्रत्येक संख्या जशीच्या तशी राहते?",
        },
        answer: 0,
        wrong: [1, -1, 10],
        solution: {
          en: "a + 0 = a for every a: the identity is 0. 1 leaves numbers unchanged under MULTIPLICATION — a different throne.",
          hi: "हर a के लिए a + 0 = a: तत्समक 0 है। 1 गुणा में संख्याएँ अपरिवर्तित रखता है — वह दूसरी गद्दी है।",
          mr: "प्रत्येक a साठी a + 0 = a: अविकारक 0 आहे. 1 गुणाकारात संख्या जशाच्या तशा ठेवतो — ती वेगळी गादी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Which rational number is the MULTIPLICATIVE identity?",
          hi: "कौन-सी परिमेय संख्या गुणन तत्समक है?",
          mr: "कोणती परिमेय संख्या गुणाकाराची अविकारक आहे?",
        },
        answer: 1,
        wrong: [0, -1, 2],
        solution: {
          en: "a × 1 = a for every a: the identity is 1. 0 doesn't preserve — it swallows every product whole.",
          hi: "हर a के लिए a × 1 = a: तत्समक 1 है। 0 बचाता नहीं — वह हर गुणनफल को पूरा निगल जाता है।",
          mr: "प्रत्येक a साठी a × 1 = a: अविकारक 1 आहे. 0 राखत नाही — तो प्रत्येक गुणाकार अख्खा गिळतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The additive inverse of 3/7 is ▢/7. What is the numerator in the box?",
          hi: "3/7 का योज्य प्रतिलोम ▢/7 है। रिक्त में अंश क्या आएगा?",
          mr: "3/7 चा बेरीज-व्यस्त ▢/7 आहे. रिकाम्यात अंश काय येईल?",
        },
        answer: -3,
        wrong: [3, 7, -7],
        checkExpr: "0-3",
        solution: {
          en: "3/7 + (−3/7) = 0, so the numerator is −3. −7 flips the wrong part — the denominator never changes sign duty.",
          hi: "3/7 + (−3/7) = 0, अतः अंश −3। −7 ग़लत हिस्सा पलटता है — हर कभी चिह्न की ड्यूटी नहीं बदलता।",
          mr: "3/7 + (−3/7) = 0, म्हणून अंश −3. −7 चुकीचा भाग उलटवतो — छेद कधी चिन्हाची जबाबदारी घेत नाही.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 1/4 + 1/2, as a decimal?",
          hi: "1/4 + 1/2 कितना है, दशमलव में?",
          mr: "1/4 + 1/2 किती, दशांशात?",
        },
        answer: 0.75,
        wrong: [0.33, 0.25, 1.5],
        checkExpr: "1/4+1/2",
        solution: {
          en: "Match the denominators: 1/4 + 2/4 = 3/4 = 0.75. 0.33 adds tops AND bottoms (2/6) — fractions never add that way.",
          hi: "हर मिलाइए: 1/4 + 2/4 = 3/4 = 0.75। 0.33 अंश और हर दोनों जोड़ देता है (2/6) — भिन्न कभी ऐसे नहीं जुड़तीं।",
          mr: "छेद जुळवा: 1/4 + 2/4 = 3/4 = 0.75. 0.33 अंश आणि छेद दोन्ही जोडतो (2/6) — अपूर्णांक कधी असे जुळत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the multiplicative inverse (reciprocal) of −5/8, as a decimal?",
          hi: "−5/8 का गुणन प्रतिलोम (व्युत्क्रम) दशमलव में कितना है?",
          mr: "−5/8 चा गुणाकार-व्यस्त दशांशात किती?",
        },
        answer: -1.6,
        wrong: [1.6, -0.625, 0.625],
        checkExpr: "(0-8)/5",
        solution: {
          en: "Flip the fraction, keep the sign: −8/5 = −1.6, and (−5/8) × (−1.6) = 1 ✓. 1.6 drops the sign — but only negative × negative reaches +1.",
          hi: "भिन्न पलटिए, चिह्न रखिए: −8/5 = −1.6, और (−5/8) × (−1.6) = 1 ✓। 1.6 चिह्न गिरा देता है — पर +1 तक केवल ऋण × ऋण ही पहुँचता है।",
          mr: "अपूर्णांक उलटवा, चिन्ह ठेवा: −8/5 = −1.6, आणि (−5/8) × (−1.6) = 1 ✓. 1.6 चिन्ह गाळतो — पण +1 पर्यंत फक्त ऋण × ऋणच पोहोचतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 3/4 × 8/3?",
          hi: "3/4 × 8/3 कितना है?",
          mr: "3/4 × 8/3 किती?",
        },
        answer: 2,
        wrong: [6, 0.5, 24],
        checkExpr: "3*8/(4*3)",
        solution: {
          en: "Cancel before you multiply: the 3s cancel and 8/4 = 2. 24 multiplies only the tops; 6 halves it wrongly.",
          hi: "गुणा से पहले काटिए: तीन-तीन कट जाते हैं और 8/4 = 2। 24 केवल अंश गुणा करता है; 6 ग़लत आधा है।",
          mr: "गुणण्याआधी छेद कापा: तीन-तीन रद्द होतात आणि 8/4 = 2. 24 फक्त अंश गुणतो; 6 चुकीचे अर्धे.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "Use distributivity to compute 2/5 × (10 + 15).",
          hi: "वितरण गुण से 2/5 × (10 + 15) निकालिए।",
          mr: "वितरण गुणधर्माने 2/5 × (10 + 15) काढा.",
        },
        answer: 10,
        wrong: [4, 6, 50],
        checkExpr: "2*25/5",
        solution: {
          en: "Distribute: 2/5 × 10 + 2/5 × 15 = 4 + 6 = 10 — or just 2/5 × 25. 4 and 6 are the two halves that forgot to meet.",
          hi: "बाँटिए: 2/5 × 10 + 2/5 × 15 = 4 + 6 = 10 — या सीधे 2/5 × 25। 4 और 6 वे दो हिस्से हैं जो मिलना भूल गए।",
          mr: "वाटा: 2/5 × 10 + 2/5 × 15 = 4 + 6 = 10 — किंवा थेट 2/5 × 25. 4 आणि 6 हे भेटायला विसरलेले दोन भाग.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Find the rational number exactly midway between 1/2 and 3/4, as a decimal.",
          hi: "1/2 और 3/4 के ठीक बीच की परिमेय संख्या दशमलव में निकालिए।",
          mr: "1/2 आणि 3/4 च्या नेमकी मधली परिमेय संख्या दशांशात काढा.",
        },
        answer: 0.625,
        wrong: [0.6, 0.65, 1.25],
        checkExpr: "(0.5+0.75)/2",
        solution: {
          en: "Average the pair: (0.5 + 0.75) ÷ 2 = 0.625 = 5/8. 1.25 stops at the sum and forgets the halving.",
          hi: "जोड़ी का औसत लीजिए: (0.5 + 0.75) ÷ 2 = 0.625 = 5/8। 1.25 योग पर रुककर आधा करना भूल जाता है।",
          mr: "जोडीची सरासरी घ्या: (0.5 + 0.75) ÷ 2 = 0.625 = 5/8. 1.25 बेरजेवर थांबून निम्मे करायला विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What must 2.5 be multiplied by to give 1?",
          hi: "2.5 को किससे गुणा करें कि 1 मिले?",
          mr: "2.5 ला कशाने गुणले असता 1 मिळेल?",
        },
        answer: 0.4,
        wrong: [2.5, 0.25, 4],
        checkExpr: "1/2.5",
        solution: {
          en: "The reciprocal: 1 ÷ 2.5 = 2/5 = 0.4, and 2.5 × 0.4 = 1 ✓. 0.25 is the reciprocal of 4, a neighbour's answer.",
          hi: "व्युत्क्रम: 1 ÷ 2.5 = 2/5 = 0.4, और 2.5 × 0.4 = 1 ✓। 0.25 चार का व्युत्क्रम है, पड़ोसी का उत्तर।",
          mr: "व्यस्त: 1 ÷ 2.5 = 2/5 = 0.4, आणि 2.5 × 0.4 = 1 ✓. 0.25 हा चाराचा व्यस्त, शेजाऱ्याचे उत्तर.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "Compute cleverly: (2/9 × 3/4) + (2/9 × 6/4). (Answer as a decimal.)",
          hi: "चतुराई से निकालिए: (2/9 × 3/4) + (2/9 × 6/4)। (उत्तर दशमलव में।)",
          mr: "चतुराईने काढा: (2/9 × 3/4) + (2/9 × 6/4). (उत्तर दशांशात.)",
        },
        answer: 0.5,
        wrong: [0.25, 1, 0.75],
        checkExpr: "2*9/(9*4)",
        solution: {
          en: "Pull out the common 2/9: it multiplies (3/4 + 6/4) = 9/4, and 2/9 × 9/4 = 1/2 = 0.5 — distributivity run in reverse.",
          hi: "साझा 2/9 बाहर खींचिए: वह (3/4 + 6/4) = 9/4 से गुणा होता है, और 2/9 × 9/4 = 1/2 = 0.5 — उल्टा चलाया वितरण गुण।",
          mr: "सामाईक 2/9 बाहेर काढा: तो (3/4 + 6/4) = 9/4 शी गुणला जातो, आणि 2/9 × 9/4 = 1/2 = 0.5 — उलटे चालवलेले वितरण.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A rope 7.5 m long is cut into pieces of 0.75 m each. How many full pieces come out?",
          hi: "7.5 मीटर की रस्सी 0.75-0.75 मीटर के टुकड़ों में कटती है। कितने पूरे टुकड़े निकलेंगे?",
          mr: "7.5 मीटरची दोरी प्रत्येकी 0.75 मीटरच्या तुकड्यांत कापली. किती पूर्ण तुकडे निघतील?",
        },
        answer: 10,
        wrong: [9, 11, 5],
        checkExpr: "7.5/0.75",
        solution: {
          en: "7.5 ÷ 0.75 = 750 ÷ 75 = 10 pieces. Shift both decimals together and the division turns whole.",
          hi: "7.5 ÷ 0.75 = 750 ÷ 75 = 10 टुकड़े। दोनों दशमलव साथ खिसकाइए और भाग पूर्ण बन जाता है।",
          mr: "7.5 ÷ 0.75 = 750 ÷ 75 = 10 तुकडे. दोन्ही दशांश एकत्र सरकवा आणि भागाकार पूर्ण होतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Compute: 5/6 × 12 − 5/6 × 6.",
          hi: "निकालिए: 5/6 × 12 − 5/6 × 6।",
          mr: "काढा: 5/6 × 12 − 5/6 × 6.",
        },
        answer: 5,
        wrong: [10, 2.5, 15],
        checkExpr: "5*6/6",
        solution: {
          en: "Factor the 5/6 out: 5/6 × (12 − 6) = 5/6 × 6 = 5. 10 is the first term alone (5/6 × 12), the subtraction forgotten.",
          hi: "5/6 बाहर निकालिए: 5/6 × (12 − 6) = 5/6 × 6 = 5। 10 अकेला पहला पद है (5/6 × 12), घटाव भुलाया हुआ।",
          mr: "5/6 बाहेर काढा: 5/6 × (12 − 6) = 5/6 × 6 = 5. 10 म्हणजे एकटे पहिले पद (5/6 × 12), वजाबाकी विसरलेली.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "The sum of two rational numbers is 1/2. One of them is −3/4. What is the other, as a decimal?",
          hi: "दो परिमेय संख्याओं का योग 1/2 है। एक है −3/4। दूसरी दशमलव में कितनी?",
          mr: "दोन परिमेय संख्यांची बेरीज 1/2 आहे. एक आहे −3/4. दुसरी दशांशात किती?",
        },
        answer: 1.25,
        wrong: [-0.25, 0.25, -1.25],
        checkExpr: "0.5+0.75",
        solution: {
          en: "Other = 1/2 − (−3/4) = 1/2 + 3/4 = 5/4 = 1.25. Check: 1.25 + (−0.75) = 0.5 ✓. −0.25 subtracts without flipping the minus.",
          hi: "दूसरी = 1/2 − (−3/4) = 1/2 + 3/4 = 5/4 = 1.25। जाँच: 1.25 + (−0.75) = 0.5 ✓। −0.25 ऋण पलटे बिना घटा देता है।",
          mr: "दुसरी = 1/2 − (−3/4) = 1/2 + 3/4 = 5/4 = 1.25. पडताळणी: 1.25 + (−0.75) = 0.5 ✓. −0.25 ऋण न उलटवता वजा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The product of two rational numbers is −8/5. One of them is 4/15. Find the other.",
          hi: "दो परिमेय संख्याओं का गुणनफल −8/5 है। एक है 4/15। दूसरी निकालिए।",
          mr: "दोन परिमेय संख्यांचा गुणाकार −8/5 आहे. एक आहे 4/15. दुसरी काढा.",
        },
        answer: -6,
        wrong: [6, -0.42, -24],
        checkExpr: "(0-8)*15/(5*4)",
        solution: {
          en: "Divide: (−8/5) ÷ (4/15) = (−8/5) × (15/4) = −6. Check: 4/15 × (−6) = −24/15 = −8/5 ✓. −0.42 multiplies instead of dividing.",
          hi: "भाग दीजिए: (−8/5) ÷ (4/15) = (−8/5) × (15/4) = −6। जाँच: 4/15 × (−6) = −24/15 = −8/5 ✓। −0.42 भाग की जगह गुणा कर बैठता है।",
          mr: "भागा: (−8/5) ÷ (4/15) = (−8/5) × (15/4) = −6. पडताळणी: 4/15 × (−6) = −24/15 = −8/5 ✓. −0.42 भागाऐवजी गुणतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "A number x satisfies x + x/2 + x/4 = 7/2. Find x.",
          hi: "एक संख्या x के लिए x + x/2 + x/4 = 7/2 है। x निकालिए।",
          mr: "एका संख्येसाठी x + x/2 + x/4 = 7/2 आहे. x काढा.",
        },
        answer: 2,
        wrong: [1, 4, 0.5],
        checkExpr: "3.5*4/7",
        solution: {
          en: "Collect: x(1 + 1/2 + 1/4) = 7x/4 = 7/2, so x = 2. Check: 2 + 1 + 0.5 = 3.5 = 7/2 ✓. 1 solves only half the left side.",
          hi: "समेटिए: x(1 + 1/2 + 1/4) = 7x/4 = 7/2, अतः x = 2। जाँच: 2 + 1 + 0.5 = 3.5 = 7/2 ✓। 1 बाएँ पक्ष का आधा ही हल करता है।",
          mr: "एकत्र करा: x(1 + 1/2 + 1/4) = 7x/4 = 7/2, म्हणून x = 2. पडताळणी: 2 + 1 + 0.5 = 3.5 = 7/2 ✓. 1 डाव्या बाजूचे अर्धेच सोडवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Is division commutative? Compute (1/2 ÷ 1/4) − (1/4 ÷ 1/2) and let the gap answer.",
          hi: "क्या भाग क्रमविनिमेय है? (1/2 ÷ 1/4) − (1/4 ÷ 1/2) निकालिए और अंतर को ही जवाब देने दीजिए।",
          mr: "भागाकार क्रमविनिमेय आहे का? (1/2 ÷ 1/4) − (1/4 ÷ 1/2) काढा आणि फरकालाच उत्तर देऊ द्या.",
        },
        answer: 1.5,
        wrong: [0, 2, 0.5],
        checkExpr: "0.5/0.25-0.25/0.5",
        solution: {
          en: "1/2 ÷ 1/4 = 2, but 1/4 ÷ 1/2 = 0.5: the gap is 1.5, not zero — so division refuses commutativity. A single counter-example convicts a property for ever.",
          hi: "1/2 ÷ 1/4 = 2, पर 1/4 ÷ 1/2 = 0.5: अंतर 1.5 है, शून्य नहीं — अतः भाग क्रमविनिमय ठुकराता है। एक अकेला प्रति-उदाहरण किसी गुण को सदा के लिए दोषी ठहरा देता है।",
          mr: "1/2 ÷ 1/4 = 2, पण 1/4 ÷ 1/2 = 0.5: फरक 1.5 आहे, शून्य नाही — म्हणून भागाकार क्रमविनिमय नाकारतो. एकच प्रति-उदाहरण गुणधर्माला कायमचे दोषी ठरवते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 1 — Rational Numbers",
      name: "Rational Numbers",
      slug: "maths-8-rational-numbers",
      summary:
        "The properties get names: identities that preserve, inverses that cancel, distributivity that saves work — and one counter-example convicting division of never commuting.",
      position: 1,
      translations: {
        hi: {
          name: "परिमेय संख्याएँ",
          summary:
            "गुणों को नाम मिलते हैं: बचाने वाले तत्समक, काटने वाले प्रतिलोम, मेहनत बचाता वितरण गुण — और एक प्रति-उदाहरण जो भाग को क्रमविनिमय का सदा के लिए दोषी ठहराता है।",
        },
        mr: {
          name: "परिमेय संख्या",
          summary:
            "गुणधर्मांना नावे मिळतात: राखणारे अविकारक, रद्द करणारे व्यस्त, श्रम वाचवणारे वितरण — आणि भागाकाराला क्रमविनिमयाचा कायमचा दोषी ठरवणारे एक प्रति-उदाहरण.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Linear Equations in One Variable (x on both sides)            */
/* ------------------------------------------------------------------------- */
function linearEquations8(): TopicFileOut {
  const rand = rng("maths-8-linear-equations");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve: 2x − 3 = 7.",
          hi: "हल कीजिए: 2x − 3 = 7।",
          mr: "सोडवा: 2x − 3 = 7.",
        },
        answer: 5,
        wrong: [2, 10, 4],
        checkExpr: "(7+3)/2",
        solution: {
          en: "Add 3, then halve: 2x = 10, x = 5. 2 subtracts the 3 instead of restoring it; 10 forgets the final division.",
          hi: "3 जोड़िए, फिर आधा: 2x = 10, x = 5। 2 तीन को लौटाने की जगह घटा देता है; 10 अंतिम भाग भूल जाता है।",
          mr: "3 मिळवा, मग निम्मे: 2x = 10, x = 5. 2 तिघाला परत करण्याऐवजी वजा करतो; 10 शेवटचा भाग विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve: x/3 + 1 = 4.",
          hi: "हल कीजिए: x/3 + 1 = 4।",
          mr: "सोडवा: x/3 + 1 = 4.",
        },
        answer: 9,
        wrong: [1, 15, 5],
        checkExpr: "(4-1)*3",
        solution: {
          en: "Subtract 1, then triple: x/3 = 3, x = 9. 15 triples before removing the 1 — undoing runs in reverse order.",
          hi: "1 घटाइए, फिर तिगुना: x/3 = 3, x = 9। 15 एक हटाने से पहले तिगुना कर देता है — उलटना उल्टे क्रम में चलता है।",
          mr: "1 वजा करा, मग तिप्पट: x/3 = 3, x = 9. 15 एक काढण्याआधी तिप्पट करतो — उलटणे उलट्या क्रमाने चालते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve: 5x = 3x + 8.",
          hi: "हल कीजिए: 5x = 3x + 8।",
          mr: "सोडवा: 5x = 3x + 8.",
        },
        answer: 4,
        wrong: [8, 2, 1],
        checkExpr: "8/2",
        solution: {
          en: "Bring the x's together: 5x − 3x = 8, so 2x = 8 and x = 4. 8 stops at 2x; 1 divides 8 by all of 5 + 3.",
          hi: "x एक ओर लाइए: 5x − 3x = 8, अतः 2x = 8 और x = 4। 8 2x पर रुक जाता है; 1 आठ को 5 + 3 से भाग देता है।",
          mr: "x एका बाजूला आणा: 5x − 3x = 8, म्हणून 2x = 8 आणि x = 4. 8 2x वर थांबतो; 1 आठाला 5 + 3 ने भागतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve: 3x + 2 = 2x + 9.",
          hi: "हल कीजिए: 3x + 2 = 2x + 9।",
          mr: "सोडवा: 3x + 2 = 2x + 9.",
        },
        answer: 7,
        wrong: [11, 5, 1.4],
        checkExpr: "9-2",
        solution: {
          en: "x's left, numbers right: 3x − 2x = 9 − 2, so x = 7. 11 adds the 2 instead of moving it across with a sign change.",
          hi: "x बाएँ, संख्याएँ दाएँ: 3x − 2x = 9 − 2, अतः x = 7। 11 दो को चिह्न बदलकर पार ले जाने की जगह जोड़ देता है।",
          mr: "x डावीकडे, संख्या उजवीकडे: 3x − 2x = 9 − 2, म्हणून x = 7. 11 दोघाला चिन्ह बदलून पलीकडे नेण्याऐवजी मिळवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve: x/2 − x/3 = 2.",
          hi: "हल कीजिए: x/2 − x/3 = 2।",
          mr: "सोडवा: x/2 − x/3 = 2.",
        },
        answer: 12,
        wrong: [6, 2, 10],
        checkExpr: "2*6",
        solution: {
          en: "Common denominator 6: 3x/6 − 2x/6 = x/6 = 2, so x = 12. Check: 6 − 4 = 2 ✓. 6 mistakes x/6 = 2 for x = 6.",
          hi: "समान हर 6: 3x/6 − 2x/6 = x/6 = 2, अतः x = 12। जाँच: 6 − 4 = 2 ✓। 6 x/6 = 2 को x = 6 समझ बैठता है।",
          mr: "समान छेद 6: 3x/6 − 2x/6 = x/6 = 2, म्हणून x = 12. पडताळणी: 6 − 4 = 2 ✓. 6 x/6 = 2 ला x = 6 समजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two-fifths of a number is 8. What is the number?",
          hi: "किसी संख्या का दो-पाँचवाँ 8 है। संख्या क्या है?",
          mr: "एका संख्येचा दोन-पंचमांश 8 आहे. संख्या कोणती?",
        },
        answer: 20,
        wrong: [16, 3.2, 40],
        checkExpr: "8*5/2",
        solution: {
          en: "If 2/5 of it is 8, one fifth is 4 and the whole is 20. 3.2 takes 2/5 OF 8 — the question runs the other way.",
          hi: "यदि उसका 2/5 है 8, तो पाँचवाँ 4 और पूरी संख्या 20। 3.2 उलटे 8 का 2/5 निकाल लेता है — सवाल दूसरी दिशा में चलता है।",
          mr: "त्याचा 2/5 म्हणजे 8, तर पंचमांश 4 आणि पूर्ण संख्या 20. 3.2 उलटे 8 चा 2/5 काढतो — प्रश्न दुसऱ्या दिशेने चालतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "Solve: 2(x − 1) + 3 = x + 6.",
          hi: "हल कीजिए: 2(x − 1) + 3 = x + 6।",
          mr: "सोडवा: 2(x − 1) + 3 = x + 6.",
        },
        answer: 5,
        wrong: [7, 3, 4],
        checkExpr: "6-1",
        solution: {
          en: "Open the bracket: 2x − 2 + 3 = 2x + 1, so 2x + 1 = x + 6 gives x = 5. 7 turns −2 into +2 when opening.",
          hi: "कोष्ठक खोलिए: 2x − 2 + 3 = 2x + 1, अतः 2x + 1 = x + 6 से x = 5। 7 खोलते समय −2 को +2 बना देता है।",
          mr: "कंस उघडा: 2x − 2 + 3 = 2x + 1, म्हणून 2x + 1 = x + 6 मधून x = 5. 7 उघडताना −2 चे +2 करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Three consecutive EVEN numbers add up to 54. What is the largest of them?",
          hi: "तीन क्रमागत सम संख्याओं का योग 54 है। उनमें सबसे बड़ी कौन-सी?",
          mr: "तीन क्रमागत सम संख्यांची बेरीज 54 आहे. त्यांतील सर्वांत मोठी कोणती?",
        },
        answer: 20,
        wrong: [18, 16, 22],
        checkExpr: "54/3+2",
        solution: {
          en: "The middle one is 54 ÷ 3 = 18, so the three are 16, 18, 20 — largest 20. Even neighbours stand 2 apart, not 1.",
          hi: "बीच वाली 54 ÷ 3 = 18, अतः तीनों 16, 18, 20 — सबसे बड़ी 20। सम पड़ोसी 2 की दूरी पर खड़े होते हैं, 1 की नहीं।",
          mr: "मधली 54 ÷ 3 = 18, म्हणून तिन्ही 16, 18, 20 — सर्वांत मोठी 20. सम शेजारी 2 च्या अंतरावर उभे असतात, 1 च्या नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Solve: (2x + 1)/3 = 5.",
          hi: "हल कीजिए: (2x + 1)/3 = 5।",
          mr: "सोडवा: (2x + 1)/3 = 5.",
        },
        answer: 7,
        wrong: [8, 4, 15],
        checkExpr: "(5*3-1)/2",
        solution: {
          en: "Triple first: 2x + 1 = 15, then 2x = 14 and x = 7. 15 stops at the tripling; 8 adds the 1 instead of removing it.",
          hi: "पहले तिगुना: 2x + 1 = 15, फिर 2x = 14 और x = 7। 15 तिगुने पर रुक जाता है; 8 एक हटाने की जगह जोड़ देता है।",
          mr: "आधी तिप्पट: 2x + 1 = 15, मग 2x = 14 आणि x = 7. 15 तिपटीवर थांबतो; 8 एक काढण्याऐवजी मिळवतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "Ravi's father is 26 years older than Ravi. In 3 years the father will be three times Ravi's age. How old is Ravi NOW?",
          hi: "रवि के पिता रवि से 26 वर्ष बड़े हैं। 3 वर्ष बाद पिता रवि की उम्र के तीन गुने होंगे। रवि अभी कितने का है?",
          mr: "रवीचे वडील रवीहून 26 वर्षांनी मोठे आहेत. 3 वर्षांनी वडील रवीच्या वयाच्या तिप्पट असतील. रवी आता किती वर्षांचा?",
        },
        answer: 10,
        wrong: [13, 5, 8],
        checkExpr: "20/2",
        solution: {
          en: "In 3 years: (x + 26 + 3) = 3(x + 3), so x + 29 = 3x + 9 and 2x = 20 — Ravi is 10. Check: 39 = 3 × 13 ✓. 13 answers his age in three years.",
          hi: "3 वर्ष बाद: (x + 26 + 3) = 3(x + 3), अतः x + 29 = 3x + 9 और 2x = 20 — रवि 10 का। जाँच: 39 = 3 × 13 ✓। 13 तीन वर्ष बाद की उम्र बताता है।",
          mr: "3 वर्षांनी: (x + 26 + 3) = 3(x + 3), म्हणून x + 29 = 3x + 9 आणि 2x = 20 — रवी 10 चा. पडताळणी: 39 = 3 × 13 ✓. 13 तीन वर्षांनंतरचे वय सांगतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A two-digit number's digits add to 9, and reversing the digits DECREASES the number by 27. What is the number?",
          hi: "दो अंकों की संख्या के अंकों का योग 9 है, और अंक पलटने पर संख्या 27 घट जाती है। संख्या क्या है?",
          mr: "दोन अंकी संख्येच्या अंकांची बेरीज 9 आहे, आणि अंक उलटवल्यास संख्या 27 ने घटते. संख्या कोणती?",
        },
        answer: 63,
        wrong: [36, 54, 72],
        solution: {
          en: "With digits a + b = 9 and (10a + b) − (10b + a) = 27, we get 9(a − b) = 27, so a − b = 3: digits 6 and 3, number 63. 36 is its own reverse — the DECREASED one.",
          hi: "अंक a + b = 9 और (10a + b) − (10b + a) = 27 से 9(a − b) = 27, अतः a − b = 3: अंक 6 और 3, संख्या 63। 36 उसका ही पलटा रूप है — घटा हुआ वाला।",
          mr: "अंक a + b = 9 आणि (10a + b) − (10b + a) = 27 मधून 9(a − b) = 27, म्हणून a − b = 3: अंक 6 आणि 3, संख्या 63. 36 हे त्याचेच उलटे रूप — घटलेले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A rectangle's length exceeds its breadth by 7 cm, and its perimeter is 46 cm. Find the LENGTH.",
          hi: "आयत की लंबाई चौड़ाई से 7 सेमी अधिक है, और परिमाप 46 सेमी। लंबाई निकालिए।",
          mr: "आयताची लांबी रुंदीहून 7 सेमी जास्त आहे, आणि परिमिती 46 सेमी. लांबी काढा.",
        },
        answer: 15,
        wrong: [8, 11.5, 16],
        checkExpr: "(46/2+7)/2",
        solution: {
          en: "Half the perimeter is length + breadth = 23; with a gap of 7, the length is (23 + 7)/2 = 15 and breadth 8. 8 answers the breadth; 11.5 splits 23 equally.",
          hi: "आधा परिमाप = लंबाई + चौड़ाई = 23; अंतर 7 के साथ लंबाई (23 + 7)/2 = 15 और चौड़ाई 8। 8 चौड़ाई का उत्तर है; 11.5 तेईस को बराबर बाँट देता है।",
          mr: "अर्धी परिमिती = लांबी + रुंदी = 23; 7 च्या फरकाने लांबी (23 + 7)/2 = 15 आणि रुंदी 8. 8 रुंदीचे उत्तर; 11.5 तेविसाला सारखे वाटतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "Solve: (3x − 2)/(2x + 3) = 1.",
          hi: "हल कीजिए: (3x − 2)/(2x + 3) = 1।",
          mr: "सोडवा: (3x − 2)/(2x + 3) = 1.",
        },
        answer: 5,
        wrong: [1, -5, 0.2],
        checkExpr: "3+2",
        solution: {
          en: "A fraction equals 1 only when top equals bottom: 3x − 2 = 2x + 3, so x = 5. Check: 13/13 = 1 ✓.",
          hi: "भिन्न 1 तभी होती है जब अंश हर के बराबर हो: 3x − 2 = 2x + 3, अतः x = 5। जाँच: 13/13 = 1 ✓।",
          mr: "अपूर्णांक 1 तेव्हाच होतो जेव्हा अंश छेदाइतका: 3x − 2 = 2x + 3, म्हणून x = 5. पडताळणी: 13/13 = 1 ✓.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A purse holds ₹5 and ₹10 notes — 20 notes in all, worth ₹125. How many ₹10 notes are there?",
          hi: "बटुए में ₹5 और ₹10 के नोट हैं — कुल 20 नोट, ₹125 के। ₹10 के कितने नोट हैं?",
          mr: "पाकिटात ₹5 आणि ₹10 च्या नोटा आहेत — एकूण 20 नोटा, ₹125 च्या. ₹10 च्या किती नोटा?",
        },
        answer: 5,
        wrong: [15, 10, 12.5],
        checkExpr: "(125-100)/5",
        solution: {
          en: "If all 20 were ₹5 notes they'd make ₹100; the extra ₹25 comes from swapping ₹5s for ₹10s at ₹5 a swap: 25 ÷ 5 = 5 tens. Check: 5×10 + 15×5 = 125 ✓.",
          hi: "बीसों ₹5 के होते तो ₹100 बनते; ऊपर के ₹25 हर अदला-बदली पर ₹5 जोड़ने से आए: 25 ÷ 5 = 5 दहाई नोट। जाँच: 5×10 + 15×5 = 125 ✓।",
          mr: "विसाही ₹5 च्या असत्या तर ₹100 झाले असते; वरचे ₹25 प्रत्येक अदलाबदलीत ₹5 जोडून आले: 25 ÷ 5 = 5 दहाच्या नोटा. पडताळणी: 5×10 + 15×5 = 125 ✓.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "A fraction's denominator is 2 more than its numerator. Add 3 to both, and the fraction becomes 3/4. What was the original NUMERATOR?",
          hi: "भिन्न का हर उसके अंश से 2 अधिक है। दोनों में 3 जोड़ने पर भिन्न 3/4 बन जाती है। मूल अंश क्या था?",
          mr: "अपूर्णांकाचा छेद अंशाहून 2 ने मोठा आहे. दोन्हींत 3 मिळवल्यास अपूर्णांक 3/4 होतो. मूळ अंश काय होता?",
        },
        answer: 3,
        wrong: [5, 2, 6],
        checkExpr: "15-12",
        solution: {
          en: "(n + 3)/(n + 5) = 3/4 cross-multiplies to 4n + 12 = 3n + 15, so n = 3: the fraction 3/5 becomes 6/8 = 3/4 ✓. 5 answers the denominator.",
          hi: "(n + 3)/(n + 5) = 3/4 का तिर्यक् गुणन: 4n + 12 = 3n + 15, अतः n = 3: भिन्न 3/5 बनती है 6/8 = 3/4 ✓। 5 हर का उत्तर है।",
          mr: "(n + 3)/(n + 5) = 3/4 चा तिर्यक गुणाकार: 4n + 12 = 3n + 15, म्हणून n = 3: अपूर्णांक 3/5 होतो 6/8 = 3/4 ✓. 5 छेदाचे उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Multiplying a number by 4 and adding 12 gives the same result as multiplying it by 6 and subtracting 2. Find the number.",
          hi: "किसी संख्या को 4 से गुणा कर 12 जोड़ने पर वही मिलता है जो 6 से गुणा कर 2 घटाने पर। संख्या निकालिए।",
          mr: "एका संख्येला 4 ने गुणून 12 मिळवल्यास तेच येते जे 6 ने गुणून 2 वजा केल्यावर. संख्या काढा.",
        },
        answer: 7,
        wrong: [5, 14, 3.5],
        checkExpr: "14/2",
        solution: {
          en: "4x + 12 = 6x − 2 gives 14 = 2x, so x = 7. Check both machines: 4×7+12 = 40 and 6×7−2 = 40 ✓ — one number, two recipes, same dish.",
          hi: "4x + 12 = 6x − 2 से 14 = 2x, अतः x = 7। दोनों मशीनें जाँचिए: 4×7+12 = 40 और 6×7−2 = 40 ✓ — एक संख्या, दो विधियाँ, एक ही पकवान।",
          mr: "4x + 12 = 6x − 2 मधून 14 = 2x, म्हणून x = 7. दोन्ही यंत्रे तपासा: 4×7+12 = 40 आणि 6×7−2 = 40 ✓ — एक संख्या, दोन कृती, एकच पदार्थ.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 2 — Linear Equations in One Variable",
      name: "Linear Equations in One Variable",
      slug: "maths-8-linear-equations",
      summary:
        "x appears on both sides and in fractions: brackets opened honestly, digits reversed, notes counted in a purse — and every answer walked back into its equation.",
      position: 2,
      translations: {
        hi: {
          name: "एक चर वाले रैखिक समीकरण",
          summary:
            "x दोनों पक्षों और भिन्नों में आता है: ईमानदारी से खुले कोष्ठक, पलटे अंक, बटुए में गिने नोट — और हर उत्तर अपने समीकरण में वापस चलाकर परखा हुआ।",
        },
        mr: {
          name: "एका चलातील रेषीय समीकरणे",
          summary:
            "x दोन्ही बाजूंना आणि अपूर्णांकांत येतो: प्रामाणिकपणे उघडलेले कंस, उलटवलेले अंक, पाकिटात मोजलेल्या नोटा — आणि प्रत्येक उत्तर आपल्या समीकरणात परत चालवून तपासलेले.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Understanding Quadrilaterals (angle sums and their heirs)     */
/* ------------------------------------------------------------------------- */
function quadrilaterals8(): TopicFileOut {
  const rand = rng("maths-8-understanding-quadrilaterals");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the sum of the interior angles of ANY quadrilateral?",
          hi: "किसी भी चतुर्भुज के अंतःकोणों का योग कितना होता है?",
          mr: "कोणत्याही चौकोनाच्या आंतरकोनांची बेरीज किती असते?",
        },
        answer: 360,
        wrong: [180, 540, 720],
        checkExpr: "(4-2)*180",
        fmt: deg,
        solution: {
          en: "A diagonal splits it into two triangles of 180° each: 2 × 180 = 360°. 180 counts only one of the triangles.",
          hi: "एक विकर्ण उसे 180°-180° के दो त्रिभुजों में बाँटता है: 2 × 180 = 360°। 180 केवल एक त्रिभुज गिनता है।",
          mr: "एक कर्ण त्याला 180°-180° च्या दोन त्रिकोणांत वाटतो: 2 × 180 = 360°. 180 फक्त एक त्रिकोण मोजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Join a quadrilateral's vertices in every possible way. How many of the joins are DIAGONALS rather than sides?",
          hi: "चतुर्भुज के शीर्षों को हर संभव तरीक़े से जोड़िए। कितने जोड़ भुजाएँ नहीं, विकर्ण हैं?",
          mr: "चौकोनाचे शिरोबिंदू प्रत्येक शक्य रीतीने जोडा. किती जोड बाजू नव्हे, कर्ण आहेत?",
        },
        answer: 2,
        wrong: [4, 1, 3],
        solution: {
          en: "Each vertex reaches the ONE vertex not beside it: two such crossings in all. 4 counts the sides instead.",
          hi: "हर शीर्ष अपने बग़ल में न बैठे इकलौते शीर्ष तक पहुँचता है: कुल ऐसे दो मिलन। 4 उलटे भुजाएँ गिन लेता है।",
          mr: "प्रत्येक शिरोबिंदू शेजारी नसलेल्या एकाच शिरोबिंदूपर्यंत पोहोचतो: एकूण असे दोन. 4 उलट बाजू मोजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The exterior angles of any polygon, one at each vertex, always total how many degrees?",
          hi: "किसी भी बहुभुज के बाह्य कोण, हर शीर्ष पर एक, हमेशा कितने डिग्री जोड़ते हैं?",
          mr: "कोणत्याही बहुभुजाचे बाह्यकोन, प्रत्येक शिरोबिंदूवर एक, नेहमी किती अंश होतात?",
        },
        answer: 360,
        wrong: [180, 720, 90],
        fmt: deg,
        solution: {
          en: "Walk once round the boundary and you turn through one full circle: 360°, whatever the number of sides.",
          hi: "सीमा का एक चक्कर लगाइए और आप पूरा एक घेरा घूम जाते हैं: 360°, भुजाएँ चाहे जितनी हों।",
          mr: "सीमेला एक फेरी मारा आणि तुम्ही पूर्ण एक वर्तुळ वळता: 360°, बाजू कितीही असोत.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the interior angle sum of a pentagon?",
          hi: "पंचभुज के अंतःकोणों का योग कितना होता है?",
          mr: "पंचकोनाच्या आंतरकोनांची बेरीज किती असते?",
        },
        answer: 540,
        wrong: [360, 720, 900],
        checkExpr: "(5-2)*180",
        fmt: deg,
        solution: {
          en: "(n − 2) × 180 with n = 5: three triangles' worth, 540°. 360 stops at the quadrilateral's sum.",
          hi: "(n − 2) × 180 में n = 5: तीन त्रिभुजों जितना, 540°। 360 चतुर्भुज के योग पर रुक जाता है।",
          mr: "(n − 2) × 180 मध्ये n = 5: तीन त्रिकोणांइतके, 540°. 360 चौकोनाच्या बेरजेवर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In a parallelogram one angle measures 70°. What does the angle OPPOSITE it measure?",
          hi: "समांतर चतुर्भुज का एक कोण 70° है। उसके सम्मुख कोण की माप कितनी?",
          mr: "समांतरभुज चौकोनाचा एक कोन 70° आहे. त्याच्या समोरच्या कोनाचे माप किती?",
        },
        answer: 70,
        wrong: [110, 20, 140],
        fmt: deg,
        solution: {
          en: "Opposite angles of a parallelogram are equal: 70°. 110 is the NEIGHBOUR's measure — adjacent, not opposite.",
          hi: "समांतर चतुर्भुज के सम्मुख कोण बराबर होते हैं: 70°। 110 पड़ोसी की माप है — आसन्न, सम्मुख नहीं।",
          mr: "समांतरभुजाचे समोरचे कोन समान असतात: 70°. 110 हे शेजाऱ्याचे माप — लगतचा, समोरचा नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Adjacent angles of a parallelogram always sum to how many degrees?",
          hi: "समांतर चतुर्भुज के आसन्न कोणों का योग सदा कितने डिग्री होता है?",
          mr: "समांतरभुज चौकोनाच्या लगतच्या कोनांची बेरीज नेहमी किती अंश असते?",
        },
        answer: 180,
        wrong: [90, 360, 120],
        fmt: deg,
        solution: {
          en: "The two sit between parallel sides, co-interior along the transversal: they total 180°. 360 is all four angles together.",
          hi: "दोनों समांतर भुजाओं के बीच, तिर्यक रेखा के एक ओर के अंतःकोण हैं: योग 180°। 360 चारों कोणों का कुल है।",
          mr: "दोघे समांतर बाजूंच्या मध्ये, छेदिकेच्या एका बाजूचे आंतरकोन: बेरीज 180°. 360 म्हणजे चारही कोन मिळून.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "Three angles of a quadrilateral are 80°, 95° and 100°. Find the fourth.",
          hi: "चतुर्भुज के तीन कोण 80°, 95° और 100° हैं। चौथा निकालिए।",
          mr: "चौकोनाचे तीन कोन 80°, 95° आणि 100° आहेत. चौथा काढा.",
        },
        answer: 85,
        wrong: [95, 105, 75],
        checkExpr: "360-80-95-100",
        fmt: deg,
        solution: {
          en: "The four must total 360: the fourth is 360 − 275 = 85°. 105 subtracts from 380 — an arithmetic slip, not a geometry one.",
          hi: "चारों का योग 360 होना है: चौथा 360 − 275 = 85°। 105 380 में से घटाता है — चूक अंकगणित की है, ज्यामिति की नहीं।",
          mr: "चौघांची बेरीज 360 हवी: चौथा 360 − 275 = 85°. 105 380 मधून वजा करतो — चूक अंकगणिताची, भूमितीची नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What does each interior angle of a REGULAR hexagon measure?",
          hi: "सम षट्भुज का हर अंतःकोण कितने का होता है?",
          mr: "नियमित षट्कोनाचा प्रत्येक आंतरकोन किती अंशांचा असतो?",
        },
        answer: 120,
        wrong: [108, 135, 60],
        checkExpr: "(6-2)*180/6",
        fmt: deg,
        solution: {
          en: "Sum (6 − 2) × 180 = 720 shared by 6 equal angles: 120° each. 108 belongs to the regular pentagon next door.",
          hi: "योग (6 − 2) × 180 = 720, छह बराबर कोणों में बँटा: 120° प्रत्येक। 108 बग़ल के सम पंचभुज का है।",
          mr: "बेरीज (6 − 2) × 180 = 720, सहा समान कोनांत वाटलेली: प्रत्येकी 120°. 108 शेजारच्या नियमित पंचकोनाचा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The diagonals of a rhombus always cross each other at which angle?",
          hi: "समचतुर्भुज के विकर्ण सदा किस कोण पर एक-दूसरे को काटते हैं?",
          mr: "समभुज चौकोनाचे कर्ण नेहमी कोणत्या कोनात एकमेकांना छेदतात?",
        },
        answer: 90,
        wrong: [60, 45, 180],
        fmt: deg,
        solution: {
          en: "A rhombus's diagonals bisect each other at right angles: 90°, whatever its tilt. The rectangle's diagonals bisect but do NOT stay perpendicular.",
          hi: "समचतुर्भुज के विकर्ण एक-दूसरे को समकोण पर समद्विभाजित करते हैं: 90°, झुकाव जो भी हो। आयत के विकर्ण बाँटते तो हैं पर लंब नहीं रहते।",
          mr: "समभुज चौकोनाचे कर्ण एकमेकांना काटकोनात दुभागतात: 90°, कल कोणताही असो. आयताचे कर्ण दुभागतात पण लंब राहत नाहीत.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "The angles of a quadrilateral are in the ratio 1 : 2 : 3 : 4. What is the LARGEST angle?",
          hi: "चतुर्भुज के कोण 1 : 2 : 3 : 4 के अनुपात में हैं। सबसे बड़ा कोण कितना?",
          mr: "चौकोनाचे कोन 1 : 2 : 3 : 4 या गुणोत्तरात आहेत. सर्वांत मोठा कोन किती?",
        },
        answer: 144,
        wrong: [36, 108, 120],
        checkExpr: "360*4/10",
        fmt: deg,
        solution: {
          en: "Ten ratio-parts share 360°, so one part is 36 and the largest takes 4 × 36 = 144°. 36 stops at a single part.",
          hi: "दस अनुपात-भाग 360° बाँटते हैं, एक भाग 36 और सबसे बड़ा 4 × 36 = 144°। 36 एक ही भाग पर रुक जाता है।",
          mr: "दहा गुणोत्तर-भाग 360° वाटतात, एक भाग 36 आणि सर्वांत मोठा 4 × 36 = 144°. 36 एकाच भागावर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A regular polygon has each exterior angle equal to 45°. How many sides does it have?",
          hi: "एक सम बहुभुज का हर बाह्य कोण 45° है। उसकी कितनी भुजाएँ हैं?",
          mr: "एका नियमित बहुभुजाचा प्रत्येक बाह्यकोन 45° आहे. त्याला किती बाजू आहेत?",
        },
        answer: 8,
        wrong: [45, 6, 10],
        checkExpr: "360/45",
        solution: {
          en: "The exterior angles always total 360, so sides = 360 ÷ 45 = 8: an octagon. The formula needs no interior-angle detour.",
          hi: "बाह्य कोणों का योग सदा 360, अतः भुजाएँ = 360 ÷ 45 = 8: अष्टभुज। सूत्र को अंतःकोण के चक्कर की ज़रूरत नहीं।",
          mr: "बाह्यकोनांची बेरीज नेहमी 360, म्हणून बाजू = 360 ÷ 45 = 8: अष्टकोन. सूत्राला आंतरकोनाच्या वळशाची गरज नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "In a parallelogram, one angle is 30° MORE than its neighbour. What is the larger angle?",
          hi: "समांतर चतुर्भुज में एक कोण अपने पड़ोसी से 30° अधिक है। बड़ा कोण कितना?",
          mr: "समांतरभुज चौकोनात एक कोन शेजाऱ्याहून 30° ने मोठा आहे. मोठा कोन किती?",
        },
        answer: 105,
        wrong: [75, 150, 120],
        checkExpr: "(180+30)/2",
        fmt: deg,
        solution: {
          en: "Neighbours total 180: x + (x + 30) = 180 gives 75 and 105 — the larger is 105°. 75 answers the smaller partner.",
          hi: "पड़ोसियों का योग 180: x + (x + 30) = 180 से 75 और 105 — बड़ा 105°। 75 छोटे साथी का उत्तर है।",
          mr: "शेजाऱ्यांची बेरीज 180: x + (x + 30) = 180 मधून 75 आणि 105 — मोठा 105°. 75 लहान जोडीदाराचे उत्तर.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "A parallelogram's diagonals measure 12 cm and 16 cm, and they bisect each other. How far from the crossing point is each END of the longer diagonal?",
          hi: "समांतर चतुर्भुज के विकर्ण 12 सेमी और 16 सेमी हैं, और वे एक-दूसरे को समद्विभाजित करते हैं। कटान-बिंदु से बड़े विकर्ण का हर सिरा कितनी दूर है?",
          mr: "समांतरभुजाचे कर्ण 12 सेमी आणि 16 सेमी आहेत, आणि ते एकमेकांना दुभागतात. छेदबिंदूपासून मोठ्या कर्णाचे प्रत्येक टोक किती दूर?",
        },
        answer: 8,
        wrong: [6, 12, 4],
        checkExpr: "16/2",
        solution: {
          en: "Bisection halves each diagonal at the crossing: the 16 cm one splits into 8 + 8. 6 halves the WRONG diagonal.",
          hi: "समद्विभाजन कटान पर हर विकर्ण को आधा करता है: 16 सेमी वाला 8 + 8 में बँटता है। 6 ग़लत विकर्ण आधा करता है।",
          mr: "दुभाजन छेदावर प्रत्येक कर्ण अर्धा करते: 16 सेमीचा 8 + 8 मध्ये वाटला जातो. 6 चुकीचा कर्ण अर्धा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Each interior angle of a regular polygon measures 150°. How many sides has it?",
          hi: "एक सम बहुभुज का हर अंतःकोण 150° है। उसकी कितनी भुजाएँ हैं?",
          mr: "एका नियमित बहुभुजाचा प्रत्येक आंतरकोन 150° आहे. त्याला किती बाजू?",
        },
        answer: 12,
        wrong: [15, 10, 8],
        checkExpr: "360/(180-150)",
        solution: {
          en: "Each exterior angle is 180 − 150 = 30°, and 360 ÷ 30 = 12 sides. The exterior-angle route beats wrestling the interior formula.",
          hi: "हर बाह्य कोण 180 − 150 = 30°, और 360 ÷ 30 = 12 भुजाएँ। बाह्य कोण की राह अंतःकोण के सूत्र से कुश्ती लड़ने से बेहतर है।",
          mr: "प्रत्येक बाह्यकोन 180 − 150 = 30°, आणि 360 ÷ 30 = 12 बाजू. बाह्यकोनाची वाट आंतरकोनाच्या सूत्राशी झुंजण्याहून बरी.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "A student claims a regular polygon can have each exterior angle equal to 50°. Compute 360 ÷ 50 and let the answer judge the claim.",
          hi: "एक विद्यार्थी का दावा है कि सम बहुभुज का हर बाह्य कोण 50° हो सकता है। 360 ÷ 50 निकालिए और उत्तर को ही दावे का न्याय करने दीजिए।",
          mr: "एका विद्यार्थ्याचा दावा आहे की नियमित बहुभुजाचा प्रत्येक बाह्यकोन 50° असू शकतो. 360 ÷ 50 काढा आणि उत्तरालाच दाव्याचा न्याय करू द्या.",
        },
        answer: 7.2,
        wrong: [7, 8, 6],
        checkExpr: "360/50",
        solution: {
          en: "360 ÷ 50 = 7.2 — and a polygon cannot have 7.2 sides. The exterior angle must divide 360 exactly; 50 does not, so no such polygon exists. The fraction IS the refutation.",
          hi: "360 ÷ 50 = 7.2 — और बहुभुज की 7.2 भुजाएँ नहीं हो सकतीं। बाह्य कोण को 360 को पूरा-पूरा बाँटना चाहिए; 50 नहीं बाँटता, अतः ऐसा बहुभुज है ही नहीं। वह भिन्न ही खंडन है।",
          mr: "360 ÷ 50 = 7.2 — आणि बहुभुजाला 7.2 बाजू असू शकत नाहीत. बाह्यकोनाने 360 ला नेमके भागले पाहिजे; 50 भागत नाही, म्हणून असा बहुभुज नाहीच. तो अपूर्णांकच खंडन आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Of the four names — square, rectangle, rhombus, parallelogram — how many correctly describe a SQUARE?",
          hi: "चार नामों — वर्ग, आयत, समचतुर्भुज, समांतर चतुर्भुज — में से कितने एक वर्ग का सही वर्णन करते हैं?",
          mr: "चार नावांपैकी — चौरस, आयत, समभुज चौकोन, समांतरभुज — किती एका चौरसाचे बरोबर वर्णन करतात?",
        },
        answer: 4,
        wrong: [1, 2, 3],
        solution: {
          en: "All 4: a square has the rectangle's right angles, the rhombus's equal sides, and both parallel pairs of the parallelogram. Special cases INHERIT every name up their family tree.",
          hi: "चारों 4: वर्ग में आयत के समकोण हैं, समचतुर्भुज की बराबर भुजाएँ, और समांतर चतुर्भुज के दोनों समांतर युग्म। विशेष रूप अपने वंश-वृक्ष के हर नाम का वारिस होता है।",
          mr: "चारही 4: चौरसात आयताचे काटकोन, समभुज चौकोनाच्या समान बाजू, आणि समांतरभुजाच्या दोन्ही समांतर जोड्या आहेत. विशेष रूप आपल्या वंशवृक्षावरील प्रत्येक नावाचा वारस असते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 3 — Understanding Quadrilaterals",
      name: "Understanding Quadrilaterals",
      slug: "maths-8-understanding-quadrilaterals",
      summary:
        "Angle sums by triangle-cutting, the ever-360 exterior walk, parallelogram families and their diagonals — and the fraction 7.2 refuting a polygon into nonexistence.",
      position: 3,
      translations: {
        hi: {
          name: "चतुर्भुजों की समझ",
          summary:
            "त्रिभुज काटकर मिले कोण-योग, सदा-360 की बाहरी परिक्रमा, समांतर चतुर्भुज परिवार और उनके विकर्ण — और 7.2 की भिन्न जो एक बहुभुज को अस्तित्व से ही ख़ारिज कर देती है।",
        },
        mr: {
          name: "चौकोनांची समज",
          summary:
            "त्रिकोण कापून मिळालेल्या कोन-बेरजा, नेहमी-360 ची बाह्य फेरी, समांतरभुज कुटुंबे आणि त्यांचे कर्ण — आणि एका बहुभुजाला अस्तित्वातूनच बाद करणारा 7.2 चा अपूर्णांक.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Data Handling (pies, groups and chance)                       */
/* ------------------------------------------------------------------------- */
function dataHandling8(): TopicFileOut {
  const rand = rng("maths-8-data-handling");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A pie chart's full circle stands for the whole data. How many degrees does the full circle hold?",
          hi: "पाई चार्ट का पूरा वृत्त समूचे आँकड़ों का प्रतीक है। पूरे वृत्त में कितने डिग्री होते हैं?",
          mr: "पाय चार्टचे पूर्ण वर्तुळ सगळ्या माहितीचे प्रतीक असते. पूर्ण वर्तुळात किती अंश असतात?",
        },
        answer: 360,
        wrong: [180, 100, 90],
        fmt: deg,
        solution: {
          en: "The circle is 360°, so every share converts at 3.6° per percent. 100 confuses degrees with percentage points.",
          hi: "वृत्त 360° का है, अतः हर हिस्सा 3.6° प्रति प्रतिशत की दर से बदलता है। 100 डिग्री को प्रतिशत से मिला बैठता है।",
          mr: "वर्तुळ 360° चे, म्हणून प्रत्येक वाटा दर टक्क्याला 3.6° या दराने बदलतो. 100 अंशांची टक्क्यांशी गल्लत करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A single coin is tossed once. How many possible outcomes are there?",
          hi: "एक सिक्का एक बार उछाला जाता है। कितने संभावित परिणाम हैं?",
          mr: "एक नाणे एकदा उडवले जाते. किती शक्य निकाल आहेत?",
        },
        answer: 2,
        wrong: [1, 4, 3],
        solution: {
          en: "Heads or tails: 2 outcomes, equally likely for a fair coin. 4 belongs to TWO coins tossed together.",
          hi: "चित या पट: 2 परिणाम, खरे सिक्के के लिए समसंभाव्य। 4 एक साथ उछाले दो सिक्कों का है।",
          mr: "छापा वा काटा: 2 निकाल, खऱ्या नाण्यासाठी समसंभाव्य. 4 एकत्र उडवलेल्या दोन नाण्यांचा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In a class of 40, the pie-slice for walkers is a quarter of the circle. How many children walk to school?",
          hi: "40 की कक्षा में पैदल आने वालों की पाई-फाँक वृत्त की चौथाई है। कितने बच्चे पैदल आते हैं?",
          mr: "40 च्या वर्गात चालत येणाऱ्यांची पाय-फोड वर्तुळाचा पाव आहे. किती मुले चालत येतात?",
        },
        answer: 10,
        wrong: [4, 20, 90],
        checkExpr: "40/4",
        solution: {
          en: "A quarter of the circle means a quarter of the class: 40 ÷ 4 = 10. 90 answers in degrees, not children.",
          hi: "वृत्त की चौथाई यानी कक्षा की चौथाई: 40 ÷ 4 = 10। 90 बच्चों में नहीं, डिग्रियों में जवाब देता है।",
          mr: "वर्तुळाचा पाव म्हणजे वर्गाचा पाव: 40 ÷ 4 = 10. 90 मुलांत नव्हे, अंशांत उत्तर देतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "On a pie chart, cricket's slice spans 90°. What percentage of students chose cricket?",
          hi: "पाई चार्ट पर क्रिकेट की फाँक 90° की है। कितने प्रतिशत विद्यार्थियों ने क्रिकेट चुना?",
          mr: "पाय चार्टवर क्रिकेटची फोड 90° ची आहे. किती टक्के विद्यार्थ्यांनी क्रिकेट निवडले?",
        },
        answer: 25,
        wrong: [90, 50, 12.5],
        checkExpr: "90*100/360",
        fmt: pct,
        solution: {
          en: "90 out of 360 is a quarter: 25%. 90 repeats the angle as if degrees were percent — two different rulers.",
          hi: "360 में से 90 यानी चौथाई: 25%। 90 कोण को ही दोहराता है मानो डिग्री प्रतिशत हों — दो अलग पैमाने।",
          mr: "360 पैकी 90 म्हणजे पाव: 25%. 90 कोनच पुन्हा सांगतो जणू अंश म्हणजे टक्के — दोन वेगळ्या पट्ट्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A spinner has 4 equal sectors, exactly one of them red. What is the probability of landing on red, as a decimal?",
          hi: "एक चकरी में 4 बराबर खंड हैं, ठीक एक लाल। लाल पर रुकने की प्रायिकता दशमलव में कितनी?",
          mr: "एका चक्रीत 4 समान भाग आहेत, नेमका एक लाल. लालवर थांबण्याची संभाव्यता दशांशात किती?",
        },
        answer: 0.25,
        wrong: [0.4, 0.75, 4],
        checkExpr: "1/4",
        solution: {
          en: "One favourable of four equally likely: 1/4 = 0.25. 0.75 answers NOT-red; 4 counts sectors instead of chance.",
          hi: "चार समसंभाव्य में एक अनुकूल: 1/4 = 0.25। 0.75 'लाल नहीं' का उत्तर है; 4 संयोग की जगह खंड गिनता है।",
          mr: "चार समसंभाव्यांत एक अनुकूल: 1/4 = 0.25. 0.75 'लाल नाही'चे उत्तर; 4 शक्यतेऐवजी भाग मोजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the class interval 20–30, which number is the LOWER class limit?",
          hi: "वर्ग-अंतराल 20–30 में निचली वर्ग-सीमा कौन-सी संख्या है?",
          mr: "वर्ग-अंतर 20–30 मध्ये खालची वर्ग-मर्यादा कोणती संख्या?",
        },
        answer: 20,
        wrong: [30, 25, 10],
        solution: {
          en: "The interval runs from 20 up to (but not including) 30: lower limit 20, upper 30, width 10. 25 is only the midpoint.",
          hi: "अंतराल 20 से 30 (30 शामिल नहीं) तक चलता है: निचली सीमा 20, ऊपरी 30, चौड़ाई 10। 25 केवल मध्य-बिंदु है।",
          mr: "अंतर 20 पासून 30 पर्यंत (30 वगळून) चालते: खालची मर्यादा 20, वरची 30, रुंदी 10. 25 फक्त मध्यबिंदू.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the width of the class interval 15–20?",
          hi: "वर्ग-अंतराल 15–20 की चौड़ाई कितनी है?",
          mr: "वर्ग-अंतर 15–20 ची रुंदी किती?",
        },
        answer: 5,
        wrong: [15, 20, 35],
        checkExpr: "20-15",
        solution: {
          en: "Width = upper limit − lower limit = 20 − 15 = 5. 35 ADDS the limits — the interval is a distance, not a sum.",
          hi: "चौड़ाई = ऊपरी सीमा − निचली सीमा = 20 − 15 = 5। 35 सीमाएँ जोड़ देता है — अंतराल दूरी है, योग नहीं।",
          mr: "रुंदी = वरची मर्यादा − खालची मर्यादा = 20 − 15 = 5. 35 मर्यादा जोडतो — अंतर हे अंतर आहे, बेरीज नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A family spends half its income on food. On the expense pie chart, what angle does the food slice get?",
          hi: "एक परिवार आधी आय भोजन पर ख़र्चता है। ख़र्च के पाई चार्ट में भोजन की फाँक को कितना कोण मिलेगा?",
          mr: "एक कुटुंब अर्धे उत्पन्न अन्नावर खर्चते. खर्चाच्या पाय चार्टमध्ये अन्नाच्या फोडीला किती कोन मिळेल?",
        },
        answer: 180,
        wrong: [90, 120, 200],
        checkExpr: "360/2",
        fmt: deg,
        solution: {
          en: "Half the money takes half the circle: 360 ÷ 2 = 180°. 90 gives food only a quarter — an underfed chart.",
          hi: "आधा पैसा आधा वृत्त लेता है: 360 ÷ 2 = 180°। 90 भोजन को चौथाई ही देता है — अधपेट चार्ट।",
          mr: "अर्धा पैसा अर्धे वर्तुळ घेतो: 360 ÷ 2 = 180°. 90 अन्नाला पावच देतो — अर्धपोटी चार्ट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Two coins are tossed together. How many outcomes are possible in all?",
          hi: "दो सिक्के एक साथ उछाले जाते हैं। कुल कितने परिणाम संभव हैं?",
          mr: "दोन नाणी एकत्र उडवली जातात. एकूण किती निकाल शक्य आहेत?",
        },
        answer: 4,
        wrong: [2, 3, 8],
        checkExpr: "2*2",
        solution: {
          en: "Each coin has 2 faces, and choices multiply: 2 × 2 = 4 (HH, HT, TH, TT). 3 forgets that HT and TH differ.",
          hi: "हर सिक्के के 2 पहलू, और विकल्प गुणा होते हैं: 2 × 2 = 4 (चित-चित, चित-पट, पट-चित, पट-पट)। 3 भूल जाता है कि चित-पट और पट-चित अलग हैं।",
          mr: "प्रत्येक नाण्याला 2 बाजू, आणि पर्याय गुणले जातात: 2 × 2 = 4 (छा-छा, छा-का, का-छा, का-का). 3 विसरतो की छा-का आणि का-छा वेगळे.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "Cards numbered 1 to 10 lie in a box. One is drawn blind. What is the probability it is a multiple of 3, as a decimal?",
          hi: "1 से 10 तक अंकित पत्ते डिब्बे में हैं। बिना देखे एक निकाला। उसके 3 के गुणज होने की प्रायिकता दशमलव में?",
          mr: "1 ते 10 आकडे असलेली पाने खोक्यात आहेत. न पाहता एक काढले. ते 3 चा पट असण्याची संभाव्यता दशांशात?",
        },
        answer: 0.3,
        wrong: [0.33, 0.1, 0.7],
        checkExpr: "3/10",
        solution: {
          en: "Multiples of 3 up to 10 are 3, 6, 9 — three of ten cards: 0.3. 0.33 divides by 9 as if the box ended there.",
          hi: "10 तक 3 के गुणज हैं 3, 6, 9 — दस में से तीन पत्ते: 0.3। 0.33 नौ से भाग देता है मानो डिब्बा वहीं ख़त्म हो।",
          mr: "10 पर्यंत 3 चे पट आहेत 3, 6, 9 — दहापैकी तीन पाने: 0.3. 0.33 नऊने भागतो जणू खोका तिथेच संपला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A pie chart surveys 720 students; the science slice spans 120°. How many students chose science?",
          hi: "पाई चार्ट में 720 विद्यार्थी हैं; विज्ञान की फाँक 120° की है। कितनों ने विज्ञान चुना?",
          mr: "पाय चार्टमध्ये 720 विद्यार्थी आहेत; विज्ञानाची फोड 120° ची आहे. किती जणांनी विज्ञान निवडले?",
        },
        answer: 240,
        wrong: [120, 360, 216],
        checkExpr: "720*120/360",
        solution: {
          en: "120° is a third of the circle, so a third of 720: 240 students. 120 repeats the angle as a headcount.",
          hi: "120° वृत्त की तिहाई है, अतः 720 की तिहाई: 240 विद्यार्थी। 120 कोण को ही गिनती बना देता है।",
          mr: "120° म्हणजे वर्तुळाचा तृतीयांश, म्हणून 720 चा तृतीयांश: 240 विद्यार्थी. 120 कोनालाच मोजणी करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Grouped marks: 0–10 has 4 students, 10–20 has 6, 20–30 has 10. How many scored BELOW 20?",
          hi: "समूहित अंक: 0–10 में 4 विद्यार्थी, 10–20 में 6, 20–30 में 10। 20 से नीचे कितनों ने पाया?",
          mr: "गटातील गुण: 0–10 मध्ये 4 विद्यार्थी, 10–20 मध्ये 6, 20–30 मध्ये 10. 20 च्या खाली किती जणांनी मिळवले?",
        },
        answer: 10,
        wrong: [6, 20, 16],
        checkExpr: "4+6",
        solution: {
          en: "Below 20 collects the first two groups: 4 + 6 = 10. 16 wrongly invites the 20–30 class in as well.",
          hi: "20 से नीचे पहले दो समूह आते हैं: 4 + 6 = 10। 16 ग़लती से 20–30 वाले वर्ग को भी बुला लेता है।",
          mr: "20 च्या खाली पहिले दोन गट येतात: 4 + 6 = 10. 16 चुकून 20–30 च्या वर्गालाही बोलावतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "A bag holds 4 red balls and 6 of other colours. What is the probability of NOT drawing red, as a decimal?",
          hi: "थैले में 4 लाल गेंदें और 6 अन्य रंगों की हैं। लाल न निकलने की प्रायिकता दशमलव में?",
          mr: "पिशवीत 4 लाल चेंडू आणि 6 इतर रंगांचे आहेत. लाल न निघण्याची संभाव्यता दशांशात?",
        },
        answer: 0.6,
        wrong: [0.4, 0.24, 0.66],
        checkExpr: "6/10",
        solution: {
          en: "Not-red means the other 6 of 10: 0.6 — or 1 − 0.4, the complement. 0.4 answers the opposite question.",
          hi: "लाल-नहीं यानी दस में से बाक़ी 6: 0.6 — या 1 − 0.4, पूरक। 0.4 उल्टे सवाल का जवाब है।",
          mr: "लाल-नाही म्हणजे दहापैकी उरलेले 6: 0.6 — किंवा 1 − 0.4, पूरक. 0.4 उलट्या प्रश्नाचे उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A budget pie: rent 25%, food 40%, and savings all the rest. What angle does the savings slice get?",
          hi: "बजट पाई: किराया 25%, भोजन 40%, और बचत बाक़ी सब। बचत की फाँक को कितना कोण मिलेगा?",
          mr: "अंदाजपत्रक पाय: भाडे 25%, अन्न 40%, आणि बचत उरलेले सारे. बचतीच्या फोडीला किती कोन मिळेल?",
        },
        answer: 126,
        wrong: [144, 90, 35],
        checkExpr: "35*360/100",
        fmt: deg,
        solution: {
          en: "Savings = 100 − 65 = 35%, and 35% of 360° is 126°. 35 stops at the percentage; 144 converts food's share instead.",
          hi: "बचत = 100 − 65 = 35%, और 360° का 35% है 126°। 35 प्रतिशत पर रुक जाता है; 144 उलटे भोजन का हिस्सा बदल देता है।",
          mr: "बचत = 100 − 65 = 35%, आणि 360° चे 35% म्हणजे 126°. 35 टक्केवारीवर थांबतो; 144 उलट अन्नाचा वाटा बदलतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "A weather app says 70% chance of rain, and the day stays dry. Before crying 'wrong!', compute the app's own chance of a dry day, as a decimal.",
          hi: "मौसम-ऐप 70% बारिश की संभावना कहता है, और दिन सूखा रहता है। 'ग़लत!' चिल्लाने से पहले, ऐप की ही सूखे दिन की संभावना दशमलव में निकालिए।",
          mr: "हवामान-अ‍ॅप 70% पावसाची शक्यता सांगते, आणि दिवस कोरडा राहतो. 'चूक!' ओरडण्याआधी, अ‍ॅपचीच कोरड्या दिवसाची शक्यता दशांशात काढा.",
        },
        answer: 0.3,
        wrong: [0.7, 0, 0.07],
        checkExpr: "3/10",
        solution: {
          en: "The app itself allowed a 30% dry day: 0.3. Three days in ten it EXPECTS this outcome — one dry day refutes nothing. Probabilities are judged over many days, never by one.",
          hi: "ऐप ने स्वयं 30% सूखा दिन माना था: 0.3। दस में तीन दिन वह यही नतीजा अपेक्षित रखता है — एक सूखा दिन कुछ नहीं झुठलाता। प्रायिकताएँ बहुत दिनों पर परखी जाती हैं, एक पर कभी नहीं।",
          mr: "अ‍ॅपने स्वतःच 30% कोरडा दिवस मानला होता: 0.3. दहांत तीन दिवस त्याला हाच निकाल अपेक्षित — एक कोरडा दिवस काहीच खोडत नाही. संभाव्यता अनेक दिवसांवर पारखली जाते, एकावर कधीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "In 100 tosses a coin showed heads 58 times. What is the EXPERIMENTAL probability of heads it earned, as a decimal?",
          hi: "100 उछालों में सिक्के ने 58 बार चित दिखाया। उसकी अर्जित प्रायोगिक प्रायिकता दशमलव में कितनी?",
          mr: "100 फेकींत नाण्याने 58 वेळा छापा दाखवला. त्याची मिळालेली प्रायोगिक संभाव्यता दशांशात किती?",
        },
        answer: 0.58,
        wrong: [0.5, 0.42, 5.8],
        checkExpr: "58/100",
        solution: {
          en: "Experimental probability = successes ÷ trials = 58/100 = 0.58. The theoretical 0.5 is where MORE tosses would drift it — experiment reports what happened, theory what should.",
          hi: "प्रायोगिक प्रायिकता = सफलताएँ ÷ प्रयास = 58/100 = 0.58। सैद्धांतिक 0.5 वह है जहाँ और उछालें उसे खींच लातीं — प्रयोग बताता है क्या हुआ, सिद्धांत क्या होना चाहिए।",
          mr: "प्रायोगिक संभाव्यता = यश ÷ प्रयत्न = 58/100 = 0.58. सैद्धान्तिक 0.5 तिथे आहे जिथे आणखी फेकी तिला ओढत नेतील — प्रयोग सांगतो काय झाले, सिद्धान्त काय व्हायला हवे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 5 — Data Handling",
      name: "Data Handling",
      slug: "maths-8-data-handling",
      summary:
        "Pies converting percent to degrees, grouped marks with honest limits, outcomes that multiply — and the 70%-rain day that stays dry without refuting anybody.",
      position: 5,
      translations: {
        hi: {
          name: "आँकड़ों का प्रबंधन",
          summary:
            "प्रतिशत को डिग्री में बदलती पाई, ईमानदार सीमाओं वाले समूहित अंक, गुणा होते परिणाम — और 70% बारिश वाला वह दिन जो सूखा रहकर भी किसी को नहीं झुठलाता।",
        },
        mr: {
          name: "माहितीचे व्यवस्थापन",
          summary:
            "टक्के अंशांत बदलणारे पाय, प्रामाणिक मर्यादांचे गटातील गुण, गुणले जाणारे निकाल — आणि 70% पावसाचा तो दिवस जो कोरडा राहूनही कोणाला खोडत नाही.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Squares and Square Roots (numbers and their shadows)          */
/* ------------------------------------------------------------------------- */
function squaresAndRoots(): TopicFileOut {
  const rand = rng("maths-8-squares-square-roots");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 15²?",
          hi: "15² कितना है?",
          mr: "15² किती?",
        },
        answer: 225,
        wrong: [30, 125, 255],
        checkExpr: "15*15",
        solution: {
          en: "15 × 15 = 225. 30 doubles instead of squaring — the classic first slip of the chapter.",
          hi: "15 × 15 = 225। 30 वर्ग की जगह दुगुना करता है — अध्याय की पहली मशहूर चूक।",
          mr: "15 × 15 = 225. 30 वर्गाऐवजी दुप्पट करतो — प्रकरणातली पहिली प्रसिद्ध चूक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is √81?",
          hi: "√81 कितना है?",
          mr: "√81 किती?",
        },
        answer: 9,
        wrong: [8, 18, 40.5],
        checkExpr: "81/9",
        solution: {
          en: "9 × 9 = 81, so the root is 9. 40.5 halves the number — a square root undoes squaring, not doubling.",
          hi: "9 × 9 = 81, अतः मूल 9। 40.5 संख्या को आधा करता है — वर्गमूल वर्ग को उलटता है, दुगुने को नहीं।",
          mr: "9 × 9 = 81, म्हणून मूळ 9. 40.5 संख्या निम्मी करतो — वर्गमूळ वर्ग उलटवते, दुपटीला नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the UNIT digit of 34²?",
          hi: "34² का इकाई अंक क्या है?",
          mr: "34² चा एकक अंक काय?",
        },
        answer: 6,
        wrong: [4, 8, 2],
        solution: {
          en: "Only the unit digit matters: 4² = 16, so the answer ends in 6. Squares can end only in 0, 1, 4, 5, 6 or 9.",
          hi: "केवल इकाई अंक मायने रखता है: 4² = 16, अतः उत्तर 6 पर ख़त्म। वर्ग केवल 0, 1, 4, 5, 6 या 9 पर ही ख़त्म हो सकते हैं।",
          mr: "फक्त एकक अंक महत्त्वाचा: 4² = 16, म्हणून उत्तर 6 वर संपते. वर्ग फक्त 0, 1, 4, 5, 6 वा 9 वरच संपू शकतात.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "√(49/64) = ▢/8. What is the numerator in the box?",
          hi: "√(49/64) = ▢/8। रिक्त में अंश क्या आएगा?",
          mr: "√(49/64) = ▢/8. रिकाम्यात अंश काय येईल?",
        },
        answer: 7,
        wrong: [49, 8, 6],
        solution: {
          en: "Root the top and bottom separately: √49 = 7 over √64 = 8. 49 forgets to take the root of the numerator at all.",
          hi: "ऊपर-नीचे अलग-अलग मूल लीजिए: √49 = 7 बटा √64 = 8। 49 अंश का मूल लेना ही भूल जाता है।",
          mr: "वर-खाली वेगवेगळे मूळ घ्या: √49 = 7 भागिले √64 = 8. 49 अंशाचे मूळ घ्यायलाच विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many non-square numbers lie strictly between 25² and 26²?",
          hi: "25² और 26² के बीच (दोनों छोड़कर) कितनी अवर्ग संख्याएँ हैं?",
          mr: "25² आणि 26² च्या मध्ये (दोन्ही वगळून) किती अवर्ग संख्या आहेत?",
        },
        answer: 50,
        wrong: [25, 51, 49],
        checkExpr: "2*25",
        solution: {
          en: "Between n² and (n+1)² lie exactly 2n numbers, none of them squares: 2 × 25 = 50. 51 counts one endpoint by mistake.",
          hi: "n² और (n+1)² के बीच ठीक 2n संख्याएँ होती हैं, कोई वर्ग नहीं: 2 × 25 = 50। 51 ग़लती से एक सिरा गिन लेता है।",
          mr: "n² आणि (n+1)² च्या मध्ये नेमक्या 2n संख्या असतात, एकही वर्ग नाही: 2 × 25 = 50. 51 चुकून एक टोक मोजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 12² − 11²?",
          hi: "12² − 11² कितना है?",
          mr: "12² − 11² किती?",
        },
        answer: 23,
        wrong: [1, 22, 24],
        checkExpr: "12*12-11*11",
        solution: {
          en: "Consecutive squares differ by their SUM: 12 + 11 = 23. Check: 144 − 121 = 23 ✓. 1 subtracts the bases instead.",
          hi: "क्रमागत वर्गों का अंतर उनका योग होता है: 12 + 11 = 23। जाँच: 144 − 121 = 23 ✓। 1 उलटे आधार घटा देता है।",
          mr: "क्रमागत वर्गांचा फरक त्यांची बेरीज असतो: 12 + 11 = 23. पडताळणी: 144 − 121 = 23 ✓. 1 उलट पाये वजा करतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "1296 = 2⁴ × 3⁴. Use the prime factors to find √1296.",
          hi: "1296 = 2⁴ × 3⁴। अभाज्य गुणनखंडों से √1296 निकालिए।",
          mr: "1296 = 2⁴ × 3⁴. मूळ अवयवांनी √1296 काढा.",
        },
        answer: 36,
        wrong: [34, 46, 24],
        checkExpr: "4*9",
        solution: {
          en: "Halve each exponent: √1296 = 2² × 3² = 4 × 9 = 36. Check: 36² = 1296 ✓ — pairing primes IS taking the root.",
          hi: "हर घात आधी कीजिए: √1296 = 2² × 3² = 4 × 9 = 36। जाँच: 36² = 1296 ✓ — अभाज्यों की जोड़ी बनाना ही मूल लेना है।",
          mr: "प्रत्येक घात निम्मी करा: √1296 = 2² × 3² = 4 × 9 = 36. पडताळणी: 36² = 1296 ✓ — मूळांच्या जोड्या करणे हेच मूळ काढणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The triplet recipe 2m, m² − 1, m² + 1 with m = 4 builds a Pythagorean triplet. What is its LARGEST member?",
          hi: "त्रिक-विधि 2m, m² − 1, m² + 1 में m = 4 रखने पर पाइथागोरसी त्रिक बनता है। उसका सबसे बड़ा सदस्य कौन-सा?",
          mr: "त्रिकूट-कृती 2m, m² − 1, m² + 1 मध्ये m = 4 ठेवल्यास पायथागोरसी त्रिकूट बनते. त्याचा सर्वांत मोठा सदस्य कोणता?",
        },
        answer: 17,
        wrong: [15, 16, 9],
        checkExpr: "4*4+1",
        solution: {
          en: "m = 4 gives 8, 15, 17 — and 8² + 15² = 64 + 225 = 289 = 17² ✓. The largest, m² + 1, is always the hypotenuse.",
          hi: "m = 4 से 8, 15, 17 — और 8² + 15² = 64 + 225 = 289 = 17² ✓। सबसे बड़ा, m² + 1, हमेशा कर्ण होता है।",
          mr: "m = 4 ने 8, 15, 17 — आणि 8² + 15² = 64 + 225 = 289 = 17² ✓. सर्वांत मोठा, m² + 1, नेहमी कर्ण असतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "72 = 2³ × 3². By what SMALLEST number must 72 be multiplied to become a perfect square?",
          hi: "72 = 2³ × 3²। 72 को किस छोटी-से-छोटी संख्या से गुणा करें कि वह पूर्ण वर्ग बन जाए?",
          mr: "72 = 2³ × 3². 72 ला कोणत्या लहानात लहान संख्येने गुणले असता तो पूर्ण वर्ग होईल?",
        },
        answer: 2,
        wrong: [3, 6, 8],
        solution: {
          en: "The 3² is already paired; the 2³ has one 2 unpartnered — supply it: 72 × 2 = 144 = 12². Squares demand every prime in pairs.",
          hi: "3² की जोड़ी बनी है; 2³ में एक 2 अकेला है — उसे साथी दीजिए: 72 × 2 = 144 = 12²। वर्ग हर अभाज्य को जोड़े में माँगते हैं।",
          mr: "3² ची जोडी झाली आहे; 2³ मध्ये एक 2 एकटा — त्याला जोडीदार द्या: 72 × 2 = 144 = 12². वर्ग प्रत्येक मूळ संख्या जोडीत मागतात.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "What is √6400?",
          hi: "√6400 कितना है?",
          mr: "√6400 किती?",
        },
        answer: 80,
        wrong: [800, 40, 320],
        checkExpr: "6400/80",
        solution: {
          en: "6400 = 64 × 100, so its root is 8 × 10 = 80. 800 keeps one zero too many — each PAIR of zeros yields one zero.",
          hi: "6400 = 64 × 100, अतः मूल 8 × 10 = 80। 800 एक शून्य ज़्यादा रखता है — शून्यों की हर जोड़ी एक शून्य देती है।",
          mr: "6400 = 64 × 100, म्हणून मूळ 8 × 10 = 80. 800 एक शून्य जास्त ठेवतो — शून्यांची प्रत्येक जोडी एक शून्य देते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A square garden has area 2025 m². How long is its side?",
          hi: "एक वर्गाकार बग़ीचे का क्षेत्रफल 2025 वर्ग मीटर है। उसकी भुजा कितनी लंबी है?",
          mr: "एका चौरस बागेचे क्षेत्रफळ 2025 चौ. मीटर आहे. तिची बाजू किती लांब?",
        },
        answer: 45,
        wrong: [35, 55, 405],
        checkExpr: "2025/45",
        solution: {
          en: "Side = √2025 = 45, since 45² = 2025. Estimate first: 40² = 1600 and 50² = 2500 bracket it, and the 5-ending seals 45.",
          hi: "भुजा = √2025 = 45, क्योंकि 45² = 2025। पहले अनुमान: 40² = 1600 और 50² = 2500 उसे घेरते हैं, और 5 का अंत 45 पक्का करता है।",
          mr: "बाजू = √2025 = 45, कारण 45² = 2025. आधी अंदाज: 40² = 1600 आणि 50² = 2500 त्याला वेढतात, आणि 5 चा शेवट 45 पक्का करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Add the first ten odd numbers: 1 + 3 + 5 + … + 19.",
          hi: "पहली दस विषम संख्याएँ जोड़िए: 1 + 3 + 5 + … + 19।",
          mr: "पहिल्या दहा विषम संख्या जोडा: 1 + 3 + 5 + … + 19.",
        },
        answer: 100,
        wrong: [90, 110, 55],
        checkExpr: "10*10",
        solution: {
          en: "The first n odd numbers always total n²: here 10² = 100. 55 sums 1 to 10 instead — the even numbers sneaked in.",
          hi: "पहली n विषम संख्याओं का योग सदा n²: यहाँ 10² = 100। 55 उलटे 1 से 10 जोड़ देता है — सम संख्याएँ चुपके से घुस गईं।",
          mr: "पहिल्या n विषम संख्यांची बेरीज नेहमी n²: इथे 10² = 100. 55 उलट 1 ते 10 जोडतो — सम संख्या हळूच शिरल्या.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "A general arranges 500 soldiers into the largest possible solid square. How many soldiers are LEFT OVER?",
          hi: "एक सेनापति 500 सैनिकों को यथासंभव बड़े ठोस वर्ग में सजाता है। कितने सैनिक बच जाते हैं?",
          mr: "एक सेनापती 500 सैनिकांना शक्य तितक्या मोठ्या भरीव चौरसात मांडतो. किती सैनिक उरतात?",
        },
        answer: 16,
        wrong: [25, 6, 22],
        checkExpr: "500-22*22",
        solution: {
          en: "22² = 484 fits inside 500 but 23² = 529 does not: the square takes 484 and leaves 500 − 484 = 16. 22 answers the row length, not the remainder.",
          hi: "22² = 484 500 में समाता है पर 23² = 529 नहीं: वर्ग 484 लेता है और 500 − 484 = 16 छोड़ता है। 22 पंक्ति की लंबाई बताता है, शेष नहीं।",
          mr: "22² = 484 500 मध्ये मावतो पण 23² = 529 नाही: चौरस 484 घेतो आणि 500 − 484 = 16 उरवतो. 22 रांगेची लांबी सांगतो, बाकी नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is √0.0081?",
          hi: "√0.0081 कितना है?",
          mr: "√0.0081 किती?",
        },
        answer: 0.09,
        wrong: [0.9, 0.003, 0.81],
        checkExpr: "9/100",
        solution: {
          en: "0.0081 = 81/10000, so the root is 9/100 = 0.09. Check: 0.09 × 0.09 = 0.0081 ✓. 0.9 forgets that four decimal places root to two.",
          hi: "0.0081 = 81/10000, अतः मूल 9/100 = 0.09। जाँच: 0.09 × 0.09 = 0.0081 ✓। 0.9 भूल जाता है कि चार दशमलव स्थान मूल में दो बनते हैं।",
          mr: "0.0081 = 81/10000, म्हणून मूळ 9/100 = 0.09. पडताळणी: 0.09 × 0.09 = 0.0081 ✓. 0.9 विसरतो की चार दशांश स्थाने मुळात दोन होतात.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "Could 2026 be a perfect square? Compute 45² and let the neighbourhood decide.",
          hi: "क्या 2026 पूर्ण वर्ग हो सकता है? 45² निकालिए और पड़ोस को ही फ़ैसला करने दीजिए।",
          mr: "2026 पूर्ण वर्ग असू शकेल का? 45² काढा आणि शेजारालाच निर्णय करू द्या.",
        },
        answer: 2025,
        wrong: [2026, 2020, 1925],
        checkExpr: "45*45",
        solution: {
          en: "45² = 2025 and 46² = 2116: 2026 falls strictly between consecutive squares, so it cannot be one. A number's neighbourhood convicts it without any factoring.",
          hi: "45² = 2025 और 46² = 2116: 2026 क्रमागत वर्गों के ठीक बीच पड़ता है, अतः वर्ग हो ही नहीं सकता। संख्या का पड़ोस बिना गुणनखंड के ही उसे दोषी ठहरा देता है।",
          mr: "45² = 2025 आणि 46² = 2116: 2026 क्रमागत वर्गांच्या नेमके मध्ये पडतो, म्हणून वर्ग असूच शकत नाही. संख्येचा शेजार अवयवांशिवायच तिला दोषी ठरवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is the LEAST number to subtract from 4000 so that a perfect square remains?",
          hi: "4000 में से कम-से-कम कितना घटाएँ कि पूर्ण वर्ग बच जाए?",
          mr: "4000 मधून किमान किती वजा केले असता पूर्ण वर्ग उरेल?",
        },
        answer: 31,
        wrong: [39, 21, 69],
        checkExpr: "4000-63*63",
        solution: {
          en: "The largest square below 4000 is 63² = 3969 (64² = 4096 overshoots): subtract 4000 − 3969 = 31. Find the floor of the root first; the remainder is the answer.",
          hi: "4000 से नीचे का सबसे बड़ा वर्ग 63² = 3969 (64² = 4096 पार निकल जाता है): घटाइए 4000 − 3969 = 31। पहले मूल का फ़र्श खोजिए; शेष ही उत्तर है।",
          mr: "4000 खालचा सर्वांत मोठा वर्ग 63² = 3969 (64² = 4096 ओलांडतो): वजा करा 4000 − 3969 = 31. आधी मुळाचा तळ शोधा; बाकी हेच उत्तर.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 6 — Squares and Square Roots",
      name: "Squares and Square Roots",
      slug: "maths-8-squares-square-roots",
      summary:
        "Primes paired into roots, odd numbers stacking into squares, a garden measured backwards — and 2026 convicted by its neighbourhood without a single factor taken.",
      position: 6,
      translations: {
        hi: {
          name: "वर्ग और वर्गमूल",
          summary:
            "जोड़ों में बँधे अभाज्य, वर्गों में चढ़ती विषम संख्याएँ, उल्टा नपा बग़ीचा — और 2026, जिसे उसके पड़ोस ने बिना एक गुणनखंड लिए दोषी ठहरा दिया।",
        },
        mr: {
          name: "वर्ग आणि वर्गमूळ",
          summary:
            "जोड्यांत बांधलेल्या मूळ संख्या, वर्गांत चढणाऱ्या विषम संख्या, उलटी मोजलेली बाग — आणि 2026, ज्याला त्याच्या शेजाराने एकही अवयव न घेता दोषी ठरवले.",
        },
      },
    },
    qs,
  );
}

export const G8_MATHS: TopicFileOut[] = [
  rationalNumbers8(),
  linearEquations8(),
  quadrilaterals8(),
  dataHandling8(),
  squaresAndRoots(),
];
