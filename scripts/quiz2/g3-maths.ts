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

export const G3_MATHS: TopicFileOut[] = [funWithNumbers()];
