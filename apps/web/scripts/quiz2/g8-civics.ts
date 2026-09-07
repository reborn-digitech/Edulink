/**
 * Class 8 Civics — NCERT "Social and Political Life III", chapter by chapter,
 * through the conceptual engine. The constitutional grammar of the republic:
 * the rulebook above the rulers, the three organs and their leashes, rights
 * as claims against power, and the law's promise measured at the margin.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Social and Political Life – III (Class 8)";
const LICENCE = "CC-BY-SA-4.0";

export const G8_CIVICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — The Indian Constitution (the rulebook above the rulers)     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-8-indian-constitution",
    subject: "CIVICS",
    classLevel: 8,
    chapter: {
      en: "Chapter 1 — The Indian Constitution",
      hi: "अध्याय 1 — भारतीय संविधान",
      mr: "प्रकरण 1 — भारतीय संविधान",
    },
    name: { en: "The Indian Constitution", hi: "भारतीय संविधान", mr: "भारतीय संविधान" },
    summary: {
      en: "The rulebook that binds the rulers: a document drafted for a whole people, powers split so none grows too tall, fundamental rights as a citizen's shield — and a federal balance sharing power between centre and states.",
      hi: "वह नियम-पुस्तिका जो शासकों को बाँधती है: पूरी जनता के लिए रचा दस्तावेज़, बँटी शक्तियाँ ताकि कोई बहुत ऊँचा न हो, नागरिक की ढाल बने मूल अधिकार — और केंद्र-राज्य के बीच शक्ति बाँटता संघीय संतुलन।",
      mr: "शासकांना बांधणारी नियमपुस्तिका: अख्ख्या जनतेसाठी रचलेला दस्तऐवज, विभागलेल्या शक्ती म्हणजे कोणी फार उंच होऊ नये, नागरिकाची ढाल झालेले मूलभूत हक्क — आणि केंद्र-राज्यांत शक्ती वाटणारा संघराज्य समतोल.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "constitution",
        name: { en: "The Constitution", hi: "संविधान", mr: "संविधान" },
        kind: "document",
        prompt: {
          en: "Which supreme document lays down how a country is governed, the powers of its government, and the rights of its people?",
          hi: "कौन-सा सर्वोच्च दस्तावेज़ यह तय करता है कि देश का शासन कैसे हो, सरकार की शक्तियाँ क्या हों, और जनता के अधिकार क्या हों?",
          mr: "कोणता सर्वोच्च दस्तऐवज देशाचा राज्यकारभार कसा व्हावा, सरकारच्या शक्ती काय असाव्यात, आणि जनतेचे हक्क काय असावेत हे ठरवतो?",
        },
        statement: {
          en: "The Constitution is the supreme rulebook — every law, minister and court answers to it, and none may override it.",
          hi: "संविधान सर्वोच्च नियम-पुस्तिका है — हर क़ानून, मंत्री और अदालत उसे जवाबदेह हैं, और कोई उससे ऊपर नहीं जा सकता।",
          mr: "संविधान ही सर्वोच्च नियमपुस्तिका — प्रत्येक कायदा, मंत्री आणि न्यायालय तिला उत्तरदायी, आणि कोणी तिच्यावर जाऊ शकत नाही.",
        },
        detail: {
          en: "It came into force on 26 January 1950 — the day the republic set its own rules above any ruler.",
          hi: "यह 26 जनवरी 1950 को लागू हुआ — वह दिन जब गणराज्य ने अपने नियम किसी भी शासक से ऊपर रखे।",
          mr: "ते 26 जानेवारी 1950 रोजी लागू झाले — तो दिवस जेव्हा प्रजासत्ताकाने आपले नियम कोणत्याही शासकाहून वर ठेवले.",
        },
        extra: {
          en: "A constitution is a nation's promise to itself — the rules it will keep even when the powerful wish otherwise.",
          hi: "संविधान राष्ट्र का ख़ुद से किया वादा है — वे नियम जो वह तब भी निभाएगा जब शक्तिशाली कुछ और चाहें।",
          mr: "संविधान म्हणजे राष्ट्राने स्वतःशी केलेले वचन — जे नियम तो शक्तिमानांना दुसरे हवे असतानाही पाळेल.",
        },
        pair: {
          left: {
            en: "The rulebook above rulers",
            hi: "शासकों से ऊपर नियम-पुस्तिका",
            mr: "शासकांहून वरची नियमपुस्तिका",
          },
          right: {
            en: "none may override it",
            hi: "कोई इससे ऊपर नहीं",
            mr: "कोणी हिच्यावर नाही",
          },
        },
      },
      {
        id: "preamble",
        name: { en: "The Preamble", hi: "प्रस्तावना", mr: "उद्देशिका" },
        kind: "part",
        prompt: {
          en: "Which opening statement, beginning 'We, the People of India', declares the Constitution's guiding ideals — justice, liberty, equality, fraternity?",
          hi: "'हम, भारत के लोग' से शुरू होता कौन-सा आरंभिक कथन संविधान के मार्गदर्शक आदर्श — न्याय, स्वतंत्रता, समानता, बंधुत्व — घोषित करता है?",
          mr: "'आम्ही, भारताचे लोक' ने सुरू होणारे कोणते आरंभिक विधान संविधानाचे मार्गदर्शक आदर्श — न्याय, स्वातंत्र्य, समता, बंधुता — घोषित करते?",
        },
        statement: {
          en: "The Preamble is the Constitution's soul in a paragraph — 'We, the People' pledging themselves justice, liberty, equality and fraternity.",
          hi: "प्रस्तावना एक अनुच्छेद में संविधान की आत्मा है — 'हम, भारत के लोग' ख़ुद को न्याय, स्वतंत्रता, समानता और बंधुत्व का वचन देते हुए।",
          mr: "उद्देशिका म्हणजे एका परिच्छेदात संविधानाचा आत्मा — 'आम्ही, भारताचे लोक' स्वतःला न्याय, स्वातंत्र्य, समता आणि बंधुता यांचे वचन देत.",
        },
        pair: {
          left: {
            en: "'We, the People'",
            hi: "'हम, भारत के लोग'",
            mr: "'आम्ही, भारताचे लोक'",
          },
          right: {
            en: "the ideals in a paragraph",
            hi: "एक अनुच्छेद में आदर्श",
            mr: "एका परिच्छेदातले आदर्श",
          },
        },
      },
      {
        id: "fundamental-rights",
        name: { en: "Fundamental Rights", hi: "मूल अधिकार", mr: "मूलभूत हक्क" },
        kind: "provision",
        prompt: {
          en: "Which guarantees — equality, freedom, protection from exploitation, freedom of religion — can a citizen defend even against the government, in court?",
          hi: "कौन-सी गारंटियाँ — समानता, स्वतंत्रता, शोषण से रक्षा, धर्म की स्वतंत्रता — नागरिक सरकार के विरुद्ध भी, अदालत में बचा सकता है?",
          mr: "कोणत्या हमी — समता, स्वातंत्र्य, शोषणापासून संरक्षण, धर्मस्वातंत्र्य — नागरिक सरकारविरुद्धही, न्यायालयात राखू शकतो?",
        },
        statement: {
          en: "Fundamental Rights are a citizen's shield against power — enforceable in court, they bind the government itself.",
          hi: "मूल अधिकार सत्ता के विरुद्ध नागरिक की ढाल हैं — अदालत में लागू करने योग्य, वे स्वयं सरकार को बाँधते हैं।",
          mr: "मूलभूत हक्क म्हणजे सत्तेविरुद्ध नागरिकाची ढाल — न्यायालयात राबवण्याजोगे, ते स्वतः सरकारला बांधतात.",
        },
        detail: {
          en: "The right to constitutional remedies lets a citizen go straight to the Supreme Court — the shield that guards the other shields.",
          hi: "संवैधानिक उपचारों का अधिकार नागरिक को सीधे उच्चतम न्यायालय तक ले जाता है — वह ढाल जो बाक़ी ढालों की रक्षा करती है।",
          mr: "घटनात्मक उपायांचा हक्क नागरिकाला थेट सर्वोच्च न्यायालयापर्यंत नेतो — इतर ढालींचे रक्षण करणारी ढाल.",
        },
        extra: {
          en: "A right that could not be defended against the state would be a promise on paper only.",
          hi: "जो अधिकार राज्य के विरुद्ध बचाया न जा सके वह केवल काग़ज़ी वादा होता।",
          mr: "जो हक्क राज्याविरुद्ध राखता येत नाही तो केवळ कागदी वचन असतो.",
        },
        pair: {
          left: {
            en: "The citizen's shield",
            hi: "नागरिक की ढाल",
            mr: "नागरिकाची ढाल",
          },
          right: {
            en: "defended even against the state",
            hi: "राज्य के विरुद्ध भी बचाई",
            mr: "राज्याविरुद्धही राखलेली",
          },
        },
      },
      {
        id: "separation-powers",
        name: {
          en: "Separation of powers",
          hi: "शक्तियों का पृथक्करण",
          mr: "सत्तेचे विभाजन",
        },
        kind: "principle",
        prompt: {
          en: "Which principle divides government into legislature, executive and judiciary so that no single organ grows all-powerful?",
          hi: "कौन-सा सिद्धांत सरकार को विधायिका, कार्यपालिका और न्यायपालिका में बाँटता है ताकि कोई एक अंग सर्वशक्तिमान न हो जाए?",
          mr: "कोणते तत्त्व सरकारला विधिमंडळ, कार्यकारी आणि न्यायपालिकेत विभागते जेणेकरून कोणतेही एक अंग सर्वशक्तिमान होऊ नये?",
        },
        statement: {
          en: "Separation of powers splits government three ways — law-makers, law-doers and law-judges each checking the others.",
          hi: "शक्तियों का पृथक्करण सरकार को तीन में बाँटता है — क़ानून बनाने वाले, चलाने वाले और परखने वाले, हर एक दूसरे पर नज़र रखते हुए।",
          mr: "सत्तेचे विभाजन सरकारला तीनत विभागते — कायदा बनवणारे, राबवणारे आणि तपासणारे, प्रत्येक दुसऱ्यावर नजर ठेवत.",
        },
        detail: {
          en: "Power divided is power watched — each organ can restrain the other two, so tyranny finds no single lever.",
          hi: "बँटी शक्ति निगरानी वाली शक्ति है — हर अंग बाक़ी दो को रोक सकता है, अतः अत्याचार को कोई एक ज़ोर नहीं मिलता।",
          mr: "विभागलेली सत्ता म्हणजे नजरेखालची सत्ता — प्रत्येक अंग बाकी दोघांना रोखू शकते, म्हणून जुलमाला एकही तरफड मिळत नाही.",
        },
        extra: {
          en: "It is the constitutional answer to a simple fear: what stops those who make the rules from also judging them?",
          hi: "यह एक सरल भय का संवैधानिक उत्तर है: जो नियम बनाते हैं उन्हें उन्हीं का न्याय करने से क्या रोके?",
          mr: "हे एका साध्या भीतीचे घटनात्मक उत्तर: जे नियम बनवतात त्यांना त्यांचाच न्याय करण्यापासून काय रोखेल?",
        },
        pair: {
          left: {
            en: "Government split three ways",
            hi: "तीन में बँटी सरकार",
            mr: "तीनत विभागलेले सरकार",
          },
          right: {
            en: "no single organ all-powerful",
            hi: "कोई अंग सर्वशक्तिमान नहीं",
            mr: "कोणतेही अंग सर्वशक्तिमान नाही",
          },
        },
      },
      {
        id: "federalism",
        name: { en: "Federalism", hi: "संघवाद", mr: "संघराज्यवाद" },
        kind: "principle",
        prompt: {
          en: "Which principle shares power between the central government and the states, so both levels rule within their own spheres?",
          hi: "कौन-सा सिद्धांत केंद्र सरकार और राज्यों के बीच शक्ति बाँटता है, ताकि दोनों स्तर अपने-अपने क्षेत्र में शासन करें?",
          mr: "कोणते तत्त्व केंद्र सरकार आणि राज्यांत शक्ती वाटते, जेणेकरून दोन्ही पातळ्या आपापल्या क्षेत्रात राज्य करतील?",
        },
        statement: {
          en: "Federalism divides power between centre and states — a single nation ruled at two levels, each with its own subjects.",
          hi: "संघवाद केंद्र और राज्यों के बीच शक्ति बाँटता है — एक ही राष्ट्र, दो स्तरों पर शासित, हर स्तर के अपने विषय।",
          mr: "संघराज्यवाद केंद्र आणि राज्यांत शक्ती विभागतो — एकच राष्ट्र, दोन पातळ्यांवर शासित, प्रत्येक पातळीचे स्वतःचे विषय.",
        },
        detail: {
          en: "Defence and currency sit with the centre; police and land with the states; some subjects both may touch.",
          hi: "रक्षा और मुद्रा केंद्र के पास; पुलिस और भूमि राज्यों के पास; कुछ विषय दोनों छू सकते हैं।",
          mr: "संरक्षण आणि चलन केंद्राकडे; पोलीस आणि जमीन राज्यांकडे; काही विषयांना दोघेही स्पर्श करू शकतात.",
        },
        extra: {
          en: "It lets a vast, diverse country hold together without ruling everything from one distant capital.",
          hi: "यह एक विशाल, विविध देश को एक दूर की राजधानी से सब कुछ शासित किए बिना जोड़े रखता है।",
          mr: "हे एका विशाल, विविध देशाला एका दूरच्या राजधानीतून सारे शासित न करता एकत्र ठेवते.",
        },
        pair: {
          left: {
            en: "Power shared by two levels",
            hi: "दो स्तरों में बँटी शक्ति",
            mr: "दोन पातळ्यांत वाटलेली शक्ती",
          },
          right: {
            en: "centre and states each rule",
            hi: "केंद्र और राज्य दोनों शासन",
            mr: "केंद्र आणि राज्य दोघे राज्य",
          },
        },
      },
      {
        id: "secularism",
        name: { en: "Secularism", hi: "धर्मनिरपेक्षता", mr: "धर्मनिरपेक्षता" },
        kind: "principle",
        prompt: {
          en: "Which principle keeps the state from favouring or founding any religion, so citizens of every faith stand equal before it?",
          hi: "कौन-सा सिद्धांत राज्य को किसी धर्म का पक्ष लेने या स्थापित करने से रोकता है, ताकि हर धर्म के नागरिक उसके समक्ष बराबर खड़े हों?",
          mr: "कोणते तत्त्व राज्याला कोणत्याही धर्माची बाजू घेण्यापासून वा स्थापण्यापासून रोखते, जेणेकरून प्रत्येक धर्माचे नागरिक त्याच्यापुढे समान उभे राहतील?",
        },
        statement: {
          en: "Secularism holds the state at equal distance from all religions — favouring none, founding none, letting each citizen believe freely.",
          hi: "धर्मनिरपेक्षता राज्य को सब धर्मों से समान दूरी पर रखती है — किसी का पक्ष नहीं, किसी की स्थापना नहीं, हर नागरिक को स्वतंत्र आस्था देती हुई।",
          mr: "धर्मनिरपेक्षता राज्याला सर्व धर्मांपासून समान अंतरावर ठेवते — कोणाची बाजू नाही, कोणाची स्थापना नाही, प्रत्येक नागरिकाला मुक्त श्रद्धा देत.",
        },
        pair: {
          left: {
            en: "The state at equal distance",
            hi: "समान दूरी पर राज्य",
            mr: "समान अंतरावरचे राज्य",
          },
          right: {
            en: "every faith equal before it",
            hi: "उसके समक्ष हर धर्म बराबर",
            mr: "त्याच्यापुढे प्रत्येक धर्म समान",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the constitutional idea to what it guards against: A-separation of powers, B-fundamental rights, C-federalism. Which trio is right?",
          hi: "संवैधानिक विचार को उससे मिलाइए जिससे वह बचाता है: अ-शक्तियों का पृथक्करण, ब-मूल अधिकार, स-संघवाद। कौन-सी तिकड़ी सही है?",
          mr: "घटनात्मक कल्पनेला ती ज्यापासून राखते त्याशी जुळवा: अ-सत्तेचे विभाजन, ब-मूलभूत हक्क, क-संघराज्यवाद. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: one organ becoming all-powerful · B: the state trampling the citizen · C: all power piling up in one distant capital",
            hi: "अ: एक अंग का सर्वशक्तिमान होना · ब: राज्य का नागरिक को कुचलना · स: सारी शक्ति एक दूर राजधानी में जमना",
            mr: "अ: एक अंग सर्वशक्तिमान होणे · ब: राज्याने नागरिकाला चिरडणे · क: सारी सत्ता एका दूरच्या राजधानीत साचणे",
          },
          {
            en: "A: the state trampling the citizen · B: power piling up centrally · C: one organ becoming all-powerful",
            hi: "अ: राज्य का नागरिक को कुचलना · ब: शक्ति का केंद्र में जमना · स: एक अंग का सर्वशक्तिमान होना",
            mr: "अ: राज्याने नागरिकाला चिरडणे · ब: सत्ता केंद्रात साचणे · क: एक अंग सर्वशक्तिमान होणे",
          },
          {
            en: "A: power piling up centrally · B: one organ all-powerful · C: the state trampling the citizen",
            hi: "अ: शक्ति का केंद्र में जमना · ब: एक अंग सर्वशक्तिमान · स: राज्य का नागरिक को कुचलना",
            mr: "अ: सत्ता केंद्रात साचणे · ब: एक अंग सर्वशक्तिमान · क: राज्याने नागरिकाला चिरडणे",
          },
          {
            en: "All three guard against exactly the same danger",
            hi: "तीनों ठीक एक ही ख़तरे से बचाते हैं",
            mr: "तिघेही नेमक्या एकाच धोक्यापासून राखतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each safeguard answers a different way power can go wrong. Separation of powers stops any one organ — say a parliament — from also judging and enforcing, and so becoming a tyrant. Fundamental rights arm the individual against the whole state's weight. Federalism stops every decision draining upward into one capital far from the governed. Read together they are a single strategy: never let power collect, unwatched, in one place or one hand.",
          hi: "हर सुरक्षा शक्ति के बिगड़ने के अलग-अलग तरीक़े का उत्तर है। शक्तियों का पृथक्करण किसी एक अंग — मसलन संसद — को न्याय और अमल भी करने, और यों अत्याचारी बनने से रोकता है। मूल अधिकार व्यक्ति को पूरे राज्य के भार के विरुद्ध हथियारबंद करते हैं। संघवाद हर फ़ैसले को शासितों से दूर एक राजधानी में ऊपर की ओर बहने से रोकता है। साथ पढ़िए तो तीनों एक ही रणनीति हैं: शक्ति को कभी एक जगह या एक हाथ में, बिना निगरानी, जमने मत दो।",
          mr: "प्रत्येक सुरक्षा सत्ता बिघडण्याच्या वेगळ्या मार्गाचे उत्तर देते. सत्तेचे विभाजन कोणत्याही एका अंगाला — म्हणा संसद — न्याय आणि अंमलही करून जुलमी होण्यापासून रोखते. मूलभूत हक्क व्यक्तीला अख्ख्या राज्याच्या ओझ्याविरुद्ध सशस्त्र करतात. संघराज्यवाद प्रत्येक निर्णयाला शासितांपासून दूरच्या एका राजधानीत वर वाहण्यापासून रोखतो. एकत्र वाचले तर तिघे एकच रणनीती: सत्तेला कधीही एका जागी वा एका हातात, नजरेविना, साचू देऊ नका.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A parliament with a huge majority passes a law stripping a minority of a fundamental right. The Supreme Court strikes it down. How can unelected judges overrule the elected representatives of the people?",
          hi: "भारी बहुमत वाली संसद एक क़ानून पास करती है जो अल्पसंख्यक से एक मूल अधिकार छीन लेता है। उच्चतम न्यायालय उसे रद्द कर देता है। अनिर्वाचित न्यायाधीश जनता के निर्वाचित प्रतिनिधियों को कैसे उलट सकते हैं?",
          mr: "प्रचंड बहुमत असलेली संसद एक कायदा पास करते जो अल्पसंख्याकाकडून एक मूलभूत हक्क हिरावतो. सर्वोच्च न्यायालय तो रद्द करते. निवडून न आलेले न्यायाधीश जनतेच्या निवडून आलेल्या प्रतिनिधींना कसे उलटवू शकतात?",
        },
        choices: [
          {
            en: "Because the Constitution, not the majority, is supreme: the people themselves placed fundamental rights above ordinary law, so a court enforcing them is not defying democracy but protecting the deeper rule that even a majority agreed to obey",
            hi: "क्योंकि सर्वोच्च बहुमत नहीं, संविधान है: जनता ने स्वयं मूल अधिकारों को सामान्य क़ानून से ऊपर रखा, अतः उन्हें लागू करती अदालत लोकतंत्र की अवज्ञा नहीं, बल्कि उस गहरे नियम की रक्षा करती है जिसे मानने पर बहुमत भी सहमत हुआ था",
            mr: "कारण सर्वोच्च बहुमत नव्हे, संविधान आहे: जनतेनेच मूलभूत हक्क सामान्य कायद्याहून वर ठेवले, म्हणून ते राबवणारे न्यायालय लोकशाहीची अवज्ञा नव्हे, तर बहुमतानेही मानायचे कबूल केलेल्या खोल नियमाचे रक्षण करते",
          },
          {
            en: "Judges are simply more powerful than parliaments",
            hi: "न्यायाधीश बस संसदों से अधिक शक्तिशाली हैं",
            mr: "न्यायाधीश नुसते संसदांहून अधिक शक्तिशाली",
          },
          {
            en: "The majority is always wrong and the court always right",
            hi: "बहुमत हमेशा ग़लत और अदालत हमेशा सही",
            mr: "बहुमत नेहमी चूक आणि न्यायालय नेहमी बरोबर",
          },
          {
            en: "It cannot; a majority law can never be struck down",
            hi: "नहीं कर सकते; बहुमत का क़ानून कभी रद्द नहीं हो सकता",
            mr: "करू शकत नाहीत; बहुमताचा कायदा कधीच रद्द होऊ शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Democracy is not merely the rule of the current majority; it is the rule of the Constitution, which the people ratified as a promise binding even themselves. In writing fundamental rights and placing them beyond ordinary legislation, the people effectively said: some things a majority may NOT do, however large it grows — for a majority that can strip any minority of its rights today could strip yours tomorrow. The court, in striking down such a law, is not the people's master but their long memory, holding the transient majority to the lasting agreement. This is why constitutional democracy protects the minority from the majority — and why the judiciary sits outside the ballot's reach precisely so it can guard the rules the ballot itself must obey.",
          hi: "लोकतंत्र केवल मौजूदा बहुमत का शासन नहीं; वह संविधान का शासन है, जिसे जनता ने ख़ुद को भी बाँधने वाले वादे के रूप में मंज़ूर किया। मूल अधिकार लिखकर और उन्हें सामान्य विधान से परे रखकर, जनता ने असल में कहा: कुछ चीज़ें बहुमत नहीं कर सकता, चाहे वह कितना ही बड़ा हो — क्योंकि जो बहुमत आज किसी अल्पसंख्यक के अधिकार छीन सकता है, वह कल आपके छीन सकता है। ऐसा क़ानून रद्द करती अदालत जनता की स्वामी नहीं, उसकी लंबी स्मृति है, जो क्षणिक बहुमत को टिकाऊ समझौते पर बाँधे रखती है। इसीलिए संवैधानिक लोकतंत्र अल्पसंख्यक को बहुमत से बचाता है — और इसीलिए न्यायपालिका मतपेटी की पहुँच से बाहर बैठती है, ठीक इसलिए कि वह उन नियमों की रक्षा कर सके जिन्हें मतपेटी को भी मानना है।",
          mr: "लोकशाही म्हणजे केवळ सध्याच्या बहुमताचे राज्य नव्हे; ती संविधानाचे राज्य, जे जनतेने स्वतःलाही बांधणारे वचन म्हणून मान्य केले. मूलभूत हक्क लिहून आणि ते सामान्य कायद्यापलीकडे ठेवून, जनतेने खरे तर म्हटले: काही गोष्टी बहुमत करू शकत नाही, ते कितीही मोठे झाले तरी — कारण जे बहुमत आज एखाद्या अल्पसंख्याकाचे हक्क हिरावू शकते, ते उद्या तुमचे हिरावू शकते. असा कायदा रद्द करणारे न्यायालय जनतेचे मालक नव्हे, तिची दीर्घ स्मृती, क्षणिक बहुमताला टिकाऊ करारावर बांधून ठेवणारी. म्हणूनच घटनात्मक लोकशाही अल्पसंख्याकाला बहुमतापासून राखते — आणि म्हणूनच न्यायपालिका मतपेटीच्या आवाक्याबाहेर बसते, नेमके यासाठी की तिला मतपेटीलाही पाळाव्या लागणाऱ्या नियमांचे रक्षण करता यावे.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Parliament and the Making of Laws                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-8-parliament",
    subject: "CIVICS",
    classLevel: 8,
    chapter: {
      en: "Chapter 3 — Parliament and the Making of Laws",
      hi: "अध्याय 3 — संसद और क़ानूनों का निर्माण",
      mr: "प्रकरण 3 — संसद आणि कायद्यांची निर्मिती",
    },
    name: {
      en: "Parliament and the Making of Laws",
      hi: "संसद और क़ानूनों का निर्माण",
      mr: "संसद आणि कायद्यांची निर्मिती",
    },
    summary: {
      en: "Where the nation's laws are made: two houses and the people's own directly-elected chamber, a bill argued into an Act, the majority that seats a government — and the vote that ties every law back to the governed.",
      hi: "जहाँ राष्ट्र के क़ानून बनते हैं: दो सदन और जनता का सीधे चुना कक्ष, बहस में क़ानून बनता विधेयक, सरकार बिठाता बहुमत — और वह वोट जो हर क़ानून को शासितों से बाँधता है।",
      mr: "जिथे राष्ट्राचे कायदे बनतात: दोन सभागृहे आणि जनतेचे थेट निवडलेले सभागृह, चर्चेत कायदा होणारे विधेयक, सरकार बसवणारे बहुमत — आणि प्रत्येक कायद्याला शासितांशी बांधणारे मत.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "parliament",
        name: { en: "Parliament", hi: "संसद", mr: "संसद" },
        kind: "institution",
        prompt: {
          en: "Which supreme law-making body of India is made of two houses and the President together?",
          hi: "भारत का कौन-सा सर्वोच्च क़ानून बनाने वाला निकाय दो सदनों और राष्ट्रपति से मिलकर बनता है?",
          mr: "भारताचे कोणते सर्वोच्च कायदा बनवणारे मंडळ दोन सभागृहे आणि राष्ट्रपती मिळून बनते?",
        },
        statement: {
          en: "Parliament is the nation's law-maker — two houses and the President, where the people's laws are debated and passed.",
          hi: "संसद राष्ट्र की क़ानून-निर्माता है — दो सदन और राष्ट्रपति, जहाँ जनता के क़ानूनों पर बहस होती और वे पारित होते हैं।",
          mr: "संसद ही राष्ट्राची कायदा-निर्माती — दोन सभागृहे आणि राष्ट्रपती, जिथे जनतेच्या कायद्यांवर चर्चा होते आणि ते संमत होतात.",
        },
        pair: {
          left: {
            en: "The nation's law-maker",
            hi: "राष्ट्र की क़ानून-निर्माता",
            mr: "राष्ट्राची कायदा-निर्माती",
          },
          right: {
            en: "two houses and the President",
            hi: "दो सदन और राष्ट्रपति",
            mr: "दोन सभागृहे आणि राष्ट्रपती",
          },
        },
      },
      {
        id: "lok-sabha",
        name: { en: "The Lok Sabha", hi: "लोक सभा", mr: "लोकसभा" },
        kind: "house",
        prompt: {
          en: "Which house of Parliament is directly elected by the people, and whose majority decides who forms the government?",
          hi: "संसद का कौन-सा सदन जनता द्वारा सीधे चुना जाता है, और जिसका बहुमत तय करता है कि सरकार कौन बनाए?",
          mr: "संसदेचे कोणते सभागृह जनतेकडून थेट निवडले जाते, आणि ज्याचे बहुमत सरकार कोण बनवणार हे ठरवते?",
        },
        statement: {
          en: "The Lok Sabha is the people's directly-elected house — its majority makes the government and its floor decides money bills.",
          hi: "लोक सभा जनता का सीधे चुना सदन है — उसका बहुमत सरकार बनाता है और उसका पटल धन-विधेयक तय करता है।",
          mr: "लोकसभा हे जनतेचे थेट निवडलेले सभागृह — त्याचे बहुमत सरकार बनवते आणि त्याचे सभागृह धन-विधेयक ठरवते.",
        },
        detail: {
          en: "Every adult's vote in a constituency sends one member here — this house sits closest to the people.",
          hi: "किसी निर्वाचन-क्षेत्र में हर वयस्क का वोट यहाँ एक सदस्य भेजता है — यह सदन जनता के सबसे पास बैठता है।",
          mr: "एखाद्या मतदारसंघातले प्रत्येक प्रौढाचे मत इथे एक सदस्य पाठवते — हे सभागृह जनतेच्या सर्वांत जवळ बसते.",
        },
        extra: {
          en: "Its five-year term is why elections come round — the people renewing their mandate.",
          hi: "उसका पाँच साल का कार्यकाल ही कारण है कि चुनाव आते हैं — जनता अपना जनादेश नया करती हुई।",
          mr: "त्याचा पाच वर्षांचा कार्यकाळ हेच कारण की निवडणुका येतात — जनता आपला जनादेश नवा करत.",
        },
        pair: {
          left: {
            en: "The directly-elected house",
            hi: "सीधे चुना सदन",
            mr: "थेट निवडलेले सभागृह",
          },
          right: {
            en: "its majority makes the government",
            hi: "उसका बहुमत सरकार बनाता",
            mr: "त्याचे बहुमत सरकार बनवते",
          },
        },
      },
      {
        id: "rajya-sabha",
        name: { en: "The Rajya Sabha", hi: "राज्य सभा", mr: "राज्यसभा" },
        kind: "house",
        prompt: {
          en: "Which permanent 'council of states', elected by state legislatures, represents the states in Parliament and reviews the Lok Sabha's work?",
          hi: "राज्य विधानमंडलों द्वारा चुना कौन-सा स्थायी 'राज्यों का सदन' संसद में राज्यों का प्रतिनिधित्व करता और लोक सभा के काम की समीक्षा करता है?",
          mr: "राज्य विधिमंडळांकडून निवडले जाणारे कोणते कायम 'राज्यांचे सभागृह' संसदेत राज्यांचे प्रतिनिधित्व करते आणि लोकसभेच्या कामाची समीक्षा करते?",
        },
        statement: {
          en: "The Rajya Sabha represents the states — a permanent house, never fully dissolved, giving each state a voice at the centre.",
          hi: "राज्य सभा राज्यों का प्रतिनिधित्व करती है — एक स्थायी सदन, कभी पूरी तरह भंग नहीं, हर राज्य को केंद्र में आवाज़ देता हुआ।",
          mr: "राज्यसभा राज्यांचे प्रतिनिधित्व करते — एक कायम सभागृह, कधीही पूर्ण बरखास्त न होणारे, प्रत्येक राज्याला केंद्रात आवाज देत.",
        },
        pair: {
          left: {
            en: "The council of states",
            hi: "राज्यों का सदन",
            mr: "राज्यांचे सभागृह",
          },
          right: {
            en: "a permanent reviewing house",
            hi: "स्थायी समीक्षक सदन",
            mr: "कायम समीक्षक सभागृह",
          },
        },
      },
      {
        id: "bill-to-act",
        name: { en: "From bill to Act", hi: "विधेयक से अधिनियम तक", mr: "विधेयकापासून अधिनियमापर्यंत" },
        kind: "process",
        prompt: {
          en: "A proposed law, debated and passed by both houses and signed by the President, becomes what — the finished law of the land?",
          hi: "प्रस्तावित क़ानून, दोनों सदनों में बहस और पारित होकर और राष्ट्रपति के हस्ताक्षर से, क्या बन जाता है — देश का पूरा क़ानून?",
          mr: "प्रस्तावित कायदा, दोन्ही सभागृहांत चर्चा होऊन संमत झाल्यावर आणि राष्ट्रपतींच्या सहीने, काय होतो — देशाचा पूर्ण कायदा?",
        },
        statement: {
          en: "A bill becomes an Act only after both houses pass it and the President assents — debate, not decree, is how a law is born.",
          hi: "विधेयक तभी अधिनियम बनता है जब दोनों सदन उसे पारित करें और राष्ट्रपति सहमति दें — क़ानून बहस से जन्मता है, फ़रमान से नहीं।",
          mr: "विधेयक तेव्हाच अधिनियम होते जेव्हा दोन्ही सभागृहे ते संमत करतात आणि राष्ट्रपती संमती देतात — कायदा चर्चेतून जन्मतो, हुकुमातून नाही.",
        },
        detail: {
          en: "The long road — readings, committee scrutiny, both houses, assent — is deliberate: haste is how bad laws are made.",
          hi: "लंबी राह — वाचन, समिति-जाँच, दोनों सदन, सहमति — सोची-समझी है: जल्दबाज़ी से ही बुरे क़ानून बनते हैं।",
          mr: "लांब वाट — वाचने, समिती-छाननी, दोन्ही सभागृहे, संमती — विचारपूर्वक: घाईनेच वाईट कायदे बनतात.",
        },
        extra: {
          en: "Every clause can be questioned before it binds a billion people — the debate is the safeguard.",
          hi: "अरब लोगों को बाँधने से पहले हर धारा पर सवाल हो सकता है — बहस ही सुरक्षा है।",
          mr: "अब्ज लोकांना बांधण्याआधी प्रत्येक कलमावर प्रश्न होऊ शकतो — चर्चा हीच सुरक्षा.",
        },
        pair: {
          left: {
            en: "A proposal argued through",
            hi: "बहस से गुज़रा प्रस्ताव",
            mr: "चर्चेतून गेलेला प्रस्ताव",
          },
          right: {
            en: "born by debate, not decree",
            hi: "बहस से जन्मा, फ़रमान से नहीं",
            mr: "चर्चेतून जन्मलेला, हुकुमातून नाही",
          },
        },
      },
      {
        id: "ruling-opposition",
        name: {
          en: "Ruling party and Opposition",
          hi: "सत्ता-पक्ष और विपक्ष",
          mr: "सत्ताधारी पक्ष आणि विरोधी पक्ष",
        },
        kind: "structure",
        prompt: {
          en: "The party with a Lok Sabha majority forms the government; the rest question and check it. What is that questioning side called?",
          hi: "लोक सभा में बहुमत वाला दल सरकार बनाता है; बाक़ी उससे सवाल करते और उसे रोकते हैं। उस सवाल करते पक्ष को क्या कहते हैं?",
          mr: "लोकसभेत बहुमत असलेला पक्ष सरकार बनवतो; बाकीचे त्याला प्रश्न विचारतात आणि रोखतात. त्या प्रश्न विचारणाऱ्या बाजूला काय म्हणतात?",
        },
        statement: {
          en: "The majority rules and the Opposition checks — a government kept answering to those it did not defeat.",
          hi: "बहुमत शासन करता है और विपक्ष रोकता है — एक सरकार उन्हें जवाबदेह जिन्हें उसने नहीं हराया।",
          mr: "बहुमत राज्य करते आणि विरोधी पक्ष रोखतो — ज्यांना हरवले नाही त्यांना उत्तरदायी असलेले सरकार.",
        },
        pair: {
          left: {
            en: "The Opposition benches",
            hi: "विपक्ष की बेंचें",
            mr: "विरोधी पक्षाची बाके",
          },
          right: {
            en: "government kept answering",
            hi: "जवाब देती रहती सरकार",
            mr: "उत्तर देत राहणारे सरकार",
          },
        },
      },
      {
        id: "universal-franchise",
        name: {
          en: "Universal adult franchise",
          hi: "सार्वभौम वयस्क मताधिकार",
          mr: "सार्वत्रिक प्रौढ मताधिकार",
        },
        kind: "foundation",
        prompt: {
          en: "Which right — every adult's equal vote — is the foundation that makes Parliament the people's, and its laws their own?",
          hi: "कौन-सा अधिकार — हर वयस्क का बराबर वोट — वह नींव है जो संसद को जनता की और उसके क़ानूनों को उनका अपना बनाता है?",
          mr: "कोणता हक्क — प्रत्येक प्रौढाचे समान मत — तो पाया आहे जो संसदेला जनतेची आणि तिच्या कायद्यांना त्यांचे स्वतःचे करतो?",
        },
        statement: {
          en: "Universal adult franchise is Parliament's foundation — because every adult chooses the law-makers, the laws trace back to the people.",
          hi: "सार्वभौम वयस्क मताधिकार संसद की नींव है — क्योंकि हर वयस्क क़ानून-निर्माता चुनता है, क़ानून जनता तक लौटते हैं।",
          mr: "सार्वत्रिक प्रौढ मताधिकार हा संसदेचा पाया — कारण प्रत्येक प्रौढ कायदा-निर्माते निवडतो, कायदे जनतेकडे परततात.",
        },
        pair: {
          left: {
            en: "Every adult's equal vote",
            hi: "हर वयस्क का बराबर वोट",
            mr: "प्रत्येक प्रौढाचे समान मत",
          },
          right: {
            en: "laws traced back to the people",
            hi: "जनता तक लौटते क़ानून",
            mr: "जनतेकडे परतणारे कायदे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Trace a bill's journey to becoming law. Which order is right?",
          hi: "विधेयक की क़ानून बनने तक की यात्रा को क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "विधेयकाचा कायदा होण्यापर्यंतचा प्रवास क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "A bill is introduced and debated → passed by the Lok Sabha → passed by the Rajya Sabha → signed by the President → it becomes an Act",
            hi: "विधेयक प्रस्तुत और बहस होता है → लोक सभा में पारित → राज्य सभा में पारित → राष्ट्रपति के हस्ताक्षर → वह अधिनियम बनता है",
            mr: "विधेयक मांडले आणि चर्चा होते → लोकसभेत संमत → राज्यसभेत संमत → राष्ट्रपतींची सही → ते अधिनियम होते",
          },
          {
            en: "The President signs → the Lok Sabha debates → it becomes an Act → the Rajya Sabha votes",
            hi: "राष्ट्रपति हस्ताक्षर करते हैं → लोक सभा बहस करती है → वह अधिनियम बनता है → राज्य सभा वोट देती है",
            mr: "राष्ट्रपती सही करतात → लोकसभा चर्चा करते → ते अधिनियम होते → राज्यसभा मत देते",
          },
          {
            en: "It becomes an Act → is introduced → both houses pass it → the President signs",
            hi: "वह अधिनियम बनता है → प्रस्तुत होता है → दोनों सदन पारित करते हैं → राष्ट्रपति हस्ताक्षर करते हैं",
            mr: "ते अधिनियम होते → मांडले जाते → दोन्ही सभागृहे संमत करतात → राष्ट्रपती सही करतात",
          },
          {
            en: "Only the Rajya Sabha is involved; the Lok Sabha never sees a bill",
            hi: "केवल राज्य सभा शामिल होती है; लोक सभा कभी विधेयक नहीं देखती",
            mr: "फक्त राज्यसभा सामील; लोकसभा कधीही विधेयक पाहत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A law is built by consent gathered at each gate. First the bill is aired and argued; then it must win a majority in the elected Lok Sabha; then it must satisfy the states' house, the Rajya Sabha; only then does the President's signature turn proposal into Act. Every gate is a chance to amend or reject — the length of the road is exactly what stops a hasty or narrow measure from binding the whole nation. Skip a step and the consent chain snaps.",
          hi: "क़ानून हर द्वार पर जुटाई सहमति से बनता है। पहले विधेयक हवा में आता और उस पर बहस होती है; फिर उसे निर्वाचित लोक सभा में बहुमत जीतना होता है; फिर राज्यों के सदन, राज्य सभा को संतुष्ट करना होता है; तभी राष्ट्रपति का हस्ताक्षर प्रस्ताव को अधिनियम बनाता है। हर द्वार संशोधन या अस्वीकार का मौक़ा है — राह की लंबाई ही किसी जल्दबाज़ या संकीर्ण उपाय को पूरे राष्ट्र को बाँधने से रोकती है। एक चरण छोड़िए और सहमति की कड़ी टूट जाती है।",
          mr: "कायदा प्रत्येक दारावर जमवलेल्या संमतीने बांधला जातो. आधी विधेयक हवेत येते आणि त्यावर चर्चा होते; मग त्याला निवडलेल्या लोकसभेत बहुमत जिंकावे लागते; मग राज्यांच्या सभागृहाला, राज्यसभेला समाधानी करावे लागते; तेव्हाच राष्ट्रपतींची सही प्रस्तावाला अधिनियम करते. प्रत्येक दार म्हणजे दुरुस्ती वा नकाराची संधी — वाटेची लांबीच एखाद्या घाईच्या वा संकुचित उपायाला अख्ख्या राष्ट्राला बांधण्यापासून रोखते. एक टप्पा वगळा आणि संमतीची साखळी तुटते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Passing a law takes months of readings, committees and two houses — while a company can change its policy in a day. Why is Parliament's slowness a FEATURE, not a flaw?",
          hi: "क़ानून पास करने में महीनों की वाचन, समितियाँ और दो सदन लगते हैं — जबकि कंपनी एक दिन में नीति बदल सकती है। संसद की धीमी गति ख़ूबी क्यों है, ख़ामी नहीं?",
          mr: "कायदा पास करायला महिन्यांची वाचने, समित्या आणि दोन सभागृहे लागतात — तर कंपनी एका दिवसात धोरण बदलू शकते. संसदेची संथगती ही खुबी का, दोष का नाही?",
        },
        choices: [
          {
            en: "A law binds everyone by force and is hard to undo, so the deliberate slowness — many voices, many gates, time to spot harm — is a safeguard against a hasty measure that could crush a minority or entrench a mistake for years",
            hi: "क़ानून सबको बल से बाँधता है और उसे पलटना कठिन है, अतः सोची-समझी धीमी गति — कई आवाज़ें, कई द्वार, नुक़सान पहचानने का समय — एक जल्दबाज़ उपाय के विरुद्ध सुरक्षा है जो किसी अल्पसंख्यक को कुचल सकता या बरसों एक ग़लती जमा सकता था",
            mr: "कायदा साऱ्यांना बलाने बांधतो आणि तो उलटवणे कठीण, म्हणून विचारपूर्वक संथगती — अनेक आवाज, अनेक दारे, हानी ओळखायला वेळ — एका घाईच्या उपायाविरुद्ध सुरक्षा जो एखाद्या अल्पसंख्याकाला चिरडू शके वा वर्षानुवर्षे एक चूक रुजवू शके",
          },
          {
            en: "Parliament is slow only because its members are lazy",
            hi: "संसद केवल इसलिए धीमी है कि उसके सदस्य आलसी हैं",
            mr: "संसद फक्त म्हणून संथ की तिचे सदस्य आळशी",
          },
          {
            en: "Laws should in fact be passed as fast as company policies",
            hi: "क़ानून सचमुच कंपनी की नीतियों जितनी तेज़ी से पास होने चाहिए",
            mr: "कायदे खरे तर कंपनी धोरणांइतक्या वेगाने पास व्हावेत",
          },
          {
            en: "The slowness has no purpose and should be removed",
            hi: "धीमी गति का कोई मक़सद नहीं और उसे हटा देना चाहिए",
            mr: "संथगतीला हेतू नाही आणि ती काढून टाकावी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Speed and reversibility trade off against each other. A company's policy binds only its own staff and can be rewritten tomorrow if it fails; a law binds a billion strangers by the force of the state and, once entrenched, resists change for years. When the cost of a mistake is that high and that lasting, haste is the danger, not delay. So Parliament builds friction in on purpose: multiple readings to expose flaws, committees to hear the affected, two houses to catch what one missed, an Opposition paid to object, and time enough for the public to react. The months are not wasted — they are the price of not ruling a nation by whim. A government that could make law in a day could unmake a right in a day, and the slowness is precisely what stands between a passing majority and a permanent wrong.",
          hi: "रफ़्तार और पलटने की सुविधा एक-दूसरे से सौदा करती हैं। कंपनी की नीति केवल उसके अपने कर्मचारियों को बाँधती है और विफल होने पर कल फिर लिखी जा सकती है; क़ानून राज्य के बल से अरबों अजनबियों को बाँधता है और जम जाने पर बरसों बदलाव का विरोध करता है। जब ग़लती का दाम इतना ऊँचा और इतना टिकाऊ हो, तो ख़तरा जल्दबाज़ी है, देरी नहीं। अतः संसद जान-बूझकर घर्षण बनाती है: दोष उजागर करने को कई वाचन, प्रभावितों को सुनने को समितियाँ, एक की चूक पकड़ने को दो सदन, एतराज़ के लिए वेतनभोगी विपक्ष, और जनता की प्रतिक्रिया भर का समय। महीने बर्बाद नहीं होते — वे राष्ट्र को सनक से न चलाने का दाम हैं। जो सरकार एक दिन में क़ानून बना सके वह एक दिन में अधिकार मिटा सके, और वही धीमी गति एक क्षणिक बहुमत और एक स्थायी अन्याय के बीच खड़ी है।",
          mr: "वेग आणि उलटवण्याची सोय एकमेकांशी सौदा करतात. कंपनीचे धोरण फक्त तिच्या स्वतःच्या कर्मचाऱ्यांना बांधते आणि फसल्यास उद्या पुन्हा लिहिता येते; कायदा राज्याच्या बलाने अब्जावधी अनोळखींना बांधतो आणि रुजल्यावर वर्षानुवर्षे बदलाला विरोध करतो. जेव्हा चुकीची किंमत इतकी जास्त आणि इतकी टिकाऊ, तेव्हा धोका घाई आहे, उशीर नाही. म्हणून संसद मुद्दाम घर्षण बांधते: दोष उघड करायला अनेक वाचने, बाधितांना ऐकायला समित्या, एकाची चूक पकडायला दोन सभागृहे, आक्षेपासाठी पगारी विरोधी पक्ष, आणि जनतेच्या प्रतिक्रियेइतका वेळ. महिने वाया जात नाहीत — ते राष्ट्राला लहरीने न चालवण्याची किंमत. जे सरकार एका दिवसात कायदा करू शके ते एका दिवसात हक्क पुसू शके, आणि तीच संथगती एका क्षणिक बहुमतात आणि एका कायम अन्यायात उभी असते.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Judiciary (the court that binds even the powerful)          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-8-judiciary",
    subject: "CIVICS",
    classLevel: 8,
    chapter: {
      en: "Chapter 5 — Judiciary",
      hi: "अध्याय 5 — न्यायपालिका",
      mr: "प्रकरण 5 — न्यायपालिका",
    },
    name: { en: "Judiciary", hi: "न्यायपालिका", mr: "न्यायपालिका" },
    summary: {
      en: "The third organ that answers to no vote so it can bind every power: an independent court ladder, one law over minister and mason, a postcard that a court can treat as a petition — and justice that must reach the poorest to be justice at all.",
      hi: "वह तीसरा अंग जो किसी वोट को जवाबदेह नहीं ताकि हर सत्ता को बाँध सके: स्वतंत्र अदालत-सीढ़ी, मंत्री और राजगीर पर एक क़ानून, एक पोस्टकार्ड जिसे अदालत याचिका मान ले — और न्याय जिसे न्याय होने के लिए सबसे ग़रीब तक पहुँचना होगा।",
      mr: "कोणत्याही मताला उत्तरदायी नसलेले तिसरे अंग म्हणून ते प्रत्येक सत्तेला बांधू शकते: स्वतंत्र न्यायालय-शिडी, मंत्री आणि गवंड्यावर एकच कायदा, एक पोस्टकार्ड जे न्यायालय याचिका मानू शकते — आणि न्याय जो न्याय होण्यासाठी सर्वांत गरिबापर्यंत पोहोचावाच लागेल.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "judiciary",
        name: { en: "The judiciary", hi: "न्यायपालिका", mr: "न्यायपालिका" },
        kind: "organ",
        prompt: {
          en: "Which organ of government interprets the law, settles disputes and can strike down actions that break the Constitution?",
          hi: "सरकार का कौन-सा अंग क़ानून की व्याख्या करता है, विवाद सुलझाता है और संविधान तोड़ती कार्रवाइयों को रद्द कर सकता है?",
          mr: "सरकारचे कोणते अंग कायद्याचा अर्थ लावते, वाद सोडवते आणि संविधान मोडणाऱ्या कृती रद्द करू शकते?",
        },
        statement: {
          en: "The judiciary interprets the law and guards the Constitution — the umpire empowered to call even the government out.",
          hi: "न्यायपालिका क़ानून की व्याख्या करती और संविधान की रक्षा करती है — वह निर्णायक जो सरकार को भी ग़लत ठहरा सकता है।",
          mr: "न्यायपालिका कायद्याचा अर्थ लावते आणि संविधानाचे रक्षण करते — सरकारलाही चूक ठरवण्याचा अधिकार असलेला पंच.",
        },
        pair: {
          left: {
            en: "The interpreter and guard",
            hi: "व्याख्याकार और रक्षक",
            mr: "अर्थ लावणारा आणि रक्षक",
          },
          right: {
            en: "can call the government out",
            hi: "सरकार को भी ग़लत ठहराए",
            mr: "सरकारलाही चूक ठरवू शके",
          },
        },
      },
      {
        id: "independence",
        name: {
          en: "Judicial independence",
          hi: "न्यायिक स्वतंत्रता",
          mr: "न्यायिक स्वातंत्र्य",
        },
        kind: "principle",
        prompt: {
          en: "Which principle keeps judges free of pressure from ministers and majorities, so they can rule against the powerful without fear?",
          hi: "कौन-सा सिद्धांत न्यायाधीशों को मंत्रियों और बहुमतों के दबाव से मुक्त रखता है, ताकि वे बिना डर शक्तिशाली के विरुद्ध फ़ैसला दे सकें?",
          mr: "कोणते तत्त्व न्यायाधीशांना मंत्री आणि बहुमतांच्या दबावापासून मुक्त ठेवते, जेणेकरून ते बिनधास्त शक्तिमानांविरुद्ध निवाडा देऊ शकतील?",
        },
        statement: {
          en: "Judicial independence shields the courts from pressure — secure tenure and separation from the executive let a judge rule against the government itself.",
          hi: "न्यायिक स्वतंत्रता अदालतों को दबाव से बचाती है — सुरक्षित कार्यकाल और कार्यपालिका से अलगाव न्यायाधीश को स्वयं सरकार के विरुद्ध फ़ैसला देने देते हैं।",
          mr: "न्यायिक स्वातंत्र्य न्यायालयांना दबावापासून राखते — सुरक्षित कार्यकाळ आणि कार्यकारीपासून वेगळेपणा न्यायाधीशाला स्वतः सरकारविरुद्ध निवाडा देऊ देतात.",
        },
        detail: {
          en: "A judge who could be sacked for an unwelcome verdict would not be a judge at all — independence is what makes the ruling worth anything.",
          hi: "जिस न्यायाधीश को अप्रिय फ़ैसले पर हटाया जा सके वह न्यायाधीश ही नहीं होता — स्वतंत्रता ही फ़ैसले को कुछ मोल देती है।",
          mr: "ज्या न्यायाधीशाला नकोशा निवाड्यावर काढता येईल तो न्यायाधीशच नसतो — स्वातंत्र्यच निवाड्याला मोल देते.",
        },
        extra: {
          en: "Removing a judge is made deliberately hard — a fortress wall around the umpire's neutrality.",
          hi: "न्यायाधीश को हटाना जान-बूझकर कठिन बनाया गया है — निर्णायक की तटस्थता के गिर्द क़िले की दीवार।",
          mr: "न्यायाधीशाला काढणे मुद्दाम कठीण केले आहे — पंचाच्या तटस्थतेभोवती किल्ल्याची भिंत.",
        },
        pair: {
          left: {
            en: "Judges free of pressure",
            hi: "दबाव से मुक्त न्यायाधीश",
            mr: "दबावमुक्त न्यायाधीश",
          },
          right: {
            en: "may rule against the powerful",
            hi: "शक्तिशाली के विरुद्ध फ़ैसला",
            mr: "शक्तिमानांविरुद्ध निवाडा",
          },
        },
      },
      {
        id: "court-ladder",
        name: {
          en: "The court hierarchy",
          hi: "अदालतों का पदानुक्रम",
          mr: "न्यायालयांची उतरंड",
        },
        kind: "structure",
        prompt: {
          en: "District courts, High Courts, and the Supreme Court at the top — which tiered structure lets a case be appealed upward?",
          hi: "ज़िला अदालतें, उच्च न्यायालय, और शीर्ष पर उच्चतम न्यायालय — कौन-सी स्तरीय संरचना किसी मामले को ऊपर अपील करने देती है?",
          mr: "जिल्हा न्यायालये, उच्च न्यायालये, आणि शिखरावर सर्वोच्च न्यायालय — कोणती स्तरीय रचना एखाद्या खटल्याला वर अपील करू देते?",
        },
        statement: {
          en: "The courts form a ladder — district, High, Supreme — so a wronged party can appeal a verdict upward for another hearing.",
          hi: "अदालतें एक सीढ़ी बनाती हैं — ज़िला, उच्च, उच्चतम — ताकि पीड़ित पक्ष किसी फ़ैसले को ऊपर अपील कर दोबारा सुनवाई पा सके।",
          mr: "न्यायालये एक शिडी बनवतात — जिल्हा, उच्च, सर्वोच्च — जेणेकरून बाधित पक्ष एखाद्या निवाड्याला वर अपील करून पुन्हा सुनावणी मिळवू शके.",
        },
        detail: {
          en: "The Supreme Court's word is final — but the ladder means no single judge's error is the last word.",
          hi: "उच्चतम न्यायालय का शब्द अंतिम है — पर सीढ़ी का अर्थ है कि किसी एक न्यायाधीश की चूक आख़िरी शब्द नहीं।",
          mr: "सर्वोच्च न्यायालयाचा शब्द अंतिम — पण शिडी म्हणजे कोणत्याही एका न्यायाधीशाची चूक शेवटचा शब्द नाही.",
        },
        extra: {
          en: "Appeal is a right, not a favour — the ladder is built so justice can correct itself.",
          hi: "अपील अधिकार है, मेहरबानी नहीं — सीढ़ी इसलिए बनी कि न्याय ख़ुद को सुधार सके।",
          mr: "अपील हा हक्क, मेहेरबानी नाही — शिडी यासाठी की न्याय स्वतःला दुरुस्त करू शके.",
        },
        pair: {
          left: {
            en: "District, High, Supreme",
            hi: "ज़िला, उच्च, उच्चतम",
            mr: "जिल्हा, उच्च, सर्वोच्च",
          },
          right: {
            en: "a verdict may be appealed up",
            hi: "फ़ैसला ऊपर अपील करने योग्य",
            mr: "निवाडा वर अपील करण्याजोगा",
          },
        },
      },
      {
        id: "rule-of-law",
        name: { en: "The rule of law", hi: "क़ानून का शासन", mr: "कायद्याचे राज्य" },
        kind: "principle",
        prompt: {
          en: "Which principle holds that one and the same law applies to everyone — minister and mason, rich and poor alike?",
          hi: "कौन-सा सिद्धांत मानता है कि एक ही क़ानून सब पर लागू होता है — मंत्री और राजगीर, अमीर और ग़रीब सब पर बराबर?",
          mr: "कोणते तत्त्व मानते की एकच कायदा साऱ्यांना लागू होतो — मंत्री आणि गवंडी, श्रीमंत आणि गरीब सर्वांना समान?",
        },
        statement: {
          en: "The rule of law means no one is above the law — the same rules bind the minister and the mason, and the court enforces them equally.",
          hi: "क़ानून का शासन यानी कोई क़ानून से ऊपर नहीं — वही नियम मंत्री और राजगीर को बाँधते हैं, और अदालत उन्हें समान रूप से लागू करती है।",
          mr: "कायद्याचे राज्य म्हणजे कोणी कायद्याहून वर नाही — तेच नियम मंत्री आणि गवंड्याला बांधतात, आणि न्यायालय ते समानपणे राबवते.",
        },
        pair: {
          left: {
            en: "One law for all",
            hi: "सबके लिए एक क़ानून",
            mr: "साऱ्यांसाठी एक कायदा",
          },
          right: {
            en: "no one above it",
            hi: "कोई उससे ऊपर नहीं",
            mr: "कोणी त्याहून वर नाही",
          },
        },
      },
      {
        id: "pil",
        name: {
          en: "Public Interest Litigation",
          hi: "जनहित याचिका",
          mr: "जनहित याचिका",
        },
        kind: "innovation",
        prompt: {
          en: "Which legal innovation lets any citizen — or even a letter to the court — raise a matter of public wrong on behalf of those too poor or weak to sue?",
          hi: "कौन-सा क़ानूनी नवाचार किसी भी नागरिक — या अदालत को लिखे पत्र तक — को उन लोगों की ओर से जन-अन्याय उठाने देता है जो मुक़दमे के लिए बहुत ग़रीब या कमज़ोर हैं?",
          mr: "कोणता कायदेशीर नवोपक्रम कोणत्याही नागरिकाला — किंवा न्यायालयाला लिहिलेल्या पत्रालाही — खटल्यासाठी फार गरीब वा दुबळ्या असलेल्यांच्या वतीने जन-अन्याय मांडू देतो?",
        },
        statement: {
          en: "Public Interest Litigation opened the court's door — anyone can now raise a public wrong, and even a postcard has been treated as a petition.",
          hi: "जनहित याचिका ने अदालत का दरवाज़ा खोल दिया — अब कोई भी जन-अन्याय उठा सकता है, और एक पोस्टकार्ड तक याचिका मान लिया गया है।",
          mr: "जनहित याचिकेने न्यायालयाचे दार उघडले — आता कोणीही जन-अन्याय मांडू शकतो, आणि एका पोस्टकार्डालाही याचिका मानले गेले आहे.",
        },
        detail: {
          en: "It turned the court from a rich person's forum into a poor person's recourse — access, not just rights, made real.",
          hi: "इसने अदालत को धनी के मंच से ग़रीब के सहारे में बदल दिया — केवल अधिकार नहीं, पहुँच को असली बनाया।",
          mr: "याने न्यायालयाला श्रीमंताच्या व्यासपीठातून गरिबाच्या आधारात बदलले — केवळ हक्क नव्हे, पोहोच खरी केली.",
        },
        extra: {
          en: "A right you cannot afford to claim is no right at all — PIL was the bridge across the fee.",
          hi: "जिस अधिकार का दावा आप कर न सकें वह अधिकार ही नहीं — जनहित याचिका फ़ीस के पार का पुल थी।",
          mr: "ज्या हक्काचा दावा तुम्हाला परवडत नाही तो हक्कच नाही — जनहित याचिका ही फीपलीकडचा पूल.",
        },
        pair: {
          left: {
            en: "A postcard as a petition",
            hi: "याचिका बना पोस्टकार्ड",
            mr: "याचिका झालेले पोस्टकार्ड",
          },
          right: {
            en: "the court's door opened wide",
            hi: "चौड़ा खुला अदालत का द्वार",
            mr: "रुंद उघडलेले न्यायालयाचे दार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the safeguard to what it secures: A-judicial independence, B-the court hierarchy, C-Public Interest Litigation. Which trio is right?",
          hi: "सुरक्षा को उसकी गारंटी से मिलाइए: अ-न्यायिक स्वतंत्रता, ब-अदालतों का पदानुक्रम, स-जनहित याचिका। कौन-सी तिकड़ी सही है?",
          mr: "सुरक्षेला ती जे राखते त्याशी जुळवा: अ-न्यायिक स्वातंत्र्य, ब-न्यायालयांची उतरंड, क-जनहित याचिका. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: judges can rule without fear · B: a wrong verdict can be appealed · C: even the poor can reach the court",
            hi: "अ: न्यायाधीश बिना डर फ़ैसला दें · ब: ग़लत फ़ैसले की अपील हो सके · स: ग़रीब भी अदालत तक पहुँचे",
            mr: "अ: न्यायाधीश बिनधास्त निवाडा देतील · ब: चुकीच्या निवाड्याची अपील होऊ शके · क: गरीबही न्यायालयापर्यंत पोहोचेल",
          },
          {
            en: "A: even the poor can reach the court · B: judges rule without fear · C: verdicts can be appealed",
            hi: "अ: ग़रीब भी अदालत तक पहुँचे · ब: न्यायाधीश बिना डर फ़ैसला दें · स: फ़ैसलों की अपील हो",
            mr: "अ: गरीबही न्यायालयापर्यंत पोहोचेल · ब: न्यायाधीश बिनधास्त निवाडा देतील · क: निवाड्यांची अपील होऊ शके",
          },
          {
            en: "A: verdicts can be appealed · B: the poor can reach the court · C: judges rule without fear",
            hi: "अ: फ़ैसलों की अपील हो · ब: ग़रीब अदालत तक पहुँचे · स: न्यायाधीश बिना डर फ़ैसला दें",
            mr: "अ: निवाड्यांची अपील होऊ शके · ब: गरीब न्यायालयापर्यंत पोहोचेल · क: न्यायाधीश बिनधास्त निवाडा देतील",
          },
          {
            en: "All three secure exactly the same thing",
            hi: "तीनों ठीक एक ही चीज़ की गारंटी देते हैं",
            mr: "तिघेही नेमकी एकच गोष्ट राखतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three defects of justice, three defences. Independence answers the fear that a judge might be leaned on — secure the judge, and the verdict can defy the mighty. The hierarchy answers the fear that a single court might err — allow appeal, and no one judgment is final. PIL answers the fear that justice is only for those who can pay — open the door to a letter, and the poorest gain a voice. Rights on paper mean nothing without all three; together they turn a promise into a working court.",
          hi: "न्याय के तीन दोष, तीन बचाव। स्वतंत्रता उस भय का उत्तर है कि न्यायाधीश पर दबाव पड़े — न्यायाधीश को सुरक्षित कीजिए, और फ़ैसला ताक़तवर को ठुकरा सकता है। पदानुक्रम उस भय का उत्तर है कि एक अदालत चूक जाए — अपील दीजिए, और कोई एक फ़ैसला अंतिम नहीं। जनहित याचिका उस भय का उत्तर है कि न्याय केवल चुकाने वालों के लिए है — पत्र को दरवाज़ा खोलिए, और सबसे ग़रीब को आवाज़ मिलती है। काग़ज़ के अधिकार तीनों के बिना बेमानी हैं; साथ मिलकर वे वादे को चलती अदालत बना देते हैं।",
          mr: "न्यायाचे तीन दोष, तीन बचाव. स्वातंत्र्य त्या भीतीचे उत्तर की न्यायाधीशावर दबाव येईल — न्यायाधीशाला सुरक्षित करा, आणि निवाडा बलवानाला झुगारू शके. उतरंड त्या भीतीचे उत्तर की एक न्यायालय चुकेल — अपील द्या, आणि कोणताही एक निवाडा अंतिम नाही. जनहित याचिका त्या भीतीचे उत्तर की न्याय फक्त देऊ शकणाऱ्यांसाठी — पत्राला दार उघडा, आणि सर्वांत गरिबाला आवाज मिळतो. कागदावरचे हक्क तिघांशिवाय निरर्थक; एकत्र ते वचनाला चालते न्यायालय करतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A right exists on paper, but a poor labourer cannot afford lawyers or years of hearings to claim it. Public Interest Litigation was designed to fix this. What deeper problem about justice does it reveal?",
          hi: "अधिकार काग़ज़ पर मौजूद है, पर ग़रीब मज़दूर उसे पाने के लिए वकीलों या बरसों की सुनवाई का ख़र्च नहीं उठा सकता। जनहित याचिका इसे सुधारने को बनी थी। यह न्याय के बारे में कौन-सी गहरी समस्या उजागर करती है?",
          mr: "हक्क कागदावर आहे, पण गरीब मजूर तो मिळवायला वकील वा वर्षांच्या सुनावणीचा खर्च उचलू शकत नाही. जनहित याचिका हे दुरुस्त करायला बनली होती. ती न्यायाबद्दलची कोणती खोल समस्या उघड करते?",
        },
        choices: [
          {
            en: "A right you cannot afford to enforce is not truly a right: justice must be ACCESSIBLE, not just guaranteed — so the law must reach down to the person who cannot come up to it, or equality before the law stays a promise only the rich can cash",
            hi: "जिस अधिकार को लागू कराने का ख़र्च आप न उठा सकें वह सच में अधिकार नहीं: न्याय सुलभ होना चाहिए, केवल गारंटीशुदा नहीं — अतः क़ानून को उस व्यक्ति तक नीचे पहुँचना होगा जो उस तक ऊपर नहीं आ सकता, वरना क़ानून के समक्ष समानता ऐसा वादा रहती है जिसे केवल धनी भुना सकें",
            mr: "जो हक्क राबवायला परवडत नाही तो खरे तर हक्क नाही: न्याय सुलभ हवा, केवल हमीदार नाही — म्हणून कायद्याला त्या व्यक्तीपर्यंत खाली पोहोचावे लागेल जी त्याच्यापर्यंत वर येऊ शकत नाही, नाहीतर कायद्यापुढील समता असे वचन राहते जे फक्त श्रीमंत वटवू शकतात",
          },
          {
            en: "Poor people simply do not have any rights",
            hi: "ग़रीब लोगों के पास कोई अधिकार ही नहीं होते",
            mr: "गरीब लोकांना कोणतेही हक्क नसतातच",
          },
          {
            en: "Justice was never meant for the poor anyway",
            hi: "न्याय वैसे भी ग़रीबों के लिए कभी नहीं था",
            mr: "न्याय तसाही गरिबांसाठी कधीच नव्हता",
          },
          {
            en: "Lawyers should simply work for free always",
            hi: "वकीलों को बस हमेशा मुफ़्त काम करना चाहिए",
            mr: "वकिलांनी नुसते नेहमी फुकट काम करावे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Equality before the law is hollow if reaching the law costs more than the wronged can pay. A written right is only a promise; enforcing it takes lawyers, fees, filings and the patience to survive years of hearings — resources the powerful have and the poor do not. So a right that in theory belongs to everyone in practice belongs to whoever can afford the courtroom, and 'equality before the law' quietly becomes equality among the wealthy. Public Interest Litigation attacks exactly this gap: by letting any citizen, or even a plain letter, bring a public wrong on behalf of those who cannot come themselves, it makes the court reach DOWN to the powerless instead of waiting for them to climb up. The deep lesson is that justice is not merely a set of rights but a question of access — and a right no one can afford to claim is a right in name only.",
          hi: "क़ानून के समक्ष समानता खोखली है यदि क़ानून तक पहुँचने का ख़र्च पीड़ित की क्षमता से अधिक हो। लिखा अधिकार केवल वादा है; उसे लागू कराने में वकील, फ़ीस, दाख़िले और बरसों की सुनवाई झेलने का धैर्य लगता है — संसाधन जो शक्तिशाली के पास हैं और ग़रीब के पास नहीं। अतः जो अधिकार सिद्धांत में सबका है वह व्यवहार में उसी का है जो अदालत का ख़र्च उठा सके, और 'क़ानून के समक्ष समानता' चुपचाप धनियों के बीच समानता बन जाती है। जनहित याचिका ठीक इसी खाई पर वार करती है: किसी भी नागरिक, या एक सादे पत्र तक को उन लोगों की ओर से जन-अन्याय लाने देकर जो ख़ुद नहीं आ सकते, वह अदालत को शक्तिहीन तक नीचे पहुँचाती है, उनके ऊपर चढ़ने की राह देखने की जगह। गहरा सबक़ यह कि न्याय केवल अधिकारों का समुच्चय नहीं, पहुँच का सवाल है — और जिस अधिकार का दावा कोई कर न सके वह केवल नाम का अधिकार है।",
          mr: "कायद्यापुढील समता पोकळ आहे जर कायद्यापर्यंत पोहोचण्याचा खर्च बाधिताच्या ऐपतीहून जास्त असेल. लिहिलेला हक्क केवळ वचन; तो राबवायला वकील, फी, अर्ज आणि वर्षांच्या सुनावणी सोसण्याचा धीर लागतो — साधने जी शक्तिमानांकडे आहेत आणि गरिबांकडे नाहीत. म्हणून जो हक्क सिद्धान्तात साऱ्यांचा तो व्यवहारात त्याचाच जो न्यायालयाचा खर्च उचलू शके, आणि 'कायद्यापुढील समता' गुपचूप श्रीमंतांमधली समता होते. जनहित याचिका नेमक्या याच दरीवर घाव घालते: कोणत्याही नागरिकाला, वा एका साध्या पत्रालाही, स्वतः येऊ न शकणाऱ्यांच्या वतीने जन-अन्याय आणू देऊन, ती न्यायालयाला शक्तिहीनांपर्यंत खाली पोहोचवते, त्यांनी वर चढण्याची वाट पाहण्याऐवजी. खोल धडा हा की न्याय म्हणजे केवळ हक्कांचा संच नव्हे, पोहोचेचा प्रश्न — आणि ज्या हक्काचा दावा कोणी करू शकत नाही तो केवळ नावाचा हक्क.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Understanding Marginalisation                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-8-marginalisation",
    subject: "CIVICS",
    classLevel: 8,
    chapter: {
      en: "Chapter 7 — Understanding Marginalisation",
      hi: "अध्याय 7 — हाशियाकरण को समझना",
      mr: "प्रकरण 7 — उपेक्षा समजून घेणे",
    },
    name: {
      en: "Understanding Marginalisation",
      hi: "हाशियाकरण को समझना",
      mr: "उपेक्षा समजून घेणे",
    },
    summary: {
      en: "Who gets pushed to the edge, and how the Constitution answers: communities kept from the centre by history, safeguards and reservations as ladders, a right against untouchability with teeth — and the difference between charity and a claim.",
      hi: "किसे किनारे धकेला जाता है, और संविधान कैसे उत्तर देता है: इतिहास से केंद्र से दूर रखे समुदाय, सीढ़ी बने संरक्षण और आरक्षण, दाँतों वाला अस्पृश्यता-विरोधी अधिकार — और ख़ैरात तथा हक़ का फ़र्क़।",
      mr: "कोणाला कडेला ढकलले जाते, आणि संविधान कसे उत्तर देते: इतिहासाने केंद्रापासून दूर ठेवलेले समुदाय, शिडी झालेले संरक्षण आणि आरक्षण, दात असलेला अस्पृश्यता-विरोधी हक्क — आणि दान आणि हक्क यांतला फरक.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "marginalisation",
        name: { en: "Marginalisation", hi: "हाशियाकरण", mr: "उपेक्षा" },
        kind: "idea",
        prompt: {
          en: "Which process pushes certain communities to the edges of society — out of power, resources and respect — because of who they are?",
          hi: "कौन-सी प्रक्रिया कुछ समुदायों को — वे कौन हैं इसके कारण — समाज के किनारों पर धकेल देती है, शक्ति, संसाधन और सम्मान से बाहर?",
          mr: "कोणती प्रक्रिया काही समुदायांना — ते कोण आहेत यामुळे — समाजाच्या कडेला ढकलते, सत्ता, संसाधने आणि सन्मानाबाहेर?",
        },
        statement: {
          en: "Marginalisation forces communities to the edge — held back from power, land and dignity by who they are, not what they did.",
          hi: "हाशियाकरण समुदायों को किनारे धकेलता है — शक्ति, भूमि और गरिमा से रोके गए इसलिए कि वे कौन हैं, इसलिए नहीं कि उन्होंने क्या किया।",
          mr: "उपेक्षा समुदायांना कडेला ढकलते — ते कोण आहेत यामुळे सत्ता, जमीन आणि प्रतिष्ठेपासून रोखलेले, त्यांनी काय केले यामुळे नव्हे.",
        },
        detail: {
          en: "It is not one bad act but a long pattern — history, custom and economics all pressing the same people outward.",
          hi: "यह एक बुरा कार्य नहीं, एक लंबा ढर्रा है — इतिहास, रिवाज और अर्थशास्त्र सब उन्हीं लोगों को बाहर की ओर दबाते।",
          mr: "ही एक वाईट कृती नव्हे, एक दीर्घ साचा — इतिहास, रिवाज आणि अर्थशास्त्र सारे त्याच लोकांना बाहेर दाबणारे.",
        },
        extra: {
          en: "The 'margin' is the opposite of the centre — where decisions, wealth and voice are all thin.",
          hi: "'हाशिया' केंद्र का उलटा है — जहाँ फ़ैसले, धन और आवाज़ सब पतले पड़ जाते हैं।",
          mr: "'कड' म्हणजे केंद्राचे उलटे — जिथे निर्णय, संपत्ती आणि आवाज सारे विरळ.",
        },
        pair: {
          left: {
            en: "Pushed to the edge",
            hi: "किनारे धकेला गया",
            mr: "कडेला ढकललेले",
          },
          right: {
            en: "for who they are",
            hi: "इसलिए कि वे कौन हैं",
            mr: "ते कोण आहेत यामुळे",
          },
        },
      },
      {
        id: "adivasis",
        name: { en: "The Adivasis", hi: "आदिवासी", mr: "आदिवासी" },
        kind: "community",
        prompt: {
          en: "Which original forest-dwelling communities were marginalised as their lands were taken for mines, dams and forests reserved by the state?",
          hi: "कौन-से मूल वनवासी समुदाय तब हाशिये पर धकेले गए जब उनकी भूमि खदानों, बाँधों और राज्य के आरक्षित वनों के लिए ली गई?",
          mr: "कोणते मूळ वनवासी समुदाय तेव्हा उपेक्षित झाले जेव्हा त्यांची जमीन खाणी, धरणे आणि राज्याच्या राखीव वनांसाठी घेतली गेली?",
        },
        statement: {
          en: "Adivasis, India's original forest communities, were marginalised by the loss of land — displaced for dams, mines and reserved forests.",
          hi: "आदिवासी, भारत के मूल वनवासी समुदाय, भूमि खोने से हाशिये पर धकेले गए — बाँधों, खदानों और आरक्षित वनों के लिए विस्थापित।",
          mr: "आदिवासी, भारताचे मूळ वनवासी समुदाय, जमीन गमावल्याने उपेक्षित झाले — धरणे, खाणी आणि राखीव वनांसाठी विस्थापित.",
        },
        pair: {
          left: {
            en: "The original forest people",
            hi: "मूल वनवासी लोग",
            mr: "मूळ वनवासी लोक",
          },
          right: {
            en: "marginalised by lost land",
            hi: "भूमि खोकर हाशिये पर",
            mr: "जमीन गमावून उपेक्षित",
          },
        },
      },
      {
        id: "minorities",
        name: {
          en: "Religious minorities",
          hi: "धार्मिक अल्पसंख्यक",
          mr: "धार्मिक अल्पसंख्याक",
        },
        kind: "community",
        prompt: {
          en: "Which communities, fewer in number than the majority, does the Constitution specially protect so numbers alone cannot silence them?",
          hi: "बहुसंख्यक से कम संख्या वाले किन समुदायों की संविधान विशेष रक्षा करता है ताकि केवल संख्या उन्हें चुप न करा सके?",
          mr: "बहुसंख्याकांहून कमी संख्येच्या कोणत्या समुदायांचे संविधान विशेष रक्षण करते जेणेकरून केवळ संख्या त्यांना गप्प करू शकणार नाही?",
        },
        statement: {
          en: "Religious and linguistic minorities are protected by design — the Constitution guards them precisely because numbers could otherwise overrule them.",
          hi: "धार्मिक और भाषाई अल्पसंख्यक सोच-समझकर संरक्षित हैं — संविधान उनकी रक्षा ठीक इसलिए करता है कि संख्या वरना उन्हें दबा सकती थी।",
          mr: "धार्मिक आणि भाषिक अल्पसंख्याक विचारपूर्वक संरक्षित — संविधान त्यांचे रक्षण नेमके यासाठी करते की संख्या अन्यथा त्यांना दाबू शकली असती.",
        },
        detail: {
          en: "The rights to conserve one's language and manage one's institutions are minority safeguards written into the text.",
          hi: "अपनी भाषा सहेजने और अपनी संस्थाएँ चलाने के अधिकार पाठ में लिखे अल्पसंख्यक-संरक्षण हैं।",
          mr: "आपली भाषा जपण्याचे आणि आपल्या संस्था चालवण्याचे हक्क मजकुरात लिहिलेले अल्पसंख्याक-संरक्षण.",
        },
        extra: {
          en: "A democracy that only counted heads would be majority rule; one that protects minorities is constitutional democracy.",
          hi: "जो लोकतंत्र केवल सिर गिने वह बहुमत का शासन होता; जो अल्पसंख्यक बचाए वह संवैधानिक लोकतंत्र है।",
          mr: "जी लोकशाही फक्त डोकी मोजेल ती बहुमताचे राज्य; जी अल्पसंख्याक राखेल ती घटनात्मक लोकशाही.",
        },
        pair: {
          left: {
            en: "The fewer in number",
            hi: "संख्या में कम",
            mr: "संख्येने कमी",
          },
          right: {
            en: "guarded so numbers can't silence them",
            hi: "संख्या से न दबें, इसलिए रक्षित",
            mr: "संख्या गप्प करू नये म्हणून राखलेले",
          },
        },
      },
      {
        id: "safeguards",
        name: {
          en: "Constitutional safeguards",
          hi: "संवैधानिक संरक्षण",
          mr: "घटनात्मक संरक्षण",
        },
        kind: "provision",
        prompt: {
          en: "Reserved seats, reserved jobs and scholarships — which special provisions does the Constitution offer to lift the historically marginalised?",
          hi: "आरक्षित सीटें, आरक्षित नौकरियाँ और छात्रवृत्तियाँ — इतिहास से हाशिये पर धकेले गए लोगों को उठाने के लिए संविधान कौन-से विशेष प्रावधान देता है?",
          mr: "राखीव जागा, राखीव नोकऱ्या आणि शिष्यवृत्त्या — इतिहासाने उपेक्षित झालेल्यांना उचलण्यासाठी संविधान कोणत्या विशेष तरतुदी देते?",
        },
        statement: {
          en: "Constitutional safeguards are ladders, not gifts — reserved seats, jobs and scholarships to correct a head-start denied for generations.",
          hi: "संवैधानिक संरक्षण सीढ़ियाँ हैं, तोहफ़े नहीं — आरक्षित सीटें, नौकरियाँ और छात्रवृत्तियाँ, पीढ़ियों से रोकी गई बढ़त को ठीक करने के लिए।",
          mr: "घटनात्मक संरक्षणे ही शिडी आहेत, भेटी नाहीत — राखीव जागा, नोकऱ्या आणि शिष्यवृत्त्या, पिढ्यानपिढ्या नाकारलेली आघाडी दुरुस्त करायला.",
        },
        detail: {
          en: "Reservation treats the starting line as unequal — it does not hand out the finish, only levels the start.",
          hi: "आरक्षण शुरुआती रेखा को असमान मानता है — वह अंत नहीं थमाता, केवल शुरुआत बराबर करता है।",
          mr: "आरक्षण सुरुवातीची रेषा असमान मानते — ते शेवट देत नाही, फक्त सुरुवात समान करते.",
        },
        extra: {
          en: "The safeguards exist because equal treatment of unequals only preserves the gap — sometimes fairness requires difference.",
          hi: "संरक्षण इसलिए हैं कि असमानों का समान बर्ताव केवल खाई बनाए रखता है — कभी न्याय के लिए भेद चाहिए।",
          mr: "संरक्षणे यासाठी की असमानांची समान वागणूक फक्त दरी टिकवते — कधी न्यायासाठी भेद हवा.",
        },
        pair: {
          left: {
            en: "Ladders, not gifts",
            hi: "सीढ़ियाँ, तोहफ़े नहीं",
            mr: "शिडी, भेटी नाहीत",
          },
          right: {
            en: "the start levelled, not the finish handed out",
            hi: "शुरुआत बराबर, अंत नहीं थमाया",
            mr: "सुरुवात समान, शेवट न दिलेला",
          },
        },
      },
      {
        id: "article-17",
        name: {
          en: "Article 17 against untouchability",
          hi: "अस्पृश्यता के विरुद्ध अनुच्छेद 17",
          mr: "अस्पृश्यतेविरुद्ध अनुच्छेद 17",
        },
        kind: "provision",
        prompt: {
          en: "Which article of the Constitution abolishes untouchability outright and makes its practice a punishable offence?",
          hi: "संविधान का कौन-सा अनुच्छेद अस्पृश्यता को सिरे से समाप्त करता है और उसके आचरण को दंडनीय अपराध बनाता है?",
          mr: "संविधानाचा कोणता अनुच्छेद अस्पृश्यता थेट नष्ट करतो आणि तिचे आचरण दंडनीय गुन्हा करतो?",
        },
        statement: {
          en: "Article 17 abolishes untouchability and punishes its practice — a right with teeth, turning a social wrong into a crime.",
          hi: "अनुच्छेद 17 अस्पृश्यता समाप्त करता है और उसके आचरण को दंडित करता है — दाँतों वाला अधिकार, सामाजिक अन्याय को अपराध बनाता हुआ।",
          mr: "अनुच्छेद 17 अस्पृश्यता नष्ट करतो आणि तिचे आचरण दंडित करतो — दात असलेला हक्क, सामाजिक अन्यायाला गुन्हा करत.",
        },
        pair: {
          left: {
            en: "Untouchability abolished",
            hi: "अस्पृश्यता समाप्त",
            mr: "अस्पृश्यता नष्ट",
          },
          right: {
            en: "a right with teeth",
            hi: "दाँतों वाला अधिकार",
            mr: "दात असलेला हक्क",
          },
        },
      },
      {
        id: "dignity-claim",
        name: {
          en: "Dignity as a claim",
          hi: "हक़ के रूप में गरिमा",
          mr: "हक्क म्हणून प्रतिष्ठा",
        },
        kind: "idea",
        prompt: {
          en: "The marginalised ask not for pity but for rights already theirs. Which idea frames their demand as a claim the Constitution owes them, not charity?",
          hi: "हाशिये के लोग दया नहीं, पहले से अपने अधिकार माँगते हैं। कौन-सा विचार उनकी माँग को ख़ैरात नहीं, संविधान के देय हक़ के रूप में गढ़ता है?",
          mr: "उपेक्षित दया नव्हे, आधीच आपले हक्क मागतात. कोणती कल्पना त्यांच्या मागणीला दान नव्हे, संविधानाच्या देय हक्क म्हणून मांडते?",
        },
        statement: {
          en: "The marginalised assert dignity as a claim, not a favour — the Constitution's rights are owed to them, not granted out of kindness.",
          hi: "हाशिये के लोग गरिमा को हक़ मानते हैं, मेहरबानी नहीं — संविधान के अधिकार उन्हें देय हैं, दया से दिए नहीं।",
          mr: "उपेक्षित प्रतिष्ठा हक्क मानतात, मेहेरबानी नव्हे — संविधानाचे हक्क त्यांना देय आहेत, दयेने दिलेले नाहीत.",
        },
        pair: {
          left: {
            en: "Not pity but a right",
            hi: "दया नहीं, अधिकार",
            mr: "दया नव्हे, हक्क",
          },
          right: {
            en: "a claim the Constitution owes",
            hi: "संविधान का देय हक़",
            mr: "संविधानाचा देय हक्क",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student argues: 'True equality means treating everyone exactly the same, so reservations are unfair.' What does this miss?",
          hi: "एक विद्यार्थी तर्क देता है: 'सच्ची समानता यानी सबके साथ बिलकुल एक-सा बर्ताव, अतः आरक्षण अन्यायपूर्ण है।' यह क्या चूक जाता है?",
          mr: "एक विद्यार्थी युक्तिवाद करतो: 'खरी समता म्हणजे साऱ्यांशी अगदी सारखी वागणूक, म्हणून आरक्षण अन्याय्य आहे.' यात काय सुटते?",
        },
        choices: [
          {
            en: "When some began generations behind — denied land, schooling and respect — treating everyone identically just freezes that head-start in place; real equality sometimes needs unequal help to level a start that history made uneven",
            hi: "जब कुछ पीढ़ियों पीछे से शुरू हुए — भूमि, शिक्षा और सम्मान से वंचित — तो सबके साथ एक-सा बर्ताव बस उस बढ़त को जमा देता है; असली समानता को कभी उस शुरुआत को बराबर करने के लिए असमान मदद चाहिए जिसे इतिहास ने असमान बनाया",
            mr: "जेव्हा काही पिढ्या मागून सुरू झाले — जमीन, शिक्षण आणि सन्मानापासून वंचित — तेव्हा साऱ्यांशी सारखी वागणूक ती आघाडी तशीच गोठवते; खऱ्या समतेला कधी इतिहासाने असमान केलेली सुरुवात समान करायला असमान मदत लागते",
          },
          {
            en: "Nothing; identical treatment is always perfectly fair",
            hi: "कुछ नहीं; एक-सा बर्ताव हमेशा पूरी तरह न्यायपूर्ण है",
            mr: "काहीच नाही; सारखी वागणूक नेहमी पूर्ण न्याय्य",
          },
          {
            en: "Reservations exist only to punish the majority",
            hi: "आरक्षण केवल बहुमत को दंड देने के लिए है",
            mr: "आरक्षण फक्त बहुमताला शिक्षा देण्यासाठी",
          },
          {
            en: "History has no effect on people's chances today",
            hi: "इतिहास का लोगों के आज के अवसरों पर कोई असर नहीं",
            mr: "इतिहासाचा लोकांच्या आजच्या संधींवर परिणाम नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Identical treatment is fair only among people who start equal. Picture a race where some runners were held at the start line for generations while others ran ahead — firing the gun 'the same for everyone' now simply locks in the lead the head-start created. The marginalised did not begin where others did: land taken, schools barred, dignity denied across generations left them behind through no fault of their own. Reservations are the constitutional attempt to move the delayed runners up to the same line — not to hand them the finish, but to make the start genuinely equal. So the deeper point is that treating unequals equally preserves inequality; real fairness sometimes requires treating people DIFFERENTLY precisely in order to make them equal.",
          hi: "एक-सा बर्ताव केवल उनके बीच न्यायपूर्ण है जो बराबर से शुरू करें। एक दौड़ की कल्पना कीजिए जहाँ कुछ धावक पीढ़ियों तक शुरुआती रेखा पर रोके गए जबकि बाक़ी आगे दौड़ते रहे — अब 'सबके लिए एक-सा' गोली चलाना बस उस बढ़त को जड़ देता है जो पहले-से-दौड़ ने बनाई। हाशिये के लोग वहाँ से शुरू नहीं हुए जहाँ बाक़ी हुए: पीढ़ियों तक ली गई भूमि, रोके गए स्कूल, नकारी गई गरिमा ने उन्हें उनके बिना किसी दोष के पीछे छोड़ा। आरक्षण देर से चले धावकों को उसी रेखा तक लाने की संवैधानिक कोशिश है — अंत थमाने को नहीं, बल्कि शुरुआत को सचमुच बराबर करने को। गहरी बात यह कि असमानों का समान बर्ताव असमानता बनाए रखता है; असली न्याय को कभी लोगों को अलग-अलग बरतना पड़ता है, ठीक इसलिए कि उन्हें बराबर बनाया जा सके।",
          mr: "सारखी वागणूक फक्त समान सुरू करणाऱ्यांमध्ये न्याय्य. एका शर्यतीची कल्पना करा जिथे काही धावपटू पिढ्यानपिढ्या सुरुवातीच्या रेषेवर रोखले गेले तर बाकी पुढे धावत राहिले — आता 'साऱ्यांसाठी सारखी' बंदूक झाडणे ती आघाडी गोठवते जी आधीच्या-धावेने घडवली. उपेक्षित तिथून सुरू झाले नाहीत जिथे बाकी झाले: पिढ्यानपिढ्या घेतलेली जमीन, अडवलेल्या शाळा, नाकारलेली प्रतिष्ठा यांनी त्यांना त्यांच्या कोणत्याही दोषाविना मागे ठेवले. आरक्षण म्हणजे उशिरा चाललेल्या धावपटूंना त्याच रेषेपर्यंत आणण्याचा घटनात्मक प्रयत्न — शेवट देण्यासाठी नव्हे, तर सुरुवात खरोखर समान करण्यासाठी. खोल मुद्दा हा की असमानांची समान वागणूक असमानता टिकवते; खऱ्या न्यायाला कधी लोकांशी वेगळे वागावे लागते, नेमके यासाठी की त्यांना समान करता यावे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Article 17 does not merely disapprove of untouchability — it makes practising it a punishable crime. Why did the Constitution turn a social attitude into a criminal offence, rather than just declaring it wrong?",
          hi: "अनुच्छेद 17 अस्पृश्यता की केवल निंदा नहीं करता — वह उसका आचरण दंडनीय अपराध बनाता है। संविधान ने एक सामाजिक रवैये को केवल ग़लत घोषित करने की जगह आपराधिक अपराध क्यों बनाया?",
          mr: "अनुच्छेद 17 अस्पृश्यतेची केवळ निंदा करत नाही — तो तिचे आचरण दंडनीय गुन्हा करतो. संविधानाने एका सामाजिक वृत्तीला केवळ चूक घोषित करण्याऐवजी फौजदारी गुन्हा का केले?",
        },
        choices: [
          {
            en: "Because a wrong that a whole society enforces will not vanish on disapproval alone: only the force of criminal law gives the powerless a weapon against a practice the powerful had every social incentive to continue — the state's punishment stands in for the protection the community would not give",
            hi: "क्योंकि जिस अन्याय को पूरा समाज लागू करता हो वह केवल निंदा से नहीं मिटता: केवल आपराधिक क़ानून का बल शक्तिहीन को उस प्रथा के विरुद्ध हथियार देता है जिसे जारी रखने का शक्तिशाली को हर सामाजिक लालच था — राज्य का दंड उस रक्षा की जगह खड़ा होता है जो समुदाय नहीं देता",
            mr: "कारण जो अन्याय अख्खा समाज राबवतो तो केवळ निंदेने नाहीसा होत नाही: फक्त फौजदारी कायद्याचे बळ शक्तिहीनांना त्या प्रथेविरुद्ध शस्त्र देते जी चालू ठेवायला शक्तिमानांना प्रत्येक सामाजिक प्रलोभन होते — राज्याची शिक्षा समुदाय न देणाऱ्या संरक्षणाच्या जागी उभी राहते",
          },
          {
            en: "The Constitution wanted to fill the jails",
            hi: "संविधान जेलें भरना चाहता था",
            mr: "संविधानाला तुरुंग भरायचे होते",
          },
          {
            en: "Declaring something wrong is always enough to end it",
            hi: "किसी चीज़ को ग़लत घोषित करना उसे ख़त्म करने को हमेशा काफ़ी है",
            mr: "एखादी गोष्ट चूक घोषित करणे तिला संपवायला नेहमी पुरेसे",
          },
          {
            en: "Untouchability was already extinct by 1950 anyway",
            hi: "अस्पृश्यता वैसे भी 1950 तक ख़त्म हो चुकी थी",
            mr: "अस्पृश्यता तशीही 1950 पर्यंत संपली होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Some wrongs are held in place by the very society around the victim, and mere disapproval leaves the balance of power untouched. Untouchability was not one person's cruelty but a whole community's enforced custom — those who practised it faced social reward, and those who suffered it had no one above the village to appeal to. Simply calling it 'wrong' would have changed nothing, because the people doing the wrong were also the local authorities. By making it a crime, the Constitution reached past the community to the state: now the victim has a power higher than the village to invoke, and the practitioner faces a punishment the neighbourhood cannot waive. This is the difference between a moral opinion and an enforceable right — and it is why the deepest social injustices are answered not with disapproval but with law that bites.",
          hi: "कुछ अन्याय पीड़ित के गिर्द के समाज से ही टिके रहते हैं, और केवल निंदा शक्ति-संतुलन को अछूता छोड़ देती है। अस्पृश्यता एक व्यक्ति की क्रूरता नहीं, पूरे समुदाय का लागू किया रिवाज थी — जो उसे बरतते उन्हें सामाजिक इनाम मिलता, और जो झेलते उनके पास गाँव से ऊपर कोई अपील नहीं थी। उसे बस 'ग़लत' कहने से कुछ न बदलता, क्योंकि अन्याय करने वाले ही स्थानीय अधिकारी थे। उसे अपराध बनाकर संविधान समुदाय को लाँघकर राज्य तक पहुँचा: अब पीड़ित के पास गाँव से ऊँची एक शक्ति है जिसे पुकारा जा सके, और आचरण करने वाला ऐसे दंड का सामना करता है जिसे पड़ोस माफ़ नहीं कर सकता। यही नैतिक राय और लागू करने योग्य अधिकार का फ़र्क़ है — और इसीलिए सबसे गहरे सामाजिक अन्यायों का उत्तर निंदा से नहीं, काटते क़ानून से दिया जाता है।",
          mr: "काही अन्याय बळीभोवतीच्या समाजानेच टिकून राहतात, आणि केवळ निंदा सत्ता-समतोलाला अस्पर्श ठेवते. अस्पृश्यता एका व्यक्तीची क्रूरता नव्हे, अख्ख्या समुदायाचा राबवलेला रिवाज होती — जे ती पाळत त्यांना सामाजिक बक्षीस मिळे, आणि जे सोसत त्यांना गावाहून वर कोणाकडे दाद नव्हती. तिला नुसते 'चूक' म्हणण्याने काहीच बदलले नसते, कारण अन्याय करणारेच स्थानिक अधिकारी होते. तिला गुन्हा करून संविधानाने समुदायाला ओलांडून राज्यापर्यंत पोहोचले: आता बळीकडे गावाहून उंच एक सत्ता आहे जिला हाक मारता येते, आणि आचरण करणारा अशा शिक्षेला तोंड देतो जी शेजार माफ करू शकत नाही. हाच नैतिक मत आणि राबवण्याजोगा हक्क यांतला फरक — आणि म्हणूनच सर्वांत खोल सामाजिक अन्यायांचे उत्तर निंदेने नव्हे, दात असलेल्या कायद्याने दिले जाते.",
        },
      },
    ],
  },
];
