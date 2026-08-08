/**
 * Class 6 Civics — NCERT "Social and Political Life – I", chapter by chapter,
 * through the conceptual engine. The voice is a citizen's-in-training:
 * every fact is something a child can see working (or failing) in their own
 * village ward, school and newspaper.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Social and Political Life – I (Class 6)";
const LICENCE = "CC-BY-SA-4.0";

export const G6_CIVICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Understanding Diversity                                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-6-understanding-diversity",
    subject: "CIVICS",
    classLevel: 6,
    chapter: {
      en: "Chapter 1 — Understanding Diversity",
      hi: "अध्याय 1 — विविधता की समझ",
      mr: "प्रकरण 1 — विविधतेची समज",
    },
    name: { en: "Understanding Diversity", hi: "विविधता की समझ", mr: "विविधतेची समज" },
    summary: {
      en: "Ladakh's wool and Kerala's spices, a hundred languages under one flag — how geography and history braided India's many ways of living, and how difference became strength.",
      hi: "लद्दाख़ की ऊन और केरल के मसाले, एक झंडे तले सौ भाषाएँ — भूगोल और इतिहास ने भारत के अनगिनत जीवन-ढंग कैसे गूँथे, और भिन्नता ताक़त कैसे बनी।",
      mr: "लडाखची लोकर आणि केरळचे मसाले, एका झेंड्याखाली शंभर भाषा — भूगोल आणि इतिहासाने भारताच्या असंख्य जीवनरीती कशा गुंफल्या, आणि वेगळेपण बळ कसे झाले.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "diversity",
        name: { en: "Diversity", hi: "विविधता", mr: "विविधता" },
        kind: "idea",
        prompt: {
          en: "Dozens of languages, countless dishes, festivals in every season, dresses of every cut — what do we call this many-ways-of-living within one country?",
          hi: "दर्जनों भाषाएँ, अनगिनत पकवान, हर मौसम में त्योहार, हर काट की पोशाकें — एक देश के भीतर इन ढेरों जीवन-ढंगों को क्या कहते हैं?",
          mr: "डझनावारी भाषा, असंख्य पदार्थ, प्रत्येक ऋतूत सण, प्रत्येक घाटाचे पोशाख — एका देशातल्या या अनेक जीवनरीतींना काय म्हणतात?",
        },
        statement: {
          en: "Diversity is the living side by side of many languages, foods, faiths and customs — India holds more of it than almost any country on Earth.",
          hi: "विविधता अनेक भाषाओं, भोजनों, धर्मों और रीतियों का साथ-साथ जीना है — भारत में यह धरती के लगभग हर देश से ज़्यादा है।",
          mr: "विविधता म्हणजे अनेक भाषा, अन्ने, धर्म आणि रीतींचे शेजारी शेजारी जगणे — भारतात ती पृथ्वीवरच्या जवळजवळ कोणत्याही देशाहून जास्त आहे.",
        },
        pair: {
          left: { en: "Diversity", hi: "विविधता", mr: "विविधता" },
          right: {
            en: "many ways, one country",
            hi: "ढंग अनेक, देश एक",
            mr: "रीती अनेक, देश एक",
          },
        },
      },
      {
        id: "ladakh",
        name: { en: "Ladakh", hi: "लद्दाख़", mr: "लडाख" },
        kind: "region",
        prompt: {
          en: "A cold desert in the mountains — herders' pashmina goats, barley fields, monasteries and mosques along the old caravan routes. Which region is this?",
          hi: "पहाड़ों का ठंडा रेगिस्तान — चरवाहों की पश्मीना बकरियाँ, जौ के खेत, पुराने कारवाँ-रास्तों पर गोम्पा और मस्जिदें। यह कौन-सा प्रदेश है?",
          mr: "पर्वतांतले थंड वाळवंट — मेंढपाळांच्या पश्मिना शेळ्या, सातूची शेते, जुन्या तांडा-वाटांवर गोंपा आणि मशिदी. हा कोणता प्रदेश?",
        },
        statement: {
          en: "Ladakh is a cold mountain desert — its people herd pashmina goats, grow barley in a short summer, and its caravan past left both monasteries and mosques.",
          hi: "लद्दाख़ ठंडा पहाड़ी रेगिस्तान है — लोग पश्मीना बकरियाँ पालते हैं, छोटी गर्मी में जौ उगाते हैं, और उसके कारवाँ-अतीत ने गोम्पा और मस्जिदें दोनों छोड़ीं।",
          mr: "लडाख हे थंड डोंगरी वाळवंट — माणसे पश्मिना शेळ्या पाळतात, छोट्या उन्हाळ्यात सातू पिकवतात, आणि त्याच्या तांडा-भूतकाळाने गोंपा आणि मशिदी दोन्ही ठेवल्या.",
        },
        detail: {
          en: "The famous pashmina shawl begins here, in the underfleece of goats that survive the bitter cold.",
          hi: "प्रसिद्ध पश्मीना शॉल यहीं शुरू होती है — कड़वी ठंड झेलती बकरियों के भीतरी रोएँ से।",
          mr: "प्रसिद्ध पश्मिना शाल इथेच सुरू होते — कडाक्याची थंडी सोसणाऱ्या शेळ्यांच्या आतल्या लोकरीतून.",
        },
        extra: {
          en: "Caravans once crossed it with tea, salt and textiles — trade wove its mixed culture.",
          hi: "कभी उसके पार चाय, नमक और कपड़ों के कारवाँ चलते थे — व्यापार ने उसकी मिली-जुली संस्कृति बुनी।",
          mr: "कधी त्याच्यापार चहा, मीठ आणि कापडांचे तांडे चालत — व्यापाराने त्याची मिश्र संस्कृती विणली.",
        },
        pair: {
          left: { en: "Ladakh", hi: "लद्दाख़", mr: "लडाख" },
          right: {
            en: "pashmina of the cold desert",
            hi: "ठंडे रेगिस्तान की पश्मीना",
            mr: "थंड वाळवंटाची पश्मिना",
          },
        },
      },
      {
        id: "kerala",
        name: { en: "Kerala", hi: "केरल", mr: "केरळ" },
        kind: "region",
        prompt: {
          en: "A green sea-coast of spices and fishing nets — where Arab traders, and even Chinese fishing nets, arrived across the water centuries ago. Which region is this?",
          hi: "मसालों और मछली-जालों का हरा समुद्र-तट — जहाँ सदियों पहले अरब व्यापारी, और चीनी मछली-जाल तक, पानी पार से पहुँचे। यह कौन-सा प्रदेश है?",
          mr: "मसाले आणि मासेमारी-जाळ्यांचा हिरवा समुद्रकिनारा — जिथे शतकांपूर्वी अरब व्यापारी, आणि चिनी मासेमारी-जाळीही, पाण्यापारून पोहोचली. हा कोणता प्रदेश?",
        },
        statement: {
          en: "Kerala is a green spice coast — pepper drew traders across the seas for centuries, and fishing nets said to come from China still stand in its waters.",
          hi: "केरल हरा मसाला-तट है — काली मिर्च सदियों व्यापारियों को समुद्र पार खींचती रही, और चीन से आए कहलाते मछली-जाल आज भी उसके पानी में खड़े हैं।",
          mr: "केरळ हा हिरवा मसाला-किनारा — मिरीने शतकानुशतके व्यापाऱ्यांना समुद्रापार ओढले, आणि चीनमधून आले म्हटले जाणारे मासेमारी-जाळे आजही त्याच्या पाण्यात उभे आहे.",
        },
        detail: {
          en: "Rice, fish and coconut fill its kitchens — the crops its wet warmth grows best.",
          hi: "उसकी रसोइयों में चावल, मछली और नारियल भरे हैं — वही फ़सलें जो उसकी नम गर्मी सबसे अच्छा उगाती है।",
          mr: "त्याच्या स्वयंपाकघरांत भात, मासे आणि नारळ भरले आहेत — त्याची ओली ऊब उत्तम पिकवते तीच पिके.",
        },
        extra: {
          en: "Its trading past left churches, mosques and temples standing street by street.",
          hi: "उसके व्यापारी अतीत ने गली-गली गिरजे, मस्जिदें और मंदिर खड़े छोड़े।",
          mr: "त्याच्या व्यापारी भूतकाळाने गल्लोगल्ली चर्च, मशिदी आणि मंदिरे उभी ठेवली.",
        },
        pair: {
          left: { en: "Kerala", hi: "केरल", mr: "केरळ" },
          right: {
            en: "the spice coast of traders",
            hi: "व्यापारियों का मसाला-तट",
            mr: "व्यापाऱ्यांचा मसाला-किनारा",
          },
        },
      },
      {
        id: "geographyshapes",
        name: {
          en: "Geography's shaping hand",
          hi: "भूगोल का गढ़ता हाथ",
          mr: "भूगोलाचा घडवणारा हात",
        },
        kind: "cause",
        prompt: {
          en: "Wool-wear in the mountains, rice-and-fish by the sea — WHAT quietly decides much of how a place eats, dresses and earns?",
          hi: "पहाड़ों में ऊनी पहनावा, समुद्र किनारे चावल-मछली — क्या चुपचाप तय करता है कि कोई जगह कैसे खाती, पहनती और कमाती है?",
          mr: "पर्वतांत लोकरीचे कपडे, समुद्राकाठी भात-मासे — काय गुपचूप ठरवते की एखादी जागा कशी खाते, नेसते आणि कमावते?",
        },
        statement: {
          en: "Geography shapes daily life — the land's cold or warmth, sea or mountain, decides much of what people grow, wear and work at.",
          hi: "भूगोल रोज़ का जीवन गढ़ता है — धरती की ठंड या गर्मी, समुद्र या पहाड़, बहुत कुछ तय करते हैं कि लोग क्या उगाएँगे, पहनेंगे, करेंगे।",
          mr: "भूगोल रोजचे जीवन घडवतो — भूमीची थंडी वा ऊब, समुद्र वा पर्वत, माणसे काय पिकवतील, नेसतील, करतील याचे बरेच काही ठरवतात.",
        },
        pair: {
          left: { en: "Geography", hi: "भूगोल", mr: "भूगोल" },
          right: {
            en: "the land writing the menu",
            hi: "मेन्यू लिखती धरती",
            mr: "मेनू लिहिणारी भूमी",
          },
        },
      },
      {
        id: "historymixes",
        name: {
          en: "History's mixing hand",
          hi: "इतिहास का मिलाता हाथ",
          mr: "इतिहासाचा मिसळणारा हात",
        },
        kind: "cause",
        prompt: {
          en: "Traders who stayed, travellers who taught, settlers who married in — WHAT braided new faiths, words and dishes into every region's life?",
          hi: "रुक गए व्यापारी, सिखा गए यात्री, रच-बस गए आए लोग — किसने हर प्रदेश के जीवन में नए धर्म, शब्द और पकवान गूँथे?",
          mr: "थांबलेले व्यापारी, शिकवून गेलेले प्रवासी, मिसळून गेलेले स्थलांतरित — कोणी प्रत्येक प्रदेशाच्या जीवनात नवे धर्म, शब्द आणि पदार्थ गुंफले?",
        },
        statement: {
          en: "History mixes people — every trader, pilgrim and settler who came left words, faiths and recipes behind, layering each region's culture.",
          hi: "इतिहास लोगों को मिलाता है — आया हर व्यापारी, तीर्थयात्री और बसने वाला शब्द, धर्म और नुस्ख़े छोड़ गया, हर प्रदेश की संस्कृति पर परत चढ़ाता।",
          mr: "इतिहास माणसांना मिसळतो — आलेला प्रत्येक व्यापारी, यात्रेकरू आणि स्थायिक शब्द, धर्म आणि पाककृती ठेवून गेला, प्रत्येक प्रदेशाच्या संस्कृतीवर थर चढवत.",
        },
        pair: {
          left: { en: "History", hi: "इतिहास", mr: "इतिहास" },
          right: {
            en: "layers left by every arrival",
            hi: "हर आगमन की छोड़ी परतें",
            mr: "प्रत्येक आगमनाने ठेवलेले थर",
          },
        },
      },
      {
        id: "unityindiversity",
        name: {
          en: "Unity in diversity",
          hi: "अनेकता में एकता",
          mr: "विविधतेत एकता",
        },
        kind: "idea",
        prompt: {
          en: "In the freedom struggle, people of every language, faith and dress marched under one flag for one goal. What is this famous idea called?",
          hi: "स्वतंत्रता संग्राम में हर भाषा, धर्म और पोशाक के लोग एक लक्ष्य के लिए एक झंडे तले चले। इस प्रसिद्ध विचार को क्या कहते हैं?",
          mr: "स्वातंत्र्यलढ्यात प्रत्येक भाषेची, धर्माची आणि पोशाखाची माणसे एका ध्येयासाठी एका झेंड्याखाली चालली. या प्रसिद्ध विचाराला काय म्हणतात?",
        },
        statement: {
          en: "Unity in diversity is India's answer to its own variety — different peoples joining as one, proved in the freedom struggle when every kind marched together.",
          hi: "अनेकता में एकता भारत का अपनी ही विविधता को उत्तर है — भिन्न-भिन्न लोग एक होकर, स्वतंत्रता संग्राम में साबित, जब हर क़िस्म के लोग साथ चले।",
          mr: "विविधतेत एकता हे भारताचे स्वतःच्याच विविधतेला उत्तर — वेगवेगळी माणसे एक होऊन, स्वातंत्र्यलढ्यात सिद्ध, जेव्हा प्रत्येक प्रकारची माणसे एकत्र चालली.",
        },
        detail: {
          en: "Jawaharlal Nehru gave the phrase currency in his book The Discovery of India.",
          hi: "जवाहरलाल नेहरू ने 'भारत एक खोज' में इस पद को चलन दिया।",
          mr: "जवाहरलाल नेहरूंनी 'डिस्कव्हरी ऑफ इंडिया'त या शब्दप्रयोगाला चलती दिली.",
        },
        extra: {
          en: "The anthem's very verses walk the map — Punjab, Sindh, Gujarat, Maratha — singing the parts into one.",
          hi: "राष्ट्रगान की पंक्तियाँ ख़ुद नक़्शे पर चलती हैं — पंजाब, सिंध, गुजरात, मराठा — हिस्सों को एक में गाती हुईं।",
          mr: "राष्ट्रगीताच्या ओळीच नकाशावर चालतात — पंजाब, सिंध, गुजरात, मराठा — भागांना एकात गात.",
        },
        pair: {
          left: { en: "Unity in diversity", hi: "अनेकता में एकता", mr: "विविधतेत एकता" },
          right: {
            en: "many kinds, one march",
            hi: "क़िस्में अनेक, क़दम एक",
            mr: "प्रकार अनेक, वाटचाल एक",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "File each under Ladakh or Kerala: pashmina goats; pepper that drew sea-traders; barley in a short summer; Chinese-style fishing nets. Which sorting is right?",
          hi: "हर एक को लद्दाख़ या केरल में रखिए: पश्मीना बकरियाँ; समुद्री व्यापारियों को खींचती काली मिर्च; छोटी गर्मी का जौ; चीनी ढंग के मछली-जाल। कौन-सी छँटाई सही है?",
          mr: "प्रत्येकाला लडाख वा केरळमध्ये ठेवा: पश्मिना शेळ्या; समुद्री व्यापाऱ्यांना ओढणारी मिरी; छोट्या उन्हाळ्यातला सातू; चिनी धाटणीची मासेमारी-जाळी. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Ladakh: pashmina goats, short-summer barley · Kerala: pepper, Chinese-style nets",
            hi: "लद्दाख़: पश्मीना बकरियाँ, जौ · केरल: काली मिर्च, चीनी जाल",
            mr: "लडाख: पश्मिना शेळ्या, सातू · केरळ: मिरी, चिनी जाळी",
          },
          {
            en: "Ladakh: pepper, barley · Kerala: pashmina goats, Chinese-style nets",
            hi: "लद्दाख़: काली मिर्च, जौ · केरल: पश्मीना बकरियाँ, चीनी जाल",
            mr: "लडाख: मिरी, सातू · केरळ: पश्मिना शेळ्या, चिनी जाळी",
          },
          {
            en: "Ladakh: Chinese-style nets, pashmina goats · Kerala: barley, pepper",
            hi: "लद्दाख़: चीनी जाल, पश्मीना बकरियाँ · केरल: जौ, काली मिर्च",
            mr: "लडाख: चिनी जाळी, पश्मिना शेळ्या · केरळ: सातू, मिरी",
          },
          {
            en: "Ladakh: pepper, Chinese-style nets · Kerala: pashmina goats, barley",
            hi: "लद्दाख़: काली मिर्च, चीनी जाल · केरल: पश्मीना बकरियाँ, जौ",
            mr: "लडाख: मिरी, चिनी जाळी · केरळ: पश्मिना शेळ्या, सातू",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Cold-desert life gives Ladakh its goats and hardy barley; the warm trading sea gives Kerala its pepper and its borrowed nets. Each item traces back to land or sea — read the geography and the sorting sorts itself.",
          hi: "ठंडे रेगिस्तान का जीवन लद्दाख़ को बकरियाँ और सख़्त-जान जौ देता है; गर्म व्यापारी समुद्र केरल को मिर्च और उधार के जाल। हर चीज़ धरती या समुद्र तक लौटती है — भूगोल पढ़िए, छँटाई ख़ुद हो जाती है।",
          mr: "थंड-वाळवंटी जीवन लडाखला शेळ्या आणि काटक सातू देते; उबदार व्यापारी समुद्र केरळला मिरी आणि उसनी जाळी. प्रत्येक गोष्ट भूमी वा समुद्राकडे परत जाते — भूगोल वाचा, वर्गवारी आपोआप होते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Ladakh and Kerala could hardly look more different — yet the chapter says the SAME two forces made both. What are they, and how did they produce opposite results?",
          hi: "लद्दाख़ और केरल इससे ज़्यादा अलग दिख नहीं सकते — फिर भी अध्याय कहता है दोनों को उन्हीं दो ताक़तों ने बनाया। वे कौन-सी हैं, और उन्होंने उलटे नतीजे कैसे दिए?",
          mr: "लडाख आणि केरळ याहून वेगळे दिसू शकत नाहीत — तरी प्रकरण म्हणते दोघांना त्याच दोन शक्तींनी घडवले. त्या कोणत्या, आणि त्यांनी उलटे निकाल कसे दिले?",
        },
        choices: [
          {
            en: "Geography and history — the same forces, working on a cold mountain desert and a warm trading coast, wrote two different ways of life",
            hi: "भूगोल और इतिहास — वही ताक़तें, ठंडे पहाड़ी रेगिस्तान और गर्म व्यापारी तट पर काम करके, दो अलग जीवन-ढंग लिख गईं",
            mr: "भूगोल आणि इतिहास — त्याच शक्ती, थंड डोंगरी वाळवंटावर आणि उबदार व्यापारी किनाऱ्यावर काम करून, दोन वेगळ्या जीवनरीती लिहून गेल्या",
          },
          {
            en: "Chance alone — regions differ for no reason",
            hi: "केवल संयोग — प्रदेश बेवजह अलग होते हैं",
            mr: "केवळ योगायोग — प्रदेश विनाकारण वेगळे असतात",
          },
          {
            en: "Government orders made each region distinct",
            hi: "सरकारी आदेशों ने हर प्रदेश को अलग बनाया",
            mr: "सरकारी आदेशांनी प्रत्येक प्रदेश वेगळा केला",
          },
          {
            en: "The regions chose to be different to stand out",
            hi: "प्रदेशों ने अलग दिखने को भिन्न होना चुना",
            mr: "प्रदेशांनी उठून दिसण्यासाठी वेगळे होणे निवडले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Same recipe, different kitchens. Geography handed Ladakh cold, height and goats, and Kerala warmth, rain and the sea; history sent caravans through one and ships to the other. Two inputs, two outcomes — and the lesson generalises: wherever you find a 'strange' custom, ask what land and what past produced it, and it stops being strange.",
          hi: "नुस्ख़ा एक, रसोइयाँ अलग। भूगोल ने लद्दाख़ को ठंड, ऊँचाई और बकरियाँ थमाईं, केरल को गर्मी, बारिश और समुद्र; इतिहास ने एक से कारवाँ गुज़ारे और दूसरे तक जहाज़ भेजे। दो सामग्री, दो नतीजे — और सबक़ आम है: जहाँ कोई 'अजीब' रीत दिखे, पूछिए किस धरती और किस अतीत ने उसे जना, और वह अजीब नहीं रहती।",
          mr: "कृती एक, स्वयंपाकघरे वेगळी. भूगोलाने लडाखला थंडी, उंची आणि शेळ्या दिल्या, केरळला ऊब, पाऊस आणि समुद्र; इतिहासाने एकातून तांडे नेले आणि दुसऱ्याकडे जहाजे पाठवली. दोन घटक, दोन निकाल — आणि धडा सार्वत्रिक: जिथे 'विचित्र' रीत दिसेल, तिथे विचारा कोणत्या भूमीने आणि कोणत्या भूतकाळाने ती जन्मवली, आणि ती विचित्र राहत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The British hoped India's many communities could never act as one — yet the freedom struggle joined them. What did diversity turn out to be, against that hope?",
          hi: "अंग्रेज़ों को आशा थी कि भारत के अनेक समुदाय कभी एक होकर नहीं चल सकते — फिर भी स्वतंत्रता संग्राम ने उन्हें जोड़ दिया। उस आशा के विरुद्ध विविधता क्या निकली?",
          mr: "इंग्रजांना आशा होती की भारताचे अनेक समाज कधीही एक होऊन वागू शकणार नाहीत — तरी स्वातंत्र्यलढ्याने त्यांना जोडले. त्या आशेविरुद्ध विविधता काय निघाली?",
        },
        choices: [
          {
            en: "A strength — songs, marches and sacrifices came in every language toward one goal, proving difference and unity can share a flag",
            hi: "ताक़त — गीत, जुलूस और बलिदान हर भाषा में एक ही लक्ष्य की ओर आए, साबित करते हुए कि भिन्नता और एकता एक झंडा बाँट सकती हैं",
            mr: "बळ — गाणी, मोर्चे आणि बलिदाने प्रत्येक भाषेत एकाच ध्येयाकडे आली, सिद्ध करत की वेगळेपण आणि एकता एक झेंडा वाटून घेऊ शकतात",
          },
          {
            en: "A weakness that had to be erased first",
            hi: "एक कमज़ोरी जिसे पहले मिटाना पड़ा",
            mr: "आधी पुसावी लागलेली एक कमजोरी",
          },
          {
            en: "Irrelevant — only weapons decided the struggle",
            hi: "बेमानी — संग्राम केवल हथियारों से तय हुआ",
            mr: "गैरलागू — लढा केवळ शस्त्रांनी ठरला",
          },
          {
            en: "A coincidence never repeated since",
            hi: "एक संयोग जो फिर कभी नहीं दोहराया",
            mr: "पुन्हा कधीही न घडलेला योगायोग",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The empire's wager was that difference means division. The struggle answered with Punjabi marchers, Bengali songs, Gujarati satyagraha and Tamil presses all pulling one way — difference multiplying the movement's reach instead of splitting it. That is why free India put 'unity in diversity' at its heart rather than uniformity: the founders had watched variety win.",
          hi: "साम्राज्य का दाँव था कि भिन्नता यानी फूट। संग्राम ने उत्तर दिया — पंजाबी जुलूस, बांग्ला गीत, गुजराती सत्याग्रह और तमिल छापेख़ाने, सब एक ही दिशा में खींचते — भिन्नता ने आंदोलन की पहुँच बाँटी नहीं, कई गुना की। इसीलिए स्वतंत्र भारत ने एकरूपता नहीं, 'अनेकता में एकता' को हृदय में रखा: संस्थापकों ने विविधता को जीतते देखा था।",
          mr: "साम्राज्याची पैज होती की वेगळेपण म्हणजे फूट. लढ्याने उत्तर दिले — पंजाबी मोर्चे, बंगाली गाणी, गुजराती सत्याग्रह आणि तमिळ छापखाने, सारे एकाच दिशेने ओढणारे — वेगळेपणाने चळवळीची पोहोच फोडली नाही, कैकपट केली. म्हणूनच स्वतंत्र भारताने एकसारखेपणा नव्हे, 'विविधतेत एकता' हृदयाशी धरली: संस्थापकांनी विविधतेला जिंकताना पाहिले होते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — What is Government?                                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-6-what-is-government",
    subject: "CIVICS",
    classLevel: 6,
    chapter: {
      en: "Chapter 3 — What is Government?",
      hi: "अध्याय 3 — सरकार क्या है?",
      mr: "प्रकरण 3 — शासन म्हणजे काय?",
    },
    name: { en: "What is Government?", hi: "सरकार क्या है?", mr: "शासन म्हणजे काय?" },
    summary: {
      en: "Who lays the roads, runs the schools and guards the borders — three levels of government, laws that bind everyone, and the vote that every adult owns equally.",
      hi: "सड़कें कौन बिछाता है, स्कूल कौन चलाता है, सीमाएँ कौन सँभालता है — सरकार के तीन स्तर, सब पर लागू क़ानून, और वह वोट जो हर वयस्क के पास बराबर है।",
      mr: "रस्ते कोण घालते, शाळा कोण चालवते, सीमा कोण राखते — शासनाचे तीन स्तर, साऱ्यांना बांधणारे कायदे, आणि प्रत्येक प्रौढाकडे सारखेच असलेले मत.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "government",
        name: { en: "The government", hi: "सरकार", mr: "शासन" },
        kind: "idea",
        prompt: {
          en: "Someone must decide for everyone — build roads, run schools and hospitals, keep prices watched and borders guarded. What do we call this deciding-and-doing body?",
          hi: "सबके लिए किसी को तय करना होता है — सड़कें बनवाना, स्कूल-अस्पताल चलाना, दामों पर नज़र और सीमाओं पर पहरा। इस तय-करने-और-करने वाले तंत्र को क्या कहते हैं?",
          mr: "साऱ्यांसाठी कोणाला तरी ठरवावे लागते — रस्ते बांधणे, शाळा-रुग्णालये चालवणे, भावांवर नजर आणि सीमांवर पहारा. या ठरवणाऱ्या-करणाऱ्या यंत्रणेला काय म्हणतात?",
        },
        statement: {
          en: "The government takes decisions and gets things done for the whole society — roads, schools, health, supplies and defence, no family could arrange these alone.",
          hi: "सरकार पूरे समाज के लिए निर्णय लेती और काम करवाती है — सड़कें, स्कूल, स्वास्थ्य, आपूर्ति और रक्षा; अकेला कोई परिवार यह नहीं जुटा सकता।",
          mr: "शासन साऱ्या समाजासाठी निर्णय घेते आणि कामे करवते — रस्ते, शाळा, आरोग्य, पुरवठा आणि संरक्षण; एकटे कोणतेही कुटुंब हे जुळवू शकत नाही.",
        },
        pair: {
          left: { en: "The government", hi: "सरकार", mr: "शासन" },
          right: {
            en: "deciding and doing for all",
            hi: "सबके लिए तय करना और करना",
            mr: "साऱ्यांसाठी ठरवणे आणि करणे",
          },
        },
      },
      {
        id: "threelevels",
        name: { en: "The three levels", hi: "तीन स्तर", mr: "तीन स्तर" },
        kind: "structure",
        prompt: {
          en: "The village ward, the whole state, the entire country — government works at how many levels, each with its own charge?",
          hi: "गाँव का वार्ड, पूरा राज्य, समूचा देश — सरकार कितने स्तरों पर काम करती है, हर एक का अपना ज़िम्मा?",
          mr: "गावाचा प्रभाग, अख्खे राज्य, सबंध देश — शासन किती स्तरांवर काम करते, प्रत्येकाचा स्वतःचा कार्यभार?",
        },
        statement: {
          en: "Government works at three levels — local for the village or town, state for the whole state, central for the entire country — each handling what fits its size.",
          hi: "सरकार तीन स्तरों पर चलती है — गाँव-शहर के लिए स्थानीय, पूरे राज्य के लिए राज्य, समूचे देश के लिए केंद्र — हर स्तर अपने नाप का काम सँभालता।",
          mr: "शासन तीन स्तरांवर चालते — गाव-शहरासाठी स्थानिक, अख्ख्या राज्यासाठी राज्य, सबंध देशासाठी केंद्र — प्रत्येक स्तर आपल्या मापाचे काम सांभाळतो.",
        },
        detail: {
          en: "The streetlight is local, the state highway is the state's, the railways and currency are central.",
          hi: "गली की बत्ती स्थानीय है, राज्य-मार्ग राज्य का, रेलें और मुद्रा केंद्र की।",
          mr: "गल्लीतला दिवा स्थानिक, राज्य-महामार्ग राज्याचा, रेल्वे आणि चलन केंद्राचे.",
        },
        extra: {
          en: "The levels must work together — one country's problems rarely fit one desk.",
          hi: "स्तरों को साथ चलना होता है — देश की समस्याएँ शायद ही किसी एक मेज़ पर समाएँ।",
          mr: "स्तरांना एकत्र चालावे लागते — देशाच्या समस्या क्वचितच एका टेबलावर मावतात.",
        },
        pair: {
          left: { en: "The three levels", hi: "तीन स्तर", mr: "तीन स्तर" },
          right: {
            en: "local, state and central",
            hi: "स्थानीय, राज्य और केंद्र",
            mr: "स्थानिक, राज्य आणि केंद्र",
          },
        },
      },
      {
        id: "laws",
        name: { en: "The laws", hi: "क़ानून", mr: "कायदे" },
        kind: "idea",
        prompt: {
          en: "Rules that apply to EVERYONE in the land — rich or poor, official or ordinary — and that courts can be asked to enforce. What are these called?",
          hi: "वे नियम जो देश में सब पर लागू हैं — अमीर हों या ग़रीब, अफ़सर हों या आम — और जिन्हें लागू कराने अदालत जाया जा सकता है। इन्हें क्या कहते हैं?",
          mr: "देशात साऱ्यांना लागू असणारे नियम — श्रीमंत असो वा गरीब, अधिकारी असो वा सामान्य — आणि जे राबवायला न्यायालयात जाता येते. यांना काय म्हणतात?",
        },
        statement: {
          en: "Laws are the government's rules binding everyone alike — and anyone can go to court when a law is broken against them.",
          hi: "क़ानून सरकार के वे नियम हैं जो सब पर एक-से बँधते हैं — और जिनके टूटने पर कोई भी अदालत जा सकता है।",
          mr: "कायदे हे शासनाचे साऱ्यांना सारखे बांधणारे नियम — आणि ते मोडले गेल्यास कोणीही न्यायालयात जाऊ शकते.",
        },
        pair: {
          left: { en: "The laws", hi: "क़ानून", mr: "कायदे" },
          right: {
            en: "one rule for everyone",
            hi: "सबके लिए एक नियम",
            mr: "साऱ्यांसाठी एक नियम",
          },
        },
      },
      {
        id: "democracy",
        name: { en: "Democracy", hi: "लोकतंत्र", mr: "लोकशाही" },
        kind: "idea",
        prompt: {
          en: "In which kind of government do the PEOPLE choose who will rule, through elections — and can change their minds at the next one?",
          hi: "किस तरह की सरकार में जनता चुनावों से तय करती है कि कौन शासन करेगा — और अगले चुनाव में इरादा बदल भी सकती है?",
          mr: "कोणत्या प्रकारच्या शासनात जनता निवडणुकांतून ठरवते की कोण राज्य करेल — आणि पुढच्या निवडणुकीत मतही बदलू शकते?",
        },
        statement: {
          en: "Democracy is government chosen by the people — leaders win power through elections and must return to the voters to keep it.",
          hi: "लोकतंत्र जनता की चुनी सरकार है — नेता चुनाव से सत्ता पाते हैं और उसे रखने के लिए फिर मतदाताओं के पास लौटना पड़ता है।",
          mr: "लोकशाही म्हणजे जनतेने निवडलेले शासन — नेते निवडणुकीतून सत्ता मिळवतात आणि ती टिकवायला पुन्हा मतदारांकडे परतावे लागते.",
        },
        detail: {
          en: "The people do not rule daily — they rule at the ballot, by keeping or changing their rulers.",
          hi: "जनता रोज़ शासन नहीं करती — वह मतपेटी पर शासन करती है, शासकों को रखकर या बदलकर।",
          mr: "जनता रोज राज्य करत नाही — ती मतपेटीवर राज्य करते, राज्यकर्त्यांना ठेवून वा बदलून.",
        },
        extra: {
          en: "A king inherits, a dictator seizes — only a democrat must ask.",
          hi: "राजा विरासत पाता है, तानाशाह छीनता है — केवल लोकतंत्री को पूछना पड़ता है।",
          mr: "राजा वारसा मिळवतो, हुकूमशहा बळकावतो — फक्त लोकशाहीवाल्याला विचारावे लागते.",
        },
        pair: {
          left: { en: "Democracy", hi: "लोकतंत्र", mr: "लोकशाही" },
          right: {
            en: "rulers who must ask",
            hi: "पूछकर बनते शासक",
            mr: "विचारून होणारे राज्यकर्ते",
          },
        },
      },
      {
        id: "franchise",
        name: {
          en: "Universal adult franchise",
          hi: "सार्वभौमिक वयस्क मताधिकार",
          mr: "सार्वत्रिक प्रौढ मताधिकार",
        },
        kind: "idea",
        prompt: {
          en: "Farm labourer or factory owner, woman or man, any faith, any caste — in India every ADULT holds exactly one equal vote. What is this principle called?",
          hi: "खेत-मज़दूर हो या कारख़ाना-मालिक, स्त्री या पुरुष, कोई भी धर्म, कोई भी जाति — भारत में हर वयस्क के पास ठीक एक बराबर वोट है। इस सिद्धांत को क्या कहते हैं?",
          mr: "शेतमजूर असो वा कारखानदार, स्त्री वा पुरुष, कोणताही धर्म, कोणतीही जात — भारतात प्रत्येक प्रौढाकडे नेमके एक सारखे मत आहे. या तत्त्वाला काय म्हणतात?",
        },
        statement: {
          en: "Universal adult franchise gives every adult one vote, equal to every other — no test of wealth, learning, faith or gender stands at the booth.",
          hi: "सार्वभौमिक वयस्क मताधिकार हर वयस्क को एक वोट देता है, हर दूसरे के बराबर — बूथ पर धन, शिक्षा, धर्म या लिंग की कोई कसौटी नहीं खड़ी।",
          mr: "सार्वत्रिक प्रौढ मताधिकार प्रत्येक प्रौढाला एक मत देतो, प्रत्येक इतराच्या बरोबरीचे — केंद्रावर धन, शिक्षण, धर्म वा लिंगाची कोणतीही कसोटी उभी नाही.",
        },
        pair: {
          left: {
            en: "Universal adult franchise",
            hi: "सार्वभौमिक वयस्क मताधिकार",
            mr: "सार्वत्रिक प्रौढ मताधिकार",
          },
          right: {
            en: "one adult, one equal vote",
            hi: "एक वयस्क, एक बराबर वोट",
            mr: "एक प्रौढ, एक सारखे मत",
          },
        },
      },
      {
        id: "restrictedvote",
        name: {
          en: "The old restricted vote",
          hi: "पुराना सीमित मताधिकार",
          mr: "जुना मर्यादित मताधिकार",
        },
        kind: "idea",
        prompt: {
          en: "There was a time, in many lands, when only men with property could vote — the poor and all women shut out. What was this earlier arrangement?",
          hi: "एक समय था, कई देशों में, जब केवल संपत्ति वाले पुरुष वोट दे सकते थे — ग़रीब और सारी स्त्रियाँ बाहर। यह पहले वाली व्यवस्था क्या थी?",
          mr: "एक काळ होता, अनेक देशांत, जेव्हा फक्त मालमत्ता असलेले पुरुषच मत देऊ शकत — गरीब आणि साऱ्या स्त्रिया बाहेर. ही आधीची व्यवस्था काय होती?",
        },
        statement: {
          en: "The vote was once restricted — property-owning men only, in land after land — and long struggles, including women's movements, won it for everyone.",
          hi: "मताधिकार कभी सीमित था — देश-दर-देश केवल संपत्तिधारी पुरुष — और लंबे संघर्षों ने, स्त्री-आंदोलनों समेत, उसे सबके लिए जीता।",
          mr: "मताधिकार कधी मर्यादित होता — देशामागून देश फक्त मालमत्ताधारी पुरुष — आणि दीर्घ लढ्यांनी, स्त्री-चळवळींसह, तो साऱ्यांसाठी जिंकला.",
        },
        detail: {
          en: "India chose differently at birth — every adult voted in the very first election of 1952.",
          hi: "भारत ने जन्म से ही अलग चुना — 1952 के पहले ही चुनाव में हर वयस्क ने वोट दिया।",
          mr: "भारताने जन्मतःच वेगळे निवडले — 1952 च्या पहिल्याच निवडणुकीत प्रत्येक प्रौढाने मत दिले.",
        },
        extra: {
          en: "Doubters abroad called it a gamble; the gamble has held for every election since.",
          hi: "विदेश के शंकालुओं ने इसे जुआ कहा; वह जुआ तब से हर चुनाव में खरा उतरा है।",
          mr: "परदेशातल्या शंकेखोरांनी त्याला जुगार म्हटले; तो जुगार तेव्हापासून प्रत्येक निवडणुकीत खरा उतरला आहे.",
        },
        pair: {
          left: { en: "The restricted vote", hi: "सीमित मताधिकार", mr: "मर्यादित मताधिकार" },
          right: {
            en: "won open by long struggle",
            hi: "लंबे संघर्ष से खुला",
            mr: "दीर्घ लढ्याने खुला झालेला",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Send each job to its level: A-a broken streetlight in the lane, B-a new state highway, C-printing the country's currency. Which trio is right?",
          hi: "हर काम उसके स्तर को भेजिए: अ-गली की टूटी बत्ती, ब-नया राज्य-मार्ग, स-देश की मुद्रा छापना। कौन-सी तिकड़ी सही है?",
          mr: "प्रत्येक काम त्याच्या स्तराकडे पाठवा: अ-गल्लीतला मोडका दिवा, ब-नवा राज्य-महामार्ग, क-देशाचे चलन छापणे. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: local · B: state · C: central",
            hi: "अ: स्थानीय · ब: राज्य · स: केंद्र",
            mr: "अ: स्थानिक · ब: राज्य · क: केंद्र",
          },
          {
            en: "A: central · B: local · C: state",
            hi: "अ: केंद्र · ब: स्थानीय · स: राज्य",
            mr: "अ: केंद्र · ब: स्थानिक · क: राज्य",
          },
          {
            en: "A: state · B: central · C: local",
            hi: "अ: राज्य · ब: केंद्र · स: स्थानीय",
            mr: "अ: राज्य · ब: केंद्र · क: स्थानिक",
          },
          {
            en: "A: local · B: central · C: state",
            hi: "अ: स्थानीय · ब: केंद्र · स: राज्य",
            mr: "अ: स्थानिक · ब: केंद्र · क: राज्य",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Match the job's reach to the level's reach: one lane's light is the local body's; a road across the state is the state's; money that must be the same everywhere is the centre's alone. When a civic problem stalls, the first useful question is exactly this one — whose desk?",
          hi: "काम की पहुँच स्तर की पहुँच से मिलाइए: एक गली की बत्ती स्थानीय निकाय की; राज्य भर की सड़क राज्य की; हर जगह एक-सी रहने वाली मुद्रा केवल केंद्र की। जब कोई नागरिक समस्या अटके, पहला काम का सवाल ठीक यही है — किसकी मेज़?",
          mr: "कामाची पोहोच स्तराच्या पोहोचीशी जुळवा: एका गल्लीचा दिवा स्थानिक संस्थेचा; राज्यभरचा रस्ता राज्याचा; सर्वत्र सारखे राहणारे चलन फक्त केंद्राचे. नागरी समस्या अडली की पहिला उपयोगी प्रश्न नेमका हाच — कोणाचे टेबल?",
        },
      },
      {
        level: 6,
        stem: {
          en: "A minister's car jumps a red light and the constable writes the same challan an autowala would get. Why must the law bind the GOVERNMENT'S own people too?",
          hi: "मंत्री की गाड़ी लाल बत्ती लाँघती है और सिपाही वही चालान काटता है जो ऑटोवाले का कटता। क़ानून को सरकार के अपने लोगों को भी क्यों बाँधना चाहिए?",
          mr: "मंत्र्याची गाडी लाल दिवा ओलांडते आणि हवालदार तेच चलन फाडतो जे रिक्षावाल्याचे फाटले असते. कायद्याने शासनाच्या स्वतःच्या माणसांनाही का बांधले पाहिजे?",
        },
        choices: [
          {
            en: "Because a law that exempts the powerful is not law but privilege — equal application is what makes rules trustworthy and rulers removable",
            hi: "क्योंकि ताक़तवर को छूट देता क़ानून क़ानून नहीं, विशेषाधिकार है — बराबर लागू होना ही नियमों को भरोसेमंद और शासकों को हटाने लायक़ बनाता है",
            mr: "कारण बलवानांना सूट देणारा कायदा कायदा नव्हे, विशेषाधिकार आहे — सारखे लागू होणे हेच नियमांना विश्वासार्ह आणि राज्यकर्त्यांना हटवण्याजोगे करते",
          },
          {
            en: "It need not — leaders are too busy for small rules",
            hi: "ज़रूरी नहीं — नेता छोटे नियमों के लिए बहुत व्यस्त हैं",
            mr: "गरज नाही — नेते लहान नियमांसाठी फार व्यग्र असतात",
          },
          {
            en: "Only traffic rules bind everyone; big laws differ",
            hi: "सिर्फ़ यातायात-नियम सब पर हैं; बड़े क़ानून अलग हैं",
            mr: "फक्त वाहतूक-नियम साऱ्यांवर; मोठे कायदे वेगळे",
          },
          {
            en: "To collect more challan money for the state",
            hi: "राज्य के लिए ज़्यादा चालान-वसूली को",
            mr: "राज्यासाठी जास्त चलन-वसुलीसाठी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The red light is small; the principle is the whole game. If office lifted a person above the rules, then power, not law, would rule — and every promise the government makes would bind only the weak. Democracy's deal is the reverse: the people lend power on condition that its holders stay under the same law, and courts exist to hold them there. The constable's ordinary challan is that whole idea in one slip of paper.",
          hi: "लाल बत्ती छोटी है; सिद्धांत पूरा खेल है। पद अगर किसी को नियमों से ऊपर उठा दे, तो राज क़ानून का नहीं, ताक़त का होगा — और सरकार का हर वादा केवल कमज़ोरों को बाँधेगा। लोकतंत्र का सौदा उलटा है: जनता सत्ता इस शर्त पर उधार देती है कि उसे थामने वाले उसी क़ानून के नीचे रहें, और अदालतें उन्हें वहीं रखने को हैं। सिपाही का मामूली चालान काग़ज़ की एक पर्ची में यही पूरा विचार है।",
          mr: "लाल दिवा लहान; तत्त्व हाच सारा खेळ. पदाने कोणाला नियमांवर उचलले, तर राज्य कायद्याचे नव्हे, ताकदीचे होईल — आणि शासनाचे प्रत्येक वचन फक्त दुर्बलांना बांधेल. लोकशाहीचा सौदा उलटा: जनता सत्ता या अटीवर उसनी देते की ती धरणारे त्याच कायद्याखाली राहतील, आणि न्यायालये त्यांना तिथे ठेवायला आहेत. हवालदाराचे साधे चलन म्हणजे कागदाच्या एका चिठ्ठीत हा सारा विचार.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A day-wage labourer's vote weighs exactly as much as a billionaire's. Some once called that absurd. What is the democratic answer?",
          hi: "दिहाड़ी मज़दूर का वोट ठीक उतना ही तौलता है जितना अरबपति का। कभी कुछ लोगों ने इसे बेतुका कहा। लोकतांत्रिक उत्तर क्या है?",
          mr: "रोजंदारी मजुराचे मत नेमके अब्जाधीशाच्या मताइतकेच तोलले जाते. कधी काहींनी याला मूर्खपणा म्हटले. लोकशाही उत्तर काय?",
        },
        choices: [
          {
            en: "Laws land on every life alike, so every life must weigh alike in choosing the law-makers — the equal vote is equality made real once every election",
            hi: "क़ानून हर जीवन पर एक-से उतरते हैं, तो क़ानून बनाने वालों को चुनने में हर जीवन एक-सा तुलना चाहिए — बराबर वोट हर चुनाव में सच की गई बराबरी है",
            mr: "कायदे प्रत्येक जीवनावर सारखेच उतरतात, म्हणून कायदे करणाऱ्यांना निवडण्यात प्रत्येक जीवन सारखेच तोलले पाहिजे — सारखे मत म्हणजे प्रत्येक निवडणुकीत खरी केलेली समानता",
          },
          {
            en: "The rich should indeed have more votes",
            hi: "अमीरों के पास सचमुच ज़्यादा वोट होने चाहिए",
            mr: "श्रीमंतांकडे खरेच जास्त मते हवीत",
          },
          {
            en: "Votes matter little, so the weighing is moot",
            hi: "वोटों का महत्व कम है, तो तुलना बेमानी है",
            mr: "मतांचे महत्त्व थोडे, म्हणून तोलणे व्यर्थ",
          },
          {
            en: "Only the educated should choose for the rest",
            hi: "केवल शिक्षितों को बाक़ियों के लिए चुनना चाहिए",
            mr: "फक्त शिक्षितांनी इतरांसाठी निवडावे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Turn the objection around: the labourer lives under the same laws, pays the same market prices, sends children to the same wars. If the stakes are equal, the say must be. The booth is the one room where the country's inequalities are checked at the door — and leaders who need the labourer's vote must think about the labourer's life. That is the quiet engine of the equal franchise.",
          hi: "आपत्ति को पलटिए: मज़दूर उन्हीं क़ानूनों तले जीता है, वही बाज़ार-भाव चुकाता है, उन्हीं लड़ाइयों में बच्चे भेजता है। दाँव बराबर हैं तो आवाज़ भी बराबर चाहिए। मतदान-कक्ष वह अकेला कमरा है जहाँ देश की ग़ैर-बराबरियाँ दरवाज़े पर रोक दी जाती हैं — और जिन नेताओं को मज़दूर का वोट चाहिए, उन्हें मज़दूर के जीवन के बारे में सोचना पड़ता है। बराबर मताधिकार का ख़ामोश इंजन यही है।",
          mr: "आक्षेप उलटवा: मजूर त्याच कायद्यांखाली जगतो, तेच बाजारभाव देतो, त्याच लढायांत मुले पाठवतो. पणाला लागलेले सारखे तर आवाजही सारखा हवा. मतदान-कक्ष ही एकमेव खोली जिथे देशाच्या विषमता दारावर अडवल्या जातात — आणि ज्या नेत्यांना मजुराचे मत हवे, त्यांना मजुराच्या जीवनाचा विचार करावा लागतो. समान मताधिकाराचे शांत इंजिन हेच.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Panchayati Raj                                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-6-panchayati-raj",
    subject: "CIVICS",
    classLevel: 6,
    chapter: {
      en: "Chapter 5 — Panchayati Raj",
      hi: "अध्याय 5 — पंचायती राज",
      mr: "प्रकरण 5 — पंचायत राज",
    },
    name: { en: "Panchayati Raj", hi: "पंचायती राज", mr: "पंचायत राज" },
    summary: {
      en: "The village governing itself — the Gram Sabha of all voters, the elected panchayat that works for it, the appointed secretary who keeps its records, and three tiers up to the district.",
      hi: "ख़ुद को चलाता गाँव — सब मतदाताओं की ग्राम सभा, उसके लिए काम करती चुनी हुई पंचायत, उसके काग़ज़ सँभालता नियुक्त सचिव, और ज़िले तक तीन सीढ़ियाँ।",
      mr: "स्वतःला चालवणारे गाव — साऱ्या मतदारांची ग्रामसभा, तिच्यासाठी काम करणारी निवडलेली पंचायत, तिचे कागद सांभाळणारा नेमलेला सचिव, आणि जिल्ह्यापर्यंत तीन पायऱ्या.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "gramsabha",
        name: { en: "The Gram Sabha", hi: "ग्राम सभा", mr: "ग्रामसभा" },
        kind: "body",
        prompt: {
          en: "EVERY voter of the village, met together — the gathering that approves plans, questions spending, and can demand answers of its panchayat. What is this assembly?",
          hi: "गाँव का हर मतदाता, एक साथ जुटा — वह जुटान जो योजनाएँ मंज़ूर करती है, ख़र्च पर सवाल करती है, और अपनी पंचायत से जवाब माँग सकती है। यह सभा क्या है?",
          mr: "गावाचा प्रत्येक मतदार, एकत्र जमलेला — योजना मंजूर करणारी, खर्चावर प्रश्न विचारणारी, आणि आपल्या पंचायतीकडून उत्तरे मागू शकणारी ही सभा कोणती?",
        },
        statement: {
          en: "The Gram Sabha is all the village's voters in one meeting — it approves the panchayat's plans and audits its spending; the village itself, sitting as the boss.",
          hi: "ग्राम सभा गाँव के सारे मतदाताओं की एक बैठक है — वह पंचायत की योजनाएँ मंज़ूर करती और ख़र्च जाँचती है; ख़ुद गाँव, मालिक बनकर बैठा हुआ।",
          mr: "ग्रामसभा म्हणजे गावाच्या साऱ्या मतदारांची एक बैठक — ती पंचायतीच्या योजना मंजूर करते आणि खर्च तपासते; स्वतः गाव, मालक होऊन बसलेले.",
        },
        detail: {
          en: "It needs no election to exist — being a voter of the village IS the membership.",
          hi: "उसके होने को चुनाव नहीं चाहिए — गाँव का मतदाता होना ही सदस्यता है।",
          mr: "तिच्या असण्याला निवडणूक लागत नाही — गावाचा मतदार असणे हीच सदस्यता.",
        },
        extra: {
          en: "A silent Gram Sabha lets its panchayat drift; a questioning one keeps it honest.",
          hi: "चुप ग्राम सभा पंचायत को बहकने देती है; सवाल करती सभा उसे ईमानदार रखती है।",
          mr: "गप्प ग्रामसभा पंचायतीला भरकटू देते; प्रश्न विचारणारी तिला प्रामाणिक ठेवते.",
        },
        pair: {
          left: { en: "The Gram Sabha", hi: "ग्राम सभा", mr: "ग्रामसभा" },
          right: {
            en: "the village as the boss",
            hi: "मालिक बना गाँव",
            mr: "मालक झालेले गाव",
          },
        },
      },
      {
        id: "grampanchayat",
        name: { en: "The Gram Panchayat", hi: "ग्राम पंचायत", mr: "ग्रामपंचायत" },
        kind: "body",
        prompt: {
          en: "Ward members and a president, ELECTED by the village to do its daily work — water, roads, lights, records. Which body is this?",
          hi: "वार्ड सदस्य और एक अध्यक्ष, गाँव के रोज़ के काम — पानी, सड़कें, बत्तियाँ, काग़ज़ — के लिए चुने हुए। यह कौन-सा निकाय है?",
          mr: "प्रभाग सदस्य आणि एक अध्यक्ष, गावाच्या रोजच्या कामासाठी — पाणी, रस्ते, दिवे, कागद — निवडलेले. ही कोणती संस्था?",
        },
        statement: {
          en: "The Gram Panchayat is the village's elected working body — ward members and the sarpanch, chosen by vote to run water, roads, lights and local matters.",
          hi: "ग्राम पंचायत गाँव का चुना कामकाजी निकाय है — वार्ड सदस्य और सरपंच, पानी, सड़कों, बत्तियों और स्थानीय मामलों के लिए वोट से चुने हुए।",
          mr: "ग्रामपंचायत ही गावाची निवडलेली कामकाजी संस्था — प्रभाग सदस्य आणि सरपंच, पाणी, रस्ते, दिवे आणि स्थानिक बाबींसाठी मताने निवडलेले.",
        },
        pair: {
          left: { en: "The Gram Panchayat", hi: "ग्राम पंचायत", mr: "ग्रामपंचायत" },
          right: {
            en: "elected to do the work",
            hi: "काम करने को चुनी हुई",
            mr: "काम करण्यासाठी निवडलेली",
          },
        },
      },
      {
        id: "sarpanch",
        name: { en: "The Sarpanch", hi: "सरपंच", mr: "सरपंच" },
        kind: "person",
        prompt: {
          en: "Who presides over the panchayat's meetings and answers, face to face, when the Gram Sabha demands an account?",
          hi: "पंचायत की बैठकों की अध्यक्षता कौन करता है और ग्राम सभा के हिसाब माँगने पर आमने-सामने जवाब कौन देता है?",
          mr: "पंचायतीच्या बैठकांचे अध्यक्षस्थान कोण भूषवतो आणि ग्रामसभेने हिशेब मागितल्यावर समोरासमोर उत्तर कोण देतो?",
        },
        statement: {
          en: "The Sarpanch is the panchayat's elected president — leading its meetings and answerable to the Gram Sabha for its work and money.",
          hi: "सरपंच पंचायत का चुना अध्यक्ष है — बैठकों की अगुवाई करता, और काम व पैसे के लिए ग्राम सभा को जवाबदेह।",
          mr: "सरपंच हा पंचायतीचा निवडलेला अध्यक्ष — बैठकांचे नेतृत्व करणारा, आणि काम व पैशासाठी ग्रामसभेला उत्तरदायी.",
        },
        pair: {
          left: { en: "The Sarpanch", hi: "सरपंच", mr: "सरपंच" },
          right: {
            en: "president, and answerable",
            hi: "अध्यक्ष, और जवाबदेह",
            mr: "अध्यक्ष, आणि उत्तरदायी",
          },
        },
      },
      {
        id: "secretary",
        name: { en: "The Secretary", hi: "सचिव", mr: "सचिव" },
        kind: "person",
        prompt: {
          en: "One official is APPOINTED, not elected — calling the meetings, writing the minutes, keeping the records of both sabha and panchayat. Who is this?",
          hi: "एक कर्मचारी नियुक्त होता है, चुना नहीं जाता — बैठकें बुलाता, कार्यवृत्त लिखता, सभा और पंचायत दोनों के अभिलेख रखता। यह कौन है?",
          mr: "एक कर्मचारी नेमलेला असतो, निवडलेला नाही — बैठका बोलावणारा, इतिवृत्त लिहिणारा, सभा आणि पंचायत दोघांचे दफ्तर ठेवणारा. हा कोण?",
        },
        statement: {
          en: "The Secretary is appointed by the government, not elected — calling meetings and keeping the records that let the village's decisions outlive memory.",
          hi: "सचिव सरकार द्वारा नियुक्त है, चुना नहीं — बैठकें बुलाता और वे अभिलेख रखता जो गाँव के फ़ैसलों को याददाश्त से आगे जिलाते हैं।",
          mr: "सचिव शासनाने नेमलेला, निवडलेला नाही — बैठका बोलावणारा आणि गावाचे निर्णय स्मरणापलीकडे जगवणारे दफ्तर ठेवणारा.",
        },
        pair: {
          left: { en: "The Secretary", hi: "सचिव", mr: "सचिव" },
          right: {
            en: "appointed keeper of the record",
            hi: "अभिलेखों का नियुक्त रखवाला",
            mr: "दफ्तराचा नेमलेला राखणदार",
          },
        },
      },
      {
        id: "panchayatwork",
        name: { en: "The panchayat's work", hi: "पंचायत का काम", mr: "पंचायतीचे काम" },
        kind: "body",
        prompt: {
          en: "Hand-pumps repaired, lanes paved, streetlights lit, small local taxes collected — whose everyday charge is all this?",
          hi: "सुधरे हैंडपंप, पक्की गलियाँ, जलीं बत्तियाँ, वसूले छोटे स्थानीय कर — यह सब किसका रोज़ का ज़िम्मा है?",
          mr: "दुरुस्त हातपंप, पक्क्या गल्ल्या, लागलेले दिवे, वसूल केलेले छोटे स्थानिक कर — हे सारे कोणाचा रोजचा कार्यभार?",
        },
        statement: {
          en: "The panchayat's work is the village's daily needs — water sources, lanes, lights and drains, paid for partly by small local taxes it may levy.",
          hi: "पंचायत का काम गाँव की रोज़ की ज़रूरतें हैं — जल-स्रोत, गलियाँ, बत्तियाँ और नालियाँ, जिनका ख़र्च कुछ उसके लगाए छोटे स्थानीय करों से चलता है।",
          mr: "पंचायतीचे काम म्हणजे गावाच्या रोजच्या गरजा — जलस्रोत, गल्ल्या, दिवे आणि गटारे, ज्यांचा खर्च काहीसा तिने लावलेल्या छोट्या स्थानिक करांतून चालतो.",
        },
      },
      {
        id: "threetiers",
        name: { en: "The three tiers", hi: "तीन सीढ़ियाँ", mr: "तीन पायऱ्या" },
        kind: "body",
        prompt: {
          en: "Village panchayat, then the block's Panchayat Samiti, then the district's Zila Parishad — what is this ladder of rural self-government called?",
          hi: "ग्राम पंचायत, फिर खंड की पंचायत समिति, फिर ज़िले की ज़िला परिषद — ग्रामीण स्व-शासन की इस सीढ़ी को क्या कहते हैं?",
          mr: "ग्रामपंचायत, मग गटाची पंचायत समिती, मग जिल्ह्याची जिल्हा परिषद — ग्रामीण स्वशासनाच्या या शिडीला काय म्हणतात?",
        },
        statement: {
          en: "Panchayati Raj climbs three tiers — Gram Panchayat for the village, Panchayat Samiti for the block, Zila Parishad for the district — each handling what outgrows the one below.",
          hi: "पंचायती राज तीन सीढ़ियाँ चढ़ता है — गाँव की ग्राम पंचायत, खंड की पंचायत समिति, ज़िले की ज़िला परिषद — हर सीढ़ी वह सँभालती है जो नीचे वाली से बड़ा हो जाए।",
          mr: "पंचायत राज तीन पायऱ्या चढते — गावाची ग्रामपंचायत, गटाची पंचायत समिती, जिल्ह्याची जिल्हा परिषद — प्रत्येक पायरी खालच्या पायरीहून मोठे झालेले सांभाळते.",
        },
        pair: {
          left: { en: "The three tiers", hi: "तीन सीढ़ियाँ", mr: "तीन पायऱ्या" },
          right: {
            en: "village, block, district",
            hi: "गाँव, खंड, ज़िला",
            mr: "गाव, गट, जिल्हा",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the person to their standing: A-every voter of the village, B-elected to preside, C-appointed to keep records. Which trio is right?",
          hi: "व्यक्ति को उसकी हैसियत से मिलाइए: अ-गाँव का हर मतदाता, ब-अध्यक्षता को चुना हुआ, स-अभिलेख रखने को नियुक्त। कौन-सी तिकड़ी सही है?",
          mr: "व्यक्ती तिच्या स्थानाशी जुळवा: अ-गावाचा प्रत्येक मतदार, ब-अध्यक्षतेसाठी निवडलेला, क-दफ्तरासाठी नेमलेला. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the Gram Sabha · B: the Sarpanch · C: the Secretary",
            hi: "अ: ग्राम सभा · ब: सरपंच · स: सचिव",
            mr: "अ: ग्रामसभा · ब: सरपंच · क: सचिव",
          },
          {
            en: "A: the Secretary · B: the Gram Sabha · C: the Sarpanch",
            hi: "अ: सचिव · ब: ग्राम सभा · स: सरपंच",
            mr: "अ: सचिव · ब: ग्रामसभा · क: सरपंच",
          },
          {
            en: "A: the Sarpanch · B: the Secretary · C: the Gram Sabha",
            hi: "अ: सरपंच · ब: सचिव · स: ग्राम सभा",
            mr: "अ: सरपंच · ब: सचिव · क: ग्रामसभा",
          },
          {
            en: "A: the Gram Sabha · B: the Secretary · C: the Sarpanch",
            hi: "अ: ग्राम सभा · ब: सचिव · स: सरपंच",
            mr: "अ: ग्रामसभा · ब: सचिव · क: सरपंच",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three ways of belonging: the Gram Sabha needs no election — voters ARE it; the Sarpanch must win votes; the Secretary is posted by the government. Member, elected, appointed — the village runs on all three kinds at once, each checking the others.",
          hi: "जुड़ने के तीन ढंग: ग्राम सभा को चुनाव नहीं चाहिए — मतदाता ही वह हैं; सरपंच को वोट जीतने हैं; सचिव सरकार का बिठाया है। सदस्य, निर्वाचित, नियुक्त — गाँव तीनों क़िस्मों पर एक साथ चलता है, हर एक बाक़ियों को जाँचती हुई।",
          mr: "संबंधाचे तीन प्रकार: ग्रामसभेला निवडणूक लागत नाही — मतदार म्हणजेच ती; सरपंचाला मते जिंकावी लागतात; सचिव शासनाने बसवलेला. सदस्य, निर्वाचित, नियुक्त — गाव तिन्ही प्रकारांवर एकदम चालते, प्रत्येक इतरांना तपासत.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The panchayat spends the village's money; the Gram Sabha can demand its accounts. Why is this arrangement — spender answerable to assembly — the heart of the whole system?",
          hi: "पंचायत गाँव का पैसा ख़र्च करती है; ग्राम सभा उसका हिसाब माँग सकती है। यह व्यवस्था — सभा को जवाबदेह ख़र्च करने वाला — पूरे तंत्र का हृदय क्यों है?",
          mr: "पंचायत गावाचा पैसा खर्च करते; ग्रामसभा तिचा हिशेब मागू शकते. ही व्यवस्था — सभेला उत्तरदायी खर्च करणारा — साऱ्या यंत्रणेचे हृदय का?",
        },
        choices: [
          {
            en: "Because power spending public money drifts unless watched — and the watchers here are the very people the money should serve, meeting face to face",
            hi: "क्योंकि जनता का पैसा ख़र्च करती सत्ता बिना निगरानी बहक जाती है — और यहाँ निगरानी वही लोग करते हैं जिनके काम वह पैसा आना चाहिए, आमने-सामने बैठकर",
            mr: "कारण जनतेचा पैसा खर्च करणारी सत्ता देखरेखीविना भरकटते — आणि इथे देखरेख तीच माणसे करतात ज्यांच्या कामी तो पैसा यायला हवा, समोरासमोर बसून",
          },
          {
            en: "Because the Gram Sabha enjoys long meetings",
            hi: "क्योंकि ग्राम सभा को लंबी बैठकें भाती हैं",
            mr: "कारण ग्रामसभेला लांब बैठका आवडतात",
          },
          {
            en: "Because the panchayat cannot count without help",
            hi: "क्योंकि पंचायत बिना मदद गिन नहीं सकती",
            mr: "कारण पंचायतीला मदतीविना मोजता येत नाही",
          },
          {
            en: "It is a formality with no real effect",
            hi: "यह बिना असर की औपचारिकता है",
            mr: "ही परिणामशून्य औपचारिकता आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Distance is corruption's friend: money audited from a far capital can hide in paperwork. But a hand-pump claimed on paper and absent in the lane is visible to every neighbour at the Gram Sabha — the audit walks past the evidence daily. Panchayati Raj bets that the closest eyes watch best; the bet only pays when the villagers actually attend and ask. An empty Gram Sabha is a blank cheque.",
          hi: "दूरी भ्रष्टाचार की दोस्त है: दूर की राजधानी से जँचा पैसा काग़ज़ों में छिप सकता है। पर काग़ज़ पर बना और गली से ग़ायब हैंडपंप ग्राम सभा के हर पड़ोसी को दिखता है — जाँच रोज़ सबूत के पास से गुज़रती है। पंचायती राज का दाँव है कि सबसे पास की आँखें सबसे अच्छी चौकसी करती हैं; दाँव तभी फलता है जब गाँव वाले सचमुच आएँ और पूछें। ख़ाली ग्राम सभा कोरा चेक है।",
          mr: "अंतर हा भ्रष्टाचाराचा मित्र: दूरच्या राजधानीतून तपासलेला पैसा कागदांत लपू शकतो. पण कागदावर झालेला आणि गल्लीत नसलेला हातपंप ग्रामसभेतल्या प्रत्येक शेजाऱ्याला दिसतो — तपासणी रोज पुराव्याजवळून जाते. पंचायत राजची पैज ही की सर्वांत जवळचे डोळे उत्तम राखण करतात; पैज तेव्हाच फळते जेव्हा गावकरी खरेच येतात आणि विचारतात. रिकामी ग्रामसभा म्हणजे कोरा धनादेश.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A hand-pump is the Gram Panchayat's job; a canal serving forty villages belongs to the Zila Parishad. What rule decides which tier owns a problem?",
          hi: "हैंडपंप ग्राम पंचायत का काम है; चालीस गाँवों की नहर ज़िला परिषद की। कौन-सा नियम तय करता है कि समस्या किस सीढ़ी की है?",
          mr: "हातपंप ग्रामपंचायतीचे काम; चाळीस गावांचा कालवा जिल्हा परिषदेचा. कोणता नियम ठरवतो की समस्या कोणत्या पायरीची?",
        },
        choices: [
          {
            en: "Match the problem's reach to the tier's reach — what one village can settle stays with it; what spans many rises just high enough to cover them all, and no higher",
            hi: "समस्या की पहुँच सीढ़ी की पहुँच से मिलाइए — जो एक गाँव सुलझा ले वह उसी के पास; जो कई में फैले वह बस इतना ऊपर उठे कि सबको समेट ले, उससे ऊपर नहीं",
            mr: "समस्येची पोहोच पायरीच्या पोहोचीशी जुळवा — एक गाव सोडवेल ते त्याच्याकडेच; अनेकांत पसरेल ते साऱ्यांना घेईल इतकेच वर चढावे, त्याहून वर नाही",
          },
          {
            en: "The higher tier takes whatever costs more money",
            hi: "जो महँगा हो वह ऊँची सीढ़ी ले लेती है",
            mr: "जे महाग ते वरची पायरी घेते",
          },
          {
            en: "Tiers take turns by rotation each year",
            hi: "सीढ़ियाँ हर साल बारी-बारी लेती हैं",
            mr: "पायऱ्या दरवर्षी आळीपाळीने घेतात",
          },
          {
            en: "The district decides everything and delegates nothing",
            hi: "ज़िला सब तय करता है, कुछ नहीं सौंपता",
            mr: "जिल्हा सारे ठरवतो, काही सोपवत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The ladder exists because problems come in sizes. A pump serves one lane — the village fixes it fastest and knows it best. A canal crossing forty villages would set them quarrelling over water — only a body containing all forty can rule fairly. The principle — keep decisions as LOW as the problem allows — respects both local knowledge and shared stakes, and it is the same logic that stacks local, state and central government above the villages.",
          hi: "सीढ़ी इसलिए है कि समस्याओं के नाप होते हैं। पंप एक गली का है — गाँव उसे सबसे तेज़ सुधारता और सबसे अच्छा जानता है। चालीस गाँवों की नहर उन्हें पानी पर लड़ा देती — केवल चालीसों को समेटता निकाय ही न्याय कर सकता है। सिद्धांत — फ़ैसले उतने ही नीचे रखो जितना समस्या रहने दे — स्थानीय समझ और साझे दाँव दोनों का मान रखता है, और यही तर्क गाँवों के ऊपर स्थानीय, राज्य और केंद्र सरकार की चिनाई करता है।",
          mr: "शिडी यासाठी आहे की समस्यांना मापे असतात. पंप एका गल्लीचा — गाव तो सर्वांत वेगाने दुरुस्त करते आणि उत्तम जाणते. चाळीस गावांचा कालवा त्यांना पाण्यावरून भांडवेल — फक्त चाळिसांना सामावणारी संस्थाच न्याय करू शकते. तत्त्व — निर्णय समस्या राहू देईल इतकेच खाली ठेवा — स्थानिक जाण आणि सामायिक हितसंबंध दोन्हींचा मान राखते, आणि हाच तर्क गावांवर स्थानिक, राज्य आणि केंद्र शासनाची रचना करतो.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Rural Livelihoods                                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-6-rural-livelihoods",
    subject: "CIVICS",
    classLevel: 6,
    chapter: {
      en: "Chapter 8 — Rural Livelihoods",
      hi: "अध्याय 8 — ग्रामीण आजीविकाएँ",
      mr: "प्रकरण 8 — ग्रामीण उपजीविका",
    },
    name: { en: "Rural Livelihoods", hi: "ग्रामीण आजीविकाएँ", mr: "ग्रामीण उपजीविका" },
    summary: {
      en: "One village, many earnings — the labourer paid by the day, the small farmer sowing on borrowed money, the large farmer who lends it, the fishing family reading the sea.",
      hi: "एक गाँव, कई कमाइयाँ — दिहाड़ी पाता मज़दूर, उधार पर बोता छोटा किसान, उधार देता बड़ा किसान, समुद्र पढ़ता मछुआरा परिवार।",
      mr: "एक गाव, अनेक कमाया — रोजंदारीवरचा मजूर, उसन्या पैशावर पेरणारा छोटा शेतकरी, उसने देणारा मोठा शेतकरी, समुद्र वाचणारे कोळी कुटुंब.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "landlesslabourer",
        name: {
          en: "The landless labourer",
          hi: "भूमिहीन मज़दूर",
          mr: "भूमिहीन मजूर",
        },
        kind: "villager",
        prompt: {
          en: "No field of her own — she weeds, transplants and harvests OTHERS' fields for a daily wage, and in the empty months finds what work she can. Who is she?",
          hi: "अपना कोई खेत नहीं — वह दिहाड़ी पर दूसरों के खेत निराती, रोपती, काटती है, और ख़ाली महीनों में जो मिले वह काम खोजती है। वह कौन है?",
          mr: "स्वतःचे शेत नाही — ती रोजंदारीवर दुसऱ्यांची शेते खुरपते, लावते, कापते, आणि रिकाम्या महिन्यांत मिळेल ते काम शोधते. ती कोण?",
        },
        statement: {
          en: "The landless labourer earns a daily wage in others' fields — work comes with the seasons and vanishes between them, and no land of her own stands behind her.",
          hi: "भूमिहीन मज़दूर दूसरों के खेतों में दिहाड़ी कमाती है — काम मौसमों संग आता और उनके बीच ग़ायब हो जाता है, और पीछे अपनी कोई ज़मीन नहीं खड़ी।",
          mr: "भूमिहीन मजूर दुसऱ्यांच्या शेतांत रोजंदारी कमावते — काम ऋतूंसोबत येते आणि त्यांच्या मध्ये नाहीसे होते, आणि पाठीशी स्वतःची जमीन उभी नाही.",
        },
        detail: {
          en: "In Tamil Nadu's villages, families like Thulasi's live this calendar — sowing-season wages, lean-season searching.",
          hi: "तमिलनाडु के गाँवों में थुलसी जैसे परिवार यही पंचांग जीते हैं — बुआई के मौसम की मज़दूरी, दुबले मौसम की तलाश।",
          mr: "तमिळनाडूच्या गावांत थुलसीसारखी कुटुंबे हेच पंचांग जगतात — पेरणी-हंगामाची मजुरी, तुटीच्या हंगामाचा शोध.",
        },
        extra: {
          en: "Nearly two of every five rural families in India earn mainly this way.",
          hi: "भारत के हर पाँच ग्रामीण परिवारों में क़रीब दो की मुख्य कमाई यही है।",
          mr: "भारताच्या दर पाच ग्रामीण कुटुंबांत सुमारे दोघांची मुख्य कमाई हीच आहे.",
        },
        pair: {
          left: { en: "The landless labourer", hi: "भूमिहीन मज़दूर", mr: "भूमिहीन मजूर" },
          right: {
            en: "wages that follow the seasons",
            hi: "मौसमों के पीछे चलती दिहाड़ी",
            mr: "ऋतूंमागे चालणारी रोजंदारी",
          },
        },
      },
      {
        id: "smallfarmer",
        name: { en: "The small farmer", hi: "छोटा किसान", mr: "छोटा शेतकरी" },
        kind: "villager",
        prompt: {
          en: "Two acres of his own, seed and fertiliser bought on LOAN, the whole year's hope standing in one crop — which villager is this?",
          hi: "अपनी दो एकड़, उधार पर ख़रीदे बीज-खाद, साल भर की आस एक फ़सल में खड़ी — यह कौन-सा गाँववाला है?",
          mr: "स्वतःचे दोन एकर, कर्जावर घेतलेले बियाणे-खत, वर्षभराची आशा एका पिकात उभी — हा कोणता गावकरी?",
        },
        statement: {
          en: "The small farmer works his own few acres but borrows for seed and fertiliser — one good crop repays the loan, one failed crop deepens it.",
          hi: "छोटा किसान अपनी थोड़ी ज़मीन जोतता है पर बीज-खाद के लिए उधार लेता है — एक अच्छी फ़सल क़र्ज़ चुका देती है, एक चूकी फ़सल उसे गहरा कर देती है।",
          mr: "छोटा शेतकरी स्वतःची थोडी जमीन कसतो पण बियाणे-खतासाठी कर्ज घेतो — एक चांगले पीक कर्ज फेडते, एक बुडालेले पीक ते खोल करते.",
        },
        detail: {
          en: "The loan often comes from a moneylender at heavy interest — the bank's door being far or slow.",
          hi: "उधार अक्सर भारी ब्याज पर साहूकार से आता है — बैंक का दरवाज़ा दूर या धीमा होने से।",
          mr: "कर्ज बहुधा जबर व्याजाने सावकाराकडून येते — बँकेचे दार दूर वा संथ असल्याने.",
        },
        extra: {
          en: "Most of India's farmers farm plots this small — his story is the countryside's commonest one.",
          hi: "भारत के ज़्यादातर किसान इतने ही छोटे टुकड़े जोतते हैं — उसकी कहानी देहात की सबसे आम कहानी है।",
          mr: "भारताचे बहुतेक शेतकरी इतकेच लहान तुकडे कसतात — त्याची गोष्ट ही खेड्याची सर्वांत सामान्य गोष्ट.",
        },
        pair: {
          left: { en: "The small farmer", hi: "छोटा किसान", mr: "छोटा शेतकरी" },
          right: {
            en: "own land, borrowed seed",
            hi: "अपनी ज़मीन, उधार का बीज",
            mr: "स्वतःची जमीन, उसने बियाणे",
          },
        },
      },
      {
        id: "largefarmer",
        name: { en: "The large farmer", hi: "बड़ा किसान", mr: "मोठा शेतकरी" },
        kind: "villager",
        prompt: {
          en: "Fields enough to hire labourers, harvests big enough to SELL, and money spare to lend at interest — which villager stands here?",
          hi: "मज़दूर रखने लायक़ खेत, बेचने लायक़ बड़ी फ़सलें, और ब्याज पर देने लायक़ फ़ालतू पैसा — यहाँ कौन-सा गाँववाला खड़ा है?",
          mr: "मजूर ठेवण्याइतकी शेते, विकण्याइतकी मोठी पिके, आणि व्याजाने देण्याइतका जादा पैसा — इथे कोणता गावकरी उभा?",
        },
        statement: {
          en: "The large farmer hires labour, sells his surplus in the market, and often lends money — the village's employer, seller and creditor in one house.",
          hi: "बड़ा किसान मज़दूर रखता है, अधिशेष बाज़ार में बेचता है, और अक्सर उधार देता है — गाँव का नियोक्ता, विक्रेता और महाजन एक ही घर में।",
          mr: "मोठा शेतकरी मजूर ठेवतो, वाढावा बाजारात विकतो, आणि अनेकदा उसने देतो — गावाचा मालक, विक्रेता आणि सावकार एकाच घरात.",
        },
        pair: {
          left: { en: "The large farmer", hi: "बड़ा किसान", mr: "मोठा शेतकरी" },
          right: {
            en: "surplus to sell, money to lend",
            hi: "बेचने को अधिशेष, देने को पैसा",
            mr: "विकायला वाढावा, द्यायला पैसा",
          },
        },
      },
      {
        id: "debttrap",
        name: { en: "The debt spiral", hi: "क़र्ज़ का चक्कर", mr: "कर्जाचा फेरा" },
        kind: "risk",
        prompt: {
          en: "Loan taken for seed, rains fail, crop dies — and next season needs a NEW loan before the old one is paid. What is this tightening circle called?",
          hi: "बीज को लिया उधार, बारिश चूकी, फ़सल मरी — और अगला मौसम पुराना चुकने से पहले नया उधार माँगता है। इस कसते घेरे को क्या कहते हैं?",
          mr: "बियाण्यासाठी घेतलेले कर्ज, पाऊस चुकला, पीक मेले — आणि पुढचा हंगाम जुने फिटण्याआधी नवे कर्ज मागतो. या आवळणाऱ्या फेऱ्याला काय म्हणतात?",
        },
        statement: {
          en: "The debt spiral turns when a failed crop leaves the loan unpaid and the next sowing needs fresh borrowing — each round tightening, the farmer's deepest fear.",
          hi: "क़र्ज़ का चक्कर तब घूमता है जब चूकी फ़सल उधार अनचुका छोड़ती है और अगली बुआई नया उधार माँगती है — हर फेरा कसता हुआ, किसान का सबसे गहरा डर।",
          mr: "कर्जाचा फेरा तेव्हा फिरतो जेव्हा बुडालेले पीक कर्ज न फेडलेले ठेवते आणि पुढची पेरणी नवे कर्ज मागते — प्रत्येक फेरी आवळणारी, शेतकऱ्याची सर्वांत खोल भीती.",
        },
        detail: {
          en: "The rain is the spiral's trigger — one dry monsoon can start what takes years to escape.",
          hi: "बारिश ही चक्कर का ट्रिगर है — एक सूखा मानसून वह शुरू कर सकता है जिससे निकलने में बरस लगते हैं।",
          mr: "पाऊस हाच फेऱ्याची ठिणगी — एक कोरडा पावसाळा असे सुरू करू शकतो ज्यातून निघायला वर्षे लागतात.",
        },
        extra: {
          en: "This is why crop failure means far more in a village than a bad month means in a salaried home.",
          hi: "इसीलिए फ़सल का चूकना गाँव में उससे कहीं ज़्यादा है जो वेतन वाले घर में एक बुरा महीना है।",
          mr: "म्हणूनच पीक बुडणे हे गावात पगारी घरातल्या एका वाईट महिन्याहून कितीतरी जास्त असते.",
        },
        pair: {
          left: { en: "The debt spiral", hi: "क़र्ज़ का चक्कर", mr: "कर्जाचा फेरा" },
          right: {
            en: "old loan chasing new",
            hi: "नए के पीछे पुराना उधार",
            mr: "नव्यामागे जुने कर्ज",
          },
        },
      },
      {
        id: "nonfarmwork",
        name: {
          en: "The village's other work",
          hi: "गाँव के दूसरे काम",
          mr: "गावाची इतर कामे",
        },
        kind: "villager",
        prompt: {
          en: "Not everyone farms — the dairy pail, the smithy, the kirana shop, the basket loom also feed village families. What is this work called as a group?",
          hi: "सब खेती नहीं करते — दूध की बाल्टी, लोहार की भट्ठी, किराना दुकान, टोकरी का करघा भी गाँव के परिवार पालते हैं। इस काम-समूह को क्या कहते हैं?",
          mr: "सारे शेती करत नाहीत — दुधाची घागर, लोहाराची भट्टी, किराणा दुकान, टोपलीचा माग हेही गावची कुटुंबे पोसतात. या काम-समूहाला काय म्हणतात?",
        },
        statement: {
          en: "Non-farm work — dairying, smithing, shopkeeping, weaving — feeds many village families, and steadies homes when the fields have nothing to give.",
          hi: "ग़ैर-कृषि काम — दूध, लोहारी, दुकानदारी, बुनाई — गाँव के कई परिवार पालता है, और जब खेतों के पास देने को कुछ नहीं होता तब घर सँभालता है।",
          mr: "बिगर-शेती काम — दूध, लोहारकाम, दुकानदारी, विणकाम — गावची अनेक कुटुंबे पोसते, आणि शेतांकडे द्यायला काही नसते तेव्हा घरे सावरते.",
        },
        pair: {
          left: { en: "Non-farm work", hi: "ग़ैर-कृषि काम", mr: "बिगर-शेती काम" },
          right: {
            en: "earnings beside the fields",
            hi: "खेतों के बग़ल की कमाई",
            mr: "शेतांशेजारची कमाई",
          },
        },
      },
      {
        id: "fishingfamily",
        name: { en: "The fishing family", hi: "मछुआरा परिवार", mr: "कोळी कुटुंब" },
        kind: "villager",
        prompt: {
          en: "Out before dawn on a catamaran, income decided by the day's catch, and four monsoon months when the sea itself is closed — whose living is this?",
          hi: "पौ फटने से पहले कटमरैन पर, आमदनी दिन की पकड़ से तय, और चार मानसूनी महीने जब ख़ुद समुद्र बंद है — यह किसकी रोज़ी है?",
          mr: "पहाटेआधी कॅटामरानवर, कमाई दिवसाच्या पकडीवर ठरणारी, आणि चार पावसाळी महिने जेव्हा स्वतः समुद्रच बंद — ही कोणाची रोजी?",
        },
        statement: {
          en: "The fishing family lives by the day's catch — out before dawn, paid by what the net brings, and lean through the monsoon months when boats stay beached.",
          hi: "मछुआरा परिवार दिन की पकड़ पर जीता है — भोर से पहले निकलता, जाल की देन पर पलता, और मानसूनी महीनों में दुबलाता जब नावें किनारे पड़ी रहती हैं।",
          mr: "कोळी कुटुंब दिवसाच्या पकडीवर जगते — पहाटेआधी निघते, जाळे देईल त्यावर पोसते, आणि होड्या किनाऱ्यावर पडून राहतात त्या पावसाळी महिन्यांत आवळते.",
        },
        pair: {
          left: { en: "The fishing family", hi: "मछुआरा परिवार", mr: "कोळी कुटुंब" },
          right: {
            en: "paid by the day's net",
            hi: "दिन के जाल की कमाई",
            mr: "दिवसाच्या जाळ्याची कमाई",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the villager to what stands behind them: A-only their two hands, B-a small plot and a loan, C-surplus grain and money lent out. Which trio is right?",
          hi: "गाँववाले को उसके पीछे खड़ी चीज़ से मिलाइए: अ-केवल अपने दो हाथ, ब-छोटा टुकड़ा और उधार, स-अधिशेष अनाज और दिया हुआ पैसा। कौन-सी तिकड़ी सही है?",
          mr: "गावकऱ्याला त्याच्या पाठीशी उभ्या असलेल्याशी जुळवा: अ-फक्त आपले दोन हात, ब-छोटा तुकडा आणि कर्ज, क-वाढावा धान्य आणि दिलेला पैसा. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the landless labourer · B: the small farmer · C: the large farmer",
            hi: "अ: भूमिहीन मज़दूर · ब: छोटा किसान · स: बड़ा किसान",
            mr: "अ: भूमिहीन मजूर · ब: छोटा शेतकरी · क: मोठा शेतकरी",
          },
          {
            en: "A: the large farmer · B: the landless labourer · C: the small farmer",
            hi: "अ: बड़ा किसान · ब: भूमिहीन मज़दूर · स: छोटा किसान",
            mr: "अ: मोठा शेतकरी · ब: भूमिहीन मजूर · क: छोटा शेतकरी",
          },
          {
            en: "A: the small farmer · B: the large farmer · C: the landless labourer",
            hi: "अ: छोटा किसान · ब: बड़ा किसान · स: भूमिहीन मज़दूर",
            mr: "अ: छोटा शेतकरी · ब: मोठा शेतकरी · क: भूमिहीन मजूर",
          },
          {
            en: "A: the landless labourer · B: the large farmer · C: the small farmer",
            hi: "अ: भूमिहीन मज़दूर · ब: बड़ा किसान · स: छोटा किसान",
            mr: "अ: भूमिहीन मजूर · ब: मोठा शेतकरी · क: छोटा शेतकरी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three rungs of one ladder, set by what each owns: hands alone, a plot plus a debt, fields plus a surplus. The same harvest reaches them differently — wages for the first, survival for the second, profit for the third. Reading a village means reading this ladder first.",
          hi: "एक सीढ़ी की तीन पैड़ियाँ, हर एक की मिल्कियत से तय: अकेले हाथ, टुकड़ा और क़र्ज़, खेत और अधिशेष। वही फ़सल तीनों तक अलग-अलग पहुँचती है — पहले को दिहाड़ी, दूसरे को गुज़ारा, तीसरे को मुनाफ़ा। गाँव पढ़ना यानी पहले यह सीढ़ी पढ़ना।",
          mr: "एका शिडीच्या तीन पायऱ्या, प्रत्येकाच्या मालकीने ठरलेल्या: एकटे हात, तुकडा आणि कर्ज, शेते आणि वाढावा. तीच कापणी तिघांपर्यंत वेगवेगळी पोहोचते — पहिल्याला रोजंदारी, दुसऱ्याला गुजराण, तिसऱ्याला नफा. गाव वाचणे म्हणजे आधी ही शिडी वाचणे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The same failed monsoon strikes the whole village — yet the large farmer weathers it, the small farmer sinks toward debt, the labourer simply finds no work. Why does ONE rain fail three different ways?",
          hi: "वही चूका मानसून पूरे गाँव पर पड़ता है — फिर भी बड़ा किसान झेल जाता है, छोटा किसान क़र्ज़ की ओर धँसता है, मज़दूर को बस काम नहीं मिलता। एक बारिश तीन तरह से क्यों चूकती है?",
          mr: "तोच चुकलेला पावसाळा साऱ्या गावावर पडतो — तरी मोठा शेतकरी निभावतो, छोटा शेतकरी कर्जाकडे खचतो, मजुराला नुसते काम मिळत नाही. एक पाऊस तीन प्रकारे का चुकतो?",
        },
        choices: [
          {
            en: "Because each holds a different cushion — stored surplus absorbs the blow, a standing loan doubles it, and no land means the blow arrives as vanished wages",
            hi: "क्योंकि हर एक के पास अलग गद्दी है — जमा अधिशेष चोट सोख लेता है, खड़ा क़र्ज़ उसे दुगना करता है, और बे-ज़मीनी में चोट ग़ायब दिहाड़ी बनकर आती है",
            mr: "कारण प्रत्येकाकडे वेगळी उशी आहे — साठलेला वाढावा घाव सोसतो, उभे कर्ज तो दुप्पट करते, आणि जमीन नसणे म्हणजे घाव नाहीशा रोजंदारीच्या रूपात येतो",
          },
          {
            en: "Because the rain truly falls only on small plots",
            hi: "क्योंकि बारिश सचमुच छोटे टुकड़ों पर ही नहीं गिरती",
            mr: "कारण पाऊस खरेच फक्त छोट्या तुकड्यांवर पडत नाही",
          },
          {
            en: "Because large farmers know better weather prayers",
            hi: "क्योंकि बड़े किसान बेहतर मौसम-प्रार्थनाएँ जानते हैं",
            mr: "कारण मोठ्या शेतकऱ्यांना चांगल्या हवामान-प्रार्थना येतात",
          },
          {
            en: "It does not — all three suffer identically",
            hi: "ऐसा नहीं — तीनों एक-सा भुगतते हैं",
            mr: "असे नाही — तिघे सारखेच भोगतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The sky is impartial; the ground beneath each family is not. The large farmer eats last year's surplus and waits. The small farmer owes for the seed now rotting in dry soil — his loss is doubled by interest. The labourer loses the very work the sowing would have made. One drought, three arithmetics — which is why 'the village' can never be helped by one policy fitted to one rung.",
          hi: "आसमान निष्पक्ष है; हर परिवार तले की ज़मीन नहीं। बड़ा किसान पिछले साल का अधिशेष खाकर प्रतीक्षा करता है। छोटे किसान पर उस बीज का उधार है जो अब सूखी मिट्टी में सड़ रहा है — ब्याज उसका घाटा दुगना करता है। मज़दूर वही काम खो देता है जो बुआई से बनता। एक सूखा, तीन गणित — इसीलिए 'गाँव' की मदद एक पैड़ी पर सिली एक नीति से कभी नहीं होती।",
          mr: "आकाश निःपक्ष आहे; प्रत्येक कुटुंबाखालची जमीन नाही. मोठा शेतकरी गेल्या वर्षीचा वाढावा खाऊन वाट पाहतो. छोट्या शेतकऱ्यावर आता कोरड्या मातीत कुजणाऱ्या बियाण्याचे कर्ज आहे — व्याज त्याचा तोटा दुप्पट करते. मजूर पेरणीने झाले असते तेच काम गमावतो. एक दुष्काळ, तीन गणिते — म्हणूनच 'गावाला' एका पायरीवर बेतलेल्या एका धोरणाने कधीही मदत होत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "For seed money the small farmer goes to the village moneylender at heavy interest, though a bank's loan would cost half. What usually decides this against the bank?",
          hi: "बीज के पैसों को छोटा किसान भारी ब्याज पर गाँव के साहूकार के पास जाता है, जबकि बैंक का उधार आधा पड़ता। बैंक के विरुद्ध यह फ़ैसला अक्सर क्या तय करता है?",
          mr: "बियाण्याच्या पैशासाठी छोटा शेतकरी जबर व्याजाने गावच्या सावकाराकडे जातो, वास्तविक बँकेचे कर्ज निम्म्यात पडले असते. बँकेविरुद्ध हा निर्णय बहुधा काय ठरवते?",
        },
        choices: [
          {
            en: "Reach and speed — the lender is nearby, asks no papers or guarantees and pays today; the bank wants documents, security and time the sowing season will not wait for",
            hi: "पहुँच और रफ़्तार — साहूकार पास है, न काग़ज़ माँगता है न ज़मानत, और आज ही देता है; बैंक दस्तावेज़, गारंटी और वह समय माँगता है जिसकी बुआई का मौसम प्रतीक्षा नहीं करता",
            mr: "पोहोच आणि वेग — सावकार जवळ आहे, कागद वा हमी मागत नाही, आणि आजच देतो; बँक कागदपत्रे, तारण आणि पेरणीचा हंगाम थांबणार नाही तो वेळ मागते",
          },
          {
            en: "Farmers simply prefer paying more interest",
            hi: "किसानों को बस ज़्यादा ब्याज देना पसंद है",
            mr: "शेतकऱ्यांना नुसते जास्त व्याज द्यायला आवडते",
          },
          {
            en: "Banks refuse to lend for farming at all",
            hi: "बैंक खेती को उधार देते ही नहीं",
            mr: "बँका शेतीला कर्ज देतच नाहीत",
          },
          {
            en: "Moneylenders' loans are secretly cheaper",
            hi: "साहूकारों के उधार चुपके से सस्ते होते हैं",
            mr: "सावकारांची कर्जे गुपचूप स्वस्त असतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The sowing window is days, not months. The moneylender's counter is his verandah, his paperwork is memory, his collateral is knowing where you live — cash changes hands before dusk. The bank's cheaper loan hides costs the poor pay worst: bus fares, lost work-days, papers a labourer may not have. The heavy interest is the price of speed and reach — which is why making CHEAP credit also ARRIVE easily is one of rural India's oldest policy problems.",
          hi: "बुआई की खिड़की दिनों की है, महीनों की नहीं। साहूकार का काउंटर उसका बरामदा है, उसकी काग़ज़ी कार्रवाई याददाश्त, उसकी ज़मानत यह जानना कि आप कहाँ रहते हैं — नक़द शाम से पहले हाथ बदल लेता है। बैंक के सस्ते उधार में वे लागतें छिपी हैं जो ग़रीब सबसे महँगी चुकाता है: बस भाड़े, गँवाए काम-दिन, वे काग़ज़ जो मज़दूर के पास शायद न हों। भारी ब्याज रफ़्तार और पहुँच का दाम है — इसीलिए सस्ते उधार को आसानी से पहुँचाना भी ग्रामीण भारत की सबसे पुरानी नीति-समस्याओं में है।",
          mr: "पेरणीची खिडकी दिवसांची आहे, महिन्यांची नाही. सावकाराचा काउंटर त्याची ओसरी, त्याची कागदपत्रे म्हणजे स्मरण, त्याचे तारण म्हणजे तुम्ही कुठे राहता हे ठाऊक असणे — रोकड संध्याकाळआधी हात बदलते. बँकेच्या स्वस्त कर्जात गरीब सर्वांत महाग मोजतो त्या किमती लपल्या आहेत: बसभाडी, बुडालेले कामाचे दिवस, मजुराकडे नसतील असे कागद. जबर व्याज ही वेग आणि पोहोचीची किंमत — म्हणूनच स्वस्त कर्ज सहज पोहोचवणे हीही ग्रामीण भारताच्या सर्वांत जुन्या धोरण-समस्यांपैकी एक.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — Urban Livelihoods                                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-6-urban-livelihoods",
    subject: "CIVICS",
    classLevel: 6,
    chapter: {
      en: "Chapter 9 — Urban Livelihoods",
      hi: "अध्याय 9 — शहरी आजीविकाएँ",
      mr: "प्रकरण 9 — शहरी उपजीविका",
    },
    name: { en: "Urban Livelihoods", hi: "शहरी आजीविकाएँ", mr: "शहरी उपजीविका" },
    summary: {
      en: "The city's ladder of earnings — the vendor who can be moved off his corner, the labourer hired by the day, the factory hand kept temporary, and the salaried few whose pay comes with security.",
      hi: "शहर की कमाई की सीढ़ी — कोने से हटाया जा सकता फेरीवाला, दिन भर को रखा मज़दूर, अस्थायी रखा कारख़ाना-कामगार, और वेतन के साथ सुरक्षा पाते थोड़े-से लोग।",
      mr: "शहराच्या कमाईची शिडी — कोपऱ्यावरून हटवला जाऊ शकणारा फेरीवाला, दिवसापुरता ठेवलेला मजूर, तात्पुरता ठेवलेला कारखाना-कामगार, आणि पगारासोबत सुरक्षा मिळणारे थोडे जण.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "streetvendor",
        name: { en: "The street vendor", hi: "फेरीवाला", mr: "फेरीवाला" },
        kind: "worker",
        prompt: {
          en: "His shop is a barrow or a basket, his own boss with no licence to his corner — one municipal order can sweep his living off the pavement. Who is he?",
          hi: "उसकी दुकान ठेला या टोकरी है, अपना मालिक पर कोने का कोई परवाना नहीं — नगरपालिका का एक हुक्म उसकी रोज़ी फुटपाथ से बुहार सकता है। वह कौन है?",
          mr: "त्याचे दुकान म्हणजे हातगाडी वा टोपली, स्वतःचा मालक पण कोपऱ्याचा परवाना नाही — पालिकेचा एक हुकूम त्याची रोजी फुटपाथवरून झाडून टाकू शकतो. तो कोण?",
        },
        statement: {
          en: "The street vendor runs his own tiny business on wheels or cloth — no shop, no licence to his spot, earning daily and removable by one order.",
          hi: "फेरीवाला पहियों या कपड़े पर अपना नन्हा धंधा चलाता है — न दुकान, न जगह का परवाना, रोज़ कमाता और एक हुक्म से हटाया जा सकता।",
          mr: "फेरीवाला चाकांवर वा कापडावर आपला इवला धंदा चालवतो — दुकान नाही, जागेचा परवाना नाही, रोज कमावणारा आणि एका हुकुमाने हटवला जाणारा.",
        },
        detail: {
          en: "He is his own boss — but a boss with no address the law protects.",
          hi: "वह अपना मालिक है — पर ऐसा मालिक जिसके पते की क़ानून रक्षा नहीं करता।",
          mr: "तो स्वतःचा मालक — पण कायदा ज्याच्या पत्त्याचे रक्षण करत नाही असा मालक.",
        },
        extra: {
          en: "Vendors feed the city cheaply — the sweeper's lunch and the clerk's chai both come from a barrow.",
          hi: "फेरीवाले शहर को सस्ता खिलाते हैं — सफ़ाईकर्मी का खाना और बाबू की चाय दोनों ठेले से आते हैं।",
          mr: "फेरीवाले शहराला स्वस्त जेवू घालतात — सफाई कामगाराचे जेवण आणि कारकुनाचा चहा दोन्ही हातगाडीवरून येतात.",
        },
        pair: {
          left: { en: "The street vendor", hi: "फेरीवाला", mr: "फेरीवाला" },
          right: {
            en: "his own boss, no address",
            hi: "अपना मालिक, बिना पते का",
            mr: "स्वतःचा मालक, पत्त्याविना",
          },
        },
      },
      {
        id: "casuallabourer",
        name: { en: "The casual labourer", hi: "दिहाड़ी मज़दूर", mr: "नैमित्तिक मजूर" },
        kind: "worker",
        prompt: {
          en: "He waits at the labour chowk each dawn with his tools; a contractor picks some men, the rest walk home unpaid. Whose day is this?",
          hi: "वह हर भोर औज़ार लिए लेबर चौक पर खड़ा रहता है; ठेकेदार कुछ आदमी चुनता है, बाक़ी बिना कमाए घर लौटते हैं। यह किसका दिन है?",
          mr: "तो रोज पहाटे हत्यारे घेऊन लेबर चौकात उभा राहतो; ठेकेदार काही माणसे निवडतो, बाकी न कमावता घरी परततात. हा कोणाचा दिवस?",
        },
        statement: {
          en: "The casual labourer is hired by the day at the labour chowk — chosen, he earns; passed over, the day earns nothing, and no work means no pay ever.",
          hi: "दिहाड़ी मज़दूर लेबर चौक पर दिन भर को रखा जाता है — चुना गया तो कमाया; छूट गया तो दिन ख़ाली, और काम नहीं तो पगार कभी नहीं।",
          mr: "नैमित्तिक मजूर लेबर चौकात दिवसापुरता ठेवला जातो — निवडला तर कमावले; वगळला तर दिवस रिकामा, आणि काम नाही तर पगार कधीच नाही.",
        },
        pair: {
          left: { en: "The casual labourer", hi: "दिहाड़ी मज़दूर", mr: "नैमित्तिक मजूर" },
          right: {
            en: "hired fresh each dawn",
            hi: "हर भोर नए सिरे से रखा",
            mr: "रोज पहाटे नव्याने ठेवलेला",
          },
        },
      },
      {
        id: "garmentworker",
        name: {
          en: "The garment factory worker",
          hi: "कपड़ा-कारख़ाने की कामगार",
          mr: "कपडे-कारखान्याची कामगार",
        },
        kind: "worker",
        prompt: {
          en: "She has a workplace and a wage — but the contract is temporary, the hours stretch in season, and when orders stop the job can too. Whose position is this?",
          hi: "उसके पास काम की जगह और मज़दूरी है — पर अनुबंध अस्थायी, मौसम में घंटे खिंचते हैं, और ऑर्डर थमें तो नौकरी भी थम सकती है। यह किसकी स्थिति है?",
          mr: "तिच्याकडे कामाची जागा आणि मजुरी आहे — पण करार तात्पुरता, हंगामात तास ताणले जातात, आणि ऑर्डरी थांबल्या तर नोकरीही थांबू शकते. ही कोणाची स्थिती?",
        },
        statement: {
          en: "The garment worker is employed but kept temporary — long hours in season, laid off out of it, employed without the shelter of permanence.",
          hi: "कपड़ा-कामगार नौकरी में है पर अस्थायी रखी गई है — मौसम में लंबे घंटे, उसके बाहर छुट्टी, स्थायित्व की ओट के बिना रोज़गार।",
          mr: "कपडे-कामगार नोकरीत आहे पण तात्पुरती ठेवलेली — हंगामात लांब तास, हंगामाबाहेर कमी, कायमपणाच्या आडोशाविना रोजगार.",
        },
        pair: {
          left: { en: "The garment worker", hi: "कपड़ा-कामगार", mr: "कपडे-कामगार" },
          right: {
            en: "employed, yet kept temporary",
            hi: "नौकरी में, फिर भी अस्थायी",
            mr: "नोकरीत, तरी तात्पुरती",
          },
        },
      },
      {
        id: "salariedworker",
        name: {
          en: "The regular salaried worker",
          hi: "नियमित वेतनभोगी",
          mr: "नियमित पगारदार",
        },
        kind: "worker",
        prompt: {
          en: "Fixed pay on a fixed date, paid leave when ill, provident fund for old age, and a job that continues next month — which kind of worker holds all this?",
          hi: "तय तारीख़ को तय वेतन, बीमारी में सवेतन छुट्टी, बुढ़ापे को भविष्य-निधि, और अगले महीने भी चलती नौकरी — यह सब किस क़िस्म के कामगार के पास है?",
          mr: "ठरल्या तारखेला ठरलेला पगार, आजारपणात पगारी रजा, म्हातारपणासाठी भविष्य-निर्वाह निधी, आणि पुढच्या महिन्यातही चालणारी नोकरी — हे सारे कोणत्या प्रकारच्या कामगाराकडे?",
        },
        statement: {
          en: "The regular salaried worker earns security with the pay — fixed salary, paid leave, provident fund and a job that outlasts the month.",
          hi: "नियमित वेतनभोगी वेतन के साथ सुरक्षा कमाता है — तय वेतन, सवेतन छुट्टी, भविष्य-निधि और महीने से आगे चलती नौकरी।",
          mr: "नियमित पगारदार पगारासोबत सुरक्षा कमावतो — ठरलेला पगार, पगारी रजा, भविष्य-निर्वाह निधी आणि महिन्यापलीकडे चालणारी नोकरी.",
        },
        detail: {
          en: "In Indian cities such workers are the minority — most urban work carries no such shelter.",
          hi: "भारतीय शहरों में ऐसे कामगार अल्पसंख्यक हैं — ज़्यादातर शहरी काम ऐसी ओट नहीं रखता।",
          mr: "भारतीय शहरांत असे कामगार अल्पसंख्य आहेत — बहुतेक शहरी कामाला असा आडोसा नसतो.",
        },
        extra: {
          en: "The difference shows most on a bad day — illness with paid leave is rest; without it, lost bread.",
          hi: "फ़र्क़ बुरे दिन सबसे ज़्यादा दिखता है — सवेतन छुट्टी वाली बीमारी आराम है; बिना उसके, गई रोटी।",
          mr: "फरक वाईट दिवशी सर्वांत जास्त दिसतो — पगारी रजेतले आजारपण म्हणजे विश्रांती; तिच्याविना, गेलेली भाकरी.",
        },
        pair: {
          left: { en: "The salaried worker", hi: "वेतनभोगी", mr: "पगारदार" },
          right: {
            en: "pay that comes with shelter",
            hi: "ओट के साथ आता वेतन",
            mr: "आडोशासह येणारा पगार",
          },
        },
      },
      {
        id: "marketshop",
        name: {
          en: "The market shopkeeper",
          hi: "बाज़ार का दुकानदार",
          mr: "बाजारातला दुकानदार",
        },
        kind: "worker",
        prompt: {
          en: "A fixed shop with a licence, a signboard and a shutter to lock at night — which trader's standing is this, a rung above the barrow?",
          hi: "परवाने वाली पक्की दुकान, नामपट्ट और रात में उतरता शटर — यह किस व्यापारी की हैसियत है, ठेले से एक पैड़ी ऊपर?",
          mr: "परवान्याची पक्की जागा, पाटी आणि रात्री लावायचे शटर — ही कोणत्या व्यापाऱ्याची स्थिती, हातगाडीहून एक पायरी वर?",
        },
        statement: {
          en: "The market shopkeeper trades from a fixed, licensed shop — his spot is his by right, lockable at night and defensible in law.",
          hi: "बाज़ार का दुकानदार पक्की, परवाने वाली दुकान से व्यापार करता है — जगह हक़ से उसकी, रात में बंद होती और क़ानून में बचाव योग्य।",
          mr: "बाजारातला दुकानदार पक्क्या, परवान्याच्या दुकानातून व्यापार करतो — जागा हक्काने त्याची, रात्री बंद होणारी आणि कायद्यात बचाव करता येणारी.",
        },
      },
      {
        id: "cityweb",
        name: {
          en: "The city's web of work",
          hi: "शहर के कामों का जाल",
          mr: "शहराच्या कामांचे जाळे",
        },
        kind: "idea",
        prompt: {
          en: "The vendor feeds the labourer who builds the showroom where the salesgirl sells to the clerk — what does this endless chain show about a city?",
          hi: "फेरीवाला उस मज़दूर को खिलाता है जो वह शोरूम बनाता है जहाँ सेल्सगर्ल बाबू को बेचती है — यह अंतहीन कड़ी शहर के बारे में क्या दिखाती है?",
          mr: "फेरीवाला त्या मजुराला जेवू घालतो जो ते शोरूम बांधतो जिथे सेल्सगर्ल कारकुनाला विकते — ही अखंड साखळी शहराबद्दल काय दाखवते?",
        },
        statement: {
          en: "The city's livelihoods interlock — each worker is another's customer, and no trade, grand or small, stands without the rest.",
          hi: "शहर की आजीविकाएँ एक-दूसरे में गुँथी हैं — हर कामगार किसी और का ग्राहक है, और कोई धंधा, बड़ा या छोटा, बाक़ियों के बिना नहीं खड़ा।",
          mr: "शहराच्या उपजीविका एकमेकांत गुंफल्या आहेत — प्रत्येक कामगार दुसऱ्याचा ग्राहक आहे, आणि कोणताही धंदा, मोठा वा छोटा, इतरांविना उभा नाही.",
        },
        pair: {
          left: { en: "The city's web", hi: "शहर का जाल", mr: "शहराचे जाळे" },
          right: {
            en: "each worker, another's customer",
            hi: "हर कामगार, किसी का ग्राहक",
            mr: "प्रत्येक कामगार, कोणाचा ग्राहक",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Rank these three by SECURITY of earning, least to most: the casual labourer at the chowk, the garment factory worker, the regular salaried worker. Which order is right?",
          hi: "इन तीनों को कमाई की सुरक्षा से, सबसे कम से सबसे ज़्यादा, क्रम दीजिए: चौक का दिहाड़ी मज़दूर, कपड़ा-कारख़ाने की कामगार, नियमित वेतनभोगी। कौन-सा क्रम सही है?",
          mr: "या तिघांना कमाईच्या सुरक्षेने, सर्वांत कमीपासून सर्वांत जास्त, क्रम द्या: चौकातला नैमित्तिक मजूर, कपडे-कारखान्याची कामगार, नियमित पगारदार. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "casual labourer → garment worker → salaried worker",
            hi: "दिहाड़ी मज़दूर → कपड़ा-कामगार → वेतनभोगी",
            mr: "नैमित्तिक मजूर → कपडे-कामगार → पगारदार",
          },
          {
            en: "salaried worker → garment worker → casual labourer",
            hi: "वेतनभोगी → कपड़ा-कामगार → दिहाड़ी मज़दूर",
            mr: "पगारदार → कपडे-कामगार → नैमित्तिक मजूर",
          },
          {
            en: "garment worker → casual labourer → salaried worker",
            hi: "कपड़ा-कामगार → दिहाड़ी मज़दूर → वेतनभोगी",
            mr: "कपडे-कामगार → नैमित्तिक मजूर → पगारदार",
          },
          {
            en: "casual labourer → salaried worker → garment worker",
            hi: "दिहाड़ी मज़दूर → वेतनभोगी → कपड़ा-कामगार",
            mr: "नैमित्तिक मजूर → पगारदार → कपडे-कामगार",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Security climbs with the length of the promise: the chowk promises one day at most, the factory a season, the salaried post next month and beyond with leave and fund besides. The city's real ladder is not of wages but of how far ahead a family can plan.",
          hi: "सुरक्षा वादे की लंबाई से चढ़ती है: चौक बमुश्किल एक दिन का वादा करता है, कारख़ाना एक मौसम का, वेतन-पद अगले महीने और आगे का — छुट्टी और निधि समेत। शहर की असली सीढ़ी मज़दूरी की नहीं, इस बात की है कि परिवार कितनी दूर तक की योजना बना सकता है।",
          mr: "सुरक्षा वचनाच्या लांबीने चढते: चौक जेमतेम एका दिवसाचे वचन देतो, कारखाना एका हंगामाचे, पगारी पद पुढच्या महिन्याचे आणि पुढचे — रजा आणि निधीसह. शहराची खरी शिडी मजुरीची नव्हे, कुटुंब किती पुढचे नियोजन करू शकते याची आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The vendor works dawn to dusk; the salaried clerk may work fewer hours for steadier pay. If effort does not explain the difference, what does?",
          hi: "फेरीवाला भोर से साँझ खटता है; वेतनभोगी बाबू कम घंटे काम करके ज़्यादा स्थिर वेतन पा सकता है। अगर मेहनत यह फ़र्क़ नहीं समझाती, तो क्या समझाता है?",
          mr: "फेरीवाला पहाटेपासून सांजेपर्यंत राबतो; पगारदार कारकून कमी तास काम करून अधिक स्थिर पगार मिळवू शकतो. मेहनत हा फरक समजावत नसेल, तर काय समजावते?",
        },
        choices: [
          {
            en: "The kind of position, not the effort in it — security attaches to protected jobs and owned places, and most city work offers neither, however hard it is done",
            hi: "पद की क़िस्म, उसमें लगी मेहनत नहीं — सुरक्षा संरक्षित नौकरियों और अपनी जगहों से जुड़ी है, और ज़्यादातर शहरी काम दोनों नहीं देता, चाहे कितना भी कठिन किया जाए",
            mr: "पदाचा प्रकार, त्यातली मेहनत नव्हे — सुरक्षा संरक्षित नोकऱ्या आणि मालकीच्या जागांना चिकटलेली आहे, आणि बहुतेक शहरी काम दोन्ही देत नाही, कितीही कष्टाने केले तरी",
          },
          {
            en: "The vendor must simply be working wrongly",
            hi: "फेरीवाला ज़रूर ग़लत ढंग से काम कर रहा होगा",
            mr: "फेरीवाला नक्कीच चुकीच्या पद्धतीने काम करत असणार",
          },
          {
            en: "Salaried workers always work far harder",
            hi: "वेतनभोगी हमेशा कहीं ज़्यादा मेहनत करते हैं",
            mr: "पगारदार नेहमी कितीतरी जास्त कष्ट करतात",
          },
          {
            en: "Luck alone separates the two",
            hi: "दोनों को केवल क़िस्मत अलग करती है",
            mr: "दोघांना फक्त नशीब वेगळे करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The chapter's uncomfortable lesson: in the city, reward tracks the SLOT more than the sweat. The clerk's security was built into his post by law and contract before he arrived; the vendor's corner has no such armour, so equal or greater effort buys less certainty. Seeing this clearly is the point — it turns 'the poor should work harder' into the truer question, 'why does so much hard work come with so little shelter?'",
          hi: "अध्याय का असुविधाजनक सबक़: शहर में इनाम पसीने से ज़्यादा पद के ख़ाने का पीछा करता है। बाबू की सुरक्षा उसके आने से पहले क़ानून और अनुबंध ने पद में जड़ दी थी; फेरीवाले के कोने के पास ऐसा कवच नहीं, तो बराबर या ज़्यादा मेहनत कम निश्चितता ख़रीदती है। इसे साफ़ देखना ही मक़सद है — यह 'ग़रीब ज़्यादा मेहनत करें' को सच्चे सवाल में बदल देता है: 'इतनी मेहनत के साथ इतनी कम ओट क्यों?'",
          mr: "प्रकरणाचा अस्वस्थ करणारा धडा: शहरात बक्षीस घामाहून जागेच्या खणाचा माग काढते. कारकुनाची सुरक्षा तो येण्याआधीच कायद्याने आणि कराराने पदात बसवली होती; फेरीवाल्याच्या कोपऱ्याला असे चिलखत नाही, म्हणून सारखी वा जास्त मेहनत कमी खात्री विकत घेते. हे स्पष्ट पाहणे हाच हेतू — ते 'गरिबांनी जास्त कष्ट करावेत'ला खऱ्या प्रश्नात बदलते: 'इतक्या कष्टांसोबत इतका कमी आडोसा का?'",
        },
      },
      {
        level: 6,
        stem: {
          en: "Remove the street vendors from a city for one week. Who feels it, and what does the answer prove?",
          hi: "एक हफ़्ते के लिए शहर से फेरीवाले हटा दीजिए। किसे महसूस होता है, और उत्तर क्या साबित करता है?",
          mr: "आठवडाभर शहरातून फेरीवाले काढून टाका. कोणाला जाणवते, आणि उत्तर काय सिद्ध करते?",
        },
        choices: [
          {
            en: "Half the city — cheap lunches, chai, vegetables and repairs vanish for labourers and clerks alike, proving the 'informal' trades are load-bearing walls, not clutter",
            hi: "आधा शहर — मज़दूरों और बाबुओं दोनों के सस्ते खाने, चाय, सब्ज़ियाँ और मरम्मतें ग़ायब — साबित करते हुए कि 'अनौपचारिक' धंधे भार उठाती दीवारें हैं, कबाड़ नहीं",
            mr: "अर्धे शहर — मजूर आणि कारकून दोघांचे स्वस्त जेवण, चहा, भाज्या आणि दुरुस्त्या नाहीशा — सिद्ध करत की 'अनौपचारिक' धंदे भार पेलणाऱ्या भिंती आहेत, अडगळ नव्हे",
          },
          {
            en: "No one — vendors serve only each other",
            hi: "किसी को नहीं — फेरीवाले बस एक-दूसरे के काम आते हैं",
            mr: "कोणालाच नाही — फेरीवाले फक्त एकमेकांच्या कामी येतात",
          },
          {
            en: "Only the vendors themselves",
            hi: "केवल फेरीवाले स्वयं",
            mr: "फक्त फेरीवाले स्वतः",
          },
          {
            en: "The city improves, having lost its clutter",
            hi: "कबाड़ हटने से शहर सुधर जाता है",
            mr: "अडगळ गेल्याने शहर सुधारते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Run the week: the construction worker's five-rupee lunch is gone, so his wage buys less; the office-goer's chai and quick chappal-repair vanish; vegetable prices jump because the barrows undercut the shops. The pavement trade the city calls an obstruction turns out to be part of its plumbing. That is why the vendor question is a policy question — cities must find them a lawful place, not merely a clearance drive.",
          hi: "हफ़्ता चलाकर देखिए: निर्माण-मज़दूर का पाँच रुपये का खाना गया, तो उसकी दिहाड़ी कम पड़ने लगी; दफ़्तर वाले की चाय और झटपट चप्पल-मरम्मत ग़ायब; सब्ज़ी के दाम उछले क्योंकि ठेले दुकानों से सस्ते बेचते थे। जिस फुटपाथी धंधे को शहर रुकावट कहता है, वह उसकी नलसाज़ी का हिस्सा निकलता है। इसीलिए फेरीवाले का सवाल नीति का सवाल है — शहरों को उनके लिए क़ानूनी जगह खोजनी होगी, सिर्फ़ हटाओ-मुहिम नहीं।",
          mr: "आठवडा चालवून पाहा: बांधकाम-मजुराचे पाच रुपयांचे जेवण गेले, म्हणून त्याची मजुरी कमी पडू लागली; कचेरीवाल्याचा चहा आणि झटपट चप्पल-दुरुस्ती नाहीशी; भाज्यांचे भाव उसळले कारण हातगाड्या दुकानांहून स्वस्त विकत. शहर ज्या फुटपाथी धंद्याला अडथळा म्हणते, तो त्याच्या नळकामाचा भाग निघतो. म्हणूनच फेरीवाल्याचा प्रश्न धोरणाचा प्रश्न — शहरांनी त्यांना कायदेशीर जागा शोधली पाहिजे, नुसती हटाव-मोहीम नव्हे.",
        },
      },
    ],
  },
];
