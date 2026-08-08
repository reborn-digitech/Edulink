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

export const G5_MATHS: TopicFileOut[] = [
  theFishTale(),
  shapesAndAngles(),
  howManySquares(),
  partsAndWholes(),
  multiplesAndFactors(),
  tenthsAndHundredths(),
];
