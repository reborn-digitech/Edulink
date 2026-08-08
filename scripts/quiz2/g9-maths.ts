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

export const G9_MATHS: TopicFileOut[] = [
  numberSystems(),
  polynomials(),
  coordinateGeometry(),
  linearTwoVariables(),
  euclidGeometry(),
];
