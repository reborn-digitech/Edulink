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

export const G4_MATHS: TopicFileOut[] = [
  buildingWithBricks(),
  longAndShort4(),
  tickTickTick(),
  theJunkSeller(),
  jugsAndMugs4(),
  halvesAndQuarters(),
  tablesAndShares4(),
  howHeavyHowLight(),
  fieldsAndFences(),
];
