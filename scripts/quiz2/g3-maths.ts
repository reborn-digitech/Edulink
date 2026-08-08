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
import type { Chapter, OutQuestion, TopicFileOut } from "./engine";
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

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Long and Short (length: cm and m)                             */
/* ------------------------------------------------------------------------- */
function longAndShort(): TopicFileOut {
  const rand = rng("maths-3-long-and-short");
  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });
  const m = (n: number) => ({ en: `${n} metres`, hi: `${n} मीटर`, mr: `${n} मीटर` });
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many centimetres make one metre?",
          hi: "एक मीटर में कितने सेंटीमीटर होते हैं?",
          mr: "एका मीटरमध्ये किती सेंटिमीटर असतात?",
        },
        answer: 100,
        wrong: [10, 1000, 60],
        checkExpr: "10*10",
        solution: {
          en: "One metre is 100 centimetres — ten tens of them. 1000 belongs to metres-in-a-kilometre, and 60 to minutes-in-an-hour; units love to swap in a hurry.",
          hi: "एक मीटर 100 सेंटीमीटर का होता है — दस दहाइयाँ। 1000 किलोमीटर के मीटरों का है, और 60 घंटे के मिनटों का; जल्दबाज़ी में इकाइयाँ आपस में बदल जाती हैं।",
          mr: "एक मीटर म्हणजे 100 सेंटिमीटर — दहा दशक. 1000 हे किलोमीटरमधल्या मीटरांचे, आणि 60 तासातल्या मिनिटांचे; घाईत एकके एकमेकांत बदलतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A pencil is about 14 of WHICH unit long — so what number of centimetres is a good guess for a new pencil?",
          hi: "नई पेंसिल की लंबाई का अच्छा अनुमान कितने सेंटीमीटर है?",
          mr: "नव्या पेन्सिलच्या लांबीचा चांगला अंदाज किती सेंटिमीटर?",
        },
        answer: 14,
        wrong: [140, 2, 50],
        fmt: cm,
        solution: {
          en: "A new pencil spans about 14 cm — a bit more than your hand. 140 cm is taller than most eight-year-olds, and 2 cm is a fingernail.",
          hi: "नई पेंसिल लगभग 14 सेमी होती है — हथेली से थोड़ी ज़्यादा। 140 सेमी तो अधिकांश आठ साल के बच्चों से लंबी है, और 2 सेमी नाख़ुन भर।",
          mr: "नवी पेन्सिल सुमारे 14 सेमी असते — तळहाताहून थोडी जास्त. 140 सेमी बहुतेक आठ वर्षांच्या मुलांहून उंच, आणि 2 सेमी म्हणजे नखभर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A rope is 3 metres long. How many centimetres is that?",
          hi: "एक रस्सी 3 मीटर लंबी है। यह कितने सेंटीमीटर हुई?",
          mr: "एक दोरी 3 मीटर लांब आहे. म्हणजे किती सेंटिमीटर?",
        },
        answer: 300,
        wrong: [30, 103, 3000],
        checkExpr: "3*100",
        fmt: cm,
        solution: {
          en: "Each metre is 100 cm, so 3 metres are 3 × 100 = 300 cm. Writing 30 multiplies by ten instead of a hundred.",
          hi: "हर मीटर 100 सेमी है, इसलिए 3 मीटर = 3 × 100 = 300 सेमी। 30 लिखना सौ की जगह दस से गुणा करना है।",
          mr: "प्रत्येक मीटर 100 सेमी, म्हणून 3 मीटर = 3 × 100 = 300 सेमी. 30 लिहिणे म्हणजे शंभराऐवजी दहाने गुणणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Meera's ribbon is 85 cm and Zoya's is 1 metre. By how many centimetres is Zoya's longer?",
          hi: "मीरा का रिबन 85 सेमी और ज़ोया का 1 मीटर है। ज़ोया का रिबन कितने सेंटीमीटर लंबा है?",
          mr: "मीराची रिबन 85 सेमी आणि झोयाची 1 मीटर आहे. झोयाची रिबन किती सेंटिमीटरने लांब?",
        },
        answer: 15,
        wrong: [84, 25, 5],
        checkExpr: "100-85",
        fmt: cm,
        solution: {
          en: "Put both in the same unit first: 1 metre = 100 cm. Then 100 − 85 = 15 cm. Comparing 85 with 1 without converting makes the metre look tiny — that is the trap.",
          hi: "पहले दोनों को एक ही इकाई में लाएँ: 1 मीटर = 100 सेमी। फिर 100 − 85 = 15 सेमी। बिना बदले 85 की तुलना 1 से करने पर मीटर नन्हा दिखता है — यही चूक है।",
          mr: "आधी दोन्ही एकाच एककात आणा: 1 मीटर = 100 सेमी. मग 100 − 85 = 15 सेमी. न बदलता 85 ची तुलना 1 शी केली की मीटर चिमुकला दिसतो — हीच चूक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A 90 cm ribbon is cut into three equal pieces. How long is each piece?",
          hi: "90 सेमी का रिबन तीन बराबर टुकड़ों में काटा गया। हर टुकड़ा कितना लंबा है?",
          mr: "90 सेमीची रिबन तीन समान तुकड्यांत कापली. प्रत्येक तुकडा किती लांब?",
        },
        answer: 30,
        wrong: [45, 27, 87],
        checkExpr: "90/3",
        fmt: cm,
        solution: {
          en: "Equal pieces mean sharing: 90 ÷ 3 = 30 cm each. Halving (45) cuts into two, not three; 87 subtracts the 3 as if it were centimetres.",
          hi: "बराबर टुकड़े यानी बाँटना: 90 ÷ 3 = 30 सेमी प्रति टुकड़ा। आधा करना (45) दो टुकड़े हैं, तीन नहीं; 87 में 3 को सेंटीमीटर समझकर घटा दिया गया।",
          mr: "समान तुकडे म्हणजे भागाकार: 90 ÷ 3 = 30 सेमी प्रत्येकी. निम्मे (45) म्हणजे दोन तुकडे, तीन नव्हे; 87 मध्ये 3 ला सेंटिमीटर समजून वजा केले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Arjun walks 250 metres to the well and 250 metres back. How far does he walk in all?",
          hi: "अर्जुन कुएँ तक 250 मीटर जाता है और 250 मीटर लौटता है। वह कुल कितना चलता है?",
          mr: "अर्जुन विहिरीपर्यंत 250 मीटर जातो आणि 250 मीटर परत येतो. तो एकूण किती चालतो?",
        },
        answer: 500,
        wrong: [250, 450, 2500],
        checkExpr: "250+250",
        fmt: m,
        solution: {
          en: "There and back doubles the walk: 250 + 250 = 500 metres. Answering 250 counts only one way — the return trip walked itself, apparently.",
          hi: "आना-जाना रास्ते को दुगना करता है: 250 + 250 = 500 मीटर। 250 कहना केवल एक तरफ़ गिनना है — वापसी शायद अपने आप चल ली।",
          mr: "जाणे-येणे रस्ता दुप्पट करते: 250 + 250 = 500 मीटर. 250 म्हणणे म्हणजे एकच बाजू मोजणे — परतीचा रस्ता जणू स्वतःच चालला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A bamboo pole was 2 metres long. After 40 cm was sawn off, how many centimetres remain?",
          hi: "एक बाँस 2 मीटर लंबा था। 40 सेमी काट देने के बाद कितने सेंटीमीटर बचे?",
          mr: "एक बांबू 2 मीटर लांब होता. 40 सेमी कापल्यावर किती सेंटिमीटर उरले?",
        },
        answer: 160,
        wrong: [38, 240, 60],
        checkExpr: "200-40",
        fmt: cm,
        solution: {
          en: "Convert, then cut: 2 m = 200 cm, and 200 − 40 = 160 cm. Getting 38 subtracts 40 from a '2' that was never centimetres; 240 adds the sawn piece back on.",
          hi: "पहले बदलें, फिर काटें: 2 मी = 200 सेमी, और 200 − 40 = 160 सेमी। 38 उस '2' में से 40 घटाता है जो कभी सेंटीमीटर था ही नहीं; 240 कटा टुकड़ा वापस जोड़ देता है।",
          mr: "आधी बदला, मग कापा: 2 मी = 200 सेमी, आणि 200 − 40 = 160 सेमी. 38 म्हणजे कधीच सेंटिमीटर नसलेल्या '2' मधून 40 वजा करणे; 240 कापलेला तुकडा परत जोडते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Three sticks measure 45 cm, 60 cm and 55 cm. Laid end to end in a straight line, how far do they reach?",
          hi: "तीन छड़ियाँ 45 सेमी, 60 सेमी और 55 सेमी की हैं। सीधी रेखा में सिरे-से-सिरा रखने पर वे कितनी दूर पहुँचती हैं?",
          mr: "तीन काठ्या 45 सेमी, 60 सेमी आणि 55 सेमी आहेत. सरळ रेषेत टोकाला टोक लावल्यास त्या किती दूर पोहोचतात?",
        },
        answer: 160,
        wrong: [150, 170, 100],
        checkExpr: "45+60+55",
        fmt: cm,
        solution: {
          en: "End to end means add all three: 45 + 60 + 55 = 160 cm. A tidy pairing helps: 45 + 55 = 100, then + 60. Answers of 150 or 170 are one stick mis-added by ten.",
          hi: "सिरे-से-सिरा यानी तीनों जोड़ें: 45 + 60 + 55 = 160 सेमी। सुघड़ जोड़ी मदद करती है: 45 + 55 = 100, फिर + 60। 150 या 170 में एक छड़ी दस से चूक गई।",
          mr: "टोकाला टोक म्हणजे तिन्हींची बेरीज: 45 + 60 + 55 = 160 सेमी. सोपी जोडी उपयोगी: 45 + 55 = 100, मग + 60. 150 वा 170 मध्ये एक काठी दहाने चुकली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A snail climbs a 20 cm wall. Each day it climbs 7 cm, but each night it slides down 2 cm. At the end of which day does it first reach the top?",
          hi: "एक घोंघा 20 सेमी की दीवार चढ़ता है। दिन में 7 सेमी चढ़ता है, रात में 2 सेमी फिसलता है। किस दिन के अंत में वह पहली बार चोटी पर पहुँचता है?",
          mr: "एक गोगलगाय 20 सेमीची भिंत चढते. दिवसा 7 सेमी चढते, रात्री 2 सेमी घसरते. कोणत्या दिवसाच्या शेवटी ती प्रथम माथ्यावर पोहोचते?",
        },
        answer: 4,
        wrong: [3, 2, 5],
        solution: {
          en: "Walk it out: end of day 1 it stands at 7, slides to 5 by dawn. Day 2: up to 12, down to 10. Day 3: up to 17, down to 15. Day 4: 15 + 7 = 22 — past the 20 cm top BEFORE the night can pull it back, so day 4 is the answer. The trap answer 3 treats the last day like every other, letting a night slide happen after the snail has already arrived.",
          hi: "हर दिन-रात में 7 − 2 = 5 सेमी की बढ़त होती है। दिन 1 के अंत में 7; रात के बाद 5। दिन 2: 12; रात के बाद 10। दिन 3: 17; रात के बाद 15। दिन 4 की चढ़ाई 15 से 22 तक — यानी चोटी दिन 4 की चढ़ाई में, फिसलन से पहले ही, पार हो जाती है। '3' वाला उत्तर हर दिन 5 सेमी मानने की चूक है — गिनती को क़दम-क़दम चलाकर जाँचें।",
          mr: "प्रत्येक दिवस-रात्रीत 7 − 2 = 5 सेमीची वाढ. दिवस 1 अखेर 7; रात्रीनंतर 5. दिवस 2: 12; रात्रीनंतर 10. दिवस 3: 17; रात्रीनंतर 15. दिवस 4 ची चढाई 15 वरून 22 — म्हणजे माथा दिवस 4 च्या चढाईतच, घसरण्याआधीच, गाठला जातो. '3' हे उत्तर रोज 5 सेमी धरण्याची चूक — मोजणी पावलापावलाने तपासा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A running track is 400 metres around. Dhruv runs 3 full rounds and then 150 metres more. How many metres has he run?",
          hi: "दौड़ का ट्रैक 400 मीटर का है। ध्रुव 3 पूरे चक्कर और फिर 150 मीटर दौड़ता है। वह कुल कितने मीटर दौड़ा?",
          mr: "धावण्याचा ट्रॅक 400 मीटरचा आहे. ध्रुव 3 पूर्ण फेऱ्या आणि मग 150 मीटर धावतो. तो एकूण किती मीटर धावला?",
        },
        answer: 1350,
        wrong: [1200, 550, 1250],
        checkExpr: "400*3+150",
        fmt: m,
        solution: {
          en: "Rounds first: 3 × 400 = 1200 m, then the extra 150: 1350 m. Stopping at 1200 forgets the last stretch; 550 runs one round only.",
          hi: "पहले चक्कर: 3 × 400 = 1200 मी, फिर ऊपर से 150: 1350 मी। 1200 पर रुकना आख़िरी हिस्सा भूलना है; 550 में एक ही चक्कर लगा।",
          mr: "आधी फेऱ्या: 3 × 400 = 1200 मी, मग वरचे 150: 1350 मी. 1200 वर थांबणे म्हणजे शेवटचा पल्ला विसरणे; 550 मध्ये एकच फेरी झाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A carpenter needs pieces of exactly 35 cm. From a 2-metre plank, how many full pieces can she cut?",
          hi: "एक बढ़ई को ठीक 35 सेमी के टुकड़े चाहिए। 2 मीटर के तख़्ते से वह कितने पूरे टुकड़े काट सकती है?",
          mr: "एका सुताराला नेमके 35 सेमीचे तुकडे हवेत. 2 मीटरच्या फळीतून ती किती पूर्ण तुकडे कापू शकते?",
        },
        answer: 5,
        wrong: [6, 4, 7],
        checkExpr: "(200-25)/35",
        solution: {
          en: "2 m = 200 cm. Five pieces use 5 × 35 = 175 cm, leaving 25 cm — too short for a sixth. Six pieces would need 210 cm, more than the plank. The leftover is the whole question: division with something remaining.",
          hi: "2 मी = 200 सेमी। पाँच टुकड़ों में 5 × 35 = 175 सेमी लगते हैं, 25 सेमी बचता है — छठे के लिए बहुत छोटा। छह टुकड़ों को 210 सेमी चाहिए, तख़्ते से ज़्यादा। बचा हुआ ही असली सवाल है — शेष वाली भाग।",
          mr: "2 मी = 200 सेमी. पाच तुकड्यांना 5 × 35 = 175 सेमी लागतात, 25 सेमी उरते — सहाव्यासाठी फारच कमी. सहा तुकड्यांना 210 सेमी लागले असते, फळीहून जास्त. उरलेलेच खरा प्रश्न — बाकी असलेला भागाकार.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Tara is taller than Iqbal. Iqbal is taller than Sana. Sana is 110 cm and Tara is 126 cm. Which of these CAN be Iqbal's height?",
          hi: "तारा, इक़बाल से लंबी है। इक़बाल, सना से लंबा है। सना 110 सेमी और तारा 126 सेमी है। इनमें से इक़बाल की लंबाई क्या हो सकती है?",
          mr: "तारा इक्बालहून उंच आहे. इक्बाल सनाहून उंच आहे. सना 110 सेमी आणि तारा 126 सेमी आहे. यांपैकी इक्बालची उंची किती असू शकते?",
        },
        answer: 118,
        wrong: [108, 130, 110],
        fmt: cm,
        solution: {
          en: "Iqbal stands between them: taller than 110, shorter than 126. Only 118 fits that window. 108 puts him below Sana, 130 above Tara, and 110 makes him exactly Sana — but 'taller than' allows no tie.",
          hi: "इक़बाल दोनों के बीच है: 110 से लंबा, 126 से छोटा। केवल 118 इस दायरे में आता है। 108 उसे सना से नीचे कर देता है, 130 तारा से ऊपर, और 110 ठीक सना के बराबर — पर 'से लंबा' में बराबरी नहीं चलती।",
          mr: "इक्बाल दोघांच्या मध्ये: 110 हून उंच, 126 हून ठेंगणा. फक्त 118 या चौकटीत बसते. 108 त्याला सनाखाली नेते, 130 ताराच्या वर, आणि 110 म्हणजे नेमका सनाइतका — पण 'हून उंच' मध्ये बरोबरी चालत नाही.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 4 — Long and Short",
      name: "Long and Short",
      slug: "maths-3-long-and-short",
      summary:
        "Centimetres and metres — measuring, converting, and the puzzles that hide in a length of rope.",
      position: 4,
      translations: {
        hi: {
          name: "लंबा और छोटा",
          summary: "सेंटीमीटर और मीटर — नापना, बदलना, और रस्सी की लंबाई में छिपी पहेलियाँ।",
        },
        mr: {
          name: "लांब आणि आखूड",
          summary: "सेंटिमीटर आणि मीटर — मोजणे, बदलणे, आणि दोरीच्या लांबीत लपलेली कोडी.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Time Goes On (clocks and calendars)                           */
/* ------------------------------------------------------------------------- */
function timeGoesOn(): TopicFileOut {
  const rand = rng("maths-3-time-goes-on");
  const mins = (n: number) => ({ en: `${n} minutes`, hi: `${n} मिनट`, mr: `${n} मिनिटे` });
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many months are there in a year?",
          hi: "एक वर्ष में कितने महीने होते हैं?",
          mr: "एका वर्षात किती महिने असतात?",
        },
        answer: 12,
        wrong: [10, 24, 52],
        checkExpr: "6*2",
        solution: {
          en: "A year holds 12 months, January through December. 52 counts its weeks, and 24 its fortnights — real numbers, wrong question.",
          hi: "वर्ष में 12 महीने होते हैं, जनवरी से दिसंबर तक। 52 उसके सप्ताह गिनता है — सही संख्या, ग़लत सवाल।",
          mr: "वर्षात 12 महिने असतात, जानेवारी ते डिसेंबर. 52 त्याचे आठवडे मोजते — खरी संख्या, चुकीचा प्रश्न.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The long hand of a clock takes how many minutes to go all the way around once?",
          hi: "घड़ी की बड़ी सुई को एक पूरा चक्कर लगाने में कितने मिनट लगते हैं?",
          mr: "घड्याळाच्या मोठ्या काट्याला एक पूर्ण फेरी मारायला किती मिनिटे लागतात?",
        },
        answer: 60,
        wrong: [12, 30, 24],
        checkExpr: "6*10",
        solution: {
          en: "One full circle of the minute hand is one hour — 60 minutes. Thirty is only half the face; 12 counts the numbers it passes, not the minutes.",
          hi: "मिनट की सुई का एक पूरा चक्कर एक घंटा है — 60 मिनट। तीस आधा चेहरा ही है; 12 उन अंकों की गिनती है जिनसे वह गुज़रती है, मिनटों की नहीं।",
          mr: "मिनिट काट्याची एक पूर्ण फेरी म्हणजे एक तास — 60 मिनिटे. तीस म्हणजे अर्धेच वर्तुळ; 12 ही तो ओलांडतो त्या आकड्यांची मोजणी, मिनिटांची नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "School starts at 9 o'clock and the first bell rings 40 minutes later. The clock then shows how many minutes past 9?",
          hi: "स्कूल 9 बजे शुरू होता है और पहली घंटी 40 मिनट बाद बजती है। तब घड़ी 9 बजकर कितने मिनट दिखाती है?",
          mr: "शाळा 9 वाजता सुरू होते आणि पहिली घंटा 40 मिनिटांनी वाजते. तेव्हा घड्याळ 9 वाजून किती मिनिटे दाखवते?",
        },
        answer: 40,
        wrong: [20, 50, 30],
        checkExpr: "9*0+40",
        solution: {
          en: "Forty minutes after 9:00 the clock reads 9:40 — the minute hand points at the 8, because each clock number is worth 5 minutes and 8 × 5 = 40.",
          hi: "9:00 के चालीस मिनट बाद घड़ी 9:40 दिखाती है — मिनट की सुई 8 पर होती है, क्योंकि घड़ी का हर अंक 5 मिनट का है और 8 × 5 = 40।",
          mr: "9:00 नंतर चाळीस मिनिटांनी घड्याळ 9:40 दाखवते — मिनिट काटा 8 वर असतो, कारण घड्याळाचा प्रत्येक आकडा 5 मिनिटांचा आणि 8 × 5 = 40.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Today is the 12th of the month. What date will it be exactly one week from today?",
          hi: "आज महीने की 12 तारीख़ है। ठीक एक सप्ताह बाद कौन-सी तारीख़ होगी?",
          mr: "आज महिन्याची 12 तारीख आहे. बरोबर एका आठवड्याने कोणती तारीख असेल?",
        },
        answer: 19,
        wrong: [18, 20, 5],
        checkExpr: "12+7",
        solution: {
          en: "A week is 7 days: 12 + 7 = 19. Counting the 12th itself as day one lands you a day early on 18 — the classic fence-post slip.",
          hi: "सप्ताह 7 दिन का है: 12 + 7 = 19। 12 तारीख़ को ही पहला दिन गिनने पर एक दिन पहले, 18 पर, पहुँच जाते हैं — गिनती की जानी-पहचानी चूक।",
          mr: "आठवडा 7 दिवसांचा: 12 + 7 = 19. 12 तारखेलाच पहिला दिवस धरले की एक दिवस आधी, 18 वर, पोहोचता — मोजणीची नेहमीची चूक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A cartoon starts at 5 o'clock and ends at half past 5. How many minutes long is it?",
          hi: "एक कार्टून 5 बजे शुरू होकर साढ़े 5 बजे ख़त्म होता है। वह कितने मिनट चला?",
          mr: "एक कार्टून 5 वाजता सुरू होऊन साडेपाचला संपते. ते किती मिनिटे चालले?",
        },
        answer: 30,
        wrong: [50, 5, 60],
        checkExpr: "60/2",
        fmt: mins,
        solution: {
          en: "Half past 5 is 30 minutes after 5 o'clock — half of the hour's 60. Sixty would run to 6 o'clock; 5 confuses the hour number with the minutes.",
          hi: "साढ़े 5 यानी 5 बजे से तीस मिनट बाद — घंटे के 60 का आधा। साठ तो 6 बजे तक चलता; 5 घंटे के अंक को मिनट समझ बैठा।",
          mr: "साडेपाच म्हणजे 5 नंतर तीस मिनिटे — तासाच्या 60 चा अर्धा. साठ म्हणजे 6 पर्यंत चालले असते; 5 ने तासाचा आकडा मिनिटे समजला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Nani's train left on Monday and reached on Thursday of the same week. For how many nights was she on the train?",
          hi: "नानी की रेलगाड़ी सोमवार को चली और उसी सप्ताह गुरुवार को पहुँची। वे कितनी रातें रेल में रहीं?",
          mr: "आजीची रेल्वे सोमवारी निघाली आणि त्याच आठवड्यात गुरुवारी पोहोचली. ती किती रात्री गाडीत होती?",
        },
        answer: 3,
        wrong: [4, 2, 5],
        checkExpr: "4-1",
        solution: {
          en: "Monday night, Tuesday night, Wednesday night — 3 nights, then Thursday's arrival. Counting both end DAYS gives 4, but the question asks nights, the gaps between them.",
          hi: "सोमवार की रात, मंगलवार की रात, बुधवार की रात — तीन रातें, फिर गुरुवार की सुबह पहुँचना। दोनों सिरों के दिन गिनने से 4 आता है, पर सवाल रातों का है — दिनों के बीच की दूरियों का।",
          mr: "सोमवारची रात्र, मंगळवारची रात्र, बुधवारची रात्र — तीन रात्री, मग गुरुवारी पोहोचणे. दोन्ही टोकांचे दिवस मोजले की 4 येते, पण प्रश्न रात्रींचा — दिवसांमधल्या अंतरांचा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Abdul slept at 9 o'clock at night and woke at 6 in the morning. For how many hours did he sleep?",
          hi: "अब्दुल रात 9 बजे सोया और सुबह 6 बजे उठा। वह कितने घंटे सोया?",
          mr: "अब्दुल रात्री 9 वाजता झोपला आणि सकाळी 6 वाजता उठला. तो किती तास झोपला?",
        },
        answer: 9,
        wrong: [3, 15, 8],
        checkExpr: "3+6",
        solution: {
          en: "From 9 at night to midnight is 3 hours; midnight to 6 is 6 more: 3 + 6 = 9 hours. Subtracting 6 from 9 gives 3 — but the night crossed twelve, and plain subtraction cannot follow it there.",
          hi: "रात 9 से आधी रात तक 3 घंटे; आधी रात से 6 बजे तक 6 और: 3 + 6 = 9 घंटे। 9 में से 6 घटाने पर 3 आता है — पर रात बारह के पार गई, और सीधी घटाई वहाँ पीछा नहीं कर पाती।",
          mr: "रात्री 9 ते मध्यरात्र 3 तास; मध्यरात्र ते 6 आणखी 6: 3 + 6 = 9 तास. 9 मधून 6 वजा केले की 3 येते — पण रात्र बाराच्या पलीकडे गेली, आणि सरळ वजाबाकी तिथे पाठलाग करू शकत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "One episode runs 25 minutes. Bela watched 3 episodes back to back. For how many minutes did she watch?",
          hi: "एक कड़ी 25 मिनट की है। बेला ने लगातार 3 कड़ियाँ देखीं। उसने कितने मिनट देखा?",
          mr: "एक भाग 25 मिनिटांचा आहे. बेलाने सलग 3 भाग पाहिले. तिने किती मिनिटे पाहिले?",
        },
        answer: 75,
        wrong: [28, 65, 50],
        checkExpr: "25*3",
        fmt: mins,
        solution: {
          en: "3 × 25 = 75 minutes — an hour and a quarter. The 65 answer multiplied the tens but added the fives; 50 stopped an episode early.",
          hi: "3 × 25 = 75 मिनट — सवा घंटा। 65 में दहाई का गुणा हुआ पर पाँचों की जोड़; 50 एक कड़ी पहले रुक गया।",
          mr: "3 × 25 = 75 मिनिटे — सव्वा तास. 65 मध्ये दशकाचा गुणाकार पण पाचांची बेरीज; 50 एक भाग आधीच थांबले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The bus to Nani's village leaves every 45 minutes. The first bus goes at 7:00. Ammi and Ruk reach the stop at 8:20. How many minutes must they wait for the next bus?",
          hi: "नानी के गाँव की बस हर 45 मिनट पर छूटती है। पहली बस 7:00 बजे जाती है। अम्मी और रुख़ 8:20 पर अड्डे पहुँचती हैं। अगली बस के लिए उन्हें कितने मिनट रुकना होगा?",
          mr: "आजीच्या गावाची बस दर 45 मिनिटांनी सुटते. पहिली बस 7:00 ला जाते. अम्मी आणि रुख 8:20 ला थांब्यावर पोहोचतात. पुढच्या बससाठी त्यांना किती मिनिटे थांबावे लागेल?",
        },
        answer: 10,
        wrong: [25, 45, 40],
        checkExpr: "90+45-80-45",
        fmt: mins,
        solution: {
          en: "Buses go at 7:00, 7:45, 8:30… They arrive at 8:20, after the 7:45 has gone, so the next is 8:30 — a 10-minute wait. Waiting the full 45 assumes they just missed one; the timetable, not the interval, decides.",
          hi: "बसें 7:00, 7:45, 8:30… पर जाती हैं। वे 8:20 पर पहुँचीं, 7:45 वाली निकल चुकी, अगली 8:30 की — 10 मिनट की प्रतीक्षा। पूरे 45 मिनट रुकना यह मानना है कि बस अभी-अभी छूटी; फ़ैसला समय-सारणी करती है, अंतराल नहीं।",
          mr: "बसा 7:00, 7:45, 8:30… ला जातात. त्या 8:20 ला पोहोचल्या, 7:45 ची गेलेली, पुढची 8:30 ची — 10 मिनिटांची वाट. पूर्ण 45 थांबणे म्हणजे बस आत्ताच सुटली असे धरणे; निर्णय वेळापत्रक करते, अंतर नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The 1st of a month falls on a Friday. What DATE is the third Sunday of that month?",
          hi: "किसी महीने की 1 तारीख़ शुक्रवार है। उस महीने का तीसरा रविवार किस तारीख़ को होगा?",
          mr: "एका महिन्याची 1 तारीख शुक्रवारी आहे. त्या महिन्याचा तिसरा रविवार कोणत्या तारखेला येईल?",
        },
        answer: 17,
        wrong: [15, 21, 10],
        checkExpr: "3+7+7",
        solution: {
          en: "If the 1st is Friday, the first Sunday is the 3rd. Sundays then land every 7 days: 3rd, 10th, 17th — the third one is the 17th. Choosing 21 counts three whole weeks from the 1st, forgetting the first Sunday came early.",
          hi: "1 तारीख़ शुक्रवार है तो पहला रविवार 3 को। फिर रविवार हर 7 दिन पर: 3, 10, 17 — तीसरा रविवार 17 को। 21 चुनना 1 तारीख़ से तीन पूरे सप्ताह गिनना है, यह भूलकर कि पहला रविवार जल्दी आ गया था।",
          mr: "1 तारीख शुक्रवार असेल तर पहिला रविवार 3 ला. मग रविवार दर 7 दिवसांनी: 3, 10, 17 — तिसरा रविवार 17 ला. 21 निवडणे म्हणजे 1 पासून तीन पूर्ण आठवडे मोजणे — पहिला रविवार लवकर आला हे विसरून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A candle burns down completely in 60 minutes. Dadi lights it at 20 minutes past 7. At what number of minutes past 8 does it go out?",
          hi: "एक मोमबत्ती 60 मिनट में पूरी जल जाती है। दादी उसे 7 बजकर 20 मिनट पर जलाती हैं। वह 8 बजकर कितने मिनट पर बुझेगी?",
          mr: "एक मेणबत्ती 60 मिनिटांत पूर्ण जळते. आजी ती 7 वाजून 20 मिनिटांनी लावते. ती 8 वाजून किती मिनिटांनी विझेल?",
        },
        answer: 20,
        wrong: [40, 60, 0],
        checkExpr: "20+60-60",
        fmt: mins,
        solution: {
          en: "An hour after 7:20 is 8:20 — the minutes past the hour stay the same when you add exactly one hour. The pull toward 8:00 comes from rounding the start to 7:00 in your head.",
          hi: "7:20 के एक घंटे बाद 8:20 होता है — ठीक एक घंटा जोड़ने पर मिनट जस के तस रहते हैं। 8:00 की ओर खिंचाव मन-ही-मन शुरुआत को 7:00 मान लेने से आता है।",
          mr: "7:20 नंतर एक तासाने 8:20 — नेमका एक तास मिळवला की मिनिटे जशीच्या तशी राहतात. 8:00 कडचा ओढा मनातल्या मनात सुरुवात 7:00 धरल्याने येतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 7 — Time Goes On",
      name: "Time Goes On",
      slug: "maths-3-time-goes-on",
      summary:
        "Clocks, calendars and the counting they hide — half past, a week from today, and the night that crosses twelve.",
      position: 7,
      translations: {
        hi: {
          name: "समय चलता जाए",
          summary: "घड़ियाँ, कैलेंडर और उनमें छिपी गिनती — साढ़े, आज से एक सप्ताह, और बारह पार करती रात।",
        },
        mr: {
          name: "वेळ पुढे जातो",
          summary: "घड्याळे, दिनदर्शिका आणि त्यांत लपलेली मोजणी — साडे, आजपासून आठवडा, आणि बारा ओलांडणारी रात्र.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Can We Share? (division as equal sharing)                    */
/* ------------------------------------------------------------------------- */
function canWeShare(): TopicFileOut {
  const rand = rng("maths-3-can-we-share");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "12 laddoos are shared equally among 4 children. How many does each child get?",
          hi: "12 लड्डू 4 बच्चों में बराबर बाँटे गए। हर बच्चे को कितने मिले?",
          mr: "12 लाडू 4 मुलांत समान वाटले. प्रत्येक मुलाला किती मिळाले?",
        },
        answer: 3,
        wrong: [4, 8, 16],
        checkExpr: "12/4",
        solution: {
          en: "Sharing equally is division: 12 ÷ 4 = 3 laddoos each. Check by giving them out in rounds — one each, one each, one each — three rounds empty the plate. 8 subtracts, 16 adds; neither shares.",
          hi: "बराबर बाँटना भाग है: 12 ÷ 4 = 3 लड्डू प्रति बच्चा। बारी-बारी देकर जाँचें — एक-एक, एक-एक, एक-एक — तीन चक्करों में थाली ख़ाली। 8 घटाव है, 16 जोड़; दोनों में बँटवारा नहीं।",
          mr: "समान वाटणे म्हणजे भागाकार: 12 ÷ 4 = 3 लाडू प्रत्येकी. फेरीफेरीने देऊन तपासा — एकेक, एकेक, एकेक — तीन फेऱ्यांत ताट रिकामे. 8 म्हणजे वजाबाकी, 16 बेरीज; दोन्हींत वाटणी नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many pairs can be made from 10 socks?",
          hi: "10 मोज़ों से कितनी जोड़ियाँ बन सकती हैं?",
          mr: "10 मोज्यांच्या किती जोड्या होतील?",
        },
        answer: 5,
        wrong: [10, 2, 8],
        checkExpr: "10/2",
        solution: {
          en: "A pair takes 2, so 10 ÷ 2 = 5 pairs. Ten forgets the pairing; 2 answers 'how many in a pair' instead.",
          hi: "जोड़ी में 2 लगते हैं, तो 10 ÷ 2 = 5 जोड़ियाँ। दस में जोड़ी बनी ही नहीं; 2 'जोड़ी में कितने' का उत्तर है।",
          mr: "जोडीला 2 लागतात, म्हणून 10 ÷ 2 = 5 जोड्या. दहामध्ये जोडी झालीच नाही; 2 हे 'जोडीत किती' चे उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A gardener plants 24 saplings equally in 6 rows. How many saplings stand in each row?",
          hi: "माली 24 पौधे 6 क़तारों में बराबर लगाता है। हर क़तार में कितने पौधे लगे?",
          mr: "माळी 24 रोपे 6 रांगांत समान लावतो. प्रत्येक रांगेत किती रोपे?",
        },
        answer: 4,
        wrong: [6, 18, 30],
        checkExpr: "24/6",
        solution: {
          en: "24 ÷ 6 = 4 in each row — and 6 × 4 = 24 checks it. Answering 6 repeats the number of rows; 18 subtracts them instead of sharing among them.",
          hi: "24 ÷ 6 = 4 प्रति क़तार — और 6 × 4 = 24 से जाँच हो जाती है। 6 कहना क़तारों की संख्या दोहराना है; 18 में बाँटने की जगह घटाया गया।",
          mr: "24 ÷ 6 = 4 प्रत्येक रांगेत — आणि 6 × 4 = 24 ने तपासणी. 6 म्हणणे म्हणजे रांगांची संख्या पुन्हा सांगणे; 18 मध्ये वाटण्याऐवजी वजा केले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "13 bananas are shared equally among 4 monkeys. After each gets its fair share, how many bananas are LEFT OVER?",
          hi: "13 केले 4 बंदरों में बराबर बाँटे गए। सबको बराबर हिस्सा मिलने के बाद कितने केले बचे?",
          mr: "13 केळी 4 माकडांत समान वाटली. प्रत्येकाला समान वाटा मिळाल्यावर किती केळी उरली?",
        },
        answer: 1,
        wrong: [3, 4, 0],
        checkExpr: "13-4*3",
        solution: {
          en: "Each monkey gets 3 (that uses 4 × 3 = 12), and 13 − 12 = 1 banana remains. The 3 option is the share, not the remainder — the question asks about what is left on the plate.",
          hi: "हर बंदर को 3 मिले (यानी 4 × 3 = 12 लगे), और 13 − 12 = 1 केला बचा। 3 वाला विकल्प हिस्सा है, शेष नहीं — सवाल थाली में बचे हुए का है।",
          mr: "प्रत्येक माकडाला 3 (म्हणजे 4 × 3 = 12 गेली), आणि 13 − 12 = 1 केळे उरले. 3 हा पर्याय वाटा आहे, बाकी नव्हे — प्रश्न ताटात उरलेल्याचा आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A story book of 40 pages is read 8 pages a day. In how many days is it finished?",
          hi: "40 पृष्ठों की कहानी की किताब रोज़ 8 पृष्ठ पढ़ी जाती है। कितने दिनों में ख़त्म होगी?",
          mr: "40 पानांचे गोष्टीचे पुस्तक रोज 8 पाने वाचले जाते. किती दिवसांत संपेल?",
        },
        answer: 5,
        wrong: [8, 32, 6],
        checkExpr: "40/8",
        solution: {
          en: "40 ÷ 8 = 5 days: the eights run 8, 16, 24, 32, 40. Six days would need 48 pages; 32 is where day four ends, not a number of days at all.",
          hi: "40 ÷ 8 = 5 दिन: आठ का पहाड़ा 8, 16, 24, 32, 40। छह दिनों को 48 पृष्ठ चाहिए होते; 32 चौथे दिन का पड़ाव है, दिनों की संख्या नहीं।",
          mr: "40 ÷ 8 = 5 दिवस: आठचा पाढा 8, 16, 24, 32, 40. सहा दिवसांना 48 पाने लागली असती; 32 हा चौथ्या दिवसाचा मुक्काम, दिवसांची संख्या नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Dadi made 35 rotis and packed them equally into 5 tiffin boxes. Each box holds how many rotis?",
          hi: "दादी ने 35 रोटियाँ बनाईं और 5 डिब्बों में बराबर रखीं। हर डिब्बे में कितनी रोटियाँ हैं?",
          mr: "आजीने 35 पोळ्या केल्या आणि 5 डब्यांत समान भरल्या. प्रत्येक डब्यात किती पोळ्या?",
        },
        answer: 7,
        wrong: [5, 30, 40],
        checkExpr: "35/5",
        solution: {
          en: "35 ÷ 5 = 7 rotis a box, and 5 × 7 = 35 confirms it. Five echoes the boxes; 30 and 40 are the neighbours of 35 wearing a disguise.",
          hi: "35 ÷ 5 = 7 रोटियाँ प्रति डिब्बा, और 5 × 7 = 35 से पुष्टि। पाँच डिब्बों की गूँज है; 30 और 40 भेस बदले हुए 35 के पड़ोसी हैं।",
          mr: "35 ÷ 5 = 7 पोळ्या प्रत्येक डब्यात, आणि 5 × 7 = 35 ने खात्री. पाच ही डब्यांची पुनरुक्ती; 30 आणि 40 हे वेष बदललेले 35 चे शेजारी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What number belongs in the box: ▢ ÷ 6 = 7?",
          hi: "बॉक्स में कौन-सी संख्या होगी: ▢ ÷ 6 = 7?",
          mr: "चौकटीत कोणती संख्या हवी: ▢ ÷ 6 = 7?",
        },
        answer: 42,
        wrong: [13, 36, 48],
        checkExpr: "6*7",
        solution: {
          en: "If a hidden number split into 6 parts gives 7 each, the whole was 6 × 7 = 42. Adding (13) mixes the operations; 36 and 48 are the neighbouring rows of the six-times table.",
          hi: "छिपी संख्या के 6 हिस्सों में 7-7 आए, तो पूरी संख्या 6 × 7 = 42 थी। जोड़ना (13) संक्रियाएँ गड्डमड्ड करता है; 36 और 48 छह के पहाड़े की पड़ोसी पंक्तियाँ हैं।",
          mr: "लपलेल्या संख्येच्या 6 भागांत 7-7 आले, तर पूर्ण संख्या 6 × 7 = 42 होती. बेरीज (13) क्रिया मिसळते; 36 आणि 48 या सहाच्या पाढ्यातील शेजारच्या ओळी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A packet of 50 stickers is shared equally among 8 friends. How many stickers does each friend get (full stickers only)?",
          hi: "50 स्टिकरों का पैकेट 8 दोस्तों में बराबर बाँटा गया। हर दोस्त को कितने (पूरे) स्टिकर मिले?",
          mr: "50 स्टिकरांचे पाकीट 8 मित्रांत समान वाटले. प्रत्येक मित्राला किती (पूर्ण) स्टिकर मिळाले?",
        },
        answer: 6,
        wrong: [7, 8, 2],
        checkExpr: "(50-2)/8",
        solution: {
          en: "Eights: 8, 16, 24, 32, 40, 48 — six each uses 48 stickers, and 2 are left over. Seven each would need 56, more than the packet. The 2 option is the leftover posing as the share.",
          hi: "आठ का पहाड़ा: 8, 16, 24, 32, 40, 48 — छह-छह में 48 स्टिकर लगते हैं, 2 बचते हैं। सात-सात को 56 चाहिए होते, पैकेट से ज़्यादा। 2 वाला विकल्प हिस्से के भेस में शेष है।",
          mr: "आठचा पाढा: 8, 16, 24, 32, 40, 48 — सहा-सहामध्ये 48 स्टिकर जातात, 2 उरतात. सात-सातसाठी 56 लागले असते, पाकिटाहून जास्त. 2 हा पर्याय वाट्याच्या वेषातली बाकी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A basket held 60 guavas. First 12 bruised ones were removed, then the rest were shared equally among 6 shops. How many did each shop get?",
          hi: "टोकरी में 60 अमरूद थे। पहले 12 दबे हुए निकाले गए, फिर बाक़ी 6 दुकानों में बराबर बाँटे गए। हर दुकान को कितने मिले?",
          mr: "टोपलीत 60 पेरू होते. आधी 12 दबलेले काढले, मग उरलेले 6 दुकानांत समान वाटले. प्रत्येक दुकानाला किती मिळाले?",
        },
        answer: 8,
        wrong: [10, 12, 6],
        checkExpr: "(60-12)/6",
        solution: {
          en: "Remove first: 60 − 12 = 48. Then share: 48 ÷ 6 = 8 each. Dividing before removing gives 10 — the bruised guavas got sold in that version.",
          hi: "पहले निकालें: 60 − 12 = 48। फिर बाँटें: 48 ÷ 6 = 8 प्रति दुकान। निकालने से पहले भाग देने पर 10 आता है — उस हिसाब में दबे अमरूद भी बिक गए।",
          mr: "आधी काढा: 60 − 12 = 48. मग वाटा: 48 ÷ 6 = 8 प्रत्येकी. काढण्याआधी भागल्यास 10 येते — त्या हिशेबात दबलेले पेरूही विकले गेले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Three friends shared the cost of a ₹96 cricket bat equally. Later a fourth friend joined and they shared it again equally among all four. How much LESS did each of the first three then pay?",
          hi: "तीन दोस्तों ने ₹96 के बल्ले का ख़र्च बराबर बाँटा। बाद में चौथा दोस्त जुड़ा और चारों में फिर बराबर बँटवारा हुआ। पहले तीनों में से हर एक को अब कितना कम देना पड़ा?",
          mr: "तीन मित्रांनी ₹96 च्या बॅटचा खर्च समान वाटला. नंतर चौथा मित्र आला आणि चौघांत पुन्हा समान वाटणी झाली. पहिल्या तिघांपैकी प्रत्येकाला आता किती कमी द्यावे लागले?",
        },
        answer: 8,
        wrong: [32, 24, 4],
        checkExpr: "96/3-96/4",
        fmt: rupees,
        solution: {
          en: "Three ways: 96 ÷ 3 = ₹32 each. Four ways: 96 ÷ 4 = ₹24 each. The relief is 32 − 24 = ₹8. The options ₹32 and ₹24 are the two shares themselves — the question asks for the gap between them.",
          hi: "तीन हिस्से: 96 ÷ 3 = ₹32। चार हिस्से: 96 ÷ 4 = ₹24। राहत हुई 32 − 24 = ₹8। ₹32 और ₹24 दोनों हिस्से ही हैं — सवाल उनके बीच के अंतर का है।",
          mr: "तीन वाटे: 96 ÷ 3 = ₹32. चार वाटे: 96 ÷ 4 = ₹24. सूट झाली 32 − 24 = ₹8. ₹32 आणि ₹24 हे दोन्ही वाटेच — प्रश्न त्यांच्यातील फरकाचा आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "27 children are going boating. Each boat carries at most 4 children. What is the SMALLEST number of boats they need?",
          hi: "27 बच्चे नौका-विहार पर जा रहे हैं। हर नाव में अधिकतम 4 बच्चे बैठते हैं। उन्हें कम-से-कम कितनी नावें चाहिए?",
          mr: "27 मुले नौकाविहाराला जात आहेत. प्रत्येक होडीत जास्तीत जास्त 4 मुले बसतात. त्यांना किमान किती होड्या लागतील?",
        },
        answer: 7,
        wrong: [6, 8, 5],
        checkExpr: "(27+1)/4",
        solution: {
          en: "Six boats seat 6 × 4 = 24, leaving 3 children on the bank — so boat number 7 must go, part empty. Division says 27 ÷ 4 = 6 remainder 3, and here the remainder ROUNDS UP: children cannot be left behind.",
          hi: "छह नावों में 6 × 4 = 24 बैठते हैं, 3 बच्चे किनारे रह जाते हैं — इसलिए सातवीं नाव जानी ही चाहिए, भले अधूरी भरी। भाग कहता है 27 ÷ 4 = 6 शेष 3, और यहाँ शेष ऊपर चढ़ता है: बच्चे छोड़े नहीं जा सकते।",
          mr: "सहा होड्यांत 6 × 4 = 24 बसतात, 3 मुले काठावर उरतात — म्हणून सातवी होडी जायलाच हवी, अर्धी रिकामी असली तरी. भागाकार सांगतो 27 ÷ 4 = 6 बाकी 3, आणि इथे बाकी वर चढते: मुलांना मागे ठेवता येत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A number shared among 5 children gives 6 each with 2 left over. What is the number?",
          hi: "एक संख्या 5 बच्चों में बाँटने पर हर एक को 6 मिलते हैं और 2 बचते हैं। वह संख्या क्या है?",
          mr: "एक संख्या 5 मुलांत वाटल्यावर प्रत्येकाला 6 मिळतात आणि 2 उरतात. ती संख्या कोणती?",
        },
        answer: 32,
        wrong: [30, 28, 13],
        checkExpr: "5*6+2",
        solution: {
          en: "Rebuild it: 5 shares of 6 make 30, plus the 2 left over — 32. Thirty forgets the remainder, and that is precisely what the puzzle is testing.",
          hi: "फिर से जोड़ें: 6-6 के 5 हिस्से यानी 30, और बचे 2 — कुल 32। तीस में शेष भूल गया, और पहेली ठीक यही परख रही है।",
          mr: "पुन्हा उभी करा: 6-6 चे 5 वाटे म्हणजे 30, आणि उरलेले 2 — एकूण 32. तीसमध्ये बाकी विसरली, आणि कोडे नेमके तेच तपासते आहे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 12 — Can We Share?",
      name: "Can We Share?",
      slug: "maths-3-can-we-share",
      summary:
        "Division as fair sharing — equal parts, stubborn leftovers, and the boat that must sail part empty.",
      position: 12,
      translations: {
        hi: {
          name: "क्या हम बाँट सकते हैं?",
          summary: "न्यायपूर्ण बँटवारे के रूप में भाग — बराबर हिस्से, ज़िद्दी शेष, और वह नाव जो अधूरी भरी चलती है।",
        },
        mr: {
          name: "आपण वाटू शकतो का?",
          summary: "न्याय्य वाटणीच्या रूपातला भागाकार — समान वाटे, हट्टी बाकी, आणि अर्धी रिकामी निघणारी होडी.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Who is Heavier? (weight: kg and g)                            */
/* ------------------------------------------------------------------------- */
function whoIsHeavier(): TopicFileOut {
  const rand = rng("maths-3-who-is-heavier");
  const g = (n: number) => ({ en: `${n} g`, hi: `${n} ग्राम`, mr: `${n} ग्रॅम` });
  const kg = (n: number) => ({ en: `${n} kg`, hi: `${n} किग्रा`, mr: `${n} किलो` });
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many grams make one kilogram?",
          hi: "एक किलोग्राम में कितने ग्राम होते हैं?",
          mr: "एका किलोग्रॅममध्ये किती ग्रॅम असतात?",
        },
        answer: 1000,
        wrong: [100, 500, 10],
        checkExpr: "10*100",
        solution: {
          en: "One kilogram is 1000 grams — 'kilo' always means a thousand. 100 belongs to the metre-centimetre family, and 500 is only half a kilo.",
          hi: "एक किलोग्राम 1000 ग्राम का है — 'किलो' का अर्थ सदा हज़ार। 100 मीटर-सेंटीमीटर परिवार का है, और 500 आधा किलो ही है।",
          mr: "एक किलोग्रॅम म्हणजे 1000 ग्रॅम — 'किलो' म्हणजे नेहमी हजार. 100 हे मीटर-सेंटिमीटर कुटुंबातले, आणि 500 म्हणजे अर्धाच किलो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A brinjal weighs 250 g. Four such brinjals together weigh how many grams?",
          hi: "एक बैंगन 250 ग्राम का है। ऐसे चार बैंगनों का कुल भार कितने ग्राम होगा?",
          mr: "एक वांगे 250 ग्रॅमचे आहे. अशा चार वांग्यांचे मिळून वजन किती ग्रॅम?",
        },
        answer: 1000,
        wrong: [254, 750, 500],
        checkExpr: "250*4",
        fmt: g,
        solution: {
          en: "4 × 250 = 1000 g — exactly one kilogram. The quarters of a kilo add up like the quarters of a rupee once did: four of them make the whole.",
          hi: "4 × 250 = 1000 ग्राम — ठीक एक किलोग्राम। किलो की चौथाइयाँ वैसे ही जुड़ती हैं जैसे कभी रुपये की चवन्नियाँ — चार से पूरा बनता है।",
          mr: "4 × 250 = 1000 ग्रॅम — बरोबर एक किलोग्रॅम. किलोचे चतकोर रुपयाच्या पावल्यांसारखे जुळतात — चारांनी पूर्ण होतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "On a balance, a papaya sits on one pan. On the other pan, a 500 g weight and a 200 g weight make it level. What does the papaya weigh?",
          hi: "तराज़ू के एक पलड़े पर पपीता है। दूसरे पलड़े पर 500 ग्राम और 200 ग्राम के बाट रखने पर तराज़ू बराबर हो जाता है। पपीते का भार कितना है?",
          mr: "तराजूच्या एका पारड्यात पपई आहे. दुसऱ्या पारड्यात 500 ग्रॅम आणि 200 ग्रॅमची वजने ठेवल्यावर तराजू समतोल होतो. पपईचे वजन किती?",
        },
        answer: 700,
        wrong: [300, 520, 750],
        checkExpr: "500+200",
        fmt: g,
        solution: {
          en: "Level pans mean equal weight: 500 + 200 = 700 g. Subtracting the weights (300) reads the balance backwards — nothing is being taken away.",
          hi: "बराबर पलड़े यानी बराबर भार: 500 + 200 = 700 ग्राम। बाटों को घटाना (300) तराज़ू को उल्टा पढ़ना है — यहाँ कुछ घट नहीं रहा।",
          mr: "समतोल पारडी म्हणजे समान वजन: 500 + 200 = 700 ग्रॅम. वजने वजा करणे (300) म्हणजे तराजू उलटा वाचणे — इथे काही कमी होत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Amma bought 2 kg of rice and 500 g of dal. How many grams did her bag carry in all?",
          hi: "अम्मा ने 2 किलो चावल और 500 ग्राम दाल ख़रीदी। उनके थैले में कुल कितने ग्राम भार था?",
          mr: "अम्माने 2 किलो तांदूळ आणि 500 ग्रॅम डाळ घेतली. तिच्या पिशवीत एकूण किती ग्रॅम वजन होते?",
        },
        answer: 2500,
        wrong: [502, 700, 2050],
        checkExpr: "2000+500",
        fmt: g,
        solution: {
          en: "Same unit first: 2 kg = 2000 g, then 2000 + 500 = 2500 g. Adding 2 and 500 as they stand gives the nonsense 502 — kilograms and grams cannot be added raw.",
          hi: "पहले एक इकाई: 2 किलो = 2000 ग्राम, फिर 2000 + 500 = 2500 ग्राम। 2 और 500 को जस का तस जोड़ने पर 502 की बेतुकी संख्या — किलो और ग्राम कच्चे नहीं जुड़ते।",
          mr: "आधी एकच एकक: 2 किलो = 2000 ग्रॅम, मग 2000 + 500 = 2500 ग्रॅम. 2 आणि 500 तसेच मिळवले की 502 ची निरर्थक संख्या — किलो आणि ग्रॅम कच्चे जुळत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A watermelon weighs 3 kg and a pumpkin 5 kg. The pumpkin is heavier by how many grams?",
          hi: "तरबूज़ 3 किलो का है और कद्दू 5 किलो का। कद्दू कितने ग्राम भारी है?",
          mr: "कलिंगड 3 किलोचे आणि भोपळा 5 किलोचा आहे. भोपळा किती ग्रॅमने जड आहे?",
        },
        answer: 2000,
        wrong: [2, 8000, 200],
        checkExpr: "5000-3000",
        fmt: g,
        solution: {
          en: "The gap is 5 − 3 = 2 kg, and the question asks it in grams: 2000 g. Answering '2' stops before converting; 8000 adds the fruits together.",
          hi: "अंतर 5 − 3 = 2 किलो है, और सवाल ग्राम में पूछा गया: 2000 ग्राम। '2' बदलने से पहले रुक जाता है; 8000 में दोनों फल जुड़ गए।",
          mr: "फरक 5 − 3 = 2 किलो, आणि प्रश्न ग्रॅममध्ये विचारला: 2000 ग्रॅम. '2' बदलण्याआधीच थांबते; 8000 मध्ये दोन्ही फळे एकत्र झाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A tin held 1 kg of ghee. After 350 g was used for laddoos, how many grams remain in the tin?",
          hi: "डिब्बे में 1 किलो घी था। लड्डुओं में 350 ग्राम लगने के बाद डिब्बे में कितने ग्राम बचे?",
          mr: "डब्यात 1 किलो तूप होते. लाडवांसाठी 350 ग्रॅम वापरल्यावर डब्यात किती ग्रॅम उरले?",
        },
        answer: 650,
        wrong: [750, 350, 550],
        checkExpr: "1000-350",
        fmt: g,
        solution: {
          en: "1 kg = 1000 g, and 1000 − 350 = 650 g. The borrow across the hundreds trips people to 750; 350 hands back what was used instead of what is left.",
          hi: "1 किलो = 1000 ग्राम, और 1000 − 350 = 650 ग्राम। सैकड़े के पार का उधार 750 पर गिरा देता है; 350 बचे की जगह लगा हुआ लौटा देता है।",
          mr: "1 किलो = 1000 ग्रॅम, आणि 1000 − 350 = 650 ग्रॅम. शतकापलीकडची उसनवारी 750 वर पाडते; 350 उरलेल्याऐवजी वापरलेलेच परत देते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "One pan of a balance holds a 2 kg stone. The other holds a packet of sugar and a 500 g weight, and the pans are level. What does the sugar weigh in grams?",
          hi: "तराज़ू के एक पलड़े पर 2 किलो का पत्थर है। दूसरे पर चीनी का पैकेट और 500 ग्राम का बाट है, और पलड़े बराबर हैं। चीनी का भार कितने ग्राम है?",
          mr: "तराजूच्या एका पारड्यात 2 किलोचा दगड आहे. दुसऱ्यात साखरेचे पाकीट आणि 500 ग्रॅमचे वजन आहे, आणि पारडी समतोल आहेत. साखरेचे वजन किती ग्रॅम?",
        },
        answer: 1500,
        wrong: [2500, 1000, 500],
        checkExpr: "2000-500",
        fmt: g,
        solution: {
          en: "The sugar side already carries 500 g of iron, so the sugar itself is 2000 − 500 = 1500 g. Adding instead (2500) weighs the stone and the weight together — but they sit on opposite pans.",
          hi: "चीनी वाले पलड़े पर 500 ग्राम लोहा पहले से है, इसलिए चीनी 2000 − 500 = 1500 ग्राम है। जोड़ने पर (2500) पत्थर और बाट साथ तुल जाते हैं — पर वे तो आमने-सामने के पलड़ों पर हैं।",
          mr: "साखरेच्या पारड्यात आधीच 500 ग्रॅम लोखंड आहे, म्हणून साखर 2000 − 500 = 1500 ग्रॅम. बेरीज केल्यास (2500) दगड आणि वजन एकत्र तोलले जातात — पण ती तर समोरासमोरच्या पारड्यांत आहेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A shopkeeper packs 5 kg of sugar into bags of 500 g each. How many bags does he fill?",
          hi: "दुकानदार 5 किलो चीनी को 500-500 ग्राम की थैलियों में भरता है। वह कितनी थैलियाँ भरेगा?",
          mr: "दुकानदार 5 किलो साखर 500-500 ग्रॅमच्या पिशव्यांत भरतो. तो किती पिशव्या भरेल?",
        },
        answer: 10,
        wrong: [5, 25, 100],
        checkExpr: "5000/500",
        solution: {
          en: "5 kg = 5000 g, and 5000 ÷ 500 = 10 bags — two half-kilo bags to every kilo. Five counts one bag per kilo, forgetting each kilo splits in two.",
          hi: "5 किलो = 5000 ग्राम, और 5000 ÷ 500 = 10 थैलियाँ — हर किलो पर आधा-आधा किलो की दो। पाँच में हर किलो की एक ही थैली गिनी गई, यह भूलकर कि हर किलो दो में बँटता है।",
          mr: "5 किलो = 5000 ग्रॅम, आणि 5000 ÷ 500 = 10 पिशव्या — दर किलोमागे अर्ध्या किलोच्या दोन. पाचमध्ये दर किलोची एकच पिशवी मोजली — प्रत्येक किलो दोनात विभागतो हे विसरून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Guess first, then check: which is heavier — 3 packets of 400 g biscuits, or a 1 kg jar of pickle? The answer is the heavier one's weight in grams.",
          hi: "पहले अंदाज़ा, फिर जाँच: भारी क्या है — 400 ग्राम वाले बिस्कुट के 3 पैकेट, या 1 किलो का अचार का मर्तबान? उत्तर भारी वाले का भार ग्राम में है।",
          mr: "आधी अंदाज, मग तपासणी: जड काय — 400 ग्रॅमच्या बिस्किटांची 3 पाकिटे, की 1 किलोची लोणच्याची बरणी? उत्तर जड असलेल्याचे वजन ग्रॅममध्ये.",
        },
        answer: 1200,
        wrong: [1000, 400, 403],
        checkExpr: "400*3",
        fmt: g,
        solution: {
          en: "The biscuits: 3 × 400 = 1200 g, beating the jar's 1000 g. Intuition often backs the single big jar against the little packets — which is exactly why the multiplication must be done, not felt.",
          hi: "बिस्कुट: 3 × 400 = 1200 ग्राम, जो मर्तबान के 1000 ग्राम से भारी। अंतर्ज्ञान अक्सर छोटे पैकेटों के मुक़ाबले अकेले बड़े मर्तबान का पक्ष लेता है — इसीलिए गुणा करना पड़ता है, महसूस नहीं।",
          mr: "बिस्किटे: 3 × 400 = 1200 ग्रॅम, बरणीच्या 1000 ग्रॅमहून जड. अंतर्मन अनेकदा छोट्या पाकिटांविरुद्ध एकट्या मोठ्या बरणीची बाजू घेते — म्हणूनच गुणाकार करावा लागतो, वाटून चालत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A brick balances exactly against 1 kg plus HALF a brick. What does the whole brick weigh?",
          hi: "एक ईंट, 1 किलो और आधी ईंट के साथ ठीक बराबर तुलती है। पूरी ईंट का भार कितना है?",
          mr: "एक वीट, 1 किलो आणि अर्धी वीट यांच्याशी बरोबर तोलली जाते. पूर्ण विटेचे वजन किती?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        checkExpr: "1*2",
        fmt: kg,
        solution: {
          en: "Take half a brick off both pans: half a brick balances 1 kg alone. So the whole brick is 2 × 1 = 2 kg. The rushed answer 1 kg reads the puzzle as 'a brick weighs 1 kg and a bit' and skips the beautiful cancelling step.",
          hi: "दोनों पलड़ों से आधी-आधी ईंट हटाएँ: अकेली आधी ईंट 1 किलो के बराबर तुलती है। तो पूरी ईंट 2 × 1 = 2 किलो। हड़बड़ी वाला उत्तर 1 किलो पहेली को 'ईंट किलो भर और कुछ' पढ़कर उस सुंदर काट वाले क़दम को छोड़ देता है।",
          mr: "दोन्ही पारड्यांतून अर्धी-अर्धी वीट काढा: एकटी अर्धी वीट 1 किलोशी तोलली जाते. म्हणून पूर्ण वीट 2 × 1 = 2 किलो. घाईचे उत्तर 1 किलो कोडे 'वीट किलोभर आणि थोडी' असे वाचून ती सुंदर काटाकाटीची पायरी गाळते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Using a balance and only two weights — 1 kg and 3 kg — a grocer can weigh out exactly 2 kg of jaggery. He puts the jaggery with one weight on one pan, the other weight opposite. Which amount below is the jaggery he measured?",
          hi: "तराज़ू और केवल दो बाट — 1 किलो और 3 किलो — से पंसारी ठीक 2 किलो गुड़ तोल लेता है। वह गुड़ को एक बाट के साथ एक पलड़े पर रखता है, दूसरा बाट सामने। नीचे में से तुला हुआ गुड़ कितना है?",
          mr: "तराजू आणि फक्त दोन वजने — 1 किलो व 3 किलो — यांनी वाणी बरोबर 2 किलो गूळ तोलतो. तो गूळ एका वजनासह एका पारड्यात ठेवतो, दुसरे वजन समोर. खाली दिलेल्यांपैकी तोललेला गूळ किती?",
        },
        answer: 2,
        wrong: [4, 3, 1],
        checkExpr: "3-1",
        fmt: kg,
        solution: {
          en: "Jaggery + 1 kg on one side balancing 3 kg on the other means the jaggery is 3 − 1 = 2 kg. Putting a weight on the SAME pan as the goods subtracts it — the balance's oldest trick, and the reason odd weights can measure even amounts.",
          hi: "एक ओर गुड़ + 1 किलो, दूसरी ओर 3 किलो — यानी गुड़ 3 − 1 = 2 किलो। माल के पलड़े पर बाट रखना उसे घटा देता है — तराज़ू की सबसे पुरानी तरकीब, जिसके दम पर विषम बाट सम मात्राएँ तोल लेते हैं।",
          mr: "एका बाजूला गूळ + 1 किलो, दुसरीकडे 3 किलो — म्हणजे गूळ 3 − 1 = 2 किलो. मालाच्याच पारड्यात वजन ठेवणे ते वजा करते — तराजूची सर्वांत जुनी युक्ती, जिच्या जोरावर विषम वजने सम मात्रा तोलतात.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 8 — Who is Heavier?",
      name: "Who is Heavier?",
      slug: "maths-3-who-is-heavier",
      summary:
        "Kilograms and grams on the two pans of a balance — converting, comparing, and the brick that weighs itself.",
      position: 8,
      translations: {
        hi: {
          name: "कौन भारी है?",
          summary: "तराज़ू के दो पलड़ों पर किलो और ग्राम — बदलना, तुलना, और वह ईंट जो ख़ुद को तोलती है।",
        },
        mr: {
          name: "कोण जड आहे?",
          summary: "तराजूच्या दोन पारड्यांत किलो आणि ग्रॅम — बदलणे, तुलना, आणि स्वतःला तोलणारी वीट.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Shapes and Designs (sides, corners, patterns of shapes)       */
/* ------------------------------------------------------------------------- */
function shapesAndDesigns(): TopicFileOut {
  const rand = rng("maths-3-shapes-and-designs");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many sides does a triangle have?",
          hi: "त्रिभुज की कितनी भुजाएँ होती हैं?",
          mr: "त्रिकोणाला किती बाजू असतात?",
        },
        answer: 3,
        wrong: [4, 2, 6],
        checkExpr: "1+2",
        solution: {
          en: "Tri- means three: a triangle has 3 sides and 3 corners. Four sides make a rectangle or square — a different family.",
          hi: "त्रि का अर्थ तीन: त्रिभुज की 3 भुजाएँ और 3 कोने होते हैं। चार भुजाओं से आयत या वर्ग बनता है — अलग परिवार।",
          mr: "त्रि म्हणजे तीन: त्रिकोणाला 3 बाजू आणि 3 कोपरे. चार बाजूंनी आयत वा चौरस होतो — वेगळे कुटुंब.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A carrom board is a square. How many corners does it have?",
          hi: "कैरम बोर्ड वर्गाकार होता है। उसके कितने कोने होते हैं?",
          mr: "कॅरम बोर्ड चौरस असतो. त्याला किती कोपरे असतात?",
        },
        answer: 4,
        wrong: [3, 8, 6],
        checkExpr: "2+2",
        solution: {
          en: "A square has 4 corners, one pocket at each on a carrom board. Eight counts the pockets AND the side midpoints — only the corners were asked.",
          hi: "वर्ग के 4 कोने होते हैं — कैरम पर हर कोने में एक गड्ढा। आठ में गड्ढों के साथ भुजाओं के बीच भी गिन लिए गए — पूछा तो केवल कोनों को था।",
          mr: "चौरसाला 4 कोपरे — कॅरमवर प्रत्येक कोपऱ्यात एक खळगा. आठमध्ये खळग्यांसह बाजूंची मध्येही मोजली गेली — विचारले फक्त कोपरे होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Using matchsticks, Reena made 3 separate triangles. How many matchsticks did she use?",
          hi: "माचिस की तीलियों से रीना ने 3 अलग-अलग त्रिभुज बनाए। उसने कितनी तीलियाँ लगाईं?",
          mr: "काड्यांनी रीनाने 3 वेगवेगळे त्रिकोण केले. तिने किती काड्या वापरल्या?",
        },
        answer: 9,
        wrong: [6, 12, 3],
        checkExpr: "3*3",
        solution: {
          en: "Each separate triangle needs 3 sticks: 3 × 3 = 9. Twelve builds squares by mistake; 6 makes only two triangles.",
          hi: "हर अलग त्रिभुज को 3 तीलियाँ चाहिए: 3 × 3 = 9। बारह से भूलवश वर्ग बनते हैं; 6 से केवल दो त्रिभुज।",
          mr: "प्रत्येक वेगळ्या त्रिकोणाला 3 काड्या: 3 × 3 = 9. बाराने चुकून चौरस होतात; 6 ने फक्त दोन त्रिकोण.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A rectangle's long sides are 8 cm each and short sides 3 cm each. Walking right around its edge covers how many centimetres?",
          hi: "आयत की लंबी भुजाएँ 8-8 सेमी और छोटी 3-3 सेमी हैं। उसके किनारे-किनारे पूरा चक्कर कितने सेंटीमीटर का होगा?",
          mr: "आयताच्या लांब बाजू 8-8 सेमी आणि आखूड 3-3 सेमी आहेत. त्याच्या कडेकडेने पूर्ण फेरी किती सेंटिमीटरची होईल?",
        },
        answer: 22,
        wrong: [11, 24, 19],
        checkExpr: "8+3+8+3",
        solution: {
          en: "All four sides: 8 + 3 + 8 + 3 = 22 cm. Adding just one long and one short (11) walks only half way round.",
          hi: "चारों भुजाएँ: 8 + 3 + 8 + 3 = 22 सेमी। केवल एक लंबी और एक छोटी जोड़ने पर (11) आधा ही चक्कर लगता है।",
          mr: "चारही बाजू: 8 + 3 + 8 + 3 = 22 सेमी. फक्त एक लांब आणि एक आखूड मिळवली (11) की अर्धीच फेरी होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A design is made of 2 triangles and 3 squares. Counting every side of every shape, how many sides are drawn?",
          hi: "एक डिज़ाइन 2 त्रिभुजों और 3 वर्गों से बना है। हर आकृति की हर भुजा गिनें तो कुल कितनी भुजाएँ खिंचीं?",
          mr: "एक नक्षी 2 त्रिकोण आणि 3 चौरसांची आहे. प्रत्येक आकाराची प्रत्येक बाजू मोजली तर एकूण किती बाजू काढल्या?",
        },
        answer: 18,
        wrong: [5, 12, 17],
        checkExpr: "2*3+3*4",
        solution: {
          en: "Triangles bring 2 × 3 = 6 sides, squares 3 × 4 = 12; together 18. Five adds the shapes, not their sides.",
          hi: "त्रिभुजों से 2 × 3 = 6 भुजाएँ, वर्गों से 3 × 4 = 12; कुल 18। पाँच में आकृतियाँ जुड़ीं, भुजाएँ नहीं।",
          mr: "त्रिकोणांच्या 2 × 3 = 6 बाजू, चौरसांच्या 3 × 4 = 12; मिळून 18. पाचमध्ये आकार जुळले, बाजू नव्हेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A wall is tiled with rows of square tiles: 6 tiles in a row, 4 rows. How many tiles cover the wall?",
          hi: "दीवार पर वर्गाकार टाइलों की क़तारें हैं: एक क़तार में 6 टाइलें, 4 क़तारें। दीवार पर कुल कितनी टाइलें लगीं?",
          mr: "भिंतीवर चौरस फरश्यांच्या रांगा आहेत: एका रांगेत 6 फरश्या, 4 रांगा. भिंतीवर एकूण किती फरश्या?",
        },
        answer: 24,
        wrong: [10, 20, 28],
        checkExpr: "6*4",
        solution: {
          en: "Rows of equal tiles multiply: 6 × 4 = 24. Ten adds the row to the count of rows; the neighbours 20 and 28 are one row light and one row heavy.",
          hi: "बराबर टाइलों की क़तारें गुणा होती हैं: 6 × 4 = 24। दस में क़तार और क़तारों की गिनती जुड़ गई; 20 और 28 एक क़तार कम और एक ज़्यादा हैं।",
          mr: "समान फरश्यांच्या रांगा गुणल्या जातात: 6 × 4 = 24. दहामध्ये रांग आणि रांगांची संख्या जुळली; 20 आणि 28 एक रांग कमी व एक जास्त.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Reena joins 2 squares edge to edge to make one rectangle. How many sides does the NEW shape have on its outside?",
          hi: "रीना 2 वर्गों को भुजा-से-भुजा जोड़कर एक आयत बनाती है। नई आकृति के बाहर की ओर कितनी भुजाएँ हैं?",
          mr: "रीना 2 चौरस बाजूला बाजू जोडून एक आयत करते. नव्या आकाराच्या बाहेरच्या बाजू किती?",
        },
        answer: 4,
        wrong: [8, 6, 7],
        checkExpr: "8-4",
        solution: {
          en: "The two joined edges disappear inside, and their neighbours merge into longer sides: what remains outside is a plain rectangle with 4 sides. Eight counts both squares as if they never met.",
          hi: "जुड़ी हुई दोनों भुजाएँ भीतर खो जाती हैं, और उनकी पड़ोसी भुजाएँ मिलकर लंबी हो जाती हैं: बाहर बचता है 4 भुजाओं वाला सीधा-सादा आयत। आठ दोनों वर्गों को ऐसे गिनता है मानो वे कभी मिले ही नहीं।",
          mr: "जोडलेल्या दोन्ही बाजू आत लुप्त होतात, आणि त्यांच्या शेजारच्या बाजू मिळून लांब होतात: बाहेर उरतो 4 बाजूंचा साधा आयत. आठ दोन्ही चौरस जणू कधी भेटलेच नाहीत असे मोजते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A fence is built along one straight side of a field using posts 2 metres apart. With 7 posts standing, how long is the fence?",
          hi: "खेत की एक सीधी ओर 2-2 मीटर की दूरी पर खंभे गाड़कर बाड़ बनाई गई। 7 खंभे खड़े हैं, तो बाड़ कितनी लंबी है?",
          mr: "शेताच्या एका सरळ बाजूला 2-2 मीटर अंतरावर खांब रोवून कुंपण केले. 7 खांब उभे आहेत, तर कुंपण किती लांब?",
        },
        answer: 12,
        wrong: [14, 10, 7],
        checkExpr: "2*6",
        solution: {
          en: "Seven posts make only 6 gaps between them, and 6 × 2 = 12 metres. Multiplying posts by spacing (14) invents a gap beyond the last post — the fence-post error, named after exactly this.",
          hi: "सात खंभों के बीच केवल 6 अंतराल बनते हैं, और 6 × 2 = 12 मीटर। खंभों को दूरी से गुणा करना (14) आख़िरी खंभे के आगे एक और अंतराल गढ़ देता है — 'खंभा-गिनती की चूक' का नाम इसी पर पड़ा।",
          mr: "सात खांबांमध्ये फक्त 6 अंतरे होतात, आणि 6 × 2 = 12 मीटर. खांबांना अंतराने गुणणे (14) शेवटच्या खांबापलीकडे आणखी एक अंतर रचते — 'खांब-मोजणीची चूक' हे नाव यावरूनच पडले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A big square is cut into equal small squares, 3 along each side. The middle one is painted red. How many small squares are NOT red?",
          hi: "एक बड़े वर्ग को बराबर छोटे वर्गों में काटा गया, हर ओर 3-3। बीच वाला लाल रंगा गया। कितने छोटे वर्ग लाल नहीं हैं?",
          mr: "एक मोठा चौरस समान लहान चौरसांत कापला, प्रत्येक बाजूला 3-3. मधला लाल रंगवला. किती लहान चौरस लाल नाहीत?",
        },
        answer: 8,
        wrong: [9, 6, 3],
        checkExpr: "3*3-1",
        solution: {
          en: "Three along each side makes 3 × 3 = 9 small squares; taking out the painted middle leaves 8. Nine forgets the subtraction; 6 imagines only the edges.",
          hi: "हर ओर तीन यानी 3 × 3 = 9 छोटे वर्ग; रँगा हुआ बीच वाला हटाने पर 8 बचे। नौ में घटाव भूला; 6 में केवल किनारे सूझे।",
          mr: "प्रत्येक बाजूला तीन म्हणजे 3 × 3 = 9 लहान चौरस; रंगवलेला मधला काढला की 8 उरतात. नऊमध्ये वजाबाकी विसरली; 6 मध्ये फक्त कडाच दिसल्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Take a square sheet of paper and cut off ONE corner with a straight snip. How many corners does the sheet have now?",
          hi: "काग़ज़ का एक वर्गाकार पन्ना लें और एक सीधी कैंची से उसका एक कोना काट दें। अब पन्ने के कितने कोने हैं?",
          mr: "कागदाचा एक चौरस तुकडा घ्या आणि सरळ कात्रीने त्याचा एक कोपरा कापा. आता कागदाला किती कोपरे आहेत?",
        },
        answer: 5,
        wrong: [3, 4, 6],
        checkExpr: "4-1+2",
        solution: {
          en: "The snip removes 1 corner but its straight edge ENDS in 2 new ones: 4 − 1 + 2 = 5. The pull toward 3 comes from 'cutting off' feeling like pure loss — try it with real paper and count.",
          hi: "कैंची 1 कोना ले जाती है, पर उसका सीधा किनारा 2 नए कोनों पर ख़त्म होता है: 4 − 1 + 2 = 5। 3 की ओर खिंचाव 'काटने' के शुद्ध घाटा लगने से आता है — असली काग़ज़ पर करके गिनें।",
          mr: "कात्री 1 कोपरा नेते, पण तिची सरळ कड 2 नव्या कोपऱ्यांत संपते: 4 − 1 + 2 = 5. 3 कडचा ओढा 'कापणे' म्हणजे निव्वळ तोटा वाटण्याने येतो — खऱ्या कागदावर करून मोजा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "With exactly 10 matchsticks, what is the GREATEST number of separate squares Veer can make (no stick may be shared)?",
          hi: "ठीक 10 तीलियों से वीर अधिकतम कितने अलग-अलग वर्ग बना सकता है (कोई तीली साझा नहीं हो सकती)?",
          mr: "नेमक्या 10 काड्यांनी वीर जास्तीत जास्त किती वेगवेगळे चौरस करू शकतो (कोणतीही काडी सामायिक नाही)?",
        },
        answer: 2,
        wrong: [3, 4, 1],
        checkExpr: "8/4",
        solution: {
          en: "Each separate square eats 4 sticks. Two squares take 8, leaving 2 sticks — not enough for a third, which would need 12 in all. The answer is 2, with two sticks left over honestly unused.",
          hi: "हर अलग वर्ग 4 तीलियाँ लेता है। दो वर्गों में 8 लगीं, 2 बचीं — तीसरे के लिए नाकाफ़ी, जिसे कुल 12 चाहिए होतीं। उत्तर 2 है, और दो तीलियाँ ईमानदारी से बिना लगे बचती हैं।",
          mr: "प्रत्येक वेगळा चौरस 4 काड्या घेतो. दोन चौरसांत 8 गेल्या, 2 उरल्या — तिसऱ्यासाठी अपुऱ्या, त्याला एकूण 12 लागल्या असत्या. उत्तर 2, आणि दोन काड्या प्रामाणिकपणे न वापरता उरतात.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 5 — Shapes and Designs",
      name: "Shapes and Designs",
      slug: "maths-3-shapes-and-designs",
      summary:
        "Sides, corners and tilings — counting what shapes are made of, and what happens when you join or snip them.",
      position: 5,
      translations: {
        hi: {
          name: "आकृतियाँ और डिज़ाइन",
          summary: "भुजाएँ, कोने और टाइलें — आकृतियाँ किससे बनी हैं यह गिनना, और जोड़ने-काटने पर क्या होता है।",
        },
        mr: {
          name: "आकार आणि नक्षी",
          summary: "बाजू, कोपरे आणि फरश्या — आकार कशाचे बनले आहेत ते मोजणे, आणि जोडल्या-कापल्यावर काय होते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Fun with Give and Take (bigger sums, estimation)              */
/* ------------------------------------------------------------------------- */
function funWithGiveAndTake(): TopicFileOut {
  const rand = rng("maths-3-fun-with-give-and-take");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 300 + 400?",
          hi: "300 + 400 कितना है?",
          mr: "300 + 400 किती?",
        },
        answer: 700,
        wrong: [100, 34, 600],
        checkExpr: "300+400",
        solution: {
          en: "Hundreds add like small numbers wearing zeros: 3 + 4 = 7, so 300 + 400 = 700. Getting 100 subtracts instead.",
          hi: "सैकड़े शून्य पहने छोटे अंकों की तरह जुड़ते हैं: 3 + 4 = 7, तो 300 + 400 = 700। 100 में जोड़ की जगह घटाव हुआ।",
          mr: "शतके शून्ये घातलेल्या लहान अंकांसारखी जुळतात: 3 + 4 = 7, म्हणून 300 + 400 = 700. 100 मध्ये बेरजेऐवजी वजाबाकी झाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 500 − 143?",
          hi: "500 − 143 कितना है?",
          mr: "500 − 143 किती?",
        },
        answer: 357,
        wrong: [443, 367, 357 + 100],
        checkExpr: "500-143",
        solution: {
          en: "Borrow across the zeros: 500 − 143 = 357. A quicker road: 143 + 357 = 500, counting up 7 to 150, then 350 more, then… check lands true. The answer 443 subtracted only the hundred.",
          hi: "शून्यों के पार उधार: 500 − 143 = 357। छोटा रास्ता: ऊपर की ओर गिनें — 143 से 150 तक 7, फिर 500 तक 350; कुल 357। 443 में केवल सैकड़ा घटा।",
          mr: "शून्यांपलीकडे उसनवारी: 500 − 143 = 357. जवळचा रस्ता: वर मोजा — 143 पासून 150 पर्यंत 7, मग 500 पर्यंत 350; एकूण 357. 443 मध्ये फक्त शतक वजा झाले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Without adding exactly, ESTIMATE: 198 + 304 is closest to which number?",
          hi: "बिना ठीक-ठीक जोड़े, अंदाज़ा लगाइए: 198 + 304 किस संख्या के सबसे पास है?",
          mr: "नेमकी बेरीज न करता अंदाज करा: 198 + 304 कोणत्या संख्येच्या सर्वांत जवळ आहे?",
        },
        answer: 500,
        wrong: [400, 600, 300],
        checkExpr: "200+300",
        solution: {
          en: "Round first: 198 is nearly 200, 304 nearly 300, and 200 + 300 = 500. The true sum, 502, sits two steps away — a good estimate gets you there before the pencil moves.",
          hi: "पहले गोल करें: 198 लगभग 200, 304 लगभग 300, और 200 + 300 = 500। सच्चा योग 502 दो ही क़दम दूर है — अच्छा अंदाज़ा पेंसिल चलने से पहले पहुँचा देता है।",
          mr: "आधी पूर्णांक करा: 198 जवळजवळ 200, 304 जवळजवळ 300, आणि 200 + 300 = 500. खरी बेरीज 502 दोनच पावले दूर — चांगला अंदाज पेन्सिल हलण्याआधी पोहोचवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A school library has 425 story books and 238 picture books. How many books is that together?",
          hi: "स्कूल के पुस्तकालय में 425 कहानी की और 238 चित्रों की किताबें हैं। दोनों मिलाकर कितनी किताबें हुईं?",
          mr: "शाळेच्या ग्रंथालयात 425 गोष्टींची आणि 238 चित्रांची पुस्तके आहेत. मिळून किती पुस्तके झाली?",
        },
        answer: 663,
        wrong: [653, 187, 673],
        checkExpr: "425+238",
        solution: {
          en: "425 + 238: ones 5 + 8 = 13, carry one; tens 2 + 3 + 1 = 6; hundreds 4 + 2 = 6 — 663. Dropping the carry gives 653; 187 is the difference sneaking in.",
          hi: "425 + 238: इकाई 5 + 8 = 13, एक हासिल; दहाई 2 + 3 + 1 = 6; सैकड़ा 4 + 2 = 6 — 663। हासिल छूटने पर 653; 187 चुपके से आया अंतर है।",
          mr: "425 + 238: एकक 5 + 8 = 13, एक हातचा; दशक 2 + 3 + 1 = 6; शतक 4 + 2 = 6 — 663. हातचा गळाला की 653; 187 म्हणजे चोरपावलांनी आलेली वजाबाकी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A water tank held 800 litres in the morning. By evening 265 litres had been used. How many litres were left?",
          hi: "सुबह टंकी में 800 लीटर पानी था। शाम तक 265 लीटर ख़र्च हो गया। कितने लीटर बचे?",
          mr: "सकाळी टाकीत 800 लिटर पाणी होते. संध्याकाळपर्यंत 265 लिटर वापरले गेले. किती लिटर उरले?",
        },
        answer: 535,
        wrong: [645, 545, 465],
        checkExpr: "800-265",
        solution: {
          en: "800 − 265 = 535. Check upward: 265 + 535 = 800. The answer 545 borrows once and forgets once; 645 never borrows at all.",
          hi: "800 − 265 = 535। ऊपर की ओर जाँचें: 265 + 535 = 800। 545 एक बार उधार लेकर एक बार भूला; 645 ने उधार लिया ही नहीं।",
          mr: "800 − 265 = 535. वर तपासा: 265 + 535 = 800. 545 एकदा उसने घेऊन एकदा विसरले; 645 ने उसनेच घेतले नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What goes in the box: ▢ − 150 = 275?",
          hi: "बॉक्स में क्या आएगा: ▢ − 150 = 275?",
          mr: "चौकटीत काय येईल: ▢ − 150 = 275?",
        },
        answer: 425,
        wrong: [125, 325, 275],
        checkExpr: "275+150",
        solution: {
          en: "Something lost 150 and landed on 275, so it began at 275 + 150 = 425. Subtracting again (125) walks further down instead of back up.",
          hi: "किसी संख्या ने 150 खोकर 275 पर उतरी, तो शुरुआत 275 + 150 = 425 से हुई थी। दोबारा घटाना (125) ऊपर लौटने की जगह और नीचे ले जाता है।",
          mr: "एका संख्येने 150 गमावून 275 गाठले, म्हणून सुरुवात 275 + 150 = 425 पासून होती. पुन्हा वजाबाकी (125) वर परतण्याऐवजी आणखी खाली नेते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Two villages sent grain to a fair: Rampur sent 375 kg and Sitapur 480 kg. How much MORE did Sitapur send?",
          hi: "दो गाँवों ने मेले में अनाज भेजा: रामपुर ने 375 किग्रा और सीतापुर ने 480 किग्रा। सीतापुर ने कितना अधिक भेजा?",
          mr: "दोन गावांनी जत्रेत धान्य पाठवले: रामपूरने 375 किलो आणि सीतापूरने 480 किलो. सीतापूरने किती जास्त पाठवले?",
        },
        answer: 105,
        wrong: [855, 115, 95],
        checkExpr: "480-375",
        solution: {
          en: "'How much more' is a difference: 480 − 375 = 105 kg. The total 855 answers a question nobody asked; 115 and 95 are the borrow going astray by ten.",
          hi: "'कितना अधिक' अंतर है: 480 − 375 = 105 किग्रा। 855 का योग बिन पूछा सवाल हल करता है; 115 और 95 में उधार दस से भटका।",
          mr: "'किती जास्त' म्हणजे वजाबाकी: 480 − 375 = 105 किलो. 855 ची बेरीज न विचारलेला प्रश्न सोडवते; 115 आणि 95 मध्ये उसनवारी दहाने भरकटली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Ticket money collected on Saturday was ₹640 and on Sunday ₹580. Out of the total, ₹350 was spent on prizes. How much money remained?",
          hi: "शनिवार को टिकटों से ₹640 और रविवार को ₹580 इकट्ठे हुए। कुल में से ₹350 इनामों पर ख़र्च हुए। कितने पैसे बचे?",
          mr: "शनिवारी तिकिटांतून ₹640 आणि रविवारी ₹580 जमले. एकूणातून ₹350 बक्षिसांवर खर्च झाले. किती पैसे उरले?",
        },
        answer: 870,
        wrong: [1220, 930, 770],
        checkExpr: "640+580-350",
        fmt: rupees,
        solution: {
          en: "Collect first: 640 + 580 = ₹1220. Spend next: 1220 − 350 = ₹870. Stopping at 1220 skips the prizes; 930 subtracts from Saturday alone and lets Sunday float free.",
          hi: "पहले जमा: 640 + 580 = ₹1220। फिर ख़र्च: 1220 − 350 = ₹870। 1220 पर रुकना इनाम भूलना है; 930 केवल शनिवार से घटाकर रविवार को छुट्टा छोड़ देता है।",
          mr: "आधी जमा: 640 + 580 = ₹1220. मग खर्च: 1220 − 350 = ₹870. 1220 वर थांबणे म्हणजे बक्षिसे विसरणे; 930 फक्त शनिवारमधून वजा करून रविवार मोकळा सोडते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A milkman had 900 litres. He delivered 356 litres in the morning and 278 in the evening. ESTIMATE first, then compute: how many litres were left?",
          hi: "दूधवाले के पास 900 लीटर था। उसने सुबह 356 और शाम को 278 लीटर बाँटा। पहले अंदाज़ा, फिर गणना: कितने लीटर बचे?",
          mr: "दूधवाल्याकडे 900 लिटर होते. त्याने सकाळी 356 आणि संध्याकाळी 278 लिटर घातले. आधी अंदाज, मग आकडेमोड: किती लिटर उरले?",
        },
        answer: 266,
        wrong: [366, 276, 634],
        checkExpr: "900-356-278",
        solution: {
          en: "Estimate: 900 − 360 − 280 ≈ 260, so expect something near it. Exactly: 356 + 278 = 634 delivered, and 900 − 634 = 266. The 634 option reports the delivered milk as if it stayed home.",
          hi: "अंदाज़ा: 900 − 360 − 280 ≈ 260, तो उत्तर उसी के पास होगा। ठीक-ठीक: 356 + 278 = 634 बँटा, और 900 − 634 = 266। 634 वाला विकल्प बँटे दूध को घर बैठा बताता है।",
          mr: "अंदाज: 900 − 360 − 280 ≈ 260, म्हणून उत्तर त्याच्या जवळ असणार. नेमके: 356 + 278 = 634 घातले, आणि 900 − 634 = 266. 634 हा पर्याय घातलेले दूध घरीच राहिले असे सांगतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Using the digits 5, 2 and 8 once each, make the largest and the smallest three-digit numbers — then subtract the smallest from the largest. What do you get?",
          hi: "अंक 5, 2 और 8 को एक-एक बार लेकर सबसे बड़ी और सबसे छोटी तीन-अंकीय संख्याएँ बनाइए — फिर बड़ी में से छोटी घटाइए। क्या मिलता है?",
          mr: "5, 2 आणि 8 हे अंक एकेकदा वापरून सर्वांत मोठी आणि सर्वांत लहान तीन-अंकी संख्या करा — मग मोठीतून लहान वजा करा. काय मिळते?",
        },
        answer: 594,
        wrong: [606, 594 + 100, 494],
        checkExpr: "852-258",
        solution: {
          en: "Largest 852, smallest 258, and 852 − 258 = 594. Both numbers use the same digits, so the difference comes only from where each digit stands — place value doing all the work again.",
          hi: "सबसे बड़ी 852, सबसे छोटी 258, और 852 − 258 = 594। दोनों में अंक वही हैं, अतः अंतर केवल उनके स्थान से आता है — सारा काम फिर स्थानीय मान का।",
          mr: "सर्वांत मोठी 852, सर्वांत लहान 258, आणि 852 − 258 = 594. दोन्हींत अंक तेच, म्हणून फरक फक्त त्यांच्या जागेतून येतो — सगळे काम पुन्हा स्थानिक किमतीचे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "In this sum each ★ hides the SAME digit: 6★ + ★3 = 96. Which digit is ★?",
          hi: "इस जोड़ में हर ★ एक ही अंक छिपाए है: 6★ + ★3 = 96। ★ कौन-सा अंक है?",
          mr: "या बेरजेत प्रत्येक ★ एकच अंक लपवतो: 6★ + ★3 = 96. ★ कोणता अंक?",
        },
        answer: 3,
        wrong: [6, 2, 4],
        checkExpr: "96-63-30",
        solution: {
          en: "The ones column says ★ + 3 ends in 6, so ★ = 3. Check the whole sum: 63 + 33 = 96 — it holds. Trying 6 gives 66 + 63 = 129, far past 96; the ones column alone rules out every option but 3.",
          hi: "इकाई का स्तंभ कहता है ★ + 3 का अंत 6 पर हो, तो ★ = 3। पूरा जोड़ जाँचें: 63 + 33 = 96 — सही बैठता है। 6 लेने पर 66 + 63 = 129, 96 से बहुत आगे; अकेला इकाई-स्तंभ 3 के सिवा हर विकल्प काट देता है।",
          mr: "एककाचा स्तंभ सांगतो ★ + 3 चा शेवट 6 वर हवा, म्हणून ★ = 3. पूर्ण बेरीज तपासा: 63 + 33 = 96 — जुळते. 6 घेतल्यास 66 + 63 = 129, 96 च्या फार पुढे; एकटा एकक-स्तंभ 3 खेरीज प्रत्येक पर्याय बाद करतो.",
        },
      },
      rand,
    ),

  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 6 — Fun with Give and Take",
      name: "Fun with Give and Take",
      slug: "maths-3-fun-with-give-and-take",
      summary:
        "Bigger additions and subtractions — estimating before computing, borrowing across zeros, and digit puzzles.",
      position: 6,
      translations: {
        hi: {
          name: "लेन-देन की मस्ती",
          summary: "बड़े जोड़-घटाव — गणना से पहले अंदाज़ा, शून्यों के पार उधार, और अंकों की पहेलियाँ।",
        },
        mr: {
          name: "देवाण-घेवाणीची गंमत",
          summary: "मोठ्या बेरजा-वजाबाक्या — आकडेमोडीआधी अंदाज, शून्यांपलीकडची उसनवारी, आणि अंकांची कोडी.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Jugs and Mugs (capacity: litres and millilitres)             */
/* ------------------------------------------------------------------------- */
function jugsAndMugs(): TopicFileOut {
  const rand = rng("maths-3-jugs-and-mugs");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many millilitres make one litre?",
          hi: "एक लीटर में कितने मिलीलीटर होते हैं?",
          mr: "एका लिटरमध्ये किती मिलिलिटर असतात?",
        },
        answer: 1000,
        wrong: [100, 500, 250],
        checkExpr: "4*250",
        solution: {
          en: "One litre is 1000 ml — 'milli' means a thousandth, so a thousand of them fill the whole. 500 and 250 are the familiar half and quarter bottles.",
          hi: "एक लीटर 1000 मिली का है — 'मिली' का अर्थ हज़ारवाँ, तो हज़ार से पूरा भरता है। 500 और 250 जानी-पहचानी आधी और चौथाई बोतलें हैं।",
          mr: "एक लिटर म्हणजे 1000 मिली — 'मिली' म्हणजे हजारावा, म्हणून हजाराने पूर्ण भरतो. 500 आणि 250 या ओळखीच्या अर्ध्या व पाव बाटल्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A medicine spoon holds 5 ml. How many spoonfuls empty a 30 ml bottle of tonic?",
          hi: "दवा का चम्मच 5 मिली का है। 30 मिली की शीशी कितने चम्मचों में ख़ाली होगी?",
          mr: "औषधाचा चमचा 5 मिलीचा आहे. 30 मिलीची बाटली किती चमच्यांत रिकामी होईल?",
        },
        answer: 6,
        wrong: [5, 25, 35],
        checkExpr: "30/5",
        solution: {
          en: "30 ÷ 5 = 6 spoonfuls. The wrong 25 and 35 add or subtract the spoon instead of counting how many times it fits.",
          hi: "30 ÷ 5 = 6 चम्मच। 25 और 35 चम्मच को जोड़ते-घटाते हैं, यह गिनने की जगह कि वह कितनी बार समाता है।",
          mr: "30 ÷ 5 = 6 चमचे. 25 आणि 35 चमचा मिळवतात-वजा करतात — तो किती वेळा मावतो हे मोजण्याऐवजी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Three 500 ml bottles of water are poured into a big jug. How many millilitres does the jug now hold?",
          hi: "500-500 मिली की तीन बोतलें बड़े जग में उड़ेली गईं। जग में अब कितने मिलीलीटर पानी है?",
          mr: "500-500 मिलीच्या तीन बाटल्या मोठ्या जगमध्ये ओतल्या. जगमध्ये आता किती मिलिलिटर पाणी आहे?",
        },
        answer: 1500,
        wrong: [503, 1000, 2000],
        checkExpr: "500*3",
        solution: {
          en: "3 × 500 = 1500 ml — one and a half litres. 1000 pours only two bottles; 503 adds the count to the size, mixing what the numbers mean.",
          hi: "3 × 500 = 1500 मिली — डेढ़ लीटर। 1000 में दो ही बोतलें उड़ेलीं; 503 गिनती को नाप में जोड़कर संख्याओं के अर्थ गड्डमड्ड करता है।",
          mr: "3 × 500 = 1500 मिली — दीड लिटर. 1000 मध्ये दोनच बाटल्या ओतल्या; 503 संख्या मापात मिळवून अर्थ मिसळते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A jug of 1 litre of lassi is poured out. After filling four glasses of 200 ml each, how many millilitres remain in the jug?",
          hi: "1 लीटर लस्सी का जग है। 200-200 मिली के चार गिलास भरने के बाद जग में कितने मिलीलीटर बचे?",
          mr: "1 लिटर लस्सीचा जग आहे. 200-200 मिलीचे चार ग्लास भरल्यावर जगमध्ये किती मिलिलिटर उरली?",
        },
        answer: 200,
        wrong: [800, 600, 0],
        checkExpr: "1000-200*4",
        solution: {
          en: "Poured out: 4 × 200 = 800 ml. Left: 1000 − 800 = 200 ml — exactly one more glass. The 800 option reports what left the jug, not what stayed.",
          hi: "उड़ेला: 4 × 200 = 800 मिली। बचा: 1000 − 800 = 200 मिली — ठीक एक और गिलास। 800 वाला विकल्प बताता है कि जग से क्या निकला, क्या बचा नहीं।",
          mr: "ओतले: 4 × 200 = 800 मिली. उरले: 1000 − 800 = 200 मिली — बरोबर आणखी एक ग्लास. 800 हा पर्याय जगमधून काय गेले ते सांगतो, काय राहिले ते नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A bucket holds 8 litres. A mug holds 500 ml. How many mugfuls fill the bucket?",
          hi: "बाल्टी 8 लीटर की है। मग 500 मिली का है। कितने मग बाल्टी भर देंगे?",
          mr: "बादली 8 लिटरची आहे. मग 500 मिलीचा आहे. किती मगांनी बादली भरेल?",
        },
        answer: 16,
        wrong: [8, 4, 20],
        checkExpr: "8000/500",
        solution: {
          en: "8 litres = 8000 ml, and 8000 ÷ 500 = 16 mugs — two mugs to every litre. Eight counts one mug per litre, halving the truth.",
          hi: "8 लीटर = 8000 मिली, और 8000 ÷ 500 = 16 मग — हर लीटर पर दो मग। आठ हर लीटर का एक ही मग गिनकर सच आधा कर देता है।",
          mr: "8 लिटर = 8000 मिली, आणि 8000 ÷ 500 = 16 मग — दर लिटरमागे दोन मग. आठ दर लिटराचा एकच मग मोजून सत्य निम्मे करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A pot of 2 litres of dal must be shared equally into 8 bowls. How many millilitres go into each bowl?",
          hi: "2 लीटर दाल 8 कटोरों में बराबर बाँटनी है। हर कटोरे में कितने मिलीलीटर जाएँगे?",
          mr: "2 लिटर डाळ 8 वाट्यांत समान वाटायची आहे. प्रत्येक वाटीत किती मिलिलिटर जाईल?",
        },
        answer: 250,
        wrong: [400, 200, 500],
        checkExpr: "2000/8",
        solution: {
          en: "2000 ml ÷ 8 = 250 ml a bowl — a quarter litre each. The 400 answer divides 2000 by 5; 500 shares among only four bowls.",
          hi: "2000 मिली ÷ 8 = 250 मिली प्रति कटोरा — चौथाई लीटर। 400 में 2000 को 5 से भागा गया; 500 केवल चार कटोरों में बाँटता है।",
          mr: "2000 मिली ÷ 8 = 250 मिली प्रत्येक वाटीत — पाव लिटर. 400 मध्ये 2000 ला 5 ने भागले; 500 फक्त चार वाट्यांत वाटते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Which holds more, and the answer is that amount in ml: a 1 litre bottle, or five 250 ml cups together?",
          hi: "किसमें अधिक समाता है — उत्तर वही मात्रा मिली में: 1 लीटर की बोतल, या 250-250 मिली के पाँच कप मिलाकर?",
          mr: "कशात जास्त मावते — उत्तर तीच मात्रा मिलीमध्ये: 1 लिटरची बाटली, की 250-250 मिलीचे पाच कप मिळून?",
        },
        answer: 1250,
        wrong: [1000, 250, 1500],
        checkExpr: "250*5",
        solution: {
          en: "Five cups: 5 × 250 = 1250 ml, beating the bottle's 1000. Four cups would tie the bottle exactly — the fifth one settles the contest.",
          hi: "पाँच कप: 5 × 250 = 1250 मिली, बोतल के 1000 से अधिक। चार कप बोतल की ठीक बराबरी करते — पाँचवाँ ही फ़ैसला करता है।",
          mr: "पाच कप: 5 × 250 = 1250 मिली, बाटलीच्या 1000 हून जास्त. चार कपांनी बाटलीशी नेमकी बरोबरी झाली असती — पाचवाच निकाल लावतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A water cooler of 15 litres serves glasses of 250 ml. After 40 glasses have been filled, how many millilitres are left in the cooler?",
          hi: "15 लीटर के वाटर-कूलर से 250-250 मिली के गिलास भरे जाते हैं। 40 गिलास भरने के बाद कूलर में कितने मिलीलीटर बचे?",
          mr: "15 लिटरच्या वॉटर-कूलरमधून 250-250 मिलीचे ग्लास भरले जातात. 40 ग्लास भरल्यावर कूलरमध्ये किती मिलिलिटर उरले?",
        },
        answer: 5000,
        wrong: [10000, 1000, 14750],
        checkExpr: "15000-250*40",
        solution: {
          en: "Served: 40 × 250 = 10000 ml. Left: 15000 − 10000 = 5000 ml — five litres. The 10000 option is the water that walked away in glasses.",
          hi: "परोसा: 40 × 250 = 10000 मिली। बचा: 15000 − 10000 = 5000 मिली — पाँच लीटर। 10000 वाला विकल्प वह पानी है जो गिलासों में चला गया।",
          mr: "दिले: 40 × 250 = 10000 मिली. उरले: 15000 − 10000 = 5000 मिली — पाच लिटर. 10000 हा पर्याय म्हणजे ग्लासांतून निघून गेलेले पाणी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "You have only a 5 litre jug and a 3 litre jug, both unmarked, and a tap. Fill the 5, pour into the 3 till it is full — how many litres are now IN the 5 litre jug?",
          hi: "आपके पास केवल 5 लीटर और 3 लीटर के दो बिना निशान वाले जग और एक नल है। 5 वाला भरें, फिर 3 वाले में तब तक उड़ेलें जब तक वह भर न जाए — अब 5 लीटर वाले जग में कितने लीटर हैं?",
          mr: "तुमच्याकडे फक्त 5 लिटर आणि 3 लिटरचे खुणा नसलेले दोन जग आणि एक नळ आहे. 5 वाला भरा, मग 3 वाल्यात तो भरेपर्यंत ओता — आता 5 लिटरच्या जगमध्ये किती लिटर आहे?",
        },
        answer: 2,
        wrong: [3, 5, 1],
        checkExpr: "5-3",
        solution: {
          en: "Pouring stops when the 3 litre jug is full, so exactly 3 litres left the big jug: 5 − 3 = 2 litres remain. This is the first move of every classic jug puzzle — measuring without markings by letting the jugs measure each other.",
          hi: "उड़ेलना तभी रुकता है जब 3 लीटर वाला भर जाए, यानी बड़े जग से ठीक 3 लीटर निकले: 5 − 3 = 2 लीटर बचे। हर मशहूर जग-पहेली की पहली चाल यही है — बिना निशान के नाप, जगों से एक-दूसरे को नपवाकर।",
          mr: "3 लिटरचा भरला की ओतणे थांबते, म्हणजे मोठ्या जगमधून नेमके 3 लिटर गेले: 5 − 3 = 2 लिटर उरले. प्रत्येक प्रसिद्ध जग-कोड्याची पहिली खेळी हीच — खुणांशिवाय माप, जगांकडूनच एकमेकांना मोजून घेऊन.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A 1 litre bottle of squash says: mix 1 part squash with 4 parts water. Making ONE glass of 200 ml of the drink needs how many ml of squash?",
          hi: "1 लीटर स्क्वैश की बोतल पर लिखा है: 1 भाग स्क्वैश में 4 भाग पानी मिलाएँ। 200 मिली का एक गिलास पेय बनाने में कितने मिली स्क्वैश लगेगा?",
          mr: "1 लिटर स्क्वॅशच्या बाटलीवर लिहिले आहे: 1 भाग स्क्वॅशमध्ये 4 भाग पाणी मिसळा. 200 मिलीचा एक ग्लास पेय करण्यासाठी किती मिली स्क्वॅश लागेल?",
        },
        answer: 40,
        wrong: [50, 200, 160],
        checkExpr: "200/5",
        solution: {
          en: "One part squash plus four parts water makes 5 parts in all, so each part of a 200 ml glass is 200 ÷ 5 = 40 ml — that is the squash; the other 160 ml is water. Choosing 50 divides by four, forgetting the squash is itself one of the parts.",
          hi: "1 भाग स्क्वैश और 4 भाग पानी मिलकर कुल 5 भाग हुए, तो 200 मिली गिलास का हर भाग 200 ÷ 5 = 40 मिली — यही स्क्वैश है; बाक़ी 160 मिली पानी। 50 चुनना चार से भाग देना है — यह भूलकर कि स्क्वैश ख़ुद भी एक भाग है।",
          mr: "1 भाग स्क्वॅश आणि 4 भाग पाणी मिळून एकूण 5 भाग, म्हणून 200 मिली ग्लासाचा प्रत्येक भाग 200 ÷ 5 = 40 मिली — तोच स्क्वॅश; उरलेले 160 मिली पाणी. 50 निवडणे म्हणजे चाराने भागणे — स्क्वॅश स्वतःही एक भाग आहे हे विसरून.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 11 — Jugs and Mugs",
      name: "Jugs and Mugs",
      slug: "maths-3-jugs-and-mugs",
      summary:
        "Litres and millilitres — filling, sharing and the unmarked jugs that measure each other.",
      position: 11,
      translations: {
        hi: {
          name: "जग और मग",
          summary: "लीटर और मिलीलीटर — भरना, बाँटना, और बिना निशान के जग जो एक-दूसरे को नापते हैं।",
        },
        mr: {
          name: "जग आणि मग",
          summary: "लिटर आणि मिलिलिटर — भरणे, वाटणे, आणि खुणा नसलेले जग जे एकमेकांना मोजतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Smart Charts (reading and using data)                        */
/* One survey carries the whole chapter, so every question reads the same    */
/* small table — the way the textbook's own chapter works.                   */
/* ------------------------------------------------------------------------- */
function smartCharts(): TopicFileOut {
  const rand = rng("maths-3-smart-charts");
  const T = {
    en: "Class 3 voted for their favourite fruit — mango 12, banana 8, guava 5, apple 10.",
    hi: "कक्षा 3 ने अपने प्रिय फल के लिए मत दिए — आम 12, केला 8, अमरूद 5, सेब 10।",
    mr: "इयत्ता 3 ने आवडत्या फळासाठी मते दिली — आंबा 12, केळे 8, पेरू 5, सफरचंद 10.",
  };
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: `${T.en} How many votes did the winning fruit get?`,
          hi: `${T.hi} जीतने वाले फल को कितने मत मिले?`,
          mr: `${T.mr} जिंकणाऱ्या फळाला किती मते मिळाली?`,
        },
        answer: 12,
        wrong: [10, 5, 8],
        checkExpr: "10+2",
        solution: {
          en: "Scan the counts: 12, 8, 5, 10 — the biggest is mango's 12. Reading a table starts with finding the largest and smallest at a glance.",
          hi: "गिनतियाँ देखें: 12, 8, 5, 10 — सबसे बड़ी आम की 12। तालिका पढ़ना एक नज़र में सबसे बड़ा-छोटा ढूँढ़ने से शुरू होता है।",
          mr: "संख्या पाहा: 12, 8, 5, 10 — सर्वांत मोठी आंब्याची 12. तक्ता वाचणे एका नजरेत मोठे-लहान शोधण्यापासून सुरू होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: `${T.en} How many MORE votes did mango get than guava?`,
          hi: `${T.hi} आम को अमरूद से कितने अधिक मत मिले?`,
          mr: `${T.mr} आंब्याला पेरूहून किती जास्त मते मिळाली?`,
        },
        answer: 7,
        wrong: [17, 5, 12],
        checkExpr: "12-5",
        solution: {
          en: "12 − 5 = 7 votes more. Adding them (17) measures the two groups together, not the gap between them.",
          hi: "12 − 5 = 7 मत अधिक। जोड़ने पर (17) दोनों समूह एक साथ नपते हैं, उनका अंतर नहीं।",
          mr: "12 − 5 = 7 मते जास्त. बेरीज (17) दोन्ही गट एकत्र मोजते, त्यांतले अंतर नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: `${T.en} In a picture-graph where one ● stands for 2 votes, how many ● does banana get?`,
          hi: `${T.hi} चित्र-आलेख में एक ● = 2 मत हो, तो केले को कितने ● मिलेंगे?`,
          mr: `${T.mr} चित्र-आलेखात एक ● = 2 मते असल्यास केळ्याला किती ● मिळतील?`,
        },
        answer: 4,
        wrong: [8, 2, 16],
        checkExpr: "8/2",
        solution: {
          en: "Banana's 8 votes at 2 votes a symbol need 8 ÷ 2 = 4 circles. Drawing 8 forgets the key; 16 doubles instead of halving.",
          hi: "केले के 8 मत, 2 मत प्रति चिह्न — यानी 8 ÷ 2 = 4 गोले। 8 बनाना कुंजी भूलना है; 16 आधा करने की जगह दुगना करता है।",
          mr: "केळ्याची 8 मते, 2 मते प्रति चिन्ह — म्हणजे 8 ÷ 2 = 4 वर्तुळे. 8 काढणे म्हणजे कळ विसरणे; 16 निम्म्याऐवजी दुप्पट करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: `${T.en} How many children voted in all?`,
          hi: `${T.hi} कुल कितने बच्चों ने मत दिए?`,
          mr: `${T.mr} एकूण किती मुलांनी मते दिली?`,
        },
        answer: 35,
        wrong: [30, 25, 40],
        checkExpr: "12+8+5+10",
        solution: {
          en: "Add every row: 12 + 8 + 5 + 10 = 35 children. Pairing helps: 12 + 8 = 20 and 5 + 10 = 15, then 20 + 15. Thirty drops the guava row.",
          hi: "हर पंक्ति जोड़ें: 12 + 8 + 5 + 10 = 35 बच्चे। जोड़ियाँ आसान करती हैं: 12 + 8 = 20 और 5 + 10 = 15, फिर 20 + 15। तीस में अमरूद की पंक्ति छूटी।",
          mr: "प्रत्येक ओळ मिळवा: 12 + 8 + 5 + 10 = 35 मुले. जोड्या सोप्या करतात: 12 + 8 = 20 आणि 5 + 10 = 15, मग 20 + 15. तीसमध्ये पेरूची ओळ गळाली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: `${T.en} The two CITRUS-free favourites, banana and apple, together got how many votes?`,
          hi: `${T.hi} केले और सेब को मिलाकर कितने मत मिले?`,
          mr: `${T.mr} केळे आणि सफरचंद मिळून किती मते?`,
        },
        answer: 18,
        wrong: [22, 17, 20],
        checkExpr: "8+10",
        solution: {
          en: "Pick just the rows asked for: banana 8 + apple 10 = 18. The 22 answer grabs mango and apple — reading the right rows is half of chart work.",
          hi: "पूछी गई पंक्तियाँ ही लें: केला 8 + सेब 10 = 18। 22 में आम और सेब उठ गए — सही पंक्तियाँ पढ़ना ही तालिका-काम का आधा है।",
          mr: "विचारलेल्या ओळीच घ्या: केळे 8 + सफरचंद 10 = 18. 22 मध्ये आंबा आणि सफरचंद उचलले — योग्य ओळी वाचणे हेच तक्ता-कामाचे अर्धे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: `${T.en} If every child who voted guava changes to mango, mango then leads banana by how many votes?`,
          hi: `${T.hi} यदि अमरूद वाले सभी बच्चे आम में चले जाएँ, तो आम केले से कितने मतों से आगे होगा?`,
          mr: `${T.mr} पेरूवाली सर्व मुले आंब्याकडे गेली, तर आंबा केळ्याहून किती मतांनी पुढे असेल?`,
        },
        answer: 9,
        wrong: [4, 17, 12],
        checkExpr: "12+5-8",
        solution: {
          en: "Mango grows to 12 + 5 = 17, banana stays 8, and the lead is 17 − 8 = 9. The 4 answer compares the OLD mango with banana, before anyone moved.",
          hi: "आम बढ़कर 12 + 5 = 17, केला 8 पर, बढ़त 17 − 8 = 9। 4 वाला उत्तर पुराने आम की तुलना करता है — किसी के हिलने से पहले की।",
          mr: "आंबा वाढून 12 + 5 = 17, केळे 8 वर, आघाडी 17 − 8 = 9. 4 हे उत्तर जुन्या आंब्याशी तुलना करते — कोणी हलण्याआधीची.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: `${T.en} In a bar chart of these votes where each square of the grid is 2 votes tall, how many squares high is the apple bar?`,
          hi: `${T.hi} इन मतों के दंड-आलेख में ग्रिड का हर ख़ाना 2 मत ऊँचा है। सेब का दंड कितने ख़ानों ऊँचा होगा?`,
          mr: `${T.mr} या मतांच्या स्तंभालेखात जाळीचा प्रत्येक चौकोन 2 मते उंच आहे. सफरचंदाचा स्तंभ किती चौकोन उंच असेल?`,
        },
        answer: 5,
        wrong: [10, 2, 6],
        checkExpr: "10/2",
        solution: {
          en: "Apple's 10 votes at 2 per square rise 10 ÷ 2 = 5 squares. Ten squares would double-count — the scale is the first thing to read on any chart.",
          hi: "सेब के 10 मत, 2 प्रति ख़ाना — 10 ÷ 2 = 5 ख़ाने। दस ख़ाने दोहरी गिनती होती — किसी भी आलेख पर पैमाना सबसे पहले पढ़ा जाता है।",
          mr: "सफरचंदाची 10 मते, 2 प्रति चौकोन — 10 ÷ 2 = 5 चौकोन. दहा चौकोन म्हणजे दुहेरी मोजणी — कोणत्याही आलेखावर प्रमाण आधी वाचायचे असते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: `${T.en} Next week 5 new children join and ALL vote for the same fruit, making it the new winner. Which count below is the smallest the new winner could have?`,
          hi: `${T.hi} अगले सप्ताह 5 नए बच्चे आए और सबने एक ही फल को मत दिया, जिससे वह नया विजेता बन गया। नए विजेता की सबसे छोटी संभव गिनती कौन-सी है?`,
          mr: `${T.mr} पुढच्या आठवड्यात 5 नवी मुले आली आणि सर्वांनी एकाच फळाला मते दिली, त्याने ते नवे विजेते झाले. नव्या विजेत्याची सर्वांत लहान शक्य संख्या कोणती?`,
        },
        answer: 13,
        wrong: [15, 17, 10],
        checkExpr: "8+5",
        solution: {
          en: "To beat mango's 12 with the smallest total, give the 5 votes to banana: 8 + 5 = 13, just past 12. Giving them to apple makes 15 — also a winner, but not the smallest one. Guava's 5 + 5 = 10 falls short.",
          hi: "आम के 12 को सबसे छोटी गिनती से हराने के लिए 5 मत केले को दें: 8 + 5 = 13, 12 से ठीक आगे। सेब को देने पर 15 — विजेता तो है, पर सबसे छोटा नहीं। अमरूद के 5 + 5 = 10 कम पड़ते हैं।",
          mr: "आंब्याच्या 12 ला सर्वांत लहान संख्येने हरवायला 5 मते केळ्याला द्या: 8 + 5 = 13, 12 च्या नेमके पुढे. सफरचंदाला दिली तर 15 — विजेते खरे, पण सर्वांत लहान नव्हे. पेरूचे 5 + 5 = 10 अपुरे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A different class's fruit table got smudged: mango 14, banana ▢, guava 6 — but the sheet still says 32 children voted in all. How many votes did banana get?",
          hi: "दूसरी कक्षा की फल-तालिका धुँधली हो गई: आम 14, केला ▢, अमरूद 6 — पर पन्ने पर लिखा है कि कुल 32 बच्चों ने मत दिए। केले को कितने मत मिले?",
          mr: "दुसऱ्या वर्गाचा फळ-तक्ता पुसट झाला: आंबा 14, केळे ▢, पेरू 6 — पण पानावर एकूण 32 मुलांनी मते दिल्याचे लिहिले आहे. केळ्याला किती मते मिळाली?",
        },
        answer: 12,
        wrong: [20, 10, 18],
        checkExpr: "32-14-6",
        solution: {
          en: "The total remembers what the smudge forgot: 32 − 14 − 6 = 12 votes for banana. Check by rebuilding: 14 + 12 + 6 = 32. A total row is the chart's own spare copy of every entry.",
          hi: "योग वह याद रखता है जो धब्बा भुला गया: 32 − 14 − 6 = 12 मत केले के। फिर से जोड़कर जाँचें: 14 + 12 + 6 = 32। योग-पंक्ति तालिका की हर प्रविष्टि की अपनी अतिरिक्त प्रति है।",
          mr: "बेरीज ते लक्षात ठेवते जे डागाने पुसले: 32 − 14 − 6 = 12 मते केळ्याला. पुन्हा जुळवून तपासा: 14 + 12 + 6 = 32. बेरीज-ओळ म्हणजे तक्त्याची प्रत्येक नोंदीची स्वतःची जादा प्रत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: `${T.en} The class wants to redraw the picture-graph so that GUAVA's row shows a whole number of symbols with none cut in half. Which of these vote-per-symbol keys works?`,
          hi: `${T.hi} कक्षा चित्र-आलेख ऐसे बनाना चाहती है कि अमरूद की पंक्ति में पूरे चिह्न आएँ, कोई आधा न कटे। इनमें से कौन-सी 'मत प्रति चिह्न' कुंजी चलेगी?`,
          mr: `${T.mr} वर्गाला चित्र-आलेख असा काढायचा आहे की पेरूच्या ओळीत पूर्ण चिन्हे येतील, अर्धे कापले जाणार नाही. यांपैकी कोणती 'मते प्रति चिन्ह' कळ चालेल?`,
        },
        answer: 5,
        wrong: [2, 4, 10],
        checkExpr: "5/1",
        solution: {
          en: "Guava has 5 votes, so the key must divide 5 exactly: only 5 works among the options, giving one whole symbol (1 works too, but it is not offered). A key of 2 leaves 5 ÷ 2 = two and a half symbols — the very half the class wants to avoid.",
          hi: "अमरूद के 5 मत हैं, तो कुंजी को 5 को पूरा-पूरा बाँटना होगा: विकल्पों में केवल 5 चलती है — एक पूरा चिह्न। 2 की कुंजी से 5 ÷ 2 = ढाई चिह्न बनते हैं — वही आधा जो कक्षा नहीं चाहती।",
          mr: "पेरूची 5 मते आहेत, म्हणून कळीने 5 ला पूर्ण भागले पाहिजे: पर्यायांत फक्त 5 चालते — एक पूर्ण चिन्ह. 2 च्या कळीने 5 ÷ 2 = अडीच चिन्हे होतात — नेमके तेच अर्धे जे वर्गाला नको आहे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 13 — Smart Charts",
      name: "Smart Charts",
      slug: "maths-3-smart-charts",
      summary:
        "One fruit-vote survey read every way — biggest and smallest, gaps and totals, keys and scales, and the smudge the total can repair.",
      position: 13,
      translations: {
        hi: {
          name: "स्मार्ट चार्ट",
          summary: "फलों के मतों की एक तालिका, हर तरह से पढ़ी हुई — बड़ा-छोटा, अंतर-योग, कुंजी-पैमाना, और वह धब्बा जिसे योग सुधार देता है।",
        },
        mr: {
          name: "हुशार तक्ते",
          summary: "फळ-मतांचा एक तक्ता, प्रत्येक रीतीने वाचलेला — मोठे-लहान, अंतर-बेरीज, कळ-प्रमाण, आणि बेरजेने दुरुस्त होणारा डाग.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Play with Patterns                                            */
/* ------------------------------------------------------------------------- */
function playWithPatterns(): TopicFileOut {
  const rand = rng("maths-3-play-with-patterns");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What comes next: 5, 10, 15, 20, …?",
          hi: "आगे क्या आएगा: 5, 10, 15, 20, …?",
          mr: "पुढे काय येईल: 5, 10, 15, 20, …?",
        },
        answer: 25,
        wrong: [30, 21, 24],
        checkExpr: "20+5",
        solution: {
          en: "Each step climbs by 5 — the fives table walking: after 20 comes 25. Thirty skips a step; 21 climbs by one.",
          hi: "हर क़दम 5 चढ़ता है — पाँच का पहाड़ा चलते हुए: 20 के बाद 25। तीस एक क़दम लाँघता है; 21 एक-एक चढ़ता है।",
          mr: "प्रत्येक पाऊल 5 ने चढते — पाचचा पाढा चालत: 20 नंतर 25. तीस एक पाऊल ओलांडते; 21 एकेकाने चढते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What comes next: 90, 80, 70, 60, …?",
          hi: "आगे क्या आएगा: 90, 80, 70, 60, …?",
          mr: "पुढे काय येईल: 90, 80, 70, 60, …?",
        },
        answer: 50,
        wrong: [55, 40, 65],
        checkExpr: "60-10",
        solution: {
          en: "This pattern walks DOWN by tens: 60 − 10 = 50. Forty jumps two steps at once; 55 halves the step size midway.",
          hi: "यह पैटर्न दहाई-दहाई उतरता है: 60 − 10 = 50। चालीस एक साथ दो सीढ़ियाँ कूदता है; 55 बीच में क़दम आधा कर देता है।",
          mr: "हा नमुना दहा-दहाने उतरतो: 60 − 10 = 50. चाळीस एकदम दोन पायऱ्या उडी मारते; 55 मध्येच पाऊल निम्मे करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Fill the gap: 7, 14, ▢, 28, 35.",
          hi: "रिक्त भरें: 7, 14, ▢, 28, 35।",
          mr: "रिकामी जागा भरा: 7, 14, ▢, 28, 35.",
        },
        answer: 21,
        wrong: [20, 24, 18],
        checkExpr: "14+7",
        solution: {
          en: "The sevens table: 7, 14, 21, 28, 35. The gap sits between 14 and 28, and only 21 is 7 away from both.",
          hi: "सात का पहाड़ा: 7, 14, 21, 28, 35। रिक्त स्थान 14 और 28 के बीच है, और केवल 21 ही दोनों से 7 की दूरी पर है।",
          mr: "साताचा पाढा: 7, 14, 21, 28, 35. रिकामी जागा 14 आणि 28 च्या मध्ये, आणि फक्त 21 च दोन्हींपासून 7 वर आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the pattern A B B A B B A B B…, the letters repeat in a block. How many letters long is the repeating block?",
          hi: "पैटर्न A B B A B B A B B… में अक्षर एक खंड में दोहराते हैं। दोहराने वाला खंड कितने अक्षरों का है?",
          mr: "A B B A B B A B B… या नमुन्यात अक्षरे एका गटात पुनरावृत्त होतात. पुनरावृत्त गट किती अक्षरांचा आहे?",
        },
        answer: 3,
        wrong: [2, 4, 6],
        checkExpr: "9/3",
        solution: {
          en: "The chant is 'A B B' again and again — a block of 3. Hearing 'A B' as the block ignores the second B that always follows.",
          hi: "रट है 'A B B' बार-बार — 3 का खंड। 'A B' को खंड सुनना उस दूसरे B को अनसुना करना है जो हर बार पीछे आता है।",
          mr: "पालुपद आहे 'A B B' पुन्हा-पुन्हा — 3 चा गट. 'A B' ला गट मानणे म्हणजे दर वेळी मागून येणारा दुसरा B न ऐकणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What comes next: 2, 4, 8, 16, …?",
          hi: "आगे क्या आएगा: 2, 4, 8, 16, …?",
          mr: "पुढे काय येईल: 2, 4, 8, 16, …?",
        },
        answer: 32,
        wrong: [20, 24, 18],
        checkExpr: "16*2",
        solution: {
          en: "Each number DOUBLES: 16 × 2 = 32. Adding 4 each time fits the first step but breaks at 8 — always test a rule on every step given.",
          hi: "हर संख्या दुगनी होती है: 16 × 2 = 32। हर बार 4 जोड़ना पहले क़दम पर सही बैठता है पर 8 पर टूट जाता है — नियम को दिए गए हर क़दम पर परखिए।",
          mr: "प्रत्येक संख्या दुप्पट होते: 16 × 2 = 32. दर वेळी 4 मिळवणे पहिल्या पावलावर जुळते पण 8 वर मोडते — नियम दिलेल्या प्रत्येक पावलावर तपासा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Rangoli dots are laid in rows: 1 dot, then 3, then 5, then 7. How many dots will the next row have?",
          hi: "रंगोली के बिंदु क़तारों में हैं: 1, फिर 3, फिर 5, फिर 7। अगली क़तार में कितने बिंदु होंगे?",
          mr: "रांगोळीचे ठिपके रांगांत आहेत: 1, मग 3, मग 5, मग 7. पुढच्या रांगेत किती ठिपके असतील?",
        },
        answer: 9,
        wrong: [8, 11, 10],
        checkExpr: "7+2",
        solution: {
          en: "The odd numbers march by twos: 1, 3, 5, 7, 9. Eight would break the pattern's promise that every row is odd.",
          hi: "विषम संख्याएँ दो-दो से बढ़ती हैं: 1, 3, 5, 7, 9। आठ उस वादे को तोड़ता जो हर क़तार को विषम रखता है।",
          mr: "विषम संख्या दोन-दोनने पुढे जातात: 1, 3, 5, 7, 9. आठने प्रत्येक रांग विषम ठेवण्याचे वचन मोडले असते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A number machine turns 3 into 8, turns 5 into 12, and turns 10 into 22. What will it turn 7 into?",
          hi: "एक संख्या-मशीन 3 को 8, 5 को 12, और 10 को 22 बनाती है। वह 7 को क्या बनाएगी?",
          mr: "एक संख्या-यंत्र 3 चे 8, 5 चे 12, आणि 10 चे 22 करते. ते 7 चे काय करेल?",
        },
        answer: 16,
        wrong: [14, 12, 17],
        checkExpr: "7*2+2",
        solution: {
          en: "Test the pairs: 3 → 8 and 5 → 12 both fit 'double, then add 2' — and 10 → 22 confirms it. So 7 → 7 × 2 + 2 = 16. 'Add 5' fits the first pair alone and dies on the second.",
          hi: "जोड़ियाँ परखें: 3 → 8 और 5 → 12 दोनों पर 'दुगना करके 2 जोड़ो' सही बैठता है — और 10 → 22 पुष्टि करता है। तो 7 → 7 × 2 + 2 = 16। 'पाँच जोड़ो' पहली जोड़ी पर ही चलता है, दूसरी पर दम तोड़ देता है।",
          mr: "जोड्या तपासा: 3 → 8 आणि 5 → 12 दोन्हींवर 'दुप्पट करून 2 मिळवा' जुळते — आणि 10 → 22 खात्री देते. म्हणून 7 → 7 × 2 + 2 = 16. 'पाच मिळवा' फक्त पहिल्या जोडीवर चालते, दुसऱ्यावर संपते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Beads are strung in repeats of: 2 red, 1 blue, 2 red, 1 blue… In a string of 24 beads, how many are blue?",
          hi: "मोती इस दोहराव में पिरोए हैं: 2 लाल, 1 नीला, 2 लाल, 1 नीला… 24 मोतियों की माला में कितने नीले हैं?",
          mr: "मणी या पुनरावृत्तीत ओवले आहेत: 2 लाल, 1 निळा, 2 लाल, 1 निळा… 24 मण्यांच्या माळेत किती निळे?",
        },
        answer: 8,
        wrong: [12, 6, 3],
        checkExpr: "24/3",
        solution: {
          en: "One block is 3 beads (red, red, blue), and 24 ÷ 3 = 8 blocks — one blue in each, so 8 blues. Twelve halves the string as if colours alternated one-for-one.",
          hi: "एक खंड 3 मोतियों का है (लाल, लाल, नीला), और 24 ÷ 3 = 8 खंड — हर एक में एक नीला, यानी 8 नीले। बारह माला को ऐसे आधा करता है मानो रंग एक-एक कर बदलते हों।",
          mr: "एक गट 3 मण्यांचा (लाल, लाल, निळा), आणि 24 ÷ 3 = 8 गट — प्रत्येकात एक निळा, म्हणजे 8 निळे. बारा माळ अशी निम्मी करते जणू रंग एक-एकाने बदलतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What comes next: 1, 2, 4, 7, 11, …?",
          hi: "आगे क्या आएगा: 1, 2, 4, 7, 11, …?",
          mr: "पुढे काय येईल: 1, 2, 4, 7, 11, …?",
        },
        answer: 16,
        wrong: [15, 22, 13],
        checkExpr: "11+5",
        solution: {
          en: "The jumps themselves grow: +1, +2, +3, +4 — so the next jump is +5, landing on 16. A pattern can hide in the gaps rather than the numbers.",
          hi: "छलाँगें ख़ुद बढ़ती हैं: +1, +2, +3, +4 — अगली छलाँग +5, यानी 16 पर। पैटर्न संख्याओं के बजाय अंतरालों में छिप सकता है।",
          mr: "उड्याच वाढतात: +1, +2, +3, +4 — पुढची उडी +5, म्हणजे 16 वर. नमुना संख्यांऐवजी अंतरांत लपलेला असू शकतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A staircase design uses 1 block for the first step, 2 for the second, 3 for the third, and so on. How many blocks build a staircase of 5 steps?",
          hi: "सीढ़ी की डिज़ाइन में पहली सीढ़ी में 1 ब्लॉक, दूसरी में 2, तीसरी में 3, इसी तरह लगते हैं। 5 सीढ़ियों की सीढ़ी में कुल कितने ब्लॉक लगेंगे?",
          mr: "जिन्याच्या नक्षीत पहिल्या पायरीला 1 ठोकळा, दुसरीला 2, तिसरीला 3, असे लागतात. 5 पायऱ्यांच्या जिन्याला एकूण किती ठोकळे?",
        },
        answer: 15,
        wrong: [5, 25, 10],
        checkExpr: "1+2+3+4+5",
        solution: {
          en: "Add the steps: 1 + 2 + 3 + 4 + 5 = 15 blocks. Pair the ends to see it fast: 1+5 and 2+4 make sixes, plus the 3. Twenty-five squares the steps instead of stacking them.",
          hi: "सीढ़ियाँ जोड़ें: 1 + 2 + 3 + 4 + 5 = 15 ब्लॉक। सिरे मिलाकर जल्दी दिखता है: 1+5 और 2+4 के छक्के, और बीच का 3। पच्चीस सीढ़ियों का वर्ग बनाता है, चिनाई नहीं।",
          mr: "पायऱ्या मिळवा: 1 + 2 + 3 + 4 + 5 = 15 ठोकळे. टोके जोडून पटकन दिसते: 1+5 आणि 2+4 चे सहा, आणि मधला 3. पंचवीस पायऱ्यांचा वर्ग करते, रचणी नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Look at this pattern of sums: 1 + 3 = 4, 1 + 3 + 5 = 9, 1 + 3 + 5 + 7 = 16. Following it, what is 1 + 3 + 5 + 7 + 9 + 11?",
          hi: "योगों का यह पैटर्न देखें: 1 + 3 = 4, 1 + 3 + 5 = 9, 1 + 3 + 5 + 7 = 16। इसी क्रम में 1 + 3 + 5 + 7 + 9 + 11 कितना होगा?",
          mr: "बेरजांचा हा नमुना पाहा: 1 + 3 = 4, 1 + 3 + 5 = 9, 1 + 3 + 5 + 7 = 16. याच क्रमाने 1 + 3 + 5 + 7 + 9 + 11 किती?",
        },
        answer: 36,
        wrong: [25, 30, 42],
        checkExpr: "6*6",
        solution: {
          en: "The sums are 2×2, 3×3, 4×4 — adding the first so-many odd numbers builds a square. Six odd numbers give 6 × 6 = 36. Plain adding confirms it: 4+5=9… all the way to 36.",
          hi: "योग हैं 2×2, 3×3, 4×4 — पहले इतने विषम जोड़ने से वर्ग बनता है। छह विषम संख्याएँ 6 × 6 = 36 देती हैं। सीधी जोड़ भी यहीं पहुँचती है — 36 पर।",
          mr: "बेरजा आहेत 2×2, 3×3, 4×4 — पहिल्या इतक्या विषम संख्या मिळवल्या की वर्ग होतो. सहा विषम संख्या 6 × 6 = 36 देतात. सरळ बेरीजही तिथेच — 36 वर — पोहोचते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The secret code shifts every letter one step forward (A→B, B→C … Z→A). A word was sent as 'DBU'. Counting A as 1, B as 2 and so on, what is the FIRST letter of the real word worth?",
          hi: "गुप्त कोड हर अक्षर को एक क़दम आगे खिसकाता है (A→B, B→C … Z→A)। एक शब्द 'DBU' भेजा गया। A को 1, B को 2 गिनें तो असली शब्द का पहला अक्षर कितने का है?",
          mr: "गुप्त सांकेतिक भाषा प्रत्येक अक्षर एक पाऊल पुढे सरकवते (A→B, B→C … Z→A). एक शब्द 'DBU' असा पाठवला. A ला 1, B ला 2 मोजल्यास खऱ्या शब्दाचे पहिले अक्षर कितीचे आहे?",
        },
        answer: 3,
        wrong: [4, 2, 21],
        checkExpr: "4-1",
        solution: {
          en: "To read the code, step each letter BACK: D→C, B→A, U→T — the word is CAT. C is the third letter, worth 3. Choosing 4 reads D itself, forgetting the code moved everything forward before sending.",
          hi: "कोड पढ़ने के लिए हर अक्षर पीछे लौटाएँ: D→C, B→A, U→T — शब्द है CAT। C तीसरा अक्षर है, मान 3। 4 चुनना D को ही पढ़ना है — यह भूलकर कि भेजने से पहले कोड ने सब आगे खिसकाया था।",
          mr: "सांकेतिक शब्द वाचायला प्रत्येक अक्षर मागे आणा: D→C, B→A, U→T — शब्द आहे CAT. C तिसरे अक्षर, किंमत 3. 4 निवडणे म्हणजे D च वाचणे — पाठवण्याआधी सर्व पुढे सरकवले होते हे विसरून.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 3,
      chapter: "Chapter 10 — Play with Patterns",
      name: "Play with Patterns",
      slug: "maths-3-play-with-patterns",
      summary:
        "Patterns in numbers, beads and letters — finding the rule, testing it on every step, and the odd numbers that build squares.",
      position: 10,
      translations: {
        hi: {
          name: "पैटर्न से खेल",
          summary: "संख्याओं, मोतियों और अक्षरों के पैटर्न — नियम ढूँढ़ना, हर क़दम पर परखना, और वर्ग बनाती विषम संख्याएँ।",
        },
        mr: {
          name: "नमुन्यांचा खेळ",
          summary: "संख्या, मणी आणि अक्षरांतले नमुने — नियम शोधणे, प्रत्येक पावलावर तपासणे, आणि वर्ग रचणाऱ्या विषम संख्या.",
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
  longAndShort(),
  timeGoesOn(),
  canWeShare(),
  whoIsHeavier(),
  shapesAndDesigns(),
  funWithGiveAndTake(),
  jugsAndMugs(),
  smartCharts(),
  playWithPatterns(),
];

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Where to Look From: views, not sums, so it runs through the   */
/* conceptual engine rather than the numeric one.                            */
/* ------------------------------------------------------------------------- */
export const G3_MATHS_CONCEPT: Chapter[] = [
  {
    slug: "maths-3-where-to-look-from",
    subject: "MATHS",
    classLevel: 3,
    chapter: {
      en: "Chapter 1 — Where to Look From",
      hi: "अध्याय 1 — कहाँ से देखें",
      mr: "प्रकरण 1 — कुठून पाहावे",
    },
    name: {
      en: "Where to Look From",
      hi: "कहाँ से देखें",
      mr: "कुठून पाहावे",
    },
    summary: {
      en: "The same thing looks different from the top, the side, up close and far away — and a map is a view from straight above.",
      hi: "एक ही चीज़ ऊपर से, बग़ल से, पास से और दूर से अलग दिखती है — और नक़्शा ठीक ऊपर से लिया दृश्य है।",
      mr: "एकच वस्तू वरून, बाजूने, जवळून आणि दुरून वेगळी दिसते — आणि नकाशा म्हणजे थेट वरून घेतलेले दृश्य.",
    },
    position: 1,
    source: "EduLink original, written against NCERT Math Magic (Class 3)",
    licence: "CC-BY-SA-4.0",
    facts: [
      {
        id: "top",
        name: { en: "From the top", hi: "ऊपर से", mr: "वरून" },
        kind: "view",
        prompt: {
          en: "Seen from WHERE does a round glass of milk look like just a circle?",
          hi: "कहाँ से देखने पर दूध का गोल गिलास केवल एक वृत्त-सा दिखता है?",
          mr: "कुठून पाहिल्यावर दुधाचा गोल ग्लास फक्त एक वर्तुळासारखा दिसतो?",
        },
        statement: {
          en: "From the top, a round glass shows only its rim — a circle — and a table shows its top and hides its legs.",
          hi: "ऊपर से गोल गिलास केवल अपना किनारा दिखाता है — एक वृत्त — और मेज़ अपनी सतह दिखाकर टाँगें छिपा लेती है।",
          mr: "वरून गोल ग्लास फक्त आपली कड दाखवतो — एक वर्तुळ — आणि टेबल आपला पृष्ठभाग दाखवून पाय लपवते.",
        },
        detail: {
          en: "Looking straight down at a lunch plate, the round rotis on it become flat circles inside a bigger circle.",
          hi: "थाली को सीधा ऊपर से देखने पर उस पर रखी गोल रोटियाँ बड़े वृत्त के भीतर छोटे चपटे वृत्त बन जाती हैं।",
          mr: "ताटाकडे थेट वरून पाहिल्यावर त्यावरच्या गोल पोळ्या मोठ्या वर्तुळातील छोटी सपाट वर्तुळे होतात.",
        },
        pair: {
          left: { en: "From the top", hi: "ऊपर से", mr: "वरून" },
          right: { en: "only the rim shows", hi: "केवल किनारा दिखता है", mr: "फक्त कड दिसते" },
        },
      },
      {
        id: "side",
        name: { en: "From the side", hi: "बग़ल से", mr: "बाजूने" },
        kind: "view",
        prompt: {
          en: "Seen from where does a glass show how TALL it is?",
          hi: "कहाँ से देखने पर गिलास की ऊँचाई दिखती है?",
          mr: "कुठून पाहिल्यावर ग्लासाची उंची दिसते?",
        },
        statement: {
          en: "From the side, things show their height — the glass looks tall, and the table shows its legs.",
          hi: "बग़ल से चीज़ें अपनी ऊँचाई दिखाती हैं — गिलास लंबा दिखता है, और मेज़ की टाँगें दिखती हैं।",
          mr: "बाजूने वस्तू आपली उंची दाखवतात — ग्लास उंच दिसतो, आणि टेबलाचे पाय दिसतात.",
        },
        pair: {
          left: { en: "From the side", hi: "बग़ल से", mr: "बाजूने" },
          right: { en: "height shows", hi: "ऊँचाई दिखती है", mr: "उंची दिसते" },
        },
      },
      {
        id: "aeroplane",
        name: { en: "From an aeroplane", hi: "हवाई जहाज़ से", mr: "विमानातून" },
        kind: "view",
        prompt: {
          en: "Seen from where do roads look like thin lines and houses like little boxes?",
          hi: "कहाँ से देखने पर सड़कें पतली लकीरों-सी और घर छोटे डिब्बों-से दिखते हैं?",
          mr: "कुठून पाहिल्यावर रस्ते बारीक रेषांसारखे आणि घरे छोट्या खोक्यांसारखी दिसतात?",
        },
        statement: {
          en: "From an aeroplane, roads become thin lines, houses little boxes, and rivers silver ribbons.",
          hi: "हवाई जहाज़ से सड़कें पतली लकीरें, घर छोटे डिब्बे, और नदियाँ चाँदी के फ़ीते बन जाती हैं।",
          mr: "विमानातून रस्ते बारीक रेषा, घरे छोटी खोकी, आणि नद्या चांदीच्या फिती होतात.",
        },
        detail: {
          en: "The higher you go, the more of the town fits in your eye at once — and the smaller each piece of it looks.",
          hi: "जितना ऊँचा जाएँ, उतना ज़्यादा शहर एक साथ आँख में समाता है — और उसका हर टुकड़ा उतना ही छोटा दिखता है।",
          mr: "जितके उंच जाल, तितके जास्त गाव एकदम नजरेत मावते — आणि त्याचा प्रत्येक तुकडा तितकाच लहान दिसतो.",
        },
        extra: {
          en: "Even a big playground shrinks to the size of a postage stamp from that window seat.",
          hi: "उस खिड़की वाली सीट से बड़ा-सा मैदान भी डाक-टिकट जितना सिकुड़ जाता है।",
          mr: "त्या खिडकीच्या जागेवरून मोठे मैदानही पोस्टाच्या तिकिटाएवढे आकसते.",
        },
        pair: {
          left: { en: "From an aeroplane", hi: "हवाई जहाज़ से", mr: "विमानातून" },
          right: { en: "roads like thin lines", hi: "सड़कें पतली लकीरों-सी", mr: "रस्ते बारीक रेषांसारखे" },
        },
      },
      {
        id: "close",
        name: { en: "From very close", hi: "बहुत पास से", mr: "अगदी जवळून" },
        kind: "view",
        prompt: {
          en: "Seen from where might you see only the eye of an elephant and not the elephant?",
          hi: "कहाँ से देखने पर हाथी की केवल आँख दिखे, पूरा हाथी नहीं?",
          mr: "कुठून पाहिल्यावर हत्तीचा फक्त डोळा दिसेल, पूर्ण हत्ती नाही?",
        },
        statement: {
          en: "From very close, one part fills your whole view — an eye, a wheel, a single letter on a poster.",
          hi: "बहुत पास से एक हिस्सा ही पूरी नज़र भर देता है — एक आँख, एक पहिया, पोस्टर का एक अक्षर।",
          mr: "अगदी जवळून एकच भाग सारी नजर व्यापतो — एक डोळा, एक चाक, भित्तिपत्रकावरचे एक अक्षर.",
        },
        pair: {
          left: { en: "From very close", hi: "बहुत पास से", mr: "अगदी जवळून" },
          right: { en: "one part fills the view", hi: "एक हिस्सा नज़र भरता है", mr: "एक भाग नजर व्यापतो" },
        },
      },
      {
        id: "far",
        name: { en: "From far away", hi: "दूर से", mr: "दुरून" },
        kind: "view",
        prompt: {
          en: "Seen from where does the WHOLE bus fit in your eye, but look small?",
          hi: "कहाँ से देखने पर पूरी बस आँख में समा जाती है, पर छोटी दिखती है?",
          mr: "कुठून पाहिल्यावर अख्खी बस नजरेत मावते, पण लहान दिसते?",
        },
        statement: {
          en: "From far away, the whole thing fits in your view at once, but every part of it looks small.",
          hi: "दूर से पूरी चीज़ एक साथ नज़र में आती है, पर उसका हर हिस्सा छोटा दिखता है।",
          mr: "दुरून पूर्ण वस्तू एकदम नजरेत येते, पण तिचा प्रत्येक भाग लहान दिसतो.",
        },
      },
      {
        id: "map",
        name: { en: "A map", hi: "नक़्शा", mr: "नकाशा" },
        kind: "drawing",
        prompt: {
          en: "What do we call a drawing of a place made as if seen from straight above?",
          hi: "किसी जगह का वह चित्र क्या कहलाता है जो ठीक ऊपर से देखे जैसा बनाया जाता है?",
          mr: "एखाद्या जागेचे थेट वरून पाहिल्यासारखे काढलेले चित्र काय म्हणतात?",
        },
        statement: {
          en: "A map draws a place as seen from straight above, which is why its roads are lines and its buildings are outlines.",
          hi: "नक़्शा जगह को ठीक ऊपर से देखे जैसा बनाता है — इसीलिए उसकी सड़कें लकीरें और इमारतें ख़ाके होती हैं।",
          mr: "नकाशा जागा थेट वरून पाहिल्यासारखी काढतो — म्हणूनच त्यातले रस्ते रेषा आणि इमारती आराखडे असतात.",
        },
        pair: {
          left: { en: "A map", hi: "नक़्शा", mr: "नकाशा" },
          right: { en: "drawn from straight above", hi: "ठीक ऊपर से बना", mr: "थेट वरून काढलेला" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Gappu walks toward a parked bus from the far end of the street. In which order does he see these: (1) only the driver's mirror filling his view, (2) the whole bus looking tiny, (3) the whole bus looking big?",
          hi: "गप्पू गली के दूर छोर से खड़ी बस की ओर चलता है। वह इन्हें किस क्रम में देखेगा: (1) केवल ड्राइवर का शीशा नज़र भरता हुआ, (2) पूरी बस नन्ही-सी, (3) पूरी बस बड़ी-सी?",
          mr: "गप्पू गल्लीच्या दूरच्या टोकाकडून उभ्या बसकडे चालतो. तो हे कोणत्या क्रमाने पाहील: (1) फक्त ड्रायव्हरचा आरसा नजर व्यापणारा, (2) अख्खी बस चिमुकली, (3) अख्खी बस मोठी?",
        },
        choices: [
          { en: "2 → 3 → 1", hi: "2 → 3 → 1", mr: "2 → 3 → 1" },
          { en: "1 → 2 → 3", hi: "1 → 2 → 3", mr: "1 → 2 → 3" },
          { en: "3 → 2 → 1", hi: "3 → 2 → 1", mr: "3 → 2 → 1" },
          { en: "2 → 1 → 3", hi: "2 → 1 → 3", mr: "2 → 1 → 3" },
        ],
        answerIndex: 0,
        solution: {
          en: "Far away shows the whole bus small (2); nearer, the whole bus grows big (3); at arm's length one part — the mirror — fills his view (1). Distance decides both how much fits and how big it looks, in opposite directions.",
          hi: "दूर से पूरी बस छोटी दिखती है (2); पास आने पर पूरी बस बड़ी (3); हाथ भर की दूरी पर एक हिस्सा — शीशा — नज़र भर देता है (1)। दूरी ही तय करती है कि कितना समाएगा और कितना बड़ा दिखेगा — दोनों उलटी दिशाओं में।",
          mr: "दुरून अख्खी बस लहान दिसते (2); जवळ येताच अख्खी बस मोठी (3); हातभर अंतरावर एक भाग — आरसा — नजर व्यापतो (1). अंतरच ठरवते किती मावेल आणि किती मोठे दिसेल — दोन्ही उलट दिशांनी.",
        },
      },
      {
        level: 5,
        stem: {
          en: "From the rooftop, Seema looks straight down at 4 mats drying papads, 6 papads on each mat. Without going down, how many papads does she count?",
          hi: "छत से सीमा ठीक नीचे देखती है: पापड़ सुखाने की 4 चटाइयाँ, हर चटाई पर 6 पापड़। नीचे उतरे बिना वह कितने पापड़ गिनती है?",
          mr: "गच्चीवरून सीमा थेट खाली पाहते: पापड वाळवणाऱ्या 4 चटया, प्रत्येक चटईवर 6 पापड. खाली न उतरता ती किती पापड मोजते?",
        },
        choices: [
          { en: "24", hi: "24", mr: "24" },
          { en: "10", hi: "10", mr: "10" },
          { en: "18", hi: "18", mr: "18" },
          { en: "30", hi: "30", mr: "30" },
        ],
        answerIndex: 0,
        solution: {
          en: "The top view lays everything out at once — 4 mats × 6 papads = 24. This is the rooftop's gift to counting: no papad hides behind another when you look from straight above.",
          hi: "ऊपर का दृश्य सब कुछ एक साथ बिछा देता है — 4 चटाइयाँ × 6 पापड़ = 24। गिनती को छत का यही उपहार है: ठीक ऊपर से देखने पर कोई पापड़ किसी के पीछे नहीं छिपता।",
          mr: "वरचे दृश्य सर्व एकदम मांडते — 4 चटया × 6 पापड = 24. मोजणीला गच्चीची हीच देणगी: थेट वरून पाहिल्यावर कोणताही पापड दुसऱ्यामागे लपत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A photo taken from straight above a table shows one big rectangle, two large circles and four small circles. What was most likely on the table?",
          hi: "मेज़ के ठीक ऊपर से ली गई तस्वीर में एक बड़ा आयत, दो बड़े वृत्त और चार छोटे वृत्त दिखते हैं। मेज़ पर सबसे संभवतः क्या रखा था?",
          mr: "टेबलाच्या थेट वरून घेतलेल्या छायाचित्रात एक मोठा आयत, दोन मोठी वर्तुळे आणि चार छोटी वर्तुळे दिसतात. टेबलावर बहुधा काय ठेवले होते?",
        },
        choices: [
          {
            en: "A tray with two plates and four bowls",
            hi: "एक परात, दो थालियाँ और चार कटोरियाँ",
            mr: "एक तबक, दोन ताटे आणि चार वाट्या",
          },
          {
            en: "Two books and four pencils",
            hi: "दो किताबें और चार पेंसिलें",
            mr: "दोन पुस्तके आणि चार पेन्सिली",
          },
          {
            en: "A bedsheet and four pillows",
            hi: "एक चादर और चार तकिए",
            mr: "एक चादर आणि चार उश्या",
          },
          {
            en: "Six glasses of water",
            hi: "पानी के छह गिलास",
            mr: "पाण्याचे सहा ग्लास",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "From above, round things photograph as circles and rectangular things as rectangles: a tray (rectangle), plates (big circles), bowls (small circles) fit the count exactly. Books would add rectangles, not circles; six glasses would print six equal circles.",
          hi: "ऊपर से गोल चीज़ें वृत्त और आयताकार चीज़ें आयत बनकर छपती हैं: परात (आयत), थालियाँ (बड़े वृत्त), कटोरियाँ (छोटे वृत्त) — गिनती ठीक बैठती है। किताबें आयत जोड़तीं, वृत्त नहीं; छह गिलास छह बराबर वृत्त छापते।",
          mr: "वरून गोल वस्तू वर्तुळे आणि आयताकृती वस्तू आयत म्हणून उमटतात: तबक (आयत), ताटे (मोठी वर्तुळे), वाट्या (छोटी वर्तुळे) — मोजणी नेमकी जुळते. पुस्तकांनी आयत वाढले असते, वर्तुळे नव्हे; सहा ग्लासांनी सहा सारखी वर्तुळे उमटली असती.",
        },
      },
      {
        level: 6,
        stem: {
          en: "On a map of the school drawn from straight above, which one of these can the map NEVER show directly?",
          hi: "ठीक ऊपर से बने स्कूल के नक़्शे में इनमें से क्या कभी सीधे नहीं दिख सकता?",
          mr: "थेट वरून काढलेल्या शाळेच्या नकाशात यांपैकी काय कधीही थेट दिसू शकत नाही?",
        },
        choices: [
          {
            en: "How tall the flagpole is",
            hi: "झंडे के खंभे की ऊँचाई",
            mr: "झेंड्याच्या खांबाची उंची",
          },
          {
            en: "Where the gate opens onto the road",
            hi: "फाटक सड़क पर कहाँ खुलता है",
            mr: "फाटक रस्त्यावर कुठे उघडते",
          },
          {
            en: "The shape of the playground",
            hi: "मैदान का आकार",
            mr: "मैदानाचा आकार",
          },
          {
            en: "Which building is nearest the well",
            hi: "कौन-सी इमारत कुएँ के सबसे पास है",
            mr: "कोणती इमारत विहिरीच्या सर्वांत जवळ आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A top-down view flattens the world: positions, shapes and distances survive, but height collapses to a dot. The flagpole becomes a point on the map — its tallness is exactly the direction the map cannot draw.",
          hi: "ऊपर से लिया दृश्य दुनिया को चपटा कर देता है: स्थान, आकार और दूरियाँ बच जाती हैं, पर ऊँचाई सिमटकर बिंदु बन जाती है। झंडे का खंभा नक़्शे पर एक बिंदु है — उसकी ऊँचाई ठीक वही दिशा है जो नक़्शा नहीं खींच सकता।",
          mr: "वरून घेतलेले दृश्य जग सपाट करते: जागा, आकार आणि अंतरे टिकतात, पण उंची आकसून ठिपका होते. झेंड्याचा खांब नकाशावर एक बिंदू — त्याची उंची हीच ती दिशा जी नकाशा काढूच शकत नाही.",
        },
      },
    ],
  },
];
