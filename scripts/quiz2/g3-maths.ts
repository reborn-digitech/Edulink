/**
 * Class 3 Maths — NCERT "Math Magic", chapter by chapter, as the numeric side
 * of the refurbished bank. Every question is authored individually (no
 * template grinding — that is how repetition happened), every computable
 * answer carries a checkExpr the verifier proves, and every wrong option is a
 * mistake a real eight-year-old makes: the digit swap, the forgotten carry,
 * the off-by-ten.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader, like every
 * translated string in this repository.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ, rupees } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Math Magic (Class 3)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Fun with Numbers (counting, place value, comparing to 999)    */
/* ------------------------------------------------------------------------- */
function funWithNumbers(): TopicFileOut {
  const rand = rng("maths-3-fun-with-numbers");
  const qs: OutQuestion[] = [];

  /* L1 — reading and counting. */
  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What number does 'four hundred and seven' write as?",
          hi: "'चार सौ सात' को अंकों में कैसे लिखेंगे?",
          mr: "'चारशे सात' अंकांत कसे लिहाल?",
        },
        answer: 407,
        wrong: [470, 47, 4007],
        checkExpr: "400+7",
        solution: {
          en: "Four hundred is 400, and seven ones make 7 — together 407. Writing 470 puts the seven in the tens place, where the words said nothing at all.",
          hi: "चार सौ यानी 400, और सात इकाई यानी 7 — मिलकर 407। 470 लिखने पर सात दहाई में चला जाता है, जबकि शब्दों में दहाई का ज़िक्र ही नहीं था।",
          mr: "चारशे म्हणजे 400, आणि सात एकक म्हणजे 7 — मिळून 407. 470 लिहिल्यास सात दशकात जातो, पण शब्दांत दशकाचा उल्लेखच नव्हता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Ravi counts 10, 20, 30 … What comes just after 90?",
          hi: "रवि 10, 20, 30 … गिनता है। 90 के ठीक बाद क्या आएगा?",
          mr: "रवी 10, 20, 30 … मोजतो. 90 च्या लगेच नंतर काय येईल?",
        },
        answer: 100,
        wrong: [91, 110, 900],
        checkExpr: "90+10",
        solution: {
          en: "He is counting in tens, so each jump adds 10: after 90 comes 90 + 10 = 100. Saying 91 forgets the jumps are tens, not ones.",
          hi: "वह दहाई में गिन रहा है, हर छलाँग 10 जोड़ती है: 90 के बाद 90 + 10 = 100। 91 कहना भूल जाना है कि छलाँगें दहाई की हैं, इकाई की नहीं।",
          mr: "तो दशकाने मोजतो आहे, प्रत्येक उडी 10 वाढवते: 90 नंतर 90 + 10 = 100. 91 म्हणणे म्हणजे उड्या दशकाच्या आहेत हे विसरणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Which number is one less than 600?",
          hi: "600 से एक कम कौन-सी संख्या है?",
          mr: "600 पेक्षा एक कमी कोणती संख्या?",
        },
        answer: 599,
        wrong: [601, 590, 699],
        checkExpr: "600-1",
        solution: {
          en: "One less than 600 is 600 − 1 = 599. Coming down from a round hundred, both the tens and the ones become 9 — 590 only turns the ones down.",
          hi: "600 से एक कम है 600 − 1 = 599। पूरे सैकड़े से एक घटाने पर दहाई और इकाई दोनों 9 हो जाती हैं — 590 में केवल इकाई घटी है।",
          mr: "600 हून एक कमी म्हणजे 600 − 1 = 599. पूर्ण शतकातून एक वजा केल्यावर दशक आणि एकक दोन्ही 9 होतात — 590 मध्ये फक्त एकक घटले आहे.",
        },
      },
      rand,
    ),
  );

  /* L2 — place value. */
  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "In the number 374, what is the value of the digit 7?",
          hi: "संख्या 374 में अंक 7 का मान क्या है?",
          mr: "374 या संख्येत 7 या अंकाची किंमत किती?",
        },
        answer: 70,
        wrong: [7, 700, 74],
        checkExpr: "7*10",
        solution: {
          en: "The 7 sits in the tens place, so it is worth 7 tens = 70. Just '7' is its face, not its value; 700 would need it in the hundreds place.",
          hi: "7 दहाई के स्थान पर है, इसलिए उसका मान 7 दहाई = 70 है। केवल '7' उसका अंक-रूप है, मान नहीं; 700 के लिए उसे सैकड़े के स्थान पर होना पड़ता।",
          mr: "7 दशकाच्या जागी आहे, म्हणून त्याची किंमत 7 दशक = 70. नुसता '7' हा त्याचा चेहरा आहे, किंमत नाही; 700 साठी तो शतकाच्या जागी हवा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "5 hundreds, 0 tens and 8 ones make which number?",
          hi: "5 सैकड़े, 0 दहाई और 8 इकाई से कौन-सी संख्या बनती है?",
          mr: "5 शतके, 0 दशक आणि 8 एकक मिळून कोणती संख्या होते?",
        },
        answer: 508,
        wrong: [580, 58, 850],
        checkExpr: "5*100+0*10+8",
        solution: {
          en: "500 + 0 + 8 = 508. The zero must hold the tens place open — dropping it gives 58, and sliding the 8 into it gives 580, both different numbers.",
          hi: "500 + 0 + 8 = 508। शून्य को दहाई की जगह रोकनी होती है — उसे छोड़ दें तो 58 बनता है, और 8 को वहाँ खिसका दें तो 580 — दोनों अलग संख्याएँ हैं।",
          mr: "500 + 0 + 8 = 508. शून्याने दशकाची जागा धरून ठेवायची असते — तो गाळला तर 58 होते, आणि 8 तिथे सरकवला तर 580 — दोन्ही वेगळ्या संख्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many tens are there in 230?",
          hi: "230 में कितनी दहाइयाँ हैं?",
          mr: "230 मध्ये किती दशक आहेत?",
        },
        answer: 23,
        wrong: [3, 230, 20],
        checkExpr: "230/10",
        solution: {
          en: "230 split into tens gives 230 ÷ 10 = 23 tens. The digit in the tens place is 3, but the hundreds hold ten tens each — 2 hundreds are 20 tens, plus 3 more.",
          hi: "230 को दहाइयों में बाँटें तो 230 ÷ 10 = 23 दहाइयाँ। दहाई के स्थान का अंक 3 है, पर हर सैकड़े में दस दहाइयाँ होती हैं — 2 सैकड़े यानी 20 दहाइयाँ, और 3 ऊपर से।",
          mr: "230 चे दशक केले तर 230 ÷ 10 = 23 दशक. दशकाच्या जागचा अंक 3 आहे, पण प्रत्येक शतकात दहा दशक असतात — 2 शतके म्हणजे 20 दशक, आणि वर 3.",
        },
      },
      rand,
    ),
  );

  /* L3 — comparing and using numbers. */
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "Which is the greatest: 489, 498, 894 or 849?",
          hi: "इनमें सबसे बड़ी संख्या कौन-सी है: 489, 498, 894 या 849?",
          mr: "यांपैकी सर्वांत मोठी संख्या कोणती: 489, 498, 894 की 849?",
        },
        answer: 894,
        wrong: [498, 849, 489],
        solution: {
          en: "Compare hundreds first: 894 and 849 both start with 8, more than 4. Then tens decide between them: 9 tens beat 4 tens, so 894 wins. The same three digits make four different numbers — the places do the work.",
          hi: "पहले सैकड़े देखें: 894 और 849 दोनों 8 से शुरू होते हैं, जो 4 से बड़ा है। फिर दहाई फ़ैसला करती है: 9 दहाई 4 दहाई से बड़ी, अतः 894 सबसे बड़ी। वही तीन अंक चार अलग संख्याएँ बनाते हैं — सारा काम स्थान का है।",
          mr: "आधी शतके पाहा: 894 आणि 849 दोन्ही 8 ने सुरू होतात, जे 4 हून मोठे. मग दशक ठरवते: 9 दशक 4 दशकांहून मोठे, म्हणून 894 सर्वांत मोठी. तेच तीन अंक चार वेगळ्या संख्या बनवतात — सगळे काम जागेचे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A school has 267 girls and 251 boys. Just by looking at the numbers, how many MORE girls than boys are there?",
          hi: "एक विद्यालय में 267 लड़कियाँ और 251 लड़के हैं। लड़कियों की संख्या लड़कों से कितनी अधिक है?",
          mr: "एका शाळेत 267 मुली आणि 251 मुले आहेत. मुलींची संख्या मुलांपेक्षा किती जास्त आहे?",
        },
        answer: 16,
        wrong: [15, 26, 518],
        checkExpr: "267-251",
        solution: {
          en: "More-than asks for a difference: 267 − 251 = 16. Adding them (518) answers a different question — how many children altogether.",
          hi: "'कितनी अधिक' अंतर माँगता है: 267 − 251 = 16। जोड़ने पर (518) दूसरा ही सवाल हल होता है — कुल बच्चे कितने।",
          mr: "'किती जास्त' म्हणजे वजाबाकी: 267 − 251 = 16. बेरीज केल्यास (518) भलताच प्रश्न सुटतो — एकूण मुले किती.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Asha's house number is between 340 and 350, and its ones digit is 6. What is it?",
          hi: "आशा के घर का नंबर 340 और 350 के बीच है, और उसकी इकाई का अंक 6 है। वह नंबर क्या है?",
          mr: "आशाच्या घराचा क्रमांक 340 आणि 350 च्या दरम्यान आहे, आणि त्याचा एककाचा अंक 6 आहे. तो क्रमांक कोणता?",
        },
        answer: 346,
        wrong: [356, 336, 364],
        checkExpr: "340+6",
        solution: {
          en: "Between 340 and 350 every number starts 34_, so the ones digit 6 fixes it: 346. 356 lies past 350, and 364 has swapped its digits.",
          hi: "340 और 350 के बीच हर संख्या 34_ से शुरू होती है, तो इकाई 6 से बनती है 346। 356 तो 350 के पार है, और 364 में अंक पलट गए हैं।",
          mr: "340 आणि 350 च्या दरम्यान प्रत्येक संख्या 34_ अशी असते, म्हणून एकक 6 ने ठरते: 346. 356 तर 350 च्या पलीकडे आहे, आणि 364 मध्ये अंक उलटले आहेत.",
        },
      },
      rand,
    ),
  );

  /* L4 — making numbers from digits. */
  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "Using the digits 2, 8 and 5 once each, what is the GREATEST number you can make?",
          hi: "अंक 2, 8 और 5 को एक-एक बार इस्तेमाल करके सबसे बड़ी संख्या कौन-सी बनेगी?",
          mr: "2, 8 आणि 5 हे अंक प्रत्येकी एकदाच वापरून सर्वांत मोठी संख्या कोणती होईल?",
        },
        answer: 852,
        wrong: [825, 582, 285],
        checkExpr: "8*100+5*10+2",
        solution: {
          en: "Biggest digit in the biggest place: 8 in hundreds, then 5 in tens, then 2 — 852. Choosing 825 puts the 2 before the 5, wasting the tens place.",
          hi: "सबसे बड़ा अंक सबसे बड़े स्थान पर: सैकड़े में 8, फिर दहाई में 5, फिर 2 — 852। 825 चुनने पर 2, 5 से पहले आ जाता है और दहाई का स्थान बेकार जाता है।",
          mr: "सर्वांत मोठा अंक सर्वांत मोठ्या जागी: शतकात 8, मग दशकात 5, मग 2 — 852. 825 निवडल्यास 2, 5 च्या आधी येतो आणि दशकाची जागा वाया जाते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Using the digits 4, 0 and 9 once each, what is the SMALLEST three-digit number you can make?",
          hi: "अंक 4, 0 और 9 को एक-एक बार इस्तेमाल करके सबसे छोटी तीन अंकों की संख्या कौन-सी बनेगी?",
          mr: "4, 0 आणि 9 हे अंक प्रत्येकी एकदाच वापरून सर्वांत लहान तीन-अंकी संख्या कोणती होईल?",
        },
        answer: 409,
        wrong: [49, 490, 904],
        checkExpr: "4*100+9",
        solution: {
          en: "The smallest digit should lead — but 0 in front makes 49, which is not a three-digit number. So the next smallest, 4, leads; 0 takes the tens; 9 the ones: 409.",
          hi: "सबसे छोटा अंक आगे होना चाहिए — पर आगे 0 रखने से 49 बनता है, जो तीन अंकों की संख्या नहीं। इसलिए अगला छोटा 4 आगे, 0 दहाई में, 9 इकाई में: 409।",
          mr: "सर्वांत लहान अंक पुढे हवा — पण पुढे 0 ठेवला तर 49 होते, जी तीन-अंकी संख्या नाही. म्हणून पुढचा लहान 4 पुढे, 0 दशकात, 9 एककात: 409.",
        },
      },
      rand,
    ),
  );

  /* L5 — patterns and two-step thinking. */
  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "A pattern goes 12, 23, 34, 45 … always jumping the same amount. What comes two jumps after 45?",
          hi: "एक पैटर्न 12, 23, 34, 45 … चलता है, हर बार समान छलाँग। 45 के बाद दो छलाँगों पर क्या आएगा?",
          mr: "एक नमुना 12, 23, 34, 45 … असा चालतो, प्रत्येक वेळी सारखीच उडी. 45 नंतर दोन उड्यांनी काय येईल?",
        },
        answer: 67,
        wrong: [56, 78, 66],
        checkExpr: "45+11+11",
        solution: {
          en: "Each jump adds 11 (12 → 23 → 34 → 45). Two jumps on from 45: 56, then 67. Stopping at 56 is one jump; 66 comes from jumping tens only.",
          hi: "हर छलाँग 11 जोड़ती है (12 → 23 → 34 → 45)। 45 से दो छलाँगें: 56, फिर 67। 56 पर रुकना एक ही छलाँग है; 66 केवल दहाई कूदने से आता है।",
          mr: "प्रत्येक उडी 11 वाढवते (12 → 23 → 34 → 45). 45 पासून दोन उड्या: 56, मग 67. 56 वर थांबणे म्हणजे एकच उडी; 66 फक्त दशक उडवल्याने येते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Amma gives Meena a ₹500 note. Meena buys a book for ₹230 and a pen for ₹45. How much money goes back to Amma?",
          hi: "अम्मा मीना को ₹500 का नोट देती हैं। मीना ₹230 की किताब और ₹45 की कलम ख़रीदती है। अम्मा को कितने पैसे वापस मिलेंगे?",
          mr: "अम्मा मीनाला ₹500 ची नोट देते. मीना ₹230 चे पुस्तक आणि ₹45 चे पेन घेते. अम्माला किती पैसे परत मिळतील?",
        },
        answer: 225,
        wrong: [275, 235, 270],
        checkExpr: "500-230-45",
        fmt: rupees,
        solution: {
          en: "Spent: 230 + 45 = ₹275. Change: 500 − 275 = ₹225. Forgetting the pen gives ₹270; subtracting only the book gives ₹275 — the change and the spending are easy to swap.",
          hi: "ख़र्च: 230 + 45 = ₹275। वापसी: 500 − 275 = ₹225। कलम भूलने पर ₹270 आता है; केवल किताब घटाने पर ₹275 — ख़र्च और वापसी आपस में बदलना आसान है।",
          mr: "खर्च: 230 + 45 = ₹275. परत: 500 − 275 = ₹225. पेन विसरल्यास ₹270 येते; फक्त पुस्तक वजा केल्यास ₹275 — खर्च आणि परतावा सहज उलटतात.",
        },
      },
      rand,
    ),
  );

  /* L6 — the puzzle end. */
  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "I am a three-digit number. My hundreds digit is double my ones digit, my tens digit is 0, and my digits add up to 9. Who am I?",
          hi: "मैं तीन अंकों की संख्या हूँ। मेरा सैकड़े का अंक मेरी इकाई के अंक का दुगना है, दहाई का अंक 0 है, और मेरे अंकों का योग 9 है। मैं कौन हूँ?",
          mr: "मी तीन-अंकी संख्या आहे. माझा शतकाचा अंक माझ्या एककाच्या अंकाच्या दुप्पट आहे, दशकाचा अंक 0 आहे, आणि माझ्या अंकांची बेरीज 9 आहे. मी कोण?",
        },
        answer: 603,
        wrong: [306, 360, 903],
        checkExpr: "6*100+3",
        solution: {
          en: "Call the ones digit k; the hundreds digit is 2k, and 2k + 0 + k = 9 gives k = 3. So ones 3, hundreds 6, tens 0: 603. In 306 the double sits in the wrong place — the ones would be double the hundreds.",
          hi: "इकाई का अंक k मानें; सैकड़े का अंक 2k है, और 2k + 0 + k = 9 से k = 3। अतः इकाई 3, सैकड़ा 6, दहाई 0: 603। 306 में दुगना ग़लत स्थान पर है — वहाँ इकाई, सैकड़े की दुगनी होती।",
          mr: "एककाचा अंक k मानू; शतकाचा अंक 2k, आणि 2k + 0 + k = 9 वरून k = 3. म्हणून एकक 3, शतक 6, दशक 0: 603. 306 मध्ये दुप्पट चुकीच्या जागी आहे — तिथे एकक शतकाच्या दुप्पट ठरले असते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Using each of the digits 1, 2, 3 exactly once, how many DIFFERENT three-digit numbers can be made in all?",
          hi: "अंक 1, 2, 3 में से प्रत्येक को ठीक एक बार इस्तेमाल करके कुल कितनी अलग-अलग तीन अंकों की संख्याएँ बन सकती हैं?",
          mr: "1, 2, 3 यांपैकी प्रत्येक अंक नेमका एकदाच वापरून एकूण किती वेगवेगळ्या तीन-अंकी संख्या बनू शकतात?",
        },
        answer: 6,
        wrong: [3, 9, 4],
        checkExpr: "3*2*1",
        solution: {
          en: "Three choices for the first place, two left for the second, one for the last: 3 × 2 × 1 = 6. Listing proves it — 123, 132, 213, 231, 312, 321 — and shows why 9 (which would allow repeats) is too many.",
          hi: "पहले स्थान के लिए तीन विकल्प, दूसरे के लिए बचे दो, आख़िरी के लिए एक: 3 × 2 × 1 = 6। सूची बनाकर देखें — 123, 132, 213, 231, 312, 321 — और समझ आता है कि 9 (जिसमें दोहराव आ जाता) क्यों ज़्यादा है।",
          mr: "पहिल्या जागेसाठी तीन पर्याय, दुसऱ्यासाठी उरलेले दोन, शेवटच्यासाठी एक: 3 × 2 × 1 = 6. यादी करून पाहा — 123, 132, 213, 231, 312, 321 — आणि 9 (ज्यात पुनरावृत्ती आली असती) का जास्त आहे हे कळते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 2 — Fun with Numbers",
      name: "Fun with Numbers",
      slug: "maths-3-fun-with-numbers",
      summary:
        "Numbers up to 999 — reading them, taking them apart into hundreds, tens and ones, and putting them back together.",
      position: 2,
      translations: {
        hi: {
          name: "संख्याओं से मस्ती",
          summary:
            "999 तक की संख्याएँ — उन्हें पढ़ना, सैकड़े-दहाई-इकाई में खोलना, और फिर से जोड़ना।",
        },
        mr: {
          name: "संख्यांची गंमत",
          summary:
            "999 पर्यंतच्या संख्या — त्या वाचणे, शतक-दशक-एककांत सोडवणे, आणि पुन्हा जुळवणे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Give and Take (addition and subtraction with regrouping)      */
/* ------------------------------------------------------------------------- */
function giveAndTake(): TopicFileOut {
  const rand = rng("maths-3-give-and-take");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 34 + 25?",
          hi: "34 + 25 कितना है?",
          mr: "34 + 25 किती?",
        },
        answer: 59,
        wrong: [59 - 10, 69, 9],
        checkExpr: "34+25",
        solution: {
          en: "Tens with tens, ones with ones: 30 + 20 = 50 and 4 + 5 = 9, so 59. Nothing carries here — 69 imagines a carry that never happened.",
          hi: "दहाई से दहाई, इकाई से इकाई: 30 + 20 = 50 और 4 + 5 = 9, यानी 59। यहाँ हासिल नहीं बनता — 69 उस हासिल की कल्पना है जो हुआ ही नहीं।",
          mr: "दशक दशकाशी, एकक एककाशी: 30 + 20 = 50 आणि 4 + 5 = 9, म्हणजे 59. इथे हातचा नाहीच — 69 म्हणजे न झालेला हातचा धरणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 78 − 40?",
          hi: "78 − 40 कितना है?",
          mr: "78 − 40 किती?",
        },
        answer: 38,
        wrong: [48, 30, 118],
        checkExpr: "78-40",
        solution: {
          en: "Take away 4 tens from 7 tens: 3 tens remain, and the 8 ones stay — 38. Getting 48 takes away only 3 tens; 118 adds instead of taking.",
          hi: "7 दहाई में से 4 दहाई घटाएँ: 3 दहाई बचीं, और 8 इकाई वैसी की वैसी — 38। 48 आने का मतलब केवल 3 दहाई घटीं; 118 में घटाने की जगह जोड़ हुआ है।",
          mr: "7 दशकांतून 4 दशक काढा: 3 दशक उरले, आणि 8 एकक तसेच — 38. 48 म्हणजे फक्त 3 दशक काढले; 118 मध्ये वजा करण्याऐवजी बेरीज झाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 47 + 36?",
          hi: "47 + 36 कितना है?",
          mr: "47 + 36 किती?",
        },
        answer: 83,
        wrong: [73, 813, 84],
        checkExpr: "47+36",
        solution: {
          en: "Ones first: 7 + 6 = 13, write 3 and carry 1 ten. Tens: 4 + 3 + 1 = 8. So 83. Forgetting the carry leaves 73; writing 13 whole gives the strange 813.",
          hi: "पहले इकाई: 7 + 6 = 13, 3 लिखा और 1 दहाई हासिल। दहाई: 4 + 3 + 1 = 8। यानी 83। हासिल भूलने पर 73 रह जाता है; 13 को पूरा लिख देने पर अजीब-सा 813 बनता है।",
          mr: "आधी एकक: 7 + 6 = 13, 3 लिहिले आणि 1 दशक हातचा. दशक: 4 + 3 + 1 = 8. म्हणजे 83. हातचा विसरला की 73 उरते; 13 अख्खे लिहिले की विचित्र 813 होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 62 − 28?",
          hi: "62 − 28 कितना है?",
          mr: "62 − 28 किती?",
        },
        answer: 34,
        wrong: [44, 46, 26],
        checkExpr: "62-28",
        solution: {
          en: "2 ones cannot give 8, so borrow a ten: 12 − 8 = 4, and 5 tens − 2 tens = 3 — 34. Answering 46 subtracts the smaller digit from the bigger one both times, which dodges the borrow instead of doing it.",
          hi: "2 इकाई से 8 नहीं घट सकता, इसलिए एक दहाई उधार: 12 − 8 = 4, और 5 दहाई − 2 दहाई = 3 — 34। 46 वह उत्तर है जब दोनों बार छोटे अंक को बड़े में से घटा दिया जाए — यह उधार से बचना है, उधार करना नहीं।",
          mr: "2 एककांतून 8 वजा होत नाही, म्हणून एक दशक उसना: 12 − 8 = 4, आणि 5 दशक − 2 दशक = 3 — 34. 46 हे उत्तर म्हणजे दोन्ही वेळा लहान अंक मोठ्यातून वजा करणे — ते उसनवारी टाळणे आहे, करणे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A bus starts with 43 passengers. At the market 17 get off and 9 get on. How many are on the bus now?",
          hi: "एक बस में 43 सवारियाँ हैं। बाज़ार पर 17 उतरती हैं और 9 चढ़ती हैं। अब बस में कितनी सवारियाँ हैं?",
          mr: "एका बसमध्ये 43 प्रवासी आहेत. बाजारात 17 उतरतात आणि 9 चढतात. आता बसमध्ये किती प्रवासी?",
        },
        answer: 35,
        wrong: [26, 52, 34],
        checkExpr: "43-17+9",
        solution: {
          en: "Off first: 43 − 17 = 26. Then on: 26 + 9 = 35. Stopping at 26 forgets the boarders; 52 adds everyone as if nobody left.",
          hi: "पहले उतरे: 43 − 17 = 26। फिर चढ़े: 26 + 9 = 35। 26 पर रुकना चढ़ने वालों को भूलना है; 52 में सबको जोड़ दिया गया, मानो कोई उतरा ही नहीं।",
          mr: "आधी उतरले: 43 − 17 = 26. मग चढले: 26 + 9 = 35. 26 वर थांबणे म्हणजे चढणाऱ्यांना विसरणे; 52 मध्ये कोणी उतरलेच नाही असे धरून सर्वांची बेरीज झाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Kabir's book has 96 pages. He has read 58. How many pages are left?",
          hi: "कबीर की किताब में 96 पृष्ठ हैं। उसने 58 पढ़ लिए हैं। कितने पृष्ठ बाक़ी हैं?",
          mr: "कबीरच्या पुस्तकात 96 पाने आहेत. त्याने 58 वाचली आहेत. किती पाने उरली?",
        },
        answer: 38,
        wrong: [42, 48, 154],
        checkExpr: "96-58",
        solution: {
          en: "Left means take away: 96 − 58 = 38. The borrow turns 6 into 16; skipping it gives 42. Adding (154) answers no question anyone asked.",
          hi: "बाक़ी यानी घटाव: 96 − 58 = 38। उधार से 6, 16 बनता है; उसे छोड़ने पर 42 आता है। जोड़ने से (154) वह सवाल हल होता है जो किसी ने पूछा ही नहीं।",
          mr: "उरली म्हणजे वजाबाकी: 96 − 58 = 38. उसनवारीने 6 चे 16 होते; ती गाळली की 42 येते. बेरीज (154) केली तर कोणीही न विचारलेला प्रश्न सुटतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What number must go in the box: 36 + ▢ = 71?",
          hi: "बॉक्स में कौन-सी संख्या आएगी: 36 + ▢ = 71?",
          mr: "चौकटीत कोणती संख्या येईल: 36 + ▢ = 71?",
        },
        answer: 35,
        wrong: [45, 34, 107],
        checkExpr: "71-36",
        solution: {
          en: "The box hides the jump from 36 to 71, and a missing part is found by taking away: 71 − 36 = 35. Adding the two numbers (107) treats the box as the total, but the total is already there.",
          hi: "बॉक्स 36 से 71 तक की छलाँग छिपाए है, और छिपा हिस्सा घटाने से मिलता है: 71 − 36 = 35। दोनों को जोड़ना (107) बॉक्स को योग समझ लेना है, जबकि योग तो सामने ही लिखा है।",
          mr: "चौकट 36 पासून 71 पर्यंतची उडी लपवते, आणि लपलेला भाग वजाबाकीने मिळतो: 71 − 36 = 35. दोघांची बेरीज (107) म्हणजे चौकटीलाच बेरीज समजणे — पण बेरीज तर समोरच लिहिली आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Two teams collected old newspapers: 128 kg and 94 kg. How many kilograms did they collect together?",
          hi: "दो टोलियों ने रद्दी अख़बार जमा किए: 128 किग्रा और 94 किग्रा। दोनों ने मिलकर कितने किलोग्राम जमा किए?",
          mr: "दोन गटांनी रद्दी वर्तमानपत्रे जमवली: 128 किलो आणि 94 किलो. दोघांनी मिळून किती किलो जमवली?",
        },
        answer: 222,
        wrong: [212, 232, 34],
        checkExpr: "128+94",
        solution: {
          en: "128 + 94: ones 8 + 4 = 12, carry; tens 2 + 9 + 1 = 12, carry again; hundreds 1 + 1 = 2, giving 222. Two carries in a row — dropping either lands on 212. And 34 is their difference, the opposite of 'together'.",
          hi: "128 + 94: इकाई 8 + 4 = 12, हासिल; दहाई 2 + 9 + 1 = 12, फिर हासिल; सैकड़ा 1 + 1 = 2, यानी 222। लगातार दो हासिल — कोई भी छूटे तो 212 आता है। और 34 तो अंतर है, 'मिलकर' का उल्टा।",
          mr: "128 + 94: एकक 8 + 4 = 12, हातचा; दशक 2 + 9 + 1 = 12, पुन्हा हातचा; शतक 1 + 1 = 2, म्हणजे 222. पाठोपाठ दोन हातचे — कोणताही सुटला की 212 येते. आणि 34 ही तर वजाबाकी, 'मिळून'च्या उलट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A shop had 240 mangoes in the morning. It sold 86 before lunch and 78 after. How many mangoes were left at closing?",
          hi: "एक दुकान में सुबह 240 आम थे। दोपहर से पहले 86 और बाद में 78 बिके। बंद होते समय कितने आम बचे?",
          mr: "एका दुकानात सकाळी 240 आंबे होते. दुपारपूर्वी 86 आणि नंतर 78 विकले गेले. दुकान बंद होताना किती आंबे उरले?",
        },
        answer: 76,
        wrong: [86, 84, 164],
        checkExpr: "240-86-78",
        solution: {
          en: "Sold in all: 86 + 78 = 164. Left: 240 − 164 = 76. Stopping at 164 reports the sold, not the left; 154 for the sold total is the missed carry showing up again.",
          hi: "कुल बिके: 86 + 78 = 164। बचे: 240 − 164 = 76। 164 पर रुकना बिके हुए बताना है, बचे हुए नहीं।",
          mr: "एकूण विकले: 86 + 78 = 164. उरले: 240 − 164 = 76. 164 वर थांबणे म्हणजे विकलेले सांगणे, उरलेले नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Riya thought of a number, added 27, and got 105. What number did she think of?",
          hi: "रिया ने एक संख्या सोची, उसमें 27 जोड़ा, और 105 मिला। उसने कौन-सी संख्या सोची थी?",
          mr: "रियाने एक संख्या मनात धरली, तीत 27 मिळवले, आणि 105 आले. तिने कोणती संख्या धरली होती?",
        },
        answer: 78,
        wrong: [132, 88, 82],
        checkExpr: "105-27",
        solution: {
          en: "To undo an add, take away: 105 − 27 = 78. Adding again (132) walks further from the start instead of back to it.",
          hi: "जोड़ को उलटने के लिए घटाइए: 105 − 27 = 78। दोबारा जोड़ना (132) शुरुआत की ओर लौटने के बजाय उससे और दूर जाना है।",
          mr: "बेरीज उलटवायला वजा करा: 105 − 27 = 78. पुन्हा बेरीज (132) म्हणजे सुरुवातीकडे परतण्याऐवजी तिच्यापासून आणखी दूर जाणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "In the sum 5▢ + 27 = 85, a digit is hidden in the box. Which digit is it?",
          hi: "जोड़ 5▢ + 27 = 85 में बॉक्स में एक अंक छिपा है। वह अंक कौन-सा है?",
          mr: "5▢ + 27 = 85 या बेरजेत चौकटीत एक अंक लपला आहे. तो अंक कोणता?",
        },
        answer: 8,
        wrong: [2, 6, 5],
        checkExpr: "85-27-50",
        solution: {
          en: "The hidden number is 5▢, and 85 − 27 = 58 — so the box holds 8. Check the ones: 8 + 7 = 15, write 5 carry 1, and 5 + 2 + 1 = 8. It works only because of that carry — choosing 6 forgets it.",
          hi: "छिपी संख्या 5▢ है, और 85 − 27 = 58 — तो बॉक्स में 8 है। इकाई जाँचें: 8 + 7 = 15, 5 लिखा हासिल 1, और 5 + 2 + 1 = 8। यह हासिल की वजह से ही सधता है — 6 चुनना उसे भूलना है।",
          mr: "लपलेली संख्या 5▢ आहे, आणि 85 − 27 = 58 — म्हणून चौकटीत 8. एकक तपासा: 8 + 7 = 15, 5 लिहा हातचा 1, आणि 5 + 2 + 1 = 8. हे त्या हातच्यामुळेच जुळते — 6 निवडणे म्हणजे तो विसरणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Using 100 exactly once and any of + and −, Meera made 73 from the numbers 100, 15 and 12. What did she calculate?",
          hi: "100 को ठीक एक बार और + व − का उपयोग करके मीरा ने 100, 15 और 12 से 73 बनाया। उसने क्या गणना की?",
          mr: "100 नेमके एकदा आणि + व − वापरून मीराने 100, 15 आणि 12 यांतून 73 बनवले. तिने कोणती आकडेमोड केली?",
        },
        answer: 73,
        wrong: [97, 127, 103],
        fmt: (n) => ({
          en: n === 73 ? "100 − 15 − 12 = 73" : n === 97 ? "100 − 15 + 12 = 97" : n === 127 ? "100 + 15 + 12 = 127" : "100 + 15 − 12 = 103",
          hi: n === 73 ? "100 − 15 − 12 = 73" : n === 97 ? "100 − 15 + 12 = 97" : n === 127 ? "100 + 15 + 12 = 127" : "100 + 15 − 12 = 103",
          mr: n === 73 ? "100 − 15 − 12 = 73" : n === 97 ? "100 − 15 + 12 = 97" : n === 127 ? "100 + 15 + 12 = 127" : "100 + 15 − 12 = 103",
        }),
        solution: {
          en: "Both smaller numbers must come OFF the hundred: 100 − 15 − 12 = 73. Every other mix of signs lands too high — one look at 73 being below 100 by 27, which is 15 + 12, settles it.",
          hi: "दोनों छोटी संख्याएँ सौ में से घटनी चाहिए: 100 − 15 − 12 = 73। चिह्नों का हर दूसरा मेल ऊपर पहुँचता है — 73, 100 से 27 नीचे है, और 27 = 15 + 12 — बस यही सुराग़ है।",
          mr: "दोन्ही लहान संख्या शंभरातून वजा व्हायला हव्यात: 100 − 15 − 12 = 73. चिन्हांचे इतर सर्व मेळ वर पोहोचतात — 73 हे 100 हून 27 ने कमी, आणि 27 = 15 + 12 — हाच धागा पुरेसा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 3 — Give and Take",
      name: "Give and Take",
      slug: "maths-3-give-and-take",
      summary:
        "Adding and taking away up to three digits — carrying, borrowing, and the word problems where they hide.",
      position: 3,
      translations: {
        hi: {
          name: "लेन-देन",
          summary: "तीन अंकों तक जोड़-घटाव — हासिल, उधार, और वे इबारती सवाल जिनमें ये छिपे रहते हैं।",
        },
        mr: {
          name: "देवाण-घेवाण",
          summary: "तीन अंकांपर्यंत बेरीज-वजाबाकी — हातचा, उसनवारी, आणि ते शाब्दिक प्रश्न जिथे हे लपलेले असतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — How Many Times? (multiplication as repeated addition)         */
/* ------------------------------------------------------------------------- */
function howManyTimes(): TopicFileOut {
  const rand = rng("maths-3-how-many-times");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "3 + 3 + 3 + 3 is the same as how many times 3?",
          hi: "3 + 3 + 3 + 3, कितनी बार 3 के बराबर है?",
          mr: "3 + 3 + 3 + 3 म्हणजे किती वेळा 3?",
        },
        answer: 4,
        wrong: [3, 12, 7],
        checkExpr: "12/3",
        solution: {
          en: "Count the threes: there are four of them, so it is 4 times 3. Twelve is what they ADD to — the answer to a different question.",
          hi: "तीनों को गिनें: चार हैं, इसलिए यह 4 बार 3 है। बारह तो उनका योग है — किसी और सवाल का उत्तर।",
          mr: "तीन मोजा: ते चार आहेत, म्हणून हे 4 वेळा 3. बारा ही तर त्यांची बेरीज — वेगळ्याच प्रश्नाचे उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 6 × 4?",
          hi: "6 × 4 कितना है?",
          mr: "6 × 4 किती?",
        },
        answer: 24,
        wrong: [10, 20, 28],
        checkExpr: "6*4",
        solution: {
          en: "Six fours: 4, 8, 12, 16, 20, 24. Getting 10 adds instead of multiplying; 28 is one four too many.",
          hi: "छह बार चार: 4, 8, 12, 16, 20, 24। 10 आने का मतलब गुणा की जगह जोड़ हुआ; 28 में एक चार ज़्यादा गिना गया।",
          mr: "सहा वेळा चार: 4, 8, 12, 16, 20, 24. 10 म्हणजे गुणाकाराऐवजी बेरीज; 28 मध्ये एक चार जास्त मोजला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A spider has 8 legs. How many legs do 5 spiders have?",
          hi: "एक मकड़ी के 8 पैर होते हैं। 5 मकड़ियों के कितने पैर होंगे?",
          mr: "एका कोळ्याला 8 पाय असतात. 5 कोळ्यांना किती पाय?",
        },
        answer: 40,
        wrong: [13, 45, 35],
        checkExpr: "8*5",
        solution: {
          en: "5 spiders × 8 legs = 40 legs. Adding 8 + 5 = 13 mixes up the two jobs the numbers are doing.",
          hi: "5 मकड़ियाँ × 8 पैर = 40 पैर। 8 + 5 = 13 करना दोनों संख्याओं के अलग-अलग काम को गड्डमड्ड करना है।",
          mr: "5 कोळी × 8 पाय = 40 पाय. 8 + 5 = 13 म्हणजे दोन संख्यांची वेगवेगळी कामे एकमेकांत मिसळणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Which multiplication does this picture of eggs tell: 3 trays, 6 eggs in each?",
          hi: "अंडों की यह तस्वीर कौन-सा गुणा बताती है: 3 ट्रे, हर एक में 6 अंडे?",
          mr: "अंड्यांचे हे चित्र कोणता गुणाकार सांगते: 3 ट्रे, प्रत्येकीत 6 अंडी?",
        },
        answer: 18,
        wrong: [9, 12, 36],
        checkExpr: "3*6",
        solution: {
          en: "3 trays of 6 make 3 × 6 = 18 eggs. Choosing 9 adds the numbers; 36 doubles a tray that is not there.",
          hi: "6-6 की 3 ट्रे यानी 3 × 6 = 18 अंडे। 9 चुनना जोड़ है; 36 में एक ऐसी ट्रे दुगनी हुई जो है ही नहीं।",
          mr: "6-6 च्या 3 ट्रे म्हणजे 3 × 6 = 18 अंडी. 9 निवडणे म्हणजे बेरीज; 36 मध्ये नसलेली ट्रे दुप्पट झाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A rickshaw carries 3 children. How many children can 7 rickshaws carry?",
          hi: "एक रिक्शे में 3 बच्चे बैठते हैं। 7 रिक्शों में कितने बच्चे बैठ सकते हैं?",
          mr: "एका रिक्षात 3 मुले बसतात. 7 रिक्षांत किती मुले बसतील?",
        },
        answer: 21,
        wrong: [10, 24, 18],
        checkExpr: "3*7",
        solution: {
          en: "7 rickshaws × 3 children = 21. The tables of 3 run 3, 6, 9, 12, 15, 18, 21 — 18 stops one rickshaw short.",
          hi: "7 रिक्शे × 3 बच्चे = 21। तीन का पहाड़ा 3, 6, 9, 12, 15, 18, 21 चलता है — 18 एक रिक्शा पहले रुक जाता है।",
          mr: "7 रिक्षा × 3 मुले = 21. तिचा पाढा 3, 6, 9, 12, 15, 18, 21 — 18 एक रिक्षा अलीकडेच थांबते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "One week has 7 days. How many days are there in 6 weeks?",
          hi: "एक सप्ताह में 7 दिन होते हैं। 6 सप्ताहों में कितने दिन होंगे?",
          mr: "एका आठवड्यात 7 दिवस असतात. 6 आठवड्यांत किती दिवस?",
        },
        answer: 42,
        wrong: [13, 36, 48],
        checkExpr: "7*6",
        solution: {
          en: "6 weeks × 7 days = 42 days. 36 comes from 6 × 6 — the week lost a day on the way.",
          hi: "6 सप्ताह × 7 दिन = 42 दिन। 36, 6 × 6 से आता है — रास्ते में सप्ताह का एक दिन खो गया।",
          mr: "6 आठवडे × 7 दिवस = 42 दिवस. 36 हे 6 × 6 मधून येते — वाटेत आठवड्याचा एक दिवस हरवला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What number goes in the box: 4 × ▢ = 32?",
          hi: "बॉक्स में कौन-सी संख्या आएगी: 4 × ▢ = 32?",
          mr: "चौकटीत कोणती संख्या येईल: 4 × ▢ = 32?",
        },
        answer: 8,
        wrong: [28, 7, 9],
        checkExpr: "32/4",
        solution: {
          en: "Four times something is 32, so share 32 into fours: 32 ÷ 4 = 8. Check: 4 × 8 = 32. Subtracting (28) undoes an addition nobody made.",
          hi: "चार गुना कुछ 32 है, तो 32 को चार-चार में बाँटें: 32 ÷ 4 = 8। जाँच: 4 × 8 = 32। घटाना (28) उस जोड़ को उलटता है जो हुआ ही नहीं।",
          mr: "चार पट काहीतरी 32 आहे, तर 32 चे चार-चार करा: 32 ÷ 4 = 8. तपासा: 4 × 8 = 32. वजाबाकी (28) न झालेली बेरीज उलटवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A garden has 9 rows of plants with 6 plants in each row. Without counting one by one, how many plants are there?",
          hi: "एक बग़ीचे में पौधों की 9 क़तारें हैं, हर क़तार में 6 पौधे। एक-एक गिने बिना, कुल कितने पौधे हैं?",
          mr: "एका बागेत रोपांच्या 9 रांगा आहेत, प्रत्येक रांगेत 6 रोपे. एकेक न मोजता, एकूण किती रोपे?",
        },
        answer: 54,
        wrong: [15, 56, 45],
        checkExpr: "9*6",
        solution: {
          en: "Rows × plants-per-row: 9 × 6 = 54. The 45 answer slipped to 9 × 5 — a whole plant column vanished.",
          hi: "क़तारें × प्रति-क़तार पौधे: 9 × 6 = 54। 45 वाला उत्तर 9 × 5 पर फिसल गया — पौधों की पूरी एक क़तार ग़ायब।",
          mr: "रांगा × प्रत्येक रांगेतील रोपे: 9 × 6 = 54. 45 हे उत्तर 9 × 5 वर घसरले — रोपांचा अख्खा एक स्तंभ गायब.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A packet holds 12 pencils. The teacher buys 4 packets and gives away 5 pencils. How many pencils remain?",
          hi: "एक पैकेट में 12 पेंसिलें आती हैं। शिक्षिका 4 पैकेट ख़रीदती हैं और 5 पेंसिलें बाँट देती हैं। कितनी पेंसिलें बचीं?",
          mr: "एका पाकिटात 12 पेन्सिली असतात. बाई 4 पाकिटे विकत घेतात आणि 5 पेन्सिली वाटतात. किती पेन्सिली उरल्या?",
        },
        answer: 43,
        wrong: [48, 53, 28],
        checkExpr: "12*4-5",
        solution: {
          en: "Bought: 12 × 4 = 48. Given away: 48 − 5 = 43. Stopping at 48 skips the giving; adding the 5 instead lands on 53.",
          hi: "ख़रीदीं: 12 × 4 = 48। बाँटीं: 48 − 5 = 43। 48 पर रुकना बाँटना भूलना है; 5 जोड़ देने पर 53 आ जाता है।",
          mr: "घेतल्या: 12 × 4 = 48. वाटल्या: 48 − 5 = 43. 48 वर थांबणे म्हणजे वाटणे विसरणे; 5 मिळवले तर 53 येते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Which costs more, and by how much: 3 kites at ₹8 each, or 2 balls at ₹13 each? Give the difference.",
          hi: "कौन महँगा पड़ेगा और कितने से: ₹8 वाली 3 पतंगें, या ₹13 वाली 2 गेंदें? अंतर बताइए।",
          mr: "कोणते महाग पडेल आणि किती ने: ₹8 चे 3 पतंग, की ₹13 चे 2 चेंडू? फरक सांगा.",
        },
        answer: 2,
        wrong: [5, 24, 26],
        checkExpr: "13*2-8*3",
        fmt: rupees,
        solution: {
          en: "Kites: 3 × 8 = ₹24. Balls: 2 × 13 = ₹26. The balls cost ₹2 more. The other options are the two totals themselves, and 5 is just 13 − 8 — comparing prices without counting how many.",
          hi: "पतंगें: 3 × 8 = ₹24। गेंदें: 2 × 13 = ₹26। गेंदें ₹2 महँगी। बाक़ी विकल्प दोनों योग ही हैं, और 5 केवल 13 − 8 है — बिना गिनती के दामों की तुलना।",
          mr: "पतंग: 3 × 8 = ₹24. चेंडू: 2 × 13 = ₹26. चेंडू ₹2 ने महाग. इतर पर्याय म्हणजे दोन्ही बेरजाच, आणि 5 म्हणजे नुसते 13 − 8 — नग न मोजता किमतींची तुलना.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Rani says: 'I multiplied a number by itself and got 49.' What was her number?",
          hi: "रानी कहती है: 'मैंने एक संख्या को उसी से गुणा किया और 49 मिला।' उसकी संख्या क्या थी?",
          mr: "राणी म्हणते: 'मी एका संख्येला तिनेच गुणले आणि 49 आले.' तिची संख्या कोणती?",
        },
        answer: 7,
        wrong: [6, 8, 24],
        checkExpr: "49/7",
        solution: {
          en: "A number times itself: 7 × 7 = 49. Its neighbours give 36 and 64, close but not 49 — and 24 halves 49 badly, treating 'by itself' as 'by two'.",
          hi: "संख्या का अपने से गुणा: 7 × 7 = 49। पड़ोसी संख्याएँ 36 और 64 देती हैं — पास, पर 49 नहीं। और 24, 'उसी से' को 'दो से' समझने की भूल है।",
          mr: "संख्येचा स्वतःशी गुणाकार: 7 × 7 = 49. शेजारच्या संख्या 36 आणि 64 देतात — जवळ, पण 49 नव्हे. आणि 24 म्हणजे 'तिनेच' ला 'दोनने' समजण्याची चूक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A frog climbs 5 steps every hop, but slips back 2 after each hop. After 4 full hops, how many steps up is it?",
          hi: "एक मेंढक हर छलाँग में 5 सीढ़ियाँ चढ़ता है, पर हर छलाँग के बाद 2 फिसल जाता है। 4 पूरी छलाँगों के बाद वह कितनी सीढ़ियाँ ऊपर है?",
          mr: "एक बेडूक प्रत्येक उडीत 5 पायऱ्या चढतो, पण प्रत्येक उडीनंतर 2 घसरतो. 4 पूर्ण उड्यांनंतर तो किती पायऱ्या वर आहे?",
        },
        answer: 12,
        wrong: [20, 8, 3],
        checkExpr: "(5-2)*4",
        solution: {
          en: "Each full hop truly gains 5 − 2 = 3 steps, and four hops gain 3 × 4 = 12. Twenty forgets the slipping entirely; 3 is a single hop's gain doing duty for four.",
          hi: "हर पूरी छलाँग असल में 5 − 2 = 3 सीढ़ियाँ चढ़ाती है, और चार छलाँगें 3 × 4 = 12। बीस में फिसलन पूरी भुला दी गई; 3 एक छलाँग की कमाई है जो चार का काम कर रही है।",
          mr: "प्रत्येक पूर्ण उडी खरी 5 − 2 = 3 पायऱ्या चढवते, आणि चार उड्या 3 × 4 = 12. वीसमध्ये घसरण पूर्ण विसरली; 3 ही एका उडीची कमाई चौघांचे काम करते आहे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 9 — How Many Times?",
      name: "How Many Times?",
      slug: "maths-3-how-many-times",
      summary:
        "Multiplication as repeated addition — tables put to work on legs, eggs, rickshaws and rows of plants.",
      position: 9,
      translations: {
        hi: {
          name: "कितनी बार?",
          summary: "बार-बार जोड़ के रूप में गुणा — पहाड़े पैरों, अंडों, रिक्शों और पौधों की क़तारों पर काम करते हुए।",
        },
        mr: {
          name: "किती वेळा?",
          summary: "पुनःपुन्हा बेरजेच्या रूपातला गुणाकार — पाढे पाय, अंडी, रिक्षा आणि रोपांच्या रांगांवर कामाला.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 14 — Rupees and Paise (money)                                     */
/* ------------------------------------------------------------------------- */
function rupeesAndPaise(): TopicFileOut {
  const rand = rng("maths-3-rupees-and-paise");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many 50-paise coins make one rupee?",
          hi: "एक रुपया बनाने के लिए 50 पैसे के कितने सिक्के चाहिए?",
          mr: "एक रुपया होण्यासाठी 50 पैशांची किती नाणी लागतील?",
        },
        answer: 2,
        wrong: [5, 4, 10],
        checkExpr: "100/50",
        solution: {
          en: "One rupee is 100 paise, and 100 ÷ 50 = 2 coins. Ten is the count for 10-paise coins — a different coin altogether.",
          hi: "एक रुपया 100 पैसे का है, और 100 ÷ 50 = 2 सिक्के। दस तो 10 पैसे वाले सिक्कों की गिनती है — बिल्कुल दूसरा सिक्का।",
          mr: "एक रुपया म्हणजे 100 पैसे, आणि 100 ÷ 50 = 2 नाणी. दहा ही 10 पैशांच्या नाण्यांची गणती — अगदी वेगळे नाणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two ₹10 notes and one ₹5 coin together make how much?",
          hi: "₹10 के दो नोट और ₹5 का एक सिक्का मिलकर कितने होते हैं?",
          mr: "₹10 च्या दोन नोटा आणि ₹5 चे एक नाणे मिळून किती होतात?",
        },
        answer: 25,
        wrong: [15, 30, 20],
        checkExpr: "10*2+5",
        fmt: rupees,
        solution: {
          en: "10 + 10 + 5 = ₹25. Counting only one note gives ₹15; turning the coin into a note gives ₹30.",
          hi: "10 + 10 + 5 = ₹25। एक ही नोट गिनने पर ₹15; सिक्के को नोट बना देने पर ₹30।",
          mr: "10 + 10 + 5 = ₹25. एकच नोट मोजली तर ₹15; नाण्याची नोट केली तर ₹30.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A toffee costs ₹2. Sonu buys 6 toffees. How much does he pay?",
          hi: "एक टॉफ़ी ₹2 की है। सोनू 6 टॉफ़ियाँ ख़रीदता है। वह कितने पैसे देगा?",
          mr: "एक गोळी ₹2 ची आहे. सोनू 6 गोळ्या घेतो. तो किती पैसे देईल?",
        },
        answer: 12,
        wrong: [8, 10, 14],
        checkExpr: "2*6",
        fmt: rupees,
        solution: {
          en: "6 toffees × ₹2 = ₹12. The answer ₹8 adds 2 and 6; ₹14 counts one toffee too many.",
          hi: "6 टॉफ़ियाँ × ₹2 = ₹12। ₹8 में 2 और 6 जुड़ गए; ₹14 में एक टॉफ़ी ज़्यादा गिनी गई।",
          mr: "6 गोळ्या × ₹2 = ₹12. ₹8 मध्ये 2 आणि 6 ची बेरीज झाली; ₹14 मध्ये एक गोळी जास्त मोजली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Leela has ₹50. Can she buy a ₹35 doll and a ₹20 drum? How much MORE money would she need?",
          hi: "लीला के पास ₹50 हैं। क्या वह ₹35 की गुड़िया और ₹20 का ढोल ख़रीद सकती है? उसे और कितने पैसे चाहिए होंगे?",
          mr: "लीलाकडे ₹50 आहेत. ती ₹35 ची बाहुली आणि ₹20 चा ढोल घेऊ शकेल का? तिला आणखी किती पैसे लागतील?",
        },
        answer: 5,
        wrong: [15, 55, 10],
        checkExpr: "35+20-50",
        fmt: rupees,
        solution: {
          en: "The toys cost 35 + 20 = ₹55, and she has ₹50 — short by 55 − 50 = ₹5. The ₹55 option is the price, not the shortfall.",
          hi: "खिलौनों का दाम 35 + 20 = ₹55, और उसके पास ₹50 — यानी 55 − 50 = ₹5 कम। ₹55 वाला विकल्प दाम है, कमी नहीं।",
          mr: "खेळण्यांची किंमत 35 + 20 = ₹55, आणि तिच्याकडे ₹50 — म्हणजे 55 − 50 = ₹5 कमी. ₹55 हा पर्याय किंमत आहे, तूट नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Rafi pays for a ₹28 kite with a ₹50 note. How much change does he get?",
          hi: "रफ़ी ₹28 की पतंग के लिए ₹50 का नोट देता है। उसे कितने पैसे वापस मिलेंगे?",
          mr: "रफी ₹28 च्या पतंगासाठी ₹50 ची नोट देतो. त्याला किती पैसे परत मिळतील?",
        },
        answer: 22,
        wrong: [32, 28, 78],
        checkExpr: "50-28",
        fmt: rupees,
        solution: {
          en: "Change: 50 − 28 = ₹22. Count up to check: 28 + 2 = 30, and 30 + 20 = 50 — the shopkeeper's way. ₹32 is the borrow going wrong; ₹78 added the price to the note.",
          hi: "वापसी: 50 − 28 = ₹22। जाँच के लिए ऊपर गिनें: 28 + 2 = 30, और 30 + 20 = 50 — दुकानदार का तरीक़ा। ₹32 में उधार बिगड़ा; ₹78 में दाम नोट में जुड़ गया।",
          mr: "परत: 50 − 28 = ₹22. तपासायला वर मोजा: 28 + 2 = 30, आणि 30 + 20 = 50 — दुकानदाराची रीत. ₹32 मध्ये उसनवारी चुकली; ₹78 मध्ये किंमत नोटेत मिळाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A rail ticket costs ₹15. What do 4 tickets cost?",
          hi: "एक रेल टिकट ₹15 का है। 4 टिकटों का दाम कितना होगा?",
          mr: "एक रेल्वे तिकीट ₹15 चे आहे. 4 तिकिटांची किंमत किती?",
        },
        answer: 60,
        wrong: [19, 45, 64],
        checkExpr: "15*4",
        fmt: rupees,
        solution: {
          en: "4 × 15: four tens are 40 and four fives are 20, together ₹60. ₹45 counts three tickets; ₹19 adds the 4 to the price.",
          hi: "4 × 15: चार दहाई 40 और चार पाँच 20, कुल ₹60। ₹45 तीन टिकट गिनता है; ₹19 में 4 दाम में जुड़ गया।",
          mr: "4 × 15: चार दशक 40 आणि चार पाच 20, मिळून ₹60. ₹45 तीन तिकिटे मोजते; ₹19 मध्ये 4 किमतीत मिळाले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Nisha bought a pencil for ₹7, a rubber for ₹5 and a sharpener for ₹9, and paid with a ₹100 note. What change did she get?",
          hi: "निशा ने ₹7 की पेंसिल, ₹5 का रबर और ₹9 का शार्पनर ख़रीदा, और ₹100 का नोट दिया। उसे कितने पैसे वापस मिले?",
          mr: "निशाने ₹7 ची पेन्सिल, ₹5 चा खोडरबर आणि ₹9 चा शार्पनर घेतला, आणि ₹100 ची नोट दिली. तिला किती पैसे परत मिळाले?",
        },
        answer: 79,
        wrong: [21, 89, 69],
        checkExpr: "100-7-5-9",
        fmt: rupees,
        solution: {
          en: "Spent: 7 + 5 + 9 = ₹21. Change: 100 − 21 = ₹79. The ₹21 option hands back the bill instead of the change; ₹89 lost the sharpener along the way.",
          hi: "ख़र्च: 7 + 5 + 9 = ₹21। वापसी: 100 − 21 = ₹79। ₹21 वाला विकल्प वापसी की जगह बिल थमा देता है; ₹89 के रास्ते में शार्पनर खो गया।",
          mr: "खर्च: 7 + 5 + 9 = ₹21. परत: 100 − 21 = ₹79. ₹21 हा पर्याय परताव्याऐवजी बिलच देतो; ₹89 च्या वाटेत शार्पनर हरवला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Which is worth more, and the answer is that amount: five ₹20 notes, or ₹95 in a purse?",
          hi: "किसका मूल्य अधिक है — वही राशि उत्तर है: ₹20 के पाँच नोट, या बटुए में ₹95?",
          mr: "कशाची किंमत जास्त — तीच रक्कम उत्तर: ₹20 च्या पाच नोटा, की पाकिटातले ₹95?",
        },
        answer: 100,
        wrong: [95, 115, 90],
        checkExpr: "20*5",
        fmt: rupees,
        solution: {
          en: "Five twenties make 5 × 20 = ₹100, which beats ₹95. Adding the two amounts (₹195) or averaging them answers nothing — the question is a comparison.",
          hi: "पाँच बीस यानी 5 × 20 = ₹100, जो ₹95 से अधिक है। दोनों राशियाँ जोड़ना या औसत निकालना किसी काम का नहीं — सवाल तुलना का है।",
          mr: "पाच वीस म्हणजे 5 × 20 = ₹100, जे ₹95 हून जास्त. दोन्ही रकमा मिळवणे वा सरासरी काढणे निरुपयोगी — प्रश्न तुलनेचा आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Idlis cost ₹12 a plate and vadas ₹15 a plate. The family orders 2 plates of each and pays ₹100. What change comes back?",
          hi: "इडली ₹12 प्लेट और वड़ा ₹15 प्लेट है। परिवार हर एक की 2 प्लेटें मँगाता है और ₹100 देता है। कितने पैसे वापस आएँगे?",
          mr: "इडली ₹12 प्लेट आणि वडा ₹15 प्लेट. कुटुंब प्रत्येकी 2 प्लेटा मागवते आणि ₹100 देते. किती पैसे परत येतील?",
        },
        answer: 46,
        wrong: [54, 73, 27],
        checkExpr: "100-(12+15)*2",
        fmt: rupees,
        solution: {
          en: "One of each: 12 + 15 = ₹27; two of each: ₹54. Change: 100 − 54 = ₹46. The ₹54 option is the bill; ₹73 charges for one round only.",
          hi: "एक-एक प्लेट: 12 + 15 = ₹27; दो-दो: ₹54। वापसी: 100 − 54 = ₹46। ₹54 बिल है; ₹73 में एक ही दौर का दाम लगा।",
          mr: "एकेक प्लेट: 12 + 15 = ₹27; दोन-दोन: ₹54. परत: 100 − 54 = ₹46. ₹54 हे बिल; ₹73 मध्ये एकाच फेरीची किंमत लागली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Amina saves ₹8 every week. After how many weeks can she buy a ₹56 book?",
          hi: "अमीना हर सप्ताह ₹8 बचाती है। कितने सप्ताहों बाद वह ₹56 की किताब ख़रीद सकेगी?",
          mr: "अमिना दर आठवड्याला ₹8 साठवते. किती आठवड्यांनी ती ₹56 चे पुस्तक घेऊ शकेल?",
        },
        answer: 7,
        wrong: [8, 6, 48],
        checkExpr: "56/8",
        solution: {
          en: "₹56 gathered ₹8 at a time takes 56 ÷ 8 = 7 weeks. The eights run 8, 16, 24, 32, 40, 48, 56 — 48 is where week six ends, one short.",
          hi: "₹8 करके ₹56 जुटाने में 56 ÷ 8 = 7 सप्ताह लगते हैं। आठ का पहाड़ा 8, 16, 24, 32, 40, 48, 56 — 48 पर छठा सप्ताह ख़त्म होता है, एक कम।",
          mr: "₹8 करत ₹56 जमवायला 56 ÷ 8 = 7 आठवडे लागतात. आठचा पाढा 8, 16, 24, 32, 40, 48, 56 — 48 वर सहावा आठवडा संपतो, एक कमी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A shopkeeper must give ₹37 in change using the FEWEST notes and coins (₹20, ₹10, ₹5, ₹2, ₹1). How many pieces does he hand over?",
          hi: "दुकानदार को कम-से-कम नोट-सिक्कों (₹20, ₹10, ₹5, ₹2, ₹1) में ₹37 वापस देने हैं। वह कुल कितने नोट-सिक्के देगा?",
          mr: "दुकानदाराला कमीत कमी नोटा-नाण्यांत (₹20, ₹10, ₹5, ₹2, ₹1) ₹37 परत द्यायचे आहेत. तो एकूण किती नोटा-नाणी देईल?",
        },
        answer: 4,
        wrong: [5, 3, 37],
        checkExpr: "37-20-10-5-2+4",
        solution: {
          en: "Greedy from the top: ₹20, then ₹10 (30), then ₹5 (35), then ₹2 (37) — four pieces, and no three pieces can reach 37 since even 20+10+5 stops at 35. (The check-sum 37−20−10−5−2+4 = 4 just re-counts the pieces.)",
          hi: "बड़े से शुरू: ₹20, फिर ₹10 (30), फिर ₹5 (35), फिर ₹2 (37) — चार नोट-सिक्के। तीन से 37 बनता ही नहीं, क्योंकि 20+10+5 भी 35 पर रुकता है।",
          mr: "मोठ्यापासून सुरुवात: ₹20, मग ₹10 (30), मग ₹5 (35), मग ₹2 (37) — चार नोटा-नाणी. तिघांत 37 होतच नाही, कारण 20+10+5 सुद्धा 35 वर थांबते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Ticket prices: child ₹12, adult ₹25. A family paid exactly ₹74. How many CHILDREN went, if two adults did?",
          hi: "टिकट: बच्चा ₹12, बड़ा ₹25। एक परिवार ने ठीक ₹74 दिए। यदि दो बड़े गए, तो कितने बच्चे गए?",
          mr: "तिकीट: मूल ₹12, मोठे ₹25. एका कुटुंबाने नेमके ₹74 दिले. दोन मोठे गेले असतील, तर किती मुले गेली?",
        },
        answer: 2,
        wrong: [3, 1, 4],
        checkExpr: "(74-25*2)/12",
        solution: {
          en: "Two adults cost 2 × 25 = ₹50, leaving 74 − 50 = ₹24 for children — and 24 ÷ 12 = 2 children. Three children would need ₹36, overshooting what remained.",
          hi: "दो बड़ों के 2 × 25 = ₹50, बच्चों के लिए बचे 74 − 50 = ₹24 — और 24 ÷ 12 = 2 बच्चे। तीन बच्चों को ₹36 चाहिए होते, जो बचत से ज़्यादा है।",
          mr: "दोन मोठ्यांचे 2 × 25 = ₹50, मुलांसाठी उरले 74 − 50 = ₹24 — आणि 24 ÷ 12 = 2 मुले. तीन मुलांना ₹36 लागले असते, उरलेल्याहून जास्त.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 14 — Rupees and Paise",
      name: "Rupees and Paise",
      slug: "maths-3-rupees-and-paise",
      summary:
        "Money that adds up — counting notes and coins, paying bills, and checking the change before leaving the shop.",
      position: 14,
      translations: {
        hi: {
          name: "रुपये और पैसे",
          summary: "हिसाब वाला पैसा — नोट-सिक्के गिनना, बिल चुकाना, और दुकान से निकलने से पहले वापसी जाँचना।",
        },
        mr: {
          name: "रुपये आणि पैसे",
          summary: "हिशोबातला पैसा — नोटा-नाणी मोजणे, बिल देणे, आणि दुकानातून निघण्याआधी परतावा तपासणे.",
        },
      },
    },
    qs,
  );
}

export const G3_MATHS: TopicFileOut[] = [
  funWithNumbers(),
  giveAndTake(),
  howManyTimes(),
  rupeesAndPaise(),
];
