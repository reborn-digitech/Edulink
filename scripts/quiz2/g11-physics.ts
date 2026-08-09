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

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Work, Energy and Power                                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-work-energy-and-power",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 5 — Work, Energy and Power",
      hi: "अध्याय 5 — कार्य, ऊर्जा और शक्ति",
      mr: "प्रकरण 5 — कार्य, ऊर्जा आणि शक्ती",
    },
    name: {
      en: "Work, Energy and Power",
      hi: "कार्य, ऊर्जा और शक्ति",
      mr: "कार्य, ऊर्जा आणि शक्ती",
    },
    summary: {
      en: "A word borrowed from ordinary speech and then given a definition that refuses most of what the word usually means: a porter who carries a load along a platform does no work at all, a force that returns everything it took can be given a bank account and a force that does not cannot, energy is conserved in every collision while kinetic energy is not, and the whole apparatus exists because integrating a force over distance is easier than solving the motion.",
      hi: "साधारण बोलचाल से उधार लिया एक शब्द, जिसे फिर ऐसी परिभाषा दी गई जो उस शब्द के अधिकांश सामान्य अर्थ को नकारती है: प्लेटफ़ॉर्म पर बोझ ढोता कुली कोई कार्य नहीं करता, जो बल सब कुछ लौटा देता है उसे बहीखाता दिया जा सकता है और जो नहीं लौटाता उसे नहीं, हर टक्कर में ऊर्जा संरक्षित रहती है जबकि गतिज ऊर्जा नहीं, और यह पूरा तंत्र इसीलिए है कि दूरी पर बल का समाकलन करना गति हल करने से आसान है।",
      mr: "सामान्य बोलण्यातून उसना घेतलेला एक शब्द, ज्याला मग अशी व्याख्या दिली जी त्या शब्दाचा बहुतांश नेहमीचा अर्थ नाकारते: फलाटावर ओझे वाहणारा हमाल कोणतेही कार्य करत नाही, जे बल सर्व परत करते त्याला वहीखाते देता येते आणि जे करत नाही त्याला नाही, प्रत्येक टक्करीत ऊर्जा संरक्षित राहते तर गतिज ऊर्जा नाही, आणि हा सगळा डोलारा यासाठीच की अंतरावर बलाचे समाकलन करणे गती सोडवण्याहून सोपे आहे.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "cosine-in-work",
        name: {
          en: "The cosine in the work formula",
          hi: "कार्य-सूत्र की कोज्या",
          mr: "कार्य-सूत्रातील कोसाइन",
        },
        kind: "definition",
        prompt: {
          en: "A porter walking a level platform with a trunk on his head exerts a large upward force and moves horizontally, and because the angle between them is a right angle the product is zero however tired he becomes. Which factor is responsible?",
          hi: "सिर पर संदूक लिए समतल प्लेटफ़ॉर्म पर चलता कुली बड़ा ऊर्ध्वमुखी बल लगाता है और क्षैतिज चलता है, और चूँकि उनके बीच का कोण समकोण है, गुणनफल शून्य रहता है चाहे वह कितना ही थक जाए। इसके लिए कौन-सा गुणक ज़िम्मेदार है?",
          mr: "डोक्यावर पेटी घेऊन सपाट फलाटावर चालणारा हमाल मोठे वरचे बल लावतो आणि आडवा चालतो, आणि त्यांच्यातील कोन काटकोन असल्याने गुणाकार शून्य राहतो, तो कितीही थकला तरी. यासाठी कोणता गुणक जबाबदार?",
        },
        statement: {
          en: "Work is force times displacement times the cosine of the angle between them, so a force perpendicular to the motion does no work at all and a force opposing it does negative work.",
          hi: "कार्य बल गुणा विस्थापन गुणा उनके बीच के कोण की कोज्या है, अतः गति के लंबवत बल कोई कार्य नहीं करता और उसका विरोध करने वाला बल ऋणात्मक कार्य करता है।",
          mr: "कार्य म्हणजे बल गुणिले विस्थापन गुणिले त्यांच्यातील कोनाचा कोसाइन, म्हणून गतीला लंब असलेले बल कोणतेही कार्य करत नाही आणि तिला विरोध करणारे बल ऋण कार्य करते.",
        },
        detail: {
          en: "This is why the centripetal force in circular motion never changes the speed, and why the normal force on a sliding block appears in no energy equation.",
          hi: "इसीलिए वृत्तीय गति में अभिकेंद्र बल चाल कभी नहीं बदलता, और इसीलिए फिसलते गुटके पर लगा अभिलंब बल किसी ऊर्जा-समीकरण में नहीं आता।",
          mr: "म्हणूनच वर्तुळाकार गतीतले अभिकेंद्री बल चाल कधीही बदलत नाही, आणि म्हणूनच घसरणाऱ्या ठोकळ्यावरचे लंब बल कोणत्याही ऊर्जा-समीकरणात येत नाही.",
        },
        extra: {
          en: "The everyday sense of work is about effort and fatigue, and the physical sense is about displacement, so a man holding a weight motionless above his head is exhausted and has done nothing.",
          hi: "काम का रोज़मर्रा अर्थ श्रम और थकान का है, और भौतिक अर्थ विस्थापन का, अतः सिर के ऊपर बोझ स्थिर थामे व्यक्ति थक चुका है और उसने कुछ नहीं किया।",
          mr: "कामाचा रोजचा अर्थ श्रम आणि थकव्याचा, आणि भौतिक अर्थ विस्थापनाचा, म्हणून डोक्यावर ओझे स्थिर धरलेला माणूस थकलेला असतो आणि त्याने काहीही केलेले नसते.",
        },
        pair: {
          left: {
            en: "Exhausted, and by definition idle",
            hi: "थका हुआ, और परिभाषा से निष्क्रिय",
            mr: "थकलेला, आणि व्याख्येने निष्क्रिय",
          },
          right: {
            en: "the cosine in the work formula",
            hi: "कार्य-सूत्र की कोज्या",
            mr: "कार्य-सूत्रातील कोसाइन",
          },
        },
      },
      {
        id: "work-energy-theorem",
        name: {
          en: "The work–energy theorem",
          hi: "कार्य-ऊर्जा प्रमेय",
          mr: "कार्य-ऊर्जा प्रमेय",
        },
        kind: "definition",
        prompt: {
          en: "Whatever the forces are and however complicated their variation, their total contribution over a path equals the change in ½mv² between the ends, which converts a hard problem in dynamics into a subtraction. Which result is this?",
          hi: "बल चाहे जो हों और उनका परिवर्तन कितना ही जटिल, किसी पथ पर उनका कुल योगदान सिरों के बीच ½mv² के परिवर्तन के बराबर होता है, जो गतिकी के कठिन प्रश्न को घटाव में बदल देता है। यह कौन-सा परिणाम है?",
          mr: "बले कोणतीही असोत आणि त्यांचा बदल कितीही गुंतागुंतीचा असो, एखाद्या मार्गावरील त्यांचा एकूण वाटा टोकांमधील ½mv² च्या बदलाइतका असतो, जे गतिकीतील कठीण प्रश्न वजाबाकीत बदलते. हा कोणता निकाल?",
        },
        statement: {
          en: "The work–energy theorem states that the net work done by all forces on a body equals its change in kinetic energy, and it holds whether the forces are constant, varying, conservative or not.",
          hi: "कार्य-ऊर्जा प्रमेय कहता है कि किसी पिंड पर सब बलों द्वारा किया गया कुल कार्य उसकी गतिज ऊर्जा के परिवर्तन के बराबर है, और यह तब भी चलता है जब बल अचर हों, बदलते हों, संरक्षी हों या न हों।",
          mr: "कार्य-ऊर्जा प्रमेय सांगते की एखाद्या पिंडावर सर्व बलांनी केलेले एकूण कार्य त्याच्या गतिज ऊर्जेतील बदलाइतके असते, आणि हे बले अचल असोत, बदलती असोत, संरक्षी असोत वा नसोत, तरीही चालते.",
        },
        detail: {
          en: "It says nothing about how long the process took or what path was followed, which is exactly why it can answer questions where the force is unknown at every individual instant.",
          hi: "यह इस बारे में कुछ नहीं कहता कि प्रक्रिया में कितना समय लगा या कौन-सा पथ लिया गया, और ठीक इसीलिए यह ऐसे प्रश्नों का उत्तर दे सकता है जहाँ हर अलग क्षण का बल अज्ञात हो।",
          mr: "ते प्रक्रियेला किती वेळ लागला वा कोणता मार्ग घेतला याबद्दल काहीही सांगत नाही, आणि नेमके म्हणूनच ते अशा प्रश्नांची उत्तरे देऊ शकते जिथे प्रत्येक स्वतंत्र क्षणीचे बल अज्ञात असते.",
        },
        extra: {
          en: "For a varying force the work is the area under the force–displacement graph, which is how the energy stored in a stretched spring comes out as ½kx² rather than kx².",
          hi: "बदलते बल के लिए कार्य बल-विस्थापन आलेख के नीचे का क्षेत्रफल है, और इसी से खिंची स्प्रिंग में संचित ऊर्जा kx² नहीं बल्कि ½kx² निकलती है।",
          mr: "बदलत्या बलासाठी कार्य म्हणजे बल-विस्थापन आलेखाखालचे क्षेत्रफळ, आणि यामुळेच ताणलेल्या स्प्रिंगमधली साठलेली ऊर्जा kx² नव्हे तर ½kx² निघते.",
        },
        pair: {
          left: {
            en: "Turns a dynamics problem into a subtraction",
            hi: "गतिकी के प्रश्न को घटाव में बदल देता है",
            mr: "गतिकीचा प्रश्न वजाबाकीत बदलते",
          },
          right: {
            en: "the work–energy theorem",
            hi: "कार्य-ऊर्जा प्रमेय",
            mr: "कार्य-ऊर्जा प्रमेय",
          },
        },
      },
      {
        id: "conservative-force",
        name: {
          en: "The conservative force",
          hi: "संरक्षी बल",
          mr: "संरक्षी बल",
        },
        kind: "classification",
        prompt: {
          en: "Carry a book up the stairs or up the lift shaft or by any winding route at all: this kind of force charges exactly the same amount, and returns every joule of it when the book comes back down. Which kind is this?",
          hi: "किताब को सीढ़ी से ऊपर ले जाओ या लिफ़्ट की नाल से या किसी भी घुमावदार रास्ते से: यह क़िस्म का बल ठीक उतना ही वसूलता है, और किताब के नीचे लौटने पर उसका हर जूल लौटा देता है। यह कौन-सी क़िस्म है?",
          mr: "पुस्तक जिन्याने वर न्या वा लिफ्टच्या नळीतून वा कोणत्याही वळणदार वाटेने: या प्रकारचे बल नेमके तितकेच वसूल करते, आणि पुस्तक खाली परतल्यावर त्यातले प्रत्येक ज्यूल परत करते. हा कोणता प्रकार?",
        },
        statement: {
          en: "A conservative force does work that depends only on the endpoints and not on the path, so its work round any closed loop is zero and a potential energy can be defined for it.",
          hi: "संरक्षी बल ऐसा कार्य करता है जो केवल सिरों पर निर्भर है, पथ पर नहीं, अतः किसी भी बंद पाश पर उसका कार्य शून्य होता है और उसके लिए स्थितिज ऊर्जा परिभाषित की जा सकती है।",
          mr: "संरक्षी बल असे कार्य करते जे केवळ टोकांवर अवलंबून असते, मार्गावर नाही, म्हणून कोणत्याही बंद फेऱ्यावर त्याचे कार्य शून्य असते आणि त्यासाठी स्थितिज ऊर्जा व्याख्यायित करता येते.",
        },
        detail: {
          en: "Gravity and the spring force qualify; friction does not, because dragging a block round a loop and back to its start costs energy every centimetre of the way.",
          hi: "गुरुत्व और स्प्रिंग-बल इस कसौटी पर खरे उतरते हैं; घर्षण नहीं, क्योंकि गुटके को पाश में घुमाकर आरंभ पर लौटाने में हर सेंटीमीटर ऊर्जा ख़र्च होती है।",
          mr: "गुरुत्व आणि स्प्रिंग-बल या कसोटीवर उतरतात; घर्षण नाही, कारण ठोकळा फेऱ्यात फिरवून सुरुवातीला परत आणण्यात प्रत्येक सेंटिमीटरला ऊर्जा खर्च होते.",
        },
        extra: {
          en: "No potential energy can be written for a non-conservative force, which is why friction appears in an energy account as a loss to heat rather than as a stored quantity that could be recovered.",
          hi: "असंरक्षी बल के लिए कोई स्थितिज ऊर्जा नहीं लिखी जा सकती, इसीलिए घर्षण ऊर्जा के हिसाब में ऐसी संचित राशि के रूप में नहीं आता जो वापस मिल सके, बल्कि ऊष्मा में हुई हानि के रूप में आता है।",
          mr: "असंरक्षी बलासाठी कोणतीही स्थितिज ऊर्जा लिहिता येत नाही, म्हणूनच घर्षण ऊर्जेच्या हिशोबात परत मिळू शकणारी साठलेली राशी म्हणून येत नाही, तर उष्णतेत झालेली हानी म्हणून येते.",
        },
        pair: {
          left: {
            en: "Zero work round any closed loop",
            hi: "किसी भी बंद पाश पर शून्य कार्य",
            mr: "कोणत्याही बंद फेऱ्यावर शून्य कार्य",
          },
          right: {
            en: "the conservative force",
            hi: "संरक्षी बल",
            mr: "संरक्षी बल",
          },
        },
      },
      {
        id: "zero-of-potential-energy",
        name: {
          en: "The zero of potential energy",
          hi: "स्थितिज ऊर्जा का शून्य",
          mr: "स्थितिज ऊर्जेचे शून्य",
        },
        kind: "classification",
        prompt: {
          en: "A book on a first-floor table has one value measured from the floor, another from the ground outside, and a negative one measured from the roof — and every prediction the physics makes comes out identical. Which freedom is this?",
          hi: "पहली मंज़िल की मेज़ पर रखी किताब का एक मान फ़र्श से नापने पर, दूसरा बाहर की ज़मीन से, और छत से नापने पर ऋणात्मक — और भौतिकी जो भी भविष्यवाणी करती है वह एक-सी निकलती है। यह कौन-सी स्वतंत्रता है?",
          mr: "पहिल्या मजल्यावरील टेबलावरच्या पुस्तकाचे एक मूल्य जमिनीपासून मोजल्यास, दुसरे बाहेरच्या जमिनीपासून, आणि छतापासून मोजल्यास ऋण — आणि भौतिकी जे भाकीत करते ते सारखेच निघते. ही कोणती स्वतंत्रता?",
        },
        statement: {
          en: "Only differences in potential energy are physically meaningful, so its zero may be placed anywhere convenient, and a negative potential energy means nothing worse than a badly chosen origin.",
          hi: "भौतिक रूप से केवल स्थितिज ऊर्जा के अंतर सार्थक हैं, अतः उसका शून्य कहीं भी सुविधानुसार रखा जा सकता है, और ऋणात्मक स्थितिज ऊर्जा का अर्थ बुरी तरह चुने गए मूल-बिंदु से बुरा कुछ नहीं।",
          mr: "भौतिकदृष्ट्या केवळ स्थितिज ऊर्जेतील फरकच अर्थपूर्ण असतात, म्हणून तिचे शून्य कुठेही सोयीने ठेवता येते, आणि ऋण स्थितिज ऊर्जेचा अर्थ वाईटरीत्या निवडलेल्या आरंभबिंदूहून वाईट काहीही नाही.",
        },
        detail: {
          en: "For gravitation on the astronomical scale the zero is conventionally placed at infinite separation, which makes every bound orbit's energy negative and gives that negative sign a real meaning: escape is impossible.",
          hi: "खगोलीय पैमाने पर गुरुत्व के लिए शून्य परंपरागत रूप से अनंत दूरी पर रखा जाता है, जिससे हर बद्ध कक्षा की ऊर्जा ऋणात्मक हो जाती है और उस ऋण चिह्न का असली अर्थ मिलता है: पलायन असंभव है।",
          mr: "खगोलीय प्रमाणावर गुरुत्वासाठी शून्य परंपरेने अनंत अंतरावर ठेवले जाते, ज्यामुळे प्रत्येक बद्ध कक्षेची ऊर्जा ऋण होते आणि त्या ऋण चिन्हाला खरा अर्थ मिळतो: सुटका अशक्य आहे.",
        },
        extra: {
          en: "The choice must be kept fixed throughout a calculation, and the commonest error in energy conservation is measuring the initial height from one level and the final from another.",
          hi: "यह चुनाव पूरी गणना में स्थिर रखना पड़ता है, और ऊर्जा-संरक्षण की सबसे आम भूल आरंभिक ऊँचाई एक स्तर से और अंतिम दूसरे से नापना है।",
          mr: "ही निवड अख्ख्या गणनेत स्थिर ठेवावी लागते, आणि ऊर्जा-संरक्षणातील सर्वांत नेहमीची चूक म्हणजे सुरुवातीची उंची एका पातळीपासून आणि शेवटची दुसऱ्यापासून मोजणे.",
        },
        pair: {
          left: {
            en: "Negative only because of where the origin was put",
            hi: "ऋणात्मक केवल इसलिए कि मूल-बिंदु कहाँ रखा गया",
            mr: "ऋण केवळ यामुळे की आरंभबिंदू कुठे ठेवला",
          },
          right: {
            en: "the zero of potential energy",
            hi: "स्थितिज ऊर्जा का शून्य",
            mr: "स्थितिज ऊर्जेचे शून्य",
          },
        },
      },
      {
        id: "power-as-a-rate",
        name: {
          en: "Power as a rate",
          hi: "दर के रूप में शक्ति",
          mr: "दर म्हणून शक्ती",
        },
        kind: "definition",
        prompt: {
          en: "Two cranes lift the same girder to the same floor, one in a minute and one in an hour: the job done is identical and this quantity differs sixtyfold, because it divides by the time taken. Which quantity is this?",
          hi: "दो क्रेन वही धरन उसी मंज़िल तक उठाती हैं, एक मिनट भर में और एक घंटे में: किया गया काम एक-सा है और यह राशि साठ गुना भिन्न, क्योंकि वह लगे समय से भाग देती है। यह कौन-सी राशि है?",
          mr: "दोन क्रेन तोच तुळई त्याच मजल्यावर उचलतात, एक मिनिटात आणि एक तासात: केलेले काम सारखेच आणि ही राशी साठपट वेगळी, कारण ती लागलेल्या काळाने भागते. ही कोणती राशी?",
        },
        statement: {
          en: "Power is the rate at which work is done, equal to work divided by time or equivalently to force times velocity, and it is measured in watts rather than joules.",
          hi: "शक्ति वह दर है जिससे कार्य किया जाता है, कार्य बटा समय या समतुल्य रूप से बल गुणा वेग, और उसे जूल में नहीं वाट में नापा जाता है।",
          mr: "शक्ती म्हणजे कार्य केले जाण्याचा दर, कार्य भागिले काळ किंवा समतुल्यपणे बल गुणिले वेग, आणि ती ज्यूलमध्ये नव्हे तर वॉटमध्ये मोजली जाते.",
        },
        detail: {
          en: "The form P = Fv explains why a vehicle climbing a hill must change to a lower gear: the engine's power is capped, so a larger force can be delivered only at a smaller speed.",
          hi: "P = Fv रूप बताता है कि चढ़ाई चढ़ता वाहन नीचे के गियर में क्यों जाता है: इंजन की शक्ति की छत तय है, अतः बड़ा बल केवल कम चाल पर ही दिया जा सकता है।",
          mr: "P = Fv हे रूप सांगते की चढ चढणारे वाहन खालच्या गिअरमध्ये का जाते: इंजिनाच्या शक्तीला छत आहे, म्हणून मोठे बल केवळ कमी चालीवरच देता येते.",
        },
        extra: {
          en: "The kilowatt-hour on an electricity bill is therefore a unit of energy and not of power, being a rate multiplied by a time — 3.6 million joules of it.",
          hi: "अतः बिजली के बिल पर लिखी किलोवाट-घंटा ऊर्जा का मात्रक है, शक्ति का नहीं, क्योंकि वह दर गुणा समय है — 36 लाख जूल।",
          mr: "म्हणून विजेच्या बिलावरचा किलोवॅट-तास हे ऊर्जेचे एकक आहे, शक्तीचे नव्हे, कारण ते दर गुणिले काळ आहे — 36 लाख ज्यूल.",
        },
        pair: {
          left: {
            en: "Same job, sixty times the figure",
            hi: "वही काम, साठ गुना आँकड़ा",
            mr: "तेच काम, साठपट आकडा",
          },
          right: {
            en: "power as a rate",
            hi: "दर के रूप में शक्ति",
            mr: "दर म्हणून शक्ती",
          },
        },
      },
      {
        id: "perfectly-inelastic-collision",
        name: {
          en: "The perfectly inelastic collision",
          hi: "पूर्णतः अप्रत्यास्थ टक्कर",
          mr: "पूर्णतः अप्रत्यास्थ टक्कर",
        },
        kind: "classification",
        prompt: {
          en: "Two lumps of wet clay meet and move off as one: momentum comes through the encounter untouched, kinetic energy does not, and the missing joules are in the warmth and the deformation. Which collision is this?",
          hi: "गीली मिट्टी के दो लोंदे मिलकर एक होकर चल पड़ते हैं: संवेग इस भेंट से अछूता निकलता है, गतिज ऊर्जा नहीं, और लुप्त जूल गर्माहट तथा विरूपण में हैं। यह कौन-सी टक्कर है?",
          mr: "ओल्या मातीचे दोन गोळे भेटून एकत्रच पुढे जातात: संवेग या भेटीतून अस्पर्श निघतो, गतिज ऊर्जा नाही, आणि हरवलेली ज्यूल ऊब आणि विरूपणात आहेत. ही कोणती टक्कर?",
        },
        statement: {
          en: "In a perfectly inelastic collision the bodies move off together with a common velocity, momentum is conserved exactly, and the kinetic energy lost is the greatest that momentum conservation permits.",
          hi: "पूर्णतः अप्रत्यास्थ टक्कर में पिंड एक साझा वेग से साथ चल पड़ते हैं, संवेग ठीक-ठीक संरक्षित रहता है, और खोई गतिज ऊर्जा उतनी सबसे अधिक होती है जितनी संवेग-संरक्षण अनुमति देता है।",
          mr: "पूर्णतः अप्रत्यास्थ टक्करीत पिंड एका सामायिक वेगाने एकत्र पुढे जातात, संवेग नेमका संरक्षित राहतो, आणि गमावलेली गतिज ऊर्जा संवेग-संरक्षण जितकी परवानगी देते तितकी सर्वाधिक असते.",
        },
        detail: {
          en: "Total energy is conserved in every collision without exception; it is kinetic energy alone that can vanish into heat, sound and permanent deformation.",
          hi: "हर टक्कर में बिना किसी अपवाद के कुल ऊर्जा संरक्षित रहती है; केवल गतिज ऊर्जा ही ऊष्मा, ध्वनि और स्थायी विरूपण में लुप्त हो सकती है।",
          mr: "प्रत्येक टक्करीत कोणत्याही अपवादाशिवाय एकूण ऊर्जा संरक्षित राहते; केवळ गतिज ऊर्जाच उष्णता, ध्वनी आणि कायमच्या विरूपणात लोप पावू शकते.",
        },
        extra: {
          en: "In a head-on elastic collision between equal masses the two simply exchange velocities, which is why the end ball of a Newton's cradle leaves and the rest stay still.",
          hi: "बराबर द्रव्यमानों के बीच आमने-सामने की प्रत्यास्थ टक्कर में दोनों बस वेग बदल लेते हैं, इसीलिए न्यूटन के पालने की छोर वाली गेंद निकलती है और बाक़ी स्थिर रहती हैं।",
          mr: "समान वस्तुमानांमधील समोरासमोरच्या प्रत्यास्थ टक्करीत दोघे फक्त वेगांची अदलाबदल करतात, म्हणूनच न्यूटनच्या पाळण्यातला टोकाचा चेंडू निघतो आणि बाकीचे स्थिर राहतात.",
        },
        pair: {
          left: {
            en: "Momentum intact, kinetic energy at its greatest loss",
            hi: "संवेग सलामत, गतिज ऊर्जा की सबसे बड़ी हानि",
            mr: "संवेग शाबूत, गतिज ऊर्जेची सर्वांत मोठी हानी",
          },
          right: {
            en: "the perfectly inelastic collision",
            hi: "पूर्णतः अप्रत्यास्थ टक्कर",
            mr: "पूर्णतः अप्रत्यास्थ टक्कर",
          },
        },
      },
      /*F5*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A block slides down a rough slope from a height of 5 m and reaches the bottom at 8 m/s, where a frictionless slope would have delivered it at 10 m/s. A student says energy has been destroyed. Take g as 10 m/s² and correct them, saying what the missing energy is and what fraction of the initial store it represents.",
          hi: "एक गुटका 5 m ऊँचाई से खुरदरी ढलान पर फिसलकर तल पर 8 m/s से पहुँचता है, जबकि घर्षण-रहित ढलान उसे 10 m/s पर पहुँचाती। एक विद्यार्थी कहता है कि ऊर्जा नष्ट हो गई। g को 10 m/s² लेकर उसे सुधारो, बताओ लुप्त ऊर्जा क्या है और आरंभिक भंडार का कितना अंश है।",
          mr: "एक ठोकळा 5 m उंचीवरून खरखरीत उतारावरून घसरून तळाशी 8 m/s ने पोहोचतो, तर घर्षणविरहित उतार त्याला 10 m/s वर पोहोचवला असता. एक विद्यार्थी म्हणतो की ऊर्जा नष्ट झाली. g हा 10 m/s² घेऊन त्याला दुरुस्त करा, हरवलेली ऊर्जा काय आणि सुरुवातीच्या साठ्याचा किती अंश ते सांगा.",
        },
        choices: [
          {
            en: "Nothing was destroyed. Per kilogram the initial store is gh = 50 J and the arrival kinetic energy is ½v² = 32 J, so 18 J per kilogram — 36 per cent of the store — went into heating the block and the slope, and into the sound of the sliding. Total energy is conserved absolutely; what is not conserved is MECHANICAL energy, because friction is non-conservative and cannot be given a potential energy from which the joules could be recovered",
            hi: "कुछ नष्ट नहीं हुआ। प्रति किलोग्राम आरंभिक भंडार gh = 50 J है और पहुँचने पर गतिज ऊर्जा ½v² = 32 J, अतः प्रति किलोग्राम 18 J — भंडार का 36 प्रतिशत — गुटके तथा ढलान को गरम करने में और फिसलने की ध्वनि में गया। कुल ऊर्जा पूर्णतः संरक्षित है; जो संरक्षित नहीं वह यांत्रिक ऊर्जा है, क्योंकि घर्षण असंरक्षी है और उसे ऐसी स्थितिज ऊर्जा नहीं दी जा सकती जिससे जूल वापस मिल सकें",
            mr: "काहीही नष्ट झाले नाही. प्रति किलोग्रॅम सुरुवातीचा साठा gh = 50 J आणि पोहोचताना गतिज ऊर्जा ½v² = 32 J, म्हणून प्रति किलोग्रॅम 18 J — साठ्याच्या 36 टक्के — ठोकळा व उतार तापवण्यात आणि घसरण्याच्या आवाजात गेले. एकूण ऊर्जा पूर्णपणे संरक्षित; जी संरक्षित नाही ती यांत्रिक ऊर्जा, कारण घर्षण असंरक्षी आहे आणि त्याला अशी स्थितिज ऊर्जा देता येत नाही जिच्यातून ज्यूल परत मिळतील",
          },
          {
            en: "The student is right: friction genuinely destroys energy, which is why the conservation law is only approximate",
            hi: "विद्यार्थी सही है: घर्षण सचमुच ऊर्जा नष्ट करता है, इसीलिए संरक्षण-नियम केवल सन्निकट है",
            mr: "विद्यार्थी बरोबर: घर्षण खरोखर ऊर्जा नष्ट करते, म्हणूनच संरक्षण-नियम केवळ अंदाजे आहे",
          },
          {
            en: "The missing 18 J per kilogram is stored as friction potential energy and is returned when the block slides back up",
            hi: "प्रति किलोग्राम लुप्त 18 J घर्षण की स्थितिज ऊर्जा के रूप में संचित है और गुटके के वापस ऊपर फिसलने पर लौट आते हैं",
            mr: "प्रति किलोग्रॅम हरवलेले 18 J घर्षणाची स्थितिज ऊर्जा म्हणून साठलेले असतात आणि ठोकळा परत वर घसरल्यावर परत मिळतात",
          },
          {
            en: "Nothing is missing, because the 10 m/s figure is wrong: a body released from 5 m arrives at 8 m/s even with no friction",
            hi: "कुछ लुप्त नहीं है, क्योंकि 10 m/s का आँकड़ा ग़लत है: 5 m से छोड़ा गया पिंड बिना घर्षण के भी 8 m/s पर पहुँचता है",
            mr: "काहीही हरवलेले नाही, कारण 10 m/s हा आकडा चुकीचा आहे: 5 m वरून सोडलेला पिंड घर्षणाशिवायही 8 m/s ने पोहोचतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Do the arithmetic per kilogram, since the mass cancels out of everything here. At the top, the store available to be converted is the gravitational potential energy relative to the bottom: gh = 10 × 5 = 50 J per kg. On a frictionless slope every joule of that becomes kinetic, so ½v² = 50 and v = 10 m/s — which is where the student's comparison figure comes from, and it is correct. What arrives instead is 8 m/s, carrying ½v² = ½ × 64 = 32 J per kg. The shortfall is 50 − 32 = 18 J per kg, which is 18/50 = 36 per cent of what was there to begin with. Now the important question: where did those 18 J go? Not out of existence. Rub two surfaces together and you can measure the temperature rise; both the block and the slope are very slightly warmer than they were, and a small amount left as sound. The joules are still fully accounted for. The total energy of block, slope and surrounding air is exactly what it was before the slide. What has failed is not conservation of energy but conservation of MECHANICAL energy, which is the sum of kinetic and potential and is a much narrower claim. That narrower claim holds only when every force doing work is conservative. Gravity is; friction is not. The chapter's definition makes the difference precise: a conservative force does zero work round a closed loop, so the energy it takes on the way out is returned on the way back, and a potential energy function can be written for it. Friction fails that test decisively. Drag the block up the slope again and friction takes energy from you on the way up too — it opposes the motion in both directions, so a round trip costs twice rather than nothing. That is exactly why option three is wrong, and it is wrong in an instructive way. There is no such thing as friction potential energy, and the reason is not that nobody has bothered to define one: it cannot be defined, because the work done depends on the path taken and not merely on the endpoints. Take a longer, more winding route down the same 5 m and more energy is lost, though the endpoints are unchanged. A potential energy that depended on which way you walked would not be a function of position at all. Three practical consequences are worth carrying. First, in any problem where friction acts, write energy conservation as initial mechanical energy = final mechanical energy + work done against friction, and treat that last term as a one-way payment. Second, the fraction lost is a property of the surfaces and the geometry, not of the mass, which is why the block's weight never appeared above. Third, the loss is irreversible in a strong sense: the 18 J are now spread among countless randomly moving molecules, and no arrangement of slopes will gather them back into the ordered motion of a sliding block. (The wrong answers abandon a conservation law that has never once failed, invent a potential energy for a path-dependent force, or reject an arithmetic that is straightforward and right.)",
          hi: "गणना प्रति किलोग्राम करो, क्योंकि यहाँ द्रव्यमान हर जगह कट जाता है। शिखर पर बदले जाने को उपलब्ध भंडार तल के सापेक्ष गुरुत्वीय स्थितिज ऊर्जा है: gh = 10 × 5 = 50 J प्रति kg. घर्षण-रहित ढलान पर उसका हर जूल गतिज बन जाता है, अतः ½v² = 50 और v = 10 m/s — विद्यार्थी का तुलना-आँकड़ा यहीं से आता है, और वह सही है। इसके बजाय जो पहुँचता है वह 8 m/s है, जो ½v² = ½ × 64 = 32 J प्रति kg ढोता है। कमी 50 − 32 = 18 J प्रति kg है, जो आरंभ में जो था उसका 18/50 = 36 प्रतिशत है। अब महत्वपूर्ण प्रश्न: वे 18 J गए कहाँ? अस्तित्व से बाहर नहीं। दो सतहें रगड़ो और तुम ताप-वृद्धि नाप सकते हो; गुटका और ढलान दोनों पहले से बहुत थोड़े गरम हैं, और थोड़ी मात्रा ध्वनि बनकर निकल गई। जूल अब भी पूरी तरह हिसाब में हैं। गुटके, ढलान और आसपास की हवा की कुल ऊर्जा ठीक वही है जो फिसलने से पहले थी। जो विफल हुआ वह ऊर्जा-संरक्षण नहीं बल्कि यांत्रिक ऊर्जा का संरक्षण है, जो गतिज और स्थितिज का योग है और कहीं संकरा दावा है। वह संकरा दावा तभी चलता है जब कार्य करने वाला हर बल संरक्षी हो। गुरुत्व है; घर्षण नहीं। अध्याय की परिभाषा भेद को सटीक बनाती है: संरक्षी बल बंद पाश पर शून्य कार्य करता है, अतः जाते समय जो ऊर्जा वह लेता है लौटते समय लौटा देता है, और उसके लिए स्थितिज ऊर्जा फलन लिखा जा सकता है। घर्षण उस जाँच में निर्णायक रूप से विफल है। गुटके को फिर ढलान पर ऊपर घसीटो और घर्षण ऊपर जाते समय भी तुमसे ऊर्जा लेता है — वह दोनों दिशाओं में गति का विरोध करता है, अतः वापसी-यात्रा शून्य नहीं बल्कि दुगुना ख़र्च कराती है। ठीक इसीलिए तीसरा विकल्प ग़लत है, और वह शिक्षाप्रद ढंग से ग़लत है। घर्षण की स्थितिज ऊर्जा जैसी कोई चीज़ नहीं, और कारण यह नहीं कि किसी ने परिभाषित करने की परवाह नहीं की: वह परिभाषित हो ही नहीं सकती, क्योंकि किया गया कार्य लिए गए पथ पर निर्भर है, केवल सिरों पर नहीं। उन्हीं 5 m का लंबा, अधिक घुमावदार रास्ता लो और अधिक ऊर्जा खोती है, जबकि सिरे अपरिवर्तित हैं। जो स्थितिज ऊर्जा इस पर निर्भर करे कि तुम किस रास्ते चले, वह स्थिति का फलन ही नहीं होती। तीन व्यावहारिक परिणाम ले जाने योग्य हैं। पहला, जिस भी प्रश्न में घर्षण लगे, ऊर्जा-संरक्षण यों लिखो: आरंभिक यांत्रिक ऊर्जा = अंतिम यांत्रिक ऊर्जा + घर्षण के विरुद्ध किया कार्य, और उस अंतिम पद को एकतरफ़ा भुगतान मानो। दूसरा, खोया अंश सतहों और ज्यामिति का गुण है, द्रव्यमान का नहीं, इसीलिए ऊपर गुटके का भार कभी आया ही नहीं। तीसरा, हानि प्रबल अर्थ में अनुत्क्रमणीय है: वे 18 J अब असंख्य यादृच्छिक गति वाले अणुओं में बिखर चुके हैं, और ढलानों की कोई व्यवस्था उन्हें फिसलते गुटके की व्यवस्थित गति में वापस नहीं बटोर सकती। (ग़लत उत्तर उस संरक्षण-नियम को छोड़ देते जो एक बार भी विफल नहीं हुआ, पथ-निर्भर बल के लिए स्थितिज ऊर्जा गढ़ते, या ऐसा गणित नकारते जो सीधा और सही है।)",
          mr: "गणना प्रति किलोग्रॅम करा, कारण इथे वस्तुमान सर्वत्र कापले जाते. शिखरावर बदलण्यासाठी उपलब्ध साठा तळाच्या सापेक्ष गुरुत्वीय स्थितिज ऊर्जा: gh = 10 × 5 = 50 J प्रति kg. घर्षणविरहित उतारावर त्यातले प्रत्येक ज्यूल गतिज बनते, म्हणून ½v² = 50 आणि v = 10 m/s — विद्यार्थ्याचा तुलना-आकडा इथूनच येतो, आणि तो बरोबर आहे. त्याऐवजी जे पोहोचते ते 8 m/s, जे ½v² = ½ × 64 = 32 J प्रति kg वाहते. तूट 50 − 32 = 18 J प्रति kg, जी सुरुवातीला जे होते त्याच्या 18/50 = 36 टक्के. आता महत्त्वाचा प्रश्न: ती 18 J गेली कुठे? अस्तित्वातून बाहेर नाही. दोन पृष्ठभाग घासा आणि तुम्ही तापमानवाढ मोजू शकता; ठोकळा आणि उतार दोन्ही आधीहून फार थोडे उबदार आहेत, आणि थोडे प्रमाण ध्वनी बनून निघाले. ज्यूल अजूनही पूर्णपणे हिशोबात आहेत. ठोकळा, उतार आणि आजूबाजूची हवा यांची एकूण ऊर्जा नेमकी तीच जी घसरण्याआधी होती. जे अपयशी ठरले ते ऊर्जा-संरक्षण नव्हे तर यांत्रिक ऊर्जेचे संरक्षण, जे गतिज आणि स्थितिजची बेरीज आणि कितीतरी अरुंद दावा आहे. तो अरुंद दावा तेव्हाच चालतो जेव्हा कार्य करणारे प्रत्येक बल संरक्षी असते. गुरुत्व आहे; घर्षण नाही. प्रकरणाची व्याख्या भेद नेमका करते: संरक्षी बल बंद फेऱ्यावर शून्य कार्य करते, म्हणून जाताना जी ऊर्जा ते घेते ती परतताना परत करते, आणि त्यासाठी स्थितिज ऊर्जा फलन लिहिता येते. घर्षण त्या परीक्षेत निर्णायकपणे नापास. ठोकळा पुन्हा उतारावर वर ओढा आणि घर्षण वर जातानाही तुमच्याकडून ऊर्जा घेते — ते दोन्ही दिशांना गतीला विरोध करते, म्हणून परतीचा प्रवास शून्य नव्हे तर दुप्पट खर्च करवतो. नेमके म्हणूनच तिसरा पर्याय चुकीचा, आणि तो शिकवणाऱ्या पद्धतीने चुकीचा. घर्षणाची स्थितिज ऊर्जा अशी कोणतीही गोष्ट नाही, आणि कारण हे नाही की कोणी व्याख्या करण्याची तसदी घेतली नाही: तिची व्याख्याच होऊ शकत नाही, कारण केलेले कार्य घेतलेल्या मार्गावर अवलंबून आहे, केवळ टोकांवर नाही. त्याच 5 m चा लांब, अधिक वळणदार मार्ग घ्या आणि अधिक ऊर्जा गमावली जाते, जरी टोके तीच असली तरी. जी स्थितिज ऊर्जा तुम्ही कोणत्या वाटेने चाललात यावर अवलंबून असेल, ती स्थानाचे फलनच नसेल. तीन व्यावहारिक परिणाम नेण्याजोगे. पहिला, ज्या प्रश्नात घर्षण लागते तिथे ऊर्जा-संरक्षण असे लिहा: सुरुवातीची यांत्रिक ऊर्जा = शेवटची यांत्रिक ऊर्जा + घर्षणाविरुद्ध केलेले कार्य, आणि ते शेवटचे पद एकतर्फी भरणा माना. दुसरा, गमावलेला अंश पृष्ठभाग आणि भूमितीचा गुणधर्म, वस्तुमानाचा नाही, म्हणूनच वर ठोकळ्याचे वजन कधी आलेच नाही. तिसरा, हानी प्रबळ अर्थाने अपरिवर्तनीय: ती 18 J आता असंख्य यादृच्छिक गतीच्या रेणूंत विखुरली आहेत, आणि उतारांची कोणतीही रचना ती घसरणाऱ्या ठोकळ्याच्या व्यवस्थित गतीत परत गोळा करू शकत नाही. (चुकीची उत्तरे एकदाही अपयशी न ठरलेला संरक्षण-नियम सोडून देतात, मार्ग-अवलंबी बलासाठी स्थितिज ऊर्जा घडवतात, वा सरळ आणि बरोबर असलेले गणित नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A 4 kg lump of clay moving at 5 m/s strikes a stationary 6 kg lump and the two move off together. A student computes the common velocity from kinetic energy conservation instead of momentum conservation and gets a different answer. Explain which law may be used here and why, and what happens to the difference.",
          hi: "5 m/s से चलता 4 kg मिट्टी का लोंदा 6 kg के स्थिर लोंदे से टकराता है और दोनों साथ चल पड़ते हैं। एक विद्यार्थी साझा वेग संवेग-संरक्षण के बजाय गतिज ऊर्जा-संरक्षण से निकालता है और भिन्न उत्तर पाता है। समझाओ यहाँ कौन-सा नियम प्रयोग हो सकता है और क्यों, और अंतर का होता क्या है।",
          mr: "5 m/s ने जाणारा 4 kg मातीचा गोळा 6 kg च्या स्थिर गोळ्यावर आदळतो आणि दोघे एकत्र पुढे जातात. एक विद्यार्थी सामायिक वेग संवेग-संरक्षणाऐवजी गतिज ऊर्जा-संरक्षणातून काढतो आणि वेगळे उत्तर मिळवतो. समजावा इथे कोणता नियम वापरता येतो आणि का, आणि फरकाचे होते काय.",
        },
        choices: [
          {
            en: "Only momentum may be used. Momentum conservation follows from the third law and holds in every collision without exception, giving v = (4 × 5)/10 = 2 m/s. Kinetic energy is conserved only in an elastic collision, and clay is the opposite case: the initial kinetic energy is ½ × 4 × 25 = 50 J and the final is ½ × 10 × 4 = 20 J, so 30 J went into deforming the clay and warming it. The student's calculation assumed a conservation that the physical situation denies",
            hi: "केवल संवेग प्रयोग हो सकता है। संवेग-संरक्षण तीसरे नियम से निकलता है और बिना किसी अपवाद के हर टक्कर में चलता है, जिससे v = (4 × 5)/10 = 2 m/s. गतिज ऊर्जा केवल प्रत्यास्थ टक्कर में संरक्षित रहती है, और मिट्टी उलटी स्थिति है: आरंभिक गतिज ऊर्जा ½ × 4 × 25 = 50 J और अंतिम ½ × 10 × 4 = 20 J, अतः 30 J मिट्टी के विरूपण और उसे गरम करने में गए। विद्यार्थी की गणना ने ऐसा संरक्षण मान लिया जिसे भौतिक स्थिति नकारती है",
            mr: "केवळ संवेग वापरता येतो. संवेग-संरक्षण तिसऱ्या नियमातून निघते आणि कोणत्याही अपवादाशिवाय प्रत्येक टक्करीत चालते, ज्यातून v = (4 × 5)/10 = 2 m/s. गतिज ऊर्जा केवळ प्रत्यास्थ टक्करीत संरक्षित राहते, आणि माती ही उलट स्थिती: सुरुवातीची गतिज ऊर्जा ½ × 4 × 25 = 50 J आणि शेवटची ½ × 10 × 4 = 20 J, म्हणून 30 J मातीच्या विरूपणात आणि तिला तापवण्यात गेले. विद्यार्थ्याच्या गणनेने असे संरक्षण गृहीत धरले जे भौतिक परिस्थिती नाकारते",
          },
          {
            en: "Either law may be used, and the two must agree; the student has simply made an arithmetic slip",
            hi: "कोई भी नियम प्रयोग हो सकता है, और दोनों को मिलना ही चाहिए; विद्यार्थी से बस गणना की चूक हुई है",
            mr: "कोणताही नियम वापरता येतो, आणि दोघे जुळलेच पाहिजेत; विद्यार्थ्याकडून फक्त आकडेमोडीची चूक झाली आहे",
          },
          {
            en: "Only kinetic energy may be used, because momentum is not conserved when the bodies stick together and become one",
            hi: "केवल गतिज ऊर्जा प्रयोग हो सकती है, क्योंकि पिंडों के चिपककर एक हो जाने पर संवेग संरक्षित नहीं रहता",
            mr: "केवळ गतिज ऊर्जा वापरता येते, कारण पिंड चिकटून एक झाल्यावर संवेग संरक्षित राहत नाही",
          },
          {
            en: "Neither law applies, since conservation laws hold only for elastic collisions between rigid bodies",
            hi: "कोई भी नियम लागू नहीं, क्योंकि संरक्षण-नियम केवल दृढ़ पिंडों की प्रत्यास्थ टक्करों पर चलते हैं",
            mr: "कोणताही नियम लागू नाही, कारण संरक्षण-नियम केवळ दृढ पिंडांच्या प्रत्यास्थ टक्करींनाच चालतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two conservation statements are not equally available, and knowing which one to reach for is most of what collision problems test. Momentum first, because it is the secure one. During the impact the clay lumps exert forces on each other, and by the third law those two forces are equal and opposite at every instant. Whatever momentum one gains, the other loses, so the total is unchanged — and this argument used nothing about the material, the duration, or whether the lumps bounced or stuck. It holds for steel, for clay, for a bullet embedding in a block. The only requirement is that no significant EXTERNAL force acts during the brief contact, which is why a collision on a table is analysed without worrying about gravity: the collision lasts milliseconds and gravity has no time to change the momentum appreciably. So: total momentum before is 4 × 5 + 6 × 0 = 20 kg m/s, and afterwards the combined 10 kg moves at v, giving 10v = 20 and v = 2 m/s. Now the energy audit. Before: ½ × 4 × 5² = 50 J. After: ½ × 10 × 2² = 20 J. Thirty joules, sixty per cent of the original, have left the kinetic account. They are not gone from the universe. Wet clay squashes; that deformation is permanent work done against the internal forces holding the material together, and it ends as a temperature rise in both lumps and a thud in the air. Weigh the clay afterwards and nothing is missing; measure it with a sensitive enough thermometer and the energy is there. This is exactly the elastic–inelastic distinction. In an elastic collision the bodies deform and then spring back, returning the stored energy to kinetic form, so kinetic energy comes out the same as it went in and both conservation laws may be used together — which is what makes elastic problems solvable for two unknown final velocities. In a perfectly inelastic collision the bodies do not spring back at all; they move off as one, and the kinetic energy lost is the largest amount that momentum conservation will permit. Every real collision lies somewhere between, and the extreme cases are the ones with clean arithmetic. There is a useful check hiding in the numbers. Notice the loss can never be all of the kinetic energy: momentum conservation forbids the combined lump from being at rest, because 20 kg m/s has to go somewhere. The final kinetic energy of a perfectly inelastic collision is always exactly p²/2M, here 400/20 = 20 J, and it is the floor below which no collision can take the kinetic energy. Finally, note the asymmetry in what the two laws are worth. Momentum conservation is a theorem — it follows from Newton's third law and needs no assumption about the material. Kinetic energy conservation is a modelling assumption, true of billiard balls and gas molecules and false of clay, cars and catches. Treating them as interchangeable is the error the student made, and it is not an arithmetic slip but a physical one. (The wrong answers grant kinetic energy a conservation it does not have, deny momentum one it always has, or abandon both laws in a case where one of them is exact.)",
          hi: "दोनों संरक्षण-कथन समान रूप से उपलब्ध नहीं हैं, और कौन-सा उठाना है यह जानना ही टक्कर के प्रश्नों की अधिकांश परीक्षा है। पहले संवेग, क्योंकि वही सुरक्षित है। टक्कर के दौरान मिट्टी के लोंदे एक-दूसरे पर बल लगाते हैं, और तीसरे नियम से वे दोनों बल हर क्षण बराबर और विपरीत हैं। एक जो संवेग पाता है वही दूसरा खोता है, अतः कुल अपरिवर्तित रहता है — और इस तर्क ने पदार्थ, अवधि, या लोंदे उछले या चिपके, इसमें से कुछ इस्तेमाल नहीं किया। वह इस्पात पर चलता है, मिट्टी पर, गुटके में धँसती गोली पर। एकमात्र शर्त यह कि उस अल्प संपर्क में कोई महत्वपूर्ण बाह्य बल न लगे, इसीलिए मेज़ पर हुई टक्कर का विश्लेषण गुरुत्व की चिंता किए बिना होता है: टक्कर मिलीसेकंड चलती है और गुरुत्व के पास संवेग उल्लेखनीय रूप से बदलने का समय नहीं। अतः: पहले कुल संवेग 4 × 5 + 6 × 0 = 20 kg m/s, और बाद में संयुक्त 10 kg वेग v से चलता है, जिससे 10v = 20 और v = 2 m/s. अब ऊर्जा का हिसाब। पहले: ½ × 4 × 5² = 50 J. बाद में: ½ × 10 × 2² = 20 J. तीस जूल, मूल का साठ प्रतिशत, गतिज खाते से निकल गए। वे ब्रह्मांड से नहीं गए। गीली मिट्टी चिपटती है; वह विरूपण पदार्थ को जोड़े रखने वाले आंतरिक बलों के विरुद्ध किया गया स्थायी कार्य है, और वह दोनों लोंदों में ताप-वृद्धि तथा हवा में एक धमक बनकर समाप्त होता है। बाद में मिट्टी तौलो और कुछ कम नहीं; पर्याप्त संवेदनशील तापमापी से नापो और ऊर्जा वहीं है। यही प्रत्यास्थ-अप्रत्यास्थ भेद है। प्रत्यास्थ टक्कर में पिंड विरूपित होकर वापस उछल आते हैं, संचित ऊर्जा गतिज रूप में लौटा देते हैं, अतः गतिज ऊर्जा वैसी ही निकलती है जैसी गई थी और दोनों संरक्षण-नियम साथ प्रयोग किए जा सकते हैं — इसी से प्रत्यास्थ प्रश्न दो अज्ञात अंतिम वेगों के लिए हल हो पाते हैं। पूर्णतः अप्रत्यास्थ टक्कर में पिंड बिलकुल वापस नहीं उछलते; वे एक होकर चल पड़ते हैं, और खोई गतिज ऊर्जा उतनी सबसे अधिक होती है जितनी संवेग-संरक्षण अनुमति देगा। हर असली टक्कर कहीं बीच में पड़ती है, और चरम स्थितियाँ ही स्वच्छ गणित वाली हैं। संख्याओं में एक उपयोगी जाँच छिपी है। ध्यान दो हानि कभी पूरी गतिज ऊर्जा नहीं हो सकती: संवेग-संरक्षण संयुक्त लोंदे को विराम में रहने से मना करता है, क्योंकि 20 kg m/s को कहीं तो जाना है। पूर्णतः अप्रत्यास्थ टक्कर की अंतिम गतिज ऊर्जा सदा ठीक p²/2M होती है, यहाँ 400/20 = 20 J, और वही वह फ़र्श है जिससे नीचे कोई टक्कर गतिज ऊर्जा नहीं ले जा सकती। अंत में, दोनों नियमों के मूल्य में असमानता पर ध्यान दो। संवेग-संरक्षण प्रमेय है — वह न्यूटन के तीसरे नियम से निकलता है और पदार्थ के बारे में कोई मान्यता नहीं माँगता। गतिज ऊर्जा का संरक्षण एक निदर्श-मान्यता है, बिलियर्ड गेंदों और गैस अणुओं पर सच और मिट्टी, कारों तथा कैचों पर झूठ। उन्हें अदल-बदल योग्य मानना ही वह भूल है जो विद्यार्थी ने की, और वह गणना की नहीं, भौतिकी की भूल है। (ग़लत उत्तर गतिज ऊर्जा को वह संरक्षण देते जो उसमें नहीं, संवेग से वह छीनते जो उसमें सदा है, या ऐसी स्थिति में दोनों नियम छोड़ देते जहाँ उनमें से एक ठीक-ठीक सही है।)",
          mr: "दोन्ही संरक्षण-विधाने सारखीच उपलब्ध नाहीत, आणि कोणते उचलायचे हे जाणणे हीच टक्करीच्या प्रश्नांची बहुतांश परीक्षा. आधी संवेग, कारण तोच सुरक्षित. टक्करीदरम्यान मातीचे गोळे एकमेकांवर बले लावतात, आणि तिसऱ्या नियमाने ती दोन्ही बले प्रत्येक क्षणी समान आणि विरुद्ध. एक जो संवेग मिळवतो तोच दुसरा गमावतो, म्हणून एकूण अपरिवर्तित — आणि या युक्तिवादाने पदार्थ, कालावधी, वा गोळे उसळले की चिकटले यांपैकी काहीही वापरले नाही. तो पोलादावर चालतो, मातीवर, ठोकळ्यात घुसणाऱ्या गोळीवर. एकमेव अट ही की त्या अल्प स्पर्शात कोणतेही महत्त्वाचे बाह्य बल लागू नये, म्हणूनच टेबलावरील टक्करीचे विश्लेषण गुरुत्वाची चिंता न करता होते: टक्कर मिलिसेकंद चालते आणि गुरुत्वाला संवेग लक्षणीयरीत्या बदलायला वेळ नाही. म्हणून: आधीचा एकूण संवेग 4 × 5 + 6 × 0 = 20 kg m/s, आणि नंतर एकत्रित 10 kg वेग v ने जाते, ज्यातून 10v = 20 आणि v = 2 m/s. आता ऊर्जेचा हिशोब. आधी: ½ × 4 × 5² = 50 J. नंतर: ½ × 10 × 2² = 20 J. तीस ज्यूल, मूळच्या साठ टक्के, गतिज खात्यातून निघून गेले. ती विश्वातून गेली नाहीत. ओली माती चपटते; ते विरूपण म्हणजे पदार्थाला एकत्र धरणाऱ्या आंतरिक बलांविरुद्ध केलेले कायमचे कार्य, आणि ते दोन्ही गोळ्यांत तापमानवाढ आणि हवेत एक धप बनून संपते. नंतर माती तोला आणि काहीही कमी नाही; पुरेशा संवेदनशील तापमापकाने मोजा आणि ऊर्जा तिथेच आहे. हाच तो प्रत्यास्थ-अप्रत्यास्थ भेद. प्रत्यास्थ टक्करीत पिंड विरूपित होऊन परत उसळतात, साठलेली ऊर्जा गतिज रूपात परत करतात, म्हणून गतिज ऊर्जा जशी गेली तशीच निघते आणि दोन्ही संरक्षण-नियम एकत्र वापरता येतात — यामुळेच प्रत्यास्थ प्रश्न दोन अज्ञात अंतिम वेगांसाठी सुटतात. पूर्णतः अप्रत्यास्थ टक्करीत पिंड मुळीच परत उसळत नाहीत; ते एक होऊन पुढे जातात, आणि गमावलेली गतिज ऊर्जा संवेग-संरक्षण जितकी परवानगी देईल तितकी सर्वाधिक असते. प्रत्येक खरी टक्कर कुठेतरी मध्ये पडते, आणि टोकाच्या स्थितीच स्वच्छ गणिताच्या. संख्यांत एक उपयुक्त तपासणी लपली आहे. लक्षात घ्या हानी कधीही अख्खी गतिज ऊर्जा असू शकत नाही: संवेग-संरक्षण एकत्रित गोळ्याला स्थिर राहण्यास मनाई करते, कारण 20 kg m/s ला कुठेतरी जावेच लागते. पूर्णतः अप्रत्यास्थ टक्करीची शेवटची गतिज ऊर्जा नेहमी नेमकी p²/2M असते, इथे 400/20 = 20 J, आणि तेच ते तळ ज्याखाली कोणतीही टक्कर गतिज ऊर्जा नेऊ शकत नाही. शेवटी, दोन्ही नियमांच्या मोलातील असमानता लक्षात घ्या. संवेग-संरक्षण हे प्रमेय — ते न्यूटनच्या तिसऱ्या नियमातून निघते आणि पदार्थाबद्दल कोणतेही गृहीतक मागत नाही. गतिज ऊर्जेचे संरक्षण हे प्रतिरूपण-गृहीतक, बिलियर्ड चेंडू व वायुरेणूंवर खरे आणि माती, मोटारी व झेलांवर खोटे. त्यांना अदलाबदल करण्याजोगे मानणे हीच ती चूक जी विद्यार्थ्याने केली, आणि ती आकडेमोडीची नव्हे तर भौतिकीची चूक. (चुकीची उत्तरे गतिज ऊर्जेला नसलेले संरक्षण देतात, संवेगाकडून नेहमी असलेले हिरावतात, वा ज्या स्थितीत त्यांपैकी एक नेमका बरोबर आहे तिथे दोन्ही नियम सोडून देतात.)",
        },
      },
      /*H5*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — System of Particles and Rotational Motion                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-system-of-particles-and-rotational-motion",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 6 — System of Particles and Rotational Motion",
      hi: "अध्याय 6 — कणों का निकाय तथा घूर्णी गति",
      mr: "प्रकरण 6 — कणांची प्रणाली आणि परिवलनी गती",
    },
    name: {
      en: "System of Particles and Rotational Motion",
      hi: "कणों का निकाय तथा घूर्णी गति",
      mr: "कणांची प्रणाली आणि परिवलनी गती",
    },
    summary: {
      en: "Bodies stop being points, and every law learnt so far acquires a twin: force gains torque, mass gains a quantity that depends on where the mass was put rather than how much there is, momentum gains a version a skater can change by folding her arms, and a spinning cylinder rolling downhill loses to a sliding one because part of its energy went into turning instead of travelling.",
      hi: "पिंड बिंदु होना छोड़ देते हैं, और अब तक सीखा हर नियम अपना जुड़वाँ पा लेता है: बल को बल-आघूर्ण मिलता है, द्रव्यमान को ऐसी राशि मिलती है जो इस पर निर्भर है कि द्रव्यमान रखा कहाँ गया, कितना है इस पर नहीं, संवेग को ऐसा रूप मिलता है जिसे स्केटर बाँहें समेटकर बदल सकती है, और ढलान पर लुढ़कता घूमता बेलन फिसलते बेलन से हार जाता है क्योंकि उसकी कुछ ऊर्जा चलने के बजाय घूमने में चली गई।",
      mr: "पिंड बिंदू असणे थांबतात, आणि आतापर्यंत शिकलेल्या प्रत्येक नियमाला जुळे मिळते: बलाला बलआघूर्ण मिळते, वस्तुमानाला अशी राशी मिळते जी वस्तुमान कुठे ठेवले यावर अवलंबून, किती आहे यावर नव्हे, संवेगाला असे रूप मिळते जे स्केटर हात मिटवून बदलू शकते, आणि उतारावर घरंगळणारा फिरता दंडगोल घसरणाऱ्या दंडगोलाकडून हरतो कारण त्याची काही ऊर्जा प्रवास करण्याऐवजी फिरण्यात गेली.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "centre-of-mass",
        name: {
          en: "The centre of mass",
          hi: "द्रव्यमान केंद्र",
          mr: "वस्तुमान केंद्र",
        },
        kind: "quantity",
        prompt: {
          en: "Throw a spanner spinning across a room and one particular point of it traces a clean parabola while every other point wobbles about that point. Which point is this?",
          hi: "कमरे के आर-पार घूमता हुआ पाना फेंको और उसका एक विशेष बिंदु स्वच्छ परवलय खींचता है जबकि हर दूसरा बिंदु उसी के इर्द-गिर्द डोलता है। यह कौन-सा बिंदु है?",
          mr: "खोलीत फिरता पाना फेका आणि त्याचा एक विशिष्ट बिंदू स्वच्छ परवलय काढतो तर बाकी प्रत्येक बिंदू त्याच्याभोवती डुलतो. हा कोणता बिंदू?",
        },
        statement: {
          en: "The centre of mass moves exactly as a single particle of the system's total mass would move under the total external force, whatever the internal forces are doing.",
          hi: "द्रव्यमान केंद्र ठीक वैसे चलता है जैसे निकाय के कुल द्रव्यमान का एक अकेला कण कुल बाह्य बल के अधीन चलता, आंतरिक बल चाहे जो कर रहे हों।",
          mr: "वस्तुमान केंद्र नेमके तसे चालते जसे प्रणालीच्या एकूण वस्तुमानाचा एकच कण एकूण बाह्य बलाखाली चालला असता, आंतरिक बले काहीही करत असोत.",
        },
        detail: {
          en: "It need not lie inside the body at all: for a ring or a horseshoe it sits in empty space, and a high jumper's can pass under the bar while every part of the jumper goes over it.",
          hi: "उसे पिंड के भीतर होना ही ज़रूरी नहीं: छल्ले या नाल के लिए वह खाली जगह में बैठता है, और ऊँची कूद लगाने वाले का द्रव्यमान केंद्र छड़ के नीचे से निकल सकता है जबकि कूदने वाले का हर हिस्सा उसके ऊपर से जाता है।",
          mr: "तो पिंडाच्या आत असायलाच हवा असे नाही: कड्यासाठी वा नालासाठी तो रिकाम्या जागेत बसतो, आणि उंच उडी मारणाऱ्याचा तो दांडीखालून जाऊ शकतो तर उडी मारणाऱ्याचा प्रत्येक भाग तिच्यावरून जातो.",
        },
        extra: {
          en: "An exploding shell's fragments fly everywhere, yet their centre of mass continues along the original parabola, because an explosion is entirely internal and cannot shift it.",
          hi: "फटते गोले के टुकड़े हर ओर उड़ते हैं, फिर भी उनका द्रव्यमान केंद्र मूल परवलय पर चलता रहता है, क्योंकि विस्फोट पूरी तरह आंतरिक है और उसे खिसका नहीं सकता।",
          mr: "फुटणाऱ्या गोळ्याचे तुकडे सर्वत्र उडतात, तरीही त्यांचे वस्तुमान केंद्र मूळ परवलयावर चालत राहते, कारण स्फोट पूर्णपणे आंतरिक आहे आणि त्याला सरकवू शकत नाही.",
        },
        pair: {
          left: {
            en: "The one point of a thrown spanner that does not wobble",
            hi: "फेंके गए पाने का एकमात्र बिंदु जो नहीं डोलता",
            mr: "फेकलेल्या पान्याचा एकमेव बिंदू जो डुलत नाही",
          },
          right: {
            en: "the centre of mass",
            hi: "द्रव्यमान केंद्र",
            mr: "वस्तुमान केंद्र",
          },
        },
      },
      {
        id: "torque",
        name: {
          en: "Torque",
          hi: "बल-आघूर्ण",
          mr: "बलआघूर्ण",
        },
        kind: "quantity",
        prompt: {
          en: "A door handle is fitted at the edge and never beside the hinge, and a spanner is lengthened when a nut will not shift, because this quantity is the force multiplied by its perpendicular distance from the axis. Which quantity is this?",
          hi: "दरवाज़े का हत्था किनारे पर लगता है, कब्ज़े के पास कभी नहीं, और नट न घूमे तो पाना लंबा किया जाता है, क्योंकि यह राशि बल गुणा अक्ष से उसकी लंबवत दूरी है। यह कौन-सी राशि है?",
          mr: "दाराची मूठ कडेला बसवली जाते, बिजागरीजवळ कधीच नाही, आणि नट फिरत नसेल तर पाना लांब केला जातो, कारण ही राशी म्हणजे बल गुणिले अक्षापासूनचे त्याचे लंब अंतर. ही कोणती राशी?",
        },
        statement: {
          en: "Torque is the turning effect of a force, equal to the force times its perpendicular distance from the axis, so the same force applied further out turns a body harder.",
          hi: "बल-आघूर्ण बल का घुमाव-प्रभाव है, बल गुणा अक्ष से उसकी लंबवत दूरी के बराबर, अतः वही बल अधिक दूर लगाने पर पिंड को अधिक ज़ोर से घुमाता है।",
          mr: "बलआघूर्ण म्हणजे बलाचा वळवण्याचा परिणाम, बल गुणिले अक्षापासूनचे त्याचे लंब अंतर, म्हणून तेच बल अधिक दूर लावल्यास पिंडाला अधिक जोराने वळवते.",
        },
        detail: {
          en: "A force whose line of action passes through the axis has zero perpendicular distance and therefore produces no rotation, however large it is — which is why pushing a door towards its hinge never opens it.",
          hi: "जिस बल की क्रिया-रेखा अक्ष से होकर गुज़रती है उसकी लंबवत दूरी शून्य है और इसलिए वह कोई घूर्णन नहीं देता, चाहे कितना ही बड़ा हो — इसीलिए दरवाज़े को कब्ज़े की ओर धकेलने से वह कभी नहीं खुलता।",
          mr: "ज्या बलाची क्रियारेषा अक्षातून जाते त्याचे लंब अंतर शून्य आणि म्हणून ते कोणतेही परिवलन देत नाही, ते कितीही मोठे असो — म्हणूनच दार बिजागरीकडे ढकलल्याने ते कधीच उघडत नाही.",
        },
        extra: {
          en: "Two equal and opposite forces on different lines form a couple, which produces pure rotation with no net force at all, as when both hands turn a steering wheel.",
          hi: "भिन्न रेखाओं पर लगे दो बराबर और विपरीत बल एक बल-युग्म बनाते हैं, जो बिना किसी परिणामी बल के शुद्ध घूर्णन देता है, जैसे दोनों हाथ स्टियरिंग घुमाते हैं।",
          mr: "वेगळ्या रेषांवरची दोन समान आणि विरुद्ध बले एक बलयुग्म बनवतात, जे कोणत्याही परिणामी बलाशिवाय शुद्ध परिवलन देते, जसे दोन्ही हात स्टिअरिंग फिरवतात.",
        },
        pair: {
          left: {
            en: "Push at the hinge and nothing turns",
            hi: "कब्ज़े पर धकेलो और कुछ नहीं घूमता",
            mr: "बिजागरीवर ढकला आणि काहीही फिरत नाही",
          },
          right: {
            en: "torque",
            hi: "बल-आघूर्ण",
            mr: "बलआघूर्ण",
          },
        },
      },
      {
        id: "moment-of-inertia",
        name: {
          en: "Moment of inertia",
          hi: "जड़त्व आघूर्ण",
          mr: "जडत्व आघूर्ण",
        },
        kind: "quantity",
        prompt: {
          en: "A hollow ring and a solid disc of the very same mass and radius are pushed with the same twist, and the ring is much harder to get spinning, because this quantity weights each bit of mass by the square of its distance from the axis. Which quantity is this?",
          hi: "ठीक उसी द्रव्यमान और त्रिज्या के खोखले छल्ले और ठोस चकती को समान मरोड़ दी जाती है, और छल्ला घुमाना कहीं कठिन होता है, क्योंकि यह राशि द्रव्यमान के हर टुकड़े को अक्ष से उसकी दूरी के वर्ग से भारित करती है। यह कौन-सी राशि है?",
          mr: "अगदी त्याच वस्तुमान आणि त्रिज्येच्या पोकळ कड्याला आणि भरीव चकतीला समान पीळ दिला जातो, आणि कडे फिरवणे कितीतरी कठीण असते, कारण ही राशी वस्तुमानाच्या प्रत्येक तुकड्याला अक्षापासूनच्या त्याच्या अंतराच्या वर्गाने भारित करते. ही कोणती राशी?",
        },
        statement: {
          en: "Moment of inertia is the sum of each element of mass times the square of its distance from the axis, so it depends on where the mass sits and not merely on how much of it there is.",
          hi: "जड़त्व आघूर्ण द्रव्यमान के हर अवयव गुणा अक्ष से उसकी दूरी के वर्ग का योग है, अतः वह इस पर निर्भर है कि द्रव्यमान बैठा कहाँ है, केवल इस पर नहीं कि वह कितना है।",
          mr: "जडत्व आघूर्ण म्हणजे वस्तुमानाचा प्रत्येक घटक गुणिले अक्षापासूनच्या त्याच्या अंतराचा वर्ग यांची बेरीज, म्हणून ते वस्तुमान कुठे बसले आहे यावर अवलंबून, केवळ ते किती आहे यावर नाही.",
        },
        detail: {
          en: "The same body has different values about different axes, so it is meaningless to quote one without naming the axis — a rod about its centre has a quarter the value it has about one end.",
          hi: "वही पिंड भिन्न अक्षों के परितः भिन्न मान रखता है, अतः अक्ष बताए बिना कोई मान कहना निरर्थक है — छड़ का केंद्र के परितः मान उसके एक सिरे के परितः मान का एक चौथाई है।",
          mr: "तोच पिंड वेगवेगळ्या अक्षांभोवती वेगळी मूल्ये बाळगतो, म्हणून अक्ष न सांगता एखादे मूल्य सांगणे निरर्थक — दांडीचे केंद्राभोवतीचे मूल्य तिच्या एका टोकाभोवतीच्या मूल्याच्या एक चतुर्थांश.",
        },
        extra: {
          en: "It plays the part in rotation that mass plays in straight-line motion, appearing in τ = Iα, in L = Iω and in the rotational kinetic energy ½Iω².",
          hi: "घूर्णन में वह वही भूमिका निभाता है जो सरल-रेखीय गति में द्रव्यमान निभाता है, और τ = Iα, L = Iω तथा घूर्णी गतिज ऊर्जा ½Iω² में आता है।",
          mr: "परिवलनात तो तीच भूमिका बजावतो जी सरळरेषीय गतीत वस्तुमान बजावते, आणि τ = Iα, L = Iω तसेच परिवलनी गतिज ऊर्जा ½Iω² मध्ये येतो.",
        },
        pair: {
          left: {
            en: "Same mass, same radius, twice as hard to spin",
            hi: "वही द्रव्यमान, वही त्रिज्या, घुमाने में दुगुना कठिन",
            mr: "तेच वस्तुमान, तीच त्रिज्या, फिरवायला दुप्पट कठीण",
          },
          right: {
            en: "moment of inertia",
            hi: "जड़त्व आघूर्ण",
            mr: "जडत्व आघूर्ण",
          },
        },
      },
      {
        id: "angular-momentum-conserved",
        name: {
          en: "Conservation of angular momentum",
          hi: "कोणीय संवेग का संरक्षण",
          mr: "कोनीय संवेगाचे संरक्षण",
        },
        kind: "principle",
        prompt: {
          en: "A skater spinning with arms outstretched pulls them in and speeds up sharply, having applied no torque about her own axis and touched nothing: the product Iω had to stay put, so ω rose as I fell. Which law is this?",
          hi: "बाँहें फैलाए घूमती स्केटर उन्हें समेटती है और तेज़ी से घूमने लगती है, जबकि उसने अपने अक्ष के परितः कोई बल-आघूर्ण नहीं लगाया और किसी चीज़ को छुआ नहीं: गुणनफल Iω को टिका रहना था, अतः I घटते ही ω चढ़ गया। यह कौन-सा नियम है?",
          mr: "हात पसरून फिरणारी स्केटर ते मिटवते आणि झपाट्याने वेगात फिरू लागते, तिने स्वतःच्या अक्षाभोवती कोणतेही बलआघूर्ण लावलेले नाही आणि कशालाही स्पर्श केलेला नाही: गुणाकार Iω ला टिकून राहावे लागले, म्हणून I घटताच ω चढला. हा कोणता नियम?",
        },
        statement: {
          en: "Angular momentum Iω is conserved when no external torque acts, so a body that redistributes its own mass closer to the axis must spin faster to compensate.",
          hi: "जब कोई बाह्य बल-आघूर्ण नहीं लगता तो कोणीय संवेग Iω संरक्षित रहता है, अतः जो पिंड अपना द्रव्यमान अक्ष के पास पुनर्वितरित करता है उसे भरपाई में तेज़ घूमना पड़ता है।",
          mr: "जेव्हा कोणतेही बाह्य बलआघूर्ण लागत नाही तेव्हा कोनीय संवेग Iω संरक्षित राहतो, म्हणून जो पिंड आपले वस्तुमान अक्षाजवळ पुनर्वितरित करतो त्याला भरपाईसाठी अधिक वेगाने फिरावे लागते.",
        },
        detail: {
          en: "Kinetic energy is not conserved in the process: the skater's rotational energy rises, and the extra joules come from the muscular work she does pulling her arms inwards against their tendency to fly out.",
          hi: "इस प्रक्रिया में गतिज ऊर्जा संरक्षित नहीं रहती: स्केटर की घूर्णी ऊर्जा बढ़ती है, और अतिरिक्त जूल उस पेशीय कार्य से आते हैं जो वह बाँहों को बाहर उड़ने की प्रवृत्ति के विरुद्ध भीतर खींचने में करती है।",
          mr: "या प्रक्रियेत गतिज ऊर्जा संरक्षित राहत नाही: स्केटरची परिवलनी ऊर्जा वाढते, आणि जादा ज्यूल त्या स्नायुकार्यातून येतात जे ती हात बाहेर उडण्याच्या प्रवृत्तीविरुद्ध आत खेचताना करते.",
        },
        extra: {
          en: "The same law keeps a planet moving faster near the Sun than far from it, which is Kepler's second law restated, and it is why a bicycle wheel resists being tipped while it spins.",
          hi: "यही नियम ग्रह को सूर्य के पास दूर की अपेक्षा तेज़ चलाए रखता है, जो केप्लर के दूसरे नियम का ही दूसरा कथन है, और इसी से घूमता साइकिल का पहिया झुकाए जाने का विरोध करता है।",
          mr: "हाच नियम ग्रहाला सूर्याजवळ दूरच्या तुलनेत अधिक वेगाने चालवत ठेवतो, जे केप्लरच्या दुसऱ्या नियमाचेच दुसरे मांडणे, आणि यामुळेच फिरणारे सायकलचे चाक कलवले जाण्यास विरोध करते.",
        },
        pair: {
          left: {
            en: "Fold the arms in and the spin speeds up by itself",
            hi: "बाँहें समेटो और घुमाव अपने आप तेज़ हो जाता है",
            mr: "हात मिटवा आणि फिरणे आपोआप वेगवान होते",
          },
          right: {
            en: "conservation of angular momentum",
            hi: "कोणीय संवेग का संरक्षण",
            mr: "कोनीय संवेगाचे संरक्षण",
          },
        },
      },
      {
        id: "rolling-without-slipping",
        name: {
          en: "Rolling without slipping",
          hi: "बिना फिसले लोटन",
          mr: "न घसरता घरंगळणे",
        },
        kind: "principle",
        prompt: {
          en: "The point of a wheel touching the road is momentarily at rest with respect to the road, which is why the tyre leaves no smear and why v equals ωR exactly. Which condition is this?",
          hi: "सड़क को छूता पहिये का बिंदु सड़क के सापेक्ष क्षण भर के लिए विराम में होता है, इसीलिए टायर कोई लकीर नहीं छोड़ता और इसीलिए v ठीक ωR के बराबर होता है। यह कौन-सी शर्त है?",
          mr: "रस्त्याला स्पर्श करणारा चाकाचा बिंदू रस्त्याच्या सापेक्ष क्षणभर स्थिर असतो, म्हणूनच टायर कोणताही ओघळ सोडत नाही आणि म्हणूनच v नेमका ωR इतका असतो. ही कोणती अट?",
        },
        statement: {
          en: "Rolling without slipping requires the contact point to be instantaneously at rest relative to the surface, which fixes the linear speed of the centre as v = ωR.",
          hi: "बिना फिसले लोटन के लिए संपर्क बिंदु का सतह के सापेक्ष तात्क्षणिक विराम में होना ज़रूरी है, जो केंद्र की रैखिक चाल को v = ωR पर बाँध देता है।",
          mr: "न घसरता घरंगळण्यासाठी स्पर्शबिंदू पृष्ठभागाच्या सापेक्ष तात्कालिक स्थिर असणे आवश्यक, जे केंद्राची रेषीय चाल v = ωR वर बांधते.",
        },
        detail: {
          en: "The friction that enforces this condition does no work, precisely because the contact point does not slide, so a rolling body can descend a slope without any energy going to heat.",
          hi: "जो घर्षण इस शर्त को लागू करता है वह कोई कार्य नहीं करता, ठीक इसीलिए कि संपर्क बिंदु फिसलता नहीं, अतः लुढ़कता पिंड बिना किसी ऊर्जा को ऊष्मा में गँवाए ढलान उतर सकता है।",
          mr: "जे घर्षण ही अट लागू करते ते कोणतेही कार्य करत नाही, नेमके यामुळे की स्पर्शबिंदू घसरत नाही, म्हणून घरंगळणारा पिंड कोणतीही ऊर्जा उष्णतेत न गमावता उतार उतरू शकतो.",
        },
        extra: {
          en: "The total kinetic energy of a rolling body splits into ½mv² of travel plus ½Iω² of turning, which is why a rolling cylinder always loses a downhill race to a frictionless sliding block of the same mass.",
          hi: "लुढ़कते पिंड की कुल गतिज ऊर्जा चलने के ½mv² और घूमने के ½Iω² में बँटती है, इसीलिए लुढ़कता बेलन उसी द्रव्यमान के घर्षण-रहित फिसलते गुटके से ढलान की दौड़ सदा हारता है।",
          mr: "घरंगळणाऱ्या पिंडाची एकूण गतिज ऊर्जा प्रवासाच्या ½mv² आणि फिरण्याच्या ½Iω² मध्ये विभागते, म्हणूनच घरंगळणारा दंडगोल त्याच वस्तुमानाच्या घर्षणविरहित घसरणाऱ्या ठोकळ्याकडून उताराची शर्यत नेहमी हरतो.",
        },
        pair: {
          left: {
            en: "The friction that grips and yet does no work",
            hi: "वह घर्षण जो पकड़ता है और फिर भी कार्य नहीं करता",
            mr: "ते घर्षण जे पकडते आणि तरीही कार्य करत नाही",
          },
          right: {
            en: "rolling without slipping",
            hi: "बिना फिसले लोटन",
            mr: "न घसरता घरंगळणे",
          },
        },
      },
      {
        id: "radius-of-gyration",
        name: {
          en: "The radius of gyration",
          hi: "घूर्णन त्रिज्या",
          mr: "परिवलन त्रिज्या",
        },
        kind: "quantity",
        prompt: {
          en: "The whole mass of an irregular body is imagined gathered into a single ring at one particular distance, chosen so that the body's resistance to turning comes out unchanged. Which distance is this?",
          hi: "किसी अनियमित पिंड का पूरा द्रव्यमान एक विशेष दूरी पर एक ही छल्ले में इकट्ठा माना जाता है, यह दूरी ऐसी चुनी जाती है कि पिंड का घूमने का प्रतिरोध अपरिवर्तित निकले। यह कौन-सी दूरी है?",
          mr: "एखाद्या अनियमित पिंडाचे संपूर्ण वस्तुमान एका विशिष्ट अंतरावर एकाच कड्यात गोळा केलेले मानले जाते, हे अंतर असे निवडले जाते की पिंडाचा फिरण्याचा विरोध अपरिवर्तित निघेल. हे कोणते अंतर?",
        },
        statement: {
          en: "The radius of gyration k is defined by I = Mk², so it is the single distance at which the entire mass would have to be placed to give the body its actual moment of inertia.",
          hi: "घूर्णन त्रिज्या k को I = Mk² से परिभाषित किया जाता है, अतः वह वह अकेली दूरी है जिस पर पूरा द्रव्यमान रखने पर पिंड को उसका वास्तविक जड़त्व आघूर्ण मिलेगा।",
          mr: "परिवलन त्रिज्या k ही I = Mk² ने व्याख्यायित होते, म्हणून ते ते एकमेव अंतर ज्यावर संपूर्ण वस्तुमान ठेवल्यास पिंडाला त्याचे प्रत्यक्ष जडत्व आघूर्ण मिळेल.",
        },
        detail: {
          en: "It is a purely geometric length once the axis is fixed, independent of how heavy the body is, so two discs of different materials but the same shape share the same value.",
          hi: "अक्ष तय हो जाने पर यह विशुद्ध ज्यामितीय लंबाई है, इस पर निर्भर नहीं कि पिंड कितना भारी है, अतः भिन्न पदार्थों की पर एक ही आकार की दो चकतियाँ वही मान साझा करती हैं।",
          mr: "अक्ष ठरल्यावर ही निव्वळ भूमितीय लांबी, पिंड किती जड आहे यावर अवलंबून नाही, म्हणून वेगळ्या पदार्थांच्या पण एकाच आकाराच्या दोन चकत्या तेच मूल्य वाटून घेतात.",
        },
        extra: {
          en: "For a thin ring it equals the radius itself, since every particle already lies at that distance, and for every other shape about the same axis it is smaller.",
          hi: "पतले छल्ले के लिए वह स्वयं त्रिज्या के बराबर है, क्योंकि हर कण पहले से उसी दूरी पर है, और उसी अक्ष के परितः हर दूसरे आकार के लिए वह छोटी होती है।",
          mr: "पातळ कड्यासाठी ती स्वतः त्रिज्येइतकी, कारण प्रत्येक कण आधीच त्याच अंतरावर आहे, आणि त्याच अक्षाभोवती इतर प्रत्येक आकारासाठी ती लहान असते.",
        },
        pair: {
          left: {
            en: "A length that does not care what the body is made of",
            hi: "ऐसी लंबाई जिसे इससे मतलब नहीं कि पिंड किसका बना है",
            mr: "अशी लांबी जिला पिंड कशाचा बनला याची पर्वा नाही",
          },
          right: {
            en: "the radius of gyration",
            hi: "घूर्णन त्रिज्या",
            mr: "परिवलन त्रिज्या",
          },
        },
      },
      /*F6*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A solid cylinder and a frictionless block of the same mass are released together from the same height on the same slope. The block reaches the bottom first. A student says friction slowed the cylinder down. Explain what actually happened, given that rolling friction here does no work.",
          hi: "समान द्रव्यमान का ठोस बेलन और घर्षण-रहित गुटका उसी ढलान पर उसी ऊँचाई से साथ छोड़े जाते हैं। गुटका पहले तल पर पहुँचता है। एक विद्यार्थी कहता है कि घर्षण ने बेलन को धीमा किया। समझाओ वस्तुतः हुआ क्या, यह देखते हुए कि यहाँ लोटन-घर्षण कोई कार्य नहीं करता।",
          mr: "समान वस्तुमानाचा भरीव दंडगोल आणि घर्षणविरहित ठोकळा त्याच उतारावर त्याच उंचीवरून एकत्र सोडले जातात. ठोकळा आधी तळाशी पोहोचतो. एक विद्यार्थी म्हणतो की घर्षणाने दंडगोल मंदावला. प्रत्यक्षात काय घडले ते समजावा, हे लक्षात घेऊन की इथले घरंगळ-घर्षण कोणतेही कार्य करत नाही.",
        },
        choices: [
          {
            en: "No energy was lost at all. Both bodies arrive with exactly the same total kinetic energy, mgh. The block puts all of it into ½mv²; the cylinder must split it, because rolling without slipping forces ω = v/R, so part of the store goes into ½Iω² of turning. With I = ½mR² for a solid cylinder the split is two-thirds travelling and one-third turning, leaving the cylinder slower at the bottom. Friction here supplies the torque that makes it roll and does no work, since the contact point never slides",
            hi: "कोई ऊर्जा खोई ही नहीं। दोनों पिंड ठीक उसी कुल गतिज ऊर्जा mgh के साथ पहुँचते हैं। गुटका उसका सब ½mv² में डाल देता है; बेलन को बाँटना पड़ता है, क्योंकि बिना फिसले लोटन ω = v/R को बाध्य करता है, अतः भंडार का एक हिस्सा घूमने के ½Iω² में जाता है। ठोस बेलन के लिए I = ½mR² के साथ बँटवारा दो-तिहाई चलने में और एक-तिहाई घूमने में होता है, जिससे बेलन तल पर धीमा रहता है। यहाँ घर्षण वह बल-आघूर्ण देता है जो उसे लुढ़काता है और कोई कार्य नहीं करता, क्योंकि संपर्क बिंदु कभी फिसलता ही नहीं",
            mr: "कोणतीही ऊर्जा गमावलीच नाही. दोन्ही पिंड नेमक्या त्याच एकूण गतिज ऊर्जेसह — mgh — पोहोचतात. ठोकळा ती सर्व ½mv² मध्ये टाकतो; दंडगोलाला विभागावी लागते, कारण न घसरता घरंगळणे ω = v/R ला भाग पाडते, म्हणून साठ्याचा काही भाग फिरण्याच्या ½Iω² मध्ये जातो. भरीव दंडगोलासाठी I = ½mR² सह विभागणी दोन-तृतीयांश प्रवासात आणि एक-तृतीयांश फिरण्यात होते, ज्यामुळे दंडगोल तळाशी सावकाश राहतो. इथले घर्षण त्याला घरंगळवणारे बलआघूर्ण पुरवते आणि कोणतेही कार्य करत नाही, कारण स्पर्शबिंदू कधीही घसरत नाही",
          },
          {
            en: "The student is right: friction converted part of the cylinder's energy into heat, which is why it arrived with less",
            hi: "विद्यार्थी सही है: घर्षण ने बेलन की कुछ ऊर्जा ऊष्मा में बदल दी, इसीलिए वह कम लेकर पहुँचा",
            mr: "विद्यार्थी बरोबर: घर्षणाने दंडगोलाची काही ऊर्जा उष्णतेत बदलली, म्हणून तो कमी घेऊन पोहोचला",
          },
          {
            en: "The cylinder is slower because its mass is spread out, so gravity has to pull on a larger volume",
            hi: "बेलन इसलिए धीमा है कि उसका द्रव्यमान फैला हुआ है, अतः गुरुत्व को बड़े आयतन को खींचना पड़ता है",
            mr: "दंडगोल यामुळे सावकाश की त्याचे वस्तुमान पसरलेले आहे, म्हणून गुरुत्वाला मोठे घनफळ ओढावे लागते",
          },
          {
            en: "The two must in fact arrive together, since energy conservation gives both v = √(2gh) regardless of shape",
            hi: "दोनों को वस्तुतः साथ ही पहुँचना चाहिए, क्योंकि ऊर्जा-संरक्षण आकार से परे दोनों को v = √(2gh) देता है",
            mr: "दोघांनी प्रत्यक्षात एकत्रच पोहोचायला हवे, कारण ऊर्जा-संरक्षण आकाराची पर्वा न करता दोघांना v = √(2gh) देते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Begin with what is the same for both, because that is the surprising part. Each body starts at rest at height h and ends at the bottom, and in each case the only force doing work is gravity — for the block because the slope is frictionless, for the cylinder because rolling friction acts at a point that is instantaneously at rest and therefore does no work at all. So both arrive with total kinetic energy exactly mgh. Nothing has been lost by either. What differs is how that energy has to be spent. The block has only one way to hold kinetic energy: ½mv². Setting mgh = ½mv² gives v = √(2gh), the familiar result. The cylinder has two accounts, and the rolling condition means it cannot choose between them. Rolling without slipping ties ω to v by ω = v/R, so a cylinder moving at v is necessarily spinning at v/R — the two are not independent. Its total kinetic energy is ½mv² + ½Iω², and for a solid cylinder I = ½mR², so ½Iω² = ½ × ½mR² × v²/R² = ¼mv². The total is therefore ½mv² + ¼mv² = ¾mv². Setting that equal to mgh gives v = √(4gh/3), which is smaller than √(2gh) by a factor of √(2/3), about 0.82. The cylinder arrives at 82 per cent of the block's speed, and it does so having spent one third of its energy on rotation and two thirds on travel. So the cylinder is not slower because energy went missing. It is slower because a fixed budget had to be divided, and only the translational share shows up as speed along the slope. This is why the answer depends on shape and not on mass or radius: substitute a hollow ring, where I = mR², and the split becomes half and half, giving v = √(gh) — slower still. A race down a slope between a ring, a solid cylinder and a sphere is decided entirely by which has the smaller fraction of its mass far from the axis, and the sphere wins because its mass is most tightly gathered. Neither the mass nor the radius appears anywhere in the final speeds, so a marble and a cannonball of the same shape tie exactly. Two further points settle the wrong answers. Friction here is static, not kinetic: the contact point does not slide, so there is no relative motion at the point of application, and work is force times the displacement OF THE POINT WHERE THE FORCE ACTS, which is zero. That is why no heat is generated and why a rolling ball can roll for a long way. And the last option is a trap worth naming: energy conservation does apply to both, but it constrains the TOTAL kinetic energy, not the speed. Reading mgh = ½mv² for a rolling body is exactly the step that omits the rotational account. (The other wrong answers destroy energy that has been shown to be intact, or make gravity's pull depend on how the mass is arranged, which it never does.)",
          hi: "पहले वह देखो जो दोनों के लिए एक-सा है, क्योंकि चौंकाने वाला हिस्सा वही है। हर पिंड ऊँचाई h पर विराम से चलता है और तल पर समाप्त होता है, और दोनों में कार्य करने वाला एकमात्र बल गुरुत्व है — गुटके के लिए इसलिए कि ढलान घर्षण-रहित है, बेलन के लिए इसलिए कि लोटन-घर्षण ऐसे बिंदु पर लगता है जो तात्क्षणिक रूप से विराम में है और इसलिए कोई कार्य करता ही नहीं। अतः दोनों ठीक mgh कुल गतिज ऊर्जा लेकर पहुँचते हैं। किसी ने कुछ खोया नहीं। भिन्न यह है कि वह ऊर्जा ख़र्च कैसे करनी पड़ती है। गुटके के पास गतिज ऊर्जा रखने का एक ही तरीक़ा है: ½mv². mgh = ½mv² रखने पर v = √(2gh) मिलता है, जाना-पहचाना परिणाम। बेलन के पास दो खाते हैं, और लोटन की शर्त का अर्थ है कि वह उनमें से चुन नहीं सकता। बिना फिसले लोटन ω को v से ω = v/R द्वारा बाँध देता है, अतः v से चलता बेलन अनिवार्यतः v/R से घूम रहा है — दोनों स्वतंत्र नहीं। उसकी कुल गतिज ऊर्जा ½mv² + ½Iω² है, और ठोस बेलन के लिए I = ½mR², अतः ½Iω² = ½ × ½mR² × v²/R² = ¼mv². कुल इसलिए ½mv² + ¼mv² = ¾mv². उसे mgh के बराबर रखने पर v = √(4gh/3) मिलता है, जो √(2gh) से √(2/3) यानी लगभग 0.82 गुना छोटा है। बेलन गुटके की चाल के 82 प्रतिशत पर पहुँचता है, और ऐसा वह अपनी एक तिहाई ऊर्जा घूर्णन पर और दो तिहाई चलने पर ख़र्च करके करता है। अतः बेलन इसलिए धीमा नहीं कि ऊर्जा लुप्त हुई। वह इसलिए धीमा है कि एक तय बजट बाँटना पड़ा, और केवल स्थानांतरण वाला हिस्सा ढलान पर चाल के रूप में दिखता है। इसीलिए उत्तर आकार पर निर्भर है, द्रव्यमान या त्रिज्या पर नहीं: खोखला छल्ला रखो, जहाँ I = mR², और बँटवारा आधा-आधा हो जाता है, जिससे v = √(gh) — और भी धीमा। ढलान पर छल्ले, ठोस बेलन और गोले की दौड़ पूरी तरह इससे तय होती है कि किसका द्रव्यमान अक्ष से दूर कम अनुपात में है, और गोला जीतता है क्योंकि उसका द्रव्यमान सबसे कसकर सिमटा है। अंतिम चालों में न द्रव्यमान कहीं आता है न त्रिज्या, अतः एक ही आकार के कंचे और तोप के गोले की ठीक बराबरी रहती है। दो और बातें ग़लत उत्तरों को निपटा देती हैं। यहाँ घर्षण स्थैतिक है, गतिज नहीं: संपर्क बिंदु फिसलता नहीं, अतः बल लगने के बिंदु पर कोई सापेक्ष गति नहीं, और कार्य बल गुणा उस बिंदु का विस्थापन है जहाँ बल लगता है, जो शून्य है। इसीलिए कोई ऊष्मा नहीं बनती और इसीलिए लुढ़कती गेंद दूर तक लुढ़क सकती है। और अंतिम विकल्प नाम लेने योग्य जाल है: ऊर्जा-संरक्षण दोनों पर लागू होता ही है, पर वह कुल गतिज ऊर्जा को बाँधता है, चाल को नहीं। लुढ़कते पिंड के लिए mgh = ½mv² पढ़ना ठीक वही क़दम है जो घूर्णी खाता छोड़ देता है। (बाक़ी ग़लत उत्तर उस ऊर्जा को नष्ट कर देते जो सलामत सिद्ध हो चुकी, या गुरुत्व के खिंचाव को इस पर निर्भर बना देते कि द्रव्यमान जमाया कैसे गया, जो वह कभी नहीं होता।)",
          mr: "आधी दोघांसाठी जे सारखे आहे ते पाहा, कारण चकित करणारा भागच तोच. प्रत्येक पिंड h उंचीवर स्थिरावस्थेतून सुरू होतो आणि तळाशी संपतो, आणि दोन्हींत कार्य करणारे एकमेव बल गुरुत्व — ठोकळ्यासाठी कारण उतार घर्षणविरहित, दंडगोलासाठी कारण घरंगळ-घर्षण अशा बिंदूवर लागते जो तात्कालिक स्थिर आहे आणि म्हणून कोणतेही कार्य करतच नाही. म्हणून दोघेही नेमकी mgh ही एकूण गतिज ऊर्जा घेऊन पोहोचतात. कोणीही काहीही गमावलेले नाही. वेगळे हे की ती ऊर्जा खर्च कशी करावी लागते. ठोकळ्याकडे गतिज ऊर्जा ठेवण्याचा एकच मार्ग: ½mv². mgh = ½mv² ठेवल्यास v = √(2gh), ओळखीचा निकाल. दंडगोलाकडे दोन खाती, आणि घरंगळण्याच्या अटीचा अर्थ तो त्यांतून निवडू शकत नाही. न घसरता घरंगळणे ω ला v शी ω = v/R ने बांधते, म्हणून v ने जाणारा दंडगोल अपरिहार्यपणे v/R ने फिरत आहे — दोन्ही स्वतंत्र नाहीत. त्याची एकूण गतिज ऊर्जा ½mv² + ½Iω², आणि भरीव दंडगोलासाठी I = ½mR², म्हणून ½Iω² = ½ × ½mR² × v²/R² = ¼mv². एकूण म्हणून ½mv² + ¼mv² = ¾mv². ते mgh इतके ठेवल्यास v = √(4gh/3), जे √(2gh) हून √(2/3) म्हणजे सुमारे 0.82 पट लहान. दंडगोल ठोकळ्याच्या चालीच्या 82 टक्क्यांवर पोहोचतो, आणि तो असे आपली एक तृतीयांश ऊर्जा परिवलनावर आणि दोन तृतीयांश प्रवासावर खर्चून करतो. म्हणून दंडगोल ऊर्जा हरवली म्हणून सावकाश नाही. तो यामुळे सावकाश की ठरलेला अर्थसंकल्प विभागावा लागला, आणि केवळ स्थानांतरणाचा वाटा उतारावर चाल म्हणून दिसतो. म्हणूनच उत्तर आकारावर अवलंबून, वस्तुमान वा त्रिज्येवर नाही: पोकळे कडे ठेवा, जिथे I = mR², आणि विभागणी अर्धी-अर्धी होते, ज्यातून v = √(gh) — आणखी सावकाश. उतारावरची कडे, भरीव दंडगोल आणि गोल यांची शर्यत पूर्णपणे कोणाचे वस्तुमान अक्षापासून दूर कमी प्रमाणात आहे यावरून ठरते, आणि गोल जिंकतो कारण त्याचे वस्तुमान सर्वांत घट्ट एकवटलेले. शेवटच्या चालींत ना वस्तुमान कुठे येते ना त्रिज्या, म्हणून एकाच आकाराची गोटी आणि तोफगोळा नेमकी बरोबरी करतात. आणखी दोन मुद्दे चुकीची उत्तरे निकाली काढतात. इथले घर्षण स्थितिक आहे, गतिज नव्हे: स्पर्शबिंदू घसरत नाही, म्हणून बल लागण्याच्या बिंदूवर कोणतीही सापेक्ष गती नाही, आणि कार्य म्हणजे बल गुणिले ज्या बिंदूवर बल लागते त्याचे विस्थापन, जे शून्य आहे. म्हणूनच कोणतीही उष्णता तयार होत नाही आणि म्हणूनच घरंगळणारा चेंडू दूरवर घरंगळू शकतो. आणि शेवटचा पर्याय नाव घेण्याजोगा सापळा: ऊर्जा-संरक्षण दोघांनाही लागू होतेच, पण ते एकूण गतिज ऊर्जेला बांधते, चालीला नाही. घरंगळणाऱ्या पिंडासाठी mgh = ½mv² वाचणे हेच नेमके ते पाऊल जे परिवलनी खाते वगळते. (उरलेली चुकीची उत्तरे शाबूत सिद्ध झालेली ऊर्जा नष्ट करतात, वा गुरुत्वाची ओढ वस्तुमान कसे मांडले यावर अवलंबून बनवतात, जे ती कधीही नसते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A skater spinning freely pulls her arms in, reducing her moment of inertia from 6 kg m² to 2 kg m². A student checks the numbers and finds her kinetic energy has tripled, and concludes that angular momentum cannot really have been conserved. Resolve this.",
          hi: "स्वतंत्र रूप से घूमती स्केटर बाँहें समेटती है, जिससे उसका जड़त्व आघूर्ण 6 kg m² से घटकर 2 kg m² हो जाता है। एक विद्यार्थी संख्याएँ जाँचकर पाता है कि उसकी गतिज ऊर्जा तीन गुनी हो गई, और निष्कर्ष निकालता है कि कोणीय संवेग वस्तुतः संरक्षित हो ही नहीं सकता। इसे सुलझाओ।",
          mr: "मुक्तपणे फिरणारी स्केटर हात मिटवते, ज्यामुळे तिचे जडत्व आघूर्ण 6 kg m² वरून 2 kg m² होते. एक विद्यार्थी आकडे तपासून पाहतो की तिची गतिज ऊर्जा तिप्पट झाली, आणि निष्कर्ष काढतो की कोनीय संवेग खरोखर संरक्षित होऊच शकत नाही. हे सोडवा.",
        },
        choices: [
          {
            en: "Angular momentum was conserved and kinetic energy was not, and there is no contradiction because nothing requires both. Iω is fixed, so ω triples when I falls to a third. But the energy is ½Iω², which carries ω squared, so it goes up by 3²/3 = 3. The extra energy is real and its source is identifiable: the skater's muscles did work pulling her arms inwards against the outward tendency of the rotating masses. Let her arms out again and she does negative work, the energy returns, and the spin slows to its original rate",
            hi: "कोणीय संवेग संरक्षित रहा और गतिज ऊर्जा नहीं, और इसमें कोई विरोधाभास नहीं क्योंकि दोनों की माँग कहीं नहीं। Iω तय है, अतः I एक तिहाई होने पर ω तीन गुना हो जाता है। पर ऊर्जा ½Iω² है, जो ω का वर्ग ढोती है, अतः वह 3²/3 = 3 गुना बढ़ती है। अतिरिक्त ऊर्जा असली है और उसका स्रोत पहचाना जा सकता है: स्केटर की पेशियों ने घूमते द्रव्यमानों की बाहर जाने की प्रवृत्ति के विरुद्ध बाँहें भीतर खींचकर कार्य किया। बाँहें फिर फैलाओ और वह ऋणात्मक कार्य करती है, ऊर्जा लौट आती है, और घुमाव अपनी मूल दर पर धीमा हो जाता है",
            mr: "कोनीय संवेग संरक्षित राहिला आणि गतिज ऊर्जा नाही, आणि यात कोणताही विरोधाभास नाही कारण दोन्हींची मागणी कुठेही नाही. Iω ठरलेला, म्हणून I एक तृतीयांश होताच ω तिप्पट होतो. पण ऊर्जा ½Iω² आहे, जी ω चा वर्ग वाहते, म्हणून ती 3²/3 = 3 पट वाढते. जादा ऊर्जा खरी आहे आणि तिचा स्रोत ओळखता येतो: स्केटरच्या स्नायूंनी फिरणाऱ्या वस्तुमानांच्या बाहेर जाण्याच्या प्रवृत्तीविरुद्ध हात आत खेचून कार्य केले. हात पुन्हा पसरू द्या आणि ती ऋण कार्य करते, ऊर्जा परत येते, आणि फिरणे आपल्या मूळ दराने मंदावते",
          },
          {
            en: "The student is right: energy conservation is the deeper law, so angular momentum must have been supplied from outside by the ice",
            hi: "विद्यार्थी सही है: ऊर्जा-संरक्षण गहरा नियम है, अतः कोणीय संवेग बाहर से बर्फ़ द्वारा दिया गया होगा",
            mr: "विद्यार्थी बरोबर: ऊर्जा-संरक्षण हा खोल नियम, म्हणून कोनीय संवेग बाहेरून बर्फाने दिला गेला असणार",
          },
          {
            en: "The energy did not really change; the student has forgotten that ½Iω² is independent of I once ω is known",
            hi: "ऊर्जा वस्तुतः बदली नहीं; विद्यार्थी भूल गया कि ω ज्ञात होने पर ½Iω² I से स्वतंत्र है",
            mr: "ऊर्जा प्रत्यक्षात बदललीच नाही; विद्यार्थी विसरला की ω माहीत असल्यावर ½Iω² हे I पासून स्वतंत्र आहे",
          },
          {
            en: "Both quantities are conserved, and the apparent tripling comes from measuring in the rotating frame rather than the ground frame",
            hi: "दोनों राशियाँ संरक्षित हैं, और तीन गुना दिखना ज़मीन के तंत्र के बजाय घूमते तंत्र में नापने से आता है",
            mr: "दोन्ही राशी संरक्षित आहेत, आणि तिप्पट दिसणे जमिनीच्या चौकटीऐवजी फिरत्या चौकटीत मोजल्याने येते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Put the arithmetic down first. Angular momentum L = Iω is conserved because no external torque acts about the vertical axis — the ice is nearly frictionless, and the skater's own muscles are internal to her. So 6ω₀ = 2ω₁ and ω₁ = 3ω₀: the spin triples. Kinetic energy before is ½ × 6 × ω₀² = 3ω₀². After it is ½ × 2 × (3ω₀)² = ½ × 2 × 9ω₀² = 9ω₀². The energy has indeed tripled, and the student's arithmetic is impeccable. What is wrong is the inference. There is no law saying kinetic energy is conserved. The conservation laws are separate statements with separate conditions, and it is a mistake to expect them to move together. Linear momentum is conserved when no external force acts; angular momentum when no external torque acts; total energy always, but MECHANICAL energy only when the forces doing work are conservative. Here the muscles are doing work, so mechanical energy is under no obligation to stay put. Where the algebra makes it inevitable is worth seeing. Write the energy in terms of the conserved quantity: E = ½Iω² = ½(Iω)²/I = L²/(2I). With L fixed, energy is inversely proportional to I. Reduce I to a third and the energy triples, necessarily. This form makes the whole result transparent — you cannot change I at fixed L without changing the energy, so the question is never whether energy changes but only where it comes from. It comes from the skater. Consider what her arms are doing while she pulls them in. Each hand is moving in a circle, and to bring it closer to the axis she must exert an inward force on a mass that is going round; that force acts through an inward displacement, so it does positive work. In the rotating frame it feels like fighting a centrifugal pull, and the sensation is accurate about the effort even though the force is fictitious. The joules come from her metabolism, in exactly the same way as the joules for a jump. The process is reversible, which is the clinching evidence. Let the arms out again and the same forces act through outward displacements, so the work is now negative: the skater absorbs energy, her spin drops back to ω₀, and both L and E return to their initial values. Nothing was created or destroyed at any stage. Two applications are worth carrying. A planet in an elliptical orbit obeys the same relation, speeding up near the Sun where its distance from the focus is small — Kepler's second law is angular momentum conservation in disguise, and there the work is done by gravity rather than by muscles, so the mechanical energy does stay constant. And a collapsing star spins up spectacularly for the same reason: a stellar core the size of the Sun contracting to a neutron star twenty kilometres across increases its rotation rate by a factor of billions, which is why pulsars flash many times a second. (The wrong answers invent an external torque the ice cannot supply, misstate the energy formula, or hide a real physical change behind a change of frame.)",
          hi: "पहले गणित रख दो। कोणीय संवेग L = Iω संरक्षित है क्योंकि ऊर्ध्वाधर अक्ष के परितः कोई बाह्य बल-आघूर्ण नहीं लगता — बर्फ़ लगभग घर्षण-रहित है, और स्केटर की अपनी पेशियाँ उसके लिए आंतरिक हैं। अतः 6ω₀ = 2ω₁ और ω₁ = 3ω₀: घुमाव तीन गुना। पहले गतिज ऊर्जा ½ × 6 × ω₀² = 3ω₀². बाद में ½ × 2 × (3ω₀)² = ½ × 2 × 9ω₀² = 9ω₀². ऊर्जा सचमुच तीन गुनी हुई, और विद्यार्थी का गणित निर्दोष है। ग़लत उसका अनुमान है। ऐसा कोई नियम नहीं जो कहे कि गतिज ऊर्जा संरक्षित है। संरक्षण-नियम भिन्न शर्तों वाले भिन्न कथन हैं, और उनसे साथ-साथ चलने की अपेक्षा करना भूल है। रैखिक संवेग तब संरक्षित है जब कोई बाह्य बल न लगे; कोणीय संवेग तब जब कोई बाह्य बल-आघूर्ण न लगे; कुल ऊर्जा सदा, पर यांत्रिक ऊर्जा केवल तब जब कार्य करने वाले बल संरक्षी हों। यहाँ पेशियाँ कार्य कर रही हैं, अतः यांत्रिक ऊर्जा पर टिके रहने की कोई बाध्यता नहीं। बीजगणित इसे कहाँ अनिवार्य बना देता है, यह देखने योग्य है। ऊर्जा को संरक्षित राशि के पदों में लिखो: E = ½Iω² = ½(Iω)²/I = L²/(2I). L तय हो तो ऊर्जा I के व्युत्क्रमानुपाती है। I को एक तिहाई करो और ऊर्जा अनिवार्यतः तीन गुनी हो जाती है। यह रूप पूरा परिणाम पारदर्शी कर देता है — तुम L स्थिर रखते हुए I बदल ही नहीं सकते बिना ऊर्जा बदले, अतः प्रश्न कभी यह नहीं कि ऊर्जा बदलती है या नहीं बल्कि केवल यह कि वह आती कहाँ से है। वह स्केटर से आती है। सोचो बाँहें समेटते समय वे कर क्या रही हैं। हर हाथ वृत्त में चल रहा है, और उसे अक्ष के पास लाने के लिए उसे ऐसे द्रव्यमान पर भीतरी बल लगाना पड़ता है जो घूम रहा है; वह बल भीतरी विस्थापन से होकर लगता है, अतः धनात्मक कार्य करता है। घूमते तंत्र में यह अपकेंद्री खिंचाव से लड़ने जैसा लगता है, और अनुभूति परिश्रम के बारे में सही है यद्यपि बल काल्पनिक है। जूल उसके उपापचय से आते हैं, ठीक वैसे जैसे कूद के जूल आते हैं। प्रक्रिया उत्क्रमणीय है, और यही निर्णायक प्रमाण है। बाँहें फिर फैलाओ और वही बल बाहरी विस्थापनों से होकर लगते हैं, अतः कार्य अब ऋणात्मक है: स्केटर ऊर्जा सोख लेती है, उसका घुमाव ω₀ पर लौट आता है, और L तथा E दोनों अपने आरंभिक मानों पर आ जाते हैं। किसी चरण पर कुछ न बना न नष्ट हुआ। दो अनुप्रयोग ले जाने योग्य हैं। दीर्घवृत्तीय कक्षा में ग्रह वही संबंध मानता है, सूर्य के पास तेज़ होता जहाँ नाभि से उसकी दूरी कम है — केप्लर का दूसरा नियम भेस बदले कोणीय संवेग का संरक्षण ही है, और वहाँ कार्य पेशियाँ नहीं गुरुत्व करता है, अतः यांत्रिक ऊर्जा अचर बनी रहती है। और ढहता तारा उसी कारण नाटकीय रूप से तेज़ घूमने लगता है: सूर्य के आकार का तारकीय क्रोड सिकुड़कर बीस किलोमीटर का न्यूट्रॉन तारा बने तो उसकी घूर्णन-दर अरबों गुना बढ़ जाती है, इसीलिए पल्सर सेकंड में कई बार चमकते हैं। (ग़लत उत्तर ऐसा बाह्य बल-आघूर्ण गढ़ते जो बर्फ़ दे नहीं सकती, ऊर्जा-सूत्र ग़लत कहते, या असली भौतिक परिवर्तन को तंत्र-परिवर्तन के पीछे छिपा देते हैं।)",
          mr: "आधी आकडेमोड मांडा. कोनीय संवेग L = Iω संरक्षित आहे कारण उभ्या अक्षाभोवती कोणतेही बाह्य बलआघूर्ण लागत नाही — बर्फ जवळपास घर्षणविरहित, आणि स्केटरचे स्वतःचे स्नायू तिच्यासाठी आंतरिक. म्हणून 6ω₀ = 2ω₁ आणि ω₁ = 3ω₀: फिरणे तिप्पट. आधीची गतिज ऊर्जा ½ × 6 × ω₀² = 3ω₀². नंतरची ½ × 2 × (3ω₀)² = ½ × 2 × 9ω₀² = 9ω₀². ऊर्जा खरोखर तिप्पट झाली, आणि विद्यार्थ्याचे गणित निर्दोष. चूक त्याच्या अनुमानात. गतिज ऊर्जा संरक्षित आहे असे सांगणारा कोणताही नियम नाही. संरक्षण-नियम वेगळ्या अटींची वेगळी विधाने आहेत, आणि त्यांनी एकत्र चालावे अशी अपेक्षा करणे चूक. रेषीय संवेग तेव्हा संरक्षित जेव्हा कोणतेही बाह्य बल लागत नाही; कोनीय संवेग तेव्हा जेव्हा कोणतेही बाह्य बलआघूर्ण लागत नाही; एकूण ऊर्जा नेहमी, पण यांत्रिक ऊर्जा केवळ तेव्हा जेव्हा कार्य करणारी बले संरक्षी असतात. इथे स्नायू कार्य करत आहेत, म्हणून यांत्रिक ऊर्जेवर टिकून राहण्याचे कोणतेही बंधन नाही. बीजगणित हे कुठे अपरिहार्य करते ते पाहण्याजोगे. ऊर्जा संरक्षित राशीच्या भाषेत लिहा: E = ½Iω² = ½(Iω)²/I = L²/(2I). L ठरलेला असल्यास ऊर्जा I च्या व्यस्तानुपाती. I एक तृतीयांश करा आणि ऊर्जा अपरिहार्यपणे तिप्पट होते. हे रूप अख्खा निकाल पारदर्शक करते — तुम्ही L स्थिर ठेवून I बदलूच शकत नाही ऊर्जा न बदलता, म्हणून प्रश्न कधीच ऊर्जा बदलते का हा नसतो तर ती येते कुठून हाच असतो. ती स्केटरकडून येते. हात आत खेचताना ते काय करत आहेत ते पाहा. प्रत्येक हात वर्तुळात फिरत आहे, आणि त्याला अक्षाजवळ आणायला तिला फिरणाऱ्या वस्तुमानावर आतले बल लावावे लागते; ते बल आतल्या विस्थापनातून लागते, म्हणून ते धन कार्य करते. फिरत्या चौकटीत हे अपकेंद्री ओढीशी लढल्यासारखे वाटते, आणि संवेदना श्रमाबद्दल बरोबर आहे जरी बल काल्पनिक असले तरी. ज्यूल तिच्या चयापचयातून येतात, नेमके तसेच जसे उडीचे ज्यूल येतात. प्रक्रिया उलट करता येते, आणि हाच निर्णायक पुरावा. हात पुन्हा पसरू द्या आणि तीच बले बाहेरच्या विस्थापनांतून लागतात, म्हणून कार्य आता ऋण: स्केटर ऊर्जा शोषून घेते, तिचे फिरणे ω₀ वर परतते, आणि L व E दोन्ही आपल्या सुरुवातीच्या मूल्यांवर येतात. कोणत्याही टप्प्यावर काहीही निर्माण वा नष्ट झाले नाही. दोन उपयोजने नेण्याजोगी. लंबवर्तुळाकार कक्षेतील ग्रह तोच संबंध पाळतो, सूर्याजवळ वेगवान होत जिथे नाभीपासूनचे त्याचे अंतर कमी — केप्लरचा दुसरा नियम हा वेष बदललेला कोनीय संवेगाचा संरक्षणच, आणि तिथे कार्य स्नायू नव्हे तर गुरुत्व करते, म्हणून यांत्रिक ऊर्जा अचल राहते. आणि कोसळणारा तारा त्याच कारणाने नाट्यमयरीत्या वेगात फिरू लागतो: सूर्याएवढा तारकीय गाभा आकुंचून वीस किलोमीटरचा न्यूट्रॉन तारा बनला तर त्याचा परिवलन-दर अब्जावधी पटींनी वाढतो, म्हणूनच पल्सार सेकंदाला अनेकदा चमकतात. (चुकीची उत्तरे बर्फ पुरवू शकत नाही असे बाह्य बलआघूर्ण घडवतात, ऊर्जा-सूत्र चुकीचे सांगतात, वा खरा भौतिक बदल चौकट-बदलामागे लपवतात.)",
        },
      },
      /*H6*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Gravitation                                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-gravitation",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 7 — Gravitation",
      hi: "अध्याय 7 — गुरुत्वाकर्षण",
      mr: "प्रकरण 7 — गुरुत्वाकर्षण",
    },
    name: {
      en: "Gravitation",
      hi: "गुरुत्वाकर्षण",
      mr: "गुरुत्वाकर्षण",
    },
    summary: {
      en: "One law written for a falling apple turned out to be running the solar system: a force that thins as the square of the distance, a constant of nature beside a local number that changes with latitude and altitude, an area swept out at a fixed rate whether a planet is near or far, a speed above which nothing ever returns, and astronauts who are not weightless at all but simply falling, along with their spacecraft, for ever.",
      hi: "गिरते सेब के लिए लिखा एक नियम निकला सौर मंडल चला रहा था: वह बल जो दूरी के वर्ग के अनुपात में पतला होता है, प्रकृति का एक स्थिरांक और उसके बगल में वह स्थानीय संख्या जो अक्षांश तथा ऊँचाई से बदलती है, वह क्षेत्रफल जो ग्रह के पास या दूर होने पर भी नियत दर से बुहारा जाता है, वह चाल जिसके ऊपर कुछ भी कभी नहीं लौटता, और वे अंतरिक्ष यात्री जो भारहीन हैं ही नहीं बल्कि अपने यान समेत सदा गिरते रहते हैं।",
      mr: "पडणाऱ्या सफरचंदासाठी लिहिलेला एक नियम निघाला सूर्यमाला चालवत होता: ते बल जे अंतराच्या वर्गाच्या प्रमाणात विरळ होते, निसर्गाचा एक स्थिरांक आणि त्याशेजारी ती स्थानिक संख्या जी अक्षांश व उंचीने बदलते, ते क्षेत्रफळ जे ग्रह जवळ असो वा दूर, ठरलेल्या दराने झाडले जाते, ती चाल जिच्यावर काहीही कधीही परतत नाही, आणि ते अंतराळवीर जे वजनरहित नाहीतच तर आपल्या यानासह कायम पडत राहतात.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "inverse-square-law",
        name: {
          en: "The inverse-square law",
          hi: "व्युत्क्रम वर्ग नियम",
          mr: "व्यस्त वर्ग नियम",
        },
        kind: "law",
        prompt: {
          en: "Move to three times the separation and the attraction falls not to a third but to a ninth, because the pull spreads over a surface whose area grows as the square of the radius. Which law is this?",
          hi: "दूरी तीन गुनी करो और आकर्षण एक तिहाई नहीं बल्कि एक नौवाँ रह जाता है, क्योंकि खिंचाव ऐसी सतह पर फैलता है जिसका क्षेत्रफल त्रिज्या के वर्ग के अनुपात में बढ़ता है। यह कौन-सा नियम है?",
          mr: "अंतर तिप्पट करा आणि आकर्षण एक तृतीयांश नव्हे तर एक नवमांश उरते, कारण ओढ अशा पृष्ठभागावर पसरते ज्याचे क्षेत्रफळ त्रिज्येच्या वर्गाच्या प्रमाणात वाढते. हा कोणता नियम?",
        },
        statement: {
          en: "The gravitational force between two masses is proportional to the product of the masses and inversely proportional to the square of the distance between their centres.",
          hi: "दो द्रव्यमानों के बीच गुरुत्वीय बल द्रव्यमानों के गुणनफल के समानुपाती और उनके केंद्रों के बीच की दूरी के वर्ग के व्युत्क्रमानुपाती है।",
          mr: "दोन वस्तुमानांमधले गुरुत्वीय बल वस्तुमानांच्या गुणाकाराशी समानुपाती आणि त्यांच्या केंद्रांमधल्या अंतराच्या वर्गाशी व्यस्तानुपाती असते.",
        },
        detail: {
          en: "A uniform sphere attracts everything outside it exactly as though its whole mass sat at its centre, which is the theorem that lets the Earth's radius be used as the distance for a body on its surface.",
          hi: "समांग गोला अपने बाहर की हर चीज़ को ठीक वैसे खींचता है मानो उसका पूरा द्रव्यमान उसके केंद्र पर बैठा हो, और यही वह प्रमेय है जो सतह पर रखे पिंड के लिए पृथ्वी की त्रिज्या को दूरी मानने देती है।",
          mr: "एकसमान गोल आपल्या बाहेरच्या प्रत्येक गोष्टीला नेमके तसे खेचतो जणू त्याचे संपूर्ण वस्तुमान त्याच्या केंद्रावर बसले असावे, आणि हेच ते प्रमेय जे पृष्ठभागावरील पिंडासाठी पृथ्वीची त्रिज्या अंतर म्हणून वापरू देते.",
        },
        extra: {
          en: "The force is always attractive and never shielded, which is why gravitation is feeble between everyday objects and yet governs the largest structures in the universe.",
          hi: "यह बल सदा आकर्षक है और कभी परिरक्षित नहीं होता, इसीलिए रोज़मर्रा की वस्तुओं के बीच गुरुत्वाकर्षण दुर्बल है और फिर भी ब्रह्मांड की सबसे बड़ी संरचनाओं को चलाता है।",
          mr: "हे बल नेहमी आकर्षक असते आणि कधीही अडवले जात नाही, म्हणूनच रोजच्या वस्तूंमध्ये गुरुत्वाकर्षण क्षीण असते आणि तरीही विश्वातील सर्वांत मोठ्या रचना चालवते.",
        },
        pair: {
          left: {
            en: "Three times as far, a ninth as strong",
            hi: "तीन गुना दूर, एक नौवाँ बल",
            mr: "तिप्पट दूर, एक नवमांश जोर",
          },
          right: {
            en: "the inverse-square law",
            hi: "व्युत्क्रम वर्ग नियम",
            mr: "व्यस्त वर्ग नियम",
          },
        },
      },
      {
        id: "little-g-against-big-g",
        name: {
          en: "Little g against big G",
          hi: "छोटा g बनाम बड़ा G",
          mr: "लहान g विरुद्ध मोठा G",
        },
        kind: "law",
        prompt: {
          en: "One of these two is the same everywhere in the universe and was measured in a laboratory with a torsion balance; the other is 9.83 at the poles, 9.78 at the equator, and smaller on a mountain. Which contrast is this?",
          hi: "इन दोनों में से एक ब्रह्मांड में हर जगह एक-सा है और प्रयोगशाला में मरोड़-तुला से नापा गया; दूसरा ध्रुवों पर 9.83, भूमध्य रेखा पर 9.78, और पहाड़ पर उससे कम है। यह कौन-सा भेद है?",
          mr: "यां दोहोंपैकी एक विश्वात सर्वत्र सारखा आणि प्रयोगशाळेत पीळ-तराजूने मोजला गेला; दुसरा ध्रुवांवर 9.83, विषुववृत्तावर 9.78, आणि डोंगरावर त्याहून कमी. हा कोणता भेद?",
        },
        statement: {
          en: "G is a universal constant with the same value everywhere, while g is the local acceleration due to gravity, equal to GM/r² and therefore varying with latitude, altitude and depth.",
          hi: "G सार्वत्रिक स्थिरांक है जिसका मान हर जगह एक-सा है, जबकि g गुरुत्व के कारण स्थानीय त्वरण है, GM/r² के बराबर और इसलिए अक्षांश, ऊँचाई तथा गहराई से बदलता है।",
          mr: "G हा सार्वत्रिक स्थिरांक ज्याचे मूल्य सर्वत्र सारखे, तर g हे गुरुत्वामुळे येणारे स्थानिक त्वरण, GM/r² इतके आणि म्हणून अक्षांश, उंची व खोलीनुसार बदलणारे.",
        },
        detail: {
          en: "It falls off as the inverse square above the surface but falls LINEARLY with depth below it, reaching zero at the centre where the surrounding shell pulls equally in every direction.",
          hi: "सतह के ऊपर वह व्युत्क्रम वर्ग के अनुसार घटता है पर सतह के नीचे गहराई के साथ रैखिक रूप से घटता है, और केंद्र पर शून्य हो जाता है जहाँ चारों ओर का खोल हर दिशा में बराबर खींचता है।",
          mr: "पृष्ठभागाच्या वर तो व्यस्त वर्गानुसार घटतो पण पृष्ठभागाखाली खोलीसह रेषीयरीत्या घटतो, आणि केंद्रावर शून्य होतो जिथे भोवतालचे कवच प्रत्येक दिशेने सारखेच ओढते.",
        },
        extra: {
          en: "Part of the equatorial reduction is not gravity at all but the Earth's rotation, which uses up some of the pull in keeping a body moving in its daily circle.",
          hi: "भूमध्य रेखा पर हुई कमी का एक हिस्सा गुरुत्व है ही नहीं बल्कि पृथ्वी का घूर्णन है, जो खिंचाव का कुछ भाग पिंड को उसके दैनिक वृत्त में चलाए रखने में ख़र्च कर देता है।",
          mr: "विषुववृत्तावरील घटीचा काही भाग गुरुत्व नाहीच तर पृथ्वीचे परिवलन आहे, जे ओढीचा काही भाग पिंडाला त्याच्या दैनंदिन वर्तुळात चालवत ठेवण्यात खर्चते.",
        },
        pair: {
          left: {
            en: "One universal, one different on every mountain",
            hi: "एक सार्वत्रिक, एक हर पहाड़ पर भिन्न",
            mr: "एक सार्वत्रिक, एक प्रत्येक डोंगरावर वेगळा",
          },
          right: {
            en: "little g against big G",
            hi: "छोटा g बनाम बड़ा G",
            mr: "लहान g विरुद्ध मोठा G",
          },
        },
      },
      {
        id: "law-of-equal-areas",
        name: {
          en: "The law of equal areas",
          hi: "समान क्षेत्रफल का नियम",
          mr: "समान क्षेत्रफळाचा नियम",
        },
        kind: "law",
        prompt: {
          en: "A planet races through the part of its orbit nearest the Sun and dawdles at the far end, in such a way that the line joining it to the Sun sweeps the same amount in any given month. Which of Kepler's laws is this?",
          hi: "ग्रह अपनी कक्षा के सूर्य से निकटतम भाग में दौड़ता है और दूर के छोर पर सुस्ताता है, इस तरह कि उसे सूर्य से जोड़ने वाली रेखा किसी भी दिए महीने में उतना ही बुहारती है। यह केप्लर का कौन-सा नियम है?",
          mr: "ग्रह आपल्या कक्षेच्या सूर्याजवळच्या भागातून धावतो आणि दूरच्या टोकाला रेंगाळतो, अशा रीतीने की त्याला सूर्याशी जोडणारी रेषा कोणत्याही दिलेल्या महिन्यात तितकेच झाडते. हा केप्लरचा कोणता नियम?",
        },
        statement: {
          en: "Kepler's second law says the line from the Sun to a planet sweeps out equal areas in equal times, so the planet moves fastest at perihelion and slowest at aphelion.",
          hi: "केप्लर का दूसरा नियम कहता है कि सूर्य से ग्रह तक की रेखा बराबर समय में बराबर क्षेत्रफल बुहारती है, अतः ग्रह उपसौर पर सबसे तेज़ और अपसौर पर सबसे धीमा चलता है।",
          mr: "केप्लरचा दुसरा नियम सांगतो की सूर्यापासून ग्रहापर्यंतची रेषा समान काळात समान क्षेत्रफळ झाडते, म्हणून ग्रह उपसूर्यबिंदूवर सर्वांत वेगवान आणि अपसूर्यबिंदूवर सर्वांत सावकाश जातो.",
        },
        detail: {
          en: "It is conservation of angular momentum in disguise: gravity always points at the Sun, so it exerts no torque about the Sun and the planet's angular momentum cannot change.",
          hi: "यह भेस बदले कोणीय संवेग का संरक्षण है: गुरुत्व सदा सूर्य की ओर होता है, अतः वह सूर्य के परितः कोई बल-आघूर्ण नहीं लगाता और ग्रह का कोणीय संवेग बदल नहीं सकता।",
          mr: "हा वेष बदललेला कोनीय संवेगाचा संरक्षण नियम: गुरुत्व नेहमी सूर्याकडे असते, म्हणून ते सूर्याभोवती कोणतेही बलआघूर्ण लावत नाही आणि ग्रहाचा कोनीय संवेग बदलू शकत नाही.",
        },
        extra: {
          en: "It applies to any force directed always at a fixed point, whatever its strength law, which is why the equal-area result was true before anyone knew the inverse square.",
          hi: "यह हर उस बल पर लागू है जो सदा किसी नियत बिंदु की ओर हो, उसका बल-नियम चाहे जो हो, इसीलिए समान क्षेत्रफल वाला परिणाम व्युत्क्रम वर्ग जाने जाने से पहले भी सच था।",
          mr: "हा प्रत्येक अशा बलाला लागू जे नेहमी एका ठरलेल्या बिंदूकडे असते, त्याचा बल-नियम काहीही असो, म्हणूनच समान क्षेत्रफळाचा निकाल व्यस्त वर्ग कळण्याआधीही खरा होता.",
        },
        pair: {
          left: {
            en: "Fast when near, slow when far, area unchanged",
            hi: "पास हो तो तेज़, दूर हो तो धीमा, क्षेत्रफल वही",
            mr: "जवळ असता वेगवान, दूर असता सावकाश, क्षेत्रफळ तेच",
          },
          right: {
            en: "the law of equal areas",
            hi: "समान क्षेत्रफल का नियम",
            mr: "समान क्षेत्रफळाचा नियम",
          },
        },
      },
      {
        id: "escape-speed",
        name: {
          en: "Escape speed",
          hi: "पलायन चाल",
          mr: "मुक्ती चाल",
        },
        kind: "consequence",
        prompt: {
          en: "Throw a stone upwards fast enough and it never comes down, not because gravity stops but because the pull weakens quicker than the stone runs out of kinetic energy — and the threshold is the same for a pebble and a battleship. Which quantity is this?",
          hi: "पत्थर को पर्याप्त तेज़ ऊपर फेंको और वह कभी नहीं लौटता, इसलिए नहीं कि गुरुत्व रुक जाता है बल्कि इसलिए कि खिंचाव उससे तेज़ी से दुर्बल होता है जितनी तेज़ी से पत्थर की गतिज ऊर्जा चुकती है — और यह सीमा कंकड़ और युद्धपोत दोनों के लिए एक ही है। यह कौन-सी राशि है?",
          mr: "दगड पुरेशा वेगाने वर फेका आणि तो कधीही परतत नाही, गुरुत्व थांबते म्हणून नव्हे तर ओढ दगडाची गतिज ऊर्जा संपण्याहून अधिक वेगाने क्षीण होते म्हणून — आणि ही मर्यादा खडा आणि युद्धनौका दोघांसाठी एकच. ही कोणती राशी?",
        },
        statement: {
          en: "Escape speed is √(2GM/R), the least speed at which a body projected from a surface never returns, and it is independent of the escaping body's own mass.",
          hi: "पलायन चाल √(2GM/R) है, वह न्यूनतम चाल जिससे सतह से फेंका गया पिंड कभी नहीं लौटता, और वह पलायन करते पिंड के अपने द्रव्यमान से स्वतंत्र है।",
          mr: "मुक्ती चाल म्हणजे √(2GM/R), ती किमान चाल जिच्याने पृष्ठभागावरून फेकलेला पिंड कधीही परतत नाही, आणि ती सुटणाऱ्या पिंडाच्या स्वतःच्या वस्तुमानापासून स्वतंत्र आहे.",
        },
        detail: {
          en: "It is exactly √2 times the speed of a satellite skimming the same surface, so about 11.2 km/s for the Earth against an orbital 7.9 km/s.",
          hi: "वह उसी सतह के पास चक्कर लगाते उपग्रह की चाल का ठीक √2 गुना है, अतः पृथ्वी के लिए लगभग 11.2 km/s के सामने कक्षीय 7.9 km/s.",
          mr: "ती त्याच पृष्ठभागाजवळून फिरणाऱ्या उपग्रहाच्या चालीच्या नेमकी √2 पट, म्हणून पृथ्वीसाठी सुमारे 11.2 km/s च्या समोर कक्षीय 7.9 km/s.",
        },
        extra: {
          en: "It explains which worlds keep an atmosphere: the Moon's is 2.4 km/s, below the speed of many gas molecules, so whatever air it once had has long since leaked away.",
          hi: "यही बताता है कि कौन-से लोक वायुमंडल रखते हैं: चंद्रमा की 2.4 km/s है, कई गैस अणुओं की चाल से कम, अतः उसके पास जो भी हवा कभी थी वह कब की रिस चुकी।",
          mr: "हेच सांगते की कोणते जग वातावरण राखतात: चंद्राची 2.4 km/s आहे, अनेक वायुरेणूंच्या चालीहून कमी, म्हणून त्याच्याकडे जी काही हवा कधी होती ती केव्हाच निसटून गेली.",
        },
        pair: {
          left: {
            en: "The same threshold for a pebble and a battleship",
            hi: "कंकड़ और युद्धपोत के लिए वही सीमा",
            mr: "खडा आणि युद्धनौकेसाठी तीच मर्यादा",
          },
          right: {
            en: "escape speed",
            hi: "पलायन चाल",
            mr: "मुक्ती चाल",
          },
        },
      },
      {
        id: "weightlessness-in-orbit",
        name: {
          en: "Weightlessness in orbit",
          hi: "कक्षा में भारहीनता",
          mr: "कक्षेतील वजनरहितता",
        },
        kind: "consequence",
        prompt: {
          en: "An astronaut four hundred kilometres up is held by a gravitational pull almost as strong as at sea level, yet floats — because the station's floor is falling away beneath at exactly the rate the astronaut falls. Which condition is this?",
          hi: "चार सौ किलोमीटर ऊपर का अंतरिक्ष यात्री लगभग समुद्र-तल जितने ही प्रबल गुरुत्वीय खिंचाव में बँधा है, फिर भी तैरता है — क्योंकि स्टेशन का फ़र्श नीचे ठीक उसी दर से गिरता जा रहा है जिस दर से यात्री। यह कौन-सी स्थिति है?",
          mr: "चारशे किलोमीटर वरचा अंतराळवीर जवळपास समुद्रसपाटीइतक्याच प्रबळ गुरुत्वीय ओढीत बांधलेला असतो, तरीही तरंगतो — कारण स्थानकाची जमीन खाली नेमक्या त्याच दराने पडत असते ज्या दराने अंतराळवीर. ही कोणती स्थिती?",
        },
        statement: {
          en: "Orbital weightlessness is free fall, not an absence of gravity: the spacecraft and everything in it accelerate towards the Earth together, so nothing presses on anything and no scale can register a reading.",
          hi: "कक्षीय भारहीनता मुक्त पतन है, गुरुत्व की अनुपस्थिति नहीं: यान और उसमें रखा सब कुछ मिलकर पृथ्वी की ओर त्वरित होते हैं, अतः कुछ किसी पर दबाव नहीं डालता और कोई तराज़ू पाठ्यांक दर्ज नहीं कर सकता।",
          mr: "कक्षेतील वजनरहितता म्हणजे मुक्त पतन, गुरुत्वाची अनुपस्थिती नव्हे: यान आणि त्यातले सर्व एकत्रच पृथ्वीकडे त्वरित होतात, म्हणून काहीही कशावर दाब देत नाही आणि कोणताही काटा वाचन नोंदवू शकत नाही.",
        },
        detail: {
          en: "At the station's altitude g is still about 8.7 m/s², roughly nine-tenths of its surface value, so the pull is very much present and is precisely what curves the orbit.",
          hi: "स्टेशन की ऊँचाई पर g अब भी लगभग 8.7 m/s² है, सतह के मान का लगभग नौ-दसवाँ, अतः खिंचाव पूरी तरह मौजूद है और वही कक्षा को मोड़ता है।",
          mr: "स्थानकाच्या उंचीवर g अजूनही सुमारे 8.7 m/s² आहे, पृष्ठभागाच्या मूल्याचा साधारण नऊ-दशांश, म्हणून ओढ पूर्णपणे उपस्थित आहे आणि तीच कक्षा वळवते.",
        },
        extra: {
          en: "The same sensation is available in a falling lift or at the top of a roller-coaster drop, and it lasts exactly as long as nothing supports the floor.",
          hi: "वही अनुभूति गिरती लिफ़्ट में या रोलर-कोस्टर की ढलान के शिखर पर भी मिलती है, और वह ठीक तब तक रहती है जब तक फ़र्श को कोई सहारा नहीं देता।",
          mr: "तीच संवेदना पडणाऱ्या लिफ्टमध्ये वा रोलर-कोस्टरच्या उताराच्या शिखरावरही मिळते, आणि ती नेमकी तोवर टिकते जोवर जमिनीला कोणताही आधार नसतो.",
        },
        pair: {
          left: {
            en: "Falling for ever and missing the ground",
            hi: "सदा गिरते रहना और ज़मीन से चूकते रहना",
            mr: "कायम पडत राहणे आणि जमीन चुकवत राहणे",
          },
          right: {
            en: "weightlessness in orbit",
            hi: "कक्षा में भारहीनता",
            mr: "कक्षेतील वजनरहितता",
          },
        },
      },
      {
        id: "geostationary-orbit",
        name: {
          en: "The geostationary orbit",
          hi: "भूस्थिर कक्षा",
          mr: "भूस्थिर कक्षा",
        },
        kind: "consequence",
        prompt: {
          en: "There is exactly one radius, about 36,000 km above the equator, at which a satellite's period comes out at 24 hours, so a dish once aimed at it never has to be moved again. Which orbit is this?",
          hi: "भूमध्य रेखा के ऊपर लगभग 36,000 km पर ठीक एक ही त्रिज्या है जिस पर उपग्रह का आवर्तकाल 24 घंटे निकलता है, अतः एक बार उस पर ताना गया डिश फिर कभी हिलाना नहीं पड़ता। यह कौन-सी कक्षा है?",
          mr: "विषुववृत्ताच्या वर सुमारे 36,000 km वर नेमकी एकच त्रिज्या आहे जिच्यावर उपग्रहाचा आवर्तकाल 24 तास निघतो, म्हणून एकदा त्यावर रोखलेली डिश पुन्हा कधीही हलवावी लागत नाही. ही कोणती कक्षा?",
        },
        statement: {
          en: "A geostationary satellite orbits directly above the equator with a period of exactly one sidereal day, so it stays fixed above one point of the rotating Earth.",
          hi: "भूस्थिर उपग्रह ठीक भूमध्य रेखा के ऊपर ऐसी कक्षा में घूमता है जिसका आवर्तकाल ठीक एक नाक्षत्र दिवस है, अतः वह घूमती पृथ्वी के एक ही बिंदु के ऊपर टिका रहता है।",
          mr: "भूस्थिर उपग्रह नेमका विषुववृत्ताच्या वर अशा कक्षेत फिरतो जिचा आवर्तकाल नेमका एक नक्षत्र-दिवस, म्हणून तो फिरत्या पृथ्वीच्या एकाच बिंदूवर टिकून राहतो.",
        },
        detail: {
          en: "The radius is forced by Kepler's third law once the period is chosen, so the altitude is not a design choice at all but a consequence of the Earth's mass and its rotation rate.",
          hi: "आवर्तकाल चुन लेने पर त्रिज्या केप्लर के तीसरे नियम से बाध्य हो जाती है, अतः ऊँचाई कोई अभिकल्प-चुनाव है ही नहीं बल्कि पृथ्वी के द्रव्यमान और उसकी घूर्णन-दर का परिणाम है।",
          mr: "आवर्तकाल निवडताच त्रिज्या केप्लरच्या तिसऱ्या नियमाने सक्तीची होते, म्हणून उंची ही रचना-निवड नाहीच तर पृथ्वीचे वस्तुमान आणि तिचा परिवलन-दर यांचा परिणाम.",
        },
        extra: {
          en: "It cannot serve the high latitudes well, which is why polar-orbiting satellites at a few hundred kilometres are used for imaging and weather over the poles.",
          hi: "वह ऊँचे अक्षांशों की अच्छी सेवा नहीं कर सकती, इसीलिए ध्रुवों के ऊपर चित्रण और मौसम के लिए कुछ सौ किलोमीटर पर ध्रुवीय कक्षा वाले उपग्रह लगाए जाते हैं।",
          mr: "ती उच्च अक्षांशांची चांगली सेवा करू शकत नाही, म्हणूनच ध्रुवांवरील प्रतिमांकन व हवामानासाठी काहीशे किलोमीटरवर ध्रुवीय कक्षेतील उपग्रह वापरले जातात.",
        },
        pair: {
          left: {
            en: "Aim the dish once and never move it again",
            hi: "डिश एक बार तानो और फिर कभी न हिलाओ",
            mr: "डिश एकदा रोखा आणि पुन्हा कधीही हलवू नका",
          },
          right: {
            en: "the geostationary orbit",
            hi: "भूस्थिर कक्षा",
            mr: "भूस्थिर कक्षा",
          },
        },
      },
      /*F7*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A television report says astronauts on the space station float because there is no gravity that far from the Earth. The station orbits at about 400 km, where the Earth's radius is 6400 km. Assess the claim quantitatively and give the correct explanation.",
          hi: "एक टीवी रिपोर्ट कहती है कि अंतरिक्ष स्टेशन के यात्री इसलिए तैरते हैं कि पृथ्वी से उतनी दूर गुरुत्व है ही नहीं। स्टेशन लगभग 400 km पर परिक्रमा करता है, जहाँ पृथ्वी की त्रिज्या 6400 km है। दावे का संख्यात्मक आकलन करो और सही व्याख्या दो।",
          mr: "एक दूरचित्रवाणी वृत्त सांगते की अंतराळ स्थानकावरील अंतराळवीर यासाठी तरंगतात की पृथ्वीपासून तितक्या दूर गुरुत्व नाहीच. स्थानक सुमारे 400 km वर परिभ्रमण करते, जिथे पृथ्वीची त्रिज्या 6400 km आहे. दाव्याचे संख्यात्मक मूल्यमापन करा आणि योग्य स्पष्टीकरण द्या.",
        },
        choices: [
          {
            en: "The claim is badly wrong. The station's orbital radius is 6800 km against the surface's 6400, a ratio of 1.0625, so g there is 9.8/1.0625² ≈ 8.7 m/s² — about 89 per cent of its surface value. Gravity is almost undiminished, and it is exactly that pull which bends the station's path into a circle. The astronauts float because they and the station are in free fall together, accelerating towards the Earth at the same rate, so nothing presses on anything and no scale reads anything",
            hi: "दावा बुरी तरह ग़लत है। स्टेशन की कक्षीय त्रिज्या 6800 km है, सतह की 6400 के सामने, अनुपात 1.0625, अतः वहाँ g = 9.8/1.0625² ≈ 8.7 m/s² — सतह के मान का लगभग 89 प्रतिशत। गुरुत्व लगभग अघटा है, और ठीक वही खिंचाव स्टेशन के पथ को वृत्त में मोड़ता है। यात्री इसलिए तैरते हैं कि वे और स्टेशन साथ मुक्त पतन में हैं, एक ही दर से पृथ्वी की ओर त्वरित होते हुए, अतः कुछ किसी पर दबाव नहीं डालता और कोई तराज़ू कुछ नहीं दिखाता",
            mr: "दावा वाईटरीत्या चुकीचा. स्थानकाची कक्षीय त्रिज्या 6800 km, पृष्ठभागाच्या 6400 समोर, गुणोत्तर 1.0625, म्हणून तिथे g = 9.8/1.0625² ≈ 8.7 m/s² — पृष्ठभागाच्या मूल्याच्या सुमारे 89 टक्के. गुरुत्व जवळपास अघटित आहे, आणि नेमकी तीच ओढ स्थानकाचा मार्ग वर्तुळात वळवते. अंतराळवीर यासाठी तरंगतात की ते आणि स्थानक एकत्र मुक्त पतनात आहेत, एकाच दराने पृथ्वीकडे त्वरित होत, म्हणून काहीही कशावर दाब देत नाही आणि कोणताही काटा काहीही दाखवत नाही",
          },
          {
            en: "The report is right: 400 km is far enough for gravity to have fallen essentially to zero, which is what allows an orbit at all",
            hi: "रिपोर्ट सही है: 400 km इतनी दूर है कि गुरुत्व लगभग शून्य हो जाता है, और यही कक्षा को संभव बनाता है",
            mr: "वृत्त बरोबर आहे: 400 km इतके दूर की गुरुत्व जवळपास शून्य होते, आणि हेच कक्षा शक्य करते",
          },
          {
            en: "Gravity is undiminished, and the astronauts float because the station's speed produces a real outward force that balances it exactly",
            hi: "गुरुत्व अघटा है, और यात्री इसलिए तैरते हैं कि स्टेशन की चाल एक असली बाहरी बल पैदा करती है जो उसे ठीक-ठीक संतुलित कर देता है",
            mr: "गुरुत्व अघटित आहे, आणि अंतराळवीर यासाठी तरंगतात की स्थानकाची चाल एक खरे बाहेरचे बल निर्माण करते जे त्याला नेमके संतुलित करते",
          },
          {
            en: "The astronauts are weightless because the station is above the atmosphere, and it is air pressure that gives objects their weight",
            hi: "यात्री इसलिए भारहीन हैं कि स्टेशन वायुमंडल के ऊपर है, और वस्तुओं को भार वायुदाब ही देता है",
            mr: "अंतराळवीर यासाठी वजनरहित की स्थानक वातावरणाच्या वर आहे, आणि वस्तूंना वजन हवेचा दाबच देतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Do the arithmetic before arguing, because it settles the matter in one line. Gravity falls off as the inverse square of the distance from the Earth's CENTRE, not from its surface — a distinction the report has quietly lost. The surface is 6400 km from the centre; the station is 6400 + 400 = 6800 km from it. The ratio of distances is 6800/6400 = 1.0625, so the ratio of accelerations is 1/1.0625² = 0.886. At the station g is about 8.7 m/s², nearly nine-tenths of its value in the room you are sitting in. A 70 kg astronaut is being pulled with about 609 N, which on a bathroom scale at sea level would read as roughly 62 kg. There is nothing remotely like an absence of gravity. Now the real explanation, which is more interesting than the false one. The astronaut is in free fall — accelerating downwards at 8.7 m/s² — and so is the station, and so is the pen floating beside them, and so is every wall and floor and instrument. Every object present has the same acceleration, because gravitational acceleration does not depend on mass. Nothing therefore catches up with anything else, nothing presses on anything else, and there is no contact force anywhere in the cabin. What a bathroom scale measures is never weight directly; it measures the contact force between you and it. On the ground that force equals your weight because the floor must stop you falling. In orbit there is nothing to stop, so the contact force is zero and the scale reads zero. The sensation is genuine and the interpretation 'no gravity' is not. Why does the station not simply fall to the ground, then? It does fall — continuously — but it is also moving sideways at about 7.7 km/s, and the Earth's surface curves away beneath it at very nearly the rate at which it falls towards that surface. That is what an orbit is: a projectile trajectory that keeps missing. Newton's own thought experiment makes the point exactly — fire a cannonball fast enough from a mountaintop and it never lands. Two of the wrong answers are worth naming. The third invents an outward force. In the ground frame no such force exists; the net force on the station is inward, of magnitude mv²/r, and it is supplied entirely by gravity. That inward force is not balanced by anything, and if it were, the station would travel in a straight line and leave. The fourth confuses weight with buoyancy: air pressure does exert a small upward buoyant force on everything, but removing it would make you very slightly HEAVIER on a scale, not weightless. A vacuum chamber on the ground demonstrates this in an afternoon. The general lesson is that 'weightless' names a sensation and not a physical condition, and the honest phrase is free fall. It is available in a dropped lift, in an aircraft flying a parabolic arc, and at the top of a fairground drop — all of them with the full strength of gravity present throughout. (The remaining wrong answer takes the report at face value and would leave the orbit itself unexplained: with no gravity the station would fly off along a tangent and never come back.)",
          hi: "बहस से पहले गणना करो, क्योंकि वह मामला एक पंक्ति में निपटा देती है। गुरुत्व पृथ्वी के केंद्र से दूरी के व्युत्क्रम वर्ग के अनुसार घटता है, सतह से नहीं — यह भेद रिपोर्ट चुपचाप खो चुकी है। सतह केंद्र से 6400 km है; स्टेशन उससे 6400 + 400 = 6800 km. दूरियों का अनुपात 6800/6400 = 1.0625, अतः त्वरणों का अनुपात 1/1.0625² = 0.886. स्टेशन पर g लगभग 8.7 m/s² है, उस कमरे के मान का लगभग नौ-दसवाँ जिसमें तुम बैठे हो। 70 kg के यात्री को लगभग 609 N से खींचा जा रहा है, जो समुद्र-तल पर तराज़ू पर मोटे तौर पर 62 kg दिखाता। गुरुत्व की अनुपस्थिति जैसा दूर-दूर तक कुछ नहीं। अब असली व्याख्या, जो झूठी से अधिक दिलचस्प है। यात्री मुक्त पतन में है — 8.7 m/s² से नीचे त्वरित — और स्टेशन भी, और उनके बगल तैरती क़लम भी, और हर दीवार, फ़र्श तथा उपकरण भी। उपस्थित हर वस्तु का त्वरण एक ही है, क्योंकि गुरुत्वीय त्वरण द्रव्यमान पर निर्भर नहीं। अतः कुछ किसी से आगे नहीं निकलता, कुछ किसी पर दबाव नहीं डालता, और केबिन में कहीं कोई संपर्क बल नहीं। तराज़ू कभी सीधे भार नहीं नापता; वह तुम्हारे और अपने बीच का संपर्क बल नापता है। ज़मीन पर वह बल तुम्हारे भार के बराबर है क्योंकि फ़र्श को तुम्हें गिरने से रोकना है। कक्षा में रोकने को कुछ है ही नहीं, अतः संपर्क बल शून्य है और तराज़ू शून्य दिखाता है। अनुभूति सच्ची है और 'गुरुत्व नहीं' वाली व्याख्या नहीं। तो फिर स्टेशन ज़मीन पर गिर क्यों नहीं जाता? वह गिरता है — लगातार — पर वह लगभग 7.7 km/s से बग़ल में भी चल रहा है, और पृथ्वी की सतह उसके नीचे लगभग उसी दर से मुड़ती जाती है जिससे वह उस सतह की ओर गिरता है। कक्षा यही है: ऐसा प्रक्षेप्य-पथ जो चूकता रहता है। न्यूटन का अपना विचार-प्रयोग यही बात ठीक कहता है — पहाड़ की चोटी से तोप का गोला पर्याप्त तेज़ दागो और वह कभी नहीं उतरता। दो ग़लत उत्तर नाम लेने योग्य हैं। तीसरा एक बाहरी बल गढ़ता है। ज़मीन के तंत्र में ऐसा कोई बल नहीं; स्टेशन पर परिणामी बल भीतर की ओर है, परिमाण mv²/r, और वह पूरी तरह गुरुत्व से आता है। वह भीतरी बल किसी से संतुलित नहीं, और होता तो स्टेशन सीधी रेखा में चलकर निकल जाता। चौथा भार को उत्प्लावन से गड्डमड्ड करता है: वायुदाब हर चीज़ पर छोटा ऊर्ध्वमुखी उत्प्लावन बल लगाता है, पर उसे हटा देने से तराज़ू पर तुम बहुत थोड़े भारी होते, भारहीन नहीं। ज़मीन पर निर्वात कक्ष एक दोपहर में यह दिखा देता है। सामान्य सबक़ यह कि 'भारहीन' एक अनुभूति का नाम है, भौतिक स्थिति का नहीं, और ईमानदार शब्द मुक्त पतन है। वह गिरती लिफ़्ट में, परवलयी चाप पर उड़ते विमान में, और मेले के झूले की ढलान के शिखर पर मिलती है — इन सब में गुरुत्व पूरी ताक़त से पूरे समय मौजूद रहता है। (बचा हुआ ग़लत उत्तर रिपोर्ट को ज्यों का त्यों मान लेता है और कक्षा को ही अव्याख्यायित छोड़ देता: गुरुत्व न हो तो स्टेशन स्पर्शरेखा पर उड़ जाता और कभी नहीं लौटता।)",
          mr: "वाद घालण्याआधी आकडेमोड करा, कारण ती प्रकरण एका ओळीत निकाली काढते. गुरुत्व पृथ्वीच्या केंद्रापासूनच्या अंतराच्या व्यस्त वर्गानुसार घटते, पृष्ठभागापासून नव्हे — हा भेद वृत्ताने गुपचूप गमावला आहे. पृष्ठभाग केंद्रापासून 6400 km; स्थानक त्यापासून 6400 + 400 = 6800 km. अंतरांचे गुणोत्तर 6800/6400 = 1.0625, म्हणून त्वरणांचे गुणोत्तर 1/1.0625² = 0.886. स्थानकावर g सुमारे 8.7 m/s², तुम्ही बसला आहात त्या खोलीतल्या मूल्याच्या जवळपास नऊ-दशांश. 70 kg च्या अंतराळवीराला सुमारे 609 N ने ओढले जात आहे, जे समुद्रसपाटीवर काट्यावर ढोबळमानाने 62 kg दाखवले असते. गुरुत्वाच्या अनुपस्थितीसारखे दूरवरही काहीही नाही. आता खरे स्पष्टीकरण, जे खोट्याहून अधिक रोचक. अंतराळवीर मुक्त पतनात आहे — 8.7 m/s² ने खाली त्वरित — आणि स्थानकही, आणि त्यांच्याशेजारी तरंगणारी लेखणीही, आणि प्रत्येक भिंत, जमीन व उपकरणही. उपस्थित प्रत्येक वस्तूचे त्वरण एकच, कारण गुरुत्वीय त्वरण वस्तुमानावर अवलंबून नाही. म्हणून काहीही कशाच्या पुढे जात नाही, काहीही कशावर दाब देत नाही, आणि कक्षात कुठेही कोणतेही स्पर्श बल नाही. काटा कधीही थेट वजन मोजत नाही; तो तुमच्यातले आणि स्वतःमधले स्पर्श बल मोजतो. जमिनीवर ते बल तुमच्या वजनाइतके कारण जमिनीला तुम्हाला पडण्यापासून थांबवायचे असते. कक्षेत थांबवायला काहीच नाही, म्हणून स्पर्श बल शून्य आणि काटा शून्य दाखवतो. संवेदना खरी आणि 'गुरुत्व नाही' हे स्पष्टीकरण नाही. मग स्थानक जमिनीवर पडत का नाही? ते पडतेच — सतत — पण ते सुमारे 7.7 km/s ने बाजूलाही जात आहे, आणि पृथ्वीचा पृष्ठभाग त्याच्याखाली जवळपास त्याच दराने वळत जातो ज्या दराने ते त्या पृष्ठभागाकडे पडते. कक्षा हीच: असा प्रक्षेप्य-मार्ग जो चुकत राहतो. न्यूटनचा स्वतःचा विचारप्रयोग हेच नेमके सांगतो — डोंगरमाथ्यावरून तोफगोळा पुरेशा वेगाने झाडा आणि तो कधीही उतरत नाही. दोन चुकीची उत्तरे नाव घेण्याजोगी. तिसरे बाहेरचे बल घडवते. जमिनीच्या चौकटीत असे कोणतेही बल नाही; स्थानकावरचे परिणामी बल आतल्या दिशेने, परिमाण mv²/r, आणि ते पूर्णपणे गुरुत्वातून येते. ते आतले बल कशानेही संतुलित नाही, आणि असते तर स्थानक सरळ रेषेत जाऊन निघून गेले असते. चौथे वजन आणि प्लावकतेची गल्लत करते: हवेचा दाब प्रत्येक गोष्टीवर लहान वरचे प्लावक बल लावतो, पण ते काढून टाकल्यास काट्यावर तुम्ही फार थोडे जड झाला असता, वजनरहित नाही. जमिनीवरचा निर्वात कक्ष हे एका दुपारीत दाखवून देतो. सामान्य धडा हा की 'वजनरहित' हे संवेदनेचे नाव, भौतिक स्थितीचे नव्हे, आणि प्रामाणिक शब्द मुक्त पतन. ती पडणाऱ्या लिफ्टमध्ये, परवलयी कमानीवर उडणाऱ्या विमानात, आणि जत्रेतल्या झुल्याच्या उताराच्या शिखरावर मिळते — या सर्वांत गुरुत्व पूर्ण ताकदीने पूर्ण काळ उपस्थित असते. (उरलेले चुकीचे उत्तर वृत्त जसेच्या तसे मानते आणि कक्षाच अस्पष्ट ठेवते: गुरुत्व नसते तर स्थानक स्पर्शिकेवरून उडून गेले असते आणि कधीही परतले नसते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two objects are dropped from the same height on the Moon, a hammer and a feather, and they land together. On Earth they do not. A student concludes that the Moon's gravity acts equally on all masses while the Earth's does not. Correct this and say what the Moon demonstration actually shows.",
          hi: "चंद्रमा पर उसी ऊँचाई से दो वस्तुएँ गिराई जाती हैं, एक हथौड़ा और एक पंख, और वे साथ उतरते हैं। पृथ्वी पर नहीं। एक विद्यार्थी निष्कर्ष निकालता है कि चंद्रमा का गुरुत्व सब द्रव्यमानों पर बराबर लगता है और पृथ्वी का नहीं। इसे सुधारो और बताओ कि चंद्रमा का प्रदर्शन वस्तुतः क्या दिखाता है।",
          mr: "चंद्रावर त्याच उंचीवरून दोन वस्तू टाकल्या जातात, एक हातोडा आणि एक पीस, आणि त्या एकत्र उतरतात. पृथ्वीवर नाही. एक विद्यार्थी निष्कर्ष काढतो की चंद्राचे गुरुत्व सर्व वस्तुमानांवर समान लागते आणि पृथ्वीचे नाही. हे दुरुस्त करा आणि चंद्रावरचे प्रात्यक्षिक प्रत्यक्षात काय दाखवते ते सांगा.",
        },
        choices: [
          {
            en: "Gravity behaves identically on both worlds. The force on a body is GMm/r², which is proportional to m, and the acceleration is that force divided by m, so m cancels and every body falls at the same rate. What differs is the air: on Earth the feather meets an upward drag comparable to its own weight and the hammer does not, so their NET forces differ. The Moon has no atmosphere, so the demonstration is simply what Earth would show inside a vacuum chamber — and it does",
            hi: "गुरुत्व दोनों लोकों पर एक-सा ही व्यवहार करता है। पिंड पर बल GMm/r² है, जो m का समानुपाती है, और त्वरण वह बल बटा m, अतः m कट जाता है और हर पिंड एक ही दर से गिरता है। भिन्न है हवा: पृथ्वी पर पंख को अपने भार के बराबर का ऊर्ध्वमुखी कर्षण मिलता है और हथौड़े को नहीं, अतः उनके परिणामी बल भिन्न हैं। चंद्रमा पर वायुमंडल नहीं, अतः वह प्रदर्शन बस वही है जो पृथ्वी निर्वात कक्ष के भीतर दिखाती — और दिखाती है",
            mr: "गुरुत्व दोन्ही जगांवर सारखेच वागते. पिंडावरचे बल GMm/r², जे m च्या समानुपाती, आणि त्वरण म्हणजे ते बल भागिले m, म्हणून m कापले जाते आणि प्रत्येक पिंड एकाच दराने पडतो. वेगळी आहे हवा: पृथ्वीवर पिसाला स्वतःच्या वजनाइतका वरचा ओढ मिळतो आणि हातोड्याला नाही, म्हणून त्यांची परिणामी बले वेगळी. चंद्रावर वातावरण नाही, म्हणून ते प्रात्यक्षिक फक्त तेच जे पृथ्वी निर्वात कक्षात दाखवली असती — आणि दाखवते",
          },
          {
            en: "The student is right: the Moon's weaker gravity treats all masses alike, and only a strong field like the Earth's distinguishes between them",
            hi: "विद्यार्थी सही है: चंद्रमा का दुर्बल गुरुत्व सब द्रव्यमानों से एक-सा बर्ताव करता है, और केवल पृथ्वी जैसा प्रबल क्षेत्र उनमें भेद करता है",
            mr: "विद्यार्थी बरोबर: चंद्राचे दुर्बल गुरुत्व सर्व वस्तुमानांशी सारखेच वागते, आणि केवळ पृथ्वीसारखे प्रबळ क्षेत्रच त्यांच्यात भेद करते",
          },
          {
            en: "The two land together on the Moon because its gravity is about a sixth of the Earth's, which gives the feather time to catch up",
            hi: "चंद्रमा पर दोनों साथ इसलिए उतरते हैं कि उसका गुरुत्व पृथ्वी के लगभग छठे भाग का है, जिससे पंख को पकड़ने का समय मिल जाता है",
            mr: "चंद्रावर दोघे एकत्र यासाठी उतरतात की त्याचे गुरुत्व पृथ्वीच्या सुमारे सहाव्या भागाचे आहे, ज्यामुळे पिसाला गाठायला वेळ मिळतो",
          },
          {
            en: "Heavier bodies really do fall faster everywhere, and the Moon result was an artefact of the low-quality television pictures",
            hi: "भारी पिंड हर जगह सचमुच तेज़ गिरते हैं, और चंद्रमा का परिणाम घटिया टीवी चित्रों की कारीगरी था",
            mr: "जड पिंड सर्वत्र खरोखर वेगाने पडतात, आणि चंद्रावरचा निकाल निकृष्ट दूरचित्रवाणी चित्रांची करामत होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Write the two equations side by side and the cancellation is unmissable. The gravitational force on a body of mass m at the surface of a world of mass M and radius R is F = GMm/R². Newton's second law then gives a = F/m = GM/R². The body's own mass has vanished from the answer. It vanished because m appears in two different roles — as the thing gravity pulls on, and as the thing that resists being accelerated — and those two happen to be the same number. That coincidence is not required by anything in Newton's framework; it is an experimental fact, tested to extraordinary precision, and Einstein later made it the foundation of general relativity. But granted it, a hammer and a feather must fall at the same rate on any world whatever, the Earth included. So why do they not, on Earth? Because gravity is not the only force acting. Air exerts a drag that depends on the object's size, shape and speed, not on its mass. For the hammer that drag is a negligible fraction of a large weight, so its acceleration is very nearly g. For the feather the drag is comparable to its tiny weight almost at once, so its NET force is small and it drifts down at a nearly constant terminal speed. The difference between the two falls is entirely a difference in air resistance, and nothing to do with how gravity treats mass. That is exactly why the Apollo 15 demonstration is worth doing on the Moon: there is no air there, so the only force is gravity, and the prediction can be seen with the naked eye. The same experiment works in a vacuum chamber on Earth, and physics departments have been performing it in evacuated tubes since long before spaceflight. Both show the same thing, and the Moon adds no new physics — only a very good stage. Two subtleties are worth keeping. First, the Moon's g really is about 1.6 m/s², roughly a sixth of the Earth's, so the objects fall more SLOWLY there than they would here. But they fall slowly TOGETHER. The strength of the field sets how fast everything falls; it has no bearing on whether different masses fall alike. The third option confuses these two entirely separate facts, which is why it is the most tempting wrong answer. Second, the cancellation is exact only if the falling body's own gravitational pull on the world is ignored — strictly, a hammer attracts the Moon as well, and a truly enormous mass would meet the Moon marginally sooner. The effect is unmeasurably small for anything a person can drop, but it is the reason the statement is usually phrased as 'in the limit of a small test mass'. (The remaining wrong answers make the strength of a field decide whether it discriminates by mass, or discard a result that has been reproduced in every vacuum chamber on Earth.)",
          hi: "दोनों समीकरण अगल-बग़ल लिखो और कटाव देखे बिना नहीं रहता। M द्रव्यमान और R त्रिज्या वाले लोक की सतह पर m द्रव्यमान के पिंड पर गुरुत्वीय बल F = GMm/R² है। न्यूटन का दूसरा नियम तब a = F/m = GM/R² देता है। पिंड का अपना द्रव्यमान उत्तर से ग़ायब हो गया। वह इसलिए ग़ायब हुआ कि m दो भिन्न भूमिकाओं में आता है — उस चीज़ के रूप में जिसे गुरुत्व खींचता है, और उस चीज़ के रूप में जो त्वरित होने का विरोध करती है — और वे दोनों संयोग से एक ही संख्या हैं। यह संयोग न्यूटन के ढाँचे में किसी बात से आवश्यक नहीं; वह प्रायोगिक तथ्य है, असाधारण परिशुद्धता से जाँचा गया, और आइंस्टीन ने बाद में उसे सामान्य आपेक्षिकता की नींव बनाया। पर उसे मान लेने पर हथौड़े और पंख को किसी भी लोक पर, पृथ्वी सहित, एक ही दर से गिरना चाहिए। तो पृथ्वी पर वे गिरते क्यों नहीं? क्योंकि गुरुत्व अकेला लगने वाला बल नहीं। हवा ऐसा कर्षण लगाती है जो वस्तु के आकार, रूप और चाल पर निर्भर है, उसके द्रव्यमान पर नहीं। हथौड़े के लिए वह कर्षण बड़े भार का नगण्य अंश है, अतः उसका त्वरण लगभग g है। पंख के लिए कर्षण लगभग तुरंत उसके नन्हे भार के बराबर हो जाता है, अतः उसका परिणामी बल छोटा है और वह लगभग अचर सीमांत चाल से नीचे बहता है। दोनों पतनों का अंतर पूरी तरह वायु प्रतिरोध का अंतर है, और इससे इसका कोई लेना-देना नहीं कि गुरुत्व द्रव्यमान से कैसे बर्ताव करता है। ठीक इसीलिए अपोलो 15 का प्रदर्शन चंद्रमा पर करने योग्य है: वहाँ हवा नहीं, अतः एकमात्र बल गुरुत्व है, और भविष्यवाणी नंगी आँख से देखी जा सकती है। वही प्रयोग पृथ्वी पर निर्वात कक्ष में चलता है, और भौतिकी विभाग अंतरिक्ष उड़ान से बहुत पहले से निर्वातित नलियों में उसे करते आए हैं। दोनों वही दिखाते हैं, और चंद्रमा कोई नई भौतिकी नहीं जोड़ता — केवल बहुत अच्छा मंच देता है। दो सूक्ष्मताएँ रखने योग्य हैं। पहली, चंद्रमा का g सचमुच लगभग 1.6 m/s² है, पृथ्वी के मोटे तौर पर छठे भाग का, अतः वस्तुएँ वहाँ यहाँ से अधिक धीमे गिरती हैं। पर वे धीमे साथ गिरती हैं। क्षेत्र की प्रबलता यह तय करती है कि सब कितनी तेज़ गिरता है; इससे इसका कोई संबंध नहीं कि भिन्न द्रव्यमान एक-से गिरते हैं या नहीं। तीसरा विकल्प इन दो बिलकुल अलग तथ्यों को पूरी तरह गड्डमड्ड करता है, इसीलिए वह सबसे लुभावना ग़लत उत्तर है। दूसरी, कटाव तभी ठीक-ठीक है जब गिरते पिंड का लोक पर अपना गुरुत्वीय खिंचाव छोड़ दिया जाए — कड़ाई से, हथौड़ा भी चंद्रमा को खींचता है, और सचमुच विशाल द्रव्यमान चंद्रमा से थोड़ा पहले मिलता। यह प्रभाव किसी भी ऐसी चीज़ के लिए अमापनीय रूप से छोटा है जिसे व्यक्ति गिरा सके, पर इसी कारण कथन आम तौर पर 'छोटे परीक्षण द्रव्यमान की सीमा में' कहकर कहा जाता है। (बचे हुए ग़लत उत्तर क्षेत्र की प्रबलता को यह तय करने देते कि वह द्रव्यमान से भेद करता है या नहीं, या ऐसे परिणाम को फेंक देते जो पृथ्वी के हर निर्वात कक्ष में दोहराया जा चुका है।)",
          mr: "दोन्ही समीकरणे शेजारीशेजारी लिहा आणि कापाकापी न पाहता राहवत नाही. M वस्तुमान आणि R त्रिज्येच्या जगाच्या पृष्ठभागावर m वस्तुमानाच्या पिंडावरचे गुरुत्वीय बल F = GMm/R². न्यूटनचा दुसरा नियम मग a = F/m = GM/R² देतो. पिंडाचे स्वतःचे वस्तुमान उत्तरातून गायब झाले. ते यासाठी गायब झाले की m दोन वेगळ्या भूमिकांत येते — ज्याला गुरुत्व ओढते ती गोष्ट म्हणून, आणि जी त्वरित होण्यास विरोध करते ती गोष्ट म्हणून — आणि ती दोन्ही योगायोगाने एकच संख्या आहेत. हा योगायोग न्यूटनच्या चौकटीतल्या कशानेही आवश्यक नाही; ते प्रायोगिक तथ्य आहे, असाधारण अचूकतेने तपासलेले, आणि आइनस्टाइनने पुढे त्याला सामान्य सापेक्षतेचा पाया बनवले. पण ते मान्य केल्यावर हातोडा आणि पीस कोणत्याही जगावर, पृथ्वीसह, एकाच दराने पडले पाहिजेत. मग पृथ्वीवर ते तसे का पडत नाहीत? कारण गुरुत्व हे एकमेव लागणारे बल नाही. हवा असा ओढ लावते जो वस्तूच्या आकार, रूप आणि चालीवर अवलंबून, तिच्या वस्तुमानावर नाही. हातोड्यासाठी तो ओढ मोठ्या वजनाचा नगण्य अंश, म्हणून त्याचे त्वरण जवळपास g. पिसासाठी ओढ जवळपास लगेच त्याच्या इवल्या वजनाइतका होतो, म्हणून त्याचे परिणामी बल लहान आणि ते जवळपास अचल सीमावर्ती चालीने खाली तरंगते. दोन पतनांतला फरक पूर्णपणे हवेच्या विरोधाचा फरक, आणि गुरुत्व वस्तुमानाशी कसे वागते याच्याशी काहीही संबंध नाही. नेमके म्हणूनच अपोलो 15 चे प्रात्यक्षिक चंद्रावर करण्याजोगे: तिथे हवा नाही, म्हणून एकमेव बल गुरुत्व, आणि भाकीत उघड्या डोळ्यांनी पाहता येते. तोच प्रयोग पृथ्वीवर निर्वात कक्षात चालतो, आणि भौतिकी विभाग अंतराळ उड्डाणाच्या कितीतरी आधीपासून निर्वात नळ्यांत तो करत आले आहेत. दोन्ही तेच दाखवतात, आणि चंद्र कोणतीही नवी भौतिकी जोडत नाही — केवळ फार चांगला रंगमंच देतो. दोन सूक्ष्मता ठेवण्याजोग्या. पहिली, चंद्राचा g खरोखर सुमारे 1.6 m/s² आहे, पृथ्वीच्या ढोबळमानाने सहाव्या भागाचा, म्हणून वस्तू तिथे इथल्यापेक्षा अधिक सावकाश पडतात. पण त्या सावकाश एकत्र पडतात. क्षेत्राची प्रबळता सर्व किती वेगाने पडते ते ठरवते; वेगवेगळी वस्तुमाने सारखी पडतात का याच्याशी तिचा काहीही संबंध नाही. तिसरा पर्याय या दोन पूर्णपणे वेगळ्या तथ्यांची पूर्ण गल्लत करतो, म्हणूनच ते सर्वांत मोहक चुकीचे उत्तर. दुसरी, कापाकापी तेव्हाच नेमकी जेव्हा पडणाऱ्या पिंडाची जगावरची स्वतःची गुरुत्वीय ओढ सोडली जाते — काटेकोरपणे, हातोडाही चंद्राला ओढतो, आणि खरोखर प्रचंड वस्तुमान चंद्राला किंचित आधी भेटले असते. हा परिणाम माणूस टाकू शकेल अशा कशासाठीही न मोजता येण्याइतका लहान, पण याच कारणाने विधान सहसा 'लहान चाचणी वस्तुमानाच्या मर्यादेत' असे म्हणून मांडले जाते. (उरलेली चुकीची उत्तरे क्षेत्राच्या प्रबळतेला ते वस्तुमानानुसार भेद करते का हे ठरवू देतात, वा पृथ्वीवरील प्रत्येक निर्वात कक्षात पुन्हा मिळवलेला निकाल फेकून देतात.)",
        },
      },
      /*H7*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Mechanical Properties of Solids                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-mechanical-properties-of-solids",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 8 — Mechanical Properties of Solids",
      hi: "अध्याय 8 — ठोसों के यांत्रिक गुण",
      mr: "प्रकरण 8 — घनपदार्थांचे यांत्रिक गुणधर्म",
    },
    name: {
      en: "Mechanical Properties of Solids",
      hi: "ठोसों के यांत्रिक गुण",
      mr: "घनपदार्थांचे यांत्रिक गुणधर्म",
    },
    summary: {
      en: "Rigid bodies were a convenient lie and this chapter withdraws it: every beam bends, every cable stretches, and the question becomes how much and whether it comes back. Two quantities that make different wires comparable, a straight line that holds only while it holds, a modulus that belongs to the material and never to the specimen, a permanent set that is the first sign of failure, and the reason a crane's cable and a girder are designed to a stress and not to a load.",
      hi: "दृढ़ पिंड एक सुविधाजनक झूठ था और यह अध्याय उसे वापस ले लेता है: हर धरन झुकती है, हर तार खिंचता है, और प्रश्न यह बनता है कि कितना और क्या वह लौटता है। दो राशियाँ जो भिन्न तारों की तुलना संभव बनाती हैं, वह सीधी रेखा जो तभी तक चलती है जब तक चलती है, वह मापांक जो पदार्थ का है, नमूने का कभी नहीं, वह स्थायी विरूपण जो विफलता का पहला संकेत है, और वह कारण जिससे क्रेन की रस्सी और धरन भार पर नहीं प्रतिबल पर अभिकल्पित होती हैं।",
      mr: "दृढ पिंड हे सोयीचे खोटे होते आणि हे प्रकरण ते मागे घेते: प्रत्येक तुळई वाकते, प्रत्येक तार ताणली जाते, आणि प्रश्न होतो किती आणि ती परत येते का. दोन राशी ज्या वेगवेगळ्या तारांची तुलना शक्य करतात, ती सरळ रेषा जी टिकेपर्यंतच टिकते, तो मापांक जो पदार्थाचा, नमुन्याचा कधीच नाही, ते कायमचे विरूपण जे अपयशाचे पहिले चिन्ह, आणि ते कारण ज्यामुळे क्रेनची दोरी आणि तुळई ओझ्यावर नव्हे तर प्रतिबलावर आखली जातात.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "stress-and-strain",
        name: {
          en: "Stress and strain",
          hi: "प्रतिबल और विकृति",
          mr: "प्रतिबल आणि विकृती",
        },
        kind: "quantity",
        prompt: {
          en: "A thick cable and a thin one cannot be compared by the load they carry or by how far they stretch, so the load is divided by the area and the stretch by the original length before anything is said. Which pair is this?",
          hi: "मोटी और पतली रस्सी की तुलना न उनके ढोए भार से हो सकती है न इससे कि वे कितना खिंचीं, अतः कुछ कहने से पहले भार को क्षेत्रफल से और खिंचाव को मूल लंबाई से भाग दिया जाता है। यह कौन-सी जोड़ी है?",
          mr: "जाड आणि पातळ दोरीची तुलना ना त्यांनी वाहिलेल्या ओझ्याने होऊ शकते ना त्या किती ताणल्या यावरून, म्हणून काही सांगण्याआधी ओझे क्षेत्रफळाने आणि ताण मूळ लांबीने भागले जाते. ही कोणती जोडी?",
        },
        statement: {
          en: "Stress is the internal restoring force per unit area and strain is the fractional change in dimension, so stress has the units of pressure while strain is a pure number with no units at all.",
          hi: "प्रतिबल प्रति एकांक क्षेत्रफल आंतरिक प्रत्यानयन बल है और विकृति विमा में भिन्नात्मक परिवर्तन, अतः प्रतिबल के मात्रक दाब के हैं जबकि विकृति शुद्ध संख्या है जिसका कोई मात्रक ही नहीं।",
          mr: "प्रतिबल म्हणजे प्रति एकक क्षेत्रफळ आंतरिक पुनःस्थापक बल आणि विकृती म्हणजे मितीतील अपूर्णांकी बदल, म्हणून प्रतिबलाची एकके दाबाची तर विकृती ही शुद्ध संख्या जिला कोणतेही एकक नाही.",
        },
        detail: {
          en: "Dividing by the area is what makes a material's behaviour a property of the material rather than of the particular rod on the bench, and it is why engineers design to a safe stress and not to a safe load.",
          hi: "क्षेत्रफल से भाग देना ही पदार्थ के व्यवहार को उस पदार्थ का गुण बनाता है, मेज़ पर रखी किसी विशेष छड़ का नहीं, और इसीलिए अभियंता सुरक्षित प्रतिबल पर अभिकल्पन करते हैं, सुरक्षित भार पर नहीं।",
          mr: "क्षेत्रफळाने भागणे हेच पदार्थाच्या वर्तनाला त्या पदार्थाचा गुणधर्म बनवते, बाकावरच्या एखाद्या विशिष्ट दांडीचा नव्हे, आणि म्हणूनच अभियंते सुरक्षित प्रतिबलावर आखणी करतात, सुरक्षित ओझ्यावर नव्हे.",
        },
        extra: {
          en: "Stress is not the same as the applied pressure even when the numbers agree: pressure acts on a surface from outside, while stress is the material's own answer to it, distributed through the body.",
          hi: "संख्याएँ मिलने पर भी प्रतिबल लगाए गए दाब जैसा नहीं है: दाब सतह पर बाहर से लगता है, जबकि प्रतिबल उसके प्रति पदार्थ का अपना उत्तर है, जो पूरे पिंड में बँटा रहता है।",
          mr: "आकडे जुळले तरी प्रतिबल हे लावलेल्या दाबासारखे नाही: दाब पृष्ठभागावर बाहेरून लागतो, तर प्रतिबल हे त्याला पदार्थाचे स्वतःचे उत्तर, जे अख्ख्या पिंडात वाटले जाते.",
        },
        pair: {
          left: {
            en: "One carries units of pressure, the other none at all",
            hi: "एक के मात्रक दाब के, दूसरे के कोई नहीं",
            mr: "एकाची एकके दाबाची, दुसऱ्याची काहीच नाहीत",
          },
          right: {
            en: "stress and strain",
            hi: "प्रतिबल और विकृति",
            mr: "प्रतिबल आणि विकृती",
          },
        },
      },
      {
        id: "hookes-law-and-elastic-limit",
        name: {
          en: "Hooke's law and the elastic limit",
          hi: "हुक का नियम और प्रत्यास्थता सीमा",
          mr: "हूकचा नियम आणि प्रत्यास्थता मर्यादा",
        },
        kind: "law",
        prompt: {
          en: "Load a wire gently and the graph of stress against strain is a straight line through the origin; load it past one particular point and the line bends and the wire never fully returns. Which pair of ideas is this?",
          hi: "तार पर हल्का भार डालो और प्रतिबल बनाम विकृति का आलेख मूल-बिंदु से जाती सीधी रेखा है; एक विशेष बिंदु से आगे भार डालो और रेखा मुड़ जाती है तथा तार पूरी तरह कभी नहीं लौटता। यह कौन-सी विचार-जोड़ी है?",
          mr: "तारेवर हलके ओझे टाका आणि प्रतिबल विरुद्ध विकृतीचा आलेख आरंभबिंदूतून जाणारी सरळ रेषा; एका विशिष्ट बिंदूपुढे ओझे टाका आणि रेषा वाकते तसेच तार पूर्णपणे कधीही परतत नाही. ही कोणती कल्पना-जोडी?",
        },
        statement: {
          en: "Hooke's law states that stress is proportional to strain, and it holds only up to the proportional limit; beyond the elastic limit a little further on, the body keeps a permanent set when unloaded.",
          hi: "हुक का नियम कहता है कि प्रतिबल विकृति का समानुपाती है, और वह केवल समानुपाती सीमा तक चलता है; उससे थोड़ा आगे प्रत्यास्थता सीमा के परे भार हटाने पर पिंड स्थायी विरूपण रख लेता है।",
          mr: "हूकचा नियम सांगतो की प्रतिबल विकृतीच्या समानुपाती आहे, आणि तो केवळ समानुपाती मर्यादेपर्यंतच चालतो; त्याहून थोड्या पुढे प्रत्यास्थता मर्यादेपलीकडे ओझे काढल्यावर पिंड कायमचे विरूपण राखतो.",
        },
        detail: {
          en: "It is a description of how most materials happen to behave over a small range, not a law of nature, and rubber disobeys it almost from the start.",
          hi: "यह इसका वर्णन है कि अधिकांश पदार्थ छोटे परास में संयोगवश कैसे व्यवहार करते हैं, प्रकृति का नियम नहीं, और रबर उसे लगभग आरंभ से ही नहीं मानता।",
          mr: "हे बहुतांश पदार्थ लहान पल्ल्यात योगायोगाने कसे वागतात याचे वर्णन आहे, निसर्गाचा नियम नव्हे, आणि रबर तो जवळपास सुरुवातीपासूनच पाळत नाही.",
        },
        extra: {
          en: "Past the elastic limit comes yielding, where the material stretches a long way for very little extra stress, and this is what makes a metal drawable into wire and beatable into sheet.",
          hi: "प्रत्यास्थता सीमा के आगे पराभव आता है, जहाँ पदार्थ बहुत थोड़े अतिरिक्त प्रतिबल पर बहुत खिंच जाता है, और यही धातु को तार में खींचने और चादर में पीटने योग्य बनाता है।",
          mr: "प्रत्यास्थता मर्यादेपुढे नमन येते, जिथे पदार्थ फार थोड्या जादा प्रतिबलावर खूप ताणला जातो, आणि हेच धातूला तारेत ओढण्याजोगे आणि पत्र्यात ठोकण्याजोगे बनवते.",
        },
        pair: {
          left: {
            en: "A straight line that is a habit, not a law",
            hi: "ऐसी सीधी रेखा जो आदत है, नियम नहीं",
            mr: "अशी सरळ रेषा जी सवय आहे, नियम नव्हे",
          },
          right: {
            en: "Hooke's law and the elastic limit",
            hi: "हुक का नियम और प्रत्यास्थता सीमा",
            mr: "हूकचा नियम आणि प्रत्यास्थता मर्यादा",
          },
        },
      },
      {
        id: "youngs-modulus",
        name: {
          en: "Young's modulus",
          hi: "यंग मापांक",
          mr: "यंग मापांक",
        },
        kind: "quantity",
        prompt: {
          en: "Steel's value is about twenty times rubber's and does not change when the wire is cut in half or drawn thinner, because it is the slope of the straight part of the stress–strain graph. Which quantity is this?",
          hi: "इस्पात का मान रबर के लगभग बीस गुना है और तार आधा काटने या पतला खींचने पर बदलता नहीं, क्योंकि वह प्रतिबल-विकृति आलेख के सीधे भाग की ढाल है। यह कौन-सी राशि है?",
          mr: "पोलादाचे मूल्य रबराच्या सुमारे वीसपट आणि तार अर्धी कापली वा पातळ ओढली तरी बदलत नाही, कारण ते प्रतिबल-विकृती आलेखाच्या सरळ भागाचा उतार आहे. ही कोणती राशी?",
        },
        statement: {
          en: "Young's modulus is the ratio of tensile stress to longitudinal strain, a property of the material alone, so it is unchanged by the specimen's length, thickness or shape.",
          hi: "यंग मापांक तन्य प्रतिबल और अनुदैर्घ्य विकृति का अनुपात है, केवल पदार्थ का गुण, अतः नमूने की लंबाई, मोटाई या आकार से वह नहीं बदलता।",
          mr: "यंग मापांक म्हणजे तन्य प्रतिबल आणि अनुदैर्घ्य विकृती यांचे गुणोत्तर, केवळ पदार्थाचा गुणधर्म, म्हणून नमुन्याची लांबी, जाडी वा आकार यांनी तो बदलत नाही.",
        },
        detail: {
          en: "The extension it predicts, FL/(AY), does depend on the specimen: a longer wire of the same material stretches proportionately more and a thicker one proportionately less.",
          hi: "वह जो विस्तार बताता है, FL/(AY), वह नमूने पर निर्भर है ही: उसी पदार्थ का लंबा तार समानुपाती रूप से अधिक खिंचता है और मोटा समानुपाती रूप से कम।",
          mr: "तो जो ताण सांगतो, FL/(AY), तो नमुन्यावर अवलंबून आहेच: त्याच पदार्थाची लांब तार समानुपातीरीत्या अधिक ताणली जाते आणि जाड तार समानुपातीरीत्या कमी.",
        },
        extra: {
          en: "A large value means stiff rather than strong: steel resists stretching far better than rubber, but a thread of either can be broken, and breaking is governed by a different number entirely.",
          hi: "बड़ा मान दृढ़ होने का अर्थ रखता है, मज़बूत होने का नहीं: इस्पात रबर से कहीं बेहतर खिंचाव रोकता है, पर दोनों में से किसी का धागा तोड़ा जा सकता है, और टूटना पूरी तरह भिन्न संख्या से तय होता है।",
          mr: "मोठे मूल्य म्हणजे ताठर, बळकट नव्हे: पोलाद रबरहून कितीतरी चांगले ताणण्यास विरोध करते, पण दोघांपैकी कोणाचाही धागा तोडता येतो, आणि तुटणे पूर्णपणे वेगळ्या संख्येने ठरते.",
        },
        pair: {
          left: {
            en: "Cut the wire in half and the number is unchanged",
            hi: "तार आधा काटो और संख्या वही रहती है",
            mr: "तार अर्धी कापा आणि संख्या तीच राहते",
          },
          right: {
            en: "Young's modulus",
            hi: "यंग मापांक",
            mr: "यंग मापांक",
          },
        },
      },
      {
        id: "bulk-modulus",
        name: {
          en: "The bulk modulus",
          hi: "आयतन मापांक",
          mr: "घनफळ मापांक",
        },
        kind: "quantity",
        prompt: {
          en: "Squeeze a body from every side at once and its volume shrinks a little; the pressure needed per unit of fractional volume change is enormous for steel, large for water and small for air. Which quantity is this?",
          hi: "किसी पिंड को एक साथ हर ओर से दबाओ और उसका आयतन थोड़ा सिकुड़ता है; प्रति एकांक भिन्नात्मक आयतन-परिवर्तन के लिए चाहिए दाब इस्पात के लिए विशाल, पानी के लिए बड़ा और हवा के लिए छोटा है। यह कौन-सी राशि है?",
          mr: "एखाद्या पिंडाला एकाच वेळी सर्व बाजूंनी दाबा आणि त्याचे घनफळ थोडे आकुंचते; प्रति एकक अपूर्णांकी घनफळ-बदलासाठी लागणारा दाब पोलादासाठी प्रचंड, पाण्यासाठी मोठा आणि हवेसाठी लहान असतो. ही कोणती राशी?",
        },
        statement: {
          en: "The bulk modulus is the ratio of the applied pressure to the fractional decrease in volume, and it is the only elastic modulus that gases and liquids possess.",
          hi: "आयतन मापांक लगाए गए दाब और आयतन में भिन्नात्मक कमी का अनुपात है, और यही एकमात्र प्रत्यास्थता मापांक है जो गैसों तथा द्रवों के पास होता है।",
          mr: "घनफळ मापांक म्हणजे लावलेला दाब आणि घनफळातील अपूर्णांकी घट यांचे गुणोत्तर, आणि हाच एकमेव प्रत्यास्थता मापांक जो वायू आणि द्रवांकडे असतो.",
        },
        detail: {
          en: "Fluids have no shear modulus at all, because a layer of liquid offers no permanent resistance to being slid sideways — it simply flows, which is the definition of a fluid.",
          hi: "तरलों के पास अपरूपण मापांक है ही नहीं, क्योंकि द्रव की परत बग़ल में सरकाए जाने का स्थायी प्रतिरोध नहीं देती — वह बस बहती है, और तरल की परिभाषा यही है।",
          mr: "प्रवाहींकडे कर्तन मापांक मुळीच नाही, कारण द्रवाचा थर बाजूला सरकवण्याला कायमचा विरोध देत नाही — तो फक्त वाहतो, आणि प्रवाहीची व्याख्या हीच.",
        },
        extra: {
          en: "Its reciprocal is called compressibility, and water's very low value is why hydraulic machinery works at all: a fluid that squashed easily could not transmit a force undiminished.",
          hi: "उसका व्युत्क्रम संपीड्यता कहलाता है, और पानी का बहुत कम मान ही वह कारण है जिससे द्रवचालित यंत्र चलते हैं: जो तरल आसानी से दब जाए वह बल को बिना घटाए संचरित नहीं कर सकता।",
          mr: "त्याचा व्यस्त संपीड्यता म्हणतात, आणि पाण्याचे फार कमी मूल्य हेच ते कारण ज्यामुळे द्रवचालित यंत्रे चालतात: सहज दबणारे प्रवाही बल न घटवता संक्रमित करू शकणार नाही.",
        },
        pair: {
          left: {
            en: "The one modulus a liquid actually has",
            hi: "वह एकमात्र मापांक जो द्रव के पास वस्तुतः है",
            mr: "तो एकमेव मापांक जो द्रवाकडे प्रत्यक्षात आहे",
          },
          right: {
            en: "the bulk modulus",
            hi: "आयतन मापांक",
            mr: "घनफळ मापांक",
          },
        },
      },
      {
        id: "poissons-ratio",
        name: {
          en: "Poisson's ratio",
          hi: "प्वासों अनुपात",
          mr: "प्वासों गुणोत्तर",
        },
        kind: "quantity",
        prompt: {
          en: "Stretch a rubber band and it visibly narrows; stretch a steel wire and it narrows too, only far too little to see. The sideways shrinkage divided by the lengthwise stretch is which quantity?",
          hi: "रबर बैंड खींचो और वह दिखाई देने लायक़ पतला हो जाता है; इस्पात का तार खींचो और वह भी पतला होता है, बस देखने के लिए बहुत ही कम। पार्श्व सिकुड़न बटा अनुदैर्घ्य खिंचाव कौन-सी राशि है?",
          mr: "रबरबँड ताणा आणि तो दिसण्याइतका बारीक होतो; पोलादाची तार ताणा आणि तीही बारीक होते, फक्त पाहण्यासाठी फारच कमी. आडवी आकुंचन भागिले लांबीचा ताण ही कोणती राशी?",
        },
        statement: {
          en: "Poisson's ratio is the lateral strain divided by the longitudinal strain, a pure number that for most solids lies between about 0.2 and 0.5.",
          hi: "प्वासों अनुपात पार्श्व विकृति बटा अनुदैर्घ्य विकृति है, एक शुद्ध संख्या जो अधिकांश ठोसों के लिए लगभग 0.2 और 0.5 के बीच रहती है।",
          mr: "प्वासों गुणोत्तर म्हणजे आडवी विकृती भागिले अनुदैर्घ्य विकृती, एक शुद्ध संख्या जी बहुतांश घनपदार्थांसाठी सुमारे 0.2 आणि 0.5 दरम्यान असते.",
        },
        detail: {
          en: "A value of exactly 0.5 would mean the volume did not change at all under stretching, which is very nearly true of rubber and not at all true of steel.",
          hi: "ठीक 0.5 का मान यह कहता कि खिंचाव पर आयतन बिलकुल नहीं बदला, जो रबर के लिए लगभग सच है और इस्पात के लिए बिलकुल नहीं।",
          mr: "नेमके 0.5 चे मूल्य म्हणजे ताणताना घनफळ मुळीच बदलले नाही, जे रबरासाठी जवळपास खरे आणि पोलादासाठी मुळीच नाही.",
        },
        extra: {
          en: "It is the reason a stretched wire's cross-section is not the value to use in a careful stress calculation, though the correction is negligible in the elastic range.",
          hi: "इसी से खिंचे तार का अनुप्रस्थ काट सावधान प्रतिबल-गणना में लेने योग्य मान नहीं रहता, यद्यपि प्रत्यास्थ परास में यह सुधार नगण्य है।",
          mr: "यामुळेच ताणलेल्या तारेचा आडवा छेद काळजीपूर्वक प्रतिबल-गणनेत घेण्याजोगे मूल्य राहत नाही, जरी प्रत्यास्थ पल्ल्यात ही दुरुस्ती नगण्य असली तरी.",
        },
        pair: {
          left: {
            en: "Half would mean the volume never changed",
            hi: "आधा होने का अर्थ होता कि आयतन कभी बदला ही नहीं",
            mr: "अर्धा असणे म्हणजे घनफळ कधी बदललेच नाही",
          },
          right: {
            en: "Poisson's ratio",
            hi: "प्वासों अनुपात",
            mr: "प्वासों गुणोत्तर",
          },
        },
      },
      {
        id: "elastic-energy-in-a-wire",
        name: {
          en: "Elastic energy in a stretched wire",
          hi: "खिंचे तार में प्रत्यास्थ ऊर्जा",
          mr: "ताणलेल्या तारेतील प्रत्यास्थ ऊर्जा",
        },
        kind: "law",
        prompt: {
          en: "The load builds from nothing to its full value as the wire lengthens, so the work stored is the triangular area under the load–extension graph and comes out as half of force times extension. Which store is this?",
          hi: "तार के लंबा होते-होते भार शून्य से बढ़कर अपने पूरे मान तक पहुँचता है, अतः संचित कार्य भार-विस्तार आलेख के नीचे का त्रिभुजाकार क्षेत्रफल है और बल गुणा विस्तार का आधा निकलता है। यह कौन-सा भंडार है?",
          mr: "तार लांब होता होता ओझे शून्यापासून वाढून आपल्या पूर्ण मूल्यापर्यंत पोहोचते, म्हणून साठलेले कार्य ओझे-ताण आलेखाखालचे त्रिकोणी क्षेत्रफळ आणि बल गुणिले ताण याच्या निम्मे निघते. हा कोणता साठा?",
        },
        statement: {
          en: "The elastic potential energy stored in a stretched wire is half the product of the load and the extension, or equivalently half of stress times strain times the volume.",
          hi: "खिंचे तार में संचित प्रत्यास्थ स्थितिज ऊर्जा भार और विस्तार के गुणनफल की आधी है, या समतुल्य रूप से प्रतिबल गुणा विकृति गुणा आयतन की आधी।",
          mr: "ताणलेल्या तारेत साठलेली प्रत्यास्थ स्थितिज ऊर्जा म्हणजे ओझे आणि ताण यांच्या गुणाकाराच्या निम्मी, किंवा समतुल्यपणे प्रतिबल गुणिले विकृती गुणिले घनफळ याच्या निम्मी.",
        },
        detail: {
          en: "The energy is returned in full only within the elastic range; past the elastic limit part of it goes into permanent rearrangement and appears as heat rather than coming back.",
          hi: "ऊर्जा केवल प्रत्यास्थ परास के भीतर पूरी लौटती है; प्रत्यास्थता सीमा के परे उसका कुछ भाग स्थायी पुनर्व्यवस्था में जाता है और लौटने के बजाय ऊष्मा बनकर प्रकट होता है।",
          mr: "ऊर्जा केवळ प्रत्यास्थ पल्ल्यातच पूर्ण परत मिळते; प्रत्यास्थता मर्यादेपलीकडे तिचा काही भाग कायमच्या पुनर्रचनेत जातो आणि परत येण्याऐवजी उष्णता बनून प्रकट होतो.",
        },
        extra: {
          en: "It is the reason a snapping cable is dangerous out of all proportion to the load: the stored energy is released in a moment, and a long cable stores far more of it than a short one under the same tension.",
          hi: "इसी से टूटती रस्सी भार के अनुपात से कहीं अधिक ख़तरनाक होती है: संचित ऊर्जा एक क्षण में मुक्त होती है, और उसी तनाव पर लंबी रस्सी छोटी से कहीं अधिक ऊर्जा जमा रखती है।",
          mr: "यामुळेच तुटणारी दोरी ओझ्याच्या प्रमाणाहून कितीतरी अधिक धोकादायक असते: साठलेली ऊर्जा एका क्षणात मुक्त होते, आणि त्याच ताणावर लांब दोरी लहान दोरीहून कितीतरी अधिक ऊर्जा साठवते.",
        },
        pair: {
          left: {
            en: "Half, because the load grew from nothing",
            hi: "आधा, क्योंकि भार शून्य से बढ़ा था",
            mr: "निम्मे, कारण ओझे शून्यापासून वाढले होते",
          },
          right: {
            en: "elastic energy in a stretched wire",
            hi: "खिंचे तार में प्रत्यास्थ ऊर्जा",
            mr: "ताणलेल्या तारेतील प्रत्यास्थ ऊर्जा",
          },
        },
      },
      /*F8*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Two wires of the same steel hang from the same beam and carry the same load. The second is twice as long and twice the diameter of the first. The first stretches by 2 mm. A student predicts the second will stretch by 4 mm because it is twice as long. Correct the prediction.",
          hi: "एक ही इस्पात के दो तार उसी धरन से लटके हैं और वही भार ढोते हैं। दूसरा पहले से दुगुना लंबा और दुगुने व्यास का है। पहला 2 mm खिंचता है। एक विद्यार्थी भविष्यवाणी करता है कि दूसरा 4 mm खिंचेगा क्योंकि वह दुगुना लंबा है। भविष्यवाणी सुधारो।",
          mr: "एकाच पोलादाच्या दोन तारा त्याच तुळईवरून लटकत आहेत आणि तेच ओझे वाहतात. दुसरी पहिलीहून दुप्पट लांब आणि दुप्पट व्यासाची. पहिली 2 mm ताणली जाते. एक विद्यार्थी भाकीत करतो की दुसरी 4 mm ताणली जाईल कारण ती दुप्पट लांब आहे. भाकीत दुरुस्त करा.",
        },
        choices: [
          {
            en: "The extension is FL/(AY), so length and area pull in opposite directions. Doubling the length doubles the extension, but doubling the diameter quadruples the area and so divides it by four. The net factor is 2/4 = 0.5, and the second wire stretches by 1 mm — half as much, not twice. The student changed one variable and forgot the other, which is the standard trap in this formula",
            hi: "विस्तार FL/(AY) है, अतः लंबाई और क्षेत्रफल विपरीत दिशाओं में खींचते हैं। लंबाई दुगुनी करने से विस्तार दुगुना होता है, पर व्यास दुगुना करने से क्षेत्रफल चौगुना होता है और इसलिए वह चार से भाग हो जाता है। शुद्ध गुणक 2/4 = 0.5, और दूसरा तार 1 mm खिंचता है — आधा, दुगुना नहीं। विद्यार्थी ने एक चर बदला और दूसरा भूल गया, और इस सूत्र का यही मानक जाल है",
            mr: "ताण FL/(AY) आहे, म्हणून लांबी आणि क्षेत्रफळ विरुद्ध दिशांना ओढतात. लांबी दुप्पट केल्याने ताण दुप्पट होतो, पण व्यास दुप्पट केल्याने क्षेत्रफळ चौपट होते आणि म्हणून तो चारने भागला जातो. निव्वळ गुणक 2/4 = 0.5, आणि दुसरी तार 1 mm ताणली जाते — निम्मे, दुप्पट नव्हे. विद्यार्थ्याने एक चल बदलले आणि दुसरे विसरले, आणि या सूत्राचा हाच प्रमाणित सापळा",
          },
          {
            en: "The student is right: extension depends only on length, since Young's modulus already accounts for the thickness",
            hi: "विद्यार्थी सही है: विस्तार केवल लंबाई पर निर्भर है, क्योंकि यंग मापांक मोटाई का हिसाब पहले ही रख लेता है",
            mr: "विद्यार्थी बरोबर: ताण केवळ लांबीवर अवलंबून, कारण यंग मापांक जाडीचा हिशोब आधीच ठेवतो",
          },
          {
            en: "The second wire stretches by 2 mm, because doubling the length and doubling the diameter cancel each other exactly",
            hi: "दूसरा तार 2 mm खिंचता है, क्योंकि लंबाई दुगुनी और व्यास दुगुना करना एक-दूसरे को ठीक-ठीक काट देते हैं",
            mr: "दुसरी तार 2 mm ताणली जाते, कारण लांबी दुप्पट आणि व्यास दुप्पट करणे एकमेकांना नेमके कापतात",
          },
          {
            en: "Nothing can be said, because Young's modulus is different for a thicker wire of the same steel",
            hi: "कुछ नहीं कहा जा सकता, क्योंकि उसी इस्पात के मोटे तार का यंग मापांक भिन्न होता है",
            mr: "काहीही सांगता येत नाही, कारण त्याच पोलादाच्या जाड तारेचा यंग मापांक वेगळा असतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Write the formula out and the answer is a matter of counting powers. Young's modulus is defined as stress over strain, Y = (F/A)/(ΔL/L), and rearranging gives the extension ΔL = FL/(AY). Four things appear on the right, and the question changes two of them. The load F is the same. The material is the same, so Y is the same — and that last point disposes of the fourth option straight away. Young's modulus is a property of steel, not of any particular piece of it; cutting a wire in half or drawing it thinner does not change the value in the table, which is exactly why it is worth tabulating. Now the two that do change. Length is in the numerator, so doubling it doubles the extension: a longer wire has more material to share the same fractional stretch, and the same strain over twice the length gives twice the absolute extension. On its own this gives the student's factor of 2. But the area is in the denominator, and area is not diameter. For a circular cross-section A = πd²/4, so doubling d multiplies A by four. That divides the extension by four. Combining, the second wire extends by 2 × (1/4) = 0.5 of the first, giving 1 mm. Notice the shape of the error rather than just its size. The student did not make a mistake of arithmetic; they varied one quantity while holding the other fixed in their head, though the problem had changed both. This is the most common failure mode in every formula with more than two variables, and the defence is mechanical: list every symbol, mark which ones changed, and apply each factor separately before combining. The third option is a subtler version of the same trap — it notices both changes but treats diameter as though it entered linearly, so 2 and 2 appear to cancel. The squaring is the whole point. It is worth seeing which quantity is a property of what. Y belongs to the material. Stress and strain belong to the situation. The extension belongs to the specimen. A student who keeps those three levels separate can answer any question in this chapter, and one who does not will keep looking up the wrong number. The practical version of the same lesson is that a designer choosing a cable specifies a material by its modulus and strength, then chooses a diameter to bring the stress below a safe value — and doubling the diameter buys four times the load capacity, not twice. (The remaining wrong answers make Young's modulus depend on the specimen, or drop the area from the formula altogether.)",
          hi: "सूत्र लिखो और उत्तर घातें गिनने भर का मामला है। यंग मापांक प्रतिबल बटा विकृति परिभाषित है, Y = (F/A)/(ΔL/L), और पुनर्व्यवस्थित करने पर विस्तार ΔL = FL/(AY) मिलता है। दाईं ओर चार चीज़ें आती हैं, और प्रश्न उनमें से दो बदलता है। भार F वही है। पदार्थ वही है, अतः Y वही — और यह अंतिम बात चौथे विकल्प को तुरंत निपटा देती है। यंग मापांक इस्पात का गुण है, उसके किसी विशेष टुकड़े का नहीं; तार आधा काटना या पतला खींचना तालिका के मान को नहीं बदलता, और ठीक इसीलिए उसे तालिकाबद्ध करना सार्थक है। अब वे दो जो बदलती हैं। लंबाई अंश में है, अतः उसे दुगुना करने से विस्तार दुगुना होता है: लंबे तार के पास वही भिन्नात्मक खिंचाव बाँटने को अधिक पदार्थ है, और दुगुनी लंबाई पर वही विकृति दुगुना निरपेक्ष विस्तार देती है। अकेले यह विद्यार्थी का 2 का गुणक देता है। पर क्षेत्रफल हर में है, और क्षेत्रफल व्यास नहीं है। वृत्तीय अनुप्रस्थ काट के लिए A = πd²/4, अतः d दुगुना करने से A चार गुना होता है। वह विस्तार को चार से भाग देता है। जोड़ने पर दूसरा तार पहले के 2 × (1/4) = 0.5 जितना खिंचता है, यानी 1 mm. भूल के आकार पर ध्यान दो, केवल उसके परिमाण पर नहीं। विद्यार्थी से गणना की भूल नहीं हुई; उसने एक राशि बदली और दूसरी को मन में स्थिर पकड़े रखा, जबकि प्रश्न ने दोनों बदल दी थीं। दो से अधिक चरों वाले हर सूत्र में यही सबसे आम विफलता है, और बचाव यांत्रिक है: हर प्रतीक सूचीबद्ध करो, चिह्नित करो कौन बदले, और जोड़ने से पहले हर गुणक अलग लगाओ। तीसरा विकल्प उसी जाल का सूक्ष्मतर रूप है — वह दोनों परिवर्तन देखता है पर व्यास को ऐसे लेता है मानो वह रैखिक रूप से आता हो, अतः 2 और 2 कटते हुए दिखते हैं। वर्ग करना ही पूरी बात है। यह देखने योग्य है कि कौन-सी राशि किसका गुण है। Y पदार्थ का है। प्रतिबल और विकृति स्थिति के हैं। विस्तार नमूने का है। जो छात्र इन तीन स्तरों को अलग रखता है वह इस अध्याय का कोई भी प्रश्न हल कर सकता है, और जो नहीं रखता वह ग़लत संख्या ढूँढ़ता रहेगा। इसी सबक़ का व्यावहारिक रूप यह कि रस्सी चुनता अभिकल्पक पदार्थ को उसके मापांक और सामर्थ्य से तय करता है, फिर व्यास ऐसा चुनता है कि प्रतिबल सुरक्षित मान से नीचे आ जाए — और व्यास दुगुना करने से भार-क्षमता चार गुनी मिलती है, दुगुनी नहीं। (बचे हुए ग़लत उत्तर यंग मापांक को नमूने पर निर्भर बना देते, या सूत्र से क्षेत्रफल ही हटा देते हैं।)",
          mr: "सूत्र लिहा आणि उत्तर घात मोजण्याइतकेच. यंग मापांक प्रतिबल भागिले विकृती अशी व्याख्या, Y = (F/A)/(ΔL/L), आणि पुनर्रचना केल्यास ताण ΔL = FL/(AY) मिळतो. उजवीकडे चार गोष्टी येतात, आणि प्रश्न त्यांतील दोन बदलतो. ओझे F तेच. पदार्थ तोच, म्हणून Y तोच — आणि हा शेवटचा मुद्दा चौथा पर्याय लगेच निकाली काढतो. यंग मापांक हा पोलादाचा गुणधर्म, त्याच्या कोणत्याही विशिष्ट तुकड्याचा नव्हे; तार अर्धी कापणे वा पातळ ओढणे तक्त्यातले मूल्य बदलत नाही, आणि नेमके म्हणूनच ते तक्त्यात मांडणे सार्थक. आता ज्या दोन बदलतात त्या. लांबी अंशात आहे, म्हणून ती दुप्पट केल्याने ताण दुप्पट होतो: लांब तारेकडे तोच अपूर्णांकी ताण वाटायला अधिक पदार्थ आहे, आणि दुप्पट लांबीवर तीच विकृती दुप्पट निरपेक्ष ताण देते. एकटे हे विद्यार्थ्याचा 2 चा गुणक देते. पण क्षेत्रफळ छेदात आहे, आणि क्षेत्रफळ म्हणजे व्यास नव्हे. वर्तुळाकार आडव्या छेदासाठी A = πd²/4, म्हणून d दुप्पट केल्याने A चौपट होते. ते ताण चारने भागते. एकत्र केल्यास दुसरी तार पहिलीच्या 2 × (1/4) = 0.5 इतकी ताणली जाते, म्हणजे 1 mm. चुकीचा आकार पाहा, केवळ तिचे परिमाण नव्हे. विद्यार्थ्याकडून आकडेमोडीची चूक झाली नाही; त्याने एक राशी बदलली आणि दुसरी मनात स्थिर धरून ठेवली, तर प्रश्नाने दोन्ही बदलल्या होत्या. दोनहून अधिक चले असलेल्या प्रत्येक सूत्रात हेच सर्वांत नेहमीचे अपयश, आणि बचाव यांत्रिक: प्रत्येक चिन्ह यादीत लिहा, कोणती बदलली ते खुणा करा, आणि एकत्र करण्याआधी प्रत्येक गुणक वेगळा लावा. तिसरा पर्याय त्याच सापळ्याचे सूक्ष्मतर रूप — तो दोन्ही बदल पाहतो पण व्यासाला असे घेतो जणू तो रेषीयरीत्या येत असावा, म्हणून 2 आणि 2 कापले जाताना दिसतात. वर्ग करणे हाच अख्खा मुद्दा. कोणती राशी कशाचा गुणधर्म आहे हे पाहण्याजोगे. Y पदार्थाचा. प्रतिबल आणि विकृती परिस्थितीची. ताण नमुन्याचा. जो विद्यार्थी हे तीन स्तर वेगळे ठेवतो तो या प्रकरणातील कोणताही प्रश्न सोडवू शकतो, आणि जो ठेवत नाही तो चुकीचा आकडा शोधत राहील. याच धड्याचे व्यावहारिक रूप हे की दोरी निवडणारा आखणीकार पदार्थ त्याच्या मापांक व बळावरून ठरवतो, मग व्यास असा निवडतो की प्रतिबल सुरक्षित मूल्याखाली येईल — आणि व्यास दुप्पट केल्याने ओझे-क्षमता चौपट मिळते, दुप्पट नव्हे. (उरलेली चुकीची उत्तरे यंग मापांक नमुन्यावर अवलंबून बनवतात, वा सूत्रातून क्षेत्रफळच काढून टाकतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A steel rod and a rubber cord of the same length and cross-section are each stretched by the same small amount, well within their elastic ranges. Steel's Young's modulus is far larger. Which stores more elastic energy, and how does this square with rubber being the material used in catapults?",
          hi: "समान लंबाई और अनुप्रस्थ काट की इस्पात की छड़ और रबर की डोरी को उतना ही थोड़ा खींचा जाता है, दोनों की प्रत्यास्थ परास के भीतर ही। इस्पात का यंग मापांक कहीं बड़ा है। कौन अधिक प्रत्यास्थ ऊर्जा संचित करता है, और यह इससे कैसे मेल खाता है कि गुलेल में रबर लगता है?",
          mr: "समान लांबी आणि आडव्या छेदाची पोलादाची दांडी आणि रबराची दोरी प्रत्येकी तितकीच थोडी ताणली जाते, दोघांच्याही प्रत्यास्थ पल्ल्यात. पोलादाचा यंग मापांक कितीतरी मोठा. कोण अधिक प्रत्यास्थ ऊर्जा साठवते, आणि हे गलोलमध्ये रबर वापरले जाते याच्याशी कसे जुळते?",
        },
        choices: [
          {
            en: "For the SAME extension the steel stores far more, since the energy is ½ × (stress × strain) × volume and steel's much larger modulus means a much larger stress for that strain. The catapult is a different question: rubber can be stretched several times its own length before failing, while steel yields at a fraction of a per cent, so rubber's total storable energy is enormous even though its energy per unit strain is small. What a catapult needs is a large TOTAL store released slowly, and that is set by how far a material can be stretched, not by how stiff it is",
            hi: "समान विस्तार पर इस्पात कहीं अधिक संचित करता है, क्योंकि ऊर्जा ½ × (प्रतिबल × विकृति) × आयतन है और इस्पात का बहुत बड़ा मापांक उसी विकृति पर बहुत बड़ा प्रतिबल देता है। गुलेल भिन्न प्रश्न है: रबर टूटने से पहले अपनी लंबाई से कई गुना खिंच सकता है, जबकि इस्पात प्रतिशत के अंश पर ही पराभव कर जाता है, अतः रबर का कुल संचित-योग्य ऊर्जा-भंडार विशाल है यद्यपि प्रति एकांक विकृति उसकी ऊर्जा कम है। गुलेल को चाहिए बड़ा कुल भंडार जो धीरे मुक्त हो, और वह इससे तय होता है कि पदार्थ कितना खिंच सकता है, इससे नहीं कि वह कितना दृढ़ है",
            mr: "समान ताणासाठी पोलाद कितीतरी अधिक साठवते, कारण ऊर्जा ½ × (प्रतिबल × विकृती) × घनफळ आहे आणि पोलादाचा कितीतरी मोठा मापांक त्याच विकृतीसाठी कितीतरी मोठे प्रतिबल देतो. गलोल हा वेगळा प्रश्न: रबर तुटण्याआधी स्वतःच्या लांबीच्या कैकपट ताणले जाऊ शकते, तर पोलाद टक्क्याच्या अंशावरच नमते, म्हणून रबराचा एकूण साठवण्याजोगा ऊर्जासाठा प्रचंड आहे जरी प्रति एकक विकृती त्याची ऊर्जा कमी असली तरी. गलोलला हवा मोठा एकूण साठा जो सावकाश मुक्त होईल, आणि तो पदार्थ किती ताणला जाऊ शकतो यावरून ठरतो, तो किती ताठर आहे यावरून नव्हे",
          },
          {
            en: "The rubber stores more even at the same extension, because a smaller modulus always means a larger energy store",
            hi: "समान विस्तार पर भी रबर अधिक संचित करता है, क्योंकि छोटा मापांक सदा बड़े ऊर्जा-भंडार का अर्थ रखता है",
            mr: "समान ताणावरही रबर अधिक साठवते, कारण लहान मापांक नेहमी मोठ्या ऊर्जासाठ्याचा अर्थ राखतो",
          },
          {
            en: "Both store exactly the same energy, since the energy depends only on the extension and the two extensions are equal",
            hi: "दोनों ठीक उतनी ही ऊर्जा संचित करते हैं, क्योंकि ऊर्जा केवल विस्तार पर निर्भर है और दोनों विस्तार बराबर हैं",
            mr: "दोघे नेमकी तितकीच ऊर्जा साठवतात, कारण ऊर्जा केवळ ताणावर अवलंबून आणि दोन्ही ताण समान आहेत",
          },
          {
            en: "Neither stores energy in the elastic range, since elastic deformation is by definition energy-free",
            hi: "प्रत्यास्थ परास में कोई ऊर्जा संचित करता ही नहीं, क्योंकि प्रत्यास्थ विरूपण परिभाषा से ऊर्जा-रहित है",
            mr: "प्रत्यास्थ पल्ल्यात कोणीही ऊर्जा साठवत नाही, कारण प्रत्यास्थ विरूपण व्याख्येनेच ऊर्जाविरहित आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The question is a good one because it seems to have two contradictory answers, and both intuitions are partly right. Take the calculation first. Energy stored per unit volume is ½ × stress × strain, and stress is Y times strain, so the density of stored energy is ½Yε². Fix the extension and you have fixed ε. Both specimens have the same length, the same cross-section and therefore the same volume. So the ratio of stored energies is simply the ratio of the moduli, and steel's is perhaps a thousand times rubber's. For that particular experiment, the steel wins overwhelmingly. Equivalently: to stretch steel by that amount you had to pull enormously hard, and all that work is now inside it. Rubber gave way easily, so little work was done. Now the catapult, which changes the question without seeming to. A catapult is not asked to store energy at a fixed small extension; it is asked to store as much as possible before it breaks or before the user's arm gives out. Here the limits are what matter. Steel's elastic range ends at a strain of roughly 0.001 — a metre of it stretches about a millimetre before taking a permanent set. Rubber can be taken to a strain of 3 or more, thousands of times further. Since the stored energy goes as ε², rubber's much larger reachable strain overwhelms its much smaller modulus, and its total capacity before failure is far greater. The general shape of that argument is worth extracting: a product of a small factor and a large squared factor is decided by the squared one. Two practical points follow. First, this is why a bow's limbs and a catapult's elastic are made of materials that can be strained a long way, while a bridge cable is made of one that can barely be strained at all — they are answering different questions, storage against stiffness. Second, it is why a snapping steel cable is so dangerous. Its stored energy per unit volume at the point of failure is smaller than rubber's, but a long cable is a large volume, and all of that energy converts to kinetic energy in milliseconds with nothing to absorb it. Rope under tension in a workshop is treated with respect for exactly this reason. A last note on the wrong answers. The fourth is worth naming explicitly because it inverts the definition: elastic deformation is precisely the kind that DOES store recoverable energy, and the reason it is called elastic is that the energy comes back. It is plastic deformation, past the elastic limit, where the work is not recoverable. (The second confuses stiffness with capacity, and the third omits the modulus, which is the only thing distinguishing the two materials here.)",
          hi: "प्रश्न अच्छा है क्योंकि उसके दो परस्पर विरोधी उत्तर दिखते हैं, और दोनों अंतर्ज्ञान आंशिक रूप से सही हैं। पहले गणना लो। प्रति एकांक आयतन संचित ऊर्जा ½ × प्रतिबल × विकृति है, और प्रतिबल Y गुणा विकृति है, अतः संचित ऊर्जा का घनत्व ½Yε² है। विस्तार तय करो और तुमने ε तय कर दिया। दोनों नमूनों की लंबाई एक, अनुप्रस्थ काट एक और इसलिए आयतन एक। अतः संचित ऊर्जाओं का अनुपात बस मापांकों का अनुपात है, और इस्पात का शायद रबर से हज़ार गुना। उस विशेष प्रयोग के लिए इस्पात भारी अंतर से जीतता है। समतुल्य रूप से: इस्पात को उतना खींचने के लिए तुम्हें बहुत ज़ोर लगाना पड़ा, और वह सारा कार्य अब उसके भीतर है। रबर आसानी से मान गया, अतः कार्य कम हुआ। अब गुलेल, जो बिना दिखे प्रश्न बदल देती है। गुलेल से यह नहीं कहा जाता कि नियत छोटे विस्तार पर ऊर्जा संचित करो; उससे कहा जाता है कि टूटने से पहले या उपयोगकर्ता की बाँह हारने से पहले जितनी हो सके उतनी संचित करो। यहाँ सीमाएँ ही मायने रखती हैं। इस्पात की प्रत्यास्थ परास लगभग 0.001 विकृति पर समाप्त होती है — उसका एक मीटर स्थायी विरूपण लेने से पहले लगभग एक मिलीमीटर खिंचता है। रबर को 3 या उससे अधिक विकृति तक ले जाया जा सकता है, हज़ारों गुना आगे। चूँकि संचित ऊर्जा ε² के अनुसार चलती है, रबर की कहीं बड़ी पहुँच-योग्य विकृति उसके कहीं छोटे मापांक पर भारी पड़ती है, और विफलता से पहले उसकी कुल क्षमता कहीं अधिक है। उस तर्क का सामान्य रूप निकालने योग्य है: छोटे गुणक और बड़े वर्गित गुणक का गुणनफल वर्गित वाले से तय होता है। दो व्यावहारिक बातें निकलती हैं। पहली, इसीलिए धनुष की भुजाएँ और गुलेल का इलास्टिक ऐसे पदार्थों से बनते हैं जिन्हें दूर तक खींचा जा सके, जबकि पुल की रस्सी ऐसे पदार्थ से जिसे मुश्किल से खींचा जा सके — वे भिन्न प्रश्नों के उत्तर हैं, भंडारण बनाम दृढ़ता। दूसरी, इसीलिए टूटती इस्पात की रस्सी इतनी ख़तरनाक है। विफलता के बिंदु पर उसकी प्रति एकांक आयतन संचित ऊर्जा रबर से कम है, पर लंबी रस्सी बड़ा आयतन है, और वह सारी ऊर्जा मिलीसेकंड में गतिज ऊर्जा बन जाती है और उसे सोखने को कुछ नहीं होता। कार्यशाला में तनी रस्सी के साथ ठीक इसी कारण आदर से बर्ताव होता है। ग़लत उत्तरों पर एक अंतिम टिप्पणी। चौथा स्पष्ट रूप से नाम लेने योग्य है क्योंकि वह परिभाषा उलट देता है: प्रत्यास्थ विरूपण ठीक वही क़िस्म है जो पुनर्प्राप्य ऊर्जा संचित करती है, और उसे प्रत्यास्थ इसीलिए कहते हैं कि ऊर्जा लौट आती है। सुघट्य विरूपण, प्रत्यास्थता सीमा के परे, वह है जहाँ कार्य पुनर्प्राप्य नहीं। (दूसरा दृढ़ता को क्षमता से गड्डमड्ड करता है, और तीसरा मापांक छोड़ देता है, जो यहाँ दोनों पदार्थों को अलग करने वाली एकमात्र चीज़ है।)",
          mr: "प्रश्न चांगला आहे कारण त्याची दोन परस्परविरोधी उत्तरे दिसतात, आणि दोन्ही अंतःप्रेरणा अंशतः बरोबर आहेत. आधी गणना घ्या. प्रति एकक घनफळ साठलेली ऊर्जा ½ × प्रतिबल × विकृती, आणि प्रतिबल म्हणजे Y गुणिले विकृती, म्हणून साठलेल्या ऊर्जेची घनता ½Yε². ताण ठरवा आणि तुम्ही ε ठरवले. दोन्ही नमुन्यांची लांबी एक, आडवा छेद एक आणि म्हणून घनफळ एक. म्हणून साठलेल्या ऊर्जांचे गुणोत्तर फक्त मापांकांचे गुणोत्तर, आणि पोलादाचे कदाचित रबराच्या हजारपट. त्या विशिष्ट प्रयोगासाठी पोलाद प्रचंड फरकाने जिंकते. समतुल्यपणे: पोलाद तितके ताणायला तुम्हाला प्रचंड जोर लावावा लागला, आणि ते सर्व कार्य आता त्याच्या आत आहे. रबर सहज नमले, म्हणून कार्य कमी झाले. आता गलोल, जी न दिसता प्रश्न बदलते. गलोलला असे सांगितले जात नाही की ठरलेल्या लहान ताणावर ऊर्जा साठव; तिला सांगितले जाते की तुटण्याआधी वा वापरणाऱ्याचा हात हरण्याआधी जितकी शक्य तितकी साठव. इथे मर्यादाच महत्त्वाच्या. पोलादाचा प्रत्यास्थ पल्ला सुमारे 0.001 विकृतीवर संपतो — त्याचा एक मीटर कायमचे विरूपण घेण्याआधी सुमारे एक मिलीमीटर ताणला जातो. रबराला 3 वा त्याहून अधिक विकृतीपर्यंत नेता येते, हजारपट पुढे. साठलेली ऊर्जा ε² नुसार जात असल्याने, रबराची कितीतरी मोठी गाठता येणारी विकृती त्याच्या कितीतरी लहान मापांकावर वरचढ ठरते, आणि अपयशाआधी त्याची एकूण क्षमता कितीतरी अधिक. त्या युक्तिवादाचा सामान्य आकार काढण्याजोगा: लहान गुणक आणि मोठा वर्गित गुणक यांचा गुणाकार वर्गित गुणकाने ठरतो. दोन व्यावहारिक मुद्दे निघतात. पहिला, म्हणूनच धनुष्याच्या भुजा आणि गलोलचे इलॅस्टिक अशा पदार्थांचे बनतात जे दूरवर ताणता येतात, तर पुलाची दोरी अशा पदार्थाची जी जेमतेम ताणता येते — ती वेगळ्या प्रश्नांची उत्तरे, साठवण विरुद्ध ताठरता. दुसरा, म्हणूनच तुटणारी पोलादी दोरी इतकी धोकादायक. अपयशाच्या बिंदूवर तिची प्रति एकक घनफळ साठलेली ऊर्जा रबराहून कमी, पण लांब दोरी हे मोठे घनफळ, आणि ती सर्व ऊर्जा मिलिसेकंदांत गतिज ऊर्जा बनते आणि तिला शोषायला काहीही नसते. कार्यशाळेत ताणलेल्या दोरीशी नेमक्या याच कारणाने आदराने वागले जाते. चुकीच्या उत्तरांवर एक शेवटची टिप्पणी. चौथे स्पष्टपणे नाव घेण्याजोगे कारण ते व्याख्या उलटवते: प्रत्यास्थ विरूपण हाच नेमका तो प्रकार जो पुन्हा मिळवण्याजोगी ऊर्जा साठवतो, आणि त्याला प्रत्यास्थ म्हणतात कारण ऊर्जा परत येते. सुघट्य विरूपण, प्रत्यास्थता मर्यादेपलीकडचे, तिथे कार्य पुन्हा मिळवता येत नाही. (दुसरे ताठरतेची क्षमतेशी गल्लत करते, आणि तिसरे मापांक वगळते, जो इथे दोन्ही पदार्थांना वेगळे करणारी एकमेव गोष्ट आहे.)",
        },
      },
      /*H8*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — Mechanical Properties of Fluids                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-mechanical-properties-of-fluids",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 9 — Mechanical Properties of Fluids",
      hi: "अध्याय 9 — तरलों के यांत्रिक गुण",
      mr: "प्रकरण 9 — प्रवाहींचे यांत्रिक गुणधर्म",
    },
    name: {
      en: "Mechanical Properties of Fluids",
      hi: "तरलों के यांत्रिक गुण",
      mr: "प्रवाहींचे यांत्रिक गुणधर्म",
    },
    summary: {
      en: "A substance that cannot resist being sheared has to be described a different way: a pressure that depends on depth and not on how wide the vessel is, a small force turned into a large one by an incompressible liquid, an upthrust that is exactly the weight of what got out of the way, a resistance that grows with speed until falling stops accelerating, a skin that is not a skin, and a moving fluid whose pressure drops precisely where it speeds up.",
      hi: "जो पदार्थ अपरूपण का प्रतिरोध नहीं कर सकता उसका वर्णन दूसरे ढंग से करना पड़ता है: वह दाब जो गहराई पर निर्भर है, इस पर नहीं कि पात्र कितना चौड़ा है, वह छोटा बल जो असंपीड्य द्रव बड़े में बदल देता है, वह उत्प्लावन जो ठीक उतना है जितना हटाए गए द्रव का भार, वह प्रतिरोध जो चाल के साथ बढ़ता है जब तक पतन त्वरित होना बंद न कर दे, वह त्वचा जो त्वचा नहीं, और वह बहता तरल जिसका दाब ठीक वहीं गिरता है जहाँ वह तेज़ होता है।",
      mr: "जो पदार्थ कर्तनाला विरोध करू शकत नाही त्याचे वर्णन वेगळ्या पद्धतीने करावे लागते: तो दाब जो खोलीवर अवलंबून, भांडे किती रुंद यावर नाही, ते लहान बल जे असंपीड्य द्रव मोठ्यात बदलते, तो उत्प्लावक जोर जो नेमका बाजूला सरकवलेल्या द्रवाच्या वजनाइतका, तो विरोध जो चालीसह वाढतो जोवर पतन त्वरित होणे थांबवत नाही, ती त्वचा जी त्वचा नाही, आणि तो वाहणारा प्रवाही ज्याचा दाब नेमका तिथेच घटतो जिथे तो वेगवान होतो.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "pressure-at-a-depth",
        name: {
          en: "Pressure at a depth",
          hi: "गहराई पर दाब",
          mr: "खोलीवरील दाब",
        },
        kind: "statics",
        prompt: {
          en: "A narrow tube and a wide tank filled to the same level press equally hard on their bases per unit area, because the quantity depends on ρgh alone and not on how much liquid is standing above. Which quantity is this?",
          hi: "एक ही स्तर तक भरी पतली नली और चौड़ी टंकी अपने तलों पर प्रति एकांक क्षेत्रफल बराबर दबाव डालती हैं, क्योंकि यह राशि केवल ρgh पर निर्भर है, इस पर नहीं कि ऊपर कितना द्रव खड़ा है। यह कौन-सी राशि है?",
          mr: "एकाच पातळीपर्यंत भरलेली अरुंद नळी आणि रुंद टाकी आपल्या तळांवर प्रति एकक क्षेत्रफळ सारखाच दाब देतात, कारण ही राशी केवळ ρgh वर अवलंबून, वर किती द्रव उभा आहे यावर नाही. ही कोणती राशी?",
        },
        statement: {
          en: "The pressure at a depth h in a fluid at rest is ρgh above the surface pressure, and it depends only on the depth, the density and g — never on the shape or width of the container.",
          hi: "विराम में तरल के भीतर h गहराई पर दाब सतह के दाब से ρgh अधिक होता है, और वह केवल गहराई, घनत्व और g पर निर्भर है — पात्र के आकार या चौड़ाई पर कभी नहीं।",
          mr: "स्थिर प्रवाहीत h खोलीवरचा दाब पृष्ठभागाच्या दाबाहून ρgh अधिक असतो, आणि तो केवळ खोली, घनता आणि g वर अवलंबून — भांड्याच्या आकारावर वा रुंदीवर कधीही नाही.",
        },
        detail: {
          en: "This is the hydrostatic paradox: a kilogram of water in a flaring vessel can exert a base force of many kilograms' weight, because the slanting walls push down on the liquid too.",
          hi: "यही द्रवस्थैतिक विरोधाभास है: फैलते पात्र में एक किलोग्राम पानी तल पर कई किलोग्राम भार जितना बल लगा सकता है, क्योंकि तिरछी दीवारें भी द्रव पर नीचे धकेलती हैं।",
          mr: "हाच द्रवस्थितिक विरोधाभास: पसरणाऱ्या भांड्यातले एक किलोग्रॅम पाणी तळावर कित्येक किलोग्रॅम वजनाइतके बल लावू शकते, कारण तिरप्या भिंतीही द्रवावर खाली रेटतात.",
        },
        extra: {
          en: "It acts equally in every direction at a point, which is why a diver's ears hurt sideways as well as from above and why a submarine's hull is under load all round.",
          hi: "वह किसी बिंदु पर हर दिशा में बराबर लगता है, इसीलिए गोताखोर के कान ऊपर से ही नहीं बग़ल से भी दुखते हैं और इसीलिए पनडुब्बी का ढाँचा चारों ओर से भार में रहता है।",
          mr: "तो एखाद्या बिंदूवर प्रत्येक दिशेने सारखाच लागतो, म्हणूनच गोताखोराचे कान वरूनच नव्हे तर बाजूनेही दुखतात आणि म्हणूनच पाणबुडीचा सांगाडा सर्व बाजूंनी ओझ्याखाली असतो.",
        },
        pair: {
          left: {
            en: "A narrow tube pressing as hard as a wide tank",
            hi: "चौड़ी टंकी जितना ही दबाती पतली नली",
            mr: "रुंद टाकीइतकाच दाब देणारी अरुंद नळी",
          },
          right: {
            en: "pressure at a depth",
            hi: "गहराई पर दाब",
            mr: "खोलीवरील दाब",
          },
        },
      },
      {
        id: "pascals-law",
        name: {
          en: "Pascal's law",
          hi: "पास्कल का नियम",
          mr: "पास्कलचा नियम",
        },
        kind: "statics",
        prompt: {
          en: "Press on a small piston and the same increase appears undiminished at every point of the enclosed liquid, so a large piston fifty times the area feels fifty times the force. Which law is this?",
          hi: "छोटे पिस्टन पर दबाओ और वही वृद्धि बंद द्रव के हर बिंदु पर बिना घटे प्रकट होती है, अतः पचास गुना क्षेत्रफल वाला बड़ा पिस्टन पचास गुना बल महसूस करता है। यह कौन-सा नियम है?",
          mr: "लहान पिस्टनवर दाबा आणि तीच वाढ बंदिस्त द्रवाच्या प्रत्येक बिंदूवर न घटता प्रकट होते, म्हणून पन्नासपट क्षेत्रफळाचा मोठा पिस्टन पन्नासपट बल अनुभवतो. हा कोणता नियम?",
        },
        statement: {
          en: "Pascal's law states that a pressure applied to an enclosed incompressible fluid is transmitted undiminished to every part of it, which is what lets a hydraulic press multiply force.",
          hi: "पास्कल का नियम कहता है कि बंद असंपीड्य तरल पर लगाया दाब उसके हर भाग तक बिना घटे संचरित होता है, और यही द्रवचालित प्रेस को बल बढ़ाने देता है।",
          mr: "पास्कलचा नियम सांगतो की बंदिस्त असंपीड्य प्रवाहीवर लावलेला दाब त्याच्या प्रत्येक भागापर्यंत न घटता संक्रमित होतो, आणि हेच द्रवचालित प्रेसला बल वाढवू देते.",
        },
        detail: {
          en: "Force is multiplied but work is not: the large piston moves as many times less far as it pushes harder, so the machine buys convenience and never energy.",
          hi: "बल बढ़ता है पर कार्य नहीं: बड़ा पिस्टन उतने ही गुना कम चलता है जितने गुना अधिक ज़ोर लगाता है, अतः यंत्र सुविधा ख़रीदता है, ऊर्जा कभी नहीं।",
          mr: "बल वाढते पण कार्य नाही: मोठा पिस्टन जितक्या पटीने अधिक जोर लावतो तितक्या पटीने कमी सरकतो, म्हणून यंत्र सोय विकत घेते, ऊर्जा कधीच नाही.",
        },
        extra: {
          en: "It works only because liquids are nearly incompressible; a hydraulic system with an air bubble in it goes soft, because the bubble squashes instead of transmitting.",
          hi: "यह इसीलिए चलता है कि द्रव लगभग असंपीड्य हैं; जिस द्रवचालित तंत्र में हवा का बुलबुला हो वह ढीला पड़ जाता है, क्योंकि बुलबुला संचरित करने के बजाय दब जाता है।",
          mr: "हे यामुळेच चालते की द्रव जवळपास असंपीड्य आहेत; ज्या द्रवचालित प्रणालीत हवेचा बुडबुडा असतो ती ढिली पडते, कारण बुडबुडा संक्रमित करण्याऐवजी दबतो.",
        },
        pair: {
          left: {
            en: "Force multiplied, work never",
            hi: "बल बढ़ा, कार्य कभी नहीं",
            mr: "बल वाढले, कार्य कधीच नाही",
          },
          right: {
            en: "Pascal's law",
            hi: "पास्कल का नियम",
            mr: "पास्कलचा नियम",
          },
        },
      },
      {
        id: "upthrust-and-displaced-fluid",
        name: {
          en: "Upthrust and the displaced fluid",
          hi: "उत्प्लावन और हटाया गया तरल",
          mr: "उत्प्लावक जोर आणि सरकवलेले प्रवाही",
        },
        kind: "statics",
        prompt: {
          en: "The upward force on a submerged body is the weight of exactly the fluid that used to occupy that space, which is why an iron ship floats and an iron nail does not. Which result is this?",
          hi: "डूबे पिंड पर ऊर्ध्वमुखी बल ठीक उतने तरल का भार है जो पहले उस जगह को घेरे था, इसीलिए लोहे का जहाज़ तैरता है और लोहे की कील नहीं। यह कौन-सा परिणाम है?",
          mr: "बुडलेल्या पिंडावरचे वरचे बल नेमक्या तितक्या प्रवाहीचे वजन जे आधी ती जागा व्यापत होते, म्हणूनच लोखंडी जहाज तरंगते आणि लोखंडी खिळा नाही. हा कोणता निकाल?",
        },
        statement: {
          en: "The upthrust on a body equals the weight of the fluid it displaces, so a body floats when it can displace its own weight before going fully under.",
          hi: "पिंड पर उत्प्लावन उसके द्वारा हटाए गए तरल के भार के बराबर है, अतः पिंड तब तैरता है जब वह पूरी तरह डूबने से पहले अपने भार जितना तरल हटा सके।",
          mr: "पिंडावरचा उत्प्लावक जोर त्याने सरकवलेल्या प्रवाहीच्या वजनाइतका, म्हणून पिंड तेव्हा तरंगतो जेव्हा तो पूर्ण बुडण्याआधी स्वतःच्या वजनाइतके प्रवाही सरकवू शकतो.",
        },
        detail: {
          en: "It follows from the depth rule alone: the bottom of a submerged body is deeper than its top, so the upward push exceeds the downward one by exactly ρVg.",
          hi: "यह अकेले गहराई-नियम से निकलता है: डूबे पिंड का तल उसके शिखर से गहरा है, अतः ऊर्ध्वमुखी धक्का अधोमुखी से ठीक ρVg अधिक होता है।",
          mr: "हे केवळ खोली-नियमातूनच निघते: बुडलेल्या पिंडाचा तळ त्याच्या शिखराहून खोल असतो, म्हणून वरचा रेटा खालच्याहून नेमका ρVg ने अधिक असतो.",
        },
        extra: {
          en: "The fraction of a floating body that stays submerged is the ratio of its density to the fluid's, which is why nine-tenths of an iceberg is below the waterline.",
          hi: "तैरते पिंड का जितना अंश डूबा रहता है वह उसके घनत्व और तरल के घनत्व का अनुपात है, इसीलिए हिमशैल का नौ-दसवाँ भाग जल-रेखा के नीचे रहता है।",
          mr: "तरंगत्या पिंडाचा जितका अंश बुडलेला राहतो तो त्याच्या घनतेचे आणि प्रवाहीच्या घनतेचे गुणोत्तर, म्हणूनच हिमनगाचा नऊ-दशांश भाग जलरेषेखाली राहतो.",
        },
        pair: {
          left: {
            en: "An iron ship floats and an iron nail sinks",
            hi: "लोहे का जहाज़ तैरता, लोहे की कील डूबती",
            mr: "लोखंडी जहाज तरंगते, लोखंडी खिळा बुडतो",
          },
          right: {
            en: "upthrust and the displaced fluid",
            hi: "उत्प्लावन और हटाया गया तरल",
            mr: "उत्प्लावक जोर आणि सरकवलेले प्रवाही",
          },
        },
      },
      {
        id: "viscosity",
        name: {
          en: "Viscosity",
          hi: "श्यानता",
          mr: "श्यानता",
        },
        kind: "flow",
        prompt: {
          en: "Honey resists being stirred and water barely does, because one layer of fluid drags on the next whenever they slide past each other at different speeds. Which property is this?",
          hi: "शहद हिलाए जाने का विरोध करता है और पानी मुश्किल से, क्योंकि जब भी तरल की दो परतें भिन्न चालों से एक-दूसरे के पास से सरकती हैं, एक दूसरी को घसीटती है। यह कौन-सा गुण है?",
          mr: "मध ढवळण्यास विरोध करते आणि पाणी जेमतेम, कारण जेव्हा प्रवाहीचे दोन थर वेगवेगळ्या चालींनी एकमेकांजवळून सरकतात तेव्हा एक दुसऱ्याला ओढतो. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Viscosity is a fluid's internal friction: the tangential force between adjacent layers is proportional to the velocity gradient across them and to the area of contact.",
          hi: "श्यानता तरल का आंतरिक घर्षण है: निकटवर्ती परतों के बीच स्पर्शरेखीय बल उनके आर-पार वेग-प्रवणता और संपर्क क्षेत्रफल के समानुपाती होता है।",
          mr: "श्यानता म्हणजे प्रवाहीचे आंतरिक घर्षण: शेजारच्या थरांमधले स्पर्शरेषीय बल त्यांच्यातील वेग-प्रवणता आणि स्पर्श क्षेत्रफळाच्या समानुपाती असते.",
        },
        detail: {
          en: "It falls sharply as a liquid is warmed and RISES as a gas is warmed, because liquid molecules loosen their grip while gas molecules simply cross between layers more often.",
          hi: "द्रव के गरम होने पर वह तेज़ी से घटती है और गैस के गरम होने पर बढ़ती है, क्योंकि द्रव के अणु अपनी पकड़ ढीली कर देते हैं जबकि गैस के अणु परतों के बीच बस अधिक बार आते-जाते हैं।",
          mr: "द्रव तापताना ती झपाट्याने घटते आणि वायू तापताना वाढते, कारण द्रवाचे रेणू आपली पकड सैल करतात तर वायूचे रेणू थरांमध्ये फक्त अधिक वेळा ये-जा करतात.",
        },
        extra: {
          en: "It is the reason a real fluid sticks to a pipe's wall with zero velocity there, so the flow is fastest along the axis and the discharge depends on the fourth power of the radius.",
          hi: "इसी से असली तरल नली की दीवार से चिपक जाता है जहाँ उसका वेग शून्य होता है, अतः प्रवाह अक्ष के अनुदिश सबसे तेज़ है और निस्सरण त्रिज्या की चौथी घात पर निर्भर करता है।",
          mr: "यामुळेच खरे प्रवाही नळीच्या भिंतीला चिकटते जिथे त्याचा वेग शून्य असतो, म्हणून प्रवाह अक्षाच्या दिशेने सर्वांत वेगवान आणि विसर्ग त्रिज्येच्या चौथ्या घातेवर अवलंबून.",
        },
        pair: {
          left: {
            en: "Warming thins a liquid and thickens a gas",
            hi: "गरम करना द्रव को पतला और गैस को गाढ़ा करता है",
            mr: "तापवणे द्रव पातळ आणि वायू दाट करते",
          },
          right: {
            en: "viscosity",
            hi: "श्यानता",
            mr: "श्यानता",
          },
        },
      },
      {
        id: "terminal-velocity",
        name: {
          en: "Terminal velocity",
          hi: "सीमांत वेग",
          mr: "सीमावर्ती वेग",
        },
        kind: "flow",
        prompt: {
          en: "A raindrop accelerates for a moment and then falls the rest of the way at an unchanging speed, because the drag grows with speed until it exactly cancels the weight less the upthrust. Which speed is this?",
          hi: "बूँद एक क्षण त्वरित होती है और फिर बाक़ी रास्ता अपरिवर्तित चाल से गिरती है, क्योंकि कर्षण चाल के साथ बढ़ता है जब तक वह भार घटा उत्प्लावन को ठीक-ठीक न काट दे। यह कौन-सी चाल है?",
          mr: "थेंब क्षणभर त्वरित होतो आणि मग उरलेली वाट अपरिवर्तित चालीने पडतो, कारण ओढ चालीसह वाढतो जोवर तो वजन वजा उत्प्लावक जोर नेमका कापत नाही. ही कोणती चाल?",
        },
        statement: {
          en: "Terminal velocity is reached when the viscous drag plus the upthrust equals the weight, so the net force is zero and the body falls at a constant speed thereafter.",
          hi: "सीमांत वेग तब मिलता है जब श्यान कर्षण जोड़ उत्प्लावन भार के बराबर हो जाए, अतः परिणामी बल शून्य होता है और पिंड उसके बाद अचर चाल से गिरता है।",
          mr: "सीमावर्ती वेग तेव्हा गाठला जातो जेव्हा श्यान ओढ अधिक उत्प्लावक जोर वजनाइतका होतो, म्हणून परिणामी बल शून्य आणि पिंड त्यानंतर अचल चालीने पडतो.",
        },
        detail: {
          en: "For a small sphere it goes as the square of the radius, so a drop of twice the radius falls four times as fast, and a fine mist can hang in the air for hours.",
          hi: "छोटे गोले के लिए वह त्रिज्या के वर्ग के अनुसार चलती है, अतः दुगुनी त्रिज्या की बूँद चार गुना तेज़ गिरती है, और महीन कोहरा घंटों हवा में टँगा रह सकता है।",
          mr: "लहान गोलासाठी ती त्रिज्येच्या वर्गानुसार जाते, म्हणून दुप्पट त्रिज्येचा थेंब चौपट वेगाने पडतो, आणि बारीक धुके तासन्तास हवेत टांगून राहू शकते.",
        },
        extra: {
          en: "It is the reason a parachute works: opening it multiplies the drag enormously without changing the weight, so a much lower speed is now enough to balance.",
          hi: "इसी से पैराशूट काम करता है: उसे खोलने से कर्षण विशाल रूप से बढ़ जाता है जबकि भार नहीं बदलता, अतः संतुलन के लिए अब कहीं कम चाल पर्याप्त है।",
          mr: "यामुळेच पॅराशूट चालते: ते उघडल्याने ओढ प्रचंड वाढतो तर वजन बदलत नाही, म्हणून संतुलनासाठी आता कितीतरी कमी चाल पुरेशी.",
        },
        pair: {
          left: {
            en: "Falling with no acceleration at all",
            hi: "बिना किसी त्वरण के गिरना",
            mr: "कोणत्याही त्वरणाशिवाय पडणे",
          },
          right: {
            en: "terminal velocity",
            hi: "सीमांत वेग",
            mr: "सीमावर्ती वेग",
          },
        },
      },
      {
        id: "surface-tension",
        name: {
          en: "Surface tension",
          hi: "पृष्ठ तनाव",
          mr: "पृष्ठताण",
        },
        kind: "surface",
        prompt: {
          en: "A needle laid gently on water rests in a dimple without sinking, and a free drop pulls itself into a sphere, because a molecule at the surface has neighbours only on one side. Which property is this?",
          hi: "पानी पर धीरे से रखी सुई बिना डूबे एक गड्ढे में टिकी रहती है, और स्वतंत्र बूँद अपने को गोले में खींच लेती है, क्योंकि सतह पर बैठे अणु के पड़ोसी केवल एक ओर हैं। यह कौन-सा गुण है?",
          mr: "पाण्यावर हळूच ठेवलेली सुई न बुडता एका खळगीत टिकते, आणि मोकळा थेंब स्वतःला गोलात ओढतो, कारण पृष्ठभागावरील रेणूला शेजारी फक्त एकाच बाजूला असतात. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Surface tension is the energy needed to create unit area of new surface, equivalently a force per unit length along any line in the surface, and it makes a free liquid take the shape of least area.",
          hi: "पृष्ठ तनाव एकांक क्षेत्रफल की नई सतह बनाने के लिए चाहिए ऊर्जा है, समतुल्य रूप से सतह की किसी भी रेखा के अनुदिश प्रति एकांक लंबाई बल, और वह स्वतंत्र द्रव को न्यूनतम क्षेत्रफल का आकार दे देता है।",
          mr: "पृष्ठताण म्हणजे एकक क्षेत्रफळाचा नवा पृष्ठभाग तयार करायला लागणारी ऊर्जा, समतुल्यपणे पृष्ठभागातील कोणत्याही रेषेच्या दिशेने प्रति एकक लांबी बल, आणि तो मोकळ्या द्रवाला कमीत कमी क्षेत्रफळाचा आकार देतो.",
        },
        detail: {
          en: "The excess pressure inside a curved surface is 2T/r for a drop and 4T/r for a soap bubble, which has two surfaces, so the smaller of two connected bubbles empties into the larger.",
          hi: "वक्र सतह के भीतर अतिरिक्त दाब बूँद के लिए 2T/r है और साबुन के बुलबुले के लिए 4T/r, जिसकी दो सतहें हैं, अतः जुड़े दो बुलबुलों में छोटा बड़े में ख़ाली हो जाता है।",
          mr: "वक्र पृष्ठभागाच्या आत जादा दाब थेंबासाठी 2T/r आणि साबणाच्या बुडबुड्यासाठी 4T/r, ज्याला दोन पृष्ठभाग असतात, म्हणून जोडलेल्या दोन बुडबुड्यांत लहान मोठ्यात रिकामा होतो.",
        },
        extra: {
          en: "It falls as temperature rises and is destroyed by a detergent, which is precisely how soap lets water wet a greasy plate and creep into cloth.",
          hi: "ताप बढ़ने पर वह घटता है और अपमार्जक से नष्ट हो जाता है, और ठीक इसी से साबुन पानी को चिकनी थाली भिगोने और कपड़े में रिसने देता है।",
          mr: "तापमान वाढताना तो घटतो आणि डिटर्जंटने नष्ट होतो, आणि नेमके यामुळेच साबण पाण्याला तेलकट ताट भिजवू देतो आणि कापडात मुरू देतो.",
        },
        pair: {
          left: {
            en: "Two joined bubbles, and the small one empties",
            hi: "जुड़े दो बुलबुले, और छोटा ख़ाली हो जाता है",
            mr: "जोडलेले दोन बुडबुडे, आणि लहान रिकामा होतो",
          },
          right: {
            en: "surface tension",
            hi: "पृष्ठ तनाव",
            mr: "पृष्ठताण",
          },
        },
      },
      {
        id: "bernoullis-principle",
        name: {
          en: "Bernoulli's principle",
          hi: "बर्नूली का सिद्धांत",
          mr: "बर्नूलीचे तत्त्व",
        },
        kind: "flow",
        prompt: {
          en: "Blow across the top of a sheet of paper and it rises rather than being pushed down, because along a streamline the sum of pressure, ½ρv² and ρgh stays constant. Which principle is this?",
          hi: "काग़ज़ की शीट के ऊपर से फूँक मारो और वह नीचे धकेले जाने के बजाय उठती है, क्योंकि किसी धारा-रेखा पर दाब, ½ρv² और ρgh का योग अचर रहता है। यह कौन-सा सिद्धांत है?",
          mr: "कागदाच्या पानावरून फुंकर मारा आणि ते खाली ढकलले जाण्याऐवजी वर उचलले जाते, कारण एखाद्या धारारेषेवर दाब, ½ρv² आणि ρgh यांची बेरीज अचल राहते. हे कोणते तत्त्व?",
        },
        statement: {
          en: "Bernoulli's principle states that for steady, non-viscous, incompressible flow the quantity P + ½ρv² + ρgh is the same at all points of a streamline, so pressure falls where speed rises.",
          hi: "बर्नूली का सिद्धांत कहता है कि स्थायी, अश्यान, असंपीड्य प्रवाह के लिए राशि P + ½ρv² + ρgh किसी धारा-रेखा के सब बिंदुओं पर एक-सी रहती है, अतः जहाँ चाल बढ़ती है वहाँ दाब गिरता है।",
          mr: "बर्नूलीचे तत्त्व सांगते की स्थिर, अश्यान, असंपीड्य प्रवाहासाठी राशी P + ½ρv² + ρgh धारारेषेच्या सर्व बिंदूंवर सारखी राहते, म्हणून जिथे चाल वाढते तिथे दाब घटतो.",
        },
        detail: {
          en: "It is conservation of energy per unit volume, which is why it fails the moment viscosity matters — a real pipe loses pressure steadily along its length even at constant speed.",
          hi: "यह प्रति एकांक आयतन ऊर्जा का संरक्षण है, इसीलिए जिस क्षण श्यानता मायने रखने लगे वह विफल हो जाता है — असली नली अचर चाल पर भी अपनी लंबाई भर लगातार दाब खोती है।",
          mr: "हे प्रति एकक घनफळ ऊर्जेचे संरक्षण, म्हणूनच ज्या क्षणी श्यानता महत्त्वाची ठरते त्या क्षणी ते अपयशी ठरते — खरी नळी अचल चालीवरही आपल्या लांबीभर सतत दाब गमावते.",
        },
        extra: {
          en: "The continuity equation must be used alongside it: an incompressible fluid crossing a narrower section must speed up, and only then does the pressure drop follow.",
          hi: "उसके साथ सांतत्य समीकरण भी लगाना पड़ता है: असंपीड्य तरल जब सँकरे भाग से गुज़रे तो उसे तेज़ होना ही पड़ता है, और तभी दाब की गिरावट निकलती है।",
          mr: "त्याच्यासोबत सातत्य समीकरणही लावावे लागते: असंपीड्य प्रवाही अरुंद भागातून जाताना त्याला वेगवान व्हावेच लागते, आणि तेव्हाच दाबातील घट निघते.",
        },
        pair: {
          left: {
            en: "Blow over the paper and it lifts",
            hi: "काग़ज़ के ऊपर फूँको और वह उठ जाता है",
            mr: "कागदावरून फुंका आणि तो उचलला जातो",
          },
          right: {
            en: "Bernoulli's principle",
            hi: "बर्नूली का सिद्धांत",
            mr: "बर्नूलीचे तत्त्व",
          },
        },
      },
      /*F9*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A block of ice floats in a glass of water filled exactly to the brim. A student predicts the glass will overflow as the ice melts, since ice takes up more room than water. Decide what happens and explain, then say what changes if the ice contains a stone.",
          hi: "ठीक किनारे तक भरे पानी के गिलास में बर्फ़ का टुकड़ा तैर रहा है। एक विद्यार्थी भविष्यवाणी करता है कि बर्फ़ पिघलने पर गिलास छलकेगा, क्योंकि बर्फ़ पानी से अधिक जगह घेरती है। तय करो क्या होता है और समझाओ, फिर बताओ कि बर्फ़ में पत्थर हो तो क्या बदलता है।",
          mr: "अगदी काठापर्यंत भरलेल्या पाण्याच्या ग्लासात बर्फाचा तुकडा तरंगत आहे. एक विद्यार्थी भाकीत करतो की बर्फ वितळताच ग्लास ओसंडेल, कारण बर्फ पाण्याहून अधिक जागा व्यापते. काय घडते ते ठरवा आणि समजावा, मग बर्फात दगड असल्यास काय बदलते ते सांगा.",
        },
        choices: [
          {
            en: "The level does not change at all. Floating ice displaces water of exactly its own weight, and when it melts it becomes water of exactly that weight, which occupies exactly the volume it was already displacing. With a stone embedded, the level FALLS: while floating, the ice-and-stone displaces water weighing as much as both together, but once melted the stone sinks and displaces only its own smaller volume",
            hi: "स्तर बिलकुल नहीं बदलता। तैरती बर्फ़ ठीक अपने भार जितना पानी हटाती है, और पिघलने पर वह ठीक उतने ही भार का पानी बन जाती है, जो ठीक उतना ही आयतन घेरता है जितना वह पहले से हटा रही थी। पत्थर जड़ा हो तो स्तर गिरता है: तैरते समय बर्फ़-और-पत्थर दोनों के कुल भार जितना पानी हटाते हैं, पर पिघलने पर पत्थर डूब जाता है और केवल अपना छोटा आयतन हटाता है",
            mr: "पातळी मुळीच बदलत नाही. तरंगणारा बर्फ नेमके स्वतःच्या वजनाइतके पाणी सरकवतो, आणि वितळल्यावर तो नेमक्या तितक्याच वजनाचे पाणी बनतो, जे नेमके तितकेच घनफळ व्यापते जितके तो आधीच सरकवत होता. दगड जडलेला असल्यास पातळी घटते: तरंगताना बर्फ-आणि-दगड दोघांच्या एकत्रित वजनाइतके पाणी सरकवतात, पण वितळल्यावर दगड बुडतो आणि केवळ स्वतःचे लहान घनफळ सरकवतो",
          },
          {
            en: "The glass overflows, because ice is less dense than water and therefore occupies more volume than the water it becomes",
            hi: "गिलास छलकता है, क्योंकि बर्फ़ पानी से कम घनी है और इसलिए उस पानी से अधिक आयतन घेरती है जो वह बनती है",
            mr: "ग्लास ओसंडतो, कारण बर्फ पाण्याहून कमी घन आहे आणि म्हणून तो बनणाऱ्या पाण्याहून अधिक घनफळ व्यापतो",
          },
          {
            en: "The level falls in both cases, since melting always reduces the total volume of the contents",
            hi: "दोनों स्थितियों में स्तर गिरता है, क्योंकि पिघलना सदा सामग्री का कुल आयतन घटाता है",
            mr: "दोन्ही स्थितींत पातळी घटते, कारण वितळणे नेहमी सामग्रीचे एकूण घनफळ घटवते",
          },
          {
            en: "The level rises in both cases, because the stone adds its own volume to the water once it is released",
            hi: "दोनों स्थितियों में स्तर चढ़ता है, क्योंकि पत्थर मुक्त होते ही अपना आयतन पानी में जोड़ देता है",
            mr: "दोन्ही स्थितींत पातळी चढते, कारण दगड मोकळा होताच स्वतःचे घनफळ पाण्यात जोडतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's premise is true and the conclusion does not follow from it, which is what makes this a good question. Ice IS less dense than water — about 917 kg/m³ against 1000 — and a given mass of ice does occupy about nine per cent more volume than the same mass of water. But that extra volume is not underwater. It is the part sticking up above the surface. Work it through with numbers. Take 917 g of ice, which occupies 1000 cm³. Floating, it must displace its own weight of water, which is 917 g of water, and 917 g of water occupies 917 cm³. So 917 cm³ of the ice is below the waterline and 83 cm³ stands proud of it. Now let it melt. The 917 g of ice becomes 917 g of water, occupying 917 cm³ — precisely the volume of the hole it was already filling. The new water slots into the space the submerged part had been keeping open, and the level is unchanged to the last millilitre. The nine per cent that shrank was the nine per cent that was above the surface and displacing nothing. This is a general result, not a coincidence of ice: anything floating melts or dissolves into its own displacement without changing the level, provided the liquid it becomes has the density of the liquid it floats in. It is also the reason melting sea ice does not by itself raise sea level, while land ice sliding into the ocean does — the latter was never displacing anything. Now the stone, which turns the question inside out. While the composite floats, the whole assembly must displace water equal to the weight of ice PLUS stone. A 100 g stone of density 2500 kg/m³ occupies only 40 cm³, but while it is being carried by the floating ice it forces the system to displace 100 cm³ of water — a hundred grams' worth. It is displacing by weight, as a floating object does. Once the ice melts the stone is released, sinks, and now displaces by volume: only its own 40 cm³. The system has stopped displacing 100 cm³ on the stone's account and started displacing 40, so the level falls. The general rule worth extracting is the one that resolves all such puzzles: a floating body displaces its own WEIGHT, a submerged body displaces its own VOLUME. Anything that moves an object from the first category to the second lowers the level, and anything that does the reverse raises it. (The wrong answers reason from density to volume without asking which part of the volume was underwater, or credit melting with a shrinkage that the floating condition has already accounted for.)",
          hi: "विद्यार्थी की मान्यता सच है और निष्कर्ष उससे नहीं निकलता, और यही इसे अच्छा प्रश्न बनाता है। बर्फ़ पानी से कम घनी है ही — लगभग 917 kg/m³ के सामने 1000 — और बर्फ़ का दिया द्रव्यमान उतने ही द्रव्यमान के पानी से लगभग नौ प्रतिशत अधिक आयतन घेरता ही है। पर वह अतिरिक्त आयतन पानी के नीचे नहीं है। वह सतह के ऊपर निकला हुआ भाग है। संख्याओं के साथ चलाओ। 917 g बर्फ़ लो, जो 1000 cm³ घेरती है। तैरने के लिए उसे अपने भार जितना पानी हटाना है, यानी 917 g पानी, और 917 g पानी 917 cm³ घेरता है। अतः बर्फ़ का 917 cm³ जल-रेखा के नीचे है और 83 cm³ उससे ऊपर खड़ा है। अब उसे पिघलने दो। 917 g बर्फ़ 917 g पानी बन जाती है, जो 917 cm³ घेरता है — ठीक उसी गड्ढे का आयतन जिसे वह पहले से भर रही थी। नया पानी उसी जगह में समा जाता है जिसे डूबा हिस्सा खुला रखे था, और स्तर अंतिम मिलीलीटर तक अपरिवर्तित रहता है। जो नौ प्रतिशत सिकुड़ा वही नौ प्रतिशत था जो सतह के ऊपर था और कुछ हटा नहीं रहा था। यह सामान्य परिणाम है, बर्फ़ का संयोग नहीं: जो भी तैर रहा हो वह अपने ही विस्थापन में पिघल या घुल जाता है और स्तर नहीं बदलता, बशर्ते वह जो द्रव बने उसका घनत्व उस द्रव जितना हो जिसमें वह तैर रहा था। इसी से यह भी कि समुद्री बर्फ़ का पिघलना स्वयं समुद्र-स्तर नहीं चढ़ाता, जबकि ज़मीन की बर्फ़ का समुद्र में सरकना चढ़ाता है — वह कभी कुछ हटा ही नहीं रही थी। अब पत्थर, जो प्रश्न को उलट देता है। जब तक संयुक्त पिंड तैरता है, पूरे समुच्चय को बर्फ़ जोड़ पत्थर के भार जितना पानी हटाना है। 2500 kg/m³ घनत्व का 100 g पत्थर केवल 40 cm³ घेरता है, पर जब तक उसे तैरती बर्फ़ ढो रही है वह तंत्र को 100 cm³ पानी हटाने पर मजबूर करता है — सौ ग्राम जितना। वह भार से हटा रहा है, जैसा तैरता पिंड करता है। बर्फ़ पिघलते ही पत्थर मुक्त होकर डूबता है, और अब आयतन से हटाता है: केवल अपना 40 cm³. तंत्र ने पत्थर के खाते में 100 cm³ हटाना बंद कर 40 हटाना शुरू कर दिया, अतः स्तर गिरता है। निकालने योग्य सामान्य नियम वही है जो ऐसी सारी पहेलियाँ सुलझाता है: तैरता पिंड अपना भार हटाता है, डूबा पिंड अपना आयतन। जो भी वस्तु को पहली श्रेणी से दूसरी में ले जाए वह स्तर गिराता है, और जो उलटा करे वह चढ़ाता है। (ग़लत उत्तर घनत्व से आयतन तक तर्क करते हैं बिना यह पूछे कि आयतन का कौन-सा भाग पानी के नीचे था, या पिघलने को वह सिकुड़न देते जिसका हिसाब तैरने की शर्त पहले ही रख चुकी है।)",
          mr: "विद्यार्थ्याचे गृहीतक खरे आहे आणि निष्कर्ष त्यातून निघत नाही, आणि हेच याला चांगला प्रश्न बनवते. बर्फ पाण्याहून कमी घन आहेच — सुमारे 917 kg/m³ समोर 1000 — आणि बर्फाचे दिलेले वस्तुमान तितक्याच वस्तुमानाच्या पाण्याहून सुमारे नऊ टक्के अधिक घनफळ व्यापतेच. पण ते जादा घनफळ पाण्याखाली नाही. तो पृष्ठभागावर बाहेर आलेला भाग आहे. संख्यांसह चालवा. 917 g बर्फ घ्या, जो 1000 cm³ व्यापतो. तरंगण्यासाठी त्याला स्वतःच्या वजनाइतके पाणी सरकवावे लागते, म्हणजे 917 g पाणी, आणि 917 g पाणी 917 cm³ व्यापते. म्हणून बर्फाचे 917 cm³ जलरेषेखाली आणि 83 cm³ तिच्यावर उभे. आता तो वितळू द्या. 917 g बर्फ 917 g पाणी बनतो, जे 917 cm³ व्यापते — नेमके त्याच खळगीचे घनफळ जी तो आधीच भरत होता. नवे पाणी त्याच जागेत बसते जी बुडलेल्या भागाने मोकळी ठेवली होती, आणि पातळी शेवटच्या मिलिलिटरपर्यंत अपरिवर्तित राहते. जे नऊ टक्के आकुंचले तेच नऊ टक्के होते जे पृष्ठभागावर होते आणि काहीही सरकवत नव्हते. हा सामान्य निकाल, बर्फाचा योगायोग नव्हे: जे काही तरंगत असेल ते स्वतःच्याच विस्थापनात वितळते वा विरघळते आणि पातळी बदलत नाही, फक्त ते जे द्रव बनते त्याची घनता ज्या द्रवात ते तरंगत होते तितकी असावी. यामुळेच हेही की समुद्री बर्फ वितळणे स्वतः समुद्रपातळी चढवत नाही, तर जमिनीवरचा बर्फ समुद्रात सरकणे चढवते — तो कधीच काही सरकवत नव्हता. आता दगड, जो प्रश्न उलटवतो. जोवर संयुक्त पिंड तरंगतो तोवर अख्ख्या संचाला बर्फ अधिक दगड यांच्या वजनाइतके पाणी सरकवावे लागते. 2500 kg/m³ घनतेचा 100 g दगड केवळ 40 cm³ व्यापतो, पण जोवर त्याला तरंगणारा बर्फ वाहतो तोवर तो प्रणालीला 100 cm³ पाणी सरकवायला भाग पाडतो — शंभर ग्रॅमइतके. तो वजनाने सरकवत आहे, जसे तरंगता पिंड करतो. बर्फ वितळताच दगड मोकळा होऊन बुडतो, आणि आता घनफळाने सरकवतो: केवळ स्वतःचे 40 cm³. प्रणालीने दगडाच्या खात्यात 100 cm³ सरकवणे थांबवून 40 सरकवणे सुरू केले, म्हणून पातळी घटते. काढण्याजोगा सामान्य नियम तोच जो अशी सर्व कोडी सोडवतो: तरंगता पिंड स्वतःचे वजन सरकवतो, बुडलेला पिंड स्वतःचे घनफळ. जे काही वस्तूला पहिल्या वर्गातून दुसऱ्यात नेते ते पातळी घटवते, आणि जे उलट करते ते चढवते. (चुकीची उत्तरे घनतेपासून घनफळापर्यंत युक्तिवाद करतात, घनफळाचा कोणता भाग पाण्याखाली होता हे न विचारता, वा वितळण्याला ती आकुंचन देतात जिचा हिशोब तरंगण्याच्या अटीने आधीच ठेवला आहे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A common explanation of aircraft lift says the air over the curved upper surface has 'further to travel' and so must go faster, lowering the pressure by Bernoulli's principle. Assess this explanation, and say what Bernoulli's principle does and does not establish here.",
          hi: "विमान के उत्थापन की एक आम व्याख्या कहती है कि वक्र ऊपरी सतह के ऊपर की हवा को 'अधिक दूरी तय करनी' है और इसलिए उसे तेज़ जाना ही पड़ता है, जिससे बर्नूली के सिद्धांत से दाब गिरता है। इस व्याख्या का आकलन करो, और बताओ कि यहाँ बर्नूली का सिद्धांत क्या स्थापित करता है और क्या नहीं।",
          mr: "विमानाच्या उत्थापनाचे एक नेहमीचे स्पष्टीकरण सांगते की वक्र वरच्या पृष्ठभागावरील हवेला 'अधिक अंतर कापायचे' असते आणि म्हणून तिला वेगाने जावेच लागते, ज्याने बर्नूलीच्या तत्त्वाने दाब घटतो. या स्पष्टीकरणाचे मूल्यमापन करा, आणि इथे बर्नूलीचे तत्त्व काय प्रस्थापित करते आणि काय नाही ते सांगा.",
        },
        choices: [
          {
            en: "The conclusion is right and the reason is not. Air over the upper surface genuinely does move faster and the pressure there genuinely is lower, and Bernoulli's principle correctly links those two facts. What is invented is the 'equal transit time' premise: nothing requires two parcels of air separated at the leading edge to meet again at the trailing edge, and measurements show the upper parcel arrives first, having gone much faster than the extra path length alone would explain. Bernoulli relates speed to pressure; it does not explain why the speed differs, which comes from the wing's angle and circulation",
            hi: "निष्कर्ष सही है और कारण नहीं। ऊपरी सतह के ऊपर हवा सचमुच तेज़ चलती है और वहाँ दाब सचमुच कम होता है, और बर्नूली का सिद्धांत उन दोनों तथ्यों को ठीक जोड़ता है। गढ़ी हुई है 'बराबर पारगमन-काल' वाली मान्यता: कुछ भी यह नहीं माँगता कि अग्र किनारे पर अलग हुए हवा के दो टुकड़े पश्च किनारे पर फिर मिलें, और माप दिखाते हैं कि ऊपर वाला टुकड़ा पहले पहुँचता है, अतिरिक्त पथ-लंबाई अकेले जितना समझाती उससे कहीं तेज़ जाकर। बर्नूली चाल को दाब से जोड़ता है; वह यह नहीं समझाता कि चाल भिन्न क्यों है, जो पंख के कोण और परिसंचरण से आती है",
            mr: "निष्कर्ष बरोबर आणि कारण नाही. वरच्या पृष्ठभागावरून हवा खरोखर वेगाने जाते आणि तिथला दाब खरोखर कमी असतो, आणि बर्नूलीचे तत्त्व त्या दोन तथ्यांना बरोबर जोडते. घडवलेले आहे ते 'समान पारगमन-काळ' हे गृहीतक: पुढच्या कडेवर वेगळे झालेले हवेचे दोन तुकडे मागच्या कडेवर पुन्हा भेटावेत असे काहीही मागत नाही, आणि मापे दाखवतात की वरचा तुकडा आधी पोहोचतो, जादा मार्गलांबी एकटी जितके समजावेल त्याहून कितीतरी वेगाने जाऊन. बर्नूली चालीला दाबाशी जोडतो; तो चाल वेगळी का हे समजावत नाही, जे पंखाच्या कोनातून आणि परिसंचरणातून येते",
          },
          {
            en: "The explanation is entirely correct, and the equal transit time of the two air parcels is a direct consequence of the continuity equation",
            hi: "व्याख्या पूरी तरह सही है, और हवा के दोनों टुकड़ों का बराबर पारगमन-काल सांतत्य समीकरण का सीधा परिणाम है",
            mr: "स्पष्टीकरण पूर्णपणे बरोबर आहे, आणि हवेच्या दोन्ही तुकड्यांचा समान पारगमन-काळ हा सातत्य समीकरणाचा थेट परिणाम आहे",
          },
          {
            en: "Bernoulli's principle has nothing to do with lift, since it applies only to liquids flowing in pipes and never to air",
            hi: "बर्नूली के सिद्धांत का उत्थापन से कोई लेना-देना नहीं, क्योंकि वह केवल नलियों में बहते द्रवों पर लागू है, हवा पर कभी नहीं",
            mr: "बर्नूलीच्या तत्त्वाचा उत्थापनाशी काहीही संबंध नाही, कारण ते केवळ नळ्यांतून वाहणाऱ्या द्रवांना लागू, हवेला कधीच नाही",
          },
          {
            en: "The whole account is wrong because the pressure above a wing is higher, not lower, which is what pushes the aircraft up",
            hi: "पूरा विवरण ग़लत है क्योंकि पंख के ऊपर दाब कम नहीं बल्कि अधिक होता है, और वही विमान को ऊपर धकेलता है",
            mr: "अख्खे वर्णन चुकीचे कारण पंखावरचा दाब कमी नव्हे तर अधिक असतो, आणि तोच विमानाला वर ढकलतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Separate the three claims that get bundled together, because two of them survive and one does not. Claim one: the air above the wing moves faster than the air below. True, and measurable in a wind tunnel with smoke pulses. Claim two: where the air moves faster, the pressure is lower. True, and this is exactly Bernoulli's principle applied along a streamline — P + ½ρv² is constant when height changes are negligible, so a larger v means a smaller P. The pressure difference integrated over the wing area is a large part of the lift. Claim three: the air above moves faster BECAUSE it has further to go and must arrive at the trailing edge at the same moment as the air below. This is the invention. Nothing in fluid mechanics requires two parcels that were adjacent at the leading edge ever to be adjacent again. The premise is simply assumed, and it happens to be false. Smoke-pulse experiments show the upper parcel reaching the trailing edge well BEFORE the lower one, sometimes by a wide margin. Worse, the numbers do not work: on a typical aerofoil the upper surface is only a few per cent longer than the lower, which would give a few per cent speed difference and a small fraction of the lift actually measured. The real speed difference is far larger than the path lengths can account for. There is a decisive counter-example. A flat plate has upper and lower surfaces of identical length, so the equal-transit argument predicts no lift at all — and yet a flat plate tilted into the airflow lifts perfectly well, which is why paper aeroplanes and balsa gliders fly. So does a symmetric aerofoil at an angle, and so does an aircraft flying inverted, which the naive picture cannot survive at all. What actually sets the speed difference is the wing's angle of attack and its shape, which together deflect the oncoming air downwards. The clean way to see the whole thing is Newton's third law: the wing pushes a large mass of air down every second, and the air pushes the wing up by the same force. That description and the pressure description are not rivals; they are the same physics counted in two currencies, and they agree numerically. Bernoulli then tells you how that deflection shows up as a pressure distribution over the surface — which is what an engineer needs, since it says where the load falls on the structure. Two lessons generalise. First, a correct conclusion reached by a wrong argument is still a wrong argument, and it fails the moment the situation changes — here, at the flat plate and the inverted aircraft. Second, Bernoulli's principle is a RELATION between speed and pressure along a streamline, not a cause: it never explains why the speeds differ, and any account that uses it as an engine of explanation has skipped the step that does the real work. (The other wrong answers deny Bernoulli's applicability to gases, which is routine in aerodynamics, or invert the measured pressure distribution, which every wind tunnel contradicts.)",
          hi: "साथ बाँध दिए गए तीन दावों को अलग करो, क्योंकि उनमें से दो टिकते हैं और एक नहीं। पहला दावा: पंख के ऊपर की हवा नीचे की हवा से तेज़ चलती है। सच, और धुएँ के स्पंदों से पवन-सुरंग में नापने योग्य। दूसरा दावा: जहाँ हवा तेज़ चलती है वहाँ दाब कम होता है। सच, और यही धारा-रेखा पर लगाया बर्नूली का सिद्धांत है — ऊँचाई के परिवर्तन नगण्य हों तो P + ½ρv² अचर है, अतः बड़ा v छोटा P देता है। पंख के क्षेत्रफल पर समाकलित यह दाब-अंतर उत्थापन का बड़ा हिस्सा है। तीसरा दावा: ऊपर की हवा इसलिए तेज़ चलती है कि उसे अधिक दूर जाना है और उसे पश्च किनारे पर नीचे की हवा के साथ ही पहुँचना है। यही गढ़ंत है। तरल यांत्रिकी में कुछ भी यह नहीं माँगता कि अग्र किनारे पर बगलगीर रहे दो टुकड़े फिर कभी बगलगीर हों। मान्यता बस मान ली जाती है, और वह संयोग से झूठी है। धूम-स्पंद प्रयोग दिखाते हैं कि ऊपर वाला टुकड़ा नीचे वाले से काफ़ी पहले पश्च किनारे पहुँचता है, कभी-कभी बड़े अंतर से। और बुरा यह कि संख्याएँ नहीं बैठतीं: सामान्य वायुफलक पर ऊपरी सतह निचली से केवल कुछ प्रतिशत लंबी होती है, जो कुछ प्रतिशत चाल-अंतर और वस्तुतः नापे गए उत्थापन का छोटा-सा अंश देगी। असली चाल-अंतर पथ-लंबाइयों के हिसाब से कहीं बड़ा है। एक निर्णायक प्रति-उदाहरण है। चपटी प्लेट की ऊपरी और निचली सतहें बराबर लंबाई की हैं, अतः बराबर-पारगमन तर्क कोई उत्थापन ही नहीं बताता — और फिर भी वायु-प्रवाह में झुकी चपटी प्लेट बख़ूबी उठती है, इसीलिए काग़ज़ के हवाई जहाज़ और बाल्सा के ग्लाइडर उड़ते हैं। सममित वायुफलक भी कोण पर उठता है, और उलटा उड़ता विमान भी, जिसे भोली तस्वीर बिलकुल नहीं झेल सकती। चाल-अंतर वस्तुतः तय करते हैं पंख का आपतन कोण और उसका आकार, जो मिलकर आती हवा को नीचे मोड़ देते हैं। पूरी बात देखने का स्वच्छ रास्ता न्यूटन का तीसरा नियम है: पंख हर सेकंड हवा का बड़ा द्रव्यमान नीचे धकेलता है, और हवा उसी बल से पंख को ऊपर। वह वर्णन और दाब वाला वर्णन प्रतिद्वंद्वी नहीं; वे दो मुद्राओं में गिनी गई एक ही भौतिकी हैं, और वे संख्यात्मक रूप से मिलते हैं। बर्नूली फिर बताता है कि वह मोड़ सतह पर दाब-वितरण के रूप में कैसे दिखता है — और अभियंता को यही चाहिए, क्योंकि वह बताता है कि भार ढाँचे पर कहाँ पड़ता है। दो सबक़ सामान्यीकृत होते हैं। पहला, ग़लत तर्क से पहुँचा सही निष्कर्ष फिर भी ग़लत तर्क है, और स्थिति बदलते ही वह विफल हो जाता है — यहाँ, चपटी प्लेट पर और उलटे विमान पर। दूसरा, बर्नूली का सिद्धांत धारा-रेखा पर चाल और दाब के बीच एक संबंध है, कारण नहीं: वह यह कभी नहीं समझाता कि चालें भिन्न क्यों हैं, और जो भी विवरण उसे व्याख्या का इंजन बनाकर लगाए वह उस क़दम को छोड़ चुका है जो असली काम करता है। (बाक़ी ग़लत उत्तर गैसों पर बर्नूली की प्रयोज्यता नकारते हैं, जो वायुगतिकी में रोज़मर्रा है, या नापे गए दाब-वितरण को उलट देते हैं, जिसका खंडन हर पवन-सुरंग करती है।)",
          mr: "एकत्र बांधल्या जाणाऱ्या तीन दाव्यांना वेगळे करा, कारण त्यांतील दोन टिकतात आणि एक नाही. पहिला दावा: पंखावरची हवा खालच्या हवेहून वेगाने जाते. खरे, आणि धुराच्या स्पंदांनी वाऱ्याच्या बोगद्यात मोजण्याजोगे. दुसरा दावा: जिथे हवा वेगाने जाते तिथे दाब कमी असतो. खरे, आणि हेच धारारेषेवर लावलेले बर्नूलीचे तत्त्व — उंचीतले बदल नगण्य असल्यास P + ½ρv² अचल, म्हणून मोठा v लहान P देतो. पंखाच्या क्षेत्रफळावर समाकलित हा दाब-फरक उत्थापनाचा मोठा भाग. तिसरा दावा: वरची हवा यासाठी वेगाने जाते की तिला अधिक दूर जायचे आहे आणि तिला मागच्या कडेवर खालच्या हवेसोबतच पोहोचायचे आहे. हीच घडवणूक. प्रवाही यामिकीत काहीही हे मागत नाही की पुढच्या कडेवर शेजारी असलेले दोन तुकडे पुन्हा कधी शेजारी यावेत. गृहीतक फक्त गृहीत धरले जाते, आणि ते योगायोगाने खोटे आहे. धूर-स्पंद प्रयोग दाखवतात की वरचा तुकडा खालच्याहून बराच आधी मागच्या कडेवर पोहोचतो, कधीकधी मोठ्या फरकाने. आणि वाईट हे की आकडे बसत नाहीत: सामान्य वायुपात्यावर वरचा पृष्ठभाग खालच्याहून केवळ काही टक्के लांब असतो, जे काही टक्के चाल-फरक आणि प्रत्यक्षात मोजलेल्या उत्थापनाचा लहानसा अंश देईल. खरा चाल-फरक मार्गलांबींच्या हिशोबाहून कितीतरी मोठा. एक निर्णायक प्रतिउदाहरण आहे. सपाट पट्टीचे वरचे आणि खालचे पृष्ठभाग समान लांबीचे, म्हणून समान-पारगमन युक्तिवाद कोणतेही उत्थापनच सांगत नाही — आणि तरीही वायुप्रवाहात कललेली सपाट पट्टी उत्तम उचलली जाते, म्हणूनच कागदी विमाने आणि बाल्साचे ग्लायडर उडतात. सममित वायुपातेही कोनावर उचलले जाते, आणि उलटे उडणारे विमानही, जे भोळे चित्र मुळीच सोसू शकत नाही. चाल-फरक प्रत्यक्षात ठरवतात पंखाचा आपतन कोन आणि त्याचा आकार, जे मिळून येणारी हवा खाली वळवतात. अख्खी गोष्ट पाहण्याचा स्वच्छ मार्ग म्हणजे न्यूटनचा तिसरा नियम: पंख प्रत्येक सेकंदाला हवेचे मोठे वस्तुमान खाली ढकलतो, आणि हवा त्याच बलाने पंखाला वर. ते वर्णन आणि दाबाचे वर्णन प्रतिस्पर्धी नाहीत; ती दोन चलनांत मोजलेली एकच भौतिकी, आणि ती संख्यात्मकदृष्ट्या जुळतात. बर्नूली मग सांगतो की ते वळण पृष्ठभागावर दाब-वितरण म्हणून कसे दिसते — आणि अभियंत्याला हेच लागते, कारण ते सांगते की ओझे सांगाड्यावर कुठे पडते. दोन धडे सामान्यीकृत होतात. पहिला, चुकीच्या युक्तिवादाने गाठलेला बरोबर निष्कर्ष तरीही चुकीचा युक्तिवादच, आणि परिस्थिती बदलताच तो अपयशी ठरतो — इथे, सपाट पट्टीवर आणि उलट्या विमानावर. दुसरा, बर्नूलीचे तत्त्व हे धारारेषेवरील चाल आणि दाब यांच्यातील संबंध, कारण नव्हे: ते चाली वेगळ्या का हे कधीच समजावत नाही, आणि जे वर्णन त्याला स्पष्टीकरणाचे इंजिन म्हणून वापरते ते खरे काम करणारा टप्पा वगळून गेले आहे. (उरलेली चुकीची उत्तरे वायूंवर बर्नूलीची लागूता नाकारतात, जी वायुगतिकीत रोजची आहे, वा मोजलेले दाब-वितरण उलटवतात, ज्याचे खंडन प्रत्येक वाऱ्याचा बोगदा करतो.)",
        },
      },
      /*H9*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 10 — Thermal Properties of Matter                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-thermal-properties-of-matter",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 10 — Thermal Properties of Matter",
      hi: "अध्याय 10 — द्रव्य के तापीय गुण",
      mr: "प्रकरण 10 — द्रव्याचे औष्णिक गुणधर्म",
    },
    name: {
      en: "Thermal Properties of Matter",
      hi: "द्रव्य के तापीय गुण",
      mr: "द्रव्याचे औष्णिक गुणधर्म",
    },
    summary: {
      en: "Heat and temperature stop being the same word: one is what flows and the other is what decides which way it flows. A rail that must be left a gap, a substance that takes four times more heat than iron for every degree, a kilogram of ice at nought degrees that swallows enough energy to boil a kettle and shows nothing for it, a liquid that expands on cooling and saves the fish, and a body that cools quickly at first and then reluctantly.",
      hi: "ऊष्मा और ताप एक ही शब्द होना छोड़ देते हैं: एक वह है जो बहती है और दूसरा वह जो तय करता है कि बहेगी किस ओर। वह पटरी जिसमें अंतराल छोड़ना पड़ता है, वह पदार्थ जो हर डिग्री के लिए लोहे से चार गुना ऊष्मा लेता है, शून्य डिग्री पर बर्फ़ का वह किलोग्राम जो केतली उबालने भर की ऊर्जा निगल जाता है और बदले में कुछ नहीं दिखाता, वह द्रव जो ठंडा होते हुए फैलता है और मछलियों को बचाता है, और वह पिंड जो पहले तेज़ी से और फिर अनमने ढंग से ठंडा होता है।",
      mr: "उष्णता आणि तापमान एकच शब्द असणे थांबतात: एक ती जी वाहते आणि दुसरे ते जे कोणत्या दिशेने वाहील ते ठरवते. तो रूळ ज्यात फट सोडावी लागते, तो पदार्थ जो प्रत्येक अंशासाठी लोखंडाहून चौपट उष्णता घेतो, शून्य अंशावरचा बर्फाचा तो किलोग्रॅम जो केटली उकळण्याइतकी ऊर्जा गिळतो आणि बदल्यात काहीही दाखवत नाही, तो द्रव जो थंड होताना प्रसरण पावतो आणि माशांना वाचवतो, आणि तो पिंड जो आधी झपाट्याने आणि मग नाखुशीने थंड होतो.",
    },
    position: 10,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "thermal-expansion",
        name: {
          en: "Thermal expansion",
          hi: "तापीय प्रसार",
          mr: "औष्णिक प्रसरण",
        },
        kind: "property",
        prompt: {
          en: "Railway lines are laid with gaps, bridges rest on rollers, and a metal lid loosens under hot water, all because a solid's dimensions grow by a fixed fraction for each degree. Which behaviour is this?",
          hi: "रेल की पटरियाँ अंतराल छोड़कर बिछाई जाती हैं, पुल बेलनों पर टिकते हैं, और धातु का ढक्कन गरम पानी में ढीला हो जाता है, यह सब इसलिए कि ठोस की विमाएँ हर डिग्री पर एक नियत अंश से बढ़ती हैं। यह कौन-सा व्यवहार है?",
          mr: "रेल्वेचे रूळ फटी सोडून टाकले जातात, पूल रुळांवर टेकतात, आणि धातूचे झाकण गरम पाण्यात सैल होते, हे सर्व यासाठी की घनपदार्थाच्या मिती प्रत्येक अंशाला एका ठरलेल्या अंशाने वाढतात. हे कोणते वर्तन?",
        },
        statement: {
          en: "A solid's length grows by αLΔT on heating, and the areal and volume coefficients are very nearly 2α and 3α, since expansion happens in every direction at once.",
          hi: "गरम करने पर ठोस की लंबाई αLΔT से बढ़ती है, और क्षेत्रीय तथा आयतन गुणांक लगभग 2α और 3α होते हैं, क्योंकि प्रसार एक साथ हर दिशा में होता है।",
          mr: "तापवल्यावर घनपदार्थाची लांबी αLΔT ने वाढते, आणि क्षेत्रीय व घनफळ गुणांक जवळपास 2α आणि 3α असतात, कारण प्रसरण एकाच वेळी प्रत्येक दिशेने होते.",
        },
        detail: {
          en: "A hole in a plate expands exactly as though it were filled with the same metal, which is why a ring gets larger and not smaller when heated.",
          hi: "प्लेट का छेद ठीक वैसे फैलता है मानो वह उसी धातु से भरा हो, इसीलिए गरम करने पर छल्ला छोटा नहीं बड़ा होता है।",
          mr: "पत्र्यातले छिद्र नेमके तसे प्रसरण पावते जणू ते त्याच धातूने भरलेले असावे, म्हणूनच तापवल्यावर कडे लहान नव्हे तर मोठे होते.",
        },
        extra: {
          en: "Two metals of different α bonded together curve on heating, and that bimetallic strip is the switch inside a thermostat, an iron and a fire alarm.",
          hi: "भिन्न α वाली दो धातुएँ जोड़कर गरम करने पर मुड़ जाती हैं, और वही द्विधात्विक पट्टी तापस्थापी, इस्तरी तथा अग्नि-चेतावनी के भीतर का स्विच है।",
          mr: "वेगळ्या α च्या दोन धातू जोडून तापवल्यास वाकतात, आणि तीच द्विधातू पट्टी थर्मोस्टॅट, इस्त्री आणि अग्निशामक इशाऱ्यातला स्विच.",
        },
        pair: {
          left: {
            en: "The hole grows as if it were made of metal",
            hi: "छेद ऐसे बढ़ता है मानो वह धातु का बना हो",
            mr: "छिद्र असे वाढते जणू ते धातूचे बनले असावे",
          },
          right: {
            en: "thermal expansion",
            hi: "तापीय प्रसार",
            mr: "औष्णिक प्रसरण",
          },
        },
      },
      {
        id: "specific-heat-capacity",
        name: {
          en: "Specific heat capacity",
          hi: "विशिष्ट ऊष्मा धारिता",
          mr: "विशिष्ट उष्णता धारकता",
        },
        kind: "property",
        prompt: {
          en: "The sand on a beach is scorching by noon while the sea beside it is barely warmer, although both received the same sunlight, because one needs far more energy per kilogram per degree. Which property is this?",
          hi: "समुद्रतट की रेत दोपहर तक तप जाती है जबकि उसके पास का समुद्र मुश्किल से गरम होता है, यद्यपि दोनों को वही धूप मिली, क्योंकि एक को प्रति किलोग्राम प्रति डिग्री कहीं अधिक ऊर्जा चाहिए। यह कौन-सा गुण है?",
          mr: "समुद्रकिनाऱ्याची वाळू दुपारपर्यंत तापून जाते तर तिच्याशेजारचा समुद्र जेमतेम उबदार होतो, जरी दोघांना तेच ऊन मिळाले, कारण एकाला प्रति किलोग्रॅम प्रति अंश कितीतरी अधिक ऊर्जा लागते. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Specific heat capacity is the heat needed to raise unit mass by one degree, and water's is about 4200 J per kilogram per kelvin — several times that of most solids.",
          hi: "विशिष्ट ऊष्मा धारिता एकांक द्रव्यमान को एक डिग्री बढ़ाने के लिए चाहिए ऊष्मा है, और पानी की लगभग 4200 J प्रति किलोग्राम प्रति केल्विन है — अधिकांश ठोसों से कई गुना।",
          mr: "विशिष्ट उष्णता धारकता म्हणजे एकक वस्तुमान एक अंशाने वाढवायला लागणारी उष्णता, आणि पाण्याची सुमारे 4200 J प्रति किलोग्रॅम प्रति केल्विन — बहुतांश घनपदार्थांहून कैकपट.",
        },
        detail: {
          en: "Water's unusually large value is why coastal towns have milder summers and winters than inland ones at the same latitude, and why a hot-water bottle beats a hot brick.",
          hi: "पानी का असामान्य रूप से बड़ा मान ही वह कारण है जिससे उसी अक्षांश के तटीय नगरों की गर्मियाँ और सर्दियाँ भीतरी नगरों से हल्की होती हैं, और जिससे गरम पानी की थैली गरम ईंट को हरा देती है।",
          mr: "पाण्याचे असामान्यपणे मोठे मूल्य हेच ते कारण ज्यामुळे त्याच अक्षांशावरील किनारी शहरांचे उन्हाळे आणि हिवाळे अंतर्भागातील शहरांहून सौम्य असतात, आणि ज्यामुळे गरम पाण्याची पिशवी गरम विटेला हरवते.",
        },
        extra: {
          en: "In a mixture the heat lost by the hotter body equals the heat gained by the cooler one, and that single equation fixes the final temperature without knowing anything about the container.",
          hi: "मिश्रण में गरम पिंड द्वारा खोई ऊष्मा ठंडे पिंड द्वारा पाई ऊष्मा के बराबर होती है, और वही अकेला समीकरण पात्र के बारे में कुछ जाने बिना अंतिम ताप तय कर देता है।",
          mr: "मिश्रणात गरम पिंडाने गमावलेली उष्णता थंड पिंडाने मिळवलेल्या उष्णतेइतकी असते, आणि तेच एकमेव समीकरण भांड्याबद्दल काहीही न जाणता शेवटचे तापमान ठरवते.",
        },
        pair: {
          left: {
            en: "Scorching sand beside a barely warm sea",
            hi: "मुश्किल से गरम समुद्र के पास तपती रेत",
            mr: "जेमतेम उबदार समुद्राशेजारी तापलेली वाळू",
          },
          right: {
            en: "specific heat capacity",
            hi: "विशिष्ट ऊष्मा धारिता",
            mr: "विशिष्ट उष्णता धारकता",
          },
        },
      },
      {
        id: "latent-heat",
        name: {
          en: "Latent heat",
          hi: "गुप्त ऊष्मा",
          mr: "सुप्त उष्णता",
        },
        kind: "property",
        prompt: {
          en: "Ice at nought degrees absorbs a great deal of energy and stays at nought degrees until every crystal is gone, because the energy is spent breaking bonds rather than speeding molecules up. Which quantity is this?",
          hi: "शून्य डिग्री पर बर्फ़ बहुत ऊर्जा सोखती है और तब तक शून्य डिग्री पर ही रहती है जब तक हर क्रिस्टल न चला जाए, क्योंकि ऊर्जा अणुओं को तेज़ करने के बजाय बंधन तोड़ने में ख़र्च होती है। यह कौन-सी राशि है?",
          mr: "शून्य अंशावरचा बर्फ खूप ऊर्जा शोषतो आणि प्रत्येक स्फटिक जाईपर्यंत शून्य अंशावरच राहतो, कारण ऊर्जा रेणूंना वेगवान करण्याऐवजी बंध तोडण्यात खर्च होते. ही कोणती राशी?",
        },
        statement: {
          en: "Latent heat is the energy per unit mass absorbed or released during a change of state at constant temperature, so a thermometer records nothing at all while it is being supplied.",
          hi: "गुप्त ऊष्मा अचर ताप पर अवस्था-परिवर्तन के दौरान प्रति एकांक द्रव्यमान सोखी या छोड़ी गई ऊर्जा है, अतः जब तक वह दी जा रही हो तापमापी कुछ भी दर्ज नहीं करता।",
          mr: "सुप्त उष्णता म्हणजे अचल तापमानावर अवस्थाबदलादरम्यान प्रति एकक वस्तुमान शोषली वा सोडली जाणारी ऊर्जा, म्हणून ती दिली जात असताना तापमापक काहीही नोंदवत नाही.",
        },
        detail: {
          en: "Water's latent heat of vaporisation is about six times its latent heat of fusion, which is why a steam burn is so much worse than boiling water at the same temperature.",
          hi: "पानी की वाष्पन की गुप्त ऊष्मा उसकी गलन की गुप्त ऊष्मा की लगभग छह गुनी है, इसीलिए भाप की जलन उसी ताप के खौलते पानी से कहीं बुरी होती है।",
          mr: "पाण्याची बाष्पीभवनाची सुप्त उष्णता तिच्या द्रवीभवनाच्या सुप्त उष्णतेच्या सुमारे सहापट, म्हणूनच वाफेचा भाजका त्याच तापमानाच्या उकळत्या पाण्याहून कितीतरी वाईट असतो.",
        },
        extra: {
          en: "The same store works in reverse: evaporating sweat carries heat away from the skin, and freezing water in an orchard releases heat that can keep the buds just above zero.",
          hi: "वही भंडार उलटा भी चलता है: वाष्पित होता पसीना त्वचा से ऊष्मा ले जाता है, और बग़ीचे में जमता पानी ऊष्मा छोड़ता है जो कलियों को शून्य से ठीक ऊपर रख सकती है।",
          mr: "तोच साठा उलटाही चालतो: बाष्पीभवन होणारा घाम त्वचेवरून उष्णता नेतो, आणि बागेत गोठणारे पाणी उष्णता सोडते जी कळ्यांना शून्याच्या अगदी वर ठेवू शकते.",
        },
        pair: {
          left: {
            en: "Energy poured in and the thermometer does not move",
            hi: "ऊर्जा उड़ेली जाती और तापमापी हिलता नहीं",
            mr: "ऊर्जा ओतली जाते आणि तापमापक हलत नाही",
          },
          right: {
            en: "latent heat",
            hi: "गुप्त ऊष्मा",
            mr: "सुप्त उष्णता",
          },
        },
      },
      {
        id: "anomalous-expansion-of-water",
        name: {
          en: "The anomalous expansion of water",
          hi: "पानी का असामान्य प्रसार",
          mr: "पाण्याचे असामान्य प्रसरण",
        },
        kind: "property",
        prompt: {
          en: "Cool water from 10 °C and it contracts as expected until 4 °C, and then it starts to expand again on the way down to freezing — which is why a pond ices over from the top and the fish survive. Which behaviour is this?",
          hi: "पानी को 10 °C से ठंडा करो और वह अपेक्षा के अनुसार 4 °C तक सिकुड़ता है, फिर हिमांक तक जाते हुए वह दोबारा फैलने लगता है — इसीलिए तालाब ऊपर से जमता है और मछलियाँ बच जाती हैं। यह कौन-सा व्यवहार है?",
          mr: "पाणी 10 °C पासून थंड करा आणि ते अपेक्षेप्रमाणे 4 °C पर्यंत आकुंचते, मग गोठणबिंदूकडे जाताना ते पुन्हा प्रसरण पावू लागते — म्हणूनच तळे वरून गोठते आणि मासे वाचतात. हे कोणते वर्तन?",
        },
        statement: {
          en: "Water has its greatest density at about 4 °C, so it expands both on warming above that point and on cooling below it, unlike almost every other liquid.",
          hi: "पानी का घनत्व लगभग 4 °C पर सबसे अधिक होता है, अतः वह उस बिंदु से ऊपर गरम होने पर भी फैलता है और उससे नीचे ठंडा होने पर भी, लगभग हर दूसरे द्रव के विपरीत।",
          mr: "पाण्याची घनता सुमारे 4 °C वर सर्वाधिक असते, म्हणून ते त्या बिंदूच्या वर तापतानाही प्रसरण पावते आणि त्याखाली थंड होतानाही, जवळपास प्रत्येक इतर द्रवाच्या उलट.",
        },
        detail: {
          en: "The consequence is that the densest water sinks to the bottom of a pond at 4 °C and stays there, so ice forms as a lid on top instead of freezing the pond solid from below.",
          hi: "परिणाम यह कि सबसे घना पानी 4 °C पर तालाब की तली में बैठ जाता है और वहीं रहता है, अतः बर्फ़ नीचे से पूरे तालाब को जमाने के बजाय ऊपर ढक्कन की तरह बनती है।",
          mr: "परिणाम असा की सर्वांत घन पाणी 4 °C वर तळ्याच्या तळाशी बसते आणि तिथेच राहते, म्हणून बर्फ खालून अख्खे तळे गोठवण्याऐवजी वर झाकणासारखा तयार होतो.",
        },
        extra: {
          en: "Ice is also less dense than the water it came from, which is unusual in itself and is why the lid floats rather than sinking and letting a new one form.",
          hi: "बर्फ़ भी उस पानी से कम घनी है जिससे वह बनी, जो अपने आप में असामान्य है और इसीलिए वह ढक्कन डूबकर नया बनने देने के बजाय तैरता रहता है।",
          mr: "बर्फही ज्या पाण्यापासून तो बनला त्याहून कमी घन असतो, जे स्वतःच असामान्य आणि म्हणूनच ते झाकण बुडून नवे तयार होऊ देण्याऐवजी तरंगत राहते.",
        },
        pair: {
          left: {
            en: "A pond that freezes downwards and never through",
            hi: "वह तालाब जो नीचे की ओर जमता है और पूरा कभी नहीं",
            mr: "ते तळे जे खालच्या दिशेने गोठते आणि पूर्ण कधीच नाही",
          },
          right: {
            en: "the anomalous expansion of water",
            hi: "पानी का असामान्य प्रसार",
            mr: "पाण्याचे असामान्य प्रसरण",
          },
        },
      },
      {
        id: "newtons-law-of-cooling",
        name: {
          en: "Newton's law of cooling",
          hi: "न्यूटन का शीतलन नियम",
          mr: "न्यूटनचा शीतलन नियम",
        },
        kind: "transfer",
        prompt: {
          en: "A cup of tea loses ten degrees in the first few minutes and takes far longer to lose the next ten, because the rate of loss is proportional to how far above the room it currently is. Which law is this?",
          hi: "चाय का प्याला पहले कुछ मिनटों में दस डिग्री खोता है और अगले दस खोने में कहीं अधिक समय लेता है, क्योंकि हानि की दर इस पर समानुपाती है कि वह अभी कमरे से कितना ऊपर है। यह कौन-सा नियम है?",
          mr: "चहाचा कप पहिल्या काही मिनिटांत दहा अंश गमावतो आणि पुढचे दहा गमावायला कितीतरी अधिक वेळ घेतो, कारण हानीचा दर तो सध्या खोलीहून किती वर आहे याच्या समानुपाती. हा कोणता नियम?",
        },
        statement: {
          en: "Newton's law of cooling says the rate of heat loss is proportional to the excess of the body's temperature over its surroundings, so cooling slows as the difference shrinks.",
          hi: "न्यूटन का शीतलन नियम कहता है कि ऊष्मा-हानि की दर पिंड के ताप की परिवेश से अधिकता के समानुपाती है, अतः अंतर घटते-घटते शीतलन धीमा होता जाता है।",
          mr: "न्यूटनचा शीतलन नियम सांगतो की उष्णता-हानीचा दर पिंडाच्या तापमानाच्या परिसरावरील अधिक्याच्या समानुपाती, म्हणून फरक घटत जाताना शीतलन मंदावते.",
        },
        detail: {
          en: "It holds only for small temperature differences and forced or gentle convection; a body glowing red loses heat mainly by radiation, which goes as the fourth power of absolute temperature instead.",
          hi: "यह केवल छोटे ताप-अंतरों और प्रेरित या हल्के संवहन पर चलता है; लाल दहकता पिंड मुख्यतः विकिरण से ऊष्मा खोता है, जो इसके बजाय परम ताप की चौथी घात के अनुसार चलता है।",
          mr: "हा केवळ लहान तापमान-फरकांसाठी आणि प्रेरित वा सौम्य अभिसरणासाठी चालतो; लाल तापलेला पिंड मुख्यतः प्रारणाने उष्णता गमावतो, जे त्याऐवजी निरपेक्ष तापमानाच्या चौथ्या घातेनुसार जाते.",
        },
        extra: {
          en: "It is the reason the practical advice about tea is counter-intuitive: adding cold milk immediately keeps the cup drinkable longer than adding it at the end, because a cooler cup then loses heat more slowly.",
          hi: "इसी से चाय के बारे में व्यावहारिक सलाह उलटी लगती है: ठंडा दूध तुरंत डाल देना प्याले को अंत में डालने की अपेक्षा अधिक देर पीने लायक़ रखता है, क्योंकि तब ठंडा प्याला ऊष्मा अधिक धीरे खोता है।",
          mr: "यामुळेच चहाबद्दलचा व्यावहारिक सल्ला उलटा वाटतो: थंड दूध लगेच घातल्याने कप शेवटी घालण्यापेक्षा अधिक वेळ पिण्याजोगा राहतो, कारण तेव्हा थंड कप उष्णता अधिक सावकाश गमावतो.",
        },
        pair: {
          left: {
            en: "The first ten degrees go fastest",
            hi: "पहले दस डिग्री सबसे तेज़ जाते हैं",
            mr: "पहिले दहा अंश सर्वांत वेगाने जातात",
          },
          right: {
            en: "Newton's law of cooling",
            hi: "न्यूटन का शीतलन नियम",
            mr: "न्यूटनचा शीतलन नियम",
          },
        },
      },
      {
        id: "radiation-without-a-medium",
        name: {
          en: "Radiation without a medium",
          hi: "बिना माध्यम के विकिरण",
          mr: "माध्यमाविना प्रारण",
        },
        kind: "transfer",
        prompt: {
          en: "Ninety-three million miles of near-perfect vacuum lie between the Sun and a sunburnt shoulder, so whatever carried the energy needed no particles to pass it along. Which mode of transfer is this?",
          hi: "सूर्य और धूप से झुलसे कंधे के बीच लगभग पंद्रह करोड़ किलोमीटर का लगभग पूर्ण निर्वात है, अतः जो भी ऊर्जा ले आया उसे आगे बढ़ाने को कणों की ज़रूरत नहीं थी। यह कौन-सा संचरण-प्रकार है?",
          mr: "सूर्य आणि उन्हाने भाजलेला खांदा यांच्यात सुमारे पंधरा कोटी किलोमीटरचे जवळपास पूर्ण निर्वात आहे, म्हणून जे काही ऊर्जा घेऊन आले त्याला ती पुढे नेण्यासाठी कणांची गरज नव्हती. हा कोणता संक्रमण-प्रकार?",
        },
        statement: {
          en: "Radiation transfers energy as electromagnetic waves and needs no material medium, unlike conduction and convection, which both require matter to carry the energy along.",
          hi: "विकिरण ऊर्जा को विद्युत्-चुंबकीय तरंगों के रूप में ले जाता है और उसे कोई भौतिक माध्यम नहीं चाहिए, चालन तथा संवहन के विपरीत, जिन दोनों को ऊर्जा ढोने के लिए पदार्थ चाहिए।",
          mr: "प्रारण ऊर्जा विद्युतचुंबकीय लहरींच्या रूपात नेते आणि त्याला कोणतेही भौतिक माध्यम लागत नाही, वहन आणि अभिसरणाच्या उलट, ज्या दोघांना ऊर्जा वाहायला पदार्थ लागतो.",
        },
        detail: {
          en: "The power radiated from a surface goes as the fourth power of its absolute temperature, so doubling the kelvin temperature multiplies the emission sixteenfold.",
          hi: "किसी सतह से विकिरित शक्ति उसके परम ताप की चौथी घात के अनुसार चलती है, अतः केल्विन ताप दोगुना करने पर उत्सर्जन सोलह गुना हो जाता है।",
          mr: "एखाद्या पृष्ठभागावरून प्रारित शक्ती त्याच्या निरपेक्ष तापमानाच्या चौथ्या घातेनुसार जाते, म्हणून केल्विन तापमान दुप्पट केल्यास उत्सर्जन सोळापट होते.",
        },
        extra: {
          en: "A good absorber is a good emitter, which is why a matt black kettle both heats up fastest in sunlight and cools down fastest at night, and why a vacuum flask is silvered on both walls.",
          hi: "जो अच्छा अवशोषक है वही अच्छा उत्सर्जक है, इसीलिए मटमैली काली केतली धूप में सबसे तेज़ गरम होती है और रात में सबसे तेज़ ठंडी भी, और इसीलिए थर्मस की दोनों दीवारें चमकीली की जाती हैं।",
          mr: "जो चांगला शोषक तोच चांगला उत्सर्जक, म्हणूनच मॅट काळी केटली उन्हात सर्वांत वेगाने तापते आणि रात्री सर्वांत वेगाने थंडही होते, आणि म्हणूनच थर्मासच्या दोन्ही भिंती चकचकीत केल्या जातात.",
        },
        pair: {
          left: {
            en: "Crosses a vacuum that carries nothing else",
            hi: "उस निर्वात को पार करता जो और कुछ नहीं ढोता",
            mr: "ते निर्वात ओलांडते जे दुसरे काहीही वाहत नाही",
          },
          right: {
            en: "radiation without a medium",
            hi: "बिना माध्यम के विकिरण",
            mr: "माध्यमाविना प्रारण",
          },
        },
      },
      /*F10*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "One kilogram of ice at 0 °C is heated steadily until it becomes water at 100 °C. A student expects the temperature to climb smoothly throughout. Taking the latent heat of fusion as 336,000 J/kg and water's specific heat as 4200 J/kg/K, describe what the thermometer actually does and where the energy goes.",
          hi: "0 °C पर एक किलोग्राम बर्फ़ को लगातार गरम किया जाता है जब तक वह 100 °C पर पानी न बन जाए। एक विद्यार्थी अपेक्षा करता है कि ताप पूरे समय सुचारु रूप से चढ़ेगा। गलन की गुप्त ऊष्मा 336,000 J/kg और पानी की विशिष्ट ऊष्मा 4200 J/kg/K लेते हुए बताओ कि तापमापी वस्तुतः क्या करता है और ऊर्जा जाती कहाँ है।",
          mr: "0 °C वरचा एक किलोग्रॅम बर्फ सतत तापवला जातो जोवर तो 100 °C वर पाणी बनत नाही. एक विद्यार्थी अपेक्षा करतो की तापमान पूर्ण काळ सुरळीत चढेल. द्रवीभवनाची सुप्त उष्णता 336,000 J/kg आणि पाण्याची विशिष्ट उष्णता 4200 J/kg/K घेऊन सांगा की तापमापक प्रत्यक्षात काय करतो आणि ऊर्जा कुठे जाते.",
        },
        choices: [
          {
            en: "The thermometer sticks at 0 °C for a long while and only then climbs. Melting the ice takes 336,000 J with no temperature change at all, because the energy goes into breaking the crystal bonds rather than speeding molecules up. Heating the resulting water from 0 to 100 °C takes 4200 × 100 = 420,000 J. So very nearly half the total energy is spent while the thermometer reads nothing, and a graph of temperature against energy supplied shows a long flat step followed by a steady rise",
            hi: "तापमापी काफ़ी देर 0 °C पर अटका रहता है और तभी चढ़ता है। बर्फ़ पिघलाने में 336,000 J लगते हैं और ताप बिलकुल नहीं बदलता, क्योंकि ऊर्जा अणुओं को तेज़ करने के बजाय क्रिस्टल-बंधन तोड़ने में जाती है। बने पानी को 0 से 100 °C तक गरम करने में 4200 × 100 = 420,000 J लगते हैं। अतः कुल ऊर्जा का लगभग आधा तब ख़र्च होता है जब तापमापी कुछ नहीं दिखाता, और दी गई ऊर्जा बनाम ताप का आलेख एक लंबी सपाट सीढ़ी दिखाता है और उसके बाद स्थिर चढ़ाई",
            mr: "तापमापक बराच वेळ 0 °C वर अडकून राहतो आणि मगच चढतो. बर्फ वितळवायला 336,000 J लागतात आणि तापमान मुळीच बदलत नाही, कारण ऊर्जा रेणूंना वेगवान करण्याऐवजी स्फटिक-बंध तोडण्यात जाते. तयार झालेले पाणी 0 ते 100 °C तापवायला 4200 × 100 = 420,000 J लागतात. म्हणून एकूण ऊर्जेचा जवळपास निम्मा भाग तेव्हा खर्च होतो जेव्हा तापमापक काहीही दाखवत नाही, आणि दिलेली ऊर्जा विरुद्ध तापमानाचा आलेख एक लांब सपाट पायरी दाखवतो आणि नंतर स्थिर चढण",
          },
          {
            en: "The student is right: the temperature rises smoothly, and the latent heat is simply the extra energy needed for the first degree",
            hi: "विद्यार्थी सही है: ताप सुचारु रूप से चढ़ता है, और गुप्त ऊष्मा बस पहली डिग्री के लिए चाहिए अतिरिक्त ऊर्जा है",
            mr: "विद्यार्थी बरोबर: तापमान सुरळीत चढते, आणि सुप्त उष्णता म्हणजे फक्त पहिल्या अंशासाठी लागणारी जादा ऊर्जा",
          },
          {
            en: "The temperature falls while the ice melts, because melting absorbs energy and cooling is what absorbing energy does",
            hi: "बर्फ़ पिघलते समय ताप गिरता है, क्योंकि पिघलना ऊर्जा सोखता है और ऊर्जा सोखने से ठंडा होना ही होता है",
            mr: "बर्फ वितळताना तापमान घटते, कारण वितळणे ऊर्जा शोषते आणि ऊर्जा शोषण्याने थंड होणेच होते",
          },
          {
            en: "The flat step comes at 100 °C only, since a change of state can occur only at the boiling point",
            hi: "सपाट सीढ़ी केवल 100 °C पर आती है, क्योंकि अवस्था-परिवर्तन केवल क्वथनांक पर ही हो सकता है",
            mr: "सपाट पायरी केवळ 100 °C वर येते, कारण अवस्थाबदल केवळ उकळबिंदूवरच होऊ शकतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Follow the energy in two stages and the shape of the graph falls out. Stage one, melting. The ice is already at its melting point, so every joule supplied goes into converting solid to liquid: 1 kg × 336,000 J/kg = 336,000 J. Throughout this the thermometer reads 0 °C and does not budge, however long the flame is left on. That is not a failure of the thermometer. Temperature measures the average kinetic energy of the molecules, and during melting the molecules are not speeding up — the energy is being spent pulling them out of the rigid lattice and against their mutual attraction. The store is real and it is recoverable: refreeze the water and you get all 336,000 J back. Stage two, warming the liquid. Now the molecules do speed up, at 4200 J for each kilogram and each kelvin: 1 × 4200 × 100 = 420,000 J to go from 0 to 100 °C. Here the thermometer climbs steadily, and the graph of temperature against energy is a straight line of slope 1/4200 degrees per joule. Total supplied: 756,000 J, of which 336,000 — forty-four per cent — bought no temperature rise at all. Two implications are worth carrying. First, this is why ice is such an effective coolant. A kilogram of ice at 0 °C absorbs 336,000 J from a drink before it has even become water, whereas a kilogram of water at 0 °C absorbs only 4200 J per degree it warms up — so the ice is worth about eighty degrees' worth of cold water. Melting, not coldness, is doing the work. Second, the same argument at the boiling point is even more dramatic: water's latent heat of vaporisation is about 2,260,000 J/kg, nearly seven times the heat of fusion, and it is the reason steam at 100 °C scalds far worse than water at 100 °C. The steam must dump all that energy into the skin before it can even begin to cool as a liquid. The third option is worth naming because it inverts a real intuition. Absorbing energy usually does raise temperature — but only when the energy has nowhere else to go. During a phase change there is somewhere else, and the temperature is pinned until the change is complete. The fourth misses that melting is a change of state exactly as boiling is, so ice has a flat step of its own at 0 °C. (The second answer treats latent heat as a small correction rather than as a quantity comparable to the whole of the subsequent heating.)",
          hi: "ऊर्जा का दो चरणों में पीछा करो और आलेख का आकार अपने-आप निकल आता है। पहला चरण, गलन। बर्फ़ पहले से अपने गलनांक पर है, अतः दिया गया हर जूल ठोस को द्रव में बदलने में जाता है: 1 kg × 336,000 J/kg = 336,000 J. इस पूरे समय तापमापी 0 °C दिखाता है और हिलता नहीं, आँच कितनी ही देर जली रहे। यह तापमापी की विफलता नहीं। ताप अणुओं की औसत गतिज ऊर्जा नापता है, और गलन के दौरान अणु तेज़ नहीं हो रहे — ऊर्जा उन्हें दृढ़ जालक से बाहर खींचने और उनके पारस्परिक आकर्षण के विरुद्ध ख़र्च हो रही है। भंडार असली है और पुनर्प्राप्य: पानी को फिर जमाओ और तुम्हें पूरे 336,000 J वापस मिलते हैं। दूसरा चरण, द्रव को गरम करना। अब अणु सचमुच तेज़ होते हैं, हर किलोग्राम और हर केल्विन के लिए 4200 J पर: 1 × 4200 × 100 = 420,000 J, 0 से 100 °C तक जाने को। यहाँ तापमापी लगातार चढ़ता है, और ऊर्जा बनाम ताप का आलेख 1/4200 डिग्री प्रति जूल ढाल की सीधी रेखा है। कुल दी गई: 756,000 J, जिसमें से 336,000 — चवालीस प्रतिशत — ने कोई ताप-वृद्धि ख़रीदी ही नहीं। दो निहितार्थ ले जाने योग्य हैं। पहला, इसीलिए बर्फ़ इतनी असरदार शीतक है। 0 °C पर एक किलोग्राम बर्फ़ पेय से 336,000 J सोख लेती है इससे पहले कि वह पानी भी बने, जबकि 0 °C पर एक किलोग्राम पानी हर डिग्री गरम होने पर केवल 4200 J सोखता है — अतः बर्फ़ लगभग अस्सी डिग्री ठंडे पानी के बराबर है। काम शीतलता नहीं, गलन कर रही है। दूसरा, क्वथनांक पर वही तर्क और भी नाटकीय है: पानी की वाष्पन की गुप्त ऊष्मा लगभग 2,260,000 J/kg है, गलन की ऊष्मा की लगभग सात गुनी, और इसी से 100 °C की भाप 100 °C के पानी से कहीं बुरी जलाती है। भाप को वह सारी ऊर्जा त्वचा में उड़ेलनी पड़ती है इससे पहले कि वह द्रव के रूप में ठंडी होना भी शुरू करे। तीसरा विकल्प नाम लेने योग्य है क्योंकि वह एक असली अंतर्ज्ञान को उलट देता है। ऊर्जा सोखना आम तौर पर ताप बढ़ाता ही है — पर तभी जब ऊर्जा के पास और कहीं जाने को न हो। अवस्था-परिवर्तन के दौरान और कहीं जाने को है, और परिवर्तन पूरा होने तक ताप जड़ा रहता है। चौथा यह चूक जाता है कि गलन भी ठीक वैसा ही अवस्था-परिवर्तन है जैसा क्वथन, अतः बर्फ़ की अपनी सपाट सीढ़ी 0 °C पर है। (दूसरा उत्तर गुप्त ऊष्मा को छोटा सुधार मानता है, न कि ऐसी राशि जो बाद की पूरी तापन-प्रक्रिया के तुल्य है।)",
          mr: "ऊर्जेचा दोन टप्प्यांत पाठलाग करा आणि आलेखाचा आकार आपोआप निघतो. पहिला टप्पा, द्रवीभवन. बर्फ आधीच त्याच्या द्रवणबिंदूवर आहे, म्हणून दिलेले प्रत्येक ज्यूल घन द्रवात बदलण्यात जाते: 1 kg × 336,000 J/kg = 336,000 J. या संपूर्ण काळात तापमापक 0 °C दाखवतो आणि हलत नाही, आच कितीही वेळ जळो. हे तापमापकाचे अपयश नाही. तापमान रेणूंची सरासरी गतिज ऊर्जा मोजते, आणि द्रवीभवनादरम्यान रेणू वेगवान होत नाहीत — ऊर्जा त्यांना दृढ जालकातून बाहेर ओढण्यात आणि त्यांच्या परस्पर आकर्षणाविरुद्ध खर्च होत आहे. साठा खरा आहे आणि पुन्हा मिळवण्याजोगा: पाणी पुन्हा गोठवा आणि तुम्हाला पूर्ण 336,000 J परत मिळतात. दुसरा टप्पा, द्रव तापवणे. आता रेणू खरोखर वेगवान होतात, प्रत्येक किलोग्रॅम आणि प्रत्येक केल्विनसाठी 4200 J ने: 1 × 4200 × 100 = 420,000 J, 0 ते 100 °C जायला. इथे तापमापक सतत चढतो, आणि ऊर्जा विरुद्ध तापमानाचा आलेख 1/4200 अंश प्रति ज्यूल उताराची सरळ रेषा. एकूण दिलेली: 756,000 J, त्यापैकी 336,000 — चव्वेचाळीस टक्के — ने कोणतीही तापमानवाढ विकत घेतलीच नाही. दोन निष्कर्ष नेण्याजोगे. पहिला, म्हणूनच बर्फ इतका प्रभावी शीतक. 0 °C वरचा एक किलोग्रॅम बर्फ पेयातून 336,000 J शोषून घेतो तो पाणी बनण्याआधीच, तर 0 °C वरचे एक किलोग्रॅम पाणी प्रत्येक अंश तापताना केवळ 4200 J शोषते — म्हणून बर्फ सुमारे ऐंशी अंश थंड पाण्याइतका. काम थंडपणा नव्हे, द्रवीभवन करत आहे. दुसरा, उकळबिंदूवर तोच युक्तिवाद आणखी नाट्यमय: पाण्याची बाष्पीभवनाची सुप्त उष्णता सुमारे 2,260,000 J/kg, द्रवीभवनाच्या उष्णतेच्या जवळपास सातपट, आणि यामुळेच 100 °C ची वाफ 100 °C च्या पाण्याहून कितीतरी वाईट भाजते. वाफेला ती सर्व ऊर्जा त्वचेत ओतावी लागते ती द्रव म्हणून थंड होणे सुरू करण्याआधीच. तिसरा पर्याय नाव घेण्याजोगा कारण तो एक खरी अंतःप्रेरणा उलटवतो. ऊर्जा शोषणे सहसा तापमान वाढवतेच — पण तेव्हाच जेव्हा ऊर्जेला दुसरीकडे जायला जागा नसते. अवस्थाबदलादरम्यान दुसरीकडे जागा असते, आणि बदल पूर्ण होईपर्यंत तापमान जखडलेले राहते. चौथा हे चुकवतो की द्रवीभवनही नेमके तसाच अवस्थाबदल आहे जसा उकळणे, म्हणून बर्फाची स्वतःची सपाट पायरी 0 °C वर आहे. (दुसरे उत्तर सुप्त उष्णतेला लहान दुरुस्ती मानते, नंतरच्या अख्ख्या तापवण्याइतकी राशी नव्हे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two identical cups of hot tea are poured. Cold milk is added to the first immediately and to the second ten minutes later. Both are then drunk at the same moment. Which is hotter, and what does the answer depend on?",
          hi: "गरम चाय के दो एक-से प्याले भरे जाते हैं। पहले में ठंडा दूध तुरंत डाला जाता है और दूसरे में दस मिनट बाद। फिर दोनों उसी क्षण पिए जाते हैं। कौन-सा अधिक गरम है, और उत्तर किस पर निर्भर है?",
          mr: "गरम चहाचे दोन सारखे कप ओतले जातात. पहिल्यात थंड दूध लगेच घातले जाते आणि दुसऱ्यात दहा मिनिटांनी. मग दोन्ही त्याच क्षणी प्यायले जातात. कोणता अधिक गरम, आणि उत्तर कशावर अवलंबून?",
        },
        choices: [
          {
            en: "The first cup — the one milked immediately — is hotter at the end. Adding cold milk at once drops its temperature, and by Newton's law of cooling a cup nearer room temperature loses heat more slowly, so it spends the ten minutes leaking heat at a reduced rate. The second cup stays hot and therefore sheds heat fast for the whole ten minutes before the milk cools it further. The answer depends on the loss being proportional to the excess over the surroundings, which is what makes the two paths differ even though the same milk is added in both",
            hi: "पहला प्याला — जिसमें दूध तुरंत डाला गया — अंत में अधिक गरम है। ठंडा दूध तुरंत डालने से उसका ताप गिर जाता है, और न्यूटन के शीतलन नियम से कमरे के ताप के पास वाला प्याला ऊष्मा अधिक धीरे खोता है, अतः वह दस मिनट घटी हुई दर से ऊष्मा रिसाता है। दूसरा प्याला गरम बना रहता है और इसलिए पूरे दस मिनट तेज़ी से ऊष्मा छोड़ता है, उसके बाद दूध उसे और ठंडा करता है। उत्तर इस पर निर्भर है कि हानि परिवेश से अधिकता के समानुपाती है, और यही दोनों रास्तों को भिन्न बनाता है यद्यपि दोनों में वही दूध डाला जाता है",
            mr: "पहिला कप — ज्यात दूध लगेच घातले — शेवटी अधिक गरम. थंड दूध लगेच घातल्याने त्याचे तापमान घटते, आणि न्यूटनच्या शीतलन नियमाने खोलीच्या तापमानाजवळचा कप उष्णता अधिक सावकाश गमावतो, म्हणून तो दहा मिनिटे घटलेल्या दराने उष्णता गळतो. दुसरा कप गरम राहतो आणि म्हणून पूर्ण दहा मिनिटे झपाट्याने उष्णता सोडतो, त्यानंतर दूध त्याला आणखी थंड करते. उत्तर हानी परिसरावरील अधिक्याच्या समानुपाती असण्यावर अवलंबून, आणि हेच दोन्ही मार्गांना वेगळे बनवते जरी दोन्हींत तेच दूध घातले जाते",
          },
          {
            en: "The second cup is hotter, because it was left undiluted and therefore hotter for longer",
            hi: "दूसरा प्याला अधिक गरम है, क्योंकि उसे बिना पतला किए छोड़ा गया और इसलिए वह अधिक देर गरम रहा",
            mr: "दुसरा कप अधिक गरम, कारण तो न पातळ करता ठेवला आणि म्हणून तो अधिक वेळ गरम राहिला",
          },
          {
            en: "Both end at exactly the same temperature, since the same amount of cold milk was added to each",
            hi: "दोनों ठीक उसी ताप पर पहुँचते हैं, क्योंकि हर एक में उतना ही ठंडा दूध डाला गया",
            mr: "दोन्ही नेमक्या त्याच तापमानावर पोहोचतात, कारण प्रत्येकात तितकेच थंड दूध घातले गेले",
          },
          {
            en: "It cannot be decided without knowing the specific heat of milk, which alone determines the final temperature",
            hi: "दूध की विशिष्ट ऊष्मा जाने बिना तय नहीं हो सकता, जो अकेली अंतिम ताप तय करती है",
            mr: "दुधाची विशिष्ट उष्णता कळल्याशिवाय ठरवता येत नाही, जी एकटीच शेवटचे तापमान ठरवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The instinct that says 'do not dilute it early, it will get cold' is exactly backwards, and the reason is worth working through slowly. Newton's law of cooling says the rate at which a body loses heat is proportional to how far its temperature exceeds that of the room: dQ/dt ∝ (T − T_room). This has a consequence people rarely notice. A cup at 90 °C in a 20 °C room is losing heat at a rate proportional to 70. Cool it to 70 °C and it is now losing heat at a rate proportional to 50 — nearly thirty per cent slower. Every degree you take off makes the remaining degrees harder to lose. Now compare the two cups over the same ten minutes. Cup one has milk added at the start, so its temperature drops immediately to, say, 70 °C, and it then spends ten minutes cooling from a modest excess of 50 degrees. Cup two stays at 90 °C, spends those ten minutes cooling from an excess of 70, and only then receives the milk. Both receive the same cold milk and the same temperature drop from it. The difference is entirely in the ten minutes: cup two was hotter throughout and therefore leaked heat faster the whole time. It arrives at the drinking moment with less heat left. The milk's own contribution is the same in both cases and cancels out, which is why the fourth option is wrong — the specific heat of milk affects how big the drop is, but it affects both cups identically and cannot change which is hotter. The general principle is worth stating on its own, because it recurs everywhere: when a loss rate depends on the current level, it pays to reduce the level early. A leaky tank empties fastest when full, so drawing some off early leaves more at the end. A hot house loses heat fastest when it is hottest, which is why letting the temperature drop while nobody is home saves more fuel than the reheating costs. There is a caveat worth stating, because it shows where the model's limits are. The argument assumes the cooling is dominated by Newton's law, which holds for modest excesses and gentle convection. A cup covered with a lid, or one where evaporation is doing most of the work, behaves differently, since evaporative loss depends on the exposed surface and the humidity rather than simply on the temperature difference. In practice the milk-first strategy still wins, and it has been tested often enough to be a piece of folk wisdom that happens to be correct. (The second answer confuses 'staying hot' with 'ending hot', and the third forgets that the two cups spend the ten minutes at different temperatures.)",
          hi: "जो सहज बुद्धि कहती है 'जल्दी पतला मत करो, ठंडी हो जाएगी' वह ठीक उलटी है, और कारण धीरे-धीरे चलाने योग्य है। न्यूटन का शीतलन नियम कहता है कि पिंड की ऊष्मा-हानि की दर इस पर समानुपाती है कि उसका ताप कमरे के ताप से कितना अधिक है: dQ/dt ∝ (T − T_कमरा). इसका एक परिणाम है जिसे लोग शायद ही देखते हैं। 20 °C कमरे में 90 °C का प्याला 70 के समानुपाती दर से ऊष्मा खो रहा है। उसे 70 °C कर दो और अब वह 50 के समानुपाती दर से खो रहा है — लगभग तीस प्रतिशत धीमा। तुम जो भी डिग्री हटाते हो वह बची डिग्रियों को खोना और कठिन बना देती है। अब दोनों प्यालों की उन्हीं दस मिनटों में तुलना करो। पहले प्याले में शुरू में दूध डाला गया, अतः उसका ताप तुरंत मान लो 70 °C पर गिर जाता है, और फिर वह दस मिनट 50 डिग्री की मामूली अधिकता से ठंडा होता है। दूसरा प्याला 90 °C पर बना रहता है, वे दस मिनट 70 की अधिकता से ठंडा होता है, और तभी उसे दूध मिलता है। दोनों को वही ठंडा दूध और उससे वही ताप-गिरावट मिलती है। अंतर पूरी तरह उन दस मिनटों में है: दूसरा प्याला पूरे समय अधिक गरम था और इसलिए पूरे समय तेज़ी से ऊष्मा रिसाता रहा। वह पीने के क्षण पर कम ऊष्मा बचाकर पहुँचता है। दूध का अपना योगदान दोनों में एक-सा है और कट जाता है, इसीलिए चौथा विकल्प ग़लत है — दूध की विशिष्ट ऊष्मा तय करती है कि गिरावट कितनी बड़ी है, पर वह दोनों प्यालों पर एक-सी असर करती है और यह नहीं बदल सकती कि कौन अधिक गरम है। सामान्य सिद्धांत अपने आप में कहने योग्य है, क्योंकि वह हर जगह लौटता है: जब हानि की दर वर्तमान स्तर पर निर्भर हो, तो स्तर जल्दी घटा देना फ़ायदे का सौदा है। रिसती टंकी भरी होने पर सबसे तेज़ ख़ाली होती है, अतः कुछ पहले निकाल लेने से अंत में अधिक बचता है। गरम घर तब सबसे तेज़ ऊष्मा खोता है जब वह सबसे गरम हो, इसीलिए कोई घर में न हो तब ताप गिरने देना दोबारा गरम करने की लागत से अधिक ईंधन बचाता है। एक चेतावनी कहने योग्य है, क्योंकि वह निदर्श की सीमाएँ दिखाती है। तर्क मानता है कि शीतलन पर न्यूटन के नियम का बोलबाला है, जो मामूली अधिकताओं और हल्के संवहन पर चलता है। ढक्कन से ढका प्याला, या ऐसा जिसमें अधिकांश काम वाष्पन कर रहा हो, भिन्न व्यवहार करता है, क्योंकि वाष्पन से हुई हानि खुली सतह और आर्द्रता पर निर्भर है, केवल ताप-अंतर पर नहीं। व्यवहार में दूध-पहले वाली रणनीति फिर भी जीतती है, और वह इतनी बार परखी जा चुकी है कि वह लोक-ज्ञान का ऐसा टुकड़ा है जो संयोग से सही है। (दूसरा उत्तर 'गरम बने रहना' और 'गरम पहुँचना' गड्डमड्ड करता है, और तीसरा भूल जाता है कि दोनों प्याले वे दस मिनट भिन्न तापों पर बिताते हैं।)",
          mr: "'लवकर पातळ करू नका, थंड होईल' असे सांगणारी सहज बुद्धी नेमकी उलटी आहे, आणि कारण सावकाश चालवण्याजोगे. न्यूटनचा शीतलन नियम सांगतो की पिंडाच्या उष्णता-हानीचा दर त्याचे तापमान खोलीच्या तापमानाहून किती अधिक आहे याच्या समानुपाती: dQ/dt ∝ (T − T_खोली). याचा एक परिणाम आहे जो लोक क्वचितच पाहतात. 20 °C च्या खोलीत 90 °C चा कप 70 च्या समानुपाती दराने उष्णता गमावत आहे. त्याला 70 °C करा आणि आता तो 50 च्या समानुपाती दराने गमावत आहे — जवळपास तीस टक्के सावकाश. तुम्ही जो अंश काढता तो उरलेले अंश गमावणे आणखी कठीण करतो. आता दोन्ही कपांची त्याच दहा मिनिटांत तुलना करा. पहिल्या कपात सुरुवातीला दूध घातले, म्हणून त्याचे तापमान लगेच समजा 70 °C वर घटते, आणि मग तो दहा मिनिटे 50 अंशांच्या माफक अधिक्यातून थंड होतो. दुसरा कप 90 °C वर राहतो, ती दहा मिनिटे 70 च्या अधिक्यातून थंड होतो, आणि तेव्हाच त्याला दूध मिळते. दोघांना तेच थंड दूध आणि त्यातून तीच तापमान-घट मिळते. फरक पूर्णपणे त्या दहा मिनिटांत: दुसरा कप पूर्ण काळ अधिक गरम होता आणि म्हणून पूर्ण काळ झपाट्याने उष्णता गळत राहिला. तो पिण्याच्या क्षणी कमी उष्णता उरवून पोहोचतो. दुधाचा स्वतःचा वाटा दोन्हींत सारखा आणि कापला जातो, म्हणूनच चौथा पर्याय चुकीचा — दुधाची विशिष्ट उष्णता घट किती मोठी हे ठरवते, पण ती दोन्ही कपांवर सारखीच परिणाम करते आणि कोण अधिक गरम हे बदलू शकत नाही. सामान्य तत्त्व स्वतःच सांगण्याजोगे, कारण ते सर्वत्र परत येते: जेव्हा हानीचा दर सध्याच्या पातळीवर अवलंबून असतो, तेव्हा पातळी लवकर घटवणे फायद्याचे. गळकी टाकी भरलेली असताना सर्वांत वेगाने रिकामी होते, म्हणून काही आधी काढून घेतल्यास शेवटी अधिक उरते. गरम घर तेव्हा सर्वांत वेगाने उष्णता गमावते जेव्हा ते सर्वांत गरम असते, म्हणूनच कोणी घरात नसताना तापमान घटू देणे पुन्हा तापवण्याच्या खर्चाहून अधिक इंधन वाचवते. एक इशारा सांगण्याजोगा, कारण तो प्रतिरूपाच्या मर्यादा दाखवतो. युक्तिवाद गृहीत धरतो की शीतलनावर न्यूटनच्या नियमाचे वर्चस्व, जो माफक अधिक्यांसाठी आणि सौम्य अभिसरणासाठी चालतो. झाकणाने झाकलेला कप, वा ज्यात बहुतांश काम बाष्पीभवन करत आहे असा, वेगळे वागतो, कारण बाष्पीभवनातून होणारी हानी उघड्या पृष्ठभागावर आणि आर्द्रतेवर अवलंबून, केवळ तापमान-फरकावर नाही. व्यवहारात दूध-आधी हे धोरण तरीही जिंकते, आणि ते इतक्या वेळा तपासले गेले आहे की ते लोकज्ञानाचा असा तुकडा आहे जो योगायोगाने बरोबर आहे. (दुसरे उत्तर 'गरम राहणे' आणि 'गरम पोहोचणे' यांची गल्लत करते, आणि तिसरे विसरते की दोन्ही कप ती दहा मिनिटे वेगळ्या तापमानांवर घालवतात.)",
        },
      },
      /*H10*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — Thermodynamics                                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-thermodynamics",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 11 — Thermodynamics",
      hi: "अध्याय 11 — ऊष्मागतिकी",
      mr: "प्रकरण 11 — उष्मागतिकी",
    },
    name: {
      en: "Thermodynamics",
      hi: "ऊष्मागतिकी",
      mr: "उष्मागतिकी",
    },
    summary: {
      en: "The only branch of physics whose laws are stated as things that cannot be done. A law so obvious it was numbered zero and yet is what makes a thermometer possible, an accounting rule that lets heat and work be added because both are energy in transit, two processes that differ only in whether the gas was allowed to talk to its surroundings, and a second law that forbids what the first permits — and in doing so tells time which way to run.",
      hi: "भौतिकी की एकमात्र शाखा जिसके नियम उन चीज़ों के रूप में कहे जाते हैं जो की नहीं जा सकतीं। इतना स्पष्ट नियम कि उसे शून्य नंबर दिया गया और फिर भी वही तापमापी को संभव बनाता है, ऐसा बहीखाता-नियम जो ऊष्मा और कार्य को जोड़ने देता है क्योंकि दोनों संक्रमण में ऊर्जा हैं, दो प्रक्रियाएँ जो केवल इसमें भिन्न हैं कि गैस को अपने परिवेश से बात करने दी गई या नहीं, और वह दूसरा नियम जो उसे मना करता है जिसकी पहला अनुमति देता है — और ऐसा करते हुए समय को बताता है कि चलना किस ओर है।",
      mr: "भौतिकीची एकमेव शाखा जिचे नियम करता येत नाहीत अशा गोष्टींच्या रूपात मांडले जातात. इतका स्पष्ट नियम की त्याला शून्य क्रमांक दिला गेला आणि तरीही तोच तापमापक शक्य करतो, असा वहीखाता-नियम जो उष्णता आणि कार्य जोडू देतो कारण दोन्ही संक्रमणातील ऊर्जा आहेत, दोन प्रक्रिया ज्या केवळ यात वेगळ्या की वायूला आपल्या परिसराशी बोलू दिले की नाही, आणि तो दुसरा नियम जो पहिला परवानगी देतो त्याला मनाई करतो — आणि तसे करताना काळाला सांगतो की चालायचे कोणत्या दिशेने.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "zeroth-law",
        name: {
          en: "The zeroth law",
          hi: "शून्यवाँ नियम",
          mr: "शून्यवा नियम",
        },
        kind: "law",
        prompt: {
          en: "If A is in thermal equilibrium with C, and B is too, then A and B are in equilibrium with each other — which is the only reason a thermometer touched to two bodies in turn can compare them. Which law is this?",
          hi: "यदि A, C के साथ तापीय संतुलन में है और B भी, तो A और B आपस में संतुलन में हैं — और केवल इसी कारण बारी-बारी से दो पिंडों को छुआया गया तापमापी उनकी तुलना कर सकता है। यह कौन-सा नियम है?",
          mr: "जर A हा C शी औष्णिक समतोलात असेल आणि B ही असेल, तर A आणि B आपापसात समतोलात आहेत — आणि केवळ याच कारणाने आळीपाळीने दोन पिंडांना लावलेला तापमापक त्यांची तुलना करू शकतो. हा कोणता नियम?",
        },
        statement: {
          en: "The zeroth law says that two systems each in thermal equilibrium with a third are in equilibrium with each other, which is what allows temperature to be defined as a single number a body carries.",
          hi: "शून्यवाँ नियम कहता है कि जो दो निकाय अलग-अलग किसी तीसरे के साथ तापीय संतुलन में हैं वे आपस में भी संतुलन में हैं, और यही ताप को ऐसी अकेली संख्या के रूप में परिभाषित होने देता है जिसे पिंड ढोता है।",
          mr: "शून्यवा नियम सांगतो की जे दोन संच स्वतंत्रपणे तिसऱ्याशी औष्णिक समतोलात आहेत ते आपापसातही समतोलात आहेत, आणि हेच तापमानाला पिंड वाहणारी एकच संख्या म्हणून व्याख्यायित होऊ देते.",
        },
        detail: {
          en: "It was named late and numbered zero because it turned out to be logically prior to the first and second, which had already been published and could not be renumbered.",
          hi: "उसका नाम देर से रखा गया और नंबर शून्य दिया गया क्योंकि वह तार्किक रूप से पहले और दूसरे से पहले का निकला, जो पहले ही छप चुके थे और जिनके नंबर बदले नहीं जा सकते थे।",
          mr: "त्याचे नाव उशिरा ठेवले गेले आणि क्रमांक शून्य दिला कारण तो तार्किकदृष्ट्या पहिल्या आणि दुसऱ्याच्या आधीचा निघाला, जे आधीच प्रसिद्ध झाले होते आणि ज्यांचे क्रमांक बदलता येत नव्हते.",
        },
        extra: {
          en: "Without it the very idea of a temperature scale collapses, because nothing would guarantee that a thermometer reading the same number twice had met two bodies that would not exchange heat if joined.",
          hi: "उसके बिना ताप-मापक्रम का विचार ही ढह जाता है, क्योंकि कुछ भी यह सुनिश्चित नहीं करता कि दो बार वही संख्या दिखाने वाला तापमापी ऐसे दो पिंडों से मिला जो जोड़े जाने पर ऊष्मा का आदान-प्रदान न करते।",
          mr: "त्याच्याशिवाय तापमान-मापनश्रेणीची कल्पनाच कोसळते, कारण दोनदा तीच संख्या दाखवणारा तापमापक अशा दोन पिंडांना भेटला याची खात्री काहीही देत नाही जे जोडल्यास उष्णतेची देवाणघेवाण करणार नाहीत.",
        },
        pair: {
          left: {
            en: "The law that makes a thermometer mean anything",
            hi: "वह नियम जो तापमापी को कोई अर्थ देता है",
            mr: "तो नियम जो तापमापकाला काही अर्थ देतो",
          },
          right: {
            en: "the zeroth law",
            hi: "शून्यवाँ नियम",
            mr: "शून्यवा नियम",
          },
        },
      },
      {
        id: "first-law-of-thermodynamics",
        name: {
          en: "The first law of thermodynamics",
          hi: "ऊष्मागतिकी का पहला नियम",
          mr: "उष्मागतिकीचा पहिला नियम",
        },
        kind: "law",
        prompt: {
          en: "Heat put into a gas either raises its internal energy or comes back out as work done pushing the piston, and the books must balance to the last joule: ΔU = Q − W. Which law is this?",
          hi: "गैस में डाली गई ऊष्मा या तो उसकी आंतरिक ऊर्जा बढ़ाती है या पिस्टन धकेलने में किए कार्य के रूप में वापस निकल आती है, और बहीखाता अंतिम जूल तक मिलना चाहिए: ΔU = Q − W. यह कौन-सा नियम है?",
          mr: "वायूत टाकलेली उष्णता एकतर त्याची आंतरिक ऊर्जा वाढवते किंवा पिस्टन ढकलण्यात केलेल्या कार्याच्या रूपात परत बाहेर येते, आणि वहीखाते शेवटच्या ज्यूलपर्यंत जुळले पाहिजे: ΔU = Q − W. हा कोणता नियम?",
        },
        statement: {
          en: "The first law is conservation of energy for a thermodynamic system: the heat added equals the increase in internal energy plus the work done by the system on its surroundings.",
          hi: "पहला नियम ऊष्मागतिक निकाय के लिए ऊर्जा-संरक्षण है: दी गई ऊष्मा आंतरिक ऊर्जा की वृद्धि जोड़ निकाय द्वारा परिवेश पर किए गए कार्य के बराबर है।",
          mr: "पहिला नियम म्हणजे उष्मागतिक संचासाठी ऊर्जा-संरक्षण: दिलेली उष्णता आंतरिक ऊर्जेतील वाढ अधिक संचाने परिसरावर केलेले कार्य याइतकी असते.",
        },
        detail: {
          en: "Internal energy is a state function, depending only on the present condition of the gas, while heat and work are not — they describe a journey and have no value at a point.",
          hi: "आंतरिक ऊर्जा अवस्था-फलन है, जो केवल गैस की वर्तमान दशा पर निर्भर है, जबकि ऊष्मा और कार्य नहीं — वे यात्रा का वर्णन करते हैं और किसी बिंदु पर उनका कोई मान नहीं।",
          mr: "आंतरिक ऊर्जा हे अवस्था-फलन, जे केवळ वायूच्या सध्याच्या स्थितीवर अवलंबून, तर उष्णता आणि कार्य नाहीत — ती प्रवासाचे वर्णन करतात आणि एखाद्या बिंदूवर त्यांना कोणतेही मूल्य नाही.",
        },
        extra: {
          en: "It forbids a machine that produces energy from nothing, but it says nothing at all about direction — it would happily allow a cup of tea to heat up by cooling the room.",
          hi: "यह ऐसे यंत्र को मना करता है जो शून्य से ऊर्जा बनाए, पर दिशा के बारे में कुछ नहीं कहता — वह ख़ुशी-ख़ुशी चाय के प्याले को कमरा ठंडा करके गरम होने देगा।",
          mr: "हा शून्यातून ऊर्जा बनवणाऱ्या यंत्राला मनाई करतो, पण दिशेबद्दल काहीही सांगत नाही — तो आनंदाने चहाच्या कपाला खोली थंड करून गरम होऊ देईल.",
        },
        pair: {
          left: {
            en: "Balances the books and never names a direction",
            hi: "बहीखाता मिलाता है और दिशा कभी नहीं बताता",
            mr: "वहीखाते जुळवतो आणि दिशा कधीच सांगत नाही",
          },
          right: {
            en: "the first law of thermodynamics",
            hi: "ऊष्मागतिकी का पहला नियम",
            mr: "उष्मागतिकीचा पहिला नियम",
          },
        },
      },
      {
        id: "isothermal-process",
        name: {
          en: "The isothermal process",
          hi: "समतापी प्रक्रम",
          mr: "समतापी प्रक्रिया",
        },
        kind: "process",
        prompt: {
          en: "A gas expands so slowly, in contact with a large reservoir, that its temperature never budges — so its internal energy is unchanged and every joule of heat absorbed reappears as work. Which process is this?",
          hi: "गैस इतनी धीरे फैलती है, बड़े भंडार के संपर्क में, कि उसका ताप हिलता ही नहीं — अतः उसकी आंतरिक ऊर्जा अपरिवर्तित रहती है और सोखी ऊष्मा का हर जूल कार्य बनकर फिर प्रकट होता है। यह कौन-सा प्रक्रम है?",
          mr: "वायू इतक्या सावकाश प्रसरण पावतो, मोठ्या साठ्याच्या संपर्कात, की त्याचे तापमान हलतच नाही — म्हणून त्याची आंतरिक ऊर्जा अपरिवर्तित राहते आणि शोषलेल्या उष्णतेचे प्रत्येक ज्यूल कार्य बनून पुन्हा प्रकट होते. ही कोणती प्रक्रिया?",
        },
        statement: {
          en: "In an isothermal process the temperature is held constant, so for an ideal gas the internal energy does not change and the heat absorbed equals exactly the work done.",
          hi: "समतापी प्रक्रम में ताप अचर रखा जाता है, अतः आदर्श गैस के लिए आंतरिक ऊर्जा नहीं बदलती और सोखी ऊष्मा ठीक किए गए कार्य के बराबर होती है।",
          mr: "समतापी प्रक्रियेत तापमान अचल ठेवले जाते, म्हणून आदर्श वायूसाठी आंतरिक ऊर्जा बदलत नाही आणि शोषलेली उष्णता नेमकी केलेल्या कार्याइतकी असते.",
        },
        detail: {
          en: "It must be carried out very slowly and in good thermal contact, because heat needs time to flow in and keep the temperature from falling as the gas does work.",
          hi: "उसे बहुत धीरे और अच्छे तापीय संपर्क में करना पड़ता है, क्योंकि ऊष्मा को भीतर बहने और गैस के कार्य करते समय ताप को गिरने से रोकने के लिए समय चाहिए।",
          mr: "ती फार सावकाश आणि चांगल्या औष्णिक संपर्कात करावी लागते, कारण उष्णतेला आत वाहायला आणि वायू कार्य करत असताना तापमान घसरण्यापासून रोखायला वेळ लागतो.",
        },
        extra: {
          en: "On a pressure–volume diagram its curve is a hyperbola, PV = constant, and the area under that curve is the work — which is why the same two end states can be joined by paths doing different amounts of work.",
          hi: "दाब-आयतन आरेख पर उसका वक्र अतिपरवलय है, PV = अचर, और उस वक्र के नीचे का क्षेत्रफल कार्य है — इसीलिए उन्हीं दो अंतिम अवस्थाओं को ऐसे पथों से जोड़ा जा सकता है जो भिन्न मात्रा में कार्य करते हैं।",
          mr: "दाब-घनफळ आकृतीवर तिचा वक्र अतिपरवलय, PV = अचल, आणि त्या वक्राखालचे क्षेत्रफळ म्हणजे कार्य — म्हणूनच त्याच दोन अंतिम अवस्था वेगवेगळ्या प्रमाणात कार्य करणाऱ्या मार्गांनी जोडता येतात.",
        },
        pair: {
          left: {
            en: "Every joule of heat comes straight back out as work",
            hi: "ऊष्मा का हर जूल सीधे कार्य बनकर लौट आता है",
            mr: "उष्णतेचे प्रत्येक ज्यूल थेट कार्य बनून परत येते",
          },
          right: {
            en: "the isothermal process",
            hi: "समतापी प्रक्रम",
            mr: "समतापी प्रक्रिया",
          },
        },
      },
      {
        id: "adiabatic-process",
        name: {
          en: "The adiabatic process",
          hi: "रुद्धोष्म प्रक्रम",
          mr: "रुद्धोष्म प्रक्रिया",
        },
        kind: "process",
        prompt: {
          en: "A bicycle pump's barrel grows hot as the air inside is squeezed quickly, and a released gas cylinder frosts over, because the change happens too fast for any heat to enter or leave. Which process is this?",
          hi: "साइकिल के पंप की नली भीतर की हवा तेज़ी से दबने पर गरम हो जाती है, और छोड़ा गया गैस सिलिंडर पाला जमा लेता है, क्योंकि परिवर्तन इतना तेज़ होता है कि कोई ऊष्मा भीतर या बाहर न जा सके। यह कौन-सा प्रक्रम है?",
          mr: "सायकलच्या पंपाची नळी आतली हवा झपाट्याने दाबल्याने गरम होते, आणि सोडलेला वायू सिलिंडर दहिवर धरतो, कारण बदल इतका वेगवान की कोणतीही उष्णता आत वा बाहेर जाऊ शकत नाही. ही कोणती प्रक्रिया?",
        },
        statement: {
          en: "In an adiabatic process no heat enters or leaves the system, so all the work done goes at the expense of internal energy and the temperature changes even with no heating.",
          hi: "रुद्धोष्म प्रक्रम में निकाय में कोई ऊष्मा न भीतर आती है न बाहर जाती है, अतः किया गया सारा कार्य आंतरिक ऊर्जा की क़ीमत पर होता है और बिना गरम किए भी ताप बदल जाता है।",
          mr: "रुद्धोष्म प्रक्रियेत संचात कोणतीही उष्णता आत येत नाही वा बाहेर जात नाही, म्हणून केलेले सर्व कार्य आंतरिक ऊर्जेच्या किमतीवर होते आणि न तापवताही तापमान बदलते.",
        },
        detail: {
          en: "It is achieved either by insulating the system or by acting so quickly that heat has no time to flow, which is why a sound wave's compressions are adiabatic and not isothermal.",
          hi: "यह या तो निकाय को रोधित करके पाया जाता है या इतनी तेज़ी से करके कि ऊष्मा को बहने का समय ही न मिले, इसीलिए ध्वनि-तरंग के संपीड़न रुद्धोष्म होते हैं, समतापी नहीं।",
          mr: "ही एकतर संच रोधित करून साधली जाते वा इतक्या वेगाने करून की उष्णतेला वाहायला वेळच मिळू नये, म्हणूनच ध्वनिलहरीची संपीडने रुद्धोष्म असतात, समतापी नव्हे.",
        },
        extra: {
          en: "Its curve on a PV diagram is steeper than the isothermal one through the same point, since the pressure falls both from the expansion and from the accompanying drop in temperature.",
          hi: "PV आरेख पर उसका वक्र उसी बिंदु से जाते समतापी वक्र से अधिक ढालू होता है, क्योंकि दाब प्रसार से भी गिरता है और साथ आने वाली ताप-गिरावट से भी।",
          mr: "PV आकृतीवर तिचा वक्र त्याच बिंदूतून जाणाऱ्या समतापी वक्राहून अधिक तीव्र असतो, कारण दाब प्रसरणानेही घटतो आणि सोबत येणाऱ्या तापमान-घटीनेही.",
        },
        pair: {
          left: {
            en: "Too fast for heat to arrive",
            hi: "इतना तेज़ कि ऊष्मा पहुँच ही न सके",
            mr: "इतका वेगवान की उष्णता पोहोचूच शकत नाही",
          },
          right: {
            en: "the adiabatic process",
            hi: "रुद्धोष्म प्रक्रम",
            mr: "रुद्धोष्म प्रक्रिया",
          },
        },
      },
      {
        id: "second-law-of-thermodynamics",
        name: {
          en: "The second law of thermodynamics",
          hi: "ऊष्मागतिकी का दूसरा नियम",
          mr: "उष्मागतिकीचा दुसरा नियम",
        },
        kind: "law",
        prompt: {
          en: "Energy accounting permits a cup of tea to grow hotter while the room cools, and yet it never happens; something beyond conservation is picking a direction for every spontaneous change. Which law is this?",
          hi: "ऊर्जा का बहीखाता चाय के प्याले को कमरा ठंडा होते हुए अधिक गरम होने देता है, फिर भी ऐसा कभी नहीं होता; संरक्षण से परे कुछ हर स्वतःस्फूर्त परिवर्तन के लिए दिशा चुन रहा है। यह कौन-सा नियम है?",
          mr: "ऊर्जेचे वहीखाते चहाच्या कपाला खोली थंड होत असताना अधिक गरम होऊ देते, तरीही असे कधीच घडत नाही; संरक्षणापलीकडचे काहीतरी प्रत्येक स्वयंस्फूर्त बदलासाठी दिशा निवडत आहे. हा कोणता नियम?",
        },
        statement: {
          en: "The second law states that heat never flows spontaneously from a colder body to a hotter one, and equivalently that no engine can convert heat wholly into work in a cycle.",
          hi: "दूसरा नियम कहता है कि ऊष्मा कभी स्वतः ठंडे पिंड से गरम पिंड की ओर नहीं बहती, और समतुल्य रूप से कि कोई इंजन चक्र में ऊष्मा को पूरी तरह कार्य में नहीं बदल सकता।",
          mr: "दुसरा नियम सांगतो की उष्णता कधीही आपोआप थंड पिंडाकडून गरम पिंडाकडे वाहत नाही, आणि समतुल्यपणे की कोणतेही इंजिन चक्रात उष्णता पूर्णपणे कार्यात बदलू शकत नाही.",
        },
        detail: {
          en: "A refrigerator does move heat the wrong way, but only while work is being supplied, and the total heat dumped into the kitchen exceeds the heat removed from the food by exactly that work.",
          hi: "रेफ़्रिजरेटर ऊष्मा को उलटी दिशा में ले जाता ही है, पर केवल तब तक जब कार्य दिया जा रहा हो, और रसोई में उड़ेली गई कुल ऊष्मा भोजन से हटाई गई ऊष्मा से ठीक उतनी अधिक है जितना वह कार्य।",
          mr: "फ्रिज उष्णतेला उलट्या दिशेने नेतोच, पण केवळ जोवर कार्य दिले जात आहे तोवर, आणि स्वयंपाकघरात ओतलेली एकूण उष्णता अन्नातून काढलेल्या उष्णतेहून नेमकी तितकी अधिक असते जितके ते कार्य.",
        },
        extra: {
          en: "It is the only fundamental law that distinguishes past from future, which is why a film of a smashing glass looks wrong played backwards while a film of two colliding balls does not.",
          hi: "यह एकमात्र मूलभूत नियम है जो भूत को भविष्य से अलग करता है, इसीलिए टूटते गिलास की फ़िल्म उलटी चलाने पर ग़लत दिखती है जबकि टकराती दो गेंदों की फ़िल्म नहीं।",
          mr: "हा एकमेव मूलभूत नियम जो भूतकाळ भविष्यकाळापासून वेगळा करतो, म्हणूनच फुटणाऱ्या ग्लासाची चित्रफीत उलटी चालवल्यास चुकीची दिसते तर आदळणाऱ्या दोन चेंडूंची नाही.",
        },
        pair: {
          left: {
            en: "The film that looks wrong played backwards",
            hi: "वह फ़िल्म जो उलटी चलाने पर ग़लत दिखती है",
            mr: "ती चित्रफीत जी उलटी चालवल्यास चुकीची दिसते",
          },
          right: {
            en: "the second law of thermodynamics",
            hi: "ऊष्मागतिकी का दूसरा नियम",
            mr: "उष्मागतिकीचा दुसरा नियम",
          },
        },
      },
      {
        id: "carnot-efficiency",
        name: {
          en: "Carnot efficiency",
          hi: "कार्नो दक्षता",
          mr: "कार्नो कार्यक्षमता",
        },
        kind: "process",
        prompt: {
          en: "No engine working between a source at 600 K and a sink at 300 K can beat fifty per cent, whatever it is made of and however cleverly it is designed, because the ceiling is 1 − T_cold/T_hot. Which limit is this?",
          hi: "600 K के स्रोत और 300 K के अवशोषक के बीच चलता कोई इंजन पचास प्रतिशत नहीं पार कर सकता, वह चाहे किसी का बना हो और कितनी ही चतुराई से अभिकल्पित हो, क्योंकि छत 1 − T_ठंडा/T_गरम है। यह कौन-सी सीमा है?",
          mr: "600 K च्या स्रोत आणि 300 K च्या शोषकामध्ये चालणारे कोणतेही इंजिन पन्नास टक्के ओलांडू शकत नाही, ते कशाचेही बनलेले असो आणि कितीही हुशारीने आखलेले असो, कारण छत 1 − T_थंड/T_गरम आहे. ही कोणती मर्यादा?",
        },
        statement: {
          en: "The Carnot efficiency 1 − T_cold/T_hot is the greatest fraction of absorbed heat any engine can turn into work between two given temperatures, and it depends only on those temperatures.",
          hi: "कार्नो दक्षता 1 − T_ठंडा/T_गरम वह सबसे बड़ा अंश है जितना कोई भी इंजन दो दिए गए तापों के बीच सोखी ऊष्मा को कार्य में बदल सकता है, और वह केवल उन्हीं तापों पर निर्भर है।",
          mr: "कार्नो कार्यक्षमता 1 − T_थंड/T_गरम हा तो सर्वांत मोठा अंश जितका कोणतेही इंजिन दोन दिलेल्या तापमानांदरम्यान शोषलेल्या उष्णतेचे कार्यात रूपांतर करू शकते, आणि ती केवळ त्याच तापमानांवर अवलंबून.",
        },
        detail: {
          en: "The temperatures must be absolute, and the formula reaches one hundred per cent only for a sink at absolute zero, which is itself unreachable.",
          hi: "ताप परम होने चाहिए, और सूत्र सौ प्रतिशत तभी पहुँचता है जब अवशोषक परम शून्य पर हो, जो स्वयं अप्राप्य है।",
          mr: "तापमाने निरपेक्ष असावी लागतात, आणि सूत्र शंभर टक्के तेव्हाच गाठते जेव्हा शोषक निरपेक्ष शून्यावर असेल, जे स्वतःच अप्राप्य आहे.",
        },
        extra: {
          en: "Real engines fall well below it because of friction, turbulence and heat leaking through the walls, so a petrol engine reaching a third of its fuel's energy is already doing well.",
          hi: "असली इंजन घर्षण, विक्षोभ और दीवारों से रिसती ऊष्मा के कारण उससे काफ़ी नीचे रहते हैं, अतः अपने ईंधन की ऊर्जा का एक तिहाई पाता पेट्रोल इंजन पहले ही अच्छा कर रहा है।",
          mr: "खरी इंजिने घर्षण, खळबळ आणि भिंतींतून गळणारी उष्णता यांमुळे तिच्या बरेच खाली राहतात, म्हणून आपल्या इंधनाच्या ऊर्जेचा एक तृतीयांश मिळवणारे पेट्रोल इंजिन आधीच चांगले करत आहे.",
        },
        pair: {
          left: {
            en: "A ceiling no cleverness can raise",
            hi: "ऐसी छत जिसे कोई चतुराई ऊपर नहीं उठा सकती",
            mr: "असे छत जे कोणतीही हुशारी वर उचलू शकत नाही",
          },
          right: {
            en: "Carnot efficiency",
            hi: "कार्नो दक्षता",
            mr: "कार्नो कार्यक्षमता",
          },
        },
      },
      /*F11*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "An inventor offers an engine that takes 1000 J from a source at 400 K, rejects 200 J to a sink at 300 K, and delivers 800 J of work. It violates no conservation of energy. Decide whether it can be built, and say which law settles the matter.",
          hi: "एक आविष्कारक ऐसा इंजन प्रस्तुत करता है जो 400 K के स्रोत से 1000 J लेता है, 300 K के अवशोषक को 200 J लौटाता है, और 800 J कार्य देता है। यह ऊर्जा-संरक्षण का उल्लंघन नहीं करता। तय करो कि वह बन सकता है या नहीं, और बताओ कौन-सा नियम मामला निपटाता है।",
          mr: "एक संशोधक असे इंजिन सादर करतो जे 400 K च्या स्रोतातून 1000 J घेते, 300 K च्या शोषकाला 200 J परत करते, आणि 800 J कार्य देते. ते ऊर्जा-संरक्षणाचे उल्लंघन करत नाही. ते बांधता येईल का ते ठरवा, आणि कोणता नियम प्रकरण निकाली काढतो ते सांगा.",
        },
        choices: [
          {
            en: "It cannot be built. The energy books balance — 1000 = 800 + 200 — so the first law is satisfied, and that is exactly why the first law is not enough. The claimed efficiency is 800/1000 = 80 per cent, but the Carnot ceiling between 400 K and 300 K is 1 − 300/400 = 25 per cent. The second law forbids any engine from exceeding it, whatever its design, so the machine is impossible even though nothing is created from nothing",
            hi: "वह नहीं बन सकता। ऊर्जा का बहीखाता मिलता है — 1000 = 800 + 200 — अतः पहला नियम संतुष्ट है, और ठीक इसीलिए पहला नियम पर्याप्त नहीं। दावा की गई दक्षता 800/1000 = 80 प्रतिशत है, पर 400 K और 300 K के बीच कार्नो छत 1 − 300/400 = 25 प्रतिशत है। दूसरा नियम किसी भी इंजन को उसे पार करने से मना करता है, उसका अभिकल्प चाहे जो हो, अतः यंत्र असंभव है यद्यपि शून्य से कुछ बन नहीं रहा",
            mr: "ते बांधता येणार नाही. ऊर्जेचे वहीखाते जुळते — 1000 = 800 + 200 — म्हणून पहिला नियम समाधानी, आणि नेमके म्हणूनच पहिला नियम पुरेसा नाही. दावा केलेली कार्यक्षमता 800/1000 = 80 टक्के, पण 400 K आणि 300 K दरम्यानचे कार्नो छत 1 − 300/400 = 25 टक्के. दुसरा नियम कोणत्याही इंजिनाला ते ओलांडण्यास मनाई करतो, त्याची रचना काहीही असो, म्हणून यंत्र अशक्य आहे जरी शून्यातून काही तयार होत नसले तरी",
          },
          {
            en: "It can be built, since energy is conserved and that is the only requirement any machine must meet",
            hi: "वह बन सकता है, क्योंकि ऊर्जा संरक्षित है और किसी भी यंत्र को यही एकमात्र शर्त पूरी करनी है",
            mr: "ते बांधता येईल, कारण ऊर्जा संरक्षित आहे आणि कोणत्याही यंत्राला हीच एकमेव अट पूर्ण करावी लागते",
          },
          {
            en: "It cannot be built because it violates the first law, since 800 J of work cannot come from 1000 J of heat",
            hi: "वह नहीं बन सकता क्योंकि वह पहले नियम का उल्लंघन करता है, चूँकि 1000 J ऊष्मा से 800 J कार्य नहीं आ सकता",
            mr: "ते बांधता येणार नाही कारण ते पहिल्या नियमाचे उल्लंघन करते, कारण 1000 J उष्णतेतून 800 J कार्य येऊ शकत नाही",
          },
          {
            en: "It can be built provided the working substance is chosen carefully, since efficiency depends on the gas used",
            hi: "कार्यकारी पदार्थ ध्यान से चुना जाए तो वह बन सकता है, क्योंकि दक्षता प्रयुक्त गैस पर निर्भर है",
            mr: "कार्यकारी पदार्थ काळजीपूर्वक निवडल्यास ते बांधता येईल, कारण कार्यक्षमता वापरलेल्या वायूवर अवलंबून",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Check the first law before anything else, because if it fails the discussion is over. Over a complete cycle the working substance returns to its starting state, so its internal energy is unchanged and ΔU = 0. The first law then reads Q_in − Q_out = W, or 1000 − 200 = 800. It balances exactly. No energy is created and none disappears. Anyone stopping here would have to approve the design. Now apply the second law, which is a separate and independent restriction. The efficiency claimed is W/Q_in = 800/1000 = 0.8. The greatest efficiency any engine can have between a source at T_hot and a sink at T_cold is the Carnot value, 1 − T_cold/T_hot, and both temperatures must be absolute: 1 − 300/400 = 0.25. The inventor is claiming more than three times the theoretical maximum. The machine is impossible, and no amount of engineering will help. It is worth being precise about what the Carnot limit is and is not. It is not a statement about friction, or about how well the machine is made, or about the working substance — the fourth option's error. Carnot's theorem says explicitly that all reversible engines operating between the same two temperatures have the SAME efficiency regardless of what is inside them, and that no irreversible engine can do better. Substituting helium for steam, or polishing the cylinder walls, moves a real engine closer to 25 per cent but cannot lift the ceiling. The limit follows from the temperatures alone. Where does the ceiling come from? From the fact that heat must be rejected at all. To run in a cycle the working substance has to be returned to its starting state, which means the entropy it gained while absorbing Q_in at T_hot must be discharged, and the only way to discharge entropy is to dump heat at some lower temperature. The rejected 200 J is not waste from careless design; some rejection is structurally required, and the minimum amount is fixed by the ratio of the temperatures. That is the second law's real content: not that energy is lost, but that not all of it is available. Two practical readings follow. First, an engine's efficiency is raised far more effectively by increasing T_hot than by cooling the sink, since T_cold is usually pinned near ambient — which is why power stations chase ever-higher steam temperatures and are limited by what the turbine blades can survive. Second, a claim to have beaten Carnot is a claim to have refuted the second law, and such claims arrive regularly at patent offices, where they are refused on principle without a working model being examined. (The third answer misreads the arithmetic, which does balance, and the second treats energy conservation as the only law there is.)",
          hi: "किसी और चीज़ से पहले पहला नियम जाँचो, क्योंकि वह विफल हो तो बहस वहीं ख़त्म। पूरे चक्र में कार्यकारी पदार्थ अपनी आरंभिक अवस्था में लौट आता है, अतः उसकी आंतरिक ऊर्जा अपरिवर्तित रहती है और ΔU = 0. तब पहला नियम पढ़ता है Q_अंदर − Q_बाहर = W, यानी 1000 − 200 = 800. यह ठीक-ठीक मिलता है। न कोई ऊर्जा बनती है न लुप्त होती है। जो यहीं रुक जाए उसे अभिकल्प स्वीकृत करना पड़ेगा। अब दूसरा नियम लगाओ, जो अलग और स्वतंत्र प्रतिबंध है। दावा की गई दक्षता W/Q_अंदर = 800/1000 = 0.8 है। T_गरम के स्रोत और T_ठंडा के अवशोषक के बीच किसी भी इंजन की सबसे बड़ी दक्षता कार्नो मान है, 1 − T_ठंडा/T_गरम, और दोनों ताप परम होने चाहिए: 1 − 300/400 = 0.25. आविष्कारक सैद्धांतिक अधिकतम का तीन गुने से अधिक दावा कर रहा है। यंत्र असंभव है, और कितनी भी अभियांत्रिकी काम नहीं आएगी। यह ठीक-ठीक कहना सार्थक है कि कार्नो सीमा क्या है और क्या नहीं। वह घर्षण के बारे में कथन नहीं, न इस बारे में कि यंत्र कितना अच्छा बना है, न कार्यकारी पदार्थ के बारे में — चौथे विकल्प की भूल। कार्नो की प्रमेय स्पष्ट कहती है कि उन्हीं दो तापों के बीच चलते सब उत्क्रमणीय इंजनों की दक्षता एक ही होती है, चाहे उनके भीतर कुछ भी हो, और कोई अनुत्क्रमणीय इंजन उससे बेहतर नहीं कर सकता। भाप की जगह हीलियम रखना, या सिलिंडर की दीवारें चमकाना, असली इंजन को 25 प्रतिशत के पास ले जाता है पर छत ऊपर नहीं उठा सकता। सीमा अकेले तापों से निकलती है। छत आती कहाँ से है? इस तथ्य से कि ऊष्मा लौटानी ही पड़ती है। चक्र में चलने के लिए कार्यकारी पदार्थ को आरंभिक अवस्था में लौटाना पड़ता है, जिसका अर्थ है कि T_गरम पर Q_अंदर सोखते समय उसने जो एन्ट्रॉपी पाई वह निकालनी पड़ेगी, और एन्ट्रॉपी निकालने का एकमात्र रास्ता किसी कम ताप पर ऊष्मा उड़ेलना है। लौटाए गए 200 J लापरवाह अभिकल्प का कचरा नहीं; कुछ लौटाना संरचनात्मक रूप से अनिवार्य है, और न्यूनतम मात्रा तापों के अनुपात से तय है। दूसरे नियम की असली अंतर्वस्तु यही है: यह नहीं कि ऊर्जा खोती है, बल्कि यह कि वह सब उपलब्ध नहीं होती। दो व्यावहारिक पाठ निकलते हैं। पहला, इंजन की दक्षता अवशोषक ठंडा करने की अपेक्षा T_गरम बढ़ाने से कहीं अधिक असरदार ढंग से चढ़ती है, क्योंकि T_ठंडा आम तौर पर परिवेश के पास जड़ा रहता है — इसीलिए बिजलीघर लगातार ऊँचे भाप-ताप का पीछा करते हैं और उन्हें यह सीमित करता है कि टरबाइन के पंखे कितना झेल सकते हैं। दूसरा, कार्नो को हरा देने का दावा दूसरे नियम के खंडन का दावा है, और ऐसे दावे पेटेंट कार्यालयों में नियमित रूप से पहुँचते हैं, जहाँ चालू नमूना जाँचे बिना सिद्धांततः उन्हें अस्वीकार किया जाता है। (तीसरा उत्तर गणित ग़लत पढ़ता है, जो मिलता तो है, और दूसरा ऊर्जा-संरक्षण को एकमात्र नियम मान लेता है।)",
          mr: "इतर कशाहीआधी पहिला नियम तपासा, कारण तो अपयशी ठरला तर चर्चा तिथेच संपते. पूर्ण चक्रात कार्यकारी पदार्थ आपल्या सुरुवातीच्या अवस्थेत परततो, म्हणून त्याची आंतरिक ऊर्जा अपरिवर्तित आणि ΔU = 0. मग पहिला नियम वाचतो Q_आत − Q_बाहेर = W, म्हणजे 1000 − 200 = 800. ते नेमके जुळते. ना कोणती ऊर्जा तयार होते ना लोप पावते. जो इथेच थांबेल त्याला रचना मंजूर करावी लागेल. आता दुसरा नियम लावा, जो वेगळा आणि स्वतंत्र निर्बंध. दावा केलेली कार्यक्षमता W/Q_आत = 800/1000 = 0.8. T_गरम च्या स्रोत आणि T_थंड च्या शोषकादरम्यान कोणत्याही इंजिनाची सर्वांत मोठी कार्यक्षमता म्हणजे कार्नो मूल्य, 1 − T_थंड/T_गरम, आणि दोन्ही तापमाने निरपेक्ष असावी लागतात: 1 − 300/400 = 0.25. संशोधक सैद्धांतिक कमालच्या तिप्पटीहून अधिक दावा करत आहे. यंत्र अशक्य आहे, आणि कितीही अभियांत्रिकी उपयोगी पडणार नाही. कार्नो मर्यादा काय आहे आणि काय नाही हे नेमके सांगणे सार्थक. ती घर्षणाबद्दलचे विधान नाही, ना यंत्र किती चांगले बनले याबद्दल, ना कार्यकारी पदार्थाबद्दल — चौथ्या पर्यायाची चूक. कार्नोचे प्रमेय स्पष्ट सांगते की त्याच दोन तापमानांदरम्यान चालणाऱ्या सर्व उलटवण्याजोग्या इंजिनांची कार्यक्षमता एकच असते, त्यांच्या आत काहीही असो, आणि कोणतेही न उलटवण्याजोगे इंजिन त्याहून चांगले करू शकत नाही. वाफेऐवजी हेलियम ठेवणे, वा सिलिंडरच्या भिंती चकचकीत करणे, खऱ्या इंजिनाला 25 टक्क्यांजवळ नेते पण छत वर उचलू शकत नाही. मर्यादा केवळ तापमानांतून निघते. छत येते कुठून? या तथ्यातून की उष्णता परत करावीच लागते. चक्रात चालण्यासाठी कार्यकारी पदार्थाला सुरुवातीच्या अवस्थेत परत आणावे लागते, म्हणजे T_गरम वर Q_आत शोषताना त्याने जी एन्ट्रॉपी मिळवली ती काढावी लागेल, आणि एन्ट्रॉपी काढण्याचा एकमेव मार्ग म्हणजे कमी तापमानावर उष्णता ओतणे. परत केलेले 200 J निष्काळजी रचनेचा कचरा नव्हे; काही परत करणे संरचनात्मकदृष्ट्या अपरिहार्य आहे, आणि किमान प्रमाण तापमानांच्या गुणोत्तराने ठरते. दुसऱ्या नियमाचे खरे सार हेच: ऊर्जा हरवते हे नव्हे, तर ती सर्व उपलब्ध नसते हे. दोन व्यावहारिक वाचने निघतात. पहिले, इंजिनाची कार्यक्षमता शोषक थंड करण्यापेक्षा T_गरम वाढवून कितीतरी अधिक प्रभावीपणे चढते, कारण T_थंड सहसा परिसराजवळ जखडलेला असतो — म्हणूनच वीजनिर्मिती केंद्रे सतत अधिक उच्च वाफ-तापमानाचा पाठलाग करतात आणि त्यांना टर्बाइनची पाती किती सोसू शकतात हे मर्यादित करते. दुसरे, कार्नोला हरवल्याचा दावा हा दुसऱ्या नियमाच्या खंडनाचा दावा, आणि असे दावे पेटंट कार्यालयांत नियमितपणे पोहोचतात, जिथे चालू नमुना न तपासता तत्त्वतः ते नाकारले जातात. (तिसरे उत्तर आकडेमोड चुकीची वाचते, जी जुळतेच, आणि दुसरे ऊर्जा-संरक्षणाला एकमेव नियम मानते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A gas is taken from the same initial state to the same final volume twice: once isothermally and once adiabatically. A student says the work done must be the same, since the endpoints of the volume change are identical. Assess this, and say what it reveals about work as a quantity.",
          hi: "एक गैस को उसी आरंभिक अवस्था से उसी अंतिम आयतन तक दो बार ले जाया जाता है: एक बार समतापी और एक बार रुद्धोष्म। एक विद्यार्थी कहता है कि किया गया कार्य एक ही होना चाहिए, क्योंकि आयतन-परिवर्तन के सिरे समान हैं। इसका आकलन करो, और बताओ कि यह कार्य नामक राशि के बारे में क्या प्रकट करता है।",
          mr: "एक वायू त्याच सुरुवातीच्या अवस्थेतून त्याच अंतिम घनफळापर्यंत दोनदा नेला जातो: एकदा समतापी आणि एकदा रुद्धोष्म. एक विद्यार्थी म्हणतो की केलेले कार्य एकच असले पाहिजे, कारण घनफळ-बदलाची टोके सारखी आहेत. याचे मूल्यमापन करा, आणि हे कार्य नावाच्या राशीबद्दल काय उघड करते ते सांगा.",
        },
        choices: [
          {
            en: "The isothermal expansion does more work. In the isothermal case heat flows in continuously to hold the temperature up, so the pressure stays higher at every volume and the area under the PV curve is larger. In the adiabatic case no heat enters, the gas cools as it expands, the pressure falls faster and the area is smaller. This shows work is a path function, not a state function: it depends on how the gas got from A to B and has no value at a state at all, unlike internal energy",
            hi: "समतापी प्रसार अधिक कार्य करता है। समतापी स्थिति में ताप बनाए रखने के लिए ऊष्मा लगातार भीतर बहती है, अतः हर आयतन पर दाब ऊँचा बना रहता है और PV वक्र के नीचे का क्षेत्रफल बड़ा है। रुद्धोष्म स्थिति में कोई ऊष्मा नहीं आती, गैस फैलते हुए ठंडी होती है, दाब तेज़ी से गिरता है और क्षेत्रफल छोटा है। यह दिखाता है कि कार्य पथ-फलन है, अवस्था-फलन नहीं: वह इस पर निर्भर है कि गैस A से B तक पहुँची कैसे और किसी अवस्था पर उसका कोई मान है ही नहीं, आंतरिक ऊर्जा के विपरीत",
            mr: "समतापी प्रसरण अधिक कार्य करते. समतापी स्थितीत तापमान टिकवायला उष्णता सतत आत वाहते, म्हणून प्रत्येक घनफळावर दाब उंच राहतो आणि PV वक्राखालचे क्षेत्रफळ मोठे. रुद्धोष्म स्थितीत कोणतीही उष्णता येत नाही, वायू प्रसरण पावताना थंड होतो, दाब वेगाने घटतो आणि क्षेत्रफळ लहान. हे दाखवते की कार्य हे मार्ग-फलन आहे, अवस्था-फलन नव्हे: ते वायू A पासून B पर्यंत कसा पोहोचला यावर अवलंबून आणि एखाद्या अवस्थेवर त्याला मूल्यच नाही, आंतरिक ऊर्जेच्या उलट",
          },
          {
            en: "The student is right: work depends only on the initial and final volumes, exactly as internal energy depends only on the state",
            hi: "विद्यार्थी सही है: कार्य केवल आरंभिक और अंतिम आयतन पर निर्भर है, ठीक वैसे जैसे आंतरिक ऊर्जा केवल अवस्था पर",
            mr: "विद्यार्थी बरोबर: कार्य केवळ सुरुवातीच्या आणि अंतिम घनफळावर अवलंबून, अगदी तसेच जसे आंतरिक ऊर्जा केवळ अवस्थेवर",
          },
          {
            en: "The adiabatic expansion does more work, because with no heat entering the gas must supply everything from its own internal store",
            hi: "रुद्धोष्म प्रसार अधिक कार्य करता है, क्योंकि कोई ऊष्मा न आने पर गैस को सब कुछ अपने ही आंतरिक भंडार से देना पड़ता है",
            mr: "रुद्धोष्म प्रसरण अधिक कार्य करते, कारण कोणतीही उष्णता येत नसताना वायूला सर्व स्वतःच्याच आंतरिक साठ्यातून द्यावे लागते",
          },
          {
            en: "Neither does any work, since the gas returns to the same volume it started from in both cases",
            hi: "कोई भी कार्य नहीं करता, क्योंकि दोनों स्थितियों में गैस उसी आयतन पर लौट आती है जहाँ से चली थी",
            mr: "कोणीही कार्य करत नाही, कारण दोन्ही स्थितींत वायू ज्या घनफळापासून निघाला त्याच घनफळावर परततो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Draw both curves from the same starting point on a pressure–volume diagram and the answer is visible before any algebra. The work done by an expanding gas is the area under its PV curve, so the comparison is a comparison of two areas from the same start to the same final volume. The isothermal path follows PV = constant. As the gas expands and does work it would naturally cool, but heat flows in from the reservoir to prevent that, so the temperature — and with it the pressure at any given volume — is propped up throughout. The adiabatic path follows PVᵞ = constant with γ greater than one, so it is steeper. No heat is available, so the work must be paid for out of the internal energy, the gas cools, and the pressure at every volume beyond the start is lower than on the isothermal curve. Lower pressure over the same volume range means less area, so less work. Now put the first law against each. Isothermal: ΔU = 0 for an ideal gas because the temperature has not changed, so Q = W — every joule of work came in as heat from outside, and the gas ends with the internal energy it began with. Adiabatic: Q = 0 by definition, so ΔU = −W — the work came entirely out of the gas's own store, and it ends cooler. Two different books, two different totals, the same two volumes. That is the lesson worth extracting. Internal energy is a STATE function: it has a definite value for a given temperature and amount of gas, so ΔU between two states is fixed no matter how you travel. Heat and work are not. Asking 'how much work does this gas have' is a category error, like asking how many kilometres a city has; work is something that happens during a journey, and different journeys between the same two places cover different distances. That is why the first law is written with ΔU on one side and Q and W on the other: only one of the three is a property of the state. The distinction has a practical edge. Since the isothermal path returns the gas to its original temperature while the adiabatic one leaves it cold, an engine designer choosing between them is choosing where the energy comes from and what condition the gas is in for the next stroke. A Carnot cycle uses both deliberately — isothermal legs to exchange heat with the reservoirs and adiabatic legs to move between temperatures without exchanging any — and that combination is precisely what makes it reversible and gives it the maximum possible efficiency. (The third answer confuses where the energy came from with how much of it there was, and the fourth misreads an expansion as a closed cycle.)",
          hi: "दोनों वक्र दाब-आयतन आरेख पर उसी आरंभ-बिंदु से खींचो और उत्तर किसी बीजगणित से पहले दिख जाता है। फैलती गैस द्वारा किया गया कार्य उसके PV वक्र के नीचे का क्षेत्रफल है, अतः तुलना उसी आरंभ से उसी अंतिम आयतन तक दो क्षेत्रफलों की तुलना है। समतापी पथ PV = अचर पर चलता है। गैस फैलते और कार्य करते हुए स्वाभाविक रूप से ठंडी होती, पर भंडार से ऊष्मा भीतर बहकर उसे रोकती है, अतः ताप — और उसके साथ किसी भी दिए आयतन पर दाब — पूरे समय थमा रहता है। रुद्धोष्म पथ PVᵞ = अचर पर चलता है जहाँ γ एक से बड़ा है, अतः वह अधिक ढालू है। कोई ऊष्मा उपलब्ध नहीं, अतः कार्य की क़ीमत आंतरिक ऊर्जा से चुकानी पड़ती है, गैस ठंडी होती है, और आरंभ के आगे हर आयतन पर दाब समतापी वक्र से नीचा है। उसी आयतन-परास में नीचा दाब कम क्षेत्रफल देता है, अतः कम कार्य। अब हर एक के सामने पहला नियम रखो। समतापी: आदर्श गैस के लिए ΔU = 0 क्योंकि ताप बदला नहीं, अतः Q = W — कार्य का हर जूल बाहर से ऊष्मा बनकर आया, और गैस उसी आंतरिक ऊर्जा के साथ समाप्त होती है जिससे शुरू हुई थी। रुद्धोष्म: परिभाषा से Q = 0, अतः ΔU = −W — कार्य पूरी तरह गैस के अपने भंडार से निकला, और वह अधिक ठंडी समाप्त होती है। दो भिन्न बहीखाते, दो भिन्न जोड़, वही दो आयतन। यही निकालने योग्य सबक़ है। आंतरिक ऊर्जा अवस्था-फलन है: दिए गए ताप और गैस-मात्रा के लिए उसका निश्चित मान है, अतः दो अवस्थाओं के बीच ΔU तय है चाहे तुम कैसे भी यात्रा करो। ऊष्मा और कार्य नहीं। 'इस गैस के पास कितना कार्य है' पूछना श्रेणी-भूल है, जैसे पूछना कि किसी नगर के पास कितने किलोमीटर हैं; कार्य वह है जो यात्रा के दौरान घटता है, और उन्हीं दो जगहों के बीच भिन्न यात्राएँ भिन्न दूरियाँ तय करती हैं। इसीलिए पहला नियम एक ओर ΔU और दूसरी ओर Q तथा W के साथ लिखा जाता है: तीनों में केवल एक अवस्था का गुण है। इस भेद की व्यावहारिक धार है। चूँकि समतापी पथ गैस को उसके मूल ताप पर लौटा देता है जबकि रुद्धोष्म उसे ठंडा छोड़ देता है, दोनों में से चुनता इंजन-अभिकल्पक यह चुन रहा है कि ऊर्जा आएगी कहाँ से और अगले स्ट्रोक के लिए गैस किस दशा में होगी। कार्नो चक्र दोनों को जानबूझकर लगाता है — भंडारों से ऊष्मा का आदान-प्रदान करने को समतापी चरण और बिना कोई आदान-प्रदान किए तापों के बीच जाने को रुद्धोष्म चरण — और वही संयोजन उसे उत्क्रमणीय बनाता है और अधिकतम संभव दक्षता देता है। (तीसरा उत्तर यह गड्डमड्ड करता है कि ऊर्जा आई कहाँ से और वह कितनी थी, और चौथा प्रसार को बंद चक्र पढ़ लेता है।)",
          mr: "दोन्ही वक्र दाब-घनफळ आकृतीवर त्याच आरंभबिंदूतून काढा आणि उत्तर कोणत्याही बीजगणिताआधी दिसते. प्रसरण पावणाऱ्या वायूने केलेले कार्य म्हणजे त्याच्या PV वक्राखालचे क्षेत्रफळ, म्हणून तुलना त्याच आरंभापासून त्याच अंतिम घनफळापर्यंतच्या दोन क्षेत्रफळांची. समतापी मार्ग PV = अचल वर चालतो. वायू प्रसरण पावत आणि कार्य करत नैसर्गिकपणे थंड झाला असता, पण साठ्यातून उष्णता आत वाहून ते रोखते, म्हणून तापमान — आणि त्यासोबत कोणत्याही दिलेल्या घनफळावरचा दाब — पूर्ण काळ आधारलेला राहतो. रुद्धोष्म मार्ग PVᵞ = अचल वर चालतो जिथे γ एकाहून मोठा, म्हणून तो अधिक तीव्र. कोणतीही उष्णता उपलब्ध नाही, म्हणून कार्याची किंमत आंतरिक ऊर्जेतून द्यावी लागते, वायू थंड होतो, आणि आरंभाच्या पुढे प्रत्येक घनफळावर दाब समतापी वक्राहून खालचा. त्याच घनफळ-पल्ल्यात कमी दाब कमी क्षेत्रफळ देतो, म्हणून कमी कार्य. आता प्रत्येकासमोर पहिला नियम ठेवा. समतापी: आदर्श वायूसाठी ΔU = 0 कारण तापमान बदलले नाही, म्हणून Q = W — कार्याचे प्रत्येक ज्यूल बाहेरून उष्णता बनून आले, आणि वायू ज्या आंतरिक ऊर्जेने सुरू झाला त्याच ऊर्जेने संपतो. रुद्धोष्म: व्याख्येने Q = 0, म्हणून ΔU = −W — कार्य पूर्णपणे वायूच्या स्वतःच्या साठ्यातून निघाले, आणि तो अधिक थंड संपतो. दोन वेगळी वहीखाती, दोन वेगळ्या बेरजा, तीच दोन घनफळे. हाच काढण्याजोगा धडा. आंतरिक ऊर्जा हे अवस्था-फलन: दिलेल्या तापमानासाठी आणि वायूच्या प्रमाणासाठी तिचे निश्चित मूल्य, म्हणून दोन अवस्थांमधले ΔU ठरलेले, तुम्ही कसाही प्रवास करा. उष्णता आणि कार्य नाहीत. 'या वायूकडे किती कार्य आहे' विचारणे ही वर्ग-चूक, जसे विचारणे की एखाद्या शहराकडे किती किलोमीटर आहेत; कार्य ही प्रवासादरम्यान घडणारी गोष्ट, आणि त्याच दोन जागांमधले वेगळे प्रवास वेगळी अंतरे कापतात. म्हणूनच पहिला नियम एका बाजूला ΔU आणि दुसऱ्या बाजूला Q व W सह लिहिला जातो: तिघांपैकी केवळ एक अवस्थेचा गुणधर्म. या भेदाला व्यावहारिक धार आहे. समतापी मार्ग वायूला त्याच्या मूळ तापमानावर परत आणतो तर रुद्धोष्म त्याला थंड ठेवतो, म्हणून दोघांतून निवडणारा इंजिन-आखणीकार हे निवडत आहे की ऊर्जा येणार कुठून आणि पुढच्या स्ट्रोकसाठी वायू कोणत्या स्थितीत असेल. कार्नो चक्र दोन्ही मुद्दाम वापरते — साठ्यांशी उष्णतेची देवाणघेवाण करायला समतापी टप्पे आणि कोणतीही देवाणघेवाण न करता तापमानांदरम्यान जायला रुद्धोष्म टप्पे — आणि तेच संयोजन त्याला उलटवण्याजोगे बनवते आणि जास्तीत जास्त शक्य कार्यक्षमता देते. (तिसरे उत्तर ऊर्जा कुठून आली आणि ती किती होती यांची गल्लत करते, आणि चौथे प्रसरणाला बंद चक्र वाचते.)",
        },
      },
      /*H11*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 12 — Kinetic Theory                                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-11-kinetic-theory",
    subject: "PHYSICS",
    classLevel: 11,
    chapter: {
      en: "Chapter 12 — Kinetic Theory",
      hi: "अध्याय 12 — अणुगति सिद्धांत",
      mr: "प्रकरण 12 — रेणुगती सिद्धांत",
    },
    name: {
      en: "Kinetic Theory",
      hi: "अणुगति सिद्धांत",
      mr: "रेणुगती सिद्धांत",
    },
    summary: {
      en: "The chapter that explains where thermodynamics came from: pressure turns out to be nothing but molecules drumming on a wall, temperature nothing but their average kinetic energy, and the gas laws fall out of Newton's laws applied to a great many tiny particles. A speed that depends on mass, an energy shared equally among every way a molecule can move, and a distance between collisions that explains why a smell crosses a room so slowly.",
      hi: "वह अध्याय जो बताता है कि ऊष्मागतिकी आई कहाँ से: दाब निकलता है दीवार पर अणुओं की थपथपाहट के सिवा कुछ नहीं, ताप उनकी औसत गतिज ऊर्जा के सिवा कुछ नहीं, और गैस-नियम अनगिनत नन्हे कणों पर लगे न्यूटन के नियमों से अपने-आप निकल आते हैं। वह चाल जो द्रव्यमान पर निर्भर है, वह ऊर्जा जो अणु के हिलने के हर तरीक़े में बराबर बँटती है, और टक्करों के बीच की वह दूरी जो समझाती है कि गंध कमरा पार करने में इतनी देर क्यों लगाती है।",
      mr: "ते प्रकरण जे सांगते की उष्मागतिकी आली कुठून: दाब निघतो भिंतीवर रेणूंच्या थापांशिवाय काहीच नाही, तापमान त्यांच्या सरासरी गतिज ऊर्जेशिवाय काहीच नाही, आणि वायुनियम असंख्य इवल्या कणांवर लावलेल्या न्यूटनच्या नियमांतून आपोआप निघतात. ती चाल जी वस्तुमानावर अवलंबून, ती ऊर्जा जी रेणू हलू शकेल अशा प्रत्येक मार्गात समान वाटली जाते, आणि टक्करींमधले ते अंतर जे समजावते की वास खोली ओलांडायला इतका वेळ का लावतो.",
    },
    position: 12,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "kinetic-model-assumptions",
        name: {
          en: "The kinetic model's assumptions",
          hi: "अणुगति निदर्श की मान्यताएँ",
          mr: "रेणुगती प्रतिरूपाची गृहीतके",
        },
        kind: "model",
        prompt: {
          en: "Molecules of negligible size, in ceaseless random motion, exerting no force on each other except during perfectly elastic collisions that take no time at all — a deliberately simplified picture from which the gas laws are derived. Which set is this?",
          hi: "नगण्य आकार के अणु, निरंतर यादृच्छिक गति में, जो पूर्णतः प्रत्यास्थ और शून्य-कालिक टक्करों के अलावा एक-दूसरे पर कोई बल नहीं लगाते — जानबूझकर सरल किया गया चित्र जिससे गैस-नियम निकाले जाते हैं। यह कौन-सा समुच्चय है?",
          mr: "नगण्य आकाराचे रेणू, अखंड यादृच्छिक गतीत, जे पूर्णतः प्रत्यास्थ आणि शून्य-कालिक टक्करींशिवाय एकमेकांवर कोणतेही बल लावत नाहीत — मुद्दाम सोपे केलेले चित्र ज्यातून वायुनियम काढले जातात. हा कोणता संच?",
        },
        statement: {
          en: "The kinetic model assumes point-like molecules in random motion with no intermolecular forces except in perfectly elastic instantaneous collisions, and it derives the gas laws from Newtonian mechanics alone.",
          hi: "अणुगति निदर्श यादृच्छिक गति में बिंदुवत अणु मानता है जिनके बीच पूर्णतः प्रत्यास्थ तात्क्षणिक टक्करों के सिवा कोई अंतराणुक बल नहीं, और वह गैस-नियम केवल न्यूटनी यांत्रिकी से निकालता है।",
          mr: "रेणुगती प्रतिरूप यादृच्छिक गतीत बिंदूसारखे रेणू गृहीत धरते ज्यांच्यात पूर्णतः प्रत्यास्थ तात्कालिक टक्करींशिवाय कोणतेही आंतररेणवीय बल नाही, आणि ते वायुनियम केवळ न्यूटनी यामिकीतून काढते.",
        },
        detail: {
          en: "The assumptions are known to be false and are kept because they are nearly true at ordinary pressures, where molecules occupy about a thousandth of the volume and spend almost all their time far apart.",
          hi: "मान्यताएँ झूठी हैं यह ज्ञात है और वे इसलिए रखी जाती हैं कि साधारण दाबों पर वे लगभग सच हैं, जहाँ अणु आयतन का लगभग हज़ारवाँ भाग घेरते हैं और अपना अधिकांश समय दूर-दूर बिताते हैं।",
          mr: "गृहीतके खोटी आहेत हे माहीत आहे आणि ती यासाठी ठेवली जातात की सामान्य दाबांवर ती जवळपास खरी असतात, जिथे रेणू घनफळाचा सुमारे हजारावा भाग व्यापतात आणि आपला बहुतांश काळ दूरदूर घालवतात.",
        },
        extra: {
          en: "A real gas departs from the model exactly where the assumptions fail — at high pressure, where molecular volume matters, and at low temperature, where attractions matter and the gas eventually condenses.",
          hi: "असली गैस ठीक वहीं निदर्श से हटती है जहाँ मान्यताएँ विफल होती हैं — ऊँचे दाब पर, जहाँ अणुओं का आयतन मायने रखता है, और नीचे ताप पर, जहाँ आकर्षण मायने रखते हैं और गैस अंततः संघनित हो जाती है।",
          mr: "खरा वायू नेमका तिथेच प्रतिरूपापासून ढळतो जिथे गृहीतके अपयशी ठरतात — उच्च दाबावर, जिथे रेणूंचे घनफळ महत्त्वाचे, आणि कमी तापमानावर, जिथे आकर्षणे महत्त्वाची आणि वायू अखेर द्रवीभूत होतो.",
        },
        pair: {
          left: {
            en: "Known to be false and kept anyway",
            hi: "झूठी जानी जाती हैं और फिर भी रखी जाती हैं",
            mr: "खोटी माहीत आहेत आणि तरीही ठेवली जातात",
          },
          right: {
            en: "the kinetic model's assumptions",
            hi: "अणुगति निदर्श की मान्यताएँ",
            mr: "रेणुगती प्रतिरूपाची गृहीतके",
          },
        },
      },
      {
        id: "pressure-from-bombardment",
        name: {
          en: "Pressure from molecular bombardment",
          hi: "अणु-बौछार से दाब",
          mr: "रेणु-माऱ्यातून दाब",
        },
        kind: "model",
        prompt: {
          en: "A wall feels a steady push although it is being struck by countless separate particles, because each rebound reverses a momentum and the impacts are far too frequent to be felt one at a time. Which explanation is this?",
          hi: "दीवार को स्थिर धक्का महसूस होता है यद्यपि उस पर अनगिनत अलग-अलग कण टकरा रहे हैं, क्योंकि हर पलटाव एक संवेग उलट देता है और आघात इतने बारंबार हैं कि एक-एक करके महसूस ही नहीं होते। यह कौन-सी व्याख्या है?",
          mr: "भिंतीला स्थिर रेटा जाणवतो जरी तिच्यावर असंख्य वेगवेगळे कण आदळत असले तरी, कारण प्रत्येक परतफेड एक संवेग उलटवते आणि आघात इतके वारंवार की एकेक करून जाणवतच नाहीत. हे कोणते स्पष्टीकरण?",
        },
        statement: {
          en: "Pressure arises from the rate at which molecules transfer momentum to a wall, and the theory gives P = ⅓ρv²_rms, connecting a bulk measurement to molecular speeds.",
          hi: "दाब उस दर से उत्पन्न होता है जिससे अणु दीवार को संवेग सौंपते हैं, और सिद्धांत P = ⅓ρv²_rms देता है, जो स्थूल माप को अणुओं की चालों से जोड़ देता है।",
          mr: "दाब त्या दरातून निर्माण होतो ज्याने रेणू भिंतीला संवेग देतात, आणि सिद्धांत P = ⅓ρv²_rms देतो, जो स्थूल मापाला रेणूंच्या चालींशी जोडतो.",
        },
        detail: {
          en: "The factor of one third comes from the three directions being equally likely, so only a third of the mean square speed belongs to motion along any one axis.",
          hi: "एक-तिहाई का गुणक इससे आता है कि तीनों दिशाएँ समान रूप से संभावित हैं, अतः माध्य वर्ग चाल का केवल एक तिहाई किसी एक अक्ष के अनुदिश गति का है।",
          mr: "एक-तृतीयांशाचा गुणक यातून येतो की तिन्ही दिशा सारख्याच संभाव्य, म्हणून मध्य वर्ग चालीचा केवळ एक तृतीयांश कोणत्याही एका अक्षाच्या दिशेच्या गतीचा.",
        },
        extra: {
          en: "The same reasoning explains Boyle's law directly: halve the volume and each molecule hits the walls twice as often over the same area, so the pressure doubles.",
          hi: "वही तर्क बॉयल का नियम सीधे समझाता है: आयतन आधा करो और हर अणु उसी क्षेत्रफल पर दुगुनी बार टकराता है, अतः दाब दुगुना हो जाता है।",
          mr: "तोच युक्तिवाद बॉयलचा नियम थेट समजावतो: घनफळ निम्मे करा आणि प्रत्येक रेणू त्याच क्षेत्रफळावर दुप्पट वेळा आदळतो, म्हणून दाब दुप्पट होतो.",
        },
        pair: {
          left: {
            en: "Countless separate blows felt as one steady push",
            hi: "अनगिनत अलग आघात, महसूस एक स्थिर धक्के जैसे",
            mr: "असंख्य वेगळे आघात, जाणवतात एका स्थिर रेट्यासारखे",
          },
          right: {
            en: "pressure from molecular bombardment",
            hi: "अणु-बौछार से दाब",
            mr: "रेणु-माऱ्यातून दाब",
          },
        },
      },
      {
        id: "temperature-as-kinetic-energy",
        name: {
          en: "Temperature as mean kinetic energy",
          hi: "औसत गतिज ऊर्जा के रूप में ताप",
          mr: "सरासरी गतिज ऊर्जा म्हणून तापमान",
        },
        kind: "model",
        prompt: {
          en: "Hydrogen and oxygen in the same room, at the same reading on the same thermometer, have molecules of wildly different speeds but of exactly equal average translational energy. Which identification is this?",
          hi: "एक ही कमरे में, उसी तापमापी पर उसी पाठ्यांक पर, हाइड्रोजन और ऑक्सीजन के अणुओं की चालें बहुत भिन्न हैं पर औसत स्थानांतरण ऊर्जा ठीक बराबर। यह कौन-सा तादात्म्य है?",
          mr: "एकाच खोलीत, त्याच तापमापकावर त्याच वाचनावर, हायड्रोजन आणि ऑक्सिजनच्या रेणूंच्या चाली फार वेगळ्या पण सरासरी स्थानांतरणी ऊर्जा नेमकी समान. हे कोणते तादात्म्य?",
        },
        statement: {
          en: "The absolute temperature is proportional to the average translational kinetic energy of a molecule, which is three-halves of kT whatever the gas, so temperature measures energy per molecule and not speed.",
          hi: "परम ताप अणु की औसत स्थानांतरण गतिज ऊर्जा का समानुपाती है, जो गैस चाहे जो हो kT का डेढ़ गुना है, अतः ताप प्रति अणु ऊर्जा नापता है, चाल नहीं।",
          mr: "निरपेक्ष तापमान रेणूच्या सरासरी स्थानांतरणी गतिज ऊर्जेच्या समानुपाती, जी वायू कोणताही असो kT च्या दीडपट असते, म्हणून तापमान प्रति रेणू ऊर्जा मोजते, चाल नव्हे.",
        },
        detail: {
          en: "It follows that absolute zero is where that motion would stop, which is why no temperature below it exists and why the kelvin scale starts there rather than at an arbitrary freezing point.",
          hi: "इससे निकलता है कि परम शून्य वहाँ है जहाँ वह गति रुक जाती, इसीलिए उससे नीचे कोई ताप नहीं है और इसीलिए केल्विन मापक्रम किसी मनमाने हिमांक के बजाय वहीं से शुरू होता है।",
          mr: "यातून निघते की निरपेक्ष शून्य तिथे जिथे ती गती थांबली असती, म्हणूनच त्याखाली कोणतेही तापमान नाही आणि म्हणूनच केल्विन मापनश्रेणी कोणत्याही मनमानी गोठणबिंदूऐवजी तिथूनच सुरू होते.",
        },
        extra: {
          en: "It also explains why a light gas leaks from a container faster than a heavy one: equal energies mean the lighter molecules are moving faster, and speed is what carries them through a small hole.",
          hi: "इसी से यह भी समझ आता है कि हल्की गैस पात्र से भारी गैस की अपेक्षा तेज़ी से रिसती है: बराबर ऊर्जाओं का अर्थ है कि हल्के अणु तेज़ चल रहे हैं, और छोटे छिद्र से उन्हें ले जाती है चाल।",
          mr: "यामुळेच हेही समजते की हलका वायू भांड्यातून जड वायूहून वेगाने गळतो: समान ऊर्जांचा अर्थ हलके रेणू अधिक वेगाने जात आहेत, आणि लहान छिद्रातून त्यांना नेते ती चाल.",
        },
        pair: {
          left: {
            en: "Different speeds, identical average energy",
            hi: "भिन्न चालें, समान औसत ऊर्जा",
            mr: "वेगळ्या चाली, समान सरासरी ऊर्जा",
          },
          right: {
            en: "temperature as mean kinetic energy",
            hi: "औसत गतिज ऊर्जा के रूप में ताप",
            mr: "सरासरी गतिज ऊर्जा म्हणून तापमान",
          },
        },
      },
      {
        id: "root-mean-square-speed",
        name: {
          en: "The root-mean-square speed",
          hi: "वर्ग-माध्य-मूल चाल",
          mr: "वर्ग-मध्य-मूळ चाल",
        },
        kind: "consequence",
        prompt: {
          en: "Squares are averaged first and the root taken afterwards, because the plain average of the velocities of a gas at rest in its container is zero and says nothing at all. Which speed is this?",
          hi: "पहले वर्गों का औसत लिया जाता है और मूल बाद में, क्योंकि अपने पात्र में विराम में रखी गैस के वेगों का सादा औसत शून्य है और कुछ भी नहीं कहता। यह कौन-सी चाल है?",
          mr: "आधी वर्गांची सरासरी घेतली जाते आणि मूळ नंतर, कारण आपल्या भांड्यात स्थिर असलेल्या वायूच्या वेगांची साधी सरासरी शून्य आहे आणि काहीही सांगत नाही. ही कोणती चाल?",
        },
        statement: {
          en: "The root-mean-square speed is √(3RT/M), so at a given temperature a lighter gas moves faster, in inverse proportion to the square root of its molar mass.",
          hi: "वर्ग-माध्य-मूल चाल √(3RT/M) है, अतः दिए गए ताप पर हल्की गैस तेज़ चलती है, अपने मोलर द्रव्यमान के वर्गमूल के व्युत्क्रमानुपात में।",
          mr: "वर्ग-मध्य-मूळ चाल √(3RT/M), म्हणून दिलेल्या तापमानावर हलका वायू अधिक वेगाने जातो, आपल्या मोलर वस्तुमानाच्या वर्गमुळाच्या व्यस्त प्रमाणात.",
        },
        detail: {
          en: "At room temperature it is around 500 m/s for oxygen and about 1900 m/s for hydrogen, both faster than a rifle bullet, and the molecules of the air in a room are moving at this speed right now.",
          hi: "कमरे के ताप पर वह ऑक्सीजन के लिए लगभग 500 m/s और हाइड्रोजन के लिए लगभग 1900 m/s है, दोनों बंदूक की गोली से तेज़, और कमरे की हवा के अणु अभी इसी चाल से चल रहे हैं।",
          mr: "खोलीच्या तापमानावर ती ऑक्सिजनसाठी सुमारे 500 m/s आणि हायड्रोजनसाठी सुमारे 1900 m/s, दोन्ही बंदुकीच्या गोळीहून वेगवान, आणि खोलीतल्या हवेचे रेणू आत्ता याच चालीने जात आहेत.",
        },
        extra: {
          en: "It explains why the Earth has kept its nitrogen and oxygen but lost almost all its hydrogen and helium, whose fastest molecules exceed the escape speed at the top of the atmosphere.",
          hi: "यही समझाता है कि पृथ्वी ने नाइट्रोजन और ऑक्सीजन क्यों रखी पर हाइड्रोजन तथा हीलियम लगभग सारी खो दी, जिनके सबसे तेज़ अणु वायुमंडल के शिखर पर पलायन चाल पार कर जाते हैं।",
          mr: "हेच समजावते की पृथ्वीने नायट्रोजन आणि ऑक्सिजन का राखले पण हायड्रोजन व हेलियम जवळपास सर्व गमावले, ज्यांचे सर्वांत वेगवान रेणू वातावरणाच्या शिखरावर मुक्ती चाल ओलांडतात.",
        },
        pair: {
          left: {
            en: "Square first, because the plain average is zero",
            hi: "पहले वर्ग, क्योंकि सादा औसत शून्य है",
            mr: "आधी वर्ग, कारण साधी सरासरी शून्य आहे",
          },
          right: {
            en: "the root-mean-square speed",
            hi: "वर्ग-माध्य-मूल चाल",
            mr: "वर्ग-मध्य-मूळ चाल",
          },
        },
      },
      {
        id: "equipartition-of-energy",
        name: {
          en: "Equipartition of energy",
          hi: "ऊर्जा का समविभाजन",
          mr: "ऊर्जेचे समविभाजन",
        },
        kind: "consequence",
        prompt: {
          en: "Every independent way a molecule can hold energy — each direction it can move, each axis it can spin about — receives on average exactly the same share, namely ½kT. Which principle is this?",
          hi: "अणु के पास ऊर्जा रखने का हर स्वतंत्र तरीक़ा — हर दिशा जिसमें वह चल सकता है, हर अक्ष जिसके परितः वह घूम सकता है — औसतन ठीक वही हिस्सा पाता है, यानी ½kT. यह कौन-सा सिद्धांत है?",
          mr: "रेणूकडे ऊर्जा ठेवण्याचा प्रत्येक स्वतंत्र मार्ग — प्रत्येक दिशा जिच्यात तो जाऊ शकतो, प्रत्येक अक्ष ज्याभोवती तो फिरू शकतो — सरासरी नेमका तोच वाटा मिळवतो, म्हणजे ½kT. हे कोणते तत्त्व?",
        },
        statement: {
          en: "The equipartition theorem gives each degree of freedom an average energy of ½kT per molecule, so a gas's internal energy depends on how many ways its molecules can move and not on what they are made of.",
          hi: "समविभाजन प्रमेय हर स्वातंत्र्य-कोटि को प्रति अणु ½kT औसत ऊर्जा देती है, अतः गैस की आंतरिक ऊर्जा इस पर निर्भर है कि उसके अणु कितने तरीक़ों से चल सकते हैं, इस पर नहीं कि वे किसके बने हैं।",
          mr: "समविभाजन प्रमेय प्रत्येक स्वातंत्र्यकोटीला प्रति रेणू ½kT सरासरी ऊर्जा देते, म्हणून वायूची आंतरिक ऊर्जा त्याचे रेणू किती मार्गांनी हलू शकतात यावर अवलंबून, ते कशाचे बनले आहेत यावर नाही.",
        },
        detail: {
          en: "A monatomic gas has three degrees of freedom and a rigid diatomic one five, which is why their molar heat capacities stand in the ratio 3 to 5 and their γ values differ.",
          hi: "एकपरमाणुक गैस की तीन स्वातंत्र्य-कोटियाँ हैं और दृढ़ द्विपरमाणुक की पाँच, इसीलिए उनकी मोलर ऊष्मा धारिताएँ 3 और 5 के अनुपात में हैं और उनके γ भिन्न हैं।",
          mr: "एकअणुक वायूला तीन स्वातंत्र्यकोटी आणि दृढ द्विअणुकाला पाच, म्हणूनच त्यांच्या मोलर उष्णता धारकता 3 आणि 5 च्या गुणोत्तरात आणि त्यांचे γ वेगळे.",
        },
        extra: {
          en: "The theorem's failure at low temperatures was one of the first cracks in classical physics: vibrational modes simply stop contributing, and only quantum mechanics explains why they can be switched off.",
          hi: "नीचे तापों पर इस प्रमेय की विफलता चिरसम्मत भौतिकी की पहली दरारों में से थी: कंपन-प्रकार योगदान देना बस बंद कर देते हैं, और केवल क्वांटम यांत्रिकी समझाती है कि वे बंद कैसे हो सकते हैं।",
          mr: "कमी तापमानांवर या प्रमेयाचे अपयश हे अभिजात भौतिकीतील पहिल्या भेगांपैकी एक: कंपन-प्रकार वाटा देणे फक्त थांबवतात, आणि केवळ पुंज यामिकी समजावते की ते बंद कसे होऊ शकतात.",
        },
        pair: {
          left: {
            en: "Every way of moving gets the same ½kT",
            hi: "हिलने के हर तरीक़े को वही ½kT मिलता है",
            mr: "हलण्याच्या प्रत्येक मार्गाला तेच ½kT मिळते",
          },
          right: {
            en: "equipartition of energy",
            hi: "ऊर्जा का समविभाजन",
            mr: "ऊर्जेचे समविभाजन",
          },
        },
      },
      {
        id: "mean-free-path",
        name: {
          en: "The mean free path",
          hi: "माध्य मुक्त पथ",
          mr: "मध्य मुक्त मार्ग",
        },
        kind: "consequence",
        prompt: {
          en: "Molecules cross a room at five hundred metres a second and yet a smell takes minutes to arrive, because each one travels only a fraction of a micrometre before being knocked off course. Which quantity is this?",
          hi: "अणु कमरा पाँच सौ मीटर प्रति सेकंड से पार करते हैं और फिर भी गंध पहुँचने में मिनट लगाती है, क्योंकि हर अणु राह से हटाए जाने से पहले माइक्रोमीटर के अंश भर ही चलता है। यह कौन-सी राशि है?",
          mr: "रेणू खोली पाचशे मीटर प्रति सेकंदाने ओलांडतात आणि तरीही वासाला पोहोचायला मिनिटे लागतात, कारण प्रत्येक रेणू वाटेवरून ढकलला जाण्याआधी मायक्रोमीटरच्या अंशभरच जातो. ही कोणती राशी?",
        },
        statement: {
          en: "The mean free path is the average distance a molecule travels between successive collisions, and it is inversely proportional to the number of molecules per unit volume and to their cross-section.",
          hi: "माध्य मुक्त पथ वह औसत दूरी है जो अणु लगातार दो टक्करों के बीच तय करता है, और वह प्रति एकांक आयतन अणुओं की संख्या तथा उनके अनुप्रस्थ काट के व्युत्क्रमानुपाती है।",
          mr: "मध्य मुक्त मार्ग म्हणजे रेणू सलग दोन टक्करींदरम्यान कापणारे सरासरी अंतर, आणि तो प्रति एकक घनफळ रेणूंची संख्या आणि त्यांचा आडवा छेद यांच्या व्यस्तानुपाती.",
        },
        detail: {
          en: "In air at ordinary pressure it is around seventy nanometres, so a molecule suffers some thousands of millions of collisions every second and its path is a wandering zig-zag rather than a line.",
          hi: "साधारण दाब पर हवा में वह लगभग सत्तर नैनोमीटर है, अतः अणु हर सेकंड कई अरब टक्करें झेलता है और उसका पथ रेखा नहीं बल्कि भटकती टेढ़ी-मेढ़ी लकीर है।",
          mr: "सामान्य दाबावर हवेत तो सुमारे सत्तर नॅनोमीटर, म्हणून रेणू दर सेकंदाला कित्येक अब्ज टक्करी सोसतो आणि त्याचा मार्ग रेषा नव्हे तर भटकणारी नागमोडी रेघ.",
        },
        extra: {
          en: "Lowering the pressure lengthens it, and in a good vacuum tube it exceeds the length of the tube, so molecules fly straight from wall to wall without meeting each other at all.",
          hi: "दाब घटाने से वह लंबा होता है, और अच्छी निर्वात नली में वह नली की लंबाई से भी अधिक हो जाता है, अतः अणु एक-दूसरे से मिले बिना सीधे दीवार से दीवार तक उड़ते हैं।",
          mr: "दाब घटवल्याने तो लांब होतो, आणि चांगल्या निर्वात नळीत तो नळीच्या लांबीहूनही अधिक होतो, म्हणून रेणू एकमेकांना न भेटता थेट भिंतीपासून भिंतीपर्यंत उडतात.",
        },
        pair: {
          left: {
            en: "Five hundred metres a second and minutes to cross a room",
            hi: "पाँच सौ मीटर प्रति सेकंड, और कमरा पार करने में मिनट",
            mr: "पाचशे मीटर प्रति सेकंद, आणि खोली ओलांडायला मिनिटे",
          },
          right: {
            en: "the mean free path",
            hi: "माध्य मुक्त पथ",
            mr: "मध्य मुक्त मार्ग",
          },
        },
      },
      /*F12*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A cylinder holds a mixture of hydrogen and oxygen at a single uniform temperature. A student says the hydrogen must be hotter, because its molecules are moving about four times faster. Assess this, and say what the two gases do and do not share.",
          hi: "एक सिलिंडर में हाइड्रोजन और ऑक्सीजन का मिश्रण एक ही समान ताप पर है। एक विद्यार्थी कहता है कि हाइड्रोजन अधिक गरम होगी, क्योंकि उसके अणु लगभग चार गुना तेज़ चल रहे हैं। इसका आकलन करो, और बताओ कि दोनों गैसें क्या साझा करती हैं और क्या नहीं।",
          mr: "एका सिलिंडरमध्ये हायड्रोजन आणि ऑक्सिजनचे मिश्रण एकाच समान तापमानावर आहे. एक विद्यार्थी म्हणतो की हायड्रोजन अधिक गरम असेल, कारण त्याचे रेणू सुमारे चौपट वेगाने जात आहेत. याचे मूल्यमापन करा, आणि दोन्ही वायू काय वाटून घेतात आणि काय नाही ते सांगा.",
        },
        choices: [
          {
            en: "The speeds are right and the conclusion is wrong. Temperature measures average translational kinetic energy, ½mv², not speed. Oxygen molecules are sixteen times heavier, so at equal energy their speeds are four times smaller — the mass and the square of the speed compensate exactly. The two gases share the same temperature and the same average kinetic energy per molecule, and differ in speed, in momentum and in how fast they diffuse or leak through a hole",
            hi: "चालें सही हैं और निष्कर्ष ग़लत। ताप औसत स्थानांतरण गतिज ऊर्जा नापता है, ½mv², चाल नहीं। ऑक्सीजन के अणु सोलह गुना भारी हैं, अतः बराबर ऊर्जा पर उनकी चालें चार गुना छोटी हैं — द्रव्यमान और चाल का वर्ग ठीक-ठीक भरपाई कर देते हैं। दोनों गैसें वही ताप और प्रति अणु वही औसत गतिज ऊर्जा साझा करती हैं, और चाल में, संवेग में तथा इसमें भिन्न हैं कि वे कितनी तेज़ी से विसरित होती या छिद्र से रिसती हैं",
            mr: "चाली बरोबर आणि निष्कर्ष चूक. तापमान सरासरी स्थानांतरणी गतिज ऊर्जा मोजते, ½mv², चाल नव्हे. ऑक्सिजनचे रेणू सोळापट जड, म्हणून समान ऊर्जेवर त्यांच्या चाली चौपट लहान — वस्तुमान आणि चालीचा वर्ग नेमकी भरपाई करतात. दोन्ही वायू तेच तापमान आणि प्रति रेणू तीच सरासरी गतिज ऊर्जा वाटून घेतात, आणि चालीत, संवेगात तसेच ते किती वेगाने विसरण पावतात वा छिद्रातून गळतात यात वेगळे",
          },
          {
            en: "The student is right: faster molecules mean a higher temperature, and the two gases must therefore be at different temperatures",
            hi: "विद्यार्थी सही है: तेज़ अणुओं का अर्थ ऊँचा ताप, और इसलिए दोनों गैसें भिन्न तापों पर होंगी",
            mr: "विद्यार्थी बरोबर: वेगवान रेणू म्हणजे उच्च तापमान, आणि म्हणून दोन्ही वायू वेगळ्या तापमानांवर असतील",
          },
          {
            en: "The speeds are in fact equal, since all gases at the same temperature have identical molecular speeds",
            hi: "चालें वस्तुतः बराबर हैं, क्योंकि एक ही ताप पर सब गैसों के अणुओं की चालें समान होती हैं",
            mr: "चाली प्रत्यक्षात समान आहेत, कारण एकाच तापमानावर सर्व वायूंच्या रेणूंच्या चाली सारख्या असतात",
          },
          {
            en: "Nothing can be said, because temperature is undefined for a mixture of two different gases",
            hi: "कुछ नहीं कहा जा सकता, क्योंकि दो भिन्न गैसों के मिश्रण के लिए ताप अपरिभाषित है",
            mr: "काहीही सांगता येत नाही, कारण दोन वेगळ्या वायूंच्या मिश्रणासाठी तापमान अव्याख्यायित आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's arithmetic is sound and the physics behind it has been mislaid. Start from what temperature actually is in the kinetic model. It is not a measure of speed; it is a measure of the average translational kinetic energy per molecule, which is (3/2)kT for every gas without exception. The 'without exception' is the whole point: the same T means the same ½mv̄², whatever m happens to be. Now put the two gases side by side. Hydrogen's molar mass is 2 and oxygen's is 32, a ratio of sixteen. Equal kinetic energies require ½m_H v_H² = ½m_O v_O², so v_H/v_O = √(m_O/m_H) = √16 = 4. The student's factor of four is exactly right, and it is a consequence of equal temperature rather than evidence against it. A heavier molecule carries the same energy more slowly; that is all the mass ratio is telling us. There is also a physical argument that makes the conclusion unavoidable, independent of any formula. The two gases are in the same cylinder and their molecules are colliding with each other constantly. If hydrogen really were hotter, energy would flow from it to the oxygen at every collision until the two evened out — that is what thermal equilibrium means, and it is the zeroth law in action. A mixture left alone for even a moment cannot sit at two temperatures. This disposes of the fourth option too: temperature is perfectly well defined for a mixture, and it is a single number precisely because collisions enforce it. So what do the two gases share, and what not? Shared: temperature, average translational kinetic energy per molecule, and — by the equipartition theorem — the average energy in each degree of freedom. Also shared, if the pressures are equal, the number of molecules per unit volume, which is Avogadro's law. Not shared: the speeds, in the ratio 4 to 1; the momenta, in the ratio 1 to 4 the other way; the densities; and the rate of effusion through a small hole, which goes as the speed and is the basis of the isotope separation that made enriched uranium possible. One caution worth adding. The equality of average energy holds for TRANSLATIONAL energy. Both hydrogen and oxygen are diatomic and so also store rotational energy, and the equipartition theorem gives each rotational degree of freedom its own ½kT as well. The total internal energy per molecule is therefore (5/2)kT for both, which happens to keep them equal here — but for a mixture of a monatomic and a diatomic gas the total energies per molecule would differ while the translational parts, and hence the temperature, stayed identical. (The third answer contradicts the observation the question is built on, and the second reads a speed as a temperature.)",
          hi: "विद्यार्थी का गणित ठीक है और उसके पीछे की भौतिकी खो गई है। शुरू वहाँ से करो कि अणुगति निदर्श में ताप है क्या। वह चाल का माप नहीं; वह प्रति अणु औसत स्थानांतरण गतिज ऊर्जा का माप है, जो हर गैस के लिए बिना अपवाद (3/2)kT है। 'बिना अपवाद' ही पूरी बात है: वही T का अर्थ वही ½mv̄², m चाहे जो हो। अब दोनों गैसें अगल-बग़ल रखो। हाइड्रोजन का मोलर द्रव्यमान 2 और ऑक्सीजन का 32, अनुपात सोलह। बराबर गतिज ऊर्जाएँ माँगती हैं ½m_H v_H² = ½m_O v_O², अतः v_H/v_O = √(m_O/m_H) = √16 = 4. विद्यार्थी का चार का गुणक ठीक सही है, और वह बराबर ताप का परिणाम है, उसके विरुद्ध प्रमाण नहीं। भारी अणु वही ऊर्जा अधिक धीरे ढोता है; द्रव्यमान-अनुपात हमें बस यही बता रहा है। एक भौतिक तर्क भी है जो निष्कर्ष को अनिवार्य बना देता है, किसी सूत्र से स्वतंत्र। दोनों गैसें उसी सिलिंडर में हैं और उनके अणु लगातार आपस में टकरा रहे हैं। यदि हाइड्रोजन सचमुच अधिक गरम होती, तो हर टक्कर पर उससे ऑक्सीजन की ओर ऊर्जा बहती जब तक दोनों बराबर न हो जातीं — तापीय संतुलन का यही अर्थ है, और यह शून्यवाँ नियम काम करते हुए है। एक क्षण भी अकेला छोड़ा मिश्रण दो तापों पर बैठ नहीं सकता। यह चौथे विकल्प को भी निपटा देता है: मिश्रण के लिए ताप बिलकुल भली-भाँति परिभाषित है, और वह अकेली संख्या ठीक इसलिए है कि टक्करें उसे लागू करती हैं। तो दोनों गैसें साझा क्या करती हैं और क्या नहीं? साझा: ताप, प्रति अणु औसत स्थानांतरण गतिज ऊर्जा, और — समविभाजन प्रमेय से — हर स्वातंत्र्य-कोटि में औसत ऊर्जा। दाब बराबर हों तो प्रति एकांक आयतन अणुओं की संख्या भी साझा, जो आवोगाद्रो का नियम है। साझा नहीं: चालें, 4 और 1 के अनुपात में; संवेग, उलटी ओर 1 और 4 के अनुपात में; घनत्व; और छोटे छिद्र से बहिःस्राव की दर, जो चाल के अनुसार चलती है और वही समस्थानिक-पृथक्करण का आधार है जिसने संवर्धित यूरेनियम संभव किया। एक चेतावनी जोड़ने योग्य है। औसत ऊर्जा की बराबरी स्थानांतरण ऊर्जा पर चलती है। हाइड्रोजन और ऑक्सीजन दोनों द्विपरमाणुक हैं और इसलिए घूर्णी ऊर्जा भी जमा करते हैं, और समविभाजन प्रमेय हर घूर्णी स्वातंत्र्य-कोटि को भी उसका अपना ½kT देती है। अतः प्रति अणु कुल आंतरिक ऊर्जा दोनों के लिए (5/2)kT है, जो संयोग से उन्हें यहाँ बराबर रखती है — पर एकपरमाणुक और द्विपरमाणुक गैस के मिश्रण में प्रति अणु कुल ऊर्जाएँ भिन्न होतीं जबकि स्थानांतरण भाग, और इसलिए ताप, समान रहते। (तीसरा उत्तर उस प्रेक्षण का खंडन करता है जिस पर प्रश्न खड़ा है, और दूसरा चाल को ताप पढ़ लेता है।)",
          mr: "विद्यार्थ्याचे गणित बरोबर आहे आणि त्यामागची भौतिकी हरवली आहे. रेणुगती प्रतिरूपात तापमान म्हणजे काय तिथून सुरुवात करा. ते चालीचे माप नाही; ते प्रति रेणू सरासरी स्थानांतरणी गतिज ऊर्जेचे माप, जे प्रत्येक वायूसाठी अपवादाशिवाय (3/2)kT आहे. 'अपवादाशिवाय' हाच अख्खा मुद्दा: तेच T म्हणजे तेच ½mv̄², m काहीही असो. आता दोन्ही वायू शेजारीशेजारी ठेवा. हायड्रोजनचे मोलर वस्तुमान 2 आणि ऑक्सिजनचे 32, गुणोत्तर सोळा. समान गतिज ऊर्जा मागतात ½m_H v_H² = ½m_O v_O², म्हणून v_H/v_O = √(m_O/m_H) = √16 = 4. विद्यार्थ्याचा चारचा गुणक नेमका बरोबर, आणि तो समान तापमानाचा परिणाम आहे, त्याविरुद्धचा पुरावा नव्हे. जड रेणू तीच ऊर्जा अधिक सावकाश वाहतो; वस्तुमान-गुणोत्तर आपल्याला फक्त हेच सांगत आहे. एक भौतिक युक्तिवादही आहे जो निष्कर्ष अपरिहार्य करतो, कोणत्याही सूत्रापासून स्वतंत्र. दोन्ही वायू त्याच सिलिंडरमध्ये आणि त्यांचे रेणू सतत आपापसात आदळत आहेत. हायड्रोजन खरोखर अधिक गरम असता, तर प्रत्येक टक्करीवर तिच्याकडून ऑक्सिजनकडे ऊर्जा वाहिली असती जोवर दोन्ही समान होत नाहीत — औष्णिक समतोलाचा अर्थ हाच, आणि हा शून्यवा नियम कामात. एक क्षणही एकटे सोडलेले मिश्रण दोन तापमानांवर बसू शकत नाही. हे चौथा पर्यायही निकाली काढते: मिश्रणासाठी तापमान अगदी नीट व्याख्यायित आहे, आणि ते एकच संख्या नेमकी यासाठी की टक्करी ते लागू करतात. मग दोन्ही वायू वाटून काय घेतात आणि काय नाही? वाटून: तापमान, प्रति रेणू सरासरी स्थानांतरणी गतिज ऊर्जा, आणि — समविभाजन प्रमेयाने — प्रत्येक स्वातंत्र्यकोटीतील सरासरी ऊर्जा. दाब समान असल्यास प्रति एकक घनफळ रेणूंची संख्याही वाटून, जो आवोगाद्रोचा नियम. वाटून नाही: चाली, 4 आणि 1 च्या गुणोत्तरात; संवेग, उलट बाजूने 1 आणि 4 च्या गुणोत्तरात; घनता; आणि लहान छिद्रातून बहिःस्रावाचा दर, जो चालीनुसार जातो आणि तोच समस्थानिक-पृथक्करणाचा आधार ज्याने समृद्ध युरेनियम शक्य केले. एक इशारा जोडण्याजोगा. सरासरी ऊर्जेची समानता स्थानांतरणी ऊर्जेवर चालते. हायड्रोजन आणि ऑक्सिजन दोन्ही द्विअणुक आणि म्हणून परिवलनी ऊर्जाही साठवतात, आणि समविभाजन प्रमेय प्रत्येक परिवलनी स्वातंत्र्यकोटीलाही तिचे स्वतःचे ½kT देते. म्हणून प्रति रेणू एकूण आंतरिक ऊर्जा दोघांसाठी (5/2)kT, जी योगायोगाने त्यांना इथे समान ठेवते — पण एकअणुक आणि द्विअणुक वायूच्या मिश्रणात प्रति रेणू एकूण ऊर्जा वेगळ्या असत्या तर स्थानांतरणी भाग, आणि म्हणून तापमान, सारखेच राहिले असते. (तिसरे उत्तर ज्या निरीक्षणावर प्रश्न उभा आहे त्याचे खंडन करते, आणि दुसरे चालीला तापमान वाचते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A drop of perfume is released in a still room. Its molecules travel at hundreds of metres per second, so a student predicts the smell will cross the room almost instantly. It in fact takes several minutes. Explain the discrepancy and say what would change in a vacuum.",
          hi: "शांत कमरे में इत्र की एक बूँद छोड़ी जाती है। उसके अणु सैकड़ों मीटर प्रति सेकंड चलते हैं, अतः एक विद्यार्थी भविष्यवाणी करता है कि गंध कमरा लगभग तुरंत पार कर लेगी। वस्तुतः उसमें कई मिनट लगते हैं। विसंगति समझाओ और बताओ कि निर्वात में क्या बदलेगा।",
          mr: "शांत खोलीत अत्तराचा एक थेंब सोडला जातो. त्याचे रेणू शेकडो मीटर प्रति सेकंदाने जातात, म्हणून एक विद्यार्थी भाकीत करतो की वास खोली जवळपास लगेच ओलांडेल. प्रत्यक्षात त्याला कित्येक मिनिटे लागतात. विसंगती समजावा आणि निर्वातात काय बदलेल ते सांगा.",
        },
        choices: [
          {
            en: "The speed is right but the path is not straight. A molecule travels only about seventy nanometres before colliding with an air molecule, some thousands of millions of times a second, and each collision sends it off in a new random direction. The net progress is a random walk, whose distance grows as the square root of the time rather than in proportion to it, so crossing a room takes minutes. In a vacuum the mean free path would exceed the room, the molecules would fly straight, and the smell would indeed arrive in hundredths of a second",
            hi: "चाल सही है पर पथ सीधा नहीं। अणु किसी वायु-अणु से टकराने से पहले लगभग सत्तर नैनोमीटर ही चलता है, सेकंड में कई अरब बार, और हर टक्कर उसे नई यादृच्छिक दिशा में भेज देती है। शुद्ध प्रगति एक यादृच्छिक चाल है, जिसकी दूरी समय के समानुपात में नहीं बल्कि उसके वर्गमूल के अनुसार बढ़ती है, अतः कमरा पार करने में मिनट लगते हैं। निर्वात में माध्य मुक्त पथ कमरे से बड़ा होता, अणु सीधे उड़ते, और गंध सचमुच सेकंड के सौवें हिस्सों में पहुँच जाती",
            mr: "चाल बरोबर पण मार्ग सरळ नाही. रेणू एखाद्या हवेच्या रेणूशी आदळण्याआधी सुमारे सत्तर नॅनोमीटरच जातो, सेकंदाला कित्येक अब्ज वेळा, आणि प्रत्येक टक्कर त्याला नव्या यादृच्छिक दिशेने पाठवते. निव्वळ प्रगती ही यादृच्छिक चाल, जिचे अंतर काळाच्या प्रमाणात नव्हे तर त्याच्या वर्गमुळानुसार वाढते, म्हणून खोली ओलांडायला मिनिटे लागतात. निर्वातात मध्य मुक्त मार्ग खोलीहून मोठा असता, रेणू सरळ उडले असते, आणि वास खरोखर सेकंदाच्या शतांशांत पोहोचला असता",
          },
          {
            en: "The molecules are in fact moving far more slowly than the theory suggests, and the theory overestimates their speed by a factor of thousands",
            hi: "अणु वस्तुतः सिद्धांत के सुझाव से कहीं धीरे चल रहे हैं, और सिद्धांत उनकी चाल हज़ारों गुना बढ़ाकर आँकता है",
            mr: "रेणू प्रत्यक्षात सिद्धांत सुचवतो त्याहून कितीतरी सावकाश जात आहेत, आणि सिद्धांत त्यांची चाल हजारपट वाढवून अंदाजतो",
          },
          {
            en: "The perfume molecules are much heavier than air molecules and therefore sink to the floor rather than crossing the room",
            hi: "इत्र के अणु हवा के अणुओं से कहीं भारी हैं और इसलिए कमरा पार करने के बजाय फ़र्श पर बैठ जाते हैं",
            mr: "अत्तराचे रेणू हवेच्या रेणूंहून कितीतरी जड आहेत आणि म्हणून खोली ओलांडण्याऐवजी जमिनीवर बसतात",
          },
          {
            en: "In a vacuum the smell would take even longer, since there would be no air to carry the molecules along",
            hi: "निर्वात में गंध और अधिक समय लेती, क्योंकि अणुओं को साथ ले जाने वाली हवा ही न होती",
            mr: "निर्वातात वासाला आणखी वेळ लागला असता, कारण रेणूंना सोबत नेणारी हवाच नसती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both the speed and the observation are correct, and the missing piece is what happens between them. At room temperature a perfume molecule's root-mean-square speed is a few hundred metres per second — genuinely faster than a rifle bullet. A five-metre room should take about a hundredth of a second to cross. It does not, and the reason is that the molecule never gets to travel five metres in a straight line. In air at ordinary pressure the mean free path is around seventy nanometres. That is the average distance between collisions with the nitrogen and oxygen molecules that fill the room, and it means our perfume molecule is knocked into a new direction some five thousand million times a second. Its trajectory is not a line but a fantastically tangled zig-zag, and although it covers hundreds of metres of path in a second, almost all of that path doubles back on itself. The correct model is a random walk. For a walk of N steps of length ℓ in random directions, the expected straight-line displacement is not Nℓ but ℓ√N — the steps partly cancel. To make net progress of five metres with steps of seventy nanometres, N must be about (5/70×10⁻⁹)², which is of the order of 10¹⁶ steps, and at five thousand million collisions a second that is a matter of minutes. The observation and the theory agree exactly, and the agreement is one of the early triumphs of the kinetic model — the diffusion rate can be used to measure the mean free path, and from it the size of a molecule. Now the vacuum. Lowering the pressure lowers the number of molecules per unit volume and lengthens the mean free path in inverse proportion. In a good laboratory vacuum the path exceeds the dimensions of the vessel, so a molecule leaves one wall and arrives at another without meeting anything at all. There the naive calculation is right: the smell would cross the room in a hundredth of a second. This is not a hypothetical — it is exactly the regime in which vacuum deposition coats a lens, and the reason the chamber must be evacuated is to let the atoms travel in straight lines to the target. The fourth option inverts this completely, and it is worth naming why the intuition behind it fails. Air does not carry the perfume; it obstructs it. Bulk air movement — a draught, a convection current — does carry smells quickly, which is why an open window changes everything and why the question specifies a still room. But molecular diffusion through still air is hindered by collisions, not helped by them. (The second answer discards a speed that is confirmed by the pressure a gas exerts, and the third invents a settling that diffusion and convection would prevent in any case.)",
          hi: "चाल और प्रेक्षण दोनों सही हैं, और लुप्त कड़ी वह है जो उनके बीच घटती है। कमरे के ताप पर इत्र के अणु की वर्ग-माध्य-मूल चाल कुछ सौ मीटर प्रति सेकंड है — सचमुच बंदूक की गोली से तेज़। पाँच मीटर का कमरा पार करने में लगभग सेकंड का सौवाँ हिस्सा लगना चाहिए। नहीं लगता, और कारण यह कि अणु को सीधी रेखा में पाँच मीटर चलने का मौक़ा ही नहीं मिलता। साधारण दाब पर हवा में माध्य मुक्त पथ लगभग सत्तर नैनोमीटर है। यह कमरा भरे नाइट्रोजन और ऑक्सीजन के अणुओं से टक्करों के बीच की औसत दूरी है, और इसका अर्थ है कि हमारा इत्र-अणु सेकंड में लगभग पाँच अरब बार नई दिशा में ठेल दिया जाता है। उसका प्रक्षेप-पथ रेखा नहीं बल्कि अद्भुत रूप से उलझी टेढ़ी-मेढ़ी लकीर है, और यद्यपि वह एक सेकंड में सैकड़ों मीटर पथ तय करता है, उस पथ का लगभग सारा अपने ऊपर लौट आता है। सही निदर्श यादृच्छिक चाल है। यादृच्छिक दिशाओं में ℓ लंबाई के N क़दमों की चाल के लिए अपेक्षित सरल-रेखीय विस्थापन Nℓ नहीं बल्कि ℓ√N है — क़दम आंशिक रूप से कट जाते हैं। सत्तर नैनोमीटर के क़दमों से पाँच मीटर की शुद्ध प्रगति के लिए N लगभग (5/70×10⁻⁹)² होना चाहिए, जो 10¹⁶ क़दमों की कोटि का है, और पाँच अरब टक्कर प्रति सेकंड पर वह मिनटों की बात है। प्रेक्षण और सिद्धांत ठीक मिलते हैं, और यह मेल अणुगति निदर्श की आरंभिक विजयों में से एक है — विसरण-दर से माध्य मुक्त पथ नापा जा सकता है, और उससे अणु का आकार। अब निर्वात। दाब घटाने से प्रति एकांक आयतन अणुओं की संख्या घटती है और माध्य मुक्त पथ व्युत्क्रमानुपात में लंबा होता है। अच्छे प्रयोगशाला-निर्वात में पथ पात्र की विमाओं से बड़ा हो जाता है, अतः अणु एक दीवार छोड़कर दूसरी पर पहुँच जाता है बिना किसी से मिले। वहाँ भोली गणना सही है: गंध कमरा सेकंड के सौवें हिस्से में पार कर लेती। यह काल्पनिक नहीं — ठीक यही वह क्षेत्र है जिसमें निर्वात-निक्षेपण लेंस पर परत चढ़ाता है, और कक्ष को निर्वातित करने का कारण यही है कि परमाणु लक्ष्य तक सीधी रेखाओं में जा सकें। चौथा विकल्प इसे पूरी तरह उलट देता है, और उसके पीछे का अंतर्ज्ञान क्यों विफल है यह नाम लेने योग्य है। हवा इत्र को ले नहीं जाती; वह उसे रोकती है। स्थूल वायु-गति — झोंका, संवहन-धारा — गंध को तेज़ी से ले जाती ही है, इसीलिए खुली खिड़की सब बदल देती है और इसीलिए प्रश्न शांत कमरा निर्दिष्ट करता है। पर शांत हवा में अणुओं का विसरण टक्करों से बाधित होता है, उनसे सहायता नहीं पाता। (दूसरा उत्तर उस चाल को फेंक देता है जिसकी पुष्टि गैस द्वारा लगाया दाब करता है, और तीसरा ऐसा बैठना गढ़ता है जिसे विसरण और संवहन वैसे भी रोक देते।)",
          mr: "चाल आणि निरीक्षण दोन्ही बरोबर आहेत, आणि हरवलेला दुवा तो जो त्यांच्यामध्ये घडतो. खोलीच्या तापमानावर अत्तराच्या रेणूची वर्ग-मध्य-मूळ चाल काही शेकडा मीटर प्रति सेकंद — खरोखर बंदुकीच्या गोळीहून वेगवान. पाच मीटरची खोली ओलांडायला सुमारे सेकंदाचा शतांश लागला पाहिजे. लागत नाही, आणि कारण हे की रेणूला सरळ रेषेत पाच मीटर जाण्याची संधीच मिळत नाही. सामान्य दाबावर हवेत मध्य मुक्त मार्ग सुमारे सत्तर नॅनोमीटर. हे खोली भरणाऱ्या नायट्रोजन आणि ऑक्सिजनच्या रेणूंशी होणाऱ्या टक्करींमधले सरासरी अंतर, आणि याचा अर्थ आपला अत्तर-रेणू सेकंदाला सुमारे पाच अब्ज वेळा नव्या दिशेने ढकलला जातो. त्याचा प्रक्षेप-मार्ग रेषा नव्हे तर विलक्षण गुंतागुंतीची नागमोडी रेघ, आणि तो एका सेकंदात शेकडो मीटर मार्ग कापत असला तरी त्या मार्गाचा जवळपास सर्व भाग स्वतःवर परत येतो. योग्य प्रतिरूप म्हणजे यादृच्छिक चाल. यादृच्छिक दिशांत ℓ लांबीच्या N पावलांच्या चालीसाठी अपेक्षित सरळरेषीय विस्थापन Nℓ नव्हे तर ℓ√N — पावले अंशतः कापली जातात. सत्तर नॅनोमीटरच्या पावलांनी पाच मीटरची निव्वळ प्रगती करायला N सुमारे (5/70×10⁻⁹)² असावे लागते, जे 10¹⁶ पावलांच्या कोटीचे, आणि पाच अब्ज टक्करी प्रति सेकंदावर ती मिनिटांची बाब. निरीक्षण आणि सिद्धांत नेमके जुळतात, आणि हे जुळणे रेणुगती प्रतिरूपाच्या सुरुवातीच्या विजयांपैकी एक — विसरण-दरावरून मध्य मुक्त मार्ग मोजता येतो, आणि त्यावरून रेणूचा आकार. आता निर्वात. दाब घटवल्याने प्रति एकक घनफळ रेणूंची संख्या घटते आणि मध्य मुक्त मार्ग व्यस्त प्रमाणात लांब होतो. चांगल्या प्रयोगशाळा-निर्वातात मार्ग भांड्याच्या मितींहून मोठा होतो, म्हणून रेणू एक भिंत सोडून दुसरीवर पोहोचतो कोणालाही न भेटता. तिथे भोळी गणना बरोबर आहे: वास खोली सेकंदाच्या शतांशात ओलांडला असता. हे काल्पनिक नाही — नेमके हेच ते क्षेत्र ज्यात निर्वात-निक्षेपण भिंगावर थर चढवते, आणि कक्ष निर्वात करण्याचे कारण हेच की अणू लक्ष्यापर्यंत सरळ रेषांत जाऊ शकावेत. चौथा पर्याय हे पूर्णपणे उलटवतो, आणि त्यामागची अंतःप्रेरणा का अपयशी ठरते हे नाव घेण्याजोगे. हवा अत्तर नेत नाही; ती त्याला अडवते. स्थूल वायु-हालचाल — झुळूक, अभिसरण-प्रवाह — वास वेगाने नेतेच, म्हणूनच उघडी खिडकी सर्व बदलते आणि म्हणूनच प्रश्न शांत खोली निर्दिष्ट करतो. पण शांत हवेत रेणूंचे विसरण टक्करींनी अडवले जाते, त्यांच्याकडून मदत मिळवत नाही. (दुसरे उत्तर ती चाल फेकून देते जिची पुष्टी वायूने लावलेला दाब करतो, आणि तिसरे असे बसणे घडवते जे विसरण आणि अभिसरण कोणत्याही परिस्थितीत रोखले असते.)",
        },
      },
      /*H12*/
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
  "physics-11-work-energy-and-power": [
    {
      level: 1,
      stem: {
        en: "A constant force of 50 N moves a crate 4 m in the direction of the force. How much work is done?",
        hi: "50 N का अचर बल एक पेटी को बल की दिशा में 4 m खिसकाता है। कितना कार्य होता है?",
        mr: "50 N चे अचल बल एका पेटीला बलाच्या दिशेने 4 m सरकवते. किती कार्य होते?",
      },
      answer: 200,
      wrong: [12.5, 54, 100],
      checkExpr: "50*4",
      solution: {
        en: "Force and displacement are in the same direction, so cos 0° = 1 and W = 50 × 4 = 200 J. (12.5 divides instead of multiplying, 54 adds, and 100 halves as though the force had built up from zero.)",
        hi: "बल और विस्थापन एक ही दिशा में हैं, अतः cos 0° = 1 और W = 50 × 4 = 200 J. (12.5 गुणा के बजाय भाग देता है, 54 जोड़ता है, और 100 आधा कर देता है मानो बल शून्य से बढ़ा हो।)",
        mr: "बल आणि विस्थापन एकाच दिशेत, म्हणून cos 0° = 1 आणि W = 50 × 4 = 200 J. (12.5 गुणण्याऐवजी भागते, 54 जोडते, आणि 100 निम्मे करते जणू बल शून्यापासून वाढले असावे.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A force of 10 N drags a box 5 m along the floor while acting at 60° to the floor. Taking cos 60° = 0.5, how much work does it do?",
        hi: "10 N का बल एक बक्से को फ़र्श पर 5 m तक घसीटता है, फ़र्श से 60° पर लगते हुए। cos 60° = 0.5 लेते हुए, वह कितना कार्य करता है?",
        mr: "10 N चे बल एका खोक्याला जमिनीवर 5 m ओढते, जमिनीशी 60° वर लागत. cos 60° = 0.5 घेतल्यास, ते किती कार्य करते?",
      },
      answer: 25,
      wrong: [50, 5, 12.5],
      checkExpr: "10*5*0.5",
      solution: {
        en: "W = Fs cos θ = 10 × 5 × 0.5 = 25 J. Only the component of the force along the floor does work; the vertical component moves nothing. (50 is the answer for a horizontal pull, dropping the cosine entirely.)",
        hi: "W = Fs cos θ = 10 × 5 × 0.5 = 25 J. केवल फ़र्श के अनुदिश बल का घटक कार्य करता है; ऊर्ध्वाधर घटक कुछ नहीं हिलाता। (50 क्षैतिज खिंचाव का उत्तर है, जो कोज्या पूरी तरह गिरा देता है।)",
        mr: "W = Fs cos θ = 10 × 5 × 0.5 = 25 J. केवळ जमिनीच्या दिशेचा बलाचा घटक कार्य करतो; उभा घटक काहीही हलवत नाही. (50 हे आडव्या ओढीचे उत्तर, जे कोसाइन पूर्णपणे गाळते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "What is the kinetic energy of a 2 kg body moving at 6 m/s?",
        hi: "6 m/s से चलते 2 kg पिंड की गतिज ऊर्जा क्या है?",
        mr: "6 m/s ने जाणाऱ्या 2 kg पिंडाची गतिज ऊर्जा किती?",
      },
      answer: 36,
      wrong: [6, 12, 72],
      checkExpr: "0.5*2*6^2",
      solution: {
        en: "KE = ½mv² = ½ × 2 × 36 = 36 J. (12 uses mv and forgets the square, and 72 is mv² with the half dropped — the same half that comes from the area under the force–displacement graph.)",
        hi: "KE = ½mv² = ½ × 2 × 36 = 36 J. (12 mv लेता है और वर्ग भूल जाता है, और 72 mv² है जिसमें आधा गिरा दिया गया — वही आधा जो बल-विस्थापन आलेख के नीचे के क्षेत्रफल से आता है।)",
        mr: "KE = ½mv² = ½ × 2 × 36 = 36 J. (12 हे mv घेते आणि वर्ग विसरते, आणि 72 हे mv² ज्यातून निम्मे गाळले — तेच निम्मे जे बल-विस्थापन आलेखाखालच्या क्षेत्रफळातून येते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A 5 kg body speeds up from 2 m/s to 4 m/s. How much net work was done on it?",
        hi: "5 kg का पिंड 2 m/s से बढ़कर 4 m/s हो जाता है। उस पर कितना कुल कार्य हुआ?",
        mr: "5 kg चा पिंड 2 m/s वरून 4 m/s होतो. त्याच्यावर किती एकूण कार्य झाले?",
      },
      answer: 30,
      wrong: [10, 40, 60],
      checkExpr: "0.5*5*(4^2-2^2)",
      solution: {
        en: "By the work–energy theorem the net work is the change in kinetic energy: ½ × 5 × (16 − 4) = ½ × 5 × 12 = 30 J. Nothing needed to be known about the force or the time. (40 is the final kinetic energy alone, forgetting the body already had 10 J.)",
        hi: "कार्य-ऊर्जा प्रमेय से कुल कार्य गतिज ऊर्जा का परिवर्तन है: ½ × 5 × (16 − 4) = ½ × 5 × 12 = 30 J. बल या समय के बारे में कुछ जानने की ज़रूरत नहीं पड़ी। (40 केवल अंतिम गतिज ऊर्जा है, यह भूलकर कि पिंड के पास पहले से 10 J थे।)",
        mr: "कार्य-ऊर्जा प्रमेयाने एकूण कार्य म्हणजे गतिज ऊर्जेतील बदल: ½ × 5 × (16 − 4) = ½ × 5 × 12 = 30 J. बल वा काळाबद्दल काहीही जाणण्याची गरज पडली नाही. (40 फक्त शेवटची गतिज ऊर्जा, हे विसरून की पिंडाकडे आधीच 10 J होते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A body of mass 2 kg is dropped from a height of 5 m. Taking g as 10 m/s² and ignoring air resistance, at what speed does it reach the ground?",
        hi: "2 kg द्रव्यमान का पिंड 5 m ऊँचाई से गिराया जाता है। g को 10 m/s² लेकर और वायु प्रतिरोध छोड़कर, वह ज़मीन पर किस चाल से पहुँचता है?",
        mr: "2 kg वस्तुमानाचा पिंड 5 m उंचीवरून टाकला जातो. g हा 10 m/s² घेऊन आणि हवेचा विरोध सोडून, तो जमिनीवर कोणत्या चालीने पोहोचतो?",
      },
      answer: 10,
      wrong: [100, 5, 50],
      checkExpr: "(2*10*5)^0.5",
      fmt: ms,
      solution: {
        en: "Setting mgh = ½mv², the mass cancels and v = √(2gh) = √100 = 10 m/s — a heavier body would arrive at exactly the same speed. (100 is v² with the root forgotten, and 50 is the potential energy per kilogram in joules, not a speed.)",
        hi: "mgh = ½mv² रखने पर द्रव्यमान कट जाता है और v = √(2gh) = √100 = 10 m/s — भारी पिंड ठीक उसी चाल से पहुँचता। (100 v² है जिसमें मूल भूला गया, और 50 प्रति किलोग्राम स्थितिज ऊर्जा है जूल में, चाल नहीं।)",
        mr: "mgh = ½mv² ठेवल्यास वस्तुमान कापले जाते आणि v = √(2gh) = √100 = 10 m/s — जड पिंड नेमक्या त्याच चालीने पोहोचला असता. (100 हे v² ज्यात मूळ विसरले, आणि 50 ही प्रति किलोग्रॅम स्थितिज ऊर्जा ज्यूलमध्ये, चाल नव्हे.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A pump raises 100 kg of water through 10 m in 20 s. Taking g as 10 m/s², what is its output power?",
        hi: "एक पंप 100 kg पानी को 20 s में 10 m ऊपर उठाता है। g को 10 m/s² लेते हुए, उसकी निर्गत शक्ति क्या है?",
        mr: "एक पंप 100 kg पाणी 20 s मध्ये 10 m वर उचलतो. g हा 10 m/s² घेतल्यास, त्याची निर्गत शक्ती किती?",
      },
      answer: 500,
      wrong: [50, 1000, 200],
      checkExpr: "100*10*10/20",
      solution: {
        en: "The work done is mgh = 100 × 10 × 10 = 10,000 J, and power is that divided by the time: 10000/20 = 500 W. (1000 forgets to divide by the time and then slips a decimal; 50 divides the height by the time instead.)",
        hi: "किया गया कार्य mgh = 100 × 10 × 10 = 10,000 J है, और शक्ति उसे समय से भाग देने पर: 10000/20 = 500 W. (1000 समय से भाग देना भूलता है और फिर दशमलव खिसका देता है; 50 इसके बजाय ऊँचाई को समय से भाग देता है।)",
        mr: "केलेले कार्य mgh = 100 × 10 × 10 = 10,000 J, आणि शक्ती म्हणजे ते काळाने भागिले: 10000/20 = 500 W. (1000 काळाने भागायचे विसरते आणि मग दशांश सरकवते; 50 त्याऐवजी उंची काळाने भागते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A spring of stiffness 200 N/m is compressed by 0.1 m. How much elastic potential energy is stored in it?",
        hi: "200 N/m दृढ़ता वाली स्प्रिंग 0.1 m दबाई जाती है। उसमें कितनी प्रत्यास्थ स्थितिज ऊर्जा संचित होती है?",
        mr: "200 N/m ताठरतेची स्प्रिंग 0.1 m दाबली जाते. तिच्यात किती प्रत्यास्थ स्थितिज ऊर्जा साठते?",
      },
      answer: 1,
      wrong: [2, 20, 10],
      checkExpr: "0.5*200*0.1^2",
      solution: {
        en: "U = ½kx² = ½ × 200 × 0.01 = 1 J. The half is there because the force grows from zero to kx as the spring is compressed, so the work is the triangular area under the graph rather than the rectangle kx·x. (2 drops the half and 20 uses x rather than x².)",
        hi: "U = ½kx² = ½ × 200 × 0.01 = 1 J. आधा इसलिए है कि स्प्रिंग दबते समय बल शून्य से बढ़कर kx होता है, अतः कार्य आलेख के नीचे का त्रिभुजाकार क्षेत्रफल है, आयत kx·x नहीं। (2 आधा गिरा देता है और 20 x² के बजाय x लेता है।)",
        mr: "U = ½kx² = ½ × 200 × 0.01 = 1 J. निम्मे यासाठी की स्प्रिंग दाबताना बल शून्यापासून वाढून kx होते, म्हणून कार्य आलेखाखालचे त्रिकोणी क्षेत्रफळ, आयत kx·x नव्हे. (2 निम्मे गाळते आणि 20 हे x² ऐवजी x घेते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A 4 kg lump of clay moving at 5 m/s strikes a stationary 6 kg lump and they move off together. What is their common velocity?",
        hi: "5 m/s से चलता 4 kg मिट्टी का लोंदा 6 kg के स्थिर लोंदे से टकराता है और वे साथ चल पड़ते हैं। उनका साझा वेग क्या है?",
        mr: "5 m/s ने जाणारा 4 kg मातीचा गोळा 6 kg च्या स्थिर गोळ्यावर आदळतो आणि ते एकत्र पुढे जातात. त्यांचा सामायिक वेग किती?",
      },
      answer: 2,
      wrong: [5, 3, 0.5],
      checkExpr: "4*5/(4+6)",
      fmt: ms,
      solution: {
        en: "Momentum is conserved whatever the collision does to the kinetic energy: 4 × 5 = 10v, so v = 2 m/s. (3 averages the two velocities by mass incorrectly, and 5 forgets that the moving lump now has to carry a passenger.)",
        hi: "टक्कर गतिज ऊर्जा का जो भी करे, संवेग संरक्षित रहता है: 4 × 5 = 10v, अतः v = 2 m/s. (3 दोनों वेगों का द्रव्यमान-भारित औसत ग़लत निकालता है, और 5 भूल जाता है कि चलते लोंदे को अब एक सवारी ढोनी है।)",
        mr: "टक्कर गतिज ऊर्जेचे काहीही करो, संवेग संरक्षित राहतो: 4 × 5 = 10v, म्हणून v = 2 m/s. (3 दोन्ही वेगांची वस्तुमान-भारित सरासरी चुकीची काढते, आणि 5 विसरते की चालणाऱ्या गोळ्याला आता एक प्रवासी वाहायचा आहे.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "In that same collision — 4 kg at 5 m/s sticking to a stationary 6 kg and moving off at 2 m/s — how much kinetic energy is lost?",
        hi: "उसी टक्कर में — 4 kg 5 m/s पर स्थिर 6 kg से चिपककर 2 m/s पर चलते हुए — कितनी गतिज ऊर्जा खोती है?",
        mr: "त्याच टक्करीत — 4 kg 5 m/s ने स्थिर 6 kg ला चिकटून 2 m/s ने पुढे जात — किती गतिज ऊर्जा गमावली जाते?",
      },
      answer: 30,
      wrong: [20, 50, 10],
      checkExpr: "0.5*4*5^2-0.5*10*2^2",
      solution: {
        en: "Before: ½ × 4 × 25 = 50 J. After: ½ × 10 × 4 = 20 J. The loss is 50 − 20 = 30 J, which went into deforming and warming the clay. Total energy is still conserved; only the kinetic share fell. (50 and 20 are the two kinetic energies themselves rather than their difference.)",
        hi: "पहले: ½ × 4 × 25 = 50 J. बाद में: ½ × 10 × 4 = 20 J. हानि 50 − 20 = 30 J है, जो मिट्टी के विरूपण और उसे गरम करने में गई। कुल ऊर्जा फिर भी संरक्षित है; केवल गतिज हिस्सा गिरा। (50 और 20 स्वयं दोनों गतिज ऊर्जाएँ हैं, उनका अंतर नहीं।)",
        mr: "आधी: ½ × 4 × 25 = 50 J. नंतर: ½ × 10 × 4 = 20 J. हानी 50 − 20 = 30 J, जी मातीच्या विरूपणात आणि तिला तापवण्यात गेली. एकूण ऊर्जा तरीही संरक्षित; केवळ गतिज वाटा घटला. (50 आणि 20 या स्वतः दोन गतिज ऊर्जा, त्यांचा फरक नव्हे.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A 1200 kg car travelling at 20 m/s is brought to rest by its brakes. How much work do the brakes do?",
        hi: "20 m/s से चलती 1200 kg की कार ब्रेक से विराम में लाई जाती है। ब्रेक कितना कार्य करते हैं?",
        mr: "20 m/s ने जाणारी 1200 kg ची कार ब्रेकने स्थिर केली जाते. ब्रेक किती कार्य करतात?",
      },
      answer: 240000,
      wrong: [24000, 12000, 480000],
      checkExpr: "0.5*1200*20^2",
      solution: {
        en: "The brakes must remove all the kinetic energy: ½ × 1200 × 400 = 240,000 J. Note that the stopping distance is nowhere in the question and is not needed. Doubling the speed would quadruple this figure, which is the real argument behind speed limits. (480000 forgets the half.)",
        hi: "ब्रेक को पूरी गतिज ऊर्जा हटानी है: ½ × 1200 × 400 = 240,000 J. ध्यान दो रुकने की दूरी प्रश्न में कहीं नहीं है और चाहिए भी नहीं। चाल दोगुनी करने पर यह आँकड़ा चौगुना हो जाता, और गति-सीमाओं के पीछे यही असली तर्क है। (480000 आधा भूल जाता है।)",
        mr: "ब्रेकना अख्खी गतिज ऊर्जा काढावी लागते: ½ × 1200 × 400 = 240,000 J. लक्षात घ्या थांबण्याचे अंतर प्रश्नात कुठेही नाही आणि लागतही नाही. चाल दुप्पट केल्यास हा आकडा चौपट झाला असता, आणि वेगमर्यादांमागचा खरा युक्तिवाद हाच. (480000 निम्मे विसरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A 60 kg athlete runs up a flight of stairs of vertical height 5 m in 4 s. Taking g as 10 m/s², what is their average useful power output?",
        hi: "60 kg का खिलाड़ी 5 m ऊर्ध्वाधर ऊँचाई की सीढ़ियाँ 4 s में चढ़ता है। g को 10 m/s² लेते हुए, उसकी औसत उपयोगी निर्गत शक्ति क्या है?",
        mr: "60 kg चा खेळाडू 5 m उभी उंची असलेल्या जिन्याने 4 s मध्ये वर धावतो. g हा 10 m/s² घेतल्यास, त्याची सरासरी उपयुक्त निर्गत शक्ती किती?",
      },
      answer: 750,
      wrong: [300, 3000, 75],
      checkExpr: "60*10*5/4",
      solution: {
        en: "Only the vertical rise counts, because the horizontal part of the run is perpendicular to gravity and gravity does no work along it. The useful work is mgh = 60 × 10 × 5 = 3000 J, done in 4 s, so P = 750 W. Two things are worth noticing. The length of the staircase never entered — a longer, gentler flight to the same landing needs the same work, though it would take longer and so give a lower power. And 750 W is the USEFUL output only: a body is at best about a quarter efficient, so the athlete is actually burning energy at something like 3000 W, which is why the effort is exhausting and why they are hot afterwards. (300 divides the work by the height instead of the time, 3000 quotes the work as though it were a power, and 75 slips a factor of ten.)",
        hi: "केवल ऊर्ध्वाधर चढ़ाई गिनी जाती है, क्योंकि दौड़ का क्षैतिज भाग गुरुत्व के लंबवत है और गुरुत्व उस पर कोई कार्य नहीं करता। उपयोगी कार्य mgh = 60 × 10 × 5 = 3000 J है, जो 4 s में हुआ, अतः P = 750 W. दो बातें ध्यान देने योग्य हैं। सीढ़ी की लंबाई कभी आई ही नहीं — उसी छोर तक जाती लंबी, कम ढालू सीढ़ी उतना ही कार्य माँगती है, यद्यपि उसमें अधिक समय लगता और इसलिए शक्ति कम निकलती। और 750 W केवल उपयोगी निर्गत है: शरीर अधिक से अधिक लगभग एक चौथाई दक्ष होता है, अतः खिलाड़ी वस्तुतः 3000 W के आसपास ऊर्जा जला रहा है, इसीलिए यह परिश्रम थका देता है और इसीलिए बाद में उसे गर्मी लगती है। (300 कार्य को समय के बजाय ऊँचाई से भाग देता है, 3000 कार्य को ऐसे बताता है मानो वह शक्ति हो, और 75 में दस का गुणक खिसक जाता है।)",
        mr: "केवळ उभी चढण मोजली जाते, कारण धावेचा आडवा भाग गुरुत्वाला लंब आहे आणि गुरुत्व त्यावर कोणतेही कार्य करत नाही. उपयुक्त कार्य mgh = 60 × 10 × 5 = 3000 J, जे 4 s मध्ये झाले, म्हणून P = 750 W. दोन गोष्टी लक्षात घेण्याजोग्या. जिन्याची लांबी कधी आलीच नाही — त्याच टप्प्यापर्यंत जाणारा लांब, कमी तीव्र जिना तितकेच कार्य मागतो, जरी त्याला अधिक वेळ लागला असता आणि म्हणून शक्ती कमी निघाली असती. आणि 750 W ही केवळ उपयुक्त निर्गत: शरीर फार तर सुमारे एक चतुर्थांश कार्यक्षम असते, म्हणून खेळाडू प्रत्यक्षात 3000 W च्या आसपास ऊर्जा जाळत आहे, म्हणूनच हे श्रम थकवतात आणि म्हणूनच नंतर त्याला उकडते. (300 कार्य काळाऐवजी उंचीने भागते, 3000 कार्य असे सांगते जणू ती शक्ती असावी, आणि 75 मध्ये दहाचा गुणक सरकतो.)",
      },
    },
  ],
  "physics-11-system-of-particles-and-rotational-motion": [
    {
      level: 1,
      stem: {
        en: "Two point masses, 2 kg at x = 0 and 3 kg at x = 5 m, lie on a line. Where is their centre of mass?",
        hi: "दो बिंदु द्रव्यमान, x = 0 पर 2 kg और x = 5 m पर 3 kg, एक रेखा पर हैं। उनका द्रव्यमान केंद्र कहाँ है?",
        mr: "दोन बिंदू वस्तुमाने, x = 0 वर 2 kg आणि x = 5 m वर 3 kg, एका रेषेवर आहेत. त्यांचे वस्तुमान केंद्र कुठे?",
      },
      answer: 3,
      wrong: [2, 2.5, 5],
      checkExpr: "(2*0+3*5)/(2+3)",
      fmt: metres,
      solution: {
        en: "x = (2 × 0 + 3 × 5)/(2 + 3) = 15/5 = 3 m. It sits nearer the heavier mass, as it must. (2.5 is the midpoint, which would be right only for equal masses, and 2 leans the wrong way.)",
        hi: "x = (2 × 0 + 3 × 5)/(2 + 3) = 15/5 = 3 m. वह भारी द्रव्यमान के पास बैठता है, जैसा उसे होना चाहिए। (2.5 मध्यबिंदु है, जो केवल बराबर द्रव्यमानों के लिए सही होता, और 2 ग़लत ओर झुकता है।)",
        mr: "x = (2 × 0 + 3 × 5)/(2 + 3) = 15/5 = 3 m. तो जड वस्तुमानाजवळ बसतो, जसा त्याने असावा. (2.5 हा मध्यबिंदू, जो केवळ समान वस्तुमानांसाठी बरोबर ठरला असता, आणि 2 चुकीच्या बाजूला झुकतो.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A force of 10 N is applied perpendicular to a spanner at a distance of 0.5 m from the nut. What torque does it produce?",
        hi: "नट से 0.5 m दूरी पर पाने के लंबवत 10 N का बल लगाया जाता है। वह कितना बल-आघूर्ण देता है?",
        mr: "नटपासून 0.5 m अंतरावर पान्याला लंब 10 N चे बल लावले जाते. ते किती बलआघूर्ण देते?",
      },
      answer: 5,
      wrong: [20, 0.05, 10.5],
      checkExpr: "10*0.5",
      solution: {
        en: "τ = F × r⊥ = 10 × 0.5 = 5 N m. Doubling the spanner's length would double the torque for the same effort, which is the whole reason long spanners exist. (20 divides instead of multiplying.)",
        hi: "τ = F × r⊥ = 10 × 0.5 = 5 N m. पाने की लंबाई दोगुनी करने पर उसी परिश्रम में बल-आघूर्ण दोगुना हो जाता, और लंबे पाने इसी कारण होते हैं। (20 गुणा के बजाय भाग देता है।)",
        mr: "τ = F × r⊥ = 10 × 0.5 = 5 N m. पान्याची लांबी दुप्पट केल्यास त्याच श्रमात बलआघूर्ण दुप्पट झाले असते, आणि लांब पाने याच कारणाने असतात. (20 गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A point mass of 3 kg is fixed at a distance of 2 m from an axis. What is its moment of inertia about that axis?",
        hi: "3 kg का बिंदु द्रव्यमान किसी अक्ष से 2 m दूरी पर जड़ा है। उस अक्ष के परितः उसका जड़त्व आघूर्ण क्या है?",
        mr: "3 kg चे बिंदू वस्तुमान एका अक्षापासून 2 m अंतरावर जडवलेले आहे. त्या अक्षाभोवती त्याचे जडत्व आघूर्ण किती?",
      },
      answer: 12,
      wrong: [6, 1.5, 24],
      checkExpr: "3*2^2",
      solution: {
        en: "I = mr² = 3 × 4 = 12 kg m². The distance is squared, so moving the same mass twice as far out quadruples the figure. (6 forgets to square the distance, which is the single commonest slip in this chapter.)",
        hi: "I = mr² = 3 × 4 = 12 kg m². दूरी वर्ग में आती है, अतः वही द्रव्यमान दुगुना दूर ले जाने पर आँकड़ा चौगुना हो जाता है। (6 दूरी का वर्ग करना भूल जाता है, जो इस अध्याय की सबसे आम अकेली चूक है।)",
        mr: "I = mr² = 3 × 4 = 12 kg m². अंतर वर्गात येते, म्हणून तेच वस्तुमान दुप्पट दूर नेल्यास आकडा चौपट होतो. (6 अंतराचा वर्ग करायचे विसरते, जी या प्रकरणातील सर्वांत नेहमीची एकमेव चूक.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A uniform disc of mass 4 kg and radius 3 m spins about its central axis, for which I = ½MR². What is its moment of inertia?",
        hi: "4 kg द्रव्यमान और 3 m त्रिज्या की समांग चकती अपने केंद्रीय अक्ष के परितः घूमती है, जिसके लिए I = ½MR². उसका जड़त्व आघूर्ण क्या है?",
        mr: "4 kg वस्तुमान आणि 3 m त्रिज्येची एकसमान चकती आपल्या केंद्रीय अक्षाभोवती फिरते, जिच्यासाठी I = ½MR². तिचे जडत्व आघूर्ण किती?",
      },
      answer: 18,
      wrong: [36, 9, 6],
      checkExpr: "0.5*4*3^2",
      solution: {
        en: "I = ½ × 4 × 9 = 18 kg m². A ring of the same mass and radius would give 36, twice as much, because all of a ring's mass sits at the full radius while a disc's is spread inwards. (36 is precisely that ring answer.)",
        hi: "I = ½ × 4 × 9 = 18 kg m². उसी द्रव्यमान और त्रिज्या का छल्ला 36 देता, दुगुना, क्योंकि छल्ले का सारा द्रव्यमान पूरी त्रिज्या पर बैठा है जबकि चकती का भीतर तक फैला है। (36 ठीक वही छल्ले वाला उत्तर है।)",
        mr: "I = ½ × 4 × 9 = 18 kg m². त्याच वस्तुमान आणि त्रिज्येचे कडे 36 दिले असते, दुप्पट, कारण कड्याचे सर्व वस्तुमान पूर्ण त्रिज्येवर बसलेले तर चकतीचे आत पसरलेले. (36 हेच नेमके ते कड्याचे उत्तर.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A torque of 12 N m acts on a body whose moment of inertia is 4 kg m². What is its angular acceleration?",
        hi: "जिस पिंड का जड़त्व आघूर्ण 4 kg m² है उस पर 12 N m का बल-आघूर्ण लगता है। उसका कोणीय त्वरण क्या है?",
        mr: "ज्या पिंडाचे जडत्व आघूर्ण 4 kg m² आहे त्यावर 12 N m चे बलआघूर्ण लागते. त्याचे कोनीय त्वरण किती?",
      },
      answer: 3,
      wrong: [48, 0.33, 8],
      checkExpr: "12/4",
      solution: {
        en: "τ = Iα is the rotational twin of F = ma, so α = 12/4 = 3 rad/s². (48 multiplies where it should divide, and 0.33 inverts the ratio.)",
        hi: "τ = Iα, F = ma का घूर्णी जुड़वाँ है, अतः α = 12/4 = 3 rad/s². (48 वहाँ गुणा करता है जहाँ भाग देना था, और 0.33 अनुपात उलट देता है।)",
        mr: "τ = Iα हे F = ma चे परिवलनी जुळे, म्हणून α = 12/4 = 3 rad/s². (48 जिथे भागायचे तिथे गुणते, आणि 0.33 गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A wheel of moment of inertia 3 kg m² spins at 4 rad/s. What is its rotational kinetic energy?",
        hi: "3 kg m² जड़त्व आघूर्ण वाला पहिया 4 rad/s से घूमता है। उसकी घूर्णी गतिज ऊर्जा क्या है?",
        mr: "3 kg m² जडत्व आघूर्ण असलेले चाक 4 rad/s ने फिरते. त्याची परिवलनी गतिज ऊर्जा किती?",
      },
      answer: 24,
      wrong: [12, 6, 48],
      checkExpr: "0.5*3*4^2",
      solution: {
        en: "KE = ½Iω² = ½ × 3 × 16 = 24 J, the exact analogue of ½mv² with I for m and ω for v. (6 uses ω instead of ω², and 48 drops the half.)",
        hi: "KE = ½Iω² = ½ × 3 × 16 = 24 J, जो ½mv² का ठीक समरूप है, m की जगह I और v की जगह ω. (6 ω² के बजाय ω लेता है, और 48 आधा गिरा देता है।)",
        mr: "KE = ½Iω² = ½ × 3 × 16 = 24 J, जे ½mv² चे नेमके समरूप, m ऐवजी I आणि v ऐवजी ω. (6 हे ω² ऐवजी ω घेते, आणि 48 निम्मे गाळते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A skater spinning at 3 rad/s pulls her arms in, reducing her moment of inertia from 6 kg m² to 2 kg m². What is her new angular speed?",
        hi: "3 rad/s से घूमती स्केटर बाँहें समेटती है, जिससे उसका जड़त्व आघूर्ण 6 kg m² से घटकर 2 kg m² हो जाता है। उसकी नई कोणीय चाल क्या है?",
        mr: "3 rad/s ने फिरणारी स्केटर हात मिटवते, ज्यामुळे तिचे जडत्व आघूर्ण 6 kg m² वरून 2 kg m² होते. तिची नवी कोनीय चाल किती?",
      },
      answer: 9,
      wrong: [1, 4.5, 18],
      checkExpr: "6*3/2",
      solution: {
        en: "No external torque acts, so Iω is unchanged: 6 × 3 = 2ω, giving ω = 9 rad/s. (1 divides the wrong way, letting her slow down, and 4.5 halves the change instead of tripling the speed.)",
        hi: "कोई बाह्य बल-आघूर्ण नहीं लगता, अतः Iω अपरिवर्तित है: 6 × 3 = 2ω, जिससे ω = 9 rad/s. (1 उलटा भाग देता है, जिससे वह धीमी हो जाती, और 4.5 चाल तीन गुनी करने के बजाय परिवर्तन आधा कर देता है।)",
        mr: "कोणतेही बाह्य बलआघूर्ण लागत नाही, म्हणून Iω अपरिवर्तित: 6 × 3 = 2ω, ज्यातून ω = 9 rad/s. (1 उलटे भागते, ज्याने ती मंदावली असती, आणि 4.5 चाल तिप्पट करण्याऐवजी बदल निम्मा करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A wheel of radius 0.4 m rolls without slipping while turning at 10 rad/s. How fast is its centre moving?",
        hi: "0.4 m त्रिज्या का पहिया 10 rad/s से घूमते हुए बिना फिसले लुढ़कता है। उसका केंद्र कितनी तेज़ चल रहा है?",
        mr: "0.4 m त्रिज्येचे चाक 10 rad/s ने फिरत न घसरता घरंगळते. त्याचे केंद्र किती वेगाने जात आहे?",
      },
      answer: 4,
      wrong: [25, 0.04, 10.4],
      checkExpr: "10*0.4",
      fmt: ms,
      solution: {
        en: "Rolling without slipping fixes v = ωR = 10 × 0.4 = 4 m/s. If the wheel were spinning on ice the two would be unrelated; it is the grip that ties them together. (25 divides ω by R and 0.04 divides the wrong way.)",
        hi: "बिना फिसले लोटन v = ωR = 10 × 0.4 = 4 m/s तय कर देता है। यदि पहिया बर्फ़ पर घूम रहा होता तो दोनों असंबद्ध होते; उन्हें जोड़ती है पकड़। (25 ω को R से भाग देता है और 0.04 उलटा भाग देता है।)",
        mr: "न घसरता घरंगळणे v = ωR = 10 × 0.4 = 4 m/s ठरवते. चाक बर्फावर फिरत असते तर दोन्ही असंबद्ध राहिली असती; त्यांना जोडते ती पकड. (25 हे ω ला R ने भागते आणि 0.04 उलटे भागते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A uniform rod of mass 3 kg and length 2 m rotates about a perpendicular axis through its centre, for which I = ML²/12. What is its moment of inertia?",
        hi: "3 kg द्रव्यमान और 2 m लंबाई की समांग छड़ अपने केंद्र से गुज़रते लंबवत अक्ष के परितः घूमती है, जिसके लिए I = ML²/12. उसका जड़त्व आघूर्ण क्या है?",
        mr: "3 kg वस्तुमान आणि 2 m लांबीची एकसमान दांडी आपल्या केंद्रातून जाणाऱ्या लंब अक्षाभोवती फिरते, जिच्यासाठी I = ML²/12. तिचे जडत्व आघूर्ण किती?",
      },
      answer: 1,
      wrong: [4, 3, 0.5],
      checkExpr: "3*2^2/12",
      solution: {
        en: "I = 3 × 4/12 = 1 kg m². About one END the same rod gives ML²/3 = 4 kg m², four times as much, which is why quoting a moment of inertia without naming the axis says nothing at all. (4 is precisely that end-axis answer.)",
        hi: "I = 3 × 4/12 = 1 kg m². एक सिरे के परितः वही छड़ ML²/3 = 4 kg m² देती है, चार गुना, इसीलिए अक्ष बताए बिना जड़त्व आघूर्ण कहना कुछ भी नहीं कहता। (4 ठीक वही सिरे वाले अक्ष का उत्तर है।)",
        mr: "I = 3 × 4/12 = 1 kg m². एका टोकाभोवती तीच दांडी ML²/3 = 4 kg m² देते, चौपट, म्हणूनच अक्ष न सांगता जडत्व आघूर्ण सांगणे काहीच सांगत नाही. (4 हेच नेमके ते टोकाच्या अक्षाचे उत्तर.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A solid cylinder rolls without slipping, with I = ½MR². What percentage of its total kinetic energy is rotational?",
        hi: "ठोस बेलन बिना फिसले लुढ़कता है, जिसके लिए I = ½MR². उसकी कुल गतिज ऊर्जा का कितना प्रतिशत घूर्णी है?",
        mr: "भरीव दंडगोल न घसरता घरंगळतो, ज्याच्यासाठी I = ½MR². त्याच्या एकूण गतिज ऊर्जेच्या किती टक्के परिवलनी आहे?",
      },
      answer: 33.333333,
      wrong: [50, 25, 66.666667],
      checkExpr: "100/3",
      solution: {
        en: "Rolling ties ω to v by ω = v/R. The rotational share is ½Iω² = ½ × ½MR² × v²/R² = ¼Mv², and the translational share is ½Mv², so the total is ¾Mv². The rotational fraction is (¼)/(¾) = 1/3, or 33.333333 per cent. Notice that neither M nor R survives — a marble and a millstone of the same shape divide their energy identically, which is why a downhill race is decided by shape alone. A hollow ring, with I = MR², splits it 50–50 and is therefore slower still; a solid sphere, with I = ⅖MR², keeps only 2/7 in rotation and wins. (50 is the ring's answer and 66.666667 inverts the fraction, quoting the translational share instead.)",
        hi: "लोटन ω को v से ω = v/R द्वारा बाँधता है। घूर्णी हिस्सा ½Iω² = ½ × ½MR² × v²/R² = ¼Mv², और स्थानांतरण हिस्सा ½Mv², अतः कुल ¾Mv². घूर्णी अंश (¼)/(¾) = 1/3, यानी 33.333333 प्रतिशत। ध्यान दो न M बचता है न R — एक ही आकार का कंचा और चक्की का पाट अपनी ऊर्जा एक-सी बाँटते हैं, इसीलिए ढलान की दौड़ केवल आकार से तय होती है। खोखला छल्ला, जिसके लिए I = MR², उसे 50–50 बाँटता है और इसलिए और भी धीमा है; ठोस गोला, जिसके लिए I = ⅖MR², घूर्णन में केवल 2/7 रखता है और जीतता है। (50 छल्ले का उत्तर है और 66.666667 अंश उलट देता है, स्थानांतरण हिस्सा बता देता है।)",
        mr: "घरंगळणे ω ला v शी ω = v/R ने बांधते. परिवलनी वाटा ½Iω² = ½ × ½MR² × v²/R² = ¼Mv², आणि स्थानांतरणी वाटा ½Mv², म्हणून एकूण ¾Mv². परिवलनी अंश (¼)/(¾) = 1/3, म्हणजे 33.333333 टक्के. लक्षात घ्या ना M टिकतो ना R — एकाच आकाराची गोटी आणि जात्याचा दगड आपली ऊर्जा सारखीच विभागतात, म्हणूनच उताराची शर्यत केवळ आकाराने ठरते. पोकळे कडे, ज्याच्यासाठी I = MR², ती 50–50 विभागते आणि म्हणून आणखी सावकाश; भरीव गोल, ज्याच्यासाठी I = ⅖MR², परिवलनात केवळ 2/7 ठेवतो आणि जिंकतो. (50 हे कड्याचे उत्तर आणि 66.666667 अंश उलटे करते, स्थानांतरणी वाटा सांगते.)",
      },
    },
  ],
  "physics-11-gravitation": [
    {
      level: 1,
      stem: {
        en: "Two masses attract each other with a force of 36 N. Without changing the masses, their separation is tripled. What is the new force?",
        hi: "दो द्रव्यमान एक-दूसरे को 36 N के बल से खींचते हैं। द्रव्यमान बदले बिना उनकी दूरी तीन गुनी कर दी जाती है। नया बल क्या है?",
        mr: "दोन वस्तुमाने एकमेकांना 36 N च्या बलाने ओढतात. वस्तुमाने न बदलता त्यांचे अंतर तिप्पट केले जाते. नवे बल किती?",
      },
      answer: 4,
      wrong: [12, 18, 108],
      checkExpr: "36/3^2",
      fmt: newtons,
      solution: {
        en: "The force goes as 1/r², so tripling r divides it by 9: 36/9 = 4 N. (12 divides by 3 and forgets the square — the single most common error with this law.)",
        hi: "बल 1/r² के अनुसार चलता है, अतः r तीन गुना करने पर वह 9 से भाग हो जाता है: 36/9 = 4 N. (12 3 से भाग देता है और वर्ग भूल जाता है — इस नियम की सबसे आम अकेली भूल।)",
        mr: "बल 1/r² नुसार जाते, म्हणून r तिप्पट केल्यास ते 9 ने भागले जाते: 36/9 = 4 N. (12 हे 3 ने भागते आणि वर्ग विसरते — या नियमाची सर्वांत नेहमीची एकमेव चूक.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A person of mass 60 kg stands on the Moon, where g is 1.6 m/s². What is their weight there?",
        hi: "60 kg द्रव्यमान का व्यक्ति चंद्रमा पर खड़ा है, जहाँ g = 1.6 m/s². वहाँ उसका भार क्या है?",
        mr: "60 kg वस्तुमानाची व्यक्ती चंद्रावर उभी आहे, जिथे g = 1.6 m/s². तिथे तिचे वजन किती?",
      },
      answer: 96,
      wrong: [600, 37.5, 61.6],
      checkExpr: "60*1.6",
      fmt: newtons,
      solution: {
        en: "Weight is mg = 60 × 1.6 = 96 N. The mass is still 60 kg — mass is a property of the body and weight is a force that depends on where the body is. (600 uses the Earth's g and 37.5 divides instead of multiplying.)",
        hi: "भार mg = 60 × 1.6 = 96 N. द्रव्यमान अब भी 60 kg है — द्रव्यमान पिंड का गुण है और भार वह बल जो इस पर निर्भर है कि पिंड कहाँ है। (600 पृथ्वी का g लगाता है और 37.5 गुणा के बजाय भाग देता है।)",
        mr: "वजन mg = 60 × 1.6 = 96 N. वस्तुमान अजूनही 60 kg — वस्तुमान हा पिंडाचा गुणधर्म आणि वजन हे बल जे पिंड कुठे आहे यावर अवलंबून. (600 पृथ्वीचा g वापरते आणि 37.5 गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Taking g at the Earth's surface as 10 m/s², what is its value at a height equal to one Earth radius above the surface?",
        hi: "पृथ्वी की सतह पर g को 10 m/s² लेते हुए, सतह से एक पृथ्वी-त्रिज्या जितनी ऊँचाई पर उसका मान क्या है?",
        mr: "पृथ्वीच्या पृष्ठभागावर g हा 10 m/s² घेतल्यास, पृष्ठभागापासून एक पृथ्वी-त्रिज्येइतक्या उंचीवर त्याचे मूल्य किती?",
      },
      answer: 2.5,
      wrong: [5, 10, 20],
      checkExpr: "10/2^2",
      solution: {
        en: "Distances are measured from the CENTRE, so at that height r = 2R and g falls by a factor of 2² = 4: 10/4 = 2.5 m/s². (5 halves it, measuring the drop from the surface rather than the centre — the mistake this question exists to catch.)",
        hi: "दूरियाँ केंद्र से नापी जाती हैं, अतः उस ऊँचाई पर r = 2R और g 2² = 4 के गुणक से घटता है: 10/4 = 2.5 m/s². (5 उसे आधा कर देता है, गिरावट केंद्र के बजाय सतह से नापकर — यही वह भूल है जिसे पकड़ने के लिए यह प्रश्न है।)",
        mr: "अंतरे केंद्रापासून मोजली जातात, म्हणून त्या उंचीवर r = 2R आणि g हा 2² = 4 च्या पटीने घटतो: 10/4 = 2.5 m/s². (5 ते निम्मे करते, घट केंद्राऐवजी पृष्ठभागापासून मोजून — हीच ती चूक जी पकडण्यासाठी हा प्रश्न आहे.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A planet has a surface gravity of 8 m/s² and a radius of 4000 km. What is its escape speed, in km/s?",
        hi: "किसी ग्रह का सतही गुरुत्व 8 m/s² और त्रिज्या 4000 km है। उसकी पलायन चाल km/s में क्या है?",
        mr: "एका ग्रहाचे पृष्ठभागीय गुरुत्व 8 m/s² आणि त्रिज्या 4000 km आहे. त्याची मुक्ती चाल km/s मध्ये किती?",
      },
      answer: 8,
      wrong: [4, 16, 11.2],
      checkExpr: "(2*8*4000000)^0.5/1000",
      solution: {
        en: "v = √(2gR) = √(2 × 8 × 4,000,000) = √64,000,000 = 8000 m/s = 8 km/s. The escaping body's own mass never appears, so a pebble and a rocket share the same threshold. (11.2 is the Earth's figure quoted from memory, and 4 forgets the factor of 2.)",
        hi: "v = √(2gR) = √(2 × 8 × 4,000,000) = √64,000,000 = 8000 m/s = 8 km/s. पलायन करते पिंड का अपना द्रव्यमान कहीं नहीं आता, अतः कंकड़ और रॉकेट वही सीमा साझा करते हैं। (11.2 स्मृति से बताया गया पृथ्वी का आँकड़ा है, और 4 2 का गुणक भूल जाता है।)",
        mr: "v = √(2gR) = √(2 × 8 × 4,000,000) = √64,000,000 = 8000 m/s = 8 km/s. सुटणाऱ्या पिंडाचे स्वतःचे वस्तुमान कुठेही येत नाही, म्हणून खडा आणि रॉकेट तीच मर्यादा वाटून घेतात. (11.2 हा स्मरणातून सांगितलेला पृथ्वीचा आकडा, आणि 4 हे 2 चा गुणक विसरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A planet orbits its star at four times the Earth's distance from the Sun. By Kepler's third law, what is its period in Earth years?",
        hi: "एक ग्रह अपने तारे की परिक्रमा सूर्य से पृथ्वी की दूरी के चार गुने पर करता है। केप्लर के तीसरे नियम से, उसका आवर्तकाल पृथ्वी-वर्षों में क्या है?",
        mr: "एक ग्रह आपल्या ताऱ्याभोवती सूर्यापासून पृथ्वीच्या अंतराच्या चौपट अंतरावर फिरतो. केप्लरच्या तिसऱ्या नियमाने, त्याचा आवर्तकाल पृथ्वी-वर्षांत किती?",
      },
      answer: 8,
      wrong: [4, 16, 64],
      checkExpr: "4^1.5",
      solution: {
        en: "T² ∝ r³, so T ∝ r^1.5 and T = 4^1.5 = 8 years. (4 assumes the period is simply proportional to the distance, 16 squares it, and 64 cubes it — the three ways of forgetting that the law relates a square to a cube.)",
        hi: "T² ∝ r³, अतः T ∝ r^1.5 और T = 4^1.5 = 8 वर्ष। (4 मान लेता है कि आवर्तकाल बस दूरी का समानुपाती है, 16 उसका वर्ग करता है, और 64 घन — यह नियम एक वर्ग को एक घन से जोड़ता है, यह भूलने के तीन तरीक़े।)",
        mr: "T² ∝ r³, म्हणून T ∝ r^1.5 आणि T = 4^1.5 = 8 वर्षे. (4 गृहीत धरते की आवर्तकाल फक्त अंतराच्या समानुपाती, 16 त्याचा वर्ग करते, आणि 64 घन — हा नियम एका वर्गाला एका घनाशी जोडतो हे विसरण्याचे तीन मार्ग.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Taking g as 10 m/s² and the Earth's radius as 6400 km, what is the orbital speed of a satellite skimming the surface, in km/s?",
        hi: "g को 10 m/s² और पृथ्वी की त्रिज्या को 6400 km लेते हुए, सतह के ठीक ऊपर चक्कर लगाते उपग्रह की कक्षीय चाल km/s में क्या है?",
        mr: "g हा 10 m/s² आणि पृथ्वीची त्रिज्या 6400 km घेतल्यास, पृष्ठभागाजवळून फिरणाऱ्या उपग्रहाची कक्षीय चाल km/s मध्ये किती?",
      },
      answer: 8,
      wrong: [11.3, 4, 64],
      checkExpr: "(10*6400000)^0.5/1000",
      solution: {
        en: "Gravity supplies the centripetal force, so mg = mv²/R and v = √(gR) = √(64,000,000) = 8000 m/s = 8 km/s. Escape speed is √2 times this, about 11.3 km/s, which is why the two numbers are so often confused. (11.3 is precisely that confusion.)",
        hi: "गुरुत्व अभिकेंद्र बल देता है, अतः mg = mv²/R और v = √(gR) = √(64,000,000) = 8000 m/s = 8 km/s. पलायन चाल इसकी √2 गुनी है, लगभग 11.3 km/s, इसीलिए दोनों संख्याएँ अक्सर गड्डमड्ड होती हैं। (11.3 ठीक वही गड्डमड्ड है।)",
        mr: "गुरुत्व अभिकेंद्री बल पुरवते, म्हणून mg = mv²/R आणि v = √(gR) = √(64,000,000) = 8000 m/s = 8 km/s. मुक्ती चाल याच्या √2 पट, सुमारे 11.3 km/s, म्हणूनच दोन्ही संख्यांची वारंवार गल्लत होते. (11.3 हीच नेमकी ती गल्लत.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A 70 kg astronaut orbits at a distance of two Earth radii from the centre, where surface g is 10 m/s². What gravitational force acts on them there?",
        hi: "70 kg का अंतरिक्ष यात्री केंद्र से दो पृथ्वी-त्रिज्या दूरी पर परिक्रमा करता है, जहाँ सतही g = 10 m/s². वहाँ उस पर कितना गुरुत्वीय बल लगता है?",
        mr: "70 kg चा अंतराळवीर केंद्रापासून दोन पृथ्वी-त्रिज्या अंतरावर परिभ्रमण करतो, जिथे पृष्ठभागीय g = 10 m/s². तिथे त्याच्यावर किती गुरुत्वीय बल लागते?",
      },
      answer: 175,
      wrong: [0, 700, 350],
      checkExpr: "70*10/2^2",
      fmt: newtons,
      solution: {
        en: "At r = 2R the field is 10/4 = 2.5 m/s², so F = 70 × 2.5 = 175 N. The astronaut floats not because this force is absent but because they and the spacecraft are falling together — a scale beside them would read zero while this 175 N is acting the whole time. (0 is the answer the word 'weightless' invites, and it is wrong.)",
        hi: "r = 2R पर क्षेत्र 10/4 = 2.5 m/s² है, अतः F = 70 × 2.5 = 175 N. यात्री इसलिए नहीं तैरता कि यह बल अनुपस्थित है बल्कि इसलिए कि वह और यान साथ गिर रहे हैं — उसके पास रखा तराज़ू शून्य दिखाता जबकि ये 175 N पूरे समय लग रहे हैं। (0 वही उत्तर है जिसे 'भारहीन' शब्द बुलाता है, और वह ग़लत है।)",
        mr: "r = 2R वर क्षेत्र 10/4 = 2.5 m/s², म्हणून F = 70 × 2.5 = 175 N. अंतराळवीर यासाठी तरंगत नाही की हे बल अनुपस्थित आहे तर यासाठी की तो आणि यान एकत्र पडत आहेत — त्याच्याशेजारचा काटा शून्य दाखवला असता तर ही 175 N पूर्ण काळ लागत आहेत. (0 हेच ते उत्तर ज्याला 'वजनरहित' हा शब्द बोलावतो, आणि ते चुकीचे आहे.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A satellite skimming the Earth's surface has a period of 84 minutes. What is the period, in minutes, of a satellite orbiting at 16 Earth radii?",
        hi: "पृथ्वी की सतह के ठीक ऊपर चक्कर लगाते उपग्रह का आवर्तकाल 84 मिनट है। 16 पृथ्वी-त्रिज्या पर परिक्रमा करते उपग्रह का आवर्तकाल मिनटों में क्या है?",
        mr: "पृथ्वीच्या पृष्ठभागाजवळून फिरणाऱ्या उपग्रहाचा आवर्तकाल 84 मिनिटे आहे. 16 पृथ्वी-त्रिज्यांवर परिभ्रमण करणाऱ्या उपग्रहाचा आवर्तकाल मिनिटांत किती?",
      },
      answer: 5376,
      wrong: [1344, 336, 21504],
      checkExpr: "84*16^1.5",
      solution: {
        en: "Kepler's third law gives T ∝ r^1.5, so the period is 84 × 16^1.5 = 84 × 64 = 5376 minutes, about 3.7 days. (1344 uses 16 rather than 16^1.5, and 336 uses only the square root.)",
        hi: "केप्लर का तीसरा नियम T ∝ r^1.5 देता है, अतः आवर्तकाल 84 × 16^1.5 = 84 × 64 = 5376 मिनट, लगभग 3.7 दिन। (1344 16^1.5 के बजाय 16 लगाता है, और 336 केवल वर्गमूल लेता है।)",
        mr: "केप्लरचा तिसरा नियम T ∝ r^1.5 देतो, म्हणून आवर्तकाल 84 × 16^1.5 = 84 × 64 = 5376 मिनिटे, सुमारे 3.7 दिवस. (1344 हे 16^1.5 ऐवजी 16 वापरते, आणि 336 फक्त वर्गमूळ घेते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Taking g at the surface as 10 m/s², what is its value at a depth of half the Earth's radius below the surface, assuming uniform density?",
        hi: "सतह पर g को 10 m/s² लेते हुए, समांग घनत्व मानकर, सतह से आधी पृथ्वी-त्रिज्या गहराई पर उसका मान क्या है?",
        mr: "पृष्ठभागावर g हा 10 m/s² घेतल्यास, एकसमान घनता गृहीत धरून, पृष्ठभागाखाली अर्ध्या पृथ्वी-त्रिज्या खोलीवर त्याचे मूल्य किती?",
      },
      answer: 5,
      wrong: [2.5, 20, 10],
      checkExpr: "10*(1-0.5)",
      solution: {
        en: "Below the surface the law changes shape: only the mass inside your radius pulls, and the shell outside contributes nothing, so g = g₀(1 − d/R) = 10 × 0.5 = 5 m/s². It falls LINEARLY with depth and reaches zero at the centre, whereas above the surface it falls as the inverse square. (2.5 applies the above-surface rule below it.)",
        hi: "सतह के नीचे नियम का रूप बदल जाता है: केवल तुम्हारी त्रिज्या के भीतर का द्रव्यमान खींचता है, और बाहर का खोल कुछ नहीं देता, अतः g = g₀(1 − d/R) = 10 × 0.5 = 5 m/s². वह गहराई के साथ रैखिक रूप से घटता है और केंद्र पर शून्य हो जाता है, जबकि सतह के ऊपर वह व्युत्क्रम वर्ग से घटता है। (2.5 सतह के ऊपर वाला नियम नीचे लगा देता है।)",
        mr: "पृष्ठभागाखाली नियमाचा आकार बदलतो: केवळ तुमच्या त्रिज्येच्या आतले वस्तुमान ओढते, आणि बाहेरचे कवच काहीही देत नाही, म्हणून g = g₀(1 − d/R) = 10 × 0.5 = 5 m/s². तो खोलीसह रेषीयरीत्या घटतो आणि केंद्रावर शून्य होतो, तर पृष्ठभागाच्या वर तो व्यस्त वर्गाने घटतो. (2.5 पृष्ठभागावरचा नियम खाली लावते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A planet has twice the Earth's mass and twice its radius. Its surface gravity is what multiple of the Earth's?",
        hi: "किसी ग्रह का द्रव्यमान पृथ्वी से दुगुना और त्रिज्या भी दुगुनी है। उसका सतही गुरुत्व पृथ्वी के गुरुत्व का कितना गुना है?",
        mr: "एका ग्रहाचे वस्तुमान पृथ्वीच्या दुप्पट आणि त्रिज्याही दुप्पट. त्याचे पृष्ठभागीय गुरुत्व पृथ्वीच्या किती पट?",
      },
      answer: 0.5,
      wrong: [1, 2, 4],
      checkExpr: "2/2^2",
      solution: {
        en: "Surface gravity is g = GM/R², so doubling M doubles it while doubling R divides it by four: the net factor is 2/4 = 0.5. A bigger, heavier planet has WEAKER surface gravity than Earth's, which is the counterintuitive part. The reason is that the radius enters squared and the mass only to the first power, so spreading a planet out beats making it heavier. The same reasoning explains why gas giants do not crush their moons and why a planet built of the same material as Earth but twice the radius would have eight times the mass and therefore twice the surface gravity — there M and R are not independent, and the answer changes completely. (1 assumes the two effects cancel one for one, forgetting the square; 2 uses only the mass and 4 only the radius.)",
        hi: "सतही गुरुत्व g = GM/R² है, अतः M दुगुना करने से वह दुगुना होता है जबकि R दुगुना करने से चार से भाग हो जाता है: शुद्ध गुणक 2/4 = 0.5. बड़ा और भारी ग्रह पृथ्वी से दुर्बल सतही गुरुत्व रखता है, और यही उलटा लगने वाला हिस्सा है। कारण यह कि त्रिज्या वर्ग में आती है और द्रव्यमान केवल पहली घात में, अतः ग्रह को फैलाना उसे भारी बनाने पर भारी पड़ता है। यही तर्क बताता है कि गैस-दानव अपने चंद्रमाओं को क्यों नहीं कुचलते और यह भी कि पृथ्वी के ही पदार्थ से बना पर दुगुनी त्रिज्या का ग्रह आठ गुना द्रव्यमान रखता और इसलिए दुगुना सतही गुरुत्व — वहाँ M और R स्वतंत्र नहीं, और उत्तर पूरी तरह बदल जाता है। (1 मान लेता है कि दोनों प्रभाव एक-के-बदले-एक कट जाते हैं, वर्ग भूलकर; 2 केवल द्रव्यमान लेता है और 4 केवल त्रिज्या।)",
        mr: "पृष्ठभागीय गुरुत्व g = GM/R², म्हणून M दुप्पट केल्याने ते दुप्पट होते तर R दुप्पट केल्याने चारने भागले जाते: निव्वळ गुणक 2/4 = 0.5. मोठा आणि जड ग्रह पृथ्वीहून दुर्बल पृष्ठभागीय गुरुत्व बाळगतो, आणि हाच उलटा वाटणारा भाग. कारण हे की त्रिज्या वर्गात येते आणि वस्तुमान केवळ पहिल्या घातेत, म्हणून ग्रह पसरवणे त्याला जड बनवण्यावर वरचढ ठरते. हाच युक्तिवाद सांगतो की वायुदानव आपल्या चंद्रांना का चिरडत नाहीत आणि हेही की पृथ्वीच्याच पदार्थाचा पण दुप्पट त्रिज्येचा ग्रह आठपट वस्तुमान बाळगला असता आणि म्हणून दुप्पट पृष्ठभागीय गुरुत्व — तिथे M आणि R स्वतंत्र नाहीत, आणि उत्तर पूर्णपणे बदलते. (1 गृहीत धरते की दोन्ही परिणाम एकास-एक कापले जातात, वर्ग विसरून; 2 फक्त वस्तुमान घेते आणि 4 फक्त त्रिज्या.)",
      },
    },
  ],
  "physics-11-mechanical-properties-of-solids": [
    {
      level: 1,
      stem: {
        en: "A wire of cross-sectional area 2 mm² carries a load of 100 N. What is the tensile stress in it, in MPa?",
        hi: "2 mm² अनुप्रस्थ काट क्षेत्रफल का तार 100 N का भार ढोता है। उसमें तन्य प्रतिबल MPa में क्या है?",
        mr: "2 mm² आडव्या छेदाच्या क्षेत्रफळाची तार 100 N चे ओझे वाहते. तिच्यातले तन्य प्रतिबल MPa मध्ये किती?",
      },
      answer: 50,
      wrong: [200, 25, 5],
      checkExpr: "100/2",
      solution: {
        en: "Stress is force divided by area: 100/2 = 50 N/mm², and one newton per square millimetre is exactly one megapascal, so the stress is 50 MPa. (200 multiplies instead of dividing, and 25 halves the answer once too often.)",
        hi: "प्रतिबल बल बटा क्षेत्रफल है: 100/2 = 50 N/mm², और एक न्यूटन प्रति वर्ग मिलीमीटर ठीक एक मेगापास्कल है, अतः प्रतिबल 50 MPa. (200 भाग के बजाय गुणा करता है, और 25 उत्तर एक बार अधिक आधा कर देता है।)",
        mr: "प्रतिबल म्हणजे बल भागिले क्षेत्रफळ: 100/2 = 50 N/mm², आणि एक न्यूटन प्रति चौरस मिलीमीटर म्हणजे नेमका एक मेगापास्कल, म्हणून प्रतिबल 50 MPa. (200 भागण्याऐवजी गुणते, आणि 25 उत्तर एकदा जास्त निम्मे करते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A wire 2 m long stretches by 1 mm under a load. What is the longitudinal strain?",
        hi: "2 m लंबा तार भार के नीचे 1 mm खिंचता है। अनुदैर्घ्य विकृति क्या है?",
        mr: "2 m लांब तार ओझ्याखाली 1 mm ताणली जाते. अनुदैर्घ्य विकृती किती?",
      },
      answer: 0.0005,
      wrong: [0.002, 0.5, 2000],
      checkExpr: "0.001/2",
      solution: {
        en: "Strain is the extension divided by the original length, with both in the same units: 0.001/2 = 0.0005. It is a pure number and carries no units at all. (0.5 forgets to convert the millimetre to metres, and 2000 inverts the ratio.)",
        hi: "विकृति विस्तार बटा मूल लंबाई है, दोनों एक ही मात्रक में: 0.001/2 = 0.0005. वह शुद्ध संख्या है और उसका कोई मात्रक नहीं। (0.5 मिलीमीटर को मीटर में बदलना भूलता है, और 2000 अनुपात उलट देता है।)",
        mr: "विकृती म्हणजे ताण भागिले मूळ लांबी, दोन्ही एकाच एककात: 0.001/2 = 0.0005. ती शुद्ध संख्या आणि तिला कोणतेही एकक नाही. (0.5 मिलीमीटरचे मीटरमध्ये रूपांतर विसरते, आणि 2000 गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A material under a stress of 50 MPa shows a strain of 0.0005. What is its Young's modulus, in GPa?",
        hi: "50 MPa प्रतिबल के नीचे किसी पदार्थ की विकृति 0.0005 है। उसका यंग मापांक GPa में क्या है?",
        mr: "50 MPa प्रतिबलाखाली एका पदार्थाची विकृती 0.0005 आहे. त्याचा यंग मापांक GPa मध्ये किती?",
      },
      answer: 100,
      wrong: [10, 1000, 0.1],
      checkExpr: "50/0.0005/1000",
      solution: {
        en: "Y = stress/strain = 50/0.0005 = 100,000 MPa, and a thousand megapascals make a gigapascal, so Y = 100 GPa. Strain has no units, so Y always comes out in the units of stress. (10 and 1000 slip by factors of ten in the final conversion.)",
        hi: "Y = प्रतिबल/विकृति = 50/0.0005 = 100,000 MPa, और हज़ार मेगापास्कल एक गीगापास्कल बनाते हैं, अतः Y = 100 GPa. विकृति का कोई मात्रक नहीं, अतः Y सदा प्रतिबल के मात्रकों में निकलता है। (10 और 1000 अंतिम रूपांतरण में दस के गुणकों से खिसकते हैं।)",
        mr: "Y = प्रतिबल/विकृती = 50/0.0005 = 100,000 MPa, आणि हजार मेगापास्कल एक गिगापास्कल बनवतात, म्हणून Y = 100 GPa. विकृतीला एकक नाही, म्हणून Y नेहमी प्रतिबलाच्या एककांत निघतो. (10 आणि 1000 शेवटच्या रूपांतरात दहाच्या पटींनी सरकतात.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A wire stretches by 2 mm under a load. A second wire of the same material, same length and twice the diameter carries the same load. By how much does it stretch, in mm?",
        hi: "एक तार भार के नीचे 2 mm खिंचता है। उसी पदार्थ, उसी लंबाई और दुगुने व्यास का दूसरा तार वही भार ढोता है। वह mm में कितना खिंचता है?",
        mr: "एक तार ओझ्याखाली 2 mm ताणली जाते. त्याच पदार्थाची, त्याच लांबीची आणि दुप्पट व्यासाची दुसरी तार तेच ओझे वाहते. ती mm मध्ये किती ताणली जाते?",
      },
      answer: 0.5,
      wrong: [1, 4, 8],
      checkExpr: "2/2^2",
      solution: {
        en: "Extension is FL/(AY), and doubling the diameter quadruples the area, so the extension is divided by four: 2/4 = 0.5 mm. (1 halves it, treating area as proportional to diameter rather than to its square.)",
        hi: "विस्तार FL/(AY) है, और व्यास दुगुना करने से क्षेत्रफल चौगुना होता है, अतः विस्तार चार से भाग हो जाता है: 2/4 = 0.5 mm. (1 उसे आधा करता है, क्षेत्रफल को व्यास के वर्ग के बजाय व्यास का समानुपाती मानकर।)",
        mr: "ताण FL/(AY), आणि व्यास दुप्पट केल्याने क्षेत्रफळ चौपट होते, म्हणून ताण चारने भागला जातो: 2/4 = 0.5 mm. (1 ते निम्मे करते, क्षेत्रफळ व्यासाच्या वर्गाऐवजी व्यासाच्या समानुपाती मानून.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A wire stretches by 1 mm under a steady load of 200 N. How much elastic potential energy is stored in it?",
        hi: "एक तार 200 N के स्थिर भार के नीचे 1 mm खिंचता है। उसमें कितनी प्रत्यास्थ स्थितिज ऊर्जा संचित है?",
        mr: "एक तार 200 N च्या स्थिर ओझ्याखाली 1 mm ताणली जाते. तिच्यात किती प्रत्यास्थ स्थितिज ऊर्जा साठलेली आहे?",
      },
      answer: 0.1,
      wrong: [0.2, 0.05, 2],
      checkExpr: "0.5*200*0.001",
      solution: {
        en: "U = ½ × F × x = ½ × 200 × 0.001 = 0.1 J. The half appears because the load built up from zero as the wire lengthened, so the work is the triangle under the load–extension graph. (0.2 drops the half by treating the full load as acting throughout.)",
        hi: "U = ½ × F × x = ½ × 200 × 0.001 = 0.1 J. आधा इसलिए आता है कि तार के लंबा होते-होते भार शून्य से बढ़ा, अतः कार्य भार-विस्तार आलेख के नीचे का त्रिभुज है। (0.2 आधा गिरा देता है, पूरे भार को पूरे समय लगता मानकर।)",
        mr: "U = ½ × F × x = ½ × 200 × 0.001 = 0.1 J. निम्मे यासाठी येते की तार लांब होता होता ओझे शून्यापासून वाढले, म्हणून कार्य म्हणजे ओझे-ताण आलेखाखालचा त्रिकोण. (0.2 निम्मे गाळते, पूर्ण ओझे पूर्ण काळ लागत होते असे मानून.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A 3 m wire stretches by 1.5 mm under a load. A 5 m wire of the same material and cross-section carries the same load. By how much does it stretch, in mm?",
        hi: "3 m का तार भार के नीचे 1.5 mm खिंचता है। उसी पदार्थ और अनुप्रस्थ काट का 5 m तार वही भार ढोता है। वह mm में कितना खिंचता है?",
        mr: "3 m ची तार ओझ्याखाली 1.5 mm ताणली जाते. त्याच पदार्थाची आणि आडव्या छेदाची 5 m ची तार तेच ओझे वाहते. ती mm मध्ये किती ताणली जाते?",
      },
      answer: 2.5,
      wrong: [0.9, 3, 7.5],
      checkExpr: "1.5*5/3",
      solution: {
        en: "Extension is proportional to the original length when everything else is fixed, so 1.5 × 5/3 = 2.5 mm. The strain is identical in both wires; only the absolute extension differs, because there is more length for the same fractional stretch to act on. (0.9 inverts the ratio.)",
        hi: "बाक़ी सब तय हो तो विस्तार मूल लंबाई का समानुपाती है, अतः 1.5 × 5/3 = 2.5 mm. दोनों तारों में विकृति समान है; केवल निरपेक्ष विस्तार भिन्न है, क्योंकि उसी भिन्नात्मक खिंचाव के लिए अधिक लंबाई है। (0.9 अनुपात उलट देता है।)",
        mr: "बाकी सर्व ठरलेले असल्यास ताण मूळ लांबीच्या समानुपाती, म्हणून 1.5 × 5/3 = 2.5 mm. दोन्ही तारांत विकृती सारखी; केवळ निरपेक्ष ताण वेगळा, कारण त्याच अपूर्णांकी ताणासाठी अधिक लांबी आहे. (0.9 गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A pressure increase of 20 MPa reduces a solid's volume by a fraction of 0.0001. What is its bulk modulus, in GPa?",
        hi: "20 MPa की दाब-वृद्धि किसी ठोस का आयतन 0.0001 अंश से घटाती है। उसका आयतन मापांक GPa में क्या है?",
        mr: "20 MPa ची दाबवाढ एका घनपदार्थाचे घनफळ 0.0001 अंशाने घटवते. त्याचा घनफळ मापांक GPa मध्ये किती?",
      },
      answer: 200,
      wrong: [20, 2, 2000],
      checkExpr: "20/0.0001/1000",
      solution: {
        en: "B = pressure divided by the fractional volume change = 20/0.0001 = 200,000 MPa = 200 GPa. The very large value is why solids and liquids are treated as incompressible in most problems: even 20 MPa, some two hundred atmospheres, moves the volume by only one part in ten thousand. (20 forgets to divide by the strain at all.)",
        hi: "B = दाब बटा भिन्नात्मक आयतन-परिवर्तन = 20/0.0001 = 200,000 MPa = 200 GPa. यह बहुत बड़ा मान ही वह कारण है जिससे अधिकांश प्रश्नों में ठोस और द्रव असंपीड्य माने जाते हैं: 20 MPa भी, जो लगभग दो सौ वायुमंडल है, आयतन को दस हज़ार में केवल एक भाग हिलाता है। (20 विकृति से भाग देना ही भूल जाता है।)",
        mr: "B = दाब भागिले अपूर्णांकी घनफळ-बदल = 20/0.0001 = 200,000 MPa = 200 GPa. हे फार मोठे मूल्य हेच ते कारण ज्यामुळे बहुतांश प्रश्नांत घन आणि द्रव असंपीड्य मानले जातात: 20 MPa सुद्धा, जे सुमारे दोनशे वातावरणे, घनफळ दहा हजारांत केवळ एक भाग हलवते. (20 विकृतीने भागायचेच विसरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A material has a Poisson's ratio of 0.3. A wire of it is stretched to a longitudinal strain of 0.002. What is the magnitude of the lateral strain?",
        hi: "किसी पदार्थ का प्वासों अनुपात 0.3 है। उसका तार 0.002 अनुदैर्घ्य विकृति तक खींचा जाता है। पार्श्व विकृति का परिमाण क्या है?",
        mr: "एका पदार्थाचे प्वासों गुणोत्तर 0.3 आहे. त्याची तार 0.002 अनुदैर्घ्य विकृतीपर्यंत ताणली जाते. आडव्या विकृतीचे परिमाण किती?",
      },
      answer: 0.0006,
      wrong: [0.006, 0.0002, 0.0067],
      checkExpr: "0.3*0.002",
      solution: {
        en: "Poisson's ratio is lateral strain divided by longitudinal strain, so the lateral strain is 0.3 × 0.002 = 0.0006. The wire narrows as it lengthens, which is why the sign is opposite even though the magnitudes are what is asked for. (0.0067 divides instead of multiplying.)",
        hi: "प्वासों अनुपात पार्श्व विकृति बटा अनुदैर्घ्य विकृति है, अतः पार्श्व विकृति 0.3 × 0.002 = 0.0006. तार लंबा होते हुए पतला होता है, इसीलिए चिह्न विपरीत है यद्यपि पूछा परिमाण गया है। (0.0067 गुणा के बजाय भाग देता है।)",
        mr: "प्वासों गुणोत्तर म्हणजे आडवी विकृती भागिले अनुदैर्घ्य विकृती, म्हणून आडवी विकृती 0.3 × 0.002 = 0.0006. तार लांब होताना बारीक होते, म्हणूनच चिन्ह विरुद्ध जरी विचारले परिमाण असले तरी. (0.0067 गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A steel wire of length 2000 mm and area 1 mm² carries 100 N. Steel's Young's modulus is 200,000 N/mm². By how much does the wire stretch, in mm?",
        hi: "2000 mm लंबाई और 1 mm² क्षेत्रफल का इस्पात का तार 100 N ढोता है। इस्पात का यंग मापांक 200,000 N/mm² है। तार mm में कितना खिंचता है?",
        mr: "2000 mm लांबी आणि 1 mm² क्षेत्रफळाची पोलादी तार 100 N वाहते. पोलादाचा यंग मापांक 200,000 N/mm² आहे. तार mm मध्ये किती ताणली जाते?",
      },
      answer: 1,
      wrong: [2, 0.5, 10],
      checkExpr: "100*2000/(1*200000)",
      solution: {
        en: "ΔL = FL/(AY) = 100 × 2000/(1 × 200,000) = 1 mm. Notice that all four quantities were given in a consistent set of units — newtons, millimetres and N/mm² — so no conversion was needed anywhere, which is the reason engineers work in this system rather than in metres and pascals. (2 forgets to divide by the area, which happens to be 1 and so hides the error's shape.)",
        hi: "ΔL = FL/(AY) = 100 × 2000/(1 × 200,000) = 1 mm. ध्यान दो चारों राशियाँ एक ही संगत मात्रक-समुच्चय में दी गईं — न्यूटन, मिलीमीटर और N/mm² — अतः कहीं कोई रूपांतरण नहीं चाहिए था, और इसीलिए अभियंता मीटर तथा पास्कल के बजाय इसी तंत्र में काम करते हैं। (2 क्षेत्रफल से भाग देना भूलता है, जो संयोग से 1 है और इसलिए भूल का आकार छिपा देता है।)",
        mr: "ΔL = FL/(AY) = 100 × 2000/(1 × 200,000) = 1 mm. लक्षात घ्या चारही राशी एकाच सुसंगत एकक-संचात दिल्या — न्यूटन, मिलीमीटर आणि N/mm² — म्हणून कुठेही कोणतेही रूपांतर लागले नाही, आणि म्हणूनच अभियंते मीटर आणि पास्कलऐवजी याच प्रणालीत काम करतात. (2 क्षेत्रफळाने भागायचे विसरते, जे योगायोगाने 1 आहे आणि म्हणून चुकीचा आकार लपवते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A wire breaks under a load of 500 N. A second wire of the same material and the same length but twice the diameter is tested. What load will break it?",
        hi: "एक तार 500 N के भार पर टूटता है। उसी पदार्थ और उसी लंबाई का पर दुगुने व्यास का दूसरा तार परखा जाता है। वह किस भार पर टूटेगा?",
        mr: "एक तार 500 N च्या ओझ्यावर तुटते. त्याच पदार्थाची आणि त्याच लांबीची पण दुप्पट व्यासाची दुसरी तार तपासली जाते. ती कोणत्या ओझ्यावर तुटेल?",
      },
      answer: 2000,
      wrong: [1000, 250, 500],
      checkExpr: "500*2^2",
      fmt: newtons,
      solution: {
        en: "Breaking is governed by stress, not by load. The wire fails when F/A reaches the material's breaking stress, a number fixed by the steel and nothing else. Doubling the diameter quadruples the area, so four times the load is needed to reach the same stress: 4 × 500 = 2000 N. Two things follow that are worth keeping. First, the LENGTH is irrelevant — a wire of the same material and thickness breaks at the same load whether it is a metre or a kilometre long, which surprises most people and is the clearest evidence that stress and not force is the governing quantity. Second, this is why cable diameters go up so slowly as loads rise: to carry nine times the load a designer needs only three times the diameter. It is also why a chain is only as strong as its weakest link, since the whole load passes through the smallest area anywhere along it. (1000 treats the strength as proportional to the diameter, and 500 assumes thickness makes no difference at all.)",
        hi: "टूटना प्रतिबल से तय होता है, भार से नहीं। तार तब विफल होता है जब F/A पदार्थ के भंजक प्रतिबल तक पहुँचे, जो संख्या इस्पात तय करता है और कुछ नहीं। व्यास दुगुना करने से क्षेत्रफल चौगुना होता है, अतः वही प्रतिबल पाने को चार गुना भार चाहिए: 4 × 500 = 2000 N. दो बातें निकलती हैं जो रखने योग्य हैं। पहली, लंबाई अप्रासंगिक है — उसी पदार्थ और मोटाई का तार उसी भार पर टूटता है चाहे वह एक मीटर लंबा हो या एक किलोमीटर, जो अधिकांश लोगों को चौंकाता है और यही सबसे स्पष्ट प्रमाण है कि शासक राशि बल नहीं प्रतिबल है। दूसरी, इसीलिए भार बढ़ने पर रस्सियों के व्यास इतने धीरे बढ़ते हैं: नौ गुना भार ढोने को अभिकल्पक को केवल तीन गुना व्यास चाहिए। इसी से यह भी कि साँकल उतनी ही मज़बूत है जितनी उसकी सबसे कमज़ोर कड़ी, क्योंकि पूरा भार उसकी लंबाई में कहीं भी सबसे छोटे क्षेत्रफल से होकर गुज़रता है। (1000 सामर्थ्य को व्यास का समानुपाती मानता है, और 500 मान लेता है कि मोटाई से कोई फ़र्क़ ही नहीं पड़ता।)",
        mr: "तुटणे प्रतिबलाने ठरते, ओझ्याने नव्हे. तार तेव्हा अपयशी होते जेव्हा F/A पदार्थाच्या भंजक प्रतिबलापर्यंत पोहोचते, जी संख्या पोलाद ठरवते आणि दुसरे काहीही नाही. व्यास दुप्पट केल्याने क्षेत्रफळ चौपट होते, म्हणून तेच प्रतिबल गाठायला चौपट ओझे लागते: 4 × 500 = 2000 N. दोन गोष्टी निघतात ज्या ठेवण्याजोग्या. पहिली, लांबी असंबद्ध — त्याच पदार्थाची आणि जाडीची तार त्याच ओझ्यावर तुटते मग ती एक मीटर लांब असो वा एक किलोमीटर, जे बहुतांश लोकांना चकित करते आणि हाच सर्वांत स्पष्ट पुरावा की शासक राशी बल नव्हे तर प्रतिबल आहे. दुसरी, म्हणूनच ओझे वाढताना दोऱ्यांचे व्यास इतके सावकाश वाढतात: नऊपट ओझे वाहायला आखणीकाराला केवळ तिप्पट व्यास लागतो. यामुळेच हेही की साखळी तिच्या सर्वांत कमकुवत कडीइतकीच बळकट, कारण अख्खे ओझे तिच्या लांबीत कुठेही असलेल्या सर्वांत लहान क्षेत्रफळातून जाते. (1000 बळ व्यासाच्या समानुपाती मानते, आणि 500 गृहीत धरते की जाडीने काहीच फरक पडत नाही.)",
      },
    },
  ],
  "physics-11-mechanical-properties-of-fluids": [
    {
      level: 1,
      stem: {
        en: "What is the gauge pressure at a depth of 10 m in water, taking the density as 1000 kg/m³ and g as 10 m/s²?",
        hi: "पानी में 10 m गहराई पर गेज दाब क्या है, घनत्व 1000 kg/m³ और g = 10 m/s² लेते हुए?",
        mr: "पाण्यात 10 m खोलीवर गेज दाब किती, घनता 1000 kg/m³ आणि g = 10 m/s² घेतल्यास?",
      },
      answer: 100000,
      wrong: [10000, 1000000, 1000],
      checkExpr: "1000*10*10",
      solution: {
        en: "P = ρgh = 1000 × 10 × 10 = 100,000 Pa, which is very close to one atmosphere — so ten metres of water roughly doubles the total pressure on a diver. The width of the lake never entered the calculation. (10000 drops a factor of ten.)",
        hi: "P = ρgh = 1000 × 10 × 10 = 100,000 Pa, जो लगभग एक वायुमंडल है — अतः दस मीटर पानी गोताखोर पर कुल दाब मोटे तौर पर दोगुना कर देता है। झील की चौड़ाई गणना में कभी आई ही नहीं। (10000 दस का गुणक गिरा देता है।)",
        mr: "P = ρgh = 1000 × 10 × 10 = 100,000 Pa, जे जवळपास एक वातावरण — म्हणून दहा मीटर पाणी गोताखोरावरचा एकूण दाब ढोबळमानाने दुप्पट करते. तलावाची रुंदी गणनेत कधी आलीच नाही. (10000 दहाचा गुणक गाळते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "In a hydraulic press the small piston has an area of 2 cm² and the large one 50 cm². A force of 40 N is applied to the small piston. What force appears at the large one?",
        hi: "किसी द्रवचालित प्रेस में छोटे पिस्टन का क्षेत्रफल 2 cm² और बड़े का 50 cm² है। छोटे पिस्टन पर 40 N का बल लगाया जाता है। बड़े पर कितना बल प्रकट होता है?",
        mr: "एका द्रवचालित प्रेसमध्ये लहान पिस्टनचे क्षेत्रफळ 2 cm² आणि मोठ्याचे 50 cm². लहान पिस्टनवर 40 N बल लावले जाते. मोठ्यावर किती बल प्रकट होते?",
      },
      answer: 1000,
      wrong: [1.6, 100, 2000],
      checkExpr: "40*50/2",
      fmt: newtons,
      solution: {
        en: "The pressure is the same throughout, so F₂ = F₁ × A₂/A₁ = 40 × 50/2 = 1000 N. The large piston moves twenty-five times less far, so no energy has been created. (1.6 inverts the area ratio.)",
        hi: "दाब हर जगह एक-सा है, अतः F₂ = F₁ × A₂/A₁ = 40 × 50/2 = 1000 N. बड़ा पिस्टन पच्चीस गुना कम चलता है, अतः कोई ऊर्जा बनी नहीं। (1.6 क्षेत्रफल-अनुपात उलट देता है।)",
        mr: "दाब सर्वत्र सारखा, म्हणून F₂ = F₁ × A₂/A₁ = 40 × 50/2 = 1000 N. मोठा पिस्टन पंचवीसपट कमी सरकतो, म्हणून कोणतीही ऊर्जा तयार झाली नाही. (1.6 क्षेत्रफळ-गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A body weighs 50 N in air and 30 N when fully immersed in water. What is the upthrust on it?",
        hi: "एक पिंड हवा में 50 N और पानी में पूरी तरह डूबे होने पर 30 N का लगता है। उस पर उत्प्लावन क्या है?",
        mr: "एक पिंड हवेत 50 N आणि पाण्यात पूर्ण बुडवल्यावर 30 N चा भरतो. त्याच्यावरचा उत्प्लावक जोर किती?",
      },
      answer: 20,
      wrong: [80, 15, 1.67],
      checkExpr: "50-30",
      fmt: newtons,
      solution: {
        en: "The apparent loss of weight is the upthrust: 50 − 30 = 20 N. Nothing about the body's shape or material was needed. (80 adds the two readings and 1.67 takes their ratio, neither of which has the units of a force.)",
        hi: "भार की आभासी हानि ही उत्प्लावन है: 50 − 30 = 20 N. पिंड के आकार या पदार्थ के बारे में कुछ नहीं चाहिए था। (80 दोनों पाठ्यांक जोड़ता है और 1.67 उनका अनुपात लेता है, और दोनों के मात्रक बल के नहीं।)",
        mr: "वजनातील आभासी घट म्हणजेच उत्प्लावक जोर: 50 − 30 = 20 N. पिंडाच्या आकाराबद्दल वा पदार्थाबद्दल काहीही लागले नाही. (80 दोन्ही वाचने जोडते आणि 1.67 त्यांचे गुणोत्तर घेते, आणि दोन्हींची एकके बलाची नाहीत.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The upthrust on a fully immersed body is 20 N. Taking water's density as 1000 kg/m³ and g as 10 m/s², what is the body's volume in cubic metres?",
        hi: "पूरी तरह डूबे पिंड पर उत्प्लावन 20 N है। पानी का घनत्व 1000 kg/m³ और g = 10 m/s² लेते हुए, पिंड का आयतन घन मीटर में क्या है?",
        mr: "पूर्ण बुडलेल्या पिंडावरचा उत्प्लावक जोर 20 N आहे. पाण्याची घनता 1000 kg/m³ आणि g = 10 m/s² घेतल्यास, पिंडाचे घनफळ घनमीटरमध्ये किती?",
      },
      answer: 0.002,
      wrong: [0.02, 0.0002, 2],
      checkExpr: "20/(1000*10)",
      solution: {
        en: "The upthrust is ρVg, so V = 20/(1000 × 10) = 0.002 m³, that is two litres. A fully immersed body displaces its own volume whatever it is made of. (0.02 and 0.0002 slip by a factor of ten either way.)",
        hi: "उत्प्लावन ρVg है, अतः V = 20/(1000 × 10) = 0.002 m³, यानी दो लीटर। पूरी तरह डूबा पिंड अपना आयतन हटाता है, वह चाहे किसी का बना हो। (0.02 और 0.0002 दोनों ओर दस के गुणक से खिसकते हैं।)",
        mr: "उत्प्लावक जोर ρVg, म्हणून V = 20/(1000 × 10) = 0.002 m³, म्हणजे दोन लिटर. पूर्ण बुडलेला पिंड स्वतःचे घनफळ सरकवतो, तो कशाचाही बनलेला असो. (0.02 आणि 0.0002 दोन्ही बाजूंनी दहाच्या पटीने सरकतात.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A block floats in water with three quarters of its volume submerged. What is its density in kg/m³, taking water's as 1000?",
        hi: "एक गुटका पानी में अपने आयतन के तीन-चौथाई भाग तक डूबा हुआ तैरता है। पानी का घनत्व 1000 लेते हुए, उसका घनत्व kg/m³ में क्या है?",
        mr: "एक ठोकळा पाण्यात आपल्या घनफळाच्या तीन-चतुर्थांश भागापर्यंत बुडून तरंगतो. पाण्याची घनता 1000 घेतल्यास, त्याची घनता kg/m³ मध्ये किती?",
      },
      answer: 750,
      wrong: [1000, 250, 1333],
      checkExpr: "0.75*1000",
      solution: {
        en: "The submerged fraction equals the ratio of densities, so ρ = 0.75 × 1000 = 750 kg/m³. Turning it round, an iceberg of density 917 floats with 91.7 per cent of itself below the surface. (1333 inverts the ratio, which would make the block sink.)",
        hi: "डूबा अंश घनत्वों के अनुपात के बराबर है, अतः ρ = 0.75 × 1000 = 750 kg/m³. उलट कर देखें तो 917 घनत्व का हिमशैल अपने 91.7 प्रतिशत भाग को सतह के नीचे रखकर तैरता है। (1333 अनुपात उलट देता है, जिससे गुटका डूब जाता।)",
        mr: "बुडलेला अंश घनतांच्या गुणोत्तराइतका, म्हणून ρ = 0.75 × 1000 = 750 kg/m³. उलट पाहिल्यास 917 घनतेचा हिमनग स्वतःचा 91.7 टक्के भाग पृष्ठभागाखाली ठेवून तरंगतो. (1333 गुणोत्तर उलटे करते, ज्याने ठोकळा बुडाला असता.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Water flows at 3 m/s through a pipe of cross-section 6 cm². The pipe narrows to 2 cm². What is the speed there?",
        hi: "पानी 6 cm² अनुप्रस्थ काट की नली में 3 m/s से बहता है। नली सँकरी होकर 2 cm² हो जाती है। वहाँ चाल क्या है?",
        mr: "पाणी 6 cm² आडव्या छेदाच्या नळीतून 3 m/s ने वाहते. नळी अरुंद होऊन 2 cm² होते. तिथे चाल किती?",
      },
      answer: 9,
      wrong: [1, 4.5, 18],
      checkExpr: "3*6/2",
      fmt: ms,
      solution: {
        en: "Continuity requires Av to be the same at both sections, since the water is incompressible and none is lost: v₂ = 3 × 6/2 = 9 m/s. Bernoulli then says the pressure at the narrow section is lower, which is the reverse of what most people expect. (1 inverts the area ratio.)",
        hi: "सांतत्य माँगता है कि दोनों काटों पर Av एक-सा रहे, क्योंकि पानी असंपीड्य है और कुछ खोता नहीं: v₂ = 3 × 6/2 = 9 m/s. फिर बर्नूली कहता है कि सँकरे काट पर दाब कम है, जो अधिकांश लोगों की अपेक्षा के उलटा है। (1 क्षेत्रफल-अनुपात उलट देता है।)",
        mr: "सातत्य मागते की दोन्ही छेदांवर Av सारखे राहावे, कारण पाणी असंपीड्य आणि काही हरवत नाही: v₂ = 3 × 6/2 = 9 m/s. मग बर्नूली सांगतो की अरुंद छेदावर दाब कमी, जे बहुतांश लोकांच्या अपेक्षेच्या उलट. (1 क्षेत्रफळ-गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A soap bubble of radius 0.01 m is blown from a solution of surface tension 0.03 N/m. What is the excess pressure inside it?",
        hi: "0.03 N/m पृष्ठ तनाव वाले घोल से 0.01 m त्रिज्या का साबुन का बुलबुला बनाया जाता है। उसके भीतर अतिरिक्त दाब क्या है?",
        mr: "0.03 N/m पृष्ठताण असलेल्या द्रावणातून 0.01 m त्रिज्येचा साबणाचा बुडबुडा फुगवला जातो. त्याच्या आत जादा दाब किती?",
      },
      answer: 12,
      wrong: [6, 3, 24],
      checkExpr: "4*0.03/0.01",
      solution: {
        en: "A soap bubble has two surfaces, inner and outer, so the excess pressure is 4T/r = 4 × 0.03/0.01 = 12 Pa. A liquid drop, with only one surface, would give 2T/r = 6 Pa. Notice the pressure is larger in a SMALLER bubble, which is why the small one empties into the large when two are connected. (6 uses the drop formula.)",
        hi: "साबुन के बुलबुले की दो सतहें हैं, भीतरी और बाहरी, अतः अतिरिक्त दाब 4T/r = 4 × 0.03/0.01 = 12 Pa. केवल एक सतह वाली द्रव की बूँद 2T/r = 6 Pa देती। ध्यान दो दाब छोटे बुलबुले में बड़ा होता है, इसीलिए दो जोड़ने पर छोटा बड़े में ख़ाली हो जाता है। (6 बूँद वाला सूत्र लगाता है।)",
        mr: "साबणाच्या बुडबुड्याला दोन पृष्ठभाग, आतला आणि बाहेरचा, म्हणून जादा दाब 4T/r = 4 × 0.03/0.01 = 12 Pa. केवळ एक पृष्ठभाग असलेला द्रवाचा थेंब 2T/r = 6 Pa दिला असता. लक्षात घ्या दाब लहान बुडबुड्यात मोठा असतो, म्हणूनच दोन जोडल्यावर लहान मोठ्यात रिकामा होतो. (6 थेंबाचे सूत्र वापरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Water of surface tension 0.07 N/m rises in a capillary of radius 0.0002 m. Taking the density as 1000 kg/m³, g as 10 m/s² and the contact angle as zero, how high does it rise?",
        hi: "0.07 N/m पृष्ठ तनाव वाला पानी 0.0002 m त्रिज्या की केशनली में चढ़ता है। घनत्व 1000 kg/m³, g = 10 m/s² और स्पर्श कोण शून्य लेते हुए, वह कितना ऊपर चढ़ता है?",
        mr: "0.07 N/m पृष्ठताण असलेले पाणी 0.0002 m त्रिज्येच्या केशनळीत चढते. घनता 1000 kg/m³, g = 10 m/s² आणि स्पर्शकोन शून्य घेतल्यास, ते किती उंच चढते?",
      },
      answer: 0.07,
      wrong: [0.035, 0.14, 0.7],
      checkExpr: "2*0.07/(1000*10*0.0002)",
      fmt: metres,
      solution: {
        en: "h = 2T cos θ/(ρgr) = 2 × 0.07/(1000 × 10 × 0.0002) = 0.14/2 = 0.07 m, that is 7 cm. The rise is inversely proportional to the radius, so halving the bore doubles the climb — which is how a wick and a stem of a plant lift water without a pump. (0.035 forgets the factor of 2.)",
        hi: "h = 2T cos θ/(ρgr) = 2 × 0.07/(1000 × 10 × 0.0002) = 0.14/2 = 0.07 m, यानी 7 cm. चढ़ाई त्रिज्या के व्युत्क्रमानुपाती है, अतः छिद्र आधा करने पर चढ़ाई दुगुनी — इसी तरह बत्ती और पौधे का तना बिना पंप के पानी उठाते हैं। (0.035 2 का गुणक भूल जाता है।)",
        mr: "h = 2T cos θ/(ρgr) = 2 × 0.07/(1000 × 10 × 0.0002) = 0.14/2 = 0.07 m, म्हणजे 7 cm. चढण त्रिज्येच्या व्यस्तानुपाती, म्हणून छिद्र निम्मे केल्यास चढण दुप्पट — याच पद्धतीने वात आणि वनस्पतीचे खोड पंपाशिवाय पाणी उचलतात. (0.035 हे 2 चा गुणक विसरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A small drop falls through air at a terminal velocity of 2 mm/s. A second drop of the same liquid has twice the radius. What is its terminal velocity, in mm/s?",
        hi: "एक छोटी बूँद हवा में 2 mm/s के सीमांत वेग से गिरती है। उसी द्रव की दूसरी बूँद की त्रिज्या दुगुनी है। उसका सीमांत वेग mm/s में क्या है?",
        mr: "एक लहान थेंब हवेत 2 mm/s च्या सीमावर्ती वेगाने पडतो. त्याच द्रवाच्या दुसऱ्या थेंबाची त्रिज्या दुप्पट. त्याचा सीमावर्ती वेग mm/s मध्ये किती?",
      },
      answer: 8,
      wrong: [4, 16, 1],
      checkExpr: "2*2^2",
      solution: {
        en: "Terminal velocity goes as the square of the radius: weight grows as r³ while Stokes drag grows only as r times the speed, so v ∝ r². Doubling r gives 2 × 4 = 8 mm/s. (4 assumes it is proportional to the radius, and 16 uses the volume ratio without dividing by the drag's own r.)",
        hi: "सीमांत वेग त्रिज्या के वर्ग के अनुसार चलता है: भार r³ के अनुसार बढ़ता है जबकि स्टोक्स कर्षण केवल r गुणा चाल के अनुसार, अतः v ∝ r². r दुगुना करने पर 2 × 4 = 8 mm/s. (4 उसे त्रिज्या का समानुपाती मानता है, और 16 कर्षण के अपने r से भाग दिए बिना आयतन-अनुपात लगाता है।)",
        mr: "सीमावर्ती वेग त्रिज्येच्या वर्गानुसार जातो: वजन r³ नुसार वाढते तर स्टोक्स ओढ केवळ r गुणिले चाल नुसार, म्हणून v ∝ r². r दुप्पट केल्यास 2 × 4 = 8 mm/s. (4 त्याला त्रिज्येच्या समानुपाती मानते, आणि 16 ओढीच्या स्वतःच्या r ने न भागता घनफळ-गुणोत्तर वापरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Water flows steadily through a narrow tube at 32 units of volume per second. The tube is replaced by one of half the radius and the same length, with the same pressure difference across it. What is the new flow rate, in the same units?",
        hi: "पानी एक पतली नली से 32 इकाई आयतन प्रति सेकंड की दर से स्थायी रूप से बहता है। नली को आधी त्रिज्या और उसी लंबाई की नली से बदल दिया जाता है, उसके आर-पार वही दाबांतर रखते हुए। नई प्रवाह-दर उन्हीं इकाइयों में क्या है?",
        mr: "पाणी एका अरुंद नळीतून दर सेकंदाला 32 एकक घनफळ या दराने स्थिरपणे वाहते. नळी अर्ध्या त्रिज्येच्या आणि त्याच लांबीच्या नळीने बदलली जाते, तिच्या आरपार तोच दाबफरक ठेवून. नवा प्रवाह-दर त्याच एककांत किती?",
      },
      answer: 2,
      wrong: [16, 8, 4],
      checkExpr: "32/2^4",
      solution: {
        en: "For steady viscous flow through a tube the discharge goes as the FOURTH power of the radius, so halving r divides the rate by 2⁴ = 16: 32/16 = 2 units per second. The fourth power comes from two separate effects multiplying: the cross-sectional area falls as r², and the average speed falls as r² again because a narrower tube has a steeper velocity gradient at its wall, where viscosity holds the fluid still. This is why a slightly narrowed artery is so serious — a twenty per cent reduction in radius more than halves the blood flow at the same pressure — and why the body raises the pressure to compensate. It is also why a wide pipe is worth far more than its cost in material: doubling a pipe's radius carries sixteen times the water. (16 uses the area alone, 8 uses r³, and 4 uses r².)",
        hi: "नली से स्थायी श्यान प्रवाह के लिए निस्सरण त्रिज्या की चौथी घात के अनुसार चलता है, अतः r आधा करने पर दर 2⁴ = 16 से भाग हो जाती है: 32/16 = 2 इकाई प्रति सेकंड। चौथी घात दो अलग प्रभावों के गुणा होने से आती है: अनुप्रस्थ काट क्षेत्रफल r² के अनुसार घटता है, और औसत चाल भी फिर r² के अनुसार, क्योंकि सँकरी नली की दीवार पर वेग-प्रवणता अधिक तीखी होती है, जहाँ श्यानता तरल को थामे रखती है। इसीलिए थोड़ी सँकरी हुई धमनी इतनी गंभीर है — त्रिज्या में बीस प्रतिशत की कमी उसी दाब पर रक्त-प्रवाह आधे से भी कम कर देती है — और इसीलिए शरीर भरपाई में दाब बढ़ा देता है। इसी से चौड़ी नली अपनी सामग्री की लागत से कहीं अधिक मूल्यवान है: नली की त्रिज्या दुगुनी करने पर सोलह गुना पानी जाता है। (16 केवल क्षेत्रफल लगाता है, 8 r³ और 4 r².)",
        mr: "नळीतून स्थिर श्यान प्रवाहासाठी विसर्ग त्रिज्येच्या चौथ्या घातेनुसार जातो, म्हणून r निम्मे केल्यास दर 2⁴ = 16 ने भागला जातो: 32/16 = 2 एकक प्रति सेकंद. चौथी घात दोन वेगळ्या परिणामांच्या गुणाकारातून येते: आडव्या छेदाचे क्षेत्रफळ r² नुसार घटते, आणि सरासरी चालही पुन्हा r² नुसार, कारण अरुंद नळीच्या भिंतीवर वेग-प्रवणता अधिक तीव्र असते, जिथे श्यानता प्रवाही स्थिर धरते. म्हणूनच थोडी अरुंद झालेली धमनी इतकी गंभीर — त्रिज्येतील वीस टक्के घट त्याच दाबावर रक्तप्रवाह निम्म्याहूनही कमी करते — आणि म्हणूनच शरीर भरपाईसाठी दाब वाढवते. यामुळेच रुंद नळी तिच्या सामग्रीच्या खर्चाहून कितीतरी अधिक मोलाची: नळीची त्रिज्या दुप्पट केल्यास सोळापट पाणी जाते. (16 फक्त क्षेत्रफळ वापरते, 8 हे r³ आणि 4 हे r².)",
      },
    },
  ],
  "physics-11-thermal-properties-of-matter": [
    {
      level: 1,
      stem: {
        en: "A steel rod 1 m long has a linear expansion coefficient of 12 × 10⁻⁶ per °C. By how many millimetres does it lengthen when heated through 100 °C?",
        hi: "1 m लंबी इस्पात की छड़ का रैखिक प्रसार गुणांक 12 × 10⁻⁶ प्रति °C है। 100 °C गरम करने पर वह कितने मिलीमीटर लंबी होती है?",
        mr: "1 m लांब पोलादी दांडीचा रेषीय प्रसरण गुणांक 12 × 10⁻⁶ प्रति °C आहे. 100 °C ने तापवल्यावर ती किती मिलीमीटर लांब होते?",
      },
      answer: 1.2,
      wrong: [0.12, 12, 120],
      checkExpr: "12*100/1000",
      solution: {
        en: "ΔL = αLΔT = 12 × 10⁻⁶ × 1 × 100 = 0.0012 m = 1.2 mm. A tenth of a millimetre per ten degrees sounds negligible until a kilometre of railway line is considered, where the same fraction gives more than a metre. (12 and 120 slip decimal places.)",
        hi: "ΔL = αLΔT = 12 × 10⁻⁶ × 1 × 100 = 0.0012 m = 1.2 mm. दस डिग्री पर मिलीमीटर का दसवाँ हिस्सा नगण्य लगता है जब तक एक किलोमीटर रेल-पटरी न सोची जाए, जहाँ वही अंश एक मीटर से अधिक देता है। (12 और 120 में दशमलव स्थान खिसकते हैं।)",
        mr: "ΔL = αLΔT = 12 × 10⁻⁶ × 1 × 100 = 0.0012 m = 1.2 mm. दहा अंशांना मिलीमीटरचा दशांश नगण्य वाटतो जोवर एक किलोमीटर रेल्वेरूळ विचारात घेतला जात नाही, जिथे तोच अंश एक मीटरहून अधिक देतो. (12 आणि 120 मध्ये दशांश स्थाने सरकतात.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "How much heat is needed to raise 2 kg of water by 10 °C, taking the specific heat capacity as 4200 J/kg/K?",
        hi: "2 kg पानी को 10 °C बढ़ाने के लिए कितनी ऊष्मा चाहिए, विशिष्ट ऊष्मा धारिता 4200 J/kg/K लेते हुए?",
        mr: "2 kg पाणी 10 °C ने वाढवायला किती उष्णता लागते, विशिष्ट उष्णता धारकता 4200 J/kg/K घेतल्यास?",
      },
      answer: 84000,
      wrong: [8400, 420, 840000],
      checkExpr: "2*4200*10",
      solution: {
        en: "Q = mcΔT = 2 × 4200 × 10 = 84,000 J. The same heat would raise 2 kg of iron, whose specific heat is about 450, by roughly ninety degrees instead. (420 divides where it should multiply.)",
        hi: "Q = mcΔT = 2 × 4200 × 10 = 84,000 J. वही ऊष्मा 2 kg लोहे को, जिसकी विशिष्ट ऊष्मा लगभग 450 है, इसके बजाय मोटे तौर पर नब्बे डिग्री बढ़ा देती। (420 वहाँ भाग देता है जहाँ गुणा करना था।)",
        mr: "Q = mcΔT = 2 × 4200 × 10 = 84,000 J. तीच उष्णता 2 kg लोखंडाला, ज्याची विशिष्ट उष्णता सुमारे 450, त्याऐवजी ढोबळमानाने नव्वद अंशांनी वाढवली असती. (420 जिथे गुणायचे तिथे भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "How much heat is needed to melt 0.5 kg of ice already at 0 °C, taking the latent heat of fusion as 336,000 J/kg?",
        hi: "0 °C पर पहले से मौजूद 0.5 kg बर्फ़ पिघलाने के लिए कितनी ऊष्मा चाहिए, गलन की गुप्त ऊष्मा 336,000 J/kg लेते हुए?",
        mr: "0 °C वर आधीच असलेला 0.5 kg बर्फ वितळवायला किती उष्णता लागते, द्रवीभवनाची सुप्त उष्णता 336,000 J/kg घेतल्यास?",
      },
      answer: 168000,
      wrong: [672000, 336000, 16800],
      checkExpr: "0.5*336000",
      solution: {
        en: "Q = mL = 0.5 × 336,000 = 168,000 J, and the thermometer stays at 0 °C throughout. No temperature term appears, because there is no temperature change to multiply. (672000 divides by 0.5 instead of multiplying.)",
        hi: "Q = mL = 0.5 × 336,000 = 168,000 J, और तापमापी पूरे समय 0 °C पर रहता है। कोई ताप-पद नहीं आता, क्योंकि गुणा करने को कोई ताप-परिवर्तन है ही नहीं। (672000 गुणा के बजाय 0.5 से भाग देता है।)",
        mr: "Q = mL = 0.5 × 336,000 = 168,000 J, आणि तापमापक पूर्ण काळ 0 °C वर राहतो. कोणतेही तापमान-पद येत नाही, कारण गुणायला तापमान-बदलच नाही. (672000 गुणण्याऐवजी 0.5 ने भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A metal plate's area increases by 0.04 per cent when heated. What is the corresponding percentage increase in its length?",
        hi: "गरम करने पर धातु की प्लेट का क्षेत्रफल 0.04 प्रतिशत बढ़ता है। उसकी लंबाई में तदनुरूप प्रतिशत वृद्धि क्या है?",
        mr: "तापवल्यावर धातूच्या पत्र्याचे क्षेत्रफळ 0.04 टक्क्यांनी वाढते. त्याच्या लांबीतील तदनुरूप शेकडा वाढ किती?",
      },
      answer: 0.02,
      wrong: [0.08, 0.01, 0.12],
      checkExpr: "0.04/2",
      solution: {
        en: "Area expands in two dimensions at once, so the areal coefficient is very nearly twice the linear one: 0.04/2 = 0.02 per cent. Volume would grow by three times the linear figure, 0.06 per cent. (0.08 doubles instead of halving.)",
        hi: "क्षेत्रफल एक साथ दो विमाओं में फैलता है, अतः क्षेत्रीय गुणांक रैखिक का लगभग दुगुना है: 0.04/2 = 0.02 प्रतिशत। आयतन रैखिक आँकड़े के तीन गुने से बढ़ता, 0.06 प्रतिशत। (0.08 आधा करने के बजाय दुगुना कर देता है।)",
        mr: "क्षेत्रफळ एकाच वेळी दोन मितींत प्रसरण पावते, म्हणून क्षेत्रीय गुणांक रेषीयाच्या जवळपास दुप्पट: 0.04/2 = 0.02 टक्के. घनफळ रेषीय आकड्याच्या तिप्पट वाढले असते, 0.06 टक्के. (0.08 निम्मे करण्याऐवजी दुप्पट करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Two kilograms of water at 90 °C are mixed with three kilograms at 40 °C in an insulated vessel. What is the final temperature in °C?",
        hi: "ऊष्मारोधी पात्र में 90 °C का दो किलोग्राम पानी 40 °C के तीन किलोग्राम के साथ मिलाया जाता है। अंतिम ताप °C में क्या है?",
        mr: "उष्णतारोधक भांड्यात 90 °C चे दोन किलोग्रॅम पाणी 40 °C च्या तीन किलोग्रॅमसह मिसळले जाते. शेवटचे तापमान °C मध्ये किती?",
      },
      answer: 60,
      wrong: [65, 50, 130],
      checkExpr: "(2*90+3*40)/(2+3)",
      solution: {
        en: "Heat lost equals heat gained, and the specific heat is the same on both sides so it cancels: T = (2 × 90 + 3 × 40)/5 = 300/5 = 60 °C. The answer leans towards the larger mass. (65 is the plain average of the two temperatures, which would be right only for equal masses.)",
        hi: "खोई ऊष्मा पाई ऊष्मा के बराबर है, और दोनों ओर विशिष्ट ऊष्मा एक-सी है अतः वह कट जाती है: T = (2 × 90 + 3 × 40)/5 = 300/5 = 60 °C. उत्तर बड़े द्रव्यमान की ओर झुकता है। (65 दोनों तापों का सादा औसत है, जो केवल बराबर द्रव्यमानों के लिए सही होता।)",
        mr: "गमावलेली उष्णता मिळवलेल्या उष्णतेइतकी, आणि दोन्ही बाजूंची विशिष्ट उष्णता सारखी म्हणून ती कापली जाते: T = (2 × 90 + 3 × 40)/5 = 300/5 = 60 °C. उत्तर मोठ्या वस्तुमानाकडे झुकते. (65 ही दोन्ही तापमानांची साधी सरासरी, जी केवळ समान वस्तुमानांसाठी बरोबर ठरली असती.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Heat flows through a slab of area 2 m² and thickness 0.04 m whose conductivity is 0.08 W/m/K, with a 20 K difference across it. What is the rate of heat flow, in watts?",
        hi: "2 m² क्षेत्रफल और 0.04 m मोटाई की उस पट्टी से ऊष्मा बहती है जिसकी चालकता 0.08 W/m/K है, और उसके आर-पार 20 K का अंतर है। ऊष्मा-प्रवाह की दर वाट में क्या है?",
        mr: "2 m² क्षेत्रफळ आणि 0.04 m जाडीच्या ज्या पट्टीची वाहकता 0.08 W/m/K आहे तिच्यातून उष्णता वाहते, आणि तिच्या आरपार 20 K चा फरक आहे. उष्णता-प्रवाहाचा दर वॉटमध्ये किती?",
      },
      answer: 80,
      wrong: [8, 800, 0.8],
      checkExpr: "0.08*2*20/0.04",
      solution: {
        en: "The rate is kAΔT/L = 0.08 × 2 × 20/0.04 = 3.2/0.04 = 80 W. Doubling the thickness would halve this, which is the whole argument for insulation, and the thickness enters in the denominator precisely because a longer path means a gentler temperature gradient. (8 and 800 slip a factor of ten.)",
        hi: "दर kAΔT/L = 0.08 × 2 × 20/0.04 = 3.2/0.04 = 80 W. मोटाई दुगुनी करने पर यह आधी हो जाती, और यही रोधन का पूरा तर्क है, तथा मोटाई हर में ठीक इसलिए आती है कि लंबा रास्ता कम तीखी ताप-प्रवणता देता है। (8 और 800 दस के गुणक से खिसकते हैं।)",
        mr: "दर kAΔT/L = 0.08 × 2 × 20/0.04 = 3.2/0.04 = 80 W. जाडी दुप्पट केल्यास हे निम्मे झाले असते, आणि हाच अख्खा उष्णतारोधनाचा युक्तिवाद, तसेच जाडी छेदात नेमकी यासाठी येते की लांब मार्ग कमी तीव्र तापमान-प्रवणता देतो. (8 आणि 800 दहाच्या पटीने सरकतात.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A body cools from 60 °C to 50 °C in 10 minutes in surroundings at 20 °C. Using Newton's law of cooling with average excess temperatures, how long does it take to cool from 50 °C to 40 °C, in minutes?",
        hi: "20 °C के परिवेश में कोई पिंड 10 मिनट में 60 °C से 50 °C तक ठंडा होता है। औसत अधिकता-तापों के साथ न्यूटन का शीतलन नियम लगाते हुए, 50 °C से 40 °C तक ठंडा होने में उसे कितने मिनट लगते हैं?",
        mr: "20 °C च्या परिसरात एक पिंड 10 मिनिटांत 60 °C पासून 50 °C पर्यंत थंड होतो. सरासरी अधिक्य-तापमानांसह न्यूटनचा शीतलन नियम वापरून, 50 °C पासून 40 °C पर्यंत थंड व्हायला त्याला किती मिनिटे लागतात?",
      },
      answer: 14,
      wrong: [10, 20, 7],
      checkExpr: "10*35/25",
      solution: {
        en: "In the first stage the mean temperature is 55 °C, an excess of 35 over the surroundings. In the second it is 45 °C, an excess of 25. The rate is proportional to the excess and the same ten degrees must be shed, so the time scales inversely: t = 10 × 35/25 = 14 minutes. Cooling always slows as the gap closes, and the body would take infinitely long to reach 20 °C exactly. (10 assumes equal intervals take equal times, which is the belief this question exists to break.)",
        hi: "पहले चरण में माध्य ताप 55 °C है, परिवेश से 35 की अधिकता। दूसरे में 45 °C, यानी 25 की अधिकता। दर अधिकता के समानुपाती है और वही दस डिग्री छोड़नी हैं, अतः समय व्युत्क्रमानुपाती चलता है: t = 10 × 35/25 = 14 मिनट। अंतर घटते-घटते शीतलन सदा धीमा होता है, और पिंड को ठीक 20 °C पहुँचने में अनंत समय लगता। (10 मानता है कि बराबर अंतराल बराबर समय लेते हैं, और यही वह धारणा है जिसे तोड़ने के लिए यह प्रश्न है।)",
        mr: "पहिल्या टप्प्यात मध्य तापमान 55 °C, परिसराहून 35 चे अधिक्य. दुसऱ्यात 45 °C, म्हणजे 25 चे अधिक्य. दर अधिक्याच्या समानुपाती आणि तेच दहा अंश सोडायचे आहेत, म्हणून काळ व्यस्तानुपाती चालतो: t = 10 × 35/25 = 14 मिनिटे. फरक घटत जाताना शीतलन नेहमी मंदावते, आणि पिंडाला नेमके 20 °C गाठायला अनंत काळ लागला असता. (10 गृहीत धरते की समान अंतराल समान काळ घेतात, आणि हीच ती समजूत जी मोडण्यासाठी हा प्रश्न आहे.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A steel tape reads correctly at 20 °C. It is used at 40 °C to measure a distance the tape reports as 100.00 m. Taking α as 12 × 10⁻⁶ per °C, by how many millimetres is the reading short of the true distance?",
        hi: "इस्पात का फ़ीता 20 °C पर सही पढ़ता है। उसे 40 °C पर ऐसी दूरी नापने में लगाया जाता है जिसे फ़ीता 100.00 m बताता है। α = 12 × 10⁻⁶ प्रति °C लेते हुए, पाठ्यांक सच्ची दूरी से कितने मिलीमीटर कम है?",
        mr: "पोलादी फीत 20 °C वर बरोबर वाचते. ती 40 °C वर अशा अंतरासाठी वापरली जाते जे फीत 100.00 m सांगते. α = 12 × 10⁻⁶ प्रति °C घेतल्यास, वाचन खऱ्या अंतराहून किती मिलीमीटरने कमी आहे?",
      },
      answer: 24,
      wrong: [12, 2.4, 240],
      checkExpr: "100*12*20/1000",
      solution: {
        en: "Each of the tape's marked metres has itself stretched by αΔT = 12 × 10⁻⁶ × 20 = 2.4 × 10⁻⁴, so a 'metre' on the warm tape is really 1.00024 m. Over a hundred of them the true distance exceeds the reading by 100 × 2.4 × 10⁻⁴ m = 0.024 m = 24 mm. Note the direction: a tape that has expanded reads SHORT, because fewer of its stretched divisions fit into the same real distance. (12 forgets the factor of two in ΔT = 20.)",
        hi: "फ़ीते का हर अंकित मीटर स्वयं αΔT = 12 × 10⁻⁶ × 20 = 2.4 × 10⁻⁴ से खिंच चुका है, अतः गरम फ़ीते का एक 'मीटर' वस्तुतः 1.00024 m है। सौ ऐसे मीटरों पर सच्ची दूरी पाठ्यांक से 100 × 2.4 × 10⁻⁴ m = 0.024 m = 24 mm अधिक है। दिशा पर ध्यान दो: जो फ़ीता फैल चुका है वह कम पढ़ता है, क्योंकि उसके खिंचे विभाजन उसी असली दूरी में कम समाते हैं। (12 ΔT = 20 में दो का गुणक भूल जाता है।)",
        mr: "फितीचा प्रत्येक अंकित मीटर स्वतः αΔT = 12 × 10⁻⁶ × 20 = 2.4 × 10⁻⁴ ने ताणला गेला आहे, म्हणून गरम फितीचा एक 'मीटर' प्रत्यक्षात 1.00024 m आहे. शंभर अशा मीटरांवर खरे अंतर वाचनाहून 100 × 2.4 × 10⁻⁴ m = 0.024 m = 24 mm ने अधिक. दिशेकडे लक्ष द्या: जी फीत प्रसरण पावली आहे ती कमी वाचते, कारण तिचे ताणलेले विभाग त्याच खऱ्या अंतरात कमी बसतात. (12 हे ΔT = 20 मधला दोनचा गुणक विसरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A body radiates 100 W at an absolute temperature of 300 K. What power does it radiate at 600 K, in watts?",
        hi: "300 K परम ताप पर कोई पिंड 100 W विकिरित करता है। 600 K पर वह कितनी शक्ति विकिरित करता है, वाट में?",
        mr: "300 K निरपेक्ष तापमानावर एक पिंड 100 W प्रारित करतो. 600 K वर तो किती शक्ती प्रारित करतो, वॉटमध्ये?",
      },
      answer: 1600,
      wrong: [200, 400, 800],
      checkExpr: "100*2^4",
      solution: {
        en: "Radiated power goes as the fourth power of the ABSOLUTE temperature, so doubling 300 K to 600 K multiplies the output by 2⁴ = 16: 100 × 16 = 1600 W. The fourth power is why a filament at 2500 K glows brightly while the same wire at 500 K only feels warm, and why the calculation must be done in kelvin — doubling 27 °C to 54 °C is nothing like doubling the absolute temperature. (200 assumes proportionality and 400 uses the square.)",
        hi: "विकिरित शक्ति परम ताप की चौथी घात के अनुसार चलती है, अतः 300 K को दोगुना कर 600 K करने पर निर्गत 2⁴ = 16 गुना हो जाता है: 100 × 16 = 1600 W. चौथी घात ही वह कारण है जिससे 2500 K पर तंतु चमकता है जबकि वही तार 500 K पर केवल गरम लगता है, और जिससे गणना केल्विन में करनी पड़ती है — 27 °C को दोगुना कर 54 °C करना परम ताप दोगुना करने जैसा बिलकुल नहीं। (200 समानुपात मानता है और 400 वर्ग लगाता है।)",
        mr: "प्रारित शक्ती निरपेक्ष तापमानाच्या चौथ्या घातेनुसार जाते, म्हणून 300 K दुप्पट करून 600 K केल्यास निर्गत 2⁴ = 16 पट होते: 100 × 16 = 1600 W. चौथी घात हेच ते कारण ज्यामुळे 2500 K वरचा तंतू चमकतो तर तीच तार 500 K वर केवळ उबदार वाटते, आणि ज्यामुळे गणना केल्विनमध्ये करावी लागते — 27 °C दुप्पट करून 54 °C करणे निरपेक्ष तापमान दुप्पट करण्यासारखे मुळीच नाही. (200 समानुपात मानते आणि 400 वर्ग वापरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "The same quantity of heat that raises 1 kg of water by exactly one degree is given instead to 1 kg of dry sand, whose specific heat is 800 J/kg/K. By how many degrees does the sand's temperature rise? Take water's specific heat as 4200 J/kg/K.",
        hi: "जो ऊष्मा 1 kg पानी को ठीक एक डिग्री बढ़ाती है वही इसके बजाय 1 kg सूखी रेत को दी जाती है, जिसकी विशिष्ट ऊष्मा 800 J/kg/K है। रेत का ताप कितनी डिग्री चढ़ता है? पानी की विशिष्ट ऊष्मा 4200 J/kg/K लो।",
        mr: "जी उष्णता 1 kg पाणी नेमक्या एका अंशाने वाढवते तीच त्याऐवजी 1 kg कोरड्या वाळूला दिली जाते, जिची विशिष्ट उष्णता 800 J/kg/K आहे. वाळूचे तापमान किती अंशांनी चढते? पाण्याची विशिष्ट उष्णता 4200 J/kg/K घ्या.",
      },
      answer: 5.25,
      wrong: [0.19, 3360, 4200],
      checkExpr: "4200/800",
      solution: {
        en: "The heat supplied is 1 × 4200 × 1 = 4200 J. Given to sand, it produces ΔT = Q/(mc) = 4200/800 = 5.25 °C. So the same sunlight that warms the sea by one degree warms the beach by more than five, and this single ratio explains a great deal of geography. It is why the sand burns bare feet on an afternoon when the sea is pleasant, and why the two swap places after dark: the sand, having stored little energy per degree, sheds its heat and cools far below the water by dawn. The daily land–sea breeze follows directly — air rises over the hot land by day and is replaced by air from the sea, and the flow reverses at night. On a larger scale the same property gives coastal climates their small annual range and continental interiors their extremes, and it is why a hot-water bottle beats a hot brick of the same mass: the water carries about five times the heat for every degree it will give up. (0.19 inverts the ratio, and 3360 multiplies where it should divide.)",
        hi: "दी गई ऊष्मा 1 × 4200 × 1 = 4200 J है। रेत को दिए जाने पर वह ΔT = Q/(mc) = 4200/800 = 5.25 °C देती है। अतः वही धूप जो समुद्र को एक डिग्री गरम करती है समुद्रतट को पाँच से अधिक, और यह अकेला अनुपात बहुत सारा भूगोल समझा देता है। इसी से उस दोपहर रेत नंगे पैर जलाती है जब समुद्र सुखद है, और इसी से अँधेरा होते ही दोनों जगह बदल लेते हैं: रेत, जिसने प्रति डिग्री कम ऊर्जा जमा की थी, अपनी ऊष्मा छोड़ देती है और भोर तक पानी से कहीं नीचे ठंडी हो जाती है। दैनिक थल-समुद्र समीर सीधे निकलती है — दिन में गरम थल के ऊपर हवा उठती है और उसकी जगह समुद्र से हवा आती है, और रात में प्रवाह उलट जाता है। बड़े पैमाने पर वही गुण तटीय जलवायु को छोटा वार्षिक परास और महाद्वीपों के भीतरी भागों को चरम देता है, और इसी से उसी द्रव्यमान की गरम ईंट को गरम पानी की थैली हरा देती है: पानी हर उस डिग्री के लिए लगभग पाँच गुना ऊष्मा ढोता है जो वह छोड़ेगा। (0.19 अनुपात उलट देता है, और 3360 वहाँ गुणा करता है जहाँ भाग देना था।)",
        mr: "दिलेली उष्णता 1 × 4200 × 1 = 4200 J. वाळूला दिल्यावर ती ΔT = Q/(mc) = 4200/800 = 5.25 °C देते. म्हणून तेच ऊन जे समुद्राला एक अंशाने तापवते ते किनाऱ्याला पाचहून अधिक, आणि हे एकमेव गुणोत्तर बराच भूगोल समजावते. यामुळेच त्या दुपारी वाळू अनवाणी पाय भाजते जेव्हा समुद्र सुखद असतो, आणि यामुळेच अंधार पडताच दोघे जागा बदलतात: वाळू, जिने प्रति अंश कमी ऊर्जा साठवली होती, आपली उष्णता सोडून देते आणि पहाटेपर्यंत पाण्याहून कितीतरी खाली थंड होते. दैनंदिन भूमी-समुद्र वारा थेट निघतो — दिवसा तापलेल्या भूमीवरून हवा वर उठते आणि तिची जागा समुद्राकडून येणारी हवा घेते, आणि रात्री प्रवाह उलटतो. मोठ्या प्रमाणावर तोच गुणधर्म किनारी हवामानाला लहान वार्षिक पल्ला आणि खंडांच्या अंतर्भागांना टोकाची स्थिती देतो, आणि यामुळेच त्याच वस्तुमानाच्या गरम विटेला गरम पाण्याची पिशवी हरवते: पाणी ते सोडणार असलेल्या प्रत्येक अंशासाठी सुमारे पाचपट उष्णता वाहते. (0.19 गुणोत्तर उलटे करते, आणि 3360 जिथे भागायचे तिथे गुणते.)",
      },
    },
  ],
  "physics-11-thermodynamics": [
    {
      level: 1,
      stem: {
        en: "A gas expands at a constant pressure of 200,000 Pa, its volume increasing by 0.001 m³. How much work does it do?",
        hi: "एक गैस 200,000 Pa के अचर दाब पर फैलती है और उसका आयतन 0.001 m³ बढ़ता है। वह कितना कार्य करती है?",
        mr: "एक वायू 200,000 Pa च्या अचल दाबावर प्रसरण पावतो आणि त्याचे घनफळ 0.001 m³ ने वाढते. तो किती कार्य करतो?",
      },
      answer: 200,
      wrong: [2, 20, 2000],
      checkExpr: "200000*0.001",
      solution: {
        en: "At constant pressure W = PΔV = 200,000 × 0.001 = 200 J. This is the area of a rectangle on the PV diagram; for a varying pressure the area under the curve would have to be found instead. (2 and 2000 slip decimal places.)",
        hi: "अचर दाब पर W = PΔV = 200,000 × 0.001 = 200 J. यह PV आरेख पर एक आयत का क्षेत्रफल है; बदलते दाब के लिए इसके बजाय वक्र के नीचे का क्षेत्रफल निकालना पड़ता। (2 और 2000 में दशमलव स्थान खिसकते हैं।)",
        mr: "अचल दाबावर W = PΔV = 200,000 × 0.001 = 200 J. हे PV आकृतीवरील आयताचे क्षेत्रफळ; बदलत्या दाबासाठी त्याऐवजी वक्राखालचे क्षेत्रफळ काढावे लागले असते. (2 आणि 2000 मध्ये दशांश स्थाने सरकतात.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A Carnot engine works between a source at 600 K and a sink at 300 K. What is its efficiency, as a percentage?",
        hi: "एक कार्नो इंजन 600 K के स्रोत और 300 K के अवशोषक के बीच चलता है। उसकी दक्षता प्रतिशत में क्या है?",
        mr: "एक कार्नो इंजिन 600 K च्या स्रोत आणि 300 K च्या शोषकादरम्यान चालते. त्याची कार्यक्षमता शेकड्यात किती?",
      },
      answer: 50,
      wrong: [100, 200, 25],
      checkExpr: "100*(1-300/600)",
      solution: {
        en: "η = 1 − T_cold/T_hot = 1 − 300/600 = 0.5, that is 50 per cent. Half the heat taken in must be rejected to the sink, whatever the engine is made of. (200 is the temperature ratio quoted as a percentage without subtracting from one.)",
        hi: "η = 1 − T_ठंडा/T_गरम = 1 − 300/600 = 0.5, यानी 50 प्रतिशत। ली गई ऊष्मा का आधा अवशोषक को लौटाना ही पड़ता है, इंजन चाहे किसी का बना हो। (200 ताप-अनुपात को एक से घटाए बिना प्रतिशत में बता देता है।)",
        mr: "η = 1 − T_थंड/T_गरम = 1 − 300/600 = 0.5, म्हणजे 50 टक्के. घेतलेल्या उष्णतेचा निम्मा भाग शोषकाला परत करावाच लागतो, इंजिन कशाचेही बनलेले असो. (200 तापमान-गुणोत्तर एकातून वजा न करता शेकड्यात सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "500 J of heat is added to a gas, which does 200 J of work on its surroundings. By how much does its internal energy change?",
        hi: "किसी गैस को 500 J ऊष्मा दी जाती है, और वह परिवेश पर 200 J कार्य करती है। उसकी आंतरिक ऊर्जा कितनी बदलती है?",
        mr: "एका वायूला 500 J उष्णता दिली जाते, आणि तो परिसरावर 200 J कार्य करतो. त्याची आंतरिक ऊर्जा किती बदलते?",
      },
      answer: 300,
      wrong: [700, 200, 500],
      checkExpr: "500-200",
      solution: {
        en: "The first law gives ΔU = Q − W = 500 − 200 = 300 J. The gas kept 300 J and spent 200 J pushing the piston out. (700 adds the work instead of subtracting it, which would be right only if the surroundings did work ON the gas.)",
        hi: "पहला नियम देता है ΔU = Q − W = 500 − 200 = 300 J. गैस ने 300 J रखे और 200 J पिस्टन बाहर धकेलने में ख़र्च किए। (700 कार्य घटाने के बजाय जोड़ देता है, जो केवल तब सही होता जब परिवेश गैस पर कार्य करता।)",
        mr: "पहिला नियम देतो ΔU = Q − W = 500 − 200 = 300 J. वायूने 300 J ठेवले आणि 200 J पिस्टन बाहेर ढकलण्यात खर्च केले. (700 कार्य वजा करण्याऐवजी जोडते, जे केवळ तेव्हा बरोबर ठरले असते जेव्हा परिसराने वायूवर कार्य केले असते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Two moles of a monatomic ideal gas are warmed through 10 K. Taking R as 8.3 J/mol/K and ΔU = (3/2)nRΔT, by how much does the internal energy rise, in joules?",
        hi: "एकपरमाणुक आदर्श गैस के दो मोल 10 K गरम किए जाते हैं। R = 8.3 J/mol/K और ΔU = (3/2)nRΔT लेते हुए, आंतरिक ऊर्जा कितने जूल बढ़ती है?",
        mr: "एकअणुक आदर्श वायूचे दोन मोल 10 K ने तापवले जातात. R = 8.3 J/mol/K आणि ΔU = (3/2)nRΔT घेतल्यास, आंतरिक ऊर्जा किती ज्यूलने वाढते?",
      },
      answer: 249,
      wrong: [166, 498, 124.5],
      checkExpr: "1.5*2*8.3*10",
      solution: {
        en: "ΔU = 1.5 × 2 × 8.3 × 10 = 249 J. The three-halves comes from the three translational degrees of freedom a single atom has; a diatomic gas, with two rotations as well, would give five-halves and 415 J for the same warming. (166 uses the factor 1 instead of 1.5.)",
        hi: "ΔU = 1.5 × 2 × 8.3 × 10 = 249 J. तीन-बटा-दो एकल परमाणु की तीन स्थानांतरण स्वातंत्र्य-कोटियों से आता है; द्विपरमाणुक गैस, जिसमें दो घूर्णन भी हैं, उसी तापन के लिए पाँच-बटा-दो और 415 J देती। (166 1.5 के बजाय 1 का गुणक लगाता है।)",
        mr: "ΔU = 1.5 × 2 × 8.3 × 10 = 249 J. तीन-द्वितीयांश एकाच अणूच्या तीन स्थानांतरणी स्वातंत्र्यकोटींतून येते; द्विअणुक वायू, ज्यात दोन परिवलनेही, त्याच तापवण्यासाठी पाच-द्वितीयांश आणि 415 J दिले असते. (166 हे 1.5 ऐवजी 1 चा गुणक वापरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A heat engine absorbs 1000 J from its source and rejects 700 J to its sink in each cycle. What is its efficiency, as a percentage?",
        hi: "एक ऊष्मा-इंजन हर चक्र में अपने स्रोत से 1000 J सोखता है और अवशोषक को 700 J लौटाता है। उसकी दक्षता प्रतिशत में क्या है?",
        mr: "एक उष्णता-इंजिन प्रत्येक चक्रात आपल्या स्रोतातून 1000 J शोषते आणि शोषकाला 700 J परत करते. त्याची कार्यक्षमता शेकड्यात किती?",
      },
      answer: 30,
      wrong: [70, 300, 143],
      checkExpr: "100*(1000-700)/1000",
      solution: {
        en: "Over a cycle ΔU is zero, so the work done is 1000 − 700 = 300 J and the efficiency is 300/1000 = 30 per cent. (70 quotes the fraction rejected rather than the fraction used, which is the commonest slip here.)",
        hi: "चक्र में ΔU शून्य है, अतः किया गया कार्य 1000 − 700 = 300 J और दक्षता 300/1000 = 30 प्रतिशत। (70 प्रयुक्त अंश के बजाय लौटाया गया अंश बता देता है, जो यहाँ की सबसे आम चूक है।)",
        mr: "चक्रात ΔU शून्य, म्हणून केलेले कार्य 1000 − 700 = 300 J आणि कार्यक्षमता 300/1000 = 30 टक्के. (70 वापरलेल्या अंशाऐवजी परत केलेला अंश सांगते, जी इथली सर्वांत नेहमीची चूक.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "An inventor claims 60 per cent efficiency for an engine running between 400 K and 300 K. What is the greatest efficiency actually possible, as a percentage?",
        hi: "एक आविष्कारक 400 K और 300 K के बीच चलते इंजन के लिए 60 प्रतिशत दक्षता का दावा करता है। वस्तुतः संभव सबसे बड़ी दक्षता प्रतिशत में क्या है?",
        mr: "एक संशोधक 400 K आणि 300 K दरम्यान चालणाऱ्या इंजिनासाठी 60 टक्के कार्यक्षमतेचा दावा करतो. प्रत्यक्षात शक्य असलेली सर्वांत मोठी कार्यक्षमता शेकड्यात किती?",
      },
      answer: 25,
      wrong: [75, 60, 33.333333],
      checkExpr: "100*(1-300/400)",
      solution: {
        en: "The Carnot ceiling is 1 − 300/400 = 0.25, that is 25 per cent, so the claim of 60 is impossible however the engine is built. Note that the first law is not violated by the claim — energy would still balance — which is exactly why the second law is needed as a separate statement. (75 is the temperature ratio itself.)",
        hi: "कार्नो छत 1 − 300/400 = 0.25 है, यानी 25 प्रतिशत, अतः 60 का दावा असंभव है, इंजन चाहे कैसे भी बना हो। ध्यान दो दावे से पहले नियम का उल्लंघन नहीं होता — ऊर्जा फिर भी मिल जाती — और ठीक इसीलिए दूसरा नियम अलग कथन के रूप में चाहिए। (75 स्वयं ताप-अनुपात है।)",
        mr: "कार्नो छत 1 − 300/400 = 0.25, म्हणजे 25 टक्के, म्हणून 60 चा दावा अशक्य, इंजिन कसेही बनलेले असो. लक्षात घ्या दाव्याने पहिल्या नियमाचे उल्लंघन होत नाही — ऊर्जा तरीही जुळली असती — आणि नेमके म्हणूनच दुसरा नियम वेगळे विधान म्हणून लागतो. (75 हे स्वतः तापमान-गुणोत्तर.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A refrigerator removes 300 J of heat from its contents for every 100 J of electrical work supplied. What is its coefficient of performance?",
        hi: "एक रेफ़्रिजरेटर हर 100 J विद्युत् कार्य पर अपनी सामग्री से 300 J ऊष्मा हटाता है। उसका निष्पादन गुणांक क्या है?",
        mr: "एक फ्रिज प्रत्येक 100 J विद्युत कार्यामागे आपल्या सामग्रीतून 300 J उष्णता काढतो. त्याचा कार्यमान गुणांक किती?",
      },
      answer: 3,
      wrong: [0.33, 4, 400],
      checkExpr: "300/100",
      solution: {
        en: "COP = heat removed divided by work supplied = 300/100 = 3. Note that 400 J is dumped into the kitchen — the 300 taken from the food plus the 100 of work — so an open fridge door heats a room rather than cooling it. (4 is the coefficient of a heat PUMP, which counts the heat delivered rather than the heat removed, and is the near-miss worth understanding.)",
        hi: "COP = हटाई गई ऊष्मा बटा दिया गया कार्य = 300/100 = 3. ध्यान दो रसोई में 400 J उड़ेले जाते हैं — भोजन से लिए 300 जोड़ कार्य के 100 — अतः खुला फ़्रिज दरवाज़ा कमरा ठंडा करने के बजाय गरम करता है। (4 ऊष्मा-पंप का गुणांक है, जो हटाई गई नहीं बल्कि पहुँचाई गई ऊष्मा गिनता है, और वही समझने योग्य निकट-चूक है।)",
        mr: "COP = काढलेली उष्णता भागिले दिलेले कार्य = 300/100 = 3. लक्षात घ्या स्वयंपाकघरात 400 J ओतले जातात — अन्नातून घेतलेले 300 अधिक कार्याचे 100 — म्हणून उघडा फ्रिजचा दरवाजा खोली थंड करण्याऐवजी तापवतो. (4 हा उष्णता-पंपाचा गुणांक, जो काढलेली नव्हे तर पोहोचवलेली उष्णता मोजतो, आणि तीच समजून घेण्याजोगी जवळची चूक.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "For a monatomic ideal gas the ratio of specific heats γ equals 1 + 2/f, where f is the number of degrees of freedom. Taking f as 3, what is γ?",
        hi: "एकपरमाणुक आदर्श गैस के लिए विशिष्ट ऊष्माओं का अनुपात γ = 1 + 2/f है, जहाँ f स्वातंत्र्य-कोटियों की संख्या है। f = 3 लेते हुए, γ क्या है?",
        mr: "एकअणुक आदर्श वायूसाठी विशिष्ट उष्णतांचे गुणोत्तर γ = 1 + 2/f, जिथे f ही स्वातंत्र्यकोटींची संख्या. f = 3 घेतल्यास, γ किती?",
      },
      answer: 1.666667,
      wrong: [1.4, 1.333333, 2],
      checkExpr: "1+2/3",
      solution: {
        en: "γ = 1 + 2/3 = 1.666667. A rigid diatomic gas has f = 5 and so γ = 1.4, which is why air behaves with that value in sound-wave and adiabatic calculations. The larger γ is, the steeper the adiabatic curve on a PV diagram. (1.4 is the diatomic answer.)",
        hi: "γ = 1 + 2/3 = 1.666667. दृढ़ द्विपरमाणुक गैस के लिए f = 5 और अतः γ = 1.4, इसीलिए ध्वनि-तरंग तथा रुद्धोष्म गणनाओं में हवा उसी मान से व्यवहार करती है। γ जितना बड़ा, PV आरेख पर रुद्धोष्म वक्र उतना ढालू। (1.4 द्विपरमाणुक उत्तर है।)",
        mr: "γ = 1 + 2/3 = 1.666667. दृढ द्विअणुक वायूसाठी f = 5 आणि म्हणून γ = 1.4, म्हणूनच ध्वनिलहरी आणि रुद्धोष्म गणनांत हवा त्याच मूल्याने वागते. γ जितका मोठा, PV आकृतीवर रुद्धोष्म वक्र तितका तीव्र. (1.4 हे द्विअणुक उत्तर.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A Carnot engine between 600 K and 300 K absorbs 1200 J from the source in each cycle. How much work does it deliver?",
        hi: "600 K और 300 K के बीच का कार्नो इंजन हर चक्र में स्रोत से 1200 J सोखता है। वह कितना कार्य देता है?",
        mr: "600 K आणि 300 K दरम्यानचे कार्नो इंजिन प्रत्येक चक्रात स्रोतातून 1200 J शोषते. ते किती कार्य देते?",
      },
      answer: 600,
      wrong: [1200, 300, 900],
      checkExpr: "1200*(1-300/600)",
      solution: {
        en: "The efficiency is 1 − 300/600 = 0.5, so W = 0.5 × 1200 = 600 J, and the other 600 J must be rejected to the 300 K sink. That rejection is not waste from bad design: without it the working substance could not be returned to its starting state, and the engine could not run in a cycle at all. (1200 assumes complete conversion, which is exactly what the second law forbids.)",
        hi: "दक्षता 1 − 300/600 = 0.5 है, अतः W = 0.5 × 1200 = 600 J, और बाक़ी 600 J 300 K अवशोषक को लौटाने ही पड़ते हैं। वह लौटाना बुरे अभिकल्प का कचरा नहीं: उसके बिना कार्यकारी पदार्थ आरंभिक अवस्था में लौटाया नहीं जा सकता, और इंजन चक्र में चल ही नहीं सकता। (1200 पूर्ण रूपांतरण मान लेता है, और ठीक यही दूसरा नियम मना करता है।)",
        mr: "कार्यक्षमता 1 − 300/600 = 0.5, म्हणून W = 0.5 × 1200 = 600 J, आणि उरलेले 600 J 300 K च्या शोषकाला परत करावेच लागतात. ते परत करणे वाईट रचनेचा कचरा नव्हे: त्याशिवाय कार्यकारी पदार्थ सुरुवातीच्या अवस्थेत परत आणता येणार नाही, आणि इंजिन चक्रात चालूच शकणार नाही. (1200 पूर्ण रूपांतर गृहीत धरते, आणि नेमके तेच दुसरा नियम मनाई करतो.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "1000 J of heat flows directly from a reservoir at 400 K to one at 300 K. What is the net change in entropy of the two reservoirs together, in J/K?",
        hi: "1000 J ऊष्मा 400 K के भंडार से सीधे 300 K के भंडार में बहती है। दोनों भंडारों की मिलाकर एन्ट्रॉपी में शुद्ध परिवर्तन J/K में क्या है?",
        mr: "1000 J उष्णता 400 K च्या साठ्यातून थेट 300 K च्या साठ्यात वाहते. दोन्ही साठ्यांचा मिळून एन्ट्रॉपीतील निव्वळ बदल J/K मध्ये किती?",
      },
      answer: 0.833333,
      wrong: [0.5, 2.5, 3.333333],
      checkExpr: "1000/300-1000/400",
      solution: {
        en: "The hot reservoir loses entropy 1000/400 = 2.5 J/K and the cold one gains 1000/300 = 3.333333 J/K, so the net change is 3.333333 − 2.5 = 0.833333 J/K. The total has increased, and that increase is what marks the process as irreversible. Two things are worth extracting. First, the same 1000 J carries more entropy at a lower temperature, because entropy transferred is Q/T — heat delivered to a cold body disturbs it proportionally more. Second, this is the second law in its sharpest form: a spontaneous process never decreases the total entropy, and a process that would decrease it — heat flowing the other way — simply does not happen. Had a Carnot engine been placed between the two reservoirs instead, it would have extracted 1 − 300/400 = 25 per cent of the 1000 J as useful work and delivered only 750 J to the cold side, giving 750/300 − 1000/400 = 0 exactly: a reversible process leaves the total entropy unchanged, and the 250 J of work is precisely the opportunity thrown away by letting the heat leak directly. (0.5 subtracts the wrong way round, and 3.333333 and 2.5 are the two separate terms rather than their difference.)",
        hi: "गरम भंडार 1000/400 = 2.5 J/K एन्ट्रॉपी खोता है और ठंडा 1000/300 = 3.333333 J/K पाता है, अतः शुद्ध परिवर्तन 3.333333 − 2.5 = 0.833333 J/K है। कुल बढ़ा है, और यही वृद्धि प्रक्रिया को अनुत्क्रमणीय ठहराती है। दो बातें निकालने योग्य हैं। पहली, वही 1000 J नीचे ताप पर अधिक एन्ट्रॉपी ढोते हैं, क्योंकि संचरित एन्ट्रॉपी Q/T है — ठंडे पिंड को पहुँचाई ऊष्मा उसे समानुपाती रूप से अधिक विचलित करती है। दूसरी, यह दूसरा नियम अपने सबसे तीखे रूप में है: स्वतःस्फूर्त प्रक्रिया कुल एन्ट्रॉपी कभी नहीं घटाती, और जो प्रक्रिया उसे घटाती — उलटी दिशा में बहती ऊष्मा — वह बस होती ही नहीं। यदि दोनों भंडारों के बीच कार्नो इंजन रखा होता, तो वह 1000 J का 1 − 300/400 = 25 प्रतिशत उपयोगी कार्य के रूप में निकाल लेता और ठंडी ओर केवल 750 J पहुँचाता, जिससे 750/300 − 1000/400 = ठीक 0 मिलता: उत्क्रमणीय प्रक्रिया कुल एन्ट्रॉपी अपरिवर्तित छोड़ती है, और 250 J कार्य ठीक वही अवसर है जो ऊष्मा को सीधे रिसने देकर फेंक दिया गया। (0.5 उलटा घटाता है, और 3.333333 तथा 2.5 उनके अंतर के बजाय दो अलग पद हैं।)",
        mr: "गरम साठा 1000/400 = 2.5 J/K एन्ट्रॉपी गमावतो आणि थंड 1000/300 = 3.333333 J/K मिळवतो, म्हणून निव्वळ बदल 3.333333 − 2.5 = 0.833333 J/K. एकूण वाढला आहे, आणि हीच वाढ प्रक्रियेला न उलटवण्याजोगी ठरवते. दोन गोष्टी काढण्याजोग्या. पहिली, तेच 1000 J कमी तापमानावर अधिक एन्ट्रॉपी वाहतात, कारण संक्रमित एन्ट्रॉपी Q/T आहे — थंड पिंडाला पोहोचवलेली उष्णता त्याला प्रमाणशीरपणे अधिक ढवळते. दुसरी, हा दुसरा नियम त्याच्या सर्वांत तीक्ष्ण रूपात: स्वयंस्फूर्त प्रक्रिया एकूण एन्ट्रॉपी कधीही घटवत नाही, आणि जी प्रक्रिया ती घटवेल — उलट दिशेने वाहणारी उष्णता — ती फक्त घडतच नाही. दोन्ही साठ्यांदरम्यान कार्नो इंजिन ठेवले असते, तर त्याने 1000 J चा 1 − 300/400 = 25 टक्के उपयुक्त कार्य म्हणून काढला असता आणि थंड बाजूला केवळ 750 J पोहोचवले असते, ज्यातून 750/300 − 1000/400 = नेमके 0 मिळाले असते: उलटवण्याजोगी प्रक्रिया एकूण एन्ट्रॉपी अपरिवर्तित ठेवते, आणि 250 J कार्य म्हणजे नेमकी तीच संधी जी उष्णतेला थेट गळू देऊन फेकून दिली. (0.5 उलटे वजा करते, आणि 3.333333 व 2.5 ही त्यांच्या फरकाऐवजी दोन वेगळी पदे.)",
      },
    },
  ],
  "physics-11-kinetic-theory": [
    {
      level: 1,
      stem: {
        en: "A gas is heated from 300 K to 600 K. By what factor does the average translational kinetic energy of a molecule increase?",
        hi: "एक गैस 300 K से 600 K तक गरम की जाती है। अणु की औसत स्थानांतरण गतिज ऊर्जा कितने गुना बढ़ती है?",
        mr: "एक वायू 300 K पासून 600 K पर्यंत तापवला जातो. रेणूची सरासरी स्थानांतरणी गतिज ऊर्जा किती पटीने वाढते?",
      },
      answer: 2,
      wrong: [4, 1.414214, 300],
      checkExpr: "600/300",
      solution: {
        en: "The average translational kinetic energy is (3/2)kT, directly proportional to the ABSOLUTE temperature, so doubling 300 K to 600 K doubles it: a factor of 2. The speed, by contrast, rises only by √2. (4 squares the ratio and 1.414214 is the speed factor rather than the energy factor.)",
        hi: "औसत स्थानांतरण गतिज ऊर्जा (3/2)kT है, जो परम ताप के सीधे समानुपाती है, अतः 300 K को दोगुना कर 600 K करने पर वह दोगुनी होती है: 2 का गुणक। इसके विपरीत चाल केवल √2 गुना बढ़ती है। (4 अनुपात का वर्ग करता है और 1.414214 ऊर्जा के बजाय चाल का गुणक है।)",
        mr: "सरासरी स्थानांतरणी गतिज ऊर्जा (3/2)kT, जी निरपेक्ष तापमानाच्या थेट समानुपाती, म्हणून 300 K दुप्पट करून 600 K केल्यास ती दुप्पट होते: 2 चा गुणक. याउलट चाल केवळ √2 पटीने वाढते. (4 गुणोत्तराचा वर्ग करते आणि 1.414214 हा ऊर्जेऐवजी चालीचा गुणक.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A gas has a root-mean-square molecular speed of 500 m/s at 300 K. What is it at 1200 K?",
        hi: "किसी गैस के अणुओं की वर्ग-माध्य-मूल चाल 300 K पर 500 m/s है। 1200 K पर वह क्या है?",
        mr: "एका वायूच्या रेणूंची वर्ग-मध्य-मूळ चाल 300 K वर 500 m/s आहे. 1200 K वर ती किती?",
      },
      answer: 1000,
      wrong: [2000, 250, 707.106781],
      checkExpr: "500*(1200/300)^0.5",
      fmt: ms,
      solution: {
        en: "The rms speed goes as the square root of the absolute temperature, so quadrupling T doubles the speed: 500 × √4 = 1000 m/s. (2000 assumes direct proportionality to T, forgetting that it is the ENERGY that is proportional and the speed only its square root.)",
        hi: "वर्ग-माध्य-मूल चाल परम ताप के वर्गमूल के अनुसार चलती है, अतः T चौगुना करने पर चाल दोगुनी होती है: 500 × √4 = 1000 m/s. (2000 T के सीधे समानुपात मान लेता है, यह भूलकर कि समानुपाती ऊर्जा है और चाल केवल उसका वर्गमूल।)",
        mr: "वर्ग-मध्य-मूळ चाल निरपेक्ष तापमानाच्या वर्गमुळानुसार जाते, म्हणून T चौपट केल्यास चाल दुप्पट होते: 500 × √4 = 1000 m/s. (2000 हे T च्या थेट समानुपाती मानते, हे विसरून की समानुपाती ऊर्जा आहे आणि चाल केवळ तिचे वर्गमूळ.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "At the same temperature, how many times faster are hydrogen molecules (molar mass 2) than oxygen molecules (molar mass 32)?",
        hi: "एक ही ताप पर हाइड्रोजन के अणु (मोलर द्रव्यमान 2) ऑक्सीजन के अणुओं (मोलर द्रव्यमान 32) से कितने गुना तेज़ हैं?",
        mr: "एकाच तापमानावर हायड्रोजनचे रेणू (मोलर वस्तुमान 2) ऑक्सिजनच्या रेणूंहून (मोलर वस्तुमान 32) किती पट वेगवान आहेत?",
      },
      answer: 4,
      wrong: [16, 2, 8],
      checkExpr: "(32/2)^0.5",
      solution: {
        en: "Equal temperature means equal average kinetic energy, so ½mv² is the same for both and v ∝ 1/√m: the ratio is √(32/2) = √16 = 4. (16 is the mass ratio itself, and forgetting to take its square root is the standard slip here.)",
        hi: "बराबर ताप का अर्थ बराबर औसत गतिज ऊर्जा, अतः ½mv² दोनों के लिए एक-सा है और v ∝ 1/√m: अनुपात √(32/2) = √16 = 4. (16 स्वयं द्रव्यमान-अनुपात है, और उसका वर्गमूल लेना भूलना यहाँ की मानक चूक है।)",
        mr: "समान तापमान म्हणजे समान सरासरी गतिज ऊर्जा, म्हणून ½mv² दोघांसाठी सारखे आणि v ∝ 1/√m: गुणोत्तर √(32/2) = √16 = 4. (16 हे स्वतः वस्तुमान-गुणोत्तर, आणि त्याचे वर्गमूळ घ्यायचे विसरणे ही इथली प्रमाणित चूक.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A gas of density 1.2 kg/m³ has a root-mean-square molecular speed of 500 m/s. Using P = ⅓ρv², what is its pressure in pascals?",
        hi: "1.2 kg/m³ घनत्व की गैस के अणुओं की वर्ग-माध्य-मूल चाल 500 m/s है। P = ⅓ρv² लगाते हुए, उसका दाब पास्कल में क्या है?",
        mr: "1.2 kg/m³ घनतेच्या वायूच्या रेणूंची वर्ग-मध्य-मूळ चाल 500 m/s आहे. P = ⅓ρv² वापरून, त्याचा दाब पास्कलमध्ये किती?",
      },
      answer: 100000,
      wrong: [300000, 33333.333333, 200000],
      checkExpr: "1.2*500^2/3",
      solution: {
        en: "P = ⅓ × 1.2 × 250,000 = 100,000 Pa, which is about one atmosphere — as it should be for air at room temperature. The one third is there because only a third of the mean square speed belongs to motion along any one axis. (300000 drops that third.)",
        hi: "P = ⅓ × 1.2 × 250,000 = 100,000 Pa, जो लगभग एक वायुमंडल है — कमरे के ताप की हवा के लिए वैसा ही होना चाहिए। एक-तिहाई इसलिए है कि माध्य वर्ग चाल का केवल एक तिहाई किसी एक अक्ष के अनुदिश गति का है। (300000 वह तिहाई गिरा देता है।)",
        mr: "P = ⅓ × 1.2 × 250,000 = 100,000 Pa, जे सुमारे एक वातावरण — खोलीच्या तापमानाच्या हवेसाठी तसेच असावे. एक-तृतीयांश यासाठी की मध्य वर्ग चालीचा केवळ एक तृतीयांश कोणत्याही एका अक्षाच्या दिशेच्या गतीचा. (300000 तो तृतीयांश गाळते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "For a rigid diatomic gas with five degrees of freedom, γ = 1 + 2/f. What is its value of γ?",
        hi: "पाँच स्वातंत्र्य-कोटियों वाली दृढ़ द्विपरमाणुक गैस के लिए γ = 1 + 2/f. उसका γ क्या है?",
        mr: "पाच स्वातंत्र्यकोटी असलेल्या दृढ द्विअणुक वायूसाठी γ = 1 + 2/f. त्याचा γ किती?",
      },
      answer: 1.4,
      wrong: [1.666667, 1.333333, 2.4],
      checkExpr: "1+2/5",
      solution: {
        en: "γ = 1 + 2/5 = 1.4. Air is mostly diatomic nitrogen and oxygen, which is why 1.4 is the value used in every adiabatic and sound-speed calculation for air. (1.666667 is the monatomic answer, for helium or argon.)",
        hi: "γ = 1 + 2/5 = 1.4. हवा अधिकतर द्विपरमाणुक नाइट्रोजन और ऑक्सीजन है, इसीलिए हवा की हर रुद्धोष्म तथा ध्वनि-चाल गणना में 1.4 का मान लगता है। (1.666667 एकपरमाणुक उत्तर है, हीलियम या आर्गन के लिए।)",
        mr: "γ = 1 + 2/5 = 1.4. हवा मुख्यतः द्विअणुक नायट्रोजन आणि ऑक्सिजन, म्हणूनच हवेच्या प्रत्येक रुद्धोष्म आणि ध्वनि-चाल गणनेत 1.4 हे मूल्य वापरले जाते. (1.666667 हे एकअणुक उत्तर, हेलियम वा आर्गॉनसाठी.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "The molar specific heat of a monatomic ideal gas at constant volume is (3/2)R. Taking R as 8.3 J/mol/K, what is its value?",
        hi: "एकपरमाणुक आदर्श गैस की अचर आयतन पर मोलर विशिष्ट ऊष्मा (3/2)R है। R = 8.3 J/mol/K लेते हुए, उसका मान क्या है?",
        mr: "एकअणुक आदर्श वायूची अचल घनफळावरील मोलर विशिष्ट उष्णता (3/2)R आहे. R = 8.3 J/mol/K घेतल्यास, तिचे मूल्य किती?",
      },
      answer: 12.45,
      wrong: [8.3, 20.75, 24.9],
      checkExpr: "1.5*8.3",
      solution: {
        en: "Cv = 1.5 × 8.3 = 12.45 J/mol/K. At constant pressure the gas must also do work as it expands, so Cp is larger by exactly R: 12.45 + 8.3 = 20.75. (20.75 is that constant-pressure value, offered here as the near-miss it always is.)",
        hi: "Cv = 1.5 × 8.3 = 12.45 J/mol/K. अचर दाब पर गैस को फैलते हुए कार्य भी करना पड़ता है, अतः Cp ठीक R जितना बड़ा है: 12.45 + 8.3 = 20.75. (20.75 वही अचर-दाब मान है, यहाँ उसी निकट-चूक के रूप में रखा गया जो वह सदा रहता है।)",
        mr: "Cv = 1.5 × 8.3 = 12.45 J/mol/K. अचल दाबावर वायूला प्रसरण पावताना कार्यही करावे लागते, म्हणून Cp नेमके R ने मोठे: 12.45 + 8.3 = 20.75. (20.75 हेच ते अचल-दाब मूल्य, इथे तीच जवळची चूक म्हणून ठेवलेले जी ते नेहमी असते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "The mean free path of a molecule in a gas is 60 nm. The pressure is doubled at constant temperature. What is the new mean free path, in nm?",
        hi: "किसी गैस में अणु का माध्य मुक्त पथ 60 nm है। अचर ताप पर दाब दोगुना कर दिया जाता है। नया माध्य मुक्त पथ nm में क्या है?",
        mr: "एका वायूत रेणूचा मध्य मुक्त मार्ग 60 nm आहे. अचल तापमानावर दाब दुप्पट केला जातो. नवा मध्य मुक्त मार्ग nm मध्ये किती?",
      },
      answer: 30,
      wrong: [120, 15, 240],
      checkExpr: "60/2",
      solution: {
        en: "The mean free path is inversely proportional to the number of molecules per unit volume, and at constant temperature that number is proportional to the pressure, so doubling P halves the path: 60/2 = 30 nm. Note that the molecular speed is unchanged, since the temperature is unchanged — only the crowding has altered. (120 inverts the relation.)",
        hi: "माध्य मुक्त पथ प्रति एकांक आयतन अणुओं की संख्या के व्युत्क्रमानुपाती है, और अचर ताप पर वह संख्या दाब की समानुपाती है, अतः P दोगुना करने पर पथ आधा हो जाता है: 60/2 = 30 nm. ध्यान दो अणु की चाल नहीं बदली, क्योंकि ताप नहीं बदला — बदली केवल भीड़। (120 संबंध उलट देता है।)",
        mr: "मध्य मुक्त मार्ग प्रति एकक घनफळ रेणूंच्या संख्येच्या व्यस्तानुपाती, आणि अचल तापमानावर ती संख्या दाबाच्या समानुपाती, म्हणून P दुप्पट केल्यास मार्ग निम्मा होतो: 60/2 = 30 nm. लक्षात घ्या रेणूची चाल बदललेली नाही, कारण तापमान बदललेले नाही — बदलली केवळ गर्दी. (120 संबंध उलटे करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "One mole of gas occupies 22.4 litres at standard temperature and pressure. How many moles occupy 44.8 litres under the same conditions?",
        hi: "मानक ताप और दाब पर एक मोल गैस 22.4 लीटर घेरती है। उन्हीं परिस्थितियों में 44.8 लीटर कितने मोल घेरते हैं?",
        mr: "प्रमाणित तापमान आणि दाबावर एक मोल वायू 22.4 लिटर व्यापतो. त्याच परिस्थितीत 44.8 लिटर किती मोल व्यापतात?",
      },
      answer: 2,
      wrong: [1, 4, 22.4],
      checkExpr: "44.8/22.4",
      solution: {
        en: "Volume is proportional to the number of moles at fixed temperature and pressure, so 44.8/22.4 = 2 moles. Notice the molar volume does not depend on which gas it is — Avogadro's law — because pressure comes from momentum transfer per molecule, and at equal temperature every gas delivers the same average amount. (22.4 quotes the molar volume as though it were a number of moles.)",
        hi: "नियत ताप और दाब पर आयतन मोलों की संख्या का समानुपाती है, अतः 44.8/22.4 = 2 मोल। ध्यान दो मोलर आयतन इस पर निर्भर नहीं कि गैस कौन-सी है — आवोगाद्रो का नियम — क्योंकि दाब प्रति अणु संवेग-संचरण से आता है, और बराबर ताप पर हर गैस वही औसत मात्रा देती है। (22.4 मोलर आयतन को ऐसे बता देता है मानो वह मोलों की संख्या हो।)",
        mr: "ठरलेल्या तापमान आणि दाबावर घनफळ मोलांच्या संख्येच्या समानुपाती, म्हणून 44.8/22.4 = 2 मोल. लक्षात घ्या मोलर घनफळ वायू कोणता आहे यावर अवलंबून नाही — आवोगाद्रोचा नियम — कारण दाब प्रति रेणू संवेग-संक्रमणातून येतो, आणि समान तापमानावर प्रत्येक वायू तेच सरासरी प्रमाण देतो. (22.4 मोलर घनफळ असे सांगते जणू ती मोलांची संख्या असावी.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A rigid diatomic gas has Cv = 20.75 J/mol/K. Taking R as 8.3 J/mol/K, what is its molar specific heat at constant pressure?",
        hi: "दृढ़ द्विपरमाणुक गैस का Cv = 20.75 J/mol/K है। R = 8.3 J/mol/K लेते हुए, अचर दाब पर उसकी मोलर विशिष्ट ऊष्मा क्या है?",
        mr: "दृढ द्विअणुक वायूचा Cv = 20.75 J/mol/K आहे. R = 8.3 J/mol/K घेतल्यास, अचल दाबावर त्याची मोलर विशिष्ट उष्णता किती?",
      },
      answer: 29.05,
      wrong: [12.45, 41.5, 172.225],
      checkExpr: "20.75+8.3",
      solution: {
        en: "Cp − Cv = R for any ideal gas, so Cp = 20.75 + 8.3 = 29.05 J/mol/K. The difference is exactly R because at constant pressure the gas must additionally do work PΔV = RΔT per mole as it expands, and that work has to be paid for out of the extra heat supplied. Note the relation holds for every ideal gas whatever its atomicity — only Cv itself depends on the degrees of freedom. (41.5 doubles Cv and 172.225 multiplies instead of adding.)",
        hi: "किसी भी आदर्श गैस के लिए Cp − Cv = R, अतः Cp = 20.75 + 8.3 = 29.05 J/mol/K. अंतर ठीक R इसलिए है कि अचर दाब पर गैस को फैलते हुए प्रति मोल अतिरिक्त कार्य PΔV = RΔT करना पड़ता है, और उस कार्य की क़ीमत दी गई अतिरिक्त ऊष्मा से चुकानी पड़ती है। ध्यान दो यह संबंध हर आदर्श गैस पर चलता है, उसकी परमाणुकता चाहे जो हो — केवल Cv स्वयं स्वातंत्र्य-कोटियों पर निर्भर है। (41.5 Cv को दोगुना करता है और 172.225 जोड़ने के बजाय गुणा करता है।)",
        mr: "कोणत्याही आदर्श वायूसाठी Cp − Cv = R, म्हणून Cp = 20.75 + 8.3 = 29.05 J/mol/K. फरक नेमका R यासाठी की अचल दाबावर वायूला प्रसरण पावताना प्रति मोल जादा कार्य PΔV = RΔT करावे लागते, आणि त्या कार्याची किंमत दिलेल्या जादा उष्णतेतून द्यावी लागते. लक्षात घ्या हा संबंध प्रत्येक आदर्श वायूवर चालतो, त्याची अणुकता काहीही असो — केवळ Cv स्वतः स्वातंत्र्यकोटींवर अवलंबून. (41.5 हे Cv दुप्पट करते आणि 172.225 जोडण्याऐवजी गुणते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A diatomic gas is hot enough for its vibrational mode to be active, giving seven degrees of freedom in all. Taking R as 8.3 J/mol/K, what is the internal energy of one mole at 300 K, in joules?",
        hi: "एक द्विपरमाणुक गैस इतनी गरम है कि उसका कंपन-प्रकार सक्रिय हो जाए, जिससे कुल सात स्वातंत्र्य-कोटियाँ बनती हैं। R = 8.3 J/mol/K लेते हुए, 300 K पर एक मोल की आंतरिक ऊर्जा जूल में क्या है?",
        mr: "एक द्विअणुक वायू इतका गरम आहे की त्याचा कंपन-प्रकार सक्रिय होईल, ज्यातून एकूण सात स्वातंत्र्यकोटी बनतात. R = 8.3 J/mol/K घेतल्यास, 300 K वर एका मोलची आंतरिक ऊर्जा ज्यूलमध्ये किती?",
      },
      answer: 8715,
      wrong: [6225, 3735, 12450],
      checkExpr: "3.5*8.3*300",
      solution: {
        en: "Equipartition gives each degree of freedom ½RT per mole, so with f = 7 the internal energy is (7/2)RT = 3.5 × 8.3 × 300 = 8715 J. Two things are worth drawing out. First, a vibrating bond counts as TWO degrees of freedom rather than one, because it stores energy both as kinetic energy of the oscillation and as potential energy in the stretched bond, and equipartition assigns ½RT to each quadratic term. That is why a diatomic molecule goes from five to seven and not from five to six. Second, and more importantly, the vibrational mode does not switch on gradually — it is essentially absent at room temperature and appears only above some hundreds or thousands of kelvin depending on the molecule. Classical physics has no explanation whatever for this. Equipartition, taken at face value, predicts that every mode should always be active, which would give the wrong specific heat for almost every real gas at every ordinary temperature. The resolution came only with quantum mechanics: vibrational energy comes in discrete lumps, and if kT is much smaller than one lump the mode simply cannot be excited and contributes nothing. The measured specific heat of hydrogen, which climbs in steps as it is warmed over hundreds of degrees, was one of the earliest and clearest experimental signposts that classical mechanics was incomplete. (6225 uses f = 5, 3735 uses f = 3, and 12450 uses f = 10.)",
        hi: "समविभाजन हर स्वातंत्र्य-कोटि को प्रति मोल ½RT देती है, अतः f = 7 पर आंतरिक ऊर्जा (7/2)RT = 3.5 × 8.3 × 300 = 8715 J. दो बातें निकालने योग्य हैं। पहली, कंपन करता बंधन एक नहीं बल्कि दो स्वातंत्र्य-कोटियाँ गिना जाता है, क्योंकि वह ऊर्जा दोलन की गतिज ऊर्जा के रूप में भी जमा करता है और खिंचे बंधन की स्थितिज ऊर्जा के रूप में भी, और समविभाजन हर द्विघात पद को ½RT देती है। इसीलिए द्विपरमाणुक अणु पाँच से सात जाता है, पाँच से छह नहीं। दूसरी, और अधिक महत्वपूर्ण, कंपन-प्रकार धीरे-धीरे चालू नहीं होता — कमरे के ताप पर वह मूलतः अनुपस्थित है और अणु के अनुसार कुछ सौ या हज़ार केल्विन के ऊपर ही प्रकट होता है। चिरसम्मत भौतिकी के पास इसकी कोई व्याख्या नहीं। समविभाजन, ज्यों का त्यों लिया जाए, भविष्यवाणी करती है कि हर प्रकार सदा सक्रिय रहेगा, जो लगभग हर असली गैस के लिए हर साधारण ताप पर ग़लत विशिष्ट ऊष्मा देगा। समाधान केवल क्वांटम यांत्रिकी के साथ आया: कंपन-ऊर्जा अलग-अलग गुल्लों में आती है, और यदि kT एक गुल्ले से बहुत छोटा हो तो प्रकार उत्तेजित हो ही नहीं सकता और कुछ योगदान नहीं देता। हाइड्रोजन की नापी गई विशिष्ट ऊष्मा, जो सैकड़ों डिग्री गरम करने पर सीढ़ियों में चढ़ती है, इस बात के आरंभिक और स्पष्टतम प्रायोगिक संकेतों में से एक थी कि चिरसम्मत यांत्रिकी अधूरी है। (6225 f = 5 लगाता है, 3735 f = 3, और 12450 f = 10.)",
        mr: "समविभाजन प्रत्येक स्वातंत्र्यकोटीला प्रति मोल ½RT देते, म्हणून f = 7 वर आंतरिक ऊर्जा (7/2)RT = 3.5 × 8.3 × 300 = 8715 J. दोन गोष्टी काढण्याजोग्या. पहिली, कंपन करणारा बंध एक नव्हे तर दोन स्वातंत्र्यकोटी मोजला जातो, कारण तो ऊर्जा दोलनाच्या गतिज ऊर्जेच्या रूपातही साठवतो आणि ताणलेल्या बंधाच्या स्थितिज ऊर्जेच्या रूपातही, आणि समविभाजन प्रत्येक द्विघात पदाला ½RT देते. म्हणूनच द्विअणुक रेणू पाचावरून सातावर जातो, पाचावरून सहावर नाही. दुसरी, आणि अधिक महत्त्वाची, कंपन-प्रकार हळूहळू सुरू होत नाही — खोलीच्या तापमानावर तो मुळात अनुपस्थित असतो आणि रेणूनुसार काही शेकडा वा हजार केल्विनच्या वरच प्रकट होतो. अभिजात भौतिकीकडे याचे कोणतेही स्पष्टीकरण नाही. समविभाजन, जसेच्या तसे घेतल्यास, भाकीत करते की प्रत्येक प्रकार नेहमी सक्रिय असावा, जे जवळपास प्रत्येक खऱ्या वायूसाठी प्रत्येक सामान्य तापमानावर चुकीची विशिष्ट उष्णता देईल. उकल केवळ पुंज यामिकीसह आली: कंपन-ऊर्जा वेगवेगळ्या गठ्ठ्यांत येते, आणि kT एका गठ्ठ्याहून फार लहान असल्यास प्रकार उत्तेजितच होऊ शकत नाही आणि काहीही वाटा देत नाही. हायड्रोजनची मोजलेली विशिष्ट उष्णता, जी शेकडो अंश तापवताना पायऱ्यांनी चढते, अभिजात यामिकी अपूर्ण आहे याच्या सर्वांत सुरुवातीच्या आणि स्पष्ट प्रायोगिक खुणांपैकी एक होती. (6225 हे f = 5 वापरते, 3735 हे f = 3, आणि 12450 हे f = 10.)",
      },
    },
  ],
  /*N*/
};
