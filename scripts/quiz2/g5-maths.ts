/**
 * Class 5 Maths — NCERT "Math Magic", chapter by chapter, same discipline as
 * Classes 3 and 4: every question authored individually, every computable
 * answer proven by a checkExpr, every wrong option a real ten-year-old's
 * mistake — the lost zero, the un-halved half square, the hour hand's 30°
 * forgotten.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ, rupees } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Math Magic (Class 5)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 1 — The Fish Tale (boats, catches and lakh-sized numbers)         */
/* ------------------------------------------------------------------------- */
function theFishTale(): TopicFileOut {
  const rand = rng("maths-5-the-fish-tale");
  const qs: OutQuestion[] = [];

  const kg = (n: number) => ({ en: `${n} kg`, hi: `${n} किग्रा`, mr: `${n} किलो` });
  const km = (n: number) => ({ en: `${n} km`, hi: `${n} किमी`, mr: `${n} किमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A log-boat (catamaran) brings in 20 kg of fish each trip. How much fish in 2 trips?",
          hi: "लट्ठों की नाव (कटमरैन) हर फेरे में 20 किलो मछली लाती है। 2 फेरों में कितनी मछली?",
          mr: "ओंडक्यांची होडी (कॅटामरान) प्रत्येक फेरीत 20 किलो मासे आणते. 2 फेऱ्यांत किती मासे?",
        },
        answer: 40,
        wrong: [22, 30, 60],
        checkExpr: "20*2",
        fmt: kg,
        solution: {
          en: "Two trips of 20 kg: 20 × 2 = 40 kg. 22 adds the trips as if they were kilos of fish.",
          hi: "20-20 किलो के दो फेरे: 20 × 2 = 40 किलो। 22 फेरों को मछली के किलो मानकर जोड़ देता है।",
          mr: "20-20 किलोच्या दोन फेऱ्या: 20 × 2 = 40 किलो. 22 फेऱ्यांनाच माशांचे किलो समजून मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Fresh fish sells at ₹60 per kg. What do 2 kg cost?",
          hi: "ताज़ी मछली ₹60 प्रति किलो बिकती है। 2 किलो के कितने लगेंगे?",
          mr: "ताजे मासे ₹60 प्रति किलोने विकले जातात. 2 किलोला किती लागतील?",
        },
        answer: 120,
        wrong: [62, 100, 240],
        checkExpr: "60*2",
        fmt: rupees,
        solution: {
          en: "Two kilos at ₹60: 60 × 2 = ₹120. ₹62 adds the weight to the rate — a rate multiplies by the kilos bought.",
          hi: "₹60 के भाव दो किलो: 60 × 2 = ₹120। ₹62 वज़न को भाव में जोड़ देता है — भाव ख़रीदे किलो से गुणा होता है।",
          mr: "₹60 च्या भावाने दोन किलो: 60 × 2 = ₹120. ₹62 वजन भावात मिळवते — भाव घेतलेल्या किलोंनी गुणला जातो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The fish market's ledger says 'seven thousand and fifty rupees'. Which number is that?",
          hi: "मछली बाज़ार के बही-खाते में लिखा है 'सात हज़ार पचास रुपये'। यह कौन-सी संख्या है?",
          mr: "मासळी बाजाराच्या वहीत लिहिले आहे 'सात हजार पन्नास रुपये'. ती कोणती संख्या?",
        },
        answer: 7050,
        wrong: [750, 7500, 7005],
        checkExpr: "7000+50",
        solution: {
          en: "Seven thousand is 7000 and fifty is 50: together 7050. Writing 7500 hears 'fifty' as 'five hundred'; 7005 drops the fifty into the ones.",
          hi: "सात हज़ार यानी 7000 और पचास यानी 50: मिलाकर 7050। 7500 'पचास' को 'पाँच सौ' सुन लेता है; 7005 पचास को इकाई में गिरा देता है।",
          mr: "सात हजार म्हणजे 7000 आणि पन्नास म्हणजे 50: मिळून 7050. 7500 'पन्नास'ला 'पाचशे' ऐकते; 7005 पन्नासला एककांत पाडते.",
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
          en: "A motor boat sails for 4 hours at 20 km every hour. How far does it go?",
          hi: "मोटर-नाव 4 घंटे, हर घंटे 20 किमी की चाल से चलती है। वह कितनी दूर जाएगी?",
          mr: "मोटर-होडी 4 तास, दर तासाला 20 किमी वेगाने जाते. ती किती दूर जाईल?",
        },
        answer: 80,
        wrong: [24, 60, 100],
        checkExpr: "20*4",
        fmt: km,
        solution: {
          en: "Four hours of 20 km each: 20 × 4 = 80 km. 24 adds hours to speed; distance is speed repeated over every hour sailed.",
          hi: "20-20 किमी के चार घंटे: 20 × 4 = 80 किमी। 24 घंटों को चाल में जोड़ देता है; दूरी हर चले घंटे में दोहराई गई चाल है।",
          mr: "20-20 किमीचे चार तास: 20 × 4 = 80 किमी. 24 तास वेगात मिळवते; अंतर म्हणजे प्रत्येक तासात पुनरावृत्त झालेला वेग.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The fishermen's society counted ONE LAKH rupees. How many thousands is one lakh?",
          hi: "मछुआरा समिति ने एक लाख रुपये गिने। एक लाख में कितने हज़ार होते हैं?",
          mr: "मच्छीमार संस्थेने एक लाख रुपये मोजले. एका लाखात किती हजार असतात?",
        },
        answer: 100,
        wrong: [10, 1000, 50],
        checkExpr: "100000/1000",
        solution: {
          en: "One lakh is 1,00,000 — and 100000 ÷ 1000 = 100 thousands. 10 stops at ten thousand, one comma too early.",
          hi: "एक लाख यानी 1,00,000 — और 100000 ÷ 1000 = 100 हज़ार। 10 दस हज़ार पर रुक जाता है, एक अल्पविराम पहले।",
          mr: "एक लाख म्हणजे 1,00,000 — आणि 100000 ÷ 1000 = 100 हजार. 10 दहा हजारावर थांबते, एक स्वल्पविराम आधी.",
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
          en: "A new fishing net costs ₹1200. Fazila saves ₹200 every month. In how many months can she buy it?",
          hi: "नया जाल ₹1200 का है। फ़ज़ीला हर महीने ₹200 बचाती है। कितने महीनों में वह उसे ख़रीद सकेगी?",
          mr: "नवे जाळे ₹1200 चे आहे. फझिला दर महिन्याला ₹200 साठवते. किती महिन्यांत ती ते घेऊ शकेल?",
        },
        answer: 6,
        wrong: [5, 7, 1000],
        checkExpr: "1200/200",
        solution: {
          en: "How many 200s make 1200: 1200 ÷ 200 = 6 months. 1000 subtracts one month's saving instead of counting the months.",
          hi: "1200 में 200 कितनी बार: 1200 ÷ 200 = 6 महीने। 1000 महीनों को गिनने की जगह एक महीने की बचत घटा देता है।",
          mr: "1200 मध्ये 200 किती वेळा: 1200 ÷ 200 = 6 महिने. 1000 महिने मोजण्याऐवजी एका महिन्याची बचत वजा करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A boat lands 250 kg of fish, all sold at ₹40 per kg. How much money is that?",
          hi: "एक नाव 250 किलो मछली उतारती है, सारी ₹40 प्रति किलो बिकती है। कुल कितने पैसे हुए?",
          mr: "एक होडी 250 किलो मासे उतरवते, सारे ₹40 प्रति किलोने विकले जातात. एकूण किती पैसे झाले?",
        },
        answer: 10000,
        wrong: [1000, 8000, 290],
        checkExpr: "250*40",
        fmt: rupees,
        solution: {
          en: "250 × 40 = 250 × 4 tens = 1000 tens = ₹10,000. ₹1000 drops a zero on the way; ₹290 adds the weight to the rate.",
          hi: "250 × 40 = 250 × 4 दहाई = 1000 दहाई = ₹10,000। ₹1000 रास्ते में एक शून्य गिरा देता है; ₹290 वज़न को भाव में जोड़ता है।",
          mr: "250 × 40 = 250 × 4 दशक = 1000 दशक = ₹10,000. ₹1000 वाटेत एक शून्य पाडते; ₹290 वजन भावात मिळवते.",
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
          en: "In the fisherwomen's bank, 25 women each put in ₹100 every month. How much does the bank collect in one month?",
          hi: "मछुआरिनों के बैंक में 25 महिलाएँ हर महीने ₹100-₹100 जमा करती हैं। एक महीने में बैंक के पास कितना जमा होता है?",
          mr: "कोळिणींच्या बँकेत 25 बाया दर महिन्याला ₹100-₹100 भरतात. एका महिन्यात बँकेकडे किती जमा होतात?",
        },
        answer: 2500,
        wrong: [125, 250, 2600],
        checkExpr: "25*100",
        fmt: rupees,
        solution: {
          en: "25 shares of ₹100: 25 × 100 = ₹2500. ₹250 loses a zero; ₹125 adds the women to the rupees. Small monthly hands build a big shared fund — that is the bank's whole idea.",
          hi: "₹100 के 25 हिस्से: 25 × 100 = ₹2500। ₹250 एक शून्य खोता है; ₹125 महिलाओं को रुपयों में जोड़ता है। छोटे-छोटे मासिक हाथ बड़ा साझा कोष बनाते हैं — यही बैंक की पूरी सोच है।",
          mr: "₹100 चे 25 वाटे: 25 × 100 = ₹2500. ₹250 एक शून्य गमावते; ₹125 बायांना रुपयांत मिळवते. लहान लहान मासिक हात मोठा सामायिक निधी उभारतात — हीच बँकेची सारी कल्पना.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A big trawler catches in ONE trip what 12 log-boats together catch, each log-boat bringing 15 kg. How much does the trawler catch?",
          hi: "बड़ा ट्रॉलर एक ही फेरे में उतना पकड़ता है जितना 12 लट्ठा-नावें मिलकर — हर नाव 15 किलो लाती है। ट्रॉलर कितना पकड़ता है?",
          mr: "मोठा ट्रॉलर एकाच फेरीत तितके पकडतो जितके 12 ओंडका-होड्या मिळून — प्रत्येक होडी 15 किलो आणते. ट्रॉलर किती पकडतो?",
        },
        answer: 180,
        wrong: [27, 120, 165],
        checkExpr: "12*15",
        fmt: kg,
        solution: {
          en: "Twelve boats of 15 kg: 12 × 15 = 12 × 10 + 12 × 5 = 120 + 60 = 180 kg. 120 stops at the tens; 27 adds boats to kilos. One machine, twelve livelihoods — the chapter's quiet question.",
          hi: "15-15 किलो की बारह नावें: 12 × 15 = 12 × 10 + 12 × 5 = 120 + 60 = 180 किलो। 120 दहाई पर रुकता है; 27 नावें किलो में जोड़ता है। एक मशीन, बारह रोज़ियाँ — अध्याय का चुपचाप सवाल।",
          mr: "15-15 किलोच्या बारा होड्या: 12 × 15 = 12 × 10 + 12 × 5 = 120 + 60 = 180 किलो. 120 दशकावर थांबते; 27 होड्या किलोंत मिळवते. एक यंत्र, बारा रोजीरोट्या — धड्याचा शांत प्रश्न.",
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
          en: "3500 kg of fish must be packed into ice-crates of 50 kg each. How many crates are needed?",
          hi: "3500 किलो मछली 50-50 किलो के बर्फ़-क्रेटों में भरनी है। कितने क्रेट चाहिए?",
          mr: "3500 किलो मासे 50-50 किलोच्या बर्फ-खोक्यांत भरायचे आहेत. किती खोकी लागतील?",
        },
        answer: 70,
        wrong: [7, 700, 65],
        checkExpr: "3500/50",
        solution: {
          en: "3500 ÷ 50 = 70 crates — check: 70 × 50 = 3500. Both 7 and 700 are zero-slips, ten times too few and ten times too many.",
          hi: "3500 ÷ 50 = 70 क्रेट — जाँच: 70 × 50 = 3500। 7 और 700 दोनों शून्य की फिसलन हैं — दस गुना कम और दस गुना ज़्यादा।",
          mr: "3500 ÷ 50 = 70 खोकी — तपासणी: 70 × 50 = 3500. 7 आणि 700 दोन्ही शून्याच्या घसरणी — दसपट कमी आणि दसपट जास्त.",
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
          en: "A trawler hauls up 700 kg, but one seventh of it is baby fish that must be thrown back to grow. How much catch does it keep?",
          hi: "ट्रॉलर 700 किलो खींचता है, पर उसका सातवाँ हिस्सा नन्ही मछलियाँ हैं जिन्हें बढ़ने के लिए वापस डालना है। कितनी पकड़ उसके पास रहती है?",
          mr: "ट्रॉलर 700 किलो ओढतो, पण त्याचा सातवा भाग लहान मासे आहेत, ज्यांना वाढण्यासाठी परत सोडायचे आहे. किती पकड त्याच्याकडे राहते?",
        },
        answer: 600,
        wrong: [100, 630, 693],
        checkExpr: "700-700/7",
        fmt: kg,
        solution: {
          en: "One seventh of 700 is 700 ÷ 7 = 100 kg of baby fish; kept is 700 − 100 = 600 kg. 100 answers what was thrown back, not what stayed. Throwing the small ones back is arithmetic for the future too: next year's 700 swims away today.",
          hi: "700 का सातवाँ हिस्सा 700 ÷ 7 = 100 किलो नन्ही मछलियाँ; बची पकड़ 700 − 100 = 600 किलो। 100 वह बताता है जो लौटाया गया, न कि जो रहा। नन्हों को लौटाना भविष्य का भी गणित है: अगले साल का 700 आज तैरकर बच निकलता है।",
          mr: "700 चा सातवा भाग 700 ÷ 7 = 100 किलो लहान मासे; उरली पकड 700 − 100 = 600 किलो. 100 परत सोडलेले सांगते, राहिलेले नव्हे. लहानग्यांना परत सोडणे हे भविष्याचेही गणित: पुढच्या वर्षीचे 700 आज पोहून निसटते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 1 — The Fish Tale",
      name: "The Fish Tale",
      slug: "maths-5-the-fish-tale",
      summary: "Boats, catches and the fisherwomen's bank — speeds and rates, lakh-sized counts, and the arithmetic of throwing small fish back.",
      position: 1,
      translations: {
        hi: {
          name: "मछली उछली",
          summary: "नावें, पकड़ और मछुआरिनों का बैंक — चाल और भाव, लाख तक की गिनती, और नन्ही मछलियाँ लौटाने का गणित।",
        },
        mr: {
          name: "माशांची गोष्ट",
          summary: "होड्या, पकड आणि कोळिणींची बँक — वेग आणि भाव, लाखापर्यंतची मोजणी, आणि लहान मासे परत सोडण्याचे गणित.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Shapes and Angles (right angles, turns and the clock face)    */
/* ------------------------------------------------------------------------- */
function shapesAndAngles(): TopicFileOut {
  const rand = rng("maths-5-shapes-and-angles");
  const qs: OutQuestion[] = [];

  const deg = (n: number) => ({ en: `${n}°`, hi: `${n}°`, mr: `${n}°` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The corner of a book, a door held straight open, a plus sign — each shows a right angle. How many degrees is that?",
          hi: "किताब का कोना, सीधा खुला दरवाज़ा, जोड़ का चिह्न — हर एक समकोण दिखाता है। वह कितने अंश (डिग्री) का होता है?",
          mr: "पुस्तकाचा कोपरा, सरळ उघडलेले दार, बेरजेचे चिन्ह — प्रत्येक काटकोन दाखवतो. तो किती अंशांचा असतो?",
        },
        answer: 90,
        wrong: [45, 100, 180],
        fmt: deg,
        solution: {
          en: "A right angle is 90° — a quarter of the way round. 100 confuses degrees with counting by hundreds; angles turn in nineties.",
          hi: "समकोण 90° का है — पूरे चक्कर का चौथाई। 100 डिग्री को सैकड़े की गिनती समझ बैठता है; कोण नब्बे के हिसाब से मुड़ते हैं।",
          mr: "काटकोन 90° चा — पूर्ण फेरीचा पाव. 100 अंशांना शंभरीची मोजणी समजते; कोन नव्वदीच्या हिशेबाने वळतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "An angle opened flat into a straight line measures how many degrees?",
          hi: "सीधी रेखा में पूरा खुल गया कोण कितने अंश का होता है?",
          mr: "सरळ रेषेत पूर्ण उघडलेला कोन किती अंशांचा असतो?",
        },
        answer: 180,
        wrong: [90, 360, 100],
        fmt: deg,
        solution: {
          en: "A straight line is 180° — two right angles laid together. 360 is the full turn, all the way round to where you began.",
          hi: "सीधी रेखा 180° है — दो समकोण मिलाकर। 360 पूरा चक्कर है, घूमकर वहीं जहाँ से चले थे।",
          mr: "सरळ रेषा 180° — दोन काटकोन जोडून. 360 म्हणजे पूर्ण फेरी, फिरून सुरुवातीच्याच जागी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A full turn is 360°. How many right angles fit in one full turn?",
          hi: "पूरा चक्कर 360° का है। एक पूरे चक्कर में कितने समकोण समाते हैं?",
          mr: "पूर्ण फेरी 360° ची. एका पूर्ण फेरीत किती काटकोन मावतात?",
        },
        answer: 4,
        wrong: [2, 3, 6],
        checkExpr: "360/90",
        solution: {
          en: "360 ÷ 90 = 4 right angles — turn right four times and you face your starting way again. 2 makes only half the journey.",
          hi: "360 ÷ 90 = 4 समकोण — चार बार दाएँ मुड़िए और फिर वही दिशा। 2 आधा ही सफ़र तय करता है।",
          mr: "360 ÷ 90 = 4 काटकोन — चारदा उजवीकडे वळा की पुन्हा तीच दिशा. 2 अर्धाच प्रवास करते.",
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
          en: "An acute angle is SMALLER than a right angle. Which of these measures could be acute?",
          hi: "न्यून कोण समकोण से छोटा होता है। इनमें से कौन-सा माप न्यून कोण का हो सकता है?",
          mr: "लघुकोन काटकोनाहून लहान असतो. यांपैकी कोणते माप लघुकोनाचे असू शकते?",
        },
        answer: 60,
        wrong: [90, 120, 180],
        fmt: deg,
        solution: {
          en: "Acute means under 90°, so 60° qualifies. 90° is exactly right, not acute; 120° has opened past the corner into obtuse country.",
          hi: "न्यून यानी 90° से कम, तो 60° ठीक बैठता है। 90° ठीक समकोण है, न्यून नहीं; 120° कोने के पार अधिक कोण के इलाक़े में खुल चुका है।",
          mr: "लघु म्हणजे 90° हून कमी, म्हणून 60° बरोबर. 90° नेमका काटकोन, लघु नव्हे; 120° कोपऱ्यापलीकडे विशालकोनाच्या मुलखात उघडला आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "At 3 o'clock the two hands of the clock make which angle?",
          hi: "3 बजे घड़ी की दोनों सुइयाँ कौन-सा कोण बनाती हैं?",
          mr: "3 वाजता घड्याळाचे दोन्ही काटे कोणता कोन करतात?",
        },
        answer: 90,
        wrong: [60, 120, 180],
        checkExpr: "360/4",
        fmt: deg,
        solution: {
          en: "From 12 to 3 the minute-space is a quarter of the face: 360 ÷ 4 = 90°, a perfect right angle. 180 is 6 o'clock's straight line.",
          hi: "12 से 3 तक चेहरे का चौथाई है: 360 ÷ 4 = 90°, एकदम समकोण। 180 तो 6 बजे की सीधी रेखा है।",
          mr: "12 ते 3 हा तोंडाचा पाव भाग: 360 ÷ 4 = 90°, अगदी काटकोन. 180 ही 6 वाजताची सरळ रेषा.",
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
          en: "Fold a right angle exactly in half. What angle does each half measure?",
          hi: "समकोण को ठीक आधा मोड़िए। हर आधा कितने अंश का होगा?",
          mr: "काटकोन नेमका अर्धा दुमडा. प्रत्येक अर्धा किती अंशांचा होईल?",
        },
        answer: 45,
        wrong: [30, 60, 90],
        checkExpr: "90/2",
        fmt: deg,
        solution: {
          en: "Half of 90° is 90 ÷ 2 = 45° — the angle of a ladder leaning evenly, or a square cut corner to corner. 30 halves 60 instead.",
          hi: "90° का आधा 90 ÷ 2 = 45° — बराबर झुकी सीढ़ी का, या कोने-से-कोने कटे वर्ग का कोण। 30 तो 60 का आधा है।",
          mr: "90° चा अर्धा 90 ÷ 2 = 45° — समतोल टेकलेल्या शिडीचा, वा कोपऱ्यातून कापलेल्या चौरसाचा कोन. 30 हा 60 चा अर्धा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "At 6 o'clock the clock's hands point opposite ways. How many degrees lie between them?",
          hi: "6 बजे घड़ी की सुइयाँ उलटी दिशाओं में होती हैं। उनके बीच कितने अंश होते हैं?",
          mr: "6 वाजता घड्याळाचे काटे उलट दिशांना असतात. त्यांच्यामध्ये किती अंश असतात?",
        },
        answer: 180,
        wrong: [90, 360, 60],
        checkExpr: "90*2",
        fmt: deg,
        solution: {
          en: "Opposite hands make a straight line: two right angles, 90 × 2 = 180°. 360 would bring one hand all the way round onto the other.",
          hi: "उलटी सुइयाँ सीधी रेखा बनाती हैं: दो समकोण, 90 × 2 = 180°। 360 में एक सुई घूमकर दूसरी पर ही आ बैठती।",
          mr: "उलटे काटे सरळ रेषा करतात: दोन काटकोन, 90 × 2 = 180°. 360 मध्ये एक काटा फिरून दुसऱ्यावरच येऊन बसला असता.",
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
          en: "An angle measures 120°. By how much has it opened PAST a right angle?",
          hi: "एक कोण 120° का है। वह समकोण से कितना आगे खुल गया है?",
          mr: "एक कोन 120° चा आहे. तो काटकोनाहून किती पुढे उघडला आहे?",
        },
        answer: 30,
        wrong: [60, 120, 20],
        checkExpr: "120-90",
        fmt: deg,
        solution: {
          en: "Past the 90° corner by 120 − 90 = 30°. 60 measures its distance to the straight line ahead (180), not to the corner behind.",
          hi: "90° के कोने से 120 − 90 = 30° आगे। 60 उसके आगे की सीधी रेखा (180) तक की दूरी है, पीछे के कोने तक की नहीं।",
          mr: "90° च्या कोपऱ्याहून 120 − 90 = 30° पुढे. 60 हे त्याचे पुढच्या सरळ रेषेपर्यंतचे (180) अंतर, मागच्या कोपऱ्यापर्यंतचे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A ladder against a wall makes 70° with the ground. How far short of standing perfectly upright (90°) is it?",
          hi: "दीवार से लगी सीढ़ी ज़मीन से 70° बनाती है। बिलकुल सीधे खड़े होने (90°) से वह कितना कम है?",
          mr: "भिंतीला टेकलेली शिडी जमिनीशी 70° करते. अगदी ताठ उभे राहण्याहून (90°) ती किती कमी आहे?",
        },
        answer: 20,
        wrong: [70, 30, 110],
        checkExpr: "90-70",
        fmt: deg,
        solution: {
          en: "Upright is 90°, the ladder leans at 70°: 90 − 70 = 20° short. 110 adds the lean past upright — a ladder past upright is falling the other way.",
          hi: "सीधा यानी 90°, सीढ़ी 70° पर झुकी है: 90 − 70 = 20° कम। 110 झुकाव को सीधे के पार जोड़ देता है — सीधे के पार गई सीढ़ी दूसरी ओर गिर रही होती है।",
          mr: "ताठ म्हणजे 90°, शिडी 70° वर कललेली: 90 − 70 = 20° कमी. 110 कल ताठाच्या पलीकडे मिळवते — ताठाच्या पलीकडची शिडी दुसरीकडे पडत असते.",
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
          en: "In 5 minutes, through how many degrees does the minute hand turn?",
          hi: "5 मिनट में बड़ी (मिनट) सुई कितने अंश घूमती है?",
          mr: "5 मिनिटांत मिनिट-काटा किती अंश फिरतो?",
        },
        answer: 30,
        wrong: [5, 60, 90],
        checkExpr: "360/12",
        fmt: deg,
        solution: {
          en: "5 minutes is one number-step of the twelve on the face: 360 ÷ 12 = 30°. Answering 5 reads minutes as degrees — the hand turns 6° each minute, not 1°.",
          hi: "5 मिनट यानी चेहरे के बारह अंकों में से एक क़दम: 360 ÷ 12 = 30°। 5 कहना मिनटों को अंश पढ़ना है — सुई हर मिनट 6° घूमती है, 1° नहीं।",
          mr: "5 मिनिटे म्हणजे तोंडावरच्या बारा आकड्यांतले एक पाऊल: 360 ÷ 12 = 30°. 5 म्हणणे म्हणजे मिनिटांना अंश वाचणे — काटा दर मिनिटाला 6° फिरतो, 1° नव्हे.",
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
          en: "At exactly 4 o'clock, what angle do the clock's two hands make?",
          hi: "ठीक 4 बजे घड़ी की दोनों सुइयाँ आपस में कौन-सा कोण बनाती हैं?",
          mr: "ठीक 4 वाजता घड्याळाचे दोन्ही काटे परस्परांत कोणता कोन करतात?",
        },
        answer: 120,
        wrong: [90, 60, 140],
        checkExpr: "30*4",
        fmt: deg,
        solution: {
          en: "Each hour-number is 360 ÷ 12 = 30° from the next, and at 4 o'clock the hands stand 4 numbers apart: 30 × 4 = 120°. 90 borrows 3 o'clock's answer — the right angle lives at 3 and 9, nowhere else on the hour.",
          hi: "हर घंटे का अंक अगले से 360 ÷ 12 = 30° दूर है, और 4 बजे सुइयाँ 4 अंक दूर खड़ी हैं: 30 × 4 = 120°। 90 तीन बजे का उत्तर उधार लेता है — पूरे घंटों में समकोण केवल 3 और 9 बजे बसता है।",
          mr: "प्रत्येक तासाचा आकडा पुढच्याहून 360 ÷ 12 = 30° दूर, आणि 4 वाजता काटे 4 आकडे दूर उभे: 30 × 4 = 120°. 90 तीन वाजताचे उत्तर उसने घेते — पूर्ण तासांत काटकोन फक्त 3 आणि 9 वाजताच राहतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 2 — Shapes and Angles",
      name: "Shapes and Angles",
      slug: "maths-5-shapes-and-angles",
      summary: "Right angles and turns — degrees on the clock face, ladders leaning, and angles folded, opened and compared.",
      position: 2,
      translations: {
        hi: {
          name: "आकृतियाँ और कोण",
          summary: "समकोण और घुमाव — घड़ी के चेहरे पर अंश, झुकी सीढ़ियाँ, और मोड़े, खोले और मिलाए गए कोण।",
        },
        mr: {
          name: "आकार आणि कोन",
          summary: "काटकोन आणि वळणे — घड्याळाच्या तोंडावरचे अंश, कललेल्या शिड्या, आणि दुमडलेले, उघडलेले आणि ताडलेले कोन.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — How Many Squares? (area by counting squares)                  */
/* ------------------------------------------------------------------------- */
function howManySquares(): TopicFileOut {
  const rand = rng("maths-5-how-many-squares");
  const qs: OutQuestion[] = [];

  const sq = (n: number) => ({ en: `${n} squares`, hi: `${n} ख़ाने`, mr: `${n} चौकटी` });
  const sqcm = (n: number) => ({ en: `${n} sq cm`, hi: `${n} वर्ग सेमी`, mr: `${n} चौ. सेमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "On squared paper a rectangle covers 3 rows of 5 squares each. How many squares is its area?",
          hi: "ख़ानेदार काग़ज़ पर एक आयत 5-5 ख़ानों की 3 पंक्तियाँ घेरता है। उसका क्षेत्रफल कितने ख़ाने हुआ?",
          mr: "चौकटीच्या कागदावर एक आयत 5-5 चौकटींच्या 3 ओळी व्यापतो. त्याचे क्षेत्रफळ किती चौकटी?",
        },
        answer: 15,
        wrong: [8, 16, 10],
        checkExpr: "3*5",
        fmt: sq,
        solution: {
          en: "Three rows of five: 3 × 5 = 15 squares. 8 adds rows to columns — area counts every square, row by row.",
          hi: "पाँच-पाँच की तीन पंक्तियाँ: 3 × 5 = 15 ख़ाने। 8 पंक्तियों को स्तंभों में जोड़ता है — क्षेत्रफल हर ख़ाना गिनता है, पंक्ति-दर-पंक्ति।",
          mr: "पाच-पाचच्या तीन ओळी: 3 × 5 = 15 चौकटी. 8 ओळी स्तंभांत मिळवते — क्षेत्रफळ प्रत्येक चौकट मोजते, ओळीमागून ओळ.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A square of side 4 is drawn on squared paper. How many small squares does it cover?",
          hi: "ख़ानेदार काग़ज़ पर 4 भुजा वाला वर्ग बना है। वह कितने छोटे ख़ाने घेरता है?",
          mr: "चौकटीच्या कागदावर 4 बाजूचा चौरस काढला आहे. तो किती लहान चौकटी व्यापतो?",
        },
        answer: 16,
        wrong: [8, 12, 20],
        checkExpr: "4*4",
        fmt: sq,
        solution: {
          en: "Four rows of four: 4 × 4 = 16 squares. 8 doubles the side instead of squaring it — that counts only two edges, not the filled floor.",
          hi: "चार-चार की चार पंक्तियाँ: 4 × 4 = 16 ख़ाने। 8 भुजा को वर्ग करने की जगह दुगना करता है — वह भरा फ़र्श नहीं, बस दो किनारे गिनता है।",
          mr: "चार-चारच्या चार ओळी: 4 × 4 = 16 चौकटी. 8 बाजूचा वर्ग करण्याऐवजी ती दुप्पट करते — ते भरलेली फरशी नव्हे, फक्त दोन कडा मोजते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "One stamp covers 12 squares. How many squares do two such stamps cover side by side?",
          hi: "एक डाक-टिकट 12 ख़ाने घेरता है। ऐसे दो टिकट अग़ल-बग़ल कितने ख़ाने घेरेंगे?",
          mr: "एक तिकीट 12 चौकटी व्यापते. अशी दोन तिकिटे शेजारी शेजारी किती चौकटी व्यापतील?",
        },
        answer: 24,
        wrong: [14, 22, 144],
        checkExpr: "12*2",
        fmt: sq,
        solution: {
          en: "Two stamps of 12: 12 × 2 = 24 squares. 144 multiplies the stamp by itself — the second stamp repeats it, not squares it.",
          hi: "12-12 के दो टिकट: 12 × 2 = 24 ख़ाने। 144 टिकट को उसी से गुणा करता है — दूसरा टिकट उसे दोहराता है, वर्ग नहीं करता।",
          mr: "12-12 ची दोन तिकिटे: 12 × 2 = 24 चौकटी. 144 तिकिटाला त्यानेच गुणते — दुसरे तिकीट त्याची पुनरावृत्ती करते, वर्ग नव्हे.",
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
          en: "A footprint traced on squared paper covers 18 full squares and 4 HALF squares. What is its area in squares?",
          hi: "ख़ानेदार काग़ज़ पर उतारा पदचिह्न 18 पूरे ख़ाने और 4 आधे ख़ाने घेरता है। उसका क्षेत्रफल कितने ख़ाने?",
          mr: "चौकटीच्या कागदावर उतरवलेला पाऊलठसा 18 पूर्ण चौकटी आणि 4 अर्ध्या चौकटी व्यापतो. त्याचे क्षेत्रफळ किती चौकटी?",
        },
        answer: 20,
        wrong: [22, 18, 26],
        checkExpr: "18+4/2",
        fmt: sq,
        solution: {
          en: "Four halves make 4 ÷ 2 = 2 whole squares, so 18 + 2 = 20. Counting 22 treats each half as a whole — the classic slip when tracing feet and leaves.",
          hi: "चार आधे यानी 4 ÷ 2 = 2 पूरे ख़ाने, तो 18 + 2 = 20। 22 हर आधे को पूरा गिनता है — पैर और पत्ते उतारते समय की जानी-पहचानी चूक।",
          mr: "चार अर्ध्या म्हणजे 4 ÷ 2 = 2 पूर्ण चौकटी, म्हणून 18 + 2 = 20. 22 प्रत्येक अर्ध्याला पूर्ण मोजते — पाय आणि पाने उतरवतानाची ओळखीची चूक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Each small square of the paper has 1 cm sides. A rectangle covers 7 columns and 3 rows. What is its area?",
          hi: "काग़ज़ के हर छोटे ख़ाने की भुजा 1 सेमी है। एक आयत 7 स्तंभ और 3 पंक्तियाँ घेरता है। उसका क्षेत्रफल कितना?",
          mr: "कागदाच्या प्रत्येक लहान चौकटीची बाजू 1 सेमी. एक आयत 7 स्तंभ आणि 3 ओळी व्यापतो. त्याचे क्षेत्रफळ किती?",
        },
        answer: 21,
        wrong: [10, 20, 24],
        checkExpr: "7*3",
        fmt: sqcm,
        solution: {
          en: "Each square is 1 sq cm, and 7 × 3 = 21 of them fit — area 21 sq cm. 10 adds the sides; the boundary adds, the area multiplies.",
          hi: "हर ख़ाना 1 वर्ग सेमी, और 7 × 3 = 21 समाते हैं — क्षेत्रफल 21 वर्ग सेमी। 10 भुजाएँ जोड़ता है; सीमा जुड़ती है, क्षेत्रफल गुणा होता है।",
          mr: "प्रत्येक चौकट 1 चौ. सेमी, आणि 7 × 3 = 21 मावतात — क्षेत्रफळ 21 चौ. सेमी. 10 बाजू मिळवते; हद्द मिळते, क्षेत्रफळ गुणले जाते.",
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
          en: "A rectangle covers 24 squares and is 4 squares wide. How many squares long is it?",
          hi: "एक आयत 24 ख़ाने घेरता है और 4 ख़ाने चौड़ा है। वह कितने ख़ाने लंबा है?",
          mr: "एक आयत 24 चौकटी व्यापतो आणि 4 चौकटी रुंद आहे. तो किती चौकटी लांब आहे?",
        },
        answer: 6,
        wrong: [20, 8, 96],
        checkExpr: "24/4",
        solution: {
          en: "Length × 4 = 24, so length = 24 ÷ 4 = 6 squares. 20 subtracts the width from the area — area undoes by division, not subtraction.",
          hi: "लंबाई × 4 = 24, तो लंबाई = 24 ÷ 4 = 6 ख़ाने। 20 क्षेत्रफल में से चौड़ाई घटाता है — क्षेत्रफल भाग से खुलता है, घटाव से नहीं।",
          mr: "लांबी × 4 = 24, म्हणून लांबी = 24 ÷ 4 = 6 चौकटी. 20 क्षेत्रफळातून रुंदी वजा करते — क्षेत्रफळ भागाकाराने उलगडते, वजाबाकीने नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A chessboard has 8 rows with 8 squares in each. How many small squares is the whole board?",
          hi: "शतरंज की बिसात में 8 पंक्तियाँ हैं, हर एक में 8 ख़ाने। पूरी बिसात में कितने छोटे ख़ाने?",
          mr: "बुद्धिबळाच्या पटावर 8 ओळी आहेत, प्रत्येकीत 8 घरे. सबंध पटावर किती लहान घरे?",
        },
        answer: 64,
        wrong: [16, 56, 72],
        checkExpr: "8*8",
        fmt: sq,
        solution: {
          en: "8 × 8 = 64 squares. 16 adds the eights; 56 and 72 are one row of eight below and above — the eight-times table's neighbours.",
          hi: "8 × 8 = 64 ख़ाने। 16 आठों को जोड़ता है; 56 और 72 एक-एक पंक्ति नीचे-ऊपर हैं — आठ के पहाड़े के पड़ोसी।",
          mr: "8 × 8 = 64 घरे. 16 आठ मिळवते; 56 आणि 72 एकेक ओळ खाली-वर — आठाच्या पाढ्याचे शेजारी.",
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
          en: "Two rectangles are drawn: one 6 by 4, another 5 by 5. Which covers more — and by how many squares?",
          hi: "दो आयत बने हैं: एक 6 × 4, दूसरा 5 × 5। कौन ज़्यादा घेरता है — और कितने ख़ानों से?",
          mr: "दोन आयत काढले आहेत: एक 6 × 4, दुसरा 5 × 5. कोणता जास्त व्यापतो — आणि किती चौकटींनी?",
        },
        answer: 1,
        wrong: [2, 0, 5],
        checkExpr: "5*5-6*4",
        fmt: sq,
        solution: {
          en: "6 × 4 = 24 and 5 × 5 = 25: the square wins by 25 − 24 = 1 square. Same-looking sizes, different areas — of shapes with equal boundary, the squarest holds the most.",
          hi: "6 × 4 = 24 और 5 × 5 = 25: वर्ग 25 − 24 = 1 ख़ाने से जीतता है। देखने में बराबर नाप, क्षेत्रफल अलग — बराबर सीमा वाली आकृतियों में सबसे वर्ग-सी ही सबसे ज़्यादा समेटती है।",
          mr: "6 × 4 = 24 आणि 5 × 5 = 25: चौरस 25 − 24 = 1 चौकटीने जिंकतो. दिसायला सारखी मापे, क्षेत्रफळ वेगळे — सारख्या हद्दीच्या आकारांत सर्वांत चौरसासारखाच सर्वाधिक सामावतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A 6-by-6 sheet of stamps is cut into small 2-by-2 stamps. How many stamps come out?",
          hi: "6 × 6 की टिकट-शीट 2 × 2 के छोटे टिकटों में काटी गई। कितने टिकट निकलेंगे?",
          mr: "6 × 6 ची तिकीट-शीट 2 × 2 च्या लहान तिकिटांत कापली. किती तिकिटे निघतील?",
        },
        answer: 9,
        wrong: [12, 18, 6],
        checkExpr: "6*6/(2*2)",
        solution: {
          en: "The sheet holds 36 squares, each stamp takes 4: 36 ÷ 4 = 9 stamps — three rows of three. 18 divides by 2 only once; the stamp is two squares BOTH ways.",
          hi: "शीट में 36 ख़ाने, हर टिकट 4 लेता है: 36 ÷ 4 = 9 टिकट — तीन-तीन की तीन पंक्तियाँ। 18 केवल एक बार 2 से भाग देता है; टिकट दोनों दिशाओं में दो-दो ख़ाने का है।",
          mr: "शीटमध्ये 36 चौकटी, प्रत्येक तिकीट 4 घेते: 36 ÷ 4 = 9 तिकिटे — तीन-तीनच्या तीन ओळी. 18 फक्त एकदाच 2 ने भागते; तिकीट दोन्ही दिशांनी दोन-दोन चौकटींचे आहे.",
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
          en: "A rectangle's area is 36 squares and its length is 9. What is its BOUNDARY, counted in square-edges?",
          hi: "आयत का क्षेत्रफल 36 ख़ाने है और लंबाई 9। ख़ाना-किनारों में गिनें तो उसकी सीमा कितनी?",
          mr: "आयताचे क्षेत्रफळ 36 चौकटी आणि लांबी 9. चौकट-कडांनी मोजली तर त्याची हद्द किती?",
        },
        answer: 26,
        wrong: [13, 36, 22],
        checkExpr: "2*(9+36/9)",
        solution: {
          en: "Width first: 36 ÷ 9 = 4. Then the boundary: (9 + 4) × 2 = 26 edges. 13 walks only half the way round; 36 confuses the border with the floor it encloses.",
          hi: "पहले चौड़ाई: 36 ÷ 9 = 4। फिर सीमा: (9 + 4) × 2 = 26 किनारे। 13 आधा ही चक्कर लगाता है; 36 बाड़ को उस फ़र्श से मिला देता है जिसे वह घेरती है।",
          mr: "आधी रुंदी: 36 ÷ 9 = 4. मग हद्द: (9 + 4) × 2 = 26 कडा. 13 अर्धीच फेरी मारते; 36 कुंपणाला ते वेढत असलेल्या फरशीशी गल्लत करते.",
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
          en: "With 12 squares you must draw a rectangle of the LONGEST possible boundary. One row of 12 gives what boundary?",
          hi: "12 ख़ानों से सबसे लंबी सीमा वाला आयत बनाना है। 12 की एक पंक्ति कितनी सीमा देती है?",
          mr: "12 चौकटींतून सर्वांत लांब हद्दीचा आयत काढायचा आहे. 12 ची एक ओळ किती हद्द देते?",
        },
        answer: 26,
        wrong: [24, 16, 14],
        checkExpr: "2*(12+1)",
        solution: {
          en: "The thin 1-by-12 strip has boundary (12 + 1) × 2 = 26 — longer than 2 × 6's 16 or 3 × 4's 14, though all three cover the same 12 squares. Same area, different boundary: the thinner the shape, the more edge it spends. That is why a curled-up cat is warm and a stretched one cools.",
          hi: "पतली 1 × 12 पट्टी की सीमा (12 + 1) × 2 = 26 है — 2 × 6 की 16 और 3 × 4 की 14 से लंबी, जबकि तीनों वही 12 ख़ाने घेरते हैं। क्षेत्रफल एक, सीमा अलग: आकृति जितनी पतली, किनारा उतना ज़्यादा ख़र्च। इसीलिए सिमटी बिल्ली गरम रहती है और फैली ठंडी।",
          mr: "बारीक 1 × 12 पट्टीची हद्द (12 + 1) × 2 = 26 — 2 × 6 च्या 16 आणि 3 × 4 च्या 14 हून लांब, वास्तविक तिन्ही त्याच 12 चौकटी व्यापतात. क्षेत्रफळ एक, हद्द वेगळी: आकार जितका बारीक, तितकी कड जास्त खर्च होते. म्हणूनच मुटकुळे केलेले मांजर ऊबदार राहते आणि पसरलेले गारठते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 3 — How Many Squares?",
      name: "How Many Squares?",
      slug: "maths-5-how-many-squares",
      summary: "Area counted square by square — footprints with half squares, chessboards, stamp sheets, and shapes that share an area but not a boundary.",
      position: 3,
      translations: {
        hi: {
          name: "कितने ख़ाने?",
          summary: "ख़ाना-ख़ाना गिना क्षेत्रफल — आधे ख़ानों वाले पदचिह्न, बिसातें, टिकट-शीटें, और वे आकृतियाँ जिनका क्षेत्रफल साझा है पर सीमा नहीं।",
        },
        mr: {
          name: "किती चौकटी?",
          summary: "चौकटीचौकटीने मोजलेले क्षेत्रफळ — अर्ध्या चौकटींचे पाऊलठसे, बुद्धिबळपट, तिकीट-शीट, आणि क्षेत्रफळ वाटून घेणारे पण हद्द न वाटणारे आकार.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Parts and Wholes (fractions of things that matter)            */
/* ------------------------------------------------------------------------- */
function partsAndWholes(): TopicFileOut {
  const rand = rng("maths-5-parts-and-wholes");
  const qs: OutQuestion[] = [];

  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A chocolate bar has 10 pieces. Meena gets half the bar. How many pieces is that?",
          hi: "चॉकलेट में 10 टुकड़े हैं। मीना को आधी चॉकलेट मिलती है। यह कितने टुकड़े हुए?",
          mr: "चॉकलेटमध्ये 10 तुकडे आहेत. मीनाला अर्धी चॉकलेट मिळते. ते किती तुकडे?",
        },
        answer: 5,
        wrong: [2, 10, 4],
        checkExpr: "10/2",
        solution: {
          en: "Half of 10 pieces: 10 ÷ 2 = 5. Answering 2 reads the '2' of half as the answer — the 2 says how many shares, not how big.",
          hi: "10 टुकड़ों का आधा: 10 ÷ 2 = 5। 2 कहना 'आधे' के 2 को उत्तर पढ़ लेना है — वह 2 हिस्सों की गिनती बताता है, हिस्से का आकार नहीं।",
          mr: "10 तुकड्यांचा अर्धा: 10 ÷ 2 = 5. 2 म्हणणे म्हणजे 'अर्ध्या'तला 2 उत्तर म्हणून वाचणे — तो 2 वाटे किती ते सांगतो, वाटा केवढा ते नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is one third of 12 laddoos?",
          hi: "12 लड्डुओं का एक-तिहाई कितना है?",
          mr: "12 लाडवांचा एक-तृतीयांश किती?",
        },
        answer: 4,
        wrong: [3, 6, 9],
        checkExpr: "12/3",
        solution: {
          en: "Three equal shares of 12: 12 ÷ 3 = 4 each. 6 is the half; 9 is what remains after taking a third, not the third itself.",
          hi: "12 के तीन बराबर हिस्से: 12 ÷ 3 = 4-4। 6 आधा है; 9 तिहाई निकालने के बाद बचा हुआ है, ख़ुद तिहाई नहीं।",
          mr: "12 चे तीन सारखे वाटे: 12 ÷ 3 = 4-4. 6 हा अर्धा; 9 म्हणजे तृतीयांश काढल्यावर उरलेले, स्वतः तृतीयांश नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Half of a dozen bananas is how many?",
          hi: "दर्जन भर केलों का आधा कितना होता है?",
          mr: "डझनभर केळ्यांचा अर्धा किती?",
        },
        answer: 6,
        wrong: [12, 3, 8],
        checkExpr: "12/2",
        solution: {
          en: "A dozen is 12, and half of it is 12 ÷ 2 = 6. 3 quarters the dozen — the word asked was half.",
          hi: "दर्जन यानी 12, उसका आधा 12 ÷ 2 = 6। 3 दर्जन की चौथाई है — पूछा आधा था।",
          mr: "डझन म्हणजे 12, त्याचा अर्धा 12 ÷ 2 = 6. 3 हा डझनाचा पाव — विचारले अर्धा होते.",
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
          en: "What is three quarters of 20 pencils?",
          hi: "20 पेंसिलों का तीन-चौथाई कितना है?",
          mr: "20 पेन्सिलींचा तीन-चतुर्थांश किती?",
        },
        answer: 15,
        wrong: [5, 10, 16],
        checkExpr: "20*3/4",
        solution: {
          en: "A quarter of 20 is 5, so three quarters are 5 × 3 = 15. 5 stops at one quarter — the question asked for three of them.",
          hi: "20 की चौथाई 5, तो तीन चौथाई 5 × 3 = 15। 5 एक चौथाई पर रुक जाता है — पूछा तीन का था।",
          mr: "20 चा पाव 5, म्हणून तीन पाव 5 × 3 = 15. 5 एका पावावर थांबते — विचारले तिघांचे होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "One fifth of ₹100 goes to the class fund. How much is that?",
          hi: "₹100 का पाँचवाँ हिस्सा कक्षा-कोष में जाता है। वह कितना है?",
          mr: "₹100 चा पाचवा हिस्सा वर्ग-निधीत जातो. तो किती?",
        },
        answer: 20,
        wrong: [5, 25, 50],
        checkExpr: "100/5",
        fmt: rupees,
        solution: {
          en: "Five equal shares of ₹100: 100 ÷ 5 = ₹20. ₹25 cuts quarters; a fifth is the smaller slice of a wider split.",
          hi: "₹100 के पाँच बराबर हिस्से: 100 ÷ 5 = ₹20। ₹25 चौथाई काटता है; पाँचवाँ हिस्सा ज़्यादा टुकड़ों वाले बँटवारे की छोटी फाँक है।",
          mr: "₹100 चे पाच सारखे वाटे: 100 ÷ 5 = ₹20. ₹25 पाव कापते; पाचवा हिस्सा ही जास्त वाट्यांच्या वाटणीतली लहान फोड.",
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
          en: "What is two fifths of 25 marbles?",
          hi: "25 कंचों का दो-पाँचवाँ हिस्सा कितना है?",
          mr: "25 गोट्यांचे दोन-पंचमांश किती?",
        },
        answer: 10,
        wrong: [5, 15, 20],
        checkExpr: "25*2/5",
        solution: {
          en: "One fifth of 25 is 5, and two fifths are 5 × 2 = 10. 15 takes three fifths; count the fifths the question actually asked for.",
          hi: "25 का पाँचवाँ हिस्सा 5, और दो-पाँचवाँ 5 × 2 = 10। 15 तीन हिस्से ले लेता है; उतने ही हिस्से गिनिए जितने सवाल ने माँगे।",
          mr: "25 चा पंचमांश 5, आणि दोन-पंचमांश 5 × 2 = 10. 15 तीन हिस्से घेते; प्रश्नाने मागितले तितकेच हिस्से मोजा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "From a 16 cm paper strip, Sana cuts off one quarter. How long is the piece she cut?",
          hi: "16 सेमी की काग़ज़-पट्टी से सना चौथाई काटती है। कटा टुकड़ा कितना लंबा है?",
          mr: "16 सेमीच्या कागद-पट्टीतून सना पाव कापते. कापलेला तुकडा किती लांब?",
        },
        answer: 4,
        wrong: [12, 8, 2],
        checkExpr: "16/4",
        fmt: cm,
        solution: {
          en: "A quarter of 16: 16 ÷ 4 = 4 cm. 12 is the strip LEFT BEHIND — the scissors' question and the leftover's question are different.",
          hi: "16 की चौथाई: 16 ÷ 4 = 4 सेमी। 12 पीछे बची पट्टी है — क़ैंची का सवाल और बचत का सवाल अलग-अलग हैं।",
          mr: "16 चा पाव: 16 ÷ 4 = 4 सेमी. 12 ही मागे उरलेली पट्टी — कात्रीचा प्रश्न आणि उरल्याचा प्रश्न वेगवेगळे.",
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
          en: "Half of a secret number is 9. What is the number?",
          hi: "एक गुप्त संख्या का आधा 9 है। वह संख्या क्या है?",
          mr: "एका गुप्त संख्येचा अर्धा 9 आहे. ती संख्या कोणती?",
        },
        answer: 18,
        wrong: [4, 9, 27],
        checkExpr: "9*2",
        solution: {
          en: "If half is 9, the whole is 9 × 2 = 18. Halving 9 to get 4½ walks the wrong way — the question gives the half and asks for the whole.",
          hi: "आधा 9 है तो पूरा 9 × 2 = 18। 9 को आधा करना उलटी दिशा है — सवाल आधा देकर पूरा पूछता है।",
          mr: "अर्धा 9 तर पूर्ण 9 × 2 = 18. 9 ला अर्धे करणे उलटी वाट — प्रश्न अर्धा देऊन पूर्ण विचारतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A class has 30 children and one third are girls. How many BOYS are there?",
          hi: "कक्षा में 30 बच्चे हैं और एक-तिहाई लड़कियाँ हैं। लड़के कितने हैं?",
          mr: "वर्गात 30 मुले आहेत आणि एक-तृतीयांश मुली आहेत. मुलगे किती?",
        },
        answer: 20,
        wrong: [10, 15, 27],
        checkExpr: "30-30/3",
        solution: {
          en: "Girls: 30 ÷ 3 = 10, so boys are 30 − 10 = 20. Answering 10 counts the girls and stops — read which group the question wants.",
          hi: "लड़कियाँ: 30 ÷ 3 = 10, तो लड़के 30 − 10 = 20। 10 लड़कियाँ गिनकर रुक जाता है — पढ़िए कि सवाल किस समूह को माँगता है।",
          mr: "मुली: 30 ÷ 3 = 10, म्हणून मुलगे 30 − 10 = 20. 10 मुली मोजून थांबते — प्रश्न कोणता गट मागतो ते वाचा.",
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
          en: "What is half of a half of 80?",
          hi: "80 के आधे का आधा कितना है?",
          mr: "80 च्या अर्ध्याचा अर्धा किती?",
        },
        answer: 20,
        wrong: [40, 10, 60],
        checkExpr: "80/2/2",
        solution: {
          en: "Half of 80 is 40; half again is 20 — a quarter of the start, because halving twice quarters. 40 stops after one halving; 10 halves a third time.",
          hi: "80 का आधा 40; फिर आधा 20 — शुरुआत की चौथाई, क्योंकि दो बार आधा करना चौथाई करना है। 40 एक आधे पर रुकता है; 10 तीसरी बार आधा कर देता है।",
          mr: "80 चा अर्धा 40; पुन्हा अर्धा 20 — सुरुवातीचा पाव, कारण दोनदा अर्धे करणे म्हणजे पाव करणे. 40 एका अर्ध्यावर थांबते; 10 तिसऱ्यांदा अर्धे करते.",
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
          en: "Grandmother divides her 24 gold coins: half to mother, a third to uncle, and the rest to the temple. How many coins reach the temple?",
          hi: "दादी अपने 24 सोने के सिक्के बाँटती हैं: आधे माँ को, तिहाई चाचा को, बाक़ी मंदिर को। मंदिर तक कितने सिक्के पहुँचते हैं?",
          mr: "आजी आपली 24 सोन्याची नाणी वाटते: अर्धी आईला, तृतीयांश काकांना, उरलेली देवळाला. देवळात किती नाणी पोहोचतात?",
        },
        answer: 4,
        wrong: [8, 12, 6],
        checkExpr: "24-24/2-24/3",
        solution: {
          en: "Mother: 24 ÷ 2 = 12. Uncle: 24 ÷ 3 = 8. Together 20, so the temple gets 24 − 20 = 4 coins. Both fractions cut the SAME whole of 24 — taking the third from what remained after mother is a different will altogether.",
          hi: "माँ: 24 ÷ 2 = 12। चाचा: 24 ÷ 3 = 8। मिलाकर 20, तो मंदिर को 24 − 20 = 4 सिक्के। दोनों भिन्न उसी पूरे 24 में से कटते हैं — माँ के बाद बचे में से तिहाई निकालना बिलकुल दूसरी वसीयत होती।",
          mr: "आई: 24 ÷ 2 = 12. काका: 24 ÷ 3 = 8. मिळून 20, म्हणून देवळाला 24 − 20 = 4 नाणी. दोन्ही अपूर्णांक त्याच पूर्ण 24 मधून कापले जातात — आईनंतर उरलेल्यातून तृतीयांश काढणे हे अगदी वेगळे मृत्युपत्र ठरले असते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 4 — Parts and Wholes",
      name: "Parts and Wholes",
      slug: "maths-5-parts-and-wholes",
      summary: "Halves, thirds, quarters and fifths of real things — shares that must cut the same whole, and wholes rebuilt from their halves.",
      position: 4,
      translations: {
        hi: {
          name: "हिस्से और पूरा",
          summary: "असली चीज़ों के आधे, तिहाई, चौथाई और पाँचवें हिस्से — हिस्से जो एक ही पूरे से कटें, और आधों से फिर जुड़ते पूरे।",
        },
        mr: {
          name: "हिस्से आणि पूर्ण",
          summary: "खऱ्या वस्तूंचे अर्धे, तृतीयांश, पाव आणि पंचमांश — एकाच पूर्णातून कापले जाणारे वाटे, आणि अर्ध्यांतून पुन्हा जुळणारे पूर्ण.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Be My Multiple, I'll Be Your Factor                           */
/* ------------------------------------------------------------------------- */
function multiplesAndFactors(): TopicFileOut {
  const rand = rng("maths-5-be-my-multiple");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Which of these numbers is a multiple of 7?",
          hi: "इनमें से कौन-सी संख्या 7 का गुणज (मल्टीपल) है?",
          mr: "यांपैकी कोणती संख्या 7 चा पट (गुणज) आहे?",
        },
        answer: 21,
        wrong: [27, 17, 37],
        checkExpr: "7*3",
        solution: {
          en: "21 = 7 × 3, so 21 sits in the seven-times table. 27, 17 and 37 all END in seven — but wearing a 7 is not the same as being built of sevens.",
          hi: "21 = 7 × 3, तो 21 सात के पहाड़े में बैठता है। 27, 17 और 37 सब सात पर ख़त्म होते हैं — पर 7 ओढ़ना और सातों से बना होना एक बात नहीं।",
          mr: "21 = 7 × 3, म्हणून 21 साताच्या पाढ्यात बसतो. 27, 17 आणि 37 सारे सातावर संपतात — पण 7 पांघरणे आणि सातांनी बनणे एक नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the 4th multiple of 5?",
          hi: "5 का चौथा गुणज कौन-सा है?",
          mr: "5 चा चौथा पट कोणता?",
        },
        answer: 20,
        wrong: [15, 25, 9],
        checkExpr: "5*4",
        solution: {
          en: "Count the table: 5, 10, 15, 20 — the 4th is 5 × 4 = 20. 15 stops a step early; 9 adds instead of multiplying.",
          hi: "पहाड़ा गिनिए: 5, 10, 15, 20 — चौथा है 5 × 4 = 20। 15 एक सीढ़ी पहले रुकता है; 9 गुणा की जगह जोड़ देता है।",
          mr: "पाढा मोजा: 5, 10, 15, 20 — चौथा म्हणजे 5 × 4 = 20. 15 एक पायरी आधी थांबते; 9 गुणण्याऐवजी मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Every number's FIRST multiple is the number itself. What is the first multiple of 9?",
          hi: "हर संख्या का पहला गुणज वह स्वयं होती है। 9 का पहला गुणज क्या है?",
          mr: "प्रत्येक संख्येचा पहिला पट ती स्वतःच असते. 9 चा पहिला पट काय?",
        },
        answer: 9,
        wrong: [18, 1, 90],
        checkExpr: "9*1",
        solution: {
          en: "9 × 1 = 9 — the table begins at the number itself. 18 is the second step; 1 is a factor of 9, standing on the other side of the friendship.",
          hi: "9 × 1 = 9 — पहाड़ा संख्या से ही शुरू होता है। 18 दूसरी सीढ़ी है; 1 तो 9 का गुणनखंड है, दोस्ती के दूसरे छोर पर खड़ा।",
          mr: "9 × 1 = 9 — पाढा संख्येपासूनच सुरू होतो. 18 ही दुसरी पायरी; 1 हा 9 चा अवयव, मैत्रीच्या दुसऱ्या टोकाला उभा.",
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
          en: "How many factors does 6 have in all?",
          hi: "6 के कुल कितने गुणनखंड हैं?",
          mr: "6 चे एकूण किती अवयव आहेत?",
        },
        answer: 4,
        wrong: [2, 3, 6],
        solution: {
          en: "The factors of 6 are 1, 2, 3 and 6 — four of them, in the pairs 1 × 6 and 2 × 3. Forgetting 1 and the number itself is how factor-counts come up short.",
          hi: "6 के गुणनखंड हैं 1, 2, 3 और 6 — चार, जोड़ों 1 × 6 और 2 × 3 में। 1 और स्वयं संख्या को भूलना ही गिनती घटा देता है।",
          mr: "6 चे अवयव 1, 2, 3 आणि 6 — चार, 1 × 6 आणि 2 × 3 या जोड्यांत. 1 आणि स्वतः संख्या विसरणे यानेच मोजणी कमी भरते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "From 0, a frog hops in 2s and a squirrel in 3s. On which FIRST number do both land together?",
          hi: "0 से मेंढक 2-2 की और गिलहरी 3-3 की छलाँग भरती है। दोनों पहली बार किस संख्या पर साथ उतरते हैं?",
          mr: "0 पासून बेडूक 2-2 च्या आणि खार 3-3 च्या उड्या मारते. दोघे पहिल्यांदा कोणत्या संख्येवर एकत्र उतरतात?",
        },
        answer: 6,
        wrong: [5, 12, 3],
        checkExpr: "2*3",
        solution: {
          en: "The frog lands on 2, 4, 6…; the squirrel on 3, 6… — the first shared landing is 6, the first common multiple of 2 and 3. 12 is a meeting too, but their SECOND.",
          hi: "मेंढक 2, 4, 6… पर उतरता है; गिलहरी 3, 6… पर — पहली साझी ज़मीन 6 है, 2 और 3 का पहला समापवर्त्य। 12 भी मुलाक़ात है, पर दूसरी।",
          mr: "बेडूक 2, 4, 6… वर उतरतो; खार 3, 6… वर — पहिली सामायिक जागा 6, 2 आणि 3 चा पहिला सामाईक पट. 12 हीही भेट आहे, पण दुसरी.",
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
          en: "What is the SMALLEST number that is a multiple of both 4 and 6?",
          hi: "वह सबसे छोटी संख्या कौन-सी है जो 4 और 6 दोनों का गुणज हो?",
          mr: "4 आणि 6 दोघांचा पट असणारी सर्वांत लहान संख्या कोणती?",
        },
        answer: 12,
        wrong: [24, 2, 10],
        checkExpr: "4*3",
        solution: {
          en: "Fours: 4, 8, 12…; sixes: 6, 12… — they first agree at 12. 24 is a common multiple too, but not the smallest; 2 is a common FACTOR, the other end of the story.",
          hi: "चार: 4, 8, 12…; छह: 6, 12… — पहली सहमति 12 पर। 24 भी समापवर्त्य है, पर सबसे छोटा नहीं; 2 समापवर्तक है — कहानी का दूसरा सिरा।",
          mr: "चार: 4, 8, 12…; सहा: 6, 12… — पहिली सहमती 12 वर. 24 हाही सामाईक पट, पण सर्वांत लहान नव्हे; 2 हा सामाईक अवयव — गोष्टीचे दुसरे टोक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "To test whether 51 is a multiple of 3, add its digits. What do the digits of 51 add to?",
          hi: "51 के 3 का गुणज होने की जाँच के लिए उसके अंक जोड़िए। 51 के अंकों का योग क्या है?",
          mr: "51 हा 3 चा पट आहे का हे तपासायला त्याचे अंक मिळवा. 51 च्या अंकांची बेरीज किती?",
        },
        answer: 6,
        wrong: [51, 4, 15],
        checkExpr: "5+1",
        solution: {
          en: "5 + 1 = 6, and 6 IS a multiple of 3 — so 51 = 3 × 17 is too, though it looks so prime. The digit-sum test catches what the eye misses.",
          hi: "5 + 1 = 6, और 6 तीन का गुणज है — तो 51 = 3 × 17 भी है, भले देखने में कैसा भी अभाज्य लगे। अंक-योग की जाँच वह पकड़ती है जो आँख से छूट जाता है।",
          mr: "5 + 1 = 6, आणि 6 हा तीनचा पट आहे — म्हणून 51 = 3 × 17 हाही आहे, दिसायला कितीही मूळ वाटला तरी. अंक-बेरजेची चाचणी डोळ्याला सुटते ते पकडते.",
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
          en: "What is the BIGGEST number that divides both 36 and 24 exactly?",
          hi: "वह सबसे बड़ी संख्या कौन-सी है जो 36 और 24 दोनों को पूरा-पूरा बाँट दे?",
          mr: "36 आणि 24 दोघांना नि:शेष भाग जाणारी सर्वांत मोठी संख्या कोणती?",
        },
        answer: 12,
        wrong: [6, 24, 4],
        checkExpr: "36/3",
        solution: {
          en: "36 = 12 × 3 and 24 = 12 × 2 — 12 divides both, and nothing bigger does. 6 divides both too, but the question asked for the biggest such friend.",
          hi: "36 = 12 × 3 और 24 = 12 × 2 — 12 दोनों को बाँटता है, और उससे बड़ा कोई नहीं। 6 भी दोनों को बाँटता है, पर पूछा सबसे बड़ा साथी था।",
          mr: "36 = 12 × 3 आणि 24 = 12 × 2 — 12 दोघांना भागतो, आणि त्याहून मोठा कोणी नाही. 6 ही दोघांना भागतो, पण विचारले सर्वांत मोठा मित्र होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Bangles come in boxes of 12 and also in boxes of 18. What is the smallest number of bangles that fills EITHER kind of box exactly, with none left over?",
          hi: "चूड़ियाँ 12-12 के और 18-18 के डिब्बों में आती हैं। वह सबसे छोटी गिनती कौन-सी है जो दोनों में से किसी भी तरह के डिब्बे ठीक-ठीक भर दे, कुछ बचे नहीं?",
          mr: "बांगड्या 12-12 च्या आणि 18-18 च्याही खोक्यांत येतात. दोन्हींपैकी कोणत्याही प्रकारची खोकी नेमकी भरणारी, काही न उरणारी सर्वांत लहान संख्या कोणती?",
        },
        answer: 36,
        wrong: [30, 216, 6],
        checkExpr: "12*3",
        solution: {
          en: "Twelves: 12, 24, 36…; eighteens: 18, 36… — 36 is their first meeting: 3 boxes of 12 or 2 boxes of 18. 216 multiplies 12 × 18, a common multiple but a wasteful one; 6 is their common factor, the opposite question.",
          hi: "बारह: 12, 24, 36…; अठारह: 18, 36… — पहली मुलाक़ात 36 पर: 12 के 3 डिब्बे या 18 के 2। 216 यानी 12 × 18 भी समापवर्त्य है, पर फ़िज़ूल बड़ा; 6 समापवर्तक है — उलटा सवाल।",
          mr: "बारा: 12, 24, 36…; अठरा: 18, 36… — पहिली भेट 36 वर: 12 ची 3 खोकी वा 18 ची 2. 216 म्हणजे 12 × 18 हाही सामाईक पट, पण उधळ्या; 6 हा सामाईक अवयव — उलटा प्रश्न.",
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
          en: "Three temple bells ring every 6, 8 and 12 minutes. They have just rung together. After how many minutes will all three ring together again?",
          hi: "मंदिर की तीन घंटियाँ हर 6, 8 और 12 मिनट पर बजती हैं। अभी-अभी तीनों साथ बजी हैं। कितने मिनट बाद तीनों फिर साथ बजेंगी?",
          mr: "देवळाच्या तीन घंटा दर 6, 8 आणि 12 मिनिटांनी वाजतात. आत्ताच तिन्ही एकत्र वाजल्या. किती मिनिटांनी तिन्ही पुन्हा एकत्र वाजतील?",
        },
        answer: 24,
        wrong: [12, 48, 26],
        checkExpr: "8*3",
        solution: {
          en: "Sixes: 6, 12, 18, 24…; eights: 8, 16, 24…; twelves: 12, 24… — the first minute in all three lists is 24. 12 satisfies the 6-bell and 12-bell but leaves the 8-bell silent mid-count.",
          hi: "छह: 6, 12, 18, 24…; आठ: 8, 16, 24…; बारह: 12, 24… — तीनों सूचियों का पहला साझा मिनट 24 है। 12 पर 6 और 12 वाली मान जाती हैं, पर 8 वाली गिनती के बीच चुप खड़ी है।",
          mr: "सहा: 6, 12, 18, 24…; आठ: 8, 16, 24…; बारा: 12, 24… — तिन्ही याद्यांतले पहिले सामाईक मिनिट 24. 12 वर 6 आणि 12 वाल्या तयार, पण 8 वाली मोजणीच्या मध्येच गप्प उभी.",
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
          en: "A basket of mangoes, counted 2 at a time, leaves 1 over; counted 3 at a time, it also leaves 1 over. What is the SMALLEST such number of mangoes (more than 1)?",
          hi: "आमों की टोकरी 2-2 करके गिनने पर 1 बचता है; 3-3 करके गिनने पर भी 1 बचता है। ऐसे आमों की सबसे छोटी गिनती (1 से ज़्यादा) क्या है?",
          mr: "आंब्यांची टोपली 2-2 ने मोजली की 1 उरतो; 3-3 ने मोजली तरी 1 उरतो. अशा आंब्यांची सर्वांत लहान संख्या (1 हून जास्त) किती?",
        },
        answer: 7,
        wrong: [5, 6, 13],
        checkExpr: "2*3+1",
        solution: {
          en: "One less than the answer must divide by BOTH 2 and 3 — the smallest such is 6, so the basket holds 6 + 1 = 7: three 2s and one over, two 3s and one over. 5 works for the 2-count but not the 3-count; 13 works for both but is the second answer, not the smallest.",
          hi: "उत्तर से एक कम को 2 और 3 दोनों से बँटना होगा — ऐसा सबसे छोटा 6 है, तो टोकरी में 6 + 1 = 7: तीन जोड़े और एक ऊपर, दो तिकड़ी और एक ऊपर। 5 दो की गिनती में खरा है, तीन की में नहीं; 13 दोनों में खरा है, पर दूसरा उत्तर है, सबसे छोटा नहीं।",
          mr: "उत्तराहून एक कमी संख्येला 2 आणि 3 दोन्हींनी भागले पाहिजे — अशी सर्वांत लहान 6, म्हणून टोपलीत 6 + 1 = 7: तीन जोड्या आणि एक वर, दोन त्रिकुटे आणि एक वर. 5 दोनच्या मोजणीत खरा, तीनच्या मध्ये नाही; 13 दोन्हींत खरा, पण तो दुसरा — सर्वांत लहान नव्हे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 6 — Be My Multiple, I'll Be Your Factor",
      name: "Be My Multiple, I'll Be Your Factor",
      slug: "maths-5-be-my-multiple",
      summary: "Multiples, factors and their meeting points — hopping frogs, agreeing bells, bangles that fill two boxes, and the mango basket's remainder riddle.",
      position: 6,
      translations: {
        hi: {
          name: "मेरा गुणज बनो, मैं तुम्हारा गुणनखंड",
          summary: "गुणज, गुणनखंड और उनके मिलन-बिंदु — कूदते मेंढक, सहमत घंटियाँ, दो डिब्बे भरतीं चूड़ियाँ, और आम की टोकरी की शेष-पहेली।",
        },
        mr: {
          name: "माझा पट हो, मी तुझा अवयव",
          summary: "पट, अवयव आणि त्यांचे भेटीचे बिंदू — उड्या मारणारे बेडूक, सहमत घंटा, दोन खोकी भरणाऱ्या बांगड्या, आणि आंब्याच्या टोपलीचे बाकीचे कोडे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Tenths and Hundredths (decimals in money and measure)        */
/* ------------------------------------------------------------------------- */
function tenthsAndHundredths(): TopicFileOut {
  const rand = rng("maths-5-tenths-and-hundredths");
  const qs: OutQuestion[] = [];

  const paise = (n: number) => ({ en: `${n} paise`, hi: `${n} पैसे`, mr: `${n} पैसे` });
  const mm = (n: number) => ({ en: `${n} mm`, hi: `${n} मिमी`, mr: `${n} मिमी` });
  const mlF = (n: number) => ({ en: `${n} mL`, hi: `${n} मिली`, mr: `${n} मिली` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Half a rupee, written ₹0.50 — how many paise is that?",
          hi: "आधा रुपया, यानी ₹0.50 — यह कितने पैसे हुए?",
          mr: "अर्धा रुपया, म्हणजे ₹0.50 — ते किती पैसे?",
        },
        answer: 50,
        wrong: [5, 100, 25],
        checkExpr: "100/2",
        fmt: paise,
        solution: {
          en: "A rupee is 100 paise, so half is 100 ÷ 2 = 50 paise — the .50 after the point says exactly that. 5 reads the '5' and drops its place.",
          hi: "रुपया यानी 100 पैसे, तो आधा 100 ÷ 2 = 50 पैसे — बिंदी के बाद का .50 यही कहता है। 5 केवल '5' पढ़कर उसका स्थान गिरा देता है।",
          mr: "रुपया म्हणजे 100 पैसे, म्हणून अर्धा 100 ÷ 2 = 50 पैसे — टिंबानंतरचे .50 नेमके हेच सांगते. 5 फक्त '5' वाचून त्याची जागा पाडते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is one tenth of 100?",
          hi: "100 का दसवाँ हिस्सा कितना है?",
          mr: "100 चा दशांश किती?",
        },
        answer: 10,
        wrong: [1, 90, 1000],
        checkExpr: "100/10",
        solution: {
          en: "Ten equal shares of 100: 100 ÷ 10 = 10. 1 is a hundredth; a tenth is ten times that. 1000 multiplies instead of sharing.",
          hi: "100 के दस बराबर हिस्से: 100 ÷ 10 = 10। 1 सौवाँ हिस्सा है; दसवाँ उसका दस गुना। 1000 बाँटने की जगह गुणा कर देता है।",
          mr: "100 चे दहा सारखे वाटे: 100 ÷ 10 = 10. 1 हा शतांश; दशांश त्याच्या दसपट. 1000 वाटण्याऐवजी गुणते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A pencil measures 2.5 cm more than Rehan's finger. In millimetres, how much more is that?",
          hi: "पेंसिल रेहान की उँगली से 2.5 सेमी ज़्यादा लंबी है। मिलीमीटर में यह कितना ज़्यादा है?",
          mr: "पेन्सिल रेहानच्या बोटाहून 2.5 सेमी जास्त लांब आहे. मिलिमीटरमध्ये ते किती जास्त?",
        },
        answer: 25,
        wrong: [250, 2, 5],
        checkExpr: "50/2",
        fmt: mm,
        solution: {
          en: "Each cm is 10 mm, so 2.5 cm is 2 × 10 + 5 = 25 mm — the .5 is five tenths of a centimetre, which is 5 whole millimetres. 250 slides the point one place too far.",
          hi: "हर सेमी 10 मिमी, तो 2.5 सेमी = 2 × 10 + 5 = 25 मिमी — .5 यानी सेंटीमीटर के पाँच दसवें हिस्से, जो पूरे 5 मिलीमीटर हैं। 250 बिंदी को एक घर आगे सरका देता है।",
          mr: "प्रत्येक सेमी 10 मिमी, म्हणून 2.5 सेमी = 2 × 10 + 5 = 25 मिमी — .5 म्हणजे सेंटिमीटरचे पाच दशांश, जे पूर्ण 5 मिलिमीटर. 250 टिंब एक घर पुढे सरकवते.",
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
          en: "A ticket costs ₹0.75 — three quarters of a rupee. How many paise is that?",
          hi: "टिकट ₹0.75 का है — रुपये का तीन-चौथाई। यह कितने पैसे हुए?",
          mr: "तिकीट ₹0.75 चे — रुपयाचा पाऊण भाग. ते किती पैसे?",
        },
        answer: 75,
        wrong: [25, 705, 7],
        checkExpr: "3*25",
        fmt: paise,
        solution: {
          en: "Three quarters of 100 paise: 25 × 3 = 75 paise. 25 gives one quarter; 705 misreads the decimal's two places as rupees-and-a-place.",
          hi: "100 पैसों का तीन-चौथाई: 25 × 3 = 75 पैसे। 25 एक चौथाई है; 705 दशमलव के दो स्थानों को ग़लत पढ़ता है।",
          mr: "100 पैशांचा पाऊण: 25 × 3 = 75 पैसे. 25 म्हणजे एक पाव; 705 दशांशाची दोन स्थाने चुकीची वाचते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is one hundredth of 500?",
          hi: "500 का सौवाँ हिस्सा कितना है?",
          mr: "500 चा शतांश किती?",
        },
        answer: 5,
        wrong: [50, 100, 5000],
        checkExpr: "500/100",
        solution: {
          en: "A hundred equal shares: 500 ÷ 100 = 5. 50 finds the tenth — the hundredth is one staircase further down.",
          hi: "सौ बराबर हिस्से: 500 ÷ 100 = 5। 50 दसवाँ हिस्सा है — सौवाँ उससे एक सीढ़ी और नीचे।",
          mr: "शंभर सारखे वाटे: 500 ÷ 100 = 5. 50 हा दशांश — शतांश त्याहून एक पायरी खाली.",
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
          en: "How many paise make ₹2.37?",
          hi: "₹2.37 में कितने पैसे होते हैं?",
          mr: "₹2.37 मध्ये किती पैसे असतात?",
        },
        answer: 237,
        wrong: [239, 2037, 37],
        checkExpr: "2*100+37",
        fmt: paise,
        solution: {
          en: "Two rupees are 200 paise, plus the 37 after the point: 200 + 37 = 237 paise. 37 forgets the rupees; 2037 pushes the 37 two places too far out.",
          hi: "दो रुपये यानी 200 पैसे, ऊपर से बिंदी के बाद के 37: 200 + 37 = 237 पैसे। 37 रुपये भूल जाता है; 2037 सैंतीस को दो घर बाहर धकेल देता है।",
          mr: "दोन रुपये म्हणजे 200 पैसे, शिवाय टिंबानंतरचे 37: 200 + 37 = 237 पैसे. 37 रुपये विसरते; 2037 सदतीसला दोन घरे बाहेर ढकलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A 1.5 litre bottle of water holds how many millilitres?",
          hi: "1.5 लीटर की पानी की बोतल में कितने मिलीलीटर आते हैं?",
          mr: "1.5 लिटरच्या पाण्याच्या बाटलीत किती मिलिलिटर मावतात?",
        },
        answer: 1500,
        wrong: [150, 105, 15000],
        checkExpr: "3*500",
        fmt: mlF,
        solution: {
          en: "1.5 L is a litre and a half: 1000 + 500 = 1500 mL — three half-litres. 150 slides the point one place; 105 reads .5 as 5 mL.",
          hi: "1.5 लीटर यानी डेढ़ लीटर: 1000 + 500 = 1500 मिली — तीन आधे लीटर। 150 बिंदी एक घर सरकाता है; 105 में .5 को 5 मिली पढ़ लिया गया।",
          mr: "1.5 लिटर म्हणजे दीड लिटर: 1000 + 500 = 1500 मिली — तीन अर्धे लिटर. 150 टिंब एक घर सरकवते; 105 मध्ये .5 ला 5 मिली वाचले गेले.",
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
          en: "A fever chart reads 36.5° in the morning and 38.5° at night. By how many degrees did the temperature rise?",
          hi: "बुख़ार-पत्र पर सुबह 36.5° और रात 38.5° लिखा है। तापमान कितने डिग्री चढ़ा?",
          mr: "ताप-पत्रकावर सकाळी 36.5° आणि रात्री 38.5° लिहिले आहे. तापमान किती अंशांनी चढले?",
        },
        answer: 2,
        wrong: [1, 3, 20],
        checkExpr: "38-36",
        solution: {
          en: "The .5s match and cancel, leaving 38 − 36 = 2 degrees of rise. 20 subtracts as if the decimals were whole numbers 385 and 365 — the point holds each digit to its place.",
          hi: "दोनों .5 बराबर हैं और कट जाते हैं, बचा 38 − 36 = 2 डिग्री का चढ़ाव। 20 ऐसे घटाता है मानो 385 और 365 हों — बिंदी हर अंक को उसकी जगह थामे रखती है।",
          mr: "दोन्ही .5 सारखे असून कापले जातात, उरली 38 − 36 = 2 अंशांची चढण. 20 जणू 385 आणि 365 असल्यासारखे वजा करते — टिंब प्रत्येक अंकाला त्याच्या जागी धरून ठेवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Ten tenths are gathered together. How many WHOLES do they make?",
          hi: "दस दसवें हिस्से इकट्ठे किए गए। वे कितने पूरे बनाते हैं?",
          mr: "दहा दशांश एकत्र केले. ते किती पूर्ण होतात?",
        },
        answer: 1,
        wrong: [10, 100, 2],
        checkExpr: "10/10",
        solution: {
          en: "Ten tenths rebuild exactly one whole: 10 ÷ 10 = 1 — the way ten 10-paise coins make one rupee. 10 counts the pieces, not the wholes they form.",
          hi: "दस दसवें हिस्से ठीक एक पूरा बनाते हैं: 10 ÷ 10 = 1 — जैसे दस दस-पैसे के सिक्के एक रुपया। 10 टुकड़े गिनता है, उनसे बना पूरा नहीं।",
          mr: "दहा दशांश नेमके एक पूर्ण करतात: 10 ÷ 10 = 1 — जशी दहा दहा-पैशांची नाणी एक रुपया. 10 तुकडे मोजते, त्यांतून झालेले पूर्ण नव्हे.",
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
          en: "Add 0.9 and 0.1 — but answer in TENTHS: how many tenths do they make together?",
          hi: "0.9 और 0.1 जोड़िए — पर उत्तर दसवें हिस्सों में दीजिए: दोनों मिलकर कितने दसवें हिस्से बनते हैं?",
          mr: "0.9 आणि 0.1 मिळवा — पण उत्तर दशांशांत द्या: दोघे मिळून किती दशांश होतात?",
        },
        answer: 10,
        wrong: [1, 91, 9],
        checkExpr: "9+1",
        solution: {
          en: "0.9 is 9 tenths and 0.1 is 1 tenth: 9 + 1 = 10 tenths — which is exactly one whole. Both 10-tenths and 1-whole are right; the question asked in tenths. 91 glues the digits instead of adding the tenths.",
          hi: "0.9 यानी 9 दसवें और 0.1 यानी 1 दसवाँ: 9 + 1 = 10 दसवें — जो ठीक एक पूरा है। 10 दसवें और 1 पूरा दोनों सही हैं; सवाल दसवें हिस्सों में पूछा था। 91 दसवें जोड़ने की जगह अंक चिपका देता है।",
          mr: "0.9 म्हणजे 9 दशांश आणि 0.1 म्हणजे 1 दशांश: 9 + 1 = 10 दशांश — जे नेमके एक पूर्ण. 10 दशांश आणि 1 पूर्ण दोन्ही बरोबर; प्रश्न दशांशांत विचारला होता. 91 दशांश मिळवण्याऐवजी अंक चिकटवते.",
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
          en: "A sprinter ran the race in 12.4 seconds last year and 11.9 seconds this year. By how many TENTHS of a second did she improve?",
          hi: "धाविका ने पिछले साल दौड़ 12.4 सेकंड में पूरी की और इस साल 11.9 सेकंड में। वह सेकंड के कितने दसवें हिस्सों से सुधरी?",
          mr: "धावपटूने गेल्या वर्षी शर्यत 12.4 सेकंदांत पूर्ण केली आणि यंदा 11.9 सेकंदांत. ती सेकंदाच्या किती दशांशांनी सुधारली?",
        },
        answer: 5,
        wrong: [15, 4, 50],
        checkExpr: "124-119",
        solution: {
          en: "Turn both into tenths: 12.4 s = 124 tenths, 11.9 s = 119 tenths, and 124 − 119 = 5 tenths — half a second. 15 subtracts 12.4 − 11.9 as '12 minus 11, 4 minus 9 borrowed wrongly'; whole-and-decimal subtraction is safest marched through one unit.",
          hi: "दोनों को दसवें हिस्सों में बदलिए: 12.4 से = 124 दसवें, 11.9 से = 119 दसवें, और 124 − 119 = 5 दसवें — आधा सेकंड। 15 में घटाव का हासिल उलटा चला; पूर्ण-और-दशमलव का घटाव एक ही इकाई में उतारकर सबसे सुरक्षित रहता है।",
          mr: "दोन्ही दशांशांत बदला: 12.4 से = 124 दशांश, 11.9 से = 119 दशांश, आणि 124 − 119 = 5 दशांश — अर्धा सेकंद. 15 मध्ये वजाबाकीचा हातचा उलटा गेला; पूर्ण-आणि-दशांशाची वजाबाकी एकाच एककात उतरवून सर्वांत सुरक्षित.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 10 — Tenths and Hundredths",
      name: "Tenths and Hundredths",
      slug: "maths-5-tenths-and-hundredths",
      summary: "The decimal point in money, lengths and stopwatch times — tenths that rebuild wholes, and points that must not slide.",
      position: 10,
      translations: {
        hi: {
          name: "दसवाँ और सौवाँ",
          summary: "पैसों, लंबाइयों और स्टॉपवॉच के समय में दशमलव बिंदी — पूरे बनाते दसवें हिस्से, और बिंदियाँ जो सरकनी नहीं चाहिए।",
        },
        mr: {
          name: "दशांश आणि शतांश",
          summary: "पैसे, लांबी आणि स्टॉपवॉचच्या वेळांतले दशांश टिंब — पूर्ण उभारणारे दशांश, आणि न सरकू द्यायची टिंबे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Does it Look the Same? (mirror lines and turns)               */
/* ------------------------------------------------------------------------- */
function doesItLookTheSame(): TopicFileOut {
  const rand = rng("maths-5-does-it-look-the-same");
  const qs: OutQuestion[] = [];

  const deg = (n: number) => ({ en: `${n}°`, hi: `${n}°`, mr: `${n}°` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many mirror (symmetry) lines does a square have?",
          hi: "वर्ग की कितनी दर्पण-रेखाएँ (सममिति रेखाएँ) होती हैं?",
          mr: "चौरसाला किती आरसा-रेषा (सममिती रेषा) असतात?",
        },
        answer: 4,
        wrong: [2, 1, 8],
        solution: {
          en: "A square folds onto itself 4 ways — two through the middles of opposite sides, two corner to corner. 2 counts only the middle folds and forgets the diagonals.",
          hi: "वर्ग 4 तरह से अपने ऊपर तह होता है — दो आमने-सामने की भुजाओं के बीच से, दो कोने-से-कोने। 2 केवल बीच वाली तहें गिनता है और विकर्ण भूल जाता है।",
          mr: "चौरस 4 प्रकारे स्वतःवर दुमडतो — दोन समोरासमोरच्या बाजूंच्या मधून, दोन कोपऱ्यातून कोपऱ्यात. 2 फक्त मधल्या घड्या मोजते आणि कर्ण विसरते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A butterfly's two wings match each other across how many mirror lines?",
          hi: "तितली के दोनों पंख कितनी दर्पण-रेखाओं के आर-पार एक-दूसरे से मिलते हैं?",
          mr: "फुलपाखराचे दोन पंख किती आरसा-रेषांच्या दोन्ही बाजूंनी एकमेकांशी जुळतात?",
        },
        answer: 1,
        wrong: [2, 4, 0],
        solution: {
          en: "Exactly 1 — the line down the butterfly's body. Left wing mirrors right, but top does not mirror bottom, so no second line exists.",
          hi: "ठीक 1 — तितली के शरीर से होकर जाती रेखा। बायाँ पंख दाएँ का दर्पण है, पर ऊपर नीचे का नहीं — इसलिए दूसरी रेखा है ही नहीं।",
          mr: "नेमकी 1 — फुलपाखराच्या शरीरातून जाणारी रेषा. डावा पंख उजव्याचा आरसा, पण वर खालचा नाही — म्हणून दुसरी रेषा नाहीच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many mirror lines does a rectangle (not a square) have?",
          hi: "आयत (जो वर्ग नहीं है) की कितनी दर्पण-रेखाएँ होती हैं?",
          mr: "आयताला (जो चौरस नाही) किती आरसा-रेषा असतात?",
        },
        answer: 2,
        wrong: [4, 1, 0],
        solution: {
          en: "Two — through the middles of its sides. Folding corner to corner does NOT work: the diagonal fold leaves the corners sticking out, which is what separates a rectangle from a square.",
          hi: "दो — भुजाओं के बीच से। कोने-से-कोने की तह नहीं चलती: विकर्ण पर मोड़ने से कोने बाहर झाँकते रह जाते हैं — यही आयत को वर्ग से अलग करता है।",
          mr: "दोन — बाजूंच्या मधून. कोपऱ्यातून कोपऱ्यात दुमडणे चालत नाही: कर्णावर दुमडल्यास कोपरे बाहेर डोकावत राहतात — हेच आयताला चौरसाहून वेगळे करते.",
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
          en: "How many mirror lines does the letter H have?",
          hi: "अक्षर H की कितनी दर्पण-रेखाएँ हैं?",
          mr: "H या अक्षराला किती आरसा-रेषा आहेत?",
        },
        answer: 2,
        wrong: [1, 0, 4],
        solution: {
          en: "H folds left-onto-right AND top-onto-bottom — 2 lines. Most letters manage one at best; H's two straight legs and level bar earn it both.",
          hi: "H बाएँ-से-दाएँ और ऊपर-से-नीचे दोनों तह होता है — 2 रेखाएँ। ज़्यादातर अक्षर बमुश्किल एक पाते हैं; H की दो सीधी टाँगें और बीच की पट्टी उसे दोनों दिला देती हैं।",
          mr: "H डावे-उजवे आणि वर-खाली दोन्ही दुमडतो — 2 रेषा. बहुतेक अक्षरांना जेमतेम एक मिळते; H चे दोन सरळ पाय आणि मधली आडवी दांडी त्याला दोन्ही मिळवून देतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A half turn spins a shape through how many degrees?",
          hi: "आधा घुमाव आकृति को कितने अंश घुमाता है?",
          mr: "अर्धे वळण आकाराला किती अंश फिरवते?",
        },
        answer: 180,
        wrong: [90, 360, 45],
        checkExpr: "360/2",
        fmt: deg,
        solution: {
          en: "Half of the full 360° turn: 360 ÷ 2 = 180° — upside down. 90 is the quarter turn; 360 brings the shape all the way home.",
          hi: "पूरे 360° घुमाव का आधा: 360 ÷ 2 = 180° — उलटा। 90 चौथाई घुमाव है; 360 आकृति को घुमाकर वहीं ले आता है।",
          mr: "पूर्ण 360° वळणाचा अर्धा: 360 ÷ 2 = 180° — उलटे. 90 हे पाव वळण; 360 आकाराला फिरवून जागेवर आणते.",
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
          en: "An equilateral triangle has all three sides equal. How many mirror lines does it have?",
          hi: "समबाहु त्रिभुज की तीनों भुजाएँ बराबर होती हैं। उसकी कितनी दर्पण-रेखाएँ हैं?",
          mr: "समभुज त्रिकोणाच्या तिन्ही बाजू सारख्या असतात. त्याला किती आरसा-रेषा आहेत?",
        },
        answer: 3,
        wrong: [1, 2, 6],
        solution: {
          en: "One line through each corner to the middle of the opposite side — 3 in all, one per corner, because every corner is the same as every other.",
          hi: "हर कोने से सामने वाली भुजा के बीच तक एक रेखा — कुल 3, हर कोने की एक, क्योंकि हर कोना बाक़ी जैसा ही है।",
          mr: "प्रत्येक कोपऱ्यातून समोरच्या बाजूच्या मध्यापर्यंत एक रेषा — एकूण 3, दर कोपऱ्याला एक, कारण प्रत्येक कोपरा इतरांसारखाच आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Turn the letter S through a half turn. It looks the same! Through how many degrees was it turned?",
          hi: "अक्षर S को आधा घुमाइए। वह वैसा ही दिखता है! उसे कितने अंश घुमाया गया?",
          mr: "S हे अक्षर अर्धे फिरवा. ते तसेच दिसते! ते किती अंश फिरवले गेले?",
        },
        answer: 180,
        wrong: [90, 270, 60],
        checkExpr: "90*2",
        fmt: deg,
        solution: {
          en: "The half turn is 180° — S has TURNING symmetry though it has no mirror line at all. Turn it 90° and it lies on its side, plainly changed.",
          hi: "आधा घुमाव 180° है — S में घुमाव की सममिति है, जबकि दर्पण-रेखा एक भी नहीं। 90° घुमाइए तो वह करवट लिए, साफ़ बदला दिखता है।",
          mr: "अर्धे वळण म्हणजे 180° — S ला वळणाची सममिती आहे, आरसा-रेषा मात्र एकही नाही. 90° फिरवा तर ते आडवे पडलेले, स्पष्ट बदललेले दिसते.",
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
          en: "A windmill pattern with 4 equal sails looks exactly the same after each quarter turn. How many times does it look the same during one full turn?",
          hi: "4 बराबर पंखों वाला पवनचक्की-पैटर्न हर चौथाई घुमाव पर बिलकुल वैसा ही दिखता है। पूरे एक घुमाव में वह कितनी बार वैसा दिखेगा?",
          mr: "4 सारख्या पात्यांचा पवनचक्की-नमुना प्रत्येक पाव वळणावर अगदी तसाच दिसतो. पूर्ण एका वळणात तो किती वेळा तसा दिसेल?",
        },
        answer: 4,
        wrong: [2, 8, 1],
        checkExpr: "360/90",
        solution: {
          en: "Every 90° each sail lands exactly where its neighbour stood: 360 ÷ 90 = 4 matching positions per full turn — one for each sail.",
          hi: "हर 90° पर हर पंख ठीक वहीं पहुँचता है जहाँ उसका पड़ोसी था: 360 ÷ 90 = 4 मेल खाती स्थितियाँ प्रति पूरा घुमाव — हर पंख की एक।",
          mr: "दर 90° ला प्रत्येक पाते नेमके शेजाऱ्याच्या जागी पोहोचते: 360 ÷ 90 = 4 जुळणाऱ्या स्थिती प्रति पूर्ण वळण — दर पात्याला एक.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A rangoli looks the same after every 120° of turning. How many such matching positions fit in a full 360°?",
          hi: "एक रंगोली हर 120° के घुमाव पर वैसी ही दिखती है। पूरे 360° में ऐसी कितनी मेल खाती स्थितियाँ समाएँगी?",
          mr: "एक रांगोळी दर 120° च्या वळणावर तशीच दिसते. पूर्ण 360° मध्ये अशा किती जुळणाऱ्या स्थिती मावतील?",
        },
        answer: 3,
        wrong: [4, 6, 2],
        checkExpr: "360/120",
        solution: {
          en: "360 ÷ 120 = 3 positions — the mark of a three-armed design. The turning angle always divides the full circle into the count of matches.",
          hi: "360 ÷ 120 = 3 स्थितियाँ — तीन भुजाओं वाले डिज़ाइन की निशानी। घुमाव का कोण पूरे वृत्त को हमेशा मेलों की गिनती में बाँटता है।",
          mr: "360 ÷ 120 = 3 स्थिती — तीन भुजांच्या नक्षीची खूण. वळणाचा कोन पूर्ण वर्तुळाला नेहमी जुळण्यांच्या संख्येत विभागतो.",
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
          en: "Write the digit 6 on paper and give the paper a half turn. Which digit do you see now?",
          hi: "काग़ज़ पर अंक 6 लिखिए और काग़ज़ को आधा घुमाइए। अब कौन-सा अंक दिखता है?",
          mr: "कागदावर 6 हा अंक लिहा आणि कागद अर्धा फिरवा. आता कोणता अंक दिसतो?",
        },
        answer: 9,
        wrong: [6, 8, 0],
        solution: {
          en: "Upside down, 6 becomes 9 — its half-turn twin. 8 and 0 are shapes that stay THEMSELVES after a half turn; 6 changes into another digit, which is rarer and more fun.",
          hi: "उलटा होकर 6 बन जाता है 9 — उसका आधे-घुमाव का जुड़वाँ। 8 और 0 आधे घुमाव पर ख़ुद ही रहते हैं; 6 दूसरे अंक में बदलता है — जो दुर्लभ भी है और मज़ेदार भी।",
          mr: "उलटे झाल्यावर 6 चा होतो 9 — त्याचा अर्ध-वळणाचा जुळा. 8 आणि 0 अर्ध्या वळणावर स्वतःच राहतात; 6 दुसऱ्या अंकात बदलतो — जे दुर्मीळही आणि गमतीचेही.",
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
          en: "Fold a square paper in half, then in half again. Snip off the one corner where ALL the folds meet, and unfold. How many holes are in the paper?",
          hi: "वर्गाकार काग़ज़ को आधा मोड़िए, फिर से आधा। जिस एक कोने पर सारी तहें मिलती हैं उसे कतरिए, और खोलिए। काग़ज़ में कितने छेद होंगे?",
          mr: "चौरस कागद अर्धा दुमडा, मग पुन्हा अर्धा. जिथे साऱ्या घड्या मिळतात तो एक कोपरा कातरा, आणि उलगडा. कागदात किती भोके असतील?",
        },
        answer: 1,
        wrong: [4, 2, 8],
        solution: {
          en: "The corner where the folds meet IS the paper's centre, folded up small. One snip there opens into exactly 1 hole in the middle — with 4 matching quarter-edges, because the two folds mirrored the cut twice. Snipping any OTHER corner gives 4 separate holes; only the folds' meeting corner hides the centre.",
          hi: "जहाँ तहें मिलती हैं वह कोना काग़ज़ का केंद्र ही है, छोटा मुड़ा हुआ। वहाँ एक कतरन बीच में ठीक 1 छेद खोलती है — चार मेल खाते चौथाई-किनारों वाला, क्योंकि दो तहों ने कट को दो बार दर्पण किया। कोई और कोना कतरने पर 4 अलग छेद बनते हैं; केंद्र केवल तहों के मिलन वाले कोने में छिपा है।",
          mr: "घड्या मिळतात तो कोपरा म्हणजे कागदाचे केंद्रच, लहान दुमडलेले. तिथली एक कातर मध्यभागी नेमके 1 भोक उघडते — चार जुळणाऱ्या पाव-कडांचे, कारण दोन घड्यांनी कापाला दोनदा आरशात दाखवले. दुसरा कोणताही कोपरा कातरल्यास 4 वेगळी भोके होतात; केंद्र फक्त घड्यांच्या भेटीच्या कोपऱ्यात लपले आहे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 5 — Does it Look the Same?",
      name: "Does it Look the Same?",
      slug: "maths-5-does-it-look-the-same",
      summary: "Mirror lines and turning symmetry — folds that match, letters and digits under half turns, and the snipped corner that was secretly the centre.",
      position: 5,
      translations: {
        hi: {
          name: "क्या यह वैसा ही दिखता है?",
          summary: "दर्पण-रेखाएँ और घुमाव की सममिति — मिलती तहें, आधे घुमाव में अक्षर और अंक, और वह कतरा कोना जो चुपके से केंद्र था।",
        },
        mr: {
          name: "हे तसेच दिसते का?",
          summary: "आरसा-रेषा आणि वळणाची सममिती — जुळणाऱ्या घड्या, अर्ध्या वळणातली अक्षरे आणि अंक, आणि गुपचूप केंद्र असलेला कातरलेला कोपरा.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Can You See the Pattern? (number patterns with reasons)       */
/* ------------------------------------------------------------------------- */
function canYouSeeThePattern(): TopicFileOut {
  const rand = rng("maths-5-can-you-see-the-pattern");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The doubling pattern goes 1, 2, 4, 8, … What comes next?",
          hi: "दुगना होता पैटर्न है 1, 2, 4, 8, … आगे क्या आएगा?",
          mr: "दुप्पट होणारा आकृतिबंध आहे 1, 2, 4, 8, … पुढे काय येईल?",
        },
        answer: 16,
        wrong: [12, 10, 24],
        checkExpr: "8*2",
        solution: {
          en: "Each number doubles the last: 8 × 2 = 16. 12 adds 4 — the OLD gap; a doubling pattern's gaps double along with it.",
          hi: "हर संख्या पिछली की दुगनी: 8 × 2 = 16। 12 चार जोड़ता है — पुराना फ़ासला; दुगने पैटर्न के फ़ासले उसी के साथ दुगने होते हैं।",
          mr: "प्रत्येक संख्या मागचीच्या दुप्पट: 8 × 2 = 16. 12 चार मिळवते — जुने अंतर; दुप्पट आकृतिबंधाची अंतरे त्याच्यासोबत दुप्पट होतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The pattern climbs 25, 50, 75, … What comes next?",
          hi: "पैटर्न चढ़ता है 25, 50, 75, … आगे क्या?",
          mr: "आकृतिबंध चढतो 25, 50, 75, … पुढे काय?",
        },
        answer: 100,
        wrong: [85, 125, 90],
        checkExpr: "75+25",
        solution: {
          en: "The step is 25: 75 + 25 = 100 — the pattern of quarter-rupees closing into a whole. 125 skips ahead one step.",
          hi: "क़दम 25 का है: 75 + 25 = 100 — चवन्नियों का पूरा रुपया बनता पैटर्न। 125 एक क़दम आगे कूद जाता है।",
          mr: "पाऊल 25 चे: 75 + 25 = 100 — पावल्यांचा पूर्ण रुपया होणारा आकृतिबंध. 125 एक पाऊल पुढे उडी मारते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The pattern goes 11, 22, 33, … What comes next?",
          hi: "पैटर्न है 11, 22, 33, … आगे क्या?",
          mr: "आकृतिबंध आहे 11, 22, 33, … पुढे काय?",
        },
        answer: 44,
        wrong: [34, 43, 55],
        checkExpr: "33+11",
        solution: {
          en: "Each step adds 11, twinning the digits: 33 + 11 = 44. 43 breaks the twins; 55 leaps a step.",
          hi: "हर क़दम 11 जोड़ता है, अंकों के जुड़वाँ बनते हैं: 33 + 11 = 44। 43 जुड़वाँ तोड़ देता है; 55 एक क़दम लाँघता है।",
          mr: "प्रत्येक पाऊल 11 वाढवते, अंकांचे जुळे होतात: 33 + 11 = 44. 43 जुळे मोडते; 55 एक पाऊल ओलांडते.",
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
          en: "In a magic square every row adds to 15. One row shows 2, 7, ▢. What hides in the box?",
          hi: "जादुई वर्ग में हर पंक्ति का योग 15 है। एक पंक्ति में 2, 7, ▢ है। डिब्बे में क्या छिपा है?",
          mr: "जादूच्या चौरसात प्रत्येक ओळीची बेरीज 15. एका ओळीत 2, 7, ▢ आहे. चौकटीत काय लपले आहे?",
        },
        answer: 6,
        wrong: [8, 5, 13],
        checkExpr: "15-2-7",
        solution: {
          en: "The row must reach 15: 15 − 2 − 7 = 6, and indeed 2 + 7 + 6 = 15. 13 subtracts only the 2 — both known numbers have already taken their share.",
          hi: "पंक्ति को 15 चाहिए: 15 − 2 − 7 = 6, और सचमुच 2 + 7 + 6 = 15। 13 केवल 2 घटाता है — दोनों ज्ञात संख्याएँ अपना हिस्सा ले चुकी हैं।",
          mr: "ओळीला 15 हवेत: 15 − 2 − 7 = 6, आणि खरेच 2 + 7 + 6 = 15. 13 फक्त 2 वजा करते — दोन्ही ठाऊक संख्यांनी आपला वाटा घेतला आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The triangle numbers grow 1, 3, 6, 10, … What comes next?",
          hi: "त्रिभुज संख्याएँ बढ़ती हैं 1, 3, 6, 10, … आगे क्या?",
          mr: "त्रिकोणी संख्या वाढतात 1, 3, 6, 10, … पुढे काय?",
        },
        answer: 15,
        wrong: [12, 14, 20],
        checkExpr: "10+5",
        solution: {
          en: "The gaps grow by one each time: +2, +3, +4, so next is +5: 10 + 5 = 15 — each number a triangle of dots one row taller. 14 adds 4 again, reusing the old gap.",
          hi: "फ़ासले हर बार एक बढ़ते हैं: +2, +3, +4, तो अगला +5: 10 + 5 = 15 — हर संख्या एक पंक्ति ऊँचा बिंदुओं का त्रिभुज। 14 फिर 4 जोड़कर पुराना फ़ासला दोहराता है।",
          mr: "अंतरे दर वेळी एकाने वाढतात: +2, +3, +4, म्हणून पुढचे +5: 10 + 5 = 15 — प्रत्येक संख्या एका ओळीने उंच ठिपक्यांचा त्रिकोण. 14 पुन्हा 4 मिळवून जुने अंतर वापरते.",
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
          en: "The elevens make pretty products. What is 11 × 11?",
          hi: "ग्यारह के गुणनफल सुंदर बनते हैं। 11 × 11 कितना है?",
          mr: "अकराचे गुणाकार सुंदर होतात. 11 × 11 किती?",
        },
        answer: 121,
        wrong: [111, 122, 1111],
        checkExpr: "11*11",
        solution: {
          en: "11 × 11 = 121 — it reads the same forwards and backwards. The pattern continues: 111 × 111 = 12321, climbing up and down like a staircase.",
          hi: "11 × 11 = 121 — सीधा-उलटा एक-सा पढ़ा जाता है। पैटर्न आगे चलता है: 111 × 111 = 12321 — सीढ़ी-सा चढ़ता-उतरता।",
          mr: "11 × 11 = 121 — सरळ-उलटे सारखेच वाचले जाते. आकृतिबंध पुढे चालतो: 111 × 111 = 12321 — जिन्यासारखा चढत-उतरत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Every answer in the nine-times table has digits adding to 9. What is 9 × 6?",
          hi: "नौ के पहाड़े के हर उत्तर के अंकों का योग 9 होता है। 9 × 6 कितना है?",
          mr: "नऊच्या पाढ्यातल्या प्रत्येक उत्तराच्या अंकांची बेरीज 9 येते. 9 × 6 किती?",
        },
        answer: 54,
        wrong: [56, 45, 63],
        checkExpr: "9*6",
        solution: {
          en: "9 × 6 = 54, and 5 + 4 = 9 — the table's secret signature. 45 is 9 × 5, its digit-swapped neighbour; 56 fails the signature test (5 + 6 = 11), which is how you catch it.",
          hi: "9 × 6 = 54, और 5 + 4 = 9 — पहाड़े का गुप्त हस्ताक्षर। 45 यानी 9 × 5, उसका अंक-बदला पड़ोसी; 56 हस्ताक्षर-जाँच में फ़ेल है (5 + 6 = 11) — ऐसे ही वह पकड़ा जाता है।",
          mr: "9 × 6 = 54, आणि 5 + 4 = 9 — पाढ्याची गुप्त सही. 45 म्हणजे 9 × 5, त्याचा अंक-बदललेला शेजारी; 56 सही-तपासणीत नापास (5 + 6 = 11) — असाच तो पकडला जातो.",
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
          en: "A palindrome number reads the same both ways. Which of these is a palindrome?",
          hi: "पैलिंड्रोम संख्या दोनों ओर से एक-सी पढ़ी जाती है। इनमें से पैलिंड्रोम कौन-सी है?",
          mr: "पॅलिंड्रोम संख्या दोन्हीकडून सारखीच वाचली जाते. यांपैकी पॅलिंड्रोम कोणती?",
        },
        answer: 121,
        wrong: [123, 112, 211],
        solution: {
          en: "121 backwards is still 121. 112 backwards is 211 — those two are each other's reflections, and neither is its own.",
          hi: "121 उलटा भी 121 है। 112 उलटा 211 है — वे दोनों एक-दूसरे के प्रतिबिंब हैं, अपना-अपना कोई नहीं।",
          mr: "121 उलटेही 121 च. 112 उलटे 211 — ते दोघे एकमेकांची प्रतिबिंबे, स्वतःचे कोणीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Add all the numbers from 1 to 9. What do they make?",
          hi: "1 से 9 तक की सारी संख्याएँ जोड़िए। योग क्या बनता है?",
          mr: "1 ते 9 पर्यंतच्या साऱ्या संख्या मिळवा. बेरीज किती होते?",
        },
        answer: 45,
        wrong: [44, 50, 36],
        checkExpr: "9*10/2",
        solution: {
          en: "Pair the ends: 1+9, 2+8, 3+7, 4+6 — four tens — and 5 alone in the middle: 40 + 5 = 45. The pairing trick beats adding one by one, and never drops a number on the way.",
          hi: "सिरों के जोड़े बनाइए: 1+9, 2+8, 3+7, 4+6 — चार दहाइयाँ — और बीच में अकेला 5: 40 + 5 = 45। जोड़ों की तरकीब एक-एक जोड़ने से जीतती है, और रास्ते में कोई संख्या नहीं गिराती।",
          mr: "टोकांच्या जोड्या लावा: 1+9, 2+8, 3+7, 4+6 — चार दशक — आणि मध्ये एकटा 5: 40 + 5 = 45. जोड्यांची युक्ती एकेक मिळवण्यावर मात करते, आणि वाटेत एकही संख्या पाडत नाही.",
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
          en: "The staircase pattern: 1 × 1 = 1, 11 × 11 = 121. What is 111 × 111?",
          hi: "सीढ़ी-पैटर्न: 1 × 1 = 1, 11 × 11 = 121। 111 × 111 कितना है?",
          mr: "जिना-आकृतिबंध: 1 × 1 = 1, 11 × 11 = 121. 111 × 111 किती?",
        },
        answer: 12321,
        wrong: [12345, 11121, 111111],
        checkExpr: "111*111",
        solution: {
          en: "111 × 111 = 12321 — the digits climb 1-2-3 and come back down, a staircase with 3 at the top because three ones were multiplied. The pattern holds up to 111111111², whose peak is 9.",
          hi: "111 × 111 = 12321 — अंक 1-2-3 चढ़ते हैं और उतर आते हैं, चोटी पर 3 — क्योंकि तीन इकाइयाँ गुणी गईं। पैटर्न 111111111² तक निभता है, जिसकी चोटी 9 है।",
          mr: "111 × 111 = 12321 — अंक 1-2-3 चढतात आणि उतरतात, शिखरावर 3 — कारण तीन एकके गुणली गेली. आकृतिबंध 111111111² पर्यंत टिकतो, ज्याचे शिखर 9 आहे.",
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
          en: "On a calendar, nine dates make a 3-by-3 square, and the middle date is 16. Without adding one by one — what do all nine dates sum to?",
          hi: "कैलेंडर पर नौ तारीख़ें 3×3 का वर्ग बनाती हैं, और बीच की तारीख़ 16 है। एक-एक जोड़े बिना — नौों तारीख़ों का योग क्या है?",
          mr: "दिनदर्शिकेवर नऊ तारखा 3×3 चा चौरस करतात, आणि मधली तारीख 16 आहे. एकेक न मिळवता — नऊही तारखांची बेरीज किती?",
        },
        answer: 144,
        wrong: [128, 154, 96],
        checkExpr: "16*9",
        solution: {
          en: "Every date pairs with its opposite across the centre — 9 with 23, 15 with 17 — and each pair averages exactly the middle 16. Nine dates at an average of 16: 16 × 9 = 144. The centre of any calendar square is the whole square's average; that is the pattern worth keeping.",
          hi: "हर तारीख़ केंद्र के आर-पार अपनी जोड़ीदार से मिलती है — 9 के साथ 23, 15 के साथ 17 — और हर जोड़ी का औसत ठीक बीच वाला 16 है। 16 के औसत पर नौ तारीख़ें: 16 × 9 = 144। किसी भी कैलेंडर-वर्ग का केंद्र पूरे वर्ग का औसत है — यही सँभालने लायक़ पैटर्न है।",
          mr: "प्रत्येक तारीख केंद्रापलीकडच्या जोडीदाराशी जुळते — 9 सोबत 23, 15 सोबत 17 — आणि प्रत्येक जोडीची सरासरी नेमकी मधली 16. 16 च्या सरासरीने नऊ तारखा: 16 × 9 = 144. कोणत्याही दिनदर्शिका-चौरसाचे केंद्र म्हणजे सबंध चौरसाची सरासरी — हाच जपण्याजोगा आकृतिबंध.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 7 — Can You See the Pattern?",
      name: "Can You See the Pattern?",
      slug: "maths-5-can-you-see-the-pattern",
      summary: "Patterns with reasons — growing gaps, magic squares, the nines' signature, palindromes, and the calendar square that averages to its centre.",
      position: 7,
      translations: {
        hi: {
          name: "क्या आपको पैटर्न दिखता है?",
          summary: "कारण वाले पैटर्न — बढ़ते फ़ासले, जादुई वर्ग, नौ का हस्ताक्षर, पैलिंड्रोम, और वह कैलेंडर-वर्ग जिसका औसत उसका केंद्र है।",
        },
        mr: {
          name: "तुम्हाला आकृतिबंध दिसतो का?",
          summary: "कारणांसह आकृतिबंध — वाढती अंतरे, जादूचे चौरस, नऊची सही, पॅलिंड्रोम, आणि केंद्रच सरासरी असलेला दिनदर्शिका-चौरस.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Mapping Your Way (scales, routes and distances)               */
/* ------------------------------------------------------------------------- */
function mappingYourWay(): TopicFileOut {
  const rand = rng("maths-5-mapping-your-way");
  const qs: OutQuestion[] = [];

  const m = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });
  const km = (n: number) => ({ en: `${n} km`, hi: `${n} किमी`, mr: `${n} किमी` });
  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A city map's scale says 1 cm = 200 m. A road measures 3 cm on the map. How long is the real road?",
          hi: "शहर के नक़्शे का पैमाना है 1 सेमी = 200 मीटर। एक सड़क नक़्शे पर 3 सेमी है। असली सड़क कितनी लंबी है?",
          mr: "शहराच्या नकाशाचे प्रमाण 1 सेमी = 200 मीटर. एक रस्ता नकाशावर 3 सेमी भरतो. खरा रस्ता किती लांब?",
        },
        answer: 600,
        wrong: [203, 60, 6000],
        checkExpr: "3*200",
        fmt: m,
        solution: {
          en: "Each map-centimetre hides 200 real metres: 3 × 200 = 600 m. 203 adds the scale to the measurement; scales multiply.",
          hi: "नक़्शे का हर सेंटीमीटर 200 असली मीटर छिपाए है: 3 × 200 = 600 मीटर। 203 पैमाने को नाप में जोड़ देता है; पैमाने गुणा करते हैं।",
          mr: "नकाशाचा प्रत्येक सेंटिमीटर 200 खरे मीटर लपवतो: 3 × 200 = 600 मीटर. 203 प्रमाण मापात मिळवते; प्रमाणे गुणतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "On the school-fair map, 1 cm stands for 50 m. The gate to the food stall is 5 cm. How far is the walk really?",
          hi: "स्कूल-मेले के नक़्शे पर 1 सेमी = 50 मीटर। फाटक से खाने के स्टॉल तक 5 सेमी है। असल में कितना चलना होगा?",
          mr: "शाळा-जत्रेच्या नकाशावर 1 सेमी = 50 मीटर. फाटकापासून खाऊच्या स्टॉलपर्यंत 5 सेमी आहे. खरे किती चालावे लागेल?",
        },
        answer: 250,
        wrong: [55, 500, 25],
        checkExpr: "5*50",
        fmt: m,
        solution: {
          en: "5 map-centimetres of 50 m each: 5 × 50 = 250 m. 500 doubles the scale on the way; 55 adds instead of multiplying.",
          hi: "50-50 मीटर के 5 नक़्शा-सेंटीमीटर: 5 × 50 = 250 मीटर। 500 रास्ते में पैमाना दुगना कर देता है; 55 गुणा की जगह जोड़ता है।",
          mr: "50-50 मीटरचे 5 नकाशा-सेंटिमीटर: 5 × 50 = 250 मीटर. 500 वाटेत प्रमाण दुप्पट करते; 55 गुणण्याऐवजी मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The map's grid squares are each 100 m across. The park stretches over 3 whole squares. How wide is the park?",
          hi: "नक़्शे के जाल का हर ख़ाना 100 मीटर का है। पार्क 3 पूरे ख़ानों में फैला है। पार्क कितना चौड़ा है?",
          mr: "नकाशाच्या जाळीची प्रत्येक चौकट 100 मीटरची आहे. बाग 3 पूर्ण चौकटींत पसरली आहे. बाग किती रुंद?",
        },
        answer: 300,
        wrong: [103, 30, 3],
        checkExpr: "100*3",
        fmt: m,
        solution: {
          en: "Three squares of 100 m: 100 × 3 = 300 m. 3 reads the squares and forgets they carry metres.",
          hi: "100-100 मीटर के तीन ख़ाने: 100 × 3 = 300 मीटर। 3 ख़ाने पढ़ता है और भूल जाता है कि वे मीटर ढोते हैं।",
          mr: "100-100 मीटरच्या तीन चौकटी: 100 × 3 = 300 मीटर. 3 चौकटी वाचते आणि त्या मीटर वाहतात हे विसरते.",
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
          en: "The temple is really 800 m from the well. At a scale of 1 cm = 200 m, how far apart do they sit on the map?",
          hi: "मंदिर कुएँ से असल में 800 मीटर दूर है। 1 सेमी = 200 मीटर के पैमाने पर नक़्शे में वे कितनी दूर होंगे?",
          mr: "देऊळ विहिरीपासून खरे 800 मीटर दूर आहे. 1 सेमी = 200 मीटर प्रमाणावर नकाशात ती किती दूर असतील?",
        },
        answer: 4,
        wrong: [8, 2, 400],
        checkExpr: "800/200",
        fmt: cm,
        solution: {
          en: "This time the world shrinks INTO the map: 800 ÷ 200 = 4 cm. 400 multiplies the wrong way and draws a map bigger than the town.",
          hi: "इस बार दुनिया नक़्शे में सिकुड़ती है: 800 ÷ 200 = 4 सेमी। 400 उलटी दिशा में गुणा करके शहर से बड़ा नक़्शा खींच देता है।",
          mr: "या वेळी जग नकाशात आकसते: 800 ÷ 200 = 4 सेमी. 400 उलट्या दिशेने गुणून गावाहून मोठा नकाशा काढते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A wall map is 25 cm wide, drawn at 1 cm = 2 km. How many kilometres of country does it span?",
          hi: "दीवार का नक़्शा 25 सेमी चौड़ा है, पैमाना 1 सेमी = 2 किमी। वह कितने किलोमीटर का इलाक़ा समेटता है?",
          mr: "भिंतीवरचा नकाशा 25 सेमी रुंद आहे, प्रमाण 1 सेमी = 2 किमी. तो किती किलोमीटरचा मुलूख सामावतो?",
        },
        answer: 50,
        wrong: [27, 12, 125],
        checkExpr: "25*2",
        fmt: km,
        solution: {
          en: "25 map-centimetres of 2 km each: 25 × 2 = 50 km on one sheet of paper. 27 adds the scale; 12 halves instead of doubling.",
          hi: "2-2 किमी के 25 नक़्शा-सेंटीमीटर: 25 × 2 = 50 किमी, एक ही काग़ज़ पर। 27 पैमाना जोड़ता है; 12 दुगने की जगह आधा करता है।",
          mr: "2-2 किमीचे 25 नकाशा-सेंटिमीटर: 25 × 2 = 50 किमी, एकाच कागदावर. 27 प्रमाण मिळवते; 12 दुप्पट करण्याऐवजी अर्धे करते.",
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
          en: "To the market you may take the straight road of 900 m, or the lanes — four turnings of 300 m each. How much LONGER are the lanes?",
          hi: "बाज़ार तक 900 मीटर की सीधी सड़क है, या गलियाँ — 300-300 मीटर के चार मोड़। गलियाँ कितनी लंबी ज़्यादा हैं?",
          mr: "बाजारापर्यंत 900 मीटरचा सरळ रस्ता आहे, किंवा गल्ल्या — 300-300 मीटरची चार वळणे. गल्ल्या किती जास्त लांब?",
        },
        answer: 300,
        wrong: [1200, 600, 900],
        checkExpr: "4*300-900",
        fmt: m,
        solution: {
          en: "The lanes total 4 × 300 = 1200 m, and 1200 − 900 = 300 m longer. 1200 is the lanes' own length, not the extra the question asked for.",
          hi: "गलियाँ कुल 4 × 300 = 1200 मीटर, और 1200 − 900 = 300 मीटर ज़्यादा। 1200 गलियों की अपनी लंबाई है, वह अतिरिक्त नहीं जो पूछा गया।",
          mr: "गल्ल्या एकूण 4 × 300 = 1200 मीटर, आणि 1200 − 900 = 300 मीटर जास्त. 1200 ही गल्ल्यांची स्वतःची लांबी, विचारलेले जास्तीचे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A classroom 8 m long is drawn on a plan at 1 cm = 2 m. How long is the classroom in the drawing?",
          hi: "8 मीटर लंबी कक्षा 1 सेमी = 2 मीटर के पैमाने पर नक़्शे में बनाई गई। चित्र में कक्षा कितनी लंबी होगी?",
          mr: "8 मीटर लांब वर्ग 1 सेमी = 2 मीटर प्रमाणावर आराखड्यात काढला. चित्रात वर्ग किती लांब असेल?",
        },
        answer: 4,
        wrong: [16, 2, 6],
        checkExpr: "8/2",
        fmt: cm,
        solution: {
          en: "Every 2 real metres folds into 1 drawn centimetre: 8 ÷ 2 = 4 cm. 16 multiplies outward — that direction is for reading maps, not making them.",
          hi: "हर 2 असली मीटर 1 चित्र-सेंटीमीटर में सिमटते हैं: 8 ÷ 2 = 4 सेमी। 16 बाहर की ओर गुणा करता है — वह दिशा नक़्शा पढ़ने की है, बनाने की नहीं।",
          mr: "प्रत्येक 2 खरे मीटर 1 चित्र-सेंटिमीटरमध्ये मावतात: 8 ÷ 2 = 4 सेमी. 16 बाहेरच्या दिशेने गुणते — ती दिशा नकाशा वाचण्याची, बनवण्याची नव्हे.",
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
          en: "From home Neha walks 400 m north to the post office, then 300 m east to the library. How far has she WALKED in all?",
          hi: "घर से नेहा 400 मीटर उत्तर डाकघर तक चलती है, फिर 300 मीटर पूर्व पुस्तकालय तक। उसने कुल कितना चला?",
          mr: "घरून नेहा 400 मीटर उत्तरेस पोस्ट ऑफिसपर्यंत चालते, मग 300 मीटर पूर्वेस वाचनालयापर्यंत. ती एकूण किती चालली?",
        },
        answer: 700,
        wrong: [100, 500, 1200],
        checkExpr: "400+300",
        fmt: m,
        solution: {
          en: "Feet count every metre stepped: 400 + 300 = 700 m. 500 is the bird's straight-line distance home-to-library — a fine answer to a different question; 100 subtracts the legs.",
          hi: "पैर हर चला मीटर गिनते हैं: 400 + 300 = 700 मीटर। 500 घर-से-पुस्तकालय की चिड़िया वाली सीधी दूरी है — दूसरे सवाल का बढ़िया उत्तर; 100 दोनों हिस्सों को घटा देता है।",
          mr: "पाय चाललेला प्रत्येक मीटर मोजतात: 400 + 300 = 700 मीटर. 500 हे घर-ते-वाचनालय पक्ष्याचे सरळ अंतर — वेगळ्या प्रश्नाचे छान उत्तर; 100 दोन्ही भाग वजा करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A treasure map says: 20 paces east, 20 paces east again, then 10 paces back west. How many paces from the start does the treasure lie?",
          hi: "ख़ज़ाने का नक़्शा कहता है: 20 क़दम पूर्व, फिर 20 क़दम पूर्व, फिर 10 क़दम पश्चिम लौटिए। ख़ज़ाना शुरुआत से कितने क़दम दूर है?",
          mr: "खजिन्याचा नकाशा सांगतो: 20 पावले पूर्वेस, पुन्हा 20 पावले पूर्वेस, मग 10 पावले पश्चिमेस परत. खजिना सुरुवातीपासून किती पावलांवर आहे?",
        },
        answer: 30,
        wrong: [50, 10, 40],
        checkExpr: "20+20-10",
        solution: {
          en: "East gathers 20 + 20 = 40 paces; the westward 10 walks part of it back: 40 − 10 = 30 paces out. 50 adds all three as if every step went the same way — direction decides the sign.",
          hi: "पूर्व में जमा हुए 20 + 20 = 40 क़दम; पश्चिम के 10 उनमें से लौटा देते हैं: 40 − 10 = 30 क़दम दूर। 50 तीनों को एक ही दिशा मानकर जोड़ता है — दिशा ही जोड़-घटाव तय करती है।",
          mr: "पूर्वेस जमली 20 + 20 = 40 पावले; पश्चिमेची 10 त्यांतली परत आणतात: 40 − 10 = 30 पावले दूर. 50 तिन्ही एकाच दिशेची समजून मिळवते — दिशाच बेरीज-वजाबाकी ठरवते.",
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
          en: "The morning round: school to market 600 m, market to temple 900 m, temple back to school 500 m. How long is the whole round?",
          hi: "सुबह का चक्कर: स्कूल से बाज़ार 600 मीटर, बाज़ार से मंदिर 900 मीटर, मंदिर से स्कूल 500 मीटर। पूरा चक्कर कितना लंबा है?",
          mr: "सकाळची फेरी: शाळा ते बाजार 600 मीटर, बाजार ते देऊळ 900 मीटर, देऊळ ते शाळा 500 मीटर. सगळी फेरी किती लांब?",
        },
        answer: 2000,
        wrong: [1500, 2100, 1000],
        checkExpr: "600+900+500",
        fmt: m,
        solution: {
          en: "Add the three legs: 600 + 900 + 500 = 2000 m — a full 2 km before breakfast. 1500 forgets the walk home closes the loop.",
          hi: "तीनों हिस्से जोड़िए: 600 + 900 + 500 = 2000 मीटर — नाश्ते से पहले पूरे 2 किमी। 1500 भूल जाता है कि घर-वापसी ही चक्कर पूरा करती है।",
          mr: "तिन्ही टप्पे मिळवा: 600 + 900 + 500 = 2000 मीटर — न्याहारीआधी पूर्ण 2 किमी. 1500 विसरते की परतीची वाटच फेरी पूर्ण करते.",
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
          en: "Two maps show the same town. Map A's scale is 1 cm = 100 m; Map B's is 1 cm = 200 m. A street runs 8 cm on Map A. How many centimetres does the SAME street run on Map B?",
          hi: "दो नक़्शे एक ही शहर दिखाते हैं। नक़्शा A का पैमाना 1 सेमी = 100 मीटर; नक़्शा B का 1 सेमी = 200 मीटर। एक सड़क नक़्शा A पर 8 सेमी है। वही सड़क नक़्शा B पर कितने सेंटीमीटर होगी?",
          mr: "दोन नकाशे एकच गाव दाखवतात. नकाशा A चे प्रमाण 1 सेमी = 100 मीटर; नकाशा B चे 1 सेमी = 200 मीटर. एक रस्ता नकाशा A वर 8 सेमी आहे. तोच रस्ता नकाशा B वर किती सेंटिमीटर असेल?",
        },
        answer: 4,
        wrong: [16, 8, 2],
        checkExpr: "8*100/200",
        fmt: cm,
        solution: {
          en: "First leave the paper: 8 cm × 100 = 800 real metres. Then enter Map B: 800 ÷ 200 = 4 cm. The street shrank on paper because each of B's centimetres swallows MORE ground — a bigger number in the scale means a smaller drawing, which is the trap 16 falls into.",
          hi: "पहले काग़ज़ से बाहर आइए: 8 सेमी × 100 = 800 असली मीटर। फिर नक़्शा B में जाइए: 800 ÷ 200 = 4 सेमी। सड़क काग़ज़ पर इसलिए सिकुड़ी कि B का हर सेंटीमीटर ज़्यादा ज़मीन निगलता है — पैमाने की बड़ी संख्या यानी छोटा चित्र; 16 इसी फंदे में गिरता है।",
          mr: "आधी कागदाबाहेर या: 8 सेमी × 100 = 800 खरे मीटर. मग नकाशा B मध्ये जा: 800 ÷ 200 = 4 सेमी. रस्ता कागदावर आकसला कारण B चा प्रत्येक सेंटिमीटर जास्त जमीन गिळतो — प्रमाणातली मोठी संख्या म्हणजे लहान चित्र; 16 याच सापळ्यात पडते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 8 — Mapping Your Way",
      name: "Mapping Your Way",
      slug: "maths-5-mapping-your-way",
      summary: "Scales read both ways — maps into metres and metres into maps, routes compared leg by leg, and two maps that disagree about one street.",
      position: 8,
      translations: {
        hi: {
          name: "नक़्शे से राह",
          summary: "दोनों दिशाओं में पढ़े पैमाने — नक़्शे से मीटर और मीटर से नक़्शा, हिस्से-हिस्से मिलाए रास्ते, और एक सड़क पर असहमत दो नक़्शे।",
        },
        mr: {
          name: "नकाशाने वाट",
          summary: "दोन्ही दिशांनी वाचलेली प्रमाणे — नकाशातून मीटर आणि मीटरांतून नकाशा, टप्प्याटप्प्याने ताडलेल्या वाटा, आणि एका रस्त्यावर असहमत दोन नकाशे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Boxes and Sketches (cubes, nets and stacked solids)           */
/* ------------------------------------------------------------------------- */
function boxesAndSketches(): TopicFileOut {
  const rand = rng("maths-5-boxes-and-sketches");
  const qs: OutQuestion[] = [];

  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Run a finger along every straight edge of a cube. How many edges do you count?",
          hi: "घन के हर सीधे किनारे पर उँगली फेरिए। कितने किनारे गिनेंगे?",
          mr: "घनाच्या प्रत्येक सरळ कडेवरून बोट फिरवा. किती कडा मोजाल?",
        },
        answer: 12,
        wrong: [6, 8, 4],
        solution: {
          en: "A cube has 12 edges — 4 around the top, 4 around the bottom, 4 standing upright between them. 6 counts the faces and 8 the corners; edges are the third family.",
          hi: "घन के 12 किनारे हैं — 4 ऊपर घेरे में, 4 नीचे, 4 बीच में खड़े। 6 फलक गिनता है और 8 कोने; किनारे तीसरा परिवार हैं।",
          mr: "घनाला 12 कडा — 4 वर वेढ्यात, 4 खाली, 4 मध्ये उभ्या. 6 पृष्ठे मोजते आणि 8 कोपरे; कडा हे तिसरे कुटुंब.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many corners (vertices) does a cube have?",
          hi: "घन के कितने कोने (शीर्ष) होते हैं?",
          mr: "घनाला किती कोपरे (शिरोबिंदू) असतात?",
        },
        answer: 8,
        wrong: [6, 12, 4],
        checkExpr: "4*2",
        solution: {
          en: "Four corners on the top square, four on the bottom: 4 × 2 = 8. Hold a dice and touch them — thumbs find what counting forgets.",
          hi: "ऊपर के वर्ग के चार कोने, नीचे के चार: 4 × 2 = 8। पासा थामकर छूइए — जो गिनती भूलती है, अँगूठे पा लेते हैं।",
          mr: "वरच्या चौरसाचे चार कोपरे, खालचे चार: 4 × 2 = 8. फासा धरून शिवून पाहा — मोजणी विसरते ते अंगठे शोधतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A flat net that folds up into a closed cube must have how many squares?",
          hi: "बंद घन में मुड़ने वाले चपटे जाल (नेट) में कितने वर्ग होने चाहिए?",
          mr: "बंद घनात दुमडणाऱ्या सपाट जाळ्यात (नेट) किती चौरस हवेत?",
        },
        answer: 6,
        wrong: [4, 5, 8],
        solution: {
          en: "One square per face, and a cube has 6 faces — so 6 squares, arranged so no two land on the same face when folded. 5 leaves a face open to the rain.",
          hi: "हर फलक का एक वर्ग, और घन के 6 फलक — तो 6 वर्ग, ऐसे सजे कि मुड़ने पर दो एक ही फलक पर न गिरें। 5 एक फलक बारिश के लिए खुला छोड़ देता है।",
          mr: "दर पृष्ठाला एक चौरस, आणि घनाला 6 पृष्ठे — म्हणून 6 चौरस, असे मांडलेले की दुमडल्यावर दोन एकाच पृष्ठावर पडू नयेत. 5 एक पृष्ठ पावसासाठी उघडे ठेवते.",
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
          en: "An OPEN box — no lid — is to be folded from a net. How many squares does its net need?",
          hi: "बिना ढक्कन का खुला डिब्बा जाल से मोड़ना है। उसके जाल में कितने वर्ग चाहिए?",
          mr: "झाकण नसलेले उघडे खोके जाळ्यातून दुमडायचे आहे. त्याच्या जाळ्यात किती चौरस हवेत?",
        },
        answer: 5,
        wrong: [6, 4, 8],
        checkExpr: "6-1",
        solution: {
          en: "A closed cube takes 6; leave off the lid and 6 − 1 = 5 squares remain — a floor and four walls. 4 forgets the floor and builds a tube.",
          hi: "बंद घन को 6 चाहिए; ढक्कन हटाइए तो 6 − 1 = 5 वर्ग — एक फ़र्श और चार दीवारें। 4 फ़र्श भूलकर नली बना देता है।",
          mr: "बंद घनाला 6 लागतात; झाकण वगळा की 6 − 1 = 5 चौरस — एक तळ आणि चार भिंती. 4 तळ विसरून नळी बांधते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Each face of a cube is to be painted a different colour, no colour repeated. How many colours are needed?",
          hi: "घन के हर फलक को अलग रंग से रँगना है, कोई रंग दोहराया नहीं जाएगा। कितने रंग चाहिए?",
          mr: "घनाचे प्रत्येक पृष्ठ वेगळ्या रंगाने रंगवायचे आहे, कोणताही रंग पुन्हा नाही. किती रंग हवेत?",
        },
        answer: 6,
        wrong: [4, 8, 12],
        checkExpr: "3*2",
        solution: {
          en: "One colour per face and the faces come in 3 opposite pairs: 3 × 2 = 6 colours. 8 paints the corners, 12 the edges — the brush works on faces.",
          hi: "हर फलक एक रंग, और फलक 3 आमने-सामने जोड़ों में हैं: 3 × 2 = 6 रंग। 8 कोनों को रँगता है, 12 किनारों को — ब्रश फलकों पर चलता है।",
          mr: "दर पृष्ठाला एक रंग, आणि पृष्ठे 3 समोरासमोर जोड्यांत: 3 × 2 = 6 रंग. 8 कोपरे रंगवते, 12 कडा — ब्रश पृष्ठांवर चालतो.",
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
          en: "A cube's every edge is 5 cm. If you laid all its edges end to end, how long a line would they make?",
          hi: "घन का हर किनारा 5 सेमी का है। सारे किनारे सिरे-से-सिरा बिछा दें तो कितनी लंबी रेखा बनेगी?",
          mr: "घनाची प्रत्येक कड 5 सेमीची आहे. साऱ्या कडा टोकाला टोक जोडून मांडल्या तर किती लांब रेषा होईल?",
        },
        answer: 60,
        wrong: [30, 20, 25],
        checkExpr: "12*5",
        fmt: cm,
        solution: {
          en: "Twelve edges of 5 cm: 12 × 5 = 60 cm. 20 takes only the four edges of one square face — a cube carries three such squares' worth of edges.",
          hi: "5-5 सेमी के बारह किनारे: 12 × 5 = 60 सेमी। 20 केवल एक वर्ग-फलक के चार किनारे लेता है — घन ऐसे तीन वर्गों जितने किनारे ढोता है।",
          mr: "5-5 सेमीच्या बारा कडा: 12 × 5 = 60 सेमी. 20 फक्त एका चौरस-पृष्ठाच्या चार कडा घेते — घन अशा तीन चौरसांइतक्या कडा वाहतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "From one sheet of card Vandana cuts 2 nets, and each net folds into 1 box. How many boxes will 5 sheets give her?",
          hi: "एक गत्ते से वंदना 2 जाल काटती है, और हर जाल 1 डिब्बा बनता है। 5 गत्तों से कितने डिब्बे मिलेंगे?",
          mr: "एका पुठ्ठ्यातून वंदना 2 जाळी कापते, आणि प्रत्येक जाळे 1 खोके होते. 5 पुठ्ठ्यांतून किती खोकी मिळतील?",
        },
        answer: 10,
        wrong: [7, 5, 25],
        checkExpr: "2*5",
        solution: {
          en: "Two boxes per sheet, five sheets: 2 × 5 = 10 boxes. 7 adds sheets to boxes; 25 squares the sheets.",
          hi: "हर गत्ते से दो डिब्बे, पाँच गत्ते: 2 × 5 = 10 डिब्बे। 7 गत्तों को डिब्बों में जोड़ता है; 25 गत्तों का वर्ग कर देता है।",
          mr: "दर पुठ्ठ्यामागे दोन खोकी, पाच पुठ्ठे: 2 × 5 = 10 खोकी. 7 पुठ्ठे खोक्यांत मिळवते; 25 पुठ्ठ्यांचा वर्ग करते.",
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
          en: "Sugar cubes are stacked into a block: a floor of 3 by 3 cubes, built 2 layers high. How many cubes are in the block?",
          hi: "चीनी के घन ब्लॉक में जमे हैं: 3 × 3 घनों का फ़र्श, 2 परत ऊँचा। ब्लॉक में कितने घन हैं?",
          mr: "साखरेचे घन ठोकळ्यात रचले आहेत: 3 × 3 घनांचा तळ, 2 थर उंच. ठोकळ्यात किती घन आहेत?",
        },
        answer: 18,
        wrong: [9, 12, 27],
        checkExpr: "3*3*2",
        solution: {
          en: "One layer holds 3 × 3 = 9 cubes, and 2 layers hold 9 × 2 = 18. 9 sees only the top layer the eye looks down on; 27 builds a third layer that is not there.",
          hi: "एक परत में 3 × 3 = 9 घन, और 2 परतों में 9 × 2 = 18। 9 केवल वह ऊपरी परत देखता है जिस पर नज़र पड़ती है; 27 वह तीसरी परत जोड़ देता है जो है ही नहीं।",
          mr: "एका थरात 3 × 3 = 9 घन, आणि 2 थरांत 9 × 2 = 18. 9 फक्त नजरेस पडणारा वरचा थर पाहते; 27 नसलेला तिसरा थर बांधते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "On a dice, opposite faces add to 7. The faces pair as 1-and-6, 2-and-5, and 3-and-which?",
          hi: "पासे पर आमने-सामने के फलक 7 जोड़ते हैं। जोड़े हैं 1-और-6, 2-और-5, और 3-और-कौन?",
          mr: "फाशावर समोरासमोरची पृष्ठे 7 जोडतात. जोड्या आहेत 1-आणि-6, 2-आणि-5, आणि 3-आणि-कोण?",
        },
        answer: 4,
        wrong: [3, 5, 6],
        checkExpr: "7-3",
        solution: {
          en: "7 − 3 = 4 — the last pair is 3-and-4. The three pairs 1·6, 2·5, 3·4 use each number once and each pair totals 7: a full dice checked in one breath.",
          hi: "7 − 3 = 4 — आख़िरी जोड़ा 3-और-4। तीनों जोड़े 1·6, 2·5, 3·4 हर अंक एक बार लेते हैं और हर जोड़ा 7 बनाता है: एक साँस में जाँचा पूरा पासा।",
          mr: "7 − 3 = 4 — शेवटची जोडी 3-आणि-4. तिन्ही जोड्या 1·6, 2·5, 3·4 प्रत्येक अंक एकदाच घेतात आणि प्रत्येक जोडी 7 करते: एका दमात तपासलेला अख्खा फासा.",
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
          en: "12 cubes are glued into one solid block, 2 cubes high and 2 cubes wide. How many cubes LONG is it?",
          hi: "12 घन एक ठोस ब्लॉक में जुड़े हैं — 2 घन ऊँचा, 2 घन चौड़ा। वह कितने घन लंबा है?",
          mr: "12 घन एका भरीव ठोकळ्यात जोडले आहेत — 2 घन उंच, 2 घन रुंद. तो किती घन लांब आहे?",
        },
        answer: 3,
        wrong: [6, 4, 8],
        checkExpr: "12/(2*2)",
        solution: {
          en: "Height × width × length = 12, so length = 12 ÷ (2 × 2) = 3 cubes. 6 divides by 2 only once — the block is 2 both up AND across.",
          hi: "ऊँचाई × चौड़ाई × लंबाई = 12, तो लंबाई = 12 ÷ (2 × 2) = 3 घन। 6 केवल एक बार 2 से भाग देता है — ब्लॉक ऊपर और आर-पार दोनों में 2 है।",
          mr: "उंची × रुंदी × लांबी = 12, म्हणून लांबी = 12 ÷ (2 × 2) = 3 घन. 6 फक्त एकदाच 2 ने भागते — ठोकळा वर आणि आडवा दोन्हींत 2 आहे.",
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
          en: "A 3×3×3 cube is painted red all over, then cut into its 27 small cubes. How many small cubes have NO red on them at all?",
          hi: "3×3×3 का घन चारों ओर से लाल रँगा गया, फिर उसके 27 छोटे घनों में काटा गया। कितने छोटे घनों पर बिलकुल भी लाल नहीं होगा?",
          mr: "3×3×3 चा घन सर्व बाजूंनी लाल रंगवला, मग त्याच्या 27 लहान घनांत कापला. किती लहान घनांवर अजिबात लाल नसेल?",
        },
        answer: 1,
        wrong: [8, 6, 0],
        checkExpr: "1*1*1",
        solution: {
          en: "Paint touches only the outside — and exactly one small cube never saw the outside: the one hidden at the very centre, a 1×1×1 core. The 8 corners got three faces each, the 6 face-middles got one; only the heart of the cube stayed bare.",
          hi: "रंग केवल बाहर छूता है — और ठीक एक छोटे घन ने बाहर कभी देखा ही नहीं: बीचोबीच छिपा 1×1×1 का मर्म। 8 कोनों को तीन-तीन फलक मिले, 6 फलक-मध्यों को एक-एक; बिना रंग रहा तो केवल घन का हृदय।",
          mr: "रंग फक्त बाहेरून लागतो — आणि नेमक्या एका लहान घनाने बाहेर कधी पाहिलेच नाही: अगदी मध्यभागी लपलेला 1×1×1 चा गाभा. 8 कोपऱ्यांना तीन-तीन पृष्ठे मिळाली, 6 पृष्ठ-मध्यांना एक-एक; रंगाविना राहिले ते फक्त घनाचे हृदय.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 9 — Boxes and Sketches",
      name: "Boxes and Sketches",
      slug: "maths-5-boxes-and-sketches",
      summary: "Cubes taken apart and put together — edges, corners and nets, dice pairs that make seven, and the painted cube's hidden heart.",
      position: 9,
      translations: {
        hi: {
          name: "डिब्बे और रेखाचित्र",
          summary: "खुलते-जुड़ते घन — किनारे, कोने और जाल, सात बनाते पासे के जोड़े, और रँगे घन का छिपा हृदय।",
        },
        mr: {
          name: "खोकी आणि रेखाटने",
          summary: "उलगडणारे-जुळणारे घन — कडा, कोपरे आणि जाळी, सात करणाऱ्या फाशाच्या जोड्या, आणि रंगवलेल्या घनाचे लपलेले हृदय.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Area and its Boundary (the wire that chose its shape)        */
/* ------------------------------------------------------------------------- */
function areaAndItsBoundary(): TopicFileOut {
  const rand = rng("maths-5-area-and-its-boundary");
  const qs: OutQuestion[] = [];

  const sqcm = (n: number) => ({ en: `${n} sq cm`, hi: `${n} वर्ग सेमी`, mr: `${n} चौ. सेमी` });
  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });
  const sqm = (n: number) => ({ en: `${n} sq m`, hi: `${n} वर्ग मीटर`, mr: `${n} चौ. मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A greeting card is 8 cm long and 5 cm wide. What is its area?",
          hi: "एक बधाई-कार्ड 8 सेमी लंबा और 5 सेमी चौड़ा है। उसका क्षेत्रफल कितना?",
          mr: "एक शुभेच्छापत्र 8 सेमी लांब आणि 5 सेमी रुंद आहे. त्याचे क्षेत्रफळ किती?",
        },
        answer: 40,
        wrong: [13, 26, 45],
        checkExpr: "8*5",
        fmt: sqcm,
        solution: {
          en: "Area is length × width: 8 × 5 = 40 sq cm. 13 adds the sides and 26 walks the boundary — both measure the edge, not the filled face.",
          hi: "क्षेत्रफल = लंबाई × चौड़ाई: 8 × 5 = 40 वर्ग सेमी। 13 भुजाएँ जोड़ता है और 26 सीमा नापता है — दोनों किनारा नापते हैं, भरा चेहरा नहीं।",
          mr: "क्षेत्रफळ = लांबी × रुंदी: 8 × 5 = 40 चौ. सेमी. 13 बाजू मिळवते आणि 26 हद्द चालते — दोन्ही कड मोजतात, भरलेले तोंड नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A square handkerchief has 7 cm sides. What is its area?",
          hi: "वर्गाकार रूमाल की भुजा 7 सेमी है। उसका क्षेत्रफल कितना?",
          mr: "चौरस हातरुमालाची बाजू 7 सेमी आहे. त्याचे क्षेत्रफळ किती?",
        },
        answer: 49,
        wrong: [14, 28, 21],
        checkExpr: "7*7",
        fmt: sqcm,
        solution: {
          en: "A square multiplies its side by itself: 7 × 7 = 49 sq cm. 28 is the boundary; 14 just doubles one side.",
          hi: "वर्ग अपनी भुजा को उसी से गुणा करता है: 7 × 7 = 49 वर्ग सेमी। 28 सीमा है; 14 एक भुजा का दुगना भर।",
          mr: "चौरस आपली बाजू तिनेच गुणतो: 7 × 7 = 49 चौ. सेमी. 28 ही हद्द; 14 एका बाजूची नुसती दुप्पट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The same 8 cm by 5 cm card is to be edged with ribbon. How much ribbon runs round its boundary?",
          hi: "वही 8 × 5 सेमी कार्ड फ़ीते से किनारा जाना है। उसकी सीमा पर कितना फ़ीता लगेगा?",
          mr: "तेच 8 × 5 सेमी कार्ड फितीने कडा मढवायचे आहे. त्याच्या हद्दीवर किती फीत लागेल?",
        },
        answer: 26,
        wrong: [40, 13, 30],
        checkExpr: "2*(8+5)",
        fmt: cm,
        solution: {
          en: "The ribbon walks every edge: (8 + 5) × 2 = 26 cm. 40 is the card's area — the inside, which the ribbon never touches.",
          hi: "फ़ीता हर किनारा चलता है: (8 + 5) × 2 = 26 सेमी। 40 कार्ड का क्षेत्रफल है — भीतर, जिसे फ़ीता छूता ही नहीं।",
          mr: "फीत प्रत्येक कड चालते: (8 + 5) × 2 = 26 सेमी. 40 हे कार्डाचे क्षेत्रफळ — आतले, जिथे फीत शिवतही नाही.",
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
          en: "A postcard measures 14 cm by 9 cm. What is its area?",
          hi: "पोस्टकार्ड 14 × 9 सेमी का है। उसका क्षेत्रफल कितना?",
          mr: "पोस्टकार्ड 14 × 9 सेमीचे आहे. त्याचे क्षेत्रफळ किती?",
        },
        answer: 126,
        wrong: [23, 46, 116],
        checkExpr: "14*9",
        fmt: sqcm,
        solution: {
          en: "14 × 9 = 14 × 10 − 14 = 140 − 14 = 126 sq cm. 116 subtracts 24 in the shortcut; 46 is the boundary in disguise.",
          hi: "14 × 9 = 14 × 10 − 14 = 140 − 14 = 126 वर्ग सेमी। 116 शॉर्टकट में 24 घटा बैठता है; 46 भेस बदले सीमा है।",
          mr: "14 × 9 = 14 × 10 − 14 = 140 − 14 = 126 चौ. सेमी. 116 युक्तीत 24 वजा करते; 46 ही वेष बदललेली हद्द.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A square field's boundary measures 40 m. How long is each side?",
          hi: "वर्गाकार खेत की सीमा 40 मीटर है। हर भुजा कितनी लंबी है?",
          mr: "चौरस शेताची हद्द 40 मीटर आहे. प्रत्येक बाजू किती लांब?",
        },
        answer: 10,
        wrong: [20, 4, 36],
        checkExpr: "40/4",
        solution: {
          en: "Four equal sides share the 40: 40 ÷ 4 = 10 m each. 20 halves instead — a square insists on four sides, not two.",
          hi: "40 चार बराबर भुजाओं में बँटता है: 40 ÷ 4 = 10-10 मीटर। 20 आधा कर देता है — वर्ग चार भुजाएँ माँगता है, दो नहीं।",
          mr: "40 चार सारख्या बाजूंत वाटले जाते: 40 ÷ 4 = 10-10 मीटर. 20 अर्धे करते — चौरस चार बाजू मागतो, दोन नव्हे.",
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
          en: "A tabletop's area is 48 sq cm on the plan, and its length is 8 cm. How wide is it?",
          hi: "नक़्शे पर मेज़ की सतह का क्षेत्रफल 48 वर्ग सेमी है, और लंबाई 8 सेमी। चौड़ाई कितनी?",
          mr: "आराखड्यावर टेबलाच्या पृष्ठभागाचे क्षेत्रफळ 48 चौ. सेमी आहे, आणि लांबी 8 सेमी. रुंदी किती?",
        },
        answer: 6,
        wrong: [40, 384, 56],
        checkExpr: "48/8",
        fmt: cm,
        solution: {
          en: "Length × width = 48, so width = 48 ÷ 8 = 6 cm. 40 subtracts — area unlocks by division; the sides multiplied to make it.",
          hi: "लंबाई × चौड़ाई = 48, तो चौड़ाई = 48 ÷ 8 = 6 सेमी। 40 घटाता है — क्षेत्रफल भाग से खुलता है; भुजाएँ गुणा होकर उसे बनी थीं।",
          mr: "लांबी × रुंदी = 48, म्हणून रुंदी = 48 ÷ 8 = 6 सेमी. 40 वजा करते — क्षेत्रफळ भागाकाराने उघडते; बाजू गुणूनच ते झाले होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Two square vegetable beds, each of side 6 m, are joined into one long rectangular bed. What is the new bed's area?",
          hi: "6-6 मीटर भुजा की दो वर्गाकार क्यारियाँ जोड़कर एक लंबी आयताकार क्यारी बनाई गई। नई क्यारी का क्षेत्रफल कितना?",
          mr: "6-6 मीटर बाजूच्या दोन चौरस वाफ्या जोडून एक लांब आयताकृती वाफा केला. नव्या वाफ्याचे क्षेत्रफळ किती?",
        },
        answer: 72,
        wrong: [36, 48, 24],
        checkExpr: "2*6*6",
        fmt: sqm,
        solution: {
          en: "Each square holds 6 × 6 = 36 sq m, and two of them 36 × 2 = 72 sq m — joining moves no soil. 48 confuses the joined boundary with the joined area.",
          hi: "हर वर्ग में 6 × 6 = 36 वर्ग मीटर, दो में 36 × 2 = 72 वर्ग मीटर — जोड़ने से मिट्टी घटती नहीं। 48 जुड़ी सीमा को जुड़े क्षेत्रफल से मिला देता है।",
          mr: "प्रत्येक चौरसात 6 × 6 = 36 चौ. मीटर, दोघांत 36 × 2 = 72 चौ. मीटर — जोडण्याने माती घटत नाही. 48 जोडलेल्या हद्दीची जोडलेल्या क्षेत्रफळाशी गल्लत करते.",
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
          en: "A 10 m by 6 m lawn has a 2 m by 2 m pit dug in it for a sapling. How much grassy area remains?",
          hi: "10 × 6 मीटर के लॉन में पौधे के लिए 2 × 2 मीटर का गड्ढा खोदा गया। कितनी घास वाली ज़मीन बची?",
          mr: "10 × 6 मीटरच्या हिरवळीत रोपासाठी 2 × 2 मीटरचा खड्डा खणला. किती गवताची जमीन उरली?",
        },
        answer: 56,
        wrong: [60, 58, 52],
        checkExpr: "10*6-2*2",
        fmt: sqm,
        solution: {
          en: "Lawn 10 × 6 = 60, pit 2 × 2 = 4: grass left is 60 − 4 = 56 sq m. 58 subtracts the pit's side instead of its area — a hole takes away area, not length.",
          hi: "लॉन 10 × 6 = 60, गड्ढा 2 × 2 = 4: घास बची 60 − 4 = 56 वर्ग मीटर। 58 गड्ढे का क्षेत्रफल नहीं, भुजा घटाता है — गड्ढा क्षेत्रफल ले जाता है, लंबाई नहीं।",
          mr: "हिरवळ 10 × 6 = 60, खड्डा 2 × 2 = 4: गवत उरले 60 − 4 = 56 चौ. मीटर. 58 खड्ड्याचे क्षेत्रफळ नव्हे, बाजू वजा करते — खड्डा क्षेत्रफळ नेतो, लांबी नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A 100 cm wire is bent into a square. What AREA does the square enclose?",
          hi: "100 सेमी का तार वर्ग में मोड़ा गया। वह वर्ग कितना क्षेत्रफल घेरता है?",
          mr: "100 सेमीची तार चौरसात वाकवली. तो चौरस किती क्षेत्रफळ वेढतो?",
        },
        answer: 625,
        wrong: [100, 400, 2500],
        checkExpr: "25*25",
        fmt: sqcm,
        solution: {
          en: "Each side gets 100 ÷ 4 = 25 cm, and the area is 25 × 25 = 625 sq cm. 100 repeats the wire's own length; 2500 squares 50, as if the wire made only two sides.",
          hi: "हर भुजा को 100 ÷ 4 = 25 सेमी मिले, और क्षेत्रफल 25 × 25 = 625 वर्ग सेमी। 100 तार की अपनी लंबाई दोहराता है; 2500 पचास का वर्ग है — मानो तार से दो ही भुजाएँ बनीं।",
          mr: "प्रत्येक बाजूला 100 ÷ 4 = 25 सेमी मिळाले, आणि क्षेत्रफळ 25 × 25 = 625 चौ. सेमी. 100 तारेचीच लांबी पुन्हा सांगते; 2500 पन्नासाचा वर्ग — जणू तारेतून दोनच बाजू झाल्या.",
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
          en: "The same 100 cm wire is straightened and bent again — this time into a rectangle 30 cm long. What area does the rectangle enclose?",
          hi: "वही 100 सेमी तार सीधा करके फिर मोड़ा गया — इस बार 30 सेमी लंबे आयत में। आयत कितना क्षेत्रफल घेरता है?",
          mr: "तीच 100 सेमी तार सरळ करून पुन्हा वाकवली — या वेळी 30 सेमी लांब आयतात. आयत किती क्षेत्रफळ वेढतो?",
        },
        answer: 600,
        wrong: [625, 3000, 70],
        checkExpr: "30*(100-2*30)/2",
        fmt: sqcm,
        solution: {
          en: "Two lengths take 60 cm, leaving 40 for two widths: width 20 cm. Area: 30 × 20 = 600 sq cm. 3000 multiplies length by the whole leftover 100; the wire pays for FOUR sides before any area exists.",
          hi: "दो लंबाइयों में 60 सेमी गए, दो चौड़ाइयों के लिए 40 बचे: चौड़ाई 20 सेमी। क्षेत्रफल: 30 × 20 = 600 वर्ग सेमी। 3000 लंबाई को पूरे बचे 100 से गुणा कर देता है; क्षेत्रफल बनने से पहले तार चारों भुजाएँ चुकाता है।",
          mr: "दोन लांब्यांत 60 सेमी गेले, दोन रुंद्यांसाठी 40 उरले: रुंदी 20 सेमी. क्षेत्रफळ: 30 × 20 = 600 चौ. सेमी. 3000 लांबीला अख्ख्या उरलेल्या 100 ने गुणते; क्षेत्रफळ होण्याआधी तार चारही बाजू भरते.",
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
          en: "One 100 cm wire, two shapes: as a square it enclosed 625 sq cm, as a 30-by-20 rectangle it enclosed 600. How much MORE does the square hold — and it always will, for any rectangle from this wire?",
          hi: "एक 100 सेमी तार, दो आकार: वर्ग बनकर उसने 625 वर्ग सेमी घेरा, 30 × 20 आयत बनकर 600। वर्ग कितना ज़्यादा समेटता है — और इस तार के हर आयत से ज़्यादा ही समेटेगा?",
          mr: "एक 100 सेमी तार, दोन आकार: चौरस होऊन तिने 625 चौ. सेमी वेढले, 30 × 20 आयत होऊन 600. चौरस किती जास्त सामावतो — आणि या तारेच्या प्रत्येक आयताहून जास्तच सामावेल?",
        },
        answer: 25,
        wrong: [625, 5, 100],
        checkExpr: "25*25-600",
        fmt: sqcm,
        solution: {
          en: "625 − 600 = 25 sq cm in the square's favour — and the rule is general: of all rectangles with the same boundary, the square encloses the most. Stretch the rectangle thinner and its area only falls (40 × 10 gives 400; 45 × 5 just 225). The wire never changes; how you bend it decides what it can hold.",
          hi: "625 − 600 = 25 वर्ग सेमी वर्ग के पक्ष में — और नियम आम है: एक-सी सीमा वाले सब आयतों में वर्ग सबसे ज़्यादा घेरता है। आयत को और पतला खींचिए तो क्षेत्रफल गिरता ही है (40 × 10 से 400; 45 × 5 से बस 225)। तार वही रहता है; उसे कैसे मोड़ा, यही तय करता है कि वह कितना समेटेगा।",
          mr: "625 − 600 = 25 चौ. सेमी चौरसाच्या बाजूने — आणि नियम सार्वत्रिक: सारख्या हद्दीच्या साऱ्या आयतांत चौरस सर्वाधिक वेढतो. आयत आणखी बारीक ओढा तर क्षेत्रफळ घसरतेच (40 × 10 ने 400; 45 × 5 ने फक्त 225). तार तीच राहते; ती कशी वाकवली हेच ती किती सामावेल ते ठरवते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 11 — Area and its Boundary",
      name: "Area and its Boundary",
      slug: "maths-5-area-and-its-boundary",
      summary: "Area and boundary pulled apart — cards and ribbons, lawns with pits, and one wire that holds more as a square than as any rectangle.",
      position: 11,
      translations: {
        hi: {
          name: "क्षेत्रफल और उसकी सीमा",
          summary: "अलग-अलग परखे क्षेत्रफल और सीमा — कार्ड और फ़ीते, गड्ढों वाले लॉन, और वह एक तार जो वर्ग बनकर हर आयत से ज़्यादा समेटता है।",
        },
        mr: {
          name: "क्षेत्रफळ आणि त्याची हद्द",
          summary: "वेगवेगळे पारखलेले क्षेत्रफळ आणि हद्द — कार्डे आणि फिती, खड्ड्यांच्या हिरवळी, आणि चौरस होऊन प्रत्येक आयताहून जास्त सामावणारी एक तार.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Smart Charts (reading data with a doubting eye)              */
/* ------------------------------------------------------------------------- */
function smartCharts5(): TopicFileOut {
  const rand = rng("maths-5-smart-charts");
  const qs: OutQuestion[] = [];

  const kmF = (n: number) => ({ en: `${n} km`, hi: `${n} किमी`, mr: `${n} किमी` });
  const litres = (n: number) => ({ en: `${n} litres`, hi: `${n} लीटर`, mr: `${n} लिटर` });
  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "On the games bar-chart, cricket's bar reaches 40 and kho-kho's reaches 25. By how many votes does cricket lead?",
          hi: "खेलों के दंड-चार्ट में क्रिकेट की पट्टी 40 तक और खो-खो की 25 तक पहुँचती है। क्रिकेट कितने मतों से आगे है?",
          mr: "खेळांच्या स्तंभ-तक्त्यात क्रिकेटचा स्तंभ 40 पर्यंत आणि खो-खोचा 25 पर्यंत पोहोचतो. क्रिकेट किती मतांनी पुढे?",
        },
        answer: 15,
        wrong: [65, 25, 10],
        checkExpr: "40-25",
        solution: {
          en: "The lead is the gap between bars: 40 − 25 = 15 votes. 65 adds the bars — 'how far ahead' asks for a difference.",
          hi: "बढ़त पट्टियों का फ़ासला है: 40 − 25 = 15 मत। 65 पट्टियाँ जोड़ देता है — 'कितना आगे' अंतर पूछता है।",
          mr: "आघाडी म्हणजे स्तंभांमधले अंतर: 40 − 25 = 15 मते. 65 स्तंभ मिळवते — 'किती पुढे' फरक विचारते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In the forest pictograph one tree-symbol stands for 100 trees. The sal row shows 6 symbols. How many sal trees?",
          hi: "वन के चित्र-चार्ट में पेड़ का एक चिह्न 100 पेड़ों का है। साल की पंक्ति में 6 चिह्न हैं। साल के कितने पेड़?",
          mr: "वनाच्या चित्र-तक्त्यात झाडाचे एक चिन्ह 100 झाडांचे आहे. सालच्या ओळीत 6 चिन्हे आहेत. सालची किती झाडे?",
        },
        answer: 600,
        wrong: [6, 106, 60],
        checkExpr: "100*6",
        solution: {
          en: "Six symbols of 100: 100 × 6 = 600 trees. 6 counts pictures, 60 drops a zero — the key at the chart's corner sets the worth of every symbol.",
          hi: "100-100 के छह चिह्न: 100 × 6 = 600 पेड़। 6 तस्वीरें गिनता है, 60 शून्य गिराता है — चार्ट के कोने की कुंजी हर चिह्न का मोल तय करती है।",
          mr: "100-100 ची सहा चिन्हे: 100 × 6 = 600 झाडे. 6 चित्रे मोजते, 60 शून्य पाडते — तक्त्याच्या कोपऱ्यातली किल्ली प्रत्येक चिन्हाचे मोल ठरवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The kitchen chart counts chapatis over three days: 20, then 15, then 25. How many in all?",
          hi: "रसोई-चार्ट तीन दिनों की रोटियाँ गिनता है: 20, फिर 15, फिर 25। कुल कितनी?",
          mr: "स्वयंपाकघराचा तक्ता तीन दिवसांच्या पोळ्या मोजतो: 20, मग 15, मग 25. एकूण किती?",
        },
        answer: 60,
        wrong: [55, 50, 65],
        checkExpr: "20+15+25",
        solution: {
          en: "20 + 15 + 25 = 60 chapatis — group the friendly pair first: 15 + 25 = 40, then + 20. 55 loses a five along the way.",
          hi: "20 + 15 + 25 = 60 रोटियाँ — पहले सुविधाजनक जोड़ा: 15 + 25 = 40, फिर + 20। 55 राह में एक पाँच खो देता है।",
          mr: "20 + 15 + 25 = 60 पोळ्या — आधी सोयीची जोडी: 15 + 25 = 40, मग + 20. 55 वाटेत एक पाच हरवते.",
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
          en: "In a pictograph where one symbol = 20 children, what does a HALF symbol stand for?",
          hi: "जिस चित्र-चार्ट में एक चिह्न = 20 बच्चे, वहाँ आधा चिह्न किसके बराबर है?",
          mr: "ज्या चित्र-तक्त्यात एक चिन्ह = 20 मुले, तिथे अर्धे चिन्ह कशाच्या बरोबरीचे?",
        },
        answer: 10,
        wrong: [20, 5, 2],
        checkExpr: "20/2",
        solution: {
          en: "Half the symbol, half the count: 20 ÷ 2 = 10 children. 2 halves the wrong thing — the picture, cut in half, still speaks in the chart's key.",
          hi: "आधा चिह्न, आधी गिनती: 20 ÷ 2 = 10 बच्चे। 2 ग़लत चीज़ आधी करता है — कटी तस्वीर भी चार्ट की कुंजी में ही बोलती है।",
          mr: "अर्धे चिन्ह, अर्धी मोजणी: 20 ÷ 2 = 10 मुले. 2 चुकीची गोष्ट अर्धी करते — कापलेले चित्रही तक्त्याच्या किल्लीतच बोलते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The growth chart shows Munna's money-plant at 12 cm last month and 30 cm now. How much did it grow?",
          hi: "वृद्धि-चार्ट में मुन्ना की मनी-प्लांट पिछले महीने 12 सेमी और अब 30 सेमी है। वह कितनी बढ़ी?",
          mr: "वाढीच्या तक्त्यात मुन्नाची मनी-प्लांट गेल्या महिन्यात 12 सेमी आणि आता 30 सेमी आहे. ती किती वाढली?",
        },
        answer: 18,
        wrong: [42, 12, 22],
        checkExpr: "30-12",
        fmt: cm,
        solution: {
          en: "Growth is now minus then: 30 − 12 = 18 cm. 42 adds the two readings — a chart's change always lives in the difference.",
          hi: "वृद्धि = अब घटा तब: 30 − 12 = 18 सेमी। 42 दोनों नाप जोड़ देता है — चार्ट का बदलाव हमेशा अंतर में बसता है।",
          mr: "वाढ = आता वजा तेव्हा: 30 − 12 = 18 सेमी. 42 दोन्ही मापे मिळवते — तक्त्यातला बदल नेहमी फरकात राहतो.",
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
          en: "90 children were asked how they come to school: 35 walk and 40 cycle. The rest ride the bus — how many is that?",
          hi: "90 बच्चों से पूछा गया कि वे स्कूल कैसे आते हैं: 35 पैदल और 40 साइकिल से। बाक़ी बस से — वे कितने हैं?",
          mr: "90 मुलांना विचारले शाळेत कसे येता: 35 चालत आणि 40 सायकलने. उरलेले बसने — ते किती?",
        },
        answer: 15,
        wrong: [55, 50, 25],
        checkExpr: "90-35-40",
        solution: {
          en: "The bus children are the unnamed rest: 90 − 35 − 40 = 15. 55 removes only the walkers; both named groups must leave the total first.",
          hi: "बस वाले बिना नाम के बचे हुए हैं: 90 − 35 − 40 = 15। 55 केवल पैदल वालों को हटाता है; पहले दोनों नामी समूह कुल से निकलें।",
          mr: "बसवाली मुले म्हणजे नाव न घेतलेले उरलेले: 90 − 35 − 40 = 15. 55 फक्त चालणाऱ्यांना काढते; आधी दोन्ही नावाचे गट एकुणातून निघायला हवेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The bus-yard chart uses one square = 5 buses. A route's bar is 7 squares tall. How many buses run that route?",
          hi: "बस-अड्डे के चार्ट में एक ख़ाना = 5 बसें। एक रूट की पट्टी 7 ख़ाने ऊँची है। उस रूट पर कितनी बसें चलती हैं?",
          mr: "बस-आगाराच्या तक्त्यात एक चौकट = 5 बस. एका मार्गाचा स्तंभ 7 चौकटी उंच आहे. त्या मार्गावर किती बस धावतात?",
        },
        answer: 35,
        wrong: [12, 7, 57],
        checkExpr: "5*7",
        solution: {
          en: "Seven squares of 5: 5 × 7 = 35 buses. 7 reads the squares raw; 12 adds the scale to them — the scale multiplies every square it touches.",
          hi: "5-5 के सात ख़ाने: 5 × 7 = 35 बसें। 7 ख़ाने यों ही पढ़ता है; 12 उनमें पैमाना जोड़ देता है — पैमाना हर छुए ख़ाने से गुणा होता है।",
          mr: "5-5 च्या सात चौकटी: 5 × 7 = 35 बस. 7 चौकटी नुसत्या वाचते; 12 त्यांत प्रमाण मिळवते — प्रमाण शिवलेल्या प्रत्येक चौकटीने गुणले जाते.",
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
          en: "The milk chart says the family takes 2 litres every day. What will the chart's total show for one week?",
          hi: "दूध-चार्ट कहता है परिवार रोज़ 2 लीटर लेता है। एक हफ़्ते का कुल चार्ट में कितना दिखेगा?",
          mr: "दूध-तक्ता सांगतो कुटुंब रोज 2 लिटर घेते. एका आठवड्याची बेरीज तक्त्यात किती दिसेल?",
        },
        answer: 14,
        wrong: [9, 12, 10],
        checkExpr: "2*7",
        fmt: litres,
        solution: {
          en: "Seven days of 2 litres: 2 × 7 = 14 litres. 12 counts six days — the chart's week keeps Sunday too.",
          hi: "2-2 लीटर के सात दिन: 2 × 7 = 14 लीटर। 12 छह दिन गिनता है — चार्ट का हफ़्ता इतवार भी रखता है।",
          mr: "2-2 लिटरचे सात दिवस: 2 × 7 = 14 लिटर. 12 सहा दिवस मोजते — तक्त्याचा आठवडा रविवारही ठेवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The rain gauge chart: June collected 120 mm and July collected half as much again as June. What did July collect?",
          hi: "वर्षा-मापी चार्ट: जून में 120 मिमी और जुलाई में जून से आधा और ज़्यादा। जुलाई में कितना?",
          mr: "पर्जन्यमापी तक्ता: जूनमध्ये 120 मिमी आणि जुलैत जूनहून आणखी निम्मे जास्त. जुलैत किती?",
        },
        answer: 180,
        wrong: [60, 240, 120],
        checkExpr: "120+120/2",
        solution: {
          en: "'Half as much again' means the whole PLUS its half: 120 + 60 = 180 mm. 60 keeps only the half; 240 doubles — reading quantity-words exactly is chart-work too.",
          hi: "'आधा और ज़्यादा' यानी पूरा और उसका आधा: 120 + 60 = 180 मिमी। 60 केवल आधा रखता है; 240 दुगना कर देता है — मात्रा के शब्द ठीक-ठीक पढ़ना भी चार्ट का ही काम है।",
          mr: "'आणखी निम्मे जास्त' म्हणजे पूर्ण अधिक त्याचा अर्धा: 120 + 60 = 180 मिमी. 60 फक्त अर्धा ठेवते; 240 दुप्पट करते — परिमाणाचे शब्द नेमके वाचणे हेही तक्त्याचेच काम.",
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
          en: "The journey chart: the bus covered 45 km in each of the first 3 hours, then 30 km in the slow last hour. How far in all?",
          hi: "यात्रा-चार्ट: बस ने पहले 3 घंटों में 45-45 किमी, फिर धीमे आख़िरी घंटे में 30 किमी तय किए। कुल कितनी दूरी?",
          mr: "प्रवास-तक्ता: बसने पहिल्या 3 तासांत 45-45 किमी, मग हळू शेवटच्या तासात 30 किमी कापले. एकूण किती अंतर?",
        },
        answer: 165,
        wrong: [135, 75, 180],
        checkExpr: "45*3+30",
        fmt: kmF,
        solution: {
          en: "Fast hours: 45 × 3 = 135 km; the slow hour adds 30: 135 + 30 = 165 km. 135 forgets the last hour; 180 pretends it kept the old speed.",
          hi: "तेज़ घंटे: 45 × 3 = 135 किमी; धीमा घंटा 30 जोड़ता है: 135 + 30 = 165 किमी। 135 आख़िरी घंटा भूलता है; 180 मान बैठता है कि रफ़्तार वही रही।",
          mr: "वेगवान तास: 45 × 3 = 135 किमी; हळू तास 30 मिळवतो: 135 + 30 = 165 किमी. 135 शेवटचा तास विसरते; 180 वेग तोच राहिल्याचे मानते.",
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
          en: "A poster claims 'HALF our class of 40 loves cricket!' but the chart's cricket bar reads 22. By how many children does the claim miss the chart?",
          hi: "पोस्टर दावा करता है '40 की हमारी कक्षा के आधे बच्चे क्रिकेट के दीवाने हैं!' पर चार्ट की क्रिकेट-पट्टी 22 कहती है। दावा चार्ट से कितने बच्चों से चूकता है?",
          mr: "पोस्टर दावा करते '40 च्या आमच्या वर्गातली निम्मी मुले क्रिकेटवेडी!' पण तक्त्याचा क्रिकेट-स्तंभ 22 सांगतो. दावा तक्त्याहून किती मुलांनी चुकतो?",
        },
        answer: 2,
        wrong: [20, 18, 0],
        checkExpr: "22-40/2",
        solution: {
          en: "Half of 40 is 20; the chart says 22 — the claim is off by 22 − 20 = 2 children (and in cricket's favour, so 'half' UNDERSELLS it). Checking a claim against its own chart is the chapter's real skill: words round off, bars do not.",
          hi: "40 का आधा 20; चार्ट कहता है 22 — दावा 22 − 20 = 2 बच्चों से चूकता है (और क्रिकेट के पक्ष में, यानी 'आधे' कहना कम बताना है)। दावे को उसी के चार्ट से जाँचना ही अध्याय का असली हुनर है: शब्द गोल कर देते हैं, पट्टियाँ नहीं।",
          mr: "40 चा अर्धा 20; तक्ता सांगतो 22 — दावा 22 − 20 = 2 मुलांनी चुकतो (आणि क्रिकेटच्या बाजूने, म्हणजे 'निम्मे' म्हणणे कमी सांगणे). दावा त्याच्याच तक्त्याशी ताडणे हेच धड्याचे खरे कौशल्य: शब्द गोल करतात, स्तंभ नाहीत.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 12 — Smart Charts",
      name: "Smart Charts",
      slug: "maths-5-smart-charts",
      summary: "Bars, keys and growth lines read with a doubting eye — scaled symbols, unnamed remainders, and claims checked against their own charts.",
      position: 12,
      translations: {
        hi: {
          name: "स्मार्ट चार्ट",
          summary: "शक की नज़र से पढ़ी पट्टियाँ, कुंजियाँ और वृद्धि-रेखाएँ — पैमाने वाले चिह्न, बिना नाम के बचे हुए, और अपने ही चार्ट से जँचे दावे।",
        },
        mr: {
          name: "स्मार्ट तक्ते",
          summary: "शंकेच्या नजरेने वाचलेले स्तंभ, किल्ल्या आणि वाढ-रेषा — प्रमाणातली चिन्हे, नाव न घेतलेले उरलेले, आणि स्वतःच्याच तक्त्याशी ताडलेले दावे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Ways to Multiply and Divide (bigger numbers, cleverer moves) */
/* ------------------------------------------------------------------------- */
function waysToMultiplyAndDivide(): TopicFileOut {
  const rand = rng("maths-5-ways-to-multiply-and-divide");
  const qs: OutQuestion[] = [];

  const litres = (n: number) => ({ en: `${n} litres`, hi: `${n} लीटर`, mr: `${n} लिटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 43 × 2?",
          hi: "43 × 2 कितना है?",
          mr: "43 × 2 किती?",
        },
        answer: 86,
        wrong: [45, 68, 96],
        checkExpr: "43*2",
        solution: {
          en: "Double the tens, double the ones: 80 + 6 = 86. 68 swaps the digits; 45 adds the 2 instead of doubling.",
          hi: "दहाई दुगनी, इकाई दुगनी: 80 + 6 = 86। 68 अंक पलट देता है; 45 दुगना करने की जगह 2 जोड़ता है।",
          mr: "दशक दुप्पट, एकक दुप्पट: 80 + 6 = 86. 68 अंक उलटते; 45 दुप्पट करण्याऐवजी 2 मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 84 ÷ 4?",
          hi: "84 ÷ 4 कितना है?",
          mr: "84 ÷ 4 किती?",
        },
        answer: 21,
        wrong: [22, 12, 80],
        checkExpr: "84/4",
        solution: {
          en: "Split 84 into 80 + 4: 80 ÷ 4 = 20 and 4 ÷ 4 = 1, so 21. 12 divides 84 by 7 by mistake; 80 subtracts the 4 instead of dividing by it.",
          hi: "84 को 80 + 4 में तोड़िए: 80 ÷ 4 = 20 और 4 ÷ 4 = 1, तो 21। 12 भूल से 7 से भाग देता है; 80 चार से भाग की जगह चार घटा देता है।",
          mr: "84 ला 80 + 4 मध्ये फोडा: 80 ÷ 4 = 20 आणि 4 ÷ 4 = 1, म्हणून 21. 12 चुकून 7 ने भागते; 80 चाराने भागण्याऐवजी चार वजा करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 35 × 10?",
          hi: "35 × 10 कितना है?",
          mr: "35 × 10 किती?",
        },
        answer: 350,
        wrong: [35, 3500, 45],
        checkExpr: "35*10",
        solution: {
          en: "Multiplying by ten hangs one zero on the end: 350. 3500 hangs two — that is ×100's job; 45 adds the ten.",
          hi: "दस से गुणा अंत में एक शून्य टाँगता है: 350। 3500 दो टाँग देता है — वह ×100 का काम है; 45 दस जोड़ देता है।",
          mr: "दहाने गुणणे शेवटी एक शून्य टांगते: 350. 3500 दोन टांगते — ते ×100 चे काम; 45 दहा मिळवते.",
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
          en: "What is 127 × 3?",
          hi: "127 × 3 कितना है?",
          mr: "127 × 3 किती?",
        },
        answer: 381,
        wrong: [361, 321, 371],
        checkExpr: "127*3",
        solution: {
          en: "Piece by piece: 100 × 3 = 300, 20 × 3 = 60, 7 × 3 = 21 — total 381. 361 and 371 lose parts of the 21's carry into the tens.",
          hi: "टुकड़ों में: 100 × 3 = 300, 20 × 3 = 60, 7 × 3 = 21 — कुल 381। 361 और 371 में 21 का दहाई वाला हासिल कहीं छूट जाता है।",
          mr: "तुकड्यांनी: 100 × 3 = 300, 20 × 3 = 60, 7 × 3 = 21 — एकूण 381. 361 आणि 371 मध्ये 21 चा दशकातला हातचा कुठे तरी सुटतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 96 ÷ 8?",
          hi: "96 ÷ 8 कितना है?",
          mr: "96 ÷ 8 किती?",
        },
        answer: 12,
        wrong: [11, 13, 88],
        checkExpr: "96/8",
        solution: {
          en: "96 = 80 + 16, and 80 ÷ 8 = 10, 16 ÷ 8 = 2: together 12. Check forward: 8 × 12 = 96. 88 subtracts the 8 — division shares, it does not remove one share.",
          hi: "96 = 80 + 16, और 80 ÷ 8 = 10, 16 ÷ 8 = 2: मिलाकर 12। उल्टी जाँच: 8 × 12 = 96। 88 आठ घटा देता है — भाग बाँटता है, एक हिस्सा हटाता नहीं।",
          mr: "96 = 80 + 16, आणि 80 ÷ 8 = 10, 16 ÷ 8 = 2: मिळून 12. उलट तपासणी: 8 × 12 = 96. 88 आठ वजा करते — भागाकार वाटतो, एक वाटा काढत नाही.",
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
          en: "A carton holds 144 pencils. How many pencils in 6 cartons?",
          hi: "एक कार्टन में 144 पेंसिलें हैं। 6 कार्टनों में कितनी पेंसिलें?",
          mr: "एका खोक्यात 144 पेन्सिली आहेत. 6 खोक्यांत किती पेन्सिली?",
        },
        answer: 864,
        wrong: [764, 150, 884],
        checkExpr: "144*6",
        solution: {
          en: "144 × 6 = 100×6 + 40×6 + 4×6 = 600 + 240 + 24 = 864. 764 drops a hundred in the middle step; 150 adds the cartons.",
          hi: "144 × 6 = 100×6 + 40×6 + 4×6 = 600 + 240 + 24 = 864। 764 बीच के क़दम में एक सैकड़ा गिराता है; 150 कार्टन जोड़ देता है।",
          mr: "144 × 6 = 100×6 + 40×6 + 4×6 = 600 + 240 + 24 = 864. 764 मधल्या पायरीत एक शतक पाडते; 150 खोकी मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "525 chairs are shared equally among 5 halls. How many chairs per hall?",
          hi: "525 कुर्सियाँ 5 हॉलों में बराबर बाँटी गईं। हर हॉल में कितनी कुर्सियाँ?",
          mr: "525 खुर्च्या 5 सभागृहांत सारख्या वाटल्या. प्रत्येक सभागृहात किती खुर्च्या?",
        },
        answer: 105,
        wrong: [15, 101, 125],
        checkExpr: "525/5",
        solution: {
          en: "500 ÷ 5 = 100 and 25 ÷ 5 = 5: each hall gets 105. 15 forgets the hundreds entirely; 101 mislays the 25's share.",
          hi: "500 ÷ 5 = 100 और 25 ÷ 5 = 5: हर हॉल को 105। 15 सैकड़े पूरे भूल जाता है; 101 पच्चीस का हिस्सा गुमा देता है।",
          mr: "500 ÷ 5 = 100 आणि 25 ÷ 5 = 5: प्रत्येक सभागृहाला 105. 15 शतके पूर्ण विसरते; 101 पंचविसाचा वाटा हरवते.",
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
          en: "438 children must be seated 6 to a bench. How many benches fill completely?",
          hi: "438 बच्चों को 6-6 की बेंचों पर बिठाना है। कितनी बेंचें पूरी भरेंगी?",
          mr: "438 मुलांना 6-6 च्या बाकांवर बसवायचे आहे. किती बाके पूर्ण भरतील?",
        },
        answer: 73,
        wrong: [72, 74, 63],
        checkExpr: "438/6",
        solution: {
          en: "438 ÷ 6: 420 ÷ 6 = 70 and 18 ÷ 6 = 3, so 73 benches exactly — no remainder, every bench full. 63 divides 378; a quick 6 × 73 = 438 check settles it.",
          hi: "438 ÷ 6: 420 ÷ 6 = 70 और 18 ÷ 6 = 3, तो ठीक 73 बेंचें — शेष शून्य, हर बेंच भरी। 63 तो 378 का भागफल है; झटपट 6 × 73 = 438 की जाँच बात पक्की कर देती है।",
          mr: "438 ÷ 6: 420 ÷ 6 = 70 आणि 18 ÷ 6 = 3, म्हणून नेमकी 73 बाके — बाकी शून्य, प्रत्येक बाक भरलेला. 63 हा 378 चा भागाकार; झटपट 6 × 73 = 438 तपासणी गोष्ट पक्की करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Solve 23 × 19 the clever way: take 23 twenties and give one 23 back. What is the answer?",
          hi: "23 × 19 चतुराई से कीजिए: 23 के बीस गुने लीजिए और एक 23 लौटा दीजिए। उत्तर क्या है?",
          mr: "23 × 19 हुशारीने करा: 23 चे वीसपट घ्या आणि एक 23 परत द्या. उत्तर किती?",
        },
        answer: 437,
        wrong: [460, 414, 447],
        checkExpr: "23*20-23",
        solution: {
          en: "23 × 20 = 460, minus the one extra 23: 460 − 23 = 437. 460 forgets to give the 23 back; 414 gives back two. Nineteen anythings are twenty of them minus one.",
          hi: "23 × 20 = 460, एक फ़ालतू 23 घटाइए: 460 − 23 = 437। 460 लौटाना भूल जाता है; 414 दो लौटा देता है। उन्नीस गुना यानी बीस गुना घटा एक।",
          mr: "23 × 20 = 460, एक जादा 23 वजा करा: 460 − 23 = 437. 460 परत देणे विसरते; 414 दोन परत देते. एकोणीसपट म्हणजे विसपट वजा एक.",
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
          en: "The dairy sends 8 litres of milk every day. How much milk in February of an ordinary year — 28 days?",
          hi: "डेयरी रोज़ 8 लीटर दूध भेजती है। आम साल की फ़रवरी — 28 दिनों — में कुल कितना दूध?",
          mr: "डेअरी रोज 8 लिटर दूध पाठवते. साध्या वर्षाच्या फेब्रुवारीत — 28 दिवसांत — एकूण किती दूध?",
        },
        answer: 224,
        wrong: [216, 232, 168],
        checkExpr: "8*28",
        solution: {
          en: "8 × 28 = 8 × 30 − 8 × 2 = 240 − 16 = 224 litres. 168 uses a 21-day February; 216 and 232 are one day of milk below and above.",
          hi: "8 × 28 = 8 × 30 − 8 × 2 = 240 − 16 = 224 लीटर। 168 इक्कीस दिन की फ़रवरी लेता है; 216 और 232 एक-एक दिन का दूध नीचे-ऊपर हैं।",
          mr: "8 × 28 = 8 × 30 − 8 × 2 = 240 − 16 = 224 लिटर. 168 एकवीस दिवसांची फेब्रुवारी घेते; 216 आणि 232 एकेका दिवसाचे दूध खाली-वर.",
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
          en: "A number divided by 7 gives quotient 13 and remainder 4. What is the number?",
          hi: "किसी संख्या को 7 से भाग देने पर भागफल 13 और शेष 4 आता है। वह संख्या क्या है?",
          mr: "एका संख्येला 7 ने भागल्यावर भागाकार 13 आणि बाकी 4 येते. ती संख्या कोणती?",
        },
        answer: 95,
        wrong: [91, 87, 24],
        checkExpr: "7*13+4",
        solution: {
          en: "Rebuild it: 7 × 13 = 91, plus the 4 left over: 91 + 4 = 95 — and 95 ÷ 7 does give 13 remainder 4. 91 forgets the remainder; 24 just adds the visible numbers. Division's undo is multiply-then-add-the-remainder.",
          hi: "फिर से जोड़िए: 7 × 13 = 91, ऊपर से बचा 4: 91 + 4 = 95 — और 95 ÷ 7 सचमुच 13 शेष 4 देता है। 91 शेष भूलता है; 24 दिखती संख्याएँ भर जोड़ता है। भाग का उलटा है — गुणा करो, फिर शेष जोड़ो।",
          mr: "पुन्हा उभारा: 7 × 13 = 91, शिवाय उरलेले 4: 91 + 4 = 95 — आणि 95 ÷ 7 खरेच 13 बाकी 4 देते. 91 बाकी विसरते; 24 नुसत्या दिसणाऱ्या संख्या मिळवते. भागाकाराचा उलटा म्हणजे — गुणा, मग बाकी मिळवा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 13 — Ways to Multiply and Divide",
      name: "Ways to Multiply and Divide",
      slug: "maths-5-ways-to-multiply-and-divide",
      summary: "Bigger multiplications and divisions taken apart cleverly — splitting by place, the twenty-minus-one trick, and rebuilding a number from its remainder.",
      position: 13,
      translations: {
        hi: {
          name: "गुणा-भाग के तरीक़े",
          summary: "बड़े गुणा-भाग चतुराई से खोले हुए — स्थान से तोड़ना, बीस-घटा-एक की तरकीब, और शेष से संख्या को फिर जोड़ना।",
        },
        mr: {
          name: "गुणाकार-भागाकाराच्या रीती",
          summary: "मोठे गुणाकार-भागाकार हुशारीने उलगडलेले — स्थानाने फोडणे, वीस-वजा-एकची युक्ती, आणि बाकीतून संख्या पुन्हा उभारणे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 14 — How Big? How Heavy? (volume and weight, measured and felt)   */
/* ------------------------------------------------------------------------- */
function howBigHowHeavy(): TopicFileOut {
  const rand = rng("maths-5-how-big-how-heavy");
  const qs: OutQuestion[] = [];

  const mlF = (n: number) => ({ en: `${n} mL`, hi: `${n} मिली`, mr: `${n} मिली` });
  const kg = (n: number) => ({ en: `${n} kg`, hi: `${n} किग्रा`, mr: `${n} किलो` });
  const g = (n: number) => ({ en: `${n} g`, hi: `${n} ग्राम`, mr: `${n} ग्रॅम` });
  const cubes = (n: number) => ({ en: `${n} cubes`, hi: `${n} घन`, mr: `${n} घन` });
  const cucm = (n: number) => ({ en: `${n} cubic cm`, hi: `${n} घन सेमी`, mr: `${n} घन सेमी` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A marble dropped into a measuring jar raises the water from 60 mL to 62 mL. What is the marble's volume?",
          hi: "नापने के जार में कंचा डालने पर पानी 60 मिली से 62 मिली हो जाता है। कंचे का आयतन कितना?",
          mr: "मापाच्या भांड्यात गोटी टाकल्यावर पाणी 60 मिलीवरून 62 मिली होते. गोटीचे आकारमान किती?",
        },
        answer: 2,
        wrong: [62, 122, 60],
        checkExpr: "62-60",
        fmt: mlF,
        solution: {
          en: "The marble pushed the water up by 62 − 60 = 2 mL — the water rose by exactly the marble's own size. 62 reads the new level, not the rise.",
          hi: "कंचे ने पानी 62 − 60 = 2 मिली ऊपर धकेला — पानी ठीक कंचे के अपने नाप जितना चढ़ा। 62 नया तल पढ़ता है, चढ़ाव नहीं।",
          mr: "गोटीने पाणी 62 − 60 = 2 मिली वर ढकलले — पाणी नेमके गोटीच्या स्वतःच्या मापाइतके चढले. 62 नवी पातळी वाचते, चढ नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A centimetre cube has a volume of 1 cubic cm. What is the volume of a row of 5 such cubes?",
          hi: "सेंटीमीटर-घन का आयतन 1 घन सेमी है। ऐसे 5 घनों की क़तार का आयतन कितना?",
          mr: "सेंटिमीटर-घनाचे आकारमान 1 घन सेमी. अशा 5 घनांच्या रांगेचे आकारमान किती?",
        },
        answer: 5,
        wrong: [1, 25, 10],
        checkExpr: "5*1",
        fmt: cucm,
        solution: {
          en: "Five cubes of 1 each: 5 × 1 = 5 cubic cm — volume counts the cubes a shape is built of. 25 squares the five; a row grows straight, not sideways.",
          hi: "1-1 के पाँच घन: 5 × 1 = 5 घन सेमी — आयतन उन घनों को गिनता है जिनसे आकृति बनी है। 25 पाँच का वर्ग है; क़तार सीधी बढ़ती है, आड़ी नहीं।",
          mr: "1-1 चे पाच घन: 5 × 1 = 5 घन सेमी — आकारमान आकार ज्या घनांनी बनला ते मोजते. 25 पाचाचा वर्ग; रांग सरळ वाढते, आडवी नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "One brick weighs about 2 kg. What do six bricks weigh?",
          hi: "एक ईंट क़रीब 2 किलो की है। छह ईंटें कितने की होंगी?",
          mr: "एक वीट सुमारे 2 किलोची असते. सहा विटा किती होतील?",
        },
        answer: 12,
        wrong: [8, 62, 10],
        checkExpr: "2*6",
        fmt: kg,
        solution: {
          en: "Six bricks of 2 kg: 2 × 6 = 12 kg — about what a full school bag should never weigh. 8 adds the six to the two.",
          hi: "2-2 किलो की छह ईंटें: 2 × 6 = 12 किलो — क़रीब उतना, जितना भरे बस्ते को कभी नहीं होना चाहिए। 8 छह को दो में जोड़ देता है।",
          mr: "2-2 किलोच्या सहा विटा: 2 × 6 = 12 किलो — भरलेल्या दप्तराने कधीही होऊ नये इतके. 8 सहाला दोनांत मिळवते.",
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
          en: "A box floor holds 4 cubes by 3 cubes, one layer high. How many cubes fill it?",
          hi: "डिब्बे के फ़र्श पर 4 × 3 घन आते हैं, एक परत ऊँची। उसे कितने घन भरेंगे?",
          mr: "खोक्याच्या तळावर 4 × 3 घन मावतात, एक थर उंच. ते किती घनांनी भरेल?",
        },
        answer: 12,
        wrong: [7, 24, 43],
        checkExpr: "4*3*1",
        fmt: cubes,
        solution: {
          en: "One layer of 4 × 3: 12 cubes. 24 imagines a second layer the box does not have; 7 adds the sides.",
          hi: "4 × 3 की एक परत: 12 घन। 24 वह दूसरी परत जोड़ देता है जो डिब्बे में है ही नहीं; 7 भुजाएँ जोड़ता है।",
          mr: "4 × 3 चा एक थर: 12 घन. 24 खोक्यात नसलेला दुसरा थर मानते; 7 बाजू मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A 5 kg bag of rice is shared equally among 4 families. How many GRAMS does each family get?",
          hi: "5 किलो चावल की थैली 4 परिवारों में बराबर बँटी। हर परिवार को कितने ग्राम मिले?",
          mr: "5 किलो तांदळाची पिशवी 4 कुटुंबांत सारखी वाटली. प्रत्येक कुटुंबाला किती ग्रॅम मिळाले?",
        },
        answer: 1250,
        wrong: [1200, 125, 2500],
        checkExpr: "5000/4",
        fmt: g,
        solution: {
          en: "5 kg = 5000 g, and 5000 ÷ 4 = 1250 g — a kilo and a quarter each. 125 loses a zero; 1200 rounds the quarter kilo away.",
          hi: "5 किलो = 5000 ग्राम, और 5000 ÷ 4 = 1250 ग्राम — सवा किलो हर एक को। 125 शून्य खोता है; 1200 पाव किलो गोल कर जाता है।",
          mr: "5 किलो = 5000 ग्रॅम, आणि 5000 ÷ 4 = 1250 ग्रॅम — सव्वा किलो प्रत्येकाला. 125 शून्य गमावते; 1200 पाव किलो गोल करून टाकते.",
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
          en: "A box is 5 cm long, 4 cm wide and 2 cm high. What is its volume?",
          hi: "एक डिब्बा 5 सेमी लंबा, 4 सेमी चौड़ा और 2 सेमी ऊँचा है। उसका आयतन कितना?",
          mr: "एक खोके 5 सेमी लांब, 4 सेमी रुंद आणि 2 सेमी उंच आहे. त्याचे आकारमान किती?",
        },
        answer: 40,
        wrong: [11, 20, 22],
        checkExpr: "5*4*2",
        fmt: cucm,
        solution: {
          en: "Volume multiplies all three: 5 × 4 × 2 = 40 cubic cm — a floor of 20 cubes, two layers of it. 20 stops after the floor; 11 adds the sides.",
          hi: "आयतन तीनों को गुणता है: 5 × 4 × 2 = 40 घन सेमी — 20 घनों का फ़र्श, उसकी दो परतें। 20 फ़र्श पर रुक जाता है; 11 भुजाएँ जोड़ता है।",
          mr: "आकारमान तिन्हींना गुणते: 5 × 4 × 2 = 40 घन सेमी — 20 घनांचा तळ, त्याचे दोन थर. 20 तळावरच थांबते; 11 बाजू मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A water tank holds 500 litres and a bucket carries 10 litres. How many bucketfuls empty the tank?",
          hi: "टंकी में 500 लीटर पानी है और बाल्टी 10 लीटर उठाती है। टंकी ख़ाली करने में कितनी बाल्टियाँ लगेंगी?",
          mr: "टाकीत 500 लिटर पाणी आहे आणि बादली 10 लिटर उचलते. टाकी रिकामी करायला किती बादल्या लागतील?",
        },
        answer: 50,
        wrong: [5, 490, 55],
        checkExpr: "500/10",
        solution: {
          en: "500 ÷ 10 = 50 buckets. 5 loses a zero; 490 subtracts one bucket instead of counting how many times the bucket dips.",
          hi: "500 ÷ 10 = 50 बाल्टियाँ। 5 शून्य खोता है; 490 यह गिनने की जगह कि बाल्टी कितनी बार डूबेगी, एक बाल्टी घटा देता है।",
          mr: "500 ÷ 10 = 50 बादल्या. 5 शून्य गमावते; 490 बादली किती वेळा बुडेल हे मोजण्याऐवजी एक बादली वजा करते.",
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
          en: "One litre of water weighs one kilogram. Ignoring the can itself, what does the water in a full 15-litre can weigh?",
          hi: "एक लीटर पानी एक किलो का होता है। कनस्तर का वज़न छोड़ दें, तो भरे 15 लीटर कनस्तर का पानी कितने का है?",
          mr: "एक लिटर पाणी एक किलोचे असते. डब्याचे वजन सोडले, तर भरलेल्या 15 लिटर डब्यातले पाणी किती वजनाचे?",
        },
        answer: 15,
        wrong: [30, 1, 150],
        checkExpr: "15*1",
        fmt: kg,
        solution: {
          en: "Litre for kilo: 15 × 1 = 15 kg — water's beautiful one-to-one rule. 150 invents a rate of ten; the rule costs nothing to remember and weighs every bucket you will ever lift.",
          hi: "लीटर पर किलो: 15 × 1 = 15 किलो — पानी का सुंदर एक-का-एक नियम। 150 दस का भाव गढ़ लेता है; यह नियम याद रखने में मुफ़्त है और आपकी हर उठाई बाल्टी तौल देता है।",
          mr: "लिटरामागे किलो: 15 × 1 = 15 किलो — पाण्याचा सुंदर एकास-एक नियम. 150 दहाचा भाव रचते; हा नियम लक्षात ठेवायला फुकट आहे आणि तुम्ही उचलाल ती प्रत्येक बादली तोलतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A stone dropped into the jar raises the water from 200 mL to 260 mL. What is the stone's volume?",
          hi: "जार में पत्थर डालने पर पानी 200 मिली से 260 मिली हो गया। पत्थर का आयतन कितना?",
          mr: "भांड्यात दगड टाकल्यावर पाणी 200 मिलीवरून 260 मिली झाले. दगडाचे आकारमान किती?",
        },
        answer: 60,
        wrong: [260, 460, 40],
        checkExpr: "260-200",
        fmt: mlF,
        solution: {
          en: "The rise tells the volume: 260 − 200 = 60 mL. An odd-shaped stone that no ruler could measure just measured itself in water — that is the jar's magic.",
          hi: "चढ़ाव ही आयतन बताता है: 260 − 200 = 60 मिली। जिस टेढ़े-मेढ़े पत्थर को कोई स्केल नहीं नाप सकता था, उसने पानी में ख़ुद को नाप लिया — यही जार का जादू है।",
          mr: "चढच आकारमान सांगते: 260 − 200 = 60 मिली. कोणत्याही पट्टीला न मोजता येणाऱ्या वेड्यावाकड्या दगडाने पाण्यात स्वतःला मोजले — हीच भांड्याची जादू.",
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
          en: "How many 2-cm cubes pack exactly into a box 6 cm long, 4 cm wide and 2 cm high?",
          hi: "6 सेमी लंबे, 4 सेमी चौड़े और 2 सेमी ऊँचे डिब्बे में 2-2 सेमी के कितने घन ठीक-ठीक समाएँगे?",
          mr: "6 सेमी लांब, 4 सेमी रुंद आणि 2 सेमी उंच खोक्यात 2-2 सेमीचे किती घन नेमके मावतील?",
        },
        answer: 6,
        wrong: [48, 12, 8],
        checkExpr: "6*4*2/(2*2*2)",
        fmt: cubes,
        solution: {
          en: "The box holds 6 × 4 × 2 = 48 cubic cm, and each 2-cm cube takes 2 × 2 × 2 = 8: 48 ÷ 8 = 6 cubes — 3 along, 2 across, 1 layer. 48 forgets the cubes are bigger than a centimetre; 12 halves only one direction.",
          hi: "डिब्बे में 6 × 4 × 2 = 48 घन सेमी, और हर 2-सेमी घन 2 × 2 × 2 = 8 लेता है: 48 ÷ 8 = 6 घन — 3 लंबाई में, 2 चौड़ाई में, 1 परत। 48 भूलता है कि घन सेंटीमीटर से बड़े हैं; 12 एक ही दिशा आधी करता है।",
          mr: "खोक्यात 6 × 4 × 2 = 48 घन सेमी, आणि प्रत्येक 2-सेमी घन 2 × 2 × 2 = 8 घेतो: 48 ÷ 8 = 6 घन — 3 लांबीत, 2 रुंदीत, 1 थर. 48 विसरते की घन सेंटिमीटराहून मोठे आहेत; 12 एकाच दिशेला अर्धे करते.",
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
          en: "The circus poster boasts an elephant of 4000 kg. The godown holds 80 sacks of grain, 50 kg each. By how many kilograms does the elephant outweigh the sacks?",
          hi: "सर्कस का पोस्टर 4000 किलो के हाथी की डींग हाँकता है। गोदाम में 50-50 किलो की 80 बोरियाँ हैं। हाथी बोरियों से कितने किलो भारी है?",
          mr: "सर्कशीचे पोस्टर 4000 किलोच्या हत्तीची फुशारकी मारते. गोदामात 50-50 किलोची 80 पोती आहेत. हत्ती पोत्यांहून किती किलोंनी जड आहे?",
        },
        answer: 0,
        wrong: [400, 50, 100],
        checkExpr: "4000-80*50",
        fmt: kg,
        solution: {
          en: "The sacks total 80 × 50 = 4000 kg — exactly the elephant. The difference is 0: an elephant is eighty sacks of grain standing on four legs. Huge numbers stop feeling huge once you weigh them against something you can stack.",
          hi: "बोरियाँ कुल 80 × 50 = 4000 किलो — ठीक हाथी जितनी। अंतर 0 है: हाथी चार टाँगों पर खड़ी अस्सी बोरियाँ है। बड़ी संख्याएँ तब बड़ी नहीं लगतीं जब उन्हें किसी जमाने लायक़ चीज़ से तौल लिया जाए।",
          mr: "पोती एकूण 80 × 50 = 4000 किलो — नेमकी हत्तीइतकी. फरक 0: हत्ती म्हणजे चार पायांवर उभी ऐंशी पोती. मोठे आकडे रचता येणाऱ्या वस्तूशी तोलले की मोठे वाटेनासे होतात.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 5,
      chapter: "Chapter 14 — How Big? How Heavy?",
      name: "How Big? How Heavy?",
      slug: "maths-5-how-big-how-heavy",
      summary: "Volume by rising water and stacked cubes, weight by litres and sacks — and an elephant weighed in grain.",
      position: 14,
      translations: {
        hi: {
          name: "कितना बड़ा? कितना भारी?",
          summary: "चढ़ते पानी और जमे घनों से आयतन, लीटरों और बोरियों से वज़न — और अनाज में तौला हाथी।",
        },
        mr: {
          name: "केवढे मोठे? किती जड?",
          summary: "चढत्या पाण्याने आणि रचलेल्या घनांनी आकारमान, लिटरांनी आणि पोत्यांनी वजन — आणि धान्यात तोललेला हत्ती.",
        },
      },
    },
    qs,
  );
}

export const G5_MATHS: TopicFileOut[] = [
  theFishTale(),
  shapesAndAngles(),
  howManySquares(),
  partsAndWholes(),
  doesItLookTheSame(),
  multiplesAndFactors(),
  canYouSeeThePattern(),
  mappingYourWay(),
  boxesAndSketches(),
  tenthsAndHundredths(),
  areaAndItsBoundary(),
  smartCharts5(),
  waysToMultiplyAndDivide(),
  howBigHowHeavy(),
];
