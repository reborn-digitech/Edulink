/**
 * Class 6 Maths — NCERT, chapter by chapter. The numbers grow up here:
 * lakhs and crores, primes and HCFs, and the first step below zero. Same
 * discipline as the primary grades — every question authored individually,
 * every computable answer proven by a checkExpr, every wrong option a real
 * eleven-year-old's mistake.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 6)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Knowing Our Numbers (lakhs, crores, estimation)               */
/* ------------------------------------------------------------------------- */
function knowingOurNumbers(): TopicFileOut {
  const rand = rng("maths-6-knowing-our-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Write 'one lakh twenty thousand' in figures.",
          hi: "'एक लाख बीस हज़ार' को अंकों में लिखिए।",
          mr: "'एक लाख वीस हजार' अंकांत लिहा.",
        },
        answer: 120000,
        wrong: [12000, 102000, 1020000],
        checkExpr: "100000+20000",
        solution: {
          en: "One lakh is 1,00,000 and twenty thousand is 20,000: together 1,20,000. 1,02,000 puts the twenty in the thousands' ones; 12,000 loses the lakh entirely.",
          hi: "एक लाख यानी 1,00,000 और बीस हज़ार यानी 20,000: मिलाकर 1,20,000। 1,02,000 बीस को हज़ार की इकाई में रख देता है; 12,000 लाख ही खो बैठता है।",
          mr: "एक लाख म्हणजे 1,00,000 आणि वीस हजार म्हणजे 20,000: मिळून 1,20,000. 1,02,000 विसाला हजाराच्या एककात ठेवते; 12,000 लाखच गमावते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the greatest 4-digit number?",
          hi: "सबसे बड़ी 4-अंकीय संख्या कौन-सी है?",
          mr: "सर्वांत मोठी 4-अंकी संख्या कोणती?",
        },
        answer: 9999,
        wrong: [9990, 1000, 10000],
        solution: {
          en: "Fill every place with the biggest digit: 9999. 10000 has five digits — it is the very next number, standing just across the border.",
          hi: "हर स्थान पर सबसे बड़ा अंक भरिए: 9999। 10000 में पाँच अंक हैं — वह अगली ही संख्या है, सीमा के ठीक उस पार खड़ी।",
          mr: "प्रत्येक स्थानावर सर्वांत मोठा अंक भरा: 9999. 10000 मध्ये पाच अंक — ती लगेच पुढची संख्या, सीमेच्या नेमकी पलीकडे उभी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "One crore equals how many lakhs?",
          hi: "एक करोड़ में कितने लाख होते हैं?",
          mr: "एका कोटीत किती लाख असतात?",
        },
        answer: 100,
        wrong: [10, 1000, 50],
        checkExpr: "10000000/100000",
        solution: {
          en: "A crore is 1,00,00,000 and a lakh is 1,00,000: the crore holds 100 of them. 10 stops at ten lakhs — that is only a 'million', halfway up the Indian ladder.",
          hi: "करोड़ यानी 1,00,00,000 और लाख यानी 1,00,000: करोड़ में ऐसे 100 समाते हैं। 10 दस लाख पर रुक जाता है — वह भारतीय सीढ़ी का आधा ही है।",
          mr: "कोटी म्हणजे 1,00,00,000 आणि लाख म्हणजे 1,00,000: कोटीत असे 100 मावतात. 10 दहा लाखांवर थांबते — ती भारतीय शिडीची अर्धीच वाट.",
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
          en: "What is the successor of 99,999?",
          hi: "99,999 की परवर्ती (अगली) संख्या क्या है?",
          mr: "99,999 ची पुढील संख्या कोणती?",
        },
        answer: 100000,
        wrong: [99998, 100001, 999990],
        checkExpr: "99999+1",
        solution: {
          en: "Add one: 99,999 + 1 = 1,00,000 — every 9 rolls over and a lakh is born. 99,998 walks backwards to the predecessor.",
          hi: "एक जोड़िए: 99,999 + 1 = 1,00,000 — हर 9 पलटता है और लाख जन्म लेता है। 99,998 पीछे चलकर पूर्ववर्ती पर पहुँचता है।",
          mr: "एक मिळवा: 99,999 + 1 = 1,00,000 — प्रत्येक 9 उलटतो आणि लाख जन्मतो. 99,998 मागे जाऊन आधीच्या संख्येवर पोहोचते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The Roman numeral XL stands for which number?",
          hi: "रोमन अंक XL किस संख्या के लिए है?",
          mr: "XL हा रोमन अंक कोणत्या संख्येसाठी आहे?",
        },
        answer: 40,
        wrong: [60, 90, 15],
        solution: {
          en: "X before L means ten LESS than fifty: 40. Written LX it would be ten more — 60; the smaller symbol's side decides whether it adds or subtracts.",
          hi: "L से पहले X यानी पचास से दस कम: 40। LX लिखते तो दस ज़्यादा — 60; छोटे चिह्न की दिशा तय करती है कि वह जुड़ेगा या घटेगा।",
          mr: "L च्या आधी X म्हणजे पन्नासाहून दहा कमी: 40. LX लिहिले तर दहा जास्त — 60; लहान चिन्हाची बाजू ठरवते की ते मिळणार की वजा होणार.",
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
          en: "Estimate 486 + 219 by rounding each to the nearest hundred first.",
          hi: "486 + 219 का अनुमान लगाइए — पहले हर एक को निकटतम सौ तक पूर्णांकित करके।",
          mr: "486 + 219 चा अंदाज करा — आधी प्रत्येकाला जवळच्या शतकात पूर्णांकित करून.",
        },
        answer: 700,
        wrong: [705, 600, 800],
        checkExpr: "500+200",
        solution: {
          en: "486 rounds to 500 and 219 to 200: estimate 700 — close to the true 705, found in a breath. 705 is the exact sum; estimation trades that last precision for speed.",
          hi: "486 पूर्णांकित होकर 500 और 219 होकर 200: अनुमान 700 — सच्चे 705 के पास, एक साँस में मिला। 705 सटीक योग है; अनुमान वही आख़िरी बारीकी रफ़्तार से बदल लेता है।",
          mr: "486 पूर्णांकित होऊन 500 आणि 219 होऊन 200: अंदाज 700 — खऱ्या 705 च्या जवळ, एका दमात मिळालेला. 705 ही नेमकी बेरीज; अंदाज तीच शेवटची सूक्ष्मता वेगाच्या बदल्यात देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A town's census counted 68,724 people. Rounded to the nearest thousand, what is the population?",
          hi: "जनगणना में एक क़स्बे के 68,724 लोग गिने गए। निकटतम हज़ार तक पूर्णांकित जनसंख्या कितनी?",
          mr: "जनगणनेत एका गावाची 68,724 माणसे मोजली. जवळच्या हजारात पूर्णांकित लोकसंख्या किती?",
        },
        answer: 69000,
        wrong: [68000, 70000, 68700],
        checkExpr: "69*1000",
        solution: {
          en: "The hundreds digit is 7, so 68,724 rounds UP to 69,000. 68,000 rounds down against the rule; 68,700 rounds to the nearest hundred — a finer sieve than asked.",
          hi: "सैकड़े का अंक 7 है, तो 68,724 ऊपर 69,000 पर पूर्णांकित होता है। 68,000 नियम के विरुद्ध नीचे जाता है; 68,700 निकटतम सौ पर है — माँगे से महीन छलनी।",
          mr: "शतकाचा अंक 7 आहे, म्हणून 68,724 वर 69,000 वर पूर्णांकित होते. 68,000 नियमाविरुद्ध खाली जाते; 68,700 जवळच्या शतकावर — मागितल्याहून बारीक चाळणी.",
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
          en: "Using each of the digits 5, 0, 2, 8 exactly once, what is the difference between the greatest and the smallest 4-digit numbers you can make?",
          hi: "अंक 5, 0, 2, 8 हर एक ठीक एक बार लेकर, बनने वाली सबसे बड़ी और सबसे छोटी 4-अंकीय संख्याओं का अंतर क्या है?",
          mr: "5, 0, 2, 8 हे अंक प्रत्येकी नेमके एकदा घेऊन, होणाऱ्या सर्वांत मोठ्या आणि सर्वांत लहान 4-अंकी संख्यांचा फरक किती?",
        },
        answer: 6462,
        wrong: [6520, 8520, 6462 - 90],
        checkExpr: "8520-2058",
        solution: {
          en: "Greatest: digits descending — 8520. Smallest: ascending, but 0 cannot lead, so 2058. Difference: 8520 − 2058 = 6462. Writing 0258 as the smallest breaks the 4-digit rule — a number does not begin with nothing.",
          hi: "सबसे बड़ी: अंक उतरते क्रम में — 8520। सबसे छोटी: चढ़ते क्रम में, पर 0 आगे नहीं रह सकता, तो 2058। अंतर: 8520 − 2058 = 6462। 0258 को सबसे छोटी लिखना 4-अंक का नियम तोड़ता है — संख्या शून्य से शुरू नहीं होती।",
          mr: "सर्वांत मोठी: अंक उतरत्या क्रमाने — 8520. सर्वांत लहान: चढत्या क्रमाने, पण 0 पुढे राहू शकत नाही, म्हणून 2058. फरक: 8520 − 2058 = 6462. 0258 ला सर्वांत लहान लिहिणे 4-अंकी नियम मोडते — संख्या शून्याने सुरू होत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A factory turns out 2,825 screws every day. How many screws in 4 days?",
          hi: "एक कारख़ाना रोज़ 2,825 पेंच बनाता है। 4 दिनों में कितने पेंच?",
          mr: "एक कारखाना रोज 2,825 स्क्रू बनवतो. 4 दिवसांत किती स्क्रू?",
        },
        answer: 11300,
        wrong: [11200, 8475, 2829],
        checkExpr: "2825*4",
        solution: {
          en: "2825 × 4 = 2800 × 4 + 25 × 4 = 11,200 + 100 = 11,300. 11,200 drops the hundred from the 25s; 8475 multiplies by 3.",
          hi: "2825 × 4 = 2800 × 4 + 25 × 4 = 11,200 + 100 = 11,300। 11,200 पच्चीसों का सैकड़ा गिरा देता है; 8475 तीन से गुणा है।",
          mr: "2825 × 4 = 2800 × 4 + 25 × 4 = 11,200 + 100 = 11,300. 11,200 पंचविसांचे शतक पाडते; 8475 म्हणजे तीनने गुणणे.",
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
          en: "A long-route bus covers 285 km every day. How far does it run in a 30-day month?",
          hi: "लंबे रूट की बस रोज़ 285 किमी चलती है। 30 दिन के महीने में वह कितना चलती है?",
          mr: "लांब मार्गाची बस रोज 285 किमी धावते. 30 दिवसांच्या महिन्यात ती किती धावते?",
        },
        answer: 8550,
        wrong: [855, 8850, 315],
        checkExpr: "285*30",
        solution: {
          en: "285 × 30 = 285 × 3 tens = 855 tens = 8,550 km. 855 forgets the ten; 315 adds the days to the distance.",
          hi: "285 × 30 = 285 × 3 दहाई = 855 दहाई = 8,550 किमी। 855 दहाई भूल जाता है; 315 दिनों को दूरी में जोड़ देता है।",
          mr: "285 × 30 = 285 × 3 दशक = 855 दशक = 8,550 किमी. 855 दशक विसरते; 315 दिवस अंतरात मिळवते.",
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
          en: "A press prints 11,980 copies of a 12-page newspaper daily. How many PAGES does it print each day — and is that more or less than a lakh?",
          hi: "एक प्रेस रोज़ 12 पन्नों के अख़बार की 11,980 प्रतियाँ छापती है। वह रोज़ कितने पन्ने छापती है — और यह लाख से ज़्यादा है या कम?",
          mr: "एक छापखाना रोज 12 पानी वर्तमानपत्राच्या 11,980 प्रती छापतो. तो रोज किती पाने छापतो — आणि ते लाखाहून जास्त की कमी?",
        },
        answer: 143760,
        wrong: [14376, 131780, 11992],
        checkExpr: "12*11980",
        solution: {
          en: "12 × 11,980 = 12 × 12,000 − 12 × 20 = 1,44,000 − 240 = 1,43,760 pages — well past a lakh, every single day. 14,376 loses a zero; 11,992 adds the pages to the copies. Big numbers stop being scary once you build them from round ones.",
          hi: "12 × 11,980 = 12 × 12,000 − 12 × 20 = 1,44,000 − 240 = 1,43,760 पन्ने — लाख के ख़ूब पार, हर रोज़। 14,376 एक शून्य खोता है; 11,992 पन्नों को प्रतियों में जोड़ देता है। बड़ी संख्याएँ डरावनी नहीं रहतीं जब उन्हें गोल संख्याओं से गढ़ा जाए।",
          mr: "12 × 11,980 = 12 × 12,000 − 12 × 20 = 1,44,000 − 240 = 1,43,760 पाने — लाखाच्या खूप पलीकडे, दररोज. 14,376 एक शून्य गमावते; 11,992 पाने प्रतींत मिळवते. मोठ्या संख्या गोल संख्यांतून उभारल्या की भीतिदायक राहत नाहीत.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 1 — Knowing Our Numbers",
      name: "Knowing Our Numbers",
      slug: "maths-6-knowing-our-numbers",
      summary: "Lakhs and crores, successors and Roman numerals, digit-built extremes and estimates — numbers grown big and still obedient.",
      position: 1,
      translations: {
        hi: {
          name: "अपनी संख्याओं को जानना",
          summary: "लाख और करोड़, परवर्ती और रोमन अंक, अंकों से गढ़ी चरम संख्याएँ और अनुमान — बड़ी होकर भी आज्ञाकारी संख्याएँ।",
        },
        mr: {
          name: "आपल्या संख्या जाणून घेणे",
          summary: "लाख आणि कोटी, पुढील संख्या आणि रोमन अंक, अंकांतून घडवलेली टोके आणि अंदाज — मोठ्या होऊनही आज्ञाधारक संख्या.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Playing with Numbers (factors, primes, HCF and LCM)           */
/* ------------------------------------------------------------------------- */
function playingWithNumbers(): TopicFileOut {
  const rand = rng("maths-6-playing-with-numbers");
  const qs: OutQuestion[] = [];

  const m = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Which of these numbers is prime?",
          hi: "इनमें से कौन-सी संख्या अभाज्य है?",
          mr: "यांपैकी कोणती संख्या मूळ आहे?",
        },
        answer: 7,
        wrong: [9, 15, 21],
        solution: {
          en: "7 divides only by 1 and itself. The others all hide a 3: 9 = 3×3, 15 = 3×5, 21 = 3×7 — odd-looking numbers that are quietly composite.",
          hi: "7 केवल 1 और स्वयं से बँटता है। बाक़ी सबमें 3 छिपा है: 9 = 3×3, 15 = 3×5, 21 = 3×7 — देखने में विषम, चुपचाप भाज्य।",
          mr: "7 फक्त 1 आणि स्वतःनेच भागला जातो. बाकी साऱ्यांत 3 लपला आहे: 9 = 3×3, 15 = 3×5, 21 = 3×7 — दिसायला विषम, गुपचूप संयुक्त.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many factors does 12 have in all?",
          hi: "12 के कुल कितने गुणनखंड हैं?",
          mr: "12 चे एकूण किती अवयव आहेत?",
        },
        answer: 6,
        wrong: [4, 5, 12],
        solution: {
          en: "The factors are 1, 2, 3, 4, 6, 12 — six of them, in the pairs 1×12, 2×6, 3×4. Counts fall short when 1 and the number itself are forgotten.",
          hi: "गुणनखंड हैं 1, 2, 3, 4, 6, 12 — छह, जोड़ों 1×12, 2×6, 3×4 में। 1 और स्वयं संख्या भूलने पर गिनती घट जाती है।",
          mr: "अवयव आहेत 1, 2, 3, 4, 6, 12 — सहा, 1×12, 2×6, 3×4 या जोड्यांत. 1 आणि स्वतः संख्या विसरल्यास मोजणी कमी भरते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the smallest prime number?",
          hi: "सबसे छोटी अभाज्य संख्या कौन-सी है?",
          mr: "सर्वांत लहान मूळ संख्या कोणती?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        solution: {
          en: "2 is the smallest prime — and the only even one. 1 is not prime at all: a prime needs exactly two different factors, and 1 has only itself.",
          hi: "2 सबसे छोटी अभाज्य है — और इकलौती सम भी। 1 अभाज्य है ही नहीं: अभाज्य को ठीक दो अलग गुणनखंड चाहिए, और 1 के पास केवल वह स्वयं है।",
          mr: "2 ही सर्वांत लहान मूळ संख्या — आणि एकमेव समही. 1 मूळ नाहीच: मूळ संख्येला नेमके दोन वेगळे अवयव हवेत, आणि 1 कडे फक्त ती स्वतःच आहे.",
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
          en: "Which of these numbers is divisible by 5?",
          hi: "इनमें से कौन-सी संख्या 5 से विभाज्य है?",
          mr: "यांपैकी कोणती संख्या 5 ने विभाज्य आहे?",
        },
        answer: 85,
        wrong: [73, 92, 66],
        checkExpr: "5*17",
        solution: {
          en: "A multiple of 5 must end in 0 or 5 — only 85 does: 85 = 5 × 17. The last digit alone settles divisibility by 5, no dividing needed.",
          hi: "5 का गुणज 0 या 5 पर ख़त्म होना चाहिए — केवल 85 होता है: 85 = 5 × 17। 5 की विभाज्यता अकेला आख़िरी अंक तय कर देता है, भाग देने की ज़रूरत नहीं।",
          mr: "5 चा पट 0 वा 5 वर संपायला हवा — फक्त 85 संपतो: 85 = 5 × 17. 5 ची विभाज्यता एकटा शेवटचा अंक ठरवतो, भागण्याची गरज नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "6 is called a PERFECT number: add its factors 1, 2 and 3 (all except itself). What do they make?",
          hi: "6 को पूर्ण संख्या कहते हैं: उसके गुणनखंड 1, 2 और 3 (स्वयं को छोड़) जोड़िए। योग क्या बनता है?",
          mr: "6 ला परिपूर्ण संख्या म्हणतात: तिचे अवयव 1, 2 आणि 3 (स्वतःखेरीज) मिळवा. बेरीज किती होते?",
        },
        answer: 6,
        wrong: [5, 7, 12],
        checkExpr: "1+2+3",
        solution: {
          en: "1 + 2 + 3 = 6 — the number rebuilt exactly from its own parts, which is what 'perfect' means here. The next such number is 28 = 1+2+4+7+14.",
          hi: "1 + 2 + 3 = 6 — संख्या अपने ही हिस्सों से ठीक-ठीक फिर बनी; यही यहाँ 'पूर्ण' का अर्थ है। अगली ऐसी संख्या 28 = 1+2+4+7+14 है।",
          mr: "1 + 2 + 3 = 6 — संख्या स्वतःच्याच भागांतून नेमकी पुन्हा उभी; इथे 'परिपूर्ण'चा अर्थ हाच. पुढची अशी संख्या 28 = 1+2+4+7+14.",
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
          en: "What is the HCF (highest common factor) of 18 and 24?",
          hi: "18 और 24 का म.स. (महत्तम समापवर्तक) क्या है?",
          mr: "18 आणि 24 चा म.सा.वि. (महत्तम सामाईक विभाजक) किती?",
        },
        answer: 6,
        wrong: [2, 3, 72],
        checkExpr: "18/3",
        solution: {
          en: "18 = 6 × 3 and 24 = 6 × 4 — 6 divides both and nothing larger does. 2 and 3 are common factors too, but not the highest; 72 is their LCM, the other end of the friendship.",
          hi: "18 = 6 × 3 और 24 = 6 × 4 — 6 दोनों को बाँटता है और उससे बड़ा कोई नहीं। 2 और 3 भी समापवर्तक हैं, पर महत्तम नहीं; 72 उनका ल.स. है — दोस्ती का दूसरा सिरा।",
          mr: "18 = 6 × 3 आणि 24 = 6 × 4 — 6 दोघांना भागतो आणि त्याहून मोठा कोणी नाही. 2 आणि 3 हेही सामाईक विभाजक, पण महत्तम नव्हे; 72 हा त्यांचा ल.सा.वि. — मैत्रीचे दुसरे टोक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the LCM (lowest common multiple) of 6 and 9?",
          hi: "6 और 9 का ल.स. (लघुत्तम समापवर्त्य) क्या है?",
          mr: "6 आणि 9 चा ल.सा.वि. (लघुतम सामाईक पट) किती?",
        },
        answer: 18,
        wrong: [54, 3, 36],
        checkExpr: "6*3",
        solution: {
          en: "Sixes: 6, 12, 18…; nines: 9, 18… — they first meet at 18. 54 = 6 × 9 is a common multiple but a wasteful one; 3 is their HCF, the opposite question.",
          hi: "छह: 6, 12, 18…; नौ: 9, 18… — पहली मुलाक़ात 18 पर। 54 = 6 × 9 भी समापवर्त्य है पर फ़िज़ूल बड़ा; 3 उनका म.स. है — उलटा सवाल।",
          mr: "सहा: 6, 12, 18…; नऊ: 9, 18… — पहिली भेट 18 वर. 54 = 6 × 9 हाही सामाईक पट पण उधळा; 3 हा त्यांचा म.सा.वि. — उलटा प्रश्न.",
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
          en: "To test whether 234 is divisible by 3, add its digits. What is the digit sum?",
          hi: "234 की 3 से विभाज्यता जाँचने के लिए उसके अंक जोड़िए। अंक-योग क्या है?",
          mr: "234 ची 3 ने विभाज्यता तपासायला तिचे अंक मिळवा. अंक-बेरीज किती?",
        },
        answer: 9,
        wrong: [234, 6, 12],
        checkExpr: "2+3+4",
        solution: {
          en: "2 + 3 + 4 = 9, and 9 divides by 3 — so 234 does too (234 = 3 × 78). The digit-sum test even shows 234 is divisible by 9 itself.",
          hi: "2 + 3 + 4 = 9, और 9 तीन से बँटता है — तो 234 भी (234 = 3 × 78)। अंक-योग की जाँच यह भी दिखा देती है कि 234 तो 9 से भी विभाज्य है।",
          mr: "2 + 3 + 4 = 9, आणि 9 तीनने भागला जातो — म्हणून 234 ही (234 = 3 × 78). अंक-बेरजेची चाचणी हेही दाखवते की 234 तर 9 नेही विभाज्य आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "8 and 15 are called CO-PRIME. What is their HCF?",
          hi: "8 और 15 को सह-अभाज्य कहते हैं। उनका म.स. क्या है?",
          mr: "8 आणि 15 ला सह-मूळ म्हणतात. त्यांचा म.सा.वि. किती?",
        },
        answer: 1,
        wrong: [2, 3, 5],
        solution: {
          en: "8 = 2×2×2 and 15 = 3×5 share no prime at all, so their only common factor is 1 — that is what co-prime means. Neither needs to BE prime: 8 and 15 are both composite, yet strangers.",
          hi: "8 = 2×2×2 और 15 = 3×5 में कोई साझा अभाज्य नहीं, तो इकलौता समापवर्तक 1 है — सह-अभाज्य का यही अर्थ है। दोनों का अभाज्य होना ज़रूरी नहीं: 8 और 15 दोनों भाज्य हैं, फिर भी अजनबी।",
          mr: "8 = 2×2×2 आणि 15 = 3×5 यांत कोणताही सामाईक मूळ अवयव नाही, म्हणून एकुलता सामाईक विभाजक 1 — सह-मूळचा अर्थ हाच. दोघांनी मूळ असण्याची गरज नाही: 8 आणि 15 दोन्ही संयुक्त, तरी अनोळखी.",
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
          en: "What is the smallest number divisible by both 12 and 15?",
          hi: "12 और 15 दोनों से विभाज्य सबसे छोटी संख्या कौन-सी है?",
          mr: "12 आणि 15 दोघांनी विभाज्य असणारी सर्वांत लहान संख्या कोणती?",
        },
        answer: 60,
        wrong: [180, 3, 30],
        checkExpr: "12*5",
        solution: {
          en: "Twelves: 12, 24, 36, 48, 60…; fifteens: 15, 30, 45, 60 — first meeting at 60. 180 = 12 × 15 overshoots because 12 and 15 share a 3; 30 takes 15's double but 12 does not divide it.",
          hi: "बारह: 12, 24, 36, 48, 60…; पंद्रह: 15, 30, 45, 60 — पहली मुलाक़ात 60 पर। 180 = 12 × 15 इसलिए आगे निकल जाता है कि 12 और 15 में 3 साझा है; 30 पंद्रह का दुगना है पर 12 उसे नहीं बाँटता।",
          mr: "बारा: 12, 24, 36, 48, 60…; पंधरा: 15, 30, 45, 60 — पहिली भेट 60 वर. 180 = 12 × 15 पुढे जाते कारण 12 आणि 15 मध्ये 3 सामाईक आहे; 30 पंधराची दुप्पट पण 12 तिला भागत नाही.",
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
          en: "Three ropes measure 24 m, 36 m and 60 m. They must be cut into pieces all of the SAME length, as long as possible, with nothing left over. How long is each piece?",
          hi: "तीन रस्सियाँ 24, 36 और 60 मीटर की हैं। उन्हें एक-सी, अधिकतम लंबाई के टुकड़ों में काटना है, कुछ बचे नहीं। हर टुकड़ा कितना लंबा होगा?",
          mr: "तीन दोऱ्या 24, 36 आणि 60 मीटरच्या आहेत. त्यांचे सारख्या, जास्तीत जास्त लांबीच्या तुकड्यांत, काही न उरता तुकडे करायचे आहेत. प्रत्येक तुकडा किती लांब?",
        },
        answer: 12,
        wrong: [6, 24, 4],
        checkExpr: "60/5",
        solution: {
          en: "The piece must divide all three lengths — the longest such is their HCF. 24 = 12×2, 36 = 12×3, 60 = 12×5: pieces of 12 m, giving 2 + 3 + 5 = 10 pieces with nothing wasted. 6 m works too but the question asked for the longest; 24 fails on the 36 m rope.",
          hi: "टुकड़े को तीनों लंबाइयाँ बाँटनी होंगी — ऐसा सबसे लंबा उनका म.स. है। 24 = 12×2, 36 = 12×3, 60 = 12×5: 12-12 मीटर के टुकड़े, कुल 2 + 3 + 5 = 10 टुकड़े, कुछ बर्बाद नहीं। 6 मीटर भी चलता है पर पूछा सबसे लंबा था; 24 छत्तीस मीटर वाली रस्सी पर अटक जाता है।",
          mr: "तुकड्याने तिन्ही लांब्या भागल्या पाहिजेत — असा सर्वांत लांब म्हणजे त्यांचा म.सा.वि. 24 = 12×2, 36 = 12×3, 60 = 12×5: 12-12 मीटरचे तुकडे, एकूण 2 + 3 + 5 = 10 तुकडे, काही वाया नाही. 6 मीटरही चालते पण विचारले सर्वांत लांब होते; 24 छत्तीस मीटरच्या दोरीवर अडते.",
        },
        fmt: m,
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 3 — Playing with Numbers",
      name: "Playing with Numbers",
      slug: "maths-6-playing-with-numbers",
      summary: "Primes and perfect numbers, digit-sum tests, HCF and LCM — and the three ropes that only their highest common factor can cut fairly.",
      position: 3,
      translations: {
        hi: {
          name: "संख्याओं के साथ खेलना",
          summary: "अभाज्य और पूर्ण संख्याएँ, अंक-योग की जाँचें, म.स. और ल.स. — और वे तीन रस्सियाँ जिन्हें केवल उनका महत्तम समापवर्तक ही न्याय से काट सकता है।",
        },
        mr: {
          name: "संख्यांशी खेळ",
          summary: "मूळ आणि परिपूर्ण संख्या, अंक-बेरजेच्या चाचण्या, म.सा.वि. आणि ल.सा.वि. — आणि ज्यांना फक्त त्यांचा महत्तम सामाईक विभाजकच न्यायाने कापू शकतो त्या तीन दोऱ्या.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Integers (the first steps below zero)                         */
/* ------------------------------------------------------------------------- */
function integers(): TopicFileOut {
  const rand = rng("maths-6-integers");
  const qs: OutQuestion[] = [];

  const deg = (n: number) => ({ en: `${n}°C`, hi: `${n}°C`, mr: `${n}°C` });
  const mF = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The evening temperature is 5°C and it falls by 8 degrees overnight. What does the thermometer read at dawn?",
          hi: "शाम का तापमान 5°C है और रात में वह 8 डिग्री गिरता है। भोर में थर्मामीटर क्या पढ़ेगा?",
          mr: "संध्याकाळचे तापमान 5°C आहे आणि रात्रीत ते 8 अंशांनी उतरते. पहाटे तापमापक काय दाखवेल?",
        },
        answer: -3,
        wrong: [3, -13, 13],
        checkExpr: "5-8",
        fmt: deg,
        solution: {
          en: "5 − 8 = −3: the fall walks 5 steps to zero and then 3 more below it. 3 stops at zero and forgets the line continues; the thermometer does not.",
          hi: "5 − 8 = −3: गिरावट 5 सीढ़ियाँ शून्य तक उतरती है और फिर 3 और नीचे। 3 शून्य पर रुककर भूल जाता है कि रेखा आगे भी है; थर्मामीटर नहीं भूलता।",
          mr: "5 − 8 = −3: घसरण 5 पायऱ्या शून्यापर्यंत उतरते आणि मग आणखी 3 खाली. 3 शून्यावर थांबून विसरते की रेषा पुढेही आहे; तापमापक विसरत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the opposite of −7 on the number line?",
          hi: "संख्या-रेखा पर −7 का विपरीत क्या है?",
          mr: "संख्यारेषेवर −7 च्या विरुद्ध संख्या कोणती?",
        },
        answer: 7,
        wrong: [-7, 0, 14],
        solution: {
          en: "Opposites sit the same distance from zero on either side: −7's opposite is 7. 14 measures the distance BETWEEN them, not the mirror-partner.",
          hi: "विपरीत संख्याएँ शून्य से बराबर दूरी पर आमने-सामने बैठती हैं: −7 का विपरीत 7 है। 14 उनके बीच की दूरी है, दर्पण-साथी नहीं।",
          mr: "विरुद्ध संख्या शून्यापासून सारख्या अंतरावर समोरासमोर बसतात: −7 ची विरुद्ध 7. 14 हे त्यांच्यामधले अंतर, आरसा-जोडीदार नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is (−3) + 3?",
          hi: "(−3) + 3 कितना है?",
          mr: "(−3) + 3 किती?",
        },
        answer: 0,
        wrong: [-6, 6, -9],
        checkExpr: "3-3",
        solution: {
          en: "Three steps back and three steps forward land exactly at 0 — a number and its opposite always cancel. −6 walks backwards twice.",
          hi: "तीन क़दम पीछे और तीन आगे ठीक 0 पर उतरते हैं — संख्या और उसका विपरीत हमेशा कट जाते हैं। −6 दो बार पीछे चलता है।",
          mr: "तीन पावले मागे आणि तीन पुढे नेमकी 0 वर येतात — संख्या आणि तिची विरुद्ध नेहमी कापल्या जातात. −6 दोनदा मागे चालते.",
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
          en: "Which is the SMALLER number: −8 or −3?",
          hi: "कौन-सी संख्या छोटी है: −8 या −3?",
          mr: "कोणती संख्या लहान: −8 की −3?",
        },
        answer: -8,
        wrong: [-3, 8, 3],
        solution: {
          en: "−8 sits further LEFT on the number line, so it is smaller — owing ₹8 is worse than owing ₹3. Below zero, the bigger-looking digit is the smaller number.",
          hi: "−8 संख्या-रेखा पर ज़्यादा बाईं ओर है, इसलिए छोटी है — ₹8 का क़र्ज़ ₹3 के क़र्ज़ से बुरा है। शून्य के नीचे बड़ा दिखता अंक छोटी संख्या होता है।",
          mr: "−8 संख्यारेषेवर अधिक डावीकडे आहे, म्हणून लहान — ₹8 चे कर्ज ₹3 च्या कर्जाहून वाईट. शून्याखाली मोठा दिसणारा अंक लहान संख्या असतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is (−5) + (−4)?",
          hi: "(−5) + (−4) कितना है?",
          mr: "(−5) + (−4) किती?",
        },
        answer: -9,
        wrong: [-1, 9, 1],
        checkExpr: "0-5-4",
        solution: {
          en: "Two backward walks add up: 5 steps back, then 4 more — 9 steps back in all, so −9. −1 subtracts the numbers instead of joining two debts.",
          hi: "दो पीछे की चालें जुड़ती हैं: 5 क़दम पीछे, फिर 4 और — कुल 9 पीछे, यानी −9। −1 दो क़र्ज़ जोड़ने की जगह संख्याएँ घटा देता है।",
          mr: "दोन मागच्या चाली जुळतात: 5 पावले मागे, मग आणखी 4 — एकूण 9 मागे, म्हणजे −9. −1 दोन कर्जे जोडण्याऐवजी संख्या वजा करते.",
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
          en: "A submarine waits at 40 m below sea level (−40 m) and rises 15 m. Where is it now?",
          hi: "पनडुब्बी समुद्र-तल से 40 मीटर नीचे (−40 मीटर) है और 15 मीटर ऊपर उठती है। अब वह कहाँ है?",
          mr: "पाणबुडी समुद्रसपाटीच्या 40 मीटर खाली (−40 मीटर) आहे आणि 15 मीटर वर येते. आता ती कुठे आहे?",
        },
        answer: -25,
        wrong: [-55, 25, -35],
        checkExpr: "15-40",
        fmt: mF,
        solution: {
          en: "−40 + 15 = −25: fifteen of the forty below are climbed, twenty-five remain below. −55 dives deeper instead of rising; 25 surfaces and keeps going, which no rise of 15 allows.",
          hi: "−40 + 15 = −25: नीचे के चालीस में से पंद्रह चढ़ गए, पच्चीस नीचे बाक़ी। −55 उठने की जगह और गहरे उतर जाता है; 25 सतह पार कर जाता है — 15 की चढ़ाई से यह हो ही नहीं सकता।",
          mr: "−40 + 15 = −25: खालच्या चाळिसांतले पंधरा चढले, पंचवीस खाली उरले. −55 वर येण्याऐवजी आणखी खोल जाते; 25 पृष्ठभाग ओलांडते — 15 च्या चढणीने ते शक्यच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is 8 − 13?",
          hi: "8 − 13 कितना है?",
          mr: "8 − 13 किती?",
        },
        answer: -5,
        wrong: [5, -21, 21],
        checkExpr: "8-13",
        solution: {
          en: "Taking 13 from 8 crosses zero: 8 steps use up the 8, and 5 more go below — −5. Writing 5 does the smaller-from-larger swap that whole numbers allowed; integers no longer permit it.",
          hi: "8 में से 13 लेना शून्य पार कराता है: 8 क़दम 8 को ख़त्म करते हैं, 5 और नीचे जाते हैं — −5। 5 लिखना छोटे-में-से-बड़ा वाली अदला-बदली है जो पूर्ण संख्याओं में चलती थी; पूर्णांक अब उसकी इजाज़त नहीं देते।",
          mr: "8 मधून 13 घेणे शून्य ओलांडते: 8 पावले 8 संपवतात, आणखी 5 खाली जातात — −5. 5 लिहिणे म्हणजे लहानातून-मोठा ही अदलाबदल, जी पूर्ण संख्यांत चालत असे; पूर्णांक आता ती परवानगी देत नाहीत.",
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
          en: "A hill town reads 3°C at dusk, drops 7 degrees by midnight, then rises 5 by noon. What is the noon temperature?",
          hi: "पहाड़ी क़स्बे में साँझ को 3°C है, आधी रात तक 7 डिग्री गिरता है, फिर दोपहर तक 5 चढ़ता है। दोपहर का तापमान क्या है?",
          mr: "डोंगरी गावात सांजेला 3°C आहे, मध्यरात्रीपर्यंत 7 अंशांनी उतरते, मग दुपारपर्यंत 5 चढते. दुपारचे तापमान किती?",
        },
        answer: 1,
        wrong: [-4, 15, -9],
        checkExpr: "3-7+5",
        fmt: deg,
        solution: {
          en: "Walk it: 3 − 7 = −4 at midnight, then −4 + 5 = 1 at noon. −4 stops the story at midnight; 15 adds every number in sight, ignoring which way each step went.",
          hi: "चलकर देखिए: आधी रात 3 − 7 = −4, फिर दोपहर −4 + 5 = 1। −4 कहानी आधी रात पर रोक देता है; 15 दिशा देखे बिना हर संख्या जोड़ डालता है।",
          mr: "चालून पाहा: मध्यरात्री 3 − 7 = −4, मग दुपारी −4 + 5 = 1. −4 गोष्ट मध्यरात्रीच थांबवते; 15 दिशा न पाहता दिसेल ती संख्या मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Ravi's account: he deposits ₹500 in the morning and withdraws ₹700 in the evening. By how much did the day CHANGE his balance?",
          hi: "रवि का खाता: सुबह ₹500 जमा, शाम ₹700 निकासी। दिन ने उसकी बचत कितने से बदली?",
          mr: "रवीचे खाते: सकाळी ₹500 भरले, संध्याकाळी ₹700 काढले. दिवसाने त्याची शिल्लक किती बदलली?",
        },
        answer: -200,
        wrong: [200, -1200, 1200],
        checkExpr: "500-700",
        solution: {
          en: "In 500, out 700: the change is 500 − 700 = −200 — the balance fell by ₹200. The minus sign is the bookkeeping: it records not just how much, but which way.",
          hi: "आए 500, गए 700: बदलाव 500 − 700 = −200 — बचत ₹200 घटी। ऋण चिह्न ही बही-खाता है: वह केवल कितना नहीं, किस दिशा में भी दर्ज करता है।",
          mr: "आले 500, गेले 700: बदल 500 − 700 = −200 — शिल्लक ₹200 ने घटली. वजा चिन्ह हाच हिशेब: ते फक्त किती नव्हे, कोणत्या दिशेने हेही नोंदवते.",
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
          en: "Add the first four negative integers: (−1) + (−2) + (−3) + (−4).",
          hi: "पहले चार ऋणात्मक पूर्णांक जोड़िए: (−1) + (−2) + (−3) + (−4)।",
          mr: "पहिले चार ऋण पूर्णांक मिळवा: (−1) + (−2) + (−3) + (−4).",
        },
        answer: -10,
        wrong: [10, -24, -9],
        checkExpr: "0-1-2-3-4",
        solution: {
          en: "Four backward walks of 1, 2, 3 and 4 steps: 1 + 2 + 3 + 4 = 10 steps back in all — so −10. The positive sum's mirror image: same distance, opposite side of zero.",
          hi: "1, 2, 3 और 4 क़दमों की चार पीछे-चालें: कुल 1 + 2 + 3 + 4 = 10 क़दम पीछे — यानी −10। धनात्मक योग का दर्पण-रूप: वही दूरी, शून्य के उस पार।",
          mr: "1, 2, 3 आणि 4 पावलांच्या चार मागे-चाली: एकूण 1 + 2 + 3 + 4 = 10 पावले मागे — म्हणजे −10. धन बेरजेचे आरसा-रूप: तेच अंतर, शून्याच्या पलीकडे.",
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
          en: "A frog sits on step −2 of a ghat (2 steps below the waterline at 0). It jumps up 3 steps, slips down 1, then jumps up 4. On which step does it sit now?",
          hi: "मेंढक घाट की सीढ़ी −2 पर बैठा है (जल-रेखा 0 से 2 सीढ़ियाँ नीचे)। वह 3 सीढ़ियाँ ऊपर कूदता है, 1 फिसलता है, फिर 4 ऊपर कूदता है। अब वह किस सीढ़ी पर है?",
          mr: "बेडूक घाटाच्या −2 पायरीवर बसला आहे (पाणरेषा 0 च्या 2 पायऱ्या खाली). तो 3 पायऱ्या वर उडी मारतो, 1 घसरतो, मग 4 वर उडी मारतो. आता तो कोणत्या पायरीवर आहे?",
        },
        answer: 4,
        wrong: [6, 2, -4],
        checkExpr: "3-2-1+4",
        solution: {
          en: "Track each move: −2 + 3 = 1, then 1 − 1 = 0 (exactly at the waterline!), then 0 + 4 = 4 — four dry steps above the water. 6 forgets the starting debt of −2; the frog's whole journey only makes sense counted from where it BEGAN.",
          hi: "हर चाल दर्ज कीजिए: −2 + 3 = 1, फिर 1 − 1 = 0 (ठीक जल-रेखा पर!), फिर 0 + 4 = 4 — पानी से चार सूखी सीढ़ियाँ ऊपर। 6 शुरुआती −2 का क़र्ज़ भूल जाता है; मेंढक का पूरा सफ़र वहीं से गिनने पर ही अर्थ रखता है जहाँ से वह चला था।",
          mr: "प्रत्येक चाल नोंदवा: −2 + 3 = 1, मग 1 − 1 = 0 (नेमके पाणरेषेवर!), मग 0 + 4 = 4 — पाण्यापासून चार कोरड्या पायऱ्या वर. 6 सुरुवातीचे −2 चे कर्ज विसरते; बेडकाचा सारा प्रवास तो जिथून निघाला तिथूनच मोजला तरच अर्थ धरतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 6 — Integers",
      name: "Integers",
      slug: "maths-6-integers",
      summary: "The number line's left half opens — falling thermometers, submarines and bank balances, and a frog counting ghat steps across zero.",
      position: 6,
      translations: {
        hi: {
          name: "पूर्णांक",
          summary: "संख्या-रेखा का बायाँ आधा खुलता है — गिरते थर्मामीटर, पनडुब्बियाँ और बैंक-बचत, और शून्य के आर-पार घाट की सीढ़ियाँ गिनता मेंढक।",
        },
        mr: {
          name: "पूर्णांक",
          summary: "संख्यारेषेचा डावा अर्धा उघडतो — उतरणारे तापमापक, पाणबुड्या आणि बँक-शिल्लक, आणि शून्यापार घाटाच्या पायऱ्या मोजणारा बेडूक.",
        },
      },
    },
    qs,
  );
}

export const G6_MATHS: TopicFileOut[] = [knowingOurNumbers(), playingWithNumbers(), integers()];
