/**
 * Class 9 Maths — NCERT, chapter by chapter. The number line fills with
 * irrationals, algebra learns its remainder theorem, geometry gets an
 * axiom-and-proof spine, and points earn addresses. Same discipline as
 * ever — every question authored individually, every computable answer
 * proven by a checkExpr, every wrong option a real fourteen-year-old's slip.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { L, OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 9)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

const deg = (n: number): L => ({ en: `${n}°`, hi: `${n}°`, mr: `${n}°` });

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Number Systems (the line fills with irrationals)              */
/* ------------------------------------------------------------------------- */
function numberSystems(): TopicFileOut {
  const rand = rng("maths-9-number-systems");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Is 0 a rational number? Write it as a fraction ▢/1 — what is the numerator?",
          hi: "क्या 0 परिमेय संख्या है? उसे भिन्न ▢/1 लिखिए — अंश क्या है?",
          mr: "0 ही परिमेय संख्या आहे का? तिला अपूर्णांक ▢/1 लिहा — अंश काय?",
        },
        answer: 0,
        wrong: [1, -1, 10],
        solution: {
          en: "0 = 0/1, a ratio of two integers with non-zero denominator — so yes, rational. Every integer is rational, hiding a denominator of 1.",
          hi: "0 = 0/1, दो पूर्णांकों का अनुपात जिसका हर शून्येतर है — अतः हाँ, परिमेय। हर पूर्णांक परिमेय है, 1 का हर छिपाए हुए।",
          mr: "0 = 0/1, शून्येतर छेद असलेल्या दोन पूर्णांकांचे गुणोत्तर — म्हणून हो, परिमेय. प्रत्येक पूर्णांक परिमेय, 1 चा छेद लपवून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many rational numbers lie between 1 and 2?",
          hi: "1 और 2 के बीच कितनी परिमेय संख्याएँ हैं?",
          mr: "1 आणि 2 च्या दरम्यान किती परिमेय संख्या आहेत?",
        },
        answer: -1,
        wrong: [1, 0, 10],
        fmt: (n) => (n === -1 ? { en: "infinitely many", hi: "अनंत", mr: "अनंत" } : { en: String(n), hi: String(n), mr: String(n) }),
        solution: {
          en: "Between any two rationals sit infinitely many more — average them for one, then average again, without end. The answer 'infinitely many' is coded here as −1.",
          hi: "किन्हीं दो परिमेयों के बीच अनंत और बैठती हैं — एक के लिए औसत लीजिए, फिर फिर औसत, बिना अंत। यहाँ उत्तर 'अनंत' को −1 से कोडित किया है।",
          mr: "कोणत्याही दोन परिमेयांमध्ये अनंत आणखी बसतात — एकासाठी सरासरी घ्या, मग पुन्हा सरासरी, न संपता. इथे उत्तर 'अनंत' −1 ने कोड केले आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "√25 is a rational number. What is its value?",
          hi: "√25 एक परिमेय संख्या है। उसका मान क्या है?",
          mr: "√25 ही परिमेय संख्या आहे. तिची किंमत काय?",
        },
        answer: 5,
        wrong: [12.5, 625, 50],
        checkExpr: "25/5",
        solution: {
          en: "√25 = 5, an integer — a square root is rational exactly when the number is a perfect square. 12.5 halves instead of rooting.",
          hi: "√25 = 5, एक पूर्णांक — वर्गमूल तभी परिमेय है जब संख्या पूर्ण वर्ग हो। 12.5 मूल की जगह आधा करता है।",
          mr: "√25 = 5, एक पूर्णांक — वर्गमूळ तेव्हाच परिमेय जेव्हा संख्या पूर्ण वर्ग असेल. 12.5 मूळाऐवजी अर्धे करतो.",
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
          en: "Which of these is IRRATIONAL: 0.75, √2, 4/3, or 0.333…? Answer the coded index (√2 is 2).",
          hi: "इनमें अपरिमेय कौन: 0.75, √2, 4/3, या 0.333…? कोडित सूचकांक बताइए (√2 का 2)।",
          mr: "यांत अपरिमेय कोण: 0.75, √2, 4/3, की 0.333…? कोड केलेला निर्देशांक द्या (√2 चा 2).",
        },
        answer: 2,
        wrong: [1, 3, 4],
        solution: {
          en: "√2 = 1.41421356… never terminates and never repeats — the mark of an irrational. The other three are neat fractions in disguise.",
          hi: "√2 = 1.41421356… न समाप्त होता है न दोहराता है — अपरिमेय की पहचान। बाक़ी तीन भेस बदले साफ़ भिन्न हैं।",
          mr: "√2 = 1.41421356… ना संपते ना पुनरावृत्त — अपरिमेयाची खूण. बाकी तीन वेष बदललेले नीटस अपूर्णांक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The decimal 0.666… as a fraction is 2/▢. What is the denominator?",
          hi: "दशमलव 0.666… भिन्न में 2/▢ है। हर क्या है?",
          mr: "दशांश 0.666… अपूर्णांकात 2/▢ आहे. छेद काय?",
        },
        answer: 3,
        wrong: [6, 9, 10],
        solution: {
          en: "A single repeating digit d gives d/9: 6/9 = 2/3, so denominator 3. Repeating decimals are always rational — the 9-trick converts them.",
          hi: "एक दोहराता अंक d देता है d/9: 6/9 = 2/3, अतः हर 3। आवर्ती दशमलव सदा परिमेय हैं — 9 की तरकीब उन्हें बदल देती है।",
          mr: "एक पुनरावृत्त अंक d देतो d/9: 6/9 = 2/3, म्हणून छेद 3. आवर्ती दशांश नेहमी परिमेय — 9 ची युक्ती त्यांना बदलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is √3 × √3?",
          hi: "√3 × √3 कितना है?",
          mr: "√3 × √3 किती?",
        },
        answer: 3,
        wrong: [9, 6, 1.73],
        checkExpr: "9/3",
        solution: {
          en: "√3 × √3 = 3 — a root times itself undoes the root. 9 squares the 3 inside; 1.73 is √3 itself, left un-multiplied.",
          hi: "√3 × √3 = 3 — मूल अपने से गुणा मूल को उलट देता है। 9 भीतर के 3 का वर्ग करता है; 1.73 स्वयं √3 है, बिना गुणा।",
          mr: "√3 × √3 = 3 — मूळ स्वतःशी गुणले मूळ उलटवते. 9 आतल्या 3 चा वर्ग करतो; 1.73 म्हणजे स्वतः √3, न गुणलेले.",
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
          en: "Rationalise 1/√5: it becomes √5/▢. What is the denominator?",
          hi: "1/√5 को परिमेय कीजिए: वह √5/▢ बनता है। हर क्या है?",
          mr: "1/√5 परिमेय करा: ते √5/▢ होते. छेद काय?",
        },
        answer: 5,
        wrong: [25, 1, 10],
        checkExpr: "25/5",
        solution: {
          en: "Multiply top and bottom by √5: (1×√5)/(√5×√5) = √5/5. Rationalising sweeps the root out of the denominator.",
          hi: "ऊपर-नीचे √5 से गुणा कीजिए: (1×√5)/(√5×√5) = √5/5। परिमेयकरण हर से मूल बुहार देता है।",
          mr: "वर-खाली √5 ने गुणा: (1×√5)/(√5×√5) = √5/5. परिमेयीकरण छेदातून मूळ झाडून टाकते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Compute 8^(2/3).",
          hi: "8^(2/3) निकालिए।",
          mr: "8^(2/3) काढा.",
        },
        answer: 4,
        wrong: [16, 5.33, 512],
        checkExpr: "2*2",
        solution: {
          en: "8^(2/3) = (∛8)² = 2² = 4 — the denominator roots, the numerator powers. 16 forgets the cube root; 5.33 multiplies 8 × 2/3.",
          hi: "8^(2/3) = (∛8)² = 2² = 4 — हर मूल लेता है, अंश घात। 16 घनमूल भूल जाता है; 5.33 8 × 2/3 गुणा कर बैठता है।",
          mr: "8^(2/3) = (∛8)² = 2² = 4 — छेद मूळ घेतो, अंश घात. 16 घनमूळ विसरतो; 5.33 8 × 2/3 गुणतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Simplify √50 to a√2. What is a?",
          hi: "√50 को a√2 में सरल कीजिए। a क्या है?",
          mr: "√50 ला a√2 मध्ये सोपे करा. a काय?",
        },
        answer: 5,
        wrong: [25, 10, 2],
        solution: {
          en: "√50 = √(25×2) = 5√2, pulling the perfect square out. 25 forgets to take the square root of the 25.",
          hi: "√50 = √(25×2) = 5√2, पूर्ण वर्ग बाहर खींचकर। 25 पच्चीस का वर्गमूल लेना भूल जाता है।",
          mr: "√50 = √(25×2) = 5√2, पूर्ण वर्ग बाहेर काढून. 25 पंचविसाचे वर्गमूळ घ्यायला विसरतो.",
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
          en: "(√7 + √3)(√7 − √3) = ?",
          hi: "(√7 + √3)(√7 − √3) कितना है?",
          mr: "(√7 + √3)(√7 − √3) किती?",
        },
        answer: 4,
        wrong: [10, 2, 21],
        checkExpr: "7-3",
        solution: {
          en: "Difference of squares: (√7)² − (√3)² = 7 − 3 = 4 — the roots vanish. 10 adds instead of subtracting the squares.",
          hi: "वर्गों का अंतर: (√7)² − (√3)² = 7 − 3 = 4 — मूल ग़ायब हो जाते हैं। 10 वर्ग घटाने की जगह जोड़ देता है।",
          mr: "वर्गांचा फरक: (√7)² − (√3)² = 7 − 3 = 4 — मूळे नाहीशी होतात. 10 वर्ग वजा करण्याऐवजी जोडतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Between √4 and √9 — that is 2 and 3 — how many INTEGERS lie strictly between?",
          hi: "√4 और √9 — यानी 2 और 3 — के बीच (दोनों छोड़कर) कितने पूर्णांक हैं?",
          mr: "√4 आणि √9 — म्हणजे 2 आणि 3 — च्या दरम्यान (दोन्ही वगळून) किती पूर्णांक आहेत?",
        },
        answer: 0,
        wrong: [1, 2, 5],
        checkExpr: "3-2-1",
        solution: {
          en: "2 and 3 are consecutive integers, so none sit strictly between. But infinitely many IRRATIONALS do — the number line is far denser than the integers suggest.",
          hi: "2 और 3 क्रमागत पूर्णांक हैं, अतः बीच में कोई नहीं। पर अनंत अपरिमेय बैठते हैं — संख्या-रेखा पूर्णांकों के सुझाव से कहीं सघन है।",
          mr: "2 आणि 3 क्रमागत पूर्णांक, म्हणून मध्ये एकही नाही. पण अनंत अपरिमेय बसतात — संख्यारेषा पूर्णांक सुचवतात त्याहून कितीतरी दाट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Rationalise 1/(√3 − 1): it becomes (√3 + 1)/▢. What is the denominator?",
          hi: "1/(√3 − 1) को परिमेय कीजिए: वह (√3 + 1)/▢ बनता है। हर क्या है?",
          mr: "1/(√3 − 1) परिमेय करा: ते (√3 + 1)/▢ होते. छेद काय?",
        },
        answer: 2,
        wrong: [3, 4, 1],
        checkExpr: "3-1",
        solution: {
          en: "Multiply by the conjugate (√3 + 1): the denominator becomes (√3)² − 1² = 3 − 1 = 2. The conjugate is the rationaliser's key.",
          hi: "संयुग्मी (√3 + 1) से गुणा कीजिए: हर बनता है (√3)² − 1² = 3 − 1 = 2। संयुग्मी परिमेयकरण की चाबी है।",
          mr: "संयुग्म (√3 + 1) ने गुणा: छेद होतो (√3)² − 1² = 3 − 1 = 2. संयुग्म ही परिमेयीकरणाची किल्ली.",
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
          en: "The product √2 × √8 turns out rational. What is it?",
          hi: "गुणनफल √2 × √8 परिमेय निकलता है। वह क्या है?",
          mr: "गुणाकार √2 × √8 परिमेय निघतो. तो काय?",
        },
        answer: 4,
        wrong: [16, 10, 2.83],
        checkExpr: "16/4",
        solution: {
          en: "√2 × √8 = √16 = 4 — two irrationals whose product is rational, because 2 × 8 = 16 is a perfect square. Irrationality is not contagious.",
          hi: "√2 × √8 = √16 = 4 — दो अपरिमेय जिनका गुणनफल परिमेय है, क्योंकि 2 × 8 = 16 पूर्ण वर्ग है। अपरिमेयता संक्रामक नहीं।",
          mr: "√2 × √8 = √16 = 4 — दोन अपरिमेय ज्यांचा गुणाकार परिमेय, कारण 2 × 8 = 16 पूर्ण वर्ग. अपरिमेयता सांसर्गिक नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Simplify (3 + √5) + (3 − √5).",
          hi: "(3 + √5) + (3 − √5) सरल कीजिए।",
          mr: "(3 + √5) + (3 − √5) सोपे करा.",
        },
        answer: 6,
        wrong: [10, 0, 4],
        checkExpr: "3+3",
        solution: {
          en: "The √5 terms cancel, leaving 3 + 3 = 6 — rational again. A number and its conjugate always add to a rational.",
          hi: "√5 वाले पद कट जाते हैं, बचता है 3 + 3 = 6 — फिर परिमेय। संख्या और उसका संयुग्मी सदा परिमेय में जुड़ते हैं।",
          mr: "√5 चे पद रद्द होतात, उरते 3 + 3 = 6 — पुन्हा परिमेय. संख्या आणि तिचे संयुग्म नेहमी परिमेयात जुळतात.",
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
          en: "Is √2 + √3 rational or irrational? Square it: (√2+√3)² = 5 + 2√6. The 2√6 term is irrational — so what is (√2+√3)² MINUS 5?",
          hi: "√2 + √3 परिमेय है या अपरिमेय? वर्ग कीजिए: (√2+√3)² = 5 + 2√6। 2√6 पद अपरिमेय है — तो (√2+√3)² में से 5 घटाने पर क्या बचता है (गुणांक बताइए)?",
          mr: "√2 + √3 परिमेय की अपरिमेय? वर्ग करा: (√2+√3)² = 5 + 2√6. 2√6 पद अपरिमेय — तर (√2+√3)² मधून 5 वजा केल्यास काय उरते (सहगुणक द्या)?",
        },
        answer: 2,
        wrong: [5, 6, 0],
        solution: {
          en: "(√2+√3)² − 5 = 2√6, coefficient 2. Since the square minus a rational is irrational, the original √2+√3 could not have been rational — a proof by consequence.",
          hi: "(√2+√3)² − 5 = 2√6, गुणांक 2। चूँकि वर्ग में से परिमेय घटाने पर अपरिमेय बचा, मूल √2+√3 परिमेय हो ही नहीं सकता था — परिणाम से प्रमाण।",
          mr: "(√2+√3)² − 5 = 2√6, सहगुणक 2. वर्गातून परिमेय वजा केल्यावर अपरिमेय उरले, म्हणून मूळ √2+√3 परिमेय असूच शकत नव्हते — परिणामातून सिद्धता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "0.999… equals which integer exactly? (Let x = 0.999…, then 10x − x = 9.)",
          hi: "0.999… ठीक किस पूर्णांक के बराबर है? (मान लीजिए x = 0.999…, तो 10x − x = 9।)",
          mr: "0.999… नेमके कोणत्या पूर्णांकाइतके? (समजा x = 0.999…, तर 10x − x = 9.)",
        },
        answer: 1,
        wrong: [0, 9, 10],
        checkExpr: "9/9",
        solution: {
          en: "10x − x = 9x = 9, so x = 1 — the endlessly repeating 0.999… IS exactly 1, no gap between them. The algebra is airtight, however strange it feels.",
          hi: "10x − x = 9x = 9, अतः x = 1 — अनंत दोहराता 0.999… ठीक 1 है, बीच कोई अंतर नहीं। बीजगणित पक्का है, चाहे कितना अजीब लगे।",
          mr: "10x − x = 9x = 9, म्हणून x = 1 — अखंड पुनरावृत्त 0.999… नेमके 1, मध्ये अंतर नाही. बीजगणित पक्के, कितीही विचित्र वाटो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 1 — Number Systems",
      name: "Number Systems",
      slug: "maths-9-number-systems",
      summary:
        "The line fills with irrationals: repeating decimals unmasked as fractions, roots swept from denominators by conjugates, and 0.999… proved to be exactly 1.",
      position: 1,
      translations: {
        hi: {
          name: "संख्या पद्धति",
          summary:
            "रेखा अपरिमेयों से भरती है: आवर्ती दशमलव भिन्नों के रूप में उघड़े, संयुग्मियों से हर से बुहारे मूल, और 0.999… ठीक 1 सिद्ध।",
        },
        mr: {
          name: "संख्या पद्धती",
          summary:
            "रेषा अपरिमेयांनी भरते: आवर्ती दशांश अपूर्णांक म्हणून उघड, संयुग्मांनी छेदातून झाडलेली मूळे, आणि 0.999… नेमके 1 सिद्ध.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Polynomials (the remainder and factor theorems)              */
/* ------------------------------------------------------------------------- */
function polynomials(): TopicFileOut {
  const rand = rng("maths-9-polynomials");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the degree of the polynomial 3x⁴ − 2x² + 7?",
          hi: "बहुपद 3x⁴ − 2x² + 7 की घात क्या है?",
          mr: "बहुपदी 3x⁴ − 2x² + 7 ची कोटी किती?",
        },
        answer: 4,
        wrong: [3, 7, 2],
        solution: {
          en: "The degree is the highest power of x present: 4. 7 is the constant term; 3 is a coefficient, not a power.",
          hi: "घात x की सबसे बड़ी मौजूद घात है: 4। 7 अचर पद है; 3 गुणांक है, घात नहीं।",
          mr: "कोटी म्हणजे x ची सर्वांत मोठी असलेली घात: 4. 7 स्थिरपद; 3 सहगुणक, घात नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For p(x) = x² − 3x + 2, what is p(1)?",
          hi: "p(x) = x² − 3x + 2 के लिए p(1) क्या है?",
          mr: "p(x) = x² − 3x + 2 साठी p(1) काय?",
        },
        answer: 0,
        wrong: [6, 2, -4],
        checkExpr: "1-3+2",
        solution: {
          en: "p(1) = 1 − 3 + 2 = 0 — so x = 1 is a zero of the polynomial. A value that makes p(x) vanish is a root.",
          hi: "p(1) = 1 − 3 + 2 = 0 — अतः x = 1 बहुपद का शून्यक है। जो मान p(x) को शून्य करे वह मूल है।",
          mr: "p(1) = 1 − 3 + 2 = 0 — म्हणून x = 1 बहुपदीचे शून्य. जी किंमत p(x) शून्य करते ती मूळ.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many terms does the binomial 5x − 7 have?",
          hi: "द्विपद 5x − 7 में कितने पद हैं?",
          mr: "द्विपदी 5x − 7 मध्ये किती पदे आहेत?",
        },
        answer: 2,
        wrong: [1, 3, 5],
        solution: {
          en: "A binomial has 2 terms — here 5x and −7. 'Bi' names the count, just as 'tri' would name three.",
          hi: "द्विपद में 2 पद होते हैं — यहाँ 5x और −7। 'द्वि' गिनती बताता है, जैसे 'त्रि' तीन बताता।",
          mr: "द्विपदीत 2 पदे — इथे 5x आणि −7. 'द्वि' मोजणी सांगतो, जसे 'त्रि' तीन सांगेल.",
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
          en: "By the Remainder Theorem, the remainder when x² + 3x + 5 is divided by (x − 1) is p(1). Compute it.",
          hi: "शेषफल प्रमेय से, x² + 3x + 5 को (x − 1) से भाग देने पर शेष p(1) है। निकालिए।",
          mr: "शेष प्रमेयानुसार, x² + 3x + 5 ला (x − 1) ने भागल्यास शेष p(1) आहे. काढा.",
        },
        answer: 9,
        wrong: [5, 0, 3],
        checkExpr: "1+3+5",
        solution: {
          en: "The remainder equals p(1) = 1 + 3 + 5 = 9 — no long division needed. The theorem reads the remainder straight off the divisor's root.",
          hi: "शेष = p(1) = 1 + 3 + 5 = 9 — लंबी भाग की ज़रूरत नहीं। प्रमेय शेष को भाजक के मूल से सीधे पढ़ लेता है।",
          mr: "शेष = p(1) = 1 + 3 + 5 = 9 — लांब भागाकाराची गरज नाही. प्रमेय शेष भाजकाच्या मूळावरून थेट वाचतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Expand (x + 3)² and read the coefficient of x.",
          hi: "(x + 3)² फैलाइए और x का गुणांक बताइए।",
          mr: "(x + 3)² विस्तारा आणि x चा सहगुणक सांगा.",
        },
        answer: 6,
        wrong: [9, 3, 5],
        checkExpr: "2*3",
        solution: {
          en: "(x + 3)² = x² + 6x + 9, so the middle coefficient is 2×3 = 6. 9 is the constant, not the x-coefficient.",
          hi: "(x + 3)² = x² + 6x + 9, अतः बीच का गुणांक 2×3 = 6। 9 अचर है, x का गुणांक नहीं।",
          mr: "(x + 3)² = x² + 6x + 9, म्हणून मधला सहगुणक 2×3 = 6. 9 स्थिरांक, x चा सहगुणक नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "By the Factor Theorem, (x − 2) is a factor of p(x) if p(2) = 0. For p(x) = x² − 5x + 6, compute p(2).",
          hi: "गुणनखंड प्रमेय से, (x − 2) p(x) का गुणनखंड है यदि p(2) = 0। p(x) = x² − 5x + 6 के लिए p(2) निकालिए।",
          mr: "अवयव प्रमेयानुसार, (x − 2) हा p(x) चा अवयव जर p(2) = 0. p(x) = x² − 5x + 6 साठी p(2) काढा.",
        },
        answer: 0,
        wrong: [4, 6, -4],
        checkExpr: "4-10+6",
        solution: {
          en: "p(2) = 4 − 10 + 6 = 0 — so (x − 2) IS a factor. The Factor Theorem is the Remainder Theorem when the remainder is zero.",
          hi: "p(2) = 4 − 10 + 6 = 0 — अतः (x − 2) गुणनखंड है। गुणनखंड प्रमेय वही शेषफल प्रमेय है जब शेष शून्य हो।",
          mr: "p(2) = 4 − 10 + 6 = 0 — म्हणून (x − 2) अवयव आहे. अवयव प्रमेय म्हणजे शेष शून्य असतानाचा शेष प्रमेयच.",
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
          en: "Use the identity to compute 103² via (100 + 3)².",
          hi: "सर्वसमिका से (100 + 3)² द्वारा 103² निकालिए।",
          mr: "नित्यसमीकरणाने (100 + 3)² ने 103² काढा.",
        },
        answer: 10609,
        wrong: [10069, 10906, 10309],
        checkExpr: "100*100+2*100*3+9",
        solution: {
          en: "100² + 2·100·3 + 3² = 10000 + 600 + 9 = 10609. The identity turns a hard square into three easy pieces.",
          hi: "100² + 2·100·3 + 3² = 10000 + 600 + 9 = 10609। सर्वसमिका कठिन वर्ग को तीन आसान टुकड़ों में बदल देती है।",
          mr: "100² + 2·100·3 + 3² = 10000 + 600 + 9 = 10609. नित्यसमीकरण कठीण वर्ग तीन सोप्या तुकड्यांत बदलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "If x + y = 5 and xy = 6, find x² + y² using (x+y)² − 2xy.",
          hi: "यदि x + y = 5 और xy = 6, तो (x+y)² − 2xy से x² + y² निकालिए।",
          mr: "जर x + y = 5 आणि xy = 6, तर (x+y)² − 2xy ने x² + y² काढा.",
        },
        answer: 13,
        wrong: [25, 11, 37],
        checkExpr: "25-12",
        solution: {
          en: "x² + y² = (x+y)² − 2xy = 25 − 12 = 13. The identity finds x² + y² without ever finding x and y separately.",
          hi: "x² + y² = (x+y)² − 2xy = 25 − 12 = 13। सर्वसमिका x और y अलग-अलग खोजे बिना x² + y² निकाल देती है।",
          mr: "x² + y² = (x+y)² − 2xy = 25 − 12 = 13. नित्यसमीकरण x आणि y वेगळे न शोधता x² + y² काढते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Factorise x² + 7x + 12 as (x + 3)(x + ▢). What fills the box?",
          hi: "x² + 7x + 12 को (x + 3)(x + ▢) में गुणनखंडित कीजिए। रिक्त में क्या आएगा?",
          mr: "x² + 7x + 12 ला (x + 3)(x + ▢) मध्ये अवयवित करा. रिकाम्यात काय?",
        },
        answer: 4,
        wrong: [12, 7, 9],
        checkExpr: "12/3",
        solution: {
          en: "Two numbers multiplying to 12 and adding to 7: 3 and 4. The partner of 3 is 12 ÷ 3 = 4, and 3 + 4 = 7 ✓.",
          hi: "12 गुणा और 7 योग देने वाली दो संख्याएँ: 3 और 4। 3 का साथी 12 ÷ 3 = 4, और 3 + 4 = 7 ✓।",
          mr: "12 गुणाकार आणि 7 बेरीज देणाऱ्या दोन संख्या: 3 आणि 4. 3 चा जोडीदार 12 ÷ 3 = 4, आणि 3 + 4 = 7 ✓.",
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
          en: "Find k so that (x − 1) is a factor of x³ − 3x² + kx − 1. (Set p(1) = 0.)",
          hi: "k निकालिए ताकि (x − 1) x³ − 3x² + kx − 1 का गुणनखंड हो। (p(1) = 0 रखिए।)",
          mr: "k काढा जेणेकरून (x − 1) हा x³ − 3x² + kx − 1 चा अवयव होईल. (p(1) = 0 ठेवा.)",
        },
        answer: 3,
        wrong: [1, 5, 0],
        checkExpr: "1+3-1+0",
        solution: {
          en: "p(1) = 1 − 3 + k − 1 = 0 gives k − 3 = 0, so k = 3. The factor theorem turns 'is a factor' into one easy equation.",
          hi: "p(1) = 1 − 3 + k − 1 = 0 से k − 3 = 0, अतः k = 3। गुणनखंड प्रमेय 'गुणनखंड है' को एक आसान समीकरण बना देता है।",
          mr: "p(1) = 1 − 3 + k − 1 = 0 मधून k − 3 = 0, म्हणून k = 3. अवयव प्रमेय 'अवयव आहे' ला एका सोप्या समीकरणात बदलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "When a+b+c = 0, the identity gives a³ + b³ + c³ = 3abc. For a = 1, b = 2, c = −3, evaluate 3abc.",
          hi: "जब a+b+c = 0, सर्वसमिका देती है a³ + b³ + c³ = 3abc। a = 1, b = 2, c = −3 के लिए 3abc निकालिए।",
          mr: "जेव्हा a+b+c = 0, नित्यसमीकरण देते a³ + b³ + c³ = 3abc. a = 1, b = 2, c = −3 साठी 3abc काढा.",
        },
        answer: -18,
        wrong: [18, -6, 0],
        checkExpr: "3*1*2*(0-3)",
        solution: {
          en: "Since 1 + 2 − 3 = 0, the sum of cubes equals 3abc = 3·1·2·(−3) = −18. Check: 1 + 8 − 27 = −18 ✓ — the identity turns three cubes into one product.",
          hi: "चूँकि 1 + 2 − 3 = 0, घनों का योग 3abc = 3·1·2·(−3) = −18। जाँच: 1 + 8 − 27 = −18 ✓ — सर्वसमिका तीन घनों को एक गुणनफल बना देती है।",
          mr: "1 + 2 − 3 = 0 असल्याने, घनांची बेरीज 3abc = 3·1·2·(−3) = −18. पडताळणी: 1 + 8 − 27 = −18 ✓ — नित्यसमीकरण तीन घनांना एक गुणाकार करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Factorise x³ − x. How many linear factors does it split into?",
          hi: "x³ − x गुणनखंडित कीजिए। वह कितने रैखिक गुणनखंडों में बँटता है?",
          mr: "x³ − x अवयवित करा. तो किती रेषीय अवयवांत विभागतो?",
        },
        answer: 3,
        wrong: [2, 1, 4],
        solution: {
          en: "x³ − x = x(x² − 1) = x(x − 1)(x + 1): three linear factors, roots 0, 1, −1. A cubic can have up to three.",
          hi: "x³ − x = x(x² − 1) = x(x − 1)(x + 1): तीन रैखिक गुणनखंड, मूल 0, 1, −1। घन बहुपद में अधिकतम तीन हो सकते हैं।",
          mr: "x³ − x = x(x² − 1) = x(x − 1)(x + 1): तीन रेषीय अवयव, मूळे 0, 1, −1. घन बहुपदीत जास्तीत जास्त तीन असू शकतात.",
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
          en: "If x + 1/x = 3, find x³ + 1/x³ using the identity a³ + b³ = (a+b)³ − 3ab(a+b).",
          hi: "यदि x + 1/x = 3, तो a³ + b³ = (a+b)³ − 3ab(a+b) से x³ + 1/x³ निकालिए।",
          mr: "जर x + 1/x = 3, तर a³ + b³ = (a+b)³ − 3ab(a+b) ने x³ + 1/x³ काढा.",
        },
        answer: 18,
        wrong: [27, 9, 21],
        checkExpr: "27-9",
        solution: {
          en: "x³ + 1/x³ = 3³ − 3·1·3 = 27 − 9 = 18, since x·(1/x) = 1. The cube of the sum minus three times the sum does it.",
          hi: "x³ + 1/x³ = 3³ − 3·1·3 = 27 − 9 = 18, क्योंकि x·(1/x) = 1। योग का घन घटा तीन गुना योग काम कर देता है।",
          mr: "x³ + 1/x³ = 3³ − 3·1·3 = 27 − 9 = 18, कारण x·(1/x) = 1. बेरजेचा घन वजा तिप्पट बेरीज काम करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A polynomial p(x) leaves remainder 5 on division by (x − 2) and remainder 7 by (x − 4). What is p(2)?",
          hi: "बहुपद p(x) को (x − 2) से भाग देने पर शेष 5 और (x − 4) से 7 बचता है। p(2) क्या है?",
          mr: "बहुपदी p(x) ला (x − 2) ने भागल्यास शेष 5 आणि (x − 4) ने 7 उरतो. p(2) काय?",
        },
        answer: 5,
        wrong: [7, 2, 12],
        solution: {
          en: "By the Remainder Theorem the remainder on division by (x − 2) IS p(2), so p(2) = 5 directly. The (x − 4) fact is a distractor here.",
          hi: "शेषफल प्रमेय से (x − 2) से भाग का शेष ही p(2) है, अतः p(2) = 5 सीधे। (x − 4) वाली बात यहाँ भटकाव है।",
          mr: "शेष प्रमेयानुसार (x − 2) ने भागाचा शेष म्हणजेच p(2), म्हणून p(2) = 5 थेट. (x − 4) ची गोष्ट इथे भटकावणारी.",
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
          en: "The identity 25³ + (−15)³ + (−10)³ = 3·25·(−15)·(−10) holds because the bases sum to zero. What is that product?",
          hi: "सर्वसमिका 25³ + (−15)³ + (−10)³ = 3·25·(−15)·(−10) इसलिए सही है कि आधारों का योग शून्य है। वह गुणनफल क्या है?",
          mr: "नित्यसमीकरण 25³ + (−15)³ + (−10)³ = 3·25·(−15)·(−10) म्हणून खरे की पायांची बेरीज शून्य. तो गुणाकार काय?",
        },
        answer: 11250,
        wrong: [3750, -11250, 5000],
        checkExpr: "3*25*15*10",
        solution: {
          en: "25 − 15 − 10 = 0, so the cubes sum to 3abc = 3·25·(−15)·(−10) = 11250 — the two minuses make it positive. A monstrous sum of cubes read off in one multiplication.",
          hi: "25 − 15 − 10 = 0, अतः घनों का योग 3abc = 3·25·(−15)·(−10) = 11250 — दोनों ऋण इसे धन बनाते हैं। घनों का राक्षसी योग एक गुणे में पढ़ा हुआ।",
          mr: "25 − 15 − 10 = 0, म्हणून घनांची बेरीज 3abc = 3·25·(−15)·(−10) = 11250 — दोन ऋणे ते धन करतात. घनांची राक्षसी बेरीज एका गुणाकारात वाचलेली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "p(x) = x⁴ − 1. How many REAL zeros does it have?",
          hi: "p(x) = x⁴ − 1। इसके कितने वास्तविक शून्यक हैं?",
          mr: "p(x) = x⁴ − 1. याचे किती वास्तव शून्य आहेत?",
        },
        answer: 2,
        wrong: [4, 1, 0],
        solution: {
          en: "x⁴ − 1 = (x² − 1)(x² + 1) = (x − 1)(x + 1)(x² + 1). Only x = 1 and x = −1 are real; x² + 1 = 0 has no real root — degree 4 promises at most 4, not exactly 4.",
          hi: "x⁴ − 1 = (x² − 1)(x² + 1) = (x − 1)(x + 1)(x² + 1)। केवल x = 1 और x = −1 वास्तविक; x² + 1 = 0 का कोई वास्तविक मूल नहीं — घात 4 अधिकतम 4 का वादा करती है, ठीक 4 का नहीं।",
          mr: "x⁴ − 1 = (x² − 1)(x² + 1) = (x − 1)(x + 1)(x² + 1). फक्त x = 1 आणि x = −1 वास्तव; x² + 1 = 0 ला वास्तव मूळ नाही — कोटी 4 जास्तीत जास्त 4 चे वचन देते, नेमके 4 चे नाही.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 2 — Polynomials",
      name: "Polynomials",
      slug: "maths-9-polynomials",
      summary:
        "Algebra learns to read itself: the Remainder Theorem plucking a remainder off a root, the Factor Theorem turning factoring into one equation, and cubes summing to nothing when their bases do.",
      position: 2,
      translations: {
        hi: {
          name: "बहुपद",
          summary:
            "बीजगणित ख़ुद को पढ़ना सीखता है: शेषफल प्रमेय मूल से शेष उठाता, गुणनखंड प्रमेय गुणनखंडन को एक समीकरण बनाता, और घन जिनके आधार शून्य में जुड़ें वे शून्य के गिर्द घूमते।",
        },
        mr: {
          name: "बहुपदी",
          summary:
            "बीजगणित स्वतःला वाचायला शिकते: शेष प्रमेय मूळावरून शेष उचलतो, अवयव प्रमेय अवयव पाडणे एका समीकरणात बदलतो, आणि पायांची बेरीज शून्य होताच घनांची बेरीजही तशीच वागते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Coordinate Geometry (points earn addresses)                  */
/* ------------------------------------------------------------------------- */
function coordinateGeometry(): TopicFileOut {
  const rand = rng("maths-9-coordinate-geometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "In the point (−4, 7), what is the abscissa (the x-coordinate)?",
          hi: "बिंदु (−4, 7) में भुज (x-निर्देशांक) क्या है?",
          mr: "बिंदू (−4, 7) मध्ये भुज (x-सहनिर्देशक) काय?",
        },
        answer: -4,
        wrong: [7, 4, 3],
        solution: {
          en: "The abscissa is the first coordinate: −4. The second, 7, is the ordinate. Order names the address.",
          hi: "भुज पहला निर्देशांक है: −4। दूसरा, 7, कोटि है। क्रम ही पता बताता है।",
          mr: "भुज म्हणजे पहिला सहनिर्देशक: −4. दुसरा, 7, कोटी. क्रमच पत्ता सांगतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In which quadrant does the point (3, −5) lie?",
          hi: "बिंदु (3, −5) किस चतुर्थांश में है?",
          mr: "बिंदू (3, −5) कोणत्या चरणात आहे?",
        },
        answer: 4,
        wrong: [1, 2, 3],
        solution: {
          en: "x positive, y negative: right and down — the fourth quadrant. Quadrants number anticlockwise from the (+, +) first.",
          hi: "x धन, y ऋण: दाएँ और नीचे — चौथा चतुर्थांश। चतुर्थांश (+, +) वाले पहले से वामावर्त गिने जाते हैं।",
          mr: "x धन, y ऋण: उजवीकडे आणि खाली — चौथे चरण. चरणे (+, +) पहिल्यापासून घड्याळाच्या उलट मोजतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "On which axis does the point (0, 6) lie? (x-axis = 1, y-axis = 2)",
          hi: "बिंदु (0, 6) किस अक्ष पर है? (x-अक्ष = 1, y-अक्ष = 2)",
          mr: "बिंदू (0, 6) कोणत्या अक्षावर आहे? (x-अक्ष = 1, y-अक्ष = 2)",
        },
        answer: 2,
        wrong: [1, 3, 4],
        solution: {
          en: "x = 0 means no horizontal step, so the point sits on the vertical y-axis (coded 2). A zero x pins a point to the y-axis.",
          hi: "x = 0 यानी कोई क्षैतिज क़दम नहीं, अतः बिंदु खड़ी y-अक्ष पर (कोड 2)। शून्य x बिंदु को y-अक्ष पर जड़ देता है।",
          mr: "x = 0 म्हणजे आडवे पाऊल नाही, म्हणून बिंदू उभ्या y-अक्षावर (कोड 2). शून्य x बिंदूला y-अक्षावर ठरवतो.",
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
          en: "How far apart are (2, 3) and (2, 8)?",
          hi: "(2, 3) और (2, 8) कितनी दूर हैं?",
          mr: "(2, 3) आणि (2, 8) किती दूर आहेत?",
        },
        answer: 5,
        wrong: [10, 6, 11],
        checkExpr: "8-3",
        solution: {
          en: "Same x, so the gap is purely vertical: 8 − 3 = 5. When one coordinate matches, distance is a simple subtraction.",
          hi: "x समान, अतः फ़ासला केवल खड़ा है: 8 − 3 = 5। जब एक निर्देशांक मिले, दूरी सीधी घटाव है।",
          mr: "x समान, म्हणून अंतर फक्त उभे: 8 − 3 = 5. एक सहनिर्देशक जुळला की अंतर साधी वजाबाकी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the distance from the origin to the point (6, 8)?",
          hi: "मूल-बिंदु से बिंदु (6, 8) तक की दूरी कितनी है?",
          mr: "आरंभबिंदूपासून बिंदू (6, 8) पर्यंतचे अंतर किती?",
        },
        answer: 10,
        wrong: [14, 48, 7],
        solution: {
          en: "√(6² + 8²) = √(36 + 64) = √100 = 10 — Pythagoras on the grid. 14 adds the legs instead of using their squares.",
          hi: "√(6² + 8²) = √(36 + 64) = √100 = 10 — ग्रिड पर पाइथागोरस। 14 भुजाएँ जोड़ता है, उनके वर्ग नहीं।",
          mr: "√(6² + 8²) = √(36 + 64) = √100 = 10 — ग्रिडवरचा पायथागोरस. 14 बाजू जोडतो, त्यांचे वर्ग नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The point (−2, 0) lies on the x-axis. How far is it from the origin?",
          hi: "बिंदु (−2, 0) x-अक्ष पर है। मूल-बिंदु से कितनी दूर?",
          mr: "बिंदू (−2, 0) x-अक्षावर आहे. आरंभबिंदूपासून किती दूर?",
        },
        answer: 2,
        wrong: [-2, 0, 4],
        checkExpr: "0+2",
        solution: {
          en: "Distance is never negative — the point is 2 units left of the origin, so 2 away. −2 confuses position with distance.",
          hi: "दूरी कभी ऋण नहीं — बिंदु मूल से 2 इकाई बाएँ है, अतः 2 दूर। −2 स्थिति को दूरी से मिला बैठता है।",
          mr: "अंतर कधी ऋण नाही — बिंदू आरंभबिंदूच्या 2 एकके डावीकडे, म्हणून 2 दूर. −2 स्थान अंतराशी गल्लत करतो.",
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
          en: "Three corners of a rectangle are (1, 1), (6, 1) and (6, 4). What is the x-coordinate of the fourth corner?",
          hi: "आयत के तीन कोने (1, 1), (6, 1) और (6, 4) हैं। चौथे कोने का x-निर्देशांक क्या है?",
          mr: "आयताचे तीन कोपरे (1, 1), (6, 1) आणि (6, 4) आहेत. चौथ्या कोपऱ्याचा x-सहनिर्देशक काय?",
        },
        answer: 1,
        wrong: [6, 4, 0],
        solution: {
          en: "The fourth corner is (1, 4): x borrowed from the corner below it, y from the corner across. A rectangle's corners copy coordinates in pairs.",
          hi: "चौथा कोना (1, 4): x नीचे वाले कोने से, y सामने वाले से उधार। आयत के कोने निर्देशांक जोड़ों में नक़ल करते हैं।",
          mr: "चौथा कोपरा (1, 4): x खालच्या कोपऱ्याकडून, y समोरच्याकडून. आयताचे कोपरे सहनिर्देशक जोड्यांत नक्कल करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The midpoint of (2, 3) and (8, 7) is (5, ▢). What is the y-coordinate?",
          hi: "(2, 3) और (8, 7) का मध्य-बिंदु (5, ▢) है। y-निर्देशांक क्या है?",
          mr: "(2, 3) आणि (8, 7) चा मध्यबिंदू (5, ▢) आहे. y-सहनिर्देशक काय?",
        },
        answer: 5,
        wrong: [10, 2, 4],
        checkExpr: "(3+7)/2",
        solution: {
          en: "Average the y's: (3 + 7)/2 = 5. The midpoint is the average of the endpoints, coordinate by coordinate.",
          hi: "y का औसत: (3 + 7)/2 = 5। मध्य-बिंदु सिरों का औसत है, निर्देशांक-दर-निर्देशांक।",
          mr: "y ची सरासरी: (3 + 7)/2 = 5. मध्यबिंदू म्हणजे टोकांची सरासरी, सहनिर्देशकागणिक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A point lies on the y-axis, 4 units below the origin. What is its y-coordinate?",
          hi: "एक बिंदु y-अक्ष पर, मूल से 4 इकाई नीचे है। उसका y-निर्देशांक क्या है?",
          mr: "एक बिंदू y-अक्षावर, आरंभबिंदूच्या 4 एकके खाली आहे. त्याचा y-सहनिर्देशक काय?",
        },
        answer: -4,
        wrong: [4, 0, -1],
        checkExpr: "0-4",
        solution: {
          en: "Below the origin means negative y: (0, −4). The x is 0 because it is on the axis; the sign records the direction.",
          hi: "मूल से नीचे यानी ऋण y: (0, −4)। x शून्य क्योंकि वह अक्ष पर है; चिह्न दिशा दर्ज करता है।",
          mr: "आरंभबिंदूच्या खाली म्हणजे ऋण y: (0, −4). x शून्य कारण तो अक्षावर; चिन्ह दिशा नोंदवते.",
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
          en: "Vertices (0,0), (4,0), (4,3) and (0,3) enclose a rectangle. What is its area?",
          hi: "शीर्ष (0,0), (4,0), (4,3) और (0,3) एक आयत घेरते हैं। उसका क्षेत्रफल कितना?",
          mr: "शिरोबिंदू (0,0), (4,0), (4,3) आणि (0,3) एक आयत वेढतात. त्याचे क्षेत्रफळ किती?",
        },
        answer: 12,
        wrong: [14, 7, 25],
        checkExpr: "4*3",
        solution: {
          en: "Width 4, height 3, area 4 × 3 = 12. 14 walks the perimeter instead of filling the rectangle.",
          hi: "चौड़ाई 4, ऊँचाई 3, क्षेत्रफल 4 × 3 = 12। 14 आयत भरने की जगह परिमाप नाप आता है।",
          mr: "रुंदी 4, उंची 3, क्षेत्रफळ 4 × 3 = 12. 14 आयत भरण्याऐवजी परिमिती मोजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Points (1,2), (5,2) and (5,5) are three corners of a right triangle. What is its area?",
          hi: "बिंदु (1,2), (5,2) और (5,5) एक समकोण त्रिभुज के तीन कोने हैं। उसका क्षेत्रफल कितना?",
          mr: "बिंदू (1,2), (5,2) आणि (5,5) एका काटकोन त्रिकोणाचे तीन कोपरे आहेत. त्याचे क्षेत्रफळ किती?",
        },
        answer: 6,
        wrong: [12, 10, 7],
        checkExpr: "4*3/2",
        solution: {
          en: "The legs are 4 (along y=2) and 3 (along x=5): area = ½·4·3 = 6. A triangle is half its bounding rectangle.",
          hi: "भुजाएँ 4 (y=2 पर) और 3 (x=5 पर): क्षेत्रफल = ½·4·3 = 6। त्रिभुज अपने घेरने वाले आयत का आधा है।",
          mr: "बाजू 4 (y=2 वर) आणि 3 (x=5 वर): क्षेत्रफळ = ½·4·3 = 6. त्रिकोण म्हणजे त्याच्या वेढणाऱ्या आयताचा अर्धा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The distance between (0,0) and (5,12) is —",
          hi: "(0,0) और (5,12) के बीच की दूरी है —",
          mr: "(0,0) आणि (5,12) मधले अंतर आहे —",
        },
        answer: 13,
        wrong: [17, 7, 169],
        solution: {
          en: "√(5² + 12²) = √(25 + 144) = √169 = 13 — the 5-12-13 triple on the grid. 169 stops at the square of the answer.",
          hi: "√(5² + 12²) = √(25 + 144) = √169 = 13 — ग्रिड पर 5-12-13 त्रिक। 169 उत्तर के वर्ग पर रुक जाता है।",
          mr: "√(5² + 12²) = √(25 + 144) = √169 = 13 — ग्रिडवरचे 5-12-13 त्रिकूट. 169 उत्तराच्या वर्गावर थांबतो.",
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
          en: "A point is equidistant from (0,0) and (6,0) and lies on the x-axis. What is its x-coordinate?",
          hi: "एक बिंदु (0,0) और (6,0) से समान दूरी पर है और x-अक्ष पर है। उसका x-निर्देशांक क्या है?",
          mr: "एक बिंदू (0,0) आणि (6,0) पासून समान अंतरावर आहे आणि x-अक्षावर आहे. त्याचा x-सहनिर्देशक काय?",
        },
        answer: 3,
        wrong: [6, 0, 1.5],
        checkExpr: "6/2",
        solution: {
          en: "Equidistant from two points on a line means the midpoint: (0 + 6)/2 = 3. Balance sits exactly halfway.",
          hi: "एक रेखा के दो बिंदुओं से समान दूरी यानी मध्य-बिंदु: (0 + 6)/2 = 3। संतुलन ठीक बीच में बैठता है।",
          mr: "एका रेषेवरच्या दोन बिंदूंपासून समान अंतर म्हणजे मध्यबिंदू: (0 + 6)/2 = 3. समतोल नेमका मध्यभागी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Reflect the point (3, 5) across the x-axis. What is its new y-coordinate?",
          hi: "बिंदु (3, 5) को x-अक्ष के परितः परावर्तित कीजिए। उसका नया y-निर्देशांक क्या है?",
          mr: "बिंदू (3, 5) ला x-अक्षाभोवती परावर्तित करा. त्याचा नवा y-सहनिर्देशक काय?",
        },
        answer: -5,
        wrong: [5, 3, -3],
        checkExpr: "0-5",
        solution: {
          en: "Reflecting across the x-axis flips the sign of y: 5 becomes −5, x unchanged. The mirror is the axis itself.",
          hi: "x-अक्ष के परितः परावर्तन y का चिह्न पलटता है: 5 बनता है −5, x वही। दर्पण स्वयं अक्ष है।",
          mr: "x-अक्षाभोवती परावर्तन y चे चिन्ह उलटवते: 5 चा होतो −5, x तसाच. आरसा म्हणजे अक्षच.",
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
          en: "Points (1,1), (2,2) and (3,3) — are they collinear? Test the area of the triangle they form: ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)|. What is that area?",
          hi: "बिंदु (1,1), (2,2) और (3,3) — क्या संरेख हैं? उनके बनाए त्रिभुज का क्षेत्रफल ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)| जाँचिए। वह क्षेत्रफल क्या है?",
          mr: "बिंदू (1,1), (2,2) आणि (3,3) — एकरेषीय आहेत का? त्यांनी केलेल्या त्रिकोणाचे क्षेत्रफळ ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)| तपासा. ते क्षेत्रफळ काय?",
        },
        answer: 0,
        wrong: [1, 3, 6],
        solution: {
          en: "½|1(2−3)+2(3−1)+3(1−2)| = ½|−1+4−3| = 0. Zero area means no triangle — the three points are collinear, all on the line y = x.",
          hi: "½|1(2−3)+2(3−1)+3(1−2)| = ½|−1+4−3| = 0। शून्य क्षेत्रफल यानी कोई त्रिभुज नहीं — तीनों बिंदु संरेख हैं, सब y = x रेखा पर।",
          mr: "½|1(2−3)+2(3−1)+3(1−2)| = ½|−1+4−3| = 0. शून्य क्षेत्रफळ म्हणजे त्रिकोणच नाही — तिन्ही बिंदू एकरेषीय, सारे y = x रेषेवर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A point P divides the segment from (0,0) to (10,0) so that its distance from (0,0) is FOUR times its distance from (10,0). What is P's x-coordinate?",
          hi: "एक बिंदु P, (0,0) से (10,0) तक के खंड को यों बाँटता है कि (0,0) से उसकी दूरी (10,0) से उसकी दूरी की चार गुनी हो। P का x-निर्देशांक क्या है?",
          mr: "एक बिंदू P, (0,0) पासून (10,0) पर्यंतचा खंड असा विभागतो की (0,0) पासून त्याचे अंतर (10,0) पासूनच्या अंतराच्या चौपट. P चा x-सहनिर्देशक काय?",
        },
        answer: 8,
        wrong: [5, 2, 10],
        checkExpr: "10*4/5",
        solution: {
          en: "Distance from 0 is 4× distance from 10, so P splits the 10 units in ratio 4:1 — that is 4/5 of the way, giving x = 8. Closer to the far end, as the larger distance demands.",
          hi: "0 से दूरी 10 से दूरी की 4 गुनी है, अतः P दस इकाइयों को 4:1 अनुपात में बाँटता है — यानी 4/5 दूरी, जिससे x = 8। दूर वाले सिरे के पास, जैसा बड़ी दूरी माँगती है।",
          mr: "0 पासूनचे अंतर 10 पासूनच्या 4 पट, म्हणून P दहा एकके 4:1 गुणोत्तरात विभागतो — म्हणजे 4/5 अंतर, ज्याने x = 8. दूरच्या टोकाजवळ, मोठे अंतर मागते तसे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 3 — Coordinate Geometry",
      name: "Coordinate Geometry",
      slug: "maths-9-coordinate-geometry",
      summary:
        "Points earn addresses on a grid: quadrants numbered anticlockwise, distances via Pythagoras, and three points convicted of collinearity by a zero-area triangle.",
      position: 3,
      translations: {
        hi: {
          name: "निर्देशांक ज्यामिति",
          summary:
            "बिंदु ग्रिड पर पते पाते हैं: वामावर्त गिने चतुर्थांश, पाइथागोरस से दूरियाँ, और शून्य-क्षेत्रफल त्रिभुज से संरेखता के दोषी तीन बिंदु।",
        },
        mr: {
          name: "सहनिर्देशक भूमिती",
          summary:
            "बिंदू ग्रिडवर पत्ते मिळवतात: घड्याळाच्या उलट मोजलेली चरणे, पायथागोरसने अंतरे, आणि शून्य-क्षेत्रफळ त्रिकोणाने एकरेषीयतेचे दोषी तीन बिंदू.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Linear Equations in Two Variables (a line of solutions)      */
/* ------------------------------------------------------------------------- */
function linearTwoVariables(): TopicFileOut {
  const rand = rng("maths-9-linear-two-variables");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "In x + y = 7, if x = 3, what is y?",
          hi: "x + y = 7 में यदि x = 3, तो y क्या है?",
          mr: "x + y = 7 मध्ये जर x = 3, तर y काय?",
        },
        answer: 4,
        wrong: [10, 21, 3],
        checkExpr: "7-3",
        solution: {
          en: "y = 7 − 3 = 4, giving the solution (3, 4). Fix one variable and the equation hands you the other.",
          hi: "y = 7 − 3 = 4, हल (3, 4)। एक चर तय कीजिए और समीकरण दूसरा थमा देता है।",
          mr: "y = 7 − 3 = 4, उत्तर (3, 4). एक चल ठरवा आणि समीकरण दुसरा देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many solutions does the single equation x + y = 5 have?",
          hi: "अकेले समीकरण x + y = 5 के कितने हल हैं?",
          mr: "एकट्या समीकरण x + y = 5 चे किती उत्तरे आहेत?",
        },
        answer: -1,
        wrong: [1, 5, 0],
        fmt: (n) => (n === -1 ? { en: "infinitely many", hi: "अनंत", mr: "अनंत" } : { en: String(n), hi: String(n), mr: String(n) }),
        solution: {
          en: "One linear equation in two variables has infinitely many solutions — every point on its line. The answer 'infinitely many' is coded −1.",
          hi: "दो चरों वाले एक रैखिक समीकरण के अनंत हल हैं — उसकी रेखा का हर बिंदु। उत्तर 'अनंत' को −1 से कोडित किया है।",
          mr: "दोन चलांच्या एका रेषीय समीकरणाची अनंत उत्तरे — त्याच्या रेषेवरचा प्रत्येक बिंदू. उत्तर 'अनंत' −1 ने कोड केले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Does the point (2, 1) satisfy 3x − 2y = 4? Compute 3(2) − 2(1).",
          hi: "क्या बिंदु (2, 1) 3x − 2y = 4 को संतुष्ट करता है? 3(2) − 2(1) निकालिए।",
          mr: "बिंदू (2, 1) 3x − 2y = 4 समाधान करतो का? 3(2) − 2(1) काढा.",
        },
        answer: 4,
        wrong: [8, 2, 5],
        checkExpr: "6-2",
        solution: {
          en: "3(2) − 2(1) = 6 − 2 = 4 ✓ — the point lies on the line. Substitution is how you test membership.",
          hi: "3(2) − 2(1) = 6 − 2 = 4 ✓ — बिंदु रेखा पर है। मान रखना ही सदस्यता की जाँच है।",
          mr: "3(2) − 2(1) = 6 − 2 = 4 ✓ — बिंदू रेषेवर आहे. किंमत ठेवणे हीच सदस्यत्वाची चाचणी.",
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
          en: "Where does the line 2x + 3y = 12 cross the x-axis? (Set y = 0 and find x.)",
          hi: "रेखा 2x + 3y = 12 x-अक्ष को कहाँ काटती है? (y = 0 रखकर x निकालिए।)",
          mr: "रेषा 2x + 3y = 12 x-अक्ष कुठे छेदते? (y = 0 ठेवून x काढा.)",
        },
        answer: 6,
        wrong: [4, 12, 3],
        checkExpr: "12/2",
        solution: {
          en: "On the x-axis y = 0, so 2x = 12 and x = 6. The x-intercept is (6, 0). Every crossing sets the other coordinate to zero.",
          hi: "x-अक्ष पर y = 0, अतः 2x = 12 और x = 6। x-अंतःखंड (6, 0)। हर कटान दूसरे निर्देशांक को शून्य करता है।",
          mr: "x-अक्षावर y = 0, म्हणून 2x = 12 आणि x = 6. x-छेदबिंदू (6, 0). प्रत्येक छेद दुसरा सहनिर्देशक शून्य करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The line y = 2x + 1 passes through (3, ▢). What is the y-coordinate?",
          hi: "रेखा y = 2x + 1 (3, ▢) से गुज़रती है। y-निर्देशांक क्या है?",
          mr: "रेषा y = 2x + 1 (3, ▢) मधून जाते. y-सहनिर्देशक काय?",
        },
        answer: 7,
        wrong: [6, 5, 4],
        checkExpr: "2*3+1",
        solution: {
          en: "y = 2(3) + 1 = 7, so (3, 7) is on the line. Feed x in, read y out — the equation is a machine.",
          hi: "y = 2(3) + 1 = 7, अतः (3, 7) रेखा पर है। x डालिए, y पढ़िए — समीकरण एक मशीन है।",
          mr: "y = 2(3) + 1 = 7, म्हणून (3, 7) रेषेवर. x घाला, y वाचा — समीकरण एक यंत्र.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Write the equation of the y-axis: it is x = ▢. What number fills the box?",
          hi: "y-अक्ष का समीकरण लिखिए: वह x = ▢ है। रिक्त में कौन-सी संख्या?",
          mr: "y-अक्षाचे समीकरण लिहा: ते x = ▢ आहे. रिकाम्यात कोणती संख्या?",
        },
        answer: 0,
        wrong: [1, -1, 90],
        solution: {
          en: "Every point on the y-axis has x = 0, whatever its y — so the line is x = 0. The axis is the set of zero-x points.",
          hi: "y-अक्ष के हर बिंदु का x = 0, y चाहे जो हो — अतः रेखा x = 0। अक्ष शून्य-x बिंदुओं का समुच्चय है।",
          mr: "y-अक्षावरच्या प्रत्येक बिंदूचा x = 0, y कोणताही असो — म्हणून रेषा x = 0. अक्ष म्हणजे शून्य-x बिंदूंचा संच.",
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
          en: "Where does 3x − y = 6 cross the y-axis? Give the y-coordinate.",
          hi: "3x − y = 6 y-अक्ष को कहाँ काटती है? y-निर्देशांक बताइए।",
          mr: "3x − y = 6 y-अक्ष कुठे छेदते? y-सहनिर्देशक द्या.",
        },
        answer: -6,
        wrong: [6, 2, -2],
        checkExpr: "0-6",
        solution: {
          en: "On the y-axis x = 0, so −y = 6 and y = −6. The y-intercept is (0, −6). Sign matters: the line dips below the origin.",
          hi: "y-अक्ष पर x = 0, अतः −y = 6 और y = −6। y-अंतःखंड (0, −6)। चिह्न मायने रखता है: रेखा मूल के नीचे झुकती है।",
          mr: "y-अक्षावर x = 0, म्हणून −y = 6 आणि y = −6. y-छेदबिंदू (0, −6). चिन्ह महत्त्वाचे: रेषा आरंभबिंदूखाली झुकते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A line has slope 2 and passes through the origin. What is y when x = 5?",
          hi: "एक रेखा की प्रवणता 2 है और वह मूल से गुज़रती है। x = 5 पर y क्या है?",
          mr: "एका रेषेची प्रवणता 2 आहे आणि ती आरंभबिंदूतून जाते. x = 5 वर y काय?",
        },
        answer: 10,
        wrong: [7, 2.5, 12],
        checkExpr: "2*5",
        solution: {
          en: "Through the origin with slope 2: y = 2x, so y(5) = 10. Slope is how much y climbs per unit of x.",
          hi: "मूल से गुज़रती, प्रवणता 2: y = 2x, अतः y(5) = 10। प्रवणता बताती है x की हर इकाई पर y कितना चढ़ता है।",
          mr: "आरंभबिंदूतून, प्रवणता 2: y = 2x, म्हणून y(5) = 10. प्रवणता म्हणजे x च्या प्रत्येक एककाला y किती चढतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The cost of x kg of rice at ₹40/kg is y. Write y = 40x — what is y for 3 kg?",
          hi: "₹40/किग्रा पर x किग्रा चावल का दाम y है। y = 40x लिखिए — 3 किग्रा के लिए y क्या?",
          mr: "₹40/किलो दराने x किलो तांदळाची किंमत y आहे. y = 40x लिहा — 3 किलोसाठी y काय?",
        },
        answer: 120,
        wrong: [43, 40, 12],
        checkExpr: "40*3",
        solution: {
          en: "y = 40 × 3 = ₹120 — a real-world line through the origin. 43 adds 3 to 40 instead of scaling.",
          hi: "y = 40 × 3 = ₹120 — मूल से गुज़रती वास्तविक रेखा। 43 अनुपात की जगह 40 में 3 जोड़ देता है।",
          mr: "y = 40 × 3 = ₹120 — आरंभबिंदूतून जाणारी खरी रेषा. 43 प्रमाणाऐवजी 40 मध्ये 3 मिळवतो.",
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
          en: "Two numbers add to 20 and differ by 4. What is the LARGER number? (x + y = 20, x − y = 4.)",
          hi: "दो संख्याओं का योग 20 और अंतर 4 है। बड़ी संख्या कौन-सी? (x + y = 20, x − y = 4।)",
          mr: "दोन संख्यांची बेरीज 20 आणि फरक 4. मोठी संख्या कोणती? (x + y = 20, x − y = 4.)",
        },
        answer: 12,
        wrong: [16, 8, 10],
        checkExpr: "(20+4)/2",
        solution: {
          en: "Add the equations: 2x = 24, so x = 12 and y = 8. Adding two-variable equations can cancel a variable outright.",
          hi: "समीकरण जोड़िए: 2x = 24, अतः x = 12 और y = 8। दो-चर समीकरण जोड़ने से एक चर सीधे कट सकता है।",
          mr: "समीकरणे जोडा: 2x = 24, म्हणून x = 12 आणि y = 8. दोन-चल समीकरणे जोडल्यास एक चल थेट रद्द होऊ शकतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The line 4x + 3y = 24 has x-intercept a and y-intercept b. What is a + b?",
          hi: "रेखा 4x + 3y = 24 का x-अंतःखंड a और y-अंतःखंड b है। a + b क्या है?",
          mr: "रेषा 4x + 3y = 24 चा x-छेदबिंदू a आणि y-छेदबिंदू b आहे. a + b काय?",
        },
        answer: 14,
        wrong: [24, 6, 8],
        checkExpr: "6+8",
        solution: {
          en: "x-intercept: y=0 gives x=6. y-intercept: x=0 gives y=8. a + b = 6 + 8 = 14. Two crossings, one sum.",
          hi: "x-अंतःखंड: y=0 से x=6। y-अंतःखंड: x=0 से y=8। a + b = 6 + 8 = 14। दो कटान, एक योग।",
          mr: "x-छेदबिंदू: y=0 ने x=6. y-छेदबिंदू: x=0 ने y=8. a + b = 6 + 8 = 14. दोन छेद, एक बेरीज.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A taxi charges ₹50 fixed plus ₹15 per km. For a 6 km ride, what is the fare? (y = 50 + 15x.)",
          hi: "एक टैक्सी ₹50 नियत और ₹15 प्रति किमी लेती है। 6 किमी की सवारी का किराया? (y = 50 + 15x।)",
          mr: "एक टॅक्सी ₹50 ठरलेले आणि ₹15 प्रति किमी घेते. 6 किमी प्रवासाचे भाडे? (y = 50 + 15x.)",
        },
        answer: 140,
        wrong: [90, 390, 65],
        checkExpr: "50+15*6",
        solution: {
          en: "y = 50 + 15(6) = 50 + 90 = ₹140 — a line NOT through the origin, thanks to the fixed ₹50. 90 forgets the base fare.",
          hi: "y = 50 + 15(6) = 50 + 90 = ₹140 — नियत ₹50 के कारण मूल से न गुज़रती रेखा। 90 आधार-किराया भूल जाता है।",
          mr: "y = 50 + 15(6) = 50 + 90 = ₹140 — ठरलेल्या ₹50 मुळे आरंभबिंदूतून न जाणारी रेषा. 90 मूळ-भाडे विसरतो.",
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
          en: "The lines x + y = 6 and x − y = 2 meet at one point. What is its x-coordinate?",
          hi: "रेखाएँ x + y = 6 और x − y = 2 एक बिंदु पर मिलती हैं। उसका x-निर्देशांक क्या है?",
          mr: "रेषा x + y = 6 आणि x − y = 2 एका बिंदूवर मिळतात. त्याचा x-सहनिर्देशक काय?",
        },
        answer: 4,
        wrong: [2, 6, 3],
        checkExpr: "(6+2)/2",
        solution: {
          en: "Add: 2x = 8, so x = 4 (and y = 2). Two lines meet where both equations hold — the crossing is the shared solution.",
          hi: "जोड़िए: 2x = 8, अतः x = 4 (और y = 2)। दो रेखाएँ वहाँ मिलती हैं जहाँ दोनों समीकरण सही हों — कटान साझा हल है।",
          mr: "जोडा: 2x = 8, म्हणून x = 4 (आणि y = 2). दोन रेषा तिथे मिळतात जिथे दोन्ही समीकरणे खरी — छेद हेच सामाईक उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A number is such that twice it plus thrice another is 18, and the second number is 2. What is the first number? (2x + 3(2) = 18.)",
          hi: "एक संख्या ऐसी है कि उसका दुगुना और दूसरी का तिगुना 18 है, और दूसरी संख्या 2 है। पहली संख्या क्या है? (2x + 3(2) = 18।)",
          mr: "एक संख्या अशी की तिचा दुप्पट आणि दुसरीचा तिप्पट 18, आणि दुसरी संख्या 2. पहिली संख्या काय? (2x + 3(2) = 18.)",
        },
        answer: 6,
        wrong: [9, 4, 12],
        checkExpr: "(18-6)/2",
        solution: {
          en: "2x + 6 = 18 gives 2x = 12, x = 6. Once the second value is known, the two-variable equation collapses to one.",
          hi: "2x + 6 = 18 से 2x = 12, x = 6। दूसरा मान ज्ञात होते ही दो-चर समीकरण एक में सिमट जाता है।",
          mr: "2x + 6 = 18 मधून 2x = 12, x = 6. दुसरी किंमत कळताच दोन-चल समीकरण एकात आवळते.",
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
          en: "The lines y = 2x + 1 and y = 2x + 5 are parallel. How many points do they share?",
          hi: "रेखाएँ y = 2x + 1 और y = 2x + 5 समांतर हैं। वे कितने बिंदु साझा करती हैं?",
          mr: "रेषा y = 2x + 1 आणि y = 2x + 5 समांतर आहेत. त्या किती बिंदू सामाईक करतात?",
        },
        answer: 0,
        wrong: [1, 2, -1],
        solution: {
          en: "Same slope 2, different intercepts — they never meet, so 0 shared points. Parallel lines are a system with no solution.",
          hi: "समान प्रवणता 2, अलग अंतःखंड — वे कभी नहीं मिलतीं, अतः 0 साझा बिंदु। समांतर रेखाएँ बिना हल का निकाय हैं।",
          mr: "समान प्रवणता 2, वेगळे छेदबिंदू — त्या कधीच मिळत नाहीत, म्हणून 0 सामाईक बिंदू. समांतर रेषा म्हणजे उत्तराविनाची प्रणाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A boat goes 4 km/h faster downstream than up. If downstream speed is 12 km/h, upstream is 12 − 2c where c is the current. Find c given upstream speed is 8.",
          hi: "एक नाव धारा के साथ धारा के विरुद्ध से 4 किमी/घंटा तेज़ चलती है। यदि धारा के साथ चाल 12 किमी/घंटा है, विरुद्ध 12 − 2c है जहाँ c धारा है। यदि विरुद्ध चाल 8 है तो c निकालिए।",
          mr: "एक नाव प्रवाहासोबत प्रवाहाविरुद्धहून 4 किमी/तास जलद जाते. प्रवाहासोबत वेग 12 किमी/तास असेल, विरुद्ध 12 − 2c जिथे c प्रवाह. विरुद्ध वेग 8 असल्यास c काढा.",
        },
        answer: 2,
        wrong: [4, 1, 3],
        checkExpr: "(12-8)/2",
        solution: {
          en: "12 − 2c = 8 gives 2c = 4, c = 2 km/h. The 4 km/h gap between speeds is exactly twice the current — a two-equation story told in one line.",
          hi: "12 − 2c = 8 से 2c = 4, c = 2 किमी/घंटा। दोनों चालों का 4 किमी/घंटा अंतर ठीक धारा का दुगुना है — एक पंक्ति में कही दो-समीकरण कहानी।",
          mr: "12 − 2c = 8 मधून 2c = 4, c = 2 किमी/तास. दोन वेगांतला 4 किमी/तास फरक नेमका प्रवाहाच्या दुप्पट — एका ओळीत सांगितलेली दोन-समीकरण कथा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 4 — Linear Equations in Two Variables",
      name: "Linear Equations in Two Variables",
      slug: "maths-9-linear-two-variables",
      summary:
        "One equation, a whole line of solutions: intercepts read by zeroing a coordinate, real-world fares as lines off the origin, and parallel lines sharing not a single point.",
      position: 4,
      translations: {
        hi: {
          name: "दो चर वाले रैखिक समीकरण",
          summary:
            "एक समीकरण, हलों की पूरी रेखा: निर्देशांक शून्य कर पढ़े अंतःखंड, मूल से हटी रेखाओं जैसे असली किराए, और एक भी बिंदु न बाँटती समांतर रेखाएँ।",
        },
        mr: {
          name: "दोन चलांतील रेषीय समीकरणे",
          summary:
            "एक समीकरण, उत्तरांची अख्खी रेषा: सहनिर्देशक शून्य करून वाचलेले छेदबिंदू, आरंभबिंदूपासून हटलेल्या रेषांसारखी खरी भाडी, आणि एकही बिंदू न वाटणाऱ्या समांतर रेषा.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Introduction to Euclid's Geometry (axioms and proof)         */
/* ------------------------------------------------------------------------- */
function euclidGeometry(): TopicFileOut {
  const rand = rng("maths-9-euclid-geometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many lines can be drawn passing through TWO given distinct points?",
          hi: "दो दिए भिन्न बिंदुओं से होकर कितनी रेखाएँ खींची जा सकती हैं?",
          mr: "दोन दिलेल्या भिन्न बिंदूंतून किती रेषा काढता येतील?",
        },
        answer: 1,
        wrong: [2, 0, -1],
        solution: {
          en: "Exactly one line joins two distinct points — Euclid's foundational axiom. Two points pin a line down completely.",
          hi: "दो भिन्न बिंदुओं को ठीक एक रेखा जोड़ती है — यूक्लिड की आधारभूत अभिगृहीत। दो बिंदु रेखा को पूरी तरह जड़ देते हैं।",
          mr: "दोन भिन्न बिंदूंना नेमकी एक रेषा जोडते — युक्लिडचे पायाभूत स्वयंसिद्ध. दोन बिंदू रेषा पूर्ण ठरवतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many points does a line contain?",
          hi: "एक रेखा में कितने बिंदु होते हैं?",
          mr: "एका रेषेत किती बिंदू असतात?",
        },
        answer: -1,
        wrong: [2, 100, 1],
        fmt: (n) => (n === -1 ? { en: "infinitely many", hi: "अनंत", mr: "अनंत" } : { en: String(n), hi: String(n), mr: String(n) }),
        solution: {
          en: "A line holds infinitely many points — it can always be extended and always subdivided. Coded here as −1.",
          hi: "एक रेखा में अनंत बिंदु हैं — वह सदा बढ़ाई और सदा उपविभाजित की जा सकती है। यहाँ −1 से कोडित।",
          mr: "एका रेषेत अनंत बिंदू — ती नेहमी वाढवता आणि विभागता येते. इथे −1 ने कोड केले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Euclid's axiom: 'The whole is greater than the part.' If the whole is 10 and a part is 6, by how much is the whole greater?",
          hi: "यूक्लिड की अभिगृहीत: 'पूर्ण अपने भाग से बड़ा है।' यदि पूर्ण 10 और एक भाग 6 है, तो पूर्ण कितना बड़ा है?",
          mr: "युक्लिडचे स्वयंसिद्ध: 'पूर्ण त्याच्या भागाहून मोठे.' पूर्ण 10 आणि एक भाग 6 असल्यास, पूर्ण किती मोठे?",
        },
        answer: 4,
        wrong: [16, 6, 10],
        checkExpr: "10-6",
        solution: {
          en: "10 − 6 = 4: the whole exceeds the part by 4. Euclid's 'common notions' are the arithmetic every proof leans on.",
          hi: "10 − 6 = 4: पूर्ण भाग से 4 अधिक है। यूक्लिड की 'सर्वमान्य धारणाएँ' वह अंकगणित हैं जिस पर हर उपपत्ति टिकती है।",
          mr: "10 − 6 = 4: पूर्ण भागाहून 4 जास्त. युक्लिडच्या 'सर्वमान्य कल्पना' म्हणजे प्रत्येक सिद्धता ज्यावर टेकते ते अंकगणित.",
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
          en: "Euclid's axiom: 'Things equal to the same thing are equal to one another.' If a = c and b = c, and c = 7, what is a?",
          hi: "यूक्लिड की अभिगृहीत: 'एक ही वस्तु के बराबर वस्तुएँ आपस में बराबर हैं।' यदि a = c और b = c, और c = 7, तो a क्या है?",
          mr: "युक्लिडचे स्वयंसिद्ध: 'एकाच गोष्टीइतक्या गोष्टी परस्परांइतक्या.' जर a = c आणि b = c, आणि c = 7, तर a काय?",
        },
        answer: 7,
        wrong: [14, 0, 3.5],
        solution: {
          en: "a = c = 7, and b = 7 too, so a = b — the transitive axiom in action. This 'obvious' rule licenses countless proof steps.",
          hi: "a = c = 7, और b = 7 भी, अतः a = b — क्रियाशील संक्रामक अभिगृहीत। यह 'स्पष्ट' नियम असंख्य उपपत्ति-क़दमों को वैध करता है।",
          mr: "a = c = 7, आणि b = 7 ही, म्हणून a = b — कार्यरत संक्रामक स्वयंसिद्ध. हा 'उघड' नियम असंख्य सिद्धता-पावले वैध करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Through a point NOT on a given line, how many lines can be drawn parallel to it?",
          hi: "दी गई रेखा पर न स्थित एक बिंदु से होकर उसके समांतर कितनी रेखाएँ खींची जा सकती हैं?",
          mr: "दिलेल्या रेषेवर नसलेल्या एका बिंदूतून तिला समांतर किती रेषा काढता येतील?",
        },
        answer: 1,
        wrong: [2, 0, -1],
        solution: {
          en: "Exactly one — the essence of Euclid's famous fifth postulate. That 'exactly one' shaped two thousand years of geometry.",
          hi: "ठीक एक — यूक्लिड की मशहूर पाँचवीं अभिधारणा का सार। उस 'ठीक एक' ने दो हज़ार साल की ज्यामिति गढ़ी।",
          mr: "नेमकी एक — युक्लिडच्या प्रसिद्ध पाचव्या गृहीतकाचे सार. त्या 'नेमकी एक' ने दोन हजार वर्षांची भूमिती घडवली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A line segment AB has a midpoint M. If AB = 14, what is AM?",
          hi: "रेखाखंड AB का मध्य-बिंदु M है। यदि AB = 14, तो AM क्या है?",
          mr: "रेषाखंड AB चा मध्यबिंदू M आहे. जर AB = 14, तर AM काय?",
        },
        answer: 7,
        wrong: [14, 28, 3.5],
        checkExpr: "14/2",
        solution: {
          en: "The midpoint splits AB into two equal halves: AM = 14 ÷ 2 = 7. By definition M sits exactly in the middle.",
          hi: "मध्य-बिंदु AB को दो बराबर आधों में बाँटता है: AM = 14 ÷ 2 = 7। परिभाषा से M ठीक बीच में है।",
          mr: "मध्यबिंदू AB ला दोन समान अर्ध्यांत विभागतो: AM = 14 ÷ 2 = 7. व्याख्येनुसार M नेमका मध्यभागी.",
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
          en: "If a whole angle of 90° is split into two parts and one part is 35°, what is the other?",
          hi: "यदि 90° का पूरा कोण दो भागों में बँटे और एक भाग 35° हो, तो दूसरा क्या है?",
          mr: "जर 90° चा पूर्ण कोन दोन भागांत विभागला आणि एक भाग 35° असेल, तर दुसरा काय?",
        },
        answer: 55,
        wrong: [65, 125, 45],
        checkExpr: "90-35",
        fmt: deg,
        solution: {
          en: "The parts add to the whole: 90 − 35 = 55°. Euclid's 'the whole equals the sum of its parts' does the arithmetic.",
          hi: "भाग मिलकर पूर्ण बनते हैं: 90 − 35 = 55°। यूक्लिड का 'पूर्ण अपने भागों के योग के बराबर' अंकगणित कर देता है।",
          mr: "भाग मिळून पूर्ण होते: 90 − 35 = 55°. युक्लिडचे 'पूर्ण म्हणजे भागांची बेरीज' अंकगणित करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Euclid's axiom: 'If equals are added to equals, the wholes are equal.' If a = b and both get +5, and a was 3, what does each whole equal?",
          hi: "यूक्लिड की अभिगृहीत: 'बराबरों में बराबर जोड़ने पर पूर्ण बराबर होते हैं।' यदि a = b और दोनों में +5, और a था 3, तो हर पूर्ण किसके बराबर?",
          mr: "युक्लिडचे स्वयंसिद्ध: 'समानांत समान मिळवल्यास पूर्ण समान.' जर a = b आणि दोघांत +5, आणि a होता 3, तर प्रत्येक पूर्ण कशाइतके?",
        },
        answer: 8,
        wrong: [5, 3, 13],
        checkExpr: "3+5",
        solution: {
          en: "a + 5 = 3 + 5 = 8, and b + 5 = 8 too, keeping them equal. This axiom is why you may 'do the same to both sides.'",
          hi: "a + 5 = 3 + 5 = 8, और b + 5 = 8 भी, दोनों बराबर बने रहते हैं। इसी अभिगृहीत से आप 'दोनों पक्षों के साथ एक-सा' कर सकते हैं।",
          mr: "a + 5 = 3 + 5 = 8, आणि b + 5 = 8 ही, दोघे समान राहतात. याच स्वयंसिद्धामुळे तुम्ही 'दोन्ही बाजूंशी सारखे' करू शकता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A ray stands on a line making two angles. If one is 110°, what is the other (a linear pair)?",
          hi: "एक किरण रेखा पर खड़ी दो कोण बनाती है। यदि एक 110° हो, तो दूसरा (रैखिक युग्म) क्या है?",
          mr: "एक किरण रेषेवर उभी दोन कोन करते. जर एक 110° असेल, तर दुसरा (रेषीय जोडी) काय?",
        },
        answer: 70,
        wrong: [110, 250, 20],
        checkExpr: "180-110",
        fmt: deg,
        solution: {
          en: "A linear pair totals 180°: 180 − 110 = 70°. The straight line is a 180° angle divided in two.",
          hi: "रैखिक युग्म का योग 180°: 180 − 110 = 70°। सीधी रेखा दो में बँटा 180° कोण है।",
          mr: "रेषीय जोडीची बेरीज 180°: 180 − 110 = 70°. सरळ रेषा म्हणजे दोनत विभागलेला 180° कोन.",
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
          en: "Two lines cross. One angle is 3 times its neighbour on the line. What is the LARGER angle?",
          hi: "दो रेखाएँ काटती हैं। एक कोण रेखा पर अपने पड़ोसी का 3 गुना है। बड़ा कोण कितना?",
          mr: "दोन रेषा छेदतात. एक कोन रेषेवरील शेजाऱ्याच्या 3 पट. मोठा कोन किती?",
        },
        answer: 135,
        wrong: [45, 90, 120],
        checkExpr: "3*180/4",
        fmt: deg,
        solution: {
          en: "Neighbours share 180°: x + 3x = 180 gives x = 45, so the larger is 135°. Four equal parts, three of them making the big angle.",
          hi: "पड़ोसी 180° बाँटते हैं: x + 3x = 180 से x = 45, अतः बड़ा 135°। चार बराबर भाग, तीन मिलकर बड़ा कोण।",
          mr: "शेजारी 180° वाटतात: x + 3x = 180 मधून x = 45, म्हणून मोठा 135°. चार समान भाग, तीन मिळून मोठा कोन.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If AB = CD and CD = EF, and EF = 9, what is AB? (equals to the same thing)",
          hi: "यदि AB = CD और CD = EF, और EF = 9, तो AB क्या है? (एक ही वस्तु के बराबर)",
          mr: "जर AB = CD आणि CD = EF, आणि EF = 9, तर AB काय? (एकाच गोष्टीइतके)",
        },
        answer: 9,
        wrong: [18, 27, 3],
        solution: {
          en: "AB = CD = EF = 9 — the transitive chain. Three equalities, linked, force AB to match EF exactly.",
          hi: "AB = CD = EF = 9 — संक्रामक शृंखला। तीन समानताएँ, जुड़ी हुई, AB को EF से हूबहू मिला देती हैं।",
          mr: "AB = CD = EF = 9 — संक्रामक साखळी. तीन समानता, जुळलेल्या, AB ला EF शी हुबेहूब जुळवतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A point C lies between A and B on a segment. If AC = 5 and CB = 8, what is AB? (whole = sum of parts)",
          hi: "बिंदु C, खंड पर A और B के बीच है। यदि AC = 5 और CB = 8, तो AB क्या? (पूर्ण = भागों का योग)",
          mr: "बिंदू C, खंडावर A आणि B च्या दरम्यान आहे. जर AC = 5 आणि CB = 8, तर AB काय? (पूर्ण = भागांची बेरीज)",
        },
        answer: 13,
        wrong: [3, 40, 6.5],
        checkExpr: "5+8",
        solution: {
          en: "AB = AC + CB = 5 + 8 = 13. A point between two others splits the whole into parts that add back to it.",
          hi: "AB = AC + CB = 5 + 8 = 13। दो के बीच का बिंदु पूर्ण को उन भागों में बाँटता है जो जुड़कर फिर वही बनते हैं।",
          mr: "AB = AC + CB = 5 + 8 = 13. दोघांमधला बिंदू पूर्णाला त्या भागांत विभागतो जे जुळून पुन्हा तेच होतात.",
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
          en: "Vertically opposite angles are equal. Two lines cross; one angle is 40°. What is the angle vertically opposite it?",
          hi: "शीर्षाभिमुख कोण बराबर होते हैं। दो रेखाएँ काटती हैं; एक कोण 40° है। उसके शीर्षाभिमुख कोण कितना?",
          mr: "समोरासमोरचे कोन समान असतात. दोन रेषा छेदतात; एक कोन 40° आहे. त्याच्या समोरचा कोन किती?",
        },
        answer: 40,
        wrong: [140, 50, 320],
        fmt: deg,
        solution: {
          en: "Vertically opposite angles are equal — a theorem PROVED from the linear-pair axiom, not merely assumed. So the opposite is 40°.",
          hi: "शीर्षाभिमुख कोण बराबर होते हैं — रैखिक-युग्म अभिगृहीत से सिद्ध प्रमेय, केवल मान लिया गया नहीं। अतः सामने 40°।",
          mr: "समोरासमोरचे कोन समान — रेषीय-जोडी स्वयंसिद्धावरून सिद्ध प्रमेय, नुसते गृहीत नाही. म्हणून समोरचा 40°.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A segment is trisected into three equal parts by two points. If the whole is 24, how long is each part?",
          hi: "एक खंड को दो बिंदुओं से तीन बराबर भागों में बाँटा गया है। यदि पूर्ण 24 है, हर भाग कितना लंबा?",
          mr: "एक खंड दोन बिंदूंनी तीन समान भागांत विभागला. जर पूर्ण 24 असेल, प्रत्येक भाग किती लांब?",
        },
        answer: 8,
        wrong: [12, 6, 24],
        checkExpr: "24/3",
        solution: {
          en: "Three equal parts: 24 ÷ 3 = 8 each. Trisection means three, just as bisection means two.",
          hi: "तीन बराबर भाग: 24 ÷ 3 = 8 प्रत्येक। त्रिविभाजन यानी तीन, जैसे द्विविभाजन यानी दो।",
          mr: "तीन समान भाग: 24 ÷ 3 = 8 प्रत्येकी. त्रिभाजन म्हणजे तीन, जसे द्विभाजन म्हणजे दोन.",
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
          en: "For centuries mathematicians tried to PROVE Euclid's fifth postulate from the other four, and always failed. How many consistent geometries arise from CHANGING it?",
          hi: "सदियों गणितज्ञ यूक्लिड की पाँचवीं अभिधारणा को बाक़ी चार से सिद्ध करने में लगे रहे, और सदा विफल रहे। उसे बदलने से कितनी संगत ज्यामितियाँ जन्म लेती हैं?",
          mr: "शतके गणितज्ञ युक्लिडचे पाचवे गृहीतक बाकी चारांवरून सिद्ध करण्यात लागले, आणि नेहमी अपयशी. ते बदलल्याने किती सुसंगत भूमिती जन्मतात?",
        },
        answer: 2,
        wrong: [0, 1, 100],
        solution: {
          en: "Two whole new geometries appear — spherical (no parallels) and hyperbolic (many parallels) — both perfectly consistent. The fifth postulate could not be proved because it was a CHOICE, not a consequence; denying it builds valid new worlds.",
          hi: "दो पूरी नई ज्यामितियाँ प्रकट होती हैं — गोलीय (कोई समांतर नहीं) और अतिपरवलयिक (कई समांतर) — दोनों पूर्णतः संगत। पाँचवीं अभिधारणा सिद्ध न हो सकी क्योंकि वह चुनाव थी, परिणाम नहीं; उसे नकारने से वैध नए संसार बनते हैं।",
          mr: "दोन पूर्ण नव्या भूमिती प्रकटतात — गोलीय (समांतर नाही) आणि अतिपरवलयिक (अनेक समांतर) — दोन्ही पूर्ण सुसंगत. पाचवे गृहीतक सिद्ध होऊ शकले नाही कारण ती निवड होती, परिणाम नव्हे; ते नाकारल्याने वैध नवे जग बनतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "An axiom is accepted without proof; a theorem must be proved. Of these — 'the whole is greater than the part', 'vertically opposite angles are equal', 'a straight line may be drawn between any two points' — how many are THEOREMS (need proof)?",
          hi: "अभिगृहीत बिना प्रमाण स्वीकृत होती है; प्रमेय सिद्ध करनी पड़ती है। इनमें — 'पूर्ण भाग से बड़ा है', 'शीर्षाभिमुख कोण बराबर हैं', 'किन्हीं दो बिंदुओं के बीच सीधी रेखा खींची जा सकती है' — कितनी प्रमेय हैं (प्रमाण चाहिए)?",
          mr: "स्वयंसिद्ध पुराव्याविना स्वीकारले जाते; प्रमेय सिद्ध करावे लागते. यांत — 'पूर्ण भागाहून मोठे', 'समोरासमोरचे कोन समान', 'कोणत्याही दोन बिंदूंत सरळ रेषा काढता येते' — किती प्रमेये आहेत (पुरावा हवा)?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        solution: {
          en: "Only ONE: 'vertically opposite angles are equal' must be proved from the axioms. The other two are Euclid's accepted starting points — the bedrock granted without proof. Telling axiom from theorem is knowing what you are allowed to assume.",
          hi: "केवल एक: 'शीर्षाभिमुख कोण बराबर हैं' अभिगृहीतों से सिद्ध करनी होगी। बाक़ी दो यूक्लिड के स्वीकृत आरंभ-बिंदु हैं — बिना प्रमाण दी गई नींव। अभिगृहीत को प्रमेय से अलग जानना यह जानना है कि आप क्या मान सकते हैं।",
          mr: "फक्त एक: 'समोरासमोरचे कोन समान' स्वयंसिद्धांवरून सिद्ध करावे लागेल. बाकी दोन युक्लिडचे स्वीकृत आरंभबिंदू — पुराव्याविना दिलेला पाया. स्वयंसिद्ध प्रमेयापासून ओळखणे म्हणजे तुम्ही काय गृहीत धरू शकता हे जाणणे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 5 — Introduction to Euclid's Geometry",
      name: "Introduction to Euclid's Geometry",
      slug: "maths-9-euclid-geometry",
      summary:
        "Geometry gets a spine of axiom and proof: common notions that license every step, the fifth postulate revealed as a choice — and two new worlds built by denying it.",
      position: 5,
      translations: {
        hi: {
          name: "यूक्लिड की ज्यामिति का परिचय",
          summary:
            "ज्यामिति को अभिगृहीत और उपपत्ति की रीढ़ मिलती है: हर क़दम को वैध करती सर्वमान्य धारणाएँ, चुनाव के रूप में उघड़ी पाँचवीं अभिधारणा — और उसे नकारकर बने दो नए संसार।",
        },
        mr: {
          name: "युक्लिडच्या भूमितीची ओळख",
          summary:
            "भूमितीला स्वयंसिद्ध आणि सिद्धतेचा कणा मिळतो: प्रत्येक पाऊल वैध करणाऱ्या सर्वमान्य कल्पना, निवड म्हणून उघड झालेले पाचवे गृहीतक — आणि ते नाकारून बनलेले दोन नवे जग.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Lines and Angles (parallels and the triangle's 180)          */
/* ------------------------------------------------------------------------- */
function linesAndAngles9(): TopicFileOut {
  const rand = rng("maths-9-lines-and-angles");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Two angles on a straight line are 130° and x. What is x?",
          hi: "एक सीधी रेखा पर दो कोण 130° और x हैं। x क्या है?",
          mr: "सरळ रेषेवर दोन कोन 130° आणि x आहेत. x किती?",
        },
        answer: 50,
        wrong: [230, 55, 60],
        checkExpr: "180-130",
        fmt: deg,
        solution: {
          en: "A linear pair sums to 180°: x = 180 − 130 = 50°. The straight line is a 180° angle split in two.",
          hi: "रैखिक युग्म का योग 180°: x = 180 − 130 = 50°। सीधी रेखा दो में बँटा 180° कोण है।",
          mr: "रेषीय जोडीची बेरीज 180°: x = 180 − 130 = 50°. सरळ रेषा म्हणजे दोनत विभागलेला 180° कोन.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Angles around a point add to how many degrees?",
          hi: "एक बिंदु के चारों ओर के कोण कितने डिग्री जोड़ते हैं?",
          mr: "एका बिंदूभोवतीचे कोन किती अंश होतात?",
        },
        answer: 360,
        wrong: [180, 90, 720],
        fmt: deg,
        solution: {
          en: "A full turn about a point is 360°. All the angles meeting there share that whole circle.",
          hi: "किसी बिंदु के गिर्द पूरा चक्कर 360° है। वहाँ मिलते सभी कोण उस पूरे घेरे को बाँटते हैं।",
          mr: "एका बिंदूभोवती पूर्ण फेरी 360°. तिथे मिळणारे सारे कोन ते पूर्ण वर्तुळ वाटतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two parallel lines are cut by a transversal. A corresponding angle to 65° measures?",
          hi: "दो समांतर रेखाओं को तिर्यक रेखा काटती है। 65° का संगत कोण कितना?",
          mr: "दोन समांतर रेषांना छेदिका छेदते. 65° चा संगत कोन किती?",
        },
        answer: 65,
        wrong: [115, 25, 130],
        fmt: deg,
        solution: {
          en: "Corresponding angles are equal across parallels: 65°. 115 is the co-interior partner, which sums to 180 instead.",
          hi: "समांतरों के आर-पार संगत कोण बराबर: 65°। 115 एक-ओर का अंतःकोण-साथी है, जो 180 तक जोड़ता है।",
          mr: "समांतरांपार संगत कोन समान: 65°. 115 हा एका बाजूचा आंतरकोन-जोडीदार, जो 180 पर्यंत जुळतो.",
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
          en: "The three angles of a triangle are 50°, 60° and x. Find x.",
          hi: "त्रिभुज के तीन कोण 50°, 60° और x हैं। x निकालिए।",
          mr: "त्रिकोणाचे तीन कोन 50°, 60° आणि x आहेत. x काढा.",
        },
        answer: 70,
        wrong: [110, 80, 60],
        checkExpr: "180-50-60",
        fmt: deg,
        solution: {
          en: "The angles total 180°: x = 180 − 110 = 70°. 110 stops at the sum of the two given.",
          hi: "कोणों का योग 180°: x = 180 − 110 = 70°। 110 दो दिए कोणों के योग पर रुक जाता है।",
          mr: "कोनांची बेरीज 180°: x = 180 − 110 = 70°. 110 दिलेल्या दोन कोनांच्या बेरजेवर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "An exterior angle of a triangle is 120°. One remote interior angle is 45°. What is the other remote interior angle?",
          hi: "त्रिभुज का बाह्य कोण 120° है। एक दूरस्थ अंतःकोण 45° है। दूसरा दूरस्थ अंतःकोण कितना?",
          mr: "त्रिकोणाचा बाह्यकोन 120° आहे. एक दूरस्थ आंतरकोन 45° आहे. दुसरा दूरस्थ आंतरकोन किती?",
        },
        answer: 75,
        wrong: [60, 165, 55],
        checkExpr: "120-45",
        fmt: deg,
        solution: {
          en: "The exterior angle equals the sum of the two remote interiors: 120 − 45 = 75°. No need for the third angle at all.",
          hi: "बाह्य कोण दोनों दूरस्थ अंतःकोणों के योग के बराबर: 120 − 45 = 75°। तीसरे कोण की ज़रूरत ही नहीं।",
          mr: "बाह्यकोन दोन दूरस्थ आंतरकोनांच्या बेरजेइतका: 120 − 45 = 75°. तिसऱ्या कोनाची गरजच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Between parallels, a co-interior angle is 108°. Its partner on the same side is?",
          hi: "समांतरों के बीच एक-ओर का अंतःकोण 108° है। उसी ओर का साथी कितना?",
          mr: "समांतरांमध्ये एका बाजूचा आंतरकोन 108° आहे. त्याच बाजूचा जोडीदार किती?",
        },
        answer: 72,
        wrong: [108, 252, 82],
        checkExpr: "180-108",
        fmt: deg,
        solution: {
          en: "Co-interior angles sum to 180°: 180 − 108 = 72°. Copying (108) is for alternate and corresponding, not same-side.",
          hi: "एक-ओर के अंतःकोण 180° तक जुड़ते हैं: 180 − 108 = 72°। नक़ल (108) एकांतर और संगत की है, एक-ओर की नहीं।",
          mr: "एका बाजूचे आंतरकोन 180° पर्यंत जुळतात: 180 − 108 = 72°. नक्कल (108) व्युत्क्रम आणि संगतासाठी, एका बाजूसाठी नाही.",
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
          en: "The angles of a triangle are in the ratio 2 : 3 : 4. What is the largest?",
          hi: "त्रिभुज के कोण 2 : 3 : 4 के अनुपात में हैं। सबसे बड़ा कितना?",
          mr: "त्रिकोणाचे कोन 2 : 3 : 4 गुणोत्तरात आहेत. सर्वांत मोठा किती?",
        },
        answer: 80,
        wrong: [40, 60, 90],
        checkExpr: "180*4/9",
        fmt: deg,
        solution: {
          en: "Nine parts share 180°, one part 20°; the largest takes 4 × 20 = 80°. 40 stops at two parts.",
          hi: "नौ भाग 180° बाँटते हैं, एक भाग 20°; सबसे बड़ा 4 × 20 = 80°। 40 दो भागों पर रुकता है।",
          mr: "नऊ भाग 180° वाटतात, एक भाग 20°; सर्वांत मोठा 4 × 20 = 80°. 40 दोन भागांवर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In a right triangle, one acute angle is 32°. What is the other acute angle?",
          hi: "समकोण त्रिभुज में एक न्यून कोण 32° है। दूसरा न्यून कोण कितना?",
          mr: "काटकोन त्रिकोणात एक लघुकोन 32° आहे. दुसरा लघुकोन किती?",
        },
        answer: 58,
        wrong: [148, 68, 48],
        checkExpr: "90-32",
        fmt: deg,
        solution: {
          en: "The right angle takes 90, so the two acute angles share the other 90: 90 − 32 = 58°. 148 forgets the right angle spent its share.",
          hi: "समकोण 90 लेता है, अतः दोनों न्यून कोण बाक़ी 90 बाँटते हैं: 90 − 32 = 58°। 148 भूल जाता है कि समकोण अपना हिस्सा ले चुका।",
          mr: "काटकोन 90 घेतो, म्हणून दोन लघुकोन उरलेले 90 वाटतात: 90 − 32 = 58°. 148 विसरतो की काटकोनाने आपला वाटा घेतला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "An isosceles triangle has a vertex angle of 40°. Each base angle is?",
          hi: "समद्विबाहु त्रिभुज का शीर्ष कोण 40° है। हर आधार कोण कितना?",
          mr: "समद्विभुज त्रिकोणाचा शिरोकोन 40° आहे. प्रत्येक पायाकोन किती?",
        },
        answer: 70,
        wrong: [40, 140, 100],
        checkExpr: "(180-40)/2",
        fmt: deg,
        solution: {
          en: "The remaining 140° splits equally: 70° each. Base angles of an isosceles triangle are equal.",
          hi: "बची 140° बराबर बँटती है: 70°-70°। समद्विबाहु के आधार कोण बराबर होते हैं।",
          mr: "उरलेले 140° सारखे वाटतात: प्रत्येकी 70°. समद्विभुजाचे पायाकोन समान असतात.",
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
          en: "Two parallel lines are cut by a transversal; the two co-interior angles are (2x) and (x + 30). Find x.",
          hi: "दो समांतर रेखाओं को तिर्यक रेखा काटती है; दोनों एक-ओर के अंतःकोण (2x) और (x + 30) हैं। x निकालिए।",
          mr: "दोन समांतर रेषांना छेदिका छेदते; दोन्ही एका बाजूचे आंतरकोन (2x) आणि (x + 30) आहेत. x काढा.",
        },
        answer: 50,
        wrong: [30, 60, 75],
        checkExpr: "(180-30)/3",
        fmt: deg,
        solution: {
          en: "Co-interior angles sum to 180: 2x + x + 30 = 180, so 3x = 150 and x = 50. Check: 100 + 80 = 180 ✓.",
          hi: "एक-ओर के अंतःकोण 180 तक: 2x + x + 30 = 180, अतः 3x = 150 और x = 50। जाँच: 100 + 80 = 180 ✓।",
          mr: "एका बाजूचे आंतरकोन 180 पर्यंत: 2x + x + 30 = 180, म्हणून 3x = 150 आणि x = 50. पडताळणी: 100 + 80 = 180 ✓.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The three angles of a triangle are x, x + 10 and x + 20. What is the largest?",
          hi: "त्रिभुज के तीन कोण x, x + 10 और x + 20 हैं। सबसे बड़ा कितना?",
          mr: "त्रिकोणाचे तीन कोन x, x + 10 आणि x + 20 आहेत. सर्वांत मोठा किती?",
        },
        answer: 70,
        wrong: [50, 60, 80],
        checkExpr: "(180-30)/3+20",
        fmt: deg,
        solution: {
          en: "3x + 30 = 180 gives x = 50, so the angles are 50, 60, 70 — the largest is 70°. 50 answers x itself.",
          hi: "3x + 30 = 180 से x = 50, अतः कोण 50, 60, 70 — सबसे बड़ा 70°। 50 स्वयं x का उत्तर है।",
          mr: "3x + 30 = 180 मधून x = 50, म्हणून कोन 50, 60, 70 — सर्वांत मोठा 70°. 50 हे स्वतः x चे उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "In triangle ABC, angle A = 2·angle B and angle C = 90°. What is angle B?",
          hi: "त्रिभुज ABC में कोण A = 2·कोण B और कोण C = 90°। कोण B कितना?",
          mr: "त्रिकोण ABC मध्ये कोन A = 2·कोन B आणि कोन C = 90°. कोन B किती?",
        },
        answer: 30,
        wrong: [60, 45, 90],
        checkExpr: "90/3",
        fmt: deg,
        solution: {
          en: "A + B = 90 (since C = 90), and A = 2B, so 3B = 90, B = 30°. Then A = 60°. The right angle fixes A + B.",
          hi: "A + B = 90 (क्योंकि C = 90), और A = 2B, अतः 3B = 90, B = 30°। फिर A = 60°। समकोण A + B तय करता है।",
          mr: "A + B = 90 (कारण C = 90), आणि A = 2B, म्हणून 3B = 90, B = 30°. मग A = 60°. काटकोन A + B ठरवतो.",
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
          en: "Two lines are parallel. A transversal makes an angle of (3x − 5)° with one and its corresponding angle (2x + 20)° with the other. Find x.",
          hi: "दो रेखाएँ समांतर हैं। तिर्यक रेखा एक से (3x − 5)° और दूसरी से संगत कोण (2x + 20)° बनाती है। x निकालिए।",
          mr: "दोन रेषा समांतर आहेत. छेदिका एकाशी (3x − 5)° आणि दुसऱ्याशी संगत कोन (2x + 20)° करते. x काढा.",
        },
        answer: 25,
        wrong: [5, 15, 30],
        checkExpr: "20+5",
        solution: {
          en: "Corresponding angles are equal: 3x − 5 = 2x + 20, so x = 25. Both angles then equal 70° ✓.",
          hi: "संगत कोण बराबर: 3x − 5 = 2x + 20, अतः x = 25। दोनों कोण फिर 70° ✓।",
          mr: "संगत कोन समान: 3x − 5 = 2x + 20, म्हणून x = 25. दोन्ही कोन मग 70° ✓.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The bisectors of the two base angles of a triangle meet at a point. If the vertex angle is 80°, the angle between the bisectors is 90° + half the vertex. Compute it.",
          hi: "त्रिभुज के दोनों आधार कोणों के समद्विभाजक एक बिंदु पर मिलते हैं। यदि शीर्ष कोण 80° हो, समद्विभाजकों के बीच का कोण 90° + आधा शीर्ष है। निकालिए।",
          mr: "त्रिकोणाच्या दोन पायाकोनांचे दुभाजक एका बिंदूवर मिळतात. शिरोकोन 80° असल्यास, दुभाजकांमधला कोन 90° + अर्धा शिरोकोन. काढा.",
        },
        answer: 130,
        wrong: [90, 170, 100],
        checkExpr: "90+80/2",
        fmt: deg,
        solution: {
          en: "90 + 80/2 = 90 + 40 = 130°. The bisectors' meeting angle is always 90° plus half the vertex — a tidy standard result.",
          hi: "90 + 80/2 = 90 + 40 = 130°। समद्विभाजकों का मिलन-कोण सदा 90° और आधा शीर्ष होता है — एक साफ़ मानक परिणाम।",
          mr: "90 + 80/2 = 90 + 40 = 130°. दुभाजकांचा भेट-कोन नेहमी 90° आणि अर्धा शिरोकोन — एक नीटस प्रमाण निकाल.",
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
          en: "A student claims a triangle can have angles 90°, 60° and 40°. Add them: what total do you get, and does a triangle allow it?",
          hi: "एक विद्यार्थी का दावा है कि त्रिभुज के कोण 90°, 60° और 40° हो सकते हैं। जोड़िए: कुल कितना मिलता है, और क्या त्रिभुज इसकी अनुमति देता है?",
          mr: "एका विद्यार्थ्याचा दावा की त्रिकोणाचे कोन 90°, 60° आणि 40° असू शकतात. जोडा: एकूण किती मिळते, आणि त्रिकोण याला परवानगी देतो का?",
        },
        answer: 190,
        wrong: [180, 170, 200],
        checkExpr: "90+60+40",
        fmt: deg,
        solution: {
          en: "90 + 60 + 40 = 190° — but a triangle's angles must total exactly 180°. The extra 10° convicts the claim: no such triangle exists. One sum refutes it.",
          hi: "90 + 60 + 40 = 190° — पर त्रिभुज के कोणों का योग ठीक 180° होना चाहिए। अतिरिक्त 10° दावे को दोषी ठहराता है: ऐसा त्रिभुज है ही नहीं। एक योग उसे ख़ारिज कर देता है।",
          mr: "90 + 60 + 40 = 190° — पण त्रिकोणाच्या कोनांची बेरीज नेमकी 180° हवी. जादा 10° दाव्याला दोषी ठरवते: असा त्रिकोण नाहीच. एक बेरीज त्याला बाद करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A ray of light hits a mirror and reflects; the incident and reflected rays make equal angles with the mirror. If they make 40° between the incident ray and mirror, the total turn of the light (twice the complement's... ) — simply, the angle between incident and reflected rays is 180 − 2×40. Compute it.",
          hi: "प्रकाश की किरण दर्पण से टकराकर परावर्तित होती है; आपतित और परावर्तित किरणें दर्पण से बराबर कोण बनाती हैं। यदि आपतित किरण और दर्पण के बीच 40° हो, आपतित और परावर्तित किरणों के बीच का कोण 180 − 2×40 है। निकालिए।",
          mr: "प्रकाशकिरण आरशावर आदळून परावर्तित होते; आपाती आणि परावर्तित किरणे आरशाशी समान कोन करतात. आपाती किरण आणि आरशात 40° असल्यास, आपाती आणि परावर्तित किरणांतला कोन 180 − 2×40 आहे. काढा.",
        },
        answer: 100,
        wrong: [80, 40, 140],
        checkExpr: "180-2*40",
        fmt: deg,
        solution: {
          en: "Both rays sit 40° from the mirror on the straight surface, so between them: 180 − 40 − 40 = 100°. Geometry of angles is the geometry of light.",
          hi: "दोनों किरणें सीधी सतह पर दर्पण से 40° हैं, अतः उनके बीच: 180 − 40 − 40 = 100°। कोणों की ज्यामिति ही प्रकाश की ज्यामिति है।",
          mr: "दोन्ही किरणे सरळ पृष्ठावर आरशापासून 40°, म्हणून त्यांच्यामध्ये: 180 − 40 − 40 = 100°. कोनांची भूमिती हीच प्रकाशाची भूमिती.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 6 — Lines and Angles",
      name: "Lines and Angles",
      slug: "maths-9-lines-and-angles",
      summary:
        "Parallels copy their crossings and the triangle's three angles hold at 180 — exterior angles read off two interiors, and one bad sum refuting a triangle that cannot be.",
      position: 6,
      translations: {
        hi: {
          name: "रेखाएँ और कोण",
          summary:
            "समांतर अपने चौराहों की नक़ल करते और त्रिभुज के तीन कोण 180 पर टिकते हैं — बाह्य कोण दो अंतःकोणों से पढ़े, और एक बुरा योग एक असंभव त्रिभुज को ख़ारिज करता।",
        },
        mr: {
          name: "रेषा आणि कोन",
          summary:
            "समांतर आपल्या छेदांची नक्कल करतात आणि त्रिकोणाचे तीन कोन 180 वर टिकतात — बाह्यकोन दोन आंतरकोनांवरून वाचलेले, आणि एक चुकीची बेरीज अशक्य त्रिकोणाला बाद करते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Triangles (congruence with proof)                            */
/* ------------------------------------------------------------------------- */
function triangles9(): TopicFileOut {
  const rand = rng("maths-9-triangles");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "To prove two triangles congruent by SSS, how many pairs of equal sides are needed?",
          hi: "SSS से दो त्रिभुज सर्वांगसम सिद्ध करने के लिए बराबर भुजाओं के कितने जोड़े चाहिए?",
          mr: "SSS ने दोन त्रिकोण एकरूप सिद्ध करण्यासाठी समान बाजूंच्या किती जोड्या लागतात?",
        },
        answer: 3,
        wrong: [2, 1, 4],
        solution: {
          en: "Side-Side-Side needs all 3 pairs — three matching sides pin the triangle rigid.",
          hi: "भुजा-भुजा-भुजा को तीनों 3 जोड़े चाहिए — तीन मिलती भुजाएँ त्रिभुज को जड़ बना देती हैं।",
          mr: "बाजू-बाजू-बाजूला तिन्ही 3 जोड्या हव्यात — तीन जुळणाऱ्या बाजू त्रिकोण घट्ट करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In an equilateral triangle, each angle measures?",
          hi: "समबाहु त्रिभुज में हर कोण कितने का होता है?",
          mr: "समभुज त्रिकोणात प्रत्येक कोन किती अंशांचा असतो?",
        },
        answer: 60,
        wrong: [90, 45, 120],
        checkExpr: "180/3",
        fmt: deg,
        solution: {
          en: "Three equal angles share 180°: 60° each. Equal sides force equal angles.",
          hi: "तीन बराबर कोण 180° बाँटते हैं: 60° प्रत्येक। बराबर भुजाएँ बराबर कोण जड़ती हैं।",
          mr: "तीन समान कोन 180° वाटतात: प्रत्येकी 60°. समान बाजू समान कोन ठरवतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "ΔABC ≅ ΔPQR with AB = 6. What is PQ?",
          hi: "ΔABC ≅ ΔPQR, AB = 6। PQ क्या है?",
          mr: "ΔABC ≅ ΔPQR, AB = 6. PQ काय?",
        },
        answer: 6,
        wrong: [3, 12, 9],
        solution: {
          en: "The letters map A↔P, B↔Q, so AB matches PQ: 6. Corresponding parts of congruent triangles are equal.",
          hi: "अक्षर A↔P, B↔Q जोड़ते हैं, अतः AB, PQ से मिलता है: 6। सर्वांगसम त्रिभुजों के संगत भाग बराबर।",
          mr: "अक्षरे A↔P, B↔Q जुळवतात, म्हणून AB, PQ शी: 6. एकरूप त्रिकोणांचे संगत भाग समान.",
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
          en: "Angles opposite the two equal sides of an isosceles triangle are equal. If one is 55°, the other is?",
          hi: "समद्विबाहु त्रिभुज की दो बराबर भुजाओं के सम्मुख कोण बराबर होते हैं। यदि एक 55° हो, दूसरा कितना?",
          mr: "समद्विभुज त्रिकोणाच्या दोन समान बाजूंसमोरचे कोन समान असतात. एक 55° असल्यास, दुसरा किती?",
        },
        answer: 55,
        wrong: [70, 125, 35],
        fmt: deg,
        solution: {
          en: "The two base angles are equal by the isosceles theorem: both 55°. This is a proved theorem, not just observed.",
          hi: "समद्विबाहु प्रमेय से दोनों आधार कोण बराबर: दोनों 55°। यह सिद्ध प्रमेय है, केवल देखा गया नहीं।",
          mr: "समद्विभुज प्रमेयाने दोन्ही पायाकोन समान: दोन्ही 55°. हे सिद्ध प्रमेय, नुसते पाहिलेले नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the ASA congruence rule, besides two angles you must match how many sides — and it must be the one BETWEEN them?",
          hi: "ASA सर्वांगसमता नियम में दो कोणों के अलावा कितनी भुजाएँ मिलानी होती हैं — और वह उनके बीच वाली हो?",
          mr: "ASA एकरूपता नियमात दोन कोनांशिवाय किती बाजू जुळवाव्या लागतात — आणि ती त्यांच्यामधली हवी?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        solution: {
          en: "Angle-Side-Angle: 1 side, and it must lie between the two angles. Zero sides leaves the size free.",
          hi: "कोण-भुजा-कोण: 1 भुजा, और वह दोनों कोणों के बीच हो। शून्य भुजा नाप को खुला छोड़ देती है।",
          mr: "कोन-बाजू-कोन: 1 बाजू, आणि ती दोन कोनांच्या मध्ये. शून्य बाजू माप मोकळे ठेवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two sides of a triangle are 7 and 10. The third side must be LESS than?",
          hi: "त्रिभुज की दो भुजाएँ 7 और 10 हैं। तीसरी भुजा किससे कम होनी चाहिए?",
          mr: "त्रिकोणाच्या दोन बाजू 7 आणि 10 आहेत. तिसरी बाजू कशाहून कमी हवी?",
        },
        answer: 17,
        wrong: [3, 70, 10],
        checkExpr: "7+10",
        solution: {
          en: "The third side is less than the sum of the other two: 7 + 10 = 17. It must also exceed the difference, 3 — the triangle inequality.",
          hi: "तीसरी भुजा बाक़ी दो के योग से कम: 7 + 10 = 17। वह अंतर 3 से बड़ी भी हो — त्रिभुज असमिका।",
          mr: "तिसरी बाजू बाकी दोघांच्या बेरजेहून कमी: 7 + 10 = 17. ती फरक 3 हून मोठीही हवी — त्रिकोण असमानता.",
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
          en: "In ΔABC, AB = AC and angle B = 50°. What is angle A?",
          hi: "ΔABC में AB = AC और कोण B = 50°। कोण A कितना?",
          mr: "ΔABC मध्ये AB = AC आणि कोन B = 50°. कोन A किती?",
        },
        answer: 80,
        wrong: [50, 100, 130],
        checkExpr: "180-50-50",
        fmt: deg,
        solution: {
          en: "AB = AC makes angle C = angle B = 50°, so angle A = 180 − 100 = 80°. The equal sides gift a second known angle.",
          hi: "AB = AC से कोण C = कोण B = 50°, अतः कोण A = 180 − 100 = 80°। बराबर भुजाएँ दूसरा ज्ञात कोण दे देती हैं।",
          mr: "AB = AC मुळे कोन C = कोन B = 50°, म्हणून कोन A = 180 − 100 = 80°. समान बाजू दुसरा ज्ञात कोन देतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In a right triangle, the two legs are 6 and 8. What is the hypotenuse?",
          hi: "समकोण त्रिभुज में दो भुजाएँ 6 और 8 हैं। कर्ण कितना?",
          mr: "काटकोन त्रिकोणात दोन बाजू 6 आणि 8 आहेत. कर्ण किती?",
        },
        answer: 10,
        wrong: [14, 48, 100],
        solution: {
          en: "√(6² + 8²) = √100 = 10 — the 6-8-10 triple. 14 adds the legs; 100 stops at the square.",
          hi: "√(6² + 8²) = √100 = 10 — 6-8-10 त्रिक। 14 भुजाएँ जोड़ता है; 100 वर्ग पर रुक जाता है।",
          mr: "√(6² + 8²) = √100 = 10 — 6-8-10 त्रिकूट. 14 बाजू जोडतो; 100 वर्गावर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "RHS congruence uses hypotenuse 13 and one leg 5. The other leg is?",
          hi: "RHS सर्वांगसमता में कर्ण 13 और एक भुजा 5 है। दूसरी भुजा कितनी?",
          mr: "RHS एकरूपतेत कर्ण 13 आणि एक बाजू 5. दुसरी बाजू किती?",
        },
        answer: 12,
        wrong: [8, 18, 144],
        solution: {
          en: "13² − 5² = 169 − 25 = 144 = 12². The right angle plus Pythagoras pins the third side — that is why RHS works.",
          hi: "13² − 5² = 169 − 25 = 144 = 12²। समकोण और पाइथागोरस तीसरी भुजा जड़ देते हैं — इसीलिए RHS चलता है।",
          mr: "13² − 5² = 169 − 25 = 144 = 12². काटकोन आणि पायथागोरस तिसरी बाजू ठरवतात — म्हणून RHS चालते.",
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
          en: "In ΔABC, the angles are 40° and 60°, and AB is opposite the 60°. Which side is the LONGEST — give the opposite angle in degrees.",
          hi: "ΔABC में कोण 40° और 60° हैं, और AB 60° के सम्मुख है। सबसे लंबी भुजा कौन-सी — उसका सम्मुख कोण डिग्री में बताइए।",
          mr: "ΔABC मध्ये कोन 40° आणि 60°, आणि AB 60° समोर. सर्वांत लांब बाजू कोणती — तिचा समोरचा कोन अंशांत द्या.",
        },
        answer: 80,
        wrong: [60, 40, 100],
        checkExpr: "180-40-60",
        fmt: deg,
        solution: {
          en: "The third angle is 180 − 100 = 80°, the largest — so the side opposite it is longest. The biggest angle faces the biggest side.",
          hi: "तीसरा कोण 180 − 100 = 80°, सबसे बड़ा — अतः उसके सम्मुख भुजा सबसे लंबी। सबसे बड़ा कोण सबसे बड़ी भुजा के सामने।",
          mr: "तिसरा कोन 180 − 100 = 80°, सर्वांत मोठा — म्हणून त्याच्या समोरची बाजू सर्वांत लांब. सर्वांत मोठा कोन सर्वांत मोठ्या बाजूसमोर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "An isosceles right triangle has its two equal legs at 5 cm each. The hypotenuse is 5√2. What is its SQUARE?",
          hi: "समद्विबाहु समकोण त्रिभुज की दोनों बराबर भुजाएँ 5 सेमी हैं। कर्ण 5√2 है। उसका वर्ग क्या है?",
          mr: "समद्विभुज काटकोन त्रिकोणाच्या दोन्ही समान बाजू 5 सेमी. कर्ण 5√2. त्याचा वर्ग काय?",
        },
        answer: 50,
        wrong: [25, 100, 10],
        checkExpr: "5*5+5*5",
        solution: {
          en: "Hypotenuse² = 5² + 5² = 50, so hypotenuse = √50 = 5√2. The square is the clean number the roots hide.",
          hi: "कर्ण² = 5² + 5² = 50, अतः कर्ण = √50 = 5√2। वर्ग वह साफ़ संख्या है जिसे मूल छिपाते हैं।",
          mr: "कर्ण² = 5² + 5² = 50, म्हणून कर्ण = √50 = 5√2. वर्ग ही ती नीटस संख्या जी मूळे लपवतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "In ΔABC ≅ ΔDEF, angle A = 70° and angle B = 60°. What is angle F (= angle C)?",
          hi: "ΔABC ≅ ΔDEF में कोण A = 70° और कोण B = 60°। कोण F (= कोण C) कितना?",
          mr: "ΔABC ≅ ΔDEF मध्ये कोन A = 70° आणि कोन B = 60°. कोन F (= कोन C) किती?",
        },
        answer: 50,
        wrong: [70, 60, 130],
        checkExpr: "180-70-60",
        fmt: deg,
        solution: {
          en: "F corresponds to C = 180 − 70 − 60 = 50°. Congruence copies angles, but you must compute the third one first.",
          hi: "F की संगति C से = 180 − 70 − 60 = 50°। सर्वांगसमता कोण नक़ल करती है, पर तीसरा पहले निकालना पड़ता है।",
          mr: "F ची संगती C शी = 180 − 70 − 60 = 50°. एकरूपता कोन नक्कल करते, पण तिसरा आधी काढावा लागतो.",
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
          en: "In ΔABC, AB = AC, and the perpendicular from A meets BC at D. If BC = 16, what is BD?",
          hi: "ΔABC में AB = AC, और A से लंब BC को D पर मिलता है। यदि BC = 16, तो BD क्या है?",
          mr: "ΔABC मध्ये AB = AC, आणि A पासूनचा लंब BC ला D वर मिळतो. BC = 16 असल्यास BD काय?",
        },
        answer: 8,
        wrong: [16, 4, 12],
        checkExpr: "16/2",
        solution: {
          en: "In an isosceles triangle the perpendicular from the apex bisects the base: BD = 16 ÷ 2 = 8. Proved by the congruent halves ABD and ACD.",
          hi: "समद्विबाहु त्रिभुज में शीर्ष से लंब आधार को समद्विभाजित करता है: BD = 16 ÷ 2 = 8। सर्वांगसम आधों ABD और ACD से सिद्ध।",
          mr: "समद्विभुज त्रिकोणात शिरोबिंदूपासूनचा लंब पाया दुभागतो: BD = 16 ÷ 2 = 8. एकरूप अर्ध्या ABD आणि ACD ने सिद्ध.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Two triangles have sides 3, 4, 5 and 6, 8, 10. Their angles are equal (similar), but how many pairs of EQUAL sides do they share?",
          hi: "दो त्रिभुजों की भुजाएँ 3, 4, 5 और 6, 8, 10 हैं। उनके कोण बराबर (समरूप) हैं, पर बराबर भुजाओं के कितने जोड़े साझा हैं?",
          mr: "दोन त्रिकोणांच्या बाजू 3, 4, 5 आणि 6, 8, 10 आहेत. त्यांचे कोन समान (समरूप), पण समान बाजूंच्या किती जोड्या सामाईक?",
        },
        answer: 0,
        wrong: [3, 1, 2],
        solution: {
          en: "Every side of the second is double the first — no pair is equal, so 0. Same shape, different size: similar but NOT congruent.",
          hi: "दूसरे की हर भुजा पहले की दुगुनी — कोई जोड़ी बराबर नहीं, अतः 0। आकार वही, नाप अलग: समरूप पर सर्वांगसम नहीं।",
          mr: "दुसऱ्याची प्रत्येक बाजू पहिल्याच्या दुप्पट — एकही जोडी समान नाही, म्हणून 0. आकार तोच, माप वेगळे: समरूप पण एकरूप नाही.",
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
          en: "AAA (all three angles equal) is NOT a congruence test. Two equilateral triangles have sides 4 and 7 — all angles 60°. How many of their side-pairs are equal?",
          hi: "AAA (तीनों कोण बराबर) सर्वांगसमता जाँच नहीं है। दो समबाहु त्रिभुजों की भुजाएँ 4 और 7 हैं — सारे कोण 60°। उनकी कितनी भुजा-जोड़ियाँ बराबर हैं?",
          mr: "AAA (तिन्ही कोन समान) ही एकरूपता चाचणी नाही. दोन समभुज त्रिकोणांच्या बाजू 4 आणि 7 — सारे कोन 60°. त्यांच्या किती बाजू-जोड्या समान?",
        },
        answer: 0,
        wrong: [3, 1, 2],
        solution: {
          en: "All six angles are 60°, yet every side-pair is 4 against 7: 0 equal. AAA fixes shape but not size — that is exactly why it is missing from the congruence tests.",
          hi: "छहों कोण 60°, फिर भी हर भुजा-जोड़ी 4 बनाम 7: 0 बराबर। AAA आकार तय करता है, नाप नहीं — इसीलिए वह सर्वांगसमता-जाँचों से ग़ायब है।",
          mr: "सहाही कोन 60°, तरी प्रत्येक बाजू-जोडी 4 विरुद्ध 7: 0 समान. AAA आकार ठरवते, माप नाही — म्हणूनच ते एकरूपता-चाचण्यांतून गायब.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The perpendicular from the right angle of a right triangle to the hypotenuse creates two smaller triangles, each similar to the whole. A 3-4-5 triangle's altitude to the hypotenuse is (3×4)/5. Compute it as a decimal.",
          hi: "समकोण त्रिभुज के समकोण से कर्ण पर लंब दो छोटे त्रिभुज बनाता है, हर एक पूरे के समरूप। 3-4-5 त्रिभुज की कर्ण पर ऊँचाई (3×4)/5 है। दशमलव में निकालिए।",
          mr: "काटकोन त्रिकोणाच्या काटकोनातून कर्णावर लंब दोन लहान त्रिकोण बनवतो, प्रत्येक अख्ख्याशी समरूप. 3-4-5 त्रिकोणाची कर्णावरची उंची (3×4)/5. दशांशात काढा.",
        },
        answer: 2.4,
        wrong: [3.5, 5, 1.2],
        checkExpr: "3*4/5",
        solution: {
          en: "Altitude = product of legs ÷ hypotenuse = 12 ÷ 5 = 2.4. It equals both legs' contribution because area = ½·3·4 = ½·5·h forces h = 2.4.",
          hi: "ऊँचाई = भुजाओं का गुणनफल ÷ कर्ण = 12 ÷ 5 = 2.4। क्षेत्रफल = ½·3·4 = ½·5·h से h = 2.4।",
          mr: "उंची = बाजूंचा गुणाकार ÷ कर्ण = 12 ÷ 5 = 2.4. क्षेत्रफळ = ½·3·4 = ½·5·h मुळे h = 2.4.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 7 — Triangles",
      name: "Triangles",
      slug: "maths-9-triangles",
      summary:
        "Congruence proved, not assumed: SSS/SAS/ASA/RHS pinning shape and size, the isosceles perpendicular bisecting its base — and AAA exposed as fixing shape but never size.",
      position: 7,
      translations: {
        hi: {
          name: "त्रिभुज",
          summary:
            "सर्वांगसमता सिद्ध, मानी नहीं: SSS/SAS/ASA/RHS आकार-नाप जड़ते, समद्विबाहु का लंब आधार समद्विभाजित करता — और AAA, जो आकार तय करता है नाप कभी नहीं।",
        },
        mr: {
          name: "त्रिकोण",
          summary:
            "एकरूपता सिद्ध, गृहीत नाही: SSS/SAS/ASA/RHS आकार-माप ठरवतात, समद्विभुजाचा लंब पाया दुभागतो — आणि AAA, जे आकार ठरवते माप कधीच नाही.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Heron's Formula (area from three sides)                      */
/* ------------------------------------------------------------------------- */
function heronsFormula(): TopicFileOut {
  const rand = rng("maths-9-herons-formula");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A triangle has sides 3, 4, 5. What is its semi-perimeter s = (a+b+c)/2?",
          hi: "त्रिभुज की भुजाएँ 3, 4, 5 हैं। उसका अर्ध-परिमाप s = (a+b+c)/2 क्या है?",
          mr: "त्रिकोणाच्या बाजू 3, 4, 5 आहेत. त्याची अर्ध-परिमिती s = (a+b+c)/2 काय?",
        },
        answer: 6,
        wrong: [12, 3, 60],
        checkExpr: "(3+4+5)/2",
        solution: {
          en: "s = (3 + 4 + 5)/2 = 12/2 = 6. The semi-perimeter is half the way round — Heron's starting point.",
          hi: "s = (3 + 4 + 5)/2 = 12/2 = 6। अर्ध-परिमाप आधी परिक्रमा है — हेरॉन का आरंभ-बिंदु।",
          mr: "s = (3 + 4 + 5)/2 = 12/2 = 6. अर्ध-परिमिती म्हणजे अर्धी फेरी — हेरॉनचा आरंभबिंदू.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A right triangle has legs 6 and 8. What is its area?",
          hi: "समकोण त्रिभुज की भुजाएँ 6 और 8 हैं। क्षेत्रफल कितना?",
          mr: "काटकोन त्रिकोणाच्या बाजू 6 आणि 8. क्षेत्रफळ किती?",
        },
        answer: 24,
        wrong: [48, 14, 10],
        checkExpr: "6*8/2",
        solution: {
          en: "For a right triangle, area = ½ × legs = ½ × 6 × 8 = 24. No Heron needed when the right angle is handed to you.",
          hi: "समकोण त्रिभुज में क्षेत्रफल = ½ × भुजाएँ = ½ × 6 × 8 = 24। समकोण मिले तो हेरॉन की ज़रूरत नहीं।",
          mr: "काटकोन त्रिकोणात क्षेत्रफळ = ½ × बाजू = ½ × 6 × 8 = 24. काटकोन मिळाला तर हेरॉनची गरज नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For an equilateral triangle of side 6, the semi-perimeter is?",
          hi: "6 भुजा वाले समबाहु त्रिभुज का अर्ध-परिमाप कितना?",
          mr: "6 बाजूच्या समभुज त्रिकोणाची अर्ध-परिमिती किती?",
        },
        answer: 9,
        wrong: [18, 6, 3],
        checkExpr: "6*3/2",
        solution: {
          en: "Perimeter 18, so s = 18/2 = 9. All three sides equal simplifies the sum to 3 × side.",
          hi: "परिमाप 18, अतः s = 18/2 = 9। तीनों भुजाएँ बराबर होने से योग 3 × भुजा।",
          mr: "परिमिती 18, म्हणून s = 18/2 = 9. तिन्ही बाजू समान असल्याने बेरीज 3 × बाजू.",
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
          en: "For sides 3, 4, 5, s = 6. Heron's area is √(s(s−a)(s−b)(s−c)) = √(6·3·2·1). What is that area?",
          hi: "भुजाओं 3, 4, 5 के लिए s = 6। हेरॉन क्षेत्रफल √(s(s−a)(s−b)(s−c)) = √(6·3·2·1)। वह क्षेत्रफल क्या है?",
          mr: "बाजू 3, 4, 5 साठी s = 6. हेरॉन क्षेत्रफळ √(s(s−a)(s−b)(s−c)) = √(6·3·2·1). ते क्षेत्रफळ काय?",
        },
        answer: 6,
        wrong: [36, 12, 8],
        checkExpr: "3*4/2",
        solution: {
          en: "√(6·3·2·1) = √36 = 6 — matching ½·3·4 = 6, since 3-4-5 is right-angled. Heron agrees with the simple formula.",
          hi: "√(6·3·2·1) = √36 = 6 — ½·3·4 = 6 से मेल, क्योंकि 3-4-5 समकोण है। हेरॉन सरल सूत्र से सहमत।",
          mr: "√(6·3·2·1) = √36 = 6 — ½·3·4 = 6 शी जुळते, कारण 3-4-5 काटकोन. हेरॉन साध्या सूत्राशी सहमत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A triangle has sides 13, 14, 15. What is its semi-perimeter?",
          hi: "त्रिभुज की भुजाएँ 13, 14, 15 हैं। अर्ध-परिमाप कितना?",
          mr: "त्रिकोणाच्या बाजू 13, 14, 15. अर्ध-परिमिती किती?",
        },
        answer: 21,
        wrong: [42, 20, 22],
        checkExpr: "(13+14+15)/2",
        solution: {
          en: "s = (13 + 14 + 15)/2 = 42/2 = 21. This famous triangle has a whole-number area of 84.",
          hi: "s = (13 + 14 + 15)/2 = 42/2 = 21। इस मशहूर त्रिभुज का क्षेत्रफल पूर्ण संख्या 84 है।",
          mr: "s = (13 + 14 + 15)/2 = 42/2 = 21. या प्रसिद्ध त्रिकोणाचे क्षेत्रफळ पूर्ण संख्या 84.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "An isosceles triangle has equal sides 5, 5 and base 6. What is its semi-perimeter?",
          hi: "समद्विबाहु त्रिभुज की बराबर भुजाएँ 5, 5 और आधार 6 है। अर्ध-परिमाप कितना?",
          mr: "समद्विभुज त्रिकोणाच्या समान बाजू 5, 5 आणि पाया 6. अर्ध-परिमिती किती?",
        },
        answer: 8,
        wrong: [16, 6, 4],
        checkExpr: "(5+5+6)/2",
        solution: {
          en: "s = (5 + 5 + 6)/2 = 16/2 = 8. Its area by Heron is √(8·3·3·2) = 12.",
          hi: "s = (5 + 5 + 6)/2 = 16/2 = 8। हेरॉन से क्षेत्रफल √(8·3·3·2) = 12।",
          mr: "s = (5 + 5 + 6)/2 = 16/2 = 8. हेरॉनने क्षेत्रफळ √(8·3·3·2) = 12.",
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
          en: "For the 13-14-15 triangle, s = 21. Heron gives √(21·8·7·6) = √7056. What is the area?",
          hi: "13-14-15 त्रिभुज के लिए s = 21। हेरॉन देता है √(21·8·7·6) = √7056। क्षेत्रफल क्या है?",
          mr: "13-14-15 त्रिकोणासाठी s = 21. हेरॉन देते √(21·8·7·6) = √7056. क्षेत्रफळ काय?",
        },
        answer: 84,
        wrong: [7056, 42, 168],
        solution: {
          en: "√7056 = 84. Heron delivers a whole-number area from three whole-number sides — a small miracle of the formula.",
          hi: "√7056 = 84। हेरॉन तीन पूर्ण-संख्या भुजाओं से पूर्ण-संख्या क्षेत्रफल देता है — सूत्र का छोटा-सा चमत्कार।",
          mr: "√7056 = 84. हेरॉन तीन पूर्ण-संख्या बाजूंतून पूर्ण-संख्या क्षेत्रफळ देते — सूत्राचा छोटा चमत्कार.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The isosceles triangle 5, 5, 6 has area √(8·3·3·2). What is that area?",
          hi: "समद्विबाहु त्रिभुज 5, 5, 6 का क्षेत्रफल √(8·3·3·2) है। वह क्या है?",
          mr: "समद्विभुज त्रिकोण 5, 5, 6 चे क्षेत्रफळ √(8·3·3·2) आहे. ते काय?",
        },
        answer: 12,
        wrong: [144, 24, 15],
        checkExpr: "6*4/2",
        solution: {
          en: "√(8·3·3·2) = √144 = 12 — and indeed the height to the base of 6 is 4, giving ½·6·4 = 12. Both roads agree.",
          hi: "√(8·3·3·2) = √144 = 12 — और 6 आधार पर ऊँचाई 4 है, ½·6·4 = 12। दोनों राहें मिलती हैं।",
          mr: "√(8·3·3·2) = √144 = 12 — आणि 6 पायावर उंची 4, ½·6·4 = 12. दोन्ही वाटा जुळतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "An equilateral triangle of side 4 has area (√3/4)·4². What is the coefficient — that is, 4²/4?",
          hi: "4 भुजा वाले समबाहु त्रिभुज का क्षेत्रफल (√3/4)·4² है। गुणांक क्या है — यानी 4²/4?",
          mr: "4 बाजूच्या समभुज त्रिकोणाचे क्षेत्रफळ (√3/4)·4² आहे. सहगुणक काय — म्हणजे 4²/4?",
        },
        answer: 4,
        wrong: [16, 8, 12],
        checkExpr: "16/4",
        solution: {
          en: "Area = (√3/4)·16 = 4√3, coefficient 4. The equilateral shortcut skips Heron: (√3/4)·side².",
          hi: "क्षेत्रफल = (√3/4)·16 = 4√3, गुणांक 4। समबाहु शॉर्टकट हेरॉन लाँघता है: (√3/4)·भुजा²।",
          mr: "क्षेत्रफळ = (√3/4)·16 = 4√3, सहगुणक 4. समभुज शॉर्टकट हेरॉन ओलांडतो: (√3/4)·बाजू².",
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
          en: "A triangular park has sides 40 m, 24 m and 32 m. Is it right-angled? Compute 24² + 32² and compare with 40².",
          hi: "एक त्रिभुजाकार पार्क की भुजाएँ 40 मी, 24 मी और 32 मी हैं। क्या यह समकोण है? 24² + 32² निकालकर 40² से तुलना कीजिए।",
          mr: "त्रिकोणी उद्यानाच्या बाजू 40 मी, 24 मी आणि 32 मी. ते काटकोन आहे का? 24² + 32² काढून 40² शी तुलना करा.",
        },
        answer: 1600,
        wrong: [1024, 576, 3200],
        checkExpr: "24*24+32*32",
        solution: {
          en: "24² + 32² = 576 + 1024 = 1600 = 40². Yes — it is right-angled, so area = ½·24·32 = 384 m², no Heron required.",
          hi: "24² + 32² = 576 + 1024 = 1600 = 40²। हाँ — यह समकोण है, अतः क्षेत्रफल = ½·24·32 = 384 वर्ग मीटर, हेरॉन की ज़रूरत नहीं।",
          mr: "24² + 32² = 576 + 1024 = 1600 = 40². हो — ते काटकोन, म्हणून क्षेत्रफळ = ½·24·32 = 384 चौ. मीटर, हेरॉनची गरज नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A triangle has sides 6, 8, 10. Compute Heron's area √(12·6·4·2).",
          hi: "त्रिभुज की भुजाएँ 6, 8, 10 हैं। हेरॉन क्षेत्रफल √(12·6·4·2) निकालिए।",
          mr: "त्रिकोणाच्या बाजू 6, 8, 10. हेरॉन क्षेत्रफळ √(12·6·4·2) काढा.",
        },
        answer: 24,
        wrong: [48, 576, 20],
        checkExpr: "6*8/2",
        solution: {
          en: "s = 12, √(12·6·4·2) = √576 = 24 — matching ½·6·8 since 6-8-10 is right. Heron and the leg-formula shake hands.",
          hi: "s = 12, √(12·6·4·2) = √576 = 24 — ½·6·8 से मेल, क्योंकि 6-8-10 समकोण है। हेरॉन और भुजा-सूत्र हाथ मिलाते हैं।",
          mr: "s = 12, √(12·6·4·2) = √576 = 24 — ½·6·8 शी जुळते, कारण 6-8-10 काटकोन. हेरॉन आणि बाजू-सूत्र हस्तांदोलन करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A quadrilateral field is split by a diagonal into two triangles of areas 30 and 42 m². What is the field's area?",
          hi: "एक चतुर्भुज खेत एक विकर्ण से 30 और 42 वर्ग मीटर के दो त्रिभुजों में बँटा है। खेत का क्षेत्रफल कितना?",
          mr: "एक चौकोन शेत एका कर्णाने 30 आणि 42 चौ. मीटरच्या दोन त्रिकोणांत विभागले. शेताचे क्षेत्रफळ किती?",
        },
        answer: 72,
        wrong: [12, 1260, 36],
        checkExpr: "30+42",
        solution: {
          en: "A diagonal splits a quadrilateral into two triangles; add their areas: 30 + 42 = 72 m². Heron is applied to each half, then summed.",
          hi: "विकर्ण चतुर्भुज को दो त्रिभुजों में बाँटता है; क्षेत्रफल जोड़िए: 30 + 42 = 72 वर्ग मीटर। हेरॉन हर आधे पर लगाकर जोड़ा जाता है।",
          mr: "कर्ण चौकोनाला दोन त्रिकोणांत विभागतो; क्षेत्रफळे जोडा: 30 + 42 = 72 चौ. मीटर. हेरॉन प्रत्येक अर्ध्यावर लावून बेरीज.",
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
          en: "A triangle with sides 9, 12, 15: is it right-angled? Compute 9² + 12².",
          hi: "9, 12, 15 भुजाओं वाला त्रिभुज: क्या समकोण है? 9² + 12² निकालिए।",
          mr: "9, 12, 15 बाजूंचा त्रिकोण: काटकोन आहे का? 9² + 12² काढा.",
        },
        answer: 225,
        wrong: [441, 81, 144],
        checkExpr: "9*9+12*12",
        solution: {
          en: "9² + 12² = 81 + 144 = 225 = 15². Right-angled — area = ½·9·12 = 54 m². The 3-4-5 triple, tripled.",
          hi: "9² + 12² = 81 + 144 = 225 = 15²। समकोण — क्षेत्रफल = ½·9·12 = 54 वर्ग मीटर। 3-4-5 त्रिक, तिगुना।",
          mr: "9² + 12² = 81 + 144 = 225 = 15². काटकोन — क्षेत्रफळ = ½·9·12 = 54 चौ. मीटर. 3-4-5 त्रिकूट, तिप्पट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A signboard is an equilateral triangle of side 10 cm. Its area is 25√3. What is 25√3 rounded to the nearest whole number? (√3 ≈ 1.73)",
          hi: "एक साइनबोर्ड 10 सेमी भुजा का समबाहु त्रिभुज है। उसका क्षेत्रफल 25√3 है। 25√3 को निकटतम पूर्ण संख्या में गोल कीजिए। (√3 ≈ 1.73)",
          mr: "एक साइनबोर्ड 10 सेमी बाजूचा समभुज त्रिकोण आहे. त्याचे क्षेत्रफळ 25√3. 25√3 जवळच्या पूर्ण संख्येत गोल करा. (√3 ≈ 1.73)",
        },
        answer: 43,
        wrong: [25, 50, 75],
        solution: {
          en: "25 × 1.73 = 43.25 ≈ 43 cm². Area = (√3/4)·10² = 25√3 — the equilateral formula, then a numeric estimate.",
          hi: "25 × 1.73 = 43.25 ≈ 43 वर्ग सेमी। क्षेत्रफल = (√3/4)·10² = 25√3 — समबाहु सूत्र, फिर संख्यात्मक अनुमान।",
          mr: "25 × 1.73 = 43.25 ≈ 43 चौ. सेमी. क्षेत्रफळ = (√3/4)·10² = 25√3 — समभुज सूत्र, मग संख्यात्मक अंदाज.",
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
          en: "Among all triangles with perimeter 12, the equilateral (sides 4,4,4) has the largest area. Its s is 6; area √(6·2·2·2) = √48. What whole number does √48 round to? (√48 ≈ 6.93)",
          hi: "परिमाप 12 वाले सभी त्रिभुजों में समबाहु (भुजाएँ 4,4,4) का क्षेत्रफल सबसे बड़ा है। उसका s = 6; क्षेत्रफल √(6·2·2·2) = √48। √48 किस पूर्ण संख्या के पास है? (√48 ≈ 6.93)",
          mr: "परिमिती 12 च्या सर्व त्रिकोणांत समभुज (बाजू 4,4,4) चे क्षेत्रफळ सर्वांत मोठे. त्याचा s = 6; क्षेत्रफळ √(6·2·2·2) = √48. √48 कोणत्या पूर्ण संख्येजवळ? (√48 ≈ 6.93)",
        },
        answer: 7,
        wrong: [48, 6, 12],
        solution: {
          en: "√48 ≈ 6.93 ≈ 7 sq units. Of every triangle sharing a perimeter, the equilateral encloses the most area — symmetry pays.",
          hi: "√48 ≈ 6.93 ≈ 7 वर्ग इकाई। समान परिमाप वाले हर त्रिभुज में समबाहु सबसे ज़्यादा क्षेत्रफल घेरता है — समरूपता का लाभ।",
          mr: "√48 ≈ 6.93 ≈ 7 चौरस एकके. समान परिमिती असलेल्या प्रत्येक त्रिकोणात समभुज सर्वाधिक क्षेत्रफळ वेढतो — सममितीचा फायदा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Heron's formula fails (gives an imaginary root) if the sides cannot form a triangle. For sides 2, 3, 6: s = 5.5, and (s−c) = 5.5 − 6 is negative. What is 5.5 − 6?",
          hi: "यदि भुजाएँ त्रिभुज न बना सकें तो हेरॉन सूत्र विफल हो जाता है (काल्पनिक मूल देता है)। भुजाओं 2, 3, 6 के लिए: s = 5.5, और (s−c) = 5.5 − 6 ऋण है। 5.5 − 6 क्या है?",
          mr: "बाजू त्रिकोण बनवू शकत नसतील तर हेरॉन सूत्र फसते (काल्पनिक मूळ देते). बाजू 2, 3, 6 साठी: s = 5.5, आणि (s−c) = 5.5 − 6 ऋण. 5.5 − 6 काय?",
        },
        answer: -0.5,
        wrong: [0.5, 11.5, -1],
        checkExpr: "5.5-6",
        solution: {
          en: "5.5 − 6 = −0.5, a negative factor — so the product under the root is negative and the 'area' is imaginary. Heron itself flags an impossible triangle: 2 + 3 < 6, the inequality is broken.",
          hi: "5.5 − 6 = −0.5, एक ऋण गुणनखंड — अतः मूल के नीचे गुणनफल ऋण और 'क्षेत्रफल' काल्पनिक। हेरॉन स्वयं असंभव त्रिभुज बता देता है: 2 + 3 < 6, असमिका टूटी।",
          mr: "5.5 − 6 = −0.5, एक ऋण घटक — म्हणून मूळाखालचा गुणाकार ऋण आणि 'क्षेत्रफळ' काल्पनिक. हेरॉन स्वतः अशक्य त्रिकोण दाखवते: 2 + 3 < 6, असमानता तुटली.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 10 — Heron's Formula",
      name: "Heron's Formula",
      slug: "maths-9-herons-formula",
      summary:
        "Area from three sides alone: the semi-perimeter feeding a square root, 13-14-15 yielding a whole number 84 — and Heron flagging an impossible triangle with a negative under the root.",
      position: 10,
      translations: {
        hi: {
          name: "हेरॉन का सूत्र",
          summary:
            "केवल तीन भुजाओं से क्षेत्रफल: अर्ध-परिमाप वर्गमूल को खिलाता, 13-14-15 पूर्ण संख्या 84 देता — और हेरॉन मूल के नीचे ऋण से असंभव त्रिभुज बता देता।",
        },
        mr: {
          name: "हेरॉनचे सूत्र",
          summary:
            "फक्त तीन बाजूंतून क्षेत्रफळ: अर्ध-परिमिती वर्गमूळाला पुरवते, 13-14-15 पूर्ण संख्या 84 देते — आणि हेरॉन मूळाखालच्या ऋणाने अशक्य त्रिकोण दाखवते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Surface Areas and Volumes (round solids)                    */
/* ------------------------------------------------------------------------- */
function surfaceVolumes9(): TopicFileOut {
  const rand = rng("maths-9-surface-areas-volumes");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A sphere has radius 3 cm. Its volume is (4/3)πr³. Using π = 22/7, what is (4/3)·(22/7)·27? Give the whole-number approximation.",
          hi: "एक गोले की त्रिज्या 3 सेमी है। आयतन (4/3)πr³। π = 22/7 से (4/3)·(22/7)·27 क्या है? पूर्ण-संख्या अनुमान दीजिए।",
          mr: "एका गोलाची त्रिज्या 3 सेमी. घनफळ (4/3)πr³. π = 22/7 ने (4/3)·(22/7)·27 काय? पूर्ण-संख्या अंदाज द्या.",
        },
        answer: 113,
        wrong: [36, 88, 108],
        solution: {
          en: "(4/3)·(22/7)·27 = (4·22·27)/(3·7) = 2376/21 ≈ 113 cm³. The cube of the radius drives the volume upward fast.",
          hi: "(4/3)·(22/7)·27 = (4·22·27)/(3·7) = 2376/21 ≈ 113 घन सेमी। त्रिज्या का घन आयतन को तेज़ी से ऊपर ले जाता है।",
          mr: "(4/3)·(22/7)·27 = (4·22·27)/(3·7) = 2376/21 ≈ 113 घन सेमी. त्रिज्येचा घन घनफळ वेगाने वर नेतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The curved surface area of a cylinder is 2πrh. For r = 7, h = 10, π = 22/7, compute it.",
          hi: "बेलन का वक्र पृष्ठीय क्षेत्रफल 2πrh है। r = 7, h = 10, π = 22/7 के लिए निकालिए।",
          mr: "दंडगोलाचे वक्र पृष्ठफळ 2πrh. r = 7, h = 10, π = 22/7 साठी काढा.",
        },
        answer: 440,
        wrong: [1540, 220, 154],
        checkExpr: "2*22*10",
        solution: {
          en: "2·(22/7)·7·10 = 2·22·10 = 440 cm² — the 7 cancels the 7. 1540 is the volume by mistake.",
          hi: "2·(22/7)·7·10 = 2·22·10 = 440 वर्ग सेमी — 7, 7 को काट देता है। 1540 ग़लती से आयतन है।",
          mr: "2·(22/7)·7·10 = 2·22·10 = 440 चौ. सेमी — 7, 7 ला रद्द करतो. 1540 चुकून घनफळ.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A cone has base radius 3 and height 4. Its slant height is √(3² + 4²). What is it?",
          hi: "एक शंकु का आधार-त्रिज्या 3 और ऊँचाई 4 है। उसकी तिर्यक ऊँचाई √(3² + 4²) है। वह क्या है?",
          mr: "एका शंकूची पाया-त्रिज्या 3 आणि उंची 4. त्याची तिरकस उंची √(3² + 4²). ती काय?",
        },
        answer: 5,
        wrong: [7, 25, 12],
        solution: {
          en: "Slant height l = √(9 + 16) = √25 = 5 — radius, height and slant form a right triangle. 7 adds instead of using squares.",
          hi: "तिर्यक ऊँचाई l = √(9 + 16) = √25 = 5 — त्रिज्या, ऊँचाई और तिर्यक समकोण त्रिभुज बनाते हैं। 7 वर्ग की जगह जोड़ता है।",
          mr: "तिरकस उंची l = √(9 + 16) = √25 = 5 — त्रिज्या, उंची आणि तिरकस काटकोन त्रिकोण बनवतात. 7 वर्गाऐवजी जोडतो.",
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
          en: "The volume of a cylinder is πr²h. For r = 7, h = 5, π = 22/7, compute it.",
          hi: "बेलन का आयतन πr²h है। r = 7, h = 5, π = 22/7 के लिए निकालिए।",
          mr: "दंडगोलाचे घनफळ πr²h. r = 7, h = 5, π = 22/7 साठी काढा.",
        },
        answer: 770,
        wrong: [220, 154, 385],
        checkExpr: "22*7*5",
        solution: {
          en: "(22/7)·49·5 = 22·7·5 = 770 cm³ — one 7 cancels, the other stays. 220 forgets to square the radius fully.",
          hi: "(22/7)·49·5 = 22·7·5 = 770 घन सेमी — एक 7 कटता है, दूसरा बचता है। 220 त्रिज्या का पूरा वर्ग करना भूल जाता है।",
          mr: "(22/7)·49·5 = 22·7·5 = 770 घन सेमी — एक 7 रद्द, दुसरा उरतो. 220 त्रिज्येचा पूर्ण वर्ग करायला विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The total surface area of a sphere is 4πr². For r = 7, π = 22/7, compute it.",
          hi: "गोले का कुल पृष्ठीय क्षेत्रफल 4πr² है। r = 7, π = 22/7 के लिए निकालिए।",
          mr: "गोलाचे एकूण पृष्ठफळ 4πr². r = 7, π = 22/7 साठी काढा.",
        },
        answer: 616,
        wrong: [154, 1232, 308],
        checkExpr: "4*22*7",
        solution: {
          en: "4·(22/7)·49 = 4·22·7 = 616 cm². A sphere's surface is exactly four times the area of its own great circle.",
          hi: "4·(22/7)·49 = 4·22·7 = 616 वर्ग सेमी। गोले का पृष्ठ उसके अपने बड़े वृत्त के क्षेत्रफल का ठीक चार गुना है।",
          mr: "4·(22/7)·49 = 4·22·7 = 616 चौ. सेमी. गोलाचे पृष्ठ त्याच्या स्वतःच्या मोठ्या वर्तुळाच्या क्षेत्रफळाच्या नेमके चौपट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The volume of a cone is (1/3)πr²h. It is what fraction of the cylinder with the same base and height?",
          hi: "शंकु का आयतन (1/3)πr²h है। वह समान आधार और ऊँचाई वाले बेलन का कौन-सा भाग है?",
          mr: "शंकूचे घनफळ (1/3)πr²h. ते समान पाया आणि उंचीच्या दंडगोलाचा कोणता भाग?",
        },
        answer: 3,
        wrong: [2, 6, 1],
        solution: {
          en: "A cone is one-third of its enclosing cylinder — so the denominator is 3. Three cones fill one cylinder exactly.",
          hi: "शंकु अपने घेरने वाले बेलन का एक-तिहाई है — अतः हर 3। तीन शंकु एक बेलन को ठीक भर देते हैं।",
          mr: "शंकू आपल्या वेढणाऱ्या दंडगोलाचा एक-तृतीयांश — म्हणून छेद 3. तीन शंकू एक दंडगोल नेमके भरतात.",
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
          en: "A hemispherical bowl has radius 7. Its curved surface area is 2πr². Compute it (π = 22/7).",
          hi: "अर्धगोलाकार कटोरे की त्रिज्या 7 है। वक्र पृष्ठीय क्षेत्रफल 2πr²। निकालिए (π = 22/7)।",
          mr: "अर्धगोलाकार वाडग्याची त्रिज्या 7. वक्र पृष्ठफळ 2πr². काढा (π = 22/7).",
        },
        answer: 308,
        wrong: [616, 154, 462],
        checkExpr: "2*22*7",
        solution: {
          en: "2·(22/7)·49 = 2·22·7 = 308 cm² — half a full sphere's 4πr². The bowl is literally half the ball's skin.",
          hi: "2·(22/7)·49 = 2·22·7 = 308 वर्ग सेमी — पूरे गोले के 4πr² का आधा। कटोरा सचमुच गेंद की खाल का आधा है।",
          mr: "2·(22/7)·49 = 2·22·7 = 308 चौ. सेमी — पूर्ण गोलाच्या 4πr² चा अर्धा. वाडगा खरोखर चेंडूच्या सालीचा अर्धा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A cube of side 6 cm is melted and recast; its volume stays 216 cm³. What is 6³?",
          hi: "6 सेमी भुजा का घन पिघलाकर फिर ढाला जाता है; उसका आयतन 216 घन सेमी रहता है। 6³ क्या है?",
          mr: "6 सेमी बाजूचा घन वितळवून पुन्हा घडवला; त्याचे घनफळ 216 घन सेमी राहते. 6³ काय?",
        },
        answer: 216,
        wrong: [36, 18, 1296],
        checkExpr: "6*6*6",
        solution: {
          en: "6³ = 216 cm³ — and melting changes shape, never volume, so the recast solid holds the same 216. Matter is conserved.",
          hi: "6³ = 216 घन सेमी — और पिघलाना आकार बदलता है, आयतन नहीं, अतः ढला हुआ ठोस वही 216 रखता है। पदार्थ संरक्षित है।",
          mr: "6³ = 216 घन सेमी — आणि वितळवणे आकार बदलते, घनफळ नाही, म्हणून घडवलेला घन तेच 216 ठेवतो. पदार्थ अक्षय.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A cone has radius 3, slant height 5. Its curved surface area is πrl. Compute with π = 22/7 and round to a whole number.",
          hi: "एक शंकु की त्रिज्या 3, तिर्यक ऊँचाई 5 है। वक्र पृष्ठीय क्षेत्रफल πrl। π = 22/7 से निकालकर पूर्ण संख्या में गोल कीजिए।",
          mr: "एका शंकूची त्रिज्या 3, तिरकस उंची 5. वक्र पृष्ठफळ πrl. π = 22/7 ने काढून पूर्ण संख्येत गोल करा.",
        },
        answer: 47,
        wrong: [94, 33, 15],
        solution: {
          en: "πrl = (22/7)·3·5 = 330/7 ≈ 47 cm². The curved surface uses the slant height, never the vertical one.",
          hi: "πrl = (22/7)·3·5 = 330/7 ≈ 47 वर्ग सेमी। वक्र पृष्ठ तिर्यक ऊँचाई लेता है, खड़ी वाली नहीं।",
          mr: "πrl = (22/7)·3·5 = 330/7 ≈ 47 चौ. सेमी. वक्र पृष्ठ तिरकस उंची घेतो, उभी नाही.",
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
          en: "A cylinder of radius 7 and height 3 is melted into a sphere. The volumes match: πr²h = π·49·3 = 147π. What is 49 × 3?",
          hi: "7 त्रिज्या और 3 ऊँचाई का बेलन गोले में पिघलाया जाता है। आयतन बराबर: πr²h = π·49·3 = 147π। 49 × 3 क्या है?",
          mr: "7 त्रिज्या आणि 3 उंचीचा दंडगोल गोलात वितळवला. घनफळ समान: πr²h = π·49·3 = 147π. 49 × 3 काय?",
        },
        answer: 147,
        wrong: [21, 441, 52],
        checkExpr: "49*3",
        solution: {
          en: "49 × 3 = 147, so the volume is 147π — conserved when melted. Recasting keeps volume; only surface area changes.",
          hi: "49 × 3 = 147, अतः आयतन 147π — पिघलाने पर संरक्षित। फिर से ढालना आयतन रखता है; केवल पृष्ठ बदलता है।",
          mr: "49 × 3 = 147, म्हणून घनफळ 147π — वितळवल्यावर अक्षय. पुन्हा घडवणे घनफळ ठेवते; फक्त पृष्ठ बदलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many lead shots of radius 1 can be made from a sphere of radius 3? (Volume ratio = 3³.)",
          hi: "3 त्रिज्या के गोले से 1 त्रिज्या की कितनी छर्रियाँ बनाई जा सकती हैं? (आयतन अनुपात = 3³।)",
          mr: "3 त्रिज्येच्या गोलातून 1 त्रिज्येच्या किती गोळ्या बनवता येतील? (घनफळ गुणोत्तर = 3³.)",
        },
        answer: 27,
        wrong: [3, 9, 81],
        checkExpr: "3*3*3",
        solution: {
          en: "Volume scales with the cube of radius: (3/1)³ = 27 shots. Radius tripled means volume × 27 — the cube law again.",
          hi: "आयतन त्रिज्या के घन से बढ़ता है: (3/1)³ = 27 छर्रियाँ। त्रिज्या तिगुनी यानी आयतन × 27 — फिर वही घन नियम।",
          mr: "घनफळ त्रिज्येच्या घनाने वाढते: (3/1)³ = 27 गोळ्या. त्रिज्या तिप्पट म्हणजे घनफळ × 27 — पुन्हा तोच घन नियम.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A cylindrical tank of radius 7 m and height 10 m holds how many kilolitres? (Volume in m³ = πr²h with π = 22/7; 1 m³ = 1 kL.)",
          hi: "7 मी त्रिज्या और 10 मी ऊँचाई की बेलनाकार टंकी कितने किलोलीटर रखती है? (आयतन घन मीटर में = πr²h, π = 22/7; 1 घन मीटर = 1 किलोलीटर।)",
          mr: "7 मी त्रिज्या आणि 10 मी उंचीची दंडगोल टाकी किती किलोलिटर धरते? (घनफळ घन मीटरमध्ये = πr²h, π = 22/7; 1 घन मीटर = 1 किलोलिटर.)",
        },
        answer: 1540,
        wrong: [154, 440, 15400],
        checkExpr: "22*7*10",
        solution: {
          en: "V = (22/7)·49·10 = 22·7·10 = 1540 m³ = 1540 kL. The tank's cubic metres are its kilolitres, one for one.",
          hi: "आयतन = (22/7)·49·10 = 22·7·10 = 1540 घन मीटर = 1540 किलोलीटर। टंकी के घन मीटर ही उसके किलोलीटर हैं, एक-के-बदले-एक।",
          mr: "घनफळ = (22/7)·49·10 = 22·7·10 = 1540 घन मीटर = 1540 किलोलिटर. टाकीचे घन मीटर हेच किलोलिटर, एकास-एक.",
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
          en: "A solid is a cylinder (r=7, h=10) topped by a hemisphere (r=7). What is the total HEIGHT of the solid?",
          hi: "एक ठोस बेलन (r=7, h=10) के ऊपर अर्धगोला (r=7) है। ठोस की कुल ऊँचाई कितनी?",
          mr: "एक घन दंडगोल (r=7, h=10) वर अर्धगोल (r=7). घनाची एकूण उंची किती?",
        },
        answer: 17,
        wrong: [24, 10, 14],
        checkExpr: "10+7",
        solution: {
          en: "The hemisphere adds its radius as height: 10 + 7 = 17. A hemisphere is r tall, not 2r — it is only half a ball.",
          hi: "अर्धगोला अपनी त्रिज्या ऊँचाई में जोड़ता है: 10 + 7 = 17। अर्धगोला r ऊँचा है, 2r नहीं — वह गेंद का आधा है।",
          mr: "अर्धगोल आपली त्रिज्या उंचीत जोडतो: 10 + 7 = 17. अर्धगोल r उंच, 2r नाही — तो चेंडूचा अर्धा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "If a sphere's radius doubles, its VOLUME grows by what factor?",
          hi: "यदि गोले की त्रिज्या दुगुनी हो, आयतन कितने गुना बढ़ता है?",
          mr: "गोलाची त्रिज्या दुप्पट झाल्यास घनफळ किती पट वाढते?",
        },
        answer: 8,
        wrong: [2, 4, 6],
        checkExpr: "2*2*2",
        solution: {
          en: "Volume rides on r³: doubling r gives 2³ = 8 times. 4 is the surface-area factor (r²) — each measure scales by its own power.",
          hi: "आयतन r³ पर सवार: r दुगुनी से 2³ = 8 गुना। 4 पृष्ठ का गुणक (r²) — हर माप अपनी घात से बढ़ता है।",
          mr: "घनफळ r³ वर स्वार: r दुप्पट म्हणजे 2³ = 8 पट. 4 हा पृष्ठाचा गुणक (r²) — प्रत्येक माप आपल्या घाताने वाढते.",
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
          en: "A sphere and a cylinder have the same radius r and the cylinder's height is 2r (it just contains the sphere). The sphere's volume is (4/3)πr³, the cylinder's 2πr³. The sphere is what fraction of the cylinder — give the denominator when the fraction is 2/▢.",
          hi: "एक गोले और बेलन की त्रिज्या समान r है और बेलन की ऊँचाई 2r है (वह ठीक गोले को समाता है)। गोले का आयतन (4/3)πr³, बेलन का 2πr³। गोला बेलन का कौन-सा भाग है — भिन्न 2/▢ में हर बताइए।",
          mr: "एका गोलाची आणि दंडगोलाची त्रिज्या समान r आणि दंडगोलाची उंची 2r (तो नेमका गोल सामावतो). गोलाचे घनफळ (4/3)πr³, दंडगोलाचे 2πr³. गोल दंडगोलाचा कोणता भाग — अपूर्णांक 2/▢ मध्ये छेद द्या.",
        },
        answer: 3,
        wrong: [2, 4, 6],
        solution: {
          en: "(4/3)πr³ ÷ 2πr³ = 4/6 = 2/3, so the box holds 3. Archimedes' famous result: the sphere is exactly two-thirds of its circumscribing cylinder — he had it carved on his tomb.",
          hi: "(4/3)πr³ ÷ 2πr³ = 4/6 = 2/3, अतः रिक्त में 3। आर्किमिडीज़ का मशहूर परिणाम: गोला अपने परिगत बेलन का ठीक दो-तिहाई है — उन्होंने इसे अपनी क़ब्र पर खुदवाया।",
          mr: "(4/3)πr³ ÷ 2πr³ = 4/6 = 2/3, म्हणून रिकाम्यात 3. आर्किमिडीजचा प्रसिद्ध निकाल: गोल आपल्या परिवेष्टित दंडगोलाचा नेमका दोन-तृतीयांश — त्याने तो आपल्या थडग्यावर कोरवला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Painting a hollow hemispherical dome of radius 7 m costs ₹5 per m². Its curved surface is 2πr² = 308 m². What is the cost?",
          hi: "7 मी त्रिज्या के खोखले अर्धगोलाकार गुंबद को रँगने का ख़र्च ₹5 प्रति वर्ग मीटर है। उसका वक्र पृष्ठ 2πr² = 308 वर्ग मीटर। ख़र्च कितना?",
          mr: "7 मी त्रिज्येच्या पोकळ अर्धगोलाकार घुमटाला रंगवण्याचा खर्च ₹5 प्रति चौ. मीटर. त्याचे वक्र पृष्ठ 2πr² = 308 चौ. मीटर. खर्च किती?",
        },
        answer: 1540,
        wrong: [308, 616, 770],
        checkExpr: "308*5",
        solution: {
          en: "308 × 5 = ₹1540 — surface area first, cost second. Geometry ends where the estimate begins.",
          hi: "308 × 5 = ₹1540 — पहले पृष्ठ, फिर ख़र्च। ज्यामिति वहीं ख़त्म जहाँ आकलन शुरू।",
          mr: "308 × 5 = ₹1540 — आधी पृष्ठ, मग खर्च. भूमिती तिथे संपते जिथे अंदाज सुरू.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 11 — Surface Areas and Volumes",
      name: "Surface Areas and Volumes",
      slug: "maths-9-surface-areas-volumes",
      summary:
        "Round solids measured: cones one-third their cylinder, volume conserved through melting, radius doubled multiplying volume eightfold — and Archimedes' sphere two-thirds of its cylinder.",
      position: 11,
      translations: {
        hi: {
          name: "पृष्ठीय क्षेत्रफल और आयतन",
          summary:
            "गोल ठोस नपे: शंकु अपने बेलन का एक-तिहाई, पिघलाने पर संरक्षित आयतन, त्रिज्या दुगुनी से आयतन आठ गुना — और आर्किमिडीज़ का गोला अपने बेलन का दो-तिहाई।",
        },
        mr: {
          name: "पृष्ठफळ आणि घनफळ",
          summary:
            "गोल घन मोजले: शंकू आपल्या दंडगोलाचा एक-तृतीयांश, वितळवल्यावर अक्षय घनफळ, त्रिज्या दुप्पट म्हणजे घनफळ आठपट — आणि आर्किमिडीजचा गोल आपल्या दंडगोलाचा दोन-तृतीयांश.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Statistics (data organised and averaged)                    */
/* ------------------------------------------------------------------------- */
function statistics9(): TopicFileOut {
  const rand = rng("maths-9-statistics");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the mean of 4, 8, 6, 10, 2?",
          hi: "4, 8, 6, 10, 2 का माध्य क्या है?",
          mr: "4, 8, 6, 10, 2 चा मध्य किती?",
        },
        answer: 6,
        wrong: [30, 5, 8],
        checkExpr: "(4+8+6+10+2)/5",
        solution: {
          en: "Add and divide by 5: 30 ÷ 5 = 6. 30 stops at the total, forgetting to share it out.",
          hi: "जोड़कर 5 से भाग: 30 ÷ 5 = 6। 30 कुल पर रुक जाता है, बाँटना भूलकर।",
          mr: "जोडून 5 ने भागा: 30 ÷ 5 = 6. 30 एकूण बेरजेवर थांबतो, वाटायला विसरून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the mode of 3, 5, 5, 7, 5, 9?",
          hi: "3, 5, 5, 7, 5, 9 का बहुलक क्या है?",
          mr: "3, 5, 5, 7, 5, 9 चा बहुलक किती?",
        },
        answer: 5,
        wrong: [3, 7, 9],
        solution: {
          en: "The mode is the most frequent value: 5 appears three times, the others once. Frequency crowns the mode.",
          hi: "बहुलक सबसे बार आने वाला मान है: 5 तीन बार, बाक़ी एक-एक। बारंबारता बहुलक का ताज है।",
          mr: "बहुलक म्हणजे सर्वाधिक वेळा येणारे मूल्य: 5 तीनदा, बाकी एकेकदा. वारंवारता बहुलकाचा मुकुट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the median of 2, 4, 6, 8, 10?",
          hi: "2, 4, 6, 8, 10 की माध्यिका क्या है?",
          mr: "2, 4, 6, 8, 10 ची मध्यगा किती?",
        },
        answer: 6,
        wrong: [4, 8, 30],
        solution: {
          en: "Sorted already, the middle of five values is the third: 6. The median is the central number once ordered.",
          hi: "पहले से क्रमित, पाँच में बीच वाला तीसरा: 6। माध्यिका क्रम लगाने पर बीच की संख्या है।",
          mr: "आधीच क्रमित, पाचांतला मधला तिसरा: 6. मध्यगा म्हणजे क्रम लावल्यावर मधली संख्या.",
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
          en: "What is the median of 3, 1, 4, 1, 5, 9? (Six values — average the middle two.)",
          hi: "3, 1, 4, 1, 5, 9 की माध्यिका क्या है? (छह मान — बीच के दो का औसत।)",
          mr: "3, 1, 4, 1, 5, 9 ची मध्यगा किती? (सहा मूल्ये — मधल्या दोघांची सरासरी.)",
        },
        answer: 3.5,
        wrong: [4, 3, 1],
        checkExpr: "(3+4)/2",
        solution: {
          en: "Sorted: 1,1,3,4,5,9. The middle two are 3 and 4, averaging to 3.5. An even count has no single middle.",
          hi: "क्रमित: 1,1,3,4,5,9। बीच के दो 3 और 4, औसत 3.5। सम गिनती में अकेला बीच नहीं होता।",
          mr: "क्रमित: 1,1,3,4,5,9. मधले दोन 3 आणि 4, सरासरी 3.5. सम संख्येत एकटी मधली नसते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The mean of 5 numbers is 12. What is their total?",
          hi: "5 संख्याओं का माध्य 12 है। उनका योग कितना?",
          mr: "5 संख्यांचा मध्य 12 आहे. त्यांची बेरीज किती?",
        },
        answer: 60,
        wrong: [12, 17, 5],
        checkExpr: "12*5",
        solution: {
          en: "Total = mean × count = 12 × 5 = 60. The mean is the total shared out, so the total is the mean gathered back.",
          hi: "योग = माध्य × गिनती = 12 × 5 = 60। माध्य बँटा योग है, अतः योग फिर जुटाया माध्य है।",
          mr: "बेरीज = मध्य × संख्या = 12 × 5 = 60. मध्य म्हणजे वाटलेली बेरीज, म्हणून बेरीज म्हणजे पुन्हा जमवलेला मध्य.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In a bar graph, each bar's height shows the frequency. If the tallest bar has height 15, that class has how many items?",
          hi: "दंड-आलेख में हर दंड की ऊँचाई बारंबारता दिखाती है। यदि सबसे ऊँचे दंड की ऊँचाई 15 है, उस वर्ग में कितने पद?",
          mr: "स्तंभालेखात प्रत्येक स्तंभाची उंची वारंवारता दाखवते. सर्वांत उंच स्तंभाची उंची 15 असल्यास, त्या वर्गात किती पदे?",
        },
        answer: 15,
        wrong: [1, 30, 7.5],
        solution: {
          en: "Height IS the frequency here: 15. A bar graph reads directly — no conversion. 30 doubles for no reason.",
          hi: "यहाँ ऊँचाई ही बारंबारता है: 15। दंड-आलेख सीधे पढ़ा जाता है — कोई बदल नहीं। 30 अकारण दुगुना।",
          mr: "इथे उंचीच वारंवारता: 15. स्तंभालेख थेट वाचला जातो — बदल नाही. 30 विनाकारण दुप्पट.",
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
          en: "The class interval 10–20 has how wide a class size?",
          hi: "वर्ग-अंतराल 10–20 का वर्ग-आकार कितना चौड़ा है?",
          mr: "वर्ग-अंतर 10–20 चा वर्ग-आकार किती रुंद?",
        },
        answer: 10,
        wrong: [30, 15, 20],
        checkExpr: "20-10",
        solution: {
          en: "Class size = upper − lower = 20 − 10 = 10. 30 adds the limits; 15 gives the midpoint, not the width.",
          hi: "वर्ग-आकार = ऊपरी − निचला = 20 − 10 = 10। 30 सीमाएँ जोड़ता है; 15 मध्य-बिंदु देता है, चौड़ाई नहीं।",
          mr: "वर्ग-आकार = वरची − खालची = 20 − 10 = 10. 30 मर्यादा जोडतो; 15 मध्यबिंदू देतो, रुंदी नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The mean of 10 numbers is 20. If one number, 15, is removed, what is the new total of the remaining 9?",
          hi: "10 संख्याओं का माध्य 20 है। यदि एक संख्या 15 हटा दी जाए, बचे 9 का नया योग कितना?",
          mr: "10 संख्यांचा मध्य 20 आहे. एक संख्या 15 काढल्यास, उरलेल्या 9 ची नवी बेरीज किती?",
        },
        answer: 185,
        wrong: [200, 205, 165],
        checkExpr: "20*10-15",
        solution: {
          en: "Original total 20 × 10 = 200; remove 15 → 185. Take the whole apart, subtract the piece, keep the rest.",
          hi: "मूल योग 20 × 10 = 200; 15 हटाइए → 185। पूरे को खोलिए, टुकड़ा घटाइए, बाक़ी रखिए।",
          mr: "मूळ बेरीज 20 × 10 = 200; 15 काढा → 185. पूर्ण सोडवा, तुकडा वजा करा, बाकी ठेवा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The midpoint (class mark) of the interval 30–40 is?",
          hi: "अंतराल 30–40 का मध्य-मान (वर्ग-चिह्न) कितना है?",
          mr: "अंतर 30–40 चे मध्य-मूल्य (वर्ग-चिन्ह) किती?",
        },
        answer: 35,
        wrong: [70, 10, 30],
        checkExpr: "(30+40)/2",
        solution: {
          en: "Class mark = (lower + upper)/2 = (30 + 40)/2 = 35. The midpoint stands in for the whole interval in mean calculations.",
          hi: "वर्ग-चिह्न = (निचला + ऊपरी)/2 = (30 + 40)/2 = 35। माध्य-गणना में मध्य-बिंदु पूरे अंतराल का प्रतिनिधि है।",
          mr: "वर्ग-चिन्ह = (खालची + वरची)/2 = (30 + 40)/2 = 35. मध्य-गणनेत मध्यबिंदू अख्ख्या अंतराचा प्रतिनिधी.",
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
          en: "The mean of 8 numbers is 15. Adding one more number changes the mean to 16. What is the new number?",
          hi: "8 संख्याओं का माध्य 15 है। एक और संख्या जोड़ने पर माध्य 16 हो जाता है। नई संख्या क्या है?",
          mr: "8 संख्यांचा मध्य 15 आहे. आणखी एक संख्या जोडल्यावर मध्य 16 होतो. नवी संख्या काय?",
        },
        answer: 24,
        wrong: [16, 15, 9],
        checkExpr: "16*9-15*8",
        solution: {
          en: "New total 16 × 9 = 144, old total 15 × 8 = 120; the new number is 144 − 120 = 24. To LIFT a mean, add well above it.",
          hi: "नया योग 16 × 9 = 144, पुराना 15 × 8 = 120; नई संख्या 144 − 120 = 24। माध्य उठाने को उससे कहीं ऊपर जोड़िए।",
          mr: "नवी बेरीज 16 × 9 = 144, जुनी 15 × 8 = 120; नवी संख्या 144 − 120 = 24. मध्य उचलायला त्याहून खूप वर जोडा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A histogram has classes 0–10, 10–20, 20–30 with frequencies 5, 8, 7. How many observations fall BELOW 20?",
          hi: "एक आयतचित्र में वर्ग 0–10, 10–20, 20–30 हैं, बारंबारताएँ 5, 8, 7। 20 से नीचे कितने प्रेक्षण हैं?",
          mr: "एका स्तंभालेखात वर्ग 0–10, 10–20, 20–30, वारंवारता 5, 8, 7. 20 च्या खाली किती निरीक्षणे?",
        },
        answer: 13,
        wrong: [8, 20, 5],
        checkExpr: "5+8",
        solution: {
          en: "Below 20 gathers the first two classes: 5 + 8 = 13. 20 wrongly includes the 20–30 class as well.",
          hi: "20 से नीचे पहले दो वर्ग: 5 + 8 = 13। 20 ग़लती से 20–30 वर्ग भी जोड़ लेता है।",
          mr: "20 च्या खाली पहिले दोन वर्ग: 5 + 8 = 13. 20 चुकून 20–30 वर्गही जोडतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The mean of the first 5 natural numbers 1,2,3,4,5 is?",
          hi: "पहली 5 प्राकृत संख्याओं 1,2,3,4,5 का माध्य कितना?",
          mr: "पहिल्या 5 नैसर्गिक संख्या 1,2,3,4,5 चा मध्य किती?",
        },
        answer: 3,
        wrong: [2.5, 15, 5],
        checkExpr: "15/5",
        solution: {
          en: "(1+2+3+4+5)/5 = 15/5 = 3 — which is also the median, since the data is symmetric. Symmetry aligns mean and median.",
          hi: "(1+2+3+4+5)/5 = 15/5 = 3 — जो माध्यिका भी है, क्योंकि आँकड़े सममित हैं। समरूपता माध्य और माध्यिका को मिला देती है।",
          mr: "(1+2+3+4+5)/5 = 15/5 = 3 — जी मध्यगाही आहे, कारण सामग्री सममित. सममिती मध्य आणि मध्यगा जुळवते.",
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
          en: "Nine workers earn ₹200 each and the owner ₹2000. What is the MEAN daily earning of all ten?",
          hi: "नौ मज़दूर ₹200 प्रत्येक और मालिक ₹2000 कमाते हैं। दसों की माध्य दैनिक कमाई कितनी?",
          mr: "नऊ कामगार प्रत्येकी ₹200 आणि मालक ₹2000 कमावतात. दहाही जणांची सरासरी रोजची कमाई किती?",
        },
        answer: 380,
        wrong: [200, 2000, 1100],
        checkExpr: "(9*200+2000)/10",
        solution: {
          en: "Total = 1800 + 2000 = 3800, mean = 380. Yet NOBODY earns ₹380 — one large value drags the mean above nine of the ten. Here the median, ₹200, is the honest witness.",
          hi: "योग = 1800 + 2000 = 3800, माध्य = 380। पर ₹380 कोई नहीं कमाता — एक बड़ा मूल्य माध्य को दस में से नौ के ऊपर खींच ले जाता है। यहाँ ईमानदार गवाह माध्यिका है: ₹200।",
          mr: "बेरीज = 1800 + 2000 = 3800, मध्य = 380. पण ₹380 कोणीच कमावत नाही — एक मोठे मूल्य मध्याला दहांतल्या नऊंच्या वर ओढते. इथला प्रामाणिक साक्षीदार मध्यगा: ₹200.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Data: 4, 6, 6, 8, 10. By how much does the mean exceed the mode?",
          hi: "आँकड़े: 4, 6, 6, 8, 10। माध्य बहुलक से कितना अधिक है?",
          mr: "सामग्री: 4, 6, 6, 8, 10. मध्य बहुलकापेक्षा किती जास्त?",
        },
        answer: 0.8,
        wrong: [6, 6.8, 0],
        checkExpr: "(4+6+6+8+10)/5-6",
        solution: {
          en: "Mean = 34/5 = 6.8, mode = 6, difference 0.8. Mean and mode need not coincide — the tail pulls the mean up.",
          hi: "माध्य = 34/5 = 6.8, बहुलक = 6, अंतर 0.8। माध्य और बहुलक मिलें ज़रूरी नहीं — पुच्छ माध्य को ऊपर खींचता है।",
          mr: "मध्य = 34/5 = 6.8, बहुलक = 6, फरक 0.8. मध्य आणि बहुलक जुळायलाच हवे असे नाही — शेपूट मध्याला वर ओढते.",
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
          en: "A class of 20 scores a mean of 60. A second class of 30 scores a mean of 70. What is the COMBINED mean of all 50?",
          hi: "20 का एक वर्ग 60 माध्य पाता है। 30 का दूसरा वर्ग 70 माध्य पाता है। सभी 50 का संयुक्त माध्य कितना?",
          mr: "20 चा एक वर्ग 60 मध्य मिळवतो. 30 चा दुसरा वर्ग 70 मध्य मिळवतो. सर्व 50 चा एकत्रित मध्य किती?",
        },
        answer: 66,
        wrong: [65, 130, 63],
        checkExpr: "(20*60+30*70)/50",
        solution: {
          en: "Combined = (20·60 + 30·70)/50 = (1200 + 2100)/50 = 66. NOT the simple 65 — the bigger class pulls the mean toward its own. Weighted, not averaged.",
          hi: "संयुक्त = (20·60 + 30·70)/50 = (1200 + 2100)/50 = 66। सरल 65 नहीं — बड़ा वर्ग माध्य को अपनी ओर खींचता है। भारित, न कि सादा औसत।",
          mr: "एकत्रित = (20·60 + 30·70)/50 = (1200 + 2100)/50 = 66. साधे 65 नाही — मोठा वर्ग मध्याला आपल्याकडे ओढतो. भारित, साधी सरासरी नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Two datasets have the same mean 50 but data A is {50,50,50} and data B is {10,50,90}. Which is more spread out — give B's range.",
          hi: "दो आँकड़ा-समूहों का माध्य समान 50 है पर A = {50,50,50} और B = {10,50,90}। किसमें ज़्यादा फैलाव — B का परिसर बताइए।",
          mr: "दोन सामग्री-संचांचा मध्य समान 50 पण A = {50,50,50} आणि B = {10,50,90}. कशात जास्त पसरण — B ची व्याप्ती द्या.",
        },
        answer: 80,
        wrong: [0, 50, 100],
        checkExpr: "90-10",
        solution: {
          en: "B's range = 90 − 10 = 80, while A's is 0. Same mean, wildly different spread — which is exactly why an average alone never tells the whole story. You must also ask how scattered the data is.",
          hi: "B का परिसर = 90 − 10 = 80, जबकि A का 0। समान माध्य, बेहद अलग फैलाव — इसीलिए अकेला औसत पूरी कहानी नहीं कहता। यह भी पूछना होगा कि आँकड़े कितने बिखरे हैं।",
          mr: "B ची व्याप्ती = 90 − 10 = 80, तर A ची 0. समान मध्य, अत्यंत वेगळी पसरण — म्हणूनच एकटी सरासरी अख्खी कथा सांगत नाही. सामग्री किती विखुरली हेही विचारावे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 9,
      chapter: "Chapter 12 — Statistics",
      name: "Statistics",
      slug: "maths-9-statistics",
      summary:
        "Data averaged and doubted: mean, median and mode told apart, a combined mean weighted not averaged — and one owner's salary showing why an average alone hides the spread.",
      position: 12,
      translations: {
        hi: {
          name: "सांख्यिकी",
          summary:
            "आँकड़े औसते और परखे: माध्य, माध्यिका और बहुलक अलग-अलग, संयुक्त माध्य भारित न कि सादा — और मालिक का वेतन दिखाता कि अकेला औसत फैलाव कैसे छिपाता है।",
        },
        mr: {
          name: "सांख्यिकी",
          summary:
            "सामग्री सरासरी आणि संशयित: मध्य, मध्यगा आणि बहुलक वेगळे, एकत्रित मध्य भारित न की साधा — आणि मालकाचा पगार दाखवतो की एकटी सरासरी पसरण कशी लपवते.",
        },
      },
    },
    qs,
  );
}

export const G9_MATHS: TopicFileOut[] = [
  numberSystems(),
  polynomials(),
  coordinateGeometry(),
  linearTwoVariables(),
  euclidGeometry(),
  linesAndAngles9(),
  triangles9(),
  heronsFormula(),
  surfaceVolumes9(),
  statistics9(),
];
