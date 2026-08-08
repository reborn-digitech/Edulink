/**
 * Class 10 Maths — NCERT, chapter by chapter. Arithmetic earns its
 * fundamental theorem, zeroes are read off coefficients, the discriminant
 * foretells a quadratic's roots, and word problems fold real situations into
 * equations. Same discipline as ever — every question authored individually,
 * every computable answer proven by a checkExpr, every wrong option a real
 * sixteen-year-old's slip.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Real Numbers (the fundamental theorem, HCF and LCM)           */
/* ------------------------------------------------------------------------- */
function realNumbers(): TopicFileOut {
  const rand = rng("maths-10-real-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the HCF of 12 and 18?",
          hi: "12 और 18 का HCF क्या है?",
          mr: "12 आणि 18 चा HCF काय?",
        },
        answer: 6,
        wrong: [3, 12, 36],
        checkExpr: "12*18/36",
        solution: {
          en: "12 = 2²·3 and 18 = 2·3²; the shared primes are one 2 and one 3, so HCF = 6. Since HCF·LCM = 12·18, HCF = 12·18/36 = 6. (36 is the LCM, not the HCF.)",
          hi: "12 = 2²·3 और 18 = 2·3²; साझा अभाज्य एक 2 और एक 3, अतः HCF = 6. चूँकि HCF·LCM = 12·18, HCF = 12·18/36 = 6. (36 LCM है, HCF नहीं।)",
          mr: "12 = 2²·3 आणि 18 = 2·3²; सामायिक अवयव एक 2 आणि एक 3, म्हणून HCF = 6. HCF·LCM = 12·18 म्हणून HCF = 12·18/36 = 6. (36 हा LCM, HCF नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the LCM of 4 and 6?",
          hi: "4 और 6 का LCM क्या है?",
          mr: "4 आणि 6 चा LCM काय?",
        },
        answer: 12,
        wrong: [2, 10, 24],
        checkExpr: "4*6/2",
        solution: {
          en: "The HCF of 4 and 6 is 2, and HCF·LCM = product, so LCM = 4·6/2 = 12. (24 is the plain product, which double-counts the shared factor 2.)",
          hi: "4 और 6 का HCF 2 है, और HCF·LCM = गुणनफल, अतः LCM = 4·6/2 = 12. (24 सादा गुणनफल है, जो साझा गुणनखंड 2 दो बार गिनता है।)",
          mr: "4 आणि 6 चा HCF 2 आहे, आणि HCF·LCM = गुणाकार, म्हणून LCM = 4·6/2 = 12. (24 हा साधा गुणाकार, जो सामायिक अवयव 2 दोनदा मोजतो.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Written as a product of primes, 140 = 2² × 5 × ▢. What is the missing prime?",
          hi: "अभाज्यों के गुणनफल रूप में, 140 = 2² × 5 × ▢. लुप्त अभाज्य क्या है?",
          mr: "अवयवांच्या गुणाकार रूपात, 140 = 2² × 5 × ▢. हरवलेला अवयव काय?",
        },
        answer: 7,
        wrong: [2, 5, 35],
        checkExpr: "140/20",
        solution: {
          en: "140 = 4 × 5 × 7, so the missing prime is 140/(4·5) = 140/20 = 7. (35 = 5·7 is not itself prime.)",
          hi: "140 = 4 × 5 × 7, अतः लुप्त अभाज्य 140/(4·5) = 140/20 = 7. (35 = 5·7 स्वयं अभाज्य नहीं।)",
          mr: "140 = 4 × 5 × 7, म्हणून हरवलेला अवयव 140/(4·5) = 140/20 = 7. (35 = 5·7 स्वतः अवयव नाही.)",
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
          en: "Two numbers have HCF 9 and LCM 90. If one number is 18, what is the other?",
          hi: "दो संख्याओं का HCF 9 और LCM 90. यदि एक संख्या 18 है, दूसरी क्या है?",
          mr: "दोन संख्यांचा HCF 9 आणि LCM 90. एक संख्या 18 असेल, दुसरी काय?",
        },
        answer: 45,
        wrong: [90, 9, 180],
        checkExpr: "9*90/18",
        solution: {
          en: "For two numbers, HCF·LCM = product of the numbers. So the other = 9·90/18 = 810/18 = 45.",
          hi: "दो संख्याओं के लिए HCF·LCM = संख्याओं का गुणनफल। अतः दूसरी = 9·90/18 = 810/18 = 45.",
          mr: "दोन संख्यांसाठी HCF·LCM = संख्यांचा गुणाकार. म्हणून दुसरी = 9·90/18 = 810/18 = 45.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The HCF of 15 and 20 is 5. What is their LCM?",
          hi: "15 और 20 का HCF 5 है। उनका LCM क्या है?",
          mr: "15 आणि 20 चा HCF 5 आहे. त्यांचा LCM काय?",
        },
        answer: 60,
        wrong: [300, 5, 10],
        checkExpr: "15*20/5",
        solution: {
          en: "LCM = product / HCF = 15·20/5 = 300/5 = 60. (300 is the raw product, before dividing out the shared 5.)",
          hi: "LCM = गुणनफल / HCF = 15·20/5 = 300/5 = 60. (300 कच्चा गुणनफल है, साझा 5 हटाने से पहले।)",
          mr: "LCM = गुणाकार / HCF = 15·20/5 = 300/5 = 60. (300 कच्चा गुणाकार, सामायिक 5 काढण्यापूर्वी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Only one of these fractions has a terminating decimal: 3/8, 4/9, 5/12, 2/7. Which one? (Answer the position 1–4.)",
          hi: "इनमें केवल एक भिन्न का दशमलव सांत है: 3/8, 4/9, 5/12, 2/7. कौन-सा? (स्थान 1–4 बताइए।)",
          mr: "यांत फक्त एका अपूर्णांकाचा दशांश सांत आहे: 3/8, 4/9, 5/12, 2/7. कोणता? (स्थान 1–4 सांगा.)",
        },
        answer: 1,
        wrong: [2, 3, 4],
        solution: {
          en: "A fraction in lowest terms terminates exactly when its denominator has no prime factor other than 2 or 5. Here 8 = 2³ qualifies, so 3/8 = 0.375 terminates; 9 = 3², 12 = 2²·3 and 7 each carry a forbidden prime, so those repeat forever. The answer is position 1.",
          hi: "निम्नतम रूप की भिन्न तभी सांत होती जब हर में 2 या 5 के अलावा कोई अभाज्य न हो। यहाँ 8 = 2³ योग्य, अतः 3/8 = 0.375 सांत; 9 = 3², 12 = 2²·3 और 7 प्रत्येक में वर्जित अभाज्य, अतः वे सदा दोहराते। उत्तर स्थान 1.",
          mr: "लघुतम रूपातील अपूर्णांक तेव्हाच सांत जेव्हा छेदात 2 वा 5 खेरीज कोणता अवयव नसेल. इथे 8 = 2³ पात्र, म्हणून 3/8 = 0.375 सांत; 9 = 3², 12 = 2²·3 आणि 7 प्रत्येकात निषिद्ध अवयव, म्हणून ते सदैव पुनरावृत्त. उत्तर स्थान 1.",
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
          en: "Find the largest number that divides 70 and 125, leaving remainders 5 and 8 respectively.",
          hi: "वह सबसे बड़ी संख्या ज्ञात कीजिए जो 70 और 125 को विभाजित करे, शेष क्रमशः 5 और 8 छोड़ते हुए।",
          mr: "70 आणि 125 ला भागणारी सर्वांत मोठी संख्या शोधा, बाकी अनुक्रमे 5 आणि 8 राहून.",
        },
        answer: 13,
        wrong: [5, 8, 26],
        checkExpr: "65*117/585",
        solution: {
          en: "The number divides 70−5 = 65 and 125−8 = 117 exactly, so it is their HCF. 65 = 5·13, 117 = 9·13, so HCF = 13, checked as 65·117/585 = 13 where 585 is the LCM.",
          hi: "संख्या 70−5 = 65 और 125−8 = 117 को पूरा विभाजित करती, अतः यह उनका HCF है। 65 = 5·13, 117 = 9·13, अतः HCF = 13, जाँच 65·117/585 = 13 जहाँ 585 LCM है।",
          mr: "संख्या 70−5 = 65 आणि 125−8 = 117 ला पूर्ण भागते, म्हणून तो त्यांचा HCF. 65 = 5·13, 117 = 9·13, म्हणून HCF = 13, तपासणी 65·117/585 = 13 जिथे 585 हा LCM.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the smallest number that is exactly divisible by 12, 15 and 20?",
          hi: "वह सबसे छोटी संख्या क्या है जो 12, 15 और 20 से पूरी विभाज्य हो?",
          mr: "12, 15 आणि 20 ने पूर्ण भाग जाणारी सर्वांत लहान संख्या कोणती?",
        },
        answer: 60,
        wrong: [47, 120, 180],
        checkExpr: "4*3*5",
        solution: {
          en: "The smallest such number is the LCM. 12 = 2²·3, 15 = 3·5, 20 = 2²·5; take the highest power of each prime: 2²·3·5 = 4·3·5 = 60.",
          hi: "ऐसी सबसे छोटी संख्या LCM है। 12 = 2²·3, 15 = 3·5, 20 = 2²·5; हर अभाज्य की उच्चतम घात लें: 2²·3·5 = 4·3·5 = 60.",
          mr: "अशी सर्वांत लहान संख्या LCM आहे. 12 = 2²·3, 15 = 3·5, 20 = 2²·5; प्रत्येक अवयवाची उच्चतम घात घ्या: 2²·3·5 = 4·3·5 = 60.",
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
          en: "Three traffic lights change every 48, 72 and 108 seconds. If they change together now, after how many seconds do they next change together?",
          hi: "तीन ट्रैफ़िक बत्तियाँ हर 48, 72 और 108 सेकंड में बदलती हैं। यदि वे अभी साथ बदलती हैं, कितने सेकंड बाद फिर साथ बदलेंगी?",
          mr: "तीन वाहतूक दिवे दर 48, 72 आणि 108 सेकंदांनी बदलतात. आता ते एकत्र बदलले, तर किती सेकंदांनी पुन्हा एकत्र बदलतील?",
        },
        answer: 432,
        wrong: [216, 864, 144],
        checkExpr: "16*27",
        solution: {
          en: "They coincide again after the LCM of the three intervals. 48 = 2⁴·3, 72 = 2³·3², 108 = 2²·3³; the LCM takes 2⁴ and 3³, giving 16·27 = 432 seconds.",
          hi: "वे तीनों अंतरालों के LCM बाद फिर मिलती हैं। 48 = 2⁴·3, 72 = 2³·3², 108 = 2²·3³; LCM 2⁴ और 3³ लेता, देता 16·27 = 432 सेकंड।",
          mr: "ती तिन्ही अंतरांच्या LCM नंतर पुन्हा जुळतात. 48 = 2⁴·3, 72 = 2³·3², 108 = 2²·3³; LCM 2⁴ आणि 3³ घेतो, देतो 16·27 = 432 सेकंद.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The proof that √2 is irrational assumes √2 = p/q in lowest terms and reaches a contradiction. What is the smallest positive integer whose square root is irrational?",
          hi: "√2 के अपरिमेय होने का प्रमाण मानता है √2 = p/q निम्नतम रूप में और विरोधाभास तक पहुँचता है। वह सबसे छोटी धन पूर्णांक क्या है जिसका वर्गमूल अपरिमेय है?",
          mr: "√2 अपरिमेय असल्याचा पुरावा √2 = p/q लघुतम रूपात मानतो आणि विरोधाभासापर्यंत पोहोचतो. ती सर्वांत लहान धन पूर्णांक कोणती जिचे वर्गमूळ अपरिमेय आहे?",
        },
        answer: 2,
        wrong: [3, 4, 1],
        solution: {
          en: "√1 = 1 is rational, and √4 = 2 is rational (both are perfect squares). The first integer that is not a perfect square is 2, and √2 = 1.41421… never terminates or repeats — irrational. So the smallest is 2.",
          hi: "√1 = 1 परिमेय, और √4 = 2 परिमेय (दोनों पूर्ण वर्ग)। पहला पूर्णांक जो पूर्ण वर्ग नहीं वह 2 है, और √2 = 1.41421… न समाप्त होता न दोहराता — अपरिमेय। अतः सबसे छोटा 2.",
          mr: "√1 = 1 परिमेय, आणि √4 = 2 परिमेय (दोन्ही पूर्ण वर्ग). पहिला पूर्णांक जो पूर्ण वर्ग नाही तो 2, आणि √2 = 1.41421… ना संपते ना पुनरावृत्त — अपरिमेय. म्हणून सर्वांत लहान 2.",
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
          en: "For 306 and 657, the HCF is 9. What is their LCM?",
          hi: "306 और 657 के लिए HCF 9 है। उनका LCM क्या है?",
          mr: "306 आणि 657 साठी HCF 9 आहे. त्यांचा LCM काय?",
        },
        answer: 22338,
        wrong: [9, 201042, 657],
        checkExpr: "306*657/9",
        solution: {
          en: "LCM = product / HCF = 306·657/9 = 201042/9 = 22338. (201042 is the raw product before dividing by the HCF.)",
          hi: "LCM = गुणनफल / HCF = 306·657/9 = 201042/9 = 22338. (201042 HCF से भाग देने से पहले कच्चा गुणनफल।)",
          mr: "LCM = गुणाकार / HCF = 306·657/9 = 201042/9 = 22338. (201042 HCF ने भागण्यापूर्वीचा कच्चा गुणाकार.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A courtyard 1872 cm long and 1320 cm broad is paved with identical square tiles of the largest possible size. How many tiles are needed?",
          hi: "1872 सेमी लंबा और 1320 सेमी चौड़ा आँगन सबसे बड़े संभव एक-से वर्गाकार टाइलों से पक्का किया जाता है। कितनी टाइलें चाहिए?",
          mr: "1872 सेमी लांब आणि 1320 सेमी रुंद अंगण सर्वांत मोठ्या शक्य एकसारख्या चौरस फरशांनी बांधले जाते. किती फरशा लागतील?",
        },
        answer: 4290,
        wrong: [132, 143, 4160],
        checkExpr: "78*55",
        solution: {
          en: "The largest tile side is the HCF of 1872 and 1320. 1872 = 2⁴·3²·13, 1320 = 2³·3·5·11, so HCF = 2³·3 = 24 cm. The courtyard is 1872/24 = 78 tiles by 1320/24 = 55 tiles, so 78·55 = 4290 tiles.",
          hi: "सबसे बड़ी टाइल-भुजा 1872 और 1320 का HCF है। 1872 = 2⁴·3²·13, 1320 = 2³·3·5·11, अतः HCF = 2³·3 = 24 सेमी। आँगन 1872/24 = 78 टाइल गुणा 1320/24 = 55 टाइल, अतः 78·55 = 4290 टाइल।",
          mr: "सर्वांत मोठी फरशी-बाजू 1872 आणि 1320 चा HCF. 1872 = 2⁴·3²·13, 1320 = 2³·3·5·11, म्हणून HCF = 2³·3 = 24 सेमी. अंगण 1872/24 = 78 फरशा गुणिले 1320/24 = 55 फरशा, म्हणून 78·55 = 4290 फरशा.",
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
          en: "The HCF of 65 and 117 is 13, and can be written as 65m + 117n. If one solution has m = 2, what is n?",
          hi: "65 और 117 का HCF 13 है, और इसे 65m + 117n लिखा जा सकता है। यदि एक हल में m = 2 है, n क्या है?",
          mr: "65 आणि 117 चा HCF 13 आहे, आणि तो 65m + 117n असा लिहिता येतो. एका उत्तरात m = 2 असेल, तर n काय?",
        },
        answer: -1,
        wrong: [1, -2, 2],
        checkExpr: "(13-130)/117",
        solution: {
          en: "Substitute m = 2: 65·2 + 117n = 13, so 130 + 117n = 13, giving 117n = −117 and n = (13−130)/117 = −1.",
          hi: "m = 2 रखिए: 65·2 + 117n = 13, अतः 130 + 117n = 13, देता 117n = −117 और n = (13−130)/117 = −1.",
          mr: "m = 2 ठेवा: 65·2 + 117n = 13, म्हणून 130 + 117n = 13, देतो 117n = −117 आणि n = (13−130)/117 = −1.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The decimal expansion of 1/7 = 0.142857142857… repeats. How many digits are in its repeating block?",
          hi: "1/7 = 0.142857142857… का दशमलव विस्तार दोहराता है। इसके आवर्ती खंड में कितने अंक हैं?",
          mr: "1/7 = 0.142857142857… चा दशांश विस्तार पुनरावृत्त होतो. त्याच्या आवर्ती गटात किती अंक आहेत?",
        },
        answer: 6,
        wrong: [3, 7, 1],
        solution: {
          en: "The block '142857' repeats, so its length is 6. Because 7 is not made only of 2s and 5s, the decimal never terminates; the block length can be at most 7−1 = 6, and here it hits that maximum.",
          hi: "खंड '142857' दोहराता है, अतः लंबाई 6. चूँकि 7 केवल 2 और 5 से नहीं बना, दशमलव कभी सांत नहीं; खंड-लंबाई अधिकतम 7−1 = 6, और यहाँ वही अधिकतम।",
          mr: "गट '142857' पुनरावृत्त होतो, म्हणून लांबी 6. 7 फक्त 2 आणि 5 ने बनलेला नसल्याने दशांश कधी सांत नाही; गट-लांबी जास्तीत जास्त 7−1 = 6, आणि इथे तीच कमाल.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-real-numbers",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 1 — Real Numbers",
      name: "Real Numbers",
      summary:
        "Every number cracked open into primes: the fundamental theorem behind HCF and LCM, terminating decimals betrayed by a denominator of only 2s and 5s, and irrationals proved by contradiction.",
      position: 1,
      translations: {
        hi: {
          name: "वास्तविक संख्याएँ",
          summary:
            "हर संख्या अभाज्यों में खुली: HCF और LCM के पीछे मूल प्रमेय, केवल 2 और 5 के हर से पहचाने सांत दशमलव, और विरोधाभास से सिद्ध अपरिमेय।",
        },
        mr: {
          name: "वास्तव संख्या",
          summary:
            "प्रत्येक संख्या अवयवांत उघडलेली: HCF आणि LCM मागील मूलभूत प्रमेय, फक्त 2 आणि 5 च्या छेदाने ओळखले सांत दशांश, आणि विरोधाभासाने सिद्ध अपरिमेय.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Polynomials (zeroes read off the coefficients)                */
/* ------------------------------------------------------------------------- */
function polynomials10(): TopicFileOut {
  const rand = rng("maths-10-polynomials");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The polynomial x²−5x+6 has zeroes 2 and 3. What is the sum of its zeroes?",
          hi: "बहुपद x²−5x+6 के शून्यक 2 और 3 हैं। इसके शून्यकों का योग क्या है?",
          mr: "बहुपदी x²−5x+6 चे शून्य 2 आणि 3 आहेत. त्याच्या शून्यांची बेरीज काय?",
        },
        answer: 5,
        wrong: [6, -5, 1],
        checkExpr: "2+3",
        solution: {
          en: "The sum of the zeroes is 2 + 3 = 5, which equals −b/a = −(−5)/1. (6 is the product, not the sum.)",
          hi: "शून्यकों का योग 2 + 3 = 5, जो −b/a = −(−5)/1 के बराबर। (6 गुणनफल है, योग नहीं।)",
          mr: "शून्यांची बेरीज 2 + 3 = 5, जी −b/a = −(−5)/1 इतकी. (6 हा गुणाकार, बेरीज नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The polynomial x²−5x+6 has zeroes 2 and 3. What is the product of its zeroes?",
          hi: "बहुपद x²−5x+6 के शून्यक 2 और 3 हैं। इसके शून्यकों का गुणनफल क्या है?",
          mr: "बहुपदी x²−5x+6 चे शून्य 2 आणि 3 आहेत. त्याच्या शून्यांचा गुणाकार काय?",
        },
        answer: 6,
        wrong: [5, -6, 1],
        checkExpr: "2*3",
        solution: {
          en: "The product of the zeroes is 2·3 = 6, which equals c/a = 6/1. (5 is the sum, not the product.)",
          hi: "शून्यकों का गुणनफल 2·3 = 6, जो c/a = 6/1 के बराबर। (5 योग है, गुणनफल नहीं।)",
          mr: "शून्यांचा गुणाकार 2·3 = 6, जो c/a = 6/1 इतका. (5 ही बेरीज, गुणाकार नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "At most how many zeroes can a quadratic polynomial have?",
          hi: "एक द्विघात बहुपद के अधिकतम कितने शून्यक हो सकते हैं?",
          mr: "एका द्विघात बहुपदीचे जास्तीत जास्त किती शून्य असू शकतात?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        solution: {
          en: "A polynomial's number of zeroes is at most its degree. A quadratic has degree 2, so it has at most 2 zeroes — the two points where its parabola can cross the x-axis.",
          hi: "बहुपद के शून्यकों की संख्या अधिकतम उसकी घात। द्विघात की घात 2, अतः अधिकतम 2 शून्यक — दो बिंदु जहाँ उसका परवलय x-अक्ष काट सकता।",
          mr: "बहुपदीच्या शून्यांची संख्या जास्तीत जास्त तिची घात. द्विघाताची घात 2, म्हणून जास्तीत जास्त 2 शून्य — दोन बिंदू जिथे तिचा परावलय x-अक्ष कापू शकतो.",
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
          en: "What is the sum of the zeroes of x²+7x+10?",
          hi: "x²+7x+10 के शून्यकों का योग क्या है?",
          mr: "x²+7x+10 च्या शून्यांची बेरीज काय?",
        },
        answer: -7,
        wrong: [7, 10, -10],
        checkExpr: "0-7",
        solution: {
          en: "Sum of zeroes = −b/a = −7/1 = −7. (Its zeroes are −2 and −5, which add to −7; 10 is their product.)",
          hi: "शून्यकों का योग = −b/a = −7/1 = −7. (शून्यक −2 और −5, जो जुड़कर −7; 10 उनका गुणनफल।)",
          mr: "शून्यांची बेरीज = −b/a = −7/1 = −7. (शून्य −2 आणि −5, जे मिळून −7; 10 त्यांचा गुणाकार.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the product of the zeroes of 2x²−8?",
          hi: "2x²−8 के शून्यकों का गुणनफल क्या है?",
          mr: "2x²−8 च्या शून्यांचा गुणाकार काय?",
        },
        answer: -4,
        wrong: [4, -8, 8],
        checkExpr: "0-8/2",
        solution: {
          en: "Product of zeroes = c/a = −8/2 = −4. (Its zeroes are 2 and −2, whose product is −4.)",
          hi: "शून्यकों का गुणनफल = c/a = −8/2 = −4. (शून्यक 2 और −2, जिनका गुणनफल −4।)",
          mr: "शून्यांचा गुणाकार = c/a = −8/2 = −4. (शून्य 2 आणि −2, ज्यांचा गुणाकार −4.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "One zero of x²−4 is 2. What is the other zero?",
          hi: "x²−4 का एक शून्यक 2 है। दूसरा शून्यक क्या है?",
          mr: "x²−4 चा एक शून्य 2 आहे. दुसरा शून्य काय?",
        },
        answer: -2,
        wrong: [2, 4, -4],
        checkExpr: "0-2",
        solution: {
          en: "x²−4 = (x−2)(x+2), so the zeroes are 2 and −2. The other is −2. (Their product must be c/a = −4, and 2·(−2) = −4 confirms it.)",
          hi: "x²−4 = (x−2)(x+2), अतः शून्यक 2 और −2. दूसरा −2. (गुणनफल c/a = −4 हो, और 2·(−2) = −4 पुष्टि करता।)",
          mr: "x²−4 = (x−2)(x+2), म्हणून शून्य 2 आणि −2. दुसरा −2. (गुणाकार c/a = −4 असावा, आणि 2·(−2) = −4 पुष्टी करतो.)",
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
          en: "A quadratic has zeroes 3 and −2. Written as x²−(sum)x+(product), what is its constant term?",
          hi: "एक द्विघात के शून्यक 3 और −2 हैं। x²−(योग)x+(गुणनफल) रूप में, इसका अचर पद क्या है?",
          mr: "एका द्विघाताचे शून्य 3 आणि −2 आहेत. x²−(बेरीज)x+(गुणाकार) रूपात, त्याचे स्थिर पद काय?",
        },
        answer: -6,
        wrong: [6, 1, -1],
        checkExpr: "3*(0-2)",
        solution: {
          en: "The constant term is the product of the zeroes, 3·(−2) = −6. (The sum is 3 + (−2) = 1, which is the x-coefficient with a sign flip, not the constant.)",
          hi: "अचर पद शून्यकों का गुणनफल, 3·(−2) = −6. (योग 3 + (−2) = 1, जो चिह्न-बदल के साथ x-गुणांक है, अचर नहीं।)",
          mr: "स्थिर पद शून्यांचा गुणाकार, 3·(−2) = −6. (बेरीज 3 + (−2) = 1, जी चिन्ह-बदलासह x-सहगुणक, स्थिर नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "One zero of x²−kx+15 is 3. What is the value of k?",
          hi: "x²−kx+15 का एक शून्यक 3 है। k का मान क्या है?",
          mr: "x²−kx+15 चा एक शून्य 3 आहे. k ची किंमत काय?",
        },
        answer: 8,
        wrong: [5, 15, 3],
        checkExpr: "3+15/3",
        solution: {
          en: "The product of zeroes is 15, so the other zero is 15/3 = 5. The sum of zeroes is k, so k = 3 + 5 = 3 + 15/3 = 8.",
          hi: "शून्यकों का गुणनफल 15, अतः दूसरा शून्यक 15/3 = 5. शून्यकों का योग k, अतः k = 3 + 5 = 3 + 15/3 = 8.",
          mr: "शून्यांचा गुणाकार 15, म्हणून दुसरा शून्य 15/3 = 5. शून्यांची बेरीज k, म्हणून k = 3 + 5 = 3 + 15/3 = 8.",
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
          en: "If α and β are the zeroes of x²−6x+8, what is α²+β²?",
          hi: "यदि α और β, x²−6x+8 के शून्यक हैं, तो α²+β² क्या है?",
          mr: "α आणि β हे x²−6x+8 चे शून्य असतील, तर α²+β² काय?",
        },
        answer: 20,
        wrong: [52, 4, 28],
        checkExpr: "36-16",
        solution: {
          en: "α+β = 6 and αβ = 8. Using α²+β² = (α+β)²−2αβ = 36 − 2·8 = 36 − 16 = 20. (Checking with the actual zeroes 4 and 2: 16 + 4 = 20.)",
          hi: "α+β = 6 और αβ = 8. α²+β² = (α+β)²−2αβ = 36 − 2·8 = 36 − 16 = 20. (वास्तविक शून्यक 4 और 2 से जाँच: 16 + 4 = 20।)",
          mr: "α+β = 6 आणि αβ = 8. α²+β² = (α+β)²−2αβ = 36 − 2·8 = 36 − 16 = 20. (खऱ्या शून्य 4 आणि 2 ने तपासणी: 16 + 4 = 20.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The zeroes of x²−6x+8 are 4 and 2. What is 1/α + 1/β?",
          hi: "x²−6x+8 के शून्यक 4 और 2 हैं। 1/α + 1/β क्या है?",
          mr: "x²−6x+8 चे शून्य 4 आणि 2 आहेत. 1/α + 1/β काय?",
        },
        answer: 0.75,
        wrong: [0.25, 1.5, 8],
        checkExpr: "6/8",
        solution: {
          en: "1/α + 1/β = (α+β)/(αβ) = 6/8 = 0.75. (Directly, 1/4 + 1/2 = 0.25 + 0.5 = 0.75.)",
          hi: "1/α + 1/β = (α+β)/(αβ) = 6/8 = 0.75. (सीधे, 1/4 + 1/2 = 0.25 + 0.5 = 0.75।)",
          mr: "1/α + 1/β = (α+β)/(αβ) = 6/8 = 0.75. (थेट, 1/4 + 1/2 = 0.25 + 0.5 = 0.75.)",
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
          en: "The cubic x³−6x²+11x−6 has zeroes 1, 2 and 3. What is the sum of their products taken two at a time (αβ+βγ+γα)?",
          hi: "घन x³−6x²+11x−6 के शून्यक 1, 2 और 3 हैं। दो-दो के गुणनफलों का योग (αβ+βγ+γα) क्या है?",
          mr: "घन x³−6x²+11x−6 चे शून्य 1, 2 आणि 3 आहेत. दोन-दोनच्या गुणाकारांची बेरीज (αβ+βγ+γα) काय?",
        },
        answer: 11,
        wrong: [6, 18, 36],
        checkExpr: "2+6+3",
        solution: {
          en: "The pairwise products are 1·2 = 2, 2·3 = 6 and 3·1 = 3, summing to 2 + 6 + 3 = 11 — which equals c/a for the cubic. (6 is the sum, and 6 again the product, of the zeroes.)",
          hi: "जोड़ीदार गुणनफल 1·2 = 2, 2·3 = 6 और 3·1 = 3, योग 2 + 6 + 3 = 11 — जो घन के लिए c/a. (6 शून्यकों का योग, और 6 ही गुणनफल।)",
          mr: "जोडीदार गुणाकार 1·2 = 2, 2·3 = 6 आणि 3·1 = 3, बेरीज 2 + 6 + 3 = 11 — जी घनासाठी c/a. (6 शून्यांची बेरीज, आणि 6 च गुणाकार.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "By the remainder theorem, what is the remainder when p(x) = x³−2x²+x−1 is divided by (x−2)?",
          hi: "शेषफल प्रमेय से, जब p(x) = x³−2x²+x−1 को (x−2) से विभाजित किया जाए तो शेषफल क्या है?",
          mr: "शेष प्रमेयाने, p(x) = x³−2x²+x−1 ला (x−2) ने भागल्यावर शेष काय?",
        },
        answer: 1,
        wrong: [5, 3, -1],
        checkExpr: "8-8+2-1",
        solution: {
          en: "The remainder on division by (x−2) is p(2) = 2³−2·2²+2−1 = 8 − 8 + 2 − 1 = 1.",
          hi: "(x−2) से भाग पर शेषफल p(2) = 2³−2·2²+2−1 = 8 − 8 + 2 − 1 = 1.",
          mr: "(x−2) ने भागल्यावर शेष p(2) = 2³−2·2²+2−1 = 8 − 8 + 2 − 1 = 1.",
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
          en: "The zeroes α and β of x²−5x+6 satisfy α+β = 5 and αβ = 6, with α > β. What is α − β?",
          hi: "x²−5x+6 के शून्यक α और β, α+β = 5 और αβ = 6 संतुष्ट करते हैं, α > β के साथ। α − β क्या है?",
          mr: "x²−5x+6 चे शून्य α आणि β, α+β = 5 आणि αβ = 6 पूर्ण करतात, α > β सह. α − β काय?",
        },
        answer: 1,
        wrong: [5, 25, 6],
        solution: {
          en: "(α−β)² = (α+β)² − 4αβ = 25 − 24 = 1, so α − β = √1 = 1. (The zeroes are 3 and 2, and 3 − 2 = 1.)",
          hi: "(α−β)² = (α+β)² − 4αβ = 25 − 24 = 1, अतः α − β = √1 = 1. (शून्यक 3 और 2, और 3 − 2 = 1।)",
          mr: "(α−β)² = (α+β)² − 4αβ = 25 − 24 = 1, म्हणून α − β = √1 = 1. (शून्य 3 आणि 2, आणि 3 − 2 = 1.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Two of the zeroes of a cubic are 2 and −2, and the sum of all three zeroes is 5. What is the third zero?",
          hi: "एक घन के दो शून्यक 2 और −2 हैं, और तीनों शून्यकों का योग 5 है। तीसरा शून्यक क्या है?",
          mr: "एका घनाचे दोन शून्य 2 आणि −2 आहेत, आणि तिन्ही शून्यांची बेरीज 5 आहे. तिसरा शून्य काय?",
        },
        answer: 5,
        wrong: [0, -5, 1],
        checkExpr: "5-2+2",
        solution: {
          en: "The three zeroes add to 5, and the first two, 2 and −2, cancel. So the third = 5 − 2 − (−2) = 5 − 2 + 2 = 5.",
          hi: "तीनों शून्यक जुड़कर 5, और पहले दो, 2 और −2, रद्द। अतः तीसरा = 5 − 2 − (−2) = 5 − 2 + 2 = 5.",
          mr: "तिन्ही शून्य मिळून 5, आणि पहिले दोन, 2 आणि −2, रद्द. म्हणून तिसरा = 5 − 2 − (−2) = 5 − 2 + 2 = 5.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-polynomials",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 2 — Polynomials",
      name: "Polynomials",
      summary:
        "Zeroes read straight off the coefficients: sum as −b/a, product as c/a, a quadratic rebuilt from its roots, and the remainder theorem turning long division into one substitution.",
      position: 2,
      translations: {
        hi: {
          name: "बहुपद",
          summary:
            "शून्यक सीधे गुणांकों से पढ़े: योग −b/a, गुणनफल c/a, शून्यकों से फिर बना द्विघात, और शेषफल प्रमेय जो लंबे भाग को एक प्रतिस्थापन बनाता।",
        },
        mr: {
          name: "बहुपदी",
          summary:
            "शून्य थेट सहगुणकांतून वाचले: बेरीज −b/a, गुणाकार c/a, शून्यांतून पुन्हा बांधलेला द्विघात, आणि शेष प्रमेय जो लांब भागाला एक बदल बनवतो.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Quadratic Equations (the discriminant foretells the roots)    */
/* ------------------------------------------------------------------------- */
function quadraticEquations(): TopicFileOut {
  const rand = rng("maths-10-quadratic-equations");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "One root of x²−9 = 0 is 3. What is the other root?",
          hi: "x²−9 = 0 का एक मूल 3 है। दूसरा मूल क्या है?",
          mr: "x²−9 = 0 चे एक मूळ 3 आहे. दुसरे मूळ काय?",
        },
        answer: -3,
        wrong: [3, 9, -9],
        checkExpr: "0-3",
        solution: {
          en: "x²−9 = (x−3)(x+3) = 0, so the roots are 3 and −3. The other is −3.",
          hi: "x²−9 = (x−3)(x+3) = 0, अतः मूल 3 और −3. दूसरा −3.",
          mr: "x²−9 = (x−3)(x+3) = 0, म्हणून मूळे 3 आणि −3. दुसरे −3.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the degree of the equation x²+2x+1 = 0?",
          hi: "समीकरण x²+2x+1 = 0 की घात क्या है?",
          mr: "समीकरण x²+2x+1 = 0 ची घात काय?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        solution: {
          en: "The highest power of x is 2, so the degree is 2 — the defining mark of a quadratic equation.",
          hi: "x की उच्चतम घात 2, अतः घात 2 — द्विघात समीकरण की परिभाषक पहचान।",
          mr: "x ची उच्चतम घात 2, म्हणून घात 2 — द्विघात समीकरणाची व्याख्यादर्शक खूण.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "x²−7x = 0 factors as x(x−7) = 0. What is its non-zero root?",
          hi: "x²−7x = 0, x(x−7) = 0 में गुणनखंडित होता है। इसका शून्येतर मूल क्या है?",
          mr: "x²−7x = 0, x(x−7) = 0 असे अवयव होतात. त्याचे शून्येतर मूळ काय?",
        },
        answer: 7,
        wrong: [0, -7, 49],
        checkExpr: "0+7",
        solution: {
          en: "x(x−7) = 0 gives x = 0 or x = 7. The non-zero root is 7.",
          hi: "x(x−7) = 0 देता x = 0 या x = 7. शून्येतर मूल 7.",
          mr: "x(x−7) = 0 देतो x = 0 किंवा x = 7. शून्येतर मूळ 7.",
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
          en: "What is the discriminant of x²−4x+4?",
          hi: "x²−4x+4 का विविक्तकर क्या है?",
          mr: "x²−4x+4 चा विविक्तक काय?",
        },
        answer: 0,
        wrong: [8, 32, -16],
        checkExpr: "16-16",
        solution: {
          en: "Discriminant = b²−4ac = (−4)² − 4·1·4 = 16 − 16 = 0. A zero discriminant means two equal real roots.",
          hi: "विविक्तकर = b²−4ac = (−4)² − 4·1·4 = 16 − 16 = 0. शून्य विविक्तकर का अर्थ दो बराबर वास्तविक मूल।",
          mr: "विविक्तक = b²−4ac = (−4)² − 4·1·4 = 16 − 16 = 0. शून्य विविक्तक म्हणजे दोन समान वास्तव मूळे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the discriminant of x²+x+1?",
          hi: "x²+x+1 का विविक्तकर क्या है?",
          mr: "x²+x+1 चा विविक्तक काय?",
        },
        answer: -3,
        wrong: [3, 5, -5],
        checkExpr: "1-4",
        solution: {
          en: "Discriminant = b²−4ac = 1² − 4·1·1 = 1 − 4 = −3. Being negative, the equation has no real roots.",
          hi: "विविक्तकर = b²−4ac = 1² − 4·1·1 = 1 − 4 = −3. ऋणात्मक होने से समीकरण के कोई वास्तविक मूल नहीं।",
          mr: "विविक्तक = b²−4ac = 1² − 4·1·1 = 1 − 4 = −3. ऋण असल्याने समीकरणाला कोणतीही वास्तव मूळे नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The roots of x²−8x+15 = 0 are 3 and 5. What is their sum?",
          hi: "x²−8x+15 = 0 के मूल 3 और 5 हैं। उनका योग क्या है?",
          mr: "x²−8x+15 = 0 चे मूळ 3 आणि 5 आहेत. त्यांची बेरीज काय?",
        },
        answer: 8,
        wrong: [15, 2, -8],
        checkExpr: "3+5",
        solution: {
          en: "Sum of roots = 3 + 5 = 8, matching −b/a = −(−8)/1. (15 is the product of the roots.)",
          hi: "मूलों का योग = 3 + 5 = 8, जो −b/a = −(−8)/1 से मेल। (15 मूलों का गुणनफल।)",
          mr: "मूळांची बेरीज = 3 + 5 = 8, जी −b/a = −(−8)/1 शी जुळते. (15 मूळांचा गुणाकार.)",
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
          en: "Solve x²−7x+12 = 0 by factoring. What is its larger root?",
          hi: "x²−7x+12 = 0 को गुणनखंडन से हल कीजिए। इसका बड़ा मूल क्या है?",
          mr: "x²−7x+12 = 0 अवयव पद्धतीने सोडवा. त्याचे मोठे मूळ काय?",
        },
        answer: 4,
        wrong: [3, 7, 12],
        checkExpr: "12/3",
        solution: {
          en: "x²−7x+12 = (x−3)(x−4) = 0, so the roots are 3 and 4; the larger is 4 = 12/3. (7 is the sum, 12 the product.)",
          hi: "x²−7x+12 = (x−3)(x−4) = 0, अतः मूल 3 और 4; बड़ा 4 = 12/3. (7 योग, 12 गुणनफल।)",
          mr: "x²−7x+12 = (x−3)(x−4) = 0, म्हणून मूळे 3 आणि 4; मोठे 4 = 12/3. (7 बेरीज, 12 गुणाकार.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "For what positive value of k does x²−kx+9 = 0 have two equal roots?",
          hi: "k के किस धन मान के लिए x²−kx+9 = 0 के दो बराबर मूल हों?",
          mr: "k च्या कोणत्या धन किमतीसाठी x²−kx+9 = 0 ची दोन समान मूळे असतील?",
        },
        answer: 6,
        wrong: [3, 9, 36],
        solution: {
          en: "Equal roots need discriminant 0: k² − 4·1·9 = 0, so k² = 36 and (taking the positive value) k = 6.",
          hi: "बराबर मूलों को विविक्तकर 0 चाहिए: k² − 4·1·9 = 0, अतः k² = 36 और (धन मान लेते) k = 6.",
          mr: "समान मूळांना विविक्तक 0 हवा: k² − 4·1·9 = 0, म्हणून k² = 36 आणि (धन किंमत घेता) k = 6.",
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
          en: "Solve 2x²−7x+3 = 0 by the quadratic formula. What is its integer root?",
          hi: "2x²−7x+3 = 0 को द्विघात सूत्र से हल कीजिए। इसका पूर्णांक मूल क्या है?",
          mr: "2x²−7x+3 = 0 द्विघात सूत्राने सोडवा. त्याचे पूर्णांक मूळ काय?",
        },
        answer: 3,
        wrong: [1, 6, 7],
        checkExpr: "(7+5)/4",
        solution: {
          en: "x = [7 ± √(49−24)]/4 = [7 ± 5]/4, giving 3 or 0.5. The integer root is (7+5)/4 = 3.",
          hi: "x = [7 ± √(49−24)]/4 = [7 ± 5]/4, देता 3 या 0.5. पूर्णांक मूल (7+5)/4 = 3.",
          mr: "x = [7 ± √(49−24)]/4 = [7 ± 5]/4, देतो 3 किंवा 0.5. पूर्णांक मूळ (7+5)/4 = 3.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the sum of the roots of 3x²−12x+9 = 0?",
          hi: "3x²−12x+9 = 0 के मूलों का योग क्या है?",
          mr: "3x²−12x+9 = 0 च्या मूळांची बेरीज काय?",
        },
        answer: 4,
        wrong: [3, 9, -4],
        checkExpr: "12/3",
        solution: {
          en: "Sum of roots = −b/a = −(−12)/3 = 12/3 = 4. (The roots are 1 and 3, which add to 4.)",
          hi: "मूलों का योग = −b/a = −(−12)/3 = 12/3 = 4. (मूल 1 और 3, जो जुड़कर 4।)",
          mr: "मूळांची बेरीज = −b/a = −(−12)/3 = 12/3 = 4. (मूळे 1 आणि 3, जी मिळून 4.)",
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
          en: "The product of two consecutive positive integers is 56. What is the larger integer?",
          hi: "दो क्रमागत धन पूर्णांकों का गुणनफल 56 है। बड़ा पूर्णांक क्या है?",
          mr: "दोन क्रमागत धन पूर्णांकांचा गुणाकार 56 आहे. मोठा पूर्णांक काय?",
        },
        answer: 8,
        wrong: [7, 9, 28],
        checkExpr: "56/7",
        solution: {
          en: "Let the smaller be x: x(x+1) = 56, so x²+x−56 = 0 = (x−7)(x+8), giving x = 7. The integers are 7 and 8; the larger is 8 = 56/7.",
          hi: "छोटा x मानिए: x(x+1) = 56, अतः x²+x−56 = 0 = (x−7)(x+8), देता x = 7. पूर्णांक 7 और 8; बड़ा 8 = 56/7.",
          mr: "लहान x माना: x(x+1) = 56, म्हणून x²+x−56 = 0 = (x−7)(x+8), देतो x = 7. पूर्णांक 7 आणि 8; मोठा 8 = 56/7.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A rectangular plot of area 528 m² has a length one more than twice its breadth. What is its breadth in metres?",
          hi: "528 वर्ग मीटर क्षेत्रफल के आयताकार भूखंड की लंबाई उसकी चौड़ाई के दुगुने से एक अधिक है। इसकी चौड़ाई मीटर में क्या है?",
          mr: "528 चौरस मीटर क्षेत्रफळाच्या आयताकृती भूखंडाची लांबी त्याच्या रुंदीच्या दुपटीहून एक अधिक आहे. त्याची रुंदी मीटरमध्ये काय?",
        },
        answer: 16,
        wrong: [33, 32, 23],
        checkExpr: "(0-1+65)/4",
        solution: {
          en: "With breadth x, length 2x+1: x(2x+1) = 528, so 2x²+x−528 = 0. Then x = [−1 + √(1+4224)]/4 = [−1 + 65]/4 = 16 m. (Length 33 m gives 16·33 = 528.)",
          hi: "चौड़ाई x, लंबाई 2x+1: x(2x+1) = 528, अतः 2x²+x−528 = 0. तब x = [−1 + √(1+4224)]/4 = [−1 + 65]/4 = 16 मी। (लंबाई 33 मी देता 16·33 = 528।)",
          mr: "रुंदी x, लांबी 2x+1: x(2x+1) = 528, म्हणून 2x²+x−528 = 0. मग x = [−1 + √(1+4224)]/4 = [−1 + 65]/4 = 16 मी. (लांबी 33 मी देते 16·33 = 528.)",
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
          en: "For x²−2x−1 = 0, the sum of the roots is 2 and the product is −1. What is (sum + product)?",
          hi: "x²−2x−1 = 0 के लिए, मूलों का योग 2 और गुणनफल −1 है। (योग + गुणनफल) क्या है?",
          mr: "x²−2x−1 = 0 साठी, मूळांची बेरीज 2 आणि गुणाकार −1 आहे. (बेरीज + गुणाकार) काय?",
        },
        answer: 1,
        wrong: [3, -2, 0],
        checkExpr: "2-1",
        solution: {
          en: "Sum of roots = −b/a = 2, product = c/a = −1. Their total is 2 + (−1) = 1. (The roots themselves are the irrational 1 ± √2, but sum and product stay whole.)",
          hi: "मूलों का योग = −b/a = 2, गुणनफल = c/a = −1. कुल 2 + (−1) = 1. (मूल स्वयं अपरिमेय 1 ± √2, पर योग-गुणनफल पूर्ण।)",
          mr: "मूळांची बेरीज = −b/a = 2, गुणाकार = c/a = −1. एकूण 2 + (−1) = 1. (मूळे स्वतः अपरिमेय 1 ± √2, पण बेरीज-गुणाकार पूर्ण.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A train covers 360 km at a uniform speed. Had it gone 5 km/h faster, it would have taken 1 hour less. What was its speed in km/h?",
          hi: "एक रेल 360 किमी एकसमान चाल से तय करती है। यदि वह 5 किमी/घंटा तेज़ जाती, तो 1 घंटा कम लगता। उसकी चाल किमी/घंटा में क्या थी?",
          mr: "एक रेल्वे 360 किमी एकसमान चालीने पार करते. ती 5 किमी/तास वेगाने गेली असती, तर 1 तास कमी लागला असता. तिची चाल किमी/तास मध्ये काय होती?",
        },
        answer: 40,
        wrong: [45, 36, 35],
        checkExpr: "(0-5+85)/2",
        solution: {
          en: "With speed x, time is 360/x. The condition 360/x − 360/(x+5) = 1 leads to x²+5x−1800 = 0. Then x = [−5 + √(25+7200)]/2 = [−5 + 85]/2 = 40 km/h. (Check: 360/40 = 9 h and 360/45 = 8 h differ by 1.)",
          hi: "चाल x पर समय 360/x. शर्त 360/x − 360/(x+5) = 1 देती x²+5x−1800 = 0. तब x = [−5 + √(25+7200)]/2 = [−5 + 85]/2 = 40 किमी/घंटा। (जाँच: 360/40 = 9 घं और 360/45 = 8 घं में 1 का अंतर।)",
          mr: "चाल x वर वेळ 360/x. अट 360/x − 360/(x+5) = 1 देते x²+5x−1800 = 0. मग x = [−5 + √(25+7200)]/2 = [−5 + 85]/2 = 40 किमी/तास. (तपासणी: 360/40 = 9 तास आणि 360/45 = 8 तास यांत 1 चा फरक.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-quadratic-equations",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 3 — Quadratic Equations",
      name: "Quadratic Equations",
      summary:
        "Second-degree equations solved and foretold: factoring, the quadratic formula, and a discriminant that reveals whether the roots are two, one or none — with word problems folded into equations.",
      position: 3,
      translations: {
        hi: {
          name: "द्विघात समीकरण",
          summary:
            "द्वितीय घात समीकरण हल और पूर्वकथित: गुणनखंडन, द्विघात सूत्र, और एक विविक्तकर जो बताता मूल दो, एक या शून्य — शब्द-समस्याएँ समीकरणों में मोड़ी।",
        },
        mr: {
          name: "द्विघात समीकरणे",
          summary:
            "द्वितीय घात समीकरणे सोडवली आणि पूर्वकथित: अवयव, द्विघात सूत्र, आणि एक विविक्तक जो सांगतो मूळे दोन, एक की शून्य — शब्द-समस्या समीकरणांत घडवली.",
        },
      },
    },
    qs,
  );
}

export const G10_MATHS: TopicFileOut[] = [realNumbers(), polynomials10(), quadraticEquations()];
