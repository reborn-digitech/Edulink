/**
 * Class 7 Maths — NCERT, chapter by chapter. Signs join the arithmetic here:
 * negatives multiply and cancel in pairs, fractions learn to divide, equations
 * balance, and angles pair off to 90 and 180. Same discipline as before —
 * every question authored individually, every computable answer proven by a
 * checkExpr, every wrong option a real twelve-year-old's mistake.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { L, OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ, rupees } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 7)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/** Degree rendering, shared by the angle chapters. */
const deg = (n: number): L => ({ en: `${n}°`, hi: `${n}°`, mr: `${n}°` });

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Integers (all four operations below zero)                     */
/* ------------------------------------------------------------------------- */
function integers(): TopicFileOut {
  const rand = rng("maths-7-integers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "(−7) + (−5) = ?",
          hi: "(−7) + (−5) कितना है?",
          mr: "(−7) + (−5) किती?",
        },
        answer: -12,
        wrong: [-2, 2, 12],
        checkExpr: "0-7-5",
        solution: {
          en: "Two debts join: 7 below zero and 5 more below make 12 below — so −12. −2 subtracts instead of adding the debts; 12 forgets both signs.",
          hi: "दो उधार जुड़ते हैं: शून्य से 7 नीचे और 5 और नीचे यानी 12 नीचे — अतः −12। −2 उधार जोड़ने की जगह घटाता है; 12 दोनों चिह्न भूल जाता है।",
          mr: "दोन उधाऱ्या जुळतात: शून्याखाली 7 आणि आणखी 5 खाली म्हणजे 12 खाली — म्हणून −12. −2 उधाऱ्या जोडण्याऐवजी वजा करते; 12 दोन्ही चिन्हे विसरते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 6 − 10?",
          hi: "6 − 10 कितना है?",
          mr: "6 − 10 किती?",
        },
        answer: -4,
        wrong: [4, -16, 16],
        checkExpr: "6-10",
        solution: {
          en: "Six steps forward, ten back: you cross zero and stop 4 below it — −4. 4 forgets which number was bigger; −16 adds instead of subtracting.",
          hi: "छह क़दम आगे, दस पीछे: आप शून्य पार कर उससे 4 नीचे रुकते हैं — −4। 4 भूल जाता है कि बड़ी संख्या कौन थी; −16 घटाने की जगह जोड़ देता है।",
          mr: "सहा पावले पुढे, दहा मागे: शून्य ओलांडून त्याच्या 4 खाली थांबता — −4. 4 विसरतो की मोठी संख्या कोणती होती; −16 वजा करण्याऐवजी बेरीज करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Which integer is the additive opposite of −9 — the number that cancels it to zero?",
          hi: "−9 का योज्य विलोम कौन-सा पूर्णांक है — वह संख्या जो उसे शून्य कर दे?",
          mr: "−9 चा बेरीज-विरुद्धांक कोणता पूर्णांक — त्याला शून्य करणारी संख्या?",
        },
        answer: 9,
        wrong: [-9, 0, 18],
        solution: {
          en: "−9 + 9 = 0: the opposite sits 9 steps on the OTHER side of zero. −9 is the number itself; 18 measures the distance between the pair, not the partner.",
          hi: "−9 + 9 = 0: विलोम शून्य के दूसरी ओर 9 क़दम पर बैठता है। −9 तो संख्या स्वयं है; 18 जोड़ी के बीच की दूरी नापता है, साथी को नहीं।",
          mr: "−9 + 9 = 0: विरुद्धांक शून्याच्या दुसऱ्या बाजूला 9 पावलांवर बसतो. −9 ही तर संख्या स्वतःच; 18 जोडीतील अंतर मोजते, जोडीदाराला नाही.",
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
          en: "(−4) × 6 = ?",
          hi: "(−4) × 6 कितना है?",
          mr: "(−4) × 6 किती?",
        },
        answer: -24,
        wrong: [24, -10, -2],
        checkExpr: "(0-4)*6",
        solution: {
          en: "Negative times positive is negative: 4 × 6 = 24, and the single minus survives — −24. 24 drops the sign; −10 adds instead of multiplying.",
          hi: "ऋण गुणा धन ऋण होता है: 4 × 6 = 24, और अकेला ऋण-चिह्न बचा रहता है — −24। 24 चिह्न गिरा देता है; −10 गुणा की जगह जोड़ता है।",
          mr: "ऋण गुणिले धन ऋणच: 4 × 6 = 24, आणि एकटे ऋण-चिन्ह टिकते — −24. 24 चिन्ह गाळतो; −10 गुणाकाराऐवजी बेरीज करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "(−36) ÷ (−9) = ?",
          hi: "(−36) ÷ (−9) कितना है?",
          mr: "(−36) ÷ (−9) किती?",
        },
        answer: 4,
        wrong: [-4, 6, -6],
        checkExpr: "(0-36)/(0-9)",
        solution: {
          en: "Same signs divide to a positive: 36 ÷ 9 = 4. −4 keeps a minus the two minuses already cancelled; 6 divides by six instead of nine.",
          hi: "समान चिह्न भाग देकर धन देते हैं: 36 ÷ 9 = 4। −4 वह ऋण रखे बैठा है जिसे दोनों ऋण पहले ही काट चुके; 6 नौ की जगह छह से भाग देता है।",
          mr: "सारखी चिन्हे भागून धन देतात: 36 ÷ 9 = 4. −4 ते ऋण धरून बसतो जे दोन ऋणांनी आधीच रद्द केले; 6 नऊऐवजी सहाने भागतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "At noon Srinagar was at 3 °C; by midnight the temperature had fallen 8 degrees. What did the thermometer show at midnight?",
          hi: "दोपहर में श्रीनगर 3 °C पर था; आधी रात तक तापमान 8 डिग्री गिर गया। आधी रात को थर्मामीटर क्या दिखाता है?",
          mr: "दुपारी श्रीनगर 3 °C होते; मध्यरात्रीपर्यंत तापमान 8 अंशांनी घसरले. मध्यरात्री थर्मामीटर काय दाखवतो?",
        },
        answer: -5,
        wrong: [5, -11, 11],
        checkExpr: "3-8",
        solution: {
          en: "3 − 8 = −5: three degrees of the fall reach zero, five more go below. 5 forgets the minus; −11 makes the noon reading negative too.",
          hi: "3 − 8 = −5: गिरावट के तीन डिग्री शून्य तक पहुँचते हैं, पाँच और नीचे जाते हैं। 5 ऋण-चिह्न भूल जाता है; −11 दोपहर के पाठ्यांक को भी ऋण बना देता है।",
          mr: "3 − 8 = −5: घसरणीचे तीन अंश शून्यापर्यंत पोहोचतात, आणखी पाच खाली जातात. 5 ऋण-चिन्ह विसरतो; −11 दुपारचे वाचनही ऋण करून टाकते.",
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
          en: "(−2) × (−3) × (−4) = ?",
          hi: "(−2) × (−3) × (−4) कितना है?",
          mr: "(−2) × (−3) × (−4) किती?",
        },
        answer: -24,
        wrong: [24, -9, 9],
        checkExpr: "(0-2)*(0-3)*(0-4)",
        solution: {
          en: "An odd count of minus signs leaves a minus: 2 × 3 × 4 = 24, and three negatives make it −24. 24 counts the minuses as if they were even; −9 adds the numbers.",
          hi: "विषम संख्या में ऋण-चिह्न एक ऋण छोड़ते हैं: 2 × 3 × 4 = 24, और तीन ऋण उसे −24 बनाते हैं। 24 ऋणों को सम मानकर गिनता है; −9 संख्याएँ जोड़ देता है।",
          mr: "विषम संख्येची ऋण-चिन्हे एक ऋण उरवतात: 2 × 3 × 4 = 24, आणि तीन ऋणांनी ते −24 होते. 24 ऋणे समसंख्य असल्यासारखी मोजतो; −9 संख्यांची बेरीज करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A submarine waits at −250 m, that is 250 m below sea level. It rises 75 m. Where is it now?",
          hi: "एक पनडुब्बी −250 मीटर पर है, यानी समुद्र तल से 250 मीटर नीचे। वह 75 मीटर ऊपर उठती है। अब वह कहाँ है?",
          mr: "एक पाणबुडी −250 मीटरवर आहे, म्हणजे समुद्रसपाटीपासून 250 मीटर खाली. ती 75 मीटर वर येते. आता ती कुठे आहे?",
        },
        answer: -175,
        wrong: [-325, 175, -185],
        checkExpr: "75-250",
        solution: {
          en: "Rising adds: −250 + 75 = −175, still underwater. −325 dives deeper by subtracting the rise; 175 surfaces by dropping the sign.",
          hi: "ऊपर उठना जोड़ है: −250 + 75 = −175, अब भी पानी के नीचे। −325 चढ़ाई घटाकर और गहरे उतर जाता है; 175 चिह्न गिराकर सतह पर आ जाता है।",
          mr: "वर येणे म्हणजे बेरीज: −250 + 75 = −175, अजूनही पाण्याखाली. −325 चढाई वजा करून अधिक खोल जातो; 175 चिन्ह गाळून पृष्ठभागी येतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What must be added to −13 to get 20?",
          hi: "−13 में क्या जोड़ें कि 20 मिले?",
          mr: "−13 मध्ये काय मिळवले असता 20 मिळेल?",
        },
        answer: 33,
        wrong: [7, -33, -7],
        checkExpr: "20+13",
        solution: {
          en: "From −13 the journey climbs 13 steps to zero and 20 beyond: 33 in all. 7 measures only 20 − 13, as if the start were ABOVE zero.",
          hi: "−13 से यात्रा 13 क़दम चढ़कर शून्य तक और 20 उसके आगे जाती है: कुल 33। 7 केवल 20 − 13 नापता है, मानो शुरुआत शून्य के ऊपर से हो।",
          mr: "−13 पासून प्रवास 13 पावले चढून शून्यापर्यंत आणि पुढे 20 जातो: एकूण 33. 7 फक्त 20 − 13 मोजतो, जणू सुरुवात शून्याच्या वर होती.",
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
          en: "A quiz gives +5 for each right answer and −2 for each wrong one. Ridhima answers 7 right and 4 wrong. What is her score?",
          hi: "एक क्विज़ में हर सही उत्तर पर +5 और हर ग़लत पर −2 मिलते हैं। रिधिमा 7 सही और 4 ग़लत करती है। उसका स्कोर क्या है?",
          mr: "एका प्रश्नमंजुषेत प्रत्येक बरोबर उत्तराला +5 आणि चुकीला −2 मिळतात. रिधिमा 7 बरोबर आणि 4 चूक करते. तिचे गुण किती?",
        },
        answer: 27,
        wrong: [35, 43, 3],
        checkExpr: "5*7-2*4",
        solution: {
          en: "7 × 5 = 35 earned, 4 × 2 = 8 lost: 35 − 8 = 27. 35 ignores the penalty; 43 REWARDS the wrong answers instead of charging for them.",
          hi: "7 × 5 = 35 कमाए, 4 × 2 = 8 गँवाए: 35 − 8 = 27। 35 दंड को अनदेखा करता है; 43 ग़लत उत्तरों का शुल्क लेने की जगह उन्हें इनाम दे देता है।",
          mr: "7 × 5 = 35 कमावले, 4 × 2 = 8 गमावले: 35 − 8 = 27. 35 दंडाकडे दुर्लक्ष करतो; 43 चुकीच्या उत्तरांचे शुल्क घेण्याऐवजी त्यांना बक्षीस देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Multiply −1 by itself 15 times. What comes out?",
          hi: "−1 को अपने आप से 15 बार गुणा कीजिए। क्या निकलता है?",
          mr: "−1 ला स्वतःशी 15 वेळा गुणा. काय येते?",
        },
        answer: -1,
        wrong: [1, -15, 15],
        solution: {
          en: "Each PAIR of minus signs cancels; 15 is odd, so one minus survives: −1. 1 needs an even count of factors; −15 multiplies the count itself.",
          hi: "ऋण-चिह्नों की हर जोड़ी कट जाती है; 15 विषम है, अतः एक ऋण बच रहता है: −1। 1 के लिए सम संख्या में गुणनखंड चाहिए; −15 गिनती को ही गुणा कर बैठता है।",
          mr: "ऋण-चिन्हांची प्रत्येक जोडी रद्द होते; 15 विषम आहे, म्हणून एक ऋण उरते: −1. 1 साठी समसंख्य घटक हवेत; −15 मोजणीलाच गुणून टाकतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "(−8) × 25 × (−4) = ?",
          hi: "(−8) × 25 × (−4) कितना है?",
          mr: "(−8) × 25 × (−4) किती?",
        },
        answer: 800,
        wrong: [-800, 200, -200],
        checkExpr: "(0-8)*25*(0-4)",
        solution: {
          en: "Pair the friendly two first: 25 × (−4) = −100, then (−8) × (−100) = 800 — the two minuses cancel. −800 miscounts the signs; 200 forgets the ×(−4) entirely.",
          hi: "पहले सुविधाजनक जोड़ी बनाइए: 25 × (−4) = −100, फिर (−8) × (−100) = 800 — दोनों ऋण कट जाते हैं। −800 चिह्न ग़लत गिनता है; 200 ×(−4) को पूरा ही भूल जाता है।",
          mr: "आधी सोयीची जोडी करा: 25 × (−4) = −100, मग (−8) × (−100) = 800 — दोन्ही ऋणे रद्द होतात. −800 चिन्हे चुकीची मोजतो; 200 ×(−4) पूर्णच विसरतो.",
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
          en: "A mine lift starts 10 m ABOVE the ground and descends 6 m every minute. How many minutes does it take to reach −350 m?",
          hi: "खदान की लिफ़्ट ज़मीन से 10 मीटर ऊपर से चलकर हर मिनट 6 मीटर उतरती है। −350 मीटर तक पहुँचने में कितने मिनट लगेंगे?",
          mr: "खाणीची लिफ्ट जमिनीच्या 10 मीटर वरून निघून दर मिनिटाला 6 मीटर खाली जाते. −350 मीटरपर्यंत पोहोचायला किती मिनिटे लागतील?",
        },
        answer: 60,
        wrong: [58, 70, 56],
        checkExpr: "(10+350)/6",
        solution: {
          en: "The drop runs from +10 down to −350: a fall of 360 m. At 6 m a minute, 360 ÷ 6 = 60 minutes. 58 divides 350 alone, forgetting the lift starts above the ground.",
          hi: "उतराई +10 से −350 तक है: कुल 360 मीटर की गिरावट। 6 मीटर प्रति मिनट से 360 ÷ 6 = 60 मिनट। 58 अकेले 350 को भाग देता है, भूलकर कि लिफ़्ट ज़मीन के ऊपर से चली थी।",
          mr: "उतार +10 पासून −350 पर्यंत आहे: एकूण 360 मीटरची घसरण. मिनिटाला 6 मीटरने 360 ÷ 6 = 60 मिनिटे. 58 एकट्या 350 ला भागतो, लिफ्ट जमिनीच्या वरून निघाली हे विसरून.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A test has 20 questions: +3 for a right answer, −1 for a wrong one. Gauri attempts all of them and scores 40. How many did she get right?",
          hi: "परीक्षा में 20 प्रश्न हैं: सही पर +3, ग़लत पर −1। गौरी सभी हल करती है और 40 अंक पाती है। उसके कितने उत्तर सही थे?",
          mr: "परीक्षेत 20 प्रश्न आहेत: बरोबरला +3, चुकीला −1. गौरी सर्व सोडवते आणि 40 गुण मिळवते. तिची किती उत्तरे बरोबर होती?",
        },
        answer: 15,
        wrong: [10, 12, 18],
        checkExpr: "(40+20)/4",
        solution: {
          en: "With c right answers, 3c − (20 − c) = 40, so 4c = 60 and c = 15. Check: 45 earned, 5 lost, 40 kept ✓. 10 right would score only 30 − 10 = 20.",
          hi: "c सही उत्तर मानें तो 3c − (20 − c) = 40, अतः 4c = 60 और c = 15। जाँच: 45 कमाए, 5 गँवाए, 40 बचे ✓। 10 सही होते तो केवल 30 − 10 = 20 मिलते।",
          mr: "c बरोबर उत्तरे मानली तर 3c − (20 − c) = 40, म्हणून 4c = 60 आणि c = 15. पडताळणी: 45 कमावले, 5 गमावले, 40 उरले ✓. 10 बरोबर असती तर फक्त 30 − 10 = 20 मिळाले असते.",
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
          en: "Take a = −12 and b = −5. What is a − (−b)?",
          hi: "मान लीजिए a = −12 और b = −5। a − (−b) कितना है?",
          mr: "समजा a = −12 आणि b = −5. a − (−b) किती?",
        },
        answer: -17,
        wrong: [-7, 7, 17],
        checkExpr: "0-12-5",
        solution: {
          en: "Careful: −(−b) is b itself, and b is −5. So a − (−b) = −12 + (−5) = −17. −7 treats −(−b) as +5 — but the double minus undoes only ONE minus, and b carried its own.",
          hi: "सावधान: −(−b) स्वयं b है, और b = −5। अतः a − (−b) = −12 + (−5) = −17। −7 इसे +5 मान लेता है — पर दोहरा ऋण केवल एक ऋण काटता है, और b अपना ऋण साथ लाया था।",
          mr: "सावध: −(−b) म्हणजे b स्वतः, आणि b = −5. म्हणून a − (−b) = −12 + (−5) = −17. −7 त्याला +5 मानतो — पण दुहेरी ऋण फक्त एकच ऋण रद्द करते, आणि b चे स्वतःचे ऋण सोबत होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Two integers add to −6 and multiply to −27. What is the LARGER of the two?",
          hi: "दो पूर्णांकों का योग −6 और गुणनफल −27 है। दोनों में बड़ा कौन-सा है?",
          mr: "दोन पूर्णांकांची बेरीज −6 आणि गुणाकार −27 आहे. दोघांत मोठा कोणता?",
        },
        answer: 3,
        wrong: [-9, 9, -3],
        solution: {
          en: "A negative product needs one sign of each. Among factor pairs of 27, try 3 and −9: they add to −6 ✓. The larger is 3, for −9 lies far below it. The pair 9 and −3 multiplies right but adds to +6 — the mirror trap.",
          hi: "ऋण गुणनफल के लिए एक-एक चिह्न चाहिए। 27 के गुणनखंड-युग्मों में 3 और −9 आज़माइए: योग −6 ✓। बड़ा 3 है, क्योंकि −9 उससे बहुत नीचे है। 9 और −3 की जोड़ी गुणा तो सही करती है पर योग +6 देती है — दर्पण-जाल।",
          mr: "ऋण गुणाकारासाठी एक-एक चिन्ह लागते. 27 च्या घटक-जोड्यांत 3 आणि −9 पाहा: बेरीज −6 ✓. मोठा 3 आहे, कारण −9 त्याच्या खूप खाली आहे. 9 आणि −3 ही जोडी गुणाकार बरोबर करते पण बेरीज +6 देते — आरशाचा सापळा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 1 — Integers",
      name: "Integers",
      slug: "maths-7-integers",
      summary:
        "Signs join the arithmetic: debts add, minuses multiply and cancel in pairs, submarines and mine lifts count below zero — and a double minus undoes only one of itself.",
      position: 1,
      translations: {
        hi: {
          name: "पूर्णांक",
          summary:
            "चिह्न अंकगणित में उतरते हैं: उधार जुड़ते हैं, ऋण-चिह्न जोड़ियों में कटते हैं, पनडुब्बियाँ और खदान-लिफ़्टें शून्य के नीचे गिनती हैं — और दोहरा ऋण अपने में से एक ही को काटता है।",
        },
        mr: {
          name: "पूर्णांक",
          summary:
            "चिन्हे अंकगणितात उतरतात: उधाऱ्या जुळतात, ऋण-चिन्हे जोडीने रद्द होतात, पाणबुड्या आणि खाण-लिफ्ट शून्याखाली मोजतात — आणि दुहेरी ऋण स्वतःतील एकालाच रद्द करते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Fractions and Decimals (× and ÷ arrive)                       */
/* ------------------------------------------------------------------------- */
function fractionsAndDecimals(): TopicFileOut {
  const rand = rng("maths-7-fractions-and-decimals");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 3/4 of 20?",
          hi: "20 का 3/4 कितना है?",
          mr: "20 चा 3/4 किती?",
        },
        answer: 15,
        wrong: [12, 5, 60],
        checkExpr: "3*20/4",
        solution: {
          en: "'Of' means multiply: 20 ÷ 4 = 5 in each quarter, and three quarters make 15. 5 stops at one quarter; 60 multiplies by 3 and forgets to divide.",
          hi: "'का' यानी गुणा: 20 ÷ 4 = 5 प्रति चौथाई, और तीन चौथाई मिलकर 15। 5 एक चौथाई पर रुक जाता है; 60 तीन से गुणा कर भाग देना भूल जाता है।",
          mr: "'चा' म्हणजे गुणाकार: 20 ÷ 4 = 5 प्रत्येक चतुर्थांशात, आणि तीन चतुर्थांश मिळून 15. 5 एका चतुर्थांशावर थांबतो; 60 तिपटीने गुणून भागायचे विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 0.7 × 10?",
          hi: "0.7 × 10 कितना है?",
          mr: "0.7 × 10 किती?",
        },
        answer: 7,
        wrong: [0.07, 70, 7.1],
        checkExpr: "70/10",
        solution: {
          en: "Multiplying by 10 slides the decimal point one step RIGHT: 0.7 becomes 7. 0.07 slides it the wrong way; 70 slides two steps for one ten.",
          hi: "10 से गुणा दशमलव बिंदु को एक क़दम दाएँ खिसकाता है: 0.7 बनता है 7। 0.07 उसे उल्टी दिशा में खिसकाता है; 70 एक दस के लिए दो क़दम चल देता है।",
          mr: "10 ने गुणल्यास दशांश बिंदू एक पाऊल उजवीकडे सरकतो: 0.7 चा होतो 7. 0.07 त्याला उलट दिशेने सरकवतो; 70 एका दहासाठी दोन पावले टाकतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many half-metre pieces can be cut from 5 metres of ribbon?",
          hi: "5 मीटर रिबन से आधे-आधे मीटर के कितने टुकड़े काटे जा सकते हैं?",
          mr: "5 मीटर रिबिनीतून अर्ध्या-अर्ध्या मीटराचे किती तुकडे कापता येतील?",
        },
        answer: 10,
        wrong: [2.5, 5, 20],
        checkExpr: "5/0.5",
        solution: {
          en: "Dividing by a half asks how many halves FIT: each metre holds 2, so 5 metres hold 10. 2.5 multiplies by ½ instead of dividing — dividing by a fraction makes the answer BIGGER.",
          hi: "आधे से भाग पूछता है कि कितने आधे समाते हैं: हर मीटर में 2, अतः 5 मीटर में 10। 2.5 भाग की जगह ½ से गुणा कर बैठता है — भिन्न से भाग उत्तर को बड़ा करता है।",
          mr: "अर्ध्याने भागणे विचारते की किती अर्धे मावतात: प्रत्येक मीटरात 2, म्हणून 5 मीटरात 10. 2.5 भागाऐवजी ½ ने गुणतो — अपूर्णांकाने भागल्यास उत्तर मोठे होते.",
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
          en: "What is 2/5 × 15/4? (Answer as a decimal.)",
          hi: "2/5 × 15/4 कितना है? (उत्तर दशमलव में।)",
          mr: "2/5 × 15/4 किती? (उत्तर दशांशात.)",
        },
        answer: 1.5,
        wrong: [1.2, 3.75, 6],
        checkExpr: "2*15/(5*4)",
        solution: {
          en: "Tops multiply and bottoms multiply: 30/20 = 3/2 = 1.5. 6 multiplies only the tops; 3.75 is 15/4 left untouched, as if 2/5 changed nothing.",
          hi: "अंश से अंश, हर से हर: 30/20 = 3/2 = 1.5। 6 केवल अंश गुणा करता है; 3.75 अनछुआ 15/4 है, मानो 2/5 ने कुछ बदला ही नहीं।",
          mr: "अंशाशी अंश, छेदाशी छेद: 30/20 = 3/2 = 1.5. 6 फक्त अंश गुणतो; 3.75 म्हणजे जसाच्या तसा 15/4, जणू 2/5 ने काहीच बदलले नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 2.3 × 4?",
          hi: "2.3 × 4 कितना है?",
          mr: "2.3 × 4 किती?",
        },
        answer: 9.2,
        wrong: [8.2, 9.12, 92],
        checkExpr: "2.3*4",
        solution: {
          en: "23 × 4 = 92, and the one decimal place returns: 9.2. 92 forgets the point; 8.2 multiplies only the whole part (2 × 4 = 8) and glues the .2 on unearned.",
          hi: "23 × 4 = 92, और एक दशमलव स्थान लौट आता है: 9.2। 92 बिंदु भूल जाता है; 8.2 केवल पूर्णांश को गुणा कर .2 वैसे ही चिपका देता है।",
          mr: "23 × 4 = 92, आणि एक दशांश स्थान परत येते: 9.2. 92 बिंदू विसरतो; 8.2 फक्त पूर्णांक गुणून .2 तसाच चिकटवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A ribbon 3/4 metre long is cut into 3 equal pieces. How long is each piece, in metres (as a decimal)?",
          hi: "3/4 मीटर लंबा रिबन 3 बराबर टुकड़ों में काटा जाता है। हर टुकड़ा कितने मीटर का है (दशमलव में)?",
          mr: "3/4 मीटर लांब रिबीन 3 समान तुकड्यांत कापली. प्रत्येक तुकडा किती मीटर (दशांशात)?",
        },
        answer: 0.25,
        wrong: [2.25, 0.5, 1.25],
        checkExpr: "3/(4*3)",
        solution: {
          en: "3/4 ÷ 3 = 1/4 = 0.25 m: the three quarters share out one each. 2.25 multiplies by 3 instead of sharing; 0.5 halves instead of taking thirds.",
          hi: "3/4 ÷ 3 = 1/4 = 0.25 मीटर: तीन चौथाइयाँ एक-एक बँट जाती हैं। 2.25 बाँटने की जगह 3 से गुणा करता है; 0.5 तिहाई की जगह आधा कर देता है।",
          mr: "3/4 ÷ 3 = 1/4 = 0.25 मीटर: तीन चतुर्थांश एक-एक वाटले जातात. 2.25 वाटण्याऐवजी 3 ने गुणतो; 0.5 तृतीयांशाऐवजी अर्धे करतो.",
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
          en: "What is 5.6 ÷ 0.8?",
          hi: "5.6 ÷ 0.8 कितना है?",
          mr: "5.6 ÷ 0.8 किती?",
        },
        answer: 7,
        wrong: [0.7, 70, 4.8],
        checkExpr: "56/8",
        solution: {
          en: "Slide both points one place and the question turns whole: 56 ÷ 8 = 7. 0.7 shifts only the answer; 4.8 subtracts instead of dividing.",
          hi: "दोनों बिंदु एक-एक स्थान खिसकाइए और प्रश्न पूर्ण बन जाता है: 56 ÷ 8 = 7। 0.7 केवल उत्तर को खिसकाता है; 4.8 भाग की जगह घटा देता है।",
          mr: "दोन्ही बिंदू एक-एक स्थान सरकवा आणि प्रश्न पूर्ण होतो: 56 ÷ 8 = 7. 0.7 फक्त उत्तराला सरकवतो; 4.8 भागाऐवजी वजा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A tabletop measures 2.5 m by 1.5 m. What is its area in square metres?",
          hi: "एक मेज़ की सतह 2.5 मीटर × 1.5 मीटर है। क्षेत्रफल वर्ग मीटर में कितना?",
          mr: "टेबलाचा पृष्ठभाग 2.5 मीटर × 1.5 मीटर आहे. क्षेत्रफळ चौरस मीटरमध्ये किती?",
        },
        answer: 3.75,
        wrong: [4, 8, 37.5],
        checkExpr: "2.5*1.5",
        solution: {
          en: "Area multiplies the sides: 2.5 × 1.5 = 3.75 m². 4 ADDS them; 8 walks the whole perimeter; 37.5 lets the decimal point slip a place.",
          hi: "क्षेत्रफल भुजाओं का गुणा है: 2.5 × 1.5 = 3.75 वर्ग मीटर। 4 उन्हें जोड़ देता है; 8 पूरा परिमाप नाप आता है; 37.5 में दशमलव बिंदु एक स्थान फिसल जाता है।",
          mr: "क्षेत्रफळ म्हणजे बाजूंचा गुणाकार: 2.5 × 1.5 = 3.75 चौ. मीटर. 4 त्यांची बेरीज करतो; 8 सारी परिमिती चालून येतो; 37.5 मध्ये दशांश बिंदू एक घर घसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In a class of 36, two-thirds of the children play kho-kho. How many players is that?",
          hi: "36 बच्चों की कक्षा में दो-तिहाई बच्चे खो-खो खेलते हैं। कितने खिलाड़ी हुए?",
          mr: "36 मुलांच्या वर्गात दोन-तृतीयांश मुले खो-खो खेळतात. किती खेळाडू?",
        },
        answer: 24,
        wrong: [12, 27, 54],
        checkExpr: "2*36/3",
        solution: {
          en: "36 ÷ 3 = 12 in each third; two thirds hold 24. 12 stops at one third; 54 multiplies UP instead of taking a part — a part of 36 cannot exceed 36.",
          hi: "36 ÷ 3 = 12 प्रति तिहाई; दो तिहाई में 24। 12 एक तिहाई पर रुकता है; 54 हिस्सा लेने की जगह बढ़ा देता है — 36 का हिस्सा 36 से बड़ा नहीं हो सकता।",
          mr: "36 ÷ 3 = 12 प्रत्येक तृतीयांशात; दोन तृतीयांशांत 24. 12 एका तृतीयांशावर थांबतो; 54 भाग घेण्याऐवजी वाढवतो — 36 चा भाग 36 हून मोठा असू शकत नाही.",
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
          en: "What is 12.5 ÷ 5 + 0.5?",
          hi: "12.5 ÷ 5 + 0.5 कितना है?",
          mr: "12.5 ÷ 5 + 0.5 किती?",
        },
        answer: 3,
        wrong: [2.5, 2.27, 30],
        checkExpr: "12.5/5+0.5",
        solution: {
          en: "Division goes first: 12.5 ÷ 5 = 2.5, then + 0.5 = 3. 2.5 stops before the addition; 2.27 divides by 5.5, letting the addition jump the queue.",
          hi: "पहले भाग: 12.5 ÷ 5 = 2.5, फिर + 0.5 = 3। 2.5 जोड़ से पहले रुक जाता है; 2.27 में जोड़ पंक्ति तोड़कर 5.5 से भाग करा बैठता है।",
          mr: "आधी भागाकार: 12.5 ÷ 5 = 2.5, मग + 0.5 = 3. 2.5 बेरजेआधी थांबतो; 2.27 मध्ये बेरीज रांग मोडून 5.5 ने भाग होतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A jug holds 2.25 litres of buttermilk; one glass holds 0.25 litre. How many glasses does the jug fill?",
          hi: "एक जग में 2.25 लीटर छाछ है; एक गिलास 0.25 लीटर का है। जग कितने गिलास भरता है?",
          mr: "एका जगमध्ये 2.25 लिटर ताक आहे; एक ग्लास 0.25 लिटरचा आहे. जग किती ग्लास भरतो?",
        },
        answer: 9,
        wrong: [8, 10, 90],
        checkExpr: "2.25/0.25",
        solution: {
          en: "2.25 ÷ 0.25 asks how many quarter-litres sit in 2¼: four per litre gives 8, and the last quarter makes 9. 90 slips the decimal point a place.",
          hi: "2.25 ÷ 0.25 पूछता है कि 2¼ में कितने चौथाई-लीटर हैं: प्रति लीटर चार से 8, और आख़िरी चौथाई से 9। 90 में दशमलव बिंदु एक स्थान फिसल जाता है।",
          mr: "2.25 ÷ 0.25 विचारते की 2¼ मध्ये किती पाव-लिटर आहेत: प्रति लिटर चारने 8, आणि शेवटच्या पावाने 9. 90 मध्ये दशांश बिंदू एक घर घसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is 7/8 of 64?",
          hi: "64 का 7/8 कितना है?",
          mr: "64 चा 7/8 किती?",
        },
        answer: 56,
        wrong: [48, 72, 8],
        checkExpr: "7*64/8",
        solution: {
          en: "64 ÷ 8 = 8 in each eighth; seven of them make 56. 8 stops at ONE eighth; 72 adds an eighth instead of leaving one out.",
          hi: "64 ÷ 8 = 8 प्रति आठवाँ; ऐसे सात मिलकर 56। 8 एक आठवें पर रुक जाता है; 72 एक आठवाँ छोड़ने की जगह जोड़ देता है।",
          mr: "64 ÷ 8 = 8 प्रत्येक अष्टमांशात; असे सात मिळून 56. 8 एका अष्टमांशावर थांबतो; 72 एक अष्टमांश वगळण्याऐवजी मिळवतो.",
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
          en: "A car goes 43.2 km on 2.4 litres of petrol. How many kilometres does it cover per litre?",
          hi: "एक कार 2.4 लीटर पेट्रोल में 43.2 किमी चलती है। प्रति लीटर कितने किलोमीटर?",
          mr: "एक कार 2.4 लिटर पेट्रोलमध्ये 43.2 किमी जाते. प्रति लिटर किती किलोमीटर?",
        },
        answer: 18,
        wrong: [1.8, 180, 16],
        checkExpr: "432/24",
        solution: {
          en: "Shift both decimals: 432 ÷ 24 = 18 km per litre. 1.8 and 180 are point-slips lying in wait — estimate first: about 40 ÷ 2 ≈ 20, so 18 fits.",
          hi: "दोनों दशमलव खिसकाइए: 432 ÷ 24 = 18 किमी प्रति लीटर। 1.8 और 180 घात लगाए बिंदु-चूकें हैं — पहले अनुमान लगाइए: लगभग 40 ÷ 2 ≈ 20, अतः 18 जँचता है।",
          mr: "दोन्ही दशांश सरकवा: 432 ÷ 24 = 18 किमी प्रति लिटर. 1.8 आणि 180 या टपून बसलेल्या बिंदू-चुका — आधी अंदाज घ्या: सुमारे 40 ÷ 2 ≈ 20, म्हणून 18 जुळते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Reeta reads 1/3 of a 150-page book on Monday and 2/5 of it on Tuesday. How many pages are left?",
          hi: "रीता 150 पन्नों की किताब का 1/3 सोमवार को और 2/5 मंगलवार को पढ़ती है। कितने पन्ने बचे?",
          mr: "रीता 150 पानांच्या पुस्तकाचा 1/3 सोमवारी आणि 2/5 मंगळवारी वाचते. किती पाने उरली?",
        },
        answer: 40,
        wrong: [110, 50, 60],
        checkExpr: "150-(150/3+150*2/5)",
        solution: {
          en: "Monday takes 50 pages and Tuesday 60: 110 read, so 150 − 110 = 40 remain. 110 is what's finished, not what's left; 50 and 60 are the single days.",
          hi: "सोमवार 50 पन्ने लेता है और मंगलवार 60: 110 पढ़े गए, अतः 150 − 110 = 40 बचे। 110 पूरा हुआ हिस्सा है, बचा हुआ नहीं; 50 और 60 अकेले दिन हैं।",
          mr: "सोमवार 50 पाने घेतो आणि मंगळवार 60: 110 वाचली, म्हणून 150 − 110 = 40 उरली. 110 म्हणजे संपलेले, उरलेले नाही; 50 आणि 60 एकेकटे दिवस आहेत.",
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
          en: "By how much is 3/4 of 12 greater than 2/3 of 9?",
          hi: "12 का 3/4, 9 के 2/3 से कितना अधिक है?",
          mr: "12 चा 3/4, 9 च्या 2/3 पेक्षा किती जास्त?",
        },
        answer: 3,
        wrong: [9, 6, 15],
        checkExpr: "3*12/4-2*9/3",
        solution: {
          en: "3/4 of 12 is 9; 2/3 of 9 is 6; the gap is 3. 9 and 6 answer the parts but not the comparison; 15 ADDS when the question asks for the difference.",
          hi: "12 का 3/4 है 9; 9 का 2/3 है 6; अंतर 3। 9 और 6 हिस्सों का उत्तर देते हैं, तुलना का नहीं; 15 अंतर पूछे जाने पर जोड़ कर बैठता है।",
          mr: "12 चा 3/4 म्हणजे 9; 9 चा 2/3 म्हणजे 6; फरक 3. 9 आणि 6 भागांचे उत्तर देतात, तुलनेचे नाही; 15 फरक विचारला असता बेरीज करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A tank is 4/5 full. After 60 litres are drawn out it is exactly 1/2 full. How many litres does the full tank hold?",
          hi: "एक टंकी 4/5 भरी है। 60 लीटर निकालने पर वह ठीक 1/2 रह जाती है। पूरी टंकी में कितने लीटर आते हैं?",
          mr: "टाकी 4/5 भरलेली आहे. 60 लिटर काढल्यावर ती नेमकी 1/2 उरते. पूर्ण टाकीत किती लिटर मावतात?",
        },
        answer: 200,
        wrong: [120, 300, 100],
        checkExpr: "60*10/3",
        solution: {
          en: "The drawn water is 4/5 − 1/2 = 3/10 of the tank. If 3/10 is 60 litres, one tenth is 20 and the whole is 200. 120 treats the 60 litres as a half; 100 treats it as 3/5.",
          hi: "निकाला गया पानी टंकी का 4/5 − 1/2 = 3/10 है। यदि 3/10 = 60 लीटर, तो एक दसवाँ 20 और पूरी टंकी 200। 120 उन 60 लीटर को आधा मान लेता है; 100 उन्हें 3/5 मानता है।",
          mr: "काढलेले पाणी टाकीचा 4/5 − 1/2 = 3/10 आहे. 3/10 = 60 लिटर असेल, तर एक दशांश 20 आणि पूर्ण टाकी 200. 120 त्या 60 लिटरांना अर्धे मानतो; 100 त्यांना 3/5 मानतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 2 — Fractions and Decimals",
      name: "Fractions and Decimals",
      slug: "maths-7-fractions-and-decimals",
      summary:
        "Fractions learn to multiply and divide: 'of' becomes ×, dividing by a half doubles, decimal points slide with the tens — and a tank measures itself by what was drawn away.",
      position: 2,
      translations: {
        hi: {
          name: "भिन्न एवं दशमलव",
          summary:
            "भिन्न गुणा-भाग सीखते हैं: 'का' बनता है ×, आधे से भाग दुगुना करता है, दशमलव बिंदु दहाइयों के साथ सरकता है — और टंकी निकाले गए पानी से स्वयं को नापती है।",
        },
        mr: {
          name: "अपूर्णांक आणि दशांश",
          summary:
            "अपूर्णांक गुणाकार-भागाकार शिकतात: 'चा' होतो ×, अर्ध्याने भागल्यास दुप्पट होते, दशांश बिंदू दहाच्या पटीत सरकतो — आणि टाकी काढलेल्या पाण्यावरून स्वतःला मोजते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Data Handling (mean, median, mode, chance)                    */
/* ------------------------------------------------------------------------- */
function dataHandling(): TopicFileOut {
  const rand = rng("maths-7-data-handling");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the mean of 4, 6 and 8?",
          hi: "4, 6 और 8 का माध्य क्या है?",
          mr: "4, 6 आणि 8 चा मध्य किती?",
        },
        answer: 6,
        wrong: [4.5, 18, 8],
        checkExpr: "(4+6+8)/3",
        solution: {
          en: "Add and share: 18 ÷ 3 = 6. 18 stops at the total; 4.5 divides by a fourth number that isn't there.",
          hi: "जोड़िए और बाँटिए: 18 ÷ 3 = 6। 18 कुल योग पर रुक जाता है; 4.5 उस चौथी संख्या से भाग देता है जो है ही नहीं।",
          mr: "बेरीज करा आणि वाटा: 18 ÷ 3 = 6. 18 एकूण बेरजेवर थांबतो; 4.5 नसलेल्या चौथ्या संख्येने भागतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The scores 12, 5, 9, 20, 7 — what is their range?",
          hi: "प्राप्तांक 12, 5, 9, 20, 7 — इनका परिसर (रेंज) क्या है?",
          mr: "गुण 12, 5, 9, 20, 7 — यांची व्याप्ती (रेंज) किती?",
        },
        answer: 15,
        wrong: [20, 5, 12],
        checkExpr: "20-5",
        solution: {
          en: "The range stretches from smallest to largest: 20 − 5 = 15. 20 is only the top and 5 only the bottom — the range is the DISTANCE between them.",
          hi: "परिसर सबसे छोटे से सबसे बड़े तक फैला है: 20 − 5 = 15। 20 केवल शिखर है और 5 केवल तल — परिसर उनके बीच की दूरी है।",
          mr: "व्याप्ती सर्वांत लहानपासून मोठ्यापर्यंत पसरते: 20 − 5 = 15. 20 फक्त शिखर आणि 5 फक्त तळ — व्याप्ती म्हणजे त्यांच्यातील अंतर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In the list 2, 3, 3, 4, 3, 5, which number is the mode?",
          hi: "सूची 2, 3, 3, 4, 3, 5 में बहुलक कौन-सा है?",
          mr: "यादी 2, 3, 3, 4, 3, 5 मध्ये बहुलक कोणता?",
        },
        answer: 3,
        wrong: [2, 4, 5],
        solution: {
          en: "The mode is the most frequent visitor: 3 appears three times while every other number comes just once.",
          hi: "बहुलक सबसे बार आने वाला मेहमान है: 3 तीन बार आता है, बाक़ी हर संख्या बस एक बार।",
          mr: "बहुलक म्हणजे सर्वाधिक वेळा येणारा पाहुणा: 3 तीनदा येतो, बाकी प्रत्येक संख्या फक्त एकदा.",
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
          en: "Find the median of 7, 3, 9, 5, 11.",
          hi: "7, 3, 9, 5, 11 की माध्यिका ज्ञात कीजिए।",
          mr: "7, 3, 9, 5, 11 ची मध्यगा शोधा.",
        },
        answer: 7,
        wrong: [9, 5, 3],
        solution: {
          en: "Arrange first: 3, 5, 7, 9, 11 — and the middle one is 7. 9 picks the middle of the UNSORTED list; the median only works after arranging.",
          hi: "पहले क्रम में रखिए: 3, 5, 7, 9, 11 — बीच वाली 7 है। 9 बिना क्रम वाली सूची का बीच उठा लेता है; माध्यिका क्रम लगाने के बाद ही काम करती है।",
          mr: "आधी क्रमाने लावा: 3, 5, 7, 9, 11 — मधली 7 आहे. 9 क्रम न लावलेल्या यादीतील मधली उचलतो; मध्यगा क्रम लावल्यावरच चालते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the mean of the first five whole numbers, 0 to 4?",
          hi: "पहली पाँच पूर्ण संख्याओं (0 से 4) का माध्य क्या है?",
          mr: "पहिल्या पाच पूर्ण संख्यांचा (0 ते 4) मध्य किती?",
        },
        answer: 2,
        wrong: [2.5, 3, 10],
        checkExpr: "(0+1+2+3+4)/5",
        solution: {
          en: "The total is 10 and there are FIVE numbers — the zero counts: 10 ÷ 5 = 2. 2.5 forgets to count the zero and divides by 4.",
          hi: "योग 10 है और संख्याएँ पाँच हैं — शून्य भी गिना जाता है: 10 ÷ 5 = 2। 2.5 शून्य गिनना भूलकर 4 से भाग देता है।",
          mr: "बेरीज 10 आणि संख्या पाच आहेत — शून्यही मोजले जाते: 10 ÷ 5 = 2. 2.5 शून्य मोजायला विसरून 4 ने भागतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A batter scores 40, 60 and 50 in three matches. What is the mean score?",
          hi: "एक बल्लेबाज़ तीन मैचों में 40, 60 और 50 रन बनाता है। माध्य कितना?",
          mr: "एक फलंदाज तीन सामन्यांत 40, 60 आणि 50 धावा करतो. मध्य किती?",
        },
        answer: 50,
        wrong: [60, 45, 150],
        checkExpr: "(40+60+50)/3",
        solution: {
          en: "150 ÷ 3 = 50. 150 is the total left unshared; 45 averages only two of the three innings.",
          hi: "150 ÷ 3 = 50। 150 बिना बाँटा योग है; 45 तीन में से केवल दो पारियों का औसत लेता है।",
          mr: "150 ÷ 3 = 50. 150 म्हणजे न वाटलेली बेरीज; 45 तिन्हींपैकी फक्त दोन डावांची सरासरी घेतो.",
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
          en: "A die is rolled once. What is the probability of getting an even number, as a decimal?",
          hi: "एक पासा एक बार फेंका जाता है। सम संख्या आने की प्रायिकता दशमलव में कितनी?",
          mr: "फासा एकदा टाकला. सम संख्या येण्याची संभाव्यता दशांशात किती?",
        },
        answer: 0.5,
        wrong: [0.17, 0.33, 0.6],
        checkExpr: "3/6",
        solution: {
          en: "Three faces of six are even (2, 4, 6): 3/6 = 0.5. 0.17 is the chance of ONE particular face; 0.33 counts only two of the evens.",
          hi: "छह में से तीन फलक सम हैं (2, 4, 6): 3/6 = 0.5। 0.17 किसी एक फलक की संभावना है; 0.33 समों में से केवल दो गिनता है।",
          mr: "सहापैकी तीन पृष्ठे सम आहेत (2, 4, 6): 3/6 = 0.5. 0.17 ही एका ठरावीक पृष्ठाची शक्यता; 0.33 समांपैकी फक्त दोनच मोजतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The mean of five numbers is 12. Four of them are 10, 11, 13 and 14. What is the fifth?",
          hi: "पाँच संख्याओं का माध्य 12 है। चार हैं 10, 11, 13 और 14। पाँचवीं क्या है?",
          mr: "पाच संख्यांचा मध्य 12 आहे. चार आहेत 10, 11, 13 आणि 14. पाचवी कोणती?",
        },
        answer: 12,
        wrong: [10, 14, 48],
        checkExpr: "12*5-(10+11+13+14)",
        solution: {
          en: "Five numbers with mean 12 must total 60; the four given make 48, leaving 12 for the fifth. 48 stops at the partial sum.",
          hi: "माध्य 12 वाली पाँच संख्याओं का योग 60 होना चाहिए; दी गई चार का योग 48 है, अतः पाँचवीं 12। 48 अधूरे योग पर रुक जाता है।",
          mr: "मध्य 12 असलेल्या पाच संख्यांची बेरीज 60 हवी; दिलेल्या चारांची 48 होते, म्हणून पाचवी 12. 48 अर्धवट बेरजेवर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Find the median of the six numbers 2, 4, 6, 8, 10, 12.",
          hi: "छह संख्याओं 2, 4, 6, 8, 10, 12 की माध्यिका निकालिए।",
          mr: "सहा संख्या 2, 4, 6, 8, 10, 12 यांची मध्यगा काढा.",
        },
        answer: 7,
        wrong: [6, 8, 14],
        checkExpr: "(6+8)/2",
        solution: {
          en: "With an even count there is no single middle: average the two central ones, (6 + 8) ÷ 2 = 7. 6 and 8 each claim the throne alone; 14 adds them and forgets to halve.",
          hi: "सम गिनती में अकेला बीच नहीं होता: दोनों बीच वालों का औसत लीजिए, (6 + 8) ÷ 2 = 7। 6 और 8 अकेले-अकेले गद्दी माँगते हैं; 14 जोड़कर आधा करना भूल जाता है।",
          mr: "सम संख्येच्या यादीत एकटी मधली नसते: दोन मधल्यांची सरासरी घ्या, (6 + 8) ÷ 2 = 7. 6 आणि 8 एकेकटे गादी मागतात; 14 बेरीज करून निम्मे करायला विसरतो.",
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
          en: "On a bar graph, 1 cm of height stands for 10 students. How many students does a bar 4.5 cm tall show?",
          hi: "दंड-आलेख में 1 सेमी ऊँचाई = 10 विद्यार्थी। 4.5 सेमी ऊँचा दंड कितने विद्यार्थी दिखाता है?",
          mr: "स्तंभालेखात 1 सेमी उंची = 10 विद्यार्थी. 4.5 सेमी उंच स्तंभ किती विद्यार्थी दाखवतो?",
        },
        answer: 45,
        wrong: [14.5, 40, 450],
        checkExpr: "4.5*10",
        solution: {
          en: "Each centimetre carries 10: 4.5 × 10 = 45. 14.5 ADDS the scale instead of multiplying; 40 rounds the half-centimetre away; 450 multiplies twice.",
          hi: "हर सेंटीमीटर 10 ढोता है: 4.5 × 10 = 45। 14.5 गुणा की जगह पैमाना जोड़ देता है; 40 आधा सेंटीमीटर उड़ा देता है; 450 दो बार गुणा करता है।",
          mr: "प्रत्येक सेंटिमीटर 10 वाहतो: 4.5 × 10 = 45. 14.5 गुणण्याऐवजी प्रमाण मिळवतो; 40 अर्धा सेंटिमीटर उडवतो; 450 दोनदा गुणतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The mean of 20, 25, 30 and x is 24. Find x.",
          hi: "20, 25, 30 और x का माध्य 24 है। x निकालिए।",
          mr: "20, 25, 30 आणि x चा मध्य 24 आहे. x काढा.",
        },
        answer: 21,
        wrong: [24, 19, 25],
        checkExpr: "24*4-(20+25+30)",
        solution: {
          en: "Four numbers with mean 24 total 96; the three given make 75, so x = 21. 24 assumes x simply equals the mean — it almost never does.",
          hi: "माध्य 24 वाली चार संख्याओं का योग 96; दी गई तीन का 75, अतः x = 21। 24 मान लेता है कि x माध्य के ही बराबर होगा — प्रायः ऐसा नहीं होता।",
          mr: "मध्य 24 असलेल्या चार संख्यांची बेरीज 96; दिलेल्या तिघांची 75, म्हणून x = 21. 24 गृहीत धरतो की x मध्याइतकाच असेल — बहुधा तसे नसते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A bag holds 3 red and 7 blue balls. One is drawn without looking. What is the probability it is red, as a decimal?",
          hi: "थैले में 3 लाल और 7 नीली गेंदें हैं। बिना देखे एक निकाली जाती है। उसके लाल होने की प्रायिकता दशमलव में?",
          mr: "पिशवीत 3 लाल आणि 7 निळे चेंडू आहेत. न पाहता एक काढला. तो लाल असण्याची संभाव्यता दशांशात किती?",
        },
        answer: 0.3,
        wrong: [0.7, 0.43, 3],
        checkExpr: "3/10",
        solution: {
          en: "3 favourable out of 10 in all: 0.3. 0.7 is blue's chance; 0.43 divides red by blue (3/7) instead of by the whole bag.",
          hi: "कुल 10 में 3 अनुकूल: 0.3। 0.7 नीली की संभावना है; 0.43 लाल को पूरे थैले की जगह नीली से (3/7) भाग देता है।",
          mr: "एकूण 10 पैकी 3 अनुकूल: 0.3. 0.7 ही निळ्याची शक्यता; 0.43 लालला संपूर्ण पिशवीऐवजी निळ्याने (3/7) भागतो.",
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
          en: "A batsman's mean is 40 over five innings. After a sixth innings his mean rises to 45. How many runs did he score in it?",
          hi: "पाँच पारियों में बल्लेबाज़ का माध्य 40 है। छठी पारी के बाद माध्य 45 हो जाता है। छठी पारी में उसने कितने रन बनाए?",
          mr: "पाच डावांत फलंदाजाचा मध्य 40 आहे. सहाव्या डावानंतर मध्य 45 होतो. सहाव्या डावात त्याने किती धावा केल्या?",
        },
        answer: 70,
        wrong: [45, 50, 85],
        checkExpr: "45*6-40*5",
        solution: {
          en: "Totals tell the story: 6 × 45 = 270 now, 5 × 40 = 200 before — the sixth innings added 70. 45 assumes he scored the new mean; to LIFT a mean you must score well above it.",
          hi: "योग कहानी कहते हैं: अब 6 × 45 = 270, पहले 5 × 40 = 200 — छठी पारी ने 70 जोड़े। 45 मानता है कि उसने नया माध्य ही बनाया; माध्य उठाने के लिए उससे कहीं ऊपर खेलना पड़ता है।",
          mr: "बेरजा कथा सांगतात: आता 6 × 45 = 270, आधी 5 × 40 = 200 — सहाव्या डावाने 70 जोडल्या. 45 गृहीत धरतो की त्याने नवा मध्यच काढला; मध्य उचलण्यासाठी त्याहून खूप वर खेळावे लागते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "For the data 1, 2, 2, 2, 8 — by how much does the mean exceed the mode?",
          hi: "आँकड़े 1, 2, 2, 2, 8 — माध्य, बहुलक से कितना अधिक है?",
          mr: "सामग्री 1, 2, 2, 2, 8 — मध्य बहुलकापेक्षा किती जास्त आहे?",
        },
        answer: 1,
        wrong: [3, 2, 0.8],
        checkExpr: "(1+2+2+2+8)/5-2",
        solution: {
          en: "The mean is 15 ÷ 5 = 3 and the mode is 2: the gap is 1. The lone 8 drags the mean up while the mode stays home with the crowd. 3 and 2 are the two averages themselves, not their difference.",
          hi: "माध्य 15 ÷ 5 = 3 और बहुलक 2: अंतर 1। अकेला 8 माध्य को ऊपर खींचता है जबकि बहुलक भीड़ के साथ घर रहता है। 3 और 2 स्वयं दोनों औसत हैं, उनका अंतर नहीं।",
          mr: "मध्य 15 ÷ 5 = 3 आणि बहुलक 2: फरक 1. एकटा 8 मध्याला वर ओढतो, तर बहुलक गर्दीसोबत घरी राहतो. 3 आणि 2 हे स्वतः दोन्ही सरासरी आहेत, त्यांचा फरक नाही.",
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
          en: "Nine workers in a workshop earn ₹100 a day each; the owner pays himself ₹1000. What is the mean daily earning of all ten people?",
          hi: "कार्यशाला के नौ मज़दूर ₹100 प्रतिदिन कमाते हैं; मालिक ख़ुद को ₹1000 देता है। दसों व्यक्तियों की माध्य दैनिक कमाई कितनी?",
          mr: "कार्यशाळेतील नऊ कामगार दररोज ₹100 कमावतात; मालक स्वतःला ₹1000 देतो. दहाही जणांची सरासरी रोजची कमाई किती?",
        },
        answer: 190,
        wrong: [100, 550, 1000],
        checkExpr: "(9*100+1000)/10",
        fmt: rupees,
        solution: {
          en: "The total is 900 + 1000 = 1900, shared on paper among ten: ₹190. Yet NOBODY actually earns ₹190 — one large value hauls the mean far above what nine of the ten receive. The median, ₹100, is the honest witness here.",
          hi: "योग 900 + 1000 = 1900, काग़ज़ पर दस में बँटा: ₹190। पर वास्तव में ₹190 कोई नहीं कमाता — एक बड़ा मूल्य माध्य को वहाँ खींच ले जाता है जहाँ दस में से नौ नहीं पहुँचते। यहाँ ईमानदार गवाह माध्यिका है: ₹100।",
          mr: "बेरीज 900 + 1000 = 1900, कागदावर दहांत वाटलेली: ₹190. पण प्रत्यक्षात ₹190 कोणीच कमावत नाही — एक मोठे मूल्य मध्याला तिथे ओढते जिथे दहांतले नऊ पोहोचत नाहीत. इथला प्रामाणिक साक्षीदार मध्यगा आहे: ₹100.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A fair spinner is split into 8 equal sections numbered 1 to 8. What is the probability of spinning a number GREATER than 6, as a decimal?",
          hi: "एक न्यायसंगत चकरी 1 से 8 तक अंकित 8 बराबर खंडों में बँटी है। 6 से बड़ी संख्या आने की प्रायिकता दशमलव में?",
          mr: "1 ते 8 आकडे असलेली चक्री 8 समान भागांत विभागलेली आहे. 6 पेक्षा मोठी संख्या येण्याची संभाव्यता दशांशात किती?",
        },
        answer: 0.25,
        wrong: [0.375, 0.75, 0.125],
        checkExpr: "2/8",
        solution: {
          en: "Greater than 6 means 7 and 8 only — two sections of eight: 0.25. 0.375 sneaks 6 itself into the count, but 'greater than' never includes the number named.",
          hi: "6 से बड़ी यानी केवल 7 और 8 — आठ में से दो खंड: 0.25। 0.375 चुपके से 6 को भी गिन लेता है, पर 'से बड़ी' में वह संख्या कभी शामिल नहीं होती।",
          mr: "6 पेक्षा मोठी म्हणजे फक्त 7 आणि 8 — आठांपैकी दोन भाग: 0.25. 0.375 हळूच 6 लाही मोजतो, पण 'पेक्षा मोठी' मध्ये ती संख्या कधीच येत नाही.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 3 — Data Handling",
      name: "Data Handling",
      slug: "maths-7-data-handling",
      summary:
        "Add-and-share means, sorted medians, the crowd's mode and chance as a decimal — and one owner's salary showing how a single number can drag an average.",
      position: 3,
      translations: {
        hi: {
          name: "आँकड़ों का प्रबंधन",
          summary:
            "जोड़कर बाँटा माध्य, क्रम लगाकर पाई माध्यिका, भीड़ का बहुलक और दशमलव में संयोग — और मालिक का वेतन दिखाता है कि एक अकेली संख्या औसत को कैसे घसीट ले जाती है।",
        },
        mr: {
          name: "माहितीचे व्यवस्थापन",
          summary:
            "बेरीज करून वाटलेला मध्य, क्रम लावून मिळालेली मध्यगा, गर्दीचा बहुलक आणि दशांशातील शक्यता — आणि मालकाचा पगार दाखवतो की एकटी संख्या सरासरीला कशी ओढून नेते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Simple Equations (do the same to both sides)                  */
/* ------------------------------------------------------------------------- */
function simpleEquations(): TopicFileOut {
  const rand = rng("maths-7-simple-equations");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve: x + 7 = 12.",
          hi: "हल कीजिए: x + 7 = 12।",
          mr: "सोडवा: x + 7 = 12.",
        },
        answer: 5,
        wrong: [19, 7, -5],
        checkExpr: "12-7",
        solution: {
          en: "Take 7 from both sides: x = 5. 19 adds the 7 instead of undoing it; −5 undoes it in the wrong direction.",
          hi: "दोनों पक्षों से 7 घटाइए: x = 5। 19 उलटने की जगह 7 जोड़ देता है; −5 उल्टी दिशा में उलट देता है।",
          mr: "दोन्ही बाजूंतून 7 वजा करा: x = 5. 19 उलट करण्याऐवजी 7 मिळवतो; −5 उलट्या दिशेने उलटतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve: y − 3 = 8.",
          hi: "हल कीजिए: y − 3 = 8।",
          mr: "सोडवा: y − 3 = 8.",
        },
        answer: 11,
        wrong: [5, 3, 24],
        checkExpr: "8+3",
        solution: {
          en: "Add 3 back to both sides: y = 11. 5 subtracts again — undoing a −3 means doing its OPPOSITE.",
          hi: "दोनों पक्षों में 3 वापस जोड़िए: y = 11। 5 दोबारा घटा देता है — −3 को उलटना यानी उसका विपरीत करना।",
          mr: "दोन्ही बाजूंत 3 परत मिळवा: y = 11. 5 पुन्हा वजा करतो — −3 उलटवणे म्हणजे त्याच्या विरुद्ध करणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve: 4m = 28.",
          hi: "हल कीजिए: 4m = 28।",
          mr: "सोडवा: 4m = 28.",
        },
        answer: 7,
        wrong: [24, 32, 112],
        checkExpr: "28/4",
        solution: {
          en: "Divide both sides by 4: m = 7. 24 subtracts the 4 and 112 multiplies by it — but 4m means 4 TIMES m, so only division undoes it.",
          hi: "दोनों पक्षों को 4 से भाग दीजिए: m = 7। 24 चार घटाता है और 112 चार से गुणा करता है — पर 4m का अर्थ है 4 गुना m, अतः केवल भाग ही उसे उलटता है।",
          mr: "दोन्ही बाजूंना 4 ने भागा: m = 7. 24 चार वजा करतो आणि 112 चाराने गुणतो — पण 4m म्हणजे 4 गुणिले m, म्हणून फक्त भागाकारच ते उलटवतो.",
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
          en: "Solve: x/5 = 6.",
          hi: "हल कीजिए: x/5 = 6।",
          mr: "सोडवा: x/5 = 6.",
        },
        answer: 30,
        wrong: [1.2, 11, 25],
        checkExpr: "6*5",
        solution: {
          en: "Multiply both sides by 5: x = 30. 1.2 divides a second time; 11 adds the 5 as if it were a subtraction problem.",
          hi: "दोनों पक्षों को 5 से गुणा कीजिए: x = 30। 1.2 दूसरी बार भाग देता है; 11 पाँच को ऐसे जोड़ता है मानो घटाने का सवाल हो।",
          mr: "दोन्ही बाजूंना 5 ने गुणा: x = 30. 1.2 दुसऱ्यांदा भागतो; 11 पाच अशी मिळवतो जणू वजाबाकीचे उदाहरण असावे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve: 2x + 1 = 9.",
          hi: "हल कीजिए: 2x + 1 = 9।",
          mr: "सोडवा: 2x + 1 = 9.",
        },
        answer: 4,
        wrong: [5, 8, 3],
        checkExpr: "(9-1)/2",
        solution: {
          en: "Peel in reverse order: first − 1 gives 2x = 8, then ÷ 2 gives x = 4. 5 divides BEFORE subtracting — the coat goes off before the shirt.",
          hi: "उल्टे क्रम में परतें उतारिए: पहले − 1 से 2x = 8, फिर ÷ 2 से x = 4। 5 घटाने से पहले भाग दे बैठता है — क़मीज़ से पहले कोट उतरता है।",
          mr: "उलट्या क्रमाने साली सोला: आधी − 1 ने 2x = 8, मग ÷ 2 ने x = 4. 5 वजा करण्याआधीच भागतो — शर्टाआधी कोट उतरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve: 3p − 2 = 13.",
          hi: "हल कीजिए: 3p − 2 = 13।",
          mr: "सोडवा: 3p − 2 = 13.",
        },
        answer: 5,
        wrong: [11, 15, 45],
        checkExpr: "(13+2)/3",
        solution: {
          en: "Add 2 to reach 3p = 15, then divide: p = 5. 11 subtracts the 2 and stops; 15 builds 3p and forgets the final division; 45 multiplies it instead.",
          hi: "2 जोड़कर 3p = 15 तक पहुँचिए, फिर भाग दीजिए: p = 5। 11 दो घटाकर रुक जाता है; 15 तीन p बनाकर अंतिम भाग भूल जाता है; 45 उलटे गुणा कर देता है।",
          mr: "2 मिळवून 3p = 15 गाठा, मग भागा: p = 5. 11 दोन वजा करून थांबतो; 15 तीन p बांधून शेवटचा भाग विसरतो; 45 उलट गुणतो.",
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
          en: "Solve: 5(x − 2) = 15.",
          hi: "हल कीजिए: 5(x − 2) = 15।",
          mr: "सोडवा: 5(x − 2) = 15.",
        },
        answer: 5,
        wrong: [3, 1, 25],
        checkExpr: "15/5+2",
        solution: {
          en: "Divide by 5 first: x − 2 = 3, so x = 5. 3 forgets to add the 2 back; 1 subtracts it a second time.",
          hi: "पहले 5 से भाग: x − 2 = 3, अतः x = 5। 3 दो वापस जोड़ना भूल जाता है; 1 उसे दूसरी बार घटा देता है।",
          mr: "आधी 5 ने भागा: x − 2 = 3, म्हणून x = 5. 3 दोन परत मिळवायला विसरतो; 1 ते दुसऱ्यांदा वजा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "I think of a number, double it and add 5; I get 25. What was my number?",
          hi: "मैं एक संख्या सोचता हूँ, उसे दोगुना कर 5 जोड़ता हूँ; 25 मिलता है। मेरी संख्या क्या थी?",
          mr: "मी एक संख्या मनात धरतो, तिची दुप्पट करून 5 मिळवतो; 25 येते. माझी संख्या कोणती होती?",
        },
        answer: 10,
        wrong: [15, 12.5, 20],
        checkExpr: "(25-5)/2",
        solution: {
          en: "Undo in reverse: 25 − 5 = 20, then ÷ 2 = 10. Check forward: double 10 is 20, plus 5 is 25 ✓. 12.5 halves before removing the 5.",
          hi: "उल्टा चलिए: 25 − 5 = 20, फिर ÷ 2 = 10। सीधी जाँच: 10 का दुगुना 20, पाँच जोड़ने पर 25 ✓। 12.5 पाँच हटाने से पहले आधा कर देता है।",
          mr: "उलटे चला: 25 − 5 = 20, मग ÷ 2 = 10. सरळ पडताळणी: 10 ची दुप्पट 20, पाच मिळवता 25 ✓. 12.5 पाच काढण्याआधी निम्मे करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Three consecutive numbers add up to 66. What is the smallest of them?",
          hi: "तीन क्रमागत संख्याओं का योग 66 है। उनमें सबसे छोटी कौन-सी?",
          mr: "तीन क्रमागत संख्यांची बेरीज 66 आहे. त्यांतील सर्वांत लहान कोणती?",
        },
        answer: 21,
        wrong: [22, 23, 20],
        checkExpr: "66/3-1",
        solution: {
          en: "The middle one is 66 ÷ 3 = 22, so the three are 21, 22, 23. 22 is the middle, not the smallest; 20 steps one too far down.",
          hi: "बीच वाली है 66 ÷ 3 = 22, अतः तीनों हैं 21, 22, 23। 22 बीच की है, सबसे छोटी नहीं; 20 एक क़दम ज़्यादा नीचे उतर जाता है।",
          mr: "मधली आहे 66 ÷ 3 = 22, म्हणून तिन्ही 21, 22, 23. 22 मधली आहे, सर्वांत लहान नाही; 20 एक पाऊल जास्त खाली उतरतो.",
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
          en: "Amma's age is four times Meena's. Together their ages add to 40 years. How old is Meena?",
          hi: "अम्मा की उम्र मीना से चार गुनी है। दोनों की उम्र मिलाकर 40 वर्ष है। मीना कितने वर्ष की है?",
          mr: "आईचे वय मीनाच्या चौपट आहे. दोघींचे वय मिळून 40 वर्षे आहे. मीना किती वर्षांची?",
        },
        answer: 8,
        wrong: [10, 32, 36],
        checkExpr: "40/5",
        solution: {
          en: "If Meena is m, Amma is 4m: m + 4m = 40, so 5m = 40 and m = 8. 10 divides by 4 and forgets Meena counts in the total too; 32 is Amma's age.",
          hi: "मीना m हो तो अम्मा 4m: m + 4m = 40, अतः 5m = 40 और m = 8। 10 चार से भाग देकर भूल जाता है कि योग में मीना भी है; 32 अम्मा की उम्र है।",
          mr: "मीना m असेल तर आई 4m: m + 4m = 40, म्हणून 5m = 40 आणि m = 8. 10 चाराने भागून विसरतो की बेरजेत मीनाही आहे; 32 हे आईचे वय.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A rectangle's length is twice its breadth and its perimeter is 36 cm. Find the breadth.",
          hi: "आयत की लंबाई उसकी चौड़ाई से दोगुनी है और परिमाप 36 सेमी है। चौड़ाई निकालिए।",
          mr: "आयताची लांबी रुंदीच्या दुप्पट आहे आणि परिमिती 36 सेमी आहे. रुंदी काढा.",
        },
        answer: 6,
        wrong: [12, 9, 18],
        checkExpr: "36/6",
        solution: {
          en: "With breadth b the perimeter is 2(2b + b) = 6b = 36, so b = 6. 12 is the LENGTH; 9 splits the perimeter into four equal sides, but the sides are not equal.",
          hi: "चौड़ाई b मानें तो परिमाप 2(2b + b) = 6b = 36, अतः b = 6। 12 तो लंबाई है; 9 परिमाप को चार बराबर भुजाओं में बाँटता है, पर भुजाएँ बराबर हैं ही नहीं।",
          mr: "रुंदी b मानली तर परिमिती 2(2b + b) = 6b = 36, म्हणून b = 6. 12 ही लांबी आहे; 9 परिमितीला चार समान बाजूंत वाटतो, पण बाजू समान नाहीतच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Solve: 7x − 3 = 4x + 15.",
          hi: "हल कीजिए: 7x − 3 = 4x + 15।",
          mr: "सोडवा: 7x − 3 = 4x + 15.",
        },
        answer: 6,
        wrong: [4, 18, 2],
        checkExpr: "18/3",
        solution: {
          en: "Gather x's on one side and numbers on the other: 3x = 18, so x = 6. 18 stops before the last division; 4 subtracts the 3 instead of carrying it across.",
          hi: "x एक ओर, संख्याएँ दूसरी ओर: 3x = 18, अतः x = 6। 18 अंतिम भाग से पहले रुक जाता है; 4 तीन को पार ले जाने की जगह घटा देता है।",
          mr: "x एका बाजूला, संख्या दुसऱ्या बाजूला: 3x = 18, म्हणून x = 6. 18 शेवटच्या भागाआधी थांबतो; 4 तिघाला पलीकडे नेण्याऐवजी वजा करतो.",
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
          en: "One number is 5 more than another, and their sum is 73. What is the LARGER number?",
          hi: "एक संख्या दूसरी से 5 अधिक है, और उनका योग 73 है। बड़ी संख्या कौन-सी?",
          mr: "एक संख्या दुसरीपेक्षा 5 ने मोठी आहे, आणि त्यांची बेरीज 73 आहे. मोठी संख्या कोणती?",
        },
        answer: 39,
        wrong: [34, 36.5, 44],
        checkExpr: "(73+5)/2",
        solution: {
          en: "Add the difference and halve for the larger: (73 + 5) ÷ 2 = 39; its partner is 34. 36.5 splits the sum equally and ignores the gap of 5.",
          hi: "बड़ी के लिए अंतर जोड़कर आधा कीजिए: (73 + 5) ÷ 2 = 39; साथी है 34। 36.5 योग को बराबर बाँटकर 5 के अंतर को अनदेखा कर देता है।",
          mr: "मोठीसाठी फरक मिळवून निम्मे करा: (73 + 5) ÷ 2 = 39; जोडीदार 34. 36.5 बेरीज सारखी वाटून 5 च्या फरकाकडे दुर्लक्ष करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A purse holds the same number of ₹5 coins as ₹2 coins, worth ₹63 in all. How many ₹5 coins are there?",
          hi: "बटुए में ₹5 और ₹2 के सिक्के बराबर संख्या में हैं, कुल ₹63। ₹5 के कितने सिक्के हैं?",
          mr: "पाकिटात ₹5 आणि ₹2 ची नाणी सारख्याच संख्येने आहेत, एकूण ₹63. ₹5 ची किती नाणी?",
        },
        answer: 9,
        wrong: [7, 12, 21],
        checkExpr: "63/7",
        solution: {
          en: "Each matched pair of coins is worth ₹7, and 63 ÷ 7 = 9 pairs — so nine ₹5 coins. 12 divides 63 by 5 alone and rounds; 7 is the pair's value mistaken for the count.",
          hi: "सिक्कों की हर जोड़ी ₹7 की है, और 63 ÷ 7 = 9 जोड़ियाँ — अतः ₹5 के नौ सिक्के। 12 तिरसठ को अकेले 5 से भाग देकर पूर्णांक बना देता है; 7 जोड़ी का मूल्य है जिसे गिनती समझ लिया गया।",
          mr: "नाण्यांची प्रत्येक जोडी ₹7 ची, आणि 63 ÷ 7 = 9 जोड्या — म्हणून ₹5 ची नऊ नाणी. 12 त्रेसष्टला एकट्या 5 ने भागून पूर्णांक करतो; 7 हे जोडीचे मूल्य, जे मोजणी समजले गेले.",
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
          en: "Twenty years from now Ravi will be exactly three times as old as he is today. How old is he now?",
          hi: "आज से बीस वर्ष बाद रवि आज की उम्र का ठीक तीन गुना होगा। अभी वह कितने वर्ष का है?",
          mr: "आजपासून वीस वर्षांनी रवी आजच्या वयाच्या नेमका तिप्पट असेल. आता तो किती वर्षांचा आहे?",
        },
        answer: 10,
        wrong: [30, 5, 15],
        checkExpr: "20/2",
        solution: {
          en: "x + 20 = 3x leaves 20 = 2x, so x = 10 — and in twenty years he will be 30, which is indeed 3 × 10 ✓. 30 answers the FUTURE age, not today's.",
          hi: "x + 20 = 3x से 20 = 2x, अतः x = 10 — और बीस वर्ष बाद वह 30 का होगा, जो सचमुच 3 × 10 है ✓। 30 भविष्य की उम्र बताता है, आज की नहीं।",
          mr: "x + 20 = 3x मधून 20 = 2x, म्हणून x = 10 — आणि वीस वर्षांनी तो 30 चा असेल, जे खरोखर 3 × 10 आहे ✓. 30 भविष्यातले वय सांगतो, आजचे नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The same number is subtracted from both 71 and 47, and one result becomes exactly three times the other. What number was subtracted?",
          hi: "71 और 47 दोनों में से एक ही संख्या घटाई जाती है, और एक परिणाम दूसरे का ठीक तीन गुना हो जाता है। कौन-सी संख्या घटाई गई?",
          mr: "71 आणि 47 दोन्हींतून एकच संख्या वजा केली जाते, आणि एक निकाल दुसऱ्याच्या नेमका तिप्पट होतो. कोणती संख्या वजा केली?",
        },
        answer: 35,
        wrong: [24, 12, 47],
        checkExpr: "(3*47-71)/2",
        solution: {
          en: "71 − x = 3(47 − x) opens to 71 − x = 141 − 3x, so 2x = 70 and x = 35. Check: the results are 36 and 12, and 36 = 3 × 12 ✓. 24 is merely 71 − 47, the gap between the pair.",
          hi: "71 − x = 3(47 − x) खुलकर 71 − x = 141 − 3x, अतः 2x = 70 और x = 35। जाँच: परिणाम 36 और 12, और 36 = 3 × 12 ✓। 24 केवल 71 − 47 है, जोड़ी के बीच का फ़ासला।",
          mr: "71 − x = 3(47 − x) उघडून 71 − x = 141 − 3x, म्हणून 2x = 70 आणि x = 35. पडताळणी: निकाल 36 आणि 12, आणि 36 = 3 × 12 ✓. 24 म्हणजे केवळ 71 − 47, जोडीतील अंतर.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 4 — Simple Equations",
      name: "Simple Equations",
      slug: "maths-7-simple-equations",
      summary:
        "Do the same to both sides and the balance holds: peel equations in reverse, turn ages, coins and perimeters into x — and walk every answer back in to check it.",
      position: 4,
      translations: {
        hi: {
          name: "सरल समीकरण",
          summary:
            "दोनों पक्षों के साथ एक-सा कीजिए और तुला संतुलित रहती है: समीकरण उल्टे क्रम में खोलिए, उम्र, सिक्के और परिमाप को x बनाइए — और हर उत्तर को वापस चलाकर जाँचिए।",
        },
        mr: {
          name: "साधी समीकरणे",
          summary:
            "दोन्ही बाजूंशी सारखेच करा आणि तराजू समतोल राहतो: समीकरणे उलट्या क्रमाने सोला, वय, नाणी आणि परिमितीला x करा — आणि प्रत्येक उत्तर परत चालवून तपासा.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Lines and Angles (pairs to 90, 180, and across crossings)     */
/* ------------------------------------------------------------------------- */
function linesAndAngles(): TopicFileOut {
  const rand = rng("maths-7-lines-and-angles");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the complement of a 30° angle?",
          hi: "30° के कोण का पूरक कोण क्या है?",
          mr: "30° च्या कोनाचा कोटीकोन किती?",
        },
        answer: 60,
        wrong: [150, 30, 70],
        checkExpr: "90-30",
        fmt: deg,
        solution: {
          en: "Complements complete a RIGHT angle: 90 − 30 = 60°. 150 completes a straight line instead — that is the supplement.",
          hi: "पूरक मिलकर समकोण पूरा करते हैं: 90 − 30 = 60°। 150 सीधी रेखा पूरी करता है — वह संपूरक है।",
          mr: "कोटीकोन मिळून काटकोन पूर्ण करतात: 90 − 30 = 60°. 150 सरळ रेषा पूर्ण करतो — तो पूरक कोन.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the supplement of 110°?",
          hi: "110° का संपूरक कोण क्या है?",
          mr: "110° चा पूरक कोन किती?",
        },
        answer: 70,
        wrong: [20, 110, 250],
        checkExpr: "180-110",
        fmt: deg,
        solution: {
          en: "Supplements straighten to 180°: 180 − 110 = 70°. 20 aims at 90 — but 110° is already past the right angle; only the straight line can absorb it.",
          hi: "संपूरक मिलकर 180° बनाते हैं: 180 − 110 = 70°। 20 नब्बे का निशाना साधता है — पर 110° समकोण पार कर चुका है; उसे केवल सीधी रेखा ही समा सकती है।",
          mr: "पूरक कोन मिळून 180° करतात: 180 − 110 = 70°. 20 नव्वदीचा नेम धरतो — पण 110° काटकोन ओलांडून गेला आहे; त्याला फक्त सरळ रेषाच सामावू शकते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "An angle measures 45°. What does its complement measure?",
          hi: "एक कोण 45° का है। उसका पूरक कितने का है?",
          mr: "एक कोन 45° चा आहे. त्याचा कोटीकोन किती अंशांचा?",
        },
        answer: 45,
        wrong: [135, 55, 90],
        checkExpr: "90-45",
        fmt: deg,
        solution: {
          en: "90 − 45 = 45° — the only angle that is its OWN complement. 135 is its supplement; 55 completes 100, a line that exists nowhere in geometry.",
          hi: "90 − 45 = 45° — एकमात्र कोण जो स्वयं अपना पूरक है। 135 उसका संपूरक है; 55 सौ पूरा करता है, जो ज्यामिति में कहीं नहीं मिलता।",
          mr: "90 − 45 = 45° — स्वतःचाच कोटीकोन असलेला एकमेव कोन. 135 त्याचा पूरक; 55 शंभर पूर्ण करतो, जे भूमितीत कुठेच नाही.",
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
          en: "Two straight lines cross. One of the angles formed is 50°. What is the angle directly OPPOSITE it?",
          hi: "दो सीधी रेखाएँ एक-दूसरे को काटती हैं। बना एक कोण 50° है। उसके ठीक सामने का कोण कितना?",
          mr: "दोन सरळ रेषा एकमेकींना छेदतात. तयार झालेला एक कोन 50° आहे. त्याच्या नेमका समोरचा कोन किती?",
        },
        answer: 50,
        wrong: [130, 40, 310],
        fmt: deg,
        solution: {
          en: "Vertically opposite angles are always equal: 50°. 130 is the NEIGHBOURING angle along the straight line, not the twin across the crossing.",
          hi: "शीर्षाभिमुख कोण सदा बराबर होते हैं: 50°। 130 सीधी रेखा पर पड़ोसी कोण है, चौराहे के पार का जुड़वाँ नहीं।",
          mr: "परस्पर समोरचे (शिरोबिंदूसमोरील) कोन नेहमी समान: 50°. 130 हा सरळ रेषेवरील शेजारी कोन, छेदापलीकडचा जुळा नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two angles sit side by side on a straight line. One is 65°; what is the other?",
          hi: "एक सीधी रेखा पर दो कोण अगल-बगल हैं। एक 65° है; दूसरा कितना?",
          mr: "सरळ रेषेवर दोन कोन शेजारी-शेजारी आहेत. एक 65° आहे; दुसरा किती?",
        },
        answer: 115,
        wrong: [25, 65, 295],
        checkExpr: "180-65",
        fmt: deg,
        solution: {
          en: "A linear pair totals 180°: 180 − 65 = 115°. 25 totals 90, as if the straight line were only a right angle; 295 borrows from a full turn.",
          hi: "रैखिक युग्म का योग 180° होता है: 180 − 65 = 115°। 25 नब्बे तक जोड़ता है, मानो सीधी रेखा बस समकोण हो; 295 पूरे चक्कर से उधार लेता है।",
          mr: "रेषीय जोडीची बेरीज 180°: 180 − 65 = 115°. 25 नव्वदपर्यंत जुळवतो, जणू सरळ रेषा फक्त काटकोनच; 295 पूर्ण फेरीतून उसने घेतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A linear pair of angles always adds up to how many degrees?",
          hi: "रैखिक युग्म के दो कोणों का योग सदा कितने डिग्री होता है?",
          mr: "रेषीय जोडीतील दोन कोनांची बेरीज नेहमी किती अंश असते?",
        },
        answer: 180,
        wrong: [90, 360, 100],
        fmt: deg,
        solution: {
          en: "The two angles share a straight edge, and a straight angle is 180°. 360 goes all the way AROUND the point; 90 stops at a right angle.",
          hi: "दोनों कोण एक सीधा किनारा बाँटते हैं, और ऋजु कोण 180° का होता है। 360 बिंदु के चारों ओर पूरा घूम आता है; 90 समकोण पर रुक जाता है।",
          mr: "दोन्ही कोन एक सरळ कड वाटून घेतात, आणि सरळ कोन 180° चा असतो. 360 बिंदूभोवती पूर्ण फिरून येतो; 90 काटकोनावर थांबतो.",
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
          en: "Two parallel lines are cut by a transversal, which makes a 75° angle with the first line. What is the CORRESPONDING angle at the second line?",
          hi: "दो समांतर रेखाओं को एक तिर्यक रेखा काटती है, जो पहली रेखा से 75° का कोण बनाती है। दूसरी रेखा पर संगत कोण कितना?",
          mr: "दोन समांतर रेषांना एक छेदिका छेदते, जी पहिल्या रेषेशी 75° चा कोन करते. दुसऱ्या रेषेवरील संगत कोन किती?",
        },
        answer: 75,
        wrong: [105, 15, 285],
        fmt: deg,
        solution: {
          en: "Parallel lines copy the crossing exactly, so corresponding angles are equal: 75°. 105 is the co-interior partner, which adds to 180 instead of copying.",
          hi: "समांतर रेखाएँ चौराहे की हूबहू नक़ल करती हैं, अतः संगत कोण बराबर: 75°। 105 एक ही ओर का अंतःकोण-साथी है, जो नक़ल की जगह 180 तक जोड़ता है।",
          mr: "समांतर रेषा छेदाची हुबेहूब नक्कल करतात, म्हणून संगत कोन समान: 75°. 105 हा एकाच बाजूचा आंतरकोन-जोडीदार, जो नक्कल न करता 180 पर्यंत जुळवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Between two parallel lines, a transversal makes one co-interior angle of 120°. What does its partner on the SAME side measure?",
          hi: "दो समांतर रेखाओं के बीच तिर्यक रेखा एक ओर का एक अंतःकोण 120° बनाती है। उसी ओर का साथी कोण कितने का है?",
          mr: "दोन समांतर रेषांमध्ये छेदिका एका बाजूचा एक आंतरकोन 120° करते. त्याच बाजूचा जोडीदार कोन किती अंशांचा?",
        },
        answer: 60,
        wrong: [120, 240, 30],
        checkExpr: "180-120",
        fmt: deg,
        solution: {
          en: "Co-interior angles add to 180°: the partner is 60°. 120 COPIES the angle — that rule belongs to alternate and corresponding angles, not to same-side partners.",
          hi: "एक ही ओर के अंतःकोण 180° तक जुड़ते हैं: साथी 60° है। 120 कोण की नक़ल करता है — वह नियम एकांतर और संगत कोणों का है, एक-ओर के साथियों का नहीं।",
          mr: "एकाच बाजूचे आंतरकोन 180° पर्यंत जुळतात: जोडीदार 60°. 120 कोनाची नक्कल करतो — तो नियम व्युत्क्रम आणि संगत कोनांचा, एका बाजूच्या जोडीदारांचा नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Three angles stand together on one side of a straight line: 40°, x and 65°. Find x.",
          hi: "एक सीधी रेखा के एक ओर तीन कोण साथ खड़े हैं: 40°, x और 65°। x निकालिए।",
          mr: "सरळ रेषेच्या एका बाजूला तीन कोन एकत्र आहेत: 40°, x आणि 65°. x काढा.",
        },
        answer: 75,
        wrong: [105, 255, 85],
        checkExpr: "180-40-65",
        fmt: deg,
        solution: {
          en: "The whole straight side holds 180°: x = 180 − 40 − 65 = 75°. 255 borrows from a full turn of 360; 105 drops one of the two known angles.",
          hi: "पूरी सीधी ओर में 180° समाते हैं: x = 180 − 40 − 65 = 75°। 255 पूरे 360 के चक्कर से उधार लेता है; 105 दो ज्ञात कोणों में से एक गिरा देता है।",
          mr: "सारी सरळ बाजू 180° धरते: x = 180 − 40 − 65 = 75°. 255 पूर्ण 360 च्या फेरीतून उसने घेतो; 105 दोन ज्ञात कोनांतील एक गाळतो.",
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
          en: "An angle is exactly TWICE its complement. What does it measure?",
          hi: "एक कोण अपने पूरक का ठीक दोगुना है। वह कितने का है?",
          mr: "एक कोन आपल्या कोटीकोनाच्या नेमका दुप्पट आहे. तो किती अंशांचा?",
        },
        answer: 60,
        wrong: [30, 45, 120],
        checkExpr: "2*90/3",
        fmt: deg,
        solution: {
          en: "x = 2(90 − x) gives 3x = 180, so x = 60° — and its complement 30 is indeed half of it ✓. 30 answers the complement; 45 makes the pair equal instead of doubled.",
          hi: "x = 2(90 − x) से 3x = 180, अतः x = 60° — और उसका पूरक 30 सचमुच उसका आधा है ✓। 30 पूरक का उत्तर है; 45 जोड़ी को दुगुनी की जगह बराबर बना देता है।",
          mr: "x = 2(90 − x) मधून 3x = 180, म्हणून x = 60° — आणि त्याचा कोटीकोन 30 खरोखर त्याचा अर्धा ✓. 30 कोटीकोनाचे उत्तर; 45 जोडीला दुप्पटऐवजी समान करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "An angle equals its own supplement. What is it?",
          hi: "एक कोण अपने ही संपूरक के बराबर है। वह कौन-सा है?",
          mr: "एक कोन आपल्याच पूरक कोनाइतका आहे. तो कोणता?",
        },
        answer: 90,
        wrong: [45, 180, 60],
        checkExpr: "180/2",
        fmt: deg,
        solution: {
          en: "x = 180 − x means 2x = 180: the right angle, 90°, is the only angle equal to its supplement. 45 is the angle equal to its COMPLEMENT — the smaller pairing.",
          hi: "x = 180 − x यानी 2x = 180: समकोण, 90°, ही अपने संपूरक के बराबर एकमात्र कोण है। 45 अपने पूरक के बराबर वाला कोण है — छोटी जोड़ी।",
          mr: "x = 180 − x म्हणजे 2x = 180: काटकोन, 90°, हाच आपल्या पूरकाइतका एकमेव कोन. 45 हा आपल्या कोटीकोनाइतका कोन — लहान जोडी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Lines l and m are parallel. A transversal makes an obtuse angle of 110° with l. What is the ALTERNATE interior angle at m?",
          hi: "रेखाएँ l और m समांतर हैं। तिर्यक रेखा l से 110° का अधिक कोण बनाती है। m पर एकांतर अंतःकोण कितना?",
          mr: "रेषा l आणि m समांतर आहेत. छेदिका l शी 110° चा विशालकोन करते. m वरील व्युत्क्रम आंतरकोन किती?",
        },
        answer: 110,
        wrong: [70, 20, 250],
        fmt: deg,
        solution: {
          en: "Alternate interior angles between parallels are equal: 110°. 70 pairs it to 180 — that rule belongs to co-interior angles, the ones on the SAME side.",
          hi: "समांतरों के बीच एकांतर अंतःकोण बराबर होते हैं: 110°। 70 उसे 180 तक जोड़ता है — वह नियम एक ही ओर के अंतःकोणों का है।",
          mr: "समांतरांमधील व्युत्क्रम आंतरकोन समान असतात: 110°. 70 त्याला 180 शी जुळवतो — तो नियम एकाच बाजूच्या आंतरकोनांचा.",
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
          en: "An angle is 30° MORE than its complement. Find the angle.",
          hi: "एक कोण अपने पूरक से 30° अधिक है। कोण निकालिए।",
          mr: "एक कोन आपल्या कोटीकोनापेक्षा 30° ने मोठा आहे. कोन काढा.",
        },
        answer: 60,
        wrong: [30, 105, 120],
        checkExpr: "(90+30)/2",
        fmt: deg,
        solution: {
          en: "x = (90 − x) + 30 gives 2x = 120, so x = 60°; its complement 30 is exactly 30 less ✓. 30 is the complement itself; 105 plays the same game with the supplement's 180.",
          hi: "x = (90 − x) + 30 से 2x = 120, अतः x = 60°; उसका पूरक 30 ठीक 30 कम है ✓। 30 स्वयं पूरक है; 105 वही खेल संपूरक के 180 के साथ खेलता है।",
          mr: "x = (90 − x) + 30 मधून 2x = 120, म्हणून x = 60°; त्याचा कोटीकोन 30 नेमका 30 ने कमी ✓. 30 स्वतः कोटीकोन आहे; 105 तोच खेळ पूरकाच्या 180 शी खेळतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The supplement of an angle is FOUR times its complement. Find the angle.",
          hi: "किसी कोण का संपूरक उसके पूरक का चार गुना है। कोण निकालिए।",
          mr: "एका कोनाचा पूरक कोन त्याच्या कोटीकोनाच्या चौपट आहे. कोन काढा.",
        },
        answer: 60,
        wrong: [45, 30, 90],
        checkExpr: "(360-180)/3",
        fmt: deg,
        solution: {
          en: "180 − x = 4(90 − x) unfolds to 3x = 180, so x = 60°: supplement 120, complement 30, and 120 = 4 × 30 ✓. For 45 the ratio is only 3 — close, and wrong.",
          hi: "180 − x = 4(90 − x) खुलकर 3x = 180, अतः x = 60°: संपूरक 120, पूरक 30, और 120 = 4 × 30 ✓। 45 के लिए अनुपात केवल 3 बैठता है — पास, पर ग़लत।",
          mr: "180 − x = 4(90 − x) उघडून 3x = 180, म्हणून x = 60°: पूरक 120, कोटीकोन 30, आणि 120 = 4 × 30 ✓. 45 साठी गुणोत्तर फक्त 3 येते — जवळचे, पण चूक.",
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
          en: "What angle do the hands of a clock make at exactly 4 o'clock?",
          hi: "ठीक 4 बजे घड़ी की सुइयाँ आपस में कितना कोण बनाती हैं?",
          mr: "ठीक 4 वाजता घड्याळाचे काटे परस्परांत किती कोन करतात?",
        },
        answer: 120,
        wrong: [90, 60, 150],
        checkExpr: "4*30",
        fmt: deg,
        solution: {
          en: "The face's 12 hours split 360° into steps of 30°; at 4 o'clock the hands stand 4 steps apart: 4 × 30 = 120°. 90 copies the famous 3 o'clock picture without recounting.",
          hi: "घड़ी के 12 घंटे 360° को 30° की सीढ़ियों में बाँटते हैं; 4 बजे सुइयाँ 4 सीढ़ी दूर खड़ी हैं: 4 × 30 = 120°। 90 मशहूर 3 बजे की तस्वीर बिना दोबारा गिने उतार लेता है।",
          mr: "घड्याळाचे 12 तास 360° ला 30° च्या पायऱ्यांत वाटतात; 4 वाजता काटे 4 पायऱ्या दूर उभे: 4 × 30 = 120°. 90 प्रसिद्ध 3 वाजताचे चित्र पुन्हा न मोजता उतरवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Two lines cross so that one angle is FIVE times its neighbour on the straight line. What is the larger angle?",
          hi: "दो रेखाएँ ऐसे काटती हैं कि एक कोण, सीधी रेखा पर अपने पड़ोसी का पाँच गुना है। बड़ा कोण कितना?",
          mr: "दोन रेषा अशा छेदतात की एक कोन सरळ रेषेवरील आपल्या शेजाऱ्याच्या पाचपट आहे. मोठा कोन किती?",
        },
        answer: 150,
        wrong: [30, 75, 36],
        checkExpr: "5*180/6",
        fmt: deg,
        solution: {
          en: "Neighbours on a straight line share 180°: x + 5x = 180 gives x = 30, so the larger is 150°. 30 stops at the smaller angle; 36 divides 180 by 5 alone, forgetting the pair holds SIX equal parts.",
          hi: "सीधी रेखा के पड़ोसी 180° बाँटते हैं: x + 5x = 180 से x = 30, अतः बड़ा 150°। 30 छोटे कोण पर रुक जाता है; 36 अकेले 5 से 180 बाँटता है, भूलकर कि जोड़ी में छह बराबर हिस्से हैं।",
          mr: "सरळ रेषेवरील शेजारी 180° वाटून घेतात: x + 5x = 180 मधून x = 30, म्हणून मोठा 150°. 30 लहान कोनावर थांबतो; 36 एकट्या 5 ने 180 वाटतो, जोडीत सहा समान भाग आहेत हे विसरून.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 5 — Lines and Angles",
      name: "Lines and Angles",
      slug: "maths-7-lines-and-angles",
      summary:
        "Angles pair off — complements to 90, linear pairs to 180, vertical twins equal — and parallel lines copy their crossings, until a clock face and a five-to-one split put the rules to work.",
      position: 5,
      translations: {
        hi: {
          name: "रेखा एवं कोण",
          summary:
            "कोण जोड़ियाँ बनाते हैं — पूरक 90 तक, रैखिक युग्म 180 तक, शीर्षाभिमुख जुड़वाँ बराबर — और समांतर रेखाएँ अपने चौराहों की नक़ल करती हैं, जब तक घड़ी का चेहरा और पाँच-गुना बँटवारा नियमों को काम पर नहीं लगा देते।",
        },
        mr: {
          name: "रेषा व कोन",
          summary:
            "कोन जोड्या करतात — कोटीकोन 90 पर्यंत, रेषीय जोड्या 180 पर्यंत, समोरचे जुळे समान — आणि समांतर रेषा आपल्या छेदांची नक्कल करतात, जोवर घड्याळाचे तोंड आणि पाचपट वाटणी नियमांना कामाला लावत नाहीत.",
        },
      },
    },
    qs,
  );
}

/** Percentage rendering, shared by the comparing-quantities chapter. */
const pct = (n: number): L => ({ en: `${n}%`, hi: `${n}%`, mr: `${n}%` });

/* ------------------------------------------------------------------------- */
/* Chapter 6 — The Triangle and its Properties (180°, medians, Pythagoras)   */
/* ------------------------------------------------------------------------- */
function triangleProperties(): TopicFileOut {
  const rand = rng("maths-7-triangle-and-its-properties");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Two angles of a triangle are 60° and 70°. What is the third?",
          hi: "त्रिभुज के दो कोण 60° और 70° हैं। तीसरा कितना?",
          mr: "त्रिकोणाचे दोन कोन 60° आणि 70° आहेत. तिसरा किती?",
        },
        answer: 50,
        wrong: [30, 110, 130],
        checkExpr: "180-60-70",
        fmt: deg,
        solution: {
          en: "The three angles always total 180°: 180 − 60 − 70 = 50°. 130 stops after subtracting only one angle; 110 is just the two given ones added.",
          hi: "तीनों कोणों का योग सदा 180°: 180 − 60 − 70 = 50°। 130 केवल एक कोण घटाकर रुक जाता है; 110 दिए दोनों का योग भर है।",
          mr: "तिन्ही कोनांची बेरीज नेहमी 180°: 180 − 60 − 70 = 50°. 130 फक्त एक कोन वजा करून थांबतो; 110 म्हणजे दिलेल्या दोघांची नुसती बेरीज.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many medians does every triangle have?",
          hi: "हर त्रिभुज में कितनी माध्यिकाएँ होती हैं?",
          mr: "प्रत्येक त्रिकोणाला किती मध्यगा असतात?",
        },
        answer: 3,
        wrong: [1, 2, 6],
        solution: {
          en: "One from each vertex to the midpoint of the opposite side: 3 in all. 6 counts the altitudes in as well — those are a different threesome.",
          hi: "हर शीर्ष से सामने की भुजा के मध्य-बिंदु तक एक: कुल 3। 6 शीर्षलंबों को भी गिन लेता है — वे अलग तिकड़ी हैं।",
          mr: "प्रत्येक शिरोबिंदूपासून समोरच्या बाजूच्या मध्यबिंदूपर्यंत एक: एकूण 3. 6 शिरोलंबही मोजतो — ती वेगळी त्रिकुटी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Each angle of an equilateral triangle measures?",
          hi: "समबाहु त्रिभुज का हर कोण कितने का होता है?",
          mr: "समभुज त्रिकोणाचा प्रत्येक कोन किती अंशांचा असतो?",
        },
        answer: 60,
        wrong: [90, 45, 120],
        checkExpr: "180/3",
        fmt: deg,
        solution: {
          en: "Three equal angles share 180°: each gets 60°. 90 belongs to squares and right angles; 120 is the EXTERIOR angle at each corner.",
          hi: "तीन बराबर कोण 180° बाँटते हैं: हर एक को 60°। 90 वर्गों और समकोणों का है; 120 हर कोने का बाह्य कोण है।",
          mr: "तीन समान कोन 180° वाटून घेतात: प्रत्येकाला 60°. 90 चौरस आणि काटकोनांचा; 120 हा प्रत्येक कोपऱ्याचा बाह्यकोन.",
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
          en: "The two interior opposite angles of a triangle are 40° and 60°. What is the exterior angle at the third vertex?",
          hi: "त्रिभुज के दो अंतः विपरीत कोण 40° और 60° हैं। तीसरे शीर्ष पर बाह्य कोण कितना?",
          mr: "त्रिकोणाचे दोन आंतरिक विरुद्ध कोन 40° आणि 60° आहेत. तिसऱ्या शिरोबिंदूवरील बाह्यकोन किती?",
        },
        answer: 100,
        wrong: [80, 20, 120],
        checkExpr: "40+60",
        fmt: deg,
        solution: {
          en: "An exterior angle equals the SUM of the two interior opposite angles: 40 + 60 = 100°. 80 is the interior angle at that vertex, its linear-pair partner.",
          hi: "बाह्य कोण दोनों अंतः विपरीत कोणों के योग के बराबर होता है: 40 + 60 = 100°। 80 उसी शीर्ष का अंतः कोण है, उसका रैखिक-युग्म साथी।",
          mr: "बाह्यकोन दोन आंतरिक विरुद्ध कोनांच्या बेरजेइतका असतो: 40 + 60 = 100°. 80 हा त्याच शिरोबिंदूचा आंतरकोन, त्याचा रेषीय-जोडी साथी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "An isosceles triangle has a vertex angle of 40° between its two equal sides. What is each base angle?",
          hi: "समद्विबाहु त्रिभुज की दो बराबर भुजाओं के बीच शीर्ष कोण 40° है। हर आधार कोण कितना?",
          mr: "समद्विभुज त्रिकोणाच्या दोन समान बाजूंमधील शिरोकोन 40° आहे. प्रत्येक पायाकोन किती?",
        },
        answer: 70,
        wrong: [40, 140, 55],
        checkExpr: "(180-40)/2",
        fmt: deg,
        solution: {
          en: "The remaining 140° splits equally between the two base angles: 70° each. 140 forgets to split; 40 copies the vertex angle onto the base.",
          hi: "बची 140° दोनों आधार कोणों में बराबर बँटती है: 70°-70°। 140 बाँटना भूल जाता है; 40 शीर्ष कोण को ही आधार पर उतार देता है।",
          mr: "उरलेले 140° दोन पायाकोनांत सारखे वाटले जातात: प्रत्येकी 70°. 140 वाटायला विसरतो; 40 शिरोकोनच पायावर उतरवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "One acute angle of a right-angled triangle is 35°. What is the other acute angle?",
          hi: "समकोण त्रिभुज का एक न्यून कोण 35° है। दूसरा न्यून कोण कितना?",
          mr: "काटकोन त्रिकोणाचा एक लघुकोन 35° आहे. दुसरा लघुकोन किती?",
        },
        answer: 55,
        wrong: [145, 65, 35],
        checkExpr: "90-35",
        fmt: deg,
        solution: {
          en: "The right angle takes 90, leaving 90 for the two acute angles: 90 − 35 = 55°. 145 subtracts from 180 and forgets the right angle already spent its share.",
          hi: "समकोण 90 ले लेता है, दोनों न्यून कोणों के लिए 90 बचते हैं: 90 − 35 = 55°। 145 सीधे 180 में से घटाता है, भूलकर कि समकोण अपना हिस्सा ले चुका।",
          mr: "काटकोन 90 घेतो, दोन लघुकोनांसाठी 90 उरतात: 90 − 35 = 55°. 145 थेट 180 मधून वजा करतो, काटकोनाने आपला वाटा घेतला हे विसरून.",
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
          en: "A right triangle has legs 3 cm and 4 cm. How long is the hypotenuse, in cm?",
          hi: "समकोण त्रिभुज की दो भुजाएँ 3 सेमी और 4 सेमी हैं। कर्ण कितने सेमी का?",
          mr: "काटकोन त्रिकोणाच्या दोन बाजू 3 सेमी आणि 4 सेमी आहेत. कर्ण किती सेमी?",
        },
        answer: 5,
        wrong: [7, 12, 25],
        solution: {
          en: "Pythagoras: 3² + 4² = 9 + 16 = 25, and 25 is 5² — so the hypotenuse is 5 cm. 7 adds the legs; 25 stops at the SQUARE of the answer.",
          hi: "पाइथागोरस: 3² + 4² = 9 + 16 = 25, और 25 है 5² — अतः कर्ण 5 सेमी। 7 भुजाएँ जोड़ देता है; 25 उत्तर के वर्ग पर रुक जाता है।",
          mr: "पायथागोरस: 3² + 4² = 9 + 16 = 25, आणि 25 म्हणजे 5² — म्हणून कर्ण 5 सेमी. 7 बाजूंची बेरीज करतो; 25 उत्तराच्या वर्गावर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Two sides of a triangle are 4 cm and 9 cm. Which of these lengths is IMPOSSIBLE for the third side?",
          hi: "त्रिभुज की दो भुजाएँ 4 सेमी और 9 सेमी हैं। तीसरी भुजा के लिए इनमें से कौन-सी लंबाई असंभव है?",
          mr: "त्रिकोणाच्या दोन बाजू 4 सेमी आणि 9 सेमी आहेत. तिसऱ्या बाजूसाठी यांपैकी कोणती लांबी अशक्य आहे?",
        },
        answer: 4,
        wrong: [6, 10, 12],
        solution: {
          en: "The third side must beat the gap and stay under the sum: between 9 − 4 = 5 and 9 + 4 = 13. A third side of 4 fails, for 4 + 4 = 8 cannot reach across the 9 — the arms would never meet.",
          hi: "तीसरी भुजा को अंतर से बड़ा और योग से छोटा होना चाहिए: 9 − 4 = 5 और 9 + 4 = 13 के बीच। 4 विफल है, क्योंकि 4 + 4 = 8 नौ के आर-पार नहीं पहुँचता — बाहें कभी मिलेंगी ही नहीं।",
          mr: "तिसऱ्या बाजूने फरकाहून मोठे आणि बेरजेहून लहान असावे: 9 − 4 = 5 आणि 9 + 4 = 13 च्या दरम्यान. 4 अपयशी, कारण 4 + 4 = 8 नवाच्या पल्याड पोहोचत नाही — हात कधी जुळणारच नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A triangle's angles are in the ratio 1 : 2 : 3. What is the largest angle?",
          hi: "त्रिभुज के कोण 1 : 2 : 3 के अनुपात में हैं। सबसे बड़ा कोण कितना?",
          mr: "त्रिकोणाचे कोन 1 : 2 : 3 या गुणोत्तरात आहेत. सर्वांत मोठा कोन किती?",
        },
        answer: 90,
        wrong: [60, 30, 120],
        checkExpr: "3*180/6",
        fmt: deg,
        solution: {
          en: "Six ratio-parts share 180°, so one part is 30: the angles are 30, 60, 90 — the largest is 90°, and the triangle is secretly right-angled. 60 picks the middle part.",
          hi: "छह अनुपात-भाग 180° बाँटते हैं, एक भाग 30: कोण हैं 30, 60, 90 — सबसे बड़ा 90°, और त्रिभुज चुपचाप समकोण निकलता है। 60 बीच वाला भाग उठा लेता है।",
          mr: "सहा गुणोत्तर-भाग 180° वाटतात, एक भाग 30: कोन 30, 60, 90 — सर्वांत मोठा 90°, आणि त्रिकोण गुपचूप काटकोन ठरतो. 60 मधला भाग उचलतो.",
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
          en: "In triangle PQR, angle P equals angle Q, and angle R is 80°. What is angle P?",
          hi: "त्रिभुज PQR में कोण P और कोण Q बराबर हैं, और कोण R 80° है। कोण P कितना?",
          mr: "त्रिकोण PQR मध्ये कोन P आणि कोन Q समान आहेत, आणि कोन R 80° आहे. कोन P किती?",
        },
        answer: 50,
        wrong: [80, 100, 40],
        checkExpr: "(180-80)/2",
        fmt: deg,
        solution: {
          en: "The equal pair shares what R leaves: (180 − 80) ÷ 2 = 50°. 100 forgets to halve; 40 halves R itself instead of the remainder.",
          hi: "बराबर जोड़ी R का छोड़ा हुआ बाँटती है: (180 − 80) ÷ 2 = 50°। 100 आधा करना भूल जाता है; 40 शेष की जगह R को ही आधा कर देता है।",
          mr: "समान जोडी R ने उरवलेले वाटते: (180 − 80) ÷ 2 = 50°. 100 निम्मे करायला विसरतो; 40 शेषाऐवजी R लाच निम्मे करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A 13 m ladder leans against a wall with its foot 5 m from the base. How high up the wall does it reach, in metres?",
          hi: "13 मीटर की सीढ़ी दीवार से टिकी है, पैर दीवार से 5 मीटर दूर। वह दीवार पर कितने मीटर ऊँचाई तक पहुँचती है?",
          mr: "13 मीटरची शिडी भिंतीला टेकली आहे, पाय भिंतीपासून 5 मीटर दूर. ती भिंतीवर किती मीटर उंचीपर्यंत पोहोचते?",
        },
        answer: 12,
        wrong: [8, 18, 144],
        solution: {
          en: "The ladder is the hypotenuse: 13² − 5² = 169 − 25 = 144, and 144 = 12² — so 12 m. 8 subtracts the plain lengths; 144 stops at the square.",
          hi: "सीढ़ी कर्ण है: 13² − 5² = 169 − 25 = 144, और 144 = 12² — अतः 12 मीटर। 8 सीधी लंबाइयाँ घटा देता है; 144 वर्ग पर रुक जाता है।",
          mr: "शिडी हा कर्ण: 13² − 5² = 169 − 25 = 144, आणि 144 = 12² — म्हणून 12 मीटर. 8 नुसत्या लांब्या वजा करतो; 144 वर्गावर थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "An exterior angle of a triangle is 110°, and one of its interior opposite angles is 45°. What is the other interior opposite angle?",
          hi: "त्रिभुज का एक बाह्य कोण 110° है, और उसका एक अंतः विपरीत कोण 45°। दूसरा अंतः विपरीत कोण कितना?",
          mr: "त्रिकोणाचा एक बाह्यकोन 110° आहे, आणि त्याचा एक आंतरिक विरुद्ध कोन 45°. दुसरा आंतरिक विरुद्ध कोन किती?",
        },
        answer: 65,
        wrong: [70, 155, 35],
        checkExpr: "110-45",
        fmt: deg,
        solution: {
          en: "The exterior angle is the sum of the two interior opposites: 110 − 45 = 65°. 70 subtracts 110 from 180 first, answering the wrong angle entirely.",
          hi: "बाह्य कोण दोनों अंतः विपरीतों का योग है: 110 − 45 = 65°। 70 पहले 180 में से 110 घटाकर बिलकुल दूसरे कोण का उत्तर दे बैठता है।",
          mr: "बाह्यकोन दोन आंतरिक विरुद्धांची बेरीज: 110 − 45 = 65°. 70 आधी 180 मधून 110 वजा करून भलत्याच कोनाचे उत्तर देतो.",
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
          en: "The angles of a triangle are x, x + 20 and x + 40 degrees. What is the LARGEST angle?",
          hi: "त्रिभुज के कोण x, x + 20 और x + 40 डिग्री हैं। सबसे बड़ा कोण कितना?",
          mr: "त्रिकोणाचे कोन x, x + 20 आणि x + 40 अंश आहेत. सर्वांत मोठा कोन किती?",
        },
        answer: 80,
        wrong: [40, 60, 100],
        checkExpr: "(180-60)/3+40",
        fmt: deg,
        solution: {
          en: "3x + 60 = 180 gives x = 40, so the angles are 40, 60, 80 — the largest is 80°. 40 answers x itself; the question asked for x + 40.",
          hi: "3x + 60 = 180 से x = 40, अतः कोण 40, 60, 80 — सबसे बड़ा 80°। 40 स्वयं x का उत्तर है; प्रश्न x + 40 पूछ रहा था।",
          mr: "3x + 60 = 180 मधून x = 40, म्हणून कोन 40, 60, 80 — सर्वांत मोठा 80°. 40 हे स्वतः x चे उत्तर; प्रश्न x + 40 विचारत होता.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "An isosceles triangle has perimeter 32 cm and base 12 cm. How long is each equal side, in cm?",
          hi: "समद्विबाहु त्रिभुज का परिमाप 32 सेमी और आधार 12 सेमी है। हर बराबर भुजा कितने सेमी की?",
          mr: "समद्विभुज त्रिकोणाची परिमिती 32 सेमी आणि पाया 12 सेमी आहे. प्रत्येक समान बाजू किती सेमी?",
        },
        answer: 10,
        wrong: [20, 12, 16],
        checkExpr: "(32-12)/2",
        fmt: undefined,
        solution: {
          en: "The two equal sides share 32 − 12 = 20 cm: 10 cm each. 20 forgets to split the remainder; 16 halves the whole perimeter as if the base didn't exist.",
          hi: "दोनों बराबर भुजाएँ 32 − 12 = 20 सेमी बाँटती हैं: 10-10 सेमी। 20 शेष बाँटना भूल जाता है; 16 पूरे परिमाप को आधा कर देता है, मानो आधार हो ही नहीं।",
          mr: "दोन समान बाजू 32 − 12 = 20 सेमी वाटतात: प्रत्येकी 10 सेमी. 20 शेष वाटायला विसरतो; 16 पाया नसल्यासारखी सारी परिमिती निम्मी करतो.",
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
          en: "A student claims a triangle can have TWO right angles. After those two angles, how many degrees remain for the third?",
          hi: "एक विद्यार्थी का दावा है कि त्रिभुज में दो समकोण हो सकते हैं। उन दो कोणों के बाद तीसरे के लिए कितने डिग्री बचते हैं?",
          mr: "एका विद्यार्थ्याचा दावा आहे की त्रिकोणात दोन काटकोन असू शकतात. त्या दोन कोनांनंतर तिसऱ्यासाठी किती अंश उरतात?",
        },
        answer: 0,
        wrong: [90, 45, 10],
        checkExpr: "180-90-90",
        fmt: deg,
        solution: {
          en: "180 − 90 − 90 = 0°: nothing remains, so the third vertex flattens into the base and the 'triangle' collapses into a line. Two right angles are impossible — that is the point of the sum rule.",
          hi: "180 − 90 − 90 = 0°: कुछ नहीं बचता, तीसरा शीर्ष आधार में पिचक जाता है और 'त्रिभुज' रेखा बन जाता है। दो समकोण असंभव हैं — योग-नियम का यही अर्थ है।",
          mr: "180 − 90 − 90 = 0°: काहीच उरत नाही, तिसरा शिरोबिंदू पायात सपाट होतो आणि 'त्रिकोण' रेषा बनतो. दोन काटकोन अशक्य — बेरीज-नियमाचा हाच अर्थ.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A tree snaps 5 m above the ground; the fallen top touches the ground 12 m from the base, still hinged to the trunk. How tall was the tree, in metres?",
          hi: "एक पेड़ ज़मीन से 5 मीटर ऊपर टूटता है; गिरा हुआ सिरा तने से जुड़ा-जुड़ा आधार से 12 मीटर दूर ज़मीन छूता है। पेड़ कितने मीटर ऊँचा था?",
          mr: "एक झाड जमिनीपासून 5 मीटर उंचीवर मोडते; पडलेले टोक खोडाशी जोडलेले राहून पायथ्यापासून 12 मीटरवर जमिनीला टेकते. झाड किती मीटर उंच होते?",
        },
        answer: 18,
        wrong: [13, 17, 12],
        checkExpr: "5+13",
        solution: {
          en: "The broken part is the hypotenuse of a 5-12 right triangle: 5² + 12² = 169 = 13². Total height = standing 5 + fallen 13 = 18 m. 13 forgets the stump still standing; 17 adds 5 + 12, mistaking a leg for the hypotenuse.",
          hi: "टूटा भाग 5-12 समकोण त्रिभुज का कर्ण है: 5² + 12² = 169 = 13²। कुल ऊँचाई = खड़ा 5 + गिरा 13 = 18 मीटर। 13 खड़ा ठूँठ भूल जाता है; 17 में 5 + 12 जोड़कर भुजा को ही कर्ण मान लिया गया।",
          mr: "मोडलेला भाग 5-12 काटकोन त्रिकोणाचा कर्ण: 5² + 12² = 169 = 13². एकूण उंची = उभा 5 + पडलेला 13 = 18 मीटर. 13 उभा बुंधा विसरतो; 17 मध्ये 5 + 12 जोडून बाजूलाच कर्ण मानले गेले.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 6 — The Triangle and its Properties",
      name: "The Triangle and its Properties",
      slug: "maths-7-triangle-and-its-properties",
      summary:
        "Angles that must total 180, exterior angles equal to their far partners, sides that must reach each other — and Pythagoras measuring ladders and broken trees.",
      position: 6,
      translations: {
        hi: {
          name: "त्रिभुज एवं उसके गुण",
          summary:
            "कोण जिनका योग 180 होना ही है, बाह्य कोण जो दूर के साथियों के बराबर, भुजाएँ जिन्हें एक-दूसरे तक पहुँचना ही है — और सीढ़ियाँ व टूटे पेड़ नापता पाइथागोरस।",
        },
        mr: {
          name: "त्रिकोण आणि त्याचे गुणधर्म",
          summary:
            "बेरीज 180 व्हावीच लागणारे कोन, दूरच्या जोडीदारांइतके बाह्यकोन, एकमेकींपर्यंत पोहोचाव्याच लागणाऱ्या बाजू — आणि शिड्या व मोडलेली झाडे मोजणारा पायथागोरस.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Congruence of Triangles (SSS, SAS, ASA, RHS)                  */
/* ------------------------------------------------------------------------- */
function congruence(): TopicFileOut {
  const rand = rng("maths-7-congruence");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Segment PQ is congruent to a segment of length 7 cm. How long is PQ, in cm?",
          hi: "रेखाखंड PQ, 7 सेमी लंबे रेखाखंड के सर्वांगसम है। PQ कितने सेमी का?",
          mr: "रेषाखंड PQ हा 7 सेमी लांबीच्या रेषाखंडाशी एकरूप आहे. PQ किती सेमी?",
        },
        answer: 7,
        wrong: [14, 3.5, 70],
        solution: {
          en: "Congruent segments cover each other exactly, so their lengths are equal: 7 cm. 14 doubles it, as if congruence meant joining the two end to end.",
          hi: "सर्वांगसम रेखाखंड एक-दूसरे को ठीक-ठीक ढक लेते हैं, अतः लंबाइयाँ बराबर: 7 सेमी। 14 उसे दोगुना कर देता है, मानो सर्वांगसमता सिरे से सिरा जोड़ना हो।",
          mr: "एकरूप रेषाखंड एकमेकांना नेमके झाकतात, म्हणून लांब्या समान: 7 सेमी. 14 त्याला दुप्पट करतो, जणू एकरूपता म्हणजे टोकाला टोक जोडणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "An angle is congruent to a 40° angle. What does it measure?",
          hi: "एक कोण 40° के कोण के सर्वांगसम है। वह कितने का है?",
          mr: "एक कोन 40° च्या कोनाशी एकरूप आहे. तो किती अंशांचा?",
        },
        answer: 40,
        wrong: [50, 80, 140],
        fmt: deg,
        solution: {
          en: "Congruent angles have equal measures: 40°. 140 supposes congruence pairs an angle with its supplement — it never does; it copies.",
          hi: "सर्वांगसम कोणों की मापें बराबर होती हैं: 40°। 140 मानता है कि सर्वांगसमता कोण को उसके संपूरक से जोड़ती है — कभी नहीं; वह नक़ल करती है।",
          mr: "एकरूप कोनांची मापे समान असतात: 40°. 140 समजतो की एकरूपता कोनाला त्याच्या पूरकाशी जोडते — कधीच नाही; ती नक्कल करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "ΔABC ≅ ΔPQR, and AB = 6 cm. How long is PQ, in cm?",
          hi: "ΔABC ≅ ΔPQR, और AB = 6 सेमी। PQ कितने सेमी का?",
          mr: "ΔABC ≅ ΔPQR, आणि AB = 6 सेमी. PQ किती सेमी?",
        },
        answer: 6,
        wrong: [3, 12, 9],
        solution: {
          en: "The letters carry the map: A↔P, B↔Q, so AB matches PQ exactly — 6 cm. Corresponding parts of congruent triangles are equal, in the ORDER written.",
          hi: "अक्षर नक़्शा ढोते हैं: A↔P, B↔Q, अतः AB ठीक PQ से मिलता है — 6 सेमी। सर्वांगसम त्रिभुजों के संगत भाग बराबर होते हैं, लिखे क्रम में।",
          mr: "अक्षरे नकाशा वाहतात: A↔P, B↔Q, म्हणून AB नेमके PQ शी जुळते — 6 सेमी. एकरूप त्रिकोणांचे संगत भाग समान असतात, लिहिलेल्या क्रमाने.",
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
          en: "To show two triangles congruent by SSS, how many pairs of equal sides do you need?",
          hi: "SSS से दो त्रिभुज सर्वांगसम दिखाने के लिए बराबर भुजाओं के कितने जोड़े चाहिए?",
          mr: "SSS ने दोन त्रिकोण एकरूप दाखवण्यासाठी समान बाजूंच्या किती जोड्या हव्यात?",
        },
        answer: 3,
        wrong: [2, 1, 4],
        solution: {
          en: "Side-Side-Side: all 3 pairs. Two matching sides still leave the third free to swing — only the third pair locks the shape.",
          hi: "भुजा-भुजा-भुजा: तीनों 3 जोड़े। दो मिलती भुजाएँ तीसरी को झूलने की छूट देती हैं — तीसरा जोड़ा ही आकृति को जड़ता है।",
          mr: "बाजू-बाजू-बाजू: तिन्ही 3 जोड्या. दोन जुळणाऱ्या बाजू तिसरीला झुलायला मोकळीक देतात — तिसरी जोडीच आकृती पक्की करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "ΔDEF ≅ ΔLMN, with angle D = 30° and angle E = 80°. What is angle L?",
          hi: "ΔDEF ≅ ΔLMN, कोण D = 30° और कोण E = 80°। कोण L कितना?",
          mr: "ΔDEF ≅ ΔLMN, कोन D = 30° आणि कोन E = 80°. कोन L किती?",
        },
        answer: 30,
        wrong: [80, 70, 100],
        fmt: deg,
        solution: {
          en: "Read the correspondence off the letters: D↔L, so angle L copies angle D — 30°. 80 grabs E's angle; 70 computes the third angle nobody asked about.",
          hi: "अक्षरों से संगति पढ़िए: D↔L, अतः कोण L कोण D की नक़ल है — 30°। 80 कोण E उठा लेता है; 70 वह तीसरा कोण निकालता है जो पूछा ही नहीं गया।",
          mr: "अक्षरांतून संगती वाचा: D↔L, म्हणून कोन L कोन D ची नक्कल — 30°. 80 कोन E उचलतो; 70 न विचारलेला तिसरा कोन काढतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The ASA test needs two angles and how many included sides?",
          hi: "ASA जाँच में दो कोण और कितनी अंतर्गत भुजाएँ चाहिए?",
          mr: "ASA चाचणीत दोन कोन आणि किती समाविष्ट बाजू लागतात?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        solution: {
          en: "Angle-Side-Angle: exactly 1 side, and it must sit BETWEEN the two angles. With 0 sides the triangle can be any size — same shape, no fixed scale.",
          hi: "कोण-भुजा-कोण: ठीक 1 भुजा, और वह दोनों कोणों के बीच बैठनी चाहिए। 0 भुजाओं से त्रिभुज किसी भी नाप का हो सकता है — आकार वही, पैमाना अनिश्चित।",
          mr: "कोन-बाजू-कोन: नेमकी 1 बाजू, आणि ती दोन कोनांच्या मध्ये हवी. 0 बाजूंनी त्रिकोण कोणत्याही मापाचा होऊ शकतो — आकार तोच, प्रमाण अनिश्चित.",
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
          en: "ΔABC ≅ ΔPQR, with angle A = 50° and angle C = 70°. What is angle Q?",
          hi: "ΔABC ≅ ΔPQR, कोण A = 50° और कोण C = 70°। कोण Q कितना?",
          mr: "ΔABC ≅ ΔPQR, कोन A = 50° आणि कोन C = 70°. कोन Q किती?",
        },
        answer: 60,
        wrong: [70, 50, 110],
        checkExpr: "180-50-70",
        fmt: deg,
        solution: {
          en: "Q corresponds to B, and B = 180 − 50 − 70 = 60°. 50 and 70 copy A and C — but the letters say Q answers to B, the angle you must COMPUTE first.",
          hi: "Q की संगति B से है, और B = 180 − 50 − 70 = 60°। 50 और 70 A व C की नक़ल हैं — पर अक्षर कहते हैं कि Q का जवाब B है, जिसे पहले निकालना पड़ता है।",
          mr: "Q ची संगती B शी, आणि B = 180 − 50 − 70 = 60°. 50 आणि 70 A व C ची नक्कल — पण अक्षरे सांगतात की Q चे उत्तर B, जो आधी काढावाच लागतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In the RHS test for right triangles, you match the hypotenuse and how many other sides?",
          hi: "समकोण त्रिभुजों की RHS जाँच में कर्ण के साथ और कितनी भुजाएँ मिलानी होती हैं?",
          mr: "काटकोन त्रिकोणांच्या RHS चाचणीत कर्णासोबत आणखी किती बाजू जुळवाव्या लागतात?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        solution: {
          en: "Right angle, Hypotenuse, Side: 1 other side. The right angle plus Pythagoras silently fixes the third side, so nothing more is needed.",
          hi: "समकोण, कर्ण, भुजा: 1 और भुजा। समकोण और पाइथागोरस चुपचाप तीसरी भुजा तय कर देते हैं, अतः और कुछ नहीं चाहिए।",
          mr: "काटकोन, कर्ण, बाजू: आणखी 1 बाजू. काटकोन आणि पायथागोरस गुपचूप तिसरी बाजू ठरवतात, म्हणून आणखी काही लागत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "ΔPQR ≅ ΔXYZ, with PQ = 5, QR = 7 and PR = 9. What is XZ?",
          hi: "ΔPQR ≅ ΔXYZ, PQ = 5, QR = 7 और PR = 9। XZ कितना?",
          mr: "ΔPQR ≅ ΔXYZ, PQ = 5, QR = 7 आणि PR = 9. XZ किती?",
        },
        answer: 9,
        wrong: [5, 7, 21],
        solution: {
          en: "X answers to P and Z to R, so XZ copies PR: 9. 5 and 7 belong to the other letter-pairs; 21 adds all three sides — a perimeter nobody asked for.",
          hi: "X का जवाब P और Z का R, अतः XZ नक़ल करता है PR की: 9। 5 और 7 दूसरे अक्षर-जोड़ों के हैं; 21 तीनों भुजाएँ जोड़ देता है — बिन माँगा परिमाप।",
          mr: "X चे उत्तर P आणि Z चे R, म्हणून XZ नक्कल करतो PR ची: 9. 5 आणि 7 इतर अक्षर-जोड्यांचे; 21 तिन्ही बाजू जोडतो — न मागितलेली परिमिती.",
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
          en: "Diagonal AC splits quadrilateral ABCD into two triangles, and ΔABC ≅ ΔCDA. If BC = 8 cm, how long is DA, in cm?",
          hi: "विकर्ण AC चतुर्भुज ABCD को दो त्रिभुजों में बाँटता है, और ΔABC ≅ ΔCDA। यदि BC = 8 सेमी, तो DA कितने सेमी?",
          mr: "कर्ण AC चौकोन ABCD ला दोन त्रिकोणांत वाटतो, आणि ΔABC ≅ ΔCDA. BC = 8 सेमी असल्यास DA किती सेमी?",
        },
        answer: 8,
        wrong: [4, 16, 6],
        solution: {
          en: "Match letter by letter: A↔C, B↔D, C↔A — so BC corresponds to DA, and DA = 8 cm. This is how one diagonal proves opposite sides of a parallelogram equal.",
          hi: "अक्षर-दर-अक्षर मिलाइए: A↔C, B↔D, C↔A — अतः BC की संगति DA से, और DA = 8 सेमी। इसी तरह एक विकर्ण समांतर चतुर्भुज की सम्मुख भुजाएँ बराबर सिद्ध करता है।",
          mr: "अक्षरागणिक जुळवा: A↔C, B↔D, C↔A — म्हणून BC ची संगती DA शी, आणि DA = 8 सेमी. असाच एक कर्ण समांतरभुज चौकोनाच्या समोरच्या बाजू समान सिद्ध करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "ΔABC ≅ ΔPQR, and ΔABC has perimeter 24 cm. What is the perimeter of ΔPQR, in cm?",
          hi: "ΔABC ≅ ΔPQR, और ΔABC का परिमाप 24 सेमी है। ΔPQR का परिमाप कितने सेमी?",
          mr: "ΔABC ≅ ΔPQR, आणि ΔABC ची परिमिती 24 सेमी आहे. ΔPQR ची परिमिती किती सेमी?",
        },
        answer: 24,
        wrong: [12, 48, 30],
        solution: {
          en: "Every side copies its partner, so the sums copy too: 24 cm. Congruence preserves ALL measurements — sides, angles, perimeter, area alike.",
          hi: "हर भुजा अपने साथी की नक़ल है, अतः योग भी नक़ल: 24 सेमी। सर्वांगसमता सारी मापें सुरक्षित रखती है — भुजाएँ, कोण, परिमाप, क्षेत्रफल सब।",
          mr: "प्रत्येक बाजू आपल्या जोडीदाराची नक्कल, म्हणून बेरजाही नक्कल: 24 सेमी. एकरूपता सर्व मापे राखते — बाजू, कोन, परिमिती, क्षेत्रफळ सारे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "ΔABC ≅ ΔPQR, with angle B = 90° and angle C = 30°. What is angle P?",
          hi: "ΔABC ≅ ΔPQR, कोण B = 90° और कोण C = 30°। कोण P कितना?",
          mr: "ΔABC ≅ ΔPQR, कोन B = 90° आणि कोन C = 30°. कोन P किती?",
        },
        answer: 60,
        wrong: [90, 30, 120],
        checkExpr: "180-90-30",
        fmt: deg,
        solution: {
          en: "P answers to A, and A = 180 − 90 − 30 = 60°. 90 and 30 copy the two given angles, but the letters point P at the one still unknown.",
          hi: "P का जवाब A है, और A = 180 − 90 − 30 = 60°। 90 और 30 दिए कोणों की नक़ल हैं, पर अक्षर P को उसी की ओर भेजते हैं जो अभी अज्ञात है।",
          mr: "P चे उत्तर A, आणि A = 180 − 90 − 30 = 60°. 90 आणि 30 दिलेल्या कोनांची नक्कल, पण अक्षरे P ला अजून अज्ञात असलेल्याकडे पाठवतात.",
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
          en: "In ΔABC, AB = AC, and AD is the median to BC, which measures 10 cm. ΔABD ≅ ΔACD by SSS. How long is BD, in cm?",
          hi: "ΔABC में AB = AC, और AD भुजा BC की माध्यिका है, जो 10 सेमी की है। SSS से ΔABD ≅ ΔACD। BD कितने सेमी?",
          mr: "ΔABC मध्ये AB = AC, आणि AD ही 10 सेमी असलेल्या BC ची मध्यगा आहे. SSS ने ΔABD ≅ ΔACD. BD किती सेमी?",
        },
        answer: 5,
        wrong: [10, 2.5, 20],
        checkExpr: "10/2",
        solution: {
          en: "A median lands on the midpoint, so BD = 10 ÷ 2 = 5 cm — and that shared midpoint is exactly what makes the SSS pair work (AB = AC, BD = CD, AD common).",
          hi: "माध्यिका मध्य-बिंदु पर उतरती है, अतः BD = 10 ÷ 2 = 5 सेमी — और वही साझा मध्य-बिंदु SSS जोड़ी को चलाता है (AB = AC, BD = CD, AD साझी)।",
          mr: "मध्यगा मध्यबिंदूवर उतरते, म्हणून BD = 10 ÷ 2 = 5 सेमी — आणि तोच सामाईक मध्यबिंदू SSS जोडीला चालवतो (AB = AC, BD = CD, AD सामाईक).",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "ΔABC ≅ ΔDEF, with AB = 2x + 1 and DE = 9. Find x.",
          hi: "ΔABC ≅ ΔDEF, AB = 2x + 1 और DE = 9। x निकालिए।",
          mr: "ΔABC ≅ ΔDEF, AB = 2x + 1 आणि DE = 9. x काढा.",
        },
        answer: 4,
        wrong: [5, 8, 3],
        checkExpr: "(9-1)/2",
        solution: {
          en: "AB corresponds to DE, so 2x + 1 = 9: 2x = 8 and x = 4. 5 adds the 1 instead of removing it; 8 stops at 2x.",
          hi: "AB की संगति DE से, अतः 2x + 1 = 9: 2x = 8 और x = 4। 5 एक हटाने की जगह जोड़ देता है; 8 2x पर रुक जाता है।",
          mr: "AB ची संगती DE शी, म्हणून 2x + 1 = 9: 2x = 8 आणि x = 4. 5 एक काढण्याऐवजी मिळवतो; 8 2x वर थांबतो.",
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
          en: "Two equilateral triangles have sides 3 cm and 6 cm. Every angle in both is 60°. How many pairs of corresponding sides are EQUAL?",
          hi: "दो समबाहु त्रिभुजों की भुजाएँ 3 सेमी और 6 सेमी हैं। दोनों के सारे कोण 60° हैं। संगत भुजाओं के कितने जोड़े बराबर हैं?",
          mr: "दोन समभुज त्रिकोणांच्या बाजू 3 सेमी आणि 6 सेमी आहेत. दोन्हींतील सर्व कोन 60° आहेत. संगत बाजूंच्या किती जोड्या समान आहेत?",
        },
        answer: 0,
        wrong: [3, 1, 2],
        solution: {
          en: "Every side-pair is 3 against 6: 0 equal pairs. All six angles match, yet the triangles are NOT congruent — AAA fixes only the shape, never the size. That is exactly why AAA is missing from the list of congruence tests.",
          hi: "हर भुजा-जोड़ी 3 बनाम 6 है: 0 बराबर जोड़े। छहों कोण मिलते हैं, फिर भी त्रिभुज सर्वांगसम नहीं — AAA केवल आकार तय करता है, नाप कभी नहीं। इसीलिए AAA सर्वांगसमता-जाँचों की सूची से ग़ायब है।",
          mr: "प्रत्येक बाजू-जोडी 3 विरुद्ध 6: 0 समान जोड्या. सहाही कोन जुळतात, तरी त्रिकोण एकरूप नाहीत — AAA फक्त आकार ठरवते, माप कधीच नाही. म्हणूनच AAA एकरूपता-चाचण्यांच्या यादीत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "In isosceles ΔABC (AB = AC), the median AD meets BC at D, and ΔABD ≅ ΔACD. Since angles ADB and ADC also sit on the straight line BC, what is angle ADB?",
          hi: "समद्विबाहु ΔABC (AB = AC) में माध्यिका AD, BC से D पर मिलती है, और ΔABD ≅ ΔACD। चूँकि कोण ADB और ADC सीधी रेखा BC पर भी बैठे हैं, कोण ADB कितना?",
          mr: "समद्विभुज ΔABC (AB = AC) मध्ये मध्यगा AD, BC ला D वर मिळते, आणि ΔABD ≅ ΔACD. कोन ADB आणि ADC सरळ रेषा BC वरही असल्याने, कोन ADB किती?",
        },
        answer: 90,
        wrong: [45, 60, 180],
        checkExpr: "180/2",
        fmt: deg,
        solution: {
          en: "Congruence makes the two angles equal; the straight line makes them total 180°. Equal and totalling 180 forces each to 90° — the median of an isosceles triangle stands perpendicular to the base, proved with nothing but matching.",
          hi: "सर्वांगसमता दोनों कोण बराबर करती है; सीधी रेखा उनका योग 180° करती है। बराबर और योग 180 — हर एक 90° होने को विवश। समद्विबाहु त्रिभुज की माध्यिका आधार पर लंब खड़ी होती है, केवल मिलान से सिद्ध।",
          mr: "एकरूपता दोन्ही कोन समान करते; सरळ रेषा त्यांची बेरीज 180° करते. समान आणि बेरीज 180 — प्रत्येक 90° होणे भाग. समद्विभुज त्रिकोणाची मध्यगा पायावर लंब उभी राहते, केवळ जुळणीने सिद्ध.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 7 — Congruence of Triangles",
      name: "Congruence of Triangles",
      slug: "maths-7-congruence",
      summary:
        "Shapes that cover each other exactly: letters carrying the correspondence, four honest tests — SSS, SAS, ASA, RHS — and the AAA impostor that fixes shape but never size.",
      position: 7,
      translations: {
        hi: {
          name: "त्रिभुजों की सर्वांगसमता",
          summary:
            "आकृतियाँ जो एक-दूसरे को ठीक-ठीक ढक लें: संगति ढोते अक्षर, चार खरी जाँचें — SSS, SAS, ASA, RHS — और AAA का बहरूपिया जो आकार तय करता है, नाप कभी नहीं।",
        },
        mr: {
          name: "त्रिकोणांची एकरूपता",
          summary:
            "एकमेकांना नेमक्या झाकणाऱ्या आकृती: संगती वाहणारी अक्षरे, चार खऱ्या चाचण्या — SSS, SAS, ASA, RHS — आणि आकार ठरवणारा पण माप कधीच न ठरवणारा AAA चा तोतया.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Comparing Quantities (percent, profit-loss, simple interest)  */
/* ------------------------------------------------------------------------- */
function comparingQuantities(): TopicFileOut {
  const rand = rng("maths-7-comparing-quantities");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Write 3/4 as a percentage.",
          hi: "3/4 को प्रतिशत में लिखिए।",
          mr: "3/4 टक्केवारीत लिहा.",
        },
        answer: 75,
        wrong: [34, 43, 80],
        checkExpr: "3*100/4",
        fmt: pct,
        solution: {
          en: "Per cent means per hundred: 3/4 × 100 = 75%. 34 just glues the digits together; a fraction is a division, not a costume.",
          hi: "प्रतिशत यानी प्रति सौ: 3/4 × 100 = 75%। 34 बस अंक चिपका देता है; भिन्न एक भाग है, वेशभूषा नहीं।",
          mr: "टक्के म्हणजे दर शंभरामागे: 3/4 × 100 = 75%. 34 नुसते आकडे चिकटवतो; अपूर्णांक हा भागाकार आहे, वेशभूषा नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 50% of 90?",
          hi: "90 का 50% कितना है?",
          mr: "90 चे 50% किती?",
        },
        answer: 45,
        wrong: [40, 55, 180],
        checkExpr: "90/2",
        solution: {
          en: "50% is one half: 90 ÷ 2 = 45. 180 doubles instead of halving — 50% of a thing can never exceed the thing.",
          hi: "50% यानी आधा: 90 ÷ 2 = 45। 180 आधे की जगह दुगुना कर देता है — किसी चीज़ का 50% उससे बड़ा नहीं हो सकता।",
          mr: "50% म्हणजे अर्धे: 90 ÷ 2 = 45. 180 अर्ध्याऐवजी दुप्पट करतो — कशाचेही 50% त्याहून मोठे असू शकत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The ratio 8 : 12 in simplest form is 2 : ▢. What fills the box?",
          hi: "अनुपात 8 : 12 का सरलतम रूप 2 : ▢ है। रिक्त स्थान में क्या आएगा?",
          mr: "गुणोत्तर 8 : 12 चे सोपे रूप 2 : ▢ आहे. रिकाम्या जागी काय येईल?",
        },
        answer: 3,
        wrong: [4, 6, 12],
        checkExpr: "12/4",
        solution: {
          en: "Divide both parts by their HCF 4: 8 : 12 becomes 2 : 3. 6 divides only one side — a ratio must shrink both arms together.",
          hi: "दोनों पक्षों को म.स. 4 से भाग दीजिए: 8 : 12 बनता है 2 : 3। 6 केवल एक पक्ष को भागता है — अनुपात की दोनों बाहें साथ सिकुड़नी चाहिए।",
          mr: "दोन्ही भागांना म.सा.वि. 4 ने भागा: 8 : 12 होते 2 : 3. 6 फक्त एका बाजूला भागतो — गुणोत्तराचे दोन्ही हात एकत्र आखडले पाहिजेत.",
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
          en: "In a class of 40 children, 25% wear glasses. How many children is that?",
          hi: "40 बच्चों की कक्षा में 25% चश्मा पहनते हैं। वे कितने बच्चे हुए?",
          mr: "40 मुलांच्या वर्गात 25% चष्मा घालतात. ती किती मुले?",
        },
        answer: 10,
        wrong: [4, 25, 30],
        checkExpr: "40/4",
        solution: {
          en: "25% is a quarter: 40 ÷ 4 = 10. 25 repeats the percentage as if it were a count; 30 answers those WITHOUT glasses.",
          hi: "25% यानी चौथाई: 40 ÷ 4 = 10। 25 प्रतिशत को ही गिनती मान बैठता है; 30 बिना चश्मे वालों का उत्तर है।",
          mr: "25% म्हणजे पाव: 40 ÷ 4 = 10. 25 टक्केवारीलाच मोजणी मानतो; 30 चष्मा नसलेल्यांचे उत्तर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Write 0.35 as a percentage.",
          hi: "0.35 को प्रतिशत में लिखिए।",
          mr: "0.35 टक्केवारीत लिहा.",
        },
        answer: 35,
        wrong: [3.5, 350, 65],
        checkExpr: "7*100/20",
        fmt: pct,
        solution: {
          en: "0.35 is 35/100, so 35%. 3.5 moves the point only one place; 65 answers the complement — what 0.35 leaves BEHIND.",
          hi: "0.35 यानी 35/100, अतः 35%। 3.5 बिंदु को एक ही स्थान सरकाता है; 65 पूरक का उत्तर है — जो 0.35 पीछे छोड़ता है।",
          mr: "0.35 म्हणजे 35/100, म्हणून 35%. 3.5 बिंदू फक्त एक घर सरकवतो; 65 पूरकाचे उत्तर — 0.35 जे मागे ठेवते ते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A team won 6 of its 8 matches. What percentage did it win?",
          hi: "एक टीम ने 8 में से 6 मैच जीते। उसने कितने प्रतिशत जीते?",
          mr: "एका संघाने 8 पैकी 6 सामने जिंकले. त्याने किती टक्के जिंकले?",
        },
        answer: 75,
        wrong: [68, 80, 60],
        checkExpr: "6*100/8",
        fmt: pct,
        solution: {
          en: "6/8 × 100 = 75%. 68 glues the two counts into digits; 60 divides by ten matches that were never played.",
          hi: "6/8 × 100 = 75%। 68 दोनों गिनतियों को अंकों में चिपका देता है; 60 उन दस मैचों से भाग देता है जो खेले ही नहीं गए।",
          mr: "6/8 × 100 = 75%. 68 दोन्ही मोजण्या आकड्यांत चिकटवतो; 60 कधी न खेळलेल्या दहा सामन्यांनी भागतो.",
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
          en: "A trader buys a lamp for ₹250 and sells it for ₹300. What is the profit per cent?",
          hi: "व्यापारी ₹250 में दीपक ख़रीदकर ₹300 में बेचता है। लाभ प्रतिशत कितना?",
          mr: "व्यापारी ₹250 ला दिवा घेऊन ₹300 ला विकतो. नफा शेकडा किती?",
        },
        answer: 20,
        wrong: [50, 25, 16],
        checkExpr: "(300-250)*100/250",
        fmt: pct,
        solution: {
          en: "Profit ₹50 on a cost of ₹250: 50/250 × 100 = 20%. 16 divides by the selling price — profit per cent always stands on the COST.",
          hi: "₹250 की लागत पर ₹50 लाभ: 50/250 × 100 = 20%। 16 विक्रय-मूल्य से भाग देता है — लाभ प्रतिशत सदा लागत पर खड़ा होता है।",
          mr: "₹250 च्या खरेदीवर ₹50 नफा: 50/250 × 100 = 20%. 16 विक्री-किमतीने भागतो — नफा शेकडा नेहमी खरेदीवर उभा असतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the simple interest on ₹2000 at 5% per year for 3 years?",
          hi: "₹2000 पर 5% वार्षिक दर से 3 वर्ष का साधारण ब्याज कितना?",
          mr: "₹2000 वर 5% वार्षिक दराने 3 वर्षांचे सरळ व्याज किती?",
        },
        answer: 300,
        wrong: [100, 30, 2300],
        checkExpr: "2000*5*3/100",
        fmt: rupees,
        solution: {
          en: "I = P×R×T/100 = 2000 × 5 × 3 ÷ 100 = ₹300. 100 counts one year only; 2300 answers the AMOUNT, principal included.",
          hi: "ब्याज = P×R×T/100 = 2000 × 5 × 3 ÷ 100 = ₹300। 100 केवल एक वर्ष गिनता है; 2300 मिश्रधन का उत्तर है, मूलधन समेत।",
          mr: "व्याज = P×R×T/100 = 2000 × 5 × 3 ÷ 100 = ₹300. 100 फक्त एक वर्ष मोजतो; 2300 रासाचे उत्तर, मुद्दलासकट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "₹120 is divided between two children in the ratio 2 : 3. What is the LARGER share?",
          hi: "₹120 दो बच्चों में 2 : 3 के अनुपात में बाँटे जाते हैं। बड़ा हिस्सा कितना?",
          mr: "₹120 दोन मुलांत 2 : 3 या गुणोत्तरात वाटले जातात. मोठा वाटा किती?",
        },
        answer: 72,
        wrong: [48, 60, 80],
        checkExpr: "120*3/5",
        fmt: rupees,
        solution: {
          en: "Five parts of ₹24 each: the larger share takes 3 parts, ₹72. 48 is the smaller share; 60 splits equally and ignores the ratio.",
          hi: "₹24 के पाँच भाग: बड़ा हिस्सा 3 भाग लेता है, ₹72। 48 छोटा हिस्सा है; 60 बराबर बाँटकर अनुपात को अनदेखा करता है।",
          mr: "प्रत्येकी ₹24 चे पाच भाग: मोठा वाटा 3 भाग घेतो, ₹72. 48 हा लहान वाटा; 60 सारखे वाटून गुणोत्तराकडे दुर्लक्ष करतो.",
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
          en: "A price rises from ₹40 to ₹50. What is the percentage increase?",
          hi: "क़ीमत ₹40 से ₹50 हो जाती है। प्रतिशत वृद्धि कितनी?",
          mr: "किंमत ₹40 वरून ₹50 होते. शेकडा वाढ किती?",
        },
        answer: 25,
        wrong: [20, 10, 80],
        checkExpr: "(50-40)*100/40",
        fmt: pct,
        solution: {
          en: "The rise of 10 stands on the ORIGINAL 40: 10/40 × 100 = 25%. 20 measures against the new 50 — the base is always where you started.",
          hi: "10 की वृद्धि मूल 40 पर खड़ी है: 10/40 × 100 = 25%। 20 नए 50 से नापता है — आधार सदा वही जहाँ से चले थे।",
          mr: "10 ची वाढ मूळ 40 वर उभी: 10/40 × 100 = 25%. 20 नव्या 50 ने मोजतो — पाया नेहमी जिथून निघालो तिथेच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "An item bought for ₹800 is sold at a 15% loss. What is the selling price?",
          hi: "₹800 में ख़रीदी वस्तु 15% हानि पर बेची जाती है। विक्रय-मूल्य कितना?",
          mr: "₹800 ला घेतलेली वस्तू 15% तोट्याने विकली जाते. विक्री-किंमत किती?",
        },
        answer: 680,
        wrong: [120, 920, 685],
        checkExpr: "800-800*15/100",
        fmt: rupees,
        solution: {
          en: "The loss is 15% of 800 = ₹120, so the price falls to 800 − 120 = ₹680. 120 stops at the loss itself; 920 ADDS it, turning loss into profit.",
          hi: "हानि = 800 का 15% = ₹120, अतः दाम गिरकर 800 − 120 = ₹680। 120 हानि पर ही रुक जाता है; 920 उसे जोड़कर हानि को लाभ बना देता है।",
          mr: "तोटा = 800 चे 15% = ₹120, म्हणून किंमत उतरून 800 − 120 = ₹680. 120 तोट्यावरच थांबतो; 920 तो मिळवून तोट्याचा नफा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A deposit earns ₹250 of simple interest in 2 years at 5% per year. What was the principal?",
          hi: "एक जमा राशि 5% वार्षिक दर से 2 वर्षों में ₹250 साधारण ब्याज कमाती है। मूलधन कितना था?",
          mr: "एक ठेव 5% वार्षिक दराने 2 वर्षांत ₹250 सरळ व्याज मिळवते. मुद्दल किती होते?",
        },
        answer: 2500,
        wrong: [1250, 5000, 250],
        checkExpr: "250*100/(5*2)",
        fmt: rupees,
        solution: {
          en: "Run the formula backwards: P = 100 × I ÷ (R × T) = 25000 ÷ 10 = ₹2500. 1250 forgets the second year; 5000 forgets half the rate.",
          hi: "सूत्र उल्टा चलाइए: P = 100 × ब्याज ÷ (दर × समय) = 25000 ÷ 10 = ₹2500। 1250 दूसरा वर्ष भूलता है; 5000 आधी दर।",
          mr: "सूत्र उलटे चालवा: P = 100 × व्याज ÷ (दर × काळ) = 25000 ÷ 10 = ₹2500. 1250 दुसरे वर्ष विसरतो; 5000 अर्धा दर.",
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
          en: "In a school, 40% of the students walk to school; the other 540 come some other way. How many students are there in all?",
          hi: "एक विद्यालय में 40% विद्यार्थी पैदल आते हैं; बाक़ी 540 किसी और तरह। कुल विद्यार्थी कितने?",
          mr: "एका शाळेत 40% विद्यार्थी चालत येतात; उरलेले 540 अन्य मार्गाने. एकूण विद्यार्थी किती?",
        },
        answer: 900,
        wrong: [1350, 216, 810],
        checkExpr: "540*100/60",
        solution: {
          en: "Careful: 540 is the OTHER 60%. One per cent is 540 ÷ 60 = 9, so the whole is 900. 1350 pins 540 to the 40%; 216 takes 40% of 540 itself.",
          hi: "सावधान: 540 बाक़ी 60% है। एक प्रतिशत = 540 ÷ 60 = 9, अतः कुल 900। 1350 540 को 40% मान बैठता है; 216 540 का ही 40% निकाल लेता है।",
          mr: "सावध: 540 म्हणजे उरलेले 60%. एक टक्का = 540 ÷ 60 = 9, म्हणून एकूण 900. 1350 540 ला 40% मानतो; 216 540 चेच 40% काढतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A chair sells for ₹276 at a profit of 15%. What did it COST the seller?",
          hi: "एक कुर्सी 15% लाभ पर ₹276 में बिकती है। विक्रेता को वह कितने की पड़ी थी?",
          mr: "एक खुर्ची 15% नफ्याने ₹276 ला विकली जाते. विक्रेत्याला ती किती किमतीत पडली होती?",
        },
        answer: 240,
        wrong: [235, 317, 261],
        checkExpr: "276*100/115",
        fmt: rupees,
        solution: {
          en: "₹276 is 115% of the cost, so the cost is 276 × 100 ÷ 115 = ₹240. 235 takes 15% OFF the selling price — but the 15% was measured on the cost, not the sale.",
          hi: "₹276 लागत का 115% है, अतः लागत = 276 × 100 ÷ 115 = ₹240। 235 विक्रय-मूल्य में से 15% घटा देता है — पर वह 15% लागत पर नपा था, बिक्री पर नहीं।",
          mr: "₹276 हे खरेदीचे 115% आहे, म्हणून खरेदी = 276 × 100 ÷ 115 = ₹240. 235 विक्री-किमतीतून 15% काढतो — पण ते 15% खरेदीवर मोजले होते, विक्रीवर नाही.",
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
          en: "A price rises by 10% and then falls by 10%. What is the final price, as a percentage of the original?",
          hi: "एक क़ीमत 10% बढ़ती है और फिर 10% गिरती है। अंतिम क़ीमत, मूल की कितनी प्रतिशत?",
          mr: "एक किंमत 10% वाढते आणि मग 10% घसरते. अंतिम किंमत, मूळ किमतीच्या किती टक्के?",
        },
        answer: 99,
        wrong: [100, 98, 101],
        checkExpr: "110*90/100",
        fmt: pct,
        solution: {
          en: "Up 10% lands at 110; the fall of 10% is now measured on the BIGGER number, taking 11, not 10: 110 − 11 = 99%. The two moves feel like twins but stand on different bases — the round trip always loses.",
          hi: "10% चढ़कर 110 पर; अब 10% की गिरावट बड़ी संख्या पर नपती है — 11 जाती है, 10 नहीं: 110 − 11 = 99%। दोनों चालें जुड़वाँ लगती हैं पर आधार अलग-अलग हैं — आना-जाना सदा घाटे में रहता है।",
          mr: "10% चढून 110 वर; आता 10% ची घसरण मोठ्या संख्येवर मोजली जाते — 11 जाते, 10 नाही: 110 − 11 = 99%. दोन्ही चाली जुळ्या वाटतात पण पाये वेगळे — फेरी नेहमी तोट्यात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "At what rate per cent per year does ₹4000 earn ₹600 of simple interest in 3 years?",
          hi: "किस वार्षिक प्रतिशत दर से ₹4000 पर 3 वर्षों में ₹600 साधारण ब्याज मिलता है?",
          mr: "कोणत्या वार्षिक शेकडा दराने ₹4000 वर 3 वर्षांत ₹600 सरळ व्याज मिळते?",
        },
        answer: 5,
        wrong: [15, 2, 7.5],
        checkExpr: "600*100/(4000*3)",
        fmt: pct,
        solution: {
          en: "R = 100 × I ÷ (P × T) = 60000 ÷ 12000 = 5%. 15 forgets to divide by the three years; 7.5 divides by two of them.",
          hi: "दर = 100 × ब्याज ÷ (मूलधन × समय) = 60000 ÷ 12000 = 5%। 15 तीन वर्षों से भाग देना भूल जाता है; 7.5 केवल दो से देता है।",
          mr: "दर = 100 × व्याज ÷ (मुद्दल × काळ) = 60000 ÷ 12000 = 5%. 15 तीन वर्षांनी भागायला विसरतो; 7.5 फक्त दोनने भागतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 8 — Comparing Quantities",
      name: "Comparing Quantities",
      slug: "maths-7-comparing-quantities",
      summary:
        "Percent as per-hundred, profit standing on the cost, interest walking P×R×T — and the up-ten-down-ten round trip that quietly loses one per cent.",
      position: 8,
      translations: {
        hi: {
          name: "राशियों की तुलना",
          summary:
            "प्रति-सौ के रूप में प्रतिशत, लागत पर खड़ा लाभ, P×R×T चलता ब्याज — और दस-ऊपर-दस-नीचे की वह यात्रा जो चुपचाप एक प्रतिशत गँवा देती है।",
        },
        mr: {
          name: "राशींची तुलना",
          summary:
            "दर-शंभरामागे टक्के, खरेदीवर उभा नफा, P×R×T चालणारे व्याज — आणि दहा-वर-दहा-खाली ची फेरी जी गुपचूप एक टक्का गमावते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Rational Numbers (fractions get signs)                        */
/* ------------------------------------------------------------------------- */
function rationalNumbers(): TopicFileOut {
  const rand = rng("maths-7-rational-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Fill the box: −3/4 = ▢/8. What is the numerator?",
          hi: "रिक्त भरिए: −3/4 = ▢/8। अंश क्या होगा?",
          mr: "रिकामे भरा: −3/4 = ▢/8. अंश काय येईल?",
        },
        answer: -6,
        wrong: [6, -8, 3],
        checkExpr: "(0-3)*8/4",
        solution: {
          en: "The denominator doubled, so the numerator doubles too, sign and all: −6. 6 loses the minus on the way; −8 doubles the wrong partner.",
          hi: "हर दुगुना हुआ, अतः अंश भी दुगुना — चिह्न समेत: −6। 6 रास्ते में ऋण खो देता है; −8 ग़लत साथी को दुगुना करता है।",
          mr: "छेद दुप्पट झाला, म्हणून अंशही दुप्पट — चिन्हासकट: −6. 6 वाटेत ऋण हरवतो; −8 चुकीच्या जोडीदाराला दुप्पट करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Reduce −12/16 to lowest terms. What does the numerator become?",
          hi: "−12/16 को सरलतम रूप में लाइए। अंश क्या बनता है?",
          mr: "−12/16 सोप्या रूपात आणा. अंश काय होतो?",
        },
        answer: -3,
        wrong: [3, -4, -6],
        checkExpr: "(0-12)/4",
        solution: {
          en: "Divide top and bottom by 4: −12/16 = −3/4, numerator −3. The minus stays with the number through every simplification; −6 divides by 2 and stops halfway.",
          hi: "ऊपर-नीचे 4 से भाग दीजिए: −12/16 = −3/4, अंश −3। ऋण हर सरलीकरण में संख्या के साथ रहता है; −6 दो से भागकर आधे रास्ते रुक जाता है।",
          mr: "वर-खाली 4 ने भागा: −12/16 = −3/4, अंश −3. ऋण प्रत्येक सोपेपणात संख्येसोबत राहते; −6 दोनने भागून अर्ध्या वाटेत थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "(−2/5) + (2/5) = ?",
          hi: "(−2/5) + (2/5) कितना है?",
          mr: "(−2/5) + (2/5) किती?",
        },
        answer: 0,
        wrong: [1, -0.8, 0.8],
        checkExpr: "(0-2)/5+2/5",
        solution: {
          en: "A number and its opposite cancel to 0 — rational numbers included. −0.8 adds the numerators as if both were negative; 0.8 as if both were positive.",
          hi: "संख्या और उसका विलोम कटकर 0 — परिमेय संख्याएँ भी। −0.8 दोनों को ऋण मानकर अंश जोड़ता है; 0.8 दोनों को धन मानकर।",
          mr: "संख्या आणि तिचा विरुद्धांक रद्द होऊन 0 — परिमेय संख्याही. −0.8 दोन्ही ऋण मानून अंश जोडतो; 0.8 दोन्ही धन मानून.",
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
          en: "Which is GREATER: −1/2 or −3/4? Answer it as a decimal.",
          hi: "बड़ा कौन: −1/2 या −3/4? उत्तर दशमलव में दीजिए।",
          mr: "मोठा कोण: −1/2 की −3/4? उत्तर दशांशात द्या.",
        },
        answer: -0.5,
        wrong: [-0.75, 0.5, 0.75],
        checkExpr: "(0-1)/2",
        solution: {
          en: "Below zero, closer to zero wins: −1/2 = −0.5 sits right of −0.75 on the number line. −0.75 looks bigger because 3/4 beats 1/2 — but the minus flips every comparison.",
          hi: "शून्य के नीचे, शून्य के पास वाला जीतता है: −1/2 = −0.5 संख्या-रेखा पर −0.75 के दाएँ बैठता है। −0.75 बड़ा दिखता है क्योंकि 3/4, 1/2 से बड़ा है — पर ऋण हर तुलना पलट देता है।",
          mr: "शून्याखाली, शून्याजवळचा जिंकतो: −1/2 = −0.5 संख्यारेषेवर −0.75 च्या उजवीकडे बसतो. −0.75 मोठा दिसतो कारण 3/4 हा 1/2 हून मोठा — पण ऋण प्रत्येक तुलना उलटवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "1/2 + (−3/2) = ?",
          hi: "1/2 + (−3/2) कितना है?",
          mr: "1/2 + (−3/2) किती?",
        },
        answer: -1,
        wrong: [1, -2, 2],
        checkExpr: "1/2-3/2",
        solution: {
          en: "Same denominators, so add the tops: 1 + (−3) = −2, giving −2/2 = −1. 1 forgets the minus; −2 stops at the numerator and skips the final division.",
          hi: "हर समान, अतः अंश जोड़िए: 1 + (−3) = −2, यानी −2/2 = −1। 1 ऋण भूल जाता है; −2 अंश पर रुककर अंतिम भाग छोड़ देता है।",
          mr: "छेद समान, म्हणून अंश जोडा: 1 + (−3) = −2, म्हणजे −2/2 = −1. 1 ऋण विसरतो; −2 अंशावर थांबून शेवटचा भाग गाळतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "(−5/6) × (−6/5) = ?",
          hi: "(−5/6) × (−6/5) कितना है?",
          mr: "(−5/6) × (−6/5) किती?",
        },
        answer: 1,
        wrong: [-1, 0, 2],
        checkExpr: "5*6/(6*5)",
        solution: {
          en: "Each number is the other's reciprocal, and the two minuses cancel: the product is 1. −1 miscounts the signs; 0 confuses multiplying with the sum of a number and its opposite.",
          hi: "दोनों एक-दूसरे के व्युत्क्रम हैं, और दोनों ऋण कट जाते हैं: गुणनफल 1। −1 चिह्न ग़लत गिनता है; 0 गुणा को विलोम-योग से मिला बैठता है।",
          mr: "दोघे एकमेकांचे व्यस्त, आणि दोन ऋणे रद्द: गुणाकार 1. −1 चिन्हे चुकवतो; 0 गुणाकाराला विरुद्धांक-बेरजेशी गल्लत करतो.",
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
          en: "3/4 ÷ (−1/2) = ? (Answer as a decimal.)",
          hi: "3/4 ÷ (−1/2) कितना है? (उत्तर दशमलव में।)",
          mr: "3/4 ÷ (−1/2) किती? (उत्तर दशांशात.)",
        },
        answer: -1.5,
        wrong: [1.5, -0.375, 0.375],
        checkExpr: "3*2/(0-4)",
        solution: {
          en: "Dividing means multiplying by the reciprocal: 3/4 × (−2/1) = −6/4 = −1.5. −0.375 multiplies by −1/2 without flipping it; 1.5 flips but drops the sign.",
          hi: "भाग यानी व्युत्क्रम से गुणा: 3/4 × (−2/1) = −6/4 = −1.5। −0.375 बिना पलटे −1/2 से गुणा करता है; 1.5 पलटता है पर चिह्न गिरा देता है।",
          mr: "भाग म्हणजे व्यस्ताने गुणाकार: 3/4 × (−2/1) = −6/4 = −1.5. −0.375 न उलटवता −1/2 ने गुणतो; 1.5 उलटवतो पण चिन्ह गाळतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Give a rational number that lies between 1/4 and 1/2, as a decimal.",
          hi: "1/4 और 1/2 के बीच की कोई परिमेय संख्या दशमलव में बताइए।",
          mr: "1/4 आणि 1/2 च्या दरम्यानची एखादी परिमेय संख्या दशांशात सांगा.",
        },
        answer: 0.375,
        wrong: [0.2, 0.6, 0.75],
        checkExpr: "(0.25+0.5)/2",
        solution: {
          en: "The midpoint always works: (1/4 + 1/2) ÷ 2 = 3/8 = 0.375, snug between 0.25 and 0.5. The other three all sit OUTSIDE the fence.",
          hi: "मध्य-बिंदु सदा चलता है: (1/4 + 1/2) ÷ 2 = 3/8 = 0.375, ठीक 0.25 और 0.5 के बीच। बाक़ी तीनों बाड़ के बाहर बैठे हैं।",
          mr: "मध्यबिंदू नेहमी चालतो: (1/4 + 1/2) ÷ 2 = 3/8 = 0.375, नेमका 0.25 आणि 0.5 च्या मध्ये. बाकी तिघे कुंपणाबाहेर बसले आहेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Write −7/8 as a decimal.",
          hi: "−7/8 को दशमलव में लिखिए।",
          mr: "−7/8 दशांशात लिहा.",
        },
        answer: -0.875,
        wrong: [0.875, -0.78, -1.14],
        checkExpr: "(0-7)/8",
        solution: {
          en: "7 ÷ 8 = 0.875, and the sign rides along: −0.875. −0.78 glues the digits 7 and 8 together; −1.14 divides 8 by 7, upside down.",
          hi: "7 ÷ 8 = 0.875, और चिह्न साथ चलता है: −0.875। −0.78 अंक 7 और 8 चिपका देता है; −1.14 उल्टा 8 को 7 से भाग देता है।",
          mr: "7 ÷ 8 = 0.875, आणि चिन्ह सोबत येते: −0.875. −0.78 आकडे 7 व 8 चिकटवतो; −1.14 उलटे 8 ला 7 ने भागतो.",
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
          en: "(−3/4) + (1/4) = ? (Answer as a decimal.)",
          hi: "(−3/4) + (1/4) कितना है? (उत्तर दशमलव में।)",
          mr: "(−3/4) + (1/4) किती? (उत्तर दशांशात.)",
        },
        answer: -0.5,
        wrong: [0.5, -1, -0.25],
        checkExpr: "(0-3)/4+1/4",
        solution: {
          en: "−3 + 1 = −2 over 4: −2/4 = −0.5. −1 adds the numerators as if both carried the minus; 0.5 drops the sign of the heavier number.",
          hi: "−3 + 1 = −2, हर 4 पर: −2/4 = −0.5। −1 दोनों अंशों को ऋण मानकर जोड़ता है; 0.5 भारी संख्या का चिह्न गिरा देता है।",
          mr: "−3 + 1 = −2, छेद 4 वर: −2/4 = −0.5. −1 दोन्ही अंश ऋण मानून जोडतो; 0.5 जड संख्येचे चिन्ह गाळतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "(−2/3) × (9/4) = ? (Answer as a decimal.)",
          hi: "(−2/3) × (9/4) कितना है? (उत्तर दशमलव में।)",
          mr: "(−2/3) × (9/4) किती? (उत्तर दशांशात.)",
        },
        answer: -1.5,
        wrong: [1.5, -6, -0.75],
        checkExpr: "(0-2)*9/(3*4)",
        solution: {
          en: "Tops and bottoms: −18/12 = −3/2 = −1.5, one minus surviving. −6 multiplies only the numerators; 1.5 mislays the sign.",
          hi: "अंश-हर: −18/12 = −3/2 = −1.5, एक ऋण बचा। −6 केवल अंश गुणा करता है; 1.5 चिह्न खो देता है।",
          mr: "अंश-छेद: −18/12 = −3/2 = −1.5, एक ऋण उरले. −6 फक्त अंश गुणतो; 1.5 चिन्ह हरवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Which is the SMALLEST: −5/2, −3/2 or −1/2? Answer it as a decimal.",
          hi: "सबसे छोटा कौन: −5/2, −3/2 या −1/2? उत्तर दशमलव में दीजिए।",
          mr: "सर्वांत लहान कोण: −5/2, −3/2 की −1/2? उत्तर दशांशात द्या.",
        },
        answer: -2.5,
        wrong: [-1.5, -0.5, 2.5],
        solution: {
          en: "The farthest LEFT of zero is smallest: −5/2 = −2.5. −0.5 is actually the greatest of the three — below zero the biggest-looking fraction is the smallest number.",
          hi: "शून्य से सबसे बाएँ वाला सबसे छोटा: −5/2 = −2.5। −0.5 वास्तव में तीनों में सबसे बड़ा है — शून्य के नीचे सबसे बड़ी दिखती भिन्न सबसे छोटी संख्या होती है।",
          mr: "शून्यापासून सर्वांत डावीकडचा सर्वांत लहान: −5/2 = −2.5. −0.5 खरे तर तिघांत सर्वांत मोठा — शून्याखाली सर्वांत मोठा दिसणारा अपूर्णांक सर्वांत लहान संख्या असते.",
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
          en: "x × (−4/9) = 1. What is x, as a decimal?",
          hi: "x × (−4/9) = 1। x दशमलव में कितना?",
          mr: "x × (−4/9) = 1. x दशांशात किती?",
        },
        answer: -2.25,
        wrong: [2.25, -0.44, 0.44],
        checkExpr: "(0-9)/4",
        solution: {
          en: "x must be the reciprocal: −9/4 = −2.25 — flip the fraction, KEEP the sign, for only negative × negative reaches +1. 2.25 flips but forgets the product must climb back to positive one.",
          hi: "x व्युत्क्रम होना चाहिए: −9/4 = −2.25 — भिन्न पलटिए, चिह्न रखिए, क्योंकि केवल ऋण × ऋण ही +1 तक पहुँचता है। 2.25 पलटता तो है पर भूल जाता है कि गुणनफल को धन एक तक लौटना है।",
          mr: "x व्यस्त हवा: −9/4 = −2.25 — अपूर्णांक उलटवा, चिन्ह ठेवा, कारण फक्त ऋण × ऋणच +1 गाठतो. 2.25 उलटवतो पण गुणाकाराला धन एकावर परतायचे आहे हे विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Water seeps down a well shaft at −3/4 m per hour (negative means downward). Where is the seep-line after 4 hours, in metres?",
          hi: "कुएँ की दीवार में पानी −3/4 मीटर प्रति घंटा रिसता है (ऋण यानी नीचे की ओर)। 4 घंटे बाद रिसाव-रेखा कहाँ होगी, मीटर में?",
          mr: "विहिरीच्या भिंतीत पाणी −3/4 मीटर प्रति तास झिरपते (ऋण म्हणजे खालच्या दिशेने). 4 तासांनंतर झिरप-रेषा कुठे असेल, मीटरमध्ये?",
        },
        answer: -3,
        wrong: [3, -0.75, -12],
        checkExpr: "(0-3)*4/4",
        solution: {
          en: "Four hours of −3/4 each: 4 × (−3/4) = −3 m, three metres down. −0.75 stops after one hour; −12 multiplies by the 4 twice.",
          hi: "−3/4 के चार घंटे: 4 × (−3/4) = −3 मीटर, तीन मीटर नीचे। −0.75 एक घंटे बाद रुक जाता है; −12 चार से दो बार गुणा करता है।",
          mr: "−3/4 चे चार तास: 4 × (−3/4) = −3 मीटर, तीन मीटर खाली. −0.75 एका तासानंतर थांबतो; −12 चाराने दोनदा गुणतो.",
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
          en: "A student says no rational number fits between 5/7 and 6/7. Rewrite both with denominator 14 and find the one between: what is its NUMERATOR?",
          hi: "एक विद्यार्थी कहता है कि 5/7 और 6/7 के बीच कोई परिमेय संख्या नहीं बैठती। दोनों को हर 14 से लिखकर बीच वाली खोजिए: उसका अंश क्या है?",
          mr: "एक विद्यार्थी म्हणतो की 5/7 आणि 6/7 च्या मध्ये कोणतीही परिमेय संख्या बसत नाही. दोन्ही छेद 14 ने लिहून मधली शोधा: तिचा अंश काय?",
        },
        answer: 11,
        wrong: [5.5, 12, 13],
        checkExpr: "(5*2+6*2)/2",
        solution: {
          en: "5/7 = 10/14 and 6/7 = 12/14, and 11/14 sits between them — numerator 11. Sharpen the denominator again and MORE numbers appear: between any two rationals the crowd never ends.",
          hi: "5/7 = 10/14 और 6/7 = 12/14, और 11/14 उनके बीच बैठता है — अंश 11। हर और महीन कीजिए तो और संख्याएँ प्रकट होती हैं: किन्हीं दो परिमेयों के बीच भीड़ कभी ख़त्म नहीं होती।",
          mr: "5/7 = 10/14 आणि 6/7 = 12/14, आणि 11/14 त्यांच्या मध्ये बसतो — अंश 11. छेद आणखी बारीक करा आणि आणखी संख्या प्रकटतात: कोणत्याही दोन परिमेयांमधली गर्दी कधी संपत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is the VALUE of −7/−8, as a decimal?",
          hi: "−7/−8 का मान दशमलव में कितना है?",
          mr: "−7/−8 ची किंमत दशांशात किती?",
        },
        answer: 0.875,
        wrong: [-0.875, -1.14, 1.14],
        checkExpr: "7/8",
        solution: {
          en: "Minus over minus cancels: −7/−8 = 7/8 = 0.875, a POSITIVE number wearing a gloomy costume. −0.875 counts one of the signs twice; the standard form puts the denominator positive first.",
          hi: "ऋण बटा ऋण कट जाता है: −7/−8 = 7/8 = 0.875, उदास वेश में एक धन संख्या। −0.875 एक चिह्न दो बार गिनता है; मानक रूप पहले हर को धन बनाता है।",
          mr: "ऋण भागिले ऋण रद्द: −7/−8 = 7/8 = 0.875, उदास वेशातील धन संख्या. −0.875 एक चिन्ह दोनदा मोजतो; प्रमाण रूप आधी छेदाला धन करते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 9 — Rational Numbers",
      name: "Rational Numbers",
      slug: "maths-7-rational-numbers",
      summary:
        "Fractions get signs: opposites cancel, comparisons flip below zero, reciprocals keep their minus — and between any two of them the crowd of numbers never ends.",
      position: 9,
      translations: {
        hi: {
          name: "परिमेय संख्याएँ",
          summary:
            "भिन्नों को चिह्न मिलते हैं: विलोम कटते हैं, शून्य के नीचे तुलनाएँ पलटती हैं, व्युत्क्रम अपना ऋण रखते हैं — और किन्हीं दो के बीच संख्याओं की भीड़ कभी ख़त्म नहीं होती।",
        },
        mr: {
          name: "परिमेय संख्या",
          summary:
            "अपूर्णांकांना चिन्हे मिळतात: विरुद्धांक रद्द होतात, शून्याखाली तुलना उलटतात, व्यस्त आपले ऋण राखतात — आणि कोणत्याही दोघांमधली संख्यांची गर्दी कधी संपत नाही.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Practical Geometry (parallels and triangle constructions)    */
/* ------------------------------------------------------------------------- */
function practicalGeometry(): TopicFileOut {
  const rand = rng("maths-7-practical-geometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "To construct a triangle with sides 5 cm, 6 cm and 7 cm you use the SSS method. How many sides are given?",
          hi: "5 सेमी, 6 सेमी और 7 सेमी भुजाओं वाला त्रिभुज बनाने के लिए SSS विधि लगती है। कितनी भुजाएँ दी गई हैं?",
          mr: "5 सेमी, 6 सेमी आणि 7 सेमी बाजूंचा त्रिकोण काढण्यासाठी SSS पद्धत वापरतात. किती बाजू दिलेल्या आहेत?",
        },
        answer: 3,
        wrong: [2, 1, 0],
        solution: {
          en: "All 3: draw the base, then swing two compass arcs for the other ends — where the arcs cross, the third vertex is born.",
          hi: "तीनों 3: आधार खींचिए, फिर बाक़ी सिरों के लिए परकार के दो चाप घुमाइए — जहाँ चाप कटते हैं, वहीं तीसरा शीर्ष जन्म लेता है।",
          mr: "तिन्ही 3: पाया काढा, मग उरलेल्या टोकांसाठी कंपासाचे दोन कंस फिरवा — जिथे कंस छेदतात, तिथे तिसरा शिरोबिंदू जन्मतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "To draw a line through a point parallel to a given line, you copy an angle of 65° made by a transversal. What must the copied angle measure?",
          hi: "किसी बिंदु से दी गई रेखा के समांतर रेखा खींचने के लिए आप तिर्यक रेखा का बनाया 65° का कोण नक़ल करते हैं। नक़ल किए कोण की माप कितनी होनी चाहिए?",
          mr: "एका बिंदूतून दिलेल्या रेषेला समांतर रेषा काढण्यासाठी छेदिकेने केलेला 65° चा कोन नक्कल करता. नक्कल केलेल्या कोनाचे माप किती हवे?",
        },
        answer: 65,
        wrong: [115, 25, 130],
        fmt: deg,
        solution: {
          en: "Equal alternate (or corresponding) angles are what MAKE lines parallel: the copy must be exactly 65°. Any other measure tilts the new line into an eventual crossing.",
          hi: "बराबर एकांतर (या संगत) कोण ही रेखाओं को समांतर बनाते हैं: नक़ल ठीक 65° की होनी चाहिए। कोई और माप नई रेखा को झुकाकर अंततः काट देगी।",
          mr: "समान व्युत्क्रम (किंवा संगत) कोनच रेषा समांतर करतात: नक्कल नेमकी 65° हवी. दुसरे कोणतेही माप नवी रेषा कलंडवून अखेर छेद घडवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For an SAS construction with sides 4 cm and 6 cm, how many angles do you also need — and it must be the included one?",
          hi: "4 सेमी और 6 सेमी भुजाओं वाली SAS रचना के लिए कितने कोण भी चाहिए — और वह अंतर्गत ही होना चाहिए?",
          mr: "4 सेमी आणि 6 सेमी बाजूंच्या SAS रचनेसाठी किती कोनही लागतात — आणि तो समाविष्टच हवा?",
        },
        answer: 1,
        wrong: [2, 3, 0],
        solution: {
          en: "Side-Angle-Side: 1 angle, sitting BETWEEN the two sides. Put the angle anywhere else and two different triangles can claim the same measurements.",
          hi: "भुजा-कोण-भुजा: 1 कोण, दोनों भुजाओं के बीच बैठा। कोण कहीं और रखिए तो दो अलग त्रिभुज एक ही मापों पर दावा कर सकते हैं।",
          mr: "बाजू-कोन-बाजू: 1 कोन, दोन बाजूंच्या मध्ये बसलेला. कोन इतरत्र ठेवा आणि दोन वेगळे त्रिकोण त्याच मापांवर हक्क सांगू शकतात.",
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
          en: "How many triangles can be constructed with sides 3 cm, 4 cm and 8 cm?",
          hi: "3 सेमी, 4 सेमी और 8 सेमी भुजाओं से कितने त्रिभुज बन सकते हैं?",
          mr: "3 सेमी, 4 सेमी आणि 8 सेमी बाजूंनी किती त्रिकोण बनू शकतात?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        solution: {
          en: "3 + 4 = 7, which cannot bridge the 8: the compass arcs never cross, so 0 triangles. Check the triangle inequality BEFORE you draw — two short arms cannot reach over a long base.",
          hi: "3 + 4 = 7, जो 8 को पाट नहीं सकता: परकार के चाप कभी नहीं कटते, अतः 0 त्रिभुज। खींचने से पहले त्रिभुज-असमिका जाँचिए — दो छोटी बाहें लंबे आधार के आर-पार नहीं पहुँचतीं।",
          mr: "3 + 4 = 7, जे 8 ला जोडू शकत नाही: कंपासाचे कंस कधी छेदत नाहीत, म्हणून 0 त्रिकोण. काढण्याआधी त्रिकोण-असमानता तपासा — दोन आखूड हात लांब पायावरून पोहोचत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "You construct a triangle by ASA with angles 45° and 60° at the base. What will the third angle come out as?",
          hi: "आधार पर 45° और 60° कोणों के साथ ASA से त्रिभुज बनाते हैं। तीसरा कोण कितना निकलेगा?",
          mr: "पायावर 45° आणि 60° कोनांसह ASA ने त्रिकोण काढता. तिसरा कोन किती निघेल?",
        },
        answer: 75,
        wrong: [105, 90, 55],
        checkExpr: "180-45-60",
        fmt: deg,
        solution: {
          en: "The two rays meet where geometry forces them: 180 − 45 − 60 = 75°. You never draw the third angle — the angle-sum rule draws it for you.",
          hi: "दोनों किरणें वहीं मिलती हैं जहाँ ज्यामिति विवश करती है: 180 − 45 − 60 = 75°। तीसरा कोण आप कभी नहीं खींचते — कोण-योग नियम उसे आपके लिए खींच देता है।",
          mr: "दोन्ही किरणे तिथेच मिळतात जिथे भूमिती भाग पाडते: 180 − 45 − 60 = 75°. तिसरा कोन तुम्ही कधीच काढत नाही — कोन-बेरीज नियम तो तुमच्यासाठी काढतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "An RHS construction uses hypotenuse 5 cm and one leg 3 cm. What will the third side measure, in cm?",
          hi: "RHS रचना में कर्ण 5 सेमी और एक भुजा 3 सेमी है। तीसरी भुजा कितने सेमी निकलेगी?",
          mr: "RHS रचनेत कर्ण 5 सेमी आणि एक बाजू 3 सेमी आहे. तिसरी बाजू किती सेमी निघेल?",
        },
        answer: 4,
        wrong: [2, 8, 15],
        solution: {
          en: "5² − 3² = 25 − 9 = 16 = 4²: the ruler will read 4 cm before you even measure. 2 subtracts the plain lengths; 8 adds them.",
          hi: "5² − 3² = 25 − 9 = 16 = 4²: नापने से पहले ही पैमाना 4 सेमी कहेगा। 2 सीधी लंबाइयाँ घटाता है; 8 जोड़ देता है।",
          mr: "5² − 3² = 25 − 9 = 16 = 4²: मोजण्याआधीच पट्टी 4 सेमी सांगेल. 2 नुसत्या लांब्या वजा करतो; 8 जोडतो.",
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
          en: "To make a 90° angle with only compasses, you bisect the gap between the 60° mark and which other constructible angle?",
          hi: "केवल परकार से 90° बनाने के लिए आप 60° के निशान और किस अन्य रचनीय कोण के बीच की दूरी समद्विभाजित करते हैं?",
          mr: "फक्त कंपासाने 90° करण्यासाठी 60° च्या खुणेआणि आणखी कोणत्या रचनीय कोनामधले अंतर दुभागता?",
        },
        answer: 120,
        wrong: [30, 180, 90],
        fmt: deg,
        solution: {
          en: "60 and 120 are both compass-friendly, and halfway between them lies 90°: (60 + 120) ÷ 2. Bisection is the compass's way of averaging two angles.",
          hi: "60 और 120 दोनों परकार-सुलभ हैं, और उनके ठीक बीच 90° है: (60 + 120) ÷ 2। समद्विभाजन परकार का दो कोणों का औसत लेने का ढंग है।",
          mr: "60 आणि 120 दोन्ही कंपास-सुलभ, आणि त्यांच्या नेमक्या मध्ये 90°: (60 + 120) ÷ 2. दुभाजन म्हणजे कंपासाची दोन कोनांची सरासरी काढण्याची रीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "By ASA, a 6 cm base carries a 40° angle at EACH end. What is the triangle's third angle?",
          hi: "ASA में 6 सेमी के आधार के हर सिरे पर 40° का कोण है। त्रिभुज का तीसरा कोण कितना?",
          mr: "ASA मध्ये 6 सेमी पायाच्या प्रत्येक टोकाला 40° चा कोन आहे. त्रिकोणाचा तिसरा कोन किती?",
        },
        answer: 100,
        wrong: [80, 40, 140],
        checkExpr: "180-40-40",
        fmt: deg,
        solution: {
          en: "180 − 40 − 40 = 100°, and the equal base angles silently make the triangle isosceles too. 140 subtracts only one of the pair.",
          hi: "180 − 40 − 40 = 100°, और बराबर आधार-कोण चुपचाप त्रिभुज को समद्विबाहु भी बना देते हैं। 140 जोड़ी में से केवल एक घटाता है।",
          mr: "180 − 40 − 40 = 100°, आणि समान पाया-कोन गुपचूप त्रिकोणाला समद्विभुजही करतात. 140 जोडीतील फक्त एक वजा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "An SAS construction uses sides 5 cm and 5 cm with a 60° angle between them. What will the third side measure, in cm?",
          hi: "SAS रचना में 5 सेमी और 5 सेमी की भुजाएँ हैं और उनके बीच 60° का कोण। तीसरी भुजा कितने सेमी निकलेगी?",
          mr: "SAS रचनेत 5 सेमी आणि 5 सेमी बाजू असून त्यांच्यामध्ये 60° चा कोन आहे. तिसरी बाजू किती सेमी निघेल?",
        },
        answer: 5,
        wrong: [10, 2.5, 6],
        solution: {
          en: "Equal sides make equal base angles of (180 − 60) ÷ 2 = 60° each — all three angles 60°, so the triangle is equilateral and the third side is 5 cm too.",
          hi: "बराबर भुजाएँ (180 − 60) ÷ 2 = 60°-60° के आधार-कोण बनाती हैं — तीनों कोण 60°, अतः त्रिभुज समबाहु और तीसरी भुजा भी 5 सेमी।",
          mr: "समान बाजू (180 − 60) ÷ 2 = 60°-60° चे पाया-कोन करतात — तिन्ही कोन 60°, म्हणून त्रिकोण समभुज आणि तिसरी बाजूही 5 सेमी.",
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
          en: "You copy a 72° angle to build a parallel line, but you place the copy in the CO-INTERIOR position. To keep the lines parallel, the angle there must measure?",
          hi: "समांतर रेखा के लिए आप 72° का कोण नक़ल करते हैं, पर नक़ल एक-ही-ओर के अंतःकोण की जगह रख देते हैं। रेखाएँ समांतर रहें, इसके लिए वहाँ का कोण कितना होना चाहिए?",
          mr: "समांतर रेषेसाठी 72° चा कोन नक्कल करता, पण नक्कल एकाच-बाजूच्या आंतरकोनाच्या जागी ठेवता. रेषा समांतर राहण्यासाठी तिथला कोन किती हवा?",
        },
        answer: 108,
        wrong: [72, 18, 144],
        checkExpr: "180-72",
        fmt: deg,
        solution: {
          en: "Co-interior partners must total 180: 180 − 72 = 108°. 72 works only in the alternate or corresponding position — same number, wrong seat, crossed lines.",
          hi: "एक-ओर के साथी 180 तक जुड़ने चाहिए: 180 − 72 = 108°। 72 केवल एकांतर या संगत स्थान पर चलता है — वही संख्या, ग़लत कुर्सी, कटती रेखाएँ।",
          mr: "एका-बाजूच्या जोडीदारांची बेरीज 180 हवी: 180 − 72 = 108°. 72 फक्त व्युत्क्रम किंवा संगत जागी चालतो — तीच संख्या, चुकीची खुर्ची, छेदणाऱ्या रेषा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A right triangle is to be built with hypotenuse 13 cm and one leg 5 cm. What will the other leg measure, in cm?",
          hi: "कर्ण 13 सेमी और एक भुजा 5 सेमी वाला समकोण त्रिभुज बनाना है। दूसरी भुजा कितने सेमी निकलेगी?",
          mr: "कर्ण 13 सेमी आणि एक बाजू 5 सेमी असलेला काटकोन त्रिकोण बनवायचा आहे. दुसरी बाजू किती सेमी निघेल?",
        },
        answer: 12,
        wrong: [8, 18, 65],
        solution: {
          en: "13² − 5² = 169 − 25 = 144, and 144 = 12² — the other leg is 12 cm, the famous 5-12-13 family. 8 subtracts lengths; 18 adds them.",
          hi: "13² − 5² = 169 − 25 = 144, और 144 = 12² — दूसरी भुजा 12 सेमी, प्रसिद्ध 5-12-13 परिवार। 8 लंबाइयाँ घटाता है; 18 जोड़ता है।",
          mr: "13² − 5² = 169 − 25 = 144, आणि 144 = 12² — दुसरी बाजू 12 सेमी, प्रसिद्ध 5-12-13 कुटुंब. 8 लांब्या वजा करतो; 18 जोडतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "You construct an isosceles triangle with equal sides 6 cm and base 4 cm. What is the perimeter of the finished triangle, in cm?",
          hi: "6 सेमी की बराबर भुजाओं और 4 सेमी के आधार वाला समद्विबाहु त्रिभुज बनाते हैं। बने त्रिभुज का परिमाप कितने सेमी?",
          mr: "6 सेमी च्या समान बाजू आणि 4 सेमी पाया असलेला समद्विभुज त्रिकोण काढता. तयार त्रिकोणाची परिमिती किती सेमी?",
        },
        answer: 16,
        wrong: [12, 10, 24],
        checkExpr: "6+6+4",
        solution: {
          en: "6 + 6 + 4 = 16 cm. 12 counts the equal pair only; 10 takes one of each; 24 promotes the base to 6 as well.",
          hi: "6 + 6 + 4 = 16 सेमी। 12 केवल बराबर जोड़ी गिनता है; 10 हर तरह की एक-एक लेता है; 24 आधार को भी 6 बना देता है।",
          mr: "6 + 6 + 4 = 16 सेमी. 12 फक्त समान जोडी मोजतो; 10 प्रत्येकी एक घेतो; 24 पायालाही 6 करून टाकतो.",
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
          en: "With ruler and compasses you construct 60°, bisect it to 30°, then bisect once more. What is the final angle?",
          hi: "रूलर-परकार से 60° बनाकर उसे 30° में समद्विभाजित करते हैं, फिर एक बार और। अंतिम कोण कितना?",
          mr: "पट्टी-कंपासाने 60° करून त्याला 30° मध्ये दुभागता, मग आणखी एकदा. अंतिम कोन किती?",
        },
        answer: 15,
        wrong: [30, 7.5, 20],
        checkExpr: "60/4",
        fmt: deg,
        solution: {
          en: "Each bisection halves: 60 → 30 → 15°. The compass never measures — it only builds 60 and then halves its way to whatever 60/2ⁿ you need.",
          hi: "हर समद्विभाजन आधा करता है: 60 → 30 → 15°। परकार कभी नापता नहीं — वह बस 60 बनाता है और फिर आधा-आधा करते हुए जिस 60/2ⁿ की ज़रूरत हो वहाँ पहुँचता है।",
          mr: "प्रत्येक दुभाजन निम्मे करते: 60 → 30 → 15°. कंपास कधी मोजत नाही — तो फक्त 60 बांधतो आणि मग निम्मे-निम्मे करत हव्या त्या 60/2ⁿ वर पोहोचतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Up to congruence, how many DIFFERENT triangles have sides exactly 5 cm, 12 cm and 13 cm?",
          hi: "सर्वांगसमता तक, ठीक 5 सेमी, 12 सेमी और 13 सेमी भुजाओं वाले कितने अलग त्रिभुज हैं?",
          mr: "एकरूपतेपर्यंत, नेमक्या 5 सेमी, 12 सेमी आणि 13 सेमी बाजूंचे किती वेगळे त्रिकोण आहेत?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        solution: {
          en: "Exactly 1: three sides pin the triangle completely — that is WHY SSS earns its place among the congruence tests. Flips and turns give the same triangle wearing a different pose.",
          hi: "ठीक 1: तीन भुजाएँ त्रिभुज को पूरी तरह जड़ देती हैं — इसीलिए SSS सर्वांगसमता-जाँचों में जगह पाता है। पलटने-घुमाने से वही त्रिभुज दूसरी मुद्रा में मिलता है।",
          mr: "नेमका 1: तीन बाजू त्रिकोणाला पूर्ण जखडतात — म्हणूनच SSS ला एकरूपता-चाचण्यांत स्थान आहे. उलटवणे-फिरवणे म्हणजे तोच त्रिकोण वेगळ्या पवित्र्यात.",
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
          en: "A draftsman wants a line through P parallel to line l, and draws transversal PQ making 48° with l. What ALTERNATE angle must he construct at P?",
          hi: "एक नक़्शानवीस P से होकर रेखा l के समांतर रेखा चाहता है, और l से 48° बनाती तिर्यक रेखा PQ खींचता है। P पर उसे कितने का एकांतर कोण बनाना होगा?",
          mr: "एका आरेखकाला P मधून रेषा l ला समांतर रेषा हवी आहे, आणि तो l शी 48° करणारी छेदिका PQ काढतो. P वर त्याला किती अंशांचा व्युत्क्रम कोन बांधावा लागेल?",
        },
        answer: 48,
        wrong: [132, 42, 96],
        fmt: deg,
        solution: {
          en: "Equal alternate angles FORCE parallelism — copy the 48° exactly. This is the whole construction: one transversal, one faithfully copied angle, and the new line can never meet l.",
          hi: "बराबर एकांतर कोण समांतरता को विवश करते हैं — 48° की हूबहू नक़ल कीजिए। यही पूरी रचना है: एक तिर्यक रेखा, एक ईमानदार नक़ल का कोण, और नई रेखा l से कभी नहीं मिल सकती।",
          mr: "समान व्युत्क्रम कोन समांतरता भाग पाडतात — 48° ची हुबेहूब नक्कल करा. हीच सारी रचना: एक छेदिका, एक इमानी नक्कल केलेला कोन, आणि नवी रेषा l ला कधीच भेटू शकत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "150° is constructible as 90° + 60°. Bisecting it gives which single angle — one no simpler construction reaches?",
          hi: "150°, 90° + 60° के रूप में रचनीय है। उसे समद्विभाजित करने पर कौन-सा अकेला कोण मिलता है — जिस तक कोई सरल रचना नहीं पहुँचती?",
          mr: "150° हे 90° + 60° म्हणून रचनीय आहे. त्याला दुभागल्यास कोणता एकच कोन मिळतो — जिथे अधिक सोपी रचना पोहोचत नाही?",
        },
        answer: 75,
        wrong: [70, 37.5, 105],
        checkExpr: "150/2",
        fmt: deg,
        solution: {
          en: "150 ÷ 2 = 75°. The compass's craft is exactly this: build what you can by adding 60s and 90s, then bisect your way to the target — 75 = (90 + 60)/2.",
          hi: "150 ÷ 2 = 75°। परकार का हुनर यही है: 60 और 90 जोड़कर जो बने वह बनाइए, फिर आधा-आधा करते लक्ष्य तक पहुँचिए — 75 = (90 + 60)/2।",
          mr: "150 ÷ 2 = 75°. कंपासाची कारागिरी हीच: 60 आणि 90 जोडून जे बांधता येते ते बांधा, मग दुभागत लक्ष्यापर्यंत पोहोचा — 75 = (90 + 60)/2.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 10 — Practical Geometry",
      name: "Practical Geometry",
      slug: "maths-7-practical-geometry",
      summary:
        "Ruler-and-compass honesty: parallels forced by one copied angle, triangles pinned by SSS, SAS, ASA and RHS — and arcs that refuse to cross when the sides cannot reach.",
      position: 10,
      translations: {
        hi: {
          name: "प्रायोगिक ज्यामिति",
          summary:
            "रूलर-परकार की ईमानदारी: एक नक़ल किए कोण से विवश समांतर रेखाएँ, SSS, SAS, ASA और RHS से जड़े त्रिभुज — और वे चाप जो भुजाओं के न पहुँचने पर कटने से इनकार कर देते हैं।",
        },
        mr: {
          name: "प्रात्यक्षिक भूमिती",
          summary:
            "पट्टी-कंपासाचा प्रामाणिकपणा: एका नक्कल केलेल्या कोनाने भाग पाडलेल्या समांतर रेषा, SSS, SAS, ASA आणि RHS ने जखडलेले त्रिकोण — आणि बाजू न पोहोचल्यास छेदायला नकार देणारे कंस.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Perimeter and Area (parallelograms, triangles, circles)      */
/* ------------------------------------------------------------------------- */
function perimeterAndArea(): TopicFileOut {
  const rand = rng("maths-7-perimeter-and-area");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A rectangular park is 25 m long and 15 m wide. What is its area, in square metres?",
          hi: "एक आयताकार पार्क 25 मीटर लंबा और 15 मीटर चौड़ा है। क्षेत्रफल वर्ग मीटर में कितना?",
          mr: "एक आयताकृती उद्यान 25 मीटर लांब आणि 15 मीटर रुंद आहे. क्षेत्रफळ चौरस मीटरमध्ये किती?",
        },
        answer: 375,
        wrong: [80, 40, 3750],
        checkExpr: "25*15",
        solution: {
          en: "Area = length × breadth = 25 × 15 = 375 m². 80 walks the perimeter instead; 40 merely adds the two sides once.",
          hi: "क्षेत्रफल = लंबाई × चौड़ाई = 25 × 15 = 375 वर्ग मीटर। 80 उलटे परिमाप नाप आता है; 40 दोनों भुजाएँ एक बार जोड़ भर देता है।",
          mr: "क्षेत्रफळ = लांबी × रुंदी = 25 × 15 = 375 चौ. मीटर. 80 उलट परिमिती मोजून येतो; 40 दोन्ही बाजू एकदाच जोडतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A square kitchen garden has side 12 m. How much fencing wire goes once round it, in metres?",
          hi: "एक वर्गाकार किचन-बग़ीचे की भुजा 12 मीटर है। एक बार घेरने में कितने मीटर तार लगेगा?",
          mr: "एका चौरस परसबागेची बाजू 12 मीटर आहे. एकदा कुंपण घालायला किती मीटर तार लागेल?",
        },
        answer: 48,
        wrong: [144, 24, 36],
        checkExpr: "12*4",
        solution: {
          en: "Four equal sides: 12 × 4 = 48 m. 144 computes the AREA; 24 fences only two sides and leaves the gate open on the rest.",
          hi: "चार बराबर भुजाएँ: 12 × 4 = 48 मीटर। 144 क्षेत्रफल निकाल बैठता है; 24 केवल दो भुजाएँ घेरकर बाक़ी खुला छोड़ देता है।",
          mr: "चार समान बाजू: 12 × 4 = 48 मीटर. 144 क्षेत्रफळ काढतो; 24 फक्त दोन बाजूंना कुंपण घालून बाकी उघडे ठेवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the area of a triangle with base 10 cm and height 6 cm, in square cm?",
          hi: "आधार 10 सेमी और ऊँचाई 6 सेमी वाले त्रिभुज का क्षेत्रफल वर्ग सेमी में कितना?",
          mr: "पाया 10 सेमी आणि उंची 6 सेमी असलेल्या त्रिकोणाचे क्षेत्रफळ चौरस सेमीमध्ये किती?",
        },
        answer: 30,
        wrong: [60, 16, 300],
        checkExpr: "10*6/2",
        solution: {
          en: "A triangle is half its bounding rectangle: (10 × 6) ÷ 2 = 30 cm². 60 forgets the half; 16 adds base and height.",
          hi: "त्रिभुज अपने घेरने वाले आयत का आधा है: (10 × 6) ÷ 2 = 30 वर्ग सेमी। 60 आधा भूल जाता है; 16 आधार-ऊँचाई जोड़ देता है।",
          mr: "त्रिकोण म्हणजे त्याला वेढणाऱ्या आयताचा अर्धा: (10 × 6) ÷ 2 = 30 चौ. सेमी. 60 अर्धे विसरतो; 16 पाया-उंची जोडतो.",
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
          en: "A parallelogram has base 8 cm and height 5 cm. What is its area, in square cm?",
          hi: "समांतर चतुर्भुज का आधार 8 सेमी और ऊँचाई 5 सेमी है। क्षेत्रफल वर्ग सेमी में?",
          mr: "समांतरभुज चौकोनाचा पाया 8 सेमी आणि उंची 5 सेमी आहे. क्षेत्रफळ चौरस सेमीमध्ये किती?",
        },
        answer: 40,
        wrong: [20, 13, 26],
        checkExpr: "8*5",
        solution: {
          en: "Base × height = 8 × 5 = 40 cm² — a parallelogram is a pushed-over rectangle, so NO halving. 20 halves it as if it were a triangle.",
          hi: "आधार × ऊँचाई = 8 × 5 = 40 वर्ग सेमी — समांतर चतुर्भुज झुका हुआ आयत है, अतः आधा नहीं होता। 20 उसे त्रिभुज मानकर आधा कर देता है।",
          mr: "पाया × उंची = 8 × 5 = 40 चौ. सेमी — समांतरभुज म्हणजे कललेला आयत, म्हणून अर्धे नाही. 20 त्याला त्रिकोण मानून निम्मे करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the circumference of a circle of radius 7 cm? (Take π = 22/7.)",
          hi: "त्रिज्या 7 सेमी वाले वृत्त की परिधि कितनी? (π = 22/7 लीजिए।)",
          mr: "त्रिज्या 7 सेमी असलेल्या वर्तुळाचा परीघ किती? (π = 22/7 घ्या.)",
        },
        answer: 44,
        wrong: [22, 154, 14],
        checkExpr: "2*22*7/7",
        solution: {
          en: "C = 2πr = 2 × 22/7 × 7 = 44 cm. 22 forgets the 2 and walks only half the rim; 154 is the AREA wearing the wrong units.",
          hi: "परिधि = 2πr = 2 × 22/7 × 7 = 44 सेमी। 22 दो भूलकर आधा ही किनारा चलता है; 154 ग़लत इकाई पहने क्षेत्रफल है।",
          mr: "परीघ = 2πr = 2 × 22/7 × 7 = 44 सेमी. 22 दोन विसरून अर्धीच कड चालतो; 154 म्हणजे चुकीचे एकक घातलेले क्षेत्रफळ.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the area of a circle of radius 7 cm? (Take π = 22/7.)",
          hi: "त्रिज्या 7 सेमी वाले वृत्त का क्षेत्रफल कितना? (π = 22/7 लीजिए।)",
          mr: "त्रिज्या 7 सेमी असलेल्या वर्तुळाचे क्षेत्रफळ किती? (π = 22/7 घ्या.)",
        },
        answer: 154,
        wrong: [44, 49, 308],
        checkExpr: "22*7*7/7",
        solution: {
          en: "A = πr² = 22/7 × 7 × 7 = 154 cm². 44 is the circumference; 49 is r² with π left out; 308 doubles for no reason.",
          hi: "क्षेत्रफल = πr² = 22/7 × 7 × 7 = 154 वर्ग सेमी। 44 परिधि है; 49 बिना π का r² है; 308 अकारण दुगुना।",
          mr: "क्षेत्रफळ = πr² = 22/7 × 7 × 7 = 154 चौ. सेमी. 44 हा परीघ; 49 म्हणजे π शिवायचा r²; 308 विनाकारण दुप्पट.",
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
          en: "A triangle's area is 36 square cm and its base is 9 cm. What is its height, in cm?",
          hi: "त्रिभुज का क्षेत्रफल 36 वर्ग सेमी और आधार 9 सेमी है। ऊँचाई कितने सेमी?",
          mr: "त्रिकोणाचे क्षेत्रफळ 36 चौरस सेमी आणि पाया 9 सेमी आहे. उंची किती सेमी?",
        },
        answer: 8,
        wrong: [4, 27, 324],
        checkExpr: "36*2/9",
        solution: {
          en: "Run the formula backwards: height = 2 × area ÷ base = 72 ÷ 9 = 8 cm. 4 forgets to double first; 27 subtracts the base from the area.",
          hi: "सूत्र उल्टा चलाइए: ऊँचाई = 2 × क्षेत्रफल ÷ आधार = 72 ÷ 9 = 8 सेमी। 4 पहले दुगुना करना भूलता है; 27 क्षेत्रफल में से आधार घटा देता है।",
          mr: "सूत्र उलटे चालवा: उंची = 2 × क्षेत्रफळ ÷ पाया = 72 ÷ 9 = 8 सेमी. 4 आधी दुप्पट करायला विसरतो; 27 क्षेत्रफळातून पाया वजा करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A wire bent into a square of side 11 cm is straightened and rebent into a rectangle 13 cm long. What is the rectangle's breadth, in cm?",
          hi: "11 सेमी भुजा के वर्ग में मुड़ा तार सीधा करके 13 सेमी लंबे आयत में मोड़ा जाता है। आयत की चौड़ाई कितने सेमी?",
          mr: "11 सेमी बाजूच्या चौरसात वाकवलेली तार सरळ करून 13 सेमी लांब आयतात वाकवली जाते. आयताची रुंदी किती सेमी?",
        },
        answer: 9,
        wrong: [31, 13, 11],
        checkExpr: "(4*11-2*13)/2",
        solution: {
          en: "The wire's length never changes: perimeter 44 cm. So 2(13 + b) = 44, giving b = 9 cm. 31 subtracts 13 only once — a rectangle has TWO of each side.",
          hi: "तार की लंबाई कभी नहीं बदलती: परिमाप 44 सेमी। अतः 2(13 + b) = 44, यानी b = 9 सेमी। 31 तेरह को एक ही बार घटाता है — आयत में हर भुजा दो-दो हैं।",
          mr: "तारेची लांबी कधी बदलत नाही: परिमिती 44 सेमी. म्हणून 2(13 + b) = 44, म्हणजे b = 9 सेमी. 31 तेराला एकदाच वजा करतो — आयतात प्रत्येक बाजू दोन-दोन असतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A circle's circumference is 88 cm. What is its radius, in cm? (Take π = 22/7.)",
          hi: "वृत्त की परिधि 88 सेमी है। त्रिज्या कितने सेमी? (π = 22/7 लीजिए।)",
          mr: "वर्तुळाचा परीघ 88 सेमी आहे. त्रिज्या किती सेमी? (π = 22/7 घ्या.)",
        },
        answer: 14,
        wrong: [28, 7, 44],
        checkExpr: "88*7/(2*22)",
        solution: {
          en: "r = C ÷ 2π = 88 × 7 ÷ 44 = 14 cm. 28 stops at the diameter; 7 halves once too often.",
          hi: "त्रिज्या = परिधि ÷ 2π = 88 × 7 ÷ 44 = 14 सेमी। 28 व्यास पर रुक जाता है; 7 एक बार ज़्यादा आधा कर देता है।",
          mr: "त्रिज्या = परीघ ÷ 2π = 88 × 7 ÷ 44 = 14 सेमी. 28 व्यासावर थांबतो; 7 एकदा जास्त निम्मे करतो.",
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
          en: "Two roads, each 3 m wide, cross at right angles through the middle of a 60 m × 40 m park, one parallel to each side. What area do the roads cover, in square metres?",
          hi: "3-3 मीटर चौड़ी दो सड़कें 60 मीटर × 40 मीटर पार्क के बीच से समकोण पर गुज़रती हैं, हर भुजा के समांतर एक। सड़कें कुल कितने वर्ग मीटर घेरती हैं?",
          mr: "प्रत्येकी 3 मीटर रुंद दोन रस्ते 60 मीटर × 40 मीटर उद्यानाच्या मधून काटकोनात जातात, प्रत्येक बाजूला समांतर एक. रस्ते एकूण किती चौरस मीटर व्यापतात?",
        },
        answer: 291,
        wrong: [300, 180, 120],
        checkExpr: "60*3+40*3-3*3",
        solution: {
          en: "One road covers 60 × 3 = 180, the other 40 × 3 = 120 — but their crossing square 3 × 3 = 9 got counted twice: 180 + 120 − 9 = 291 m². 300 pays for the crossing both times.",
          hi: "एक सड़क 60 × 3 = 180 घेरती है, दूसरी 40 × 3 = 120 — पर चौराहे का 3 × 3 = 9 दो बार गिना गया: 180 + 120 − 9 = 291 वर्ग मीटर। 300 चौराहे का दाम दोनों बार चुका देता है।",
          mr: "एक रस्ता 60 × 3 = 180 व्यापतो, दुसरा 40 × 3 = 120 — पण चौकाचा 3 × 3 = 9 दोनदा मोजला गेला: 180 + 120 − 9 = 291 चौ. मीटर. 300 चौकाची किंमत दोन्ही वेळा देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Grass costs ₹5 per square metre. What does it cost to grass a triangular plot with base 20 m and height 12 m?",
          hi: "घास ₹5 प्रति वर्ग मीटर पड़ती है। आधार 20 मीटर और ऊँचाई 12 मीटर वाले त्रिभुजाकार भूखंड पर घास लगवाने का ख़र्च कितना?",
          mr: "गवताला दर चौरस मीटरमागे ₹5 पडतात. पाया 20 मीटर आणि उंची 12 मीटर असलेल्या त्रिकोणी भूखंडावर गवत लावायचा खर्च किती?",
        },
        answer: 600,
        wrong: [1200, 120, 160],
        checkExpr: "20*12/2*5",
        fmt: rupees,
        solution: {
          en: "Area first: (20 × 12) ÷ 2 = 120 m², then 120 × 5 = ₹600. 1200 skips the halving; 120 stops at the area and forgets the bill.",
          hi: "पहले क्षेत्रफल: (20 × 12) ÷ 2 = 120 वर्ग मीटर, फिर 120 × 5 = ₹600। 1200 आधा करना छोड़ देता है; 120 क्षेत्रफल पर रुककर बिल भूल जाता है।",
          mr: "आधी क्षेत्रफळ: (20 × 12) ÷ 2 = 120 चौ. मीटर, मग 120 × 5 = ₹600. 1200 निम्मे करणे गाळतो; 120 क्षेत्रफळावर थांबून बिल विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A square has the same area as a rectangle measuring 16 cm by 4 cm. What is the square's side, in cm?",
          hi: "एक वर्ग का क्षेत्रफल 16 सेमी × 4 सेमी के आयत के बराबर है। वर्ग की भुजा कितने सेमी?",
          mr: "एका चौरसाचे क्षेत्रफळ 16 सेमी × 4 सेमी च्या आयताइतके आहे. चौरसाची बाजू किती सेमी?",
        },
        answer: 8,
        wrong: [10, 64, 20],
        solution: {
          en: "The shared area is 16 × 4 = 64 cm², and 64 = 8² — side 8 cm. 10 averages the rectangle's sides; averaging matches perimeters, never areas.",
          hi: "साझा क्षेत्रफल 16 × 4 = 64 वर्ग सेमी, और 64 = 8² — भुजा 8 सेमी। 10 आयत की भुजाओं का औसत लेता है; औसत परिमाप मिलाता है, क्षेत्रफल कभी नहीं।",
          mr: "सामाईक क्षेत्रफळ 16 × 4 = 64 चौ. सेमी, आणि 64 = 8² — बाजू 8 सेमी. 10 आयताच्या बाजूंची सरासरी घेतो; सरासरी परिमिती जुळवते, क्षेत्रफळ कधीच नाही.",
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
          en: "A washer has outer radius 14 cm and a hole of radius 7 cm. What is the area of the ring, in square cm? (Take π = 22/7.)",
          hi: "एक वॉशर की बाहरी त्रिज्या 14 सेमी और छेद की त्रिज्या 7 सेमी है। छल्ले का क्षेत्रफल वर्ग सेमी में? (π = 22/7)",
          mr: "एका वॉशरची बाह्य त्रिज्या 14 सेमी आणि छिद्राची त्रिज्या 7 सेमी आहे. कड्याचे क्षेत्रफळ चौरस सेमीमध्ये? (π = 22/7)",
        },
        answer: 462,
        wrong: [154, 616, 308],
        checkExpr: "22*(14*14-7*7)/7",
        solution: {
          en: "Big circle minus hole: 22/7 × (196 − 49) = 22 × 21 = 462 cm². 616 keeps the hole filled; 154 is only the hole itself.",
          hi: "बड़ा वृत्त घटा छेद: 22/7 × (196 − 49) = 22 × 21 = 462 वर्ग सेमी। 616 छेद भरा रहने देता है; 154 अकेला छेद है।",
          mr: "मोठे वर्तुळ वजा छिद्र: 22/7 × (196 − 49) = 22 × 21 = 462 चौ. सेमी. 616 छिद्र भरलेलेच ठेवतो; 154 म्हणजे एकटे छिद्र.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A 36 cm loop of string makes a 10 × 8 rectangle, then a 9 × 9 square. How much MORE area does the square enclose, in square cm?",
          hi: "36 सेमी के धागे के फंदे से पहले 10 × 8 का आयत, फिर 9 × 9 का वर्ग बनता है। वर्ग कितने वर्ग सेमी अधिक घेरता है?",
          mr: "36 सेमी दोऱ्याच्या वेढ्यातून आधी 10 × 8 चा आयत, मग 9 × 9 चा चौरस होतो. चौरस किती चौरस सेमी जास्त व्यापतो?",
        },
        answer: 1,
        wrong: [9, 4, 0],
        checkExpr: "9*9-10*8",
        solution: {
          en: "Same perimeter, different areas: 81 − 80 = 1 cm² more. 0 assumes equal perimeter means equal area — the square always wins that contest, if only just.",
          hi: "परिमाप वही, क्षेत्रफल अलग: 81 − 80 = 1 वर्ग सेमी अधिक। 0 मान बैठता है कि बराबर परिमाप यानी बराबर क्षेत्रफल — यह होड़ वर्ग सदा जीतता है, भले ज़रा-सा।",
          mr: "परिमिती तीच, क्षेत्रफळे वेगळी: 81 − 80 = 1 चौ. सेमी जास्त. 0 गृहीत धरतो की समान परिमिती म्हणजे समान क्षेत्रफळ — ही शर्यत चौरस नेहमी जिंकतो, अगदी थोडक्याने का होईना.",
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
          en: "A goat is tied by a 7 m rope to the OUTSIDE corner of a big rectangular shed. Around that corner it can sweep three-quarters of a circle. What area can it graze, in square metres? (π = 22/7)",
          hi: "एक बकरी 7 मीटर की रस्सी से बड़े आयताकार छप्पर के बाहरी कोने से बँधी है। उस कोने के चारों ओर वह वृत्त का तीन-चौथाई घूम सकती है। वह कितने वर्ग मीटर चर सकती है? (π = 22/7)",
          mr: "एक शेळी 7 मीटर दोरीने मोठ्या आयताकृती गोठ्याच्या बाहेरच्या कोपऱ्याला बांधली आहे. त्या कोपऱ्याभोवती ती वर्तुळाचा तीन-चतुर्थांश फिरू शकते. ती किती चौरस मीटर चरू शकते? (π = 22/7)",
        },
        answer: 115.5,
        wrong: [154, 38.5, 77],
        checkExpr: "3*22*7*7/(7*4)",
        solution: {
          en: "A full circle of radius 7 covers 154 m², but the shed blocks one quarter: 154 × 3/4 = 115.5 m². 154 lets the goat walk through walls; 38.5 leaves it only the blocked quarter.",
          hi: "7 त्रिज्या का पूरा वृत्त 154 वर्ग मीटर घेरता है, पर छप्पर एक चौथाई रोक लेता है: 154 × 3/4 = 115.5 वर्ग मीटर। 154 बकरी को दीवारों के पार चलने देता है; 38.5 उसे केवल रुका हुआ चौथाई थमा देता है।",
          mr: "7 त्रिज्येचे पूर्ण वर्तुळ 154 चौ. मीटर व्यापते, पण गोठा एक चतुर्थांश अडवतो: 154 × 3/4 = 115.5 चौ. मीटर. 154 शेळीला भिंतीतून चालू देतो; 38.5 तिला फक्त अडवलेला चतुर्थांशच देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "If a circle's radius is doubled, its area becomes how many TIMES the original?",
          hi: "यदि वृत्त की त्रिज्या दुगुनी कर दी जाए, तो क्षेत्रफल मूल का कितने गुना हो जाता है?",
          mr: "वर्तुळाची त्रिज्या दुप्पट केली, तर क्षेत्रफळ मूळच्या किती पट होते?",
        },
        answer: 4,
        wrong: [2, 8, 6],
        checkExpr: "2*2",
        solution: {
          en: "Area rides on r², so doubling r multiplies the area by 2² = 4. 2 doubles only once — that is the CIRCUMFERENCE's behaviour; areas grow by the square.",
          hi: "क्षेत्रफल r² पर सवार है, अतः r दुगुनी होते ही क्षेत्रफल 2² = 4 गुना। 2 एक ही बार दुगुना करता है — वह परिधि का स्वभाव है; क्षेत्रफल वर्ग से बढ़ते हैं।",
          mr: "क्षेत्रफळ r² वर स्वार, म्हणून r दुप्पट होताच क्षेत्रफळ 2² = 4 पट. 2 एकदाच दुप्पट करतो — तो परीघाचा स्वभाव; क्षेत्रफळे वर्गाने वाढतात.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 11 — Perimeter and Area",
      name: "Perimeter and Area",
      slug: "maths-7-perimeter-and-area",
      summary:
        "Parallelograms as pushed-over rectangles, triangles as their halves, circles measured by 22/7 — and a goat on a corner rope showing how shapes share space.",
      position: 11,
      translations: {
        hi: {
          name: "परिमाप और क्षेत्रफल",
          summary:
            "झुके आयत जैसे समांतर चतुर्भुज, उनके आधे त्रिभुज, 22/7 से नपे वृत्त — और कोने की रस्सी से बँधी बकरी दिखाती है कि आकृतियाँ जगह कैसे बाँटती हैं।",
        },
        mr: {
          name: "परिमिती आणि क्षेत्रफळ",
          summary:
            "कललेल्या आयतांसारखे समांतरभुज, त्यांचे अर्धे त्रिकोण, 22/7 ने मोजलेली वर्तुळे — आणि कोपऱ्याच्या दोरीची शेळी दाखवते की आकृती जागा कशी वाटतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Algebraic Expressions (terms, coefficients, evaluation)      */
/* ------------------------------------------------------------------------- */
function algebraicExpressions(): TopicFileOut {
  const rand = rng("maths-7-algebraic-expressions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the value of 3x + 2 when x = 4?",
          hi: "x = 4 पर 3x + 2 का मान कितना?",
          mr: "x = 4 असताना 3x + 2 ची किंमत किती?",
        },
        answer: 14,
        wrong: [18, 9, 24],
        checkExpr: "3*4+2",
        solution: {
          en: "Substitute and follow the order: 3 × 4 = 12, then + 2 = 14. 18 adds the 2 to x before multiplying; 24 multiplies everything in sight.",
          hi: "मान रखिए और क्रम निभाइए: 3 × 4 = 12, फिर + 2 = 14। 18 गुणा से पहले 2 को x में जोड़ देता है; 24 जो दिखे उसे गुणा कर देता है।",
          mr: "किंमत ठेवा आणि क्रम पाळा: 3 × 4 = 12, मग + 2 = 14. 18 गुणाकाराआधी 2 x मध्ये मिळवतो; 24 दिसेल त्याचा गुणाकार करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many terms does the expression 4x² + 3x − 5 have?",
          hi: "व्यंजक 4x² + 3x − 5 में कितने पद हैं?",
          mr: "पदावली 4x² + 3x − 5 मध्ये किती पदे आहेत?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        solution: {
          en: "Terms are the chunks joined by + and −: 4x², 3x and −5 — that is 3. The constant −5 is a full term even without a letter.",
          hi: "पद वे टुकड़े हैं जो + और − से जुड़े हैं: 4x², 3x और −5 — यानी 3। अचर −5 बिना अक्षर के भी पूरा पद है।",
          mr: "पदे म्हणजे + आणि − ने जोडलेले तुकडे: 4x², 3x आणि −5 — म्हणजे 3. स्थिरांक −5 अक्षराशिवायही पूर्ण पद आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the coefficient of y in 7y + 12?",
          hi: "7y + 12 में y का गुणांक क्या है?",
          mr: "7y + 12 मध्ये y चा सहगुणक काय?",
        },
        answer: 7,
        wrong: [12, 19, 1],
        solution: {
          en: "The coefficient is the number RIDING the letter: 7. 12 stands alone as the constant; it never touches y.",
          hi: "गुणांक अक्षर पर सवार संख्या है: 7। 12 अचर बनकर अकेला खड़ा है; वह y को छूता तक नहीं।",
          mr: "सहगुणक म्हणजे अक्षरावर स्वार संख्या: 7. 12 स्थिरांक म्हणून एकटा उभा; तो y ला स्पर्शही करत नाही.",
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
          en: "Add (2x + 3) and (5x − 1). What is the coefficient of x in the sum?",
          hi: "(2x + 3) और (5x − 1) जोड़िए। योग में x का गुणांक कितना?",
          mr: "(2x + 3) आणि (5x − 1) जोडा. बेरजेत x चा सहगुणक किती?",
        },
        answer: 7,
        wrong: [3, 10, 2],
        checkExpr: "2+5",
        solution: {
          en: "Like terms join: 2x + 5x = 7x, so the coefficient is 7. 10 multiplies 2 × 5; addition of terms adds their coefficients, nothing more.",
          hi: "समान पद जुड़ते हैं: 2x + 5x = 7x, अतः गुणांक 7। 10 में 2 × 5 गुणा हो गया; पदों का योग केवल गुणांक जोड़ता है, और कुछ नहीं।",
          mr: "समान पदे जुळतात: 2x + 5x = 7x, म्हणून सहगुणक 7. 10 मध्ये 2 × 5 गुणले गेले; पदांची बेरीज फक्त सहगुणक जोडते, आणखी काही नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of x² when x = −3?",
          hi: "x = −3 पर x² का मान कितना?",
          mr: "x = −3 असताना x² ची किंमत किती?",
        },
        answer: 9,
        wrong: [-9, 6, -6],
        checkExpr: "(0-3)*(0-3)",
        solution: {
          en: "(−3) × (−3) = 9: squaring wipes the minus, for the two negatives cancel. −9 squares the digit and pastes the sign back on afterwards.",
          hi: "(−3) × (−3) = 9: वर्ग ऋण मिटा देता है, दोनों ऋण कट जाते हैं। −9 अंक का वर्ग कर चिह्न बाद में चिपका देता है।",
          mr: "(−3) × (−3) = 9: वर्ग ऋण पुसतो, दोन ऋणे रद्द होतात. −9 आकड्याचा वर्ग करून चिन्ह मागून चिकटवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "5ab + 3ab = ▢ab. What is the coefficient in the box?",
          hi: "5ab + 3ab = ▢ab। रिक्त में गुणांक क्या आएगा?",
          mr: "5ab + 3ab = ▢ab. रिकाम्यात सहगुणक काय येईल?",
        },
        answer: 8,
        wrong: [15, 2, 53],
        checkExpr: "5+3",
        solution: {
          en: "Like terms — same letters, same powers — add their coefficients: 5 + 3 = 8. 15 multiplies them; 53 just sits the digits side by side.",
          hi: "समान पद — वही अक्षर, वही घात — गुणांक जोड़ते हैं: 5 + 3 = 8। 15 गुणा कर देता है; 53 अंकों को बग़ल-बग़ल बैठा देता है।",
          mr: "समान पदे — तीच अक्षरे, त्याच घाती — सहगुणक जोडतात: 5 + 3 = 8. 15 गुणतो; 53 आकडे शेजारी-शेजारी बसवतो.",
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
          en: "Subtract: (7m − 2) − (4m + 3). What is the CONSTANT term of the result?",
          hi: "घटाइए: (7m − 2) − (4m + 3)। परिणाम का अचर पद क्या है?",
          mr: "वजा करा: (7m − 2) − (4m + 3). निकालाचे स्थिरपद काय?",
        },
        answer: -5,
        wrong: [1, 5, -1],
        checkExpr: "0-2-3",
        solution: {
          en: "The minus reaches EVERY term of the bracket: 7m − 2 − 4m − 3 = 3m − 5, constant −5. 1 flips only the 4m and lets the +3 slip through unsigned.",
          hi: "ऋण कोष्ठक के हर पद तक पहुँचता है: 7m − 2 − 4m − 3 = 3m − 5, अचर −5। 1 केवल 4m पलटता है और +3 को बिना चिह्न बदले निकल जाने देता है।",
          mr: "ऋण कंसातील प्रत्येक पदापर्यंत पोहोचते: 7m − 2 − 4m − 3 = 3m − 5, स्थिरपद −5. 1 फक्त 4m उलटवतो आणि +3 ला चिन्ह न बदलता निसटू देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the value of 2a² + 3b when a = 2 and b = 5?",
          hi: "a = 2 और b = 5 पर 2a² + 3b का मान कितना?",
          mr: "a = 2 आणि b = 5 असताना 2a² + 3b ची किंमत किती?",
        },
        answer: 23,
        wrong: [31, 19, 46],
        checkExpr: "2*2*2+3*5",
        solution: {
          en: "2 × 2² = 8 and 3 × 5 = 15: together 23. 31 squares (2a) as a whole, getting 16 — the exponent belongs to a alone, not to its coefficient.",
          hi: "2 × 2² = 8 और 3 × 5 = 15: मिलाकर 23। 31 पूरे (2a) का वर्ग कर 16 पाता है — घात अकेले a की है, उसके गुणांक की नहीं।",
          mr: "2 × 2² = 8 आणि 3 × 5 = 15: मिळून 23. 31 अख्ख्या (2a) चा वर्ग करून 16 मिळवतो — घात एकट्या a ची, त्याच्या सहगुणकाची नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Simplify 3x + 2y − x + 4y. What is the coefficient of y?",
          hi: "3x + 2y − x + 4y सरल कीजिए। y का गुणांक कितना?",
          mr: "3x + 2y − x + 4y सोपे करा. y चा सहगुणक किती?",
        },
        answer: 6,
        wrong: [2, 8, 4],
        checkExpr: "2+4",
        solution: {
          en: "Sort the letters: x's give 3 − 1 = 2x, y's give 2 + 4 = 6y — the y-coefficient is 6. 8 lets an x sneak into the y pile.",
          hi: "अक्षर छाँटिए: x से 3 − 1 = 2x, y से 2 + 4 = 6y — y का गुणांक 6। 8 में एक x चुपके से y की ढेरी में घुस गया।",
          mr: "अक्षरे निवडा: x चे 3 − 1 = 2x, y चे 2 + 4 = 6y — y चा सहगुणक 6. 8 मध्ये एक x हळूच y च्या ढिगात शिरतो.",
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
          en: "From the sum of 3x + 4 and 2x − 5, subtract x + 1. What is the coefficient of x in the answer?",
          hi: "3x + 4 और 2x − 5 के योग में से x + 1 घटाइए। उत्तर में x का गुणांक कितना?",
          mr: "3x + 4 आणि 2x − 5 च्या बेरजेतून x + 1 वजा करा. उत्तरात x चा सहगुणक किती?",
        },
        answer: 4,
        wrong: [6, 5, 2],
        checkExpr: "3+2-1",
        solution: {
          en: "The sum is 5x − 1; removing x + 1 leaves 4x − 2 — coefficient 4. 6 ADDS the last x instead of taking it away; 5 forgets the subtraction entirely.",
          hi: "योग 5x − 1; x + 1 हटाने पर 4x − 2 — गुणांक 4। 6 आख़िरी x को हटाने की जगह जोड़ देता है; 5 घटाना ही भूल जाता है।",
          mr: "बेरीज 5x − 1; x + 1 काढल्यावर 4x − 2 — सहगुणक 4. 6 शेवटचा x काढण्याऐवजी मिळवतो; 5 वजाबाकीच विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A triangle's sides are x, x + 3 and 2x − 1. What is its perimeter when x = 5?",
          hi: "त्रिभुज की भुजाएँ x, x + 3 और 2x − 1 हैं। x = 5 पर परिमाप कितना?",
          mr: "त्रिकोणाच्या बाजू x, x + 3 आणि 2x − 1 आहेत. x = 5 असताना परिमिती किती?",
        },
        answer: 22,
        wrong: [17, 25, 20],
        checkExpr: "5+5+3+2*5-1",
        solution: {
          en: "First simplify: x + (x + 3) + (2x − 1) = 4x + 2, then 4 × 5 + 2 = 22. Or plug in: 5 + 8 + 9 = 22 — both roads agree. 17 loses the 2x term's double.",
          hi: "पहले सरल कीजिए: x + (x + 3) + (2x − 1) = 4x + 2, फिर 4 × 5 + 2 = 22। या सीधे रखिए: 5 + 8 + 9 = 22 — दोनों राहें मिलती हैं। 17 में 2x का दुगुनापन खो गया।",
          mr: "आधी सोपे करा: x + (x + 3) + (2x − 1) = 4x + 2, मग 4 × 5 + 2 = 22. किंवा थेट ठेवा: 5 + 8 + 9 = 22 — दोन्ही वाटा जुळतात. 17 मध्ये 2x चा दुप्पटपणा हरवला.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the value of a² − b² when a = 5 and b = 3?",
          hi: "a = 5 और b = 3 पर a² − b² का मान कितना?",
          mr: "a = 5 आणि b = 3 असताना a² − b² ची किंमत किती?",
        },
        answer: 16,
        wrong: [4, 34, 2],
        checkExpr: "5*5-3*3",
        solution: {
          en: "25 − 9 = 16. 4 computes (a − b)² = 2² instead — squaring the difference is NOT the difference of squares; 34 adds where it should subtract.",
          hi: "25 − 9 = 16। 4 उलटे (a − b)² = 2² निकालता है — अंतर का वर्ग, वर्गों का अंतर नहीं होता; 34 घटाने की जगह जोड़ देता है।",
          mr: "25 − 9 = 16. 4 उलटे (a − b)² = 2² काढतो — फरकाचा वर्ग म्हणजे वर्गांचा फरक नव्हे; 34 वजा करण्याऐवजी जोडतो.",
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
          en: "Matchstick squares in a row need 3n + 1 sticks for n squares. How many sticks build 15 squares?",
          hi: "क़तार में माचिस-तीलियों के n वर्गों के लिए 3n + 1 तीलियाँ लगती हैं। 15 वर्गों के लिए कितनी?",
          mr: "रांगेत काडेपेटीच्या n चौरसांसाठी 3n + 1 काड्या लागतात. 15 चौरसांसाठी किती?",
        },
        answer: 46,
        wrong: [45, 60, 31],
        checkExpr: "3*15+1",
        solution: {
          en: "3 × 15 + 1 = 46: each new square borrows a side from its neighbour, and the lone +1 is the very first stick. 45 forgets that opening stick; 60 gives every square all four sides.",
          hi: "3 × 15 + 1 = 46: हर नया वर्ग पड़ोसी से एक भुजा उधार लेता है, और अकेला +1 सबसे पहली तीली है। 45 वह पहली तीली भूल जाता है; 60 हर वर्ग को चारों भुजाएँ थमा देता है।",
          mr: "3 × 15 + 1 = 46: प्रत्येक नवा चौरस शेजाऱ्याकडून एक बाजू उसनी घेतो, आणि एकटा +1 म्हणजे अगदी पहिली काडी. 45 ती पहिली काडी विसरतो; 60 प्रत्येक चौरसाला चारही बाजू देतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Simplify 5(2x − 3) − 4(x + 2) and find its value when x = 4.",
          hi: "5(2x − 3) − 4(x + 2) सरल कर x = 4 पर मान निकालिए।",
          mr: "5(2x − 3) − 4(x + 2) सोपे करून x = 4 असताना किंमत काढा.",
        },
        answer: 1,
        wrong: [17, 47, -1],
        checkExpr: "6*4-23",
        solution: {
          en: "Open both brackets: 10x − 15 − 4x − 8 = 6x − 23, and 6 × 4 − 23 = 1. 17 turns −4 × 2 into +8 — the minus must multiply into EVERY term of its bracket.",
          hi: "दोनों कोष्ठक खोलिए: 10x − 15 − 4x − 8 = 6x − 23, और 6 × 4 − 23 = 1। 17 में −4 × 2 बन गया +8 — ऋण को अपने कोष्ठक के हर पद में गुणा होना चाहिए।",
          mr: "दोन्ही कंस उघडा: 10x − 15 − 4x − 8 = 6x − 23, आणि 6 × 4 − 23 = 1. 17 मध्ये −4 × 2 चे +8 झाले — ऋणाने आपल्या कंसातील प्रत्येक पदात गुणले पाहिजे.",
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
          en: "The expression n² − n + 41 produces prime numbers for many small n. What is its value when n = 5?",
          hi: "व्यंजक n² − n + 41 कई छोटे n के लिए अभाज्य संख्याएँ देता है। n = 5 पर उसका मान कितना?",
          mr: "पदावली n² − n + 41 अनेक लहान n साठी मूळ संख्या देते. n = 5 असताना तिची किंमत किती?",
        },
        answer: 61,
        wrong: [51, 66, 41],
        checkExpr: "5*5-5+41",
        solution: {
          en: "25 − 5 + 41 = 61, prime indeed. But beware the pattern's promise: at n = 41 the formula gives 41 × 41, no prime at all. Checking many cases is evidence — never proof.",
          hi: "25 − 5 + 41 = 61, सचमुच अभाज्य। पर पैटर्न के वादे से सावधान: n = 41 पर सूत्र 41 × 41 देता है, अभाज्य बिलकुल नहीं। ढेरों उदाहरण जाँचना गवाही है — प्रमाण कभी नहीं।",
          mr: "25 − 5 + 41 = 61, खरोखर मूळ. पण नमुन्याच्या वचनापासून सावध: n = 41 वर सूत्र 41 × 41 देते, मूळ मुळीच नाही. अनेक उदाहरणे तपासणे म्हणजे पुरावा — सिद्धता कधीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A magic trick: take a number, add 5, double the result, subtract 10, then halve it. Algebra says everything cancels but the number itself. If you start with 17, what comes out?",
          hi: "एक जादुई चाल: संख्या लीजिए, 5 जोड़िए, परिणाम दुगुना कीजिए, 10 घटाइए, फिर आधा कीजिए। बीजगणित कहता है — संख्या के सिवा सब कट जाता है। 17 से शुरू करें तो क्या निकलेगा?",
          mr: "एक जादूची युक्ती: संख्या घ्या, 5 मिळवा, निकाल दुप्पट करा, 10 वजा करा, मग निम्मे करा. बीजगणित सांगते — संख्येशिवाय सारे रद्द होते. 17 पासून सुरू केल्यास काय निघेल?",
        },
        answer: 17,
        wrong: [22, 34, 12],
        checkExpr: "(2*(17+5)-10)/2",
        solution: {
          en: "(2(x + 5) − 10) ÷ 2 = (2x + 10 − 10) ÷ 2 = x: the trick returns 17 untouched. Algebra is the trick's X-ray — the +5 and the −10÷2 were always destined to cancel.",
          hi: "(2(x + 5) − 10) ÷ 2 = (2x + 10 − 10) ÷ 2 = x: चाल 17 को अनछुआ लौटा देती है। बीजगणित चाल का एक्स-रे है — +5 और −10÷2 का कटना पहले से तय था।",
          mr: "(2(x + 5) − 10) ÷ 2 = (2x + 10 − 10) ÷ 2 = x: युक्ती 17 ला स्पर्श न करता परत देते. बीजगणित म्हणजे युक्तीचा एक्स-रे — +5 आणि −10÷2 यांचे रद्द होणे आधीच ठरलेले होते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 12 — Algebraic Expressions",
      name: "Algebraic Expressions",
      slug: "maths-7-algebraic-expressions",
      summary:
        "Terms, coefficients and like-term sorting; minus signs that must reach every corner of a bracket — and algebra as the X-ray that exposes a number trick.",
      position: 12,
      translations: {
        hi: {
          name: "बीजीय व्यंजक",
          summary:
            "पद, गुणांक और समान पदों की छँटाई; ऋण-चिह्न जिन्हें कोष्ठक के हर कोने तक पहुँचना है — और बीजगणित वह एक्स-रे जो संख्या-जादू का भेद खोल देता है।",
        },
        mr: {
          name: "बैजिक पदावली",
          summary:
            "पदे, सहगुणक आणि समान पदांची निवड; कंसाच्या प्रत्येक कोपऱ्यापर्यंत पोहोचावी लागणारी ऋण-चिन्हे — आणि संख्या-जादूचे रहस्य उघडणारा बीजगणिताचा एक्स-रे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Exponents and Powers (repeated multiplication, laws)         */
/* ------------------------------------------------------------------------- */
function exponentsAndPowers(): TopicFileOut {
  const rand = rng("maths-7-exponents-and-powers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 2⁵?",
          hi: "2⁵ कितना है?",
          mr: "2⁵ किती?",
        },
        answer: 32,
        wrong: [10, 25, 16],
        checkExpr: "2*2*2*2*2",
        solution: {
          en: "Five 2s multiplied: 2 × 2 × 2 × 2 × 2 = 32. 10 multiplies base by exponent; 25 swaps them into 5²; 16 stops one doubling early.",
          hi: "पाँच 2 का गुणा: 2 × 2 × 2 × 2 × 2 = 32। 10 आधार को घात से गुणा करता है; 25 उन्हें पलटकर 5² बना देता है; 16 एक दुगुना पहले रुक जाता है।",
          mr: "पाच 2 चा गुणाकार: 2 × 2 × 2 × 2 × 2 = 32. 10 पायाला घाताने गुणतो; 25 त्यांना उलटवून 5² करतो; 16 एक दुप्पट आधी थांबतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is 10³?",
          hi: "10³ कितना है?",
          mr: "10³ किती?",
        },
        answer: 1000,
        wrong: [30, 100, 10000],
        checkExpr: "10*10*10",
        solution: {
          en: "Three 10s: 10 × 10 × 10 = 1000 — the exponent counts the zeros. 30 multiplies 10 by 3; 10000 hangs one zero too many.",
          hi: "तीन 10: 10 × 10 × 10 = 1000 — घात शून्यों को गिनती है। 30 दस को तीन से गुणा करता है; 10000 एक शून्य ज़्यादा लटका देता है।",
          mr: "तीन 10: 10 × 10 × 10 = 1000 — घात शून्ये मोजते. 30 दहाला तीनने गुणतो; 10000 एक शून्य जास्त लटकवतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In the power 7⁴, which number is the EXPONENT?",
          hi: "घातांक-रूप 7⁴ में घात कौन-सी संख्या है?",
          mr: "घातरूप 7⁴ मध्ये घात कोणती संख्या आहे?",
        },
        answer: 4,
        wrong: [7, 28, 2401],
        solution: {
          en: "The little raised 4: it COUNTS how many 7s multiply. 7 is the base; 2401 is the value the pair produces.",
          hi: "ऊपर लिखा छोटा 4: वह गिनता है कि कितने 7 गुणा होंगे। 7 आधार है; 2401 वह मान है जो जोड़ी बनाती है।",
          mr: "वर लिहिलेला छोटा 4: तो मोजतो की किती 7 गुणले जातील. 7 हा पाया; 2401 ही जोडीने घडवलेली किंमत.",
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
          en: "3² × 3³ = 3 raised to which power?",
          hi: "3² × 3³ = 3 की कौन-सी घात?",
          mr: "3² × 3³ = 3 चा कोणता घात?",
        },
        answer: 5,
        wrong: [6, 1, 9],
        checkExpr: "2+3",
        solution: {
          en: "Same base multiplying: ADD the exponents, 2 + 3 = 5. 6 multiplies them — that law belongs to a power OF a power, like (3²)³.",
          hi: "समान आधार का गुणा: घातें जोड़िए, 2 + 3 = 5। 6 उन्हें गुणा करता है — वह नियम घात-की-घात का है, जैसे (3²)³।",
          mr: "समान पायाचा गुणाकार: घाती जोडा, 2 + 3 = 5. 6 त्यांना गुणतो — तो नियम घाताच्या-घाताचा, जसे (3²)³.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is (−1)⁷?",
          hi: "(−1)⁷ कितना है?",
          mr: "(−1)⁷ किती?",
        },
        answer: -1,
        wrong: [1, -7, 7],
        solution: {
          en: "An odd power keeps the minus: seven −1s pair off three times and one minus survives — −1. 1 needs an even exponent; −7 multiplies base by power.",
          hi: "विषम घात ऋण रखती है: सात −1 तीन जोड़ियों में कटते हैं और एक ऋण बचता है — −1। 1 के लिए सम घात चाहिए; −7 आधार को घात से गुणा कर बैठता है।",
          mr: "विषम घात ऋण राखते: सात −1 तीन जोड्यांत रद्द होतात आणि एक ऋण उरते — −1. 1 साठी सम घात हवी; −7 पायाला घाताने गुणतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is 5⁰?",
          hi: "5⁰ कितना है?",
          mr: "5⁰ किती?",
        },
        answer: 1,
        wrong: [0, 5, 50],
        solution: {
          en: "Any nonzero number to the power 0 is 1 — watch the ladder: 5² = 25, 5¹ = 5, and each step DIVIDES by 5, so 5⁰ = 5 ÷ 5 = 1. 0 confuses the exponent with the answer.",
          hi: "शून्येतर संख्या की घात 0 सदा 1 — सीढ़ी देखिए: 5² = 25, 5¹ = 5, हर क़दम 5 से भाग है, अतः 5⁰ = 5 ÷ 5 = 1। 0 घात को ही उत्तर समझ लेता है।",
          mr: "शून्येतर संख्येचा घात 0 नेहमी 1 — शिडी पाहा: 5² = 25, 5¹ = 5, प्रत्येक पायरी 5 ने भाग, म्हणून 5⁰ = 5 ÷ 5 = 1. 0 घातालाच उत्तर समजतो.",
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
          en: "What is 2⁸ ÷ 2⁵?",
          hi: "2⁸ ÷ 2⁵ कितना है?",
          mr: "2⁸ ÷ 2⁵ किती?",
        },
        answer: 8,
        wrong: [8192, 2, 4],
        checkExpr: "2*2*2",
        solution: {
          en: "Same base dividing: SUBTRACT exponents, 2⁸⁻⁵ = 2³ = 8. 8192 adds them into 2¹³; the shared 2⁵ on top and bottom cancels away.",
          hi: "समान आधार का भाग: घातें घटाइए, 2⁸⁻⁵ = 2³ = 8। 8192 जोड़कर 2¹³ बना देता है; ऊपर-नीचे का साझा 2⁵ कट जाता है।",
          mr: "समान पायाचा भाग: घाती वजा करा, 2⁸⁻⁵ = 2³ = 8. 8192 जोडून 2¹³ करतो; वर-खालचा सामाईक 2⁵ रद्द होतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is (2³)²?",
          hi: "(2³)² कितना है?",
          mr: "(2³)² किती?",
        },
        answer: 64,
        wrong: [32, 36, 12],
        checkExpr: "8*8",
        solution: {
          en: "A power of a power MULTIPLIES exponents: 2³ˣ² = 2⁶ = 64 — or simply 8 × 8. 32 adds the exponents into 2⁵, the multiplication law used in the wrong house.",
          hi: "घात की घात में घातें गुणा होती हैं: 2³ˣ² = 2⁶ = 64 — या सीधे 8 × 8। 32 जोड़कर 2⁵ बनाता है — गुणा का नियम ग़लत घर में।",
          mr: "घाताच्या घातात घाती गुणल्या जातात: 2³ˣ² = 2⁶ = 64 — किंवा थेट 8 × 8. 32 जोडून 2⁵ करतो — गुणाकाराचा नियम चुकीच्या घरात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "72 written in prime powers is 2³ × 3 to which power?",
          hi: "72 को अभाज्य घातों में लिखें तो 2³ × 3 की कौन-सी घात?",
          mr: "72 मूळ घातांत लिहिले तर 2³ × 3 चा कोणता घात?",
        },
        answer: 2,
        wrong: [3, 1, 4],
        solution: {
          en: "72 = 8 × 9 = 2³ × 3²: the exponent of 3 is 2. Break the number down by repeated division — 72 halves to 36, 18, 9, then 9 = 3 × 3 and the 3s stop at two.",
          hi: "72 = 8 × 9 = 2³ × 3²: तीन की घात 2 है। बार-बार भाग से तोड़िए — 72 से 36, 18, 9, फिर 9 = 3 × 3 और तीन दो पर रुक जाते हैं।",
          mr: "72 = 8 × 9 = 2³ × 3²: तिघाचा घात 2. पुनःपुन्हा भागून फोडा — 72 चे 36, 18, 9, मग 9 = 3 × 3 आणि तीन दोनवर थांबतात.",
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
          en: "The Sun is about 150,000,000 km from the Earth. In standard form that is 1.5 × 10 to which power?",
          hi: "सूर्य पृथ्वी से लगभग 150,000,000 किमी दूर है। मानक रूप में यह 1.5 × 10 की कौन-सी घात है?",
          mr: "सूर्य पृथ्वीपासून सुमारे 150,000,000 किमी दूर आहे. प्रमाण रूपात हे 1.5 × 10 चा कोणता घात?",
        },
        answer: 8,
        wrong: [7, 9, 6],
        solution: {
          en: "From 1.5 the decimal point hops 8 places to rebuild 150,000,000: 1.5 × 10⁸. 7 counts the zeros but forgets the hop over the 5.",
          hi: "1.5 से दशमलव बिंदु 8 छलाँगों में 150,000,000 फिर बनाता है: 1.5 × 10⁸। 7 शून्य गिनता है पर 5 के ऊपर की छलाँग भूल जाता है।",
          mr: "1.5 पासून दशांश बिंदू 8 उड्यांत 150,000,000 पुन्हा बांधतो: 1.5 × 10⁸. 7 शून्ये मोजतो पण 5 वरची उडी विसरतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is 3⁴ − 4³?",
          hi: "3⁴ − 4³ कितना है?",
          mr: "3⁴ − 4³ किती?",
        },
        answer: 17,
        wrong: [0, 7, 12],
        checkExpr: "3*3*3*3-4*4*4",
        solution: {
          en: "81 − 64 = 17: swapping base and exponent changes the value. 0 assumes 3⁴ and 4³ are twins; 12 just multiplies 3 × 4 either way.",
          hi: "81 − 64 = 17: आधार-घात की अदला-बदली मान बदल देती है। 0 मानता है कि 3⁴ और 4³ जुड़वाँ हैं; 12 दोनों तरफ़ बस 3 × 4 कर देता है।",
          mr: "81 − 64 = 17: पाया-घाताची अदलाबदल किंमत बदलते. 0 समजतो की 3⁴ आणि 4³ जुळे; 12 दोन्हीकडे नुसते 3 × 4 करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "(10⁵ × 10³) ÷ 10⁴ = 10 raised to which power?",
          hi: "(10⁵ × 10³) ÷ 10⁴ = 10 की कौन-सी घात?",
          mr: "(10⁵ × 10³) ÷ 10⁴ = 10 चा कोणता घात?",
        },
        answer: 4,
        wrong: [2, 12, 60],
        checkExpr: "5+3-4",
        solution: {
          en: "Add for the product, subtract for the division: 5 + 3 − 4 = 4. 12 forgets to subtract; 60 multiplies all three exponents.",
          hi: "गुणा में जोड़, भाग में घटाव: 5 + 3 − 4 = 4। 12 घटाना भूल जाता है; 60 तीनों घातें गुणा कर देता है।",
          mr: "गुणाकारात बेरीज, भागात वजाबाकी: 5 + 3 − 4 = 4. 12 वजा करायला विसरतो; 60 तिन्ही घाती गुणतो.",
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
          en: "Which is greater, 2¹⁰ or 10², and by how much?",
          hi: "2¹⁰ और 10² में बड़ा कौन, और कितने से?",
          mr: "2¹⁰ आणि 10² मध्ये मोठा कोण, आणि कितीने?",
        },
        answer: 924,
        wrong: [24, 100, 1024],
        checkExpr: "1024-100",
        solution: {
          en: "2¹⁰ = 1024 while 10² = 100: the small base with the big exponent wins by 924. Repeated doubling outruns one big multiplication — exponents beat bases in the long run.",
          hi: "2¹⁰ = 1024 जबकि 10² = 100: छोटे आधार पर बड़ी घात 924 से जीतती है। बार-बार का दुगुनापन एक बड़े गुणे को पछाड़ देता है — लंबी दौड़ में घातें आधारों से आगे निकलती हैं।",
          mr: "2¹⁰ = 1024 तर 10² = 100: लहान पायावरची मोठी घात 924 ने जिंकते. पुनःपुन्हाची दुप्पट एका मोठ्या गुणाकाराला मागे टाकते — दूरच्या शर्यतीत घाती पायांना हरवतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A sheet of paper is folded in half 6 times. How many layers does it have?",
          hi: "एक काग़ज़ को 6 बार आधा मोड़ा जाता है। उसमें कितनी परतें होंगी?",
          mr: "एक कागद 6 वेळा अर्धा दुमडला जातो. त्यात किती थर होतील?",
        },
        answer: 64,
        wrong: [12, 32, 6],
        checkExpr: "2*2*2*2*2*2",
        solution: {
          en: "Each fold DOUBLES the stack: 2⁶ = 64 layers. 12 adds 2 six times — folding multiplies, never adds; 32 miscounts one fold.",
          hi: "हर मोड़ गड्डी दुगुनी करता है: 2⁶ = 64 परतें। 12 छह बार 2 जोड़ता है — मोड़ना गुणा करता है, जोड़ नहीं; 32 एक मोड़ कम गिनता है।",
          mr: "प्रत्येक घडी थप्पी दुप्पट करते: 2⁶ = 64 थर. 12 सहा वेळा 2 जोडतो — दुमडणे गुणते, जोडत नाही; 32 एक घडी कमी मोजतो.",
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
          en: "A lily patch on a pond DOUBLES every day and covers the whole pond on day 30. On which day was the pond half covered?",
          hi: "तालाब पर कुमुदिनी का फैलाव रोज़ दुगुना होता है और 30वें दिन पूरा तालाब ढक जाता है। तालाब आधा किस दिन ढका था?",
          mr: "तळ्यावरील कमळांचा पसारा रोज दुप्पट होतो आणि 30 व्या दिवशी सारे तळे झाकतो. तळे अर्धे कोणत्या दिवशी झाकले होते?",
        },
        answer: 29,
        wrong: [15, 28, 24],
        checkExpr: "30-1",
        solution: {
          en: "One doubling before full is half: day 29. 15 halves the TIME — but doubling growth doesn't walk in straight lines; it spends 29 days quiet and one day loud.",
          hi: "पूरे से एक दुगुना पहले यानी आधा: दिन 29। 15 समय को आधा करता है — पर दुगुनी बढ़त सीधी रेखा में नहीं चलती; वह 29 दिन चुप रहती है और एक दिन में गरजती है।",
          mr: "पूर्णाच्या एक दुप्पट आधी म्हणजे अर्धे: दिवस 29. 15 वेळ निम्मी करतो — पण दुप्पट वाढ सरळ रेषेत चालत नाही; ती 29 दिवस गप्प राहते आणि एका दिवसात गर्जते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Grains on a chessboard: 1 on the first square, doubling on each square after. How many grains sit on the 8th square alone?",
          hi: "शतरंज की बिसात पर दाने: पहले ख़ाने में 1, फिर हर ख़ाने में दुगुने। अकेले 8वें ख़ाने में कितने दाने?",
          mr: "बुद्धिबळाच्या पटावरील दाणे: पहिल्या घरात 1, मग प्रत्येक घरात दुप्पट. एकट्या 8 व्या घरात किती दाणे?",
        },
        answer: 128,
        wrong: [256, 64, 16],
        checkExpr: "2*2*2*2*2*2*2",
        solution: {
          en: "Square n holds 2ⁿ⁻¹, so the 8th holds 2⁷ = 128. 256 doubles once too many — the FIRST square already used up 2⁰; the legend's whole board ends near 2⁶⁴, past all the world's grain.",
          hi: "ख़ाना n रखता है 2ⁿ⁻¹, अतः 8वाँ रखता है 2⁷ = 128। 256 एक दुगुना ज़्यादा है — पहला ख़ाना 2⁰ पहले ही ख़र्च कर चुका; किंवदंती की पूरी बिसात 2⁶⁴ के पास जाकर दुनिया भर के अनाज से आगे निकल जाती है।",
          mr: "घर n मध्ये 2ⁿ⁻¹, म्हणून 8 व्यात 2⁷ = 128. 256 एक दुप्पट जास्त — पहिल्या घराने 2⁰ आधीच खर्चले; दंतकथेचा सारा पट 2⁶⁴ जवळ जाऊन जगभरच्या धान्याला मागे टाकतो.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 13 — Exponents and Powers",
      name: "Exponents and Powers",
      slug: "maths-7-exponents-and-powers",
      summary:
        "Repeated multiplication compressed: laws that add, subtract and multiply exponents, standard form for the Sun's distance — and a lily pond quiet for 29 days.",
      position: 13,
      translations: {
        hi: {
          name: "घातांक और घात",
          summary:
            "बार-बार का गुणा सिमटा हुआ: घातें जोड़ने-घटाने-गुणने के नियम, सूर्य की दूरी का मानक रूप — और 29 दिन चुप रहने वाला कुमुदिनी का तालाब।",
        },
        mr: {
          name: "घातांक आणि घात",
          summary:
            "पुनःपुन्हाचा गुणाकार आवळलेला: घाती जोडण्या-वजा करण्या-गुणण्याचे नियम, सूर्याच्या अंतराचे प्रमाण रूप — आणि 29 दिवस गप्प राहणारे कमळांचे तळे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 14 — Symmetry (lines AND turns, with a peek at solids)            */
/* ------------------------------------------------------------------------- */
function symmetry(): TopicFileOut {
  const rand = rng("maths-7-symmetry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many lines of symmetry does a square have?",
          hi: "वर्ग में सममिति की कितनी रेखाएँ होती हैं?",
          mr: "चौरसाला सममितीच्या किती रेषा असतात?",
        },
        answer: 4,
        wrong: [2, 8, 1],
        solution: {
          en: "Two through the midpoints of opposite sides and two through the diagonals: 4. 2 forgets the diagonals — the square is generous with mirrors.",
          hi: "दो सम्मुख भुजाओं के मध्य-बिंदुओं से और दो विकर्णों से: 4। 2 विकर्ण भूल जाता है — वर्ग दर्पणों में उदार है।",
          mr: "दोन समोरच्या बाजूंच्या मध्यबिंदूंतून आणि दोन कर्णांतून: 4. 2 कर्ण विसरतो — चौरस आरशांत उदार आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the order of rotational symmetry of a square?",
          hi: "वर्ग की घूर्णन सममिति की कोटि क्या है?",
          mr: "चौरसाच्या परिवलन सममितीची कोटी किती?",
        },
        answer: 4,
        wrong: [1, 2, 8],
        solution: {
          en: "Quarter turns of 90° land it on itself 4 times in a full spin: order 4. 8 confuses turns with the mirror count doubled.",
          hi: "90° के चौथाई घुमाव पूरे चक्कर में 4 बार उसे स्वयं पर बैठाते हैं: कोटि 4। 8 घुमावों को दर्पण-गिनती के दुगुने से मिला बैठता है।",
          mr: "90° ची पाव वळणे पूर्ण फेरीत 4 वेळा त्याला स्वतःवर बसवतात: कोटी 4. 8 वळणांना आरसा-मोजणीच्या दुप्पटीशी गल्लत करतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many lines of symmetry does a rectangle (that is not a square) have?",
          hi: "आयत (जो वर्ग नहीं है) में सममिति की कितनी रेखाएँ?",
          mr: "(चौरस नसलेल्या) आयताला सममितीच्या किती रेषा?",
        },
        answer: 2,
        wrong: [4, 1, 0],
        solution: {
          en: "Only the two midpoint lines: 2. 4 adds the diagonals — but fold a rectangle along a diagonal and the corners betray you; the halves do NOT cover each other.",
          hi: "केवल दोनों मध्य-रेखाएँ: 2। 4 विकर्ण जोड़ देता है — पर आयत को विकर्ण पर मोड़िए तो कोने धोखा दे देते हैं; आधे एक-दूसरे को ढकते नहीं।",
          mr: "फक्त दोन मध्य-रेषा: 2. 4 कर्ण मिळवतो — पण आयत कर्णावर दुमडा आणि कोपरे दगा देतात; अर्धे एकमेकांना झाकत नाहीत.",
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
          en: "What is the order of rotational symmetry of the letter H?",
          hi: "अक्षर H की घूर्णन सममिति की कोटि क्या है?",
          mr: "H अक्षराच्या परिवलन सममितीची कोटी किती?",
        },
        answer: 2,
        wrong: [1, 4, 0],
        solution: {
          en: "A half turn of 180° maps H onto itself, and so does the full turn: order 2. Order 1 would mean ONLY the full turn works — true for letters like F, not H.",
          hi: "180° का आधा घुमाव H को स्वयं पर बैठा देता है, और पूरा चक्कर भी: कोटि 2। कोटि 1 का अर्थ होता कि केवल पूरा चक्कर चले — वह F जैसे अक्षरों का हाल है, H का नहीं।",
          mr: "180° चे अर्धे वळण H ला स्वतःवर बसवते, आणि पूर्ण फेरीही: कोटी 2. कोटी 1 म्हणजे फक्त पूर्ण फेरी चालेल — ते F सारख्या अक्षरांचे, H चे नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the order of rotational symmetry of an equilateral triangle?",
          hi: "समबाहु त्रिभुज की घूर्णन सममिति की कोटि क्या है?",
          mr: "समभुज त्रिकोणाच्या परिवलन सममितीची कोटी किती?",
        },
        answer: 3,
        wrong: [1, 2, 6],
        solution: {
          en: "Turns of 120° fit it onto itself 3 times per full spin: order 3. 6 belongs to the regular hexagon; the triangle has three seats, not six.",
          hi: "120° के घुमाव पूरे चक्कर में 3 बार उसे स्वयं पर बैठाते हैं: कोटि 3। 6 सम षट्भुज का है; त्रिभुज के पास तीन आसन हैं, छह नहीं।",
          mr: "120° ची वळणे पूर्ण फेरीत 3 वेळा त्याला स्वतःवर बसवतात: कोटी 3. 6 समषट्कोनाचा; त्रिकोणाकडे तीन आसने, सहा नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Through how many degrees must a regular hexagon turn before it FIRST looks the same again?",
          hi: "सम षट्भुज को कितने डिग्री घुमाने पर वह पहली बार फिर वैसा ही दिखेगा?",
          mr: "समषट्कोनाला किती अंश फिरवल्यावर तो पहिल्यांदा पुन्हा तसाच दिसेल?",
        },
        answer: 60,
        wrong: [120, 90, 45],
        checkExpr: "360/6",
        fmt: deg,
        solution: {
          en: "The full turn shares among 6 matching positions: 360 ÷ 6 = 60°. 120 skips a seat; 90 belongs to the square's family.",
          hi: "पूरा चक्कर 6 मेल खाती स्थितियों में बँटता है: 360 ÷ 6 = 60°। 120 एक आसन लाँघ जाता है; 90 वर्ग के परिवार का है।",
          mr: "पूर्ण फेरी 6 जुळणाऱ्या स्थितींत वाटली जाते: 360 ÷ 6 = 60°. 120 एक आसन ओलांडतो; 90 चौरसाच्या कुटुंबाचा.",
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
          en: "The letter S has rotational symmetry of order 2 — yet how many LINES of symmetry does it have?",
          hi: "अक्षर S की घूर्णन सममिति की कोटि 2 है — फिर भी उसमें सममिति की कितनी रेखाएँ हैं?",
          mr: "S अक्षराची परिवलन सममितीची कोटी 2 आहे — तरी त्याला सममितीच्या किती रेषा आहेत?",
        },
        answer: 0,
        wrong: [1, 2, 4],
        solution: {
          en: "None: 0. Every mirror flips S into a backwards S. Turning symmetry and mirror symmetry are DIFFERENT gifts — S has one and not the other.",
          hi: "कोई नहीं: 0। हर दर्पण S को उल्टा S बना देता है। घूर्णन सममिति और दर्पण सममिति अलग-अलग वरदान हैं — S के पास एक है, दूसरा नहीं।",
          mr: "एकही नाही: 0. प्रत्येक आरसा S ला उलटे S करतो. वळण-सममिती आणि आरसा-सममिती या वेगळ्या देणग्या — S कडे एक आहे, दुसरी नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A regular polygon has exactly 9 lines of symmetry. How many sides does it have?",
          hi: "एक सम बहुभुज में ठीक 9 सममिति-रेखाएँ हैं। उसकी कितनी भुजाएँ हैं?",
          mr: "एका नियमित बहुभुजाला नेमक्या 9 सममिती-रेषा आहेत. त्याला किती बाजू आहेत?",
        },
        answer: 9,
        wrong: [18, 3, 6],
        solution: {
          en: "A regular n-gon carries exactly n mirror lines, so 9 lines mean 9 sides — a regular nonagon. 18 doubles, imagining a line per side AND per corner; each line already serves one of each.",
          hi: "सम n-भुज में ठीक n दर्पण-रेखाएँ होती हैं, अतः 9 रेखाएँ यानी 9 भुजाएँ — सम नवभुज। 18 दुगुना कर देता है, हर भुजा और हर कोने की अलग रेखा मानकर; हर रेखा दोनों में से एक-एक सँभालती है।",
          mr: "नियमित n-भुजात नेमक्या n आरसा-रेषा असतात, म्हणून 9 रेषा म्हणजे 9 बाजू — नियमित नवभुज. 18 दुप्पट करतो, प्रत्येक बाजूची आणि कोपऱ्याची वेगळी रेषा मानून; प्रत्येक रेषा दोन्हींतले एक-एक सांभाळते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A design has rotational symmetry of order 5. What is its smallest angle of rotation?",
          hi: "एक डिज़ाइन की घूर्णन सममिति की कोटि 5 है। उसका सबसे छोटा घूर्णन कोण कितना?",
          mr: "एका नक्षीची परिवलन सममितीची कोटी 5 आहे. तिचा सर्वांत लहान परिवलन कोन किती?",
        },
        answer: 72,
        wrong: [60, 90, 144],
        checkExpr: "360/5",
        fmt: deg,
        solution: {
          en: "360 ÷ 5 = 72°. 144 is the SECOND landing, two steps in one; 60 and 90 belong to orders 6 and 4.",
          hi: "360 ÷ 5 = 72°। 144 दूसरी बैठक है, एक में दो क़दम; 60 और 90 कोटि 6 और 4 के हैं।",
          mr: "360 ÷ 5 = 72°. 144 ही दुसरी बैठक, एकात दोन पावले; 60 आणि 90 कोटी 6 व 4 चे.",
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
          en: "A shape looks unchanged after every 45° turn. What is its order of rotational symmetry?",
          hi: "एक आकृति हर 45° घुमाव के बाद अपरिवर्तित दिखती है। उसकी घूर्णन सममिति की कोटि क्या है?",
          mr: "एक आकृती प्रत्येक 45° वळणानंतर जशीच्या तशी दिसते. तिच्या परिवलन सममितीची कोटी किती?",
        },
        answer: 8,
        wrong: [4, 45, 6],
        checkExpr: "360/45",
        solution: {
          en: "Order = 360 ÷ angle = 360 ÷ 45 = 8 matching positions. 45 repeats the angle as if it were the count; the two multiply back to 360, they are never equal by accident.",
          hi: "कोटि = 360 ÷ कोण = 360 ÷ 45 = 8 मेल खाती स्थितियाँ। 45 कोण को ही गिनती मान लेता है; दोनों गुणा होकर 360 बनते हैं, संयोग से बराबर नहीं होते।",
          mr: "कोटी = 360 ÷ कोन = 360 ÷ 45 = 8 जुळणाऱ्या स्थिती. 45 कोनालाच मोजणी मानतो; दोघे गुणून 360 होतात, योगायोगाने समान होत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A rhombus that is not a square: how many lines of symmetry does it have?",
          hi: "वह समचतुर्भुज जो वर्ग नहीं है: उसमें कितनी सममिति-रेखाएँ?",
          mr: "चौरस नसलेला समभुज चौकोन: त्याला किती सममिती-रेषा?",
        },
        answer: 2,
        wrong: [4, 0, 1],
        solution: {
          en: "Its 2 diagonals — and ONLY those. The midpoint lines that serve the rectangle fail here, and the diagonal lines that fail the rectangle work here: the two shapes split the square's four mirrors between them.",
          hi: "उसके 2 विकर्ण — और केवल वही। आयत की मध्य-रेखाएँ यहाँ विफल हैं, और आयत में विफल विकर्ण यहाँ चलते हैं: दोनों आकृतियाँ वर्ग के चार दर्पण आपस में बाँट लेती हैं।",
          mr: "त्याचे 2 कर्ण — आणि फक्त तेच. आयताला चालणाऱ्या मध्य-रेषा इथे फसतात, आणि आयतात फसणारे कर्ण इथे चालतात: दोन आकृती चौरसाचे चार आरसे आपसांत वाटून घेतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many lines of symmetry does a semicircle have?",
          hi: "अर्धवृत्त में सममिति की कितनी रेखाएँ होती हैं?",
          mr: "अर्धवर्तुळाला सममितीच्या किती रेषा असतात?",
        },
        answer: 1,
        wrong: [0, 2, 4],
        solution: {
          en: "Just 1 — the perpendicular through the middle of its flat edge. The full circle's endless mirrors die at the cut; only the one that respects the diameter survives.",
          hi: "बस 1 — सपाट किनारे के बीच से गुज़रता लंब। पूरे वृत्त के अनगिनत दर्पण कटाव पर मर जाते हैं; केवल वही बचता है जो व्यास का मान रखता है।",
          mr: "फक्त 1 — सपाट कडेच्या मधून जाणारा लंब. पूर्ण वर्तुळाचे अगणित आरसे कापावर मरतात; व्यासाचा मान राखणारा एकच टिकतो.",
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
          en: "A figure has rotational symmetry of order 4. After how many degrees does its FIRST repeat occur?",
          hi: "एक आकृति की घूर्णन सममिति की कोटि 4 है। कितने डिग्री बाद उसकी पहली पुनरावृत्ति होती है?",
          mr: "एका आकृतीची परिवलन सममितीची कोटी 4 आहे. किती अंशांनंतर तिची पहिली पुनरावृत्ती होते?",
        },
        answer: 90,
        wrong: [45, 180, 4],
        checkExpr: "360/4",
        fmt: deg,
        solution: {
          en: "360 ÷ 4 = 90°. 180 is the second repeat; 45 would need order 8 — angle and order always multiply back to the full 360.",
          hi: "360 ÷ 4 = 90°। 180 दूसरी पुनरावृत्ति है; 45 के लिए कोटि 8 चाहिए — कोण और कोटि गुणा होकर सदा पूरे 360 बनते हैं।",
          mr: "360 ÷ 4 = 90°. 180 ही दुसरी पुनरावृत्ती; 45 साठी कोटी 8 हवी — कोन आणि कोटी गुणून नेहमी पूर्ण 360 होतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The Ashoka Chakra on the flag has 24 equally spaced spokes. What is the order of its rotational symmetry?",
          hi: "ध्वज के अशोक चक्र में 24 समान दूरी की तीलियाँ हैं। उसकी घूर्णन सममिति की कोटि क्या है?",
          mr: "ध्वजावरील अशोकचक्रात 24 समान अंतराचे आरे आहेत. त्याच्या परिवलन सममितीची कोटी किती?",
        },
        answer: 24,
        wrong: [12, 8, 360],
        solution: {
          en: "Every spoke can take every spoke's place: order 24, one landing per 15° of turn. 12 pairs the spokes up; 360 counts degrees, not positions.",
          hi: "हर तीली हर तीली की जगह ले सकती है: कोटि 24, हर 15° घुमाव पर एक बैठक। 12 तीलियों की जोड़ियाँ बना देता है; 360 स्थितियाँ नहीं, डिग्रियाँ गिनता है।",
          mr: "प्रत्येक आरा प्रत्येक आऱ्याची जागा घेऊ शकतो: कोटी 24, दर 15° वळणाला एक बैठक. 12 आऱ्यांच्या जोड्या करतो; 360 स्थिती नव्हे, अंश मोजतो.",
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
          en: "A rectangle has line symmetry AND rotational symmetry of order 2. What is the smallest rotation, in degrees, that maps it onto itself?",
          hi: "आयत में रेखा सममिति भी है और कोटि 2 की घूर्णन सममिति भी। कितने डिग्री का सबसे छोटा घुमाव उसे स्वयं पर बैठा देता है?",
          mr: "आयताला रेषा-सममितीही आहे आणि कोटी 2 ची परिवलन सममितीही. किती अंशांचे सर्वांत लहान वळण त्याला स्वतःवर बसवते?",
        },
        answer: 180,
        wrong: [90, 360, 45],
        checkExpr: "360/2",
        fmt: deg,
        solution: {
          en: "Order 2 means the half turn: 360 ÷ 2 = 180°. 90 works only when length equals breadth — the quarter turn is the SQUARE's private privilege, lost the moment the sides disagree.",
          hi: "कोटि 2 यानी आधा घुमाव: 360 ÷ 2 = 180°। 90 तभी चलता है जब लंबाई-चौड़ाई बराबर हों — चौथाई घुमाव वर्ग का निजी विशेषाधिकार है, भुजाओं के असहमत होते ही छिन जाता है।",
          mr: "कोटी 2 म्हणजे अर्धे वळण: 360 ÷ 2 = 180°. 90 तेव्हाच चालते जेव्हा लांबी-रुंदी समान — पाव वळण हा चौरसाचा खासगी विशेषाधिकार, बाजू असहमत होताच हिरावला जातो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A cube has 12 edges and 8 vertices. How many FACES does it have?",
          hi: "घन में 12 किनारे और 8 शीर्ष होते हैं। उसके कितने फलक होते हैं?",
          mr: "घनाला 12 कडा आणि 8 शिरोबिंदू असतात. त्याला किती पृष्ठे असतात?",
        },
        answer: 6,
        wrong: [8, 12, 4],
        solution: {
          en: "6 square faces — count them as a dice's sides. And a quiet law hides here: faces + vertices − edges = 6 + 8 − 12 = 2, true for every box, prism and pyramid you will ever build.",
          hi: "6 वर्गाकार फलक — पासे के पहलुओं की तरह गिनिए। और यहाँ एक चुपचाप नियम छिपा है: फलक + शीर्ष − किनारे = 6 + 8 − 12 = 2, हर डिब्बे, प्रिज़्म और पिरामिड के लिए सच जो आप कभी भी बनाएँगे।",
          mr: "6 चौरस पृष्ठे — फाशाच्या बाजूंसारखी मोजा. आणि इथे एक गुपचूप नियम दडला आहे: पृष्ठे + शिरोबिंदू − कडा = 6 + 8 − 12 = 2, तुम्ही कधीही बांधाल त्या प्रत्येक खोक्या, प्रिझम आणि पिरॅमिडसाठी खरा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 7,
      chapter: "Chapter 14 — Symmetry",
      name: "Symmetry",
      slug: "maths-7-symmetry",
      summary:
        "Mirrors and turns told apart: the S with spin but no mirror, the rectangle and rhombus splitting the square's mirrors — and the flag's 24-spoke wheel closing the count.",
      position: 14,
      translations: {
        hi: {
          name: "सममिति",
          summary:
            "दर्पण और घुमाव अलग-अलग परखे: घूमने वाला पर बिना दर्पण का S, वर्ग के दर्पण बाँटते आयत और समचतुर्भुज — और गिनती पूरी करता ध्वज का 24 तीलियों वाला चक्र।",
        },
        mr: {
          name: "सममिती",
          summary:
            "आरसे आणि वळणे वेगळी ओळखली: फिरणारा पण आरसा नसलेला S, चौरसाचे आरसे वाटणारे आयत व समभुज चौकोन — आणि मोजणी पूर्ण करणारे ध्वजाचे 24 आऱ्यांचे चक्र.",
        },
      },
    },
    qs,
  );
}

export const G7_MATHS: TopicFileOut[] = [
  integers(),
  fractionsAndDecimals(),
  dataHandling(),
  simpleEquations(),
  linesAndAngles(),
  triangleProperties(),
  congruence(),
  comparingQuantities(),
  rationalNumbers(),
  practicalGeometry(),
  perimeterAndArea(),
  algebraicExpressions(),
  exponentsAndPowers(),
  symmetry(),
];
