/**
 * Class 12 Physics — NCERT, chapter by chapter, and the grade where the cause
 * of a force stops being the other body.
 *
 * Class 11 could always point at what was pushing: a hand, a rope, a surface,
 * the Earth. Class 12 opens by taking that away. Two charges a metre apart
 * touch nothing, and the honest description is that each one alters the space
 * around it and the other responds to the space it finds itself in. That is a
 * FIELD, and once it is admitted the rest of the year follows from it: a
 * potential is the field integrated along a path, a capacitor is a field
 * stored, a current is charge moving through a field inside a wire, and a
 * changing magnetic field turns out to be able to drive one.
 *
 * The authoring consequence is that the conceptual half of these chapters is
 * carrying more weight than in Class 11. "Why can two field lines never cross"
 * and "why is the field inside a conductor zero however the charge is arranged"
 * are not softer versions of the numerical questions — they are the reason the
 * numerical questions are allowed to use the formula they use. So each chapter
 * is a `generateChapter` ladder with `withNumeric` problems appended, as in
 * Class 11, but the fact tables here are deliberately about mechanism rather
 * than about vocabulary.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";
import type { NumQ } from "./numeric";
import { unit } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Physics Part I (Class 12)";
const LICENCE = "CC-BY-SA-4.0";

const newtons = unit("N");
const volts = unit("V");
const amperes = unit("A");
const ohms = unit("Ω");

export const G12_PHYSICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Electric Charges and Fields                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-electric-charges-and-fields",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 1 — Electric Charges and Fields",
      hi: "अध्याय 1 — विद्युत आवेश तथा क्षेत्र",
      mr: "प्रकरण 1 — विद्युत प्रभार आणि क्षेत्र",
    },
    name: {
      en: "Electric Charges and Fields",
      hi: "विद्युत आवेश तथा क्षेत्र",
      mr: "विद्युत प्रभार आणि क्षेत्र",
    },
    summary: {
      en: "A quantity that comes only in whole multiples of one indivisible amount, that the universe can move about but never create, and that adds like an ordinary number so two of them can cancel to nothing; a force between two such charges that falls as the square of the distance and takes no notice of any third charge watching; and the decision to stop saying that one charge pushes another and start saying that each one changes the space around it — which is what makes a law about flux through a closed surface possible at all.",
      hi: "एक ऐसी राशि जो केवल एक अविभाज्य मात्रा के पूरे गुणकों में आती है, जिसे विश्व इधर-उधर कर सकता है पर कभी बना नहीं सकता, और जो साधारण संख्या की तरह जुड़ती है ताकि दो मिलकर शून्य हो सकें; दो ऐसे आवेशों के बीच वह बल जो दूरी के वर्ग के अनुपात में घटता है और पास खड़े किसी तीसरे आवेश को नहीं गिनता; और यह निर्णय कि अब यह कहना छोड़ो कि एक आवेश दूसरे को धकेलता है और यह कहना शुरू करो कि हर आवेश अपने चारों ओर के आकाश को बदल देता है — और यही किसी बंद पृष्ठ से फ्लक्स के नियम को संभव बनाता है।",
      mr: "अशी एक राशी जी केवळ एका अविभाज्य प्रमाणाच्या पूर्ण पटींत येते, जिला विश्व इकडून तिकडे हलवू शकते पण कधीच निर्माण करू शकत नाही, आणि जी साधारण संख्येसारखी जुळते म्हणून दोन मिळून शून्य होऊ शकतात; अशा दोन प्रभारांमधले ते बल जे अंतराच्या वर्गाच्या प्रमाणात घटते आणि जवळ उभ्या तिसऱ्या प्रभाराची दखल घेत नाही; आणि हा निर्णय की एक प्रभार दुसऱ्याला ढकलतो असे म्हणणे सोडून प्रत्येक प्रभार आपल्याभोवतीचा अवकाश बदलतो असे म्हणणे सुरू करा — आणि हेच बंद पृष्ठातून जाणाऱ्या फ्लक्सच्या नियमाला मुळात शक्य करते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "quantisation-of-charge",
        name: {
          en: "Quantisation of charge",
          hi: "आवेश का क्वांटमीकरण",
          mr: "प्रभाराचे पुंजीकरण",
        },
        kind: "property of charge",
        prompt: {
          en: "No body has ever been found carrying one and a half times the charge of an electron, or a third of it: every observed charge is a whole-number multiple of one fixed indivisible amount. Which property is this?",
          hi: "आज तक कोई पिंड ऐसा नहीं मिला जिस पर इलेक्ट्रॉन के आवेश का डेढ़ गुना हो, या उसका एक-तिहाई: हर देखा गया आवेश एक निश्चित अविभाज्य मात्रा का पूर्णांक गुणक है। यह कौन-सा गुणधर्म है?",
          mr: "आजवर असा कोणताही पदार्थ सापडलेला नाही ज्यावर इलेक्ट्रॉनच्या प्रभाराच्या दीडपट, वा त्याचा एक-तृतीयांश प्रभार असेल: प्रत्येक निरीक्षिलेला प्रभार एका ठराविक अविभाज्य प्रमाणाचा पूर्णांक पट आहे. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Quantisation of charge says every charge is q = ne with n a whole number and e = 1.6 × 10⁻¹⁹ C, so charge changes in jumps rather than continuously.",
          hi: "आवेश का क्वांटमीकरण कहता है कि हर आवेश q = ne है जिसमें n पूर्णांक और e = 1.6 × 10⁻¹⁹ C, अतः आवेश सतत नहीं, छलाँगों में बदलता है।",
          mr: "प्रभाराचे पुंजीकरण सांगते की प्रत्येक प्रभार q = ne आहे जिथे n पूर्णांक आणि e = 1.6 × 10⁻¹⁹ C, म्हणून प्रभार सलगपणे नव्हे तर उड्यांनी बदलतो.",
        },
        detail: {
          en: "The jump is so small that a charge of one microcoulomb already involves about 10¹³ electrons, which is why at laboratory scale charge behaves as if it flowed smoothly and the graininess never shows.",
          hi: "छलाँग इतनी छोटी है कि एक माइक्रोकूलॉम के आवेश में ही लगभग 10¹³ इलेक्ट्रॉन होते हैं, इसीलिए प्रयोगशाला के पैमाने पर आवेश ऐसा बरतता है मानो सतत बह रहा हो और दानेदारी कभी दिखती नहीं।",
          mr: "उडी इतकी लहान आहे की एका मायक्रोकुलोम प्रभारातच सुमारे 10¹³ इलेक्ट्रॉन असतात, म्हणूनच प्रयोगशाळेच्या मापावर प्रभार जणू सलग वाहतो असा वागतो आणि दाणेदारपणा कधी दिसत नाही.",
        },
        extra: {
          en: "It is an experimental finding, first pinned down by Millikan's oil-drop measurements, not something derived from the other laws of the chapter — the inverse-square force would work just as well if charge came in any amount at all.",
          hi: "यह प्रायोगिक खोज है, पहली बार मिलिकन की तेल-बूँद मापों से पकड़ी गई, अध्याय के दूसरे नियमों से निकाली गई बात नहीं — व्युत्क्रम-वर्ग बल तब भी उतना ही चलता अगर आवेश किसी भी मात्रा में आता।",
          mr: "हे प्रायोगिक निष्कर्ष आहे, प्रथम मिलिकनच्या तेल-थेंब मापनांनी पकडलेले, प्रकरणातल्या इतर नियमांतून काढलेले नव्हे — व्यस्त-वर्ग बल तेव्हाही तितकेच चालले असते जर प्रभार कोणत्याही प्रमाणात आला असता.",
        },
        pair: {
          left: {
            en: "Charge changes in steps, never by a fraction of a step",
            hi: "आवेश क़दमों में बदलता है, क़दम के अंश में कभी नहीं",
            mr: "प्रभार पावलांनी बदलतो, पावलाच्या अंशाने कधीच नाही",
          },
          right: {
            en: "quantisation of charge",
            hi: "आवेश का क्वांटमीकरण",
            mr: "प्रभाराचे पुंजीकरण",
          },
        },
      },
      {
        id: "conservation-of-charge",
        name: {
          en: "Conservation of charge",
          hi: "आवेश का संरक्षण",
          mr: "प्रभाराचे संधारण",
        },
        kind: "property of charge",
        prompt: {
          en: "Rubbing a glass rod with silk leaves the rod positive and the silk equally negative; nothing was made, something was moved. Which property is being illustrated?",
          hi: "काँच की छड़ को रेशम से रगड़ने पर छड़ धनात्मक और रेशम उतना ही ऋणात्मक हो जाता है; कुछ बना नहीं, कुछ हटा। कौन-सा गुणधर्म दिखाया जा रहा है?",
          mr: "काचेची कांडी रेशमाने घासल्यावर कांडी धन आणि रेशीम तितकेच ऋण होते; काही निर्माण झाले नाही, काहीतरी हलले. कोणता गुणधर्म दाखवला जात आहे?",
        },
        statement: {
          en: "Conservation of charge says the algebraic total charge of an isolated system never changes, so charge can only be transferred from one body to another or created in equal and opposite pairs.",
          hi: "आवेश का संरक्षण कहता है कि किसी विलगित निकाय का बीजगणितीय कुल आवेश कभी नहीं बदलता, अतः आवेश केवल एक पिंड से दूसरे में जा सकता है या बराबर और विपरीत युग्मों में बन सकता है।",
          mr: "प्रभाराचे संधारण सांगते की एकाकी संस्थेचा बीजगणितीय एकूण प्रभार कधीच बदलत नाही, म्हणून प्रभार केवळ एका पदार्थातून दुसऱ्यात जाऊ शकतो वा समान आणि विरुद्ध जोड्यांत निर्माण होऊ शकतो.",
        },
        detail: {
          en: "It holds even where particles themselves are created and destroyed: a photon becoming an electron and a positron has produced two new particles but no new charge, since the two cancel exactly.",
          hi: "यह वहाँ भी टिकता है जहाँ कण स्वयं बनते और नष्ट होते हैं: फ़ोटॉन से इलेक्ट्रॉन और पॉज़िट्रॉन बनने पर दो नए कण बने पर कोई नया आवेश नहीं, क्योंकि दोनों ठीक-ठीक कट जाते हैं।",
          mr: "हे तिथेही टिकते जिथे कणच निर्माण होतात आणि नष्ट होतात: फोटॉनपासून इलेक्ट्रॉन आणि पॉझिट्रॉन बनताना दोन नवे कण बनले पण नवा प्रभार नाही, कारण दोन्ही नेमके कापले जातात.",
        },
        extra: {
          en: "The word isolated is load-bearing: a single body's charge changes all the time, and the law is a claim about a closed boundary, not about any one object inside it.",
          hi: "विलगित शब्द भार उठा रहा है: किसी अकेले पिंड का आवेश हर समय बदलता है, और नियम एक बंद सीमा के बारे में दावा है, उसके भीतर किसी एक वस्तु के बारे में नहीं।",
          mr: "एकाकी हा शब्द भार उचलत आहे: कोणत्याही एकट्या पदार्थाचा प्रभार सतत बदलतो, आणि नियम हा बंद सीमेबद्दलचा दावा आहे, तिच्या आतल्या कोणत्याही एका वस्तूबद्दल नव्हे.",
        },
        pair: {
          left: {
            en: "Moved, never manufactured",
            hi: "हटाया गया, कभी बनाया नहीं",
            mr: "हलवलेला, कधीच घडवलेला नाही",
          },
          right: {
            en: "conservation of charge",
            hi: "आवेश का संरक्षण",
            mr: "प्रभाराचे संधारण",
          },
        },
      },
      {
        id: "additivity-of-charge",
        name: {
          en: "Additivity of charge",
          hi: "आवेश की योज्यता",
          mr: "प्रभाराची योगात्मकता",
        },
        kind: "property of charge",
        prompt: {
          en: "A body carrying +5 μC and one carrying −3 μC are joined; the pair now carries +2 μC, because the two amounts were added as ordinary signed numbers and not as lengths or directions. Which property is this?",
          hi: "+5 μC वाला पिंड और −3 μC वाला पिंड जोड़े जाते हैं; युग्म अब +2 μC रखता है, क्योंकि दोनों मात्राएँ साधारण चिह्नित संख्याओं की तरह जोड़ी गईं, लंबाइयों या दिशाओं की तरह नहीं। यह कौन-सा गुणधर्म है?",
          mr: "+5 μC असलेला पदार्थ आणि −3 μC असलेला पदार्थ जोडले जातात; जोडी आता +2 μC बाळगते, कारण दोन्ही प्रमाणे साधारण चिन्हांकित संख्यांप्रमाणे जोडली गेली, लांबीप्रमाणे वा दिशांप्रमाणे नव्हे. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Additivity of charge says total charge is the algebraic sum of the individual charges, because charge is a scalar carrying a sign rather than a vector carrying a direction.",
          hi: "आवेश की योज्यता कहती है कि कुल आवेश अलग-अलग आवेशों का बीजगणितीय योग है, क्योंकि आवेश दिशा वाला सदिश नहीं, चिह्न वाला अदिश है।",
          mr: "प्रभाराची योगात्मकता सांगते की एकूण प्रभार म्हणजे वेगवेगळ्या प्रभारांची बीजगणितीय बेरीज, कारण प्रभार दिशा बाळगणारा सदिश नसून चिन्ह बाळगणारा अदिश आहे.",
        },
        detail: {
          en: "This is where charge parts company with mass: two masses can only make a bigger mass, whereas two charges can make nothing at all, which is why most matter around us is electrically invisible.",
          hi: "यहीं आवेश द्रव्यमान से अलग हो जाता है: दो द्रव्यमान केवल बड़ा द्रव्यमान बना सकते हैं, जबकि दो आवेश कुछ भी नहीं बना सकते, इसीलिए हमारे आसपास का अधिकांश पदार्थ विद्युत् दृष्टि से अदृश्य है।",
          mr: "इथेच प्रभार वस्तुमानापासून वेगळा होतो: दोन वस्तुमाने केवळ मोठे वस्तुमान बनवू शकतात, तर दोन प्रभार काहीच बनवू शकत नाहीत, म्हणूनच आपल्या आजूबाजूचा बहुतांश पदार्थ विद्युतदृष्ट्या अदृश्य आहे.",
        },
        extra: {
          en: "It is also what lets a neutral body be treated as absent from an electrostatics problem even though it is packed with charge, since its enormous positive and negative totals cancel to the last electron.",
          hi: "यही उदासीन पिंड को स्थिरवैद्युत समस्या से ग़ैरहाज़िर मानने देता है, भले ही वह आवेश से भरा हो, क्योंकि उसके विशाल धन और ऋण योग अंतिम इलेक्ट्रॉन तक कट जाते हैं।",
          mr: "हेच उदासीन पदार्थाला स्थिरविद्युत प्रश्नातून गैरहजर मानू देते, जरी तो प्रभाराने भरलेला असला तरी, कारण त्याच्या प्रचंड धन आणि ऋण बेरजा शेवटच्या इलेक्ट्रॉनपर्यंत कापल्या जातात.",
        },
        pair: {
          left: {
            en: "Two of them can add up to none",
            hi: "दो मिलकर शून्य बन सकते हैं",
            mr: "दोन मिळून शून्य होऊ शकतात",
          },
          right: {
            en: "additivity of charge",
            hi: "आवेश की योज्यता",
            mr: "प्रभाराची योगात्मकता",
          },
        },
      },
      {
        id: "coulombs-law",
        name: {
          en: "Coulomb's law",
          hi: "कूलॉम का नियम",
          mr: "कुलोमचा नियम",
        },
        kind: "law",
        prompt: {
          en: "The force between two point charges acts along the line joining them and falls to a quarter when their separation is doubled. Which law states this?",
          hi: "दो बिंदु आवेशों के बीच बल उन्हें जोड़ने वाली रेखा के अनुदिश लगता है और दूरी दुगुनी करने पर चौथाई रह जाता है। यह कौन-सा नियम कहता है?",
          mr: "दोन बिंदु प्रभारांमधले बल त्यांना जोडणाऱ्या रेषेच्या दिशेने लागते आणि अंतर दुप्पट केल्यावर चतुर्थांश उरते. हा कोणता नियम सांगतो?",
        },
        statement: {
          en: "Coulomb's law gives F = kq₁q₂/r² directed along the line joining the two point charges, with k = 9 × 10⁹ N m²/C² in vacuum.",
          hi: "कूलॉम का नियम F = kq₁q₂/r² देता है, जो दोनों बिंदु आवेशों को जोड़ने वाली रेखा के अनुदिश है, और निर्वात में k = 9 × 10⁹ N m²/C².",
          mr: "कुलोमचा नियम F = kq₁q₂/r² देतो, जो दोन्ही बिंदु प्रभारांना जोडणाऱ्या रेषेच्या दिशेने असतो, आणि निर्वातात k = 9 × 10⁹ N m²/C².",
        },
        detail: {
          en: "It is stated for POINT charges, and applying it to two charged spheres held close together is wrong, because the charge on each redistributes once the other is near and the centres are no longer where the charge effectively sits.",
          hi: "यह बिंदु आवेशों के लिए कहा गया है, और पास-पास रखे दो आवेशित गोलों पर इसे लगाना ग़लत है, क्योंकि दूसरा पास आते ही हर एक पर आवेश फिर से बँट जाता है और केंद्र वह जगह नहीं रहते जहाँ आवेश प्रभावी रूप से बैठा है।",
          mr: "हा बिंदु प्रभारांसाठी सांगितलेला आहे, आणि जवळजवळ ठेवलेल्या दोन प्रभारित गोलांवर तो लावणे चूक आहे, कारण दुसरा जवळ येताच प्रत्येकावरचा प्रभार पुन्हा वाटला जातो आणि केंद्रे ती जागा राहत नाहीत जिथे प्रभार प्रभावीपणे बसला आहे.",
        },
        extra: {
          en: "Its exponent is exactly two rather than approximately two, and that exactness is tested not by measuring forces but by confirming that the field inside a closed charged conductor is zero — a consequence which would fail at once if the power were 2.001.",
          hi: "इसका घातांक लगभग दो नहीं, ठीक दो है, और यह ठीकपन बल नापकर नहीं बल्कि यह पुष्टि करके जाँचा जाता है कि बंद आवेशित चालक के भीतर क्षेत्र शून्य है — यह परिणाम घात 2.001 होते ही तुरंत टूट जाता।",
          mr: "याचा घातांक जवळपास दोन नव्हे तर नेमका दोन आहे, आणि हे नेमकेपण बल मोजून नव्हे तर बंद प्रभारित वाहकाच्या आत क्षेत्र शून्य आहे याची खात्री करून तपासले जाते — घात 2.001 असता तर हा निष्कर्ष लगेच कोसळला असता.",
        },
        pair: {
          left: {
            en: "Twice as far apart, a quarter as strong",
            hi: "दुगुनी दूरी, चौथाई बल",
            mr: "दुप्पट अंतर, चतुर्थांश बल",
          },
          right: {
            en: "Coulomb's law",
            hi: "कूलॉम का नियम",
            mr: "कुलोमचा नियम",
          },
        },
      },
      {
        id: "superposition-principle",
        name: {
          en: "The principle of superposition",
          hi: "अध्यारोपण का सिद्धांत",
          mr: "अध्यारोपणाचे तत्त्व",
        },
        kind: "law",
        prompt: {
          en: "The force one charge exerts on another is exactly what it would be if the other charges in the room had been taken away, so the total is found by adding the separate forces as vectors. Which principle is this?",
          hi: "एक आवेश दूसरे पर जो बल लगाता है वह ठीक वही है जो कमरे के बाक़ी आवेश हटा दिए जाने पर होता, अतः कुल बल अलग-अलग बलों को सदिश की तरह जोड़कर मिलता है। यह कौन-सा सिद्धांत है?",
          mr: "एक प्रभार दुसऱ्यावर जे बल लावतो ते नेमके तेच असते जे खोलीतले बाकीचे प्रभार काढून टाकले असते तर असते, म्हणून एकूण बल वेगवेगळी बले सदिशाप्रमाणे जोडून मिळते. हे कोणते तत्त्व?",
        },
        statement: {
          en: "The principle of superposition says the force between any two charges is unaffected by the presence of others, so the net force on a charge is the vector sum of the pairwise Coulomb forces.",
          hi: "अध्यारोपण का सिद्धांत कहता है कि किन्हीं दो आवेशों के बीच बल दूसरों की उपस्थिति से अप्रभावित रहता है, अतः किसी आवेश पर कुल बल युग्मवार कूलॉम बलों का सदिश योग है।",
          mr: "अध्यारोपणाचे तत्त्व सांगते की कोणत्याही दोन प्रभारांमधले बल इतरांच्या उपस्थितीने अप्रभावित राहते, म्हणून एखाद्या प्रभारावरचे एकूण बल जोडीनिहाय कुलोम बलांची सदिश बेरीज असते.",
        },
        detail: {
          en: "It is an independent experimental fact, not a corollary of Coulomb's law: a force law could perfectly well be inverse-square and still have a third charge weaken the pull between the first two.",
          hi: "यह स्वतंत्र प्रायोगिक तथ्य है, कूलॉम के नियम का उपसिद्धांत नहीं: कोई बल-नियम व्युत्क्रम-वर्ग होते हुए भी ऐसा हो सकता था कि तीसरा आवेश पहले दोनों के खिंचाव को कमज़ोर कर दे।",
          mr: "हे स्वतंत्र प्रायोगिक सत्य आहे, कुलोमच्या नियमाचा उपसिद्धांत नव्हे: एखादा बल-नियम व्यस्त-वर्ग असूनही असा असू शकला असता की तिसरा प्रभार पहिल्या दोघांतील ओढ कमकुवत करेल.",
        },
        extra: {
          en: "The vector sum is where marks are actually lost: adding 3 N and 4 N at right angles gives 5 N, and a student who adds the magnitudes has answered a question about scalars that was never asked.",
          hi: "सदिश योग ही वह जगह है जहाँ अंक वास्तव में जाते हैं: समकोण पर 3 N और 4 N जोड़ने पर 5 N मिलता है, और जो विद्यार्थी परिमाण जोड़ देता है उसने अदिशों का वह प्रश्न हल किया जो पूछा ही नहीं गया।",
          mr: "सदिश बेरीज हीच ती जागा जिथे गुण खरोखर जातात: काटकोनात 3 N आणि 4 N जोडल्यास 5 N मिळते, आणि जो विद्यार्थी परिमाणे जोडतो त्याने अदिशांचा तो प्रश्न सोडवला जो विचारलाच गेला नव्हता.",
        },
        pair: {
          left: {
            en: "Each pair behaves as if the others were absent",
            hi: "हर युग्म ऐसे बरतता है मानो बाक़ी हों ही नहीं",
            mr: "प्रत्येक जोडी अशी वागते जणू बाकीचे नाहीतच",
          },
          right: {
            en: "the principle of superposition",
            hi: "अध्यारोपण का सिद्धांत",
            mr: "अध्यारोपणाचे तत्त्व",
          },
        },
      },
      {
        id: "gauss-law",
        name: {
          en: "Gauss's law",
          hi: "गाउस का नियम",
          mr: "गॉसचा नियम",
        },
        kind: "law",
        prompt: {
          en: "The total outward flux through any closed surface equals the charge enclosed divided by ε₀, no matter what shape the surface has, where inside it the charge sits, or what other charges lie outside. Which law is this?",
          hi: "किसी भी बंद पृष्ठ से कुल बाहरगामी फ्लक्स घिरे आवेश बटा ε₀ के बराबर होता है, चाहे पृष्ठ का आकार कुछ भी हो, आवेश उसके भीतर कहीं भी बैठा हो, और बाहर कोई भी दूसरे आवेश हों। यह कौन-सा नियम है?",
          mr: "कोणत्याही बंद पृष्ठातून जाणारा एकूण बहिर्गामी फ्लक्स घेरलेला प्रभार भागिले ε₀ इतका असतो, पृष्ठाचा आकार कोणताही असो, प्रभार त्याच्या आत कुठेही बसलेला असो, आणि बाहेर कोणतेही इतर प्रभार असोत. हा कोणता नियम?",
        },
        statement: {
          en: "Gauss's law states that the net electric flux through a closed surface is q_enclosed/ε₀, which makes the flux independent of the surface's shape and of the position of the charge within it.",
          hi: "गाउस का नियम कहता है कि किसी बंद पृष्ठ से नेट विद्युत फ्लक्स q_घिरा/ε₀ है, जिससे फ्लक्स पृष्ठ के आकार और उसके भीतर आवेश की स्थिति से स्वतंत्र हो जाता है।",
          mr: "गॉसचा नियम सांगतो की बंद पृष्ठातून जाणारा निव्वळ विद्युत फ्लक्स q_घेरलेला/ε₀ आहे, ज्यामुळे फ्लक्स पृष्ठाच्या आकारापासून आणि त्याच्या आत प्रभाराच्या स्थानापासून स्वतंत्र होतो.",
        },
        detail: {
          en: "Charges outside the surface contribute nothing to the NET flux, because every line they send in through one part of the surface comes out through another, but they still change the field at each point on it.",
          hi: "पृष्ठ के बाहर के आवेश नेट फ्लक्स में कुछ नहीं जोड़ते, क्योंकि वे जो रेखा पृष्ठ के एक भाग से भीतर भेजते हैं वह दूसरे भाग से बाहर निकल जाती है, फिर भी वे उसके हर बिंदु पर क्षेत्र बदलते हैं।",
          mr: "पृष्ठाबाहेरचे प्रभार निव्वळ फ्लक्समध्ये काहीच जोडत नाहीत, कारण ते पृष्ठाच्या एका भागातून आत पाठवलेली प्रत्येक रेषा दुसऱ्या भागातून बाहेर पडते, तरीही ते त्याच्या प्रत्येक बिंदूवरचे क्षेत्र बदलतात.",
        },
        extra: {
          en: "It yields a field only where symmetry lets E be pulled out of the integral — a sphere, a long line, a large sheet — so it is a tool of enormous power and very narrow application.",
          hi: "यह क्षेत्र केवल वहीं देता है जहाँ सममिति E को समाकल से बाहर निकालने देती है — गोला, लंबी रेखा, बड़ी चादर — अतः यह अपार शक्ति और बहुत सँकरे प्रयोग का उपकरण है।",
          mr: "हा क्षेत्र केवळ तिथेच देतो जिथे सममिती E ला समाकलनाबाहेर काढू देते — गोल, लांब रेषा, मोठा पत्रा — म्हणून हे अफाट सामर्थ्याचे आणि अतिशय अरुंद वापराचे साधन आहे.",
        },
        pair: {
          left: {
            en: "The shape of the surface makes no difference to the total",
            hi: "पृष्ठ का आकार कुल पर कोई फ़र्क़ नहीं डालता",
            mr: "पृष्ठाचा आकार एकूणावर काहीच फरक पाडत नाही",
          },
          right: {
            en: "Gauss's law",
            hi: "गाउस का नियम",
            mr: "गॉसचा नियम",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In an examination answer a student draws two electric field lines that cross each other at a point P, explaining that the field there is simply the sum of the two directions. Why can this diagram never represent a real electrostatic field?",
          hi: "परीक्षा के उत्तर में एक विद्यार्थी दो विद्युत क्षेत्र रेखाएँ खींचता है जो बिंदु P पर एक-दूसरे को काटती हैं, यह कहकर कि वहाँ क्षेत्र बस दोनों दिशाओं का योग है। यह चित्र किसी वास्तविक स्थिरवैद्युत क्षेत्र को कभी क्यों नहीं दिखा सकता?",
          mr: "परीक्षेच्या उत्तरात एक विद्यार्थी दोन विद्युत क्षेत्ररेषा काढतो ज्या बिंदू P वर एकमेकांना छेदतात, असे सांगून की तिथे क्षेत्र म्हणजे फक्त दोन दिशांची बेरीज. हे चित्र कोणतेही खरे स्थिरविद्युत क्षेत्र कधीच का दाखवू शकत नाही?",
        },
        choices: [
          {
            en: "Because the tangent to a field line at a point gives the direction of the field there, so two lines crossing at P would give the field at P two different directions at once. The field is defined as the force per unit charge on a test charge placed at P, and that force has exactly one direction — a charge released at P cannot set off two ways. Superposition does not rescue the picture: two contributions at P add to a single resultant, and the correct diagram shows one line through P along that resultant",
            hi: "क्योंकि किसी बिंदु पर क्षेत्र रेखा की स्पर्श रेखा वहाँ क्षेत्र की दिशा देती है, अतः P पर काटती दो रेखाएँ P पर क्षेत्र को एक साथ दो भिन्न दिशाएँ दे देतीं। क्षेत्र की परिभाषा P पर रखे परीक्षण आवेश पर प्रति एकांक आवेश बल है, और उस बल की ठीक एक दिशा है — P पर छोड़ा गया आवेश दो ओर नहीं चल सकता। अध्यारोपण चित्र को नहीं बचाता: P पर दो अंश जुड़कर एक परिणामी बनते हैं, और सही चित्र उसी परिणामी के अनुदिश P से होकर एक ही रेखा दिखाता है",
            mr: "कारण एखाद्या बिंदूवर क्षेत्ररेषेची स्पर्शरेषा तिथल्या क्षेत्राची दिशा देते, म्हणून P वर छेदणाऱ्या दोन रेषा P वरच्या क्षेत्राला एकाच वेळी दोन वेगळ्या दिशा देतील. क्षेत्राची व्याख्या P वर ठेवलेल्या चाचणी प्रभारावरचे प्रति एकक प्रभार बल आहे, आणि त्या बलाला नेमकी एक दिशा आहे — P वर सोडलेला प्रभार दोन बाजूंना जाऊ शकत नाही. अध्यारोपण चित्राला वाचवत नाही: P वर दोन वाटे जुळून एक परिणामी बनतो, आणि बरोबर चित्र त्याच परिणामीच्या दिशेने P मधून एकच रेषा दाखवते",
          },
          {
            en: "Because field lines are drawn only from positive to negative charge, and two lines that cross would have to start at the same charge",
            hi: "क्योंकि क्षेत्र रेखाएँ केवल धन से ऋण आवेश तक खींची जाती हैं, और काटती दो रेखाओं को एक ही आवेश से शुरू होना पड़ता",
            mr: "कारण क्षेत्ररेषा केवळ धनापासून ऋण प्रभारापर्यंत काढल्या जातात, आणि छेदणाऱ्या दोन रेषांना एकाच प्रभारापासून सुरू व्हावे लागले असते",
          },
          {
            en: "Because the field at a crossing point would become infinite, and no real charge distribution produces an infinite field",
            hi: "क्योंकि कटान बिंदु पर क्षेत्र अनंत हो जाता, और कोई वास्तविक आवेश वितरण अनंत क्षेत्र नहीं देता",
            mr: "कारण छेदन बिंदूवर क्षेत्र अनंत झाले असते, आणि कोणतेही खरे प्रभार वितरण अनंत क्षेत्र देत नाही",
          },
          {
            en: "Because the number of lines drawn must be proportional to the charge, and crossing lines would be counted twice, giving the wrong charge",
            hi: "क्योंकि खींची गई रेखाओं की संख्या आवेश के समानुपाती होनी चाहिए, और काटती रेखाएँ दो बार गिनी जातीं, जिससे ग़लत आवेश मिलता",
            mr: "कारण काढलेल्या रेषांची संख्या प्रभाराशी समानुपाती असावी लागते, आणि छेदणाऱ्या रेषा दोनदा मोजल्या गेल्या असत्या, ज्यातून चुकीचा प्रभार मिळाला असता",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The argument is short, and it rests entirely on what a field line was invented to mean. A field line is not an object. It is a curve drawn so that its TANGENT at every point is the direction of the electric field at that point; the density of lines is then used, separately, to indicate the magnitude. So a diagram is a statement: at this point, the field points that way. Now put two lines through P. The first says the field at P points along its tangent; the second says the field at P points along a different tangent. Both cannot be true, because the electric field at a point is defined as the force per unit charge on a small test charge placed there, and a force is a single vector. Release a charge at P and it accelerates in exactly one direction. There is no experiment in which it goes both ways, so there is no field configuration the crossed diagram could be describing. The student's defence — that the field is the sum of the two directions — is where the misunderstanding sits, and it is worth stating precisely, because superposition IS a real principle and it does apply here. Superposition says that if a charge at A contributes E₁ at P and a charge at B contributes E₂ at P, the actual field at P is the vector sum E₁ + E₂. That sum is one vector. It is not two vectors kept side by side. The two contributions are a step in the calculation, not a feature of the answer; once they are added, the resultant has a single direction and the diagram must show a single line through P along it. Drawing E₁ and E₂ as two field lines confuses the working with the result. Two closely related facts follow from the same definition and are worth carrying together. Field lines cannot form closed loops in electrostatics, because a closed loop would let a charge be carried round and returned with more energy than it started with. And lines begin only on positive charges and end only on negative ones or at infinity, because a line that simply stopped in empty space would mark a point where the field abruptly ceased to exist. The one legitimate exception to the no-crossing rule is a point where the field is exactly zero — a null point between two like charges — since there the field has no direction to be ambiguous about, and several lines may be drawn approaching it. (The wrong answers cite true rules about field lines that do not bear on the question, or invent a consequence — an infinite field — that the crossing does not imply.)",
          hi: "तर्क छोटा है, और वह पूरी तरह इस पर टिका है कि क्षेत्र रेखा का अर्थ किसलिए गढ़ा गया था। क्षेत्र रेखा कोई वस्तु नहीं। वह ऐसी वक्र है जिसकी हर बिंदु पर स्पर्श रेखा उस बिंदु पर विद्युत क्षेत्र की दिशा हो; रेखाओं का घनत्व फिर अलग से परिमाण दिखाने के लिए काम आता है। अतः चित्र एक कथन है: इस बिंदु पर क्षेत्र उधर है। अब P से दो रेखाएँ निकालो। पहली कहती है P पर क्षेत्र उसकी स्पर्श रेखा के अनुदिश है; दूसरी कहती है P पर क्षेत्र किसी और स्पर्श रेखा के अनुदिश है। दोनों सच नहीं हो सकतीं, क्योंकि किसी बिंदु पर विद्युत क्षेत्र की परिभाषा वहाँ रखे छोटे परीक्षण आवेश पर प्रति एकांक आवेश बल है, और बल एक अकेला सदिश है। P पर आवेश छोड़ो और वह ठीक एक दिशा में त्वरित होता है। ऐसा कोई प्रयोग नहीं जिसमें वह दोनों ओर जाए, अतः ऐसी कोई क्षेत्र-रचना नहीं जिसे कटा हुआ चित्र बता रहा हो। विद्यार्थी का बचाव — कि क्षेत्र दोनों दिशाओं का योग है — वहीं ग़लतफ़हमी बैठी है, और उसे ठीक-ठीक कहना चाहिए, क्योंकि अध्यारोपण असली सिद्धांत है और यहाँ लागू भी होता है। अध्यारोपण कहता है कि यदि A का आवेश P पर E₁ देता है और B का आवेश P पर E₂ देता है, तो P पर वास्तविक क्षेत्र सदिश योग E₁ + E₂ है। वह योग एक सदिश है। वह अगल-बगल रखे दो सदिश नहीं। दोनों अंश गणना का एक चरण हैं, उत्तर का लक्षण नहीं; जोड़ते ही परिणामी की एक ही दिशा होती है और चित्र को P से होकर उसी के अनुदिश एक ही रेखा दिखानी चाहिए। E₁ और E₂ को दो क्षेत्र रेखाओं की तरह खींचना काम को परिणाम समझ लेना है। उसी परिभाषा से दो और निकट तथ्य निकलते हैं जिन्हें साथ रखना चाहिए। स्थिरवैद्युत में क्षेत्र रेखाएँ बंद लूप नहीं बना सकतीं, क्योंकि बंद लूप आवेश को घुमाकर आरंभ से अधिक ऊर्जा के साथ लौटा देता। और रेखाएँ केवल धन आवेशों से शुरू होकर ऋण आवेशों पर या अनंत पर ख़त्म होती हैं, क्योंकि खाली आकाश में यों ही रुक जाने वाली रेखा वह बिंदु दिखाती जहाँ क्षेत्र अचानक होना बंद हो गया। न-काटने के नियम का एक ही जायज़ अपवाद वह बिंदु है जहाँ क्षेत्र ठीक शून्य है — दो समान आवेशों के बीच का शून्य बिंदु — क्योंकि वहाँ क्षेत्र की कोई दिशा ही नहीं जिसमें दुविधा हो, और कई रेखाएँ उसकी ओर आती खींची जा सकती हैं। (ग़लत उत्तर क्षेत्र रेखाओं के सच्चे नियम गिनाते हैं जो प्रश्न से नहीं जुड़ते, या ऐसा परिणाम गढ़ते हैं — अनंत क्षेत्र — जो कटान से निकलता ही नहीं।)",
          mr: "युक्तिवाद छोटा आहे, आणि तो पूर्णपणे यावर टिकतो की क्षेत्ररेषेचा अर्थ कशासाठी घडवला गेला होता. क्षेत्ररेषा ही वस्तू नाही. ती अशी वक्र आहे जिची प्रत्येक बिंदूवरची स्पर्शरेषा त्या बिंदूवरच्या विद्युत क्षेत्राची दिशा असते; रेषांची घनता मग वेगळेपणाने परिमाण दाखवायला वापरली जाते. म्हणून चित्र हे एक विधान आहे: या बिंदूवर क्षेत्र तिकडे आहे. आता P मधून दोन रेषा काढा. पहिली म्हणते P वरचे क्षेत्र तिच्या स्पर्शरेषेच्या दिशेने आहे; दुसरी म्हणते P वरचे क्षेत्र दुसऱ्या स्पर्शरेषेच्या दिशेने आहे. दोन्ही खऱ्या असू शकत नाहीत, कारण एखाद्या बिंदूवरच्या विद्युत क्षेत्राची व्याख्या तिथे ठेवलेल्या लहान चाचणी प्रभारावरचे प्रति एकक प्रभार बल आहे, आणि बल हा एकच सदिश आहे. P वर प्रभार सोडा आणि तो नेमक्या एका दिशेने त्वरित होतो. असा कोणताही प्रयोग नाही ज्यात तो दोन्ही बाजूंना जाईल, म्हणून अशी कोणतीही क्षेत्र-रचना नाही जिचे वर्णन छेदलेले चित्र करत असेल. विद्यार्थ्याचा बचाव — की क्षेत्र म्हणजे दोन दिशांची बेरीज — तिथेच गैरसमज बसला आहे, आणि तो नेमकेपणाने सांगायला हवा, कारण अध्यारोपण हे खरे तत्त्व आहे आणि इथे लागूही होते. अध्यारोपण सांगते की जर A चा प्रभार P वर E₁ देतो आणि B चा प्रभार P वर E₂ देतो, तर P वरचे प्रत्यक्ष क्षेत्र सदिश बेरीज E₁ + E₂ आहे. ती बेरीज एक सदिश आहे. ती शेजारीशेजारी ठेवलेले दोन सदिश नव्हे. दोन्ही वाटे ही गणनेतली एक पायरी आहे, उत्तराचे वैशिष्ट्य नव्हे; जोडताच परिणामीला एकच दिशा असते आणि चित्राने P मधून त्याच दिशेने एकच रेषा दाखवली पाहिजे. E₁ आणि E₂ दोन क्षेत्ररेषा म्हणून काढणे म्हणजे कामाला निकाल समजणे. त्याच व्याख्येतून आणखी दोन जवळची सत्ये निघतात जी सोबत ठेवावीत. स्थिरविद्युतमध्ये क्षेत्ररेषा बंद वळसे बनवू शकत नाहीत, कारण बंद वळसा प्रभाराला फिरवून सुरुवातीहून अधिक ऊर्जेसह परत आणला असता. आणि रेषा केवळ धन प्रभारांपासून सुरू होऊन ऋण प्रभारांवर वा अनंतावर संपतात, कारण रिकाम्या अवकाशात नुसती थांबणारी रेषा तो बिंदू दाखवेल जिथे क्षेत्र अचानक असणे थांबले. न-छेदण्याच्या नियमाचा एकच रास्त अपवाद म्हणजे तो बिंदू जिथे क्षेत्र नेमके शून्य आहे — दोन सारख्या प्रभारांमधला शून्य बिंदू — कारण तिथे क्षेत्राला दिशाच नाही जिच्याबद्दल संदिग्धता असेल, आणि अनेक रेषा त्याच्याकडे येताना काढता येतात. (चुकीची उत्तरे क्षेत्ररेषांचे खरे नियम सांगतात जे प्रश्नाशी जुळत नाहीत, वा असा निष्कर्ष घडवतात — अनंत क्षेत्र — जो छेदनातून निघतच नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A charge q sits inside a closed surface S. A second, much larger charge Q is brought up and held just outside S. A student concludes that the flux through S must now increase, since the field at every point of S has clearly changed. Assess this.",
          hi: "एक आवेश q बंद पृष्ठ S के भीतर बैठा है। एक दूसरा, कहीं बड़ा आवेश Q लाकर S के ठीक बाहर रोक दिया जाता है। विद्यार्थी निष्कर्ष निकालता है कि अब S से फ्लक्स अवश्य बढ़ेगा, क्योंकि S के हर बिंदु पर क्षेत्र स्पष्टतः बदल गया है। इसका आकलन करो।",
          mr: "एक प्रभार q बंद पृष्ठ S च्या आत बसला आहे. दुसरा, कितीतरी मोठा प्रभार Q आणून S च्या अगदी बाहेर धरला जातो. विद्यार्थी निष्कर्ष काढतो की आता S मधून जाणारा फ्लक्स नक्कीच वाढेल, कारण S च्या प्रत्येक बिंदूवरचे क्षेत्र स्पष्टपणे बदलले आहे. याचे मूल्यमापन करा.",
        },
        choices: [
          {
            en: "The premise is right and the conclusion is wrong. The field at every point of S genuinely has changed — E is the superposition of the contributions of q and Q, and Q's contribution is not zero anywhere. But the NET flux is unchanged at q/ε₀, because Q lies outside: every field line it sends into S through one region emerges through another, so its inward and outward contributions cancel exactly when integrated over the whole closed surface. Flux is a property of the enclosed charge alone; the field is a property of all the charges. The two statements are compatible because flux is an integral, and an integral can be fixed while the function being integrated moves",
            hi: "आधार सही है और निष्कर्ष ग़लत। S के हर बिंदु पर क्षेत्र सचमुच बदल गया है — E, q और Q के अंशों का अध्यारोपण है, और Q का अंश कहीं भी शून्य नहीं। पर नेट फ्लक्स q/ε₀ पर अपरिवर्तित है, क्योंकि Q बाहर है: वह जो भी क्षेत्र रेखा एक भाग से S में भेजता है वह दूसरे भाग से निकल जाती है, अतः पूरे बंद पृष्ठ पर समाकलन करने पर उसके भीतरगामी और बाहरगामी अंश ठीक-ठीक कट जाते हैं। फ्लक्स केवल घिरे आवेश का गुण है; क्षेत्र सभी आवेशों का गुण है। दोनों कथन साथ रह सकते हैं क्योंकि फ्लक्स समाकल है, और समाकल स्थिर रह सकता है जबकि समाकलित फलन हिलता रहे",
            mr: "गृहीतक बरोबर आहे आणि निष्कर्ष चूक. S च्या प्रत्येक बिंदूवरचे क्षेत्र खरोखर बदलले आहे — E हे q आणि Q यांच्या वाट्यांचे अध्यारोपण आहे, आणि Q चा वाटा कुठेही शून्य नाही. पण निव्वळ फ्लक्स q/ε₀ वर अपरिवर्तित आहे, कारण Q बाहेर आहे: तो एका भागातून S मध्ये पाठवत असलेली प्रत्येक क्षेत्ररेषा दुसऱ्या भागातून बाहेर पडते, म्हणून संपूर्ण बंद पृष्ठावर समाकलन केल्यावर त्याचे अंतर्गामी आणि बहिर्गामी वाटे नेमके कापले जातात. फ्लक्स हा केवळ घेरलेल्या प्रभाराचा गुणधर्म; क्षेत्र हा सर्व प्रभारांचा गुणधर्म. दोन्ही विधाने एकत्र राहू शकतात कारण फ्लक्स हे समाकलन आहे, आणि समाकलन स्थिर राहू शकते जरी समाकलित फलन हलत असले तरी",
          },
          {
            en: "The student is right: since flux is the integral of E over S and E has changed everywhere on S, the integral must change too",
            hi: "विद्यार्थी सही है: चूँकि फ्लक्स S पर E का समाकल है और S पर हर जगह E बदल गया है, समाकल भी बदलना ही चाहिए",
            mr: "विद्यार्थी बरोबर आहे: फ्लक्स हे S वर E चे समाकलन असल्याने आणि S वर सर्वत्र E बदलल्याने, समाकलनही बदललेच पाहिजे",
          },
          {
            en: "Both the flux and the field are unchanged, because a charge outside a closed surface has no effect on anything inside or on the surface itself",
            hi: "फ्लक्स और क्षेत्र दोनों अपरिवर्तित हैं, क्योंकि बंद पृष्ठ के बाहर का आवेश भीतर या स्वयं पृष्ठ पर किसी चीज़ पर असर नहीं डालता",
            mr: "फ्लक्स आणि क्षेत्र दोन्ही अपरिवर्तित आहेत, कारण बंद पृष्ठाबाहेरचा प्रभार आत वा स्वतः पृष्ठावर कशावरही परिणाम करत नाही",
          },
          {
            en: "The flux increases only if Q is larger than q, since Gauss's law compares the enclosed charge with the nearest external one",
            hi: "फ्लक्स तभी बढ़ता है जब Q, q से बड़ा हो, क्योंकि गाउस का नियम घिरे आवेश की तुलना निकटतम बाहरी आवेश से करता है",
            mr: "फ्लक्स तेव्हाच वाढतो जेव्हा Q हा q हून मोठा असेल, कारण गॉसचा नियम घेरलेल्या प्रभाराची तुलना जवळच्या बाह्य प्रभाराशी करतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This question is built to separate two things that a first reading of Gauss's law tends to weld together: the FIELD on a surface and the FLUX through it. Start with what is undeniably true. The electric field is a superposition. At every point on S the field is now E_q + E_Q, and E_Q is nowhere zero — it is largest on the part of S nearest to Q and smallest on the far side, but it is present everywhere. If you were to measure the field at a chosen point of S with a tiny test charge, you would find a different answer before and after Q arrived. The student has seen this correctly. Now the flux. Flux is not the field; it is the integral of E·dA over the whole closed surface, and an integral is a single number extracted from a function that varies. There is no rule saying that changing the function everywhere must change its integral. Here it does not, and the reason is geometric rather than algebraic. Think of Q's field lines. They stream outward from Q, and some of them run into S. But S is a CLOSED surface: a line that enters must leave, because it cannot stop inside — there is no charge of Q's inside S for it to terminate on. So each such line contributes a negative flux where it enters, dA pointing outward against the field, and an equal positive flux where it exits. Summed over every line, Q's total contribution to the flux through S is exactly zero. What remains is q's own contribution, q/ε₀, unchanged. This is the content of the phrase 'charge enclosed' in the statement of the law, and it is doing more work than it looks. It is not merely a convenient simplification. It says that the total flux through a closed surface is a measure of the charge inside, and of nothing else — not of the shape of S, not of where inside S the charge sits, not of what is happening outside. This is why the law can be used backwards: if you can measure the flux, you know the interior charge, without knowing anything about the surroundings. The price is stated in the same breath. Because the flux is insensitive to so much, it cannot by itself tell you the field at any particular point of S. Gauss's law gives you E only when a symmetry argument lets you claim that E has the same magnitude everywhere on a well-chosen surface and points along dA — a spherical shell around a point charge, a cylinder around a long line, a box across a large sheet. Introduce Q just outside and that symmetry is destroyed: the law is still true, still gives flux q/ε₀, and is now useless for finding E. This is the practical distinction between a law that always holds and a method that only sometimes applies, and it is the reason a problem can be 'a Gauss's law problem' or not. (The second option treats an integral as if it tracked its integrand pointwise; the third denies the true half of the student's reasoning; the fourth invents a comparison between charges that appears nowhere in the law.)",
          hi: "यह प्रश्न दो चीज़ों को अलग करने के लिए बना है जिन्हें गाउस के नियम का पहला पाठ जोड़ देता है: पृष्ठ पर क्षेत्र और उससे होकर फ्लक्स। पहले वह लो जो निर्विवाद रूप से सच है। विद्युत क्षेत्र अध्यारोपण है। S के हर बिंदु पर क्षेत्र अब E_q + E_Q है, और E_Q कहीं भी शून्य नहीं — वह Q के निकटतम भाग पर सबसे बड़ा और दूर वाली ओर सबसे छोटा है, पर हर जगह मौजूद है। यदि तुम S के किसी चुने बिंदु पर छोटे परीक्षण आवेश से क्षेत्र नापो, तो Q के आने से पहले और बाद में भिन्न उत्तर मिलेगा। विद्यार्थी ने यह ठीक देखा है। अब फ्लक्स। फ्लक्स क्षेत्र नहीं; वह पूरे बंद पृष्ठ पर E·dA का समाकल है, और समाकल बदलते फलन से निकाली गई एक अकेली संख्या है। ऐसा कोई नियम नहीं कि फलन हर जगह बदले तो उसका समाकल भी बदले। यहाँ वह नहीं बदलता, और कारण बीजगणितीय नहीं, ज्यामितीय है। Q की क्षेत्र रेखाएँ सोचो। वे Q से बाहर की ओर बहती हैं, और कुछ S में जा घुसती हैं। पर S बंद पृष्ठ है: जो रेखा घुसती है उसे निकलना ही है, क्योंकि वह भीतर रुक नहीं सकती — S के भीतर Q का कोई आवेश नहीं जिस पर वह ख़त्म हो। अतः ऐसी हर रेखा जहाँ घुसती है वहाँ ऋण फ्लक्स देती है, dA क्षेत्र के विरुद्ध बाहर की ओर, और जहाँ निकलती है वहाँ उतना ही धन फ्लक्स। हर रेखा पर जोड़ो तो S से फ्लक्स में Q का कुल अंश ठीक शून्य है। बचता है q का अपना अंश, q/ε₀, अपरिवर्तित। नियम के कथन में 'घिरा आवेश' वाक्यांश का यही आशय है, और वह दिखने से अधिक काम कर रहा है। वह केवल सुविधाजनक सरलीकरण नहीं। वह कहता है कि बंद पृष्ठ से कुल फ्लक्स भीतर के आवेश की माप है, और किसी और चीज़ की नहीं — न S के आकार की, न S के भीतर आवेश की जगह की, न बाहर जो हो रहा है उसकी। इसीलिए नियम उल्टा भी काम आता है: यदि तुम फ्लक्स नाप सको, तो भीतर का आवेश जान गए, आसपास के बारे में कुछ जाने बिना। क़ीमत उसी साँस में कही गई है। चूँकि फ्लक्स इतनी सारी चीज़ों के प्रति असंवेदी है, वह अपने आप S के किसी विशेष बिंदु पर क्षेत्र नहीं बता सकता। गाउस का नियम E तभी देता है जब कोई सममिति तर्क तुम्हें यह दावा करने दे कि सुचुने पृष्ठ पर हर जगह E का परिमाण एक-सा है और वह dA के अनुदिश है — बिंदु आवेश के चारों ओर गोलीय कोश, लंबी रेखा के चारों ओर बेलन, बड़ी चादर के आर-पार डिब्बा। Q को ठीक बाहर ले आओ और वह सममिति नष्ट हो जाती है: नियम अब भी सच है, अब भी फ्लक्स q/ε₀ देता है, और अब E निकालने के लिए बेकार है। सदा टिकने वाले नियम और कभी-कभी लागू होने वाली विधि के बीच यही व्यावहारिक भेद है, और इसी से कोई समस्या 'गाउस के नियम की समस्या' होती है या नहीं। (दूसरा विकल्प समाकल को ऐसे बरतता है मानो वह अपने समाकल्य को बिंदु-दर-बिंदु ढोता हो; तीसरा विद्यार्थी के तर्क का सच्चा आधा भी नकार देता है; चौथा आवेशों के बीच ऐसी तुलना गढ़ता है जो नियम में कहीं नहीं।)",
          mr: "हा प्रश्न दोन गोष्टी वेगळ्या करण्यासाठी बांधलेला आहे ज्यांना गॉसच्या नियमाचे पहिले वाचन एकत्र चिकटवते: पृष्ठावरचे क्षेत्र आणि त्यातून जाणारा फ्लक्स. आधी जे निर्विवाद खरे आहे ते घ्या. विद्युत क्षेत्र हे अध्यारोपण आहे. S च्या प्रत्येक बिंदूवर क्षेत्र आता E_q + E_Q आहे, आणि E_Q कुठेही शून्य नाही — तो Q च्या सर्वांत जवळच्या भागावर सर्वांत मोठा आणि दूरच्या बाजूला सर्वांत लहान, पण सर्वत्र उपस्थित. जर तुम्ही S च्या निवडलेल्या बिंदूवर लहान चाचणी प्रभाराने क्षेत्र मोजले, तर Q येण्यापूर्वी आणि नंतर वेगळे उत्तर मिळेल. विद्यार्थ्याने हे बरोबर पाहिले आहे. आता फ्लक्स. फ्लक्स म्हणजे क्षेत्र नव्हे; ते संपूर्ण बंद पृष्ठावरील E·dA चे समाकलन आहे, आणि समाकलन ही बदलत्या फलनातून काढलेली एकच संख्या आहे. असा कोणताही नियम नाही की फलन सर्वत्र बदलले तर त्याचे समाकलनही बदलले पाहिजे. इथे ते बदलत नाही, आणि कारण बीजगणितीय नसून भूमितीय आहे. Q च्या क्षेत्ररेषा विचारात घ्या. त्या Q पासून बाहेर वाहतात, आणि काही S मध्ये शिरतात. पण S हे बंद पृष्ठ आहे: जी रेषा शिरते तिला बाहेर पडावेच लागते, कारण ती आत थांबू शकत नाही — S च्या आत Q चा कोणताही प्रभार नाही जिच्यावर ती संपेल. म्हणून अशी प्रत्येक रेषा जिथे शिरते तिथे ऋण फ्लक्स देते, dA क्षेत्राविरुद्ध बाहेरच्या दिशेने, आणि जिथे बाहेर पडते तिथे तितकाच धन फ्लक्स. प्रत्येक रेषेवर बेरीज केल्यास S मधून जाणाऱ्या फ्लक्समध्ये Q चा एकूण वाटा नेमका शून्य आहे. उरतो q चा स्वतःचा वाटा, q/ε₀, अपरिवर्तित. नियमाच्या विधानातील 'घेरलेला प्रभार' या वाक्यांशाचा हाच आशय, आणि तो दिसण्याहून अधिक काम करत आहे. ते केवळ सोयीचे सुलभीकरण नाही. ते सांगते की बंद पृष्ठातून जाणारा एकूण फ्लक्स हे आतल्या प्रभाराचे माप आहे, आणि दुसऱ्या कशाचेही नाही — S च्या आकाराचे नाही, S च्या आत प्रभार कुठे बसला याचे नाही, बाहेर काय घडत आहे याचे नाही. म्हणूनच नियम उलटाही वापरता येतो: जर तुम्ही फ्लक्स मोजू शकलात, तर आतला प्रभार कळला, आजूबाजूबद्दल काहीही न जाणता. किंमत त्याच श्वासात सांगितलेली आहे. फ्लक्स इतक्या साऱ्या गोष्टींबाबत असंवेदनशील असल्याने, तो स्वतःहून S च्या कोणत्याही विशिष्ट बिंदूवरचे क्षेत्र सांगू शकत नाही. गॉसचा नियम E तेव्हाच देतो जेव्हा एखादा सममिती-युक्तिवाद तुम्हाला असा दावा करू देतो की सुयोग्य निवडलेल्या पृष्ठावर सर्वत्र E चे परिमाण सारखे आहे आणि तो dA च्या दिशेने आहे — बिंदु प्रभाराभोवती गोलीय कवच, लांब रेषेभोवती दंडगोल, मोठ्या पत्र्याच्या आरपार पेटी. Q ला अगदी बाहेर आणा आणि ती सममिती नष्ट होते: नियम अजूनही खरा आहे, अजूनही फ्लक्स q/ε₀ देतो, आणि आता E काढण्यासाठी निरुपयोगी आहे. नेहमी टिकणारा नियम आणि कधीकधीच लागू होणारी पद्धत यांतील हाच व्यावहारिक भेद, आणि यामुळेच एखादा प्रश्न 'गॉसच्या नियमाचा प्रश्न' असतो वा नसतो. (दुसरा पर्याय समाकलनाला असे वागवतो जणू ते आपल्या समाकल्याचा बिंदूनिहाय मागोवा घेते; तिसरा विद्यार्थ्याच्या युक्तिवादाचा खरा अर्धा भागही नाकारतो; चौथा प्रभारांमधली अशी तुलना घडवतो जी नियमात कुठेही नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Electrostatic Potential and Capacitance                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-electrostatic-potential-and-capacitance",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 2 — Electrostatic Potential and Capacitance",
      hi: "अध्याय 2 — स्थिरवैद्युत विभव तथा धारिता",
      mr: "प्रकरण 2 — स्थिरविद्युत विभव आणि धारिता",
    },
    name: {
      en: "Electrostatic Potential and Capacitance",
      hi: "स्थिरवैद्युत विभव तथा धारिता",
      mr: "स्थिरविद्युत विभव आणि धारिता",
    },
    summary: {
      en: "Replacing a vector at every point of space with a single number at every point, which is possible only because the work done moving a charge does not depend on the route taken; surfaces on which that number is constant and which must therefore meet the field at right angles everywhere; a conductor that arranges its own charge until the number is the same throughout it and the field inside has vanished; a device built to hold charge at a chosen number of volts, whose capacity depends on geometry and not at all on how much charge is actually in it; and an insulating slab which, pushed between the plates, weakens the field it sits in and so lets the same voltage hold more.",
      hi: "आकाश के हर बिंदु पर सदिश की जगह हर बिंदु पर एक अकेली संख्या रखना, जो केवल इसलिए संभव है कि आवेश को हिलाने में किया गया कार्य लिए गए रास्ते पर निर्भर नहीं करता; वे पृष्ठ जिन पर वह संख्या अचर है और जिन्हें इसलिए हर जगह क्षेत्र से समकोण पर मिलना ही है; वह चालक जो अपना आवेश तब तक जमाता है जब तक संख्या उसमें हर जगह एक न हो जाए और भीतर का क्षेत्र लुप्त न हो जाए; वह युक्ति जो चुनी हुई वोल्ट संख्या पर आवेश रोकने को बनी है, जिसकी क्षमता ज्यामिति पर निर्भर है और उसमें वास्तव में कितना आवेश है इस पर बिलकुल नहीं; और वह विद्युतरोधी पट्टी जो प्लेटों के बीच ठेली जाने पर जिस क्षेत्र में बैठी है उसे कमज़ोर करती है और यों उसी वोल्टता को अधिक रोकने देती है।",
      mr: "अवकाशाच्या प्रत्येक बिंदूवरील सदिशाच्या जागी प्रत्येक बिंदूवर एकच संख्या ठेवणे, जे केवळ यामुळे शक्य आहे की प्रभार हलवण्यात केलेले कार्य घेतलेल्या मार्गावर अवलंबून नाही; ती पृष्ठे ज्यांवर ती संख्या अचल आहे आणि ज्यांना म्हणून सर्वत्र क्षेत्राला काटकोनात भेटावेच लागते; तो वाहक जो आपला प्रभार तोवर मांडतो जोवर संख्या त्याच्यात सर्वत्र एक होत नाही आणि आतले क्षेत्र नाहीसे होत नाही; ते साधन जे निवडलेल्या व्होल्ट संख्येवर प्रभार धरण्यासाठी बनवलेले, ज्याची क्षमता भूमितीवर अवलंबून आहे आणि त्यात प्रत्यक्षात किती प्रभार आहे यावर मुळीच नाही; आणि ती विद्युतरोधक पट्टी जी पट्ट्यांमध्ये ढकलल्यावर ज्या क्षेत्रात बसली आहे ते कमकुवत करते आणि अशा प्रकारे त्याच व्होल्टेजला अधिक धरू देते.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "electrostatic-potential",
        name: {
          en: "Electrostatic potential",
          hi: "स्थिरवैद्युत विभव",
          mr: "स्थिरविद्युत विभव",
        },
        kind: "defined quantity",
        prompt: {
          en: "The work an external agent must do, against the field and without acceleration, to carry one coulomb from infinity to a point — a single number at each point rather than three components. Which quantity is this?",
          hi: "वह कार्य जो बाहरी कर्ता को, क्षेत्र के विरुद्ध और बिना त्वरण के, एक कूलॉम को अनंत से किसी बिंदु तक ले जाने में करना पड़े — हर बिंदु पर तीन घटकों के बजाय एक अकेली संख्या। यह कौन-सी राशि है?",
          mr: "बाह्य कर्त्याला, क्षेत्राविरुद्ध आणि त्वरणाविना, एक कुलोम अनंतापासून एका बिंदूपर्यंत नेण्यासाठी करावे लागणारे कार्य — प्रत्येक बिंदूवर तीन घटकांऐवजी एकच संख्या. ही कोणती राशी?",
        },
        statement: {
          en: "Electrostatic potential at a point is the work per unit positive charge in bringing a test charge from infinity to that point, and it is a scalar measured in volts.",
          hi: "किसी बिंदु पर स्थिरवैद्युत विभव वह कार्य प्रति एकांक धन आवेश है जो परीक्षण आवेश को अनंत से उस बिंदु तक लाने में लगे, और वह वोल्ट में नापा जाने वाला अदिश है।",
          mr: "एखाद्या बिंदूवरील स्थिरविद्युत विभव म्हणजे चाचणी प्रभाराला अनंतापासून त्या बिंदूपर्यंत आणण्यात लागणारे प्रति एकक धन प्रभार कार्य, आणि तो व्होल्टमध्ये मोजला जाणारा अदिश आहे.",
        },
        detail: {
          en: "It can be defined at all only because the electrostatic force is conservative: the work is the same along every route from infinity, so the number belongs to the point and not to the journey.",
          hi: "यह परिभाषित ही इसलिए हो पाता है कि स्थिरवैद्युत बल संरक्षी है: अनंत से आने वाले हर रास्ते पर कार्य एक-सा है, अतः संख्या बिंदु की है, यात्रा की नहीं।",
          mr: "याची व्याख्या मुळात यामुळेच होऊ शकते की स्थिरविद्युत बल संरक्षी आहे: अनंतापासून येणाऱ्या प्रत्येक मार्गावर कार्य सारखेच आहे, म्हणून संख्या बिंदूची आहे, प्रवासाची नव्हे.",
        },
        extra: {
          en: "Only differences are ever measured, so the zero can be put where convenient — at infinity in theory, at the earth in a laboratory — and no experiment can distinguish the two choices.",
          hi: "नापा सदा केवल अंतर जाता है, अतः शून्य वहाँ रखा जा सकता है जहाँ सुविधा हो — सिद्धांत में अनंत पर, प्रयोगशाला में पृथ्वी पर — और कोई प्रयोग दोनों चुनावों में भेद नहीं कर सकता।",
          mr: "मोजला नेहमी केवळ फरकच जातो, म्हणून शून्य जिथे सोयीचे तिथे ठेवता येते — सिद्धांतात अनंतावर, प्रयोगशाळेत पृथ्वीवर — आणि कोणताही प्रयोग दोन निवडींत भेद करू शकत नाही.",
        },
        pair: {
          left: {
            en: "One number where the field needed three",
            hi: "एक संख्या, जहाँ क्षेत्र को तीन चाहिए थीं",
            mr: "एक संख्या, जिथे क्षेत्राला तीन लागत होत्या",
          },
          right: {
            en: "electrostatic potential",
            hi: "स्थिरवैद्युत विभव",
            mr: "स्थिरविद्युत विभव",
          },
        },
      },
      {
        id: "potential-energy-of-configuration",
        name: {
          en: "Potential energy of a charge configuration",
          hi: "आवेश विन्यास की स्थितिज ऊर्जा",
          mr: "प्रभार मांडणीची स्थितिज ऊर्जा",
        },
        kind: "defined quantity",
        prompt: {
          en: "The total work needed to assemble a set of charges by bringing them in one at a time from infinity, counted once for each PAIR and never twice. Which quantity is this?",
          hi: "आवेशों के समुच्चय को अनंत से एक-एक करके लाकर जमाने में लगने वाला कुल कार्य, हर युग्म के लिए एक बार गिना और कभी दो बार नहीं। यह कौन-सी राशि है?",
          mr: "प्रभारांचा संच अनंतापासून एकेक करून आणून मांडण्यात लागणारे एकूण कार्य, प्रत्येक जोडीसाठी एकदा मोजलेले आणि कधीच दोनदा नाही. ही कोणती राशी?",
        },
        statement: {
          en: "The potential energy of a charge configuration is the total external work done in assembling it from infinite separation, and equals the sum of kq_iq_j/r_ij taken over distinct pairs.",
          hi: "आवेश विन्यास की स्थितिज ऊर्जा उसे अनंत दूरी से जमाने में किया गया कुल बाहरी कार्य है, और भिन्न युग्मों पर लिए गए kq_iq_j/r_ij के योग के बराबर है।",
          mr: "प्रभार मांडणीची स्थितिज ऊर्जा म्हणजे तिला अनंत अंतरावरून मांडण्यात केलेले एकूण बाह्य कार्य, आणि ती वेगवेगळ्या जोड्यांवर घेतलेल्या kq_iq_j/r_ij च्या बेरजेइतकी असते.",
        },
        detail: {
          en: "The first charge costs nothing, because there is nothing yet for it to be pushed against — which is why a system of n charges has n(n−1)/2 terms and not n².",
          hi: "पहला आवेश कुछ नहीं लेता, क्योंकि अभी उसे किसके विरुद्ध धकेला जाए ऐसा कुछ है ही नहीं — इसीलिए n आवेशों के निकाय में n(n−1)/2 पद होते हैं, n² नहीं।",
          mr: "पहिला प्रभार काहीच घेत नाही, कारण त्याला कशाविरुद्ध ढकलावे असे अजून काहीच नाही — म्हणूनच n प्रभारांच्या संस्थेत n(n−1)/2 पदे असतात, n² नव्हे.",
        },
        extra: {
          en: "It can be negative, and a negative value is the statement that the configuration is bound: work would have to be supplied from outside to pull the charges back to infinity.",
          hi: "यह ऋणात्मक हो सकती है, और ऋण मान यह कथन है कि विन्यास बँधा हुआ है: आवेशों को वापस अनंत तक खींचने के लिए बाहर से कार्य देना पड़ेगा।",
          mr: "ती ऋण असू शकते, आणि ऋण मूल्य हे विधान आहे की मांडणी बद्ध आहे: प्रभारांना पुन्हा अनंतापर्यंत ओढण्यासाठी बाहेरून कार्य द्यावे लागेल.",
        },
        pair: {
          left: {
            en: "Counted once per pair, and the first one is free",
            hi: "हर युग्म पर एक बार गिनी गई, और पहला मुफ़्त",
            mr: "प्रत्येक जोडीवर एकदा मोजलेली, आणि पहिला फुकट",
          },
          right: {
            en: "potential energy of a charge configuration",
            hi: "आवेश विन्यास की स्थितिज ऊर्जा",
            mr: "प्रभार मांडणीची स्थितिज ऊर्जा",
          },
        },
      },
      {
        id: "capacitance",
        name: {
          en: "Capacitance",
          hi: "धारिता",
          mr: "धारिता",
        },
        kind: "defined quantity",
        prompt: {
          en: "The ratio of the charge on a conductor to the potential it thereby reaches — a ratio that stays the same whether the conductor is nearly empty or nearly full. Which quantity is this?",
          hi: "किसी चालक पर आवेश और उससे बने विभव का अनुपात — ऐसा अनुपात जो चालक लगभग ख़ाली हो या लगभग भरा, वही रहता है। यह कौन-सी राशि है?",
          mr: "एखाद्या वाहकावरील प्रभार आणि त्यामुळे गाठलेला विभव यांचे गुणोत्तर — असे गुणोत्तर जे वाहक जवळपास रिकामा असो वा जवळपास भरलेला, तेच राहते. ही कोणती राशी?",
        },
        statement: {
          en: "Capacitance is C = Q/V, the charge required per volt, and for a parallel plate capacitor it is ε₀A/d — fixed entirely by geometry and the medium.",
          hi: "धारिता C = Q/V है, प्रति वोल्ट आवश्यक आवेश, और समांतर पट्ट संधारित्र के लिए वह ε₀A/d है — पूरी तरह ज्यामिति और माध्यम से तय।",
          mr: "धारिता म्हणजे C = Q/V, प्रति व्होल्ट लागणारा प्रभार, आणि समांतर पट्ट धारित्रासाठी ती ε₀A/d आहे — पूर्णपणे भूमिती आणि माध्यमाने ठरलेली.",
        },
        detail: {
          en: "The ratio is constant although both Q and V change together, which is what makes capacitance a property of the device rather than a description of its present state.",
          hi: "अनुपात अचर रहता है यद्यपि Q और V दोनों साथ बदलते हैं, और यही धारिता को युक्ति का गुण बनाता है, उसकी वर्तमान अवस्था का वर्णन नहीं।",
          mr: "गुणोत्तर अचल राहते जरी Q आणि V दोन्ही एकत्र बदलत असले तरी, आणि हेच धारितेला साधनाचा गुणधर्म बनवते, तिच्या सध्याच्या अवस्थेचे वर्णन नव्हे.",
        },
        extra: {
          en: "Capacitors in parallel add their capacitances while capacitors in series add their reciprocals, which is the exact opposite of how resistors behave and the commonest source of a wrong first line.",
          hi: "समांतर में संधारित्र अपनी धारिताएँ जोड़ते हैं जबकि श्रेणी में वे अपने व्युत्क्रम जोड़ते हैं, जो प्रतिरोधकों के ठीक उलट है और ग़लत पहली पंक्ति का सबसे आम स्रोत।",
          mr: "समांतरात धारित्रे आपल्या धारिता जोडतात तर श्रेणीत ती आपले व्यस्तांक जोडतात, जे रोधकांच्या नेमके उलट आहे आणि चुकीच्या पहिल्या ओळीचा सर्वांत सामान्य स्रोत.",
        },
        pair: {
          left: {
            en: "A ratio that does not care how much is in it",
            hi: "ऐसा अनुपात जिसे परवाह नहीं कि भीतर कितना है",
            mr: "असे गुणोत्तर ज्याला आत किती आहे याची पर्वा नाही",
          },
          right: {
            en: "capacitance",
            hi: "धारिता",
            mr: "धारिता",
          },
        },
      },
      {
        id: "equipotential-surface",
        name: {
          en: "Equipotential surface",
          hi: "समविभव पृष्ठ",
          mr: "समविभव पृष्ठ",
        },
        kind: "geometrical feature of a field",
        prompt: {
          en: "A surface along which a charge can be carried anywhere at all without any work being done, and which the field must therefore cross at right angles at every point. What is such a surface called?",
          hi: "ऐसा पृष्ठ जिस पर आवेश को कहीं भी ले जाओ, कोई कार्य नहीं होता, और जिसे इसलिए क्षेत्र हर बिंदु पर समकोण पर काटता ही है। ऐसा पृष्ठ क्या कहलाता है?",
          mr: "असे पृष्ठ ज्यावर प्रभार कुठेही न्या, कोणतेही कार्य होत नाही, आणि ज्याला म्हणून क्षेत्र प्रत्येक बिंदूवर काटकोनात छेदतेच. अशा पृष्ठाला काय म्हणतात?",
        },
        statement: {
          en: "An equipotential surface is one on which the potential has the same value throughout, so no work is done in moving a charge over it and the field is everywhere perpendicular to it.",
          hi: "समविभव पृष्ठ वह है जिस पर विभव का मान हर जगह एक है, अतः उस पर आवेश हिलाने में कोई कार्य नहीं होता और क्षेत्र हर जगह उसके लंबवत है।",
          mr: "समविभव पृष्ठ ते ज्यावर विभवाचे मूल्य सर्वत्र एकच आहे, म्हणून त्यावर प्रभार हलवण्यात कोणतेही कार्य होत नाही आणि क्षेत्र सर्वत्र त्याला लंब असते.",
        },
        detail: {
          en: "The perpendicularity is not an extra rule but a consequence: any component of the field along the surface would do work on a charge moved along it, and then the potential would not have been constant.",
          hi: "लंबवतता कोई अतिरिक्त नियम नहीं बल्कि परिणाम है: पृष्ठ के अनुदिश क्षेत्र का कोई भी घटक उस पर हिलाए गए आवेश पर कार्य करता, और तब विभव अचर होता ही नहीं।",
          mr: "लंबत्व हा जादा नियम नसून परिणाम आहे: पृष्ठाच्या दिशेने क्षेत्राचा कोणताही घटक त्यावर हलवलेल्या प्रभारावर कार्य करेल, आणि मग विभव अचल राहिलाच नसता.",
        },
        extra: {
          en: "Where these surfaces crowd together the potential is changing fast over a short distance, so their spacing is a picture of the field's strength as well as its direction.",
          hi: "जहाँ ये पृष्ठ पास-पास भीड़ करते हैं वहाँ विभव थोड़ी दूरी में तेज़ी से बदल रहा है, अतः उनका अंतराल क्षेत्र की दिशा के साथ उसकी प्रबलता का भी चित्र है।",
          mr: "जिथे ही पृष्ठे जवळजवळ दाटतात तिथे विभव थोड्या अंतरात वेगाने बदलत आहे, म्हणून त्यांचे अंतर क्षेत्राच्या दिशेसोबत त्याच्या तीव्रतेचेही चित्र आहे.",
        },
        pair: {
          left: {
            en: "Walk anywhere on it and the work is zero",
            hi: "उस पर कहीं भी चलो, कार्य शून्य",
            mr: "त्यावर कुठेही चला, कार्य शून्य",
          },
          right: {
            en: "an equipotential surface",
            hi: "समविभव पृष्ठ",
            mr: "समविभव पृष्ठ",
          },
        },
      },
      {
        id: "conductor-in-electrostatic-field",
        name: {
          en: "A conductor in an electrostatic field",
          hi: "स्थिरवैद्युत क्षेत्र में चालक",
          mr: "स्थिरविद्युत क्षेत्रातील वाहक",
        },
        kind: "geometrical feature of a field",
        prompt: {
          en: "Free charges inside it move until they have themselves cancelled the field within, leaving all excess charge on the outer skin and the whole body at one potential. Which situation is being described?",
          hi: "उसके भीतर के मुक्त आवेश तब तक चलते हैं जब तक वे स्वयं भीतर का क्षेत्र काट न दें, और सारा अतिरिक्त आवेश बाहरी त्वचा पर तथा पूरा पिंड एक विभव पर रह जाए। कौन-सी स्थिति बताई जा रही है?",
          mr: "त्याच्या आतले मुक्त प्रभार तोवर हलतात जोवर ते स्वतःच आतले क्षेत्र कापत नाहीत, आणि सारा जादा प्रभार बाहेरच्या त्वचेवर तसेच अख्खा पदार्थ एका विभवावर उरतो. कोणती स्थिती वर्णिली जात आहे?",
        },
        statement: {
          en: "A conductor in an electrostatic field has zero field inside it, all its excess charge on the outer surface, and the same potential at every point of its volume and surface.",
          hi: "स्थिरवैद्युत क्षेत्र में चालक के भीतर क्षेत्र शून्य होता है, उसका सारा अतिरिक्त आवेश बाहरी पृष्ठ पर होता है, और उसके आयतन तथा पृष्ठ के हर बिंदु पर एक ही विभव होता है।",
          mr: "स्थिरविद्युत क्षेत्रातील वाहकाच्या आत क्षेत्र शून्य असते, त्याचा सारा जादा प्रभार बाहेरच्या पृष्ठावर असतो, आणि त्याच्या घनफळाच्या व पृष्ठाच्या प्रत्येक बिंदूवर एकच विभव असतो.",
        },
        detail: {
          en: "The interior field is zero by an argument that needs no calculation: if any field remained, the free charges would still be moving, and the situation would not yet be static.",
          hi: "भीतर का क्षेत्र शून्य होने का तर्क बिना किसी गणना के है: यदि कोई क्षेत्र बचा रहता, तो मुक्त आवेश अब भी चल रहे होते, और स्थिति अभी स्थैतिक होती ही नहीं।",
          mr: "आतले क्षेत्र शून्य असल्याचा युक्तिवाद कोणत्याही गणनेविना आहे: जर काही क्षेत्र उरले असते, तर मुक्त प्रभार अजूनही हलत असते, आणि स्थिती अजून स्थैतिक झालीच नसती.",
        },
        extra: {
          en: "This is why a metal box shields its contents from an outside field however violent, and why a hollow conductor's cavity stays field-free even when the shell carries an enormous charge.",
          hi: "इसीलिए धातु का डिब्बा अपनी सामग्री को बाहर के कितने भी प्रचंड क्षेत्र से बचा लेता है, और खोखले चालक की गुहा तब भी क्षेत्रहीन रहती है जब कोश पर विशाल आवेश हो।",
          mr: "म्हणूनच धातूची पेटी आपल्या आतील गोष्टींना बाहेरच्या कितीही प्रचंड क्षेत्रापासून वाचवते, आणि पोकळ वाहकाची पोकळी तेव्हाही क्षेत्रविरहित राहते जेव्हा कवचावर प्रचंड प्रभार असतो.",
        },
        pair: {
          left: {
            en: "Still moving would mean not yet static",
            hi: "अब भी चल रहे होना मतलब अभी स्थैतिक नहीं",
            mr: "अजून हलत असणे म्हणजे अजून स्थैतिक नाही",
          },
          right: {
            en: "a conductor in an electrostatic field",
            hi: "स्थिरवैद्युत क्षेत्र में चालक",
            mr: "स्थिरविद्युत क्षेत्रातील वाहक",
          },
        },
      },
      {
        id: "dielectric-polarisation",
        name: {
          en: "Dielectric polarisation",
          hi: "परावैद्युत ध्रुवण",
          mr: "पराविद्युत ध्रुवण",
        },
        kind: "geometrical feature of a field",
        prompt: {
          en: "An insulator has no charges free to travel, yet placed in a field its molecules stretch or turn, and the resulting layers of bound charge on its two faces set up a field of their own pointing the other way. What is this called?",
          hi: "विद्युतरोधी में चलने को मुक्त आवेश नहीं होते, फिर भी क्षेत्र में रखे जाने पर उसके अणु खिंचते या मुड़ते हैं, और उसके दो फलकों पर बनी बद्ध आवेश की परतें अपना एक क्षेत्र खड़ा करती हैं जो उलटी ओर है। इसे क्या कहते हैं?",
          mr: "विद्युतरोधकात प्रवास करायला मुक्त प्रभार नसतात, तरीही क्षेत्रात ठेवल्यावर त्याचे रेणू ताणले जातात वा वळतात, आणि त्याच्या दोन पृष्ठभागांवर तयार झालेले बद्ध प्रभाराचे थर स्वतःचे एक क्षेत्र उभे करतात जे उलट दिशेने असते. याला काय म्हणतात?",
        },
        statement: {
          en: "Dielectric polarisation is the alignment of bound charge inside an insulator placed in a field, producing an internal field opposing the applied one and so reducing the net field by the factor K.",
          hi: "परावैद्युत ध्रुवण क्षेत्र में रखे विद्युतरोधी के भीतर बद्ध आवेश का संरेखण है, जो लगाए गए क्षेत्र के विरुद्ध आंतरिक क्षेत्र बनाता है और यों नेट क्षेत्र को K गुणक से घटा देता है।",
          mr: "पराविद्युत ध्रुवण म्हणजे क्षेत्रात ठेवलेल्या विद्युतरोधकाच्या आत बद्ध प्रभाराचे संरेखन, जे लावलेल्या क्षेत्राविरुद्ध अंतर्गत क्षेत्र निर्माण करते आणि अशा प्रकारे निव्वळ क्षेत्र K या गुणकाने घटवते.",
        },
        detail: {
          en: "The bound charge cannot be drawn off with a wire, which is exactly what distinguishes it from the free charge on a conductor's surface and why the field is only reduced, never cancelled.",
          hi: "बद्ध आवेश तार से खींचा नहीं जा सकता, और ठीक यही उसे चालक के पृष्ठ के मुक्त आवेश से अलग करता है और इसीलिए क्षेत्र केवल घटता है, कभी कटता नहीं।",
          mr: "बद्ध प्रभार तारेने ओढून घेता येत नाही, आणि नेमके हेच त्याला वाहकाच्या पृष्ठावरील मुक्त प्रभारापासून वेगळे करते आणि म्हणूनच क्षेत्र केवळ घटते, कधीच नाहीसे होत नाही.",
        },
        extra: {
          en: "Since capacitance is charge per volt and the same charge now produces a smaller voltage, inserting the slab multiplies the capacitance by K without a single extra plate.",
          hi: "चूँकि धारिता प्रति वोल्ट आवेश है और वही आवेश अब कम वोल्टता देता है, पट्टी डालने से धारिता K गुनी हो जाती है, एक भी अतिरिक्त प्लेट के बिना।",
          mr: "धारिता म्हणजे प्रति व्होल्ट प्रभार असल्याने आणि तोच प्रभार आता कमी व्होल्टेज देत असल्याने, पट्टी घातल्याने धारिता K पट होते, एकही जादा पट्टी न लावता.",
        },
        pair: {
          left: {
            en: "Bound charge that no wire can carry away",
            hi: "बद्ध आवेश जिसे कोई तार ले नहीं जा सकता",
            mr: "बद्ध प्रभार जो कोणतीही तार वाहून नेऊ शकत नाही",
          },
          right: {
            en: "dielectric polarisation",
            hi: "परावैद्युत ध्रुवण",
            mr: "पराविद्युत ध्रुवण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A parallel plate capacitor is charged by a battery. In experiment A the battery is left connected and a dielectric slab is slid between the plates; in experiment B the battery is disconnected first and the same slab is then inserted. What happens to the charge, the voltage and the field in each case?",
          hi: "एक समांतर पट्ट संधारित्र बैटरी से आवेशित किया जाता है। प्रयोग A में बैटरी जुड़ी छोड़ दी जाती है और प्लेटों के बीच परावैद्युत पट्टी सरकाई जाती है; प्रयोग B में पहले बैटरी हटाई जाती है और फिर वही पट्टी डाली जाती है। हर स्थिति में आवेश, वोल्टता और क्षेत्र का क्या होता है?",
          mr: "एक समांतर पट्ट धारित्र बॅटरीने प्रभारित केले जाते. प्रयोग A मध्ये बॅटरी जोडलेली ठेवली जाते आणि पट्ट्यांमध्ये पराविद्युत पट्टी सरकवली जाते; प्रयोग B मध्ये आधी बॅटरी काढली जाते आणि मग तीच पट्टी घातली जाते. प्रत्येक स्थितीत प्रभार, व्होल्टेज आणि क्षेत्राचे काय होते?",
        },
        choices: [
          {
            en: "In A the battery holds V fixed, so with C multiplied by K the charge Q = CV rises by K and the field E = V/d is unchanged; extra charge flows from the battery. In B the plates are isolated, so Q is fixed instead, and with C multiplied by K the voltage V = Q/C falls to a Kth and the field falls with it. The single question to ask first is which quantity the circuit is holding constant — the battery fixes V, an open circuit fixes Q — and everything else follows from C = Q/V",
            hi: "A में बैटरी V को स्थिर रखती है, अतः C के K गुना होने पर आवेश Q = CV, K गुना बढ़ता है और क्षेत्र E = V/d अपरिवर्तित रहता है; अतिरिक्त आवेश बैटरी से बहता है। B में प्लेटें विलगित हैं, अतः इस बार Q स्थिर है, और C के K गुना होने पर वोल्टता V = Q/C घटकर Kवाँ भाग रह जाती है और क्षेत्र उसके साथ घटता है। पहला प्रश्न यही पूछना है कि परिपथ किस राशि को अचर रख रहा है — बैटरी V को बाँधती है, खुला परिपथ Q को — और बाक़ी सब C = Q/V से निकल आता है",
            mr: "A मध्ये बॅटरी V स्थिर ठेवते, म्हणून C हा K पट झाल्याने प्रभार Q = CV हा K पटीने वाढतो आणि क्षेत्र E = V/d अपरिवर्तित राहते; जादा प्रभार बॅटरीतून वाहतो. B मध्ये पट्ट्या एकाकी आहेत, म्हणून यावेळी Q स्थिर आहे, आणि C हा K पट झाल्याने व्होल्टेज V = Q/C घटून Kवा भाग उरते आणि क्षेत्र त्यासोबत घटते. पहिला प्रश्न हाच विचारायचा की परिपथ कोणती राशी अचल ठेवत आहे — बॅटरी V बांधते, उघडा परिपथ Q बांधतो — आणि बाकी सर्व C = Q/V मधून निघते",
          },
          {
            en: "In both cases the charge stays the same and only the voltage falls, since inserting a dielectric cannot move charge onto or off the plates",
            hi: "दोनों स्थितियों में आवेश वही रहता है और केवल वोल्टता घटती है, क्योंकि परावैद्युत डालने से प्लेटों पर आवेश आ या जा नहीं सकता",
            mr: "दोन्ही स्थितींत प्रभार तोच राहतो आणि केवळ व्होल्टेज घटते, कारण पराविद्युत घातल्याने पट्ट्यांवर प्रभार येऊ वा जाऊ शकत नाही",
          },
          {
            en: "In both cases the voltage stays the same and only the charge rises, because the dielectric raises the capacitance and the capacitor must fill to match it",
            hi: "दोनों स्थितियों में वोल्टता वही रहती है और केवल आवेश बढ़ता है, क्योंकि परावैद्युत धारिता बढ़ाता है और संधारित्र को उसके अनुरूप भरना ही पड़ता है",
            mr: "दोन्ही स्थितींत व्होल्टेज तेच राहते आणि केवळ प्रभार वाढतो, कारण पराविद्युत धारिता वाढवते आणि धारित्राला तिच्याशी जुळेल इतके भरावेच लागते",
          },
          {
            en: "In A the field falls and in B it is unchanged, because a connected battery cannot maintain a field through an insulating slab",
            hi: "A में क्षेत्र घटता है और B में अपरिवर्तित रहता है, क्योंकि जुड़ी बैटरी विद्युतरोधी पट्टी के आर-पार क्षेत्र बनाए नहीं रख सकती",
            mr: "A मध्ये क्षेत्र घटते आणि B मध्ये अपरिवर्तित राहते, कारण जोडलेली बॅटरी विद्युतरोधक पट्टीच्या आरपार क्षेत्र टिकवू शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Almost every capacitor question of this type is decided by one preliminary decision, and students who make it explicitly get the rest almost automatically: WHICH QUANTITY IS THE CIRCUIT HOLDING CONSTANT? There are only two answers. If the battery is still connected, it maintains a fixed potential difference across the plates and will supply or absorb whatever charge is needed to do so; V is constant and Q is free. If the battery has been removed, the plates are isolated islands of metal with nowhere for their charge to go; Q is constant and V is free. Everything else is C = Q/V read in the appropriate direction. Both experiments share one fact: inserting the slab multiplies the capacitance by the dielectric constant K, because polarisation sets up bound surface charge whose own field opposes the applied one. Experiment A, battery connected. V is pinned at the battery's e.m.f. C has become KC₀. Therefore Q = CV rises from C₀V to KC₀V — the charge has increased by a factor K, and that extra charge came from the battery, which means a brief current flowed while the slab went in. The field between the plates is E = V/d, and since V and d are both unchanged, the field is exactly what it was. This surprises students who have learned that a dielectric 'reduces the field': it does reduce the field produced by a given charge, but here the charge rose by precisely the factor needed to keep the field where the battery wants it. The stored energy U = ½CV² rises by K as well. Experiment B, battery disconnected. Now Q is pinned, because the charge on an isolated plate has no route away. C has again become KC₀. Therefore V = Q/C falls from Q/C₀ to Q/(KC₀), a factor of K smaller. The field E = V/d falls by the same factor — this is the case in which the dielectric visibly weakens the field, and the reason is that the bound charge partly cancels the free charge without any compensating supply. The energy U = Q²/2C falls by K, and the missing energy is accounted for: the slab was pulled in by the fringing field, so the field did work on it, and letting go of a slab at the edge of a charged isolated capacitor will indeed suck it in. That the same slab produces opposite effects on the voltage in the two experiments is not a paradox; it is a demonstration that a capacitor's behaviour is not a property of the capacitor alone but of the capacitor plus whatever the circuit is doing to it. (The second and third options each pick one experiment's answer and apply it to both; the fourth invents an inability of batteries that does not exist — a dielectric is not a break in the circuit, and no current needs to cross it.)",
          hi: "इस क़िस्म का लगभग हर संधारित्र प्रश्न एक प्रारंभिक निर्णय से तय होता है, और जो विद्यार्थी उसे स्पष्ट रूप से करते हैं उन्हें बाक़ी लगभग अपने आप मिल जाता है: परिपथ किस राशि को अचर रख रहा है? उत्तर केवल दो हैं। यदि बैटरी अब भी जुड़ी है, वह प्लेटों के आर-पार निश्चित विभवांतर बनाए रखती है और उसके लिए जितना आवेश चाहिए देगी या लेगी; V अचर है और Q मुक्त। यदि बैटरी हटा दी गई है, तो प्लेटें धातु के विलगित द्वीप हैं और उनके आवेश के जाने को कोई जगह नहीं; Q अचर है और V मुक्त। बाक़ी सब उपयुक्त दिशा में पढ़ा गया C = Q/V है। दोनों प्रयोगों में एक तथ्य साझा है: पट्टी डालने से धारिता परावैद्युतांक K गुनी हो जाती है, क्योंकि ध्रुवण बद्ध पृष्ठ आवेश खड़ा करता है जिसका अपना क्षेत्र लगाए गए के विरुद्ध है। प्रयोग A, बैटरी जुड़ी। V बैटरी के विद्युत वाहक बल पर टँका है। C अब KC₀ हो गया। अतः Q = CV, C₀V से बढ़कर KC₀V हो जाता है — आवेश K गुणक से बढ़ा, और वह अतिरिक्त आवेश बैटरी से आया, जिसका अर्थ है कि पट्टी जाते समय क्षणिक धारा बही। प्लेटों के बीच क्षेत्र E = V/d है, और चूँकि V और d दोनों अपरिवर्तित हैं, क्षेत्र ठीक वही है जो था। यह उन विद्यार्थियों को चौंकाता है जिन्होंने सीखा है कि परावैद्युत 'क्षेत्र घटाता है': वह दिए गए आवेश से बने क्षेत्र को घटाता तो है, पर यहाँ आवेश ठीक उतने गुणक से बढ़ा जितना क्षेत्र को वहीं रखने के लिए चाहिए था जहाँ बैटरी चाहती है। संचित ऊर्जा U = ½CV² भी K गुनी होती है। प्रयोग B, बैटरी हटी। अब Q टँका है, क्योंकि विलगित प्लेट के आवेश के पास जाने का रास्ता नहीं। C फिर KC₀ हो गया। अतः V = Q/C, Q/C₀ से घटकर Q/(KC₀) हो जाता है, K गुणक छोटा। क्षेत्र E = V/d उसी गुणक से घटता है — यही वह स्थिति है जिसमें परावैद्युत दिखाई देने वाले ढंग से क्षेत्र कमज़ोर करता है, और कारण यह कि बद्ध आवेश मुक्त आवेश को आंशिक रूप से काटता है और भरपाई की कोई आपूर्ति नहीं। ऊर्जा U = Q²/2C, K गुणक से घटती है, और लुप्त ऊर्जा का हिसाब है: पट्टी को किनारे के क्षेत्र ने भीतर खींचा, अतः क्षेत्र ने उस पर कार्य किया, और आवेशित विलगित संधारित्र के किनारे पर छोड़ी गई पट्टी सचमुच भीतर खिंच जाएगी। वही पट्टी दोनों प्रयोगों में वोल्टता पर उलटा असर करती है, यह विरोधाभास नहीं; यह प्रदर्शन है कि संधारित्र का आचरण अकेले संधारित्र का गुण नहीं बल्कि संधारित्र और परिपथ उसके साथ जो कर रहा है, दोनों का है। (दूसरा और तीसरा विकल्प एक प्रयोग का उत्तर उठाकर दोनों पर लगा देते हैं; चौथा बैटरियों की ऐसी असमर्थता गढ़ता है जो है ही नहीं — परावैद्युत परिपथ में टूट नहीं, और उसके आर-पार किसी धारा को जाना ही नहीं है।)",
          mr: "या प्रकारचा जवळपास प्रत्येक धारित्र प्रश्न एका पूर्वनिर्णयाने ठरतो, आणि जे विद्यार्थी तो स्पष्टपणे करतात त्यांना बाकीचे जवळपास आपोआप मिळते: परिपथ कोणती राशी अचल ठेवत आहे? उत्तरे केवळ दोन आहेत. जर बॅटरी अजून जोडलेली असेल, ती पट्ट्यांच्या आरपार ठराविक विभवांतर टिकवते आणि त्यासाठी जितका प्रभार लागेल तितका देईल वा घेईल; V अचल आहे आणि Q मुक्त. जर बॅटरी काढलेली असेल, तर पट्ट्या धातूची एकाकी बेटे आहेत आणि त्यांच्या प्रभाराला जायला जागा नाही; Q अचल आहे आणि V मुक्त. बाकी सर्व योग्य दिशेने वाचलेले C = Q/V आहे. दोन्ही प्रयोगांत एक गोष्ट समान आहे: पट्टी घातल्याने धारिता पराविद्युतांक K पट होते, कारण ध्रुवण बद्ध पृष्ठ प्रभार उभा करते ज्याचे स्वतःचे क्षेत्र लावलेल्याविरुद्ध असते. प्रयोग A, बॅटरी जोडलेली. V बॅटरीच्या विद्युतचालक बलावर टांगलेला. C आता KC₀ झाला. म्हणून Q = CV हा C₀V वरून वाढून KC₀V होतो — प्रभार K पटीने वाढला, आणि तो जादा प्रभार बॅटरीतून आला, म्हणजे पट्टी आत जाताना क्षणिक धारा वाहली. पट्ट्यांमधले क्षेत्र E = V/d आहे, आणि V आणि d दोन्ही अपरिवर्तित असल्याने, क्षेत्र नेमके तेच आहे जे होते. हे त्या विद्यार्थ्यांना चकित करते ज्यांनी शिकले आहे की पराविद्युत 'क्षेत्र घटवते': ते दिलेल्या प्रभाराने बनलेले क्षेत्र घटवते खरे, पण इथे प्रभार नेमक्या तितक्या पटीने वाढला जितका क्षेत्र बॅटरीला हवे तिथेच ठेवायला लागत होता. साठवलेली ऊर्जा U = ½CV² सुद्धा K पट होते. प्रयोग B, बॅटरी काढलेली. आता Q टांगलेला, कारण एकाकी पट्टीवरील प्रभाराला जायला मार्ग नाही. C पुन्हा KC₀ झाला. म्हणून V = Q/C हा Q/C₀ वरून घटून Q/(KC₀) होतो, K पटीने लहान. क्षेत्र E = V/d त्याच पटीने घटते — हीच ती स्थिती जिच्यात पराविद्युत दिसण्याइतके क्षेत्र कमकुवत करते, आणि कारण असे की बद्ध प्रभार मुक्त प्रभाराला अंशतः कापतो आणि भरपाईचा कोणताही पुरवठा नाही. ऊर्जा U = Q²/2C ही K पटीने घटते, आणि हरवलेल्या ऊर्जेचा हिशेब आहे: पट्टीला कडेच्या क्षेत्राने आत ओढले, म्हणून क्षेत्राने तिच्यावर कार्य केले, आणि प्रभारित एकाकी धारित्राच्या कडेला सोडलेली पट्टी खरोखर आत ओढली जाईल. तीच पट्टी दोन प्रयोगांत व्होल्टेजवर उलट परिणाम करते, हा विरोधाभास नाही; हे प्रात्यक्षिक आहे की धारित्राचे वर्तन केवळ धारित्राचा गुणधर्म नसून धारित्र आणि परिपथ त्याच्याशी जे करत आहे या दोहोंचा आहे. (दुसरा आणि तिसरा पर्याय एका प्रयोगाचे उत्तर उचलून दोन्हींवर लावतात; चौथा बॅटऱ्यांची अशी असमर्थता घडवतो जी अस्तित्वातच नाही — पराविद्युत हा परिपथातला खंड नाही, आणि त्याच्या आरपार कोणत्याही धारेला जायचेच नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two isolated metal spheres, one of radius 2R carrying charge Q and one of radius R carrying no charge, are joined by a long thin wire. A student predicts the charge will divide equally between them. Explain what actually happens and account for the energy.",
          hi: "दो विलगित धातु के गोले, एक त्रिज्या 2R वाला जिस पर आवेश Q है और एक त्रिज्या R वाला जिस पर कोई आवेश नहीं, एक लंबे पतले तार से जोड़े जाते हैं। विद्यार्थी भविष्यवाणी करता है कि आवेश उनमें बराबर बँट जाएगा। बताओ वास्तव में क्या होता है और ऊर्जा का हिसाब दो।",
          mr: "दोन एकाकी धातूचे गोल, एक त्रिज्या 2R असलेला ज्यावर प्रभार Q आहे आणि एक त्रिज्या R असलेला ज्यावर काहीच प्रभार नाही, एका लांब बारीक तारेने जोडले जातात. विद्यार्थी भाकीत करतो की प्रभार त्यांच्यात समान वाटला जाईल. प्रत्यक्षात काय घडते ते सांगा आणि ऊर्जेचा हिशेब द्या.",
        },
        choices: [
          {
            en: "Charge flows until the two spheres are at the same POTENTIAL, not until they carry the same charge. Since V = kq/r, equal potentials require q ∝ r, so the larger sphere keeps two-thirds of Q and the smaller takes one-third. The surface charge DENSITY is then higher on the smaller sphere, since σ ∝ q/r² ∝ 1/r — which is why charge concentrates at sharp points. Energy is not conserved in the transfer: the final electrostatic energy is less than the initial, and the difference is dissipated as heat in the connecting wire and radiated away",
            hi: "आवेश तब तक बहता है जब तक दोनों गोले एक ही विभव पर न आ जाएँ, तब तक नहीं जब तक वे एक ही आवेश न रखें। चूँकि V = kq/r, बराबर विभव के लिए q ∝ r चाहिए, अतः बड़ा गोला Q का दो-तिहाई रखता है और छोटा एक-तिहाई लेता है। पृष्ठ आवेश घनत्व तब छोटे गोले पर अधिक होता है, क्योंकि σ ∝ q/r² ∝ 1/r — इसीलिए आवेश नुकीले बिंदुओं पर जमा होता है। स्थानांतरण में ऊर्जा संरक्षित नहीं रहती: अंतिम स्थिरवैद्युत ऊर्जा आरंभिक से कम है, और अंतर जोड़ने वाले तार में ऊष्मा बनकर और विकिरित होकर चला जाता है",
            mr: "प्रभार तोवर वाहतो जोवर दोन्ही गोल एकाच विभवावर येत नाहीत, तोवर नव्हे जोवर ते एकच प्रभार बाळगत नाहीत. V = kq/r असल्याने, समान विभवासाठी q ∝ r लागते, म्हणून मोठा गोल Q चा दोन-तृतीयांश ठेवतो आणि लहान एक-तृतीयांश घेतो. पृष्ठ प्रभार घनता तेव्हा लहान गोलावर अधिक असते, कारण σ ∝ q/r² ∝ 1/r — म्हणूनच प्रभार टोकदार बिंदूंवर साठतो. हस्तांतरणात ऊर्जा संधारित राहत नाही: अंतिम स्थिरविद्युत ऊर्जा प्रारंभिकहून कमी आहे, आणि फरक जोडणाऱ्या तारेत उष्णता बनून व प्रारित होऊन निघून जातो",
          },
          {
            en: "The student is right: charge is conserved and there is nothing to make it prefer one sphere, so each ends with Q/2 and the potentials differ",
            hi: "विद्यार्थी सही है: आवेश संरक्षित है और उसे एक गोले को वरीयता देने की कोई वजह नहीं, अतः हर एक Q/2 के साथ रह जाता है और विभव भिन्न रहते हैं",
            mr: "विद्यार्थी बरोबर आहे: प्रभार संधारित आहे आणि त्याला एका गोलाला प्राधान्य द्यायचे कारण नाही, म्हणून प्रत्येक Q/2 सह उरतो आणि विभव वेगळे राहतात",
          },
          {
            en: "The charge divides in the ratio of the surface areas, four to one, because charge resides on the surface and there is four times as much of it on the larger sphere",
            hi: "आवेश पृष्ठ क्षेत्रफलों के अनुपात में, चार से एक, बँटता है, क्योंकि आवेश पृष्ठ पर रहता है और बड़े गोले पर उसका चार गुना है",
            mr: "प्रभार पृष्ठफळांच्या गुणोत्तरात, चार ते एक, वाटला जातो, कारण प्रभार पृष्ठावर राहतो आणि मोठ्या गोलावर त्याचे चौपट आहे",
          },
          {
            en: "Charge flows until the potentials are equal and the total electrostatic energy is unchanged, since no external agent did any work on the system",
            hi: "आवेश तब तक बहता है जब तक विभव बराबर न हो जाएँ और कुल स्थिरवैद्युत ऊर्जा अपरिवर्तित रहती है, क्योंकि किसी बाहरी कर्ता ने निकाय पर कार्य नहीं किया",
            mr: "प्रभार तोवर वाहतो जोवर विभव समान होत नाहीत आणि एकूण स्थिरविद्युत ऊर्जा अपरिवर्तित राहते, कारण कोणत्याही बाह्य कर्त्याने संस्थेवर कार्य केलेले नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three separate ideas are being tested here, and each one is a place students routinely go wrong. FIRST, what does the flow stop for? A wire lets free charge move, and charge moves whenever there is a potential difference along the conductor it sits in. So the flow continues until the potential difference is zero — until the two spheres, now one connected conductor, are at a single common potential. The stopping condition is equality of POTENTIAL, never equality of charge. Charge is what flows; potential is what drives the flow; and confusing the two is like predicting that water joined by a pipe will divide equally between a bathtub and a bucket. For an isolated sphere, V = kq/r. Setting kq₁/(2R) = kq₂/R gives q₁ = 2q₂, and with q₁ + q₂ = Q by conservation, the larger sphere retains 2Q/3 and the smaller acquires Q/3. SECOND, the surface density. It is tempting to conclude that the bigger sphere, holding more charge, is the more heavily charged. Compute σ = q/(4πr²): for the large sphere σ₁ ∝ (2Q/3)/(4R²), for the small one σ₂ ∝ (Q/3)/R², so σ₂ = 2σ₁. The SMALLER sphere carries twice the surface density. In general σ ∝ 1/r, and since the field just outside a conductor is σ/ε₀, the field is strongest where the radius of curvature is smallest. This is the whole physics of the lightning conductor and of corona discharge at sharp edges: a point is a region of very small r, so σ and hence E become large enough there to ionise the surrounding air even when the conductor as a whole is at a modest potential. THIRD, the energy. Compute it. Initially U_i = kQ²/(2 · 2R) = kQ²/4R. Finally U_f = k(2Q/3)²/(2 · 2R) + k(Q/3)²/(2R) = kQ²(4/9)/(4R) + kQ²(1/9)/(2R) = kQ²/9R + kQ²/18R = kQ²/6R. Since kQ²/6R is less than kQ²/4R, energy has been lost — a third of it, in fact. Where did it go? Into the wire. While the charge was flowing there was a current, the wire has resistance however thin and however good the metal, and I²R heating dissipated the difference; any part not turned into heat was radiated as electromagnetic waves by the accelerating charge. This is not a violation of energy conservation but an illustration of it: electrostatic energy is not the whole ledger, and a process that redistributes charge irreversibly must pay for the redistribution. Notably, the loss does not vanish as the wire's resistance is made smaller — a smaller resistance means a larger current for a shorter time, and the product I²Rt stays put. (The second option applies conservation of charge and then stops, missing the condition that ends the flow; the third confuses where charge sits with how it apportions; the fourth gets the mechanism right and then assumes electrostatic energy is the only account.)",
          hi: "यहाँ तीन अलग विचार जाँचे जा रहे हैं, और हर एक वह जगह है जहाँ विद्यार्थी नियमित रूप से चूकते हैं। पहला, बहाव किसके लिए रुकता है? तार मुक्त आवेश को चलने देता है, और आवेश तभी चलता है जब जिस चालक में वह बैठा है उसके अनुदिश विभवांतर हो। अतः बहाव तब तक चलता है जब तक विभवांतर शून्य न हो — जब तक दोनों गोले, अब एक जुड़ा चालक, एक ही साझा विभव पर न आ जाएँ। रुकने की शर्त विभव की समानता है, आवेश की समानता कभी नहीं। आवेश वह है जो बहता है; विभव वह है जो बहाव चलाता है; और दोनों को गड्डमड्ड करना ऐसा है जैसे यह कहना कि पाइप से जुड़ा पानी टब और बाल्टी में बराबर बँटेगा। विलगित गोले के लिए V = kq/r. kq₁/(2R) = kq₂/R रखने पर q₁ = 2q₂, और संरक्षण से q₁ + q₂ = Q होने पर, बड़ा गोला 2Q/3 रखता है और छोटा Q/3 पाता है। दूसरा, पृष्ठ घनत्व। यह निष्कर्ष लुभाता है कि बड़ा गोला, जिसमें अधिक आवेश है, अधिक भारी आवेशित है। σ = q/(4πr²) निकालो: बड़े गोले के लिए σ₁ ∝ (2Q/3)/(4R²), छोटे के लिए σ₂ ∝ (Q/3)/R², अतः σ₂ = 2σ₁. छोटा गोला दुगुना पृष्ठ घनत्व रखता है। सामान्यतः σ ∝ 1/r, और चूँकि चालक के ठीक बाहर क्षेत्र σ/ε₀ है, क्षेत्र वहाँ सबसे प्रबल है जहाँ वक्रता त्रिज्या सबसे छोटी है। तड़ित चालक और नुकीले किनारों पर कोरोना विसर्जन की पूरी भौतिकी यही है: नोक बहुत छोटे r का क्षेत्र है, अतः σ और इसलिए E वहाँ इतने बड़े हो जाते हैं कि आसपास की वायु आयनित हो जाए, भले ही पूरा चालक मामूली विभव पर हो। तीसरा, ऊर्जा। उसे निकालो। आरंभ में U_i = kQ²/(2 · 2R) = kQ²/4R. अंत में U_f = k(2Q/3)²/(2 · 2R) + k(Q/3)²/(2R) = kQ²(4/9)/(4R) + kQ²(1/9)/(2R) = kQ²/9R + kQ²/18R = kQ²/6R. चूँकि kQ²/6R, kQ²/4R से कम है, ऊर्जा गई है — वस्तुतः उसका एक-तिहाई। कहाँ गई? तार में। जब आवेश बह रहा था तब धारा थी, तार कितना भी पतला और धातु कितनी भी अच्छी हो उसमें प्रतिरोध है, और I²R ऊष्मन ने अंतर खपा दिया; जो भाग ऊष्मा न बना वह त्वरित आवेश से विद्युत चुंबकीय तरंगों के रूप में विकिरित हुआ। यह ऊर्जा संरक्षण का उल्लंघन नहीं बल्कि उसका उदाहरण है: स्थिरवैद्युत ऊर्जा पूरा बहीखाता नहीं, और जो प्रक्रिया आवेश को अनुत्क्रमणीय ढंग से फिर बाँटती है उसे उस पुनर्वितरण की क़ीमत चुकानी पड़ती है। ध्यान देने योग्य बात यह कि तार का प्रतिरोध छोटा करने पर हानि लुप्त नहीं होती — छोटा प्रतिरोध मतलब कम समय के लिए बड़ी धारा, और गुणनफल I²Rt वहीं का वहीं रहता है। (दूसरा विकल्प आवेश संरक्षण लगाकर रुक जाता है और बहाव ख़त्म करने वाली शर्त चूक जाता है; तीसरा आवेश कहाँ बैठता है और वह कैसे बँटता है, दोनों को गड्डमड्ड करता है; चौथा क्रियाविधि ठीक पकड़कर मान लेता है कि स्थिरवैद्युत ऊर्जा ही एकमात्र खाता है।)",
          mr: "इथे तीन वेगळ्या कल्पना तपासल्या जात आहेत, आणि प्रत्येक ती जागा आहे जिथे विद्यार्थी नियमितपणे चुकतात. पहिली, वाहणे कशासाठी थांबते? तार मुक्त प्रभाराला हलू देते, आणि प्रभार तेव्हाच हलतो जेव्हा तो ज्या वाहकात बसला आहे त्याच्या दिशेने विभवांतर असते. म्हणून वाहणे तोवर चालते जोवर विभवांतर शून्य होत नाही — जोवर दोन्ही गोल, आता एक जोडलेला वाहक, एकाच सामायिक विभवावर येत नाहीत. थांबण्याची अट विभवाची समानता आहे, प्रभाराची समानता कधीच नाही. प्रभार तो जो वाहतो; विभव तो जो वाहणे चालवतो; आणि दोन्हींची गल्लत करणे म्हणजे नळाने जोडलेले पाणी टब आणि बादलीत समान वाटले जाईल असे भाकीत करण्यासारखे. एकाकी गोलासाठी V = kq/r. kq₁/(2R) = kq₂/R ठेवल्यास q₁ = 2q₂, आणि संधारणाने q₁ + q₂ = Q असल्याने, मोठा गोल 2Q/3 ठेवतो आणि लहान Q/3 मिळवतो. दुसरी, पृष्ठ घनता. मोठा गोल, ज्यात अधिक प्रभार, तोच अधिक जड प्रभारित असा निष्कर्ष मोह घालतो. σ = q/(4πr²) काढा: मोठ्या गोलासाठी σ₁ ∝ (2Q/3)/(4R²), लहानासाठी σ₂ ∝ (Q/3)/R², म्हणून σ₂ = 2σ₁. लहान गोल दुप्पट पृष्ठ घनता बाळगतो. सर्वसाधारणपणे σ ∝ 1/r, आणि वाहकाच्या अगदी बाहेरचे क्षेत्र σ/ε₀ असल्याने, क्षेत्र तिथे सर्वांत तीव्र जिथे वक्रता त्रिज्या सर्वांत लहान. वीजवाहक आणि टोकदार कडांवरील कोरोना विसर्जनाची अख्खी भौतिकी हीच आहे: टोक हा फार लहान r चा प्रदेश आहे, म्हणून σ आणि पर्यायाने E तिथे इतके मोठे होतात की आजूबाजूची हवा आयनित व्हावी, जरी अख्खा वाहक माफक विभवावर असला तरी. तिसरी, ऊर्जा. ती काढा. सुरुवातीला U_i = kQ²/(2 · 2R) = kQ²/4R. शेवटी U_f = k(2Q/3)²/(2 · 2R) + k(Q/3)²/(2R) = kQ²(4/9)/(4R) + kQ²(1/9)/(2R) = kQ²/9R + kQ²/18R = kQ²/6R. kQ²/6R हे kQ²/4R हून कमी असल्याने, ऊर्जा गेली आहे — प्रत्यक्षात तिचा एक-तृतीयांश. कुठे गेली? तारेत. प्रभार वाहत असताना धारा होती, तार कितीही बारीक आणि धातू कितीही चांगली असो तिच्यात रोध आहे, आणि I²R तापनाने फरक खर्च केला; जो भाग उष्णता झाला नाही तो त्वरित प्रभाराकडून विद्युतचुंबकीय लहरींच्या रूपात प्रारित झाला. हे ऊर्जा संधारणाचे उल्लंघन नसून त्याचे उदाहरण आहे: स्थिरविद्युत ऊर्जा हा अख्खा जमाखर्च नाही, आणि जी प्रक्रिया प्रभाराचे अपरिवर्तनीय पुनर्वाटप करते तिला त्या पुनर्वाटपाची किंमत मोजावी लागते. लक्षात घेण्याजोगे हे की तारेचा रोध लहान केल्याने हानी नाहीशी होत नाही — लहान रोध म्हणजे कमी काळासाठी मोठी धारा, आणि गुणाकार I²Rt जिथल्या तिथे राहतो. (दुसरा पर्याय प्रभार संधारण लावून थांबतो आणि वाहणे संपवणारी अट चुकवतो; तिसरा प्रभार कुठे बसतो आणि तो कसा वाटला जातो यांची गल्लत करतो; चौथा यंत्रणा बरोबर पकडून मग गृहीत धरतो की स्थिरविद्युत ऊर्जा हेच एकमेव खाते आहे.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Current Electricity                                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-current-electricity",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 3 — Current Electricity",
      hi: "अध्याय 3 — विद्युत धारा",
      mr: "प्रकरण 3 — विद्युत धारा",
    },
    name: {
      en: "Current Electricity",
      hi: "विद्युत धारा",
      mr: "विद्युत धारा",
    },
    summary: {
      en: "Charge allowed to keep moving instead of settling: electrons that drift through a wire slower than a walking child while the signal to start arrives almost at the speed of light; a resistance that turns out to be a length and a thickness wrapped around a number belonging to the material itself; a proportionality between voltage and current that is a description of certain substances rather than a law of nature; a source whose stated voltage is never quite what its terminals deliver, because it has resistance of its own to push current through; and two bookkeeping rules for a network of junctions and loops that are conservation of charge and conservation of energy under other names.",
      hi: "जमने के बजाय चलते रहने दिया गया आवेश: वे इलेक्ट्रॉन जो तार में चलते बच्चे से भी धीमे बहते हैं जबकि चलने का संकेत लगभग प्रकाश की चाल से पहुँचता है; वह प्रतिरोध जो निकलकर एक लंबाई और एक मोटाई निकलता है जो पदार्थ की अपनी संख्या के चारों ओर लिपटी है; वोल्टता और धारा के बीच वह समानुपात जो प्रकृति का नियम नहीं बल्कि कुछ पदार्थों का वर्णन है; वह स्रोत जिसकी बताई वोल्टता उसके सिरे कभी ठीक-ठीक नहीं देते, क्योंकि धारा को धकेलने के लिए उसका अपना प्रतिरोध है; और संधियों तथा लूपों के जाल के लिए दो हिसाब-नियम जो दूसरे नामों से आवेश संरक्षण और ऊर्जा संरक्षण ही हैं।",
      mr: "स्थिरावण्याऐवजी चालत राहू दिलेला प्रभार: ते इलेक्ट्रॉन जे तारेतून चालणाऱ्या मुलाहूनही सावकाश वाहतात तर सुरू होण्याचा संकेत जवळपास प्रकाशाच्या वेगाने पोहोचतो; तो रोध जो निघून एक लांबी आणि एक जाडी निघते जी पदार्थाच्याच स्वतःच्या संख्येभोवती गुंडाळलेली आहे; व्होल्टेज आणि धारा यांतले ते समानुपात जे निसर्गाचा नियम नसून काही पदार्थांचे वर्णन आहे; तो स्रोत ज्याचा सांगितलेला व्होल्टेज त्याची टोके कधीच नेमका देत नाहीत, कारण धारा ढकलण्यासाठी त्याचा स्वतःचा रोध आहे; आणि संधी व वळशांच्या जाळ्यासाठी दोन हिशेब-नियम जे दुसऱ्या नावांनी प्रभार संधारण आणि ऊर्जा संधारणच आहेत.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "drift-velocity",
        name: {
          en: "Drift velocity",
          hi: "अपवाह वेग",
          mr: "अपवाह वेग",
        },
        kind: "defined quantity",
        prompt: {
          en: "Electrons in a copper wire move at hundreds of kilometres per second in random directions; superposed on that chaos is a slow, steady creep of the order of a millimetre per second along the wire. What is that creep called?",
          hi: "ताँबे के तार में इलेक्ट्रॉन सैकड़ों किलोमीटर प्रति सेकंड की चाल से यादृच्छिक दिशाओं में चलते हैं; उस अराजकता पर आरोपित है तार के अनुदिश लगभग एक मिलीमीटर प्रति सेकंड की धीमी, स्थिर सरकन। उस सरकन को क्या कहते हैं?",
          mr: "तांब्याच्या तारेत इलेक्ट्रॉन शेकडो किलोमीटर प्रति सेकंद वेगाने यादृच्छिक दिशांनी हलतात; त्या गोंधळावर आरोपित आहे तारेच्या दिशेने सुमारे एक मिलीमीटर प्रति सेकंदाची सावकाश, स्थिर सरकण. त्या सरकणीला काय म्हणतात?",
        },
        statement: {
          en: "Drift velocity is the small average velocity electrons acquire along a wire under an applied field, given by v_d = I/(nAe) and typically of the order of 10⁻⁴ m/s.",
          hi: "अपवाह वेग वह छोटा औसत वेग है जो इलेक्ट्रॉन लगाए गए क्षेत्र में तार के अनुदिश पाते हैं, जो v_d = I/(nAe) से मिलता है और प्रायः 10⁻⁴ m/s की कोटि का होता है।",
          mr: "अपवाह वेग म्हणजे लावलेल्या क्षेत्रात इलेक्ट्रॉन तारेच्या दिशेने मिळवत असलेला लहान सरासरी वेग, जो v_d = I/(nAe) ने मिळतो आणि सहसा 10⁻⁴ m/s च्या कोटीचा असतो.",
        },
        detail: {
          en: "It is an average and not a speed: individual electrons still hurtle about, and the drift is only what survives when their random velocities cancel over the whole population.",
          hi: "यह औसत है, चाल नहीं: अलग-अलग इलेक्ट्रॉन अब भी दौड़ते रहते हैं, और अपवाह केवल वह है जो पूरी आबादी पर उनके यादृच्छिक वेग कटने के बाद बचता है।",
          mr: "ही सरासरी आहे, वेग नव्हे: वैयक्तिक इलेक्ट्रॉन अजूनही धावतच असतात, आणि अपवाह म्हणजे संपूर्ण समुदायावर त्यांचे यादृच्छिक वेग कापल्यावर उरणारे तेवढेच.",
        },
        extra: {
          en: "A wire's current is proportional to it, so doubling the current doubles the drift velocity — but a thicker wire carrying the same current has a slower drift, since the same charge per second is spread over more electrons.",
          hi: "तार की धारा इसके समानुपाती है, अतः धारा दुगुनी करने पर अपवाह वेग दुगुना होता है — पर उतनी ही धारा ले जाने वाले मोटे तार में अपवाह धीमा है, क्योंकि प्रति सेकंड वही आवेश अधिक इलेक्ट्रॉनों में बँटा है।",
          mr: "तारेची धारा हिच्याशी समानुपाती आहे, म्हणून धारा दुप्पट केल्यास अपवाह वेग दुप्पट होतो — पण तितकीच धारा वाहणाऱ्या जाड तारेत अपवाह सावकाश असतो, कारण दर सेकंदाला तोच प्रभार अधिक इलेक्ट्रॉनांत वाटला जातो.",
        },
        pair: {
          left: {
            en: "A crawl hidden inside a stampede",
            hi: "भगदड़ के भीतर छिपी रेंगन",
            mr: "चेंगराचेंगरीत लपलेली रांगण",
          },
          right: {
            en: "drift velocity",
            hi: "अपवाह वेग",
            mr: "अपवाह वेग",
          },
        },
      },
      {
        id: "resistivity",
        name: {
          en: "Resistivity",
          hi: "प्रतिरोधकता",
          mr: "रोधकता",
        },
        kind: "defined quantity",
        prompt: {
          en: "Two copper wires of different lengths and thicknesses have different resistances, but one number is the same for both and would be quoted in a table of materials rather than of components. Which quantity is that?",
          hi: "अलग-अलग लंबाई और मोटाई के दो ताँबे के तारों के प्रतिरोध भिन्न हैं, पर एक संख्या दोनों के लिए एक है और वह पुर्ज़ों की नहीं, पदार्थों की तालिका में दी जाएगी। वह कौन-सी राशि है?",
          mr: "वेगवेगळ्या लांबीच्या आणि जाडीच्या दोन तांब्याच्या तारांचे रोध वेगळे आहेत, पण एक संख्या दोघांसाठी एकच आहे आणि ती सुट्या भागांच्या नव्हे तर पदार्थांच्या कोष्टकात दिली जाईल. ती कोणती राशी?",
        },
        statement: {
          en: "Resistivity ρ is the material's own opposition to current, defined by R = ρL/A, so resistance depends on shape while resistivity does not.",
          hi: "प्रतिरोधकता ρ धारा के प्रति पदार्थ का अपना विरोध है, जो R = ρL/A से परिभाषित है, अतः प्रतिरोध आकार पर निर्भर है जबकि प्रतिरोधकता नहीं।",
          mr: "रोधकता ρ म्हणजे धारेला पदार्थाचा स्वतःचा विरोध, जी R = ρL/A ने व्याख्यायित, म्हणून रोध आकारावर अवलंबून असतो तर रोधकता नसते.",
        },
        detail: {
          en: "For a metal it rises with temperature, because hotter ions vibrate more and the electrons collide sooner; for a semiconductor it falls with temperature, because heat frees more carriers than it hinders.",
          hi: "धातु के लिए यह ताप के साथ बढ़ती है, क्योंकि गर्म आयन अधिक कंपते हैं और इलेक्ट्रॉन जल्दी टकराते हैं; अर्धचालक के लिए यह ताप के साथ घटती है, क्योंकि ऊष्मा जितनी बाधा डालती है उससे अधिक वाहक मुक्त करती है।",
          mr: "धातूसाठी ती तापमानासोबत वाढते, कारण तापलेले आयन अधिक कंप पावतात आणि इलेक्ट्रॉन लवकर आदळतात; अर्धवाहकासाठी ती तापमानासोबत घटते, कारण उष्णता जितका अडथळा आणते त्याहून अधिक वाहक मुक्त करते.",
        },
        extra: {
          en: "Stretching a wire without removing metal changes both L and A at once, so doubling the length quarters the area and multiplies the resistance by four, not by two.",
          hi: "धातु हटाए बिना तार खींचने पर L और A दोनों एक साथ बदलते हैं, अतः लंबाई दुगुनी करने पर क्षेत्रफल चौथाई होता है और प्रतिरोध चार गुना, दो गुना नहीं।",
          mr: "धातू न काढता तार ताणल्यास L आणि A दोन्ही एकाच वेळी बदलतात, म्हणून लांबी दुप्पट केल्यास क्षेत्रफळ चतुर्थांश होते आणि रोध चौपट, दुप्पट नव्हे.",
        },
        pair: {
          left: {
            en: "In the table of materials, not of components",
            hi: "पुर्ज़ों की नहीं, पदार्थों की तालिका में",
            mr: "सुट्या भागांच्या नव्हे, पदार्थांच्या कोष्टकात",
          },
          right: {
            en: "resistivity",
            hi: "प्रतिरोधकता",
            mr: "रोधकता",
          },
        },
      },
      {
        id: "electromotive-force",
        name: {
          en: "Electromotive force",
          hi: "विद्युत वाहक बल",
          mr: "विद्युतचालक बल",
        },
        kind: "defined quantity",
        prompt: {
          en: "The energy a source gives to each coulomb it drives round the whole circuit — a quantity measured in volts despite its name, and equal to the terminal voltage only when no current is being drawn. Which quantity is this?",
          hi: "स्रोत हर उस कूलॉम को जो ऊर्जा देता है जिसे वह पूरे परिपथ में घुमाता है — नाम के बावजूद वोल्ट में नापी जाने वाली राशि, और सिरों की वोल्टता के बराबर केवल तब जब कोई धारा न ली जा रही हो। यह कौन-सी राशि है?",
          mr: "स्रोत ज्या प्रत्येक कुलोमला संपूर्ण परिपथातून फिरवतो त्याला देत असलेली ऊर्जा — नावाला न जुमानता व्होल्टमध्ये मोजली जाणारी राशी, आणि टोकांच्या व्होल्टेजइतकी केवळ तेव्हाच जेव्हा कोणतीही धारा घेतली जात नसेल. ही कोणती राशी?",
        },
        statement: {
          en: "Electromotive force is the work done per unit charge by a source in driving charge round the complete circuit, and it exceeds the terminal potential difference by the drop Ir across the source's own internal resistance.",
          hi: "विद्युत वाहक बल वह कार्य प्रति एकांक आवेश है जो स्रोत पूरे परिपथ में आवेश घुमाने में करता है, और वह सिरों के विभवांतर से स्रोत के अपने आंतरिक प्रतिरोध पर हुए Ir पतन जितना अधिक होता है।",
          mr: "विद्युतचालक बल म्हणजे स्रोताने संपूर्ण परिपथातून प्रभार फिरवण्यात केलेले प्रति एकक प्रभार कार्य, आणि ते टोकांच्या विभवांतराहून स्रोताच्या स्वतःच्या अंतर्गत रोधावरील Ir घसरणीइतके अधिक असते.",
        },
        detail: {
          en: "It is not a force at all: the name is a nineteenth-century survival, and its unit is the volt, which is why writing it in newtons is a mistake that costs marks every year.",
          hi: "यह बल है ही नहीं: नाम उन्नीसवीं सदी का बचा हुआ है, और इसका मात्रक वोल्ट है, इसीलिए इसे न्यूटन में लिखना वह भूल है जो हर साल अंक ले जाती है।",
          mr: "हे बल मुळीच नाही: नाव एकोणिसाव्या शतकातले उरलेले, आणि याचे एकक व्होल्ट आहे, म्हणूनच ते न्यूटनमध्ये लिहिणे ही चूक दरवर्षी गुण नेते.",
        },
        extra: {
          en: "A cell's terminal voltage sags the moment a heavy load is connected, which is why a car's headlights dim while the starter motor turns and recover the instant the engine catches.",
          hi: "भारी लोड जुड़ते ही सेल के सिरों की वोल्टता बैठ जाती है, इसीलिए स्टार्टर मोटर घूमते समय कार की बत्तियाँ मंद पड़ती हैं और इंजन चालू होते ही तुरंत लौट आती हैं।",
          mr: "जड भार जोडताच घटाच्या टोकांचा व्होल्टेज बसतो, म्हणूनच स्टार्टर मोटर फिरत असताना गाडीचे दिवे मंद होतात आणि इंजिन सुरू होताच लगेच परत येतात.",
        },
        pair: {
          left: {
            en: "Called a force, measured in volts",
            hi: "कहलाता बल, नापा वोल्ट में",
            mr: "म्हटले बल, मोजले व्होल्टमध्ये",
          },
          right: {
            en: "electromotive force",
            hi: "विद्युत वाहक बल",
            mr: "विद्युतचालक बल",
          },
        },
      },
      {
        id: "limits-of-ohms-law",
        name: {
          en: "The limits of Ohm's law",
          hi: "ओम के नियम की सीमाएँ",
          mr: "ओहमच्या नियमाच्या मर्यादा",
        },
        kind: "circuit rule",
        prompt: {
          en: "A metal held at one temperature gives a straight line through the origin, while a diode, an electrolyte and a filament that heats as it glows each give a bent or lopsided graph without breaking any physics at all. What is that boundary called?",
          hi: "एक ताप पर रखी धातु मूल बिंदु से जाती सरल रेखा देती है, जबकि डायोड, विद्युत अपघट्य और दमकते-दमकते गर्म होता तंतु — हर एक — मुड़ा या टेढ़ा ग्राफ़ देता है और कोई भौतिकी तोड़ता ही नहीं। उस सीमा को क्या कहते हैं?",
          mr: "एका तापमानावर ठेवलेली धातू मूळबिंदूतून जाणारी सरळ रेषा देते, तर डायोड, विद्युत अपघटनी आणि चमकता चमकता तापणारा तंतू — प्रत्येक — वाकडा वा तिरका आलेख देतो आणि कोणतीही भौतिकी मोडतच नाही. त्या सीमेला काय म्हणतात?",
        },
        statement: {
          en: "The limits of Ohm's law are the conditions V = IR silently assumes — a single material at a fixed temperature whose resistance does not itself depend on the current — so a substance that fails the straight-line test is non-ohmic rather than anomalous.",
          hi: "ओम के नियम की सीमाएँ वे शर्तें हैं जो V = IR चुपचाप मान लेता है — निश्चित ताप पर एक ही पदार्थ जिसका प्रतिरोध स्वयं धारा पर निर्भर न हो — अतः जो पदार्थ सरल-रेखा की जाँच में विफल होता है वह असामान्य नहीं, अनओमी है।",
          mr: "ओहमच्या नियमाच्या मर्यादा म्हणजे V = IR ज्या अटी मुकाट्याने गृहीत धरतो — ठराविक तापमानावरचा एकच पदार्थ ज्याचा रोध स्वतः धारेवर अवलंबून नाही — म्हणून जो पदार्थ सरळ-रेषेच्या चाचणीत नापास होतो तो असामान्य नसून अनओहमी असतो.",
        },
        detail: {
          en: "The proportionality is a description of how certain substances happen to behave rather than a law of nature, and nothing else in the chapter would change if no material were ohmic at all.",
          hi: "समानुपात प्रकृति का नियम नहीं बल्कि इस बात का वर्णन है कि कुछ पदार्थ किस तरह बरतते हैं, और यदि कोई भी पदार्थ ओमी न होता तो अध्याय में और कुछ भी न बदलता।",
          mr: "समानुपात हा निसर्गाचा नियम नसून काही पदार्थ कसे वागतात याचे वर्णन आहे, आणि जर कोणताही पदार्थ ओहमी नसता तर प्रकरणात दुसरे काहीही बदलले नसते.",
        },
        extra: {
          en: "The condition usually dropped is the fixed temperature, and it matters: a bulb's filament has several times more resistance when glowing than when cold, so its graph bends away from the straight line the moment it starts to do its job.",
          hi: "जो शर्त प्रायः छोड़ दी जाती है वह निश्चित ताप है, और वह मायने रखती है: बल्ब का तंतु दमकते समय ठंडे की तुलना में कई गुना अधिक प्रतिरोध रखता है, अतः जैसे ही वह अपना काम शुरू करता है उसका ग्राफ़ सरल रेखा से मुड़ जाता है।",
          mr: "जी अट सहसा गाळली जाते ती ठराविक तापमानाची, आणि ती महत्त्वाची आहे: बल्बचा तंतू चमकताना थंड असतानाहून कितीतरी पट अधिक रोध बाळगतो, म्हणून तो आपले काम सुरू करताच त्याचा आलेख सरळ रेषेपासून वाकतो.",
        },
        pair: {
          left: {
            en: "The straight line was a description, never a promise",
            hi: "सरल रेखा वर्णन थी, वादा कभी नहीं",
            mr: "सरळ रेषा वर्णन होते, वचन कधीच नाही",
          },
          right: {
            en: "the limits of Ohm's law",
            hi: "ओम के नियम की सीमाएँ",
            mr: "ओहमच्या नियमाच्या मर्यादा",
          },
        },
      },
      {
        id: "kirchhoff-junction-rule",
        name: {
          en: "Kirchhoff's junction rule",
          hi: "किरचॉफ़ का संधि नियम",
          mr: "किरचॉफचा संधी नियम",
        },
        kind: "circuit rule",
        prompt: {
          en: "At any meeting point of wires, the currents arriving must add up to the currents leaving, because charge does not pile up at a point of a steady circuit. Which rule is this?",
          hi: "तारों के किसी भी मिलन बिंदु पर, आने वाली धाराओं का योग जाने वाली धाराओं के योग के बराबर होना चाहिए, क्योंकि स्थायी परिपथ के किसी बिंदु पर आवेश जमा नहीं होता। यह कौन-सा नियम है?",
          mr: "तारांच्या कोणत्याही भेटबिंदूवर, येणाऱ्या धारांची बेरीज जाणाऱ्या धारांच्या बेरजेइतकी असावी लागते, कारण स्थिर परिपथाच्या कोणत्याही बिंदूवर प्रभार साठत नाही. हा कोणता नियम?",
        },
        statement: {
          en: "Kirchhoff's junction rule says the algebraic sum of currents at any junction is zero, which is conservation of charge applied to a point that has no capacity to store any.",
          hi: "किरचॉफ़ का संधि नियम कहता है कि किसी भी संधि पर धाराओं का बीजगणितीय योग शून्य है, जो ऐसे बिंदु पर लगाया गया आवेश संरक्षण है जिसमें कुछ भी संचित करने की क्षमता नहीं।",
          mr: "किरचॉफचा संधी नियम सांगतो की कोणत्याही संधीवर धारांची बीजगणितीय बेरीज शून्य असते, जे अशा बिंदूवर लावलेले प्रभार संधारण आहे ज्याच्यात काहीही साठवण्याची क्षमता नाही.",
        },
        detail: {
          en: "It applies only to steady currents: a capacitor plate is precisely a place where charge does accumulate, which is why the rule is written for junctions of wires and not for every point of a circuit.",
          hi: "यह केवल स्थायी धाराओं पर लागू होता है: संधारित्र की प्लेट ठीक वह जगह है जहाँ आवेश जमा होता ही है, इसीलिए नियम तारों की संधियों के लिए लिखा गया है, परिपथ के हर बिंदु के लिए नहीं।",
          mr: "हा केवळ स्थिर धारांना लागू होतो: धारित्राची पट्टी ही नेमकी ती जागा जिथे प्रभार साठतोच, म्हणूनच नियम तारांच्या संधींसाठी लिहिलेला आहे, परिपथाच्या प्रत्येक बिंदूसाठी नव्हे.",
        },
        extra: {
          en: "Its practical use is that a wrong guess about a current's direction costs nothing: solve with the assumed arrows and a negative answer simply means the current runs the other way.",
          hi: "इसका व्यावहारिक लाभ यह कि धारा की दिशा का ग़लत अनुमान कुछ नहीं बिगाड़ता: मानी गई दिशाओं से हल करो और ऋण उत्तर का बस इतना अर्थ है कि धारा दूसरी ओर बहती है।",
          mr: "याचा व्यावहारिक फायदा असा की धारेच्या दिशेचा चुकीचा अंदाज काहीही बिघडवत नाही: गृहीत धरलेल्या बाणांनी सोडवा आणि ऋण उत्तराचा फक्त इतकाच अर्थ की धारा दुसऱ्या दिशेने वाहते.",
        },
        pair: {
          left: {
            en: "Nothing piles up where wires meet",
            hi: "जहाँ तार मिलते हैं वहाँ कुछ जमा नहीं होता",
            mr: "जिथे तारा भेटतात तिथे काहीच साठत नाही",
          },
          right: {
            en: "Kirchhoff's junction rule",
            hi: "किरचॉफ़ का संधि नियम",
            mr: "किरचॉफचा संधी नियम",
          },
        },
      },
      {
        id: "kirchhoff-loop-rule",
        name: {
          en: "Kirchhoff's loop rule",
          hi: "किरचॉफ़ का लूप नियम",
          mr: "किरचॉफचा वळसा नियम",
        },
        kind: "circuit rule",
        prompt: {
          en: "Walk once round any closed path in a network, adding every rise and subtracting every drop, and you must arrive back at the number you started from. Which rule is this?",
          hi: "जाल के किसी भी बंद पथ पर एक बार चलो, हर उठान जोड़ते और हर पतन घटाते, और तुम्हें उसी संख्या पर लौटना ही है जहाँ से चले थे। यह कौन-सा नियम है?",
          mr: "जाळ्यातील कोणत्याही बंद मार्गावर एकदा फिरा, प्रत्येक चढ जोडत आणि प्रत्येक घसरण वजा करत, आणि तुम्हाला त्याच संख्येवर परत यावेच लागते जिथून सुरुवात केली. हा कोणता नियम?",
        },
        statement: {
          en: "Kirchhoff's loop rule says the algebraic sum of potential changes around any closed loop is zero, which is conservation of energy for a unit charge taken once round.",
          hi: "किरचॉफ़ का लूप नियम कहता है कि किसी भी बंद लूप के चारों ओर विभव परिवर्तनों का बीजगणितीय योग शून्य है, जो एक बार घुमाए गए एकांक आवेश के लिए ऊर्जा संरक्षण है।",
          mr: "किरचॉफचा वळसा नियम सांगतो की कोणत्याही बंद वळशाभोवती विभव बदलांची बीजगणितीय बेरीज शून्य असते, जे एकदा फिरवलेल्या एकक प्रभारासाठीचे ऊर्जा संधारण आहे.",
        },
        detail: {
          en: "It works because potential is single-valued: each node has one number, and returning to a node must return to that number, exactly as walking round a hill brings you back to your original altitude.",
          hi: "यह इसलिए चलता है कि विभव एकमानी है: हर गाँठ की एक संख्या है, और गाँठ पर लौटने का अर्थ उसी संख्या पर लौटना है, ठीक वैसे जैसे पहाड़ी के चारों ओर घूमकर तुम अपनी मूल ऊँचाई पर लौट आते हो।",
          mr: "हे यामुळे चालते की विभव एकमूल्यी आहे: प्रत्येक गाठीची एक संख्या आहे, आणि गाठीवर परतणे म्हणजे त्याच संख्येवर परतणे, अगदी तसेच जसे टेकडीभोवती फिरून तुम्ही आपल्या मूळ उंचीवर परत येता.",
        },
        extra: {
          en: "The sign convention decides everything: a cell traversed from its negative to its positive terminal is a rise of e.m.f., and a resistor traversed along the current is a drop of IR.",
          hi: "चिह्न-परिपाटी सब कुछ तय करती है: ऋण से धन सिरे की ओर पार किया गया सेल विद्युत वाहक बल की उठान है, और धारा के अनुदिश पार किया गया प्रतिरोधक IR का पतन है।",
          mr: "चिन्ह-संकेत सर्व काही ठरवतो: ऋणाकडून धन टोकाकडे ओलांडलेला घट म्हणजे विद्युतचालक बलाची चढ, आणि धारेच्या दिशेने ओलांडलेला रोधक म्हणजे IR ची घसरण.",
        },
        pair: {
          left: {
            en: "Round the hill and back to the same altitude",
            hi: "पहाड़ी के चारों ओर और उसी ऊँचाई पर वापस",
            mr: "टेकडीभोवती आणि त्याच उंचीवर परत",
          },
          right: {
            en: "Kirchhoff's loop rule",
            hi: "किरचॉफ़ का लूप नियम",
            mr: "किरचॉफचा वळसा नियम",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student computes the drift velocity of electrons in the wire to a ceiling lamp and finds it to be about 0.1 mm per second — so an electron leaving the switch would take hours to reach the bulb. Yet the bulb lights the instant the switch is closed. Resolve the apparent contradiction.",
          hi: "एक विद्यार्थी छत के लैंप तक जाने वाले तार में इलेक्ट्रॉनों का अपवाह वेग निकालता है और वह लगभग 0.1 mm प्रति सेकंड पाता है — अर्थात् स्विच से चला इलेक्ट्रॉन बल्ब तक पहुँचने में घंटों लेगा। फिर भी स्विच दबाते ही बल्ब जल उठता है। इस दिखते विरोधाभास को सुलझाओ।",
          mr: "एक विद्यार्थी छताच्या दिव्यापर्यंत जाणाऱ्या तारेतील इलेक्ट्रॉनांचा अपवाह वेग काढतो आणि तो सुमारे 0.1 mm प्रति सेकंद येतो — म्हणजे स्विचपासून निघालेला इलेक्ट्रॉन बल्बपर्यंत पोहोचायला तास लागतील. तरीही स्विच दाबताच बल्ब पेटतो. हा दिसणारा विरोधाभास सोडवा.",
        },
        choices: [
          {
            en: "Nothing has to travel from the switch to the bulb for the bulb to light. The wire is already full of free electrons everywhere along its length, including inside the filament. Closing the switch establishes an electric field along the conductor, and that field is set up at a speed close to the speed of light — so every electron in the circuit, including those already in the filament, begins drifting almost simultaneously. The delay is the time for the FIELD to propagate, microseconds at most, not the time for any particular electron to make the journey",
            hi: "बल्ब जलने के लिए स्विच से बल्ब तक किसी को यात्रा करने की ज़रूरत ही नहीं। तार अपनी पूरी लंबाई में पहले से ही हर जगह मुक्त इलेक्ट्रॉनों से भरा है, तंतु के भीतर भी। स्विच बंद करना चालक के अनुदिश विद्युत क्षेत्र खड़ा करता है, और वह क्षेत्र प्रकाश की चाल के निकट चाल से बनता है — अतः परिपथ का हर इलेक्ट्रॉन, तंतु में पहले से मौजूद वे भी, लगभग एक साथ बहना शुरू कर देता है। देरी क्षेत्र के फैलने का समय है, अधिक से अधिक माइक्रोसेकंड, किसी विशेष इलेक्ट्रॉन के यात्रा करने का समय नहीं",
            mr: "बल्ब पेटण्यासाठी स्विचपासून बल्बपर्यंत कोणालाही प्रवास करावा लागत नाही. तार आपल्या संपूर्ण लांबीत आधीच सर्वत्र मुक्त इलेक्ट्रॉनांनी भरलेली आहे, तंतूच्या आतही. स्विच बंद करणे वाहकाच्या दिशेने विद्युत क्षेत्र उभे करते, आणि ते क्षेत्र प्रकाशाच्या वेगाच्या जवळच्या वेगाने उभे राहते — म्हणून परिपथातील प्रत्येक इलेक्ट्रॉन, तंतूत आधीच असलेले तेही, जवळपास एकाच वेळी वाहू लागतो. विलंब हा क्षेत्र पसरण्याचा काळ आहे, फार तर मायक्रोसेकंद, कोणत्याही विशिष्ट इलेक्ट्रॉनाच्या प्रवासाचा काळ नव्हे",
          },
          {
            en: "The drift velocity calculation is wrong: electrons in a metal actually travel at close to the speed of light, which is why the effect is instantaneous",
            hi: "अपवाह वेग की गणना ग़लत है: धातु में इलेक्ट्रॉन वास्तव में प्रकाश की चाल के निकट चलते हैं, इसीलिए असर तत्काल है",
            mr: "अपवाह वेगाची गणना चूक आहे: धातूत इलेक्ट्रॉन प्रत्यक्षात प्रकाशाच्या वेगाजवळ जातात, म्हणूनच परिणाम तात्काळ आहे",
          },
          {
            en: "The electrons take hours, and the bulb only appears to light at once because the human eye cannot resolve the delay",
            hi: "इलेक्ट्रॉन घंटों लेते हैं, और बल्ब तत्काल जलता केवल इसलिए लगता है कि मानव आँख उस देरी को पकड़ नहीं पाती",
            mr: "इलेक्ट्रॉन तास घेतात, आणि बल्ब लगेच पेटतो असे केवळ यामुळे वाटते की मानवी डोळा तो विलंब ओळखू शकत नाही",
          },
          {
            en: "Current in a wire is carried by the positive charges, which are far lighter than electrons and therefore move much faster",
            hi: "तार में धारा धन आवेश ले जाते हैं, जो इलेक्ट्रॉनों से कहीं हल्के हैं और इसलिए बहुत तेज़ चलते हैं",
            mr: "तारेतील धारा धन प्रभार वाहून नेतात, जे इलेक्ट्रॉनांहून कितीतरी हलके आहेत आणि म्हणून खूप वेगाने हलतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The calculation is right and the conclusion drawn from it is a category error. Take the arithmetic first, because it is worth trusting. With v_d = I/(nAe), a current of a few amperes in a copper wire of a square millimetre cross-section, and n ≈ 8.5 × 10²⁸ free electrons per cubic metre, the drift velocity really does come out at a fraction of a millimetre per second. Copper is extraordinarily crowded with carriers, and it is that crowding — not any great speed — that lets a modest drift carry a large current. So the student's number is fine. The error is in the picture that accompanies it: an image of electrons setting off from the switch like runners and the bulb waiting for the first of them to arrive. Nothing in the physics requires that. The wire is not an empty pipe waiting to be filled; it is already packed with free electrons along its entire length, and the filament of the bulb contains its own supply. What the switch does is not to release electrons but to COMPLETE THE CIRCUIT, and completing it establishes an electric field along the conductor. That field is a change in the electromagnetic configuration of space, and it propagates at a speed close to c — reduced somewhat by the wire and its surroundings, but still of the order of 10⁸ m/s. For a wire a few metres long, the field reaches the far end in a few nanoseconds. The moment it arrives, the electrons already sitting there feel a force and begin to drift. Every electron in the circuit starts moving at very nearly the same instant, and current appears everywhere at once. The good analogy is a pipe already full of water. Open a tap at one end and water comes out of the other immediately, because the pressure change travels through the water at the speed of sound in water, not because a molecule from the tap has crossed the pipe. Any particular molecule may take a very long time to make the trip. The analogy is worth keeping because it also predicts the right structure for the exception: if the pipe were empty, you would have to wait for water to cross it — and correspondingly, in a vacuum tube where there are no carriers waiting in the gap, the delay IS a transit time, and it is measurable. This is also why a long undersea cable has a real, appreciable propagation delay while an ordinary room circuit does not: what is being timed in both cases is the field, and the field cares about the length of the path and about the speed of light, not about how fast electrons crawl. (The second option throws away a correct calculation to save a wrong picture; the third saves the picture by inventing a perceptual limit; the fourth misidentifies the carrier in a metal, where the mobile charges are electrons and the positive ions are locked in the lattice.)",
          hi: "गणना सही है और उससे निकाला गया निष्कर्ष कोटि की भूल है। पहले अंकगणित लो, क्योंकि उस पर भरोसा करना चाहिए। v_d = I/(nAe) से, वर्ग मिलीमीटर परिच्छेद के ताँबे के तार में कुछ ऐम्पियर की धारा, और n ≈ 8.5 × 10²⁸ मुक्त इलेक्ट्रॉन प्रति घन मीटर लेने पर, अपवाह वेग सचमुच मिलीमीटर के अंश प्रति सेकंड निकलता है। ताँबा वाहकों से असाधारण रूप से भरा है, और वही भीड़ — न कि कोई बड़ी चाल — मामूली अपवाह से बड़ी धारा ढुलवाती है। अतः विद्यार्थी की संख्या ठीक है। भूल उसके साथ चलने वाले चित्र में है: वह छवि जिसमें इलेक्ट्रॉन स्विच से धावकों की तरह निकलते हैं और बल्ब पहले के पहुँचने की प्रतीक्षा करता है। भौतिकी में ऐसा कुछ भी नहीं जो यह माँगे। तार भरे जाने की प्रतीक्षा करता ख़ाली पाइप नहीं; वह अपनी पूरी लंबाई में पहले से मुक्त इलेक्ट्रॉनों से ठसा है, और बल्ब के तंतु के पास अपना भंडार है। स्विच जो करता है वह इलेक्ट्रॉन छोड़ना नहीं बल्कि परिपथ पूरा करना है, और उसे पूरा करना चालक के अनुदिश विद्युत क्षेत्र खड़ा कर देता है। वह क्षेत्र आकाश के विद्युत चुंबकीय विन्यास में परिवर्तन है, और वह c के निकट चाल से फैलता है — तार और उसके परिवेश से कुछ घटा हुआ, पर फिर भी 10⁸ m/s की कोटि का। कुछ मीटर लंबे तार के लिए, क्षेत्र दूर के सिरे तक कुछ नैनोसेकंड में पहुँच जाता है। पहुँचते ही, वहाँ पहले से बैठे इलेक्ट्रॉन बल अनुभव करते हैं और बहना शुरू कर देते हैं। परिपथ का हर इलेक्ट्रॉन लगभग उसी क्षण चलने लगता है, और धारा हर जगह एक साथ प्रकट होती है। अच्छी उपमा पहले से पानी भरा पाइप है। एक सिरे पर नल खोलो और दूसरे से पानी तुरंत निकलता है, क्योंकि दाब का परिवर्तन पानी में ध्वनि की चाल से चलता है, इसलिए नहीं कि नल का कोई अणु पाइप पार कर गया। कोई विशेष अणु यह यात्रा करने में बहुत लंबा समय ले सकता है। उपमा रखने योग्य है क्योंकि वह अपवाद की सही रचना भी बता देती है: यदि पाइप ख़ाली होता, तो तुम्हें पानी के पार आने की प्रतीक्षा करनी पड़ती — और तदनुरूप, निर्वात नलिका में जहाँ अंतराल में कोई वाहक बैठा नहीं, देरी सचमुच पारगमन समय है, और वह नापी जा सकती है। इसीलिए लंबे समुद्री केबल में असली, ध्यान देने योग्य संचरण-देरी होती है जबकि कमरे के साधारण परिपथ में नहीं: दोनों में जो समय नापा जा रहा है वह क्षेत्र का है, और क्षेत्र को पथ की लंबाई और प्रकाश की चाल की परवाह है, इस बात की नहीं कि इलेक्ट्रॉन कितनी धीमी रेंगते हैं। (दूसरा विकल्प ग़लत चित्र बचाने के लिए सही गणना फेंक देता है; तीसरा चित्र बचाने को बोध की सीमा गढ़ता है; चौथा धातु में वाहक की पहचान ग़लत करता है, जहाँ गतिशील आवेश इलेक्ट्रॉन हैं और धन आयन जालक में जकड़े हैं।)",
          mr: "गणना बरोबर आहे आणि तिच्यातून काढलेला निष्कर्ष ही कोटीची चूक आहे. आधी अंकगणित घ्या, कारण त्यावर विश्वास ठेवायला हवा. v_d = I/(nAe) वापरून, चौरस मिलीमीटर छेदाच्या तांब्याच्या तारेत काही अँपिअरची धारा, आणि n ≈ 8.5 × 10²⁸ मुक्त इलेक्ट्रॉन प्रति घनमीटर घेतल्यास, अपवाह वेग खरोखर मिलीमीटरच्या अंशाइतका प्रति सेकंद निघतो. तांबे वाहकांनी विलक्षण दाटलेले आहे, आणि तीच दाटी — कोणताही मोठा वेग नव्हे — माफक अपवाहाकडून मोठी धारा वाहवते. म्हणून विद्यार्थ्याचा आकडा ठीक आहे. चूक त्याच्यासोबत येणाऱ्या चित्रात आहे: ते चित्र ज्यात इलेक्ट्रॉन स्विचपासून धावपटूंसारखे निघतात आणि बल्ब पहिल्याच्या पोहोचण्याची वाट पाहतो. भौतिकीत असे काहीही नाही जे हे मागेल. तार भरण्याची वाट पाहणारा रिकामा नळ नाही; ती आपल्या संपूर्ण लांबीत आधीपासून मुक्त इलेक्ट्रॉनांनी ठासलेली आहे, आणि बल्बच्या तंतूकडे स्वतःचा साठा आहे. स्विच जे करतो ते इलेक्ट्रॉन सोडणे नव्हे तर परिपथ पूर्ण करणे, आणि तो पूर्ण करणे वाहकाच्या दिशेने विद्युत क्षेत्र उभे करते. ते क्षेत्र म्हणजे अवकाशाच्या विद्युतचुंबकीय मांडणीतला बदल, आणि ते c च्या जवळच्या वेगाने पसरते — तार आणि तिच्या परिसराने काहीसे घटलेले, पण तरीही 10⁸ m/s च्या कोटीचे. काही मीटर लांब तारेसाठी, क्षेत्र दूरच्या टोकाला काही नॅनोसेकंदांत पोहोचते. पोहोचताच, तिथे आधीच बसलेले इलेक्ट्रॉन बल अनुभवतात आणि वाहू लागतात. परिपथातील प्रत्येक इलेक्ट्रॉन जवळपास त्याच क्षणी हलू लागतो, आणि धारा सर्वत्र एकाच वेळी प्रकट होते. चांगली उपमा म्हणजे आधीच पाण्याने भरलेला नळ. एका टोकाला नळ उघडा आणि दुसऱ्या टोकातून पाणी लगेच येते, कारण दाबाचा बदल पाण्यात ध्वनीच्या वेगाने चालतो, यामुळे नव्हे की नळाचा एखादा रेणू पाइप ओलांडून गेला. कोणताही विशिष्ट रेणू हा प्रवास करायला फार वेळ घेऊ शकतो. उपमा ठेवण्याजोगी आहे कारण ती अपवादाची बरोबर रचनाही सांगते: जर नळ रिकामा असता, तर तुम्हाला पाणी ओलांडून येण्याची वाट पाहावी लागली असती — आणि त्याअनुषंगाने, निर्वात नलिकेत जिथे फटीत कोणताही वाहक बसलेला नाही, विलंब खरोखर पारगमन काळ आहे, आणि तो मोजता येतो. म्हणूनच लांब समुद्री केबलमध्ये खरा, लक्षणीय संचरण-विलंब असतो तर खोलीच्या साध्या परिपथात नाही: दोन्हींत जो काळ मोजला जात आहे तो क्षेत्राचा आहे, आणि क्षेत्राला मार्गाच्या लांबीची आणि प्रकाशाच्या वेगाची पर्वा आहे, इलेक्ट्रॉन किती सावकाश रांगतात याची नाही. (दुसरा पर्याय चुकीचे चित्र वाचवण्यासाठी बरोबर गणना फेकून देतो; तिसरा चित्र वाचवायला आकलनाची मर्यादा घडवतो; चौथा धातूतल्या वाहकाची ओळख चुकवतो, जिथे गतिशील प्रभार इलेक्ट्रॉन आहेत आणि धन आयन जाळीत जखडलेले आहेत.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A car battery is marked 12 V. A voltmeter across its terminals reads 12.6 V with the engine off and nothing switched on, but drops to 9.5 V while the starter motor is cranking, then returns. The owner concludes the battery is faulty. Explain the readings and say what quantity would actually diagnose the battery.",
          hi: "एक कार बैटरी पर 12 V अंकित है। इंजन बंद और कुछ भी चालू न होने पर उसके सिरों पर लगा वोल्टमापी 12.6 V दिखाता है, पर स्टार्टर मोटर घूमते समय गिरकर 9.5 V हो जाता है, फिर लौट आता है। मालिक निष्कर्ष निकालता है कि बैटरी ख़राब है। पाठ्यांक समझाओ और बताओ कि बैटरी की सचमुच जाँच कौन-सी राशि करेगी।",
          mr: "एका कारच्या बॅटरीवर 12 V लिहिलेले आहे. इंजिन बंद आणि काहीही चालू नसताना तिच्या टोकांवर लावलेला व्होल्टमापक 12.6 V दाखवतो, पण स्टार्टर मोटर फिरत असताना घसरून 9.5 V होतो, मग परत येतो. मालक निष्कर्ष काढतो की बॅटरी बिघडली आहे. वाचने समजावा आणि सांगा की बॅटरीचे खरे निदान कोणती राशी करेल.",
        },
        choices: [
          {
            en: "Both readings are normal behaviour of a healthy cell. The terminal voltage is V = ε − Ir: with no load, I is nearly zero and the meter reads essentially the e.m.f., 12.6 V; a starter draws hundreds of amperes, so even an internal resistance of a hundredth of an ohm produces a drop of several volts. The quantity that diagnoses the battery is the INTERNAL RESISTANCE r, not the open-circuit reading — an ageing battery shows a normal 12.6 V at rest and collapses under load, so a no-load voltmeter test is precisely the test that cannot detect the commonest failure",
            hi: "दोनों पाठ्यांक स्वस्थ सेल का सामान्य आचरण हैं। सिरों की वोल्टता V = ε − Ir है: बिना लोड के I लगभग शून्य है और मापी वस्तुतः विद्युत वाहक बल, 12.6 V दिखाता है; स्टार्टर सैकड़ों ऐम्पियर खींचता है, अतः एक ओम का सौवाँ भाग आंतरिक प्रतिरोध भी कई वोल्ट का पतन देता है। बैटरी की जाँच करने वाली राशि आंतरिक प्रतिरोध r है, खुले परिपथ का पाठ्यांक नहीं — बूढ़ी होती बैटरी विश्राम में सामान्य 12.6 V दिखाती है और लोड पड़ते ही बैठ जाती है, अतः बिना-लोड वोल्टमापी परीक्षण ठीक वही परीक्षण है जो सबसे आम ख़राबी पकड़ ही नहीं सकता",
            mr: "दोन्ही वाचने निरोगी घटाचे सामान्य वर्तन आहेत. टोकांचा व्होल्टेज V = ε − Ir आहे: भाराविना I जवळपास शून्य आहे आणि मापक प्रत्यक्षात विद्युतचालक बल, 12.6 V दाखवतो; स्टार्टर शेकडो अँपिअर ओढतो, म्हणून एका ओहमचा शंभरावा भाग अंतर्गत रोधही कित्येक व्होल्टची घसरण देतो. बॅटरीचे निदान करणारी राशी म्हणजे अंतर्गत रोध r, उघड्या परिपथाचे वाचन नव्हे — वयस्कर बॅटरी विश्रांतीत सामान्य 12.6 V दाखवते आणि भार पडताच बसते, म्हणून भाराविनाची व्होल्टमापक चाचणी हीच ती चाचणी जी सर्वांत सामान्य बिघाड पकडूच शकत नाही",
          },
          {
            en: "The owner is right: a 12 V battery that reads 9.5 V under any condition has lost more than a fifth of its capacity and needs replacing",
            hi: "मालिक सही है: 12 V की बैटरी जो किसी भी स्थिति में 9.5 V दिखाए, अपनी क्षमता का पाँचवें से अधिक भाग खो चुकी है और बदलनी चाहिए",
            mr: "मालक बरोबर आहे: 12 V ची बॅटरी जी कोणत्याही स्थितीत 9.5 V दाखवते, तिने आपल्या क्षमतेचा पाचव्याहून अधिक भाग गमावला आहे आणि ती बदलावी लागेल",
          },
          {
            en: "The drop is caused by the resistance of the thick starter cables, and the battery's own internal resistance plays no part in it",
            hi: "पतन मोटे स्टार्टर तारों के प्रतिरोध से होता है, और बैटरी का अपना आंतरिक प्रतिरोध उसमें कोई भूमिका नहीं निभाता",
            mr: "घसरण जाड स्टार्टर तारांच्या रोधामुळे होते, आणि बॅटरीचा स्वतःचा अंतर्गत रोध त्यात काहीच भूमिका बजावत नाही",
          },
          {
            en: "The 12.6 V reading is the faulty one, since a 12 V battery should read exactly 12 V when nothing is drawing current from it",
            hi: "12.6 V वाला पाठ्यांक ही ख़राबी है, क्योंकि 12 V की बैटरी को तब ठीक 12 V दिखाना चाहिए जब उससे कोई धारा न ली जा रही हो",
            mr: "12.6 V हेच वाचन बिघाडाचे आहे, कारण 12 V च्या बॅटरीने तेव्हा नेमके 12 V दाखवावे जेव्हा तिच्यातून कोणतीही धारा घेतली जात नसेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The whole chapter's distinction between e.m.f. and terminal voltage is being asked for in a form where it has consequences. A real source is a seat of e.m.f. ε in series with an internal resistance r, and what a voltmeter across the terminals reads is V = ε − Ir. Read that equation twice: it says the terminal voltage is not a property of the battery alone, but of the battery and whatever current is being drawn from it. First reading, engine off, nothing switched on. The voltmeter itself has a very high resistance and draws microamperes, so I ≈ 0 and Ir ≈ 0. The meter reads V ≈ ε. So 12.6 V is the e.m.f., and it is exactly what a healthy fully charged lead-acid battery should show: six cells at about 2.1 V each. The nominal 12 V on the label is a naming convention, not a measurement — a battery sitting at exactly 12.0 V at rest is in fact partly discharged. Second reading, starter cranking. A starter motor turning a cold engine draws something of the order of 200 A. Suppose r = 0.015 Ω, an ordinary value for a serviceable battery. Then Ir = 200 × 0.015 = 3 V, and the terminal voltage falls to about 9.6 V — which is what the meter showed. No fault is required to explain it; the drop is arithmetic. And it recovers the moment the current stops, because the missing volts were never lost from the battery, they were being spent inside it. Now the diagnostic point, which is the part worth carrying away. Batteries fail mainly by internal resistance rising — plates sulphating, connections corroding, electrolyte degrading — and r appears in the terminal voltage only when multiplied by I. At I ≈ 0 it is invisible. A battery whose r has quadrupled will still read a healthy 12.6 V at rest and then collapse to 6 V under the starter, leaving a driver with a car that will not start and a voltmeter that says everything is fine. This is why garages test batteries under load: they apply a known heavy current, watch the terminal voltage fall, and compute r = (ε − V)/I. The general lesson is that a measurement made in the condition where a parameter has no effect is not a weak test of that parameter but no test at all — and choosing conditions in which the quantity you care about actually shows up is most of experimental design. (The second option treats a loaded reading as if it were an open-circuit one; the third denies internal resistance a role it demonstrably has, though the cables do contribute a smaller share; the fourth mistakes a nominal label for a specification.)",
          hi: "पूरे अध्याय का विद्युत वाहक बल और सिरों की वोल्टता का भेद यहाँ ऐसे रूप में माँगा जा रहा है जहाँ उसके परिणाम हैं। असली स्रोत विद्युत वाहक बल ε की गद्दी है जो आंतरिक प्रतिरोध r के साथ श्रेणी में है, और सिरों पर लगा वोल्टमापी जो पढ़ता है वह V = ε − Ir है। उस समीकरण को दो बार पढ़ो: वह कहता है कि सिरों की वोल्टता अकेली बैटरी का गुण नहीं, बल्कि बैटरी और उससे ली जा रही धारा, दोनों का है। पहला पाठ्यांक, इंजन बंद, कुछ चालू नहीं। वोल्टमापी का अपना प्रतिरोध बहुत ऊँचा है और वह माइक्रोऐम्पियर खींचता है, अतः I ≈ 0 और Ir ≈ 0. मापी V ≈ ε पढ़ता है। अतः 12.6 V विद्युत वाहक बल है, और यह ठीक वही है जो स्वस्थ पूर्ण आवेशित सीसा-अम्ल बैटरी दिखानी चाहिए: छह सेल, हर एक लगभग 2.1 V. लेबल पर लिखा नाममात्र 12 V नामकरण की परिपाटी है, माप नहीं — विश्राम में ठीक 12.0 V पर बैठी बैटरी वस्तुतः आंशिक रूप से निरावेशित है। दूसरा पाठ्यांक, स्टार्टर घूमता हुआ। ठंडा इंजन घुमाता स्टार्टर मोटर लगभग 200 A कोटि की धारा खींचता है। मानो r = 0.015 Ω, चलती बैटरी का साधारण मान। तब Ir = 200 × 0.015 = 3 V, और सिरों की वोल्टता गिरकर लगभग 9.6 V हो जाती है — मापी ने यही दिखाया। इसे समझाने के लिए किसी ख़राबी की ज़रूरत नहीं; पतन अंकगणित है। और धारा रुकते ही वह लौट आता है, क्योंकि लुप्त वोल्ट बैटरी से कभी खोए नहीं थे, वे उसी के भीतर ख़र्च हो रहे थे। अब जाँच वाली बात, जो साथ ले जाने योग्य हिस्सा है। बैटरियाँ मुख्यतः आंतरिक प्रतिरोध बढ़ने से ख़राब होती हैं — प्लेटों पर सल्फ़ेट जमना, जोड़ों में जंग, विद्युत अपघट्य का बिगड़ना — और r सिरों की वोल्टता में तभी दिखता है जब वह I से गुणा हो। I ≈ 0 पर वह अदृश्य है। जिस बैटरी का r चार गुना हो गया है वह विश्राम में अब भी स्वस्थ 12.6 V दिखाएगी और फिर स्टार्टर के नीचे 6 V तक बैठ जाएगी, और चालक के पास ऐसी कार रह जाएगी जो चलती नहीं और ऐसा वोल्टमापी जो कहता है सब ठीक है। इसीलिए गैराज बैटरी की जाँच लोड के नीचे करते हैं: वे ज्ञात भारी धारा लगाते हैं, सिरों की वोल्टता गिरते देखते हैं, और r = (ε − V)/I निकालते हैं। सामान्य सीख यह कि जिस स्थिति में किसी प्राचल का कोई असर ही नहीं उसमें किया गया माप उस प्राचल की कमज़ोर जाँच नहीं बल्कि जाँच ही नहीं है — और ऐसी स्थितियाँ चुनना जिनमें तुम्हारी परवाह वाली राशि सचमुच दिखे, यही प्रायोगिक रचना का अधिकांश है। (दूसरा विकल्प लोड वाले पाठ्यांक को खुले परिपथ का मान लेता है; तीसरा आंतरिक प्रतिरोध से वह भूमिका छीनता है जो उसकी प्रत्यक्ष है, यद्यपि तार भी छोटा हिस्सा जोड़ते हैं; चौथा नाममात्र लेबल को विनिर्देश समझ लेता है।)",
          mr: "अख्ख्या प्रकरणातला विद्युतचालक बल आणि टोकांचा व्होल्टेज यांतला भेद इथे अशा स्वरूपात मागितला जात आहे जिथे त्याचे परिणाम आहेत. खरा स्रोत म्हणजे विद्युतचालक बल ε ची बैठक जी अंतर्गत रोध r शी श्रेणीत आहे, आणि टोकांवर लावलेला व्होल्टमापक जे वाचतो ते V = ε − Ir आहे. ते समीकरण दोनदा वाचा: ते सांगते की टोकांचा व्होल्टेज हा एकट्या बॅटरीचा गुणधर्म नसून बॅटरी आणि तिच्यातून घेतली जाणारी धारा या दोहोंचा आहे. पहिले वाचन, इंजिन बंद, काहीही चालू नाही. व्होल्टमापकाचा स्वतःचा रोध फार उंच आहे आणि तो मायक्रोअँपिअर ओढतो, म्हणून I ≈ 0 आणि Ir ≈ 0. मापक V ≈ ε वाचतो. म्हणून 12.6 V हे विद्युतचालक बल आहे, आणि हे नेमके तेच जे निरोगी पूर्ण प्रभारित शिसे-आम्ल बॅटरीने दाखवावे: सहा घट, प्रत्येक सुमारे 2.1 V. लेबलावरचे नाममात्र 12 V ही नामकरणाची संकेतपद्धत आहे, माप नव्हे — विश्रांतीत नेमके 12.0 V वर बसलेली बॅटरी प्रत्यक्षात अंशतः निर्प्रभारित आहे. दुसरे वाचन, स्टार्टर फिरत असताना. थंड इंजिन फिरवणारा स्टार्टर मोटर सुमारे 200 A कोटीची धारा ओढतो. समजा r = 0.015 Ω, चालू बॅटरीचे साधारण मूल्य. तर Ir = 200 × 0.015 = 3 V, आणि टोकांचा व्होल्टेज घसरून सुमारे 9.6 V होतो — मापकाने हेच दाखवले. हे समजावण्यासाठी कोणत्याही बिघाडाची गरज नाही; घसरण हे अंकगणित आहे. आणि धारा थांबताच ती परत येते, कारण हरवलेले व्होल्ट बॅटरीतून कधीच गमावले गेले नव्हते, ते तिच्याच आत खर्च होत होते. आता निदानाचा मुद्दा, जो सोबत न्यायचा भाग आहे. बॅटऱ्या मुख्यतः अंतर्गत रोध वाढल्याने बिघडतात — पट्ट्यांवर सल्फेट जमणे, सांधे गंजणे, विद्युत अपघटनी बिघडणे — आणि r टोकांच्या व्होल्टेजमध्ये तेव्हाच दिसतो जेव्हा तो I ने गुणलेला असतो. I ≈ 0 वर तो अदृश्य आहे. ज्या बॅटरीचा r चौपट झाला आहे ती विश्रांतीत अजूनही निरोगी 12.6 V दाखवेल आणि मग स्टार्टरखाली 6 V पर्यंत बसेल, आणि चालकाकडे अशी गाडी उरेल जी सुरू होत नाही आणि असा व्होल्टमापक जो म्हणतो सर्व ठीक आहे. म्हणूनच गॅरेज बॅटरीची चाचणी भाराखाली करतात: ते ज्ञात जड धारा लावतात, टोकांचा व्होल्टेज घसरताना पाहतात, आणि r = (ε − V)/I काढतात. सर्वसाधारण धडा असा की ज्या स्थितीत एखाद्या प्राचलाचा परिणामच नाही तिच्यात केलेले माप त्या प्राचलाची कमकुवत चाचणी नसून चाचणीच नाही — आणि ज्यांत तुम्हाला हवी असलेली राशी खरोखर दिसते अशा स्थिती निवडणे हाच प्रायोगिक रचनेचा बहुतांश आहे. (दुसरा पर्याय भाराखालच्या वाचनाला उघड्या परिपथाचे मानतो; तिसरा अंतर्गत रोधाकडून ती भूमिका हिरावतो जी त्याची स्पष्ट आहे, जरी तारा लहान वाटा जोडत असल्या तरी; चौथा नाममात्र लेबलाला विनिर्देश समजतो.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Moving Charges and Magnetism                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-moving-charges-and-magnetism",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 4 — Moving Charges and Magnetism",
      hi: "अध्याय 4 — गतिमान आवेश और चुंबकत्व",
      mr: "प्रकरण 4 — गतिमान प्रभार आणि चुंबकत्व",
    },
    name: {
      en: "Moving Charges and Magnetism",
      hi: "गतिमान आवेश और चुंबकत्व",
      mr: "गतिमान प्रभार आणि चुंबकत्व",
    },
    summary: {
      en: "A force that appears only when a charge is already moving, that acts sideways to the motion and therefore never speeds anything up or slows it down; a current element that sends a field curling around itself rather than streaming away from itself; a shortcut for the field around symmetric arrangements that plays the same role here that a law about flux played in electrostatics; a machine that pushes particles to enormous energies with a modest voltage applied over and over; a coil whose long cylinder holds a field as uniform as a bar magnet's and can be switched off; and an instrument whose pointer turns by exactly the current through it, which becomes an ammeter or a voltmeter depending on which resistor is put where.",
      hi: "वह बल जो तभी प्रकट होता है जब आवेश पहले से चल रहा हो, जो गति के बग़ल में लगता है और इसलिए किसी को न तेज़ करता है न धीमा; वह धारा-अंश जो अपने से दूर बहने के बजाय अपने चारों ओर लिपटता क्षेत्र भेजता है; सममित व्यवस्थाओं के चारों ओर क्षेत्र निकालने का वह छोटा रास्ता जो यहाँ वही भूमिका निभाता है जो स्थिरवैद्युत में फ्लक्स के नियम ने निभाई थी; वह मशीन जो मामूली वोल्टता बार-बार लगाकर कणों को विशाल ऊर्जाओं तक धकेल देती है; वह कुंडली जिसका लंबा बेलन छड़ चुंबक जैसा एकसमान क्षेत्र रखता है और बंद किया जा सकता है; और वह यंत्र जिसकी सुई ठीक उसमें से जाती धारा जितनी घूमती है, और जो कौन-सा प्रतिरोधक कहाँ लगाया गया इसके अनुसार अमीटर या वोल्टमापी बन जाता है।",
      mr: "ते बल जे प्रभार आधीच हलत असेल तेव्हाच प्रकट होते, जे गतीच्या बाजूला लागते आणि म्हणून कोणालाही ना वेगवान करते ना सावकाश; तो धारा-अंश जो स्वतःपासून दूर वाहण्याऐवजी स्वतःभोवती गुंडाळणारे क्षेत्र पाठवतो; सममित मांडणींभोवतीचे क्षेत्र काढण्याचा तो शॉर्टकट जो इथे तीच भूमिका बजावतो जी स्थिरविद्युतमध्ये फ्लक्सच्या नियमाने बजावली होती; ते यंत्र जे माफक व्होल्टेज पुन्हा पुन्हा लावून कणांना प्रचंड ऊर्जांपर्यंत ढकलते; ती वेटोळी जिचा लांब दंडगोल दांडा चुंबकासारखे एकसमान क्षेत्र बाळगतो आणि बंद करता येतो; आणि ते उपकरण ज्याची सुई नेमकी त्यातून जाणाऱ्या धारेइतकी फिरते, आणि जे कोणता रोधक कुठे लावला यानुसार अ‍ॅमीटर वा व्होल्टमापक बनते.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "lorentz-force",
        name: {
          en: "The Lorentz force",
          hi: "लॉरेंज़ बल",
          mr: "लॉरेन्ट्झ बल",
        },
        kind: "law",
        prompt: {
          en: "A charge sitting still in a magnetic field feels nothing; set it moving across the field and it is pushed at right angles to both its velocity and the field. Which force law is this?",
          hi: "चुंबकीय क्षेत्र में चुपचाप बैठा आवेश कुछ अनुभव नहीं करता; उसे क्षेत्र के आर-पार चलाओ और वह अपने वेग तथा क्षेत्र दोनों के समकोण पर धकेला जाता है। यह कौन-सा बल-नियम है?",
          mr: "चुंबकीय क्षेत्रात स्वस्थ बसलेल्या प्रभाराला काहीच जाणवत नाही; त्याला क्षेत्राच्या आरपार हलवा आणि तो आपल्या वेगाला व क्षेत्राला दोन्हींना काटकोनात ढकलला जातो. हा कोणता बल-नियम?",
        },
        statement: {
          en: "The Lorentz force on a charge is F = q(v × B), of magnitude qvB sin θ and directed perpendicular to both v and B, so it vanishes for a charge at rest or moving along the field.",
          hi: "आवेश पर लॉरेंज़ बल F = q(v × B) है, जिसका परिमाण qvB sin θ है और जो v तथा B दोनों के लंबवत है, अतः विरामावस्था में या क्षेत्र के अनुदिश चलते आवेश के लिए वह लुप्त हो जाता है।",
          mr: "प्रभारावरील लॉरेन्ट्झ बल F = q(v × B) आहे, ज्याचे परिमाण qvB sin θ आणि जे v व B दोन्हींना लंब आहे, म्हणून विश्रांतीत असलेल्या वा क्षेत्राच्या दिशेने जाणाऱ्या प्रभारासाठी ते नाहीसे होते.",
        },
        detail: {
          en: "Because it is always perpendicular to the velocity, it does no work at all: a magnetic field can bend a particle's path as sharply as you like without changing its speed or its kinetic energy by a joule.",
          hi: "चूँकि वह सदा वेग के लंबवत है, वह कोई कार्य करता ही नहीं: चुंबकीय क्षेत्र कण के पथ को जितना चाहो मोड़ सकता है बिना उसकी चाल या गतिज ऊर्जा एक जूल भी बदले।",
          mr: "तो नेहमी वेगाला लंब असल्याने, तो कोणतेही कार्य करतच नाही: चुंबकीय क्षेत्र कणाचा मार्ग हवा तितका वाकवू शकते त्याचा वेग वा गतिज ऊर्जा एक ज्यूलही न बदलता.",
        },
        extra: {
          en: "The consequence is circular motion of radius r = mv/qB with a period 2πm/qB that does not contain the speed — a faster particle simply travels a bigger circle in the same time.",
          hi: "परिणाम है r = mv/qB त्रिज्या की वृत्तीय गति जिसका आवर्तकाल 2πm/qB है और जिसमें चाल है ही नहीं — तेज़ कण बस उतने ही समय में बड़ा वृत्त तय करता है।",
          mr: "परिणाम म्हणजे r = mv/qB त्रिज्येची वर्तुळाकार गती जिचा आवर्तकाल 2πm/qB आहे आणि ज्यात वेग आहेच नाही — वेगवान कण फक्त तितक्याच वेळात मोठे वर्तुळ कापतो.",
        },
        pair: {
          left: {
            en: "Bends the path, never changes the speed",
            hi: "पथ मोड़ता है, चाल कभी नहीं बदलता",
            mr: "मार्ग वाकवतो, वेग कधीच बदलत नाही",
          },
          right: {
            en: "the Lorentz force",
            hi: "लॉरेंज़ बल",
            mr: "लॉरेन्ट्झ बल",
          },
        },
      },
      {
        id: "biot-savart-law",
        name: {
          en: "The Biot–Savart law",
          hi: "बायो-सावर्ट का नियम",
          mr: "बायो-सावर्टचा नियम",
        },
        kind: "law",
        prompt: {
          en: "A short piece of current-carrying wire contributes a field that is strongest beside it and zero straight ahead of it, and that wraps around the wire instead of pointing away from it. Which law gives that contribution?",
          hi: "धारा ले जाते तार का छोटा टुकड़ा ऐसा क्षेत्र जोड़ता है जो उसके बग़ल में सबसे प्रबल और उसके ठीक सामने शून्य है, और जो तार से दूर की ओर इशारा करने के बजाय उसके चारों ओर लिपटता है। वह अंश कौन-सा नियम देता है?",
          mr: "धारा वाहणाऱ्या तारेचा छोटा तुकडा असे क्षेत्र जोडतो जे त्याच्या बाजूला सर्वांत तीव्र आणि त्याच्या अगदी समोर शून्य आहे, आणि जे तारेपासून दूर न दाखवता तिच्याभोवती गुंडाळते. तो वाटा कोणता नियम देतो?",
        },
        statement: {
          en: "The Biot–Savart law gives the field of a current element as dB = (μ₀/4π)(I dl × r̂)/r², so its magnitude falls as the inverse square and its direction is perpendicular to both the element and the line to the point.",
          hi: "बायो-सावर्ट का नियम धारा-अंश का क्षेत्र dB = (μ₀/4π)(I dl × r̂)/r² देता है, अतः उसका परिमाण व्युत्क्रम वर्ग से घटता है और दिशा अंश तथा बिंदु तक की रेखा दोनों के लंबवत है।",
          mr: "बायो-सावर्टचा नियम धारा-अंशाचे क्षेत्र dB = (μ₀/4π)(I dl × r̂)/r² देतो, म्हणून त्याचे परिमाण व्यस्त वर्गाने घटते आणि दिशा अंशाला व बिंदूपर्यंतच्या रेषेला दोन्हींना लंब असते.",
        },
        detail: {
          en: "It is the magnetic counterpart of Coulomb's law, and the crucial difference is the cross product: an electric field points along the line to the charge, a magnetic field points across it.",
          hi: "यह कूलॉम के नियम का चुंबकीय समकक्ष है, और निर्णायक अंतर सदिश गुणनफल है: विद्युत क्षेत्र आवेश तक की रेखा के अनुदिश है, चुंबकीय क्षेत्र उसके आर-पार।",
          mr: "हा कुलोमच्या नियमाचा चुंबकीय समकक्ष आहे, आणि निर्णायक फरक सदिश गुणाकार आहे: विद्युत क्षेत्र प्रभारापर्यंतच्या रेषेच्या दिशेने असते, चुंबकीय क्षेत्र तिच्या आरपार.",
        },
        extra: {
          en: "The sin θ factor means the point directly along the wire's own direction receives nothing from that element, which is why the field on the axis of a straight wire is zero and the field beside it is not.",
          hi: "sin θ गुणक का अर्थ है कि तार की अपनी दिशा में ठीक आगे पड़ा बिंदु उस अंश से कुछ नहीं पाता, इसीलिए सीधे तार की अक्ष पर क्षेत्र शून्य है और उसके बग़ल में नहीं।",
          mr: "sin θ गुणकाचा अर्थ असा की तारेच्या स्वतःच्या दिशेत नेमका पुढे असलेला बिंदू त्या अंशाकडून काहीच मिळवत नाही, म्हणूनच सरळ तारेच्या अक्षावर क्षेत्र शून्य आहे आणि तिच्या बाजूला नाही.",
        },
        pair: {
          left: {
            en: "Curls around the wire instead of pointing away",
            hi: "दूर इशारा करने के बजाय तार के चारों ओर लिपटता है",
            mr: "दूर न दाखवता तारेभोवती गुंडाळतो",
          },
          right: {
            en: "the Biot–Savart law",
            hi: "बायो-सावर्ट का नियम",
            mr: "बायो-सावर्टचा नियम",
          },
        },
      },
      {
        id: "amperes-circuital-law",
        name: {
          en: "Ampère's circuital law",
          hi: "ऐम्पियर का परिपथीय नियम",
          mr: "अँपिअरचा परिपथीय नियम",
        },
        kind: "law",
        prompt: {
          en: "Walk once round any closed loop adding up the field along your path, and the total depends only on the current threading the loop — not on the loop's shape or on any current running outside it. Which law is this?",
          hi: "किसी भी बंद लूप पर एक बार चलो और अपने पथ के अनुदिश क्षेत्र जोड़ते जाओ, और कुल केवल लूप में से गुज़रती धारा पर निर्भर करता है — न लूप के आकार पर, न बाहर बहती किसी धारा पर। यह कौन-सा नियम है?",
          mr: "कोणत्याही बंद वळशावर एकदा फिरा आणि आपल्या मार्गाच्या दिशेने क्षेत्र जोडत जा, आणि एकूण केवळ वळशातून जाणाऱ्या धारेवर अवलंबून असते — वळशाच्या आकारावर नाही, बाहेर वाहणाऱ्या कोणत्याही धारेवर नाही. हा कोणता नियम?",
        },
        statement: {
          en: "Ampère's circuital law states that the line integral of B round a closed loop equals μ₀ times the net current passing through the loop, whatever the loop's shape.",
          hi: "ऐम्पियर का परिपथीय नियम कहता है कि किसी बंद लूप पर B का रेखा समाकल लूप से होकर जाती नेट धारा का μ₀ गुना है, लूप का आकार चाहे जो हो।",
          mr: "अँपिअरचा परिपथीय नियम सांगतो की बंद वळशावरील B चे रेषा समाकलन वळशातून जाणाऱ्या निव्वळ धारेच्या μ₀ पट असते, वळशाचा आकार कोणताही असो.",
        },
        detail: {
          en: "It plays exactly the role Gauss's law plays in electrostatics — a hard integral made trivial by symmetry — and like Gauss's law it is always true and only occasionally useful.",
          hi: "यह ठीक वही भूमिका निभाता है जो स्थिरवैद्युत में गाउस का नियम निभाता है — सममिति से आसान बना दिया गया कठिन समाकल — और गाउस के नियम की तरह यह सदा सच है और कभी-कभार ही काम का।",
          mr: "हा नेमकी तीच भूमिका बजावतो जी स्थिरविद्युतमध्ये गॉसचा नियम बजावतो — सममितीने सोपे केलेले कठीण समाकलन — आणि गॉसच्या नियमासारखा तो नेहमी खरा असतो आणि क्वचितच उपयोगी.",
        },
        extra: {
          en: "Applied to a long solenoid it gives B = μ₀nI, a result containing no reference to the radius at all — which is why a long coil's interior field is uniform right across it.",
          hi: "लंबी परिनालिका पर लगाने पर यह B = μ₀nI देता है, ऐसा परिणाम जिसमें त्रिज्या का कोई ज़िक्र ही नहीं — इसीलिए लंबी कुंडली के भीतर का क्षेत्र आर-पार एकसमान है।",
          mr: "लांब सोलेनॉइडवर लावल्यास तो B = μ₀nI देतो, असा निकाल ज्यात त्रिज्येचा उल्लेखच नाही — म्हणूनच लांब वेटोळ्याच्या आतले क्षेत्र आरपार एकसमान असते.",
        },
        pair: {
          left: {
            en: "Only what threads the loop counts",
            hi: "केवल वही गिना जाता है जो लूप में से गुज़रे",
            mr: "केवळ जे वळशातून जाते तेच मोजले जाते",
          },
          right: {
            en: "Ampère's circuital law",
            hi: "ऐम्पियर का परिपथीय नियम",
            mr: "अँपिअरचा परिपथीय नियम",
          },
        },
      },
      {
        id: "cyclotron",
        name: {
          en: "The cyclotron",
          hi: "साइक्लोट्रॉन",
          mr: "सायक्लोट्रॉन",
        },
        kind: "device",
        prompt: {
          en: "Two hollow D-shaped chambers in a magnetic field, with a modest alternating voltage across the gap between them, take a particle round and round and give it a push each time it crosses. Which machine is this?",
          hi: "चुंबकीय क्षेत्र में दो खोखले D-आकार के कक्ष, जिनके बीच की दरार पर मामूली प्रत्यावर्ती वोल्टता लगी है, कण को घुमाते रहते हैं और हर बार पार करने पर उसे एक धक्का देते हैं। यह कौन-सी मशीन है?",
          mr: "चुंबकीय क्षेत्रात दोन पोकळ D-आकाराचे कक्ष, ज्यांच्यामधल्या फटीवर माफक प्रत्यावर्ती व्होल्टेज लावलेला आहे, कणाला गोल गोल फिरवतात आणि तो प्रत्येक वेळी ओलांडताना त्याला एक धक्का देतात. हे कोणते यंत्र?",
        },
        statement: {
          en: "The cyclotron accelerates charged particles by giving them repeated small pushes across a gap while a magnetic field returns them to that gap, so a modest voltage builds up an enormous energy.",
          hi: "साइक्लोट्रॉन आवेशित कणों को दरार के आर-पार बार-बार छोटे धक्के देकर त्वरित करता है जबकि चुंबकीय क्षेत्र उन्हें उसी दरार पर लौटा लाता है, अतः मामूली वोल्टता विशाल ऊर्जा जमा कर देती है।",
          mr: "सायक्लोट्रॉन प्रभारित कणांना फटीच्या आरपार पुन्हा पुन्हा लहान धक्के देऊन त्वरित करतो तर चुंबकीय क्षेत्र त्यांना त्याच फटीवर परत आणते, म्हणून माफक व्होल्टेज प्रचंड ऊर्जा साठवते.",
        },
        detail: {
          en: "It works only because the time for one revolution does not depend on the particle's speed or the radius of its orbit, so a single fixed frequency stays in step from the first turn to the last.",
          hi: "यह केवल इसलिए चलता है कि एक चक्कर का समय कण की चाल या उसकी कक्षा की त्रिज्या पर निर्भर नहीं करता, अतः एक ही नियत आवृत्ति पहले चक्कर से आख़िरी तक ताल में बनी रहती है।",
          mr: "हा केवळ यामुळेच चालतो की एका फेऱ्याचा काळ कणाच्या वेगावर वा त्याच्या कक्षेच्या त्रिज्येवर अवलंबून नाही, म्हणून एकच ठराविक वारंवारता पहिल्या फेऱ्यापासून शेवटच्यापर्यंत तालात राहते.",
        },
        extra: {
          en: "That constancy fails at high energies, where relativistic mass increase lengthens the period and the particle falls out of step — which is why the design cannot be scaled up indefinitely and cannot accelerate electrons usefully at all.",
          hi: "वह अचरता उच्च ऊर्जाओं पर टूट जाती है, जहाँ आपेक्षिकीय द्रव्यमान वृद्धि आवर्तकाल बढ़ा देती है और कण ताल से बाहर हो जाता है — इसीलिए यह रचना अनंत तक बड़ी नहीं की जा सकती और इलेक्ट्रॉनों को उपयोगी ढंग से त्वरित कर ही नहीं सकती।",
          mr: "ती अचलता उच्च ऊर्जांवर मोडते, जिथे सापेक्षतावादी वस्तुमानवाढ आवर्तकाल लांबवते आणि कण तालाबाहेर पडतो — म्हणूनच ही रचना अमर्याद मोठी करता येत नाही आणि इलेक्ट्रॉनांना उपयुक्तपणे त्वरित करूच शकत नाही.",
        },
        pair: {
          left: {
            en: "One frequency that never has to be retuned",
            hi: "एक आवृत्ति जिसे कभी फिर से मिलाना नहीं पड़ता",
            mr: "एक वारंवारता जी कधीच पुन्हा जुळवावी लागत नाही",
          },
          right: {
            en: "the cyclotron",
            hi: "साइक्लोट्रॉन",
            mr: "सायक्लोट्रॉन",
          },
        },
      },
      {
        id: "solenoid",
        name: {
          en: "The solenoid",
          hi: "परिनालिका",
          mr: "सोलेनॉइड",
        },
        kind: "device",
        prompt: {
          en: "Wire wound in a long close-packed helix, whose inside holds a nearly uniform field along the axis and whose outside is almost field-free — and which stops being a magnet the moment the current stops. What is it?",
          hi: "लंबी सटी हुई कुंडलाकार लपेट में लिपटा तार, जिसके भीतर अक्ष के अनुदिश लगभग एकसमान क्षेत्र है और जिसके बाहर लगभग क्षेत्र है ही नहीं — और जो धारा रुकते ही चुंबक होना बंद कर देता है। यह क्या है?",
          mr: "लांब घट्ट बसलेल्या मळसूत्री वेढ्यांत गुंडाळलेली तार, जिच्या आत अक्षाच्या दिशेने जवळपास एकसमान क्षेत्र आहे आणि जिच्या बाहेर जवळपास क्षेत्रच नाही — आणि जी धारा थांबताच चुंबक असणे थांबवते. ही काय आहे?",
        },
        statement: {
          en: "A solenoid is a long helical coil whose interior field is B = μ₀nI, uniform along and across the axis, and whose exterior field is negligible for a long enough coil.",
          hi: "परिनालिका लंबी कुंडलाकार कुंडली है जिसके भीतर का क्षेत्र B = μ₀nI है, अक्ष के अनुदिश और आर-पार एकसमान, और पर्याप्त लंबी कुंडली के लिए जिसके बाहर का क्षेत्र नगण्य है।",
          mr: "सोलेनॉइड म्हणजे लांब मळसूत्री वेटोळे ज्याच्या आतले क्षेत्र B = μ₀nI आहे, अक्षाच्या दिशेने आणि आरपार एकसमान, आणि पुरेशा लांब वेटोळ्यासाठी ज्याच्या बाहेरचे क्षेत्र नगण्य आहे.",
        },
        detail: {
          en: "The field depends on turns per unit length and not on the total number of turns, so winding the same wire onto a shorter former strengthens the field without adding any copper.",
          hi: "क्षेत्र प्रति एकांक लंबाई फेरों पर निर्भर है, कुल फेरों पर नहीं, अतः उसी तार को छोटे ढाँचे पर लपेटना बिना ताँबा जोड़े क्षेत्र प्रबल कर देता है।",
          mr: "क्षेत्र प्रति एकक लांबी वेढ्यांवर अवलंबून आहे, एकूण वेढ्यांवर नाही, म्हणून तीच तार लहान सांगाड्यावर गुंडाळल्याने तांबे न वाढवता क्षेत्र तीव्र होते.",
        },
        extra: {
          en: "Because it can be switched, it is what makes an electromagnet different in kind from a bar magnet — a crane can pick up a car and put it down again, which no permanent magnet can be made to do.",
          hi: "चूँकि इसे चालू-बंद किया जा सकता है, यही विद्युत चुंबक को छड़ चुंबक से भिन्न प्रकार का बनाता है — क्रेन कार उठा सकती है और फिर रख भी सकती है, जो किसी स्थायी चुंबक से कराया नहीं जा सकता।",
          mr: "ती चालू-बंद करता येत असल्याने, हेच विद्युत चुंबकाला दांडा चुंबकाहून वेगळ्या प्रकारचे बनवते — क्रेन गाडी उचलू शकते आणि पुन्हा खाली ठेवूही शकते, जे कोणत्याही कायम चुंबकाकडून करवून घेता येत नाही.",
        },
        pair: {
          left: {
            en: "A magnet with a switch",
            hi: "स्विच वाला चुंबक",
            mr: "स्विच असलेला चुंबक",
          },
          right: {
            en: "the solenoid",
            hi: "परिनालिका",
            mr: "सोलेनॉइड",
          },
        },
      },
      {
        id: "moving-coil-galvanometer",
        name: {
          en: "The moving coil galvanometer",
          hi: "धारामापी",
          mr: "गॅल्व्हॅनोमीटर",
        },
        kind: "device",
        prompt: {
          en: "A coil hung between curved pole pieces turns against a spring by an angle proportional to the current, because the field is shaped so that the plane of the coil always contains it. Which instrument is this?",
          hi: "घुमावदार ध्रुव-खंडों के बीच लटकी कुंडली स्प्रिंग के विरुद्ध धारा के समानुपाती कोण से घूमती है, क्योंकि क्षेत्र ऐसा गढ़ा गया है कि कुंडली का तल उसे सदा समेटे रहे। यह कौन-सा यंत्र है?",
          mr: "वक्र ध्रुव-तुकड्यांमध्ये टांगलेले वेटोळे स्प्रिंगविरुद्ध धारेशी समानुपाती कोनाने फिरते, कारण क्षेत्र असे घडवलेले आहे की वेटोळ्याचे प्रतल त्याला सदैव सामावून घेते. हे कोणते उपकरण?",
        },
        statement: {
          en: "A moving coil galvanometer measures current by the deflection of a coil in a radial magnetic field, where the restoring torque of a spring balances the magnetic torque and the deflection is proportional to the current.",
          hi: "धारामापी त्रिज्य चुंबकीय क्षेत्र में कुंडली के विक्षेप से धारा नापता है, जहाँ स्प्रिंग का प्रत्यानयन बल-आघूर्ण चुंबकीय बल-आघूर्ण को संतुलित करता है और विक्षेप धारा के समानुपाती होता है।",
          mr: "गॅल्व्हॅनोमीटर त्रिज्य चुंबकीय क्षेत्रात वेटोळ्याच्या विचलनाने धारा मोजतो, जिथे स्प्रिंगचे प्रत्यानयन बलआघूर्ण चुंबकीय बलआघूर्णाला तोलते आणि विचलन धारेशी समानुपाती असते.",
        },
        detail: {
          en: "The radial field is what makes the scale linear: with a uniform field the torque would carry a sin θ factor and equal steps of current would give unequal steps of deflection.",
          hi: "त्रिज्य क्षेत्र ही पैमाने को रैखिक बनाता है: एकसमान क्षेत्र में बल-आघूर्ण में sin θ गुणक होता और धारा के बराबर क़दम विक्षेप के असमान क़दम देते।",
          mr: "त्रिज्य क्षेत्रच पट्टीला रेषीय बनवते: एकसमान क्षेत्रात बलआघूर्णात sin θ गुणक आला असता आणि धारेची समान पावले विचलनाची असमान पावले दिली असती.",
        },
        extra: {
          en: "It becomes an ammeter by adding a small resistance in parallel and a voltmeter by adding a large one in series, so the same movement can measure two different quantities depending on where the resistor goes.",
          hi: "समांतर में छोटा प्रतिरोध जोड़ने पर यह अमीटर बन जाता है और श्रेणी में बड़ा जोड़ने पर वोल्टमापी, अतः वही गतिका दो भिन्न राशियाँ नाप सकती है, यह इस पर निर्भर कि प्रतिरोधक कहाँ लगे।",
          mr: "समांतरात लहान रोध जोडल्यास हे अ‍ॅमीटर बनते आणि श्रेणीत मोठा जोडल्यास व्होल्टमापक, म्हणून तीच हालचाल दोन वेगळ्या राशी मोजू शकते, हे रोधक कुठे लावला यावर अवलंबून.",
        },
        pair: {
          left: {
            en: "A curved pole piece bought in exchange for a linear scale",
            hi: "रैखिक पैमाने के बदले ख़रीदा गया घुमावदार ध्रुव-खंड",
            mr: "रेषीय पट्टीच्या बदल्यात घेतलेला वक्र ध्रुव-तुकडा",
          },
          right: {
            en: "the moving coil galvanometer",
            hi: "धारामापी",
            mr: "गॅल्व्हॅनोमीटर",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A proton enters a uniform magnetic field at right angles to it and travels in a circle. A student says the field must be doing work on the proton, since it is clearly making it change direction continuously, and asks where that energy comes from. Answer the question.",
          hi: "एक प्रोटॉन एकसमान चुंबकीय क्षेत्र में उसके समकोण पर प्रवेश करता है और वृत्त में चलता है। विद्यार्थी कहता है कि क्षेत्र प्रोटॉन पर कार्य कर ही रहा होगा, क्योंकि वह उसे स्पष्टतः लगातार दिशा बदलवा रहा है, और पूछता है कि वह ऊर्जा कहाँ से आती है। प्रश्न का उत्तर दो।",
          mr: "एक प्रोटॉन एकसमान चुंबकीय क्षेत्रात त्याला काटकोनात प्रवेश करतो आणि वर्तुळात फिरतो. विद्यार्थी म्हणतो की क्षेत्र प्रोटॉनवर कार्य करतच असले पाहिजे, कारण ते त्याला स्पष्टपणे सतत दिशा बदलायला लावत आहे, आणि विचारतो की ती ऊर्जा कुठून येते. प्रश्नाचे उत्तर द्या.",
        },
        choices: [
          {
            en: "No work is done and no energy is needed. Work is F·d, which contains the cosine of the angle between force and displacement, and the magnetic force is always perpendicular to the velocity — so that cosine is zero at every instant. Changing direction does not require energy; changing SPEED does. The proton's kinetic energy, and hence its speed, is exactly the same after a million revolutions as when it entered. This is why a magnetic field can steer a beam but can never accelerate one, and why every accelerator uses electric fields to add energy and magnetic fields only to bend",
            hi: "कोई कार्य नहीं होता और किसी ऊर्जा की ज़रूरत नहीं। कार्य F·d है, जिसमें बल और विस्थापन के बीच के कोण की कोज्या है, और चुंबकीय बल सदा वेग के लंबवत है — अतः वह कोज्या हर क्षण शून्य है। दिशा बदलने में ऊर्जा नहीं लगती; चाल बदलने में लगती है। प्रोटॉन की गतिज ऊर्जा, और इसलिए उसकी चाल, दस लाख चक्करों के बाद ठीक वही है जो प्रवेश करते समय थी। इसीलिए चुंबकीय क्षेत्र किरणपुंज को मोड़ सकता है पर उसे त्वरित कभी नहीं कर सकता, और इसीलिए हर त्वरक ऊर्जा जोड़ने को विद्युत क्षेत्र और केवल मोड़ने को चुंबकीय क्षेत्र काम में लेता है",
            mr: "कोणतेही कार्य होत नाही आणि कोणत्याही ऊर्जेची गरज नाही. कार्य म्हणजे F·d, ज्यात बल आणि विस्थापन यांतील कोनाचा कोसाइन आहे, आणि चुंबकीय बल नेहमी वेगाला लंब असते — म्हणून तो कोसाइन प्रत्येक क्षणी शून्य आहे. दिशा बदलायला ऊर्जा लागत नाही; वेग बदलायला लागते. प्रोटॉनची गतिज ऊर्जा, आणि म्हणून त्याचा वेग, दहा लाख फेऱ्यांनंतर नेमका तोच आहे जो प्रवेश करताना होता. म्हणूनच चुंबकीय क्षेत्र किरणशलाका वळवू शकते पण तिला त्वरित कधीच करू शकत नाही, आणि म्हणूनच प्रत्येक त्वरक ऊर्जा जोडायला विद्युत क्षेत्र आणि केवळ वाकवायला चुंबकीय क्षेत्र वापरतो",
          },
          {
            en: "The field does work, and the energy comes from the source maintaining the magnetic field, which is why an electromagnet's power supply draws extra current when a beam passes through it",
            hi: "क्षेत्र कार्य करता है, और ऊर्जा उस स्रोत से आती है जो चुंबकीय क्षेत्र बनाए रखता है, इसीलिए किरणपुंज गुज़रते समय विद्युत चुंबक की बिजली आपूर्ति अतिरिक्त धारा खींचती है",
            mr: "क्षेत्र कार्य करते, आणि ऊर्जा ते चुंबकीय क्षेत्र टिकवणाऱ्या स्रोताकडून येते, म्हणूनच किरणशलाका जाताना विद्युत चुंबकाचा वीजपुरवठा जादा धारा ओढतो",
          },
          {
            en: "The field does work on the proton going round one half of the circle and an equal negative amount on the other half, so the total over a full revolution is zero",
            hi: "क्षेत्र वृत्त के आधे भाग में प्रोटॉन पर कार्य करता है और दूसरे आधे में उतना ही ऋणात्मक, अतः पूरे चक्कर पर कुल शून्य है",
            mr: "क्षेत्र वर्तुळाच्या अर्ध्या भागात प्रोटॉनवर कार्य करते आणि दुसऱ्या अर्ध्यात तितकेच ऋण, म्हणून पूर्ण फेऱ्यावर एकूण शून्य आहे",
          },
          {
            en: "No work is done because the proton returns to its starting point, and work over any closed path is always zero",
            hi: "कोई कार्य नहीं होता क्योंकि प्रोटॉन अपने आरंभिक बिंदु पर लौट आता है, और किसी भी बंद पथ पर कार्य सदा शून्य होता है",
            mr: "कोणतेही कार्य होत नाही कारण प्रोटॉन आपल्या सुरुवातीच्या बिंदूवर परत येतो, आणि कोणत्याही बंद मार्गावर कार्य नेहमी शून्य असते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The question contains a hidden assumption worth naming: that making something change direction must cost energy. It does not. Work is defined as W = F·d = Fd cos θ, and the cosine is there for a reason — only the component of the force ALONG the displacement transfers energy. A force perpendicular to the motion changes where the object is going without changing how fast it is going, and transfers nothing. The classic parallel is a stone whirled on a string in a horizontal circle at constant speed. The string's tension points to the centre, the velocity is tangential, the angle between them is 90°, and the tension does no work — yet the stone's direction is changing every instant. Nobody finds that mysterious, and the magnetic case is identical. For the magnetic force this perpendicularity is not an accident of the geometry but built into the law. F = q(v × B), and a cross product is by definition perpendicular to both its factors, so F ⊥ v ALWAYS — not on average, not over a cycle, but at every instant of every path in every field. Therefore the instantaneous power delivered, P = F·v, is identically zero. The kinetic energy never changes at all, so the speed never changes at all, and the proton that has been circling for a microsecond is moving exactly as fast as the one that just arrived. What the field does supply is centripetal force. Setting qvB = mv²/r gives r = mv/qB, so a faster proton simply travels a larger circle. Divide the circumference by the speed for the period: T = 2πr/v = 2πm/qB, and the v has cancelled. The time for one revolution does not depend on the speed. That single cancellation is the whole reason the cyclotron can work with one fixed radio frequency: the particle spirals outward as it gains energy, but it arrives at the gap on the beat every time. The practical statement to carry away is the division of labour inside every particle accelerator. Electric fields do work — they are the only thing in the chapter that can raise a particle's energy. Magnetic fields steer — they hold beams on curved paths in a synchrotron ring, focus them, and separate particles of different momenta in a mass spectrometer. A machine that tried to accelerate protons with magnets alone would produce a beautifully curved beam of exactly the energy it started with. (The second option invents an energy transfer that measurement rules out; the third describes a force with a component along the motion, which the cross product forbids; the fourth quotes a rule true of conservative forces, which would wrongly imply that friction round a closed loop does no work either.)",
          hi: "प्रश्न में एक छिपी मान्यता है जिसे नाम देना चाहिए: कि किसी को दिशा बदलवाने में ऊर्जा लगती ही होगी। नहीं लगती। कार्य की परिभाषा W = F·d = Fd cos θ है, और कोज्या वहाँ कारण से है — केवल बल का वह घटक जो विस्थापन के अनुदिश है, ऊर्जा हस्तांतरित करता है। गति के लंबवत बल यह बदलता है कि वस्तु कहाँ जा रही है, यह नहीं कि वह कितनी तेज़ जा रही है, और कुछ भी हस्तांतरित नहीं करता। शास्त्रीय समानांतर उदाहरण है डोरी से क्षैतिज वृत्त में अचर चाल से घुमाया गया पत्थर। डोरी का तनाव केंद्र की ओर है, वेग स्पर्शरेखीय है, उनके बीच का कोण 90° है, और तनाव कोई कार्य नहीं करता — फिर भी पत्थर की दिशा हर क्षण बदल रही है। इसे कोई रहस्यमय नहीं मानता, और चुंबकीय स्थिति ठीक वही है। चुंबकीय बल के लिए यह लंबवतता ज्यामिति का संयोग नहीं बल्कि नियम में गढ़ी हुई है। F = q(v × B), और सदिश गुणनफल परिभाषा से अपने दोनों गुणकों के लंबवत है, अतः F ⊥ v सदा — औसतन नहीं, एक चक्र पर नहीं, बल्कि हर क्षेत्र में हर पथ के हर क्षण पर। इसलिए दी गई तात्क्षणिक शक्ति P = F·v सर्वसमतः शून्य है। गतिज ऊर्जा बदलती ही नहीं, अतः चाल बदलती ही नहीं, और जो प्रोटॉन एक माइक्रोसेकंड से घूम रहा है वह ठीक उतना ही तेज़ चल रहा है जितना अभी-अभी आया हुआ। क्षेत्र जो देता है वह अभिकेंद्र बल है। qvB = mv²/r रखने पर r = mv/qB, अतः तेज़ प्रोटॉन बस बड़ा वृत्त तय करता है। परिधि को चाल से भाग दो और आवर्तकाल मिलता है: T = 2πr/v = 2πm/qB, और v कट गया। एक चक्कर का समय चाल पर निर्भर नहीं करता। वही एक कटाव पूरा कारण है कि साइक्लोट्रॉन एक नियत रेडियो आवृत्ति से चल सकता है: कण ऊर्जा पाते-पाते बाहर की ओर सर्पिल में जाता है, पर हर बार ताल पर दरार पर पहुँचता है। साथ ले जाने योग्य व्यावहारिक कथन हर कण-त्वरक के भीतर का श्रम-विभाजन है। विद्युत क्षेत्र कार्य करते हैं — अध्याय में वही एकमात्र चीज़ हैं जो कण की ऊर्जा बढ़ा सकती है। चुंबकीय क्षेत्र दिशा देते हैं — वे सिंक्रोट्रॉन वलय में किरणपुंज को वक्र पथों पर रोके रखते हैं, उन्हें केंद्रित करते हैं, और द्रव्यमान स्पेक्ट्रोमापी में भिन्न संवेगों के कणों को अलग करते हैं। जो मशीन केवल चुंबकों से प्रोटॉन त्वरित करने की कोशिश करती, वह सुंदर वक्र किरणपुंज देती जिसकी ऊर्जा ठीक वही होती जिससे उसने शुरू किया था। (दूसरा विकल्प ऐसा ऊर्जा हस्तांतरण गढ़ता है जिसे माप ख़ारिज करता है; तीसरा ऐसे बल का वर्णन करता है जिसका गति के अनुदिश घटक हो, जिसे सदिश गुणनफल मना करता है; चौथा संरक्षी बलों का सच्चा नियम उद्धृत करता है, जो ग़लत ढंग से यह भी सुझाता कि बंद लूप पर घर्षण भी कोई कार्य नहीं करता।)",
          mr: "प्रश्नात एक लपलेली गृहीतकल्पना आहे जिला नाव द्यायला हवे: की कशाला दिशा बदलायला लावण्यास ऊर्जा लागतच असली पाहिजे. लागत नाही. कार्याची व्याख्या W = F·d = Fd cos θ आहे, आणि कोसाइन तिथे कारणासाठी आहे — केवळ बलाचा तो घटक जो विस्थापनाच्या दिशेने आहे, ऊर्जा हस्तांतरित करतो. गतीला लंब असलेले बल वस्तू कुठे जात आहे हे बदलते, ती किती वेगाने जात आहे हे नाही, आणि काहीही हस्तांतरित करत नाही. शास्त्रीय समांतर उदाहरण म्हणजे दोरीने आडव्या वर्तुळात अचल वेगाने फिरवलेला दगड. दोरीचा ताण केंद्राकडे, वेग स्पर्शरेषीय, त्यांतील कोन 90°, आणि ताण कोणतेही कार्य करत नाही — तरीही दगडाची दिशा प्रत्येक क्षणी बदलत आहे. हे कोणालाही गूढ वाटत नाही, आणि चुंबकीय स्थिती नेमकी तीच आहे. चुंबकीय बलासाठी हे लंबत्व भूमितीचा योगायोग नसून नियमातच घडवलेले आहे. F = q(v × B), आणि सदिश गुणाकार व्याख्येनेच आपल्या दोन्ही गुणकांना लंब असतो, म्हणून F ⊥ v नेहमी — सरासरीने नाही, एका चक्रावर नाही, तर प्रत्येक क्षेत्रातल्या प्रत्येक मार्गाच्या प्रत्येक क्षणी. म्हणून दिली जाणारी तात्कालिक शक्ती P = F·v सर्वसमतः शून्य आहे. गतिज ऊर्जा बदलतच नाही, म्हणून वेग बदलतच नाही, आणि जो प्रोटॉन एक मायक्रोसेकंदापासून फिरत आहे तो नेमका तितक्याच वेगाने जात आहे जितका आत्ताच आलेला. क्षेत्र जे पुरवते ते अभिकेंद्री बल आहे. qvB = mv²/r ठेवल्यास r = mv/qB, म्हणून वेगवान प्रोटॉन फक्त मोठे वर्तुळ कापतो. परिघाला वेगाने भागा आणि आवर्तकाल मिळतो: T = 2πr/v = 2πm/qB, आणि v कापला गेला. एका फेऱ्याचा काळ वेगावर अवलंबून नाही. तोच एक कापाकाप हे अख्खे कारण आहे की सायक्लोट्रॉन एका ठराविक रेडिओ वारंवारतेवर चालू शकतो: कण ऊर्जा मिळवत बाहेरच्या दिशेने सर्पिलात जातो, पण प्रत्येक वेळी तालावर फटीवर पोहोचतो. सोबत न्यायचे व्यावहारिक विधान म्हणजे प्रत्येक कण-त्वरकाच्या आतले श्रमविभाजन. विद्युत क्षेत्रे कार्य करतात — प्रकरणात तीच एकमेव गोष्ट आहे जी कणाची ऊर्जा वाढवू शकते. चुंबकीय क्षेत्रे दिशा देतात — ती सिंक्रोट्रॉन वलयात किरणशलाकांना वक्र मार्गांवर धरून ठेवतात, त्यांना केंद्रित करतात, आणि वस्तुमान वर्णपटमापीत वेगवेगळ्या संवेगांचे कण वेगळे करतात. जे यंत्र केवळ चुंबकांनी प्रोटॉन त्वरित करण्याचा प्रयत्न करेल, ते सुंदर वक्र किरणशलाका देईल जिची ऊर्जा नेमकी तीच असेल जिच्यापासून त्याने सुरुवात केली. (दुसरा पर्याय असे ऊर्जा हस्तांतरण घडवतो जे मापन नाकारते; तिसरा अशा बलाचे वर्णन करतो ज्याचा गतीच्या दिशेने घटक असेल, जे सदिश गुणाकार वर्ज्य करतो; चौथा संरक्षी बलांचा खरा नियम उद्धृत करतो, जो चुकीच्या पद्धतीने हेही सुचवेल की बंद वळशावर घर्षणही कोणतेही कार्य करत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A laboratory has one galvanometer of resistance 60 Ω that deflects fully at 5 mA. A student wires a large resistance in parallel with it hoping to make a voltmeter, and a small resistance in series hoping to make an ammeter, and finds both instruments useless. Explain what each conversion actually requires and why.",
          hi: "एक प्रयोगशाला में 60 Ω प्रतिरोध का एक धारामापी है जो 5 mA पर पूरा विक्षेप देता है। विद्यार्थी वोल्टमापी बनाने की आशा में उसके समांतर बड़ा प्रतिरोध जोड़ता है, और अमीटर बनाने की आशा में श्रेणी में छोटा प्रतिरोध जोड़ता है, और दोनों यंत्र बेकार पाता है। बताओ हर रूपांतरण वास्तव में क्या माँगता है और क्यों।",
          mr: "एका प्रयोगशाळेत 60 Ω रोधाचा एक गॅल्व्हॅनोमीटर आहे जो 5 mA वर पूर्ण विचलन देतो. विद्यार्थी व्होल्टमापक बनवण्याच्या आशेने त्याच्या समांतर मोठा रोध जोडतो, आणि अ‍ॅमीटर बनवण्याच्या आशेने श्रेणीत लहान रोध जोडतो, आणि दोन्ही उपकरणे निरुपयोगी आढळतात. प्रत्येक रूपांतरण प्रत्यक्षात काय मागते आणि का ते सांगा.",
        },
        choices: [
          {
            en: "He has swapped the two. An ammeter goes IN SERIES with the circuit and must therefore have very LOW resistance, so it is made by putting a small shunt in PARALLEL, which carries most of the current past the coil; a voltmeter goes ACROSS a component and must have very HIGH resistance so it draws almost nothing, so it is made by putting a large resistor in SERIES. His parallel-large-resistor barely changes anything and leaves a 60 Ω 'voltmeter' that loads the circuit it measures; his series-small-resistor leaves a roughly 60 Ω 'ammeter' that blocks the current it was meant to measure",
            hi: "उसने दोनों आपस में बदल दिए हैं। अमीटर परिपथ के श्रेणी में लगता है और इसलिए उसका प्रतिरोध बहुत कम होना चाहिए, अतः वह समांतर में छोटा शंट लगाकर बनता है, जो अधिकांश धारा कुंडली के बग़ल से ले जाता है; वोल्टमापी किसी पुर्ज़े के आर-पार लगता है और उसका प्रतिरोध बहुत ऊँचा होना चाहिए ताकि वह लगभग कुछ न खींचे, अतः वह श्रेणी में बड़ा प्रतिरोधक लगाकर बनता है। उसका समांतर-बड़ा-प्रतिरोधक कुछ ख़ास बदलता ही नहीं और 60 Ω का ऐसा 'वोल्टमापी' छोड़ता है जो जिस परिपथ को नापता है उसी पर बोझ डालता है; उसका श्रेणी-छोटा-प्रतिरोधक लगभग 60 Ω का ऐसा 'अमीटर' छोड़ता है जो जिस धारा को नापना था उसे ही रोक देता है",
            mr: "त्याने दोन्ही अदलाबदल केले आहेत. अ‍ॅमीटर परिपथाच्या श्रेणीत लागतो आणि म्हणून त्याचा रोध फार कमी असावा लागतो, म्हणून तो समांतरात लहान शंट लावून बनतो, जो बहुतांश धारा वेटोळ्याच्या बाजूने नेतो; व्होल्टमापक एखाद्या घटकाच्या आरपार लागतो आणि त्याचा रोध फार उंच असावा लागतो जेणेकरून तो जवळपास काहीच ओढणार नाही, म्हणून तो श्रेणीत मोठा रोधक लावून बनतो. त्याचा समांतर-मोठा-रोधक फारसे काही बदलतच नाही आणि 60 Ω चा असा 'व्होल्टमापक' उरवतो जो ज्या परिपथाला मोजतो त्यावरच भार टाकतो; त्याचा श्रेणी-लहान-रोधक जवळपास 60 Ω चा असा 'अ‍ॅमीटर' उरवतो जो ज्या धारेला मोजायचे होते तिलाच अडवतो",
          },
          {
            en: "Both conversions are correct in principle and fail only because 60 Ω is too high a galvanometer resistance for either instrument to work",
            hi: "दोनों रूपांतरण सैद्धांतिक रूप से सही हैं और केवल इसलिए विफल होते हैं कि किसी भी यंत्र के चलने के लिए 60 Ω धारामापी प्रतिरोध बहुत ऊँचा है",
            mr: "दोन्ही रूपांतरणे तत्त्वतः बरोबर आहेत आणि केवळ यामुळे अपयशी ठरतात की कोणतेही उपकरण चालण्यासाठी 60 Ω गॅल्व्हॅनोमीटर रोध फार उंच आहे",
          },
          {
            en: "A galvanometer cannot be converted at all; ammeters and voltmeters use fundamentally different movements, and adding resistors only changes the scale markings",
            hi: "धारामापी का रूपांतरण हो ही नहीं सकता; अमीटर और वोल्टमापी मूलतः भिन्न गतिकाएँ काम में लेते हैं, और प्रतिरोधक जोड़ने से केवल पैमाने के निशान बदलते हैं",
            mr: "गॅल्व्हॅनोमीटरचे रूपांतरण होऊच शकत नाही; अ‍ॅमीटर आणि व्होल्टमापक मुळात वेगळ्या हालचाली वापरतात, आणि रोधक जोडल्याने केवळ पट्टीवरील खुणा बदलतात",
          },
          {
            en: "Both instruments need a resistor in series; the difference is only that the ammeter's must be small and the voltmeter's large, and the student's error was in the parallel connection alone",
            hi: "दोनों यंत्रों को श्रेणी में प्रतिरोधक चाहिए; अंतर केवल इतना कि अमीटर वाला छोटा और वोल्टमापी वाला बड़ा हो, और विद्यार्थी की भूल केवल समांतर संयोजन में थी",
            mr: "दोन्ही उपकरणांना श्रेणीत रोधक लागतो; फरक इतकाच की अ‍ॅमीटरचा लहान आणि व्होल्टमापकाचा मोठा असावा, आणि विद्यार्थ्याची चूक केवळ समांतर जोडणीत होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both conversions follow from one question that is not about magnetism at all: HOW IS THE INSTRUMENT CONNECTED, and therefore what must it do to the circuit it is measuring? A measuring instrument should disturb what it measures as little as possible, and the two instruments are connected in opposite ways, so their requirements come out opposite. An AMMETER is inserted in series, so the whole current to be measured passes through it. Anything it adds to the circuit's resistance reduces that current, which means the reading is corrupted by the act of reading. An ideal ammeter therefore has zero resistance; a real one must be as close to zero as possible. But the galvanometer's coil is 60 Ω and burns out above 5 mA, so it can neither survive nor be inserted into a circuit carrying an ampere. The fix is a SHUNT: a small resistance S wired in parallel with the coil, offering an easy path so that only the coil's safe 5 mA goes through the movement and the rest bypasses it. Since the two are in parallel they share the same voltage, so I_g G = (I − I_g)S, giving S = I_g G/(I − I_g). For a full-scale reading of 1 A: S = 0.005 × 60/0.995 ≈ 0.30 Ω. Note what has happened to the combined resistance — 60 Ω in parallel with 0.30 Ω is about 0.30 Ω, so the finished ammeter has a low resistance, exactly as required. A VOLTMETER is connected across a component, in parallel with it, so it offers the current an alternative route. Every milliampere it takes is a milliampere the component no longer carries, and the potential difference the instrument was supposed to report falls because the instrument arrived. An ideal voltmeter therefore has infinite resistance; a real one must be as high as possible. The fix is a large resistance R in SERIES with the coil, so that even a large voltage across the pair drives only the coil's 5 mA. Here I_g(G + R) = V, giving R = V/I_g − G. For a full-scale reading of 10 V: R = 10/0.005 − 60 = 2000 − 60 = 1940 Ω, and the finished voltmeter has a resistance of 2000 Ω, high compared with ordinary circuit resistances. Now the student's two mistakes, which are the same mistake twice. Putting a LARGE resistance in parallel with a 60 Ω coil changes the combination hardly at all — it stays near 60 Ω — so his 'voltmeter' has a resistance comparable to the components it will be placed across and will steal a serious fraction of their current, reading low and altering the circuit while it does. Putting a SMALL resistance in series leaves a total near 60 Ω, so his 'ammeter' inserted into a circuit will itself dominate the resistance and throttle the very current it was built to measure. In both cases the instrument's own resistance sits in the wrong range for the way it is connected, and the general principle is one worth stating on its own: series connection demands low resistance, parallel connection demands high resistance, and every practical detail of both conversions follows from that. (The second option accepts a wrong topology and blames a number; the third denies a conversion that is standard laboratory practice; the fourth keeps the series connection for both and so keeps the ammeter's fatal resistance.)",
          hi: "दोनों रूपांतरण एक ऐसे प्रश्न से निकलते हैं जो चुंबकत्व का है ही नहीं: यंत्र जुड़ता कैसे है, और इसलिए जिस परिपथ को वह नाप रहा है उसके साथ उसे क्या करना चाहिए? नापने वाला यंत्र जो नापता है उसे जितना कम बिगाड़े उतना अच्छा, और दोनों यंत्र उलटे ढंगों से जुड़ते हैं, अतः उनकी माँगें उलटी निकलती हैं। अमीटर श्रेणी में डाला जाता है, अतः नापी जाने वाली पूरी धारा उसमें से गुज़रती है। वह परिपथ के प्रतिरोध में जो कुछ जोड़ता है वह उसी धारा को घटाता है, अर्थात् पढ़ने की क्रिया से ही पाठ्यांक बिगड़ जाता है। अतः आदर्श अमीटर का प्रतिरोध शून्य है; असली को शून्य के जितना निकट हो सके होना चाहिए। पर धारामापी की कुंडली 60 Ω है और 5 mA से ऊपर जल जाती है, अतः वह न बच सकती है न एक ऐम्पियर ले जाते परिपथ में डाली जा सकती है। उपाय शंट है: कुंडली के समांतर जुड़ा छोटा प्रतिरोध S, जो आसान रास्ता देता है ताकि केवल कुंडली के सुरक्षित 5 mA गतिका से जाएँ और बाक़ी बग़ल से निकल जाए। चूँकि दोनों समांतर हैं वे एक ही वोल्टता साझा करते हैं, अतः I_g G = (I − I_g)S, जिससे S = I_g G/(I − I_g). 1 A के पूर्ण विक्षेप के लिए: S = 0.005 × 60/0.995 ≈ 0.30 Ω. देखो संयुक्त प्रतिरोध का क्या हुआ — 60 Ω के समांतर 0.30 Ω लगभग 0.30 Ω है, अतः तैयार अमीटर का प्रतिरोध कम है, ठीक जैसा चाहिए था। वोल्टमापी किसी पुर्ज़े के आर-पार, उसके समांतर जुड़ता है, अतः वह धारा को वैकल्पिक रास्ता देता है। वह जितना मिलीऐम्पियर लेता है उतना पुर्ज़ा अब नहीं ले जाता, और जिस विभवांतर को यंत्र बताने वाला था वह इसलिए गिर जाता है कि यंत्र आ गया। अतः आदर्श वोल्टमापी का प्रतिरोध अनंत है; असली का जितना ऊँचा हो सके होना चाहिए। उपाय कुंडली के श्रेणी में बड़ा प्रतिरोध R है, ताकि युग्म के आर-पार बड़ी वोल्टता भी केवल कुंडली के 5 mA चलाए। यहाँ I_g(G + R) = V, जिससे R = V/I_g − G. 10 V के पूर्ण विक्षेप के लिए: R = 10/0.005 − 60 = 2000 − 60 = 1940 Ω, और तैयार वोल्टमापी का प्रतिरोध 2000 Ω है, साधारण परिपथ प्रतिरोधों की तुलना में ऊँचा। अब विद्यार्थी की दोनों भूलें, जो वही एक भूल दो बार है। 60 Ω की कुंडली के समांतर बड़ा प्रतिरोध रखने से संयोजन में शायद ही कुछ बदलता है — वह 60 Ω के पास ही रहता है — अतः उसका 'वोल्टमापी' उन्हीं पुर्ज़ों के दर्जे का प्रतिरोध रखता है जिनके आर-पार वह लगेगा और उनकी धारा का बड़ा हिस्सा चुरा लेगा, कम पढ़ेगा और साथ ही परिपथ बदल देगा। श्रेणी में छोटा प्रतिरोध रखने से कुल 60 Ω के पास रहता है, अतः परिपथ में डाला गया उसका 'अमीटर' स्वयं प्रतिरोध पर हावी होगा और उसी धारा का गला घोंटेगा जिसे नापने के लिए वह बना था। दोनों स्थितियों में यंत्र का अपना प्रतिरोध उसके जुड़ने के ढंग के लिए ग़लत परास में बैठा है, और सामान्य सिद्धांत अपने आप में कहने योग्य है: श्रेणी संयोजन कम प्रतिरोध माँगता है, समांतर संयोजन ऊँचा प्रतिरोध माँगता है, और दोनों रूपांतरणों का हर व्यावहारिक ब्योरा उसी से निकलता है। (दूसरा विकल्प ग़लत रचना स्वीकार कर एक संख्या को दोष देता है; तीसरा उस रूपांतरण से इनकार करता है जो प्रयोगशाला की मानक प्रथा है; चौथा दोनों के लिए श्रेणी संयोजन बनाए रखता है और यों अमीटर का घातक प्रतिरोध भी बनाए रखता है।)",
          mr: "दोन्ही रूपांतरणे अशा एका प्रश्नातून निघतात जो चुंबकत्वाचा मुळीच नाही: उपकरण जोडले कसे जाते, आणि म्हणून ज्या परिपथाला ते मोजत आहे त्याच्याशी त्याने काय करावे? मोजणाऱ्या उपकरणाने जे मोजतो त्याला जितके कमी बिघडवावे तितके बरे, आणि दोन्ही उपकरणे उलट पद्धतींनी जोडली जातात, म्हणून त्यांच्या मागण्या उलट निघतात. अ‍ॅमीटर श्रेणीत घातला जातो, म्हणून मोजायची अख्खी धारा त्यातून जाते. तो परिपथाच्या रोधात जे काही जोडतो ते त्याच धारेला घटवते, म्हणजे वाचण्याच्या कृतीनेच वाचन बिघडते. म्हणून आदर्श अ‍ॅमीटरचा रोध शून्य आहे; खऱ्याचा शून्याच्या जितका जवळ जमेल तितका असावा. पण गॅल्व्हॅनोमीटरचे वेटोळे 60 Ω आहे आणि 5 mA च्या वर जळून जाते, म्हणून ते ना टिकू शकते ना एक अँपिअर वाहणाऱ्या परिपथात घालता येते. उपाय म्हणजे शंट: वेटोळ्याच्या समांतर जोडलेला लहान रोध S, जो सोपा मार्ग देतो जेणेकरून केवळ वेटोळ्याचे सुरक्षित 5 mA हालचालीतून जातील आणि बाकीचे बाजूने निघून जातील. दोन्ही समांतर असल्याने ते एकच व्होल्टेज वाटून घेतात, म्हणून I_g G = (I − I_g)S, ज्यातून S = I_g G/(I − I_g). 1 A च्या पूर्ण विचलनासाठी: S = 0.005 × 60/0.995 ≈ 0.30 Ω. एकत्रित रोधाचे काय झाले ते पाहा — 60 Ω च्या समांतर 0.30 Ω म्हणजे सुमारे 0.30 Ω, म्हणून तयार अ‍ॅमीटरचा रोध कमी आहे, नेमका जसा हवा होता. व्होल्टमापक एखाद्या घटकाच्या आरपार, त्याच्या समांतर जोडला जातो, म्हणून तो धारेला पर्यायी मार्ग देतो. तो जितके मिलिअँपिअर घेतो तितके घटक आता वाहत नाही, आणि ज्या विभवांतराचा अहवाल उपकरणाने द्यायचा होता ते यामुळे घसरते की उपकरण आले. म्हणून आदर्श व्होल्टमापकाचा रोध अनंत आहे; खऱ्याचा जितका उंच जमेल तितका असावा. उपाय म्हणजे वेटोळ्याच्या श्रेणीत मोठा रोध R, जेणेकरून जोडीच्या आरपार मोठा व्होल्टेजही केवळ वेटोळ्याचे 5 mA चालवेल. इथे I_g(G + R) = V, ज्यातून R = V/I_g − G. 10 V च्या पूर्ण विचलनासाठी: R = 10/0.005 − 60 = 2000 − 60 = 1940 Ω, आणि तयार व्होल्टमापकाचा रोध 2000 Ω आहे, साध्या परिपथ रोधांच्या तुलनेत उंच. आता विद्यार्थ्याच्या दोन चुका, ज्या तीच एक चूक दोनदा आहेत. 60 Ω च्या वेटोळ्याच्या समांतर मोठा रोध ठेवल्याने जोडणीत जवळपास काहीच बदलत नाही — ती 60 Ω जवळच राहते — म्हणून त्याचा 'व्होल्टमापक' त्याच घटकांच्या दर्जाचा रोध बाळगतो ज्यांच्या आरपार तो लागेल आणि त्यांच्या धारेचा मोठा वाटा चोरेल, कमी वाचेल आणि सोबतच परिपथ बदलेल. श्रेणीत लहान रोध ठेवल्याने एकूण 60 Ω जवळ राहते, म्हणून परिपथात घातलेला त्याचा 'अ‍ॅमीटर' स्वतःच रोधावर वरचढ होईल आणि त्याच धारेचा गळा दाबेल जिला मोजण्यासाठी तो बनवला होता. दोन्ही स्थितींत उपकरणाचा स्वतःचा रोध त्याच्या जोडणीच्या पद्धतीसाठी चुकीच्या पल्ल्यात बसला आहे, आणि सर्वसाधारण तत्त्व स्वतःच सांगण्याजोगे आहे: श्रेणी जोडणी कमी रोध मागते, समांतर जोडणी उंच रोध मागते, आणि दोन्ही रूपांतरणांचा प्रत्येक व्यावहारिक तपशील त्यातूनच निघतो. (दुसरा पर्याय चुकीची रचना स्वीकारून एका आकड्याला दोष देतो; तिसरा प्रयोगशाळेच्या प्रमाणित प्रथेला असलेले रूपांतरण नाकारतो; चौथा दोन्हींसाठी श्रेणी जोडणी टिकवतो आणि अशा प्रकारे अ‍ॅमीटरचा घातक रोधही टिकवतो.)",
        },
      },
    ],
  },
  /*C1*/
];

export const G12_PHYSICS_NUMERIC: Record<string, NumQ[]> = {
  "physics-12-electric-charges-and-fields": [
    {
      level: 1,
      stem: {
        en: "A small body is found to carry a charge of 3.2 × 10⁻¹⁹ C. How many elementary charges is that?",
        hi: "एक छोटे पिंड पर 3.2 × 10⁻¹⁹ C का आवेश पाया जाता है। यह कितने मूल आवेशों के बराबर है?",
        mr: "एका लहान पदार्थावर 3.2 × 10⁻¹⁹ C चा प्रभार आढळतो. हा किती मूलभूत प्रभारांइतका आहे?",
      },
      answer: 2,
      wrong: [3.2, 1.6, 5],
      checkExpr: "3.2/1.6",
      solution: {
        en: "Charge is quantised as q = ne, so n = q/e = 3.2/1.6 = 2 elementary charges. The powers of ten are identical on both sides and cancel before any arithmetic is needed, which is worth spotting because it turns the whole calculation into a one-line division. (1.6 quotes the elementary charge itself instead of the count.)",
        hi: "आवेश q = ne के रूप में क्वांटमित है, अतः n = q/e = 3.2/1.6 = 2 मूल आवेश। दस की घातें दोनों ओर एक-सी हैं और किसी भी गणित से पहले कट जाती हैं, और यह पकड़ने योग्य है क्योंकि इससे पूरी गणना एक पंक्ति के भाग में बदल जाती है। (1.6 गिनती के बजाय मूल आवेश ही बता देता है।)",
        mr: "प्रभार q = ne या रूपात पुंजित आहे, म्हणून n = q/e = 3.2/1.6 = 2 मूलभूत प्रभार. दहाच्या घाती दोन्ही बाजूंना सारख्या आहेत आणि कोणत्याही गणिताआधीच कापल्या जातात, आणि हे ओळखण्याजोगे कारण त्यामुळे अख्खी गणना एका ओळीच्या भागाकारात बदलते. (1.6 मोजणीऐवजी मूलभूत प्रभारच सांगते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "Two point charges attract each other with a force of 40 N. Without altering either charge, the distance between them is doubled. What is the new force?",
        hi: "दो बिंदु आवेश एक-दूसरे को 40 N बल से खींचते हैं। किसी भी आवेश को बदले बिना उनके बीच की दूरी दुगुनी कर दी जाती है। नया बल क्या है?",
        mr: "दोन बिंदु प्रभार एकमेकांना 40 N बलाने ओढतात. कोणताही प्रभार न बदलता त्यांच्यातले अंतर दुप्पट केले जाते. नवे बल किती?",
      },
      answer: 10,
      wrong: [20, 80, 160],
      checkExpr: "40/4",
      fmt: newtons,
      solution: {
        en: "Coulomb's law makes the force inverse-square in the separation, so doubling r divides the force by 2² = 4: 40/4 = 10 N. (20 halves the force, treating the dependence as 1/r; 80 doubles it, reversing the direction of the effect as well as its power.)",
        hi: "कूलॉम का नियम बल को दूरी में व्युत्क्रम-वर्ग बनाता है, अतः r दुगुना करने पर बल 2² = 4 से भाग जाता है: 40/4 = 10 N. (20 बल आधा कर देता है, निर्भरता को 1/r मानकर; 80 उसे दुगुना कर देता है, घात के साथ प्रभाव की दिशा भी उलटकर।)",
        mr: "कुलोमचा नियम बलाला अंतरात व्यस्त-वर्ग बनवतो, म्हणून r दुप्पट केल्यास बल 2² = 4 ने भागले जाते: 40/4 = 10 N. (20 बल निम्मे करते, अवलंबित्व 1/r मानून; 80 ते दुप्पट करते, घातासोबत परिणामाची दिशाही उलटवून.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Two point charges of +2 μC and +3 μC are held 0.3 m apart in vacuum. What is the force between them? Take k = 9 × 10⁹ N m²/C².",
        hi: "+2 μC और +3 μC के दो बिंदु आवेश निर्वात में 0.3 m की दूरी पर रखे हैं। उनके बीच बल क्या है? k = 9 × 10⁹ N m²/C² लो।",
        mr: "+2 μC आणि +3 μC हे दोन बिंदु प्रभार निर्वातात 0.3 m अंतरावर धरले आहेत. त्यांच्यातले बल किती? k = 9 × 10⁹ N m²/C² घ्या.",
      },
      answer: 0.6,
      wrong: [0.2, 1.8, 6],
      checkExpr: "0.054/0.09",
      fmt: newtons,
      solution: {
        en: "F = kq₁q₂/r². The numerator is 9 × 10⁹ × 2 × 10⁻⁶ × 3 × 10⁻⁶ = 0.054, and r² = 0.3² = 0.09, so F = 0.054/0.09 = 0.6 N, a repulsion since both charges are positive. Squaring the 0.3 is the step most often skipped, and skipping it makes the answer three times too large. (1.8 divides by 0.3 instead of 0.09.)",
        hi: "F = kq₁q₂/r². अंश 9 × 10⁹ × 2 × 10⁻⁶ × 3 × 10⁻⁶ = 0.054 है, और r² = 0.3² = 0.09, अतः F = 0.054/0.09 = 0.6 N, और चूँकि दोनों आवेश धन हैं यह प्रतिकर्षण है। 0.3 का वर्ग करना वही चरण है जो सबसे अधिक छोड़ा जाता है, और उसे छोड़ने से उत्तर तीन गुना बड़ा हो जाता है। (1.8 0.09 के बजाय 0.3 से भाग देता है।)",
        mr: "F = kq₁q₂/r². अंश 9 × 10⁹ × 2 × 10⁻⁶ × 3 × 10⁻⁶ = 0.054 आहे, आणि r² = 0.3² = 0.09, म्हणून F = 0.054/0.09 = 0.6 N, आणि दोन्ही प्रभार धन असल्याने हे प्रतिकर्षण आहे. 0.3 चा वर्ग करणे हीच ती पायरी जी सर्वांत जास्त गाळली जाते, आणि ती गाळल्याने उत्तर तिप्पट मोठे होते. (1.8 हे 0.09 ऐवजी 0.3 ने भागते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "What is the magnitude of the electric field at a point 3 m from a point charge of 5 nC? Give the answer in N/C, taking k = 9 × 10⁹ N m²/C².",
        hi: "5 nC के बिंदु आवेश से 3 m दूर किसी बिंदु पर विद्युत क्षेत्र का परिमाण क्या है? उत्तर N/C में दो, k = 9 × 10⁹ N m²/C² लेकर।",
        mr: "5 nC च्या बिंदु प्रभारापासून 3 m दूर असलेल्या बिंदूवरील विद्युत क्षेत्राचे परिमाण किती? उत्तर N/C मध्ये द्या, k = 9 × 10⁹ N m²/C² घेऊन.",
      },
      answer: 5,
      wrong: [15, 1.5, 45],
      checkExpr: "45/9",
      solution: {
        en: "E = kq/r² = (9 × 10⁹ × 5 × 10⁻⁹)/3² = 45/9 = 5 N/C. Note that the field is defined without any second charge in the problem — it is what a test charge WOULD feel, and it exists at the point whether or not anything is there to be pushed. (15 divides by 3 instead of by 9, and 45 forgets to divide at all.)",
        hi: "E = kq/r² = (9 × 10⁹ × 5 × 10⁻⁹)/3² = 45/9 = 5 N/C. ध्यान दो कि प्रश्न में कोई दूसरा आवेश हुए बिना ही क्षेत्र परिभाषित है — वह वही है जो परीक्षण आवेश अनुभव करता, और वह बिंदु पर तब भी है जब वहाँ धकेले जाने को कुछ न हो। (15 9 के बजाय 3 से भाग देता है, और 45 भाग देना ही भूल जाता है।)",
        mr: "E = kq/r² = (9 × 10⁹ × 5 × 10⁻⁹)/3² = 45/9 = 5 N/C. लक्षात घ्या की प्रश्नात दुसरा कोणताही प्रभार नसतानाही क्षेत्र व्याख्यायित आहे — ते तेच जे चाचणी प्रभाराला जाणवले असते, आणि ते बिंदूवर तेव्हाही आहे जेव्हा तिथे ढकलले जायला काहीच नाही. (15 हे 9 ऐवजी 3 ने भागते, आणि 45 भागणेच विसरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A point charge sits at the centre of a cube. The total outward flux through the whole cube is 24 N m²/C. What is the flux through one face, in N m²/C?",
        hi: "एक बिंदु आवेश घन के केंद्र पर बैठा है। पूरे घन से कुल बाहरगामी फ्लक्स 24 N m²/C है। एक फलक से फ्लक्स N m²/C में क्या है?",
        mr: "एक बिंदु प्रभार घनाच्या केंद्रावर बसला आहे. अख्ख्या घनातून जाणारा एकूण बहिर्गामी फ्लक्स 24 N m²/C आहे. एका पृष्ठभागातून जाणारा फ्लक्स N m²/C मध्ये किती?",
      },
      answer: 4,
      wrong: [24, 6, 12],
      checkExpr: "24/6",
      solution: {
        en: "The charge is at the centre, so the six faces are related by symmetry and none can be favoured over another: each carries a sixth of the total, 24/6 = 4 N m²/C. This is a symmetry argument doing work no integral would do more cheaply — the flux through a square face of a cube is genuinely hard to compute directly. (6 counts the faces rather than dividing by them.)",
        hi: "आवेश केंद्र पर है, अतः छहों फलक सममिति से जुड़े हैं और किसी को दूसरे पर वरीयता नहीं दी जा सकती: हर एक कुल का छठा भाग रखता है, 24/6 = 4 N m²/C. यह सममिति का तर्क वह काम कर रहा है जो कोई समाकल इससे सस्ते में नहीं करता — घन के वर्गाकार फलक से फ्लक्स सीधे निकालना सचमुच कठिन है। (6 फलकों से भाग देने के बजाय उन्हें गिन देता है।)",
        mr: "प्रभार केंद्रावर आहे, म्हणून सहाही पृष्ठभाग सममितीने जोडलेले आहेत आणि कोणालाही दुसऱ्यावर प्राधान्य देता येत नाही: प्रत्येक एकूणाचा सहावा भाग बाळगतो, 24/6 = 4 N m²/C. हा सममितीचा युक्तिवाद ते काम करत आहे जे कोणतेही समाकलन याहून स्वस्तात करत नाही — घनाच्या चौरस पृष्ठभागातून जाणारा फ्लक्स थेट काढणे खरोखर कठीण आहे. (6 पृष्ठभागांनी भागण्याऐवजी त्यांना मोजते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A charge of 4 μC is placed at a point where the electric field has magnitude 5 × 10⁵ N/C. What force does it experience?",
        hi: "4 μC का आवेश ऐसे बिंदु पर रखा जाता है जहाँ विद्युत क्षेत्र का परिमाण 5 × 10⁵ N/C है। उस पर कितना बल लगता है?",
        mr: "4 μC चा प्रभार अशा बिंदूवर ठेवला जातो जिथे विद्युत क्षेत्राचे परिमाण 5 × 10⁵ N/C आहे. त्यावर किती बल लागते?",
      },
      answer: 2,
      wrong: [20, 0.8, 1.25],
      checkExpr: "4*5/10",
      fmt: newtons,
      solution: {
        en: "F = qE = 4 × 10⁻⁶ × 5 × 10⁵. Multiply the digits and the powers separately: 4 × 5 = 20 and 10⁻⁶ × 10⁵ = 10⁻¹, giving 20/10 = 2 N. Handling the exponents on their own is what stops a factor of ten slipping in, and a factor of ten is the commonest error in this whole chapter. (20 ignores the leftover 10⁻¹; 1.25 divides the charge by the field instead of multiplying.)",
        hi: "F = qE = 4 × 10⁻⁶ × 5 × 10⁵. अंक और घातें अलग-अलग गुणा करो: 4 × 5 = 20 और 10⁻⁶ × 10⁵ = 10⁻¹, जिससे 20/10 = 2 N. घातांकों को अलग सँभालना ही दस के गुणक को फिसलने से रोकता है, और दस का गुणक इस पूरे अध्याय की सबसे आम भूल है। (20 बचे हुए 10⁻¹ को अनदेखा करता है; 1.25 आवेश को क्षेत्र से गुणा करने के बजाय भाग दे देता है।)",
        mr: "F = qE = 4 × 10⁻⁶ × 5 × 10⁵. अंक आणि घाती वेगवेगळे गुणा: 4 × 5 = 20 आणि 10⁻⁶ × 10⁵ = 10⁻¹, ज्यातून 20/10 = 2 N. घातांक वेगळे हाताळणेच दहाच्या गुणकाला घसरण्यापासून रोखते, आणि दहाचा गुणक ही या अख्ख्या प्रकरणातली सर्वांत सामान्य चूक आहे. (20 उरलेल्या 10⁻¹ कडे दुर्लक्ष करते; 1.25 प्रभाराला क्षेत्राने गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Charges of +9 μC and +4 μC are fixed 5 m apart. At what distance from the +9 μC charge, along the line joining them, is the net electric field zero? Give the answer in m.",
        hi: "+9 μC और +4 μC के आवेश 5 m की दूरी पर स्थिर हैं। उन्हें जोड़ने वाली रेखा पर +9 μC आवेश से कितनी दूरी पर नेट विद्युत क्षेत्र शून्य है? उत्तर m में दो।",
        mr: "+9 μC आणि +4 μC हे प्रभार 5 m अंतरावर स्थिर आहेत. त्यांना जोडणाऱ्या रेषेवर +9 μC प्रभारापासून किती अंतरावर निव्वळ विद्युत क्षेत्र शून्य आहे? उत्तर m मध्ये द्या.",
      },
      answer: 3,
      wrong: [2, 2.5, 3.75],
      checkExpr: "15/5",
      solution: {
        en: "Both charges are positive, so their fields point away from each and can only cancel at a point BETWEEN them. At a distance x from the 9 μC charge, 9/x² = 4/(5 − x)², and taking square roots gives 3/x = 2/(5 − x), so 3(5 − x) = 2x, 15 = 5x, and x = 15/5 = 3 m. Taking the root before cross-multiplying is what keeps the algebra linear; squaring both sides instead produces a quadratic with a spurious second root outside the segment. (2.5 puts the null point at the midpoint, which would be right only for equal charges.)",
        hi: "दोनों आवेश धन हैं, अतः उनके क्षेत्र हर एक से दूर की ओर हैं और केवल उनके बीच के किसी बिंदु पर कट सकते हैं। 9 μC आवेश से x दूरी पर, 9/x² = 4/(5 − x)², और वर्गमूल लेने पर 3/x = 2/(5 − x), अतः 3(5 − x) = 2x, 15 = 5x, और x = 15/5 = 3 m. आड़ा-गुणा करने से पहले मूल लेना ही बीजगणित को रैखिक रखता है; इसके बजाय दोनों ओर वर्ग करने से द्विघात बनता है जिसका दूसरा मूल खंड के बाहर झूठा निकलता है। (2.5 शून्य बिंदु को मध्य बिंदु पर रख देता है, जो केवल बराबर आवेशों के लिए सही होता।)",
        mr: "दोन्ही प्रभार धन आहेत, म्हणून त्यांची क्षेत्रे प्रत्येकापासून दूर आहेत आणि केवळ त्यांच्यामधल्या एखाद्या बिंदूवरच कापली जाऊ शकतात. 9 μC प्रभारापासून x अंतरावर, 9/x² = 4/(5 − x)², आणि वर्गमूळ घेतल्यास 3/x = 2/(5 − x), म्हणून 3(5 − x) = 2x, 15 = 5x, आणि x = 15/5 = 3 m. आडवा गुणाकार करण्याआधी मूळ घेणेच बीजगणिताला रेषीय ठेवते; त्याऐवजी दोन्ही बाजूंचा वर्ग केल्यास वर्गसमीकरण बनते ज्याचे दुसरे मूळ खंडाबाहेर खोटे निघते. (2.5 शून्य बिंदूला मध्यबिंदूवर ठेवते, जे केवळ समान प्रभारांसाठी बरोबर ठरले असते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Charges of +12 μC and −5 μC lie inside a closed surface, and a charge of +20 μC lies just outside it. The net outward flux through the surface equals Q/ε₀. What is Q, in μC?",
        hi: "+12 μC और −5 μC के आवेश एक बंद पृष्ठ के भीतर हैं, और +20 μC का आवेश उसके ठीक बाहर है। पृष्ठ से नेट बाहरगामी फ्लक्स Q/ε₀ के बराबर है। Q, μC में, क्या है?",
        mr: "+12 μC आणि −5 μC हे प्रभार एका बंद पृष्ठाच्या आत आहेत, आणि +20 μC चा प्रभार त्याच्या अगदी बाहेर आहे. पृष्ठातून जाणारा निव्वळ बहिर्गामी फ्लक्स Q/ε₀ इतका आहे. Q, μC मध्ये, किती?",
      },
      answer: 7,
      wrong: [27, 17, 37],
      checkExpr: "12-5",
      solution: {
        en: "Gauss's law counts only the charge ENCLOSED, and it counts it algebraically, so Q = 12 − 5 = 7 μC. The external 20 μC contributes nothing to the net flux: every line it sends in through one part of the surface leaves through another, and the two contributions cancel exactly on integration. Note what has and has not been claimed — the field at each point of the surface certainly does depend on the external charge; only the total flux does not. (27 adds the outside charge and subtracts the negative one; 17 adds the outside charge and drops the negative; 37 adds all three magnitudes.)",
        hi: "गाउस का नियम केवल घिरे आवेश को गिनता है, और उसे बीजगणितीय रूप से गिनता है, अतः Q = 12 − 5 = 7 μC. बाहर का 20 μC नेट फ्लक्स में कुछ नहीं जोड़ता: वह पृष्ठ के एक भाग से जो रेखा भीतर भेजता है वह दूसरे से निकल जाती है, और समाकलन पर दोनों अंश ठीक-ठीक कट जाते हैं। ध्यान दो कि क्या दावा किया गया और क्या नहीं — पृष्ठ के हर बिंदु पर क्षेत्र निश्चय ही बाहरी आवेश पर निर्भर है; केवल कुल फ्लक्स नहीं। (27 बाहर का आवेश जोड़ता और ऋण वाला घटाता है; 17 बाहर का जोड़ता और ऋण वाला छोड़ देता है; 37 तीनों परिमाण जोड़ देता है।)",
        mr: "गॉसचा नियम केवळ घेरलेला प्रभार मोजतो, आणि तो बीजगणितीय रीतीने मोजतो, म्हणून Q = 12 − 5 = 7 μC. बाहेरचा 20 μC निव्वळ फ्लक्समध्ये काहीच जोडत नाही: तो पृष्ठाच्या एका भागातून आत पाठवत असलेली प्रत्येक रेषा दुसऱ्यातून बाहेर पडते, आणि समाकलनावर दोन्ही वाटे नेमके कापले जातात. काय दावा केला आणि काय नाही ते लक्षात घ्या — पृष्ठाच्या प्रत्येक बिंदूवरचे क्षेत्र निश्चितच बाह्य प्रभारावर अवलंबून आहे; केवळ एकूण फ्लक्स नाही. (27 बाहेरचा प्रभार जोडते आणि ऋण वजा करते; 17 बाहेरचा जोडते आणि ऋण गाळते; 37 तिन्ही परिमाणे जोडते.)",
      },
    },
  ],
  "physics-12-electrostatic-potential-and-capacitance": [
    {
      level: 1,
      stem: {
        en: "The electric potential at a point is 12 V. How much work, in joules, must be done to bring a charge of 3 C from infinity to that point?",
        hi: "किसी बिंदु पर विद्युत विभव 12 V है। 3 C का आवेश अनंत से उस बिंदु तक लाने में कितना कार्य, जूल में, करना पड़ेगा?",
        mr: "एका बिंदूवरील विद्युत विभव 12 V आहे. 3 C चा प्रभार अनंतापासून त्या बिंदूपर्यंत आणण्यास किती कार्य, ज्यूलमध्ये, करावे लागेल?",
      },
      answer: 36,
      wrong: [4, 15, 9],
      checkExpr: "3*12",
      solution: {
        en: "Potential is work per unit charge, so work is potential times charge: 3 × 12 = 36 J. The definition runs both ways and the direction you read it in is chosen by what the question gives you. (4 divides the potential by the charge, and 15 adds the two numbers.)",
        hi: "विभव प्रति एकांक आवेश कार्य है, अतः कार्य विभव गुणा आवेश है: 3 × 12 = 36 J. परिभाषा दोनों दिशाओं में चलती है और किस दिशा में पढ़नी है यह प्रश्न जो देता है उससे तय होता है। (4 विभव को आवेश से भाग दे देता है, और 15 दोनों संख्याएँ जोड़ देता है।)",
        mr: "विभव म्हणजे प्रति एकक प्रभार कार्य, म्हणून कार्य म्हणजे विभव गुणिले प्रभार: 3 × 12 = 36 J. व्याख्या दोन्ही दिशांनी चालते आणि कोणत्या दिशेने वाचायची हे प्रश्न जे देतो त्यावरून ठरते. (4 विभवाला प्रभाराने भागते, आणि 15 दोन्ही संख्या जोडते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A capacitor of 5 μF is charged to a potential difference of 20 V. What charge, in μC, does it then hold?",
        hi: "5 μF का संधारित्र 20 V विभवांतर तक आवेशित किया जाता है। तब वह कितना आवेश, μC में, रखता है?",
        mr: "5 μF चे धारित्र 20 V विभवांतरापर्यंत प्रभारित केले जाते. तेव्हा ते किती प्रभार, μC मध्ये, बाळगते?",
      },
      answer: 100,
      wrong: [4, 25, 0.25],
      checkExpr: "5*20",
      solution: {
        en: "Capacitance is charge per volt, C = Q/V, so Q = CV = 5 × 20 = 100 μC. Because both the capacitance and the answer are in micro-units, the prefix cancels and never has to be written out. (4 divides the voltage by the capacitance, and 25 adds them.)",
        hi: "धारिता प्रति वोल्ट आवेश है, C = Q/V, अतः Q = CV = 5 × 20 = 100 μC. चूँकि धारिता और उत्तर दोनों माइक्रो-मात्रकों में हैं, उपसर्ग कट जाता है और उसे लिखना ही नहीं पड़ता। (4 वोल्टता को धारिता से भाग देता है, और 25 उन्हें जोड़ देता है।)",
        mr: "धारिता म्हणजे प्रति व्होल्ट प्रभार, C = Q/V, म्हणून Q = CV = 5 × 20 = 100 μC. धारिता आणि उत्तर दोन्ही मायक्रो-एककांत असल्याने, उपसर्ग कापला जातो आणि तो लिहावाच लागत नाही. (4 व्होल्टेजला धारितेने भागते, आणि 25 त्यांना जोडते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Capacitors of 3 μF and 6 μF are joined in series. What is the equivalent capacitance, in μF?",
        hi: "3 μF और 6 μF के संधारित्र श्रेणी में जोड़े जाते हैं। तुल्य धारिता, μF में, क्या है?",
        mr: "3 μF आणि 6 μF ची धारित्रे श्रेणीत जोडली जातात. तुल्य धारिता, μF मध्ये, किती?",
      },
      answer: 2,
      wrong: [9, 4.5, 18],
      checkExpr: "3*6/9",
      solution: {
        en: "In series the reciprocals add: 1/C = 1/3 + 1/6 = 1/2, so C = (3 × 6)/(3 + 6) = 18/9 = 2 μF. Note that the result is smaller than either capacitor — series always is, because the same charge now has to cross two gaps and produces a larger total voltage. (9 adds them, which is the rule for parallel; 4.5 averages them.)",
        hi: "श्रेणी में व्युत्क्रम जुड़ते हैं: 1/C = 1/3 + 1/6 = 1/2, अतः C = (3 × 6)/(3 + 6) = 18/9 = 2 μF. ध्यान दो कि परिणाम दोनों संधारित्रों से छोटा है — श्रेणी सदा ऐसी ही होती है, क्योंकि वही आवेश अब दो दरारें पार करता है और बड़ी कुल वोल्टता बनाता है। (9 उन्हें जोड़ देता है, जो समांतर का नियम है; 4.5 उनका औसत ले लेता है।)",
        mr: "श्रेणीत व्यस्तांक जुळतात: 1/C = 1/3 + 1/6 = 1/2, म्हणून C = (3 × 6)/(3 + 6) = 18/9 = 2 μF. लक्षात घ्या की निकाल दोन्ही धारित्रांहून लहान आहे — श्रेणी नेहमीच अशी असते, कारण तोच प्रभार आता दोन फटी ओलांडतो आणि मोठा एकूण व्होल्टेज बनवतो. (9 त्यांना जोडते, जो समांतरचा नियम आहे; 4.5 त्यांची सरासरी घेते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The same two capacitors, 3 μF and 6 μF, are joined in parallel instead. What is the equivalent capacitance, in μF?",
        hi: "वही दो संधारित्र, 3 μF और 6 μF, इस बार समांतर में जोड़े जाते हैं। तुल्य धारिता, μF में, क्या है?",
        mr: "तीच दोन धारित्रे, 3 μF आणि 6 μF, यावेळी समांतरात जोडली जातात. तुल्य धारिता, μF मध्ये, किती?",
      },
      answer: 9,
      wrong: [2, 4.5, 18],
      checkExpr: "3+6",
      solution: {
        en: "In parallel the capacitances add directly: 3 + 6 = 9 μF. Both plates of each capacitor are at the same pair of potentials, so the arrangement is one capacitor with a larger plate area, and area is what capacitance is proportional to. Compared with the series case, this is the exact reverse of how resistors behave, which is why the two rules are worth learning as a contrasted pair. (2 applies the series rule; 18 multiplies without dividing.)",
        hi: "समांतर में धारिताएँ सीधे जुड़ती हैं: 3 + 6 = 9 μF. हर संधारित्र की दोनों प्लेटें विभवों के एक ही युग्म पर हैं, अतः यह व्यवस्था बड़ी प्लेट-क्षेत्रफल वाला एक ही संधारित्र है, और धारिता क्षेत्रफल की ही समानुपाती है। श्रेणी वाली स्थिति से तुलना करो तो यह प्रतिरोधकों के आचरण का ठीक उलटा है, इसीलिए दोनों नियम विपरीत युग्म की तरह सीखने योग्य हैं। (2 श्रेणी का नियम लगा देता है; 18 गुणा करता है और भाग नहीं देता।)",
        mr: "समांतरात धारिता थेट जुळतात: 3 + 6 = 9 μF. प्रत्येक धारित्राच्या दोन्ही पट्ट्या विभवांच्या एकाच जोडीवर आहेत, म्हणून ही मांडणी म्हणजे मोठे पट्टी-क्षेत्रफळ असलेले एकच धारित्र, आणि धारिता क्षेत्रफळाशीच समानुपाती आहे. श्रेणीच्या स्थितीशी तुलना केल्यास हे रोधकांच्या वर्तनाच्या नेमके उलट आहे, म्हणूनच दोन्ही नियम विरुद्ध जोडी म्हणून शिकण्याजोगे आहेत. (2 श्रेणीचा नियम लावते; 18 गुणते आणि भागत नाही.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "What is the electric potential at a point 3 m from a point charge of 2 nC? Take k = 9 × 10⁹ N m²/C².",
        hi: "2 nC के बिंदु आवेश से 3 m दूर बिंदु पर विद्युत विभव क्या है? k = 9 × 10⁹ N m²/C² लो।",
        mr: "2 nC च्या बिंदु प्रभारापासून 3 m दूर असलेल्या बिंदूवरील विद्युत विभव किती? k = 9 × 10⁹ N m²/C² घ्या.",
      },
      answer: 6,
      wrong: [2, 18, 54],
      checkExpr: "18/3",
      fmt: volts,
      solution: {
        en: "V = kq/r = (9 × 10⁹ × 2 × 10⁻⁹)/3 = 18/3 = 6 V. The single difference from the field formula is the power of r: potential falls as 1/r while the field falls as 1/r², because the potential is the field integrated along the path and integration lowers the power by one. (2 divides by 9 as if this were the field; 18 forgets to divide by r at all.)",
        hi: "V = kq/r = (9 × 10⁹ × 2 × 10⁻⁹)/3 = 18/3 = 6 V. क्षेत्र के सूत्र से एकमात्र अंतर r की घात है: विभव 1/r से घटता है जबकि क्षेत्र 1/r² से, क्योंकि विभव पथ के अनुदिश समाकलित क्षेत्र है और समाकलन घात एक घटा देता है। (2 ऐसे 9 से भाग देता है मानो यह क्षेत्र हो; 18 r से भाग देना ही भूल जाता है।)",
        mr: "V = kq/r = (9 × 10⁹ × 2 × 10⁻⁹)/3 = 18/3 = 6 V. क्षेत्राच्या सूत्रापासूनचा एकमेव फरक म्हणजे r ची घात: विभव 1/r ने घटतो तर क्षेत्र 1/r² ने, कारण विभव म्हणजे मार्गाच्या दिशेने समाकलित केलेले क्षेत्र आणि समाकलन घात एकने घटवते. (2 असे 9 ने भागते जणू हे क्षेत्र असावे; 18 हे r ने भागणेच विसरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A capacitor of 2 μF is charged to 100 V. How much energy, in millijoules, does it store?",
        hi: "2 μF का संधारित्र 100 V तक आवेशित किया जाता है। वह कितनी ऊर्जा, मिलीजूल में, संचित करता है?",
        mr: "2 μF चे धारित्र 100 V पर्यंत प्रभारित केले जाते. ते किती ऊर्जा, मिलिज्यूलमध्ये, साठवते?",
      },
      answer: 10,
      wrong: [20, 5, 100],
      checkExpr: "0.5*2*10000/1000",
      solution: {
        en: "U = ½CV² = ½ × 2 × 10⁻⁶ × 100² = 10⁻² J, which is 10 mJ. The half is not decoration: the plates were charged gradually, and the first coulomb crossed at almost no voltage while the last crossed at the full 100, so the average is half the final value. (20 drops the factor of a half, and 5 halves twice.)",
        hi: "U = ½CV² = ½ × 2 × 10⁻⁶ × 100² = 10⁻² J, अर्थात् 10 mJ. आधा सजावट नहीं: प्लेटें धीरे-धीरे आवेशित हुईं, और पहला कूलॉम लगभग शून्य वोल्टता पर पार हुआ जबकि आख़िरी पूरे 100 पर, अतः औसत अंतिम मान का आधा है। (20 आधे का गुणक छोड़ देता है, और 5 दो बार आधा कर देता है।)",
        mr: "U = ½CV² = ½ × 2 × 10⁻⁶ × 100² = 10⁻² J, म्हणजे 10 mJ. निम्मे ही सजावट नाही: पट्ट्या हळूहळू प्रभारित झाल्या, आणि पहिला कुलोम जवळपास शून्य व्होल्टेजवर ओलांडला तर शेवटचा पूर्ण 100 वर, म्हणून सरासरी अंतिम मूल्याच्या निम्मी आहे. (20 निम्म्याचा गुणक गाळते, आणि 5 दोनदा निम्मे करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A parallel plate capacitor of 4 pF has the space between its plates completely filled with a dielectric of constant 5. What is its new capacitance, in pF?",
        hi: "4 pF के समांतर पट्ट संधारित्र की प्लेटों के बीच की जगह परावैद्युतांक 5 वाले माध्यम से पूरी तरह भर दी जाती है। उसकी नई धारिता, pF में, क्या है?",
        mr: "4 pF च्या समांतर पट्ट धारित्राच्या पट्ट्यांमधली जागा पराविद्युतांक 5 असलेल्या माध्यमाने पूर्णपणे भरली जाते. त्याची नवी धारिता, pF मध्ये, किती?",
      },
      answer: 20,
      wrong: [0.8, 9, 4],
      checkExpr: "4*5",
      solution: {
        en: "Filling the gap multiplies the capacitance by the dielectric constant: 4 × 5 = 20 pF. The mechanism is that polarisation sets up bound charge whose field opposes the applied one, so the same free charge now produces a smaller voltage — and capacitance is charge per volt. (0.8 divides by K, which is what happens to the field rather than to the capacitance; 9 adds instead of multiplying.)",
        hi: "दरार भरने से धारिता परावैद्युतांक गुनी हो जाती है: 4 × 5 = 20 pF. क्रियाविधि यह कि ध्रुवण बद्ध आवेश खड़ा करता है जिसका क्षेत्र लगाए गए के विरुद्ध है, अतः वही मुक्त आवेश अब कम वोल्टता देता है — और धारिता प्रति वोल्ट आवेश है। (0.8 K से भाग दे देता है, जो धारिता के साथ नहीं क्षेत्र के साथ होता है; 9 गुणा करने के बजाय जोड़ देता है।)",
        mr: "फट भरल्याने धारिता पराविद्युतांक पट होते: 4 × 5 = 20 pF. यंत्रणा अशी की ध्रुवण बद्ध प्रभार उभा करते ज्याचे क्षेत्र लावलेल्याविरुद्ध असते, म्हणून तोच मुक्त प्रभार आता कमी व्होल्टेज देतो — आणि धारिता म्हणजे प्रति व्होल्ट प्रभार. (0.8 हे K ने भागते, जे धारितेसोबत नव्हे तर क्षेत्रासोबत घडते; 9 गुणण्याऐवजी जोडते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A 4 μF capacitor is charged to 100 V, disconnected from the battery, and then connected across an uncharged 1 μF capacitor. What is the common potential difference across the pair?",
        hi: "4 μF का संधारित्र 100 V तक आवेशित किया जाता है, बैटरी से अलग किया जाता है, और फिर एक अनावेशित 1 μF संधारित्र के आर-पार जोड़ा जाता है। युग्म के आर-पार साझा विभवांतर क्या है?",
        mr: "4 μF चे धारित्र 100 V पर्यंत प्रभारित केले जाते, बॅटरीपासून वेगळे केले जाते, आणि मग एका अप्रभारित 1 μF धारित्राच्या आरपार जोडले जाते. जोडीच्या आरपार सामायिक विभवांतर किती?",
      },
      answer: 80,
      wrong: [100, 50, 20],
      checkExpr: "400/5",
      fmt: volts,
      solution: {
        en: "The charge is conserved and simply redistributes: Q = 4 × 100 = 400 μC. Once joined, the two capacitors are in parallel, so the combined capacitance is 4 + 1 = 5 μF and the shared voltage is V = Q/C = 400/5 = 80 V. The stopping condition is equality of POTENTIAL, not of charge — the larger capacitor keeps four-fifths of the charge because it takes four times as much charge to hold it at the same voltage. (50 splits the voltage as though the two were identical.)",
        hi: "आवेश संरक्षित है और बस फिर से बँट जाता है: Q = 4 × 100 = 400 μC. जुड़ते ही दोनों संधारित्र समांतर में हैं, अतः संयुक्त धारिता 4 + 1 = 5 μF और साझा वोल्टता V = Q/C = 400/5 = 80 V. रुकने की शर्त विभव की समानता है, आवेश की नहीं — बड़ा संधारित्र आवेश का चार-पाँचवाँ भाग रखता है क्योंकि उसे उसी वोल्टता पर रोकने के लिए चार गुना आवेश चाहिए। (50 वोल्टता को ऐसे बाँट देता है मानो दोनों एक जैसे हों।)",
        mr: "प्रभार संधारित आहे आणि फक्त पुन्हा वाटला जातो: Q = 4 × 100 = 400 μC. जोडताच दोन्ही धारित्रे समांतरात आहेत, म्हणून एकत्रित धारिता 4 + 1 = 5 μF आणि सामायिक व्होल्टेज V = Q/C = 400/5 = 80 V. थांबण्याची अट विभवाची समानता आहे, प्रभाराची नव्हे — मोठे धारित्र प्रभाराचा चार-पंचमांश ठेवते कारण त्याला त्याच व्होल्टेजवर धरण्यासाठी चौपट प्रभार लागतो. (50 व्होल्टेज असे वाटते जणू दोन्ही सारखी असावीत.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "In that sharing between a 4 μF capacitor charged to 100 V and an uncharged 1 μF capacitor, how much energy, in millijoules, is lost?",
        hi: "100 V तक आवेशित 4 μF संधारित्र और अनावेशित 1 μF संधारित्र के बीच उसी बँटवारे में कितनी ऊर्जा, मिलीजूल में, नष्ट होती है?",
        mr: "100 V पर्यंत प्रभारित 4 μF धारित्र आणि अप्रभारित 1 μF धारित्र यांच्यातील त्याच वाटपात किती ऊर्जा, मिलिज्यूलमध्ये, नष्ट होते?",
      },
      answer: 4,
      wrong: [0, 2, 36],
      checkExpr: "20-16",
      solution: {
        en: "Before: U = ½ × 4 × 100² μJ = 20000 μJ = 20 mJ. After: the pair sits at 80 V with a combined 5 μF, so U = ½ × 5 × 80² μJ = 16000 μJ = 16 mJ. The loss is 20 − 16 = 4 mJ, a fifth of what was there. Charge is conserved but electrostatic energy is not, and the difference goes as heat in the connecting wire and as radiation from the accelerating charge. Notably it does not vanish as the wire is made a better conductor: a lower resistance means a larger current for a shorter time, and I²Rt is unchanged. (0 assumes energy must be conserved because charge is.)",
        hi: "पहले: U = ½ × 4 × 100² μJ = 20000 μJ = 20 mJ. बाद में: युग्म 80 V पर बैठा है और संयुक्त धारिता 5 μF है, अतः U = ½ × 5 × 80² μJ = 16000 μJ = 16 mJ. हानि 20 − 16 = 4 mJ है, जो था उसका पाँचवाँ भाग। आवेश संरक्षित है पर स्थिरवैद्युत ऊर्जा नहीं, और अंतर जोड़ने वाले तार में ऊष्मा और त्वरित आवेश से विकिरण बनकर जाता है। ध्यान देने योग्य यह कि तार को बेहतर चालक बनाने से वह लुप्त नहीं होती: कम प्रतिरोध का अर्थ है कम समय के लिए बड़ी धारा, और I²Rt अपरिवर्तित रहता है। (0 मान लेता है कि आवेश संरक्षित है इसलिए ऊर्जा भी संरक्षित होनी चाहिए।)",
        mr: "आधी: U = ½ × 4 × 100² μJ = 20000 μJ = 20 mJ. नंतर: जोडी 80 V वर बसली आहे आणि एकत्रित धारिता 5 μF आहे, म्हणून U = ½ × 5 × 80² μJ = 16000 μJ = 16 mJ. हानी 20 − 16 = 4 mJ आहे, जे होते त्याचा पाचवा भाग. प्रभार संधारित आहे पण स्थिरविद्युत ऊर्जा नाही, आणि फरक जोडणाऱ्या तारेत उष्णता आणि त्वरित प्रभारापासून प्रारण बनून जातो. लक्षात घेण्याजोगे हे की तारेला अधिक चांगला वाहक बनवल्याने ती नाहीशी होत नाही: कमी रोध म्हणजे कमी काळासाठी मोठी धारा, आणि I²Rt अपरिवर्तित राहते. (0 गृहीत धरते की प्रभार संधारित आहे म्हणून ऊर्जाही संधारित असावी.)",
      },
    },
  ],
  "physics-12-current-electricity": [
    {
      level: 1,
      stem: {
        en: "A charge of 60 C passes a given point in a wire in 12 s. What is the current in the wire?",
        hi: "एक तार के किसी बिंदु से 12 s में 60 C आवेश गुज़रता है। तार में धारा क्या है?",
        mr: "एका तारेतील दिलेल्या बिंदूवरून 12 s मध्ये 60 C प्रभार जातो. तारेतील धारा किती?",
      },
      answer: 5,
      wrong: [0.2, 72, 720],
      checkExpr: "60/12",
      fmt: amperes,
      solution: {
        en: "Current is charge per unit time: I = Q/t = 60/12 = 5 A. It is a rate, not an amount, which is why a wire can carry a current all day without accumulating anything — as much charge leaves every point as arrives at it. (0.2 inverts the division, and 720 multiplies instead.)",
        hi: "धारा प्रति एकांक समय आवेश है: I = Q/t = 60/12 = 5 A. यह दर है, मात्रा नहीं, इसीलिए तार दिन भर धारा ले जा सकता है बिना कुछ जमा किए — हर बिंदु से उतना ही आवेश निकलता है जितना वहाँ पहुँचता है। (0.2 भाग उलट देता है, और 720 गुणा कर देता है।)",
        mr: "धारा म्हणजे प्रति एकक काळ प्रभार: I = Q/t = 60/12 = 5 A. हा दर आहे, प्रमाण नव्हे, म्हणूनच तार दिवसभर धारा वाहू शकते काहीही न साठवता — प्रत्येक बिंदूतून तितकाच प्रभार निघतो जितका तिथे पोहोचतो. (0.2 भागाकार उलटवते, आणि 720 गुणते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A potential difference of 12 V drives a current of 2 A through a resistor. What is the resistance?",
        hi: "12 V का विभवांतर एक प्रतिरोधक में से 2 A धारा चलाता है। प्रतिरोध क्या है?",
        mr: "12 V चा विभवांतर एका रोधकातून 2 A धारा चालवतो. रोध किती?",
      },
      answer: 6,
      wrong: [24, 0.5, 10],
      checkExpr: "12/2",
      fmt: ohms,
      solution: {
        en: "From V = IR, R = V/I = 12/2 = 6 Ω. The equation is worth reading as a definition of resistance rather than as a law: it defines R for any conductor, and the LAW is the separate claim that R stays the same when V changes. (0.5 inverts the ratio, and 24 multiplies.)",
        hi: "V = IR से, R = V/I = 12/2 = 6 Ω. समीकरण को नियम के बजाय प्रतिरोध की परिभाषा की तरह पढ़ना चाहिए: वह किसी भी चालक के लिए R परिभाषित करता है, और नियम यह अलग दावा है कि V बदलने पर R वही रहता है। (0.5 अनुपात उलट देता है, और 24 गुणा कर देता है।)",
        mr: "V = IR वरून, R = V/I = 12/2 = 6 Ω. समीकरण नियमाऐवजी रोधाची व्याख्या म्हणून वाचण्याजोगे आहे: ते कोणत्याही वाहकासाठी R व्याख्यायित करते, आणि नियम हा वेगळा दावा आहे की V बदलल्यावर R तोच राहतो. (0.5 गुणोत्तर उलटवते, आणि 24 गुणते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Resistors of 2 Ω, 3 Ω and 5 Ω are joined end to end in series. What is the equivalent resistance?",
        hi: "2 Ω, 3 Ω और 5 Ω के प्रतिरोधक श्रेणी में सिरे से सिरे जोड़े जाते हैं। तुल्य प्रतिरोध क्या है?",
        mr: "2 Ω, 3 Ω आणि 5 Ω चे रोधक श्रेणीत टोकाला टोक जोडले जातात. तुल्य रोध किती?",
      },
      answer: 10,
      wrong: [0.97, 30, 3.33],
      checkExpr: "2+3+5",
      fmt: ohms,
      solution: {
        en: "In series the same current passes through each, so the voltage drops add and the resistances add: 2 + 3 + 5 = 10 Ω. The total is always larger than the largest member, which is a useful check on any series answer. (0.97 applies the parallel formula, and 3.33 averages.)",
        hi: "श्रेणी में हर एक में से वही धारा गुज़रती है, अतः वोल्टता के पतन जुड़ते हैं और प्रतिरोध जुड़ते हैं: 2 + 3 + 5 = 10 Ω. कुल सदा सबसे बड़े सदस्य से बड़ा होता है, और यह किसी भी श्रेणी उत्तर की उपयोगी जाँच है। (0.97 समांतर का सूत्र लगा देता है, और 3.33 औसत ले लेता है।)",
        mr: "श्रेणीत प्रत्येकातून तीच धारा जाते, म्हणून व्होल्टेजच्या घसरणी जुळतात आणि रोध जुळतात: 2 + 3 + 5 = 10 Ω. एकूण नेहमी सर्वांत मोठ्या सदस्याहून मोठे असते, आणि ही कोणत्याही श्रेणी उत्तराची उपयुक्त तपासणी. (0.97 समांतरचे सूत्र लावते, आणि 3.33 सरासरी घेते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Resistors of 6 Ω and 3 Ω are connected in parallel. What is the equivalent resistance?",
        hi: "6 Ω और 3 Ω के प्रतिरोधक समांतर में जोड़े जाते हैं। तुल्य प्रतिरोध क्या है?",
        mr: "6 Ω आणि 3 Ω चे रोधक समांतरात जोडले जातात. तुल्य रोध किती?",
      },
      answer: 2,
      wrong: [9, 4.5, 18],
      checkExpr: "6*3/9",
      fmt: ohms,
      solution: {
        en: "In parallel the conductances add: 1/R = 1/6 + 1/3 = 1/2, so R = (6 × 3)/(6 + 3) = 18/9 = 2 Ω. The result must be smaller than the smaller resistor, because adding a second path can only make it easier for current to get through. (9 adds them, which is the series rule; 4.5 averages.)",
        hi: "समांतर में चालकताएँ जुड़ती हैं: 1/R = 1/6 + 1/3 = 1/2, अतः R = (6 × 3)/(6 + 3) = 18/9 = 2 Ω. परिणाम छोटे प्रतिरोधक से भी छोटा होना चाहिए, क्योंकि दूसरा रास्ता जोड़ने से धारा के गुज़रने में आसानी ही हो सकती है। (9 उन्हें जोड़ देता है, जो श्रेणी का नियम है; 4.5 औसत ले लेता है।)",
        mr: "समांतरात वाहकता जुळतात: 1/R = 1/6 + 1/3 = 1/2, म्हणून R = (6 × 3)/(6 + 3) = 18/9 = 2 Ω. निकाल लहान रोधकाहूनही लहान असला पाहिजे, कारण दुसरा मार्ग जोडल्याने धारेला जाणे सोपेच होऊ शकते. (9 त्यांना जोडते, जो श्रेणीचा नियम आहे; 4.5 सरासरी घेते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A wire 2 m long has a cross-sectional area of 4 × 10⁻⁷ m² and is made of a material of resistivity 2 × 10⁻⁶ Ω m. What is its resistance?",
        hi: "2 m लंबे तार का अनुप्रस्थ काट क्षेत्रफल 4 × 10⁻⁷ m² है और वह 2 × 10⁻⁶ Ω m प्रतिरोधकता वाले पदार्थ का बना है। उसका प्रतिरोध क्या है?",
        mr: "2 m लांब तारेचे आडवे छेदक्षेत्रफळ 4 × 10⁻⁷ m² आहे आणि ती 2 × 10⁻⁶ Ω m रोधकता असलेल्या पदार्थाची बनलेली आहे. तिचा रोध किती?",
      },
      answer: 10,
      wrong: [2.5, 5, 20],
      checkExpr: "40/4",
      fmt: ohms,
      solution: {
        en: "R = ρL/A = (2 × 10⁻⁶ × 2)/(4 × 10⁻⁷) = (4 × 10⁻⁶)/(4 × 10⁻⁷) = 40/4 = 10 Ω. Work the digits and the powers of ten separately and the exponent arithmetic — a difference of one — is the only place a slip can happen. (2.5 inverts the ratio of length to area, and 20 loses the factor of ten in the exponents.)",
        hi: "R = ρL/A = (2 × 10⁻⁶ × 2)/(4 × 10⁻⁷) = (4 × 10⁻⁶)/(4 × 10⁻⁷) = 40/4 = 10 Ω. अंक और दस की घातें अलग-अलग साधो और घातांक का गणित — एक का अंतर — ही एकमात्र जगह है जहाँ चूक हो सकती है। (2.5 लंबाई और क्षेत्रफल का अनुपात उलट देता है, और 20 घातांकों में दस का गुणक खो देता है।)",
        mr: "R = ρL/A = (2 × 10⁻⁶ × 2)/(4 × 10⁻⁷) = (4 × 10⁻⁶)/(4 × 10⁻⁷) = 40/4 = 10 Ω. अंक आणि दहाच्या घाती वेगवेगळ्या हाताळा आणि घातांकाचे गणित — एकाचा फरक — हीच एकमेव जागा जिथे चूक होऊ शकते. (2.5 लांबी आणि क्षेत्रफळाचे गुणोत्तर उलटवते, आणि 20 घातांकांतील दहाचा गुणक हरवते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A lamp rated 60 W is designed to run on a 240 V supply. What current does it draw at that voltage?",
        hi: "60 W का लैंप 240 V आपूर्ति पर चलने को बना है। उस वोल्टता पर वह कितनी धारा खींचता है?",
        mr: "60 W चा दिवा 240 V पुरवठ्यावर चालण्यासाठी बनवलेला आहे. त्या व्होल्टेजवर तो किती धारा ओढतो?",
      },
      answer: 0.25,
      wrong: [4, 0.4, 180],
      checkExpr: "60/240",
      fmt: amperes,
      solution: {
        en: "Power is P = VI, so I = P/V = 60/240 = 0.25 A. The rating is a pair of numbers and neither alone describes the lamp — the same 60 W on a 120 V supply would need twice the current and a quarter the resistance. (4 inverts the division; 180 subtracts.)",
        hi: "शक्ति P = VI है, अतः I = P/V = 60/240 = 0.25 A. निर्धारण संख्याओं का युग्म है और अकेली कोई भी लैंप का वर्णन नहीं करती — वही 60 W 120 V आपूर्ति पर दुगुनी धारा और चौथाई प्रतिरोध माँगता। (4 भाग उलट देता है; 180 घटा देता है।)",
        mr: "शक्ती P = VI आहे, म्हणून I = P/V = 60/240 = 0.25 A. निर्धारण म्हणजे संख्यांची जोडी आणि एकटी कोणतीही दिव्याचे वर्णन करत नाही — तेच 60 W हे 120 V पुरवठ्यावर दुप्पट धारा आणि चतुर्थांश रोध मागेल. (4 भागाकार उलटवते; 180 वजा करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A heating element of resistance 20 Ω carries a current of 5 A for 10 s. How much heat, in kilojoules, does it produce?",
        hi: "20 Ω प्रतिरोध का तापन तत्व 10 s तक 5 A धारा ले जाता है। वह कितनी ऊष्मा, किलोजूल में, पैदा करता है?",
        mr: "20 Ω रोधाचा तापक घटक 10 s पर्यंत 5 A धारा वाहतो. तो किती उष्णता, किलोज्यूलमध्ये, निर्माण करतो?",
      },
      answer: 5,
      wrong: [1, 10, 2.5],
      checkExpr: "25*20*10/1000",
      solution: {
        en: "Joule heating gives H = I²Rt = 5² × 20 × 10 = 25 × 20 × 10 = 5000 J, which is 5 kJ. Squaring the current before multiplying is the step that matters: doubling the current quadruples the heat, which is why a slightly overloaded wire gets dangerously hot rather than slightly warm. (1 forgets to square the current, and 2.5 halves as if this were a kinetic-energy formula.)",
        hi: "जूल तापन से H = I²Rt = 5² × 20 × 10 = 25 × 20 × 10 = 5000 J, अर्थात् 5 kJ. गुणा करने से पहले धारा का वर्ग करना ही निर्णायक चरण है: धारा दुगुनी करने पर ऊष्मा चौगुनी होती है, इसीलिए थोड़ा अधिक भारित तार थोड़ा गुनगुना नहीं बल्कि ख़तरनाक ढंग से गर्म हो जाता है। (1 धारा का वर्ग करना भूल जाता है, और 2.5 ऐसे आधा कर देता है मानो यह गतिज ऊर्जा का सूत्र हो।)",
        mr: "ज्यूल तापनाने H = I²Rt = 5² × 20 × 10 = 25 × 20 × 10 = 5000 J, म्हणजे 5 kJ. गुणण्याआधी धारेचा वर्ग करणे हीच निर्णायक पायरी: धारा दुप्पट केल्यास उष्णता चौपट होते, म्हणूनच किंचित जास्त भारलेली तार किंचित कोमट न होता धोकादायकपणे तापते. (1 धारेचा वर्ग करणे विसरते, आणि 2.5 असे निम्मे करते जणू हे गतिज ऊर्जेचे सूत्र असावे.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A wire of resistance 4 Ω is stretched uniformly until it is twice as long, with no metal lost. What is its new resistance?",
        hi: "4 Ω प्रतिरोध का तार एकसमान रूप से तब तक खींचा जाता है जब तक वह दुगुना लंबा न हो जाए, और कोई धातु नष्ट नहीं होती। उसका नया प्रतिरोध क्या है?",
        mr: "4 Ω रोधाची तार एकसमानपणे तोवर ताणली जाते जोवर ती दुप्पट लांब होत नाही, आणि कोणतीही धातू गमावली जात नाही. तिचा नवा रोध किती?",
      },
      answer: 16,
      wrong: [8, 2, 1],
      checkExpr: "4*4",
      fmt: ohms,
      solution: {
        en: "The volume is fixed, so doubling the length halves the area, and R = ρL/A changes by 2 × 2 = 4: the new resistance is 4 × 4 = 16 Ω. The trap is to see only the length and answer 8; stretching changes two things at once, and the resistance always goes as the square of the stretch factor. (2 and 1 apply the change in the wrong direction.)",
        hi: "आयतन नियत है, अतः लंबाई दुगुनी करने पर क्षेत्रफल आधा होता है, और R = ρL/A में 2 × 2 = 4 का परिवर्तन होता है: नया प्रतिरोध 4 × 4 = 16 Ω. जाल यह कि केवल लंबाई देखकर 8 कह दिया जाए; खिंचाव एक साथ दो चीज़ें बदलता है, और प्रतिरोध सदा खिंचाव-गुणक के वर्ग से चलता है। (2 और 1 परिवर्तन को ग़लत दिशा में लगाते हैं।)",
        mr: "घनफळ स्थिर आहे, म्हणून लांबी दुप्पट केल्यास क्षेत्रफळ निम्मे होते, आणि R = ρL/A मध्ये 2 × 2 = 4 चा बदल होतो: नवा रोध 4 × 4 = 16 Ω. सापळा असा की केवळ लांबी पाहून 8 म्हणावे; ताणणे एकाच वेळी दोन गोष्टी बदलते, आणि रोध नेहमी ताण-गुणकाच्या वर्गाने चालतो. (2 आणि 1 बदल चुकीच्या दिशेने लावतात.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A cell of e.m.f. 12 V and internal resistance 2 Ω is connected across an external resistance of 4 Ω. What is the potential difference across the cell's terminals?",
        hi: "12 V विद्युत वाहक बल और 2 Ω आंतरिक प्रतिरोध वाला सेल 4 Ω बाहरी प्रतिरोध के आर-पार जोड़ा जाता है। सेल के सिरों के आर-पार विभवांतर क्या है?",
        mr: "12 V विद्युतचालक बल आणि 2 Ω अंतर्गत रोध असलेला घट 4 Ω बाह्य रोधाच्या आरपार जोडला जातो. घटाच्या टोकांच्या आरपार विभवांतर किती?",
      },
      answer: 8,
      wrong: [12, 4, 6],
      checkExpr: "12-2*2",
      fmt: volts,
      solution: {
        en: "The current is set by the total resistance including the cell's own: I = 12/(4 + 2) = 2 A. The terminal voltage is then V = ε − Ir = 12 − 2 × 2 = 8 V, and the missing 4 V is spent inside the cell. Forgetting to include r in the total is the commonest slip and gives a current of 3 A. (12 quotes the e.m.f., which is what a voltmeter would read only with no current flowing.)",
        hi: "धारा कुल प्रतिरोध से तय होती है, जिसमें सेल का अपना भी शामिल है: I = 12/(4 + 2) = 2 A. तब सिरों की वोल्टता V = ε − Ir = 12 − 2 × 2 = 8 V, और लुप्त 4 V सेल के भीतर ख़र्च होते हैं। कुल में r जोड़ना भूल जाना सबसे आम चूक है और वह 3 A की धारा देती है। (12 विद्युत वाहक बल बता देता है, जो वोल्टमापी तभी पढ़ता जब कोई धारा न बह रही हो।)",
        mr: "धारा एकूण रोधाने ठरते, ज्यात घटाचा स्वतःचाही समाविष्ट आहे: I = 12/(4 + 2) = 2 A. मग टोकांचा व्होल्टेज V = ε − Ir = 12 − 2 × 2 = 8 V, आणि हरवलेले 4 V घटाच्या आत खर्च होतात. एकूणात r जोडणे विसरणे ही सर्वांत सामान्य चूक आणि ती 3 A ची धारा देते. (12 विद्युतचालक बल सांगते, जे व्होल्टमापक तेव्हाच वाचेल जेव्हा कोणतीही धारा वाहत नसेल.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "In a metre bridge the balance point is found 40 cm from the left end, with an unknown resistance in the left gap and a 6 Ω standard in the right gap. What is the unknown resistance?",
        hi: "एक मीटर सेतु में संतुलन बिंदु बाएँ सिरे से 40 cm पर मिलता है, बाएँ अंतराल में अज्ञात प्रतिरोध और दाएँ अंतराल में 6 Ω का मानक है। अज्ञात प्रतिरोध क्या है?",
        mr: "एका मीटर ब्रिजमध्ये तोल बिंदू डाव्या टोकापासून 40 cm वर मिळतो, डाव्या फटीत अज्ञात रोध आणि उजव्या फटीत 6 Ω चे मानक आहे. अज्ञात रोध किती?",
      },
      answer: 4,
      wrong: [9, 2.4, 15],
      checkExpr: "6*40/60",
      fmt: ohms,
      solution: {
        en: "At balance the bridge gives R/S = l/(100 − l), so R = 6 × 40/60 = 4 Ω. The value is read off a LENGTH, and that is the point of the instrument: at balance no current flows through the galvanometer, so neither the cell's internal resistance nor the resistance of the connecting wires enters the answer at all. (9 uses the ratio the wrong way up, and 2.4 divides by 100 instead of by the remaining 60.)",
        hi: "संतुलन पर सेतु R/S = l/(100 − l) देता है, अतः R = 6 × 40/60 = 4 Ω. मान एक लंबाई से पढ़ा जाता है, और यही यंत्र का मर्म है: संतुलन पर धारामापी में से कोई धारा नहीं बहती, अतः न सेल का आंतरिक प्रतिरोध और न जोड़ने वाले तारों का प्रतिरोध उत्तर में आता है। (9 अनुपात उलटा लगाता है, और 2.4 बचे 60 के बजाय 100 से भाग दे देता है।)",
        mr: "तोलावर ब्रिज R/S = l/(100 − l) देतो, म्हणून R = 6 × 40/60 = 4 Ω. मूल्य एका लांबीवरून वाचले जाते, आणि हाच उपकरणाचा गाभा: तोलावर गॅल्व्हॅनोमीटरमधून कोणतीही धारा वाहत नाही, म्हणून ना घटाचा अंतर्गत रोध ना जोडणाऱ्या तारांचा रोध उत्तरात येतो. (9 गुणोत्तर उलटे लावते, आणि 2.4 उरलेल्या 60 ऐवजी 100 ने भागते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A cell of e.m.f. 6 V and internal resistance 1 Ω is connected to a variable external resistance. What is the greatest power, in watts, that can be delivered to the external resistance?",
        hi: "6 V विद्युत वाहक बल और 1 Ω आंतरिक प्रतिरोध वाला सेल एक परिवर्ती बाहरी प्रतिरोध से जोड़ा जाता है। बाहरी प्रतिरोध को दी जा सकने वाली अधिकतम शक्ति, वाट में, क्या है?",
        mr: "6 V विद्युतचालक बल आणि 1 Ω अंतर्गत रोध असलेला घट एका बदलत्या बाह्य रोधाला जोडला जातो. बाह्य रोधाला देता येणारी सर्वाधिक शक्ती, वॉटमध्ये, किती?",
      },
      answer: 9,
      wrong: [36, 18, 4.5],
      checkExpr: "36/4",
      solution: {
        en: "The power in the external resistance is P = ε²R/(R + r)², and differentiating shows it peaks when R = r. Putting R = 1 Ω gives I = 6/2 = 3 A and P = I²R = 9 W, which is ε²/4r = 36/4 = 9 W. Two limits explain why a maximum has to exist somewhere in between: with R = 0 the current is largest but there is no external resistance for it to deliver power to, and with R very large the resistance is there but the current has been throttled to nothing. Note also that at the peak exactly half the total power is wasted inside the cell, so maximum power and maximum efficiency are different targets and a power station is designed for the second, not the first. (36 uses ε²/r, forgetting that the internal resistance takes its share.)",
        hi: "बाहरी प्रतिरोध में शक्ति P = ε²R/(R + r)² है, और अवकलन दिखाता है कि वह R = r पर शिखर पर होती है। R = 1 Ω रखने पर I = 6/2 = 3 A और P = I²R = 9 W, जो ε²/4r = 36/4 = 9 W है। दो सीमाएँ बताती हैं कि अधिकतम बीच में कहीं होना ही चाहिए: R = 0 पर धारा सबसे बड़ी है पर शक्ति देने को कोई बाहरी प्रतिरोध ही नहीं, और R बहुत बड़ा होने पर प्रतिरोध तो है पर धारा का गला घुट चुका है। यह भी ध्यान दो कि शिखर पर ठीक आधी कुल शक्ति सेल के भीतर बरबाद होती है, अतः अधिकतम शक्ति और अधिकतम दक्षता भिन्न लक्ष्य हैं और बिजलीघर दूसरे के लिए बनाया जाता है, पहले के लिए नहीं। (36 ε²/r लगाता है, यह भूलकर कि आंतरिक प्रतिरोध अपना हिस्सा लेता है।)",
        mr: "बाह्य रोधातील शक्ती P = ε²R/(R + r)² आहे, आणि अवकलन दाखवते की ती R = r वर शिखरावर असते. R = 1 Ω ठेवल्यास I = 6/2 = 3 A आणि P = I²R = 9 W, जे ε²/4r = 36/4 = 9 W आहे. दोन मर्यादा सांगतात की कमाल मध्येच कुठेतरी असलेच पाहिजे: R = 0 वर धारा सर्वांत मोठी पण शक्ती द्यायला बाह्य रोधच नाही, आणि R फार मोठा असताना रोध तर आहे पण धारेचा गळा दाबला गेला आहे. हेही लक्षात घ्या की शिखरावर नेमकी निम्मी एकूण शक्ती घटाच्या आत वाया जाते, म्हणून कमाल शक्ती आणि कमाल कार्यक्षमता ही वेगळी उद्दिष्टे आहेत आणि वीजकेंद्र दुसऱ्यासाठी बांधले जाते, पहिल्यासाठी नाही. (36 हे ε²/r लावते, अंतर्गत रोध आपला वाटा घेतो हे विसरून.)",
      },
    },
  ],
  "physics-12-moving-charges-and-magnetism": [
    {
      level: 1,
      stem: {
        en: "A charge of 2 C moves at 5 m/s at right angles to a uniform magnetic field of 3 T. What force acts on it?",
        hi: "2 C का आवेश 3 T के एकसमान चुंबकीय क्षेत्र के समकोण पर 5 m/s से चलता है। उस पर कितना बल लगता है?",
        mr: "2 C चा प्रभार 3 T च्या एकसमान चुंबकीय क्षेत्राला काटकोनात 5 m/s ने हलतो. त्यावर किती बल लागते?",
      },
      answer: 30,
      wrong: [10, 15, 0.3],
      checkExpr: "2*5*3",
      fmt: newtons,
      solution: {
        en: "F = qvB sin θ, and at right angles sin θ = 1, so F = 2 × 5 × 3 = 30 N. The sine factor is the whole content of the direction condition: a charge moving ALONG the field feels nothing at all, however fast it goes. (10 and 15 each leave out one of the three factors.)",
        hi: "F = qvB sin θ, और समकोण पर sin θ = 1, अतः F = 2 × 5 × 3 = 30 N. ज्या-गुणक ही दिशा-शर्त का पूरा सार है: क्षेत्र के अनुदिश चलता आवेश कुछ भी अनुभव नहीं करता, चाहे कितना भी तेज़ जाए। (10 और 15 तीनों में से एक-एक गुणक छोड़ देते हैं।)",
        mr: "F = qvB sin θ, आणि काटकोनात sin θ = 1, म्हणून F = 2 × 5 × 3 = 30 N. साइन-गुणक हाच दिशा-अटीचा अख्खा आशय: क्षेत्राच्या दिशेने जाणाऱ्या प्रभाराला काहीच जाणवत नाही, तो कितीही वेगाने गेला तरी. (10 आणि 15 तिन्हींपैकी एकेक गुणक गाळतात.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A straight wire 0.5 m long carries a current of 4 A and lies at right angles to a uniform field of 2 T. What force acts on the wire?",
        hi: "0.5 m लंबा सीधा तार 4 A धारा ले जाता है और 2 T के एकसमान क्षेत्र के समकोण पर रखा है। तार पर कितना बल लगता है?",
        mr: "0.5 m लांब सरळ तार 4 A धारा वाहते आणि 2 T च्या एकसमान क्षेत्राला काटकोनात ठेवलेली आहे. तारेवर किती बल लागते?",
      },
      answer: 4,
      wrong: [16, 2, 8],
      checkExpr: "4*0.5*2",
      fmt: newtons,
      solution: {
        en: "F = BIL sin θ = 2 × 4 × 0.5 = 4 N with the wire perpendicular to the field. This is the same Lorentz force written for a whole wire rather than one charge: the current is just qv summed over all the carriers in it, which is why a motor and a deflected electron beam are the same physics. (16 multiplies by the length instead of by half of it, and 8 drops the 0.5 altogether.)",
        hi: "तार के क्षेत्र के लंबवत होने पर F = BIL sin θ = 2 × 4 × 0.5 = 4 N. यह वही लॉरेंज़ बल है जो एक आवेश के बजाय पूरे तार के लिए लिखा गया: धारा उसमें के सभी वाहकों पर जोड़ा गया qv ही है, इसीलिए मोटर और विक्षेपित इलेक्ट्रॉन किरणपुंज एक ही भौतिकी हैं। (16 आधी लंबाई के बजाय लंबाई से गुणा कर देता है, और 8 0.5 को छोड़ ही देता है।)",
        mr: "तार क्षेत्राला लंब असल्याने F = BIL sin θ = 2 × 4 × 0.5 = 4 N. हेच ते लॉरेन्ट्झ बल जे एका प्रभाराऐवजी अख्ख्या तारेसाठी लिहिलेले: धारा म्हणजे तिच्यातील सर्व वाहकांवर बेरीज केलेले qv च, म्हणूनच मोटर आणि विचलित इलेक्ट्रॉन शलाका एकच भौतिकी आहेत. (16 निम्म्या लांबीऐवजी लांबीने गुणते, आणि 8 हे 0.5 गाळूनच टाकते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The magnetic field 4 cm from a long straight current-carrying wire is 6 μT. What is the field, in μT, at a distance of 12 cm from the same wire?",
        hi: "धारा ले जाते लंबे सीधे तार से 4 cm दूर चुंबकीय क्षेत्र 6 μT है। उसी तार से 12 cm की दूरी पर क्षेत्र, μT में, क्या है?",
        mr: "धारा वाहणाऱ्या लांब सरळ तारेपासून 4 cm दूर चुंबकीय क्षेत्र 6 μT आहे. त्याच तारेपासून 12 cm अंतरावर क्षेत्र, μT मध्ये, किती?",
      },
      answer: 2,
      wrong: [18, 3, 0.67],
      checkExpr: "6*4/12",
      solution: {
        en: "For a long straight wire B = μ₀I/2πr, so the field falls as 1/r and not as 1/r²: tripling the distance divides the field by 3, giving 6 × 4/12 = 2 μT. The inverse FIRST power is a genuine difference from the point-charge case, and it comes from the wire being infinitely long — the far parts of it partly compensate for the extra distance. (0.67 uses an inverse square, and 18 multiplies where it should divide.)",
        hi: "लंबे सीधे तार के लिए B = μ₀I/2πr, अतः क्षेत्र 1/r से घटता है, 1/r² से नहीं: दूरी तिगुनी करने पर क्षेत्र 3 से भाग जाता है, जिससे 6 × 4/12 = 2 μT. व्युत्क्रम पहली घात बिंदु-आवेश की स्थिति से असली अंतर है, और वह तार के अनंत लंबे होने से आता है — उसके दूर वाले भाग अतिरिक्त दूरी की आंशिक भरपाई कर देते हैं। (0.67 व्युत्क्रम वर्ग लगाता है, और 18 वहाँ गुणा करता है जहाँ भाग देना था।)",
        mr: "लांब सरळ तारेसाठी B = μ₀I/2πr, म्हणून क्षेत्र 1/r ने घटते, 1/r² ने नाही: अंतर तिप्पट केल्यास क्षेत्र 3 ने भागले जाते, ज्यातून 6 × 4/12 = 2 μT. व्यस्त पहिली घात हा बिंदु-प्रभाराच्या स्थितीहून खरा फरक आहे, आणि तो तार अनंत लांब असल्याने येतो — तिचे दूरचे भाग जादा अंतराची अंशतः भरपाई करतात. (0.67 व्यस्त वर्ग लावते, आणि 18 जिथे भागायचे तिथे गुणते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A circular coil of 100 turns produces a field of 2 mT at its centre. Keeping the current and the radius unchanged, how many turns would be needed to produce 5 mT?",
        hi: "100 फेरों की वृत्तीय कुंडली अपने केंद्र पर 2 mT का क्षेत्र देती है। धारा और त्रिज्या अपरिवर्तित रखते हुए 5 mT देने के लिए कितने फेरे चाहिए?",
        mr: "100 वेढ्यांचे वर्तुळाकार वेटोळे आपल्या केंद्रावर 2 mT चे क्षेत्र देते. धारा आणि त्रिज्या अपरिवर्तित ठेवून 5 mT देण्यासाठी किती वेढे लागतील?",
      },
      answer: 250,
      wrong: [40, 200, 500],
      checkExpr: "100*5/2",
      solution: {
        en: "The field at the centre of a coil is B = μ₀NI/2r, which is directly proportional to N, so N₂ = 100 × 5/2 = 250 turns. Every turn adds its own contribution and they all point the same way at the centre, which is the whole reason for winding a coil rather than bending a single loop. (40 inverts the ratio; 200 doubles instead of multiplying by two and a half.)",
        hi: "कुंडली के केंद्र पर क्षेत्र B = μ₀NI/2r है, जो N का अनुक्रमानुपाती है, अतः N₂ = 100 × 5/2 = 250 फेरे। हर फेरा अपना अंश जोड़ता है और वे सब केंद्र पर एक ही ओर हैं, और कुंडली लपेटने का, अकेला लूप मोड़ने का नहीं, पूरा कारण यही है। (40 अनुपात उलट देता है; 200 ढाई गुना करने के बजाय दुगुना कर देता है।)",
        mr: "वेटोळ्याच्या केंद्रावरचे क्षेत्र B = μ₀NI/2r आहे, जे N शी सरळ समानुपाती आहे, म्हणून N₂ = 100 × 5/2 = 250 वेढे. प्रत्येक वेढा आपला वाटा जोडतो आणि ते सर्व केंद्रावर एकाच दिशेने आहेत, आणि वेटोळे गुंडाळण्याचे, एकच वळसा वाकवण्याचे नव्हे, अख्खे कारण हेच आहे. (40 गुणोत्तर उलटवते; 200 अडीचपट करण्याऐवजी दुप्पट करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A particle of charge 2 C and mass 4 kg enters a uniform field of 4 T at 6 m/s, at right angles to the field. What is the radius, in m, of its circular path?",
        hi: "2 C आवेश और 4 kg द्रव्यमान का कण 4 T के एकसमान क्षेत्र में उसके समकोण पर 6 m/s से प्रवेश करता है। उसके वृत्तीय पथ की त्रिज्या, m में, क्या है?",
        mr: "2 C प्रभार आणि 4 kg वस्तुमानाचा कण 4 T च्या एकसमान क्षेत्रात त्याला काटकोनात 6 m/s ने प्रवेश करतो. त्याच्या वर्तुळाकार मार्गाची त्रिज्या, m मध्ये, किती?",
      },
      answer: 3,
      wrong: [2, 6, 1.5],
      checkExpr: "4*6/(2*4)",
      solution: {
        en: "The magnetic force supplies the centripetal force, so qvB = mv²/r and r = mv/qB = (4 × 6)/(2 × 4) = 24/8 = 3 m. One v cancels between the two sides, which is why the radius is proportional to the speed and not to its square — a particle twice as fast simply traces a circle twice as large in the same period. (6 leaves the charge out of the denominator.)",
        hi: "चुंबकीय बल अभिकेंद्र बल देता है, अतः qvB = mv²/r और r = mv/qB = (4 × 6)/(2 × 4) = 24/8 = 3 m. दोनों ओर से एक v कट जाता है, इसीलिए त्रिज्या चाल की समानुपाती है, उसके वर्ग की नहीं — दुगुना तेज़ कण उतने ही आवर्तकाल में बस दुगुना बड़ा वृत्त खींचता है। (6 हर में आवेश को छोड़ देता है।)",
        mr: "चुंबकीय बल अभिकेंद्री बल पुरवते, म्हणून qvB = mv²/r आणि r = mv/qB = (4 × 6)/(2 × 4) = 24/8 = 3 m. दोन्ही बाजूंतून एक v कापला जातो, म्हणूनच त्रिज्या वेगाशी समानुपाती आहे, त्याच्या वर्गाशी नाही — दुप्पट वेगवान कण तितक्याच आवर्तकाळात फक्त दुप्पट मोठे वर्तुळ काढतो. (6 छेदात प्रभार गाळते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A rectangular coil of 50 turns and area 0.02 m² carries a current of 3 A in a uniform field of 0.4 T, with the plane of the coil parallel to the field. What torque, in N m, acts on it?",
        hi: "50 फेरों और 0.02 m² क्षेत्रफल की आयताकार कुंडली 0.4 T के एकसमान क्षेत्र में 3 A धारा ले जाती है, और कुंडली का तल क्षेत्र के समांतर है। उस पर कितना बल-आघूर्ण, N m में, लगता है?",
        mr: "50 वेढे आणि 0.02 m² क्षेत्रफळाचे आयताकृती वेटोळे 0.4 T च्या एकसमान क्षेत्रात 3 A धारा वाहते, आणि वेटोळ्याचे प्रतल क्षेत्राला समांतर आहे. त्यावर किती बलआघूर्ण, N m मध्ये, लागते?",
      },
      answer: 1.2,
      wrong: [0.6, 12, 2.4],
      checkExpr: "50*3*0.02*0.4",
      solution: {
        en: "τ = NIAB when the plane of the coil contains the field, so τ = 50 × 3 × 0.02 × 0.4 = 1.2 N m. This orientation gives the maximum torque, and the torque falls to zero when the plane is perpendicular to the field instead — which is exactly the position the coil turns towards and then overshoots, and the reason a practical motor needs a commutator to keep pushing it round. (0.6 halves as though this were an energy; 2.4 doubles.)",
        hi: "जब कुंडली का तल क्षेत्र को समेटे हो तब τ = NIAB, अतः τ = 50 × 3 × 0.02 × 0.4 = 1.2 N m. यही अभिविन्यास अधिकतम बल-आघूर्ण देता है, और जब तल क्षेत्र के लंबवत हो जाए तब बल-आघूर्ण शून्य हो जाता है — ठीक वही स्थिति जिसकी ओर कुंडली घूमती है और फिर उससे आगे निकल जाती है, और यही कारण है कि व्यावहारिक मोटर को उसे घुमाते रहने के लिए दिक्परिवर्तक चाहिए। (0.6 ऐसे आधा कर देता है मानो यह ऊर्जा हो; 2.4 दुगुना कर देता है।)",
        mr: "जेव्हा वेटोळ्याचे प्रतल क्षेत्राला सामावते तेव्हा τ = NIAB, म्हणून τ = 50 × 3 × 0.02 × 0.4 = 1.2 N m. हीच मांडणी कमाल बलआघूर्ण देते, आणि प्रतल क्षेत्राला लंब झाल्यावर बलआघूर्ण शून्य होते — नेमकी तीच स्थिती जिच्याकडे वेटोळे फिरते आणि मग तिच्या पुढे निघून जाते, आणि म्हणूनच व्यावहारिक मोटरला त्याला फिरवत ठेवण्यासाठी दिक्परिवर्तक लागतो. (0.6 असे निम्मे करते जणू ही ऊर्जा असावी; 2.4 दुप्पट करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A solenoid is wound with 500 turns spread over a length of 0.25 m. How many turns per metre does it have?",
        hi: "एक परिनालिका पर 0.25 m लंबाई में फैले 500 फेरे लपेटे गए हैं। उसमें प्रति मीटर कितने फेरे हैं?",
        mr: "एका सोलेनॉइडवर 0.25 m लांबीत पसरलेले 500 वेढे गुंडाळले आहेत. त्यात प्रति मीटर किती वेढे आहेत?",
      },
      answer: 2000,
      wrong: [125, 1000, 250],
      checkExpr: "500/0.25",
      solution: {
        en: "n = N/L = 500/0.25 = 2000 turns per metre. The interior field B = μ₀nI depends on this figure and not on the total number of turns, so the same 500 turns crammed into half the length would double the field without a millimetre of extra wire. (125 multiplies by 0.25 instead of dividing, and 1000 divides by 0.5.)",
        hi: "n = N/L = 500/0.25 = 2000 फेरे प्रति मीटर। भीतर का क्षेत्र B = μ₀nI इसी संख्या पर निर्भर है, कुल फेरों पर नहीं, अतः वही 500 फेरे आधी लंबाई में ठूँसने पर क्षेत्र दुगुना हो जाता, एक मिलीमीटर अतिरिक्त तार के बिना। (125 भाग देने के बजाय 0.25 से गुणा कर देता है, और 1000 0.5 से भाग दे देता है।)",
        mr: "n = N/L = 500/0.25 = 2000 वेढे प्रति मीटर. आतले क्षेत्र B = μ₀nI याच आकड्यावर अवलंबून आहे, एकूण वेढ्यांवर नाही, म्हणून तेच 500 वेढे निम्म्या लांबीत कोंबल्यास क्षेत्र दुप्पट झाले असते, एक मिलीमीटर जादा तारेविना. (125 भागण्याऐवजी 0.25 ने गुणते, आणि 1000 हे 0.5 ने भागते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In a velocity selector the electric field is 6 × 10⁴ V/m and the magnetic field is 0.2 T, arranged so that the two forces oppose. What speed, in m/s, passes through undeflected?",
        hi: "एक वेग वरणकारी में विद्युत क्षेत्र 6 × 10⁴ V/m और चुंबकीय क्षेत्र 0.2 T है, और वे इस तरह रखे हैं कि दोनों बल विरोध करें। कौन-सी चाल, m/s में, बिना विक्षेप के पार होती है?",
        mr: "एका वेग निवडकात विद्युत क्षेत्र 6 × 10⁴ V/m आणि चुंबकीय क्षेत्र 0.2 T आहे, आणि ती अशी मांडली आहेत की दोन्ही बले विरोध करतील. कोणता वेग, m/s मध्ये, विचलनाविना पार होतो?",
      },
      answer: 300000,
      wrong: [12000, 30000, 3000000],
      checkExpr: "600000/2",
      solution: {
        en: "Undeflected means the two forces balance: qE = qvB, so the charge cancels and v = E/B = 60000/0.2 = 600000/2 = 300000 m/s. That the charge cancels is the whole value of the device — it selects by SPEED alone, letting through electrons, protons and ions of any charge or mass provided they travel at this one speed, which is why it is the front end of a mass spectrometer. (12000 multiplies E by B instead of dividing.)",
        hi: "बिना विक्षेप का अर्थ है दोनों बल संतुलित हैं: qE = qvB, अतः आवेश कट जाता है और v = E/B = 60000/0.2 = 600000/2 = 300000 m/s. आवेश का कट जाना ही युक्ति का पूरा मूल्य है — वह केवल चाल से छाँटती है, और इलेक्ट्रॉन, प्रोटॉन तथा किसी भी आवेश या द्रव्यमान के आयन को गुज़रने देती है बशर्ते वे इसी एक चाल से चलें, इसीलिए वह द्रव्यमान स्पेक्ट्रोमापी का अगला सिरा है। (12000 E को B से भाग देने के बजाय गुणा कर देता है।)",
        mr: "विचलनाविना म्हणजे दोन्ही बले तोलली आहेत: qE = qvB, म्हणून प्रभार कापला जातो आणि v = E/B = 60000/0.2 = 600000/2 = 300000 m/s. प्रभार कापला जाणे हेच साधनाचे अख्खे मूल्य — ते केवळ वेगानेच निवडते, आणि इलेक्ट्रॉन, प्रोटॉन तसेच कोणत्याही प्रभाराचे वा वस्तुमानाचे आयन जाऊ देते जर ते याच एका वेगाने जात असतील, म्हणूनच ते वस्तुमान वर्णपटमापीचे पुढचे टोक आहे. (12000 हे E ला B ने भागण्याऐवजी गुणते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A galvanometer of resistance 99 Ω gives a full-scale deflection at 10 mA. What shunt resistance, in Ω, must be placed in parallel with it so that it reads 1 A at full scale?",
        hi: "99 Ω प्रतिरोध का धारामापी 10 mA पर पूरा विक्षेप देता है। उसके समांतर कितना शंट प्रतिरोध, Ω में, लगाया जाए ताकि वह पूर्ण विक्षेप पर 1 A पढ़े?",
        mr: "99 Ω रोधाचा गॅल्व्हॅनोमीटर 10 mA वर पूर्ण विचलन देतो. त्याच्या समांतर किती शंट रोध, Ω मध्ये, लावावा जेणेकरून तो पूर्ण विचलनावर 1 A वाचेल?",
      },
      answer: 1,
      wrong: [9.9, 0.99, 100],
      checkExpr: "99*0.01/0.99",
      solution: {
        en: "The shunt and the coil are in parallel, so they share the same voltage: I_g G = (I − I_g)S. Hence S = 99 × 0.01/0.99 = 1 Ω. The coil then carries its safe 10 mA and the shunt carries the remaining 990 mA. Note the effect on the finished instrument: 99 Ω in parallel with 1 Ω is about 0.99 Ω, so the ammeter has a low resistance, which is exactly what a component wired IN SERIES with a circuit must have if it is not to change the current it was built to measure. (9.9 divides by the full current instead of by the part that bypasses the coil.)",
        hi: "शंट और कुंडली समांतर में हैं, अतः वे एक ही वोल्टता साझा करते हैं: I_g G = (I − I_g)S. इसलिए S = 99 × 0.01/0.99 = 1 Ω. तब कुंडली अपने सुरक्षित 10 mA ले जाती है और शंट बचे 990 mA. तैयार यंत्र पर असर देखो: 99 Ω के समांतर 1 Ω लगभग 0.99 Ω है, अतः अमीटर का प्रतिरोध कम है, और परिपथ के श्रेणी में जुड़ने वाले पुर्ज़े का ठीक यही होना चाहिए यदि वह उसी धारा को न बदले जिसे नापने के लिए वह बना है। (9.9 कुंडली को बग़ल से निकलने वाले भाग के बजाय पूरी धारा से भाग दे देता है।)",
        mr: "शंट आणि वेटोळे समांतरात आहेत, म्हणून ते एकच व्होल्टेज वाटून घेतात: I_g G = (I − I_g)S. म्हणून S = 99 × 0.01/0.99 = 1 Ω. तेव्हा वेटोळे आपले सुरक्षित 10 mA वाहते आणि शंट उरलेले 990 mA. तयार उपकरणावरचा परिणाम पाहा: 99 Ω च्या समांतर 1 Ω म्हणजे सुमारे 0.99 Ω, म्हणून अ‍ॅमीटरचा रोध कमी आहे, आणि परिपथाच्या श्रेणीत जोडल्या जाणाऱ्या घटकाचे नेमके हेच असावे जर त्याने ती धारा बदलू नये जिला मोजण्यासाठी तो बनवला आहे. (9.9 वेटोळ्याच्या बाजूने जाणाऱ्या भागाऐवजी अख्ख्या धारेने भागते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "The same galvanometer — 99 Ω, full-scale deflection at 10 mA — is to be converted into a voltmeter reading 10 V at full scale. What resistance, in Ω, must be connected in series with it?",
        hi: "वही धारामापी — 99 Ω, 10 mA पर पूरा विक्षेप — पूर्ण विक्षेप पर 10 V पढ़ने वाला वोल्टमापी बनाया जाना है। उसके श्रेणी में कितना प्रतिरोध, Ω में, जोड़ा जाए?",
        mr: "तोच गॅल्व्हॅनोमीटर — 99 Ω, 10 mA वर पूर्ण विचलन — पूर्ण विचलनावर 10 V वाचणारा व्होल्टमापक बनवायचा आहे. त्याच्या श्रेणीत किती रोध, Ω मध्ये, जोडावा?",
      },
      answer: 901,
      wrong: [1000, 99, 1099],
      checkExpr: "10/0.01-99",
      solution: {
        en: "In series the same current flows through both, so I_g(G + R) = V and R = V/I_g − G = 10/0.01 − 99 = 1000 − 99 = 901 Ω. Subtracting the coil's own 99 Ω is the step most often skipped, and it matters at every scale: the total resistance must come to 1000 Ω, and the coil already supplies part of it. Compare this with the ammeter conversion of the previous question and the pattern is clear — the SAME movement becomes two different instruments, low-resistance with a parallel shunt for a series connection, high-resistance with a series multiplier for a parallel connection. The connection decides the requirement, and the requirement decides where the resistor goes. (1000 forgets to subtract G, and 1099 adds it instead.)",
        hi: "श्रेणी में दोनों में से वही धारा बहती है, अतः I_g(G + R) = V और R = V/I_g − G = 10/0.01 − 99 = 1000 − 99 = 901 Ω. कुंडली के अपने 99 Ω घटाना वही चरण है जो सबसे अधिक छोड़ा जाता है, और वह हर पैमाने पर मायने रखता है: कुल प्रतिरोध 1000 Ω बनना चाहिए, और कुंडली उसका एक हिस्सा पहले ही दे रही है। इसकी पिछले प्रश्न के अमीटर रूपांतरण से तुलना करो और ढर्रा साफ़ है — वही गतिका दो भिन्न यंत्र बनती है, श्रेणी संयोजन के लिए समांतर शंट के साथ कम प्रतिरोध, समांतर संयोजन के लिए श्रेणी गुणक के साथ ऊँचा प्रतिरोध। संयोजन माँग तय करता है, और माँग तय करती है कि प्रतिरोधक कहाँ जाए। (1000 G घटाना भूल जाता है, और 1099 उसे जोड़ देता है।)",
        mr: "श्रेणीत दोन्हींतून तीच धारा वाहते, म्हणून I_g(G + R) = V आणि R = V/I_g − G = 10/0.01 − 99 = 1000 − 99 = 901 Ω. वेटोळ्याचे स्वतःचे 99 Ω वजा करणे हीच ती पायरी जी सर्वांत जास्त गाळली जाते, आणि ती प्रत्येक मापावर महत्त्वाची आहे: एकूण रोध 1000 Ω बनला पाहिजे, आणि वेटोळे त्याचा एक भाग आधीच पुरवत आहे. याची मागच्या प्रश्नातील अ‍ॅमीटर रूपांतरणाशी तुलना करा आणि आकृतिबंध स्पष्ट आहे — तीच हालचाल दोन वेगळी उपकरणे बनते, श्रेणी जोडणीसाठी समांतर शंटसह कमी रोध, समांतर जोडणीसाठी श्रेणी गुणकासह उंच रोध. जोडणी मागणी ठरवते, आणि मागणी ठरवते की रोधक कुठे जावा. (1000 हे G वजा करणे विसरते, आणि 1099 ते जोडते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Two long parallel wires 0.5 m apart carry currents of 10 A and 20 A in the same direction. What is the force per metre between them, in μN/m? Take μ₀/2π = 0.2 μN/A².",
        hi: "0.5 m की दूरी पर दो लंबे समांतर तार एक ही दिशा में 10 A और 20 A धाराएँ ले जाते हैं। उनके बीच प्रति मीटर बल, μN/m में, क्या है? μ₀/2π = 0.2 μN/A² लो।",
        mr: "0.5 m अंतरावरील दोन लांब समांतर तारा एकाच दिशेने 10 A आणि 20 A धारा वाहतात. त्यांच्यातले प्रति मीटर बल, μN/m मध्ये, किती? μ₀/2π = 0.2 μN/A² घ्या.",
      },
      answer: 80,
      wrong: [40, 400, 8],
      checkExpr: "0.2*10*20/0.5",
      solution: {
        en: "F/L = (μ₀/2π)I₁I₂/r = 0.2 × 10 × 20/0.5 = 80 μN/m, and it is an ATTRACTION because the currents run the same way. The mechanism is worth stating in two steps rather than one: the first wire sets up a field at the second, and the second then feels BIL in that field — there is no direct wire-to-wire law, only the field standing between them. This is also the arrangement that once defined the ampere, and defining a base unit through a force is what tied electrical measurement to mechanical measurement before the modern fixed-constant definitions replaced it. (40 leaves out one factor of the separation; 400 forgets the constant.)",
        hi: "F/L = (μ₀/2π)I₁I₂/r = 0.2 × 10 × 20/0.5 = 80 μN/m, और यह आकर्षण है क्योंकि धाराएँ एक ही ओर बहती हैं। क्रियाविधि एक के बजाय दो चरणों में कहनी चाहिए: पहला तार दूसरे पर क्षेत्र खड़ा करता है, और दूसरा फिर उस क्षेत्र में BIL अनुभव करता है — तार-से-तार का कोई सीधा नियम है ही नहीं, केवल उनके बीच खड़ा क्षेत्र है। यही वह व्यवस्था भी है जो कभी ऐम्पियर को परिभाषित करती थी, और किसी मूल मात्रक को बल के माध्यम से परिभाषित करना ही वह था जिसने आधुनिक नियत-स्थिरांक परिभाषाओं के आने से पहले विद्युत माप को यांत्रिक माप से बाँधा। (40 दूरी का एक गुणक छोड़ देता है; 400 स्थिरांक भूल जाता है।)",
        mr: "F/L = (μ₀/2π)I₁I₂/r = 0.2 × 10 × 20/0.5 = 80 μN/m, आणि हे आकर्षण आहे कारण धारा एकाच दिशेने वाहतात. यंत्रणा एकाऐवजी दोन पायऱ्यांत सांगण्याजोगी आहे: पहिली तार दुसरीवर क्षेत्र उभे करते, आणि दुसरी मग त्या क्षेत्रात BIL अनुभवते — तार-ते-तार असा थेट नियम आहेच नाही, केवळ त्यांच्यामध्ये उभे असलेले क्षेत्र आहे. हीच ती मांडणी जी एकेकाळी अँपिअरची व्याख्या करत होती, आणि एखाद्या मूलभूत एककाची व्याख्या बलामार्गे करणे हेच ते ज्याने आधुनिक स्थिर-स्थिरांक व्याख्या येण्याआधी विद्युत मापनाला यांत्रिक मापनाशी बांधले. (40 अंतराचा एक गुणक गाळते; 400 स्थिरांक विसरते.)",
      },
    },
  ],
};
