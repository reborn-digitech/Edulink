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
];
