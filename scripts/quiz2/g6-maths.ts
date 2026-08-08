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

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Fractions (equivalence, addition and the parts of wholes)     */
/* ------------------------------------------------------------------------- */
function fractions6(): TopicFileOut {
  const rand = rng("maths-6-fractions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is one half of 18?",
          hi: "18 का आधा कितना है?",
          mr: "18 चा अर्धा किती?",
        },
        answer: 9,
        wrong: [8, 36, 6],
        checkExpr: "18/2",
        solution: {
          en: "18 ÷ 2 = 9. 36 doubles instead of halving — one half always makes a number smaller.",
          hi: "18 ÷ 2 = 9। 36 आधा करने की जगह दुगना करता है — आधा संख्या को हमेशा छोटा करता है।",
          mr: "18 ÷ 2 = 9. 36 अर्धे करण्याऐवजी दुप्पट करते — अर्धा संख्येला नेहमी लहान करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Fill the blank so the fractions are EQUIVALENT: 1/2 = ▢/6. What goes in the box?",
          hi: "रिक्त भरिए ताकि भिन्न तुल्य हों: 1/2 = ▢/6। डिब्बे में क्या आएगा?",
          mr: "रिकामी जागा भरा म्हणजे अपूर्णांक समतुल्य होतील: 1/2 = ▢/6. चौकटीत काय येईल?",
        },
        answer: 3,
        wrong: [2, 6, 4],
        checkExpr: "6/2",
        solution: {
          en: "The bottom grew from 2 to 6 — three times — so the top must grow three times too: 1 × 3 = 3, giving 3/6. Half of six parts is three parts; the pizza has not changed, only its slicing.",
          hi: "हर 2 से 6 हुआ — तीन गुना — तो अंश भी तीन गुना होगा: 1 × 3 = 3, यानी 3/6। छह हिस्सों का आधा तीन हिस्से हैं; पिज़्ज़ा नहीं बदला, बस उसकी कटाई बदली।",
          mr: "छेद 2 वरून 6 झाला — तिप्पट — म्हणून अंशही तिप्पट होईल: 1 × 3 = 3, म्हणजे 3/6. सहा भागांचा अर्धा म्हणजे तीन भाग; पिझ्झा बदलला नाही, फक्त त्याची कापणी बदलली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many quarter-pieces make 2 whole rotis?",
          hi: "2 पूरी रोटियाँ बनाने में चौथाई-टुकड़े कितने लगेंगे?",
          mr: "2 पूर्ण पोळ्या व्हायला पाव-तुकडे किती लागतील?",
        },
        answer: 8,
        wrong: [4, 6, 2],
        checkExpr: "2*4",
        solution: {
          en: "Each whole holds 4 quarters, so 2 wholes hold 2 × 4 = 8 — the fraction 8/4 equals 2. 4 builds only one roti.",
          hi: "हर पूरे में 4 चौथाइयाँ, तो 2 पूरों में 2 × 4 = 8 — भिन्न 8/4 यानी 2। 4 से एक ही रोटी बनती है।",
          mr: "प्रत्येक पूर्णात 4 पाव, म्हणून 2 पूर्णांत 2 × 4 = 8 — अपूर्णांक 8/4 म्हणजे 2. 4 ने एकच पोळी होते.",
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
          en: "Add the LIKE fractions 2/5 + 1/5. What is the numerator of the answer (in fifths)?",
          hi: "समान भिन्न 2/5 + 1/5 जोड़िए। उत्तर (पाँचवें हिस्सों में) का अंश क्या है?",
          mr: "समान अपूर्णांक 2/5 + 1/5 मिळवा. उत्तराचा (पंचमांशांत) अंश किती?",
        },
        answer: 3,
        wrong: [2, 10, 1],
        checkExpr: "2+1",
        solution: {
          en: "Like fractions share a denominator, so only the tops add: 2 + 1 = 3, giving 3/5. Adding the bottoms too (getting /10) breaks the pieces' size mid-sum.",
          hi: "समान भिन्नों का हर एक ही है, तो केवल अंश जुड़ते हैं: 2 + 1 = 3, यानी 3/5। हर भी जोड़ना (/10 बनाना) जोड़ के बीच टुकड़ों का नाप ही बदल देता है।",
          mr: "समान अपूर्णांकांचा छेद एकच, म्हणून फक्त अंश जुळतात: 2 + 1 = 3, म्हणजे 3/5. छेदही मिळवणे (/10 करणे) बेरजेच्या मधेच तुकड्यांचे माप बदलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Reduce 6/8 to its simplest form. What is the numerator now?",
          hi: "6/8 को सरलतम रूप में लाइए। अब अंश क्या है?",
          mr: "6/8 सोप्या रूपात आणा. आता अंश किती?",
        },
        answer: 3,
        wrong: [6, 2, 4],
        checkExpr: "6/2",
        solution: {
          en: "Divide top and bottom by their HCF 2: 6/8 = 3/4. The fraction's value is untouched — three of four bigger pieces equals six of eight smaller ones.",
          hi: "अंश-हर दोनों को उनके म.स. 2 से बाँटिए: 6/8 = 3/4। भिन्न का मान अछूता है — चार बड़े टुकड़ों में से तीन, आठ छोटे में से छह के बराबर।",
          mr: "अंश-छेद दोघांना त्यांच्या म.सा.वि. 2 ने भागा: 6/8 = 3/4. अपूर्णांकाचे मूल्य जसेच्या तसे — चार मोठ्या तुकड्यांतले तीन म्हणजे आठ लहानांतले सहा.",
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
          en: "What is 3/4 of 36 mangoes?",
          hi: "36 आमों का 3/4 कितना है?",
          mr: "36 आंब्यांचा 3/4 किती?",
        },
        answer: 27,
        wrong: [9, 24, 12],
        checkExpr: "36*3/4",
        solution: {
          en: "One quarter of 36 is 9, so three quarters are 9 × 3 = 27. 9 stops at a single quarter; 12 finds a third instead.",
          hi: "36 की एक चौथाई 9, तो तीन चौथाई 9 × 3 = 27। 9 एक चौथाई पर रुकता है; 12 तिहाई निकाल बैठता है।",
          mr: "36 चा एक पाव 9, म्हणून तीन पाव 9 × 3 = 27. 9 एका पावावर थांबते; 12 तृतीयांश काढते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Subtract: 7/10 − 3/10. What is the numerator of the answer (in tenths)?",
          hi: "घटाइए: 7/10 − 3/10। उत्तर (दसवें हिस्सों में) का अंश क्या है?",
          mr: "वजा करा: 7/10 − 3/10. उत्तराचा (दशांशांत) अंश किती?",
        },
        answer: 4,
        wrong: [10, 3, 21],
        checkExpr: "7-3",
        solution: {
          en: "Same-size pieces subtract by their counts: 7 − 3 = 4 tenths, i.e. 4/10 (which simplifies to 2/5). 21 multiplies the tops — a different operation entirely.",
          hi: "एक नाप के टुकड़े गिनती से घटते हैं: 7 − 3 = 4 दसवें, यानी 4/10 (सरल होकर 2/5)। 21 अंशों का गुणा है — बिलकुल दूसरी संक्रिया।",
          mr: "एका मापाचे तुकडे संख्येने वजा होतात: 7 − 3 = 4 दशांश, म्हणजे 4/10 (सोपे करून 2/5). 21 म्हणजे अंशांचा गुणाकार — अगदी वेगळी क्रिया.",
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
          en: "Add the UNLIKE fractions 1/2 + 1/4 by turning halves into quarters first. What is the answer's numerator, in quarters?",
          hi: "असमान भिन्न 1/2 + 1/4 जोड़िए — पहले आधों को चौथाइयों में बदलकर। उत्तर का अंश, चौथाइयों में, क्या है?",
          mr: "असमान अपूर्णांक 1/2 + 1/4 मिळवा — आधी अर्ध्यांचे पाव करून. उत्तराचा अंश, पावांत, किती?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        checkExpr: "2+1",
        solution: {
          en: "1/2 = 2/4, and 2/4 + 1/4 = 3/4. Unlike fractions must first agree on a piece-size — that agreement is the whole work; the adding afterwards is easy.",
          hi: "1/2 = 2/4, और 2/4 + 1/4 = 3/4। असमान भिन्नों को पहले टुकड़े के नाप पर सहमत होना पड़ता है — वही सहमति पूरा काम है; बाद का जोड़ आसान है।",
          mr: "1/2 = 2/4, आणि 2/4 + 1/4 = 3/4. असमान अपूर्णांकांना आधी तुकड्याच्या मापावर सहमत व्हावे लागते — तीच सहमती म्हणजे सारे काम; नंतरची बेरीज सोपी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "To compare 3/4 and 2/3, write both in twelfths. What is 3/4 as twelfths — its numerator?",
          hi: "3/4 और 2/3 की तुलना के लिए दोनों को बारहवें हिस्सों में लिखिए। 3/4 बारहवों में क्या है — उसका अंश?",
          mr: "3/4 आणि 2/3 ची तुलना करायला दोन्ही बाराव्या भागांत लिहा. 3/4 बारावांत किती — त्याचा अंश?",
        },
        answer: 9,
        wrong: [8, 6, 3],
        checkExpr: "3*3",
        solution: {
          en: "3/4 = 9/12 (top and bottom × 3), while 2/3 = 8/12 — so 3/4 is the larger by one twelfth. 8 is 2/3's numerator; putting both on twelfths is exactly what makes them comparable.",
          hi: "3/4 = 9/12 (अंश-हर × 3), जबकि 2/3 = 8/12 — तो 3/4 एक बारहवें से बड़ा। 8 तो 2/3 का अंश है; दोनों को बारहवों पर लाना ही उन्हें तुलनीय बनाता है।",
          mr: "3/4 = 9/12 (अंश-छेद × 3), तर 2/3 = 8/12 — म्हणून 3/4 एका बाराव्याने मोठा. 8 हा 2/3 चा अंश; दोघांना बारावांवर आणणे हेच त्यांना तुलनीय करते.",
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
          en: "Write the mixed number 2½ as an improper fraction in halves. What is its numerator?",
          hi: "मिश्र संख्या 2½ को आधों में विषम भिन्न लिखिए। उसका अंश क्या है?",
          mr: "मिश्र संख्या 2½ अर्ध्यांत विषम अपूर्णांक म्हणून लिहा. तिचा अंश किती?",
        },
        answer: 5,
        wrong: [3, 4, 2],
        checkExpr: "2*2+1",
        solution: {
          en: "Two wholes are 4 halves, plus the loose half: 4 + 1 = 5, so 2½ = 5/2. 3 adds the 2 and the 1 without converting the wholes to halves first.",
          hi: "दो पूरे यानी 4 आधे, ऊपर से खुला आधा: 4 + 1 = 5, तो 2½ = 5/2। 3 पूरों को आधों में बदले बिना 2 और 1 जोड़ देता है।",
          mr: "दोन पूर्ण म्हणजे 4 अर्धे, शिवाय सुटा अर्धा: 4 + 1 = 5, म्हणून 2½ = 5/2. 3 पूर्णांचे अर्धे न करता 2 आणि 1 मिळवते.",
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
          en: "Ravi read one third of a 120-page book on Monday and one quarter of it on Tuesday. How many pages are left?",
          hi: "रवि ने 120 पन्नों की किताब का एक-तिहाई सोमवार को और एक-चौथाई मंगलवार को पढ़ा। कितने पन्ने बाक़ी हैं?",
          mr: "रवीने 120 पानी पुस्तकाचा एक-तृतीयांश सोमवारी आणि एक-चतुर्थांश मंगळवारी वाचला. किती पाने उरली?",
        },
        answer: 50,
        wrong: [70, 40, 30],
        checkExpr: "120-120/3-120/4",
        solution: {
          en: "Monday: 120 ÷ 3 = 40 pages; Tuesday: 120 ÷ 4 = 30. Read in all: 70, leaving 120 − 70 = 50 pages. Both fractions cut the SAME whole book — 70 is the trap of stopping at what was read instead of what remains.",
          hi: "सोमवार: 120 ÷ 3 = 40 पन्ने; मंगलवार: 120 ÷ 4 = 30। कुल पढ़े 70, बचे 120 − 70 = 50 पन्ने। दोनों भिन्न उसी पूरी किताब से कटते हैं — 70 वह फंदा है जो बचे की जगह पढ़े पर रुक जाता है।",
          mr: "सोमवार: 120 ÷ 3 = 40 पाने; मंगळवार: 120 ÷ 4 = 30. एकूण वाचली 70, उरली 120 − 70 = 50 पाने. दोन्ही अपूर्णांक त्याच पूर्ण पुस्तकातून कापले जातात — 70 हा उरलेल्याऐवजी वाचलेल्यावर थांबण्याचा सापळा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 7 — Fractions",
      name: "Fractions",
      slug: "maths-6-fractions",
      summary: "Equivalent slicings, like and unlike additions, mixed numbers — and the book whose thirds and quarters must cut the same whole.",
      position: 7,
      translations: {
        hi: {
          name: "भिन्न",
          summary: "तुल्य कटाइयाँ, समान-असमान जोड़, मिश्र संख्याएँ — और वह किताब जिसकी तिहाई और चौथाई एक ही पूरे से कटनी चाहिए।",
        },
        mr: {
          name: "अपूर्णांक",
          summary: "समतुल्य कापण्या, समान-असमान बेरजा, मिश्र संख्या — आणि जिचे तृतीयांश व पाव एकाच पूर्णातून कापले पाहिजेत ते पुस्तक.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Decimals (tenths and hundredths with a firmer grip)           */
/* ------------------------------------------------------------------------- */
function decimals6(): TopicFileOut {
  const rand = rng("maths-6-decimals");
  const qs: OutQuestion[] = [];

  const paise = (n: number) => ({ en: `${n} paise`, hi: `${n} पैसे`, mr: `${n} पैसे` });
  const mm = (n: number) => ({ en: `${n} mm`, hi: `${n} मिमी`, mr: `${n} मिमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The decimal 0.7 stands for how many tenths?",
          hi: "दशमलव 0.7 कितने दसवें हिस्सों के लिए है?",
          mr: "0.7 हा दशांश किती दशांश भागांसाठी आहे?",
        },
        answer: 7,
        wrong: [70, 1, 10],
        checkExpr: "70/10",
        solution: {
          en: "The first place after the point counts tenths: 0.7 is 7 tenths, or 7/10. 70 reads the digit into the wrong column.",
          hi: "बिंदी के बाद पहला स्थान दसवें गिनता है: 0.7 यानी 7 दसवें, या 7/10। 70 अंक को ग़लत ख़ाने में पढ़ता है।",
          mr: "टिंबानंतरचे पहिले स्थान दशांश मोजते: 0.7 म्हणजे 7 दशांश, वा 7/10. 70 अंक चुकीच्या रकान्यात वाचते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Write the fraction 7/10 as a decimal.",
          hi: "भिन्न 7/10 को दशमलव में लिखिए।",
          mr: "7/10 हा अपूर्णांक दशांशात लिहा.",
        },
        answer: 0.7,
        wrong: [7, 0.07, 70],
        checkExpr: "7/10",
        solution: {
          en: "Tenths take one place after the point: 7/10 = 0.7. 0.07 pushes the 7 to the hundredths; 7 forgets the point altogether.",
          hi: "दसवें बिंदी के बाद एक स्थान लेते हैं: 7/10 = 0.7। 0.07 सात को सौवों में धकेल देता है; 7 बिंदी ही भूल जाता है।",
          mr: "दशांश टिंबानंतर एक स्थान घेतात: 7/10 = 0.7. 0.07 सातला शतांशांत ढकलते; 7 टिंबच विसरते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 3.5 + 1.5?",
          hi: "3.5 + 1.5 कितना है?",
          mr: "3.5 + 1.5 किती?",
        },
        answer: 5,
        wrong: [4.1, 5.5, 4.55],
        checkExpr: "(35+15)/10",
        solution: {
          en: "The halves join into a whole: 3.5 + 1.5 = 5 exactly. In tenths, 35 + 15 = 50 tenths = 5. 4.1 adds the whole parts and misreads .5 + .5 as .1.",
          hi: "आधे मिलकर पूरा बनते हैं: 3.5 + 1.5 = ठीक 5। दसवों में, 35 + 15 = 50 दसवें = 5। 4.1 पूर्ण भाग जोड़कर .5 + .5 को .1 पढ़ लेता है।",
          mr: "अर्धे मिळून पूर्ण होतात: 3.5 + 1.5 = नेमके 5. दशांशांत, 35 + 15 = 50 दशांश = 5. 4.1 पूर्ण भाग मिळवून .5 + .5 ला .1 वाचते.",
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
          en: "In 2.35, the 2 is wholes and the 3 is tenths. How many HUNDREDTHS does the 5 stand for?",
          hi: "2.35 में 2 पूर्ण है और 3 दसवें। 5 कितने सौवें हिस्सों के लिए है?",
          mr: "2.35 मध्ये 2 पूर्ण आणि 3 दशांश. 5 किती शतांशांसाठी आहे?",
        },
        answer: 5,
        wrong: [50, 35, 3],
        checkExpr: "500/100",
        solution: {
          en: "The second place after the point counts hundredths: the 5 is 5 hundredths, so 2.35 = 2 + 3/10 + 5/100. Each place is worth a tenth of the one before it.",
          hi: "बिंदी के बाद दूसरा स्थान सौवें गिनता है: 5 यानी 5 सौवें, तो 2.35 = 2 + 3/10 + 5/100। हर स्थान पिछले का दसवाँ हिस्सा है।",
          mr: "टिंबानंतरचे दुसरे स्थान शतांश मोजते: 5 म्हणजे 5 शतांश, म्हणून 2.35 = 2 + 3/10 + 5/100. प्रत्येक स्थान आधीच्याचा दशांश असते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 0.5 + 0.25?",
          hi: "0.5 + 0.25 कितना है?",
          mr: "0.5 + 0.25 किती?",
        },
        answer: 0.75,
        wrong: [0.3, 0.55, 0.7],
        checkExpr: "1/2+1/4",
        solution: {
          en: "A half plus a quarter is three quarters: 0.50 + 0.25 = 0.75. 0.3 adds 5 + 25 as if both sat in the same column — line up the points and the columns line up too.",
          hi: "आधा और चौथाई मिलकर तीन चौथाई: 0.50 + 0.25 = 0.75। 0.3 पाँच और पच्चीस को एक ही ख़ाने का मानकर जोड़ता है — बिंदियाँ सीध में रखिए तो ख़ाने भी सीध में आ जाते हैं।",
          mr: "अर्धा अधिक पाव म्हणजे पाऊण: 0.50 + 0.25 = 0.75. 0.3 पाच आणि पंचवीसला एकाच रकान्यातले समजून मिळवते — टिंबे सरळ रेषेत ठेवा की रकानेही सरळ येतात.",
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
          en: "What is 6.4 − 2.9?",
          hi: "6.4 − 2.9 कितना है?",
          mr: "6.4 − 2.9 किती?",
        },
        answer: 3.5,
        wrong: [4.5, 3.6, 4.3],
        checkExpr: "64/10-29/10",
        solution: {
          en: "In tenths: 64 − 29 = 35 tenths = 3.5. 4.5 dodges the borrow — 4 tenths cannot give up 9 without opening a whole.",
          hi: "दसवों में: 64 − 29 = 35 दसवें = 3.5। 4.5 हासिल से बचता है — 4 दसवें बिना एक पूर्ण खोले 9 नहीं दे सकते।",
          mr: "दशांशांत: 64 − 29 = 35 दशांश = 3.5. 4.5 हातचा चुकवते — 4 दशांश एक पूर्ण मोडल्याशिवाय 9 देऊ शकत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A shopkeeper's board says ₹5.75. How many paise is that in all?",
          hi: "दुकानदार की तख़्ती पर ₹5.75 लिखा है। यह कुल कितने पैसे हुए?",
          mr: "दुकानदाराच्या फळ्यावर ₹5.75 लिहिले आहे. ते एकूण किती पैसे?",
        },
        answer: 575,
        wrong: [75, 507, 5075],
        checkExpr: "5*100+75",
        solution: {
          en: "Five rupees are 500 paise, plus the 75: 575 paise. 507 drops the 75's tens; 5075 gives the rupees an extra zero.",
          hi: "पाँच रुपये यानी 500 पैसे, ऊपर से 75: 575 पैसे। 507 में 75 की दहाई गिरती है; 5075 रुपयों को फ़ालतू शून्य दे देता है।",
          mr: "पाच रुपये म्हणजे 500 पैसे, शिवाय 75: 575 पैसे. 507 मध्ये 75 चा दशक पडतो; 5075 रुपयांना जादा शून्य देते.",
        },
        fmt: paise,
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "What is 3 × 0.6?",
          hi: "3 × 0.6 कितना है?",
          mr: "3 × 0.6 किती?",
        },
        answer: 1.8,
        wrong: [0.18, 18, 3.6],
        checkExpr: "18/10",
        solution: {
          en: "Three lots of 6 tenths are 18 tenths = 1.8. 18 forgets the tenths entirely; 0.18 pays the point twice. Multiply the digits, then place the point by counting decimal places.",
          hi: "6 दसवों के तीन गुट यानी 18 दसवें = 1.8। 18 दसवें भूल ही जाता है; 0.18 बिंदी दो बार चुका देता है। अंक गुणिए, फिर दशमलव-स्थान गिनकर बिंदी रखिए।",
          mr: "6 दशांशांचे तीन गट म्हणजे 18 दशांश = 1.8. 18 दशांशच विसरते; 0.18 टिंब दोनदा भरते. अंक गुणा, मग दशांश-स्थाने मोजून टिंब ठेवा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A beetle measures 12.5 cm of path in a minute. How many millimetres is 12.5 cm?",
          hi: "एक भृंग मिनट में 12.5 सेमी राह नापता है। 12.5 सेमी कितने मिलीमीटर हैं?",
          mr: "एक भुंगा मिनिटात 12.5 सेमी वाट कापतो. 12.5 सेमी म्हणजे किती मिलिमीटर?",
        },
        answer: 125,
        wrong: [1250, 12.5, 1200],
        checkExpr: "250/2",
        solution: {
          en: "Each centimetre is 10 mm, so 12.5 cm = 12.5 × 10 = 125 mm — the point slides one place right. 1250 slides it two places, which is the ×100 of metres, not centimetres.",
          hi: "हर सेंटीमीटर 10 मिमी, तो 12.5 सेमी = 12.5 × 10 = 125 मिमी — बिंदी एक घर दाएँ सरकती है। 1250 दो घर सरका देता है — वह मीटर वाला ×100 है, सेंटीमीटर का नहीं।",
          mr: "प्रत्येक सेंटिमीटर 10 मिमी, म्हणून 12.5 सेमी = 12.5 × 10 = 125 मिमी — टिंब एक घर उजवीकडे सरकते. 1250 दोन घरे सरकवते — ते मीटरचे ×100, सेंटिमीटरचे नव्हे.",
        },
        fmt: mm,
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "To compare 0.5 and 0.45, write both in hundredths. How many hundredths is 0.5?",
          hi: "0.5 और 0.45 की तुलना के लिए दोनों को सौवें हिस्सों में लिखिए। 0.5 कितने सौवें हैं?",
          mr: "0.5 आणि 0.45 ची तुलना करायला दोन्ही शतांशांत लिहा. 0.5 म्हणजे किती शतांश?",
        },
        answer: 50,
        wrong: [5, 45, 500],
        checkExpr: "100/2",
        solution: {
          en: "0.5 = 0.50 = 50 hundredths, while 0.45 is 45 — so 0.5 is the LARGER, though 45 has more digits. Padding with a zero costs nothing and makes the comparison honest; more digits never means bigger.",
          hi: "0.5 = 0.50 = 50 सौवें, जबकि 0.45 यानी 45 — तो 0.5 बड़ा है, भले 45 में अंक ज़्यादा दिखें। शून्य जोड़ने में कुछ नहीं लगता और तुलना ईमानदार हो जाती है; ज़्यादा अंक कभी बड़े होने की निशानी नहीं।",
          mr: "0.5 = 0.50 = 50 शतांश, तर 0.45 म्हणजे 45 — म्हणून 0.5 मोठा, जरी 45 मध्ये अंक जास्त दिसले तरी. शून्य जोडायला काही लागत नाही आणि तुलना प्रामाणिक होते; जास्त अंक म्हणजे मोठे, असे कधीच नाही.",
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
          en: "Two sprinters run 100 m: Asha in 12.7 seconds, Bina in 12.07 seconds. Bina is faster by how many HUNDREDTHS of a second?",
          hi: "दो धावक 100 मीटर दौड़ती हैं: आशा 12.7 सेकंड में, बीना 12.07 सेकंड में। बीना कितने सौवें सेकंड से तेज़ है?",
          mr: "दोन धावपटू 100 मीटर धावतात: आशा 12.7 सेकंदांत, बिना 12.07 सेकंदांत. बिना किती शतांश सेकंदांनी वेगवान?",
        },
        answer: 63,
        wrong: [7, 63 * 10, 3],
        checkExpr: "1270-1207",
        solution: {
          en: "In hundredths: 12.7 s = 1270 and 12.07 s = 1207, so the gap is 1270 − 1207 = 63 hundredths (0.63 s). The trap is thinking 12.7 and 12.07 are nearly equal — the lone 7 after the point is TENTHS, ten times the size of the 07.",
          hi: "सौवों में: 12.7 से = 1270 और 12.07 से = 1207, अंतर 1270 − 1207 = 63 सौवें (0.63 से)। फंदा यह सोचना है कि 12.7 और 12.07 लगभग बराबर हैं — बिंदी के बाद अकेला 7 दसवें हैं, 07 से दस गुना बड़ा।",
          mr: "शतांशांत: 12.7 से = 1270 आणि 12.07 से = 1207, फरक 1270 − 1207 = 63 शतांश (0.63 से). सापळा हा की 12.7 आणि 12.07 जवळजवळ सारखे वाटतात — टिंबानंतरचा एकटा 7 दशांश आहे, 07 च्या दसपट मोठा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 8 — Decimals",
      name: "Decimals",
      slug: "maths-6-decimals",
      summary: "Tenths and hundredths with a firmer grip — points lined up, borrows across the point, and 12.7 versus 12.07 told apart.",
      position: 8,
      translations: {
        hi: {
          name: "दशमलव",
          summary: "दसवें और सौवें, अब मज़बूत पकड़ से — सीध में बिंदियाँ, बिंदी के आर-पार हासिल, और 12.7 बनाम 12.07 का फ़र्क़।",
        },
        mr: {
          name: "दशांश",
          summary: "दशांश आणि शतांश, आता पक्क्या पकडीने — सरळ रेषेतली टिंबे, टिंबापारचे हातचे, आणि 12.7 विरुद्ध 12.07 चा ओळखलेला फरक.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Ratio and Proportion (fair shares and the unitary method)    */
/* ------------------------------------------------------------------------- */
function ratioAndProportion(): TopicFileOut {
  const rand = rng("maths-6-ratio-and-proportion");
  const qs: OutQuestion[] = [];

  const mF = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });
  const rupeesF = (n: number) => ({ en: `₹${n}`, hi: `₹${n}`, mr: `₹${n}` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "₹40 is divided between two children in the ratio 3 : 1. How much is the BIGGER share?",
          hi: "₹40 दो बच्चों में 3 : 1 के अनुपात में बाँटे गए। बड़ा हिस्सा कितना है?",
          mr: "₹40 दोन मुलांत 3 : 1 प्रमाणात वाटले. मोठा वाटा किती?",
        },
        answer: 30,
        wrong: [10, 20, 13],
        checkExpr: "40*3/4",
        solution: {
          en: "3 : 1 makes 4 equal parts; each part is 40 ÷ 4 = ₹10, and the bigger share takes 3 of them: ₹30. 20 splits evenly, ignoring the ratio the question set.",
          hi: "3 : 1 यानी 4 बराबर हिस्से; हर हिस्सा 40 ÷ 4 = ₹10, और बड़ा भाग 3 हिस्से लेता है: ₹30। 20 बराबर बाँट देता है — सवाल का रखा अनुपात अनदेखा।",
          mr: "3 : 1 म्हणजे 4 सारखे भाग; प्रत्येक भाग 40 ÷ 4 = ₹10, आणि मोठा वाटा 3 भाग घेतो: ₹30. 20 सारखे वाटते — प्रश्नाने दिलेले प्रमाण दुर्लक्षून.",
        },
        fmt: rupeesF,
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Write the ratio 6 : 8 in its simplest form. What is the FIRST term?",
          hi: "अनुपात 6 : 8 को सरलतम रूप में लिखिए। पहला पद क्या है?",
          mr: "6 : 8 हे गुणोत्तर सोप्या रूपात लिहा. पहिले पद किती?",
        },
        answer: 3,
        wrong: [6, 2, 4],
        checkExpr: "6/2",
        solution: {
          en: "Divide both terms by their HCF 2: 6 : 8 = 3 : 4. A ratio simplifies exactly like a fraction — same relationship, smallest words.",
          hi: "दोनों पदों को उनके म.स. 2 से बाँटिए: 6 : 8 = 3 : 4। अनुपात ठीक भिन्न की तरह सरल होता है — वही रिश्ता, सबसे छोटे शब्दों में।",
          mr: "दोन्ही पदांना त्यांच्या म.सा.वि. 2 ने भागा: 6 : 8 = 3 : 4. गुणोत्तर नेमके अपूर्णांकासारखे सोपे होते — तेच नाते, सर्वांत लहान शब्दांत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A khichdi recipe takes 2 cups of rice for every 1 cup of dal. For 6 cups of rice, how much dal?",
          hi: "खिचड़ी में हर 1 कप दाल पर 2 कप चावल लगते हैं। 6 कप चावल के लिए कितनी दाल?",
          mr: "खिचडीत दर 1 कप डाळीला 2 कप तांदूळ लागतात. 6 कप तांदळासाठी किती डाळ?",
        },
        answer: 3,
        wrong: [12, 6, 4],
        checkExpr: "6/2",
        solution: {
          en: "Rice : dal = 2 : 1, so dal is always half the rice: 6 ÷ 2 = 3 cups. 12 doubles instead — that khichdi would be mostly dal.",
          hi: "चावल : दाल = 2 : 1, तो दाल हमेशा चावल की आधी: 6 ÷ 2 = 3 कप। 12 दुगना कर देता है — वह खिचड़ी दाल ही दाल होती।",
          mr: "तांदूळ : डाळ = 2 : 1, म्हणून डाळ नेहमी तांदळाच्या निम्मी: 6 ÷ 2 = 3 कप. 12 दुप्पट करते — ती खिचडी डाळच डाळ झाली असती.",
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
          en: "15 identical pens cost ₹45. What does ONE pen cost?",
          hi: "15 एक-जैसे पेन ₹45 के हैं। एक पेन कितने का है?",
          mr: "15 सारखी पेने ₹45 ला आहेत. एक पेन किती रुपयांना?",
        },
        answer: 3,
        wrong: [30, 45, 15],
        checkExpr: "45/15",
        solution: {
          en: "45 ÷ 15 = ₹3 each — the unitary method's first step: find the price of ONE. From there any number of pens is one multiplication away.",
          hi: "45 ÷ 15 = ₹3 प्रति पेन — ऐकिक विधि का पहला क़दम: एक का दाम निकालिए। वहाँ से किसी भी गिनती का दाम एक गुणा दूर है।",
          mr: "45 ÷ 15 = ₹3 प्रत्येकी — एकमान पद्धतीचे पहिले पाऊल: एकाची किंमत काढा. तिथून कितीही पेनांची किंमत एका गुणाकारावर आहे.",
        },
        fmt: rupeesF,
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the ratio of 45 minutes to 1 hour, in simplest form 3 : ▢?",
          hi: "45 मिनट का 1 घंटे से अनुपात, सरलतम रूप 3 : ▢ में, क्या है?",
          mr: "45 मिनिटांचे 1 तासाशी गुणोत्तर, सोप्या रूपात 3 : ▢, किती?",
        },
        answer: 4,
        wrong: [60, 1, 15],
        checkExpr: "60/15",
        solution: {
          en: "Same units first: 1 hour = 60 minutes, so the ratio is 45 : 60 = 3 : 4 (both ÷ 15). A ratio of minutes to hours unconverted is not a ratio at all.",
          hi: "पहले इकाइयाँ एक कीजिए: 1 घंटा = 60 मिनट, तो अनुपात 45 : 60 = 3 : 4 (दोनों ÷ 15)। बिना बदले मिनट-से-घंटे का अनुपात अनुपात है ही नहीं।",
          mr: "आधी एकके सारखी करा: 1 तास = 60 मिनिटे, म्हणून गुणोत्तर 45 : 60 = 3 : 4 (दोन्ही ÷ 15). न बदललेले मिनिट-ते-तास गुणोत्तर हे गुणोत्तरच नव्हे.",
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
          en: "4 kg of sugar costs ₹96. What do 7 kg cost at the same rate?",
          hi: "4 किलो चीनी ₹96 की है। उसी भाव पर 7 किलो के कितने लगेंगे?",
          mr: "4 किलो साखर ₹96 ला आहे. त्याच भावाने 7 किलोला किती लागतील?",
        },
        answer: 168,
        wrong: [672, 99, 144],
        checkExpr: "96/4*7",
        solution: {
          en: "One kg first: 96 ÷ 4 = ₹24; then 7 kg: 24 × 7 = ₹168. 672 multiplies 96 by 7 as if 96 were the price of ONE kg — the unitary step exists to prevent exactly that.",
          hi: "पहले एक किलो: 96 ÷ 4 = ₹24; फिर 7 किलो: 24 × 7 = ₹168। 672 छियानवे को 7 से गुणा करता है मानो 96 एक किलो का दाम हो — ऐकिक क़दम ठीक इसी से बचाता है।",
          mr: "आधी एक किलो: 96 ÷ 4 = ₹24; मग 7 किलो: 24 × 7 = ₹168. 672 शहाण्णवला 7 ने गुणते जणू 96 ही एका किलोची किंमत — एकमान पाऊल नेमके यापासून वाचवते.",
        },
        fmt: rupeesF,
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "On a plan drawn at the ratio 1 : 100, a wall is 5 cm long. How long is the real wall, in centimetres?",
          hi: "1 : 100 के अनुपात पर बने नक़्शे में दीवार 5 सेमी है। असली दीवार कितने सेंटीमीटर लंबी है?",
          mr: "1 : 100 प्रमाणात काढलेल्या आराखड्यात भिंत 5 सेमी आहे. खरी भिंत किती सेंटिमीटर लांब?",
        },
        answer: 500,
        wrong: [105, 50, 5000],
        checkExpr: "5*100",
        solution: {
          en: "1 : 100 means every drawn centimetre is 100 real ones: 5 × 100 = 500 cm — a 5 m wall. 105 adds the ratio; ratios scale, they never add.",
          hi: "1 : 100 यानी हर खिंचा सेंटीमीटर 100 असली के बराबर: 5 × 100 = 500 सेमी — 5 मीटर की दीवार। 105 अनुपात जोड़ देता है; अनुपात मापते हैं, जुड़ते कभी नहीं।",
          mr: "1 : 100 म्हणजे प्रत्येक काढलेला सेंटिमीटर 100 खऱ्यांच्या बरोबरीचा: 5 × 100 = 500 सेमी — 5 मीटरची भिंत. 105 गुणोत्तर मिळवते; गुणोत्तरे मोजतात, कधीच मिळत नाहीत.",
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
          en: "35 sweets are shared between a brother and sister in the ratio 4 : 3. How many does the sister (the SMALLER share) get?",
          hi: "35 मिठाइयाँ भाई-बहन में 4 : 3 के अनुपात में बँटीं। बहन (छोटा हिस्सा) को कितनी मिलीं?",
          mr: "35 मिठाया भाऊ-बहिणीत 4 : 3 प्रमाणात वाटल्या. बहिणीला (लहान वाटा) किती मिळाल्या?",
        },
        answer: 15,
        wrong: [20, 12, 17],
        checkExpr: "35*3/7",
        solution: {
          en: "4 + 3 = 7 parts; each part is 35 ÷ 7 = 5 sweets; the sister's 3 parts are 15 (the brother's 4 are 20 — and 15 + 20 = 35, the check). 17 tries to split near-evenly, which no ratio of 4 : 3 allows.",
          hi: "4 + 3 = 7 हिस्से; हर हिस्सा 35 ÷ 7 = 5 मिठाइयाँ; बहन के 3 हिस्से यानी 15 (भाई के 4 यानी 20 — और 15 + 20 = 35, जाँच पूरी)। 17 लगभग बराबर बाँटने चलता है, जो 4 : 3 का अनुपात होने ही नहीं देता।",
          mr: "4 + 3 = 7 भाग; प्रत्येक भाग 35 ÷ 7 = 5 मिठाया; बहिणीचे 3 भाग म्हणजे 15 (भावाचे 4 म्हणजे 20 — आणि 15 + 20 = 35, तपासणी पूर्ण). 17 जवळजवळ सारखे वाटू पाहते, जे 4 : 3 चे प्रमाण होऊच देत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "To check whether 2 : 3 and 8 : 12 are in proportion, cross-multiply. What is 2 × 12?",
          hi: "2 : 3 और 8 : 12 समानुपात में हैं या नहीं, जाँचने को तिर्यक् गुणा कीजिए। 2 × 12 क्या है?",
          mr: "2 : 3 आणि 8 : 12 प्रमाणात आहेत का तपासायला तिर्यक् गुणाकार करा. 2 × 12 किती?",
        },
        answer: 24,
        wrong: [36, 16, 6],
        checkExpr: "2*12",
        solution: {
          en: "2 × 12 = 24 — and the other cross, 3 × 8, is also 24. Equal crosses mean the ratios truly match: 8 : 12 is just 2 : 3 grown four times. One unequal cross would have ended the friendship.",
          hi: "2 × 12 = 24 — और दूसरा तिर्यक्, 3 × 8, भी 24। बराबर तिर्यक् यानी अनुपात सचमुच मिलते हैं: 8 : 12 बस 2 : 3 का चौगुना है। एक भी असमान तिर्यक् दोस्ती तोड़ देता।",
          mr: "2 × 12 = 24 — आणि दुसरा तिर्यक्, 3 × 8, सुद्धा 24. सारखे तिर्यक् म्हणजे गुणोत्तरे खरोखर जुळतात: 8 : 12 म्हणजे 2 : 3 चेच चौपट. एकही असमान तिर्यक् मैत्री मोडला असता.",
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
          en: "A car covers 240 km on 15 litres of petrol. How many kilometres per litre is that?",
          hi: "एक कार 15 लीटर पेट्रोल में 240 किमी चलती है। यह कितने किलोमीटर प्रति लीटर हुआ?",
          mr: "एक गाडी 15 लिटर पेट्रोलमध्ये 240 किमी जाते. ते किती किलोमीटर प्रति लिटर?",
        },
        answer: 16,
        wrong: [225, 12, 24],
        checkExpr: "240/15",
        solution: {
          en: "240 ÷ 15 = 16 km per litre — the unitary rate that lets you cost ANY journey. 225 subtracts the litres from the kilometres, mixing two different kinds of thing.",
          hi: "240 ÷ 15 = 16 किमी प्रति लीटर — वह ऐकिक दर जिससे किसी भी सफ़र का हिसाब लगे। 225 किलोमीटर में से लीटर घटा देता है — दो अलग क़िस्म की चीज़ें गड्डमड्ड।",
          mr: "240 ÷ 15 = 16 किमी प्रति लिटर — ज्याने कोणत्याही प्रवासाचा हिशेब लागतो तो एकमान दर. 225 किलोमीटरमधून लिटर वजा करते — दोन वेगळ्या जातींच्या गोष्टींची गल्लत.",
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
          en: "At four o'clock a 6 m flagpole casts a 4 m shadow. At the same moment, the water-tank tower's shadow measures 20 m. How tall is the tower?",
          hi: "चार बजे 6 मीटर का ध्वज-स्तंभ 4 मीटर की छाया डालता है। उसी क्षण पानी की टंकी की मीनार की छाया 20 मीटर है। मीनार कितनी ऊँची है?",
          mr: "चार वाजता 6 मीटरचा ध्वजस्तंभ 4 मीटरची सावली टाकतो. त्याच क्षणी पाण्याच्या टाकीच्या मनोऱ्याची सावली 20 मीटर भरते. मनोरा किती उंच?",
        },
        answer: 30,
        wrong: [22, 120, 13],
        checkExpr: "6*20/4",
        solution: {
          en: "At one moment the sun gives everything the same height-to-shadow ratio: 6 : 4 = 3 : 2. The tower keeps it: height = 20 × 3/2 = 30 m. 22 adds the pole's extra to the shadow — but shadows scale, they do not add. One stick and one sum measure what no ladder could.",
          hi: "एक ही क्षण में सूरज सबको एक-सा ऊँचाई-छाया अनुपात देता है: 6 : 4 = 3 : 2। मीनार उसे निभाती है: ऊँचाई = 20 × 3/2 = 30 मीटर। 22 खंभे का फ़र्क़ छाया में जोड़ देता है — पर छायाएँ मापती हैं, जुड़ती नहीं। एक डंडा और एक हिसाब वह नाप लेते हैं जो कोई सीढ़ी न नाप पाती।",
          mr: "एकाच क्षणी सूर्य साऱ्यांना सारखेच उंची-सावली प्रमाण देतो: 6 : 4 = 3 : 2. मनोरा ते पाळतो: उंची = 20 × 3/2 = 30 मीटर. 22 खांबाचा फरक सावलीत मिळवते — पण सावल्या मोजतात, मिळत नाहीत. एक काठी आणि एक हिशेब ते मोजतात जे कोणतीही शिडी मोजू शकली नसती.",
        },
        fmt: mF,
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 12 — Ratio and Proportion",
      name: "Ratio and Proportion",
      slug: "maths-6-ratio-and-proportion",
      summary: "Fair shares by parts, the unitary method, cross-checks of proportion — and a flagpole's shadow that measures a tower.",
      position: 12,
      translations: {
        hi: {
          name: "अनुपात और समानुपात",
          summary: "हिस्सों से न्यायपूर्ण बँटवारे, ऐकिक विधि, समानुपात की तिर्यक् जाँच — और खंभे की वह छाया जो मीनार नाप लेती है।",
        },
        mr: {
          name: "गुणोत्तर आणि प्रमाण",
          summary: "भागांनी न्याय्य वाटण्या, एकमान पद्धत, प्रमाणाची तिर्यक् तपासणी — आणि मनोरा मोजणारी खांबाची सावली.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Whole Numbers (zero joins, and the laws that speed sums)      */
/* ------------------------------------------------------------------------- */
function wholeNumbers(): TopicFileOut {
  const rand = rng("maths-6-whole-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the smallest whole number?",
          hi: "सबसे छोटी पूर्ण संख्या कौन-सी है?",
          mr: "सर्वांत लहान पूर्ण संख्या कोणती?",
        },
        answer: 0,
        wrong: [1, -1, 2],
        solution: {
          en: "Whole numbers begin at 0 — the naturals' 1, 2, 3… with zero welcomed in. −1 belongs to the integers, one chapter later.",
          hi: "पूर्ण संख्याएँ 0 से शुरू होती हैं — प्राकृत 1, 2, 3… में शून्य का स्वागत। −1 पूर्णांकों का है, एक अध्याय बाद।",
          mr: "पूर्ण संख्या 0 पासून सुरू होतात — नैसर्गिक 1, 2, 3… मध्ये शून्याचे स्वागत. −1 पूर्णांकांचा, एक प्रकरण नंतर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the predecessor of 1000?",
          hi: "1000 की पूर्ववर्ती (पिछली) संख्या क्या है?",
          mr: "1000 ची मागील संख्या कोणती?",
        },
        answer: 999,
        wrong: [1001, 990, 100],
        checkExpr: "1000-1",
        solution: {
          en: "One step back: 1000 − 1 = 999 — the thousand unrolls into three nines. 1001 walks forward to the successor instead.",
          hi: "एक क़दम पीछे: 1000 − 1 = 999 — हज़ार खुलकर तीन नौ बन जाता है। 1001 आगे बढ़कर परवर्ती पर पहुँच जाता है।",
          mr: "एक पाऊल मागे: 1000 − 1 = 999 — हजार उलगडून तीन नऊ होतो. 1001 पुढे जाऊन पुढील संख्येवर पोहोचते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 17 + 0?",
          hi: "17 + 0 कितना है?",
          mr: "17 + 0 किती?",
        },
        answer: 17,
        wrong: [0, 170, 18],
        checkExpr: "17+0",
        solution: {
          en: "Adding zero changes nothing: 17 + 0 = 17 — zero is addition's identity, the guest who eats nothing. 170 multiplies by ten instead.",
          hi: "शून्य जोड़ने से कुछ नहीं बदलता: 17 + 0 = 17 — शून्य जोड़ का तत्समक है, वह मेहमान जो कुछ नहीं खाता। 170 दस से गुणा कर बैठता है।",
          mr: "शून्य मिळवल्याने काही बदलत नाही: 17 + 0 = 17 — शून्य बेरजेचा अविकारक, काहीही न खाणारा पाहुणा. 170 दहाने गुणते.",
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
          en: "What is 25 × 1?",
          hi: "25 × 1 कितना है?",
          mr: "25 × 1 किती?",
        },
        answer: 25,
        wrong: [1, 26, 251],
        checkExpr: "25*1",
        solution: {
          en: "Multiplying by one changes nothing: 25 × 1 = 25 — one is multiplication's identity, as zero is addition's. 26 adds the one instead.",
          hi: "एक से गुणा करने पर कुछ नहीं बदलता: 25 × 1 = 25 — एक गुणा का तत्समक है, जैसे शून्य जोड़ का। 26 एक को जोड़ देता है।",
          mr: "एकने गुणल्याने काही बदलत नाही: 25 × 1 = 25 — एक हा गुणाकाराचा अविकारक, जसा शून्य बेरजेचा. 26 एक मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "To find 4 × 1768 × 25 quickly, pair the easy two first. What is 4 × 25?",
          hi: "4 × 1768 × 25 झटपट निकालने के लिए पहले आसान जोड़ी बनाइए। 4 × 25 क्या है?",
          mr: "4 × 1768 × 25 झटपट काढायला आधी सोपी जोडी करा. 4 × 25 किती?",
        },
        answer: 100,
        wrong: [29, 425, 1768],
        checkExpr: "4*25",
        solution: {
          en: "4 × 25 = 100, and then 100 × 1768 = 1,76,800 in one breath. The commutative law lets factors change partners — always marry the pair that makes a hundred.",
          hi: "4 × 25 = 100, और फिर 100 × 1768 = 1,76,800 एक साँस में। क्रम-विनिमेय नियम गुणनखंडों को जोड़ीदार बदलने देता है — हमेशा वही जोड़ी बनाइए जो सौ बनाए।",
          mr: "4 × 25 = 100, आणि मग 100 × 1768 = 1,76,800 एका दमात. क्रमनिरपेक्ष नियम अवयवांना जोडीदार बदलू देतो — नेहमी शंभर करणारी जोडी जुळवा.",
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
          en: "Use distributivity to find 6 × 105 as 6 × 100 + 6 × 5.",
          hi: "वितरण नियम से 6 × 105 को 6 × 100 + 6 × 5 की तरह निकालिए।",
          mr: "वितरण नियमाने 6 × 105 हे 6 × 100 + 6 × 5 असे काढा.",
        },
        answer: 630,
        wrong: [605, 660, 530],
        checkExpr: "6*105",
        solution: {
          en: "6 × 100 = 600 and 6 × 5 = 30: together 630. Distributivity splits an awkward number into friendly parts, multiplies each, and re-joins — 605 forgets to multiply the 5's part.",
          hi: "6 × 100 = 600 और 6 × 5 = 30: मिलाकर 630। वितरण नियम अटपटी संख्या को सुविधाजनक हिस्सों में तोड़ता है, हर एक को गुणता है, फिर जोड़ता है — 605 पाँच वाले हिस्से का गुणा भूल जाता है।",
          mr: "6 × 100 = 600 आणि 6 × 5 = 30: मिळून 630. वितरण नियम अवघड संख्या सोयीच्या भागांत फोडतो, प्रत्येकाला गुणतो, पुन्हा जोडतो — 605 पाचाच्या भागाचा गुणाकार विसरते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Add 1962 + 453 + 38 the clever way — group 1962 with 38 first.",
          hi: "1962 + 453 + 38 चतुराई से जोड़िए — पहले 1962 को 38 के साथ मिलाइए।",
          mr: "1962 + 453 + 38 हुशारीने मिळवा — आधी 1962 ला 38 शी जोडा.",
        },
        answer: 2453,
        wrong: [2353, 2443, 2463],
        checkExpr: "1962+453+38",
        solution: {
          en: "1962 + 38 = 2000, a round friend, and 2000 + 453 = 2453. Associativity lets addends regroup — spot the pair that completes a round number and the sum does itself.",
          hi: "1962 + 38 = 2000, एक गोल दोस्त, और 2000 + 453 = 2453। साहचर्य नियम जोड़ के पदों को फिर से गुटबद्ध होने देता है — गोल संख्या पूरी करने वाली जोड़ी पकड़िए, योग ख़ुद हो जाता है।",
          mr: "1962 + 38 = 2000, एक गोल मित्र, आणि 2000 + 453 = 2453. साहचर्य नियम बेरजेच्या पदांना पुन्हा गट करू देतो — गोल संख्या पूर्ण करणारी जोडी हेरा, बेरीज आपोआप होते.",
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
          en: "On the number line, start at 3 and make two jumps of +4 each. Where do you land?",
          hi: "संख्या-रेखा पर 3 से चलकर +4 की दो छलाँगें लगाइए। कहाँ उतरेंगे?",
          mr: "संख्यारेषेवर 3 पासून +4 च्या दोन उड्या मारा. कुठे उतराल?",
        },
        answer: 11,
        wrong: [7, 12, 10],
        checkExpr: "3+4+4",
        solution: {
          en: "3 → 7 → 11: each jump of 4 is one addition made visible. 7 stops after a single jump — the number line keeps honest count of both.",
          hi: "3 → 7 → 11: 4 की हर छलाँग एक दिखता हुआ जोड़ है। 7 एक ही छलाँग पर रुक जाता है — संख्या-रेखा दोनों का ईमानदार हिसाब रखती है।",
          mr: "3 → 7 → 11: 4 ची प्रत्येक उडी म्हणजे एक दिसणारी बेरीज. 7 एकाच उडीवर थांबते — संख्यारेषा दोन्हींचा प्रामाणिक हिशेब ठेवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Find 97 × 8 by treating 97 as (100 − 3).",
          hi: "97 को (100 − 3) मानकर 97 × 8 निकालिए।",
          mr: "97 ला (100 − 3) मानून 97 × 8 काढा.",
        },
        answer: 776,
        wrong: [800, 824, 766],
        checkExpr: "97*8",
        solution: {
          en: "(100 − 3) × 8 = 800 − 24 = 776. 800 forgets to give back the 3 eights; 824 adds them instead of subtracting. Numbers near a hundred multiply best by that hundred, minus the small correction.",
          hi: "(100 − 3) × 8 = 800 − 24 = 776। 800 तीन आठों को लौटाना भूल जाता है; 824 घटाने की जगह जोड़ देता है। सौ के पास की संख्याएँ उसी सौ से, छोटे सुधार समेत, सबसे अच्छा गुणा होती हैं।",
          mr: "(100 − 3) × 8 = 800 − 24 = 776. 800 तीन आठ परत द्यायला विसरते; 824 वजा करण्याऐवजी मिळवते. शंभराजवळच्या संख्या त्याच शंभराने, लहान दुरुस्तीसह, सर्वोत्तम गुणल्या जातात.",
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
          en: "Add the first five whole numbers: 0 + 1 + 2 + 3 + 4.",
          hi: "पहली पाँच पूर्ण संख्याएँ जोड़िए: 0 + 1 + 2 + 3 + 4।",
          mr: "पहिल्या पाच पूर्ण संख्या मिळवा: 0 + 1 + 2 + 3 + 4.",
        },
        answer: 10,
        wrong: [15, 9, 5],
        checkExpr: "0+1+2+3+4",
        solution: {
          en: "Pair the ends: 0 + 4 and 1 + 3 make two fours, plus the lone 2: 4 + 4 + 2 = 10. 15 sums 1 to 5, forgetting that whole numbers begin at zero.",
          hi: "सिरों के जोड़े: 0 + 4 और 1 + 3 दो चौके, ऊपर से अकेला 2: 4 + 4 + 2 = 10। 15 एक से पाँच तक जोड़ता है — भूलकर कि पूर्ण संख्याएँ शून्य से शुरू होती हैं।",
          mr: "टोकांच्या जोड्या: 0 + 4 आणि 1 + 3 म्हणजे दोन चार, शिवाय एकटा 2: 4 + 4 + 2 = 10. 15 एक ते पाच मिळवते — पूर्ण संख्या शून्यापासून सुरू होतात हे विसरून.",
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
          en: "A milk vendor sells 32 litres in the morning and 68 litres in the evening, all at ₹45 a litre. Use distributivity — 45 × (32 + 68) — to find the day's earning.",
          hi: "दूधवाला सुबह 32 लीटर और शाम 68 लीटर बेचता है, सब ₹45 प्रति लीटर। वितरण नियम — 45 × (32 + 68) — से दिन की कमाई निकालिए।",
          mr: "दूधवाला सकाळी 32 लिटर आणि संध्याकाळी 68 लिटर विकतो, सारे ₹45 प्रति लिटर. वितरण नियमाने — 45 × (32 + 68) — दिवसाची कमाई काढा.",
        },
        answer: 4500,
        wrong: [1440, 3060, 4400],
        checkExpr: "45*(32+68)",
        solution: {
          en: "32 + 68 = 100 litres, and 45 × 100 = ₹4500 — one clean multiplication instead of two messy ones. 1440 stops at the morning; 3060 at the evening. Distributivity read BACKWARDS is the trick: gather first, multiply once.",
          hi: "32 + 68 = 100 लीटर, और 45 × 100 = ₹4500 — दो उलझे गुणों की जगह एक साफ़ गुणा। 1440 सुबह पर रुकता है; 3060 शाम पर। उलटा पढ़ा वितरण नियम ही तरकीब है: पहले बटोरिए, एक बार गुणिए।",
          mr: "32 + 68 = 100 लिटर, आणि 45 × 100 = ₹4500 — दोन किचकट गुणाकारांऐवजी एक स्वच्छ. 1440 सकाळवर थांबते; 3060 संध्याकाळवर. उलटे वाचलेला वितरण नियम हीच युक्ती: आधी गोळा करा, एकदाच गुणा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 2 — Whole Numbers",
      name: "Whole Numbers",
      slug: "maths-6-whole-numbers",
      summary: "Zero joins the numbers, and the laws — commutative, associative, distributive — turn long sums into short ones.",
      position: 2,
      translations: {
        hi: {
          name: "पूर्ण संख्याएँ",
          summary: "शून्य संख्याओं में शामिल होता है, और नियम — क्रम-विनिमेय, साहचर्य, वितरण — लंबे हिसाबों को छोटा कर देते हैं।",
        },
        mr: {
          name: "पूर्ण संख्या",
          summary: "शून्य संख्यांत सामील होतो, आणि नियम — क्रमनिरपेक्ष, साहचर्य, वितरण — लांब हिशेब आखूड करतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Basic Geometrical Ideas (points, lines and what they make)    */
/* ------------------------------------------------------------------------- */
function basicGeometricalIdeas(): TopicFileOut {
  const rand = rng("maths-6-basic-geometrical-ideas");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many end-points does a line SEGMENT have?",
          hi: "रेखाखंड के कितने अंत्य-बिंदु होते हैं?",
          mr: "रेषाखंडाला किती अंत्यबिंदू असतात?",
        },
        answer: 2,
        wrong: [0, 1, 3],
        solution: {
          en: "A segment is the piece of a line between two fixed ends — 2 end-points. A full line has none (it runs on both ways) and a ray has exactly one.",
          hi: "रेखाखंड दो जड़े सिरों के बीच की रेखा का टुकड़ा है — 2 अंत्य-बिंदु। पूरी रेखा का कोई नहीं (वह दोनों ओर चलती है) और किरण का ठीक एक।",
          mr: "रेषाखंड म्हणजे दोन ठरलेल्या टोकांमधला रेषेचा तुकडा — 2 अंत्यबिंदू. पूर्ण रेषेला एकही नाही (ती दोन्हीकडे धावते) आणि किरणाला नेमका एक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many end-points does a RAY have?",
          hi: "किरण के कितने अंत्य-बिंदु होते हैं?",
          mr: "किरणाला किती अंत्यबिंदू असतात?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        solution: {
          en: "A ray starts at one point and runs forever the other way — exactly 1 end-point, like a torch beam from the torch. 2 describes a segment; 0 a full line.",
          hi: "किरण एक बिंदु से शुरू होकर दूसरी ओर अनंत तक चलती है — ठीक 1 अंत्य-बिंदु, जैसे टॉर्च से निकलती रोशनी। 2 रेखाखंड की बात है; 0 पूरी रेखा की।",
          mr: "किरण एका बिंदूपासून सुरू होऊन दुसरीकडे अनंतापर्यंत धावतो — नेमका 1 अंत्यबिंदू, टॉर्चमधून निघणाऱ्या झोतासारखा. 2 रेषाखंडाचे; 0 पूर्ण रेषेचे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Through two distinct points, how many straight lines can be drawn?",
          hi: "दो भिन्न बिंदुओं से होकर कितनी सीधी रेखाएँ खींची जा सकती हैं?",
          mr: "दोन वेगळ्या बिंदूंतून किती सरळ रेषा काढता येतात?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        solution: {
          en: "Exactly one — two points pin a line down completely. Through a SINGLE point, though, lines pass beyond counting; the second point is what ends the freedom.",
          hi: "ठीक एक — दो बिंदु रेखा को पूरी तरह जकड़ देते हैं। हाँ, एक अकेले बिंदु से अनगिनत रेखाएँ गुज़रती हैं; आज़ादी दूसरा बिंदु ही ख़त्म करता है।",
          mr: "नेमकी एक — दोन बिंदू रेषेला पूर्ण जखडतात. एकट्या बिंदूतून मात्र अगणित रेषा जातात; स्वातंत्र्य दुसरा बिंदूच संपवतो.",
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
          en: "How many vertices does a triangle have?",
          hi: "त्रिभुज के कितने शीर्ष होते हैं?",
          mr: "त्रिकोणाला किती शिरोबिंदू असतात?",
        },
        answer: 3,
        wrong: [2, 4, 6],
        solution: {
          en: "Three sides meet pairwise at 3 corners — vertices. 6 counts sides AND vertices together; they always match in count but are different things.",
          hi: "तीन भुजाएँ जोड़ी-जोड़ी 3 कोनों पर मिलती हैं — यही शीर्ष हैं। 6 भुजाएँ और शीर्ष साथ गिन लेता है; गिनती में वे हमेशा बराबर हैं, पर चीज़ें अलग।",
          mr: "तीन बाजू जोडीजोडीने 3 कोपऱ्यांवर मिळतात — हेच शिरोबिंदू. 6 बाजू आणि शिरोबिंदू एकत्र मोजते; संख्येने ते नेहमी सारखे, पण गोष्टी वेगळ्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many diagonals does a quadrilateral have?",
          hi: "चतुर्भुज के कितने विकर्ण होते हैं?",
          mr: "चौकोनाला किती कर्ण असतात?",
        },
        answer: 2,
        wrong: [4, 1, 3],
        solution: {
          en: "A diagonal joins two vertices that are NOT neighbours — a quadrilateral's two such pairs give 2 diagonals, crossing inside. 4 counts the sides, which join neighbours.",
          hi: "विकर्ण उन दो शीर्षों को जोड़ता है जो पड़ोसी नहीं — चतुर्भुज की ऐसी दो जोड़ियाँ 2 विकर्ण देती हैं, भीतर कटते हुए। 4 भुजाएँ गिनता है, जो पड़ोसियों को जोड़ती हैं।",
          mr: "कर्ण शेजारी नसलेल्या दोन शिरोबिंदूंना जोडतो — चौकोनाच्या अशा दोन जोड्या 2 कर्ण देतात, आत छेदणारे. 4 बाजू मोजते, ज्या शेजाऱ्यांना जोडतात.",
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
          en: "Two parallel lines run side by side forever. How many points do they share?",
          hi: "दो समांतर रेखाएँ सदा साथ-साथ चलती हैं। वे कितने बिंदु साझा करती हैं?",
          mr: "दोन समांतर रेषा सदैव शेजारी शेजारी धावतात. त्या किती बिंदू वाटून घेतात?",
        },
        answer: 0,
        wrong: [1, 2, 100],
        solution: {
          en: "Parallel means never meeting: 0 common points, like rails that hold their gap to the horizon. 1 shared point is what INTERSECTING lines have.",
          hi: "समांतर यानी कभी न मिलना: 0 साझा बिंदु, उन पटरियों-सा जो क्षितिज तक अपना फ़ासला निभाती हैं। 1 साझा बिंदु तो प्रतिच्छेदी रेखाओं का है।",
          mr: "समांतर म्हणजे कधीही न मिळणे: 0 सामाईक बिंदू, क्षितिजापर्यंत आपले अंतर पाळणाऱ्या रुळांसारखे. 1 सामाईक बिंदू छेदणाऱ्या रेषांचा असतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A circle's LONGEST chord passes through the centre. If the radius is 9 cm, how long is that chord?",
          hi: "वृत्त की सबसे लंबी जीवा केंद्र से गुज़रती है। त्रिज्या 9 सेमी हो तो वह जीवा कितनी लंबी है?",
          mr: "वर्तुळाची सर्वांत लांब जीवा केंद्रातून जाते. त्रिज्या 9 सेमी असेल तर ती जीवा किती लांब?",
        },
        answer: 18,
        wrong: [9, 27, 81],
        checkExpr: "9*2",
        solution: {
          en: "The centre-chord is the diameter: 9 × 2 = 18 cm. Every other chord misses the centre and comes out shorter — the diameter is the chord family's champion.",
          hi: "केंद्र वाली जीवा व्यास है: 9 × 2 = 18 सेमी। बाक़ी हर जीवा केंद्र से चूककर छोटी रह जाती है — व्यास जीवाओं के परिवार का सरताज है।",
          mr: "केंद्रातली जीवा म्हणजे व्यास: 9 × 2 = 18 सेमी. बाकी प्रत्येक जीवा केंद्र चुकवून लहान राहते — व्यास हा जीवांच्या कुटुंबाचा शिरोमणी.",
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
          en: "Count a quadrilateral's vertices AND sides together. What total do you get?",
          hi: "चतुर्भुज के शीर्ष और भुजाएँ साथ गिनिए। कुल कितने मिले?",
          mr: "चौकोनाचे शिरोबिंदू आणि बाजू एकत्र मोजा. एकूण किती आले?",
        },
        answer: 8,
        wrong: [4, 6, 10],
        checkExpr: "4+4",
        solution: {
          en: "4 vertices + 4 sides = 8. In every polygon the two counts are equal — each side 'uses up' exactly one new vertex as you walk the boundary round.",
          hi: "4 शीर्ष + 4 भुजाएँ = 8। हर बहुभुज में दोनों गिनतियाँ बराबर होती हैं — सीमा पर चलते हुए हर भुजा ठीक एक नया शीर्ष 'ख़र्च' करती है।",
          mr: "4 शिरोबिंदू + 4 बाजू = 8. प्रत्येक बहुभुजात दोन्ही संख्या सारख्या — हद्दीवरून चालताना प्रत्येक बाजू नेमका एक नवा शिरोबिंदू 'खर्च' करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A triangle drawn on paper divides the sheet into its interior, its boundary and its exterior. How many parts is that in all?",
          hi: "काग़ज़ पर खिंचा त्रिभुज पन्ने को अपने अभ्यंतर, सीमा और बहिर्भाग में बाँटता है। कुल कितने भाग हुए?",
          mr: "कागदावर काढलेला त्रिकोण पानाला त्याचा अंतर्भाग, सीमा आणि बाह्यभाग यांत विभागतो. एकूण किती भाग झाले?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        solution: {
          en: "Three: the inside, the boundary line itself, and the outside. A point is always in exactly one of them — the boundary is a place of its own, not part of the inside.",
          hi: "तीन: भीतर, स्वयं सीमा-रेखा, और बाहर। कोई भी बिंदु ठीक इनमें से एक में होता है — सीमा अपनी अलग जगह है, भीतर का हिस्सा नहीं।",
          mr: "तीन: आतले, स्वतः सीमारेषा, आणि बाहेरचे. कोणताही बिंदू नेमका यांतल्या एकात असतो — सीमा ही स्वतःची वेगळी जागा, आतल्याचा भाग नव्हे.",
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
          en: "Four points are marked, no three in a line. How many line segments join them pair by pair?",
          hi: "चार बिंदु अंकित हैं, कोई तीन एक रेखा में नहीं। जोड़ी-जोड़ी उन्हें कितने रेखाखंड जोड़ेंगे?",
          mr: "चार बिंदू काढले आहेत, कोणतेही तीन एका रेषेत नाहीत. जोडीजोडीने त्यांना किती रेषाखंड जोडतील?",
        },
        answer: 6,
        wrong: [4, 8, 12],
        checkExpr: "4*3/2",
        solution: {
          en: "Each of the 4 points pairs with 3 others — 4 × 3 = 12 — but that counts every segment from both its ends, so halve it: 6 segments (a quadrilateral's 4 sides plus its 2 diagonals). 12 forgets that AB and BA are one segment.",
          hi: "चारों में से हर बिंदु 3 और से जोड़ी बनाता है — 4 × 3 = 12 — पर यह हर खंड को दोनों सिरों से गिनता है, तो आधा कीजिए: 6 खंड (चतुर्भुज की 4 भुजाएँ और 2 विकर्ण)। 12 भूल जाता है कि AB और BA एक ही खंड हैं।",
          mr: "चारांतला प्रत्येक बिंदू 3 इतरांशी जोडी करतो — 4 × 3 = 12 — पण हे प्रत्येक खंड दोन्ही टोकांनी मोजते, म्हणून अर्धे करा: 6 खंड (चौकोनाच्या 4 बाजू अधिक 2 कर्ण). 12 विसरते की AB आणि BA एकच खंड.",
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
          en: "Five friends stand so that no three are in a line, and every pair stretches one string between them. How many strings are needed?",
          hi: "पाँच दोस्त ऐसे खड़े हैं कि कोई तीन एक रेखा में नहीं, और हर जोड़ी अपने बीच एक डोरी तानती है। कितनी डोरियाँ चाहिए?",
          mr: "पाच मित्र असे उभे आहेत की कोणतेही तीन एका रेषेत नाहीत, आणि प्रत्येक जोडी आपल्यामध्ये एक दोरी ताणते. किती दोऱ्या लागतील?",
        },
        answer: 10,
        wrong: [5, 20, 15],
        checkExpr: "5*4/2",
        solution: {
          en: "Each of 5 friends holds strings to 4 others: 5 × 4 = 20 string-ends, and every string has two ends — 20 ÷ 2 = 10 strings. The same count answers handshakes at a party and matches in a league: pairs of n things are always n(n−1) ÷ 2.",
          hi: "पाँचों में से हर दोस्त 4 और तक डोरियाँ थामता है: 5 × 4 = 20 डोरी-सिरे, और हर डोरी के दो सिरे — 20 ÷ 2 = 10 डोरियाँ। यही गिनती दावत के हाथ-मिलान और लीग के मैच गिनती है: n चीज़ों की जोड़ियाँ हमेशा n(n−1) ÷ 2 होती हैं।",
          mr: "पाचांतला प्रत्येक मित्र 4 इतरांपर्यंत दोऱ्या धरतो: 5 × 4 = 20 दोरी-टोके, आणि प्रत्येक दोरीला दोन टोके — 20 ÷ 2 = 10 दोऱ्या. हीच मोजणी मेजवानीतले हस्तांदोलन आणि लीगमधले सामने मोजते: n गोष्टींच्या जोड्या नेहमी n(n−1) ÷ 2.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 4 — Basic Geometrical Ideas",
      name: "Basic Geometrical Ideas",
      slug: "maths-6-basic-geometrical-ideas",
      summary: "Points, segments, rays and what they build — parallel rails, champion chords, and the string-count that also counts handshakes.",
      position: 4,
      translations: {
        hi: {
          name: "आधारभूत ज्यामितीय अवधारणाएँ",
          summary: "बिंदु, रेखाखंड, किरणें और उनसे बनता संसार — समांतर पटरियाँ, सरताज जीवाएँ, और वह डोरी-गिनती जो हाथ-मिलान भी गिनती है।",
        },
        mr: {
          name: "मूलभूत भौमितिक संकल्पना",
          summary: "बिंदू, रेषाखंड, किरण आणि त्यांतून उभे जग — समांतर रूळ, शिरोमणी जीवा, आणि हस्तांदोलनेही मोजणारी दोरी-मोजणी.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Understanding Elementary Shapes (angles, triangles, solids)   */
/* ------------------------------------------------------------------------- */
function elementaryShapes(): TopicFileOut {
  const rand = rng("maths-6-elementary-shapes");
  const qs: OutQuestion[] = [];

  const deg = (n: number) => ({ en: `${n}°`, hi: `${n}°`, mr: `${n}°` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "At 9 o'clock, what angle do the clock's hands make?",
          hi: "9 बजे घड़ी की सुइयाँ कौन-सा कोण बनाती हैं?",
          mr: "9 वाजता घड्याळाचे काटे कोणता कोन करतात?",
        },
        answer: 90,
        wrong: [180, 45, 270],
        checkExpr: "30*3",
        fmt: deg,
        solution: {
          en: "From 12 back to 9 is three hour-steps of 30° each: a right angle of 90°. The clock shows right angles twice on the hour — at 3 and at 9.",
          hi: "12 से 9 तक 30°-30° के तीन घंटा-क़दम: 90° का समकोण। घड़ी पूरे घंटों पर दो बार समकोण दिखाती है — 3 और 9 बजे।",
          mr: "12 पासून 9 पर्यंत 30°-30° ची तीन तास-पावले: 90° चा काटकोन. घड्याळ पूर्ण तासांना दोनदा काटकोन दाखवते — 3 आणि 9 वाजता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many right angles fit in one straight angle?",
          hi: "एक ऋजु (सीधे) कोण में कितने समकोण समाते हैं?",
          mr: "एका सरळ कोनात किती काटकोन मावतात?",
        },
        answer: 2,
        wrong: [1, 4, 3],
        checkExpr: "180/90",
        solution: {
          en: "A straight angle is 180° and a right angle 90°: exactly 2 fit — the corner of a book laid twice makes a flat line. 4 fills the whole turn, not the straight one.",
          hi: "ऋजु कोण 180° और समकोण 90°: ठीक 2 समाते हैं — किताब का कोना दो बार रखने पर सीधी रेखा बनती है। 4 पूरे चक्कर को भरता है, ऋजु को नहीं।",
          mr: "सरळ कोन 180° आणि काटकोन 90°: नेमके 2 मावतात — पुस्तकाचा कोपरा दोनदा ठेवला की सरळ रेषा होते. 4 पूर्ण फेरी भरते, सरळ कोन नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A scalene triangle has how many EQUAL sides?",
          hi: "विषमबाहु त्रिभुज की कितनी बराबर भुजाएँ होती हैं?",
          mr: "विषमभुज त्रिकोणाच्या किती बाजू सारख्या असतात?",
        },
        answer: 0,
        wrong: [2, 3, 1],
        solution: {
          en: "Scalene means all three sides differ — 0 equal pairs. Two equal sides make it isosceles; three make it equilateral: the triangle family sorted by equality.",
          hi: "विषमबाहु यानी तीनों भुजाएँ अलग — 0 बराबर। दो बराबर हों तो समद्विबाहु; तीनों बराबर तो समबाहु: बराबरी से छँटा त्रिभुज-परिवार।",
          mr: "विषमभुज म्हणजे तिन्ही बाजू वेगळ्या — 0 सारख्या. दोन सारख्या तर समद्विभुज; तिन्ही सारख्या तर समभुज: समानतेने लावलेले त्रिकोण-कुटुंब.",
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
          en: "Which of these could be the measure of an ACUTE angle?",
          hi: "इनमें से कौन-सा माप न्यून कोण का हो सकता है?",
          mr: "यांपैकी कोणते माप लघुकोनाचे असू शकते?",
        },
        answer: 35,
        wrong: [90, 120, 180],
        fmt: deg,
        solution: {
          en: "Acute lives strictly below 90°: 35° qualifies. 90° is right, 120° obtuse, 180° straight — each band of degrees has its own name.",
          hi: "न्यून कोण 90° से नीचे ही बसता है: 35° ठीक है। 90° समकोण, 120° अधिक, 180° ऋजु — अंशों की हर पट्टी का अपना नाम है।",
          mr: "लघुकोन 90° च्या खालीच राहतो: 35° बरोबर. 90° काटकोन, 120° विशाल, 180° सरळ — अंशांच्या प्रत्येक पट्ट्याला स्वतःचे नाव.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many FLAT faces does a cylinder have?",
          hi: "बेलन के कितने चपटे फलक होते हैं?",
          mr: "दंडगोलाला किती सपाट पृष्ठे असतात?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        solution: {
          en: "The two circular ends are flat; the side is one curved wrap. A tin of ghee shows it: two lids' worth of flat, one label's worth of curve.",
          hi: "दोनों गोल सिरे चपटे हैं; बग़ल एक घुमावदार लपेट है। घी का डिब्बा यही दिखाता है: दो ढक्कनों जितना चपटा, एक लेबल जितना घुमाव।",
          mr: "दोन्ही गोल टोके सपाट; बाजू एक वक्र गुंडाळी. तुपाचा डबा हेच दाखवतो: दोन झाकणांइतके सपाट, एका लेबलाइतका वक्र.",
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
          en: "A REFLEX angle opens past the straight line. Which of these is reflex?",
          hi: "प्रतिवर्ती कोण सीधी रेखा के पार खुलता है। इनमें से प्रतिवर्ती कौन-सा है?",
          mr: "प्रविशाल कोन सरळ रेषेच्या पलीकडे उघडतो. यांपैकी प्रविशाल कोणता?",
        },
        answer: 200,
        wrong: [90, 45, 180],
        fmt: deg,
        solution: {
          en: "Reflex means between 180° and 360°: 200° qualifies — the angle you turn through when you look 'the long way round'. 180° itself is exactly straight, on the border but not past it.",
          hi: "प्रतिवर्ती यानी 180° और 360° के बीच: 200° ठीक है — वह कोण जो 'लंबे रास्ते से' मुड़ने पर बनता है। 180° ठीक ऋजु है — सीमा पर, पार नहीं।",
          mr: "प्रविशाल म्हणजे 180° आणि 360° च्या मध्ये: 200° बरोबर — 'लांबच्या वाटेने' वळताना होणारा कोन. 180° नेमका सरळ — सीमेवर, पलीकडे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "How many vertices (pointed corners) does a cone have?",
          hi: "शंकु के कितने शीर्ष (नुकीले कोने) होते हैं?",
          mr: "शंकूला किती शिरोबिंदू (टोकदार कोपरे) असतात?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        solution: {
          en: "One — the tip where the ice-cream cone comes to its point. Its other end is a circular edge, not a corner; a cylinder, by contrast, has no vertex at all.",
          hi: "एक — वह नोक जहाँ आइसक्रीम का कोन सिमटता है। दूसरा सिरा गोल किनारा है, कोना नहीं; बेलन के पास तो कोई शीर्ष है ही नहीं।",
          mr: "एक — आइस्क्रीमचा कोन जिथे निमुळता होतो ते टोक. दुसरे टोक गोल कड आहे, कोपरा नव्हे; दंडगोलाला तर शिरोबिंदूच नाही.",
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
          en: "A set-square's three angles are 90°, 60° and one more. Given that a triangle's angles total 180°, what is the third?",
          hi: "सेट-स्क्वायर के तीन कोण 90°, 60° और एक और हैं। त्रिभुज के कोणों का योग 180° होता है — तीसरा कितना?",
          mr: "सेट-स्क्वेअरचे तीन कोन 90°, 60° आणि आणखी एक. त्रिकोणाच्या कोनांची बेरीज 180° असते — तिसरा किती?",
        },
        answer: 30,
        wrong: [45, 60, 90],
        checkExpr: "180-90-60",
        solution: {
          en: "180 − 90 − 60 = 30°. The other set-square in the box is the 45-45-90 — two tools that together draw most of the angles a draughtsman needs.",
          hi: "180 − 90 − 60 = 30°। डिब्बे का दूसरा सेट-स्क्वायर 45-45-90 वाला है — दो औज़ार जो मिलकर नक़्शानवीस के काम के लगभग सारे कोण खींच देते हैं।",
          mr: "180 − 90 − 60 = 30°. पेटीतला दुसरा सेट-स्क्वेअर 45-45-90 चा — दोन हत्यारे मिळून आरेखकाला लागणारे बहुतेक कोन काढतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many FLAT faces does a sphere have?",
          hi: "गोले के कितने चपटे फलक होते हैं?",
          mr: "गोलाला किती सपाट पृष्ठे असतात?",
        },
        answer: 0,
        wrong: [1, 2, 6],
        solution: {
          en: "None — a sphere is one unbroken curved surface, no flat patch, no edge, no vertex. That is why a ball rolls every way equally and a dice must be tumbled.",
          hi: "एक भी नहीं — गोला एक अटूट घुमावदार सतह है: न चपटा टुकड़ा, न किनारा, न शीर्ष। इसीलिए गेंद हर दिशा में एक-सी लुढ़कती है और पासे को पलटना पड़ता है।",
          mr: "एकही नाही — गोल म्हणजे एक अखंड वक्र पृष्ठभाग: सपाट तुकडा नाही, कड नाही, शिरोबिंदू नाही. म्हणूनच चेंडू प्रत्येक दिशेला सारखा घरंगळतो आणि फासा उलथावा लागतो.",
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
          en: "From 12:00 to 12:30 the MINUTE hand sweeps half the face. Through how many degrees does the HOUR hand move in that half hour?",
          hi: "12:00 से 12:30 तक मिनट की सुई आधा चेहरा घूमती है। उसी आधे घंटे में घंटे की सुई कितने अंश चलती है?",
          mr: "12:00 ते 12:30 मिनिट-काटा अर्धे तोंड फिरतो. त्याच अर्ध्या तासात तास-काटा किती अंश फिरतो?",
        },
        answer: 15,
        wrong: [30, 180, 6],
        checkExpr: "30/2",
        fmt: deg,
        solution: {
          en: "The hour hand covers one number — 30° — in a full hour, so half an hour moves it 15°: that is why at 12:30 it points midway between 12 and 1. 180 is the minute hand's sweep; the two hands live at different speeds.",
          hi: "घंटे की सुई पूरे घंटे में एक अंक — 30° — चलती है, तो आधे घंटे में 15°: इसीलिए 12:30 पर वह 12 और 1 के बीचोबीच होती है। 180 मिनट की सुई की दौड़ है; दोनों सुइयाँ अलग-अलग रफ़्तार जीती हैं।",
          mr: "तास-काटा पूर्ण तासात एक आकडा — 30° — फिरतो, म्हणून अर्ध्या तासात 15°: म्हणूनच 12:30 ला तो 12 आणि 1 च्या मधोमध असतो. 180 ही मिनिट-काट्याची दौड; दोन्ही काटे वेगवेगळ्या वेगांनी जगतात.",
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
          en: "A hexagon has 6 vertices. From all of them together, how many DIAGONALS can be drawn (segments joining non-neighbours)?",
          hi: "षट्भुज के 6 शीर्ष हैं। उन सबसे मिलाकर कितने विकर्ण खिंच सकते हैं (ग़ैर-पड़ोसियों को जोड़ते खंड)?",
          mr: "षट्कोनाला 6 शिरोबिंदू आहेत. त्या साऱ्यांतून मिळून किती कर्ण काढता येतील (शेजारी नसलेल्यांना जोडणारे खंड)?",
        },
        answer: 9,
        wrong: [6, 15, 12],
        checkExpr: "6*3/2",
        solution: {
          en: "Each vertex reaches 3 non-neighbours (all 5 others minus its 2 neighbours): 6 × 3 = 18 ends, halved for double counting — 9 diagonals. 15 counts ALL segments including the 6 sides; a diagonal must skip past a neighbour.",
          hi: "हर शीर्ष 3 ग़ैर-पड़ोसियों तक पहुँचता है (बाक़ी 5 में से 2 पड़ोसी घटाकर): 6 × 3 = 18 सिरे, दोहरी गिनती के लिए आधे — 9 विकर्ण। 15 भुजाओं समेत सारे खंड गिन लेता है; विकर्ण को पड़ोसी लाँघना ही होता है।",
          mr: "प्रत्येक शिरोबिंदू 3 गैर-शेजाऱ्यांपर्यंत पोहोचतो (उरलेल्या 5 मधून 2 शेजारी वजा): 6 × 3 = 18 टोके, दुहेरी मोजणीसाठी अर्धी — 9 कर्ण. 15 बाजूंसह सारे खंड मोजते; कर्णाला शेजारी ओलांडावाच लागतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 5 — Understanding Elementary Shapes",
      name: "Understanding Elementary Shapes",
      slug: "maths-6-elementary-shapes",
      summary: "Angles named band by band, triangles sorted by equality, solids felt face by face — and the slow hour hand caught moving.",
      position: 5,
      translations: {
        hi: {
          name: "प्रारंभिक आकारों को समझना",
          summary: "पट्टी-दर-पट्टी नामी कोण, बराबरी से छँटे त्रिभुज, फलक-दर-फलक परखे ठोस — और चलती पकड़ी गई धीमी घंटा-सुई।",
        },
        mr: {
          name: "प्राथमिक आकार समजून घेणे",
          summary: "पट्ट्यापट्ट्याने नावे दिलेले कोन, समानतेने लावलेले त्रिकोण, पृष्ठापृष्ठाने चाचपलेले घन — आणि फिरताना पकडलेला संथ तास-काटा.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Algebra (letters that stand for numbers)                     */
/* ------------------------------------------------------------------------- */
function algebra6(): TopicFileOut {
  const rand = rng("maths-6-algebra");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Each letter L in a matchstick pattern takes 2 sticks, so n letters take 2n sticks. How many sticks for n = 7?",
          hi: "माचिस-पैटर्न में हर अक्षर L में 2 तीलियाँ लगती हैं, तो n अक्षरों में 2n तीलियाँ। n = 7 के लिए कितनी तीलियाँ?",
          mr: "काडेपेटी-नमुन्यात प्रत्येक L अक्षराला 2 काड्या लागतात, म्हणून n अक्षरांना 2n काड्या. n = 7 साठी किती काड्या?",
        },
        answer: 14,
        wrong: [9, 27, 7],
        checkExpr: "2*7",
        solution: {
          en: "2n means 2 × n: 2 × 7 = 14 sticks. 27 glues the digits together — the letter beside a number always means multiply, never sit-beside.",
          hi: "2n यानी 2 × n: 2 × 7 = 14 तीलियाँ। 27 अंकों को चिपका देता है — संख्या के बग़ल का अक्षर हमेशा गुणा कहता है, अग़ल-बग़ल बैठना नहीं।",
          mr: "2n म्हणजे 2 × n: 2 × 7 = 14 काड्या. 27 अंक चिकटवते — संख्येशेजारचे अक्षर नेहमी गुणाकार सांगते, शेजारी बसणे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "If x = 5, what is x + 3?",
          hi: "यदि x = 5, तो x + 3 कितना है?",
          mr: "x = 5 असेल, तर x + 3 किती?",
        },
        answer: 8,
        wrong: [53, 2, 15],
        checkExpr: "5+3",
        solution: {
          en: "Put 5 in x's place: 5 + 3 = 8. The letter is a box holding a number — open the box and calculate as always. 53 writes the two side by side.",
          hi: "x की जगह 5 रखिए: 5 + 3 = 8। अक्षर संख्या थामे एक डिब्बा है — डिब्बा खोलिए और हमेशा की तरह हिसाब कीजिए। 53 दोनों को अग़ल-बग़ल लिख देता है।",
          mr: "x च्या जागी 5 ठेवा: 5 + 3 = 8. अक्षर म्हणजे संख्या धरलेली पेटी — पेटी उघडा आणि नेहमीसारखा हिशेब करा. 53 दोघांना शेजारी लिहिते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A square of side a has perimeter 4a. What is the perimeter when a = 6?",
          hi: "a भुजा वाले वर्ग की परिमिति 4a है। a = 6 पर परिमिति कितनी?",
          mr: "a बाजूच्या चौरसाची परिमिती 4a. a = 6 असता परिमिती किती?",
        },
        answer: 24,
        wrong: [10, 46, 36],
        checkExpr: "4*6",
        solution: {
          en: "4a = 4 × 6 = 24 — the formula walks all four sides at once, whatever a turns out to be. 36 squares the side, which is area's business.",
          hi: "4a = 4 × 6 = 24 — सूत्र चारों भुजाएँ एक साथ चल लेता है, a जो भी निकले। 36 भुजा का वर्ग है — वह क्षेत्रफल का काम है।",
          mr: "4a = 4 × 6 = 24 — सूत्र चारही बाजू एकदम चालते, a काहीही निघो. 36 बाजूचा वर्ग — ते क्षेत्रफळाचे काम.",
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
          en: "If y = 4, what is 3y?",
          hi: "यदि y = 4, तो 3y कितना है?",
          mr: "y = 4 असेल, तर 3y किती?",
        },
        answer: 12,
        wrong: [34, 7, 43],
        checkExpr: "3*4",
        solution: {
          en: "3y is 3 × y = 3 × 4 = 12. 7 adds; 34 and 43 paste digits. The invisible multiplication sign is algebra's first habit to learn.",
          hi: "3y यानी 3 × y = 3 × 4 = 12। 7 जोड़ देता है; 34 और 43 अंक चिपकाते हैं। अदृश्य गुणा-चिह्न बीजगणित की पहली सीखने लायक़ आदत है।",
          mr: "3y म्हणजे 3 × y = 3 × 4 = 12. 7 मिळवते; 34 आणि 43 अंक चिकटवतात. अदृश्य गुणाकार-चिन्ह ही बीजगणिताची पहिली शिकण्याजोगी सवय.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A parade has 5 rows of cadets with r cadets in each row — 5r in all. How many cadets when r = 9?",
          hi: "परेड में कैडेटों की 5 पंक्तियाँ हैं, हर पंक्ति में r कैडेट — कुल 5r। r = 9 पर कितने कैडेट?",
          mr: "संचलनात कॅडेटांच्या 5 रांगा आहेत, प्रत्येक रांगेत r कॅडेट — एकूण 5r. r = 9 असता किती कॅडेट?",
        },
        answer: 45,
        wrong: [14, 59, 95],
        checkExpr: "5*9",
        solution: {
          en: "5r = 5 × 9 = 45 cadets. The rule 5r was written before anyone knew r — that is algebra's power: one formula, every possible parade.",
          hi: "5r = 5 × 9 = 45 कैडेट। नियम 5r तब लिखा गया जब r कोई नहीं जानता था — यही बीजगणित की ताक़त है: एक सूत्र, हर मुमकिन परेड।",
          mr: "5r = 5 × 9 = 45 कॅडेट. नियम 5r तेव्हा लिहिला गेला जेव्हा r कोणालाच ठाऊक नव्हता — हीच बीजगणिताची ताकद: एक सूत्र, प्रत्येक शक्य संचलन.",
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
          en: "Solve: x + 7 = 12. What is x?",
          hi: "हल कीजिए: x + 7 = 12। x क्या है?",
          mr: "सोडवा: x + 7 = 12. x किती?",
        },
        answer: 5,
        wrong: [19, 7, 84],
        checkExpr: "12-7",
        solution: {
          en: "Undo the +7 by subtracting: x = 12 − 7 = 5, and checking, 5 + 7 = 12. 19 adds the 7 again — to unwrap an equation, do the OPPOSITE of what was done to x.",
          hi: "+7 को घटाकर खोलिए: x = 12 − 7 = 5, और जाँच में 5 + 7 = 12। 19 सात दोबारा जोड़ देता है — समीकरण खोलने को वही उलटा कीजिए जो x के साथ हुआ था।",
          mr: "+7 वजा करून उलगडा: x = 12 − 7 = 5, आणि तपासणीत 5 + 7 = 12. 19 सात पुन्हा मिळवते — समीकरण उलगडायला x शी जे झाले त्याच्या उलटे करा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Solve: 4m = 28. What is m?",
          hi: "हल कीजिए: 4m = 28। m क्या है?",
          mr: "सोडवा: 4m = 28. m किती?",
        },
        answer: 7,
        wrong: [24, 32, 112],
        checkExpr: "28/4",
        solution: {
          en: "Undo the ×4 by dividing: m = 28 ÷ 4 = 7; check 4 × 7 = 28. 24 subtracts the 4 — but m was multiplied, so only division sets it free.",
          hi: "×4 को भाग से खोलिए: m = 28 ÷ 4 = 7; जाँच 4 × 7 = 28। 24 चार घटाता है — पर m गुणा हुआ था, तो उसे केवल भाग ही आज़ाद करता है।",
          mr: "×4 भागाकाराने उलगडा: m = 28 ÷ 4 = 7; तपासणी 4 × 7 = 28. 24 चार वजा करते — पण m गुणला गेला होता, म्हणून त्याला फक्त भागाकारच मोकळे करतो.",
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
          en: "Solve: n − 6 = 10. What is n?",
          hi: "हल कीजिए: n − 6 = 10। n क्या है?",
          mr: "सोडवा: n − 6 = 10. n किती?",
        },
        answer: 16,
        wrong: [4, 60, 10],
        checkExpr: "10+6",
        solution: {
          en: "Six was taken FROM n, so give it back: n = 10 + 6 = 16; check 16 − 6 = 10. 4 subtracts again, moving the wrong way twice.",
          hi: "n में से छह लिया गया था, तो लौटाइए: n = 10 + 6 = 16; जाँच 16 − 6 = 10। 4 फिर घटाता है — ग़लत दिशा में दो बार।",
          mr: "n मधून सहा घेतले होते, म्हणून परत द्या: n = 10 + 6 = 16; तपासणी 16 − 6 = 10. 4 पुन्हा वजा करते — चुकीच्या दिशेने दोनदा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Sarita has x marbles and her brother has x + 10. If x = 14, how many does the brother have?",
          hi: "सरिता के पास x कंचे हैं और भाई के पास x + 10। यदि x = 14, भाई के पास कितने?",
          mr: "सरिताकडे x गोट्या आहेत आणि भावाकडे x + 10. x = 14 असेल, तर भावाकडे किती?",
        },
        answer: 24,
        wrong: [14, 10, 140],
        checkExpr: "14+10",
        solution: {
          en: "x + 10 = 14 + 10 = 24 marbles. The expression 'x + 10' said the RELATIONSHIP — ten more than Sarita, whatever she has — before either count was known.",
          hi: "x + 10 = 14 + 10 = 24 कंचे। व्यंजक 'x + 10' ने रिश्ता कहा था — सरिता से दस ज़्यादा, उसके पास जो भी हो — किसी की भी गिनती जानने से पहले।",
          mr: "x + 10 = 14 + 10 = 24 गोट्या. 'x + 10' या पदावलीने नाते सांगितले होते — सरिताहून दहा जास्त, तिच्याकडे काहीही असो — कोणाचीही संख्या ठाऊक होण्याआधी.",
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
          en: "Solve: 2x + 3 = 13. What is x?",
          hi: "हल कीजिए: 2x + 3 = 13। x क्या है?",
          mr: "सोडवा: 2x + 3 = 13. x किती?",
        },
        answer: 5,
        wrong: [8, 10, 6],
        checkExpr: "(13-3)/2",
        solution: {
          en: "Unwrap in reverse order: first take away the +3 (2x = 10), then undo the ×2 (x = 5); check 2 × 5 + 3 = 13. 8 divides before subtracting — the last thing done to x is the first to undo.",
          hi: "उलटे क्रम में खोलिए: पहले +3 हटाइए (2x = 10), फिर ×2 खोलिए (x = 5); जाँच 2 × 5 + 3 = 13। 8 घटाने से पहले भाग देता है — x के साथ जो आख़िर में हुआ, वही पहले खुलता है।",
          mr: "उलट्या क्रमाने उलगडा: आधी +3 काढा (2x = 10), मग ×2 उलगडा (x = 5); तपासणी 2 × 5 + 3 = 13. 8 वजा करण्याआधी भागते — x शी शेवटी जे झाले, तेच आधी उलगडायचे.",
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
          en: "A trick: think of ANY number, double it, add 8, halve the result, then subtract your original number. What is left — always?",
          hi: "एक तरकीब: कोई भी संख्या सोचिए, दुगनी कीजिए, 8 जोड़िए, आधा कीजिए, फिर अपनी मूल संख्या घटाइए। हमेशा क्या बचता है?",
          mr: "एक युक्ती: कोणतीही संख्या मनात धरा, दुप्पट करा, 8 मिळवा, अर्धे करा, मग आपली मूळ संख्या वजा करा. नेहमी काय उरते?",
        },
        answer: 4,
        wrong: [8, 0, 2],
        checkExpr: "8/2",
        solution: {
          en: "Let the thought number be x: doubling gives 2x, adding 8 gives 2x + 8, halving gives x + 4, and subtracting x leaves… 4, for every x alive. The 'magic' is algebra in costume: the x enters, rides along, and cancels itself out — only half the 8 survives the trip.",
          hi: "सोची संख्या x मानिए: दुगना 2x, आठ जोड़कर 2x + 8, आधा करके x + 4, और x घटाने पर बचता है… 4 — हर x के लिए। 'जादू' वेश बदला बीजगणित है: x आता है, साथ चलता है, और ख़ुद को काट देता है — सफ़र से बस 8 का आधा बचकर निकलता है।",
          mr: "मनातली संख्या x माना: दुप्पट 2x, आठ मिळवून 2x + 8, अर्धे करून x + 4, आणि x वजा केल्यावर उरते… 4 — प्रत्येक x साठी. 'जादू' म्हणजे वेष बदललेले बीजगणित: x येतो, सोबत चालतो, आणि स्वतःला कापून घेतो — प्रवासातून फक्त 8 चा अर्धा वाचून निघतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 6,
      chapter: "Chapter 11 — Algebra",
      name: "Algebra",
      slug: "maths-6-algebra",
      summary: "Letters standing for numbers — matchstick rules, equations unwrapped in reverse, and the think-of-a-number trick unmasked as x.",
      position: 11,
      translations: {
        hi: {
          name: "बीजगणित",
          summary: "संख्याओं की जगह खड़े अक्षर — माचिस के नियम, उलटे क्रम में खुलते समीकरण, और x के रूप में बेनक़ाब संख्या-सोचो तरकीब।",
        },
        mr: {
          name: "बीजगणित",
          summary: "संख्यांच्या जागी उभी अक्षरे — काडेपेटीचे नियम, उलट्या क्रमाने उलगडणारी समीकरणे, आणि x म्हणून उघडी पडलेली संख्या-धरा युक्ती.",
        },
      },
    },
    qs,
  );
}

export const G6_MATHS: TopicFileOut[] = [
  knowingOurNumbers(),
  wholeNumbers(),
  playingWithNumbers(),
  basicGeometricalIdeas(),
  elementaryShapes(),
  integers(),
  fractions6(),
  decimals6(),
  algebra6(),
  ratioAndProportion(),
];
