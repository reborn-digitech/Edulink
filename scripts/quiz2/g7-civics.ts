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
];
