/**
 * Class 11 Physics — NCERT, chapter by chapter, and the first chapter of the
 * bank where one topic must be BOTH kinds of question at once.
 *
 * Up to Class 10, a chapter was conceptual or computed and never both: history
 * ran through the fact engine, maths through the numeric module. Class 11
 * physics does not divide that way. A student revising projectiles needs the
 * idea that the horizontal and vertical motions do not talk to each other AND
 * the range of a 20 m/s throw at 30°, and splitting those into two topic cards
 * would be an artefact of this code rather than of the subject. So each chapter
 * here is a conceptual ladder from `generateChapter` with computed problems
 * appended by `withNumeric` — every one of those carrying a checkExpr the
 * verifier evaluates, so the quantitative half is proven arithmetic and the
 * conceptual half stays honestly unproven.
 *
 * Entity names deliberately avoid the Class 9 motion vocabulary ("Speed and
 * velocity", "The first law and inertia"). Class 11 is not Class 9 louder: it
 * asks what an inertial frame IS, why a third-law pair can never cancel, and
 * what a measurement's last digit is entitled to claim.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";
import type { NumQ } from "./numeric";
import { unit } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Physics Part I (Class 11)";
const LICENCE = "CC-BY-SA-4.0";

const ms = unit("m/s");
const metres = unit("m");
const seconds = unit("s");
const newtons = unit("N");

export const G11_PHYSICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Units and Measurements                                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-units-and-measurements",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 1 — Units and Measurements",
      hi: "अध्याय 1 — मात्रक और मापन",
      mr: "प्रकरण 1 — एकके आणि मापन",
    },
    name: {
      en: "Units and Measurements",
      hi: "मात्रक और मापन",
      mr: "एकके आणि मापन",
    },
    summary: {
      en: "Before any physics can be checked it has to be stated in numbers somebody else can reproduce: seven quantities everything else is built from, a metre that stopped being a bar in Paris and became a property of light, an equation that can be refused for its dimensions alone, digits a measurement has earned and digits it has merely printed, and two kinds of error — one that repetition cures and one that repetition hides.",
      hi: "कोई भी भौतिकी जाँची जा सके, उससे पहले उसे ऐसी संख्याओं में कहना पड़ता है जिन्हें कोई और दोहरा सके: सात राशियाँ जिनसे बाक़ी सब बनता है, वह मीटर जो पेरिस की छड़ होना छोड़कर प्रकाश का गुण बन गया, वह समीकरण जिसे केवल उसकी विमाओं के आधार पर लौटाया जा सकता है, वे अंक जो माप ने कमाए और वे जो उसने बस छाप दिए, और दो तरह की त्रुटियाँ — एक जिसे दोहराव मिटाता है और एक जिसे दोहराव छिपाता है।",
      mr: "कोणतीही भौतिकी तपासली जाण्याआधी ती अशा संख्यांत मांडावी लागते ज्या दुसरा कोणी पुन्हा मिळवू शकेल: सात राशी ज्यांतून बाकी सर्व बांधले जाते, तो मीटर जो पॅरिसमधील पट्टी असणे सोडून प्रकाशाचा गुणधर्म बनला, ते समीकरण जे केवळ त्याच्या मितींवरून नाकारता येते, ते अंक जे मापाने कमावले आणि जे त्याने नुसते छापले, आणि दोन प्रकारच्या त्रुटी — एक जी पुनरावृत्ती मिटवते आणि एक जी पुनरावृत्ती लपवते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "si-base-quantities",
        name: {
          en: "The seven base quantities",
          hi: "सात मूल राशियाँ",
          mr: "सात मूलभूत राशी",
        },
        kind: "convention",
        prompt: {
          en: "Length, mass, time, electric current, temperature, amount of substance and luminous intensity are chosen as independent, and every other unit in the system is built by multiplying and dividing these. What are these seven called?",
          hi: "लंबाई, द्रव्यमान, समय, विद्युत धारा, ताप, पदार्थ की मात्रा और ज्योति तीव्रता को स्वतंत्र चुना जाता है, और तंत्र का हर दूसरा मात्रक इन्हीं को गुणा-भाग करके बनता है। ये सात क्या कहलाती हैं?",
          mr: "लांबी, वस्तुमान, काळ, विद्युतधारा, तापमान, पदार्थाचे प्रमाण आणि प्रकाशतीव्रता ही स्वतंत्र म्हणून निवडली जातात, आणि प्रणालीतले बाकी प्रत्येक एकक यांनाच गुणून-भागून बनते. या सातांना काय म्हणतात?",
        },
        statement: {
          en: "The seven base quantities are the ones SI declares independent, and every derived unit — the newton, the joule, the volt — is a product of their powers rather than a fresh standard of its own.",
          hi: "सात मूल राशियाँ वे हैं जिन्हें SI स्वतंत्र घोषित करता है, और हर व्युत्पन्न मात्रक — न्यूटन, जूल, वोल्ट — उनकी घातों का गुणनफल है, अपना कोई नया मानक नहीं।",
          mr: "सात मूलभूत राशी त्या ज्यांना SI स्वतंत्र घोषित करते, आणि प्रत्येक साधित एकक — न्यूटन, ज्यूल, व्होल्ट — त्यांच्या घातांचा गुणाकार असते, स्वतःचे नवे मानक नव्हे.",
        },
        detail: {
          en: "Nothing in nature marks these seven out; the choice is a convention, and a system could have been built on force instead of mass without any experiment coming out differently.",
          hi: "प्रकृति में कुछ भी इन सातों को अलग नहीं ठहराता; यह चुनाव एक परिपाटी है, और द्रव्यमान के बजाय बल पर तंत्र खड़ा किया जा सकता था, बिना किसी प्रयोग का परिणाम बदले।",
          mr: "निसर्गात यां सातांना वेगळे ठरवणारे काहीही नाही; ही निवड एक संकेत आहे, आणि वस्तुमानाऐवजी बलावर प्रणाली उभी करता आली असती, कोणत्याही प्रयोगाचा निकाल न बदलता.",
        },
        extra: {
          en: "What is not conventional is the requirement that the set be complete and non-redundant: too few and some measurement cannot be expressed, too many and two standards could disagree about the same quantity.",
          hi: "जो परिपाटी नहीं है वह यह माँग है कि समुच्चय पूर्ण हो और अनावश्यक न हो: बहुत कम हों तो कोई माप व्यक्त ही न हो सके, बहुत अधिक हों तो एक ही राशि पर दो मानक आपस में असहमत हो सकते हैं।",
          mr: "जे संकेत नाही ते ही मागणी की संच पूर्ण असावा आणि अनावश्यक नसावा: फार थोडे असतील तर एखादे माप व्यक्तच होणार नाही, फार जास्त असतील तर एकाच राशीवर दोन मानके परस्परविरोधी असू शकतात.",
        },
        pair: {
          left: {
            en: "Independent by declaration, not by nature",
            hi: "घोषणा से स्वतंत्र, प्रकृति से नहीं",
            mr: "घोषणेने स्वतंत्र, निसर्गाने नव्हे",
          },
          right: {
            en: "the seven base quantities",
            hi: "सात मूल राशियाँ",
            mr: "सात मूलभूत राशी",
          },
        },
      },
      {
        id: "metre-by-light",
        name: {
          en: "The metre defined by light",
          hi: "प्रकाश से परिभाषित मीटर",
          mr: "प्रकाशाने व्याख्यायित मीटर",
        },
        kind: "convention",
        prompt: {
          en: "The unit's standard was moved off a platinum-iridium bar and onto the distance light travels in vacuum in one part in 299,792,458 of a second, so that any laboratory with a clock and a laser can rebuild it. Which definition is this?",
          hi: "मात्रक का मानक प्लैटिनम-इरिडियम की छड़ से हटाकर उस दूरी पर रखा गया जो प्रकाश निर्वात में सेकंड के 299,792,458वें भाग में तय करता है, ताकि घड़ी और लेज़र वाली कोई भी प्रयोगशाला उसे फिर से बना सके। यह कौन-सी परिभाषा है?",
          mr: "एककाचे मानक प्लॅटिनम-इरिडियमच्या पट्टीवरून हलवून त्या अंतरावर ठेवले गेले जे प्रकाश निर्वातात सेकंदाच्या 299,792,458व्या भागात कापतो, म्हणजे घड्याळ आणि लेझर असलेली कोणतीही प्रयोगशाळा ते पुन्हा उभे करू शकेल. ही कोणती व्याख्या?",
        },
        statement: {
          en: "The metre is defined as the path length light travels in vacuum in one part in 299,792,458 of a second, which makes the speed of light an exact defined number rather than something still being measured.",
          hi: "मीटर वह पथ-लंबाई है जो प्रकाश निर्वात में सेकंड के 299,792,458वें भाग में तय करता है, जिससे प्रकाश की चाल एक ठीक-ठीक परिभाषित संख्या बन जाती है, अब भी नापी जा रही राशि नहीं।",
          mr: "मीटर म्हणजे प्रकाश निर्वातात सेकंदाच्या 299,792,458व्या भागात कापणारी पथलांबी, ज्यामुळे प्रकाशाचा वेग एक नेमकी व्याख्यायित संख्या बनतो, अजून मोजली जात असलेली राशी नव्हे.",
        },
        detail: {
          en: "A standard kept as an object can be scratched, can drift and exists in one country; a standard written as a property of nature can be rebuilt anywhere and cannot be lost in a fire.",
          hi: "वस्तु के रूप में रखा मानक खरोंचा जा सकता है, खिसक सकता है और एक ही देश में रहता है; प्रकृति के गुण के रूप में लिखा मानक कहीं भी फिर बनाया जा सकता है और आग में खोया नहीं जा सकता।",
          mr: "वस्तू म्हणून ठेवलेले मानक ओरखडले जाऊ शकते, सरकू शकते आणि एकाच देशात राहते; निसर्गाचा गुणधर्म म्हणून लिहिलेले मानक कुठेही पुन्हा उभे करता येते आणि आगीत हरवत नाही.",
        },
        extra: {
          en: "The consequence is that improving our measurement of light's speed no longer changes the number 299,792,458 — it changes how accurately we can realise the metre.",
          hi: "परिणाम यह कि प्रकाश की चाल के हमारे माप में सुधार अब 299,792,458 संख्या को नहीं बदलता — वह यह बदलता है कि हम मीटर को कितनी शुद्धता से साकार कर पाते हैं।",
          mr: "परिणाम असा की प्रकाशाच्या वेगाच्या आपल्या मापातील सुधारणा आता 299,792,458 हा आकडा बदलत नाही — ती हे बदलते की आपण मीटर किती अचूकपणे साकार करू शकतो.",
        },
        pair: {
          left: {
            en: "A standard nobody can drop or scratch",
            hi: "ऐसा मानक जिसे कोई गिरा या खरोंच नहीं सकता",
            mr: "असे मानक जे कोणी पाडू वा ओरखडू शकत नाही",
          },
          right: {
            en: "the metre defined by light",
            hi: "प्रकाश से परिभाषित मीटर",
            mr: "प्रकाशाने व्याख्यायित मीटर",
          },
        },
      },
      {
        id: "dimensional-homogeneity",
        name: {
          en: "Dimensional homogeneity",
          hi: "विमीय समांगता",
          mr: "मितीय समांगता",
        },
        kind: "method",
        prompt: {
          en: "Every term added on either side of a physical equation must carry the same combination of M, L and T, so an equation can be thrown out as wrong without any experiment and without knowing what the symbols mean. Which requirement is this?",
          hi: "भौतिक समीकरण के किसी भी पक्ष में जोड़ा गया हर पद M, L और T का एक ही संयोजन रखना चाहिए, अतः किसी प्रयोग के बिना और प्रतीकों का अर्थ जाने बिना ही समीकरण ग़लत ठहराकर हटाया जा सकता है। यह कौन-सी शर्त है?",
          mr: "भौतिक समीकरणाच्या कोणत्याही बाजूला जोडलेल्या प्रत्येक पदाने M, L आणि T चे एकच संयोजन बाळगावे लागते, म्हणून कोणत्याही प्रयोगाशिवाय आणि चिन्हांचा अर्थ न जाणताही समीकरण चूक ठरवून बाजूला करता येते. ही कोणती अट?",
        },
        statement: {
          en: "Dimensional homogeneity requires every additive term in an equation to have identical dimensions, which lets a wrong formula be rejected on inspection but can never confirm a right one.",
          hi: "विमीय समांगता माँगती है कि समीकरण के हर जोड़े जाने वाले पद की विमाएँ एक-सी हों, जिससे ग़लत सूत्र देखते ही अस्वीकार हो सकता है पर सही सूत्र कभी सिद्ध नहीं होता।",
          mr: "मितीय समांगता मागते की समीकरणातील प्रत्येक जोडल्या जाणाऱ्या पदाच्या मिती सारख्या असाव्यात, ज्यामुळे चुकीचे सूत्र पाहताक्षणी नाकारता येते पण बरोबर सूत्र कधीच सिद्ध होत नाही.",
        },
        detail: {
          en: "It is blind to pure numbers: it cannot tell ½at² from 2at², and it cannot see a missing sine or a wrong factor of π, because none of those carry dimensions.",
          hi: "यह शुद्ध संख्याओं के प्रति अंधी है: वह ½at² और 2at² में भेद नहीं कर सकती, न लुप्त ज्या या π का ग़लत गुणक देख सकती है, क्योंकि इनमें से कोई विमा नहीं रखता।",
          mr: "ती शुद्ध संख्यांबाबत आंधळी आहे: ती ½at² आणि 2at² यांत फरक करू शकत नाही, ना हरवलेले साइन वा π चा चुकीचा गुणक पाहू शकते, कारण यांपैकी काहीही मिती बाळगत नाही.",
        },
        extra: {
          en: "It also fixes the form of a dependence: knowing a pendulum's period can involve only length and g forces the answer to be proportional to the square root of l/g, leaving only a number to be found.",
          hi: "यह निर्भरता का रूप भी तय करती है: यह जानना कि लोलक का आवर्तकाल केवल लंबाई और g पर निर्भर हो सकता है, उत्तर को l/g के वर्गमूल का समानुपाती बना देता है, और खोजने को केवल एक संख्या बचती है।",
          mr: "ती अवलंबित्वाचा आकारही ठरवते: लंबकाचा आवर्तकाल केवळ लांबी आणि g वर अवलंबू शकतो हे जाणणे उत्तराला l/g च्या वर्गमुळाशी समानुपाती बनवते, आणि शोधायला फक्त एक संख्या उरते.",
        },
        pair: {
          left: {
            en: "Can refuse a formula, can never bless one",
            hi: "सूत्र लौटा सकती है, स्वीकृति कभी नहीं दे सकती",
            mr: "सूत्र नाकारू शकते, मान्यता कधीच देऊ शकत नाही",
          },
          right: {
            en: "dimensional homogeneity",
            hi: "विमीय समांगता",
            mr: "मितीय समांगता",
          },
        },
      },
      {
        id: "significant-figures",
        name: {
          en: "Significant figures",
          hi: "सार्थक अंक",
          mr: "सार्थक अंक",
        },
        kind: "method",
        prompt: {
          en: "A length written as 2.30 m claims something a length written as 2.3 m does not, and a product of the two may not be reported with more digits than the poorer factor carried. Which convention is this?",
          hi: "2.30 m लिखी लंबाई वह दावा करती है जो 2.3 m लिखी लंबाई नहीं करती, और दोनों का गुणनफल उससे अधिक अंकों में नहीं बताया जा सकता जितने कमज़ोर गुणक में थे। यह कौन-सी परिपाटी है?",
          mr: "2.30 m लिहिलेली लांबी तो दावा करते जो 2.3 m लिहिलेली करत नाही, आणि दोहोंचा गुणाकार कमकुवत गुणकात असलेल्या अंकांहून अधिक अंकांत सांगता येत नाही. ही कोणती संकेतपद्धत?",
        },
        statement: {
          en: "Significant figures are the digits a measurement has actually earned, so a result of a multiplication or division carries as many of them as the least precise quantity that went into it.",
          hi: "सार्थक अंक वे अंक हैं जो माप ने वस्तुतः कमाए हैं, अतः गुणा या भाग का परिणाम उतने ही अंक रखता है जितने उसमें गए सबसे कम परिशुद्ध राशि में थे।",
          mr: "सार्थक अंक म्हणजे मापाने प्रत्यक्षात कमावलेले अंक, म्हणून गुणाकार वा भागाकाराचा निकाल तितकेच अंक बाळगतो जितके त्यात गेलेल्या सर्वांत कमी अचूक राशीत होते.",
        },
        detail: {
          en: "Trailing zeros after a decimal point are significant and leading zeros are not, so 0.00340 carries three and 2.30 carries three, while 2.3 carries two.",
          hi: "दशमलव के बाद के अंतिम शून्य सार्थक हैं और आरंभिक शून्य नहीं, अतः 0.00340 में तीन हैं और 2.30 में तीन, जबकि 2.3 में दो।",
          mr: "दशांशानंतरची शेवटची शून्ये सार्थक असतात आणि सुरुवातीची नसतात, म्हणून 0.00340 मध्ये तीन आणि 2.30 मध्ये तीन, तर 2.3 मध्ये दोन.",
        },
        extra: {
          en: "For addition and subtraction the rule changes to decimal places rather than digits, because what limits a sum is where the coarsest measurement stopped, not how many figures it had.",
          hi: "जोड़ और घटाव के लिए नियम अंकों के बजाय दशमलव स्थानों का हो जाता है, क्योंकि योग को वह सीमित करता है जहाँ सबसे मोटा माप रुका था, न कि उसमें कितने अंक थे।",
          mr: "बेरीज आणि वजाबाकीसाठी नियम अंकांऐवजी दशांश स्थानांचा होतो, कारण बेरजेला ते मर्यादित करते जिथे सर्वांत ढोबळ माप थांबले, त्यात किती अंक होते ते नव्हे.",
        },
        pair: {
          left: {
            en: "A result may not be more precise than its worst input",
            hi: "परिणाम अपने सबसे बुरे निवेश से अधिक परिशुद्ध नहीं हो सकता",
            mr: "निकाल त्याच्या सर्वांत वाईट निविष्टाहून अधिक अचूक असू शकत नाही",
          },
          right: {
            en: "significant figures",
            hi: "सार्थक अंक",
            mr: "सार्थक अंक",
          },
        },
      },
      {
        id: "systematic-error",
        name: {
          en: "Systematic error",
          hi: "व्यवस्थित त्रुटि",
          mr: "पद्धतशीर त्रुटी",
        },
        kind: "error",
        prompt: {
          en: "A balance whose pointer rests at 2 g with nothing on the pan adds 2 g to every reading, in the same direction, however many times the weighing is repeated. Which kind of error is this?",
          hi: "वह तराज़ू जिसका काँटा पलड़े पर कुछ न होने पर भी 2 g दिखाता है, हर पाठ्यांक में 2 g जोड़ देता है, उसी दिशा में, चाहे तौल कितनी ही बार दोहराई जाए। यह कौन-सी त्रुटि है?",
          mr: "ज्या तराजूचा काटा पारड्यावर काहीही नसताना 2 g दाखवतो तो प्रत्येक वाचनात 2 g जोडतो, त्याच दिशेने, वजन कितीही वेळा पुन्हा केले तरी. ही कोणत्या प्रकारची त्रुटी?",
        },
        statement: {
          en: "A systematic error pushes every reading the same way by the same amount, so averaging many trials cannot remove it and the mean is confidently wrong.",
          hi: "व्यवस्थित त्रुटि हर पाठ्यांक को एक ही दिशा में उतना ही खिसकाती है, अतः कई प्रयासों का औसत उसे हटा नहीं सकता और माध्य आत्मविश्वास के साथ ग़लत रहता है।",
          mr: "पद्धतशीर त्रुटी प्रत्येक वाचनाला एकाच दिशेने तितकेच सरकवते, म्हणून अनेक प्रयत्नांची सरासरी ती काढू शकत नाही आणि मध्य आत्मविश्वासाने चुकीचा राहतो.",
        },
        detail: {
          en: "Its usual sources are a zero that was never checked, an instrument calibrated against a faulty standard, and a method whose assumption quietly fails — a stopwatch started on the sound of a distant gun rather than its flash.",
          hi: "इसके सामान्य स्रोत हैं वह शून्य जो कभी जाँचा ही नहीं गया, दोषपूर्ण मानक के सामने अंशांकित यंत्र, और वह विधि जिसकी मान्यता चुपचाप गिर जाती है — दूर की बंदूक की चमक के बजाय उसकी आवाज़ पर चलाई गई विरामघड़ी।",
          mr: "तिचे नेहमीचे स्रोत म्हणजे कधीही न तपासलेले शून्य, सदोष मानकासमोर अंशांकित केलेले उपकरण, आणि ती पद्धत जिचे गृहीतक गुपचूप कोसळते — दूरच्या बंदुकीच्या चमकेऐवजी तिच्या आवाजावर सुरू केलेले थांबघड्याळ.",
        },
        extra: {
          en: "It is found not by repeating the measurement but by changing something about the method — a second instrument, a different observer, the same quantity measured a different way.",
          hi: "यह माप दोहराकर नहीं बल्कि विधि में कुछ बदलकर पकड़ी जाती है — दूसरा यंत्र, भिन्न प्रेक्षक, वही राशि किसी और ढंग से नापी गई।",
          mr: "ती माप पुन्हा करून नव्हे तर पद्धतीत काहीतरी बदलून सापडते — दुसरे उपकरण, वेगळा निरीक्षक, तीच राशी वेगळ्या मार्गाने मोजलेली.",
        },
        pair: {
          left: {
            en: "Repetition makes it more precise and no less wrong",
            hi: "दोहराव उसे अधिक परिशुद्ध बनाता है, कम ग़लत नहीं",
            mr: "पुनरावृत्ती तिला अधिक अचूक बनवते, कमी चुकीची नाही",
          },
          right: {
            en: "systematic error",
            hi: "व्यवस्थित त्रुटि",
            mr: "पद्धतशीर त्रुटी",
          },
        },
      },
      {
        id: "random-error",
        name: {
          en: "Random error",
          hi: "यादृच्छिक त्रुटि",
          mr: "यादृच्छिक त्रुटी",
        },
        kind: "error",
        prompt: {
          en: "Twenty students time the same pendulum and get twenty slightly different answers, scattered on both sides of the true value, because reaction time is sometimes early and sometimes late. Which kind of error is this?",
          hi: "बीस विद्यार्थी उसी लोलक का समय नापते हैं और बीस थोड़े-थोड़े भिन्न उत्तर पाते हैं, सच्चे मान के दोनों ओर बिखरे, क्योंकि प्रतिक्रिया-काल कभी जल्दी और कभी देर होता है। यह कौन-सी त्रुटि है?",
          mr: "वीस विद्यार्थी त्याच लंबकाचा काळ मोजतात आणि वीस थोडी थोडी वेगळी उत्तरे मिळवतात, खऱ्या मूल्याच्या दोन्ही बाजूंना विखुरलेली, कारण प्रतिक्रियाकाळ कधी लवकर तर कधी उशिरा असतो. ही कोणत्या प्रकारची त्रुटी?",
        },
        statement: {
          en: "A random error scatters readings on both sides of the true value with no fixed sign, so taking the mean of many trials shrinks it — roughly as the square root of the number of readings.",
          hi: "यादृच्छिक त्रुटि पाठ्यांकों को सच्चे मान के दोनों ओर बिना निश्चित चिह्न के बिखेरती है, अतः कई प्रयासों का माध्य लेने से वह घटती है — लगभग पाठ्यांकों की संख्या के वर्गमूल के अनुपात में।",
          mr: "यादृच्छिक त्रुटी वाचने खऱ्या मूल्याच्या दोन्ही बाजूंना निश्चित चिन्हाशिवाय विखुरते, म्हणून अनेक प्रयत्नांचा मध्य घेतल्याने ती घटते — साधारण वाचनांच्या संख्येच्या वर्गमुळाच्या प्रमाणात.",
        },
        detail: {
          en: "It is reported as the mean absolute deviation or the standard deviation about the mean, which is why a single reading is never quoted as a result in a laboratory record.",
          hi: "इसे माध्य निरपेक्ष विचलन या माध्य के परितः मानक विचलन के रूप में बताया जाता है, इसीलिए प्रयोगशाला अभिलेख में अकेला पाठ्यांक कभी परिणाम के रूप में नहीं लिखा जाता।",
          mr: "ती मध्य निरपेक्ष विचलन वा मध्याभोवतीचे प्रमाण विचलन म्हणून सांगितली जाते, म्हणूनच प्रयोगशाळेच्या नोंदीत एकटे वाचन कधीही निकाल म्हणून लिहिले जात नाही.",
        },
        extra: {
          en: "Averaging it away is the reason a careless experiment can look impressively repeatable and still be badly wrong: the scatter has been beaten down while a hidden bias sits untouched underneath.",
          hi: "इसे औसत से मिटा देना ही वह कारण है जिससे लापरवाह प्रयोग प्रभावशाली रूप से दोहराने-योग्य दिख सकता है और फिर भी बुरी तरह ग़लत हो: बिखराव दबा दिया गया जबकि छिपा हुआ पूर्वाग्रह नीचे अछूता बैठा है।",
          mr: "तिला सरासरीने मिटवणे हेच ते कारण ज्यामुळे निष्काळजी प्रयोग प्रभावीपणे पुनरावृत्तीयोग्य दिसू शकतो आणि तरीही वाईटरीत्या चुकीचा असतो: विखुरणे दाबले गेले तर लपलेला कल खाली अस्पर्श बसलेला असतो.",
        },
        pair: {
          left: {
            en: "Shrinks as the square root of the number of trials",
            hi: "प्रयासों की संख्या के वर्गमूल के अनुपात में घटती",
            mr: "प्रयत्नांच्या संख्येच्या वर्गमुळाच्या प्रमाणात घटणारी",
          },
          right: {
            en: "random error",
            hi: "यादृच्छिक त्रुटि",
            mr: "यादृच्छिक त्रुटी",
          },
        },
      },
      {
        id: "error-in-a-product",
        name: {
          en: "Error in a product",
          hi: "गुणनफल में त्रुटि",
          mr: "गुणाकारातील त्रुटी",
        },
        kind: "error",
        prompt: {
          en: "When quantities are multiplied or divided their percentage uncertainties add, and a quantity raised to a power contributes that power times its own percentage — so a cube of a 1% length is uncertain by 3%. Which rule is this?",
          hi: "जब राशियाँ गुणा या भाग की जाती हैं तो उनकी प्रतिशत अनिश्चितताएँ जुड़ती हैं, और घात पर उठाई गई राशि अपनी प्रतिशत का उतना गुना देती है — अतः 1% वाली लंबाई का घन 3% अनिश्चित होता है। यह कौन-सा नियम है?",
          mr: "जेव्हा राशी गुणल्या वा भागल्या जातात तेव्हा त्यांच्या शेकडा अनिश्चितता जोडल्या जातात, आणि घातावर नेलेली राशी स्वतःच्या शेकड्याच्या तितक्या पट देते — म्हणून 1% असलेल्या लांबीचा घन 3% अनिश्चित असतो. हा कोणता नियम?",
        },
        statement: {
          en: "In a product or quotient the fractional errors add, and an exponent multiplies the fractional error it acts on, so the most heavily powered quantity dominates the uncertainty of the result.",
          hi: "गुणनफल या भागफल में भिन्नात्मक त्रुटियाँ जुड़ती हैं, और घातांक जिस भिन्नात्मक त्रुटि पर लगता है उसे गुणा कर देता है, अतः सबसे ऊँची घात वाली राशि परिणाम की अनिश्चितता पर हावी रहती है।",
          mr: "गुणाकार वा भागाकारात अपूर्णांकी त्रुटी जोडल्या जातात, आणि घातांक ज्या अपूर्णांकी त्रुटीवर लागतो तिला गुणतो, म्हणून सर्वांत मोठ्या घातेची राशी निकालाच्या अनिश्चिततेवर वरचढ राहते.",
        },
        detail: {
          en: "For a sum or difference it is the absolute errors that add instead, which makes a difference of two nearly equal measurements the most treacherous quantity in any experiment.",
          hi: "योग या अंतर के लिए इसके बजाय निरपेक्ष त्रुटियाँ जुड़ती हैं, जिससे दो लगभग बराबर मापों का अंतर किसी भी प्रयोग की सबसे धोखेबाज़ राशि बन जाता है।",
          mr: "बेरीज वा वजाबाकीसाठी त्याऐवजी निरपेक्ष त्रुटी जोडल्या जातात, ज्यामुळे जवळपास समान असलेल्या दोन मापांचा फरक कोणत्याही प्रयोगातील सर्वांत फसवी राशी बनतो.",
        },
        extra: {
          en: "It tells an experimenter where to spend effort: refining a quantity that enters to the first power while a squared quantity is measured carelessly is wasted labour.",
          hi: "यह प्रयोगकर्ता को बताता है कि श्रम कहाँ लगाया जाए: जिस राशि की पहली घात है उसे सुधारते रहना जबकि वर्ग वाली राशि लापरवाही से नापी जाए, व्यर्थ परिश्रम है।",
          mr: "हे प्रयोगकर्त्याला सांगते की श्रम कुठे खर्चावा: जिची पहिली घात आहे ती राशी सुधारत राहणे तर वर्ग असलेली राशी निष्काळजीपणे मोजणे, हा वाया गेलेला कष्ट.",
        },
        pair: {
          left: {
            en: "The most heavily powered quantity dominates",
            hi: "सबसे ऊँची घात वाली राशि हावी रहती है",
            mr: "सर्वांत मोठ्या घातेची राशी वरचढ राहते",
          },
          right: {
            en: "error in a product",
            hi: "गुणनफल में त्रुटि",
            mr: "गुणाकारातील त्रुटी",
          },
        },
      },
      /*F1*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student measures a wire's diameter ten times with a screw gauge, averages the ten readings, and reports a result whose spread is impressively small. Nobody checked the gauge for zero error, and it in fact reads 0.04 mm with the jaws closed. Explain what the averaging has achieved and what it has not.",
          hi: "एक विद्यार्थी पेचमापी से तार का व्यास दस बार नापता है, दसों पाठ्यांकों का औसत लेता है, और ऐसा परिणाम बताता है जिसका बिखराव प्रभावशाली रूप से छोटा है। पेचमापी की शून्य त्रुटि किसी ने नहीं जाँची, और जबड़े बंद होने पर वह वस्तुतः 0.04 mm दिखाती है। समझाओ औसत ने क्या हासिल किया और क्या नहीं।",
          mr: "एक विद्यार्थी स्क्रू गेजने तारेचा व्यास दहा वेळा मोजतो, दहाही वाचनांची सरासरी घेतो, आणि असा निकाल सांगतो ज्याचे विखुरणे प्रभावीपणे लहान आहे. गेजची शून्य त्रुटी कोणी तपासली नाही, आणि जबडे बंद असताना ती प्रत्यक्षात 0.04 mm दाखवते. समजावा सरासरीने काय साधले आणि काय नाही.",
        },
        choices: [
          {
            en: "Averaging has beaten down the random error — the scatter from reading and tightening differently each time — so the result is now precise. It has done nothing whatever to the zero error, which is systematic: it added 0.04 mm to all ten readings in the same direction, so it survives the mean intact. The reported diameter is therefore 0.04 mm too large, stated with a small uncertainty that makes the wrong value look trustworthy",
            hi: "औसत ने यादृच्छिक त्रुटि दबा दी है — हर बार भिन्न ढंग से पढ़ने और कसने से आया बिखराव — अतः परिणाम अब परिशुद्ध है। शून्य त्रुटि पर उसने कुछ भी नहीं किया, जो व्यवस्थित है: उसने दसों पाठ्यांकों में एक ही दिशा में 0.04 mm जोड़ा, अतः वह माध्य में ज्यों की त्यों बची रहती है। बताया गया व्यास इसलिए 0.04 mm अधिक है, और छोटी अनिश्चितता के साथ कहा गया है जो ग़लत मान को भरोसेमंद दिखाती है",
            mr: "सरासरीने यादृच्छिक त्रुटी दाबली आहे — प्रत्येक वेळी वेगळ्या पद्धतीने वाचल्याने आणि आवळल्याने आलेले विखुरणे — म्हणून निकाल आता अचूक आहे. शून्य त्रुटीवर तिने काहीही केलेले नाही, जी पद्धतशीर आहे: तिने दहाही वाचनांत एकाच दिशेने 0.04 mm जोडले, म्हणून ती मध्यात जशीच्या तशी टिकते. सांगितलेला व्यास म्हणून 0.04 mm जास्त आहे, आणि लहान अनिश्चिततेसह सांगितलेला, जी चुकीच्या मूल्याला विश्वासार्ह दाखवते",
          },
          {
            en: "Averaging removes both errors, because taking a mean of ten readings removes anything that is not the true value",
            hi: "औसत दोनों त्रुटियाँ हटा देता है, क्योंकि दस पाठ्यांकों का माध्य वह सब हटा देता है जो सच्चा मान नहीं",
            mr: "सरासरी दोन्ही त्रुटी काढून टाकते, कारण दहा वाचनांचा मध्य जे खरे मूल्य नाही ते सर्व काढतो",
          },
          {
            en: "Averaging achieves nothing at all, since a mean of wrong readings is simply another wrong reading",
            hi: "औसत कुछ भी हासिल नहीं करता, क्योंकि ग़लत पाठ्यांकों का माध्य बस एक और ग़लत पाठ्यांक है",
            mr: "सरासरी काहीही साधत नाही, कारण चुकीच्या वाचनांचा मध्य म्हणजे आणखी एक चुकीचे वाचन",
          },
          {
            en: "The small spread proves the zero error was negligible, because a faulty instrument would have produced scattered readings",
            hi: "छोटा बिखराव सिद्ध करता है कि शून्य त्रुटि नगण्य थी, क्योंकि दोषपूर्ण यंत्र बिखरे पाठ्यांक देता",
            mr: "लहान विखुरणे सिद्ध करते की शून्य त्रुटी नगण्य होती, कारण सदोष उपकरण विखुरलेली वाचने देईल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two different things are being confused, and separating them is the whole point of the chapter. PRECISION is how close repeated readings are to each other. ACCURACY is how close they are to the truth. They are independent, and an experiment can have either without the other. The ten readings differ because of random error: the student tightens the ratchet slightly differently each time, reads the circular scale from a slightly different angle, records a division boundary as one side or the other. These deviations have no fixed sign — sometimes high, sometimes low — so they partly cancel in the sum, and the mean is closer to what the gauge would say than any single reading is. Formally, the standard error of the mean falls roughly as 1/√n, so ten readings are about three times better than one. That is a real gain, and it is what averaging is for. Now the zero error. With the jaws closed the instrument already says 0.04 mm. Every one of the ten readings therefore contains an extra 0.04 mm, added with the same sign every time. Take the mean of ten numbers each of which is 0.04 too big and you get a number that is 0.04 too big. Averaging cannot touch it, because averaging exploits cancellation and there is nothing here to cancel. This is the defining property of a systematic error: it is unaffected by the one remedy that works on the other kind. The result is the most dangerous shape an experimental report can take. The stated uncertainty is small, because it was computed from the scatter, and the scatter is genuinely small. So the report says, in effect, 'this value is reliable to within a few thousandths of a millimetre' — and it is wrong by ten times that. A reader with no access to the apparatus has no way to see it. The cure is not more readings. It is to change something about the method: close the jaws and read the zero before starting, then subtract; or measure a gauge block of known thickness; or hand the wire to a second student with a different instrument and see whether the two agree. Each of these changes the systematic contribution while leaving the quantity alone, which is the only way such an error ever reveals itself. (The wrong answers credit averaging with powers it does not have, deny it the power it does have, or read a small scatter as evidence of accuracy — precisely the inference this question exists to break.)",
          hi: "दो भिन्न चीज़ें गड्डमड्ड की जा रही हैं, और उन्हें अलग करना ही इस अध्याय का सारा मर्म है। परिशुद्धता यह कि दोहराए गए पाठ्यांक आपस में कितने पास हैं। यथार्थता यह कि वे सच के कितने पास हैं। ये स्वतंत्र हैं, और प्रयोग में एक दूसरे के बिना हो सकती है। दस पाठ्यांक यादृच्छिक त्रुटि से भिन्न होते हैं: विद्यार्थी हर बार रैचेट थोड़ा भिन्न कसता है, वृत्तीय पैमाना थोड़े भिन्न कोण से पढ़ता है, विभाजन-सीमा को कभी इस ओर कभी उस ओर लिखता है। इन विचलनों का कोई निश्चित चिह्न नहीं — कभी ऊपर, कभी नीचे — अतः वे योग में आंशिक रूप से कट जाते हैं, और माध्य किसी भी अकेले पाठ्यांक से उसके अधिक पास होता है जो पेचमापी कहती। औपचारिक रूप से, माध्य की मानक त्रुटि लगभग 1/√n की दर से गिरती है, अतः दस पाठ्यांक एक से लगभग तीन गुना बेहतर हैं। यह असली लाभ है, और औसत इसी के लिए है। अब शून्य त्रुटि। जबड़े बंद होने पर यंत्र पहले ही 0.04 mm कहता है। इसलिए दसों पाठ्यांकों में अतिरिक्त 0.04 mm है, हर बार उसी चिह्न के साथ जुड़ा। दस ऐसी संख्याओं का माध्य लो जिनमें से हर एक 0.04 अधिक है और तुम्हें वह संख्या मिलती है जो 0.04 अधिक है। औसत उसे छू नहीं सकता, क्योंकि औसत कटाव का लाभ उठाता है और यहाँ कटने को कुछ है ही नहीं। यही व्यवस्थित त्रुटि का परिभाषक गुण है: दूसरी क़िस्म पर चलने वाला एकमात्र उपाय उस पर बेअसर है। परिणाम वह सबसे ख़तरनाक रूप है जो कोई प्रायोगिक रिपोर्ट ले सकती है। बताई गई अनिश्चितता छोटी है, क्योंकि वह बिखराव से निकाली गई, और बिखराव सचमुच छोटा है। अतः रिपोर्ट कहती है, वस्तुतः, 'यह मान मिलीमीटर के कुछ हज़ारवें भाग तक भरोसेमंद है' — और वह उससे दस गुना ग़लत है। जिस पाठक के पास उपकरण नहीं, उसके पास इसे देखने का कोई रास्ता नहीं। इलाज अधिक पाठ्यांक नहीं। इलाज विधि में कुछ बदलना है: आरंभ से पहले जबड़े बंद करके शून्य पढ़ो, फिर घटाओ; या ज्ञात मोटाई का गेज-खंड नापो; या तार दूसरे विद्यार्थी को भिन्न यंत्र के साथ दो और देखो कि दोनों मिलते हैं या नहीं। इनमें से हर एक व्यवस्थित अंश को बदलता है और राशि को वैसा ही छोड़ता है, और ऐसी त्रुटि कभी प्रकट होती है तो केवल इसी रास्ते। (ग़लत उत्तर औसत को वे शक्तियाँ देते जो उसमें नहीं, या वह शक्ति छीनते जो उसमें है, या छोटे बिखराव को यथार्थता का प्रमाण पढ़ते — ठीक वही अनुमान जिसे तोड़ने के लिए यह प्रश्न है।)",
          mr: "दोन वेगळ्या गोष्टींची गल्लत होत आहे, आणि त्या वेगळ्या करणे हाच या प्रकरणाचा सगळा गाभा. अचूकता म्हणजे पुन्हा घेतलेली वाचने एकमेकांच्या किती जवळ. यथार्थता म्हणजे ती सत्याच्या किती जवळ. ही स्वतंत्र आहेत, आणि प्रयोगात एक दुसऱ्याविना असू शकते. दहा वाचने यादृच्छिक त्रुटीमुळे वेगळी येतात: विद्यार्थी प्रत्येक वेळी रॅचेट थोडा वेगळा आवळतो, वर्तुळाकार पट्टी थोड्या वेगळ्या कोनातून वाचतो, विभाजन-सीमा कधी या बाजूला कधी त्या बाजूला नोंदवतो. या विचलनांना निश्चित चिन्ह नाही — कधी वर, कधी खाली — म्हणून ती बेरजेत अंशतः कापली जातात, आणि मध्य कोणत्याही एकट्या वाचनाहून गेज जे सांगेल त्याच्या अधिक जवळ असतो. औपचारिकपणे, मध्याची प्रमाण त्रुटी साधारण 1/√n या दराने घटते, म्हणून दहा वाचने एकाहून सुमारे तिप्पट चांगली. हा खरा लाभ, आणि सरासरी याचसाठी आहे. आता शून्य त्रुटी. जबडे बंद असताना उपकरण आधीच 0.04 mm म्हणते. म्हणून दहाही वाचनांत जादा 0.04 mm आहे, प्रत्येक वेळी त्याच चिन्हाने जोडलेले. दहा अशा संख्यांचा मध्य घ्या ज्यांतील प्रत्येक 0.04 ने मोठी आहे आणि तुम्हाला ती संख्या मिळते जी 0.04 ने मोठी आहे. सरासरी तिला स्पर्शही करू शकत नाही, कारण सरासरी कापाकापीचा फायदा घेते आणि इथे कापायला काहीच नाही. हाच पद्धतशीर त्रुटीचा व्याख्यात्मक गुणधर्म: दुसऱ्या प्रकारावर चालणारा एकमेव उपाय तिच्यावर निष्प्रभ. निकाल हा प्रायोगिक अहवाल घेऊ शकेल असा सर्वांत धोकादायक आकार. सांगितलेली अनिश्चितता लहान, कारण ती विखुरण्यातून काढली, आणि विखुरणे खरोखर लहान. म्हणून अहवाल प्रत्यक्षात म्हणतो, 'हे मूल्य मिलीमीटरच्या काही हजारांश भागापर्यंत विश्वासार्ह' — आणि ते त्याहून दसपट चुकीचे. ज्या वाचकाकडे उपकरण नाही, त्याला हे पाहण्याचा कोणताही मार्ग नाही. उपाय अधिक वाचने नव्हे. उपाय पद्धतीत काहीतरी बदलणे: सुरू करण्याआधी जबडे बंद करून शून्य वाचा, मग वजा करा; किंवा ज्ञात जाडीचा गेज-ठोकळा मोजा; किंवा तार दुसऱ्या विद्यार्थ्याला वेगळ्या उपकरणासह द्या आणि दोघे जुळतात का पाहा. यांतील प्रत्येक पद्धतशीर वाटा बदलतो आणि राशी तशीच ठेवतो, आणि अशी त्रुटी कधी उघड होते तर याच मार्गाने. (चुकीची उत्तरे सरासरीला नसलेल्या शक्ती देतात, वा असलेली शक्ती हिरावतात, वा लहान विखुरणे यथार्थतेचा पुरावा म्हणून वाचतात — नेमके तेच अनुमान जे मोडण्यासाठी हा प्रश्न आहे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student claims to have derived the period of a simple pendulum by dimensions alone and writes T = √(l/g), while the true result is T = 2π√(l/g). A second student concludes that dimensional analysis is therefore useless. Assess both positions.",
          hi: "एक विद्यार्थी दावा करता है कि उसने केवल विमाओं से सरल लोलक का आवर्तकाल निकाल लिया और लिखता है T = √(l/g), जबकि सही परिणाम T = 2π√(l/g) है। दूसरा विद्यार्थी निष्कर्ष निकालता है कि इसलिए विमीय विश्लेषण बेकार है। दोनों स्थितियों का आकलन करो।",
          mr: "एक विद्यार्थी दावा करतो की त्याने केवळ मितींवरून साध्या लंबकाचा आवर्तकाल काढला आणि लिहितो T = √(l/g), तर खरा निकाल T = 2π√(l/g) आहे. दुसरा विद्यार्थी निष्कर्ष काढतो की म्हणून मितीय विश्लेषण निरुपयोगी आहे. दोन्ही भूमिकांचे मूल्यमापन करा.",
        },
        choices: [
          {
            en: "The first student overclaimed and the second overreacted. Dimensions fixed the entire functional form — that T depends on l and g only through √(l/g), and not at all on the bob's mass — which is most of the answer and could not have been guessed. What dimensions cannot supply is the dimensionless constant, here 2π, because a pure number has no dimensions to constrain. So the method delivers the shape of a law and leaves exactly one number to be found by experiment or by solving the dynamics",
            hi: "पहले विद्यार्थी ने अधिक दावा किया और दूसरे ने अधिक प्रतिक्रिया। विमाओं ने पूरा फलनात्मक रूप तय कर दिया — कि T, l और g पर केवल √(l/g) के माध्यम से निर्भर है, और गोलक के द्रव्यमान पर बिलकुल नहीं — जो उत्तर का अधिकांश है और अनुमान से नहीं आ सकता था। विमाएँ जो नहीं दे सकतीं वह है विमाहीन स्थिरांक, यहाँ 2π, क्योंकि शुद्ध संख्या के पास बाँधने को विमाएँ ही नहीं। अतः विधि नियम का आकार देती है और ठीक एक संख्या प्रयोग या गतिकी हल करके खोजने को छोड़ती है",
            mr: "पहिल्या विद्यार्थ्याने जास्त दावा केला आणि दुसऱ्याने जास्त प्रतिक्रिया. मितींनी संपूर्ण फलनात्मक आकार ठरवला — की T हा l आणि g वर केवळ √(l/g) मार्गे अवलंबून, आणि गोलकाच्या वस्तुमानावर मुळीच नाही — जे उत्तराचा बहुतांश आहे आणि अंदाजाने आले नसते. मिती जे देऊ शकत नाहीत ते म्हणजे मितीविरहित स्थिरांक, इथे 2π, कारण शुद्ध संख्येकडे बांधायला मितीच नाहीत. म्हणून पद्धत नियमाचा आकार देते आणि नेमकी एक संख्या प्रयोगाने वा गतिकी सोडवून शोधायला ठेवते",
          },
          {
            en: "The first student is right and the textbook's 2π is a convention that could be dropped without changing any prediction",
            hi: "पहला विद्यार्थी सही है और पाठ्यपुस्तक का 2π एक परिपाटी है जिसे किसी भविष्यवाणी को बदले बिना छोड़ा जा सकता है",
            mr: "पहिला विद्यार्थी बरोबर आहे आणि पाठ्यपुस्तकातील 2π ही एक संकेतपद्धत आहे जी कोणतेही भाकीत न बदलता सोडता येईल",
          },
          {
            en: "The second student is right, because a method that cannot produce the exact answer has proved nothing at any stage",
            hi: "दूसरा विद्यार्थी सही है, क्योंकि जो विधि ठीक उत्तर नहीं दे सकती उसने किसी भी चरण पर कुछ सिद्ध नहीं किया",
            mr: "दुसरा विद्यार्थी बरोबर आहे, कारण जी पद्धत नेमके उत्तर देऊ शकत नाही तिने कोणत्याही टप्प्यावर काहीच सिद्ध केलेले नाही",
          },
          {
            en: "Both are wrong because the period does depend on the bob's mass, and neither formula shows it",
            hi: "दोनों ग़लत हैं क्योंकि आवर्तकाल गोलक के द्रव्यमान पर निर्भर करता ही है, और कोई भी सूत्र उसे नहीं दिखाता",
            mr: "दोघेही चुकीचे कारण आवर्तकाल गोलकाच्या वस्तुमानावर अवलंबून असतोच, आणि कोणतेही सूत्र ते दाखवत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Do the derivation and the boundary becomes visible. Suppose T depends on the length l, the mass m and g, as T = k·l^a·m^b·g^c with k a pure number. In dimensions, T¹ = L^a M^b (LT⁻²)^c. Matching M gives b = 0. Matching T gives 1 = −2c, so c = −½. Matching L gives 0 = a + c, so a = ½. Hence T = k√(l/g), and the exponents were forced — no experiment was performed and no dynamics was solved. Look at what that already bought. It says the period does not depend on the mass at all, which is genuinely surprising and is the observation Galileo is remembered for. It says doubling the length multiplies the period by √2 rather than by 2. It says a pendulum on the Moon, where g is about a sixth of Earth's, swings about 2.4 times more slowly. Every one of those is a testable prediction, and every one of them came out of bookkeeping on M, L and T. That is why the second student is wrong: 'useless' is not a fair description of a method that fixed three exponents from nothing. But k is a pure number, and a pure number has dimensions M⁰L⁰T⁰. Nothing in the matching can constrain it. It could be 1, it could be 2π, it could be 137. Solving the equation of motion for small oscillations gives 2π; measuring a real pendulum gives 6.28. Dimensional analysis was silent, and it was silent for a structural reason, not because it was done carelessly. Three limits follow, and they are the ones worth carrying forward. First, the method cannot see dimensionless factors — not 2π, not ½, not a sine of an angle, since angles are themselves dimensionless. Second, it fails outright when a quantity depends on more variables than there are base dimensions to constrain, because the exponents are then underdetermined. Third, it cannot tell a sum from a single term: it will happily pass A + B where the physics requires A alone, provided both have the same dimensions. So dimensional analysis is a filter, not an oracle. It refuses wrong equations cheaply and it constrains the shape of unknown ones powerfully, and then it hands the problem to somebody who has to do the real work. Overclaiming for it and dismissing it are the same mistake made in opposite directions: both refuse to state precisely what it can do. (The wrong answers treat 2π as arbitrary when it is fixed by the dynamics, throw away a method that supplied three exponents, or assert a mass dependence that both formulae and every experiment deny.)",
          hi: "व्युत्पत्ति करो और सीमा दिखने लगती है। मानो T लंबाई l, द्रव्यमान m और g पर निर्भर है, T = k·l^a·m^b·g^c, जहाँ k शुद्ध संख्या है। विमाओं में, T¹ = L^a M^b (LT⁻²)^c। M मिलाने पर b = 0। T मिलाने पर 1 = −2c, अतः c = −½। L मिलाने पर 0 = a + c, अतः a = ½। इसलिए T = k√(l/g), और घातें बाध्य थीं — कोई प्रयोग नहीं हुआ और कोई गतिकी हल नहीं हुई। देखो इसने पहले ही क्या ख़रीद लिया। यह कहता है कि आवर्तकाल द्रव्यमान पर बिलकुल निर्भर नहीं, जो सचमुच चौंकाने वाला है और वही प्रेक्षण है जिसके लिए गैलीलियो याद किए जाते हैं। यह कहता है कि लंबाई दोगुनी करने पर आवर्तकाल 2 गुना नहीं, √2 गुना होता है। यह कहता है कि चंद्रमा पर, जहाँ g पृथ्वी के लगभग छठे भाग का है, लोलक लगभग 2.4 गुना धीमे झूलेगा। इनमें से हर एक जाँचने-योग्य भविष्यवाणी है, और हर एक M, L और T के हिसाब-किताब से निकली। इसीलिए दूसरा विद्यार्थी ग़लत है: जिस विधि ने शून्य से तीन घातें तय कीं उसका उचित वर्णन 'बेकार' नहीं। पर k शुद्ध संख्या है, और शुद्ध संख्या की विमाएँ M⁰L⁰T⁰ हैं। मिलान में कुछ भी उसे बाँध नहीं सकता। वह 1 हो सकती है, 2π हो सकती है, 137 हो सकती है। छोटे दोलनों के लिए गति-समीकरण हल करने पर 2π मिलता है; असली लोलक नापने पर 6.28 मिलता है। विमीय विश्लेषण चुप रहा, और वह संरचनात्मक कारण से चुप रहा, लापरवाही से नहीं। तीन सीमाएँ निकलती हैं, और वही आगे ले जाने योग्य हैं। पहली, विधि विमाहीन गुणकों को देख नहीं सकती — न 2π, न ½, न कोण की ज्या, क्योंकि कोण स्वयं विमाहीन हैं। दूसरी, वह तब पूरी तरह विफल हो जाती है जब कोई राशि उतने चरों पर निर्भर हो जितने बाँधने को मूल विमाएँ नहीं, क्योंकि तब घातें अनिर्धारित रह जाती हैं। तीसरी, वह योग और अकेले पद में भेद नहीं कर सकती: वह A + B को ख़ुशी से पास कर देगी जहाँ भौतिकी अकेला A माँगती है, बशर्ते दोनों की विमाएँ एक हों। अतः विमीय विश्लेषण छन्ना है, दैववाणी नहीं। वह ग़लत समीकरण सस्ते में लौटाता है और अज्ञात समीकरणों का आकार ज़ोरदार ढंग से बाँधता है, और फिर समस्या उसे सौंप देता है जिसे असली काम करना है। उसके लिए अधिक दावा करना और उसे झटक देना एक ही ग़लती है, बस उलटी दिशाओं में की गई: दोनों ठीक-ठीक कहने से इनकार करते हैं कि वह कर क्या सकता है। (ग़लत उत्तर 2π को मनमाना मानते जबकि उसे गतिकी तय करती है, उस विधि को फेंकते जिसने तीन घातें दीं, या ऐसी द्रव्यमान-निर्भरता जताते जिसे दोनों सूत्र और हर प्रयोग नकारते हैं।)",
          mr: "व्युत्पत्ती करा आणि सीमा दिसू लागते. समजा T लांबी l, वस्तुमान m आणि g वर अवलंबून, T = k·l^a·m^b·g^c, जिथे k ही शुद्ध संख्या. मितींत, T¹ = L^a M^b (LT⁻²)^c. M जुळवल्यास b = 0. T जुळवल्यास 1 = −2c, म्हणून c = −½. L जुळवल्यास 0 = a + c, म्हणून a = ½. म्हणून T = k√(l/g), आणि घात सक्तीच्या होत्या — कोणताही प्रयोग झाला नाही आणि कोणतीही गतिकी सोडवली गेली नाही. पाहा याने आधीच काय विकत घेतले. ते सांगते की आवर्तकाल वस्तुमानावर मुळीच अवलंबून नाही, जे खरोखर चकित करणारे आणि तेच निरीक्षण ज्यासाठी गॅलिलिओ स्मरला जातो. ते सांगते की लांबी दुप्पट केल्यास आवर्तकाल 2 पट नव्हे तर √2 पट होतो. ते सांगते की चंद्रावर, जिथे g पृथ्वीच्या सुमारे सहाव्या भागाचा, लंबक सुमारे 2.4 पट सावकाश झुलेल. यांतील प्रत्येक तपासण्याजोगे भाकीत, आणि प्रत्येक M, L आणि T च्या हिशोबातून निघालेले. म्हणूनच दुसरा विद्यार्थी चुकीचा: ज्या पद्धतीने शून्यातून तीन घात ठरवल्या तिचे योग्य वर्णन 'निरुपयोगी' नाही. पण k ही शुद्ध संख्या, आणि शुद्ध संख्येच्या मिती M⁰L⁰T⁰. जुळवणीतले काहीही तिला बांधू शकत नाही. ती 1 असू शकते, 2π असू शकते, 137 असू शकते. लहान आंदोलनांसाठी गतिसमीकरण सोडवल्यास 2π मिळते; खरा लंबक मोजल्यास 6.28 मिळते. मितीय विश्लेषण गप्प राहिले, आणि ते संरचनात्मक कारणाने गप्प राहिले, निष्काळजीपणाने नव्हे. तीन मर्यादा निघतात, आणि त्याच पुढे न्यायच्या. पहिली, पद्धत मितीविरहित गुणक पाहू शकत नाही — ना 2π, ना ½, ना कोनाचा साइन, कारण कोन स्वतःच मितीविरहित. दुसरी, जेव्हा एखादी राशी बांधायला मूलभूत मिती आहेत त्याहून अधिक चलांवर अवलंबून असते तेव्हा ती पूर्णपणे अपयशी ठरते, कारण मग घात अनिर्धारित राहतात. तिसरी, ती बेरीज आणि एकटे पद यांत फरक करू शकत नाही: जिथे भौतिकी एकटा A मागते तिथे ती A + B आनंदाने पास करेल, फक्त दोहोंच्या मिती सारख्या असल्या तर. म्हणून मितीय विश्लेषण हे गाळणे आहे, दैववाणी नव्हे. ते चुकीची समीकरणे स्वस्तात नाकारते आणि अज्ञात समीकरणांचा आकार जोरदारपणे बांधते, आणि मग समस्या त्याच्याकडे सोपवते ज्याला खरे काम करायचे. त्याच्यासाठी जास्त दावा करणे आणि त्याला झटकून टाकणे ही एकच चूक, फक्त उलट दिशांना केलेली: दोघेही ते नेमके काय करू शकते हे सांगायला नकार देतात. (चुकीची उत्तरे 2π ला मनमानी मानतात तर तो गतिकीने ठरतो, तीन घात दिलेली पद्धत फेकून देतात, वा अशी वस्तुमान-अवलंबिता सांगतात जी दोन्ही सूत्रे आणि प्रत्येक प्रयोग नाकारतो.)",
        },
      },
      /*H1*/
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Motion in a Straight Line                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-motion-in-a-straight-line",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 2 — Motion in a Straight Line",
      hi: "अध्याय 2 — सरल रेखा में गति",
      mr: "प्रकरण 2 — सरळ रेषेतील गती",
    },
    name: {
      en: "Motion in a Straight Line",
      hi: "सरल रेखा में गति",
      mr: "सरळ रेषेतील गती",
    },
    summary: {
      en: "One dimension is enough to break most of the intuitions: a velocity that means nothing until the interval is shrunk to a point, a slope and an area that carry the whole of kinematics between them, an acceleration that can point backwards while the body still moves forwards, equations that hold only while acceleration stays put, and a train that is at rest and doing eighty at the same time depending on who is asked.",
      hi: "अधिकांश अंतर्ज्ञान तोड़ने के लिए एक ही विमा काफ़ी है: वह वेग जिसका कोई अर्थ नहीं जब तक अंतराल को बिंदु तक न सिकोड़ा जाए, वह ढाल और वह क्षेत्रफल जो आपस में पूरी गतिकी ढोते हैं, वह त्वरण जो पीछे की ओर हो सकता है जबकि पिंड अब भी आगे बढ़ रहा हो, वे समीकरण जो केवल तब तक चलते हैं जब तक त्वरण टिका रहे, और वह रेलगाड़ी जो एक साथ विराम में है और अस्सी की चाल पर, यह इस पर निर्भर कि पूछा किससे गया।",
      mr: "बहुतांश अंतःप्रेरणा मोडायला एकच मिती पुरेशी आहे: तो वेग ज्याला अंतराल बिंदूपर्यंत आकुंचित केल्याशिवाय अर्थच नाही, तो उतार आणि ते क्षेत्रफळ जे आपापसात अख्खी गतिकी वाहतात, ते त्वरण जे मागच्या दिशेने असू शकते तरी पिंड अजून पुढे जात असतो, ती समीकरणे जी त्वरण जागेवर राहीपर्यंतच चालतात, आणि ती आगगाडी जी एकाच वेळी स्थिर आहे आणि ऐंशीच्या वेगात, हे कोणाला विचारले यावर अवलंबून.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "instantaneous-velocity",
        name: {
          en: "Instantaneous velocity",
          hi: "तात्क्षणिक वेग",
          mr: "तात्कालिक वेग",
        },
        kind: "quantity",
        prompt: {
          en: "The displacement over an interval is divided by that interval, and then the interval is shrunk towards zero until the ratio settles on a single value belonging to one instant rather than to a stretch of the journey. Which quantity is this?",
          hi: "किसी अंतराल में विस्थापन को उस अंतराल से भाग दिया जाता है, फिर अंतराल को शून्य की ओर सिकोड़ा जाता है जब तक अनुपात एक ऐसे मान पर न ठहर जाए जो यात्रा के किसी हिस्से का नहीं बल्कि एक क्षण का है। यह कौन-सी राशि है?",
          mr: "एखाद्या अंतरालातील विस्थापन त्या अंतरालाने भागले जाते, मग अंतराल शून्याकडे आकुंचित केला जातो जोवर गुणोत्तर अशा एका मूल्यावर स्थिरावत नाही जे प्रवासाच्या तुकड्याचे नव्हे तर एका क्षणाचे आहे. ही कोणती राशी?",
        },
        statement: {
          en: "Instantaneous velocity is the limit of displacement divided by time interval as the interval tends to zero, which is why a speedometer can have a reading at an instant at which no distance has yet been covered.",
          hi: "तात्क्षणिक वेग वह सीमा है जिस पर विस्थापन बटा समय-अंतराल पहुँचता है जब अंतराल शून्य की ओर जाता है, इसीलिए चालमापी उस क्षण भी पाठ्यांक दे सकती है जिस क्षण अभी कोई दूरी तय ही नहीं हुई।",
          mr: "तात्कालिक वेग म्हणजे अंतराल शून्याकडे जाताना विस्थापन भागिले काळ-अंतराल याची सीमा, म्हणूनच वेगमापक अशा क्षणीही वाचन देऊ शकतो ज्या क्षणी अजून कोणतेही अंतर कापले गेलेले नाही.",
        },
        detail: {
          en: "Its magnitude equals the instantaneous speed always, unlike the average pair, because over a vanishing interval a straight-line path cannot double back on itself.",
          hi: "इसका परिमाण सदा तात्क्षणिक चाल के बराबर होता है, औसत वाली जोड़ी के विपरीत, क्योंकि लुप्त होते अंतराल में सरल-रेखीय पथ अपने ऊपर लौट नहीं सकता।",
          mr: "त्याचे परिमाण नेहमीच तात्कालिक चालीइतके असते, सरासरीच्या जोडीच्या उलट, कारण लोप पावणाऱ्या अंतरालात सरळरेषीय मार्ग स्वतःवर परत येऊ शकत नाही.",
        },
        extra: {
          en: "Graphically it is the slope of the tangent to the position–time curve at that point, so a curve with a horizontal tangent marks an instant of momentary rest.",
          hi: "आलेख में यह उस बिंदु पर स्थिति-समय वक्र की स्पर्शरेखा की ढाल है, अतः क्षैतिज स्पर्शरेखा वाला वक्र क्षणिक विराम का क्षण दर्शाता है।",
          mr: "आलेखात हा त्या बिंदूवरील स्थिती-काळ वक्राच्या स्पर्शिकेचा उतार, म्हणून आडवी स्पर्शिका असलेला वक्र क्षणिक विश्रांतीचा क्षण दाखवतो.",
        },
        pair: {
          left: {
            en: "The slope of the tangent, not of a chord",
            hi: "जीवा की नहीं, स्पर्शरेखा की ढाल",
            mr: "जीवेचा नव्हे, स्पर्शिकेचा उतार",
          },
          right: {
            en: "instantaneous velocity",
            hi: "तात्क्षणिक वेग",
            mr: "तात्कालिक वेग",
          },
        },
      },
      {
        id: "average-velocity-against-speed",
        name: {
          en: "Average velocity against average speed",
          hi: "औसत वेग बनाम औसत चाल",
          mr: "सरासरी वेग विरुद्ध सरासरी चाल",
        },
        kind: "quantity",
        prompt: {
          en: "A runner completes one lap and returns to the starting line: one of these two quantities is zero for the lap and the other is not, because one divides displacement by time and the other divides path length by time. Which contrast is this?",
          hi: "एक धावक एक चक्कर पूरा कर आरंभ रेखा पर लौट आता है: इन दो राशियों में से एक चक्कर के लिए शून्य है और दूसरी नहीं, क्योंकि एक विस्थापन को समय से भाग देती है और दूसरी पथ-लंबाई को। यह कौन-सा भेद है?",
          mr: "एक धावपटू एक फेरी पूर्ण करून सुरुवातीच्या रेषेवर परततो: या दोन राशींपैकी एक फेरीसाठी शून्य आणि दुसरी नाही, कारण एक विस्थापन काळाने भागते आणि दुसरी मार्गलांबी काळाने. हा कोणता भेद?",
        },
        statement: {
          en: "Average velocity is total displacement over total time and can be zero for a completed round trip, while average speed is total path length over total time and can never be zero unless the body never moved.",
          hi: "औसत वेग कुल विस्थापन बटा कुल समय है और पूरी हुई वापसी-यात्रा के लिए शून्य हो सकता है, जबकि औसत चाल कुल पथ-लंबाई बटा कुल समय है और तब तक शून्य नहीं हो सकती जब तक पिंड हिला ही न हो।",
          mr: "सरासरी वेग म्हणजे एकूण विस्थापन भागिले एकूण काळ आणि पूर्ण झालेल्या परतीच्या प्रवासासाठी तो शून्य असू शकतो, तर सरासरी चाल म्हणजे एकूण मार्गलांबी भागिले एकूण काळ आणि पिंड हललाच नसेल तरच ती शून्य असू शकते.",
        },
        detail: {
          en: "Average speed is not the mean of the speeds either: half a journey at 30 km/h and half at 60 km/h averages 40 km/h, not 45, because the slower half occupies more of the time.",
          hi: "औसत चाल चालों का माध्य भी नहीं है: आधी यात्रा 30 km/h पर और आधी 60 km/h पर औसतन 40 km/h देती है, 45 नहीं, क्योंकि धीमा आधा हिस्सा अधिक समय घेरता है।",
          mr: "सरासरी चाल ही चालींचा मध्यही नाही: अर्धा प्रवास 30 km/h ने आणि अर्धा 60 km/h ने सरासरी 40 km/h देतो, 45 नव्हे, कारण सावकाश अर्धा भाग अधिक काळ व्यापतो.",
        },
        extra: {
          en: "The two agree only when the motion never reverses direction, which is the special case that makes the distinction easy to forget in a straight-line problem.",
          hi: "दोनों केवल तब मिलती हैं जब गति दिशा कभी नहीं बदलती, और यही वह विशेष स्थिति है जो सरल-रेखीय प्रश्न में भेद को भुला देती है।",
          mr: "दोन्ही केवळ तेव्हाच जुळतात जेव्हा गती कधीही दिशा बदलत नाही, आणि हीच ती विशेष स्थिती जी सरळरेषीय प्रश्नात हा भेद विसरायला लावते.",
        },
        pair: {
          left: {
            en: "Zero for a round trip, and not zero at all",
            hi: "वापसी-यात्रा के लिए शून्य, और बिलकुल शून्य नहीं",
            mr: "परतीच्या प्रवासासाठी शून्य, आणि मुळीच शून्य नाही",
          },
          right: {
            en: "average velocity against average speed",
            hi: "औसत वेग बनाम औसत चाल",
            mr: "सरासरी वेग विरुद्ध सरासरी चाल",
          },
        },
      },
      {
        id: "area-under-velocity-time",
        name: {
          en: "The area under a velocity–time graph",
          hi: "वेग-समय आलेख के नीचे का क्षेत्रफल",
          mr: "वेग-काळ आलेखाखालील क्षेत्रफळ",
        },
        kind: "graph",
        prompt: {
          en: "Whatever shape the curve takes, the region enclosed between it and the time axis over an interval has the units of a velocity times a time, and reading it off gives the displacement without solving any equation. Which reading is this?",
          hi: "वक्र चाहे जो आकार ले, किसी अंतराल में उसके और समय-अक्ष के बीच घिरा क्षेत्र वेग गुणा समय के मात्रक रखता है, और उसे पढ़ लेने से बिना कोई समीकरण हल किए विस्थापन मिल जाता है। यह कौन-सा पठन है?",
          mr: "वक्र कोणताही आकार घेवो, एखाद्या अंतरालात त्याच्या आणि काळ-अक्षामधले वेढलेले क्षेत्र वेग गुणिले काळ ही एकके बाळगते, आणि ते वाचल्याने कोणतेही समीकरण न सोडवता विस्थापन मिळते. हे कोणते वाचन?",
        },
        statement: {
          en: "The area between a velocity–time graph and the time axis is the displacement over that interval, and area below the axis counts as negative because the body was moving backwards then.",
          hi: "वेग-समय आलेख और समय-अक्ष के बीच का क्षेत्रफल उस अंतराल का विस्थापन है, और अक्ष के नीचे का क्षेत्रफल ऋणात्मक गिना जाता है क्योंकि तब पिंड पीछे की ओर जा रहा था।",
          mr: "वेग-काळ आलेख आणि काळ-अक्ष यांमधले क्षेत्रफळ म्हणजे त्या अंतरालातले विस्थापन, आणि अक्षाखालचे क्षेत्रफळ ऋण मोजले जाते कारण तेव्हा पिंड मागच्या दिशेने जात होता.",
        },
        detail: {
          en: "It works for any curve at all, not only for straight lines, which is what makes it more general than the kinematic equations that assume constant acceleration.",
          hi: "यह किसी भी वक्र पर चलता है, केवल सीधी रेखाओं पर नहीं, और यही उसे उन गतिकी-समीकरणों से अधिक व्यापक बनाता है जो अचर त्वरण मान लेते हैं।",
          mr: "हे कोणत्याही वक्रावर चालते, केवळ सरळ रेषांवर नाही, आणि हेच त्याला अचल त्वरण गृहीत धरणाऱ्या गतिकी-समीकरणांहून अधिक व्यापक बनवते.",
        },
        extra: {
          en: "The matching statement one level up is that the area under an acceleration–time graph is the change in velocity, so each graph integrates into the one above it.",
          hi: "एक स्तर ऊपर का मेल यह कि त्वरण-समय आलेख के नीचे का क्षेत्रफल वेग में परिवर्तन है, अतः हर आलेख अपने ऊपर वाले में समाकलित होता है।",
          mr: "एक पातळी वरचे जुळणारे विधान असे की त्वरण-काळ आलेखाखालील क्षेत्रफळ म्हणजे वेगातील बदल, म्हणून प्रत्येक आलेख आपल्या वरच्यात समाकलित होतो.",
        },
        pair: {
          left: {
            en: "Works for any curve, not only straight lines",
            hi: "किसी भी वक्र पर चलता, केवल सीधी रेखाओं पर नहीं",
            mr: "कोणत्याही वक्रावर चालते, केवळ सरळ रेषांवर नाही",
          },
          right: {
            en: "the area under a velocity–time graph",
            hi: "वेग-समय आलेख के नीचे का क्षेत्रफल",
            mr: "वेग-काळ आलेखाखालील क्षेत्रफळ",
          },
        },
      },
      {
        id: "acceleration-against-velocity",
        name: {
          en: "Acceleration opposite to velocity",
          hi: "वेग के विपरीत त्वरण",
          mr: "वेगाच्या विरुद्ध त्वरण",
        },
        kind: "quantity",
        prompt: {
          en: "A ball thrown upwards is still rising while the pull on it points down the whole way, so the two vectors have opposite signs and the body keeps advancing while slowing. Which situation is this?",
          hi: "ऊपर फेंकी गई गेंद अब भी चढ़ रही है जबकि उस पर खिंचाव पूरे रास्ते नीचे की ओर है, अतः दोनों सदिशों के चिह्न विपरीत हैं और पिंड धीमा होते हुए भी आगे बढ़ता रहता है। यह कौन-सी स्थिति है?",
          mr: "वर फेकलेला चेंडू अजून चढत आहे तर त्यावरील ओढ पूर्ण वाटभर खाली आहे, म्हणून दोन सदिशांची चिन्हे विरुद्ध आहेत आणि पिंड मंदावत असूनही पुढे जात राहतो. ही कोणती स्थिती?",
        },
        statement: {
          en: "When acceleration points opposite to velocity the body slows without reversing at once, so a negative acceleration does not mean a body moving backwards and a positive one does not mean it is speeding up.",
          hi: "जब त्वरण वेग के विपरीत होता है तो पिंड तुरंत उलटे बिना धीमा होता है, अतः ऋणात्मक त्वरण का अर्थ पीछे जाता पिंड नहीं और धनात्मक का अर्थ तेज़ होना नहीं।",
          mr: "जेव्हा त्वरण वेगाच्या विरुद्ध असते तेव्हा पिंड लगेच उलटा न होता मंदावतो, म्हणून ऋण त्वरण म्हणजे मागे जाणारा पिंड नव्हे आणि धन त्वरण म्हणजे वेग वाढणे नव्हे.",
        },
        detail: {
          en: "At the very top of the throw the velocity is zero for an instant while the acceleration is still the full 9.8 m/s² downwards, which is the counter-example to the belief that zero velocity means zero acceleration.",
          hi: "फेंक के ठीक शिखर पर वेग एक क्षण के लिए शून्य होता है जबकि त्वरण अब भी पूरा 9.8 m/s² नीचे की ओर है, और यही उस धारणा का प्रति-उदाहरण है कि शून्य वेग का अर्थ शून्य त्वरण है।",
          mr: "फेकीच्या अगदी शिखरावर वेग एका क्षणापुरता शून्य असतो तर त्वरण अजूनही पूर्ण 9.8 m/s² खाली असते, आणि हेच शून्य वेग म्हणजे शून्य त्वरण या समजुतीचे प्रतिउदाहरण.",
        },
        extra: {
          en: "Whether the body is speeding up or slowing down is decided by the sign of the product of velocity and acceleration, never by the sign of either alone.",
          hi: "पिंड तेज़ हो रहा है या धीमा, यह वेग और त्वरण के गुणनफल के चिह्न से तय होता है, कभी अकेले किसी एक के चिह्न से नहीं।",
          mr: "पिंडाचा वेग वाढतोय की घटतोय हे वेग आणि त्वरण यांच्या गुणाकाराच्या चिन्हाने ठरते, कधीही एकट्या कोणाच्या चिन्हाने नव्हे.",
        },
        pair: {
          left: {
            en: "Zero velocity with the acceleration still at full strength",
            hi: "शून्य वेग, और त्वरण अब भी पूरी ताक़त पर",
            mr: "शून्य वेग, आणि त्वरण अजूनही पूर्ण ताकदीवर",
          },
          right: {
            en: "acceleration opposite to velocity",
            hi: "वेग के विपरीत त्वरण",
            mr: "वेगाच्या विरुद्ध त्वरण",
          },
        },
      },
      {
        id: "kinematic-equations-condition",
        name: {
          en: "The condition on the kinematic equations",
          hi: "गतिकी समीकरणों की शर्त",
          mr: "गतिकी समीकरणांची अट",
        },
        kind: "graph",
        prompt: {
          en: "v = u + at, s = ut + ½at² and v² = u² + 2as are all derived on one assumption, and applied to a car whose driver keeps changing the pressure on the pedal they give confidently wrong answers. Which restriction is this?",
          hi: "v = u + at, s = ut + ½at² और v² = u² + 2as तीनों एक ही मान्यता पर निकाले गए हैं, और जिस कार का चालक पैडल पर दबाव बदलता रहता है उस पर लगाने से वे आत्मविश्वास के साथ ग़लत उत्तर देते हैं। यह कौन-सा प्रतिबंध है?",
          mr: "v = u + at, s = ut + ½at² आणि v² = u² + 2as ही तिन्ही एकाच गृहीतकावर काढलेली आहेत, आणि ज्या कारचा चालक पॅडलवरचा दाब बदलत राहतो तिच्यावर लावल्यास ती आत्मविश्वासाने चुकीची उत्तरे देतात. हा कोणता निर्बंध?",
        },
        statement: {
          en: "The kinematic equations hold only while the acceleration stays constant in magnitude and direction, so they may be applied to a journey only piece by piece, one interval of unchanging acceleration at a time.",
          hi: "गतिकी समीकरण केवल तब तक चलते हैं जब तक त्वरण परिमाण और दिशा में अचर रहे, अतः किसी यात्रा पर उन्हें टुकड़ा-टुकड़ा करके ही लगाया जा सकता है, एक बार में अचर त्वरण का एक अंतराल।",
          mr: "गतिकी समीकरणे केवळ त्वरण परिमाण आणि दिशेत अचल राहीपर्यंतच चालतात, म्हणून एखाद्या प्रवासावर ती तुकड्या-तुकड्यानेच लावता येतात, एका वेळी अचल त्वरणाचा एक अंतराल.",
        },
        detail: {
          en: "The third of them contains no time at all, which is why it is the one to reach for when a stopping distance is wanted and nobody has said how long the braking took.",
          hi: "उनमें से तीसरे में समय है ही नहीं, इसीलिए जब रुकने की दूरी चाहिए और किसी ने नहीं बताया कि ब्रेक कितनी देर लगे, तब वही उठाया जाता है।",
          mr: "त्यांतील तिसऱ्यात काळ मुळीच नाही, म्हणूनच जेव्हा थांबण्याचे अंतर हवे असते आणि ब्रेक किती वेळ लागले हे कोणी सांगितलेले नसते, तेव्हा तोच उचलला जातो.",
        },
        extra: {
          en: "Free fall near the Earth's surface is the case that satisfies the condition exactly, provided air resistance is neglected, which is why it is the standard worked example.",
          hi: "पृथ्वी की सतह के पास मुक्त पतन वही स्थिति है जो शर्त ठीक-ठीक पूरी करती है, बशर्ते वायु प्रतिरोध छोड़ दिया जाए, इसीलिए वह मानक हल-उदाहरण है।",
          mr: "पृथ्वीच्या पृष्ठभागाजवळचे मुक्त पतन हीच ती स्थिती जी अट नेमकी पूर्ण करते, हवेचा विरोध सोडल्यास, म्हणूनच ते प्रमाणित सोडवलेले उदाहरण आहे.",
        },
        pair: {
          left: {
            en: "Apply them only one unchanging interval at a time",
            hi: "उन्हें एक बार में अचर त्वरण के एक ही अंतराल पर लगाओ",
            mr: "ती एका वेळी अचल त्वरणाच्या एकाच अंतरालावर लावा",
          },
          right: {
            en: "the condition on the kinematic equations",
            hi: "गतिकी समीकरणों की शर्त",
            mr: "गतिकी समीकरणांची अट",
          },
        },
      },
      {
        id: "relative-velocity-one-dimension",
        name: {
          en: "Relative velocity along a line",
          hi: "एक रेखा पर सापेक्ष वेग",
          mr: "एका रेषेवरील सापेक्ष वेग",
        },
        kind: "quantity",
        prompt: {
          en: "A passenger walking down the aisle is doing 1 m/s to the guard and 26 m/s to a farmer in a field, and neither figure is more correct than the other; each is obtained by subtracting one velocity from the other. Which quantity is this?",
          hi: "गलियारे में चलता यात्री गार्ड के लिए 1 m/s पर है और खेत में खड़े किसान के लिए 26 m/s पर, और कोई भी आँकड़ा दूसरे से अधिक सही नहीं; हर एक एक वेग को दूसरे से घटाकर मिलता है। यह कौन-सी राशि है?",
          mr: "मार्गिकेतून चालणारा प्रवासी गार्डसाठी 1 m/s वर आहे आणि शेतातील शेतकऱ्यासाठी 26 m/s वर, आणि कोणताही आकडा दुसऱ्याहून अधिक बरोबर नाही; प्रत्येक एक वेग दुसऱ्यातून वजा करून मिळतो. ही कोणती राशी?",
        },
        statement: {
          en: "The velocity of A relative to B along a line is the velocity of A minus the velocity of B, so two bodies with the same velocity are permanently at rest with respect to each other however fast the ground says they are going.",
          hi: "एक रेखा पर B के सापेक्ष A का वेग, A का वेग घटा B का वेग है, अतः समान वेग वाले दो पिंड एक-दूसरे के सापेक्ष सदा विराम में हैं, चाहे ज़मीन कहे कि वे कितने ही तेज़ जा रहे हैं।",
          mr: "एका रेषेवर B च्या सापेक्ष A चा वेग म्हणजे A चा वेग वजा B चा वेग, म्हणून समान वेग असलेले दोन पिंड एकमेकांच्या सापेक्ष कायम स्थिर असतात, जमीन ते कितीही वेगात जात आहेत असे म्हणो.",
        },
        detail: {
          en: "For bodies approaching head-on the subtraction turns into an addition of magnitudes, which is why two trains at 20 and 15 m/s close on each other at 35 m/s.",
          hi: "आमने-सामने आते पिंडों के लिए घटाव परिमाणों के जोड़ में बदल जाता है, इसीलिए 20 और 15 m/s की दो रेलगाड़ियाँ एक-दूसरे के पास 35 m/s से आती हैं।",
          mr: "समोरासमोर येणाऱ्या पिंडांसाठी वजाबाकी परिमाणांच्या बेरजेत बदलते, म्हणूनच 20 आणि 15 m/s च्या दोन आगगाड्या एकमेकींजवळ 35 m/s ने येतात.",
        },
        extra: {
          en: "It is the reason a question about motion is incomplete until the frame is named, and the reason no experiment inside a smoothly moving carriage can reveal that the carriage is moving.",
          hi: "इसी से गति का कोई प्रश्न तब तक अधूरा है जब तक निर्देश-तंत्र न बताया जाए, और इसी से सुचारु रूप से चलते डिब्बे के भीतर कोई प्रयोग यह नहीं बता सकता कि डिब्बा चल रहा है।",
          mr: "यामुळेच गतीचा कोणताही प्रश्न संदर्भचौकट सांगेपर्यंत अपूर्ण असतो, आणि यामुळेच सुरळीत चालणाऱ्या डब्यातील कोणताही प्रयोग डबा चालतो आहे हे सांगू शकत नाही.",
        },
        pair: {
          left: {
            en: "Two figures for one walker, both correct",
            hi: "एक ही चलने वाले के दो आँकड़े, दोनों सही",
            mr: "एकाच चालणाऱ्याचे दोन आकडे, दोन्ही बरोबर",
          },
          right: {
            en: "relative velocity along a line",
            hi: "एक रेखा पर सापेक्ष वेग",
            mr: "एका रेषेवरील सापेक्ष वेग",
          },
        },
      },
      /*F2*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A body's velocity–time graph is a straight line from +20 m/s at t = 0 down to −20 m/s at t = 8 s, crossing the time axis at t = 4 s. A student computes the area as ½ × 8 × 20 = 80 and reports that the body travelled 80 m and ended 80 m from where it started. Correct the report.",
          hi: "किसी पिंड का वेग-समय आलेख t = 0 पर +20 m/s से t = 8 s पर −20 m/s तक सीधी रेखा है, जो t = 4 s पर समय-अक्ष काटती है। एक विद्यार्थी क्षेत्रफल ½ × 8 × 20 = 80 निकालता है और बताता है कि पिंड 80 m चला और आरंभ-स्थान से 80 m दूर रुका। रिपोर्ट सुधारो।",
          mr: "एका पिंडाचा वेग-काळ आलेख t = 0 वर +20 m/s पासून t = 8 s वर −20 m/s पर्यंत सरळ रेषा आहे, जी t = 4 s वर काळ-अक्ष कापते. एक विद्यार्थी क्षेत्रफळ ½ × 8 × 20 = 80 काढतो आणि सांगतो की पिंड 80 m चालला आणि सुरुवातीच्या जागेपासून 80 m दूर थांबला. अहवाल दुरुस्त करा.",
        },
        choices: [
          {
            en: "Both figures are wrong, and for opposite reasons. The graph is two triangles: one above the axis from 0 to 4 s with area ½ × 4 × 20 = 40 m, one below from 4 to 8 s with area 40 m counted as −40 m. The displacement is 40 − 40 = 0 m: the body returned to its starting point. The distance travelled is 40 + 40 = 80 m, which is the number the student computed, but he computed it as a single triangle and then reported it as the displacement as well",
            hi: "दोनों आँकड़े ग़लत हैं, और विपरीत कारणों से। आलेख दो त्रिभुज है: एक अक्ष के ऊपर 0 से 4 s तक जिसका क्षेत्रफल ½ × 4 × 20 = 40 m, एक नीचे 4 से 8 s तक जिसका क्षेत्रफल 40 m पर −40 m गिना जाता है। विस्थापन 40 − 40 = 0 m: पिंड अपने आरंभ-बिंदु पर लौट आया। तय की गई दूरी 40 + 40 = 80 m है, वही संख्या जो विद्यार्थी ने निकाली, पर उसने उसे एक ही त्रिभुज मानकर निकाला और फिर उसे विस्थापन भी बता दिया",
            mr: "दोन्ही आकडे चुकीचे, आणि विरुद्ध कारणांनी. आलेख दोन त्रिकोण आहे: एक अक्षावर 0 ते 4 s, क्षेत्रफळ ½ × 4 × 20 = 40 m, एक खाली 4 ते 8 s, क्षेत्रफळ 40 m पण −40 m मोजले जाणारे. विस्थापन 40 − 40 = 0 m: पिंड आपल्या सुरुवातीच्या बिंदूवर परतला. कापलेले अंतर 40 + 40 = 80 m, तोच आकडा जो विद्यार्थ्याने काढला, पण त्याने तो एकच त्रिकोण मानून काढला आणि मग तो विस्थापनही म्हणून सांगितला",
          },
          {
            en: "The report is correct: the area under any velocity–time graph is both the distance and the displacement",
            hi: "रिपोर्ट सही है: किसी भी वेग-समय आलेख के नीचे का क्षेत्रफल दूरी भी है और विस्थापन भी",
            mr: "अहवाल बरोबर आहे: कोणत्याही वेग-काळ आलेखाखालील क्षेत्रफळ हे अंतरही आहे आणि विस्थापनही",
          },
          {
            en: "The displacement is 80 m but the distance is 0 m, because the two halves of the journey cancel in the path length",
            hi: "विस्थापन 80 m है पर दूरी 0 m, क्योंकि यात्रा के दोनों आधे हिस्से पथ-लंबाई में कट जाते हैं",
            mr: "विस्थापन 80 m आहे पण अंतर 0 m, कारण प्रवासाचे दोन्ही अर्धे भाग मार्गलांबीत कापले जातात",
          },
          {
            en: "Both are 40 m, since the negative half of the graph should simply be ignored as unphysical",
            hi: "दोनों 40 m हैं, क्योंकि आलेख का ऋणात्मक आधा हिस्सा अभौतिक मानकर छोड़ ही देना चाहिए",
            mr: "दोन्ही 40 m आहेत, कारण आलेखाचा ऋण अर्धा भाग अभौतिक मानून सोडूनच द्यायला हवा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Read the graph before computing anything. At t = 0 the velocity is +20 m/s, so the body is moving forwards. The line falls steadily, reaching zero at t = 4 s — the instant the body is momentarily at rest — and then goes negative, so from 4 s to 8 s the body is moving backwards, faster and faster, reaching 20 m/s in reverse at t = 8 s. Notice that the acceleration is the same throughout: the slope is (−20 − 20)/8 = −5 m/s² everywhere. Nothing special happens at t = 4 s except that the velocity passes through zero on its way from positive to negative. Now the areas. The first triangle, from 0 to 4 s, has base 4 s and height 20 m/s, so its area is ½ × 4 × 20 = 40. The body went 40 m forwards. The second triangle, from 4 to 8 s, has the same base and height, so its area is also 40 — but it lies below the time axis, and area below the axis counts negative because the velocity there is negative. The body went 40 m backwards. Displacement adds the signed areas: 40 + (−40) = 0. The body is exactly where it began. Distance adds the unsigned areas: 40 + 40 = 80. The odometer would read 80 m. The student's arithmetic produced 80 by treating the whole eight seconds as one triangle of height 20, which happens to give the right total distance for the wrong reason — the two triangles he did not draw have the same total area as the one he did. Then he attached that single number to both quantities, and one of the two attachments is wrong. This is the same distinction as average speed against average velocity, met here in its graphical form. Over the whole eight seconds the average velocity is 0/8 = 0 m/s and the average speed is 80/8 = 10 m/s. Neither is a mistake; they answer different questions. A useful habit follows: whenever a velocity–time graph crosses the axis, split the area at the crossing and decide what is being asked before adding anything. (The wrong answers conflate the two quantities, swap them, or discard negative velocity as though a body could not travel backwards.)",
          hi: "कुछ गणने से पहले आलेख पढ़ो। t = 0 पर वेग +20 m/s है, अतः पिंड आगे बढ़ रहा है। रेखा लगातार गिरती है, t = 4 s पर शून्य पहुँचती है — वह क्षण जब पिंड क्षणिक विराम में है — और फिर ऋणात्मक हो जाती है, अतः 4 s से 8 s तक पिंड पीछे की ओर जा रहा है, और तेज़ होता हुआ t = 8 s पर उलटी दिशा में 20 m/s पर पहुँचता है। ध्यान दो त्वरण पूरे समय एक ही है: ढाल हर जगह (−20 − 20)/8 = −5 m/s² है। t = 4 s पर कुछ विशेष नहीं होता, सिवाय इसके कि वेग धनात्मक से ऋणात्मक जाते हुए शून्य से गुज़रता है। अब क्षेत्रफल। पहला त्रिभुज, 0 से 4 s, आधार 4 s और ऊँचाई 20 m/s, अतः क्षेत्रफल ½ × 4 × 20 = 40. पिंड 40 m आगे गया। दूसरा त्रिभुज, 4 से 8 s, वही आधार और ऊँचाई, अतः क्षेत्रफल भी 40 — पर वह समय-अक्ष के नीचे है, और अक्ष के नीचे का क्षेत्रफल ऋणात्मक गिना जाता है क्योंकि वहाँ वेग ऋणात्मक है। पिंड 40 m पीछे गया। विस्थापन चिह्न-सहित क्षेत्रफल जोड़ता है: 40 + (−40) = 0. पिंड ठीक वहीं है जहाँ से चला। दूरी बिना चिह्न के जोड़ती है: 40 + 40 = 80. दूरीमापी 80 m दिखाता। विद्यार्थी की गणना ने 80 इसलिए दिया कि उसने पूरे आठ सेकंड को 20 ऊँचाई का एक त्रिभुज मान लिया, जो संयोग से ग़लत कारण से सही कुल दूरी देता है — जो दो त्रिभुज उसने नहीं खींचे उनका कुल क्षेत्रफल उसी के बराबर है जो उसने खींचा। फिर उसने वह अकेली संख्या दोनों राशियों से जोड़ दी, और दोनों में से एक जोड़ ग़लत है। यह वही भेद है जो औसत चाल बनाम औसत वेग का है, यहाँ अपने आलेखीय रूप में मिला। पूरे आठ सेकंड में औसत वेग 0/8 = 0 m/s और औसत चाल 80/8 = 10 m/s है। कोई भी ग़लती नहीं; वे भिन्न प्रश्नों के उत्तर हैं। एक उपयोगी आदत निकलती है: जब भी वेग-समय आलेख अक्ष काटे, कटान पर क्षेत्रफल बाँटो और कुछ जोड़ने से पहले तय करो कि पूछा क्या गया है। (ग़लत उत्तर दोनों राशियों को एक कर देते, उन्हें आपस में बदल देते, या ऋणात्मक वेग को ऐसे फेंक देते मानो पिंड पीछे जा ही न सकता हो।)",
          mr: "काही मोजण्याआधी आलेख वाचा. t = 0 वर वेग +20 m/s, म्हणून पिंड पुढे जात आहे. रेषा सतत खाली येते, t = 4 s वर शून्य गाठते — तो क्षण जेव्हा पिंड क्षणिक स्थिर आहे — आणि मग ऋण होते, म्हणून 4 s ते 8 s पिंड मागच्या दिशेने जात आहे, अधिकाधिक वेगाने, t = 8 s वर उलट दिशेत 20 m/s गाठत. लक्षात घ्या त्वरण संपूर्ण काळ एकच आहे: उतार सर्वत्र (−20 − 20)/8 = −5 m/s². t = 4 s वर विशेष काहीही घडत नाही, फक्त वेग धनकडून ऋणकडे जाताना शून्यातून जातो. आता क्षेत्रफळे. पहिला त्रिकोण, 0 ते 4 s, पाया 4 s आणि उंची 20 m/s, म्हणून क्षेत्रफळ ½ × 4 × 20 = 40. पिंड 40 m पुढे गेला. दुसरा त्रिकोण, 4 ते 8 s, तोच पाया आणि उंची, म्हणून क्षेत्रफळही 40 — पण तो काळ-अक्षाखाली आहे, आणि अक्षाखालचे क्षेत्रफळ ऋण मोजले जाते कारण तिथे वेग ऋण आहे. पिंड 40 m मागे गेला. विस्थापन चिन्हासह क्षेत्रफळे जोडते: 40 + (−40) = 0. पिंड नेमका तिथेच जिथून निघाला. अंतर चिन्हाशिवाय जोडते: 40 + 40 = 80. अंतरमापक 80 m दाखवेल. विद्यार्थ्याच्या गणिताने 80 दिले कारण त्याने अख्खे आठ सेकंद 20 उंचीचा एकच त्रिकोण मानले, जे योगायोगाने चुकीच्या कारणाने बरोबर एकूण अंतर देते — त्याने न काढलेल्या दोन त्रिकोणांचे एकूण क्षेत्रफळ त्याने काढलेल्याइतकेच आहे. मग त्याने तो एकच आकडा दोन्ही राशींना जोडला, आणि दोहोंपैकी एक जोडणी चुकीची. हाच तो भेद जो सरासरी चाल विरुद्ध सरासरी वेग यांचा, इथे त्याच्या आलेखीय रूपात भेटलेला. अख्ख्या आठ सेकंदांत सरासरी वेग 0/8 = 0 m/s आणि सरासरी चाल 80/8 = 10 m/s. दोन्हीही चूक नाहीत; ती वेगळ्या प्रश्नांची उत्तरे. एक उपयुक्त सवय निघते: जेव्हा वेग-काळ आलेख अक्ष कापतो, तेव्हा कापाच्या ठिकाणी क्षेत्रफळ विभागा आणि काही जोडण्याआधी काय विचारले आहे ते ठरवा. (चुकीची उत्तरे दोन्ही राशी एक करतात, त्यांची अदलाबदल करतात, वा ऋण वेग असा फेकून देतात जणू पिंड मागे जाऊच शकत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A passenger in a train moving at a steady 25 m/s drops a coin. It lands at their feet, exactly as it would on a platform. A second train accelerates, and there the same coin lands behind the passenger's feet. Explain what distinguishes the two carriages, and why the first result is more significant than it looks.",
          hi: "स्थिर 25 m/s से चलती रेलगाड़ी में एक यात्री सिक्का गिराता है। वह उनके पैरों पर गिरता है, ठीक वैसे जैसे प्लेटफ़ॉर्म पर गिरता। दूसरी रेलगाड़ी त्वरित होती है, और वहाँ वही सिक्का यात्री के पैरों के पीछे गिरता है। समझाओ दोनों डिब्बों में भेद क्या है, और पहला परिणाम दिखने से अधिक महत्वपूर्ण क्यों है।",
          mr: "स्थिर 25 m/s ने जाणाऱ्या आगगाडीत एक प्रवासी नाणे टाकतो. ते त्यांच्या पायांवर पडते, अगदी फलाटावर पडले असते तसे. दुसरी आगगाडी त्वरित होते, आणि तिथे तेच नाणे प्रवाशाच्या पायांमागे पडते. समजावा दोन डब्यांत फरक काय, आणि पहिला निकाल दिसतो त्याहून अधिक महत्त्वाचा का.",
        },
        choices: [
          {
            en: "The first carriage moves with constant velocity, so coin, passenger and floor all share the same horizontal velocity throughout the fall and none of them changes it; the coin keeps that velocity and lands underfoot. The second carriage speeds up during the fall, so the floor gains velocity while the released coin does not, and the floor slides forward under it. The significance is that no experiment inside the first carriage can detect its motion at all — mechanics comes out identically in every frame moving uniformly, which is what makes such a frame inertial and what the first law is really asserting",
            hi: "पहला डिब्बा अचर वेग से चलता है, अतः सिक्का, यात्री और फ़र्श तीनों पूरे पतन में वही क्षैतिज वेग साझा करते हैं और कोई उसे बदलता नहीं; सिक्का वही वेग रखता है और पैरों के नीचे गिरता है। दूसरा डिब्बा पतन के दौरान तेज़ होता है, अतः फ़र्श वेग पाता है जबकि छोड़ा गया सिक्का नहीं, और फ़र्श उसके नीचे आगे सरक जाता है। महत्व यह कि पहले डिब्बे के भीतर कोई भी प्रयोग उसकी गति पकड़ ही नहीं सकता — यांत्रिकी हर एकसमान गति वाले निर्देश-तंत्र में एक-सी निकलती है, और यही ऐसे तंत्र को जड़त्वीय बनाता है और यही पहला नियम वस्तुतः कह रहा है",
            mr: "पहिला डबा अचल वेगाने जातो, म्हणून नाणे, प्रवासी आणि जमीन तिघेही पूर्ण पतनभर तोच आडवा वेग वाटून घेतात आणि कोणीही तो बदलत नाही; नाणे तोच वेग राखते आणि पायांखाली पडते. दुसरा डबा पतनादरम्यान वेग घेतो, म्हणून जमीन वेग मिळवते तर सोडलेले नाणे नाही, आणि जमीन त्याच्याखालून पुढे सरकते. महत्त्व हे की पहिल्या डब्यातील कोणताही प्रयोग त्याची गती पकडूच शकत नाही — यामिकी प्रत्येक एकसमान गतीच्या चौकटीत सारखीच निघते, आणि हेच अशा चौकटीला जडत्वीय बनवते आणि हेच पहिला नियम प्रत्यक्षात सांगत आहे",
          },
          {
            en: "The difference is speed: 25 m/s is slow enough for the coin to keep up, and a faster train would show the same backward landing as the accelerating one",
            hi: "भेद चाल का है: 25 m/s इतना धीमा है कि सिक्का साथ बना रहे, और अधिक तेज़ रेलगाड़ी वही पिछड़कर गिरना दिखाती जो त्वरित वाली दिखाती है",
            mr: "फरक वेगाचा आहे: 25 m/s इतका सावकाश की नाणे सोबत राहते, आणि अधिक वेगवान आगगाडी तेच मागे पडणे दाखवेल जे त्वरित होणारी दाखवते",
          },
          {
            en: "The air inside the first carriage carries the coin along, and in the accelerating carriage the air is left behind",
            hi: "पहले डिब्बे की हवा सिक्के को साथ ले चलती है, और त्वरित डिब्बे में हवा पीछे छूट जाती है",
            mr: "पहिल्या डब्यातील हवा नाणे सोबत नेते, आणि त्वरित होणाऱ्या डब्यात हवा मागे राहते",
          },
          {
            en: "Gravity is weaker in a moving carriage, which is why the coin behaves differently in the two cases",
            hi: "चलते डिब्बे में गुरुत्व दुर्बल होता है, इसीलिए दोनों स्थितियों में सिक्का भिन्न व्यवहार करता है",
            mr: "चालत्या डब्यात गुरुत्व दुर्बल असते, म्हणूनच दोन्ही स्थितींत नाणे वेगळे वागते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Work in the platform frame first, where nothing is unfamiliar. Before release the coin is travelling forward at 25 m/s along with everything else in the carriage. Releasing it removes the hand's support but supplies no horizontal push, and gravity acts vertically, so the coin's horizontal velocity stays at 25 m/s for the whole of the fall. In the same time the passenger's feet also move forward at 25 m/s, because the train has not changed speed. The coin and the feet cover the same horizontal distance, so they meet. Nothing special is happening — the coin travels a parabola in this frame — but the two parabolic paths keep the same horizontal separation, which is zero. Now the accelerating carriage. Once the coin is released, nothing acts on it horizontally, so it keeps whatever forward velocity it had at the moment of release. The floor does not: it is being pushed by the engine and gains speed during the fall. In the platform frame the floor covers more ground than the coin does, so the coin lands behind the point it was dropped from — not because it was thrown backwards, but because everything else went forwards faster. This is the experiment's payoff. In the uniformly moving train, the coin behaves exactly as it does at rest on a platform; so does a swinging pendulum, so does a ball rolled along the aisle, so does every other mechanical experiment that can be done inside. There is no measurement, in principle, that reveals the carriage is moving. Speed is therefore not a property a body has by itself — it exists only relative to a chosen frame, which is precisely the content of the relative-velocity rule met earlier in the chapter. In the accelerating train the situation is entirely different. Here experiments DO reveal the motion: the coin lands off-centre, a hanging bag swings back, a ball on the floor rolls towards the rear with nothing touching it. A passenger who insists on using the carriage as their frame has to invent a force to explain these — the so-called pseudo-force — which is the standing sign that the frame is not inertial. So the two carriages divide all frames into two classes. Uniform motion changes nothing and is undetectable; acceleration changes everything and announces itself. That division is what Newton's first law is for: it is not the trivial claim that things keep moving, but the assertion that frames exist in which they do, and the accelerating carriage is not one of them. (The wrong answers make the effect depend on how fast rather than on whether the speed is changing, hand the job to air that would fail the same test, or alter gravity, which no measurement in either carriage supports.)",
          hi: "पहले प्लेटफ़ॉर्म के तंत्र में काम करो, जहाँ कुछ भी अनजाना नहीं। छोड़ने से पहले सिक्का डिब्बे की हर चीज़ के साथ 25 m/s से आगे जा रहा है। छोड़ने से हाथ का सहारा हटता है पर कोई क्षैतिज धक्का नहीं मिलता, और गुरुत्व ऊर्ध्वाधर लगता है, अतः सिक्के का क्षैतिज वेग पूरे पतन में 25 m/s बना रहता है। उसी समय में यात्री के पैर भी 25 m/s से आगे बढ़ते हैं, क्योंकि रेलगाड़ी ने चाल बदली नहीं। सिक्का और पैर एक ही क्षैतिज दूरी तय करते हैं, अतः वे मिलते हैं। कुछ विशेष नहीं हो रहा — इस तंत्र में सिक्का परवलय पर चलता है — पर दोनों परवलयी पथ वही क्षैतिज अंतर बनाए रखते हैं, जो शून्य है। अब त्वरित डिब्बा। सिक्का छूटने के बाद उस पर क्षैतिज रूप से कुछ नहीं लगता, अतः वह छूटने के क्षण का अगला वेग बनाए रखता है। फ़र्श नहीं रखता: उसे इंजन धकेल रहा है और वह पतन के दौरान चाल पाता है। प्लेटफ़ॉर्म के तंत्र में फ़र्श सिक्के से अधिक ज़मीन तय करता है, अतः सिक्का उस बिंदु से पीछे गिरता है जहाँ से गिराया गया — इसलिए नहीं कि उसे पीछे फेंका गया, बल्कि इसलिए कि बाक़ी सब तेज़ी से आगे चला गया। यही इस प्रयोग की कमाई है। एकसमान चलती रेलगाड़ी में सिक्का ठीक वैसे व्यवहार करता है जैसे प्लेटफ़ॉर्म पर विराम में; वैसे ही झूलता लोलक, वैसे ही गलियारे में लुढ़काई गेंद, वैसे ही भीतर किया जा सकने वाला हर दूसरा यांत्रिक प्रयोग। सिद्धांततः ऐसा कोई माप नहीं जो बताए कि डिब्बा चल रहा है। अतः चाल पिंड का अपने आप में गुण नहीं — वह केवल चुने हुए तंत्र के सापेक्ष है, और यही अध्याय में पहले मिले सापेक्ष-वेग नियम की अंतर्वस्तु है। त्वरित रेलगाड़ी में स्थिति पूरी तरह भिन्न है। यहाँ प्रयोग गति प्रकट करते हैं: सिक्का हटकर गिरता है, टँगा थैला पीछे झूलता है, फ़र्श पर रखी गेंद बिना किसी के छुए पिछले सिरे की ओर लुढ़कती है। जो यात्री डिब्बे को ही अपना तंत्र मानने पर अड़ा है उसे इन्हें समझाने के लिए एक बल गढ़ना पड़ता है — तथाकथित छद्म बल — और यही स्थायी संकेत है कि तंत्र जड़त्वीय नहीं। अतः दोनों डिब्बे सभी तंत्रों को दो वर्गों में बाँट देते हैं। एकसमान गति कुछ नहीं बदलती और पकड़ी नहीं जा सकती; त्वरण सब बदल देता है और स्वयं की घोषणा कर देता है। यही विभाजन न्यूटन के पहले नियम का प्रयोजन है: वह यह मामूली दावा नहीं कि चीज़ें चलती रहती हैं, बल्कि यह प्रतिज्ञा कि ऐसे तंत्र हैं जिनमें वे चलती रहती हैं, और त्वरित डिब्बा उनमें से एक नहीं। (ग़लत उत्तर प्रभाव को इस पर टिकाते कि कितनी तेज़, न कि इस पर कि चाल बदल रही है या नहीं, काम हवा को सौंपते जो उसी जाँच में फ़ेल होती, या गुरुत्व बदल देते, जिसका किसी भी डिब्बे में कोई माप समर्थन नहीं करता।)",
          mr: "आधी फलाटाच्या चौकटीत काम करा, जिथे काहीही अपरिचित नाही. सोडण्याआधी नाणे डब्यातल्या प्रत्येक गोष्टीसह 25 m/s ने पुढे जात आहे. सोडल्याने हाताचा आधार जातो पण कोणताही आडवा धक्का मिळत नाही, आणि गुरुत्व उभे लागते, म्हणून नाण्याचा आडवा वेग पूर्ण पतनभर 25 m/s राहतो. त्याच काळात प्रवाशाचे पायही 25 m/s ने पुढे जातात, कारण आगगाडीने वेग बदललेला नाही. नाणे आणि पाय तेवढेच आडवे अंतर कापतात, म्हणून ते भेटतात. विशेष काहीही घडत नाही — या चौकटीत नाणे परवलयावर चालते — पण दोन्ही परवलयी मार्ग तेच आडवे अंतर राखतात, जे शून्य आहे. आता त्वरित होणारा डबा. नाणे सुटल्यावर त्यावर आडवे काहीही लागत नाही, म्हणून ते सुटण्याच्या क्षणीचा पुढचा वेग राखते. जमीन राखत नाही: तिला इंजिन ढकलत आहे आणि ती पतनादरम्यान वेग मिळवते. फलाटाच्या चौकटीत जमीन नाण्याहून अधिक जमीन कापते, म्हणून नाणे ज्या बिंदूवरून टाकले त्याच्या मागे पडते — त्याला मागे फेकले म्हणून नव्हे, तर बाकी सर्व अधिक वेगाने पुढे गेले म्हणून. हीच या प्रयोगाची कमाई. एकसमान चालणाऱ्या आगगाडीत नाणे नेमके तसेच वागते जसे फलाटावर स्थिर असताना; तसाच झुलणारा लंबक, तसाच मार्गिकेत घरंगळलेला चेंडू, तसाच आत करता येणारा प्रत्येक दुसरा यांत्रिक प्रयोग. तत्त्वतः असे कोणतेही माप नाही जे डबा चालतो आहे हे सांगेल. म्हणून वेग हा पिंडाचा स्वतःचा गुणधर्म नाही — तो केवळ निवडलेल्या चौकटीच्या सापेक्ष असतो, आणि हेच प्रकरणात आधी भेटलेल्या सापेक्ष-वेग नियमाचे सार. त्वरित होणाऱ्या आगगाडीत परिस्थिती पूर्णपणे वेगळी. इथे प्रयोग गती उघड करतात: नाणे बाजूला पडते, टांगलेली पिशवी मागे झुलते, जमिनीवरचा चेंडू कोणी न स्पर्शता मागच्या टोकाकडे घरंगळतो. जो प्रवासी डब्यालाच आपली चौकट मानायचा हट्ट धरतो त्याला ही समजावायला एक बल घडवावे लागते — तथाकथित छद्मबल — आणि हेच कायमचे चिन्ह की चौकट जडत्वीय नाही. म्हणून दोन डबे सर्व चौकटींना दोन वर्गांत विभागतात. एकसमान गती काहीही बदलत नाही आणि पकडता येत नाही; त्वरण सर्व बदलते आणि स्वतःची घोषणा करते. हेच विभाजन न्यूटनच्या पहिल्या नियमाचे प्रयोजन: तो 'वस्तू चालत राहतात' हा किरकोळ दावा नव्हे, तर अशा चौकटी अस्तित्वात आहेत ज्यांत त्या तसे करतात हे प्रतिपादन, आणि त्वरित होणारा डबा त्यांपैकी एक नाही. (चुकीची उत्तरे परिणाम किती वेगावर टेकवतात, वेग बदलतो आहे का यावर नव्हे, काम हवेवर सोपवतात जी त्याच परीक्षेत नापास होईल, वा गुरुत्व बदलतात, ज्याला कोणत्याही डब्यातले कोणतेही माप आधार देत नाही.)",
        },
      },
      /*H2*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Motion in a Plane                                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-motion-in-a-plane",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 3 — Motion in a Plane",
      hi: "अध्याय 3 — समतल में गति",
      mr: "प्रकरण 3 — प्रतलातील गती",
    },
    name: {
      en: "Motion in a Plane",
      hi: "समतल में गति",
      mr: "प्रतलातील गती",
    },
    summary: {
      en: "Adding a second dimension costs one idea and buys the rest: two quantities that add nose-to-tail rather than by counting, a motion that can be cut into two independent motions that never consult each other, a thrown ball whose horizontal half is bored and whose vertical half is in free fall, two angles that land in the same place, and a body that accelerates continuously while its speed never changes at all.",
      hi: "दूसरी विमा जोड़ना एक विचार की क़ीमत लेता है और बाक़ी सब दे देता है: दो राशियाँ जो गिनकर नहीं, सिर-से-पूँछ जुड़ती हैं, वह गति जिसे दो स्वतंत्र गतियों में काटा जा सकता है जो आपस में कभी सलाह नहीं करतीं, वह फेंकी गेंद जिसका क्षैतिज आधा ऊबा हुआ है और ऊर्ध्वाधर आधा मुक्त पतन में, दो कोण जो एक ही जगह गिरते हैं, और वह पिंड जो लगातार त्वरित होता है जबकि उसकी चाल बिलकुल नहीं बदलती।",
      mr: "दुसरी मिती जोडणे एका कल्पनेची किंमत घेते आणि बाकी सर्व देते: दोन राशी ज्या मोजून नव्हे तर डोके-ते-शेपूट जोडल्या जातात, ती गती जिचे दोन स्वतंत्र गतींत तुकडे करता येतात ज्या एकमेकींचा कधीही सल्ला घेत नाहीत, तो फेकलेला चेंडू ज्याचा आडवा अर्धा कंटाळलेला आणि उभा अर्धा मुक्त पतनात, दोन कोन जे एकाच जागी पडतात, आणि तो पिंड जो सतत त्वरित होतो तर त्याची चाल मुळीच बदलत नाही.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "triangle-law",
        name: {
          en: "The triangle law of addition",
          hi: "योग का त्रिभुज नियम",
          mr: "बेरजेचा त्रिकोण नियम",
        },
        kind: "vector rule",
        prompt: {
          en: "Two quantities of 3 and 4 units can combine to give anything from 1 to 7 depending on the angle between them, because the second is drawn from the tip of the first and the result runs from the free tail to the free head. Which rule is this?",
          hi: "3 और 4 इकाइयों की दो राशियाँ मिलकर उनके बीच के कोण के अनुसार 1 से 7 तक कुछ भी दे सकती हैं, क्योंकि दूसरी को पहली की नोक से खींचा जाता है और परिणाम खुली पूँछ से खुले सिर तक जाता है। यह कौन-सा नियम है?",
          mr: "3 आणि 4 एककांच्या दोन राशी मिळून त्यांच्यातील कोनानुसार 1 ते 7 पर्यंत काहीही देऊ शकतात, कारण दुसरी पहिलीच्या टोकापासून काढली जाते आणि निकाल मोकळ्या शेपटापासून मोकळ्या डोक्यापर्यंत जातो. हा कोणता नियम?",
        },
        statement: {
          en: "The triangle law places the tail of the second vector at the head of the first and takes the closing side as the sum, which is why the magnitude of a sum can be smaller than either quantity being added.",
          hi: "त्रिभुज नियम दूसरे सदिश की पूँछ को पहले के सिर पर रखता है और बंद करने वाली भुजा को योग मानता है, इसीलिए योग का परिमाण जोड़ी जा रही किसी भी राशि से छोटा हो सकता है।",
          mr: "त्रिकोण नियम दुसऱ्या सदिशाची शेपूट पहिल्याच्या डोक्यावर ठेवतो आणि बंद करणारी बाजू बेरीज मानतो, म्हणूनच बेरजेचे परिमाण जोडल्या जाणाऱ्या कोणत्याही राशीहून लहान असू शकते.",
        },
        detail: {
          en: "For two vectors at right angles it collapses to Pythagoras, so 3 and 4 perpendicular units give exactly 5, and that is the only angle at which the arithmetic is that easy.",
          hi: "समकोण पर दो सदिशों के लिए यह पाइथागोरस बन जाता है, अतः 3 और 4 लंबवत इकाइयाँ ठीक 5 देती हैं, और केवल इसी कोण पर गणित इतना आसान होता है।",
          mr: "काटकोनातील दोन सदिशांसाठी हा पायथागोरस बनतो, म्हणून 3 आणि 4 लंब एकके नेमकी 5 देतात, आणि केवळ याच कोनावर गणित इतके सोपे असते.",
        },
        extra: {
          en: "Addition of vectors is commutative and associative like ordinary addition, but subtraction is defined by reversing the second vector and adding, so the order of a difference genuinely matters.",
          hi: "सदिशों का योग साधारण योग की तरह क्रमविनिमेय और साहचर्य है, पर घटाव दूसरे सदिश को उलटकर जोड़ने से परिभाषित है, अतः अंतर में क्रम सचमुच मायने रखता है।",
          mr: "सदिशांची बेरीज सामान्य बेरजेप्रमाणे क्रमविनिमेय आणि साहचर्य आहे, पण वजाबाकी दुसरा सदिश उलटवून जोडून व्याख्यायित होते, म्हणून फरकात क्रम खरोखर महत्त्वाचा असतो.",
        },
        pair: {
          left: {
            en: "A sum that can be smaller than either part",
            hi: "ऐसा योग जो किसी भी भाग से छोटा हो सकता है",
            mr: "अशी बेरीज जी कोणत्याही भागाहून लहान असू शकते",
          },
          right: {
            en: "the triangle law of addition",
            hi: "योग का त्रिभुज नियम",
            mr: "बेरजेचा त्रिकोण नियम",
          },
        },
      },
      {
        id: "resolution-into-components",
        name: {
          en: "Resolution into components",
          hi: "घटकों में वियोजन",
          mr: "घटकांत विभाजन",
        },
        kind: "vector rule",
        prompt: {
          en: "A single arrow at 60° is replaced by two arrows along the axes, of sizes A cos θ and A sin θ, and every later calculation is done on the two separately before being put back together. Which step is this?",
          hi: "60° पर एक अकेला तीर अक्षों के अनुदिश दो तीरों से बदल दिया जाता है, जिनके आकार A cos θ और A sin θ हैं, और आगे की हर गणना दोनों पर अलग-अलग की जाती है, फिर उन्हें वापस जोड़ा जाता है। यह कौन-सा चरण है?",
          mr: "60° वरचा एकच बाण अक्षांच्या दिशेने दोन बाणांनी बदलला जातो, ज्यांचे आकार A cos θ आणि A sin θ, आणि पुढची प्रत्येक गणना दोहोंवर स्वतंत्रपणे केली जाते, मग ती पुन्हा जोडली जातात. हा कोणता टप्पा?",
        },
        statement: {
          en: "Resolution replaces one vector by its projections A cos θ and A sin θ on two perpendicular axes, and it is exact rather than approximate because the two projections reconstruct the original by the triangle law.",
          hi: "वियोजन एक सदिश को दो लंबवत अक्षों पर उसके प्रक्षेप A cos θ और A sin θ से बदल देता है, और यह सन्निकट नहीं बल्कि यथार्थ है क्योंकि दोनों प्रक्षेप त्रिभुज नियम से मूल सदिश को फिर बना देते हैं।",
          mr: "विभाजन एका सदिशाला दोन लंब अक्षांवरील त्याच्या प्रक्षेपांनी — A cos θ आणि A sin θ — बदलते, आणि हे अंदाजे नव्हे तर नेमके आहे कारण दोन्ही प्रक्षेप त्रिकोण नियमाने मूळ सदिश पुन्हा उभा करतात.",
        },
        detail: {
          en: "The axes may be chosen freely, and the usual reason for tilting them is to make one component vanish — along an inclined plane, choosing the axes along and across the slope leaves gravity with only two terms to manage.",
          hi: "अक्ष स्वतंत्र रूप से चुने जा सकते हैं, और उन्हें झुकाने का सामान्य कारण किसी एक घटक को शून्य कर देना है — नत तल पर, ढलान के अनुदिश और आर-पार अक्ष चुनने से गुरुत्व के पास सँभालने को केवल दो पद बचते हैं।",
          mr: "अक्ष मुक्तपणे निवडता येतात, आणि त्यांना कलवण्याचे नेहमीचे कारण म्हणजे एखादा घटक शून्य करणे — उताराच्या पातळीवर, उताराच्या दिशेने आणि आडवे अक्ष निवडल्यास गुरुत्वाकडे हाताळायला फक्त दोन पदे उरतात.",
        },
        extra: {
          en: "Because cos and sin never exceed one, no component can be larger than the vector itself, which is a quick check on any resolution that has gone wrong.",
          hi: "चूँकि cos और sin कभी एक से बड़े नहीं होते, कोई भी घटक स्वयं सदिश से बड़ा नहीं हो सकता, और यही किसी बिगड़े वियोजन की झटपट जाँच है।",
          mr: "cos आणि sin कधीही एकाहून मोठे नसल्याने कोणताही घटक स्वतः सदिशाहून मोठा असू शकत नाही, आणि हीच बिघडलेल्या विभाजनाची झटपट तपासणी.",
        },
        pair: {
          left: {
            en: "Tilt the axes until a component vanishes",
            hi: "अक्षों को तब तक झुकाओ जब तक कोई घटक शून्य न हो जाए",
            mr: "एखादा घटक शून्य होईपर्यंत अक्ष कलवा",
          },
          right: {
            en: "resolution into components",
            hi: "घटकों में वियोजन",
            mr: "घटकांत विभाजन",
          },
        },
      },
      {
        id: "independence-of-components",
        name: {
          en: "The independence of perpendicular motions",
          hi: "लंबवत गतियों की स्वतंत्रता",
          mr: "लंब गतींची स्वतंत्रता",
        },
        kind: "principle",
        prompt: {
          en: "A bullet fired horizontally and a bullet dropped from the same height at the same moment strike the ground together, because what happens along one axis is decided only by the forces along that axis. Which principle is this?",
          hi: "क्षैतिज दागी गई गोली और उसी ऊँचाई से उसी क्षण गिराई गई गोली ज़मीन पर साथ पहुँचती हैं, क्योंकि एक अक्ष पर जो होता है उसे केवल उसी अक्ष के बल तय करते हैं। यह कौन-सा सिद्धांत है?",
          mr: "आडवी झाडलेली गोळी आणि त्याच उंचीवरून त्याच क्षणी टाकलेली गोळी जमिनीवर एकत्र पोहोचतात, कारण एका अक्षावर जे घडते ते केवळ त्याच अक्षावरील बले ठरवतात. हे कोणते तत्त्व?",
        },
        statement: {
          en: "Perpendicular components of a motion are independent, so a plane motion can be solved as two separate one-dimensional problems that share only the clock.",
          hi: "गति के लंबवत घटक स्वतंत्र होते हैं, अतः समतल गति को दो अलग एक-विमीय प्रश्नों की तरह हल किया जा सकता है जो केवल घड़ी साझा करते हैं।",
          mr: "गतीचे लंब घटक स्वतंत्र असतात, म्हणून प्रतलातील गती दोन वेगळ्या एकमितीय प्रश्नांसारखी सोडवता येते जे केवळ घड्याळ वाटून घेतात.",
        },
        detail: {
          en: "It is the reason a projectile's time of flight can be computed without ever mentioning its horizontal speed, however fast that speed happens to be.",
          hi: "इसी से प्रक्षेप्य का उड्डयन-काल उसकी क्षैतिज चाल का ज़िक्र किए बिना निकाला जा सकता है, चाहे वह चाल कितनी भी हो।",
          mr: "यामुळेच प्रक्षेप्याचा उड्डाणकाळ त्याच्या आडव्या चालीचा उल्लेख न करता काढता येतो, ती चाल कितीही असो.",
        },
        extra: {
          en: "The principle fails the moment a force appears that couples the axes — air drag, which depends on the total speed, makes the vertical fall of a fast bullet genuinely different from that of a dropped one.",
          hi: "यह सिद्धांत उसी क्षण गिर जाता है जब ऐसा बल आ जाए जो अक्षों को जोड़ दे — वायु प्रतिरोध, जो कुल चाल पर निर्भर है, तेज़ गोली के ऊर्ध्वाधर पतन को गिराई गई गोली से सचमुच भिन्न बना देता है।",
          mr: "हे तत्त्व त्याच क्षणी कोसळते जेव्हा अक्षांना जोडणारे बल येते — हवेचा विरोध, जो एकूण चालीवर अवलंबून, वेगवान गोळीचे उभे पतन टाकलेल्या गोळीहून खरोखर वेगळे बनवतो.",
        },
        pair: {
          left: {
            en: "Two one-dimensional problems sharing only a clock",
            hi: "दो एक-विमीय प्रश्न जो केवल घड़ी साझा करते हैं",
            mr: "केवळ घड्याळ वाटून घेणारे दोन एकमितीय प्रश्न",
          },
          right: {
            en: "the independence of perpendicular motions",
            hi: "लंबवत गतियों की स्वतंत्रता",
            mr: "लंब गतींची स्वतंत्रता",
          },
        },
      },
      {
        id: "parabolic-trajectory",
        name: {
          en: "The parabolic trajectory",
          hi: "परवलयी प्रक्षेप-पथ",
          mr: "परवलयी मार्ग",
        },
        kind: "principle",
        prompt: {
          en: "The horizontal coordinate grows in step with the clock while the vertical one falls off as the square of it, and eliminating time between the two leaves y as a quadratic in x. Which path is this?",
          hi: "क्षैतिज निर्देशांक घड़ी के साथ कदम मिलाकर बढ़ता है जबकि ऊर्ध्वाधर उसके वर्ग के अनुसार गिरता है, और दोनों के बीच से समय हटा देने पर y, x में द्विघात बचता है। यह कौन-सा पथ है?",
          mr: "आडवा निर्देशांक घड्याळाशी पावले जुळवत वाढतो तर उभा त्याच्या वर्गानुसार खाली येतो, आणि दोहोंमधून काळ काढून टाकल्यास y हा x मध्ये द्विघात उरतो. हा कोणता मार्ग?",
        },
        statement: {
          en: "A projectile under gravity alone traces a parabola, because uniform horizontal motion and uniformly accelerated vertical motion combine into a quadratic relation between the two coordinates.",
          hi: "केवल गुरुत्व के अधीन प्रक्षेप्य परवलय खींचता है, क्योंकि एकसमान क्षैतिज गति और एकसमान त्वरित ऊर्ध्वाधर गति मिलकर दोनों निर्देशांकों के बीच द्विघात संबंध बनाती हैं।",
          mr: "केवळ गुरुत्वाखालील प्रक्षेप्य परवलय काढतो, कारण एकसमान आडवी गती आणि एकसमान त्वरित उभी गती मिळून दोन्ही निर्देशांकांत द्विघात संबंध तयार करतात.",
        },
        detail: {
          en: "At the highest point the vertical velocity is zero but the horizontal velocity is untouched, so the speed there is u cos θ and never zero unless the throw was straight up.",
          hi: "उच्चतम बिंदु पर ऊर्ध्वाधर वेग शून्य है पर क्षैतिज वेग अछूता है, अतः वहाँ चाल u cos θ है और तब तक शून्य नहीं जब तक फेंक सीधी ऊपर न हो।",
          mr: "सर्वोच्च बिंदूवर उभा वेग शून्य पण आडवा वेग अस्पर्श, म्हणून तिथली चाल u cos θ आणि फेक सरळ वर नसेल तर कधीच शून्य नाही.",
        },
        extra: {
          en: "The parabola is an idealisation that assumes no air and a flat, non-rotating Earth; a real cricket ball's path is shorter and steeper on its descending half than on its rising one.",
          hi: "परवलय एक आदर्शीकरण है जो न हवा मानता है, न घूमती और न वक्र पृथ्वी; असली क्रिकेट गेंद का पथ उतरते आधे में चढ़ते आधे से छोटा और अधिक ढालू होता है।",
          mr: "परवलय हे आदर्शीकरण जे हवा नाही आणि सपाट, न फिरणारी पृथ्वी गृहीत धरते; खऱ्या क्रिकेट चेंडूचा मार्ग उतरत्या अर्ध्यात चढत्या अर्ध्याहून लहान आणि अधिक तीव्र असतो.",
        },
        pair: {
          left: {
            en: "Speed at the top is u cos θ, not zero",
            hi: "शिखर पर चाल u cos θ है, शून्य नहीं",
            mr: "शिखरावरची चाल u cos θ, शून्य नव्हे",
          },
          right: {
            en: "the parabolic trajectory",
            hi: "परवलयी प्रक्षेप-पथ",
            mr: "परवलयी मार्ग",
          },
        },
      },
      {
        id: "complementary-angles-of-projection",
        name: {
          en: "Complementary angles of projection",
          hi: "पूरक प्रक्षेपण कोण",
          mr: "पूरक प्रक्षेपण कोन",
        },
        kind: "principle",
        prompt: {
          en: "A ball thrown at 30° and a ball thrown at 60° with the same speed land at exactly the same spot, one taking a low fast path and the other a high slow one, because sin 2θ is the same for both. Which result is this?",
          hi: "समान चाल से 30° पर फेंकी गेंद और 60° पर फेंकी गेंद ठीक एक ही स्थान पर गिरती हैं, एक नीचा तेज़ पथ लेती है और दूसरी ऊँचा धीमा, क्योंकि दोनों के लिए sin 2θ एक ही है। यह कौन-सा परिणाम है?",
          mr: "समान चालीने 30° वर फेकलेला आणि 60° वर फेकलेला चेंडू नेमक्या एकाच जागी पडतात, एक खालचा वेगवान मार्ग घेतो आणि दुसरा उंच सावकाश, कारण दोघांसाठी sin 2θ सारखा आहे. हा कोणता निकाल?",
        },
        statement: {
          en: "Two angles adding to 90° give the same horizontal range for the same launch speed, because the range u² sin 2θ / g depends on the angle only through sin 2θ, which is unchanged when θ is replaced by 90° − θ.",
          hi: "90° में जुड़ने वाले दो कोण समान प्रक्षेपण चाल पर समान क्षैतिज परास देते हैं, क्योंकि परास u² sin 2θ / g कोण पर केवल sin 2θ के माध्यम से निर्भर है, जो θ की जगह 90° − θ रखने पर नहीं बदलता।",
          mr: "90° मध्ये भरणारे दोन कोन समान प्रक्षेपण चालीवर समान आडवी पल्ला देतात, कारण पल्ला u² sin 2θ / g हा कोनावर केवळ sin 2θ मार्गे अवलंबून, जो θ ऐवजी 90° − θ ठेवल्यास बदलत नाही.",
        },
        detail: {
          en: "The maximum range comes at 45°, where the two complementary angles coincide, and it is u²/g exactly.",
          hi: "अधिकतम परास 45° पर आती है, जहाँ दोनों पूरक कोण एक हो जाते हैं, और वह ठीक u²/g है।",
          mr: "कमाल पल्ला 45° वर येतो, जिथे दोन्ही पूरक कोन एक होतात, आणि तो नेमका u²/g आहे.",
        },
        extra: {
          en: "The two paths are not equally useful: the steeper one stays in the air longer and arrives more slowly, which is why a fielder's throw is flat and a mortar's is not.",
          hi: "दोनों पथ समान रूप से उपयोगी नहीं: अधिक ढालू पथ हवा में अधिक देर रहता है और धीमे पहुँचता है, इसीलिए क्षेत्ररक्षक का थ्रो चपटा होता है और मोर्टार का नहीं।",
          mr: "दोन्ही मार्ग सारखेच उपयुक्त नाहीत: अधिक तीव्र मार्ग हवेत जास्त वेळ राहतो आणि सावकाश पोहोचतो, म्हणूनच क्षेत्ररक्षकाचा फेक सपाट असतो आणि मोर्टारचा नाही.",
        },
        pair: {
          left: {
            en: "Same landing spot, different time of flight",
            hi: "गिरने का स्थान एक, उड्डयन-काल भिन्न",
            mr: "पडण्याची जागा एक, उड्डाणकाळ वेगळा",
          },
          right: {
            en: "complementary angles of projection",
            hi: "पूरक प्रक्षेपण कोण",
            mr: "पूरक प्रक्षेपण कोन",
          },
        },
      },
      {
        id: "centripetal-acceleration",
        name: {
          en: "Centripetal acceleration",
          hi: "अभिकेंद्र त्वरण",
          mr: "अभिकेंद्री त्वरण",
        },
        kind: "principle",
        prompt: {
          en: "A stone whirled on a string at a steady speed is accelerating at every instant, because its direction is changing, and that acceleration of size v²/r points always at the centre and never along the path. Which quantity is this?",
          hi: "डोरी पर स्थिर चाल से घुमाया जाता पत्थर हर क्षण त्वरित हो रहा है, क्योंकि उसकी दिशा बदल रही है, और v²/r आकार का वह त्वरण सदा केंद्र की ओर होता है, पथ के अनुदिश कभी नहीं। यह कौन-सी राशि है?",
          mr: "दोरीवर स्थिर चालीने फिरवला जाणारा दगड प्रत्येक क्षणी त्वरित होत आहे, कारण त्याची दिशा बदलत आहे, आणि v²/r आकाराचे ते त्वरण नेहमी केंद्राकडे असते, मार्गाच्या दिशेने कधीच नाही. ही कोणती राशी?",
        },
        statement: {
          en: "Centripetal acceleration has magnitude v²/r and points towards the centre of the circular path, so a body in uniform circular motion accelerates continuously although its speed never changes.",
          hi: "अभिकेंद्र त्वरण का परिमाण v²/r है और वह वृत्तीय पथ के केंद्र की ओर होता है, अतः एकसमान वृत्तीय गति में पिंड लगातार त्वरित होता है यद्यपि उसकी चाल कभी नहीं बदलती।",
          mr: "अभिकेंद्री त्वरणाचे परिमाण v²/r आणि ते वर्तुळाकार मार्गाच्या केंद्राकडे असते, म्हणून एकसमान वर्तुळाकार गतीतील पिंड सतत त्वरित होतो जरी त्याची चाल कधीही बदलत नाही.",
        },
        detail: {
          en: "Being perpendicular to the velocity at every instant, it changes direction without doing any work, which is why the speed can stay constant while the acceleration never stops.",
          hi: "हर क्षण वेग के लंबवत होने से वह बिना कोई कार्य किए दिशा बदलता है, इसीलिए चाल अचर रह सकती है जबकि त्वरण कभी रुकता नहीं।",
          mr: "प्रत्येक क्षणी वेगाला लंब असल्याने ते कोणतेही कार्य न करता दिशा बदलते, म्हणूनच चाल अचल राहू शकते तर त्वरण कधीही थांबत नाही.",
        },
        extra: {
          en: "When the string is cut the stone does not fly outwards along the radius but along the tangent, which is the direction its velocity already had.",
          hi: "डोरी कटने पर पत्थर त्रिज्या के अनुदिश बाहर नहीं उड़ता बल्कि स्पर्शरेखा के अनुदिश, जो दिशा उसके वेग की पहले से थी।",
          mr: "दोरी तुटल्यावर दगड त्रिज्येच्या दिशेने बाहेर उडत नाही तर स्पर्शिकेच्या दिशेने, जी दिशा त्याच्या वेगाची आधीच होती.",
        },
        pair: {
          left: {
            en: "Cut the string and it leaves along the tangent",
            hi: "डोरी काटो और वह स्पर्शरेखा के अनुदिश निकलता है",
            mr: "दोरी कापा आणि तो स्पर्शिकेच्या दिशेने निघतो",
          },
          right: {
            en: "centripetal acceleration",
            hi: "अभिकेंद्र त्वरण",
            mr: "अभिकेंद्री त्वरण",
          },
        },
      },
      /*F3*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A hunter aims a rifle exactly at a monkey hanging from a branch. At the instant the shot is fired the monkey lets go and falls. A student says the hunter should have aimed above the monkey to allow for the bullet's drop. Decide who is right, and say what it depends on.",
          hi: "एक शिकारी बंदूक ठीक उस बंदर पर ताने हुए है जो डाल से लटका है। गोली छूटने के क्षण बंदर छोड़ देता है और गिरता है। एक विद्यार्थी कहता है कि गोली के गिरने का हिसाब रखने के लिए शिकारी को बंदर से ऊपर ताकना चाहिए था। तय करो कौन सही है, और यह किस पर निर्भर है।",
          mr: "एक शिकारी बंदूक नेमकी फांदीवर लटकलेल्या माकडावर रोखतो. गोळी सुटण्याच्या क्षणी माकड सोडून देते आणि पडते. एक विद्यार्थी म्हणतो की गोळीच्या पडण्याचा हिशोब ठेवायला शिकाऱ्याने माकडाच्या वर रोखायला हवे होते. कोण बरोबर ते ठरवा, आणि हे कशावर अवलंबून ते सांगा.",
        },
        choices: [
          {
            en: "Aiming straight at the monkey is right. In the time the bullet takes to arrive, gravity pulls it below the line of aim by exactly ½gt², and it pulls the falling monkey below its branch by exactly ½gt² as well — the same acceleration acting for the same time on both. The bullet therefore meets the monkey wherever it has fallen to. What it depends on is only that the bullet reach the tree at all before either hits the ground, which sets a minimum muzzle speed but changes nothing about the aim",
            hi: "सीधे बंदर पर ताकना ही सही है। गोली को पहुँचने में जितना समय लगता है, उतने में गुरुत्व उसे निशाने की रेखा से ठीक ½gt² नीचे खींचता है, और गिरते बंदर को भी उसकी डाल से ठीक ½gt² नीचे — दोनों पर वही त्वरण, वही समय। अतः गोली बंदर से वहीं मिलती है जहाँ तक वह गिर चुका है। निर्भरता केवल इस पर है कि गोली पेड़ तक पहुँचे इससे पहले कि कोई ज़मीन पर आ जाए, जो न्यूनतम नाल-चाल तय करता है पर निशाने के बारे में कुछ नहीं बदलता",
            mr: "थेट माकडावर रोखणेच बरोबर. गोळीला पोहोचायला जितका वेळ लागतो, तितक्यात गुरुत्व तिला रोखलेल्या रेषेखाली नेमके ½gt² ओढते, आणि पडणाऱ्या माकडालाही त्याच्या फांदीखाली नेमके ½gt² — दोघांवर तेच त्वरण, तोच काळ. म्हणून गोळी माकडाला तो जिथवर पडला असेल तिथेच भेटते. अवलंबित्व फक्त एवढेच की गोळी झाडापर्यंत पोहोचावी, दोघांपैकी कोणी जमिनीवर येण्याआधी, जे किमान नळी-चाल ठरवते पण रोखण्याबद्दल काहीही बदलत नाही",
          },
          {
            en: "The student is right: the bullet drops but the monkey's fall is irrelevant, so the aim must be raised by ½gt²",
            hi: "विद्यार्थी सही है: गोली गिरती है पर बंदर का गिरना अप्रासंगिक है, अतः निशाना ½gt² ऊपर उठाना चाहिए",
            mr: "विद्यार्थी बरोबर: गोळी पडते पण माकडाचे पडणे असंबद्ध, म्हणून नेम ½gt² ने वर उचलावा",
          },
          {
            en: "The hunter should aim below the monkey, since the bullet's high speed keeps it from falling as much as the monkey does",
            hi: "शिकारी को बंदर से नीचे ताकना चाहिए, क्योंकि गोली की तेज़ चाल उसे बंदर जितना गिरने नहीं देती",
            mr: "शिकाऱ्याने माकडाच्या खाली रोखावे, कारण गोळीची जास्त चाल तिला माकडाइतके पडू देत नाही",
          },
          {
            en: "It cannot be decided without knowing the bullet's speed, because a faster bullet falls through a smaller vertical distance than a slower one over the same distance to the tree",
            hi: "गोली की चाल जाने बिना तय नहीं हो सकता, क्योंकि पेड़ तक की उसी दूरी में तेज़ गोली धीमी से कम ऊर्ध्वाधर दूरी गिरती है",
            mr: "गोळीची चाल कळल्याशिवाय ठरवता येत नाही, कारण झाडापर्यंतच्या त्याच अंतरात वेगवान गोळी सावकाशहून कमी उभे अंतर पडते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Set the axes along and across the line of aim and the independence principle does the rest. Take t as the flight time. Along the line of aim the bullet advances at its muzzle speed, unaffected by gravity, and after time t it has reached the horizontal position of the tree. Across that line, gravity has pulled it down by ½gt² from where the barrel pointed. So the bullet arrives at the tree a distance ½gt² below the monkey's original position. Now the monkey. It left the branch at the same instant with zero initial velocity and the same acceleration g, so after the same time t it too is ½gt² below its original position. Two objects, the same downward displacement, the same starting height, the same moment of release: they are at the same point. The bullet hits. Notice what the argument never used. It never used the muzzle speed. It never used the distance to the tree. It never used g. Those quantities decide WHEN the meeting happens and where in space, but the vertical drops cancel identically whatever their values are, because both objects are subject to exactly the same vertical motion. This is the independence of perpendicular components at its cleanest: the bullet's large horizontal velocity has no say whatever in how fast it falls, and neither does the monkey's lack of one. The fourth option is the interesting wrong answer, because it contains a true statement. A faster bullet does drop through a smaller vertical distance on its way to the tree — it gets there sooner, so t is smaller and ½gt² is smaller. But the monkey has been falling for exactly that same shorter time, so it too has dropped less, by the same amount. The two effects are not merely similar; they are the same quantity. Speed changes where the collision occurs, never whether it occurs. The one real condition is that the bullet reach the tree before either object hits the ground. Below some muzzle speed the flight takes so long that the monkey lands first and the bullet passes over the spot. That is a limit on the demonstration, not on the aim: at any speed for which the meeting happens in the air at all, aiming straight at the monkey is exactly right. (The wrong answers correct for a drop that has already been cancelled, invent an upward force on fast bullets, or stop one step short of noticing that the same time appears in both drops.)",
          hi: "अक्षों को निशाने की रेखा के अनुदिश और आर-पार रखो, बाक़ी स्वतंत्रता का सिद्धांत कर देता है। उड़ान का समय t लो। निशाने की रेखा के अनुदिश गोली अपनी नाल-चाल से बढ़ती है, गुरुत्व से अप्रभावित, और समय t बाद पेड़ की क्षैतिज स्थिति तक पहुँच चुकी है। उस रेखा के आर-पार, गुरुत्व ने उसे वहाँ से ½gt² नीचे खींच दिया है जहाँ नाल ताना था। अतः गोली पेड़ पर बंदर की मूल स्थिति से ½gt² नीचे पहुँचती है। अब बंदर। उसने उसी क्षण शून्य आरंभिक वेग और वही त्वरण g लेकर डाल छोड़ी, अतः उसी समय t बाद वह भी अपनी मूल स्थिति से ½gt² नीचे है। दो वस्तुएँ, वही अधोमुखी विस्थापन, वही आरंभिक ऊँचाई, छूटने का वही क्षण: वे एक ही बिंदु पर हैं। गोली लगती है। ध्यान दो तर्क ने क्या कभी इस्तेमाल नहीं किया। उसने नाल-चाल कभी इस्तेमाल नहीं की। पेड़ तक की दूरी कभी नहीं। g कभी नहीं। वे राशियाँ तय करती हैं कि मिलन कब और अंतरिक्ष में कहाँ होगा, पर ऊर्ध्वाधर पतन उनके मान चाहे जो हों समान रूप से कट जाते हैं, क्योंकि दोनों वस्तुएँ ठीक उसी ऊर्ध्वाधर गति के अधीन हैं। यह लंबवत घटकों की स्वतंत्रता अपने सबसे स्वच्छ रूप में है: गोली के बड़े क्षैतिज वेग का इसमें कोई दख़ल नहीं कि वह कितनी तेज़ी से गिरती है, और बंदर के पास वैसा वेग न होने का भी नहीं। चौथा विकल्प दिलचस्प ग़लत उत्तर है, क्योंकि उसमें एक सच्चा कथन है। तेज़ गोली पेड़ तक के रास्ते में सचमुच कम ऊर्ध्वाधर दूरी गिरती है — वह जल्दी पहुँचती है, अतः t छोटा और ½gt² छोटा। पर बंदर भी ठीक उसी छोटे समय तक गिर रहा था, अतः वह भी उतना ही कम गिरा है। दोनों प्रभाव केवल मिलते-जुलते नहीं; वे एक ही राशि हैं। चाल यह बदलती है कि टक्कर कहाँ होगी, यह कभी नहीं कि होगी या नहीं। एक असली शर्त यह कि गोली पेड़ तक पहुँचे इससे पहले कि कोई वस्तु ज़मीन पर आ जाए। किसी नाल-चाल से नीचे उड़ान इतनी लंबी हो जाती है कि बंदर पहले उतर जाता है और गोली उस जगह के ऊपर से निकल जाती है। यह प्रदर्शन की सीमा है, निशाने की नहीं: जिस भी चाल पर मिलन हवा में होता है, सीधे बंदर पर ताकना ठीक सही है। (ग़लत उत्तर उस पतन के लिए सुधार करते जो पहले ही कट चुका, तेज़ गोलियों पर ऊर्ध्व बल गढ़ते, या यह देखने से एक क़दम पहले रुक जाते कि दोनों पतनों में वही समय आता है।)",
          mr: "अक्ष नेमाच्या रेषेच्या दिशेने आणि आडवे ठेवा, बाकी स्वतंत्रतेचे तत्त्व करते. उड्डाणाचा काळ t घ्या. नेमाच्या रेषेच्या दिशेने गोळी आपल्या नळी-चालीने पुढे जाते, गुरुत्वाने अप्रभावित, आणि t काळानंतर झाडाच्या आडव्या स्थानापर्यंत पोहोचली आहे. त्या रेषेच्या आडवे, गुरुत्वाने तिला नळी जिथे रोखली होती तिथून ½gt² खाली ओढले आहे. म्हणून गोळी झाडापाशी माकडाच्या मूळ स्थानाहून ½gt² खाली पोहोचते. आता माकड. त्याने त्याच क्षणी शून्य सुरुवातीचा वेग आणि तेच त्वरण g घेऊन फांदी सोडली, म्हणून त्याच t काळानंतर तेही आपल्या मूळ स्थानाहून ½gt² खाली आहे. दोन वस्तू, तेच अधोमुख विस्थापन, तीच सुरुवातीची उंची, सुटण्याचा तोच क्षण: ती एकाच बिंदूवर आहेत. गोळी लागते. लक्षात घ्या युक्तिवादाने काय कधीच वापरले नाही. त्याने नळी-चाल कधीच वापरली नाही. झाडापर्यंतचे अंतर कधीच नाही. g कधीच नाही. त्या राशी ठरवतात की भेट केव्हा आणि अवकाशात कुठे होईल, पण उभी पतने त्यांची मूल्ये काहीही असोत सारखीच कापली जातात, कारण दोन्ही वस्तू नेमक्या त्याच उभ्या गतीच्या अधीन आहेत. हे लंब घटकांच्या स्वतंत्रतेचे सर्वांत स्वच्छ रूप: गोळीच्या मोठ्या आडव्या वेगाचा ती किती वेगाने पडते यात काहीही हस्तक्षेप नाही, आणि माकडाकडे तसा वेग नसण्याचाही नाही. चौथा पर्याय हे रोचक चुकीचे उत्तर, कारण त्यात एक खरे विधान आहे. वेगवान गोळी झाडापर्यंतच्या वाटेत खरोखर कमी उभे अंतर पडते — ती लवकर पोहोचते, म्हणून t लहान आणि ½gt² लहान. पण माकडही नेमक्या त्याच लहान काळापुरते पडत होते, म्हणून तेही तितकेच कमी पडले आहे. दोन्ही परिणाम केवळ सारखे नाहीत; ती एकच राशी आहे. चाल टक्कर कुठे होईल ते बदलते, ती होईल की नाही ते कधीच नाही. एक खरी अट म्हणजे गोळीने झाडापर्यंत पोहोचावे, दोघांपैकी कोणी जमिनीवर येण्याआधी. एका नळी-चालीखाली उड्डाण इतके लांब होते की माकड आधी उतरते आणि गोळी त्या जागेवरून निघून जाते. ही प्रात्यक्षिकाची मर्यादा, नेमाची नव्हे: ज्या कोणत्याही चालीवर भेट हवेत होते, तिथे थेट माकडावर रोखणे नेमके बरोबर. (चुकीची उत्तरे आधीच कापल्या गेलेल्या पतनासाठी दुरुस्ती करतात, वेगवान गोळ्यांवर वरचे बल घडवतात, वा दोन्ही पतनांत तोच काळ येतो हे पाहण्याच्या एक पाऊल आधी थांबतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A car goes round a level circular track at a steady speed. A passenger says they are thrown outwards and that there must be an outward force. A physicist says there is no outward force and the net force is inwards. Reconcile the two accounts.",
          hi: "एक कार समतल वृत्तीय पथ पर स्थिर चाल से घूमती है। एक सवारी कहती है कि वह बाहर की ओर फेंकी जा रही है और कोई बाहरी बल अवश्य होगा। एक भौतिकीविद कहते हैं कि कोई बाहरी बल नहीं और परिणामी बल भीतर की ओर है। दोनों विवरणों में मेल बिठाओ।",
          mr: "एक कार सपाट वर्तुळाकार मार्गावर स्थिर चालीने फिरते. एक प्रवासी म्हणतो की तो बाहेर फेकला जात आहे आणि बाहेरचे बल असलेच पाहिजे. एक भौतिकशास्त्रज्ञ म्हणतात की बाहेरचे बल नाही आणि परिणामी बल आतल्या दिशेने आहे. दोन्ही वर्णनांची सांगड घाला.",
        },
        choices: [
          {
            en: "Both describe the same motion from different frames. From the ground, the passenger's body tends to continue in a straight line and it is the door that pushes inwards to bend the path; the passenger feels that inward push against their side and interprets the pressure as being flung outwards. From the rotating car frame, which is accelerating and therefore not inertial, the passenger must invent an outward pseudo-force to make Newton's laws come out right. Only the ground account names a force with an agent, and that force is inwards",
            hi: "दोनों एक ही गति का वर्णन भिन्न निर्देश-तंत्रों से करते हैं। ज़मीन से देखें तो सवारी का शरीर सीधी रेखा में चलते रहना चाहता है और दरवाज़ा ही भीतर की ओर धकेलकर पथ मोड़ता है; सवारी अपने पार्श्व पर वही भीतरी धक्का महसूस करती है और दबाव को बाहर फेंके जाने के रूप में पढ़ती है। घूमती कार के तंत्र से, जो त्वरित है और इसलिए जड़त्वीय नहीं, सवारी को न्यूटन के नियम सही निकालने के लिए एक बाहरी छद्म बल गढ़ना पड़ता है। केवल ज़मीन वाला विवरण ऐसे बल का नाम लेता है जिसका कोई कर्ता है, और वह बल भीतर की ओर है",
            mr: "दोघेही एकाच गतीचे वर्णन वेगळ्या चौकटींतून करतात. जमिनीवरून पाहता प्रवाशाचे शरीर सरळ रेषेत चालू राहू पाहते आणि दरवाजाच आत ढकलून मार्ग वळवतो; प्रवाशाला आपल्या कुशीवर तोच आतला रेटा जाणवतो आणि तो दाब बाहेर फेकले जाणे म्हणून वाचतो. फिरत्या कारच्या चौकटीतून, जी त्वरित आहे आणि म्हणून जडत्वीय नाही, प्रवाशाला न्यूटनचे नियम बरोबर निघावेत यासाठी बाहेरचे छद्मबल घडवावे लागते. केवळ जमिनीवरचे वर्णन कर्ता असलेल्या बलाचे नाव घेते, आणि ते बल आतल्या दिशेने आहे",
          },
          {
            en: "The passenger is simply wrong and feels nothing at all; the sensation of being pushed outwards is imagined",
            hi: "सवारी बस ग़लत है और उसे कुछ महसूस होता ही नहीं; बाहर धकेले जाने की अनुभूति कल्पित है",
            mr: "प्रवासी फक्त चुकीचा आहे आणि त्याला काहीही जाणवत नाही; बाहेर ढकलले जाण्याची संवेदना काल्पनिक",
          },
          {
            en: "There are two real forces, an inward one from the road and an equal outward one on the passenger, and they cancel exactly",
            hi: "दो असली बल हैं, सड़क से भीतर की ओर एक और सवारी पर बाहर की ओर उतना ही, और वे ठीक-ठीक कट जाते हैं",
            mr: "दोन खरी बले आहेत, रस्त्याकडून आतले एक आणि प्रवाशावर बाहेरचे तितकेच, आणि ती नेमकी कापली जातात",
          },
          {
            en: "The physicist is wrong, because a body moving at constant speed has no acceleration and therefore no net force at all",
            hi: "भौतिकीविद ग़लत हैं, क्योंकि अचर चाल से चलते पिंड में कोई त्वरण नहीं और इसलिए कोई परिणामी बल भी नहीं",
            mr: "भौतिकशास्त्रज्ञ चुकीचे, कारण अचल चालीने जाणाऱ्या पिंडाला त्वरण नाही आणि म्हणून परिणामी बलही नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Start by disposing of the last option, because it is the one a careless reader picks. Acceleration is the rate of change of VELOCITY, and velocity is a vector. A body going round a circle at unchanging speed is changing direction at every instant, so its velocity is changing at every instant, so it is accelerating — continuously, and at the definite rate v²/r directed at the centre. Constant speed and zero acceleration are different statements, and circular motion is the standard example that separates them. Now the ground frame, which is inertial and where every force has an agent. The passenger's body, left alone, would continue in a straight line tangent to the circle. It does not, so something must be pushing it towards the centre. Working outwards from the road: friction between tyres and road provides the inward force on the car; the seat and the door provide it on the passenger. Every force in this account can be named, and the object exerting it can be pointed at. Their resultant is inwards, of magnitude mv²/r. There is no outward force anywhere in the list, and there is nothing left over for one to be. What, then, does the passenger feel? Precisely the door pressing on their side. That pressure is real — a pressure gauge would read it — and its direction is inwards. The passenger's brain, however, reports contact pressure as 'being pushed against the door', and from a lifetime of experience concludes that they were flung outwards onto it. The sensation is genuine; the inference about its cause is not. Consider next the car's own frame, rotating with it. In this frame the passenger is at rest, and Newton's second law demands that the forces on a body at rest sum to zero. But the door is definitely pushing inwards. So the sum is not zero, and the second law appears to fail. The fix used everywhere in engineering is to add a fictitious outward force of exactly mv²/r — the centrifugal force — which restores the balance and lets the calculation proceed. It is not a cheat, but it must be labelled honestly: it has no agent, it appears and vanishes with the choice of frame, and it obeys no third-law pairing, because there is no second body to push back. Its presence is the diagnostic that the frame is accelerating. So both accounts predict the same motion and the same reading on any instrument. They differ in which frame they use, and the frames differ in whether forces need agents. The third option is the seductive wrong answer: if a real inward force and a real outward force cancelled, the net force would be zero and the car would travel in a straight line through the barrier. Circular motion requires an UNBALANCED inward force, and that is what the whole idea of centripetal force amounts to — not a new force in nature, but a name for whatever combination of ordinary forces happens to point at the centre. (The other wrong answers deny a sensation the passenger really has, or forget that a changing direction is an acceleration.)",
          hi: "पहले अंतिम विकल्प निपटाओ, क्योंकि उसी को लापरवाह पाठक चुनता है। त्वरण वेग के परिवर्तन की दर है, और वेग सदिश है। अचर चाल से वृत्त पर घूमता पिंड हर क्षण दिशा बदल रहा है, अतः उसका वेग हर क्षण बदल रहा है, अतः वह त्वरित हो रहा है — लगातार, और केंद्र की ओर निर्दिष्ट v²/r की निश्चित दर से। अचर चाल और शून्य त्वरण भिन्न कथन हैं, और वृत्तीय गति वही मानक उदाहरण है जो उन्हें अलग करता है। अब ज़मीन का तंत्र, जो जड़त्वीय है और जहाँ हर बल का कोई कर्ता है। सवारी का शरीर, अकेला छोड़ा जाए तो, वृत्त की स्पर्शरेखा पर सीधी रेखा में चलता रहता। वह नहीं चलता, अतः कुछ उसे केंद्र की ओर धकेल रहा होगा। सड़क से बाहर की ओर काम करते हुए: टायर और सड़क के बीच घर्षण कार पर भीतरी बल देता है; सीट और दरवाज़ा सवारी पर। इस विवरण के हर बल का नाम लिया जा सकता है, और उसे लगाने वाली वस्तु की ओर उँगली उठाई जा सकती है। उनका परिणामी भीतर की ओर है, परिमाण mv²/r. सूची में कहीं कोई बाहरी बल नहीं, और उसके लिए कुछ बचा भी नहीं। तो सवारी महसूस क्या करती है? ठीक वह दरवाज़ा जो उसके पार्श्व पर दबाव डाल रहा है। वह दबाव असली है — दाबमापी उसे पढ़ लेता — और उसकी दिशा भीतर की ओर है। पर सवारी का मस्तिष्क संपर्क-दबाव को 'दरवाज़े पर धकेले जाने' के रूप में दर्ज करता है, और जीवन भर के अनुभव से निष्कर्ष निकालता है कि उसे बाहर फेंककर उस पर पटका गया। अनुभूति सच्ची है; उसके कारण के बारे में अनुमान नहीं। अब कार का अपना तंत्र लो, जो उसके साथ घूमता है। इस तंत्र में सवारी विराम में है, और न्यूटन का दूसरा नियम माँगता है कि विराम में पिंड पर बलों का योग शून्य हो। पर दरवाज़ा निश्चित रूप से भीतर धकेल रहा है। अतः योग शून्य नहीं, और दूसरा नियम विफल दिखता है। अभियांत्रिकी में हर जगह अपनाया गया उपाय है ठीक mv²/r का एक काल्पनिक बाहरी बल जोड़ देना — अपकेंद्री बल — जो संतुलन लौटा देता है और गणना चलने देता है। यह धोखा नहीं, पर उस पर ईमानदार लेबल चाहिए: उसका कोई कर्ता नहीं, वह तंत्र के चुनाव के साथ आता-जाता है, और वह तीसरे नियम की किसी जोड़ी का पालन नहीं करता, क्योंकि पीछे धकेलने को दूसरा पिंड है ही नहीं। उसकी उपस्थिति यही निदान है कि तंत्र त्वरित है। अतः दोनों विवरण वही गति और किसी भी यंत्र पर वही पाठ्यांक बताते हैं। वे इसमें भिन्न हैं कि कौन-सा तंत्र लेते हैं, और तंत्र इसमें भिन्न हैं कि बलों को कर्ता चाहिए या नहीं। तीसरा विकल्प लुभावना ग़लत उत्तर है: यदि असली भीतरी और असली बाहरी बल कट जाते, तो परिणामी बल शून्य होता और कार सीधी रेखा में बाड़ तोड़कर निकल जाती। वृत्तीय गति असंतुलित भीतरी बल माँगती है, और अभिकेंद्र बल का पूरा विचार इतना ही है — प्रकृति का कोई नया बल नहीं, बल्कि साधारण बलों के उस संयोजन का नाम जो केंद्र की ओर निकल आता है। (बाक़ी ग़लत उत्तर सवारी की सचमुच होती अनुभूति नकारते, या भूल जाते कि बदलती दिशा ही त्वरण है।)",
          mr: "आधी शेवटचा पर्याय निकाली काढा, कारण तोच निष्काळजी वाचक निवडतो. त्वरण म्हणजे वेगाच्या बदलाचा दर, आणि वेग सदिश आहे. अचल चालीने वर्तुळावर फिरणारा पिंड प्रत्येक क्षणी दिशा बदलत आहे, म्हणून त्याचा वेग प्रत्येक क्षणी बदलत आहे, म्हणून तो त्वरित होत आहे — सतत, आणि केंद्राकडे निर्देशित v²/r या निश्चित दराने. अचल चाल आणि शून्य त्वरण ही वेगळी विधाने, आणि वर्तुळाकार गती हेच ते प्रमाणित उदाहरण जे त्यांना वेगळे करते. आता जमिनीची चौकट, जी जडत्वीय आणि जिथे प्रत्येक बलाला कर्ता आहे. प्रवाशाचे शरीर, एकटे सोडले तर, वर्तुळाच्या स्पर्शिकेवर सरळ रेषेत चालत राहिले असते. ते तसे चालत नाही, म्हणून काहीतरी त्याला केंद्राकडे ढकलत असले पाहिजे. रस्त्यापासून बाहेर काम करत जाता: टायर आणि रस्ता यांतले घर्षण कारवर आतले बल देते; आसन आणि दरवाजा प्रवाशावर. या वर्णनातील प्रत्येक बलाचे नाव घेता येते, आणि ते लावणाऱ्या वस्तूकडे बोट दाखवता येते. त्यांचा परिणामी आतल्या दिशेने, परिमाण mv²/r. यादीत कुठेही बाहेरचे बल नाही, आणि त्यासाठी काही उरलेलेही नाही. मग प्रवाशाला जाणवते काय? नेमका तो दरवाजा जो त्याच्या कुशीवर दाब देत आहे. तो दाब खरा — दाबमापक तो वाचेल — आणि त्याची दिशा आतल्या बाजूला. पण प्रवाशाचा मेंदू स्पर्श-दाब 'दरवाजावर ढकलले जाणे' म्हणून नोंदवतो, आणि आयुष्यभराच्या अनुभवावरून निष्कर्ष काढतो की त्याला बाहेर फेकून त्यावर आपटले गेले. संवेदना खरी; तिच्या कारणाबद्दलचे अनुमान नाही. आता कारची स्वतःची चौकट घ्या, जी तिच्यासोबत फिरते. या चौकटीत प्रवासी स्थिर आहे, आणि न्यूटनचा दुसरा नियम मागतो की स्थिर पिंडावरील बलांची बेरीज शून्य असावी. पण दरवाजा निश्चितपणे आत ढकलत आहे. म्हणून बेरीज शून्य नाही, आणि दुसरा नियम अपयशी दिसतो. अभियांत्रिकीत सर्वत्र वापरला जाणारा उपाय म्हणजे नेमके mv²/r चे काल्पनिक बाहेरचे बल जोडणे — अपकेंद्री बल — जे संतुलन परत आणते आणि गणना चालू देते. ही फसवणूक नव्हे, पण त्यावर प्रामाणिक शिक्का हवा: त्याला कर्ता नाही, ते चौकटीच्या निवडीसह येते-जाते, आणि ते तिसऱ्या नियमाच्या कोणत्याही जोडीचे पालन करत नाही, कारण मागे ढकलायला दुसरा पिंडच नाही. त्याची उपस्थिती हेच निदान की चौकट त्वरित आहे. म्हणून दोन्ही वर्णने तीच गती आणि कोणत्याही उपकरणावर तेच वाचन सांगतात. ती कोणती चौकट वापरतात यात वेगळी, आणि चौकटी बलांना कर्ता लागतो का यात वेगळ्या. तिसरा पर्याय हे मोहक चुकीचे उत्तर: खरे आतले आणि खरे बाहेरचे बल कापले गेले असते, तर परिणामी बल शून्य झाले असते आणि कार सरळ रेषेत कुंपण फोडून निघून गेली असती. वर्तुळाकार गती असंतुलित आतले बल मागते, आणि अभिकेंद्री बलाची अख्खी कल्पना एवढीच — निसर्गातले नवे बल नव्हे, तर सामान्य बलांच्या ज्या संयोजनाची दिशा केंद्राकडे निघते त्याचे नाव. (उरलेली चुकीची उत्तरे प्रवाशाला खरोखर होणारी संवेदना नाकारतात, वा बदलती दिशा हेच त्वरण आहे हे विसरतात.)",
        },
      },
      /*H3*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Laws of Motion                                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-laws-of-motion",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 4 — Laws of Motion",
      hi: "अध्याय 4 — गति के नियम",
      mr: "प्रकरण 4 — गतीचे नियम",
    },
    name: {
      en: "Laws of Motion",
      hi: "गति के नियम",
      mr: "गतीचे नियम",
    },
    summary: {
      en: "The three laws read very differently once you ask what each is doing: the first defines the frames in which the other two are true, the second is about momentum before it is about mass times acceleration, and the third describes two forces on two different bodies that therefore cannot cancel. Around them sit a diagram that is half the marks, a friction that only supplies what is asked of it until it cannot, and a road tilted so that no friction is needed at all.",
      hi: "तीनों नियम बहुत भिन्न पढ़े जाते हैं जब पूछो कि हर एक कर क्या रहा है: पहला उन तंत्रों को परिभाषित करता है जिनमें बाक़ी दो सच हैं, दूसरा द्रव्यमान गुणा त्वरण से पहले संवेग की बात है, और तीसरा दो भिन्न पिंडों पर लगे दो बलों का वर्णन करता है जो इसीलिए कट नहीं सकते। उनके इर्द-गिर्द बैठे हैं वह चित्र जो आधे अंक है, वह घर्षण जो उतना ही देता है जितना माँगा जाए जब तक दे न सके, और वह सड़क जो इतनी झुकी है कि घर्षण की ज़रूरत ही न रहे।",
      mr: "तिन्ही नियम फार वेगळे वाचले जातात जेव्हा विचारता की प्रत्येक करतो काय: पहिला त्या चौकटी व्याख्यायित करतो ज्यांत बाकी दोन खरे आहेत, दुसरा वस्तुमान गुणिले त्वरण होण्याआधी संवेगाची बाब आहे, आणि तिसरा दोन वेगळ्या पिंडांवरील दोन बलांचे वर्णन करतो जी म्हणूनच कापली जाऊ शकत नाहीत. त्यांच्याभोवती बसले आहेत ते चित्र जे अर्धे गुण आहे, ते घर्षण जे मागितले तेवढेच देते जोवर देऊ शकत नाही, आणि तो रस्ता जो इतका कललेला की घर्षणाची गरजच उरत नाही.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "inertial-frame",
        name: {
          en: "The inertial frame",
          hi: "जड़त्वीय निर्देश-तंत्र",
          mr: "जडत्वीय संदर्भचौकट",
        },
        kind: "foundation",
        prompt: {
          en: "The first law is not really the claim that bodies keep moving; read carefully, it asserts that reference frames exist in which a body free of forces keeps its velocity, and it is only in those frames that F = ma may be written. Which idea is this?",
          hi: "पहला नियम वस्तुतः यह दावा नहीं कि पिंड चलते रहते हैं; ध्यान से पढ़ो तो वह यह प्रतिज्ञा करता है कि ऐसे निर्देश-तंत्र हैं जिनमें बल-रहित पिंड अपना वेग बनाए रखता है, और केवल उन्हीं तंत्रों में F = ma लिखा जा सकता है। यह कौन-सा विचार है?",
          mr: "पहिला नियम प्रत्यक्षात 'पिंड चालत राहतात' हा दावा नव्हे; नीट वाचल्यास तो असे प्रतिपादन करतो की अशा संदर्भचौकटी अस्तित्वात आहेत ज्यांत बलविरहित पिंड आपला वेग राखतो, आणि केवळ त्याच चौकटींत F = ma लिहिता येते. ही कोणती कल्पना?",
        },
        statement: {
          en: "An inertial frame is one in which a body with no net force on it moves with constant velocity, and the first law's real work is to assert that such frames exist and to mark out where the second law applies.",
          hi: "जड़त्वीय तंत्र वह है जिसमें बिना परिणामी बल वाला पिंड अचर वेग से चलता है, और पहले नियम का असली काम यह प्रतिज्ञा करना है कि ऐसे तंत्र हैं और यह चिह्नित करना कि दूसरा नियम कहाँ लागू होता है।",
          mr: "जडत्वीय चौकट म्हणजे जिच्यात परिणामी बल नसलेला पिंड अचल वेगाने जातो, आणि पहिल्या नियमाचे खरे काम म्हणजे अशा चौकटी आहेत हे प्रतिपादन करणे आणि दुसरा नियम कुठे लागू होतो हे आखणे.",
        },
        detail: {
          en: "Any frame moving at constant velocity relative to an inertial frame is itself inertial, which is why a smoothly moving train serves as well as the platform.",
          hi: "किसी जड़त्वीय तंत्र के सापेक्ष अचर वेग से चलता हर तंत्र स्वयं जड़त्वीय है, इसीलिए सुचारु रूप से चलती रेलगाड़ी प्लेटफ़ॉर्म जितनी ही काम आती है।",
          mr: "जडत्वीय चौकटीच्या सापेक्ष अचल वेगाने जाणारी प्रत्येक चौकट स्वतः जडत्वीय असते, म्हणूनच सुरळीत चालणारी आगगाडी फलाटाइतकीच उपयोगी पडते.",
        },
        extra: {
          en: "In a non-inertial frame the laws can still be used if a pseudo-force is added by hand, and the giveaway is that this force has no agent and no third-law partner.",
          hi: "अ-जड़त्वीय तंत्र में नियम फिर भी काम में लिए जा सकते हैं यदि हाथ से एक छद्म बल जोड़ दिया जाए, और पहचान यह कि उस बल का न कोई कर्ता है न तीसरे नियम का कोई साथी।",
          mr: "अजडत्वीय चौकटीत नियम तरीही वापरता येतात जर हाताने छद्मबल जोडले तर, आणि ओळख ही की त्या बलाला कर्ताही नाही आणि तिसऱ्या नियमाचा जोडीदारही नाही.",
        },
        pair: {
          left: {
            en: "The frame in which F = ma is allowed to be written",
            hi: "वह तंत्र जिसमें F = ma लिखने की अनुमति है",
            mr: "ती चौकट जिच्यात F = ma लिहिण्याची परवानगी आहे",
          },
          right: {
            en: "the inertial frame",
            hi: "जड़त्वीय निर्देश-तंत्र",
            mr: "जडत्वीय संदर्भचौकट",
          },
        },
      },
      {
        id: "third-law-pair",
        name: {
          en: "The third-law pair",
          hi: "तीसरे नियम की जोड़ी",
          mr: "तिसऱ्या नियमाची जोडी",
        },
        kind: "foundation",
        prompt: {
          en: "A horse pulls a cart and the cart pulls back just as hard, and the puzzle of why anything moves at all dissolves the moment you notice that the two forces are on two different objects. Which relation is this?",
          hi: "घोड़ा गाड़ी खींचता है और गाड़ी उतनी ही ज़ोर से पीछे खींचती है, और यह पहेली कि फिर कुछ चलता ही क्यों है उसी क्षण घुल जाती है जब ध्यान दो कि दोनों बल दो भिन्न वस्तुओं पर हैं। यह कौन-सा संबंध है?",
          mr: "घोडा गाडी ओढतो आणि गाडी तितक्याच जोराने मागे ओढते, आणि मग काही हलतेच का हे कोडे त्याच क्षणी विरघळते जेव्हा लक्षात येते की दोन्ही बले दोन वेगळ्या वस्तूंवर आहेत. हा कोणता संबंध?",
        },
        statement: {
          en: "The two forces of a third-law pair are equal in magnitude, opposite in direction, of the same kind, and act on two different bodies — which is exactly why they can never cancel each other.",
          hi: "तीसरे नियम की जोड़ी के दोनों बल परिमाण में बराबर, दिशा में विपरीत, एक ही प्रकार के, और दो भिन्न पिंडों पर लगते हैं — और ठीक इसीलिए वे एक-दूसरे को कभी काट नहीं सकते।",
          mr: "तिसऱ्या नियमाच्या जोडीची दोन्ही बले परिमाणात समान, दिशेत विरुद्ध, एकाच प्रकारची, आणि दोन वेगळ्या पिंडांवर लागतात — आणि नेमके म्हणूनच ती एकमेकांना कधीच कापू शकत नाहीत.",
        },
        detail: {
          en: "The weight of a book and the table's normal force on it are NOT such a pair, although they are equal and opposite: both act on the book, and the partner of the weight is the book's pull on the Earth.",
          hi: "किताब का भार और मेज़ द्वारा उस पर लगा अभिलंब बल ऐसी जोड़ी नहीं हैं, यद्यपि वे बराबर और विपरीत हैं: दोनों किताब पर लगते हैं, और भार का साथी किताब द्वारा पृथ्वी पर लगाया खिंचाव है।",
          mr: "पुस्तकाचे वजन आणि टेबलाने त्यावर लावलेले लंब बल ही अशी जोडी नाही, जरी ती समान आणि विरुद्ध असली तरी: दोन्ही पुस्तकावर लागतात, आणि वजनाचा जोडीदार म्हणजे पुस्तकाने पृथ्वीवर लावलेली ओढ.",
        },
        extra: {
          en: "Equal forces on unequal masses give very unequal accelerations, which is why a bullet leaves at hundreds of metres per second while the rifle recoils gently into the shoulder.",
          hi: "असमान द्रव्यमानों पर बराबर बल बहुत असमान त्वरण देते हैं, इसीलिए गोली सैकड़ों मीटर प्रति सेकंड से निकलती है जबकि बंदूक कंधे में धीरे-से पीछे धकेलती है।",
          mr: "असमान वस्तुमानांवर समान बले फार असमान त्वरणे देतात, म्हणूनच गोळी शेकडो मीटर प्रति सेकंदाने निघते तर बंदूक खांद्यात हळूच मागे रेटते.",
        },
        pair: {
          left: {
            en: "Equal and opposite, yet never cancelling",
            hi: "बराबर और विपरीत, फिर भी कभी न कटने वाले",
            mr: "समान आणि विरुद्ध, तरीही कधीच न कापले जाणारे",
          },
          right: {
            en: "the third-law pair",
            hi: "तीसरे नियम की जोड़ी",
            mr: "तिसऱ्या नियमाची जोडी",
          },
        },
      },
      {
        id: "impulse",
        name: {
          en: "Impulse",
          hi: "आवेग",
          mr: "आवेग",
        },
        kind: "foundation",
        prompt: {
          en: "A cricketer draws their hands back while catching, and a car is built with a crumple zone, both for the same reason: the change in momentum is fixed, so lengthening the time of contact lowers the force. Which quantity is this?",
          hi: "क्रिकेटर कैच लेते समय हाथ पीछे खींचता है, और कार में सिकुड़ने वाला क्षेत्र बनाया जाता है, दोनों एक ही कारण से: संवेग-परिवर्तन तय है, अतः संपर्क का समय बढ़ाने से बल घटता है। यह कौन-सी राशि है?",
          mr: "क्रिकेटपटू झेल घेताना हात मागे खेचतो, आणि कारमध्ये चुरगळणारा भाग बनवला जातो, दोन्ही एकाच कारणाने: संवेगातील बदल ठरलेला आहे, म्हणून स्पर्शाचा काळ वाढवल्याने बल घटते. ही कोणती राशी?",
        },
        statement: {
          en: "Impulse is force multiplied by the time for which it acts, and it equals the change in momentum, so the same momentum change can be produced by a large force for a short time or a small one for long.",
          hi: "आवेग बल गुणा वह समय है जितनी देर वह लगता है, और वह संवेग-परिवर्तन के बराबर होता है, अतः वही संवेग-परिवर्तन थोड़े समय के बड़े बल से या लंबे समय के छोटे बल से पैदा किया जा सकता है।",
          mr: "आवेग म्हणजे बल गुणिले ते जितका काळ लागते तो काळ, आणि तो संवेगातील बदलाइतका असतो, म्हणून तोच संवेगबदल थोड्या वेळासाठीच्या मोठ्या बलाने वा दीर्घ काळासाठीच्या लहान बलाने घडवता येतो.",
        },
        detail: {
          en: "It is the reason the second law is more honestly written as force equals the rate of change of momentum, a form that survives even when the mass itself is changing, as in a rocket.",
          hi: "इसी से दूसरा नियम अधिक ईमानदारी से यों लिखा जाता है कि बल संवेग-परिवर्तन की दर है, और यह रूप तब भी टिकता है जब द्रव्यमान स्वयं बदल रहा हो, जैसे रॉकेट में।",
          mr: "म्हणूनच दुसरा नियम अधिक प्रामाणिकपणे 'बल म्हणजे संवेगबदलाचा दर' असा लिहिला जातो, आणि हे रूप वस्तुमान स्वतः बदलत असतानाही टिकते, जसे रॉकेटमध्ये.",
        },
        extra: {
          en: "Graphically it is the area under a force–time curve, which is how a collision lasting a few milliseconds is handled without knowing the force at any single instant.",
          hi: "आलेख में यह बल-समय वक्र के नीचे का क्षेत्रफल है, और इसी से कुछ मिलीसेकंड चलने वाली टक्कर बिना किसी एक क्षण का बल जाने सँभाली जाती है।",
          mr: "आलेखात हे बल-काळ वक्राखालचे क्षेत्रफळ, आणि यामुळेच काही मिलिसेकंद चालणारी टक्कर कोणत्याही एका क्षणीचे बल न जाणता हाताळली जाते.",
        },
        pair: {
          left: {
            en: "Draw the hands back and the catch stops hurting",
            hi: "हाथ पीछे खींचो और कैच चुभना बंद कर देता है",
            mr: "हात मागे खेचा आणि झेल दुखणे थांबते",
          },
          right: {
            en: "impulse",
            hi: "आवेग",
            mr: "आवेग",
          },
        },
      },
      {
        id: "free-body-diagram",
        name: {
          en: "The free-body diagram",
          hi: "मुक्त-पिंड आरेख",
          mr: "मुक्त-पिंड आकृती",
        },
        kind: "method",
        prompt: {
          en: "One body is isolated on the page, every force acting ON it is drawn as an arrow with an agent that can be named, and everything that body does to its surroundings is deliberately left out. Which step is this?",
          hi: "पृष्ठ पर एक पिंड अलग कर लिया जाता है, उस पर लगने वाला हर बल ऐसे तीर के रूप में खींचा जाता है जिसका कर्ता नाम लिया जा सके, और वह पिंड अपने परिवेश पर जो करता है वह जानबूझकर छोड़ दिया जाता है। यह कौन-सा चरण है?",
          mr: "पानावर एक पिंड वेगळा केला जातो, त्याच्यावर लागणारे प्रत्येक बल असा बाण म्हणून काढले जाते ज्याचा कर्ता नाव घेता येईल, आणि तो पिंड आपल्या परिसराला जे करतो ते मुद्दाम वगळले जाते. हा कोणता टप्पा?",
        },
        statement: {
          en: "A free-body diagram shows one chosen body with only the forces exerted ON it, which is what allows the second law to be applied to that body alone without the rest of the system confusing the sum.",
          hi: "मुक्त-पिंड आरेख एक चुने हुए पिंड को केवल उन बलों के साथ दिखाता है जो उस पर लगते हैं, और यही दूसरे नियम को अकेले उसी पिंड पर लगाने देता है, बिना बाक़ी तंत्र के योग को उलझाए।",
          mr: "मुक्त-पिंड आकृती एक निवडलेला पिंड केवळ त्याच्यावर लागणाऱ्या बलांसह दाखवते, आणि हेच दुसरा नियम एकट्या त्याच पिंडावर लावू देते, बाकी प्रणालीने बेरीज गोंधळात न टाकता.",
        },
        detail: {
          en: "Its commonest failure is drawing an outward force on a body in a circle, or drawing both members of a third-law pair on the same diagram, either of which cancels a force that should have been left standing.",
          hi: "इसकी सबसे आम विफलता है वृत्त में घूमते पिंड पर बाहरी बल खींच देना, या तीसरे नियम की जोड़ी के दोनों सदस्य एक ही आरेख पर खींच देना, और इनमें से कोई भी उस बल को काट देता है जिसे खड़ा रहना चाहिए था।",
          mr: "तिचे सर्वांत नेहमीचे अपयश म्हणजे वर्तुळात फिरणाऱ्या पिंडावर बाहेरचे बल काढणे, वा तिसऱ्या नियमाच्या जोडीचे दोन्ही सदस्य एकाच आकृतीवर काढणे, आणि यांपैकी कोणतेही ते बल कापते जे उभे राहायला हवे होते.",
        },
        extra: {
          en: "For a system of connected bodies a separate diagram is drawn for each, and the connecting tension appears in both with opposite senses, which is what makes two equations solvable for two unknowns.",
          hi: "जुड़े हुए पिंडों के तंत्र के लिए हर एक का अलग आरेख खींचा जाता है, और जोड़ने वाला तनाव दोनों में विपरीत अर्थ के साथ आता है, और यही दो अज्ञातों के लिए दो समीकरण हल करने योग्य बनाता है।",
          mr: "जोडलेल्या पिंडांच्या प्रणालीसाठी प्रत्येकाची वेगळी आकृती काढली जाते, आणि जोडणारा ताण दोन्हींत विरुद्ध अर्थाने येतो, आणि हेच दोन अज्ञातांसाठी दोन समीकरणे सोडवण्याजोगी बनवते.",
        },
        pair: {
          left: {
            en: "Only what acts on it, never what it acts on",
            hi: "केवल जो उस पर लगता है, कभी वह नहीं जिस पर वह लगता है",
            mr: "केवळ जे त्याच्यावर लागते, ते कधीच नाही ज्यावर तो लागतो",
          },
          right: {
            en: "the free-body diagram",
            hi: "मुक्त-पिंड आरेख",
            mr: "मुक्त-पिंड आकृती",
          },
        },
      },
      {
        id: "static-friction-threshold",
        name: {
          en: "The threshold of static friction",
          hi: "स्थैतिक घर्षण की सीमा",
          mr: "स्थितिक घर्षणाची मर्यादा",
        },
        kind: "method",
        prompt: {
          en: "Push a heavy crate gently and it does not move, push harder and it still does not, push harder again and it suddenly slides — because this force matched whatever was applied until it reached its ceiling of μ times the normal force. Which behaviour is this?",
          hi: "भारी पेटी को धीरे धकेलो तो वह नहीं हिलती, ज़ोर से धकेलो तो भी नहीं, और ज़ोर लगाओ तो अचानक सरक जाती है — क्योंकि यह बल तब तक लगाए गए बल से मेल खाता रहा जब तक अपनी छत μ गुना अभिलंब बल तक न पहुँच गया। यह कौन-सा व्यवहार है?",
          mr: "जड पेटी हळू ढकला तर ती हलत नाही, जोरात ढकला तरी नाही, आणि आणखी जोर लावला की ती अचानक सरकते — कारण हे बल लावलेल्या बलाशी जुळत राहिले जोवर आपल्या छतापर्यंत, μ गुणिले लंब बल, पोहोचले नाही. हे कोणते वर्तन?",
        },
        statement: {
          en: "Static friction is not a fixed quantity but adjusts itself to match the applied force exactly, up to a maximum of μₛN, beyond which the surfaces slip and kinetic friction takes over.",
          hi: "स्थैतिक घर्षण कोई नियत राशि नहीं बल्कि स्वयं को लगाए गए बल के ठीक बराबर समायोजित करता है, अधिकतम μₛN तक, जिसके आगे सतहें फिसल जाती हैं और गतिज घर्षण सँभाल लेता है।",
          mr: "स्थितिक घर्षण ही ठरलेली राशी नव्हे तर स्वतःला लावलेल्या बलाइतके नेमके जुळवते, कमाल μₛN पर्यंत, त्यापुढे पृष्ठभाग निसटतात आणि गतिज घर्षण ताबा घेते.",
        },
        detail: {
          en: "Kinetic friction is smaller than the maximum static value and is very nearly independent of speed, which is why a crate lurches forward the instant it breaks free.",
          hi: "गतिज घर्षण अधिकतम स्थैतिक मान से छोटा होता है और चाल से लगभग स्वतंत्र है, इसीलिए छूटते ही पेटी एक झटके से आगे बढ़ती है।",
          mr: "गतिज घर्षण कमाल स्थितिक मूल्याहून लहान असते आणि चालीपासून जवळपास स्वतंत्र, म्हणूनच सुटताच पेटी एका झटक्यात पुढे सरकते.",
        },
        extra: {
          en: "Neither kind depends on the area of contact, because pressing a larger area spreads the same weight more thinly, and the two effects cancel in the product μN.",
          hi: "कोई भी क़िस्म संपर्क-क्षेत्रफल पर निर्भर नहीं, क्योंकि बड़ा क्षेत्रफल दबाने पर वही भार अधिक पतला फैलता है, और दोनों प्रभाव μN के गुणनफल में कट जाते हैं।",
          mr: "कोणताही प्रकार स्पर्श-क्षेत्रफळावर अवलंबून नाही, कारण मोठे क्षेत्रफळ दाबल्यास तेच वजन अधिक पातळ पसरते, आणि दोन्ही परिणाम μN च्या गुणाकारात कापले जातात.",
        },
        pair: {
          left: {
            en: "Gives back exactly what it is given, until it cannot",
            hi: "जितना दिया जाए उतना ही लौटाता, जब तक न लौटा सके",
            mr: "जितके दिले तितकेच परत देते, जोवर देऊ शकत नाही",
          },
          right: {
            en: "the threshold of static friction",
            hi: "स्थैतिक घर्षण की सीमा",
            mr: "स्थितिक घर्षणाची मर्यादा",
          },
        },
      },
      {
        id: "banked-road",
        name: {
          en: "The banked road",
          hi: "बंकित सड़क",
          mr: "कललेला रस्ता",
        },
        kind: "method",
        prompt: {
          en: "The outer edge of a curve is built higher than the inner one, so that a component of the normal force points at the centre of the bend and the turn can be taken at the design speed even on ice. Which arrangement is this?",
          hi: "मोड़ का बाहरी किनारा भीतरी से ऊँचा बनाया जाता है, ताकि अभिलंब बल का एक घटक मोड़ के केंद्र की ओर हो और बर्फ़ पर भी नियत चाल से मोड़ लिया जा सके। यह कौन-सी व्यवस्था है?",
          mr: "वळणाची बाहेरची कड आतल्या कडेहून उंच बांधली जाते, म्हणजे लंब बलाचा एक घटक वळणाच्या केंद्राकडे असेल आणि बर्फावरही ठरलेल्या चालीने वळण घेता येईल. ही कोणती रचना?",
        },
        statement: {
          en: "Banking tilts the road so that the horizontal component of the normal force supplies the centripetal force, making the turn possible at the design speed with no friction at all.",
          hi: "बंकन सड़क को झुका देता है ताकि अभिलंब बल का क्षैतिज घटक अभिकेंद्र बल दे सके, और मोड़ नियत चाल पर बिना किसी घर्षण के संभव हो जाए।",
          mr: "कलवणे रस्ता कलवते जेणेकरून लंब बलाचा आडवा घटक अभिकेंद्री बल पुरवेल, आणि वळण ठरलेल्या चालीवर कोणत्याही घर्षणाशिवाय शक्य होईल.",
        },
        detail: {
          en: "The design speed follows from tan θ = v²/(rg), a relation that contains neither the mass of the vehicle nor any coefficient of friction, so the same bank serves a scooter and a lorry alike.",
          hi: "नियत चाल tan θ = v²/(rg) से निकलती है, ऐसा संबंध जिसमें न वाहन का द्रव्यमान है न घर्षण गुणांक, अतः वही बंकन स्कूटर और लॉरी दोनों के काम आता है।",
          mr: "ठरलेली चाल tan θ = v²/(rg) वरून निघते, असा संबंध ज्यात ना वाहनाचे वस्तुमान ना घर्षण गुणांक, म्हणून तेच कलवणे स्कूटर आणि ट्रक दोघांना उपयोगी पडते.",
        },
        extra: {
          en: "On a flat road the same turn must be paid for entirely by friction, which caps the safe speed at the square root of μrg and is why an unbanked bend is signposted more slowly.",
          hi: "समतल सड़क पर वही मोड़ पूरी तरह घर्षण से चुकाना पड़ता है, जो सुरक्षित चाल को μrg के वर्गमूल पर बाँध देता है, इसीलिए बिना बंकन वाला मोड़ धीमी चाल का बोर्ड लगाता है।",
          mr: "सपाट रस्त्यावर तेच वळण पूर्णपणे घर्षणाने भरावे लागते, जे सुरक्षित चाल μrg च्या वर्गमुळावर बांधते, म्हणूनच न कललेल्या वळणावर कमी वेगाचा फलक असतो.",
        },
        pair: {
          left: {
            en: "A turn that would work on ice",
            hi: "ऐसा मोड़ जो बर्फ़ पर भी चल जाए",
            mr: "असे वळण जे बर्फावरही चालेल",
          },
          right: {
            en: "the banked road",
            hi: "बंकित सड़क",
            mr: "कललेला रस्ता",
          },
        },
      },
      /*F4*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A cart is harnessed to a horse. A student argues: the horse pulls the cart forward, the cart pulls the horse backward with an equal force by the third law, the two cancel, and therefore nothing can ever move. Find the flaw and say what actually accelerates the pair.",
          hi: "एक गाड़ी घोड़े से जुती है। एक विद्यार्थी तर्क देता है: घोड़ा गाड़ी को आगे खींचता है, गाड़ी तीसरे नियम से घोड़े को बराबर बल से पीछे खींचती है, दोनों कट जाते हैं, अतः कुछ कभी चल ही नहीं सकता। दोष खोजो और बताओ कि जोड़ी को वस्तुतः त्वरित क्या करता है।",
          mr: "एक गाडी घोड्याला जुंपली आहे. एक विद्यार्थी युक्तिवाद करतो: घोडा गाडी पुढे ओढतो, गाडी तिसऱ्या नियमाने घोड्याला तितक्याच बलाने मागे ओढते, दोन्ही कापली जातात, म्हणून काहीही कधीच हलू शकत नाही. दोष शोधा आणि जोडीला प्रत्यक्षात त्वरित काय करते ते सांगा.",
        },
        choices: [
          {
            en: "The flaw is adding two forces that act on different bodies. The horse's pull acts on the cart; the cart's pull acts on the horse. Forces cancel only when they act on the SAME body. Draw the cart alone: forward pull from the harness, backward friction from the ground — it accelerates if the pull wins. Draw the horse alone: backward pull from the harness, forward friction from the ground on its hooves — it accelerates if that friction wins. What moves the pair as a whole is the ground's forward friction on the horse's hooves, and the harness forces, being internal to the pair, cancel only in that combined description",
            hi: "दोष यह कि भिन्न पिंडों पर लगते दो बल जोड़ दिए गए। घोड़े का खिंचाव गाड़ी पर लगता है; गाड़ी का खिंचाव घोड़े पर। बल तभी कटते हैं जब वे एक ही पिंड पर लगें। अकेली गाड़ी खींचो: जुए से आगे का खिंचाव, ज़मीन से पीछे का घर्षण — खिंचाव जीते तो वह त्वरित होती है। अकेला घोड़ा खींचो: जुए से पीछे का खिंचाव, ज़मीन से खुरों पर आगे का घर्षण — वह घर्षण जीते तो वह त्वरित होता है। पूरी जोड़ी को चलाता है घोड़े के खुरों पर ज़मीन का आगे का घर्षण, और जुए के बल, जोड़ी के भीतरी होने से, केवल उसी संयुक्त वर्णन में कटते हैं",
            mr: "दोष हा की वेगळ्या पिंडांवर लागणारी दोन बले जोडली गेली. घोड्याची ओढ गाडीवर लागते; गाडीची ओढ घोड्यावर. बले तेव्हाच कापली जातात जेव्हा ती एकाच पिंडावर लागतात. एकटी गाडी काढा: जुवाकडून पुढची ओढ, जमिनीकडून मागचे घर्षण — ओढ जिंकली तर ती त्वरित होते. एकटा घोडा काढा: जुवाकडून मागची ओढ, जमिनीकडून खुरांवर पुढचे घर्षण — ते घर्षण जिंकले तर तो त्वरित होतो. अख्ख्या जोडीला हलवते ते घोड्याच्या खुरांवरचे जमिनीचे पुढचे घर्षण, आणि जुवाची बले, जोडीच्या आतली असल्याने, केवळ त्याच एकत्रित वर्णनात कापली जातात",
          },
          {
            en: "The third law does not apply to living things, so the horse's pull is genuinely larger than the cart's",
            hi: "तीसरा नियम जीवित प्राणियों पर लागू नहीं होता, अतः घोड़े का खिंचाव गाड़ी के खिंचाव से सचमुच बड़ा है",
            mr: "तिसरा नियम सजीवांना लागू होत नाही, म्हणून घोड्याची ओढ गाडीच्या ओढीहून खरोखर मोठी आहे",
          },
          {
            en: "The horse's pull acts first and the cart's reaction only afterwards, so there is a moment of unbalanced force in which the motion begins",
            hi: "घोड़े का खिंचाव पहले लगता है और गाड़ी की प्रतिक्रिया बाद में, अतः असंतुलित बल का एक क्षण आता है जिसमें गति शुरू होती है",
            mr: "घोड्याची ओढ आधी लागते आणि गाडीची प्रतिक्रिया नंतरच, म्हणून असंतुलित बलाचा एक क्षण येतो ज्यात गती सुरू होते",
          },
          {
            en: "The two forces really do cancel, and the cart moves only because the ground pushes it directly forward",
            hi: "दोनों बल सचमुच कट जाते हैं, और गाड़ी केवल इसलिए चलती है कि ज़मीन उसे सीधे आगे धकेलती है",
            mr: "दोन्ही बले खरोखर कापली जातात, आणि गाडी केवळ यामुळे चालते की जमीन तिला थेट पुढे ढकलते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The argument's every sentence is true except the third, and that one is not even wrong about physics — it is wrong about bookkeeping. Newton's second law is applied to ONE body at a time, and only forces acting on that body may be added. The horse's forward pull acts on the cart. The cart's backward pull acts on the horse. They are on different ledgers, and putting them in the same sum is like cancelling your debt against your neighbour's and concluding nobody owes anything. Draw the two diagrams and the paradox has nowhere to live. Cart alone: the harness pulls it forward with force T, the ground drags backwards on its wheels with friction f_cart. Its acceleration is (T − f_cart)/m_cart, positive whenever the harness wins. Horse alone: the harness pulls it backward with the same T, and the ground pushes forward on its hooves with friction f_horse — the horse pushes back on the ground, and the ground pushes forward on the horse, which is itself a third-law pair. Its acceleration is (f_horse − T)/m_horse, positive whenever the hooves win. Both can be positive at once, and when they are, horse and cart accelerate together. Now take the two as a single system. The harness forces are now internal: T appears once forwards on the cart and once backwards on the horse, and in the sum for the whole system they cancel — correctly this time, because now they ARE on the same body, the combined one. What survives is the ground's friction on the hooves minus the ground's friction on the wheels. That difference is the entire net external force on horse-and-cart, and if it is positive the pair accelerates. The horse's real work is to push backwards on the ground hard enough that the reaction beats the cart's rolling resistance. This is why a horse on ice can pull nothing at all, and why the same horse on gravel can start a heavy load: the harness tension is not what has changed, the available ground friction is. It also explains the rocket, which has no ground to push against and therefore throws mass backwards instead — the reaction to expelling exhaust is the only forward force it has. Two smaller morals are worth keeping. The third law never says the two accelerations are equal, only the two forces; a rifle and a bullet feel the same force and receive utterly different accelerations. And the pairing is instantaneous, not sequential: there is no interval, however brief, in which one member acts and the other has not yet replied. (The wrong answers exempt animals from mechanics, insert a delay that does not exist, or credit the ground with pushing the cart forward when the ground only ever retards the wheels.)",
          hi: "तर्क का हर वाक्य सही है सिवाय तीसरे के, और वह भौतिकी के बारे में ग़लत भी नहीं — वह हिसाब-किताब के बारे में ग़लत है। न्यूटन का दूसरा नियम एक बार में एक पिंड पर लगाया जाता है, और केवल उसी पिंड पर लगते बल जोड़े जा सकते हैं। घोड़े का आगे का खिंचाव गाड़ी पर लगता है। गाड़ी का पीछे का खिंचाव घोड़े पर। वे भिन्न बहीखातों पर हैं, और उन्हें एक ही योग में डालना ऐसा है जैसे अपना क़र्ज़ पड़ोसी के क़र्ज़ से काटकर निष्कर्ष निकालना कि किसी पर कुछ बक़ाया नहीं। दोनों आरेख खींचो और विरोधाभास के रहने को जगह नहीं बचती। अकेली गाड़ी: जुआ उसे T बल से आगे खींचता है, ज़मीन उसके पहियों पर f_गाड़ी घर्षण से पीछे घसीटती है। उसका त्वरण (T − f_गाड़ी)/m_गाड़ी है, जब भी जुआ जीते तब धनात्मक। अकेला घोड़ा: जुआ उसे उसी T से पीछे खींचता है, और ज़मीन उसके खुरों पर f_घोड़ा घर्षण से आगे धकेलती है — घोड़ा ज़मीन पर पीछे धकेलता है, ज़मीन घोड़े पर आगे, और यह स्वयं तीसरे नियम की जोड़ी है। उसका त्वरण (f_घोड़ा − T)/m_घोड़ा है, जब भी खुर जीतें तब धनात्मक। दोनों एक साथ धनात्मक हो सकते हैं, और जब होते हैं, घोड़ा और गाड़ी साथ त्वरित होते हैं। अब दोनों को एक तंत्र मानो। जुए के बल अब भीतरी हैं: T एक बार गाड़ी पर आगे और एक बार घोड़े पर पीछे आता है, और पूरे तंत्र के योग में वे कट जाते हैं — इस बार ठीक ही, क्योंकि अब वे एक ही पिंड पर हैं, संयुक्त पिंड पर। जो बचता है वह है खुरों पर ज़मीन का घर्षण घटा पहियों पर ज़मीन का घर्षण। यही अंतर घोड़ा-और-गाड़ी पर पूरा परिणामी बाह्य बल है, और वह धनात्मक हो तो जोड़ी त्वरित होती है। घोड़े का असली काम ज़मीन पर इतना ज़ोर से पीछे धकेलना है कि प्रतिक्रिया गाड़ी के लोटन प्रतिरोध को हरा दे। इसीलिए बर्फ़ पर घोड़ा कुछ भी नहीं खींच सकता, और वही घोड़ा बजरी पर भारी बोझ चला लेता है: जुए का तनाव नहीं बदला, उपलब्ध ज़मीनी घर्षण बदला। इसी से रॉकेट भी समझ आता है, जिसके पास धकेलने को ज़मीन नहीं और इसलिए वह द्रव्यमान पीछे फेंकता है — निकास फेंकने की प्रतिक्रिया ही उसका एकमात्र अग्रगामी बल है। दो छोटे सबक़ भी रखने योग्य हैं। तीसरा नियम यह कभी नहीं कहता कि दोनों त्वरण बराबर हैं, केवल दोनों बल; बंदूक और गोली वही बल महसूस करते और नितांत भिन्न त्वरण पाते हैं। और जोड़ी तात्क्षणिक है, क्रमिक नहीं: ऐसा कोई अंतराल नहीं, चाहे कितना ही छोटा, जिसमें एक सदस्य लगे और दूसरे ने अभी उत्तर न दिया हो। (ग़लत उत्तर पशुओं को यांत्रिकी से छूट देते, न होने वाला विलंब घुसाते, या ज़मीन को गाड़ी आगे धकेलने का श्रेय देते जबकि ज़मीन पहियों को केवल रोकती है।)",
          mr: "युक्तिवादाचे प्रत्येक वाक्य खरे आहे, तिसरे सोडून, आणि तेही भौतिकीबद्दल चुकीचे नाही — ते हिशोबाबद्दल चुकीचे आहे. न्यूटनचा दुसरा नियम एका वेळी एका पिंडावर लावला जातो, आणि केवळ त्याच पिंडावर लागणारी बले जोडता येतात. घोड्याची पुढची ओढ गाडीवर लागते. गाडीची मागची ओढ घोड्यावर. ती वेगळ्या वहीखात्यांवर आहेत, आणि त्यांना एकाच बेरजेत टाकणे म्हणजे आपले कर्ज शेजाऱ्याच्या कर्जाशी कापून कोणावर काहीच बाकी नाही असा निष्कर्ष काढणे. दोन्ही आकृत्या काढा आणि विरोधाभासाला राहायला जागा उरत नाही. एकटी गाडी: जुवे तिला T बलाने पुढे ओढते, जमीन तिच्या चाकांवर f_गाडी घर्षणाने मागे ओढते. तिचे त्वरण (T − f_गाडी)/m_गाडी, जुवे जिंकल्यास धन. एकटा घोडा: जुवे त्याला त्याच T ने मागे ओढते, आणि जमीन त्याच्या खुरांवर f_घोडा घर्षणाने पुढे ढकलते — घोडा जमिनीवर मागे ढकलतो, जमीन घोड्यावर पुढे, आणि हीच स्वतः तिसऱ्या नियमाची जोडी. त्याचे त्वरण (f_घोडा − T)/m_घोडा, खुर जिंकल्यास धन. दोन्ही एकाच वेळी धन असू शकतात, आणि तेव्हा घोडा आणि गाडी एकत्र त्वरित होतात. आता दोघांना एक प्रणाली माना. जुव्याची बले आता आतली आहेत: T एकदा गाडीवर पुढे आणि एकदा घोड्यावर मागे येते, आणि अख्ख्या प्रणालीच्या बेरजेत ती कापली जातात — यावेळी बरोबरच, कारण आता ती एकाच पिंडावर आहेत, एकत्रित पिंडावर. जे उरते ते म्हणजे खुरांवरचे जमिनीचे घर्षण वजा चाकांवरचे जमिनीचे घर्षण. हाच फरक घोडा-आणि-गाडीवरचे पूर्ण परिणामी बाह्य बल, आणि ते धन असल्यास जोडी त्वरित होते. घोड्याचे खरे काम जमिनीवर इतक्या जोराने मागे ढकलणे की प्रतिक्रिया गाडीचा घरंगळ-विरोध हरवेल. म्हणूनच बर्फावरचा घोडा काहीच ओढू शकत नाही, आणि तोच घोडा खडीवर जड ओझे सुरू करू शकतो: जुव्याचा ताण बदललेला नाही, उपलब्ध जमिनीचे घर्षण बदलले. यातूनच रॉकेटही समजते, ज्याच्याकडे ढकलायला जमीन नाही आणि म्हणून तो वस्तुमान मागे फेकतो — निर्गम बाहेर टाकण्याची प्रतिक्रिया हेच त्याचे एकमेव पुढचे बल. दोन लहान धडेही ठेवण्याजोगे. तिसरा नियम दोन्ही त्वरणे समान आहेत असे कधीच सांगत नाही, केवळ दोन्ही बले; बंदूक आणि गोळी तेच बल अनुभवतात आणि पूर्णपणे वेगळी त्वरणे मिळवतात. आणि जोडी तात्कालिक आहे, क्रमवार नव्हे: असा कोणताही अंतराल नाही, कितीही लहान असो, ज्यात एक सदस्य लागतो आणि दुसऱ्याने अजून उत्तर दिलेले नाही. (चुकीची उत्तरे प्राण्यांना यामिकीतून सूट देतात, नसलेला विलंब घुसवतात, वा जमिनीला गाडी पुढे ढकलण्याचे श्रेय देतात तर जमीन चाकांना केवळ अडवते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A 10 kg block rests on a floor with μₛ = 0.4 and μₖ = 0.3, and g is 10 m/s². It is pushed horizontally with 30 N and does not move; the push is then raised to 50 N and it accelerates. A student says friction was 30 N in the first case and 40 N in the second. Assess this and compute the acceleration.",
          hi: "10 kg का गुटका फ़र्श पर रखा है जहाँ μₛ = 0.4 और μₖ = 0.3, और g = 10 m/s². उसे 30 N से क्षैतिज धकेला जाता है और वह नहीं हिलता; फिर धक्का 50 N कर दिया जाता है और वह त्वरित होता है। एक विद्यार्थी कहता है कि पहली स्थिति में घर्षण 30 N था और दूसरी में 40 N. इसका आकलन करो और त्वरण निकालो।",
          mr: "10 kg चा ठोकळा जमिनीवर ठेवला आहे जिथे μₛ = 0.4 आणि μₖ = 0.3, आणि g = 10 m/s². त्याला 30 N ने आडवे ढकलले जाते आणि तो हलत नाही; मग रेटा 50 N केला जातो आणि तो त्वरित होतो. एक विद्यार्थी म्हणतो की पहिल्या स्थितीत घर्षण 30 N होते आणि दुसऱ्यात 40 N. याचे मूल्यमापन करा आणि त्वरण काढा.",
        },
        choices: [
          {
            en: "Half right. In the first case friction was indeed 30 N: static friction adjusts to match, and 30 N is below its ceiling of μₛN = 0.4 × 100 = 40 N, so the block stays put. In the second case the block is sliding, so static friction is irrelevant and kinetic friction applies: f = μₖN = 0.3 × 100 = 30 N, not 40 N. The net force is 50 − 30 = 20 N and the acceleration is 20/10 = 2 m/s²",
            hi: "आधा सही। पहली स्थिति में घर्षण सचमुच 30 N था: स्थैतिक घर्षण मेल खाने के लिए समायोजित होता है, और 30 N उसकी छत μₛN = 0.4 × 100 = 40 N से नीचे है, अतः गुटका टिका रहता है। दूसरी स्थिति में गुटका फिसल रहा है, अतः स्थैतिक घर्षण अप्रासंगिक है और गतिज घर्षण लगता है: f = μₖN = 0.3 × 100 = 30 N, 40 N नहीं। परिणामी बल 50 − 30 = 20 N और त्वरण 20/10 = 2 m/s²",
            mr: "अर्धे बरोबर. पहिल्या स्थितीत घर्षण खरोखर 30 N होते: स्थितिक घर्षण जुळवण्यासाठी जुळवून घेते, आणि 30 N त्याच्या छत μₛN = 0.4 × 100 = 40 N च्या खाली आहे, म्हणून ठोकळा जागीच राहतो. दुसऱ्या स्थितीत ठोकळा घसरत आहे, म्हणून स्थितिक घर्षण असंबद्ध आणि गतिज घर्षण लागते: f = μₖN = 0.3 × 100 = 30 N, 40 N नव्हे. परिणामी बल 50 − 30 = 20 N आणि त्वरण 20/10 = 2 m/s²",
          },
          {
            en: "Entirely right: friction is always μₛN once any push is applied, so it is 40 N in both cases and the acceleration is 1 m/s²",
            hi: "पूरी तरह सही: कोई भी धक्का लगते ही घर्षण सदा μₛN होता है, अतः दोनों स्थितियों में 40 N और त्वरण 1 m/s²",
            mr: "पूर्णपणे बरोबर: कोणताही रेटा लागताच घर्षण नेहमी μₛN असते, म्हणून दोन्ही स्थितींत 40 N आणि त्वरण 1 m/s²",
          },
          {
            en: "Entirely wrong: friction is 40 N in the first case because that is its maximum, and 30 N in the second, giving 2 m/s²",
            hi: "पूरी तरह ग़लत: पहली स्थिति में घर्षण 40 N है क्योंकि वही उसका अधिकतम है, और दूसरी में 30 N, जिससे 2 m/s² मिलता है",
            mr: "पूर्णपणे चूक: पहिल्या स्थितीत घर्षण 40 N कारण तेच त्याचे कमाल, आणि दुसऱ्यात 30 N, ज्यातून 2 m/s² मिळते",
          },
          {
            en: "The block cannot move at all under 50 N, since 50 N is less than the weight of 100 N holding it down",
            hi: "50 N पर गुटका हिल ही नहीं सकता, क्योंकि 50 N उसे दबाए रखने वाले 100 N भार से कम है",
            mr: "50 N वर ठोकळा हलूच शकत नाही, कारण 50 N हे त्याला दाबून ठेवणाऱ्या 100 N वजनाहून कमी आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Start with the normal force, since both coefficients act on it. The floor is level and the push is horizontal, so N balances the weight: N = mg = 10 × 10 = 100 N. The static ceiling is μₛN = 0.4 × 100 = 40 N and the kinetic value is μₖN = 0.3 × 100 = 30 N. Both are numbers about this block on this floor, and only one of them is in force at a time. First case, push 30 N, block stationary. Since it is not accelerating, the horizontal forces on it must sum to zero, so friction is exactly 30 N — not 40. This is the point the chapter's fact about static friction is making: static friction is not a fixed quantity waiting to be looked up, it is whatever the situation requires, up to a limit. Push with 10 N and friction is 10 N. Push with 39 N and friction is 39 N. Push with 41 N and friction cannot supply it, the surfaces slip, and the description changes entirely. So the student's first claim is right, and right for the right reason. Second case, push 50 N. Now 50 exceeds 40, so the block breaks free and slides. Once sliding, static friction has nothing to say — the surfaces are in relative motion, and the resisting force is kinetic friction, μₖN = 30 N. It is smaller than the static maximum, which is why a crate lurches the instant it starts: for a moment the applied force is fighting 30 N where a moment earlier it was fighting 40. The student's second claim uses the wrong coefficient. Net force = 50 − 30 = 20 N, so a = F/m = 20/10 = 2 m/s². Three checks are worth doing on any answer of this kind. Does the acceleration come out smaller than the push alone would give? Here 50 N on 10 kg would give 5 m/s², and friction has cut it to 2, which is sensible. Is the kinetic value below the static maximum? 30 < 40, yes — the reverse would be unphysical, since a block that broke free would immediately be gripped harder. And is the normal force actually mg? Here yes, but tilt the floor or push at an angle and it is not, and every friction figure changes with it — which is the reason to compute N first and never to assume it. (The wrong answers use the static maximum where nothing is static, reverse which case gets which coefficient, or compare a horizontal push against a vertical weight, two forces on perpendicular axes that never oppose each other at all.)",
          hi: "अभिलंब बल से शुरू करो, क्योंकि दोनों गुणांक उसी पर लगते हैं। फ़र्श समतल है और धक्का क्षैतिज, अतः N भार को संतुलित करता है: N = mg = 10 × 10 = 100 N. स्थैतिक छत μₛN = 0.4 × 100 = 40 N और गतिज मान μₖN = 0.3 × 100 = 30 N. दोनों इस फ़र्श पर इस गुटके के बारे में संख्याएँ हैं, और एक बार में इनमें से केवल एक लागू होती है। पहली स्थिति, धक्का 30 N, गुटका स्थिर। चूँकि वह त्वरित नहीं हो रहा, उस पर क्षैतिज बलों का योग शून्य होना चाहिए, अतः घर्षण ठीक 30 N है — 40 नहीं। यही बात अध्याय का स्थैतिक घर्षण वाला तथ्य कह रहा है: स्थैतिक घर्षण कोई नियत राशि नहीं जो देखकर उठा ली जाए, वह उतना ही है जितनी स्थिति माँगे, एक सीमा तक। 10 N से धकेलो तो घर्षण 10 N. 39 N से धकेलो तो 39 N. 41 N से धकेलो तो घर्षण दे नहीं सकता, सतहें फिसल जाती हैं, और वर्णन पूरी तरह बदल जाता है। अतः विद्यार्थी का पहला दावा सही है, और सही कारण से सही है। दूसरी स्थिति, धक्का 50 N. अब 50, 40 से अधिक है, अतः गुटका छूटकर फिसलता है। फिसलते ही स्थैतिक घर्षण के पास कहने को कुछ नहीं — सतहें सापेक्ष गति में हैं, और रोकने वाला बल गतिज घर्षण है, μₖN = 30 N. वह स्थैतिक अधिकतम से छोटा है, इसीलिए पेटी शुरू होते ही झटका खाती है: एक क्षण के लिए लगाया बल 30 N से लड़ रहा है जबकि क्षण भर पहले 40 से लड़ रहा था। विद्यार्थी का दूसरा दावा ग़लत गुणांक लगाता है। परिणामी बल = 50 − 30 = 20 N, अतः a = F/m = 20/10 = 2 m/s². ऐसे किसी भी उत्तर पर तीन जाँचें करने योग्य हैं। क्या त्वरण उससे छोटा निकला जो अकेला धक्का देता? यहाँ 10 kg पर 50 N से 5 m/s² मिलता, और घर्षण ने उसे 2 कर दिया, जो समझ में आता है। क्या गतिज मान स्थैतिक अधिकतम से नीचे है? 30 < 40, हाँ — उलटा अभौतिक होता, क्योंकि छूटा गुटका तुरंत और कसकर पकड़ लिया जाता। और क्या अभिलंब बल सचमुच mg है? यहाँ हाँ, पर फ़र्श झुका दो या कोण पर धकेलो और वह नहीं रहता, और हर घर्षण-आँकड़ा उसके साथ बदल जाता है — इसीलिए पहले N निकालना चाहिए और उसे कभी मान नहीं लेना चाहिए। (ग़लत उत्तर वहाँ स्थैतिक अधिकतम लगाते जहाँ कुछ स्थैतिक है ही नहीं, किस स्थिति को कौन-सा गुणांक मिले यह उलट देते, या क्षैतिज धक्के की तुलना ऊर्ध्वाधर भार से करते, जो लंबवत अक्षों पर दो ऐसे बल हैं जो एक-दूसरे का विरोध करते ही नहीं।)",
          mr: "लंब बलापासून सुरुवात करा, कारण दोन्ही गुणांक त्याच्यावरच लागतात. जमीन सपाट आणि रेटा आडवा, म्हणून N वजन संतुलित करते: N = mg = 10 × 10 = 100 N. स्थितिक छत μₛN = 0.4 × 100 = 40 N आणि गतिज मूल्य μₖN = 0.3 × 100 = 30 N. दोन्ही या जमिनीवरील या ठोकळ्याबद्दलच्या संख्या, आणि एका वेळी त्यांपैकी केवळ एकच लागू. पहिली स्थिती, रेटा 30 N, ठोकळा स्थिर. तो त्वरित होत नसल्याने त्याच्यावरील आडव्या बलांची बेरीज शून्य असावी लागते, म्हणून घर्षण नेमके 30 N — 40 नव्हे. हाच तो मुद्दा जो प्रकरणातले स्थितिक घर्षणाचे तथ्य सांगते: स्थितिक घर्षण ही ठरलेली राशी नव्हे जी पाहून उचलावी, ती परिस्थिती जितकी मागेल तितकी असते, एका मर्यादेपर्यंत. 10 N ने ढकला तर घर्षण 10 N. 39 N ने ढकला तर 39 N. 41 N ने ढकला तर घर्षण देऊ शकत नाही, पृष्ठभाग निसटतात, आणि वर्णन पूर्णपणे बदलते. म्हणून विद्यार्थ्याचा पहिला दावा बरोबर, आणि बरोबर कारणाने बरोबर. दुसरी स्थिती, रेटा 50 N. आता 50 हे 40 हून जास्त, म्हणून ठोकळा सुटून घसरतो. घसरताच स्थितिक घर्षणाला सांगायला काही उरत नाही — पृष्ठभाग सापेक्ष गतीत आहेत, आणि अडवणारे बल गतिज घर्षण, μₖN = 30 N. ते स्थितिक कमालहून लहान, म्हणूनच पेटी सुरू होताच झटका खाते: एका क्षणापुरते लावलेले बल 30 N शी लढत आहे तर क्षणभरापूर्वी ते 40 शी लढत होते. विद्यार्थ्याचा दुसरा दावा चुकीचा गुणांक वापरतो. परिणामी बल = 50 − 30 = 20 N, म्हणून a = F/m = 20/10 = 2 m/s². अशा कोणत्याही उत्तरावर तीन तपासण्या करण्याजोग्या. त्वरण एकट्या रेट्याने आले असते त्याहून लहान आले का? इथे 10 kg वर 50 N ने 5 m/s² आले असते, आणि घर्षणाने ते 2 केले, जे समजण्याजोगे. गतिज मूल्य स्थितिक कमालच्या खाली आहे का? 30 < 40, हो — उलटे अभौतिक ठरले असते, कारण सुटलेला ठोकळा लगेच अधिक घट्ट पकडला गेला असता. आणि लंब बल खरोखर mg आहे का? इथे हो, पण जमीन कलवा वा कोनात ढकला आणि ते राहत नाही, आणि प्रत्येक घर्षण-आकडा त्यासोबत बदलतो — म्हणूनच आधी N काढावे आणि ते कधीही गृहीत धरू नये. (चुकीची उत्तरे जिथे काहीच स्थितिक नाही तिथे स्थितिक कमाल वापरतात, कोणत्या स्थितीला कोणता गुणांक हे उलटवतात, वा आडव्या रेट्याची तुलना उभ्या वजनाशी करतात, जी लंब अक्षांवरील अशी दोन बले आहेत जी एकमेकांना विरोधच करत नाहीत.)",
        },
      },
      /*H4*/
    ],
  },

];

