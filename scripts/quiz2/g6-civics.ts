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
];
