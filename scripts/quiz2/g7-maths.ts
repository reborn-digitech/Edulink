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

export const G7_MATHS: TopicFileOut[] = [
  integers(),
  fractionsAndDecimals(),
  dataHandling(),
  simpleEquations(),
  linesAndAngles(),
];
