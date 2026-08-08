/**
 * Class 9 Civics — NCERT "Democratic Politics – I", chapter by chapter,
 * through the conceptual engine. What democracy is and why it is worth the
 * trouble: rulers chosen by the ruled, a constitution the winners agree to be
 * bound by, elections that must be genuinely free, institutions that check one
 * another, and rights that fence power in.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Democratic Politics – I (Class 9)";
const LICENCE = "CC-BY-SA-4.0";

export const G9_CIVICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — What is Democracy? Why Democracy?                          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-9-what-is-democracy",
    subject: "CIVICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 1 — What is Democracy? Why Democracy?",
      hi: "अध्याय 1 — लोकतंत्र क्या? लोकतंत्र क्यों?",
      mr: "प्रकरण 1 — लोकशाही म्हणजे काय? लोकशाही का?",
    },
    name: {
      en: "What is Democracy? Why Democracy?",
      hi: "लोकतंत्र क्या? लोकतंत्र क्यों?",
      mr: "लोकशाही म्हणजे काय? लोकशाही का?",
    },
    summary: {
      en: "Democracy tested against its imitations: rulers chosen by the ruled, in an election that offers a real choice and counts every vote equally, under a rule of law that limits the winners — worth its slowness because it is accountable, treats citizens as equals, and can correct its own mistakes.",
      hi: "लोकतंत्र अपनी नक़लों के विरुद्ध परखा: शासितों द्वारा चुने शासक, ऐसे चुनाव में जो असली चुनाव देता और हर मत बराबर गिनता, ऐसे क़ानून-राज तले जो विजेताओं को सीमित करता — अपनी धीमेपन के योग्य क्योंकि यह जवाबदेह, नागरिकों को समान मानता, और अपनी ग़लतियाँ सुधार सकता।",
      mr: "लोकशाही आपल्या नकलांविरुद्ध तपासलेली: शासितांनी निवडलेले शासक, अशा निवडणुकीत जी खरी निवड देते आणि प्रत्येक मत समान मोजते, अशा कायद्याच्या राज्याखाली जे विजेत्यांना मर्यादित करते — आपल्या मंदपणाला पात्र कारण ती जबाबदार, नागरिकांना समान मानते, आणि आपल्या चुका सुधारू शकते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "democracy-definition",
        name: {
          en: "Rule by the people",
          hi: "जनता का शासन",
          mr: "जनतेचे राज्य",
        },
        kind: "idea",
        prompt: {
          en: "At its simplest, a form of government where the rulers are chosen by the people they govern, and hold power only because the people put them there. What is this form called?",
          hi: "अपने सरलतम में, शासन का वह रूप जहाँ शासक अपने शासितों द्वारा चुने जाते, और शक्ति केवल इसलिए रखते क्योंकि जनता ने उन्हें वहाँ बिठाया। इस रूप को क्या कहते?",
          mr: "आपल्या सोप्यात, शासनाचा तो प्रकार जिथे शासक आपल्या शासितांनी निवडले जातात, आणि शक्ती फक्त म्हणून राखतात कारण जनतेने त्यांना तिथे बसवले. या प्रकाराला काय म्हणतात?",
        },
        statement: {
          en: "Democracy is a form of government in which the rulers are chosen by the people they govern — power flows up from the citizens, not down from a king or a self-appointed elite.",
          hi: "लोकतंत्र शासन का वह रूप जिसमें शासक अपने शासितों द्वारा चुने जाते — शक्ति नागरिकों से ऊपर बहती, राजा या स्व-नियुक्त अभिजात से नीचे नहीं।",
          mr: "लोकशाही शासनाचा तो प्रकार ज्यात शासक आपल्या शासितांनी निवडले जातात — शक्ती नागरिकांकडून वर वाहते, राजा किंवा स्व-नियुक्त उच्चभ्रूंकडून खाली नाही.",
        },
        detail: {
          en: "In a large country citizens cannot all rule directly, so they elect representatives to rule on their behalf — a representative democracy.",
          hi: "बड़े देश में नागरिक सब सीधे शासन नहीं कर सकते, अतः वे अपनी ओर से शासन को प्रतिनिधि चुनते — एक प्रतिनिधिक लोकतंत्र।",
          mr: "मोठ्या देशात नागरिक सारे थेट राज्य करू शकत नाहीत, म्हणून ते आपल्यावतीने राज्य करायला प्रतिनिधी निवडतात — एक प्रातिनिधिक लोकशाही.",
        },
        extra: {
          en: "The word joins the Greek demos, the people, with kratos, rule — literally 'rule by the people'.",
          hi: "शब्द ग्रीक डेमोस, जनता, को क्रातोस, शासन, से जोड़ता — शाब्दिक 'जनता का शासन'।",
          mr: "शब्द ग्रीक डेमोस, जनता, याला क्रातोस, राज्य, याच्याशी जोडतो — शब्दशः 'जनतेचे राज्य'.",
        },
        pair: {
          left: {
            en: "Rulers chosen by the ruled",
            hi: "शासितों द्वारा चुने शासक",
            mr: "शासितांनी निवडलेले शासक",
          },
          right: {
            en: "democracy",
            hi: "लोकतंत्र",
            mr: "लोकशाही",
          },
        },
      },
      {
        id: "free-fair-choice",
        name: {
          en: "A genuine electoral choice",
          hi: "असली चुनावी विकल्प",
          mr: "खरी निवडणूक निवड",
        },
        kind: "feature",
        prompt: {
          en: "Holding a vote is not enough — the people must be able to choose between real alternatives in a fair contest, and be free to throw out those in power. Which feature of democracy is this?",
          hi: "मत लेना काफ़ी नहीं — जनता को निष्पक्ष मुक़ाबले में असली विकल्पों के बीच चुनने और सत्ता में बैठों को हटाने को स्वतंत्र होना चाहिए। यह लोकतंत्र की कौन-सी विशेषता है?",
          mr: "मत घेणे पुरेसे नाही — जनतेला निष्पक्ष स्पर्धेत खऱ्या पर्यायांमधून निवडता आले पाहिजे आणि सत्तेत असलेल्यांना हटवायला स्वतंत्र असले पाहिजे. ही लोकशाहीची कोणती वैशिष्ट्य?",
        },
        statement: {
          en: "A democracy must offer a genuine choice — regular, free and fair elections in which the ruling party can be voted out and rival parties compete on equal terms.",
          hi: "लोकतंत्र को असली विकल्प देना चाहिए — नियमित, मुक्त और निष्पक्ष चुनाव जिनमें सत्ताधारी दल हटाया जा सके और प्रतिद्वंद्वी दल बराबर शर्तों पर मुक़ाबला करें।",
          mr: "लोकशाहीने खरी निवड द्यायला हवी — नियमित, मुक्त आणि निष्पक्ष निवडणुका ज्यांत सत्ताधारी पक्ष हटवता येईल आणि प्रतिस्पर्धी पक्ष समान अटींवर स्पर्धा करतील.",
        },
        detail: {
          en: "An election with only one permitted party, or where the result is fixed in advance, is a sham — the vote exists but the choice does not.",
          hi: "केवल एक अनुमत दल वाला, या जहाँ परिणाम पहले से तय, चुनाव एक ढोंग — मत मौजूद पर विकल्प नहीं।",
          mr: "फक्त एक परवानगी असलेल्या पक्षाची, किंवा जिथे निकाल आधीच ठरलेला, निवडणूक एक ढोंग — मत अस्तित्वात पण निवड नाही.",
        },
        extra: {
          en: "This is why some countries that hold 'elections' are still not democracies — the ballot is a costume worn over one-party rule.",
          hi: "इसी से कुछ देश जो 'चुनाव' कराते फिर भी लोकतंत्र नहीं — मतपत्र एक-दलीय शासन पर पहना वेश।",
          mr: "म्हणूनच काही देश जे 'निवडणुका' घेतात तरी लोकशाही नाहीत — मतपत्र एक-पक्षीय राज्यावर घातलेला पोशाख.",
        },
        pair: {
          left: {
            en: "Real alternatives and a chance to vote rulers out",
            hi: "असली विकल्प और शासक हटाने का मौक़ा",
            mr: "खरे पर्याय आणि शासक हटवण्याची संधी",
          },
          right: {
            en: "a genuine electoral choice",
            hi: "असली चुनावी विकल्प",
            mr: "खरी निवडणूक निवड",
          },
        },
      },
      {
        id: "political-equality",
        name: {
          en: "One person, one vote, one value",
          hi: "एक व्यक्ति, एक मत, एक मूल्य",
          mr: "एक व्यक्ती, एक मत, एक मूल्य",
        },
        kind: "feature",
        prompt: {
          en: "In a democracy a rich industrialist and a landless labourer each cast exactly one vote, and each vote weighs the same. Which principle does this express?",
          hi: "लोकतंत्र में एक धनी उद्योगपति और एक भूमिहीन मज़दूर हर एक ठीक एक मत डालता, और हर मत बराबर तौलता। यह कौन-सा सिद्धांत व्यक्त करता?",
          mr: "लोकशाहीत एक श्रीमंत उद्योगपती आणि एक भूमिहीन मजूर प्रत्येक नेमके एक मत टाकतो, आणि प्रत्येक मत समान तोलते. हे कोणते तत्त्व व्यक्त करते?",
        },
        statement: {
          en: "Democracy rests on political equality — every adult citizen has one vote, and every vote carries the same value, regardless of wealth, religion, caste or education.",
          hi: "लोकतंत्र राजनीतिक समानता पर टिका — हर वयस्क नागरिक का एक मत, और हर मत का वही मूल्य, धन, धर्म, जाति या शिक्षा चाहे कुछ भी।",
          mr: "लोकशाही राजकीय समानतेवर टिकते — प्रत्येक प्रौढ नागरिकाचे एक मत, आणि प्रत्येक मताचे तेच मूल्य, संपत्ती, धर्म, जात वा शिक्षण कितीही असो.",
        },
        detail: {
          en: "This is universal adult franchise — the right to vote given to all adults, not just to men, or the propertied, or one race.",
          hi: "यह सार्वभौम वयस्क मताधिकार — मत का अधिकार सभी वयस्कों को, केवल पुरुषों, या संपत्तिवालों, या एक नस्ल को नहीं।",
          mr: "हा सार्वत्रिक प्रौढ मताधिकार — मताचा अधिकार सर्व प्रौढांना, फक्त पुरुष, वा मालमत्ताधारक, वा एका वंशाला नाही.",
        },
        extra: {
          en: "It was won only after long struggles — for most of history the vote was limited to a wealthy few, and women were excluded almost everywhere.",
          hi: "यह लंबे संघर्षों के बाद ही जीता — अधिकांश इतिहास में मत धनी थोड़ों तक सीमित, और स्त्रियाँ लगभग हर जगह बाहर।",
          mr: "हे दीर्घ संघर्षांनंतरच जिंकले — बहुतांश इतिहासात मत श्रीमंत थोड्यांपुरते मर्यादित, आणि स्त्रिया जवळपास सर्वत्र वगळलेल्या.",
        },
        pair: {
          left: {
            en: "Every vote weighs exactly the same",
            hi: "हर मत ठीक बराबर तौलता",
            mr: "प्रत्येक मत नेमके समान तोलते",
          },
          right: {
            en: "political equality",
            hi: "राजनीतिक समानता",
            mr: "राजकीय समानता",
          },
        },
      },
      {
        id: "rule-of-law-limits",
        name: {
          en: "Rule of law and limits on power",
          hi: "क़ानून का राज और शक्ति की सीमाएँ",
          mr: "कायद्याचे राज्य आणि शक्तीच्या मर्यादा",
        },
        kind: "feature",
        prompt: {
          en: "Winning an election does not let a government do whatever it likes; it must still obey the constitution, respect citizens' rights, and answer to the courts. Which feature of democracy is this?",
          hi: "चुनाव जीतना सरकार को जो चाहे करने नहीं देता; उसे अब भी संविधान मानना, नागरिकों के अधिकार आदरना, और अदालतों को जवाब देना होता। यह लोकतंत्र की कौन-सी विशेषता है?",
          mr: "निवडणूक जिंकणे सरकारला वाटेल ते करू देत नाही; तिला अजून संविधान पाळावे, नागरिकांचे हक्क आदरावे, आणि न्यायालयांना उत्तर द्यावे लागते. ही लोकशाहीची कोणती वैशिष्ट्य?",
        },
        statement: {
          en: "In a democracy power is limited by the rule of law — even an elected government must act within the constitution, respect fundamental rights, and submit to independent courts.",
          hi: "लोकतंत्र में शक्ति क़ानून के राज से सीमित — निर्वाचित सरकार को भी संविधान के भीतर काम करना, मूल अधिकार आदरना, और स्वतंत्र अदालतों के अधीन होना होता।",
          mr: "लोकशाहीत शक्ती कायद्याच्या राज्याने मर्यादित — निवडून आलेल्या सरकारलाही संविधानाच्या आत काम करावे, मूलभूत हक्क आदरावे, आणि स्वतंत्र न्यायालयांच्या अधीन असावे लागते.",
        },
        detail: {
          en: "This is what separates a democracy from an elected dictatorship — a leader who wins a vote and then ignores all limits is no longer running a democracy.",
          hi: "यही लोकतंत्र को निर्वाचित तानाशाही से अलग करता — जो नेता मत जीतकर फिर सारी सीमाएँ अनदेखी करे वह अब लोकतंत्र नहीं चला रहा।",
          mr: "हेच लोकशाहीला निवडून आलेल्या हुकूमशाहीपासून वेगळे करते — जो नेता मत जिंकून मग सर्व मर्यादा दुर्लक्षतो तो आता लोकशाही चालवत नाही.",
        },
        extra: {
          en: "The very idea is that no one, however popular, is above the law — the constitution binds the ruler as tightly as the ruled.",
          hi: "विचार ही यह कि कोई भी, चाहे कितना लोकप्रिय, क़ानून से ऊपर नहीं — संविधान शासक को शासित जितना ही कसकर बाँधता।",
          mr: "कल्पनाच ही की कोणीही, कितीही लोकप्रिय, कायद्याहून वर नाही — संविधान शासकाला शासिताइतकेच घट्ट बांधते.",
        },
        pair: {
          left: {
            en: "Even the winners are bound by the constitution",
            hi: "विजेता भी संविधान से बँधे",
            mr: "विजेतेही संविधानाने बांधलेले",
          },
          right: {
            en: "the rule of law",
            hi: "क़ानून का राज",
            mr: "कायद्याचे राज्य",
          },
        },
      },
      {
        id: "accountable-government",
        name: {
          en: "Accountable and responsive government",
          hi: "जवाबदेह और उत्तरदायी सरकार",
          mr: "जबाबदार आणि प्रतिसादी सरकार",
        },
        kind: "argument",
        prompt: {
          en: "Because it must face the voters again and answer their questions in the meantime, a democratic government is pressed to explain its actions and heed people's needs. Which argument for democracy is this?",
          hi: "क्योंकि उसे फिर मतदाताओं का सामना करना और बीच में उनके सवालों का जवाब देना होता, लोकतांत्रिक सरकार अपने कार्य समझाने और लोगों की ज़रूरतें सुनने को दबाई जाती। यह लोकतंत्र के पक्ष में कौन-सा तर्क है?",
          mr: "कारण तिला पुन्हा मतदारांना सामोरे जावे आणि दरम्यान त्यांच्या प्रश्नांना उत्तर द्यावे लागते, लोकशाही सरकार आपली कृती समजावायला आणि लोकांच्या गरजा ऐकायला दाबली जाते. हा लोकशाहीच्या बाजूचा कोणता युक्तिवाद?",
        },
        statement: {
          en: "A key argument for democracy is that it produces accountable and responsive government — rulers must answer to citizens between elections and face them again at the ballot box, so they cannot ignore the people.",
          hi: "लोकतंत्र के पक्ष में मुख्य तर्क कि यह जवाबदेह और उत्तरदायी सरकार पैदा करता — शासकों को चुनावों के बीच नागरिकों को जवाब देना और मतपेटी पर फिर सामना करना होता, अतः वे जनता को अनदेखा नहीं कर सकते।",
          mr: "लोकशाहीच्या बाजूचा मुख्य युक्तिवाद की ती जबाबदार आणि प्रतिसादी सरकार निर्माण करते — शासकांना निवडणुकांदरम्यान नागरिकांना उत्तर द्यावे आणि मतपेटीवर पुन्हा सामोरे जावे लागते, म्हणून ते जनतेला दुर्लक्षू शकत नाहीत.",
        },
        detail: {
          en: "A non-democratic ruler answers to no one and can ignore the people's suffering; a democratic one knows that anger will be remembered at the next election.",
          hi: "अलोकतांत्रिक शासक किसी को जवाब नहीं देता और जनता का कष्ट अनदेखा कर सकता; लोकतांत्रिक जानता कि क्रोध अगले चुनाव में याद रखा जाएगा।",
          mr: "अलोकशाही शासक कोणाला उत्तर देत नाही आणि जनतेचे दुःख दुर्लक्षू शकतो; लोकशाही जाणतो की राग पुढच्या निवडणुकीत लक्षात ठेवला जाईल.",
        },
        extra: {
          en: "This slowness — the need to consult, debate and justify — is not a flaw but the price of keeping government answerable.",
          hi: "यह धीमापन — परामर्श, बहस और औचित्य की ज़रूरत — दोष नहीं बल्कि सरकार को जवाबदेह रखने की क़ीमत।",
          mr: "हा मंदपणा — सल्ला, चर्चा आणि समर्थनाची गरज — दोष नव्हे तर सरकारला जबाबदार ठेवण्याची किंमत.",
        },
        pair: {
          left: {
            en: "Rulers must answer to the people they govern",
            hi: "शासकों को अपने शासितों को जवाब देना",
            mr: "शासकांना आपल्या शासितांना उत्तर द्यावे",
          },
          right: {
            en: "accountable government",
            hi: "जवाबदेह सरकार",
            mr: "जबाबदार सरकार",
          },
        },
      },
      {
        id: "correcting-mistakes",
        name: {
          en: "Dignity and the room to correct mistakes",
          hi: "गरिमा और ग़लतियाँ सुधारने की गुंजाइश",
          mr: "प्रतिष्ठा आणि चुका सुधारण्याची जागा",
        },
        kind: "argument",
        prompt: {
          en: "Democracy treats every citizen as an equal worthy of a say, and because its decisions can be openly questioned, it leaves room to admit and fix its errors. Which pair of arguments for democracy is this?",
          hi: "लोकतंत्र हर नागरिक को कहने योग्य समान मानता, और क्योंकि इसके निर्णय खुलकर सवाले जा सकते, यह अपनी त्रुटियाँ मानने-सुधारने की गुंजाइश छोड़ता। यह लोकतंत्र के पक्ष में कौन-सी जोड़ी तर्क है?",
          mr: "लोकशाही प्रत्येक नागरिकाला बोलण्यायोग्य समान मानते, आणि कारण तिचे निर्णय उघडपणे प्रश्नित करता येतात, ती आपल्या चुका मान्य करण्या-सुधारण्याची जागा सोडते. हा लोकशाहीच्या बाजूचा कोणता जोडी युक्तिवाद?",
        },
        statement: {
          en: "Democracy enhances the dignity of citizens by treating them as political equals, and it allows room to correct its own mistakes, since wrong decisions can be openly criticised and reversed.",
          hi: "लोकतंत्र नागरिकों की गरिमा बढ़ाता उन्हें राजनीतिक समान मानकर, और अपनी ग़लतियाँ सुधारने की गुंजाइश देता, क्योंकि ग़लत निर्णय खुलकर आलोचे और पलटे जा सकते।",
          mr: "लोकशाही नागरिकांची प्रतिष्ठा वाढवते त्यांना राजकीय समान मानून, आणि आपल्या चुका सुधारण्याची जागा देते, कारण चुकीचे निर्णय उघडपणे टीकले आणि उलटवले जाऊ शकतात.",
        },
        detail: {
          en: "No government is free of mistakes; what marks democracy is not that it never errs but that it need not hide its errors and can change course.",
          hi: "कोई सरकार ग़लतियों से मुक्त नहीं; लोकतंत्र को चिह्नित करता यह नहीं कि वह कभी नहीं चूकता बल्कि यह कि उसे अपनी त्रुटियाँ छिपानी नहीं और राह बदल सकता।",
          mr: "कोणतेही सरकार चुकांपासून मुक्त नाही; लोकशाहीला चिन्हांकित करते हे नाही की ती कधी चुकत नाही तर हे की तिला आपल्या चुका लपवाव्या लागत नाहीत आणि मार्ग बदलू शकते.",
        },
        extra: {
          en: "The freedom to criticise the government, hold it to account and vote it out is exactly the mechanism through which mistakes get corrected.",
          hi: "सरकार की आलोचना, जवाबदेही और हटाने की स्वतंत्रता ठीक वह तंत्र जिससे ग़लतियाँ सुधरतीं।",
          mr: "सरकारवर टीका, जबाबदारी आणि हटवण्याचे स्वातंत्र्य नेमके ते यंत्र ज्यातून चुका सुधारल्या जातात.",
        },
        pair: {
          left: {
            en: "Citizens as equals, and room to change course",
            hi: "नागरिक समान, और राह बदलने की गुंजाइश",
            mr: "नागरिक समान, आणि मार्ग बदलण्याची जागा",
          },
          right: {
            en: "dignity and correcting mistakes",
            hi: "गरिमा और ग़लतियाँ सुधारना",
            mr: "प्रतिष्ठा आणि चुका सुधारणे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A country holds an election every five years, complete with voting booths and ballot papers — but only one party is allowed to stand, and voters can only approve its candidates. Is this a democracy, and why?",
          hi: "एक देश हर पाँच वर्ष चुनाव कराता, मतदान बूथों और मतपत्रों समेत — पर केवल एक दल को खड़ा होने की अनुमति, और मतदाता केवल उसके उम्मीदवारों को स्वीकृत कर सकते। क्या यह लोकतंत्र है, और क्यों?",
          mr: "एक देश दर पाच वर्षांनी निवडणूक घेतो, मतदान कक्ष आणि मतपत्रांसह — पण फक्त एका पक्षाला उभे राहण्याची परवानगी, आणि मतदार फक्त त्याच्या उमेदवारांना मंजूर करू शकतात. ही लोकशाही आहे का, आणि का?",
        },
        choices: [
          {
            en: "No — holding a vote is not enough; a democracy requires a genuine choice between real alternatives and the power to vote the rulers out. With only one permitted party, the election is a ritual with no real choice, so it is not a democracy",
            hi: "नहीं — मत लेना काफ़ी नहीं; लोकतंत्र को असली विकल्पों के बीच सच्चा चुनाव और शासकों को हटाने की शक्ति चाहिए। केवल एक अनुमत दल से, चुनाव बिना असली विकल्प का कर्मकांड, अतः यह लोकतंत्र नहीं",
            mr: "नाही — मत घेणे पुरेसे नाही; लोकशाहीला खऱ्या पर्यायांमधील खरी निवड आणि शासकांना हटवण्याची शक्ती हवी. फक्त एका परवानगी असलेल्या पक्षाने, निवडणूक खऱ्या निवडीविना विधी, म्हणून ही लोकशाही नाही",
          },
          {
            en: "Yes — any country that holds elections and prints ballots is automatically a democracy",
            hi: "हाँ — जो देश चुनाव कराता और मतपत्र छापता वह स्वतः लोकतंत्र",
            mr: "होय — जो देश निवडणूक घेतो आणि मतपत्रे छापतो तो आपोआप लोकशाही",
          },
          {
            en: "Yes — because voting every five years is the only requirement of democracy",
            hi: "हाँ — क्योंकि हर पाँच वर्ष मत देना लोकतंत्र की एकमात्र शर्त",
            mr: "होय — कारण दर पाच वर्षांनी मत देणे ही लोकशाहीची एकमेव अट",
          },
          {
            en: "No — because democracies must never hold elections at all",
            hi: "नहीं — क्योंकि लोकतंत्रों को कभी चुनाव नहीं कराने चाहिए",
            mr: "नाही — कारण लोकशाहींनी कधी निवडणुका घेऊ नयेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The trick in this question is that all the outward furniture of an election is present — a fixed schedule, booths, ballots, voters marking papers — and yet the essence is missing. Elections are necessary for democracy, but not just any election qualifies; the vote has to offer a real, meaningful choice. Democracy means the rulers are chosen by the people, and choosing implies that there is more than one option and that the people could genuinely pick a different set of rulers if they wished. Here, only one party is allowed to stand, so voters can 'approve' its candidates but can never reject them for someone else. There is no rival to switch to, no way to throw the ruling party out, no real contest. That makes the election a ritual of consent rather than an instrument of choice — the people cannot actually change who governs them. So despite the ballots and the five-year cycle, this is not a democracy but a dressed-up one-party state. The test is not 'do they vote?' but 'is the choice real, is the contest fair, and can the rulers be voted out?' — and only when the answer to those is yes does an election make a democracy.",
          hi: "इस सवाल की चाल यह कि चुनाव का सारा बाहरी साज़ो-सामान मौजूद — नियत समय, बूथ, मतपत्र, कागज़ चिह्नित करते मतदाता — फिर भी सार ग़ायब। चुनाव लोकतंत्र को ज़रूरी, पर कोई भी चुनाव योग्य नहीं; मत को असली, सार्थक विकल्प देना होता। लोकतंत्र का अर्थ शासक जनता द्वारा चुने, और चुनना अर्थ एक से अधिक विकल्प और जनता चाहे तो सचमुच भिन्न शासक-समूह चुन सके। यहाँ केवल एक दल को खड़े होने की अनुमति, अतः मतदाता उसके उम्मीदवार 'स्वीकृत' कर सकते पर किसी और के लिए कभी अस्वीकृत नहीं। बदलने को कोई प्रतिद्वंद्वी नहीं, सत्ताधारी दल हटाने का कोई रास्ता नहीं, कोई असली मुक़ाबला नहीं। यह चुनाव को विकल्प के उपकरण के बजाय सहमति का कर्मकांड बनाता — जनता वास्तव में बदल नहीं सकती कौन उन पर शासन करे। अतः मतपत्रों और पाँच-वर्ष चक्र के बावजूद, यह लोकतंत्र नहीं बल्कि सजाया एक-दलीय राज्य। परख 'क्या वे मत देते?' नहीं बल्कि 'क्या विकल्प असली, मुक़ाबला निष्पक्ष, और शासक हटाए जा सकते?' — और केवल जब उनका उत्तर हाँ तब चुनाव लोकतंत्र बनाता।",
          mr: "या प्रश्नाची युक्ती ही की निवडणुकीचे सारे बाह्य सामान उपस्थित — ठरलेले वेळापत्रक, कक्ष, मतपत्रे, कागद चिन्हांकित करणारे मतदार — तरी सार गायब. निवडणुका लोकशाहीला आवश्यक, पण कोणतीही निवडणूक पात्र नाही; मताने खरी, अर्थपूर्ण निवड द्यायला हवी. लोकशाही म्हणजे शासक जनतेने निवडले, आणि निवडणे म्हणजे एकाहून अधिक पर्याय आणि जनतेला हवे तर खरोखर वेगळा शासक-गट निवडता येईल. इथे फक्त एका पक्षाला उभे राहण्याची परवानगी, म्हणून मतदार त्याचे उमेदवार 'मंजूर' करू शकतात पण दुसऱ्या कोणासाठी कधी नामंजूर नाही. बदलायला कोणी प्रतिस्पर्धी नाही, सत्ताधारी पक्ष हटवण्याचा मार्ग नाही, कोणतीही खरी स्पर्धा नाही. हे निवडणुकीला निवडीच्या साधनाऐवजी संमतीचा विधी बनवते — जनता प्रत्यक्षात बदलू शकत नाही कोण त्यांच्यावर राज्य करेल. म्हणून मतपत्रे आणि पाच-वर्ष चक्रानंतरही, ही लोकशाही नव्हे तर सजवलेले एक-पक्षीय राज्य. परीक्षा 'ते मत देतात का?' नव्हे तर 'निवड खरी का, स्पर्धा निष्पक्ष का, आणि शासक हटवता येतात का?' — आणि फक्त जेव्हा त्यांचे उत्तर होय तेव्हा निवडणूक लोकशाही बनवते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "People often say 'democracy just means the majority gets its way'. But a government that won a majority and then jailed its critics, banned rival parties and stripped a minority of its rights would be widely condemned as undemocratic. Why is democracy more than simple majority rule?",
          hi: "लोग अक्सर कहते 'लोकतंत्र का अर्थ बस बहुमत की चलती'। पर जो सरकार बहुमत जीतकर फिर अपने आलोचकों को जेल भेजे, प्रतिद्वंद्वी दल प्रतिबंधित करे और अल्पसंख्यक से उसके अधिकार छीने वह व्यापक रूप से अलोकतांत्रिक निंदित होगी। लोकतंत्र सादे बहुमत-शासन से अधिक क्यों?",
          mr: "लोक अनेकदा म्हणतात 'लोकशाही म्हणजे फक्त बहुमताचे चालते'. पण जे सरकार बहुमत जिंकून मग आपल्या टीकाकारांना तुरुंगात टाकेल, प्रतिस्पर्धी पक्ष बंदी घालेल आणि अल्पसंख्याकांचे हक्क हिरावेल ते व्यापकपणे अलोकशाही म्हणून निंदले जाईल. लोकशाही साध्या बहुमत-राज्याहून अधिक का?",
        },
        choices: [
          {
            en: "Because democracy also requires respect for rights, the rule of law and the freedom to dissent: majority support lets a government take decisions, but it does not entitle it to crush opponents or deny minorities their rights — those limits are what stop majority rule from becoming a tyranny of the majority",
            hi: "क्योंकि लोकतंत्र को अधिकारों का आदर, क़ानून का राज और असहमति की स्वतंत्रता भी चाहिए: बहुमत समर्थन सरकार को निर्णय लेने देता, पर उसे विरोधियों को कुचलने या अल्पसंख्यकों के अधिकार नकारने का हक़ नहीं देता — वे सीमाएँ ही जो बहुमत-शासन को बहुमत की तानाशाही बनने से रोकतीं",
            mr: "कारण लोकशाहीला हक्कांचा आदर, कायद्याचे राज्य आणि मतभेदाचे स्वातंत्र्यही हवे: बहुमत पाठिंबा सरकारला निर्णय घेऊ देतो, पण त्याला विरोधकांना चिरडण्याचा किंवा अल्पसंख्याकांचे हक्क नाकारण्याचा अधिकार देत नाही — त्या मर्यादाच ज्या बहुमत-राज्याला बहुमताच्या हुकूमशाहीत बनण्यापासून रोखतात",
          },
          {
            en: "Because in a democracy the minority always gets its way instead of the majority",
            hi: "क्योंकि लोकतंत्र में बहुमत के बजाय अल्पसंख्यक की सदा चलती",
            mr: "कारण लोकशाहीत बहुमताऐवजी अल्पसंख्याकांचे नेहमी चालते",
          },
          {
            en: "Because majority rule is never used in democracies for any decision",
            hi: "क्योंकि लोकतंत्रों में किसी निर्णय को बहुमत-शासन कभी प्रयोग नहीं होता",
            mr: "कारण लोकशाहींत कोणत्याही निर्णयाला बहुमत-राज्य कधी वापरले जात नाही",
          },
          {
            en: "It is not more than majority rule; jailing critics is perfectly democratic if the majority allows it",
            hi: "यह बहुमत-शासन से अधिक नहीं; आलोचकों को जेल भेजना पूरी तरह लोकतांत्रिक यदि बहुमत अनुमति दे",
            mr: "हे बहुमत-राज्याहून अधिक नाही; टीकाकारांना तुरुंगात टाकणे पूर्णपणे लोकशाही जर बहुमत परवानगी देईल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Majority rule is a genuine part of democracy — since not everyone can agree, decisions are often settled by counting who has more support. But it is only a decision-procedure, not the whole of democracy, and treating it as the whole leads straight to the horror in the question. If 'majority wins' were the entire principle, then a government with 51% support could vote to silence the other 49%, jail journalists, ban opposition parties and strip a minority religion or caste of its rights, all while claiming to be 'democratic'. Yet everyone recognises such a regime as a tyranny, not a democracy. The reason is that democracy carries other commitments alongside majority decision-making: the rule of law, which binds even the winning majority; fundamental rights, which belong to every citizen and cannot be voted away; and the freedom to dissent, criticise and organise, which is exactly what lets today's minority become tomorrow's majority. These are not optional extras but the safeguards that keep majority rule from curdling into a 'tyranny of the majority'. In fact they protect the democratic process itself: if the majority could abolish the opposition's rights, it could make sure it never lost again, killing the very choice that makes elections meaningful. So a true democracy is majority rule plus minority rights — the winners get to govern, but they do not get to cancel the losers, and both remain equal citizens under the same law.",
          hi: "बहुमत-शासन लोकतंत्र का असली भाग — क्योंकि सब सहमत नहीं हो सकते, निर्णय अक्सर गिनकर तय होते किसका अधिक समर्थन। पर यह केवल निर्णय-प्रक्रिया, पूरा लोकतंत्र नहीं, और इसे पूरा मानना सीधे सवाल की भयावहता तक ले जाता। यदि 'बहुमत जीतता' पूरा सिद्धांत होता, तो 51% समर्थन वाली सरकार बाक़ी 49% को चुप कराने, पत्रकार जेल भेजने, विपक्षी दल प्रतिबंधित करने और अल्पसंख्यक धर्म या जाति से अधिकार छीनने को मत दे सकती, सब 'लोकतांत्रिक' होने का दावा करते। फिर भी सब ऐसी सत्ता को तानाशाही मानते, लोकतंत्र नहीं। कारण कि लोकतंत्र बहुमत निर्णय के साथ अन्य प्रतिबद्धताएँ ढोता: क़ानून का राज, जो जीतते बहुमत को भी बाँधता; मूल अधिकार, जो हर नागरिक के और मत देकर छीने नहीं जा सकते; और असहमति, आलोचना, संगठन की स्वतंत्रता, ठीक जो आज के अल्पसंख्यक को कल का बहुमत बनने देती। ये वैकल्पिक अतिरिक्त नहीं बल्कि रक्षोपाय जो बहुमत-शासन को 'बहुमत की तानाशाही' में फटने से रोकते। वास्तव में वे लोकतांत्रिक प्रक्रिया की ही रक्षा करते: यदि बहुमत विपक्ष के अधिकार समाप्त कर सके, वह सुनिश्चित कर सकता कि फिर कभी न हारे, ठीक उस विकल्प को मारते जो चुनाव को सार्थक बनाता। अतः सच्चा लोकतंत्र बहुमत-शासन जमा अल्पसंख्यक अधिकार — विजेता शासन पाते, पर हारे को रद्द नहीं कर पाते, और दोनों उसी क़ानून तले समान नागरिक रहते।",
          mr: "बहुमत-राज्य लोकशाहीचा खरा भाग — कारण सारे सहमत होऊ शकत नाहीत, निर्णय अनेकदा मोजून ठरतात कोणाला अधिक पाठिंबा. पण ती फक्त निर्णय-प्रक्रिया, संपूर्ण लोकशाही नव्हे, आणि तिला संपूर्ण मानणे थेट प्रश्नातील भयावहतेकडे नेते. जर 'बहुमत जिंकते' संपूर्ण तत्त्व असते, तर 51% पाठिंबा असलेले सरकार उर्वरित 49% ला गप्प करायला, पत्रकार तुरुंगात टाकायला, विरोधी पक्ष बंदी घालायला आणि अल्पसंख्याक धर्म वा जातीचे हक्क हिरावायला मत देऊ शकते, सारे 'लोकशाही' असल्याचा दावा करत. तरी सारे अशा राजवटीला हुकूमशाही मानतात, लोकशाही नाही. कारण की लोकशाही बहुमत निर्णयासोबत इतर बांधिलक्या वाहते: कायद्याचे राज्य, जे जिंकणाऱ्या बहुमतालाही बांधते; मूलभूत हक्क, जे प्रत्येक नागरिकाचे आणि मत देऊन हिरावता येत नाहीत; आणि मतभेद, टीका, संघटनेचे स्वातंत्र्य, नेमके जे आजच्या अल्पसंख्याकाला उद्याचे बहुमत बनू देते. हे ऐच्छिक अधिक नव्हे तर सुरक्षाकवच जे बहुमत-राज्याला 'बहुमताच्या हुकूमशाही'त फाटण्यापासून रोखतात. प्रत्यक्षात ते लोकशाही प्रक्रियेचेच रक्षण करतात: जर बहुमत विरोधकांचे हक्क रद्द करू शकेल, ते सुनिश्चित करू शकते की पुन्हा कधी हरणार नाही, नेमकी ती निवड मारत जी निवडणुकीला अर्थपूर्ण बनवते. म्हणून खरी लोकशाही बहुमत-राज्य अधिक अल्पसंख्याक हक्क — विजेते राज्य करतात, पण हरलेल्यांना रद्द करू शकत नाहीत, आणि दोघे त्याच कायद्याखाली समान नागरिक राहतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Constitutional Design                                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-9-constitutional-design",
    subject: "CIVICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 2 — Constitutional Design",
      hi: "अध्याय 2 — संविधान निर्माण",
      mr: "प्रकरण 2 — संविधान रचना",
    },
    name: {
      en: "Constitutional Design",
      hi: "संविधान निर्माण",
      mr: "संविधान रचना",
    },
    summary: {
      en: "How a people writes the rules it will live by: a supreme law that binds even the winners, a document that can reconcile former enemies as it did in South Africa, an assembly that drafted India's constitution, a preamble stating its deepest values, and a living text open to careful amendment.",
      hi: "एक जनता कैसे वे नियम लिखती जिनसे वह जिएगी: एक सर्वोच्च क़ानून जो विजेताओं को भी बाँधता, एक दस्तावेज़ जो पूर्व शत्रुओं को मिला सकता जैसा दक्षिण अफ़्रीका में हुआ, एक सभा जिसने भारत का संविधान रचा, एक प्रस्तावना उसके गहनतम मूल्य कहती, और एक जीवित पाठ सावधान संशोधन को खुला।",
      mr: "एक जनता कशी ते नियम लिहिते ज्यांनी ती जगेल: एक सर्वोच्च कायदा जो विजेत्यांनाही बांधतो, एक दस्तऐवज जो पूर्वीच्या शत्रूंना मिळवू शकतो जसे दक्षिण आफ्रिकेत झाले, एक सभा जिने भारताचे संविधान रचले, एक प्रस्तावना त्याची सखोल मूल्ये सांगणारी, आणि एक जिवंत मजकूर काळजीपूर्वक दुरुस्तीला खुला.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "why-constitution",
        name: {
          en: "The supreme rulebook",
          hi: "सर्वोच्च नियम-पुस्तिका",
          mr: "सर्वोच्च नियमपुस्तिका",
        },
        kind: "idea",
        prompt: {
          en: "A country needs one supreme document that lays out how power is to be gained and used, what the government may and may not do, and what rights citizens hold. What is this document called?",
          hi: "देश को एक सर्वोच्च दस्तावेज़ चाहिए जो बताए शक्ति कैसे पाई-प्रयुक्त हो, सरकार क्या कर सकती और क्या नहीं, और नागरिक क्या अधिकार रखते। इस दस्तावेज़ को क्या कहते?",
          mr: "देशाला एक सर्वोच्च दस्तऐवज हवा जो मांडतो शक्ती कशी मिळवली-वापरली जावी, सरकार काय करू शकते आणि काय नाही, आणि नागरिक कोणते हक्क राखतात. या दस्तऐवजाला काय म्हणतात?",
        },
        statement: {
          en: "A constitution is a country's supreme rulebook — it lays down how the government is formed and limited, the powers of its parts, and the rights of citizens, and every other law must obey it.",
          hi: "संविधान देश की सर्वोच्च नियम-पुस्तिका — यह बताता सरकार कैसे बनती-सीमित होती, उसके भागों की शक्तियाँ, और नागरिकों के अधिकार, और हर अन्य क़ानून को इसे मानना होता।",
          mr: "संविधान देशाची सर्वोच्च नियमपुस्तिका — ते मांडते सरकार कसे बनते-मर्यादित होते, त्याच्या भागांच्या शक्ती, आणि नागरिकांचे हक्क, आणि प्रत्येक इतर कायद्याला ते पाळावे लागते.",
        },
        detail: {
          en: "Because it stands above ordinary law, a constitution cannot be changed as easily as an ordinary rule — it is meant to be a stable foundation, not a passing decision.",
          hi: "क्योंकि यह साधारण क़ानून से ऊपर, संविधान साधारण नियम जितनी आसानी नहीं बदला जा सकता — यह स्थिर नींव, न कि गुज़रता निर्णय।",
          mr: "कारण ते साध्या कायद्याहून वर, संविधान साध्या नियमाइतके सहज बदलता येत नाही — ते स्थिर पाया, न की क्षणिक निर्णय.",
        },
        extra: {
          en: "Its deepest purpose is to bind even those in power: it tells the rulers what they may not do, so citizens are protected from their own government.",
          hi: "इसका गहनतम उद्देश्य सत्ता में बैठों को भी बाँधना: यह शासकों को बताता क्या वे नहीं कर सकते, अतः नागरिक अपनी ही सरकार से रक्षित।",
          mr: "त्याचा सखोल उद्देश सत्तेत असलेल्यांनाही बांधणे: ते शासकांना सांगते काय ते करू शकत नाहीत, म्हणून नागरिक आपल्याच सरकारपासून रक्षित.",
        },
        pair: {
          left: {
            en: "The supreme law every other law must obey",
            hi: "सर्वोच्च क़ानून जिसे हर क़ानून माने",
            mr: "सर्वोच्च कायदा जो प्रत्येक कायदा पाळेल",
          },
          right: {
            en: "a constitution",
            hi: "संविधान",
            mr: "संविधान",
          },
        },
      },
      {
        id: "constitution-as-trust",
        name: {
          en: "A constitution as mutual trust",
          hi: "संविधान परस्पर विश्वास के रूप में",
          mr: "संविधान परस्पर विश्वास म्हणून",
        },
        kind: "idea",
        prompt: {
          en: "When apartheid ended in South Africa, the once-oppressed majority and the once-dominant white minority together wrote a constitution guaranteeing rights to all, so that neither would fear the other's revenge. What role of a constitution does this show?",
          hi: "जब दक्षिण अफ़्रीका में रंगभेद समाप्त हुआ, कभी-उत्पीड़ित बहुमत और कभी-प्रभावी श्वेत अल्पसंख्यक ने मिलकर सबको अधिकार देता संविधान लिखा, ताकि कोई दूसरे के प्रतिशोध से न डरे। यह संविधान की कौन-सी भूमिका दिखाता?",
          mr: "जेव्हा दक्षिण आफ्रिकेत वर्णभेद संपला, एकेकाळी-अत्याचारित बहुमत आणि एकेकाळी-वर्चस्वी श्वेत अल्पसंख्याक यांनी मिळून सर्वांना हक्क देणारे संविधान लिहिले, जेणेकरून कोणी दुसऱ्याच्या सुडाला घाबरणार नाही. ही संविधानाची कोणती भूमिका दाखवते?",
        },
        statement: {
          en: "A constitution can serve as a bond of mutual trust — as in South Africa, where former enemies agreed on rules and rights protecting everyone, so each side could feel safe living together under one law.",
          hi: "संविधान परस्पर विश्वास का बंधन बन सकता — जैसे दक्षिण अफ़्रीका में, जहाँ पूर्व शत्रु सबको रक्षते नियमों-अधिकारों पर सहमत हुए, ताकि हर पक्ष एक क़ानून तले साथ रहते सुरक्षित महसूस करे।",
          mr: "संविधान परस्पर विश्वासाचे बंधन बनू शकते — जसे दक्षिण आफ्रिकेत, जिथे पूर्वीचे शत्रू सर्वांना रक्षणाऱ्या नियम-हक्कांवर सहमत झाले, जेणेकरून प्रत्येक बाजू एका कायद्याखाली एकत्र राहताना सुरक्षित वाटेल.",
        },
        detail: {
          en: "The black majority did not use its new power for revenge, and the white minority accepted majority rule, because the constitution promised protections both could rely on.",
          hi: "काले बहुमत ने अपनी नई शक्ति प्रतिशोध को नहीं वापरी, और श्वेत अल्पसंख्यक ने बहुमत-शासन स्वीकारा, क्योंकि संविधान ने ऐसी रक्षा वादा की जिस पर दोनों भरोसा कर सकें।",
          mr: "काळ्या बहुमताने आपली नवी शक्ती सुडासाठी वापरली नाही, आणि श्वेत अल्पसंख्याकाने बहुमत-राज्य स्वीकारले, कारण संविधानाने अशी रक्षा वचन दिली ज्यावर दोघे विसंबू शकतील.",
        },
        extra: {
          en: "It shows a constitution is not just a set of rules but a promise a divided people make to one another about how they will live.",
          hi: "यह दिखाता संविधान केवल नियमों का समुच्चय नहीं बल्कि एक बँटी जनता का एक-दूसरे से वादा कि वे कैसे जिएँगे।",
          mr: "हे दाखवते संविधान फक्त नियमांचा संच नव्हे तर विभागलेल्या जनतेने एकमेकांना दिलेले वचन की ते कसे जगतील.",
        },
        pair: {
          left: {
            en: "Former enemies agreeing rights that protect all",
            hi: "पूर्व शत्रु सबको रक्षते अधिकारों पर सहमत",
            mr: "पूर्वीचे शत्रू सर्वांना रक्षणाऱ्या हक्कांवर सहमत",
          },
          right: {
            en: "a constitution as mutual trust",
            hi: "संविधान परस्पर विश्वास के रूप में",
            mr: "संविधान परस्पर विश्वास म्हणून",
          },
        },
      },
      {
        id: "constituent-assembly",
        name: {
          en: "The Constituent Assembly",
          hi: "संविधान सभा",
          mr: "संविधान सभा",
        },
        kind: "body",
        prompt: {
          en: "India's constitution was written not by one ruler but by a large elected body that debated it clause by clause for nearly three years. What was this body called?",
          hi: "भारत का संविधान एक शासक ने नहीं बल्कि एक बड़े निर्वाचित निकाय ने लिखा जिसने इसे लगभग तीन वर्ष खंड-दर-खंड बहस की। इस निकाय को क्या कहा गया?",
          mr: "भारताचे संविधान एका शासकाने नव्हे तर एका मोठ्या निवडून आलेल्या निकायाने लिहिले ज्याने ते जवळपास तीन वर्षे कलम-दर-कलम चर्चिले. या निकायाला काय म्हटले?",
        },
        statement: {
          en: "The Constituent Assembly was the large elected body that drafted India's constitution, debating it clause by clause over nearly three years, with members drawn from every region, religion and community.",
          hi: "संविधान सभा वह बड़ा निर्वाचित निकाय जिसने भारत का संविधान रचा, इसे लगभग तीन वर्ष खंड-दर-खंड बहस करते, हर क्षेत्र, धर्म और समुदाय से लिए सदस्यों के साथ।",
          mr: "संविधान सभा तो मोठा निवडून आलेला निकाय ज्याने भारताचे संविधान रचले, ते जवळपास तीन वर्षे कलम-दर-कलम चर्चित, प्रत्येक प्रदेश, धर्म आणि समुदायातून घेतलेल्या सदस्यांसह.",
        },
        detail: {
          en: "Its drafting committee was chaired by Dr B. R. Ambedkar, and its long debates were recorded, so the reasons behind each provision are known.",
          hi: "इसकी प्रारूप समिति की अध्यक्षता डॉ. बी. आर. आंबेडकर ने की, और इसकी लंबी बहसें दर्ज हुईं, अतः हर प्रावधान के पीछे के कारण ज्ञात।",
          mr: "त्याच्या मसुदा समितीचे अध्यक्षपद डॉ. बी. आर. आंबेडकर यांनी भूषवले, आणि त्याच्या दीर्घ चर्चा नोंदल्या गेल्या, म्हणून प्रत्येक तरतुदीमागील कारणे ज्ञात.",
        },
        extra: {
          en: "Because so many voices shaped it, the constitution could claim to speak for a whole diverse nation, not just its most powerful group.",
          hi: "क्योंकि इतनी आवाज़ों ने इसे गढ़ा, संविधान पूरी विविध राष्ट्र के लिए बोलने का दावा कर सका, केवल अपने सबसे शक्तिशाली समूह के लिए नहीं।",
          mr: "कारण इतक्या आवाजांनी ते घडवले, संविधान अख्ख्या विविध राष्ट्रासाठी बोलण्याचा दावा करू शकले, फक्त आपल्या सर्वांत शक्तिशाली गटासाठी नाही.",
        },
        pair: {
          left: {
            en: "The elected body that drafted the constitution",
            hi: "संविधान रचता निर्वाचित निकाय",
            mr: "संविधान रचणारा निवडून आलेला निकाय",
          },
          right: {
            en: "the Constituent Assembly",
            hi: "संविधान सभा",
            mr: "संविधान सभा",
          },
        },
      },
      {
        id: "preamble",
        name: {
          en: "The Preamble",
          hi: "प्रस्तावना",
          mr: "प्रास्ताविक",
        },
        kind: "idea",
        prompt: {
          en: "At the very start of India's constitution stands a short statement of purpose, declaring the country a sovereign, socialist, secular, democratic republic committed to justice, liberty, equality and fraternity. What is this opening called?",
          hi: "भारत के संविधान के बिलकुल आरंभ में उद्देश्य का एक संक्षिप्त कथन खड़ा, देश को न्याय, स्वतंत्रता, समानता और बंधुत्व को समर्पित संप्रभु, समाजवादी, धर्मनिरपेक्ष, लोकतांत्रिक गणराज्य घोषित करता। इस आरंभ को क्या कहते?",
          mr: "भारताच्या संविधानाच्या अगदी सुरुवातीला उद्देशाचे एक संक्षिप्त विधान उभे, देशाला न्याय, स्वातंत्र्य, समता आणि बंधुता यांना समर्पित सार्वभौम, समाजवादी, धर्मनिरपेक्ष, लोकशाही प्रजासत्ताक घोषित करत. या सुरुवातीला काय म्हणतात?",
        },
        statement: {
          en: "The Preamble is the short opening statement of the constitution that declares its guiding values — India as a sovereign, socialist, secular, democratic republic securing justice, liberty, equality and fraternity for all.",
          hi: "प्रस्तावना संविधान का संक्षिप्त आरंभिक कथन जो इसके मार्गदर्शक मूल्य घोषित करता — भारत सबको न्याय, स्वतंत्रता, समानता और बंधुत्व सुरक्षित करता संप्रभु, समाजवादी, धर्मनिरपेक्ष, लोकतांत्रिक गणराज्य।",
          mr: "प्रास्ताविक संविधानाचे संक्षिप्त सुरुवातीचे विधान जे त्याची मार्गदर्शक मूल्ये घोषित करते — भारत सर्वांना न्याय, स्वातंत्र्य, समता आणि बंधुता सुरक्षित करणारे सार्वभौम, समाजवादी, धर्मनिरपेक्ष, लोकशाही प्रजासत्ताक.",
        },
        detail: {
          en: "It is like the soul of the constitution — a compass by which the rest of the document, and the government under it, are meant to be steered.",
          hi: "यह संविधान की आत्मा जैसा — एक कम्पास जिससे दस्तावेज़ का बाक़ी, और उसके तहत सरकार, संचालित होने को।",
          mr: "हे संविधानाच्या आत्म्यासारखे — एक होकायंत्र ज्याने दस्तऐवजाचा उरलेला, आणि त्याखालचे सरकार, संचालित व्हायला.",
        },
        extra: {
          en: "'Republic' means the head of state is elected, not a hereditary king; 'secular' that the state favours no religion; 'sovereign' that no outside power rules India.",
          hi: "'गणराज्य' अर्थ राज्य-प्रमुख निर्वाचित, वंशानुगत राजा नहीं; 'धर्मनिरपेक्ष' कि राज्य किसी धर्म का पक्ष नहीं लेता; 'संप्रभु' कि कोई बाहरी शक्ति भारत पर शासन नहीं करती।",
          mr: "'प्रजासत्ताक' म्हणजे राज्यप्रमुख निवडलेला, वंशपरंपरागत राजा नाही; 'धर्मनिरपेक्ष' की राज्य कोणत्याही धर्माची बाजू घेत नाही; 'सार्वभौम' की कोणतीही बाह्य शक्ती भारतावर राज्य करत नाही.",
        },
        pair: {
          left: {
            en: "The opening statement of guiding values",
            hi: "मार्गदर्शक मूल्यों का आरंभिक कथन",
            mr: "मार्गदर्शक मूल्यांचे सुरुवातीचे विधान",
          },
          right: {
            en: "the Preamble",
            hi: "प्रस्तावना",
            mr: "प्रास्ताविक",
          },
        },
      },
      {
        id: "borrowed-yet-indian",
        name: {
          en: "Learned from the world, made for India",
          hi: "दुनिया से सीखा, भारत के लिए बना",
          mr: "जगाकडून शिकलेले, भारतासाठी बनवलेले",
        },
        kind: "idea",
        prompt: {
          en: "India's framers studied the constitutions of many other countries and borrowed ideas they found good, yet reshaped each to fit India's own needs and conditions. What approach does this describe?",
          hi: "भारत के निर्माताओं ने कई अन्य देशों के संविधान पढ़े और जो अच्छे लगे विचार उधार लिए, फिर भी हर एक को भारत की अपनी ज़रूरतों-परिस्थितियों के अनुकूल फिर से गढ़ा। यह कौन-सा दृष्टिकोण बताता?",
          mr: "भारताच्या रचनाकारांनी अनेक इतर देशांची संविधाने वाचली आणि जे चांगले वाटले विचार उधार घेतले, तरी प्रत्येक भारताच्या स्वतःच्या गरजा-परिस्थितीशी जुळवायला पुन्हा घडवले. हा कोणता दृष्टिकोन सांगतो?",
        },
        statement: {
          en: "India's constitution learned from the world yet was made for India — its framers borrowed useful features from many other constitutions but adapted each to India's own circumstances rather than copying blindly.",
          hi: "भारत का संविधान दुनिया से सीखा फिर भी भारत के लिए बना — इसके निर्माताओं ने कई अन्य संविधानों से उपयोगी विशेषताएँ उधार लीं पर हर एक को अंधाधुंध नक़ल के बजाय भारत की अपनी परिस्थितियों के अनुकूल ढाला।",
          mr: "भारताचे संविधान जगाकडून शिकले तरी भारतासाठी बनवले — त्याच्या रचनाकारांनी अनेक इतर संविधानांतून उपयुक्त वैशिष्ट्ये उधार घेतली पण प्रत्येक अंधानुकरणाऐवजी भारताच्या स्वतःच्या परिस्थितीशी जुळवली.",
        },
        detail: {
          en: "Borrowing was no weakness — it was wise learning from others' experience, choosing what had worked elsewhere and leaving what would not suit India.",
          hi: "उधार लेना कोई कमज़ोरी नहीं — यह दूसरों के अनुभव से बुद्धिमान सीख, जो कहीं और काम आया चुनते और जो भारत को न सुहाता छोड़ते।",
          mr: "उधार घेणे कोणती कमजोरी नाही — ते इतरांच्या अनुभवातून शहाणे शिकणे, जे इतरत्र चालले ते निवडत आणि जे भारताला जुळणार नाही ते सोडत.",
        },
        extra: {
          en: "It also drew on India's own long freedom struggle, whose ideals of self-rule, equality and unity are written into the document.",
          hi: "इसने भारत के अपने लंबे स्वतंत्रता संग्राम से भी लिया, जिसके स्वराज, समानता और एकता के आदर्श दस्तावेज़ में लिखे।",
          mr: "याने भारताच्या स्वतःच्या दीर्घ स्वातंत्र्यलढ्यातूनही घेतले, ज्याचे स्वराज्य, समता आणि एकतेचे आदर्श दस्तऐवजात लिहिले.",
        },
        pair: {
          left: {
            en: "Borrowed the good, adapted it to Indian needs",
            hi: "अच्छा उधार लिया, भारतीय ज़रूरतों के अनुकूल ढाला",
            mr: "चांगले उधार घेतले, भारतीय गरजांशी जुळवले",
          },
          right: {
            en: "learned from the world, made for India",
            hi: "दुनिया से सीखा, भारत के लिए बना",
            mr: "जगाकडून शिकलेले, भारतासाठी बनवलेले",
          },
        },
      },
      {
        id: "living-document",
        name: {
          en: "A living document",
          hi: "एक जीवित दस्तावेज़",
          mr: "एक जिवंत दस्तऐवज",
        },
        kind: "idea",
        prompt: {
          en: "The constitution is not frozen forever; it can be carefully amended so that it keeps pace with new needs and changing times, while its core values endure. What quality does this describe?",
          hi: "संविधान सदा जमा नहीं; इसे सावधानी से संशोधित किया जा सकता ताकि यह नई ज़रूरतों और बदलते समय के साथ चले, जबकि इसके मूल मूल्य टिके रहें। यह कौन-सा गुण बताता?",
          mr: "संविधान सदैव गोठलेले नाही; ते काळजीपूर्वक दुरुस्त करता येते जेणेकरून ते नव्या गरजा आणि बदलत्या काळाशी ताळमेळ राखते, तर त्याची गाभा मूल्ये टिकतात. हा कोणता गुण सांगतो?",
        },
        statement: {
          en: "The constitution is a living document — it can be amended by a careful, demanding procedure so it stays relevant to changing times, while its basic structure and core values remain protected.",
          hi: "संविधान एक जीवित दस्तावेज़ — इसे एक सावधान, कठिन प्रक्रिया से संशोधित किया जा सकता ताकि यह बदलते समय के लिए प्रासंगिक रहे, जबकि इसका मूल ढाँचा और मूल्य रक्षित रहें।",
          mr: "संविधान एक जिवंत दस्तऐवज — ते एका काळजीपूर्वक, कठीण प्रक्रियेने दुरुस्त करता येते जेणेकरून ते बदलत्या काळासाठी सुसंगत राहते, तर त्याची मूळ रचना आणि मूल्ये रक्षित राहतात.",
        },
        detail: {
          en: "Amending it is deliberately harder than passing an ordinary law, so no passing majority can rewrite the nation's foundation on a whim.",
          hi: "इसे संशोधित करना जान-बूझकर साधारण क़ानून पारित करने से कठिन, अतः कोई गुज़रता बहुमत सनक से राष्ट्र की नींव नहीं लिख सकता।",
          mr: "ते दुरुस्त करणे जाणीवपूर्वक साध्या कायद्याहून कठीण, म्हणून कोणतेही क्षणिक बहुमत लहरीने राष्ट्राचा पाया पुन्हा लिहू शकत नाही.",
        },
        extra: {
          en: "The balance is delicate — flexible enough to grow, firm enough that its promises cannot be casually erased.",
          hi: "संतुलन नाज़ुक — बढ़ने को पर्याप्त लचीला, इतना दृढ़ कि इसके वादे लापरवाही से मिटाए न जा सकें।",
          mr: "समतोल नाजूक — वाढायला पुरेसे लवचीक, इतके घट्ट की त्याची वचने निष्काळजीपणे पुसता येणार नाहीत.",
        },
        pair: {
          left: {
            en: "Amendable with care, core values protected",
            hi: "सावधानी से संशोधनीय, मूल मूल्य रक्षित",
            mr: "काळजीपूर्वक दुरुस्त करता येणारे, गाभा मूल्ये रक्षित",
          },
          right: {
            en: "a living document",
            hi: "एक जीवित दस्तावेज़",
            mr: "एक जिवंत दस्तऐवज",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "When India became independent, the leaders who had just won power could have simply ruled as they pleased. Instead they wrote a constitution that tightly limited what any government — including their own — could do. Why would victors choose to bind their own hands like this?",
          hi: "जब भारत स्वतंत्र हुआ, जिन नेताओं ने अभी शक्ति जीती थी वे बस जैसे चाहें शासन कर सकते थे। बजाय उन्होंने एक संविधान लिखा जो किसी भी सरकार — अपनी समेत — के करने को कसकर सीमित करता। विजेता अपने ही हाथ यों क्यों बाँधना चुनेंगे?",
          mr: "जेव्हा भारत स्वतंत्र झाला, ज्या नेत्यांनी नुकतीच शक्ती जिंकली होती ते फक्त वाटेल तसे राज्य करू शकत होते. त्याऐवजी त्यांनी एक संविधान लिहिले जे कोणत्याही सरकारच्या — स्वतःच्यासह — करण्याला घट्ट मर्यादित करत. विजेते आपलेच हात असे का बांधणे निवडतील?",
        },
        choices: [
          {
            en: "A constitution's limits protect everyone, including future minorities and the framers themselves once out of power; by binding all governments to rules and rights, they guarded the country against the abuse of power and built trust that no group could simply crush the others",
            hi: "संविधान की सीमाएँ सबको रक्षतीं, भविष्य के अल्पसंख्यकों और शक्ति से बाहर होने पर स्वयं निर्माताओं समेत; सारी सरकारों को नियमों-अधिकारों से बाँधकर, उन्होंने देश को शक्ति के दुरुपयोग से रक्षा और विश्वास बनाया कि कोई समूह बस दूसरों को न कुचल सके",
            mr: "संविधानाच्या मर्यादा सर्वांना रक्षतात, भविष्यातील अल्पसंख्याक आणि शक्तीबाहेर गेल्यावर स्वतः रचनाकारांसह; सर्व सरकारांना नियम-हक्कांनी बांधून, त्यांनी देशाला शक्तीच्या गैरवापरापासून रक्षले आणि विश्वास बांधला की कोणता गट फक्त इतरांना चिरडू शकणार नाही",
          },
          {
            en: "They were forced by a foreign power to write the constitution against their will",
            hi: "उन्हें एक विदेशी शक्ति ने अपनी इच्छा के विरुद्ध संविधान लिखने को बाध्य किया",
            mr: "त्यांना एका परकीय शक्तीने आपल्या इच्छेविरुद्ध संविधान लिहायला भाग पाडले",
          },
          {
            en: "A constitution actually gives a government unlimited power, which is why they wanted one",
            hi: "संविधान वास्तव में सरकार को असीमित शक्ति देता, इसीलिए वे एक चाहते थे",
            mr: "संविधान खरे तर सरकारला अमर्याद शक्ती देते, म्हणूनच त्यांना एक हवे होते",
          },
          {
            en: "There was no reason; binding their own power was simply a mistake",
            hi: "कोई कारण नहीं; अपनी शक्ति बाँधना बस एक ग़लती थी",
            mr: "काही कारण नाही; आपली शक्ती बांधणे फक्त एक चूक होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "It looks strange for winners to limit themselves, but it is one of the wisest things they can do, for several reasons that all point the same way. First, power does not stay put: the leaders in charge today will not rule forever, and one day they, or people they care about, will be out of power and in the minority. A constitution that guarantees rights and limits governments protects them then, just as it restrains them now — it is insurance against a future ruler who might otherwise silence or persecute them. Second, a country freshly born from a diverse, unequal society is full of groups who fear domination by others. Unless each group can trust that the government cannot be turned into a weapon against it, the whole fragile nation could fracture. By writing firm limits and rights into a supreme law that binds every government, the framers gave every community a credible promise: no matter who wins an election, there are things the winners simply cannot do to you. That trust is what lets rivals accept losing and keep competing peacefully. Third, binding power is the very difference between democracy and its opposite — an unlimited government answerable to no rules is a dictatorship even if it began by winning. So the framers limited themselves not out of weakness but out of foresight and principle: they were building a system meant to outlast them, protect everyone including their future selves, and keep power from ever becoming absolute. Tying their own hands was exactly how they secured freedom for all.",
          hi: "विजेताओं का स्वयं को सीमित करना विचित्र लगता, पर यह सबसे बुद्धिमान चीज़ों में जो वे कर सकते, कई कारणों से जो सब एक ही ओर इशारा करते। पहला, शक्ति टिकी नहीं रहती: आज प्रभारी नेता सदा शासन नहीं करेंगे, और एक दिन वे, या जिनकी वे परवाह करते, शक्ति से बाहर और अल्पमत में होंगे। अधिकार देता और सरकारें सीमित करता संविधान तब उन्हें रक्षता, जैसे अब उन्हें रोकता — यह भावी शासक के विरुद्ध बीमा जो अन्यथा उन्हें चुप या सता सकता। दूसरा, विविध, असमान समाज से नवजात देश उन समूहों से भरा जो दूसरों के प्रभुत्व से डरते। जब तक हर समूह भरोसा न कर सके कि सरकार उसके विरुद्ध हथियार नहीं बनाई जा सकती, पूरा नाज़ुक राष्ट्र टूट सकता। हर सरकार को बाँधते सर्वोच्च क़ानून में दृढ़ सीमाएँ-अधिकार लिखकर, निर्माताओं ने हर समुदाय को विश्वसनीय वादा दिया: चाहे कोई भी चुनाव जीते, कुछ चीज़ें विजेता तुम्हारे साथ बस नहीं कर सकते। वह विश्वास ही जो प्रतिद्वंद्वियों को हारना स्वीकारने और शांति से मुक़ाबला जारी रखने देता। तीसरा, शक्ति बाँधना ही लोकतंत्र और उसके उल्टे के बीच अंतर — किसी नियम को जवाबदेह न असीमित सरकार तानाशाही भले जीतकर शुरू हुई हो। अतः निर्माताओं ने स्वयं को कमज़ोरी से नहीं बल्कि दूरदर्शिता और सिद्धांत से सीमित किया: वे उनसे अधिक टिकने, सबको अपने भावी स्वयं समेत रक्षने, और शक्ति को कभी निरपेक्ष न बनने देने को व्यवस्था बना रहे थे। अपने हाथ बाँधना ठीक वह जिससे उन्होंने सबकी स्वतंत्रता सुरक्षित की।",
          mr: "विजेत्यांचे स्वतःला मर्यादित करणे विचित्र वाटते, पण ती त्यांच्या करू शकणाऱ्या सर्वांत शहाण्या गोष्टींपैकी एक, अनेक कारणांनी जी सारी एकाच दिशेला निर्देश करतात. पहिले, शक्ती टिकून राहत नाही: आज प्रभारी नेते सदैव राज्य करणार नाहीत, आणि एक दिवस ते, किंवा ज्यांची त्यांना काळजी, शक्तीबाहेर आणि अल्पमतात असतील. हक्क देणारे आणि सरकारे मर्यादित करणारे संविधान तेव्हा त्यांना रक्षते, जसे आता त्यांना रोखते — तो भविष्यातील शासकाविरुद्ध विमा जो अन्यथा त्यांना गप्प वा छळू शकतो. दुसरे, विविध, असमान समाजातून नुकताच जन्मलेला देश त्या गटांनी भरलेला जे इतरांच्या वर्चस्वाला घाबरतात. जोवर प्रत्येक गट विश्वास ठेवू शकत नाही की सरकार त्याच्याविरुद्ध शस्त्र बनवता येणार नाही, अख्खे नाजूक राष्ट्र फुटू शकते. प्रत्येक सरकारला बांधणाऱ्या सर्वोच्च कायद्यात घट्ट मर्यादा-हक्क लिहून, रचनाकारांनी प्रत्येक समुदायाला विश्वसनीय वचन दिले: कोणीही निवडणूक जिंको, काही गोष्टी विजेते तुमच्याशी फक्त करू शकत नाहीत. तो विश्वासच जो प्रतिस्पर्ध्यांना हारणे स्वीकारायला आणि शांततेने स्पर्धा चालू ठेवायला देतो. तिसरे, शक्ती बांधणे हाच लोकशाही आणि तिच्या उलट यांतील फरक — कोणत्याही नियमाला जबाबदार नसलेले अमर्याद सरकार हुकूमशाही जरी जिंकून सुरू झाले असले तरी. म्हणून रचनाकारांनी स्वतःला कमजोरीने नव्हे तर दूरदृष्टी आणि तत्त्वाने मर्यादित केले: ते त्यांच्याहून अधिक टिकणारी, सर्वांना आपल्या भविष्यातील स्वतःसह रक्षणारी, आणि शक्तीला कधी निरपेक्ष न होऊ देणारी व्यवस्था बांधत होते. आपले हात बांधणे नेमके ते ज्याने त्यांनी सर्वांचे स्वातंत्र्य सुरक्षित केले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In South Africa the black majority had suffered decades of brutal apartheid at the hands of the white minority. When apartheid finally fell, why did the new constitution guarantee rights and protections to the white minority too, instead of the majority simply using its power to take revenge?",
          hi: "दक्षिण अफ़्रीका में काले बहुमत ने श्वेत अल्पसंख्यक के हाथों दशकों क्रूर रंगभेद झेला। जब रंगभेद अंततः गिरा, नए संविधान ने श्वेत अल्पसंख्यक को भी अधिकार-रक्षा क्यों दी, बजाय बहुमत के बस अपनी शक्ति प्रतिशोध लेने को वापरने के?",
          mr: "दक्षिण आफ्रिकेत काळ्या बहुमताने श्वेत अल्पसंख्याकाच्या हातून दशके क्रूर वर्णभेद सोसला. जेव्हा वर्णभेद अखेर पडला, नव्या संविधानाने श्वेत अल्पसंख्याकालाही हक्क-रक्षण का दिले, बहुमताने फक्त आपली शक्ती सूड घ्यायला वापरण्याऐवजी?",
        },
        choices: [
          {
            en: "A constitution built on revenge would only breed fresh fear and conflict; by guaranteeing rights to everyone, including former oppressors, the new order won the trust needed for enemies to live together peacefully under one law, and set the principle that rights protect all people, not just the winning side",
            hi: "प्रतिशोध पर बना संविधान केवल नया भय-संघर्ष पालता; सबको, पूर्व उत्पीड़कों समेत, अधिकार देकर, नई व्यवस्था ने वह विश्वास जीता जो शत्रुओं को एक क़ानून तले शांति से साथ रहने को चाहिए, और सिद्धांत रखा कि अधिकार सब लोगों को रक्षते, केवल जीतते पक्ष को नहीं",
            mr: "सुडावर बांधलेले संविधान फक्त नवी भीती-संघर्ष पोसते; सर्वांना, पूर्वीच्या अत्याचाऱ्यांसह, हक्क देऊन, नव्या व्यवस्थेने तो विश्वास जिंकला जो शत्रूंना एका कायद्याखाली शांततेने एकत्र राहायला हवा, आणि तत्त्व मांडले की हक्क सर्व लोकांना रक्षतात, फक्त जिंकणाऱ्या बाजूला नाही",
          },
          {
            en: "The white minority secretly still ruled and forced the majority to protect it",
            hi: "श्वेत अल्पसंख्यक गुप्त रूप से अब भी शासन करता और बहुमत को उसे रक्षने को बाध्य करता",
            mr: "श्वेत अल्पसंख्याक गुप्तपणे अजून राज्य करी आणि बहुमताला त्याला रक्षायला भाग पाडी",
          },
          {
            en: "The majority did not actually want democracy, so it copied apartheid instead",
            hi: "बहुमत वास्तव में लोकतंत्र नहीं चाहता था, अतः उसने बजाय रंगभेद की नक़ल की",
            mr: "बहुमताला खरे तर लोकशाही नको होती, म्हणून त्याने त्याऐवजी वर्णभेदाची नक्कल केली",
          },
          {
            en: "Constitutions are required by law to ignore minorities entirely",
            hi: "संविधानों को क़ानूनन अल्पसंख्यकों को पूरी तरह अनदेखा करना होता",
            mr: "संविधानांना कायद्याने अल्पसंख्याकांना पूर्णपणे दुर्लक्षावे लागते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The temptation to answer decades of cruelty with revenge would have been enormous, and no one could have called it unfair given what the majority had suffered. But the leaders of the new South Africa — figures like Nelson Mandela — understood that a country cannot be built on retribution. If the new constitution had simply turned the tables, stripping the former white rulers of their rights and property, it would have replaced one group's domination with another's, guaranteeing that the losers now lived in fear and that the cycle of hatred and conflict would continue, perhaps into civil war. A constitution's deepest job here was to be a bond of mutual trust: a set of promises that let people who had been bitter enemies believe they could safely share one country. That required protections that ran both ways. The black majority accepted that it would not use its new power to persecute whites; the white minority accepted majority rule and the loss of its old privileges; and both could do so because the constitution guaranteed to everyone, whatever their race, the same fundamental rights that no government could take away. In other words, the very idea of rights is that they belong to all people as people, not as prizes handed to whoever wins. Protecting the former oppressors was not weakness or forgetting the past; it was the principled and practical foundation of reconciliation, turning a constitution into the shared ground on which former enemies could finally stand together. That is exactly why the South African example is taught as the clearest case of a constitution serving as an instrument of trust rather than a tool of domination.",
          hi: "दशकों की क्रूरता का उत्तर प्रतिशोध से देने का प्रलोभन विशाल होता, और बहुमत ने जो झेला उसे देख कोई इसे अन्यायपूर्ण न कह सकता। पर नए दक्षिण अफ़्रीका के नेता — नेल्सन मंडेला जैसे — समझते थे कि देश प्रतिशोध पर नहीं बनाया जा सकता। यदि नए संविधान ने बस पासा पलटा होता, पूर्व श्वेत शासकों से अधिकार-संपत्ति छीनते, वह एक समूह के प्रभुत्व को दूसरे से बदल देता, सुनिश्चित करते कि हारे अब भय में जिएँ और घृणा-संघर्ष का चक्र चलता रहे, शायद गृहयुद्ध तक। यहाँ संविधान का गहनतम काम परस्पर विश्वास का बंधन होना था: वादों का समुच्चय जो कड़वे शत्रु रहे लोगों को मानने दे कि वे सुरक्षित एक देश साझा कर सकते। इसके लिए दोनों ओर चलती रक्षा चाहिए थी। काले बहुमत ने माना कि वह अपनी नई शक्ति गोरों को सताने नहीं वापरेगा; श्वेत अल्पसंख्यक ने बहुमत-शासन और अपने पुराने विशेषाधिकारों की हानि स्वीकारी; और दोनों ऐसा कर सके क्योंकि संविधान ने सबको, चाहे नस्ल कोई भी, वही मूल अधिकार दिए जो कोई सरकार छीन न सके। दूसरे शब्दों में, अधिकारों का विचार ही यह कि वे सब लोगों के लोगों के रूप में, न कि जो जीते उसे दिए पुरस्कार के रूप में। पूर्व उत्पीड़कों को रक्षना कमज़ोरी या अतीत भूलना नहीं था; यह सुलह की सैद्धांतिक और व्यावहारिक नींव, संविधान को वह साझा ज़मीन बनाते जिस पर पूर्व शत्रु अंततः साथ खड़े हो सकें। ठीक इसीलिए दक्षिण अफ़्रीकी उदाहरण संविधान के प्रभुत्व के उपकरण के बजाय विश्वास के उपकरण के रूप में सेवा का सबसे स्पष्ट मामला पढ़ाया जाता।",
          mr: "दशकांच्या क्रूरतेला सुडाने उत्तर देण्याचा मोह प्रचंड असता, आणि बहुमताने जे सोसले ते पाहून कोणी त्याला अन्याय्य म्हणू शकत नाही. पण नव्या दक्षिण आफ्रिकेचे नेते — नेल्सन मंडेलांसारखे — समजत होते की देश सूडावर बांधता येत नाही. जर नव्या संविधानाने फक्त पारडे पलटले असते, पूर्वीच्या श्वेत शासकांचे हक्क-मालमत्ता हिरावत, ते एका गटाच्या वर्चस्वाला दुसऱ्याने बदलले असते, सुनिश्चित करत की हरलेले आता भीतीत जगतील आणि द्वेष-संघर्षाचे चक्र चालू राहील, कदाचित यादवी युद्धापर्यंत. इथे संविधानाचे सखोल काम परस्पर विश्वासाचे बंधन असणे होते: वचनांचा संच जो कडवे शत्रू राहिलेल्या लोकांना मानू देतो की ते सुरक्षितपणे एक देश वाटू शकतात. त्यासाठी दोन्ही बाजूंनी चालणारे रक्षण हवे होते. काळ्या बहुमताने मान्य केले की तो आपली नवी शक्ती श्वेतांना छळायला वापरणार नाही; श्वेत अल्पसंख्याकाने बहुमत-राज्य आणि आपल्या जुन्या विशेषाधिकारांची हानी स्वीकारली; आणि दोघे असे करू शकले कारण संविधानाने सर्वांना, वंश कोणताही असो, तेच मूलभूत हक्क दिले जे कोणतेही सरकार हिरावू शकत नाही. दुसऱ्या शब्दांत, हक्कांची कल्पनाच ही की ते सर्व लोकांचे लोक म्हणून, न की जो जिंकतो त्याला दिलेली बक्षिसे म्हणून. पूर्वीच्या अत्याचाऱ्यांना रक्षणे कमजोरी वा भूतकाळ विसरणे नव्हते; ती समेटाची तत्त्वनिष्ठ आणि व्यावहारिक पायाभरणी, संविधानाला ती सामायिक जमीन बनवत जिच्यावर पूर्वीचे शत्रू अखेर एकत्र उभे राहू शकतील. नेमके म्हणूनच दक्षिण आफ्रिकी उदाहरण संविधान वर्चस्वाच्या साधनाऐवजी विश्वासाचे साधन म्हणून सेवा करण्याचे सर्वांत स्पष्ट प्रकरण शिकवले जाते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Electoral Politics                                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "civics-9-electoral-politics",
    subject: "CIVICS",
    classLevel: 9,
    chapter: {
      en: "Chapter 3 — Electoral Politics",
      hi: "अध्याय 3 — चुनावी राजनीति",
      mr: "प्रकरण 3 — निवडणूक राजकारण",
    },
    name: {
      en: "Electoral Politics",
      hi: "चुनावी राजनीति",
      mr: "निवडणूक राजकारण",
    },
    summary: {
      en: "How the people actually choose their rulers: regular elections to pick and dismiss representatives, the country carved into constituencies with some seats reserved so weaker groups get a voice, secret ballots that free the vote from fear, and an independent Election Commission to keep the whole contest fair.",
      hi: "जनता वास्तव में अपने शासक कैसे चुनती: प्रतिनिधि चुनने-हटाने को नियमित चुनाव, देश निर्वाचन-क्षेत्रों में कटा कुछ सीटें आरक्षित ताकि कमज़ोर समूहों को आवाज़ मिले, गुप्त मतपत्र जो मत को भय से मुक्त करते, और पूरे मुक़ाबले को निष्पक्ष रखता स्वतंत्र चुनाव आयोग।",
      mr: "जनता प्रत्यक्षात आपले शासक कसे निवडते: प्रतिनिधी निवडायला-हटवायला नियमित निवडणुका, देश मतदारसंघांत कापलेला काही जागा राखीव जेणेकरून दुर्बल गटांना आवाज मिळेल, गुप्त मतपत्रे जी मत भीतीपासून मुक्त करतात, आणि अख्खी स्पर्धा निष्पक्ष ठेवणारा स्वतंत्र निवडणूक आयोग.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "why-elections",
        name: {
          en: "Why elections are needed",
          hi: "चुनाव क्यों ज़रूरी",
          mr: "निवडणुका का आवश्यक",
        },
        kind: "idea",
        prompt: {
          en: "Since a whole people cannot sit and govern together, they need a regular way to pick who will represent them and to remove those they no longer want. What mechanism serves this purpose?",
          hi: "क्योंकि पूरी जनता बैठकर साथ शासन नहीं कर सकती, उन्हें एक नियमित तरीक़ा चाहिए यह चुनने को कौन उनका प्रतिनिधित्व करेगा और जिन्हें अब नहीं चाहते उन्हें हटाने को। कौन-सा तंत्र यह उद्देश्य साधता?",
          mr: "कारण अख्खी जनता बसून एकत्र राज्य करू शकत नाही, त्यांना एक नियमित मार्ग हवा हे निवडायला कोण त्यांचे प्रतिनिधित्व करेल आणि ज्यांना आता नको त्यांना हटवायला. कोणते यंत्र हा उद्देश साधते?",
        },
        statement: {
          en: "Elections are the regular mechanism by which people choose their representatives and can dismiss those in power, allowing citizens to hold rulers accountable and change them peacefully.",
          hi: "चुनाव वह नियमित तंत्र जिससे जनता अपने प्रतिनिधि चुनती और सत्ता में बैठों को हटा सकती, नागरिकों को शासकों को जवाबदेह रखने और शांति से बदलने देते।",
          mr: "निवडणुका ते नियमित यंत्र ज्याने जनता आपले प्रतिनिधी निवडते आणि सत्तेत असलेल्यांना हटवू शकते, नागरिकांना शासकांना जबाबदार ठेवायला आणि शांततेने बदलायला देत.",
        },
        detail: {
          en: "Regularity matters — elections at fixed intervals mean no government can cling to power indefinitely, and the people get a scheduled chance to judge it.",
          hi: "नियमितता मायने रखती — नियत अंतरालों पर चुनाव अर्थ कोई सरकार अनिश्चित काल शक्ति नहीं पकड़ सकती, और जनता को इसे परखने का निर्धारित मौक़ा।",
          mr: "नियमितता महत्त्वाची — ठराविक अंतरांवर निवडणुका म्हणजे कोणतेही सरकार अनिश्चित काळ शक्ती धरून ठेवू शकत नाही, आणि जनतेला ते तपासण्याची ठरलेली संधी.",
        },
        extra: {
          en: "Elections let voters reward or punish those in power, choose between rival policies, and pick who best represents their views — several jobs at once.",
          hi: "चुनाव मतदाताओं को सत्ता में बैठों को पुरस्कृत या दंडित करने, प्रतिद्वंद्वी नीतियों के बीच चुनने, और जो उनके विचार सर्वश्रेष्ठ प्रतिनिधित्व करे चुनने देते — एक साथ कई काम।",
          mr: "निवडणुका मतदारांना सत्तेत असलेल्यांना बक्षीस वा शिक्षा द्यायला, प्रतिस्पर्धी धोरणांमधून निवडायला, आणि जो त्यांचे विचार उत्तम प्रतिनिधित्व करेल तो निवडायला देतात — एकाच वेळी अनेक कामे.",
        },
        pair: {
          left: {
            en: "Regularly pick representatives and remove rulers",
            hi: "नियमित प्रतिनिधि चुनें और शासक हटाएँ",
            mr: "नियमित प्रतिनिधी निवडा आणि शासक हटवा",
          },
          right: {
            en: "why elections are needed",
            hi: "चुनाव क्यों ज़रूरी",
            mr: "निवडणुका का आवश्यक",
          },
        },
      },
      {
        id: "constituencies",
        name: {
          en: "Constituencies",
          hi: "निर्वाचन-क्षेत्र",
          mr: "मतदारसंघ",
        },
        kind: "idea",
        prompt: {
          en: "For elections the country is divided into geographic areas, each of which chooses one representative to send to the legislature. What is each such area called?",
          hi: "चुनावों के लिए देश भौगोलिक क्षेत्रों में बँटा, हर एक विधायिका को भेजने को एक प्रतिनिधि चुनता। ऐसे हर क्षेत्र को क्या कहते?",
          mr: "निवडणुकांसाठी देश भौगोलिक क्षेत्रांत विभागला, प्रत्येक विधिमंडळाला पाठवायला एक प्रतिनिधी निवडतो. अशा प्रत्येक क्षेत्राला काय म्हणतात?",
        },
        statement: {
          en: "A constituency is a geographic area into which the country is divided for elections, each electing one representative — so every citizen is represented by the member chosen from their own area.",
          hi: "निर्वाचन-क्षेत्र वह भौगोलिक क्षेत्र जिनमें देश चुनावों को बँटा, हर एक एक प्रतिनिधि चुनता — अतः हर नागरिक अपने ही क्षेत्र से चुने सदस्य द्वारा प्रतिनिधित्व।",
          mr: "मतदारसंघ ते भौगोलिक क्षेत्र ज्यांत देश निवडणुकांसाठी विभागला, प्रत्येक एक प्रतिनिधी निवडतो — म्हणून प्रत्येक नागरिक आपल्याच क्षेत्रातून निवडलेल्या सदस्याद्वारे प्रतिनिधित्व.",
        },
        detail: {
          en: "For the Lok Sabha the country is split into constituencies of roughly equal population, so each member speaks for about the same number of people.",
          hi: "लोक सभा के लिए देश लगभग बराबर आबादी के निर्वाचन-क्षेत्रों में बँटा, अतः हर सदस्य लगभग उतने ही लोगों के लिए बोलता।",
          mr: "लोकसभेसाठी देश जवळपास समान लोकसंख्येच्या मतदारसंघांत विभागला, म्हणून प्रत्येक सदस्य जवळपास तितक्याच लोकांसाठी बोलतो.",
        },
        extra: {
          en: "The candidate who wins the most votes in a constituency represents it, whether or not they won more than half — a simple 'first past the post'.",
          hi: "जो उम्मीदवार निर्वाचन-क्षेत्र में सबसे अधिक मत जीते वह उसका प्रतिनिधित्व करता, चाहे आधे से अधिक जीता हो या नहीं — एक सरल 'सबसे आगे वाला जीते'।",
          mr: "जो उमेदवार मतदारसंघात सर्वांत अधिक मते जिंकतो तो त्याचे प्रतिनिधित्व करतो, अर्ध्याहून अधिक जिंको वा नाही — एक सोपे 'सर्वांत पुढे तो जिंके'.",
        },
        pair: {
          left: {
            en: "An area that elects one representative",
            hi: "एक प्रतिनिधि चुनता क्षेत्र",
            mr: "एक प्रतिनिधी निवडणारे क्षेत्र",
          },
          right: {
            en: "a constituency",
            hi: "निर्वाचन-क्षेत्र",
            mr: "मतदारसंघ",
          },
        },
      },
      {
        id: "reserved-constituencies",
        name: {
          en: "Reserved constituencies",
          hi: "आरक्षित निर्वाचन-क्षेत्र",
          mr: "राखीव मतदारसंघ",
        },
        kind: "idea",
        prompt: {
          en: "Some constituencies are set aside so that only candidates from the Scheduled Castes or Scheduled Tribes can contest them, guaranteeing these long-disadvantaged groups a share of seats. What are these called?",
          hi: "कुछ निर्वाचन-क्षेत्र अलग रखे ताकि केवल अनुसूचित जाति या अनुसूचित जनजाति के उम्मीदवार उनमें लड़ सकें, इन लंबे-वंचित समूहों को सीटों का हिस्सा गारंटी करते। इन्हें क्या कहते?",
          mr: "काही मतदारसंघ वेगळे ठेवले जेणेकरून फक्त अनुसूचित जाती वा अनुसूचित जमातींचे उमेदवार त्यांत लढू शकतात, या दीर्घ-वंचित गटांना जागांचा वाटा हमी देत. यांना काय म्हणतात?",
        },
        statement: {
          en: "Reserved constituencies are seats in which only candidates from the Scheduled Castes or Scheduled Tribes may stand, ensuring these historically disadvantaged groups a fair share of representation.",
          hi: "आरक्षित निर्वाचन-क्षेत्र वे सीटें जिनमें केवल अनुसूचित जाति या अनुसूचित जनजाति के उम्मीदवार खड़े हो सकते, इन ऐतिहासिक-वंचित समूहों को प्रतिनिधित्व का उचित हिस्सा सुनिश्चित करते।",
          mr: "राखीव मतदारसंघ त्या जागा ज्यांत फक्त अनुसूचित जाती वा अनुसूचित जमातींचे उमेदवार उभे राहू शकतात, या ऐतिहासिक-वंचित गटांना प्रतिनिधित्वाचा न्याय्य वाटा सुनिश्चित करत.",
        },
        detail: {
          en: "Everyone in a reserved constituency still votes; only the pool of candidates is limited, so the winner is chosen by all the area's voters but must come from that group.",
          hi: "आरक्षित निर्वाचन-क्षेत्र में हर कोई अब भी मत देता; केवल उम्मीदवारों का समूह सीमित, अतः विजेता क्षेत्र के सभी मतदाताओं द्वारा चुना पर उसी समूह से आना चाहिए।",
          mr: "राखीव मतदारसंघात प्रत्येक अजून मत देतो; फक्त उमेदवारांचा संच मर्यादित, म्हणून विजेता क्षेत्राच्या सर्व मतदारांनी निवडलेला पण त्याच गटातून यायला हवा.",
        },
        extra: {
          en: "The point is to make sure weaker groups actually reach the legislature, which they might not in an open contest against more powerful communities.",
          hi: "बात यह सुनिश्चित करना कि कमज़ोर समूह वास्तव में विधायिका पहुँचें, जो अधिक शक्तिशाली समुदायों के विरुद्ध खुले मुक़ाबले में शायद न पहुँचें।",
          mr: "मुद्दा हे सुनिश्चित करणे की दुर्बल गट प्रत्यक्षात विधिमंडळ गाठतात, जे अधिक शक्तिशाली समुदायांविरुद्ध खुल्या स्पर्धेत कदाचित गाठणार नाहीत.",
        },
        pair: {
          left: {
            en: "Seats only SC or ST candidates may contest",
            hi: "केवल SC या ST उम्मीदवार लड़ें ऐसी सीटें",
            mr: "फक्त SC वा ST उमेदवार लढतील अशा जागा",
          },
          right: {
            en: "reserved constituencies",
            hi: "आरक्षित निर्वाचन-क्षेत्र",
            mr: "राखीव मतदारसंघ",
          },
        },
      },
      {
        id: "campaign-manifesto",
        name: {
          en: "Campaigns and manifestos",
          hi: "प्रचार और घोषणापत्र",
          mr: "प्रचार आणि जाहीरनामे",
        },
        kind: "idea",
        prompt: {
          en: "In the weeks before polling, parties and candidates hold rallies, make speeches and publish written promises of what they will do if elected, so voters can compare and choose. What is this contest of persuasion and its written promises called?",
          hi: "मतदान से पहले हफ़्तों, दल और उम्मीदवार रैलियाँ करते, भाषण देते और चुने जाने पर क्या करेंगे उसके लिखित वादे प्रकाशित करते, ताकि मतदाता तुलना कर चुन सकें। इस अनुनय-मुक़ाबले और उसके लिखित वादों को क्या कहते?",
          mr: "मतदानापूर्वी आठवडे, पक्ष आणि उमेदवार सभा घेतात, भाषणे देतात आणि निवडून आल्यास काय करतील त्याची लेखी वचने प्रकाशित करतात, जेणेकरून मतदार तुलना करून निवडू शकतील. या मन वळवण्याच्या स्पर्धेला आणि तिच्या लेखी वचनांना काय म्हणतात?",
        },
        statement: {
          en: "An election campaign is the open period of rallies, speeches and debate before polling, during which each party issues a manifesto — its written set of promises and policies — so voters can compare and decide.",
          hi: "चुनाव प्रचार मतदान से पहले रैलियों, भाषणों और बहस की खुली अवधि, जिसके दौरान हर दल घोषणापत्र जारी करता — उसके वादों-नीतियों का लिखित समुच्चय — ताकि मतदाता तुलना कर निर्णय लें।",
          mr: "निवडणूक प्रचार मतदानापूर्वी सभा, भाषणे आणि चर्चेचा खुला काळ, ज्या दरम्यान प्रत्येक पक्ष जाहीरनामा प्रसिद्ध करतो — त्याच्या वचनां-धोरणांचा लेखी संच — जेणेकरून मतदार तुलना करून निर्णय घेतील.",
        },
        detail: {
          en: "The manifesto lets voters judge a party not just on personality but on what it actually proposes to do, and later hold it to those promises.",
          hi: "घोषणापत्र मतदाताओं को दल को केवल व्यक्तित्व पर नहीं बल्कि जो वह वास्तव में करने का प्रस्ताव उस पर परखने, और बाद में उन वादों पर जवाबदेह ठहराने देता।",
          mr: "जाहीरनामा मतदारांना पक्षाला फक्त व्यक्तिमत्त्वावर नव्हे तर जे तो प्रत्यक्षात करण्याचा प्रस्ताव त्यावर तपासायला, आणि नंतर त्या वचनांवर जबाबदार धरायला देतो.",
        },
        extra: {
          en: "Campaigns follow a code of conduct meant to keep the contest fair — barring the misuse of government money or power to win votes.",
          hi: "प्रचार एक आचार-संहिता मानते जो मुक़ाबले को निष्पक्ष रखे — मत जीतने को सरकारी धन या शक्ति के दुरुपयोग को रोकते।",
          mr: "प्रचार एक आचारसंहिता पाळतात जी स्पर्धेला निष्पक्ष ठेवे — मते जिंकायला सरकारी पैसा वा शक्तीचा गैरवापर रोखत.",
        },
        pair: {
          left: {
            en: "Rallies and a written set of promises",
            hi: "रैलियाँ और वादों का लिखित समुच्चय",
            mr: "सभा आणि वचनांचा लेखी संच",
          },
          right: {
            en: "campaigns and manifestos",
            hi: "प्रचार और घोषणापत्र",
            mr: "प्रचार आणि जाहीरनामे",
          },
        },
      },
      {
        id: "secret-ballot",
        name: {
          en: "The secret ballot",
          hi: "गुप्त मतदान",
          mr: "गुप्त मतदान",
        },
        kind: "idea",
        prompt: {
          en: "Each voter marks their choice alone, behind a screen, and no one can be told or forced to reveal whom they voted for. Which safeguard of the vote is this?",
          hi: "हर मतदाता अकेले, परदे के पीछे अपनी पसंद चिह्नित करता, और किसी को बताया या किसके लिए मत दिया प्रकट करने को बाध्य नहीं किया जा सकता। यह मत का कौन-सा रक्षोपाय है?",
          mr: "प्रत्येक मतदार एकटा, पडद्यामागे आपली निवड चिन्हांकित करतो, आणि कोणाला सांगायला वा कोणासाठी मत दिले उघड करायला भाग पाडता येत नाही. हा मताचा कोणता सुरक्षाकवच?",
        },
        statement: {
          en: "The secret ballot lets each voter cast their vote in private, so no one can know or dictate whom they chose — freeing the vote from bribery, pressure and intimidation.",
          hi: "गुप्त मतदान हर मतदाता को निजी रूप से मत डालने देता, अतः कोई नहीं जान या तय कर सकता उन्होंने किसे चुना — मत को रिश्वत, दबाव और धमकी से मुक्त करते।",
          mr: "गुप्त मतदान प्रत्येक मतदाराला खाजगीत मत टाकू देते, म्हणून कोणी जाणू वा ठरवू शकत नाही त्यांनी कोणाला निवडले — मत लाच, दाब आणि धमकीपासून मुक्त करत.",
        },
        detail: {
          en: "Without secrecy a powerful landlord or employer could watch how people voted and punish those who defied them, so the private vote is what makes it truly free.",
          hi: "गोपनीयता बिना एक शक्तिशाली ज़मींदार या नियोक्ता देख सकता लोगों ने कैसे मत दिया और जिन्होंने अवज्ञा की उन्हें दंडित करे, अतः निजी मत ही जो इसे सचमुच मुक्त बनाता।",
          mr: "गोपनीयतेविना एक शक्तिशाली जमीनदार वा मालक पाहू शकतो लोकांनी कसे मत दिले आणि ज्यांनी अवज्ञा केली त्यांना शिक्षा करेल, म्हणून खाजगी मतच जे त्याला खरोखर मुक्त बनवते.",
        },
        extra: {
          en: "In India the vote is now cast on an electronic voting machine, but the same principle holds — the choice is made alone and stays secret.",
          hi: "भारत में मत अब इलेक्ट्रॉनिक मतदान मशीन पर डाला जाता, पर वही सिद्धांत टिका — चुनाव अकेले किया और गुप्त रहता।",
          mr: "भारतात मत आता इलेक्ट्रॉनिक मतदान यंत्रावर टाकले जाते, पण तेच तत्त्व टिकते — निवड एकट्याने केली आणि गुप्त राहते.",
        },
        pair: {
          left: {
            en: "Voting in private, free from pressure",
            hi: "निजी रूप से मत, दबाव से मुक्त",
            mr: "खाजगीत मत, दाबापासून मुक्त",
          },
          right: {
            en: "the secret ballot",
            hi: "गुप्त मतदान",
            mr: "गुप्त मतदान",
          },
        },
      },
      {
        id: "election-commission",
        name: {
          en: "The Election Commission",
          hi: "निर्वाचन आयोग",
          mr: "निवडणूक आयोग",
        },
        kind: "body",
        prompt: {
          en: "An independent authority, free of government control, organises and oversees India's elections — drawing up voter lists, fixing dates, running the poll and enforcing fair conduct. What is this body called?",
          hi: "एक स्वतंत्र प्राधिकरण, सरकारी नियंत्रण से मुक्त, भारत के चुनाव आयोजित-निगरानी करता — मतदाता सूचियाँ बनाते, तारीख़ें तय करते, मतदान चलाते और निष्पक्ष आचरण लागू करते। इस निकाय को क्या कहते?",
          mr: "एक स्वतंत्र प्राधिकरण, सरकारी नियंत्रणापासून मुक्त, भारताच्या निवडणुका आयोजित-देखरेख करते — मतदार याद्या बनवत, तारखा ठरवत, मतदान चालवत आणि निष्पक्ष आचरण अंमलात आणत. या निकायाला काय म्हणतात?",
        },
        statement: {
          en: "The Election Commission is an independent authority, free of government control, that conducts and supervises elections — preparing voter rolls, setting the schedule, running polling, and enforcing the code of fair conduct.",
          hi: "निर्वाचन आयोग एक स्वतंत्र प्राधिकरण, सरकारी नियंत्रण से मुक्त, जो चुनाव कराता-निगरानी करता — मतदाता सूचियाँ तैयार करते, कार्यक्रम तय करते, मतदान चलाते, और निष्पक्ष आचरण संहिता लागू करते।",
          mr: "निवडणूक आयोग एक स्वतंत्र प्राधिकरण, सरकारी नियंत्रणापासून मुक्त, जे निवडणुका घेते-देखरेख करते — मतदार याद्या तयार करत, वेळापत्रक ठरवत, मतदान चालवत, आणि निष्पक्ष आचरण संहिता अंमलात आणत.",
        },
        detail: {
          en: "Its independence is the key — because it does not take orders from the ruling party, it can order a re-poll, punish cheating, or even scold the government.",
          hi: "इसकी स्वतंत्रता कुंजी — क्योंकि यह सत्ताधारी दल के आदेश नहीं लेता, यह पुनर्मतदान आदेश दे सकता, धाँधली दंडित कर सकता, या सरकार को भी डाँट सकता।",
          mr: "त्याचे स्वातंत्र्य किल्ली — कारण ते सत्ताधारी पक्षाचे आदेश घेत नाही, ते फेरमतदान आदेश देऊ शकते, फसवणूक शिक्षा करू शकते, किंवा सरकारलाही खडसावू शकते.",
        },
        extra: {
          en: "It is because the referee is independent of the players that Indians can trust an election result even when their own side loses.",
          hi: "क्योंकि रेफ़री खिलाड़ियों से स्वतंत्र इसीलिए भारतीय चुनाव परिणाम पर भरोसा कर सकते भले उनका अपना पक्ष हारे।",
          mr: "कारण पंच खेळाडूंपासून स्वतंत्र म्हणूनच भारतीय निवडणूक निकालावर विश्वास ठेवू शकतात जरी त्यांची स्वतःची बाजू हरली.",
        },
        pair: {
          left: {
            en: "An independent referee running the elections",
            hi: "चुनाव चलाता स्वतंत्र रेफ़री",
            mr: "निवडणुका चालवणारा स्वतंत्र पंच",
          },
          right: {
            en: "the Election Commission",
            hi: "निर्वाचन आयोग",
            mr: "निवडणूक आयोग",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In India certain constituencies are 'reserved', meaning only candidates from the Scheduled Castes or Scheduled Tribes may contest them. Some object that this is unfair to other candidates. What is the reasoning behind reservation?",
          hi: "भारत में कुछ निर्वाचन-क्षेत्र 'आरक्षित', अर्थ केवल अनुसूचित जाति या अनुसूचित जनजाति के उम्मीदवार उनमें लड़ सकते। कुछ आपत्ति करते यह अन्य उम्मीदवारों के लिए अनुचित। आरक्षण के पीछे तर्क क्या?",
          mr: "भारतात काही मतदारसंघ 'राखीव', अर्थ फक्त अनुसूचित जाती वा अनुसूचित जमातींचे उमेदवार त्यांत लढू शकतात. काही आक्षेप घेतात हे इतर उमेदवारांसाठी अन्याय्य. राखीवतेमागील तर्क काय?",
        },
        choices: [
          {
            en: "Weaker, long-oppressed groups might rarely win in an open contest against dominant communities with more money and influence; reserving some seats ensures they actually reach the legislature and can speak for themselves, making representation genuinely inclusive",
            hi: "कमज़ोर, लंबे-उत्पीड़ित समूह अधिक धन-प्रभाव वाले प्रभावी समुदायों के विरुद्ध खुले मुक़ाबले में शायद ही जीतें; कुछ सीटें आरक्षित करना सुनिश्चित करता वे वास्तव में विधायिका पहुँचें और स्वयं के लिए बोल सकें, प्रतिनिधित्व सचमुच समावेशी बनाते",
            mr: "दुर्बल, दीर्घ-अत्याचारित गट अधिक पैसा-प्रभाव असलेल्या वर्चस्वी समुदायांविरुद्ध खुल्या स्पर्धेत क्वचित जिंकतील; काही जागा राखीव करणे सुनिश्चित करते ते प्रत्यक्षात विधिमंडळ गाठतात आणि स्वतःसाठी बोलू शकतात, प्रतिनिधित्व खरोखर समावेशक बनवत",
          },
          {
            en: "It is meant to stop Scheduled Caste and Tribe voters from voting at all",
            hi: "यह अनुसूचित जाति-जनजाति मतदाताओं को बिलकुल मत देने से रोकने को",
            mr: "हे अनुसूचित जाती-जमाती मतदारांना मुळीच मत देण्यापासून रोखायला",
          },
          {
            en: "Reserved seats let only these groups vote, and no one else",
            hi: "आरक्षित सीटें केवल इन समूहों को मत देने देतीं, और किसी को नहीं",
            mr: "राखीव जागा फक्त या गटांना मत देऊ देतात, आणि कोणाला नाही",
          },
          {
            en: "It is a way to give these groups more than one vote each",
            hi: "यह इन समूहों को हर एक को एक से अधिक मत देने का तरीक़ा",
            mr: "हे या गटांना प्रत्येकाला एकाहून अधिक मत देण्याचा मार्ग",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Reservation of constituencies is best understood as a fix for a real weakness in plain majority elections. In an open contest, the candidate with the most votes wins — which usually favours the largest and most powerful communities, those with more money, land, social influence and numbers. The Scheduled Castes and Scheduled Tribes have faced centuries of discrimination and disadvantage, and in many areas they are a minority scattered among more dominant groups. If every seat were an open fight, it could happen that very few of their members ever won, leaving these communities almost voiceless in the very body that makes the laws affecting them. Reservation prevents that. In a reserved constituency, all voters — of every community — still cast their votes, so it is fully democratic in that sense; the only restriction is that the candidates must come from the Scheduled Caste or Tribe. This guarantees that a fair number of representatives from these groups actually reach the legislature and can raise the concerns of their people directly. It is not extra votes, nor a bar on anyone voting; it is a way of making sure the legislature reflects the whole of society, including its weakest sections, rather than only its strongest. Far from being unfair, it is a deliberate correction so that the promise of equal representation reaches groups that a purely open contest would tend to leave out. Notably, it is meant to be a temporary measure, to be revisited as society becomes more equal.",
          hi: "निर्वाचन-क्षेत्रों का आरक्षण सादे बहुमत चुनावों की एक असली कमज़ोरी के सुधार के रूप में सबसे अच्छा समझा जाता। खुले मुक़ाबले में, सबसे अधिक मत वाला उम्मीदवार जीतता — जो आमतौर पर सबसे बड़े-शक्तिशाली समुदायों को पक्ष देता, जिनके पास अधिक धन, भूमि, सामाजिक प्रभाव और संख्या। अनुसूचित जाति-जनजाति ने सदियों भेदभाव-वंचना झेली, और कई क्षेत्रों में वे अधिक प्रभावी समूहों के बीच बिखरे अल्पमत। यदि हर सीट खुली लड़ाई होती, हो सकता उनके बहुत कम सदस्य कभी जीतें, इन समुदायों को उसी निकाय में लगभग आवाज़हीन छोड़ते जो उन्हें प्रभावित करते क़ानून बनाता। आरक्षण इसे रोकता। आरक्षित निर्वाचन-क्षेत्र में, हर समुदाय के सभी मतदाता अब भी मत डालते, अतः उस अर्थ में पूर्णतः लोकतांत्रिक; एकमात्र प्रतिबंध कि उम्मीदवार अनुसूचित जाति या जनजाति से आएँ। यह गारंटी करता इन समूहों के उचित संख्या प्रतिनिधि वास्तव में विधायिका पहुँचें और अपने लोगों की चिंताएँ सीधे उठा सकें। यह अतिरिक्त मत नहीं, न किसी के मत देने पर रोक; यह सुनिश्चित करने का तरीक़ा कि विधायिका पूरे समाज को दर्शाए, अपने कमज़ोर वर्गों समेत, न कि केवल सबसे मज़बूत को। अनुचित होने से दूर, यह एक जान-बूझकर सुधार ताकि समान प्रतिनिधित्व का वादा उन समूहों तक पहुँचे जिन्हें विशुद्ध खुला मुक़ाबला छोड़ने की प्रवृत्ति रखता। ध्यान देने योग्य, यह अस्थायी उपाय माना जाता, समाज के अधिक समान होते पुनर्विचार को।",
          mr: "मतदारसंघांचे राखीवीकरण साध्या बहुमत निवडणुकांतील एका खऱ्या कमजोरीचा उपाय म्हणून उत्तम समजले जाते. खुल्या स्पर्धेत, सर्वांत अधिक मते असलेला उमेदवार जिंकतो — जो सहसा सर्वांत मोठ्या-शक्तिशाली समुदायांना बाजू देतो, ज्यांच्याकडे अधिक पैसा, जमीन, सामाजिक प्रभाव आणि संख्या. अनुसूचित जाती-जमातींनी शतकानुशतके भेदभाव-वंचना सोसली, आणि अनेक भागांत ते अधिक वर्चस्वी गटांमध्ये विखुरलेले अल्पमत. जर प्रत्येक जागा खुली लढाई असती, होऊ शकते त्यांचे फार कमी सदस्य कधी जिंकतील, या समुदायांना त्याच निकायात जवळपास आवाजहीन सोडत जो त्यांना प्रभावित करणारे कायदे बनवतो. राखीवीकरण हे रोखते. राखीव मतदारसंघात, प्रत्येक समुदायाचे सर्व मतदार अजून मत टाकतात, म्हणून त्या अर्थाने पूर्णपणे लोकशाही; एकमेव निर्बंध की उमेदवार अनुसूचित जाती वा जमातीतून यावेत. हे हमी देते या गटांचे न्याय्य संख्येने प्रतिनिधी प्रत्यक्षात विधिमंडळ गाठतात आणि आपल्या लोकांच्या चिंता थेट मांडू शकतात. हे अतिरिक्त मते नव्हे, ना कोणाच्या मत देण्यावर बंदी; हे सुनिश्चित करण्याचा मार्ग की विधिमंडळ अख्ख्या समाजाला प्रतिबिंबित करते, आपल्या दुर्बल वर्गांसह, न की फक्त सर्वांत बलवानाला. अन्याय्य असण्यापासून दूर, हे एक जाणीवपूर्वक सुधारणा जेणेकरून समान प्रतिनिधित्वाचे वचन त्या गटांपर्यंत पोहोचते ज्यांना विशुद्ध खुली स्पर्धा वगळण्याची प्रवृत्ती ठेवते. लक्षणीय, हे तात्पुरते उपाय मानले जाते, समाज अधिक समान होताना पुनर्विचाराला.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Many countries hold elections, but only some are counted as genuinely 'free and fair'. Beyond simply letting people vote, what conditions must an election meet to deserve that description?",
          hi: "कई देश चुनाव कराते, पर केवल कुछ सचमुच 'मुक्त और निष्पक्ष' गिने जाते। केवल लोगों को मत देने देने से परे, उस वर्णन के योग्य होने को चुनाव को कौन-सी शर्तें पूरी करनी चाहिए?",
          mr: "अनेक देश निवडणुका घेतात, पण फक्त काही खरोखर 'मुक्त आणि निष्पक्ष' मोजल्या जातात. केवळ लोकांना मत देऊ देण्यापलीकडे, त्या वर्णनाला पात्र होण्यासाठी निवडणुकीने कोणत्या अटी पूर्ण कराव्यात?",
        },
        choices: [
          {
            en: "Every adult must have one equal vote; there must be a real choice of parties competing on fair terms; the vote must be secret and free of intimidation; an independent authority must run the poll honestly; and — the ultimate test — the losers must accept the result, so power actually changes hands when the people so decide",
            hi: "हर वयस्क का एक बराबर मत हो; निष्पक्ष शर्तों पर मुक़ाबला करते दलों का असली विकल्प हो; मत गुप्त और धमकी से मुक्त हो; एक स्वतंत्र प्राधिकरण मतदान ईमानदारी से चलाए; और — परम परख — हारने वाले परिणाम स्वीकारें, अतः जब जनता तय करे शक्ति वास्तव में हाथ बदले",
            mr: "प्रत्येक प्रौढाचे एक समान मत असावे; निष्पक्ष अटींवर स्पर्धा करणाऱ्या पक्षांची खरी निवड असावी; मत गुप्त आणि धमकीपासून मुक्त असावे; एक स्वतंत्र प्राधिकरण मतदान प्रामाणिकपणे चालवावे; आणि — अंतिम परीक्षा — हरणाऱ्यांनी निकाल स्वीकारावा, म्हणून जेव्हा जनता ठरवते शक्ती प्रत्यक्षात हात बदलते",
          },
          {
            en: "The only requirement is that voting takes place on a single day",
            hi: "एकमात्र शर्त कि मतदान एक ही दिन हो",
            mr: "एकमेव अट की मतदान एकाच दिवशी व्हावे",
          },
          {
            en: "An election is free and fair only if the ruling party always wins",
            hi: "चुनाव मुक्त-निष्पक्ष केवल यदि सत्ताधारी दल सदा जीते",
            mr: "निवडणूक मुक्त-निष्पक्ष फक्त जर सत्ताधारी पक्ष नेहमी जिंकतो",
          },
          {
            en: "Fairness just means printing enough ballot papers for everyone",
            hi: "निष्पक्षता बस सबके लिए पर्याप्त मतपत्र छापना",
            mr: "निष्पक्षता फक्त सर्वांसाठी पुरेशी मतपत्रे छापणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Holding a vote is only the visible tip of a free and fair election; underneath it must satisfy several conditions, each of which can be quietly broken to rig an outcome while keeping the appearance of democracy. First, political equality: every adult must have the vote and every vote must count the same, or some people's voices are worth more than others'. Second, a genuine choice: more than one party or candidate must be able to stand, competing on reasonably fair terms, so voters can actually pick an alternative and turn the rulers out — a contest with only one real option is a sham. Third, freedom of the vote itself: the ballot must be secret and cast without bribery, threats or intimidation, so people vote their conscience rather than what a landlord, employer or gang demands. Fourth, a fair, independent umpire: an Election Commission free of the ruling party's control must draw up honest voter lists, fix the rules, run the polling and count, and punish cheating, so the referee is not on one team's side. And fifth — the deepest test of all — the result must be accepted by the losers, and power must genuinely change hands when the people vote for change. An election where the sitting government can never actually lose, or simply refuses to step down when it does, is not free and fair no matter how many ballots are cast. Put together, these conditions distinguish a real democratic election from its many imitations: the point is not the ritual of voting but whether the people can, in reality, choose and change their rulers.",
          hi: "मत लेना मुक्त-निष्पक्ष चुनाव का केवल दृश्य शिखर; नीचे इसे कई शर्तें पूरी करनी चाहिए, हर एक चुपचाप तोड़ी जा सकती परिणाम धाँधली को लोकतंत्र का रूप रखते। पहला, राजनीतिक समानता: हर वयस्क का मत हो और हर मत बराबर गिने, वरना कुछ लोगों की आवाज़ें दूसरों से अधिक मूल्य की। दूसरा, असली विकल्प: एक से अधिक दल या उम्मीदवार खड़े हो सकें, यथोचित निष्पक्ष शर्तों पर मुक़ाबला करते, ताकि मतदाता वास्तव में विकल्प चुन और शासकों को हटा सकें — केवल एक असली विकल्प वाला मुक़ाबला ढोंग। तीसरा, मत की स्वतंत्रता: मतपत्र गुप्त और रिश्वत, धमकी या डर बिना डाला जाए, ताकि लोग अपनी अंतरात्मा से मत दें न कि जो ज़मींदार, नियोक्ता या गिरोह माँगे। चौथा, निष्पक्ष, स्वतंत्र अंपायर: सत्ताधारी दल के नियंत्रण से मुक्त निर्वाचन आयोग ईमानदार मतदाता सूचियाँ बनाए, नियम तय करे, मतदान-गिनती चलाए, और धाँधली दंडित करे, ताकि रेफ़री एक टीम के पक्ष में न हो। और पाँचवाँ — सबसे गहरी परख — परिणाम हारने वालों द्वारा स्वीकारा जाए, और जब जनता परिवर्तन को मत दे शक्ति सचमुच हाथ बदले। ऐसा चुनाव जहाँ बैठी सरकार वास्तव में कभी हार न सके, या हारने पर बस उतरने से मना करे, मुक्त-निष्पक्ष नहीं चाहे कितने मत डाले। मिलकर, ये शर्तें असली लोकतांत्रिक चुनाव को उसकी कई नक़लों से अलग करतीं: बात मतदान का कर्मकांड नहीं बल्कि क्या जनता, वास्तव में, अपने शासक चुन और बदल सकती।",
          mr: "मत घेणे मुक्त-निष्पक्ष निवडणुकीचे फक्त दृश्य शिखर; खाली तिने अनेक अटी पूर्ण कराव्यात, प्रत्येक गुपचूप मोडता येते निकाल फसवायला लोकशाहीचे रूप राखत. पहिले, राजकीय समानता: प्रत्येक प्रौढाचे मत असावे आणि प्रत्येक मत समान मोजावे, अन्यथा काही लोकांचे आवाज इतरांहून अधिक मूल्याचे. दुसरे, खरी निवड: एकाहून अधिक पक्ष वा उमेदवार उभे राहू शकावेत, वाजवी निष्पक्ष अटींवर स्पर्धा करत, जेणेकरून मतदार प्रत्यक्षात पर्याय निवडू आणि शासकांना हटवू शकतील — फक्त एका खऱ्या पर्यायाची स्पर्धा ढोंग. तिसरे, मताचे स्वातंत्र्य: मतपत्र गुप्त आणि लाच, धमकी वा भीतीविना टाकावे, जेणेकरून लोक आपल्या सद्सद्विवेकाने मत देतात न की जमीनदार, मालक वा टोळी मागते ते. चौथे, निष्पक्ष, स्वतंत्र पंच: सत्ताधारी पक्षाच्या नियंत्रणापासून मुक्त निवडणूक आयोग प्रामाणिक मतदार याद्या बनवावा, नियम ठरवावा, मतदान-मोजणी चालवावा, आणि फसवणूक शिक्षा करावा, जेणेकरून पंच एका संघाच्या बाजूचा नसावा. आणि पाचवे — सर्वांत सखोल परीक्षा — निकाल हरणाऱ्यांनी स्वीकारावा, आणि जेव्हा जनता बदलाला मत देते शक्ती खरोखर हात बदलावी. अशी निवडणूक जिथे बसलेले सरकार प्रत्यक्षात कधी हरू शकत नाही, किंवा हरल्यावर फक्त उतरायला नकार देते, मुक्त-निष्पक्ष नाही कितीही मते टाकली तरी. एकत्र, या अटी खऱ्या लोकशाही निवडणुकीला तिच्या अनेक नकलांपासून वेगळे करतात: मुद्दा मतदानाचा विधी नव्हे तर जनता, प्रत्यक्षात, आपले शासक निवडू आणि बदलू शकते का.",
        },
      },
    ],
  },
];
