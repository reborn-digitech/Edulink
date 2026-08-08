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

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Pair of Linear Equations in Two Variables                     */
/* ------------------------------------------------------------------------- */
function pairLinear10(): TopicFileOut {
  const rand = rng("maths-10-pair-linear-equations");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Adding the equations x + y = 10 and x − y = 4 gives 2x = 14. What is x?",
          hi: "समीकरण x + y = 10 और x − y = 4 जोड़ने पर 2x = 14 मिलता है। x क्या है?",
          mr: "समीकरणे x + y = 10 आणि x − y = 4 जोडल्यावर 2x = 14 मिळते. x काय?",
        },
        answer: 7,
        wrong: [3, 14, 5],
        checkExpr: "14/2",
        solution: {
          en: "The y terms cancel on adding, leaving 2x = 14, so x = 14/2 = 7.",
          hi: "जोड़ने पर y पद रद्द, बचता 2x = 14, अतः x = 14/2 = 7.",
          mr: "जोडल्यावर y पदे रद्द, उरते 2x = 14, म्हणून x = 14/2 = 7.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In x + y = 10, if x = 7, what is y?",
          hi: "x + y = 10 में, यदि x = 7 है, तो y क्या है?",
          mr: "x + y = 10 मध्ये, x = 7 असेल, तर y काय?",
        },
        answer: 3,
        wrong: [7, 17, -3],
        checkExpr: "10-7",
        solution: {
          en: "Substitute x = 7: 7 + y = 10, so y = 10 − 7 = 3.",
          hi: "x = 7 रखिए: 7 + y = 10, अतः y = 10 − 7 = 3.",
          mr: "x = 7 ठेवा: 7 + y = 10, म्हणून y = 10 − 7 = 3.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many variables does the equation 2x + 3y = 12 contain?",
          hi: "समीकरण 2x + 3y = 12 में कितने चर हैं?",
          mr: "समीकरण 2x + 3y = 12 मध्ये किती चल आहेत?",
        },
        answer: 2,
        wrong: [1, 3, 12],
        solution: {
          en: "The unknowns are x and y — two variables. That is what makes it a linear equation in two variables.",
          hi: "अज्ञात x और y — दो चर। यही इसे दो चर वाला रैखिक समीकरण बनाता।",
          mr: "अज्ञात x आणि y — दोन चल. हेच त्याला दोन चलांचे रेषीय समीकरण बनवते.",
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
          en: "Solve x + y = 5 and 2x + y = 8. Subtracting gives x = 3. What is y?",
          hi: "x + y = 5 और 2x + y = 8 हल कीजिए। घटाने पर x = 3 मिलता है। y क्या है?",
          mr: "x + y = 5 आणि 2x + y = 8 सोडवा. वजा केल्यावर x = 3 मिळते. y काय?",
        },
        answer: 2,
        wrong: [3, 8, -2],
        checkExpr: "5-3",
        solution: {
          en: "With x = 3, the first equation gives 3 + y = 5, so y = 5 − 3 = 2.",
          hi: "x = 3 से पहला समीकरण देता 3 + y = 5, अतः y = 5 − 3 = 2.",
          mr: "x = 3 ने पहिले समीकरण देते 3 + y = 5, म्हणून y = 5 − 3 = 2.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "If two lines have a1/a2 = b1/b2 but a1/a2 ≠ c1/c2, they are parallel. How many solutions does the system have?",
          hi: "यदि दो रेखाओं का a1/a2 = b1/b2 पर a1/a2 ≠ c1/c2, वे समांतर हैं। तंत्र के कितने हल हैं?",
          mr: "दोन रेषांचे a1/a2 = b1/b2 पण a1/a2 ≠ c1/c2 असेल, तर त्या समांतर. यंत्रणेला किती उत्तरे?",
        },
        answer: 0,
        wrong: [1, 2, -1],
        solution: {
          en: "Parallel lines never meet, so there is no common point — zero solutions. The system is inconsistent.",
          hi: "समांतर रेखाएँ कभी नहीं मिलतीं, अतः कोई उभयनिष्ठ बिंदु नहीं — शून्य हल। तंत्र असंगत।",
          mr: "समांतर रेषा कधी भेटत नाहीत, म्हणून कोणताही समान बिंदू नाही — शून्य उत्तरे. यंत्रणा विसंगत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "If 2x = 3y and x = 6, what is y?",
          hi: "यदि 2x = 3y और x = 6, तो y क्या है?",
          mr: "2x = 3y आणि x = 6 असेल, तर y काय?",
        },
        answer: 4,
        wrong: [6, 9, 2],
        checkExpr: "12/3",
        solution: {
          en: "Substitute x = 6: 2·6 = 3y, so 12 = 3y and y = 12/3 = 4.",
          hi: "x = 6 रखिए: 2·6 = 3y, अतः 12 = 3y और y = 12/3 = 4.",
          mr: "x = 6 ठेवा: 2·6 = 3y, म्हणून 12 = 3y आणि y = 12/3 = 4.",
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
          en: "The sum of two numbers is 20 and their difference is 6. What is the larger number?",
          hi: "दो संख्याओं का योग 20 और उनका अंतर 6 है। बड़ी संख्या क्या है?",
          mr: "दोन संख्यांची बेरीज 20 आणि त्यांचा फरक 6 आहे. मोठी संख्या काय?",
        },
        answer: 13,
        wrong: [7, 10, 14],
        checkExpr: "26/2",
        solution: {
          en: "With x + y = 20 and x − y = 6, adding gives 2x = 26, so the larger is x = 26/2 = 13. (The smaller is 7.)",
          hi: "x + y = 20 और x − y = 6 से, जोड़ने पर 2x = 26, अतः बड़ी x = 26/2 = 13. (छोटी 7।)",
          mr: "x + y = 20 आणि x − y = 6 ने, जोडल्यावर 2x = 26, म्हणून मोठी x = 26/2 = 13. (लहान 7.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "For what value of k do 2x + 3y = 7 and 4x + 6y = k have infinitely many solutions?",
          hi: "k के किस मान के लिए 2x + 3y = 7 और 4x + 6y = k के अनंत हल हों?",
          mr: "k च्या कोणत्या किमतीसाठी 2x + 3y = 7 आणि 4x + 6y = k ला अनंत उत्तरे असतील?",
        },
        answer: 14,
        wrong: [7, 2, 28],
        checkExpr: "7*2",
        solution: {
          en: "Infinitely many solutions need a1/a2 = b1/b2 = c1/c2: here 2/4 = 3/6 = 7/k, so 1/2 = 7/k gives k = 7·2 = 14.",
          hi: "अनंत हल को a1/a2 = b1/b2 = c1/c2 चाहिए: यहाँ 2/4 = 3/6 = 7/k, अतः 1/2 = 7/k देता k = 7·2 = 14.",
          mr: "अनंत उत्तरांना a1/a2 = b1/b2 = c1/c2 हवे: इथे 2/4 = 3/6 = 7/k, म्हणून 1/2 = 7/k देते k = 7·2 = 14.",
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
          en: "A two-digit number has digit sum 9, and is 27 more than the number formed by reversing its digits. What is the number?",
          hi: "एक दो-अंकीय संख्या के अंकों का योग 9 है, और यह अपने अंक उलटने से बनी संख्या से 27 अधिक है। संख्या क्या है?",
          mr: "एका दोन-अंकी संख्येच्या अंकांची बेरीज 9 आहे, आणि ती तिचे अंक उलटवून बनलेल्या संख्येहून 27 अधिक आहे. संख्या काय?",
        },
        answer: 63,
        wrong: [36, 45, 72],
        checkExpr: "10*6+3",
        solution: {
          en: "Let tens t, units u: t + u = 9 and (10t+u) − (10u+t) = 27, i.e. 9(t−u) = 27, so t − u = 3. Then t = 6, u = 3, and the number is 10·6 + 3 = 63.",
          hi: "दहाई t, इकाई u: t + u = 9 और (10t+u) − (10u+t) = 27, अर्थात् 9(t−u) = 27, अतः t − u = 3. तब t = 6, u = 3, और संख्या 10·6 + 3 = 63.",
          mr: "दशक t, एकक u: t + u = 9 आणि (10t+u) − (10u+t) = 27, म्हणजे 9(t−u) = 27, म्हणून t − u = 3. मग t = 6, u = 3, आणि संख्या 10·6 + 3 = 63.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "5 pencils and 3 pens cost ₹80, while 2 pencils and 1 pen cost ₹30. What is the cost of one pen in rupees?",
          hi: "5 पेंसिल और 3 पेन की क़ीमत ₹80, जबकि 2 पेंसिल और 1 पेन की ₹30 है। एक पेन की क़ीमत रुपये में क्या है?",
          mr: "5 पेन्सिली आणि 3 पेनांची किंमत ₹80, तर 2 पेन्सिली आणि 1 पेनाची ₹30 आहे. एका पेनाची किंमत रुपयांत काय?",
        },
        answer: 10,
        wrong: [5, 20, 15],
        checkExpr: "30-2*10",
        solution: {
          en: "With pencil p and pen q: 5p + 3q = 80 and 2p + q = 30. From the second, q = 30 − 2p; substituting gives p = 10, so q = 30 − 2·10 = 10.",
          hi: "पेंसिल p और पेन q: 5p + 3q = 80 और 2p + q = 30. दूसरे से q = 30 − 2p; प्रतिस्थापित करने पर p = 10, अतः q = 30 − 2·10 = 10.",
          mr: "पेन्सिल p आणि पेन q: 5p + 3q = 80 आणि 2p + q = 30. दुसऱ्यातून q = 30 − 2p; बदलल्यावर p = 10, म्हणून q = 30 − 2·10 = 10.",
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
          en: "A father is three times as old as his son. Five years ago he was four times as old. What is the father's present age in years?",
          hi: "एक पिता अपने पुत्र से तीन गुना उम्र का है। पाँच वर्ष पहले वह चार गुना उम्र का था। पिता की वर्तमान आयु वर्षों में क्या है?",
          mr: "एक वडील आपल्या मुलाच्या तिप्पट वयाचे आहेत. पाच वर्षांपूर्वी ते चौपट वयाचे होते. वडिलांचे सध्याचे वय वर्षांत काय?",
        },
        answer: 45,
        wrong: [15, 40, 60],
        checkExpr: "3*15",
        solution: {
          en: "Let son s, father 3s. Five years ago: 3s − 5 = 4(s − 5) = 4s − 20, so s = 15. The father is 3·15 = 45.",
          hi: "पुत्र s, पिता 3s। पाँच वर्ष पहले: 3s − 5 = 4(s − 5) = 4s − 20, अतः s = 15. पिता 3·15 = 45.",
          mr: "मुलगा s, वडील 3s. पाच वर्षांपूर्वी: 3s − 5 = 4(s − 5) = 4s − 20, म्हणून s = 15. वडील 3·15 = 45.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "7 audio cassettes and 3 video cassettes cost ₹1110, while 5 audio and 4 video cost ₹1350. What is the cost of one video cassette in rupees?",
          hi: "7 ऑडियो और 3 वीडियो कैसेट की क़ीमत ₹1110, जबकि 5 ऑडियो और 4 वीडियो की ₹1350 है। एक वीडियो कैसेट की क़ीमत रुपये में क्या है?",
          mr: "7 ऑडिओ आणि 3 व्हिडिओ कॅसेटची किंमत ₹1110, तर 5 ऑडिओ आणि 4 व्हिडिओची ₹1350 आहे. एका व्हिडिओ कॅसेटची किंमत रुपयांत काय?",
        },
        answer: 300,
        wrong: [30, 150, 270],
        checkExpr: "900/3",
        solution: {
          en: "With audio a, video v: 7a + 3v = 1110 and 5a + 4v = 1350. Eliminating v (×4 and ×3) gives 13a = 390, so a = 30; then 7·30 + 3v = 1110 gives 3v = 900 and v = 300.",
          hi: "ऑडियो a, वीडियो v: 7a + 3v = 1110 और 5a + 4v = 1350. v हटाने (×4 और ×3) पर 13a = 390, अतः a = 30; तब 7·30 + 3v = 1110 देता 3v = 900 और v = 300.",
          mr: "ऑडिओ a, व्हिडिओ v: 7a + 3v = 1110 आणि 5a + 4v = 1350. v काढल्यावर (×4 आणि ×3) 13a = 390, म्हणून a = 30; मग 7·30 + 3v = 1110 देते 3v = 900 आणि v = 300.",
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
          en: "Solve 2/x + 3/y = 13 and 5/x − 4/y = −2, with x, y ≠ 0. What is the value of 1/x?",
          hi: "2/x + 3/y = 13 और 5/x − 4/y = −2 हल कीजिए, x, y ≠ 0. 1/x का मान क्या है?",
          mr: "2/x + 3/y = 13 आणि 5/x − 4/y = −2 सोडवा, x, y ≠ 0. 1/x ची किंमत काय?",
        },
        answer: 2,
        wrong: [3, 4, 5],
        checkExpr: "46/23",
        solution: {
          en: "Let a = 1/x, b = 1/y: 2a + 3b = 13 and 5a − 4b = −2. Multiplying by 4 and 3 and adding eliminates b: 23a = 46, so a = 1/x = 46/23 = 2.",
          hi: "a = 1/x, b = 1/y मानिए: 2a + 3b = 13 और 5a − 4b = −2. 4 और 3 से गुणा कर जोड़ने पर b हटता: 23a = 46, अतः a = 1/x = 46/23 = 2.",
          mr: "a = 1/x, b = 1/y माना: 2a + 3b = 13 आणि 5a − 4b = −2. 4 आणि 3 ने गुणून जोडल्यावर b निघतो: 23a = 46, म्हणून a = 1/x = 46/23 = 2.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Two cars start from points 100 km apart. Going the same way they meet in 5 hours; coming towards each other, in 1 hour. What is the faster car's speed in km/h?",
          hi: "दो कारें 100 किमी दूर बिंदुओं से चलती हैं। एक ही दिशा में जाने पर वे 5 घंटे में मिलती हैं; एक-दूसरे की ओर आने पर 1 घंटे में। तेज़ कार की चाल किमी/घंटा में क्या है?",
          mr: "दोन गाड्या 100 किमी दूरच्या बिंदूंपासून निघतात. एकाच दिशेने जाताना त्या 5 तासांत भेटतात; एकमेकांकडे येताना 1 तासात. वेगवान गाडीची चाल किमी/तास मध्ये काय?",
        },
        answer: 60,
        wrong: [40, 20, 80],
        checkExpr: "(100+20)/2",
        solution: {
          en: "Let speeds u > v. Same direction: 5(u − v) = 100, so u − v = 20. Opposite: (u + v)·1 = 100, so u + v = 100. Adding, 2u = 120, giving u = (100 + 20)/2 = 60 km/h.",
          hi: "चालें u > v मानिए। एक दिशा: 5(u − v) = 100, अतः u − v = 20. विपरीत: (u + v)·1 = 100, अतः u + v = 100. जोड़ने पर 2u = 120, देता u = (100 + 20)/2 = 60 किमी/घंटा।",
          mr: "चाली u > v माना. एक दिशा: 5(u − v) = 100, म्हणून u − v = 20. विरुद्ध: (u + v)·1 = 100, म्हणून u + v = 100. जोडल्यावर 2u = 120, देतो u = (100 + 20)/2 = 60 किमी/तास.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-pair-linear-equations",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 4 — Pair of Linear Equations in Two Variables",
      name: "Pair of Linear Equations in Two Variables",
      summary:
        "Two lines, one crossing: solved by substitution and elimination, their ratios foretelling one solution, none or infinitely many, and everyday puzzles of ages, coins and speeds folded into a pair of equations.",
      position: 4,
      translations: {
        hi: {
          name: "दो चर वाले रैखिक समीकरण युग्म",
          summary:
            "दो रेखाएँ, एक कटान: प्रतिस्थापन और विलोपन से हल, उनके अनुपात बताते एक हल, शून्य या अनंत, और आयु-सिक्के-चाल की रोज़मर्रा पहेलियाँ समीकरण-युग्म में मोड़ी।",
        },
        mr: {
          name: "दोन चलांची रेषीय समीकरण जोडी",
          summary:
            "दोन रेषा, एक छेद: बदल आणि निर्मूलनाने सोडवली, त्यांचे गुणोत्तर सांगतात एक उत्तर, शून्य की अनंत, आणि वय-नाणी-चालीची रोजची कोडी समीकरण-जोडीत घडवली.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Arithmetic Progressions                                       */
/* ------------------------------------------------------------------------- */
function arithmeticProgressions10(): TopicFileOut {
  const rand = rng("maths-10-arithmetic-progressions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "In the sequence 2, 5, 8, 11, …, what is the common difference?",
          hi: "अनुक्रम 2, 5, 8, 11, … में सार्व अंतर क्या है?",
          mr: "क्रम 2, 5, 8, 11, … मध्ये सामाईक फरक काय?",
        },
        answer: 3,
        wrong: [2, 5, 7],
        checkExpr: "5-2",
        solution: {
          en: "The common difference is any term minus the one before it: 5 − 2 = 3 (and 8 − 5 = 3), so d = 3.",
          hi: "सार्व अंतर कोई पद घटा उससे पिछला: 5 − 2 = 3 (और 8 − 5 = 3), अतः d = 3.",
          mr: "सामाईक फरक कोणतेही पद वजा आधीचे: 5 − 2 = 3 (आणि 8 − 5 = 3), म्हणून d = 3.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A sequence has first term 5 and common difference 4. What is its second term?",
          hi: "एक अनुक्रम का पहला पद 5 और सार्व अंतर 4 है। इसका दूसरा पद क्या है?",
          mr: "एका क्रमाचे पहिले पद 5 आणि सामाईक फरक 4 आहे. त्याचे दुसरे पद काय?",
        },
        answer: 9,
        wrong: [5, 4, 13],
        checkExpr: "5+4",
        solution: {
          en: "The second term is the first plus the common difference: 5 + 4 = 9.",
          hi: "दूसरा पद पहला जमा सार्व अंतर: 5 + 4 = 9.",
          mr: "दुसरे पद पहिले अधिक सामाईक फरक: 5 + 4 = 9.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Is the sequence 2, 4, 8, 16 an arithmetic progression? (Answer 1 for yes, 0 for no.)",
          hi: "क्या अनुक्रम 2, 4, 8, 16 एक समांतर श्रेढ़ी है? (हाँ के लिए 1, नहीं के लिए 0।)",
          mr: "क्रम 2, 4, 8, 16 ही अंकगणिती श्रेढी आहे का? (हो साठी 1, नाही साठी 0.)",
        },
        answer: 0,
        wrong: [1, 2, 4],
        solution: {
          en: "The differences are 2, 4, 8 — not constant. An AP needs a fixed common difference, so this is not an AP (it doubles each time, a geometric pattern). Answer 0.",
          hi: "अंतर 2, 4, 8 — नियत नहीं। AP को नियत सार्व अंतर चाहिए, अतः यह AP नहीं (हर बार दुगुना, ज्यामितीय नमूना)। उत्तर 0.",
          mr: "फरक 2, 4, 8 — स्थिर नाही. APला स्थिर सामाईक फरक हवा, म्हणून ही AP नाही (प्रत्येक वेळी दुप्पट, भूमितीय नमुना). उत्तर 0.",
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
          en: "Find the 10th term of the AP 3, 7, 11, … using a + (n−1)d.",
          hi: "a + (n−1)d से AP 3, 7, 11, … का 10वाँ पद ज्ञात कीजिए।",
          mr: "a + (n−1)d वापरून AP 3, 7, 11, … चे 10वे पद शोधा.",
        },
        answer: 39,
        wrong: [43, 40, 36],
        checkExpr: "3+9*4",
        solution: {
          en: "Here a = 3, d = 4, n = 10. The nth term = a + (n−1)d = 3 + 9·4 = 3 + 36 = 39.",
          hi: "यहाँ a = 3, d = 4, n = 10. nवाँ पद = a + (n−1)d = 3 + 9·4 = 3 + 36 = 39.",
          mr: "इथे a = 3, d = 4, n = 10. nवे पद = a + (n−1)d = 3 + 9·4 = 3 + 36 = 39.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The 5th term of an AP is 17 and its first term is 5. What is the common difference?",
          hi: "एक AP का 5वाँ पद 17 और पहला पद 5 है। सार्व अंतर क्या है?",
          mr: "एका APचे 5वे पद 17 आणि पहिले पद 5 आहे. सामाईक फरक काय?",
        },
        answer: 3,
        wrong: [12, 4, 17],
        checkExpr: "(17-5)/4",
        solution: {
          en: "a₅ = a + 4d = 17, so 5 + 4d = 17, giving 4d = 12 and d = (17 − 5)/4 = 3.",
          hi: "a₅ = a + 4d = 17, अतः 5 + 4d = 17, देता 4d = 12 और d = (17 − 5)/4 = 3.",
          mr: "a₅ = a + 4d = 17, म्हणून 5 + 4d = 17, देते 4d = 12 आणि d = (17 − 5)/4 = 3.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many terms are there in the AP 6, 9, 12, …, 30?",
          hi: "AP 6, 9, 12, …, 30 में कितने पद हैं?",
          mr: "AP 6, 9, 12, …, 30 मध्ये किती पदे आहेत?",
        },
        answer: 9,
        wrong: [8, 10, 24],
        checkExpr: "(30-6)/3+1",
        solution: {
          en: "With a = 6, d = 3, last term 30: n = (last − first)/d + 1 = (30 − 6)/3 + 1 = 8 + 1 = 9.",
          hi: "a = 6, d = 3, अंतिम पद 30: n = (अंतिम − पहला)/d + 1 = (30 − 6)/3 + 1 = 8 + 1 = 9.",
          mr: "a = 6, d = 3, शेवटचे पद 30: n = (शेवटचे − पहिले)/d + 1 = (30 − 6)/3 + 1 = 8 + 1 = 9.",
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
          en: "Find the sum of the first 10 terms of the AP 2, 4, 6, … using S = (n/2)(2a + (n−1)d).",
          hi: "S = (n/2)(2a + (n−1)d) से AP 2, 4, 6, … के पहले 10 पदों का योग ज्ञात कीजिए।",
          mr: "S = (n/2)(2a + (n−1)d) वापरून AP 2, 4, 6, … च्या पहिल्या 10 पदांची बेरीज शोधा.",
        },
        answer: 110,
        wrong: [100, 120, 55],
        checkExpr: "5*(4+18)",
        solution: {
          en: "With a = 2, d = 2, n = 10: S = (10/2)(2·2 + 9·2) = 5·(4 + 18) = 5·22 = 110.",
          hi: "a = 2, d = 2, n = 10: S = (10/2)(2·2 + 9·2) = 5·(4 + 18) = 5·22 = 110.",
          mr: "a = 2, d = 2, n = 10: S = (10/2)(2·2 + 9·2) = 5·(4 + 18) = 5·22 = 110.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Which term of the AP 5, 8, 11, … equals 50?",
          hi: "AP 5, 8, 11, … का कौन-सा पद 50 के बराबर है?",
          mr: "AP 5, 8, 11, … चे कोणते पद 50 इतके आहे?",
        },
        answer: 16,
        wrong: [15, 17, 45],
        checkExpr: "(50-5)/3+1",
        solution: {
          en: "a = 5, d = 3. Set a + (n−1)d = 50: 5 + (n−1)3 = 50, so (n−1) = 15 and n = (50 − 5)/3 + 1 = 16.",
          hi: "a = 5, d = 3. a + (n−1)d = 50 रखिए: 5 + (n−1)3 = 50, अतः (n−1) = 15 और n = (50 − 5)/3 + 1 = 16.",
          mr: "a = 5, d = 3. a + (n−1)d = 50 ठेवा: 5 + (n−1)3 = 50, म्हणून (n−1) = 15 आणि n = (50 − 5)/3 + 1 = 16.",
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
          en: "The sum of the first n natural numbers, 1 + 2 + … + n, is 210. What is n?",
          hi: "पहली n प्राकृत संख्याओं का योग, 1 + 2 + … + n, 210 है। n क्या है?",
          mr: "पहिल्या n नैसर्गिक संख्यांची बेरीज, 1 + 2 + … + n, 210 आहे. n काय?",
        },
        answer: 20,
        wrong: [21, 15, 42],
        checkExpr: "(0-1+41)/2",
        solution: {
          en: "n(n+1)/2 = 210, so n² + n − 420 = 0. Then n = [−1 + √(1 + 1680)]/2 = [−1 + 41]/2 = 20.",
          hi: "n(n+1)/2 = 210, अतः n² + n − 420 = 0. तब n = [−1 + √(1 + 1680)]/2 = [−1 + 41]/2 = 20.",
          mr: "n(n+1)/2 = 210, म्हणून n² + n − 420 = 0. मग n = [−1 + √(1 + 1680)]/2 = [−1 + 41]/2 = 20.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Find the sum of the first 20 terms of the AP whose first term is 1 and common difference is 4.",
          hi: "उस AP के पहले 20 पदों का योग ज्ञात कीजिए जिसका पहला पद 1 और सार्व अंतर 4 है।",
          mr: "ज्या APचे पहिले पद 1 आणि सामाईक फरक 4 आहे त्याच्या पहिल्या 20 पदांची बेरीज शोधा.",
        },
        answer: 780,
        wrong: [770, 800, 390],
        checkExpr: "10*(2+76)",
        solution: {
          en: "S = (n/2)(2a + (n−1)d) = (20/2)(2·1 + 19·4) = 10·(2 + 76) = 10·78 = 780.",
          hi: "S = (n/2)(2a + (n−1)d) = (20/2)(2·1 + 19·4) = 10·(2 + 76) = 10·78 = 780.",
          mr: "S = (n/2)(2a + (n−1)d) = (20/2)(2·1 + 19·4) = 10·(2 + 76) = 10·78 = 780.",
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
          en: "The 7th term of an AP is 34 and the 13th term is 64. What is its common difference?",
          hi: "एक AP का 7वाँ पद 34 और 13वाँ पद 64 है। इसका सार्व अंतर क्या है?",
          mr: "एका APचे 7वे पद 34 आणि 13वे पद 64 आहे. त्याचा सामाईक फरक काय?",
        },
        answer: 5,
        wrong: [30, 6, 10],
        checkExpr: "(64-34)/6",
        solution: {
          en: "a₁₃ − a₇ = (13 − 7)d = 6d = 64 − 34 = 30, so d = 30/6 = 5.",
          hi: "a₁₃ − a₇ = (13 − 7)d = 6d = 64 − 34 = 30, अतः d = 30/6 = 5.",
          mr: "a₁₃ − a₇ = (13 − 7)d = 6d = 64 − 34 = 30, म्हणून d = 30/6 = 5.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "How many two-digit numbers are divisible by 3?",
          hi: "कितनी दो-अंकीय संख्याएँ 3 से विभाज्य हैं?",
          mr: "किती दोन-अंकी संख्या 3 ने भाग जातात?",
        },
        answer: 30,
        wrong: [29, 33, 31],
        checkExpr: "(99-12)/3+1",
        solution: {
          en: "They form the AP 12, 15, …, 99 with d = 3. Count = (99 − 12)/3 + 1 = 87/3 + 1 = 29 + 1 = 30.",
          hi: "वे AP 12, 15, …, 99 बनातीं, d = 3. गिनती = (99 − 12)/3 + 1 = 87/3 + 1 = 29 + 1 = 30.",
          mr: "त्या AP 12, 15, …, 99 बनवतात, d = 3. मोजणी = (99 − 12)/3 + 1 = 87/3 + 1 = 29 + 1 = 30.",
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
          en: "The sum of the first 15 terms of an AP is 465, and its first term is 3. What is its 15th (last) term?",
          hi: "एक AP के पहले 15 पदों का योग 465, और पहला पद 3 है। इसका 15वाँ (अंतिम) पद क्या है?",
          mr: "एका APच्या पहिल्या 15 पदांची बेरीज 465, आणि पहिले पद 3 आहे. त्याचे 15वे (शेवटचे) पद काय?",
        },
        answer: 59,
        wrong: [62, 31, 60],
        checkExpr: "465*2/15-3",
        solution: {
          en: "Using S = (n/2)(a + l): 465 = (15/2)(3 + l), so 3 + l = 465·2/15 = 62, giving l = 62 − 3 = 59.",
          hi: "S = (n/2)(a + l) से: 465 = (15/2)(3 + l), अतः 3 + l = 465·2/15 = 62, देता l = 62 − 3 = 59.",
          mr: "S = (n/2)(a + l) ने: 465 = (15/2)(3 + l), म्हणून 3 + l = 465·2/15 = 62, देते l = 62 − 3 = 59.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "For an AP, the sum of the first n terms is n². What is its 5th term?",
          hi: "एक AP के लिए, पहले n पदों का योग n² है। इसका 5वाँ पद क्या है?",
          mr: "एका APसाठी, पहिल्या n पदांची बेरीज n² आहे. त्याचे 5वे पद काय?",
        },
        answer: 9,
        wrong: [25, 10, 16],
        checkExpr: "2*5-1",
        solution: {
          en: "The nth term is Sₙ − Sₙ₋₁ = n² − (n−1)² = 2n − 1. For n = 5, that is 2·5 − 1 = 9. (25 is S₅, the sum, not the 5th term.)",
          hi: "nवाँ पद Sₙ − Sₙ₋₁ = n² − (n−1)² = 2n − 1. n = 5 पर 2·5 − 1 = 9. (25 S₅ योग है, 5वाँ पद नहीं।)",
          mr: "nवे पद Sₙ − Sₙ₋₁ = n² − (n−1)² = 2n − 1. n = 5 वर 2·5 − 1 = 9. (25 हा S₅ बेरीज, 5वे पद नाही.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-arithmetic-progressions",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 5 — Arithmetic Progressions",
      name: "Arithmetic Progressions",
      summary:
        "Sequences that step by a fixed amount: the nth term as a + (n−1)d, the sum as (n/2)(2a + (n−1)d), and a term recovered as the difference of two running totals.",
      position: 5,
      translations: {
        hi: {
          name: "समांतर श्रेढ़ी",
          summary:
            "नियत मात्रा से क़दम बढ़ाते अनुक्रम: nवाँ पद a + (n−1)d, योग (n/2)(2a + (n−1)d), और एक पद दो चालू योगों के अंतर से निकाला।",
        },
        mr: {
          name: "अंकगणिती श्रेढी",
          summary:
            "स्थिर रकमेने पाऊल टाकणारे क्रम: nवे पद a + (n−1)d, बेरीज (n/2)(2a + (n−1)d), आणि एक पद दोन चालू बेरजांच्या फरकाने काढले.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Coordinate Geometry (distances and division of a segment)     */
/* ------------------------------------------------------------------------- */
function coordinateGeometry10(): TopicFileOut {
  const rand = rng("maths-10-coordinate-geometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the distance between the points (0, 0) and (3, 4)?",
          hi: "बिंदुओं (0, 0) और (3, 4) के बीच की दूरी क्या है?",
          mr: "बिंदू (0, 0) आणि (3, 4) यांच्यातील अंतर काय?",
        },
        answer: 5,
        wrong: [7, 25, 12],
        solution: {
          en: "Distance = √((3−0)² + (4−0)²) = √(9 + 16) = √25 = 5. (25 is the value before taking the square root.)",
          hi: "दूरी = √((3−0)² + (4−0)²) = √(9 + 16) = √25 = 5. (25 वर्गमूल लेने से पहले का मान।)",
          mr: "अंतर = √((3−0)² + (4−0)²) = √(9 + 16) = √25 = 5. (25 वर्गमूळ घेण्यापूर्वीचे मूल्य.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The midpoint of the segment joining (2, 4) and (6, 8) has what x-coordinate?",
          hi: "(2, 4) और (6, 8) को जोड़ते खंड के मध्यबिंदु का x-निर्देशांक क्या है?",
          mr: "(2, 4) आणि (6, 8) जोडणाऱ्या रेषाखंडाच्या मध्यबिंदूचा x-निर्देशांक काय?",
        },
        answer: 4,
        wrong: [2, 8, 6],
        checkExpr: "(2+6)/2",
        solution: {
          en: "The midpoint's x-coordinate is the average of the two x-values: (2 + 6)/2 = 4.",
          hi: "मध्यबिंदु का x-निर्देशांक दो x-मानों का औसत: (2 + 6)/2 = 4.",
          mr: "मध्यबिंदूचा x-निर्देशांक दोन x-मूल्यांची सरासरी: (2 + 6)/2 = 4.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "On which axis does the point (5, 0) lie? (x-axis code 1, y-axis code 2.)",
          hi: "बिंदु (5, 0) किस अक्ष पर है? (x-अक्ष कोड 1, y-अक्ष कोड 2।)",
          mr: "बिंदू (5, 0) कोणत्या अक्षावर आहे? (x-अक्ष कोड 1, y-अक्ष कोड 2.)",
        },
        answer: 1,
        wrong: [2, 5, 0],
        solution: {
          en: "A point with y = 0 lies on the x-axis (code 1). Points on the y-axis instead have x = 0.",
          hi: "y = 0 वाला बिंदु x-अक्ष पर (कोड 1)। y-अक्ष के बिंदुओं का x = 0 होता।",
          mr: "y = 0 असलेला बिंदू x-अक्षावर (कोड 1). y-अक्षावरील बिंदूंचा x = 0 असतो.",
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
          en: "What is the distance between the points (0, 0) and (6, 8)?",
          hi: "बिंदुओं (0, 0) और (6, 8) के बीच की दूरी क्या है?",
          mr: "बिंदू (0, 0) आणि (6, 8) यांच्यातील अंतर काय?",
        },
        answer: 10,
        wrong: [14, 100, 48],
        solution: {
          en: "Distance = √(6² + 8²) = √(36 + 64) = √100 = 10.",
          hi: "दूरी = √(6² + 8²) = √(36 + 64) = √100 = 10.",
          mr: "अंतर = √(6² + 8²) = √(36 + 64) = √100 = 10.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The midpoint of (−2, 3) and (4, −1) is (x, y). What is y?",
          hi: "(−2, 3) और (4, −1) का मध्यबिंदु (x, y) है। y क्या है?",
          mr: "(−2, 3) आणि (4, −1) चा मध्यबिंदू (x, y) आहे. y काय?",
        },
        answer: 1,
        wrong: [2, -1, 3],
        checkExpr: "(3-1)/2",
        solution: {
          en: "The y-coordinate of the midpoint is (3 + (−1))/2 = (3 − 1)/2 = 1.",
          hi: "मध्यबिंदु का y-निर्देशांक (3 + (−1))/2 = (3 − 1)/2 = 1.",
          mr: "मध्यबिंदूचा y-निर्देशांक (3 + (−1))/2 = (3 − 1)/2 = 1.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Point P divides the segment from (0, 0) to (10, 0) in the ratio 2:3. What is its x-coordinate?",
          hi: "बिंदु P, (0, 0) से (10, 0) तक के खंड को 2:3 अनुपात में विभाजित करता है। इसका x-निर्देशांक क्या है?",
          mr: "बिंदू P, (0, 0) पासून (10, 0) पर्यंतच्या खंडाला 2:3 प्रमाणात विभागतो. त्याचा x-निर्देशांक काय?",
        },
        answer: 4,
        wrong: [6, 5, 10],
        checkExpr: "2*10/5",
        solution: {
          en: "By the section formula, x = (2·10 + 3·0)/(2 + 3) = 20/5 = 4.",
          hi: "विभाजन सूत्र से, x = (2·10 + 3·0)/(2 + 3) = 20/5 = 4.",
          mr: "विभाजन सूत्राने, x = (2·10 + 3·0)/(2 + 3) = 20/5 = 4.",
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
          en: "What is the distance of the point (5, 12) from the origin?",
          hi: "बिंदु (5, 12) की मूल बिंदु से दूरी क्या है?",
          mr: "बिंदू (5, 12) चे मूळबिंदूपासून अंतर काय?",
        },
        answer: 13,
        wrong: [17, 7, 169],
        solution: {
          en: "Distance from the origin = √(5² + 12²) = √(25 + 144) = √169 = 13.",
          hi: "मूल बिंदु से दूरी = √(5² + 12²) = √(25 + 144) = √169 = 13.",
          mr: "मूळबिंदूपासून अंतर = √(5² + 12²) = √(25 + 144) = √169 = 13.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The point dividing the join of (1, 2) and (7, 8) in the ratio 1:2 has what x-coordinate?",
          hi: "(1, 2) और (7, 8) के योग को 1:2 अनुपात में विभाजित करते बिंदु का x-निर्देशांक क्या है?",
          mr: "(1, 2) आणि (7, 8) च्या जोडणीला 1:2 प्रमाणात विभागणाऱ्या बिंदूचा x-निर्देशांक काय?",
        },
        answer: 3,
        wrong: [4, 9, 5],
        checkExpr: "(7+2)/3",
        solution: {
          en: "By the section formula, x = (1·7 + 2·1)/(1 + 2) = (7 + 2)/3 = 9/3 = 3.",
          hi: "विभाजन सूत्र से, x = (1·7 + 2·1)/(1 + 2) = (7 + 2)/3 = 9/3 = 3.",
          mr: "विभाजन सूत्राने, x = (1·7 + 2·1)/(1 + 2) = (7 + 2)/3 = 9/3 = 3.",
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
          en: "The midpoint of A(x, 4) and B(6, 8) is (5, 6). What is x?",
          hi: "A(x, 4) और B(6, 8) का मध्यबिंदु (5, 6) है। x क्या है?",
          mr: "A(x, 4) आणि B(6, 8) चा मध्यबिंदू (5, 6) आहे. x काय?",
        },
        answer: 4,
        wrong: [10, 5, 7],
        checkExpr: "5*2-6",
        solution: {
          en: "The midpoint's x is (x + 6)/2 = 5, so x + 6 = 10 and x = 5·2 − 6 = 4.",
          hi: "मध्यबिंदु का x (x + 6)/2 = 5, अतः x + 6 = 10 और x = 5·2 − 6 = 4.",
          mr: "मध्यबिंदूचा x (x + 6)/2 = 5, म्हणून x + 6 = 10 आणि x = 5·2 − 6 = 4.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the length of the vertical segment joining A(2, 3) and B(2, 9)?",
          hi: "A(2, 3) और B(2, 9) को जोड़ते ऊर्ध्वाधर खंड की लंबाई क्या है?",
          mr: "A(2, 3) आणि B(2, 9) जोडणाऱ्या उभ्या खंडाची लांबी काय?",
        },
        answer: 6,
        wrong: [8, 12, 3],
        checkExpr: "9-3",
        solution: {
          en: "The x-coordinates match, so the segment is vertical and its length is the difference of the y-values: 9 − 3 = 6.",
          hi: "x-निर्देशांक समान, अतः खंड ऊर्ध्वाधर और लंबाई y-मानों का अंतर: 9 − 3 = 6.",
          mr: "x-निर्देशांक समान, म्हणून खंड उभा आणि लांबी y-मूल्यांचा फरक: 9 − 3 = 6.",
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
          en: "Find the x-coordinate of the point on the x-axis that is equidistant from (2, −5) and (−2, 9).",
          hi: "x-अक्ष पर उस बिंदु का x-निर्देशांक ज्ञात कीजिए जो (2, −5) और (−2, 9) से समान दूरी पर है।",
          mr: "x-अक्षावरील त्या बिंदूचा x-निर्देशांक शोधा जो (2, −5) आणि (−2, 9) पासून समान अंतरावर आहे.",
        },
        answer: -7,
        wrong: [7, -3, 3],
        checkExpr: "56/(0-8)",
        solution: {
          en: "For a point (x, 0): (x−2)² + 25 = (x+2)² + 81. Expanding, −4x + 25 = 4x + 81, so −8x = 56 and x = 56/(−8) = −7.",
          hi: "बिंदु (x, 0) के लिए: (x−2)² + 25 = (x+2)² + 81. विस्तार पर −4x + 25 = 4x + 81, अतः −8x = 56 और x = 56/(−8) = −7.",
          mr: "बिंदू (x, 0) साठी: (x−2)² + 25 = (x+2)² + 81. विस्तारल्यावर −4x + 25 = 4x + 81, म्हणून −8x = 56 आणि x = 56/(−8) = −7.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The point of trisection nearer to A on the segment A(2, −2), B(−7, 4) divides it 1:2. What is its x-coordinate?",
          hi: "खंड A(2, −2), B(−7, 4) पर A के निकट त्रिविभाजन बिंदु इसे 1:2 में विभाजित करता है। इसका x-निर्देशांक क्या है?",
          mr: "खंड A(2, −2), B(−7, 4) वर A जवळचा त्रिभाजन बिंदू त्याला 1:2 मध्ये विभागतो. त्याचा x-निर्देशांक काय?",
        },
        answer: -1,
        wrong: [1, -3, 2],
        checkExpr: "(0-7+4)/3",
        solution: {
          en: "By the section formula with ratio 1:2, x = (1·(−7) + 2·2)/(1 + 2) = (−7 + 4)/3 = −3/3 = −1.",
          hi: "1:2 अनुपात से विभाजन सूत्र: x = (1·(−7) + 2·2)/(1 + 2) = (−7 + 4)/3 = −3/3 = −1.",
          mr: "1:2 प्रमाणाने विभाजन सूत्र: x = (1·(−7) + 2·2)/(1 + 2) = (−7 + 4)/3 = −3/3 = −1.",
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
          en: "The distance between P(2, −3) and Q(10, y) is 10. What is the positive value of y?",
          hi: "P(2, −3) और Q(10, y) के बीच की दूरी 10 है। y का धन मान क्या है?",
          mr: "P(2, −3) आणि Q(10, y) यांच्यातील अंतर 10 आहे. y ची धन किंमत काय?",
        },
        answer: 3,
        wrong: [9, -9, 6],
        checkExpr: "6-3",
        solution: {
          en: "(10−2)² + (y+3)² = 10², so 64 + (y+3)² = 100, giving (y+3)² = 36 and y + 3 = ±6. The positive value is y = 6 − 3 = 3.",
          hi: "(10−2)² + (y+3)² = 10², अतः 64 + (y+3)² = 100, देता (y+3)² = 36 और y + 3 = ±6. धन मान y = 6 − 3 = 3.",
          mr: "(10−2)² + (y+3)² = 10², म्हणून 64 + (y+3)² = 100, देते (y+3)² = 36 आणि y + 3 = ±6. धन किंमत y = 6 − 3 = 3.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A circle's diameter has endpoints (−2, 4) and (6, 2). What is the x-coordinate of its centre?",
          hi: "एक वृत्त के व्यास के सिरे (−2, 4) और (6, 2) हैं। इसके केंद्र का x-निर्देशांक क्या है?",
          mr: "एका वर्तुळाच्या व्यासाची टोके (−2, 4) आणि (6, 2) आहेत. त्याच्या केंद्राचा x-निर्देशांक काय?",
        },
        answer: 2,
        wrong: [4, 3, 1],
        checkExpr: "(0-2+6)/2",
        solution: {
          en: "The centre is the midpoint of the diameter, so its x-coordinate is (−2 + 6)/2 = 4/2 = 2.",
          hi: "केंद्र व्यास का मध्यबिंदु, अतः इसका x-निर्देशांक (−2 + 6)/2 = 4/2 = 2.",
          mr: "केंद्र व्यासाचा मध्यबिंदू, म्हणून त्याचा x-निर्देशांक (−2 + 6)/2 = 4/2 = 2.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-coordinate-geometry",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 6 — Coordinate Geometry",
      name: "Coordinate Geometry",
      summary:
        "Geometry done by arithmetic on coordinates: the distance formula from Pythagoras, the midpoint as an average, and the section formula slicing a segment in any ratio.",
      position: 6,
      translations: {
        hi: {
          name: "निर्देशांक ज्यामिति",
          summary:
            "निर्देशांकों पर अंकगणित से की ज्यामिति: पाइथागोरस से दूरी सूत्र, औसत बतौर मध्यबिंदु, और किसी भी अनुपात में खंड काटता विभाजन सूत्र।",
        },
        mr: {
          name: "निर्देशांक भूमिती",
          summary:
            "निर्देशांकांवर अंकगणिताने केलेली भूमिती: पायथागोरसमधून अंतर सूत्र, सरासरी म्हणून मध्यबिंदू, आणि कोणत्याही प्रमाणात खंड कापणारे विभाजन सूत्र.",
        },
      },
    },
    qs,
  );
}


/* ------------------------------------------------------------------------- */
/* Chapter 7 — Triangles (similarity, the BPT, and areas)                    */
/* ------------------------------------------------------------------------- */
function triangles10(): TopicFileOut {
  const rand = rng("maths-10-triangles");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Two angles of a triangle are 50° and 60°. What is the third angle in degrees?",
          hi: "एक त्रिभुज के दो कोण 50° और 60° हैं। तीसरा कोण डिग्री में क्या है?",
          mr: "एका त्रिकोणाचे दोन कोन 50° आणि 60° आहेत. तिसरा कोन अंशांत काय?",
        },
        answer: 70,
        wrong: [60, 80, 110],
        checkExpr: "180-50-60",
        solution: {
          en: "The angles of a triangle sum to 180°, so the third is 180 − 50 − 60 = 70°.",
          hi: "त्रिभुज के कोणों का योग 180°, अतः तीसरा 180 − 50 − 60 = 70°.",
          mr: "त्रिकोणाच्या कोनांची बेरीज 180°, म्हणून तिसरा 180 − 50 − 60 = 70°.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two triangles are similar, their corresponding sides in the ratio 2:3. A side of the first is 4 cm. What is the matching side of the second?",
          hi: "दो त्रिभुज समरूप हैं, उनकी संगत भुजाएँ 2:3 अनुपात में। पहले की एक भुजा 4 सेमी है। दूसरे की संगत भुजा क्या है?",
          mr: "दोन त्रिकोण समरूप, त्यांच्या संगत बाजू 2:3 प्रमाणात. पहिल्याची एक बाजू 4 सेमी. दुसऱ्याची संगत बाजू काय?",
        },
        answer: 6,
        wrong: [8, 2, 12],
        checkExpr: "4*3/2",
        solution: {
          en: "Corresponding sides of similar triangles keep the ratio 2:3, so the matching side = 4·(3/2) = 6 cm.",
          hi: "समरूप त्रिभुजों की संगत भुजाएँ 2:3 अनुपात रखतीं, अतः संगत भुजा = 4·(3/2) = 6 सेमी।",
          mr: "समरूप त्रिकोणांच्या संगत बाजू 2:3 प्रमाण राखतात, म्हणून संगत बाजू = 4·(3/2) = 6 सेमी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many pairs of equal angles are needed to prove two triangles similar by the AA criterion?",
          hi: "AA कसौटी से दो त्रिभुज समरूप सिद्ध करने के लिए कितने बराबर कोणों के युग्म चाहिए?",
          mr: "AA निकषाने दोन त्रिकोण समरूप सिद्ध करायला किती समान कोनांच्या जोड्या हव्यात?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        solution: {
          en: "The AA criterion needs 2 pairs of equal angles; since the angles of a triangle sum to 180°, the third pair is then automatically equal.",
          hi: "AA कसौटी को 2 बराबर कोण-युग्म चाहिए; चूँकि त्रिभुज के कोणों का योग 180°, तीसरा युग्म स्वतः बराबर।",
          mr: "AA निकषाला 2 समान कोन-जोड्या हव्यात; त्रिकोणाच्या कोनांची बेरीज 180° असल्याने तिसरी जोडी आपोआप समान.",
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
          en: "In triangle ABC, DE ∥ BC with D on AB and E on AC. If AD = 1.5, DB = 3 and AE = 2, what is EC?",
          hi: "त्रिभुज ABC में, DE ∥ BC, D, AB पर और E, AC पर। यदि AD = 1.5, DB = 3 और AE = 2, तो EC क्या है?",
          mr: "त्रिकोण ABC मध्ये, DE ∥ BC, D, AB वर आणि E, AC वर. AD = 1.5, DB = 3 आणि AE = 2 असेल, तर EC काय?",
        },
        answer: 4,
        wrong: [3, 6, 1],
        checkExpr: "2*3/1.5",
        solution: {
          en: "By the Basic Proportionality Theorem, AD/DB = AE/EC, so 1.5/3 = 2/EC, giving EC = 2·3/1.5 = 4.",
          hi: "आधारभूत समानुपात प्रमेय से, AD/DB = AE/EC, अतः 1.5/3 = 2/EC, देता EC = 2·3/1.5 = 4.",
          mr: "आधारभूत प्रमाण प्रमेयाने, AD/DB = AE/EC, म्हणून 1.5/3 = 2/EC, देते EC = 2·3/1.5 = 4.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The areas of two similar triangles are in the ratio of the squares of their corresponding sides. If the sides are in ratio 2:3, the areas are in ratio 4:▢. What is the missing number?",
          hi: "दो समरूप त्रिभुजों के क्षेत्रफल संगत भुजाओं के वर्गों के अनुपात में हैं। यदि भुजाएँ 2:3 अनुपात में, क्षेत्रफल 4:▢ में। लुप्त संख्या क्या है?",
          mr: "दोन समरूप त्रिकोणांची क्षेत्रफळे संगत बाजूंच्या वर्गांच्या प्रमाणात आहेत. बाजू 2:3 प्रमाणात असतील, क्षेत्रफळे 4:▢ मध्ये. हरवलेली संख्या काय?",
        },
        answer: 9,
        wrong: [6, 4, 3],
        checkExpr: "3*3",
        solution: {
          en: "The area ratio is the square of the side ratio: 2²:3² = 4:9. The missing number is 3² = 9.",
          hi: "क्षेत्रफल अनुपात भुजा अनुपात का वर्ग: 2²:3² = 4:9. लुप्त संख्या 3² = 9.",
          mr: "क्षेत्रफळ प्रमाण बाजू प्रमाणाचा वर्ग: 2²:3² = 4:9. हरवलेली संख्या 3² = 9.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In a right triangle the two legs are 6 and 8. What is the length of the hypotenuse?",
          hi: "एक समकोण त्रिभुज की दो भुजाएँ 6 और 8 हैं। कर्ण की लंबाई क्या है?",
          mr: "एका काटकोन त्रिकोणाच्या दोन बाजू 6 आणि 8 आहेत. कर्णाची लांबी काय?",
        },
        answer: 10,
        wrong: [14, 48, 100],
        solution: {
          en: "By Pythagoras, hypotenuse = √(6² + 8²) = √(36 + 64) = √100 = 10. (100 is the value before the square root.)",
          hi: "पाइथागोरस से, कर्ण = √(6² + 8²) = √(36 + 64) = √100 = 10. (100 वर्गमूल से पहले का मान।)",
          mr: "पायथागोरसने, कर्ण = √(6² + 8²) = √(36 + 64) = √100 = 10. (100 वर्गमूळापूर्वीचे मूल्य.)",
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
          en: "Two similar triangles have areas 36 cm² and 100 cm². A side of the smaller is 9 cm. What is the matching side of the larger?",
          hi: "दो समरूप त्रिभुजों के क्षेत्रफल 36 सेमी² और 100 सेमी² हैं। छोटे की एक भुजा 9 सेमी है। बड़े की संगत भुजा क्या है?",
          mr: "दोन समरूप त्रिकोणांची क्षेत्रफळे 36 सेमी² आणि 100 सेमी² आहेत. लहानाची एक बाजू 9 सेमी. मोठ्याची संगत बाजू काय?",
        },
        answer: 15,
        wrong: [25, 18, 12],
        checkExpr: "9*10/6",
        solution: {
          en: "The ratio of sides is √(100/36) = 10/6. So the larger side = 9·(10/6) = 15 cm.",
          hi: "भुजाओं का अनुपात √(100/36) = 10/6. अतः बड़ी भुजा = 9·(10/6) = 15 सेमी।",
          mr: "बाजूंचे प्रमाण √(100/36) = 10/6. म्हणून मोठी बाजू = 9·(10/6) = 15 सेमी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In triangle ABC, DE ∥ BC with AD = 4, AB = 12 and DE = 5. What is BC?",
          hi: "त्रिभुज ABC में, DE ∥ BC, AD = 4, AB = 12 और DE = 5. BC क्या है?",
          mr: "त्रिकोण ABC मध्ये, DE ∥ BC, AD = 4, AB = 12 आणि DE = 5. BC काय?",
        },
        answer: 15,
        wrong: [5, 10, 20],
        checkExpr: "5*12/4",
        solution: {
          en: "Triangle ADE ~ ABC with ratio AD/AB = 4/12 = 1/3, so DE/BC = 1/3 and BC = 5·(12/4) = 15.",
          hi: "त्रिभुज ADE ~ ABC, अनुपात AD/AB = 4/12 = 1/3, अतः DE/BC = 1/3 और BC = 5·(12/4) = 15.",
          mr: "त्रिकोण ADE ~ ABC, प्रमाण AD/AB = 4/12 = 1/3, म्हणून DE/BC = 1/3 आणि BC = 5·(12/4) = 15.",
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
          en: "The perimeters of two similar triangles are 30 cm and 20 cm. If one side of the first is 12 cm, what is the corresponding side of the second?",
          hi: "दो समरूप त्रिभुजों के परिमाप 30 सेमी और 20 सेमी हैं। यदि पहले की एक भुजा 12 सेमी है, दूसरे की संगत भुजा क्या है?",
          mr: "दोन समरूप त्रिकोणांची परिमिती 30 सेमी आणि 20 सेमी आहे. पहिल्याची एक बाजू 12 सेमी असेल, दुसऱ्याची संगत बाजू काय?",
        },
        answer: 8,
        wrong: [18, 6, 10],
        checkExpr: "12*20/30",
        solution: {
          en: "The ratio of perimeters equals the ratio of corresponding sides, 20:30 = 2:3. So the side = 12·(20/30) = 8 cm.",
          hi: "परिमापों का अनुपात संगत भुजाओं के अनुपात के बराबर, 20:30 = 2:3. अतः भुजा = 12·(20/30) = 8 सेमी।",
          mr: "परिमितींचे प्रमाण संगत बाजूंच्या प्रमाणाइतके, 20:30 = 2:3. म्हणून बाजू = 12·(20/30) = 8 सेमी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A vertical pole 6 m tall casts a shadow 4 m long. At the same time, a tower casts a shadow 28 m long. What is the tower's height in metres?",
          hi: "एक 6 मी ऊँचा ऊर्ध्वाधर खंभा 4 मी लंबी छाया डालता है। उसी समय एक मीनार 28 मी लंबी छाया डालती है। मीनार की ऊँचाई मीटर में क्या है?",
          mr: "एक 6 मी उंच उभा खांब 4 मी लांब सावली टाकतो. त्याच वेळी एक मनोरा 28 मी लांब सावली टाकतो. मनोऱ्याची उंची मीटरमध्ये काय?",
        },
        answer: 42,
        wrong: [18, 21, 56],
        checkExpr: "6*28/4",
        solution: {
          en: "The pole and tower with their shadows form similar triangles, so height/shadow is the same: 6/4 = h/28, giving h = 6·28/4 = 42 m.",
          hi: "खंभा और मीनार अपनी छायाओं सहित समरूप त्रिभुज बनाते, अतः ऊँचाई/छाया समान: 6/4 = h/28, देता h = 6·28/4 = 42 मी।",
          mr: "खांब आणि मनोरा त्यांच्या सावल्यांसह समरूप त्रिकोण बनवतात, म्हणून उंची/सावली समान: 6/4 = h/28, देते h = 6·28/4 = 42 मी.",
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
          en: "In a right triangle, the altitude to the hypotenuse divides it into segments of length 4 and 9. What is the length of the altitude?",
          hi: "एक समकोण त्रिभुज में, कर्ण पर लंब उसे 4 और 9 लंबाई के खंडों में बाँटता है। लंब की लंबाई क्या है?",
          mr: "एका काटकोन त्रिकोणात, कर्णावरील लंब त्याला 4 आणि 9 लांबीच्या खंडांत विभागतो. लंबाची लांबी काय?",
        },
        answer: 6,
        wrong: [13, 36, 5],
        solution: {
          en: "The altitude to the hypotenuse is the geometric mean of the two segments: √(4·9) = √36 = 6. (13 is the hypotenuse 4+9, and 36 is the value before the root.)",
          hi: "कर्ण पर लंब दोनों खंडों का गुणोत्तर माध्य: √(4·9) = √36 = 6. (13 कर्ण 4+9, और 36 मूल से पहले।)",
          mr: "कर्णावरील लंब दोन्ही खंडांचा भूमितीय मध्य: √(4·9) = √36 = 6. (13 कर्ण 4+9, आणि 36 मूळापूर्वी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The areas of two similar triangles are in the ratio 9:16. Their perimeters are in ratio 3:▢. What is the missing number?",
          hi: "दो समरूप त्रिभुजों के क्षेत्रफल 9:16 अनुपात में हैं। उनके परिमाप 3:▢ में हैं। लुप्त संख्या क्या है?",
          mr: "दोन समरूप त्रिकोणांची क्षेत्रफळे 9:16 प्रमाणात आहेत. त्यांची परिमिती 3:▢ मध्ये. हरवलेली संख्या काय?",
        },
        answer: 4,
        wrong: [16, 9, 12],
        checkExpr: "16/4",
        solution: {
          en: "The ratio of perimeters is the square root of the area ratio: √(9:16) = 3:4. The missing number is √16 = 4.",
          hi: "परिमापों का अनुपात क्षेत्रफल अनुपात का वर्गमूल: √(9:16) = 3:4. लुप्त संख्या √16 = 4.",
          mr: "परिमितींचे प्रमाण क्षेत्रफळ प्रमाणाचे वर्गमूळ: √(9:16) = 3:4. हरवलेली संख्या √16 = 4.",
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
          en: "Triangle ABC is right-angled at B with AB = 9 and BC = 12, so AC = 15. An altitude BD is drawn from B to the hypotenuse AC. What is the length of BD?",
          hi: "त्रिभुज ABC, B पर समकोण, AB = 9 और BC = 12, अतः AC = 15. B से कर्ण AC पर लंब BD खींचा जाता है। BD की लंबाई क्या है?",
          mr: "त्रिकोण ABC, B ला काटकोन, AB = 9 आणि BC = 12, म्हणून AC = 15. B पासून कर्ण AC वर लंब BD काढला. BD ची लांबी काय?",
        },
        answer: 7.2,
        wrong: [6, 10.8, 7.5],
        checkExpr: "9*12/15",
        solution: {
          en: "The area equals ½·AB·BC and also ½·AC·BD, so ½·9·12 = ½·15·BD, giving BD = 9·12/15 = 108/15 = 7.2.",
          hi: "क्षेत्रफल ½·AB·BC और ½·AC·BD भी, अतः ½·9·12 = ½·15·BD, देता BD = 9·12/15 = 108/15 = 7.2.",
          mr: "क्षेत्रफळ ½·AB·BC आणि ½·AC·BD ही, म्हणून ½·9·12 = ½·15·BD, देते BD = 9·12/15 = 108/15 = 7.2.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Two poles of heights 6 m and 11 m stand on level ground 12 m apart. What is the distance between their tops in metres?",
          hi: "6 मी और 11 मी ऊँचाई के दो खंभे समतल भूमि पर 12 मी दूर खड़े हैं। उनके शीर्षों के बीच की दूरी मीटर में क्या है?",
          mr: "6 मी आणि 11 मी उंचीचे दोन खांब सपाट जमिनीवर 12 मी अंतरावर उभे. त्यांच्या टोकांतील अंतर मीटरमध्ये काय?",
        },
        answer: 13,
        wrong: [17, 5, 12],
        solution: {
          en: "The tops differ in height by 11 − 6 = 5 m and are 12 m apart horizontally. The line joining them is the hypotenuse: √(12² + 5²) = √(144 + 25) = √169 = 13 m.",
          hi: "शीर्ष ऊँचाई में 11 − 6 = 5 मी भिन्न और क्षैतिज 12 मी दूर। उन्हें जोड़ती रेखा कर्ण: √(12² + 5²) = √(144 + 25) = √169 = 13 मी।",
          mr: "टोके उंचीत 11 − 6 = 5 मी वेगळी आणि आडवी 12 मी दूर. त्यांना जोडणारी रेषा कर्ण: √(12² + 5²) = √(144 + 25) = √169 = 13 मी.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-triangles",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 7 — Triangles",
      name: "Triangles",
      summary:
        "Same shape, different size: the AA criterion, the Basic Proportionality Theorem slicing sides in proportion, areas scaling as the square of sides, and Pythagoras with its altitude-on-hypotenuse corollaries.",
      position: 7,
      translations: {
        hi: {
          name: "त्रिभुज",
          summary:
            "एक ही आकार, भिन्न माप: AA कसौटी, भुजाओं को समानुपात में काटता आधारभूत समानुपात प्रमेय, भुजाओं के वर्ग-सा बढ़ता क्षेत्रफल, और पाइथागोरस अपने कर्ण-लंब उपप्रमेयों सहित।",
        },
        mr: {
          name: "त्रिकोण",
          summary:
            "एकच आकार, वेगळे माप: AA निकष, बाजूंना प्रमाणात कापणारे आधारभूत प्रमाण प्रमेय, बाजूंच्या वर्गासारखे वाढणारे क्षेत्रफळ, आणि पायथागोरस त्याच्या कर्ण-लंब उपप्रमेयांसह.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Introduction to Trigonometry                                  */
/* ------------------------------------------------------------------------- */
function introTrigonometry(): TopicFileOut {
  const rand = rng("maths-10-introduction-trigonometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "In a right triangle, sin θ = opposite/hypotenuse. If the opposite side is 3 and the hypotenuse is 5, what is sin θ as a decimal?",
          hi: "एक समकोण त्रिभुज में, sin θ = सम्मुख/कर्ण। यदि सम्मुख भुजा 3 और कर्ण 5 है, sin θ दशमलव में क्या है?",
          mr: "एका काटकोन त्रिकोणात, sin θ = समोरची/कर्ण. समोरची बाजू 3 आणि कर्ण 5 असेल, sin θ दशांशात काय?",
        },
        answer: 0.6,
        wrong: [0.8, 1.6, 0.75],
        checkExpr: "3/5",
        solution: {
          en: "sin θ = opposite/hypotenuse = 3/5 = 0.6. (0.8 would be the cosine, using the adjacent side 4.)",
          hi: "sin θ = सम्मुख/कर्ण = 3/5 = 0.6. (0.8 कोसाइन होता, संलग्न भुजा 4 से।)",
          mr: "sin θ = समोरची/कर्ण = 3/5 = 0.6. (0.8 कोसाइन असते, संलग्न बाजू 4 ने.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "cos θ = adjacent/hypotenuse. If the adjacent side is 4 and the hypotenuse is 5, what is cos θ as a decimal?",
          hi: "cos θ = संलग्न/कर्ण। यदि संलग्न भुजा 4 और कर्ण 5 है, cos θ दशमलव में क्या है?",
          mr: "cos θ = संलग्न/कर्ण. संलग्न बाजू 4 आणि कर्ण 5 असेल, cos θ दशांशात काय?",
        },
        answer: 0.8,
        wrong: [0.6, 1.25, 0.75],
        checkExpr: "4/5",
        solution: {
          en: "cos θ = adjacent/hypotenuse = 4/5 = 0.8. (0.6 would be the sine, using the opposite side 3.)",
          hi: "cos θ = संलग्न/कर्ण = 4/5 = 0.8. (0.6 साइन होता, सम्मुख भुजा 3 से।)",
          mr: "cos θ = संलग्न/कर्ण = 4/5 = 0.8. (0.6 साइन असते, समोरची बाजू 3 ने.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "tan θ = opposite/adjacent. If the opposite side is 3 and the adjacent side is 4, what is tan θ as a decimal?",
          hi: "tan θ = सम्मुख/संलग्न। यदि सम्मुख भुजा 3 और संलग्न भुजा 4 है, tan θ दशमलव में क्या है?",
          mr: "tan θ = समोरची/संलग्न. समोरची बाजू 3 आणि संलग्न बाजू 4 असेल, tan θ दशांशात काय?",
        },
        answer: 0.75,
        wrong: [1.333, 0.6, 0.8],
        checkExpr: "3/4",
        solution: {
          en: "tan θ = opposite/adjacent = 3/4 = 0.75. (1.333 would be adjacent/opposite, i.e. cot θ.)",
          hi: "tan θ = सम्मुख/संलग्न = 3/4 = 0.75. (1.333 संलग्न/सम्मुख यानी cot θ होता।)",
          mr: "tan θ = समोरची/संलग्न = 3/4 = 0.75. (1.333 संलग्न/समोरची म्हणजे cot θ असते.)",
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
          en: "Evaluate 2 sin 30°. (Recall sin 30° = 1/2.)",
          hi: "2 sin 30° का मान ज्ञात कीजिए। (याद रखें sin 30° = 1/2।)",
          mr: "2 sin 30° चे मूल्य काढा. (लक्षात ठेवा sin 30° = 1/2.)",
        },
        answer: 1,
        wrong: [0.5, 2, 0.25],
        checkExpr: "2*(1/2)",
        solution: {
          en: "2 sin 30° = 2·(1/2) = 1.",
          hi: "2 sin 30° = 2·(1/2) = 1.",
          mr: "2 sin 30° = 2·(1/2) = 1.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Evaluate sin 30° × cos 60°. (Both equal 1/2.)",
          hi: "sin 30° × cos 60° का मान ज्ञात कीजिए। (दोनों 1/2 के बराबर।)",
          mr: "sin 30° × cos 60° चे मूल्य काढा. (दोन्ही 1/2 इतके.)",
        },
        answer: 0.25,
        wrong: [1, 0.5, 0.75],
        checkExpr: "(1/2)*(1/2)",
        solution: {
          en: "sin 30° × cos 60° = (1/2)·(1/2) = 1/4 = 0.25.",
          hi: "sin 30° × cos 60° = (1/2)·(1/2) = 1/4 = 0.25.",
          mr: "sin 30° × cos 60° = (1/2)·(1/2) = 1/4 = 0.25.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of cos 0°?",
          hi: "cos 0° का मान क्या है?",
          mr: "cos 0° चे मूल्य काय?",
        },
        answer: 1,
        wrong: [0, 0.5, -1],
        solution: {
          en: "cos 0° = 1 — at zero angle the adjacent side coincides with the hypotenuse. (sin 0° = 0, by contrast.)",
          hi: "cos 0° = 1 — शून्य कोण पर संलग्न भुजा कर्ण से मिल जाती। (इसके विपरीत sin 0° = 0।)",
          mr: "cos 0° = 1 — शून्य कोनावर संलग्न बाजू कर्णाशी मिळते. (याउलट sin 0° = 0.)",
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
          en: "In a right triangle tan θ = 3/4 (a 3-4-5 triangle). What is cos θ as a decimal?",
          hi: "एक समकोण त्रिभुज में tan θ = 3/4 (एक 3-4-5 त्रिभुज)। cos θ दशमलव में क्या है?",
          mr: "एका काटकोन त्रिकोणात tan θ = 3/4 (एक 3-4-5 त्रिकोण). cos θ दशांशात काय?",
        },
        answer: 0.8,
        wrong: [0.6, 0.75, 0.64],
        checkExpr: "4/5",
        solution: {
          en: "tan θ = 3/4 means opposite 3, adjacent 4, so hypotenuse √(9+16) = 5. Then cos θ = adjacent/hypotenuse = 4/5 = 0.8.",
          hi: "tan θ = 3/4 यानी सम्मुख 3, संलग्न 4, अतः कर्ण √(9+16) = 5. तब cos θ = संलग्न/कर्ण = 4/5 = 0.8.",
          mr: "tan θ = 3/4 म्हणजे समोरची 3, संलग्न 4, म्हणून कर्ण √(9+16) = 5. मग cos θ = संलग्न/कर्ण = 4/5 = 0.8.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Evaluate 4 sin² 30°. (Recall sin 30° = 1/2.)",
          hi: "4 sin² 30° का मान ज्ञात कीजिए। (याद रखें sin 30° = 1/2।)",
          mr: "4 sin² 30° चे मूल्य काढा. (लक्षात ठेवा sin 30° = 1/2.)",
        },
        answer: 1,
        wrong: [0.25, 2, 0.5],
        checkExpr: "4*(1/4)",
        solution: {
          en: "sin 30° = 1/2, so sin² 30° = 1/4, and 4·(1/4) = 1.",
          hi: "sin 30° = 1/2, अतः sin² 30° = 1/4, और 4·(1/4) = 1.",
          mr: "sin 30° = 1/2, म्हणून sin² 30° = 1/4, आणि 4·(1/4) = 1.",
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
          en: "If 5 tan θ = 4, what is tan θ as a decimal?",
          hi: "यदि 5 tan θ = 4, tan θ दशमलव में क्या है?",
          mr: "5 tan θ = 4 असेल, tan θ दशांशात काय?",
        },
        answer: 0.8,
        wrong: [1.25, 0.2, 0.64],
        checkExpr: "4/5",
        solution: {
          en: "Dividing both sides by 5, tan θ = 4/5 = 0.8. (1.25 would be its reciprocal, cot θ.)",
          hi: "दोनों ओर 5 से भाग देने पर tan θ = 4/5 = 0.8. (1.25 इसका व्युत्क्रम cot θ होता।)",
          mr: "दोन्ही बाजूंना 5 ने भागल्यावर tan θ = 4/5 = 0.8. (1.25 त्याचा व्यस्त cot θ असते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Evaluate (1 − tan² 45°)/(1 + tan² 45°). (Recall tan 45° = 1.)",
          hi: "(1 − tan² 45°)/(1 + tan² 45°) का मान ज्ञात कीजिए। (याद रखें tan 45° = 1।)",
          mr: "(1 − tan² 45°)/(1 + tan² 45°) चे मूल्य काढा. (लक्षात ठेवा tan 45° = 1.)",
        },
        answer: 0,
        wrong: [1, 0.5, -1],
        checkExpr: "(1-1)/(1+1)",
        solution: {
          en: "With tan 45° = 1: (1 − 1)/(1 + 1) = 0/2 = 0. (This expression in fact equals cos 90°, which is 0.)",
          hi: "tan 45° = 1 से: (1 − 1)/(1 + 1) = 0/2 = 0. (यह व्यंजक वास्तव में cos 90° के बराबर, जो 0।)",
          mr: "tan 45° = 1 ने: (1 − 1)/(1 + 1) = 0/2 = 0. (हे व्यंजक खरे तर cos 90° इतके, जे 0.)",
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
          en: "In a 3-4-5 right triangle, for the angle opposite the side of length 3, what is sin θ + cos θ as a decimal?",
          hi: "एक 3-4-5 समकोण त्रिभुज में, लंबाई 3 वाली भुजा के सम्मुख कोण के लिए, sin θ + cos θ दशमलव में क्या है?",
          mr: "एका 3-4-5 काटकोन त्रिकोणात, लांबी 3 च्या बाजूसमोरच्या कोनासाठी, sin θ + cos θ दशांशात काय?",
        },
        answer: 1.4,
        wrong: [1, 0.6, 0.8],
        checkExpr: "3/5+4/5",
        solution: {
          en: "For that angle, sin θ = 3/5 and cos θ = 4/5, so sin θ + cos θ = 3/5 + 4/5 = 7/5 = 1.4.",
          hi: "उस कोण के लिए sin θ = 3/5 और cos θ = 4/5, अतः sin θ + cos θ = 3/5 + 4/5 = 7/5 = 1.4.",
          mr: "त्या कोनासाठी sin θ = 3/5 आणि cos θ = 4/5, म्हणून sin θ + cos θ = 3/5 + 4/5 = 7/5 = 1.4.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "If sin θ = 0.6 (from a 3-4-5 triangle), what is tan θ as a decimal?",
          hi: "यदि sin θ = 0.6 (एक 3-4-5 त्रिभुज से), tan θ दशमलव में क्या है?",
          mr: "sin θ = 0.6 असेल (एका 3-4-5 त्रिकोणातून), tan θ दशांशात काय?",
        },
        answer: 0.75,
        wrong: [0.6, 0.8, 1.333],
        checkExpr: "3/4",
        solution: {
          en: "sin θ = 0.6 = 3/5, so opposite 3, hypotenuse 5, adjacent 4. Then tan θ = opposite/adjacent = 3/4 = 0.75.",
          hi: "sin θ = 0.6 = 3/5, अतः सम्मुख 3, कर्ण 5, संलग्न 4. तब tan θ = सम्मुख/संलग्न = 3/4 = 0.75.",
          mr: "sin θ = 0.6 = 3/5, म्हणून समोरची 3, कर्ण 5, संलग्न 4. मग tan θ = समोरची/संलग्न = 3/4 = 0.75.",
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
          en: "Evaluate 2 tan² 45° + cos² 30° − sin² 30°. (Use tan 45° = 1, cos² 30° = 3/4, sin² 30° = 1/4.)",
          hi: "2 tan² 45° + cos² 30° − sin² 30° का मान ज्ञात कीजिए। (tan 45° = 1, cos² 30° = 3/4, sin² 30° = 1/4।)",
          mr: "2 tan² 45° + cos² 30° − sin² 30° चे मूल्य काढा. (tan 45° = 1, cos² 30° = 3/4, sin² 30° = 1/4.)",
        },
        answer: 2.5,
        wrong: [2, 3, 1.5],
        checkExpr: "2+3/4-1/4",
        solution: {
          en: "2 tan² 45° = 2·1 = 2; cos² 30° = 3/4; sin² 30° = 1/4. So 2 + 3/4 − 1/4 = 2 + 1/2 = 2.5.",
          hi: "2 tan² 45° = 2·1 = 2; cos² 30° = 3/4; sin² 30° = 1/4. अतः 2 + 3/4 − 1/4 = 2 + 1/2 = 2.5.",
          mr: "2 tan² 45° = 2·1 = 2; cos² 30° = 3/4; sin² 30° = 1/4. म्हणून 2 + 3/4 − 1/4 = 2 + 1/2 = 2.5.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "If tan θ + cot θ = 2, what is tan θ?",
          hi: "यदि tan θ + cot θ = 2, tan θ क्या है?",
          mr: "tan θ + cot θ = 2 असेल, tan θ काय?",
        },
        answer: 1,
        wrong: [2, 0.5, 0],
        solution: {
          en: "Writing cot θ = 1/tan θ: tan θ + 1/tan θ = 2 becomes tan²θ − 2 tan θ + 1 = 0 = (tan θ − 1)², so tan θ = 1 (i.e. θ = 45°).",
          hi: "cot θ = 1/tan θ लिखने पर: tan θ + 1/tan θ = 2 बनता tan²θ − 2 tan θ + 1 = 0 = (tan θ − 1)², अतः tan θ = 1 (यानी θ = 45°)।",
          mr: "cot θ = 1/tan θ लिहिल्यावर: tan θ + 1/tan θ = 2 होते tan²θ − 2 tan θ + 1 = 0 = (tan θ − 1)², म्हणून tan θ = 1 (म्हणजे θ = 45°).",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-introduction-trigonometry",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 8 — Introduction to Trigonometry",
      name: "Introduction to Trigonometry",
      summary:
        "A right triangle's sides read as ratios: sine, cosine and tangent, the exact values at 0°, 30°, 45°, 60° and 90°, and the identity sin²θ + cos²θ = 1 tying them together.",
      position: 8,
      translations: {
        hi: {
          name: "त्रिकोणमिति का परिचय",
          summary:
            "समकोण त्रिभुज की भुजाएँ अनुपातों में पढ़ी: साइन, कोसाइन और टैंजेंट, 0°, 30°, 45°, 60° और 90° के सटीक मान, और उन्हें बाँधता सर्वसमिका sin²θ + cos²θ = 1।",
        },
        mr: {
          name: "त्रिकोणमितीचा परिचय",
          summary:
            "काटकोन त्रिकोणाच्या बाजू गुणोत्तरांत वाचल्या: साइन, कोसाइन आणि टॅंजंट, 0°, 30°, 45°, 60° आणि 90° ची अचूक मूल्ये, आणि त्यांना बांधणारी नित्यसमीकरण sin²θ + cos²θ = 1.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Some Applications of Trigonometry (heights and distances)     */
/* ------------------------------------------------------------------------- */
function applicationsTrigonometry(): TopicFileOut {
  const rand = rng("maths-10-applications-trigonometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The angle of elevation of the top of a tower from a point 20 m from its base is 45°. What is the height of the tower in metres?",
          hi: "एक मीनार के आधार से 20 मी दूर बिंदु से उसके शीर्ष का उन्नयन कोण 45° है। मीनार की ऊँचाई मीटर में क्या है?",
          mr: "एका मनोऱ्याच्या पायथ्यापासून 20 मी दूर बिंदूवरून त्याच्या टोकाचा उन्नयन कोन 45° आहे. मनोऱ्याची उंची मीटरमध्ये काय?",
        },
        answer: 20,
        wrong: [40, 10, 28],
        checkExpr: "20*1",
        solution: {
          en: "height = distance × tan 45° = 20 × 1 = 20 m (since tan 45° = 1).",
          hi: "ऊँचाई = दूरी × tan 45° = 20 × 1 = 20 मी (क्योंकि tan 45° = 1)।",
          mr: "उंची = अंतर × tan 45° = 20 × 1 = 20 मी (कारण tan 45° = 1).",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "From the top of a 50 m tower, the angle of depression of a car on the ground is 45°. How far is the car from the base in metres?",
          hi: "एक 50 मी मीनार के शीर्ष से ज़मीन पर खड़ी कार का अवनमन कोण 45° है। कार आधार से कितनी दूर मीटर में है?",
          mr: "एका 50 मी मनोऱ्याच्या टोकावरून जमिनीवरील मोटारीचा अवनमन कोन 45° आहे. मोटार पायथ्यापासून किती दूर मीटरमध्ये?",
        },
        answer: 50,
        wrong: [100, 25, 71],
        checkExpr: "50/1",
        solution: {
          en: "distance = height / tan 45° = 50 / 1 = 50 m (the angle of depression equals the angle of elevation from the car).",
          hi: "दूरी = ऊँचाई / tan 45° = 50 / 1 = 50 मी (अवनमन कोण कार से उन्नयन कोण के बराबर)।",
          mr: "अंतर = उंची / tan 45° = 50 / 1 = 50 मी (अवनमन कोन मोटारीवरून उन्नयन कोनाइतका).",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A ladder makes a 60° angle with the ground, and its foot is 3 m from the wall. What is the length of the ladder in metres?",
          hi: "एक सीढ़ी ज़मीन से 60° कोण बनाती है, और उसका पाद दीवार से 3 मी दूर है। सीढ़ी की लंबाई मीटर में क्या है?",
          mr: "एक शिडी जमिनीशी 60° कोन करते, आणि तिचा पाय भिंतीपासून 3 मी दूर आहे. शिडीची लांबी मीटरमध्ये काय?",
        },
        answer: 6,
        wrong: [1.5, 3, 12],
        checkExpr: "3/0.5",
        solution: {
          en: "The foot distance is the adjacent side, so cos 60° = 3/ladder, giving ladder = 3 / cos 60° = 3 / 0.5 = 6 m.",
          hi: "पाद-दूरी संलग्न भुजा, अतः cos 60° = 3/सीढ़ी, देता सीढ़ी = 3 / cos 60° = 3 / 0.5 = 6 मी।",
          mr: "पाय-अंतर संलग्न बाजू, म्हणून cos 60° = 3/शिडी, देते शिडी = 3 / cos 60° = 3 / 0.5 = 6 मी.",
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
          en: "A tree casts a shadow 10 m long when the sun's angle of elevation is 45°. What is the height of the tree in metres?",
          hi: "जब सूर्य का उन्नयन कोण 45° हो, एक पेड़ 10 मी लंबी छाया डालता है। पेड़ की ऊँचाई मीटर में क्या है?",
          mr: "सूर्याचा उन्नयन कोन 45° असताना एक झाड 10 मी लांब सावली टाकते. झाडाची उंची मीटरमध्ये काय?",
        },
        answer: 10,
        wrong: [20, 5, 14],
        checkExpr: "10*1",
        solution: {
          en: "height = shadow × tan 45° = 10 × 1 = 10 m.",
          hi: "ऊँचाई = छाया × tan 45° = 10 × 1 = 10 मी।",
          mr: "उंची = सावली × tan 45° = 10 × 1 = 10 मी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A kite is flying on a straight string 100 m long, at an angle of elevation of 30°. What is the kite's height above the ground in metres?",
          hi: "एक पतंग 100 मी लंबी सीधी डोर पर 30° उन्नयन कोण पर उड़ रही है। पतंग की ज़मीन से ऊँचाई मीटर में क्या है?",
          mr: "एक पतंग 100 मी लांब सरळ दोरीवर 30° उन्नयन कोनावर उडत आहे. पतंगाची जमिनीपासून उंची मीटरमध्ये काय?",
        },
        answer: 50,
        wrong: [100, 86.6, 25],
        checkExpr: "100*(1/2)",
        solution: {
          en: "The string is the hypotenuse, so height = string × sin 30° = 100 × (1/2) = 50 m.",
          hi: "डोर कर्ण, अतः ऊँचाई = डोर × sin 30° = 100 × (1/2) = 50 मी।",
          mr: "दोरी कर्ण, म्हणून उंची = दोरी × sin 30° = 100 × (1/2) = 50 मी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The angle of elevation of the top of a 15 m pole from a point on the ground is 45°. How far is the point from the base in metres?",
          hi: "ज़मीन पर एक बिंदु से 15 मी खंभे के शीर्ष का उन्नयन कोण 45° है। बिंदु आधार से कितनी दूर मीटर में है?",
          mr: "जमिनीवरील एका बिंदूवरून 15 मी खांबाच्या टोकाचा उन्नयन कोन 45° आहे. बिंदू पायथ्यापासून किती दूर मीटरमध्ये?",
        },
        answer: 15,
        wrong: [30, 7.5, 21],
        checkExpr: "15/1",
        solution: {
          en: "distance = height / tan 45° = 15 / 1 = 15 m.",
          hi: "दूरी = ऊँचाई / tan 45° = 15 / 1 = 15 मी।",
          mr: "अंतर = उंची / tan 45° = 15 / 1 = 15 मी.",
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
          en: "A ladder 10 m long leans against a wall, making a 30° angle with the ground. How high up the wall does it reach in metres?",
          hi: "एक 10 मी लंबी सीढ़ी दीवार से टिकी है, ज़मीन से 30° कोण बनाते हुए। यह दीवार पर कितना ऊँचा मीटर में पहुँचती है?",
          mr: "एक 10 मी लांब शिडी भिंतीला टेकली आहे, जमिनीशी 30° कोन करत. ती भिंतीवर किती उंच मीटरमध्ये पोहोचते?",
        },
        answer: 5,
        wrong: [8.66, 10, 2.5],
        checkExpr: "10*(1/2)",
        solution: {
          en: "height reached = ladder × sin 30° = 10 × (1/2) = 5 m.",
          hi: "पहुँची ऊँचाई = सीढ़ी × sin 30° = 10 × (1/2) = 5 मी।",
          mr: "पोहोचलेली उंची = शिडी × sin 30° = 10 × (1/2) = 5 मी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A 1.5 m tall observer stands 28.5 m from a tower. The angle of elevation of the top is 45°. What is the tower's height in metres?",
          hi: "एक 1.5 मी लंबा प्रेक्षक एक मीनार से 28.5 मी दूर खड़ा है। शीर्ष का उन्नयन कोण 45° है। मीनार की ऊँचाई मीटर में क्या है?",
          mr: "एक 1.5 मी उंच निरीक्षक एका मनोऱ्यापासून 28.5 मी दूर उभा आहे. टोकाचा उन्नयन कोन 45° आहे. मनोऱ्याची उंची मीटरमध्ये काय?",
        },
        answer: 30,
        wrong: [28.5, 31.5, 42.75],
        checkExpr: "1.5+28.5*1",
        solution: {
          en: "Above eye level the tower rises 28.5 × tan 45° = 28.5 m; adding the observer's 1.5 m gives 1.5 + 28.5 = 30 m.",
          hi: "आँख के स्तर से ऊपर मीनार 28.5 × tan 45° = 28.5 मी उठती; प्रेक्षक के 1.5 मी जोड़ने पर 1.5 + 28.5 = 30 मी।",
          mr: "डोळ्याच्या पातळीवर मनोरा 28.5 × tan 45° = 28.5 मी उठतो; निरीक्षकाचे 1.5 मी जोडल्यावर 1.5 + 28.5 = 30 मी.",
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
          en: "Two towers of equal height stand on either side of an 80 m wide road. From the midpoint of the road, the angle of elevation of each top is 45°. What is the height of each tower in metres?",
          hi: "समान ऊँचाई की दो मीनारें 80 मी चौड़ी सड़क के दोनों ओर खड़ी हैं। सड़क के मध्यबिंदु से प्रत्येक शीर्ष का उन्नयन कोण 45° है। प्रत्येक मीनार की ऊँचाई मीटर में क्या है?",
          mr: "समान उंचीचे दोन मनोरे 80 मी रुंद रस्त्याच्या दोन्ही बाजूंना उभे. रस्त्याच्या मध्यबिंदूवरून प्रत्येक टोकाचा उन्नयन कोन 45° आहे. प्रत्येक मनोऱ्याची उंची मीटरमध्ये काय?",
        },
        answer: 40,
        wrong: [80, 20, 56.6],
        checkExpr: "40*1",
        solution: {
          en: "The midpoint is 80/2 = 40 m from each base, so each height = 40 × tan 45° = 40 × 1 = 40 m.",
          hi: "मध्यबिंदु प्रत्येक आधार से 80/2 = 40 मी, अतः प्रत्येक ऊँचाई = 40 × tan 45° = 40 × 1 = 40 मी।",
          mr: "मध्यबिंदू प्रत्येक पायथ्यापासून 80/2 = 40 मी, म्हणून प्रत्येक उंची = 40 × tan 45° = 40 × 1 = 40 मी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "From a boy's eyes 1.5 m above the ground, a balloon's angle of elevation is 30° and its horizontal distance is 30√3 m. What is the balloon's height above the ground in metres?",
          hi: "एक लड़के की ज़मीन से 1.5 मी ऊपर आँखों से, एक ग़ुब्बारे का उन्नयन कोण 30° और क्षैतिज दूरी 30√3 मी है। ग़ुब्बारे की ज़मीन से ऊँचाई मीटर में क्या है?",
          mr: "एका मुलाच्या जमिनीपासून 1.5 मी वरच्या डोळ्यांवरून, एका फुग्याचा उन्नयन कोन 30° आणि आडवे अंतर 30√3 मी आहे. फुग्याची जमिनीपासून उंची मीटरमध्ये काय?",
        },
        answer: 31.5,
        wrong: [30, 33, 28.5],
        checkExpr: "30+1.5",
        solution: {
          en: "Above eye level the balloon is 30√3 × tan 30° = 30√3 × (1/√3) = 30 m; adding the 1.5 m eye height gives 30 + 1.5 = 31.5 m.",
          hi: "आँख के स्तर से ऊपर ग़ुब्बारा 30√3 × tan 30° = 30√3 × (1/√3) = 30 मी; 1.5 मी आँख-ऊँचाई जोड़ने पर 30 + 1.5 = 31.5 मी।",
          mr: "डोळ्याच्या पातळीवर फुगा 30√3 × tan 30° = 30√3 × (1/√3) = 30 मी; 1.5 मी डोळा-उंची जोडल्यावर 30 + 1.5 = 31.5 मी.",
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
          en: "From two points at distances 4 m and 9 m from the base of a tower, on the same side, the angles of elevation of the top are complementary. What is the height of the tower in metres?",
          hi: "एक मीनार के आधार से एक ही ओर 4 मी और 9 मी दूरी के दो बिंदुओं से, शीर्ष के उन्नयन कोण पूरक हैं। मीनार की ऊँचाई मीटर में क्या है?",
          mr: "एका मनोऱ्याच्या पायथ्यापासून एकाच बाजूला 4 मी आणि 9 मी अंतराच्या दोन बिंदूंवरून, टोकाचे उन्नयन कोन पूरक आहेत. मनोऱ्याची उंची मीटरमध्ये काय?",
        },
        answer: 6,
        wrong: [13, 36, 6.5],
        solution: {
          en: "For complementary angles the height is the geometric mean of the two distances: √(4·9) = √36 = 6 m.",
          hi: "पूरक कोणों के लिए ऊँचाई दोनों दूरियों का गुणोत्तर माध्य: √(4·9) = √36 = 6 मी।",
          mr: "पूरक कोनांसाठी उंची दोन्ही अंतरांचा भूमितीय मध्य: √(4·9) = √36 = 6 मी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "From a window 10 m above the ground, the angle of elevation of the top of a tower opposite is 45° and the angle of depression of its foot is 45°. What is the tower's height in metres?",
          hi: "ज़मीन से 10 मी ऊपर एक खिड़की से, सामने की मीनार के शीर्ष का उन्नयन कोण 45° और उसके पाद का अवनमन कोण 45° है। मीनार की ऊँचाई मीटर में क्या है?",
          mr: "जमिनीपासून 10 मी वरच्या एका खिडकीवरून, समोरच्या मनोऱ्याच्या टोकाचा उन्नयन कोन 45° आणि त्याच्या पायाचा अवनमन कोन 45° आहे. मनोऱ्याची उंची मीटरमध्ये काय?",
        },
        answer: 20,
        wrong: [10, 30, 14.1],
        checkExpr: "10+10",
        solution: {
          en: "The depression of the foot (45°) gives horizontal distance = 10 m. The elevation of the top (45°) then raises it 10 × tan 45° = 10 m above the window. Total height = 10 + 10 = 20 m.",
          hi: "पाद का अवनमन (45°) क्षैतिज दूरी = 10 मी देता। शीर्ष का उन्नयन (45°) खिड़की से 10 × tan 45° = 10 मी ऊपर उठाता। कुल ऊँचाई = 10 + 10 = 20 मी।",
          mr: "पायाचा अवनमन (45°) आडवे अंतर = 10 मी देतो. टोकाचा उन्नयन (45°) खिडकीपासून 10 × tan 45° = 10 मी वर उचलतो. एकूण उंची = 10 + 10 = 20 मी.",
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
          en: "Two ships are on opposite sides of a lighthouse 100 m tall, in a straight line with its base. The angle of depression to each is 45°. What is the distance between the two ships in metres?",
          hi: "दो जहाज़ एक 100 मी ऊँचे प्रकाश-स्तंभ के दोनों ओर, उसके आधार के साथ एक सीधी रेखा में हैं। प्रत्येक का अवनमन कोण 45° है। दोनों जहाज़ों के बीच की दूरी मीटर में क्या है?",
          mr: "दोन जहाजे एका 100 मी उंच दीपगृहाच्या दोन्ही बाजूंना, त्याच्या पायथ्याशी सरळ रेषेत आहेत. प्रत्येकाचा अवनमन कोन 45° आहे. दोन जहाजांतील अंतर मीटरमध्ये काय?",
        },
        answer: 200,
        wrong: [100, 141, 150],
        checkExpr: "100+100",
        solution: {
          en: "Each ship is at distance 100 / tan 45° = 100 m from the base, on opposite sides, so the distance between them is 100 + 100 = 200 m.",
          hi: "प्रत्येक जहाज़ आधार से 100 / tan 45° = 100 मी, विपरीत ओर, अतः उनके बीच की दूरी 100 + 100 = 200 मी।",
          mr: "प्रत्येक जहाज पायथ्यापासून 100 / tan 45° = 100 मी, विरुद्ध बाजूंना, म्हणून त्यांतील अंतर 100 + 100 = 200 मी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The angle of elevation of the top of a tower from a point on the ground is 30°. On walking 20 m towards the tower, the elevation becomes 60°. What is the distance of the first point from the base in metres?",
          hi: "ज़मीन पर एक बिंदु से एक मीनार के शीर्ष का उन्नयन कोण 30° है। मीनार की ओर 20 मी चलने पर उन्नयन 60° हो जाता है। पहले बिंदु की आधार से दूरी मीटर में क्या है?",
          mr: "जमिनीवरील एका बिंदूवरून एका मनोऱ्याच्या टोकाचा उन्नयन कोन 30° आहे. मनोऱ्याकडे 20 मी चालल्यावर उन्नयन 60° होतो. पहिल्या बिंदूचे पायथ्यापासून अंतर मीटरमध्ये काय?",
        },
        answer: 30,
        wrong: [20, 10, 40],
        checkExpr: "60/2",
        solution: {
          en: "Let the far distance be x. Height h = x tan 30° = x/√3 and also h = (x−20) tan 60° = (x−20)√3. Equating, x/√3 = (x−20)√3 gives x = 3(x−20), so 2x = 60 and x = 30 m.",
          hi: "दूर की दूरी x मानिए। ऊँचाई h = x tan 30° = x/√3 और h = (x−20) tan 60° = (x−20)√3 भी। बराबर करने पर x/√3 = (x−20)√3 देता x = 3(x−20), अतः 2x = 60 और x = 30 मी।",
          mr: "दूरचे अंतर x माना. उंची h = x tan 30° = x/√3 आणि h = (x−20) tan 60° = (x−20)√3 ही. समान केल्यावर x/√3 = (x−20)√3 देते x = 3(x−20), म्हणून 2x = 60 आणि x = 30 मी.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-10-applications-trigonometry",
      subject: "MATHS",
      classLevel: 10,
      chapter: "Chapter 9 — Some Applications of Trigonometry",
      name: "Some Applications of Trigonometry",
      summary:
        "Heights and distances measured without a tape: angles of elevation and depression turning a tower, a ladder, a kite or a ship into a right triangle solved by a single trigonometric ratio.",
      position: 9,
      translations: {
        hi: {
          name: "त्रिकोणमिति के कुछ अनुप्रयोग",
          summary:
            "बिना फ़ीते नापी ऊँचाइयाँ और दूरियाँ: उन्नयन और अवनमन कोण जो मीनार, सीढ़ी, पतंग या जहाज़ को एक त्रिकोणमितीय अनुपात से हल होते समकोण त्रिभुज में बदलते।",
        },
        mr: {
          name: "त्रिकोणमितीचे काही उपयोग",
          summary:
            "फितीविना मोजलेल्या उंची आणि अंतरे: उन्नयन आणि अवनमन कोन जे मनोरा, शिडी, पतंग किंवा जहाजाला एका त्रिकोणमितीय गुणोत्तराने सुटणाऱ्या काटकोन त्रिकोणात बदलतात.",
        },
      },
    },
    qs,
  );
}


export const G10_MATHS: TopicFileOut[] = [
  realNumbers(),
  polynomials10(),
  quadraticEquations(),
  pairLinear10(),
  arithmeticProgressions10(),
  coordinateGeometry10(),
  triangles10(),
  introTrigonometry(),
  applicationsTrigonometry(),
];
