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
import { numQ, rupees } from "./numeric";

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

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Cubes and Cube Roots (three of everything)                    */
/* ------------------------------------------------------------------------- */
function cubesAndRoots(): TopicFileOut {
  const rand = rng("maths-8-cubes-cube-roots");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: { en: "What is 4³?", hi: "4³ कितना है?", mr: "4³ किती?" },
        answer: 64,
        wrong: [12, 16, 81],
        checkExpr: "4*4*4",
        solution: {
          en: "4 × 4 × 4 = 64. 12 multiplies by 3; 16 stops at the square — a cube needs the third factor.",
          hi: "4 × 4 × 4 = 64। 12 तीन से गुणा करता है; 16 वर्ग पर रुक जाता है — घन को तीसरा गुणनखंड चाहिए।",
          mr: "4 × 4 × 4 = 64. 12 तिघाने गुणतो; 16 वर्गावर थांबतो — घनाला तिसरा घटक हवा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: { en: "What is ∛27?", hi: "∛27 कितना है?", mr: "∛27 किती?" },
        answer: 3,
        wrong: [9, 6, 13.5],
        checkExpr: "27/9",
        solution: {
          en: "3 × 3 × 3 = 27, so the cube root is 3. 9 takes the SQUARE root's answer to a cube-root question.",
          hi: "3 × 3 × 3 = 27, अतः घनमूल 3। 9 घनमूल के सवाल पर वर्गमूल का उत्तर थमा देता है।",
          mr: "3 × 3 × 3 = 27, म्हणून घनमूळ 3. 9 घनमुळाच्या प्रश्नाला वर्गमुळाचे उत्तर देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the UNIT digit of 8³?",
          hi: "8³ का इकाई अंक क्या है?",
          mr: "8³ चा एकक अंक काय?",
        },
        answer: 2,
        wrong: [8, 4, 6],
        solution: {
          en: "8³ = 512, ending in 2. Cubes keep a strict ending-code: 2 and 8 swap endings, 3 and 7 swap — every digit is possible, each from one source.",
          hi: "8³ = 512, अंत 2 पर। घनों का अंत-कोड सख़्त है: 2 और 8 अंत बदलते हैं, 3 और 7 भी — हर अंक संभव है, हर एक का एक ही स्रोत।",
          mr: "8³ = 512, शेवट 2 वर. घनांचा शेवट-संकेत कडक: 2 आणि 8 शेवट बदलतात, 3 आणि 7 ही — प्रत्येक अंक शक्य, प्रत्येकाचा एकच स्रोत.",
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
          en: "Compute 1³ + 2³ + 3³.",
          hi: "1³ + 2³ + 3³ निकालिए।",
          mr: "1³ + 2³ + 3³ काढा.",
        },
        answer: 36,
        wrong: [6, 14, 25],
        checkExpr: "1+8+27",
        solution: {
          en: "1 + 8 + 27 = 36 — which is (1 + 2 + 3)² = 6², no accident: cube-sums always square the plain sum.",
          hi: "1 + 8 + 27 = 36 — जो (1 + 2 + 3)² = 6² है, संयोग नहीं: घन-योग सदा सीधे योग का वर्ग होते हैं।",
          mr: "1 + 8 + 27 = 36 — जे (1 + 2 + 3)² = 6² आहे, योगायोग नाही: घन-बेरजा नेहमी साध्या बेरजेचा वर्ग असतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: { en: "What is 11³?", hi: "11³ कितना है?", mr: "11³ किती?" },
        answer: 1331,
        wrong: [121, 1221, 1431],
        checkExpr: "11*11*11",
        solution: {
          en: "11² = 121, then × 11 = 1331. 121 stops a floor early — the cube lives one multiplication above the square.",
          hi: "11² = 121, फिर × 11 = 1331। 121 एक मंज़िल पहले रुक जाता है — घन वर्ग से एक गुणा ऊपर रहता है।",
          mr: "11² = 121, मग × 11 = 1331. 121 एक मजला आधी थांबतो — घन वर्गाहून एक गुणाकार वर राहतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "∛(64/125) = ▢/5. What is the numerator in the box?",
          hi: "∛(64/125) = ▢/5। रिक्त में अंश क्या आएगा?",
          mr: "∛(64/125) = ▢/5. रिकाम्यात अंश काय येईल?",
        },
        answer: 4,
        wrong: [8, 64, 3],
        solution: {
          en: "Root top and bottom separately: ∛64 = 4 over ∛125 = 5. 8 takes the square root of 64 by habit.",
          hi: "ऊपर-नीचे अलग मूल लीजिए: ∛64 = 4 बटा ∛125 = 5। 8 आदतन 64 का वर्गमूल ले बैठता है।",
          mr: "वर-खाली वेगळे मूळ घ्या: ∛64 = 4 भागिले ∛125 = 5. 8 सवयीने 64 चे वर्गमूळ घेतो.",
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
          en: "1729, the taxi-cab number, equals 10³ + 9³ and ALSO 12³ + 1³. Verify the second: compute 12³ + 1.",
          hi: "टैक्सी नंबर 1729 = 10³ + 9³ और साथ ही 12³ + 1³। दूसरा जाँचिए: 12³ + 1 निकालिए।",
          mr: "टॅक्सी क्रमांक 1729 = 10³ + 9³ आणि तसेच 12³ + 1³. दुसरे तपासा: 12³ + 1 काढा.",
        },
        answer: 1729,
        wrong: [1728, 1730, 1000],
        checkExpr: "12*12*12+1",
        solution: {
          en: "12³ = 1728, plus 1 = 1729 — the smallest number that is a sum of two cubes in TWO ways, spotted by Ramanujan from a hospital bed.",
          hi: "12³ = 1728, धन 1 = 1729 — दो घनों के योग के दो रूपों वाली सबसे छोटी संख्या, जिसे रामानुजन ने अस्पताल के बिस्तर से पहचाना।",
          mr: "12³ = 1728, अधिक 1 = 1729 — दोन घनांच्या बेरजेची दोन रूपे असलेली सर्वांत लहान संख्या, रामानुजनने रुग्णालयाच्या बिछान्यावरून ओळखलेली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "392 = 2³ × 7². By what SMALLEST number must 392 be multiplied to become a perfect cube?",
          hi: "392 = 2³ × 7²। 392 को किस छोटी-से-छोटी संख्या से गुणा करें कि पूर्ण घन बन जाए?",
          mr: "392 = 2³ × 7². 392 ला कोणत्या लहानात लहान संख्येने गुणले असता पूर्ण घन होईल?",
        },
        answer: 7,
        wrong: [2, 49, 14],
        solution: {
          en: "Cubes want primes in THREES: the 2s are a full triple, the 7s need one more — multiply by 7 to get 2744 = 14³. 49 supplies two 7s where one is missing.",
          hi: "घन अभाज्यों को तीन-तीन में माँगते हैं: दो की तिकड़ी पूरी है, सातों को एक और चाहिए — 7 से गुणा कर 2744 = 14³। 49 वहाँ दो 7 भेज देता है जहाँ एक की कमी थी।",
          mr: "घन मूळ संख्या तीन-तीनमध्ये मागतात: दोघांचे त्रिकूट पूर्ण, सातांना आणखी एक हवा — 7 ने गुणून 2744 = 14³. 49 एक कमी असताना दोन 7 पाठवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: { en: "What is ∛2197?", hi: "∛2197 कितना है?", mr: "∛2197 किती?" },
        answer: 13,
        wrong: [17, 12, 23],
        checkExpr: "2197/169",
        solution: {
          en: "13³ = 2197. Read the ending: 2197 ends in 7, and only 3-enders cube to 7-enders; the size pins the tens digit at 1.",
          hi: "13³ = 2197। अंत पढ़िए: 2197 का अंत 7 पर, और केवल 3-अंत वाले ही घन में 7-अंत देते हैं; आकार दहाई को 1 पर जड़ देता है।",
          mr: "13³ = 2197. शेवट वाचा: 2197 चा शेवट 7 वर, आणि फक्त 3-शेवटवालेच घनात 7-शेवट देतात; आकार दशकाला 1 वर ठरवतो.",
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
          en: "A cube has volume 512 cm³. How long is its edge?",
          hi: "एक घन का आयतन 512 घन सेमी है। उसका किनारा कितना लंबा है?",
          mr: "एका घनाचे घनफळ 512 घन सेमी आहे. त्याची कड किती लांब?",
        },
        answer: 8,
        wrong: [64, 6, 16],
        checkExpr: "512/64",
        solution: {
          en: "Edge = ∛512 = 8, since 8³ = 512. 64 answers the FACE's area; the edge is the cube root, not the square root.",
          hi: "किनारा = ∛512 = 8, क्योंकि 8³ = 512। 64 फलक का क्षेत्रफल बताता है; किनारा घनमूल है, वर्गमूल नहीं।",
          mr: "कड = ∛512 = 8, कारण 8³ = 512. 64 पृष्ठाचे क्षेत्रफळ सांगतो; कड घनमूळ आहे, वर्गमूळ नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "128 = 2⁷. By what smallest number must 128 be DIVIDED to leave a perfect cube?",
          hi: "128 = 2⁷। 128 को किस छोटी-से-छोटी संख्या से भाग दें कि पूर्ण घन बचे?",
          mr: "128 = 2⁷. 128 ला कोणत्या लहानात लहान संख्येने भागले असता पूर्ण घन उरेल?",
        },
        answer: 2,
        wrong: [4, 16, 8],
        solution: {
          en: "Seven 2s make two full triples with ONE left over: remove it. 128 ÷ 2 = 64 = 4³ ✓. Division trims the surplus; multiplication would need two more.",
          hi: "सात 2 से दो पूरी तिकड़ियाँ और एक बचा हुआ: उसे हटाइए। 128 ÷ 2 = 64 = 4³ ✓। भाग फ़ालतू छाँटता है; गुणा को दो और चाहिए होते।",
          mr: "सात 2 मधून दोन पूर्ण त्रिकुटे आणि एक उरलेला: तो काढा. 128 ÷ 2 = 64 = 4³ ✓. भागाकार जास्तीचे छाटतो; गुणाकाराला आणखी दोन लागले असते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many small cubes of edge 2 cm fit exactly inside a cube of edge 6 cm?",
          hi: "2 सेमी किनारे के कितने छोटे घन 6 सेमी किनारे के घन में ठीक-ठीक समाते हैं?",
          mr: "2 सेमी कडेचे किती छोटे घन 6 सेमी कडेच्या घनात नेमके मावतात?",
        },
        answer: 27,
        wrong: [9, 18, 36],
        checkExpr: "6*6*6/(2*2*2)",
        solution: {
          en: "Three fit along each edge, so 3 × 3 × 3 = 27 — or by volume, 216 ÷ 8 = 27. 9 fills only one face.",
          hi: "हर किनारे पर तीन समाते हैं, अतः 3 × 3 × 3 = 27 — या आयतन से, 216 ÷ 8 = 27। 9 केवल एक फलक भरता है।",
          mr: "प्रत्येक कडेवर तीन मावतात, म्हणून 3 × 3 × 3 = 27 — किंवा घनफळाने, 216 ÷ 8 = 27. 9 फक्त एक पृष्ठ भरतो.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: { en: "What is ∛0.001?", hi: "∛0.001 कितना है?", mr: "∛0.001 किती?" },
        answer: 0.1,
        wrong: [0.01, 0.3, 0.001],
        checkExpr: "1/10",
        solution: {
          en: "0.1 × 0.1 × 0.1 = 0.001 ✓. Three decimal places root to ONE — cube roots divide the decimal count by three.",
          hi: "0.1 × 0.1 × 0.1 = 0.001 ✓। तीन दशमलव स्थान मूल में एक बनते हैं — घनमूल दशमलव-गिनती को तीन से बाँटता है।",
          mr: "0.1 × 0.1 × 0.1 = 0.001 ✓. तीन दशांश स्थाने मुळात एक होतात — घनमूळ दशांश-मोजणीला तिघाने भागते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is 6³ − 5³?",
          hi: "6³ − 5³ कितना है?",
          mr: "6³ − 5³ किती?",
        },
        answer: 91,
        wrong: [1, 61, 121],
        checkExpr: "6*6*6-5*5*5",
        solution: {
          en: "216 − 125 = 91. Consecutive cubes pull apart fast — the gap here is 3 × 5 × 6 + 1, already close to a hundred by six.",
          hi: "216 − 125 = 91। क्रमागत घन तेज़ी से दूर छिटकते हैं — यहाँ अंतर 3 × 5 × 6 + 1 है, छह तक पहुँचते-पहुँचते सौ के पास।",
          mr: "216 − 125 = 91. क्रमागत घन वेगाने दूर जातात — इथला फरक 3 × 5 × 6 + 1, सहापर्यंतच शंभराजवळ.",
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
          en: "Can a perfect cube end in exactly TWO zeros? Compute 10³ and watch how zeros arrive.",
          hi: "क्या पूर्ण घन ठीक दो शून्यों पर ख़त्म हो सकता है? 10³ निकालिए और देखिए शून्य कैसे आते हैं।",
          mr: "पूर्ण घन नेमक्या दोन शून्यांवर संपू शकतो का? 10³ काढा आणि शून्ये कशी येतात ते पाहा.",
        },
        answer: 1000,
        wrong: [100, 10000, 110],
        checkExpr: "10*10*10",
        solution: {
          en: "10³ = 1000: each factor of 10 brings its zero, so cube-zeros arrive in THREES. A cube may end in 000 or 000000 — never in exactly 00.",
          hi: "10³ = 1000: दस का हर गुणनखंड अपना शून्य लाता है, अतः घन-शून्य तीन-तीन में आते हैं। घन 000 या 000000 पर ख़त्म हो सकता है — ठीक 00 पर कभी नहीं।",
          mr: "10³ = 1000: दहाचा प्रत्येक घटक आपले शून्य आणतो, म्हणून घन-शून्ये तीन-तीनमध्ये येतात. घन 000 वा 000000 वर संपू शकतो — नेमक्या 00 वर कधीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A 3-cm cube is painted all over, then cut into 1-cm cubes. How many small cubes carry NO paint at all?",
          hi: "3 सेमी का घन चारों ओर रँगा जाता है, फिर 1-1 सेमी के घनों में कटता है। कितने छोटे घनों पर बिलकुल रंग नहीं?",
          mr: "3 सेमीचा घन सर्व बाजूंनी रंगवला जातो, मग 1-1 सेमीच्या घनांत कापला जातो. किती छोट्या घनांवर मुळीच रंग नाही?",
        },
        answer: 1,
        wrong: [0, 6, 8],
        checkExpr: "1*1*1",
        solution: {
          en: "Only the hidden core escapes the brush: (3 − 2)³ = 1 cube, the very centre. 8 counts the corners — they carry paint on THREE faces each.",
          hi: "कूची से केवल छिपा हुआ भीतरी भाग बचता है: (3 − 2)³ = 1 घन, ठीक केंद्र वाला। 8 कोने गिनता है — उन पर तो तीन-तीन फलकों पर रंग है।",
          mr: "कुंचल्यापासून फक्त लपलेला गाभा वाचतो: (3 − 2)³ = 1 घन, नेमका मधला. 8 कोपरे मोजतो — त्यांवर तर तीन-तीन पृष्ठांवर रंग आहे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 7 — Cubes and Cube Roots",
      name: "Cubes and Cube Roots",
      slug: "maths-8-cubes-cube-roots",
      summary:
        "Primes demanded in threes, Ramanujan's taxi number verified by hand, zeros arriving only in triples — and the one unpainted cube hiding at the centre.",
      position: 7,
      translations: {
        hi: {
          name: "घन और घनमूल",
          summary:
            "तीन-तीन में माँगे गए अभाज्य, हाथ से जाँचा रामानुजन का टैक्सी नंबर, केवल तिकड़ियों में आते शून्य — और केंद्र में छिपा वह एक बिना रंग का घन।",
        },
        mr: {
          name: "घन आणि घनमूळ",
          summary:
            "तीन-तीनमध्ये मागितलेल्या मूळ संख्या, हाताने तपासलेला रामानुजनचा टॅक्सी क्रमांक, फक्त त्रिकुटांत येणारी शून्ये — आणि केंद्रात लपलेला तो एक रंगहीन घन.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Comparing Quantities (discount, tax and compound interest)    */
/* ------------------------------------------------------------------------- */
function comparingQuantities8(): TopicFileOut {
  const rand = rng("maths-8-comparing-quantities");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A shirt is marked ₹500 and carries a 10% discount. What is the selling price?",
          hi: "एक क़मीज़ पर अंकित मूल्य ₹500 और छूट 10% है। विक्रय-मूल्य कितना?",
          mr: "एका सदऱ्यावर छापील किंमत ₹500 आणि सूट 10% आहे. विक्री-किंमत किती?",
        },
        answer: 450,
        wrong: [50, 490, 550],
        checkExpr: "500-500*10/100",
        fmt: rupees,
        solution: {
          en: "The discount is ₹50 off the MARKED price: 500 − 50 = ₹450. 50 stops at the discount itself; 550 adds it on.",
          hi: "छूट अंकित मूल्य पर ₹50 है: 500 − 50 = ₹450। 50 छूट पर ही रुक जाता है; 550 उसे जोड़ देता है।",
          mr: "सूट छापील किमतीवर ₹50 आहे: 500 − 50 = ₹450. 50 सुटीवरच थांबतो; 550 ती मिळवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 8% of ₹1500?",
          hi: "₹1500 का 8% कितना है?",
          mr: "₹1500 चे 8% किती?",
        },
        answer: 120,
        wrong: [12, 187.5, 1200],
        checkExpr: "1500*8/100",
        fmt: rupees,
        solution: {
          en: "1% of 1500 is 15, so 8% is 15 × 8 = ₹120. 12 slips a place; 1200 forgets the percent sign entirely.",
          hi: "1500 का 1% है 15, अतः 8% है 15 × 8 = ₹120। 12 एक स्थान फिसल जाता है; 1200 प्रतिशत-चिह्न ही भूल जाता है।",
          mr: "1500 चा 1% म्हणजे 15, म्हणून 8% म्हणजे 15 × 8 = ₹120. 12 एक घर घसरतो; 1200 टक्के-चिन्हच विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two quantities stand in the ratio 3 : 5. What percentage of the WHOLE is the first?",
          hi: "दो राशियाँ 3 : 5 के अनुपात में हैं। पूरे का कितना प्रतिशत पहली है?",
          mr: "दोन राशी 3 : 5 या गुणोत्तरात आहेत. संपूर्णाच्या किती टक्के पहिली आहे?",
        },
        answer: 37.5,
        wrong: [60, 62.5, 30],
        checkExpr: "3*100/8",
        fmt: pct,
        solution: {
          en: "The whole holds 3 + 5 = 8 parts; the first takes 3/8 = 37.5%. 60 divides 3 by 5 — by the partner instead of the whole.",
          hi: "पूरे में 3 + 5 = 8 भाग; पहली लेती है 3/8 = 37.5%। 60 तीन को 5 से भाग देता है — पूरे की जगह साथी से।",
          mr: "संपूर्णात 3 + 5 = 8 भाग; पहिली घेते 3/8 = 37.5%. 60 तिघाला 5 ने भागतो — संपूर्णाऐवजी जोडीदाराने.",
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
          en: "An article costing ₹1200 is sold at a 15% profit. What is the selling price?",
          hi: "₹1200 लागत की वस्तु 15% लाभ पर बेची जाती है। विक्रय-मूल्य कितना?",
          mr: "₹1200 किमतीची वस्तू 15% नफ्याने विकली जाते. विक्री-किंमत किती?",
        },
        answer: 1380,
        wrong: [180, 1215, 1020],
        checkExpr: "1200+1200*15/100",
        fmt: rupees,
        solution: {
          en: "The profit is 15% of 1200 = ₹180, so SP = 1200 + 180 = ₹1380. 1020 subtracts — that would be a LOSS of 15%.",
          hi: "लाभ = 1200 का 15% = ₹180, अतः विक्रय-मूल्य = 1200 + 180 = ₹1380। 1020 घटा देता है — वह तो 15% की हानि होती।",
          mr: "नफा = 1200 चे 15% = ₹180, म्हणून विक्री-किंमत = 1200 + 180 = ₹1380. 1020 वजा करतो — तो तर 15% चा तोटा झाला असता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A bill of ₹640 attracts 5% sales tax. What is the total to pay?",
          hi: "₹640 के बिल पर 5% बिक्री-कर लगता है। कुल कितना चुकाना होगा?",
          mr: "₹640 च्या बिलावर 5% विक्रीकर लागतो. एकूण किती द्यावे लागतील?",
        },
        answer: 672,
        wrong: [32, 645, 608],
        checkExpr: "640+640*5/100",
        fmt: rupees,
        solution: {
          en: "Tax = 5% of 640 = ₹32, total 640 + 32 = ₹672. 608 subtracts the tax — the government does not pay you.",
          hi: "कर = 640 का 5% = ₹32, कुल 640 + 32 = ₹672। 608 कर घटा देता है — सरकार आपको नहीं चुकाती।",
          mr: "कर = 640 चे 5% = ₹32, एकूण 640 + 32 = ₹672. 608 कर वजा करतो — सरकार तुम्हाला देत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Marked ₹800, sold at ₹720. What is the discount per cent?",
          hi: "अंकित ₹800, बिकी ₹720 में। छूट प्रतिशत कितनी?",
          mr: "छापील ₹800, विकली ₹720 ला. सूट शेकडा किती?",
        },
        answer: 10,
        wrong: [80, 11, 8],
        checkExpr: "(800-720)*100/800",
        fmt: pct,
        solution: {
          en: "The cut of ₹80 stands on the MARKED 800: 80/800 = 10%. 11 divides by the selling price — discounts are always measured on the tag.",
          hi: "₹80 की कटौती अंकित 800 पर खड़ी है: 80/800 = 10%। 11 विक्रय-मूल्य से भाग देता है — छूट सदा टैग पर नपती है।",
          mr: "₹80 ची कपात छापील 800 वर उभी आहे: 80/800 = 10%. 11 विक्री-किमतीने भागतो — सूट नेहमी टॅगवर मोजली जाते.",
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
          en: "₹10,000 sits at 10% per annum. How much interest does COMPOUND interest give in the FIRST year?",
          hi: "₹10,000 पर 10% वार्षिक दर है। चक्रवृद्धि ब्याज पहले वर्ष में कितना देता है?",
          mr: "₹10,000 वर 10% वार्षिक दर आहे. चक्रवाढ व्याज पहिल्या वर्षात किती देते?",
        },
        answer: 1000,
        wrong: [1100, 100, 10000],
        checkExpr: "10000*10/100",
        fmt: rupees,
        solution: {
          en: "In year one there is no old interest to compound: CI = SI = ₹1000. The two roads split only from the SECOND year.",
          hi: "पहले वर्ष में जोड़ने को कोई पुराना ब्याज नहीं: चक्रवृद्धि = साधारण = ₹1000। दोनों राहें दूसरे वर्ष से ही अलग होती हैं।",
          mr: "पहिल्या वर्षात चक्रवाढीला जुने व्याज नाही: चक्रवाढ = सरळ = ₹1000. दोन वाटा दुसऱ्या वर्षापासूनच वेगळ्या होतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "₹8000 is lent at 10% per annum, compounded annually. What AMOUNT stands after 2 years?",
          hi: "₹8000 10% वार्षिक चक्रवृद्धि पर दिए गए। 2 वर्ष बाद मिश्रधन कितना होगा?",
          mr: "₹8000 10% वार्षिक चक्रवाढीने दिले. 2 वर्षांनी रास किती होईल?",
        },
        answer: 9680,
        wrong: [9600, 1680, 8800],
        checkExpr: "8000*121/100",
        fmt: rupees,
        solution: {
          en: "Two 10% steps: 8000 → 8800 → 9680, i.e. 8000 × 1.1² = 8000 × 121/100. 9600 is the SIMPLE-interest amount, missing the ₹80 earned on interest.",
          hi: "दो 10% सीढ़ियाँ: 8000 → 8800 → 9680, यानी 8000 × 1.1² = 8000 × 121/100। 9600 साधारण ब्याज का मिश्रधन है, ब्याज पर कमाए ₹80 से वंचित।",
          mr: "दोन 10% पायऱ्या: 8000 → 8800 → 9680, म्हणजे 8000 × 1.1² = 8000 × 121/100. 9600 ही सरळ व्याजाची रास, व्याजावर कमावलेल्या ₹80 ला मुकलेली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Successive discounts of 20% and then 10% act on a ₹1000 tag. What is the final price?",
          hi: "₹1000 के टैग पर 20% और फिर 10% की उत्तरोत्तर छूटें लगती हैं। अंतिम दाम कितना?",
          mr: "₹1000 च्या टॅगवर 20% आणि मग 10% च्या क्रमवार सुटी लागतात. अंतिम किंमत किती?",
        },
        answer: 720,
        wrong: [700, 300, 730],
        checkExpr: "1000*80*90/(100*100)",
        fmt: rupees,
        solution: {
          en: "1000 → 800 after 20%, then 10% off 800 → 720. 700 adds the discounts to 30% — but the second cut works on a smaller price.",
          hi: "1000 → 20% के बाद 800, फिर 800 पर 10% → 720। 700 छूटें जोड़कर 30% बना देता है — पर दूसरी कटौती छोटे दाम पर चलती है।",
          mr: "1000 → 20% नंतर 800, मग 800 वर 10% → 720. 700 सुटी जोडून 30% करतो — पण दुसरी कपात लहान किमतीवर चालते.",
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
          en: "A town of 20,000 grows 5% in a year. What is its population after one year?",
          hi: "20,000 का क़स्बा साल में 5% बढ़ता है। एक वर्ष बाद जनसंख्या कितनी?",
          mr: "20,000 चे गाव वर्षात 5% वाढते. एका वर्षानंतर लोकसंख्या किती?",
        },
        answer: 21000,
        wrong: [1000, 25000, 20005],
        checkExpr: "20000*105/100",
        solution: {
          en: "Growth adds 5% of 20000 = 1000: population 21,000. Growth compounds like interest — next year's 5% will stand on 21,000.",
          hi: "वृद्धि 20000 का 5% = 1000 जोड़ती है: जनसंख्या 21,000। वृद्धि ब्याज की तरह चक्रवृद्धि होती है — अगले साल का 5% 21,000 पर खड़ा होगा।",
          mr: "वाढ 20000 चे 5% = 1000 जोडते: लोकसंख्या 21,000. वाढ व्याजासारखी चक्रवाढते — पुढच्या वर्षीचे 5% 21,000 वर उभे राहील.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "GST of 18% applies to a ₹2500 service. How much is the TAX alone?",
          hi: "₹2500 की सेवा पर 18% जीएसटी लगता है। अकेला कर कितना?",
          mr: "₹2500 च्या सेवेवर 18% जीएसटी लागतो. एकटा कर किती?",
        },
        answer: 450,
        wrong: [45, 2950, 418],
        checkExpr: "2500*18/100",
        fmt: rupees,
        solution: {
          en: "18% of 2500 = 25 × 18 = ₹450. 2950 answers the whole bill; the question asked for the tax slice only.",
          hi: "2500 का 18% = 25 × 18 = ₹450। 2950 पूरा बिल बताता है; सवाल केवल कर का हिस्सा पूछ रहा था।",
          mr: "2500 चे 18% = 25 × 18 = ₹450. 2950 सारे बिल सांगतो; प्रश्न फक्त कराचा वाटा विचारत होता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the compound INTEREST on ₹5000 at 10% per annum for 2 years?",
          hi: "₹5000 पर 10% वार्षिक दर से 2 वर्ष का चक्रवृद्धि ब्याज कितना?",
          mr: "₹5000 वर 10% वार्षिक दराने 2 वर्षांचे चक्रवाढ व्याज किती?",
        },
        answer: 1050,
        wrong: [1000, 500, 1100],
        checkExpr: "5000*21/100",
        fmt: rupees,
        solution: {
          en: "Two years of 10% compound to 21%: interest = 5000 × 21/100 = ₹1050. 1000 is simple interest — the missing ₹50 grew ON the first year's ₹500.",
          hi: "10% के दो वर्ष चक्रवृद्धि में 21% बनते हैं: ब्याज = 5000 × 21/100 = ₹1050। 1000 साधारण ब्याज है — छूटे ₹50 पहले वर्ष के ₹500 पर उगे थे।",
          mr: "10% ची दोन वर्षे चक्रवाढीत 21% होतात: व्याज = 5000 × 21/100 = ₹1050. 1000 सरळ व्याज — हरवलेले ₹50 पहिल्या वर्षाच्या ₹500 वर उगवले होते.",
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
          en: "A cycle marked ₹3600 sells for ₹3060. What discount per cent was given?",
          hi: "₹3600 अंकित साइकिल ₹3060 में बिकी। कितने प्रतिशत छूट दी गई?",
          mr: "₹3600 छापील सायकल ₹3060 ला विकली. किती टक्के सूट दिली?",
        },
        answer: 15,
        wrong: [12, 18, 540],
        checkExpr: "(3600-3060)*100/3600",
        fmt: pct,
        solution: {
          en: "The cut is ₹540 on a tag of ₹3600: 540/3600 = 15%. 540 is the rupee discount left unconverted.",
          hi: "कटौती ₹3600 के टैग पर ₹540 है: 540/3600 = 15%। 540 रुपये की छूट है, प्रतिशत में बदले बिना।",
          mr: "कपात ₹3600 च्या टॅगवर ₹540 आहे: 540/3600 = 15%. 540 ही रुपयांतली सूट, टक्क्यांत न बदललेली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A machine worth ₹50,000 depreciates 10% each year. What is its value after 2 years?",
          hi: "₹50,000 की मशीन हर वर्ष 10% मूल्य खोती है। 2 वर्ष बाद उसका मूल्य कितना?",
          mr: "₹50,000 चे यंत्र दरवर्षी 10% किंमत गमावते. 2 वर्षांनी त्याची किंमत किती?",
        },
        answer: 40500,
        wrong: [45000, 40000, 30000],
        checkExpr: "50000*81/100",
        fmt: rupees,
        solution: {
          en: "Two 10% falls: 50000 → 45000 → 40500, i.e. × 0.9² = 81%. 40000 subtracts 10% twice from the ORIGINAL — depreciation compounds downhill too.",
          hi: "दो 10% गिरावटें: 50000 → 45000 → 40500, यानी × 0.9² = 81%। 40000 मूल से दो बार 10% घटाता है — मूल्य-ह्रास भी ढलान पर चक्रवृद्धि चलता है।",
          mr: "दोन 10% घसरणी: 50000 → 45000 → 40500, म्हणजे × 0.9² = 81%. 40000 मुळातून दोनदा 10% वजा करतो — घसाराही उतारावर चक्रवाढतो.",
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
          en: "Two offers on a ₹400 kurta: a single 25% discount, or 15% followed by 10%. Compute the price under the 15%-then-10% offer.",
          hi: "₹400 के कुर्ते पर दो पेशकश: अकेली 25% छूट, या 15% फिर 10%। 15%-फिर-10% वाली पेशकश का दाम निकालिए।",
          mr: "₹400 च्या कुर्त्यावर दोन सवलती: एकटी 25% सूट, किंवा 15% मग 10%. 15%-मग-10% च्या सवलतीची किंमत काढा.",
        },
        answer: 306,
        wrong: [300, 310, 294],
        checkExpr: "400*85*90/(100*100)",
        fmt: rupees,
        solution: {
          en: "400 → 340 after 15%, then 10% off 340 → ₹306. The single 25% gives ₹300 — the 'equal-sounding' split offer keeps ₹6 more with the shop, because its second cut bites a smaller number.",
          hi: "400 → 15% के बाद 340, फिर 340 पर 10% → ₹306। अकेली 25% देती है ₹300 — 'बराबर-सी लगती' बँटी पेशकश दुकान के पास ₹6 ज़्यादा छोड़ती है, क्योंकि उसकी दूसरी कटौती छोटी संख्या को काटती है।",
          mr: "400 → 15% नंतर 340, मग 340 वर 10% → ₹306. एकटी 25% देते ₹300 — 'सारखी वाटणारी' विभागलेली सवलत दुकानाकडे ₹6 जास्त ठेवते, कारण तिची दुसरी कपात लहान संख्येला कापते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "₹10,000 at 10% p.a. for 2 years: by how much does COMPOUND interest beat SIMPLE interest?",
          hi: "₹10,000 पर 10% वार्षिक, 2 वर्ष: चक्रवृद्धि ब्याज साधारण ब्याज से कितने से आगे रहता है?",
          mr: "₹10,000 वर 10% वार्षिक, 2 वर्षे: चक्रवाढ व्याज सरळ व्याजाहून कितीने पुढे राहते?",
        },
        answer: 100,
        wrong: [0, 210, 1000],
        checkExpr: "10000*21/100-10000*20/100",
        fmt: rupees,
        solution: {
          en: "CI = ₹2100, SI = ₹2000: the gap is ₹100 — exactly 10% of the first year's ₹1000 interest. The entire difference is interest earned ON interest; that one idea is the whole chapter.",
          hi: "चक्रवृद्धि = ₹2100, साधारण = ₹2000: अंतर ₹100 — ठीक पहले वर्ष के ₹1000 ब्याज का 10%। पूरा फ़र्क़ ब्याज पर कमाया ब्याज है; यही एक विचार पूरा अध्याय है।",
          mr: "चक्रवाढ = ₹2100, सरळ = ₹2000: फरक ₹100 — नेमके पहिल्या वर्षाच्या ₹1000 व्याजाचे 10%. सारा फरक म्हणजे व्याजावर कमावलेले व्याज; हीच एक कल्पना म्हणजे अख्खे प्रकरण.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 8 — Comparing Quantities",
      name: "Comparing Quantities",
      slug: "maths-8-comparing-quantities",
      summary:
        "Discounts measured on the tag, taxes added not subtracted, growth and decay both compounding — and the ₹100 gap that is nothing but interest earned on interest.",
      position: 8,
      translations: {
        hi: {
          name: "राशियों की तुलना",
          summary:
            "टैग पर नपी छूटें, जुड़ते (घटते नहीं) कर, चक्रवृद्धि से बढ़ती-घटती राशियाँ — और वह ₹100 का अंतर जो ब्याज पर कमाए ब्याज के सिवा कुछ नहीं।",
        },
        mr: {
          name: "राशींची तुलना",
          summary:
            "टॅगवर मोजलेल्या सुटी, वजा नव्हे तर जुळणारे कर, चक्रवाढीने वाढणाऱ्या-घटणाऱ्या राशी — आणि व्याजावर कमावलेल्या व्याजाशिवाय काहीही नसलेला तो ₹100 चा फरक.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Algebraic Expressions and Identities (patterns that compute)  */
/* ------------------------------------------------------------------------- */
function algebraicIdentities(): TopicFileOut {
  const rand = rng("maths-8-algebraic-identities");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the value of (a + b)² when a = 3 and b = 2?",
          hi: "a = 3 और b = 2 पर (a + b)² का मान कितना?",
          mr: "a = 3 आणि b = 2 असताना (a + b)² ची किंमत किती?",
        },
        answer: 25,
        wrong: [13, 10, 12],
        checkExpr: "5*5",
        solution: {
          en: "(3 + 2)² = 5² = 25. 13 computes a² + b² and drops the 2ab — the square of a sum is NOT the sum of squares.",
          hi: "(3 + 2)² = 5² = 25। 13 a² + b² निकालकर 2ab गिरा देता है — योग का वर्ग, वर्गों का योग नहीं होता।",
          mr: "(3 + 2)² = 5² = 25. 13 a² + b² काढून 2ab गाळतो — बेरजेचा वर्ग म्हणजे वर्गांची बेरीज नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "3x × 4x = ▢x². What is the coefficient in the box?",
          hi: "3x × 4x = ▢x²। रिक्त में गुणांक क्या आएगा?",
          mr: "3x × 4x = ▢x². रिकाम्यात सहगुणक काय येईल?",
        },
        answer: 12,
        wrong: [7, 34, 1],
        checkExpr: "3*4",
        solution: {
          en: "Coefficients multiply and the x's add powers: 3 × 4 = 12, x × x = x². 7 ADDS the coefficients as if the terms were being summed.",
          hi: "गुणांक गुणा होते हैं और x घातें जोड़ते हैं: 3 × 4 = 12, x × x = x²। 7 गुणांकों को यों जोड़ देता है मानो पद जुड़ रहे हों।",
          mr: "सहगुणक गुणले जातात आणि x घाती जोडतात: 3 × 4 = 12, x × x = x². 7 सहगुणक असे जोडतो जणू पदे जुळत आहेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the coefficient of x² in 5x² + 3x?",
          hi: "5x² + 3x में x² का गुणांक क्या है?",
          mr: "5x² + 3x मध्ये x² चा सहगुणक काय?",
        },
        answer: 5,
        wrong: [3, 8, 2],
        solution: {
          en: "The number riding x² is 5. 3 rides plain x, and 8 adds the two riders of different horses.",
          hi: "x² पर सवार संख्या 5 है। 3 सादे x पर सवार है, और 8 अलग-अलग घोड़ों के दो सवार जोड़ देता है।",
          mr: "x² वर स्वार संख्या 5 आहे. 3 साध्या x वर स्वार, आणि 8 वेगवेगळ्या घोड्यांचे दोन स्वार जोडतो.",
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
          en: "(x + 3)(x + 2) = x² + ▢x + 6. What number fills the box?",
          hi: "(x + 3)(x + 2) = x² + ▢x + 6। रिक्त में कौन-सी संख्या आएगी?",
          mr: "(x + 3)(x + 2) = x² + ▢x + 6. रिकाम्यात कोणती संख्या येईल?",
        },
        answer: 5,
        wrong: [6, 1, 9],
        checkExpr: "3+2",
        solution: {
          en: "The middle term collects both cross-products: 3x + 2x = 5x. 6 is the constant's job (3 × 2), already done at the end.",
          hi: "बीच का पद दोनों तिरछे गुणनफल बटोरता है: 3x + 2x = 5x। 6 अचर का काम है (3 × 2), जो अंत में हो ही चुका।",
          mr: "मधले पद दोन्ही तिरके गुणाकार गोळा करते: 3x + 2x = 5x. 6 हे स्थिरांकाचे काम (3 × 2), शेवटी झालेलेच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Use (100 + 2)² to compute 102².",
          hi: "(100 + 2)² से 102² निकालिए।",
          mr: "(100 + 2)² ने 102² काढा.",
        },
        answer: 10404,
        wrong: [10204, 10044, 10402],
        checkExpr: "100*100+2*100*2+4",
        solution: {
          en: "a² + 2ab + b² = 10000 + 400 + 4 = 10404. 10204 halves the middle term — the 2 in 2ab is not optional.",
          hi: "a² + 2ab + b² = 10000 + 400 + 4 = 10404। 10204 बीच का पद आधा कर देता है — 2ab का 2 वैकल्पिक नहीं है।",
          mr: "a² + 2ab + b² = 10000 + 400 + 4 = 10404. 10204 मधले पद निम्मे करतो — 2ab मधला 2 ऐच्छिक नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is (a − b)² when a = 10 and b = 1?",
          hi: "a = 10 और b = 1 पर (a − b)² कितना?",
          mr: "a = 10 आणि b = 1 असताना (a − b)² किती?",
        },
        answer: 81,
        wrong: [99, 101, 80],
        checkExpr: "9*9",
        solution: {
          en: "(10 − 1)² = 9² = 81 — or by identity, 100 − 20 + 1 = 81. 99 computes a² − b², a different identity's business.",
          hi: "(10 − 1)² = 9² = 81 — या सर्वसमिका से, 100 − 20 + 1 = 81। 99 a² − b² निकालता है, जो दूसरी सर्वसमिका का कारोबार है।",
          mr: "(10 − 1)² = 9² = 81 — किंवा नित्यसमीकरणाने, 100 − 20 + 1 = 81. 99 a² − b² काढतो, जो वेगळ्या नित्यसमीकरणाचा धंदा.",
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
          en: "Compute 98 × 102 using (100 − 2)(100 + 2).",
          hi: "(100 − 2)(100 + 2) से 98 × 102 निकालिए।",
          mr: "(100 − 2)(100 + 2) ने 98 × 102 काढा.",
        },
        answer: 9996,
        wrong: [9896, 10004, 9998],
        checkExpr: "100*100-4",
        solution: {
          en: "(a − b)(a + b) = a² − b² = 10000 − 4 = 9996 — a two-second multiplication. 10004 adds b² where the identity subtracts.",
          hi: "(a − b)(a + b) = a² − b² = 10000 − 4 = 9996 — दो सेकंड का गुणा। 10004 वहाँ b² जोड़ देता है जहाँ सर्वसमिका घटाती है।",
          mr: "(a − b)(a + b) = a² − b² = 10000 − 4 = 9996 — दोन सेकंदांचा गुणाकार. 10004 तिथे b² जोडतो जिथे नित्यसमीकरण वजा करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "(2x²)³ = ▢x⁶. What is the coefficient in the box?",
          hi: "(2x²)³ = ▢x⁶। रिक्त में गुणांक क्या आएगा?",
          mr: "(2x²)³ = ▢x⁶. रिकाम्यात सहगुणक काय येईल?",
        },
        answer: 8,
        wrong: [6, 2, 12],
        checkExpr: "2*2*2",
        solution: {
          en: "The cube hits BOTH parts: 2³ = 8 and (x²)³ = x⁶. 6 multiplies 2 × 3 — exponents on coefficients are powers, not products.",
          hi: "घन दोनों हिस्सों पर लगता है: 2³ = 8 और (x²)³ = x⁶। 6 2 × 3 गुणा करता है — गुणांक की घातें घातें हैं, गुणनफल नहीं।",
          mr: "घन दोन्ही भागांवर लागतो: 2³ = 8 आणि (x²)³ = x⁶. 6 2 × 3 गुणतो — सहगुणकावरील घाती घाती असतात, गुणाकार नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Subtract 3a + 4b from 7a + 2b. What is the coefficient of b in the result?",
          hi: "7a + 2b में से 3a + 4b घटाइए। परिणाम में b का गुणांक क्या है?",
          mr: "7a + 2b मधून 3a + 4b वजा करा. निकालात b चा सहगुणक काय?",
        },
        answer: -2,
        wrong: [2, 6, -6],
        checkExpr: "2-4",
        solution: {
          en: "b's account: 2 − 4 = −2 (the a's give 4a). 2 forgets the sign; 6 ADDS the b's as if nothing were being subtracted.",
          hi: "b का हिसाब: 2 − 4 = −2 (a देते हैं 4a)। 2 चिह्न भूल जाता है; 6 b को यों जोड़ता है मानो घटाना था ही नहीं।",
          mr: "b चा हिशेब: 2 − 4 = −2 (a देतात 4a). 2 चिन्ह विसरतो; 6 b असे जोडतो जणू वजाबाकी नव्हतीच.",
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
          en: "Compute 51² − 49² the identity way.",
          hi: "51² − 49² सर्वसमिका की राह से निकालिए।",
          mr: "51² − 49² नित्यसमीकरणाच्या वाटेने काढा.",
        },
        answer: 200,
        wrong: [4, 100, 2],
        checkExpr: "51*51-49*49",
        solution: {
          en: "a² − b² = (a + b)(a − b) = 100 × 2 = 200 — no squaring needed. 4 squares the difference instead of using it.",
          hi: "a² − b² = (a + b)(a − b) = 100 × 2 = 200 — वर्ग करने की ज़रूरत ही नहीं। 4 अंतर का वर्ग कर बैठता है।",
          mr: "a² − b² = (a + b)(a − b) = 100 × 2 = 200 — वर्ग करण्याची गरजच नाही. 4 फरकाचा वर्ग करून बसतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If x + 1/x = 4, what is x² + 1/x²?",
          hi: "यदि x + 1/x = 4, तो x² + 1/x² कितना?",
          mr: "जर x + 1/x = 4, तर x² + 1/x² किती?",
        },
        answer: 14,
        wrong: [16, 18, 8],
        checkExpr: "16-2",
        solution: {
          en: "Square the given: (x + 1/x)² = x² + 2 + 1/x² = 16, so x² + 1/x² = 16 − 2 = 14. 16 forgets the 2 born from the cross-term.",
          hi: "दिए हुए का वर्ग: (x + 1/x)² = x² + 2 + 1/x² = 16, अतः x² + 1/x² = 16 − 2 = 14। 16 तिरछे पद से जन्मा 2 भूल जाता है।",
          mr: "दिलेल्याचा वर्ग: (x + 1/x)² = x² + 2 + 1/x² = 16, म्हणून x² + 1/x² = 16 − 2 = 14. 16 तिरक्या पदातून जन्मलेला 2 विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A rectangle's sides are (x + 5) and (x + 3). What is its area when x = 2?",
          hi: "आयत की भुजाएँ (x + 5) और (x + 3) हैं। x = 2 पर क्षेत्रफल कितना?",
          mr: "आयताच्या बाजू (x + 5) आणि (x + 3) आहेत. x = 2 असताना क्षेत्रफळ किती?",
        },
        answer: 35,
        wrong: [16, 30, 21],
        checkExpr: "7*5",
        solution: {
          en: "Substitute first: 7 × 5 = 35 — or expand to x² + 8x + 15 and get 4 + 16 + 15 = 35: both roads agree, as they must.",
          hi: "पहले मान रखिए: 7 × 5 = 35 — या फैलाकर x² + 8x + 15 से 4 + 16 + 15 = 35: दोनों राहें मिलती हैं, मिलनी ही चाहिए।",
          mr: "आधी किंमत ठेवा: 7 × 5 = 35 — किंवा विस्तारून x² + 8x + 15 मधून 4 + 16 + 15 = 35: दोन्ही वाटा जुळतात, जुळायलाच हव्यात.",
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
          en: "Compute 997 × 1003.",
          hi: "997 × 1003 निकालिए।",
          mr: "997 × 1003 काढा.",
        },
        answer: 999991,
        wrong: [999997, 1000009, 999009],
        checkExpr: "1000*1000-9",
        solution: {
          en: "(1000 − 3)(1000 + 3) = 1000000 − 9 = 999991. The identity turns a monstrous multiplication into one subtraction.",
          hi: "(1000 − 3)(1000 + 3) = 1000000 − 9 = 999991। सर्वसमिका राक्षसी गुणे को एक घटाव बना देती है।",
          mr: "(1000 − 3)(1000 + 3) = 1000000 − 9 = 999991. नित्यसमीकरण राक्षसी गुणाकाराला एक वजाबाकी करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Compute 49² using (50 − 1)².",
          hi: "(50 − 1)² से 49² निकालिए।",
          mr: "(50 − 1)² ने 49² काढा.",
        },
        answer: 2401,
        wrong: [2499, 2501, 2399],
        checkExpr: "50*50-2*50+1",
        solution: {
          en: "a² − 2ab + b² = 2500 − 100 + 1 = 2401. 2399 forgets the +1 — the small square at the end pays its paisa too.",
          hi: "a² − 2ab + b² = 2500 − 100 + 1 = 2401। 2399 +1 भूल जाता है — अंत का नन्हा वर्ग भी अपना पैसा चुकाता है।",
          mr: "a² − 2ab + b² = 2500 − 100 + 1 = 2401. 2399 +1 विसरतो — शेवटचा इवला वर्गही आपला पैसा देतो.",
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
          en: "(a + b)² − (a − b)² simplifies to ▢ab. What is the coefficient?",
          hi: "(a + b)² − (a − b)² सरल होकर ▢ab बनता है। गुणांक क्या है?",
          mr: "(a + b)² − (a − b)² सोपे होऊन ▢ab होते. सहगुणक काय?",
        },
        answer: 4,
        wrong: [2, 0, 8],
        checkExpr: "2+2",
        solution: {
          en: "Expand both: (a² + 2ab + b²) − (a² − 2ab + b²) = 4ab — the squares cancel and the two middle terms join. 0 cancels everything, middle terms included, by sign-carelessness.",
          hi: "दोनों फैलाइए: (a² + 2ab + b²) − (a² − 2ab + b²) = 4ab — वर्ग कटते हैं और दोनों बीच के पद जुड़ते हैं। 0 चिह्न-लापरवाही से बीच के पद समेत सब काट देता है।",
          mr: "दोन्ही विस्तारा: (a² + 2ab + b²) − (a² − 2ab + b²) = 4ab — वर्ग रद्द होतात आणि दोन्ही मधली पदे जुळतात. 0 चिन्ह-निष्काळजीपणाने मधल्या पदांसकट सारे रद्द करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The ending-in-5 trick: 65² = (6 × 7) written before 25. Verify — compute 65².",
          hi: "5-अंत की तरकीब: 65² = (6 × 7) के आगे 25। जाँचिए — 65² निकालिए।",
          mr: "5-शेवटची युक्ती: 65² = (6 × 7) च्या पुढे 25. तपासा — 65² काढा.",
        },
        answer: 4225,
        wrong: [4025, 3625, 4235],
        checkExpr: "6*7*100+25",
        solution: {
          en: "65² = 4225 = 42|25, and 42 = 6 × 7. The trick IS the identity: (10n + 5)² = 100n(n + 1) + 25 — algebra explaining a bazaar shortcut.",
          hi: "65² = 4225 = 42|25, और 42 = 6 × 7। तरकीब स्वयं सर्वसमिका है: (10n + 5)² = 100n(n + 1) + 25 — बीजगणित बाज़ारू शॉर्टकट की व्याख्या करता हुआ।",
          mr: "65² = 4225 = 42|25, आणि 42 = 6 × 7. युक्ती हीच नित्यसमीकरण: (10n + 5)² = 100n(n + 1) + 25 — बाजारी युक्तीचे स्पष्टीकरण देणारे बीजगणित.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 9 — Algebraic Expressions and Identities",
      name: "Algebraic Expressions and Identities",
      slug: "maths-8-algebraic-identities",
      summary:
        "The three identities put to work: monstrous multiplications tamed to a subtraction, the never-optional 2ab — and the ending-in-5 bazaar trick exposed as algebra.",
      position: 9,
      translations: {
        hi: {
          name: "बीजीय व्यंजक एवं सर्वसमिकाएँ",
          summary:
            "काम पर लगीं तीनों सर्वसमिकाएँ: एक घटाव में सधे राक्षसी गुणे, कभी-वैकल्पिक-नहीं 2ab — और 5-अंत की बाज़ारू तरकीब, जो बीजगणित निकली।",
        },
        mr: {
          name: "बैजिक पदावली व नित्यसमीकरणे",
          summary:
            "कामाला लावलेली तिन्ही नित्यसमीकरणे: एका वजाबाकीत आवरलेले राक्षसी गुणाकार, कधीही-ऐच्छिक-नसलेला 2ab — आणि बीजगणित निघालेली 5-शेवटची बाजारी युक्ती.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Mensuration (trapezium fields and cylinder drums)            */
/* ------------------------------------------------------------------------- */
function mensuration8(): TopicFileOut {
  const rand = rng("maths-8-mensuration");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A trapezium has parallel sides 10 cm and 6 cm, with height 4 cm. What is its area, in square cm?",
          hi: "समलंब की समांतर भुजाएँ 10 सेमी और 6 सेमी हैं, ऊँचाई 4 सेमी। क्षेत्रफल वर्ग सेमी में कितना?",
          mr: "समलंब चौकोनाच्या समांतर बाजू 10 सेमी आणि 6 सेमी, उंची 4 सेमी. क्षेत्रफळ चौरस सेमीमध्ये किती?",
        },
        answer: 32,
        wrong: [64, 40, 24],
        checkExpr: "(10+6)*4/2",
        solution: {
          en: "Half the sum of parallel sides times height: (10 + 6)/2 × 4 = 32. 64 forgets the half — a trapezium is the average of two rectangles.",
          hi: "समांतर भुजाओं के योग का आधा गुणा ऊँचाई: (10 + 6)/2 × 4 = 32। 64 आधा भूल जाता है — समलंब दो आयतों का औसत है।",
          mr: "समांतर बाजूंच्या बेरजेचे अर्धे गुणिले उंची: (10 + 6)/2 × 4 = 32. 64 अर्धे विसरतो — समलंब म्हणजे दोन आयतांची सरासरी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the volume of a cube of edge 5 cm?",
          hi: "5 सेमी किनारे वाले घन का आयतन कितना?",
          mr: "5 सेमी कडेच्या घनाचे घनफळ किती?",
        },
        answer: 125,
        wrong: [25, 150, 15],
        checkExpr: "5*5*5",
        solution: {
          en: "5 × 5 × 5 = 125 cm³. 150 computes the surface area instead — skin, not filling.",
          hi: "5 × 5 × 5 = 125 घन सेमी। 150 उलटे पृष्ठीय क्षेत्रफल निकालता है — खोल, भराव नहीं।",
          mr: "5 × 5 × 5 = 125 घन सेमी. 150 उलट पृष्ठफळ काढतो — साल, भरणे नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the TOTAL surface area of a cube of edge 4 cm?",
          hi: "4 सेमी किनारे वाले घन का कुल पृष्ठीय क्षेत्रफल कितना?",
          mr: "4 सेमी कडेच्या घनाचे एकूण पृष्ठफळ किती?",
        },
        answer: 96,
        wrong: [64, 16, 24],
        checkExpr: "6*4*4",
        solution: {
          en: "Six faces of 4 × 4 each: 6 × 16 = 96 cm². 64 computes the volume; 16 stops at one face.",
          hi: "4 × 4 के छह फलक: 6 × 16 = 96 वर्ग सेमी। 64 आयतन निकाल बैठता है; 16 एक फलक पर रुकता है।",
          mr: "4 × 4 ची सहा पृष्ठे: 6 × 16 = 96 चौ. सेमी. 64 घनफळ काढतो; 16 एका पृष्ठावर थांबतो.",
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
          en: "A cuboid measures 5 × 4 × 3 cm. What is its volume?",
          hi: "एक घनाभ 5 × 4 × 3 सेमी का है। उसका आयतन कितना?",
          mr: "एक इष्टिकाचिती 5 × 4 × 3 सेमी आहे. तिचे घनफळ किती?",
        },
        answer: 60,
        wrong: [12, 47, 94],
        checkExpr: "5*4*3",
        solution: {
          en: "Volume = l × b × h = 5 × 4 × 3 = 60 cm³. 94 is the surface area wearing volume's units.",
          hi: "आयतन = ल × चौ × ऊँ = 5 × 4 × 3 = 60 घन सेमी। 94 आयतन की इकाई पहने पृष्ठीय क्षेत्रफल है।",
          mr: "घनफळ = लां × रुं × उं = 5 × 4 × 3 = 60 घन सेमी. 94 हे घनफळाचे एकक घातलेले पृष्ठफळ.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The same 5 × 4 × 3 cuboid — what is its TOTAL surface area?",
          hi: "वही 5 × 4 × 3 घनाभ — उसका कुल पृष्ठीय क्षेत्रफल कितना?",
          mr: "तीच 5 × 4 × 3 इष्टिकाचिती — तिचे एकूण पृष्ठफळ किती?",
        },
        answer: 94,
        wrong: [60, 47, 120],
        checkExpr: "2*(5*4+4*3+5*3)",
        solution: {
          en: "2(lb + bh + hl) = 2(20 + 12 + 15) = 94 cm². 47 forgets each face has a twin on the opposite side.",
          hi: "2(lb + bh + hl) = 2(20 + 12 + 15) = 94 वर्ग सेमी। 47 भूल जाता है कि हर फलक का सामने एक जुड़वाँ है।",
          mr: "2(lb + bh + hl) = 2(20 + 12 + 15) = 94 चौ. सेमी. 47 विसरतो की प्रत्येक पृष्ठाला समोर एक जुळे आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A rhombus has diagonals 10 cm and 8 cm. What is its area?",
          hi: "समचतुर्भुज के विकर्ण 10 सेमी और 8 सेमी हैं। क्षेत्रफल कितना?",
          mr: "समभुज चौकोनाचे कर्ण 10 सेमी आणि 8 सेमी आहेत. क्षेत्रफळ किती?",
        },
        answer: 40,
        wrong: [80, 18, 36],
        checkExpr: "10*8/2",
        solution: {
          en: "Half the product of diagonals: 10 × 8 ÷ 2 = 40 cm². 80 forgets the half — the diagonals' rectangle holds TWO rhombuses.",
          hi: "विकर्णों के गुणनफल का आधा: 10 × 8 ÷ 2 = 40 वर्ग सेमी। 80 आधा भूल जाता है — विकर्णों के आयत में दो समचतुर्भुज समाते हैं।",
          mr: "कर्णांच्या गुणाकाराचे अर्धे: 10 × 8 ÷ 2 = 40 चौ. सेमी. 80 अर्धे विसरतो — कर्णांच्या आयतात दोन समभुज चौकोन मावतात.",
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
          en: "A cylinder has radius 7 cm and height 10 cm. What is its volume? (π = 22/7)",
          hi: "बेलन की त्रिज्या 7 सेमी और ऊँचाई 10 सेमी है। आयतन कितना? (π = 22/7)",
          mr: "दंडगोलाची त्रिज्या 7 सेमी आणि उंची 10 सेमी आहे. घनफळ किती? (π = 22/7)",
        },
        answer: 1540,
        wrong: [154, 440, 15400],
        checkExpr: "22*7*10",
        solution: {
          en: "V = πr²h = 22/7 × 49 × 10 = 1540 cm³. 154 is just the base circle's area; 440 the curved wall's.",
          hi: "आयतन = πr²h = 22/7 × 49 × 10 = 1540 घन सेमी। 154 केवल आधार-वृत्त का क्षेत्रफल है; 440 घुमावदार दीवार का।",
          mr: "घनफळ = πr²h = 22/7 × 49 × 10 = 1540 घन सेमी. 154 फक्त पाया-वर्तुळाचे क्षेत्रफळ; 440 वक्र भिंतीचे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The same cylinder (r = 7, h = 10): what is its CURVED surface area? (π = 22/7)",
          hi: "वही बेलन (r = 7, h = 10): उसका वक्र पृष्ठीय क्षेत्रफल कितना? (π = 22/7)",
          mr: "तोच दंडगोल (r = 7, h = 10): त्याचे वक्र पृष्ठफळ किती? (π = 22/7)",
        },
        answer: 440,
        wrong: [1540, 220, 494],
        checkExpr: "2*22*10",
        solution: {
          en: "CSA = 2πrh = 2 × 22/7 × 7 × 10 = 440 cm² — the label peeled off and flattened. 220 forgets the 2; the wall wraps the FULL circumference.",
          hi: "वक्र क्षेत्रफल = 2πrh = 2 × 22/7 × 7 × 10 = 440 वर्ग सेमी — उतारकर बिछाया गया लेबल। 220 दो भूल जाता है; दीवार पूरी परिधि लपेटती है।",
          mr: "वक्र पृष्ठफळ = 2πrh = 2 × 22/7 × 7 × 10 = 440 चौ. सेमी — सोलून पसरवलेले लेबल. 220 दोन विसरतो; भिंत पूर्ण परीघ गुंडाळते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "How many litres fit in 1 cubic metre?",
          hi: "1 घन मीटर में कितने लीटर समाते हैं?",
          mr: "1 घन मीटरमध्ये किती लिटर मावतात?",
        },
        answer: 1000,
        wrong: [100, 10, 10000],
        solution: {
          en: "1 m³ = 100 × 100 × 100 cm³ = 10,00,000 cm³, and 1000 cm³ make a litre: 1000 litres. Each dimension contributes its factor of 100.",
          hi: "1 घन मीटर = 100 × 100 × 100 घन सेमी = 10,00,000 घन सेमी, और 1000 घन सेमी का एक लीटर: 1000 लीटर। हर विमा अपना 100 का गुणनखंड देती है।",
          mr: "1 घन मीटर = 100 × 100 × 100 घन सेमी = 10,00,000 घन सेमी, आणि 1000 घन सेमीचा एक लिटर: 1000 लिटर. प्रत्येक मिती आपला 100 चा घटक देते.",
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
          en: "A trapezium-shaped field has parallel sides 25 m and 15 m and area 200 m². What is the distance between the parallel sides?",
          hi: "समलंब खेत की समांतर भुजाएँ 25 मीटर और 15 मीटर हैं, क्षेत्रफल 200 वर्ग मीटर। समांतर भुजाओं की दूरी कितनी?",
          mr: "समलंब शेताच्या समांतर बाजू 25 मीटर आणि 15 मीटर, क्षेत्रफळ 200 चौ. मीटर. समांतर बाजूंमधले अंतर किती?",
        },
        answer: 10,
        wrong: [5, 20, 8],
        checkExpr: "200*2/(25+15)",
        solution: {
          en: "Run the formula backwards: h = 2 × 200 ÷ (25 + 15) = 400 ÷ 40 = 10 m. 5 forgets to double the area first.",
          hi: "सूत्र उल्टा चलाइए: h = 2 × 200 ÷ (25 + 15) = 400 ÷ 40 = 10 मीटर। 5 पहले क्षेत्रफल दुगुना करना भूल जाता है।",
          mr: "सूत्र उलटे चालवा: h = 2 × 200 ÷ (25 + 15) = 400 ÷ 40 = 10 मीटर. 5 आधी क्षेत्रफळ दुप्पट करायला विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "An open box is a cube of edge 10 cm with NO lid. How much sheet, in square cm, forms it?",
          hi: "खुला डिब्बा 10 सेमी किनारे का बिना ढक्कन का घन है। कितनी चादर, वर्ग सेमी में, उसे बनाती है?",
          mr: "उघडा खोका म्हणजे झाकण नसलेला 10 सेमी कडेचा घन. किती पत्रा, चौरस सेमीमध्ये, त्याला बनवतो?",
        },
        answer: 500,
        wrong: [600, 400, 100],
        checkExpr: "5*10*10",
        solution: {
          en: "Five faces of 100 cm² each — the lid stayed at the shop: 500 cm². 600 builds the closed cube.",
          hi: "100-100 वर्ग सेमी के पाँच फलक — ढक्कन दुकान पर ही रहा: 500 वर्ग सेमी। 600 बंद घन बना देता है।",
          mr: "प्रत्येकी 100 चौ. सेमीची पाच पृष्ठे — झाकण दुकानातच राहिले: 500 चौ. सेमी. 600 बंद घन बांधतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A room measures 4 m × 3 m × 2.5 m. How many cubic metres of air does it hold?",
          hi: "कमरा 4 मी × 3 मी × 2.5 मी का है। उसमें कितने घन मीटर हवा समाती है?",
          mr: "खोली 4 मी × 3 मी × 2.5 मी आहे. तिच्यात किती घन मीटर हवा मावते?",
        },
        answer: 30,
        wrong: [9.5, 24, 60],
        checkExpr: "4*3*2.5",
        solution: {
          en: "4 × 3 × 2.5 = 30 m³. 24 drops the half-metre of height — ceilings count too.",
          hi: "4 × 3 × 2.5 = 30 घन मीटर। 24 ऊँचाई का आधा मीटर गिरा देता है — छतें भी गिनती में हैं।",
          mr: "4 × 3 × 2.5 = 30 घन मीटर. 24 उंचीचा अर्धा मीटर गाळतो — छतेही मोजणीत आहेत.",
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
          en: "A road roller is a cylinder of diameter 84 cm and length 100 cm. What area, in square cm, does ONE revolution press? (π = 22/7)",
          hi: "सड़क-रोलर 84 सेमी व्यास और 100 सेमी लंबाई का बेलन है। एक चक्कर में कितना क्षेत्रफल, वर्ग सेमी में, दबता है? (π = 22/7)",
          mr: "रोड-रोलर 84 सेमी व्यासाचा आणि 100 सेमी लांबीचा दंडगोल आहे. एका फेरीत किती क्षेत्रफळ, चौरस सेमीमध्ये, दबते? (π = 22/7)",
        },
        answer: 26400,
        wrong: [13200, 264, 5280],
        checkExpr: "2*22*6*100",
        solution: {
          en: "One revolution lays down the curved surface: 2πrh = 2 × 22/7 × 42 × 100 = 26,400 cm². 13200 halves it — the roller prints its FULL wrap each turn.",
          hi: "एक चक्कर वक्र पृष्ठ बिछा देता है: 2πrh = 2 × 22/7 × 42 × 100 = 26,400 वर्ग सेमी। 13200 उसे आधा कर देता है — रोलर हर घुमाव में पूरी लपेट छापता है।",
          mr: "एक फेरी वक्र पृष्ठ अंथरते: 2πrh = 2 × 22/7 × 42 × 100 = 26,400 चौ. सेमी. 13200 ते निम्मे करतो — रोलर प्रत्येक वळणात पूर्ण वेढा छापतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "If a cube's edge is doubled, its VOLUME becomes how many times the original?",
          hi: "घन का किनारा दुगुना करने पर आयतन मूल का कितने गुना हो जाता है?",
          mr: "घनाची कड दुप्पट केल्यास घनफळ मूळच्या किती पट होते?",
        },
        answer: 8,
        wrong: [2, 4, 6],
        checkExpr: "2*2*2",
        solution: {
          en: "Volume rides on the CUBE of the edge: 2³ = 8 times. 4 is the surface area's multiplier — each measure scales by its own dimension.",
          hi: "आयतन किनारे के घन पर सवार है: 2³ = 8 गुना। 4 पृष्ठीय क्षेत्रफल का गुणक है — हर माप अपनी विमा से बढ़ती है।",
          mr: "घनफळ कडेच्या घनावर स्वार आहे: 2³ = 8 पट. 4 हा पृष्ठफळाचा गुणक — प्रत्येक माप आपल्या मितीने वाढते.",
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
          en: "A 22 cm × 7 cm paper sheet rolls into a cylinder along its 22-cm side (so 2πr = 22, height 7). What VOLUME does it enclose? (π = 22/7)",
          hi: "22 सेमी × 7 सेमी का काग़ज़ 22-सेमी भुजा के साथ बेलन बनता है (यानी 2πr = 22, ऊँचाई 7)। वह कितना आयतन घेरता है? (π = 22/7)",
          mr: "22 सेमी × 7 सेमीचा कागद 22-सेमी बाजूने दंडगोल होतो (म्हणजे 2πr = 22, उंची 7). तो किती घनफळ वेढतो? (π = 22/7)",
        },
        answer: 269.5,
        wrong: [154, 85.75, 539],
        checkExpr: "22*3.5*3.5*7/7",
        solution: {
          en: "2πr = 22 gives r = 3.5, so V = 22/7 × 3.5² × 7 = 269.5 cm³. Rolled the OTHER way the same sheet encloses only 85.75 cm³ — one paper, two volumes: area fixes the wrap, never the filling.",
          hi: "2πr = 22 से r = 3.5, अतः आयतन = 22/7 × 3.5² × 7 = 269.5 घन सेमी। दूसरी ओर से लपेटा वही काग़ज़ केवल 85.75 घन सेमी घेरता है — एक काग़ज़, दो आयतन: क्षेत्रफल लपेट तय करता है, भराव कभी नहीं।",
          mr: "2πr = 22 मधून r = 3.5, म्हणून घनफळ = 22/7 × 3.5² × 7 = 269.5 घन सेमी. दुसऱ्या बाजूने गुंडाळलेला तोच कागद फक्त 85.75 घन सेमी वेढतो — एक कागद, दोन घनफळे: क्षेत्रफळ वेढा ठरवते, भरणे कधीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A cuboid tank measures 2 m × 1.5 m × 1 m. How many LITRES does it hold when full?",
          hi: "घनाभ टंकी 2 मी × 1.5 मी × 1 मी की है। भरी होने पर उसमें कितने लीटर समाते हैं?",
          mr: "इष्टिकाचिती टाकी 2 मी × 1.5 मी × 1 मी आहे. भरलेली असताना तिच्यात किती लिटर मावतात?",
        },
        answer: 3000,
        wrong: [300, 3, 30000],
        checkExpr: "2*1.5*1*1000",
        solution: {
          en: "Volume = 3 m³, and each cubic metre holds 1000 litres: 3000 L. 3 stops at cubic metres — the unit conversion is where tank problems are won and lost.",
          hi: "आयतन = 3 घन मीटर, और हर घन मीटर में 1000 लीटर: 3000 ली। 3 घन मीटर पर रुक जाता है — टंकी के सवाल इकाई-बदल पर ही जीते-हारे जाते हैं।",
          mr: "घनफळ = 3 घन मीटर, आणि प्रत्येक घन मीटरमध्ये 1000 लिटर: 3000 लि. 3 घन मीटरवर थांबतो — टाकीचे प्रश्न एकक-बदलावरच जिंकले-हरले जातात.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 11 — Mensuration",
      name: "Mensuration",
      slug: "maths-8-mensuration",
      summary:
        "Trapezium fields averaged, boxes skinned and filled, a road roller printing its wrap — and one sheet of paper enclosing two different volumes.",
      position: 11,
      translations: {
        hi: {
          name: "क्षेत्रमिति",
          summary:
            "औसत से नपे समलंब खेत, खोल और भराव वाले डिब्बे, अपनी लपेट छापता सड़क-रोलर — और काग़ज़ की एक चादर जो दो अलग आयतन घेरती है।",
        },
        mr: {
          name: "क्षेत्रमिती",
          summary:
            "सरासरीने मोजलेली समलंब शेते, साल आणि भरणे असलेले खोके, आपला वेढा छापणारा रोड-रोलर — आणि दोन वेगळी घनफळे वेढणारी कागदाची एक चादर.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Exponents and Powers (below zero, the powers go on)          */
/* ------------------------------------------------------------------------- */
function exponentsAndPowers8(): TopicFileOut {
  const rand = rng("maths-8-exponents-powers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "2⁻³ = 1/▢. What number fills the box?",
          hi: "2⁻³ = 1/▢। रिक्त में कौन-सी संख्या आएगी?",
          mr: "2⁻³ = 1/▢. रिकाम्यात कोणती संख्या येईल?",
        },
        answer: 8,
        wrong: [6, -8, 9],
        checkExpr: "2*2*2",
        solution: {
          en: "A negative exponent flips: 2⁻³ = 1/2³ = 1/8. −8 keeps the minus on the VALUE — the sign lives in the exponent, not the answer.",
          hi: "ऋण घात पलटती है: 2⁻³ = 1/2³ = 1/8। −8 ऋण को मान पर रख देता है — चिह्न घात में बसता है, उत्तर में नहीं।",
          mr: "ऋण घात उलटवते: 2⁻³ = 1/2³ = 1/8. −8 ऋण किमतीवर ठेवतो — चिन्ह घातात राहते, उत्तरात नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 10⁻² as a decimal?",
          hi: "10⁻² दशमलव में कितना है?",
          mr: "10⁻² दशांशात किती?",
        },
        answer: 0.01,
        wrong: [0.1, -100, 0.02],
        checkExpr: "1/100",
        solution: {
          en: "10⁻² = 1/100 = 0.01. −100 misreads the minus as a sign; it is only an instruction to take the reciprocal.",
          hi: "10⁻² = 1/100 = 0.01। −100 ऋण को चिह्न पढ़ लेता है; वह केवल व्युत्क्रम लेने का निर्देश है।",
          mr: "10⁻² = 1/100 = 0.01. −100 ऋणाला चिन्ह वाचतो; ती फक्त व्यस्त घेण्याची सूचना आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is (1/2)⁻¹?",
          hi: "(1/2)⁻¹ कितना है?",
          mr: "(1/2)⁻¹ किती?",
        },
        answer: 2,
        wrong: [0.5, -2, 1],
        solution: {
          en: "The −1 power means 'flip me': (1/2)⁻¹ = 2. 0.5 leaves the fraction unflipped; −2 invents a sign.",
          hi: "घात −1 का अर्थ 'मुझे पलटो': (1/2)⁻¹ = 2। 0.5 भिन्न बिना पलटे छोड़ देता है; −2 चिह्न गढ़ लेता है।",
          mr: "घात −1 म्हणजे 'मला उलटवा': (1/2)⁻¹ = 2. 0.5 अपूर्णांक न उलटवता ठेवतो; −2 चिन्ह घडवतो.",
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
          en: "3⁻² × 3⁵ = 3 raised to which power?",
          hi: "3⁻² × 3⁵ = 3 की कौन-सी घात?",
          mr: "3⁻² × 3⁵ = 3 चा कोणता घात?",
        },
        answer: 3,
        wrong: [7, -10, 10],
        checkExpr: "5-2",
        solution: {
          en: "Same base, so ADD exponents: −2 + 5 = 3. −10 multiplies them — the law adds even when one is negative.",
          hi: "आधार समान, अतः घातें जोड़िए: −2 + 5 = 3। −10 उन्हें गुणा कर देता है — नियम तब भी जोड़ता है जब एक ऋण हो।",
          mr: "पाया समान, म्हणून घाती जोडा: −2 + 5 = 3. −10 त्यांना गुणतो — नियम एक ऋण असतानाही जोडतोच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 5⁰ + 5¹?",
          hi: "5⁰ + 5¹ कितना है?",
          mr: "5⁰ + 5¹ किती?",
        },
        answer: 6,
        wrong: [5, 10, 26],
        checkExpr: "1+5",
        solution: {
          en: "5⁰ = 1 and 5¹ = 5: together 6. 5 treats 5⁰ as zero — but the zeroth power is 1, never 0.",
          hi: "5⁰ = 1 और 5¹ = 5: मिलाकर 6। 5 5⁰ को शून्य मान लेता है — पर शून्यवीं घात 1 होती है, 0 कभी नहीं।",
          mr: "5⁰ = 1 आणि 5¹ = 5: मिळून 6. 5 5⁰ ला शून्य मानतो — पण शून्यावी घात 1 असते, 0 कधीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "0.000035 in standard form is 3.5 × 10 to which power?",
          hi: "0.000035 का मानक रूप 3.5 × 10 की कौन-सी घात है?",
          mr: "0.000035 चे प्रमाण रूप 3.5 × 10 चा कोणता घात?",
        },
        answer: -5,
        wrong: [5, -6, -4],
        checkExpr: "0-5",
        solution: {
          en: "The point hops 5 places right to reach 3.5, so the power is −5. −6 counts the hop past the 3 twice.",
          hi: "बिंदु 3.5 तक पहुँचने को 5 स्थान दाएँ कूदता है, अतः घात −5। −6 तीन के पार की छलाँग दो बार गिन लेता है।",
          mr: "बिंदू 3.5 पर्यंत पोहोचायला 5 घरे उजवीकडे उडतो, म्हणून घात −5. −6 तिघापलीकडची उडी दोनदा मोजतो.",
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
          en: "2⁻¹ + 3⁻¹ = ▢/6. What is the numerator in the box?",
          hi: "2⁻¹ + 3⁻¹ = ▢/6। रिक्त में अंश क्या आएगा?",
          mr: "2⁻¹ + 3⁻¹ = ▢/6. रिकाम्यात अंश काय येईल?",
        },
        answer: 5,
        wrong: [6, 1, 2],
        checkExpr: "3+2",
        solution: {
          en: "1/2 + 1/3 = 3/6 + 2/6 = 5/6. 1 adds the exponents' bases upside-down (1/5) — reciprocals first, THEN add.",
          hi: "1/2 + 1/3 = 3/6 + 2/6 = 5/6। 1 आधारों को उल्टा जोड़ बैठता है (1/5) — पहले व्युत्क्रम, फिर योग।",
          mr: "1/2 + 1/3 = 3/6 + 2/6 = 5/6. 1 पायांना उलटे जोडतो (1/5) — आधी व्यस्त, मग बेरीज.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A red blood cell is about 7 × 10⁻⁶ m across. In MILLIMETRES that is 7 × 10 to which power?",
          hi: "लाल रक्त-कोशिका लगभग 7 × 10⁻⁶ मीटर चौड़ी है। मिलीमीटर में वह 7 × 10 की कौन-सी घात है?",
          mr: "लाल रक्तपेशी सुमारे 7 × 10⁻⁶ मीटर रुंद आहे. मिलिमीटरमध्ये ती 7 × 10 चा कोणता घात?",
        },
        answer: -3,
        wrong: [-6, 3, -9],
        checkExpr: "0-3",
        solution: {
          en: "A millimetre is 10⁻³ m, so dividing by it raises the power by 3: −6 + 3 = −3, i.e. 0.007 mm. −9 moves the wrong way — smaller units mean bigger numbers.",
          hi: "मिलीमीटर = 10⁻³ मीटर, अतः उससे भाग देना घात 3 बढ़ाता है: −6 + 3 = −3, यानी 0.007 मिमी। −9 उल्टी दिशा चलता है — छोटी इकाई यानी बड़ी संख्या।",
          mr: "मिलिमीटर = 10⁻³ मीटर, म्हणून त्याने भागल्यास घात 3 ने वाढतो: −6 + 3 = −3, म्हणजे 0.007 मिमी. −9 उलट्या दिशेने जातो — लहान एकक म्हणजे मोठी संख्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "(3²)⁻² = 3 raised to which power?",
          hi: "(3²)⁻² = 3 की कौन-सी घात?",
          mr: "(3²)⁻² = 3 चा कोणता घात?",
        },
        answer: -4,
        wrong: [4, 0, -1],
        checkExpr: "0-4",
        solution: {
          en: "A power of a power MULTIPLIES: 2 × (−2) = −4, so 1/81. 0 adds them — the addition law belongs to same-base products, not nesting.",
          hi: "घात की घात गुणा होती है: 2 × (−2) = −4, यानी 1/81। 0 उन्हें जोड़ देता है — जोड़ का नियम समान आधार के गुणनफल का है, घोंसले का नहीं।",
          mr: "घाताची घात गुणली जाते: 2 × (−2) = −4, म्हणजे 1/81. 0 त्यांना जोडतो — बेरजेचा नियम समान पायाच्या गुणाकाराचा, घरट्याचा नव्हे.",
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
          en: "(2⁵ ÷ 2⁸) × 2⁴ = 2 raised to which power?",
          hi: "(2⁵ ÷ 2⁸) × 2⁴ = 2 की कौन-सी घात?",
          mr: "(2⁵ ÷ 2⁸) × 2⁴ = 2 चा कोणता घात?",
        },
        answer: 1,
        wrong: [17, -1, 7],
        checkExpr: "5-8+4",
        solution: {
          en: "Subtract for the division, add for the product: 5 − 8 + 4 = 1, so the value is just 2. The negative middle step (2⁻³) is a way-station, not a wall.",
          hi: "भाग में घटाइए, गुणा में जोड़िए: 5 − 8 + 4 = 1, अतः मान बस 2। बीच का ऋण पड़ाव (2⁻³) रास्ते की सराय है, दीवार नहीं।",
          mr: "भागात वजा, गुणाकारात बेरीज: 5 − 8 + 4 = 1, म्हणून किंमत फक्त 2. मधला ऋण टप्पा (2⁻³) वाटेतली धर्मशाळा, भिंत नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If x⁻¹ = 1/9, what is x?",
          hi: "यदि x⁻¹ = 1/9, तो x कितना?",
          mr: "जर x⁻¹ = 1/9, तर x किती?",
        },
        answer: 9,
        wrong: [-9, 0.11, 3],
        solution: {
          en: "x⁻¹ is the reciprocal of x; if the reciprocal is 1/9, x itself is 9. 3 confuses the reciprocal with the square root.",
          hi: "x⁻¹ x का व्युत्क्रम है; व्युत्क्रम 1/9 हो तो x स्वयं 9। 3 व्युत्क्रम को वर्गमूल से मिला बैठता है।",
          mr: "x⁻¹ हा x चा व्यस्त; व्यस्त 1/9 असेल तर x स्वतः 9. 3 व्यस्ताची वर्गमुळाशी गल्लत करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is 5⁻² as a decimal?",
          hi: "5⁻² दशमलव में कितना है?",
          mr: "5⁻² दशांशात किती?",
        },
        answer: 0.04,
        wrong: [0.4, 0.25, -0.04],
        checkExpr: "1/25",
        solution: {
          en: "5⁻² = 1/25 = 0.04. 0.25 takes 1/4 by square-root instinct; the minus means reciprocal-of-the-square.",
          hi: "5⁻² = 1/25 = 0.04। 0.25 वर्गमूल की आदत से 1/4 ले बैठता है; ऋण का अर्थ है वर्ग-का-व्युत्क्रम।",
          mr: "5⁻² = 1/25 = 0.04. 0.25 वर्गमुळाच्या सवयीने 1/4 घेतो; ऋण म्हणजे वर्गाचा-व्यस्त.",
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
          en: "Which is LARGER: 2⁻³ or 3⁻²? Give the larger one as 1/▢ — the denominator.",
          hi: "बड़ा कौन: 2⁻³ या 3⁻²? बड़े को 1/▢ के रूप में दीजिए — हर बताइए।",
          mr: "मोठा कोण: 2⁻³ की 3⁻²? मोठ्याला 1/▢ रूपात द्या — छेद सांगा.",
        },
        answer: 8,
        wrong: [9, 3, 6],
        checkExpr: "2*2*2",
        solution: {
          en: "2⁻³ = 1/8 and 3⁻² = 1/9: with negative powers the race flips, and the SMALLER denominator wins — 1/8 is larger. The box holds 8.",
          hi: "2⁻³ = 1/8 और 3⁻² = 1/9: ऋण घातों में दौड़ पलट जाती है, और छोटा हर जीतता है — 1/8 बड़ा है। रिक्त में 8।",
          mr: "2⁻³ = 1/8 आणि 3⁻² = 1/9: ऋण घातांत शर्यत उलटते, आणि लहान छेद जिंकतो — 1/8 मोठा. रिकाम्यात 8.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Express 0.00000016 as 1.6 × 10 to which power?",
          hi: "0.00000016 को 1.6 × 10 की कौन-सी घात लिखें?",
          mr: "0.00000016 ला 1.6 × 10 चा कोणता घात लिहाल?",
        },
        answer: -7,
        wrong: [-8, 7, -6],
        checkExpr: "0-7",
        solution: {
          en: "The point hops 7 places to sit after the 1: 1.6 × 10⁻⁷. −8 counts the zeros but forgets the hop INTO the 1.",
          hi: "बिंदु 7 स्थान कूदकर 1 के बाद बैठता है: 1.6 × 10⁻⁷। −8 शून्य गिनता है पर 1 के भीतर की छलाँग भूल जाता है।",
          mr: "बिंदू 7 घरे उडून 1 च्या मागे बसतो: 1.6 × 10⁻⁷. −8 शून्ये मोजतो पण 1 मधली उडी विसरतो.",
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
          en: "A dust mote is 1.2 × 10⁻⁴ m wide; a human hair is 1.2 × 10⁻³ m. How many motes, side by side, span one hair?",
          hi: "धूल-कण 1.2 × 10⁻⁴ मीटर चौड़ा है; मानव बाल 1.2 × 10⁻³ मीटर। कितने कण अग़ल-बग़ल एक बाल जितने होंगे?",
          mr: "धुळीचा कण 1.2 × 10⁻⁴ मीटर रुंद; मानवी केस 1.2 × 10⁻³ मीटर. किती कण शेजारी-शेजारी एका केसाइतके होतील?",
        },
        answer: 10,
        wrong: [100, 1.2, 12],
        checkExpr: "1200/120",
        solution: {
          en: "Divide: 10⁻³ ÷ 10⁻⁴ = 10¹ — one hop of the exponent, ten motes. Negative powers subtract like any others: −3 − (−4) = 1.",
          hi: "भाग दीजिए: 10⁻³ ÷ 10⁻⁴ = 10¹ — घात की एक छलाँग, दस कण। ऋण घातें भी औरों की तरह घटती हैं: −3 − (−4) = 1।",
          mr: "भागा: 10⁻³ ÷ 10⁻⁴ = 10¹ — घाताची एक उडी, दहा कण. ऋण घातीही इतरांसारख्या वजा होतात: −3 − (−4) = 1.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is 7⁰ + 8⁰ + 9⁰?",
          hi: "7⁰ + 8⁰ + 9⁰ कितना है?",
          mr: "7⁰ + 8⁰ + 9⁰ किती?",
        },
        answer: 3,
        wrong: [24, 0, 1],
        checkExpr: "1+1+1",
        solution: {
          en: "Every nonzero number to the power 0 is 1: 1 + 1 + 1 = 3. 24 adds the bases; 0 believes the zero exponent zeroes the value — it does the opposite, anchoring every power-ladder at 1.",
          hi: "हर शून्येतर संख्या की घात 0 है 1: 1 + 1 + 1 = 3। 24 आधार जोड़ देता है; 0 मानता है कि शून्य घात मान को शून्य करती है — वह उल्टा करती है, हर घात-सीढ़ी को 1 पर टिकाती है।",
          mr: "प्रत्येक शून्येतर संख्येची घात 0 म्हणजे 1: 1 + 1 + 1 = 3. 24 पाये जोडतो; 0 मानतो की शून्य घात किंमत शून्य करते — ती उलट करते, प्रत्येक घात-शिडीला 1 वर टेकवते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 12 — Exponents and Powers",
      name: "Exponents and Powers",
      slug: "maths-8-exponents-powers",
      summary:
        "The exponent ladder extends below zero: minus means flip, laws that still add and multiply, blood cells written in standard form — and every ladder anchored at 1.",
      position: 12,
      translations: {
        hi: {
          name: "घातांक और घात",
          summary:
            "घातों की सीढ़ी शून्य से नीचे उतरती है: ऋण यानी पलटो, नियम जो अब भी जोड़ते-गुणते हैं, मानक रूप में लिखी रक्त-कोशिकाएँ — और हर सीढ़ी 1 पर टिकी हुई।",
        },
        mr: {
          name: "घातांक आणि घात",
          summary:
            "घातांची शिडी शून्याखाली उतरते: ऋण म्हणजे उलटवा, अजूनही जोडणारे-गुणणारे नियम, प्रमाण रूपात लिहिलेल्या रक्तपेशी — आणि प्रत्येक शिडी 1 वर टेकलेली.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Direct and Inverse Proportions (together up, or see-saw)     */
/* ------------------------------------------------------------------------- */
function proportions8(): TopicFileOut {
  const rand = rng("maths-8-direct-inverse-proportions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "5 pens cost ₹40. What do 8 such pens cost?",
          hi: "5 क़लमों के ₹40 लगते हैं। 8 क़लमों के कितने लगेंगे?",
          mr: "5 पेनांना ₹40 लागतात. 8 पेनांना किती लागतील?",
        },
        answer: 64,
        wrong: [45, 320, 72],
        checkExpr: "40*8/5",
        fmt: rupees,
        solution: {
          en: "One pen costs ₹8, so eight cost ₹64 — direct proportion: more pens, proportionally more money. 45 adds 5 instead of scaling.",
          hi: "एक क़लम ₹8 की, अतः आठ की ₹64 — अनुक्रमानुपात: ज़्यादा क़लम, उसी अनुपात में ज़्यादा पैसा। 45 अनुपात की जगह 5 जोड़ देता है।",
          mr: "एक पेन ₹8 चे, म्हणून आठांचे ₹64 — समानुपात: जास्त पेने, त्याच प्रमाणात जास्त पैसे. 45 प्रमाणाऐवजी 5 मिळवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A car covers 60 km in one hour. At the same speed, how far in 3 hours?",
          hi: "एक कार एक घंटे में 60 किमी चलती है। उसी चाल से 3 घंटे में कितनी दूर?",
          mr: "एक कार एका तासात 60 किमी जाते. त्याच वेगाने 3 तासांत किती दूर?",
        },
        answer: 180,
        wrong: [63, 20, 120],
        checkExpr: "60*3",
        solution: {
          en: "Triple the time, triple the distance: 60 × 3 = 180 km. Distance and time run in DIRECT proportion when speed holds still.",
          hi: "समय तिगुना तो दूरी तिगुनी: 60 × 3 = 180 किमी। चाल स्थिर हो तो दूरी और समय अनुक्रमानुपात में दौड़ते हैं।",
          mr: "वेळ तिप्पट तर अंतर तिप्पट: 60 × 3 = 180 किमी. वेग स्थिर असला की अंतर आणि वेळ समानुपातात धावतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "x and y are in DIRECT proportion. If x doubles, y becomes how many times its old value?",
          hi: "x और y अनुक्रमानुपात में हैं। x दुगुना हो तो y अपने पुराने मान का कितने गुना होगा?",
          mr: "x आणि y समानुपातात आहेत. x दुप्पट झाला तर y आपल्या जुन्या किमतीच्या किती पट होईल?",
        },
        answer: 2,
        wrong: [0.5, 4, 1],
        solution: {
          en: "Direct proportion keeps y/x constant, so y doubles too: 2 times. 0.5 describes INVERSE proportion — the see-saw, not the escalator.",
          hi: "अनुक्रमानुपात y/x स्थिर रखता है, अतः y भी दुगुना: 2 गुना। 0.5 व्युत्क्रमानुपात का हाल है — झूला, एस्केलेटर नहीं।",
          mr: "समानुपात y/x स्थिर ठेवतो, म्हणून y ही दुप्पट: 2 पट. 0.5 व्यस्तानुपाताचे वर्णन — झोका, सरकता जिना नव्हे.",
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
          en: "6 workers finish a wall in 10 days. At the same pace, how many days would 12 workers take?",
          hi: "6 मज़दूर एक दीवार 10 दिन में पूरी करते हैं। उसी रफ़्तार से 12 मज़दूर कितने दिन लेंगे?",
          mr: "6 मजूर एक भिंत 10 दिवसांत पूर्ण करतात. त्याच गतीने 12 मजूर किती दिवस घेतील?",
        },
        answer: 5,
        wrong: [20, 8, 60],
        checkExpr: "6*10/12",
        solution: {
          en: "Twice the workers, half the days: 6 × 10 ÷ 12 = 5 — inverse proportion, the product 60 worker-days staying fixed. 20 doubles the days instead.",
          hi: "दुगुने मज़दूर, आधे दिन: 6 × 10 ÷ 12 = 5 — व्युत्क्रमानुपात, 60 मज़दूर-दिनों का गुणनफल स्थिर। 20 उल्टे दिन दुगुने कर देता है।",
          mr: "दुप्पट मजूर, निम्मे दिवस: 6 × 10 ÷ 12 = 5 — व्यस्तानुपात, 60 मजूर-दिवसांचा गुणाकार स्थिर. 20 उलट दिवस दुप्पट करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "x and y are in inverse proportion, with x = 4 when y = 15. What is y when x = 6?",
          hi: "x और y व्युत्क्रमानुपात में हैं; x = 4 पर y = 15। x = 6 पर y कितना?",
          mr: "x आणि y व्यस्तानुपातात आहेत; x = 4 असताना y = 15. x = 6 असताना y किती?",
        },
        answer: 10,
        wrong: [22.5, 17, 90],
        checkExpr: "4*15/6",
        solution: {
          en: "The product stays put: xy = 60, so y = 60 ÷ 6 = 10. 22.5 scales y UP with x — that is direct proportion's move.",
          hi: "गुणनफल टिका रहता है: xy = 60, अतः y = 60 ÷ 6 = 10। 22.5 y को x के साथ बढ़ा देता है — वह अनुक्रमानुपात की चाल है।",
          mr: "गुणाकार स्थिर राहतो: xy = 60, म्हणून y = 60 ÷ 6 = 10. 22.5 y ला x सोबत वाढवतो — ती समानुपाताची चाल.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A map's scale is 1 cm = 50 km. Two towns sit 4.5 cm apart on it. How many km apart are they really?",
          hi: "नक़्शे का पैमाना 1 सेमी = 50 किमी है। दो क़स्बे उस पर 4.5 सेमी दूर हैं। असल में कितने किमी दूर?",
          mr: "नकाशाचे प्रमाण 1 सेमी = 50 किमी. दोन गावे त्यावर 4.5 सेमी दूर आहेत. खरे किती किमी दूर?",
        },
        answer: 225,
        wrong: [54.5, 45, 500],
        checkExpr: "4.5*50",
        solution: {
          en: "Each centimetre carries 50 km: 4.5 × 50 = 225 km. 54.5 adds the scale to the measurement — scales multiply, never add.",
          hi: "हर सेंटीमीटर 50 किमी ढोता है: 4.5 × 50 = 225 किमी। 54.5 माप में पैमाना जोड़ देता है — पैमाने गुणा होते हैं, जुड़ते कभी नहीं।",
          mr: "प्रत्येक सेंटिमीटर 50 किमी वाहतो: 4.5 × 50 = 225 किमी. 54.5 मापात प्रमाण मिळवतो — प्रमाणे गुणली जातात, कधी जुळत नाहीत.",
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
          en: "A photo 4 cm wide and 6 cm tall is enlarged until its height is 15 cm. What is the new WIDTH?",
          hi: "4 सेमी चौड़ी, 6 सेमी ऊँची तस्वीर बड़ी की जाती है, जब तक ऊँचाई 15 सेमी न हो जाए। नई चौड़ाई कितनी?",
          mr: "4 सेमी रुंद, 6 सेमी उंच छायाचित्र उंची 15 सेमी होईपर्यंत मोठे केले जाते. नवी रुंदी किती?",
        },
        answer: 10,
        wrong: [13, 9, 25],
        checkExpr: "4*15/6",
        solution: {
          en: "Enlargement scales both sides by 15/6 = 2.5: width 4 × 2.5 = 10 cm. 13 ADDS the 9 cm the height grew — photos scale, they don't stretch by addition.",
          hi: "बड़ा करना दोनों भुजाओं को 15/6 = 2.5 से गुणता है: चौड़ाई 4 × 2.5 = 10 सेमी। 13 ऊँचाई की बढ़त के 9 सेमी जोड़ देता है — तस्वीरें अनुपात में बढ़ती हैं, जोड़ से नहीं खिंचतीं।",
          mr: "मोठे करणे दोन्ही बाजूंना 15/6 = 2.5 ने गुणते: रुंदी 4 × 2.5 = 10 सेमी. 13 उंचीच्या वाढीचे 9 सेमी मिळवतो — छायाचित्रे प्रमाणात वाढतात, बेरजेने ताणली जात नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "15 identical books stack 60 cm tall. How tall is a stack of 8 of them?",
          hi: "15 एक जैसी किताबों की गड्डी 60 सेमी ऊँची है। 8 किताबों की गड्डी कितनी ऊँची?",
          mr: "15 सारख्या पुस्तकांची थप्पी 60 सेमी उंच आहे. 8 पुस्तकांची थप्पी किती उंच?",
        },
        answer: 32,
        wrong: [53, 30, 120],
        checkExpr: "60*8/15",
        solution: {
          en: "Each book is 4 cm thick: 8 × 4 = 32 cm. 53 subtracts 7 from 60 — book counts don't convert to centimetres one-for-one.",
          hi: "हर किताब 4 सेमी मोटी: 8 × 4 = 32 सेमी। 53 60 में से 7 घटा देता है — किताबों की गिनती एक-के-बदले-एक सेंटीमीटर नहीं बनती।",
          mr: "प्रत्येक पुस्तक 4 सेमी जाड: 8 × 4 = 32 सेमी. 53 60 मधून 7 वजा करतो — पुस्तकांची मोजणी एकास-एक सेंटिमीटर होत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Two equal pipes fill a tank in 12 hours. How long would THREE such pipes take?",
          hi: "दो बराबर पाइप टंकी 12 घंटे में भरते हैं। तीन ऐसे पाइप कितना समय लेंगे?",
          mr: "दोन सारखे पाइप टाकी 12 तासांत भरतात. तीन असे पाइप किती वेळ घेतील?",
        },
        answer: 8,
        wrong: [18, 6, 4],
        checkExpr: "12*2/3",
        solution: {
          en: "Pipe-hours stay fixed: 2 × 12 = 24, so three pipes need 24 ÷ 3 = 8 hours. 18 moves the time the WRONG way — more pipes can only shorten the wait.",
          hi: "पाइप-घंटे स्थिर रहते हैं: 2 × 12 = 24, अतः तीन पाइपों को 24 ÷ 3 = 8 घंटे। 18 समय को उल्टी दिशा ले जाता है — ज़्यादा पाइप इंतज़ार घटा ही सकते हैं।",
          mr: "पाइप-तास स्थिर राहतात: 2 × 12 = 24, म्हणून तीन पाइपांना 24 ÷ 3 = 8 तास. 18 वेळ उलट्या दिशेने नेतो — जास्त पाइप वाटच कमी करू शकतात.",
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
          en: "A hostel's food stock feeds 30 students for 40 days. If 20 more students arrive, how many days will it last?",
          hi: "छात्रावास का राशन 30 विद्यार्थियों को 40 दिन खिलाता है। 20 और आ जाएँ तो कितने दिन चलेगा?",
          mr: "वसतिगृहाचा शिधा 30 विद्यार्थ्यांना 40 दिवस पुरतो. आणखी 20 आले तर किती दिवस पुरेल?",
        },
        answer: 24,
        wrong: [60, 27, 20],
        checkExpr: "30*40/50",
        solution: {
          en: "Student-days are fixed: 30 × 40 = 1200, and 1200 ÷ 50 = 24 days. 60 feeds the EXTRA mouths with extra days — inverse proportion runs the other way.",
          hi: "विद्यार्थी-दिन स्थिर हैं: 30 × 40 = 1200, और 1200 ÷ 50 = 24 दिन। 60 ज़्यादा मुँहों को ज़्यादा दिन खिला देता है — व्युत्क्रमानुपात उल्टा चलता है।",
          mr: "विद्यार्थी-दिवस स्थिर: 30 × 40 = 1200, आणि 1200 ÷ 50 = 24 दिवस. 60 जास्त तोंडांना जास्त दिवस देतो — व्यस्तानुपात उलटा चालतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A wheel makes 45 revolutions to cover 90 m. How many revolutions for 240 m?",
          hi: "एक पहिया 90 मीटर के लिए 45 चक्कर लेता है। 240 मीटर के लिए कितने चक्कर?",
          mr: "एक चाक 90 मीटरसाठी 45 फेऱ्या घेते. 240 मीटरसाठी किती फेऱ्या?",
        },
        answer: 120,
        wrong: [480, 110, 60],
        checkExpr: "45*240/90",
        solution: {
          en: "Each revolution rolls 2 m, so 240 needs 120 turns — direct proportion. 110 adds 150 to 45 by hunch, not ratio.",
          hi: "हर चक्कर 2 मीटर लुढ़काता है, अतः 240 को 120 चक्कर — अनुक्रमानुपात। 110 अंदाज़े से 45 में 150 जोड़ता है, अनुपात से नहीं।",
          mr: "प्रत्येक फेरी 2 मीटर ढकलते, म्हणून 240 ला 120 फेऱ्या — समानुपात. 110 अंदाजाने 45 मध्ये 150 मिळवतो, गुणोत्तराने नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "5 machines produce 120 boxes in an hour. How many boxes do 8 machines make in an hour?",
          hi: "5 मशीनें घंटे में 120 डिब्बे बनाती हैं। 8 मशीनें घंटे में कितने डिब्बे बनाएँगी?",
          mr: "5 यंत्रे तासात 120 खोकी बनवतात. 8 यंत्रे तासात किती खोकी बनवतील?",
        },
        answer: 192,
        wrong: [125, 300, 160],
        checkExpr: "120*8/5",
        solution: {
          en: "Each machine makes 24 an hour: 8 × 24 = 192 boxes — direct proportion in machines. 125 adds 5 boxes for 3 machines, a unit muddle.",
          hi: "हर मशीन घंटे में 24 बनाती है: 8 × 24 = 192 डिब्बे — मशीनों में अनुक्रमानुपात। 125 तीन मशीनों के बदले 5 डिब्बे जोड़ता है, इकाई का घालमेल।",
          mr: "प्रत्येक यंत्र तासात 24 बनवते: 8 × 24 = 192 खोकी — यंत्रांत समानुपात. 125 तीन यंत्रांबद्दल 5 खोकी मिळवतो, एककांचा गोंधळ.",
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
          en: "A job needs 6 workers for 8 hours. After 2 hours of work, 2 workers leave. How many MORE hours do the remaining 4 need?",
          hi: "एक काम को 6 मज़दूर 8 घंटे में करते हैं। 2 घंटे काम के बाद 2 मज़दूर चले जाते हैं। बचे 4 को और कितने घंटे लगेंगे?",
          mr: "एका कामाला 6 मजूर 8 तास लागतात. 2 तास कामानंतर 2 मजूर निघून जातात. उरलेल्या 4 जणांना आणखी किती तास लागतील?",
        },
        answer: 9,
        wrong: [6, 12, 8],
        checkExpr: "(6*8-6*2)/4",
        solution: {
          en: "The job is 48 worker-hours; 12 are done, 36 remain, and 4 workers clear 36 in 9 hours. 6 forgets that the leavers took their hands with them.",
          hi: "काम 48 मज़दूर-घंटे का है; 12 हो चुके, 36 बाक़ी, और 4 मज़दूर 36 को 9 घंटे में निपटाते हैं। 6 भूल जाता है कि जाने वाले अपने हाथ साथ ले गए।",
          mr: "काम 48 मजूर-तासांचे; 12 झाले, 36 उरले, आणि 4 मजूर 36 ला 9 तासांत संपवतात. 6 विसरतो की गेलेले आपले हात सोबत घेऊन गेले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A cyclist at 15 km/h takes 40 minutes for a route. What speed covers the same route in 30 minutes?",
          hi: "15 किमी/घंटा की साइकिल-चाल से एक रास्ता 40 मिनट लेता है। वही रास्ता 30 मिनट में किस चाल से कटेगा?",
          mr: "15 किमी/तास वेगाने एक वाट 40 मिनिटे घेते. तीच वाट 30 मिनिटांत कोणत्या वेगाने कापली जाईल?",
        },
        answer: 20,
        wrong: [11.25, 25, 10],
        checkExpr: "15*40/30",
        solution: {
          en: "Speed × time is the fixed distance: 15 × 40 = new speed × 30, so 20 km/h. 11.25 slows down to finish FASTER — the see-saw tipped backwards.",
          hi: "चाल × समय ही स्थिर दूरी है: 15 × 40 = नई चाल × 30, अतः 20 किमी/घंटा। 11.25 जल्दी पहुँचने को धीमा हो जाता है — झूला उल्टा झुका।",
          mr: "वेग × वेळ हेच स्थिर अंतर: 15 × 40 = नवा वेग × 30, म्हणून 20 किमी/तास. 11.25 लवकर पोहोचायला हळू होतो — झोका उलटा कलला.",
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
          en: "For a FIXED distance, speed and time see-saw. A trip at 40 km/h takes 3 hours; how long at 60 km/h?",
          hi: "स्थिर दूरी पर चाल और समय झूले पर हैं। 40 किमी/घंटा से यात्रा 3 घंटे लेती है; 60 किमी/घंटा से कितनी देर?",
          mr: "स्थिर अंतरासाठी वेग आणि वेळ झोक्यावर असतात. 40 किमी/तासाने प्रवास 3 तास घेतो; 60 किमी/तासाने किती वेळ?",
        },
        answer: 2,
        wrong: [4.5, 2.5, 1.5],
        checkExpr: "40*3/60",
        solution: {
          en: "The distance is 120 km either way: 120 ÷ 60 = 2 hours. 4.5 scales time UP with speed — the direct-proportion reflex applied to an inverse pair. Ask first: does the product stay fixed, or the ratio?",
          hi: "दूरी दोनों तरह 120 किमी है: 120 ÷ 60 = 2 घंटे। 4.5 समय को चाल के साथ बढ़ा देता है — व्युत्क्रम जोड़ी पर अनुक्रम की आदत। पहले पूछिए: स्थिर गुणनफल रहता है या अनुपात?",
          mr: "अंतर दोन्हीकडे 120 किमी: 120 ÷ 60 = 2 तास. 4.5 वेळ वेगासोबत वाढवतो — व्यस्त जोडीवर समानुपाताची सवय. आधी विचारा: गुणाकार स्थिर राहतो की गुणोत्तर?",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A 6-ft pole casts a 4-ft shadow. At the same hour a tower's shadow is 60 ft. How tall is the tower?",
          hi: "6 फ़ुट का खंभा 4 फ़ुट की छाया डालता है। उसी घड़ी मीनार की छाया 60 फ़ुट है। मीनार कितनी ऊँची?",
          mr: "6 फूट खांब 4 फूट सावली टाकतो. त्याच वेळी मनोऱ्याची सावली 60 फूट आहे. मनोरा किती उंच?",
        },
        answer: 90,
        wrong: [40, 100, 240],
        checkExpr: "6*60/4",
        solution: {
          en: "The sun grants everything the same ratio: height/shadow = 6/4 = 1.5, so the tower is 60 × 1.5 = 90 ft. One pole and one hour measure a tower no ladder reaches — proportion as a surveying tool.",
          hi: "सूरज सबको एक ही अनुपात देता है: ऊँचाई/छाया = 6/4 = 1.5, अतः मीनार 60 × 1.5 = 90 फ़ुट। एक खंभा और एक घड़ी उस मीनार को नाप देते हैं जहाँ कोई सीढ़ी नहीं पहुँचती — अनुपात बतौर सर्वेक्षण-औज़ार।",
          mr: "सूर्य साऱ्यांना एकच गुणोत्तर देतो: उंची/सावली = 6/4 = 1.5, म्हणून मनोरा 60 × 1.5 = 90 फूट. एक खांब आणि एक घटका ती मनोरा मोजतात जिथे कोणतीही शिडी पोहोचत नाही — मोजणी-हत्यार म्हणून प्रमाण.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 13 — Direct and Inverse Proportions",
      name: "Direct and Inverse Proportions",
      slug: "maths-8-direct-inverse-proportions",
      summary:
        "Two kinds of together: ratios that hold and products that hold, hostels and pipes on the see-saw — and a tower measured by its shadow with no ladder at all.",
      position: 13,
      translations: {
        hi: {
          name: "सीधा और प्रतिलोम समानुपात",
          summary:
            "साथ चलने के दो ढंग: टिके अनुपात और टिके गुणनफल, झूले पर छात्रावास और पाइप — और बिना किसी सीढ़ी के छाया से नपी मीनार।",
        },
        mr: {
          name: "समानुपात आणि व्यस्तानुपात",
          summary:
            "सोबत चालण्याच्या दोन रीती: टिकणारी गुणोत्तरे आणि टिकणारे गुणाकार, झोक्यावरची वसतिगृहे आणि पाइप — आणि कोणत्याही शिडीशिवाय सावलीने मोजलेला मनोरा.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 14 — Factorisation (multiplication run backwards)                 */
/* ------------------------------------------------------------------------- */
function factorisation8(): TopicFileOut {
  const rand = rng("maths-8-factorisation");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the greatest common factor of 12x and 18y?",
          hi: "12x और 18y का महत्तम समापवर्तक क्या है?",
          mr: "12x आणि 18y चा महत्तम सामाईक अवयव काय?",
        },
        answer: 6,
        wrong: [3, 12, 36],
        solution: {
          en: "The numbers share 6; the letters share nothing: GCF = 6. 36 is the LCM wearing the wrong hat.",
          hi: "संख्याएँ 6 बाँटती हैं; अक्षरों में कुछ साझा नहीं: म.स. = 6। 36 ग़लत टोपी पहने ल.स. है।",
          mr: "संख्या 6 वाटतात; अक्षरांत काही सामाईक नाही: म.सा.वि. = 6. 36 हा चुकीची टोपी घातलेला ल.सा.वि.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "5x + 20 = 5(x + ▢). What fills the box?",
          hi: "5x + 20 = 5(x + ▢)। रिक्त में क्या आएगा?",
          mr: "5x + 20 = 5(x + ▢). रिकाम्यात काय येईल?",
        },
        answer: 4,
        wrong: [15, 5, 25],
        checkExpr: "20/5",
        solution: {
          en: "Pull the 5 out of both terms: 20 ÷ 5 = 4. 15 subtracts the 5 instead of dividing by it.",
          hi: "दोनों पदों से 5 बाहर खींचिए: 20 ÷ 5 = 4। 15 पाँच से भाग देने की जगह उसे घटा देता है।",
          mr: "दोन्ही पदांतून 5 बाहेर काढा: 20 ÷ 5 = 4. 15 पाचाने भागण्याऐवजी तो वजा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "x² + 5x = x(x + ▢). What fills the box?",
          hi: "x² + 5x = x(x + ▢)। रिक्त में क्या आएगा?",
          mr: "x² + 5x = x(x + ▢). रिकाम्यात काय येईल?",
        },
        answer: 5,
        wrong: [1, 6, 4],
        solution: {
          en: "Each term surrenders one x: x² gives x, 5x gives 5. Multiply back — x² + 5x ✓ — factoring is checked by undoing it.",
          hi: "हर पद एक x सौंपता है: x² देता है x, 5x देता है 5। वापस गुणिए — x² + 5x ✓ — गुणनखंडन उसे उलटकर ही जाँचा जाता है।",
          mr: "प्रत्येक पद एक x देते: x² देतो x, 5x देतो 5. परत गुणा — x² + 5x ✓ — अवयव पाडणे ते उलटूनच तपासले जाते.",
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
          en: "x² − 9 = (x + 3)(x − ▢). What fills the box?",
          hi: "x² − 9 = (x + 3)(x − ▢)। रिक्त में क्या आएगा?",
          mr: "x² − 9 = (x + 3)(x − ▢). रिकाम्यात काय येईल?",
        },
        answer: 3,
        wrong: [9, 6, 1],
        solution: {
          en: "Difference of squares: a² − b² = (a + b)(a − b) with b = √9 = 3. 9 forgets that the identity wants the ROOT.",
          hi: "वर्गों का अंतर: a² − b² = (a + b)(a − b), जहाँ b = √9 = 3। 9 भूल जाता है कि सर्वसमिका मूल माँगती है।",
          mr: "वर्गांचा फरक: a² − b² = (a + b)(a − b), जिथे b = √9 = 3. 9 विसरतो की नित्यसमीकरण मूळ मागते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "x² + 7x + 10 = (x + 2)(x + ▢). What fills the box?",
          hi: "x² + 7x + 10 = (x + 2)(x + ▢)। रिक्त में क्या आएगा?",
          mr: "x² + 7x + 10 = (x + 2)(x + ▢). रिकाम्यात काय येईल?",
        },
        answer: 5,
        wrong: [7, 10, 3],
        checkExpr: "10/2",
        solution: {
          en: "The pair must multiply to 10 and add to 7: 2 and 5. The partner of 2 is 10 ÷ 2 = 5, and 2 + 5 = 7 ✓.",
          hi: "जोड़ी का गुणनफल 10 और योग 7 चाहिए: 2 और 5। 2 का साथी 10 ÷ 2 = 5, और 2 + 5 = 7 ✓।",
          mr: "जोडीचा गुणाकार 10 आणि बेरीज 7 हवी: 2 आणि 5. 2 चा जोडीदार 10 ÷ 2 = 5, आणि 2 + 5 = 7 ✓.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "12a²b ÷ 4ab = ▢a. What is the coefficient in the box?",
          hi: "12a²b ÷ 4ab = ▢a। रिक्त में गुणांक क्या आएगा?",
          mr: "12a²b ÷ 4ab = ▢a. रिकाम्यात सहगुणक काय येईल?",
        },
        answer: 3,
        wrong: [8, 4, 16],
        checkExpr: "12/4",
        solution: {
          en: "Numbers divide (12 ÷ 4 = 3), one a survives, the b's cancel: 3a. 8 subtracts the coefficients instead of dividing.",
          hi: "संख्याएँ भाग होती हैं (12 ÷ 4 = 3), एक a बचता है, b कट जाते हैं: 3a। 8 गुणांकों को भाग की जगह घटा देता है।",
          mr: "संख्या भागल्या जातात (12 ÷ 4 = 3), एक a उरतो, b रद्द होतात: 3a. 8 सहगुणकांना भागाऐवजी वजा करतो.",
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
          en: "x² + 6x + 9 = (x + ▢)². What fills the box?",
          hi: "x² + 6x + 9 = (x + ▢)²। रिक्त में क्या आएगा?",
          mr: "x² + 6x + 9 = (x + ▢)². रिकाम्यात काय येईल?",
        },
        answer: 3,
        wrong: [9, 6, 4.5],
        checkExpr: "9/3",
        solution: {
          en: "A perfect square: the constant is 3² and the middle term 2 × 3 × x checks out. 6 reads the middle coefficient without halving it.",
          hi: "पूर्ण वर्ग: अचर 3² है और बीच का पद 2 × 3 × x मेल खाता है। 6 बीच का गुणांक बिना आधा किए पढ़ लेता है।",
          mr: "पूर्ण वर्ग: स्थिरांक 3² आहे आणि मधले पद 2 × 3 × x जुळते. 6 मधला सहगुणक निम्मा न करता वाचतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "x² − x − 12 = (x − 4)(x + ▢). What fills the box?",
          hi: "x² − x − 12 = (x − 4)(x + ▢)। रिक्त में क्या आएगा?",
          mr: "x² − x − 12 = (x − 4)(x + ▢). रिकाम्यात काय येईल?",
        },
        answer: 3,
        wrong: [4, 12, 6],
        checkExpr: "4-1",
        solution: {
          en: "Need product −12 and sum −1: the pair is −4 and +3. Check the middle: −4x + 3x = −x ✓.",
          hi: "गुणनफल −12 और योग −1 चाहिए: जोड़ी −4 और +3। बीच जाँचिए: −4x + 3x = −x ✓।",
          mr: "गुणाकार −12 आणि बेरीज −1 हवी: जोडी −4 आणि +3. मध्य तपासा: −4x + 3x = −x ✓.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "(7x² + 14x) ÷ 7x = x + ▢. What fills the box?",
          hi: "(7x² + 14x) ÷ 7x = x + ▢। रिक्त में क्या आएगा?",
          mr: "(7x² + 14x) ÷ 7x = x + ▢. रिकाम्यात काय येईल?",
        },
        answer: 2,
        wrong: [7, 14, 1],
        checkExpr: "14/7",
        solution: {
          en: "Factor first: 7x(x + 2) ÷ 7x = x + 2. Division by a monomial must serve EVERY term — 14x ÷ 7x = 2 pays its share.",
          hi: "पहले गुणनखंड: 7x(x + 2) ÷ 7x = x + 2। एकपदी से भाग हर पद तक पहुँचना चाहिए — 14x ÷ 7x = 2 अपना हिस्सा चुकाता है।",
          mr: "आधी अवयव: 7x(x + 2) ÷ 7x = x + 2. एकपदीने भाग प्रत्येक पदापर्यंत पोहोचला पाहिजे — 14x ÷ 7x = 2 आपला वाटा देतो.",
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
          en: "A student 'simplifies' (x + 2)(x + 3) to x² + 6, dropping the middle term. At x = 10 the CORRECT value is?",
          hi: "एक विद्यार्थी (x + 2)(x + 3) को बीच का पद गिराकर x² + 6 'सरल' कर देता है। x = 10 पर सही मान कितना?",
          mr: "एक विद्यार्थी (x + 2)(x + 3) ला मधले पद गाळून x² + 6 'सोपे' करतो. x = 10 वर बरोबर किंमत किती?",
        },
        answer: 156,
        wrong: [106, 60, 136],
        checkExpr: "12*13",
        solution: {
          en: "(10 + 2)(10 + 3) = 12 × 13 = 156. The dropped 5x was worth 50 — exactly the gap to the wrong 106. Numbers audit algebra.",
          hi: "(10 + 2)(10 + 3) = 12 × 13 = 156। गिराया गया 5x 50 का था — ठीक ग़लत 106 तक का फ़ासला। संख्याएँ बीजगणित की लेखा-जाँच करती हैं।",
          mr: "(10 + 2)(10 + 3) = 12 × 13 = 156. गाळलेले 5x 50 चे होते — नेमके चुकीच्या 106 पर्यंतचे अंतर. संख्या बीजगणिताची तपासणी करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Recognise the pattern and evaluate: 5² − 2×5×3 + 3².",
          hi: "पैटर्न पहचानकर मान निकालिए: 5² − 2×5×3 + 3²।",
          mr: "नमुना ओळखून किंमत काढा: 5² − 2×5×3 + 3².",
        },
        answer: 4,
        wrong: [64, 16, 2],
        checkExpr: "2*2",
        solution: {
          en: "It is (5 − 3)² = 2² = 4 — the identity read in reverse. 64 computes (5 + 3)², missing the minus in the middle.",
          hi: "यह (5 − 3)² = 2² = 4 है — उल्टी पढ़ी सर्वसमिका। 64 (5 + 3)² निकालता है, बीच का ऋण चूककर।",
          mr: "हे (5 − 3)² = 2² = 4 — उलटे वाचलेले नित्यसमीकरण. 64 (5 + 3)² काढतो, मधले ऋण चुकवून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "z² − 4z − 12 = (z − 6)(z + ▢). What fills the box?",
          hi: "z² − 4z − 12 = (z − 6)(z + ▢)। रिक्त में क्या आएगा?",
          mr: "z² − 4z − 12 = (z − 6)(z + ▢). रिकाम्यात काय येईल?",
        },
        answer: 2,
        wrong: [6, 12, 4],
        checkExpr: "6-4",
        solution: {
          en: "Product −12, sum −4: the pair is −6 and +2. The middle confirms: −6z + 2z = −4z ✓.",
          hi: "गुणनफल −12, योग −4: जोड़ी −6 और +2। बीच पुष्टि करता है: −6z + 2z = −4z ✓।",
          mr: "गुणाकार −12, बेरीज −4: जोडी −6 आणि +2. मध्य पुष्टी करतो: −6z + 2z = −4z ✓.",
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
          en: "By grouping, ab + bc + ad + cd = (a + c)(b + d). Verify at a=1, b=2, c=3, d=4: what value do BOTH sides give?",
          hi: "समूहन से ab + bc + ad + cd = (a + c)(b + d)। a=1, b=2, c=3, d=4 पर जाँचिए: दोनों पक्ष क्या मान देते हैं?",
          mr: "गटांनी ab + bc + ad + cd = (a + c)(b + d). a=1, b=2, c=3, d=4 वर तपासा: दोन्ही बाजू काय किंमत देतात?",
        },
        answer: 24,
        wrong: [10, 14, 30],
        checkExpr: "4*6",
        solution: {
          en: "Left: 2 + 6 + 4 + 12 = 24; right: 4 × 6 = 24 ✓. Grouping is rearrangement, so the value must survive — a mismatch would convict the factoring.",
          hi: "बायाँ: 2 + 6 + 4 + 12 = 24; दायाँ: 4 × 6 = 24 ✓। समूहन पुनर्व्यवस्था है, अतः मान बचना ही चाहिए — बेमेल गुणनखंडन को दोषी ठहरा देता।",
          mr: "डावी: 2 + 6 + 4 + 12 = 24; उजवी: 4 × 6 = 24 ✓. गट करणे म्हणजे पुनर्रचना, म्हणून किंमत टिकलीच पाहिजे — विसंगती अवयवांना दोषी ठरवली असती.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "(x² − 25) ÷ (x + 5) = x − ▢. What fills the box?",
          hi: "(x² − 25) ÷ (x + 5) = x − ▢। रिक्त में क्या आएगा?",
          mr: "(x² − 25) ÷ (x + 5) = x − ▢. रिकाम्यात काय येईल?",
        },
        answer: 5,
        wrong: [25, 10, 1],
        solution: {
          en: "Factor the top: (x + 5)(x − 5), and the (x + 5) cancels: quotient x − 5. Division of polynomials is factorisation wearing its work clothes.",
          hi: "अंश का गुणनखंड: (x + 5)(x − 5), और (x + 5) कट जाता है: भागफल x − 5। बहुपदों का भाग काम के कपड़े पहने गुणनखंडन ही है।",
          mr: "अंशाचे अवयव: (x + 5)(x − 5), आणि (x + 5) रद्द होतो: भागफल x − 5. बहुपदींचा भाग म्हणजे कामाचे कपडे घातलेले अवयव पाडणे.",
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
          en: "Why can 3x + 5 NOT be factorised over whole numbers? The only common factor its terms share is —",
          hi: "3x + 5 का पूर्ण संख्याओं में गुणनखंडन क्यों नहीं हो सकता? उसके पदों का इकलौता समापवर्तक है —",
          mr: "3x + 5 चे पूर्ण संख्यांत अवयव का पाडता येत नाहीत? त्याच्या पदांचा एकमेव सामाईक अवयव आहे —",
        },
        answer: 1,
        wrong: [3, 5, 15],
        solution: {
          en: "3 and 5 share only 1, and no identity-pattern fits: 3x + 5 is irreducible. Factorisation needs something SHARED to pull out — with only 1 on offer, the expression is already in lowest form.",
          hi: "3 और 5 केवल 1 बाँटते हैं, और कोई सर्वसमिका-पैटर्न नहीं बैठता: 3x + 5 अखंडनीय है। गुणनखंडन को खींचने के लिए कुछ साझा चाहिए — केवल 1 मिले तो व्यंजक पहले से ही निम्नतम रूप में है।",
          mr: "3 आणि 5 फक्त 1 वाटतात, आणि कोणताही नित्यसमीकरण-नमुना बसत नाही: 3x + 5 अविभाज्य आहे. अवयव पाडायला काहीतरी सामाईक हवे — फक्त 1 मिळाला तर पदावली आधीच किमान रूपात आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "n² + n is ALWAYS divisible by which number, whatever whole number n is?",
          hi: "n² + n हमेशा किस संख्या से विभाज्य है, n चाहे कोई भी पूर्ण संख्या हो?",
          mr: "n² + n नेहमी कोणत्या संख्येने भाग जाते, n कोणतीही पूर्ण संख्या असो?",
        },
        answer: 2,
        wrong: [3, 4, 6],
        solution: {
          en: "Factor: n² + n = n(n + 1) — a product of CONSECUTIVE numbers, one of which must be even. Factorisation turns an infinite claim into one visible reason.",
          hi: "गुणनखंड: n² + n = n(n + 1) — क्रमागत संख्याओं का गुणनफल, जिनमें एक सम होगी ही। गुणनखंडन अनंत दावे को एक दिखते कारण में बदल देता है।",
          mr: "अवयव: n² + n = n(n + 1) — क्रमागत संख्यांचा गुणाकार, ज्यांतली एक सम असणारच. अवयव पाडणे अनंत दाव्याला एका दिसणाऱ्या कारणात बदलते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 14 — Factorisation",
      name: "Factorisation",
      slug: "maths-8-factorisation",
      summary:
        "Multiplication run backwards: common factors pulled out, pairs that multiply and add to order, division as cancelling — and n(n+1) proving an infinite claim in one line.",
      position: 14,
      translations: {
        hi: {
          name: "गुणनखंडन",
          summary:
            "उल्टा चलाया गुणा: बाहर खिंचे समापवर्तक, फ़रमाइश पर गुणा-जोड़ करती जोड़ियाँ, कटौती के रूप में भाग — और n(n+1), जो अनंत दावा एक पंक्ति में सिद्ध करता है।",
        },
        mr: {
          name: "अवयव पाडणे",
          summary:
            "उलटा चालवलेला गुणाकार: बाहेर काढलेले सामाईक अवयव, हुकुमावर गुणणाऱ्या-जोडणाऱ्या जोड्या, रद्द करणे म्हणून भागाकार — आणि अनंत दावा एका ओळीत सिद्ध करणारा n(n+1).",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 15 — Introduction to Graphs (pictures with coordinates)           */
/* ------------------------------------------------------------------------- */
function graphs8(): TopicFileOut {
  const rand = rng("maths-8-graphs");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the x-coordinate of the origin?",
          hi: "मूल-बिंदु का x-निर्देशांक क्या है?",
          mr: "आरंभबिंदूचा x-सहनिर्देशक काय?",
        },
        answer: 0,
        wrong: [1, -1, 10],
        solution: {
          en: "The origin is (0, 0) — the corner where both axes meet and all measuring begins.",
          hi: "मूल-बिंदु (0, 0) है — वह कोना जहाँ दोनों अक्ष मिलते हैं और सारी नाप शुरू होती है।",
          mr: "आरंभबिंदू (0, 0) आहे — जिथे दोन्ही अक्ष मिळतात आणि सारी मोजणी सुरू होते तो कोपरा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In the point (3, 5), which number is the x-coordinate?",
          hi: "बिंदु (3, 5) में x-निर्देशांक कौन-सी संख्या है?",
          mr: "बिंदू (3, 5) मध्ये x-सहनिर्देशक कोणती संख्या?",
        },
        answer: 3,
        wrong: [5, 8, 15],
        solution: {
          en: "The first number walks along x, the second climbs y: x = 3. Order is the whole grammar of coordinates — (3, 5) and (5, 3) are different addresses.",
          hi: "पहली संख्या x पर चलती है, दूसरी y पर चढ़ती है: x = 3। क्रम ही निर्देशांकों का पूरा व्याकरण है — (3, 5) और (5, 3) अलग-अलग पते हैं।",
          mr: "पहिली संख्या x वर चालते, दुसरी y वर चढते: x = 3. क्रम हेच सहनिर्देशकांचे सारे व्याकरण — (3, 5) आणि (5, 3) वेगळे पत्ते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The point (0, 4) sits on the y-axis. How far is it from the origin?",
          hi: "बिंदु (0, 4) y-अक्ष पर बैठा है। मूल-बिंदु से कितनी दूर?",
          mr: "बिंदू (0, 4) y-अक्षावर बसला आहे. आरंभबिंदूपासून किती दूर?",
        },
        answer: 4,
        wrong: [0, 3, 5],
        checkExpr: "0+4",
        solution: {
          en: "On the axis, distance is just the coordinate: 4 units up. 0 reads the x instead of the y.",
          hi: "अक्ष पर दूरी निर्देशांक ही है: 4 इकाई ऊपर। 0 y की जगह x पढ़ लेता है।",
          mr: "अक्षावर अंतर म्हणजे सहनिर्देशकच: 4 एकके वर. 0 y ऐवजी x वाचतो.",
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
          en: "How far apart are the points (2, 3) and (2, 7)?",
          hi: "बिंदु (2, 3) और (2, 7) एक-दूसरे से कितनी दूर हैं?",
          mr: "बिंदू (2, 3) आणि (2, 7) एकमेकांपासून किती दूर आहेत?",
        },
        answer: 4,
        wrong: [5, 9, 2],
        checkExpr: "7-3",
        solution: {
          en: "Same x, so the gap is vertical: 7 − 3 = 4 units. The pair rides one vertical line — only the y's differ.",
          hi: "x समान, अतः फ़ासला खड़ा है: 7 − 3 = 4 इकाई। जोड़ी एक खड़ी रेखा पर सवार है — केवल y अलग हैं।",
          mr: "x समान, म्हणून अंतर उभे: 7 − 3 = 4 एकके. जोडी एका उभ्या रेषेवर स्वार — फक्त y वेगळे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A fare graph charges ₹5 per km. What fare does it show for 7 km?",
          hi: "किराया-ग्राफ़ ₹5 प्रति किमी दिखाता है। 7 किमी का किराया कितना दिखेगा?",
          mr: "भाडे-आलेख ₹5 प्रति किमी दाखवतो. 7 किमीचे भाडे किती दिसेल?",
        },
        answer: 35,
        wrong: [12, 57, 75],
        checkExpr: "5*7",
        fmt: rupees,
        solution: {
          en: "The line rises ₹5 for every km: 5 × 7 = ₹35. Reading a straight-through-origin graph IS multiplication.",
          hi: "रेखा हर किमी पर ₹5 चढ़ती है: 5 × 7 = ₹35। मूल-बिंदु से गुज़रती सीधी रेखा को पढ़ना गुणा ही है।",
          mr: "रेषा दर किमीला ₹5 चढते: 5 × 7 = ₹35. आरंभबिंदूतून जाणारी सरळ रेषा वाचणे म्हणजे गुणाकारच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The point (4, 0) lies on the x-axis. How far is it from the origin?",
          hi: "बिंदु (4, 0) x-अक्ष पर है। मूल-बिंदु से कितनी दूर?",
          mr: "बिंदू (4, 0) x-अक्षावर आहे. आरंभबिंदूपासून किती दूर?",
        },
        answer: 4,
        wrong: [0, 8, 2],
        solution: {
          en: "Zero height, four along: distance 4. Any point with y = 0 lives ON the x-axis — the zero names the axis.",
          hi: "ऊँचाई शून्य, चार आगे: दूरी 4। जिस बिंदु का y = 0 हो वह x-अक्ष पर ही बसता है — शून्य ही अक्ष का नाम बताता है।",
          mr: "उंची शून्य, चार पुढे: अंतर 4. ज्याचा y = 0 तो बिंदू x-अक्षावरच राहतो — शून्यच अक्षाचे नाव सांगते.",
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
          en: "A simple-interest graph for a ₹100 deposit passes through (1 year, ₹110). Reading the same line, what is the value at 3 years?",
          hi: "₹100 जमा का साधारण-ब्याज ग्राफ़ (1 वर्ष, ₹110) से गुज़रता है। उसी रेखा को पढ़कर 3 वर्ष पर मान कितना?",
          mr: "₹100 ठेवीचा सरळ-व्याज आलेख (1 वर्ष, ₹110) मधून जातो. तीच रेषा वाचून 3 वर्षांवर किंमत किती?",
        },
        answer: 130,
        wrong: [110, 120, 133],
        checkExpr: "100+10*3",
        fmt: rupees,
        solution: {
          en: "The line climbs ₹10 a year from 100: at 3 years, 100 + 30 = ₹130. 133 sneaks in compound interest — that curve bends, this line doesn't.",
          hi: "रेखा 100 से हर वर्ष ₹10 चढ़ती है: 3 वर्ष पर 100 + 30 = ₹130। 133 चुपके से चक्रवृद्धि घुसा देता है — वह वक्र मुड़ता है, यह रेखा नहीं।",
          mr: "रेषा 100 पासून दरवर्षी ₹10 चढते: 3 वर्षांवर 100 + 30 = ₹130. 133 हळूच चक्रवाढ घुसवतो — तो वक्र वाकतो, ही रेषा नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A distance-time line runs through (0, 0) and (2 h, 60 km). What speed does it show, in km/h?",
          hi: "दूरी-समय रेखा (0, 0) और (2 घंटे, 60 किमी) से गुज़रती है। वह कितनी चाल दिखाती है, किमी/घंटा में?",
          mr: "अंतर-काळ रेषा (0, 0) आणि (2 तास, 60 किमी) मधून जाते. ती किती वेग दाखवते, किमी/तासात?",
        },
        answer: 30,
        wrong: [60, 120, 15],
        checkExpr: "60/2",
        solution: {
          en: "Speed is the slope: 60 km in 2 h = 30 km/h. 60 reads the endpoint's height as if time were one hour.",
          hi: "चाल ढलान है: 2 घंटे में 60 किमी = 30 किमी/घंटा। 60 सिरे की ऊँचाई को यों पढ़ता है मानो समय एक घंटा हो।",
          mr: "वेग म्हणजे उतार: 2 तासांत 60 किमी = 30 किमी/तास. 60 टोकाची उंची अशी वाचतो जणू वेळ एक तास असावा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In which quadrant (1, 2, 3 or 4) does the point (−3, 5) lie?",
          hi: "बिंदु (−3, 5) किस चतुर्थांश (1, 2, 3 या 4) में है?",
          mr: "बिंदू (−3, 5) कोणत्या चरणात (1, 2, 3 वा 4) आहे?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        solution: {
          en: "x negative, y positive: left and up — the second quadrant. The quadrants number anticlockwise from the positive-positive first.",
          hi: "x ऋण, y धन: बाएँ और ऊपर — दूसरा चतुर्थांश। चतुर्थांश धन-धन वाले पहले से वामावर्त गिने जाते हैं।",
          mr: "x ऋण, y धन: डावीकडे आणि वर — दुसरे चरण. चरणे धन-धन पहिल्यापासून घड्याळाच्या उलट मोजली जातात.",
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
          en: "Three corners of a rectangle sit at (1,1), (5,1) and (5,4). What is the x-coordinate of the fourth corner?",
          hi: "आयत के तीन कोने (1,1), (5,1) और (5,4) पर हैं। चौथे कोने का x-निर्देशांक क्या है?",
          mr: "आयताचे तीन कोपरे (1,1), (5,1) आणि (5,4) वर आहेत. चौथ्या कोपऱ्याचा x-सहनिर्देशक काय?",
        },
        answer: 1,
        wrong: [5, 4, 0],
        solution: {
          en: "The fourth corner is (1, 4): it borrows x from the corner below it and y from the corner across. Rectangles copy coordinates in pairs.",
          hi: "चौथा कोना (1, 4) है: x नीचे वाले कोने से, y सामने वाले से उधार लेता है। आयत निर्देशांक जोड़ों में नक़ल करते हैं।",
          mr: "चौथा कोपरा (1, 4): x खालच्या कोपऱ्याकडून, y समोरच्याकडून उसना घेतो. आयत सहनिर्देशक जोड्यांत नक्कल करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A line passes through (0,2), (1,5) and (2,8). Following the pattern, what is y when x = 4?",
          hi: "एक रेखा (0,2), (1,5) और (2,8) से गुज़रती है। पैटर्न के अनुसार x = 4 पर y कितना?",
          mr: "एक रेषा (0,2), (1,5) आणि (2,8) मधून जाते. नमुन्यानुसार x = 4 वर y किती?",
        },
        answer: 14,
        wrong: [11, 16, 12],
        checkExpr: "3*4+2",
        solution: {
          en: "Each step right climbs 3: the rule is y = 3x + 2, so y(4) = 14. 11 stops a step early at x = 3.",
          hi: "हर दायाँ क़दम 3 चढ़ता है: नियम y = 3x + 2, अतः y(4) = 14। 11 x = 3 पर एक क़दम पहले रुक जाता है।",
          mr: "प्रत्येक उजवे पाऊल 3 चढते: नियम y = 3x + 2, म्हणून y(4) = 14. 11 x = 3 वर एक पाऊल आधी थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Walk from (0,0) to (3,0), then up to (3,4). What is the STRAIGHT-LINE distance back to the origin?",
          hi: "(0,0) से (3,0), फिर ऊपर (3,4) तक चलिए। मूल-बिंदु तक सीधी दूरी कितनी?",
          mr: "(0,0) पासून (3,0), मग वर (3,4) पर्यंत चला. आरंभबिंदूपर्यंत सरळ अंतर किती?",
        },
        answer: 5,
        wrong: [7, 12, 4],
        solution: {
          en: "The walk drew two legs of a right triangle, 3 and 4: the straight way home is the hypotenuse, 5 — Pythagoras visiting the graph paper.",
          hi: "चाल ने समकोण त्रिभुज की दो भुजाएँ खींचीं, 3 और 4: घर की सीधी राह कर्ण है, 5 — ग्राफ़-काग़ज़ पर पाइथागोरस पधारे।",
          mr: "चालीने काटकोन त्रिकोणाच्या दोन बाजू काढल्या, 3 आणि 4: घरची सरळ वाट कर्ण, 5 — आलेख-कागदावर पायथागोरस आले.",
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
          en: "A conversion graph uses 5 miles = 8 km. Reading it at 40 km, how many miles?",
          hi: "परिवर्तन-ग्राफ़ 5 मील = 8 किमी मानता है। 40 किमी पर पढ़ें तो कितने मील?",
          mr: "रूपांतर-आलेख 5 मैल = 8 किमी मानतो. 40 किमीवर वाचल्यास किती मैल?",
        },
        answer: 25,
        wrong: [64, 32, 20],
        checkExpr: "5*40/8",
        solution: {
          en: "40 km is five lots of 8 km, each worth 5 miles: 25 miles. 64 converts the wrong way, multiplying where the graph divides.",
          hi: "40 किमी यानी 8-8 किमी के पाँच हिस्से, हर एक 5 मील का: 25 मील। 64 उल्टी दिशा में बदलता है, जहाँ ग्राफ़ भाग देता है वहाँ गुणा करके।",
          mr: "40 किमी म्हणजे 8-8 किमीचे पाच वाटे, प्रत्येक 5 मैलांचा: 25 मैल. 64 उलट्या दिशेने बदलतो, आलेख जिथे भागतो तिथे गुणून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A temperature graph rises steadily 2° per hour from 24° at 6 am. How many HOURS after 6 am does it reach 32°?",
          hi: "तापमान-ग्राफ़ सुबह 6 बजे के 24° से हर घंटे 2° चढ़ता है। 32° तक पहुँचने में 6 बजे से कितने घंटे लगेंगे?",
          mr: "तापमान-आलेख सकाळी 6 च्या 24° पासून दर तासाला 2° चढतो. 32° गाठायला 6 पासून किती तास लागतील?",
        },
        answer: 4,
        wrong: [8, 2, 6],
        checkExpr: "(32-24)/2",
        solution: {
          en: "The climb needed is 8°, at 2° per hour: 4 hours, so 10 am. 8 answers the degrees, not the hours — read the axis you were asked for.",
          hi: "चढ़ाई 8° की चाहिए, 2° प्रति घंटा से: 4 घंटे, यानी 10 बजे। 8 डिग्रियाँ बताता है, घंटे नहीं — वही अक्ष पढ़िए जो पूछा गया।",
          mr: "चढण 8° ची हवी, दर तासाला 2° ने: 4 तास, म्हणजे सकाळी 10. 8 अंश सांगतो, तास नाही — विचारलेलाच अक्ष वाचा.",
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
          en: "The steeper a distance-time line, the faster the motion. A sprinter covers 10 m in 0.1 s near the finish — what near-vertical speed is that, in m/s?",
          hi: "दूरी-समय रेखा जितनी खड़ी, गति उतनी तेज़। फ़िनिश के पास धावक 0.1 सेकंड में 10 मीटर नापता है — वह लगभग-खड़ी चाल कितनी है, मी/से में?",
          mr: "अंतर-काळ रेषा जितकी उभी, गती तितकी जलद. फिनिशजवळ धावपटू 0.1 सेकंदात 10 मीटर कापतो — तो जवळजवळ-उभा वेग किती, मी/से मध्ये?",
        },
        answer: 100,
        wrong: [1, 10, 1000],
        checkExpr: "10/0.1",
        solution: {
          en: "10 ÷ 0.1 = 100 m/s — absurdly fast, which is the lesson: as a line nears vertical its speed runs away toward infinity, and a truly vertical line would claim distance covered in NO time. Graphs forbid it by geometry.",
          hi: "10 ÷ 0.1 = 100 मी/से — बेतुकी तेज़, और यही सबक़ है: रेखा खड़ी होने को हो तो चाल अनंत की ओर भागती है, और सचमुच खड़ी रेखा शून्य समय में दूरी का दावा करती। ग्राफ़ उसे ज्यामिति से ही वर्जित करते हैं।",
          mr: "10 ÷ 0.1 = 100 मी/से — हास्यास्पद जलद, आणि हाच धडा: रेषा उभी होत जाता वेग अनंताकडे पळतो, आणि खरोखर उभी रेषा शून्य वेळात अंतराचा दावा करती. आलेख तिला भूमितीनेच निषिद्ध करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A straight line joins (2, 10) and (6, 30). Reading BETWEEN the plotted points, what is y at x = 4?",
          hi: "सीधी रेखा (2, 10) और (6, 30) को जोड़ती है। अंकित बिंदुओं के बीच पढ़ें तो x = 4 पर y कितना?",
          mr: "सरळ रेषा (2, 10) आणि (6, 30) ला जोडते. आखलेल्या बिंदूंच्या मध्ये वाचल्यास x = 4 वर y किती?",
        },
        answer: 20,
        wrong: [15, 25, 40],
        checkExpr: "(10+30)/2",
        solution: {
          en: "x = 4 is midway between 2 and 6, and on a straight line midway-in means midway-up: (10 + 30)/2 = 20. Interpolation is the graph's quiet gift — values you never measured, read off the ruler.",
          hi: "x = 4 2 और 6 के बीचोबीच है, और सीधी रेखा पर बीच का x यानी बीच का y: (10 + 30)/2 = 20। अंतर्वेशन ग्राफ़ की ख़ामोश सौग़ात है — जो मान कभी नापे नहीं, पैमाने से पढ़ लिए।",
          mr: "x = 4 2 आणि 6 च्या मध्यभागी, आणि सरळ रेषेवर मधला x म्हणजे मधला y: (10 + 30)/2 = 20. अंतर्वेशन ही आलेखाची मूक देणगी — कधी न मोजलेल्या किमती, पट्टीवरून वाचलेल्या.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 15 — Introduction to Graphs",
      name: "Introduction to Graphs",
      slug: "maths-8-graphs",
      summary:
        "Coordinates as addresses, slopes as speeds and rates, rectangles copying corners — and interpolation reading values nobody ever measured.",
      position: 15,
      translations: {
        hi: {
          name: "आलेखों से परिचय",
          summary:
            "पतों के रूप में निर्देशांक, चाल और दर के रूप में ढलानें, कोने नक़ल करते आयत — और अंतर्वेशन, जो कभी न नापे गए मान पढ़ लेता है।",
        },
        mr: {
          name: "आलेखांची ओळख",
          summary:
            "पत्ते म्हणून सहनिर्देशक, वेग आणि दर म्हणून उतार, कोपरे नक्कल करणारे आयत — आणि कोणी कधी न मोजलेल्या किमती वाचणारे अंतर्वेशन.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 16 — Playing with Numbers (digits under oath)                     */
/* ------------------------------------------------------------------------- */
function playingWithNumbers8(): TopicFileOut {
  const rand = rng("maths-8-playing-with-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Write 47 in the general form 10a + b. What is a?",
          hi: "47 को सामान्य रूप 10a + b में लिखिए। a क्या है?",
          mr: "47 ला सामान्य रूप 10a + b मध्ये लिहा. a काय?",
        },
        answer: 4,
        wrong: [7, 47, 10],
        solution: {
          en: "47 = 10 × 4 + 7: the tens digit a is 4, the units digit b is 7. The general form is how algebra gets its hands on digits.",
          hi: "47 = 10 × 4 + 7: दहाई a है 4, इकाई b है 7। सामान्य रूप ही वह राह है जिससे बीजगणित अंकों तक हाथ पहुँचाता है।",
          mr: "47 = 10 × 4 + 7: दशक a म्हणजे 4, एकक b म्हणजे 7. सामान्य रूप हीच ती वाट जिने बीजगणित अंकांपर्यंत हात पोहोचवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the digit-sum of 729?",
          hi: "729 का अंक-योग क्या है?",
          mr: "729 ची अंक-बेरीज किती?",
        },
        answer: 18,
        wrong: [17, 9, 19],
        checkExpr: "7+2+9",
        solution: {
          en: "7 + 2 + 9 = 18, itself divisible by 9 — so 729 is too (it is 27²). The digit-sum is divisibility's fastest witness.",
          hi: "7 + 2 + 9 = 18, जो स्वयं 9 से विभाज्य है — अतः 729 भी (वह 27² है)। अंक-योग विभाज्यता का सबसे तेज़ गवाह है।",
          mr: "7 + 2 + 9 = 18, जे स्वतः 9 ने भाग जाते — म्हणून 729 ही (ते 27² आहे). अंक-बेरीज ही भाज्यतेची सर्वांत जलद साक्षीदार.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A two-digit number plus its reverse is always 11 × (digit sum). Compute 35 + 53.",
          hi: "दो अंकों की संख्या और उसका पलटा रूप जोड़ने पर सदा 11 × (अंक-योग) मिलता है। 35 + 53 निकालिए।",
          mr: "दोन अंकी संख्या आणि तिचे उलटे रूप जोडल्यास नेहमी 11 × (अंक-बेरीज) मिळते. 35 + 53 काढा.",
        },
        answer: 88,
        wrong: [98, 78, 80],
        checkExpr: "35+53",
        solution: {
          en: "35 + 53 = 88 = 11 × 8, and 8 is 3 + 5 ✓ — the general form (10a + b) + (10b + a) = 11(a + b) promised it.",
          hi: "35 + 53 = 88 = 11 × 8, और 8 है 3 + 5 ✓ — सामान्य रूप (10a + b) + (10b + a) = 11(a + b) ने यही वादा किया था।",
          mr: "35 + 53 = 88 = 11 × 8, आणि 8 म्हणजे 3 + 5 ✓ — सामान्य रूप (10a + b) + (10b + a) = 11(a + b) ने हेच वचन दिले होते.",
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
          en: "For digits a = 6, b = 2: (10a + b) − (10b + a) = 9 × (a − b). What is the value?",
          hi: "अंक a = 6, b = 2 के लिए: (10a + b) − (10b + a) = 9 × (a − b)। मान कितना?",
          mr: "अंक a = 6, b = 2 साठी: (10a + b) − (10b + a) = 9 × (a − b). किंमत किती?",
        },
        answer: 36,
        wrong: [44, 40, 4],
        checkExpr: "9*4",
        solution: {
          en: "62 − 26 = 36 = 9 × 4 ✓. Reversal differences are ALWAYS multiples of 9 — the identity guarantees what no amount of checking could.",
          hi: "62 − 26 = 36 = 9 × 4 ✓। पलट-अंतर सदा 9 के गुणज होते हैं — सर्वसमिका वह पक्का करती है जो कोई भी जाँच नहीं कर पाती।",
          mr: "62 − 26 = 36 = 9 × 4 ✓. उलट-फरक नेहमी 9 चे पट असतात — नित्यसमीकरण ते पक्के करते जे कितीही तपासण्या करू शकत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the SMALLEST digit ▢ that makes 31▢5 divisible by 9?",
          hi: "कौन-सा छोटे-से-छोटा अंक ▢ 31▢5 को 9 से विभाज्य बनाता है?",
          mr: "कोणता लहानात लहान अंक ▢ 31▢5 ला 9 ने भाग जाईल असे करतो?",
        },
        answer: 0,
        wrong: [9, 1, 3],
        solution: {
          en: "3 + 1 + 5 = 9 already, so ▢ = 0 works (and 9 would too — the question asked for the smallest). Digit-sum arithmetic does all the dividing.",
          hi: "3 + 1 + 5 = 9 पहले से, अतः ▢ = 0 चलता है (9 भी चलता — पर सबसे छोटा पूछा था)। भाग का सारा काम अंक-योग कर देता है।",
          mr: "3 + 1 + 5 = 9 आधीच, म्हणून ▢ = 0 चालतो (9 ही चालला असता — पण लहानात लहान विचारला होता). भागाचे सारे काम अंक-बेरीज करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The test for 11 uses the alternating sum. For 308, compute 3 − 0 + 8.",
          hi: "11 की जाँच एकांतर योग से होती है। 308 के लिए 3 − 0 + 8 निकालिए।",
          mr: "11 ची चाचणी एकांतर बेरजेने होते. 308 साठी 3 − 0 + 8 काढा.",
        },
        answer: 11,
        wrong: [0, 5, 1],
        checkExpr: "3-0+8",
        solution: {
          en: "3 − 0 + 8 = 11, itself a multiple of 11 — so 308 divides by 11 (it is 28 × 11). The alternating sum is 11's private detector.",
          hi: "3 − 0 + 8 = 11, स्वयं 11 का गुणज — अतः 308 11 से विभाजित होता है (वह 28 × 11 है)। एकांतर योग 11 का निजी संसूचक है।",
          mr: "3 − 0 + 8 = 11, स्वतः 11 चा पट — म्हणून 308 ला 11 ने भाग जातो (ते 28 × 11 आहे). एकांतर बेरीज हा 11 चा खासगी शोधक.",
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
          en: "Letter puzzle: A + A + A ends in A itself (a nonzero digit), because 3 × A ends in A. What is A?",
          hi: "अक्षर-पहेली: A + A + A का अंत स्वयं A पर होता है (शून्येतर अंक), क्योंकि 3 × A का अंत A है। A क्या है?",
          mr: "अक्षर-कोडे: A + A + A चा शेवट स्वतः A वर होतो (शून्येतर अंक), कारण 3 × A चा शेवट A आहे. A काय?",
        },
        answer: 5,
        wrong: [0, 2, 3],
        solution: {
          en: "3 × 5 = 15, ending in 5 ✓ — no other nonzero digit survives the test. Puzzles like this are divisibility running in disguise.",
          hi: "3 × 5 = 15, अंत 5 पर ✓ — कोई और शून्येतर अंक इस जाँच से नहीं बचता। ऐसी पहेलियाँ भेस बदले विभाज्यता ही हैं।",
          mr: "3 × 5 = 15, शेवट 5 वर ✓ — दुसरा कोणताही शून्येतर अंक या चाचणीतून वाचत नाही. अशी कोडी म्हणजे वेष बदललेली भाज्यताच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "If 21a5 is divisible by 3 and a is the LARGEST such digit, what is a?",
          hi: "यदि 21a5 3 से विभाज्य है और a ऐसा सबसे बड़ा अंक है, तो a क्या है?",
          mr: "जर 21a5 ला 3 ने भाग जातो आणि a असा सर्वांत मोठा अंक असेल, तर a काय?",
        },
        answer: 7,
        wrong: [4, 1, 9],
        solution: {
          en: "2 + 1 + 5 = 8, so 8 + a must be a multiple of 3: a ∈ {1, 4, 7}, largest 7. 9 pushes the sum to 17 — not a multiple of 3.",
          hi: "2 + 1 + 5 = 8, अतः 8 + a 3 का गुणज हो: a ∈ {1, 4, 7}, सबसे बड़ा 7। 9 योग को 17 पहुँचा देता है — 3 का गुणज नहीं।",
          mr: "2 + 1 + 5 = 8, म्हणून 8 + a 3 चा पट हवा: a ∈ {1, 4, 7}, सर्वांत मोठा 7. 9 बेरीज 17 वर नेतो — 3 चा पट नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "For digits 4 and 9, compute 49 + 94.",
          hi: "अंक 4 और 9 के लिए 49 + 94 निकालिए।",
          mr: "अंक 4 आणि 9 साठी 49 + 94 काढा.",
        },
        answer: 143,
        wrong: [133, 153, 121],
        checkExpr: "49+94",
        solution: {
          en: "49 + 94 = 143 = 11 × 13, and 13 = 4 + 9 ✓ — the 11 × (digit-sum) rule holding even when the sum carries past 9.",
          hi: "49 + 94 = 143 = 11 × 13, और 13 = 4 + 9 ✓ — 11 × (अंक-योग) का नियम तब भी टिका जब योग 9 के पार गया।",
          mr: "49 + 94 = 143 = 11 × 13, आणि 13 = 4 + 9 ✓ — 11 × (अंक-बेरीज) चा नियम बेरीज 9 पलीकडे गेली तरी टिकलेला.",
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
          en: "Three-digit reversal: abc − cba = 99 × (a − c). Compute 852 − 258.",
          hi: "तीन अंकों का पलटा: abc − cba = 99 × (a − c)। 852 − 258 निकालिए।",
          mr: "तीन अंकांचे उलटे: abc − cba = 99 × (a − c). 852 − 258 काढा.",
        },
        answer: 594,
        wrong: [604, 494, 606],
        checkExpr: "852-258",
        solution: {
          en: "852 − 258 = 594 = 99 × 6, and 6 = 8 − 2 ✓. The middle digit vanishes from the formula entirely — it never mattered.",
          hi: "852 − 258 = 594 = 99 × 6, और 6 = 8 − 2 ✓। बीच का अंक सूत्र से पूरी तरह ग़ायब है — उसका कभी महत्व था ही नहीं।",
          mr: "852 − 258 = 594 = 99 × 6, आणि 6 = 8 − 2 ✓. मधला अंक सूत्रातून पूर्ण गायब — त्याला कधी महत्त्वच नव्हते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "1331 passes the 11-test (1 − 3 + 3 − 1 = 0). What is 1331 ÷ 11?",
          hi: "1331 11-जाँच पास करता है (1 − 3 + 3 − 1 = 0)। 1331 ÷ 11 कितना?",
          mr: "1331 11-चाचणी उत्तीर्ण होतो (1 − 3 + 3 − 1 = 0). 1331 ÷ 11 किती?",
        },
        answer: 121,
        wrong: [111, 131, 101],
        checkExpr: "1331/11",
        solution: {
          en: "1331 ÷ 11 = 121 — and the tower goes on: 121 = 11², so 1331 = 11³. The test found the factor; division found the family.",
          hi: "1331 ÷ 11 = 121 — और मीनार आगे बढ़ती है: 121 = 11², अतः 1331 = 11³। जाँच ने गुणनखंड खोजा; भाग ने ख़ानदान।",
          mr: "1331 ÷ 11 = 121 — आणि मनोरा पुढे जातो: 121 = 11², म्हणून 1331 = 11³. चाचणीने अवयव शोधला; भागाने घराणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A number leaves remainder 3 when divided by 9. What remainder does its DIGIT-SUM leave when divided by 9?",
          hi: "एक संख्या 9 से भाग देने पर शेष 3 छोड़ती है। उसका अंक-योग 9 से भाग देने पर क्या शेष छोड़ेगा?",
          mr: "एक संख्या 9 ने भागल्यास बाकी 3 उरते. तिची अंक-बेरीज 9 ने भागल्यास काय बाकी उरेल?",
        },
        answer: 3,
        wrong: [0, 6, 9],
        solution: {
          en: "A number and its digit-sum always share the same remainder mod 9 — because 10, 100, 1000 each leave remainder 1. That secret powers every digit-sum test.",
          hi: "संख्या और उसका अंक-योग 9 के भाग में सदा एक ही शेष बाँटते हैं — क्योंकि 10, 100, 1000 हर एक शेष 1 छोड़ते हैं। यही राज़ हर अंक-योग जाँच को चलाता है।",
          mr: "संख्या आणि तिची अंक-बेरीज 9 च्या भागात नेहमी एकच बाकी वाटतात — कारण 10, 100, 1000 प्रत्येक बाकी 1 ठेवतात. हेच गुपित प्रत्येक अंक-बेरीज चाचणी चालवते.",
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
          en: "Take 62, reverse to 26, subtract: 36. The digits of ANY such difference sum to —",
          hi: "62 लीजिए, पलटकर 26, घटाइए: 36। ऐसे किसी भी अंतर के अंकों का योग होता है —",
          mr: "62 घ्या, उलटवून 26, वजा करा: 36. अशा कोणत्याही फरकाच्या अंकांची बेरीज असते —",
        },
        answer: 9,
        wrong: [6, 18, 12],
        checkExpr: "3+6",
        solution: {
          en: "The difference is always 9(a − b), a multiple of 9 — and every 2-digit multiple of 9 has digit-sum 9. Try any pair; the trick never misses, because the algebra never does.",
          hi: "अंतर सदा 9(a − b) है, 9 का गुणज — और 9 के हर दो-अंकीय गुणज का अंक-योग 9 है। कोई भी जोड़ी आज़माइए; तरकीब कभी नहीं चूकती, क्योंकि बीजगणित कभी नहीं चूकता।",
          mr: "फरक नेहमी 9(a − b), 9 चा पट — आणि 9 च्या प्रत्येक दोन-अंकी पटाची अंक-बेरीज 9. कोणतीही जोडी वापरा; युक्ती कधी चुकत नाही, कारण बीजगणित कधी चुकत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "AB + BA = 121, so A + B = 11. If A = 7, what is B?",
          hi: "AB + BA = 121, अतः A + B = 11। यदि A = 7, तो B क्या?",
          mr: "AB + BA = 121, म्हणून A + B = 11. जर A = 7, तर B काय?",
        },
        answer: 4,
        wrong: [3, 5, 7],
        checkExpr: "11-7",
        solution: {
          en: "11(A + B) = 121 forces A + B = 11, so B = 4. Check: 74 + 47 = 121 ✓ — the letters were digits under oath all along.",
          hi: "11(A + B) = 121 से A + B = 11, अतः B = 4। जाँच: 74 + 47 = 121 ✓ — अक्षर शुरू से हलफ़ पर बँधे अंक थे।",
          mr: "11(A + B) = 121 मुळे A + B = 11, म्हणून B = 4. पडताळणी: 74 + 47 = 121 ✓ — अक्षरे सुरुवातीपासून शपथेवरचे अंक होती.",
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
          en: "The trick 'write any 3-digit number twice, like 583583 — it always divides by 7, 11 AND 13' works because abcabc = abc × ▢. What is the multiplier?",
          hi: "तरकीब 'कोई तीन अंकों की संख्या दो बार लिखिए, जैसे 583583 — वह सदा 7, 11 और 13 से विभाजित होती है' इसलिए चलती है कि abcabc = abc × ▢। गुणक क्या है?",
          mr: "युक्ती 'कोणतीही तीन अंकी संख्या दोनदा लिहा, जसे 583583 — तिला नेहमी 7, 11 आणि 13 ने भाग जातो' म्हणून चालते की abcabc = abc × ▢. गुणक काय?",
        },
        answer: 1001,
        wrong: [111, 101, 10001],
        checkExpr: "7*11*13",
        solution: {
          en: "Writing abc twice multiplies it by 1001, and 1001 = 7 × 11 × 13 — all three divisors ride in automatically. The magician's secret is a factorisation.",
          hi: "abc को दो बार लिखना उसे 1001 से गुणा करना है, और 1001 = 7 × 11 × 13 — तीनों भाजक अपने आप सवार हो जाते हैं। जादूगर का राज़ एक गुणनखंडन है।",
          mr: "abc दोनदा लिहिणे म्हणजे त्याला 1001 ने गुणणे, आणि 1001 = 7 × 11 × 13 — तिन्ही भाजक आपोआप स्वार होतात. जादूगाराचे गुपित म्हणजे एक अवयव-रचना.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Casting out nines checks 1234 × 56 = 69104: reduce 69104's digit-sum (6+9+1+0+4 = 20) mod 9. What does it reduce to?",
          hi: "नौ निकालकर जाँच: 1234 × 56 = 69104 के लिए 69104 का अंक-योग (6+9+1+0+4 = 20) 9 के भाग में घटाइए। क्या बचता है?",
          mr: "नऊ काढून तपासणी: 1234 × 56 = 69104 साठी 69104 ची अंक-बेरीज (6+9+1+0+4 = 20) 9 च्या भागात घटवा. काय उरते?",
        },
        answer: 2,
        wrong: [0, 9, 1],
        checkExpr: "(6+9+1+0+4)-18",
        solution: {
          en: "20 reduces to 2 — and the factors reduce to 1 and 2, whose product is 2 ✓: the multiplication PASSES the nines-check. A mismatch would have proved an error; a match only says 'possibly right' — the old accountants' one-way test.",
          hi: "20 घटकर 2 — और गुणनखंड घटकर 1 और 2, जिनका गुणनफल 2 ✓: गुणा नौ-जाँच पास करता है। बेमेल ग़लती सिद्ध कर देता; मेल केवल कहता है 'शायद सही' — पुराने मुनीमों की एकतरफ़ा जाँच।",
          mr: "20 घटून 2 — आणि घटक घटून 1 आणि 2, ज्यांचा गुणाकार 2 ✓: गुणाकार नऊ-तपासणी उत्तीर्ण. विसंगतीने चूक सिद्ध केली असती; जुळणी फक्त म्हणते 'बहुधा बरोबर' — जुन्या मुनीमांची एकतर्फी चाचणी.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Chapter 16 — Playing with Numbers",
      name: "Playing with Numbers",
      slug: "maths-8-playing-with-numbers",
      summary:
        "Digits put under algebra's oath: reversal sums and differences obeying 11 and 9, letter puzzles as divisibility in disguise — and the magician's 1001 unmasked as 7 × 11 × 13.",
      position: 16,
      translations: {
        hi: {
          name: "संख्याओं के साथ खेल",
          summary:
            "बीजगणित के हलफ़ पर बँधे अंक: 11 और 9 को मानते पलट-योग और अंतर, भेस बदले विभाज्यता जैसी अक्षर-पहेलियाँ — और जादूगर का 1001, जो 7 × 11 × 13 निकला।",
        },
        mr: {
          name: "संख्यांशी खेळ",
          summary:
            "बीजगणिताच्या शपथेवरचे अंक: 11 आणि 9 ला मानणाऱ्या उलट-बेरजा आणि फरक, वेष बदललेल्या भाज्यतेसारखी अक्षर-कोडी — आणि जादूगाराचा 1001, जो 7 × 11 × 13 निघाला.",
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
  cubesAndRoots(),
  comparingQuantities8(),
  algebraicIdentities(),
  mensuration8(),
  exponentsAndPowers8(),
  proportions8(),
  factorisation8(),
  graphs8(),
  playingWithNumbers8(),
];