export const G11_PHYSICS_NUMERIC: Record<string, NumQ[]> = {
  "physics-11-units-and-measurements": [
    {
      level: 1,
      stem: {
        en: "A car's speedometer reads 72 km/h. What is that speed in metres per second?",
        hi: "एक कार की चालमापी 72 km/h दिखाती है। यह चाल मीटर प्रति सेकंड में क्या है?",
        mr: "एका कारचा वेगमापक 72 km/h दाखवतो. हा वेग मीटर प्रति सेकंदात किती?",
      },
      answer: 20,
      wrong: [7.2, 200, 26],
      checkExpr: "72*1000/3600",
      fmt: ms,
      solution: {
        en: "A kilometre is 1000 m and an hour is 3600 s, so 72 km/h = 72 × 1000/3600 = 20 m/s. The shortcut is to multiply by 5/18. (7.2 comes from dividing by 10 alone, and 200 from multiplying by 1000 without dividing by 3600.)",
        hi: "एक किलोमीटर 1000 m और एक घंटा 3600 s, अतः 72 km/h = 72 × 1000/3600 = 20 m/s. छोटा रास्ता 5/18 से गुणा करना है। (7.2 केवल 10 से भाग देने से आता है, और 200 बिना 3600 से भाग दिए 1000 से गुणा करने से।)",
        mr: "एक किलोमीटर 1000 m आणि एक तास 3600 s, म्हणून 72 km/h = 72 × 1000/3600 = 20 m/s. शॉर्टकट म्हणजे 5/18 ने गुणणे. (7.2 फक्त 10 ने भागल्याने येते, आणि 200 हे 3600 ने न भागता 1000 ने गुणल्याने.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "The density of aluminium is 2.7 g/cm³. Expressed in kg/m³, what is it?",
        hi: "ऐलुमिनियम का घनत्व 2.7 g/cm³ है। kg/m³ में यह कितना है?",
        mr: "ॲल्युमिनियमची घनता 2.7 g/cm³ आहे. kg/m³ मध्ये ती किती?",
      },
      answer: 2700,
      wrong: [0.0027, 27, 270],
      checkExpr: "2.7*1000",
      solution: {
        en: "One gram is 10⁻³ kg and one cm³ is 10⁻⁶ m³, so g/cm³ → kg/m³ multiplies by 10⁻³/10⁻⁶ = 1000. Hence 2.7 × 1000 = 2700 kg/m³. (0.0027 applies the mass conversion and forgets the volume; 27 and 270 stop short by a factor of a hundred and ten.)",
        hi: "एक ग्राम 10⁻³ kg और एक cm³ 10⁻⁶ m³, अतः g/cm³ → kg/m³ में 10⁻³/10⁻⁶ = 1000 का गुणा होता है। इसलिए 2.7 × 1000 = 2700 kg/m³. (0.0027 केवल द्रव्यमान का रूपांतरण करता और आयतन भूल जाता है; 27 और 270 सौ और दस के गुणक से पीछे रह जाते हैं।)",
        mr: "एक ग्रॅम 10⁻³ kg आणि एक cm³ 10⁻⁶ m³, म्हणून g/cm³ → kg/m³ मध्ये 10⁻³/10⁻⁶ = 1000 चा गुणाकार होतो. म्हणून 2.7 × 1000 = 2700 kg/m³. (0.0027 फक्त वस्तुमानाचे रूपांतर करते आणि घनफळ विसरते; 27 आणि 270 शंभर व दहाच्या पटीने मागे राहतात.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A screw gauge has a pitch of 0.5 mm and 50 divisions on its circular scale. What is its least count, in mm?",
        hi: "एक पेचमापी की चूड़ी-अंतराल 0.5 mm है और उसके वृत्तीय पैमाने पर 50 विभाजन हैं। उसका अल्पतमांक mm में क्या है?",
        mr: "एका स्क्रू गेजचा पिच 0.5 mm आहे आणि त्याच्या वर्तुळाकार पट्टीवर 50 विभाग आहेत. त्याचा अल्पतमांक mm मध्ये किती?",
      },
      answer: 0.01,
      wrong: [0.005, 0.1, 25],
      checkExpr: "0.5/50",
      solution: {
        en: "One full turn advances the spindle by the pitch, and that turn is divided into 50 parts, so one division is 0.5/50 = 0.01 mm. (0.005 halves it once too often, 0.1 divides by 5 instead of 50, and 25 multiplies where it should divide.)",
        hi: "एक पूरा चक्कर तकले को चूड़ी-अंतराल जितना आगे बढ़ाता है, और वह चक्कर 50 भागों में बँटा है, अतः एक विभाजन 0.5/50 = 0.01 mm. (0.005 एक बार अधिक आधा करता है, 0.1 50 के बजाय 5 से भाग देता है, और 25 वहाँ गुणा करता है जहाँ भाग देना था।)",
        mr: "एक पूर्ण फेरा दांडा पिचइतका पुढे नेतो, आणि तो फेरा 50 भागांत विभागलेला, म्हणून एक विभाग 0.5/50 = 0.01 mm. (0.005 एकदा जास्त निम्मे करते, 0.1 हे 50 ऐवजी 5 ने भागते, आणि 25 जिथे भागायचे तिथे गुणते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A wire is measured as 5.00 m with an instrument whose absolute uncertainty is 0.01 m. What is the percentage error in the length?",
        hi: "एक तार 5.00 m नापा गया, और यंत्र की निरपेक्ष अनिश्चितता 0.01 m है। लंबाई में प्रतिशत त्रुटि क्या है?",
        mr: "एक तार 5.00 m मोजली गेली, आणि उपकरणाची निरपेक्ष अनिश्चितता 0.01 m आहे. लांबीतील शेकडा त्रुटी किती?",
      },
      answer: 0.2,
      wrong: [0.02, 2, 5],
      checkExpr: "0.01/5.00*100",
      solution: {
        en: "Percentage error is the absolute error divided by the measured value, times a hundred: (0.01/5.00) × 100 = 0.2%. (0.02 is the fraction left unconverted to a percentage, and 2 slips a decimal place.)",
        hi: "प्रतिशत त्रुटि निरपेक्ष त्रुटि बटा नापा गया मान, गुणा सौ: (0.01/5.00) × 100 = 0.2%. (0.02 वह भिन्न है जिसे प्रतिशत में बदला ही नहीं गया, और 2 में दशमलव एक स्थान खिसक जाता है।)",
        mr: "शेकडा त्रुटी म्हणजे निरपेक्ष त्रुटी भागिले मोजलेले मूल्य, गुणिले शंभर: (0.01/5.00) × 100 = 0.2%. (0.02 हा अपूर्णांक शेकड्यात न बदललेला, आणि 2 मध्ये दशांश एक स्थान सरकतो.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "The side of a cube is measured with a percentage error of 1%. What is the percentage error in the volume calculated from it?",
        hi: "एक घन की भुजा 1% प्रतिशत त्रुटि के साथ नापी गई। उससे निकाले गए आयतन में प्रतिशत त्रुटि क्या है?",
        mr: "एका घनाची बाजू 1% शेकडा त्रुटीसह मोजली गेली. तिच्यापासून काढलेल्या घनफळातील शेकडा त्रुटी किती?",
      },
      answer: 3,
      wrong: [1, 2, 9],
      checkExpr: "3*1",
      solution: {
        en: "Volume is the side cubed, and an exponent multiplies the fractional error it acts on, so the error is 3 × 1% = 3%. (1 forgets the exponent altogether, 2 uses the exponent of an area, and 9 squares the 3 instead of using it once.)",
        hi: "आयतन भुजा का घन है, और घातांक जिस भिन्नात्मक त्रुटि पर लगता है उसे गुणा करता है, अतः त्रुटि 3 × 1% = 3%. (1 घातांक भूल ही जाता है, 2 क्षेत्रफल का घातांक लगाता है, और 9 3 को एक बार लगाने के बजाय वर्ग कर देता है।)",
        mr: "घनफळ म्हणजे बाजूचा घन, आणि घातांक ज्या अपूर्णांकी त्रुटीवर लागतो तिला गुणतो, म्हणून त्रुटी 3 × 1% = 3%. (1 घातांक पूर्णपणे विसरते, 2 क्षेत्रफळाचा घातांक वापरते, आणि 9 हे 3 एकदा वापरण्याऐवजी त्याचा वर्ग करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Vernier callipers have a main-scale division of 1 mm, and 20 vernier divisions coincide with 19 main-scale divisions. What is the least count, in mm?",
        hi: "वर्नियर कैलिपर्स के मुख्य पैमाने का एक विभाजन 1 mm है, और 20 वर्नियर विभाजन मुख्य पैमाने के 19 विभाजनों के बराबर हैं। अल्पतमांक mm में क्या है?",
        mr: "व्हर्नियर कॅलिपरच्या मुख्य पट्टीचा एक विभाग 1 mm आहे, आणि 20 व्हर्नियर विभाग मुख्य पट्टीच्या 19 विभागांशी जुळतात. अल्पतमांक mm मध्ये किती?",
      },
      answer: 0.05,
      wrong: [0.01, 0.1, 0.95],
      checkExpr: "1/20",
      solution: {
        en: "Each vernier division is 19/20 mm, so it falls short of a main-scale division by 1 − 19/20 = 1/20 = 0.05 mm, and that shortfall is the least count. (0.95 is the vernier division itself rather than the difference, and 0.1 assumes ten divisions.)",
        hi: "हर वर्नियर विभाजन 19/20 mm का है, अतः वह मुख्य पैमाने के विभाजन से 1 − 19/20 = 1/20 = 0.05 mm कम पड़ता है, और यही कमी अल्पतमांक है। (0.95 अंतर के बजाय स्वयं वर्नियर विभाजन है, और 0.1 दस विभाजन मान लेता है।)",
        mr: "प्रत्येक व्हर्नियर विभाग 19/20 mm चा, म्हणून तो मुख्य पट्टीच्या विभागाहून 1 − 19/20 = 1/20 = 0.05 mm कमी पडतो, आणि हीच कमतरता अल्पतमांक. (0.95 हा फरकाऐवजी स्वतः व्हर्नियर विभाग, आणि 0.1 दहा विभाग गृहीत धरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Dimensional analysis is used to write a simple pendulum's period as T = k·lᵃ·gᵇ, with k a pure number. What is the value of a?",
        hi: "विमीय विश्लेषण से सरल लोलक का आवर्तकाल T = k·lᵃ·gᵇ लिखा जाता है, जहाँ k शुद्ध संख्या है। a का मान क्या है?",
        mr: "मितीय विश्लेषणाने साध्या लंबकाचा आवर्तकाल T = k·lᵃ·gᵇ असा लिहिला जातो, जिथे k शुद्ध संख्या. a चे मूल्य किती?",
      },
      answer: 0.5,
      wrong: [1, 2, 0.25],
      checkExpr: "1/2",
      solution: {
        en: "Matching dimensions, T¹ = Lᵃ(LT⁻²)ᵇ gives 1 = −2b, so b = −½, and 0 = a + b, so a = ½ = 0.5. The period therefore goes as the square root of the length. (1 would make T proportional to l, which the √2 growth on doubling the length contradicts.)",
        hi: "विमाएँ मिलाने पर T¹ = Lᵃ(LT⁻²)ᵇ से 1 = −2b, अतः b = −½, और 0 = a + b, अतः a = ½ = 0.5. इसलिए आवर्तकाल लंबाई के वर्गमूल के अनुपात में चलता है। (1 से T, l का समानुपाती हो जाता, जिसका खंडन लंबाई दोगुनी करने पर √2 की वृद्धि करती है।)",
        mr: "मिती जुळवल्यास T¹ = Lᵃ(LT⁻²)ᵇ वरून 1 = −2b, म्हणून b = −½, आणि 0 = a + b, म्हणून a = ½ = 0.5. म्हणून आवर्तकाल लांबीच्या वर्गमुळाच्या प्रमाणात जातो. (1 ने T हा l च्या समानुपाती झाला असता, ज्याचे खंडन लांबी दुप्पट केल्यावरची √2 वाढ करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A quantity is computed as P = a³b² / d, where the percentage errors in a, b and d are 1%, 3% and 2%. What is the percentage error in P?",
        hi: "एक राशि P = a³b² / d से निकाली जाती है, जहाँ a, b और d में प्रतिशत त्रुटियाँ 1%, 3% और 2% हैं। P में प्रतिशत त्रुटि क्या है?",
        mr: "एक राशी P = a³b² / d ने काढली जाते, जिथे a, b आणि d मधील शेकडा त्रुटी 1%, 3% आणि 2% आहेत. P मधील शेकडा त्रुटी किती?",
      },
      answer: 11,
      wrong: [6, 7, 2],
      checkExpr: "3*1+2*3+2",
      solution: {
        en: "Fractional errors add through a product or quotient, each weighted by its exponent, and division contributes with the same positive sign as multiplication because errors never cancel. So the error is 3(1) + 2(3) + 1(2) = 3 + 6 + 2 = 11%. (6 adds the three percentages unweighted, and 7 subtracts d's contribution instead of adding it — the commonest slip of all.)",
        hi: "गुणनफल या भागफल में भिन्नात्मक त्रुटियाँ जुड़ती हैं, हर एक अपने घातांक से भारित, और भाग भी गुणा के समान धनात्मक चिह्न से योगदान देता है क्योंकि त्रुटियाँ कभी कटती नहीं। अतः त्रुटि 3(1) + 2(3) + 1(2) = 3 + 6 + 2 = 11%. (6 तीनों प्रतिशत बिना भार के जोड़ता है, और 7 d का योगदान जोड़ने के बजाय घटा देता है — सबसे आम चूक।)",
        mr: "गुणाकार वा भागाकारात अपूर्णांकी त्रुटी जोडल्या जातात, प्रत्येक आपल्या घातांकाने भारित, आणि भागाकारही गुणाकाराप्रमाणेच धन चिन्हाने वाटा देतो कारण त्रुटी कधीही कापल्या जात नाहीत. म्हणून त्रुटी 3(1) + 2(3) + 1(2) = 3 + 6 + 2 = 11%. (6 तिन्ही शेकडे भाराशिवाय जोडते, आणि 7 हे d चा वाटा जोडण्याऐवजी वजा करते — सर्वांत नेहमीची चूक.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A pendulum's length is 100.0 cm with an uncertainty of 0.1 cm, and 100 oscillations take 200.0 s on a stopwatch with an uncertainty of 0.1 s. Since g is computed as 4π²l/T², what is the percentage error in g?",
        hi: "एक लोलक की लंबाई 100.0 cm है जिसमें 0.1 cm की अनिश्चितता है, और 100 दोलनों में विरामघड़ी पर 200.0 s लगते हैं जिसमें 0.1 s की अनिश्चितता है। चूँकि g = 4π²l/T² से निकाला जाता है, g में प्रतिशत त्रुटि क्या है?",
        mr: "एका लंबकाची लांबी 100.0 cm असून तीत 0.1 cm ची अनिश्चितता आहे, आणि 100 आंदोलनांना थांबघड्याळावर 200.0 s लागतात ज्यात 0.1 s ची अनिश्चितता आहे. g हे 4π²l/T² ने काढले जाते, तर g मधील शेकडा त्रुटी किती?",
      },
      answer: 0.2,
      wrong: [0.15, 0.3, 0.1],
      checkExpr: "0.1/100.0*100+2*0.1/200.0*100",
      solution: {
        en: "The length contributes (0.1/100.0) × 100 = 0.1%. The total time contributes (0.1/200.0) × 100 = 0.05%, and T enters squared, so it contributes 2 × 0.05 = 0.1%. Adding, the error in g is 0.1 + 0.1 = 0.2%. Notice what timing 100 oscillations bought: the stopwatch's 0.1 s is divided by the whole 200 s rather than by one period, which is why the timing term is no larger than the length term even though a single swing could not have been timed to anything like that precision. (0.15 forgets to double the time error, 0.3 doubles the length error too, and 0.1 keeps only one of the two contributions.)",
        hi: "लंबाई का योगदान (0.1/100.0) × 100 = 0.1%. कुल समय का योगदान (0.1/200.0) × 100 = 0.05%, और T वर्ग में आता है, अतः उसका योगदान 2 × 0.05 = 0.1%. जोड़ने पर g में त्रुटि 0.1 + 0.1 = 0.2%. ध्यान दो 100 दोलन नापने से क्या मिला: विरामघड़ी के 0.1 s को एक आवर्तकाल के बजाय पूरे 200 s से भाग दिया जाता है, इसीलिए समय का पद लंबाई के पद से बड़ा नहीं, जबकि अकेला झूला इतनी परिशुद्धता से नापा ही नहीं जा सकता था। (0.15 समय की त्रुटि दोगुनी करना भूलता है, 0.3 लंबाई की त्रुटि भी दोगुनी कर देता है, और 0.1 दो में से केवल एक योगदान रखता है।)",
        mr: "लांबीचा वाटा (0.1/100.0) × 100 = 0.1%. एकूण काळाचा वाटा (0.1/200.0) × 100 = 0.05%, आणि T वर्गात येतो, म्हणून त्याचा वाटा 2 × 0.05 = 0.1%. बेरीज केल्यास g मधील त्रुटी 0.1 + 0.1 = 0.2%. लक्षात घ्या 100 आंदोलने मोजल्याने काय मिळाले: थांबघड्याळाचे 0.1 s एका आवर्तकालाऐवजी अख्ख्या 200 s ने भागले जाते, म्हणूनच काळाचे पद लांबीच्या पदाहून मोठे नाही, तर एकटा झोका इतक्या अचूकतेने मोजताच आला नसता. (0.15 काळाची त्रुटी दुप्पट करायला विसरते, 0.3 लांबीची त्रुटीही दुप्पट करते, आणि 0.1 दोहोंपैकी फक्त एक वाटा ठेवते.)",
      },
    },
  ],
  "physics-11-motion-in-a-straight-line": [
    {
      level: 1,
      stem: {
        en: "A body starts from rest and accelerates uniformly at 2 m/s². What is its velocity after 6 s?",
        hi: "एक पिंड विराम से चलकर 2 m/s² के एकसमान त्वरण से चलता है। 6 s बाद उसका वेग क्या है?",
        mr: "एक पिंड स्थिरावस्थेतून सुरू होऊन 2 m/s² च्या एकसमान त्वरणाने जातो. 6 s नंतर त्याचा वेग किती?",
      },
      answer: 12,
      wrong: [3, 8, 36],
      checkExpr: "2*6",
      fmt: ms,
      solution: {
        en: "With u = 0, v = u + at = 0 + 2 × 6 = 12 m/s. (3 divides instead of multiplying, 8 adds the two numbers, and 36 is ½at² — a distance, not a velocity, so it fails on units before it fails on arithmetic.)",
        hi: "u = 0 के साथ, v = u + at = 0 + 2 × 6 = 12 m/s. (3 गुणा के बजाय भाग देता है, 8 दोनों संख्याएँ जोड़ता है, और 36 ½at² है — जो दूरी है, वेग नहीं, अतः वह अंकगणित से पहले मात्रकों पर ही गिर जाता है।)",
        mr: "u = 0 सह, v = u + at = 0 + 2 × 6 = 12 m/s. (3 गुणण्याऐवजी भागते, 8 दोन्ही संख्या जोडते, आणि 36 हे ½at² आहे — जे अंतर, वेग नव्हे, म्हणून ते अंकगणिताआधीच एककांवर कोसळते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A stone is dropped from rest and falls for 3 s. Taking g as 10 m/s², how far does it fall?",
        hi: "एक पत्थर विराम से गिराया जाता है और 3 s तक गिरता है। g को 10 m/s² लेते हुए, वह कितनी दूर गिरता है?",
        mr: "एक दगड स्थिरावस्थेतून टाकला जातो आणि 3 s पडतो. g हा 10 m/s² घेतल्यास, तो किती अंतर पडतो?",
      },
      answer: 45,
      wrong: [30, 90, 15],
      checkExpr: "0.5*10*3^2",
      fmt: metres,
      solution: {
        en: "With u = 0, s = ½gt² = ½ × 10 × 9 = 45 m. (30 is gt, which is the velocity at that instant rather than the distance; 90 forgets the factor of ½; 15 uses t rather than t².)",
        hi: "u = 0 के साथ, s = ½gt² = ½ × 10 × 9 = 45 m. (30 gt है, जो उस क्षण का वेग है, दूरी नहीं; 90 ½ का गुणक भूल जाता है; 15 t² के बजाय t लगाता है।)",
        mr: "u = 0 सह, s = ½gt² = ½ × 10 × 9 = 45 m. (30 हे gt आहे, जो त्या क्षणीचा वेग, अंतर नव्हे; 90 ½ चा गुणक विसरते; 15 हे t² ऐवजी t वापरते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A body moving at 5 m/s accelerates uniformly at 2 m/s². How far does it travel in the next 4 s?",
        hi: "5 m/s से चलता पिंड 2 m/s² के एकसमान त्वरण से बढ़ता है। अगले 4 s में वह कितनी दूरी तय करता है?",
        mr: "5 m/s ने जाणारा पिंड 2 m/s² च्या एकसमान त्वरणाने वाढतो. पुढच्या 4 s मध्ये तो किती अंतर कापतो?",
      },
      answer: 36,
      wrong: [20, 16, 52],
      checkExpr: "5*4+0.5*2*4^2",
      fmt: metres,
      solution: {
        en: "s = ut + ½at² = 5 × 4 + ½ × 2 × 16 = 20 + 16 = 36 m. (20 keeps only the first term and forgets the acceleration; 16 keeps only the second and forgets the head start; 52 drops the ½ and gets 20 + 32.)",
        hi: "s = ut + ½at² = 5 × 4 + ½ × 2 × 16 = 20 + 16 = 36 m. (20 केवल पहला पद रखता और त्वरण भूल जाता है; 16 केवल दूसरा रखता और आरंभिक वेग भूल जाता है; 52 ½ गिरा देता है और 20 + 32 पाता है।)",
        mr: "s = ut + ½at² = 5 × 4 + ½ × 2 × 16 = 20 + 16 = 36 m. (20 फक्त पहिले पद ठेवते आणि त्वरण विसरते; 16 फक्त दुसरे ठेवते आणि सुरुवातीचा वेग विसरते; 52 हे ½ गाळते आणि 20 + 32 मिळवते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A car braking uniformly slows from 20 m/s to rest in 5 s. What is the magnitude of its acceleration?",
        hi: "एकसमान ब्रेक लगाती कार 20 m/s से 5 s में विराम तक धीमी होती है। उसके त्वरण का परिमाण क्या है?",
        mr: "एकसमान ब्रेक लावणारी कार 20 m/s पासून 5 s मध्ये स्थिरावस्थेपर्यंत मंदावते. तिच्या त्वरणाचे परिमाण किती?",
      },
      answer: 4,
      wrong: [0.25, 100, 15],
      checkExpr: "20/5",
      solution: {
        en: "From v = u + at with v = 0, the magnitude is u/t = 20/5 = 4 m/s². The sign is negative because the acceleration opposes the motion, but the magnitude asked for is 4. (0.25 inverts the division and 100 multiplies.)",
        hi: "v = u + at में v = 0 रखने पर परिमाण u/t = 20/5 = 4 m/s². चिह्न ऋणात्मक है क्योंकि त्वरण गति का विरोध करता है, पर पूछा गया परिमाण 4 है। (0.25 भाग उलट देता है और 100 गुणा कर देता है।)",
        mr: "v = u + at मध्ये v = 0 ठेवल्यास परिमाण u/t = 20/5 = 4 m/s². चिन्ह ऋण आहे कारण त्वरण गतीला विरोध करते, पण विचारलेले परिमाण 4 आहे. (0.25 भागाकार उलटा करते आणि 100 गुणते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A car travelling at 30 m/s brakes with a uniform retardation of 5 m/s². How far does it go before stopping?",
        hi: "30 m/s से चलती कार 5 m/s² के एकसमान मंदन से ब्रेक लगाती है। रुकने से पहले वह कितनी दूर जाती है?",
        mr: "30 m/s ने जाणारी कार 5 m/s² च्या एकसमान मंदनाने ब्रेक लावते. थांबण्यापूर्वी ती किती अंतर जाते?",
      },
      answer: 90,
      wrong: [45, 180, 6],
      checkExpr: "30^2/(2*5)",
      fmt: metres,
      solution: {
        en: "Nothing is said about how long the braking lasts, so use the equation with no time in it: v² = u² + 2as with v = 0 gives s = u²/(2a) = 900/10 = 90 m. (45 forgets to square the speed's role by using u/(2a)·something, 180 leaves out the 2, and 6 is the stopping time in seconds, not a distance.)",
        hi: "यह नहीं बताया गया कि ब्रेक कितनी देर लगे, अतः वह समीकरण लो जिसमें समय है ही नहीं: v² = u² + 2as में v = 0 रखने पर s = u²/(2a) = 900/10 = 90 m. (45 आधा कर देता है, 180 2 का गुणक छोड़ देता है, और 6 सेकंड में रुकने का समय है, दूरी नहीं।)",
        mr: "ब्रेक किती वेळ लागले हे सांगितलेले नाही, म्हणून ज्यात काळ नाही ते समीकरण घ्या: v² = u² + 2as मध्ये v = 0 ठेवल्यास s = u²/(2a) = 900/10 = 90 m. (45 निम्मे करते, 180 हे 2 चा गुणक सोडते, आणि 6 हा सेकंदांतील थांबण्याचा काळ, अंतर नव्हे.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A velocity–time graph rises as a straight line from 0 to 20 m/s over 8 s. What distance does the body cover in those 8 s?",
        hi: "एक वेग-समय आलेख 8 s में 0 से 20 m/s तक सीधी रेखा में चढ़ता है। उन 8 s में पिंड कितनी दूरी तय करता है?",
        mr: "एक वेग-काळ आलेख 8 s मध्ये 0 पासून 20 m/s पर्यंत सरळ रेषेत चढतो. त्या 8 s मध्ये पिंड किती अंतर कापतो?",
      },
      answer: 80,
      wrong: [160, 40, 28],
      checkExpr: "0.5*20*8",
      fmt: metres,
      solution: {
        en: "The region under the line is a triangle of base 8 s and height 20 m/s, so the distance is ½ × 20 × 8 = 80 m. Equivalently the average velocity is (0 + 20)/2 = 10 m/s over 8 s. (160 treats the region as a rectangle, using the final velocity as though it had been held all along.)",
        hi: "रेखा के नीचे का क्षेत्र 8 s आधार और 20 m/s ऊँचाई का त्रिभुज है, अतः दूरी ½ × 20 × 8 = 80 m. समतुल्य रूप से औसत वेग (0 + 20)/2 = 10 m/s, 8 s तक। (160 क्षेत्र को आयत मानता है, अंतिम वेग को ऐसे लेकर मानो वह पूरे समय बना रहा हो।)",
        mr: "रेषेखालचे क्षेत्र 8 s पाया आणि 20 m/s उंचीचा त्रिकोण, म्हणून अंतर ½ × 20 × 8 = 80 m. समतुल्यपणे सरासरी वेग (0 + 20)/2 = 10 m/s, 8 s भर. (160 क्षेत्राला आयत मानते, अंतिम वेग असा घेऊन जणू तो पूर्ण काळ टिकला होता.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Two trains on parallel tracks move towards each other, one at 20 m/s and the other at 15 m/s. At what rate does the gap between them close?",
        hi: "समांतर पटरियों पर दो रेलगाड़ियाँ एक-दूसरे की ओर चलती हैं, एक 20 m/s पर और दूसरी 15 m/s पर। उनके बीच का अंतर किस दर से घटता है?",
        mr: "समांतर रुळांवर दोन आगगाड्या एकमेकींकडे जातात, एक 20 m/s ने आणि दुसरी 15 m/s ने. त्यांच्यातले अंतर कोणत्या दराने घटते?",
      },
      answer: 35,
      wrong: [5, 17.5, 300],
      checkExpr: "20+15",
      fmt: ms,
      solution: {
        en: "Take one direction as positive: the velocities are +20 and −15, so the relative velocity is 20 − (−15) = 35 m/s. Head-on motion turns the subtraction into an addition of magnitudes. (5 is the answer for two trains going the same way, 17.5 averages them, and 300 multiplies.)",
        hi: "एक दिशा को धनात्मक लो: वेग +20 और −15 हैं, अतः सापेक्ष वेग 20 − (−15) = 35 m/s. आमने-सामने की गति घटाव को परिमाणों के जोड़ में बदल देती है। (5 उस स्थिति का उत्तर है जब दोनों एक ही ओर जा रही हों, 17.5 उनका औसत है, और 300 गुणा है।)",
        mr: "एक दिशा धन घ्या: वेग +20 आणि −15, म्हणून सापेक्ष वेग 20 − (−15) = 35 m/s. समोरासमोरची गती वजाबाकीला परिमाणांच्या बेरजेत बदलते. (5 हे दोन्ही एकाच दिशेने जात असतानाचे उत्तर, 17.5 त्यांची सरासरी, आणि 300 गुणाकार.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A stone is thrown vertically upwards at 20 m/s. Taking g as 10 m/s², how long is it in the air before returning to the thrower's hand?",
        hi: "एक पत्थर 20 m/s से ऊर्ध्वाधर ऊपर फेंका जाता है। g को 10 m/s² लेते हुए, फेंकने वाले के हाथ में लौटने तक वह कितनी देर हवा में रहता है?",
        mr: "एक दगड 20 m/s ने उभा वर फेकला जातो. g हा 10 m/s² घेतल्यास, फेकणाऱ्याच्या हातात परतेपर्यंत तो किती वेळ हवेत असतो?",
      },
      answer: 4,
      wrong: [2, 8, 40],
      checkExpr: "2*20/10",
      fmt: seconds,
      solution: {
        en: "The rise takes u/g = 20/10 = 2 s, and the fall back to the same height takes the same 2 s because the motion is symmetric about the top, so the total is 2 × 20/10 = 4 s. (2 is only the upward half, and 40 divides the wrong way round.)",
        hi: "चढ़ाई u/g = 20/10 = 2 s लेती है, और उसी ऊँचाई तक वापसी भी 2 s, क्योंकि गति शिखर के परितः सममित है, अतः कुल 2 × 20/10 = 4 s. (2 केवल ऊपर जाने का आधा है, और 40 उलटा भाग देता है।)",
        mr: "चढण u/g = 20/10 = 2 s घेते, आणि त्याच उंचीपर्यंतचे परतणेही 2 s, कारण गती शिखराभोवती सममित आहे, म्हणून एकूण 2 × 20/10 = 4 s. (2 फक्त वर जाण्याचा अर्धा भाग, आणि 40 उलटा भागाकार करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "The same stone is thrown vertically upwards at 20 m/s with g taken as 10 m/s². What maximum height does it reach?",
        hi: "वही पत्थर 20 m/s से ऊर्ध्वाधर ऊपर फेंका जाता है, g को 10 m/s² लेते हुए। वह अधिकतम कितनी ऊँचाई तक पहुँचता है?",
        mr: "तोच दगड 20 m/s ने उभा वर फेकला जातो, g हा 10 m/s² घेऊन. तो जास्तीत जास्त किती उंची गाठतो?",
      },
      answer: 20,
      wrong: [40, 10, 80],
      checkExpr: "20^2/(2*10)",
      fmt: metres,
      solution: {
        en: "At the top the velocity is zero, so v² = u² − 2gh gives h = u²/(2g) = 400/20 = 20 m. Note that the velocity is zero there while the acceleration is still 10 m/s² downwards, which is why the stone does not stay. (40 omits the 2 and 10 halves once too often.)",
        hi: "शिखर पर वेग शून्य है, अतः v² = u² − 2gh से h = u²/(2g) = 400/20 = 20 m. ध्यान दो वहाँ वेग शून्य है जबकि त्वरण अब भी 10 m/s² नीचे की ओर है, इसीलिए पत्थर वहाँ ठहरता नहीं। (40 2 का गुणक छोड़ता है और 10 एक बार अधिक आधा करता है।)",
        mr: "शिखरावर वेग शून्य, म्हणून v² = u² − 2gh वरून h = u²/(2g) = 400/20 = 20 m. लक्षात घ्या तिथे वेग शून्य असतो तर त्वरण अजूनही 10 m/s² खाली असते, म्हणूनच दगड तिथे थांबत नाही. (40 हे 2 चा गुणक गाळते आणि 10 एकदा जास्त निम्मे करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A bus covers the first half of a route at 30 km/h and the second half at 60 km/h. What is its average speed for the whole route?",
        hi: "एक बस मार्ग का पहला आधा हिस्सा 30 km/h पर और दूसरा आधा 60 km/h पर तय करती है। पूरे मार्ग पर उसकी औसत चाल क्या है?",
        mr: "एक बस मार्गाचा पहिला अर्धा भाग 30 km/h ने आणि दुसरा अर्धा 60 km/h ने कापते. संपूर्ण मार्गासाठी तिची सरासरी चाल किती?",
      },
      answer: 40,
      wrong: [45, 90, 20],
      checkExpr: "2*30*60/(30+60)",
      solution: {
        en: "Average speed is total distance over total time, never the mean of the speeds. Let each half be d. The first half takes d/30 and the second d/60, so the total time is d/30 + d/60 = 3d/60 = d/20, and the average is 2d ÷ (d/20) = 40 km/h. The compact form is the harmonic mean, 2 × 30 × 60/(30 + 60) = 40. The reason it falls below 45 is that the slow half occupies twice as much time as the fast half, so it carries twice the weight. (45 is exactly the trap — the arithmetic mean, which would be right only if equal TIMES were spent at each speed rather than equal distances.)",
        hi: "औसत चाल कुल दूरी बटा कुल समय है, चालों का माध्य कभी नहीं। हर आधा हिस्सा d मानो। पहला आधा d/30 लेता है और दूसरा d/60, अतः कुल समय d/30 + d/60 = 3d/60 = d/20, और औसत 2d ÷ (d/20) = 40 km/h. संक्षिप्त रूप हरात्मक माध्य है, 2 × 30 × 60/(30 + 60) = 40. यह 45 से नीचे इसलिए गिरता है कि धीमा आधा हिस्सा तेज़ आधे से दुगुना समय घेरता है, अतः उसका भार दुगुना है। (45 ठीक वही जाल है — समांतर माध्य, जो केवल तब सही होता जब हर चाल पर बराबर समय बिताया जाता, बराबर दूरी नहीं।)",
        mr: "सरासरी चाल म्हणजे एकूण अंतर भागिले एकूण काळ, चालींचा मध्य कधीच नाही. प्रत्येक अर्धा भाग d माना. पहिला अर्धा d/30 घेतो आणि दुसरा d/60, म्हणून एकूण काळ d/30 + d/60 = 3d/60 = d/20, आणि सरासरी 2d ÷ (d/20) = 40 km/h. संक्षिप्त रूप म्हणजे हरात्मक मध्य, 2 × 30 × 60/(30 + 60) = 40. ते 45 च्या खाली येते कारण सावकाश अर्धा भाग वेगवान अर्ध्याहून दुप्पट काळ व्यापतो, म्हणून त्याचे वजन दुप्पट. (45 हाच नेमका सापळा — अंकगणितीय मध्य, जो प्रत्येक चालीवर समान काळ घालवला असता तरच बरोबर ठरला असता, समान अंतर नव्हे.)",
      },
    },
  ],
  "physics-11-motion-in-a-plane": [
    {
      level: 1,
      stem: {
        en: "Two forces of 3 N and 4 N act on a body at right angles to each other. What is the magnitude of their resultant?",
        hi: "किसी पिंड पर 3 N और 4 N के दो बल एक-दूसरे के समकोण पर लगते हैं। उनके परिणामी का परिमाण क्या है?",
        mr: "एका पिंडावर 3 N आणि 4 N ची दोन बले एकमेकांना काटकोनात लागतात. त्यांच्या परिणामीचे परिमाण किती?",
      },
      answer: 5,
      wrong: [1, 7, 12],
      checkExpr: "(3^2+4^2)^0.5",
      fmt: newtons,
      solution: {
        en: "At right angles the triangle law becomes Pythagoras: √(3² + 4²) = √25 = 5 N. (7 is the answer only if the forces point the same way, 1 only if they are exactly opposed, and 12 multiplies them, which no vector rule ever does.)",
        hi: "समकोण पर त्रिभुज नियम पाइथागोरस बन जाता है: √(3² + 4²) = √25 = 5 N. (7 केवल तब उत्तर है जब दोनों बल एक ही दिशा में हों, 1 केवल तब जब वे ठीक विपरीत हों, और 12 उन्हें गुणा करता है, जो कोई सदिश नियम कभी नहीं करता।)",
        mr: "काटकोनात त्रिकोण नियम पायथागोरस बनतो: √(3² + 4²) = √25 = 5 N. (7 हे उत्तर फक्त दोन्ही बले एकाच दिशेने असतील तर, 1 फक्त ती नेमकी विरुद्ध असतील तर, आणि 12 त्यांना गुणते, जे कोणताही सदिश नियम कधीच करत नाही.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A vector of magnitude 10 units makes an angle of 60° with the x-axis. Taking cos 60° = 0.5, what is its x-component?",
        hi: "10 इकाई परिमाण का एक सदिश x-अक्ष से 60° का कोण बनाता है। cos 60° = 0.5 लेते हुए, उसका x-घटक क्या है?",
        mr: "10 एकक परिमाणाचा एक सदिश x-अक्षाशी 60° चा कोन करतो. cos 60° = 0.5 घेतल्यास, त्याचा x-घटक किती?",
      },
      answer: 5,
      wrong: [8.66, 10, 20],
      checkExpr: "10*0.5",
      solution: {
        en: "The component along the axis the angle is measured from uses cosine: 10 × cos 60° = 10 × 0.5 = 5 units. (8.66 is the y-component, from sin 60°, and swapping the two is the commonest slip in resolution; 20 divides by cosine instead of multiplying.)",
        hi: "जिस अक्ष से कोण नापा गया उसके अनुदिश घटक कोज्या लेता है: 10 × cos 60° = 10 × 0.5 = 5 इकाई। (8.66 y-घटक है, sin 60° से, और दोनों को आपस में बदल देना वियोजन की सबसे आम चूक है; 20 गुणा के बजाय कोज्या से भाग देता है।)",
        mr: "ज्या अक्षापासून कोन मोजला त्याच्या दिशेचा घटक कोसाइन घेतो: 10 × cos 60° = 10 × 0.5 = 5 एकके. (8.66 हा y-घटक, sin 60° वरून, आणि दोघांची अदलाबदल ही विभाजनातील सर्वांत नेहमीची चूक; 20 गुणण्याऐवजी कोसाइनने भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A body is projected at 20 m/s at 30° to the horizontal. Taking sin 30° = 0.5 and g = 10 m/s², what is its total time of flight over level ground?",
        hi: "एक पिंड 20 m/s से क्षैतिज से 30° पर प्रक्षिप्त किया जाता है। sin 30° = 0.5 और g = 10 m/s² लेते हुए, समतल ज़मीन पर उसका कुल उड्डयन-काल क्या है?",
        mr: "एक पिंड 20 m/s ने आडव्याशी 30° वर फेकला जातो. sin 30° = 0.5 आणि g = 10 m/s² घेतल्यास, सपाट जमिनीवर त्याचा एकूण उड्डाणकाळ किती?",
      },
      answer: 2,
      wrong: [1, 4, 20],
      checkExpr: "2*20*0.5/10",
      fmt: seconds,
      solution: {
        en: "Only the vertical component matters: u sin θ = 20 × 0.5 = 10 m/s. The time of flight is 2u sin θ/g = 2 × 10/10 = 2 s. The horizontal speed never enters, which is the independence of the components at work. (1 gives only the rise, and 4 uses the full 20 m/s as though the throw were vertical.)",
        hi: "केवल ऊर्ध्वाधर घटक मायने रखता है: u sin θ = 20 × 0.5 = 10 m/s. उड्डयन-काल 2u sin θ/g = 2 × 10/10 = 2 s. क्षैतिज चाल कभी नहीं आती, और यही घटकों की स्वतंत्रता काम करते हुए है। (1 केवल चढ़ाई देता है, और 4 पूरे 20 m/s को ऐसे लेता है मानो फेंक ऊर्ध्वाधर हो।)",
        mr: "केवळ उभा घटक महत्त्वाचा: u sin θ = 20 × 0.5 = 10 m/s. उड्डाणकाळ 2u sin θ/g = 2 × 10/10 = 2 s. आडवी चाल कधीच येत नाही, आणि हेच घटकांच्या स्वतंत्रतेचे काम. (1 फक्त चढण देते, आणि 4 पूर्ण 20 m/s असे घेते जणू फेक उभी असावी.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The same body is projected at 20 m/s at 30°, with sin 30° = 0.5 and g = 10 m/s². What maximum height does it reach?",
        hi: "वही पिंड 20 m/s से 30° पर प्रक्षिप्त होता है, sin 30° = 0.5 और g = 10 m/s² के साथ। वह अधिकतम कितनी ऊँचाई तक पहुँचता है?",
        mr: "तोच पिंड 20 m/s ने 30° वर फेकला जातो, sin 30° = 0.5 आणि g = 10 m/s² सह. तो जास्तीत जास्त किती उंची गाठतो?",
      },
      answer: 5,
      wrong: [10, 2.5, 20],
      checkExpr: "(20*0.5)^2/(2*10)",
      fmt: metres,
      solution: {
        en: "The vertical component is 20 × 0.5 = 10 m/s, and it must be brought to zero by gravity: H = (u sin θ)²/(2g) = 100/20 = 5 m. (20 uses the full speed instead of its vertical part, which would be right only for a vertical throw.)",
        hi: "ऊर्ध्वाधर घटक 20 × 0.5 = 10 m/s है, और गुरुत्व को उसे शून्य करना है: H = (u sin θ)²/(2g) = 100/20 = 5 m. (20 ऊर्ध्वाधर भाग के बजाय पूरी चाल लेता है, जो केवल ऊर्ध्वाधर फेंक के लिए सही होता।)",
        mr: "उभा घटक 20 × 0.5 = 10 m/s, आणि गुरुत्वाला तो शून्य करावा लागतो: H = (u sin θ)²/(2g) = 100/20 = 5 m. (20 उभ्या भागाऐवजी पूर्ण चाल घेते, जे केवळ उभ्या फेकीसाठी बरोबर ठरले असते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A ball is projected at 20 m/s at 45° to the horizontal, with g = 10 m/s². What is its horizontal range on level ground?",
        hi: "एक गेंद 20 m/s से क्षैतिज से 45° पर प्रक्षिप्त होती है, g = 10 m/s² के साथ। समतल ज़मीन पर उसकी क्षैतिज परास क्या है?",
        mr: "एक चेंडू 20 m/s ने आडव्याशी 45° वर फेकला जातो, g = 10 m/s² सह. सपाट जमिनीवर त्याचा आडवा पल्ला किती?",
      },
      answer: 40,
      wrong: [20, 80, 400],
      checkExpr: "20^2/10",
      fmt: metres,
      solution: {
        en: "The range is u² sin 2θ/g, and at 45° the sine of 90° is 1, so R = u²/g = 400/10 = 40 m. This is the largest range any 20 m/s throw can achieve. (80 forgets that sin 2θ cannot exceed 1, and 400 omits g altogether.)",
        hi: "परास u² sin 2θ/g है, और 45° पर 90° की ज्या 1 है, अतः R = u²/g = 400/10 = 40 m. यह 20 m/s की किसी भी फेंक की सबसे बड़ी परास है। (80 भूल जाता है कि sin 2θ 1 से बड़ा नहीं हो सकता, और 400 g को छोड़ ही देता है।)",
        mr: "पल्ला u² sin 2θ/g, आणि 45° वर 90° चा साइन 1, म्हणून R = u²/g = 400/10 = 40 m. हा 20 m/s च्या कोणत्याही फेकीचा सर्वांत मोठा पल्ला. (80 विसरते की sin 2θ हा 1 हून मोठा असू शकत नाही, आणि 400 हे g पूर्णपणे गाळते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A ball is thrown horizontally at 15 m/s from a cliff 20 m high, with g = 10 m/s². How long does it take to reach the ground?",
        hi: "एक गेंद 20 m ऊँची चट्टान से 15 m/s की क्षैतिज चाल से फेंकी जाती है, g = 10 m/s² के साथ। ज़मीन तक पहुँचने में उसे कितना समय लगता है?",
        mr: "एक चेंडू 20 m उंच कड्यावरून 15 m/s च्या आडव्या चालीने फेकला जातो, g = 10 m/s² सह. जमिनीवर पोहोचायला त्याला किती वेळ लागतो?",
      },
      answer: 2,
      wrong: [1.33, 4, 20],
      checkExpr: "(2*20/10)^0.5",
      fmt: seconds,
      solution: {
        en: "Vertically the ball starts from rest, so 20 = ½ × 10 × t² gives t² = 4 and t = 2 s. The 15 m/s is horizontal and cannot affect the fall — a ball simply dropped from the same cliff also takes 2 s. (1.33 is 20/15, mixing the two axes together, which is exactly what the independence principle forbids.)",
        hi: "ऊर्ध्वाधर रूप से गेंद विराम से शुरू होती है, अतः 20 = ½ × 10 × t² से t² = 4 और t = 2 s. 15 m/s क्षैतिज है और पतन को प्रभावित नहीं कर सकता — उसी चट्टान से बस गिराई गई गेंद भी 2 s लेती है। (1.33 = 20/15 है, जो दोनों अक्षों को मिला देता है, ठीक वही जो स्वतंत्रता का सिद्धांत मना करता है।)",
        mr: "उभ्या दिशेने चेंडू स्थिरावस्थेतून सुरू होतो, म्हणून 20 = ½ × 10 × t² वरून t² = 4 आणि t = 2 s. 15 m/s आडवा आहे आणि पतनावर परिणाम करू शकत नाही — त्याच कड्यावरून नुसता टाकलेला चेंडूही 2 s घेतो. (1.33 = 20/15, जे दोन्ही अक्ष एकत्र मिसळते, नेमके तेच जे स्वतंत्रतेचे तत्त्व मनाई करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "That same ball leaves the 20 m cliff horizontally at 15 m/s and lands 2 s later. How far from the foot of the cliff does it land?",
        hi: "वही गेंद 20 m ऊँची चट्टान से 15 m/s की क्षैतिज चाल से निकलती है और 2 s बाद गिरती है। वह चट्टान के पाद से कितनी दूर गिरती है?",
        mr: "तोच चेंडू 20 m उंच कड्यावरून 15 m/s च्या आडव्या चालीने निघतो आणि 2 s नंतर पडतो. तो कड्याच्या पायथ्यापासून किती अंतरावर पडतो?",
      },
      answer: 30,
      wrong: [20, 15, 45],
      checkExpr: "15*2",
      fmt: metres,
      solution: {
        en: "Horizontally nothing accelerates the ball, so it keeps 15 m/s throughout: x = 15 × 2 = 30 m. (45 uses ½at² on an axis with no acceleration at all, and 20 quotes the cliff height instead of a horizontal distance.)",
        hi: "क्षैतिज रूप से कुछ भी गेंद को त्वरित नहीं करता, अतः वह पूरे समय 15 m/s रखती है: x = 15 × 2 = 30 m. (45 उस अक्ष पर ½at² लगाता है जिस पर त्वरण है ही नहीं, और 20 क्षैतिज दूरी के बजाय चट्टान की ऊँचाई बता देता है।)",
        mr: "आडव्या दिशेने चेंडूला काहीही त्वरित करत नाही, म्हणून तो पूर्ण काळ 15 m/s राखतो: x = 15 × 2 = 30 m. (45 हे त्वरणच नसलेल्या अक्षावर ½at² लावते, आणि 20 आडव्या अंतराऐवजी कड्याची उंची सांगते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A stone tied to a string moves in a circle of radius 2 m at a steady speed of 4 m/s. What is its centripetal acceleration?",
        hi: "डोरी से बँधा पत्थर 2 m त्रिज्या के वृत्त पर 4 m/s की स्थिर चाल से घूमता है। उसका अभिकेंद्र त्वरण क्या है?",
        mr: "दोरीला बांधलेला दगड 2 m त्रिज्येच्या वर्तुळावर 4 m/s च्या स्थिर चालीने फिरतो. त्याचे अभिकेंद्री त्वरण किती?",
      },
      answer: 8,
      wrong: [2, 4, 16],
      checkExpr: "4^2/2",
      solution: {
        en: "a = v²/r = 16/2 = 8 m/s², directed at the centre. The speed is constant and the acceleration is not zero, because the direction is changing every instant. (2 is v/r with the square forgotten, and 16 is v² with the radius forgotten.)",
        hi: "a = v²/r = 16/2 = 8 m/s², केंद्र की ओर निर्दिष्ट। चाल अचर है और त्वरण शून्य नहीं, क्योंकि दिशा हर क्षण बदल रही है। (2 v/r है जिसमें वर्ग भूला गया, और 16 v² है जिसमें त्रिज्या भूली गई।)",
        mr: "a = v²/r = 16/2 = 8 m/s², केंद्राकडे निर्देशित. चाल अचल आहे आणि त्वरण शून्य नाही, कारण दिशा प्रत्येक क्षणी बदलत आहे. (2 हे v/r ज्यात वर्ग विसरला, आणि 16 हे v² ज्यात त्रिज्या विसरली.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A boat that can row at 4 m/s heads straight across a river 60 m wide, which flows at 3 m/s. How far downstream does it land from the point directly opposite its start?",
        hi: "4 m/s चला सकने वाली नाव 60 m चौड़ी नदी के आर-पार सीधे जाती है, जो 3 m/s से बहती है। वह आरंभ-बिंदु के ठीक सामने वाले बिंदु से कितनी दूर बहाव में जाकर लगती है?",
        mr: "4 m/s ने वल्हवू शकणारी नाव 60 m रुंद नदी सरळ ओलांडते, जी 3 m/s ने वाहते. ती सुरुवातीच्या बिंदूच्या नेमक्या समोरच्या बिंदूपासून किती अंतरावर प्रवाहाच्या दिशेने लागते?",
      },
      answer: 45,
      wrong: [12, 15, 80],
      checkExpr: "3*60/4",
      fmt: metres,
      solution: {
        en: "The two motions are independent. Across the river the boat does 4 m/s, so the crossing takes 60/4 = 15 s — the current does not delay it at all, because the current has no across-stream component. During those 15 s the current carries the boat 3 × 15 = 45 m downstream. (12 is 60 divided by the resultant speed of 5, which wrongly lets the current help with the crossing; 15 is the crossing time in seconds, not a distance.)",
        hi: "दोनों गतियाँ स्वतंत्र हैं। नदी के आर-पार नाव 4 m/s चलती है, अतः पार करने में 60/4 = 15 s लगते हैं — धारा उसे बिलकुल नहीं रोकती, क्योंकि धारा का आर-पार वाला कोई घटक है ही नहीं। उन 15 s में धारा नाव को 3 × 15 = 45 m बहाव में ले जाती है। (12 = 60 बटा परिणामी चाल 5 है, जो ग़लत ढंग से धारा को पार कराने में मदद करने देता है; 15 सेकंड में पार करने का समय है, दूरी नहीं।)",
        mr: "दोन्ही गती स्वतंत्र आहेत. नदी ओलांडताना नाव 4 m/s ने जाते, म्हणून ओलांडायला 60/4 = 15 s लागतात — प्रवाह तिला मुळीच अडवत नाही, कारण प्रवाहाला आडवा घटकच नाही. त्या 15 s मध्ये प्रवाह नावेला 3 × 15 = 45 m खाली नेतो. (12 = 60 भागिले परिणामी चाल 5, जे चुकीच्या पद्धतीने प्रवाहाला ओलांडण्यात मदत करू देते; 15 हा सेकंदांतील ओलांडण्याचा काळ, अंतर नव्हे.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Two balls are thrown with the same speed, one at 30° and one at 60°. Taking sin²30° = 0.25 and sin²60° = 0.75, by what factor is the 60° ball's maximum height greater than the 30° ball's?",
        hi: "समान चाल से दो गेंदें फेंकी जाती हैं, एक 30° पर और एक 60° पर। sin²30° = 0.25 और sin²60° = 0.75 लेते हुए, 60° वाली गेंद की अधिकतम ऊँचाई 30° वाली से कितने गुना अधिक है?",
        mr: "समान चालीने दोन चेंडू फेकले जातात, एक 30° वर आणि एक 60° वर. sin²30° = 0.25 आणि sin²60° = 0.75 घेतल्यास, 60° च्या चेंडूची कमाल उंची 30° च्या चेंडूहून किती पट अधिक?",
      },
      answer: 3,
      wrong: [1, 2, 9],
      checkExpr: "0.75/0.25",
      solution: {
        en: "Maximum height is u² sin²θ/(2g), so with the same u the ratio is sin²60°/sin²30° = 0.75/0.25 = 3. The 60° ball climbs three times as high. Note that the two balls nevertheless land at the same spot, because the range depends on sin 2θ and sin 120° = sin 60°, so the angles are complementary in range while being very unequal in height and in time of flight. (1 is the trap: equal ranges tempt a student into equal trajectories, but only the landing point matches.)",
        hi: "अधिकतम ऊँचाई u² sin²θ/(2g) है, अतः समान u पर अनुपात sin²60°/sin²30° = 0.75/0.25 = 3. 60° वाली गेंद तीन गुना ऊँची चढ़ती है। ध्यान दो फिर भी दोनों गेंदें एक ही स्थान पर गिरती हैं, क्योंकि परास sin 2θ पर निर्भर है और sin 120° = sin 60°, अतः कोण परास में पूरक हैं जबकि ऊँचाई और उड्डयन-काल में बहुत असमान। (1 वही जाल है: बराबर परास छात्र को बराबर प्रक्षेप-पथ मान लेने को ललचाती है, पर मेल केवल गिरने के बिंदु का है।)",
        mr: "कमाल उंची u² sin²θ/(2g), म्हणून समान u वर गुणोत्तर sin²60°/sin²30° = 0.75/0.25 = 3. 60° चा चेंडू तिप्पट उंच चढतो. लक्षात घ्या तरीही दोन्ही चेंडू एकाच जागी पडतात, कारण पल्ला sin 2θ वर अवलंबून आणि sin 120° = sin 60°, म्हणून कोन पल्ल्यात पूरक तर उंची व उड्डाणकाळात फार असमान. (1 हाच सापळा: समान पल्ला विद्यार्थ्याला समान मार्ग मानायला मोहवतो, पण जुळते फक्त पडण्याचे ठिकाण.)",
      },
    },
  ],
  "physics-11-laws-of-motion": [
    {
      level: 1,
      stem: {
        en: "A net force of 20 N acts on a body of mass 5 kg. What is its acceleration?",
        hi: "5 kg द्रव्यमान के पिंड पर 20 N का परिणामी बल लगता है। उसका त्वरण क्या है?",
        mr: "5 kg वस्तुमानाच्या पिंडावर 20 N चे परिणामी बल लागते. त्याचे त्वरण किती?",
      },
      answer: 4,
      wrong: [0.25, 100, 25],
      checkExpr: "20/5",
      solution: {
        en: "From F = ma, a = F/m = 20/5 = 4 m/s². (0.25 inverts the division, 100 multiplies force by mass, and 25 adds them — three arrangements of the same two numbers, only one of which has the units of an acceleration.)",
        hi: "F = ma से, a = F/m = 20/5 = 4 m/s². (0.25 भाग उलट देता है, 100 बल को द्रव्यमान से गुणा करता है, और 25 उन्हें जोड़ देता है — उन्हीं दो संख्याओं की तीन व्यवस्थाएँ, जिनमें से केवल एक के मात्रक त्वरण के हैं।)",
        mr: "F = ma वरून, a = F/m = 20/5 = 4 m/s². (0.25 भागाकार उलटा करते, 100 बलाला वस्तुमानाने गुणते, आणि 25 त्यांना जोडते — त्याच दोन संख्यांच्या तीन मांडण्या, ज्यांपैकी केवळ एकाची एकके त्वरणाची आहेत.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A body of mass 12 kg rests on a level floor, with g taken as 10 m/s². What is the normal force the floor exerts on it?",
        hi: "12 kg द्रव्यमान का पिंड समतल फ़र्श पर रखा है, g = 10 m/s² लेते हुए। फ़र्श उस पर कितना अभिलंब बल लगाता है?",
        mr: "12 kg वस्तुमानाचा पिंड सपाट जमिनीवर ठेवला आहे, g = 10 m/s² घेऊन. जमीन त्याच्यावर किती लंब बल लावते?",
      },
      answer: 120,
      wrong: [12, 1.2, 22],
      checkExpr: "12*10",
      fmt: newtons,
      solution: {
        en: "The body is not accelerating vertically, so the normal force balances the weight: N = mg = 12 × 10 = 120 N. Note that N and the weight act on the SAME body and are therefore not a third-law pair, however equal they look. (12 quotes the mass as though it were a force.)",
        hi: "पिंड ऊर्ध्वाधर रूप से त्वरित नहीं हो रहा, अतः अभिलंब बल भार को संतुलित करता है: N = mg = 12 × 10 = 120 N. ध्यान दो N और भार एक ही पिंड पर लगते हैं और इसलिए तीसरे नियम की जोड़ी नहीं, चाहे वे कितने ही बराबर दिखें। (12 द्रव्यमान को ऐसे बताता है मानो वह बल हो।)",
        mr: "पिंड उभ्या दिशेने त्वरित होत नाही, म्हणून लंब बल वजन संतुलित करते: N = mg = 12 × 10 = 120 N. लक्षात घ्या N आणि वजन एकाच पिंडावर लागतात आणि म्हणून तिसऱ्या नियमाची जोडी नाहीत, ती कितीही समान दिसोत. (12 वस्तुमान असे सांगते जणू ते बल असावे.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A ball of mass 2 kg has its velocity changed from 3 m/s to 8 m/s in the same direction. What is the magnitude of the change in its momentum?",
        hi: "2 kg द्रव्यमान की गेंद का वेग उसी दिशा में 3 m/s से बदलकर 8 m/s हो जाता है। उसके संवेग-परिवर्तन का परिमाण क्या है?",
        mr: "2 kg वस्तुमानाच्या चेंडूचा वेग त्याच दिशेत 3 m/s वरून 8 m/s होतो. त्याच्या संवेगातील बदलाचे परिमाण किती?",
      },
      answer: 10,
      wrong: [5, 16, 22],
      checkExpr: "2*(8-3)",
      solution: {
        en: "Change in momentum is m(v − u) = 2 × (8 − 3) = 10 kg m/s. (5 gives the change in velocity and forgets the mass, 16 is the final momentum alone, and 22 adds the two momenta instead of subtracting.)",
        hi: "संवेग-परिवर्तन m(v − u) = 2 × (8 − 3) = 10 kg m/s. (5 वेग-परिवर्तन देता है और द्रव्यमान भूल जाता है, 16 केवल अंतिम संवेग है, और 22 घटाने के बजाय दोनों संवेग जोड़ देता है।)",
        mr: "संवेगातील बदल m(v − u) = 2 × (8 − 3) = 10 kg m/s. (5 वेगातील बदल देते आणि वस्तुमान विसरते, 16 फक्त अंतिम संवेग, आणि 22 वजा करण्याऐवजी दोन्ही संवेग जोडते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A cricket ball of mass 0.15 kg arrives at 20 m/s and is brought to rest in 0.1 s. What average force does the fielder's hands exert?",
        hi: "0.15 kg द्रव्यमान की क्रिकेट गेंद 20 m/s से आती है और 0.1 s में विराम में लाई जाती है। क्षेत्ररक्षक के हाथ कितना औसत बल लगाते हैं?",
        mr: "0.15 kg वस्तुमानाचा क्रिकेट चेंडू 20 m/s ने येतो आणि 0.1 s मध्ये स्थिर केला जातो. क्षेत्ररक्षकाचे हात किती सरासरी बल लावतात?",
      },
      answer: 30,
      wrong: [3, 300, 0.3],
      checkExpr: "0.15*20/0.1",
      fmt: newtons,
      solution: {
        en: "Impulse equals the change in momentum, so F = Δp/Δt = (0.15 × 20)/0.1 = 3/0.1 = 30 N. Drawing the hands back to stretch the stop to 0.3 s would cut the force to 10 N, which is exactly why fielders do it. (300 divides by 0.01 and 3 forgets to divide by the time at all.)",
        hi: "आवेग संवेग-परिवर्तन के बराबर है, अतः F = Δp/Δt = (0.15 × 20)/0.1 = 3/0.1 = 30 N. हाथ पीछे खींचकर रुकावट को 0.3 s तक बढ़ाने से बल घटकर 10 N रह जाता, और ठीक इसीलिए क्षेत्ररक्षक ऐसा करते हैं। (300 0.01 से भाग देता है और 3 समय से भाग देना ही भूल जाता है।)",
        mr: "आवेग संवेगातील बदलाइतका, म्हणून F = Δp/Δt = (0.15 × 20)/0.1 = 3/0.1 = 30 N. हात मागे खेचून थांबवणे 0.3 s पर्यंत ताणल्यास बल 10 N वर आले असते, आणि नेमके म्हणूनच क्षेत्ररक्षक तसे करतात. (300 हे 0.01 ने भागते आणि 3 काळाने भागायचेच विसरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A 10 kg block rests on a floor with a coefficient of static friction of 0.4, and g is 10 m/s². What is the least horizontal force needed to start it moving?",
        hi: "10 kg का गुटका उस फ़र्श पर रखा है जिसका स्थैतिक घर्षण गुणांक 0.4 है, और g = 10 m/s². उसे चलाना शुरू करने के लिए कम से कम कितना क्षैतिज बल चाहिए?",
        mr: "10 kg चा ठोकळा अशा जमिनीवर आहे जिचा स्थितिक घर्षण गुणांक 0.4 आहे, आणि g = 10 m/s². तो हलवायला सुरुवात करण्यासाठी किमान किती आडवे बल लागेल?",
      },
      answer: 40,
      wrong: [4, 100, 400],
      checkExpr: "0.4*10*10",
      fmt: newtons,
      solution: {
        en: "The normal force is mg = 100 N, so the maximum static friction is μₛN = 0.4 × 100 = 40 N. Any push above 40 N starts the block. (4 forgets g, 100 quotes the normal force itself, and 400 multiplies by g twice.)",
        hi: "अभिलंब बल mg = 100 N है, अतः अधिकतम स्थैतिक घर्षण μₛN = 0.4 × 100 = 40 N. 40 N से अधिक कोई भी धक्का गुटके को चला देता है। (4 g भूल जाता है, 100 स्वयं अभिलंब बल बता देता है, और 400 g से दो बार गुणा कर देता है।)",
        mr: "लंब बल mg = 100 N, म्हणून कमाल स्थितिक घर्षण μₛN = 0.4 × 100 = 40 N. 40 N हून अधिक कोणताही रेटा ठोकळा हलवतो. (4 हे g विसरते, 100 स्वतः लंब बल सांगते, आणि 400 हे g ने दोनदा गुणते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A person of mass 50 kg stands on a weighing scale in a lift accelerating upwards at 2 m/s², with g = 10 m/s². What force does the scale read?",
        hi: "50 kg द्रव्यमान का व्यक्ति उस लिफ़्ट में तराज़ू पर खड़ा है जो 2 m/s² से ऊपर की ओर त्वरित हो रही है, g = 10 m/s² के साथ। तराज़ू कितना बल दिखाता है?",
        mr: "50 kg वस्तुमानाची व्यक्ती अशा लिफ्टमध्ये वजनकाट्यावर उभी आहे जी 2 m/s² ने वर त्वरित होत आहे, g = 10 m/s² सह. काटा किती बल दाखवतो?",
      },
      answer: 600,
      wrong: [500, 400, 100],
      checkExpr: "50*(10+2)",
      fmt: newtons,
      solution: {
        en: "The scale reads the normal force. Taking upwards as positive, N − mg = ma, so N = m(g + a) = 50 × 12 = 600 N. The person's mass has not changed; what has changed is the force the floor must exert. (500 is the stationary reading and 400 is the answer for a lift accelerating downwards.)",
        hi: "तराज़ू अभिलंब बल दिखाता है। ऊपर को धनात्मक लेते हुए, N − mg = ma, अतः N = m(g + a) = 50 × 12 = 600 N. व्यक्ति का द्रव्यमान नहीं बदला; बदला वह बल है जो फ़र्श को लगाना पड़ता है। (500 स्थिर लिफ़्ट का पाठ्यांक है और 400 नीचे की ओर त्वरित लिफ़्ट का उत्तर।)",
        mr: "काटा लंब बल दाखवतो. वर धन घेतल्यास, N − mg = ma, म्हणून N = m(g + a) = 50 × 12 = 600 N. व्यक्तीचे वस्तुमान बदललेले नाही; बदलले ते बल जे जमिनीला लावावे लागते. (500 हे स्थिर लिफ्टचे वाचन आणि 400 हे खाली त्वरित होणाऱ्या लिफ्टचे उत्तर.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Two blocks of 3 kg and 2 kg lie in contact on a frictionless floor and are pushed by a 10 N force applied to the 3 kg block. What is the acceleration of the pair?",
        hi: "3 kg और 2 kg के दो गुटके घर्षण-रहित फ़र्श पर एक-दूसरे से सटे रखे हैं और 3 kg वाले गुटके पर 10 N का बल लगाकर धकेले जाते हैं। जोड़ी का त्वरण क्या है?",
        mr: "3 kg आणि 2 kg चे दोन ठोकळे घर्षणविरहित जमिनीवर एकमेकांना लागून आहेत आणि 3 kg च्या ठोकळ्यावर 10 N बल लावून ढकलले जातात. जोडीचे त्वरण किती?",
      },
      answer: 2,
      wrong: [3.33, 5, 1],
      checkExpr: "10/(3+2)",
      solution: {
        en: "Treat the two as one body of 5 kg, since they move together: a = 10/5 = 2 m/s². The contact force between them is internal to this system and drops out of the sum. (3.33 uses only the pushed block's mass and 5 uses only the other's.)",
        hi: "दोनों को 5 kg का एक ही पिंड मानो, क्योंकि वे साथ चलते हैं: a = 10/5 = 2 m/s². उनके बीच का संपर्क बल इस तंत्र के लिए भीतरी है और योग से निकल जाता है। (3.33 केवल धकेले गए गुटके का द्रव्यमान लेता है और 5 केवल दूसरे का।)",
        mr: "दोघांना 5 kg चा एकच पिंड माना, कारण ते एकत्र जातात: a = 10/5 = 2 m/s². त्यांच्यातले स्पर्श बल या प्रणालीसाठी आतले आहे आणि बेरजेतून निघून जाते. (3.33 फक्त ढकललेल्या ठोकळ्याचे वस्तुमान घेते आणि 5 फक्त दुसऱ्याचे.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "In that same pair of blocks — 3 kg pushed by 10 N against a 2 kg block on a frictionless floor — what is the contact force between them?",
        hi: "उसी गुटका-जोड़ी में — घर्षण-रहित फ़र्श पर 2 kg के गुटके से सटे 3 kg वाले पर 10 N का धक्का — उनके बीच संपर्क बल क्या है?",
        mr: "त्याच ठोकळ्यांच्या जोडीत — घर्षणविरहित जमिनीवर 2 kg च्या ठोकळ्याला लागून असलेल्या 3 kg वर 10 N चा रेटा — त्यांच्यातले स्पर्श बल किती?",
      },
      answer: 4,
      wrong: [6, 10, 2],
      checkExpr: "2*10/(3+2)",
      fmt: newtons,
      solution: {
        en: "Draw the 2 kg block alone. The only horizontal force on it is the contact push from its neighbour, and it accelerates at the common 2 m/s², so F = 2 × 2 = 4 N. Checking from the other side, the 3 kg block has 10 N forward and 4 N back from the reaction, giving 6/3 = 2 m/s², which agrees. (6 is the net force on the 3 kg block, not the contact force, and 10 forgets that the pushed block keeps some of the force for itself.)",
        hi: "अकेला 2 kg का गुटका खींचो। उस पर एकमात्र क्षैतिज बल पड़ोसी का संपर्क धक्का है, और वह साझा 2 m/s² से त्वरित होता है, अतः F = 2 × 2 = 4 N. दूसरी ओर से जाँचो: 3 kg वाले पर 10 N आगे और प्रतिक्रिया से 4 N पीछे, जिससे 6/3 = 2 m/s², जो मेल खाता है। (6 3 kg वाले पर परिणामी बल है, संपर्क बल नहीं, और 10 भूल जाता है कि धकेला गया गुटका बल का कुछ हिस्सा अपने पास रखता है।)",
        mr: "एकटा 2 kg चा ठोकळा काढा. त्याच्यावरचे एकमेव आडवे बल म्हणजे शेजाऱ्याचा स्पर्श-रेटा, आणि तो सामायिक 2 m/s² ने त्वरित होतो, म्हणून F = 2 × 2 = 4 N. दुसऱ्या बाजूने तपासा: 3 kg वर 10 N पुढे आणि प्रतिक्रियेने 4 N मागे, ज्यातून 6/3 = 2 m/s², जे जुळते. (6 हे 3 kg वरचे परिणामी बल, स्पर्श बल नव्हे, आणि 10 विसरते की ढकललेला ठोकळा बलाचा काही भाग स्वतःकडे ठेवतो.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A car takes an unbanked circular bend of radius 20 m where the coefficient of friction is 0.5, with g = 10 m/s². What is the greatest speed at which it can round the bend?",
        hi: "एक कार 20 m त्रिज्या का बिना बंकन वाला वृत्तीय मोड़ लेती है जहाँ घर्षण गुणांक 0.5 है, g = 10 m/s² के साथ। वह अधिकतम किस चाल से मोड़ ले सकती है?",
        mr: "एक कार 20 m त्रिज्येचे न कललेले वर्तुळाकार वळण घेते जिथे घर्षण गुणांक 0.5 आहे, g = 10 m/s² सह. ती जास्तीत जास्त कोणत्या चालीने वळण घेऊ शकते?",
      },
      answer: 10,
      wrong: [100, 5, 20],
      checkExpr: "(0.5*10*20)^0.5",
      fmt: ms,
      solution: {
        en: "Friction must supply the whole centripetal force, so at the limit μmg = mv²/r. The mass cancels — a lorry and a scooter have the same limit — leaving v = √(μgr) = √(0.5 × 10 × 20) = √100 = 10 m/s. (100 is v² and forgets the square root, and 5 halves the answer instead of rooting it.)",
        hi: "घर्षण को पूरा अभिकेंद्र बल देना है, अतः सीमा पर μmg = mv²/r. द्रव्यमान कट जाता है — लॉरी और स्कूटर की सीमा एक ही है — और बचता है v = √(μgr) = √(0.5 × 10 × 20) = √100 = 10 m/s. (100 v² है और वर्गमूल भूल जाता है, और 5 मूल लेने के बजाय आधा कर देता है।)",
        mr: "घर्षणाला पूर्ण अभिकेंद्री बल पुरवावे लागते, म्हणून मर्यादेवर μmg = mv²/r. वस्तुमान कापले जाते — ट्रक आणि स्कूटरची मर्यादा एकच — आणि उरते v = √(μgr) = √(0.5 × 10 × 20) = √100 = 10 m/s. (100 हे v² आणि वर्गमूळ विसरते, आणि 5 मूळ घेण्याऐवजी निम्मे करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A machine gun fires 10 bullets per second, each of mass 50 g, at a muzzle speed of 500 m/s. What force must be applied to the gun to hold it steady?",
        hi: "एक मशीनगन प्रति सेकंड 10 गोलियाँ दागती है, हर एक 50 g की, 500 m/s की नाल-चाल से। बंदूक को स्थिर थामे रखने के लिए कितना बल लगाना होगा?",
        mr: "एक मशीनगन दर सेकंदाला 10 गोळ्या झाडते, प्रत्येक 50 g ची, 500 m/s च्या नळी-चालीने. बंदूक स्थिर धरून ठेवण्यासाठी किती बल लावावे लागेल?",
      },
      answer: 250,
      wrong: [25, 500, 2500],
      checkExpr: "10*0.05*500",
      fmt: newtons,
      solution: {
        en: "Force is the rate of change of momentum, which is the form to reach for whenever mass is leaving a system. Each bullet carries away 0.05 × 500 = 25 kg m/s, and ten leave every second, so momentum is being given to the bullets at 250 kg m/s per second. By the third law the bullets push back on the gun at the same rate, so 250 N must be applied to hold it. Note what the calculation never needed: the force during any single shot, which is enormous and lasts a fraction of a millisecond. Averaging over the second is what makes the question answerable at all. (25 is the momentum of one bullet, 2500 slips a factor of ten, and 500 quotes the muzzle speed as though it were a force.)",
        hi: "बल संवेग-परिवर्तन की दर है, और जब भी द्रव्यमान तंत्र से निकल रहा हो यही रूप उठाना चाहिए। हर गोली 0.05 × 500 = 25 kg m/s ले जाती है, और हर सेकंड दस निकलती हैं, अतः गोलियों को संवेग 250 kg m/s प्रति सेकंड की दर से दिया जा रहा है। तीसरे नियम से गोलियाँ बंदूक पर उसी दर से पीछे धकेलती हैं, अतः थामे रखने को 250 N लगाना होगा। ध्यान दो गणना को कभी क्या नहीं चाहिए था: किसी एक शॉट का बल, जो विशाल है और मिलीसेकंड के अंश भर चलता है। सेकंड भर का औसत लेना ही प्रश्न को उत्तर-योग्य बनाता है। (25 एक गोली का संवेग है, 2500 में दस का गुणक खिसक जाता है, और 500 नाल-चाल को ऐसे बताता है मानो वह बल हो।)",
        mr: "बल म्हणजे संवेगबदलाचा दर, आणि जेव्हा वस्तुमान प्रणालीतून बाहेर जात असते तेव्हा हेच रूप उचलावे. प्रत्येक गोळी 0.05 × 500 = 25 kg m/s घेऊन जाते, आणि दर सेकंदाला दहा निघतात, म्हणून गोळ्यांना संवेग 250 kg m/s प्रति सेकंद या दराने दिला जात आहे. तिसऱ्या नियमाने गोळ्या बंदुकीवर त्याच दराने मागे रेटतात, म्हणून धरून ठेवायला 250 N लावावे लागेल. लक्षात घ्या गणनेला काय कधीच लागले नाही: कोणत्याही एका गोळीच्या वेळचे बल, जे प्रचंड आहे आणि मिलिसेकंदाचा अंशभर टिकते. सेकंदभराची सरासरी घेणेच प्रश्नाला उत्तरयोग्य बनवते. (25 हा एका गोळीचा संवेग, 2500 मध्ये दहाचा गुणक सरकतो, आणि 500 नळी-चाल अशी सांगते जणू ते बल असावे.)",
      },
    },
  ],
  /*N*/
};
