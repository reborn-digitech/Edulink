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

/* ------------------------------------------------------------------------- */
/* Chapter 6 — The Junk Seller (buying, selling, profit and loans)           */
/* ------------------------------------------------------------------------- */
function theJunkSeller(): TopicFileOut {
  const rand = rng("maths-4-the-junk-seller");
  const qs: OutQuestion[] = [];

  const kg = (n: number) => ({ en: `${n} kg`, hi: `${n} किग्रा`, mr: `${n} किलो` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Kiran sells old newspapers at ₹6 per kg. How much do 4 kg fetch?",
          hi: "किरन पुराने अख़बार ₹6 प्रति किलो बेचती है। 4 किलो के कितने मिलेंगे?",
          mr: "किरण जुनी वर्तमानपत्रे ₹6 प्रति किलोने विकते. 4 किलोचे किती मिळतील?",
        },
        answer: 24,
        wrong: [10, 20, 64],
        checkExpr: "6*4",
        fmt: rupees,
        solution: {
          en: "Four kilos at ₹6 each: 6 × 4 = ₹24. ₹10 adds the rate and the weight — a rate multiplies, it does not add.",
          hi: "₹6 के भाव चार किलो: 6 × 4 = ₹24। ₹10 भाव और वज़न को जोड़ देता है — भाव गुणा करता है, जोड़ता नहीं।",
          mr: "₹6 च्या भावाने चार किलो: 6 × 4 = ₹24. ₹10 भाव आणि वजन मिळवते — भाव गुणतो, मिळवत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A customer's junk is worth ₹35. He hands Kiran a ₹50 note. How much change does she return?",
          hi: "एक ग्राहक का कबाड़ ₹35 का है। वह किरन को ₹50 का नोट देता है। वह कितने पैसे लौटाएगी?",
          mr: "एका गिऱ्हाइकाची रद्दी ₹35 ची आहे. तो किरणला ₹50 ची नोट देतो. ती किती पैसे परत करेल?",
        },
        answer: 15,
        wrong: [25, 85, 5],
        checkExpr: "50-35",
        fmt: rupees,
        solution: {
          en: "Change is 50 − 35 = ₹15. Getting 25 subtracts 35 as if it were 25; 85 adds the note to the bill instead of paying it.",
          hi: "बाक़ी 50 − 35 = ₹15। 25 आना 35 को 25 मानकर घटाना है; 85 नोट को बिल में जोड़ देना है, चुकाना नहीं।",
          mr: "उरले 50 − 35 = ₹15. 25 येणे म्हणजे 35 ला 25 समजून वजा करणे; 85 म्हणजे नोट बिलात मिळवणे, चुकवणे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Kiran weighed 25 kg of iron and 15 kg of paper. What weight of junk is that altogether?",
          hi: "किरन ने 25 किलो लोहा और 15 किलो काग़ज़ तौला। कुल कितना कबाड़ हुआ?",
          mr: "किरणने 25 किलो लोखंड आणि 15 किलो कागद तोलले. एकूण किती रद्दी झाली?",
        },
        answer: 40,
        wrong: [10, 30, 50],
        checkExpr: "25+15",
        fmt: kg,
        solution: {
          en: "Together they weigh 25 + 15 = 40 kg. Answering 10 finds the difference — the question piles both heaps on one scale.",
          hi: "दोनों मिलाकर 25 + 15 = 40 किलो। 10 कहना अंतर निकालना है — सवाल दोनों ढेर एक ही तराज़ू पर रखता है।",
          mr: "दोन्ही मिळून 25 + 15 = 40 किलो. 10 म्हणणे म्हणजे फरक काढणे — प्रश्न दोन्ही ढीग एकाच काट्यावर ठेवतो.",
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
          en: "Kiran buys old books at ₹8 per kg and sells them at ₹11 per kg. What does she earn on each kg?",
          hi: "किरन पुरानी किताबें ₹8 प्रति किलो ख़रीदती है और ₹11 प्रति किलो बेचती है। हर किलो पर वह कितना कमाती है?",
          mr: "किरण जुनी पुस्तके ₹8 प्रति किलोने घेते आणि ₹11 प्रति किलोने विकते. दर किलोमागे ती किती कमावते?",
        },
        answer: 3,
        wrong: [19, 8, 11],
        checkExpr: "11-8",
        fmt: rupees,
        solution: {
          en: "Earning per kg is selling minus buying: 11 − 8 = ₹3. ₹19 adds the two prices — money spent cannot join money received.",
          hi: "प्रति किलो कमाई = बेचने का दाम − ख़रीद का दाम: 11 − 8 = ₹3। ₹19 दोनों दाम जोड़ देता है — ख़र्च हुआ पैसा मिले पैसे में नहीं जुड़ता।",
          mr: "दर किलो कमाई = विक्रीचा भाव − खरेदीचा भाव: 11 − 8 = ₹3. ₹19 दोन्ही भाव मिळवते — खर्च झालेला पैसा मिळालेल्या पैशात मिसळत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Kiran needs ₹600 for a new weighing scale and has saved ₹340. How much more must she save?",
          hi: "किरन को नई तराज़ू के लिए ₹600 चाहिए और उसने ₹340 बचाए हैं। उसे और कितने बचाने होंगे?",
          mr: "किरणला नव्या काट्यासाठी ₹600 हवेत आणि तिने ₹340 साठवले आहेत. तिला आणखी किती साठवावे लागतील?",
        },
        answer: 260,
        wrong: [340, 940, 360],
        checkExpr: "600-340",
        fmt: rupees,
        solution: {
          en: "Still needed: 600 − 340 = ₹260. Getting 360 slips on the borrow in the tens; 940 adds her savings to the price she is saving toward.",
          hi: "अभी चाहिए: 600 − 340 = ₹260। 360 आना दहाई के हासिल में फिसलना है; 940 बचत को उसी दाम में जोड़ देता है जिसके लिए बचत हो रही है।",
          mr: "अजून हवेत: 600 − 340 = ₹260. 360 येणे म्हणजे दशकाच्या हातच्यात घसरणे; 940 म्हणजे बचत त्याच किमतीत मिळवणे जिच्यासाठी बचत चालू आहे.",
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
          en: "Old iron sells at ₹12 per kg. What do 9 kg of iron fetch?",
          hi: "पुराना लोहा ₹12 प्रति किलो बिकता है। 9 किलो लोहे के कितने मिलेंगे?",
          mr: "जुने लोखंड ₹12 प्रति किलोने विकले जाते. 9 किलो लोखंडाचे किती मिळतील?",
        },
        answer: 108,
        wrong: [98, 118, 21],
        checkExpr: "12*9",
        fmt: rupees,
        solution: {
          en: "12 × 9 = 108: nine tens are 90 and nine twos are 18, together ₹108. 98 loses one ten in the carry; 21 adds the rate and the weight.",
          hi: "12 × 9 = 108: नौ दहाई 90 और नौ दूनी 18, मिलाकर ₹108। 98 हासिल में एक दहाई खो देता है; 21 भाव और वज़न जोड़ देता है।",
          mr: "12 × 9 = 108: नऊ दशक 90 आणि नऊ दुणे 18, मिळून ₹108. 98 हातच्यात एक दशक हरवते; 21 भाव आणि वजन मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "In a week Kiran collected the same 14 kg of junk on each of 6 working days. How many kg in the week?",
          hi: "एक हफ़्ते में किरन ने 6 कामकाजी दिनों में रोज़ 14 किलो कबाड़ जमा किया। हफ़्ते में कुल कितने किलो?",
          mr: "एका आठवड्यात किरणने 6 कामाच्या दिवसांत रोज 14 किलो रद्दी जमवली. आठवड्यात एकूण किती किलो?",
        },
        answer: 84,
        wrong: [74, 98, 20],
        checkExpr: "14*6",
        fmt: kg,
        solution: {
          en: "Six days of 14 kg: 14 × 6 = 84 kg. 74 drops the carry from 4 × 6; 98 multiplies by 7 — she worked six days, not the whole week.",
          hi: "14-14 किलो के छह दिन: 14 × 6 = 84 किलो। 74 में 4 × 6 का हासिल छूटा; 98 सात से गुणा है — उसने छह दिन काम किया, पूरा हफ़्ता नहीं।",
          mr: "14-14 किलोचे सहा दिवस: 14 × 6 = 84 किलो. 74 मध्ये 4 × 6 चा हातचा सुटला; 98 म्हणजे सातने गुणणे — तिने सहा दिवस काम केले, सबंध आठवडा नव्हे.",
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
          en: "Kiran bought 20 kg of paper at ₹6 per kg and sold all of it at ₹9 per kg. What was her total profit?",
          hi: "किरन ने ₹6 प्रति किलो पर 20 किलो काग़ज़ ख़रीदा और सारा ₹9 प्रति किलो पर बेच दिया। कुल मुनाफ़ा कितना हुआ?",
          mr: "किरणने ₹6 प्रति किलोने 20 किलो कागद घेतला आणि सारा ₹9 प्रति किलोने विकला. एकूण नफा किती झाला?",
        },
        answer: 60,
        wrong: [180, 120, 3],
        checkExpr: "(9-6)*20",
        fmt: rupees,
        solution: {
          en: "Each kg earns 9 − 6 = ₹3, and 20 kg earn 3 × 20 = ₹60. ₹180 is what she received, not what she gained; ₹3 forgets she sold twenty kilos, not one.",
          hi: "हर किलो पर 9 − 6 = ₹3, और 20 किलो पर 3 × 20 = ₹60। ₹180 वह है जो मिला, न कि जो बचा; ₹3 भूलता है कि बीस किलो बिके थे, एक नहीं।",
          mr: "दर किलोमागे 9 − 6 = ₹3, आणि 20 किलोंवर 3 × 20 = ₹60. ₹180 म्हणजे तिला मिळालेले, कमावलेले नव्हे; ₹3 विसरते की वीस किलो विकले, एक नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Kiran took a loan of ₹400 and repays ₹50 every week. After 4 weeks of paying, how much is still left to repay?",
          hi: "किरन ने ₹400 का क़र्ज़ लिया और हर हफ़्ते ₹50 चुकाती है। 4 हफ़्ते चुकाने के बाद कितना बाक़ी रहेगा?",
          mr: "किरणने ₹400 चे कर्ज घेतले आणि दर आठवड्याला ₹50 फेडते. 4 आठवडे फेडल्यावर किती बाकी राहील?",
        },
        answer: 200,
        wrong: [350, 150, 250],
        checkExpr: "400-50*4",
        fmt: rupees,
        solution: {
          en: "Four weeks repay 50 × 4 = ₹200, leaving 400 − 200 = ₹200. ₹350 subtracts only one week — the ₹50 goes out every week, four times over.",
          hi: "चार हफ़्तों में चुके 50 × 4 = ₹200, बचा 400 − 200 = ₹200। ₹350 केवल एक हफ़्ता घटाता है — ₹50 हर हफ़्ते जाता है, चार बार।",
          mr: "चार आठवड्यांत फिटले 50 × 4 = ₹200, उरले 400 − 200 = ₹200. ₹350 फक्त एक आठवडा वजा करते — ₹50 दर आठवड्याला जातात, चार वेळा.",
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
          en: "One morning Kiran bought 12 kg of iron at ₹12 per kg and 8 kg of paper at ₹6 per kg. How much did she pay in all?",
          hi: "एक सुबह किरन ने ₹12 प्रति किलो पर 12 किलो लोहा और ₹6 प्रति किलो पर 8 किलो काग़ज़ ख़रीदा। कुल कितना चुकाया?",
          mr: "एका सकाळी किरणने ₹12 प्रति किलोने 12 किलो लोखंड आणि ₹6 प्रति किलोने 8 किलो कागद घेतला. एकूण किती दिले?",
        },
        answer: 192,
        wrong: [144, 240, 168],
        checkExpr: "12*12+8*6",
        fmt: rupees,
        solution: {
          en: "Iron: 12 × 12 = ₹144. Paper: 8 × 6 = ₹48. Together 144 + 48 = ₹192. ₹144 stops after the iron; ₹240 prices the paper at iron's rate — each junk keeps its own rate.",
          hi: "लोहा: 12 × 12 = ₹144। काग़ज़: 8 × 6 = ₹48। मिलाकर 144 + 48 = ₹192। ₹144 लोहे पर ही रुक जाता है; ₹240 काग़ज़ को लोहे के भाव तौलता है — हर कबाड़ का अपना भाव है।",
          mr: "लोखंड: 12 × 12 = ₹144. कागद: 8 × 6 = ₹48. मिळून 144 + 48 = ₹192. ₹144 लोखंडावरच थांबते; ₹240 कागदाला लोखंडाच्या भावाने तोलते — प्रत्येक रद्दीचा भाव वेगळा.",
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
          en: "A cart costs ₹300 to buy, or ₹10 a week to hire. After how many weeks of hiring would the hire money equal the cart's full price?",
          hi: "एक ठेला ₹300 में मिलता है, या ₹10 प्रति हफ़्ता किराए पर। कितने हफ़्तों के किराए में ठेले की पूरी क़ीमत जितने पैसे चले जाएँगे?",
          mr: "एक हातगाडी ₹300 ला मिळते, किंवा ₹10 प्रति आठवडा भाड्याने. किती आठवड्यांच्या भाड्यात गाडीच्या पूर्ण किमतीइतके पैसे जातील?",
        },
        answer: 30,
        wrong: [3, 20, 40],
        checkExpr: "300/10",
        solution: {
          en: "₹10 a week reaches ₹300 in 300 ÷ 10 = 30 weeks — about seven months, and after that every hired week is money the cart would have saved. Answering 3 divides by 100: one lost zero turns seven months into three weeks.",
          hi: "₹10 प्रति हफ़्ता ₹300 तक 300 ÷ 10 = 30 हफ़्तों में पहुँचता है — क़रीब सात महीने, और उसके बाद किराए का हर हफ़्ता वह पैसा है जो ठेला बचा लेता। 3 कहना 100 से भाग देना है: एक छूटा शून्य सात महीनों को तीन हफ़्ते बना देता है।",
          mr: "₹10 प्रति आठवडा ₹300 पर्यंत 300 ÷ 10 = 30 आठवड्यांत पोहोचतात — सुमारे सात महिने, आणि त्यानंतरचा भाड्याचा प्रत्येक आठवडा म्हणजे गाडीने वाचवला असता तो पैसा. 3 म्हणणे म्हणजे 100 ने भागणे: एक सुटलेले शून्य सात महिन्यांचे तीन आठवडे करते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 6 — The Junk Seller",
      name: "The Junk Seller",
      slug: "maths-4-the-junk-seller",
      summary: "Kiran's junk business — rates per kilo, change and savings, profit on a deal and a loan paid down week by week.",
      position: 6,
      translations: {
        hi: {
          name: "कबाड़ीवाली",
          summary: "किरन का कबाड़ का धंधा — किलो के भाव, बाक़ी और बचत, सौदे का मुनाफ़ा और हफ़्ता-हफ़्ता उतरता क़र्ज़।",
        },
        mr: {
          name: "भंगारवाली",
          summary: "किरणचा भंगाराचा धंदा — किलोचे भाव, उरलेले पैसे आणि बचत, सौद्याचा नफा आणि आठवड्या-आठवड्याने फिटणारे कर्ज.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Jugs and Mugs (millilitres and litres)                        */
/* ------------------------------------------------------------------------- */
function jugsAndMugs4(): TopicFileOut {
  const rand = rng("maths-4-jugs-and-mugs");
  const qs: OutQuestion[] = [];

  const mlF = (n: number) => ({ en: `${n} mL`, hi: `${n} मिली`, mr: `${n} मिली` });
  const litres = (n: number) => ({ en: `${n} litres`, hi: `${n} लीटर`, mr: `${n} लिटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A one-litre milk packet is marked in millilitres. What number does it show?",
          hi: "एक लीटर के दूध के पैकेट पर मिलीलीटर लिखा है। उस पर कौन-सी संख्या होगी?",
          mr: "एक लिटरच्या दुधाच्या पिशवीवर मिलिलिटर लिहिलेले असते. तिच्यावर कोणता आकडा असेल?",
        },
        answer: 1000,
        wrong: [100, 500, 10],
        solution: {
          en: "One litre is 1000 millilitres — 'milli' marks the thousandth part, in millilitres and millimetres alike. 100 belongs to the metre-centimetre staircase, not this one.",
          hi: "एक लीटर = 1000 मिलीलीटर — 'मिली' हज़ारवें हिस्से का निशान है, मिलीलीटर में भी, मिलीमीटर में भी। 100 मीटर-सेंटीमीटर की सीढ़ी का है, इसकी नहीं।",
          mr: "एक लिटर = 1000 मिलिलिटर — 'मिली' हा हजाराव्या भागाचा शिक्का, मिलिलिटरमध्येही, मिलिमीटरमध्येही. 100 हे मीटर-सेंटिमीटरच्या पायरीचे, या पायरीचे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A bottle holds 500 mL. How much do two such bottles hold together?",
          hi: "एक बोतल में 500 मिली आता है। ऐसी दो बोतलों में कुल कितना आएगा?",
          mr: "एका बाटलीत 500 मिली मावते. अशा दोन बाटल्यांत मिळून किती मावेल?",
        },
        answer: 1000,
        wrong: [502, 750, 2500],
        checkExpr: "500*2",
        fmt: mlF,
        solution: {
          en: "Two bottles of 500 mL: 500 × 2 = 1000 mL — exactly one litre. 502 adds the 2 instead of taking 500 twice.",
          hi: "500-500 मिली की दो बोतलें: 500 × 2 = 1000 मिली — ठीक एक लीटर। 502 में 500 को दो बार लेने की जगह 2 जोड़ दिया गया।",
          mr: "500-500 मिलीच्या दोन बाटल्या: 500 × 2 = 1000 मिली — बरोबर एक लिटर. 502 मध्ये 500 दोनदा घेण्याऐवजी 2 मिळवले.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The doctor's spoon holds 5 mL of tonic. How much tonic is two spoonfuls?",
          hi: "डॉक्टर के चम्मच में 5 मिली दवा आती है। दो चम्मच दवा कितनी हुई?",
          mr: "डॉक्टरांच्या चमच्यात 5 मिली औषध मावते. दोन चमचे औषध किती झाले?",
        },
        answer: 10,
        wrong: [7, 25, 52],
        checkExpr: "5*2",
        fmt: mlF,
        solution: {
          en: "Two spoons of 5 mL each: 5 × 2 = 10 mL. 25 squares the five — the second spoon repeats it, it does not multiply it by itself.",
          hi: "5-5 मिली के दो चम्मच: 5 × 2 = 10 मिली। 25 पाँच का वर्ग है — दूसरा चम्मच उसे दोहराता है, अपने से गुणा नहीं करता।",
          mr: "5-5 मिलीचे दोन चमचे: 5 × 2 = 10 मिली. 25 म्हणजे पाचाचा वर्ग — दुसरा चमचा त्याची पुनरावृत्ती करतो, त्याला त्यानेच गुणत नाही.",
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
          en: "A bucket holds 18 litres and a jug holds 3 litres. How many full jugs fill the bucket?",
          hi: "बाल्टी में 18 लीटर और जग में 3 लीटर आता है। बाल्टी भरने में कितने भरे जग लगेंगे?",
          mr: "बादलीत 18 लिटर आणि जगमध्ये 3 लिटर मावते. बादली भरायला किती भरलेले जग लागतील?",
        },
        answer: 6,
        wrong: [5, 7, 15],
        checkExpr: "18/3",
        solution: {
          en: "How many 3s in 18: 18 ÷ 3 = 6 jugs. 15 subtracts one jug instead of asking how many times the jug repeats.",
          hi: "18 में 3 कितनी बार: 18 ÷ 3 = 6 जग। 15 एक जग घटा देता है, यह नहीं पूछता कि जग कितनी बार दोहराया जाएगा।",
          mr: "18 मध्ये 3 किती वेळा: 18 ÷ 3 = 6 जग. 15 एक जग वजा करते, जग किती वेळा भरावा लागेल हे विचारत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Amma bought 2 litres of milk and used 750 mL for kheer. How much milk is left, in mL?",
          hi: "अम्मा 2 लीटर दूध लाईं और खीर में 750 मिली लगा। कितना दूध बचा, मिली में?",
          mr: "आईने 2 लिटर दूध आणले आणि खिरीसाठी 750 मिली वापरले. किती दूध उरले, मिलीमध्ये?",
        },
        answer: 1250,
        wrong: [1350, 250, 1750],
        checkExpr: "2000-750",
        fmt: mlF,
        solution: {
          en: "First 2 L = 2000 mL, then 2000 − 750 = 1250 mL left. Getting 250 subtracts from one litre only — the second litre was standing right there.",
          hi: "पहले 2 लीटर = 2000 मिली, फिर 2000 − 750 = 1250 मिली बचा। 250 आना केवल एक लीटर में से घटाना है — दूसरा लीटर वहीं रखा था।",
          mr: "आधी 2 लिटर = 2000 मिली, मग 2000 − 750 = 1250 मिली उरले. 250 येणे म्हणजे फक्त एका लिटरातून वजा करणे — दुसरे लिटर तिथेच होते.",
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
          en: "A glass holds 250 mL. How many such glasses does one litre of lassi fill?",
          hi: "एक गिलास में 250 मिली आता है। एक लीटर लस्सी से ऐसे कितने गिलास भरेंगे?",
          mr: "एका ग्लासात 250 मिली मावते. एक लिटर लस्सीने असे किती ग्लास भरतील?",
        },
        answer: 4,
        wrong: [3, 5, 40],
        checkExpr: "1000/250",
        solution: {
          en: "A litre is 1000 mL, and 1000 ÷ 250 = 4 glasses. 40 divides by 25 — the glass holds a quarter litre, not a fortieth.",
          hi: "लीटर यानी 1000 मिली, और 1000 ÷ 250 = 4 गिलास। 40 पच्चीस से भाग देना है — गिलास चौथाई लीटर का है, चालीसवें हिस्से का नहीं।",
          mr: "लिटर म्हणजे 1000 मिली, आणि 1000 ÷ 250 = 4 ग्लास. 40 म्हणजे पंचविसाने भागणे — ग्लास पाव लिटरचा आहे, चाळिसाव्या भागाचा नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A water drum of 20 litres is filled with a 4-litre bucket. How many bucket trips fill it?",
          hi: "20 लीटर का ड्रम 4 लीटर की बाल्टी से भरा जाता है। कितने फेरों में भरेगा?",
          mr: "20 लिटरचा ड्रम 4 लिटरच्या बादलीने भरतात. किती फेऱ्यांत भरेल?",
        },
        answer: 5,
        wrong: [4, 6, 16],
        checkExpr: "20/4",
        solution: {
          en: "20 ÷ 4 = 5 trips. 16 subtracts one bucket; the bucket empties into the drum again and again until the 20 is reached.",
          hi: "20 ÷ 4 = 5 फेरे। 16 एक बाल्टी घटाता है; बाल्टी बार-बार ड्रम में उँडेली जाती है, जब तक 20 पूरे न हों।",
          mr: "20 ÷ 4 = 5 फेऱ्या. 16 एक बादली वजा करते; बादली पुन्हा पुन्हा ड्रममध्ये ओतली जाते, 20 पूर्ण होईपर्यंत.",
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
          en: "A cough-syrup bottle holds 120 mL. The dose is 5 mL, twice a day. For how many days does the bottle last?",
          hi: "खाँसी की दवा की बोतल 120 मिली की है। ख़ुराक 5 मिली, दिन में दो बार। बोतल कितने दिन चलेगी?",
          mr: "खोकल्याच्या औषधाची बाटली 120 मिलीची आहे. मात्रा 5 मिली, दिवसातून दोनदा. बाटली किती दिवस पुरेल?",
        },
        answer: 12,
        wrong: [24, 6, 10],
        checkExpr: "120/(5*2)",
        solution: {
          en: "A day uses 5 × 2 = 10 mL, so the bottle lasts 120 ÷ 10 = 12 days. 24 forgets the second daily dose and halves the medicine's honesty.",
          hi: "एक दिन में 5 × 2 = 10 मिली लगती है, तो बोतल 120 ÷ 10 = 12 दिन चलेगी। 24 दूसरी ख़ुराक भूल जाता है — दवा दिन में दो बार जाती है।",
          mr: "एका दिवसात 5 × 2 = 10 मिली लागते, म्हणून बाटली 120 ÷ 10 = 12 दिवस पुरेल. 24 दुसरी मात्रा विसरते — औषध दिवसातून दोनदा जाते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A matka holds 12 litres. In the morning 4 litres are drawn, in the evening 3 more. How much water remains?",
          hi: "मटके में 12 लीटर पानी है। सुबह 4 लीटर निकाला गया, शाम को 3 और। कितना पानी बचा?",
          mr: "माठात 12 लिटर पाणी आहे. सकाळी 4 लिटर काढले, संध्याकाळी आणखी 3. किती पाणी उरले?",
        },
        answer: 5,
        wrong: [8, 9, 7],
        checkExpr: "12-4-3",
        fmt: litres,
        solution: {
          en: "Two drawings leave 12 − 4 − 3 = 5 litres. 8 stops after the morning; 9 subtracts only the evening — both hands dipped into the same matka.",
          hi: "दो बार निकालने पर बचा 12 − 4 − 3 = 5 लीटर। 8 सुबह पर रुक जाता है; 9 केवल शाम घटाता है — दोनों बार उसी मटके से निकला।",
          mr: "दोनदा काढल्यावर उरले 12 − 4 − 3 = 5 लिटर. 8 सकाळवरच थांबते; 9 फक्त संध्याकाळ वजा करते — दोन्ही वेळा त्याच माठातून निघाले.",
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
          en: "A kettle holds 1 litre 250 mL of chai, and another 750 mL is made fresh. How much chai is that altogether, in mL?",
          hi: "केतली में 1 लीटर 250 मिली चाय है, और 750 मिली ताज़ी बनी। कुल चाय कितनी हुई, मिली में?",
          mr: "किटलीत 1 लिटर 250 मिली चहा आहे, आणि आणखी 750 मिली ताजा केला. एकूण चहा किती झाला, मिलीमध्ये?",
        },
        answer: 2000,
        wrong: [1000, 1900, 825],
        checkExpr: "1250+750",
        fmt: mlF,
        solution: {
          en: "1 L 250 mL = 1250 mL, and 1250 + 750 = 2000 mL — two full litres. 1000 adds 250 + 750 and drops the litre that was already in the kettle.",
          hi: "1 लीटर 250 मिली = 1250 मिली, और 1250 + 750 = 2000 मिली — पूरे दो लीटर। 1000 केवल 250 + 750 जोड़ता है और केतली में पहले से रखा लीटर गिरा देता है।",
          mr: "1 लिटर 250 मिली = 1250 मिली, आणि 1250 + 750 = 2000 मिली — पूर्ण दोन लिटर. 1000 फक्त 250 + 750 मिळवते आणि किटलीत आधीच असलेले लिटर गाळते.",
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
          en: "A tap leaks 250 mL every hour. Nobody fixes it for a full day of 24 hours. How many LITRES of water are lost?",
          hi: "एक नल से हर घंटे 250 मिली पानी टपकता है। पूरे 24 घंटे कोई उसे ठीक नहीं करता। कितने लीटर पानी बह गया?",
          mr: "एका नळातून दर तासाला 250 मिली पाणी गळते. पूर्ण 24 तास कोणी ते दुरुस्त करत नाही. किती लिटर पाणी वाया गेले?",
        },
        answer: 6,
        wrong: [24, 4, 60],
        checkExpr: "250*24/1000",
        fmt: litres,
        solution: {
          en: "The day leaks 250 × 24 = 6000 mL, and 6000 ÷ 1000 = 6 litres — six full bottles from one 'small' drip. Answering 24 stops at the hours; 4 remembers only that 250s make a litre in fours and forgets the day is 24 hours long.",
          hi: "दिन भर में टपका 250 × 24 = 6000 मिली, और 6000 ÷ 1000 = 6 लीटर — एक 'ज़रा-से' टपके से छह भरी बोतलें। 24 घंटों पर ही रुक जाता है; 4 को बस इतना याद है कि चार 250 से लीटर बनता है, और भूल जाता है कि दिन 24 घंटे का है।",
          mr: "दिवसभरात गळाले 250 × 24 = 6000 मिली, आणि 6000 ÷ 1000 = 6 लिटर — एका 'जरा' गळक्यातून सहा भरलेल्या बाटल्या. 24 तासांवरच थांबते; 4 ला फक्त चार 250 नी लिटर होते एवढेच आठवते, दिवस 24 तासांचा आहे हे विसरते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 7 — Jugs and Mugs",
      name: "Jugs and Mugs",
      slug: "maths-4-jugs-and-mugs",
      summary: "Millilitres and litres — spoons and glasses, buckets and drums, and what a leaking tap really costs in bottles.",
      position: 7,
      translations: {
        hi: {
          name: "जग और मग",
          summary: "मिलीलीटर और लीटर — चम्मच और गिलास, बाल्टी और ड्रम, और टपकता नल सचमुच कितनी बोतलें बहा देता है।",
        },
        mr: {
          name: "जग आणि मग",
          summary: "मिलिलिटर आणि लिटर — चमचे आणि ग्लास, बादल्या आणि ड्रम, आणि गळका नळ खरोखर किती बाटल्या वाहवतो.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Halves and Quarters (fractions of things, money and measures) */
/* ------------------------------------------------------------------------- */
function halvesAndQuarters(): TopicFileOut {
  const rand = rng("maths-4-halves-and-quarters");
  const qs: OutQuestion[] = [];

  const g = (n: number) => ({ en: `${n} g`, hi: `${n} ग्राम`, mr: `${n} ग्रॅम` });
  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });
  const mlF = (n: number) => ({ en: `${n} mL`, hi: `${n} मिली`, mr: `${n} मिली` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A roti is cut into 4 equal quarters and Rani eats one. How many quarters are left?",
          hi: "एक रोटी 4 बराबर चौथाइयों में कटी और रानी ने एक खा ली। कितनी चौथाइयाँ बचीं?",
          mr: "एक पोळी 4 सारख्या पावांत कापली आणि राणीने एक खाल्ला. किती पाव उरले?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        checkExpr: "4-1",
        solution: {
          en: "Four quarters minus the eaten one: 4 − 1 = 3 quarters — that is three-fourths of the roti still on the plate.",
          hi: "चार चौथाई में से एक खाई: 4 − 1 = 3 चौथाइयाँ — यानी रोटी का तीन-चौथाई अब भी थाली में है।",
          mr: "चार पावांतून एक खाल्ला: 4 − 1 = 3 पाव — म्हणजे पोळीचा पाऊण भाग अजून ताटात आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is half of 8 laddoos?",
          hi: "8 लड्डुओं का आधा कितना है?",
          mr: "8 लाडवांचा अर्धा किती?",
        },
        answer: 4,
        wrong: [2, 6, 16],
        checkExpr: "8/2",
        solution: {
          en: "Half shares into two equal heaps: 8 ÷ 2 = 4 laddoos each. 16 doubles instead of halving — half makes smaller, never bigger.",
          hi: "आधा यानी दो बराबर ढेर: 8 ÷ 2 = 4 लड्डू। 16 आधे की जगह दुगना है — आधा छोटा करता है, बड़ा कभी नहीं।",
          mr: "अर्धा म्हणजे दोन सारखे ढीग: 8 ÷ 2 = 4 लाडू. 16 म्हणजे अर्ध्याऐवजी दुप्पट — अर्धा लहान करतो, मोठा कधीच नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is a quarter of 20 marbles?",
          hi: "20 कंचों की चौथाई कितनी है?",
          mr: "20 गोट्यांचा पाव किती?",
        },
        answer: 5,
        wrong: [4, 10, 15],
        checkExpr: "20/4",
        solution: {
          en: "A quarter shares into four equal heaps: 20 ÷ 4 = 5 marbles. 10 is the half; the quarter halves that half again.",
          hi: "चौथाई यानी चार बराबर ढेर: 20 ÷ 4 = 5 कंचे। 10 आधा है; चौथाई उस आधे का भी आधा है।",
          mr: "पाव म्हणजे चार सारखे ढीग: 20 ÷ 4 = 5 गोट्या. 10 हा अर्धा; पाव त्या अर्ध्याचाही अर्धा.",
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
          en: "Amma gives half of a ₹50 note's worth to each of two children equally. How much does each child get?",
          hi: "अम्मा ₹50 दो बच्चों में बराबर-बराबर बाँटती हैं। हर बच्चे को कितना मिलेगा?",
          mr: "आई ₹50 दोन मुलांत सारखे वाटते. प्रत्येक मुलाला किती मिळतील?",
        },
        answer: 25,
        wrong: [20, 30, 100],
        checkExpr: "50/2",
        fmt: rupees,
        solution: {
          en: "Equal shares of ₹50 between two: 50 ÷ 2 = ₹25 each. ₹20 rounds the half down to a friendlier number the money never agreed to.",
          hi: "₹50 के दो बराबर हिस्से: 50 ÷ 2 = ₹25-₹25। ₹20 आधे को एक 'सुविधाजनक' संख्या पर उतार देता है, जिस पर पैसे कभी राज़ी न थे।",
          mr: "₹50 चे दोन सारखे वाटे: 50 ÷ 2 = ₹25-₹25. ₹20 अर्ध्याला 'सोयीच्या' आकड्यावर आणते, ज्याला पैसे कधी तयार नव्हते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many quarters together make one whole?",
          hi: "कितनी चौथाइयाँ मिलकर एक पूरा बनाती हैं?",
          mr: "किती पाव मिळून एक पूर्ण होते?",
        },
        answer: 4,
        wrong: [2, 3, 8],
        solution: {
          en: "Quarter means a fourth part, so 4 quarters rebuild the whole — like four quarter-rotis making one roti. 2 halves make a whole; quarters need twice as many.",
          hi: "चौथाई यानी चौथा हिस्सा, तो 4 चौथाइयाँ पूरा बना देती हैं — जैसे चार चौथाई-रोटियाँ एक रोटी। 2 से आधे पूरा बनाते हैं; चौथाइयों को दुगनी चाहिए।",
          mr: "पाव म्हणजे चौथा भाग, म्हणून 4 पाव मिळून पूर्ण होते — जसे चार पाव-पोळ्या मिळून एक पोळी. 2 अर्धे पूर्ण करतात; पावांना दुप्पट लागतात.",
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
          en: "Half a litre of milk is how many millilitres?",
          hi: "आधा लीटर दूध कितने मिलीलीटर होता है?",
          mr: "अर्धा लिटर दूध म्हणजे किती मिलिलिटर?",
        },
        answer: 500,
        wrong: [50, 250, 5],
        checkExpr: "1000/2",
        fmt: mlF,
        solution: {
          en: "A litre is 1000 mL, so half is 1000 ÷ 2 = 500 mL. 250 is the quarter litre — the half is twice that.",
          hi: "लीटर यानी 1000 मिली, तो आधा 1000 ÷ 2 = 500 मिली। 250 चौथाई लीटर है — आधा उसका दुगना।",
          mr: "लिटर म्हणजे 1000 मिली, म्हणून अर्धा 1000 ÷ 2 = 500 मिली. 250 म्हणजे पाव लिटर — अर्धा त्याच्या दुप्पट.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The sabziwala weighs a quarter kilo of chillies. How many grams is that?",
          hi: "सब्ज़ीवाला पाव किलो मिर्च तौलता है। यह कितने ग्राम है?",
          mr: "भाजीवाला पाव किलो मिरच्या तोलतो. ते किती ग्रॅम?",
        },
        answer: 250,
        wrong: [25, 400, 750],
        checkExpr: "1000/4",
        fmt: g,
        solution: {
          en: "A kilo is 1000 g, and a quarter of it is 1000 ÷ 4 = 250 g — that is why the small weight on his scale says 250. 750 is three quarters, the part he did NOT weigh.",
          hi: "किलो यानी 1000 ग्राम, उसकी चौथाई 1000 ÷ 4 = 250 ग्राम — इसीलिए तराज़ू का छोटा बाट 250 कहता है। 750 तीन चौथाई है, वह हिस्सा जो तौला नहीं गया।",
          mr: "किलो म्हणजे 1000 ग्रॅम, त्याचा पाव 1000 ÷ 4 = 250 ग्रॅम — म्हणूनच काट्यावरचे लहान वजन 250 सांगते. 750 म्हणजे पाऊण, जो भाग तोललाच नाही.",
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
          en: "A chocolate bar has 12 pieces. Meera eats half of it and her brother eats a quarter of it. How many pieces are left?",
          hi: "चॉकलेट में 12 टुकड़े हैं। मीरा ने उसका आधा खाया और भाई ने चौथाई। कितने टुकड़े बचे?",
          mr: "चॉकलेटमध्ये 12 तुकडे आहेत. मीराने त्यातले अर्धे खाल्ले आणि भावाने पाव. किती तुकडे उरले?",
        },
        answer: 3,
        wrong: [6, 9, 4],
        checkExpr: "12-12/2-12/4",
        solution: {
          en: "Half of 12 is 6, a quarter is 3; eaten together 6 + 3 = 9, leaving 12 − 9 = 3 pieces. Answering 6 stops after Meera; 9 counts what was eaten, not what remains.",
          hi: "12 का आधा 6, चौथाई 3; खाए कुल 6 + 3 = 9, बचे 12 − 9 = 3 टुकड़े। 6 मीरा पर रुक जाता है; 9 खाया हुआ गिनता है, बचा हुआ नहीं।",
          mr: "12 चा अर्धा 6, पाव 3; खाल्ले मिळून 6 + 3 = 9, उरले 12 − 9 = 3 तुकडे. 6 मीरावरच थांबते; 9 खाल्लेले मोजते, उरलेले नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is three quarters of 40 pages?",
          hi: "40 पन्नों का तीन-चौथाई कितना है?",
          mr: "40 पानांचा पाऊण (तीन-चतुर्थांश) किती?",
        },
        answer: 30,
        wrong: [10, 20, 35],
        checkExpr: "40*3/4",
        solution: {
          en: "One quarter of 40 is 10, so three quarters are 10 × 3 = 30 pages. 10 stops at a single quarter — the question asked for three of them.",
          hi: "40 की एक चौथाई 10, तो तीन चौथाई 10 × 3 = 30 पन्ने। 10 एक ही चौथाई पर रुक जाता है — पूछा तीन का था।",
          mr: "40 चा एक पाव 10, म्हणून तीन पाव 10 × 3 = 30 पाने. 10 एकाच पावावर थांबते — विचारले तिघांचे होते.",
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
          en: "What is half of a half of 100?",
          hi: "100 के आधे का आधा कितना है?",
          mr: "100 च्या अर्ध्याचा अर्धा किती?",
        },
        answer: 25,
        wrong: [50, 75, 12],
        checkExpr: "100/2/2",
        solution: {
          en: "Half of 100 is 50, and half of that is 25 — which is exactly a quarter of 100: halving twice IS quartering. 50 stops at the first half.",
          hi: "100 का आधा 50, और उसका आधा 25 — जो ठीक 100 की चौथाई है: दो बार आधा करना ही चौथाई करना है। 50 पहले आधे पर रुक जाता है।",
          mr: "100 चा अर्धा 50, आणि त्याचा अर्धा 25 — जो नेमका 100 चा पाव आहे: दोनदा अर्धे करणे म्हणजेच पाव करणे. 50 पहिल्या अर्ध्यावर थांबते.",
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
          en: "Half of a ribbon went into a gift. Half of what REMAINED went into a braid. Now 30 cm is left. How long was the ribbon at first?",
          hi: "फ़ीते का आधा उपहार में गया। जो बचा उसका आधा चोटी में गया। अब 30 सेमी बचा है। शुरू में फ़ीता कितना लंबा था?",
          mr: "फितीचा अर्धा भाग भेटीत गेला. जे उरले त्याचा अर्धा वेणीत गेला. आता 30 सेमी उरली आहे. सुरुवातीला फीत किती लांब होती?",
        },
        answer: 120,
        wrong: [60, 90, 240],
        checkExpr: "30*4",
        fmt: cm,
        solution: {
          en: "Walk it backwards: the 30 cm left is half of what remained after the gift, so before the braid there were 60 cm; and 60 is half the original, so the ribbon began at 60 × 2 = 120 cm. Half of a half leaves a quarter — 30 × 4 = 120. Answering 60 undoes only one of the two halvings.",
          hi: "उल्टा चलिए: बचा 30 सेमी चोटी से पहले वाले हिस्से का आधा है, तो चोटी से पहले 60 सेमी थे; और 60 मूल का आधा है, तो फ़ीता 60 × 2 = 120 सेमी से शुरू हुआ। आधे का आधा चौथाई छोड़ता है — 30 × 4 = 120। 60 कहना दो में से एक ही आधा खोलना है।",
          mr: "उलटे चला: उरलेले 30 सेमी हे वेणीआधीच्या भागाचा अर्धा, म्हणजे वेणीआधी 60 सेमी होती; आणि 60 ही मूळची अर्धी, म्हणून फीत 60 × 2 = 120 सेमीपासून सुरू झाली. अर्ध्याचा अर्धा पाव उरवतो — 30 × 4 = 120. 60 म्हणणे म्हणजे दोनपैकी एकच अर्धे उलगडणे.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 9 — Halves and Quarters",
      name: "Halves and Quarters",
      slug: "maths-4-halves-and-quarters",
      summary: "Halves, quarters and three-quarters — of rotis and rupees, litres and kilos, and the ribbon puzzle that walks backwards.",
      position: 9,
      translations: {
        hi: {
          name: "आधा और चौथाई",
          summary: "आधा, चौथाई और तीन-चौथाई — रोटियों और रुपयों के, लीटर और किलो के, और वह फ़ीते की पहेली जो उल्टी चलती है।",
        },
        mr: {
          name: "अर्धा आणि पाव",
          summary: "अर्धा, पाव आणि पाऊण — पोळ्यांचे आणि रुपयांचे, लिटर आणि किलोचे, आणि उलटी चालणारी फितीची कोडी.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Tables and Shares (multiplying and sharing out)              */
/* ------------------------------------------------------------------------- */
function tablesAndShares4(): TopicFileOut {
  const rand = rng("maths-4-tables-and-shares");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A cat has 4 legs. How many legs do 7 cats have altogether?",
          hi: "बिल्ली के 4 पैर होते हैं। 7 बिल्लियों के कुल कितने पैर?",
          mr: "मांजरीला 4 पाय असतात. 7 मांजरींचे मिळून किती पाय?",
        },
        answer: 28,
        wrong: [24, 32, 11],
        checkExpr: "7*4",
        solution: {
          en: "Seven cats, 4 legs each: 7 × 4 = 28. Answering 11 adds cats and legs — legs come in fours, so they multiply.",
          hi: "सात बिल्लियाँ, 4-4 पैर: 7 × 4 = 28। 11 कहना बिल्लियाँ और पैर जोड़ना है — पैर चार-चार के गुट में हैं, इसलिए गुणा होंगे।",
          mr: "सात मांजरी, 4-4 पाय: 7 × 4 = 28. 11 म्हणणे म्हणजे मांजरी आणि पाय मिळवणे — पाय चार-चारच्या गटांत आहेत, म्हणून गुणाकार.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The classroom has 6 rows of 5 chairs. How many chairs is that?",
          hi: "कक्षा में 5-5 कुर्सियों की 6 पंक्तियाँ हैं। कुल कितनी कुर्सियाँ?",
          mr: "वर्गात 5-5 खुर्च्यांच्या 6 रांगा आहेत. एकूण किती खुर्च्या?",
        },
        answer: 30,
        wrong: [25, 35, 11],
        checkExpr: "6*5",
        solution: {
          en: "Six rows of five: 6 × 5 = 30 chairs. 25 counts five rows — one row got skipped in the table.",
          hi: "पाँच-पाँच की छह पंक्तियाँ: 6 × 5 = 30 कुर्सियाँ। 25 पाँच पंक्तियाँ गिनता है — पहाड़े में एक पंक्ति छूट गई।",
          mr: "पाच-पाचच्या सहा रांगा: 6 × 5 = 30 खुर्च्या. 25 पाच रांगा मोजते — पाढ्यात एक रांग सुटली.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "18 laddoos are shared equally between 2 sisters. How many does each get?",
          hi: "18 लड्डू 2 बहनों में बराबर बाँटे गए। हर एक को कितने मिले?",
          mr: "18 लाडू 2 बहिणींत सारखे वाटले. प्रत्येकीला किती मिळाले?",
        },
        answer: 9,
        wrong: [8, 16, 36],
        checkExpr: "18/2",
        solution: {
          en: "Equal shares of 18 between two: 18 ÷ 2 = 9 each. 16 takes away 2 instead of splitting into 2 — sharing divides, it does not subtract.",
          hi: "18 के दो बराबर हिस्से: 18 ÷ 2 = 9-9। 16 दो घटा देता है, दो में बाँटता नहीं — बँटवारा भाग है, घटाव नहीं।",
          mr: "18 चे दोन सारखे वाटे: 18 ÷ 2 = 9-9. 16 दोन वजा करते, दोघांत वाटत नाही — वाटणी म्हणजे भागाकार, वजाबाकी नव्हे.",
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
          en: "A packet holds 9 pencils. How many pencils in 8 packets?",
          hi: "एक पैकेट में 9 पेंसिलें हैं। 8 पैकेटों में कितनी पेंसिलें?",
          mr: "एका पाकिटात 9 पेन्सिली आहेत. 8 पाकिटांत किती पेन्सिली?",
        },
        answer: 72,
        wrong: [63, 81, 17],
        checkExpr: "8*9",
        solution: {
          en: "8 × 9 = 72. Both 63 and 81 are its table-neighbours (7 × 9 and 9 × 9) — the eights and nines love to swap in memory.",
          hi: "8 × 9 = 72। 63 और 81 उसके पहाड़े-पड़ोसी हैं (7 × 9 और 9 × 9) — आठ और नौ याद में जगह बदलते रहते हैं।",
          mr: "8 × 9 = 72. 63 आणि 81 हे त्याचे पाढा-शेजारी (7 × 9 आणि 9 × 9) — आठ आणि नऊ स्मरणात जागा बदलत असतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "56 mangoes are packed 8 to a box. How many boxes fill up?",
          hi: "56 आम 8-8 के डिब्बों में भरे गए। कितने डिब्बे भरेंगे?",
          mr: "56 आंबे 8-8 च्या खोक्यांत भरले. किती खोकी भरतील?",
        },
        answer: 7,
        wrong: [6, 8, 48],
        checkExpr: "56/8",
        solution: {
          en: "How many 8s in 56: 56 ÷ 8 = 7 boxes — the same fact as 7 × 8 = 56 read backwards. 48 subtracts a box instead of counting boxes.",
          hi: "56 में 8 कितनी बार: 56 ÷ 8 = 7 डिब्बे — वही 7 × 8 = 56 उल्टा पढ़ा हुआ। 48 डिब्बे गिनने की जगह एक डिब्बा घटा देता है।",
          mr: "56 मध्ये 8 किती वेळा: 56 ÷ 8 = 7 खोकी — तोच 7 × 8 = 56 उलटा वाचलेला. 48 खोकी मोजण्याऐवजी एक खोके वजा करते.",
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
          en: "A spider has 8 legs. How many legs do 12 spiders have?",
          hi: "मकड़ी के 8 पैर होते हैं। 12 मकड़ियों के कितने पैर?",
          mr: "कोळ्याला 8 पाय असतात. 12 कोळ्यांचे किती पाय?",
        },
        answer: 96,
        wrong: [86, 104, 20],
        checkExpr: "8*12",
        solution: {
          en: "8 × 12 = 8 × 10 + 8 × 2 = 80 + 16 = 96. 86 adds only 6 for the last two spiders — each spider brings all 8 legs.",
          hi: "8 × 12 = 8 × 10 + 8 × 2 = 80 + 16 = 96। 86 आख़िरी दो मकड़ियों के लिए केवल 6 जोड़ता है — हर मकड़ी पूरे 8 पैर लाती है।",
          mr: "8 × 12 = 8 × 10 + 8 × 2 = 80 + 16 = 96. 86 शेवटच्या दोन कोळ्यांसाठी फक्त 6 मिळवते — प्रत्येक कोळी सगळे 8 पाय आणतो.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "60 bananas are shared equally among 5 monkeys. How many does each monkey get?",
          hi: "60 केले 5 बंदरों में बराबर बाँटे गए। हर बंदर को कितने मिलेंगे?",
          mr: "60 केळी 5 माकडांत सारखी वाटली. प्रत्येक माकडाला किती मिळतील?",
        },
        answer: 12,
        wrong: [10, 15, 55],
        checkExpr: "60/5",
        solution: {
          en: "60 ÷ 5 = 12 each: five twelves rebuild the 60. 55 hands one banana to the troop and keeps the rest — that is subtraction wearing a sharing mask.",
          hi: "60 ÷ 5 = 12-12: पाँच बारह मिलकर 60 बनाते हैं। 55 टोली को एक केला थमाकर बाक़ी रख लेता है — यह बँटवारे का मुखौटा पहने घटाव है।",
          mr: "60 ÷ 5 = 12-12: पाच बारा मिळून 60 होतात. 55 टोळीला एक केळे देऊन उरलेले ठेवते — ही वाटणीचा मुखवटा घातलेली वजाबाकी.",
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
          en: "Three friends share 48 marbles equally. Then one of them gives 4 marbles from his share to his sister. How many does he keep?",
          hi: "तीन दोस्त 48 कंचे बराबर बाँटते हैं। फिर उनमें से एक अपने हिस्से से 4 कंचे बहन को दे देता है। उसके पास कितने बचे?",
          mr: "तीन मित्र 48 गोट्या सारख्या वाटतात. मग त्यांतला एक आपल्या वाट्यातून 4 गोट्या बहिणीला देतो. त्याच्याकडे किती उरल्या?",
        },
        answer: 12,
        wrong: [16, 44, 8],
        checkExpr: "48/3-4",
        solution: {
          en: "His share is 48 ÷ 3 = 16, and after the gift 16 − 4 = 12 marbles. 16 forgets the gift; 44 takes the 4 from the whole 48 — the whole was already split.",
          hi: "उसका हिस्सा 48 ÷ 3 = 16, और उपहार के बाद 16 − 4 = 12 कंचे। 16 उपहार भूल जाता है; 44 पूरे 48 में से 4 घटाता है — पूरा तो पहले ही बँट चुका था।",
          mr: "त्याचा वाटा 48 ÷ 3 = 16, आणि भेटीनंतर 16 − 4 = 12 गोट्या. 16 भेट विसरते; 44 सबंध 48 मधून 4 वजा करते — सबंध आधीच वाटले गेले होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A hall has 11 benches and each bench seats 9 children. If 110 children come, how many must stand?",
          hi: "हॉल में 11 बेंचें हैं और हर बेंच पर 9 बच्चे बैठते हैं। 110 बच्चे आएँ तो कितनों को खड़ा रहना पड़ेगा?",
          mr: "सभागृहात 11 बाके आहेत आणि प्रत्येक बाकावर 9 मुले बसतात. 110 मुले आली तर किती उभी राहतील?",
        },
        answer: 11,
        wrong: [9, 21, 1],
        checkExpr: "110-9*11",
        solution: {
          en: "The benches seat 9 × 11 = 99, so 110 − 99 = 11 children stand. Answering 1 subtracts 99 as if it were 109 — do the multiplication before reaching for the difference.",
          hi: "बेंचों पर बैठेंगे 9 × 11 = 99, तो 110 − 99 = 11 बच्चे खड़े रहेंगे। 1 कहना 99 को 109 मानकर घटाना है — अंतर से पहले गुणा कीजिए।",
          mr: "बाकांवर बसतील 9 × 11 = 99, म्हणून 110 − 99 = 11 मुले उभी. 1 म्हणणे म्हणजे 99 ला 109 समजून वजा करणे — फरकाआधी गुणाकार करा.",
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
          en: "Rewa's chart says 4 × ▢ = 52. What number hides under the box?",
          hi: "रेवा के चार्ट पर लिखा है 4 × ▢ = 52। डिब्बे के नीचे कौन-सी संख्या छिपी है?",
          mr: "रेवाच्या तक्त्यावर लिहिले आहे 4 × ▢ = 52. चौकटीखाली कोणती संख्या लपली आहे?",
        },
        answer: 13,
        wrong: [12, 14, 48],
        checkExpr: "52/4",
        solution: {
          en: "Undo the multiplication with division: 52 ÷ 4 = 13, and checking forward, 4 × 13 = 52. 12 lands on 48, one four short of the chart.",
          hi: "गुणा को भाग से खोलिए: 52 ÷ 4 = 13, और उल्टा जाँचें तो 4 × 13 = 52। 12 पर पहुँचते हैं 48 — चार्ट से एक चौका कम।",
          mr: "गुणाकार भागाकाराने उलगडा: 52 ÷ 4 = 13, आणि उलट तपासले तर 4 × 13 = 52. 12 वर येतात 48 — तक्त्याहून एक चौक कमी.",
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
          en: "A box of laddoos shared equally among 6 children gives each child 7, with none left over. If the SAME box were shared equally among 7 children instead, how many would each get?",
          hi: "लड्डुओं का डिब्बा 6 बच्चों में बराबर बाँटने पर हर बच्चे को 7 मिलते हैं, कुछ बचता नहीं। वही डिब्बा 7 बच्चों में बराबर बँटे, तो हर एक को कितने मिलेंगे?",
          mr: "लाडवांचा डबा 6 मुलांत सारखा वाटला की प्रत्येकाला 7 मिळतात, काही उरत नाही. तोच डबा 7 मुलांत सारखा वाटला, तर प्रत्येकाला किती मिळतील?",
        },
        answer: 6,
        wrong: [7, 5, 8],
        checkExpr: "6*7/7",
        solution: {
          en: "First find the box: 6 children × 7 laddoos = 42 in all. Shared among 7: 42 ÷ 7 = 6 each. More children from the same box means smaller shares — 6 and 7 simply trade places, which is the beauty of 6 × 7 = 7 × 6.",
          hi: "पहले डिब्बा गिनिए: 6 बच्चे × 7 लड्डू = कुल 42। सात में बाँटें: 42 ÷ 7 = 6-6। उसी डिब्बे से ज़्यादा बच्चे यानी छोटे हिस्से — 6 और 7 बस जगह बदल लेते हैं, यही 6 × 7 = 7 × 6 की ख़ूबी है।",
          mr: "आधी डबा मोजा: 6 मुले × 7 लाडू = एकूण 42. सातांत वाटले: 42 ÷ 7 = 6-6. त्याच डब्यातून जास्त मुले म्हणजे लहान वाटे — 6 आणि 7 नुसत्या जागा बदलतात, हीच 6 × 7 = 7 × 6 ची गंमत.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 11 — Tables and Shares",
      name: "Tables and Shares",
      slug: "maths-4-tables-and-shares",
      summary: "Multiplication tables and equal sharing — cats' legs and pencil packets, benches that run out, and shares that shrink as children grow in number.",
      position: 11,
      translations: {
        hi: {
          name: "पहाड़े और बँटवारा",
          summary: "पहाड़े और बराबर बँटवारा — बिल्लियों के पैर और पेंसिल के पैकेट, कम पड़ती बेंचें, और बच्चों के बढ़ने पर सिकुड़ते हिस्से।",
        },
        mr: {
          name: "पाढे आणि वाटण्या",
          summary: "पाढे आणि सारखी वाटणी — मांजरींचे पाय आणि पेन्सिलींची पाकिटे, अपुरी पडणारी बाके, आणि मुले वाढली की आकसणारे वाटे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — How Heavy? How Light? (grams and kilograms)                  */
/* ------------------------------------------------------------------------- */
function howHeavyHowLight(): TopicFileOut {
  const rand = rng("maths-4-how-heavy-how-light");
  const qs: OutQuestion[] = [];

  const kg = (n: number) => ({ en: `${n} kg`, hi: `${n} किग्रा`, mr: `${n} किलो` });
  const g = (n: number) => ({ en: `${n} g`, hi: `${n} ग्राम`, mr: `${n} ग्रॅम` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The shopkeeper's 1 kg weight equals how many grams?",
          hi: "दुकानदार का 1 किलो का बाट कितने ग्राम के बराबर है?",
          mr: "दुकानदाराचे 1 किलोचे वजन किती ग्रॅमच्या बरोबरीचे आहे?",
        },
        answer: 1000,
        wrong: [100, 500, 10],
        solution: {
          en: "One kilogram is 1000 grams — 'kilo' means a thousand here just as it does in kilometre. 500 g is only the half-kilo weight beside it.",
          hi: "एक किलोग्राम = 1000 ग्राम — 'किलो' यहाँ भी हज़ार ही कहता है, जैसे किलोमीटर में। 500 ग्राम तो उसके बग़ल का आधा-किलो बाट है।",
          mr: "एक किलोग्रॅम = 1000 ग्रॅम — 'किलो' इथेही हजारच सांगतो, किलोमीटरप्रमाणे. 500 ग्रॅम हे त्याच्या शेजारचे अर्धा-किलोचे वजन.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A pumpkin weighs 3 kg and a marrow weighs 2 kg. What do they weigh together?",
          hi: "कद्दू 3 किलो का है और लौकी 2 किलो की। दोनों मिलाकर कितने के?",
          mr: "भोपळा 3 किलोचा आहे आणि दुधी 2 किलोचा. दोन्ही मिळून किती?",
        },
        answer: 5,
        wrong: [1, 6, 32],
        checkExpr: "3+2",
        fmt: kg,
        solution: {
          en: "On one pan together: 3 + 2 = 5 kg. 1 kg is their difference — that answers 'how much heavier', not 'how much together'.",
          hi: "एक ही पलड़े पर: 3 + 2 = 5 किलो। 1 किलो उनका अंतर है — वह 'कितना भारी ज़्यादा' का उत्तर है, 'कुल कितना' का नहीं।",
          mr: "एकाच पारड्यात: 3 + 2 = 5 किलो. 1 किलो हा त्यांचा फरक — ते 'किती जड जास्त' चे उत्तर, 'मिळून किती' चे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Amma asks for half a kilo of sugar. How many grams should the shopkeeper weigh?",
          hi: "अम्मा आधा किलो चीनी माँगती हैं। दुकानदार कितने ग्राम तौले?",
          mr: "आई अर्धा किलो साखर मागते. दुकानदाराने किती ग्रॅम तोलावी?",
        },
        answer: 500,
        wrong: [50, 250, 5],
        checkExpr: "1000/2",
        fmt: g,
        solution: {
          en: "Half of a kilo's 1000 g: 1000 ÷ 2 = 500 g. 250 g is the quarter-kilo (pav) — half is twice the pav.",
          hi: "किलो के 1000 ग्राम का आधा: 1000 ÷ 2 = 500 ग्राम। 250 ग्राम पाव है — आधा पाव का दुगना होता है।",
          mr: "किलोच्या 1000 ग्रॅमचा अर्धा: 1000 ÷ 2 = 500 ग्रॅम. 250 ग्रॅम म्हणजे पाव — अर्धा हा पावाच्या दुप्पट.",
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
          en: "A sack of rice weighs 25 kg. What do 4 such sacks weigh?",
          hi: "चावल की बोरी 25 किलो की है। ऐसी 4 बोरियाँ कितने की होंगी?",
          mr: "तांदळाचे पोते 25 किलोचे आहे. अशी 4 पोती किती होतील?",
        },
        answer: 100,
        wrong: [29, 75, 125],
        checkExpr: "25*4",
        fmt: kg,
        solution: {
          en: "Four sacks of 25: 25 × 4 = 100 kg — a full quintal. 75 loads only three sacks onto the cart.",
          hi: "25-25 की चार बोरियाँ: 25 × 4 = 100 किलो — पूरा क्विंटल। 75 ठेले पर तीन ही बोरियाँ चढ़ाता है।",
          mr: "25-25 ची चार पोती: 25 × 4 = 100 किलो — पूर्ण क्विंटल. 75 गाडीवर तीनच पोती चढवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Mother buys 750 g of potatoes and 250 g of tomatoes. How many grams is the bag?",
          hi: "माँ 750 ग्राम आलू और 250 ग्राम टमाटर लेती हैं। थैले में कितने ग्राम हुए?",
          mr: "आई 750 ग्रॅम बटाटे आणि 250 ग्रॅम टोमॅटो घेते. पिशवीत किती ग्रॅम झाले?",
        },
        answer: 1000,
        wrong: [900, 500, 1250],
        checkExpr: "750+250",
        fmt: g,
        solution: {
          en: "750 + 250 = 1000 g — exactly one kilo in the bag. 900 forgets the carry when 50 meets 50; 500 subtracts the tomatoes instead of adding them.",
          hi: "750 + 250 = 1000 ग्राम — थैले में ठीक एक किलो। 900 में 50 और 50 के मिलने का हासिल छूटा; 500 टमाटर जोड़ने की जगह घटा देता है।",
          mr: "750 + 250 = 1000 ग्रॅम — पिशवीत बरोबर एक किलो. 900 मध्ये 50 आणि 50 भेटतानाचा हातचा सुटला; 500 टोमॅटो मिळवण्याऐवजी वजा करते.",
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
          en: "To weigh 5 kg of wheat the shopkeeper puts 2 kg and 2 kg weights on the pan. What one more weight completes it?",
          hi: "5 किलो गेहूँ तौलने के लिए दुकानदार पलड़े पर 2 किलो और 2 किलो के बाट रखता है। कौन-सा एक और बाट काम पूरा करेगा?",
          mr: "5 किलो गहू तोलण्यासाठी दुकानदार पारड्यात 2 किलो आणि 2 किलोची वजने ठेवतो. आणखी कोणते एक वजन काम पूर्ण करेल?",
        },
        answer: 1,
        wrong: [2, 3, 5],
        checkExpr: "5-2-2",
        fmt: kg,
        solution: {
          en: "The pans must balance at 5: already 2 + 2 = 4, so 5 − 4 = 1 kg more. A 3 kg weight would tip the scale past the wheat.",
          hi: "पलड़े 5 पर बराबर होने हैं: अभी 2 + 2 = 4, तो 5 − 4 = 1 किलो और। 3 किलो का बाट तराज़ू को गेहूँ से आगे झुका देगा।",
          mr: "पारडी 5 वर समतोल हवी: आत्ता 2 + 2 = 4, म्हणून 5 − 4 = 1 किलो आणखी. 3 किलोचे वजन काटा गव्हाच्या पलीकडे झुकवेल.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A watermelon weighs 3 kg 250 g. How many grams is that in all?",
          hi: "तरबूज़ 3 किलो 250 ग्राम का है। कुल कितने ग्राम हुआ?",
          mr: "कलिंगड 3 किलो 250 ग्रॅमचे आहे. एकूण किती ग्रॅम झाले?",
        },
        answer: 3250,
        wrong: [3025, 325, 32500],
        checkExpr: "3*1000+250",
        fmt: g,
        solution: {
          en: "3 kg = 3 × 1000 = 3000 g, plus the loose 250: 3000 + 250 = 3250 g. 3025 drops the 250 into the wrong columns; 325 loses a whole zero of kilos.",
          hi: "3 किलो = 3 × 1000 = 3000 ग्राम, ऊपर से 250: 3000 + 250 = 3250 ग्राम। 3025 में 250 ग़लत ख़ानों में गिरा; 325 किलो का पूरा शून्य खो बैठा।",
          mr: "3 किलो = 3 × 1000 = 3000 ग्रॅम, शिवाय 250: 3000 + 250 = 3250 ग्रॅम. 3025 मध्ये 250 चुकीच्या रकान्यांत पडले; 325 ने किलोचे अख्खे शून्य गमावले.",
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
          en: "A balance stands level: one pan holds a 5 kg weight, the other holds a melon and a 2 kg weight. What does the melon weigh?",
          hi: "तराज़ू बराबर है: एक पलड़े में 5 किलो का बाट, दूसरे में एक ख़रबूज़ा और 2 किलो का बाट। ख़रबूज़ा कितने का है?",
          mr: "काटा समतोल आहे: एका पारड्यात 5 किलोचे वजन, दुसऱ्यात एक खरबूज आणि 2 किलोचे वजन. खरबूज किती वजनाचे?",
        },
        answer: 3,
        wrong: [7, 2, 5],
        checkExpr: "5-2",
        fmt: kg,
        solution: {
          en: "Level pans mean equal weight: melon + 2 = 5, so the melon is 5 − 2 = 3 kg. 7 adds the weights from both pans — the 2 kg sits WITH the melon, helping it balance, not riding on top of the 5.",
          hi: "बराबर पलड़े यानी बराबर वज़न: ख़रबूज़ा + 2 = 5, तो ख़रबूज़ा 5 − 2 = 3 किलो। 7 दोनों पलड़ों के बाट जोड़ देता है — 2 किलो ख़रबूज़े के साथ बैठा उसे बराबरी दिला रहा है, 5 के ऊपर नहीं चढ़ा।",
          mr: "समतोल पारडी म्हणजे समान वजन: खरबूज + 2 = 5, म्हणून खरबूज 5 − 2 = 3 किलो. 7 दोन्ही पारड्यांतली वजने मिळवते — 2 किलो खरबुजासोबत बसून त्याला बरोबरी देत आहे, 5 वर चढलेले नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A 12 kg tin of dal is packed into 500 g packets. How many packets does it fill?",
          hi: "12 किलो दाल का कनस्तर 500-500 ग्राम के पैकेटों में भरा गया। कितने पैकेट बनेंगे?",
          mr: "12 किलो डाळीचा डबा 500-500 ग्रॅमच्या पाकिटांत भरला. किती पाकिटे होतील?",
        },
        answer: 24,
        wrong: [12, 6, 240],
        checkExpr: "12000/500",
        solution: {
          en: "Match the units first: 12 kg = 12000 g. Then 12000 ÷ 500 = 24 packets. 12 forgets each kilo makes TWO half-kilo packets; 240 divides by 50 — a zero wandered off.",
          hi: "पहले इकाइयाँ मिलाइए: 12 किलो = 12000 ग्राम। फिर 12000 ÷ 500 = 24 पैकेट। 12 भूलता है कि हर किलो से आधे-आधे किलो के दो पैकेट बनते हैं; 240 पचास से भाग है — एक शून्य भटक गया।",
          mr: "आधी एकके जुळवा: 12 किलो = 12000 ग्रॅम. मग 12000 ÷ 500 = 24 पाकिटे. 12 विसरते की प्रत्येक किलोतून अर्ध्या-अर्ध्या किलोची दोन पाकिटे होतात; 240 म्हणजे पन्नासने भागणे — एक शून्य भरकटले.",
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
          en: "A donkey carries 90 kg in two sacks, and one sack is 10 kg heavier than the other. What does the LIGHTER sack weigh?",
          hi: "गधा दो बोरियों में 90 किलो ढोता है, और एक बोरी दूसरी से 10 किलो भारी है। हलकी बोरी कितने की है?",
          mr: "गाढव दोन पोत्यांत 90 किलो वाहते, आणि एक पोते दुसऱ्याहून 10 किलो जड आहे. हलके पोते किती वजनाचे?",
        },
        answer: 40,
        wrong: [50, 45, 80],
        checkExpr: "(90-10)/2",
        solution: {
          en: "Take the extra 10 off the pile: 90 − 10 = 80 splits evenly into 40 and 40; give the 10 back to one sack and the pair is 40 and 50. So the lighter is 40 kg — 50 answers the heavier sack, 45 splits without honouring the difference.",
          hi: "ऊपर के 10 उतार लीजिए: 90 − 10 = 80 बराबर बँटता है 40-40 में; 10 एक बोरी को लौटाइए तो जोड़ी 40 और 50 की। हलकी 40 किलो — 50 भारी बोरी का उत्तर है, 45 अंतर की परवाह किए बिना बाँट देता है।",
          mr: "वरचे 10 उतरवा: 90 − 10 = 80 सारखे वाटले जाते 40-40; 10 एका पोत्याला परत द्या की जोडी 40 आणि 50 ची. हलके 40 किलो — 50 हे जड पोत्याचे उत्तर, 45 फरकाला न जुमानता वाटते.",
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
          en: "A trader owns exactly three weights: 1 kg, 2 kg and 4 kg. Putting any of them together on ONE pan, what is the heaviest load he can weigh in one go?",
          hi: "व्यापारी के पास ठीक तीन बाट हैं: 1, 2 और 4 किलो। इन्हें एक ही पलड़े पर साथ रखकर वह एक बार में ज़्यादा-से-ज़्यादा कितना तौल सकता है?",
          mr: "व्यापाऱ्याकडे नेमकी तीन वजने आहेत: 1, 2 आणि 4 किलो. ती एकाच पारड्यात एकत्र ठेवून तो एका वेळी जास्तीत जास्त किती तोलू शकतो?",
        },
        answer: 7,
        wrong: [6, 8, 3],
        checkExpr: "1+2+4",
        solution: {
          en: "All three together: 1 + 2 + 4 = 7 kg. And here is the trader's secret: those same three weights also make every load below it — 1, 2, 3 (=1+2), 4, 5 (=4+1), 6 (=4+2) — so three weights cover one to seven with nothing missing.",
          hi: "तीनों साथ: 1 + 2 + 4 = 7 किलो। और व्यापारी का राज़: यही तीन बाट उससे नीचे का हर वज़न भी बना देते हैं — 1, 2, 3 (=1+2), 4, 5 (=4+1), 6 (=4+2) — तीन बाटों से एक से सात तक, कुछ भी छूटे बिना।",
          mr: "तिन्ही एकत्र: 1 + 2 + 4 = 7 किलो. आणि व्यापाऱ्याचे गुपित: हीच तीन वजने त्याखालचे प्रत्येक वजनही करतात — 1, 2, 3 (=1+2), 4, 5 (=4+1), 6 (=4+2) — तीन वजनांत एक ते सात, काहीही न सुटता.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 12 — How Heavy? How Light?",
      name: "How Heavy? How Light?",
      slug: "maths-4-how-heavy-how-light",
      summary: "Grams and kilograms on a real balance — weights that add up, pans that must agree, and the trader's three clever weights.",
      position: 12,
      translations: {
        hi: {
          name: "कितना भारी? कितना हलका?",
          summary: "असली तराज़ू पर ग्राम और किलोग्राम — जुड़ते बाट, बराबरी माँगते पलड़े, और व्यापारी के तीन चतुर बाट।",
        },
        mr: {
          name: "किती जड? किती हलके?",
          summary: "खऱ्या काट्यावर ग्रॅम आणि किलोग्रॅम — बेरजेची वजने, बरोबरी मागणारी पारडी, आणि व्यापाऱ्याची तीन हुशार वजने.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Fields and Fences (boundary and perimeter)                   */
/* ------------------------------------------------------------------------- */
function fieldsAndFences(): TopicFileOut {
  const rand = rng("maths-4-fields-and-fences");
  const qs: OutQuestion[] = [];

  const m = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A square field has sides of 5 metres. How long is the fence all the way round?",
          hi: "वर्गाकार खेत की भुजाएँ 5-5 मीटर की हैं। चारों ओर की बाड़ कितनी लंबी होगी?",
          mr: "चौरस शेताच्या बाजू 5-5 मीटरच्या आहेत. सभोवतीचे कुंपण किती लांब होईल?",
        },
        answer: 20,
        wrong: [10, 25, 15],
        checkExpr: "5*4",
        fmt: m,
        solution: {
          en: "A square has four equal sides: 5 × 4 = 20 m of fence. 25 multiplies 5 by itself — that would measure the field's inside, not its edge.",
          hi: "वर्ग की चार बराबर भुजाएँ: 5 × 4 = 20 मीटर बाड़। 25 पाँच को पाँच से गुणा करता है — वह खेत का भीतर नापता, किनारा नहीं।",
          mr: "चौरसाच्या चार सारख्या बाजू: 5 × 4 = 20 मीटर कुंपण. 25 पाचाला पाचानेच गुणते — ते शेताचे आतले मोजेल, कड नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A triangular park has sides 3 m, 4 m and 5 m. How long is its boundary?",
          hi: "तिकोने पार्क की भुजाएँ 3, 4 और 5 मीटर हैं। उसकी सीमा कितनी लंबी है?",
          mr: "त्रिकोणी बागेच्या बाजू 3, 4 आणि 5 मीटर आहेत. तिची हद्द किती लांब?",
        },
        answer: 12,
        wrong: [11, 60, 9],
        checkExpr: "3+4+5",
        fmt: m,
        solution: {
          en: "Walk every side once: 3 + 4 + 5 = 12 m. 60 multiplies the sides — a boundary is walked, added edge by edge, never multiplied.",
          hi: "हर भुजा एक बार चलिए: 3 + 4 + 5 = 12 मीटर। 60 भुजाओं का गुणा है — सीमा चलकर, किनारे-किनारे जोड़कर नापी जाती है, गुणा से नहीं।",
          mr: "प्रत्येक बाजू एकदा चाला: 3 + 4 + 5 = 12 मीटर. 60 म्हणजे बाजूंचा गुणाकार — हद्द चालून, कडेकडेने मिळवून मोजतात, गुणून नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A rectangular kitchen garden is 6 m long and 4 m wide. What is its boundary?",
          hi: "आयताकार बग़ीची 6 मीटर लंबी और 4 मीटर चौड़ी है। उसकी सीमा कितनी है?",
          mr: "आयताकृती परसबाग 6 मीटर लांब आणि 4 मीटर रुंद आहे. तिची हद्द किती?",
        },
        answer: 20,
        wrong: [10, 24, 16],
        checkExpr: "2*(6+4)",
        fmt: m,
        solution: {
          en: "A rectangle repeats each side twice: (6 + 4) × 2 = 20 m. 10 walks only one length and one width — half the way round.",
          hi: "आयत हर भुजा दो बार दोहराता है: (6 + 4) × 2 = 20 मीटर। 10 केवल एक लंबाई और एक चौड़ाई चलता है — आधा चक्कर।",
          mr: "आयत प्रत्येक बाजू दोनदा घेतो: (6 + 4) × 2 = 20 मीटर. 10 फक्त एक लांबी आणि एक रुंदी चालते — अर्धी फेरी.",
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
          en: "A field is 9 m long and 6 m wide. How much wire fences it once around?",
          hi: "खेत 9 मीटर लंबा और 6 मीटर चौड़ा है। एक बार घेरने में कितना तार लगेगा?",
          mr: "शेत 9 मीटर लांब आणि 6 मीटर रुंद आहे. एकदा वेढायला किती तार लागेल?",
        },
        answer: 30,
        wrong: [15, 54, 24],
        checkExpr: "2*(9+6)",
        fmt: m,
        solution: {
          en: "Two lengths and two widths: (9 + 6) × 2 = 30 m. 54 multiplies 9 × 6 — that counts the squares inside the field, not the wire around it.",
          hi: "दो लंबाइयाँ, दो चौड़ाइयाँ: (9 + 6) × 2 = 30 मीटर। 54 यानी 9 × 6 — वह खेत के भीतर के ख़ाने गिनता है, चारों ओर का तार नहीं।",
          mr: "दोन लांब्या, दोन रुंद्या: (9 + 6) × 2 = 30 मीटर. 54 म्हणजे 9 × 6 — ते शेतातल्या आतल्या चौकटी मोजते, भोवतीची तार नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Fencing wire costs ₹8 per metre. What does 12 metres of wire cost?",
          hi: "बाड़ का तार ₹8 प्रति मीटर है। 12 मीटर तार के कितने लगेंगे?",
          mr: "कुंपणाची तार ₹8 प्रति मीटर आहे. 12 मीटर तारेला किती लागतील?",
        },
        answer: 96,
        wrong: [20, 88, 104],
        checkExpr: "8*12",
        fmt: rupees,
        solution: {
          en: "8 × 12 = 8 × 10 + 8 × 2 = 96 rupees. ₹20 adds the rate to the metres; 88 and 104 are one eight below and above — the tens carry slipped.",
          hi: "8 × 12 = 8 × 10 + 8 × 2 = ₹96। ₹20 भाव को मीटर से जोड़ देता है; 88 और 104 एक-एक आठ नीचे-ऊपर हैं — दहाई का हासिल फिसला।",
          mr: "8 × 12 = 8 × 10 + 8 × 2 = ₹96. ₹20 भाव मीटरमध्ये मिळवते; 88 आणि 104 एकेक आठ खाली-वर — दशकाचा हातचा घसरला.",
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
          en: "A square garden's fence measures 36 metres in all. How long is each side?",
          hi: "वर्गाकार बग़ीचे की पूरी बाड़ 36 मीटर है। हर भुजा कितनी लंबी है?",
          mr: "चौरस बागेचे सगळे कुंपण 36 मीटर आहे. प्रत्येक बाजू किती लांब?",
        },
        answer: 9,
        wrong: [6, 12, 32],
        checkExpr: "36/4",
        fmt: m,
        solution: {
          en: "Four equal sides share the 36: 36 ÷ 4 = 9 m each. 6 divides by six — a square insists on exactly four sides.",
          hi: "36 चार बराबर भुजाओं में बँटता है: 36 ÷ 4 = 9-9 मीटर। 6 छह से भाग है — वर्ग की ज़िद है कि भुजाएँ ठीक चार हों।",
          mr: "36 चार सारख्या बाजूंत वाटले जाते: 36 ÷ 4 = 9-9 मीटर. 6 म्हणजे सहाने भागणे — चौरसाचा हट्ट आहे की बाजू नेमक्या चारच.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Ravi jogs twice around a park whose boundary is 150 metres. How far does he run?",
          hi: "रवि 150 मीटर सीमा वाले पार्क के दो चक्कर लगाता है। वह कितना दौड़ा?",
          mr: "रवी 150 मीटर हद्दीच्या बागेला दोन फेऱ्या मारतो. तो किती धावला?",
        },
        answer: 300,
        wrong: [152, 450, 75],
        checkExpr: "150*2",
        fmt: m,
        solution: {
          en: "Each lap is the full boundary: 150 × 2 = 300 m. 75 halves the park instead of doubling the laps.",
          hi: "हर चक्कर पूरी सीमा है: 150 × 2 = 300 मीटर। 75 चक्कर दुगने करने की जगह पार्क आधा कर देता है।",
          mr: "प्रत्येक फेरी म्हणजे पूर्ण हद्द: 150 × 2 = 300 मीटर. 75 फेऱ्या दुप्पट करण्याऐवजी बागच अर्धी करते.",
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
          en: "A field 20 m by 10 m is fenced all round except for a 2 m gate. How much fencing wire is needed?",
          hi: "20 × 10 मीटर का खेत चारों ओर से घेरा गया, बस 2 मीटर का फाटक छूटा। कितना तार चाहिए?",
          mr: "20 × 10 मीटरचे शेत सभोवती वेढले, फक्त 2 मीटरचे फाटक सोडले. किती तार लागेल?",
        },
        answer: 58,
        wrong: [60, 62, 28],
        checkExpr: "2*(20+10)-2",
        fmt: m,
        solution: {
          en: "The full round is (20 + 10) × 2 = 60 m; the gate stands where wire is not: 60 − 2 = 58 m. 60 fences the farmer out of his own field.",
          hi: "पूरा घेरा (20 + 10) × 2 = 60 मीटर; फाटक वहीं है जहाँ तार नहीं: 60 − 2 = 58 मीटर। 60 किसान को उसके अपने खेत से बाहर घेर देता है।",
          mr: "पूर्ण वेढा (20 + 10) × 2 = 60 मीटर; फाटक तिथे आहे जिथे तार नाही: 60 − 2 = 58 मीटर. 60 शेतकऱ्याला त्याच्याच शेताबाहेर कोंडते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "One round of the school ground's boundary is 180 m. The PT teacher orders 3 rounds. How far is that?",
          hi: "स्कूल मैदान की सीमा का एक चक्कर 180 मीटर है। पीटी सर 3 चक्कर लगवाते हैं। कुल कितनी दूरी हुई?",
          mr: "शाळेच्या मैदानाच्या हद्दीची एक फेरी 180 मीटर आहे. पीटी सर 3 फेऱ्या सांगतात. एकूण अंतर किती?",
        },
        answer: 540,
        wrong: [360, 183, 600],
        checkExpr: "180*3",
        fmt: m,
        solution: {
          en: "Three full laps: 180 × 3 = 540 m — over half a kilometre. 360 runs two laps and walks off; 183 adds the 3 as metres instead of laps.",
          hi: "तीन पूरे चक्कर: 180 × 3 = 540 मीटर — आधे किलोमीटर से ज़्यादा। 360 दो चक्कर लगाकर चल देता है; 183 तीन को चक्कर की जगह मीटर बनाकर जोड़ देता है।",
          mr: "तीन पूर्ण फेऱ्या: 180 × 3 = 540 मीटर — अर्ध्या किलोमीटरहून जास्त. 360 दोन फेऱ्या मारून निघून जाते; 183 तिनाला फेऱ्यांऐवजी मीटर करून मिळवते.",
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
          en: "A rectangular field's boundary is 40 m, and its length is 12 m. How wide is it?",
          hi: "आयताकार खेत की सीमा 40 मीटर है, और लंबाई 12 मीटर। चौड़ाई कितनी है?",
          mr: "आयताकृती शेताची हद्द 40 मीटर आहे, आणि लांबी 12 मीटर. रुंदी किती?",
        },
        answer: 8,
        wrong: [28, 14, 16],
        checkExpr: "(40-2*12)/2",
        fmt: m,
        solution: {
          en: "Two lengths use 12 × 2 = 24 m, leaving 40 − 24 = 16 m for the two widths: 16 ÷ 2 = 8 m. 28 removes only one length; 16 forgets the width also comes twice.",
          hi: "दो लंबाइयों में 12 × 2 = 24 मीटर गए, दो चौड़ाइयों के लिए बचे 40 − 24 = 16 मीटर: 16 ÷ 2 = 8 मीटर। 28 एक ही लंबाई हटाता है; 16 भूलता है कि चौड़ाई भी दो बार आती है।",
          mr: "दोन लांब्यांत 12 × 2 = 24 मीटर गेले, दोन रुंद्यांसाठी उरले 40 − 24 = 16 मीटर: 16 ÷ 2 = 8 मीटर. 28 एकच लांबी काढते; 16 विसरते की रुंदीही दोनदा येते.",
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
          en: "A square plot and a rectangular plot have the SAME 32 m boundary. The rectangle is 10 m long. How much longer is the square's side than the rectangle's width?",
          hi: "एक वर्गाकार और एक आयताकार प्लॉट की सीमा बराबर — 32 मीटर — है। आयत 10 मीटर लंबा है। वर्ग की भुजा आयत की चौड़ाई से कितनी बड़ी है?",
          mr: "एका चौरस आणि एका आयताकृती भूखंडाची हद्द सारखी — 32 मीटर — आहे. आयत 10 मीटर लांब आहे. चौरसाची बाजू आयताच्या रुंदीहून किती मोठी?",
        },
        answer: 2,
        wrong: [8, 6, 4],
        checkExpr: "32/4-(32-2*10)/2",
        fmt: m,
        solution: {
          en: "Square: 32 ÷ 4 = 8 m a side. Rectangle: two lengths take 20, so the two widths share 12 — width 6 m. The difference is 8 − 6 = 2 m. The same boundary makes many shapes: stretch a rectangle longer and its width must pay for it.",
          hi: "वर्ग: 32 ÷ 4 = 8 मीटर की भुजा। आयत: दो लंबाइयों में 20 गए, दो चौड़ाइयों के हिस्से 12 — चौड़ाई 6 मीटर। अंतर 8 − 6 = 2 मीटर। एक ही सीमा कई आकार बनाती है: आयत को लंबा खींचिए तो उसकी चौड़ाई क़ीमत चुकाती है।",
          mr: "चौरस: 32 ÷ 4 = 8 मीटरची बाजू. आयत: दोन लांब्यांत 20 गेले, दोन रुंद्यांच्या वाट्याला 12 — रुंदी 6 मीटर. फरक 8 − 6 = 2 मीटर. एकच हद्द अनेक आकार करते: आयत लांब ओढला की त्याची रुंदी किंमत मोजते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 13 — Fields and Fences",
      name: "Fields and Fences",
      slug: "maths-4-fields-and-fences",
      summary: "Boundaries walked edge by edge — squares, rectangles and triangle parks, gates that save wire, and shapes that share one boundary.",
      position: 13,
      translations: {
        hi: {
          name: "खेत और बाड़",
          summary: "किनारे-किनारे नापी सीमाएँ — वर्ग, आयत और तिकोने पार्क, तार बचाते फाटक, और एक ही सीमा बाँटते आकार।",
        },
        mr: {
          name: "शेत आणि कुंपण",
          summary: "कडेकडेने मोजलेल्या हद्दी — चौरस, आयत आणि त्रिकोणी बागा, तार वाचवणारी फाटके, आणि एकच हद्द वाटून घेणारे आकार.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — A Trip to Bhopal (journey arithmetic, all operations mixed)   */
/* ------------------------------------------------------------------------- */
function aTripToBhopal(): TopicFileOut {
  const rand = rng("maths-4-a-trip-to-bhopal");
  const qs: OutQuestion[] = [];

  const km = (n: number) => ({ en: `${n} km`, hi: `${n} किमी`, mr: `${n} किमी` });
  const mins = (n: number) => ({ en: `${n} minutes`, hi: `${n} मिनट`, mr: `${n} मिनिटे` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The trip bus has 32 seats and 9 are empty. How many children are seated?",
          hi: "सैर की बस में 32 सीटें हैं और 9 ख़ाली हैं। कितने बच्चे बैठे हैं?",
          mr: "सहलीच्या बसमध्ये 32 जागा आहेत आणि 9 रिकाम्या आहेत. किती मुले बसली आहेत?",
        },
        answer: 23,
        wrong: [41, 27, 13],
        checkExpr: "32-9",
        solution: {
          en: "Filled seats are 32 − 9 = 23. 41 adds the empty seats on top of the bus; 27 dodges the borrow from the tens.",
          hi: "भरी सीटें 32 − 9 = 23। 41 ख़ाली सीटें बस के ऊपर से जोड़ देता है; 27 दहाई का हासिल टाल जाता है।",
          mr: "भरलेल्या जागा 32 − 9 = 23. 41 रिकाम्या जागा बसवर मिळवते; 27 दशकाचा हातचा चुकवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Each mini-bus carries 35 children. How many children do 2 mini-buses carry?",
          hi: "हर मिनी-बस में 35 बच्चे जाते हैं। 2 मिनी-बसों में कितने बच्चे जाएँगे?",
          mr: "प्रत्येक मिनी-बसमध्ये 35 मुले जातात. 2 मिनी-बसमध्ये किती मुले जातील?",
        },
        answer: 70,
        wrong: [37, 60, 75],
        checkExpr: "35*2",
        solution: {
          en: "Two buses of 35: 35 × 2 = 70. 37 adds the 2 buses as if they were children.",
          hi: "35-35 की दो बसें: 35 × 2 = 70। 37 दोनों बसों को बच्चे मानकर जोड़ देता है।",
          mr: "35-35 च्या दोन बस: 35 × 2 = 70. 37 दोन बसनाच मुले समजून मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Each child brings ₹10 for the trip. How much do 5 children bring together?",
          hi: "हर बच्चा सैर के लिए ₹10 लाता है। 5 बच्चे मिलकर कितने लाएँगे?",
          mr: "प्रत्येक मूल सहलीसाठी ₹10 आणते. 5 मुले मिळून किती आणतील?",
        },
        answer: 50,
        wrong: [15, 40, 105],
        checkExpr: "10*5",
        fmt: rupees,
        solution: {
          en: "Five tens: 10 × 5 = ₹50. ₹15 adds the five children to the ten rupees — money collected per head multiplies by heads.",
          hi: "पाँच दहाई: 10 × 5 = ₹50। ₹15 पाँच बच्चों को दस रुपये में जोड़ देता है — प्रति बच्चा पैसा बच्चों से गुणा होता है।",
          mr: "पाच दशक: 10 × 5 = ₹50. ₹15 पाच मुलांना दहा रुपयांत मिळवते — दरडोई पैसे मुलांनी गुणले जातात.",
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
          en: "210 children travel in big buses of 30 each. How many buses are needed?",
          hi: "210 बच्चे 30-30 की बड़ी बसों में जाते हैं। कितनी बसें चाहिए?",
          mr: "210 मुले 30-30 च्या मोठ्या बसनी जातात. किती बस लागतील?",
        },
        answer: 7,
        wrong: [6, 8, 180],
        checkExpr: "210/30",
        solution: {
          en: "How many 30s in 210: 210 ÷ 30 = 7 buses. 180 subtracts one busload — the buses repeat until everyone is aboard.",
          hi: "210 में 30 कितनी बार: 210 ÷ 30 = 7 बसें। 180 एक बस भर घटा देता है — बसें तब तक गिनी जाती हैं जब तक सब सवार न हों।",
          mr: "210 मध्ये 30 किती वेळा: 210 ÷ 30 = 7 बस. 180 एका बसचा भार वजा करते — सारे चढेपर्यंत बस मोजायच्या.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The bridge over the river is 756 metres long. The bus has crossed 400 metres of it. How much bridge is left?",
          hi: "नदी का पुल 756 मीटर लंबा है। बस उसका 400 मीटर पार कर चुकी है। कितना पुल बाक़ी है?",
          mr: "नदीवरचा पूल 756 मीटर लांब आहे. बसने त्यातले 400 मीटर ओलांडले आहे. किती पूल उरला?",
        },
        answer: 356,
        wrong: [456, 256, 1156],
        checkExpr: "756-400",
        solution: {
          en: "Left to cross: 756 − 400 = 356 m. 1156 adds instead of subtracting — the crossed part comes out of the bridge, not onto it.",
          hi: "पार करना बाक़ी: 756 − 400 = 356 मीटर। 1156 घटाने की जगह जोड़ता है — पार हुआ हिस्सा पुल में से निकलता है, उस पर चढ़ता नहीं।",
          mr: "ओलांडायचे उरले: 756 − 400 = 356 मीटर. 1156 वजा करण्याऐवजी मिळवते — ओलांडलेला भाग पुलातून वजा होतो, त्यावर चढत नाही.",
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
          en: "At the lake, one boat takes 20 children per trip. How many children ride in 4 trips?",
          hi: "झील पर एक नाव हर फेरे में 20 बच्चे ले जाती है। 4 फेरों में कितने बच्चे घूम आएँगे?",
          mr: "तळ्यावर एक होडी प्रत्येक फेरीत 20 मुले नेते. 4 फेऱ्यांत किती मुले फिरून येतील?",
        },
        answer: 80,
        wrong: [24, 60, 100],
        checkExpr: "20*4",
        solution: {
          en: "Four trips of twenty: 20 × 4 = 80 children. 24 adds the trips to the boatload; 60 loses one whole trip.",
          hi: "बीस-बीस के चार फेरे: 20 × 4 = 80 बच्चे। 24 फेरों को सवारी में जोड़ देता है; 60 पूरा एक फेरा खो देता है।",
          mr: "वीस-वीसच्या चार फेऱ्या: 20 × 4 = 80 मुले. 24 फेऱ्यांना प्रवाशांत मिळवते; 60 अख्खी एक फेरी हरवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Samosas cost ₹4 each. What do 25 samosas for the class cost?",
          hi: "समोसा ₹4 का एक है। कक्षा के लिए 25 समोसों के कितने लगेंगे?",
          mr: "समोसा ₹4 ला एक आहे. वर्गासाठी 25 समोशांना किती लागतील?",
        },
        answer: 100,
        wrong: [29, 80, 125],
        checkExpr: "4*25",
        solution: {
          en: "4 × 25 = 100 — four twenty-fives make a hundred, the same trick as four quarters of a rupee. ₹29 adds price and count.",
          hi: "4 × 25 = 100 — चार पच्चीस मिलकर सौ, वही चार चवन्नियों वाला हिसाब। ₹29 दाम और गिनती जोड़ देता है।",
          mr: "4 × 25 = 100 — चार पंचवीस मिळून शंभर, चार पावल्यांचाच हिशेब. ₹29 भाव आणि संख्या मिळवते.",
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
          en: "Bhopal is 70 km from the school. The bus goes there in the morning and returns in the evening. How far does it travel that day?",
          hi: "भोपाल स्कूल से 70 किमी दूर है। बस सुबह जाती है और शाम को लौटती है। उस दिन वह कितना चलती है?",
          mr: "भोपाळ शाळेपासून 70 किमी आहे. बस सकाळी जाते आणि संध्याकाळी परतते. त्या दिवशी ती किती चालते?",
        },
        answer: 140,
        wrong: [70, 120, 170],
        checkExpr: "70*2",
        fmt: km,
        solution: {
          en: "There and back: 70 × 2 = 140 km. 70 remembers only the morning — the evening road home is just as long.",
          hi: "जाना और लौटना: 70 × 2 = 140 किमी। 70 केवल सुबह याद रखता है — शाम की घर-वापसी की सड़क भी उतनी ही लंबी है।",
          mr: "जाणे आणि परतणे: 70 × 2 = 140 किमी. 70 फक्त सकाळ लक्षात ठेवते — संध्याकाळची घरवाटही तितकीच लांब आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "218 children are to travel and each bus seats 56. After 3 full buses, how many children still wait for the next one?",
          hi: "218 बच्चों को जाना है और हर बस में 56 बैठते हैं। 3 भरी बसों के बाद कितने बच्चे अगली का इंतज़ार करेंगे?",
          mr: "218 मुलांना जायचे आहे आणि प्रत्येक बसमध्ये 56 बसतात. 3 भरलेल्या बसनंतर किती मुले पुढच्या बसची वाट पाहतील?",
        },
        answer: 50,
        wrong: [162, 6, 44],
        checkExpr: "218-56*3",
        solution: {
          en: "Three buses seat 56 × 3 = 168, so 218 − 168 = 50 children wait. 162 subtracts one busload; 6 imagines a fourth bus already came.",
          hi: "तीन बसों में 56 × 3 = 168 बैठे, तो 218 − 168 = 50 इंतज़ार में। 162 एक ही बस घटाता है; 6 चौथी बस को आया हुआ मान लेता है।",
          mr: "तीन बसमध्ये 56 × 3 = 168 बसले, म्हणून 218 − 168 = 50 वाट पाहतात. 162 एकच बस वजा करते; 6 चौथी बस आलीच असे समजते.",
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
          en: "The bus left school at 8:30 and reached Bhopal at 10:00. How many minutes did the ride take?",
          hi: "बस स्कूल से 8:30 बजे चली और 10:00 बजे भोपाल पहुँची। सफ़र कितने मिनट का रहा?",
          mr: "बस शाळेतून 8:30 ला निघाली आणि 10:00 ला भोपाळला पोहोचली. प्रवास किती मिनिटांचा झाला?",
        },
        answer: 90,
        wrong: [60, 130, 150],
        checkExpr: "60+30",
        fmt: mins,
        solution: {
          en: "8:30 to 9:30 is one hour (60 minutes), and 9:30 to 10:00 adds 30 more: 60 + 30 = 90 minutes. 130 subtracts clock numbers like plain numbers — clock arithmetic walks in hours and minutes, not in '1000 minus 830'.",
          hi: "8:30 से 9:30 तक एक घंटा (60 मिनट), और 9:30 से 10:00 तक 30 और: 60 + 30 = 90 मिनट। 130 घड़ी के अंकों को सादे अंक मानकर घटाता है — घड़ी का हिसाब घंटों-मिनटों में चलता है, '1000 घटा 830' में नहीं।",
          mr: "8:30 ते 9:30 एक तास (60 मिनिटे), आणि 9:30 ते 10:00 आणखी 30: 60 + 30 = 90 मिनिटे. 130 घड्याळाचे आकडे साधे आकडे समजून वजा करते — घड्याळाचा हिशेब तास-मिनिटांत चालतो, '1000 वजा 830' मध्ये नव्हे.",
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
          en: "For the trip, 40 children paid ₹50 each. The class hired 2 buses at ₹800 each. How much money is left for boat tickets?",
          hi: "सैर के लिए 40 बच्चों ने ₹50-₹50 दिए। कक्षा ने ₹800-₹800 की 2 बसें कीं। नाव के टिकटों के लिए कितने पैसे बचे?",
          mr: "सहलीसाठी 40 मुलांनी ₹50-₹50 दिले. वर्गाने ₹800-₹800 च्या 2 बस केल्या. होडीच्या तिकिटांसाठी किती पैसे उरले?",
        },
        answer: 400,
        wrong: [1200, 200, 1600],
        checkExpr: "50*40-800*2",
        fmt: rupees,
        solution: {
          en: "Collected: 50 × 40 = ₹2000. Buses: 800 × 2 = ₹1600. Left: 2000 − 1600 = ₹400. ₹1200 pays for one bus only; ₹1600 is the bus bill itself, not what survived it.",
          hi: "जमा हुए: 50 × 40 = ₹2000। बसें: 800 × 2 = ₹1600। बचे: 2000 − 1600 = ₹400। ₹1200 एक ही बस चुकाता है; ₹1600 तो बसों का बिल है, उससे बचा पैसा नहीं।",
          mr: "जमले: 50 × 40 = ₹2000. बस: 800 × 2 = ₹1600. उरले: 2000 − 1600 = ₹400. ₹1200 एकाच बसचे देते; ₹1600 हे बसचे बिल आहे, त्यातून वाचलेले पैसे नव्हेत.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 3 — A Trip to Bhopal",
      name: "A Trip to Bhopal",
      slug: "maths-4-a-trip-to-bhopal",
      summary: "One school trip, every operation — seats and buses, bridge metres, samosa money and the budget that must survive the bus bill.",
      position: 3,
      translations: {
        hi: {
          name: "भोपाल की सैर",
          summary: "एक स्कूली सैर, सारी संक्रियाएँ — सीटें और बसें, पुल के मीटर, समोसे के पैसे और वह बजट जिसे बस-बिल से बचना है।",
        },
        mr: {
          name: "भोपाळची सहल",
          summary: "एक शाळेची सहल, साऱ्या क्रिया — जागा आणि बस, पुलाचे मीटर, समोशांचे पैसे आणि बस-बिलातून वाचायचे बजेट.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — The Way the World Looks (views from above, maps and dice)     */
/* ------------------------------------------------------------------------- */
function theWayTheWorldLooks(): TopicFileOut {
  const rand = rng("maths-4-the-way-the-world-looks");
  const qs: OutQuestion[] = [];

  const m = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "On Ruchira's map, 1 cm stands for 10 metres. The gate to the well is 4 cm on the map. How far is it really?",
          hi: "रुचिरा के नक़्शे पर 1 सेमी = 10 मीटर। फाटक से कुएँ तक नक़्शे पर 4 सेमी है। असल दूरी कितनी है?",
          mr: "रुचिराच्या नकाशावर 1 सेमी = 10 मीटर. फाटकापासून विहिरीपर्यंत नकाशावर 4 सेमी आहे. खरे अंतर किती?",
        },
        answer: 40,
        wrong: [14, 4, 400],
        checkExpr: "4*10",
        fmt: m,
        solution: {
          en: "Every map-centimetre hides 10 real metres: 4 × 10 = 40 m. 400 multiplies by 100 — read the map's own scale, not a guessed one.",
          hi: "नक़्शे का हर सेंटीमीटर 10 असली मीटर छिपाए है: 4 × 10 = 40 मीटर। 400 सौ से गुणा है — नक़्शे का अपना पैमाना पढ़िए, अंदाज़े का नहीं।",
          mr: "नकाशाचा प्रत्येक सेंटिमीटर 10 खरे मीटर लपवतो: 4 × 10 = 40 मीटर. 400 म्हणजे शंभराने गुणणे — नकाशाचे स्वतःचे प्रमाण वाचा, अंदाजाचे नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A full turn is 4 quarter turns. Facing the school gate, Gappu has made 2 quarter turns. How many MORE quarter turns till he faces the gate again?",
          hi: "पूरा घुमाव 4 चौथाई-घुमावों का होता है। स्कूल के फाटक की ओर मुँह किए गप्पू 2 चौथाई-घुमाव ले चुका है। फाटक की ओर फिर से मुँह होने में और कितने चौथाई-घुमाव लगेंगे?",
          mr: "पूर्ण वळण म्हणजे 4 पाव-वळणे. शाळेच्या फाटकाकडे तोंड करून गप्पूने 2 पाव-वळणे घेतली आहेत. पुन्हा फाटकाकडे तोंड व्हायला आणखी किती पाव-वळणे लागतील?",
        },
        answer: 2,
        wrong: [1, 4, 3],
        checkExpr: "4-2",
        solution: {
          en: "The circle closes at 4 quarter turns; he has spent 2, so 4 − 2 = 2 remain — he is exactly facing away right now.",
          hi: "घेरा 4 चौथाई-घुमावों पर पूरा होता है; 2 हो चुके, तो 4 − 2 = 2 बाक़ी — अभी वह ठीक उलटी ओर देख रहा है।",
          mr: "वर्तुळ 4 पाव-वळणांवर पूर्ण होते; 2 झाली, म्हणून 4 − 2 = 2 उरली — आत्ता तो नेमका उलट्या दिशेला पाहतो आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "From the aeroplane, nine huts stand in 3 equal rows. How many huts in each row?",
          hi: "हवाई जहाज़ से नौ झोंपड़ियाँ 3 बराबर पंक्तियों में दिखती हैं। हर पंक्ति में कितनी झोंपड़ियाँ?",
          mr: "विमानातून नऊ झोपड्या 3 सारख्या रांगांत दिसतात. प्रत्येक रांगेत किती झोपड्या?",
        },
        answer: 3,
        wrong: [6, 9, 12],
        checkExpr: "9/3",
        solution: {
          en: "9 huts in 3 equal rows: 9 ÷ 3 = 3 per row — the top view turns the village into a neat times-table.",
          hi: "3 बराबर पंक्तियों में 9 झोंपड़ियाँ: 9 ÷ 3 = 3 प्रति पंक्ति — ऊपर का नज़ारा गाँव को साफ़-सुथरा पहाड़ा बना देता है।",
          mr: "3 सारख्या रांगांत 9 झोपड्या: 9 ÷ 3 = 3 प्रत्येक रांगेत — वरून पाहणे गावाचा नीटनेटका पाढा करते.",
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
          en: "On a town map, 1 cm stands for 100 metres. School to post office measures 6 cm. What is the real distance?",
          hi: "शहर के नक़्शे पर 1 सेमी = 100 मीटर। स्कूल से डाकघर 6 सेमी नापता है। असली दूरी कितनी?",
          mr: "शहराच्या नकाशावर 1 सेमी = 100 मीटर. शाळा ते पोस्ट ऑफिस 6 सेमी भरते. खरे अंतर किती?",
        },
        answer: 600,
        wrong: [106, 60, 6000],
        checkExpr: "6*100",
        fmt: m,
        solution: {
          en: "6 map-centimetres at 100 m each: 6 × 100 = 600 m. 60 uses a ten-scale; the map declared a hundred-scale in its corner.",
          hi: "100-100 मीटर के 6 नक़्शा-सेंटीमीटर: 6 × 100 = 600 मीटर। 60 दस का पैमाना लेता है; नक़्शे ने कोने में सौ का पैमाना घोषित किया था।",
          mr: "100-100 मीटरचे 6 नकाशा-सेंटिमीटर: 6 × 100 = 600 मीटर. 60 दहाचे प्रमाण घेते; नकाशाने कोपऱ्यात शंभराचे प्रमाण जाहीर केले होते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "On a die, the numbers on opposite faces add up to 7. The top face shows 2. What is on the face touching the table?",
          hi: "पासे पर आमने-सामने के फलकों के अंक जोड़ने पर 7 आता है। ऊपर 2 दिख रहा है। मेज़ से लगे फलक पर क्या है?",
          mr: "फाशावर समोरासमोरच्या पृष्ठांवरील अंकांची बेरीज 7 येते. वर 2 दिसतो आहे. टेबलाला टेकलेल्या पृष्ठावर काय आहे?",
        },
        answer: 5,
        wrong: [2, 6, 3],
        checkExpr: "7-2",
        solution: {
          en: "Bottom is the top's opposite: 7 − 2 = 5. 6 is the biggest face, but 'biggest' is not 'opposite' — the die's rule is the sum of seven.",
          hi: "नीचे वाला ऊपर वाले का जोड़ीदार है: 7 − 2 = 5। 6 सबसे बड़ा फलक है, पर 'सबसे बड़ा' 'सामने वाला' नहीं — पासे का नियम सात का जोड़ है।",
          mr: "खालचे पृष्ठ वरच्याचे जोडीदार: 7 − 2 = 5. 6 हे सर्वांत मोठे पृष्ठ, पण 'मोठे' म्हणजे 'समोरचे' नव्हे — फाशाचा नियम सातची बेरीज.",
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
          en: "Five identical coins are stacked one exactly on another. Looking straight DOWN from above, how many circles do you see?",
          hi: "पाँच एक-जैसे सिक्के ठीक एक के ऊपर एक रखे हैं। ठीक ऊपर से नीचे देखने पर कितने गोले दिखेंगे?",
          mr: "पाच सारखी नाणी नेमकी एकावर एक रचली आहेत. अगदी वरून खाली पाहिल्यास किती वर्तुळे दिसतील?",
        },
        answer: 1,
        wrong: [5, 10, 2],
        solution: {
          en: "From straight above, each coin hides the one below it — the whole stack shows exactly 1 circle. The 5 lives in the SIDE view; the top view keeps that secret.",
          hi: "ठीक ऊपर से हर सिक्का नीचे वाले को ढक लेता है — पूरी गड्डी ठीक 1 गोला दिखाती है। 5 बग़ल के नज़ारे में बसता है; ऊपर का नज़ारा वह राज़ छिपा लेता है।",
          mr: "अगदी वरून प्रत्येक नाणे खालच्याला झाकते — सगळी चळत नेमके 1 वर्तुळ दाखवते. 5 हा बाजूच्या दृश्यात राहतो; वरचे दृश्य ते गुपित लपवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A map's scale says 1 cm = 5 km. Two towns are 45 km apart. How many centimetres separate them on the map?",
          hi: "नक़्शे का पैमाना कहता है 1 सेमी = 5 किमी। दो क़स्बे 45 किमी दूर हैं। नक़्शे पर वे कितने सेंटीमीटर दूर होंगे?",
          mr: "नकाशाचे प्रमाण सांगते 1 सेमी = 5 किमी. दोन गावे 45 किमी अंतरावर आहेत. नकाशावर ती किती सेंटिमीटर दूर असतील?",
        },
        answer: 9,
        wrong: [40, 225, 5],
        checkExpr: "45/5",
        solution: {
          en: "This time the world shrinks INTO the map: 45 ÷ 5 = 9 cm. 225 multiplies instead — that would stretch the map larger than the towns themselves.",
          hi: "इस बार दुनिया नक़्शे में सिकुड़ती है: 45 ÷ 5 = 9 सेमी। 225 गुणा कर बैठता है — तब नक़्शा क़स्बों से भी बड़ा फैल जाता।",
          mr: "या वेळी जग नकाशात आकसते: 45 ÷ 5 = 9 सेमी. 225 गुणाकार करते — मग नकाशा गावांहूनही मोठा पसरला असता.",
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
          en: "A photo taken from straight above shows 6 plates in a row, each holding 4 laddoos. How many laddoos are in the photo?",
          hi: "ठीक ऊपर से ली गई तस्वीर में एक क़तार की 6 थालियाँ दिखती हैं, हर एक में 4 लड्डू। तस्वीर में कुल कितने लड्डू हैं?",
          mr: "अगदी वरून काढलेल्या फोटोत एका रांगेतल्या 6 थाळ्या दिसतात, प्रत्येकीत 4 लाडू. फोटोत एकूण किती लाडू?",
        },
        answer: 24,
        wrong: [10, 20, 28],
        checkExpr: "6*4",
        solution: {
          en: "Six plates of four: 6 × 4 = 24 laddoos — the top view lays the whole count open at once. 10 adds plates and laddoos.",
          hi: "चार-चार की छह थालियाँ: 6 × 4 = 24 लड्डू — ऊपर का नज़ारा पूरी गिनती एक साथ खोल देता है। 10 थालियाँ और लड्डू जोड़ देता है।",
          mr: "चार-चारच्या सहा थाळ्या: 6 × 4 = 24 लाडू — वरचे दृश्य सगळी मोजणी एकदम उघडते. 10 थाळ्या आणि लाडू मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Opposite faces of a die add to 7. Ruchira sees 3 on top. Her brother, lying under the glass table, looks UP at the die. What does he see?",
          hi: "पासे के आमने-सामने के फलक 7 जोड़ते हैं। रुचिरा को ऊपर 3 दिखता है। उसका भाई शीशे की मेज़ के नीचे लेटा पासे को ऊपर की ओर देखता है। उसे क्या दिखेगा?",
          mr: "फाशाची समोरासमोरची पृष्ठे 7 जोडतात. रुचिराला वर 3 दिसतो. तिचा भाऊ काचेच्या टेबलाखाली पडून फासा वर पाहतो. त्याला काय दिसेल?",
        },
        answer: 4,
        wrong: [3, 7, 5],
        checkExpr: "7-3",
        solution: {
          en: "He sees the bottom face — the top's partner: 7 − 3 = 4. Answering 3 forgets the two children look at OPPOSITE faces of the same die: where you stand decides what the world shows you.",
          hi: "उसे निचला फलक दिखता है — ऊपर वाले का जोड़ीदार: 7 − 3 = 4। 3 कहना भूलना है कि दोनों बच्चे एक ही पासे के उलटे फलक देख रहे हैं: आप कहाँ खड़े हैं, यही तय करता है कि दुनिया क्या दिखाएगी।",
          mr: "त्याला खालचे पृष्ठ दिसते — वरच्याचे जोडीदार: 7 − 3 = 4. 3 म्हणणे म्हणजे दोघे मुले एकाच फाशाची उलटी पृष्ठे पाहत आहेत हे विसरणे: तुम्ही कुठे उभे आहात, हेच जग काय दाखवेल ते ठरवते.",
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
          en: "On a 1 cm = 10 m map, the playground is drawn as a rectangle 12 cm by 8 cm. What is the REAL boundary of the playground?",
          hi: "1 सेमी = 10 मीटर वाले नक़्शे पर खेल का मैदान 12 × 8 सेमी का आयत बना है। मैदान की असली सीमा कितनी है?",
          mr: "1 सेमी = 10 मीटरच्या नकाशावर खेळाचे मैदान 12 × 8 सेमीचा आयत काढले आहे. मैदानाची खरी हद्द किती?",
        },
        answer: 400,
        wrong: [40, 200, 960],
        checkExpr: "2*(12*10+8*10)",
        fmt: m,
        solution: {
          en: "Real sides first: 12 cm → 120 m and 8 cm → 80 m. Boundary: (120 + 80) × 2 = 400 m. 40 walks the map with a finger instead of the field with feet; 960 multiplies the sides — that is the inside, not the edge.",
          hi: "पहले असली भुजाएँ: 12 सेमी → 120 मीटर और 8 सेमी → 80 मीटर। सीमा: (120 + 80) × 2 = 400 मीटर। 40 मैदान को पैरों से नहीं, नक़्शे को उँगली से चलता है; 960 भुजाओं का गुणा है — वह भीतर है, किनारा नहीं।",
          mr: "आधी खऱ्या बाजू: 12 सेमी → 120 मीटर आणि 8 सेमी → 80 मीटर. हद्द: (120 + 80) × 2 = 400 मीटर. 40 मैदान पायांनी नव्हे, नकाशा बोटाने चालते; 960 बाजूंचा गुणाकार — ते आतले, कड नव्हे.",
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
          en: "From the bus-stand roof, Gappu counts the buses parked below: 7 straight rows, 6 buses in each. While he counts, 5 buses drive away. How many buses does his final count show?",
          hi: "बस-अड्डे की छत से गप्पू नीचे खड़ी बसें गिनता है: 7 सीधी क़तारें, हर एक में 6 बसें। गिनते-गिनते 5 बसें निकल जाती हैं। उसकी आख़िरी गिनती कितनी बसें बताएगी?",
          mr: "बस-स्थानकाच्या छतावरून गप्पू खाली उभ्या बस मोजतो: 7 सरळ रांगा, प्रत्येकीत 6 बस. मोजता मोजता 5 बस निघून जातात. त्याची शेवटची मोजणी किती बस सांगेल?",
        },
        answer: 37,
        wrong: [42, 47, 30],
        checkExpr: "7*6-5",
        solution: {
          en: "The roof shows the full grid: 7 × 6 = 42 buses. Five left, so 42 − 5 = 37 remain. 42 counts the yard as it WAS — a view from above is a photograph of one moment, and the world moves under it.",
          hi: "छत पूरा जाल दिखाती है: 7 × 6 = 42 बसें। पाँच गईं, तो 42 − 5 = 37 बचीं। 42 अड्डे को वैसा गिनता है जैसा वह था — ऊपर का नज़ारा एक पल की तस्वीर है, और दुनिया उसके नीचे चलती रहती है।",
          mr: "छत पूर्ण जाळे दाखवते: 7 × 6 = 42 बस. पाच गेल्या, म्हणून 42 − 5 = 37 उरल्या. 42 स्थानक होते तसे मोजते — वरचे दृश्य म्हणजे एका क्षणाचा फोटो, आणि जग त्याखाली हलत राहते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 5 — The Way the World Looks",
      name: "The Way the World Looks",
      slug: "maths-4-the-way-the-world-looks",
      summary: "Top views and map scales, quarter turns and the die's secret sevens — how standing somewhere else changes what you count.",
      position: 5,
      translations: {
        hi: {
          name: "दुनिया ऐसी दिखती है",
          summary: "ऊपर के नज़ारे और नक़्शों के पैमाने, चौथाई घुमाव और पासे का सात वाला राज़ — कहीं और खड़े होने से गिनती कैसे बदलती है।",
        },
        mr: {
          name: "जग असे दिसते",
          summary: "वरची दृश्ये आणि नकाशांची प्रमाणे, पाव-वळणे आणि फाशाचे सातांचे गुपित — दुसरीकडे उभे राहिल्याने मोजणी कशी बदलते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Carts and Wheels (circles, centre, radius)                    */
/* ------------------------------------------------------------------------- */
function cartsAndWheels(): TopicFileOut {
  const rand = rng("maths-4-carts-and-wheels");
  const qs: OutQuestion[] = [];

  const cm = (n: number) => ({ en: `${n} cm`, hi: `${n} सेमी`, mr: `${n} सेमी` });
  const m = (n: number) => ({ en: `${n} m`, hi: `${n} मीटर`, mr: `${n} मीटर` });

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The line from a wheel's centre to its rim is the radius. A cart wheel's radius is 30 cm. How wide is the wheel through its centre (the diameter)?",
          hi: "पहिए के केंद्र से किनारे तक की रेखा त्रिज्या है। बैलगाड़ी के पहिए की त्रिज्या 30 सेमी है। केंद्र से होकर पहिया कितना चौड़ा है (व्यास)?",
          mr: "चाकाच्या केंद्रापासून कडेपर्यंतची रेषा म्हणजे त्रिज्या. गाडीच्या चाकाची त्रिज्या 30 सेमी आहे. केंद्रातून चाक किती रुंद (व्यास)?",
        },
        answer: 60,
        wrong: [30, 15, 90],
        checkExpr: "30*2",
        fmt: cm,
        solution: {
          en: "The diameter crosses the whole wheel — a radius to the centre and a radius beyond: 30 × 2 = 60 cm. 15 halves instead of doubling.",
          hi: "व्यास पूरा पहिया पार करता है — एक त्रिज्या केंद्र तक, एक उसके आगे: 30 × 2 = 60 सेमी। 15 दुगना करने की जगह आधा कर देता है।",
          mr: "व्यास सबंध चाक ओलांडतो — एक त्रिज्या केंद्रापर्यंत, एक पुढे: 30 × 2 = 60 सेमी. 15 दुप्पट करण्याऐवजी अर्धे करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A bangle measures 6 cm across its middle. What is its radius?",
          hi: "एक चूड़ी बीच से 6 सेमी नापती है। उसकी त्रिज्या कितनी है?",
          mr: "एक बांगडी मधून 6 सेमी भरते. तिची त्रिज्या किती?",
        },
        answer: 3,
        wrong: [6, 12, 2],
        checkExpr: "6/2",
        fmt: cm,
        solution: {
          en: "The radius is half the middle-crossing: 6 ÷ 2 = 3 cm. 12 doubles the diameter — that walks out of the bangle altogether.",
          hi: "त्रिज्या बीच वाली नाप की आधी है: 6 ÷ 2 = 3 सेमी। 12 व्यास को दुगना करता है — वह तो चूड़ी से बाहर निकल जाता है।",
          mr: "त्रिज्या ही मधल्या मापाची अर्धी: 6 ÷ 2 = 3 सेमी. 12 व्यास दुप्पट करते — ते बांगडीबाहेरच जाते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A cycle wheel covers 2 metres in one full turn. How far does it roll in 4 turns?",
          hi: "साइकिल का पहिया एक पूरे चक्कर में 2 मीटर चलता है। 4 चक्करों में कितना चलेगा?",
          mr: "सायकलचे चाक एका पूर्ण फेरीत 2 मीटर जाते. 4 फेऱ्यांत किती जाईल?",
        },
        answer: 8,
        wrong: [6, 2, 16],
        checkExpr: "2*4",
        fmt: m,
        solution: {
          en: "Each turn lays down 2 m: 2 × 4 = 8 m. The wheel writes its own circumference on the road, turn after turn.",
          hi: "हर चक्कर 2 मीटर बिछाता है: 2 × 4 = 8 मीटर। पहिया अपनी ही परिधि सड़क पर लिखता चलता है, चक्कर-दर-चक्कर।",
          mr: "प्रत्येक फेरी 2 मीटर अंथरते: 2 × 4 = 8 मीटर. चाक आपलाच परीघ रस्त्यावर लिहीत जाते, फेरीमागून फेरी.",
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
          en: "A round chapati is cut straight through the centre, then cut through the centre again crosswise. How many equal pieces are there?",
          hi: "गोल रोटी को केंद्र से होकर सीधा काटा गया, फिर केंद्र से ही आड़ा काटा गया। कितने बराबर टुकड़े बने?",
          mr: "गोल पोळी केंद्रातून सरळ कापली, मग केंद्रातूनच आडवी कापली. किती सारखे तुकडे झाले?",
        },
        answer: 4,
        wrong: [2, 3, 8],
        checkExpr: "2*2",
        solution: {
          en: "The first centre-cut makes 2 halves; the crosswise centre-cut halves each of those: 2 × 2 = 4 quarters. 8 needs two MORE cuts through the centre.",
          hi: "पहला केंद्र-कट 2 आधे बनाता है; आड़ा केंद्र-कट हर आधे को फिर आधा करता है: 2 × 2 = 4 चौथाइयाँ। 8 के लिए केंद्र से दो और कट चाहिए।",
          mr: "पहिला केंद्र-काप 2 अर्धे करतो; आडवा केंद्र-काप प्रत्येक अर्ध्याला पुन्हा अर्धे करतो: 2 × 2 = 4 पाव. 8 साठी केंद्रातून आणखी दोन काप हवेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A bullock-cart wheel made 100 turns and covered 200 metres. How far did one turn carry the cart?",
          hi: "बैलगाड़ी के पहिए ने 100 चक्कर लगाए और 200 मीटर चला। एक चक्कर ने गाड़ी को कितना आगे बढ़ाया?",
          mr: "बैलगाडीच्या चाकाने 100 फेऱ्या घेतल्या आणि 200 मीटर गेले. एका फेरीने गाडी किती पुढे नेली?",
        },
        answer: 2,
        wrong: [100, 20, 4],
        checkExpr: "200/100",
        fmt: m,
        solution: {
          en: "200 metres shared over 100 turns: 200 ÷ 100 = 2 m each — that 2 m is the wheel's rim unrolled once. 20 loses a zero in the division.",
          hi: "100 चक्करों में बँटे 200 मीटर: 200 ÷ 100 = 2-2 मीटर — यही 2 मीटर पहिए का एक बार खुला किनारा है। 20 भाग में एक शून्य खो देता है।",
          mr: "100 फेऱ्यांत वाटलेले 200 मीटर: 200 ÷ 100 = 2-2 मीटर — हेच 2 मीटर म्हणजे चाकाची एकदा उलगडलेली कड. 20 भागाकारात एक शून्य हरवते.",
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
          en: "A rangoli has 3 circles sharing one centre, with radii 2 cm, 4 cm and 6 cm. How much longer is the biggest radius than the smallest?",
          hi: "रंगोली में एक ही केंद्र के 3 वृत्त हैं, त्रिज्याएँ 2, 4 और 6 सेमी। सबसे बड़ी त्रिज्या सबसे छोटी से कितनी लंबी है?",
          mr: "रांगोळीत एकाच केंद्राची 3 वर्तुळे आहेत, त्रिज्या 2, 4 आणि 6 सेमी. सर्वांत मोठी त्रिज्या सर्वांत लहानहून किती लांब?",
        },
        answer: 4,
        wrong: [2, 6, 8],
        checkExpr: "6-2",
        fmt: cm,
        solution: {
          en: "Biggest minus smallest: 6 − 2 = 4 cm — the width of the coloured band between the outer and inner circles. 8 adds them instead.",
          hi: "सबसे बड़ी घटा सबसे छोटी: 6 − 2 = 4 सेमी — बाहरी और भीतरी वृत्त के बीच की रंगीन पट्टी की चौड़ाई। 8 उन्हें जोड़ बैठता है।",
          mr: "मोठी वजा लहान: 6 − 2 = 4 सेमी — बाहेरच्या आणि आतल्या वर्तुळांमधल्या रंगीत पट्ट्याची रुंदी. 8 त्या मिळवते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A toy car's wheel spins 60 turns every minute. How many turns in 5 minutes?",
          hi: "खिलौना कार का पहिया हर मिनट 60 चक्कर घूमता है। 5 मिनट में कितने चक्कर?",
          mr: "खेळण्यातल्या गाडीचे चाक दर मिनिटाला 60 फेऱ्या फिरते. 5 मिनिटांत किती फेऱ्या?",
        },
        answer: 300,
        wrong: [65, 240, 350],
        checkExpr: "60*5",
        solution: {
          en: "Five minutes of 60 turns each: 60 × 5 = 300 turns. 65 adds the minutes to the speed — a rate multiplies by the time it runs.",
          hi: "60-60 चक्करों के पाँच मिनट: 60 × 5 = 300 चक्कर। 65 मिनटों को रफ़्तार में जोड़ देता है — दर उतने समय से गुणा होती है जितना वह चलती है।",
          mr: "60-60 फेऱ्यांची पाच मिनिटे: 60 × 5 = 300 फेऱ्या. 65 मिनिटे वेगात मिळवते — दर तो चालतो त्या वेळाने गुणला जातो.",
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
          en: "A circular park has a radius of 35 metres, with gates at the two ends of one straight path through the centre. How long is that path, gate to gate?",
          hi: "गोल पार्क की त्रिज्या 35 मीटर है, और केंद्र से गुज़रते एक सीधे रास्ते के दोनों सिरों पर फाटक हैं। फाटक से फाटक तक वह रास्ता कितना लंबा है?",
          mr: "गोल बागेची त्रिज्या 35 मीटर आहे, आणि केंद्रातून जाणाऱ्या एका सरळ वाटेच्या दोन्ही टोकांना फाटके आहेत. फाटकापासून फाटकापर्यंत ती वाट किती लांब?",
        },
        answer: 70,
        wrong: [35, 140, 105],
        checkExpr: "35*2",
        fmt: m,
        solution: {
          en: "Gate to gate through the centre is the diameter: 35 × 2 = 70 m. 35 stops at the fountain in the middle; 140 doubles the diameter itself.",
          hi: "केंद्र से होकर फाटक-से-फाटक व्यास है: 35 × 2 = 70 मीटर। 35 बीच के फ़व्वारे पर रुक जाता है; 140 व्यास को ही दुगना कर देता है।",
          mr: "केंद्रातून फाटक ते फाटक म्हणजे व्यास: 35 × 2 = 70 मीटर. 35 मधल्या कारंज्यावर थांबते; 140 व्यासालाच दुप्पट करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "In a bangle race, Sudha's bangle rolls 10 cm in each turn. The track is 90 cm long. How many full turns does the bangle need to finish?",
          hi: "चूड़ी-दौड़ में सुधा की चूड़ी हर चक्कर में 10 सेमी लुढ़कती है। पट्टी 90 सेमी लंबी है। दौड़ पूरी करने में चूड़ी को कितने पूरे चक्कर लगेंगे?",
          mr: "बांगडी-शर्यतीत सुधाची बांगडी प्रत्येक फेरीत 10 सेमी घरंगळते. पट्टी 90 सेमी लांब आहे. शर्यत पुरी करायला बांगडीला किती पूर्ण फेऱ्या लागतील?",
        },
        answer: 9,
        wrong: [10, 80, 8],
        checkExpr: "90/10",
        solution: {
          en: "90 cm at 10 cm a turn: 90 ÷ 10 = 9 turns. 80 subtracts one turn's length from the track — the bangle repeats its 10 cm, it does not spend the track.",
          hi: "10-10 सेमी के हिसाब से 90 सेमी: 90 ÷ 10 = 9 चक्कर। 80 पट्टी में से एक चक्कर की लंबाई घटाता है — चूड़ी अपने 10 सेमी दोहराती है, पट्टी को ख़र्च नहीं करती।",
          mr: "10-10 सेमीच्या हिशेबाने 90 सेमी: 90 ÷ 10 = 9 फेऱ्या. 80 पट्टीतून एका फेरीची लांबी वजा करते — बांगडी आपले 10 सेमी पुनःपुन्हा घालते, पट्टी खर्च करत नाही.",
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
          en: "A potter's wheel must spin 8 rounds to shape one diya. Today the potter shaped 15 diyas. How many rounds did the wheel spin?",
          hi: "एक दीया गढ़ने के लिए कुम्हार के चाक को 8 चक्कर घूमना पड़ता है। आज कुम्हार ने 15 दीये गढ़े। चाक कितने चक्कर घूमा?",
          mr: "एक पणती घडवायला कुंभाराच्या चाकाला 8 फेऱ्या फिराव्या लागतात. आज कुंभाराने 15 पणत्या घडवल्या. चाक किती फेऱ्या फिरले?",
        },
        answer: 120,
        wrong: [23, 105, 128],
        checkExpr: "8*15",
        solution: {
          en: "8 rounds fifteen times over: 8 × 15 = 8 × 10 + 8 × 5 = 80 + 40 = 120 rounds. 105 slips on the 8 × 5; 23 adds rounds to diyas.",
          hi: "8 चक्कर, पंद्रह बार: 8 × 15 = 8 × 10 + 8 × 5 = 80 + 40 = 120 चक्कर। 105 में 8 × 5 फिसला; 23 चक्करों को दीयों में जोड़ देता है।",
          mr: "8 फेऱ्या, पंधरा वेळा: 8 × 15 = 8 × 10 + 8 × 5 = 80 + 40 = 120 फेऱ्या. 105 मध्ये 8 × 5 घसरले; 23 फेऱ्या पणत्यांत मिळवते.",
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
          en: "Three children stand on the rim of a circular ground, each in a different place, and each holds a rope stretched straight to the centre pole. Every rope is 12 m. How much rope is that in all — and why are the three ropes equal?",
          hi: "तीन बच्चे गोल मैदान के किनारे पर अलग-अलग जगह खड़े हैं, और हर एक ने केंद्र के खंभे तक सीधी रस्सी तानी है। हर रस्सी 12 मीटर है। कुल कितनी रस्सी हुई — और तीनों रस्सियाँ बराबर क्यों हैं?",
          mr: "तीन मुले गोल मैदानाच्या कडेवर वेगवेगळ्या जागी उभी आहेत, आणि प्रत्येकाने केंद्राच्या खांबापर्यंत सरळ दोरी ताणली आहे. प्रत्येक दोरी 12 मीटर आहे. एकूण किती दोरी झाली — आणि तिन्ही दोऱ्या सारख्या का?",
        },
        answer: 36,
        wrong: [24, 12, 48],
        checkExpr: "12*3",
        solution: {
          en: "Three ropes of 12 m: 12 × 3 = 36 m. They are equal because each rope is a RADIUS — and every radius of a circle is the same length. That is the circle's whole secret: the rim is exactly the set of points one radius from the centre.",
          hi: "12-12 मीटर की तीन रस्सियाँ: 12 × 3 = 36 मीटर। वे बराबर इसलिए हैं कि हर रस्सी एक त्रिज्या है — और वृत्त की हर त्रिज्या एक-सी लंबी होती है। यही वृत्त का पूरा राज़ है: किनारा ठीक उन बिंदुओं का घेरा है जो केंद्र से एक त्रिज्या दूर हैं।",
          mr: "12-12 मीटरच्या तीन दोऱ्या: 12 × 3 = 36 मीटर. त्या सारख्या कारण प्रत्येक दोरी ही त्रिज्या आहे — आणि वर्तुळाची प्रत्येक त्रिज्या सारखीच लांब असते. हेच वर्तुळाचे सगळे गुपित: कड म्हणजे केंद्रापासून एक त्रिज्या दूर असलेल्या बिंदूंचा वेढा.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 8 — Carts and Wheels",
      name: "Carts and Wheels",
      slug: "maths-4-carts-and-wheels",
      summary: "Circles everywhere — radius and diameter, wheels writing their rims on the road, and why every rope to the centre is the same.",
      position: 8,
      translations: {
        hi: {
          name: "गाड़ियाँ और पहिए",
          summary: "हर ओर वृत्त — त्रिज्या और व्यास, सड़क पर अपना किनारा लिखते पहिए, और केंद्र तक की हर रस्सी बराबर क्यों।",
        },
        mr: {
          name: "गाड्या आणि चाके",
          summary: "सगळीकडे वर्तुळे — त्रिज्या आणि व्यास, रस्त्यावर आपली कड लिहिणारी चाके, आणि केंद्रापर्यंतची प्रत्येक दोरी सारखी का.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Play with Patterns (growing, shrinking and coded patterns)   */
/* ------------------------------------------------------------------------- */
function playWithPatterns4(): TopicFileOut {
  const rand = rng("maths-4-play-with-patterns");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The pattern goes 2, 4, 6, 8, … What comes next?",
          hi: "पैटर्न है 2, 4, 6, 8, … आगे क्या आएगा?",
          mr: "आकृतिबंध आहे 2, 4, 6, 8, … पुढे काय येईल?",
        },
        answer: 10,
        wrong: [9, 12, 16],
        checkExpr: "8+2",
        solution: {
          en: "Each step adds 2: 8 + 2 = 10 — the even numbers marching. 9 belongs to the odd family walking in between.",
          hi: "हर क़दम 2 जोड़ता है: 8 + 2 = 10 — सम संख्याओं की क़तार। 9 बीच में चलते विषम परिवार का है।",
          mr: "प्रत्येक पाऊल 2 वाढवते: 8 + 2 = 10 — सम संख्यांची रांग. 9 मध्ये चालणाऱ्या विषम कुटुंबातला आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The pattern goes 5, 10, 15, 20, … What comes next?",
          hi: "पैटर्न है 5, 10, 15, 20, … आगे क्या आएगा?",
          mr: "आकृतिबंध आहे 5, 10, 15, 20, … पुढे काय येईल?",
        },
        answer: 25,
        wrong: [24, 30, 21],
        checkExpr: "20+5",
        solution: {
          en: "The step is 5: 20 + 5 = 25 — the five-times table wearing a pattern's clothes. 30 jumps two steps at once.",
          hi: "क़दम 5 का है: 20 + 5 = 25 — पैटर्न के कपड़ों में पाँच का पहाड़ा। 30 एक साथ दो क़दम कूद जाता है।",
          mr: "पाऊल 5 चे आहे: 20 + 5 = 25 — आकृतिबंधाच्या कपड्यांतला पाचाचा पाढा. 30 एकदम दोन पावले उडी मारते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Laddoos are laid out 1, 3, 5, 7, … How many in the next heap?",
          hi: "लड्डू रखे हैं 1, 3, 5, 7, … अगले ढेर में कितने होंगे?",
          mr: "लाडू मांडले आहेत 1, 3, 5, 7, … पुढच्या ढिगात किती असतील?",
        },
        answer: 9,
        wrong: [8, 11, 14],
        checkExpr: "7+2",
        solution: {
          en: "Odd numbers climb by 2: 7 + 2 = 9. 8 slips onto the even ladder standing next to this one.",
          hi: "विषम संख्याएँ 2-2 चढ़ती हैं: 7 + 2 = 9। 8 बग़ल में खड़ी सम सीढ़ी पर फिसल जाता है।",
          mr: "विषम संख्या 2-2 ने चढतात: 7 + 2 = 9. 8 शेजारी उभ्या सम शिडीवर घसरतो.",
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
          en: "This pattern DOUBLES: 3, 6, 12, 24, … What comes next?",
          hi: "यह पैटर्न दुगना होता है: 3, 6, 12, 24, … आगे क्या?",
          mr: "हा आकृतिबंध दुप्पट होतो: 3, 6, 12, 24, … पुढे काय?",
        },
        answer: 48,
        wrong: [36, 30, 27],
        checkExpr: "24*2",
        solution: {
          en: "Each number is the last one doubled: 24 × 2 = 48. 36 adds 12 — that was the OLD gap; a doubling pattern's gaps grow with it.",
          hi: "हर संख्या पिछली की दुगनी: 24 × 2 = 48। 36 बारह जोड़ता है — वह पुराना फ़ासला था; दुगने पैटर्न के फ़ासले उसी के साथ बढ़ते हैं।",
          mr: "प्रत्येक संख्या मागचीच्या दुप्पट: 24 × 2 = 48. 36 बारा मिळवते — ते जुने अंतर होते; दुप्पट होणाऱ्या आकृतिबंधाची अंतरे त्याच्यासोबत वाढतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "This pattern walks DOWN: 90, 80, 70, … What comes next?",
          hi: "यह पैटर्न नीचे उतरता है: 90, 80, 70, … आगे क्या?",
          mr: "हा आकृतिबंध खाली उतरतो: 90, 80, 70, … पुढे काय?",
        },
        answer: 60,
        wrong: [65, 50, 75],
        checkExpr: "70-10",
        solution: {
          en: "Each step takes away 10: 70 − 10 = 60. 50 skips a stair on the way down.",
          hi: "हर क़दम 10 घटाता है: 70 − 10 = 60। 50 उतरते हुए एक सीढ़ी लाँघ जाता है।",
          mr: "प्रत्येक पाऊल 10 वजा करते: 70 − 10 = 60. 50 उतरताना एक पायरी ओलांडते.",
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
          en: "In a secret code, each letter is its place-number: A=1, B=2, C=3 … What number does the word CAB make when you add its letters?",
          hi: "गुप्त कूट में हर अक्षर अपनी जगह की संख्या है: A=1, B=2, C=3 … CAB शब्द के अक्षर जोड़ने पर कौन-सी संख्या बनती है?",
          mr: "गुप्त सांकेतिक भाषेत प्रत्येक अक्षर त्याच्या जागेचा आकडा: A=1, B=2, C=3 … CAB या शब्दाची अक्षरे मिळवल्यावर कोणती संख्या होते?",
        },
        answer: 6,
        wrong: [5, 7, 312],
        checkExpr: "3+1+2",
        solution: {
          en: "C=3, A=1, B=2, and 3 + 1 + 2 = 6. 312 writes the letters side by side instead of adding — a code must be worked, not just read.",
          hi: "C=3, A=1, B=2, और 3 + 1 + 2 = 6। 312 अक्षरों को जोड़ने की जगह अग़ल-बग़ल लिख देता है — कूट हल करना पड़ता है, केवल पढ़ना नहीं।",
          mr: "C=3, A=1, B=2, आणि 3 + 1 + 2 = 6. 312 अक्षरे मिळवण्याऐवजी शेजारी-शेजारी लिहिते — सांकेतिक भाषा सोडवावी लागते, नुसती वाचून चालत नाही.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The square-dot pattern goes 1, 4, 9, 16, … What comes next?",
          hi: "वर्ग-बिंदुओं का पैटर्न है 1, 4, 9, 16, … आगे क्या?",
          mr: "चौरस-ठिपक्यांचा आकृतिबंध आहे 1, 4, 9, 16, … पुढे काय?",
        },
        answer: 25,
        wrong: [20, 24, 32],
        checkExpr: "5*5",
        solution: {
          en: "These are square arrays of dots: 1×1, 2×2, 3×3, 4×4 — next is 5 × 5 = 25. 20 adds 4 again, but this pattern's gaps grow: +3, +5, +7, then +9.",
          hi: "ये बिंदुओं के वर्ग हैं: 1×1, 2×2, 3×3, 4×4 — अगला 5 × 5 = 25। 20 फिर 4 जोड़ता है, पर इस पैटर्न के फ़ासले बढ़ते हैं: +3, +5, +7, फिर +9।",
          mr: "हे ठिपक्यांचे चौरस आहेत: 1×1, 2×2, 3×3, 4×4 — पुढचा 5 × 5 = 25. 20 पुन्हा 4 मिळवते, पण या आकृतिबंधाची अंतरे वाढतात: +3, +5, +7, मग +9.",
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
          en: "In a magic square every row adds to 15. One row shows 8, ▢, 4. What hides in the box?",
          hi: "जादुई वर्ग में हर पंक्ति का जोड़ 15 है। एक पंक्ति में 8, ▢, 4 है। डिब्बे में क्या छिपा है?",
          mr: "जादूच्या चौरसात प्रत्येक ओळीची बेरीज 15 आहे. एका ओळीत 8, ▢, 4 आहे. चौकटीत काय लपले आहे?",
        },
        answer: 3,
        wrong: [12, 7, 5],
        checkExpr: "15-8-4",
        solution: {
          en: "The row must reach 15: 15 − 8 − 4 = 3, and checking, 8 + 3 + 4 = 15. 12 subtracts only the 8 — both neighbours have already claimed their share.",
          hi: "पंक्ति को 15 तक पहुँचना है: 15 − 8 − 4 = 3, और जाँच में 8 + 3 + 4 = 15। 12 केवल 8 घटाता है — दोनों पड़ोसी अपना हिस्सा पहले ही ले चुके हैं।",
          mr: "ओळीने 15 गाठायचे आहे: 15 − 8 − 4 = 3, आणि तपासात 8 + 3 + 4 = 15. 12 फक्त 8 वजा करते — दोन्ही शेजाऱ्यांनी आपला वाटा आधीच घेतला आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The staircase pattern totals each stair: 1, then 1+2, then 1+2+3. What is the total on the FOURTH stair?",
          hi: "सीढ़ी-पैटर्न हर सीढ़ी का जोड़ बताता है: 1, फिर 1+2, फिर 1+2+3। चौथी सीढ़ी का जोड़ क्या है?",
          mr: "जिना-आकृतिबंध प्रत्येक पायरीची बेरीज सांगतो: 1, मग 1+2, मग 1+2+3. चौथ्या पायरीची बेरीज किती?",
        },
        answer: 10,
        wrong: [6, 4, 16],
        checkExpr: "1+2+3+4",
        solution: {
          en: "The fourth stair stacks 1 + 2 + 3 + 4 = 10 — the triangle numbers 1, 3, 6, 10. 6 is the THIRD stair; 4 is only the newest step, not the whole staircase.",
          hi: "चौथी सीढ़ी पर जमा 1 + 2 + 3 + 4 = 10 — त्रिभुज संख्याएँ 1, 3, 6, 10। 6 तीसरी सीढ़ी है; 4 केवल सबसे नया क़दम है, पूरी सीढ़ी नहीं।",
          mr: "चौथ्या पायरीवर 1 + 2 + 3 + 4 = 10 — त्रिकोणी संख्या 1, 3, 6, 10. 6 ही तिसरी पायरी; 4 हे फक्त नवे पाऊल, सगळा जिना नव्हे.",
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
          en: "Add the first five odd numbers: 1 + 3 + 5 + 7 + 9. What do they make?",
          hi: "पहली पाँच विषम संख्याएँ जोड़िए: 1 + 3 + 5 + 7 + 9। कुल क्या बनता है?",
          mr: "पहिल्या पाच विषम संख्या मिळवा: 1 + 3 + 5 + 7 + 9. एकूण किती होते?",
        },
        answer: 25,
        wrong: [24, 20, 30],
        checkExpr: "1+3+5+7+9",
        solution: {
          en: "Pair them round the middle: (1+9) + (3+7) + 5 = 10 + 10 + 5 = 25 — which is 5 × 5. The first five odd numbers always build the fifth square; that is the dot-picture behind it.",
          hi: "बीच के इर्द-गिर्द जोड़े बनाइए: (1+9) + (3+7) + 5 = 10 + 10 + 5 = 25 — यानी 5 × 5। पहली पाँच विषम संख्याएँ हमेशा पाँचवाँ वर्ग बनाती हैं; यही इसके पीछे की बिंदु-तस्वीर है।",
          mr: "मधोमध जोड्या लावा: (1+9) + (3+7) + 5 = 10 + 10 + 5 = 25 — म्हणजे 5 × 5. पहिल्या पाच विषम संख्या नेहमी पाचवा चौरस बांधतात; हेच त्यामागचे ठिपक्यांचे चित्र.",
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
          en: "On a calendar, four dates make a 2-by-2 square. The smallest of the four is 8. What do all four dates add up to?",
          hi: "कैलेंडर पर चार तारीख़ें 2×2 का वर्ग बनाती हैं। चारों में सबसे छोटी 8 है। चारों तारीख़ों का जोड़ क्या होगा?",
          mr: "दिनदर्शिकेवर चार तारखा 2×2 चा चौरस करतात. चौघांत सर्वांत लहान 8 आहे. चारही तारखांची बेरीज किती?",
        },
        answer: 48,
        wrong: [32, 46, 40],
        checkExpr: "8+9+15+16",
        solution: {
          en: "The square holds 8 and 9, and directly below them 15 and 16 (a week later): 8 + 9 + 15 + 16 = 48. The pretty part: both diagonals agree, 8 + 16 = 9 + 15 = 24 — every calendar square hides this balance. 32 forgets the lower row lives a whole week down.",
          hi: "वर्ग में 8 और 9 हैं, और ठीक नीचे 15 और 16 (एक हफ़्ता बाद): 8 + 9 + 15 + 16 = 48। सुंदर बात: दोनों विकर्ण सहमत हैं, 8 + 16 = 9 + 15 = 24 — हर कैलेंडर-वर्ग में यह संतुलन छिपा है। 32 भूलता है कि निचली पंक्ति पूरे हफ़्ते नीचे रहती है।",
          mr: "चौरसात 8 आणि 9, आणि बरोबर खाली 15 आणि 16 (आठवड्याने): 8 + 9 + 15 + 16 = 48. सुंदर गोष्ट: दोन्ही कर्ण सहमत, 8 + 16 = 9 + 15 = 24 — प्रत्येक दिनदर्शिका-चौरसात हा तोल लपलेला असतो. 32 विसरते की खालची ओळ अख्ख्या आठवड्याने खाली राहते.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 10 — Play with Patterns",
      name: "Play with Patterns",
      slug: "maths-4-play-with-patterns",
      summary: "Steps that repeat, gaps that grow, letter codes and magic squares — finding the rule and riding it one step further.",
      position: 10,
      translations: {
        hi: {
          name: "पैटर्न का खेल",
          summary: "दोहराते क़दम, बढ़ते फ़ासले, अक्षर-कूट और जादुई वर्ग — नियम पकड़ना और उस पर एक क़दम आगे चलना।",
        },
        mr: {
          name: "आकृतिबंधांचा खेळ",
          summary: "पुनरावृत्त पावले, वाढती अंतरे, अक्षर-संकेत आणि जादूचे चौरस — नियम शोधणे आणि त्यावर एक पाऊल पुढे जाणे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 14 — Smart Charts (tally marks, pictographs, reading data)        */
/* ------------------------------------------------------------------------- */
function smartCharts4(): TopicFileOut {
  const rand = rng("maths-4-smart-charts");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A tally shows one full bundle of five and two single marks: ¦¦¦¦ ||. What count is that?",
          hi: "मिलान-चिह्नों में पाँच का एक पूरा बंडल और दो अकेली रेखाएँ हैं: ¦¦¦¦ ||। गिनती कितनी हुई?",
          mr: "ताळ-खुणांत पाचाचा एक पूर्ण गठ्ठा आणि दोन सुट्या रेघा आहेत: ¦¦¦¦ ||. मोजणी किती झाली?",
        },
        answer: 7,
        wrong: [6, 52, 10],
        checkExpr: "5+2",
        solution: {
          en: "A crossed bundle is worth 5, plus the 2 singles: 5 + 2 = 7. 52 reads 'five and two' as digits — tally bundles add, they do not sit side by side.",
          hi: "कटा बंडल 5 का है, ऊपर से 2 अकेली: 5 + 2 = 7। 52 'पाँच और दो' को अंक मानकर पढ़ता है — मिलान के बंडल जुड़ते हैं, अग़ल-बग़ल नहीं बैठते।",
          mr: "आडवी रेघ मारलेला गठ्ठा 5 चा, शिवाय 2 सुट्या: 5 + 2 = 7. 52 'पाच आणि दोन' अंक म्हणून वाचते — ताळाचे गठ्ठे मिळवले जातात, शेजारी बसत नाहीत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The fruit chart says 12 children like mango and 8 like banana. How many MORE like mango?",
          hi: "फल-चार्ट कहता है 12 बच्चों को आम पसंद है और 8 को केला। आम वालों की गिनती कितनी ज़्यादा है?",
          mr: "फळ-तक्ता सांगतो 12 मुलांना आंबा आवडतो आणि 8 जणांना केळे. आंबेवाले किती जास्त?",
        },
        answer: 4,
        wrong: [20, 8, 3],
        checkExpr: "12-8",
        solution: {
          en: "The gap between the bars: 12 − 8 = 4 children. 20 adds the bars — 'how many more' asks for the difference, not the crowd.",
          hi: "पट्टियों के बीच का फ़ासला: 12 − 8 = 4 बच्चे। 20 पट्टियाँ जोड़ देता है — 'कितने ज़्यादा' अंतर पूछता है, भीड़ नहीं।",
          mr: "पट्ट्यांमधले अंतर: 12 − 8 = 4 मुले. 20 पट्ट्या मिळवते — 'किती जास्त' फरक विचारते, गर्दी नव्हे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In a pictograph, one ball symbol stands for 2 children. Cricket's row shows 5 balls. How many children chose cricket?",
          hi: "चित्र-चार्ट में गेंद का एक चिह्न 2 बच्चों का है। क्रिकेट की पंक्ति में 5 गेंदें हैं। कितने बच्चों ने क्रिकेट चुना?",
          mr: "चित्र-तक्त्यात चेंडूचे एक चिन्ह 2 मुलांचे आहे. क्रिकेटच्या ओळीत 5 चेंडू आहेत. किती मुलांनी क्रिकेट निवडले?",
        },
        answer: 10,
        wrong: [5, 7, 25],
        checkExpr: "2*5",
        solution: {
          en: "Five symbols worth 2 each: 2 × 5 = 10 children. 5 counts the pictures, not the children they stand for — a pictograph always names its rate.",
          hi: "2-2 के पाँच चिह्न: 2 × 5 = 10 बच्चे। 5 तस्वीरें गिनता है, जिन बच्चों की वे जगह लेती हैं उन्हें नहीं — चित्र-चार्ट हमेशा अपना भाव बताता है।",
          mr: "2-2 ची पाच चिन्हे: 2 × 5 = 10 मुले. 5 चित्रे मोजते, ती ज्यांच्या जागी आहेत ती मुले नव्हे — चित्र-तक्ता नेहमी आपला भाव सांगतो.",
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
          en: "The absent-list says: Monday 3, Tuesday 5, Wednesday 2. How many absences in the three days?",
          hi: "अनुपस्थिति-सूची कहती है: सोमवार 3, मंगलवार 5, बुधवार 2। तीन दिनों में कुल कितनी अनुपस्थितियाँ?",
          mr: "गैरहजेरी-यादी सांगते: सोमवार 3, मंगळवार 5, बुधवार 2. तीन दिवसांत एकूण किती गैरहजेऱ्या?",
        },
        answer: 10,
        wrong: [8, 12, 352],
        checkExpr: "3+5+2",
        solution: {
          en: "Add the days: 3 + 5 + 2 = 10. 8 drops Wednesday; 352 lines the digits up instead of adding them.",
          hi: "दिन जोड़िए: 3 + 5 + 2 = 10। 8 बुधवार गिरा देता है; 352 अंकों को जोड़ने की जगह क़तार में खड़ा कर देता है।",
          mr: "दिवस मिळवा: 3 + 5 + 2 = 10. 8 बुधवार गाळते; 352 अंक मिळवण्याऐवजी रांगेत उभे करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the tree survey, one leaf symbol = 10 trees. The neem row shows 4 leaves. How many neem trees were counted?",
          hi: "पेड़ों की गिनती में पत्ती का एक चिह्न = 10 पेड़। नीम की पंक्ति में 4 पत्तियाँ हैं। कितने नीम गिने गए?",
          mr: "झाडांच्या मोजणीत पानाचे एक चिन्ह = 10 झाडे. कडुनिंबाच्या ओळीत 4 पाने आहेत. किती कडुनिंब मोजले गेले?",
        },
        answer: 40,
        wrong: [4, 14, 400],
        checkExpr: "10*4",
        solution: {
          en: "Four symbols of 10: 10 × 4 = 40 trees. 14 adds the rate to the symbols; 400 gives each leaf a hundred trees it never promised.",
          hi: "10-10 के चार चिह्न: 10 × 4 = 40 पेड़। 14 भाव को चिह्नों में जोड़ देता है; 400 हर पत्ती को सौ पेड़ थमा देता है, जिनका वादा उसने कभी नहीं किया।",
          mr: "10-10 ची चार चिन्हे: 10 × 4 = 40 झाडे. 14 भाव चिन्हांत मिळवते; 400 प्रत्येक पानाला शंभर झाडे देते, जी त्याने कधी कबूल केली नव्हती.",
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
          en: "The games vote: kho-kho 14, cricket 12, kabaddi 9. By how many votes did the winner beat the second place?",
          hi: "खेलों का मतदान: खो-खो 14, क्रिकेट 12, कबड्डी 9। विजेता ने दूसरे स्थान को कितने मतों से हराया?",
          mr: "खेळांचे मतदान: खो-खो 14, क्रिकेट 12, कबड्डी 9. विजेत्याने दुसऱ्या क्रमांकाला किती मतांनी हरवले?",
        },
        answer: 2,
        wrong: [5, 3, 26],
        checkExpr: "14-12",
        solution: {
          en: "Winner kho-kho (14), second cricket (12): 14 − 12 = 2 votes. 5 compares the winner with LAST place — read the chart's order before subtracting.",
          hi: "विजेता खो-खो (14), दूसरा क्रिकेट (12): 14 − 12 = 2 मत। 5 विजेता की तुलना आख़िरी स्थान से करता है — घटाने से पहले चार्ट का क्रम पढ़िए।",
          mr: "विजेता खो-खो (14), दुसरा क्रिकेट (12): 14 − 12 = 2 मते. 5 विजेत्याची तुलना शेवटच्या क्रमांकाशी करते — वजा करण्याआधी तक्त्याचा क्रम वाचा.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "60 children were asked how they reach school: 25 walk, 20 cycle, the rest come by bus. How many come by bus?",
          hi: "60 बच्चों से पूछा गया कि वे स्कूल कैसे आते हैं: 25 पैदल, 20 साइकिल से, बाक़ी बस से। बस से कितने आते हैं?",
          mr: "60 मुलांना विचारले शाळेत कसे येता: 25 चालत, 20 सायकलने, उरलेले बसने. बसने किती येतात?",
        },
        answer: 15,
        wrong: [45, 35, 20],
        checkExpr: "60-25-20",
        solution: {
          en: "The bus children are what the chart did not name yet: 60 − 25 − 20 = 15. 45 removes only the walkers — the cyclists have also answered.",
          hi: "बस वाले वे हैं जिन्हें चार्ट ने अभी नाम नहीं दिया: 60 − 25 − 20 = 15। 45 केवल पैदल वालों को हटाता है — साइकिल वाले भी उत्तर दे चुके हैं।",
          mr: "बसवाली मुले म्हणजे तक्त्याने अजून नाव न दिलेली: 60 − 25 − 20 = 15. 45 फक्त चालणाऱ्यांना काढते — सायकलवाल्यांनीही उत्तर दिले आहे.",
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
          en: "In the library pictograph, one book symbol = 4 books. The story-shelf row shows 7 symbols and one HALF symbol. How many books is that?",
          hi: "पुस्तकालय के चित्र-चार्ट में किताब का एक चिह्न = 4 किताबें। कहानी-रैक की पंक्ति में 7 चिह्न और एक आधा चिह्न है। यह कितनी किताबें हुईं?",
          mr: "वाचनालयाच्या चित्र-तक्त्यात पुस्तकाचे एक चिन्ह = 4 पुस्तके. गोष्टींच्या मांडणीच्या ओळीत 7 चिन्हे आणि एक अर्धे चिन्ह आहे. ती किती पुस्तके?",
        },
        answer: 30,
        wrong: [28, 32, 15],
        checkExpr: "4*7+4/2",
        solution: {
          en: "Seven full symbols: 4 × 7 = 28, and the half symbol adds half of 4, i.e. 2: 28 + 2 = 30 books. 28 ignores the half; 32 rounds it up to a full symbol it never was.",
          hi: "सात पूरे चिह्न: 4 × 7 = 28, और आधा चिह्न 4 का आधा यानी 2 जोड़ता है: 28 + 2 = 30 किताबें। 28 आधे को अनदेखा करता है; 32 उसे पूरा चिह्न बना देता है, जो वह कभी था नहीं।",
          mr: "सात पूर्ण चिन्हे: 4 × 7 = 28, आणि अर्धे चिन्ह 4 चा अर्धा म्हणजे 2 मिळवते: 28 + 2 = 30 पुस्तके. 28 अर्ध्याकडे दुर्लक्ष करते; 32 त्याला कधी नव्हते ते पूर्ण चिन्ह करते.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The rainfall chart shows July got 90 mm and August got double July's. How much rain fell in August?",
          hi: "वर्षा-चार्ट दिखाता है जुलाई में 90 मिमी और अगस्त में जुलाई का दुगना। अगस्त में कितनी बारिश हुई?",
          mr: "पर्जन्य-तक्ता दाखवतो जुलैत 90 मिमी आणि ऑगस्टात जुलैच्या दुप्पट. ऑगस्टात किती पाऊस पडला?",
        },
        answer: 180,
        wrong: [92, 45, 190],
        checkExpr: "90*2",
        solution: {
          en: "Double of July: 90 × 2 = 180 mm. 45 halves it — 'double' climbs, never descends; 92 adds the 2 as millimetres.",
          hi: "जुलाई का दुगना: 90 × 2 = 180 मिमी। 45 आधा कर देता है — 'दुगना' चढ़ता है, उतरता कभी नहीं; 92 दो को मिलीमीटर बनाकर जोड़ देता है।",
          mr: "जुलैच्या दुप्पट: 90 × 2 = 180 मिमी. 45 अर्धे करते — 'दुप्पट' चढते, कधी उतरत नाही; 92 दोनाला मिलिमीटर करून मिळवते.",
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
          en: "A class chart counts 35 children in all, and it shows 5 more girls than boys. How many boys are there?",
          hi: "कक्षा-चार्ट कुल 35 बच्चे गिनता है, और लड़कियाँ लड़कों से 5 ज़्यादा दिखाता है। लड़के कितने हैं?",
          mr: "वर्ग-तक्ता एकूण 35 मुले मोजतो, आणि मुली मुलग्यांहून 5 जास्त दाखवतो. मुलगे किती?",
        },
        answer: 15,
        wrong: [20, 17, 30],
        checkExpr: "(35-5)/2",
        solution: {
          en: "Set the extra 5 girls aside: 35 − 5 = 30 splits evenly, 15 boys and 15 girls; return the 5 and the girls are 20. So boys = 15 — and 20 is the girls' number, the trap answer sitting one step further.",
          hi: "ऊपर की 5 लड़कियाँ अलग रखिए: 35 − 5 = 30 बराबर बँटता है, 15 लड़के और 15 लड़कियाँ; 5 लौटाइए तो लड़कियाँ 20। लड़के = 15 — और 20 लड़कियों की गिनती है, एक क़दम आगे बैठा फंदा।",
          mr: "वरच्या 5 मुली बाजूला ठेवा: 35 − 5 = 30 सारखे वाटले जाते, 15 मुलगे आणि 15 मुली; 5 परत द्या की मुली 20. मुलगे = 15 — आणि 20 ही मुलींची संख्या, एक पाऊल पुढे बसलेला सापळा.",
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
          en: "50 votes were cast for the class monitor. The counter's chart records 18 for Asha, 14 for Bina and 12 for Chand — and then he stops. How many votes has his chart lost?",
          hi: "कक्षा-मॉनिटर के लिए 50 मत पड़े। गिनने वाले के चार्ट में आशा के 18, बीना के 14 और चाँद के 12 दर्ज हैं — और फिर वह रुक जाता है। उसके चार्ट ने कितने मत खो दिए?",
          mr: "वर्ग-मॉनिटरसाठी 50 मते पडली. मोजणाऱ्याच्या तक्त्यात आशाची 18, बिनाची 14 आणि चांदची 12 नोंदली — आणि मग तो थांबतो. त्याच्या तक्त्याने किती मते गमावली?",
        },
        answer: 6,
        wrong: [44, 4, 16],
        checkExpr: "50-18-14-12",
        solution: {
          en: "Recorded: 18 + 14 + 12 = 44. Cast: 50. Missing: 50 − 44 = 6 votes. A chart is only honest if its parts return the total: checking the sum against the whole is how you catch a chart that quietly dropped somebody's votes.",
          hi: "दर्ज: 18 + 14 + 12 = 44। पड़े: 50। ग़ायब: 50 − 44 = 6 मत। चार्ट तभी ईमानदार है जब उसके हिस्से कुल लौटा दें — जोड़ को कुल से मिलाना ही वह तरीक़ा है जिससे चुपचाप मत गिराता चार्ट पकड़ा जाता है।",
          mr: "नोंदले: 18 + 14 + 12 = 44. पडली: 50. गहाळ: 50 − 44 = 6 मते. तक्ता तेव्हाच प्रामाणिक, जेव्हा त्याचे भाग एकूण परत देतात — बेरीज एकुणाशी ताडणे हाच गुपचूप मते गाळणारा तक्ता पकडण्याचा मार्ग.",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      subject: "MATHS",
      classLevel: 4,
      chapter: "Chapter 14 — Smart Charts",
      name: "Smart Charts",
      slug: "maths-4-smart-charts",
      summary: "Tally bundles, pictograph rates and bars compared — reading what a chart says, and checking whether it kept every vote.",
      position: 14,
      translations: {
        hi: {
          name: "स्मार्ट चार्ट",
          summary: "मिलान के बंडल, चित्र-चार्ट के भाव और पट्टियों की तुलना — चार्ट जो कहता है उसे पढ़ना, और परखना कि उसने हर मत सँभाला या नहीं।",
        },
        mr: {
          name: "स्मार्ट तक्ते",
          summary: "ताळाचे गठ्ठे, चित्र-तक्त्यांचे भाव आणि पट्ट्यांची तुलना — तक्ता काय सांगतो ते वाचणे, आणि त्याने प्रत्येक मत सांभाळले का हे ताडणे.",
        },
      },
    },
    qs,
  );
}

export const G4_MATHS: TopicFileOut[] = [
  buildingWithBricks(),
  longAndShort4(),
  aTripToBhopal(),
  tickTickTick(),
  theWayTheWorldLooks(),
  theJunkSeller(),
  jugsAndMugs4(),
  cartsAndWheels(),
  halvesAndQuarters(),
  playWithPatterns4(),
  tablesAndShares4(),
  howHeavyHowLight(),
  fieldsAndFences(),
  smartCharts4(),
];
