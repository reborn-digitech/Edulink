/**
 * Class 10 Political Science — NCERT "Democratic Politics – II", chapter by
 * chapter, through the conceptual engine. Democracy examined after the
 * definitions: who else must be given a share, which tier decides what, and
 * what happens to a country that mistakes a majority for the whole nation.
 * Every claim is asked the same question — who is left out, and at what cost.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Democratic Politics – II (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

export const G10_CIVICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Power Sharing                                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-10-power-sharing",
    subject: "CIVICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 1 — Power Sharing",
      hi: "अध्याय 1 — सत्ता की साझेदारी",
      mr: "प्रकरण 1 — सत्तेची विभागणी",
    },
    name: {
      en: "Power Sharing",
      hi: "सत्ता की साझेदारी",
      mr: "सत्तेची विभागणी",
    },
    summary: {
      en: "The question a majority would rather not be asked: two small countries with the same problem and opposite answers, power divided sideways between organs and downwards between tiers, and a government elected not by where people live but by the language they speak.",
      hi: "वह प्रश्न जो बहुमत से न पूछा जाए तो अच्छा: एक ही समस्या और उल्टे उत्तरों वाले दो छोटे देश, अंगों के बीच बग़ल में और सीढ़ियों के बीच नीचे की ओर बँटी सत्ता, और वह सरकार जो लोग कहाँ रहते इससे नहीं बल्कि कौन-सी भाषा बोलते इससे चुनी जाती है।",
      mr: "बहुमताला विचारला जाऊ नये असा प्रश्न: एकच समस्या आणि उलट उत्तरे असलेले दोन छोटे देश, अंगांदरम्यान आडवी आणि पायऱ्यांदरम्यान खाली विभागलेली सत्ता, आणि लोक कुठे राहतात यावरून नव्हे तर कोणती भाषा बोलतात यावरून निवडलेले सरकार.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "power-sharing",
        name: {
          en: "Power sharing",
          hi: "सत्ता की साझेदारी",
          mr: "सत्तेची विभागणी",
        },
        kind: "idea",
        prompt: {
          en: "Rather than letting whoever wins an election hold every lever, authority is distributed among organs, levels, communities and parties, so that no single group can decide everything for everyone. What arrangement is this?",
          hi: "जो चुनाव जीते उसे हर लीवर सौंपने के बजाय, सत्ता अंगों, स्तरों, समुदायों और दलों में बाँटी जाती है, ताकि कोई एक समूह सबके लिए सब कुछ तय न कर सके। यह कौन-सी व्यवस्था है?",
          mr: "जो निवडणूक जिंकेल त्याला प्रत्येक सूत्र देण्याऐवजी, सत्ता अंगे, स्तर, समुदाय आणि पक्षांत वाटली जाते, जेणेकरून कोणताही एक गट सर्वांसाठी सर्व काही ठरवू शकणार नाही. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "Power sharing is the distribution of political authority among different organs, levels of government, social groups and political parties, so that power is not concentrated in one pair of hands.",
          hi: "सत्ता की साझेदारी राजनीतिक अधिकार का भिन्न अंगों, शासन के स्तरों, सामाजिक समूहों तथा राजनीतिक दलों में वितरण है, ताकि सत्ता एक ही जोड़ी हाथों में केंद्रित न हो।",
          mr: "सत्तेची विभागणी म्हणजे राजकीय अधिकाराचे वेगवेगळी अंगे, शासनाचे स्तर, सामाजिक गट आणि राजकीय पक्षांत वाटप, जेणेकरून सत्ता एकाच जोडी हातांत केंद्रित होणार नाही.",
        },
        detail: {
          en: "It rests on a simple point about democracy: those who will have to live with a decision have a claim to a say in making it.",
          hi: "यह लोकतंत्र के एक सीधे बिंदु पर टिकी है: जिन्हें किसी निर्णय के साथ जीना है उनका उसे बनाने में कहने का दावा बनता है।",
          mr: "ती लोकशाहीच्या एका सोप्या मुद्द्यावर टेकलेली: ज्यांना एखाद्या निर्णयासोबत जगावे लागणार त्यांचा तो घडवण्यात बोलण्याचा हक्क.",
        },
        extra: {
          en: "The older objection — that sharing power slows decisions and weakens government — assumes speed is the test; a decision imposed on a resentful minority is often reversed or resisted, which is slower still.",
          hi: "पुरानी आपत्ति — कि सत्ता बाँटना निर्णय धीमे करता और सरकार कमज़ोर करता है — मान लेती है कि गति ही कसौटी है; नाराज़ अल्पसंख्यक पर थोपा निर्णय अक्सर पलटता या विरोध पाता है, जो और भी धीमा पड़ता है।",
          mr: "जुना आक्षेप — की सत्ता वाटणे निर्णय मंदावते आणि सरकार दुर्बळ करते — गती हीच कसोटी असे गृहीत धरतो; नाराज अल्पसंख्याकावर लादलेला निर्णय अनेकदा पलटतो वा विरोध पावतो, जे आणखी मंद.",
        },
        pair: {
          left: {
            en: "Authority spread so no one group decides everything",
            hi: "सत्ता फैलाई ताकि कोई एक समूह सब तय न करे",
            mr: "सत्ता पसरवली जेणेकरून कोणता एक गट सर्व ठरवणार नाही",
          },
          right: {
            en: "power sharing",
            hi: "सत्ता की साझेदारी",
            mr: "सत्तेची विभागणी",
          },
        },
      },
      {
        id: "belgian-accommodation",
        name: {
          en: "The Belgian accommodation",
          hi: "बेल्जियम का समायोजन",
          mr: "बेल्जियमची तडजोड",
        },
        kind: "idea",
        prompt: {
          en: "A small European country with a Dutch-speaking majority and a wealthier French-speaking minority wrote its constitution so that the two must always hold equal ministries and neither can pass a law the other rejects. Which arrangement is this?",
          hi: "डच-भाषी बहुमत और अधिक संपन्न फ़्रांसीसी-भाषी अल्पसंख्यक वाले एक छोटे यूरोपीय देश ने अपना संविधान ऐसे लिखा कि दोनों को सदा बराबर मंत्रालय रखने होंगे और कोई ऐसा क़ानून पारित नहीं कर सकता जिसे दूसरा नकारे। यह कौन-सी व्यवस्था है?",
          mr: "डच-भाषिक बहुसंख्य आणि अधिक संपन्न फ्रेंच-भाषिक अल्पसंख्याक असलेल्या एका छोट्या युरोपीय देशाने आपली राज्यघटना अशी लिहिली की दोघांना सदैव समान मंत्रालये ठेवावी लागतील आणि कोणीही असा कायदा संमत करू शकत नाही जो दुसरा नाकारेल. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "The Belgian accommodation gives Dutch and French speakers an equal number of ministers in the central government and requires the support of both communities for major laws, so neither can be overruled by the other.",
          hi: "बेल्जियम का समायोजन डच और फ़्रांसीसी भाषियों को केंद्रीय सरकार में बराबर मंत्री देता है और बड़े क़ानूनों के लिए दोनों समुदायों का समर्थन माँगता है, अतः कोई दूसरे को अनसुना नहीं कर सकता।",
          mr: "बेल्जियमची तडजोड डच आणि फ्रेंच भाषिकांना केंद्रीय सरकारात समान मंत्री देते आणि मोठ्या कायद्यांसाठी दोन्ही समुदायांचा पाठिंबा मागते, म्हणून कोणीही दुसऱ्याला डावलू शकत नाही.",
        },
        detail: {
          en: "The complication was Brussels: French speakers are the majority in the capital but the minority in the country, so the city was given its own separate government with equal representation.",
          hi: "उलझन ब्रसेल्स थी: फ़्रांसीसी भाषी राजधानी में बहुमत पर देश में अल्पमत हैं, अतः शहर को बराबर प्रतिनिधित्व वाली अपनी अलग सरकार दी गई।",
          mr: "गुंतागुंत ब्रसेल्स होती: फ्रेंच भाषिक राजधानीत बहुसंख्य पण देशात अल्पसंख्य, म्हणून शहराला समान प्रतिनिधित्वाचे स्वतःचे वेगळे सरकार दिले गेले.",
        },
        extra: {
          en: "The arrangement is intricate and often mocked as unwieldy, but Belgium has avoided civil conflict and became the seat of the European Union's headquarters.",
          hi: "यह व्यवस्था पेचीदा है और अक्सर बोझिल कहकर मज़ाक़ उड़ाया जाता है, पर बेल्जियम गृह-संघर्ष से बचा रहा और यूरोपीय संघ के मुख्यालय की सीट बन गया।",
          mr: "ही व्यवस्था गुंतागुंतीची आणि अनेकदा अवजड म्हणून हिणवली जाते, पण बेल्जियम यादवी संघर्षापासून वाचला आणि युरोपीय संघाच्या मुख्यालयाची जागा बनला.",
        },
        pair: {
          left: {
            en: "Equal ministries, and no law without both communities",
            hi: "बराबर मंत्रालय, और दोनों समुदायों बिना कोई क़ानून नहीं",
            mr: "समान मंत्रालये, आणि दोन्ही समुदायांविना कोणता कायदा नाही",
          },
          right: {
            en: "the Belgian accommodation",
            hi: "बेल्जियम का समायोजन",
            mr: "बेल्जियमची तडजोड",
          },
        },
      },
      {
        id: "sri-lanka-majoritarianism",
        name: {
          en: "Sri Lanka's majoritarianism",
          hi: "श्रीलंका का बहुसंख्यकवाद",
          mr: "श्रीलंकेचा बहुसंख्याकवाद",
        },
        kind: "idea",
        prompt: {
          en: "After independence a majority community's government made its own language the sole official one, gave its religion state protection, and favoured its applicants for university places and jobs — and the excluded minority eventually took up arms. Which course is this?",
          hi: "स्वतंत्रता के बाद बहुसंख्यक समुदाय की सरकार ने अपनी भाषा को एकमात्र राजभाषा बनाया, अपने धर्म को राजकीय संरक्षण दिया, और विश्वविद्यालय की सीटों तथा नौकरियों में अपने आवेदकों को वरीयता दी — और बहिष्कृत अल्पसंख्यक ने अंततः हथियार उठा लिए। यह कौन-सा मार्ग है?",
          mr: "स्वातंत्र्यानंतर बहुसंख्याक समुदायाच्या सरकारने आपली भाषा एकमेव राजभाषा केली, आपल्या धर्माला शासकीय संरक्षण दिले, आणि विद्यापीठाच्या जागा व नोकऱ्यांत आपल्या अर्जदारांना प्राधान्य दिले — आणि वगळलेल्या अल्पसंख्याकाने अखेर शस्त्रे उचलली. हा कोणता मार्ग?",
        },
        statement: {
          en: "Sri Lanka's majoritarianism made Sinhala the only official language, gave Buddhism state protection and favoured Sinhala applicants in education and employment, driving Sri Lankan Tamils from protest to demands for a separate state and a long civil war.",
          hi: "श्रीलंका के बहुसंख्यकवाद ने सिंहली को एकमात्र राजभाषा बनाया, बौद्ध धर्म को राजकीय संरक्षण दिया और शिक्षा तथा रोज़गार में सिंहली आवेदकों को वरीयता दी, जिसने श्रीलंकाई तमिलों को विरोध से अलग राज्य की माँग और लंबे गृहयुद्ध तक पहुँचा दिया।",
          mr: "श्रीलंकेच्या बहुसंख्याकवादाने सिंहली एकमेव राजभाषा केली, बौद्ध धर्माला शासकीय संरक्षण दिले आणि शिक्षण व रोजगारात सिंहली अर्जदारांना प्राधान्य दिले, ज्याने श्रीलंकन तमिळांना निषेधापासून वेगळ्या राज्याच्या मागणीपर्यंत आणि दीर्घ यादवी युद्धापर्यंत नेले.",
        },
        detail: {
          en: "Nothing in these measures was unconstitutional or even unpopular; they were passed by an elected government with a genuine majority behind it.",
          hi: "इन उपायों में कुछ भी असंवैधानिक या अलोकप्रिय तक नहीं था; वे असली बहुमत वाली निर्वाचित सरकार ने पारित किए थे।",
          mr: "या उपायांत काहीही असंवैधानिक वा अप्रियही नव्हते; ते खऱ्या बहुमताच्या निवडून आलेल्या सरकारने संमत केले होते.",
        },
        extra: {
          en: "That is precisely the lesson: winning an election lawfully does not entitle a majority to rule as though the minority were not part of the nation.",
          hi: "यही तो सबक़ है: क़ानूनी ढंग से चुनाव जीतना बहुमत को यह अधिकार नहीं देता कि वह ऐसे शासन करे मानो अल्पसंख्यक राष्ट्र का हिस्सा ही न हो।",
          mr: "हाच तर धडा: कायदेशीरपणे निवडणूक जिंकणे बहुमताला असा अधिकार देत नाही की त्याने अल्पसंख्याक राष्ट्राचा भागच नाही अशा प्रकारे राज्य करावे.",
        },
        pair: {
          left: {
            en: "One community's language, faith and preference made the state's",
            hi: "एक समुदाय की भाषा, आस्था और वरीयता को राज्य का बनाया",
            mr: "एका समुदायाची भाषा, श्रद्धा आणि प्राधान्य राज्याचे केले",
          },
          right: {
            en: "Sri Lanka's majoritarianism",
            hi: "श्रीलंका का बहुसंख्यकवाद",
            mr: "श्रीलंकेचा बहुसंख्याकवाद",
          },
        },
      },
      {
        id: "horizontal-power-sharing",
        name: {
          en: "Horizontal power sharing",
          hi: "क्षैतिज सत्ता-साझेदारी",
          mr: "आडवी सत्ता-विभागणी",
        },
        kind: "idea",
        prompt: {
          en: "The legislature makes law, the executive carries it out, and the judiciary can strike down what either does — three organs at the same level, each able to check the other two. What is this division called?",
          hi: "विधायिका क़ानून बनाती है, कार्यपालिका उसे लागू करती है, और न्यायपालिका दोनों में से किसी का किया रद्द कर सकती है — एक ही स्तर पर तीन अंग, हर एक दूसरे दो को रोकने में सक्षम। यह विभाजन क्या कहलाता है?",
          mr: "विधिमंडळ कायदा बनवते, कार्यपालिका तो राबवते, आणि न्यायपालिका दोघांपैकी कोणाचेही केलेले रद्द करू शकते — एकाच स्तरावर तीन अंगे, प्रत्येक दुसऱ्या दोघांना रोखण्यास सक्षम. ही विभागणी काय म्हणतात?",
        },
        statement: {
          en: "Horizontal power sharing divides authority among organs of government placed at the same level — legislature, executive and judiciary — each with its own powers and each able to check the others.",
          hi: "क्षैतिज सत्ता-साझेदारी सत्ता को एक ही स्तर पर रखे शासन के अंगों में बाँटती है — विधायिका, कार्यपालिका और न्यायपालिका — हर एक के पास अपनी शक्तियाँ और हर एक दूसरों को रोकने में सक्षम।",
          mr: "आडवी सत्ता-विभागणी सत्ता एकाच स्तरावर ठेवलेल्या शासनाच्या अंगांत वाटते — विधिमंडळ, कार्यपालिका आणि न्यायपालिका — प्रत्येकाकडे स्वतःच्या सत्ता आणि प्रत्येक इतरांना रोखण्यास सक्षम.",
        },
        detail: {
          en: "The arrangement is often called a system of checks and balances, because each organ's independence is what makes its check on the others worth anything.",
          hi: "इस व्यवस्था को अक्सर नियंत्रण और संतुलन की प्रणाली कहा जाता है, क्योंकि हर अंग की स्वतंत्रता ही उसके दूसरों पर नियंत्रण को कोई मूल्य देती है।",
          mr: "या व्यवस्थेला अनेकदा नियंत्रण आणि संतुलनाची पद्धत म्हणतात, कारण प्रत्येक अंगाचे स्वातंत्र्यच त्याच्या इतरांवरील नियंत्रणाला काही मोल देते.",
        },
        extra: {
          en: "It is why a judge's tenure cannot be ended by a displeased minister, and why a court that could be dismissed at will would be no check at all.",
          hi: "इसी से किसी नाराज़ मंत्री द्वारा न्यायाधीश का कार्यकाल समाप्त नहीं किया जा सकता, और इसी से वह अदालत जो मर्ज़ी से हटाई जा सके कोई नियंत्रण होती ही नहीं।",
          mr: "म्हणूनच नाराज मंत्र्याकडून न्यायाधीशाचा कार्यकाळ संपवता येत नाही, आणि म्हणूनच जे न्यायालय मर्जीने काढता येईल ते कोणतेही नियंत्रण नसतेच.",
        },
        pair: {
          left: {
            en: "Three organs at one level, each checking the others",
            hi: "एक ही स्तर पर तीन अंग, हर एक दूसरों को रोकता",
            mr: "एकाच स्तरावर तीन अंगे, प्रत्येक इतरांना रोखणारे",
          },
          right: {
            en: "horizontal power sharing",
            hi: "क्षैतिज सत्ता-साझेदारी",
            mr: "आडवी सत्ता-विभागणी",
          },
        },
      },
      {
        id: "vertical-power-sharing",
        name: {
          en: "Vertical power sharing",
          hi: "ऊर्ध्वाधर सत्ता-साझेदारी",
          mr: "उभी सत्ता-विभागणी",
        },
        kind: "idea",
        prompt: {
          en: "Defence and currency are settled in Delhi, police and agriculture in the state capital, and street lighting and drinking water by the panchayat or municipality — each tier holding powers the others cannot take away. What is this division called?",
          hi: "रक्षा और मुद्रा दिल्ली में तय होते, पुलिस और कृषि राज्य की राजधानी में, और गली की रोशनी तथा पेयजल पंचायत या नगरपालिका द्वारा — हर सीढ़ी के पास ऐसी शक्तियाँ जो दूसरे छीन नहीं सकते। यह विभाजन क्या कहलाता है?",
          mr: "संरक्षण आणि चलन दिल्लीत ठरते, पोलीस आणि शेती राज्याच्या राजधानीत, आणि रस्त्यावरील दिवे व पिण्याचे पाणी पंचायत वा नगरपालिकेकडून — प्रत्येक पायरीकडे अशा सत्ता ज्या इतर हिरावू शकत नाहीत. ही विभागणी काय म्हणतात?",
        },
        statement: {
          en: "Vertical power sharing divides authority among governments at different levels — union, state and local — with each tier given its own subjects to decide rather than acting merely as an agent of the one above.",
          hi: "ऊर्ध्वाधर सत्ता-साझेदारी सत्ता को भिन्न स्तरों की सरकारों में बाँटती है — संघ, राज्य और स्थानीय — जहाँ हर सीढ़ी को तय करने के अपने विषय दिए जाते हैं, न कि वह केवल ऊपरवाली की एजेंट बनकर काम करे।",
          mr: "उभी सत्ता-विभागणी सत्ता वेगवेगळ्या स्तरांच्या शासनांत वाटते — संघ, राज्य आणि स्थानिक — जिथे प्रत्येक पायरीला ठरवण्याचे स्वतःचे विषय दिले जातात, ती केवळ वरच्याची प्रतिनिधी म्हणून काम करत नाही.",
        },
        detail: {
          en: "The test of it is whether the lower tier's powers are guaranteed by the constitution or merely lent by the higher one, which can withdraw them at will.",
          hi: "उसकी कसौटी यह है कि निचली सीढ़ी की शक्तियाँ संविधान से सुनिश्चित हैं या केवल ऊपरवाली द्वारा उधार दी गई हैं, जो उन्हें मर्ज़ी से वापस ले सकती है।",
          mr: "तिची कसोटी ही की खालच्या पायरीच्या सत्ता राज्यघटनेने हमी दिलेल्या आहेत की केवळ वरच्याने उसन्या दिलेल्या, जी त्या मर्जीने परत घेऊ शकते.",
        },
        extra: {
          en: "Bringing decisions closer to the people also improves them, because a village council knows which hand-pump has failed and a distant ministry does not.",
          hi: "निर्णयों को लोगों के पास लाना उन्हें बेहतर भी बनाता है, क्योंकि ग्राम परिषद जानती है कौन-सा हैंडपंप बिगड़ा है और दूर का मंत्रालय नहीं।",
          mr: "निर्णय लोकांजवळ आणणे त्यांना अधिक चांगलेही करते, कारण ग्रामसभेला माहीत असते कोणता हातपंप बिघडला आणि दूरच्या मंत्रालयाला नाही.",
        },
        pair: {
          left: {
            en: "Union, state and local, each with its own subjects",
            hi: "संघ, राज्य और स्थानीय, हर एक के अपने विषय",
            mr: "संघ, राज्य आणि स्थानिक, प्रत्येकाचे स्वतःचे विषय",
          },
          right: {
            en: "vertical power sharing",
            hi: "ऊर्ध्वाधर सत्ता-साझेदारी",
            mr: "उभी सत्ता-विभागणी",
          },
        },
      },
      {
        id: "community-government",
        name: {
          en: "Community government",
          hi: "समुदाय सरकार",
          mr: "समुदाय शासन",
        },
        kind: "structure",
        prompt: {
          en: "In Belgium a third kind of government exists, elected by all the people who speak one language wherever in the country they live, and it decides matters of culture, education and language for that community alone. What is it called?",
          hi: "बेल्जियम में तीसरी तरह की सरकार है, जिसे एक भाषा बोलने वाले सब लोग चुनते हैं चाहे वे देश में कहीं भी रहते हों, और वह उसी समुदाय के लिए संस्कृति, शिक्षा तथा भाषा के मामले तय करती है। वह क्या कहलाती है?",
          mr: "बेल्जियममध्ये तिसऱ्या प्रकारचे शासन आहे, जे एक भाषा बोलणारे सर्व लोक निवडतात मग ते देशात कुठेही राहत असोत, आणि ते त्याच समुदायासाठी संस्कृती, शिक्षण व भाषेच्या बाबी ठरवते. त्याला काय म्हणतात?",
        },
        statement: {
          en: "A community government in Belgium is elected by the members of one language group wherever they live in the country, and holds power over cultural, educational and language-related matters for that group.",
          hi: "बेल्जियम में समुदाय सरकार एक भाषा-समूह के सदस्यों द्वारा चुनी जाती है चाहे वे देश में कहीं भी रहें, और उस समूह के लिए सांस्कृतिक, शैक्षिक तथा भाषा-संबंधी मामलों पर सत्ता रखती है।",
          mr: "बेल्जियममधील समुदाय शासन एका भाषा-गटाच्या सदस्यांकडून निवडले जाते मग ते देशात कुठेही राहोत, आणि त्या गटासाठी सांस्कृतिक, शैक्षणिक व भाषा-संबंधित बाबींवर सत्ता ठेवते.",
        },
        detail: {
          en: "It is unusual because its authority follows people rather than territory, which is exactly what a scattered minority needs.",
          hi: "यह असामान्य है क्योंकि उसकी सत्ता भूभाग के बजाय लोगों के पीछे चलती है, और बिखरे अल्पसंख्यक को ठीक यही चाहिए।",
          mr: "हे असामान्य कारण त्याची सत्ता भूभागाऐवजी लोकांच्या मागे जाते, आणि विखुरलेल्या अल्पसंख्याकाला नेमके हेच लागते.",
        },
        extra: {
          en: "It answers a problem no map can solve: a community too spread out to be given a state of its own can still be given control over what matters most to it.",
          hi: "यह ऐसी समस्या का उत्तर देता है जिसे कोई नक़्शा हल नहीं कर सकता: जो समुदाय इतना फैला है कि उसे अपना राज्य नहीं दिया जा सकता उसे भी उस पर नियंत्रण दिया जा सकता है जो उसके लिए सबसे मायने रखता है।",
          mr: "हे अशा समस्येचे उत्तर देते जी कोणता नकाशा सोडवू शकत नाही: जो समुदाय इतका पसरलेला की त्याला स्वतःचे राज्य देता येत नाही त्यालाही त्याच्यासाठी सर्वांत महत्त्वाच्या गोष्टीवर नियंत्रण देता येते.",
        },
        pair: {
          left: {
            en: "A government elected by language, not by district",
            hi: "ज़िले से नहीं, भाषा से चुनी सरकार",
            mr: "जिल्ह्याने नव्हे, भाषेने निवडलेले शासन",
          },
          right: {
            en: "community government",
            hi: "समुदाय सरकार",
            mr: "समुदाय शासन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Belgium and Sri Lanka both emerged with a linguistic majority and a substantial minority, and both were democracies with regular elections. Belgium is intact and prosperous; Sri Lanka endured a civil war lasting decades. Explain what each chose to do, and what the comparison establishes.",
          hi: "बेल्जियम और श्रीलंका दोनों भाषायी बहुमत तथा बड़े अल्पसंख्यक के साथ उभरे, और दोनों नियमित चुनावों वाले लोकतंत्र थे। बेल्जियम अखंड और समृद्ध है; श्रीलंका ने दशकों चलता गृहयुद्ध झेला। समझाओ हर एक ने क्या करना चुना, और तुलना क्या सिद्ध करती है।",
          mr: "बेल्जियम आणि श्रीलंका दोन्ही भाषिक बहुसंख्य आणि मोठा अल्पसंख्याक घेऊन उदयाला आले, आणि दोन्ही नियमित निवडणुका असलेल्या लोकशाही होत्या. बेल्जियम अखंड आणि समृद्ध; श्रीलंकेने दशके चाललेले यादवी युद्ध सोसले. समजावा प्रत्येकाने काय करायचे निवडले, आणि तुलना काय सिद्ध करते.",
        },
        choices: [
          {
            en: "Belgium wrote power sharing into its constitution — equal ministries for both language groups, laws needing both communities' support, a separate Brussels arrangement and community governments elected by language. Sri Lanka did the opposite, making Sinhala the sole official language, privileging Buddhism and favouring Sinhala applicants. The comparison shows that elections alone do not make a democracy safe: a majority that governs as though the minority were outside the nation drives it from protest towards separation",
            hi: "बेल्जियम ने सत्ता-साझेदारी अपने संविधान में लिखी — दोनों भाषा-समूहों को बराबर मंत्रालय, दोनों समुदायों का समर्थन माँगते क़ानून, ब्रसेल्स की अलग व्यवस्था और भाषा से चुनी समुदाय सरकारें। श्रीलंका ने उल्टा किया, सिंहली को एकमात्र राजभाषा बनाया, बौद्ध धर्म को वरीयता दी और सिंहली आवेदकों का पक्ष लिया। तुलना दिखाती है कि केवल चुनाव लोकतंत्र को सुरक्षित नहीं बनाते: जो बहुमत ऐसे शासन करे मानो अल्पसंख्यक राष्ट्र के बाहर हो, वह उसे विरोध से अलगाव की ओर धकेलता है",
            mr: "बेल्जियमने सत्ता-विभागणी आपल्या राज्यघटनेत लिहिली — दोन्ही भाषा-गटांना समान मंत्रालये, दोन्ही समुदायांचा पाठिंबा मागणारे कायदे, ब्रसेल्सची वेगळी व्यवस्था आणि भाषेने निवडलेली समुदाय शासने. श्रीलंकेने उलट केले, सिंहली एकमेव राजभाषा केली, बौद्ध धर्माला प्राधान्य दिले आणि सिंहली अर्जदारांची बाजू घेतली. तुलना दाखवते की केवळ निवडणुका लोकशाही सुरक्षित करत नाहीत: जो बहुमत अल्पसंख्याक राष्ट्राबाहेर असल्यासारखे राज्य करतो, तो त्याला निषेधाकडून फुटीकडे ढकलतो",
          },
          {
            en: "Belgium succeeded because it had no minority at all, so no accommodation was ever necessary",
            hi: "बेल्जियम इसलिए सफल हुआ कि उसके पास कोई अल्पसंख्यक था ही नहीं, अतः कोई समायोजन कभी ज़रूरी नहीं था",
            mr: "बेल्जियम यासाठी यशस्वी झाला की त्याच्याकडे कोणता अल्पसंख्याकच नव्हता, म्हणून कोणतीही तडजोड कधी आवश्यक नव्हती",
          },
          {
            en: "Sri Lanka's conflict arose because it held no elections, having been a dictatorship throughout",
            hi: "श्रीलंका का संघर्ष इसलिए उठा कि उसने कोई चुनाव कराए ही नहीं, वह पूरे समय तानाशाही रही",
            mr: "श्रीलंकेचा संघर्ष यासाठी उद्भवला की तिने कोणत्याही निवडणुका घेतल्याच नाहीत, ती संपूर्ण काळ हुकूमशाही होती",
          },
          {
            en: "The two outcomes were random, since constitutional design has no effect on whether conflict occurs",
            hi: "दोनों परिणाम आकस्मिक थे, क्योंकि संवैधानिक रचना का इस पर कोई प्रभाव नहीं कि संघर्ष होगा या नहीं",
            mr: "दोन्ही निकाल यादृच्छिक होते, कारण संवैधानिक रचनेचा संघर्ष होईल की नाही यावर परिणाम नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The comparison is instructive precisely because so much else was held constant. Both are small countries; both had a linguistic majority and a large minority; both became independent democracies in the middle of the twentieth century; both held regular elections that were, by the standards of the time, genuine. What differed was the constitutional answer each gave to a single question: what does the majority owe the minority? Belgium's answer was elaborate and deliberately inconvenient to itself. Dutch speakers were about three-fifths of the population and could have governed alone, but the constitution required that the central government have equal numbers of Dutch- and French-speaking ministers, and that major laws pass only with the support of both communities — a rule that gives the smaller group an effective veto. Powers were devolved to regional governments. Brussels, where French speakers were locally in the majority though nationally in the minority, was given its own government with equal representation. And a third tier, the community government, was created to be elected by everyone speaking a given language wherever they lived, holding authority over culture, education and language. The design is complicated and often mocked, but it made the outcome that mattered impossible: neither community can be simply outvoted on the things it cares most about. Sri Lanka's answer was the opposite, and — this is the crucial point — it was democratically arrived at. The Sinhala majority, about three-quarters of the population, used its electoral weight to make Sinhala the sole official language in 1956, to give Buddhism the foremost place with a duty of state protection, and to operate university admission and public employment policies that favoured Sinhala applicants. None of this was a coup. It was legislation, passed by elected governments, popular with the people who elected them. The Sri Lankan Tamils, concentrated in the north and east, found their language unusable in courts and offices, their access to education narrowed, and their political parties unable to change any of it because they could always be outvoted. Protest gave way to demands for autonomy, then for a separate state, then to armed struggle, and the civil war that followed lasted from the early 1980s to 2009 and killed tens of thousands of people from all communities. So the comparison establishes something specific and uncomfortable. Elections are necessary for democracy but not sufficient, because a permanent majority can use perfectly lawful electoral means to make a permanent minority's position intolerable. The rule of the majority cannot mean the rule of one community over others, because the minority has nowhere else to go and no electoral route to relief — and a group with no route to relief within the system will eventually look for one outside it. Power sharing is therefore not a concession that weakens government; it is what keeps a diverse country governable at all. (The wrong answers deny Belgium's minority, deny Sri Lanka's elections — which is exactly what makes its case alarming — or dismiss as random a difference that traces directly to two documented constitutional choices.)",
          hi: "तुलना ठीक इसलिए शिक्षाप्रद है कि बाक़ी बहुत कुछ स्थिर रखा गया। दोनों छोटे देश; दोनों में भाषायी बहुमत और बड़ा अल्पसंख्यक; दोनों बीसवीं सदी के मध्य में स्वतंत्र लोकतंत्र बने; दोनों ने नियमित चुनाव कराए जो उस समय के मानकों से असली थे। भिन्न यह था कि एक ही प्रश्न का संवैधानिक उत्तर हर एक ने क्या दिया: बहुमत अल्पसंख्यक का क्या देनदार है? बेल्जियम का उत्तर विस्तृत और जानबूझकर स्वयं के लिए असुविधाजनक था। डच भाषी आबादी के लगभग तीन-पाँचवें थे और अकेले शासन कर सकते थे, पर संविधान ने माँगा कि केंद्रीय सरकार में डच- और फ़्रांसीसी-भाषी मंत्री बराबर हों, और बड़े क़ानून केवल दोनों समुदायों के समर्थन से पारित हों — ऐसा नियम जो छोटे समूह को प्रभावी वीटो देता है। शक्तियाँ क्षेत्रीय सरकारों को सौंपी गईं। ब्रसेल्स, जहाँ फ़्रांसीसी भाषी स्थानीय रूप से बहुमत में पर राष्ट्रीय रूप से अल्पमत में थे, को बराबर प्रतिनिधित्व वाली अपनी सरकार दी गई। और तीसरी सीढ़ी, समुदाय सरकार, बनाई गई जिसे कोई भाषा बोलने वाले सब लोग चुनें चाहे कहीं रहते हों, और जिसके पास संस्कृति, शिक्षा तथा भाषा पर सत्ता हो। रचना पेचीदा है और अक्सर मज़ाक़ बनती है, पर उसने वह परिणाम असंभव कर दिया जो मायने रखता था: कोई भी समुदाय उन चीज़ों पर बस मतों से हराया नहीं जा सकता जिनकी उसे सबसे अधिक परवाह है। श्रीलंका का उत्तर उल्टा था, और — यही मुख्य बिंदु है — वह लोकतांत्रिक ढंग से आया था। सिंहली बहुमत, आबादी का लगभग तीन-चौथाई, ने अपना चुनावी वज़न इस्तेमाल कर 1956 में सिंहली को एकमात्र राजभाषा बनाया, बौद्ध धर्म को राजकीय संरक्षण के कर्तव्य के साथ अग्रणी स्थान दिया, और विश्वविद्यालय-प्रवेश तथा सार्वजनिक रोज़गार की ऐसी नीतियाँ चलाईं जो सिंहली आवेदकों का पक्ष लेती थीं। इसमें कुछ भी तख़्तापलट नहीं था। यह विधान था, निर्वाचित सरकारों द्वारा पारित, उन लोगों में लोकप्रिय जिन्होंने उन्हें चुना था। श्रीलंकाई तमिल, उत्तर और पूर्व में केंद्रित, ने पाया कि उनकी भाषा अदालतों तथा दफ़्तरों में अनुपयोगी है, शिक्षा तक उनकी पहुँच सँकरी है, और उनके राजनीतिक दल उसमें से कुछ भी बदल नहीं सकते क्योंकि वे सदा मतों से हराए जा सकते हैं। विरोध ने स्वायत्तता की माँगों को जगह दी, फिर अलग राज्य की, फिर सशस्त्र संघर्ष को, और उसके बाद आया गृहयुद्ध 1980 के दशक के आरंभ से 2009 तक चला और सब समुदायों के दसियों हज़ार लोग मारे गए। अतः तुलना कुछ विशिष्ट और असहज सिद्ध करती है। लोकतंत्र के लिए चुनाव आवश्यक हैं पर पर्याप्त नहीं, क्योंकि स्थायी बहुमत पूरी तरह वैध चुनावी साधनों से स्थायी अल्पसंख्यक की स्थिति असह्य बना सकता है। बहुमत का शासन एक समुदाय का दूसरों पर शासन नहीं हो सकता, क्योंकि अल्पसंख्यक के पास जाने को और कोई जगह नहीं और राहत का कोई चुनावी रास्ता नहीं — और जिस समूह के पास तंत्र के भीतर राहत का रास्ता न हो वह अंततः बाहर एक रास्ता खोजेगा। अतः सत्ता की साझेदारी ऐसी रियायत नहीं जो सरकार कमज़ोर करे; वही किसी विविध देश को शासन-योग्य बनाए रखती है। (ग़लत उत्तर बेल्जियम के अल्पसंख्यक को नकारते, श्रीलंका के चुनावों को नकारते — जो ठीक वही है जो उसके प्रकरण को भयावह बनाता — या ऐसे अंतर को आकस्मिक कहकर टालते जो सीधे दो दर्ज संवैधानिक चुनावों तक जाता है।)",
          mr: "तुलना नेमकी यासाठी शिकवणारी की बाकी बरेच काही स्थिर ठेवले गेले. दोन्ही लहान देश; दोन्हींत भाषिक बहुसंख्य आणि मोठा अल्पसंख्याक; दोन्ही विसाव्या शतकाच्या मध्यावर स्वतंत्र लोकशाही बनले; दोन्हींनी नियमित निवडणुका घेतल्या ज्या त्या काळाच्या मानकांनुसार खऱ्या होत्या. वेगळे हे होते की एकाच प्रश्नाचे संवैधानिक उत्तर प्रत्येकाने काय दिले: बहुमत अल्पसंख्याकाचे काय देणे लागतो? बेल्जियमचे उत्तर विस्तृत आणि मुद्दाम स्वतःला गैरसोयीचे होते. डच भाषिक लोकसंख्येच्या सुमारे तीन-पंचमांश होते आणि एकटे राज्य करू शकत होते, पण राज्यघटनेने मागितले की केंद्रीय सरकारात डच- आणि फ्रेंच-भाषिक मंत्री समान असावेत, आणि मोठे कायदे केवळ दोन्ही समुदायांच्या पाठिंब्याने संमत व्हावेत — असा नियम जो लहान गटाला प्रभावी नकाराधिकार देतो. सत्ता प्रादेशिक शासनांना सोपवली. ब्रसेल्स, जिथे फ्रेंच भाषिक स्थानिकरीत्या बहुसंख्य पण राष्ट्रीय पातळीवर अल्पसंख्य, त्याला समान प्रतिनिधित्वाचे स्वतःचे शासन दिले. आणि तिसरी पायरी, समुदाय शासन, बनवली जी एखादी भाषा बोलणारे सर्व लोक निवडतील मग ते कुठेही राहोत, आणि जिच्याकडे संस्कृती, शिक्षण व भाषेवर सत्ता असेल. रचना गुंतागुंतीची आणि अनेकदा हिणवली जाते, पण तिने तो निकाल अशक्य केला जो महत्त्वाचा होता: कोणताही समुदाय ज्या गोष्टींची त्याला सर्वाधिक काळजी त्यांवर फक्त मतांनी हरवला जाऊ शकत नाही. श्रीलंकेचे उत्तर उलट होते, आणि — हाच मुख्य मुद्दा — ते लोकशाही मार्गाने आले होते. सिंहली बहुसंख्य, लोकसंख्येच्या सुमारे तीन-चतुर्थांश, यांनी आपले निवडणूक वजन वापरून 1956 मध्ये सिंहली एकमेव राजभाषा केली, बौद्ध धर्माला शासकीय संरक्षणाच्या कर्तव्यासह अग्रस्थान दिले, आणि विद्यापीठ-प्रवेश व सार्वजनिक रोजगाराची अशी धोरणे चालवली जी सिंहली अर्जदारांची बाजू घेत. यात काहीही उठाव नव्हता. ते कायदे होते, निवडून आलेल्या सरकारांनी संमत केलेले, ज्यांनी त्यांना निवडले त्यांच्यात लोकप्रिय. श्रीलंकन तमिळ, उत्तर व पूर्वेत केंद्रित, यांना आढळले की त्यांची भाषा न्यायालये व कार्यालयांत अवापरता, शिक्षणापर्यंतचा त्यांचा प्रवेश अरुंद, आणि त्यांचे राजकीय पक्ष त्यातील काहीही बदलू शकत नाहीत कारण ते सदैव मतांनी हरवले जाऊ शकतात. निषेधाने स्वायत्ततेच्या मागण्यांना जागा दिली, मग वेगळ्या राज्याच्या, मग सशस्त्र लढ्याला, आणि त्यानंतर आलेले यादवी युद्ध 1980 च्या दशकाच्या सुरुवातीपासून 2009 पर्यंत चालले आणि सर्व समुदायांतील हजारो लोक मारले गेले. म्हणून तुलना काहीतरी विशिष्ट आणि अस्वस्थ करणारे सिद्ध करते. लोकशाहीसाठी निवडणुका आवश्यक पण पुरेशा नाहीत, कारण कायमचे बहुमत पूर्णपणे कायदेशीर निवडणूक मार्गांनी कायमच्या अल्पसंख्याकाची स्थिती असह्य करू शकते. बहुमताचे राज्य एका समुदायाचे इतरांवरील राज्य असू शकत नाही, कारण अल्पसंख्याकाकडे जायला दुसरी जागा नाही आणि दिलाशाचा कोणता निवडणूक मार्ग नाही — आणि ज्या गटाकडे व्यवस्थेच्या आत दिलाशाचा मार्ग नाही तो अखेर बाहेर एक शोधेल. म्हणून सत्तेची विभागणी ही सरकार दुर्बळ करणारी सवलत नाही; तीच विविध देशाला शासनयोग्य ठेवते. (चुकीची उत्तरे बेल्जियमचा अल्पसंख्याक नाकारतात, श्रीलंकेच्या निवडणुका नाकारतात — जे नेमके तिचे प्रकरण भयावह करते — वा दोन नोंदल्या संवैधानिक निवडींकडे थेट जाणाऱ्या फरकाला यादृच्छिक म्हणून झटकतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A critic argues that power sharing is a costly indulgence: it slows decisions, multiplies offices, invites deadlock, and lets small groups block what the majority clearly wants. Answer the criticism on both its own practical ground and on the deeper question of what democracy is for.",
          hi: "एक आलोचक तर्क देता है कि सत्ता की साझेदारी महँगी विलासिता है: वह निर्णय धीमे करती, पद बढ़ाती, गतिरोध बुलाती, और छोटे समूहों को वह रोकने देती है जो बहुमत स्पष्ट रूप से चाहता है। इस आलोचना का उत्तर उसकी अपनी व्यावहारिक ज़मीन पर और इस गहरे प्रश्न पर दो कि लोकतंत्र किसलिए है।",
          mr: "एक टीकाकार युक्तिवाद करतो की सत्तेची विभागणी ही महागडी चैन आहे: ती निर्णय मंदावते, पदे वाढवते, कोंडी बोलावते, आणि लहान गटांना ते अडवू देते जे बहुमताला स्पष्टपणे हवे आहे. या टीकेला तिच्याच व्यावहारिक भूमीवर आणि लोकशाही कशासाठी आहे या खोल प्रश्नावर उत्तर द्या.",
        },
        choices: [
          {
            en: "Practically, the criticism measures the wrong cost: a decision imposed on a resentful minority is resisted, litigated, sabotaged or reversed, and at the extreme produces the violence that ends all governing — so sharing power buys durability, not delay. Morally, the claim goes deeper: democracy is not merely a method for counting who is larger but a system in which those who must live with a decision have a say in it, so power sharing is not a limit placed on democracy from outside but the thing democracy already means",
            hi: "व्यावहारिक रूप से, आलोचना ग़लत लागत नापती है: नाराज़ अल्पसंख्यक पर थोपा निर्णय विरोध पाता, मुक़दमों में उलझता, तोड़ा या पलटा जाता है, और चरम पर वह हिंसा पैदा करता है जो सारा शासन ही ख़त्म कर देती — अतः सत्ता बाँटना देरी नहीं, टिकाऊपन ख़रीदता है। नैतिक रूप से, दावा और गहरा जाता है: लोकतंत्र केवल यह गिनने की विधि नहीं कि कौन बड़ा है बल्कि ऐसी प्रणाली है जिसमें जिन्हें किसी निर्णय के साथ जीना है उनका उसमें कहना बनता है, अतः सत्ता की साझेदारी लोकतंत्र पर बाहर से लगी सीमा नहीं बल्कि वही है जो लोकतंत्र का पहले से अर्थ है",
            mr: "व्यावहारिकदृष्ट्या, टीका चुकीचा खर्च मोजते: नाराज अल्पसंख्याकावर लादलेला निर्णय विरोध पावतो, खटल्यांत अडकतो, मोडला वा पलटला जातो, आणि टोकाला ती हिंसा घडवतो जी सर्व शासनच संपवते — म्हणून सत्ता वाटणे विलंब नव्हे तर टिकाऊपणा विकत घेते. नैतिकदृष्ट्या, दावा अधिक खोल जातो: लोकशाही म्हणजे केवळ कोण मोठा हे मोजण्याची पद्धत नव्हे तर अशी व्यवस्था जिच्यात ज्यांना निर्णयासोबत जगावे लागेल त्यांचे त्यात म्हणणे असते, म्हणून सत्तेची विभागणी लोकशाहीवर बाहेरून घातलेली मर्यादा नव्हे तर लोकशाहीचा आधीच असलेला अर्थ",
          },
          {
            en: "The criticism is entirely correct: the fastest government is always the best, so undivided power is the democratic ideal",
            hi: "आलोचना पूरी तरह सही है: सबसे तेज़ सरकार सदा सबसे अच्छी है, अतः अविभाजित सत्ता ही लोकतांत्रिक आदर्श है",
            mr: "टीका पूर्णपणे बरोबर: सर्वांत वेगवान सरकार सदैव सर्वांत चांगले, म्हणून अविभाजित सत्ताच लोकशाही आदर्श",
          },
          {
            en: "Power sharing can be defended only on sentimental grounds, since it has no practical benefit of any kind",
            hi: "सत्ता की साझेदारी का बचाव केवल भावुक आधार पर हो सकता है, क्योंकि उसका किसी भी तरह का व्यावहारिक लाभ नहीं",
            mr: "सत्तेच्या विभागणीचा बचाव केवळ भावनिक आधारावर होऊ शकतो, कारण तिचा कोणत्याही प्रकारचा व्यावहारिक फायदा नाही",
          },
          {
            en: "The question is meaningless, because no country has ever shared power between groups or levels",
            hi: "प्रश्न निरर्थक है, क्योंकि किसी देश ने कभी समूहों या स्तरों के बीच सत्ता बाँटी ही नहीं",
            mr: "प्रश्न निरर्थक, कारण कोणत्याही देशाने कधी गट वा स्तरांदरम्यान सत्ता वाटलीच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The criticism deserves a serious answer, and there are two, working at different levels. The first is prudential and meets the critic on his own ground. He is measuring the cost of making a decision and ignoring the cost of making it stick. A government that can act quickly because nothing constrains it still has to implement what it decides in territory inhabited by the people it overruled. Those people do not disappear when the vote is counted. They go to court, they refuse cooperation, they strike, they vote the government out and have the measure reversed, and where all of that fails and the exclusion is permanent, some of them eventually conclude that the system offers them nothing and take up arms. Measured over a decade rather than a session, the fast route is frequently the slow one: Sri Lanka's language act of 1956 was passed in weeks and produced a war that consumed the country for twenty-six years. Belgium's arrangement is cumbersome and was ridiculed, and Belgium is intact. Stability is not a bonus that power sharing happens to deliver; it is the thing being bought, and the price is a slower legislature. There is a second practical point the critic misses: decisions taken with the affected group in the room are usually better decisions, because that group knows things the majority does not — which is the same reason a village council manages a hand-pump better than a distant ministry. The second answer is deeper and does not depend on outcomes at all. The critic assumes democracy means the larger number gets its way, and that anything limiting this is a departure from democracy — a cost to be justified. But counting is only the procedure; the justification for counting is that people should govern themselves rather than be governed by others. That justification does not stop applying to a person because there are fewer people like them. A citizen in a permanent minority who can never affect any decision that concerns them is, in every sense that matters, being ruled rather than self-governing, even though a ballot paper passes through their hands every five years. On this view, power sharing is not an external restraint on democracy but its own principle carried through consistently: those who must live with a decision have a claim to a share in making it. That is why the textbook says democracy is power sharing, rather than saying democracy sometimes permits it. Two qualifications keep the argument honest. Power sharing can genuinely be designed badly — arrangements that give tiny groups a veto over everything can freeze a country, and some consociational systems have entrenched the very divisions they were meant to manage by making every office a communal quota. And it is not a substitute for majority rule; it constrains what the majority may do to a minority, not the majority's ordinary right to govern. The claim is not that the larger group should never prevail. It is that it should never be able to make the smaller one's position permanently intolerable — because a group that cannot be heard has, in the end, only one way left to be heard. (The wrong answers treat speed as the sole criterion, deny power sharing any practical value when its practical value is the main defence, or deny arrangements that Belgium, India, Switzerland and many federations document plainly.)",
          hi: "आलोचना गंभीर उत्तर की हक़दार है, और दो हैं, जो भिन्न स्तरों पर काम करते हैं। पहला विवेक-आधारित है और आलोचक से उसी की ज़मीन पर मिलता है। वह निर्णय लेने की लागत नाप रहा है और उसे टिकाने की लागत अनदेखी कर रहा है। जो सरकार तेज़ी से काम कर सकती है क्योंकि उसे कुछ नहीं रोकता, उसे फिर भी जो तय किया वह उस भूभाग में लागू करना है जहाँ वे लोग बसते हैं जिन्हें उसने अनसुना किया। वे लोग मत गिने जाते ही ग़ायब नहीं हो जाते। वे अदालत जाते हैं, सहयोग से इनकार करते हैं, हड़ताल करते हैं, सरकार को मतों से हटाकर उपाय पलटवाते हैं, और जहाँ यह सब विफल हो और बहिष्कार स्थायी हो, उनमें से कुछ अंततः निष्कर्ष निकालते हैं कि तंत्र उन्हें कुछ नहीं देता और हथियार उठा लेते हैं। एक सत्र के बजाय एक दशक पर नापो तो तेज़ रास्ता अक्सर धीमा निकलता है: श्रीलंका का 1956 का भाषा-अधिनियम हफ़्तों में पारित हुआ और ऐसा युद्ध पैदा किया जिसने छब्बीस वर्ष देश को खा लिया। बेल्जियम की व्यवस्था बोझिल है और उसका उपहास हुआ, और बेल्जियम अखंड है। स्थिरता ऐसा बोनस नहीं जो सत्ता-साझेदारी संयोग से दे दे; वही ख़रीदी जा रही चीज़ है, और क़ीमत धीमी विधायिका है। एक दूसरा व्यावहारिक बिंदु आलोचक चूकता है: जो निर्णय प्रभावित समूह के कमरे में रहते लिए जाते हैं वे आमतौर पर बेहतर निर्णय होते हैं, क्योंकि वह समूह वह जानता है जो बहुमत नहीं — यही कारण है कि ग्राम परिषद हैंडपंप दूर के मंत्रालय से बेहतर सँभालती है। दूसरा उत्तर गहरा है और परिणामों पर बिलकुल निर्भर नहीं। आलोचक मान लेता है कि लोकतंत्र का अर्थ है बड़ी संख्या की चले, और जो भी इसे सीमित करे वह लोकतंत्र से विचलन है — ऐसी लागत जिसे उचित ठहराना पड़े। पर गिनती केवल प्रक्रिया है; गिनती का औचित्य यह है कि लोग स्वयं शासन करें, दूसरों से शासित न हों। वह औचित्य किसी व्यक्ति पर लागू होना इसलिए बंद नहीं हो जाता कि उस जैसे लोग कम हैं। स्थायी अल्पमत में बैठा नागरिक जो अपने से जुड़े किसी निर्णय को कभी प्रभावित नहीं कर सकता, हर मायने में शासित है, स्वशासित नहीं — भले हर पाँच वर्ष में एक मतपत्र उसके हाथ से गुज़रता हो। इस दृष्टि से सत्ता की साझेदारी लोकतंत्र पर बाहरी अंकुश नहीं बल्कि उसका अपना सिद्धांत निरंतरता से निभाया गया: जिन्हें किसी निर्णय के साथ जीना है उनका उसे बनाने में हिस्से का दावा है। इसीलिए पाठ्यपुस्तक कहती है कि लोकतंत्र सत्ता की साझेदारी है, यह नहीं कि लोकतंत्र कभी-कभी उसकी अनुमति देता है। दो शर्तें तर्क को ईमानदार रखती हैं। सत्ता-साझेदारी सचमुच बुरी तरह रची जा सकती है — जो व्यवस्थाएँ नन्हे समूहों को हर चीज़ पर वीटो दें वे देश को जमा सकती हैं, और कुछ सामुदायिक-भागीदारी प्रणालियों ने हर पद को सांप्रदायिक कोटा बनाकर उन्हीं विभाजनों को गाड़ दिया जिन्हें सँभालना था। और वह बहुमत के शासन का विकल्प नहीं है; वह यह सीमित करती है कि बहुमत अल्पसंख्यक के साथ क्या कर सकता है, बहुमत का शासन करने का साधारण अधिकार नहीं। दावा यह नहीं कि बड़े समूह की कभी न चले। यह कि वह छोटे की स्थिति स्थायी रूप से असह्य कभी न बना सके — क्योंकि जिस समूह की सुनी न जा सके उसके पास अंततः सुने जाने का एक ही रास्ता बचता है। (ग़लत उत्तर गति को एकमात्र कसौटी मानते, सत्ता-साझेदारी को कोई व्यावहारिक मूल्य ही नहीं देते जबकि व्यावहारिक मूल्य ही मुख्य बचाव है, या उन व्यवस्थाओं को नकारते जिन्हें बेल्जियम, भारत, स्विट्ज़रलैंड और कई संघ साफ़ दर्ज करते हैं।)",
          mr: "टीका गंभीर उत्तराची हक्कदार, आणि दोन आहेत, जी वेगळ्या स्तरांवर काम करतात. पहिले विवेकाधारित आणि टीकाकाराला त्याच्याच भूमीवर भेटते. तो निर्णय घेण्याचा खर्च मोजतो आणि तो टिकवण्याचा खर्च दुर्लक्षतो. जे सरकार वेगाने कृती करू शकते कारण त्याला काहीच अडवत नाही, त्यालाही जे ठरवले ते त्या भूभागात राबवावे लागते जिथे त्याने डावललेले लोक राहतात. ती माणसे मते मोजली की नाहीशी होत नाहीत. ती न्यायालयात जातात, सहकार्य नाकारतात, संप करतात, सरकार मतांनी हटवून उपाय पलटवतात, आणि जिथे हे सर्व फसते आणि वगळणे कायमचे असते, त्यांतील काही अखेर निष्कर्ष काढतात की व्यवस्था त्यांना काहीच देत नाही आणि शस्त्रे उचलतात. एका अधिवेशनाऐवजी एका दशकावर मोजले तर वेगवान मार्ग अनेकदा मंद ठरतो: श्रीलंकेचा 1956 चा भाषा-कायदा आठवड्यांत संमत झाला आणि असे युद्ध घडवले ज्याने सव्वीस वर्षे देश खाल्ला. बेल्जियमची व्यवस्था अवजड आणि तिची थट्टा झाली, आणि बेल्जियम अखंड आहे. स्थैर्य हा सत्ता-विभागणी योगायोगाने देत असलेला बोनस नाही; तीच विकत घेतली जाणारी गोष्ट, आणि किंमत मंद विधिमंडळ. एक दुसरा व्यावहारिक मुद्दा टीकाकार चुकवतो: जे निर्णय बाधित गट खोलीत असताना घेतले जातात ते सहसा अधिक चांगले निर्णय, कारण तो गट ते जाणतो जे बहुमताला माहीत नाही — हेच कारण की ग्रामसभा हातपंप दूरच्या मंत्रालयाहून चांगला सांभाळते. दुसरे उत्तर अधिक खोल आणि निकालांवर मुळीच अवलंबून नाही. टीकाकार गृहीत धरतो की लोकशाही म्हणजे मोठ्या संख्येचे चालावे, आणि जे काही हे मर्यादित करते ते लोकशाहीपासूनचे विचलन — समर्थावा लागणारा खर्च. पण मोजणी ही केवळ प्रक्रिया; मोजणीचे समर्थन हे की लोकांनी स्वतःचे शासन करावे, इतरांकडून शासित होऊ नये. ते समर्थन एखाद्या व्यक्तीला यासाठी लागू होणे थांबत नाही की तिच्यासारखी माणसे कमी आहेत. कायमच्या अल्पसंख्याकात बसलेला नागरिक जो स्वतःशी संबंधित कोणताही निर्णय कधीही प्रभावित करू शकत नाही, तो प्रत्येक अर्थाने शासित आहे, स्वशासित नाही — जरी दर पाच वर्षांनी एक मतपत्र त्याच्या हातातून जात असले तरी. या दृष्टीने सत्तेची विभागणी लोकशाहीवरील बाहेरचा अंकुश नव्हे तर तिचेच तत्त्व सातत्याने निभावलेले: ज्यांना निर्णयासोबत जगावे लागेल त्यांचा तो घडवण्यात वाट्याचा हक्क. म्हणूनच पाठ्यपुस्तक म्हणते की लोकशाही म्हणजेच सत्तेची विभागणी, हे नाही की लोकशाही कधीकधी तिला परवानगी देते. दोन अटी युक्तिवाद प्रामाणिक ठेवतात. सत्ता-विभागणी खरोखर वाईट रचता येते — ज्या व्यवस्था लहानशा गटांना प्रत्येक गोष्टीवर नकाराधिकार देतात त्या देश गोठवू शकतात, आणि काही सामुदायिक-भागीदारी पद्धतींनी प्रत्येक पद जातीय कोटा करून त्याच फुटी रुजवल्या ज्या सांभाळायच्या होत्या. आणि ती बहुमताच्या राज्याचा पर्याय नाही; ती बहुमत अल्पसंख्याकाशी काय करू शकतो हे मर्यादित करते, बहुमताचा राज्य करण्याचा सामान्य हक्क नव्हे. दावा हा नाही की मोठ्या गटाचे कधीच चालू नये. तो हा की त्याने लहानाची स्थिती कायमची असह्य कधीही करू नये — कारण ज्या गटाचे ऐकले जाऊ शकत नाही त्याच्याकडे अखेर ऐकले जाण्याचा एकच मार्ग उरतो. (चुकीची उत्तरे गतीला एकमेव कसोटी मानतात, सत्ता-विभागणीला कोणतेही व्यावहारिक मोल देत नाहीत तर व्यावहारिक मोलच मुख्य बचाव आहे, वा बेल्जियम, भारत, स्वित्झर्लंड आणि अनेक संघराज्ये स्पष्ट नोंदवत असलेल्या व्यवस्था नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Federalism                                                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-10-federalism",
    subject: "CIVICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 2 — Federalism",
      hi: "अध्याय 2 — संघवाद",
      mr: "प्रकरण 2 — संघराज्यवाद",
    },
    name: {
      en: "Federalism",
      hi: "संघवाद",
      mr: "संघराज्यवाद",
    },
    summary: {
      en: "One country and more than one government, each with a constitution behind it: three lists deciding who may legislate on what, two very different reasons a federation comes into being, states drawn along the lines people actually speak, and the amendment that finally made the village council a government rather than an errand.",
      hi: "एक देश और एक से अधिक सरकारें, हर एक के पीछे संविधान: तीन सूचियाँ जो तय करती हैं कौन किस पर क़ानून बना सकता, संघ बनने के दो बहुत भिन्न कारण, लोग जो भाषा वास्तव में बोलते उन्हीं रेखाओं पर खींचे राज्य, और वह संशोधन जिसने अंततः ग्राम परिषद को फ़रमाइश नहीं, सरकार बनाया।",
      mr: "एक देश आणि एकाहून अधिक शासने, प्रत्येकामागे राज्यघटना: कोण कशावर कायदा करू शकतो हे ठरवणाऱ्या तीन याद्या, संघराज्य निर्माण होण्याची दोन खूप वेगळी कारणे, लोक प्रत्यक्षात जी भाषा बोलतात त्याच रेषांवर आखलेली राज्ये, आणि ती दुरुस्ती जिने अखेर ग्रामसभेला फर्मान नव्हे तर शासन बनवले.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "federal-division-of-powers",
        name: {
          en: "The federal division of powers",
          hi: "संघीय शक्ति-विभाजन",
          mr: "संघराज्यीय सत्ता-विभाजन",
        },
        kind: "idea",
        prompt: {
          en: "Two levels of government exist over the same territory and the same citizens, each drawing its authority from the constitution rather than from the other, and neither able to abolish the other by ordinary law. What arrangement is this?",
          hi: "एक ही भूभाग और एक ही नागरिकों पर शासन के दो स्तर हैं, हर एक अपनी सत्ता दूसरे से नहीं संविधान से लेता, और कोई साधारण क़ानून से दूसरे को समाप्त नहीं कर सकता। यह कौन-सी व्यवस्था है?",
          mr: "एकाच भूभागावर आणि एकाच नागरिकांवर शासनाचे दोन स्तर आहेत, प्रत्येक आपली सत्ता दुसऱ्याकडून नव्हे तर राज्यघटनेकडून घेतो, आणि कोणीही साधारण कायद्याने दुसऱ्याला संपवू शकत नाही. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "A federal division of powers gives two or more levels of government authority over the same people and territory, with each level's powers specified in the constitution so that neither can be abolished or overridden by the other at will.",
          hi: "संघीय शक्ति-विभाजन एक ही जनता और भूभाग पर शासन के दो या अधिक स्तरों को सत्ता देता है, जहाँ हर स्तर की शक्तियाँ संविधान में लिखी होती हैं ताकि कोई दूसरे को मर्ज़ी से समाप्त या अनसुना न कर सके।",
          mr: "संघराज्यीय सत्ता-विभाजन एकाच जनतेवर आणि भूभागावर शासनाच्या दोन वा अधिक स्तरांना सत्ता देते, जिथे प्रत्येक स्तराच्या सत्ता राज्यघटनेत लिहिलेल्या असतात जेणेकरून कोणीही दुसऱ्याला मर्जीने संपवू वा डावलू शकणार नाही.",
        },
        detail: {
          en: "It differs from a unitary system, where the central government may create, alter or abolish a lower unit whenever it chooses, because there the lower unit's power is lent rather than owned.",
          hi: "यह एकात्मक प्रणाली से भिन्न है, जहाँ केंद्र सरकार जब चाहे किसी निचली इकाई को बना, बदल या समाप्त कर सकती है, क्योंकि वहाँ निचली इकाई की शक्ति उधार दी हुई है, उसकी अपनी नहीं।",
          mr: "ती एकात्म पद्धतीहून वेगळी, जिथे केंद्र सरकार हवे तेव्हा खालचे एकक बनवू, बदलू वा संपवू शकते, कारण तिथे खालच्या एककाची सत्ता उसनी असते, स्वतःची नाही.",
        },
        extra: {
          en: "Disputes between the levels are settled by the courts, which is why an independent judiciary is part of the federal design rather than an accessory to it.",
          hi: "स्तरों के बीच विवाद अदालतें सुलझाती हैं, इसीलिए स्वतंत्र न्यायपालिका संघीय रचना का अंग है, उसका सहायक भर नहीं।",
          mr: "स्तरांमधील वाद न्यायालये सोडवतात, म्हणूनच स्वतंत्र न्यायपालिका संघराज्यीय रचनेचा भाग आहे, तिची जोड नव्हे.",
        },
        pair: {
          left: {
            en: "Two governments, both drawing power from the constitution",
            hi: "दो सरकारें, दोनों संविधान से शक्ति लेतीं",
            mr: "दोन शासने, दोन्ही राज्यघटनेतून सत्ता घेणारी",
          },
          right: {
            en: "the federal division of powers",
            hi: "संघीय शक्ति-विभाजन",
            mr: "संघराज्यीय सत्ता-विभाजन",
          },
        },
      },
      {
        id: "three-lists",
        name: {
          en: "The Union, State and Concurrent Lists",
          hi: "संघ, राज्य और समवर्ती सूचियाँ",
          mr: "संघ, राज्य आणि समवर्ती याद्या",
        },
        kind: "structure",
        prompt: {
          en: "Defence, foreign affairs and currency appear on one list; police, agriculture and irrigation on a second; education, forests and marriage on a third where both levels may legislate. What are these three called?",
          hi: "रक्षा, विदेश मामले और मुद्रा एक सूची में; पुलिस, कृषि और सिंचाई दूसरी में; शिक्षा, वन और विवाह तीसरी में जहाँ दोनों स्तर क़ानून बना सकते हैं। ये तीनों क्या कहलाती हैं?",
          mr: "संरक्षण, परराष्ट्र व्यवहार आणि चलन एका यादीत; पोलीस, शेती आणि जलसिंचन दुसऱ्यात; शिक्षण, वने आणि विवाह तिसऱ्यात जिथे दोन्ही स्तर कायदा करू शकतात. या तिन्ही काय म्हणतात?",
        },
        statement: {
          en: "The Indian Constitution divides subjects into the Union List, on which only Parliament may legislate; the State List, reserved to state legislatures; and the Concurrent List, on which both may legislate, with the Union law prevailing in a conflict.",
          hi: "भारतीय संविधान विषयों को बाँटता है — संघ सूची, जिस पर केवल संसद क़ानून बना सकती; राज्य सूची, जो राज्य विधानमंडलों को सुरक्षित; और समवर्ती सूची, जिस पर दोनों बना सकते, और टकराव में संघ का क़ानून चलता है।",
          mr: "भारतीय राज्यघटना विषय विभागते — संघ यादी, जिच्यावर फक्त संसद कायदा करू शकते; राज्य यादी, जी राज्य विधिमंडळांना राखीव; आणि समवर्ती यादी, जिच्यावर दोन्ही करू शकतात, आणि संघर्षात संघाचा कायदा चालतो.",
        },
        detail: {
          en: "Subjects that fit no list at all — the residuary powers, covering things nobody in 1950 had thought of — were given to the Union.",
          hi: "जो विषय किसी सूची में नहीं बैठते — अवशिष्ट शक्तियाँ, जो उन चीज़ों को ढकती हैं जिनके बारे में 1950 में किसी ने सोचा नहीं था — संघ को दी गईं।",
          mr: "जे विषय कोणत्याही यादीत बसत नाहीत — अवशिष्ट सत्ता, ज्या 1950 मध्ये कोणी विचारही न केलेल्या गोष्टी झाकतात — संघाला दिल्या.",
        },
        extra: {
          en: "The lists decide more than paperwork: whether a state may write its own agricultural marketing law, or must accept Parliament's, is settled entirely by which list the subject sits on.",
          hi: "सूचियाँ काग़ज़ी काम से अधिक तय करती हैं: कोई राज्य अपना कृषि-विपणन क़ानून लिख सकता है या उसे संसद का मानना होगा, यह पूरी तरह इससे सधता है कि विषय किस सूची में बैठा है।",
          mr: "याद्या कागदी कामाहून अधिक ठरवतात: एखादे राज्य स्वतःचा शेती-विपणन कायदा लिहू शकते की त्याला संसदेचा मानावा लागेल, हे पूर्णपणे विषय कोणत्या यादीत बसला यावरून ठरते.",
        },
        pair: {
          left: {
            en: "Who may legislate on what, written down in advance",
            hi: "कौन किस पर क़ानून बना सकता, पहले से लिखा",
            mr: "कोण कशावर कायदा करू शकतो, आधीच लिहिलेले",
          },
          right: {
            en: "the Union, State and Concurrent Lists",
            hi: "संघ, राज्य और समवर्ती सूचियाँ",
            mr: "संघ, राज्य आणि समवर्ती याद्या",
          },
        },
      },
      {
        id: "two-routes-to-federation",
        name: {
          en: "Coming together and holding together",
          hi: "साथ आना और साथ बनाए रखना",
          mr: "एकत्र येणे आणि एकत्र राखणे",
        },
        kind: "idea",
        prompt: {
          en: "The United States was formed by independent states pooling sovereignty and keeping most powers for themselves; India was one large country that devolved powers to states it created. Which two routes to federation are these?",
          hi: "संयुक्त राज्य अमेरिका स्वतंत्र राज्यों द्वारा संप्रभुता एकत्र कर और अधिकांश शक्तियाँ अपने पास रखकर बना; भारत एक बड़ा देश था जिसने अपने बनाए राज्यों को शक्तियाँ सौंपीं। ये संघ बनने के कौन-से दो मार्ग हैं?",
          mr: "अमेरिका स्वतंत्र राज्यांनी सार्वभौमत्व एकत्र करून आणि बहुतांश सत्ता स्वतःकडे ठेवून बनली; भारत एक मोठा देश होता ज्याने स्वतः निर्माण केलेल्या राज्यांना सत्ता सोपवल्या. हे संघराज्य बनण्याचे कोणते दोन मार्ग?",
        },
        statement: {
          en: "In a coming-together federation independent states pool sovereignty and retain strong powers, while in a holding-together federation a single large country devolves powers to its constituent units, keeping the central government stronger.",
          hi: "साथ आने वाले संघ में स्वतंत्र राज्य संप्रभुता एकत्र करते और मज़बूत शक्तियाँ अपने पास रखते हैं, जबकि साथ बनाए रखने वाले संघ में एक बड़ा देश अपनी घटक इकाइयों को शक्तियाँ सौंपता है और केंद्र सरकार अधिक मज़बूत रखता है।",
          mr: "एकत्र येणाऱ्या संघराज्यात स्वतंत्र राज्ये सार्वभौमत्व एकत्र करतात आणि बलवान सत्ता स्वतःकडे ठेवतात, तर एकत्र राखणाऱ्या संघराज्यात एक मोठा देश आपल्या घटक एककांना सत्ता सोपवतो आणि केंद्र सरकार अधिक बलवान ठेवतो.",
        },
        detail: {
          en: "The difference shows in the details: in the first kind all units usually have equal powers, while in the second some may be given special arrangements suited to their circumstances.",
          hi: "अंतर विवरण में दिखता है: पहली तरह में सब इकाइयों की शक्तियाँ आमतौर पर बराबर होती हैं, जबकि दूसरी में कुछ को उनकी परिस्थितियों के अनुकूल विशेष व्यवस्थाएँ दी जा सकती हैं।",
          mr: "फरक तपशिलात दिसतो: पहिल्या प्रकारात सर्व एककांच्या सत्ता सहसा समान असतात, तर दुसऱ्यात काहींना त्यांच्या परिस्थितीला अनुकूल विशेष व्यवस्था दिल्या जाऊ शकतात.",
        },
        extra: {
          en: "India, Spain and Belgium belong to the second kind, and each was holding together a country whose regions might otherwise have wanted out.",
          hi: "भारत, स्पेन और बेल्जियम दूसरी तरह के हैं, और हर एक ऐसे देश को साथ बनाए रख रहा था जिसके क्षेत्र अन्यथा बाहर जाना चाह सकते थे।",
          mr: "भारत, स्पेन आणि बेल्जियम दुसऱ्या प्रकारचे, आणि प्रत्येक असा देश एकत्र राखत होता ज्याच्या प्रदेशांना एरवी बाहेर पडायचे असते.",
        },
        pair: {
          left: {
            en: "States pooling sovereignty, versus a country devolving it",
            hi: "संप्रभुता एकत्र करते राज्य, बनाम उसे सौंपता देश",
            mr: "सार्वभौमत्व एकत्र करणारी राज्ये, विरुद्ध ते सोपवणारा देश",
          },
          right: {
            en: "coming together and holding together",
            hi: "साथ आना और साथ बनाए रखना",
            mr: "एकत्र येणे आणि एकत्र राखणे",
          },
        },
      },
      {
        id: "linguistic-states",
        name: {
          en: "Linguistic states",
          hi: "भाषायी राज्य",
          mr: "भाषिक राज्ये",
        },
        kind: "event",
        prompt: {
          en: "From 1956 the boundaries of many provinces inherited from British rule were redrawn so that people speaking the same language and sharing a culture were grouped into one unit — a change many leaders had feared. What is this reorganisation called?",
          hi: "1956 से ब्रिटिश शासन से विरासत में मिले कई प्रांतों की सीमाएँ ऐसे फिर खींची गईं कि एक ही भाषा बोलते और संस्कृति साझा करते लोग एक इकाई में आ जाएँ — ऐसा बदलाव जिससे कई नेता डरते थे। यह पुनर्गठन क्या कहलाता है?",
          mr: "1956 पासून ब्रिटिश राजवटीतून वारशाने मिळालेल्या अनेक प्रांतांच्या सीमा अशा पुन्हा आखल्या गेल्या की एकच भाषा बोलणारे आणि संस्कृती वाटणारे लोक एका एककात यावेत — असा बदल ज्याची अनेक नेत्यांना भीती होती. हे पुनर्रचना काय म्हणतात?",
        },
        statement: {
          en: "The creation of linguistic states redrew India's internal boundaries from 1956 so that each state broadly grouped speakers of a common language, replacing borders inherited from colonial administration.",
          hi: "भाषायी राज्यों के निर्माण ने 1956 से भारत की आंतरिक सीमाएँ ऐसे फिर खींचीं कि हर राज्य मोटे तौर पर एक साझा भाषा बोलने वालों को समेटे, और औपनिवेशिक प्रशासन से विरासत में मिली सीमाएँ बदलीं।",
          mr: "भाषिक राज्यांच्या निर्मितीने 1956 पासून भारताच्या अंतर्गत सीमा अशा पुन्हा आखल्या की प्रत्येक राज्य ढोबळमानाने एक समान भाषा बोलणाऱ्यांना सामावेल, आणि वसाहती प्रशासनातून वारशाने आलेल्या सीमा बदलल्या.",
        },
        detail: {
          en: "The fear at the time was explicit: leaders warned that recognising language would encourage separatism and break the young country apart.",
          hi: "उस समय का डर स्पष्ट था: नेताओं ने चेताया कि भाषा को मान्यता देना अलगाववाद बढ़ाएगा और नए देश को तोड़ देगा।",
          mr: "त्या वेळची भीती स्पष्ट होती: नेत्यांनी इशारा दिला की भाषेला मान्यता देणे फुटीरतावाद वाढवेल आणि नवा देश तोडेल.",
        },
        extra: {
          en: "It did the opposite: administration became easier in a language people actually understood, and the demand having been met, it stopped being a grievance to organise around.",
          hi: "हुआ उल्टा: प्रशासन उस भाषा में आसान हुआ जो लोग सचमुच समझते थे, और माँग पूरी हो जाने पर वह ऐसी शिकायत नहीं रही जिसके गिर्द संगठित हुआ जाए।",
          mr: "झाले उलट: प्रशासन त्या भाषेत सोपे झाले जी लोक खरोखर समजत, आणि मागणी पूर्ण झाल्यावर ती संघटित होण्याजोगी तक्रार उरली नाही.",
        },
        pair: {
          left: {
            en: "Borders redrawn along the lines people speak",
            hi: "लोग जो बोलते उन्हीं रेखाओं पर फिर खींची सीमाएँ",
            mr: "लोक जे बोलतात त्याच रेषांवर पुन्हा आखलेल्या सीमा",
          },
          right: {
            en: "linguistic states",
            hi: "भाषायी राज्य",
            mr: "भाषिक राज्ये",
          },
        },
      },
      {
        id: "language-policy",
        name: {
          en: "The language policy",
          hi: "भाषा नीति",
          mr: "भाषा धोरण",
        },
        kind: "idea",
        prompt: {
          en: "Hindi was named the official language but not the national one, twenty-one other languages were given scheduled status, and the promised switch away from English was postponed indefinitely after protests in the south. Which policy is this?",
          hi: "हिंदी को राजभाषा कहा गया पर राष्ट्रभाषा नहीं, इक्कीस अन्य भाषाओं को अनुसूचित दर्जा दिया गया, और दक्षिण के विरोधों के बाद अंग्रेज़ी से हटने का वादा किया गया बदलाव अनिश्चित काल के लिए टाल दिया गया। यह कौन-सी नीति है?",
          mr: "हिंदीला राजभाषा म्हटले पण राष्ट्रभाषा नाही, एकवीस इतर भाषांना अनुसूचित दर्जा दिला, आणि दक्षिणेतील निषेधांनंतर इंग्रजीपासून दूर जाण्याचा वचन दिलेला बदल अनिश्चित काळासाठी पुढे ढकलला. हे कोणते धोरण?",
        },
        statement: {
          en: "India's language policy made Hindi the official language without declaring it the national language, recognised many other languages in the Eighth Schedule, and kept English alongside Hindi for official use.",
          hi: "भारत की भाषा नीति ने हिंदी को राजभाषा बनाया पर राष्ट्रभाषा घोषित नहीं किया, आठवीं अनुसूची में कई अन्य भाषाओं को मान्यता दी, और सरकारी उपयोग में हिंदी के साथ अंग्रेज़ी बनाए रखी।",
          mr: "भारताच्या भाषा धोरणाने हिंदीला राजभाषा केले पण राष्ट्रभाषा घोषित केले नाही, आठव्या अनुसूचीत अनेक इतर भाषांना मान्यता दिली, आणि शासकीय वापरात हिंदीसोबत इंग्रजी ठेवली.",
        },
        detail: {
          en: "The 1965 deadline for dropping English was abandoned when Tamil Nadu erupted in protest, and the flexibility is exactly why the issue did not become a permanent wound.",
          hi: "अंग्रेज़ी हटाने की 1965 की समय-सीमा तब छोड़ी गई जब तमिलनाडु विरोध में उबल पड़ा, और वही लचीलापन कारण है कि मुद्दा स्थायी घाव नहीं बना।",
          mr: "इंग्रजी हटवण्याची 1965 ची मुदत तेव्हा सोडली गेली जेव्हा तमिळनाडू निषेधात उसळला, आणि तीच लवचीकता कारण की मुद्दा कायमची जखम बनला नाही.",
        },
        extra: {
          en: "The contrast with Sri Lanka is direct: there the majority's language was imposed and the country went to war; here the deadline was dropped and the union held.",
          hi: "श्रीलंका से विरोध सीधा है: वहाँ बहुमत की भाषा थोपी गई और देश युद्ध में गया; यहाँ समय-सीमा छोड़ी गई और संघ टिका रहा।",
          mr: "श्रीलंकेशी विरोध थेट: तिथे बहुमताची भाषा लादली गेली आणि देश युद्धात गेला; इथे मुदत सोडली गेली आणि संघ टिकला.",
        },
        pair: {
          left: {
            en: "An official language, but no national one imposed",
            hi: "एक राजभाषा, पर थोपी कोई राष्ट्रभाषा नहीं",
            mr: "एक राजभाषा, पण लादलेली कोणती राष्ट्रभाषा नाही",
          },
          right: {
            en: "the language policy",
            hi: "भाषा नीति",
            mr: "भाषा धोरण",
          },
        },
      },
      {
        id: "decentralisation-1992",
        name: {
          en: "Decentralisation after 1992",
          hi: "1992 के बाद विकेंद्रीकरण",
          mr: "1992 नंतरचे विकेंद्रीकरण",
        },
        kind: "event",
        prompt: {
          en: "A constitutional amendment made local body elections compulsory rather than optional, reserved a third of all seats and chairperson posts for women, and set up a State Election Commission and Finance Commission to run and fund them. Which reform is this?",
          hi: "एक संवैधानिक संशोधन ने स्थानीय निकायों के चुनाव वैकल्पिक नहीं अनिवार्य बनाए, सब सीटों तथा अध्यक्ष-पदों का एक-तिहाई स्त्रियों के लिए आरक्षित किया, और उन्हें चलाने तथा वित्तपोषित करने राज्य निर्वाचन आयोग और वित्त आयोग बनाए। यह कौन-सा सुधार है?",
          mr: "एका घटनादुरुस्तीने स्थानिक संस्थांच्या निवडणुका ऐच्छिक नव्हे तर सक्तीच्या केल्या, सर्व जागा व अध्यक्षपदांचा एक-तृतीयांश स्त्रियांसाठी राखीव ठेवला, आणि त्या चालवायला व अर्थपुरवठा करायला राज्य निवडणूक आयोग व वित्त आयोग स्थापले. ही कोणती सुधारणा?",
        },
        statement: {
          en: "The 1992 amendments made regular elections to panchayats and municipalities compulsory, reserved one-third of seats for women and a share for Scheduled Castes and Tribes, and created a State Election Commission and a State Finance Commission.",
          hi: "1992 के संशोधनों ने पंचायतों तथा नगरपालिकाओं के नियमित चुनाव अनिवार्य किए, एक-तिहाई सीटें स्त्रियों के लिए और एक हिस्सा अनुसूचित जातियों-जनजातियों के लिए आरक्षित किया, और राज्य निर्वाचन आयोग तथा राज्य वित्त आयोग बनाए।",
          mr: "1992 च्या दुरुस्त्यांनी पंचायती व नगरपालिकांच्या नियमित निवडणुका सक्तीच्या केल्या, एक-तृतीयांश जागा स्त्रियांसाठी आणि एक वाटा अनुसूचित जाती-जमातींसाठी राखीव ठेवला, आणि राज्य निवडणूक आयोग व राज्य वित्त आयोग स्थापले.",
        },
        detail: {
          en: "The two commissions are what give the reform teeth: without an independent body to hold elections and a formula for sharing revenue, a state can starve local bodies while keeping them nominally alive.",
          hi: "दोनों आयोग ही सुधार को दाँत देते हैं: चुनाव कराने वाली स्वतंत्र संस्था और राजस्व बाँटने के सूत्र के बिना कोई राज्य स्थानीय निकायों को नाम भर ज़िंदा रखते हुए भूखा रख सकता है।",
          mr: "दोन्ही आयोगच सुधारणेला दात देतात: निवडणुका घेणारी स्वतंत्र संस्था आणि महसूल वाटण्याचे सूत्र यांविना एखादे राज्य स्थानिक संस्था नावापुरत्या जिवंत ठेवून उपाशी ठेवू शकते.",
        },
        extra: {
          en: "The reservation created over a million elected women representatives, more than in the rest of the world's local governments put together.",
          hi: "आरक्षण ने दस लाख से अधिक निर्वाचित महिला प्रतिनिधि बनाईं, जो शेष विश्व की स्थानीय सरकारों की कुल संख्या से अधिक हैं।",
          mr: "आरक्षणाने दहा लाखांहून अधिक निवडून आलेल्या महिला प्रतिनिधी घडवल्या, ज्या उर्वरित जगातील स्थानिक शासनांच्या एकत्रित संख्येहून अधिक.",
        },
        pair: {
          left: {
            en: "Local elections made compulsory, a third of seats to women",
            hi: "स्थानीय चुनाव अनिवार्य, एक-तिहाई सीटें स्त्रियों को",
            mr: "स्थानिक निवडणुका सक्तीच्या, एक-तृतीयांश जागा स्त्रियांना",
          },
          right: {
            en: "decentralisation after 1992",
            hi: "1992 के बाद विकेंद्रीकरण",
            mr: "1992 नंतरचे विकेंद्रीकरण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "When India was being reorganised on linguistic lines, senior leaders warned that recognising language as a basis for statehood would feed separatism and break the country apart. Seventy years on, the union is intact and language is rarely a secessionist issue. Explain why the fear proved wrong.",
          hi: "जब भारत का भाषायी आधार पर पुनर्गठन हो रहा था, वरिष्ठ नेताओं ने चेताया कि भाषा को राज्य-निर्माण का आधार मानना अलगाववाद को खाद देगा और देश को तोड़ देगा। सत्तर वर्ष बाद संघ अखंड है और भाषा शायद ही कभी अलगाववादी मुद्दा है। समझाओ वह डर ग़लत क्यों सिद्ध हुआ।",
          mr: "जेव्हा भारताची भाषिक आधारावर पुनर्रचना होत होती, ज्येष्ठ नेत्यांनी इशारा दिला की भाषेला राज्यनिर्मितीचा आधार मानणे फुटीरतावादाला खतपाणी घालेल आणि देश तोडेल. सत्तर वर्षांनंतर संघ अखंड आहे आणि भाषा क्वचितच फुटीरतावादी मुद्दा. समजावा ती भीती चुकीची का ठरली.",
        },
        choices: [
          {
            en: "Because the demand was for recognition within India, not exit from it — and once it was granted, the grievance that could have been organised around simply disappeared. Administration, courts and schooling in a language people actually understood also made government work better and reach further. Refusing would have left a permanent, mobilising complaint, which is exactly what happened where linguistic demands were suppressed elsewhere",
            hi: "क्योंकि माँग भारत के भीतर मान्यता की थी, उससे बाहर निकलने की नहीं — और मान्यता मिलते ही वह शिकायत, जिसके गिर्द संगठित हुआ जा सकता था, बस ग़ायब हो गई। जिस भाषा को लोग सचमुच समझते उसमें प्रशासन, अदालतें और पढ़ाई ने शासन को बेहतर और कहीं दूर तक पहुँचने वाला भी बनाया। इनकार करने पर एक स्थायी, गोलबंद करती शिकायत बची रहती — ठीक वही जो अन्यत्र भाषायी माँगें दबाने पर हुआ",
            mr: "कारण मागणी भारताच्या आत मान्यतेची होती, त्यातून बाहेर पडण्याची नाही — आणि मान्यता मिळताच ती तक्रार, जिच्याभोवती संघटित होता आले असते, फक्त नाहीशी झाली. लोक ज्या भाषेत खरोखर समजतात त्यात प्रशासन, न्यायालये आणि शिक्षणाने शासन अधिक चांगले आणि दूरवर पोहोचणारेही केले. नकार दिला असता तर कायमची, एकत्र आणणारी तक्रार उरली असती — नेमके तेच जे इतरत्र भाषिक मागण्या दडपल्यावर घडले",
          },
          {
            en: "Because language turned out to matter to nobody, so the reorganisation had no effect either way",
            hi: "क्योंकि भाषा किसी के लिए मायने ही नहीं रखती निकली, अतः पुनर्गठन का किसी भी ओर कोई प्रभाव नहीं हुआ",
            mr: "कारण भाषा कोणासाठीही महत्त्वाची नाही असे निघाले, म्हणून पुनर्रचनेचा कोणत्याही बाजूने परिणाम झाला नाही",
          },
          {
            en: "Because the union survived only through military suppression of every linguistic movement",
            hi: "क्योंकि संघ केवल हर भाषायी आंदोलन के सैन्य दमन से बचा",
            mr: "कारण संघ केवळ प्रत्येक भाषिक चळवळीच्या लष्करी दडपशाहीने टिकला",
          },
          {
            en: "Because the reorganisation was never carried out and state boundaries remain exactly as the British left them",
            hi: "क्योंकि पुनर्गठन कभी हुआ ही नहीं और राज्य-सीमाएँ ठीक वैसी हैं जैसी अंग्रेज़ छोड़ गए थे",
            mr: "कारण पुनर्रचना कधी झालीच नाही आणि राज्यसीमा नेमक्या तशाच आहेत जशा ब्रिटिश सोडून गेले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The fear was reasonable when it was expressed, and understanding why it failed tells you something general about how identity claims behave. The anxiety rested on an assumption: that giving political recognition to a linguistic identity strengthens it, and a strengthened identity will eventually want a state of its own outside India. Leaders had just watched Partition and were not being foolish. But the assumption skips a step, and the step is what the demand actually was. The movements — Telugu speakers seeking Andhra, then Marathi, Gujarati, Kannada and others — were not asking to leave India. They were asking for a unit within India in which their language could be the language of administration, of the courts, of schooling and of public life. That is a demand for a place inside the arrangement, and it is satisfiable. Once satisfied, it stops existing. This is the crucial mechanism: a grievance is a resource for political mobilisation, and a met demand is no longer a grievance. After 1956 nobody could organise a mass movement around a claim that had already been conceded. Consider what refusal would have produced instead. The languages would not have disappeared; people would have continued speaking them, and would have continued dealing with a state administration conducted in a language they did not use. Every court appearance, every school certificate, every government form would have been a daily reminder of exclusion. That is a standing, renewable grievance, and it accumulates. The Sri Lankan comparison in this chapter makes the point exactly: a linguistic demand that was refused escalated from petition to protest to separatism to war, in a country far smaller and with far less diversity to manage. There is a second, less dramatic reason the reorganisation strengthened the union: it made government work better. Administration in a language the population actually understands is more efficient, more accountable and more accessible. Records can be read by the people they concern; a farmer can follow a court case; primary education can be delivered in the mother tongue, which is measurably better for learning. A state that functions in a language people know earns loyalty by being useful, not merely by being conceded. Two honest qualifications. Linguistic states did not end all boundary disputes — Belgaum, and later demands for Telangana, Uttarakhand and Jharkhand, show that language is not the only identity people organise around, and that the map is never finally settled. And the union held for reasons beyond language policy too: a shared freedom movement, a functioning democracy through which discontent could be expressed, and economic integration all played their part. But the specific prediction — that recognising language would produce break-up — was falsified, and the mechanism is clear enough to state as a rule: identity claims are dangerous to a state when they are refused, not when they are accommodated. (The wrong answers deny that language mattered, invent military suppression, or deny a reorganisation that redrew nearly every internal boundary in the country.)",
          hi: "जब वह डर व्यक्त हुआ तब वह उचित था, और वह विफल क्यों हुआ यह समझना पहचान-दावों के बरतने के बारे में कुछ सामान्य बताता है। चिंता एक मान्यता पर टिकी थी: कि भाषायी पहचान को राजनीतिक मान्यता देना उसे मज़बूत करता है, और मज़बूत हुई पहचान अंततः भारत से बाहर अपना राज्य चाहेगी। नेताओं ने अभी-अभी विभाजन देखा था और वे मूर्खता नहीं कर रहे थे। पर मान्यता एक चरण छोड़ देती है, और वह चरण यह कि माँग वस्तुतः थी क्या। आंदोलन — तेलुगु भाषी आंध्र माँगते, फिर मराठी, गुजराती, कन्नड़ और अन्य — भारत छोड़ने को नहीं कह रहे थे। वे भारत के भीतर ऐसी इकाई माँग रहे थे जिसमें उनकी भाषा प्रशासन, अदालतों, पढ़ाई और सार्वजनिक जीवन की भाषा हो सके। वह व्यवस्था के भीतर जगह की माँग है, और वह पूरी की जा सकती है। पूरी होते ही वह अस्तित्व में नहीं रहती। यही मुख्य क्रियाविधि है: शिकायत राजनीतिक गोलबंदी का संसाधन है, और पूरी हुई माँग अब शिकायत नहीं। 1956 के बाद कोई ऐसे दावे के गिर्द जन-आंदोलन खड़ा नहीं कर सकता था जो पहले ही मान लिया गया था। सोचो इनकार इसकी जगह क्या पैदा करता। भाषाएँ ग़ायब नहीं होतीं; लोग उन्हें बोलते रहते, और ऐसे राज्य-प्रशासन से निपटते रहते जो उस भाषा में चलता जिसे वे इस्तेमाल नहीं करते। हर अदालती पेशी, हर स्कूल प्रमाण-पत्र, हर सरकारी फ़ॉर्म बहिष्कार की दैनिक याद दिलाता। वह खड़ी, नवीकरणीय शिकायत है, और वह जमा होती जाती है। इस अध्याय की श्रीलंका-तुलना बात ठीक कहती है: ठुकराई गई भाषायी माँग याचिका से विरोध, अलगाववाद और युद्ध तक चढ़ी, उस देश में जो कहीं छोटा था और जिसे कहीं कम विविधता सँभालनी थी। एक दूसरा, कम नाटकीय कारण भी है कि पुनर्गठन ने संघ मज़बूत किया: उसने शासन बेहतर चलाया। जिस भाषा को आबादी सचमुच समझती है उसमें प्रशासन अधिक कुशल, अधिक जवाबदेह और अधिक सुलभ है। अभिलेख वे लोग पढ़ सकते हैं जिनसे वे जुड़े हैं; किसान अपना मुक़दमा समझ सकता है; प्राथमिक शिक्षा मातृभाषा में दी जा सकती है, जो सीखने के लिए मापने योग्य ढंग से बेहतर है। जो राज्य लोगों की जानी भाषा में चलता है वह उपयोगी होकर निष्ठा कमाता है, केवल रियायत देकर नहीं। दो ईमानदार शर्तें। भाषायी राज्यों ने सब सीमा-विवाद ख़त्म नहीं किए — बेलगाम, और बाद में तेलंगाना, उत्तराखंड तथा झारखंड की माँगें दिखाती हैं कि भाषा एकमात्र पहचान नहीं जिसके गिर्द लोग संगठित होते, और नक़्शा कभी अंतिम रूप से नहीं सधता। और संघ भाषा-नीति से परे कारणों से भी टिका: साझा स्वतंत्रता आंदोलन, चलता लोकतंत्र जिससे असंतोष व्यक्त हो सकता था, और आर्थिक एकीकरण — सबका अपना हिस्सा था। पर विशिष्ट भविष्यवाणी — कि भाषा को मान्यता देना विघटन देगा — झूठी सिद्ध हुई, और क्रियाविधि इतनी साफ़ है कि नियम कहा जा सके: पहचान-दावे किसी राज्य के लिए तब ख़तरनाक होते हैं जब उन्हें ठुकराया जाए, तब नहीं जब उन्हें समायोजित किया जाए। (ग़लत उत्तर नकारते कि भाषा मायने रखती थी, सैन्य दमन गढ़ते, या ऐसे पुनर्गठन को नकारते जिसने देश की लगभग हर आंतरिक सीमा फिर खींची।)",
          mr: "ती भीती व्यक्त झाली तेव्हा ती रास्त होती, आणि ती का फसली हे समजणे ओळख-दाव्यांच्या वर्तनाबद्दल काहीतरी सामान्य सांगते. चिंता एका गृहीतकावर टेकली होती: की भाषिक ओळखीला राजकीय मान्यता देणे तिला बळकट करते, आणि बळकट झालेली ओळख अखेर भारताबाहेर स्वतःचे राज्य मागेल. नेत्यांनी नुकतीच फाळणी पाहिली होती आणि ते मूर्खपणा करत नव्हते. पण गृहीतक एक पायरी वगळते, आणि ती पायरी म्हणजे मागणी प्रत्यक्षात काय होती. चळवळी — तेलुगू भाषिक आंध्र मागणारे, मग मराठी, गुजराती, कन्नड आणि इतर — भारत सोडायला सांगत नव्हत्या. त्या भारताच्या आत असे एकक मागत होत्या ज्यात त्यांची भाषा प्रशासन, न्यायालये, शिक्षण आणि सार्वजनिक जीवनाची भाषा असू शकेल. ती व्यवस्थेच्या आत जागेची मागणी, आणि ती पूर्ण करता येते. पूर्ण होताच ती अस्तित्वात राहत नाही. हीच मुख्य क्रियाविधी: तक्रार हे राजकीय एकत्रीकरणाचे साधन, आणि पूर्ण झालेली मागणी आता तक्रार नाही. 1956 नंतर कोणीही आधीच मान्य केलेल्या दाव्याभोवती जनचळवळ उभी करू शकत नव्हते. नकाराने त्याऐवजी काय घडले असते ते पाहा. भाषा नाहीशा झाल्या नसत्या; लोक त्या बोलत राहिले असते, आणि ते न वापरत असलेल्या भाषेत चालणाऱ्या राज्य-प्रशासनाशी व्यवहार करत राहिले असते. प्रत्येक न्यायालयीन हजेरी, प्रत्येक शाळेचे प्रमाणपत्र, प्रत्येक सरकारी अर्ज वगळण्याची रोजची आठवण ठरला असता. ती उभी, नवी होत राहणारी तक्रार, आणि ती साचत जाते. या प्रकरणातील श्रीलंका-तुलना मुद्दा नेमका मांडते: नाकारलेली भाषिक मागणी अर्जापासून निषेध, फुटीरतावाद आणि युद्धापर्यंत चढली, अशा देशात जो कितीतरी लहान होता आणि ज्याला कितीतरी कमी विविधता सांभाळायची होती. एक दुसरे, कमी नाट्यमय कारणही आहे की पुनर्रचनेने संघ बळकट केला: तिने शासन अधिक चांगले चालवले. लोकसंख्या जी भाषा खरोखर समजते तिच्यात प्रशासन अधिक कार्यक्षम, अधिक उत्तरदायी आणि अधिक सुलभ. नोंदी ज्यांच्याशी संबंधित तेच वाचू शकतात; शेतकरी आपला खटला समजू शकतो; प्राथमिक शिक्षण मातृभाषेत देता येते, जे शिकण्यासाठी मोजण्याजोगे चांगले. जे राज्य लोकांना कळणाऱ्या भाषेत चालते ते उपयुक्त होऊन निष्ठा कमावते, केवळ सवलत देऊन नाही. दोन प्रामाणिक अटी. भाषिक राज्यांनी सर्व सीमावाद संपवले नाहीत — बेळगाव, आणि नंतर तेलंगणा, उत्तराखंड व झारखंडच्या मागण्या दाखवतात की भाषा ही एकमेव ओळख नाही जिच्याभोवती लोक संघटित होतात, आणि नकाशा कधीही अंतिमतः ठरत नाही. आणि संघ भाषा-धोरणापलीकडच्या कारणांनीही टिकला: सामायिक स्वातंत्र्य चळवळ, चालणारी लोकशाही जिच्यातून असंतोष व्यक्त होऊ शकत होता, आणि आर्थिक एकात्मीकरण — सर्वांचा वाटा होता. पण विशिष्ट भाकीत — की भाषेला मान्यता देणे फूट देईल — खोटे ठरले, आणि क्रियाविधी इतकी स्पष्ट की नियम म्हणून सांगता येईल: ओळख-दावे एखाद्या राज्याला तेव्हा धोकादायक जेव्हा ते नाकारले जातात, तेव्हा नाही जेव्हा ते सामावले जातात. (चुकीची उत्तरे भाषा महत्त्वाची होती हे नाकारतात, लष्करी दडपशाही रचतात, वा देशातील जवळजवळ प्रत्येक अंतर्गत सीमा पुन्हा आखलेली पुनर्रचना नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "India's Constitution is federal, yet the Union holds the residuary powers, can legislate on the Concurrent List over a state's objection, appoints Governors, and may impose President's Rule on a state. A critic says this makes Indian federalism a formality. Assess the claim.",
          hi: "भारत का संविधान संघीय है, फिर भी संघ के पास अवशिष्ट शक्तियाँ हैं, वह राज्य की आपत्ति के बावजूद समवर्ती सूची पर क़ानून बना सकता है, राज्यपाल नियुक्त करता है, और किसी राज्य पर राष्ट्रपति शासन लगा सकता है। एक आलोचक कहता है इससे भारतीय संघवाद औपचारिकता भर रह जाता है। दावे को परखो।",
          mr: "भारताची राज्यघटना संघराज्यीय आहे, तरीही संघाकडे अवशिष्ट सत्ता आहेत, तो राज्याच्या आक्षेपाला न जुमानता समवर्ती यादीवर कायदा करू शकतो, राज्यपाल नेमतो, आणि एखाद्या राज्यावर राष्ट्रपती राजवट लादू शकतो. एक टीकाकार म्हणतो यामुळे भारतीय संघराज्यवाद केवळ औपचारिकता उरतो. दावा तपासा.",
        },
        choices: [
          {
            en: "The critic identifies real centralising features, which follow from India being a holding-together federation formed by devolution rather than by states pooling sovereignty. But the claim overstates: states hold constitutionally guaranteed subjects a Union law cannot simply take, disputes go to a court that has struck down misuse of President's Rule, and since coalition governments made regional parties necessary to power at the centre, the practical balance has shifted markedly towards the states",
            hi: "आलोचक असली केंद्रीकारी विशेषताएँ पहचानता है, जो इससे निकलती हैं कि भारत साथ बनाए रखने वाला संघ है — जो सत्ता सौंपकर बना, राज्यों द्वारा संप्रभुता एकत्र कर नहीं। पर दावा बढ़ा-चढ़ाकर कहता है: राज्यों के पास संविधान से सुनिश्चित विषय हैं जिन्हें कोई संघीय क़ानून बस ले नहीं सकता, विवाद उस अदालत में जाते हैं जिसने राष्ट्रपति शासन के दुरुपयोग को रद्द किया है, और जब से गठबंधन सरकारों ने क्षेत्रीय दलों को केंद्र की सत्ता के लिए ज़रूरी बनाया, व्यावहारिक संतुलन स्पष्ट रूप से राज्यों की ओर खिसका है",
            mr: "टीकाकार खऱ्या केंद्रीकरण करणाऱ्या वैशिष्ट्यांना ओळखतो, जी भारत एकत्र राखणारे संघराज्य असल्यातून निघतात — जे सत्ता सोपवून बनले, राज्यांनी सार्वभौमत्व एकत्र करून नाही. पण दावा अतिशयोक्त: राज्यांकडे राज्यघटनेने हमी दिलेले विषय आहेत जे कोणता संघीय कायदा फक्त घेऊ शकत नाही, वाद त्या न्यायालयात जातात ज्याने राष्ट्रपती राजवटीचा गैरवापर रद्द केला आहे, आणि जेव्हापासून आघाडी सरकारांनी प्रादेशिक पक्षांना केंद्रातील सत्तेसाठी आवश्यक केले, व्यावहारिक तोल स्पष्टपणे राज्यांकडे सरकला आहे",
          },
          {
            en: "The critic is entirely right: Indian states have no constitutional powers at all and function purely as administrative branches of Delhi",
            hi: "आलोचक पूरी तरह सही है: भारतीय राज्यों के पास कोई संवैधानिक शक्ति है ही नहीं और वे विशुद्ध रूप से दिल्ली की प्रशासनिक शाखाएँ हैं",
            mr: "टीकाकार पूर्णपणे बरोबर: भारतीय राज्यांकडे कोणतीही संवैधानिक सत्ता नाहीच आणि ती केवळ दिल्लीच्या प्रशासकीय शाखा आहेत",
          },
          {
            en: "The critic is wrong because the Union has no powers of any kind over the states in any circumstance",
            hi: "आलोचक ग़लत है क्योंकि संघ के पास किसी भी परिस्थिति में राज्यों पर किसी तरह की कोई शक्ति नहीं",
            mr: "टीकाकार चुकीचा कारण संघाकडे कोणत्याही परिस्थितीत राज्यांवर कोणत्याही प्रकारची सत्ता नाही",
          },
          {
            en: "The question cannot be assessed, since no constitution anywhere specifies which level holds which powers",
            hi: "प्रश्न परखा ही नहीं जा सकता, क्योंकि कहीं का कोई संविधान यह नहीं बताता कि कौन-सा स्तर कौन-सी शक्तियाँ रखता है",
            mr: "प्रश्न तपासताच येत नाही, कारण कुठलीही राज्यघटना कोणता स्तर कोणत्या सत्ता ठेवतो हे सांगत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The criticism is well aimed and partly correct, which is what makes it worth answering carefully rather than dismissing. Start by conceding the facts. India's Constitution really does tilt towards the centre. Residuary powers — everything not on any list — go to the Union, whereas in the United States they go to the states. Parliament can legislate on Concurrent List subjects and its law prevails over a state law in conflict. Parliament can alter a state's boundaries or even its existence by ordinary legislation, which no American state faces. Governors are appointed by the centre and have discretionary powers in forming state governments. Article 356 allows President's Rule, dismissing an elected state government. Financially, states depend heavily on transfers determined centrally. On paper, this is a strong centre. But these features are not an accident or a betrayal of federalism; they follow from what kind of federation India is. Where the United States was formed by thirteen already-sovereign states pooling powers and jealously keeping the rest, India was a single territory whose states were created by the Union — a holding-together federation, formed by devolution downwards rather than accumulation upwards. Such federations, including Spain and Belgium, characteristically keep a stronger centre, because the problem they are solving is holding a diverse country together rather than persuading separate states to combine. In 1947, with Partition just past and princely states being integrated, a weak centre was not a live option. Now the overstatement. First, the states' powers are not favours. The State List is constitutionally guaranteed; Parliament cannot simply pass an ordinary law taking over police or land revenue, and where it has stretched into state subjects, the legislation has been challenged. Second, the disputes are justiciable. The Supreme Court in the Bommai judgment of 1994 laid down that President's Rule is subject to judicial review, that a government's majority must be tested on the floor of the house rather than by a Governor's opinion, and that a dismissal found improper can be reversed. The frequency of Article 356 fell sharply afterwards — an indication that the constitutional check operated. Third, and most important, the practical balance has changed with the party system. In the era of single-party dominance a state government of the same party was in no position to resist the centre, and Article 356 was used freely. Since 1989, coalition governments have depended on regional parties for a majority, and those parties have used that leverage for their states — in the composition of finance commissions, in taxation decisions, in the sharing of central schemes. Federalism in practice is set by the distribution of political power as much as by the text. The fair verdict, then, is that Indian federalism is real but asymmetric and centre-leaning by design, and that its actual strength varies with who holds power rather than being fixed by the document alone. The critic is right that the text permits a strong centre; wrong that this makes the arrangement a formality — a formality is not something that produces litigation, judicial doctrine and hard bargaining, and Indian federalism produces all three. (The wrong answers deny states any constitutional powers, deny the Union any, or deny that constitutions allocate powers at all.)",
          hi: "आलोचना अच्छी तरह निशाना साधती है और आंशिक रूप से सही है, यही उसे झटकने के बजाय सावधानी से उत्तर देने योग्य बनाता है। तथ्य मानकर शुरू करो। भारत का संविधान सचमुच केंद्र की ओर झुका है। अवशिष्ट शक्तियाँ — जो किसी सूची में नहीं — संघ को जाती हैं, जबकि संयुक्त राज्य में वे राज्यों को। संसद समवर्ती सूची के विषयों पर क़ानून बना सकती है और टकराव में उसका क़ानून राज्य के क़ानून पर चलता है। संसद साधारण विधान से किसी राज्य की सीमाएँ या उसका अस्तित्व तक बदल सकती है, जिसका सामना किसी अमेरिकी राज्य को नहीं। राज्यपाल केंद्र नियुक्त करता है और राज्य सरकारें बनाने में उनके पास विवेकाधिकार हैं। अनुच्छेद 356 राष्ट्रपति शासन की छूट देता है, जो निर्वाचित राज्य सरकार बर्ख़ास्त कर देता है। वित्तीय रूप से राज्य केंद्रीय रूप से तय हस्तांतरणों पर भारी निर्भर हैं। काग़ज़ पर यह मज़बूत केंद्र है। पर ये विशेषताएँ संयोग या संघवाद से विश्वासघात नहीं; वे इससे निकलती हैं कि भारत किस तरह का संघ है। जहाँ संयुक्त राज्य पहले से संप्रभु तेरह राज्यों द्वारा शक्तियाँ एकत्र कर और शेष जतन से अपने पास रखकर बना, वहीं भारत एक ही भूभाग था जिसके राज्य संघ ने बनाए — साथ बनाए रखने वाला संघ, जो ऊपर की ओर संचय से नहीं बल्कि नीचे की ओर सत्ता सौंपकर बना। ऐसे संघ, जिनमें स्पेन और बेल्जियम भी हैं, विशिष्ट रूप से मज़बूत केंद्र रखते हैं, क्योंकि वे जो समस्या हल कर रहे हैं वह अलग राज्यों को जुड़ने के लिए मनाना नहीं बल्कि विविध देश को साथ थामना है। 1947 में, विभाजन अभी बीता और रियासतें एकीकृत होते हुए, कमज़ोर केंद्र कोई जीवित विकल्प नहीं था। अब अतिशयोक्ति। पहला, राज्यों की शक्तियाँ कृपा नहीं हैं। राज्य सूची संविधान से सुनिश्चित है; संसद साधारण क़ानून पारित कर पुलिस या भू-राजस्व नहीं ले सकती, और जहाँ वह राज्य-विषयों में फैली है वहाँ विधान चुनौती पाया है। दूसरा, विवाद न्याय-योग्य हैं। 1994 के बोम्मई निर्णय में उच्चतम न्यायालय ने तय किया कि राष्ट्रपति शासन न्यायिक समीक्षा के अधीन है, कि सरकार का बहुमत राज्यपाल की राय से नहीं सदन के पटल पर परखा जाना चाहिए, और कि अनुचित पाई गई बर्ख़ास्तगी पलटी जा सकती है। उसके बाद अनुच्छेद 356 की बारंबारता तेज़ी से गिरी — संकेत कि संवैधानिक नियंत्रण काम कर रहा था। तीसरा, और सबसे महत्वपूर्ण, व्यावहारिक संतुलन दल-प्रणाली के साथ बदला है। एकदलीय प्रभुत्व के दौर में उसी दल की राज्य सरकार केंद्र का विरोध करने की स्थिति में नहीं थी, और अनुच्छेद 356 खुलकर इस्तेमाल हुआ। 1989 से गठबंधन सरकारें बहुमत के लिए क्षेत्रीय दलों पर निर्भर रही हैं, और उन दलों ने वह उत्तोलन अपने राज्यों के लिए इस्तेमाल किया है — वित्त आयोगों की संरचना में, कराधान के निर्णयों में, केंद्रीय योजनाओं के बँटवारे में। व्यवहार में संघवाद पाठ जितना ही राजनीतिक शक्ति के वितरण से सधता है। तब न्यायसंगत निर्णय यह कि भारतीय संघवाद असली है पर रचना से असममित और केंद्र-झुका, और उसकी वास्तविक शक्ति इससे बदलती है कि सत्ता किसके पास है, केवल दस्तावेज़ से नियत नहीं। आलोचक इसमें सही है कि पाठ मज़बूत केंद्र की अनुमति देता है; इसमें ग़लत कि इससे व्यवस्था औपचारिकता बन जाती है — औपचारिकता वह नहीं होती जो मुक़दमे, न्यायिक सिद्धांत और कड़ी सौदेबाज़ी पैदा करे, और भारतीय संघवाद तीनों पैदा करता है। (ग़लत उत्तर राज्यों को कोई संवैधानिक शक्ति नहीं देते, संघ को कोई नहीं देते, या नकारते कि संविधान शक्तियाँ बाँटते ही हैं।)",
          mr: "टीका चांगली नेम धरते आणि अंशतः बरोबर, हेच तिला झटकण्याऐवजी काळजीपूर्वक उत्तर देण्याजोगी करते. तथ्ये मान्य करून सुरू करा. भारताची राज्यघटना खरोखर केंद्राकडे झुकलेली. अवशिष्ट सत्ता — जे कोणत्याही यादीत नाही — संघाला जातात, तर अमेरिकेत त्या राज्यांना. संसद समवर्ती यादीच्या विषयांवर कायदा करू शकते आणि संघर्षात तिचा कायदा राज्याच्या कायद्यावर चालतो. संसद साधारण कायद्याने एखाद्या राज्याच्या सीमा वा त्याचे अस्तित्वही बदलू शकते, ज्याचा सामना कोणत्या अमेरिकी राज्याला नाही. राज्यपाल केंद्र नेमते आणि राज्य सरकारे बनवण्यात त्यांच्याकडे विवेकाधिकार. कलम 356 राष्ट्रपती राजवटीची मुभा देते, जे निवडून आलेले राज्य सरकार बरखास्त करते. आर्थिकदृष्ट्या राज्ये केंद्रीयरीत्या ठरलेल्या हस्तांतरणांवर मोठ्या प्रमाणात अवलंबून. कागदावर हे बलवान केंद्र. पण ही वैशिष्ट्ये योगायोग वा संघराज्यवादाशी द्रोह नव्हेत; ती भारत कोणत्या प्रकारचे संघराज्य आहे यातून निघतात. जिथे अमेरिका आधीच सार्वभौम असलेल्या तेरा राज्यांनी सत्ता एकत्र करून आणि उरलेल्या काटेकोरपणे स्वतःकडे ठेवून बनली, तिथे भारत एकच भूभाग होता ज्याची राज्ये संघाने निर्माण केली — एकत्र राखणारे संघराज्य, जे वर संचयाने नव्हे तर खाली सत्ता सोपवून बनले. अशी संघराज्ये, ज्यांत स्पेन आणि बेल्जियमही, वैशिष्ट्यपूर्णरीत्या बलवान केंद्र ठेवतात, कारण ती जी समस्या सोडवत आहेत ती वेगळ्या राज्यांना जोडायला मनवणे नव्हे तर विविध देश एकत्र धरणे. 1947 मध्ये, फाळणी नुकतीच सरलेली आणि संस्थाने एकात्म होत असताना, दुर्बळ केंद्र हा जिवंत पर्याय नव्हता. आता अतिशयोक्ती. पहिले, राज्यांच्या सत्ता ही मेहरबानी नाही. राज्य यादी राज्यघटनेने हमी दिलेली; संसद साधारण कायदा संमत करून पोलीस वा जमीन महसूल घेऊ शकत नाही, आणि जिथे ती राज्य-विषयांत पसरली तिथे कायद्याला आव्हान मिळाले आहे. दुसरे, वाद न्यायनिवाड्यायोग्य. 1994 च्या बोम्मई निकालात सर्वोच्च न्यायालयाने ठरवले की राष्ट्रपती राजवट न्यायिक पुनर्विलोकनाच्या अधीन, की सरकारचे बहुमत राज्यपालाच्या मताने नव्हे तर सभागृहाच्या पटलावर तपासले जावे, आणि की अयोग्य आढळलेली बरखास्ती पलटवता येते. त्यानंतर कलम 356 ची वारंवारता झपाट्याने घसरली — संकेत की संवैधानिक नियंत्रण चालले. तिसरे, आणि सर्वांत महत्त्वाचे, व्यावहारिक तोल पक्षपद्धतीसोबत बदलला आहे. एकपक्षीय वर्चस्वाच्या काळात त्याच पक्षाचे राज्य सरकार केंद्राला विरोध करण्याच्या स्थितीत नव्हते, आणि कलम 356 मुक्तपणे वापरले गेले. 1989 पासून आघाडी सरकारे बहुमतासाठी प्रादेशिक पक्षांवर अवलंबून राहिली, आणि त्या पक्षांनी तो उत्तोलक आपल्या राज्यांसाठी वापरला — वित्त आयोगांच्या रचनेत, करआकारणीच्या निर्णयांत, केंद्रीय योजनांच्या वाटपात. व्यवहारातील संघराज्यवाद मजकुराइतकाच राजकीय सत्तेच्या वाटपाने ठरतो. मग न्याय्य निर्णय हा की भारतीय संघराज्यवाद खरा पण रचनेने असममित आणि केंद्र-झुकलेला, आणि त्याचे प्रत्यक्ष बळ सत्ता कोणाकडे आहे यावरून बदलते, केवळ दस्तऐवजाने ठरलेले नाही. टीकाकार यात बरोबर की मजकूर बलवान केंद्राला परवानगी देतो; यात चुकीचा की यामुळे व्यवस्था औपचारिकता बनते — औपचारिकता ती नसते जी खटले, न्यायिक सिद्धांत आणि कडक घासाघीस घडवते, आणि भारतीय संघराज्यवाद तिन्ही घडवतो. (चुकीची उत्तरे राज्यांना कोणतीही संवैधानिक सत्ता देत नाहीत, संघाला कोणतीही देत नाहीत, वा राज्यघटना सत्ता वाटतातच हे नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Gender, Religion and Caste                                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-10-gender-religion-caste",
    subject: "CIVICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 3 — Gender, Religion and Caste",
      hi: "अध्याय 3 — लिंग, धर्म और जाति",
      mr: "प्रकरण 3 — लिंग, धर्म आणि जात",
    },
    name: {
      en: "Gender, Religion and Caste",
      hi: "लिंग, धर्म और जाति",
      mr: "लिंग, धर्म आणि जात",
    },
    summary: {
      en: "Three divisions that follow people into the polling booth: work assigned by birth and called nature, half the population that votes everywhere and legislates almost nowhere, the claim that one faith's followers are the real nation, the state that keeps its distance from all religions rather than from none — and caste, which democracy did not abolish but did rearrange.",
      hi: "तीन विभाजन जो लोगों के पीछे मतदान-कक्ष तक जाते हैं: जन्म से सौंपा और प्रकृति कहा गया काम, आधी आबादी जो हर जगह मत देती और लगभग कहीं क़ानून नहीं बनाती, यह दावा कि एक आस्था के अनुयायी ही असली राष्ट्र हैं, वह राज्य जो किसी से नहीं बल्कि सब धर्मों से दूरी रखता — और जाति, जिसे लोकतंत्र ने मिटाया नहीं पर फिर से सजाया ज़रूर।",
      mr: "तीन विभाजने जी लोकांच्या मागे मतदान कक्षापर्यंत जातात: जन्माने सोपवलेले आणि निसर्ग म्हटलेले काम, अर्धी लोकसंख्या जी सर्वत्र मत देते आणि जवळजवळ कुठेही कायदा करत नाही, हा दावा की एका श्रद्धेचे अनुयायीच खरे राष्ट्र, ते राज्य जे कोणापासून नव्हे तर सर्व धर्मांपासून अंतर राखते — आणि जात, जी लोकशाहीने मिटवली नाही पण पुन्हा मांडली मात्र.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "sexual-division-of-labour",
        name: {
          en: "The sexual division of labour",
          hi: "लैंगिक श्रम-विभाजन",
          mr: "लैंगिक श्रम-विभागणी",
        },
        kind: "idea",
        prompt: {
          en: "Cooking, cleaning and the care of children and the elderly are treated as women's work everywhere, done without wages and left out of the national accounts, while paid work outside the home is treated as men's. What arrangement is this?",
          hi: "खाना बनाना, सफ़ाई और बच्चों तथा बुज़ुर्गों की देखभाल हर जगह स्त्रियों का काम माना जाता है, बिना मज़दूरी किया जाता और राष्ट्रीय लेखों से बाहर छोड़ा जाता, जबकि घर के बाहर का वेतन-कार्य पुरुषों का। यह कौन-सी व्यवस्था है?",
          mr: "स्वयंपाक, साफसफाई आणि मुले व वृद्धांची काळजी सर्वत्र स्त्रियांचे काम मानले जाते, मजुरीविना केले जाते आणि राष्ट्रीय हिशोबांतून वगळले जाते, तर घराबाहेरचे पगारी काम पुरुषांचे. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "The sexual division of labour assigns housework and the care of family members to women as unpaid work while treating paid work outside the home as men's domain, and presents this arrangement as though it were natural.",
          hi: "लैंगिक श्रम-विभाजन घर का काम और परिवारजनों की देखभाल स्त्रियों को बिना वेतन के काम के रूप में सौंपता है जबकि घर के बाहर का वेतन-कार्य पुरुषों का क्षेत्र मानता है, और इस व्यवस्था को ऐसे पेश करता मानो वह प्राकृतिक हो।",
          mr: "लैंगिक श्रम-विभागणी घरकाम आणि कुटुंबीयांची काळजी स्त्रियांना बिनपगारी काम म्हणून सोपवते तर घराबाहेरचे पगारी काम पुरुषांचे क्षेत्र मानते, आणि ही व्यवस्था जणू ती नैसर्गिक असल्यासारखी मांडते.",
        },
        detail: {
          en: "Because it is unpaid it is also uncounted: the same cooking done in a restaurant enters the national income, and done at home does not.",
          hi: "क्योंकि वह बिना वेतन है इसलिए बिना गिनती भी है: वही खाना बनाना किसी भोजनालय में हो तो राष्ट्रीय आय में आता है, घर में हो तो नहीं।",
          mr: "ते बिनपगारी असल्याने ते बिनमोजणीचेही: तोच स्वयंपाक हॉटेलात केला तर राष्ट्रीय उत्पन्नात येतो, घरी केला तर नाही.",
        },
        extra: {
          en: "The arrangement is not a fact of biology but a social expectation, which is why it varies across societies and has shifted within living memory.",
          hi: "यह व्यवस्था जीव-विज्ञान का तथ्य नहीं बल्कि सामाजिक अपेक्षा है, इसी से वह समाजों में भिन्न है और जीवित स्मृति के भीतर बदली है।",
          mr: "ही व्यवस्था जीवशास्त्राचे तथ्य नव्हे तर सामाजिक अपेक्षा, म्हणूनच ती समाजांगणिक वेगळी आणि जिवंत स्मृतीत बदललेली.",
        },
        pair: {
          left: {
            en: "Unpaid work assigned by sex and called natural",
            hi: "लिंग से सौंपा और प्राकृतिक कहा गया बिना वेतन काम",
            mr: "लिंगाने सोपवलेले आणि नैसर्गिक म्हटलेले बिनपगारी काम",
          },
          right: {
            en: "the sexual division of labour",
            hi: "लैंगिक श्रम-विभाजन",
            mr: "लैंगिक श्रम-विभागणी",
          },
        },
      },
      {
        id: "patriarchy",
        name: {
          en: "Patriarchy",
          hi: "पितृसत्ता",
          mr: "पितृसत्ता",
        },
        kind: "idea",
        prompt: {
          en: "Property descends through sons, a family's name is carried by men, decisions are made by the eldest male, and the birth of a daughter is met with less celebration — a whole system valuing one sex above the other. What is it called?",
          hi: "संपत्ति पुत्रों से उतरती है, परिवार का नाम पुरुष ढोते हैं, निर्णय सबसे बड़े पुरुष लेते हैं, और बेटी के जन्म पर कम उत्सव होता है — एक पूरी प्रणाली जो एक लिंग को दूसरे से ऊपर आँकती है। यह क्या कहलाती है?",
          mr: "मालमत्ता मुलांकडून उतरते, कुटुंबाचे नाव पुरुष वाहतात, निर्णय सर्वांत मोठा पुरुष घेतो, आणि मुलीच्या जन्मावर कमी उत्सव होतो — एक अख्खी व्यवस्था जी एका लिंगाला दुसऱ्याहून वर मानते. हिला काय म्हणतात?",
        },
        statement: {
          en: "Patriarchy is a social system in which men hold authority over women in the family, in property, in public life and in the assumptions of the culture, and it operates through custom rather than through law alone.",
          hi: "पितृसत्ता वह सामाजिक प्रणाली है जिसमें पुरुष परिवार, संपत्ति, सार्वजनिक जीवन तथा संस्कृति की मान्यताओं में स्त्रियों पर सत्ता रखते हैं, और वह केवल क़ानून से नहीं बल्कि प्रथा से चलती है।",
          mr: "पितृसत्ता ही अशी सामाजिक व्यवस्था जिच्यात पुरुष कुटुंब, मालमत्ता, सार्वजनिक जीवन आणि संस्कृतीच्या गृहीतकांत स्त्रियांवर सत्ता ठेवतात, आणि ती केवळ कायद्याने नव्हे तर रूढीने चालते.",
        },
        detail: {
          en: "Its sharpest measure in India is the child sex ratio, which has fallen in several prosperous districts — showing that wealth alone does not dissolve it.",
          hi: "भारत में उसका सबसे तीखा माप बाल लिंग अनुपात है, जो कई समृद्ध ज़िलों में गिरा है — दिखाता कि केवल संपन्नता उसे घोलती नहीं।",
          mr: "भारतात तिचे सर्वांत तीक्ष्ण माप म्हणजे बाल लिंग गुणोत्तर, जे अनेक समृद्ध जिल्ह्यांत घसरले आहे — दाखवत की केवळ संपन्नता तिला विरघळवत नाही.",
        },
        extra: {
          en: "Law has moved ahead of custom: daughters have had equal inheritance rights in law since 2005, and yet most land in India is still registered in a man's name.",
          hi: "क़ानून प्रथा से आगे बढ़ा है: 2005 से बेटियों को क़ानूनन बराबर उत्तराधिकार है, फिर भी भारत की अधिकांश ज़मीन आज भी किसी पुरुष के नाम दर्ज है।",
          mr: "कायदा रूढीच्या पुढे गेला: 2005 पासून मुलींना कायद्याने समान वारसाहक्क, तरीही भारतातील बहुतांश जमीन आजही पुरुषाच्या नावावर नोंदलेली.",
        },
        pair: {
          left: {
            en: "A system that values one sex above the other",
            hi: "एक लिंग को दूसरे से ऊपर आँकती प्रणाली",
            mr: "एका लिंगाला दुसऱ्याहून वर मानणारी व्यवस्था",
          },
          right: {
            en: "patriarchy",
            hi: "पितृसत्ता",
            mr: "पितृसत्ता",
          },
        },
      },
      {
        id: "womens-political-representation",
        name: {
          en: "Women's political representation",
          hi: "स्त्रियों का राजनीतिक प्रतिनिधित्व",
          mr: "स्त्रियांचे राजकीय प्रतिनिधित्व",
        },
        kind: "idea",
        prompt: {
          en: "Women are about half the electorate and vote in numbers now equalling men, yet their share of seats in the Lok Sabha has stayed low, while a third of all panchayat seats are reserved for them by law. Which question is this?",
          hi: "स्त्रियाँ लगभग आधी मतदाता हैं और अब पुरुषों के बराबर संख्या में मत देती हैं, फिर भी लोक सभा की सीटों में उनका हिस्सा कम बना रहा, जबकि सब पंचायत सीटों का एक-तिहाई क़ानूनन उनके लिए आरक्षित है। यह कौन-सा प्रश्न है?",
          mr: "स्त्रिया सुमारे अर्ध्या मतदार आणि आता पुरुषांइतक्याच संख्येने मत देतात, तरीही लोकसभेच्या जागांतील त्यांचा वाटा कमी राहिला, तर सर्व पंचायत जागांचा एक-तृतीयांश कायद्याने त्यांच्यासाठी राखीव. हा कोणता प्रश्न?",
        },
        statement: {
          en: "Women's political representation remains far below their share of the population in Parliament and state legislatures, even though one-third of seats in local bodies have been reserved for women since 1992.",
          hi: "संसद और राज्य विधानमंडलों में स्त्रियों का राजनीतिक प्रतिनिधित्व उनकी आबादी के हिस्से से कहीं नीचे बना हुआ है, यद्यपि 1992 से स्थानीय निकायों की एक-तिहाई सीटें स्त्रियों के लिए आरक्षित हैं।",
          mr: "संसद आणि राज्य विधिमंडळांत स्त्रियांचे राजकीय प्रतिनिधित्व त्यांच्या लोकसंख्येतील वाट्याहून कितीतरी खाली राहिले आहे, जरी 1992 पासून स्थानिक संस्थांच्या एक-तृतीयांश जागा स्त्रियांसाठी राखीव आहेत.",
        },
        detail: {
          en: "The local reservation worked: it produced over a million elected women representatives, and studies find their councils spend more on water, sanitation and schooling.",
          hi: "स्थानीय आरक्षण ने काम किया: उसने दस लाख से अधिक निर्वाचित महिला प्रतिनिधि बनाईं, और अध्ययन पाते हैं कि उनकी परिषदें पानी, स्वच्छता तथा पढ़ाई पर अधिक ख़र्च करती हैं।",
          mr: "स्थानिक आरक्षणाने काम केले: त्याने दहा लाखांहून अधिक निवडून आलेल्या महिला प्रतिनिधी घडवल्या, आणि अभ्यास आढळतात की त्यांच्या सभा पाणी, स्वच्छता व शिक्षणावर अधिक खर्च करतात.",
        },
        extra: {
          en: "The obstacle is rarely the voter: parties select few women as candidates, and a candidate who is never nominated cannot be elected however popular she might be.",
          hi: "बाधा शायद ही कभी मतदाता होता है: दल कम स्त्रियों को उम्मीदवार चुनते हैं, और जिसे कभी नामांकित ही न किया जाए वह कितनी भी लोकप्रिय हो, चुनी नहीं जा सकती।",
          mr: "अडथळा क्वचितच मतदार असतो: पक्ष कमी स्त्रियांना उमेदवार निवडतात, आणि जिला कधी उमेदवारीच दिली जात नाही ती कितीही लोकप्रिय असो, निवडून येऊ शकत नाही.",
        },
        pair: {
          left: {
            en: "Half the voters, a small share of the seats",
            hi: "आधे मतदाता, सीटों में छोटा हिस्सा",
            mr: "अर्धे मतदार, जागांत लहान वाटा",
          },
          right: {
            en: "women's political representation",
            hi: "स्त्रियों का राजनीतिक प्रतिनिधित्व",
            mr: "स्त्रियांचे राजकीय प्रतिनिधित्व",
          },
        },
      },
      {
        id: "communalism",
        name: {
          en: "Communalism",
          hi: "सांप्रदायिकता",
          mr: "जातीयवाद",
        },
        kind: "idea",
        prompt: {
          en: "The belief that people of one faith form a single community with one political interest, that this interest is opposed to that of other faiths, and that the state should belong to the majority religion. What is this called?",
          hi: "यह विश्वास कि एक आस्था के लोग एक ही समुदाय बनाते हैं जिसका एक राजनीतिक हित है, कि यह हित दूसरी आस्थाओं के हित के विरोध में है, और कि राज्य बहुसंख्यक धर्म का होना चाहिए। यह क्या कहलाता है?",
          mr: "हा विश्वास की एका श्रद्धेचे लोक एकच समुदाय बनवतात ज्याचे एकच राजकीय हित आहे, की हे हित इतर श्रद्धांच्या हिताविरुद्ध आहे, आणि की राज्य बहुसंख्याक धर्माचे असावे. याला काय म्हणतात?",
        },
        statement: {
          en: "Communalism treats followers of a religion as one political community with a single interest opposed to other religions, and claims that the state should favour or belong to one faith.",
          hi: "सांप्रदायिकता किसी धर्म के अनुयायियों को एक ही राजनीतिक समुदाय मानती है जिसका एक हित दूसरे धर्मों के विरोध में है, और दावा करती है कि राज्य को एक आस्था का पक्ष लेना या उसका होना चाहिए।",
          mr: "जातीयवाद एखाद्या धर्माच्या अनुयायांना एकच राजकीय समुदाय मानतो ज्याचे एकच हित इतर धर्मांविरुद्ध, आणि दावा करतो की राज्याने एका श्रद्धेची बाजू घ्यावी वा तिचे असावे.",
        },
        detail: {
          en: "It appears in everyday forms long before violence — in prejudice and stereotype, in a party appealing to one community's fears, in a demand that a symbol be given official standing.",
          hi: "वह हिंसा से बहुत पहले रोज़मर्रा के रूपों में दिखती है — पूर्वाग्रह तथा रूढ़ छवि में, एक समुदाय के भय को पुकारते दल में, इस माँग में कि किसी प्रतीक को सरकारी दर्जा मिले।",
          mr: "तो हिंसेच्या खूप आधी रोजच्या रूपांत दिसतो — पूर्वग्रह व साचेबद्ध प्रतिमेत, एका समुदायाच्या भीतीला आवाहन करणाऱ्या पक्षात, एखाद्या प्रतीकाला शासकीय दर्जा मिळावा या मागणीत.",
        },
        extra: {
          en: "The error is in the premise, not the piety: people of one faith differ among themselves by class, language, region and opinion as much as from anyone else.",
          hi: "भूल आस्था में नहीं, आधार-वाक्य में है: एक ही आस्था के लोग आपस में वर्ग, भाषा, क्षेत्र और राय से उतने ही भिन्न हैं जितने किसी और से।",
          mr: "चूक श्रद्धेत नव्हे तर गृहीतकात: एकाच श्रद्धेचे लोक आपापसात वर्ग, भाषा, प्रदेश आणि मताने तितकेच वेगळे जितके इतर कोणाहून.",
        },
        pair: {
          left: {
            en: "One faith treated as one political interest",
            hi: "एक आस्था को एक राजनीतिक हित माना",
            mr: "एका श्रद्धेला एक राजकीय हित मानले",
          },
          right: {
            en: "communalism",
            hi: "सांप्रदायिकता",
            mr: "जातीयवाद",
          },
        },
      },
      {
        id: "indian-secularism",
        name: {
          en: "Indian secularism",
          hi: "भारतीय धर्मनिरपेक्षता",
          mr: "भारतीय धर्मनिरपेक्षता",
        },
        kind: "idea",
        prompt: {
          en: "No religion is made the state's own, every citizen may profess and practise any faith or none, discrimination on religious grounds is prohibited, and the state may still step in to end a religious practice that violates rights. Which arrangement is this?",
          hi: "किसी धर्म को राज्य का अपना नहीं बनाया गया, हर नागरिक कोई भी आस्था माने-निभाए या कोई नहीं, धार्मिक आधार पर भेदभाव मना है, और राज्य फिर भी ऐसी धार्मिक प्रथा रोकने दख़ल दे सकता है जो अधिकारों का उल्लंघन करे। यह कौन-सी व्यवस्था है?",
          mr: "कोणत्याही धर्माला राज्याचा स्वतःचा केले नाही, प्रत्येक नागरिक कोणतीही श्रद्धा मानू-पाळू शकतो वा कोणतीही नाही, धार्मिक आधारावर भेदभाव मनाई, आणि राज्य तरीही अशी धार्मिक प्रथा थांबवायला हस्तक्षेप करू शकते जी हक्कांचे उल्लंघन करते. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "Indian secularism gives no religion the status of state religion, guarantees freedom to profess, practise and propagate any faith or none, forbids religious discrimination, and permits the state to intervene in religious practice to protect equality and rights.",
          hi: "भारतीय धर्मनिरपेक्षता किसी धर्म को राजधर्म का दर्जा नहीं देती, कोई भी आस्था मानने, निभाने और प्रचार करने या न मानने की स्वतंत्रता सुनिश्चित करती है, धार्मिक भेदभाव मना करती है, और समानता तथा अधिकारों की रक्षा को धार्मिक प्रथा में दख़ल की छूट देती है।",
          mr: "भारतीय धर्मनिरपेक्षता कोणत्याही धर्माला राजधर्माचा दर्जा देत नाही, कोणतीही श्रद्धा मानण्याचे, पाळण्याचे व प्रसाराचे किंवा न मानण्याचे स्वातंत्र्य हमी देते, धार्मिक भेदभाव मनाई करते, आणि समानता व हक्कांच्या रक्षणासाठी धार्मिक प्रथेत हस्तक्षेपाची मुभा देते.",
        },
        detail: {
          en: "It is not indifference to religion but equal distance from all of them, which is why abolishing untouchability was a religious reform carried out by a secular state.",
          hi: "यह धर्म के प्रति उदासीनता नहीं बल्कि सब धर्मों से बराबर दूरी है, इसी से अस्पृश्यता का उन्मूलन एक धर्मनिरपेक्ष राज्य द्वारा किया गया धार्मिक सुधार था।",
          mr: "ही धर्माबद्दलची उदासीनता नव्हे तर सर्व धर्मांपासून समान अंतर, म्हणूनच अस्पृश्यतेचे निर्मूलन धर्मनिरपेक्ष राज्याने केलेली धार्मिक सुधारणा होती.",
        },
        extra: {
          en: "The word secular was added to the Preamble in 1976, but the arrangement was in the Constitution from the start in the rights it guaranteed.",
          hi: "'धर्मनिरपेक्ष' शब्द 1976 में प्रस्तावना में जोड़ा गया, पर वह व्यवस्था आरंभ से ही संविधान में थी — उन अधिकारों में जो उसने सुनिश्चित किए।",
          mr: "'धर्मनिरपेक्ष' शब्द 1976 मध्ये उद्देशिकेत जोडला, पण ती व्यवस्था सुरुवातीपासूनच राज्यघटनेत होती — तिने हमी दिलेल्या हक्कांत.",
        },
        pair: {
          left: {
            en: "Equal distance from all faiths, not from faith itself",
            hi: "सब आस्थाओं से बराबर दूरी, आस्था से नहीं",
            mr: "सर्व श्रद्धांपासून समान अंतर, श्रद्धेपासून नव्हे",
          },
          right: {
            en: "Indian secularism",
            hi: "भारतीय धर्मनिरपेक्षता",
            mr: "भारतीय धर्मनिरपेक्षता",
          },
        },
      },
      {
        id: "caste-in-politics",
        name: {
          en: "Caste in politics",
          hi: "राजनीति में जाति",
          mr: "राजकारणातील जात",
        },
        kind: "idea",
        prompt: {
          en: "Parties weigh caste arithmetic when choosing candidates, appeals are made to particular communities, and no party can win by one caste's votes alone since no constituency has a single caste in a majority. What is this two-way relationship?",
          hi: "दल उम्मीदवार चुनते समय जातीय अंकगणित तौलते हैं, विशेष समुदायों से अपील की जाती है, और कोई दल अकेली एक जाति के मतों से नहीं जीत सकता क्योंकि किसी क्षेत्र में एक जाति बहुमत में नहीं। यह दोतरफ़ा रिश्ता क्या है?",
          mr: "पक्ष उमेदवार निवडताना जातीय अंकगणित तोलतात, विशिष्ट समुदायांना आवाहन केले जाते, आणि कोणताही पक्ष एकट्या एका जातीच्या मतांनी जिंकू शकत नाही कारण कोणत्याही मतदारसंघात एक जात बहुमतात नाही. हे दुहेरी नाते काय?",
        },
        statement: {
          en: "Caste in politics works both ways: politics uses caste, in candidate selection and appeals, while caste is itself changed by politics, as groups combine into larger coalitions and once-excluded castes gain a share of power.",
          hi: "राजनीति में जाति दोनों ओर काम करती है: राजनीति जाति का उपयोग करती है — उम्मीदवार-चयन और अपीलों में — जबकि जाति स्वयं राजनीति से बदलती है, क्योंकि समूह बड़े गठजोड़ों में जुड़ते हैं और कभी बहिष्कृत जातियाँ सत्ता में हिस्सा पाती हैं।",
          mr: "राजकारणातील जात दोन्ही बाजूंनी काम करते: राजकारण जातीचा वापर करते — उमेदवार-निवड आणि आवाहनांत — तर जात स्वतः राजकारणाने बदलते, कारण गट मोठ्या आघाड्यांत जुळतात आणि एकेकाळी वगळलेल्या जातींना सत्तेत वाटा मिळतो.",
        },
        detail: {
          en: "The arithmetic itself restrains it: since no constituency has one caste in a clear majority, every winning candidate must gather several communities and cannot rely on one.",
          hi: "अंकगणित ही उसे रोकता है: क्योंकि किसी क्षेत्र में एक जाति स्पष्ट बहुमत में नहीं, हर जीतते उम्मीदवार को कई समुदाय जोड़ने पड़ते और वह एक पर निर्भर नहीं रह सकता।",
          mr: "अंकगणितच तिला आवर घालते: कोणत्याही मतदारसंघात एक जात स्पष्ट बहुमतात नसल्याने, प्रत्येक जिंकणाऱ्या उमेदवाराला अनेक समुदाय जोडावे लागतात आणि तो एकावर विसंबू शकत नाही.",
        },
        extra: {
          en: "Voters are not caste-blind, but they are not caste-bound either: governments are routinely voted out by the same communities that elected them, which no purely caste account can explain.",
          hi: "मतदाता जाति-अंधे नहीं, पर जाति-बँधे भी नहीं: सरकारें नियमित रूप से उन्हीं समुदायों द्वारा हटा दी जाती हैं जिन्होंने उन्हें चुना था, जिसे विशुद्ध जाति-आधारित विवरण समझा नहीं सकता।",
          mr: "मतदार जात-आंधळे नाहीत, पण जात-बांधलेलेही नाहीत: सरकारे नियमितपणे त्याच समुदायांकडून हटवली जातात ज्यांनी त्यांना निवडले, जे केवळ जात-आधारित स्पष्टीकरण समजावू शकत नाही.",
        },
        pair: {
          left: {
            en: "Politics using caste, and caste changed by politics",
            hi: "जाति का उपयोग करती राजनीति, और राजनीति से बदलती जाति",
            mr: "जातीचा वापर करणारे राजकारण, आणि राजकारणाने बदलणारी जात",
          },
          right: {
            en: "caste in politics",
            hi: "राजनीति में जाति",
            mr: "राजकारणातील जात",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Indian women have had the vote since the first general election, turn out to vote in numbers now matching men, and have led national and state governments. Yet their share of Lok Sabha seats has remained low for seventy years. Explain why the franchise alone has not produced representation.",
          hi: "भारतीय स्त्रियों को पहले आम चुनाव से मताधिकार है, वे अब पुरुषों के बराबर संख्या में मतदान करती हैं, और उन्होंने राष्ट्रीय तथा राज्य सरकारों का नेतृत्व किया है। फिर भी लोक सभा सीटों में उनका हिस्सा सत्तर वर्ष से कम बना रहा। समझाओ केवल मताधिकार ने प्रतिनिधित्व क्यों नहीं दिया।",
          mr: "भारतीय स्त्रियांना पहिल्या सार्वत्रिक निवडणुकीपासून मतदानाचा हक्क आहे, त्या आता पुरुषांइतक्याच संख्येने मतदान करतात, आणि त्यांनी राष्ट्रीय व राज्य सरकारांचे नेतृत्व केले आहे. तरीही लोकसभा जागांतील त्यांचा वाटा सत्तर वर्षे कमी राहिला. समजावा केवळ मताधिकाराने प्रतिनिधित्व का दिले नाही.",
        },
        choices: [
          {
            en: "Because the decisive filter is candidate selection, not the vote. Parties nominate few women, so voters mostly cannot choose one; and behind that sit the costs of entry — money, party networks, time free of unpaid domestic work, and safety in public life — all of which patriarchy distributes unequally. The local-body reservation is the evidence: where a third of seats were reserved, over a million women were elected, which shows the shortfall was in the supply of candidacies rather than in voters' willingness",
            hi: "क्योंकि निर्णायक छन्नी उम्मीदवार-चयन है, मत नहीं। दल कम स्त्रियों को नामांकित करते हैं, अतः मतदाता अधिकतर किसी को चुन ही नहीं सकते; और उसके पीछे प्रवेश की लागतें हैं — पैसा, दल के जाल, बिना वेतन घरेलू काम से मुक्त समय, और सार्वजनिक जीवन में सुरक्षा — जिन सबको पितृसत्ता असमान बाँटती है। स्थानीय निकायों का आरक्षण प्रमाण है: जहाँ एक-तिहाई सीटें आरक्षित हुईं वहाँ दस लाख से अधिक स्त्रियाँ चुनी गईं, जो दिखाता कि कमी उम्मीदवारियों की आपूर्ति में थी, मतदाताओं की तत्परता में नहीं",
            mr: "कारण निर्णायक चाळणी उमेदवार-निवड आहे, मत नव्हे. पक्ष कमी स्त्रियांना उमेदवारी देतात, म्हणून मतदार बहुतांश कोणालाही निवडूच शकत नाहीत; आणि त्यामागे प्रवेशाचे खर्च — पैसा, पक्षाची जाळी, बिनपगारी घरकामातून मोकळा वेळ, आणि सार्वजनिक जीवनातील सुरक्षा — जे सर्व पितृसत्ता असमानपणे वाटते. स्थानिक संस्थांचे आरक्षण हा पुरावा: जिथे एक-तृतीयांश जागा राखीव झाल्या तिथे दहा लाखांहून अधिक स्त्रिया निवडून आल्या, जे दाखवते की तूट उमेदवारींच्या पुरवठ्यात होती, मतदारांच्या तयारीत नाही",
          },
          {
            en: "Because voters everywhere refuse to vote for any woman candidate under any circumstances",
            hi: "क्योंकि हर जगह मतदाता किसी भी परिस्थिति में किसी महिला उम्मीदवार को मत देने से इनकार करते हैं",
            mr: "कारण सर्वत्र मतदार कोणत्याही परिस्थितीत कोणत्याही महिला उमेदवाराला मत द्यायला नकार देतात",
          },
          {
            en: "Because women are legally barred from contesting elections to Parliament in India",
            hi: "क्योंकि भारत में स्त्रियों को संसद के चुनाव लड़ने से क़ानूनन रोका गया है",
            mr: "कारण भारतात स्त्रियांना संसदेची निवडणूक लढवण्यास कायद्याने मनाई आहे",
          },
          {
            en: "Because representation is already proportional, and the premise of the question is simply false",
            hi: "क्योंकि प्रतिनिधित्व पहले से आनुपातिक है, और प्रश्न का आधार बस झूठा है",
            mr: "कारण प्रतिनिधित्व आधीच प्रमाणशीर आहे, आणि प्रश्नाचे गृहीतक फक्त खोटे आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The puzzle looks strange only if you imagine an election as a single decision. It is two, and the first one is taken long before any voter is involved. A citizen can only vote for someone whose name is on the ballot, and the names are put there by political parties. If parties field very few women, then even an electorate perfectly willing to elect women cannot do so, because the choice was already made upstream. This is where the shortfall is concentrated, and it explains why decades of universal franchise did not close the gap: the franchise operates on the second decision, and the constraint sits on the first. Why do parties nominate so few? Partly because they use a rough calculation of 'winnability' that treats an untried candidate as a risk, and women are undertried precisely because they have been nominated so rarely — a circular logic that reproduces itself. And partly because getting to the point of being considered requires resources that patriarchy distributes unequally. Contesting costs money, and property and income are held disproportionately by men. It requires years of party work, which requires time free of unpaid domestic labour that the sexual division of labour assigns to women. It requires networks built in public spaces where women's presence is restricted, and it exposes a candidate to harassment and abuse that falls far more heavily on women. Each obstacle is modest on its own; together they thin the pipeline long before anyone reaches a nomination committee. The reservation in local bodies is the natural experiment that settles the question. From 1992, one-third of panchayat and municipal seats and chairperson posts were reserved for women. If the barrier had been voter prejudice, reserved seats would have produced reluctant, low-turnout elections or unfilled posts. Instead more than a million women were elected, contests were real, and studies of these councils find measurably different spending priorities, with more going to drinking water, sanitation and schooling. The demand for candidacies was there; what was missing was a route to being a candidate. Two honest complications. Critics of reservation argue that seats reserved by rotation can encourage proxy candidatures, where a husband or father effectively holds the office — a documented problem in the early years, though studies find it declines as women complete terms and stand again. And a national bill reserving a third of Lok Sabha and Assembly seats was debated for decades before an Act was passed in 2023, whose implementation is tied to a future delimitation. So the conclusion is not that reservation is the only or a costless answer, but that the diagnosis is clear: the vote is necessary and has never been sufficient, because the barrier lies in who gets to stand, not in who is willing to be represented. (The wrong answers blame voters that the reservation experiment exonerates, invent a legal bar that does not exist, or deny a shortfall the seat counts record plainly.)",
          hi: "यह पहेली तभी विचित्र लगती है जब तुम चुनाव को एक ही निर्णय मान लो। वे दो हैं, और पहला किसी मतदाता के शामिल होने से बहुत पहले लिया जाता है। नागरिक केवल उसे मत दे सकता है जिसका नाम मतपत्र पर है, और नाम वहाँ राजनीतिक दल रखते हैं। यदि दल बहुत कम स्त्रियाँ उतारें, तो ऐसा मतदाता-वर्ग भी जो स्त्रियों को चुनने को पूरी तरह तैयार हो, चुन नहीं सकता, क्योंकि चुनाव पहले ही ऊपर हो चुका। कमी यहीं केंद्रित है, और यही समझाता है कि दशकों के सार्वभौमिक मताधिकार ने खाई क्यों नहीं पाटी: मताधिकार दूसरे निर्णय पर काम करता है, और अड़चन पहले पर बैठी है। दल इतनी कम स्त्रियाँ नामांकित क्यों करते हैं? आंशिक रूप से इसलिए कि वे 'जीतने की क्षमता' का मोटा हिसाब लगाते हैं जो अजमाए न गए उम्मीदवार को जोखिम मानता है, और स्त्रियाँ ठीक इसलिए कम अजमाई गई हैं कि उन्हें इतनी कम नामांकित किया गया — एक वृत्ताकार तर्क जो स्वयं को दोहराता है। और आंशिक रूप से इसलिए कि विचार-योग्य बनने तक पहुँचने में ऐसे संसाधन लगते हैं जिन्हें पितृसत्ता असमान बाँटती है। चुनाव लड़ने में पैसा लगता है, और संपत्ति तथा आय अनुपात से अधिक पुरुषों के पास हैं। उसमें वर्षों का दल-कार्य लगता है, जिसके लिए उस बिना वेतन घरेलू श्रम से मुक्त समय चाहिए जो लैंगिक श्रम-विभाजन स्त्रियों को सौंपता है। उसमें ऐसे सार्वजनिक स्थलों में बने जाल चाहिए जहाँ स्त्रियों की उपस्थिति सीमित है, और वह उम्मीदवार को ऐसे उत्पीड़न और गाली-गलौज के सामने रखता है जो स्त्रियों पर कहीं भारी पड़ता है। हर बाधा अकेले मामूली है; मिलकर वे किसी के नामांकन समिति तक पहुँचने से बहुत पहले धारा पतली कर देती हैं। स्थानीय निकायों का आरक्षण वह प्राकृतिक प्रयोग है जो प्रश्न सुलझाता है। 1992 से पंचायत तथा नगरपालिका की एक-तिहाई सीटें और अध्यक्ष-पद स्त्रियों के लिए आरक्षित हुए। यदि बाधा मतदाता का पूर्वाग्रह होती, तो आरक्षित सीटें अनिच्छुक, कम मतदान वाले चुनाव या ख़ाली पद देतीं। इसके बजाय दस लाख से अधिक स्त्रियाँ चुनी गईं, मुक़ाबले असली रहे, और इन परिषदों के अध्ययन मापने योग्य भिन्न व्यय-प्राथमिकताएँ पाते हैं, जिनमें अधिक पेयजल, स्वच्छता तथा पढ़ाई को जाता है। उम्मीदवारियों की माँग वहाँ थी; जो नहीं था वह उम्मीदवार बनने का रास्ता था। दो ईमानदार उलझनें। आरक्षण के आलोचक तर्क देते हैं कि चक्रानुक्रम से आरक्षित सीटें छद्म उम्मीदवारी बढ़ा सकती हैं, जहाँ पति या पिता प्रभावी रूप से पद रखता है — आरंभिक वर्षों की दर्ज समस्या, यद्यपि अध्ययन पाते हैं कि जैसे-जैसे स्त्रियाँ कार्यकाल पूरा कर फिर खड़ी होती हैं वह घटती है। और लोक सभा तथा विधानसभा की एक-तिहाई सीटें आरक्षित करता राष्ट्रीय विधेयक दशकों बहस में रहा और 2023 में अधिनियम पारित हुआ, जिसका क्रियान्वयन भविष्य के परिसीमन से बँधा है। अतः निष्कर्ष यह नहीं कि आरक्षण एकमात्र या बिना लागत का उत्तर है, बल्कि यह कि निदान साफ़ है: मत आवश्यक है और कभी पर्याप्त नहीं रहा, क्योंकि बाधा इसमें है कि खड़ा कौन हो पाता है, इसमें नहीं कि प्रतिनिधित्व पाने को कौन तैयार है। (ग़लत उत्तर उन मतदाताओं को दोष देते जिन्हें आरक्षण का प्रयोग बरी करता है, न मौजूद क़ानूनी रोक गढ़ते, या उस कमी को नकारते जिसे सीटों की गिनती साफ़ दर्ज करती है।)",
          mr: "हे कोडे तेव्हाच विचित्र वाटते जेव्हा तुम्ही निवडणुकीला एकच निर्णय मानता. ते दोन आहेत, आणि पहिला कोणताही मतदार सामील होण्याच्या खूप आधी घेतला जातो. नागरिक फक्त त्याला मत देऊ शकतो ज्याचे नाव मतपत्रावर आहे, आणि नावे तिथे राजकीय पक्ष ठेवतात. पक्षांनी फार कमी स्त्रिया उभ्या केल्या, तर स्त्रियांना निवडायला पूर्ण तयार असलेला मतदारवर्गही निवडू शकत नाही, कारण निवड आधीच वर झालेली. तूट इथेच केंद्रित, आणि हेच समजावते की दशकांच्या सार्वत्रिक मताधिकाराने दरी का भरली नाही: मताधिकार दुसऱ्या निर्णयावर काम करतो, आणि अडसर पहिल्यावर बसलेला. पक्ष इतक्या कमी स्त्रिया उमेदवार का करतात? अंशतः यासाठी की ते 'जिंकण्याच्या क्षमतेचा' ढोबळ हिशोब वापरतात जो न आजमावलेल्या उमेदवाराला धोका मानतो, आणि स्त्रिया नेमक्या यासाठी कमी आजमावलेल्या की त्यांना इतकी कमी उमेदवारी दिली गेली — एक वर्तुळाकार तर्क जो स्वतःची पुनरावृत्ती करतो. आणि अंशतः यासाठी की विचारात घेतले जाण्यापर्यंत पोहोचायला अशी साधने लागतात जी पितृसत्ता असमानपणे वाटते. निवडणूक लढवायला पैसा लागतो, आणि मालमत्ता व उत्पन्न प्रमाणाबाहेर पुरुषांकडे. त्याला वर्षांचे पक्षकाम लागते, ज्यासाठी लैंगिक श्रम-विभागणी स्त्रियांना सोपवत असलेल्या बिनपगारी घरकामातून मोकळा वेळ लागतो. त्याला अशा सार्वजनिक जागांत बांधलेली जाळी लागतात जिथे स्त्रियांची उपस्थिती मर्यादित, आणि तो उमेदवाराला अशा छळ व शिवीगाळीसमोर उघडा करतो जो स्त्रियांवर कितीतरी जड पडतो. प्रत्येक अडथळा एकटा माफक; एकत्रितपणे ते कोणी उमेदवारी समितीपर्यंत पोहोचण्याच्या खूप आधी प्रवाह पातळ करतात. स्थानिक संस्थांतील आरक्षण हा तो नैसर्गिक प्रयोग जो प्रश्न सोडवतो. 1992 पासून पंचायत व नगरपालिकेच्या एक-तृतीयांश जागा आणि अध्यक्षपदे स्त्रियांसाठी राखीव झाली. अडसर मतदाराचा पूर्वग्रह असता, तर राखीव जागांनी नाखूश, कमी मतदानाच्या निवडणुका वा रिकामी पदे दिली असती. त्याऐवजी दहा लाखांहून अधिक स्त्रिया निवडून आल्या, लढती खऱ्या राहिल्या, आणि या सभांच्या अभ्यासांना मोजण्याजोग्या वेगळ्या खर्च-प्राथमिकता आढळतात, ज्यांत अधिक पिण्याचे पाणी, स्वच्छता व शिक्षणाकडे जाते. उमेदवारींची मागणी तिथे होती; जे नव्हते ते उमेदवार बनण्याचा मार्ग. दोन प्रामाणिक गुंतागुंती. आरक्षणाचे टीकाकार युक्तिवाद करतात की आवर्तनाने राखीव जागा छद्म उमेदवारी वाढवू शकतात, जिथे पती वा वडील प्रत्यक्षात पद सांभाळतो — सुरुवातीच्या वर्षांची नोंदलेली समस्या, जरी अभ्यास आढळतात की स्त्रिया कार्यकाळ पूर्ण करून पुन्हा उभ्या राहिल्यावर ती घटते. आणि लोकसभा व विधानसभेच्या एक-तृतीयांश जागा राखीव करणारे राष्ट्रीय विधेयक दशके चर्चेत राहिले आणि 2023 मध्ये कायदा संमत झाला, ज्याची अंमलबजावणी भविष्यातील मतदारसंघ-पुनर्रचनेशी बांधलेली. म्हणून निष्कर्ष हा नाही की आरक्षण हे एकमेव वा खर्चाविनाचे उत्तर, तर हा की निदान स्पष्ट: मत आवश्यक आणि कधीही पुरेसे नव्हते, कारण अडसर कोण उभा राहू शकतो यात आहे, प्रतिनिधित्व मिळवायला कोण तयार यात नाही. (चुकीची उत्तरे आरक्षणाचा प्रयोग निर्दोष ठरवत असलेल्या मतदारांना दोष देतात, नसलेली कायदेशीर मनाई रचतात, वा जागांची मोजणी स्पष्ट नोंदवत असलेली तूट नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Gandhi's politics was saturated with religious language, Ambedkar's critique of caste engaged Hindu scripture directly, and movements against untouchability appealed to faith. Yet the same textbook calls communalism a danger to democracy. Draw the distinction precisely: when does religion in politics become communalism, and when does it not?",
          hi: "गांधी की राजनीति धार्मिक भाषा से भरी थी, आंबेडकर की जाति-आलोचना ने हिंदू धर्मग्रंथों से सीधे भिड़ंत ली, और अस्पृश्यता-विरोधी आंदोलनों ने आस्था की दुहाई दी। फिर भी वही पाठ्यपुस्तक सांप्रदायिकता को लोकतंत्र के लिए ख़तरा कहती है। भेद ठीक-ठीक खींचो: राजनीति में धर्म कब सांप्रदायिकता बन जाता है, और कब नहीं?",
          mr: "गांधींचे राजकारण धार्मिक भाषेने भरलेले होते, आंबेडकरांच्या जात-टीकेने हिंदू धर्मग्रंथांशी थेट भिडली, आणि अस्पृश्यताविरोधी चळवळींनी श्रद्धेला साद घातली. तरीही तेच पाठ्यपुस्तक जातीयवादाला लोकशाहीसाठी धोका म्हणते. भेद नेमका आखा: राजकारणातील धर्म कधी जातीयवाद बनतो, आणि कधी नाही?",
        },
        choices: [
          {
            en: "The line falls at the premise, not the vocabulary. Religion enters politics legitimately when it supplies moral argument, or when believers raise real grievances of discrimination and inequality — claims open to examination and answerable in principle. It becomes communalism when it asserts that followers of a faith form one political community with a single interest, that this interest is opposed to other faiths, and that the state should belong to one of them — because that premise is false about how people actually differ, and it makes citizenship depend on religion, which is what democracy cannot allow",
            hi: "रेखा आधार-वाक्य पर पड़ती है, शब्दावली पर नहीं। धर्म राजनीति में तब वैध रूप से आता है जब वह नैतिक तर्क देता है, या जब आस्थावान भेदभाव तथा असमानता की असली शिकायतें उठाते हैं — ऐसे दावे जो जाँच के लिए खुले और सिद्धांततः उत्तर-योग्य हैं। वह सांप्रदायिकता तब बनता है जब वह कहता है कि किसी आस्था के अनुयायी एक ही राजनीतिक समुदाय बनाते हैं जिसका एक हित है, कि यह हित दूसरी आस्थाओं के विरोध में है, और कि राज्य उनमें से एक का होना चाहिए — क्योंकि वह आधार-वाक्य इस बारे में झूठा है कि लोग वस्तुतः कैसे भिन्न हैं, और वह नागरिकता को धर्म पर निर्भर बना देता है, जिसकी लोकतंत्र अनुमति नहीं दे सकता",
            mr: "रेषा गृहीतकावर पडते, शब्दसंग्रहावर नाही. धर्म राजकारणात तेव्हा वैधपणे येतो जेव्हा तो नैतिक युक्तिवाद देतो, वा जेव्हा श्रद्धाळू भेदभाव व विषमतेच्या खऱ्या तक्रारी मांडतात — असे दावे जे तपासणीसाठी खुले आणि तत्त्वतः उत्तरयोग्य. तो जातीयवाद तेव्हा बनतो जेव्हा तो सांगतो की एखाद्या श्रद्धेचे अनुयायी एकच राजकीय समुदाय बनवतात ज्याचे एक हित आहे, की हे हित इतर श्रद्धांविरुद्ध आहे, आणि की राज्य त्यांपैकी एकाचे असावे — कारण ते गृहीतक लोक प्रत्यक्षात कसे वेगळे आहेत याबद्दल खोटे, आणि ते नागरिकत्व धर्मावर अवलंबून करते, ज्याला लोकशाही परवानगी देऊ शकत नाही",
          },
          {
            en: "Any mention of religion in political life is communalism, so Gandhi and Ambedkar were communal by this standard",
            hi: "राजनीतिक जीवन में धर्म का कोई भी उल्लेख सांप्रदायिकता है, अतः इस मानक से गांधी और आंबेडकर सांप्रदायिक थे",
            mr: "राजकीय जीवनात धर्माचा कोणताही उल्लेख जातीयवाद, म्हणून या मानकाने गांधी आणि आंबेडकर जातीयवादी होते",
          },
          {
            en: "There is no distinction at all; the textbook's warning about communalism is simply inconsistent",
            hi: "कोई भेद है ही नहीं; सांप्रदायिकता पर पाठ्यपुस्तक की चेतावनी बस असंगत है",
            mr: "कोणताही भेद नाहीच; जातीयवादाबद्दलचा पाठ्यपुस्तकाचा इशारा फक्त विसंगत आहे",
          },
          {
            en: "Religion is communal only when the minority invokes it, never when the majority does",
            hi: "धर्म तभी सांप्रदायिक है जब अल्पसंख्यक उसकी दुहाई दे, तब कभी नहीं जब बहुसंख्यक दे",
            mr: "धर्म तेव्हाच जातीय जेव्हा अल्पसंख्याक त्याला साद घालतो, कधीही नाही जेव्हा बहुसंख्याक घालतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The distinction cannot be drawn by looking at vocabulary, because if it could, the reformers would fall on the wrong side of it. Gandhi spoke constantly of truth, God and the moral duties of the soul, and derived his politics from them. Ambedkar's attack on caste worked through Hindu texts, not around them, and he later converted to Buddhism as a political as well as spiritual act. The movements against untouchability drew explicitly on religious authority to argue that the practice was a violation of faith rather than a requirement of it. If religion in politics were the problem, all of this would be condemned along with everything the textbook actually warns about. So the line lies elsewhere. It lies in the premise being asserted. Religion enters politics legitimately in two ways. First, as a source of moral argument. Every political tradition draws its values from somewhere, and there is no reason a citizen may not derive their commitments from faith any more than from utilitarianism or humanism. Such arguments enter the public square as arguments; they are answerable, contestable and open to being rejected by people who do not share the premises. Second, as a report of grievance. A religious community that is discriminated against in housing, employment, policing or education has a real complaint about equal treatment, and raising it politically is exactly what democratic citizenship is for. That complaint can be examined against evidence and either substantiated or refuted. Communalism asserts something different in kind. Its claim is that the followers of a religion constitute a single political community, that this community has one interest, that the interest is necessarily opposed to that of other religions, and that the state should therefore belong to one faith. Each step is doing damage. The first is factually wrong: people of one religion differ among themselves by class, caste, language, region, gender and opinion at least as much as they differ from anyone else, and treating them as a bloc erases every one of those differences. The second manufactures an enemy: if my interest is by definition opposed to yours, then negotiation is pointless and only domination remains. The third is the one democracy cannot survive, because it makes citizenship conditional on belief. Once the state belongs to a religion, adherents of other faiths are residents rather than citizens — tolerated, perhaps protected, but not equal. That is the same structure the chapter on power sharing identified in Sri Lanka, transposed from language to faith. This is also why Indian secularism is described as equal distance from all religions rather than hostility to religion. A hostile state would have to bar religious argument from public life, which would silence the reformers along with the communalists. The Constitution instead forbids the state from adopting a religion, guarantees freedom to profess and practise any faith or none, prohibits discrimination on religious grounds, and reserves the power to intervene in religious practice where rights are violated — which is precisely how abolishing untouchability could be both a religious reform and a secular act. A final honest note: the line is easier to state than to police. Real politics mixes the two — genuine grievances get communal framing, and communal appeals hide behind the language of justice — and the test has to be applied to the claim being made rather than to who is making it. Communalism is not the property of any one community; it is a structure of argument, and it is equally dangerous whether a majority or a minority employs it. (The wrong answers condemn all religious speech, deny that a distinction exists, or apply it asymmetrically, which would make the principle depend on numbers rather than on what is being claimed.)",
          hi: "भेद शब्दावली देखकर नहीं खींचा जा सकता, क्योंकि यदि खींचा जा सकता तो सुधारक उसकी ग़लत ओर पड़ते। गांधी सत्य, ईश्वर और आत्मा के नैतिक कर्तव्यों की बात लगातार करते थे, और अपनी राजनीति उन्हीं से निकालते थे। आंबेडकर का जाति पर आक्रमण हिंदू ग्रंथों से होकर चला, उन्हें घुमाकर नहीं, और उन्होंने बाद में बौद्ध धर्म आध्यात्मिक जितना ही राजनीतिक कर्म के रूप में अपनाया। अस्पृश्यता-विरोधी आंदोलनों ने स्पष्ट रूप से धार्मिक प्राधिकार का सहारा लेकर तर्क दिया कि वह प्रथा आस्था की आवश्यकता नहीं बल्कि उसका उल्लंघन है। यदि राजनीति में धर्म ही समस्या होती, तो यह सब भी उसी के साथ निंदित होता जिससे पाठ्यपुस्तक वास्तव में चेताती है। अतः रेखा कहीं और है। वह उस आधार-वाक्य में है जो कहा जा रहा। धर्म राजनीति में दो तरह से वैध रूप से आता है। पहला, नैतिक तर्क के स्रोत के रूप में। हर राजनीतिक परंपरा अपने मूल्य कहीं से लेती है, और कोई कारण नहीं कि नागरिक अपनी प्रतिबद्धताएँ आस्था से न निकाले, जैसे उपयोगितावाद या मानववाद से निकाल सकता है। ऐसे तर्क सार्वजनिक चौक में तर्क के रूप में आते हैं; वे उत्तर-योग्य, विवाद-योग्य और उन लोगों द्वारा ठुकराए जाने को खुले हैं जो आधार साझा नहीं करते। दूसरा, शिकायत के विवरण के रूप में। जिस धार्मिक समुदाय से आवास, रोज़गार, पुलिसिंग या शिक्षा में भेदभाव होता है उसकी समान व्यवहार की असली शिकायत है, और उसे राजनीतिक रूप से उठाना ठीक वही है जिसके लिए लोकतांत्रिक नागरिकता है। वह शिकायत प्रमाण के विरुद्ध जाँची जा सकती और या तो पुष्ट या खंडित हो सकती है। सांप्रदायिकता प्रकार से भिन्न कुछ कहती है। उसका दावा यह कि किसी धर्म के अनुयायी एक ही राजनीतिक समुदाय बनाते हैं, कि इस समुदाय का एक हित है, कि वह हित अनिवार्यतः दूसरे धर्मों के विरोध में है, और कि इसलिए राज्य एक आस्था का होना चाहिए। हर चरण हानि कर रहा है। पहला तथ्यतः ग़लत है: एक ही धर्म के लोग आपस में वर्ग, जाति, भाषा, क्षेत्र, लिंग और राय से कम से कम उतने ही भिन्न हैं जितने किसी और से, और उन्हें एक गुट मानना उन सब भेदों को मिटा देता है। दूसरा शत्रु गढ़ता है: यदि मेरा हित परिभाषा से तुम्हारे विरोध में है, तो बातचीत निरर्थक है और केवल प्रभुत्व बचता है। तीसरा वह है जिससे लोकतंत्र बच नहीं सकता, क्योंकि वह नागरिकता को विश्वास पर सशर्त कर देता है। एक बार राज्य किसी धर्म का हो जाए, तो दूसरी आस्थाओं के अनुयायी नागरिक नहीं, निवासी हैं — सहे गए, शायद संरक्षित, पर बराबर नहीं। यह वही ढाँचा है जिसे सत्ता-साझेदारी वाले अध्याय ने श्रीलंका में पहचाना, भाषा से आस्था पर बदला हुआ। इसी से भारतीय धर्मनिरपेक्षता को सब धर्मों से बराबर दूरी कहा जाता है, धर्म से शत्रुता नहीं। शत्रु राज्य को सार्वजनिक जीवन से धार्मिक तर्क वर्जित करना पड़ता, जो सांप्रदायिकों के साथ सुधारकों को भी चुप करा देता। संविधान इसके बजाय राज्य को धर्म अपनाने से रोकता है, कोई भी आस्था मानने-निभाने या न मानने की स्वतंत्रता सुनिश्चित करता है, धार्मिक आधार पर भेदभाव मना करता है, और जहाँ अधिकारों का उल्लंघन हो वहाँ धार्मिक प्रथा में दख़ल की शक्ति रखता है — ठीक इसी से अस्पृश्यता का उन्मूलन धार्मिक सुधार और धर्मनिरपेक्ष कर्म दोनों हो सका। एक अंतिम ईमानदार टिप्पणी: रेखा कहनी जितनी आसान है, पहरा देना उतना नहीं। असली राजनीति दोनों को मिलाती है — सच्ची शिकायतें सांप्रदायिक ढाँचा पा जाती हैं, और सांप्रदायिक अपीलें न्याय की भाषा के पीछे छिपती हैं — और कसौटी उस दावे पर लगानी होगी जो किया जा रहा, उस पर नहीं कि कर कौन रहा। सांप्रदायिकता किसी एक समुदाय की संपत्ति नहीं; वह तर्क का एक ढाँचा है, और वह समान रूप से ख़तरनाक है चाहे उसे बहुसंख्यक चलाए या अल्पसंख्यक। (ग़लत उत्तर सब धार्मिक कथन की निंदा करते, भेद के अस्तित्व को नकारते, या उसे असममित रूप से लगाते — जो सिद्धांत को इस पर निर्भर कर देता कि संख्या कितनी है, इस पर नहीं कि दावा क्या है।)",
          mr: "भेद शब्दसंग्रह पाहून आखता येत नाही, कारण आखता आला असता तर सुधारक त्याच्या चुकीच्या बाजूला पडले असते. गांधी सत्य, ईश्वर आणि आत्म्याच्या नैतिक कर्तव्यांबद्दल सतत बोलत, आणि आपले राजकारण त्यांतूनच काढत. आंबेडकरांचा जातीवरील हल्ला हिंदू ग्रंथांतून चालला, त्यांना वळसा घालून नाही, आणि त्यांनी नंतर बौद्ध धर्म आध्यात्मिक तितकाच राजकीय कृती म्हणून स्वीकारला. अस्पृश्यताविरोधी चळवळींनी स्पष्टपणे धार्मिक अधिकाराचा आधार घेऊन युक्तिवाद केला की ती प्रथा श्रद्धेची गरज नव्हे तर तिचे उल्लंघन. राजकारणातील धर्मच समस्या असती, तर हे सर्वही त्याच्यासोबत निंद्य ठरले असते ज्याबद्दल पाठ्यपुस्तक प्रत्यक्षात इशारा देते. म्हणून रेषा दुसरीकडे. ती जे गृहीतक मांडले जात आहे त्यात. धर्म राजकारणात दोन प्रकारे वैधपणे येतो. पहिला, नैतिक युक्तिवादाचा स्रोत म्हणून. प्रत्येक राजकीय परंपरा आपली मूल्ये कुठूनतरी घेते, आणि नागरिकाने आपली बांधिलकी श्रद्धेतून काढू नये असे कोणतेही कारण नाही, जसे तो उपयुक्ततावाद वा मानवतावादातून काढू शकतो. असे युक्तिवाद सार्वजनिक चौकात युक्तिवाद म्हणून येतात; ते उत्तरयोग्य, वादयोग्य आणि गृहीतके न वाटणाऱ्यांकडून नाकारले जाण्यास खुले. दुसरा, तक्रारीचा अहवाल म्हणून. ज्या धार्मिक समुदायाशी घर, रोजगार, पोलिसी वा शिक्षणात भेदभाव होतो त्याची समान वागणुकीची खरी तक्रार, आणि ती राजकीयरीत्या मांडणे नेमके तेच ज्यासाठी लोकशाही नागरिकत्व. ती तक्रार पुराव्याविरुद्ध तपासता येते आणि एकतर सिद्ध वा खोडता येते. जातीयवाद प्रकाराने वेगळे काही सांगतो. त्याचा दावा हा की एखाद्या धर्माचे अनुयायी एकच राजकीय समुदाय बनवतात, की या समुदायाचे एक हित आहे, की ते हित अपरिहार्यपणे इतर धर्मांविरुद्ध, आणि की म्हणून राज्य एका श्रद्धेचे असावे. प्रत्येक पायरी हानी करते. पहिली तथ्यतः चुकीची: एकाच धर्माचे लोक आपापसात वर्ग, जात, भाषा, प्रदेश, लिंग आणि मताने किमान तितकेच वेगळे जितके इतर कोणाहून, आणि त्यांना एक गठ्ठा मानणे ते सर्व भेद पुसते. दुसरी शत्रू घडवते: माझे हित व्याख्येनेच तुमच्याविरुद्ध असेल, तर वाटाघाटी निरर्थक आणि फक्त वर्चस्व उरते. तिसरी ती जिच्यातून लोकशाही वाचू शकत नाही, कारण ती नागरिकत्व श्रद्धेवर सशर्त करते. एकदा राज्य एखाद्या धर्माचे झाले, तर इतर श्रद्धांचे अनुयायी नागरिक नव्हे तर रहिवासी — सहन केलेले, कदाचित संरक्षित, पण समान नाही. हीच ती रचना जी सत्ता-विभागणीच्या प्रकरणाने श्रीलंकेत ओळखली, भाषेवरून श्रद्धेवर बदललेली. म्हणूनच भारतीय धर्मनिरपेक्षतेला सर्व धर्मांपासून समान अंतर म्हटले जाते, धर्माशी शत्रुत्व नव्हे. शत्रुत्वाच्या राज्याला सार्वजनिक जीवनातून धार्मिक युक्तिवाद वर्ज्य करावा लागला असता, जे जातीयवाद्यांसोबत सुधारकांनाही गप्प करते. राज्यघटना त्याऐवजी राज्याला धर्म स्वीकारण्यास मनाई करते, कोणतीही श्रद्धा मानण्याचे-पाळण्याचे वा न मानण्याचे स्वातंत्र्य हमी देते, धार्मिक आधारावर भेदभाव मनाई करते, आणि जिथे हक्कांचे उल्लंघन तिथे धार्मिक प्रथेत हस्तक्षेपाची सत्ता राखते — नेमके यामुळेच अस्पृश्यतेचे निर्मूलन धार्मिक सुधारणा आणि धर्मनिरपेक्ष कृती दोन्ही होऊ शकले. एक शेवटची प्रामाणिक नोंद: रेषा सांगणे जितके सोपे तितके तिच्यावर पहारा देणे नाही. खरे राजकारण दोन्ही मिसळते — खऱ्या तक्रारींना जातीय चौकट मिळते, आणि जातीय आवाहने न्यायाच्या भाषेमागे लपतात — आणि कसोटी मांडल्या जाणाऱ्या दाव्यावर लावावी लागते, तो कोण मांडतो यावर नाही. जातीयवाद कोणत्याही एका समुदायाची मालमत्ता नाही; ती युक्तिवादाची रचना, आणि ती सारखीच धोकादायक मग तिला बहुसंख्याक वापरो वा अल्पसंख्याक. (चुकीची उत्तरे सर्व धार्मिक बोलण्याची निंदा करतात, भेदाचे अस्तित्व नाकारतात, वा तो असममितपणे लावतात — जे तत्त्व संख्येवर अवलंबून करते, दावा काय आहे यावर नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Political Parties                                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-10-political-parties",
    subject: "CIVICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 4 — Political Parties",
      hi: "अध्याय 4 — राजनीतिक दल",
      mr: "प्रकरण 4 — राजकीय पक्ष",
    },
    name: {
      en: "Political Parties",
      hi: "राजनीतिक दल",
      mr: "राजकीय पक्ष",
    },
    summary: {
      en: "The institution nobody trusts and no democracy can do without: the work a party actually performs between elections, the count of parties a society ends up with and why, the law that stopped members being bought and quietly stopped them dissenting too, families that inherit a party, and money that buys the ticket before any voter is asked.",
      hi: "वह संस्था जिस पर कोई भरोसा नहीं करता और जिसके बिना कोई लोकतंत्र चल नहीं सकता: चुनावों के बीच दल वस्तुतः जो काम करता है, कोई समाज कितने दलों पर पहुँचता और क्यों, वह क़ानून जिसने सदस्यों की ख़रीद रोकी और चुपचाप उनकी असहमति भी, वे परिवार जो दल विरासत में पाते, और वह पैसा जो किसी मतदाता से पूछे जाने से पहले टिकट ख़रीद लेता।",
      mr: "ती संस्था जिच्यावर कोणी विश्वास ठेवत नाही आणि जिच्याविना कोणतीही लोकशाही चालू शकत नाही: निवडणुकांदरम्यान पक्ष प्रत्यक्षात जे काम करतो, एखादा समाज किती पक्षांवर पोहोचतो आणि का, तो कायदा ज्याने सदस्यांची खरेदी थांबवली आणि गुपचूप त्यांची असहमतीही, ती कुटुंबे जी पक्ष वारशाने मिळवतात, आणि तो पैसा जो कोणत्याही मतदाराला विचारण्याआधीच तिकीट विकत घेतो.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "functions-of-a-party",
        name: {
          en: "The functions of a party",
          hi: "दल के कार्य",
          mr: "पक्षाची कार्ये",
        },
        kind: "idea",
        prompt: {
          en: "It contests elections, puts forward policies, makes laws, forms and runs governments, plays the opposition when it loses, shapes opinion, and carries people's demands to those in office. Which institution does all of this?",
          hi: "वह चुनाव लड़ती है, नीतियाँ रखती है, क़ानून बनाती है, सरकारें बनाती और चलाती है, हारने पर विपक्ष निभाती है, राय गढ़ती है, और लोगों की माँगें पदासीनों तक ले जाती है। यह सब कौन-सी संस्था करती है?",
          mr: "ती निवडणुका लढवते, धोरणे मांडते, कायदे करते, सरकारे बनवते आणि चालवते, हरल्यावर विरोधी पक्ष निभावते, मत घडवते, आणि लोकांच्या मागण्या पदावरच्यांपर्यंत नेते. हे सर्व कोणती संस्था करते?",
        },
        statement: {
          en: "A political party contests elections, offers policies and programmes, makes laws, forms and runs governments or acts as the opposition, shapes public opinion, and provides people access to government machinery and welfare schemes.",
          hi: "राजनीतिक दल चुनाव लड़ता है, नीतियाँ तथा कार्यक्रम रखता है, क़ानून बनाता है, सरकारें बनाता-चलाता या विपक्ष की भूमिका निभाता है, जनमत गढ़ता है, और लोगों को सरकारी तंत्र तथा कल्याण योजनाओं तक पहुँच देता है।",
          mr: "राजकीय पक्ष निवडणुका लढवतो, धोरणे व कार्यक्रम मांडतो, कायदे करतो, सरकारे बनवतो-चालवतो वा विरोधी पक्षाची भूमिका बजावतो, जनमत घडवतो, आणि लोकांना शासकीय यंत्रणा व कल्याण योजनांपर्यंत प्रवेश देतो.",
        },
        detail: {
          en: "Without parties every candidate would be an independent, no government could be held responsible for anything, and no voter could know what a legislature would do before electing it.",
          hi: "दलों के बिना हर उम्मीदवार निर्दलीय होता, किसी सरकार को किसी बात के लिए ज़िम्मेदार नहीं ठहराया जा सकता, और कोई मतदाता विधानमंडल चुनने से पहले जान नहीं सकता कि वह करेगा क्या।",
          mr: "पक्षांविना प्रत्येक उमेदवार अपक्ष असता, कोणत्याही सरकारला कशासाठीही जबाबदार धरता आले नसते, आणि कोणता मतदार विधिमंडळ निवडण्याआधी ते काय करेल हे जाणू शकला नसता.",
        },
        extra: {
          en: "A party is made of three things at once — its leaders, its active members and its followers — and losing any one of them leaves it unable to do the work.",
          hi: "दल एक साथ तीन चीज़ों से बना है — उसके नेता, उसके सक्रिय सदस्य और उसके अनुयायी — और इनमें से कोई एक भी खोने पर वह काम करने योग्य नहीं रहता।",
          mr: "पक्ष एकाच वेळी तीन गोष्टींनी बनलेला — त्याचे नेते, त्याचे सक्रिय सदस्य आणि त्याचे अनुयायी — आणि यांपैकी एकही गमावल्यास तो काम करण्यायोग्य राहत नाही.",
        },
        pair: {
          left: {
            en: "Contest, legislate, govern, oppose, and carry demands",
            hi: "लड़ना, क़ानून बनाना, शासन, विरोध, और माँगें ढोना",
            mr: "लढणे, कायदे करणे, शासन, विरोध, आणि मागण्या वाहणे",
          },
          right: {
            en: "the functions of a party",
            hi: "दल के कार्य",
            mr: "पक्षाची कार्ये",
          },
        },
      },
      {
        id: "party-systems",
        name: {
          en: "Party systems",
          hi: "दल-प्रणालियाँ",
          mr: "पक्षपद्धती",
        },
        kind: "idea",
        prompt: {
          en: "China permits only one; the United States is effectively contested by two; India has dozens with several holding real power. Which classification counts how many parties a country's competition actually runs on?",
          hi: "चीन केवल एक की अनुमति देता है; संयुक्त राज्य में प्रभावी रूप से दो मुक़ाबला करते हैं; भारत में दर्जनों हैं जिनमें कई के पास असली सत्ता है। कौन-सा वर्गीकरण गिनता है कि किसी देश की प्रतिस्पर्धा वस्तुतः कितने दलों पर चलती है?",
          mr: "चीन फक्त एकाला परवानगी देतो; अमेरिकेत प्रत्यक्षात दोन स्पर्धा करतात; भारतात डझनभर आहेत ज्यांतील कित्येकांकडे खरी सत्ता. कोणते वर्गीकरण मोजते की एखाद्या देशाची स्पर्धा प्रत्यक्षात किती पक्षांवर चालते?",
        },
        statement: {
          en: "Party systems are classified by how many parties genuinely compete for power — one-party systems, which are not democratic; two-party systems, where two contenders alternate; and multi-party systems, where several parties matter and governments are often coalitions.",
          hi: "दल-प्रणालियाँ इससे वर्गीकृत होती हैं कि सत्ता के लिए सचमुच कितने दल मुक़ाबला करते हैं — एकदलीय प्रणालियाँ, जो लोकतांत्रिक नहीं; द्विदलीय, जहाँ दो दावेदार बारी-बारी आते; और बहुदलीय, जहाँ कई दल मायने रखते और सरकारें अक्सर गठबंधन होती हैं।",
          mr: "पक्षपद्धती यावरून वर्गीकृत होतात की सत्तेसाठी खरोखर किती पक्ष स्पर्धा करतात — एकपक्षीय पद्धती, ज्या लोकशाही नाहीत; द्विपक्षीय, जिथे दोन दावेदार आळीपाळीने येतात; आणि बहुपक्षीय, जिथे अनेक पक्ष महत्त्वाचे आणि सरकारे अनेकदा आघाड्या असतात.",
        },
        detail: {
          en: "No system is simply best: the number a country ends up with grows out of its social divisions, its history and its electoral rules, and cannot be chosen at will.",
          hi: "कोई प्रणाली बस सर्वोत्तम नहीं: कोई देश जिस संख्या पर पहुँचता है वह उसके सामाजिक विभाजनों, उसके इतिहास और उसके चुनावी नियमों से उगती है, और मर्ज़ी से चुनी नहीं जा सकती।",
          mr: "कोणतीही पद्धत केवळ सर्वोत्तम नाही: एखादा देश ज्या संख्येवर पोहोचतो ती त्याच्या सामाजिक विभाजनांतून, त्याच्या इतिहासातून आणि त्याच्या निवडणूक नियमांतून उगवते, आणि मर्जीने निवडता येत नाही.",
        },
        extra: {
          en: "A two-party system offers clarity but leaves large groups unrepresented; a multi-party one represents more people but tends to produce coalitions that bargain.",
          hi: "द्विदलीय प्रणाली स्पष्टता देती है पर बड़े समूह बिना प्रतिनिधित्व छोड़ती है; बहुदलीय अधिक लोगों का प्रतिनिधित्व करती है पर सौदेबाज़ी करती गठबंधन सरकारें देती है।",
          mr: "द्विपक्षीय पद्धत स्पष्टता देते पण मोठे गट प्रतिनिधित्वाविना सोडते; बहुपक्षीय अधिक लोकांचे प्रतिनिधित्व करते पण घासाघीस करणाऱ्या आघाड्या घडवते.",
        },
        pair: {
          left: {
            en: "How many parties really contest for power",
            hi: "सत्ता के लिए सचमुच कितने दल लड़ते",
            mr: "सत्तेसाठी खरोखर किती पक्ष लढतात",
          },
          right: {
            en: "party systems",
            hi: "दल-प्रणालियाँ",
            mr: "पक्षपद्धती",
          },
        },
      },
      {
        id: "national-and-state-parties",
        name: {
          en: "National and state parties",
          hi: "राष्ट्रीय और राज्य दल",
          mr: "राष्ट्रीय आणि राज्य पक्ष",
        },
        kind: "structure",
        prompt: {
          en: "The Election Commission recognises some parties across the country and others within a single state, allotting each a reserved symbol on the basis of votes and seats won. Which classification is this?",
          hi: "निर्वाचन आयोग कुछ दलों को पूरे देश में और अन्य को एक ही राज्य के भीतर मान्यता देता है, और जीते मतों तथा सीटों के आधार पर हर एक को आरक्षित चिह्न देता है। यह कौन-सा वर्गीकरण है?",
          mr: "निवडणूक आयोग काही पक्षांना देशभर आणि इतरांना एकाच राज्यात मान्यता देतो, आणि जिंकलेल्या मते व जागांच्या आधारावर प्रत्येकाला राखीव चिन्ह देतो. हे कोणते वर्गीकरण?",
        },
        statement: {
          en: "The Election Commission recognises parties as national or state parties on the basis of their share of votes and seats, and gives each a reserved election symbol that no other party may use.",
          hi: "निर्वाचन आयोग दलों को उनके मत तथा सीट-हिस्से के आधार पर राष्ट्रीय या राज्य दल के रूप में मान्यता देता है, और हर एक को आरक्षित चुनाव-चिह्न देता है जिसे कोई अन्य दल इस्तेमाल नहीं कर सकता।",
          mr: "निवडणूक आयोग पक्षांना त्यांच्या मते व जागांच्या वाट्याच्या आधारावर राष्ट्रीय वा राज्य पक्ष म्हणून मान्यता देतो, आणि प्रत्येकाला राखीव निवडणूक चिन्ह देतो जे इतर कोणताही पक्ष वापरू शकत नाही.",
        },
        detail: {
          en: "The symbol matters in a country where many voters cannot read a name: it is the party's identity on the ballot and cannot be borrowed by a rival.",
          hi: "ऐसे देश में जहाँ कई मतदाता नाम नहीं पढ़ सकते, चिह्न मायने रखता है: वह मतपत्र पर दल की पहचान है और कोई प्रतिद्वंद्वी उसे उधार नहीं ले सकता।",
          mr: "अशा देशात जिथे अनेक मतदार नाव वाचू शकत नाहीत, चिन्ह महत्त्वाचे: ते मतपत्रावरील पक्षाची ओळख आणि कोणता प्रतिस्पर्धी ते उसने घेऊ शकत नाही.",
        },
        extra: {
          en: "State parties have grown steadily stronger, and since 1989 no national party has been able to form a government at the centre without their support.",
          hi: "राज्य दल लगातार मज़बूत होते गए हैं, और 1989 से कोई राष्ट्रीय दल उनके समर्थन बिना केंद्र में सरकार नहीं बना सका।",
          mr: "राज्य पक्ष सतत बळकट होत गेले, आणि 1989 पासून कोणताही राष्ट्रीय पक्ष त्यांच्या पाठिंब्याविना केंद्रात सरकार बनवू शकलेला नाही.",
        },
        pair: {
          left: {
            en: "Recognised across the country or within one state",
            hi: "पूरे देश में या एक राज्य के भीतर मान्यता-प्राप्त",
            mr: "देशभर वा एका राज्यात मान्यताप्राप्त",
          },
          right: {
            en: "national and state parties",
            hi: "राष्ट्रीय और राज्य दल",
            mr: "राष्ट्रीय आणि राज्य पक्ष",
          },
        },
      },
      {
        id: "anti-defection-law",
        name: {
          en: "The anti-defection law",
          hi: "दल-बदल विरोधी क़ानून",
          mr: "पक्षांतरबंदी कायदा",
        },
        kind: "law",
        prompt: {
          en: "A constitutional amendment provided that a legislator who leaves the party on whose ticket they were elected, or votes against its instruction, loses their seat — a rule aimed at members changing sides for office or money. Which law is this?",
          hi: "एक संवैधानिक संशोधन ने तय किया कि जो विधायक उस दल को छोड़े जिसके टिकट पर वह चुना गया, या उसके निर्देश के विरुद्ध मत दे, वह अपनी सीट खो देगा — यह नियम पद या पैसे के लिए पाला बदलते सदस्यों पर निशाना था। यह कौन-सा क़ानून है?",
          mr: "एका घटनादुरुस्तीने ठरवले की जो आमदार-खासदार ज्या पक्षाच्या तिकिटावर निवडून आला तो सोडेल, वा त्याच्या आदेशाविरुद्ध मत देईल, तो आपली जागा गमावेल — हा नियम पद वा पैशासाठी बाजू बदलणाऱ्या सदस्यांवर रोखलेला. हा कोणता कायदा?",
        },
        statement: {
          en: "The anti-defection law disqualifies a legislator who leaves the party on whose symbol they were elected, or who votes against the party whip, and it was enacted to stop members being bought to topple governments.",
          hi: "दल-बदल विरोधी क़ानून उस विधायक को अयोग्य ठहराता है जो उस दल को छोड़े जिसके चिह्न पर वह चुना गया, या जो दल के व्हिप के विरुद्ध मत दे, और वह इसलिए बनाया गया कि सरकारें गिराने को सदस्य ख़रीदे न जा सकें।",
          mr: "पक्षांतरबंदी कायदा त्या सदस्याला अपात्र ठरवतो जो ज्या पक्षाच्या चिन्हावर निवडून आला तो सोडतो, वा जो पक्षाच्या व्हिपविरुद्ध मत देतो, आणि तो यासाठी केला की सरकारे पाडायला सदस्य विकत घेतले जाऊ नयेत.",
        },
        detail: {
          en: "It largely stopped the practice it targeted, and governments became much harder to topple by purchasing individual members.",
          hi: "उसने बड़े हिस्से में वह प्रथा रोक दी जिस पर वह लक्षित था, और अलग-अलग सदस्य ख़रीदकर सरकारें गिराना कहीं कठिन हो गया।",
          mr: "त्याने ज्यावर रोख होता ती प्रथा मोठ्या प्रमाणात थांबवली, आणि वेगवेगळे सदस्य विकत घेऊन सरकारे पाडणे कितीतरी कठीण झाले.",
        },
        extra: {
          en: "It also had a cost nobody intended: a member who disagrees with their own party on a bill can no longer say so with a vote, so debate inside the house counts for less.",
          hi: "उसकी एक ऐसी क़ीमत भी रही जो किसी ने नहीं चाही: जो सदस्य किसी विधेयक पर अपने ही दल से असहमत हो वह अब मत से यह कह नहीं सकता, अतः सदन के भीतर बहस का महत्व घट जाता है।",
          mr: "त्याची अशी किंमतही ठरली जी कोणी इच्छिली नव्हती: जो सदस्य एखाद्या विधेयकावर स्वतःच्याच पक्षाशी असहमत असतो तो आता मताने ते सांगू शकत नाही, म्हणून सभागृहातील चर्चेचे महत्त्व घटते.",
        },
        pair: {
          left: {
            en: "Change your party or defy the whip, lose your seat",
            hi: "दल बदलो या व्हिप तोड़ो, सीट गँवाओ",
            mr: "पक्ष बदला वा व्हिप मोडा, जागा गमवा",
          },
          right: {
            en: "the anti-defection law",
            hi: "दल-बदल विरोधी क़ानून",
            mr: "पक्षांतरबंदी कायदा",
          },
        },
      },
      {
        id: "dynastic-succession",
        name: {
          en: "Dynastic succession",
          hi: "वंशवादी उत्तराधिकार",
          mr: "घराणेशाही वारसा",
        },
        kind: "idea",
        prompt: {
          en: "Because many parties hold no organisational elections and keep no membership register, the top posts pass to those close to the leader, and often to the leader's own family. What challenge is this?",
          hi: "क्योंकि कई दल संगठनात्मक चुनाव नहीं कराते और सदस्यता-रजिस्टर नहीं रखते, शीर्ष पद नेता के निकटस्थों को, और अक्सर नेता के अपने परिवार को चले जाते हैं। यह कौन-सी चुनौती है?",
          mr: "अनेक पक्ष संघटनात्मक निवडणुका घेत नाहीत आणि सदस्यत्व नोंदवही ठेवत नाहीत, म्हणून वरची पदे नेत्याच्या जवळच्यांना, आणि अनेकदा नेत्याच्या स्वतःच्या कुटुंबाला जातात. हे कोणते आव्हान?",
        },
        statement: {
          en: "Dynastic succession is the challenge of party leadership passing to family members and favoured insiders, and it follows from the absence of inner-party democracy — no organisational elections, no membership register, no open contest for posts.",
          hi: "वंशवादी उत्तराधिकार दल-नेतृत्व के परिवारजनों तथा कृपापात्र भीतरी लोगों को जाने की चुनौती है, और वह आंतरिक दल-लोकतंत्र के अभाव से निकलती है — न संगठनात्मक चुनाव, न सदस्यता-रजिस्टर, न पदों के लिए खुला मुक़ाबला।",
          mr: "घराणेशाही वारसा म्हणजे पक्षनेतृत्व कुटुंबीय व मर्जीतल्या आतल्या माणसांकडे जाण्याचे आव्हान, आणि ते अंतर्गत पक्ष-लोकशाहीच्या अभावातून निघते — ना संघटनात्मक निवडणुका, ना सदस्यत्व नोंदवही, ना पदांसाठी खुली स्पर्धा.",
        },
        detail: {
          en: "The objection is not that a leader's relative may be capable, but that ordinary members never get the chance to be tested against them.",
          hi: "आपत्ति यह नहीं कि नेता का रिश्तेदार योग्य हो सकता है, बल्कि यह कि साधारण सदस्यों को उसके सामने परखे जाने का अवसर कभी मिलता ही नहीं।",
          mr: "आक्षेप हा नाही की नेत्याचा नातेवाईक सक्षम असू शकतो, तर हा की सामान्य सदस्यांना त्याच्यासमोर तपासले जाण्याची संधी कधी मिळतच नाही.",
        },
        extra: {
          en: "It is not peculiar to India: parties in many long-established democracies concentrate power in small unelected circles, though rarely along family lines.",
          hi: "यह भारत की विशेषता नहीं: कई पुराने लोकतंत्रों के दल भी सत्ता छोटे अनिर्वाचित घेरों में केंद्रित करते हैं, यद्यपि पारिवारिक रेखाओं पर कम ही।",
          mr: "हे भारताचे वैशिष्ट्य नाही: अनेक जुन्या लोकशाहींतील पक्षही सत्ता लहान न-निवडलेल्या वर्तुळांत केंद्रित करतात, जरी कौटुंबिक रेषांवर क्वचितच.",
        },
        pair: {
          left: {
            en: "No inner elections, so the post stays in the family",
            hi: "भीतरी चुनाव नहीं, अतः पद परिवार में ही",
            mr: "आतल्या निवडणुका नाहीत, म्हणून पद कुटुंबातच",
          },
          right: {
            en: "dynastic succession",
            hi: "वंशवादी उत्तराधिकार",
            mr: "घराणेशाही वारसा",
          },
        },
      },
      {
        id: "money-and-muscle",
        name: {
          en: "Money and muscle power",
          hi: "धन-बल और बाहुबल",
          mr: "धनशक्ती आणि बाहुबल",
        },
        kind: "idea",
        prompt: {
          en: "Because elections are expensive, parties prefer candidates who can fund their own campaigns or bring donors, and in some constituencies candidates who can command force — so wealth and intimidation decide who appears on the ballot. Which challenge is this?",
          hi: "क्योंकि चुनाव महँगे हैं, दल ऐसे उम्मीदवार पसंद करते हैं जो अपना अभियान स्वयं वित्तपोषित कर सकें या दानदाता ला सकें, और कुछ क्षेत्रों में ऐसे जो बल जुटा सकें — अतः धन और भय तय करते हैं कि मतपत्र पर कौन आएगा। यह कौन-सी चुनौती है?",
          mr: "निवडणुका महाग असल्याने, पक्ष असे उमेदवार पसंत करतात जे स्वतःची मोहीम स्वतः चालवू शकतील वा देणगीदार आणू शकतील, आणि काही मतदारसंघांत असे जे बळ उभे करू शकतील — म्हणून संपत्ती आणि दहशत ठरवतात की मतपत्रावर कोण येईल. हे कोणते आव्हान?",
        },
        statement: {
          en: "Money and muscle power distort party competition by making the ability to finance a campaign, or to command force locally, the effective test for getting a ticket, rather than the candidate's record or support.",
          hi: "धन-बल और बाहुबल दलीय प्रतिस्पर्धा को विकृत करते हैं क्योंकि टिकट पाने की असली कसौटी उम्मीदवार का रिकॉर्ड या समर्थन नहीं बल्कि अभियान वित्तपोषित करने या स्थानीय रूप से बल जुटाने की क्षमता बन जाती है।",
          mr: "धनशक्ती आणि बाहुबल पक्षीय स्पर्धा विकृत करतात कारण तिकीट मिळवण्याची खरी कसोटी उमेदवाराचा लौकिक वा पाठिंबा नव्हे तर मोहीम चालवण्याची किंवा स्थानिक बळ उभे करण्याची क्षमता बनते.",
        },
        detail: {
          en: "The effect is on the choice offered, not on the voter: an electorate can only pick among the names parties have already decided to put forward.",
          hi: "असर मतदाता पर नहीं, दी गई पसंद पर है: मतदाता केवल उन्हीं नामों में से चुन सकते हैं जिन्हें दल पहले ही रखने का निर्णय कर चुके।",
          mr: "परिणाम मतदारावर नव्हे तर दिलेल्या पर्यायावर: मतदार केवळ त्याच नावांतून निवडू शकतात जी पक्षांनी आधीच मांडायचे ठरवले.",
        },
        extra: {
          en: "Disclosure of candidates' assets and criminal cases was made compulsory by a Supreme Court order, so the information now exists — whether voters can act on it is another matter.",
          hi: "उम्मीदवारों की संपत्ति तथा आपराधिक मुक़दमों का प्रकटीकरण उच्चतम न्यायालय के आदेश से अनिवार्य हुआ, अतः सूचना अब मौजूद है — मतदाता उस पर कार्रवाई कर पाते या नहीं यह अलग बात है।",
          mr: "उमेदवारांची मालमत्ता व गुन्हेगारी खटले जाहीर करणे सर्वोच्च न्यायालयाच्या आदेशाने सक्तीचे झाले, म्हणून माहिती आता उपलब्ध — मतदार तिच्यावर कृती करू शकतात की नाही ही वेगळी बाब.",
        },
        pair: {
          left: {
            en: "Wealth and force deciding who gets the ticket",
            hi: "धन और बल तय करें टिकट किसे मिले",
            mr: "संपत्ती आणि बळ ठरवतात तिकीट कोणाला",
          },
          right: {
            en: "money and muscle power",
            hi: "धन-बल और बाहुबल",
            mr: "धनशक्ती आणि बाहुबल",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Commentators regularly describe India's multi-party system as a weakness, pointing to coalitions, unstable governments and horse-trading, and suggest a two-party system would serve the country better. Assess whether the number of parties is a choice India could make.",
          hi: "टिप्पणीकार नियमित रूप से भारत की बहुदलीय प्रणाली को कमज़ोरी बताते हैं, गठबंधनों, अस्थिर सरकारों और सौदेबाज़ी की ओर इशारा करते हुए, और सुझाते हैं कि द्विदलीय प्रणाली देश की बेहतर सेवा करेगी। परखो कि दलों की संख्या क्या ऐसा चुनाव है जो भारत कर सकता है।",
          mr: "भाष्यकार नियमितपणे भारताच्या बहुपक्षीय पद्धतीला दुर्बलता म्हणतात, आघाड्या, अस्थिर सरकारे आणि घोडेबाजाराकडे बोट दाखवत, आणि सुचवतात की द्विपक्षीय पद्धत देशाची अधिक चांगली सेवा करेल. तपासा की पक्षांची संख्या ही अशी निवड आहे का जी भारत करू शकतो.",
        },
        choices: [
          {
            en: "It is not a choice. The number of parties grows out of a society's divisions — region, language, caste and religion, each concentrated enough somewhere to elect representatives — together with its history and electoral rules. Forcing two parties on a society this varied would leave whole regions and communities without anyone speaking for them, which is the failure that produced Sri Lanka's conflict. Coalitions are the price of representation, and the real question is how to make them work, not how to abolish them",
            hi: "यह चुनाव नहीं है। दलों की संख्या समाज के विभाजनों से उगती है — क्षेत्र, भाषा, जाति और धर्म, हर एक कहीं न कहीं प्रतिनिधि चुनने भर केंद्रित — साथ ही उसके इतिहास और चुनावी नियमों से। इतने विविध समाज पर दो दल थोपना पूरे-पूरे क्षेत्रों तथा समुदायों को बिना किसी बोलने वाले के छोड़ देगा, और वही विफलता श्रीलंका का संघर्ष लाई थी। गठबंधन प्रतिनिधित्व की क़ीमत हैं, और असली प्रश्न यह कि उन्हें चलाया कैसे जाए, मिटाया कैसे जाए यह नहीं",
            mr: "ही निवड नाही. पक्षांची संख्या समाजाच्या विभाजनांतून उगवते — प्रदेश, भाषा, जात आणि धर्म, प्रत्येक कुठेतरी प्रतिनिधी निवडण्याइतका केंद्रित — तसेच त्याचा इतिहास आणि निवडणूक नियमांतून. इतक्या विविध समाजावर दोन पक्ष लादणे अख्खे प्रदेश आणि समुदाय बोलणाऱ्या कोणाविनाच सोडेल, आणि तेच अपयश श्रीलंकेचा संघर्ष घडवत होते. आघाड्या ही प्रतिनिधित्वाची किंमत, आणि खरा प्रश्न त्या कशा चालवाव्यात हा, त्या कशा संपवाव्यात हा नाही",
          },
          {
            en: "Yes — a country can simply legislate that only two parties may exist, and most democracies have done so",
            hi: "हाँ — कोई देश बस क़ानून बना सकता है कि केवल दो दल रहें, और अधिकांश लोकतंत्रों ने ऐसा किया है",
            mr: "होय — एखादा देश फक्त कायदा करू शकतो की केवळ दोनच पक्ष असावेत, आणि बहुतांश लोकशाहींनी तसे केले आहे",
          },
          {
            en: "The number of parties is random and has no relation to a society's divisions or its electoral system",
            hi: "दलों की संख्या बेतरतीब है और उसका समाज के विभाजनों या चुनावी प्रणाली से कोई संबंध नहीं",
            mr: "पक्षांची संख्या यादृच्छिक आणि तिचा समाजाच्या विभाजनांशी वा निवडणूक पद्धतीशी संबंध नाही",
          },
          {
            en: "India in fact has a two-party system already, so the criticism describes a country that does not exist",
            hi: "भारत में वस्तुतः पहले से द्विदलीय प्रणाली है, अतः आलोचना ऐसे देश का वर्णन करती है जो है ही नहीं",
            mr: "भारतात प्रत्यक्षात आधीच द्विपक्षीय पद्धत आहे, म्हणून टीका अशा देशाचे वर्णन करते जो अस्तित्वातच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The criticism treats the number of parties as a design decision, and it is not. A party system is an outcome, produced by three things a country cannot simply overrule. The first is social structure. Parties form around divisions that people actually care about and that are geographically concentrated enough to win seats. India has religious, linguistic, caste and regional divisions, and crucially these do not line up on top of one another — a Tamil-speaking farmer, a Marathi industrial worker and a Bihari Dalit labourer have overlapping but distinct concerns, and each cluster is large and concentrated enough somewhere to elect people. A society with that many cross-cutting cleavages will generate many parties, because there are many distinct constituencies to be spoken for. The second is history: parties that led particular movements — for statehood, for language, for the dignity of a community — persist because the loyalty they earned persists. The third is electoral rules, which do have an effect. First-past-the-post systems tend to reduce the number of parties nationally, because a party that finishes third everywhere wins nothing. But that pressure is defeated when support is regionally concentrated: a party with ten per cent of the national vote all located in one state wins that state's seats outright. India's regional parties are exactly this case, which is why first-past-the-post has not produced two parties here as it largely did in Britain. Now consider what forcing two parties would mean, since that is what the proposal amounts to. Every one of those regional, linguistic and community-based constituencies would have to be absorbed into one of two national organisations or go unrepresented. The concerns that are currently voiced in a legislature by a party that exists to voice them would instead have to be raised inside a large party as an internal faction, or not raised at all. The chapter on power sharing has already shown what happens to a group with no route to being heard within the system: Sri Lanka's Tamils had votes and a parliament, but no way to affect anything, and the road from there ran to war. A multi-party system is expensive in exactly the way power sharing is expensive, and for the same reason — it buys the participation of people who would otherwise have no reason to accept the outcome. The honest response is therefore not to defend coalitions as costless. They are slower, they involve bargaining that looks unedifying, they can be brought down mid-term, and a small party holding the balance can extract concessions out of proportion to its support. The anti-defection law was one attempt to limit the worst of it. But the reforms worth arguing about are ones that make coalitions function — coherent pre-election alliances, published common programmes, transparent funding, inner-party democracy so that a party is more than its leader — rather than a wish that the country were less various than it is. (The wrong answers imagine parties can be limited by statute in a democracy, deny the well-documented relationship between social cleavages and party systems, or describe an India that dozens of parties in Parliament contradict.)",
          hi: "आलोचना दलों की संख्या को रचना-संबंधी निर्णय मानती है, और वह है नहीं। दल-प्रणाली एक परिणाम है, जो तीन ऐसी चीज़ों से बनता है जिन्हें कोई देश बस पलट नहीं सकता। पहली सामाजिक संरचना। दल उन विभाजनों के गिर्द बनते हैं जिनकी लोगों को वास्तव में परवाह है और जो सीटें जीतने भर भौगोलिक रूप से केंद्रित हैं। भारत में धार्मिक, भाषायी, जातीय और क्षेत्रीय विभाजन हैं, और मुख्यतः वे एक-दूसरे के ऊपर नहीं बैठते — तमिल-भाषी किसान, मराठी औद्योगिक मज़दूर और बिहारी दलित मज़दूर की चिंताएँ अतिव्यापी पर भिन्न हैं, और हर गुच्छा कहीं न कहीं इतना बड़ा और केंद्रित है कि लोग चुन सके। जिस समाज में इतनी आड़ी-तिरछी दरारें हों वह कई दल पैदा करेगा, क्योंकि बोलने को कई भिन्न निर्वाचक-वर्ग हैं। दूसरी इतिहास: जिन दलों ने विशेष आंदोलनों का नेतृत्व किया — राज्य के लिए, भाषा के लिए, किसी समुदाय की गरिमा के लिए — वे टिके रहते हैं क्योंकि जो निष्ठा उन्होंने कमाई वह टिकी रहती है। तीसरी चुनावी नियम, जिनका असर होता ही है। पहले-पद-पर-पहुँचो प्रणालियाँ राष्ट्रीय स्तर पर दलों की संख्या घटाती हैं, क्योंकि जो दल हर जगह तीसरे स्थान पर रहे वह कुछ नहीं जीतता। पर वह दबाव तब हार जाता है जब समर्थन क्षेत्रीय रूप से केंद्रित हो: जिस दल के पास राष्ट्रीय मतों का दस प्रतिशत हो और वह सब एक ही राज्य में हो, वह उस राज्य की सीटें सीधे जीत लेता है। भारत के क्षेत्रीय दल ठीक यही प्रकरण हैं, इसीलिए पहले-पद-पर-पहुँचो ने यहाँ दो दल नहीं दिए जैसे ब्रिटेन में बड़े हिस्से में दिए। अब सोचो दो दल थोपने का अर्थ क्या होगा, क्योंकि प्रस्ताव यही है। उन सब क्षेत्रीय, भाषायी और समुदाय-आधारित निर्वाचक-वर्गों को दो राष्ट्रीय संगठनों में से किसी एक में समाना होगा या बिना प्रतिनिधित्व रहना होगा। जो चिंताएँ अभी विधानमंडल में उन्हीं के लिए बने दल द्वारा उठाई जाती हैं वे इसके बजाय किसी बड़े दल के भीतर आंतरिक गुट के रूप में उठानी होंगी, या उठाई ही नहीं जाएँगी। सत्ता-साझेदारी वाला अध्याय पहले ही दिखा चुका कि तंत्र के भीतर सुने जाने का रास्ता न रखते समूह के साथ क्या होता है: श्रीलंका के तमिलों के पास मत और संसद थी, पर कुछ भी प्रभावित करने का उपाय नहीं, और वहाँ से रास्ता युद्ध तक गया। बहुदलीय प्रणाली ठीक उसी तरह महँगी है जैसे सत्ता-साझेदारी महँगी है, और उसी कारण — वह उन लोगों की भागीदारी ख़रीदती है जिनके पास अन्यथा परिणाम स्वीकारने का कोई कारण न होता। अतः ईमानदार उत्तर यह नहीं कि गठबंधनों को बिना लागत बताया जाए। वे धीमे हैं, उनमें ऐसी सौदेबाज़ी है जो देखने में अच्छी नहीं लगती, वे बीच कार्यकाल गिराए जा सकते हैं, और संतुलन थामे छोटा दल अपने समर्थन से बहुत अधिक रियायतें निचोड़ सकता है। दल-बदल विरोधी क़ानून सबसे बुरे को सीमित करने का एक प्रयास था। पर बहस-योग्य सुधार वे हैं जो गठबंधनों को चलाएँ — सुसंगत चुनाव-पूर्व गठजोड़, प्रकाशित साझा कार्यक्रम, पारदर्शी वित्तपोषण, आंतरिक दल-लोकतंत्र ताकि दल अपने नेता से अधिक हो — यह कामना नहीं कि देश जितना विविध है उससे कम होता। (ग़लत उत्तर कल्पना करते कि लोकतंत्र में दलों को क़ानून से सीमित किया जा सकता, सामाजिक दरारों और दल-प्रणालियों के भली-भाँति दर्ज रिश्ते को नकारते, या ऐसे भारत का वर्णन करते जिसका खंडन संसद में दर्जनों दल करते हैं।)",
          mr: "टीका पक्षांची संख्या हा रचनात्मक निर्णय मानते, आणि तो नाही. पक्षपद्धती हा परिणाम आहे, जो तीन अशा गोष्टींतून बनतो ज्या कोणता देश फक्त पलटवू शकत नाही. पहिली सामाजिक रचना. पक्ष त्या विभाजनांभोवती बनतात ज्यांची लोकांना खरोखर काळजी आणि जी जागा जिंकण्याइतकी भौगोलिकदृष्ट्या केंद्रित. भारतात धार्मिक, भाषिक, जातीय आणि प्रादेशिक विभाजने आहेत, आणि मुख्यतः ती एकमेकांवर बसत नाहीत — तमिळ-भाषिक शेतकरी, मराठी औद्योगिक कामगार आणि बिहारी दलित मजूर यांच्या चिंता आच्छादणाऱ्या पण वेगळ्या, आणि प्रत्येक गुच्छ कुठेतरी इतका मोठा आणि केंद्रित की लोक निवडता येतील. ज्या समाजात इतक्या आडव्यातिडव्या फटी असतील तो अनेक पक्ष निर्माण करेल, कारण बोलण्यासाठी अनेक वेगळे मतदारवर्ग आहेत. दुसरी इतिहास: ज्या पक्षांनी विशिष्ट चळवळींचे नेतृत्व केले — राज्यासाठी, भाषेसाठी, एखाद्या समुदायाच्या प्रतिष्ठेसाठी — ते टिकतात कारण त्यांनी कमावलेली निष्ठा टिकते. तिसरी निवडणूक नियम, ज्यांचा परिणाम होतोच. पहिला-येईल-तो-जिंकेल पद्धती राष्ट्रीय पातळीवर पक्षांची संख्या घटवतात, कारण जो पक्ष सर्वत्र तिसरा येतो तो काहीच जिंकत नाही. पण तो दबाव तेव्हा हरतो जेव्हा पाठिंबा प्रादेशिकरीत्या केंद्रित असतो: ज्या पक्षाकडे राष्ट्रीय मतांचे दहा टक्के आणि ते सर्व एकाच राज्यात, तो त्या राज्याच्या जागा सरळ जिंकतो. भारताचे प्रादेशिक पक्ष नेमके हेच प्रकरण, म्हणूनच पहिला-येईल-तो-जिंकेलने इथे दोन पक्ष दिले नाहीत जसे ब्रिटनमध्ये मोठ्या प्रमाणात दिले. आता दोन पक्ष लादण्याचा अर्थ काय होईल ते पाहा, कारण प्रस्ताव हाच आहे. त्या सर्व प्रादेशिक, भाषिक आणि समुदाय-आधारित मतदारवर्गांना दोन राष्ट्रीय संघटनांपैकी एकात सामावावे लागेल वा प्रतिनिधित्वाविना राहावे लागेल. ज्या चिंता सध्या विधिमंडळात त्यांच्यासाठीच बनलेल्या पक्षाकडून मांडल्या जातात त्या त्याऐवजी एखाद्या मोठ्या पक्षाच्या आत अंतर्गत गट म्हणून मांडाव्या लागतील, वा मांडल्याच जाणार नाहीत. सत्ता-विभागणीच्या प्रकरणाने आधीच दाखवले की व्यवस्थेच्या आत ऐकले जाण्याचा मार्ग नसलेल्या गटाचे काय होते: श्रीलंकेच्या तमिळांकडे मते आणि संसद होती, पण काहीही प्रभावित करण्याचा मार्ग नाही, आणि तिथून वाट युद्धापर्यंत गेली. बहुपक्षीय पद्धत नेमकी तशीच महाग जशी सत्ता-विभागणी महाग, आणि त्याच कारणाने — ती त्या लोकांचा सहभाग विकत घेते ज्यांच्याकडे एरवी निकाल स्वीकारण्याचे कारण नसते. म्हणून प्रामाणिक उत्तर आघाड्यांना खर्चाविनाच्या म्हणणे नाही. त्या मंद आहेत, त्यांत अशी घासाघीस आहे जी पाहायला चांगली दिसत नाही, त्या मध्येच पाडता येतात, आणि तोल सांभाळणारा लहान पक्ष आपल्या पाठिंब्याहून कितीतरी अधिक सवलती काढू शकतो. पक्षांतरबंदी कायदा सर्वांत वाईट मर्यादित करण्याचा एक प्रयत्न होता. पण वादयोग्य सुधारणा त्या ज्या आघाड्या चालवतील — सुसंगत निवडणूकपूर्व युत्या, प्रकाशित समान कार्यक्रम, पारदर्शक अर्थपुरवठा, अंतर्गत पक्ष-लोकशाही जेणेकरून पक्ष त्याच्या नेत्याहून अधिक असेल — देश जितका विविध आहे त्याहून कमी असावा ही इच्छा नव्हे. (चुकीची उत्तरे लोकशाहीत पक्ष कायद्याने मर्यादित करता येतील अशी कल्पना करतात, सामाजिक फटी आणि पक्षपद्धतींमधील नोंदलेले नाते नाकारतात, वा संसदेतील डझनभर पक्ष खोडून काढत असलेल्या भारताचे वर्णन करतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Surveys across many countries find political parties to be the least trusted of all public institutions, and the same surveys find support for democracy high. Explain this apparent contradiction, and say what follows for how parties should be reformed.",
          hi: "कई देशों के सर्वेक्षण पाते हैं कि राजनीतिक दल सब सार्वजनिक संस्थाओं में सबसे कम भरोसे वाले हैं, और वही सर्वेक्षण लोकतंत्र के लिए समर्थन ऊँचा पाते हैं। इस प्रत्यक्ष विरोधाभास को समझाओ, और बताओ कि दलों में सुधार कैसे हो — इसके लिए इससे क्या निकलता है।",
          mr: "अनेक देशांतील सर्वेक्षणे आढळतात की राजकीय पक्ष सर्व सार्वजनिक संस्थांत सर्वांत कमी विश्वासाचे, आणि तीच सर्वेक्षणे लोकशाहीला पाठिंबा उच्च आढळतात. हा दिसणारा विरोधाभास समजावा, आणि सांगा पक्षांत सुधारणा कशी व्हावी यासाठी यातून काय निघते.",
        },
        choices: [
          {
            en: "There is no contradiction: parties are distrusted for what they do badly — dynastic control, opaque money, unkept promises — while being indispensable to what democracy is, since without them no candidate could be held responsible, no government formed, and no voter could know in advance what a legislature would do. The conclusion is reform rather than removal, and reform must be careful: rules imposed from outside can be evaded or can do damage, as the anti-defection law did to internal dissent, so the durable pressure comes from disclosure, competition and members who can hold their own leaders to account",
            hi: "कोई विरोधाभास नहीं: दलों पर अविश्वास उस बात के लिए है जो वे बुरी तरह करते हैं — वंशवादी नियंत्रण, अपारदर्शी पैसा, अधूरे वादे — जबकि लोकतंत्र जो है उसके लिए वे अपरिहार्य हैं, क्योंकि उनके बिना न किसी उम्मीदवार को ज़िम्मेदार ठहराया जा सकता, न सरकार बन सकती, न मतदाता पहले से जान सकता कि विधानमंडल क्या करेगा। निष्कर्ष हटाना नहीं सुधार है, और सुधार सावधान होना चाहिए: बाहर से थोपे नियम चकमा खा सकते या नुक़सान कर सकते हैं, जैसे दल-बदल विरोधी क़ानून ने आंतरिक असहमति के साथ किया, अतः टिकाऊ दबाव प्रकटीकरण, प्रतिस्पर्धा और ऐसे सदस्यों से आता है जो अपने ही नेताओं को जवाबदेह ठहरा सकें",
            mr: "कोणताही विरोधाभास नाही: पक्षांवर अविश्वास ते जे वाईट करतात त्यासाठी — घराणेशाही नियंत्रण, अपारदर्शक पैसा, न पाळलेली वचने — तर लोकशाही जी आहे तिच्यासाठी ते अपरिहार्य, कारण त्यांच्याविना ना कोणत्या उमेदवाराला जबाबदार धरता येईल, ना सरकार बनेल, ना मतदार आधीच जाणू शकेल की विधिमंडळ काय करेल. निष्कर्ष काढून टाकणे नव्हे तर सुधारणा, आणि सुधारणा काळजीपूर्वक असावी: बाहेरून लादलेले नियम चुकवता येतात वा नुकसान करू शकतात, जसे पक्षांतरबंदी कायद्याने अंतर्गत असहमतीचे केले, म्हणून टिकाऊ दबाव प्रकटीकरण, स्पर्धा आणि स्वतःच्या नेत्यांना जबाबदार धरू शकणाऱ्या सदस्यांकडून येतो",
          },
          {
            en: "The contradiction is real and shows the surveys are worthless, since no one can support democracy while distrusting parties",
            hi: "विरोधाभास असली है और दिखाता है कि सर्वेक्षण निर्मूल्य हैं, क्योंकि दलों पर अविश्वास करते हुए कोई लोकतंत्र का समर्थन कर ही नहीं सकता",
            mr: "विरोधाभास खरा आणि दाखवतो की सर्वेक्षणे निरुपयोगी, कारण पक्षांवर अविश्वास ठेवत कोणी लोकशाहीला पाठिंबा देऊच शकत नाही",
          },
          {
            en: "It shows democracy would work better with no parties at all, every candidate standing as an independent",
            hi: "यह दिखाता है कि बिना किसी दल के लोकतंत्र बेहतर चलेगा, हर उम्मीदवार निर्दलीय खड़ा हो",
            mr: "हे दाखवते की कोणत्याही पक्षाविना लोकशाही अधिक चांगली चालेल, प्रत्येक उमेदवार अपक्ष उभा राहावा",
          },
          {
            en: "Parties cannot be reformed by any means, so the distrust is simply a permanent fact to be accepted",
            hi: "दलों में किसी भी उपाय से सुधार नहीं हो सकता, अतः अविश्वास बस स्वीकार लेने योग्य स्थायी तथ्य है",
            mr: "पक्षांत कोणत्याही मार्गाने सुधारणा होऊ शकत नाही, म्हणून अविश्वास फक्त स्वीकारण्याजोगे कायमचे तथ्य",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two findings sit together easily once you separate what parties are for from how they behave. Take the first half. Parties are not an optional feature of representative democracy; they are what makes it operable at scale. Imagine an assembly of five hundred independents. No voter could know, before the election, what the legislature would do, because there would be no programme to vote for — only five hundred individual promises with no mechanism binding them together. No government could be formed except by a fresh bargain after every vote, and no government could be held responsible at the next election, because responsibility requires a body that persists and can be punished. Parties solve exactly this: they aggregate scattered opinions into a few programmes, they present those programmes for judgement, they organise a majority into a government and a minority into an opposition, and they carry the blame or the credit forward to the next election. Anyone who has ever said 'they promised this and did not deliver' is relying on a party existing to be held to account. That is why the textbook says the rise of parties is directly linked to representative democracy: large societies cannot govern themselves without them, and no substitute has been found. Now the second half, which is equally true. The distrust is earned, and the chapter lists the reasons. Many parties hold no organisational elections and keep no reliable membership register, so leadership circulates within a small circle and often within a family — and the objection is not that a leader's relative might be capable, but that no one else ever gets tested against them. Campaign finance is largely opaque, so a candidate's ability to raise money can matter more than their record, and in some constituencies the ability to command force matters too. Manifestos converge until the choice offered is thin. Tickets go to the wealthy and the connected. These are real failures of the institution, and noticing them is not anti-democratic — it is the ordinary work of a citizen. So the conclusion is reform, not removal. And here the chapter is unusually careful, for a reason worth taking seriously: rules imposed from outside often produce effects nobody wanted. The anti-defection law is the case study. It was aimed at legislators being bought to topple governments, and it largely worked. But by tying a member's seat to obeying the party whip, it also removed their ability to dissent on a bill, which means debate inside the house counts for less and power inside the party concentrates further in whoever issues the whip. A law meant to discipline parties made their leaders stronger. Similar caution applies to proposals to legislate inner-party democracy or fix candidate quotas: they can be complied with formally and evaded substantively. What has actually moved things is a mix of three pressures. Legal disclosure — the Supreme Court order requiring candidates to declare assets, education and criminal cases — which does not tell anyone how to vote but makes concealment harder. Competition — parties that lose repeatedly are forced to change, and the rise of state parties has punished national ones that ignored regions. And pressure from below — members, activists, media and citizens' groups who make a practice costly in reputation. The realistic hope is not a public that trusts parties, which may never come and perhaps should not; it is a public that watches them closely enough to make bad behaviour expensive. (The wrong answers dismiss consistent survey evidence, propose an assembly of independents that could neither form nor be held responsible for a government, or treat as unchangeable an institution that has changed repeatedly under exactly these pressures.)",
          hi: "दोनों निष्कर्ष सहज साथ बैठते हैं जब तुम अलग कर लो कि दल किसलिए हैं और वे बरतते कैसे हैं। पहला आधा लो। दल प्रतिनिधि-लोकतंत्र की वैकल्पिक विशेषता नहीं; वे उसे बड़े पैमाने पर चलाने योग्य बनाते हैं। पाँच सौ निर्दलीयों की सभा कल्पना करो। कोई मतदाता चुनाव से पहले जान ही नहीं सकता कि विधानमंडल क्या करेगा, क्योंकि मत देने को कोई कार्यक्रम नहीं होगा — केवल पाँच सौ अलग-अलग वादे जिन्हें बाँधने वाला कोई तंत्र नहीं। कोई सरकार हर मत के बाद नई सौदेबाज़ी बिना बन नहीं सकती, और कोई सरकार अगले चुनाव में ज़िम्मेदार नहीं ठहराई जा सकती, क्योंकि ज़िम्मेदारी को ऐसी संस्था चाहिए जो टिके और दंडित की जा सके। दल ठीक यही हल करते हैं: वे बिखरी राय को कुछ कार्यक्रमों में जोड़ते हैं, उन्हें निर्णय के लिए रखते हैं, बहुमत को सरकार और अल्पमत को विपक्ष में संगठित करते हैं, और दोष या श्रेय अगले चुनाव तक ढोते हैं। जिसने भी कभी कहा हो 'उन्होंने यह वादा किया और निभाया नहीं' वह इसी पर टिका है कि जवाबदेह ठहराने को कोई दल मौजूद है। इसीलिए पाठ्यपुस्तक कहती है कि दलों का उदय प्रतिनिधि-लोकतंत्र से सीधे जुड़ा है: बड़े समाज उनके बिना स्वयं शासन नहीं कर सकते, और कोई विकल्प मिला नहीं। अब दूसरा आधा, जो उतना ही सच है। अविश्वास कमाया हुआ है, और अध्याय कारण गिनाता है। कई दल संगठनात्मक चुनाव नहीं कराते और भरोसेमंद सदस्यता-रजिस्टर नहीं रखते, अतः नेतृत्व छोटे घेरे में और अक्सर एक परिवार में घूमता है — और आपत्ति यह नहीं कि नेता का रिश्तेदार योग्य हो सकता है, बल्कि यह कि और किसी को उसके सामने परखा ही नहीं जाता। अभियान-वित्त बड़े हिस्से में अपारदर्शी है, अतः उम्मीदवार की पैसा जुटाने की क्षमता उसके रिकॉर्ड से अधिक मायने रख सकती है, और कुछ क्षेत्रों में बल जुटाने की क्षमता भी। घोषणा-पत्र तब तक पास आते हैं जब तक दी गई पसंद पतली न हो जाए। टिकट धनवानों और जान-पहचान वालों को जाते हैं। ये संस्था की असली विफलताएँ हैं, और उन्हें देखना लोकतंत्र-विरोधी नहीं — वह नागरिक का साधारण काम है। अतः निष्कर्ष सुधार है, हटाना नहीं। और यहाँ अध्याय असामान्य रूप से सावधान है, ऐसे कारण से जिसे गंभीरता से लेना चाहिए: बाहर से थोपे नियम अक्सर ऐसे प्रभाव देते हैं जो किसी ने नहीं चाहे। दल-बदल विरोधी क़ानून प्रकरण-अध्ययन है। वह सरकारें गिराने को ख़रीदे जाते विधायकों पर लक्षित था, और बड़े हिस्से में चला। पर सदस्य की सीट को दल के व्हिप के पालन से बाँधकर उसने किसी विधेयक पर असहमति की उसकी क्षमता भी हटा दी, जिसका अर्थ है कि सदन के भीतर बहस का महत्व घटता है और दल के भीतर सत्ता उसी में और केंद्रित होती है जो व्हिप जारी करता है। दलों को अनुशासित करने बना क़ानून उनके नेताओं को मज़बूत कर गया। आंतरिक दल-लोकतंत्र को क़ानूनी बनाने या उम्मीदवार-कोटा तय करने के प्रस्तावों पर भी वैसी ही सावधानी लागू: उनका औपचारिक पालन और सारभूत चकमा दोनों हो सकते हैं। जिसने वस्तुतः चीज़ें हिलाईं वह तीन दबावों का मेल है। क़ानूनी प्रकटीकरण — उच्चतम न्यायालय का वह आदेश जो उम्मीदवारों से संपत्ति, शिक्षा तथा आपराधिक मुक़दमे घोषित कराता है — जो किसी को यह नहीं बताता कि मत कैसे दे पर छिपाना कठिन कर देता है। प्रतिस्पर्धा — जो दल बार-बार हारते हैं उन्हें बदलना पड़ता है, और राज्य दलों के उदय ने उन राष्ट्रीय दलों को दंडित किया जिन्होंने क्षेत्रों को अनदेखा किया। और नीचे से दबाव — सदस्य, कार्यकर्ता, माध्यम और नागरिक-समूह जो किसी प्रथा को साख में महँगा बना देते हैं। यथार्थ आशा ऐसी जनता नहीं जो दलों पर भरोसा करे, जो शायद कभी न आए और शायद आनी भी न चाहिए; वह ऐसी जनता है जो उन्हें इतने पास से देखे कि बुरा बरताव महँगा पड़े। (ग़लत उत्तर लगातार मिलते सर्वेक्षण-प्रमाण को झटकते, निर्दलीयों की ऐसी सभा सुझाते जो न सरकार बना सकती न उसके लिए ज़िम्मेदार ठहराई जा सकती, या ऐसी संस्था को अपरिवर्तनीय मानते जो ठीक इन्हीं दबावों में बार-बार बदली है।)",
          mr: "दोन्ही निष्कर्ष सहज एकत्र बसतात जेव्हा तुम्ही पक्ष कशासाठी आहेत आणि ते कसे वागतात हे वेगळे करता. पहिला अर्धा घ्या. पक्ष हे प्रातिनिधिक लोकशाहीचे ऐच्छिक वैशिष्ट्य नाहीत; ते तिला मोठ्या प्रमाणावर चालवण्याजोगे करतात. पाचशे अपक्षांची सभा कल्पा. कोणता मतदार निवडणुकीपूर्वी जाणूच शकत नाही की विधिमंडळ काय करेल, कारण मत द्यायला कोणता कार्यक्रम नसेल — फक्त पाचशे वेगवेगळी वचने ज्यांना बांधणारी यंत्रणा नाही. कोणतेही सरकार प्रत्येक मतानंतर नव्या घासाघिशीविना बनू शकत नाही, आणि कोणतेही सरकार पुढच्या निवडणुकीत जबाबदार धरता येत नाही, कारण जबाबदारीला अशी संस्था लागते जी टिकते आणि शिक्षा देता येते. पक्ष नेमके हेच सोडवतात: ते विखुरलेली मते काही कार्यक्रमांत जुळवतात, ती निवाड्यासाठी मांडतात, बहुमताला सरकारात आणि अल्पमताला विरोधी पक्षात संघटित करतात, आणि दोष वा श्रेय पुढच्या निवडणुकीपर्यंत वाहतात. ज्याने कधी म्हटले असेल 'त्यांनी हे वचन दिले आणि पाळले नाही' तो यावरच टेकलेला की जबाबदार धरायला कोणता पक्ष अस्तित्वात आहे. म्हणूनच पाठ्यपुस्तक म्हणते की पक्षांचा उदय प्रातिनिधिक लोकशाहीशी थेट जोडलेला: मोठे समाज त्यांच्याविना स्वतःचे शासन करू शकत नाहीत, आणि पर्याय सापडलेला नाही. आता दुसरा अर्धा, जो तितकाच खरा. अविश्वास कमावलेला, आणि प्रकरण कारणे मांडते. अनेक पक्ष संघटनात्मक निवडणुका घेत नाहीत आणि विश्वासार्ह सदस्यत्व नोंदवही ठेवत नाहीत, म्हणून नेतृत्व लहान वर्तुळात आणि अनेकदा एका कुटुंबात फिरते — आणि आक्षेप हा नाही की नेत्याचा नातेवाईक सक्षम असू शकतो, तर हा की इतर कोणालाही त्याच्यासमोर तपासलेच जात नाही. मोहीम-अर्थपुरवठा मोठ्या प्रमाणात अपारदर्शक, म्हणून उमेदवाराची पैसा उभा करण्याची क्षमता त्याच्या लौकिकाहून अधिक महत्त्वाची ठरू शकते, आणि काही मतदारसंघांत बळ उभे करण्याची क्षमताही. जाहीरनामे तोवर जवळ येतात जोवर दिलेला पर्याय पातळ होत नाही. तिकिटे धनवान आणि ओळखीच्यांना जातात. ही संस्थेची खरी अपयशे, आणि ती पाहणे लोकशाहीविरोधी नाही — ते नागरिकाचे सामान्य काम. म्हणून निष्कर्ष सुधारणा, काढून टाकणे नव्हे. आणि इथे प्रकरण असामान्यपणे काळजीपूर्वक, अशा कारणाने जे गांभीर्याने घ्यावे: बाहेरून लादलेले नियम अनेकदा असे परिणाम देतात जे कोणी इच्छिले नव्हते. पक्षांतरबंदी कायदा हे प्रकरण-अभ्यास. तो सरकारे पाडायला विकत घेतल्या जाणाऱ्या सदस्यांवर रोखलेला, आणि मोठ्या प्रमाणात चालला. पण सदस्याची जागा पक्षाच्या व्हिपच्या पालनाशी बांधून त्याने एखाद्या विधेयकावर असहमतीची त्याची क्षमताही काढून टाकली, म्हणजे सभागृहातील चर्चेचे महत्त्व घटते आणि पक्षातील सत्ता व्हिप काढणाऱ्याकडेच अधिक केंद्रित होते. पक्षांना शिस्त लावायला बनवलेल्या कायद्याने त्यांचे नेते बळकट केले. अंतर्गत पक्ष-लोकशाही कायद्याने आणण्याच्या वा उमेदवार-कोटा ठरवण्याच्या प्रस्तावांनाही तीच काळजी लागू: त्यांचे औपचारिक पालन आणि आशयातील चुकवणे दोन्ही होऊ शकते. ज्याने प्रत्यक्षात गोष्टी हलवल्या तो तीन दबावांचा मेळ. कायदेशीर प्रकटीकरण — सर्वोच्च न्यायालयाचा तो आदेश जो उमेदवारांना मालमत्ता, शिक्षण व गुन्हेगारी खटले जाहीर करायला लावतो — जो कोणाला मत कसे द्यावे सांगत नाही पण लपवणे कठीण करतो. स्पर्धा — जे पक्ष वारंवार हरतात त्यांना बदलावे लागते, आणि राज्य पक्षांच्या उदयाने प्रदेश दुर्लक्षणाऱ्या राष्ट्रीय पक्षांना शिक्षा दिली. आणि खालून दबाव — सदस्य, कार्यकर्ते, माध्यमे आणि नागरिक-गट जे एखादी प्रथा प्रतिष्ठेत महाग करतात. वास्तववादी आशा पक्षांवर विश्वास ठेवणारी जनता नाही, जी कदाचित कधी येणार नाही आणि कदाचित यायलाही नको; ती अशी जनता आहे जी त्यांना इतक्या जवळून पाहते की वाईट वर्तन महाग पडेल. (चुकीची उत्तरे सातत्याने मिळणारा सर्वेक्षण-पुरावा झटकतात, अपक्षांची अशी सभा सुचवतात जी ना सरकार बनवू शकेल ना त्यासाठी जबाबदार धरता येईल, वा नेमक्या याच दबावांखाली वारंवार बदललेल्या संस्थेला अपरिवर्तनीय मानतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Outcomes of Democracy                                       */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-10-outcomes-of-democracy",
    subject: "CIVICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 5 — Outcomes of Democracy",
      hi: "अध्याय 5 — लोकतंत्र के परिणाम",
      mr: "प्रकरण 5 — लोकशाहीचे परिणाम",
    },
    name: {
      en: "Outcomes of Democracy",
      hi: "लोकतंत्र के परिणाम",
      mr: "लोकशाहीचे परिणाम",
    },
    summary: {
      en: "The accounts, honestly kept: a citizen entitled to know how a decision was reached, a government obeyed because it was chosen rather than because it is feared, a growth record that is no better than a dictatorship's, an inequality that democracy has not removed, a diversity it has kept from turning into war — and a complaint that is itself the proof.",
      hi: "बही, ईमानदारी से रखी: वह नागरिक जिसे जानने का हक़ कि निर्णय पहुँचा कैसे, वह सरकार जो इसलिए मानी जाती कि चुनी गई, इसलिए नहीं कि उससे डर लगता, वह वृद्धि-रिकॉर्ड जो तानाशाही से बेहतर नहीं, वह असमानता जो लोकतंत्र ने हटाई नहीं, वह विविधता जिसे उसने युद्ध बनने से रोका — और वह शिकायत जो स्वयं प्रमाण है।",
      mr: "खतावणी, प्रामाणिकपणे ठेवलेली: तो नागरिक ज्याला जाणण्याचा हक्क की निर्णय कसा पोहोचला, ते सरकार जे यासाठी पाळले जाते की निवडले गेले, यासाठी नाही की त्याची भीती वाटते, तो वाढीचा लौकिक जो हुकूमशाहीहून चांगला नाही, ती विषमता जी लोकशाहीने हटवली नाही, ती विविधता जिला तिने युद्ध बनण्यापासून रोखले — आणि ती तक्रार जी स्वतःच पुरावा.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "transparency",
        name: {
          en: "Transparency in decision-making",
          hi: "निर्णय-प्रक्रिया में पारदर्शिता",
          mr: "निर्णय-प्रक्रियेत पारदर्शकता",
        },
        kind: "idea",
        prompt: {
          en: "A citizen may ask which file a decision passed through, what the officer wrote on it and on what rule the outcome rested, and may go to court if the answer is refused. Which democratic outcome is this?",
          hi: "नागरिक पूछ सकता है कि निर्णय किस फ़ाइल से गुज़रा, अधिकारी ने उस पर क्या लिखा और परिणाम किस नियम पर टिका, और उत्तर न मिलने पर अदालत जा सकता है। यह कौन-सा लोकतांत्रिक परिणाम है?",
          mr: "नागरिक विचारू शकतो की निर्णय कोणत्या फाइलमधून गेला, अधिकाऱ्याने त्यावर काय लिहिले आणि निकाल कोणत्या नियमावर टेकला, आणि उत्तर नाकारल्यास न्यायालयात जाऊ शकतो. हा कोणता लोकशाही परिणाम?",
        },
        statement: {
          en: "Transparency in decision-making means citizens can find out how and by what rule a government decision was taken, and can hold those who took it answerable — not merely that the decision was correct.",
          hi: "निर्णय-प्रक्रिया में पारदर्शिता का अर्थ है कि नागरिक जान सकें कि कोई सरकारी निर्णय कैसे और किस नियम से लिया गया, और उसे लेने वालों को जवाबदेह ठहरा सकें — केवल यह नहीं कि निर्णय सही था।",
          mr: "निर्णय-प्रक्रियेतील पारदर्शकता म्हणजे नागरिकांना कळू शकते की एखादा शासकीय निर्णय कसा आणि कोणत्या नियमाने घेतला गेला, आणि तो घेणाऱ्यांना जबाबदार धरता येते — केवळ निर्णय बरोबर होता एवढेच नव्हे.",
        },
        detail: {
          en: "This is the outcome a democracy can be held to even when the decision itself is disputed, because the claim is about the procedure rather than the result.",
          hi: "यही वह परिणाम है जिसके लिए लोकतंत्र को तब भी पकड़ा जा सकता है जब निर्णय स्वयं विवादित हो, क्योंकि दावा परिणाम के बारे में नहीं, प्रक्रिया के बारे में है।",
          mr: "हाच तो परिणाम ज्यासाठी लोकशाहीला निर्णय स्वतः वादग्रस्त असतानाही धरता येते, कारण दावा निकालाबद्दल नव्हे तर प्रक्रियेबद्दल.",
        },
        extra: {
          en: "The Right to Information Act made it enforceable: a citizen who is refused an answer has a remedy, which turns a principle into a procedure.",
          hi: "सूचना का अधिकार अधिनियम ने उसे लागू करने योग्य बनाया: जिस नागरिक को उत्तर न मिले उसके पास उपाय है, जो सिद्धांत को प्रक्रिया में बदल देता है।",
          mr: "माहितीचा अधिकार कायद्याने ते अंमलात आणण्याजोगे केले: ज्या नागरिकाला उत्तर नाकारले जाते त्याच्याकडे उपाय आहे, जे तत्त्वाचे प्रक्रियेत रूपांतर करते.",
        },
        pair: {
          left: {
            en: "The right to know how a decision was reached",
            hi: "जानने का अधिकार कि निर्णय पहुँचा कैसे",
            mr: "निर्णय कसा पोहोचला हे जाणण्याचा हक्क",
          },
          right: {
            en: "transparency in decision-making",
            hi: "निर्णय-प्रक्रिया में पारदर्शिता",
            mr: "निर्णय-प्रक्रियेत पारदर्शकता",
          },
        },
      },
      {
        id: "legitimate-government",
        name: {
          en: "A legitimate government",
          hi: "वैध सरकार",
          mr: "वैध सरकार",
        },
        kind: "idea",
        prompt: {
          en: "People obey it not because they are afraid of it but because they accept that it was chosen by a procedure they themselves take part in, and they accept its decisions even when they voted against it. What quality is this?",
          hi: "लोग उसे इसलिए नहीं मानते कि उससे डरते हैं बल्कि इसलिए कि वे स्वीकारते हैं कि वह ऐसी प्रक्रिया से चुनी गई जिसमें वे स्वयं भाग लेते हैं, और वे उसके निर्णय तब भी स्वीकारते हैं जब उन्होंने उसके विरुद्ध मत दिया हो। यह कौन-सा गुण है?",
          mr: "लोक ते यासाठी पाळत नाहीत की त्याची भीती वाटते तर यासाठी की ते मान्य करतात की ते अशा प्रक्रियेने निवडले गेले जिच्यात ते स्वतः भाग घेतात, आणि ते त्याचे निर्णय तेव्हाही स्वीकारतात जेव्हा त्यांनी त्याविरुद्ध मत दिले. हा कोणता गुण?",
        },
        statement: {
          en: "A legitimate government is one people accept as rightfully entitled to govern because it was chosen by a procedure they recognise, so its decisions are obeyed from consent rather than fear.",
          hi: "वैध सरकार वह है जिसे लोग शासन का न्यायोचित अधिकारी मानते हैं क्योंकि वह ऐसी प्रक्रिया से चुनी गई जिसे वे मान्यता देते हैं, अतः उसके निर्णय भय से नहीं सहमति से माने जाते हैं।",
          mr: "वैध सरकार म्हणजे ते जे लोक शासनाचा न्याय्य अधिकारी मानतात कारण ते अशा प्रक्रियेने निवडले गेले जिला ते मान्यता देतात, म्हणून त्याचे निर्णय भीतीने नव्हे तर संमतीने पाळले जातात.",
        },
        detail: {
          en: "It is the outcome democracy delivers most reliably, and surveys across the world find people prefer democracy even where they are dissatisfied with their own government.",
          hi: "यह वह परिणाम है जो लोकतंत्र सबसे भरोसे से देता है, और विश्व भर के सर्वेक्षण पाते हैं कि लोग लोकतंत्र पसंद करते हैं भले वे अपनी ही सरकार से असंतुष्ट हों।",
          mr: "हा तो परिणाम जो लोकशाही सर्वांत खात्रीने देते, आणि जगभरची सर्वेक्षणे आढळतात की लोक लोकशाही पसंत करतात जरी ते स्वतःच्या सरकारवर असमाधानी असले तरी.",
        },
        extra: {
          en: "Its practical value is enormous: a government obeyed by consent needs far less policing, and can implement a decision without having to compel every citizen separately.",
          hi: "उसका व्यावहारिक मूल्य विशाल है: जो सरकार सहमति से मानी जाती उसे कहीं कम पुलिसिंग चाहिए, और वह हर नागरिक को अलग-अलग बाध्य किए बिना निर्णय लागू कर सकती है।",
          mr: "त्याचे व्यावहारिक मोल प्रचंड: जे सरकार संमतीने पाळले जाते त्याला कितीतरी कमी पोलिसी लागते, आणि ते प्रत्येक नागरिकाला वेगवेगळे भाग पाडल्याविना निर्णय राबवू शकते.",
        },
        pair: {
          left: {
            en: "Obeyed because chosen, not because feared",
            hi: "माना गया क्योंकि चुनी गई, इसलिए नहीं कि डर है",
            mr: "पाळले कारण निवडले, भीती वाटते म्हणून नव्हे",
          },
          right: {
            en: "a legitimate government",
            hi: "वैध सरकार",
            mr: "वैध सरकार",
          },
        },
      },
      {
        id: "growth-under-democracy",
        name: {
          en: "Economic growth under democracy",
          hi: "लोकतंत्र में आर्थिक वृद्धि",
          mr: "लोकशाहीत आर्थिक वाढ",
        },
        kind: "idea",
        prompt: {
          en: "Comparing the growth rates of democracies and dictatorships across several decades, economists find the dictatorships marginally ahead, but the gap so small and the other causes so numerous that the difference cannot be attributed to the form of government. Which finding is this?",
          hi: "कई दशकों में लोकतंत्रों और तानाशाहियों की वृद्धि दरों की तुलना कर अर्थशास्त्री पाते हैं कि तानाशाहियाँ मामूली रूप से आगे हैं, पर अंतर इतना छोटा और अन्य कारण इतने अधिक कि उस भेद को शासन-रूप का श्रेय नहीं दिया जा सकता। यह कौन-सा निष्कर्ष है?",
          mr: "अनेक दशकांत लोकशाही आणि हुकूमशाहींच्या वाढीच्या दरांची तुलना करून अर्थतज्ज्ञ आढळतात की हुकूमशाही किंचित पुढे, पण फरक इतका लहान आणि इतर कारणे इतकी अनेक की तो फरक शासन-रूपाला देता येत नाही. हा कोणता निष्कर्ष?",
        },
        statement: {
          en: "On economic growth democracies show no clear advantage over dictatorships — the measured difference is negligible and is swamped by other factors such as population, resources, global conditions and prior policy.",
          hi: "आर्थिक वृद्धि पर लोकतंत्र तानाशाहियों से कोई स्पष्ट लाभ नहीं दिखाते — मापा गया अंतर नगण्य है और जनसंख्या, संसाधनों, वैश्विक दशाओं तथा पूर्ववर्ती नीति जैसे अन्य कारकों में डूब जाता है।",
          mr: "आर्थिक वाढीवर लोकशाही हुकूमशाहींहून कोणताही स्पष्ट फायदा दाखवत नाहीत — मोजलेला फरक नगण्य आणि लोकसंख्या, संसाधने, जागतिक स्थिती व पूर्वीचे धोरण अशा इतर घटकांत बुडतो.",
        },
        detail: {
          en: "The honest conclusion is that democracy should not be defended by promising faster growth, because the evidence does not support that promise.",
          hi: "ईमानदार निष्कर्ष यह कि लोकतंत्र का बचाव तेज़ वृद्धि का वादा करके नहीं करना चाहिए, क्योंकि प्रमाण उस वादे का समर्थन नहीं करते।",
          mr: "प्रामाणिक निष्कर्ष हा की लोकशाहीचा बचाव वेगवान वाढीचे वचन देऊन करू नये, कारण पुरावा त्या वचनाला पाठिंबा देत नाही.",
        },
        extra: {
          en: "On one economic outcome the difference is stark: no substantial famine has occurred in a functioning democracy with a free press, because a government that can be voted out cannot afford to let people starve unnoticed.",
          hi: "एक आर्थिक परिणाम पर अंतर तीखा है: स्वतंत्र प्रेस वाले चलते लोकतंत्र में कोई बड़ा अकाल नहीं पड़ा, क्योंकि जो सरकार मतों से हटाई जा सकती वह लोगों को अनदेखे भूखों मरने नहीं दे सकती।",
          mr: "एका आर्थिक परिणामावर फरक तीव्र: मुक्त वृत्तपत्रे असलेल्या चालत्या लोकशाहीत मोठा दुष्काळ पडलेला नाही, कारण जे सरकार मतांनी हटवता येते ते लोकांना दुर्लक्षितपणे उपाशी मरू देऊ शकत नाही.",
        },
        pair: {
          left: {
            en: "No clear growth advantage, but no famine either",
            hi: "वृद्धि में स्पष्ट लाभ नहीं, पर अकाल भी नहीं",
            mr: "वाढीत स्पष्ट फायदा नाही, पण दुष्काळही नाही",
          },
          right: {
            en: "economic growth under democracy",
            hi: "लोकतंत्र में आर्थिक वृद्धि",
            mr: "लोकशाहीत आर्थिक वाढ",
          },
        },
      },
      {
        id: "democracy-and-inequality",
        name: {
          en: "Democracy and economic inequality",
          hi: "लोकतंत्र और आर्थिक असमानता",
          mr: "लोकशाही आणि आर्थिक विषमता",
        },
        kind: "idea",
        prompt: {
          en: "Every adult has exactly one vote, the poor vote in larger proportions than the rich, and yet in most democracies a small group holds a rising share of income while many remain without a secure livelihood. Which gap is this?",
          hi: "हर वयस्क के पास ठीक एक मत है, ग़रीब अमीरों से बड़े अनुपात में मत देते हैं, और फिर भी अधिकांश लोकतंत्रों में एक छोटा समूह आय का बढ़ता हिस्सा रखता है जबकि कई सुरक्षित आजीविका बिना रह जाते हैं। यह कौन-सी खाई है?",
          mr: "प्रत्येक प्रौढाकडे नेमके एक मत, गरीब श्रीमंतांहून मोठ्या प्रमाणात मत देतात, आणि तरीही बहुतांश लोकशाहींत एक लहान गट उत्पन्नाचा वाढता वाटा ठेवतो तर अनेक सुरक्षित उपजीविकेविना राहतात. ही कोणती दरी?",
        },
        statement: {
          en: "Democracies have delivered political equality — one person, one vote — without delivering economic equality, and in many the share of income going to the richest has risen while the poorest remain dependent on insecure work.",
          hi: "लोकतंत्रों ने राजनीतिक समानता दी है — एक व्यक्ति, एक मत — आर्थिक समानता दिए बिना, और कई में सबसे धनी को जाता आय-हिस्सा बढ़ा है जबकि सबसे निर्धन असुरक्षित काम पर निर्भर बने हुए हैं।",
          mr: "लोकशाहींनी राजकीय समानता दिली — एक व्यक्ती, एक मत — आर्थिक समानता न देता, आणि अनेकांत सर्वांत श्रीमंतांना जाणारा उत्पन्नाचा वाटा वाढला तर सर्वांत गरीब असुरक्षित कामावर अवलंबून राहिले.",
        },
        detail: {
          en: "The puzzle is sharp because the poor are a numerical majority and vote in large numbers, so their votes ought in principle to force redistribution.",
          hi: "पहेली तीखी है क्योंकि ग़रीब संख्या में बहुमत हैं और बड़ी संख्या में मत देते हैं, अतः सिद्धांततः उनके मतों को पुनर्वितरण के लिए बाध्य करना चाहिए।",
          mr: "कोडे तीव्र कारण गरीब संख्येने बहुसंख्य आणि मोठ्या संख्येने मत देतात, म्हणून तत्त्वतः त्यांच्या मतांनी पुनर्वाटप घडवायला हवे.",
        },
        extra: {
          en: "Poor voters rarely cast their ballot as a single economic bloc, since region, community, language and local candidates divide them — which is exactly why they do not vote as one interest.",
          hi: "निर्धन मतदाता शायद ही कभी एक ही आर्थिक गुट के रूप में मत डालते हैं, क्योंकि क्षेत्र, समुदाय, भाषा और स्थानीय उम्मीदवार उन्हें बाँट देते हैं — ठीक इसी से वे एक हित की तरह मत नहीं देते।",
          mr: "गरीब मतदार क्वचितच एकाच आर्थिक गटासारखे मत देतात, कारण प्रदेश, समुदाय, भाषा आणि स्थानिक उमेदवार त्यांना विभागतात — नेमके म्हणूनच ते एक हित म्हणून मत देत नाहीत.",
        },
        pair: {
          left: {
            en: "Equal votes without equal incomes",
            hi: "बराबर मत, बराबर आय नहीं",
            mr: "समान मते, समान उत्पन्न नाही",
          },
          right: {
            en: "democracy and economic inequality",
            hi: "लोकतंत्र और आर्थिक असमानता",
            mr: "लोकशाही आणि आर्थिक विषमता",
          },
        },
      },
      {
        id: "accommodation-of-diversity",
        name: {
          en: "Accommodation of social diversity",
          hi: "सामाजिक विविधता का समायोजन",
          mr: "सामाजिक विविधतेचे सामावणे",
        },
        kind: "idea",
        prompt: {
          en: "Divisions of language, religion, region and caste exist in every large society; in some they end in partition or civil war, and in others they are argued out in legislatures and elections without breaking the country. Which outcome is this?",
          hi: "भाषा, धर्म, क्षेत्र और जाति के विभाजन हर बड़े समाज में हैं; कुछ में वे विभाजन या गृहयुद्ध में समाप्त होते, और अन्य में देश तोड़े बिना विधानमंडलों तथा चुनावों में बहस लिए जाते हैं। यह कौन-सा परिणाम है?",
          mr: "भाषा, धर्म, प्रदेश आणि जातीची विभाजने प्रत्येक मोठ्या समाजात आहेत; काहींत ती फाळणी वा यादवी युद्धात संपतात, आणि इतरांत देश न तोडता विधिमंडळे व निवडणुकांत त्यांवर वाद घातला जातो. हा कोणता परिणाम?",
        },
        statement: {
          en: "Accommodation of social diversity is democracy's capacity to handle divisions of language, religion, region and caste by negotiation and representation rather than by suppression, so conflict is contained instead of becoming violent.",
          hi: "सामाजिक विविधता का समायोजन लोकतंत्र की वह क्षमता है कि वह भाषा, धर्म, क्षेत्र तथा जाति के विभाजनों को दमन से नहीं बल्कि बातचीत और प्रतिनिधित्व से सँभाले, अतः टकराव हिंसक होने के बजाय थमा रहे।",
          mr: "सामाजिक विविधतेचे सामावणे म्हणजे लोकशाहीची ती क्षमता की ती भाषा, धर्म, प्रदेश आणि जातीची विभाजने दडपशाहीने नव्हे तर वाटाघाटी व प्रतिनिधित्वाने हाताळते, म्हणून संघर्ष हिंसक होण्याऐवजी आवरला जातो.",
        },
        detail: {
          en: "The claim is not that democracy ends division — no system does — but that it keeps division from becoming the kind of conflict a country cannot recover from.",
          hi: "दावा यह नहीं कि लोकतंत्र विभाजन मिटा देता — कोई प्रणाली नहीं मिटाती — बल्कि यह कि वह विभाजन को ऐसा टकराव बनने से रोकता जिससे कोई देश उबर नहीं पाता।",
          mr: "दावा हा नाही की लोकशाही विभाजन संपवते — कोणतीही व्यवस्था संपवत नाही — तर हा की ती विभाजनाला असा संघर्ष बनण्यापासून रोखते ज्यातून देश सावरू शकत नाही.",
        },
        extra: {
          en: "Two conditions have to hold for it to work: majority rule must mean shifting majorities rather than one permanent community ruling, and no group may be made to feel the state is not theirs.",
          hi: "इसे चलने के लिए दो शर्तें ज़रूरी: बहुमत के शासन का अर्थ बदलते बहुमत हो, एक स्थायी समुदाय का शासन नहीं, और किसी समूह को यह महसूस न कराया जाए कि राज्य उसका नहीं।",
          mr: "ते चालण्यासाठी दोन अटी आवश्यक: बहुमताच्या राज्याचा अर्थ बदलती बहुमते असावा, एका कायमच्या समुदायाचे राज्य नव्हे, आणि कोणत्याही गटाला राज्य आपले नाही असे वाटू दिले जाऊ नये.",
        },
        pair: {
          left: {
            en: "Division argued out rather than fought out",
            hi: "विभाजन लड़ा नहीं, बहसा गया",
            mr: "विभाजन लढले नव्हे तर चर्चिले गेले",
          },
          right: {
            en: "accommodation of social diversity",
            hi: "सामाजिक विविधता का समायोजन",
            mr: "सामाजिक विविधतेचे सामावणे",
          },
        },
      },
      {
        id: "complaint-as-evidence",
        name: {
          en: "Complaint as evidence of success",
          hi: "शिकायत ही सफलता का प्रमाण",
          mr: "तक्रारच यशाचा पुरावा",
        },
        kind: "idea",
        prompt: {
          en: "Citizens of a democracy grumble constantly about their government, and this is taken as a sign of failure — yet the same citizens would not think to complain if they did not believe the government answerable to them. What does the complaining actually demonstrate?",
          hi: "लोकतंत्र के नागरिक अपनी सरकार के बारे में लगातार बड़बड़ाते हैं, और इसे विफलता का संकेत माना जाता है — फिर भी वही नागरिक शिकायत करने की सोचते ही न यदि वे सरकार को अपने प्रति जवाबदेह न मानते। बड़बड़ाना वस्तुतः क्या दिखाता है?",
          mr: "लोकशाहीचे नागरिक आपल्या सरकारबद्दल सतत कुरकुरतात, आणि हे अपयशाचे लक्षण मानले जाते — तरीही तेच नागरिक तक्रार करण्याचा विचारही करणार नाहीत जर त्यांना सरकार आपल्याप्रती उत्तरदायी वाटत नसते. कुरकुरणे प्रत्यक्षात काय दाखवते?",
        },
        statement: {
          en: "Complaint is itself evidence of democracy's success, because a citizen only demands more from a government they believe accountable to them — expectations rise precisely because the system has taught people that it should answer to them.",
          hi: "शिकायत स्वयं लोकतंत्र की सफलता का प्रमाण है, क्योंकि नागरिक उसी सरकार से अधिक माँगता है जिसे वह अपने प्रति जवाबदेह मानता है — अपेक्षाएँ ठीक इसलिए चढ़ती हैं कि प्रणाली ने लोगों को सिखा दिया कि उसे उन्हें उत्तर देना चाहिए।",
          mr: "तक्रार हीच लोकशाहीच्या यशाचा पुरावा, कारण नागरिक त्याच सरकारकडून अधिक मागतो ज्याला तो आपल्याप्रती उत्तरदायी मानतो — अपेक्षा नेमक्या यासाठी चढतात की व्यवस्थेने लोकांना शिकवले की तिने त्यांना उत्तर द्यावे.",
        },
        detail: {
          en: "It also explains why democracies always look disappointing: the standard they are measured against is one they themselves created and keep raising.",
          hi: "यह यह भी समझाता है कि लोकतंत्र सदा निराशाजनक क्यों दिखते हैं: जिस मानक से वे नापे जाते वह उन्हीं का बनाया है और वे उसे चढ़ाते रहते हैं।",
          mr: "हे हेही समजावते की लोकशाही सदैव निराशाजनक का दिसतात: ज्या मानकाने त्या मोजल्या जातात ते त्यांनीच घडवलेले आणि त्या ते वाढवत राहतात.",
        },
        extra: {
          en: "A subject of a dictatorship who complains risks arrest; a citizen of a democracy who complains is exercising a right, which is the whole difference in one sentence.",
          hi: "तानाशाही की जो प्रजा शिकायत करे वह गिरफ़्तारी का जोखिम उठाती है; लोकतंत्र का जो नागरिक शिकायत करे वह अधिकार का प्रयोग कर रहा है — पूरा अंतर एक वाक्य में यही है।",
          mr: "हुकूमशाहीची जी प्रजा तक्रार करते ती अटकेचा धोका पत्करते; लोकशाहीचा जो नागरिक तक्रार करतो तो हक्क बजावत आहे — अख्खा फरक एका वाक्यात हाच.",
        },
        pair: {
          left: {
            en: "Demanding more because you believe you may",
            hi: "अधिक माँगना क्योंकि तुम मानते हो कि माँग सकते हो",
            mr: "अधिक मागणे कारण तुम्हाला वाटते तुम्ही मागू शकता",
          },
          right: {
            en: "complaint as evidence of success",
            hi: "शिकायत ही सफलता का प्रमाण",
            mr: "तक्रारच यशाचा पुरावा",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In a democracy every adult has one vote, the poor outnumber the rich, and poor citizens vote in higher proportions than wealthy ones. On the face of it, redistribution should follow automatically. Explain why economic inequality has persisted anyway.",
          hi: "लोकतंत्र में हर वयस्क के पास एक मत है, ग़रीब अमीरों से अधिक हैं, और निर्धन नागरिक धनवानों से ऊँचे अनुपात में मत देते हैं। ऊपर से देखें तो पुनर्वितरण अपने आप होना चाहिए। समझाओ फिर भी आर्थिक असमानता क्यों बनी रही।",
          mr: "लोकशाहीत प्रत्येक प्रौढाकडे एक मत, गरीब श्रीमंतांहून अधिक, आणि गरीब नागरिक धनवानांहून जास्त प्रमाणात मत देतात. वरवर पाहता, पुनर्वाटप आपोआप व्हायला हवे. समजावा तरीही आर्थिक विषमता का टिकून राहिली.",
        },
        choices: [
          {
            en: "Because the poor are a majority in number but not a single voting bloc: region, language, community, caste and the merits of local candidates cut across economic position, so their votes divide among many parties instead of combining behind redistribution. Meanwhile wealth converts into political influence through campaign finance, media ownership and access to decision-makers — advantages that operate between elections, where votes do not reach",
            hi: "क्योंकि ग़रीब संख्या में बहुमत हैं पर एक मतदान-गुट नहीं: क्षेत्र, भाषा, समुदाय, जाति और स्थानीय उम्मीदवारों के गुण आर्थिक स्थिति को आड़ा काटते हैं, अतः उनके मत पुनर्वितरण के पीछे जुड़ने के बजाय कई दलों में बँट जाते हैं। इस बीच संपत्ति अभियान-वित्त, माध्यम-स्वामित्व और निर्णय-कर्ताओं तक पहुँच से राजनीतिक प्रभाव में बदलती है — ऐसे लाभ जो चुनावों के बीच काम करते हैं, जहाँ मत पहुँचते नहीं",
            mr: "कारण गरीब संख्येने बहुसंख्य पण एकच मतदान-गट नाहीत: प्रदेश, भाषा, समुदाय, जात आणि स्थानिक उमेदवारांचे गुण आर्थिक स्थानाला आडवे छेदतात, म्हणून त्यांची मते पुनर्वाटपामागे एकत्र होण्याऐवजी अनेक पक्षांत विभागतात. दरम्यान संपत्ती मोहीम-अर्थपुरवठा, माध्यम-मालकी आणि निर्णयकर्त्यांपर्यंतच्या प्रवेशातून राजकीय प्रभावात रूपांतरित होते — असे फायदे जे निवडणुकांदरम्यान चालतात, जिथे मते पोहोचत नाहीत",
          },
          {
            en: "Because poor citizens do not vote at all in any democracy, so their numbers never register politically",
            hi: "क्योंकि किसी भी लोकतंत्र में निर्धन नागरिक मत देते ही नहीं, अतः उनकी संख्या राजनीतिक रूप से कभी दर्ज नहीं होती",
            mr: "कारण कोणत्याही लोकशाहीत गरीब नागरिक मतदानच करत नाहीत, म्हणून त्यांची संख्या राजकीयदृष्ट्या कधी नोंदली जात नाही",
          },
          {
            en: "Because democracies are in fact economically equal, and the premise of the question is false",
            hi: "क्योंकि लोकतंत्र वस्तुतः आर्थिक रूप से समान हैं, और प्रश्न का आधार झूठा है",
            mr: "कारण लोकशाही प्रत्यक्षात आर्थिकदृष्ट्या समान आहेत, आणि प्रश्नाचे गृहीतक खोटे आहे",
          },
          {
            en: "Because constitutions everywhere forbid governments from spending anything on the poor",
            hi: "क्योंकि हर जगह के संविधान सरकारों को ग़रीबों पर कुछ भी ख़र्च करने से रोकते हैं",
            mr: "कारण सर्वत्रच्या राज्यघटना सरकारांना गरिबांवर काहीही खर्च करण्यास मनाई करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The expectation behind the question is a real theoretical prediction, and the fact that it fails tells us something important about how votes translate into policy. The prediction assumes that the poor form a bloc — that being poor is the identity from which people vote. It is not, or at least not usually. A voter is simultaneously a Marathi speaker, a member of a caste, a resident of a district with its own grievances about water or roads, a follower of a faith, a worker in a particular trade and a person with a view of the local candidate. Poverty is one of these identities and it competes with the rest. So the votes of poor citizens do not accumulate behind a single demand for redistribution; they scatter across many parties, each of which assembles a coalition cutting across income. A party that wins in a state may hold poor voters from one community and lose those of another, so nobody in the system faces a unified class electorate to bargain with. This is not false consciousness; it is what happens when people have several real interests at once. The second half of the answer concerns what happens between elections, which is where most policy is actually made. A vote is an equal instrument used once in five years. Money is an unequal instrument used continuously. Wealth buys campaign finance, which shapes which candidates can stand at all; it buys media reach, which shapes which issues are discussed; it funds industry associations and lobbying that engage with ministries drafting rules; it provides access to officials that an ordinary citizen does not have; and it can move investment across borders, which gives it leverage over a government worried about growth. None of this requires corruption. It is simply that concentrated resources produce continuous influence, while dispersed votes produce periodic influence. There is a third factor worth naming. Redistribution is hard to design and slow to show results, while its costs are immediate and visible to those who bear them. Landowners notice a land ceiling at once; the beneficiaries take a decade to notice. A government facing an election in four years has weak incentives to bear a cost now for a benefit later, whoever it represents. What should be concluded from this? Not that democracy is a fraud, and the chapter is careful here. Political equality is real and has produced real gains — Dalit and Adivasi representation in legislatures, employment guarantee and food security legislation, reservations, midday meals, and the simple fact that governments are voted out for neglect. The record is one of partial success against an expectation of complete success, which is exactly the pattern the chapter identifies as democracy's signature: it creates the standard by which it is then judged and found wanting. A dictatorship does not raise the question of redistribution at all, because those who would demand it have no way to be heard. That is not equality; it is silence. The honest verdict is that democracy has delivered political equality and only partial economic equality, that the gap between them is real and worth being angry about, and that being able to be angry about it in public is itself one of the outcomes. (The wrong answers deny well-documented poor turnout figures, deny an inequality every income survey records, or invent a constitutional bar on welfare spending that no democracy has.)",
          hi: "प्रश्न के पीछे की अपेक्षा एक असली सैद्धांतिक भविष्यवाणी है, और उसका विफल होना बताता है कि मत नीति में बदलते कैसे हैं। भविष्यवाणी मान लेती है कि ग़रीब एक गुट बनाते हैं — कि ग़रीब होना वह पहचान है जिससे लोग मत देते हैं। वह है नहीं, या कम से कम आमतौर पर नहीं। कोई मतदाता एक साथ मराठी-भाषी है, किसी जाति का सदस्य, पानी या सड़कों की अपनी शिकायतों वाले ज़िले का निवासी, किसी आस्था का अनुयायी, किसी विशेष धंधे का मज़दूर और स्थानीय उम्मीदवार पर राय रखने वाला व्यक्ति। निर्धनता इन्हीं पहचानों में से एक है और वह बाक़ी से मुक़ाबला करती है। अतः निर्धन नागरिकों के मत पुनर्वितरण की एक ही माँग के पीछे जमा नहीं होते; वे कई दलों में बिखर जाते हैं, जिनमें से हर एक आय को आड़ा काटता गठजोड़ जोड़ता है। जो दल किसी राज्य में जीते वह एक समुदाय के निर्धन मतदाता रख सकता और दूसरे के खो सकता, अतः तंत्र में किसी के सामने सौदेबाज़ी को एकजुट वर्गीय मतदाता-वर्ग नहीं होता। यह मिथ्या चेतना नहीं; यह वही होता है जब लोगों के एक साथ कई असली हित हों। उत्तर का दूसरा आधा इससे जुड़ा कि चुनावों के बीच क्या होता है, जहाँ अधिकांश नीति वस्तुतः बनती है। मत पाँच वर्ष में एक बार इस्तेमाल होता बराबर औज़ार है। पैसा लगातार इस्तेमाल होता असमान औज़ार है। संपत्ति अभियान-वित्त ख़रीदती है, जो तय करता कि कौन उम्मीदवार खड़ा भी हो सकता; वह माध्यम-पहुँच ख़रीदती है, जो तय करता कौन-से मुद्दे चर्चा में आते; वह उन उद्योग-संघों और पैरवी को वित्तपोषित करती जो नियम बनाते मंत्रालयों से जुड़ते; वह अधिकारियों तक ऐसी पहुँच देती जो साधारण नागरिक के पास नहीं; और वह निवेश सीमाओं के पार ले जा सकती, जो वृद्धि की चिंता करती सरकार पर उत्तोलन देता है। इसमें से किसी को भ्रष्टाचार नहीं चाहिए। बस इतना कि केंद्रित संसाधन लगातार प्रभाव देते हैं, जबकि बिखरे मत आवधिक प्रभाव। एक तीसरा कारक भी नाम लेने योग्य है। पुनर्वितरण रचना में कठिन और परिणाम दिखाने में धीमा है, जबकि उसकी लागतें तुरंत और उन पर दिखतीं जो उन्हें ढोते हैं। भू-सीमा भूस्वामी तुरंत भाँप लेते हैं; लाभार्थियों को भाँपने में दशक लगते हैं। चार वर्ष में चुनाव का सामना करती सरकार के पास अभी लागत उठाकर बाद का लाभ पाने की कमज़ोर प्रेरणा है, वह किसी का भी प्रतिनिधित्व करती हो। इससे क्या निष्कर्ष निकाला जाए? यह नहीं कि लोकतंत्र धोखा है, और अध्याय यहाँ सावधान है। राजनीतिक समानता असली है और उसने असली लाभ दिए — विधानमंडलों में दलित तथा आदिवासी प्रतिनिधित्व, रोज़गार गारंटी और खाद्य सुरक्षा विधान, आरक्षण, मध्याह्न भोजन, और यह सीधा तथ्य कि उपेक्षा के लिए सरकारें हटा दी जाती हैं। रिकॉर्ड पूर्ण सफलता की अपेक्षा के सामने आंशिक सफलता का है, ठीक वही ढर्रा जिसे अध्याय लोकतंत्र की पहचान बताता है: वह वही मानक रचता है जिससे फिर आँका जाता और कम पाया जाता है। तानाशाही पुनर्वितरण का प्रश्न उठने ही नहीं देती, क्योंकि जो उसे माँगते उनके पास सुने जाने का उपाय नहीं। वह समानता नहीं; वह चुप्पी है। ईमानदार निर्णय यह कि लोकतंत्र ने राजनीतिक समानता दी और आर्थिक समानता केवल आंशिक, कि उनके बीच की खाई असली और उस पर क्रोध करने योग्य है, और यह कि उस पर सार्वजनिक रूप से क्रोध कर पाना स्वयं उन्हीं परिणामों में से एक है। (ग़लत उत्तर भली-भाँति दर्ज निर्धन मतदान-आँकड़े नकारते, हर आय-सर्वेक्षण में दर्ज असमानता नकारते, या कल्याण-व्यय पर ऐसी संवैधानिक रोक गढ़ते जो किसी लोकतंत्र में नहीं।)",
          mr: "प्रश्नामागील अपेक्षा हे खरे सैद्धांतिक भाकीत, आणि ते फसणे सांगते की मते धोरणात कशी बदलतात. भाकीत गृहीत धरते की गरीब एक गट बनवतात — की गरीब असणे ही ती ओळख जिच्यातून लोक मत देतात. ती नाही, किंवा किमान सहसा नाही. एक मतदार एकाच वेळी मराठी भाषिक आहे, एका जातीचा सदस्य, पाणी वा रस्त्यांबद्दलच्या स्वतःच्या तक्रारी असलेल्या जिल्ह्याचा रहिवासी, एका श्रद्धेचा अनुयायी, एका विशिष्ट धंद्यातील कामगार आणि स्थानिक उमेदवाराबद्दल मत बाळगणारी व्यक्ती. गरिबी या ओळखींपैकी एक आणि ती बाकीशी स्पर्धा करते. म्हणून गरीब नागरिकांची मते पुनर्वाटपाच्या एकाच मागणीमागे साचत नाहीत; ती अनेक पक्षांत विखुरतात, ज्यांतील प्रत्येक उत्पन्नाला आडवी छेदणारी आघाडी जुळवतो. जो पक्ष एखाद्या राज्यात जिंकतो तो एका समुदायाचे गरीब मतदार ठेवू शकतो आणि दुसऱ्याचे गमावू शकतो, म्हणून व्यवस्थेत कोणासमोरही घासाघिशीसाठी एकजूट वर्गीय मतदारवर्ग नसतो. ही मिथ्या जाणीव नाही; लोकांचे एकाच वेळी अनेक खरे हित असताना हेच घडते. उत्तराचा दुसरा अर्धा भाग निवडणुकांदरम्यान काय घडते याबद्दल, जिथे बहुतांश धोरण प्रत्यक्षात बनते. मत हे पाच वर्षांत एकदा वापरले जाणारे समान साधन. पैसा हे सतत वापरले जाणारे असमान साधन. संपत्ती मोहीम-अर्थपुरवठा विकत घेते, जो कोणता उमेदवार मुळात उभा राहू शकतो हे ठरवतो; ती माध्यम-पोहोच विकत घेते, जी कोणते मुद्दे चर्चेत येतात हे ठरवते; ती नियम बनवणाऱ्या मंत्रालयांशी जुळणाऱ्या उद्योग-संघटना व लॉबिंगला अर्थपुरवठा करते; ती अधिकाऱ्यांपर्यंत असा प्रवेश देते जो सामान्य नागरिकाकडे नाही; आणि ती गुंतवणूक सीमांपार नेऊ शकते, जे वाढीची चिंता करणाऱ्या सरकारवर उत्तोलन देते. यांपैकी कशालाही भ्रष्टाचार लागत नाही. फक्त इतकेच की केंद्रित साधने सतत प्रभाव देतात, तर विखुरलेली मते नियतकालिक प्रभाव. एक तिसरा घटकही नाव घेण्याजोगा. पुनर्वाटप रचनेत कठीण आणि निकाल दाखवायला मंद, तर त्याचे खर्च तात्काळ आणि जे ते वाहतात त्यांना दिसणारे. जमीन-मर्यादा जमीनदार लगेच ओळखतात; लाभार्थ्यांना ओळखायला दशक लागते. चार वर्षांत निवडणुकीला सामोरे जाणाऱ्या सरकारकडे आता खर्च सोसून नंतरचा लाभ मिळवण्याची दुर्बळ प्रेरणा, ते कोणाचेही प्रतिनिधित्व करत असो. यातून काय निष्कर्ष काढावा? हे नाही की लोकशाही फसवणूक आहे, आणि प्रकरण इथे काळजीपूर्वक. राजकीय समानता खरी आणि तिने खरे फायदे दिले — विधिमंडळांत दलित व आदिवासी प्रतिनिधित्व, रोजगार हमी आणि अन्नसुरक्षा कायदे, आरक्षण, माध्यान्ह भोजन, आणि हे सरळ तथ्य की दुर्लक्षासाठी सरकारे हटवली जातात. लौकिक पूर्ण यशाच्या अपेक्षेसमोर अंशतः यशाचा, नेमके तेच प्रारूप जे प्रकरण लोकशाहीची खूण म्हणून ओळखते: ती तेच मानक घडवते ज्याने मग तोलली जाते आणि कमी आढळते. हुकूमशाही पुनर्वाटपाचा प्रश्न उभाच राहू देत नाही, कारण जे तो मागतील त्यांच्याकडे ऐकले जाण्याचा मार्ग नाही. ती समानता नाही; ती शांतता आहे. प्रामाणिक निर्णय हा की लोकशाहीने राजकीय समानता दिली आणि आर्थिक समानता केवळ अंशतः, की त्यांच्यातील दरी खरी आणि तिच्यावर संताप करण्याजोगी, आणि हे की तिच्यावर जाहीरपणे संताप करता येणे हाच त्या परिणामांपैकी एक. (चुकीची उत्तरे नोंदलेले गरीब मतदान-आकडे नाकारतात, प्रत्येक उत्पन्न-सर्वेक्षण नोंदवत असलेली विषमता नाकारतात, वा कल्याण-खर्चावर अशी संवैधानिक बंदी रचतात जी कोणत्याही लोकशाहीत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Democracy shows no growth advantage over dictatorship, has not removed poverty or inequality, and its citizens are the ones most dissatisfied with their governments. A student concludes that the case for democracy is weak. Answer them.",
          hi: "लोकतंत्र तानाशाही पर वृद्धि में कोई लाभ नहीं दिखाता, उसने निर्धनता या असमानता हटाई नहीं, और उसके नागरिक ही अपनी सरकारों से सबसे अधिक असंतुष्ट हैं। एक छात्र निष्कर्ष निकालता है कि लोकतंत्र का पक्ष कमज़ोर है। उसे उत्तर दो।",
          mr: "लोकशाही हुकूमशाहीवर वाढीत कोणताही फायदा दाखवत नाही, तिने गरिबी वा विषमता हटवली नाही, आणि तिचे नागरिकच आपल्या सरकारांवर सर्वाधिक असमाधानी. एक विद्यार्थी निष्कर्ष काढतो की लोकशाहीची बाजू दुर्बळ आहे. त्याला उत्तर द्या.",
        },
        choices: [
          {
            en: "The conclusion mistakes the standard. Democracy is judged against expectations it created, so partial success reads as failure — and the dissatisfaction is itself produced by citizens believing they may demand more. On the record, it delivers what nothing else does: government legitimate by consent rather than fear, decisions that can be questioned and reversed, diversity accommodated instead of suppressed, no famine where a free press and a removable government exist, and above all a mistake that can be corrected without bloodshed — which is worth more than a percentage point of growth",
            hi: "निष्कर्ष मानक की भूल करता है। लोकतंत्र उन्हीं अपेक्षाओं से आँका जाता जो उसने रचीं, अतः आंशिक सफलता विफलता-सी पढ़ी जाती — और असंतोष स्वयं इससे उपजा कि नागरिक मानते हैं वे अधिक माँग सकते हैं। रिकॉर्ड पर वह वह देता है जो और कुछ नहीं देता: भय से नहीं सहमति से वैध सरकार, ऐसे निर्णय जिन पर प्रश्न उठे और जो पलटे जा सकें, दमित नहीं समायोजित विविधता, स्वतंत्र प्रेस तथा हटाई जा सकती सरकार वाली जगह कोई अकाल नहीं, और सबसे बढ़कर ऐसी भूल जो रक्तपात बिना सुधारी जा सके — जो वृद्धि के एक प्रतिशत-बिंदु से अधिक मूल्यवान है",
            mr: "निष्कर्ष मानकाची चूक करतो. लोकशाही तिनेच घडवलेल्या अपेक्षांविरुद्ध तोलली जाते, म्हणून अंशतः यश अपयशासारखे वाचले जाते — आणि असमाधान स्वतःच नागरिकांना वाटते की ते अधिक मागू शकतात यातून उपजलेले. लौकिकावर ती ते देते जे दुसरे काहीही देत नाही: भीतीने नव्हे तर संमतीने वैध सरकार, प्रश्न विचारता येतील आणि पलटवता येतील असे निर्णय, दडपलेली नव्हे तर सामावलेली विविधता, मुक्त वृत्तपत्रे व हटवता येणारे सरकार असलेल्या जागी कोणताही दुष्काळ नाही, आणि सर्वांत महत्त्वाचे रक्तपाताविना दुरुस्त करता येणारी चूक — जी वाढीच्या एका टक्केबिंदूहून अधिक मोलाची",
          },
          {
            en: "The student is right and democracy should be abandoned wherever growth rates are low",
            hi: "छात्र सही है और जहाँ वृद्धि दर कम हो वहाँ लोकतंत्र छोड़ देना चाहिए",
            mr: "विद्यार्थी बरोबर आणि जिथे वाढीचे दर कमी तिथे लोकशाही सोडावी",
          },
          {
            en: "The premises are all false: democracies grow faster, have no poverty, and their citizens are uniformly satisfied",
            hi: "सब आधार झूठे हैं: लोकतंत्र तेज़ बढ़ते हैं, उनमें निर्धनता नहीं, और उनके नागरिक एकसमान संतुष्ट हैं",
            mr: "सर्व गृहीतके खोटी: लोकशाही वेगाने वाढतात, त्यांत गरिबी नाही, आणि त्यांचे नागरिक एकसारखे समाधानी",
          },
          {
            en: "The question cannot be answered because outcomes of government cannot be compared across countries at all",
            hi: "प्रश्न का उत्तर नहीं दिया जा सकता क्योंकि शासन के परिणामों की देशों के बीच तुलना हो ही नहीं सकती",
            mr: "प्रश्नाचे उत्तर देता येत नाही कारण शासनाच्या परिणामांची देशांदरम्यान तुलना होऊच शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's facts are largely correct, and it is worth conceding them plainly before answering. Democracies do not grow faster on average; the measured difference is negligible and swamped by population, resources and global conditions. Poverty and inequality persist in almost every democracy, in several worsening. And citizens of democracies are indeed conspicuously dissatisfied. The error is not in the evidence but in the standard being applied. Notice where the standard came from. Nobody asks whether a dictatorship has reduced inequality or accommodated minorities, because the question is not on offer — there is no mechanism by which the answer could matter. Democracy is measured against these expectations precisely because it created them: it teaches citizens that a government exists to serve them and can be removed for failing to, and having taught that, it is then held to it. So a democracy's record will always read as disappointing, and the dissatisfaction the student cites is not evidence against the system but a product of it. A subject who complains in a dictatorship risks arrest; a citizen who complains in a democracy is exercising a right. The complaint is the outcome. Now the positive case, stated without exaggeration. First, legitimacy. Democratic government is obeyed because it was chosen, not because it is feared, and this is not sentimentality — it is the reason such a state needs vastly less coercion to function and can implement decisions without compelling each citizen separately. Second, accountability and transparency. Citizens can ask how a decision was made and on what rule, take an answer to court, and remove those responsible. The claim is not that democratic decisions are better; often they are slower and messier. It is that they are answerable, and a system that can be corrected outperforms one that cannot, over time, even if it is wrong as often. Third, accommodation of diversity. This is where the record is strongest and where the alternative is worst. Sri Lanka's civil war, examined earlier in this book, followed directly from a majority governing as though a minority were outside the nation. India's linguistic reorganisation shows the opposite path. Handling division by negotiation rather than suppression is not a small achievement; it is the difference between a country that argues and a country at war. Fourth, and most concrete, the famine record. No substantial famine has occurred in a functioning democracy with a free press. A government that can be voted out cannot afford to let people starve unnoticed, because journalists will report it and voters will punish it. That is an economic outcome, and it is decisive. Fifth, dignity. Formal equality of every citizen, one vote of equal weight regardless of caste, wealth, gender or faith, is a real thing even where economic equality has not followed, and it has produced concrete change: representation in legislatures for communities excluded for centuries, and a language of rights that those communities have used. So the final answer to the student is that they have chosen the wrong criterion. If the test is growth, the evidence is genuinely inconclusive, and the argument for democracy does not rest there. The test that matters is whether a mistake can be corrected without violence, whether power can change hands without bloodshed, whether a person can say the government is wrong and remain free, and whether those left out of a decision have a route back in. On those, no alternative comes close — and a system that permits its own failures to be catalogued as thoroughly as the student just did is demonstrating, in that very act, what it is for. (The wrong answers accept a growth-only criterion, deny facts the chapter itself concedes, or refuse a comparison that the entire study of politics rests on.)",
          hi: "छात्र के तथ्य बड़े हिस्से में सही हैं, और उत्तर देने से पहले उन्हें साफ़ मान लेना उचित है। लोकतंत्र औसतन तेज़ नहीं बढ़ते; मापा गया अंतर नगण्य है और जनसंख्या, संसाधनों तथा वैश्विक दशाओं में डूब जाता है। निर्धनता और असमानता लगभग हर लोकतंत्र में बनी हैं, कई में बिगड़ती हुई। और लोकतंत्रों के नागरिक सचमुच स्पष्ट रूप से असंतुष्ट हैं। भूल प्रमाण में नहीं, लगाए जा रहे मानक में है। ध्यान दो मानक आया कहाँ से। कोई नहीं पूछता कि किसी तानाशाही ने असमानता घटाई या अल्पसंख्यकों को समायोजित किया, क्योंकि प्रश्न रखा ही नहीं जाता — ऐसी कोई क्रियाविधि नहीं जिससे उत्तर मायने रख सके। लोकतंत्र इन्हीं अपेक्षाओं से ठीक इसलिए नापा जाता है कि उसने उन्हें रचा: वह नागरिकों को सिखाता है कि सरकार उनकी सेवा के लिए है और चूकने पर हटाई जा सकती है, और यह सिखा चुकने के बाद उसी पर पकड़ा जाता है। अतः किसी लोकतंत्र का रिकॉर्ड सदा निराशाजनक पढ़ा जाएगा, और छात्र जिस असंतोष का हवाला देता वह प्रणाली के विरुद्ध प्रमाण नहीं बल्कि उसी की उपज है। तानाशाही में शिकायत करती प्रजा गिरफ़्तारी का जोखिम उठाती है; लोकतंत्र में शिकायत करता नागरिक अधिकार का प्रयोग कर रहा है। शिकायत ही परिणाम है। अब सकारात्मक पक्ष, बिना अतिशयोक्ति। पहला, वैधता। लोकतांत्रिक सरकार इसलिए मानी जाती कि वह चुनी गई, इसलिए नहीं कि डर है, और यह भावुकता नहीं — यही कारण है कि ऐसे राज्य को चलने के लिए कहीं कम बल चाहिए और वह हर नागरिक को अलग-अलग बाध्य किए बिना निर्णय लागू कर सकता है। दूसरा, जवाबदेही और पारदर्शिता। नागरिक पूछ सकते हैं कि निर्णय कैसे और किस नियम से लिया गया, उत्तर अदालत ले जा सकते, और ज़िम्मेदारों को हटा सकते हैं। दावा यह नहीं कि लोकतांत्रिक निर्णय बेहतर हैं; अक्सर वे धीमे और अस्त-व्यस्त होते हैं। दावा यह कि वे उत्तर-योग्य हैं, और जो प्रणाली सुधारी जा सके वह समय के साथ उससे बेहतर करती है जो नहीं सुधारी जा सकती, भले वह उतनी ही बार ग़लत हो। तीसरा, विविधता का समायोजन। यहीं रिकॉर्ड सबसे मज़बूत है और यहीं विकल्प सबसे बुरा। श्रीलंका का गृहयुद्ध, जिसे इसी पुस्तक में पहले परखा गया, सीधे इससे निकला कि बहुमत ने ऐसे शासन किया मानो अल्पसंख्यक राष्ट्र के बाहर हो। भारत का भाषायी पुनर्गठन उल्टा मार्ग दिखाता है। विभाजन को दमन नहीं बातचीत से सँभालना छोटी उपलब्धि नहीं; वही अंतर है बहस करते देश और युद्ध में देश के बीच। चौथा, और सबसे ठोस, अकाल का रिकॉर्ड। स्वतंत्र प्रेस वाले चलते लोकतंत्र में कोई बड़ा अकाल नहीं पड़ा। जो सरकार मतों से हटाई जा सकती वह लोगों को अनदेखे भूखों मरने नहीं दे सकती, क्योंकि पत्रकार उसे छापेंगे और मतदाता उसे दंडित करेंगे। वह आर्थिक परिणाम है, और वह निर्णायक है। पाँचवाँ, गरिमा। हर नागरिक की औपचारिक समानता, जाति, संपत्ति, लिंग या आस्था चाहे जो हो बराबर वज़न का एक मत, असली चीज़ है भले आर्थिक समानता उसके पीछे न आई हो, और उसने ठोस बदलाव दिए: सदियों बहिष्कृत रहे समुदायों को विधानमंडलों में प्रतिनिधित्व, और अधिकारों की एक भाषा जिसे उन समुदायों ने इस्तेमाल किया। अतः छात्र को अंतिम उत्तर यह कि उसने ग़लत कसौटी चुनी है। यदि कसौटी वृद्धि है, प्रमाण सचमुच अनिर्णायक हैं, और लोकतंत्र का तर्क वहाँ टिकता ही नहीं। जो कसौटी मायने रखती वह यह कि क्या कोई भूल हिंसा बिना सुधारी जा सकती, क्या सत्ता रक्तपात बिना हाथ बदल सकती, क्या कोई कह सकता कि सरकार ग़लत है और स्वतंत्र बना रहे, और क्या किसी निर्णय से बाहर छूटे लोगों के पास लौटने का रास्ता है। उन पर कोई विकल्प पास भी नहीं फटकता — और जो प्रणाली अपनी ही विफलताओं को इतनी अच्छी तरह सूचीबद्ध होने देती है जितना छात्र ने अभी किया, वह उसी कर्म में दिखा रही है कि वह किसलिए है। (ग़लत उत्तर केवल-वृद्धि की कसौटी स्वीकारते, उन तथ्यों को नकारते जिन्हें अध्याय स्वयं मानता है, या उस तुलना से इनकार करते जिस पर राजनीति का पूरा अध्ययन टिका है।)",
          mr: "विद्यार्थ्याची तथ्ये मोठ्या प्रमाणात बरोबर, आणि उत्तर देण्याआधी ती स्पष्ट मान्य करणे योग्य. लोकशाही सरासरीने वेगाने वाढत नाहीत; मोजलेला फरक नगण्य आणि लोकसंख्या, संसाधने व जागतिक स्थितीत बुडतो. गरिबी आणि विषमता जवळजवळ प्रत्येक लोकशाहीत टिकून, कित्येकांत वाढत. आणि लोकशाहींचे नागरिक खरोखर ठळकपणे असमाधानी. चूक पुराव्यात नाही तर लावल्या जाणाऱ्या मानकात. मानक कुठून आले ते पाहा. कोणी विचारत नाही की एखाद्या हुकूमशाहीने विषमता घटवली वा अल्पसंख्याकांना सामावले, कारण प्रश्न मांडलाच जात नाही — अशी कोणतीही यंत्रणा नाही जिच्यामुळे उत्तर महत्त्वाचे ठरेल. लोकशाही याच अपेक्षांविरुद्ध नेमके यासाठी मोजली जाते की तिने त्या घडवल्या: ती नागरिकांना शिकवते की सरकार त्यांच्या सेवेसाठी आहे आणि चुकल्यास हटवता येते, आणि हे शिकवल्यावर तिलाच त्यावर धरले जाते. म्हणून कोणत्याही लोकशाहीचा लौकिक सदैव निराशाजनक वाचला जाईल, आणि विद्यार्थी ज्या असमाधानाचा दाखला देतो ते व्यवस्थेविरुद्धचा पुरावा नव्हे तर तिचीच उपज. हुकूमशाहीत तक्रार करणारी प्रजा अटकेचा धोका पत्करते; लोकशाहीत तक्रार करणारा नागरिक हक्क बजावत आहे. तक्रारच परिणाम. आता सकारात्मक बाजू, अतिशयोक्तीविना. पहिली, वैधता. लोकशाही सरकार यासाठी पाळले जाते की ते निवडले गेले, यासाठी नाही की भीती वाटते, आणि ही भावुकता नाही — हेच कारण की अशा राज्याला चालायला कितीतरी कमी बळ लागते आणि ते प्रत्येक नागरिकाला वेगवेगळे भाग पाडल्याविना निर्णय राबवू शकते. दुसरी, उत्तरदायित्व आणि पारदर्शकता. नागरिक विचारू शकतात की निर्णय कसा आणि कोणत्या नियमाने घेतला, उत्तर न्यायालयात नेऊ शकतात, आणि जबाबदारांना हटवू शकतात. दावा हा नाही की लोकशाही निर्णय अधिक चांगले; अनेकदा ते मंद आणि गोंधळलेले. दावा हा की ते उत्तरयोग्य, आणि जी व्यवस्था दुरुस्त करता येते ती काळाबरोबर जिला करता येत नाही तिच्याहून चांगले करते, जरी ती तितक्याच वेळा चुकत असली तरी. तिसरी, विविधतेचे सामावणे. इथेच लौकिक सर्वांत भक्कम आणि इथेच पर्याय सर्वांत वाईट. श्रीलंकेचे यादवी युद्ध, याच पुस्तकात आधी तपासलेले, थेट यातून निघाले की बहुमताने अल्पसंख्याक राष्ट्राबाहेर असल्यासारखे राज्य केले. भारताची भाषिक पुनर्रचना उलट मार्ग दाखवते. विभाजन दडपशाहीने नव्हे तर वाटाघाटीने हाताळणे ही लहान कमाई नाही; तोच फरक वाद घालणारा देश आणि युद्धातील देश यांच्यात. चौथी, आणि सर्वांत ठोस, दुष्काळाचा लौकिक. मुक्त वृत्तपत्रे असलेल्या चालत्या लोकशाहीत मोठा दुष्काळ पडलेला नाही. जे सरकार मतांनी हटवता येते ते लोकांना दुर्लक्षितपणे उपाशी मरू देऊ शकत नाही, कारण पत्रकार ते छापतील आणि मतदार त्याला शिक्षा देतील. तो आर्थिक परिणाम, आणि तो निर्णायक. पाचवी, प्रतिष्ठा. प्रत्येक नागरिकाची औपचारिक समानता, जात, संपत्ती, लिंग वा श्रद्धा कोणतीही असो समान वजनाचे एक मत, ही खरी गोष्ट जरी आर्थिक समानता तिच्यामागे आली नसली तरी, आणि तिने ठोस बदल घडवला: शतके वगळलेल्या समुदायांना विधिमंडळांत प्रतिनिधित्व, आणि हक्कांची एक भाषा जी त्या समुदायांनी वापरली. म्हणून विद्यार्थ्याला अंतिम उत्तर हे की त्याने चुकीची कसोटी निवडली. कसोटी वाढ असेल, तर पुरावा खरोखर अनिर्णायक, आणि लोकशाहीचा युक्तिवाद तिथे टेकतच नाही. जी कसोटी महत्त्वाची ती ही की एखादी चूक हिंसेविना दुरुस्त करता येते का, सत्ता रक्तपाताविना हात बदलू शकते का, कोणी सांगू शकतो का की सरकार चुकीचे आहे आणि मुक्त राहू शकतो का, आणि एखाद्या निर्णयातून वगळलेल्यांकडे परत येण्याचा मार्ग आहे का. त्यांवर कोणताही पर्याय जवळही येत नाही — आणि जी व्यवस्था स्वतःच्याच अपयशांची विद्यार्थ्याने आत्ता केली तितकी नीट यादी होऊ देते, ती त्याच कृतीत दाखवत आहे की ती कशासाठी आहे. (चुकीची उत्तरे केवळ-वाढीची कसोटी स्वीकारतात, प्रकरण स्वतः मान्य करत असलेली तथ्ये नाकारतात, वा ज्या तुलनेवर राजकारणाचा अख्खा अभ्यास टेकलेला ती नाकारतात.)",
        },
      },
    ],
  },
];
