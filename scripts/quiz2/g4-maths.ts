/**
 * Class 4 Maths — NCERT "Math Magic", chapter by chapter, same discipline as
 * Class 3: every question authored individually, every computable answer
 * proven by a checkExpr, every wrong option a mistake a real nine-year-old
 * makes — the skipped conversion, the counted fence-post, the extra day.
 *
 * ⚠ The hi/mr text is the author's own, pending a native reader.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ, rupees } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Math Magic (Class 4)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Building with Bricks (rows, walls, brick arithmetic)          */
/* ------------------------------------------------------------------------- */
function buildingWithBricks(): TopicFileOut {
  const rand = rng("maths-4-building-with-bricks");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A brick is a box shape. How many faces does it have to touch and count?",
          hi: "ईंट एक डिब्बे जैसी है। छूकर गिनें तो उसके कितने फलक (सतहें) हैं?",
          mr: "वीट ही खोक्यासारखी असते. हाताने मोजले तर तिला किती पृष्ठे (बाजू) असतात?",
        },
        answer: 6,
        wrong: [4, 8, 12],
        checkExpr: "3*2",
        solution: {
          en: "The faces come in 3 pairs of opposites — top and bottom, the two long sides, the two ends — so 3 × 2 = 6. Counting 8 counts the corners' directions, not the flat faces.",
          hi: "फलक 3 आमने-सामने के जोड़ों में हैं — ऊपर-नीचे, दो लंबे पहलू, दो सिरे — यानी 3 × 2 = 6। 8 गिनना कोनों की दिशाएँ गिनना है, चपटे फलक नहीं।",
          mr: "पृष्ठे 3 समोरासमोरच्या जोड्यांत असतात — वर-खाली, दोन लांब बाजू, दोन टोके — म्हणजे 3 × 2 = 6. 8 मोजणे म्हणजे कोपऱ्यांच्या दिशा मोजणे, सपाट पृष्ठे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "One row of a wall takes 14 bricks. How many bricks do 2 such rows take?",
          hi: "दीवार की एक पंक्ति में 14 ईंटें लगती हैं। ऐसी 2 पंक्तियों में कितनी लगेंगी?",
          mr: "भिंतीच्या एका रांगेला 14 विटा लागतात. अशा 2 रांगांना किती लागतील?",
        },
        answer: 28,
        wrong: [16, 24, 141],
        checkExpr: "14*2",
        solution: {
          en: "Two equal rows are 14 + 14 = 14 × 2 = 28. Answering 16 adds the 2 instead of taking 14 twice.",
          hi: "दो बराबर पंक्तियाँ यानी 14 + 14 = 14 × 2 = 28। 16 कहना 14 को दो बार लेने की जगह 2 जोड़ देना है।",
          mr: "दोन सारख्या रांगा म्हणजे 14 + 14 = 14 × 2 = 28. 16 म्हणणे म्हणजे 14 दोनदा घेण्याऐवजी 2 मिळवणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A row needs 12 bricks. The mason has laid 7. How many more finish the row?",
          hi: "एक पंक्ति को 12 ईंटें चाहिए। राजमिस्त्री 7 लगा चुका है। पंक्ति पूरी करने को और कितनी चाहिए?",
          mr: "एका रांगेला 12 विटा हव्यात. गवंड्याने 7 बसवल्या आहेत. रांग पुरी करायला आणखी किती हव्यात?",
        },
        answer: 5,
        wrong: [4, 6, 19],
        checkExpr: "12-7",
        solution: {
          en: "What remains is 12 − 7 = 5. Saying 19 adds the two numbers, but the 7 bricks are already part of the 12, not extra.",
          hi: "बाक़ी हैं 12 − 7 = 5। 19 कहना दोनों संख्याएँ जोड़ देना है, जबकि 7 ईंटें उन्हीं 12 का हिस्सा हैं, अलग से नहीं।",
          mr: "उरल्या 12 − 7 = 5. 19 म्हणणे म्हणजे दोन्ही संख्या मिळवणे, पण 7 विटा त्या 12 मध्येच आहेत, वेगळ्या नाहीत.",
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
          en: "Each row of a wall has 16 bricks, and the wall is 5 rows tall. How many bricks in the wall?",
          hi: "दीवार की हर पंक्ति में 16 ईंटें हैं, और दीवार 5 पंक्ति ऊँची है। दीवार में कुल कितनी ईंटें?",
          mr: "भिंतीच्या प्रत्येक रांगेत 16 विटा आहेत, आणि भिंत 5 रांगा उंच आहे. भिंतीत एकूण किती विटा?",
        },
        answer: 80,
        wrong: [21, 90, 70],
        checkExpr: "16*5",
        solution: {
          en: "Five rows of 16 each make 16 × 5 = 80. Adding 16 + 5 = 21 mixes up 'rows of bricks' with 'bricks plus rows'.",
          hi: "16-16 की पाँच पंक्तियाँ यानी 16 × 5 = 80। 16 + 5 = 21 करना 'ईंटों की पंक्तियाँ' और 'ईंटें जमा पंक्तियाँ' गड्डमड्ड करना है।",
          mr: "16-16 च्या पाच रांगा म्हणजे 16 × 5 = 80. 16 + 5 = 21 करणे म्हणजे 'विटांच्या रांगा' आणि 'विटा अधिक रांगा' यांची गल्लत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A lorry brought 500 bricks. The masons have used 320. How many bricks are left?",
          hi: "एक ट्रक 500 ईंटें लाया। राजमिस्त्रियों ने 320 लगा दीं। कितनी ईंटें बचीं?",
          mr: "एका ट्रकने 500 विटा आणल्या. गवंड्यांनी 320 वापरल्या. किती विटा उरल्या?",
        },
        answer: 180,
        wrong: [280, 220, 120],
        checkExpr: "500-320",
        solution: {
          en: "Left over is 500 − 320 = 180. Getting 280 forgets to borrow across the tens; 220 subtracts 320 as if it were 280.",
          hi: "बचीं 500 − 320 = 180। 280 आना दहाई का हिसाब चूकना है; 220 ऐसे घटाना है मानो 320 की जगह 280 हो।",
          mr: "उरल्या 500 − 320 = 180. 280 येणे म्हणजे दशकाचा हिशेब चुकणे; 220 म्हणजे 320 ऐवजी 280 वजा केल्यासारखे.",
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
          en: "Bricks are sold by the thousand: 1000 bricks cost ₹1200. What do 2000 bricks cost?",
          hi: "ईंटें हज़ार के भाव बिकती हैं: 1000 ईंटों के ₹1200। 2000 ईंटों के कितने लगेंगे?",
          mr: "विटा हजाराच्या भावाने विकतात: 1000 विटांना ₹1200. 2000 विटांना किती लागतील?",
        },
        answer: 2400,
        wrong: [1400, 2200, 3600],
        checkExpr: "1200*2",
        fmt: rupees,
        solution: {
          en: "Two thousands cost two times ₹1200 = ₹2400. ₹1400 adds ₹200 instead of doubling — twice the bricks means twice the whole price.",
          hi: "दो हज़ार के दाम दो गुना ₹1200 = ₹2400। ₹1400 दुगना करने की जगह ₹200 जोड़ देना है — ईंटें दुगनी तो पूरा दाम दुगना।",
          mr: "दोन हजारांची किंमत दुप्पट ₹1200 = ₹2400. ₹1400 म्हणजे दुप्पट करण्याऐवजी ₹200 मिळवणे — विटा दुप्पट तर सगळी किंमत दुप्पट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Muniya needs 3500 bricks. A trolley carries 500 at a time. How many trolley trips?",
          hi: "मुनिया को 3500 ईंटें चाहिए। ट्रॉली एक बार में 500 लाती है। कितने फेरे लगेंगे?",
          mr: "मुनियाला 3500 विटा हव्यात. ट्रॉली एका वेळी 500 आणते. किती फेऱ्या लागतील?",
        },
        answer: 7,
        wrong: [6, 8, 70],
        checkExpr: "3500/500",
        solution: {
          en: "Count how many 500s sit inside 3500: 3500 ÷ 500 = 7. Answering 70 divides by 50 — one zero slipped away.",
          hi: "3500 में 500 कितनी बार है: 3500 ÷ 500 = 7। 70 कहना 50 से भाग देना है — एक शून्य फिसल गया।",
          mr: "3500 मध्ये 500 किती वेळा: 3500 ÷ 500 = 7. 70 म्हणणे म्हणजे 50 ने भागणे — एक शून्य निसटले.",
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
          en: "A jaali (lattice) row leaves out every 4th brick to make holes. A solid row takes 24 bricks — how many bricks does one jaali row actually use?",
          hi: "जाली की पंक्ति में हर चौथी ईंट छोड़कर झरोखे बनते हैं। ठोस पंक्ति में 24 ईंटें लगतीं — जाली की एक पंक्ति में असल में कितनी लगेंगी?",
          mr: "जाळीच्या रांगेत दर चौथी वीट सोडून झरोके करतात. भरीव रांगेला 24 विटा लागतात — जाळीच्या एका रांगेला प्रत्यक्षात किती लागतील?",
        },
        answer: 18,
        wrong: [20, 16, 6],
        checkExpr: "24-24/4",
        solution: {
          en: "Every 4th of 24 is 24 ÷ 4 = 6 gaps, so bricks laid are 24 − 6 = 18. Answering 6 gives the holes, not the bricks — read what was asked.",
          hi: "24 में हर चौथी यानी 24 ÷ 4 = 6 झरोखे, तो लगीं 24 − 6 = 18 ईंटें। 6 कहना झरोखे बताना है, ईंटें नहीं — सवाल फिर पढ़िए।",
          mr: "24 मध्ये दर चौथी म्हणजे 24 ÷ 4 = 6 झरोके, म्हणून बसल्या 24 − 6 = 18 विटा. 6 म्हणणे म्हणजे झरोके सांगणे, विटा नव्हे — प्रश्न पुन्हा वाचा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A wall is 18 rows tall: the bottom 10 rows take 20 bricks each, the top 8 rows take 15 each. How many bricks in all?",
          hi: "दीवार 18 पंक्ति ऊँची है: नीचे की 10 पंक्तियों में 20-20 ईंटें, ऊपर की 8 में 15-15। कुल कितनी ईंटें?",
          mr: "भिंत 18 रांगा उंच आहे: खालच्या 10 रांगांत 20-20 विटा, वरच्या 8 रांगांत 15-15. एकूण किती विटा?",
        },
        answer: 320,
        wrong: [360, 280, 350],
        checkExpr: "10*20+8*15",
        solution: {
          en: "Bottom: 10 × 20 = 200. Top: 8 × 15 = 120. Together 200 + 120 = 320. Taking all 18 rows at 20 gives 360 — the top rows are thinner and must be counted at their own rate.",
          hi: "नीचे: 10 × 20 = 200। ऊपर: 8 × 15 = 120। मिलाकर 200 + 120 = 320। सभी 18 पंक्तियाँ 20 के भाव लेने से 360 आता है — ऊपर की पंक्तियाँ पतली हैं, उनका हिसाब उनके भाव से होगा।",
          mr: "खाली: 10 × 20 = 200. वर: 8 × 15 = 120. मिळून 200 + 120 = 320. साऱ्या 18 रांगा 20 च्या भावाने घेतल्यास 360 येते — वरच्या रांगा लहान आहेत, त्यांचा हिशेब त्यांच्याच भावाने हवा.",
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
          en: "A mason lays 60 bricks in an hour and works 8 hours a day. In how many days will he lay 2400 bricks?",
          hi: "राजमिस्त्री घंटे में 60 ईंटें लगाता है और दिन में 8 घंटे काम करता है। 2400 ईंटें कितने दिनों में लगाएगा?",
          mr: "गवंडी तासाला 60 विटा बसवतो आणि दिवसाला 8 तास काम करतो. 2400 विटा किती दिवसांत बसवेल?",
        },
        answer: 5,
        wrong: [4, 40, 6],
        checkExpr: "2400/(60*8)",
        solution: {
          en: "One day's work is 60 × 8 = 480 bricks, so 2400 ÷ 480 = 5 days. Getting 40 divides by 60 only — the question asks days, and a day holds 8 of those hours.",
          hi: "एक दिन का काम 60 × 8 = 480 ईंटें, तो 2400 ÷ 480 = 5 दिन। 40 आना केवल 60 से भाग देना है — पूछा दिनों में है, और एक दिन में ऐसे 8 घंटे हैं।",
          mr: "एका दिवसाचे काम 60 × 8 = 480 विटा, म्हणून 2400 ÷ 480 = 5 दिवस. 40 येणे म्हणजे फक्त 60 ने भागणे — विचारले दिवसांत आहे, आणि एका दिवसात असे 8 तास आहेत.",
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
          en: "Meera and Ravi each get 100 bricks. Meera builds a wall of 4 equal rows, Ravi of 5 equal rows. How many fewer bricks sit in one of Ravi's rows than in one of Meera's?",
          hi: "मीरा और रवि को 100-100 ईंटें मिलीं। मीरा 4 बराबर पंक्तियों की दीवार बनाती है, रवि 5 बराबर पंक्तियों की। रवि की एक पंक्ति में मीरा की एक पंक्ति से कितनी ईंटें कम हैं?",
          mr: "मीरा आणि रवीला 100-100 विटा मिळाल्या. मीरा 4 सारख्या रांगांची भिंत बांधते, रवी 5 सारख्या रांगांची. रवीच्या एका रांगेत मीराच्या एका रांगेपेक्षा किती विटा कमी?",
        },
        answer: 5,
        wrong: [1, 25, 20],
        checkExpr: "100/4-100/5",
        solution: {
          en: "Meera's row: 100 ÷ 4 = 25 bricks. Ravi's row: 100 ÷ 5 = 20 bricks. The difference is 25 − 20 = 5. Answering 1 compares the row counts (5 and 4) instead of the rows' bricks — more rows from the same bricks means each row gets thinner.",
          hi: "मीरा की पंक्ति: 100 ÷ 4 = 25 ईंटें। रवि की: 100 ÷ 5 = 20। अंतर 25 − 20 = 5। 1 कहना पंक्तियों की गिनती (5 और 4) का फ़र्क़ लेना है, पंक्ति की ईंटों का नहीं — उतनी ही ईंटों से ज़्यादा पंक्तियाँ बनें तो हर पंक्ति दुबली होगी।",
          mr: "मीराची रांग: 100 ÷ 4 = 25 विटा. रवीची: 100 ÷ 5 = 20. फरक 25 − 20 = 5. 1 म्हणणे म्हणजे रांगांच्या संख्येचा (5 आणि 4) फरक घेणे, रांगेतल्या विटांचा नव्हे — तितक्याच विटांतून जास्त रांगा केल्या की प्रत्येक रांग रोडावते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 1 — Building with Bricks",
      name: "Building with Bricks",
      slug: "maths-4-building-with-bricks",
      summary: "Rows and walls, jaali holes and trolley trips — the arithmetic hiding inside brickwork.",
      position: 1,
      translations: {
        hi: {
          name: "ईंटों से बनी इमारत",
          summary: "पंक्तियाँ और दीवारें, जाली के झरोखे और ट्रॉली के फेरे — ईंट-गारे के भीतर छिपा गणित।",
        },
        mr: {
          name: "विटांची इमारत",
          summary: "रांगा आणि भिंती, जाळीचे झरोके आणि ट्रॉलीच्या फेऱ्या — वीटकामात दडलेले गणित.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Long and Short (centimetres, metres, kilometres)              */
/* ------------------------------------------------------------------------- */
function longAndShort4(): TopicFileOut {
  const rand = rng("maths-4-long-and-short");
  const qs: OutQuestion[] = [];

  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });
  const m = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The metre scale in your classroom is divided into how many centimetre marks?",
          hi: "आपकी कक्षा का मीटर-स्केल कितने सेंटीमीटर के निशानों में बँटा है?",
          mr: "तुमच्या वर्गातली मीटरपट्टी किती सेंटिमीटरच्या खुणांत विभागलेली असते?",
        },
        answer: 100,
        wrong: [10, 1000, 60],
        solution: {
          en: "One metre is 100 centimetres — the metre scale in class shows the hundred little marks. 1000 is the metres in a kilometre, one staircase up.",
          hi: "एक मीटर = 100 सेंटीमीटर — कक्षा का मीटर-स्केल सौ नन्हे निशान दिखाता है। 1000 तो किलोमीटर के मीटर हैं, एक सीढ़ी ऊपर।",
          mr: "एक मीटर = 100 सेंटिमीटर — वर्गातली मीटरपट्टी शंभर बारीक खुणा दाखवते. 1000 हे किलोमीटरमधले मीटर, एक पायरी वर.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A one-metre ribbon is cut into two equal pieces. How long is each piece, in centimetres?",
          hi: "एक मीटर का फ़ीता दो बराबर टुकड़ों में काटा गया। हर टुकड़ा कितने सेंटीमीटर का है?",
          mr: "एक मीटरची फीत दोन सारख्या तुकड्यांत कापली. प्रत्येक तुकडा किती सेंटिमीटरचा?",
        },
        answer: 50,
        wrong: [5, 100, 25],
        checkExpr: "100/2",
        fmt: cm,
        solution: {
          en: "A metre is 100 cm; half of it is 100 ÷ 2 = 50 cm. Saying 5 halves the 10 of 'ten' — the metre carries a hundred, not ten.",
          hi: "मीटर यानी 100 सेमी; उसका आधा 100 ÷ 2 = 50 सेमी। 5 कहना दस का आधा करना है — मीटर में सौ हैं, दस नहीं।",
          mr: "मीटर म्हणजे 100 सेमी; त्याचा अर्धा 100 ÷ 2 = 50 सेमी. 5 म्हणणे म्हणजे दहाचा अर्धा करणे — मीटरमध्ये शंभर आहेत, दहा नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many metres make one kilometre?",
          hi: "एक किलोमीटर में कितने मीटर होते हैं?",
          mr: "एका किलोमीटरमध्ये किती मीटर असतात?",
        },
        answer: 1000,
        wrong: [100, 500, 10000],
        solution: {
          en: "One kilometre is 1000 metres — 'kilo' always means a thousand, in kilometres and kilograms alike. 100 is the centimetres in a metre, one staircase down.",
          hi: "एक किलोमीटर = 1000 मीटर — 'किलो' का अर्थ हमेशा हज़ार, किलोमीटर में भी, किलोग्राम में भी। 100 तो मीटर के सेंटीमीटर हैं, एक सीढ़ी नीचे।",
          mr: "एक किलोमीटर = 1000 मीटर — 'किलो' म्हणजे नेहमी हजार, किलोमीटरमध्येही, किलोग्रॅममध्येही. 100 हे मीटरमधले सेंटिमीटर, एक पायरी खाली.",
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
          en: "A table is 2 metres long. How long is it in centimetres?",
          hi: "एक मेज़ 2 मीटर लंबी है। सेंटीमीटर में उसकी लंबाई कितनी?",
          mr: "एक टेबल 2 मीटर लांब आहे. सेंटिमीटरमध्ये त्याची लांबी किती?",
        },
        answer: 200,
        wrong: [20, 2000, 102],
        checkExpr: "2*100",
        fmt: cm,
        solution: {
          en: "Each metre is 100 cm, so 2 m = 2 × 100 = 200 cm. Writing 20 multiplies by ten — the step from metres to centimetres is a hundred-step.",
          hi: "हर मीटर 100 सेमी, तो 2 मीटर = 2 × 100 = 200 सेमी। 20 लिखना दस से गुणा करना है — मीटर से सेंटीमीटर की सीढ़ी सौ की है।",
          mr: "प्रत्येक मीटर 100 सेमी, म्हणून 2 मीटर = 2 × 100 = 200 सेमी. 20 लिहिणे म्हणजे दहाने गुणणे — मीटरकडून सेंटिमीटरकडची पायरी शंभराची आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Reena's ribbon is 145 cm and Seema's is 128 cm. How much longer is Reena's ribbon?",
          hi: "रीना का फ़ीता 145 सेमी और सीमा का 128 सेमी है। रीना का फ़ीता कितना लंबा ज़्यादा है?",
          mr: "रीनाची फीत 145 सेमी आणि सीमाची 128 सेमी आहे. रीनाची फीत किती जास्त लांब?",
        },
        answer: 17,
        wrong: [23, 27, 273],
        checkExpr: "145-128",
        fmt: cm,
        solution: {
          en: "The difference is 145 − 128 = 17 cm. Getting 23 dodges the borrow: 5 ones cannot give 8 without opening a ten. 273 adds the ribbons instead of comparing them.",
          hi: "अंतर है 145 − 128 = 17 सेमी। 23 आना हासिल से बचना है: 5 इकाई से 8 नहीं घटता जब तक एक दहाई न खोलें। 273 फ़ीतों को जोड़ देता है, तुलना नहीं करता।",
          mr: "फरक 145 − 128 = 17 सेमी. 23 येणे म्हणजे हातचा चुकवणे: एक दशक मोडल्याशिवाय 5 एककांतून 8 जात नाहीत. 273 फिती मिळवते, तुलना करत नाही.",
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
          en: "A school corridor is 25 metres long. Carpets 5 metres long are laid end to end. How many carpets cover it?",
          hi: "स्कूल का बरामदा 25 मीटर लंबा है। 5-5 मीटर के गलीचे सिरे-से-सिरा बिछाए गए। कितने गलीचे लगेंगे?",
          mr: "शाळेचा व्हरांडा 25 मीटर लांब आहे. 5-5 मीटरचे गालिचे टोकाला टोक जोडून अंथरले. किती गालिचे लागतील?",
        },
        answer: 5,
        wrong: [4, 6, 20],
        checkExpr: "25/5",
        solution: {
          en: "How many 5s in 25: 25 ÷ 5 = 5 carpets. 20 subtracts instead of dividing — the carpets repeat along the corridor, they don't take away from it.",
          hi: "25 में 5 कितनी बार: 25 ÷ 5 = 5 गलीचे। 20 भाग की जगह घटाता है — गलीचे बरामदे में दोहराए जाते हैं, उसमें से घटते नहीं।",
          mr: "25 मध्ये 5 किती वेळा: 25 ÷ 5 = 5 गालिचे. 20 भागाकाराऐवजी वजाबाकी करते — गालिचे व्हरांड्यात पुनःपुन्हा येतात, त्यातून वजा होत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A tailor needs 3 m 40 cm of cloth. How much is that in centimetres?",
          hi: "दर्ज़ी को 3 मीटर 40 सेमी कपड़ा चाहिए। यह सेंटीमीटर में कितना है?",
          mr: "शिंप्याला 3 मीटर 40 सेमी कापड हवे. ते सेंटिमीटरमध्ये किती?",
        },
        answer: 340,
        wrong: [304, 3040, 43],
        checkExpr: "3*100+40",
        fmt: cm,
        solution: {
          en: "3 m = 3 × 100 = 300 cm, plus the 40 loose centimetres: 300 + 40 = 340 cm. Writing 304 drops the 40 into the ones place; 43 just glues the digits together.",
          hi: "3 मीटर = 3 × 100 = 300 सेमी, ऊपर से 40 सेमी: 300 + 40 = 340 सेमी। 304 लिखना 40 को इकाई में गिरा देना है; 43 केवल अंक चिपकाना है।",
          mr: "3 मीटर = 3 × 100 = 300 सेमी, शिवाय 40 सेमी: 300 + 40 = 340 सेमी. 304 लिहिणे म्हणजे 40 एककांत पाडणे; 43 म्हणजे नुसते अंक चिकटवणे.",
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
          en: "Amit's school is 750 metres from home. He walks there and back every day. How many metres does he walk daily?",
          hi: "अमित का स्कूल घर से 750 मीटर दूर है। वह रोज़ जाता और लौटता है। रोज़ कितने मीटर चलता है?",
          mr: "अमितची शाळा घरापासून 750 मीटर आहे. तो रोज जातो आणि परततो. रोज किती मीटर चालतो?",
        },
        answer: 1500,
        wrong: [750, 1400, 1050],
        checkExpr: "750*2",
        fmt: m,
        solution: {
          en: "Going and coming doubles the distance: 750 × 2 = 1500 m — that is 1 km and a half. Answering 750 counts only one direction of the walk.",
          hi: "आना-जाना दूरी दुगनी करता है: 750 × 2 = 1500 मीटर — यानी डेढ़ किलोमीटर। 750 कहना केवल एक तरफ़ की गिनती है।",
          mr: "जाणे-येणे अंतर दुप्पट करते: 750 × 2 = 1500 मीटर — म्हणजे दीड किलोमीटर. 750 म्हणणे म्हणजे फक्त एका दिशेची मोजणी.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "On a 1 kilometre race track, Sonu has run 650 metres. How many metres are left?",
          hi: "1 किलोमीटर की दौड़-पट्टी पर सोनू 650 मीटर दौड़ चुका है। कितने मीटर बाक़ी हैं?",
          mr: "1 किलोमीटरच्या धावपट्टीवर सोनू 650 मीटर धावला आहे. किती मीटर उरले?",
        },
        answer: 350,
        wrong: [450, 250, 35],
        checkExpr: "1000-650",
        fmt: m,
        solution: {
          en: "A kilometre is 1000 m, so what remains is 1000 − 650 = 350 m. Getting 450 subtracts from 1100 — the kilometre holds exactly one thousand, not eleven hundred.",
          hi: "किलोमीटर यानी 1000 मीटर, तो बाक़ी 1000 − 650 = 350 मीटर। 450 आना 1100 में से घटाना है — किलोमीटर में ठीक हज़ार होते हैं, ग्यारह सौ नहीं।",
          mr: "किलोमीटर म्हणजे 1000 मीटर, म्हणून उरले 1000 − 650 = 350 मीटर. 450 येणे म्हणजे 1100 मधून वजा करणे — किलोमीटरमध्ये नेमके हजार असतात, अकराशे नव्हे.",
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
          en: "A frog crosses a road 9 m 60 cm wide in equal jumps of 80 cm. How many jumps does it take?",
          hi: "एक मेंढक 9 मीटर 60 सेमी चौड़ी सड़क 80-80 सेमी की बराबर छलाँगों में पार करता है। कितनी छलाँगें लगेंगी?",
          mr: "एक बेडूक 9 मीटर 60 सेमी रुंद रस्ता 80-80 सेमीच्या सारख्या उड्यांत ओलांडतो. किती उड्या लागतील?",
        },
        answer: 12,
        wrong: [11, 13, 120],
        checkExpr: "960/80",
        solution: {
          en: "First make the units agree: 9 m 60 cm = 960 cm. Then 960 ÷ 80 = 12 jumps. Dividing 9.6 by 80 or mixing metres with centimetres is where this one catches people.",
          hi: "पहले इकाइयाँ मिलाइए: 9 मीटर 60 सेमी = 960 सेमी। फिर 960 ÷ 80 = 12 छलाँगें। मीटर और सेंटीमीटर को बिना मिलाए भाग देना — यही इस सवाल का फंदा है।",
          mr: "आधी एकके जुळवा: 9 मीटर 60 सेमी = 960 सेमी. मग 960 ÷ 80 = 12 उड्या. मीटर आणि सेंटिमीटर न जुळवता भागणे — हाच या प्रश्नाचा सापळा.",
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
          en: "Mala's scarf is 90 cm. Gita's scarf is 30 cm shorter than DOUBLE Mala's. How long is Gita's scarf?",
          hi: "माला का दुपट्टा 90 सेमी है। गीता का दुपट्टा माला के दुगने से 30 सेमी छोटा है। गीता का दुपट्टा कितना लंबा है?",
          mr: "मालाची ओढणी 90 सेमी आहे. गीताची ओढणी मालाच्या दुपटीहून 30 सेमी लहान आहे. गीताची ओढणी किती लांब?",
        },
        answer: 150,
        wrong: [60, 120, 210],
        checkExpr: "2*90-30",
        fmt: cm,
        solution: {
          en: "Double Mala's first: 2 × 90 = 180 cm. Then shorter by 30: 180 − 30 = 150 cm. Answering 60 subtracts before doubling — the order of the words is the order of the working.",
          hi: "पहले माला का दुगना: 2 × 90 = 180 सेमी। फिर 30 छोटा: 180 − 30 = 150 सेमी। 60 कहना दुगना करने से पहले घटाना है — शब्दों का क्रम ही हल का क्रम है।",
          mr: "आधी मालाच्या दुप्पट: 2 × 90 = 180 सेमी. मग 30 ने लहान: 180 − 30 = 150 सेमी. 60 म्हणणे म्हणजे दुप्पट करण्याआधी वजा करणे — शब्दांचा क्रम हाच रीतीचा क्रम.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 2 — Long and Short",
      name: "Long and Short",
      slug: "maths-4-long-and-short",
      summary: "Centimetres, metres and kilometres — measuring, converting and comparing lengths that a walk or a frog-jump can check.",
      position: 2,
      translations: {
        hi: {
          name: "लंबा और छोटा",
          summary: "सेंटीमीटर, मीटर और किलोमीटर — लंबाइयाँ नापना, बदलना और मिलाना, जिन्हें एक सैर या मेंढक की छलाँग परख सकती है।",
        },
        mr: {
          name: "लांब आणि आखूड",
          summary: "सेंटिमीटर, मीटर आणि किलोमीटर — लांबी मोजणे, बदलणे आणि ताडणे, जे एखादी फेरी वा बेडकाची उडी पडताळू शकते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Tick-Tick-Tick (clocks, durations, the calendar)              */
/* ------------------------------------------------------------------------- */
function tickTickTick(): TopicFileOut {
  const rand = rng("maths-4-tick-tick-tick");
  const qs: OutQuestion[] = [];

  const mins = (n: number) => ({ en: `${n} minutes`, hi: `${n} मिनट`, mr: `${n} मिनिटे` });
  const hrs = (n: number) => ({ en: `${n} hours`, hi: `${n} घंटे`, mr: `${n} तास` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many minutes make one hour?",
          hi: "एक घंटे में कितने मिनट होते हैं?",
          mr: "एका तासात किती मिनिटे असतात?",
        },
        answer: 60,
        wrong: [100, 30, 24],
        solution: {
          en: "One hour is 60 minutes — the long hand's full round. 100 borrows from money-counting; clocks count in sixties.",
          hi: "एक घंटा = 60 मिनट — बड़ी सुई का पूरा चक्कर। 100 पैसों की गिनती से आया है; घड़ी साठ के हिसाब से चलती है।",
          mr: "एक तास = 60 मिनिटे — मोठ्या काट्याची पूर्ण फेरी. 100 हे पैशांच्या मोजणीतून आले; घड्याळ साठच्या हिशेबाने चालते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many hours make one full day, from one midnight to the next?",
          hi: "एक आधी रात से अगली आधी रात तक, पूरे दिन में कितने घंटे होते हैं?",
          mr: "एका मध्यरात्रीपासून पुढच्या मध्यरात्रीपर्यंत, पूर्ण दिवसात किती तास असतात?",
        },
        answer: 24,
        wrong: [12, 60, 30],
        solution: {
          en: "A full day is 24 hours. The clock face shows only 12, so its hands go round twice in a day — 12 is half the story.",
          hi: "पूरा दिन 24 घंटे का है। घड़ी का चेहरा केवल 12 दिखाता है, इसलिए सुइयाँ दिन में दो चक्कर लगाती हैं — 12 आधी कहानी है।",
          mr: "पूर्ण दिवस 24 तासांचा. घड्याळाचे तोंड फक्त 12 दाखवते, म्हणून काटे दिवसात दोन फेऱ्या मारतात — 12 ही अर्धी गोष्ट आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The long hand moved from 12 to 6 — half the clock face. How many minutes passed?",
          hi: "बड़ी सुई 12 से 6 पर आई — घड़ी का आधा चेहरा। कितने मिनट बीते?",
          mr: "मोठा काटा 12 वरून 6 वर आला — घड्याळाचे अर्धे तोंड. किती मिनिटे गेली?",
        },
        answer: 30,
        wrong: [6, 15, 45],
        checkExpr: "6*5",
        solution: {
          en: "Each number on the face is 5 minutes for the long hand: 6 numbers × 5 = 30 minutes, half an hour. Saying 6 reads the number the hand points at, not the minutes it crossed.",
          hi: "चेहरे का हर अंक बड़ी सुई के लिए 5 मिनट है: 6 अंक × 5 = 30 मिनट, आधा घंटा। 6 कहना वह अंक पढ़ना है जिस पर सुई है, बीते मिनट नहीं।",
          mr: "तोंडावरचा प्रत्येक आकडा मोठ्या काट्यासाठी 5 मिनिटे: 6 आकडे × 5 = 30 मिनिटे, अर्धा तास. 6 म्हणणे म्हणजे काटा दाखवतो तो आकडा वाचणे, गेलेली मिनिटे नव्हे.",
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
          en: "School starts at 7:30 in the morning and ends at 12:30. How many hours is the school day?",
          hi: "स्कूल सुबह 7:30 बजे लगता है और 12:30 बजे छूटता है। स्कूल का दिन कितने घंटे का है?",
          mr: "शाळा सकाळी 7:30 ला भरते आणि 12:30 ला सुटते. शाळेचा दिवस किती तासांचा?",
        },
        answer: 5,
        wrong: [4, 6, 19],
        checkExpr: "12-7",
        fmt: hrs,
        solution: {
          en: "The minutes match (both :30), so count whole hours: 7:30 → 8:30 → 9:30 → 10:30 → 11:30 → 12:30 is 5 steps. 19 subtracts 12 − 7 backwards through the clock's noon.",
          hi: "मिनट बराबर हैं (दोनों :30), तो पूरे घंटे गिनिए: 7:30 → 8:30 → 9:30 → 10:30 → 11:30 → 12:30 — 5 सीढ़ियाँ। 19 आना घड़ी की दोपहर के आर-पार उल्टा घटाना है।",
          mr: "मिनिटे सारखी आहेत (दोन्ही :30), म्हणून पूर्ण तास मोजा: 7:30 → 8:30 → 9:30 → 10:30 → 11:30 → 12:30 — 5 पायऱ्या. 19 येणे म्हणजे घड्याळाच्या दुपारपलीकडे उलटे वजा करणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Grandmother says she will rest for half an hour. How many minutes is that?",
          hi: "दादी कहती हैं कि वे आधा घंटा आराम करेंगी। यह कितने मिनट हुए?",
          mr: "आजी म्हणते ती अर्धा तास विश्रांती घेईल. ती किती मिनिटे?",
        },
        answer: 30,
        wrong: [50, 15, 60],
        checkExpr: "60/2",
        fmt: mins,
        solution: {
          en: "Half of an hour's 60 minutes: 60 ÷ 2 = 30. Saying 50 halves a hundred — the hour never had a hundred minutes to halve.",
          hi: "घंटे के 60 मिनट का आधा: 60 ÷ 2 = 30। 50 कहना सौ का आधा करना है — घंटे में सौ मिनट थे ही नहीं।",
          mr: "तासाच्या 60 मिनिटांचा अर्धा: 60 ÷ 2 = 30. 50 म्हणणे म्हणजे शंभराचा अर्धा — तासात शंभर मिनिटे नव्हतीच.",
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
          en: "It is 4:20. How many minutes until 5 o'clock?",
          hi: "अभी 4:20 बजे हैं। 5 बजने में कितने मिनट बाक़ी हैं?",
          mr: "आता 4:20 वाजले आहेत. 5 वाजायला किती मिनिटे उरली?",
        },
        answer: 40,
        wrong: [20, 30, 50],
        checkExpr: "60-20",
        fmt: mins,
        solution: {
          en: "The hour completes at 60 minutes: 60 − 20 = 40 minutes to go. Answering 20 reads the minutes already passed, not the ones remaining.",
          hi: "घंटा 60 मिनट पर पूरा होता है: 60 − 20 = 40 मिनट बाक़ी। 20 कहना बीते मिनट पढ़ना है, बचे हुए नहीं।",
          mr: "तास 60 मिनिटांवर पूर्ण होतो: 60 − 20 = 40 मिनिटे बाकी. 20 म्हणणे म्हणजे गेलेली मिनिटे वाचणे, उरलेली नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A diya burns for a quarter of an hour. For how many minutes does it burn?",
          hi: "एक दीया चौथाई घंटा जलता है। वह कितने मिनट जलता है?",
          mr: "एक पणती पाव तास जळते. ती किती मिनिटे जळते?",
        },
        answer: 15,
        wrong: [25, 4, 45],
        checkExpr: "60/4",
        fmt: mins,
        solution: {
          en: "A quarter of 60 minutes is 60 ÷ 4 = 15. Saying 25 quarters a hundred; 45 is three quarters — the diya got only one.",
          hi: "60 मिनट की चौथाई 60 ÷ 4 = 15। 25 कहना सौ की चौथाई है; 45 तीन चौथाई है — दीये को एक ही मिली थी।",
          mr: "60 मिनिटांचा पाव 60 ÷ 4 = 15. 25 म्हणणे म्हणजे शंभराचा पाव; 45 म्हणजे पाऊण — पणतीला एकच पाव मिळाला होता.",
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
          en: "Ravi sleeps at 9:30 at night and wakes at 6:30 in the morning. How many hours does he sleep?",
          hi: "रवि रात 9:30 बजे सोता है और सुबह 6:30 बजे उठता है। वह कितने घंटे सोता है?",
          mr: "रवी रात्री 9:30 ला झोपतो आणि सकाळी 6:30 ला उठतो. तो किती तास झोपतो?",
        },
        answer: 9,
        wrong: [8, 10, 3],
        checkExpr: "12-9+6",
        fmt: hrs,
        solution: {
          en: "Split the night at 12: from 9:30 to 12:30 is 3 hours, from 12:30 to 6:30 is 6 more — 3 + 6 = 9 hours. Subtracting 9 − 6 = 3 ignores that midnight restarted the clock.",
          hi: "रात को 12 पर बाँटिए: 9:30 से 12:30 तक 3 घंटे, 12:30 से 6:30 तक 6 और — 3 + 6 = 9 घंटे। 9 − 6 = 3 करना यह भूलना है कि आधी रात को घड़ी नए सिरे से चली।",
          mr: "रात्र 12 वर विभागा: 9:30 ते 12:30 म्हणजे 3 तास, 12:30 ते 6:30 म्हणजे आणखी 6 — 3 + 6 = 9 तास. 9 − 6 = 3 करणे म्हणजे मध्यरात्री घड्याळ नव्याने सुरू झाले हे विसरणे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "This year is a leap year. How many days does its February have?",
          hi: "इस साल अधिवर्ष (लीप ईयर) है। इसकी फ़रवरी में कितने दिन होंगे?",
          mr: "हे वर्ष लीप वर्ष आहे. त्याच्या फेब्रुवारीत किती दिवस असतील?",
        },
        answer: 29,
        wrong: [28, 30, 31],
        solution: {
          en: "February usually has 28 days, but a leap year gives it one more: 29. The extra day comes every fourth year to keep the calendar in step with the Earth's journey round the Sun.",
          hi: "फ़रवरी में आम तौर पर 28 दिन होते हैं, पर अधिवर्ष उसे एक और देता है: 29। यह अतिरिक्त दिन हर चौथे साल आता है, ताकि कैलेंडर पृथ्वी की सूर्य-परिक्रमा के साथ क़दम मिलाए रखे।",
          mr: "फेब्रुवारीत एरवी 28 दिवस असतात, पण लीप वर्ष तिला आणखी एक देते: 29. हा जादा दिवस दर चौथ्या वर्षी येतो, म्हणजे दिनदर्शिका पृथ्वीच्या सूर्यप्रदक्षिणेशी पाऊल जुळवून राहते.",
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
          en: "A doctor sees each patient for 15 minutes, starting at 9:00. How many patients can she see before 12:00?",
          hi: "एक डॉक्टर हर मरीज़ को 15 मिनट देखती हैं, शुरुआत 9:00 बजे। 12:00 बजने से पहले वे कितने मरीज़ देख सकती हैं?",
          mr: "एक डॉक्टर प्रत्येक रुग्णाला 15 मिनिटे तपासते, सुरुवात 9:00 ला. 12:00 च्या आत ती किती रुग्ण तपासू शकते?",
        },
        answer: 12,
        wrong: [9, 15, 4],
        checkExpr: "(12-9)*60/15",
        solution: {
          en: "From 9 to 12 is 3 hours = 3 × 60 = 180 minutes. Each patient takes 15, so 180 ÷ 15 = 12 patients. Answering 4 counts only one hour's worth — there are three hours, four patients each.",
          hi: "9 से 12 तक 3 घंटे = 3 × 60 = 180 मिनट। हर मरीज़ 15 मिनट, तो 180 ÷ 15 = 12 मरीज़। 4 कहना केवल एक घंटे की गिनती है — घंटे तीन हैं, हर घंटे में चार मरीज़।",
          mr: "9 ते 12 म्हणजे 3 तास = 3 × 60 = 180 मिनिटे. प्रत्येक रुग्ण 15 मिनिटे, म्हणून 180 ÷ 15 = 12 रुग्ण. 4 म्हणणे म्हणजे फक्त एका तासाची मोजणी — तास तीन आहेत, दर तासाला चार रुग्ण.",
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
          en: "Dadi's old clock loses 4 minutes every day. It was set right on Monday at 7 am. By Sunday at 7 am — six days later — how many minutes behind is it?",
          hi: "दादी की पुरानी घड़ी रोज़ 4 मिनट पिछड़ती है। सोमवार सुबह 7 बजे उसे ठीक मिलाया गया। रविवार सुबह 7 बजे तक — छह दिन बाद — वह कितने मिनट पीछे होगी?",
          mr: "आजीचे जुने घड्याळ रोज 4 मिनिटे मागे पडते. सोमवारी सकाळी 7 ला ते बरोबर लावले. रविवारी सकाळी 7 पर्यंत — सहा दिवसांनी — ते किती मिनिटे मागे असेल?",
        },
        answer: 24,
        wrong: [28, 20, 4],
        checkExpr: "4*6",
        solution: {
          en: "Monday 7 am to Sunday 7 am is 6 full days, not 7 — count the gaps between days, not the day-names. Losing 4 minutes each day: 4 × 6 = 24 minutes behind. 28 counts seven days because Sunday's name got counted as a day of losing.",
          hi: "सोमवार 7 बजे से रविवार 7 बजे तक 6 पूरे दिन हैं, 7 नहीं — दिनों के नाम नहीं, उनके बीच के अंतराल गिनिए। रोज़ 4 मिनट: 4 × 6 = 24 मिनट पीछे। 28 सात दिन गिनता है, क्योंकि रविवार का नाम भी पिछड़ने का दिन गिन लिया गया।",
          mr: "सोमवार 7 ते रविवार 7 म्हणजे 6 पूर्ण दिवस, 7 नव्हे — दिवसांची नावे नव्हे, त्यांमधली अंतरे मोजा. रोज 4 मिनिटे: 4 × 6 = 24 मिनिटे मागे. 28 सात दिवस मोजते, कारण रविवारचे नावही मागे पडण्याचा दिवस म्हणून धरले गेले.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 4 — Tick-Tick-Tick",
      name: "Tick-Tick-Tick",
      slug: "maths-4-tick-tick-tick",
      summary: "Reading the clock, counting minutes and hours across noon and midnight, and the calendar's odd corners like the leap day.",
      position: 4,
      translations: {
        hi: {
          name: "टिक-टिक-टिक",
          summary: "घड़ी पढ़ना, दोपहर और आधी रात के आर-पार मिनट-घंटे गिनना, और अधिदिन जैसे कैलेंडर के अनोखे कोने।",
        },
        mr: {
          name: "टिक-टिक-टिक",
          summary: "घड्याळ वाचणे, दुपार आणि मध्यरात्रीपलीकडे मिनिटे-तास मोजणे, आणि लीप दिवसासारखे दिनदर्शिकेचे वेगळे कोपरे.",
        },
      },
    },
    qs,
  );
}

export const G4_MATHS: TopicFileOut[] = [buildingWithBricks(), longAndShort4(), tickTickTick()];
