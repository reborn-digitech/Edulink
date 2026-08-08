/**
 * Class 6 History — NCERT "Our Pasts – I", chapter by chapter.
 *
 * Fact tables feeding scripts/quiz2/engine.ts. Authoring rules that matter:
 * every statement/detail/extra must be specific enough to be FALSE of every
 * other entity in its chapter (they become each other's distractors), pair
 * right-hand sides must be distinct within a chapter, and `seq` orders only
 * what the chapter itself orders.
 *
 * ⚠ CONTENT STATUS: written from NCERT Our Pasts – I; unreviewed by an
 * educator (reviewedAt stays null and the verifier counts these as unproven).
 * The hi/mr text is the author's own, like every translated string in this
 * repository.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Our Pasts – I (Class 6)";
const LICENCE = "CC-BY-SA-4.0";

export const G6_HISTORY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — What, Where, How and When?                                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-6-what-where-how-and-when",
    subject: "HISTORY",
    classLevel: 6,
    chapter: {
      en: "Chapter 1 — What, Where, How and When?",
      hi: "अध्याय 1 — क्या, कहाँ, कैसे और कब?",
      mr: "प्रकरण 1 — काय, कुठे, कसे आणि केव्हा?",
    },
    name: {
      en: "What, Where, How and When?",
      hi: "क्या, कहाँ, कैसे और कब?",
      mr: "काय, कुठे, कसे आणि केव्हा?",
    },
    summary: {
      en: "How we know about the past at all — manuscripts, inscriptions, and the spades of archaeologists.",
      hi: "हम अतीत के बारे में जानते ही कैसे हैं — पांडुलिपियाँ, अभिलेख और पुरातत्वविदों की खुदाई।",
      mr: "आपल्याला भूतकाळ कळतो तरी कसा — हस्तलिखिते, कोरीव लेख आणि पुरातत्त्वज्ञांची उत्खनने.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "manuscripts",
        name: { en: "Manuscripts", hi: "पांडुलिपियाँ", mr: "हस्तलिखिते" },
        kind: "source",
        prompt: {
          en: "What do we call old books written by hand, usually on palm leaf or birch bark?",
          hi: "हाथ से लिखी पुरानी पुस्तकों को, जो प्रायः ताड़पत्र या भोजपत्र पर होती थीं, क्या कहते हैं?",
          mr: "हाताने लिहिलेल्या जुन्या पुस्तकांना, जी बहुधा ताडपत्रावर किंवा भूर्जपत्रावर असत, काय म्हणतात?",
        },
        statement: {
          en: "Manuscripts were written by hand, usually on palm leaf or on the specially prepared bark of the birch tree.",
          hi: "पांडुलिपियाँ हाथ से लिखी जाती थीं, प्रायः ताड़पत्र पर या भोजवृक्ष की विशेष रूप से तैयार छाल पर।",
          mr: "हस्तलिखिते हाताने लिहिली जात, बहुधा ताडपत्रावर किंवा भूर्ज वृक्षाच्या खास तयार केलेल्या सालीवर.",
        },
        detail: {
          en: "Many old handwritten books were preserved in temples and monasteries.",
          hi: "अनेक पुरानी हस्तलिखित पुस्तकें मंदिरों और विहारों में सुरक्षित रखी गईं।",
          mr: "अनेक जुनी हस्तलिखित पुस्तके मंदिरांत आणि विहारांत जपून ठेवली गेली.",
        },
        extra: {
          en: "These handwritten books dealt with religious beliefs, medicine, science, epics and poetry.",
          hi: "इन हस्तलिखित पुस्तकों में धार्मिक मान्यताएँ, चिकित्सा, विज्ञान, महाकाव्य और कविताएँ थीं।",
          mr: "या हस्तलिखित पुस्तकांत धार्मिक श्रद्धा, वैद्यक, विज्ञान, महाकाव्ये आणि काव्य होते.",
        },
        pair: {
          left: { en: "Manuscripts", hi: "पांडुलिपियाँ", mr: "हस्तलिखिते" },
          right: { en: "palm leaf and birch bark", hi: "ताड़पत्र और भोजपत्र", mr: "ताडपत्र आणि भूर्जपत्र" },
        },
      },
      {
        id: "inscriptions",
        name: { en: "Inscriptions", hi: "अभिलेख", mr: "कोरीव लेख" },
        kind: "source",
        prompt: {
          en: "What do we call writings engraved on hard surfaces such as stone or metal?",
          hi: "पत्थर या धातु जैसी कठोर सतहों पर खुदे लेखन को क्या कहते हैं?",
          mr: "दगड किंवा धातूसारख्या कठीण पृष्ठभागावर कोरलेल्या लेखनाला काय म्हणतात?",
        },
        statement: {
          en: "Inscriptions are writings engraved on hard surfaces such as stone or metal, so they survive for centuries.",
          hi: "अभिलेख पत्थर या धातु जैसी कठोर सतहों पर खुदे लेख हैं, इसलिए वे सदियों तक बचे रहते हैं।",
          mr: "कोरीव लेख म्हणजे दगड वा धातूसारख्या कठीण पृष्ठभागावर कोरलेले लेख — म्हणून ते शतकानुशतके टिकतात.",
        },
        detail: {
          en: "Kings often had their orders and records of victories engraved so that people could see them.",
          hi: "राजा प्रायः अपने आदेश और विजयों के वृत्तांत खुदवाते थे ताकि लोग उन्हें देख सकें।",
          mr: "राजे बहुधा आपले आदेश आणि विजयांच्या नोंदी कोरून घेत, म्हणजे लोकांना त्या दिसाव्यात.",
        },
        pair: {
          left: { en: "Inscriptions", hi: "अभिलेख", mr: "कोरीव लेख" },
          right: { en: "stone and metal", hi: "पत्थर और धातु", mr: "दगड आणि धातू" },
        },
      },
      {
        id: "archaeologists",
        name: { en: "Archaeologists", hi: "पुरातत्वविद", mr: "पुरातत्त्वज्ञ" },
        kind: "people-who-study",
        prompt: {
          en: "Who studies the remains of buildings, tools, weapons, pots and bones to learn about the past?",
          hi: "इमारतों, औज़ारों, हथियारों, बर्तनों और हड्डियों के अवशेषों का अध्ययन कर अतीत को कौन जानता है?",
          mr: "इमारती, हत्यारे, अवजारे, भांडी आणि हाडांच्या अवशेषांचा अभ्यास करून भूतकाळ कोण जाणून घेतो?",
        },
        statement: {
          en: "Archaeologists explore and excavate to find tools, weapons, pots, pans and even the bones of animals and birds.",
          hi: "पुरातत्वविद खोज और खुदाई करके औज़ार, हथियार, बर्तन-भांडे और यहाँ तक कि पशु-पक्षियों की हड्डियाँ भी ढूँढ़ते हैं।",
          mr: "पुरातत्त्वज्ञ शोध आणि उत्खनन करून हत्यारे, अवजारे, भांडीकुंडी आणि पशुपक्ष्यांची हाडेसुद्धा शोधतात.",
        },
        detail: {
          en: "People who dig up and study objects buried in the earth work from things, not from books.",
          hi: "ज़मीन में दबी वस्तुओं की खुदाई और अध्ययन करने वाले लोग पुस्तकों से नहीं, वस्तुओं से काम करते हैं।",
          mr: "जमिनीत गाडलेल्या वस्तूंचे उत्खनन आणि अभ्यास करणारे लोक पुस्तकांवरून नव्हे, वस्तूंवरून काम करतात.",
        },
        pair: {
          left: { en: "Archaeologists", hi: "पुरातत्वविद", mr: "पुरातत्त्वज्ञ" },
          right: { en: "excavation", hi: "खुदाई", mr: "उत्खनन" },
        },
      },
      {
        id: "historians",
        name: { en: "Historians", hi: "इतिहासकार", mr: "इतिहासकार" },
        kind: "people-who-study",
        prompt: {
          en: "What do we call scholars who study the past using sources like manuscripts and inscriptions?",
          hi: "पांडुलिपियों और अभिलेखों जैसे स्रोतों से अतीत का अध्ययन करने वाले विद्वानों को क्या कहते हैं?",
          mr: "हस्तलिखिते व कोरीव लेखांसारख्या साधनांतून भूतकाळाचा अभ्यास करणाऱ्या अभ्यासकांना काय म्हणतात?",
        },
        statement: {
          en: "Historians are scholars of the past who piece together its story from written sources and other evidence.",
          hi: "इतिहासकार अतीत के विद्वान हैं, जो लिखित स्रोतों और अन्य प्रमाणों से उसकी कहानी जोड़ते हैं।",
          mr: "इतिहासकार हे भूतकाळाचे अभ्यासक असतात; लिखित साधने आणि इतर पुराव्यांतून ते त्याची कहाणी जुळवतात.",
        },
      },
      {
        id: "sources",
        name: { en: "Sources", hi: "स्रोत", mr: "साधने" },
        kind: "term",
        prompt: {
          en: "Manuscripts, inscriptions and archaeological finds — what is the single word for the materials from which we learn history?",
          hi: "पांडुलिपियाँ, अभिलेख और पुरातात्विक खोजें — जिन सामग्रियों से हम इतिहास जानते हैं, उनके लिए एक शब्द क्या है?",
          mr: "हस्तलिखिते, कोरीव लेख आणि पुरातत्त्वीय शोध — ज्या सामग्रीतून आपण इतिहास शिकतो तिच्यासाठी एक शब्द कोणता?",
        },
        statement: {
          en: "The word 'sources' names everything historians and archaeologists use to reconstruct the past.",
          hi: "'स्रोत' शब्द उन सभी चीज़ों का नाम है जिनसे इतिहासकार और पुरातत्वविद अतीत को फिर से रचते हैं।",
          mr: "'साधने' हा शब्द म्हणजे इतिहासकार आणि पुरातत्त्वज्ञ भूतकाळ उभा करण्यासाठी वापरतात त्या साऱ्या गोष्टी.",
        },
      },
      {
        id: "narmada",
        name: { en: "The Narmada valley", hi: "नर्मदा घाटी", mr: "नर्मदेचे खोरे" },
        kind: "place",
        seq: 1,
        prompt: {
          en: "On the banks of which river did skilled hunter-gatherers live for several hundred thousand years?",
          hi: "किस नदी के किनारे कुशल आखेटक-संग्राहक कई लाख वर्षों तक रहे?",
          mr: "कोणत्या नदीच्या काठी कुशल शिकारी-संग्राहक कित्येक लाख वर्षे राहत होते?",
        },
        statement: {
          en: "People have lived along the Narmada for several hundred thousand years, gathering food and hunting.",
          hi: "नर्मदा के किनारे लोग कई लाख वर्षों से रहते आए हैं — भोजन बटोरते और शिकार करते।",
          mr: "नर्मदेच्या काठी लोक कित्येक लाख वर्षांपासून राहत आले — अन्न गोळा करत आणि शिकार करत.",
        },
        detail: {
          en: "The earliest people of this river valley were skilled gatherers who knew the forest's wealth of roots and fruits.",
          hi: "इस नदी घाटी के सबसे पुराने लोग कुशल संग्राहक थे, जो जंगल की जड़ों-फलों की संपदा को जानते थे।",
          mr: "या नदीखोऱ्यातील सर्वांत जुने लोक कुशल संग्राहक होते; रानातील कंदमुळे-फळांची संपत्ती त्यांना ठाऊक होती.",
        },
        pair: {
          left: { en: "The Narmada valley", hi: "नर्मदा घाटी", mr: "नर्मदेचे खोरे" },
          right: { en: "hunter-gatherers", hi: "आखेटक-संग्राहक", mr: "शिकारी-संग्राहक" },
        },
      },
      {
        id: "sulaiman-kirthar",
        name: {
          en: "The Sulaiman and Kirthar hills",
          hi: "सुलेमान और किरथर पहाड़ियाँ",
          mr: "सुलेमान आणि किरथर टेकड्या",
        },
        kind: "place",
        seq: 2,
        prompt: {
          en: "Near which hills in the north-west did people first grow wheat and barley, about 8,000 years ago?",
          hi: "उत्तर-पश्चिम की किन पहाड़ियों के पास लोगों ने लगभग 8,000 वर्ष पहले सबसे पहले गेहूँ और जौ उगाए?",
          mr: "वायव्येकडील कोणत्या टेकड्यांजवळ लोकांनी सुमारे ८,००० वर्षांपूर्वी प्रथम गहू आणि सातू पिकवले?",
        },
        statement: {
          en: "Women and men first grew wheat and barley about 8,000 years ago, near the Sulaiman and Kirthar hills.",
          hi: "लगभग 8,000 वर्ष पहले सुलेमान और किरथर पहाड़ियों के पास लोगों ने सबसे पहले गेहूँ और जौ उगाए।",
          mr: "सुमारे ८,००० वर्षांपूर्वी सुलेमान आणि किरथर टेकड्यांजवळ लोकांनी प्रथम गहू आणि सातू पिकवले.",
        },
        detail: {
          en: "The first farmers and herders of the subcontinent lived in this north-western hill region, keeping sheep and goats.",
          hi: "उपमहाद्वीप के पहले किसान और पशुपालक इसी उत्तर-पश्चिमी पहाड़ी क्षेत्र में रहते थे, भेड़-बकरियाँ पालते हुए।",
          mr: "उपखंडातील पहिले शेतकरी आणि पशुपालक याच वायव्य डोंगराळ भागात राहत; मेंढ्या-शेळ्या पाळत.",
        },
        pair: {
          left: {
            en: "The Sulaiman and Kirthar hills",
            hi: "सुलेमान और किरथर पहाड़ियाँ",
            mr: "सुलेमान आणि किरथर टेकड्या",
          },
          right: { en: "first wheat and barley", hi: "पहले गेहूँ और जौ", mr: "पहिले गहू आणि सातू" },
        },
      },
      {
        id: "garo-vindhya",
        name: {
          en: "The Garo hills and the Vindhyas",
          hi: "गारो पहाड़ियाँ और विंध्य",
          mr: "गारो टेकड्या आणि विंध्य",
        },
        kind: "place",
        seq: 3,
        prompt: {
          en: "Which two upland regions saw some of the earliest cultivation of rice?",
          hi: "किन दो पहाड़ी क्षेत्रों में धान की सबसे शुरुआती खेती हुई?",
          mr: "कोणत्या दोन डोंगराळ प्रदेशांत भाताची सर्वांत जुनी लागवड झाली?",
        },
        statement: {
          en: "Rice was first grown in regions such as the Garo hills in the north-east and the Vindhyas in central India.",
          hi: "धान सबसे पहले उत्तर-पूर्व की गारो पहाड़ियों और मध्य भारत के विंध्य जैसे क्षेत्रों में उगाया गया।",
          mr: "भात प्रथम ईशान्येकडील गारो टेकड्या आणि मध्य भारतातील विंध्य अशा प्रदेशांत पिकवला गेला.",
        },
        pair: {
          left: {
            en: "The Garo hills and the Vindhyas",
            hi: "गारो पहाड़ियाँ और विंध्य",
            mr: "गारो टेकड्या आणि विंध्य",
          },
          right: { en: "early rice growing", hi: "धान की शुरुआती खेती", mr: "भाताची जुनी लागवड" },
        },
      },
      {
        id: "indus",
        name: {
          en: "The Indus and its tributaries",
          hi: "सिंधु और उसकी सहायक नदियाँ",
          mr: "सिंधू आणि तिच्या उपनद्या",
        },
        kind: "place",
        seq: 4,
        prompt: {
          en: "Along which river and its tributaries did the subcontinent's first cities flourish, about 4,700 years ago?",
          hi: "किस नदी और उसकी सहायक नदियों के किनारे उपमहाद्वीप के पहले नगर लगभग 4,700 वर्ष पहले फले-फूले?",
          mr: "कोणत्या नदीच्या व तिच्या उपनद्यांच्या काठी उपखंडातील पहिली नगरे सुमारे ४,७०० वर्षांपूर्वी भरभराटीला आली?",
        },
        statement: {
          en: "The first cities of the subcontinent flourished on the banks of the Indus and its tributaries about 4,700 years ago.",
          hi: "उपमहाद्वीप के पहले नगर लगभग 4,700 वर्ष पहले सिंधु और उसकी सहायक नदियों के किनारे फले-फूले।",
          mr: "उपखंडातील पहिली नगरे सुमारे ४,७०० वर्षांपूर्वी सिंधू व तिच्या उपनद्यांच्या काठी भरभराटीला आली.",
        },
        detail: {
          en: "The Sanskrit name of this river, Sindhu, gave both 'India' and 'Hindustan' their start.",
          hi: "इस नदी के संस्कृत नाम 'सिंधु' से ही 'इंडिया' और 'हिंदुस्तान' दोनों नाम निकले।",
          mr: "या नदीच्या 'सिंधू' या संस्कृत नावातूनच 'इंडिया' आणि 'हिंदुस्थान' ही दोन्ही नावे आली.",
        },
        extra: {
          en: "The Iranians and the Greeks who came through the north-west called this river the Hindos or the Indos.",
          hi: "उत्तर-पश्चिम से आए ईरानी और यूनानी इस नदी को हिंदोस या इंदोस कहते थे।",
          mr: "वायव्येकडून आलेले इराणी आणि ग्रीक या नदीला हिंदोस किंवा इंदोस म्हणत.",
        },
        pair: {
          left: {
            en: "The Indus and its tributaries",
            hi: "सिंधु और उसकी सहायक नदियाँ",
            mr: "सिंधू आणि तिच्या उपनद्या",
          },
          right: { en: "the first cities", hi: "पहले नगर", mr: "पहिली नगरे" },
        },
      },
      {
        id: "ganga-magadha",
        name: {
          en: "The Ganga valley and Magadha",
          hi: "गंगा घाटी और मगध",
          mr: "गंगेचे खोरे आणि मगध",
        },
        kind: "place",
        seq: 5,
        prompt: {
          en: "About 2,500 years ago, cities grew along which river, where the kingdom of Magadha rose to power?",
          hi: "लगभग 2,500 वर्ष पहले किस नदी के किनारे नगर विकसित हुए, जहाँ मगध राज्य शक्तिशाली बना?",
          mr: "सुमारे २,५०० वर्षांपूर्वी कोणत्या नदीच्या काठी नगरे वाढली, जिथे मगध राज्य बलशाली झाले?",
        },
        statement: {
          en: "About 2,500 years ago cities developed on the banks of the Ganga, and the rulers of Magadha grew powerful there.",
          hi: "लगभग 2,500 वर्ष पहले गंगा के किनारे नगर विकसित हुए, और वहाँ मगध के शासक शक्तिशाली हुए।",
          mr: "सुमारे २,५०० वर्षांपूर्वी गंगेच्या काठी नगरे विकसित झाली, आणि तिथे मगधचे राज्यकर्ते बलशाली झाले.",
        },
        pair: {
          left: { en: "The Ganga valley", hi: "गंगा घाटी", mr: "गंगेचे खोरे" },
          right: { en: "Magadha", hi: "मगध", mr: "मगध" },
        },
      },
      {
        id: "bharata",
        name: { en: "The Bharatas", hi: "भरत जन", mr: "भरत लोक" },
        kind: "term",
        prompt: {
          en: "The name 'Bharat' comes from which group of people, mentioned in the Rigveda as living in the north-west?",
          hi: "'भारत' नाम किस जन-समूह से आया, जिसका उल्लेख ऋग्वेद में उत्तर-पश्चिम में रहने वाले के रूप में है?",
          mr: "'भारत' हे नाव कोणत्या लोकसमूहावरून आले, ज्याचा उल्लेख ऋग्वेदात वायव्येकडे राहणारे म्हणून आहे?",
        },
        statement: {
          en: "The Bharatas were a group of people mentioned in the Rigveda, and the name Bharat is used for the country after them.",
          hi: "भरत ऋग्वेद में उल्लिखित एक जन-समूह था, और उन्हीं के नाम पर देश के लिए 'भारत' नाम चला।",
          mr: "भरत हा ऋग्वेदात उल्लेखलेला लोकसमूह होता; त्यांच्यावरूनच देशासाठी 'भारत' हे नाव रूढ झाले.",
        },
      },
      {
        id: "rigveda",
        name: { en: "The Rigveda", hi: "ऋग्वेद", mr: "ऋग्वेद" },
        kind: "text",
        prompt: {
          en: "Which is the oldest of the Vedas, composed about 3,500 years ago?",
          hi: "वेदों में सबसे पुराना कौन-सा है, जिसकी रचना लगभग 3,500 वर्ष पहले हुई?",
          mr: "वेदांपैकी सर्वांत जुना कोणता, ज्याची रचना सुमारे ३,५०० वर्षांपूर्वी झाली?",
        },
        statement: {
          en: "The Rigveda, the oldest Veda, was composed about 3,500 years ago and includes hymns in praise of gods and goddesses.",
          hi: "सबसे पुराना वेद ऋग्वेद लगभग 3,500 वर्ष पहले रचा गया; इसमें देवी-देवताओं की स्तुति के सूक्त हैं।",
          mr: "सर्वांत जुना वेद ऋग्वेद सुमारे ३,५०० वर्षांपूर्वी रचला गेला; त्यात देवदेवतांच्या स्तुतीची सूक्ते आहेत.",
        },
        pair: {
          left: { en: "The Rigveda", hi: "ऋग्वेद", mr: "ऋग्वेद" },
          right: { en: "about 3,500 years old", hi: "लगभग 3,500 वर्ष पुराना", mr: "सुमारे ३,५०० वर्षे जुना" },
        },
      },
      {
        id: "bce-ce",
        name: { en: "BCE and CE", hi: "ईसा पूर्व और ईस्वी", mr: "इ.स.पू. आणि इ.स." },
        kind: "term",
        prompt: {
          en: "What do we call the system of counting dates before and after the birth of Christ?",
          hi: "ईसा मसीह के जन्म से पहले और बाद की तिथियाँ गिनने की पद्धति को क्या कहते हैं?",
          mr: "येशूच्या जन्माच्या आधीच्या आणि नंतरच्या तारखा मोजण्याच्या पद्धतीला काय म्हणतात?",
        },
        statement: {
          en: "Dates are counted back from the birth of Christ as BCE and forward from it as CE, which is why 2026 means 2,026 years since that starting point.",
          hi: "तिथियाँ ईसा के जन्म से पीछे 'ईसा पूर्व' और आगे 'ईस्वी' में गिनी जाती हैं — इसीलिए 2026 का अर्थ है उस आरंभ-बिंदु से 2,026 वर्ष।",
          mr: "तारखा येशूच्या जन्मापासून मागे 'इ.स.पू.' आणि पुढे 'इ.स.' अशा मोजतात — म्हणूनच २०२६ म्हणजे त्या आरंभबिंदूपासून २,०२६ वर्षे.",
        },
      },
      {
        id: "coins",
        name: { en: "Old coins", hi: "पुराने सिक्के", mr: "जुनी नाणी" },
        kind: "source",
        prompt: {
          en: "Which small metal objects, dug out of the earth, often carry the names and images of the rulers who issued them?",
          hi: "ज़मीन से निकलने वाली कौन-सी छोटी धातु-वस्तुएँ प्रायः उन्हें जारी करने वाले शासकों के नाम और चित्र लिए होती हैं?",
          mr: "जमिनीतून सापडणाऱ्या कोणत्या छोट्या धातूच्या वस्तूंवर बहुधा त्या काढणाऱ्या राज्यकर्त्यांची नावे आणि चित्रे असतात?",
        },
        statement: {
          en: "Old coins carry the names and images of the rulers who issued them, so a handful of metal can date a whole city layer.",
          hi: "पुराने सिक्कों पर उन्हें जारी करने वाले शासकों के नाम और चित्र होते हैं — इसलिए मुट्ठी भर धातु पूरे नगर-स्तर की तिथि बता सकती है।",
          mr: "जुन्या नाण्यांवर ती काढणाऱ्या राज्यकर्त्यांची नावे आणि चित्रे असतात — म्हणून मूठभर धातू अख्ख्या नगर-थराचा काळ सांगू शकते.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A farmer's field near the Sulaiman hills, a city drain by the Indus, a palace at Pataliputra on the Ganga — placed oldest first, which order is right?",
          hi: "सुलेमान पहाड़ियों के पास किसान का खेत, सिंधु किनारे नगर की नाली, गंगा किनारे पाटलिपुत्र का महल — सबसे पुराना पहले रखें तो सही क्रम कौन-सा है?",
          mr: "सुलेमान टेकड्यांजवळचे शेत, सिंधूकाठची नगर-गटार, गंगेकाठी पाटलिपुत्रचा राजवाडा — सर्वांत जुने आधी ठेवल्यास योग्य क्रम कोणता?",
        },
        choices: [
          { en: "Field → drain → palace", hi: "खेत → नाली → महल", mr: "शेत → गटार → राजवाडा" },
          { en: "Drain → field → palace", hi: "नाली → खेत → महल", mr: "गटार → शेत → राजवाडा" },
          { en: "Palace → drain → field", hi: "महल → नाली → खेत", mr: "राजवाडा → गटार → शेत" },
          { en: "Field → palace → drain", hi: "खेत → महल → नाली", mr: "शेत → राजवाडा → गटार" },
        ],
        answerIndex: 0,
        solution: {
          en: "Farming near the Sulaiman and Kirthar hills began about 8,000 years ago, the Indus cities rose about 4,700 years ago, and the Ganga cities with Magadha's capital about 2,500 years ago — so field, then drain, then palace.",
          hi: "सुलेमान-किरथर के पास खेती लगभग 8,000 वर्ष पहले शुरू हुई, सिंधु के नगर लगभग 4,700 वर्ष पहले उठे, और गंगा के नगर तथा मगध की राजधानी लगभग 2,500 वर्ष पहले — इसलिए खेत, फिर नाली, फिर महल।",
          mr: "सुलेमान-किरथरजवळ शेती सुमारे ८,००० वर्षांपूर्वी सुरू झाली, सिंधूची नगरे सुमारे ४,७०० वर्षांपूर्वी उभी राहिली, आणि गंगेकाठची नगरे व मगधची राजधानी सुमारे २,५०० वर्षांपूर्वी — म्हणून शेत, मग गटार, मग राजवाडा.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A king's victory record survives twice: hand-copied on palm leaf, and cut into a stone pillar. After a thousand damp monsoons, why would a historian expect the stone to be the more faithful witness?",
          hi: "एक राजा की विजय का वृत्तांत दो रूपों में बचा: ताड़पत्र पर हाथ से नक़ल किया हुआ, और पत्थर के स्तंभ पर खुदा हुआ। हज़ार बरसातों के बाद इतिहासकार पत्थर को अधिक विश्वसनीय गवाह क्यों मानेगा?",
          mr: "एका राजाच्या विजयाची नोंद दोन रूपांत उरली: ताडपत्रावर हाताने नक्कल केलेली, आणि दगडी स्तंभावर कोरलेली. हजार पावसाळ्यांनंतर इतिहासकार दगडालाच अधिक विश्वासू साक्षीदार का मानेल?",
        },
        choices: [
          {
            en: "Stone resists decay, and an engraved text cannot pick up a copyist's slips the way each new hand-copy can",
            hi: "पत्थर सड़ता नहीं, और खुदा पाठ नक़ल-दर-नक़ल होने वाली लिपिक की चूकें नहीं पकड़ता",
            mr: "दगड कुजत नाही, आणि कोरलेल्या मजकुरात नकलामागून नक्कल होणाऱ्या लेखनिकाच्या चुका शिरत नाहीत",
          },
          {
            en: "Stone inscriptions were always written by the king himself",
            hi: "पत्थर के अभिलेख सदा राजा स्वयं लिखता था",
            mr: "दगडी लेख नेहमी राजा स्वतः लिही",
          },
          {
            en: "Palm leaf was only used for religious books, never for victories",
            hi: "ताड़पत्र केवल धार्मिक पुस्तकों के लिए था, विजयों के लिए कभी नहीं",
            mr: "ताडपत्र फक्त धार्मिक पुस्तकांसाठी वापरत, विजयांसाठी कधीच नाही",
          },
          {
            en: "Historians never trust anything written on paper or leaf",
            hi: "इतिहासकार पत्ते या काग़ज़ पर लिखी किसी बात पर भरोसा ही नहीं करते",
            mr: "इतिहासकार पानावर वा कागदावर लिहिलेल्या कशावरही विश्वास ठेवतच नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two things favour stone: the material survives weather that destroys leaf, and an engraving is fixed at one moment while manuscripts are re-copied by hand, letting small errors creep in with each copy. A careful historian still checks both, but the stone is closer to the original act.",
          hi: "पत्थर के पक्ष में दो बातें हैं: वह उस मौसम को झेल जाता है जो पत्तों को नष्ट कर देता है, और खुदाई एक ही क्षण में स्थिर हो जाती है, जबकि पांडुलिपियाँ बार-बार हाथ से नक़ल होती हैं और हर नक़ल में छोटी चूकें घुसती हैं। सजग इतिहासकार दोनों जाँचता है, पर पत्थर मूल घटना के अधिक निकट है।",
          mr: "दगडाच्या बाजूने दोन गोष्टी: पानांचा नाश करणारे हवामान तो सोसतो, आणि कोरीव लेख एका क्षणी पक्का होतो, तर हस्तलिखिते पुन्हा-पुन्हा हाताने नकलली जातात आणि प्रत्येक नकलेत छोट्या चुका शिरतात. चोखंदळ इतिहासकार दोन्ही तपासतो, पण दगड मूळ घटनेच्या अधिक जवळ असतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "An archaeologist finds burnt grain and animal bones in one layer of a mound, and only wild-animal bones with no grain in the layer below it. What is the strongest conclusion?",
          hi: "एक पुरातत्वविद को टीले की एक परत में जला अनाज और पशुओं की हड्डियाँ मिलती हैं, और उसके नीचे की परत में केवल जंगली पशुओं की हड्डियाँ, अनाज नहीं। सबसे मज़बूत निष्कर्ष क्या है?",
          mr: "पुरातत्त्वज्ञाला टेकाडाच्या एका थरात जळालेले धान्य आणि प्राण्यांची हाडे मिळतात, आणि त्याखालच्या थरात फक्त रानटी प्राण्यांची हाडे, धान्य नाही. सर्वांत भक्कम निष्कर्ष कोणता?",
        },
        choices: [
          {
            en: "The settlement's people took up farming and herding sometime between the two layers",
            hi: "दोनों परतों के बीच किसी समय बस्ती के लोगों ने खेती और पशुपालन अपनाया",
            mr: "दोन थरांच्या दरम्यान केव्हातरी वस्तीतील लोकांनी शेती आणि पशुपालन स्वीकारले",
          },
          {
            en: "The lower layer's people were richer than the upper layer's",
            hi: "नीचे की परत के लोग ऊपर की परत के लोगों से धनी थे",
            mr: "खालच्या थरातील लोक वरच्या थरातील लोकांपेक्षा श्रीमंत होते",
          },
          {
            en: "The grain must have been brought by traders from another country",
            hi: "अनाज ज़रूर किसी दूसरे देश के व्यापारी लाए होंगे",
            mr: "धान्य नक्कीच परदेशातील व्यापाऱ्यांनी आणले असणार",
          },
          {
            en: "The mound was never lived in at all",
            hi: "टीले पर कभी कोई रहा ही नहीं",
            mr: "टेकाडावर कधी कोणी राहिलेच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Lower layers are older. Wild bones without grain below, and grain with kept-animal bones above, is the signature of a change in how people got food — from hunting and gathering to growing and herding. Riches, traders or emptiness are not shown by these finds.",
          hi: "नीचे की परतें पुरानी होती हैं। नीचे बिना अनाज के जंगली हड्डियाँ और ऊपर अनाज सहित पालतू पशुओं की हड्डियाँ — यह भोजन पाने के तरीक़े के बदलाव की पहचान है: आखेट-संग्रह से खेती-पशुपालन की ओर। धन, व्यापारी या वीरानी इन खोजों से सिद्ध नहीं होते।",
          mr: "खालचे थर जुने असतात. खाली धान्याविना रानटी हाडे आणि वर धान्यासह पाळीव प्राण्यांची हाडे — ही अन्न मिळवण्याच्या पद्धतीतील बदलाची खूण आहे: शिकार-संग्रहाकडून शेती-पशुपालनाकडे. श्रीमंती, व्यापारी वा ओसाडपणा या शोधांतून सिद्ध होत नाही.",
        },
      },
      {
        level: 5,
        stem: {
          en: "A date is written as '2600 BCE'. Another as '300 CE'. How many years lie between them?",
          hi: "एक तिथि '2600 ईसा पूर्व' लिखी है, दूसरी '300 ईस्वी'। दोनों के बीच कितने वर्ष हैं?",
          mr: "एक तारीख '२६०० इ.स.पू.' लिहिली आहे, दुसरी '३०० इ.स.'. दोहोंमध्ये किती वर्षे आहेत?",
        },
        choices: [
          { en: "2,900 years", hi: "2,900 वर्ष", mr: "२,९०० वर्षे" },
          { en: "2,300 years", hi: "2,300 वर्ष", mr: "२,३०० वर्षे" },
          { en: "2,600 years", hi: "2,600 वर्ष", mr: "२,६०० वर्षे" },
          { en: "300 years", hi: "300 वर्ष", mr: "३०० वर्षे" },
        ],
        answerIndex: 0,
        solution: {
          en: "BCE dates count backwards and CE dates forwards from the same starting point, so the gap is 2600 + 300 = 2,900 years. This is the one counting skill this chapter actually needs — the rest of history is not arithmetic.",
          hi: "ईसा पूर्व की तिथियाँ पीछे और ईस्वी की आगे, एक ही आरंभ-बिंदु से गिनी जाती हैं — अतः अंतर 2600 + 300 = 2,900 वर्ष। यही एक गिनती इस अध्याय को चाहिए; बाक़ी इतिहास अंकगणित नहीं है।",
          mr: "इ.स.पू. च्या तारखा मागे आणि इ.स.च्या पुढे, एकाच आरंभबिंदूपासून मोजतात — म्हणून अंतर २६०० + ३०० = २,९०० वर्षे. एवढीच मोजणी या प्रकरणाला हवी; बाकीचा इतिहास अंकगणित नव्हे.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Ashoka, the Emperor Who Gave Up War                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-6-ashoka-the-emperor-who-gave-up-war",
    subject: "HISTORY",
    classLevel: 6,
    chapter: {
      en: "Chapter 7 — Ashoka, the Emperor Who Gave Up War",
      hi: "अध्याय 7 — अशोक: एक अनोखा सम्राट जिसने युद्ध का त्याग किया",
      mr: "प्रकरण 7 — अशोक: युद्धाचा त्याग करणारा सम्राट",
    },
    name: {
      en: "Ashoka, the Emperor Who Gave Up War",
      hi: "अशोक, जिसने युद्ध का त्याग किया",
      mr: "अशोक, युद्धाचा त्याग करणारा सम्राट",
    },
    summary: {
      en: "The Mauryan empire, the war for Kalinga, and the emperor who answered victory with dhamma.",
      hi: "मौर्य साम्राज्य, कलिंग का युद्ध, और वह सम्राट जिसने विजय का उत्तर धम्म से दिया।",
      mr: "मौर्य साम्राज्य, कलिंगचे युद्ध, आणि विजयाला धम्माने उत्तर देणारा सम्राट.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "chandragupta",
        name: { en: "Chandragupta Maurya", hi: "चंद्रगुप्त मौर्य", mr: "चंद्रगुप्त मौर्य" },
        kind: "person",
        seq: 1,
        prompt: {
          en: "Who founded the Mauryan empire, more than 2,300 years ago?",
          hi: "2,300 से अधिक वर्ष पहले मौर्य साम्राज्य की स्थापना किसने की?",
          mr: "२,३०० हून अधिक वर्षांपूर्वी मौर्य साम्राज्याची स्थापना कोणी केली?",
        },
        statement: {
          en: "Chandragupta Maurya founded the Mauryan empire more than 2,300 years ago, supported by his teacher Chanakya.",
          hi: "चंद्रगुप्त मौर्य ने 2,300 से अधिक वर्ष पहले अपने गुरु चाणक्य के सहयोग से मौर्य साम्राज्य की स्थापना की।",
          mr: "चंद्रगुप्त मौर्याने २,३०० हून अधिक वर्षांपूर्वी आपले गुरू चाणक्य यांच्या साहाय्याने मौर्य साम्राज्याची स्थापना केली.",
        },
        detail: {
          en: "The founder of the dynasty later moved to south India, according to Jaina tradition, giving up his throne.",
          hi: "जैन परंपरा के अनुसार वंश का संस्थापक बाद में सिंहासन त्यागकर दक्षिण भारत चला गया।",
          mr: "जैन परंपरेनुसार घराण्याचा संस्थापक पुढे सिंहासन सोडून दक्षिण भारतात गेला.",
        },
        pair: {
          left: { en: "Chandragupta Maurya", hi: "चंद्रगुप्त मौर्य", mr: "चंद्रगुप्त मौर्य" },
          right: { en: "founder of the dynasty", hi: "वंश का संस्थापक", mr: "घराण्याचा संस्थापक" },
        },
      },
      {
        id: "chanakya",
        name: { en: "Chanakya (Kautilya)", hi: "चाणक्य (कौटिल्य)", mr: "चाणक्य (कौटिल्य)" },
        kind: "person",
        prompt: {
          en: "Which shrewd teacher guided Chandragupta, and is remembered with the Arthashastra?",
          hi: "किस चतुर गुरु ने चंद्रगुप्त का मार्गदर्शन किया, जिसका नाम अर्थशास्त्र से जुड़ा है?",
          mr: "कोणत्या चतुर गुरूने चंद्रगुप्ताला मार्गदर्शन केले, ज्याचे नाव अर्थशास्त्राशी जोडले जाते?",
        },
        statement: {
          en: "Chanakya, also called Kautilya, guided Chandragupta, and many of his ideas are collected in the Arthashastra.",
          hi: "चाणक्य, जिन्हें कौटिल्य भी कहते हैं, ने चंद्रगुप्त का मार्गदर्शन किया; उनके अनेक विचार अर्थशास्त्र में संगृहीत हैं।",
          mr: "चाणक्य, ज्यांना कौटिल्यही म्हणतात, यांनी चंद्रगुप्ताला मार्गदर्शन केले; त्यांचे अनेक विचार अर्थशास्त्रात संग्रहित आहेत.",
        },
        pair: {
          left: { en: "Chanakya", hi: "चाणक्य", mr: "चाणक्य" },
          right: { en: "the Arthashastra", hi: "अर्थशास्त्र", mr: "अर्थशास्त्र" },
        },
      },
      {
        id: "pataliputra",
        name: { en: "Pataliputra", hi: "पाटलिपुत्र", mr: "पाटलिपुत्र" },
        kind: "city",
        prompt: {
          en: "Which city was the capital of the Mauryan empire?",
          hi: "मौर्य साम्राज्य की राजधानी कौन-सा नगर था?",
          mr: "मौर्य साम्राज्याची राजधानी कोणते नगर होते?",
        },
        statement: {
          en: "Pataliputra, on the Ganga, was the Mauryan capital, and the area around it was ruled directly by the emperor's officials.",
          hi: "गंगा किनारे बसा पाटलिपुत्र मौर्यों की राजधानी था, और उसके आसपास का क्षेत्र सम्राट के अधिकारी सीधे सँभालते थे।",
          mr: "गंगेकाठचे पाटलिपुत्र ही मौर्यांची राजधानी होती, आणि तिच्या भोवतालचा प्रदेश सम्राटाचे अधिकारी थेट सांभाळत.",
        },
        detail: {
          en: "A Greek ambassador, Megasthenes, wrote of this capital's wooden walls, its 570 towers and its 64 gates.",
          hi: "यूनानी राजदूत मेगस्थनीज़ ने इस राजधानी की लकड़ी की दीवारों, 570 बुर्जों और 64 द्वारों का वर्णन किया।",
          mr: "ग्रीक राजदूत मेगॅस्थेनिसने या राजधानीच्या लाकडी तटबंदीचे, ५७० बुरुजांचे आणि ६४ दरवाजांचे वर्णन केले.",
        },
        pair: {
          left: { en: "Pataliputra", hi: "पाटलिपुत्र", mr: "पाटलिपुत्र" },
          right: { en: "the Mauryan capital", hi: "मौर्य राजधानी", mr: "मौर्य राजधानी" },
        },
      },
      {
        id: "megasthenes",
        name: { en: "Megasthenes", hi: "मेगस्थनीज़", mr: "मेगॅस्थेनिस" },
        kind: "person",
        prompt: {
          en: "Which ambassador, sent by the Greek ruler Seleucus Nicator, wrote an account of Chandragupta's court?",
          hi: "यूनानी शासक सेल्यूकस निकेटर के भेजे किस राजदूत ने चंद्रगुप्त के दरबार का विवरण लिखा?",
          mr: "ग्रीक राजा सेल्युकस निकेटरने पाठवलेल्या कोणत्या राजदूताने चंद्रगुप्ताच्या दरबाराचे वर्णन लिहिले?",
        },
        statement: {
          en: "Megasthenes was an ambassador sent to Chandragupta's court by Seleucus Nicator, and his account describes its splendour.",
          hi: "मेगस्थनीज़ सेल्यूकस निकेटर द्वारा चंद्रगुप्त के दरबार में भेजा गया राजदूत था; उसके विवरण में दरबार का वैभव मिलता है।",
          mr: "मेगॅस्थेनिस हा सेल्युकस निकेटरने चंद्रगुप्ताच्या दरबारात पाठवलेला राजदूत होता; त्याच्या वर्णनात दरबाराचे वैभव दिसते.",
        },
      },
      {
        id: "bindusara",
        name: { en: "Bindusara", hi: "बिंदुसार", mr: "बिंदुसार" },
        kind: "person",
        seq: 2,
        prompt: {
          en: "Who ruled the Mauryan empire between Chandragupta and Ashoka?",
          hi: "चंद्रगुप्त और अशोक के बीच मौर्य साम्राज्य पर किसने शासन किया?",
          mr: "चंद्रगुप्त आणि अशोक यांच्या दरम्यान मौर्य साम्राज्यावर कोणी राज्य केले?",
        },
        statement: {
          en: "Bindusara, Chandragupta's son and Ashoka's father, held the empire together between its founder and its most famous ruler.",
          hi: "चंद्रगुप्त के पुत्र और अशोक के पिता बिंदुसार ने संस्थापक और सबसे प्रसिद्ध शासक के बीच साम्राज्य को सँभाले रखा।",
          mr: "चंद्रगुप्ताचा पुत्र आणि अशोकाचा पिता बिंदुसार याने संस्थापक व सर्वांत प्रसिद्ध राजा यांच्या दरम्यान साम्राज्य सांभाळले.",
        },
      },
      {
        id: "ashoka",
        name: { en: "Ashoka", hi: "अशोक", mr: "अशोक" },
        kind: "person",
        seq: 3,
        prompt: {
          en: "Which Mauryan emperor is remembered as the first ruler to take his message directly to the people through inscriptions?",
          hi: "किस मौर्य सम्राट को पहला ऐसा शासक माना जाता है जिसने अभिलेखों के ज़रिए अपनी बात सीधे प्रजा तक पहुँचाई?",
          mr: "कोणता मौर्य सम्राट कोरीव लेखांद्वारे आपला संदेश थेट प्रजेपर्यंत पोहोचवणारा पहिला राजा मानला जातो?",
        },
        statement: {
          en: "Ashoka was the first ruler who tried to take his message to the people through inscriptions, most of them in Prakrit, written in the Brahmi script.",
          hi: "अशोक पहला शासक था जिसने अभिलेखों के माध्यम से जनता तक अपना संदेश पहुँचाने का प्रयास किया — अधिकांश प्राकृत भाषा में, ब्राह्मी लिपि में।",
          mr: "अशोक हा कोरीव लेखांद्वारे जनतेपर्यंत आपला संदेश पोहोचवण्याचा प्रयत्न करणारा पहिला राजा होता — बहुतेक लेख प्राकृत भाषेत, ब्राह्मी लिपीत.",
        },
        detail: {
          en: "The lions from one of this emperor's pillars, at Sarnath, stand today as India's national emblem.",
          hi: "इस सम्राट के सारनाथ स्तंभ के सिंह आज भारत के राष्ट्रीय प्रतीक हैं।",
          mr: "या सम्राटाच्या सारनाथ स्तंभावरील सिंह आज भारताचे राष्ट्रीय बोधचिन्ह आहेत.",
        },
        extra: {
          en: "This emperor gave up war after one terrible victory, the only king in history known to have done so at the height of winning.",
          hi: "इस सम्राट ने एक भीषण विजय के बाद युद्ध त्याग दिया — इतिहास में विजय के शिखर पर ऐसा करने वाला एकमात्र राजा।",
          mr: "या सम्राटाने एका भीषण विजयानंतर युद्धाचा त्याग केला — विजयाच्या शिखरावर असे करणारा इतिहासातील एकमेव राजा.",
        },
        pair: {
          left: { en: "Ashoka", hi: "अशोक", mr: "अशोक" },
          right: { en: "the Sarnath lions", hi: "सारनाथ के सिंह", mr: "सारनाथचे सिंह" },
        },
      },
      {
        id: "kalinga",
        name: { en: "Kalinga", hi: "कलिंग", mr: "कलिंग" },
        kind: "place",
        seq: 4,
        prompt: {
          en: "The war for which coastal region — modern Odisha — filled Ashoka with such sorrow that he gave up fighting?",
          hi: "किस तटीय क्षेत्र — आधुनिक ओडिशा — के युद्ध ने अशोक को इतने दुःख से भर दिया कि उसने युद्ध ही त्याग दिया?",
          mr: "कोणत्या किनारी प्रदेशाच्या — आजच्या ओडिशाच्या — युद्धाने अशोकाला इतके दुःख झाले की त्याने लढाईच सोडली?",
        },
        statement: {
          en: "Kalinga is the ancient name of coastal Odisha, and the bloodshed of its conquest is what turned Ashoka away from war.",
          hi: "कलिंग तटीय ओडिशा का प्राचीन नाम है, और उसी की विजय के रक्तपात ने अशोक को युद्ध से विमुख कर दिया।",
          mr: "कलिंग हे किनारी ओडिशाचे प्राचीन नाव आहे, आणि त्याच्या विजयातील रक्तपातानेच अशोकाला युद्धापासून परावृत्त केले.",
        },
        pair: {
          left: { en: "Kalinga", hi: "कलिंग", mr: "कलिंग" },
          right: { en: "coastal Odisha", hi: "तटीय ओडिशा", mr: "किनारी ओडिशा" },
        },
      },
      {
        id: "dhamma",
        name: { en: "Dhamma", hi: "धम्म", mr: "धम्म" },
        kind: "term",
        seq: 5,
        prompt: {
          en: "What did Ashoka call the set of teachings — respect for elders, kindness to servants and animals, honour for all religions — that he asked his people to follow?",
          hi: "बड़ों का आदर, सेवकों और पशुओं के प्रति दया, सभी धर्मों का सम्मान — अशोक ने जिन शिक्षाओं को अपनाने को कहा, उन्हें क्या कहा जाता है?",
          mr: "वडीलधाऱ्यांचा आदर, सेवक व प्राण्यांशी दया, सर्व धर्मांचा सन्मान — अशोकाने ज्या शिकवणी पाळायला सांगितल्या त्यांना काय म्हणतात?",
        },
        statement: {
          en: "Ashoka's dhamma did not involve worship of a god or sacrifice — it asked people to live gently and respect one another.",
          hi: "अशोक के धम्म में किसी देवता की पूजा या बलि नहीं थी — वह लोगों से कोमलता से जीने और एक-दूसरे का सम्मान करने को कहता था।",
          mr: "अशोकाच्या धम्मात कोणत्या देवाची पूजा वा यज्ञ नव्हता — तो लोकांना सौम्यपणे जगायला आणि परस्परांचा आदर करायला सांगे.",
        },
        detail: {
          en: "Officials called dhamma mahamatta were appointed to travel and teach this message to the people.",
          hi: "धम्म महामात्त नामक अधिकारी नियुक्त किए गए, जो घूम-घूमकर लोगों को यह संदेश सिखाते थे।",
          mr: "धम्म महामात्त नावाचे अधिकारी नेमले गेले; ते फिरून लोकांना हा संदेश शिकवत.",
        },
        extra: {
          en: "Messengers carrying this message were sent as far as Syria, Egypt, Greece and Sri Lanka.",
          hi: "यह संदेश लेकर दूत सीरिया, मिस्र, यूनान और श्रीलंका तक भेजे गए।",
          mr: "हा संदेश घेऊन दूत सीरिया, इजिप्त, ग्रीस आणि श्रीलंकेपर्यंत पाठवले गेले.",
        },
        pair: {
          left: { en: "Dhamma", hi: "धम्म", mr: "धम्म" },
          right: { en: "dhamma mahamatta", hi: "धम्म महामात्त", mr: "धम्म महामात्त" },
        },
      },
      {
        id: "prakrit-brahmi",
        name: { en: "Prakrit and Brahmi", hi: "प्राकृत और ब्राह्मी", mr: "प्राकृत आणि ब्राह्मी" },
        kind: "term",
        prompt: {
          en: "In which language, and in which script, were most of Ashoka's inscriptions written?",
          hi: "अशोक के अधिकांश अभिलेख किस भाषा और किस लिपि में लिखे गए?",
          mr: "अशोकाचे बहुतेक कोरीव लेख कोणत्या भाषेत आणि कोणत्या लिपीत लिहिले गेले?",
        },
        statement: {
          en: "Most of Ashoka's inscriptions used Prakrit, the language of ordinary people, in the Brahmi script — so his message could actually be read out and understood.",
          hi: "अशोक के अधिकांश अभिलेख आम लोगों की भाषा प्राकृत में, ब्राह्मी लिपि में थे — ताकि उसका संदेश सचमुच पढ़ा और समझा जा सके।",
          mr: "अशोकाचे बहुतेक लेख सामान्य लोकांची भाषा प्राकृतमध्ये, ब्राह्मी लिपीत होते — म्हणजे त्याचा संदेश खरोखर वाचून समजावा.",
        },
        pair: {
          left: { en: "Ashoka's inscriptions", hi: "अशोक के अभिलेख", mr: "अशोकाचे कोरीव लेख" },
          right: { en: "Prakrit in Brahmi", hi: "ब्राह्मी में प्राकृत", mr: "ब्राह्मीत प्राकृत" },
        },
      },
      {
        id: "empire-vs-kingdom",
        name: { en: "An empire", hi: "साम्राज्य", mr: "साम्राज्य" },
        kind: "term",
        prompt: {
          en: "What do we call a rule larger than a kingdom, needing more resources and bigger armies, over many peoples at once?",
          hi: "राज्य से बड़े उस शासन को क्या कहते हैं जिसे अधिक संसाधन, बड़ी सेनाएँ और एक साथ कई जन-समूहों पर नियंत्रण चाहिए?",
          mr: "राज्यापेक्षा मोठ्या, अधिक साधनसंपत्ती व मोठ्या सैन्याची गरज असणाऱ्या, अनेक लोकसमूहांवरील शासनाला काय म्हणतात?",
        },
        statement: {
          en: "An empire is larger than a kingdom, needs more resources to protect, and its different parts were ruled in different ways under the Mauryas.",
          hi: "साम्राज्य राज्य से बड़ा होता है, उसकी रक्षा को अधिक संसाधन चाहिए, और मौर्यों के अधीन उसके अलग-अलग भागों पर अलग-अलग ढंग से शासन होता था।",
          mr: "साम्राज्य राज्यापेक्षा मोठे असते, त्याच्या रक्षणाला अधिक साधने लागतात, आणि मौर्यांच्या काळात त्याच्या निरनिराळ्या भागांवर निरनिराळ्या पद्धतीने राज्य चाले.",
        },
      },
      {
        id: "tribute",
        name: { en: "Tribute", hi: "भेंट (नज़राना)", mr: "खंडणी" },
        kind: "term",
        prompt: {
          en: "Unlike regular taxes, what do we call the payments collected only when the rulers could, from areas they did not directly control?",
          hi: "नियमित करों के विपरीत, उन वसूलियों को क्या कहते हैं जो शासक अपने प्रत्यक्ष नियंत्रण से बाहर के क्षेत्रों से जब-तब ले पाते थे?",
          mr: "नियमित करांहून वेगळ्या, थेट नियंत्रणाबाहेरील प्रदेशांतून जमेल तेव्हा घेतल्या जाणाऱ्या वसुलीला काय म्हणतात?",
        },
        statement: {
          en: "Tribute was collected when the empire could enforce it, from regions it did not administer directly — unlike taxes, which came in regularly.",
          hi: "भेंट उन क्षेत्रों से ली जाती थी जिन्हें साम्राज्य सीधे नहीं चलाता था, और तभी जब वह वसूल करा सके — नियमित रूप से आने वाले करों के विपरीत।",
          mr: "खंडणी साम्राज्य थेट चालवत नसलेल्या प्रदेशांतून, जमेल तेव्हा घेतली जाई — नियमित येणाऱ्या करांहून वेगळी.",
        },
      },
      {
        id: "taxila-ujjain",
        name: { en: "Taxila and Ujjain", hi: "तक्षशिला और उज्जयिनी", mr: "तक्षशिला आणि उज्जयिनी" },
        kind: "city",
        prompt: {
          en: "Which two provincial centres of the Mauryan empire sat on the routes to the north-west and to the south?",
          hi: "मौर्य साम्राज्य के कौन-से दो प्रांतीय केंद्र उत्तर-पश्चिम और दक्षिण के मार्गों पर स्थित थे?",
          mr: "मौर्य साम्राज्याची कोणती दोन प्रांतीय केंद्रे वायव्येकडील व दक्षिणेकडील मार्गांवर होती?",
        },
        statement: {
          en: "Taxila was a gateway to the north-west and Ujjain lay on the route from north to south — both were Mauryan provincial centres with their own royal princes.",
          hi: "तक्षशिला उत्तर-पश्चिम का प्रवेशद्वार थी और उज्जयिनी उत्तर से दक्षिण के मार्ग पर — दोनों मौर्य प्रांतीय केंद्र थे, जहाँ राजकुमार नियुक्त होते थे।",
          mr: "तक्षशिला वायव्येचे प्रवेशद्वार होती आणि उज्जयिनी उत्तर-दक्षिण मार्गावर — दोन्ही मौर्य प्रांतीय केंद्रे होती, तिथे राजपुत्र नेमले जात.",
        },
        pair: {
          left: { en: "Taxila", hi: "तक्षशिला", mr: "तक्षशिला" },
          right: { en: "gateway to the north-west", hi: "उत्तर-पश्चिम का द्वार", mr: "वायव्येचे प्रवेशद्वार" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put these in the order they happened: the Kalinga war, Chandragupta founds the empire, Ashoka spreads dhamma, Bindusara rules.",
          hi: "इन्हें घटनाक्रम में रखें: कलिंग युद्ध, चंद्रगुप्त द्वारा साम्राज्य की स्थापना, अशोक का धम्म-प्रचार, बिंदुसार का शासन।",
          mr: "हे घडले त्या क्रमाने लावा: कलिंग युद्ध, चंद्रगुप्ताची साम्राज्य-स्थापना, अशोकाचा धम्मप्रसार, बिंदुसाराचे राज्य.",
        },
        choices: [
          {
            en: "Founding → Bindusara → Kalinga → dhamma",
            hi: "स्थापना → बिंदुसार → कलिंग → धम्म",
            mr: "स्थापना → बिंदुसार → कलिंग → धम्म",
          },
          {
            en: "Kalinga → founding → dhamma → Bindusara",
            hi: "कलिंग → स्थापना → धम्म → बिंदुसार",
            mr: "कलिंग → स्थापना → धम्म → बिंदुसार",
          },
          {
            en: "Founding → Kalinga → Bindusara → dhamma",
            hi: "स्थापना → कलिंग → बिंदुसार → धम्म",
            mr: "स्थापना → कलिंग → बिंदुसार → धम्म",
          },
          {
            en: "Dhamma → Kalinga → Bindusara → founding",
            hi: "धम्म → कलिंग → बिंदुसार → स्थापना",
            mr: "धम्म → कलिंग → बिंदुसार → स्थापना",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Chandragupta founded the empire; his son Bindusara ruled next; Bindusara's son Ashoka fought Kalinga; and it was after Kalinga's bloodshed that Ashoka turned to dhamma. Grandfather, father, son — then the change of heart.",
          hi: "चंद्रगुप्त ने साम्राज्य स्थापित किया; उसके बाद पुत्र बिंदुसार ने शासन किया; बिंदुसार के पुत्र अशोक ने कलिंग युद्ध लड़ा; और कलिंग के रक्तपात के बाद ही अशोक धम्म की ओर मुड़ा। दादा, पिता, पुत्र — फिर हृदय-परिवर्तन।",
          mr: "चंद्रगुप्ताने साम्राज्य स्थापले; नंतर पुत्र बिंदुसाराने राज्य केले; बिंदुसाराचा पुत्र अशोकाने कलिंग युद्ध लढले; आणि कलिंगच्या रक्तपातानंतरच अशोक धम्माकडे वळला. आजोबा, वडील, मुलगा — मग हृदयपरिवर्तन.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Ashoka had his message carved in Prakrit, not Sanskrit, and placed on pillars along roads and at crossings. Taken together, what do these two choices tell us he wanted?",
          hi: "अशोक ने अपना संदेश संस्कृत में नहीं, प्राकृत में खुदवाया, और स्तंभ सड़कों किनारे व चौराहों पर लगवाए। ये दोनों चुनाव मिलकर उसकी किस मंशा को दर्शाते हैं?",
          mr: "अशोकाने आपला संदेश संस्कृतात नव्हे, प्राकृतात कोरवला, आणि स्तंभ रस्त्यांकाठी व चव्हाट्यांवर उभारले. या दोन्ही निवडी मिळून त्याची कोणती इच्छा दाखवतात?",
        },
        choices: [
          {
            en: "That ordinary people, not just scholars, should meet and understand his message in daily life",
            hi: "कि केवल विद्वान नहीं, आम लोग रोज़मर्रा के जीवन में उसका संदेश पाएँ और समझें",
            mr: "की केवळ विद्वानच नव्हे, सामान्य माणसांनी रोजच्या जगण्यात त्याचा संदेश पाहावा आणि समजावा",
          },
          {
            en: "That the inscriptions should impress foreign ambassadors like Megasthenes",
            hi: "कि अभिलेख मेगस्थनीज़ जैसे विदेशी राजदूतों को प्रभावित करें",
            mr: "की कोरीव लेखांनी मेगॅस्थेनिससारख्या परदेशी राजदूतांवर छाप पडावी",
          },
          {
            en: "That Sanskrit had no script it could be written in",
            hi: "कि संस्कृत के लिए कोई लिपि ही नहीं थी",
            mr: "की संस्कृतासाठी लिपीच नव्हती",
          },
          {
            en: "That the pillars were meant to mark the empire's borders",
            hi: "कि स्तंभ साम्राज्य की सीमाएँ चिह्नित करने के लिए थे",
            mr: "की स्तंभ साम्राज्याच्या सीमा दाखवण्यासाठी होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Prakrit was the people's language where Sanskrit was the scholars'; roads and crossings are where people actually pass. Both choices point the same way: the message was aimed at everyone, to be read aloud by anyone who could, wherever life happened.",
          hi: "प्राकृत जनता की भाषा थी, संस्कृत विद्वानों की; सड़कें और चौराहे वहीं हैं जहाँ से लोग सचमुच गुज़रते हैं। दोनों चुनाव एक ही दिशा में इशारा करते हैं: संदेश सबके लिए था — जहाँ जीवन चलता है वहीं, जो भी पढ़ सके उसके द्वारा सुनाया जाने के लिए।",
          mr: "प्राकृत लोकांची भाषा होती, संस्कृत विद्वानांची; रस्ते आणि चव्हाटे तिथेच असतात जिथून माणसे खरोखर जातात. दोन्ही निवडी एकाच दिशेने बोट दाखवतात: संदेश सर्वांसाठी होता — जिथे जगणे घडते तिथे, वाचता येईल त्याने वाचून दाखवण्यासाठी.",
        },
      },
      {
        level: 6,
        stem: {
          en: "After Kalinga, Ashoka wrote that he would win people over by dhamma instead of war — yet he did not give up the empire or its army. What does this combination best show about his rule?",
          hi: "कलिंग के बाद अशोक ने लिखा कि वह युद्ध के बदले धम्म से लोगों का मन जीतेगा — फिर भी उसने साम्राज्य या सेना नहीं छोड़ी। यह मेल उसके शासन के बारे में सबसे अच्छा क्या दर्शाता है?",
          mr: "कलिंगनंतर अशोकाने लिहिले की तो युद्धाऐवजी धम्माने लोकांची मने जिंकेल — तरीही त्याने साम्राज्य वा सैन्य सोडले नाही. हा मेळ त्याच्या राज्यकारभाराविषयी सर्वांत नेमके काय दाखवतो?",
        },
        choices: [
          {
            en: "He changed how he wished to rule — by persuasion rather than conquest — while still remaining a practical emperor",
            hi: "उसने शासन का ढंग बदला — विजय के बजाय समझाने-बुझाने से — पर व्यावहारिक सम्राट बना रहा",
            mr: "त्याने राज्य करण्याची रीत बदलली — विजयाऐवजी मन वळवण्याची — पण तो व्यवहारी सम्राटच राहिला",
          },
          {
            en: "He secretly planned more wars after Kalinga",
            hi: "वह कलिंग के बाद चुपचाप और युद्धों की योजना बना रहा था",
            mr: "तो कलिंगनंतर गुपचूप आणखी युद्धांची आखणी करत होता",
          },
          {
            en: "The Kalinga war never actually happened",
            hi: "कलिंग युद्ध वास्तव में हुआ ही नहीं था",
            mr: "कलिंग युद्ध प्रत्यक्षात घडलेच नव्हते",
          },
          {
            en: "He handed the empire to the dhamma mahamatta to rule",
            hi: "उसने साम्राज्य धम्म महामात्तों को सौंप दिया",
            mr: "त्याने साम्राज्य धम्म महामात्तांच्या हाती दिले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Giving up war is not the same as giving up rule. Ashoka kept the empire and its machinery but changed its method — officials to teach rather than armies to conquer, inscriptions rather than campaigns. Historians read this as a real change of policy inside a still-working empire, not a retirement from power.",
          hi: "युद्ध छोड़ना शासन छोड़ना नहीं है। अशोक ने साम्राज्य और उसका तंत्र बनाए रखा, पर तरीक़ा बदल दिया — विजय करती सेनाओं की जगह सिखाने वाले अधिकारी, अभियानों की जगह अभिलेख। इतिहासकार इसे सत्ता से संन्यास नहीं, चलते हुए साम्राज्य के भीतर नीति का वास्तविक बदलाव मानते हैं।",
          mr: "युद्ध सोडणे म्हणजे राज्य सोडणे नव्हे. अशोकाने साम्राज्य आणि त्याची यंत्रणा राखली, पण पद्धत बदलली — जिंकणाऱ्या सैन्यांऐवजी शिकवणारे अधिकारी, मोहिमांऐवजी कोरीव लेख. इतिहासकार याला सत्तेचा त्याग नव्हे, तर चालत्या साम्राज्यातील धोरणाचा खरा बदल मानतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — On the Trail of the Earliest People                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-6-earliest-people",
    subject: "HISTORY",
    classLevel: 6,
    chapter: {
      en: "Chapter 2 — On the Trail of the Earliest People",
      hi: "अध्याय 2 — आरंभिक मानव की खोज में",
      mr: "प्रकरण 2 — आरंभीच्या माणसांच्या शोधात",
    },
    name: {
      en: "On the Trail of the Earliest People",
      hi: "आरंभिक मानव की खोज में",
      mr: "आरंभीच्या माणसांच्या शोधात",
    },
    summary: {
      en: "Hunter-gatherers who moved with the seasons — their stone tools, their tamed fire, and the painted caves that let us follow a people who wrote nothing.",
      hi: "ऋतुओं के साथ चलते आखेटक-संग्राहक — उनके पत्थर के औज़ार, उनकी सधाई आग, और वे चित्रित गुफाएँ जो कुछ न लिखने वाले लोगों का पीछा करने देती हैं।",
      mr: "ऋतूंसोबत फिरणारे शिकारी-गोळाकरी — त्यांची दगडी हत्यारे, त्यांची माणसाळलेली आग, आणि काहीही न लिहिणाऱ्या माणसांचा माग काढू देणाऱ्या चित्रित गुहा.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "huntergatherers",
        name: {
          en: "The hunter-gatherers",
          hi: "आखेटक-संग्राहक",
          mr: "शिकारी-गोळाकरी",
        },
        kind: "people",
        prompt: {
          en: "Long before fields or houses, who lived by hunting animals and gathering fruit, roots and eggs — owning nothing they could not carry?",
          hi: "खेतों और घरों से बहुत पहले, कौन शिकार करके और फल, कंद, अंडे बटोरकर जीते थे — पास वही जो उठाकर चल सकें?",
          mr: "शेते आणि घरांच्या खूप आधी, कोण शिकार करून आणि फळे, कंद, अंडी गोळा करून जगत — जवळ तेच जे उचलून चालता येईल?",
        },
        statement: {
          en: "The hunter-gatherers lived on what the land offered daily — hunted meat, gathered fruit and roots — and carried their whole world with them.",
          hi: "आखेटक-संग्राहक धरती की रोज़ की देन पर जीते थे — शिकार का माँस, बटोरे फल-कंद — और अपनी पूरी दुनिया साथ उठाए चलते थे।",
          mr: "शिकारी-गोळाकरी भूमीच्या रोजच्या देणगीवर जगत — शिकारीचे मांस, गोळा केलेली फळे-कंद — आणि आपले सारे जग सोबत वाहून चालत.",
        },
        pair: {
          left: { en: "The hunter-gatherers", hi: "आखेटक-संग्राहक", mr: "शिकारी-गोळाकरी" },
          right: {
            en: "a world carried on the back",
            hi: "पीठ पर उठाई दुनिया",
            mr: "पाठीवर वाहिलेले जग",
          },
        },
      },
      {
        id: "moving",
        name: { en: "Their constant moving", hi: "उनका निरंतर चलना", mr: "त्यांचे सतत फिरणे" },
        kind: "way-of-life",
        prompt: {
          en: "Why did the earliest people never stay long in one camp — what four things kept running out or moving on?",
          hi: "आरंभिक लोग एक पड़ाव पर देर क्यों नहीं टिकते थे — कौन-सी चार चीज़ें चुकती या आगे बढ़ती रहती थीं?",
          mr: "आरंभीची माणसे एका तळावर फार का थांबत नसत — कोणत्या चार गोष्टी संपत वा पुढे सरकत राहत?",
        },
        statement: {
          en: "They moved because staying starved them — a camp's plants got eaten out, the hunted animals moved, fruits ripened by season elsewhere, and water dried.",
          hi: "वे इसलिए चलते थे कि टिकना भूखा मारता — पड़ाव के पौधे चुक जाते, शिकार के जानवर आगे बढ़ जाते, फल मौसम से कहीं और पकते, और पानी सूख जाता।",
          mr: "ते फिरत कारण थांबणे उपाशी मारी — तळावरची झाडे संपत, शिकारीचे प्राणी पुढे जात, फळे ऋतूने दुसरीकडे पिकत, आणि पाणी आटे.",
        },
        detail: {
          en: "Following the animals and the seasons was not wandering — it was a calendar walked on foot.",
          hi: "जानवरों और ऋतुओं के पीछे चलना भटकना नहीं था — वह पैदल चला हुआ पंचांग था।",
          mr: "प्राणी आणि ऋतूंच्या मागे जाणे म्हणजे भटकणे नव्हे — ते पायी चाललेले पंचांगच होते.",
        },
        extra: {
          en: "Their camps hugged rivers and lakes — everything else could be sought, water could not be skipped.",
          hi: "उनके पड़ाव नदियों-झीलों से सटे रहते — बाक़ी सब खोजा जा सकता था, पानी छोड़ा नहीं जा सकता था।",
          mr: "त्यांचे तळ नद्या-तळ्यांना बिलगून राहत — बाकी सारे शोधता येई, पाणी वगळता येत नसे.",
        },
        pair: {
          left: { en: "Their moving", hi: "उनका चलना", mr: "त्यांचे फिरणे" },
          right: {
            en: "a calendar walked on foot",
            hi: "पैदल चला पंचांग",
            mr: "पायी चाललेले पंचांग",
          },
        },
      },
      {
        id: "stonetools",
        name: { en: "The stone tools", hi: "पत्थर के औज़ार", mr: "दगडी हत्यारे" },
        kind: "thing",
        prompt: {
          en: "Sharpened flakes and choppers of stone — used for cutting meat, scraping bark and digging roots — were the earliest people's what?",
          hi: "काटने, छाल छीलने और कंद खोदने के काम आते पत्थर के धारदार परत-टुकड़े और चॉपर — आरंभिक लोगों के क्या थे?",
          mr: "मांस कापायला, साल खरवडायला आणि कंद उकरायला वापरले जाणारे दगडाचे धारदार छिलके आणि तोडे — आरंभीच्या माणसांचे काय होते?",
        },
        statement: {
          en: "Stone tools were their knives, axes and diggers in one — flakes struck sharp from chosen stone, edges that meat and bark obeyed.",
          hi: "पत्थर के औज़ार उनके चाकू, कुल्हाड़ी और खुरपी एक साथ थे — चुने पत्थर से तोड़ी धारदार परतें, ऐसी धारें जिनके आगे माँस और छाल झुकते थे।",
          mr: "दगडी हत्यारे म्हणजे त्यांचे सुरे, कुऱ्हाडी आणि खुरपी एकत्र — निवडलेल्या दगडातून काढलेले धारदार छिलके, मांस आणि साल ज्यांना बधत त्या धारा.",
        },
        pair: {
          left: { en: "The stone tools", hi: "पत्थर के औज़ार", mr: "दगडी हत्यारे" },
          right: {
            en: "knife, axe and digger in one",
            hi: "चाकू, कुल्हाड़ी, खुरपी एक में",
            mr: "सुरा, कुऱ्हाड, खुरपे एकात",
          },
        },
      },
      {
        id: "factorysites",
        name: { en: "The factory sites", hi: "औज़ार-निर्माण स्थल", mr: "हत्यार-निर्मिती स्थळे" },
        kind: "place",
        prompt: {
          en: "At places like Hunsgi, good stone lay close by — and the ground is littered with half-made tools and chips. What are such tool-making spots called?",
          hi: "हुँस्गी जैसी जगहों पर अच्छा पत्थर पास ही मिलता था — और ज़मीन अधबने औज़ारों और छीलन से पटी है। ऐसे औज़ार बनाने के ठिकानों को क्या कहते हैं?",
          mr: "हुंस्गीसारख्या जागी चांगला दगड जवळच मिळे — आणि जमीन अर्धवट हत्यारांनी आणि छिलक्यांनी भरलेली आहे. अशा हत्यारे बनवण्याच्या ठिकाणांना काय म्हणतात?",
        },
        statement: {
          en: "Factory sites grew where good stone lay — people camped there to strike tools, leaving chips and half-made pieces that mark the spot to this day.",
          hi: "औज़ार-स्थल वहाँ पनपे जहाँ अच्छा पत्थर था — लोग वहीं डेरा डालकर औज़ार तोड़ते-गढ़ते, और छीलन व अधबने टुकड़े आज तक उस जगह की निशानदेही करते हैं।",
          mr: "हत्यार-स्थळे चांगला दगड होता तिथे वाढली — माणसे तिथेच तळ ठोकून हत्यारे घडवत, आणि छिलके व अर्धवट तुकडे आजही ती जागा दाखवतात.",
        },
        pair: {
          left: { en: "The factory sites", hi: "औज़ार-स्थल", mr: "हत्यार-स्थळे" },
          right: {
            en: "chips that mark the workshop",
            hi: "कार्यशाला बतातीं छीलनें",
            mr: "कार्यशाळा दाखवणारे छिलके",
          },
        },
      },
      {
        id: "fire",
        name: { en: "The tamed fire", hi: "सधाई हुई आग", mr: "माणसाळलेली आग" },
        kind: "thing",
        prompt: {
          en: "Ash layers in old caves show the earliest people kept WHAT burning — for cooking, warmth, light, and to keep the night's animals away?",
          hi: "पुरानी गुफाओं की राख-परतें दिखाती हैं कि आरंभिक लोग क्या जलाए रखते थे — पकाने, गर्मी, रोशनी और रात के जानवरों को दूर रखने को?",
          mr: "जुन्या गुहांतले राखेचे थर दाखवतात की आरंभीची माणसे काय पेटते ठेवत — शिजवायला, ऊब, उजेड आणि रात्रीच्या प्राण्यांना दूर ठेवायला?",
        },
        statement: {
          en: "Fire was their cook, heater, lamp and guard in one — cave floors at places like Kurnool keep its ash in layers.",
          hi: "आग उनकी रसोइया, अँगीठी, दीया और पहरेदार एक साथ थी — कुरनूल जैसी गुफाओं के फ़र्श उसकी राख परतों में सँजोए हैं।",
          mr: "आग त्यांची स्वयंपाकी, शेगडी, दिवा आणि राखणदार एकत्र होती — कुर्नूलसारख्या गुहांच्या फरश्या तिची राख थरांत जपून आहेत.",
        },
        detail: {
          en: "Cooked food chews softer and keeps better — fire changed the very menu of being human.",
          hi: "पका खाना नरम चबता है और ज़्यादा टिकता है — आग ने इंसान होने का मेन्यू ही बदल दिया।",
          mr: "शिजलेले अन्न मऊ चावले जाते आणि जास्त टिकते — आगीने माणूस असण्याचा मेनूच बदलला.",
        },
        extra: {
          en: "No beast dares a burning branch — the campfire was the first wall ever built.",
          hi: "जलती डाल के आगे कोई जानवर नहीं आता — अलाव अब तक की पहली बनी दीवार थी।",
          mr: "जळत्या फांदीपुढे कोणताही पशू येत नाही — शेकोटी ही आजवरची पहिली बांधलेली भिंत होती.",
        },
        pair: {
          left: { en: "The tamed fire", hi: "सधाई आग", mr: "माणसाळलेली आग" },
          right: {
            en: "cook, lamp and guard",
            hi: "रसोइया, दीया, पहरेदार",
            mr: "स्वयंपाकी, दिवा, राखणदार",
          },
        },
      },
      {
        id: "bhimbetka",
        name: {
          en: "The Bhimbetka paintings",
          hi: "भीमबेटका के चित्र",
          mr: "भीमबेटकाची चित्रे",
        },
        kind: "place",
        prompt: {
          en: "On cave walls in Madhya Pradesh, ancient hands painted deer, boar and dancing lines of people. Which painted rock shelters are these?",
          hi: "मध्य प्रदेश की गुफा-दीवारों पर प्राचीन हाथों ने हिरन, सूअर और नाचती मानव-पंक्तियाँ चित्रित कीं। ये चित्रित शैलाश्रय कौन-से हैं?",
          mr: "मध्य प्रदेशातल्या गुहा-भिंतींवर प्राचीन हातांनी हरणे, रानडुकरे आणि नाचणाऱ्या माणसांच्या रांगा रंगवल्या. ही चित्रित शैलाश्रये कोणती?",
        },
        statement: {
          en: "Bhimbetka's rock shelters hold hundreds of ancient paintings — deer and boar, hunts and dances, the daily world of people who left no writing.",
          hi: "भीमबेटका के शैलाश्रयों में सैकड़ों प्राचीन चित्र हैं — हिरन और सूअर, शिकार और नृत्य, उन लोगों की रोज़मर्रा दुनिया जिन्होंने कोई लिखत नहीं छोड़ी।",
          mr: "भीमबेटकाच्या शैलाश्रयांत शेकडो प्राचीन चित्रे आहेत — हरणे आणि रानडुकरे, शिकारी आणि नाच, लिखाण न ठेवलेल्या माणसांचे रोजचे जग.",
        },
        pair: {
          left: { en: "Bhimbetka", hi: "भीमबेटका", mr: "भीमबेटका" },
          right: {
            en: "walls that kept their pictures",
            hi: "तस्वीरें सहेजतीं दीवारें",
            mr: "चित्रे जपणाऱ्या भिंती",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the trace to what it tells: A-chips and half-made tools at one spot, B-layers of ash on a cave floor, C-animals painted on rock walls. Which trio is right?",
          hi: "निशान को उसकी गवाही से मिलाइए: अ-एक जगह छीलन और अधबने औज़ार, ब-गुफा-फ़र्श पर राख की परतें, स-चट्टानी दीवारों पर चित्रित जानवर। कौन-सी तिकड़ी सही है?",
          mr: "खूण तिच्या साक्षीशी जुळवा: अ-एका जागी छिलके आणि अर्धवट हत्यारे, ब-गुहेच्या फरशीवर राखेचे थर, क-खडक-भिंतींवर रंगवलेले प्राणी. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: tools were made here · B: fire was kept here · C: these beasts filled their world",
            hi: "अ: यहाँ औज़ार बनते थे · ब: यहाँ आग रखी जाती थी · स: इन जानवरों से उनकी दुनिया भरी थी",
            mr: "अ: इथे हत्यारे बनत · ब: इथे आग ठेवली जाई · क: या पशूंनी त्यांचे जग भरले होते",
          },
          {
            en: "A: fire was kept here · B: these beasts filled their world · C: tools were made here",
            hi: "अ: यहाँ आग रखी जाती थी · ब: इन जानवरों से दुनिया भरी थी · स: यहाँ औज़ार बनते थे",
            mr: "अ: इथे आग ठेवली जाई · ब: या पशूंनी जग भरले होते · क: इथे हत्यारे बनत",
          },
          {
            en: "A: these beasts filled their world · B: tools were made here · C: fire was kept here",
            hi: "अ: इन जानवरों से दुनिया भरी थी · ब: यहाँ औज़ार बनते थे · स: यहाँ आग रखी जाती थी",
            mr: "अ: या पशूंनी जग भरले होते · ब: इथे हत्यारे बनत · क: इथे आग ठेवली जाई",
          },
          {
            en: "A: tools were made here · B: these beasts filled their world · C: fire was kept here",
            hi: "अ: यहाँ औज़ार बनते थे · ब: इन जानवरों से दुनिया भरी थी · स: यहाँ आग रखी जाती थी",
            mr: "अ: इथे हत्यारे बनत · ब: या पशूंनी जग भरले होते · क: इथे आग ठेवली जाई",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Chips mean a workshop, ash means a hearth, paintings mean the animals that mattered. People who wrote nothing still testified everywhere — the historian of this age reads floors and walls the way later historians read pages.",
          hi: "छीलन यानी कार्यशाला, राख यानी चूल्हा, चित्र यानी वे जानवर जो मायने रखते थे। कुछ न लिखने वालों ने भी हर जगह गवाही दी — इस युग का इतिहासकार फ़र्श और दीवारें वैसे पढ़ता है जैसे बाद के इतिहासकार पन्ने।",
          mr: "छिलके म्हणजे कार्यशाळा, राख म्हणजे चूल, चित्रे म्हणजे महत्त्वाचे ठरलेले प्राणी. काहीही न लिहिणाऱ्यांनीही सर्वत्र साक्ष दिली — या युगाचा इतिहासकार फरश्या आणि भिंती तशा वाचतो जशी नंतरचे इतिहासकार पाने वाचतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Nearly every early camp that archaeologists find lies beside a river or lake. Of all their needs, why did WATER pin the map?",
          hi: "पुरातत्त्वविदों को मिला लगभग हर आरंभिक पड़ाव नदी या झील के पास है। उनकी सारी ज़रूरतों में पानी ने ही नक़्शा क्यों जकड़ा?",
          mr: "पुरातत्त्वज्ञांना सापडणारा जवळजवळ प्रत्येक आरंभीचा तळ नदी वा तळ्याजवळ आहे. त्यांच्या साऱ्या गरजांत पाण्यानेच नकाशा का पकडला?",
        },
        choices: [
          {
            en: "Every other need could roam — animals, fruit, stone were sought and followed — but water must be met daily and cannot be carried far, so camps bent to it",
            hi: "बाक़ी हर ज़रूरत घूम सकती थी — जानवर, फल, पत्थर खोजे-पीछा किए जाते — पर पानी रोज़ चाहिए और दूर ढोया नहीं जा सकता, तो पड़ाव उसी की ओर झुके",
            mr: "बाकी प्रत्येक गरज फिरू शकत होती — प्राणी, फळे, दगड शोधले-पाठलाग केले जात — पण पाणी रोज लागते आणि दूर वाहता येत नाही, म्हणून तळ त्याच्याकडे झुकले",
          },
          {
            en: "Rivers were the only flat ground for camping",
            hi: "नदियाँ ही डेरे लायक़ समतल ज़मीन थीं",
            mr: "नद्याच तळ ठोकण्याजोगी सपाट जमीन होत्या",
          },
          {
            en: "They feared forests and kept to the banks",
            hi: "वे वनों से डरते थे और किनारों से लगे रहते थे",
            mr: "ते वनांना घाबरत आणि काठांना धरून राहत",
          },
          {
            en: "Fish was the only food they knew",
            hi: "मछली ही उनका इकलौता ज्ञात भोजन थी",
            mr: "मासा हेच त्यांचे एकमेव ठाऊक अन्न होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Sort their needs by patience: hunger can wait a day, stone keeps forever, but thirst collects daily and water is too heavy to haul without pots. So the one unmovable need anchored everything else — and animals came to drink too, bringing the hunt to the camp. Find the ancient waterline and you have found their address: that is why archaeologists walk the old banks first.",
          hi: "उनकी ज़रूरतों को धीरज से छाँटिए: भूख दिन भर रुक सकती है, पत्थर सदा टिकता है, पर प्यास रोज़ वसूली करती है और बिना बर्तनों के पानी ढोया नहीं जा सकता। तो एक अटल ज़रूरत ने बाक़ी सबको बाँध दिया — और जानवर भी पीने आते थे, शिकार को पड़ाव तक लाते हुए। प्राचीन जल-रेखा खोज लीजिए तो उनका पता मिल गया: इसीलिए पुरातत्त्वविद पहले पुराने किनारे टटोलते हैं।",
          mr: "त्यांच्या गरजा धीराने लावा: भूक दिवसभर थांबू शकते, दगड सदा टिकतो, पण तहान रोज वसुली करते आणि भांड्यांविना पाणी वाहता येत नाही. म्हणून एका अचल गरजेने बाकी साऱ्यांना बांधले — आणि प्राणीही प्यायला येत, शिकार तळापर्यंत आणत. प्राचीन पाणरेषा शोधा की त्यांचा पत्ता मिळाला: म्हणूनच पुरातत्त्वज्ञ आधी जुने काठ धुंडाळतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "These people left no names, no dates, no written word — yet the chapter tells their story with confidence. What does it stand on?",
          hi: "इन लोगों ने न नाम छोड़े, न तिथियाँ, न लिखा एक शब्द — फिर भी अध्याय भरोसे से उनकी कहानी कहता है। वह किस पर टिका है?",
          mr: "या माणसांनी नावे ठेवली नाहीत, तारखा नाहीत, लिहिलेला एक शब्दही नाही — तरी प्रकरण विश्वासाने त्यांची गोष्ट सांगते. ते कशावर उभे आहे?",
        },
        choices: [
          {
            en: "On things — tools, ash, bones and paintings, each read as evidence; where the things fall silent, the story honestly says 'perhaps'",
            hi: "चीज़ों पर — औज़ार, राख, हड्डियाँ और चित्र, हर एक सबूत की तरह पढ़ी हुई; जहाँ चीज़ें चुप हो जाती हैं, वहाँ कहानी ईमानदारी से 'शायद' कहती है",
            mr: "वस्तूंवर — हत्यारे, राख, हाडे आणि चित्रे, प्रत्येक पुरावा म्हणून वाचलेली; जिथे वस्तू गप्प होतात, तिथे गोष्ट प्रामाणिकपणे 'कदाचित' म्हणते",
          },
          {
            en: "On legends handed down from those times",
            hi: "उन्हीं दिनों से चली आई दंतकथाओं पर",
            mr: "त्याच काळापासून चालत आलेल्या दंतकथांवर",
          },
          {
            en: "On guesswork, since nothing at all survives",
            hi: "अटकल पर, क्योंकि कुछ भी नहीं बचा",
            mr: "तर्कावर, कारण काहीच उरले नाही",
          },
          {
            en: "On later kings' court records about them",
            hi: "उनके बारे में बाद के राजाओं के दरबारी लेखों पर",
            mr: "त्यांच्याबद्दलच्या नंतरच्या राजांच्या दरबारी नोंदींवर",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "History without writing is not history without evidence. A tool's shape tells its work; ash tells of fire kept; a painting tells what eyes saw and hands valued. But things answer only some questions — what they ate, where they camped — never a child's name or a night's story. Good history says exactly as much as its evidence carries, and marks the rest 'perhaps': that honesty is the discipline's spine.",
          hi: "बिना लिखत का इतिहास बिना सबूत का इतिहास नहीं है। औज़ार की बनावट उसका काम बताती है; राख रखी गई आग की; चित्र वह जो आँखों ने देखा और हाथों ने सराहा। पर चीज़ें कुछ ही सवालों के उत्तर देती हैं — क्या खाते थे, कहाँ ठहरते थे — किसी बच्चे का नाम या किसी रात का क़िस्सा कभी नहीं। अच्छा इतिहास ठीक उतना कहता है जितना उसका सबूत उठाए, और बाक़ी पर 'शायद' लिखता है: यही ईमानदारी इस विद्या की रीढ़ है।",
          mr: "लिखाणाविनाचा इतिहास पुराव्याविनाचा इतिहास नव्हे. हत्याराचा घाट त्याचे काम सांगतो; राख ठेवलेल्या आगीचे; चित्र डोळ्यांनी पाहिलेले आणि हातांनी मोलाचे मानलेले. पण वस्तू काहीच प्रश्नांची उत्तरे देतात — काय खात, कुठे थांबत — कोणा मुलाचे नाव वा कोणा रात्रीची गोष्ट कधीच नाही. चांगला इतिहास पुरावा पेलतो तितकेच सांगतो, आणि उरल्यावर 'कदाचित' लिहितो: हाच प्रामाणिकपणा या विद्येचा कणा.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — From Gathering to Growing Food                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-6-gathering-to-growing",
    subject: "HISTORY",
    classLevel: 6,
    chapter: {
      en: "Chapter 3 — From Gathering to Growing Food",
      hi: "अध्याय 3 — भोजन: संग्रह से उत्पादन तक",
      mr: "प्रकरण 3 — अन्न: गोळा करण्यापासून पिकवण्यापर्यंत",
    },
    name: {
      en: "From Gathering to Growing Food",
      hi: "भोजन: संग्रह से उत्पादन तक",
      mr: "अन्न: गोळा करण्यापासून पिकवण्यापर्यंत",
    },
    summary: {
      en: "The slow revolution — seeds chosen and sown, sheep and goats tamed, the village that a sown field demands, and the stored grain that invented 'next year'.",
      hi: "धीमी क्रांति — चुने-बोए बीज, सधाई भेड़-बकरियाँ, वह गाँव जो बोया खेत माँगता है, और वह जमा अनाज जिसने 'अगला साल' ईजाद किया।",
      mr: "संथ क्रांती — निवडून पेरलेली बियाणी, माणसाळलेल्या मेंढ्या-शेळ्या, पेरलेले शेत मागते ते गाव, आणि 'पुढचे वर्ष' शोधणारे साठवलेले धान्य.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "domestication",
        name: { en: "Domestication", hi: "पालतू बनाना (पालन)", mr: "माणसाळवणे (पालन)" },
        kind: "change",
        prompt: {
          en: "Keeping the plumpest seeds to sow, raising the gentlest lambs to breed — what is this slow taming of plants and animals called?",
          hi: "सबसे भरे दाने बोने को रखना, सबसे सीधी भेड़ें पालने को चुनना — पौधों और जानवरों की इस धीमी सधाई को क्या कहते हैं?",
          mr: "सर्वांत टपोरे दाणे पेरण्यासाठी ठेवणे, सर्वांत गरीब कोकरे पैदाशीसाठी वाढवणे — वनस्पती आणि प्राण्यांच्या या संथ माणसाळवण्याला काय म्हणतात?",
        },
        statement: {
          en: "Domestication is the slow taming of plants and animals — generation after generation, people kept and bred the most useful, until wild kinds became field and herd kinds.",
          hi: "पालन पौधों और जानवरों की धीमी सधाई है — पीढ़ी-दर-पीढ़ी लोगों ने सबसे काम की क़िस्में रखीं-बढ़ाईं, यहाँ तक कि जंगली क़िस्में खेत और रेवड़ की क़िस्में बन गईं।",
          mr: "पालन म्हणजे वनस्पती-प्राण्यांचे संथ माणसाळवणे — पिढीमागून पिढी माणसांनी सर्वांत उपयोगी जाती ठेवल्या-वाढवल्या, इतक्या की रानटी जाती शेताच्या आणि कळपाच्या जाती झाल्या.",
        },
        detail: {
          en: "It was a two-way bargain — the wheat fed us, and we became the wheat's sowers and guards.",
          hi: "यह दो-तरफ़ा सौदा था — गेहूँ ने हमें खिलाया, और हम गेहूँ के बोने वाले और पहरेदार बन गए।",
          mr: "हा दुतर्फा सौदा होता — गव्हाने आपल्याला पोसले, आणि आपण गव्हाचे पेरणारे आणि राखणदार झालो.",
        },
        extra: {
          en: "It happened not once but in many lands, with many different plants and beasts.",
          hi: "यह एक बार नहीं, कई धरतीयों पर, कई अलग पौधों-पशुओं के साथ हुआ।",
          mr: "हे एकदा नव्हे, अनेक भूमींवर, अनेक वेगळ्या वनस्पती-पशूंसह घडले.",
        },
        pair: {
          left: { en: "Domestication", hi: "पालन", mr: "पालन" },
          right: {
            en: "the wild made field and herd",
            hi: "जंगली से खेत और रेवड़",
            mr: "रानटीचे शेत आणि कळप",
          },
        },
      },
      {
        id: "wheatbarley",
        name: { en: "Wheat and barley", hi: "गेहूँ और जौ", mr: "गहू आणि सातू" },
        kind: "first-tamed",
        prompt: {
          en: "In the northwest, which two grains were among the FIRST that people learnt to sow and harvest?",
          hi: "उत्तर-पश्चिम में कौन-से दो अनाज उन पहलों में थे जिन्हें लोगों ने बोना-काटना सीखा?",
          mr: "वायव्येत कोणती दोन धान्ये माणसे पेरायला-कापायला शिकली त्या पहिल्यांत होती?",
        },
        statement: {
          en: "Wheat and barley were among the first grains grown — sown, guarded and harvested in the northwest long before cities rose.",
          hi: "गेहूँ और जौ सबसे पहले उगाए अनाजों में थे — शहरों के उठने से बहुत पहले उत्तर-पश्चिम में बोए, रखवाए और काटे गए।",
          mr: "गहू आणि सातू पहिल्या पिकवलेल्या धान्यांत होते — शहरे उभी राहण्याच्या खूप आधी वायव्येत पेरलेली, राखलेली आणि कापलेली.",
        },
        pair: {
          left: { en: "Wheat and barley", hi: "गेहूँ और जौ", mr: "गहू आणि सातू" },
          right: { en: "the first sown grains", hi: "पहले बोए अनाज", mr: "पहिली पेरलेली धान्ये" },
        },
      },
      {
        id: "sheepgoats",
        name: { en: "Sheep and goats", hi: "भेड़ और बकरियाँ", mr: "मेंढ्या आणि शेळ्या" },
        kind: "first-tamed",
        prompt: {
          en: "Which two gentle grazers became the first herds — walking stores of milk, meat, wool and dung?",
          hi: "कौन-से दो सीधे चरने वाले पहले रेवड़ बने — दूध, माँस, ऊन और गोबर के चलते-फिरते भंडार?",
          mr: "कोणते दोन गरीब चरणारे पहिले कळप झाले — दूध, मांस, लोकर आणि शेणाची चालती-फिरती कोठारे?",
        },
        statement: {
          en: "Sheep and goats were among the first herded animals — living larders that walked with their keepers and multiplied on grass.",
          hi: "भेड़-बकरियाँ पहले पाले गए जानवरों में थीं — जीते भंडार जो रखवालों संग चलते और घास पर बढ़ते जाते।",
          mr: "मेंढ्या-शेळ्या पहिल्या पाळलेल्या प्राण्यांत होत्या — राखणाऱ्यांसोबत चालणारी आणि गवतावर वाढणारी जिती कोठारे.",
        },
        pair: {
          left: { en: "Sheep and goats", hi: "भेड़-बकरियाँ", mr: "मेंढ्या-शेळ्या" },
          right: {
            en: "larders that walk and multiply",
            hi: "चलते-बढ़ते भंडार",
            mr: "चालणारी-वाढणारी कोठारे",
          },
        },
      },
      {
        id: "settledvillage",
        name: { en: "The settled village", hi: "बसा हुआ गाँव", mr: "वसलेले गाव" },
        kind: "change",
        prompt: {
          en: "A sown field cannot be abandoned — it must be watered, weeded, guarded, and its harvest awaited for months. What did this waiting force people to build?",
          hi: "बोया खेत छोड़ा नहीं जा सकता — उसे सींचना, निराना, रखवाना है, और महीनों फ़सल की बाट जोहनी है। इस प्रतीक्षा ने लोगों से क्या बनवाया?",
          mr: "पेरलेले शेत सोडता येत नाही — त्याला पाणी, खुरपणी, राखण हवी, आणि महिनोंमहिने कापणीची वाट पाहायची. या वाट पाहण्याने माणसांकडून काय बांधून घेतले?",
        },
        statement: {
          en: "Farming forced the settled village into being — a sown field chains its sowers to one place, so huts, hearths and neighbours grew up around the wait.",
          hi: "खेती ने बसे गाँव को जन्म दिया — बोया खेत बोने वालों को एक जगह बाँध देता है, तो प्रतीक्षा के गिर्द झोंपड़ियाँ, चूल्हे और पड़ोसी उग आए।",
          mr: "शेतीने वसलेल्या गावाला जन्म दिला — पेरलेले शेत पेरणाऱ्यांना एका जागी बांधते, म्हणून वाट पाहण्याभोवती झोपड्या, चुली आणि शेजारी उगवले.",
        },
        pair: {
          left: { en: "The settled village", hi: "बसा गाँव", mr: "वसलेले गाव" },
          right: {
            en: "built around the harvest's wait",
            hi: "फ़सल की बाट के गिर्द बसा",
            mr: "कापणीच्या प्रतीक्षेभोवती वसलेले",
          },
        },
      },
      {
        id: "storage",
        name: { en: "The stored grain", hi: "जमा अनाज", mr: "साठवलेले धान्य" },
        kind: "change",
        prompt: {
          en: "Clay pots, woven baskets, pits dug into hut floors — what were the first farmers keeping so carefully for the lean months and the next sowing?",
          hi: "मिट्टी के बर्तन, बुनी टोकरियाँ, झोंपड़ी के फ़र्श में खुदे गड्ढे — पहले किसान क्या इतनी हिफ़ाज़त से रखते थे, दुबले महीनों और अगली बुआई के लिए?",
          mr: "मातीची भांडी, विणलेल्या टोपल्या, झोपडीच्या फरशीत खणलेले खड्डे — पहिले शेतकरी काय इतक्या जपून ठेवत, तुटीच्या महिन्यांसाठी आणि पुढच्या पेरणीसाठी?",
        },
        statement: {
          en: "Stored grain was the first wealth — kept in pots, baskets and floor-pits, it fed the lean months and, above all, held next year's seed.",
          hi: "जमा अनाज पहली संपत्ति था — बर्तनों, टोकरियों और फ़र्श-गड्ढों में रखा, वह दुबले महीने खिलाता और सबसे बढ़कर अगले साल का बीज थामे रहता।",
          mr: "साठवलेले धान्य ही पहिली संपत्ती — भांडी, टोपल्या आणि फरशी-खड्ड्यांत ठेवलेले, ते तुटीचे महिने पोसे आणि सर्वांत महत्त्वाचे, पुढच्या वर्षाचे बियाणे धरून ठेवी.",
        },
        detail: {
          en: "Eating the seed-grain meant hunger NEXT year — storage taught people to plan beyond the season.",
          hi: "बीज वाला अनाज खा लेना यानी अगले साल की भूख — भंडारण ने लोगों को मौसम के पार सोचना सिखाया।",
          mr: "बियाण्याचे धान्य खाणे म्हणजे पुढच्या वर्षीची भूक — साठवणीने माणसांना हंगामापलीकडे विचार करायला शिकवले.",
        },
        extra: {
          en: "A full store also needed guarding — and things worth guarding change how people live together.",
          hi: "भरा भंडार रखवाली भी माँगता था — और रखवाली लायक़ चीज़ें लोगों का साथ रहना बदल देती हैं।",
          mr: "भरलेले कोठार राखणही मागे — आणि राखण्याजोग्या गोष्टी माणसांचे एकत्र जगणे बदलतात.",
        },
        pair: {
          left: { en: "The stored grain", hi: "जमा अनाज", mr: "साठवलेले धान्य" },
          right: {
            en: "next year, kept in a pot",
            hi: "बर्तन में रखा अगला साल",
            mr: "भांड्यात ठेवलेले पुढचे वर्ष",
          },
        },
      },
      {
        id: "mehrgarh",
        name: { en: "Mehrgarh", hi: "मेहरगढ़", mr: "मेहरगड" },
        kind: "place",
        prompt: {
          en: "Near the Bolan Pass lies one of the OLDEST farming villages found — barley fields, mud houses, and burials with goats laid beside the dead. Which site is this?",
          hi: "बोलन दर्रे के पास मिला सबसे पुराने कृषि-गाँवों में से एक — जौ के खेत, मिट्टी के घर, और मृतकों के पास लिटाई बकरियों वाली क़ब्रें। यह कौन-सा स्थल है?",
          mr: "बोलन खिंडीजवळ सापडलेले सर्वांत जुन्या शेती-गावांपैकी एक — सातूची शेते, मातीची घरे, आणि मृतांशेजारी ठेवलेल्या शेळ्यांची दफने. हे कोणते स्थळ?",
        },
        statement: {
          en: "Mehrgarh, near the Bolan Pass, is among the oldest farming villages known — mud houses, barley, and graves where goats were buried beside people.",
          hi: "बोलन दर्रे के पास का मेहरगढ़ ज्ञात सबसे पुराने कृषि-गाँवों में है — मिट्टी के घर, जौ, और वे क़ब्रें जहाँ लोगों के पास बकरियाँ दफ़नाई गईं।",
          mr: "बोलन खिंडीजवळचे मेहरगड ज्ञात सर्वांत जुन्या शेती-गावांपैकी — मातीची घरे, सातू, आणि माणसांशेजारी शेळ्या पुरलेली दफने.",
        },
        pair: {
          left: { en: "Mehrgarh", hi: "मेहरगढ़", mr: "मेहरगड" },
          right: {
            en: "one of the first farm villages",
            hi: "पहले कृषि-गाँवों में एक",
            mr: "पहिल्या शेती-गावांपैकी एक",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put the slow revolution in order: grain stored in pits for next year; wild plants gathered wherever found; chosen seeds sown and the field awaited. Which order is right?",
          hi: "धीमी क्रांति को क्रम में रखिए: अगले साल के लिए गड्ढों में जमा अनाज; जहाँ मिलें वहाँ बटोरे जंगली पौधे; चुने बीज बोए गए और खेत की बाट जोही गई। कौन-सा क्रम सही है?",
          mr: "संथ क्रांती क्रमाने लावा: पुढच्या वर्षासाठी खड्ड्यांत साठवलेले धान्य; मिळतील तिथे गोळा केलेल्या रानटी वनस्पती; निवडक बियाणे पेरले आणि शेताची वाट पाहिली. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "gathering the wild → sowing chosen seed → storing for next year",
            hi: "जंगली बटोरना → चुना बीज बोना → अगले साल के लिए जमा करना",
            mr: "रानटी गोळा करणे → निवडक बियाणे पेरणे → पुढच्या वर्षासाठी साठवणे",
          },
          {
            en: "storing for next year → gathering the wild → sowing chosen seed",
            hi: "जमा करना → जंगली बटोरना → चुना बीज बोना",
            mr: "साठवणे → रानटी गोळा करणे → निवडक बियाणे पेरणे",
          },
          {
            en: "sowing chosen seed → storing → gathering the wild",
            hi: "चुना बीज बोना → जमा करना → जंगली बटोरना",
            mr: "निवडक बियाणे पेरणे → साठवणे → रानटी गोळा करणे",
          },
          {
            en: "gathering the wild → storing → sowing chosen seed",
            hi: "जंगली बटोरना → जमा करना → चुना बीज बोना",
            mr: "रानटी गोळा करणे → साठवणे → निवडक बियाणे पेरणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each step makes the next one possible: gatherers learnt which plants fed them, sowing turned that knowledge into fields, and only a HARVEST gives anything worth storing. The order is not just time — it is cause: no stores without sowing, no sowing without the gatherers' long schooling in plants.",
          hi: "हर क़दम अगले को मुमकिन करता है: बटोरने वालों ने जाना कौन-से पौधे खिलाते हैं, बुआई ने उस ज्ञान को खेत बनाया, और जमा करने लायक़ कुछ फ़सल ही देती है। क्रम केवल समय नहीं — कारण है: बिना बुआई भंडार नहीं, बिना बटोरने वालों की लंबी पौध-पाठशाला के बुआई नहीं।",
          mr: "प्रत्येक पाऊल पुढचे शक्य करते: गोळा करणाऱ्यांनी कोणत्या वनस्पती पोसतात ते जाणले, पेरणीने ते ज्ञान शेत केले, आणि साठवण्याजोगे काही कापणीच देते. क्रम फक्त काळ नव्हे — कारण आहे: पेरणीविना साठा नाही, गोळाकऱ्यांच्या दीर्घ वनस्पती-शाळेविना पेरणी नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A gatherer could walk away from a bad valley tomorrow; a farmer who has sown cannot leave for months. Why did people accept this new chain?",
          hi: "बटोरने वाला बुरी घाटी कल ही छोड़ सकता था; बो चुका किसान महीनों नहीं जा सकता। लोगों ने यह नई ज़ंजीर क्यों क़बूल की?",
          mr: "गोळाकरी वाईट खोरे उद्याच सोडू शकत असे; पेरलेला शेतकरी महिनोंमहिने जाऊ शकत नाही. माणसांनी ही नवी साखळी का पत्करली?",
        },
        choices: [
          {
            en: "Because the chained field paid — one harvest outfed a season of wandering, and stored grain promised through winters that gathering could not",
            hi: "क्योंकि बँधा खेत फलता था — एक फ़सल भटकन के मौसम भर से ज़्यादा खिलाती थी, और जमा अनाज उन सर्दियों के पार वादा करता था जिन्हें बटोरना नहीं कर सकता था",
            mr: "कारण बांधलेले शेत फळत होते — एक कापणी भटकंतीच्या हंगामाहून जास्त पोसे, आणि साठवलेले धान्य गोळा करण्याला न जमणाऱ्या हिवाळ्यांपार वचन देई",
          },
          {
            en: "Kings ordered everyone to settle and farm",
            hi: "राजाओं ने सबको बसने-खेती करने का आदेश दिया",
            mr: "राजांनी साऱ्यांना वसण्या-शेतीची आज्ञा दिली",
          },
          {
            en: "The wild lands had all burnt away",
            hi: "जंगली धरती सब जल चुकी थी",
            mr: "रानटी भूमी सारी जळून गेली होती",
          },
          {
            en: "They no longer knew how to gather",
            hi: "उन्हें बटोरना आता ही नहीं रहा था",
            mr: "त्यांना गोळा करणे येईनासेच झाले होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Nobody chose the chain; they chose the yield, and the chain came with it. A sown field concentrates a valley's worth of food into one guarded patch — but only for those who stay to tend it. So freedom of foot was traded for fullness of store, one family at a time, until the trade had quietly remade the world. Most revolutions in this book will look like that: a bargain, not a battle.",
          hi: "किसी ने ज़ंजीर नहीं चुनी; उन्होंने उपज चुनी, और ज़ंजीर उसके साथ आई। बोया खेत घाटी भर का भोजन एक रखवाए टुकड़े में समेट देता है — पर केवल उनके लिए जो सँभालने को रुकें। तो पाँव की आज़ादी भंडार की भराई से बदली गई, एक-एक परिवार करके, यहाँ तक कि सौदे ने चुपचाप दुनिया गढ़ दी। इस किताब की ज़्यादातर क्रांतियाँ ऐसी ही दिखेंगी: सौदा, युद्ध नहीं।",
          mr: "कोणीही साखळी निवडली नाही; त्यांनी उतारा निवडला, आणि साखळी त्याच्यासोबत आली. पेरलेले शेत खोऱ्याएवढे अन्न एका राखलेल्या तुकड्यात एकवटते — पण फक्त निगा राखायला थांबणाऱ्यांसाठी. म्हणून पावलांचे स्वातंत्र्य कोठाराच्या भरावाशी बदलले गेले, एकेक कुटुंब करत, इतके की सौद्याने गुपचूप जग घडवले. या पुस्तकातल्या बहुतेक क्रांत्या अशाच दिसतील: सौदा, लढाई नव्हे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "At Mehrgarh, some people were buried with goats laid beside them. What might this practice tell us — and why 'might'?",
          hi: "मेहरगढ़ में कुछ लोगों के पास बकरियाँ लिटाकर दफ़नाई गईं। यह रिवाज़ हमें क्या बता सकता है — और 'सकता है' क्यों?",
          mr: "मेहरगडात काही माणसांशेजारी शेळ्या ठेवून दफन केले गेले. ही रीत आपल्याला काय सांगू शकते — आणि 'शकते' का?",
        },
        choices: [
          {
            en: "Perhaps they believed the dead journeyed on and would need food — but belief leaves no bones, so the goat is evidence and the 'why' stays a careful guess",
            hi: "शायद वे मानते थे कि मृतक आगे यात्रा करते हैं और उन्हें भोजन चाहिए होगा — पर मान्यता हड्डियाँ नहीं छोड़ती, तो बकरी सबूत है और 'क्यों' सधा अनुमान",
            mr: "कदाचित त्यांचा विश्वास होता की मृत पुढे प्रवास करतात आणि त्यांना अन्न लागेल — पण श्रद्धा हाडे ठेवत नाही, म्हणून शेळी पुरावा आहे आणि 'का' हा जपून केलेला तर्क",
          },
          {
            en: "It proves exactly what they believed about death",
            hi: "यह ठीक-ठीक साबित करता है कि वे मृत्यु के बारे में क्या मानते थे",
            mr: "हे नेमके सिद्ध करते की ते मृत्यूबद्दल काय मानत",
          },
          {
            en: "It shows goats were worthless and thrown away",
            hi: "यह दिखाता है कि बकरियाँ बेकार थीं और फेंकी जाती थीं",
            mr: "हे दाखवते की शेळ्या कवडीमोल होत्या आणि फेकल्या जात",
          },
          {
            en: "It tells nothing at all",
            hi: "यह कुछ भी नहीं बताता",
            mr: "हे काहीच सांगत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The goat in the grave is hard fact; the reason it was placed there died with the mourners. Giving up a WHOLE goat — real wealth in a herding village — suggests the living thought the dead still needed providing for; that points toward belief in some journey after death. But objects show actions, never thoughts, so the historian writes 'perhaps' — and that small word is the difference between history and storytelling.",
          hi: "क़ब्र की बकरी पक्का तथ्य है; उसे रखने की वजह शोक करने वालों के साथ चली गई। पूरी बकरी छोड़ना — चरवाहा गाँव की सच्ची संपत्ति — इशारा करता है कि जीवित मानते थे कि मृतक को अब भी इंतज़ाम चाहिए; यह मृत्यु के बाद किसी यात्रा की मान्यता की ओर संकेत है। पर चीज़ें काम दिखाती हैं, विचार कभी नहीं, इसलिए इतिहासकार 'शायद' लिखता है — और वही छोटा शब्द इतिहास और क़िस्सागोई का फ़र्क़ है।",
          mr: "दफनातली शेळी हे पक्के तथ्य; ती ठेवण्याचे कारण शोक करणाऱ्यांसोबत गेले. अख्खी शेळी सोडणे — पशुपालक गावाची खरी संपत्ती — सुचवते की जिवंतांना वाटे मृताला अजून तरतूद हवी; हे मृत्यूनंतरच्या कोणत्या प्रवासाच्या श्रद्धेकडे बोट दाखवते. पण वस्तू कृती दाखवतात, विचार कधीच नाही, म्हणून इतिहासकार 'कदाचित' लिहितो — आणि तोच लहान शब्द इतिहास आणि गोष्ट सांगणे यांतला फरक.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — In the Earliest Cities                                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-6-earliest-cities",
    subject: "HISTORY",
    classLevel: 6,
    chapter: {
      en: "Chapter 4 — In the Earliest Cities",
      hi: "अध्याय 4 — आरंभिक नगर",
      mr: "प्रकरण 4 — आरंभीची नगरे",
    },
    name: { en: "In the Earliest Cities", hi: "आरंभिक नगर", mr: "आरंभीची नगरे" },
    summary: {
      en: "Harappa and its sister cities — streets planned before houses, drains under every lane, the watertight Great Bath, and seals whose script no one alive can read.",
      hi: "हड़प्पा और उसके सहोदर नगर — घरों से पहले नियोजित सड़कें, हर गली तले नालियाँ, जलरोधी विशाल स्नानागार, और वे मुहरें जिनकी लिपि आज कोई जीवित नहीं पढ़ सकता।",
      mr: "हडप्पा आणि त्याची भावंड-नगरे — घरांआधी आखलेले रस्ते, प्रत्येक गल्लीखाली गटारे, जलरोधक महास्नानगृह, आणि जिची लिपी आज कोणी जिवंत वाचू शकत नाही अशा मुद्रा.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "harappa",
        name: { en: "Harappa", hi: "हड़प्पा", mr: "हडप्पा" },
        kind: "place",
        prompt: {
          en: "The FIRST of these ancient cities to be dug up gave its name to the whole civilisation. Which city is it?",
          hi: "इन प्राचीन नगरों में सबसे पहले खोदे गए नगर ने पूरी सभ्यता को अपना नाम दिया। वह कौन-सा नगर है?",
          mr: "या प्राचीन नगरांत सर्वांत आधी उकरलेल्या नगराने साऱ्या संस्कृतीला आपले नाव दिले. ते कोणते नगर?",
        },
        statement: {
          en: "Harappa was the first of these cities found — so the whole civilisation of brick cities is called Harappan after it.",
          hi: "हड़प्पा इन नगरों में सबसे पहले मिला — इसीलिए ईंट-नगरों की पूरी सभ्यता उसके नाम पर हड़प्पाई कहलाती है।",
          mr: "हडप्पा या नगरांत सर्वांत आधी सापडले — म्हणून विटांच्या नगरांची सारी संस्कृती त्याच्या नावाने हडप्पा संस्कृती म्हटली जाते.",
        },
        pair: {
          left: { en: "Harappa", hi: "हड़प्पा", mr: "हडप्पा" },
          right: {
            en: "first found, named it all",
            hi: "पहले मिला, सबका नाम बना",
            mr: "आधी सापडले, साऱ्यांचे नाव झाले",
          },
        },
      },
      {
        id: "plannedstreets",
        name: { en: "The planned streets", hi: "नियोजित सड़कें", mr: "आखलेले रस्ते" },
        kind: "city-feature",
        prompt: {
          en: "The lanes of these cities cross straight, at right angles, in a tidy grid — laid out BEFORE the houses rose. What does this feature reveal?",
          hi: "इन नगरों की गलियाँ सीधी, समकोण पर, सुथरे जाल में कटती हैं — घरों के उठने से पहले बिछाई हुईं। यह विशेषता क्या है?",
          mr: "या नगरांच्या गल्ल्या सरळ, काटकोनात, नीटनेटक्या जाळीत छेदतात — घरे उभी राहण्याआधी आखलेल्या. हे वैशिष्ट्य कोणते?",
        },
        statement: {
          en: "The streets were planned first and the houses fitted after — a grid of right angles that no city grows by accident.",
          hi: "सड़कें पहले नियोजित हुईं और घर बाद में बिठाए गए — समकोणों का ऐसा जाल जो कोई नगर संयोग से नहीं पाता।",
          mr: "रस्ते आधी आखले गेले आणि घरे नंतर बसवली — काटकोनांची अशी जाळी जी कोणतेही नगर योगायोगाने मिळवत नाही.",
        },
        detail: {
          en: "A grid needs a plan, and a plan needs someone with the power to make everyone follow it.",
          hi: "जाल को योजना चाहिए, और योजना को कोई ऐसा जिसके पास सबसे उसे मनवाने की ताक़त हो।",
          mr: "जाळीला आराखडा हवा, आणि आराखड्याला साऱ्यांकडून तो पाळून घेण्याची ताकद असलेले कोणी हवे.",
        },
        extra: {
          en: "Even the bricks agree — one standard shape across cities hundreds of kilometres apart.",
          hi: "ईंटें तक सहमत हैं — सैकड़ों किलोमीटर दूर नगरों में एक ही मानक साँचा।",
          mr: "विटासुद्धा सहमत — शेकडो किलोमीटर दूरच्या नगरांत एकच प्रमाण साचा.",
        },
        pair: {
          left: { en: "The planned streets", hi: "नियोजित सड़कें", mr: "आखलेले रस्ते" },
          right: {
            en: "a grid drawn before houses",
            hi: "घरों से पहले खिंचा जाल",
            mr: "घरांआधी आखलेली जाळी",
          },
        },
      },
      {
        id: "drains",
        name: { en: "The covered drains", hi: "ढकी नालियाँ", mr: "झाकलेली गटारे" },
        kind: "city-feature",
        prompt: {
          en: "Under every lane ran brick-lined channels, covered with slabs, joined house by house, with holes left for cleaning. What were these?",
          hi: "हर गली तले ईंट-जड़ी नालियाँ चलती थीं, पटियों से ढकीं, घर-दर-घर जुड़ीं, सफ़ाई के लिए छेद छोड़े हुए। ये क्या थीं?",
          mr: "प्रत्येक गल्लीखाली विटांनी बांधलेली, फरशांनी झाकलेली, घरोघर जोडलेली, सफाईसाठी झरोके ठेवलेली पाट वाहत. ही काय होती?",
        },
        statement: {
          en: "The covered drains carried every house's waste water under the streets — built with the lanes, inspected through openings, four thousand years before most cities matched them.",
          hi: "ढकी नालियाँ हर घर का गंदा पानी सड़कों तले ले जाती थीं — गलियों के साथ बनीं, झरोखों से जाँची जातीं, ज़्यादातर नगरों की बराबरी से चार हज़ार साल पहले।",
          mr: "झाकलेली गटारे प्रत्येक घराचे सांडपाणी रस्त्यांखालून नेत — गल्ल्यांसोबत बांधलेली, झरोक्यांतून तपासलेली, बहुतेक नगरे बरोबरी करण्याच्या चार हजार वर्षे आधी.",
        },
        pair: {
          left: { en: "The covered drains", hi: "ढकी नालियाँ", mr: "झाकलेली गटारे" },
          right: {
            en: "waste water led under the lanes",
            hi: "गलियों तले उतारा गंदा पानी",
            mr: "गल्ल्यांखालून नेलेले सांडपाणी",
          },
        },
      },
      {
        id: "greatbath",
        name: { en: "The Great Bath", hi: "विशाल स्नानागार", mr: "महास्नानगृह" },
        kind: "city-feature",
        prompt: {
          en: "In Mohenjodaro's high town sits a large tank of tight-fitted brick, sealed with tar, steps leading down at both ends. Which famous structure is this?",
          hi: "मोहनजोदड़ो के ऊँचे नगर में कसी-जड़ी ईंटों का बड़ा कुंड है, डामर से जड़ा, दोनों सिरों पर उतरती सीढ़ियाँ। यह प्रसिद्ध रचना कौन-सी है?",
          mr: "मोहेंजोदडोच्या उंच नगरात घट्ट बसवलेल्या विटांचे मोठे कुंड आहे, डांबराने बंद केलेले, दोन्ही टोकांना उतरणाऱ्या पायऱ्या. ही प्रसिद्ध रचना कोणती?",
        },
        statement: {
          en: "The Great Bath is Mohenjodaro's watertight tank — tar-sealed brick, stepped at both ends, most likely for special baths on special occasions.",
          hi: "विशाल स्नानागार मोहनजोदड़ो का जलरोधी कुंड है — डामर-जड़ी ईंटें, दोनों सिरों पर सीढ़ियाँ, संभवतः ख़ास अवसरों के ख़ास स्नान के लिए।",
          mr: "महास्नानगृह हे मोहेंजोदडोचे जलरोधक कुंड — डांबर-बंद विटा, दोन्ही टोकांना पायऱ्या, बहुधा खास प्रसंगींच्या खास स्नानांसाठी.",
        },
        detail: {
          en: "Ordinary houses had their own bathing floors — this tank was something apart, built with the city's best work.",
          hi: "आम घरों के अपने स्नान-फ़र्श थे — यह कुंड कुछ अलग था, नगर की सबसे अच्छी कारीगरी से बना।",
          mr: "सामान्य घरांना स्वतःच्या स्नान-फरश्या होत्या — हे कुंड काही वेगळे होते, नगराच्या उत्तम कारागिरीने बांधलेले.",
        },
        extra: {
          en: "What exactly happened there, no text survives to say — the tank keeps its ceremony secret.",
          hi: "वहाँ ठीक क्या होता था, बताने को कोई लेख नहीं बचा — कुंड अपना अनुष्ठान गुप्त रखे है।",
          mr: "तिथे नेमके काय घडे, सांगायला कोणताही लेख उरला नाही — कुंड आपला विधी गुप्त ठेवते.",
        },
        pair: {
          left: { en: "The Great Bath", hi: "विशाल स्नानागार", mr: "महास्नानगृह" },
          right: {
            en: "the watertight tank of ceremonies",
            hi: "अनुष्ठानों का जलरोधी कुंड",
            mr: "विधींचे जलरोधक कुंड",
          },
        },
      },
      {
        id: "seals",
        name: { en: "The seals", hi: "मुहरें", mr: "मुद्रा" },
        kind: "thing",
        prompt: {
          en: "Small carved stones show a bull, an elephant, a rhino — and above each, a line of signs no scholar has ever read. What are these objects?",
          hi: "छोटे तराशे पत्थरों पर बैल, हाथी, गैंडा — और हर एक के ऊपर चिह्नों की वह पंक्ति जो कोई विद्वान कभी नहीं पढ़ पाया। ये वस्तुएँ क्या हैं?",
          mr: "लहान कोरीव दगडांवर बैल, हत्ती, गेंडा — आणि प्रत्येकाच्या वर चिन्हांची अशी ओळ जी कोणी विद्वान कधीही वाचू शकला नाही. या वस्तू काय आहेत?",
        },
        statement: {
          en: "The seals are small carved stones — an animal below, signs above — probably pressed on clay to stamp sealed goods; their script remains unread to this day.",
          hi: "मुहरें छोटे तराशे पत्थर हैं — नीचे पशु, ऊपर चिह्न — संभवतः बँधे माल पर ठप्पा लगाने को मिट्टी पर दबाई जातीं; उनकी लिपि आज तक अपठित है।",
          mr: "मुद्रा म्हणजे लहान कोरीव दगड — खाली पशू, वर चिन्हे — बहुधा बांधलेल्या मालावर शिक्का म्हणून मातीवर दाबल्या जात; त्यांची लिपी आजतागायत न वाचलेली आहे.",
        },
        pair: {
          left: { en: "The seals", hi: "मुहरें", mr: "मुद्रा" },
          right: {
            en: "stamps in an unread script",
            hi: "अपठित लिपि के ठप्पे",
            mr: "न वाचलेल्या लिपीचे शिक्के",
          },
        },
      },
      {
        id: "cotton",
        name: { en: "The woven cotton", hi: "बुना कपास", mr: "विणलेला कापूस" },
        kind: "thing",
        prompt: {
          en: "Scraps of cloth on a silver jar, spindle whorls in the houses — which crop were these city people among the FIRST in the world to grow and weave?",
          hi: "चाँदी के बर्तन पर कपड़े की कतरनें, घरों में तकुए की फिरकियाँ — कौन-सी फ़सल उगाने-बुनने वालों में ये नगरवासी दुनिया के पहले लोगों में थे?",
          mr: "चांदीच्या भांड्यावर कापडाचे तुकडे, घरांत चात्यांची चक्रे — कोणते पीक पिकवण्या-विणण्यात ही नगरवासी जगातल्या पहिल्यांत होती?",
        },
        statement: {
          en: "Cotton was grown and woven here among the earliest anywhere — cloth scraps and spindle whorls survive to prove the looms.",
          hi: "कपास यहाँ दुनिया में सबसे पहले उगाने-बुनने वालों में उगा — करघों के सबूत में कपड़े की कतरनें और फिरकियाँ बची हैं।",
          mr: "कापूस इथे जगात सर्वांत आधी पिकवणाऱ्या-विणणाऱ्यांत पिकला — मागांच्या पुराव्यात कापडाचे तुकडे आणि चात्यांची चक्रे उरली आहेत.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the find to what it tells about the city: A-the grid of straight lanes, B-the covered drains, C-the unread seals. Which trio is right?",
          hi: "खोज को नगर की उसकी गवाही से मिलाइए: अ-सीधी गलियों का जाल, ब-ढकी नालियाँ, स-अपठित मुहरें। कौन-सी तिकड़ी सही है?",
          mr: "सापड नगराबद्दलच्या तिच्या साक्षीशी जुळवा: अ-सरळ गल्ल्यांची जाळी, ब-झाकलेली गटारे, क-न वाचलेल्या मुद्रा. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: someone planned before building · B: the city cared for cleanliness · C: goods were stamped and traded",
            hi: "अ: बनाने से पहले किसी ने योजना बनाई · ब: नगर को सफ़ाई की परवाह थी · स: माल पर ठप्पे लगते और व्यापार होता",
            mr: "अ: बांधण्याआधी कोणी आखणी केली · ब: नगराला स्वच्छतेची काळजी होती · क: मालावर शिक्के लागत आणि व्यापार होई",
          },
          {
            en: "A: goods were traded · B: someone planned · C: cleanliness mattered",
            hi: "अ: व्यापार होता · ब: किसी ने योजना बनाई · स: सफ़ाई मायने रखती थी",
            mr: "अ: व्यापार होई · ब: कोणी आखणी केली · क: स्वच्छता महत्त्वाची",
          },
          {
            en: "A: cleanliness mattered · B: goods were traded · C: someone planned",
            hi: "अ: सफ़ाई मायने रखती थी · ब: व्यापार होता · स: किसी ने योजना बनाई",
            mr: "अ: स्वच्छता महत्त्वाची · ब: व्यापार होई · क: कोणी आखणी केली",
          },
          {
            en: "A: someone planned · B: goods were traded · C: cleanliness mattered",
            hi: "अ: किसी ने योजना बनाई · ब: व्यापार होता · स: सफ़ाई मायने रखती थी",
            mr: "अ: कोणी आखणी केली · ब: व्यापार होई · क: स्वच्छता महत्त्वाची",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each find is a sentence about the city: a grid says planning came before bricks; drains under every lane say waste was everyone's business, organised; seals say goods travelled with an owner's mark. Cities that wrote in an unread script still speak plainly — through what they built.",
          hi: "हर खोज नगर के बारे में एक वाक्य है: जाल कहता है ईंटों से पहले योजना आई; हर गली तले नालियाँ कहती हैं गंदगी सबका, सधा हुआ मामला थी; मुहरें कहती हैं माल मालिक के निशान संग चलता था। अपठित लिपि में लिखने वाले नगर भी साफ़ बोलते हैं — अपने बनाए से।",
          mr: "प्रत्येक सापड म्हणजे नगराबद्दलचे एक वाक्य: जाळी सांगते विटांआधी आखणी आली; प्रत्येक गल्लीखालची गटारे सांगतात घाण ही साऱ्यांची, शिस्तीची बाब होती; मुद्रा सांगतात माल मालकाच्या खुणेसह प्रवास करी. न वाचलेल्या लिपीत लिहिणारी नगरेही स्पष्ट बोलतात — आपल्या बांधलेल्यांतून.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Straight lanes crossing at right angles, laid before a single house rose, with one brick-shape across distant cities. What must have existed that no spade can dig up?",
          hi: "समकोण पर कटती सीधी गलियाँ, एक भी घर उठने से पहले बिछीं, दूर-दूर के नगरों में एक ही ईंट-साँचा। ऐसा क्या रहा होगा जिसे कोई कुदाल खोद नहीं सकती?",
          mr: "काटकोनात छेदणाऱ्या सरळ गल्ल्या, एकही घर उभे राहण्याआधी आखलेल्या, दूरदूरच्या नगरांत एकच वीट-साचा. असे काय असले पाहिजे जे कोणतीही कुदळ उकरू शकत नाही?",
        },
        choices: [
          {
            en: "Organisation — someone who could plan, measure, standardise and make thousands follow; the grid is that unseen authority's only surviving portrait",
            hi: "व्यवस्था — कोई जो योजना बना सके, नाप सके, मानक तय कर सके और हज़ारों से पालन करवा सके; जाल उसी अनदेखी सत्ता की इकलौती बची तस्वीर है",
            mr: "व्यवस्था — कोणी जो आखू शके, मोजू शके, प्रमाण ठरवू शके आणि हजारोंकडून पाळून घेऊ शके; जाळी हेच त्या न दिसणाऱ्या सत्तेचे एकुलते उरलेले चित्र",
          },
          {
            en: "Nothing — straight streets happen by habit",
            hi: "कुछ नहीं — सीधी सड़कें आदत से बन जाती हैं",
            mr: "काहीच नाही — सरळ रस्ते सवयीने होतात",
          },
          {
            en: "Modern machines, later lost",
            hi: "आधुनिक मशीनें, जो बाद में खो गईं",
            mr: "आधुनिक यंत्रे, नंतर हरवलेली",
          },
          {
            en: "A single builder who made every city alone",
            hi: "एक अकेला कारीगर जिसने हर नगर अकेले बनाया",
            mr: "प्रत्येक नगर एकट्याने बांधणारा एकच कारागीर",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Villages grow lane by crooked lane, each family building as it pleases; a grid exists only if a plan came FIRST and everyone obeyed it. Add one brick-shape across cities weeks of travel apart, and the conclusion firms: rules, measurers, enforcers — organisation. We cannot dig up a ruler or a law; but every straight street is their fingerprint. Reasoning from remains to the invisible is archaeology's deepest trick.",
          hi: "गाँव टेढ़ी-मेढ़ी गली-दर-गली बढ़ते हैं, हर परिवार मनमाना बनाता; जाल तभी होता है जब योजना पहले आए और सब मानें। इसमें हफ़्तों की दूरी के नगरों का एक ईंट-साँचा जोड़िए, तो नतीजा पक्का होता है: नियम, नापने वाले, मनवाने वाले — व्यवस्था। हम शासक या क़ानून नहीं खोद सकते; पर हर सीधी सड़क उनकी उँगलियों की छाप है। अवशेषों से अदृश्य तक पहुँचना पुरातत्त्व की सबसे गहरी कला है।",
          mr: "गावे वेड्यावाकड्या गल्लीगल्लीने वाढतात, प्रत्येक कुटुंब मनमानेल तसे बांधते; जाळी तेव्हाच होते जेव्हा आराखडा आधी येतो आणि सारे पाळतात. त्यात आठवड्यांच्या अंतरावरच्या नगरांचा एक वीट-साचा जोडा, की निष्कर्ष पक्का: नियम, मोजणारे, पाळून घेणारे — व्यवस्था. आपण शासक वा कायदा उकरू शकत नाही; पण प्रत्येक सरळ रस्ता त्यांच्या बोटांचा ठसा आहे. अवशेषांतून अदृश्यापर्यंत पोहोचणे ही पुरातत्त्वाची सर्वांत खोल कला.",
        },
      },
      {
        level: 6,
        stem: {
          en: "We know what Harappans built, wove and traded — yet not one ruler's name, one god's story, one law. What single loss explains this strange half-knowledge?",
          hi: "हम जानते हैं हड़प्पाई क्या बनाते, बुनते, बेचते थे — पर एक भी शासक का नाम, एक देवता की कथा, एक क़ानून नहीं। कौन-सी एक हानि इस अजीब आधे-ज्ञान को समझाती है?",
          mr: "आपल्याला ठाऊक आहे हडप्पावासी काय बांधत, विणत, विकत — पण एकाही शासकाचे नाव, एका देवतेची कथा, एक कायदा नाही. कोणती एक हानी हे विचित्र अर्धे-ज्ञान समजावते?",
        },
        choices: [
          {
            en: "Their script is unread — objects tell us their deeds, but names, stories and laws live only in words, and their words stay locked",
            hi: "उनकी लिपि अपठित है — चीज़ें उनके काम बताती हैं, पर नाम, कथाएँ और क़ानून केवल शब्दों में जीते हैं, और उनके शब्द बंद पड़े हैं",
            mr: "त्यांची लिपी न वाचलेली आहे — वस्तू त्यांची कामे सांगतात, पण नावे, कथा आणि कायदे फक्त शब्दांत जगतात, आणि त्यांचे शब्द बंद आहेत",
          },
          {
            en: "They had no rulers, gods or laws at all",
            hi: "उनके पास शासक, देवता या क़ानून थे ही नहीं",
            mr: "त्यांच्याकडे शासक, देव वा कायदे नव्हतेच",
          },
          {
            en: "Everything written was carried away by traders",
            hi: "सब लिखा हुआ व्यापारी उठा ले गए",
            mr: "साऱ्या लिहिलेल्याला व्यापारी घेऊन गेले",
          },
          {
            en: "Historians have not yet visited the sites",
            hi: "इतिहासकार अभी स्थलों तक गए ही नहीं",
            mr: "इतिहासकार अजून स्थळांवर गेलेच नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The seals carry writing — hundreds of signs, carefully made — but no one alive can sound them, and no bilingual key like Egypt's Rosetta Stone has surfaced. So the Harappans speak to us only in the language of things: bricks, beads, drains. The day their script cracks open, this chapter will grow names and stories overnight. Until then the honest historian says: we know their hands well, and their voices not at all.",
          hi: "मुहरों पर लिखत है — सैकड़ों चिह्न, सधे हाथ के — पर कोई जीवित उन्हें बोल नहीं सकता, और मिस्र के रोसेटा पत्थर-सी कोई दुभाषी कुंजी नहीं मिली। तो हड़प्पाई हमसे केवल चीज़ों की भाषा में बोलते हैं: ईंटें, मनके, नालियाँ। जिस दिन उनकी लिपि खुलेगी, यह अध्याय रातों-रात नामों और कथाओं से भर जाएगा। तब तक ईमानदार इतिहासकार कहता है: उनके हाथ हम ख़ूब जानते हैं, उनकी आवाज़ें बिलकुल नहीं।",
          mr: "मुद्रांवर लिखाण आहे — शेकडो चिन्हे, सधलेल्या हाताची — पण कोणी जिवंत ती उच्चारू शकत नाही, आणि इजिप्तच्या रोझेटा दगडासारखी द्विभाषिक किल्ली सापडलेली नाही. म्हणून हडप्पावासी आपल्याशी फक्त वस्तूंच्या भाषेत बोलतात: विटा, मणी, गटारे. ज्या दिवशी त्यांची लिपी उलगडेल, त्या दिवशी हे प्रकरण रातोरात नावांनी आणि कथांनी भरेल. तोवर प्रामाणिक इतिहासकार म्हणतो: त्यांचे हात आपण उत्तम जाणतो, त्यांचे आवाज मुळीच नाही.",
        },
      },
    ],
  },
];
