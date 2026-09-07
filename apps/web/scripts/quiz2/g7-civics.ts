/**
 * Class 7 Civics — NCERT "Social and Political Life II", chapter by chapter,
 * through the conceptual engine. Equality moves from the ballot to the lunch
 * plate, health becomes a public promise, the state government grows a face —
 * and media and markets get read for who pays and who profits.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Social and Political Life – II (Class 7)";
const LICENCE = "CC-BY-SA-4.0";

export const G7_CIVICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — On Equality (the vote, the law and the lunch plate)         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-7-on-equality",
    subject: "CIVICS",
    classLevel: 7,
    chapter: {
      en: "Chapter 1 — On Equality",
      hi: "अध्याय 1 — समानता",
      mr: "प्रकरण 1 — समानता",
    },
    name: { en: "On Equality", hi: "समानता", mr: "समानता" },
    summary: {
      en: "Equality as vote, law and dignity: every adult's equal ballot, one rulebook over minister and farmhand, untouchability outlawed — and a school lunch quietly redrawing who sits with whom.",
      hi: "वोट, क़ानून और गरिमा के रूप में समानता: हर वयस्क का बराबर मत, मंत्री और मज़दूर पर एक ही नियम-पुस्तिका, अस्पृश्यता ग़ैरक़ानूनी — और कौन किसके साथ बैठे, इसे चुपचाप फिर खींचता स्कूल का भोजन।",
      mr: "मत, कायदा आणि प्रतिष्ठा म्हणून समानता: प्रत्येक प्रौढाचे समान मत, मंत्री आणि मजुरावर एकच नियमपुस्तिका, अस्पृश्यता बेकायदा — आणि कोण कोणासोबत बसते हे गुपचूप पुन्हा आखणारे शाळेचे जेवण.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "franchise",
        name: {
          en: "Universal adult franchise",
          hi: "सार्वभौम वयस्क मताधिकार",
          mr: "सार्वत्रिक प्रौढ मताधिकार",
        },
        kind: "provision",
        prompt: {
          en: "Which rule gives every adult citizen one vote of equal worth — rich or poor, whatever their caste, faith or gender?",
          hi: "कौन-सा नियम हर वयस्क नागरिक को बराबर मोल का एक वोट देता है — धनी हो या निर्धन, जाति-धर्म-लिंग जो भी हो?",
          mr: "कोणता नियम प्रत्येक प्रौढ नागरिकाला समान मोलाचे एक मत देतो — श्रीमंत असो वा गरीब, जात-धर्म-लिंग कोणतेही असो?",
        },
        statement: {
          en: "Universal adult franchise gives every adult one equal vote — the constitution's bluntest sentence on equality.",
          hi: "सार्वभौम वयस्क मताधिकार हर वयस्क को एक बराबर वोट देता है — समानता पर संविधान का सबसे दो-टूक वाक्य।",
          mr: "सार्वत्रिक प्रौढ मताधिकार प्रत्येक प्रौढाला एक समान मत देतो — समतेवरचे संविधानाचे सर्वांत रोखठोक वाक्य.",
        },
        pair: {
          left: { en: "One person, one vote", hi: "एक व्यक्ति, एक वोट", mr: "एक व्यक्ती, एक मत" },
          right: {
            en: "each vote worth the same",
            hi: "हर वोट का मोल बराबर",
            mr: "प्रत्येक मताचे मोल समान",
          },
        },
      },
      {
        id: "equality-law",
        name: {
          en: "Equality before the law",
          hi: "क़ानून के समक्ष समानता",
          mr: "कायद्यापुढे समानता",
        },
        kind: "provision",
        prompt: {
          en: "Which constitutional guarantee places every person — minister or farmhand — under one and the same law?",
          hi: "कौन-सी संवैधानिक गारंटी हर व्यक्ति को — मंत्री हो या मज़दूर — एक ही क़ानून के नीचे रखती है?",
          mr: "कोणती घटनात्मक हमी प्रत्येक व्यक्तीला — मंत्री असो वा मजूर — एकाच कायद्याखाली ठेवते?",
        },
        statement: {
          en: "Equality before the law binds everyone to one rulebook — no office, wealth or birth lifts a person above it.",
          hi: "क़ानून के समक्ष समानता सबको एक नियम-पुस्तिका से बाँधती है — कोई पद, धन या जन्म किसी को उसके ऊपर नहीं उठाता।",
          mr: "कायद्यापुढील समानता साऱ्यांना एका नियमपुस्तिकेने बांधते — कोणतेही पद, धन वा जन्म कोणाला तिच्या वर उचलत नाही.",
        },
        detail: {
          en: "It also forbids the state to discriminate by religion, caste, sex or place of birth — the same door for all.",
          hi: "यह राज्य को धर्म, जाति, लिंग या जन्मस्थान पर भेद करने से भी रोकती है — सबके लिए एक ही दरवाज़ा।",
          mr: "ती राज्यसंस्थेला धर्म, जात, लिंग वा जन्मस्थानावरून भेद करण्यापासूनही रोखते — साऱ्यांसाठी एकच दार.",
        },
        extra: {
          en: "Written as Article 14, it is the yardstick courts hold up to every act of government.",
          hi: "अनुच्छेद 14 के रूप में लिखी, यह वह गज है जिसे अदालतें सरकार के हर काम पर रखती हैं।",
          mr: "अनुच्छेद 14 म्हणून लिहिलेली, ही ती मोजपट्टी जी न्यायालये सरकारच्या प्रत्येक कृतीला लावतात.",
        },
        pair: {
          left: { en: "One rulebook for all", hi: "सबकी एक नियम-पुस्तिका", mr: "साऱ्यांची एक नियमपुस्तिका" },
          right: {
            en: "no one above the law",
            hi: "क़ानून से ऊपर कोई नहीं",
            mr: "कायद्याच्या वर कोणी नाही",
          },
        },
      },
      {
        id: "dignity",
        name: { en: "Dignity", hi: "गरिमा", mr: "प्रतिष्ठा" },
        kind: "idea",
        prompt: {
          en: "Beyond votes and laws, equality demands which everyday respect — being treated as fully human, never as lesser?",
          hi: "वोट और क़ानून से आगे, समानता किस रोज़मर्रा के सम्मान की माँग करती है — पूरा इंसान माने जाने की, कभी कमतर नहीं?",
          mr: "मत आणि कायद्यापलीकडे, समानता कोणत्या रोजच्या आदराची मागणी करते — पूर्ण माणूस मानले जाण्याची, कधी कमी नाही?",
        },
        statement: {
          en: "Dignity is equality lived — every person met as an equal human being, not merely counted as one on paper.",
          hi: "गरिमा जी हुई समानता है — हर व्यक्ति से बराबर इंसान की तरह मिलना, केवल काग़ज़ पर बराबर गिनना नहीं।",
          mr: "प्रतिष्ठा म्हणजे जगलेली समानता — प्रत्येक व्यक्तीला समान माणूस म्हणून भेटणे, केवळ कागदावर समान मोजणे नव्हे.",
        },
        pair: {
          left: { en: "Respect owed to all", hi: "सबको देय सम्मान", mr: "साऱ्यांना देय आदर" },
          right: { en: "equality lived daily", hi: "रोज़ जी हुई समानता", mr: "रोज जगलेली समानता" },
        },
      },
      {
        id: "midday-meal",
        name: { en: "The midday meal", hi: "मध्याह्न भोजन", mr: "माध्यान्ह भोजन" },
        kind: "programme",
        prompt: {
          en: "Which school programme serves cooked lunch to all children together — feeding attendance and softening caste lines at once?",
          hi: "कौन-सी स्कूल योजना सब बच्चों को साथ बैठाकर पका भोजन देती है — हाज़िरी बढ़ाती और जाति की लकीरें नरम करती हुई?",
          mr: "कोणती शाळा-योजना साऱ्या मुलांना एकत्र बसवून शिजवलेले जेवण देते — हजेरी वाढवत आणि जातीच्या रेषा मऊ करत?",
        },
        statement: {
          en: "The midday meal feeds every child at school together — nutrition, attendance, and a quiet daily lesson in sitting side by side.",
          hi: "मध्याह्न भोजन हर बच्चे को स्कूल में साथ खिलाता है — पोषण, हाज़िरी, और बग़ल में बैठने का रोज़ का ख़ामोश पाठ।",
          mr: "माध्यान्ह भोजन प्रत्येक मुलाला शाळेत एकत्र जेवू घालते — पोषण, हजेरी, आणि शेजारी बसण्याचा रोजचा मूक धडा.",
        },
        detail: {
          en: "Where the meal arrived, poor children's enrolment rose — hunger had been keeping them home.",
          hi: "जहाँ भोजन पहुँचा, निर्धन बच्चों का दाख़िला बढ़ा — भूख ही उन्हें घर रोके थी।",
          mr: "जिथे जेवण पोहोचले, तिथे गरीब मुलांची पटनोंदणी वाढली — भूकच त्यांना घरी अडवत होती.",
        },
        extra: {
          en: "Children of every caste sharing one meal unsettles old rules about who may eat beside whom.",
          hi: "हर जाति के बच्चों का एक भोजन बाँटना उन पुराने नियमों को हिला देता है कि कौन किसके पास बैठकर खाए।",
          mr: "प्रत्येक जातीच्या मुलांनी एक जेवण वाटणे कोण कोणाशेजारी बसून जेवावे या जुन्या नियमांना हादरवते.",
        },
        pair: {
          left: { en: "One lunch for all", hi: "सबका एक भोजन", mr: "साऱ्यांचे एक जेवण" },
          right: {
            en: "attendance fed, lines softened",
            hi: "हाज़िरी बढ़ी, लकीरें नरम",
            mr: "हजेरी वाढली, रेषा मऊ",
          },
        },
      },
      {
        id: "untouchability-ban",
        name: {
          en: "The abolition of untouchability",
          hi: "अस्पृश्यता का उन्मूलन",
          mr: "अस्पृश्यतेचे निर्मूलन",
        },
        kind: "provision",
        prompt: {
          en: "Which practice — barring people from wells, temples and homes by birth — does the Constitution abolish outright?",
          hi: "किस प्रथा को — जन्म के आधार पर कुओं, मंदिरों और घरों से रोकने को — संविधान सिरे से समाप्त करता है?",
          mr: "कोणती प्रथा — जन्माच्या आधारावर विहिरी, मंदिरे आणि घरांपासून रोखणे — संविधान थेट नष्ट करते?",
        },
        statement: {
          en: "Untouchability stands abolished — the Constitution outlaws exclusion by birth in every form, and practising it is a punishable offence.",
          hi: "अस्पृश्यता समाप्त घोषित है — संविधान जन्म-आधारित बहिष्कार को हर रूप में ग़ैरक़ानूनी ठहराता है, और उसका बरतना दंडनीय अपराध है।",
          mr: "अस्पृश्यता नष्ट घोषित आहे — संविधान जन्माधारित बहिष्काराला प्रत्येक रूपात बेकायदा ठरवते, आणि ती पाळणे दंडनीय गुन्हा आहे.",
        },
        pair: {
          left: { en: "Exclusion by birth", hi: "जन्म से बहिष्कार", mr: "जन्माने बहिष्कार" },
          right: { en: "abolished outright", hi: "सिरे से समाप्त", mr: "थेट नष्ट" },
        },
      },
      {
        id: "civil-rights",
        name: {
          en: "The Civil Rights Movement",
          hi: "नागरिक अधिकार आंदोलन",
          mr: "नागरी हक्क चळवळ",
        },
        kind: "struggle",
        prompt: {
          en: "Which American struggle against separate schools and bus seats for Black citizens echoes India's own fight against caste exclusion?",
          hi: "अश्वेत नागरिकों के लिए अलग स्कूलों और बस-सीटों के विरुद्ध कौन-सा अमेरिकी संघर्ष भारत की जाति-बहिष्कार विरोधी लड़ाई की अनुगूँज है?",
          mr: "कृष्णवर्णीय नागरिकांसाठी वेगळ्या शाळा आणि बस-जागांविरुद्धचा कोणता अमेरिकी लढा भारताच्या जाती-बहिष्कारविरोधी लढ्याचा प्रतिध्वनी आहे?",
        },
        statement: {
          en: "The US Civil Rights Movement fought legal separation by race — proof that struggles for equality speak across borders.",
          hi: "अमेरिकी नागरिक अधिकार आंदोलन नस्ल के क़ानूनी अलगाव से लड़ा — प्रमाण कि समानता के संघर्ष सरहदों के पार बोलते हैं।",
          mr: "अमेरिकी नागरी हक्क चळवळ वंशाच्या कायदेशीर विलगीकरणाशी लढली — पुरावा की समतेचे लढे सीमांपार बोलतात.",
        },
        detail: {
          en: "Rosa Parks' refusal to give up her bus seat in 1955 lit the Montgomery bus boycott.",
          hi: "1955 में रोज़ा पार्क्स का बस की सीट छोड़ने से इनकार मॉन्टगोमरी बस-बहिष्कार की चिंगारी बना।",
          mr: "1955 मध्ये रोझा पार्क्सच्या बसमधली जागा सोडण्याच्या नकाराने माँटगोमेरी बस-बहिष्कार पेटला.",
        },
        extra: {
          en: "The laws changed in 1964; the work of lived equality continues there, as here.",
          hi: "क़ानून 1964 में बदले; जी हुई समानता का काम वहाँ भी जारी है, यहाँ की तरह।",
          mr: "कायदे 1964 मध्ये बदलले; जगलेल्या समतेचे काम तिथेही चालू आहे, इथल्यासारखे.",
        },
        pair: {
          left: { en: "Rosa Parks' seat", hi: "रोज़ा पार्क्स की सीट", mr: "रोझा पार्क्सची जागा" },
          right: {
            en: "a refusal that lit a movement",
            hi: "इनकार जिसने आंदोलन जलाया",
            mr: "चळवळ पेटवणारा नकार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Which list holds ONLY constitutional guarantees of equality — not government programmes?",
          hi: "किस सूची में केवल समानता की संवैधानिक गारंटियाँ हैं — सरकारी योजनाएँ नहीं?",
          mr: "कोणत्या यादीत फक्त समतेच्या घटनात्मक हमी आहेत — सरकारी योजना नाहीत?",
        },
        choices: [
          {
            en: "Universal adult franchise · equality before the law · the abolition of untouchability",
            hi: "सार्वभौम वयस्क मताधिकार · क़ानून के समक्ष समानता · अस्पृश्यता का उन्मूलन",
            mr: "सार्वत्रिक प्रौढ मताधिकार · कायद्यापुढे समानता · अस्पृश्यतेचे निर्मूलन",
          },
          {
            en: "Universal adult franchise · the midday meal · equality before the law",
            hi: "सार्वभौम वयस्क मताधिकार · मध्याह्न भोजन · क़ानून के समक्ष समानता",
            mr: "सार्वत्रिक प्रौढ मताधिकार · माध्यान्ह भोजन · कायद्यापुढे समानता",
          },
          {
            en: "The midday meal · the abolition of untouchability · free bus passes",
            hi: "मध्याह्न भोजन · अस्पृश्यता का उन्मूलन · मुफ़्त बस पास",
            mr: "माध्यान्ह भोजन · अस्पृश्यतेचे निर्मूलन · मोफत बस पास",
          },
          {
            en: "Equality before the law · scholarships · the midday meal",
            hi: "क़ानून के समक्ष समानता · छात्रवृत्तियाँ · मध्याह्न भोजन",
            mr: "कायद्यापुढे समानता · शिष्यवृत्त्या · माध्यान्ह भोजन",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Guarantees and programmes work differently. The franchise, Article 14 and the untouchability ban are written into the Constitution — permanent, enforceable in court, not budget lines. The midday meal, passes and scholarships are programmes: valuable, but made and remade by governments. One kind is the foundation; the other is furniture that governments arrange upon it.",
          hi: "गारंटियाँ और योजनाएँ अलग ढंग से काम करती हैं। मताधिकार, अनुच्छेद 14 और अस्पृश्यता-निषेध संविधान में लिखे हैं — स्थायी, अदालत में लागू कराने योग्य, बजट की मदें नहीं। मध्याह्न भोजन, पास और छात्रवृत्तियाँ योजनाएँ हैं: बहुमूल्य, पर सरकारें उन्हें बनाती-बदलती रहती हैं। एक नींव है; दूसरा उस पर सजाया गया फ़र्नीचर।",
          mr: "हमी आणि योजना वेगळ्या रीतीने काम करतात. मताधिकार, अनुच्छेद 14 आणि अस्पृश्यता-बंदी संविधानात लिहिले आहेत — कायम, न्यायालयात राबवण्याजोगे, अर्थसंकल्पाच्या ओळी नव्हेत. माध्यान्ह भोजन, पास आणि शिष्यवृत्त्या या योजना: मोलाच्या, पण सरकारे त्या घडवत-बदलत राहतात. एक पाया आहे; दुसरे त्यावर मांडलेले सामान.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Every adult has an equal vote, yet a sweeper's child and a minister's child still live very unequal days. Why is the equal vote necessary but NOT sufficient for equality?",
          hi: "हर वयस्क का वोट बराबर है, फिर भी सफ़ाईकर्मी का बच्चा और मंत्री का बच्चा बहुत असमान दिन जीते हैं। बराबर वोट समानता के लिए ज़रूरी पर अपर्याप्त क्यों है?",
          mr: "प्रत्येक प्रौढाचे मत समान आहे, तरी सफाई कामगाराचे मूल आणि मंत्र्याचे मूल अजूनही फार असमान दिवस जगतात. समान मत समतेसाठी आवश्यक पण अपुरे का?",
        },
        choices: [
          {
            en: "The ballot equalises one day in five years; dignity, income, health and respect are decided on all the other days — law opens the door, society must walk through it",
            hi: "मतपत्र पाँच साल में एक दिन बराबर करता है; गरिमा, आय, स्वास्थ्य और सम्मान बाक़ी सब दिनों में तय होते हैं — क़ानून दरवाज़ा खोलता है, चलकर पार समाज को ही करना है",
            mr: "मतपत्रिका पाच वर्षांत एक दिवस समान करते; प्रतिष्ठा, उत्पन्न, आरोग्य आणि आदर बाकी साऱ्या दिवसांत ठरतात — कायदा दार उघडतो, चालून पार समाजानेच व्हायचे",
          },
          {
            en: "Votes are actually weighted by wealth in practice",
            hi: "व्यवहार में वोट असल में धन से तौले जाते हैं",
            mr: "व्यवहारात मते खरे तर धनाने तोलली जातात",
          },
          {
            en: "Equality is complete once elections are held",
            hi: "चुनाव हो जाएँ तो समानता पूरी हो जाती है",
            mr: "निवडणुका झाल्या की समता पूर्ण होते",
          },
          {
            en: "The vote is unnecessary where poverty exists",
            hi: "जहाँ ग़रीबी है वहाँ वोट अनावश्यक है",
            mr: "जिथे गरिबी आहे तिथे मत अनावश्यक",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The vote is equality's lever, not its finish line. It lets the sweeper's family choose who governs — real power, used once in years. But between elections, inequality works daily: in who gets clean water, whose child is taunted at school, who waits longest at the clinic. That is why the Constitution pairs the franchise with rights to dignity and why programmes like the midday meal exist — the ballot creates the pressure; the pressure must still be spent changing ordinary days.",
          hi: "वोट समानता का उत्तोलक है, अंतिम रेखा नहीं। वह सफ़ाईकर्मी के परिवार को शासक चुनने देता है — असली ताक़त, वर्षों में एक बार बरती हुई। पर चुनावों के बीच असमानता रोज़ काम करती है: किसे साफ़ पानी मिले, किसका बच्चा स्कूल में ताने सुने, कौन दवाख़ाने में सबसे देर खड़ा रहे। इसीलिए संविधान मताधिकार के साथ गरिमा के अधिकार जोड़ता है और मध्याह्न भोजन जैसी योजनाएँ हैं — मतपत्र दबाव पैदा करता है; वह दबाव आम दिनों को बदलने में ख़र्च होना बाक़ी रहता है।",
          mr: "मत ही समतेची तरफड आहे, अंतिम रेषा नव्हे. ते सफाई कामगाराच्या कुटुंबाला शासक निवडू देते — खरी ताकद, वर्षांतून एकदा वापरलेली. पण निवडणुकांच्या मध्ये विषमता रोज काम करते: कोणाला स्वच्छ पाणी मिळते, कोणाच्या मुलाला शाळेत टोमणे बसतात, कोण दवाखान्यात सर्वांत जास्त ताटकळते. म्हणूनच संविधान मताधिकारासोबत प्रतिष्ठेचे हक्क जोडते आणि माध्यान्ह भोजनासारख्या योजना आहेत — मतपत्रिका दबाव घडवते; तो दबाव सामान्य दिवस बदलण्यात खर्च व्हायचा उरतो.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Role of the Government in Health                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-7-government-health",
    subject: "CIVICS",
    classLevel: 7,
    chapter: {
      en: "Chapter 2 — Role of the Government in Health",
      hi: "अध्याय 2 — स्वास्थ्य में सरकार की भूमिका",
      mr: "प्रकरण 2 — आरोग्यात सरकारची भूमिका",
    },
    name: {
      en: "Role of the Government in Health",
      hi: "स्वास्थ्य में सरकार की भूमिका",
      mr: "आरोग्यात सरकारची भूमिका",
    },
    summary: {
      en: "Two doors to a doctor — the tax-paid chain of public care and the bill-backed private ward — with prevention as the cheapest medicine, Kerala's village experiment, and the debt trap one illness can spring.",
      hi: "डॉक्टर तक दो दरवाज़े — कर से चलती सरकारी देखभाल की कड़ी और बिल पर टिका निजी वार्ड — सबसे सस्ती दवा रोकथाम, केरल का ग्राम-प्रयोग, और वह क़र्ज़-जाल जो एक बीमारी बिछा देती है।",
      mr: "डॉक्टरपर्यंतची दोन दारे — करावर चालणारी सरकारी सेवेची साखळी आणि बिलावर उभा खासगी वॉर्ड — सर्वांत स्वस्त औषध प्रतिबंध, केरळचा गाव-प्रयोग, आणि एक आजार पसरवू शकतो तो कर्जाचा सापळा.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "public-health",
        name: {
          en: "The public health system",
          hi: "सार्वजनिक स्वास्थ्य-व्यवस्था",
          mr: "सार्वजनिक आरोग्य-व्यवस्था",
        },
        kind: "service",
        prompt: {
          en: "Which chain of government care — village health centre to district hospital — must serve everyone, free or nearly so?",
          hi: "सरकारी देखभाल की कौन-सी कड़ी — गाँव के स्वास्थ्य केंद्र से ज़िला अस्पताल तक — सबकी सेवा को बाध्य है, मुफ़्त या लगभग मुफ़्त?",
          mr: "सरकारी सेवेची कोणती साखळी — गावच्या आरोग्य केंद्रापासून जिल्हा रुग्णालयापर्यंत — साऱ्यांची सेवा करण्यास बांधील आहे, मोफत वा जवळजवळ मोफत?",
        },
        statement: {
          en: "The public health system runs from health centre to district hospital — care owed to every citizen, paid for by taxes, priced near zero.",
          hi: "सार्वजनिक स्वास्थ्य-व्यवस्था स्वास्थ्य केंद्र से ज़िला अस्पताल तक चलती है — हर नागरिक को देय देखभाल, करों से चुकाई, दाम लगभग शून्य।",
          mr: "सार्वजनिक आरोग्य-व्यवस्था आरोग्य केंद्रापासून जिल्हा रुग्णालयापर्यंत चालते — प्रत्येक नागरिकाला देय सेवा, करांतून भागवलेली, किंमत जवळजवळ शून्य.",
        },
        detail: {
          en: "It is the only system OBLIGED to reach every village — profit may skip the poor; the state may not.",
          hi: "यही एकमात्र व्यवस्था है जो हर गाँव तक पहुँचने को बाध्य है — मुनाफ़ा ग़रीब को छोड़ सकता है; राज्य नहीं छोड़ सकता।",
          mr: "हीच एकमेव व्यवस्था प्रत्येक गावापर्यंत पोहोचण्यास बांधील — नफा गरिबाला वगळू शकतो; राज्यसंस्था वगळू शकत नाही.",
        },
        extra: {
          en: "Its crowded corridors are a sign of need meeting price — where else can a day's wage buy a doctor?",
          hi: "उसके भरे गलियारे ज़रूरत और दाम के मिलन की निशानी हैं — और कहाँ दिन भर की मज़दूरी में डॉक्टर मिलता है?",
          mr: "तिचे गजबजलेले व्हरांडे गरज आणि किंमत भेटल्याची खूण — दिवसाच्या मजुरीत डॉक्टर आणखी कुठे मिळतो?",
        },
        pair: {
          left: {
            en: "The government's chain of care",
            hi: "सरकारी देखभाल की कड़ी",
            mr: "सरकारी सेवेची साखळी",
          },
          right: { en: "open to all, tax-paid", hi: "सबके लिए, कर से चुकाई", mr: "साऱ्यांसाठी, करांतून भागवलेली" },
        },
      },
      {
        id: "private-health",
        name: { en: "Private health care", hi: "निजी स्वास्थ्य-सेवा", mr: "खासगी आरोग्यसेवा" },
        kind: "service",
        prompt: {
          en: "Which clinics and hospitals run for profit — shorter queues, better rooms, and bills that can bury a poor family?",
          hi: "कौन-से दवाख़ाने और अस्पताल मुनाफ़े के लिए चलते हैं — छोटी क़तारें, बेहतर कमरे, और ऐसे बिल जो निर्धन परिवार को दबा दें?",
          mr: "कोणते दवाखाने आणि रुग्णालये नफ्यासाठी चालतात — लहान रांगा, चांगल्या खोल्या, आणि गरीब कुटुंबाला गाडू शकणारी बिले?",
        },
        statement: {
          en: "Private health care sells treatment — service can be excellent, and the bill decides who may enter.",
          hi: "निजी स्वास्थ्य-सेवा इलाज बेचती है — सेवा उम्दा हो सकती है, और बिल तय करता है कि भीतर कौन आए।",
          mr: "खासगी आरोग्यसेवा उपचार विकते — सेवा उत्तम असू शकते, आणि बिल ठरवते की आत कोण येणार.",
        },
        pair: {
          left: { en: "Care sold for profit", hi: "मुनाफ़े पर बिकती देखभाल", mr: "नफ्यावर विकली जाणारी सेवा" },
          right: { en: "bills that can bury", hi: "दबा देने वाले बिल", mr: "गाडू शकणारी बिले" },
        },
      },
      {
        id: "costa-rica",
        name: { en: "Costa Rica's choice", hi: "कोस्टा रिका का चुनाव", mr: "कोस्टा रिकाची निवड" },
        kind: "example",
        prompt: {
          en: "Which small country famously disbanded its army and spent the savings on health and education for all?",
          hi: "किस छोटे देश ने मशहूर तौर पर अपनी सेना भंग कर बचत सबके स्वास्थ्य और शिक्षा पर लगाई?",
          mr: "कोणत्या छोट्या देशाने प्रसिद्धपणे आपले सैन्य बरखास्त करून बचत साऱ्यांच्या आरोग्य-शिक्षणावर लावली?",
        },
        statement: {
          en: "Costa Rica spent its army's budget on clinics and schools — health treated as the country's first line of defence.",
          hi: "कोस्टा रिका ने सेना का बजट दवाख़ानों और स्कूलों पर लगाया — स्वास्थ्य को देश की पहली रक्षा-पंक्ति माना।",
          mr: "कोस्टा रिकाने सैन्याचे अंदाजपत्रक दवाखाने आणि शाळांवर लावले — आरोग्याला देशाची पहिली संरक्षण-फळी मानले.",
        },
        pair: {
          left: { en: "The army disbanded", hi: "भंग की गई सेना", mr: "बरखास्त केलेले सैन्य" },
          right: { en: "clinics bought instead", hi: "बदले में दवाख़ाने", mr: "बदल्यात दवाखाने" },
        },
      },
      {
        id: "prevention",
        name: { en: "Prevention", hi: "रोकथाम", mr: "प्रतिबंध" },
        kind: "approach",
        prompt: {
          en: "Safe water, clean surroundings, vaccination — which side of health care stops illness before it ever starts?",
          hi: "साफ़ पानी, स्वच्छ परिवेश, टीकाकरण — स्वास्थ्य-सेवा का कौन-सा पक्ष बीमारी को शुरू होने से पहले ही रोक देता है?",
          mr: "स्वच्छ पाणी, स्वच्छ परिसर, लसीकरण — आरोग्यसेवेची कोणती बाजू आजाराला सुरू होण्याआधीच थांबवते?",
        },
        statement: {
          en: "Prevention beats cure — safe water and vaccines close disease's front door instead of chasing it through the house.",
          hi: "रोकथाम इलाज से बड़ी है — साफ़ पानी और टीके बीमारी का मुख्य द्वार बंद करते हैं, उसे घर भर दौड़ाकर पकड़ने की जगह।",
          mr: "प्रतिबंध उपचाराहून मोठा — स्वच्छ पाणी आणि लसी आजाराचे मुख्य दार बंद करतात, त्याला घरभर पळवून धरण्याऐवजी.",
        },
        detail: {
          en: "Most stomach and mosquito-borne diseases trace back to water and waste — pipes and drains ARE health policy.",
          hi: "पेट और मच्छर-जनित अधिकांश रोग पानी और कचरे तक जाते हैं — नल और नालियाँ ही स्वास्थ्य-नीति हैं।",
          mr: "पोटाचे आणि डास-जनित बहुतेक रोग पाणी आणि कचऱ्यापर्यंत जातात — नळ आणि गटारे हीच आरोग्य-नीती.",
        },
        extra: {
          en: "A vaccinated village spends less on hospitals than an unvaccinated one ever manages to save.",
          hi: "टीकाकृत गाँव अस्पतालों पर उससे कम ख़र्चता है जितना बिना टीके वाला कभी बचा पाता है।",
          mr: "लसीकरण झालेले गाव रुग्णालयांवर तितके कमी खर्चते जितके लसीविनाचे कधी वाचवू शकते.",
        },
        pair: {
          left: { en: "Illness stopped early", hi: "पहले ही रुकी बीमारी", mr: "आधीच थांबवलेला आजार" },
          right: { en: "cheaper than any cure", hi: "हर इलाज से सस्ती", mr: "कोणत्याही उपचाराहून स्वस्त" },
        },
      },
      {
        id: "kerala",
        name: {
          en: "Kerala's health experiment",
          hi: "केरल का स्वास्थ्य-प्रयोग",
          mr: "केरळचा आरोग्य-प्रयोग",
        },
        kind: "example",
        prompt: {
          en: "Which state, in 1996, handed panchayats money and authority over local clinics, water supply and schools?",
          hi: "किस राज्य ने 1996 में पंचायतों को स्थानीय दवाख़ानों, जल-आपूर्ति और स्कूलों पर पैसा और अधिकार सौंपे?",
          mr: "कोणत्या राज्याने 1996 मध्ये पंचायतींना स्थानिक दवाखाने, पाणीपुरवठा आणि शाळांवर पैसा आणि अधिकार सोपवले?",
        },
        statement: {
          en: "Kerala pushed health money and decisions down to panchayats — clinics answerable to the very villages they serve.",
          hi: "केरल ने स्वास्थ्य का पैसा और फ़ैसले पंचायतों तक उतारे — दवाख़ाने उन्हीं गाँवों को जवाबदेह जिनकी वे सेवा करते हैं।",
          mr: "केरळने आरोग्याचा पैसा आणि निर्णय पंचायतींपर्यंत उतरवले — दवाखाने ज्या गावांची सेवा करतात त्यांनाच उत्तरदायी.",
        },
        pair: {
          left: {
            en: "Money moved to the village",
            hi: "गाँव तक पहुँचा पैसा",
            mr: "गावापर्यंत गेलेला पैसा",
          },
          right: {
            en: "clinics answerable nearby",
            hi: "पास ही जवाबदेह दवाख़ाने",
            mr: "जवळच उत्तरदायी दवाखाने",
          },
        },
      },
      {
        id: "debt-trap",
        name: { en: "The medical debt trap", hi: "इलाज का क़र्ज़-जाल", mr: "उपचाराचा कर्ज-सापळा" },
        kind: "problem",
        prompt: {
          en: "For a poor family, one illness can mean borrowed money, sold land and children out of school. What is this spiral called?",
          hi: "निर्धन परिवार के लिए एक बीमारी का अर्थ हो सकता है उधार, बिकी ज़मीन और स्कूल से हटे बच्चे। इस भँवर का नाम क्या है?",
          mr: "गरीब कुटुंबासाठी एका आजाराचा अर्थ असू शकतो उसने पैसे, विकलेली जमीन आणि शाळेबाहेरची मुले. या भोवऱ्याचे नाव काय?",
        },
        statement: {
          en: "The medical debt trap turns sickness into poverty — treatment bought at the price of land, schooling and years of repayment.",
          hi: "इलाज का क़र्ज़-जाल बीमारी को ग़रीबी बना देता है — ज़मीन, पढ़ाई और बरसों की अदायगी के दाम पर ख़रीदा इलाज।",
          mr: "उपचाराचा कर्ज-सापळा आजाराला गरिबी करतो — जमीन, शिक्षण आणि वर्षांच्या फेडीच्या किमतीवर घेतलेला उपचार.",
        },
        pair: {
          left: {
            en: "One illness, years of debt",
            hi: "एक बीमारी, बरसों का क़र्ज़",
            mr: "एक आजार, वर्षांचे कर्ज",
          },
          right: {
            en: "sickness turned poverty",
            hi: "ग़रीबी बनी बीमारी",
            mr: "गरिबी झालेला आजार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the door to what stands behind it: A-the Primary Health Centre, B-the private hospital, C-the vaccination drive. Which trio is right?",
          hi: "दरवाज़े को उसके पीछे खड़ी चीज़ से मिलाइए: अ-प्राथमिक स्वास्थ्य केंद्र, ब-निजी अस्पताल, स-टीकाकरण अभियान। कौन-सी तिकड़ी सही है?",
          mr: "दाराला त्यामागे उभ्या गोष्टीशी जुळवा: अ-प्राथमिक आरोग्य केंद्र, ब-खासगी रुग्णालय, क-लसीकरण मोहीम. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: tax-paid care for all · B: care priced by the bill · C: illness stopped before it starts",
            hi: "अ: कर से चुकाई सबकी देखभाल · ब: बिल से तुला इलाज · स: शुरू होने से पहले रुकी बीमारी",
            mr: "अ: करांतून भागवलेली साऱ्यांची सेवा · ब: बिलाने तोललेला उपचार · क: सुरू होण्याआधी थांबवलेला आजार",
          },
          {
            en: "A: care priced by the bill · B: illness stopped early · C: tax-paid care",
            hi: "अ: बिल से तुला इलाज · ब: पहले रुकी बीमारी · स: कर से चुकाई देखभाल",
            mr: "अ: बिलाने तोललेला उपचार · ब: आधी थांबलेला आजार · क: करांतून सेवा",
          },
          {
            en: "A: illness stopped early · B: tax-paid care · C: care priced by the bill",
            hi: "अ: पहले रुकी बीमारी · ब: कर से चुकाई देखभाल · स: बिल से तुला इलाज",
            mr: "अ: आधी थांबलेला आजार · ब: करांतून सेवा · क: बिलाने तोललेला उपचार",
          },
          {
            en: "All three doors lead to identical care for identical prices",
            hi: "तीनों दरवाज़े एक-से दाम पर एक-सी देखभाल तक जाते हैं",
            mr: "तिन्ही दारे सारख्याच किमतीत सारख्याच सेवेकडे जातात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The PHC is the public promise — anyone may enter, taxes have already paid. The private hospital is a shop — excellent, perhaps, for those who can pay its bill. The vaccination drive is neither shop nor ward: it is health bought wholesale, before anyone falls ill. A country needs all three sorted correctly — and confuses them at its poor's expense.",
          hi: "प्राथमिक स्वास्थ्य केंद्र सार्वजनिक वादा है — कोई भी आए, कर पहले चुका चुके। निजी अस्पताल दुकान है — शायद उम्दा, उनके लिए जो बिल दे सकें। टीकाकरण अभियान न दुकान है न वार्ड: वह थोक में ख़रीदा स्वास्थ्य है, किसी के बीमार पड़ने से पहले। देश को तीनों की सही छँटाई चाहिए — गड्डमड्ड की क़ीमत उसके ग़रीब चुकाते हैं।",
          mr: "प्राथमिक आरोग्य केंद्र हे सार्वजनिक वचन — कोणीही यावे, कर आधीच भरले आहेत. खासगी रुग्णालय हे दुकान — कदाचित उत्तम, बिल देऊ शकणाऱ्यांसाठी. लसीकरण मोहीम दुकानही नाही आणि वॉर्डही नाही: ते कोणी आजारी पडण्याआधी घाऊक विकत घेतलेले आरोग्य. देशाला तिन्हींची योग्य निवड हवी — गल्लत केल्याची किंमत त्याचे गरीब देतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A country boasts world-class private hospitals, yet judges of its health look instead at the farthest village's clinic. Why is a nation's health measured at its poorest door, not its finest?",
          hi: "एक देश विश्व-स्तरीय निजी अस्पतालों पर गर्व करता है, फिर भी उसके स्वास्थ्य के परखने वाले सबसे दूर के गाँव का दवाख़ाना देखते हैं। राष्ट्र का स्वास्थ्य उसके सबसे ग़रीब दरवाज़े पर क्यों नपता है, सबसे शानदार पर नहीं?",
          mr: "एक देश जागतिक दर्जाच्या खासगी रुग्णालयांचा अभिमान बाळगतो, तरी त्याच्या आरोग्याचे परीक्षक सर्वांत दूरच्या गावचा दवाखाना पाहतात. राष्ट्राचे आरोग्य त्याच्या सर्वांत गरीब दारावर का मोजले जाते, सर्वांत भव्य दारावर नाही?",
        },
        choices: [
          {
            en: "Because disease and health are collective: epidemics start where care is absent, and an average hides the many outside the marble lobby — the chain is as strong as its weakest clinic",
            hi: "क्योंकि रोग और स्वास्थ्य सामूहिक हैं: महामारियाँ वहीं से उठती हैं जहाँ देखभाल नदारद है, और औसत संगमरमरी लॉबी से बाहर की भीड़ को छिपा लेता है — कड़ी उतनी ही मज़बूत जितना उसका सबसे कमज़ोर दवाख़ाना",
            mr: "कारण रोग आणि आरोग्य सामूहिक आहेत: साथी तिथूनच उठतात जिथे सेवा नाही, आणि सरासरी संगमरवरी लॉबीबाहेरच्या गर्दीला लपवते — साखळी तितकीच बळकट जितका तिचा सर्वांत कमजोर दवाखाना",
          },
          {
            en: "Because fine hospitals are always badly run",
            hi: "क्योंकि शानदार अस्पताल हमेशा बुरी तरह चलते हैं",
            mr: "कारण भव्य रुग्णालये नेहमी वाईट चालतात",
          },
          {
            en: "Because villages dislike hospitals of any kind",
            hi: "क्योंकि गाँवों को हर तरह के अस्पताल नापसंद हैं",
            mr: "कारण गावांना कोणतीही रुग्णालये आवडत नाहीत",
          },
          {
            en: "Because health cannot be measured at all",
            hi: "क्योंकि स्वास्थ्य नापा ही नहीं जा सकता",
            mr: "कारण आरोग्य मोजताच येत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Health is the one wealth that refuses to stay private. Germs do not read bank statements: cholera bred in an unserved slum reaches the gated colony by water and by bus. And numbers averaged over a nation flatter it — one marble hospital and a hundred bare clinics can 'average' respectable. So honest measures go to the margin: infant deaths in the last village, the drug stock in the farthest PHC. A country is as healthy as the person its system reaches last.",
          hi: "स्वास्थ्य वह एकमात्र धन है जो निजी रहने से इनकार करता है। कीटाणु बैंक-खाते नहीं पढ़ते: बिना सेवा की बस्ती में पला हैज़ा पानी और बस से बंद कॉलोनी तक पहुँचता है। और देश भर के औसत आँकड़े चापलूसी करते हैं — एक संगमरमरी अस्पताल और सौ ख़ाली दवाख़ाने मिलकर 'सम्मानजनक' औसत बना लेते हैं। इसलिए ईमानदार मापें हाशिये पर जाती हैं: आख़िरी गाँव में शिशु-मृत्यु, सबसे दूर के केंद्र का दवा-भंडार। देश उतना ही स्वस्थ है जितना वह व्यक्ति जिस तक उसकी व्यवस्था सबसे बाद में पहुँचती है।",
          mr: "आरोग्य ही एकमेव संपत्ती जी खासगी राहायला नकार देते. जंतू बँक-खाती वाचत नाहीत: सेवा नसलेल्या वस्तीत पोसलेला कॉलरा पाण्याने आणि बसने बंद कॉलनीपर्यंत पोहोचतो. आणि देशभराची सरासरी आकडेवारी खुशामत करते — एक संगमरवरी रुग्णालय आणि शंभर रिकामे दवाखाने मिळून 'सन्माननीय' सरासरी काढतात. म्हणून प्रामाणिक मापे कडेला जातात: शेवटच्या गावातले बालमृत्यू, सर्वांत दूरच्या केंद्रातला औषधसाठा. देश तितकाच निरोगी जितका तो माणूस ज्याच्यापर्यंत त्याची व्यवस्था सर्वांत शेवटी पोहोचते.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — How the State Government Works                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-7-state-government",
    subject: "CIVICS",
    classLevel: 7,
    chapter: {
      en: "Chapter 3 — How the State Government Works",
      hi: "अध्याय 3 — राज्य सरकार कैसे काम करती है",
      mr: "प्रकरण 3 — राज्य सरकार कशी काम करते",
    },
    name: {
      en: "How the State Government Works",
      hi: "राज्य सरकार कैसे काम करती है",
      mr: "राज्य सरकार कशी काम करते",
    },
    summary: {
      en: "From ballot to working department: the MLA's seat, the majority that makes a government, the Chief Minister's desk, the opposition's questions — and decisions given feet by officials.",
      hi: "मतपत्र से चलते विभाग तक: विधायक की सीट, सरकार बनाता बहुमत, मुख्यमंत्री की मेज़, विपक्ष के सवाल — और अफ़सरों के पैरों से चलते फ़ैसले।",
      mr: "मतपत्रिकेपासून चालत्या खात्यापर्यंत: आमदाराची जागा, सरकार घडवणारे बहुमत, मुख्यमंत्र्यांचे टेबल, विरोधकांचे प्रश्न — आणि अधिकाऱ्यांच्या पायांनी चालणारे निर्णय.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "mla",
        name: { en: "The MLA", hi: "विधायक (एमएलए)", mr: "आमदार" },
        kind: "office",
        prompt: {
          en: "Which representative, elected from one constituency, sits and votes in the state's Legislative Assembly?",
          hi: "एक निर्वाचन-क्षेत्र से चुना कौन-सा प्रतिनिधि राज्य की विधान सभा में बैठता और मत देता है?",
          mr: "एका मतदारसंघातून निवडलेला कोणता प्रतिनिधी राज्याच्या विधानसभेत बसतो आणि मत देतो?",
        },
        statement: {
          en: "An MLA is a constituency's voice in the Vidhan Sabha — elected directly, answerable again at the next election.",
          hi: "विधायक विधान सभा में निर्वाचन-क्षेत्र की आवाज़ है — सीधे चुना हुआ, अगले चुनाव में फिर जवाबदेह।",
          mr: "आमदार म्हणजे विधानसभेतला मतदारसंघाचा आवाज — थेट निवडलेला, पुढच्या निवडणुकीत पुन्हा उत्तरदायी.",
        },
        pair: {
          left: {
            en: "The constituency's voice",
            hi: "निर्वाचन-क्षेत्र की आवाज़",
            mr: "मतदारसंघाचा आवाज",
          },
          right: {
            en: "a seat in the Assembly",
            hi: "विधान सभा की एक सीट",
            mr: "विधानसभेतली एक जागा",
          },
        },
      },
      {
        id: "majority",
        name: { en: "The majority", hi: "बहुमत", mr: "बहुमत" },
        kind: "rule",
        prompt: {
          en: "Which count — more than half the Assembly's seats — decides which party forms the government and names the Chief Minister?",
          hi: "कौन-सी गिनती — विधान सभा की आधी से अधिक सीटें — तय करती है कि कौन-सा दल सरकार बनाए और मुख्यमंत्री दे?",
          mr: "कोणती मोजणी — विधानसभेच्या निम्म्याहून अधिक जागा — ठरवते की कोणता पक्ष सरकार बनवणार आणि मुख्यमंत्री देणार?",
        },
        statement: {
          en: "The majority makes the government — the party or coalition crossing half the seats earns the right to govern and to choose the Chief Minister.",
          hi: "बहुमत सरकार बनाता है — आधी सीटें पार करता दल या गठबंधन शासन करने और मुख्यमंत्री चुनने का अधिकार पाता है।",
          mr: "बहुमत सरकार घडवते — निम्म्या जागा ओलांडणारा पक्ष वा आघाडी राज्य करण्याचा आणि मुख्यमंत्री निवडण्याचा अधिकार मिळवते.",
        },
        pair: {
          left: {
            en: "More than half the seats",
            hi: "आधी से अधिक सीटें",
            mr: "निम्म्याहून अधिक जागा",
          },
          right: { en: "the right to govern", hi: "शासन का अधिकार", mr: "राज्य करण्याचा अधिकार" },
        },
      },
      {
        id: "chief-minister",
        name: { en: "The Chief Minister", hi: "मुख्यमंत्री", mr: "मुख्यमंत्री" },
        kind: "office",
        prompt: {
          en: "Which leader heads the state's council of ministers, steering departments from health to roads?",
          hi: "कौन-सा नेता राज्य के मंत्रिपरिषद का मुखिया है, स्वास्थ्य से सड़कों तक विभागों को हाँकता हुआ?",
          mr: "कोणता नेता राज्याच्या मंत्रिमंडळाचा प्रमुख आहे, आरोग्यापासून रस्त्यांपर्यंत खाती हाकणारा?",
        },
        statement: {
          en: "The Chief Minister leads the state's executive — ministers and their departments answer through the CM to the Assembly.",
          hi: "मुख्यमंत्री राज्य की कार्यपालिका का नेता है — मंत्री और उनके विभाग मुख्यमंत्री के ज़रिए विधान सभा को जवाब देते हैं।",
          mr: "मुख्यमंत्री राज्याच्या कार्यकारी मंडळाचा नेता — मंत्री आणि त्यांची खाती मुख्यमंत्र्यांमार्फत विधानसभेला उत्तर देतात.",
        },
        pair: {
          left: {
            en: "The state's chief executive",
            hi: "राज्य की कार्यपालिका का मुखिया",
            mr: "राज्याच्या कार्यकारिणीचा प्रमुख",
          },
          right: {
            en: "departments answering upward",
            hi: "ऊपर को जवाब देते विभाग",
            mr: "वर उत्तर देणारी खाती",
          },
        },
      },
      {
        id: "opposition",
        name: { en: "The opposition", hi: "विपक्ष", mr: "विरोधी पक्ष" },
        kind: "office",
        prompt: {
          en: "Which members, not of the ruling side, question ministers and expose lapses on the Assembly floor?",
          hi: "सत्ता-पक्ष से बाहर के कौन-से सदस्य सदन में मंत्रियों से सवाल करते और चूकें उजागर करते हैं?",
          mr: "सत्ताधारी बाजूबाहेरचे कोणते सदस्य सभागृहात मंत्र्यांना प्रश्न विचारतात आणि चुका उघड करतात?",
        },
        statement: {
          en: "The opposition's job is scrutiny — questions, debates and walkouts that keep the ruling side explaining itself in public.",
          hi: "विपक्ष का काम है जाँच-परख — सवाल, बहसें और बहिर्गमन, जो सत्ता-पक्ष को सबके सामने सफ़ाई देते रहने को विवश रखें।",
          mr: "विरोधकांचे काम छाननी — प्रश्न, चर्चा आणि सभात्याग, जे सत्ताधारी बाजूला जाहीरपणे स्पष्टीकरण देत ठेवतात.",
        },
        detail: {
          en: "Question Hour turns ministers into answerers — the Assembly's daily audit, on the record.",
          hi: "प्रश्नकाल मंत्रियों को उत्तरदाता बना देता है — सदन की रोज़ की, अभिलेखबद्ध लेखा-जाँच।",
          mr: "प्रश्नोत्तराचा तास मंत्र्यांना उत्तरदाते करतो — सभागृहाची रोजची, नोंदीवरची तपासणी.",
        },
        extra: {
          en: "A weak opposition is the ruling party's holiday — and the public's loss.",
          hi: "कमज़ोर विपक्ष सत्ता-दल की छुट्टी है — और जनता का घाटा।",
          mr: "दुबळा विरोधी पक्ष म्हणजे सत्ताधारी पक्षाची सुट्टी — आणि जनतेचा तोटा.",
        },
        pair: {
          left: { en: "The questioning benches", hi: "सवाल करती बेंचें", mr: "प्रश्न विचारणारी बाके" },
          right: {
            en: "power kept explaining",
            hi: "सफ़ाई देती रहती सत्ता",
            mr: "स्पष्टीकरण देत राहणारी सत्ता",
          },
        },
      },
      {
        id: "departments",
        name: {
          en: "The government departments",
          hi: "सरकारी विभाग",
          mr: "सरकारी खाती",
        },
        kind: "machinery",
        prompt: {
          en: "After the Assembly decides, which machinery of officers and staff actually digs the drains and staffs the clinics?",
          hi: "विधान सभा के फ़ैसले के बाद अफ़सरों-कर्मचारियों की कौन-सी मशीनरी सचमुच नालियाँ खोदती और दवाख़ानों में लोग बिठाती है?",
          mr: "विधानसभेच्या निर्णयानंतर अधिकारी-कर्मचाऱ्यांची कोणती यंत्रणा खरोखर गटारे खणते आणि दवाखान्यांत माणसे नेमते?",
        },
        statement: {
          en: "Government departments execute — decisions walk out of the Assembly on officials' feet, or they never walk at all.",
          hi: "सरकारी विभाग अमल करते हैं — फ़ैसले अफ़सरों के पैरों पर चलकर सदन से बाहर निकलते हैं, वरना निकलते ही नहीं।",
          mr: "सरकारी खाती अंमलबजावणी करतात — निर्णय अधिकाऱ्यांच्या पायांनी सभागृहाबाहेर चालतात, नाहीतर चालतच नाहीत.",
        },
        pair: {
          left: { en: "Decisions given feet", hi: "पैर पाए फ़ैसले", mr: "पाय मिळालेले निर्णय" },
          right: { en: "officials executing", hi: "अमल करते अफ़सर", mr: "अंमल करणारे अधिकारी" },
        },
      },
      {
        id: "accountability",
        name: { en: "Public accountability", hi: "सार्वजनिक जवाबदेही", mr: "सार्वजनिक उत्तरदायित्व" },
        kind: "rule",
        prompt: {
          en: "When an epidemic strikes, MLAs demand answers, papers report and people protest. What is this holding-to-answer called?",
          hi: "महामारी फूटे तो विधायक जवाब माँगते हैं, अख़बार छापते हैं, लोग प्रदर्शन करते हैं। इस जवाब-तलबी का नाम क्या है?",
          mr: "साथ पसरली की आमदार जाब विचारतात, वृत्तपत्रे छापतात, लोक निदर्शने करतात. या जाब विचारण्याचे नाव काय?",
        },
        statement: {
          en: "Public accountability makes power answer — in the Assembly, in the press and finally at the polls.",
          hi: "सार्वजनिक जवाबदेही सत्ता से जवाब दिलवाती है — सदन में, अख़बार में और अंततः मतदान में।",
          mr: "सार्वजनिक उत्तरदायित्व सत्तेकडून उत्तर घेते — सभागृहात, वृत्तपत्रांत आणि अखेर मतदानात.",
        },
        pair: {
          left: { en: "Power made to answer", hi: "जवाब देती सत्ता", mr: "उत्तर देणारी सत्ता" },
          right: {
            en: "Assembly, press and polls",
            hi: "सदन, अख़बार और मतदान",
            mr: "सभागृह, वृत्तपत्रे आणि मतदान",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put the making of a state government in order. Which sequence is right?",
          hi: "राज्य सरकार बनने के चरण क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "राज्य सरकार बनण्याचे टप्पे क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Elections held → majority counted → Chief Minister sworn in → ministers given departments → departments act",
            hi: "चुनाव हुए → बहुमत गिना गया → मुख्यमंत्री ने शपथ ली → मंत्रियों को विभाग मिले → विभाग काम करते हैं",
            mr: "निवडणुका झाल्या → बहुमत मोजले → मुख्यमंत्र्यांनी शपथ घेतली → मंत्र्यांना खाती मिळाली → खाती काम करतात",
          },
          {
            en: "Chief Minister sworn in → elections held → departments act → majority counted",
            hi: "मुख्यमंत्री की शपथ → चुनाव → विभागों का काम → बहुमत की गिनती",
            mr: "मुख्यमंत्र्यांची शपथ → निवडणुका → खात्यांचे काम → बहुमताची मोजणी",
          },
          {
            en: "Majority counted → elections held → ministers appointed → Chief Minister sworn in",
            hi: "बहुमत की गिनती → चुनाव → मंत्रियों की नियुक्ति → मुख्यमंत्री की शपथ",
            mr: "बहुमताची मोजणी → निवडणुका → मंत्र्यांची नेमणूक → मुख्यमंत्र्यांची शपथ",
          },
          {
            en: "Departments act → ministers appointed → elections held → majority counted",
            hi: "विभागों का काम → मंत्रियों की नियुक्ति → चुनाव → बहुमत की गिनती",
            mr: "खात्यांचे काम → मंत्र्यांची नेमणूक → निवडणुका → बहुमताची मोजणी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Authority flows downhill from the voter: first the election distributes seats, then the seat-count reveals a majority, the majority's leader takes oath as Chief Minister, the CM distributes portfolios — and only then do departments carry decisions into streets and clinics. Each step borrows its legitimacy from the one before; skip a step and the chain of consent snaps.",
          hi: "अधिकार मतदाता से ढलान पर उतरता है: पहले चुनाव सीटें बाँटता है, फिर सीट-गिनती बहुमत दिखाती है, बहुमत का नेता मुख्यमंत्री की शपथ लेता है, मुख्यमंत्री विभाग बाँटते हैं — और तभी विभाग फ़ैसलों को गलियों और दवाख़ानों तक ले जाते हैं। हर चरण अपनी वैधता पिछले से उधार लेता है; एक चरण लाँघिए और सहमति की कड़ी टूट जाती है।",
          mr: "अधिकार मतदाराकडून उताराने उतरतो: आधी निवडणूक जागा वाटते, मग जागा-मोजणी बहुमत दाखवते, बहुमताचा नेता मुख्यमंत्रिपदाची शपथ घेतो, मुख्यमंत्री खाती वाटतात — आणि मगच खाती निर्णय गल्ल्या आणि दवाखान्यांपर्यंत नेतात. प्रत्येक टप्पा आपली वैधता आधीच्याकडून उसनी घेतो; एक टप्पा ओलांडा आणि संमतीची साखळी तुटते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A minister protests: 'The people elected us — why must I keep answering the opposition's questions for five whole years?' What is wrong with governing quietly between elections?",
          hi: "एक मंत्री एतराज़ करते हैं: 'जनता ने हमें चुना — मैं पाँच साल विपक्ष के सवालों के जवाब क्यों देता रहूँ?' चुनावों के बीच चुपचाप शासन में ग़लत क्या है?",
          mr: "एक मंत्री आक्षेप घेतात: 'जनतेने आम्हाला निवडले — मी पाच वर्षे विरोधकांच्या प्रश्नांची उत्तरे का देत राहू?' निवडणुकांच्या मध्ये गुपचूप राज्य करण्यात चूक काय?",
        },
        choices: [
          {
            en: "Elections grant power on condition of continuous account: the vote hires a government, and Question Hour, debates and the press are the running audit that stops five years of unchecked rule",
            hi: "चुनाव सत्ता निरंतर हिसाब की शर्त पर देते हैं: वोट सरकार को नौकरी पर रखता है, और प्रश्नकाल, बहसें व अख़बार वह चालू लेखा-जाँच हैं जो पाँच साल की बेरोक हुकूमत को रोकती है",
            mr: "निवडणुका सतत हिशेबाच्या अटीवर सत्ता देतात: मत सरकारला कामावर ठेवते, आणि प्रश्नोत्तराचा तास, चर्चा व वृत्तपत्रे ही ती चालू तपासणी जी पाच वर्षांची बेलगाम सत्ता रोखते",
          },
          {
            en: "Nothing — winners should indeed govern unquestioned till the next vote",
            hi: "कुछ नहीं — विजेताओं को सचमुच अगले चुनाव तक बिना सवाल शासन करना चाहिए",
            mr: "काहीच नाही — विजेत्यांनी खरेच पुढच्या मतदानापर्यंत विनाप्रश्न राज्य करावे",
          },
          {
            en: "The opposition's questions are mere entertainment for the press",
            hi: "विपक्ष के सवाल अख़बारों का मनोरंजन भर हैं",
            mr: "विरोधकांचे प्रश्न वृत्तपत्रांची करमणूकच",
          },
          {
            en: "Ministers need answer only the Chief Minister, never the Assembly",
            hi: "मंत्री केवल मुख्यमंत्री को जवाबदेह हैं, सदन को कभी नहीं",
            mr: "मंत्री फक्त मुख्यमंत्र्यांना उत्तरदायी, सभागृहाला कधीच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A vote is a hiring, not a coronation. The electorate cannot reconvene daily, so it stations proxies: opposition MLAs to ask on its behalf, the press to publish the answers, the record to remember them. Remove the running audit and the next election arrives too late — money mis-spent and rights eroded for five years cannot be voted back. Democracy is not the act of choosing rulers; it is the arrangement by which the chosen never stop being answerable.",
          hi: "वोट नियुक्ति है, राजतिलक नहीं। मतदाता रोज़ नहीं जुट सकते, इसलिए वे प्रतिनिधि तैनात करते हैं: उनकी ओर से पूछने को विपक्षी विधायक, जवाब छापने को अख़बार, याद रखने को अभिलेख। चालू लेखा-जाँच हटा दीजिए तो अगला चुनाव बहुत देर से आता है — पाँच साल का लुटा पैसा और घिसे अधिकार वोट से वापस नहीं आते। लोकतंत्र शासक चुनने की क्रिया नहीं; वह बंदोबस्त है जिसमें चुने हुए जवाबदेह होना कभी बंद नहीं करते।",
          mr: "मत म्हणजे नेमणूक, राज्याभिषेक नव्हे. मतदार रोज जमू शकत नाहीत, म्हणून ते प्रतिनिधी नेमतात: त्यांच्या वतीने विचारायला विरोधी आमदार, उत्तरे छापायला वृत्तपत्रे, लक्षात ठेवायला नोंदी. चालू तपासणी काढा आणि पुढची निवडणूक फार उशिरा येते — पाच वर्षांचा उधळलेला पैसा आणि झिजलेले हक्क मताने परत येत नाहीत. लोकशाही म्हणजे शासक निवडण्याची क्रिया नव्हे; निवडलेले उत्तरदायी असणे कधी थांबवत नाहीत ही व्यवस्था.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Understanding Media (who speaks, who pays, who is silent)   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-7-understanding-media",
    subject: "CIVICS",
    classLevel: 7,
    chapter: {
      en: "Chapter 6 — Understanding Media",
      hi: "अध्याय 6 — संचार माध्यमों को समझना",
      mr: "प्रकरण 6 — प्रसारमाध्यमे समजून घेणे",
    },
    name: {
      en: "Understanding Media",
      hi: "संचार माध्यमों को समझना",
      mr: "प्रसारमाध्यमे समजून घेणे",
    },
    summary: {
      en: "One message, a million ears — and behind it the advertiser's bill, the chosen and the dropped story, the balanced report, the censor's silence, and the local paper that covers the broken handpump.",
      hi: "एक संदेश, लाख कान — और उसके पीछे विज्ञापनदाता का बिल, चुनी और गिराई गई ख़बर, संतुलित रिपोर्ट, सेंसर की चुप्पी, और टूटे हैंडपंप की ख़बर लेता स्थानीय अख़बार।",
      mr: "एक संदेश, लाख कान — आणि त्यामागे जाहिरातदाराचे बिल, निवडलेली आणि गाळलेली बातमी, संतुलित वार्तांकन, सेन्सॉरची शांतता, आणि मोडक्या हातपंपाची बातमी घेणारे स्थानिक वृत्तपत्र.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "mass-media",
        name: { en: "Mass media", hi: "जनसंचार माध्यम", mr: "जनमाध्यमे" },
        kind: "channel",
        prompt: {
          en: "TV, radio and newspapers reach lakhs of people at once. What is this many-at-once communication called?",
          hi: "टीवी, रेडियो और अख़बार एक साथ लाखों तक पहुँचते हैं। इस एक-साथ-अनेक संचार का नाम क्या है?",
          mr: "टीव्ही, रेडिओ आणि वृत्तपत्रे एकाच वेळी लाखोंपर्यंत पोहोचतात. या एकाच-वेळी-अनेक संवादाचे नाव काय?",
        },
        statement: {
          en: "Mass media speaks to lakhs at once — one message, a million ears, and the power that comes with the ratio.",
          hi: "जनसंचार माध्यम लाखों से एक साथ बोलते हैं — एक संदेश, लाख कान, और उस अनुपात के साथ आती ताक़त।",
          mr: "जनमाध्यमे लाखोंशी एकदम बोलतात — एक संदेश, लाख कान, आणि त्या प्रमाणासोबत येणारी ताकद.",
        },
        pair: {
          left: { en: "One message, lakh ears", hi: "एक संदेश, लाख कान", mr: "एक संदेश, लाख कान" },
          right: { en: "TV, print and radio", hi: "टीवी, अख़बार और रेडियो", mr: "टीव्ही, छापील आणि रेडिओ" },
        },
      },
      {
        id: "ad-revenue",
        name: { en: "Advertising revenue", hi: "विज्ञापन से आय", mr: "जाहिरातींचे उत्पन्न" },
        kind: "money",
        prompt: {
          en: "Which income pays for most 'free' news — and quietly ties channels to the sellers who buy their time?",
          hi: "कौन-सी आय अधिकांश 'मुफ़्त' ख़बरों का ख़र्च उठाती है — और चैनलों को चुपचाप उन विक्रेताओं से बाँधती है जो उनका समय ख़रीदते हैं?",
          mr: "कोणते उत्पन्न बहुतेक 'मोफत' बातम्यांचा खर्च उचलते — आणि वाहिन्यांना गुपचूप त्यांचा वेळ विकत घेणाऱ्या विक्रेत्यांशी बांधते?",
        },
        statement: {
          en: "Advertising pays the media's bills — and an outlet careful of its advertisers grows careful with certain truths.",
          hi: "विज्ञापन माध्यमों के बिल चुकाता है — और जो माध्यम अपने विज्ञापनदाताओं का ख़याल रखता है, वह कुछ सच्चाइयों का भी 'ख़याल' रखने लगता है।",
          mr: "जाहिराती माध्यमांची बिले भरतात — आणि आपल्या जाहिरातदारांची काळजी घेणारे माध्यम काही सत्यांचीही 'काळजी' घेऊ लागते.",
        },
        detail: {
          en: "A newspaper that costs more to print than its cover price is being paid for by someone — usually the advertisements inside it.",
          hi: "जिस अख़बार की छपाई उसके दाम से महँगी है, उसका ख़र्च कोई और उठा रहा है — प्रायः उसके भीतर के विज्ञापन।",
          mr: "ज्या वृत्तपत्राची छपाई त्याच्या किमतीहून महाग आहे, त्याचा खर्च कोणी दुसरे उचलते आहे — बहुधा त्याच्या आतल्या जाहिराती.",
        },
        extra: {
          en: "A useful habit: notice what a channel will NOT say about its biggest advertiser.",
          hi: "काम की आदत: ग़ौर कीजिए कि चैनल अपने सबसे बड़े विज्ञापनदाता के बारे में क्या नहीं कहता।",
          mr: "उपयोगी सवय: वाहिनी आपल्या सर्वांत मोठ्या जाहिरातदाराबद्दल काय बोलत नाही हे पाहा.",
        },
        pair: {
          left: { en: "The ads that pay", hi: "ख़र्च उठाते विज्ञापन", mr: "खर्च उचलणाऱ्या जाहिराती" },
          right: {
            en: "bills settled, strings attached",
            hi: "बिल चुकता, डोर बँधी",
            mr: "बिले फिटली, दोर बांधले",
          },
        },
      },
      {
        id: "agenda",
        name: { en: "The media's agenda", hi: "माध्यमों का एजेंडा", mr: "माध्यमांचा अजेंडा" },
        kind: "power",
        prompt: {
          en: "By choosing which stories lead and which vanish, the media exercises which quiet power over public attention?",
          hi: "कौन-सी ख़बर आगे और कौन-सी ग़ायब — यह चुनकर माध्यम जन-ध्यान पर कौन-सी ख़ामोश ताक़त बरतते हैं?",
          mr: "कोणती बातमी पुढे आणि कोणती गायब — हे निवडून माध्यमे लोकांच्या लक्षावर कोणती मूक ताकद वापरतात?",
        },
        statement: {
          en: "The media sets the agenda — it decides what the country talks about by deciding what the country sees.",
          hi: "माध्यम एजेंडा तय करते हैं — देश क्या देखे यह तय करके वे तय करते हैं कि देश किस पर बात करे।",
          mr: "माध्यमे अजेंडा ठरवतात — देशाने काय पाहावे हे ठरवून ती ठरवतात की देशाने कशावर बोलावे.",
        },
        pair: {
          left: {
            en: "Stories chosen and dropped",
            hi: "चुनी और गिराई ख़बरें",
            mr: "निवडलेल्या आणि गाळलेल्या बातम्या",
          },
          right: {
            en: "the nation's topics picked",
            hi: "देश के विषय छाँटे हुए",
            mr: "देशाचे विषय निवडलेले",
          },
        },
      },
      {
        id: "balanced-report",
        name: { en: "The balanced report", hi: "संतुलित रिपोर्ट", mr: "संतुलित वार्तांकन" },
        kind: "standard",
        prompt: {
          en: "Which kind of story presents all sides of an event, lets the facts speak and keeps the reporter's own view apart?",
          hi: "किस प्रकार की ख़बर घटना के सब पक्ष रखती है, तथ्यों को बोलने देती है और रिपोर्टर की अपनी राय अलग रखती है?",
          mr: "कोणत्या प्रकारची बातमी घटनेच्या साऱ्या बाजू मांडते, तथ्यांना बोलू देते आणि वार्ताहराचे स्वतःचे मत वेगळे ठेवते?",
        },
        statement: {
          en: "A balanced report airs every side and separates fact from opinion — the reader is left free, and equipped, to judge.",
          hi: "संतुलित रिपोर्ट हर पक्ष सुनाती है और तथ्य को राय से अलग रखती है — पाठक फ़ैसले के लिए आज़ाद भी रहता है, लैस भी।",
          mr: "संतुलित वार्तांकन प्रत्येक बाजू ऐकवते आणि तथ्य मतापासून वेगळे ठेवते — वाचक निर्णयासाठी मोकळाही राहतो, सज्जही.",
        },
        pair: {
          left: { en: "All sides aired", hi: "सब पक्ष सुनाए गए", mr: "साऱ्या बाजू ऐकवलेल्या" },
          right: {
            en: "the reader left to judge",
            hi: "फ़ैसला पाठक के हाथ",
            mr: "निर्णय वाचकाच्या हाती",
          },
        },
      },
      {
        id: "censorship",
        name: { en: "Censorship", hi: "सेंसरशिप", mr: "सेन्सॉरशिप" },
        kind: "power",
        prompt: {
          en: "When a government blocks stories, or an outlet quietly buries them, what is this silencing called?",
          hi: "जब सरकार ख़बरें रोक दे, या कोई माध्यम उन्हें चुपचाप दबा दे, तो इस चुप कराने का नाम क्या है?",
          mr: "सरकार बातम्या अडवते, किंवा एखादे माध्यम त्या गुपचूप दडपते, तेव्हा या गप्प करण्याचे नाव काय?",
        },
        statement: {
          en: "Censorship is silencing — by state order, or by an outlet's own careful omissions; the missing story is its fingerprint.",
          hi: "सेंसरशिप चुप्पी है — सरकारी हुक्म से, या माध्यम की अपनी सधी हुई चूक से; ग़ायब ख़बर ही उसकी उँगलियों का निशान है।",
          mr: "सेन्सॉरशिप म्हणजे गप्प करणे — सरकारी हुकुमाने, वा माध्यमाच्या स्वतःच्या जपून केलेल्या गाळण्याने; गायब बातमी हाच तिचा ठसा.",
        },
        detail: {
          en: "During the Emergency of 1975–77, newspapers needed approval before printing — some left blank columns in protest.",
          hi: "1975–77 के आपातकाल में अख़बारों को छापने से पहले मंज़ूरी चाहिए थी — कुछ ने विरोध में कोरे कॉलम छोड़े।",
          mr: "1975–77 च्या आणीबाणीत वृत्तपत्रांना छापण्याआधी मंजुरी लागे — काहींनी निषेधार्थ कोरे रकाने सोडले.",
        },
        extra: {
          en: "The censor's success is invisible by design — you cannot miss a story you never knew existed.",
          hi: "सेंसर की कामयाबी बनावट से ही अदृश्य है — जिस ख़बर का पता ही न हो, उसकी कमी कैसे खले।",
          mr: "सेन्सॉरचे यश रचनेनेच अदृश्य — जिचे अस्तित्वच ठाऊक नाही ती बातमी चुकल्याचे कसे जाणवेल.",
        },
        pair: {
          left: { en: "The blocked story", hi: "रोकी गई ख़बर", mr: "अडवलेली बातमी" },
          right: {
            en: "silence by order or choice",
            hi: "हुक्म या चुनाव की चुप्पी",
            mr: "हुकुमाची वा निवडीची शांतता",
          },
        },
      },
      {
        id: "local-media",
        name: {
          en: "Independent local media",
          hi: "स्वतंत्र स्थानीय माध्यम",
          mr: "स्वतंत्र स्थानिक माध्यमे",
        },
        kind: "channel",
        prompt: {
          en: "Which small newspapers and radios, run close to their readers, cover the water queue and the panchayat meeting the big channels skip?",
          hi: "पाठकों के पास ही चलते कौन-से छोटे अख़बार और रेडियो पानी की क़तार और पंचायत की वह बैठक कवर करते हैं जिन्हें बड़े चैनल छोड़ जाते हैं?",
          mr: "वाचकांच्या जवळच चालणारी कोणती छोटी वृत्तपत्रे आणि रेडिओ पाण्याची रांग आणि मोठ्या वाहिन्या गाळतात ती पंचायत-बैठक कव्हर करतात?",
        },
        statement: {
          en: "Independent local media report the near-at-hand — the broken handpump matters more here than any celebrity wedding.",
          hi: "स्वतंत्र स्थानीय माध्यम पास की ख़बर लेते हैं — यहाँ टूटा हैंडपंप किसी भी सेलिब्रिटी शादी से बड़ी ख़बर है।",
          mr: "स्वतंत्र स्थानिक माध्यमे जवळचे वार्तांकन करतात — इथे मोडका हातपंप कोणत्याही सेलिब्रिटी लग्नाहून मोठी बातमी.",
        },
        pair: {
          left: { en: "News from the next lane", hi: "बग़ल की गली की ख़बर", mr: "शेजारच्या गल्लीची बातमी" },
          right: {
            en: "the handpump over the celebrity",
            hi: "सेलिब्रिटी पर भारी हैंडपंप",
            mr: "सेलिब्रिटीवर भारी हातपंप",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Which of these is a FACT a balanced report could print, rather than an opinion?",
          hi: "इनमें से कौन-सा वह तथ्य है जिसे संतुलित रिपोर्ट छाप सकती है — राय नहीं?",
          mr: "यांतले कोणते ते तथ्य आहे जे संतुलित वार्तांकन छापू शकते — मत नव्हे?",
        },
        choices: [
          {
            en: "'The tanker delivered water to the colony on only 4 of the last 30 days, per the supply register'",
            hi: "'आपूर्ति-पंजी के अनुसार टैंकर पिछले 30 में से केवल 4 दिन कॉलोनी में पानी लाया'",
            mr: "'पुरवठा-नोंदवहीनुसार टँकर गेल्या 30 पैकी फक्त 4 दिवस वसाहतीत पाणी घेऊन आला'",
          },
          {
            en: "'The water board is clearly the laziest department in the city'",
            hi: "'जल बोर्ड साफ़ तौर पर शहर का सबसे निकम्मा विभाग है'",
            mr: "'पाणी मंडळ स्पष्टपणे शहरातले सर्वांत आळशी खाते आहे'",
          },
          {
            en: "'Everyone knows officials never care about poor colonies'",
            hi: "'सब जानते हैं अफ़सरों को ग़रीब बस्तियों की परवाह नहीं होती'",
            mr: "'साऱ्यांना ठाऊक आहे अधिकाऱ्यांना गरीब वस्त्यांची पर्वा नसते'",
          },
          {
            en: "'Any sensible reader will demand the minister resign'",
            hi: "'कोई भी समझदार पाठक मंत्री का इस्तीफ़ा माँगेगा'",
            mr: "'कोणताही समजूतदार वाचक मंत्र्याचा राजीनामा मागेल'",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A fact is checkable: the supply register exists, the days can be counted, and a rival reporter could verify every number. The other three sentences perform judgments — 'laziest', 'everyone knows', 'any sensible reader' — words that cannot be checked, only believed. Balanced reporting is built from the checkable kind; the reader may then form the judgments personally.",
          hi: "तथ्य जाँचा जा सकता है: आपूर्ति-पंजी मौजूद है, दिन गिने जा सकते हैं, और प्रतिद्वंद्वी रिपोर्टर हर संख्या परख सकता है। बाक़ी तीन वाक्य फ़ैसले सुनाते हैं — 'सबसे निकम्मा', 'सब जानते हैं', 'कोई भी समझदार' — शब्द जो जाँचे नहीं, केवल माने जा सकते हैं। संतुलित पत्रकारिता जाँचने योग्य से बनती है; फ़ैसले फिर पाठक ख़ुद बना सकता है।",
          mr: "तथ्य तपासता येते: पुरवठा-नोंदवही आहे, दिवस मोजता येतात, आणि प्रतिस्पर्धी वार्ताहर प्रत्येक आकडा पडताळू शकतो. बाकी तीन वाक्ये निकाल देतात — 'सर्वांत आळशी', 'साऱ्यांना ठाऊक', 'कोणताही समजूतदार' — शब्द जे तपासता येत नाहीत, फक्त मानता येतात. संतुलित पत्रकारिता तपासण्याजोग्यांतून बनते; निकाल मग वाचक स्वतः काढू शकतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two channels cover the same factory protest: one leads with workers' unpaid wages, the other with traffic jams the march caused — and the second channel's biggest advertiser owns the factory. Why must a viewer know WHO PAYS for each channel before weighing the two stories?",
          hi: "दो चैनल एक ही फ़ैक्टरी-प्रदर्शन दिखाते हैं: एक मज़दूरों की रुकी मज़दूरी से शुरू करता है, दूसरा जुलूस से लगे जाम से — और दूसरे चैनल का सबसे बड़ा विज्ञापनदाता वही फ़ैक्टरी-मालिक है। दोनों ख़बरें तौलने से पहले दर्शक को यह क्यों पता होना चाहिए कि हर चैनल का ख़र्च कौन उठाता है?",
          mr: "दोन वाहिन्या एकच कारखाना-आंदोलन दाखवतात: एक कामगारांच्या थकलेल्या मजुरीने सुरुवात करते, दुसरी मोर्च्याने झालेल्या वाहतूक-कोंडीने — आणि दुसऱ्या वाहिनीचा सर्वांत मोठा जाहिरातदार तोच कारखानदार आहे. दोन्ही बातम्या तोलण्याआधी प्रेक्षकाला प्रत्येक वाहिनीचा खर्च कोण उचलतो हे का ठाऊक हवे?",
        },
        choices: [
          {
            en: "Because framing follows funding: the paymaster's channel can bury the wage story under the traffic story without printing one false word — knowing the money lets the viewer correct for the tilt",
            hi: "क्योंकि ख़र्च ही ख़बर का कोण तय करता है: मालिक के पैसे वाला चैनल एक भी झूठा शब्द छापे बिना मज़दूरी की ख़बर को जाम की ख़बर तले दबा सकता है — पैसे का पता दर्शक को झुकाव सुधारने देता है",
            mr: "कारण खर्चच बातमीचा कोन ठरवतो: मालकाच्या पैशाची वाहिनी एकही खोटा शब्द न छापता मजुरीची बातमी कोंडीच्या बातमीखाली गाडू शकते — पैशाची माहिती प्रेक्षकाला कल दुरुस्त करू देते",
          },
          {
            en: "Because the better-funded channel is always the truthful one",
            hi: "क्योंकि ज़्यादा पैसे वाला चैनल हमेशा सच्चा होता है",
            mr: "कारण जास्त पैशाची वाहिनी नेहमी खरी असते",
          },
          {
            en: "There is no need — cameras cannot lie about events",
            hi: "ज़रूरत नहीं — कैमरे घटनाओं के बारे में झूठ नहीं बोल सकते",
            mr: "गरज नाही — कॅमेरे घटनांबद्दल खोटे बोलू शकत नाहीत",
          },
          {
            en: "Viewers should simply watch neither channel",
            hi: "दर्शकों को बस दोनों चैनल नहीं देखने चाहिए",
            mr: "प्रेक्षकांनी नुसत्या दोन्ही वाहिन्या पाहू नयेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The subtlest bias never lies; it selects. Both broadcasts may be entirely factual — wages ARE unpaid, traffic WAS jammed — yet the choice of lead, footage and airtime writes opposite morals onto the same event. Since selection is invisible inside any single broadcast, the viewer's only lever is external: know who funds the teller, watch more than one telling, and treat the overlap as the sturdiest part of the story. Media literacy is less about detecting lies than about mapping interests.",
          hi: "सबसे महीन पक्षपात कभी झूठ नहीं बोलता; वह छाँटता है। दोनों प्रसारण पूरी तरह तथ्यपरक हो सकते हैं — मज़दूरी सचमुच रुकी है, जाम सचमुच लगा — फिर भी शुरुआती ख़बर, फ़ुटेज और समय का चुनाव एक ही घटना पर उल्टी सीखें लिख देता है। चूँकि छँटाई किसी एक प्रसारण के भीतर से दिखती नहीं, दर्शक का इकलौता औज़ार बाहर है: बताने वाले का ख़र्च उठाने वाला जानिए, एक से ज़्यादा बयान देखिए, और जो हिस्सा सबमें मिलता हो उसे ख़बर का सबसे पक्का हिस्सा मानिए। मीडिया-साक्षरता झूठ पकड़ने से ज़्यादा हितों का नक़्शा बनाना है।",
          mr: "सर्वांत बारीक पक्षपात कधी खोटे बोलत नाही; तो निवडतो. दोन्ही प्रक्षेपणे पूर्ण तथ्यनिष्ठ असू शकतात — मजुरी खरेच थकली आहे, कोंडी खरीच झाली — तरी पहिली बातमी, चित्रण आणि वेळेची निवड एकाच घटनेवर उलटे बोध लिहिते. निवड कोणत्याही एका प्रक्षेपणाच्या आतून दिसत नाही, म्हणून प्रेक्षकाचे एकमेव हत्यार बाहेर आहे: सांगणाऱ्याचा खर्च कोण उचलतो ते जाणा, एकाहून अधिक कथने पाहा, आणि साऱ्यांत जुळणारा भाग बातमीचा सर्वांत भक्कम भाग माना. माध्यम-साक्षरता म्हणजे खोटे पकडण्याहून हितसंबंधांचा नकाशा काढणे.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Markets Around Us (from cart to mall, link by link)         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-7-markets-around-us",
    subject: "CIVICS",
    classLevel: 7,
    chapter: {
      en: "Chapter 7 — Markets Around Us",
      hi: "अध्याय 7 — हमारे आस-पास के बाज़ार",
      mr: "प्रकरण 7 — आपल्या भोवतालचे बाजार",
    },
    name: {
      en: "Markets Around Us",
      hi: "हमारे आस-पास के बाज़ार",
      mr: "आपल्या भोवतालचे बाजार",
    },
    summary: {
      en: "The market in all its costumes — the weekly square, the marble mall, the wholesale yard, the hawker's cart — the chain that links farm to kitchen, and the udhaar khata binding buyer to shop.",
      hi: "हर वेश में बाज़ार — साप्ताहिक चौक, संगमरमरी मॉल, थोक मंडी, फेरीवाले का ठेला — खेत को रसोई से जोड़ती कड़ी, और ख़रीदार को दुकान से बाँधता उधार-खाता।",
      mr: "प्रत्येक वेशातला बाजार — आठवडी चौक, संगमरवरी मॉल, घाऊक बाजार, फेरीवाल्याची गाडी — शेताला स्वयंपाकघराशी जोडणारी साखळी, आणि गिऱ्हाईकाला दुकानाशी बांधणारे उधार-खाते.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "weekly-market",
        name: { en: "The weekly market", hi: "साप्ताहिक बाज़ार (हाट)", mr: "आठवडी बाजार" },
        kind: "market",
        prompt: {
          en: "Which market assembles on one fixed day, sells cheap on its low overheads, and moves on to the next town?",
          hi: "कौन-सा बाज़ार एक तय दिन जुटता है, कम ख़र्च के बूते सस्ता बेचता है, और अगले क़स्बे को बढ़ जाता है?",
          mr: "कोणता बाजार एका ठरलेल्या दिवशी भरतो, कमी खर्चाच्या बळावर स्वस्त विकतो, आणि पुढच्या गावी सरकतो?",
        },
        statement: {
          en: "The weekly market owns no shop — no rent, no watchman, no bills, so its prices undercut the permanent stores.",
          hi: "साप्ताहिक बाज़ार की कोई दुकान नहीं — न किराया, न चौकीदार, न बिल; इसीलिए उसके दाम पक्की दुकानों से नीचे रहते हैं।",
          mr: "आठवडी बाजाराचे स्वतःचे दुकान नाही — भाडे नाही, राखणदार नाही, बिले नाहीत; म्हणून त्याचे भाव पक्क्या दुकानांहून खाली राहतात.",
        },
        detail: {
          en: "One trader may walk seven haats in seven days — the market itself is the traveller.",
          hi: "एक व्यापारी सात दिनों में सात हाट घूम सकता है — यहाँ बाज़ार स्वयं यात्री है।",
          mr: "एक व्यापारी सात दिवसांत सात बाजार फिरू शकतो — इथे बाजार स्वतःच प्रवासी आहे.",
        },
        extra: {
          en: "Everything from bangles to buffaloes shares the same square for a day.",
          hi: "चूड़ियों से भैंसों तक सब कुछ एक दिन के लिए एक ही चौक बाँटता है।",
          mr: "बांगड्यांपासून म्हशींपर्यंत सारे एका दिवसासाठी एकच चौक वाटून घेते.",
        },
        pair: {
          left: { en: "The market that visits", hi: "आता-जाता बाज़ार", mr: "येऊन जाणारा बाजार" },
          right: {
            en: "cheap by low overheads",
            hi: "कम ख़र्च से सस्ता",
            mr: "कमी खर्चाने स्वस्त",
          },
        },
      },
      {
        id: "mall",
        name: { en: "The shopping mall", hi: "शॉपिंग मॉल", mr: "शॉपिंग मॉल" },
        kind: "market",
        prompt: {
          en: "Which enclosed market of branded showrooms sells to those who can pay for the air-conditioning along with the goods?",
          hi: "ब्रांडेड शोरूमों का कौन-सा बंद बाज़ार उन्हें बेचता है जो माल के साथ एयर-कंडीशनिंग का दाम भी दे सकें?",
          mr: "ब्रँडेड शोरूमांचा कोणता बंदिस्त बाजार त्यांना विकतो जे मालासोबत वातानुकूलनाचीही किंमत देऊ शकतात?",
        },
        statement: {
          en: "The mall sells brands under one cooled roof — quality promised, and prices carrying the marble's rent.",
          hi: "मॉल एक ठंडी छत तले ब्रांड बेचता है — गुणवत्ता का वादा, और दामों पर संगमरमर का किराया लदा हुआ।",
          mr: "मॉल एका थंड छताखाली ब्रँड विकतो — दर्जाचे वचन, आणि किमतींवर संगमरवराचे भाडे लादलेले.",
        },
        pair: {
          left: { en: "Brands under one roof", hi: "एक छत तले ब्रांड", mr: "एका छताखालचे ब्रँड" },
          right: {
            en: "prices carrying the rent",
            hi: "किराया ढोते दाम",
            mr: "भाडे वाहणाऱ्या किमती",
          },
        },
      },
      {
        id: "wholesale",
        name: { en: "The wholesale trader", hi: "थोक व्यापारी", mr: "घाऊक व्यापारी" },
        kind: "market",
        prompt: {
          en: "Which trader buys in huge lots from producers and sells on to shopkeepers — never to the final eater?",
          hi: "कौन-सा व्यापारी उत्पादकों से भारी खेप ख़रीदकर दुकानदारों को बेचता है — अंतिम खाने वाले को कभी नहीं?",
          mr: "कोणता व्यापारी उत्पादकांकडून प्रचंड माल घेऊन दुकानदारांना विकतो — शेवटच्या खाणाऱ्याला कधीच नाही?",
        },
        statement: {
          en: "The wholesaler moves goods by the sack and crate — the chain's middle link, invisible to the final buyer.",
          hi: "थोक व्यापारी बोरी और पेटी के हिसाब से माल चलाता है — कड़ी की बीच की गाँठ, अंतिम ख़रीदार से ओझल।",
          mr: "घाऊक व्यापारी पोते आणि खोक्याच्या हिशेबाने माल हलवतो — साखळीतला मधला दुवा, शेवटच्या गिऱ्हाईकाला अदृश्य.",
        },
        pair: {
          left: { en: "Sacks, not packets", hi: "पैकेट नहीं, बोरियाँ", mr: "पाकिटे नव्हे, पोती" },
          right: { en: "the chain's middle link", hi: "कड़ी की बीच की गाँठ", mr: "साखळीतला मधला दुवा" },
        },
      },
      {
        id: "chain",
        name: { en: "The chain of markets", hi: "बाज़ारों की कड़ी", mr: "बाजारांची साखळी" },
        kind: "system",
        prompt: {
          en: "From farm to wholesale yard to retail shop to kitchen — what is this relay of buying and selling called?",
          hi: "खेत से थोक मंडी, मंडी से दुकान, दुकान से रसोई — ख़रीद-बिक्री की इस रिले-दौड़ का नाम क्या है?",
          mr: "शेतातून घाऊक बाजार, तिथून दुकान, दुकानातून स्वयंपाकघर — खरेदी-विक्रीच्या या रिले-शर्यतीचे नाव काय?",
        },
        statement: {
          en: "The chain of markets relays goods hand to hand — and each link adds its cost and keeps its margin.",
          hi: "बाज़ारों की कड़ी माल को हाथ-दर-हाथ पहुँचाती है — और हर गाँठ अपना ख़र्च जोड़ती, अपना मुनाफ़ा रखती है।",
          mr: "बाजारांची साखळी माल हातोहात पोहोचवते — आणि प्रत्येक दुवा आपला खर्च जोडतो, आपला नफा ठेवतो.",
        },
        detail: {
          en: "The farmer's price and the kitchen's price differ by the whole chain's keep — count the hands between them.",
          hi: "किसान का दाम और रसोई का दाम पूरी कड़ी की कमाई जितना अलग है — बीच के हाथ गिनिए।",
          mr: "शेतकऱ्याचा भाव आणि स्वयंपाकघराचा भाव सबंध साखळीच्या कमाईइतका वेगळा — मधले हात मोजा.",
        },
        extra: {
          en: "Shorten the chain — co-operatives, farmers' markets — and the two ends meet closer.",
          hi: "कड़ी छोटी कीजिए — सहकारी समितियाँ, किसान-बाज़ार — और दोनों सिरे पास आ मिलते हैं।",
          mr: "साखळी आखूड करा — सहकारी संस्था, शेतकरी-बाजार — आणि दोन्ही टोके जवळ येतात.",
        },
        pair: {
          left: { en: "Farm to kitchen relay", hi: "खेत से रसोई की रिले", mr: "शेत ते स्वयंपाकघर रिले" },
          right: {
            en: "each link keeps a margin",
            hi: "हर गाँठ का अपना मुनाफ़ा",
            mr: "प्रत्येक दुव्याचा आपला नफा",
          },
        },
      },
      {
        id: "hawker",
        name: { en: "The street hawker", hi: "फेरीवाला", mr: "फेरीवाला" },
        kind: "market",
        prompt: {
          en: "Which seller carries the market on a cart or head-load — capital small, place uncertain, customers passing by?",
          hi: "कौन-सा विक्रेता बाज़ार को ठेले या सिर के बोझ पर ढोता है — पूँजी छोटी, ठिकाना अनिश्चित, ग्राहक राह चलते?",
          mr: "कोणता विक्रेता बाजार गाडीवर वा डोक्यावरच्या ओझ्यावर वाहतो — भांडवल लहान, जागा अनिश्चित, गिऱ्हाईक वाटसरू?",
        },
        statement: {
          en: "The hawker is a market of one — tiny capital, no shelter over the stock, and the first to be told to move along.",
          hi: "फेरीवाला एक आदमी का बाज़ार है — नन्ही पूँजी, माल पर कोई छत नहीं, और 'आगे बढ़ो' सबसे पहले उसी से कहा जाता है।",
          mr: "फेरीवाला म्हणजे एका माणसाचा बाजार — इवले भांडवल, मालावर छप्पर नाही, आणि 'पुढे हो' सर्वांत आधी त्यालाच सांगितले जाते.",
        },
        pair: {
          left: { en: "The market on a cart", hi: "ठेले पर बाज़ार", mr: "गाडीवरचा बाजार" },
          right: {
            en: "smallest capital, least shelter",
            hi: "सबसे छोटी पूँजी, सबसे कम छत",
            mr: "सर्वांत लहान भांडवल, सर्वांत कमी छप्पर",
          },
        },
      },
      {
        id: "credit",
        name: { en: "Buying on credit", hi: "उधार पर ख़रीद", mr: "उधारीवर खरेदी" },
        kind: "system",
        prompt: {
          en: "The poor often buy from the corner shop on udhaar despite its higher prices. Which arrangement explains the loyalty?",
          hi: "ग़रीब प्रायः ऊँचे दामों के बावजूद नुक्कड़ की दुकान से उधार पर ख़रीदते हैं। कौन-सी व्यवस्था इस वफ़ादारी की व्याख्या करती है?",
          mr: "गरीब बहुधा जास्त भाव असूनही कोपऱ्यावरच्या दुकानातून उधारीवर घेतात. कोणती व्यवस्था या निष्ठेचे स्पष्टीकरण देते?",
        },
        statement: {
          en: "Credit binds buyer to shopkeeper — the udhaar khata forgives an empty pocket today at tomorrow's price.",
          hi: "उधार ख़रीदार को दुकानदार से बाँधता है — उधार-खाता आज की ख़ाली जेब को कल के दाम पर माफ़ करता है।",
          mr: "उधारी गिऱ्हाईकाला दुकानदाराशी बांधते — उधार-खाते आजच्या रिकाम्या खिशाला उद्याच्या किमतीवर माफ करते.",
        },
        pair: {
          left: { en: "The udhaar khata", hi: "उधार-खाता", mr: "उधार-खाते" },
          right: {
            en: "today's need, tomorrow's price",
            hi: "आज की ज़रूरत, कल का दाम",
            mr: "आजची गरज, उद्याची किंमत",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Send a sack of onions from field to plate. Which order of hands is the usual one?",
          hi: "प्याज़ की बोरी को खेत से थाली तक भेजिए। हाथों का सामान्य क्रम कौन-सा है?",
          mr: "कांद्याचे पोते शेतातून ताटापर्यंत पाठवा. हातांचा नेहमीचा क्रम कोणता?",
        },
        choices: [
          {
            en: "Farmer → wholesale trader → retail shopkeeper → household buyer",
            hi: "किसान → थोक व्यापारी → खुदरा दुकानदार → घरेलू ख़रीदार",
            mr: "शेतकरी → घाऊक व्यापारी → किरकोळ दुकानदार → घरगुती गिऱ्हाईक",
          },
          {
            en: "Farmer → retail shopkeeper → wholesale trader → household buyer",
            hi: "किसान → खुदरा दुकानदार → थोक व्यापारी → घरेलू ख़रीदार",
            mr: "शेतकरी → किरकोळ दुकानदार → घाऊक व्यापारी → घरगुती गिऱ्हाईक",
          },
          {
            en: "Wholesale trader → farmer → household buyer → retail shopkeeper",
            hi: "थोक व्यापारी → किसान → घरेलू ख़रीदार → खुदरा दुकानदार",
            mr: "घाऊक व्यापारी → शेतकरी → घरगुती गिऱ्हाईक → किरकोळ दुकानदार",
          },
          {
            en: "Household buyer → wholesale trader → retail shopkeeper → farmer",
            hi: "घरेलू ख़रीदार → थोक व्यापारी → खुदरा दुकानदार → किसान",
            mr: "घरगुती गिऱ्हाईक → घाऊक व्यापारी → किरकोळ दुकानदार → शेतकरी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Scale shrinks along the chain: the farmer sells by the quintal to the wholesaler, the wholesaler by the sack to shopkeepers, the shopkeeper by the kilo to households. Each hand matches a quantity to a buyer who wants exactly that much — and each takes its margin for the matching. Reverse any two links and the quantities stop fitting.",
          hi: "कड़ी के साथ-साथ पैमाना सिकुड़ता है: किसान क्विंटल के भाव थोक व्यापारी को बेचता है, थोक वाला बोरी के हिसाब दुकानदारों को, दुकानदार किलो के हिसाब घरों को। हर हाथ मात्रा को उस ख़रीदार से मिलाता है जिसे ठीक उतनी चाहिए — और मिलान का अपना मुनाफ़ा लेता है। कोई दो गाँठें उलटिए और मात्राएँ बैठनी बंद हो जाती हैं।",
          mr: "साखळीसोबत माप आकसते: शेतकरी क्विंटलने घाऊक व्यापाऱ्याला विकतो, घाऊकवाला पोत्याने दुकानदारांना, दुकानदार किलोने घरांना. प्रत्येक हात मात्रेला नेमकी तितकीच हवी असलेल्या गिऱ्हाईकाशी जुळवतो — आणि जुळणीचा आपला नफा घेतो. कोणतेही दोन दुवे उलटवा आणि मात्रा जुळणे थांबते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A shirt of the same cloth sells for ₹200 in the weekly market and ₹700 in the mall. If the cloth is equal, what is the mall buyer actually paying ₹500 more FOR?",
          hi: "एक ही कपड़े की क़मीज़ साप्ताहिक बाज़ार में ₹200 और मॉल में ₹700 की बिकती है। कपड़ा बराबर है, तो मॉल का ख़रीदार ₹500 ज़्यादा असल में किस चीज़ के दे रहा है?",
          mr: "त्याच कापडाचा सदरा आठवडी बाजारात ₹200 ला आणि मॉलमध्ये ₹700 ला विकला जातो. कापड सारखे आहे, तर मॉलचे गिऱ्हाईक ₹500 जास्त खरे कशासाठी देते आहे?",
        },
        choices: [
          {
            en: "For everything around the cloth: the brand's name, the showroom's rent and cooling, the staff, the bill and exchange promise — the mall sells assurance and experience, the haat sells cloth",
            hi: "कपड़े के इर्द-गिर्द की हर चीज़ के: ब्रांड का नाम, शोरूम का किराया और ठंडक, कर्मचारी, बिल और बदलने का वादा — मॉल भरोसा और अनुभव बेचता है, हाट कपड़ा बेचती है",
            mr: "कापडाभोवतीच्या प्रत्येक गोष्टीसाठी: ब्रँडचे नाव, शोरूमचे भाडे आणि गारवा, कर्मचारी, बिल आणि बदलून देण्याचे वचन — मॉल खात्री आणि अनुभव विकतो, बाजार कापड विकतो",
          },
          {
            en: "For nothing — the mall price is simple cheating",
            hi: "किसी चीज़ के नहीं — मॉल का दाम सीधी ठगी है",
            mr: "कशासाठीच नाही — मॉलची किंमत सरळ फसवणूक",
          },
          {
            en: "Mall shirts are always of far better cloth",
            hi: "मॉल की क़मीज़ें हमेशा कहीं बेहतर कपड़े की होती हैं",
            mr: "मॉलचे सदरे नेहमी कितीतरी चांगल्या कापडाचे असतात",
          },
          {
            en: "Weekly-market sellers make enormous profits instead",
            hi: "उलटे साप्ताहिक बाज़ार के विक्रेता भारी मुनाफ़ा कमाते हैं",
            mr: "उलट आठवडी बाजारातले विक्रेते प्रचंड नफा कमावतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Every price is a bundle. The haat's ₹200 buys cloth plus almost nothing — no rent in it, no brand, no receipt if the seams give. The mall's ₹700 buys the same cloth wrapped in guarantees: a name that stakes its reputation, a bill that empowers a return, a cool room and salaried help — all real costs, all loaded into the tag. Neither buyer is cheated; they are buying different bundles with the same shirt inside. The civics lesson: markets sort customers by purse, and knowing WHAT each price contains is what makes a buyer hard to fool.",
          hi: "हर दाम एक गठरी है। हाट के ₹200 में कपड़ा और लगभग कुछ नहीं — उसमें न किराया है, न ब्रांड, न सिलाई खुल जाए तो रसीद। मॉल के ₹700 में वही कपड़ा गारंटियों में लिपटा है: साख दाँव पर लगाता नाम, वापसी का हक़ देता बिल, ठंडा कमरा और वेतनभोगी मदद — सब असली ख़र्च, सब टैग में लदे। कोई ख़रीदार ठगा नहीं गया; दोनों एक ही क़मीज़ वाली अलग-अलग गठरियाँ ख़रीद रहे हैं। नागरिकशास्त्र का पाठ: बाज़ार ग्राहकों को जेब से छाँटते हैं, और हर दाम में क्या-क्या बँधा है यह जानना ही ख़रीदार को ठगों से बचाता है।",
          mr: "प्रत्येक किंमत ही एक गाठोडी. बाजाराच्या ₹200 मध्ये कापड आणि जवळजवळ काहीच नाही — त्यात भाडे नाही, ब्रँड नाही, शिवण उसवली तर पावती नाही. मॉलच्या ₹700 मध्ये तेच कापड हमींमध्ये गुंडाळलेले: लौकिक पणाला लावणारे नाव, परतीचा हक्क देणारे बिल, थंड खोली आणि पगारी मदत — सारे खरे खर्च, सारे टॅगवर चढलेले. कोणतेही गिऱ्हाईक फसलेले नाही; दोघे एकाच सदऱ्याच्या वेगवेगळ्या गाठोड्या घेत आहेत. नागरिकशास्त्राचा धडा: बाजार गिऱ्हाईकांना खिशाने निवडतात, आणि प्रत्येक किमतीत काय-काय बांधले आहे हे जाणणेच गिऱ्हाईकाला फसवायला कठीण करते.",
        },
      },
    ],
  },
];
