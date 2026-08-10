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
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Magnetism and Matter                                        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-magnetism-and-matter",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 5 — Magnetism and Matter",
      hi: "अध्याय 5 — चुंबकत्व एवं द्रव्य",
      mr: "प्रकरण 5 — चुंबकत्व आणि द्रव्य",
    },
    name: {
      en: "Magnetism and Matter",
      hi: "चुंबकत्व एवं द्रव्य",
      mr: "चुंबकत्व आणि द्रव्य",
    },
    summary: {
      en: "A field whose lines never begin or end anywhere, so that no closed surface can ever have a net outward flux and no isolated pole has ever been found; a bar magnet which turns out on inspection to be a coil of circulating charge rather than a thing with two ends; a planet whose own field is described by a direction, a tilt and a strength that none of the three can be got from either of the others; and three ways matter can answer a field it is put into — feebly against it, feebly with it, or overwhelmingly with it and then remembering afterwards what it was asked to do.",
      hi: "ऐसा क्षेत्र जिसकी रेखाएँ कहीं शुरू या ख़त्म होती ही नहीं, अतः किसी बंद पृष्ठ से नेट बाहरगामी फ्लक्स कभी नहीं हो सकता और अलग-थलग ध्रुव आज तक मिला नहीं; वह छड़ चुंबक जो जाँचने पर दो सिरों वाली वस्तु के बजाय परिक्रमा करते आवेश की कुंडली निकलती है; वह ग्रह जिसका अपना क्षेत्र एक दिशा, एक झुकाव और एक प्रबलता से बताया जाता है और तीनों में से कोई भी दूसरे दो से नहीं निकाला जा सकता; और तीन तरीक़े जिनसे द्रव्य उस क्षेत्र को उत्तर दे सकता है जिसमें उसे रखा गया — कमज़ोर होकर उसके विरुद्ध, कमज़ोर होकर उसके साथ, या अत्यधिक बल से उसके साथ और फिर बाद में यह याद रखते हुए कि उससे क्या करने को कहा गया था।",
      mr: "असे क्षेत्र ज्याच्या रेषा कुठेही सुरू वा संपतच नाहीत, म्हणून कोणत्याही बंद पृष्ठातून निव्वळ बहिर्गामी फ्लक्स कधीच असू शकत नाही आणि एकाकी ध्रुव आजवर सापडलेला नाही; तो दांडा चुंबक जो तपासल्यावर दोन टोके असलेली वस्तू नसून फिरणाऱ्या प्रभाराचे वेटोळे निघतो; तो ग्रह ज्याचे स्वतःचे क्षेत्र एक दिशा, एक कल आणि एक तीव्रता यांनी वर्णिले जाते आणि तिन्हींपैकी कोणतेही उरलेल्या दोहोंतून काढता येत नाही; आणि तीन मार्ग ज्यांनी द्रव्य त्या क्षेत्राला उत्तर देऊ शकते ज्यात त्याला ठेवले गेले — क्षीणपणे त्याच्याविरुद्ध, क्षीणपणे त्याच्यासोबत, वा प्रचंड जोराने त्याच्यासोबत आणि मग नंतर हे लक्षात ठेवत की त्याला काय करायला सांगितले होते.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "gauss-law-for-magnetism",
        name: {
          en: "Gauss's law for magnetism",
          hi: "चुंबकत्व के लिए गाउस का नियम",
          mr: "चुंबकत्वासाठी गॉसचा नियम",
        },
        kind: "general fact about magnetism",
        prompt: {
          en: "Draw any closed surface anywhere, around anything, and the total outward magnetic flux through it is zero — every line that enters has to leave. Which law states this?",
          hi: "कहीं भी, किसी भी चीज़ के चारों ओर, कोई भी बंद पृष्ठ खींचो और उससे कुल बाहरगामी चुंबकीय फ्लक्स शून्य होता है — जो रेखा भीतर आती है उसे निकलना ही पड़ता है। यह कौन-सा नियम कहता है?",
          mr: "कुठेही, कशाच्याही भोवती, कोणतेही बंद पृष्ठ काढा आणि त्यातून जाणारा एकूण बहिर्गामी चुंबकीय फ्लक्स शून्य असतो — जी रेषा आत येते तिला बाहेर पडावेच लागते. हा कोणता नियम सांगतो?",
        },
        statement: {
          en: "Gauss's law for magnetism says the net magnetic flux through any closed surface is exactly zero, which is the formal statement that isolated magnetic poles do not exist.",
          hi: "चुंबकत्व के लिए गाउस का नियम कहता है कि किसी भी बंद पृष्ठ से नेट चुंबकीय फ्लक्स ठीक शून्य है, जो इस बात का औपचारिक कथन है कि अलग-थलग चुंबकीय ध्रुव होते ही नहीं।",
          mr: "चुंबकत्वासाठी गॉसचा नियम सांगतो की कोणत्याही बंद पृष्ठातून जाणारा निव्वळ चुंबकीय फ्लक्स नेमका शून्य आहे, जे एकाकी चुंबकीय ध्रुव अस्तित्वातच नाहीत याचे औपचारिक विधान आहे.",
        },
        detail: {
          en: "It is the exact counterpart of the electrostatic Gauss's law with the right-hand side replaced by nothing, and that missing term is the whole difference between electricity and magnetism.",
          hi: "यह स्थिरवैद्युत गाउस नियम का ठीक समकक्ष है जिसमें दाएँ पक्ष की जगह कुछ भी नहीं है, और वही लुप्त पद विद्युत और चुंबकत्व के बीच का पूरा अंतर है।",
          mr: "हा स्थिरविद्युत गॉस नियमाचा नेमका समकक्ष आहे ज्यात उजव्या बाजूच्या जागी काहीही नाही, आणि तेच हरवलेले पद विद्युत आणि चुंबकत्व यांतला अख्खा फरक आहे.",
        },
        extra: {
          en: "The consequence for pictures is that magnetic field lines are always closed loops, continuing through the inside of a magnet from its south pole to its north — where electric lines would simply have stopped on a charge.",
          hi: "चित्रों के लिए परिणाम यह कि चुंबकीय क्षेत्र रेखाएँ सदा बंद लूप होती हैं, जो चुंबक के भीतर से होकर उसके दक्षिण ध्रुव से उत्तर ध्रुव तक चलती रहती हैं — जहाँ विद्युत रेखाएँ किसी आवेश पर बस रुक गई होतीं।",
          mr: "चित्रांसाठीचा परिणाम असा की चुंबकीय क्षेत्ररेषा नेहमी बंद वळसे असतात, ज्या चुंबकाच्या आतून त्याच्या दक्षिण ध्रुवापासून उत्तर ध्रुवापर्यंत चालत राहतात — जिथे विद्युत रेषा एखाद्या प्रभारावर नुसत्या थांबल्या असत्या.",
        },
        pair: {
          left: {
            en: "A right-hand side with nothing on it",
            hi: "ऐसा दायाँ पक्ष जिस पर कुछ भी नहीं",
            mr: "अशी उजवी बाजू जिच्यावर काहीच नाही",
          },
          right: {
            en: "Gauss's law for magnetism",
            hi: "चुंबकत्व के लिए गाउस का नियम",
            mr: "चुंबकत्वासाठी गॉसचा नियम",
          },
        },
      },
      {
        id: "bar-magnet-as-solenoid",
        name: {
          en: "The bar magnet as an equivalent solenoid",
          hi: "समतुल्य परिनालिका के रूप में छड़ चुंबक",
          mr: "समतुल्य सोलेनॉइड म्हणून दांडा चुंबक",
        },
        kind: "general fact about magnetism",
        prompt: {
          en: "Hold a current-carrying coil and a lump of magnetised iron behind a screen and no measurement outside can tell which is which — the field pattern, the torque in an external field and the far-away behaviour all match. Which identification is this?",
          hi: "पर्दे के पीछे धारा ले जाती कुंडली और चुंबकित लोहे का टुकड़ा रखो और बाहर का कोई माप नहीं बता सकता कि कौन क्या है — क्षेत्र का प्रतिरूप, बाहरी क्षेत्र में बल-आघूर्ण और दूर का आचरण, सब मिलते हैं। यह कौन-सी पहचान है?",
          mr: "पडद्यामागे धारा वाहणारे वेटोळे आणि चुंबकित लोखंडाचा तुकडा ठेवा आणि बाहेरचे कोणतेही माप सांगू शकत नाही की कोण काय आहे — क्षेत्राचा नमुना, बाह्य क्षेत्रातले बलआघूर्ण आणि दूरचे वर्तन, सर्व जुळतात. ही कोणती ओळख?",
        },
        statement: {
          en: "The bar magnet as an equivalent solenoid is the recognition that a magnet's field is produced by circulating charge inside it, so a magnet is a dipole with moment m and never a pair of separable poles.",
          hi: "समतुल्य परिनालिका के रूप में छड़ चुंबक यह पहचान है कि चुंबक का क्षेत्र उसके भीतर परिक्रमा करते आवेश से बनता है, अतः चुंबक m आघूर्ण वाला द्विध्रुव है, अलग किए जा सकने वाले ध्रुवों का युग्म कभी नहीं।",
          mr: "समतुल्य सोलेनॉइड म्हणून दांडा चुंबक ही ती ओळख की चुंबकाचे क्षेत्र त्याच्या आत फिरणाऱ्या प्रभारापासून बनते, म्हणून चुंबक हा m आघूर्ण असलेला द्विध्रुव आहे, वेगळे करता येणाऱ्या ध्रुवांची जोडी कधीच नाही.",
        },
        detail: {
          en: "The circulating charge is real and microscopic: each electron's orbital motion and its own spin are tiny current loops, and a magnet is what happens when enough of them line up.",
          hi: "परिक्रमा करता आवेश असली और सूक्ष्म है: हर इलेक्ट्रॉन की कक्षीय गति और उसका अपना चक्रण नन्हे धारा-लूप हैं, और चुंबक वही है जो तब होता है जब उनमें से पर्याप्त संरेखित हो जाएँ।",
          mr: "फिरणारा प्रभार खरा आणि सूक्ष्म आहे: प्रत्येक इलेक्ट्रॉनची कक्षीय गती आणि त्याचे स्वतःचे परिवलन ही चिमुकली धारा-वळसे आहेत, आणि चुंबक म्हणजे तेच जे पुरेसे संरेखित झाल्यावर घडते.",
        },
        extra: {
          en: "It is why cutting a magnet in two gives two complete magnets rather than a north and a south: cutting a solenoid in half gives two shorter solenoids, and there was never a pole to be separated off.",
          hi: "इसीलिए चुंबक को दो टुकड़ों में काटने से एक उत्तर और एक दक्षिण नहीं बल्कि दो पूरे चुंबक मिलते हैं: परिनालिका को बीच से काटने पर दो छोटी परिनालिकाएँ मिलती हैं, और अलग किए जाने को ध्रुव कभी था ही नहीं।",
          mr: "म्हणूनच चुंबकाचे दोन तुकडे केल्यावर एक उत्तर आणि एक दक्षिण न मिळता दोन पूर्ण चुंबक मिळतात: सोलेनॉइड मधून कापल्यास दोन लहान सोलेनॉइड मिळतात, आणि वेगळा करायला ध्रुव कधी होताच नाही.",
        },
        pair: {
          left: {
            en: "Behind a screen, no measurement can tell them apart",
            hi: "पर्दे के पीछे, कोई माप उनमें भेद नहीं कर सकता",
            mr: "पडद्यामागे, कोणतेही माप त्यांत भेद करू शकत नाही",
          },
          right: {
            en: "the bar magnet as an equivalent solenoid",
            hi: "समतुल्य परिनालिका के रूप में छड़ चुंबक",
            mr: "समतुल्य सोलेनॉइड म्हणून दांडा चुंबक",
          },
        },
      },
      {
        id: "earths-magnetic-elements",
        name: {
          en: "The Earth's magnetic elements",
          hi: "पृथ्वी के चुंबकीय अवयव",
          mr: "पृथ्वीचे चुंबकीय घटक",
        },
        kind: "general fact about magnetism",
        prompt: {
          en: "Three numbers are needed at any place before the local field is fully described: how far the compass points from true north, how far a freely suspended needle tips below the horizontal, and how strong the horizontal part is. What are these three called?",
          hi: "किसी भी जगह स्थानीय क्षेत्र पूरी तरह बताने से पहले तीन संख्याएँ चाहिए: दिक्सूचक सच्चे उत्तर से कितना हटकर दिखाता है, स्वतंत्र लटकी सुई क्षैतिज से कितना नीचे झुकती है, और क्षैतिज भाग कितना प्रबल है। इन तीनों को क्या कहते हैं?",
          mr: "कोणत्याही ठिकाणी स्थानिक क्षेत्र पूर्णपणे वर्णन करण्याआधी तीन संख्या लागतात: होकायंत्र खऱ्या उत्तरेपासून किती दूर दाखवतो, मुक्तपणे टांगलेली सुई आडव्यापासून किती खाली झुकते, आणि आडवा भाग किती तीव्र आहे. या तिघांना काय म्हणतात?",
        },
        statement: {
          en: "The Earth's magnetic elements are declination, dip and the horizontal component, and all three are needed because a field is a vector while each measurement gives only one number about it.",
          hi: "पृथ्वी के चुंबकीय अवयव दिक्पात, नति और क्षैतिज घटक हैं, और तीनों चाहिए क्योंकि क्षेत्र सदिश है जबकि हर माप उसके बारे में केवल एक संख्या देता है।",
          mr: "पृथ्वीचे चुंबकीय घटक म्हणजे दिक्पात, नती आणि आडवा घटक, आणि तिन्ही लागतात कारण क्षेत्र सदिश आहे तर प्रत्येक माप त्याबद्दल केवळ एक संख्या देते.",
        },
        detail: {
          en: "The total field follows from two of them by B = H/cos δ, so the vertical component and the total are not extra measurements but consequences of the dip and the horizontal component together.",
          hi: "कुल क्षेत्र इनमें से दो से B = H/cos δ द्वारा निकलता है, अतः ऊर्ध्वाधर घटक और कुल क्षेत्र अतिरिक्त माप नहीं बल्कि नति और क्षैतिज घटक के साथ मिलकर निकले परिणाम हैं।",
          mr: "एकूण क्षेत्र यांपैकी दोहोंतून B = H/cos δ ने निघते, म्हणून उभा घटक आणि एकूण ही जादा मापे नसून नती आणि आडवा घटक यांच्या मिळून निघालेले परिणाम आहेत.",
        },
        extra: {
          en: "The magnetic poles are not the geographic ones and they wander by tens of kilometres a year, which is why declination is printed on charts with a date and why the field has reversed many times in the rock record.",
          hi: "चुंबकीय ध्रुव भौगोलिक ध्रुव नहीं हैं और वे साल में दसियों किलोमीटर घूमते हैं, इसीलिए दिक्पात मानचित्रों पर तारीख़ के साथ छपता है और इसीलिए चट्टानों के अभिलेख में क्षेत्र कई बार उलट चुका है।",
          mr: "चुंबकीय ध्रुव हे भौगोलिक ध्रुव नाहीत आणि ते वर्षाला दहा-वीस किलोमीटर भटकतात, म्हणूनच दिक्पात नकाशांवर तारखेसह छापला जातो आणि म्हणूनच खडकांच्या नोंदीत क्षेत्र अनेकदा उलटले आहे.",
        },
        pair: {
          left: {
            en: "Three numbers, because a field is a vector",
            hi: "तीन संख्याएँ, क्योंकि क्षेत्र सदिश है",
            mr: "तीन संख्या, कारण क्षेत्र सदिश आहे",
          },
          right: {
            en: "the Earth's magnetic elements",
            hi: "पृथ्वी के चुंबकीय अवयव",
            mr: "पृथ्वीचे चुंबकीय घटक",
          },
        },
      },
      {
        id: "diamagnetism",
        name: {
          en: "Diamagnetism",
          hi: "प्रतिचुंबकत्व",
          mr: "प्रतिचुंबकत्व",
        },
        kind: "class of magnetic material",
        prompt: {
          en: "Bismuth, copper and water are all pushed feebly OUT of a strong field and towards the weaker region, and cooling them makes no difference whatever. Which class of material behaves like this?",
          hi: "बिस्मथ, ताँबा और पानी सब प्रबल क्षेत्र से बाहर, कमज़ोर भाग की ओर, कमज़ोरी से धकेले जाते हैं, और उन्हें ठंडा करने से कोई फ़र्क़ पड़ता ही नहीं। पदार्थों का कौन-सा वर्ग ऐसा बरतता है?",
          mr: "बिस्मथ, तांबे आणि पाणी हे सर्व तीव्र क्षेत्रातून बाहेर, क्षीण भागाकडे, क्षीणपणे ढकलले जातात, आणि त्यांना थंड केल्याने काहीही फरक पडत नाही. पदार्थांचा कोणता वर्ग असा वागतो?",
        },
        statement: {
          en: "Diamagnetism is a feeble repulsion from a field, arising in substances whose atoms have no net magnetic moment of their own, so the field itself induces opposing moments in them.",
          hi: "प्रतिचुंबकत्व क्षेत्र से कमज़ोर प्रतिकर्षण है, जो उन पदार्थों में उठता है जिनके परमाणुओं का अपना कोई नेट चुंबकीय आघूर्ण नहीं, अतः क्षेत्र स्वयं उनमें विरोधी आघूर्ण प्रेरित कर देता है।",
          mr: "प्रतिचुंबकत्व म्हणजे क्षेत्रापासूनचे क्षीण प्रतिकर्षण, जे अशा पदार्थांत उद्भवते ज्यांच्या अणूंना स्वतःचे कोणतेही निव्वळ चुंबकीय आघूर्ण नाही, म्हणून क्षेत्रच त्यांच्यात विरोधी आघूर्ण प्रेरित करते.",
        },
        detail: {
          en: "It is present in every substance, being a direct consequence of induction opposing the change that caused it, but in most materials a stronger effect of the opposite sign hides it completely.",
          hi: "यह हर पदार्थ में मौजूद है, क्योंकि यह प्रेरण के उस परिवर्तन का विरोध करने का सीधा परिणाम है जिसने उसे पैदा किया, पर अधिकांश पदार्थों में विपरीत चिह्न का प्रबल प्रभाव उसे पूरी तरह छिपा देता है।",
          mr: "हे प्रत्येक पदार्थात उपस्थित आहे, कारण हे प्रेरणाने ज्या बदलाने ते घडवले त्याचाच विरोध करण्याचा थेट परिणाम आहे, पण बहुतेक पदार्थांत विरुद्ध चिन्हाचा तीव्र परिणाम त्याला पूर्णपणे झाकतो.",
        },
        extra: {
          en: "It is the only one of the three that does not weaken as temperature rises, because there are no permanent moments for heat to disorder — a superconductor is the extreme case, expelling the field entirely.",
          hi: "तीनों में यही एक है जो ताप बढ़ने पर कमज़ोर नहीं होता, क्योंकि ऊष्मा को अव्यवस्थित करने को कोई स्थायी आघूर्ण है ही नहीं — अतिचालक चरम स्थिति है, जो क्षेत्र को पूरी तरह बाहर धकेल देता है।",
          mr: "तिन्हींपैकी हेच एक जे तापमान वाढल्यावर क्षीण होत नाही, कारण उष्णतेला अव्यवस्थित करायला कोणतेही कायम आघूर्ण नाहीच — अतिवाहक ही टोकाची स्थिती, जी क्षेत्र पूर्णपणे बाहेर लोटते.",
        },
        pair: {
          left: {
            en: "Pushed towards the weaker part of the field",
            hi: "क्षेत्र के कमज़ोर भाग की ओर धकेला गया",
            mr: "क्षेत्राच्या क्षीण भागाकडे ढकललेला",
          },
          right: {
            en: "diamagnetism",
            hi: "प्रतिचुंबकत्व",
            mr: "प्रतिचुंबकत्व",
          },
        },
      },
      {
        id: "paramagnetism",
        name: {
          en: "Paramagnetism",
          hi: "अनुचुंबकत्व",
          mr: "अनुचुंबकत्व",
        },
        kind: "class of magnetic material",
        prompt: {
          en: "Aluminium and liquid oxygen are drawn feebly INTO a strong field, the pull grows as they are cooled, and it disappears the moment the field is switched off. Which class of material is this?",
          hi: "ऐलुमिनियम और द्रव ऑक्सीजन प्रबल क्षेत्र में कमज़ोरी से खिंचते हैं, ठंडा करने पर खिंचाव बढ़ता है, और क्षेत्र बंद करते ही वह ग़ायब हो जाता है। यह पदार्थों का कौन-सा वर्ग है?",
          mr: "ॲल्युमिनियम आणि द्रव ऑक्सिजन तीव्र क्षेत्रात क्षीणपणे ओढले जातात, थंड केल्यावर ओढ वाढते, आणि क्षेत्र बंद करताच ती नाहीशी होते. हा पदार्थांचा कोणता वर्ग?",
        },
        statement: {
          en: "Paramagnetism is a feeble attraction into a field, shown by substances whose atoms carry permanent magnetic moments that the field partially aligns against the disordering effect of heat.",
          hi: "अनुचुंबकत्व क्षेत्र में कमज़ोर आकर्षण है, जो उन पदार्थों में दिखता है जिनके परमाणु स्थायी चुंबकीय आघूर्ण रखते हैं जिन्हें क्षेत्र ऊष्मा के अव्यवस्थित करने वाले प्रभाव के विरुद्ध आंशिक रूप से संरेखित करता है।",
          mr: "अनुचुंबकत्व म्हणजे क्षेत्रात होणारे क्षीण आकर्षण, जे अशा पदार्थांत दिसते ज्यांचे अणू कायम चुंबकीय आघूर्ण बाळगतात आणि क्षेत्र त्यांना उष्णतेच्या अव्यवस्थित करणाऱ्या परिणामाविरुद्ध अंशतः संरेखित करते.",
        },
        detail: {
          en: "The alignment is a competition, which is why the magnetisation obeys Curie's law and is inversely proportional to the absolute temperature: colder means less jostling and a larger fraction pointing the right way.",
          hi: "संरेखण एक होड़ है, इसीलिए चुंबकन क्यूरी के नियम को मानता है और परम ताप के व्युत्क्रमानुपाती है: ठंडा होने का अर्थ है कम धक्कमपेल और सही दिशा में इशारा करता बड़ा अंश।",
          mr: "संरेखन ही एक स्पर्धा आहे, म्हणूनच चुंबकन क्युरीच्या नियमाला मानते आणि निरपेक्ष तापमानाशी व्यस्त समानुपाती असते: थंड म्हणजे कमी धक्काबुक्की आणि योग्य दिशेने दाखवणारा मोठा अंश.",
        },
        extra: {
          en: "Nothing is retained when the field is removed — thermal motion scrambles the moments again within an instant — which is exactly what separates it from the third class.",
          hi: "क्षेत्र हटाते ही कुछ भी बचा नहीं रहता — ऊष्मीय गति क्षण भर में आघूर्णों को फिर उलट-पुलट देती है — और ठीक यही उसे तीसरे वर्ग से अलग करता है।",
          mr: "क्षेत्र काढताच काहीही टिकत नाही — औष्णिक गती क्षणार्धात आघूर्णे पुन्हा विस्कटते — आणि नेमके हेच त्याला तिसऱ्या वर्गापासून वेगळे करते.",
        },
        pair: {
          left: {
            en: "A tug that grows in the cold and vanishes with the field",
            hi: "ऐसा खिंचाव जो ठंड में बढ़े और क्षेत्र के साथ ग़ायब हो",
            mr: "अशी ओढ जी थंडीत वाढते आणि क्षेत्रासोबत नाहीशी होते",
          },
          right: {
            en: "paramagnetism",
            hi: "अनुचुंबकत्व",
            mr: "अनुचुंबकत्व",
          },
        },
      },
      {
        id: "ferromagnetism",
        name: {
          en: "Ferromagnetism",
          hi: "लौहचुंबकत्व",
          mr: "लोहचुंबकत्व",
        },
        kind: "class of magnetic material",
        prompt: {
          en: "Iron, cobalt and nickel are pulled powerfully into a field, thousands of times more strongly than the feeble classes, and a piece of iron keeps some of its magnetisation after the field is taken away. Which class is this?",
          hi: "लोहा, कोबाल्ट और निकल क्षेत्र में ज़ोर से खिंचते हैं, कमज़ोर वर्गों से हज़ारों गुना अधिक बल से, और लोहे का टुकड़ा क्षेत्र हटा लेने के बाद भी अपना कुछ चुंबकन रखे रहता है। यह कौन-सा वर्ग है?",
          mr: "लोखंड, कोबाल्ट आणि निकेल क्षेत्रात जोराने ओढले जातात, क्षीण वर्गांहून हजारो पट अधिक जोराने, आणि लोखंडाचा तुकडा क्षेत्र काढून घेतल्यावरही आपले काही चुंबकन टिकवून ठेवतो. हा कोणता वर्ग?",
        },
        statement: {
          en: "Ferromagnetism is a very strong attraction into a field, produced when neighbouring atomic moments lock parallel to one another over whole domains rather than aligning one at a time.",
          hi: "लौहचुंबकत्व क्षेत्र में बहुत प्रबल आकर्षण है, जो तब बनता है जब पड़ोसी परमाणविक आघूर्ण एक-एक करके संरेखित होने के बजाय पूरे प्रांतों में एक-दूसरे के समांतर जकड़ जाते हैं।",
          mr: "लोहचुंबकत्व म्हणजे क्षेत्रात होणारे अतिशय तीव्र आकर्षण, जे तेव्हा घडते जेव्हा शेजारची अणुआघूर्णे एकेक करून संरेखित होण्याऐवजी अख्ख्या प्रांतांत एकमेकांना समांतर जखडतात.",
        },
        detail: {
          en: "Magnetising such a material is largely a matter of favourably oriented domains GROWING at the expense of their neighbours, which is a rearrangement of boundaries rather than a turning of individual atoms.",
          hi: "ऐसे पदार्थ का चुंबकन मुख्यतः इसका मामला है कि अनुकूल दिशा वाले प्रांत अपने पड़ोसियों की क़ीमत पर बढ़ते हैं, जो अलग-अलग परमाणुओं के घूमने के बजाय सीमाओं का पुनर्विन्यास है।",
          mr: "अशा पदार्थाचे चुंबकन मुख्यतः याची बाब आहे की अनुकूल दिशेचे प्रांत आपल्या शेजाऱ्यांच्या खर्चाने वाढतात, जे वेगवेगळ्या अणूंच्या फिरण्याऐवजी सीमांची पुनर्मांडणी आहे.",
        },
        extra: {
          en: "Above a definite temperature — 1043 K for iron — the domain order collapses and the material turns paramagnetic, which is why a red-hot nail is no longer picked up by a magnet.",
          hi: "एक निश्चित ताप से ऊपर — लोहे के लिए 1043 K — प्रांतों की व्यवस्था ढह जाती है और पदार्थ अनुचुंबकीय हो जाता है, इसीलिए लाल-गर्म कील को चुंबक अब नहीं उठाता।",
          mr: "एका ठराविक तापमानाच्या वर — लोखंडासाठी 1043 K — प्रांतांची व्यवस्था कोसळते आणि पदार्थ अनुचुंबकीय होतो, म्हणूनच लालबुंद तापलेला खिळा चुंबक आता उचलत नाही.",
        },
        pair: {
          left: {
            en: "Remembers, after the field has gone",
            hi: "क्षेत्र चले जाने के बाद भी याद रखता है",
            mr: "क्षेत्र गेल्यावरही लक्षात ठेवतो",
          },
          right: {
            en: "ferromagnetism",
            hi: "लौहचुंबकत्व",
            mr: "लोहचुंबकत्व",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student cuts a bar magnet in half expecting to obtain a separate north pole and a separate south pole, and finds instead two complete magnets. Cutting again gives four. Explain why no amount of cutting will ever isolate a pole, and what law records this.",
          hi: "एक विद्यार्थी छड़ चुंबक को बीच से काटता है यह आशा करते हुए कि उसे अलग उत्तर ध्रुव और अलग दक्षिण ध्रुव मिलेंगे, और उसके बजाय दो पूरे चुंबक पाता है। फिर काटने पर चार। समझाओ कि कितना भी काटने से कोई ध्रुव कभी अलग क्यों नहीं होगा, और कौन-सा नियम इसे दर्ज करता है।",
          mr: "एक विद्यार्थी दांडा चुंबक मधून कापतो, वेगळा उत्तर ध्रुव आणि वेगळा दक्षिण ध्रुव मिळेल अशी आशा करत, आणि त्याऐवजी दोन पूर्ण चुंबक मिळवतो. पुन्हा कापल्यावर चार. कितीही कापले तरी एकही ध्रुव कधीच वेगळा का होणार नाही, आणि कोणता नियम हे नोंदवतो, ते समजावा.",
        },
        choices: [
          {
            en: "Because there were never two poles to separate. The magnet's field comes from circulating charge inside it — orbiting and spinning electrons acting as microscopic current loops — so it is a DIPOLE, and cutting a dipole in half gives two smaller dipoles exactly as cutting a solenoid gives two shorter solenoids. The 'poles' are the two ends of one object, not two objects stuck together. This is recorded as Gauss's law for magnetism: the net magnetic flux through ANY closed surface is zero, because a lone pole would be a source from which lines began, and magnetic field lines are always closed loops that continue through the magnet's interior",
            hi: "क्योंकि अलग करने को दो ध्रुव कभी थे ही नहीं। चुंबक का क्षेत्र उसके भीतर परिक्रमा करते आवेश से आता है — कक्षा में घूमते और चक्रण करते इलेक्ट्रॉन सूक्ष्म धारा-लूप की तरह — अतः वह द्विध्रुव है, और द्विध्रुव को बीच से काटने पर दो छोटे द्विध्रुव मिलते हैं, ठीक वैसे जैसे परिनालिका काटने पर दो छोटी परिनालिकाएँ। 'ध्रुव' एक ही वस्तु के दो सिरे हैं, चिपकाई हुई दो वस्तुएँ नहीं। यह चुंबकत्व के लिए गाउस के नियम के रूप में दर्ज है: किसी भी बंद पृष्ठ से नेट चुंबकीय फ्लक्स शून्य है, क्योंकि अकेला ध्रुव वह स्रोत होता जहाँ से रेखाएँ शुरू होतीं, और चुंबकीय क्षेत्र रेखाएँ सदा बंद लूप हैं जो चुंबक के भीतर से होकर चलती रहती हैं",
            mr: "कारण वेगळे करायला दोन ध्रुव कधी होतेच नाहीत. चुंबकाचे क्षेत्र त्याच्या आत फिरणाऱ्या प्रभारापासून येते — कक्षेत फिरणारे आणि परिवलन करणारे इलेक्ट्रॉन सूक्ष्म धारा-वळशांसारखे — म्हणून तो द्विध्रुव आहे, आणि द्विध्रुव मधून कापल्यास दोन लहान द्विध्रुव मिळतात, अगदी तसेच जसे सोलेनॉइड कापल्यास दोन लहान सोलेनॉइड. 'ध्रुव' ही एकाच वस्तूची दोन टोके आहेत, चिकटवलेल्या दोन वस्तू नव्हे. हे चुंबकत्वासाठीच्या गॉसच्या नियमाच्या रूपात नोंदलेले आहे: कोणत्याही बंद पृष्ठातून जाणारा निव्वळ चुंबकीय फ्लक्स शून्य आहे, कारण एकटा ध्रुव हा तो स्रोत ठरला असता जिथून रेषा सुरू होतात, आणि चुंबकीय क्षेत्ररेषा नेहमी बंद वळसे आहेत जे चुंबकाच्या आतून चालत राहतात",
          },
          {
            en: "Because the cut is never clean enough: a perfectly sharp cut through the exact centre of a magnet would in fact separate the two poles",
            hi: "क्योंकि कटान कभी पर्याप्त साफ़ नहीं होता: चुंबक के ठीक केंद्र से एकदम तेज़ कटान वस्तुतः दोनों ध्रुवों को अलग कर देता",
            mr: "कारण कापणी कधीच पुरेशी स्वच्छ नसते: चुंबकाच्या नेमक्या केंद्रातून अगदी धारदार कापणी प्रत्यक्षात दोन्ही ध्रुव वेगळे करेल",
          },
          {
            en: "Because each half instantly re-magnetises the other by induction, so a pole is isolated for a moment and then destroyed",
            hi: "क्योंकि हर आधा भाग प्रेरण से दूसरे को तुरंत फिर चुंबकित कर देता है, अतः ध्रुव एक क्षण के लिए अलग होता है और फिर नष्ट हो जाता है",
            mr: "कारण प्रत्येक अर्धा भाग प्रेरणाने दुसऱ्याला लगेच पुन्हा चुंबकित करतो, म्हणून ध्रुव क्षणभर वेगळा होतो आणि मग नष्ट होतो",
          },
          {
            en: "Because magnetic poles always occur in pairs by convention, and a single pole would simply be given both names at once",
            hi: "क्योंकि चुंबकीय ध्रुव परिपाटी से सदा युग्मों में आते हैं, और अकेले ध्रुव को बस दोनों नाम एक साथ दे दिए जाते",
            mr: "कारण चुंबकीय ध्रुव संकेतानुसार नेहमी जोड्यांत येतात, आणि एकट्या ध्रुवाला फक्त दोन्ही नावे एकाच वेळी दिली गेली असती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The experiment is real, it has been done to the limit of what can be cut, and the answer is not that isolation is difficult — it is that there is nothing there to isolate. Start with what a magnet is. The whole of Chapter 4 was about currents producing magnetic fields, and this chapter's central identification is that a bar magnet is doing the same thing with currents you cannot see: each electron contributes a tiny loop from its orbital motion and another from its spin, and in iron enough of these lock parallel that their fields add to something you can hang a fridge note from. So a magnet is not an object with a north thing at one end and a south thing at the other. It is a solenoid whose windings are electrons. Now cut it. Cut a solenoid across the middle and you get two shorter solenoids, each with its own field emerging from one end and re-entering the other. Nothing about the halves is anomalous; each is simply a solenoid with fewer turns. The 'poles' were never components — they were the two ENDS of one thing, in the same way that cutting a stick in half gives two sticks and never a left-end without a right-end. The formal statement is Gauss's law for magnetism: the net magnetic flux through any closed surface is exactly zero. Compare it with its electric partner. The electrostatic law has q_enclosed/ε₀ on the right, and that term is a licence to have a source: draw a surface round a positive charge and lines stream out through it with nothing coming back in. The magnetic law has zero there. There is no such thing as enclosed magnetic charge, so a surface can never have more lines leaving than entering, and a lone pole — which by definition would be a place lines started from — is forbidden. Draw a surface round one end of a bar magnet and the lines that emerge from the pole face all re-enter through the part of the surface that cuts through the middle of the magnet, because inside the magnet the field runs from south to north. The total is zero, as the law requires. Two footnotes are worth keeping. First, this is a statement about what has been observed, not a theorem: nothing in the rest of electromagnetism would break if monopoles existed, and searches for them continue, with the theory adjusted to a non-zero right-hand side if one is ever found. Second, the asymmetry has a visible consequence in every field diagram in the book — electric lines begin and end on charges, magnetic lines close on themselves, and a diagram of a magnetic field with a loose end in it is wrong on inspection. (The second and third options treat the impossibility as practical rather than structural; the fourth makes it a matter of naming, when it is a measurable claim about flux.)",
          hi: "प्रयोग असली है, जितना काटा जा सकता है वहाँ तक किया जा चुका है, और उत्तर यह नहीं कि अलग करना कठिन है — उत्तर यह है कि अलग करने को वहाँ कुछ है ही नहीं। पहले यह लो कि चुंबक है क्या। पूरा चौथा अध्याय धाराओं से चुंबकीय क्षेत्र बनने के बारे में था, और इस अध्याय की केंद्रीय पहचान यह है कि छड़ चुंबक वही काम उन धाराओं से कर रहा है जो तुम्हें दिखती नहीं: हर इलेक्ट्रॉन अपनी कक्षीय गति से एक नन्हा लूप देता है और अपने चक्रण से दूसरा, और लोहे में इनमें से पर्याप्त समांतर जकड़ जाते हैं कि उनके क्षेत्र जुड़कर वह बन जाएँ जिससे तुम फ़्रिज पर पर्ची टाँग सको। अतः चुंबक ऐसी वस्तु नहीं जिसके एक सिरे पर उत्तर नाम की चीज़ और दूसरे पर दक्षिण नाम की। वह ऐसी परिनालिका है जिसकी लपेटें इलेक्ट्रॉन हैं। अब उसे काटो। परिनालिका को बीच से काटो और दो छोटी परिनालिकाएँ मिलती हैं, हर एक का अपना क्षेत्र एक सिरे से निकलता और दूसरे से लौटता। आधों में कुछ भी असामान्य नहीं; हर एक बस कम फेरों वाली परिनालिका है। 'ध्रुव' कभी घटक थे ही नहीं — वे एक ही चीज़ के दो सिरे थे, ठीक वैसे जैसे छड़ी को बीच से काटने पर दो छड़ियाँ मिलती हैं, बाएँ सिरे बिना दाएँ सिरे के कभी नहीं। औपचारिक कथन चुंबकत्व के लिए गाउस का नियम है: किसी भी बंद पृष्ठ से नेट चुंबकीय फ्लक्स ठीक शून्य है। उसकी विद्युत जोड़ी से तुलना करो। स्थिरवैद्युत नियम के दाईं ओर q_घिरा/ε₀ है, और वह पद स्रोत रखने का लाइसेंस है: धन आवेश के चारों ओर पृष्ठ खींचो और रेखाएँ उसमें से बाहर बहती हैं, भीतर कुछ नहीं लौटता। चुंबकीय नियम के वहाँ शून्य है। घिरा चुंबकीय आवेश जैसी कोई चीज़ है ही नहीं, अतः किसी पृष्ठ से निकलने वाली रेखाएँ आने वाली से अधिक कभी नहीं हो सकतीं, और अकेला ध्रुव — जो परिभाषा से वह जगह होता जहाँ से रेखाएँ शुरू होतीं — वर्जित है। छड़ चुंबक के एक सिरे के चारों ओर पृष्ठ खींचो और ध्रुव-फलक से निकलने वाली सारी रेखाएँ पृष्ठ के उस भाग से फिर भीतर आ जाती हैं जो चुंबक के बीच से कटता है, क्योंकि चुंबक के भीतर क्षेत्र दक्षिण से उत्तर की ओर चलता है। कुल शून्य है, जैसा नियम माँगता है। दो टिप्पणियाँ रखने योग्य हैं। पहली, यह इस बारे में कथन है कि क्या देखा गया, प्रमेय नहीं: यदि एकध्रुव होते तो शेष विद्युत चुंबकत्व में कुछ भी न टूटता, और उनकी खोज जारी है, और कभी एक मिल गया तो सिद्धांत को शून्येतर दाएँ पक्ष के साथ ढाल लिया जाएगा। दूसरी, इस असममिति का पुस्तक के हर क्षेत्र-चित्र में दिखने वाला परिणाम है — विद्युत रेखाएँ आवेशों पर शुरू और ख़त्म होती हैं, चुंबकीय रेखाएँ अपने पर बंद होती हैं, और जिस चुंबकीय क्षेत्र के चित्र में कोई खुला सिरा हो वह देखते ही ग़लत है। (दूसरा और तीसरा विकल्प असंभवता को संरचनात्मक के बजाय व्यावहारिक बना देते हैं; चौथा उसे नामकरण की बात बना देता है, जबकि वह फ्लक्स के बारे में नापा जा सकने वाला दावा है।)",
          mr: "प्रयोग खरा आहे, जितके कापता येईल तिथवर तो केला गेला आहे, आणि उत्तर हे नाही की वेगळे करणे कठीण आहे — उत्तर हे आहे की वेगळे करायला तिथे काहीच नाही. आधी चुंबक म्हणजे काय ते घ्या. अख्खे चौथे प्रकरण धारांपासून चुंबकीय क्षेत्रे बनण्याबद्दल होते, आणि या प्रकरणाची मध्यवर्ती ओळख अशी की दांडा चुंबक तेच काम त्या धारांनी करत आहे ज्या तुम्हाला दिसत नाहीत: प्रत्येक इलेक्ट्रॉन आपल्या कक्षीय गतीतून एक चिमुकले वळसे देतो आणि आपल्या परिवलनातून दुसरे, आणि लोखंडात यांपैकी पुरेसे समांतर जखडतात की त्यांची क्षेत्रे जुळून ते बनते ज्यातून तुम्ही फ्रिजवर चिठ्ठी लटकवू शकता. म्हणून चुंबक ही अशी वस्तू नाही जिच्या एका टोकाला उत्तर नावाची गोष्ट आणि दुसऱ्या टोकाला दक्षिण. तो असे सोलेनॉइड आहे ज्याचे वेढे इलेक्ट्रॉन आहेत. आता तो कापा. सोलेनॉइड मधून कापा आणि दोन लहान सोलेनॉइड मिळतात, प्रत्येकाचे स्वतःचे क्षेत्र एका टोकातून निघते आणि दुसऱ्यातून परतते. अर्ध्यांत काहीही असामान्य नाही; प्रत्येक फक्त कमी वेढ्यांचे सोलेनॉइड आहे. 'ध्रुव' कधी घटक होतेच नाहीत — ती एकाच गोष्टीची दोन टोके होती, अगदी तसेच जसे काठी मधून कापल्यास दोन काठ्या मिळतात, उजव्या टोकाविना डावे टोक कधीच नाही. औपचारिक विधान म्हणजे चुंबकत्वासाठीचा गॉसचा नियम: कोणत्याही बंद पृष्ठातून जाणारा निव्वळ चुंबकीय फ्लक्स नेमका शून्य आहे. त्याच्या विद्युत जोडीदाराशी तुलना करा. स्थिरविद्युत नियमाच्या उजवीकडे q_घेरलेला/ε₀ आहे, आणि ते पद स्रोत बाळगण्याचा परवाना आहे: धन प्रभाराभोवती पृष्ठ काढा आणि रेषा त्यातून बाहेर वाहतात, आत काहीच परतत नाही. चुंबकीय नियमाच्या तिथे शून्य आहे. घेरलेला चुंबकीय प्रभार अशी गोष्टच नाही, म्हणून कोणत्याही पृष्ठातून बाहेर पडणाऱ्या रेषा आत येणाऱ्यांहून अधिक कधीच असू शकत नाहीत, आणि एकटा ध्रुव — जो व्याख्येने ती जागा ठरली असती जिथून रेषा सुरू होतात — वर्ज्य आहे. दांडा चुंबकाच्या एका टोकाभोवती पृष्ठ काढा आणि ध्रुव-पृष्ठभागातून निघणाऱ्या सर्व रेषा पृष्ठाच्या त्या भागातून पुन्हा आत येतात जो चुंबकाच्या मधून कापतो, कारण चुंबकाच्या आत क्षेत्र दक्षिणेकडून उत्तरेकडे चालते. एकूण शून्य आहे, जसे नियम मागतो. दोन टिपा ठेवण्याजोग्या आहेत. पहिली, हे काय निरीक्षिले गेले याबद्दलचे विधान आहे, प्रमेय नव्हे: एकध्रुव अस्तित्वात असते तर उरलेल्या विद्युतचुंबकत्वात काहीही मोडले नसते, आणि त्यांचा शोध चालूच आहे, आणि कधी एक सापडला तर सिद्धांत शून्येतर उजव्या बाजूसह जुळवून घेतला जाईल. दुसरी, या असममितीचा पुस्तकातल्या प्रत्येक क्षेत्र-चित्रात दिसणारा परिणाम आहे — विद्युत रेषा प्रभारांवर सुरू आणि संपतात, चुंबकीय रेषा स्वतःवर बंद होतात, आणि ज्या चुंबकीय क्षेत्राच्या चित्रात मोकळे टोक असेल ते पाहताक्षणी चूक आहे. (दुसरा आणि तिसरा पर्याय अशक्यतेला संरचनात्मक ऐवजी व्यावहारिक बनवतात; चौथा तिला नामकरणाची बाब बनवतो, तर ती फ्लक्सबद्दलचा मोजता येणारा दावा आहे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A workshop must choose between two ferromagnetic alloys. Alloy P has a tall narrow hysteresis loop; alloy Q has a wide loop enclosing a large area. One is to become the core of a mains transformer and the other a permanent magnet for a loudspeaker. Assign them and justify the assignment.",
          hi: "एक कारख़ाने को दो लौहचुंबकीय मिश्रधातुओं में से चुनना है। मिश्रधातु P का शैथिल्य लूप ऊँचा और सँकरा है; मिश्रधातु Q का लूप चौड़ा है और बड़ा क्षेत्रफल घेरता है। एक को मुख्य आपूर्ति के ट्रांसफ़ॉर्मर की क्रोड बनना है और दूसरे को लाउडस्पीकर का स्थायी चुंबक। उन्हें बाँटो और बँटवारे को न्यायसंगत ठहराओ।",
          mr: "एका कार्यशाळेला दोन लोहचुंबकीय मिश्रधातूंपैकी निवडायचे आहे. मिश्रधातू P चा शैथिल्य वळसा उंच आणि अरुंद आहे; मिश्रधातू Q चा वळसा रुंद असून मोठे क्षेत्रफळ घेरतो. एकाला मुख्य पुरवठ्याच्या ट्रान्सफॉर्मरचा गाभा बनायचे आहे आणि दुसऱ्याला लाउडस्पीकरचा कायम चुंबक. त्यांची नेमणूक करा आणि ती न्याय्य ठरवा.",
        },
        choices: [
          {
            en: "P becomes the transformer core and Q the permanent magnet. The area of the hysteresis loop is the energy dissipated as heat per unit volume per cycle, and a mains core is taken round its loop fifty times a second, so a narrow loop — low coercivity, easily magnetised and easily reversed — keeps that loss small. A permanent magnet is magnetised once and must then resist being demagnetised by stray fields, knocks and heat, so it wants high coercivity and high retentivity, which is exactly what a wide loop describes. The two requirements are opposite, which is why no single alloy serves both jobs",
            hi: "P ट्रांसफ़ॉर्मर की क्रोड बनता है और Q स्थायी चुंबक। शैथिल्य लूप का क्षेत्रफल प्रति एकांक आयतन प्रति चक्र ऊष्मा के रूप में खोई ऊर्जा है, और मुख्य आपूर्ति की क्रोड सेकंड में पचास बार अपने लूप का चक्कर लगाती है, अतः सँकरा लूप — कम निग्राहिता, आसानी से चुंबकित और आसानी से उलटा — उस हानि को छोटा रखता है। स्थायी चुंबक एक बार चुंबकित होता है और फिर उसे भटके क्षेत्रों, ठोकरों और ऊष्मा से विचुंबकित होने का प्रतिरोध करना पड़ता है, अतः उसे ऊँची निग्राहिता और ऊँची धारणशीलता चाहिए, और चौड़ा लूप ठीक यही बताता है। दोनों माँगें उलटी हैं, इसीलिए कोई अकेली मिश्रधातु दोनों काम नहीं करती",
            mr: "P हा ट्रान्सफॉर्मरचा गाभा बनतो आणि Q कायम चुंबक. शैथिल्य वळशाचे क्षेत्रफळ म्हणजे प्रति एकक घनफळ प्रति चक्र उष्णतेच्या रूपात गमावलेली ऊर्जा, आणि मुख्य पुरवठ्याचा गाभा सेकंदाला पन्नास वेळा आपल्या वळशाची फेरी मारतो, म्हणून अरुंद वळसा — कमी निग्राहिता, सहज चुंबकित आणि सहज उलटवला जाणारा — ती हानी लहान ठेवतो. कायम चुंबक एकदा चुंबकित होतो आणि मग त्याला भरकटलेल्या क्षेत्रांपासून, धक्क्यांपासून आणि उष्णतेपासून विचुंबकित होण्याला विरोध करावा लागतो, म्हणून त्याला उंच निग्राहिता आणि उंच धारणशीलता हवी, आणि रुंद वळसा नेमके हेच वर्णन करतो. दोन्ही मागण्या उलट आहेत, म्हणूनच कोणतीही एकच मिश्रधातू दोन्ही कामे करत नाही",
          },
          {
            en: "Q becomes the transformer core and P the permanent magnet, because a wide loop means the material holds a strong field and a core must hold a strong field to transfer power",
            hi: "Q ट्रांसफ़ॉर्मर की क्रोड बनता है और P स्थायी चुंबक, क्योंकि चौड़े लूप का अर्थ है पदार्थ प्रबल क्षेत्र रोके रखता है और शक्ति स्थानांतरित करने के लिए क्रोड को प्रबल क्षेत्र रोकना ही पड़ता है",
            mr: "Q हा ट्रान्सफॉर्मरचा गाभा बनतो आणि P कायम चुंबक, कारण रुंद वळसा म्हणजे पदार्थ तीव्र क्षेत्र धरून ठेवतो आणि शक्ती हस्तांतरित करण्यासाठी गाभ्याला तीव्र क्षेत्र धरावेच लागते",
          },
          {
            en: "Either alloy will serve either purpose, since the loop's shape affects only how quickly the material magnetises and not how much energy it uses",
            hi: "कोई भी मिश्रधातु किसी भी काम के लिए चलेगी, क्योंकि लूप का आकार केवल यह तय करता है कि पदार्थ कितनी जल्दी चुंबकित होता है, यह नहीं कि वह कितनी ऊर्जा ख़र्च करता है",
            mr: "कोणतीही मिश्रधातू कोणत्याही कामासाठी चालेल, कारण वळशाचा आकार केवळ पदार्थ किती लवकर चुंबकित होतो हे ठरवतो, तो किती ऊर्जा खर्च करतो हे नाही",
          },
          {
            en: "P becomes the transformer core and Q the permanent magnet, but only because P is the cheaper alloy — magnetically the two are interchangeable",
            hi: "P ट्रांसफ़ॉर्मर की क्रोड बनता है और Q स्थायी चुंबक, पर केवल इसलिए कि P सस्ती मिश्रधातु है — चुंबकीय दृष्टि से दोनों आपस में बदले जा सकते हैं",
            mr: "P हा ट्रान्सफॉर्मरचा गाभा बनतो आणि Q कायम चुंबक, पण केवळ यामुळे की P स्वस्त मिश्रधातू आहे — चुंबकीय दृष्ट्या दोन्ही अदलाबदल करण्याजोगे आहेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A hysteresis loop looks like a curiosity when it is first drawn and turns out to be an engineering specification. Read the axes: the horizontal is the magnetising field H applied from outside, the vertical is the magnetisation B the material actually reaches. Take a ferromagnet round a full cycle of H and the curve does not retrace itself — B lags behind H, so the return path lies above the outgoing one, and the two enclose an area. Three numbers can be read straight off. RETENTIVITY is the value of B left when H has been brought back to zero: what the material remembers. COERCIVITY is the reverse field needed to push B back to zero: how hard it is to make it forget. And the AREA of the loop is the energy dissipated as heat per unit volume per cycle, because going round the loop is a process in which the domain walls move against friction and do not give the work back. Now the two applications, which want opposite things. A mains transformer core is magnetised, demagnetised, magnetised the other way and demagnetised again, fifty times every second, for as long as the transformer is switched on. Every one of those cycles costs the loop's area in heat, and that heat is pure loss — it warms the core, it must be carried away, and it appears on the electricity bill of everyone downstream. So the core wants the SMALLEST possible loop area: low coercivity, easily flipped, remembering as little as possible. Soft iron and silicon steel are chosen for exactly this, and the same reasoning drives the other core losses — the laminations that break up eddy currents are a separate but parallel economy. A loudspeaker magnet has the opposite job. It is magnetised once at the factory and then must hold that magnetisation for twenty years while the voice coil's own field pushes at it thousands of times a second, while the speaker is dropped, and while the cabinet warms up. Anything that demagnetises easily is useless. So it wants high retentivity, so that it keeps a strong field with no external help, and high coercivity, so that stray fields cannot undo it — and those two together are precisely a wide loop. The dissipation that made a wide loop unacceptable in the transformer is irrelevant here, because this magnet is never taken round its loop at all after the first time. That is the general shape of the answer, and it is worth stating on its own: the hysteresis loop is not good or bad, and a material is not better or worse for having a wide one. The loop is a description, and which description you want depends on whether the material is going to be cycled continuously or set once and left alone. (The second option reads the loop's width as field strength; the third denies that the area is an energy; the fourth reaches the right assignment by an irrelevant route, which in an examination is worth no more than the wrong assignment.)",
          hi: "शैथिल्य लूप पहली बार खींचे जाने पर कौतुक लगता है और निकलता अभियांत्रिकी विनिर्देश है। अक्ष पढ़ो: क्षैतिज बाहर से लगाया गया चुंबकन क्षेत्र H है, ऊर्ध्वाधर वह चुंबकन B है जो पदार्थ वस्तुतः पाता है। लौहचुंबक को H के पूरे चक्र पर घुमाओ और वक्र अपने ही रास्ते नहीं लौटता — B, H से पीछे रहता है, अतः लौटने का पथ जाने वाले के ऊपर पड़ता है, और दोनों मिलकर एक क्षेत्रफल घेरते हैं। तीन संख्याएँ सीधे पढ़ी जा सकती हैं। धारणशीलता वह B है जो H के शून्य पर लौट आने पर बचा रहता है: पदार्थ जो याद रखता है। निग्राहिता वह उलटा क्षेत्र है जो B को शून्य तक धकेलने को चाहिए: उसे भुलाना कितना कठिन है। और लूप का क्षेत्रफल प्रति एकांक आयतन प्रति चक्र ऊष्मा के रूप में खोई ऊर्जा है, क्योंकि लूप का चक्कर वह प्रक्रिया है जिसमें प्रांतों की दीवारें घर्षण के विरुद्ध चलती हैं और कार्य वापस नहीं देतीं। अब दोनों उपयोग, जो उलटी चीज़ें चाहते हैं। मुख्य आपूर्ति के ट्रांसफ़ॉर्मर की क्रोड चुंबकित, विचुंबकित, दूसरी ओर चुंबकित और फिर विचुंबकित होती है, हर सेकंड पचास बार, जब तक ट्रांसफ़ॉर्मर चालू है। उनमें से हर चक्र लूप के क्षेत्रफल जितनी ऊष्मा लेता है, और वह ऊष्मा शुद्ध हानि है — वह क्रोड को गर्म करती है, उसे हटाना पड़ता है, और वह आगे के सब उपभोक्ताओं के बिजली बिल पर आती है। अतः क्रोड सबसे छोटा संभव लूप क्षेत्रफल चाहती है: कम निग्राहिता, आसानी से पलटने वाली, जितना कम हो सके उतना याद रखने वाली। नरम लोहा और सिलिकॉन इस्पात ठीक इसीलिए चुने जाते हैं, और वही तर्क क्रोड की दूसरी हानियों को भी चलाता है — भँवर धाराएँ तोड़ने वाली परतें अलग पर समांतर बचत हैं। लाउडस्पीकर के चुंबक का काम उलटा है। वह कारख़ाने में एक बार चुंबकित होता है और फिर बीस साल तक वह चुंबकन रोके रखना है जबकि वाक-कुंडली का अपना क्षेत्र उस पर सेकंड में हज़ारों बार धक्का देता है, जबकि स्पीकर गिरता है, और जबकि केबिनेट गर्म होती है। जो कुछ भी आसानी से विचुंबकित हो जाए वह बेकार है। अतः उसे ऊँची धारणशीलता चाहिए, ताकि वह बिना बाहरी मदद के प्रबल क्षेत्र रखे, और ऊँची निग्राहिता, ताकि भटके क्षेत्र उसे मिटा न सकें — और ये दोनों मिलकर ठीक चौड़ा लूप हैं। जिस क्षय ने चौड़े लूप को ट्रांसफ़ॉर्मर में अस्वीकार्य बनाया वह यहाँ अप्रासंगिक है, क्योंकि यह चुंबक पहली बार के बाद अपने लूप का चक्कर लगाता ही नहीं। उत्तर का सामान्य आकार यही है, और उसे अपने आप में कहना चाहिए: शैथिल्य लूप अच्छा या बुरा नहीं होता, और चौड़ा लूप होने से पदार्थ बेहतर या बदतर नहीं हो जाता। लूप एक वर्णन है, और तुम्हें कौन-सा वर्णन चाहिए यह इस पर निर्भर है कि पदार्थ लगातार चक्रित होने वाला है या एक बार जमाकर छोड़ दिया जाने वाला। (दूसरा विकल्प लूप की चौड़ाई को क्षेत्र की प्रबलता पढ़ लेता है; तीसरा इससे इनकार करता है कि क्षेत्रफल एक ऊर्जा है; चौथा सही बँटवारे तक अप्रासंगिक रास्ते से पहुँचता है, जो परीक्षा में ग़लत बँटवारे से अधिक मूल्य का नहीं।)",
          mr: "शैथिल्य वळसा प्रथम काढल्यावर कुतूहल वाटतो आणि निघतो अभियांत्रिकी विनिर्देश. अक्ष वाचा: आडवा म्हणजे बाहेरून लावलेले चुंबकन क्षेत्र H, उभा म्हणजे पदार्थ प्रत्यक्षात गाठत असलेले चुंबकन B. लोहचुंबकाला H च्या पूर्ण चक्रावर फिरवा आणि वक्र आपल्याच मार्गाने परतत नाही — B हा H च्या मागे राहतो, म्हणून परतीचा मार्ग जाणाऱ्याच्या वर पडतो, आणि दोन्ही मिळून एक क्षेत्रफळ घेरतात. तीन संख्या थेट वाचता येतात. धारणशीलता म्हणजे H शून्यावर परत आणल्यावर उरणारे B: पदार्थ जे लक्षात ठेवतो. निग्राहिता म्हणजे B ला शून्यापर्यंत ढकलण्यास लागणारे उलट क्षेत्र: त्याला विसरायला लावणे किती कठीण. आणि वळशाचे क्षेत्रफळ म्हणजे प्रति एकक घनफळ प्रति चक्र उष्णतेच्या रूपात गमावलेली ऊर्जा, कारण वळशाची फेरी ही अशी प्रक्रिया आहे जिच्यात प्रांतांच्या भिंती घर्षणाविरुद्ध हलतात आणि कार्य परत देत नाहीत. आता दोन उपयोग, ज्यांना उलट गोष्टी हव्या आहेत. मुख्य पुरवठ्याच्या ट्रान्सफॉर्मरचा गाभा चुंबकित, विचुंबकित, दुसऱ्या दिशेने चुंबकित आणि पुन्हा विचुंबकित होतो, दर सेकंदाला पन्नास वेळा, जोवर ट्रान्सफॉर्मर चालू आहे. त्यांतले प्रत्येक चक्र वळशाच्या क्षेत्रफळाइतकी उष्णता घेते, आणि ती उष्णता शुद्ध हानी आहे — ती गाभा तापवते, ती वाहून न्यावी लागते, आणि ती पुढच्या सर्व ग्राहकांच्या वीजबिलावर येते. म्हणून गाभ्याला सर्वांत लहान शक्य वळसा-क्षेत्रफळ हवे: कमी निग्राहिता, सहज पलटणारा, शक्य तितके कमी लक्षात ठेवणारा. मऊ लोखंड आणि सिलिकॉन पोलाद नेमके यासाठीच निवडले जातात, आणि तोच युक्तिवाद गाभ्याच्या इतर हानीही चालवतो — भोवरा धारा तोडणारे पापुद्रे ही वेगळी पण समांतर बचत आहे. लाउडस्पीकरच्या चुंबकाचे काम उलट आहे. तो कारखान्यात एकदा चुंबकित होतो आणि मग वीस वर्षे ते चुंबकन टिकवायचे आहे तर ध्वनिवेटोळ्याचे स्वतःचे क्षेत्र त्याच्यावर सेकंदाला हजारो वेळा ढकलते, तर स्पीकर पडतो, आणि तर पेटी तापते. जे काही सहज विचुंबकित होते ते निरुपयोगी. म्हणून त्याला उंच धारणशीलता हवी, जेणेकरून तो बाह्य मदतीविना तीव्र क्षेत्र ठेवेल, आणि उंच निग्राहिता, जेणेकरून भरकटलेली क्षेत्रे ते पुसू शकणार नाहीत — आणि ही दोन्ही मिळून नेमका रुंद वळसा आहे. ज्या हानीने रुंद वळसा ट्रान्सफॉर्मरमध्ये अस्वीकार्य केला ती इथे असंबद्ध आहे, कारण हा चुंबक पहिल्या वेळेनंतर आपल्या वळशाची फेरी मारतच नाही. उत्तराचा सर्वसाधारण आकार हाच आहे, आणि तो स्वतंत्रपणे सांगण्याजोगा आहे: शैथिल्य वळसा चांगला वा वाईट नसतो, आणि रुंद वळसा असल्याने पदार्थ चांगला वा वाईट होत नाही. वळसा हे वर्णन आहे, आणि तुम्हाला कोणते वर्णन हवे हे यावर अवलंबून की पदार्थ सतत चक्रित होणार आहे की एकदा जमवून सोडून द्यायचा आहे. (दुसरा पर्याय वळशाच्या रुंदीला क्षेत्राची तीव्रता वाचतो; तिसरा क्षेत्रफळ ही ऊर्जा आहे हे नाकारतो; चौथा बरोबर नेमणुकीपर्यंत असंबद्ध मार्गाने पोहोचतो, जे परीक्षेत चुकीच्या नेमणुकीहून अधिक मोलाचे नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Electromagnetic Induction                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-electromagnetic-induction",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 6 — Electromagnetic Induction",
      hi: "अध्याय 6 — वैद्युतचुंबकीय प्रेरण",
      mr: "प्रकरण 6 — विद्युतचुंबकीय प्रेरण",
    },
    name: {
      en: "Electromagnetic Induction",
      hi: "वैद्युतचुंबकीय प्रेरण",
      mr: "विद्युतचुंबकीय प्रेरण",
    },
    summary: {
      en: "The discovery that the traffic runs both ways: a current had already been shown to make a magnetic field, and here a magnetic field that CHANGES makes a current. What matters is the rate of change and not the size of the field, so a strong steady field does nothing at all while a weak one being swept past a coil does plenty; the direction of the induced current is fixed by the requirement that it oppose whatever produced it, which is energy conservation rather than a rule of thumb; a circuit turns out to induce a voltage in itself when its own current changes; and the same effect that runs every generator in the world also shows up as unwanted heat in a lump of metal near a changing field.",
      hi: "यह खोज कि यातायात दोनों दिशाओं में चलता है: धारा से चुंबकीय क्षेत्र बनना पहले ही दिखाया जा चुका था, और यहाँ बदलता हुआ चुंबकीय क्षेत्र धारा बनाता है। मायने परिवर्तन की दर रखती है, क्षेत्र का आकार नहीं, अतः प्रबल स्थिर क्षेत्र कुछ भी नहीं करता जबकि कुंडली के पास से गुज़ारा जाता कमज़ोर क्षेत्र बहुत कुछ करता है; प्रेरित धारा की दिशा इस माँग से तय होती है कि वह उसी का विरोध करे जिसने उसे बनाया, और यह अटकल का नियम नहीं बल्कि ऊर्जा संरक्षण है; कोई परिपथ अपनी ही धारा बदलने पर अपने भीतर वोल्टता प्रेरित करता निकलता है; और वही प्रभाव जो दुनिया का हर जनित्र चलाता है, बदलते क्षेत्र के पास पड़ी धातु के टुकड़े में अनचाही ऊष्मा बनकर भी प्रकट होता है।",
      mr: "हा शोध की वाहतूक दोन्ही दिशांनी चालते: धारेपासून चुंबकीय क्षेत्र बनते हे आधीच दाखवले गेले होते, आणि इथे बदलणारे चुंबकीय क्षेत्र धारा बनवते. महत्त्वाची असते बदलाची गती, क्षेत्राचा आकार नव्हे, म्हणून तीव्र स्थिर क्षेत्र काहीच करत नाही तर वेटोळ्याजवळून सरकवलेले क्षीण क्षेत्र बरेच काही करते; प्रेरित धारेची दिशा या मागणीने ठरते की तिने ज्याने तिला घडवले त्याचाच विरोध करावा, आणि हा अंदाजाचा नियम नसून ऊर्जा संधारण आहे; एखादा परिपथ स्वतःची धारा बदलल्यावर स्वतःतच व्होल्टेज प्रेरित करतो असे निघते; आणि तोच परिणाम जो जगातले प्रत्येक जनित्र चालवतो, बदलत्या क्षेत्राजवळ पडलेल्या धातूच्या तुकड्यात नकोशी उष्णता बनूनही प्रकट होतो.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "magnetic-flux",
        name: {
          en: "Magnetic flux",
          hi: "चुंबकीय फ्लक्स",
          mr: "चुंबकीय फ्लक्स",
        },
        kind: "quantity or effect",
        prompt: {
          en: "The quantity that counts how much field passes through a loop, which can be changed by altering the field, by altering the loop's area, or by simply turning the loop without touching either. What is it?",
          hi: "वह राशि जो गिनती है कि किसी लूप में से कितना क्षेत्र गुज़रता है, और जिसे क्षेत्र बदलकर, लूप का क्षेत्रफल बदलकर, या दोनों को छुए बिना बस लूप घुमाकर बदला जा सकता है। यह क्या है?",
          mr: "ती राशी जी मोजते की एखाद्या वळशातून किती क्षेत्र जाते, आणि जी क्षेत्र बदलून, वळशाचे क्षेत्रफळ बदलून, वा दोन्हींना स्पर्श न करता फक्त वळसा फिरवून बदलता येते. ती काय आहे?",
        },
        statement: {
          en: "Magnetic flux is Φ = BA cos θ, the product of the field, the area and the cosine of the angle between the field and the normal to the surface, and it is measured in webers.",
          hi: "चुंबकीय फ्लक्स Φ = BA cos θ है, अर्थात् क्षेत्र, क्षेत्रफल और क्षेत्र तथा पृष्ठ के अभिलंब के बीच के कोण की कोज्या का गुणनफल, और वह वेबर में नापा जाता है।",
          mr: "चुंबकीय फ्लक्स म्हणजे Φ = BA cos θ, म्हणजे क्षेत्र, क्षेत्रफळ आणि क्षेत्र व पृष्ठाचा लंब यांतील कोनाचा कोसाइन यांचा गुणाकार, आणि तो वेबरमध्ये मोजला जातो.",
        },
        detail: {
          en: "Three independent handles change it, and a question is usually testing which one is being turned: B, A or θ — a coil rotating in a steady field has both B and A fixed and still produces a changing flux.",
          hi: "तीन स्वतंत्र मुठ्ठे उसे बदलते हैं, और प्रश्न प्रायः यही जाँचता है कि कौन-सा घुमाया जा रहा है: B, A या θ — स्थिर क्षेत्र में घूमती कुंडली में B और A दोनों नियत हैं और फिर भी वह बदलता फ्लक्स बनाती है।",
          mr: "तीन स्वतंत्र मुठी तो बदलतात, आणि प्रश्न बहुधा हेच तपासतो की कोणती फिरवली जात आहे: B, A की θ — स्थिर क्षेत्रात फिरणाऱ्या वेटोळ्यात B आणि A दोन्ही स्थिर आहेत आणि तरीही ते बदलता फ्लक्स बनवते.",
        },
        extra: {
          en: "It is a scalar despite being built out of a vector, which is why fluxes through the turns of a coil simply add and a coil of N turns has flux linkage NΦ.",
          hi: "सदिश से बना होने के बावजूद यह अदिश है, इसीलिए कुंडली के फेरों से गुज़रते फ्लक्स बस जुड़ जाते हैं और N फेरों की कुंडली का फ्लक्स-बंधन NΦ होता है।",
          mr: "सदिशापासून बनलेला असूनही हा अदिश आहे, म्हणूनच वेटोळ्याच्या वेढ्यांतून जाणारे फ्लक्स फक्त जुळतात आणि N वेढ्यांच्या वेटोळ्याचे फ्लक्स-बंधन NΦ असते.",
        },
        pair: {
          left: {
            en: "Three handles: the field, the area, the angle",
            hi: "तीन मुठ्ठे: क्षेत्र, क्षेत्रफल, कोण",
            mr: "तीन मुठी: क्षेत्र, क्षेत्रफळ, कोन",
          },
          right: {
            en: "magnetic flux",
            hi: "चुंबकीय फ्लक्स",
            mr: "चुंबकीय फ्लक्स",
          },
        },
      },
      {
        id: "self-inductance",
        name: {
          en: "Self-inductance",
          hi: "स्वप्रेरकत्व",
          mr: "स्वयंप्रेरकत्व",
        },
        kind: "quantity or effect",
        prompt: {
          en: "A coil's own changing current changes its own flux, and the coil therefore opposes changes in the current flowing through it — sluggish to start and reluctant to stop. Which property measures this?",
          hi: "कुंडली की अपनी बदलती धारा उसका अपना फ्लक्स बदलती है, और इसलिए कुंडली अपने भीतर बहती धारा के परिवर्तनों का विरोध करती है — चलने में सुस्त और रुकने में अनिच्छुक। कौन-सा गुण इसे नापता है?",
          mr: "वेटोळ्याची स्वतःची बदलती धारा त्याचाच फ्लक्स बदलते, आणि म्हणून वेटोळे स्वतःतून वाहणाऱ्या धारेच्या बदलांना विरोध करते — सुरू व्हायला सुस्त आणि थांबायला नाखूश. कोणता गुणधर्म हे मोजतो?",
        },
        statement: {
          en: "Self-inductance L is the flux linkage per unit current, and it makes a coil produce a back-e.m.f. of −L dI/dt whenever its own current changes.",
          hi: "स्वप्रेरकत्व L प्रति एकांक धारा फ्लक्स-बंधन है, और वह कुंडली से −L dI/dt का प्रति-विद्युत वाहक बल पैदा करवाता है जब भी उसकी अपनी धारा बदले।",
          mr: "स्वयंप्रेरकत्व L म्हणजे प्रति एकक धारा फ्लक्स-बंधन, आणि ते वेटोळ्याकडून −L dI/dt इतके प्रति-विद्युतचालक बल निर्माण करवते जेव्हा जेव्हा त्याची स्वतःची धारा बदलेल.",
        },
        detail: {
          en: "It depends only on geometry and the core material, exactly as capacitance does, so a coil's inductance is fixed the moment it is wound and does not change with the current it happens to be carrying.",
          hi: "यह केवल ज्यामिति और क्रोड के पदार्थ पर निर्भर है, ठीक जैसे धारिता, अतः कुंडली का प्रेरकत्व लपेटते ही तय हो जाता है और उसमें जो धारा बह रही हो उससे नहीं बदलता।",
          mr: "हे केवळ भूमिती आणि गाभ्याच्या पदार्थावर अवलंबून आहे, अगदी धारितेप्रमाणे, म्हणून वेटोळ्याचे प्रेरकत्व गुंडाळताच ठरते आणि त्यात जी धारा वाहत असेल तिच्याने बदलत नाही.",
        },
        extra: {
          en: "The energy ½LI² is stored in the field rather than in the wire, which is why breaking the circuit of a large electromagnet draws an arc across the opening switch as that energy insists on going somewhere.",
          hi: "ऊर्जा ½LI² तार में नहीं बल्कि क्षेत्र में संचित होती है, इसीलिए बड़े विद्युत चुंबक का परिपथ तोड़ने पर खुलते स्विच के आर-पार चाप खिंच जाता है, क्योंकि वह ऊर्जा कहीं न कहीं जाने पर अड़ जाती है।",
          mr: "ऊर्जा ½LI² ही तारेत नव्हे तर क्षेत्रात साठते, म्हणूनच मोठ्या विद्युत चुंबकाचा परिपथ तोडल्यावर उघडणाऱ्या स्विचच्या आरपार चाप ओढला जातो, कारण ती ऊर्जा कुठेतरी जाण्यावर अडून बसते.",
        },
        pair: {
          left: {
            en: "Sluggish to start, reluctant to stop",
            hi: "चलने में सुस्त, रुकने में अनिच्छुक",
            mr: "सुरू व्हायला सुस्त, थांबायला नाखूश",
          },
          right: {
            en: "self-inductance",
            hi: "स्वप्रेरकत्व",
            mr: "स्वयंप्रेरकत्व",
          },
        },
      },
      {
        id: "eddy-currents",
        name: {
          en: "Eddy currents",
          hi: "भँवर धाराएँ",
          mr: "भोवरा धारा",
        },
        kind: "quantity or effect",
        prompt: {
          en: "A solid block of metal near a changing field has no wires and no circuit, yet loops of current swirl inside it, heating it and dragging on whatever is moving. What are these called?",
          hi: "बदलते क्षेत्र के पास धातु के ठोस टुकड़े में न तार हैं न परिपथ, फिर भी उसके भीतर धारा के लूप घूमते हैं, उसे गर्म करते और जो कुछ चल रहा हो उसे खींचते हैं। इन्हें क्या कहते हैं?",
          mr: "बदलत्या क्षेत्राजवळ धातूच्या घन तुकड्यात ना तारा आहेत ना परिपथ, तरीही त्याच्या आत धारेचे वळसे घुमतात, त्याला तापवतात आणि जे काही हलत असेल त्याला ओढतात. यांना काय म्हणतात?",
        },
        statement: {
          en: "Eddy currents are circulating currents induced within the body of a conductor by a changing flux, dissipating energy as heat and producing a force that opposes the relative motion.",
          hi: "भँवर धाराएँ वे परिक्रमा करती धाराएँ हैं जो बदलते फ्लक्स से चालक के पिंड के भीतर प्रेरित होती हैं, ऊर्जा को ऊष्मा के रूप में खपाती हैं और ऐसा बल बनाती हैं जो सापेक्ष गति का विरोध करता है।",
          mr: "भोवरा धारा म्हणजे बदलत्या फ्लक्सने वाहकाच्या शरीरात प्रेरित होणाऱ्या फिरत्या धारा, ज्या ऊर्जा उष्णतेच्या रूपात खर्चतात आणि सापेक्ष गतीला विरोध करणारे बल निर्माण करतात.",
        },
        detail: {
          en: "They are a nuisance in a transformer core and the whole point in an induction hob, so the same physics is engineered out of one device and engineered into the next.",
          hi: "ट्रांसफ़ॉर्मर की क्रोड में वे उपद्रव हैं और प्रेरण चूल्हे में वही सारा मक़सद, अतः वही भौतिकी एक युक्ति से निकाली जाती है और अगली में डाली जाती है।",
          mr: "ट्रान्सफॉर्मरच्या गाभ्यात त्या उपद्रव आहेत आणि प्रेरण शेगडीत तोच सगळा हेतू, म्हणून तीच भौतिकी एका साधनातून काढली जाते आणि पुढच्यात घातली जाते.",
        },
        extra: {
          en: "The cure where they are unwanted is to laminate the metal into thin sheets separated by insulation, which leaves the useful magnetic path intact while chopping the circulating paths into pieces too small to carry much current.",
          hi: "जहाँ वे अनचाही हैं वहाँ इलाज यह है कि धातु को विद्युतरोधी से अलग की गई पतली परतों में बाँट दिया जाए, जिससे काम का चुंबकीय पथ ज्यों का त्यों रहता है और परिक्रमा-पथ इतने छोटे टुकड़ों में कट जाते हैं कि अधिक धारा ले ही न सकें।",
          mr: "जिथे त्या नकोशा आहेत तिथे उपाय म्हणजे धातूला विद्युतरोधकाने वेगळ्या केलेल्या पातळ पापुद्र्यांत विभागणे, ज्यामुळे उपयुक्त चुंबकीय मार्ग जसाच्या तसा राहतो आणि फिरण्याचे मार्ग इतक्या लहान तुकड्यांत कापले जातात की जास्त धारा वाहूच शकत नाहीत.",
        },
        pair: {
          left: {
            en: "A nuisance in one machine, the whole point in the next",
            hi: "एक मशीन में उपद्रव, अगली में सारा मक़सद",
            mr: "एका यंत्रात उपद्रव, पुढच्यात सगळा हेतू",
          },
          right: {
            en: "eddy currents",
            hi: "भँवर धाराएँ",
            mr: "भोवरा धारा",
          },
        },
      },
      {
        id: "faradays-law",
        name: {
          en: "Faraday's law of induction",
          hi: "फैराडे का प्रेरण नियम",
          mr: "फॅरेडेचा प्रेरण नियम",
        },
        kind: "law of induction",
        prompt: {
          en: "A magnet held motionless inside a coil, however powerful, produces nothing; the same magnet moved produces a voltage, and moving it faster produces more. Which law says exactly this?",
          hi: "कुंडली के भीतर निश्चल पकड़ा चुंबक, चाहे कितना ही शक्तिशाली हो, कुछ नहीं देता; वही चुंबक हिलाने पर वोल्टता देता है, और तेज़ हिलाने पर अधिक। यह ठीक-ठीक कौन-सा नियम कहता है?",
          mr: "वेटोळ्याच्या आत निश्चल धरलेला चुंबक, कितीही शक्तिशाली असो, काहीच देत नाही; तोच चुंबक हलवल्यावर व्होल्टेज देतो, आणि जोरात हलवल्यावर अधिक. हे नेमके कोणता नियम सांगतो?",
        },
        statement: {
          en: "Faraday's law of induction states that the induced e.m.f. equals the negative rate of change of magnetic flux, ε = −dΦ/dt, so it is the rate and not the amount of flux that matters.",
          hi: "फैराडे का प्रेरण नियम कहता है कि प्रेरित विद्युत वाहक बल चुंबकीय फ्लक्स के परिवर्तन की ऋणात्मक दर के बराबर है, ε = −dΦ/dt, अतः मायने दर रखती है, फ्लक्स की मात्रा नहीं।",
          mr: "फॅरेडेचा प्रेरण नियम सांगतो की प्रेरित विद्युतचालक बल हे चुंबकीय फ्लक्सच्या बदलाच्या ऋण गतीइतके आहे, ε = −dΦ/dt, म्हणून महत्त्वाची असते गती, फ्लक्सचे प्रमाण नव्हे.",
        },
        detail: {
          en: "The law is indifferent to WHICH of the three handles is being turned: moving the magnet, squashing the loop and rotating the coil all count, and the same formula covers all three.",
          hi: "नियम को इससे मतलब नहीं कि तीनों मुठ्ठों में से कौन घुमाया जा रहा है: चुंबक हिलाना, लूप को दबाना और कुंडली घुमाना, सब गिने जाते हैं, और वही सूत्र तीनों को समेटता है।",
          mr: "नियमाला याच्याशी देणेघेणे नाही की तीन मुठींपैकी कोणती फिरवली जात आहे: चुंबक हलवणे, वळसा दाबणे आणि वेटोळे फिरवणे, सर्व मोजले जातात, आणि तेच सूत्र तिन्हींना सामावते.",
        },
        extra: {
          en: "For a coil of N turns the e.m.f. is N times larger, since each turn is a separate loop threaded by the same flux and their e.m.f.s are in series.",
          hi: "N फेरों की कुंडली के लिए विद्युत वाहक बल N गुना है, क्योंकि हर फेरा वही फ्लक्स समेटे अलग लूप है और उनके विद्युत वाहक बल श्रेणी में हैं।",
          mr: "N वेढ्यांच्या वेटोळ्यासाठी विद्युतचालक बल N पट आहे, कारण प्रत्येक वेढा तोच फ्लक्स सामावणारा वेगळा वळसा आहे आणि त्यांची विद्युतचालक बले श्रेणीत आहेत.",
        },
        pair: {
          left: {
            en: "Hold it still and nothing happens, however strong it is",
            hi: "स्थिर पकड़ो और कुछ नहीं होता, चाहे वह कितना ही प्रबल हो",
            mr: "स्थिर धरा आणि काहीच घडत नाही, तो कितीही तीव्र असो",
          },
          right: {
            en: "Faraday's law of induction",
            hi: "फैराडे का प्रेरण नियम",
            mr: "फॅरेडेचा प्रेरण नियम",
          },
        },
      },
      {
        id: "lenz-law",
        name: {
          en: "Lenz's law",
          hi: "लेंज़ का नियम",
          mr: "लेंझचा नियम",
        },
        kind: "law of induction",
        prompt: {
          en: "Push a north pole towards a coil and the coil's near face becomes a north pole to push back; pull it away and that face turns south to hold on. Which law fixes the direction like this?",
          hi: "उत्तर ध्रुव को कुंडली की ओर धकेलो और कुंडली का पास वाला फलक धकेलकर लौटाने को उत्तर ध्रुव बन जाता है; उसे खींचो और वही फलक पकड़े रखने को दक्षिण हो जाता है। दिशा को इस तरह कौन-सा नियम तय करता है?",
          mr: "उत्तर ध्रुव वेटोळ्याकडे ढकला आणि वेटोळ्याचा जवळचा पृष्ठभाग परत ढकलण्यासाठी उत्तर ध्रुव बनतो; तो ओढा आणि तोच पृष्ठभाग धरून ठेवण्यासाठी दक्षिण होतो. दिशा अशी कोणता नियम ठरवतो?",
        },
        statement: {
          en: "Lenz's law says the induced current always flows in the direction that opposes the change producing it, which is what the minus sign in Faraday's law stands for.",
          hi: "लेंज़ का नियम कहता है कि प्रेरित धारा सदा उस दिशा में बहती है जो उसे पैदा करने वाले परिवर्तन का विरोध करे, और फैराडे के नियम का ऋण चिह्न यही दर्शाता है।",
          mr: "लेंझचा नियम सांगतो की प्रेरित धारा नेहमी त्या दिशेने वाहते जी तिला घडवणाऱ्या बदलाला विरोध करते, आणि फॅरेडेच्या नियमातले ऋण चिन्ह हेच दर्शवते.",
        },
        detail: {
          en: "It is not an extra empirical rule but a consequence of energy conservation: a current helping the change would accelerate the magnet, which would induce more current, which would accelerate it further.",
          hi: "यह कोई अतिरिक्त प्रायोगिक नियम नहीं बल्कि ऊर्जा संरक्षण का परिणाम है: परिवर्तन में मदद करती धारा चुंबक को त्वरित करती, जो और धारा प्रेरित करती, जो उसे और त्वरित करती।",
          mr: "हा जादा प्रायोगिक नियम नसून ऊर्जा संधारणाचा परिणाम आहे: बदलाला मदत करणारी धारा चुंबकाला त्वरित करेल, जी अधिक धारा प्रेरित करेल, जी त्याला आणखी त्वरित करेल.",
        },
        extra: {
          en: "The opposition is what has to be paid for: the work done pushing the magnet against the induced repulsion is exactly the electrical energy that appears in the circuit, so a generator is hard to turn precisely when it is delivering power.",
          hi: "विरोध ही वह है जिसकी क़ीमत चुकानी पड़ती है: प्रेरित प्रतिकर्षण के विरुद्ध चुंबक धकेलने में किया गया कार्य ठीक वही विद्युत ऊर्जा है जो परिपथ में प्रकट होती है, अतः जनित्र को घुमाना ठीक तभी कठिन होता है जब वह शक्ति दे रहा हो।",
          mr: "विरोध हाच तो ज्याची किंमत मोजावी लागते: प्रेरित प्रतिकर्षणाविरुद्ध चुंबक ढकलण्यात केलेले कार्य नेमकी तीच विद्युत ऊर्जा आहे जी परिपथात प्रकट होते, म्हणून जनित्र फिरवणे नेमके तेव्हाच कठीण असते जेव्हा ते शक्ती देत असते.",
        },
        pair: {
          left: {
            en: "The minus sign, spelled out in words",
            hi: "शब्दों में लिखा हुआ ऋण चिह्न",
            mr: "शब्दांत मांडलेले ऋण चिन्ह",
          },
          right: {
            en: "Lenz's law",
            hi: "लेंज़ का नियम",
            mr: "लेंझचा नियम",
          },
        },
      },
      {
        id: "motional-emf",
        name: {
          en: "Motional e.m.f.",
          hi: "गतिक विद्युत वाहक बल",
          mr: "गतिक विद्युतचालक बल",
        },
        kind: "law of induction",
        prompt: {
          en: "A straight rod slid sideways across a field develops a voltage between its ends, and the same number Blv comes out whether you count the flux swept or push each free electron with the magnetic force. What is that voltage called?",
          hi: "क्षेत्र के आर-पार बग़ल में सरकाई गई सीधी छड़ के सिरों के बीच वोल्टता बन जाती है, और वही संख्या Blv निकलती है चाहे तुम बुहारा गया फ्लक्स गिनो या हर मुक्त इलेक्ट्रॉन को चुंबकीय बल से धकेलो। उस वोल्टता को क्या कहते हैं?",
          mr: "क्षेत्राच्या आरपार बाजूला सरकवलेल्या सरळ कांडीच्या टोकांमध्ये व्होल्टेज तयार होतो, आणि तीच संख्या Blv निघते मग तुम्ही झाडलेला फ्लक्स मोजा वा प्रत्येक मुक्त इलेक्ट्रॉनला चुंबकीय बलाने ढकला. त्या व्होल्टेजला काय म्हणतात?",
        },
        statement: {
          en: "Motional e.m.f. is the voltage ε = Blv induced across a conductor of length l moving with speed v perpendicular to a field B, and it arises from the magnetic force on the charges the conductor carries with it.",
          hi: "गतिक विद्युत वाहक बल वह वोल्टता ε = Blv है जो क्षेत्र B के लंबवत v चाल से चलती l लंबाई की चालक छड़ के आर-पार प्रेरित होती है, और वह उन आवेशों पर लगे चुंबकीय बल से उठती है जिन्हें चालक अपने साथ ले जाता है।",
          mr: "गतिक विद्युतचालक बल म्हणजे तो व्होल्टेज ε = Blv जो क्षेत्र B ला लंब v वेगाने जाणाऱ्या l लांबीच्या वाहकाच्या आरपार प्रेरित होतो, आणि तो वाहक स्वतःसोबत नेत असलेल्या प्रभारांवरील चुंबकीय बलातून उद्भवतो.",
        },
        detail: {
          en: "It is the one case where the flux rule and the Lorentz force can be checked against each other, and their agreement is what makes induction one phenomenon rather than two coincidences.",
          hi: "यही वह एक स्थिति है जहाँ फ्लक्स नियम और लॉरेंज़ बल को आपस में जाँचा जा सकता है, और उनका मिलना ही प्रेरण को दो संयोगों के बजाय एक परिघटना बनाता है।",
          mr: "हीच ती एक स्थिती जिथे फ्लक्स नियम आणि लॉरेन्ट्झ बल एकमेकांशी तपासता येतात, आणि त्यांचे जुळणेच प्रेरणाला दोन योगायोगांऐवजी एक घटना बनवते.",
        },
        extra: {
          en: "Once current flows, the rod carrying it feels BIL against its motion, so keeping the speed constant needs a steady applied force and the mechanical power supplied equals the electrical power dissipated exactly.",
          hi: "धारा बहते ही उसे ले जाती छड़ अपनी गति के विरुद्ध BIL अनुभव करती है, अतः चाल अचर रखने को लगातार बल लगाना पड़ता है और दी गई यांत्रिक शक्ति ठीक उसी विद्युत शक्ति के बराबर होती है जो खपती है।",
          mr: "धारा वाहू लागताच ती वाहणारी कांडी आपल्या गतीविरुद्ध BIL अनुभवते, म्हणून वेग अचल ठेवण्यास सतत बल लावावे लागते आणि दिलेली यांत्रिक शक्ती नेमकी तितक्याच खर्च होणाऱ्या विद्युत शक्तीइतकी असते.",
        },
        pair: {
          left: {
            en: "Two derivations, one answer",
            hi: "दो व्युत्पत्तियाँ, एक उत्तर",
            mr: "दोन उपपत्ती, एक उत्तर",
          },
          right: {
            en: "motional e.m.f.",
            hi: "गतिक विद्युत वाहक बल",
            mr: "गतिक विद्युतचालक बल",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A strong magnet dropped down a vertical copper pipe takes several seconds to fall a metre, while an identical unmagnetised slug of the same mass falls straight through. Copper is not magnetic. Explain the delay and say where the magnet's missing kinetic energy has gone.",
          hi: "ताँबे की खड़ी नली में गिराया गया प्रबल चुंबक एक मीटर गिरने में कई सेकंड लेता है, जबकि उसी द्रव्यमान का समरूप अचुंबकित टुकड़ा सीधा निकल जाता है। ताँबा चुंबकीय नहीं है। देरी समझाओ और बताओ कि चुंबक की लुप्त गतिज ऊर्जा कहाँ गई।",
          mr: "तांब्याच्या उभ्या नळीत टाकलेला तीव्र चुंबक एक मीटर पडायला कित्येक सेकंद घेतो, तर त्याच वस्तुमानाचा तसाच अचुंबकित तुकडा सरळ निघून जातो. तांबे चुंबकीय नाही. विलंब समजावा आणि चुंबकाची हरवलेली गतिज ऊर्जा कुठे गेली ते सांगा.",
        },
        choices: [
          {
            en: "As the magnet falls, the flux through each ring of copper around it changes, and eddy currents are induced in the pipe wall. By Lenz's law those currents must oppose the change, so the ring ahead of the magnet repels it and the ring behind attracts it — both forces act upwards. The magnet reaches a terminal velocity at which this retarding force equals its weight. The lost gravitational potential energy has become heat: the eddy currents dissipate I²R in the copper, and the pipe warms by a measurable amount. Copper's not being ferromagnetic is irrelevant; what matters is only that it conducts",
            hi: "चुंबक के गिरते हुए, उसके चारों ओर ताँबे के हर छल्ले से गुज़रता फ्लक्स बदलता है, और नली की दीवार में भँवर धाराएँ प्रेरित होती हैं। लेंज़ के नियम से उन धाराओं को परिवर्तन का विरोध करना ही है, अतः चुंबक के आगे वाला छल्ला उसे प्रतिकर्षित करता है और पीछे वाला आकर्षित — दोनों बल ऊपर की ओर लगते हैं। चुंबक उस सीमांत वेग पर पहुँच जाता है जहाँ यह अवरोधक बल उसके भार के बराबर हो। खोई गुरुत्वीय स्थितिज ऊर्जा ऊष्मा बन गई है: भँवर धाराएँ ताँबे में I²R खपाती हैं, और नली नापी जा सकने वाली मात्रा में गर्म होती है। ताँबे का लौहचुंबकीय न होना अप्रासंगिक है; मायने केवल यह रखता है कि वह चालक है",
            mr: "चुंबक पडत असताना, त्याच्याभोवतीच्या तांब्याच्या प्रत्येक कड्यातून जाणारा फ्लक्स बदलतो, आणि नळीच्या भिंतीत भोवरा धारा प्रेरित होतात. लेंझच्या नियमाने त्या धारांना बदलाला विरोध करावाच लागतो, म्हणून चुंबकाच्या पुढचे कडे त्याला प्रतिकर्षित करते आणि मागचे आकर्षित — दोन्ही बले वरच्या दिशेने लागतात. चुंबक त्या सीमांत वेगावर पोहोचतो जिथे हे अवरोधक बल त्याच्या वजनाइतके होते. गमावलेली गुरुत्वीय स्थितिज ऊर्जा उष्णता बनली आहे: भोवरा धारा तांब्यात I²R खर्चतात, आणि नळी मोजता येईल इतकी तापते. तांबे लोहचुंबकीय नसणे असंबद्ध आहे; महत्त्वाचे केवळ इतकेच की तो वाहक आहे",
          },
          {
            en: "Copper is weakly diamagnetic, and it is this diamagnetic repulsion that holds the magnet up as it falls",
            hi: "ताँबा कमज़ोर प्रतिचुंबकीय है, और यही प्रतिचुंबकीय प्रतिकर्षण गिरते समय चुंबक को थामे रखता है",
            mr: "तांबे क्षीण प्रतिचुंबकीय आहे, आणि हेच प्रतिचुंबकीय प्रतिकर्षण पडताना चुंबकाला धरून ठेवते",
          },
          {
            en: "Air trapped between the magnet and the pipe wall cannot escape quickly enough, and the magnet falls slowly for the same reason a piston does in a cylinder",
            hi: "चुंबक और नली की दीवार के बीच फँसी हवा पर्याप्त तेज़ी से नहीं निकल पाती, और चुंबक उसी कारण धीरे गिरता है जिस कारण सिलिंडर में पिस्टन",
            mr: "चुंबक आणि नळीच्या भिंतीमध्ये अडकलेली हवा पुरेशा वेगाने बाहेर पडू शकत नाही, आणि चुंबक त्याच कारणाने सावकाश पडतो ज्या कारणाने सिलिंडरमध्ये पिस्टन",
          },
          {
            en: "The induced currents store the energy in the pipe's magnetic field and give it back as the magnet leaves, so no energy is lost and only the timing changes",
            hi: "प्रेरित धाराएँ ऊर्जा को नली के चुंबकीय क्षेत्र में संचित कर लेती हैं और चुंबक के निकलते ही लौटा देती हैं, अतः कोई ऊर्जा नष्ट नहीं होती और केवल समय बदलता है",
            mr: "प्रेरित धारा ऊर्जा नळीच्या चुंबकीय क्षेत्रात साठवतात आणि चुंबक बाहेर पडताच परत देतात, म्हणून कोणतीही ऊर्जा नष्ट होत नाही आणि केवळ वेळ बदलतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The demonstration is worth doing because it looks like magic and is entirely Chapter 6. Note first what the control tells you: an unmagnetised slug of identical mass and shape falls normally, so the effect is not about mass, friction or air. It is about the magnet. Think of the copper pipe as a stack of closed conducting rings. As the magnet approaches a given ring, the flux through that ring increases; as it passes and recedes, the flux decreases. Faraday's law says a changing flux drives an e.m.f. in each ring, and because copper conducts and the rings are complete circuits, real currents flow — eddy currents. Now apply Lenz's law twice, once on each side of the magnet, and notice that both answers point the same way. In the ring AHEAD, the flux is increasing, so the induced current opposes the increase: that ring's field faces the magnet with a like pole and pushes it back, upwards. In the ring BEHIND, the flux is decreasing, so the induced current opposes the decrease: that ring's field faces the magnet with an unlike pole and pulls it back, also upwards. Nothing here is a coincidence. Lenz's law opposes CHANGE, and both approaching and receding are changes, so the force is retarding in both cases and the two contributions add. The motion settles into a terminal velocity. The retarding force grows with speed — faster fall, faster flux change, bigger e.m.f., bigger current, bigger force — so the magnet accelerates only until that force equals mg, and then descends steadily. This is the same mathematical shape as terminal velocity in a fluid, arrived at by a completely different mechanism. Now the energy, which is the part the question is really asking. The magnet has descended a metre and gained almost no kinetic energy, so mgh has gone somewhere. It has gone into the pipe as heat. The eddy currents are real currents in a real resistance, and they dissipate I²R; drop a strong magnet down a thin-walled pipe repeatedly and the pipe becomes perceptibly warm. Energy conservation is not merely respected here, it is the REASON for the direction: if the induced current had been the other way, the force would have accelerated the magnet, which would have induced more current, which would have accelerated it further — free energy from a dropped magnet. Lenz's law is what forbids that, and it is why the law is a consequence of conservation rather than a separate observation. Two checks confirm the mechanism. Use a plastic pipe of the same dimensions and the magnet falls freely, because no current can flow. Use a copper pipe with a slit cut along its whole length and the magnet falls almost freely too, because the slit breaks every ring and the circulating paths are gone — which is exactly the laminating trick used to suppress eddy currents in transformer cores. (The second option cites a real but far too feeble effect; the third invents a fluid explanation the plastic-pipe control refutes; the fourth makes the process reversible, which would leave the pipe cold and the magnet fast.)",
          hi: "यह प्रदर्शन करने योग्य है क्योंकि वह जादू लगता है और पूरा का पूरा छठा अध्याय है। पहले ध्यान दो कि नियंत्रण क्या बताता है: उसी द्रव्यमान और आकार का अचुंबकित टुकड़ा सामान्य ढंग से गिरता है, अतः प्रभाव द्रव्यमान, घर्षण या हवा का नहीं। वह चुंबक का है। ताँबे की नली को बंद चालक छल्लों की चट्टी समझो। जैसे-जैसे चुंबक किसी छल्ले के पास आता है, उस छल्ले से गुज़रता फ्लक्स बढ़ता है; जैसे-जैसे वह पार करके दूर जाता है, फ्लक्स घटता है। फैराडे का नियम कहता है कि बदलता फ्लक्स हर छल्ले में विद्युत वाहक बल चलाता है, और चूँकि ताँबा चालक है और छल्ले पूरे परिपथ हैं, असली धाराएँ बहती हैं — भँवर धाराएँ। अब लेंज़ का नियम दो बार लगाओ, चुंबक की हर ओर एक बार, और ध्यान दो कि दोनों उत्तर एक ही दिशा दिखाते हैं। आगे वाले छल्ले में फ्लक्स बढ़ रहा है, अतः प्रेरित धारा वृद्धि का विरोध करती है: उस छल्ले का क्षेत्र चुंबक की ओर समान ध्रुव करके उसे ऊपर की ओर लौटा धकेलता है। पीछे वाले छल्ले में फ्लक्स घट रहा है, अतः प्रेरित धारा कमी का विरोध करती है: उस छल्ले का क्षेत्र चुंबक की ओर विपरीत ध्रुव करके उसे पीछे खींचता है, वह भी ऊपर की ओर। यहाँ कुछ भी संयोग नहीं। लेंज़ का नियम परिवर्तन का विरोध करता है, और पास आना तथा दूर जाना दोनों परिवर्तन हैं, अतः दोनों स्थितियों में बल अवरोधक है और दोनों अंश जुड़ जाते हैं। गति सीमांत वेग पर जम जाती है। अवरोधक बल चाल के साथ बढ़ता है — तेज़ गिरना, तेज़ फ्लक्स परिवर्तन, बड़ा विद्युत वाहक बल, बड़ी धारा, बड़ा बल — अतः चुंबक तभी तक त्वरित होता है जब तक वह बल mg के बराबर न हो जाए, और फिर स्थिर चाल से उतरता है। यह द्रव में सीमांत वेग का वही गणितीय आकार है, जिस तक बिलकुल भिन्न क्रियाविधि से पहुँचा गया। अब ऊर्जा, जो प्रश्न वस्तुतः पूछ रहा है। चुंबक एक मीटर उतर चुका है और उसने लगभग कोई गतिज ऊर्जा नहीं पाई, अतः mgh कहीं गया है। वह नली में ऊष्मा बनकर गया है। भँवर धाराएँ असली प्रतिरोध में असली धाराएँ हैं, और वे I²R खपाती हैं; पतली दीवार वाली नली में प्रबल चुंबक बार-बार गिराओ और नली महसूस होने लायक़ गर्म हो जाती है। यहाँ ऊर्जा संरक्षण का केवल पालन नहीं होता, वही दिशा का कारण है: यदि प्रेरित धारा उलटी होती, तो बल चुंबक को त्वरित करता, जो और धारा प्रेरित करती, जो उसे और त्वरित करती — गिराए गए चुंबक से मुफ़्त ऊर्जा। लेंज़ का नियम वही है जो इसे मना करता है, और इसीलिए वह नियम अलग प्रेक्षण नहीं बल्कि संरक्षण का परिणाम है। दो जाँचें क्रियाविधि की पुष्टि करती हैं। उन्हीं मापों की प्लास्टिक नली लो और चुंबक स्वतंत्र रूप से गिरता है, क्योंकि कोई धारा बह ही नहीं सकती। पूरी लंबाई में चीरा लगी ताँबे की नली लो और चुंबक लगभग स्वतंत्र रूप से गिरता है, क्योंकि चीरा हर छल्ला तोड़ देता है और परिक्रमा-पथ ख़त्म हो जाते हैं — और ट्रांसफ़ॉर्मर की क्रोड में भँवर धाराएँ दबाने की परत वाली तरकीब ठीक यही है। (दूसरा विकल्प असली पर कहीं अधिक कमज़ोर प्रभाव गिनाता है; तीसरा तरल की व्याख्या गढ़ता है जिसे प्लास्टिक नली का नियंत्रण झुठला देता है; चौथा प्रक्रिया को उत्क्रमणीय बना देता है, जिससे नली ठंडी और चुंबक तेज़ रह जाता।)",
          mr: "हे प्रात्यक्षिक करण्याजोगे आहे कारण ते जादू वाटते आणि पूर्णपणे सहावे प्रकरण आहे. आधी लक्षात घ्या की नियंत्रण काय सांगते: त्याच वस्तुमानाचा आणि आकाराचा अचुंबकित तुकडा सामान्यपणे पडतो, म्हणून परिणाम वस्तुमान, घर्षण वा हवेचा नाही. तो चुंबकाचा आहे. तांब्याच्या नळीला बंद वाहक कड्यांची चळत समजा. चुंबक एखाद्या कड्याजवळ येताना, त्या कड्यातून जाणारा फ्लक्स वाढतो; तो ओलांडून दूर जाताना, फ्लक्स घटतो. फॅरेडेचा नियम सांगतो की बदलता फ्लक्स प्रत्येक कड्यात विद्युतचालक बल चालवतो, आणि तांबे वाहक असल्याने आणि कडी पूर्ण परिपथ असल्याने, खऱ्या धारा वाहतात — भोवरा धारा. आता लेंझचा नियम दोनदा लावा, चुंबकाच्या प्रत्येक बाजूला एकदा, आणि लक्षात घ्या की दोन्ही उत्तरे एकाच दिशेने दाखवतात. पुढच्या कड्यात फ्लक्स वाढत आहे, म्हणून प्रेरित धारा वाढीला विरोध करते: त्या कड्याचे क्षेत्र चुंबकाकडे सारखा ध्रुव करून त्याला वरच्या दिशेने परत ढकलते. मागच्या कड्यात फ्लक्स घटत आहे, म्हणून प्रेरित धारा घटीला विरोध करते: त्या कड्याचे क्षेत्र चुंबकाकडे विरुद्ध ध्रुव करून त्याला मागे ओढते, तेही वरच्या दिशेने. इथे काहीही योगायोग नाही. लेंझचा नियम बदलाला विरोध करतो, आणि जवळ येणे व दूर जाणे दोन्ही बदल आहेत, म्हणून दोन्ही स्थितींत बल अवरोधक आहे आणि दोन्ही वाटे जुळतात. गती सीमांत वेगावर स्थिरावते. अवरोधक बल वेगासोबत वाढते — जलद पडणे, जलद फ्लक्स बदल, मोठे विद्युतचालक बल, मोठी धारा, मोठे बल — म्हणून चुंबक तोवरच त्वरित होतो जोवर ते बल mg इतके होत नाही, आणि मग स्थिर वेगाने उतरतो. हा द्रवातील सीमांत वेगाचाच गणिती आकार आहे, ज्यापर्यंत पूर्णपणे वेगळ्या यंत्रणेने पोहोचले गेले. आता ऊर्जा, जी प्रश्न प्रत्यक्षात विचारत आहे. चुंबक एक मीटर उतरला आहे आणि त्याने जवळपास कोणतीही गतिज ऊर्जा मिळवली नाही, म्हणून mgh कुठेतरी गेले आहे. ते नळीत उष्णता बनून गेले आहे. भोवरा धारा खऱ्या रोधातल्या खऱ्या धारा आहेत, आणि त्या I²R खर्चतात; पातळ भिंतीच्या नळीत तीव्र चुंबक पुन्हा पुन्हा टाका आणि नळी जाणवण्याइतकी तापते. इथे ऊर्जा संधारणाचे केवळ पालन होत नाही, तेच दिशेचे कारण आहे: जर प्रेरित धारा उलटी असती, तर बलाने चुंबकाला त्वरित केले असते, ज्याने अधिक धारा प्रेरित केली असती, ज्याने त्याला आणखी त्वरित केले असते — टाकलेल्या चुंबकापासून फुकट ऊर्जा. लेंझचा नियम हाच तो जो हे वर्ज्य करतो, आणि म्हणूनच तो नियम वेगळे निरीक्षण नसून संधारणाचा परिणाम आहे. दोन तपासण्या यंत्रणेची खात्री देतात. त्याच मापांची प्लास्टिक नळी घ्या आणि चुंबक मुक्तपणे पडतो, कारण कोणतीही धारा वाहूच शकत नाही. संपूर्ण लांबीत चीर पडलेली तांब्याची नळी घ्या आणि चुंबक जवळपास मुक्तपणे पडतो, कारण चीर प्रत्येक कडे तोडते आणि फिरण्याचे मार्ग संपतात — आणि ट्रान्सफॉर्मरच्या गाभ्यात भोवरा धारा दाबण्याची पापुद्र्यांची युक्ती नेमकी हीच आहे. (दुसरा पर्याय खरा पण कितीतरी क्षीण परिणाम सांगतो; तिसरा द्रवाचे स्पष्टीकरण घडवतो जे प्लास्टिक नळीचे नियंत्रण खोडून काढते; चौथा प्रक्रिया परिवर्तनीय बनवतो, ज्याने नळी थंड आणि चुंबक वेगवान राहिला असता.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A rod of length l slides at constant speed v along frictionless rails in a field B, the circuit having resistance R. A student computes the e.m.f. two ways — from the flux swept out, and from the magnetic force on the electrons in the rod — and gets Blv both times, then asks whether this is a coincidence and where the electrical energy comes from.",
          hi: "l लंबाई की छड़ क्षेत्र B में घर्षणहीन पटरियों पर अचर चाल v से सरकती है, और परिपथ का प्रतिरोध R है। विद्यार्थी विद्युत वाहक बल दो तरह से निकालता है — बुहारे गए फ्लक्स से, और छड़ के इलेक्ट्रॉनों पर चुंबकीय बल से — और दोनों बार Blv पाता है, फिर पूछता है कि क्या यह संयोग है और विद्युत ऊर्जा कहाँ से आती है।",
          mr: "l लांबीची कांडी क्षेत्र B मध्ये घर्षणविरहित रुळांवर अचल वेग v ने सरकते, आणि परिपथाचा रोध R आहे. विद्यार्थी विद्युतचालक बल दोन प्रकारे काढतो — झाडलेल्या फ्लक्सवरून, आणि कांडीतल्या इलेक्ट्रॉनांवरील चुंबकीय बलावरून — आणि दोन्ही वेळा Blv मिळवतो, मग विचारतो की हा योगायोग आहे का आणि विद्युत ऊर्जा कुठून येते.",
        },
        choices: [
          {
            en: "It is not a coincidence but a consistency check that induction has to pass, and it does. The energy comes from whoever is pushing the rod. Once current I = Blv/R flows, the rod carries a current in a field and so feels a force BIl = B²l²v/R directed against its motion; keeping v constant therefore requires an applied force of exactly that size. The mechanical power supplied is Fv = B²l²v²/R, and the electrical power dissipated is ε²/R = B²l²v²/R — identical. The rails are frictionless, so nothing is lost anywhere else: this is a machine that converts mechanical work into electrical energy with the books balancing term by term, which is what a generator is",
            hi: "यह संयोग नहीं बल्कि वह संगति-जाँच है जो प्रेरण को पास करनी ही है, और वह करता है। ऊर्जा उससे आती है जो छड़ को धकेल रहा है। धारा I = Blv/R बहते ही, छड़ क्षेत्र में धारा ले जाती है और इसलिए अपनी गति के विरुद्ध BIl = B²l²v/R बल अनुभव करती है; अतः v को अचर रखने के लिए ठीक उतना ही लगाया गया बल चाहिए। दी गई यांत्रिक शक्ति Fv = B²l²v²/R है, और खपने वाली विद्युत शक्ति ε²/R = B²l²v²/R — एक जैसी। पटरियाँ घर्षणहीन हैं, अतः और कहीं कुछ नष्ट नहीं होता: यह वह मशीन है जो यांत्रिक कार्य को विद्युत ऊर्जा में बदलती है और बहीखाता पद-दर-पद बराबर बैठता है, और जनित्र यही है",
            mr: "हा योगायोग नसून ती सुसंगती-चाचणी आहे जी प्रेरणाला उत्तीर्ण व्हावीच लागते, आणि तो होतो. ऊर्जा त्याच्याकडून येते जो कांडी ढकलत आहे. धारा I = Blv/R वाहू लागताच, कांडी क्षेत्रात धारा वाहते आणि म्हणून आपल्या गतीविरुद्ध BIl = B²l²v/R इतके बल अनुभवते; म्हणून v अचल ठेवण्यास नेमके तितकेच लावलेले बल लागते. दिलेली यांत्रिक शक्ती Fv = B²l²v²/R आहे, आणि खर्च होणारी विद्युत शक्ती ε²/R = B²l²v²/R — सारखीच. रूळ घर्षणविरहित आहेत, म्हणून इतरत्र कुठेही काहीही नष्ट होत नाही: हे ते यंत्र आहे जे यांत्रिक कार्याचे विद्युत ऊर्जेत रूपांतर करते आणि जमाखर्च पदावर पद जुळतो, आणि जनित्र हेच आहे",
          },
          {
            en: "It is a coincidence of this particular geometry; in general the flux rule and the Lorentz force give different answers, and the flux rule is the more reliable of the two",
            hi: "यह इसी विशेष ज्यामिति का संयोग है; सामान्यतः फ्लक्स नियम और लॉरेंज़ बल भिन्न उत्तर देते हैं, और दोनों में फ्लक्स नियम अधिक भरोसेमंद है",
            mr: "हा याच विशिष्ट भूमितीचा योगायोग आहे; सर्वसाधारणपणे फ्लक्स नियम आणि लॉरेन्ट्झ बल वेगळी उत्तरे देतात, आणि दोहोंत फ्लक्स नियम अधिक विश्वासार्ह आहे",
          },
          {
            en: "The energy comes from the magnetic field, which is gradually used up as the rod slides and must eventually be replenished",
            hi: "ऊर्जा चुंबकीय क्षेत्र से आती है, जो छड़ के सरकने के साथ धीरे-धीरे ख़र्च होता है और अंततः फिर भरना पड़ता है",
            mr: "ऊर्जा चुंबकीय क्षेत्रातून येते, जे कांडी सरकताना हळूहळू खर्च होते आणि अखेरीस पुन्हा भरावे लागते",
          },
          {
            en: "No external force is needed because the rails are frictionless, so the electrical energy appears without any work being done — this is the one case where energy conservation genuinely fails",
            hi: "किसी बाहरी बल की ज़रूरत नहीं क्योंकि पटरियाँ घर्षणहीन हैं, अतः बिना कोई कार्य हुए विद्युत ऊर्जा प्रकट होती है — यही वह एक स्थिति है जहाँ ऊर्जा संरक्षण सचमुच विफल हो जाता है",
            mr: "कोणत्याही बाह्य बलाची गरज नाही कारण रूळ घर्षणविरहित आहेत, म्हणून कोणतेही कार्य न होता विद्युत ऊर्जा प्रकट होते — हीच ती एक स्थिती जिथे ऊर्जा संधारण खरोखर अपयशी ठरते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Take the two derivations first, because seeing why they must agree is half the answer. THE FLUX ROUTE. In time dt the rod moves v dt, and the circuit's area grows by l·v dt, so the flux grows by dΦ = B l v dt. Faraday's law gives |ε| = dΦ/dt = Blv. Nothing here mentions charges at all; the argument is about the geometry of a circuit whose area is changing. THE FORCE ROUTE. Every free electron in the rod is carried sideways at speed v through the field, so it feels a magnetic force qvB along the rod. Charges pile up at the ends until the electric field they create balances that force, which happens when E = vB, and the potential difference across a length l is then El = Blv. Nothing here mentions flux; the argument is about individual charges obeying the Lorentz force. Two entirely different pictures, one answer. That is a demand physics makes on itself: induction is one phenomenon, so any two legitimate ways of computing the same measurable number must land on the same value, and if they had not, one of the two laws would have been wrong. It is worth adding the honest caveat that the flux rule is a rule and not a fundamental law — there are contrived arrangements (a rocking plate contact, a disc with a sliding brush) where applying the flux rule carelessly gives the wrong answer and the Lorentz force plus Faraday's law in field form gives the right one. But in the ordinary cases of this chapter the two agree exactly, as here. NOW THE ENERGY, which is what the question is really after. The circuit dissipates ε²/R = B²l²v²/R watts in the resistance. That energy is real; the resistor gets warm. It cannot come from nowhere, and the rails are frictionless, so the only candidate is whoever keeps the rod moving. Follow the chain. The e.m.f. drives a current I = Blv/R through the rod. The rod is now a current-carrying conductor sitting in a magnetic field, so from Chapter 4 it experiences a force F = BIl. Substituting, F = B²l²v/R. By Lenz's law this force must oppose the motion, and it does — it points backwards along the rails. So to keep the speed constant an external agent must push with an equal forward force, and the mechanical power supplied is P = Fv = B²l²v²/R. Compare that with the electrical power dissipated, B²l²v²/R. They are the same expression. Not approximately, not on average — identically, term for term. This is the whole content of a generator, stated in one line: mechanical work in, electrical energy out, and Lenz's law as the mechanism that charges you for it. Three consequences fall out immediately. Open the circuit and R becomes infinite: no current, no retarding force, and the rod slides freely — a generator on no load is easy to turn. Short the rails and R becomes small: a huge current, a huge retarding force, and the rod is almost impossible to push — which is exactly why a bicycle dynamo makes pedalling harder the moment the lamp is switched on, and why a power station burns more coal when the city switches on its lights. (The second option denies a consistency that is demonstrable here; the third treats a static field as a fuel tank, when the field does no work at all; the fourth abandons conservation instead of looking for the agent doing the work.)",
          hi: "पहले दोनों व्युत्पत्तियाँ लो, क्योंकि यह देखना कि उन्हें मिलना ही क्यों है, आधा उत्तर है। फ्लक्स वाला रास्ता। समय dt में छड़ v dt चलती है, और परिपथ का क्षेत्रफल l·v dt बढ़ता है, अतः फ्लक्स dΦ = B l v dt बढ़ता है। फैराडे का नियम देता है |ε| = dΦ/dt = Blv. यहाँ आवेशों का ज़िक्र ही नहीं; तर्क ऐसे परिपथ की ज्यामिति का है जिसका क्षेत्रफल बदल रहा है। बल वाला रास्ता। छड़ का हर मुक्त इलेक्ट्रॉन v चाल से क्षेत्र में से बग़ल में ले जाया जाता है, अतः वह छड़ के अनुदिश qvB बल अनुभव करता है। सिरों पर आवेश तब तक जमा होते हैं जब तक उनका बनाया विद्युत क्षेत्र उस बल को संतुलित न कर दे, जो तब होता है जब E = vB, और तब l लंबाई के आर-पार विभवांतर El = Blv है। यहाँ फ्लक्स का ज़िक्र नहीं; तर्क लॉरेंज़ बल मानते अलग-अलग आवेशों का है। दो बिलकुल भिन्न चित्र, एक उत्तर। यह माँग भौतिकी अपने से करती है: प्रेरण एक परिघटना है, अतः वही नापी जा सकने वाली संख्या निकालने के किन्हीं दो जायज़ रास्तों को एक ही मान पर उतरना ही चाहिए, और यदि न उतरते तो दोनों नियमों में से एक ग़लत होता। ईमानदार चेतावनी जोड़नी चाहिए कि फ्लक्स नियम नियम है, मूल नियम नहीं — ऐसी गढ़ी हुई व्यवस्थाएँ हैं (हिलता प्लेट-संपर्क, सरकते ब्रश वाली चकती) जहाँ फ्लक्स नियम लापरवाही से लगाने पर ग़लत उत्तर आता है और लॉरेंज़ बल तथा क्षेत्र-रूप में लिखा फैराडे का नियम सही देता है। पर इस अध्याय की साधारण स्थितियों में दोनों ठीक-ठीक मिलते हैं, जैसे यहाँ। अब ऊर्जा, जो प्रश्न वस्तुतः चाहता है। परिपथ प्रतिरोध में ε²/R = B²l²v²/R वाट खपाता है। वह ऊर्जा असली है; प्रतिरोधक गर्म होता है। वह कहीं से आ नहीं सकती, और पटरियाँ घर्षणहीन हैं, अतः एकमात्र उम्मीदवार वही है जो छड़ को चलाए रखता है। शृंखला का पीछा करो। विद्युत वाहक बल छड़ में से I = Blv/R धारा चलाता है। छड़ अब चुंबकीय क्षेत्र में बैठा धारावाही चालक है, अतः चौथे अध्याय से वह F = BIl बल अनुभव करती है। रखने पर F = B²l²v/R. लेंज़ के नियम से इस बल को गति का विरोध करना ही है, और वह करता है — वह पटरियों के अनुदिश पीछे की ओर है। अतः चाल अचर रखने को बाहरी कर्ता को उतने ही आगे के बल से धकेलना पड़ता है, और दी गई यांत्रिक शक्ति P = Fv = B²l²v²/R है। उसकी खपने वाली विद्युत शक्ति B²l²v²/R से तुलना करो। वे वही व्यंजक हैं। लगभग नहीं, औसतन नहीं — सर्वसमतः, पद-दर-पद। जनित्र का पूरा सार यही है, एक पंक्ति में: यांत्रिक कार्य भीतर, विद्युत ऊर्जा बाहर, और लेंज़ का नियम वह क्रियाविधि जो तुमसे उसका दाम वसूलती है। तीन परिणाम तुरंत निकलते हैं। परिपथ खोल दो और R अनंत हो जाता है: कोई धारा नहीं, कोई अवरोधक बल नहीं, और छड़ स्वतंत्र सरकती है — बिना लोड जनित्र घुमाना आसान है। पटरियाँ शॉर्ट कर दो और R छोटा हो जाता है: विशाल धारा, विशाल अवरोधक बल, और छड़ को धकेलना लगभग असंभव — और ठीक इसीलिए साइकिल की डायनमो बत्ती जलते ही पैडल कठिन कर देती है, और इसीलिए शहर के बत्तियाँ जलाते ही बिजलीघर अधिक कोयला जलाता है। (दूसरा विकल्प उस संगति से इनकार करता है जो यहाँ दिखाई जा सकती है; तीसरा स्थिर क्षेत्र को ईंधन की टंकी मान लेता है, जबकि क्षेत्र कोई कार्य करता ही नहीं; चौथा कार्य करने वाले कर्ता को ढूँढ़ने के बजाय संरक्षण छोड़ देता है।)",
          mr: "आधी दोन्ही उपपत्ती घ्या, कारण त्या जुळल्याच पाहिजेत हे पाहणे अर्धे उत्तर आहे. फ्लक्सचा मार्ग. dt काळात कांडी v dt हलते, आणि परिपथाचे क्षेत्रफळ l·v dt ने वाढते, म्हणून फ्लक्स dΦ = B l v dt ने वाढतो. फॅरेडेचा नियम देतो |ε| = dΦ/dt = Blv. इथे प्रभारांचा उल्लेखच नाही; युक्तिवाद अशा परिपथाच्या भूमितीचा आहे ज्याचे क्षेत्रफळ बदलत आहे. बलाचा मार्ग. कांडीतला प्रत्येक मुक्त इलेक्ट्रॉन v वेगाने क्षेत्रातून बाजूला नेला जातो, म्हणून त्याला कांडीच्या दिशेने qvB बल जाणवते. टोकांवर प्रभार तोवर साठतात जोवर त्यांनी बनवलेले विद्युत क्षेत्र त्या बलाला तोलत नाही, जे तेव्हा घडते जेव्हा E = vB, आणि मग l लांबीच्या आरपार विभवांतर El = Blv आहे. इथे फ्लक्सचा उल्लेख नाही; युक्तिवाद लॉरेन्ट्झ बल मानणाऱ्या वेगवेगळ्या प्रभारांचा आहे. दोन पूर्णपणे वेगळी चित्रे, एक उत्तर. ही मागणी भौतिकी स्वतःकडून करते: प्रेरण ही एक घटना आहे, म्हणून तीच मोजता येणारी संख्या काढण्याच्या कोणत्याही दोन रास्त मार्गांना एकाच मूल्यावर उतरावेच लागते, आणि उतरले नसते तर दोन नियमांपैकी एक चूक ठरला असता. प्रामाणिक इशारा जोडायला हवा की फ्लक्स नियम हा नियम आहे, मूलभूत नियम नव्हे — अशा घडवलेल्या मांडण्या आहेत (डुलणारा पट्टी-संपर्क, सरकत्या ब्रशची तबकडी) जिथे फ्लक्स नियम निष्काळजीपणे लावल्यास चुकीचे उत्तर येते आणि लॉरेन्ट्झ बल तसेच क्षेत्र-रूपात लिहिलेला फॅरेडेचा नियम बरोबर देतो. पण या प्रकरणाच्या साध्या स्थितींत दोन्ही नेमके जुळतात, जसे इथे. आता ऊर्जा, जी प्रश्नाला प्रत्यक्षात हवी आहे. परिपथ रोधात ε²/R = B²l²v²/R वॅट खर्चतो. ती ऊर्जा खरी आहे; रोधक तापतो. ती कुठूनही येऊ शकत नाही, आणि रूळ घर्षणविरहित आहेत, म्हणून एकमेव उमेदवार तोच जो कांडी चालवत ठेवतो. साखळीचा मागोवा घ्या. विद्युतचालक बल कांडीतून I = Blv/R धारा चालवते. कांडी आता चुंबकीय क्षेत्रात बसलेला धारावाही वाहक आहे, म्हणून चौथ्या प्रकरणावरून तिला F = BIl बल जाणवते. ठेवल्यास F = B²l²v/R. लेंझच्या नियमाने या बलाला गतीला विरोध करावाच लागतो, आणि तो करतो — ते रुळांच्या दिशेने मागे आहे. म्हणून वेग अचल ठेवण्यास बाह्य कर्त्याला तितक्याच पुढच्या बलाने ढकलावे लागते, आणि दिलेली यांत्रिक शक्ती P = Fv = B²l²v²/R आहे. तिची खर्च होणाऱ्या विद्युत शक्ती B²l²v²/R शी तुलना करा. ती तीच पदावली आहेत. जवळपास नाही, सरासरीने नाही — सर्वसमतः, पदावर पद. जनित्राचा अख्खा आशय हाच, एका ओळीत: यांत्रिक कार्य आत, विद्युत ऊर्जा बाहेर, आणि लेंझचा नियम ती यंत्रणा जी तुमच्याकडून त्याची किंमत वसूल करते. तीन परिणाम लगेच निघतात. परिपथ उघडा आणि R अनंत होतो: धारा नाही, अवरोधक बल नाही, आणि कांडी मुक्तपणे सरकते — भाराविना जनित्र फिरवणे सोपे. रूळ शॉर्ट करा आणि R लहान होतो: प्रचंड धारा, प्रचंड अवरोधक बल, आणि कांडी ढकलणे जवळपास अशक्य — आणि नेमके म्हणूनच सायकलचा डायनामो दिवा लावताच पायडल कठीण करतो, आणि म्हणूनच शहराने दिवे लावताच वीजकेंद्र अधिक कोळसा जाळते. (दुसरा पर्याय इथे दाखवता येणारी सुसंगती नाकारतो; तिसरा स्थिर क्षेत्राला इंधनाची टाकी मानतो, तर क्षेत्र कोणतेही कार्य करतच नाही; चौथा कार्य करणारा कर्ता शोधण्याऐवजी संधारण सोडून देतो.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Alternating Current                                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-alternating-current",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 7 — Alternating Current",
      hi: "अध्याय 7 — प्रत्यावर्ती धारा",
      mr: "प्रकरण 7 — प्रत्यावर्ती धारा",
    },
    name: {
      en: "Alternating Current",
      hi: "प्रत्यावर्ती धारा",
      mr: "प्रत्यावर्ती धारा",
    },
    summary: {
      en: "A current that reverses a hundred times a second and therefore averages to nothing, quoted instead by the steady value that would heat a resistor equally; components that impede it without ever dissipating anything, because they hand energy back in the quarter-cycle after they take it; two such opposing components that can be made to cancel exactly, leaving a circuit that answers one frequency and ignores the rest; a voltage that can be traded for current with almost no loss, which is the only reason power can be generated hundreds of kilometres from where it is used; and a factory whose meter and whose cables disagree about how much current it is really costing the grid.",
      hi: "ऐसी धारा जो सेकंड में सौ बार उलटती है और इसलिए औसत में शून्य हो जाती है, और इसीलिए उस स्थिर मान से बताई जाती है जो प्रतिरोधक को उतना ही गर्म करता; ऐसे पुर्ज़े जो उसे रोकते हैं पर कुछ भी खपाते नहीं, क्योंकि जो लेते हैं वह अगले चौथाई चक्र में लौटा देते हैं; ऐसे दो विरोधी पुर्ज़े जिन्हें ठीक-ठीक कटवाया जा सकता है, जिससे ऐसा परिपथ बचता है जो एक आवृत्ति को उत्तर देता है और बाक़ी की अनसुनी कर देता है; ऐसी वोल्टता जिसे लगभग बिना हानि धारा से बदला जा सकता है, और केवल इसी कारण बिजली वहाँ से सैकड़ों किलोमीटर दूर बन सकती है जहाँ वह काम आती है; और ऐसा कारख़ाना जिसका मीटर और जिसके तार इस बात पर असहमत हैं कि वह ग्रिड को वस्तुतः कितनी धारा का ख़र्च दे रहा है।",
      mr: "अशी धारा जी सेकंदाला शंभर वेळा उलटते आणि म्हणून सरासरीत शून्य होते, आणि म्हणूनच त्या स्थिर मूल्याने सांगितली जाते जे रोधकाला तितकेच तापवेल; असे घटक जे तिला अडवतात पण काहीही खर्चत नाहीत, कारण जे घेतात ते पुढच्या चतुर्थांश चक्रात परत देतात; असे दोन विरोधी घटक ज्यांना नेमके कापता येते, ज्यातून असा परिपथ उरतो जो एका वारंवारतेला उत्तर देतो आणि बाकीच्यांकडे दुर्लक्ष करतो; असा व्होल्टेज ज्याची जवळपास हानीविना धारेशी अदलाबदल करता येते, आणि केवळ याच कारणाने वीज तिथून शेकडो किलोमीटर दूर बनू शकते जिथे ती वापरली जाते; आणि असा कारखाना ज्याचे मीटर आणि ज्याच्या तारा यावर असहमत आहेत की तो ग्रिडला प्रत्यक्षात किती धारेचा खर्च देत आहे.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "rms-value",
        name: {
          en: "The root mean square value",
          hi: "वर्ग माध्य मूल मान",
          mr: "वर्ग माध्य मूळ मूल्य",
        },
        kind: "defined quantity",
        prompt: {
          en: "The plain average of an alternating current over a cycle is zero, yet the wire certainly gets hot, so the quantity actually quoted is the steady current that would produce the same heating. What is that quantity called?",
          hi: "एक चक्र पर प्रत्यावर्ती धारा का सादा औसत शून्य है, फिर भी तार निश्चय ही गर्म होता है, अतः वस्तुतः वह राशि बताई जाती है जो उतना ही तापन देने वाली स्थिर धारा हो। उस राशि को क्या कहते हैं?",
          mr: "एका चक्रावर प्रत्यावर्ती धारेची साधी सरासरी शून्य आहे, तरीही तार नक्कीच तापते, म्हणून प्रत्यक्षात ती राशी सांगितली जाते जी तितकेच तापन देणारी स्थिर धारा असेल. त्या राशीला काय म्हणतात?",
        },
        statement: {
          en: "The root mean square value is the steady current or voltage that would dissipate the same power in a resistor, and for a sinusoid it is the peak value divided by √2.",
          hi: "वर्ग माध्य मूल मान वह स्थिर धारा या वोल्टता है जो प्रतिरोधक में उतनी ही शक्ति खपाती, और ज्यावक्रीय के लिए वह शिखर मान बटा √2 है।",
          mr: "वर्ग माध्य मूळ मूल्य म्हणजे ती स्थिर धारा वा व्होल्टेज जी रोधकात तितकीच शक्ती खर्चेल, आणि ज्यावक्रीयासाठी ते शिखर मूल्य भागिले √2 आहे.",
        },
        detail: {
          en: "The squaring is what saves the definition: the current is negative half the time but its SQUARE never is, so the mean of the square is honestly positive and the root restores the original units.",
          hi: "वर्ग करना ही परिभाषा को बचाता है: धारा आधे समय ऋणात्मक है पर उसका वर्ग कभी नहीं, अतः वर्ग का माध्य ईमानदारी से धनात्मक है और मूल मूल मात्रक लौटा देता है।",
          mr: "वर्ग करणेच व्याख्येला वाचवते: धारा अर्धा वेळ ऋण असते पण तिचा वर्ग कधीच नाही, म्हणून वर्गाचा माध्य प्रामाणिकपणे धन आहे आणि मूळ मूळ एकके परत आणते.",
        },
        extra: {
          en: "The 220 V of a domestic supply is an rms figure, so the insulation must actually survive a peak of about 311 V, which is why a component's voltage rating and the supply's stated voltage are not the same number.",
          hi: "घरेलू आपूर्ति के 220 V वर्ग माध्य मूल आँकड़ा है, अतः विद्युतरोधन को वस्तुतः लगभग 311 V का शिखर झेलना पड़ता है, इसीलिए किसी पुर्ज़े का वोल्टता निर्धारण और आपूर्ति की बताई वोल्टता एक ही संख्या नहीं हैं।",
          mr: "घरगुती पुरवठ्याचे 220 V हा वर्ग माध्य मूळ आकडा आहे, म्हणून विद्युतरोधनाला प्रत्यक्षात सुमारे 311 V चे शिखर सोसावे लागते, म्हणूनच एखाद्या घटकाचे व्होल्टेज निर्धारण आणि पुरवठ्याचा सांगितलेला व्होल्टेज एकच संख्या नाहीत.",
        },
        pair: {
          left: {
            en: "The steady current that would heat the wire equally",
            hi: "वह स्थिर धारा जो तार को उतना ही गर्म करती",
            mr: "ती स्थिर धारा जी तारेला तितकेच तापवेल",
          },
          right: {
            en: "the root mean square value",
            hi: "वर्ग माध्य मूल मान",
            mr: "वर्ग माध्य मूळ मूल्य",
          },
        },
      },
      {
        id: "reactance",
        name: {
          en: "Reactance",
          hi: "प्रतिघात",
          mr: "प्रतिघात",
        },
        kind: "defined quantity",
        prompt: {
          en: "An inductor and a capacitor each limit the current in an a.c. circuit and each is measured in ohms, yet neither gets warm and neither consumes any energy over a full cycle. What is this kind of opposition called?",
          hi: "प्रेरक और संधारित्र दोनों प्रत्यावर्ती परिपथ में धारा सीमित करते हैं और दोनों ओम में नापे जाते हैं, फिर भी न कोई गर्म होता है न पूरे चक्र पर कोई ऊर्जा खपाता है। इस तरह के विरोध को क्या कहते हैं?",
          mr: "प्रेरक आणि धारित्र दोन्ही प्रत्यावर्ती परिपथात धारा मर्यादित करतात आणि दोन्ही ओहममध्ये मोजले जातात, तरीही ना कोणी तापतो ना पूर्ण चक्रावर कोणी ऊर्जा खर्चतो. अशा विरोधाला काय म्हणतात?",
        },
        statement: {
          en: "Reactance is the opposition to alternating current offered by an inductor or capacitor without dissipation, being X_L = ωL for an inductor and X_C = 1/ωC for a capacitor.",
          hi: "प्रतिघात प्रेरक या संधारित्र द्वारा बिना क्षय दिया गया प्रत्यावर्ती धारा का विरोध है, जो प्रेरक के लिए X_L = ωL और संधारित्र के लिए X_C = 1/ωC है।",
          mr: "प्रतिघात म्हणजे प्रेरक वा धारित्राने क्षयाविना दिलेला प्रत्यावर्ती धारेचा विरोध, जो प्रेरकासाठी X_L = ωL आणि धारित्रासाठी X_C = 1/ωC आहे.",
        },
        detail: {
          en: "The two behave in opposite ways as the frequency rises: an inductor blocks more and more, a capacitor blocks less and less, and at zero frequency the first is a plain wire and the second a broken circuit.",
          hi: "आवृत्ति बढ़ने पर दोनों उलटे ढंग से बरतते हैं: प्रेरक अधिकाधिक रोकता है, संधारित्र कमोकम, और शून्य आवृत्ति पर पहला सादा तार है और दूसरा टूटा परिपथ।",
          mr: "वारंवारता वाढताना दोन्ही उलट प्रकारे वागतात: प्रेरक अधिकाधिक अडवतो, धारित्र कमीकमी, आणि शून्य वारंवारतेवर पहिला साधी तार आहे आणि दुसरा तुटलेला परिपथ.",
        },
        extra: {
          en: "Nothing is dissipated because the current and voltage are a quarter of a cycle apart, so energy taken from the source in one quarter is handed straight back in the next.",
          hi: "कुछ भी नहीं खपता क्योंकि धारा और वोल्टता चक्र के चौथाई भाग से अलग हैं, अतः एक चौथाई में स्रोत से ली गई ऊर्जा अगले में सीधे लौटा दी जाती है।",
          mr: "काहीही खर्च होत नाही कारण धारा आणि व्होल्टेज चक्राच्या चतुर्थांशाने वेगळे आहेत, म्हणून एका चतुर्थांशात स्रोताकडून घेतलेली ऊर्जा पुढच्यात थेट परत दिली जाते.",
        },
        pair: {
          left: {
            en: "Measured in ohms, and never gets warm",
            hi: "ओम में नापा जाता है, और कभी गर्म नहीं होता",
            mr: "ओहममध्ये मोजला जातो, आणि कधीच तापत नाही",
          },
          right: {
            en: "reactance",
            hi: "प्रतिघात",
            mr: "प्रतिघात",
          },
        },
      },
      {
        id: "power-factor",
        name: {
          en: "Power factor",
          hi: "शक्ति गुणांक",
          mr: "शक्ती गुणक",
        },
        kind: "defined quantity",
        prompt: {
          en: "Multiplying the rms voltage by the rms current gives a number that is generally larger than the power actually consumed, and the ratio between the two depends on how far the current lags or leads the voltage. What is that ratio called?",
          hi: "वर्ग माध्य मूल वोल्टता को वर्ग माध्य मूल धारा से गुणा करने पर जो संख्या मिलती है वह प्रायः वस्तुतः खपी शक्ति से बड़ी होती है, और दोनों का अनुपात इस पर निर्भर है कि धारा वोल्टता से कितना पीछे या आगे है। उस अनुपात को क्या कहते हैं?",
          mr: "वर्ग माध्य मूळ व्होल्टेजला वर्ग माध्य मूळ धारेने गुणल्यावर जी संख्या मिळते ती बहुधा प्रत्यक्षात खर्च झालेल्या शक्तीहून मोठी असते, आणि दोहोंचे गुणोत्तर यावर अवलंबून की धारा व्होल्टेजच्या किती मागे वा पुढे आहे. त्या गुणोत्तराला काय म्हणतात?",
        },
        statement: {
          en: "Power factor is cos φ, the cosine of the phase angle between current and voltage, so the average power is P = V_rms I_rms cos φ rather than the plain product.",
          hi: "शक्ति गुणांक cos φ है, अर्थात् धारा और वोल्टता के बीच के कलांतर की कोज्या, अतः औसत शक्ति सादे गुणनफल के बजाय P = V_rms I_rms cos φ है।",
          mr: "शक्ती गुणक म्हणजे cos φ, म्हणजे धारा आणि व्होल्टेज यांतील कलाकोनाचा कोसाइन, म्हणून सरासरी शक्ती साध्या गुणाकाराऐवजी P = V_rms I_rms cos φ आहे.",
        },
        detail: {
          en: "It is 1 for a pure resistance and exactly 0 for a pure inductor or capacitor, where the current is said to be wattless: it flows, it heats the supply cables, and it delivers no energy to the load at all.",
          hi: "शुद्ध प्रतिरोध के लिए यह 1 है और शुद्ध प्रेरक या संधारित्र के लिए ठीक 0, जहाँ धारा को वाटहीन कहते हैं: वह बहती है, आपूर्ति के तारों को गर्म करती है, और लोड को कोई ऊर्जा देती ही नहीं।",
          mr: "शुद्ध रोधासाठी हा 1 आहे आणि शुद्ध प्रेरक वा धारित्रासाठी नेमका 0, जिथे धारेला वॅटविरहित म्हणतात: ती वाहते, पुरवठ्याच्या तारा तापवते, आणि भाराला कोणतीही ऊर्जा देतच नाही.",
        },
        extra: {
          en: "Industrial consumers are billed a penalty for a low value, because the generator and the cables must be sized for the current they carry and not for the power the meter records.",
          hi: "औद्योगिक उपभोक्ताओं से कम मान पर जुर्माना लिया जाता है, क्योंकि जनित्र और तार उस धारा के हिसाब से बनाने पड़ते हैं जो वे ढोते हैं, उस शक्ति के हिसाब से नहीं जो मीटर दर्ज करता है।",
          mr: "औद्योगिक ग्राहकांकडून कमी मूल्यावर दंड घेतला जातो, कारण जनित्र आणि तारा त्या धारेच्या हिशेबाने बनवाव्या लागतात जी त्या वाहतात, त्या शक्तीच्या हिशेबाने नव्हे जी मीटर नोंदवते.",
        },
        pair: {
          left: {
            en: "Why the cables must be bigger than the bill suggests",
            hi: "इसीलिए तार उससे मोटे चाहिए जितना बिल सुझाता है",
            mr: "म्हणूनच तारा बिल सुचवते त्याहून जाड हव्यात",
          },
          right: {
            en: "power factor",
            hi: "शक्ति गुणांक",
            mr: "शक्ती गुणक",
          },
        },
      },
      {
        id: "series-resonance",
        name: {
          en: "Series resonance",
          hi: "श्रेणी अनुनाद",
          mr: "श्रेणी अनुनाद",
        },
        kind: "circuit phenomenon or device",
        prompt: {
          en: "At one particular frequency the inductor's opposition and the capacitor's opposition are equal and opposite, they cancel completely, and the circuit behaves as though only its resistance were there. What is this condition called?",
          hi: "किसी एक विशेष आवृत्ति पर प्रेरक का विरोध और संधारित्र का विरोध बराबर और विपरीत होते हैं, वे पूरी तरह कट जाते हैं, और परिपथ ऐसे बरतता है मानो केवल उसका प्रतिरोध ही हो। इस स्थिति को क्या कहते हैं?",
          mr: "एका विशिष्ट वारंवारतेवर प्रेरकाचा विरोध आणि धारित्राचा विरोध समान व विरुद्ध असतात, ते पूर्णपणे कापले जातात, आणि परिपथ असा वागतो जणू केवळ त्याचा रोधच असावा. या स्थितीला काय म्हणतात?",
        },
        statement: {
          en: "Series resonance occurs when X_L = X_C, at ω₀ = 1/√(LC), where the impedance falls to its minimum value R and the current reaches its maximum.",
          hi: "श्रेणी अनुनाद तब होता है जब X_L = X_C, अर्थात् ω₀ = 1/√(LC) पर, जहाँ प्रतिबाधा घटकर अपने न्यूनतम मान R पर आ जाती है और धारा अपने अधिकतम पर पहुँचती है।",
          mr: "श्रेणी अनुनाद तेव्हा घडतो जेव्हा X_L = X_C, म्हणजे ω₀ = 1/√(LC) वर, जिथे प्रतिबाधा घटून आपल्या किमान मूल्य R वर येते आणि धारा आपल्या कमालीवर पोहोचते.",
        },
        detail: {
          en: "The current is in phase with the voltage there, so the power factor is 1 and the circuit is drawing everything it takes and using all of it.",
          hi: "वहाँ धारा वोल्टता के साथ समान कला में है, अतः शक्ति गुणांक 1 है और परिपथ जो कुछ लेता है सब ले रहा है और सब काम में ला रहा है।",
          mr: "तिथे धारा व्होल्टेजशी समान कलेत आहे, म्हणून शक्ती गुणक 1 आहे आणि परिपथ जे काही घेतो ते सर्व घेत आहे आणि सर्व वापरत आहे.",
        },
        extra: {
          en: "The sharper the peak — the higher the Q — the better the circuit distinguishes one station from its neighbour, which is exactly what happens when a radio is tuned.",
          hi: "शिखर जितना तेज़ — Q जितना ऊँचा — परिपथ एक स्टेशन को उसके पड़ोसी से उतना ही बेहतर अलग करता है, और रेडियो मिलाने पर ठीक यही होता है।",
          mr: "शिखर जितके तीक्ष्ण — Q जितके उंच — परिपथ एका केंद्राला त्याच्या शेजाऱ्यापासून तितका चांगला वेगळा करतो, आणि रेडिओ जुळवताना नेमके हेच घडते.",
        },
        pair: {
          left: {
            en: "One frequency answered, the rest ignored",
            hi: "एक आवृत्ति को उत्तर, बाक़ी की अनसुनी",
            mr: "एका वारंवारतेला उत्तर, बाकीच्यांकडे दुर्लक्ष",
          },
          right: {
            en: "series resonance",
            hi: "श्रेणी अनुनाद",
            mr: "श्रेणी अनुनाद",
          },
        },
      },
      {
        id: "transformer",
        name: {
          en: "The transformer",
          hi: "ट्रांसफ़ॉर्मर",
          mr: "ट्रान्सफॉर्मर",
        },
        kind: "circuit phenomenon or device",
        prompt: {
          en: "Two coils share an iron core and no electrical connection whatever, yet a changing voltage on one appears on the other multiplied by the ratio of their turns — and it refuses to work at all on a battery. What device is this?",
          hi: "दो कुंडलियाँ लोहे की क्रोड साझा करती हैं और उनमें कोई विद्युत संबंध है ही नहीं, फिर भी एक पर बदलती वोल्टता दूसरी पर उनके फेरों के अनुपात से गुणा होकर प्रकट होती है — और वह बैटरी पर चलती ही नहीं। यह कौन-सी युक्ति है?",
          mr: "दोन वेटोळी लोखंडाचा गाभा वाटून घेतात आणि त्यांच्यात कोणताही विद्युत संबंध नाहीच, तरीही एकावरचा बदलता व्होल्टेज दुसऱ्यावर त्यांच्या वेढ्यांच्या गुणोत्तराने गुणून प्रकट होतो — आणि ते बॅटरीवर चालतच नाही. हे कोणते साधन?",
        },
        statement: {
          en: "A transformer changes an alternating voltage in the ratio of the turns on its two windings, V_s/V_p = N_s/N_p, transferring power between circuits that are not electrically connected.",
          hi: "ट्रांसफ़ॉर्मर प्रत्यावर्ती वोल्टता को अपनी दो लपेटों के फेरों के अनुपात में बदलता है, V_s/V_p = N_s/N_p, और ऐसे परिपथों के बीच शक्ति स्थानांतरित करता है जो विद्युत रूप से जुड़े नहीं हैं।",
          mr: "ट्रान्सफॉर्मर प्रत्यावर्ती व्होल्टेज आपल्या दोन वेढणींच्या वेढ्यांच्या गुणोत्तरात बदलतो, V_s/V_p = N_s/N_p, आणि विद्युतदृष्ट्या जोडलेल्या नसलेल्या परिपथांमध्ये शक्ती हस्तांतरित करतो.",
        },
        detail: {
          en: "Power is conserved in an ideal one, so stepping the voltage up steps the current down by the same factor and nothing is gained — the device trades one for the other and never manufactures energy.",
          hi: "आदर्श में शक्ति संरक्षित रहती है, अतः वोल्टता बढ़ाने पर धारा उसी गुणक से घटती है और कुछ मिलता नहीं — युक्ति एक को दूसरे से बदलती है, ऊर्जा कभी बनाती नहीं।",
          mr: "आदर्शात शक्ती संधारित राहते, म्हणून व्होल्टेज वाढवल्यास धारा त्याच पटीने घटते आणि काहीही मिळत नाही — साधन एकाची दुसऱ्याशी अदलाबदल करते, ऊर्जा कधीच घडवत नाही.",
        },
        extra: {
          en: "That trade is what makes long-distance transmission possible, since the loss in a cable is I²R and halving the current quarters the loss — which is why the grid runs at hundreds of kilovolts and steps down only at the street corner.",
          hi: "वही अदला-बदली लंबी दूरी के संचरण को संभव बनाती है, क्योंकि तार में हानि I²R है और धारा आधी करने पर हानि चौथाई रह जाती है — इसीलिए ग्रिड सैकड़ों किलोवोल्ट पर चलता है और गली के मोड़ पर ही घटाता है।",
          mr: "तीच अदलाबदल लांब पल्ल्याचे संचरण शक्य करते, कारण तारेतील हानी I²R आहे आणि धारा निम्मी केल्यास हानी चतुर्थांश उरते — म्हणूनच ग्रिड शेकडो किलोव्होल्टवर चालतो आणि गल्लीच्या कोपऱ्यावरच खाली आणतो.",
        },
        pair: {
          left: {
            en: "Refuses to work on a battery",
            hi: "बैटरी पर चलने से इनकार करता है",
            mr: "बॅटरीवर चालायला नकार देतो",
          },
          right: {
            en: "the transformer",
            hi: "ट्रांसफ़ॉर्मर",
            mr: "ट्रान्सफॉर्मर",
          },
        },
      },
      {
        id: "choke-coil",
        name: {
          en: "The choke coil",
          hi: "चोक कुंडली",
          mr: "चोक वेटोळे",
        },
        kind: "circuit phenomenon or device",
        prompt: {
          en: "To cut the current in an a.c. circuit a resistor would work but would waste the difference as heat; this component does the same job and wastes almost nothing, because its opposition is reactive rather than resistive. What is it?",
          hi: "प्रत्यावर्ती परिपथ में धारा घटाने को प्रतिरोधक काम करता पर अंतर को ऊष्मा बनाकर बरबाद कर देता; यह पुर्ज़ा वही काम करता है और लगभग कुछ भी बरबाद नहीं करता, क्योंकि उसका विरोध प्रतिरोधी नहीं प्रतिघाती है। यह क्या है?",
          mr: "प्रत्यावर्ती परिपथात धारा कमी करायला रोधक चालला असता पण फरक उष्णता बनवून वाया घालवला असता; हा घटक तेच काम करतो आणि जवळपास काहीही वाया घालवत नाही, कारण त्याचा विरोध रोधी नसून प्रतिघाती आहे. हा काय आहे?",
        },
        statement: {
          en: "A choke coil is an inductor used to limit alternating current without appreciable power loss, since its opposition ωL is reactive and its phase angle is close to 90°.",
          hi: "चोक कुंडली वह प्रेरक है जो प्रत्यावर्ती धारा को ध्यान देने योग्य शक्ति-हानि के बिना सीमित करने को काम आता है, क्योंकि उसका विरोध ωL प्रतिघाती है और उसका कलांतर 90° के निकट है।",
          mr: "चोक वेटोळे म्हणजे प्रत्यावर्ती धारा लक्षणीय शक्ती-हानीविना मर्यादित करण्यासाठी वापरलेला प्रेरक, कारण त्याचा विरोध ωL प्रतिघाती आहे आणि त्याचा कलाकोन 90° च्या जवळ आहे.",
        },
        detail: {
          en: "It works only on alternating current: on a steady supply ω is zero, the reactance vanishes, and the coil is nothing but the small resistance of its own wire.",
          hi: "यह केवल प्रत्यावर्ती धारा पर चलता है: स्थिर आपूर्ति पर ω शून्य है, प्रतिघात लुप्त हो जाता है, और कुंडली अपने ही तार के छोटे प्रतिरोध से अधिक कुछ नहीं रह जाती।",
          mr: "हे केवळ प्रत्यावर्ती धारेवर चालते: स्थिर पुरवठ्यावर ω शून्य आहे, प्रतिघात नाहीसा होतो, आणि वेटोळे स्वतःच्याच तारेच्या लहान रोधाहून अधिक काही उरत नाही.",
        },
        extra: {
          en: "The old fluorescent tube used one to hold its current down after the tube struck, and the reason it was preferred to a resistor was a running cost measured in units of electricity every hour it was on.",
          hi: "पुरानी प्रतिदीप्त नलिका जलने के बाद अपनी धारा दबाए रखने को इसी का उपयोग करती थी, और प्रतिरोधक के बजाय इसे चुनने का कारण वह चलती लागत थी जो हर घंटे बिजली की इकाइयों में नापी जाती।",
          mr: "जुनी प्रतिदीप्त नळी पेटल्यानंतर आपली धारा दाबून ठेवायला हेच वापरत असे, आणि रोधकाऐवजी हे निवडण्याचे कारण ती चालू खर्चाची रक्कम होती जी दर तासाला विजेच्या एककांत मोजली जाई.",
        },
        pair: {
          left: {
            en: "Cuts the current and sends no bill for it",
            hi: "धारा घटाता है और उसका बिल नहीं भेजता",
            mr: "धारा कमी करतो आणि त्याचे बिल पाठवत नाही",
          },
          right: {
            en: "the choke coil",
            hi: "चोक कुंडली",
            mr: "चोक वेटोळे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student objects that the Indian mains cannot really be 220 V, since the voltage spends half of every cycle negative and its average over a cycle is exactly zero. A friend replies that the meaningful figure is 311 V because that is the largest value reached. Assess both claims.",
          hi: "एक विद्यार्थी आपत्ति करता है कि भारतीय मुख्य आपूर्ति वस्तुतः 220 V हो ही नहीं सकती, क्योंकि वोल्टता हर चक्र का आधा समय ऋणात्मक रहती है और चक्र पर उसका औसत ठीक शून्य है। मित्र उत्तर देता है कि सार्थक आँकड़ा 311 V है क्योंकि वही सबसे बड़ा मान है जो पहुँचता है। दोनों दावों का आकलन करो।",
          mr: "एक विद्यार्थी आक्षेप घेतो की भारतीय मुख्य पुरवठा प्रत्यक्षात 220 V असूच शकत नाही, कारण व्होल्टेज प्रत्येक चक्राचा अर्धा वेळ ऋण असतो आणि चक्रावर त्याची सरासरी नेमकी शून्य आहे. मित्र उत्तर देतो की अर्थपूर्ण आकडा 311 V आहे कारण तेच सर्वांत मोठे मूल्य आहे जे गाठले जाते. दोन्ही दाव्यांचे मूल्यमापन करा.",
        },
        choices: [
          {
            en: "The first student's arithmetic is right and his conclusion is wrong; the friend has named a real number that answers a different question. The plain average of a sinusoid over a cycle IS zero, which is why nobody quotes it — a zero average would predict no heating, and mains wires certainly heat. Heating depends on i², which is positive in both halves, so the useful figure is the root of the mean of the square: 220 V is the rms value, the steady voltage that would heat a resistor equally. The friend's 311 V is the PEAK, √2 times the rms, and it matters for insulation and component ratings but not for power",
            hi: "पहले विद्यार्थी का अंकगणित सही है और उसका निष्कर्ष ग़लत; मित्र ने ऐसी असली संख्या बताई है जो किसी और प्रश्न का उत्तर देती है। चक्र पर ज्यावक्र का सादा औसत शून्य है ही, इसीलिए उसे कोई बताता नहीं — शून्य औसत यह भविष्यवाणी करता कि कोई तापन नहीं होगा, और मुख्य आपूर्ति के तार निश्चय ही गर्म होते हैं। तापन i² पर निर्भर है, जो दोनों आधों में धनात्मक है, अतः काम का आँकड़ा वर्ग के माध्य का मूल है: 220 V वर्ग माध्य मूल मान है, वह स्थिर वोल्टता जो प्रतिरोधक को उतना ही गर्म करती। मित्र का 311 V शिखर है, वर्ग माध्य मूल का √2 गुना, और वह विद्युतरोधन तथा पुर्ज़ों के निर्धारण के लिए मायने रखता है, शक्ति के लिए नहीं",
            mr: "पहिल्या विद्यार्थ्याचे अंकगणित बरोबर आहे आणि त्याचा निष्कर्ष चूक; मित्राने अशी खरी संख्या सांगितली आहे जी दुसऱ्याच प्रश्नाचे उत्तर देते. चक्रावर ज्यावक्राची साधी सरासरी शून्य आहेच, म्हणूनच ती कोणी सांगत नाही — शून्य सरासरी असे भाकीत करेल की तापन होणार नाही, आणि मुख्य पुरवठ्याच्या तारा नक्कीच तापतात. तापन i² वर अवलंबून आहे, जो दोन्ही अर्ध्यांत धन आहे, म्हणून उपयुक्त आकडा वर्गाच्या माध्याचे मूळ आहे: 220 V हे वर्ग माध्य मूळ मूल्य आहे, तो स्थिर व्होल्टेज जो रोधकाला तितकेच तापवेल. मित्राचा 311 V हा शिखर आहे, वर्ग माध्य मूळाच्या √2 पट, आणि तो विद्युतरोधन आणि घटकांच्या निर्धारणासाठी महत्त्वाचा आहे, शक्तीसाठी नाही",
          },
          {
            en: "The first student is right: alternating supplies are quoted at 220 V only by convention, and no physical quantity actually equals 220 V anywhere in the circuit",
            hi: "पहला विद्यार्थी सही है: प्रत्यावर्ती आपूर्तियाँ 220 V केवल परिपाटी से बताई जाती हैं, और परिपथ में कहीं भी कोई भौतिक राशि वस्तुतः 220 V के बराबर नहीं है",
            mr: "पहिला विद्यार्थी बरोबर आहे: प्रत्यावर्ती पुरवठे 220 V केवळ संकेताने सांगितले जातात, आणि परिपथात कुठेही कोणतीही भौतिक राशी प्रत्यक्षात 220 V इतकी नाही",
          },
          {
            en: "The friend is right: 311 V is the correct figure and 220 V is simply the average of the positive half of the cycle",
            hi: "मित्र सही है: 311 V सही आँकड़ा है और 220 V बस चक्र के धनात्मक आधे का औसत है",
            mr: "मित्र बरोबर आहे: 311 V हा बरोबर आकडा आहे आणि 220 V म्हणजे फक्त चक्राच्या धन अर्ध्याची सरासरी",
          },
          {
            en: "Both are wrong, because an alternating voltage cannot be given any single value at all and must always be quoted as a function of time",
            hi: "दोनों ग़लत हैं, क्योंकि प्रत्यावर्ती वोल्टता को कोई एक मान दिया ही नहीं जा सकता और उसे सदा समय के फलन के रूप में बताना पड़ता है",
            mr: "दोघेही चूक आहेत, कारण प्रत्यावर्ती व्होल्टेजला कोणतेही एकच मूल्य देताच येत नाही आणि तो नेहमी काळाचे फलन म्हणूनच सांगावा लागतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The objection is a good one and the answer is not that the student has miscalculated. The mean of sin over a full cycle really is zero, and that is precisely why the average is not the quantity anyone quotes. The right question is: what is an alternating supply FOR, and which single number captures it? Almost always the answer is heating — or, more generally, power delivered. Consider a resistor. The instantaneous power is p = i²R. Whatever i is doing, i² is positive: in the negative half-cycle the current runs backwards, but it heats the resistor exactly as much as it did going forwards, because reversing the direction of a current does not cool anything down. So the average power over a cycle is R times the MEAN OF i², and that mean is emphatically not zero. Define I_rms as the square root of that mean, and the average power becomes I²_rms R — the same expression as for a direct current. That is the point of the definition: it is constructed so that every d.c. power formula continues to work unchanged. For a sinusoid the arithmetic gives I_rms = I₀/√2, because the average of sin² over a cycle is exactly ½. So 220 V is not a convention or an approximation. It is a statement with experimental content: a heater run on this supply produces the same heat per second as it would on a 220 V battery. That is what a voltmeter marked for a.c. is built to display, and it is the number the electricity meter's arithmetic is founded on. Now the friend's 311 V, which is a real quantity wrongly promoted. It is the PEAK, V₀ = √2 × 220 ≈ 311 V, and it matters for a different set of decisions. Insulation must withstand it, or the appliance flashes over at the top of every cycle. A capacitor's voltage rating must exceed it. A rectifier diode must block it in reverse, and the smoothed d.c. produced by rectifying the mains sits near 311 V, not 220 V — a fact that surprises people building power supplies for the first time. The general lesson is worth extracting because it is not about electricity. When a quantity varies, no single number describes it, so a number must be CHOSEN, and it is chosen for a purpose. Average for the total charge transported, rms for the heating, peak for the insulation. The complaint that a single figure fails to capture a varying quantity is always true and never useful; the question is which failure is acceptable for the job at hand. (The second option confuses 'defined for a purpose' with 'arbitrary'; the third would give a very different number — the average of a half sinusoid is 2V₀/π ≈ 198 V, not 220 V; the fourth refuses to summarise at all, which would leave no way to sell electricity or rate a component.)",
          hi: "आपत्ति अच्छी है और उत्तर यह नहीं कि विद्यार्थी की गणना ग़लत है। पूरे चक्र पर ज्या का माध्य सचमुच शून्य है, और ठीक इसीलिए औसत वह राशि नहीं जिसे कोई बताता है। सही प्रश्न यह है: प्रत्यावर्ती आपूर्ति किसलिए है, और उसे कौन-सी एक संख्या पकड़ती है? लगभग सदा उत्तर तापन है — या अधिक सामान्य रूप से, दी गई शक्ति। प्रतिरोधक लो। तात्क्षणिक शक्ति p = i²R है। i चाहे जो कर रहा हो, i² धनात्मक है: ऋण अर्ध-चक्र में धारा उलटी बहती है, पर वह प्रतिरोधक को ठीक उतना ही गर्म करती है जितना आगे जाते हुए करती थी, क्योंकि धारा की दिशा उलटने से कुछ ठंडा नहीं होता। अतः चक्र पर औसत शक्ति R गुना i² का माध्य है, और वह माध्य ज़ोर देकर शून्य नहीं है। I_rms को उस माध्य का वर्गमूल परिभाषित करो, और औसत शक्ति I²_rms R बन जाती है — दिष्ट धारा जैसा ही व्यंजक। परिभाषा का मर्म यही है: वह ऐसे गढ़ी गई है कि दिष्ट धारा का हर शक्ति-सूत्र ज्यों का त्यों चलता रहे। ज्यावक्र के लिए अंकगणित I_rms = I₀/√2 देता है, क्योंकि चक्र पर sin² का औसत ठीक ½ है। अतः 220 V परिपाटी या सन्निकटन नहीं। वह प्रायोगिक अर्थ वाला कथन है: इस आपूर्ति पर चलता हीटर प्रति सेकंड उतनी ही ऊष्मा देता है जितनी वह 220 V की बैटरी पर देता। प्रत्यावर्ती के लिए अंकित वोल्टमापी यही दिखाने को बना है, और बिजली के मीटर का गणित इसी संख्या पर टिका है। अब मित्र का 311 V, जो असली राशि है पर ग़लत जगह बिठाई गई। वह शिखर है, V₀ = √2 × 220 ≈ 311 V, और वह निर्णयों के दूसरे समुच्चय के लिए मायने रखता है। विद्युतरोधन को उसे झेलना ही है, वरना उपकरण हर चक्र के शीर्ष पर चटक जाएगा। संधारित्र का वोल्टता निर्धारण उससे अधिक होना चाहिए। दिष्टकारी डायोड को उसे उलटी दिशा में रोकना होगा, और मुख्य आपूर्ति को दिष्ट करके बनी चिकनी दिष्ट धारा 311 V के पास बैठती है, 220 V के नहीं — यह तथ्य पहली बार बिजली-आपूर्ति बनाने वालों को चौंकाता है। सामान्य सीख निकालने योग्य है क्योंकि वह बिजली के बारे में है ही नहीं। जब कोई राशि बदलती है, तो कोई एक संख्या उसका वर्णन नहीं करती, अतः एक संख्या चुननी पड़ती है, और वह किसी प्रयोजन के लिए चुनी जाती है। ढोए गए कुल आवेश के लिए औसत, तापन के लिए वर्ग माध्य मूल, विद्युतरोधन के लिए शिखर। यह शिकायत कि एक आँकड़ा बदलती राशि को नहीं पकड़ता, सदा सच है और कभी काम की नहीं; प्रश्न यह है कि हाथ के काम के लिए कौन-सी चूक स्वीकार्य है। (दूसरा विकल्प 'प्रयोजन के लिए परिभाषित' को 'मनमाना' समझ लेता है; तीसरा बहुत भिन्न संख्या देता — आधे ज्यावक्र का औसत 2V₀/π ≈ 198 V है, 220 V नहीं; चौथा सारांश देने से ही इनकार कर देता है, जिससे न बिजली बेची जा सकती न पुर्ज़ा निर्धारित किया जा सकता।)",
          mr: "आक्षेप चांगला आहे आणि उत्तर हे नाही की विद्यार्थ्याची गणना चुकली आहे. पूर्ण चक्रावर साइनचा माध्य खरोखर शून्य आहे, आणि नेमके म्हणूनच सरासरी ही ती राशी नाही जी कोणी सांगते. योग्य प्रश्न हा आहे: प्रत्यावर्ती पुरवठा कशासाठी आहे, आणि त्याला कोणती एक संख्या पकडते? जवळपास नेहमी उत्तर तापन असते — किंवा अधिक सर्वसाधारणपणे, दिलेली शक्ती. रोधक घ्या. तात्कालिक शक्ती p = i²R आहे. i काहीही करत असो, i² धन आहे: ऋण अर्ध-चक्रात धारा उलटी वाहते, पण ती रोधकाला नेमके तितकेच तापवते जितके पुढे जाताना तापवत होती, कारण धारेची दिशा उलटल्याने काहीही थंड होत नाही. म्हणून चक्रावरची सरासरी शक्ती R गुणिले i² चा माध्य आहे, आणि तो माध्य ठामपणे शून्य नाही. I_rms ला त्या माध्याचे वर्गमूळ म्हणून व्याख्यायित करा, आणि सरासरी शक्ती I²_rms R होते — दिष्ट धारेसारखीच पदावली. व्याख्येचा गाभा हाच: ती अशी घडवली आहे की दिष्ट धारेचे प्रत्येक शक्ती-सूत्र जसेच्या तसे चालत राहावे. ज्यावक्रासाठी अंकगणित I_rms = I₀/√2 देते, कारण चक्रावर sin² ची सरासरी नेमकी ½ आहे. म्हणून 220 V हा संकेत वा अंदाज नाही. ते प्रायोगिक अर्थ असलेले विधान आहे: या पुरवठ्यावर चालणारा हीटर दर सेकंदाला तितकीच उष्णता देतो जितकी तो 220 V च्या बॅटरीवर देईल. प्रत्यावर्तीसाठी खुणा असलेला व्होल्टमापक हेच दाखवायला बनवलेला आहे, आणि विजेच्या मीटरचे गणित याच संख्येवर टिकलेले आहे. आता मित्राचा 311 V, जो खरी राशी आहे पण चुकीच्या जागी बसवलेली. तो शिखर आहे, V₀ = √2 × 220 ≈ 311 V, आणि तो निर्णयांच्या दुसऱ्या संचासाठी महत्त्वाचा आहे. विद्युतरोधनाला तो सोसावाच लागतो, अन्यथा उपकरण प्रत्येक चक्राच्या शिखरावर तडकेल. धारित्राचे व्होल्टेज निर्धारण त्याहून अधिक असावे लागते. दिष्टकारी डायोडला तो उलट दिशेने अडवावा लागतो, आणि मुख्य पुरवठा दिष्ट करून बनलेली गुळगुळीत दिष्ट धारा 311 V जवळ बसते, 220 V जवळ नाही — हे सत्य प्रथमच वीजपुरवठा बनवणाऱ्यांना चकित करते. सर्वसाधारण धडा काढण्याजोगा आहे कारण तो विजेबद्दल आहेच नाही. जेव्हा एखादी राशी बदलते, तेव्हा कोणतीही एक संख्या तिचे वर्णन करत नाही, म्हणून एक संख्या निवडावी लागते, आणि ती एखाद्या हेतूसाठी निवडली जाते. वाहून नेलेल्या एकूण प्रभारासाठी सरासरी, तापनासाठी वर्ग माध्य मूळ, विद्युतरोधनासाठी शिखर. एक आकडा बदलती राशी पकडत नाही ही तक्रार नेहमी खरी असते आणि कधीच उपयोगी नसते; प्रश्न हा की हातातल्या कामासाठी कोणती उणीव स्वीकारार्ह आहे. (दुसरा पर्याय 'हेतूसाठी व्याख्यायित' आणि 'मनमानी' यांची गल्लत करतो; तिसरा फार वेगळी संख्या देईल — अर्ध्या ज्यावक्राची सरासरी 2V₀/π ≈ 198 V आहे, 220 V नाही; चौथा सारांश देण्यासच नकार देतो, ज्याने ना वीज विकता येईल ना घटक निर्धारित करता येईल.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A factory's meter records 40 kW, but the supply company measures 250 A flowing at 400 V — a product of 100 kVA — and charges a penalty. The manager argues that since the meter is honest about the energy used, the extra current costs the company nothing. Explain the physics and what the factory should install.",
          hi: "एक कारख़ाने का मीटर 40 kW दर्ज करता है, पर आपूर्ति कंपनी 400 V पर 250 A बहती नापती है — गुणनफल 100 kVA — और जुर्माना लगाती है। प्रबंधक तर्क देता है कि चूँकि मीटर काम में ली गई ऊर्जा के बारे में ईमानदार है, अतिरिक्त धारा से कंपनी का कुछ नहीं बिगड़ता। भौतिकी समझाओ और बताओ कि कारख़ाने को क्या लगाना चाहिए।",
          mr: "एका कारखान्याचे मीटर 40 kW नोंदवते, पण पुरवठा कंपनी 400 V वर 250 A वाहताना मोजते — गुणाकार 100 kVA — आणि दंड लावते. व्यवस्थापक युक्तिवाद करतो की मीटर वापरलेल्या ऊर्जेबद्दल प्रामाणिक असल्याने, जादा धारेमुळे कंपनीचे काहीही बिघडत नाही. भौतिकी समजावा आणि कारखान्याने काय बसवावे ते सांगा.",
        },
        choices: [
          {
            en: "The power factor is 40/100 = 0.4, so the current lags the voltage by about 66° — the load is dominated by induction motors, which are inductive. The manager is wrong that the extra current is free: the cables, the transformer and the generator all have to be sized for 250 A, and the I²R loss in the supply network scales with the SQUARE of that current, so 250 A wastes over six times as much in the lines as the 100 A that 40 kW at unity power factor would need. The cure is a bank of capacitors across the supply, whose leading current cancels the motors' lagging current, raising the power factor towards 1 and cutting the line current without changing the useful power at all",
            hi: "शक्ति गुणांक 40/100 = 0.4 है, अतः धारा वोल्टता से लगभग 66° पीछे है — लोड पर प्रेरण मोटरें हावी हैं, जो प्रेरकीय हैं। प्रबंधक यह मानने में ग़लत है कि अतिरिक्त धारा मुफ़्त है: तार, ट्रांसफ़ॉर्मर और जनित्र सबको 250 A के हिसाब से बनाना पड़ता है, और आपूर्ति जाल में I²R हानि उसी धारा के वर्ग के साथ चलती है, अतः 250 A लाइनों में उससे छह गुना से अधिक बरबाद करता है जितना एकांक शक्ति गुणांक पर 40 kW के लिए चाहिए 100 A करता। इलाज आपूर्ति के आर-पार संधारित्रों की पंक्ति है, जिसकी अग्रगामी धारा मोटरों की पश्चगामी धारा को काट देती है, शक्ति गुणांक को 1 की ओर उठाती है और काम की शक्ति बिलकुल बदले बिना लाइन की धारा घटा देती है",
            mr: "शक्ती गुणक 40/100 = 0.4 आहे, म्हणून धारा व्होल्टेजच्या सुमारे 66° मागे आहे — भारावर प्रेरण मोटारींचे वर्चस्व आहे, ज्या प्रेरकी आहेत. व्यवस्थापक हे मानण्यात चूक करतो की जादा धारा फुकट आहे: तारा, ट्रान्सफॉर्मर आणि जनित्र या सर्वांना 250 A च्या हिशेबाने बनवावे लागते, आणि पुरवठा जाळ्यातील I²R हानी त्याच धारेच्या वर्गासोबत चालते, म्हणून 250 A तारांमध्ये त्याहून सहापटींहून अधिक वाया घालवते जितके एकक शक्ती गुणकावर 40 kW साठी लागणारे 100 A घालवेल. उपाय म्हणजे पुरवठ्याच्या आरपार धारित्रांची रांग, जिची अग्रगामी धारा मोटारींची पश्चगामी धारा कापते, शक्ती गुणक 1 कडे उचलते आणि उपयुक्त शक्ती मुळीच न बदलता तारेतील धारा घटवते",
          },
          {
            en: "The manager is right: the extra current is wattless, and a wattless current by definition carries no energy and therefore costs nobody anything",
            hi: "प्रबंधक सही है: अतिरिक्त धारा वाटहीन है, और वाटहीन धारा परिभाषा से कोई ऊर्जा नहीं ढोती और इसलिए किसी का कुछ नहीं बिगाड़ती",
            mr: "व्यवस्थापक बरोबर आहे: जादा धारा वॅटविरहित आहे, आणि वॅटविरहित धारा व्याख्येने कोणतीही ऊर्जा वाहत नाही आणि म्हणून कोणाचेही काहीही बिघडवत नाही",
          },
          {
            en: "The meter is faulty, since the true power consumed must be 100 kW and the factory is being undercharged rather than penalised",
            hi: "मीटर ख़राब है, क्योंकि वस्तुतः खपी शक्ति 100 kW होनी चाहिए और कारख़ाने से जुर्माना नहीं बल्कि कम वसूली हो रही है",
            mr: "मीटर बिघडलेले आहे, कारण प्रत्यक्षात खर्च झालेली शक्ती 100 kW असली पाहिजे आणि कारखान्याकडून दंड नव्हे तर कमी वसुली होत आहे",
          },
          {
            en: "The factory should install a large resistor in series with the supply, which will bring the current down to the level the power warrants",
            hi: "कारख़ाने को आपूर्ति के श्रेणी में बड़ा प्रतिरोधक लगाना चाहिए, जो धारा को उस स्तर तक ले आएगा जितने की शक्ति गवाही देती है",
            mr: "कारखान्याने पुरवठ्याच्या श्रेणीत मोठा रोधक बसवावा, जो धारा त्या पातळीवर आणेल जितकी शक्ती दर्शवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Start by reading the two numbers correctly, because they are not measuring the same thing. The meter's 40 kW is real power — the average of vi over a cycle, the rate at which energy is actually converted to motion, heat and light inside the factory. The company's 400 V × 250 A = 100 kVA is apparent power, the plain product of rms voltage and rms current, which ignores the phase between them. Their ratio is the power factor: cos φ = 40/100 = 0.4, corresponding to a phase angle of about 66°. That the current LAGS is the signature of an inductive load, and an industrial site is full of them — induction motors are coils of wire wound on iron, and a motor running lightly loaded is close to a pure inductor. Now the manager's argument, which is half right in a way that matters. He is correct that the out-of-phase component of the current — the wattless current — delivers no net energy to his machines. Over each cycle it flows one way and back, borrowing energy from the supply in one quarter and returning it in the next, and integrated over a cycle its contribution to power is exactly zero. That is why the meter reads 40 kW and not 100 kW, and the meter is not lying. But the conclusion does not follow, and the reason is that the wattless current is not imaginary. It is real charge moving through real copper. The supply cables do not know or care what the phase is; they carry 250 A, and they dissipate I²R while doing it. Because the loss goes as the SQUARE of the current, this is not a small effect: the same 40 kW delivered at unity power factor would need only 100 A, and (250/100)² = 6.25, so the poor power factor is costing the network more than six times the transmission loss it would otherwise incur. The same current also sets the size of everything upstream — the cable's cross-section, the transformer's rating, the switchgear, the generator's winding. All of it must be built for 250 A while only 40 kW is being sold. The penalty is therefore not arbitrary; it is a charge for capacity the factory occupies and does not pay for through the energy meter. The remedy follows from the diagnosis. If the trouble is a lagging current, add something whose current leads: a capacitor. Connected in parallel across the supply, a capacitor bank draws a leading current that cancels part of the motors' lagging current, so the two reactive contributions subtract while the real power is untouched. The line current falls towards the 100 A the load genuinely needs, the power factor rises towards 1, the cables run cooler and the penalty disappears. Note what has NOT happened: the factory's machines are doing exactly the same work as before, and the meter still reads 40 kW. Nothing has been saved inside the factory. What has been fixed is the current in the wires leading to it. (The second option correctly identifies the wattless current and then forgets that it still flows through resistance; the third mistakes apparent power for real power; the fourth would reduce the current by wasting the difference as heat, which is the one solution that costs more than the problem.)",
          hi: "पहले दोनों संख्याएँ ठीक से पढ़ो, क्योंकि वे एक ही चीज़ नहीं नाप रहीं। मीटर के 40 kW वास्तविक शक्ति हैं — चक्र पर vi का औसत, वह दर जिससे ऊर्जा वस्तुतः कारख़ाने के भीतर गति, ऊष्मा और प्रकाश में बदलती है। कंपनी के 400 V × 250 A = 100 kVA आभासी शक्ति हैं, वर्ग माध्य मूल वोल्टता और धारा का सादा गुणनफल, जो उनके बीच की कला की अनदेखी करता है। उनका अनुपात शक्ति गुणांक है: cos φ = 40/100 = 0.4, जो लगभग 66° के कलांतर से मेल खाता है। धारा का पीछे रहना प्रेरकीय लोड की पहचान है, और औद्योगिक स्थल उनसे भरा है — प्रेरण मोटरें लोहे पर लपेटी तार की कुंडलियाँ हैं, और हल्के लोड पर चलती मोटर शुद्ध प्रेरक के निकट है। अब प्रबंधक का तर्क, जो ऐसे ढंग से आधा सही है जो मायने रखता है। वह इस बारे में सही है कि धारा का कला-बाहर घटक — वाटहीन धारा — उसकी मशीनों को कोई नेट ऊर्जा नहीं देता। हर चक्र में वह एक ओर जाती और लौटती है, एक चौथाई में आपूर्ति से ऊर्जा उधार लेती और अगले में लौटाती है, और चक्र पर समाकलित करने पर शक्ति में उसका अंश ठीक शून्य है। इसीलिए मीटर 40 kW पढ़ता है, 100 kW नहीं, और मीटर झूठ नहीं बोल रहा। पर निष्कर्ष नहीं निकलता, और कारण यह कि वाटहीन धारा काल्पनिक नहीं है। वह असली ताँबे में चलता असली आवेश है। आपूर्ति के तारों को न पता है न परवाह कि कला क्या है; वे 250 A ढोते हैं, और ऐसा करते हुए I²R खपाते हैं। चूँकि हानि धारा के वर्ग से चलती है, यह छोटा प्रभाव नहीं: वही 40 kW एकांक शक्ति गुणांक पर देने को केवल 100 A चाहिए होते, और (250/100)² = 6.25, अतः ख़राब शक्ति गुणांक जाल को उस संचरण हानि से छह गुना से अधिक की क़ीमत दे रहा है जो अन्यथा लगती। वही धारा ऊपर की हर चीज़ का आकार भी तय करती है — तार का परिच्छेद, ट्रांसफ़ॉर्मर का निर्धारण, स्विचगियर, जनित्र की लपेट। यह सब 250 A के लिए बनाना पड़ता है जबकि बेचे केवल 40 kW जा रहे हैं। अतः जुर्माना मनमाना नहीं; वह उस क्षमता का शुल्क है जो कारख़ाना घेरता है और ऊर्जा मीटर के ज़रिए जिसका दाम नहीं चुकाता। उपाय निदान से निकलता है। यदि गड़बड़ पश्चगामी धारा है, तो ऐसा कुछ जोड़ो जिसकी धारा अग्रगामी हो: संधारित्र। आपूर्ति के आर-पार समांतर में जोड़ी गई संधारित्र-पंक्ति अग्रगामी धारा खींचती है जो मोटरों की पश्चगामी धारा का एक भाग काट देती है, अतः दोनों प्रतिघाती अंश घटते हैं जबकि वास्तविक शक्ति अछूती रहती है। लाइन की धारा उन 100 A की ओर गिरती है जो लोड को सचमुच चाहिए, शक्ति गुणांक 1 की ओर उठता है, तार ठंडे चलते हैं और जुर्माना ग़ायब हो जाता है। ध्यान दो कि क्या नहीं हुआ: कारख़ाने की मशीनें ठीक वही काम कर रही हैं जो पहले करती थीं, और मीटर अब भी 40 kW पढ़ता है। कारख़ाने के भीतर कुछ भी नहीं बचा। जो ठीक हुआ वह उस तक जाते तारों की धारा है। (दूसरा विकल्प वाटहीन धारा की पहचान ठीक करता है और फिर भूल जाता है कि वह अब भी प्रतिरोध में से बहती है; तीसरा आभासी शक्ति को वास्तविक शक्ति समझ लेता है; चौथा धारा तो घटा देता पर अंतर को ऊष्मा बनाकर, और यही वह एक हल है जो समस्या से महँगा पड़ता है।)",
          mr: "आधी दोन्ही संख्या नीट वाचा, कारण त्या एकच गोष्ट मोजत नाहीत. मीटरचे 40 kW ही वास्तविक शक्ती आहे — चक्रावर vi ची सरासरी, ती गती ज्याने ऊर्जा प्रत्यक्षात कारखान्याच्या आत गती, उष्णता आणि प्रकाशात बदलते. कंपनीचे 400 V × 250 A = 100 kVA ही आभासी शक्ती आहे, वर्ग माध्य मूळ व्होल्टेज आणि धारा यांचा साधा गुणाकार, जो त्यांच्यातील कलेकडे दुर्लक्ष करतो. त्यांचे गुणोत्तर म्हणजे शक्ती गुणक: cos φ = 40/100 = 0.4, जे सुमारे 66° च्या कलाकोनाशी जुळते. धारेचे मागे राहणे ही प्रेरकी भाराची खूण आहे, आणि औद्योगिक जागा त्यांनी भरलेली आहे — प्रेरण मोटारी लोखंडावर गुंडाळलेली तारेची वेटोळी आहेत, आणि हलक्या भारावर चालणारी मोटार शुद्ध प्रेरकाच्या जवळ आहे. आता व्यवस्थापकाचा युक्तिवाद, जो महत्त्वाच्या पद्धतीने अर्धा बरोबर आहे. तो याबाबत बरोबर आहे की धारेचा कला-बाहेरचा घटक — वॅटविरहित धारा — त्याच्या यंत्रांना कोणतीही निव्वळ ऊर्जा देत नाही. प्रत्येक चक्रात ती एका दिशेने जाते आणि परतते, एका चतुर्थांशात पुरवठ्याकडून ऊर्जा उसनी घेते आणि पुढच्यात परत करते, आणि चक्रावर समाकलित केल्यावर शक्तीतला तिचा वाटा नेमका शून्य आहे. म्हणूनच मीटर 40 kW वाचते, 100 kW नाही, आणि मीटर खोटे बोलत नाही. पण निष्कर्ष निघत नाही, आणि कारण असे की वॅटविरहित धारा काल्पनिक नाही. ती खऱ्या तांब्यातून जाणारा खरा प्रभार आहे. पुरवठ्याच्या तारांना ना माहीत आहे ना पर्वा की कला काय आहे; त्या 250 A वाहतात, आणि तसे करताना I²R खर्चतात. हानी धारेच्या वर्गाने चालत असल्याने, हा लहान परिणाम नाही: तेच 40 kW एकक शक्ती गुणकावर द्यायला केवळ 100 A लागले असते, आणि (250/100)² = 6.25, म्हणून खराब शक्ती गुणक जाळ्याला अन्यथा लागणाऱ्या संचरण हानीहून सहापटींहून अधिक किंमत देत आहे. तीच धारा वरच्या प्रत्येक गोष्टीचा आकारही ठरवते — तारेचा छेद, ट्रान्सफॉर्मरचे निर्धारण, स्विचगियर, जनित्राची वेढणी. हे सर्व 250 A साठी बांधावे लागते तर विकले जातात केवळ 40 kW. म्हणून दंड मनमानी नाही; तो त्या क्षमतेचे शुल्क आहे जी कारखाना व्यापतो आणि ऊर्जा मीटरमार्फत जिची किंमत मोजत नाही. उपाय निदानातून निघतो. जर अडचण पश्चगामी धारा असेल, तर असे काही जोडा ज्याची धारा अग्रगामी असेल: धारित्र. पुरवठ्याच्या आरपार समांतरात जोडलेली धारित्रांची रांग अग्रगामी धारा ओढते जी मोटारींच्या पश्चगामी धारेचा भाग कापते, म्हणून दोन्ही प्रतिघाती वाटे वजा होतात तर वास्तविक शक्ती अस्पर्श राहते. तारेतील धारा त्या 100 A कडे घसरते जी भाराला खरोखर हवी, शक्ती गुणक 1 कडे उचलतो, तारा थंड चालतात आणि दंड नाहीसा होतो. काय घडले नाही ते लक्षात घ्या: कारखान्याची यंत्रे नेमके तेच काम करत आहेत जे आधी करत होती, आणि मीटर अजूनही 40 kW वाचते. कारखान्याच्या आत काहीही वाचले नाही. जे दुरुस्त झाले ते त्याच्याकडे जाणाऱ्या तारांतील धारा आहे. (दुसरा पर्याय वॅटविरहित धारेची ओळख बरोबर करतो आणि मग विसरतो की ती अजूनही रोधातून वाहते; तिसरा आभासी शक्तीला वास्तविक शक्ती समजतो; चौथा धारा घटवेल पण फरक उष्णता बनवून, आणि हाच तो एक उपाय जो समस्येहून महाग पडतो.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Electromagnetic Waves                                       */
  /* ----------------------------------------------------------------------- */
  {
    slug: "physics-12-electromagnetic-waves",
    subject: "PHYSICS",
    classLevel: 12,
    chapter: {
      en: "Chapter 8 — Electromagnetic Waves",
      hi: "अध्याय 8 — वैद्युतचुंबकीय तरंगें",
      mr: "प्रकरण 8 — विद्युतचुंबकीय लहरी",
    },
    name: {
      en: "Electromagnetic Waves",
      hi: "वैद्युतचुंबकीय तरंगें",
      mr: "विद्युतचुंबकीय लहरी",
    },
    summary: {
      en: "A gap in a law found by taking two different surfaces with the same rim and getting two different answers, mended by admitting that a changing electric field does everything a current does; the consequence that a changing field of either kind makes the other, so the pair can leave their source behind and travel with nothing to travel in; a speed that drops out of two constants measured in a laboratory with no light involved, and matches the measured speed of light closely enough to settle what light is; and one continuous family of such waves, differing in nothing but frequency, whose ends are so unlike in what they do to a body that only the ordering makes sense of it.",
      hi: "एक नियम में वह छेद जो एक ही किनारे वाले दो भिन्न पृष्ठ लेकर दो भिन्न उत्तर पाने से मिला, और यह मानकर भरा गया कि बदलता विद्युत क्षेत्र वह सब करता है जो धारा करती है; उसका परिणाम यह कि किसी भी क़िस्म का बदलता क्षेत्र दूसरे को बनाता है, अतः युग्म अपने स्रोत को पीछे छोड़ सकता है और बिना किसी माध्यम के चल सकता है; वह चाल जो प्रयोगशाला में बिना किसी प्रकाश के नापे गए दो स्थिरांकों से निकल आती है, और प्रकाश की नापी गई चाल से इतनी मिलती है कि यह तय हो जाए कि प्रकाश है क्या; और ऐसी तरंगों का एक सतत कुल, जो आवृत्ति के सिवा किसी बात में भिन्न नहीं, और जिसके दोनों सिरे शरीर के साथ जो करते हैं उसमें इतने असमान हैं कि केवल वह क्रम ही उसे समझाता है।",
      mr: "एका नियमातले ते छिद्र जे एकाच कडेची दोन वेगळी पृष्ठे घेऊन दोन वेगळी उत्तरे मिळवण्याने सापडले, आणि हे मान्य करून भरले गेले की बदलते विद्युत क्षेत्र ते सर्व करते जे धारा करते; त्याचा परिणाम असा की कोणत्याही प्रकारचे बदलते क्षेत्र दुसरे बनवते, म्हणून जोडी आपला स्रोत मागे सोडू शकते आणि कशातही न प्रवास करता प्रवास करू शकते; तो वेग जो प्रयोगशाळेत कोणत्याही प्रकाशाविना मोजलेल्या दोन स्थिरांकांतून निघतो, आणि प्रकाशाच्या मोजलेल्या वेगाशी इतका जुळतो की प्रकाश काय आहे हे ठरावे; आणि अशा लहरींचे एक सलग कुळ, जे वारंवारतेखेरीज कशातही वेगळे नाही, आणि ज्याची दोन टोके शरीराशी जे करतात त्यात इतकी असमान आहेत की केवळ तो क्रमच त्याचा अर्थ लावतो.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "displacement-current",
        name: {
          en: "Displacement current",
          hi: "विस्थापन धारा",
          mr: "विस्थापन धारा",
        },
        kind: "foundational idea",
        prompt: {
          en: "No charge crosses the gap between a charging capacitor's plates, yet the magnetic field around the gap is exactly what a continuing current would produce, so a term proportional to the rate of change of the electric field had to be added. What is that term called?",
          hi: "आवेशित होते संधारित्र की प्लेटों के बीच की दरार को कोई आवेश पार नहीं करता, फिर भी दरार के चारों ओर चुंबकीय क्षेत्र ठीक वही है जो चलती रहती धारा देती, अतः विद्युत क्षेत्र के परिवर्तन की दर के समानुपाती एक पद जोड़ना पड़ा। उस पद को क्या कहते हैं?",
          mr: "प्रभारित होणाऱ्या धारित्राच्या पट्ट्यांमधली फट कोणताही प्रभार ओलांडत नाही, तरीही फटीभोवतीचे चुंबकीय क्षेत्र नेमके तेच आहे जे चालू राहणारी धारा देईल, म्हणून विद्युत क्षेत्राच्या बदलाच्या गतीशी समानुपाती एक पद जोडावे लागले. त्या पदाला काय म्हणतात?",
        },
        statement: {
          en: "Displacement current is ε₀ dΦ_E/dt, the term Maxwell added to Ampère's law so that a changing electric field produces a magnetic field exactly as a conduction current does.",
          hi: "विस्थापन धारा ε₀ dΦ_E/dt है, वह पद जो मैक्सवेल ने ऐम्पियर के नियम में जोड़ा ताकि बदलता विद्युत क्षेत्र ठीक उसी तरह चुंबकीय क्षेत्र बनाए जैसे चालन धारा बनाती है।",
          mr: "विस्थापन धारा म्हणजे ε₀ dΦ_E/dt, ते पद जे मॅक्सवेलने अँपिअरच्या नियमात जोडले जेणेकरून बदलते विद्युत क्षेत्र नेमके तसेच चुंबकीय क्षेत्र बनवेल जसे वहन धारा बनवते.",
        },
        detail: {
          en: "It was not fitted to an experiment but forced by a contradiction: Ampère's law gave two different answers for the same loop depending on which surface bounded by it was chosen.",
          hi: "यह किसी प्रयोग से नहीं मिलाया गया था बल्कि एक विरोधाभास ने इसे बाध्य किया: ऐम्पियर का नियम एक ही लूप के लिए दो भिन्न उत्तर देता था, यह इस पर निर्भर कि उससे घिरा कौन-सा पृष्ठ चुना गया।",
          mr: "हे कोणत्याही प्रयोगाशी जुळवले गेले नव्हते तर एका विरोधाभासाने ते भाग पाडले: अँपिअरचा नियम एकाच वळशासाठी दोन वेगळी उत्तरे देत होता, ते यावर अवलंबून की त्याने घेरलेले कोणते पृष्ठ निवडले.",
        },
        extra: {
          en: "Its real importance is not the capacitor at all but what it made possible: with this term in place a changing electric field creates a magnetic one and a changing magnetic field creates an electric one, and the pair can sustain each other indefinitely as a wave.",
          hi: "इसका असली महत्त्व संधारित्र है ही नहीं बल्कि वह है जो इसने संभव किया: यह पद रखते ही बदलता विद्युत क्षेत्र चुंबकीय बनाता है और बदलता चुंबकीय विद्युत, और युग्म एक-दूसरे को तरंग के रूप में अनिश्चित काल तक बनाए रख सकता है।",
          mr: "याचे खरे महत्त्व धारित्र आहेच नाही तर ते आहे जे याने शक्य केले: हे पद ठेवताच बदलते विद्युत क्षेत्र चुंबकीय बनवते आणि बदलते चुंबकीय विद्युत, आणि जोडी एकमेकांना लहर म्हणून अनिश्चित काळ टिकवू शकते.",
        },
        pair: {
          left: {
            en: "Demanded by a contradiction, not by a measurement",
            hi: "किसी माप ने नहीं, एक विरोधाभास ने माँगा",
            mr: "कोणत्याही मापाने नव्हे, एका विरोधाभासाने मागितले",
          },
          right: {
            en: "displacement current",
            hi: "विस्थापन धारा",
            mr: "विस्थापन धारा",
          },
        },
      },
      {
        id: "nature-of-em-wave",
        name: {
          en: "The nature of an electromagnetic wave",
          hi: "वैद्युतचुंबकीय तरंग की प्रकृति",
          mr: "विद्युतचुंबकीय लहरीचे स्वरूप",
        },
        kind: "foundational idea",
        prompt: {
          en: "Two fields oscillate in step, at right angles to each other and both at right angles to the direction of travel, and the whole arrangement needs no medium to move through. Which description is this?",
          hi: "दो क्षेत्र एक ही कला में दोलन करते हैं, आपस में समकोण पर और दोनों चलने की दिशा के समकोण पर, और पूरी व्यवस्था को चलने के लिए किसी माध्यम की ज़रूरत नहीं। यह कौन-सा वर्णन है?",
          mr: "दोन क्षेत्रे एकाच कलेत दोलन करतात, एकमेकांना काटकोनात आणि दोन्ही प्रवासाच्या दिशेला काटकोनात, आणि अख्ख्या मांडणीला हलण्यासाठी कोणत्याही माध्यमाची गरज नाही. हे कोणते वर्णन?",
        },
        statement: {
          en: "An electromagnetic wave is a transverse wave in which E and B oscillate in phase, perpendicular to each other and to the direction of propagation, and it requires no material medium.",
          hi: "वैद्युतचुंबकीय तरंग वह अनुप्रस्थ तरंग है जिसमें E और B एक ही कला में, आपस में और संचरण की दिशा के लंबवत दोलन करते हैं, और उसे किसी भौतिक माध्यम की ज़रूरत नहीं।",
          mr: "विद्युतचुंबकीय लहर ही अशी अनुप्रस्थ लहर आहे जिच्यात E आणि B एकाच कलेत, एकमेकांना आणि संचरणाच्या दिशेला लंब दोलन करतात, आणि तिला कोणत्याही भौतिक माध्यमाची गरज नाही.",
        },
        detail: {
          en: "The two amplitudes are locked together by E₀ = cB₀, so the magnetic part looks numerically tiny in SI units and is not weak at all — the units are simply chosen so that c appears in the ratio.",
          hi: "दोनों आयाम E₀ = cB₀ से आपस में बँधे हैं, अतः SI मात्रकों में चुंबकीय भाग संख्या में नन्हा दिखता है और वह कमज़ोर है ही नहीं — मात्रक बस ऐसे चुने गए हैं कि अनुपात में c आ जाए।",
          mr: "दोन्ही आयाम E₀ = cB₀ ने एकमेकांशी बांधलेले आहेत, म्हणून SI एककांत चुंबकीय भाग संख्येने चिमुकला दिसतो आणि तो क्षीण आहेच नाही — एकके फक्त अशी निवडली आहेत की गुणोत्तरात c यावा.",
        },
        extra: {
          en: "It carries energy and momentum, so light exerts a real pressure — small enough to be ignored on a table, large enough over the area of a solar sail or the surface of a comet to be seen at work.",
          hi: "यह ऊर्जा और संवेग दोनों ढोती है, अतः प्रकाश असली दाब डालता है — मेज़ पर अनदेखा करने लायक़ छोटा, सौर पाल के क्षेत्रफल या धूमकेतु के पृष्ठ पर काम करता दिखने लायक़ बड़ा।",
          mr: "ती ऊर्जा आणि संवेग दोन्ही वाहते, म्हणून प्रकाश खरा दाब देतो — टेबलावर दुर्लक्ष करण्याइतका लहान, सौर शिडाच्या क्षेत्रफळावर वा धूमकेतूच्या पृष्ठावर काम करताना दिसण्याइतका मोठा.",
        },
        pair: {
          left: {
            en: "Needs nothing to travel in",
            hi: "चलने के लिए कुछ भी नहीं चाहिए",
            mr: "प्रवास करायला काहीही लागत नाही",
          },
          right: {
            en: "the nature of an electromagnetic wave",
            hi: "वैद्युतचुंबकीय तरंग की प्रकृति",
            mr: "विद्युतचुंबकीय लहरीचे स्वरूप",
          },
        },
      },
      {
        id: "speed-from-constants",
        name: {
          en: "The speed built from ε₀ and μ₀",
          hi: "ε₀ और μ₀ से बनी चाल",
          mr: "ε₀ आणि μ₀ पासून बनलेला वेग",
        },
        kind: "foundational idea",
        prompt: {
          en: "Two constants measured by weighing forces between charges and between wires — no optics anywhere in either experiment — combine as 1/√(ε₀μ₀) to give a number that turns out to be the measured speed of light. Which result is this?",
          hi: "दो स्थिरांक जो आवेशों के बीच और तारों के बीच बल तौलकर नापे गए — दोनों प्रयोगों में कहीं कोई प्रकाशिकी नहीं — 1/√(ε₀μ₀) के रूप में मिलकर ऐसी संख्या देते हैं जो प्रकाश की नापी गई चाल निकलती है। यह कौन-सा परिणाम है?",
          mr: "दोन स्थिरांक जे प्रभारांमधली आणि तारांमधली बले तोलून मोजले गेले — दोन्ही प्रयोगांत कुठेही प्रकाशिकी नाही — 1/√(ε₀μ₀) या रूपात मिळून अशी संख्या देतात जी प्रकाशाचा मोजलेला वेग निघते. हा कोणता निकाल?",
        },
        statement: {
          en: "The speed built from ε₀ and μ₀ is c = 1/√(ε₀μ₀) ≈ 3 × 10⁸ m/s, the speed Maxwell's equations require of an electromagnetic wave in vacuum.",
          hi: "ε₀ और μ₀ से बनी चाल c = 1/√(ε₀μ₀) ≈ 3 × 10⁸ m/s है, वही चाल जो मैक्सवेल के समीकरण निर्वात में वैद्युतचुंबकीय तरंग से माँगते हैं।",
          mr: "ε₀ आणि μ₀ पासून बनलेला वेग म्हणजे c = 1/√(ε₀μ₀) ≈ 3 × 10⁸ m/s, तोच वेग जो मॅक्सवेलची समीकरणे निर्वातात विद्युतचुंबकीय लहरीकडून मागतात.",
        },
        detail: {
          en: "The agreement was the argument: neither constant has anything to do with light, so the match was strong evidence that light IS an electromagnetic wave rather than a separate phenomenon.",
          hi: "मिलान ही तर्क था: किसी भी स्थिरांक का प्रकाश से कोई लेना-देना नहीं, अतः वह मेल इस बात का प्रबल प्रमाण था कि प्रकाश कोई अलग परिघटना नहीं बल्कि वैद्युतचुंबकीय तरंग ही है।",
          mr: "जुळणे हाच युक्तिवाद होता: कोणत्याही स्थिरांकाचा प्रकाशाशी काहीही संबंध नाही, म्हणून ते जुळणे हा प्रकाश ही वेगळी घटना नसून विद्युतचुंबकीय लहरच आहे याचा भक्कम पुरावा होता.",
        },
        extra: {
          en: "In a medium the speed becomes 1/√(εμ), always less than c, and the ratio of the two is exactly the refractive index that optics had been measuring for two centuries without knowing what it was.",
          hi: "माध्यम में चाल 1/√(εμ) हो जाती है, सदा c से कम, और दोनों का अनुपात ठीक वही अपवर्तनांक है जिसे प्रकाशिकी दो सदियों से नापती आ रही थी बिना यह जाने कि वह है क्या।",
          mr: "माध्यमात वेग 1/√(εμ) होतो, नेहमी c हून कमी, आणि दोहोंचे गुणोत्तर नेमका तोच अपवर्तनांक आहे जो प्रकाशिकी दोन शतके मोजत होती तो काय आहे हे न जाणता.",
        },
        pair: {
          left: {
            en: "No optics in either experiment, and light comes out",
            hi: "किसी भी प्रयोग में प्रकाशिकी नहीं, और प्रकाश निकल आता है",
            mr: "कोणत्याही प्रयोगात प्रकाशिकी नाही, आणि प्रकाश निघतो",
          },
          right: {
            en: "the speed built from ε₀ and μ₀",
            hi: "ε₀ और μ₀ से बनी चाल",
            mr: "ε₀ आणि μ₀ पासून बनलेला वेग",
          },
        },
      },
      {
        id: "microwaves",
        name: {
          en: "Microwaves",
          hi: "सूक्ष्म तरंगें",
          mr: "सूक्ष्म लहरी",
        },
        kind: "region of the spectrum",
        prompt: {
          en: "Wavelengths of a few centimetres, produced by klystrons and magnetrons, short enough to be aimed in a narrow beam by a dish and long enough to pass through cloud. Which region is this?",
          hi: "कुछ सेंटीमीटर की तरंगदैर्ध्य, क्लाइस्ट्रॉन और मैग्नेट्रॉन से बनी, इतनी छोटी कि तश्तरी से सँकरे पुंज में साधी जा सकें और इतनी बड़ी कि बादलों के आर-पार निकल जाएँ। यह कौन-सा भाग है?",
          mr: "काही सेंटीमीटरच्या तरंगलांबी, क्लायस्ट्रॉन आणि मॅग्नेट्रॉनने बनवलेल्या, इतक्या लहान की तबकडीने अरुंद शलाकेत रोखता याव्यात आणि इतक्या मोठ्या की ढगांच्या आरपार जाव्यात. हा कोणता भाग?",
        },
        statement: {
          en: "Microwaves occupy wavelengths of roughly a millimetre to a metre, are generated by vacuum-tube oscillators such as the magnetron, and are used for radar, satellite links and cooking.",
          hi: "सूक्ष्म तरंगें लगभग एक मिलीमीटर से एक मीटर तक की तरंगदैर्ध्य घेरती हैं, मैग्नेट्रॉन जैसे निर्वात-नलिका दोलकों से बनती हैं, और रडार, उपग्रह संपर्क तथा पकाने में काम आती हैं।",
          mr: "सूक्ष्म लहरी साधारण एक मिलीमीटर ते एक मीटर तरंगलांबी व्यापतात, मॅग्नेट्रॉनसारख्या निर्वात-नलिका दोलकांनी बनतात, आणि रडार, उपग्रह संपर्क तसेच स्वयंपाकात वापरल्या जातात.",
        },
        detail: {
          en: "An oven works because water molecules are electric dipoles that try to follow the reversing field, and the energy of that jostling appears as heat throughout the food rather than only at its surface.",
          hi: "चूल्हा इसलिए चलता है कि पानी के अणु विद्युत द्विध्रुव हैं जो उलटते क्षेत्र का पीछा करने की कोशिश करते हैं, और उस धक्कमपेल की ऊर्जा केवल सतह पर नहीं बल्कि पूरे भोजन में ऊष्मा बनकर प्रकट होती है।",
          mr: "शेगडी यामुळे चालते की पाण्याचे रेणू विद्युत द्विध्रुव आहेत जे उलटणाऱ्या क्षेत्राचा पाठलाग करू पाहतात, आणि त्या धक्काबुक्कीची ऊर्जा केवळ पृष्ठभागावर नव्हे तर अख्ख्या अन्नात उष्णता बनून प्रकट होते.",
        },
        extra: {
          en: "Radar depends on the short wavelength: a wave is only reflected usefully by an object comparable to or larger than itself, which is why an aircraft returns a centimetre wave and a raindrop mostly does not.",
          hi: "रडार छोटी तरंगदैर्ध्य पर निर्भर है: तरंग केवल उसी वस्तु से उपयोगी ढंग से परावर्तित होती है जो उसके बराबर या उससे बड़ी हो, इसीलिए विमान सेंटीमीटर तरंग लौटाता है और वर्षा की बूँद प्रायः नहीं।",
          mr: "रडार लहान तरंगलांबीवर अवलंबून आहे: लहर केवळ त्याच वस्तूकडून उपयुक्तपणे परावर्तित होते जी तिच्याइतकी वा तिहून मोठी असेल, म्हणूनच विमान सेंटीमीटर लहर परत करते आणि पावसाचा थेंब बहुधा नाही.",
        },
        pair: {
          left: {
            en: "Aimed by a dish, and it heats water from the inside",
            hi: "तश्तरी से साधी जाती हैं, और पानी को भीतर से गर्म करती हैं",
            mr: "तबकडीने रोखल्या जातात, आणि पाणी आतून तापवतात",
          },
          right: {
            en: "microwaves",
            hi: "सूक्ष्म तरंगें",
            mr: "सूक्ष्म लहरी",
          },
        },
      },
      {
        id: "infrared",
        name: {
          en: "Infrared radiation",
          hi: "अवरक्त विकिरण",
          mr: "अवरक्त प्रारण",
        },
        kind: "region of the spectrum",
        prompt: {
          en: "Emitted by everything warm, felt on the skin as radiant heat, absorbed strongly by carbon dioxide and water vapour, and used by night-vision cameras to see a person in complete darkness. Which region is this?",
          hi: "हर गर्म चीज़ से निकलता है, त्वचा पर विकिरित ऊष्मा की तरह महसूस होता है, कार्बन डाइऑक्साइड और जलवाष्प से प्रबलता से अवशोषित होता है, और रात्रि-दृष्टि कैमरे उससे पूरे अँधेरे में व्यक्ति देख लेते हैं। यह कौन-सा भाग है?",
          mr: "प्रत्येक उबदार गोष्टीतून निघते, त्वचेवर प्रारित उष्णतेसारखे जाणवते, कार्बन डायऑक्साइड आणि जलबाष्पाकडून तीव्रपणे शोषले जाते, आणि रात्रदृष्टी कॅमेरे त्याने पूर्ण अंधारात माणूस पाहतात. हा कोणता भाग?",
        },
        statement: {
          en: "Infrared radiation lies just beyond the red end of the visible band, is emitted by every warm body, and is absorbed by the vibrational modes of molecules rather than by their electrons.",
          hi: "अवरक्त विकिरण दृश्य पट्टी के लाल सिरे के ठीक आगे पड़ता है, हर गर्म पिंड से निकलता है, और अणुओं के इलेक्ट्रॉनों से नहीं बल्कि उनके कंपन-रूपों से अवशोषित होता है।",
          mr: "अवरक्त प्रारण दृश्य पट्ट्याच्या लाल टोकाच्या अगदी पुढे असते, प्रत्येक उबदार पदार्थातून निघते, आणि रेणूंच्या इलेक्ट्रॉनांकडून नव्हे तर त्यांच्या कंपन-रूपांकडून शोषले जाते.",
        },
        detail: {
          en: "The greenhouse effect is entirely its story: the atmosphere is transparent to the visible light coming in and opaque to the infrared going out, so energy enters more easily than it leaves.",
          hi: "हरितगृह प्रभाव पूरा का पूरा इसी की कहानी है: वायुमंडल भीतर आते दृश्य प्रकाश के लिए पारदर्शी और बाहर जाते अवरक्त के लिए अपारदर्शी है, अतः ऊर्जा निकलने से अधिक आसानी से भीतर आती है।",
          mr: "हरितगृह परिणाम पूर्णपणे याचीच कहाणी आहे: वातावरण आत येणाऱ्या दृश्य प्रकाशासाठी पारदर्शक आणि बाहेर जाणाऱ्या अवरक्तासाठी अपारदर्शक आहे, म्हणून ऊर्जा बाहेर पडण्याहून अधिक सहज आत येते.",
        },
        extra: {
          en: "A body's emission shifts to shorter wavelengths as it heats, which is why a poker glows dull red before it glows white and why a room-temperature object emits only in the infrared.",
          hi: "गर्म होने पर पिंड का उत्सर्जन छोटी तरंगदैर्ध्यों की ओर खिसकता है, इसीलिए सलाख़ सफ़ेद दमकने से पहले धुँधली लाल दमकती है और इसीलिए कमरे के ताप की वस्तु केवल अवरक्त में उत्सर्जित करती है।",
          mr: "तापल्यावर पदार्थाचे उत्सर्जन लहान तरंगलांबींकडे सरकते, म्हणूनच सळई पांढरी चमकण्याआधी मंद लाल चमकते आणि म्हणूनच खोलीच्या तापमानाची वस्तू केवळ अवरक्तात उत्सर्जित करते.",
        },
        pair: {
          left: {
            en: "In through the window, and it cannot get back out",
            hi: "खिड़की से भीतर, और वह बाहर लौट नहीं सकता",
            mr: "खिडकीतून आत, आणि ते बाहेर परतू शकत नाही",
          },
          right: {
            en: "infrared radiation",
            hi: "अवरक्त विकिरण",
            mr: "अवरक्त प्रारण",
          },
        },
      },
      {
        id: "ultraviolet",
        name: {
          en: "Ultraviolet radiation",
          hi: "पराबैंगनी विकिरण",
          mr: "अतिनील प्रारण",
        },
        kind: "region of the spectrum",
        prompt: {
          en: "Just beyond the violet end, energetic enough to break chemical bonds and damage DNA, stopped by ordinary window glass and by a layer of a particular gas high in the atmosphere. Which region is this?",
          hi: "बैंगनी सिरे के ठीक आगे, रासायनिक बंध तोड़ने और DNA को नुक़सान पहुँचाने लायक़ ऊर्जावान, साधारण खिड़की के काँच से और वायुमंडल में ऊँची एक विशेष गैस की परत से रुक जाता है। यह कौन-सा भाग है?",
          mr: "जांभळ्या टोकाच्या अगदी पुढे, रासायनिक बंध तोडण्याइतके आणि DNA ला हानी पोहोचवण्याइतके ऊर्जावान, साध्या खिडकीच्या काचेने आणि वातावरणात उंचावरच्या एका विशिष्ट वायूच्या थराने अडवले जाते. हा कोणता भाग?",
        },
        statement: {
          en: "Ultraviolet radiation lies just beyond the violet end of the visible band and carries enough energy per quantum to ionise atoms and break molecular bonds, which is why it causes sunburn and damages DNA.",
          hi: "पराबैंगनी विकिरण दृश्य पट्टी के बैंगनी सिरे के ठीक आगे पड़ता है और प्रति क्वांटम इतनी ऊर्जा ढोता है कि परमाणु आयनित हों और आणविक बंध टूटें, इसीलिए वह धूप से जलन देता है और DNA को नुक़सान पहुँचाता है।",
          mr: "अतिनील प्रारण दृश्य पट्ट्याच्या जांभळ्या टोकाच्या अगदी पुढे असते आणि प्रति पुंज इतकी ऊर्जा वाहते की अणू आयनित व्हावेत आणि रेणवीय बंध तुटावेत, म्हणूनच ते उन्हाने भाजते आणि DNA ला हानी पोहोचवते.",
        },
        detail: {
          en: "The ozone layer absorbs most of it before it reaches the ground, which is why a hole in that layer is a health question and not merely an atmospheric curiosity.",
          hi: "ओज़ोन परत उसका अधिकांश भाग ज़मीन तक पहुँचने से पहले सोख लेती है, इसीलिए उस परत में छेद स्वास्थ्य का प्रश्न है, केवल वायुमंडलीय कौतुक नहीं।",
          mr: "ओझोन थर त्याचा बहुतांश भाग जमिनीपर्यंत पोहोचण्याआधी शोषून घेतो, म्हणूनच त्या थरातले छिद्र आरोग्याचा प्रश्न आहे, केवळ वातावरणीय कुतूहल नव्हे.",
        },
        extra: {
          en: "Ordinary glass blocks most of it, which is why one is not sunburnt through a closed car window while still being warmed by the infrared and lit by the visible light coming through the same pane.",
          hi: "साधारण काँच उसका अधिकांश रोक देता है, इसीलिए बंद कार की खिड़की से धूप की जलन नहीं होती जबकि उसी शीशे से आते अवरक्त से गर्मी और दृश्य प्रकाश से रोशनी मिलती रहती है।",
          mr: "साधी काच त्याचा बहुतांश अडवते, म्हणूनच बंद गाडीच्या खिडकीतून ऊन भाजत नाही तर त्याच तावदानातून येणाऱ्या अवरक्ताने ऊब आणि दृश्य प्रकाशाने उजेड मिळत राहतो.",
        },
        pair: {
          left: {
            en: "Stopped by a car window, stopped by a layer of ozone",
            hi: "कार की खिड़की से रुका, ओज़ोन की परत से रुका",
            mr: "गाडीच्या खिडकीने अडवले, ओझोनच्या थराने अडवले",
          },
          right: {
            en: "ultraviolet radiation",
            hi: "पराबैंगनी विकिरण",
            mr: "अतिनील प्रारण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A capacitor is being charged. Around the connecting wire, draw a circular loop and apply Ampère's law. Bounded by that loop, one may choose a flat disc that the wire pierces, or a bag-shaped surface that passes between the capacitor's plates. The first encloses a current I, the second encloses none. What is wrong, and how was it repaired?",
          hi: "एक संधारित्र आवेशित हो रहा है। जोड़ने वाले तार के चारों ओर वृत्तीय लूप खींचो और ऐम्पियर का नियम लगाओ। उस लूप से घिरा हुआ, या तो ऐसी चपटी चकती चुनी जा सकती है जिसे तार बेधता है, या ऐसा थैलीनुमा पृष्ठ जो संधारित्र की प्लेटों के बीच से गुज़रे। पहले में धारा I घिरी है, दूसरे में कोई नहीं। क्या ग़लत है, और उसे कैसे सुधारा गया?",
          mr: "एक धारित्र प्रभारित होत आहे. जोडणाऱ्या तारेभोवती वर्तुळाकार वळसा काढा आणि अँपिअरचा नियम लावा. त्या वळशाने घेरलेले, एकतर अशी सपाट तबकडी निवडता येते जिला तार भेदते, वा अशी पिशवीसारखी पृष्ठभाग जी धारित्राच्या पट्ट्यांमधून जाते. पहिलीत धारा I घेरलेली आहे, दुसरीत काहीच नाही. काय चूक आहे, आणि ती कशी दुरुस्त केली गेली?",
        },
        choices: [
          {
            en: "Ampère's law as originally written is incomplete: it must give one answer for one loop, and here it gives two, so the law itself is at fault rather than either choice of surface. Maxwell repaired it by adding a displacement current ε₀ dΦ_E/dt to the enclosed current. Between the plates no charge crosses, but the electric field there is growing at exactly the rate needed for ε₀ dΦ_E/dt to equal I, so both surfaces now give the same answer. The repair was demanded by internal consistency, and its consequence — that a changing electric field sources a magnetic field — is what makes electromagnetic waves possible",
            hi: "ऐम्पियर का नियम जैसा मूल रूप में लिखा गया अधूरा है: उसे एक लूप के लिए एक उत्तर देना चाहिए, और यहाँ वह दो देता है, अतः दोष पृष्ठ के किसी चुनाव में नहीं बल्कि स्वयं नियम में है। मैक्सवेल ने घिरी धारा में ε₀ dΦ_E/dt विस्थापन धारा जोड़कर उसे सुधारा। प्लेटों के बीच कोई आवेश पार नहीं करता, पर वहाँ विद्युत क्षेत्र ठीक उसी दर से बढ़ रहा है जिससे ε₀ dΦ_E/dt, I के बराबर हो जाए, अतः अब दोनों पृष्ठ वही उत्तर देते हैं। यह सुधार आंतरिक संगति ने माँगा था, और उसका परिणाम — कि बदलता विद्युत क्षेत्र चुंबकीय क्षेत्र का स्रोत है — वही वैद्युतचुंबकीय तरंगों को संभव बनाता है",
            mr: "अँपिअरचा नियम मूळ रूपात लिहिल्याप्रमाणे अपूर्ण आहे: त्याने एका वळशासाठी एक उत्तर द्यावे, आणि इथे तो दोन देतो, म्हणून दोष पृष्ठाच्या कोणत्याही निवडीत नसून स्वतः नियमात आहे. मॅक्सवेलने घेरलेल्या धारेत ε₀ dΦ_E/dt ही विस्थापन धारा जोडून तो दुरुस्त केला. पट्ट्यांमध्ये कोणताही प्रभार ओलांडत नाही, पण तिथले विद्युत क्षेत्र नेमक्या त्याच गतीने वाढत आहे जिने ε₀ dΦ_E/dt हे I इतके व्हावे, म्हणून आता दोन्ही पृष्ठे तेच उत्तर देतात. ही दुरुस्ती अंतर्गत सुसंगतीने मागितली होती, आणि तिचा परिणाम — की बदलते विद्युत क्षेत्र चुंबकीय क्षेत्राचा स्रोत आहे — तोच विद्युतचुंबकीय लहरी शक्य करतो",
          },
          {
            en: "Nothing is wrong: the flat disc is the correct surface and the bag-shaped one is simply an illegitimate choice, since a surface used with Ampère's law must be flat",
            hi: "कुछ भी ग़लत नहीं: चपटी चकती ही सही पृष्ठ है और थैलीनुमा बस नाजायज़ चुनाव है, क्योंकि ऐम्पियर के नियम में काम आने वाला पृष्ठ चपटा होना चाहिए",
            mr: "काहीही चूक नाही: सपाट तबकडीच बरोबर पृष्ठ आहे आणि पिशवीसारखी फक्त बेकायदेशीर निवड आहे, कारण अँपिअरच्या नियमात वापरले जाणारे पृष्ठ सपाट असावे लागते",
          },
          {
            en: "A real current does cross the gap, carried by charges that jump between the plates through the dielectric, and the second surface encloses it after all",
            hi: "असली धारा दरार को पार करती ही है, जिसे परावैद्युत में से प्लेटों के बीच कूदते आवेश ढोते हैं, और दूसरा पृष्ठ आख़िर उसे घेरता ही है",
            mr: "खरी धारा फट ओलांडतेच, जी पराविद्युतातून पट्ट्यांमध्ये उड्या मारणारे प्रभार वाहतात, आणि दुसरे पृष्ठ अखेर तिला घेरतेच",
          },
          {
            en: "The contradiction is real but harmless, since Ampère's law was only ever intended for steady currents and a charging capacitor is outside its scope",
            hi: "विरोधाभास असली है पर हानिरहित, क्योंकि ऐम्पियर का नियम कभी केवल स्थायी धाराओं के लिए ही था और आवेशित होता संधारित्र उसकी परिधि से बाहर है",
            mr: "विरोधाभास खरा आहे पण निरुपद्रवी, कारण अँपिअरचा नियम कधीही केवळ स्थिर धारांसाठीच होता आणि प्रभारित होणारे धारित्र त्याच्या कक्षेबाहेर आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is one of the few places in school physics where a law is shown to be WRONG rather than merely limited, and the repair is worth following in detail because the result is the rest of the chapter. Set the problem up carefully. Ampère's law says that the line integral of B round a closed loop equals μ₀ times the current threading it. Notice the word 'threading': the current has to pass through some surface whose boundary is the loop. The law never specifies which surface, and it does not need to, because for a steady current any two surfaces sharing a rim are pierced by the same current — charge cannot pile up anywhere, so what enters one region leaves it. Now take the charging capacitor and keep the same loop, a circle round the wire. Choose the flat disc: the wire pierces it, the enclosed current is I, and the law gives ∮B·dl = μ₀I. Choose the bag: stretch the surface out from the same circular rim, over and around one plate, so that it passes through the gap between the plates without touching either. No charge crosses that gap. The enclosed current is zero, and the law gives ∮B·dl = 0. The left-hand side has not changed — it is the same loop, and B on it is whatever B on it is, a measurable thing. So the law has produced two different values for one measurable quantity, which is not a difficulty of interpretation but a straightforward inconsistency. Something has to give, and it cannot be the freedom to choose the surface, because that freedom is built into what the law says. Maxwell's move was to look at what IS happening in the gap. Charge is arriving on the plate at the rate I, so the field between the plates, E = σ/ε₀ = q/(ε₀A), is growing. The electric flux Φ_E = EA = q/ε₀ is therefore growing at the rate dΦ_E/dt = (1/ε₀)(dq/dt) = I/ε₀. Multiply by ε₀ and you get exactly I. So the quantity ε₀ dΦ_E/dt in the gap equals, to the last digit, the conduction current in the wire. Add it to the law as a second source of magnetic field, and the two surfaces agree: the disc sees conduction current I and no changing flux, the bag sees no conduction current and a displacement current I. The inconsistency is gone, and it is gone by construction rather than by luck. Two things deserve emphasis. First, the name is a historical misnomer — nothing is displaced and nothing flows. It is a changing electric field, given a current's name because it does a current's job of making a magnetic field. Second, and far more important, the correction was not made to fit any measurement. It was forced by requiring the theory to be self-consistent, and the payoff came afterwards: with this term present, Maxwell's equations become symmetric, a changing E makes a B and a changing B makes an E, and the pair can propagate as a wave through empty space at 1/√(ε₀μ₀). Hertz produced and detected those waves two decades later. A term added to close a logical gap turned out to predict radio. (The second option invents a restriction on surfaces that no formulation of the law contains; the third invents charge carriers that a vacuum-gap capacitor demonstrably does not have; the fourth notices the inconsistency and declines to fix it, which forfeits everything the fix made possible.)",
          hi: "यह विद्यालयी भौतिकी की उन थोड़ी जगहों में है जहाँ किसी नियम को केवल सीमित नहीं बल्कि ग़लत दिखाया जाता है, और सुधार को ब्योरे से देखना चाहिए क्योंकि उसका परिणाम बाक़ी पूरा अध्याय है। समस्या ध्यान से खड़ी करो। ऐम्पियर का नियम कहता है कि बंद लूप पर B का रेखा समाकल उसमें से गुज़रती धारा का μ₀ गुना है। 'गुज़रती' शब्द पर ध्यान दो: धारा को किसी ऐसे पृष्ठ से पार होना है जिसकी सीमा वह लूप हो। नियम कभी नहीं बताता कि कौन-सा पृष्ठ, और उसे बताने की ज़रूरत भी नहीं, क्योंकि स्थायी धारा के लिए एक ही किनारा साझा करते किन्हीं दो पृष्ठों को वही धारा बेधती है — आवेश कहीं जमा हो नहीं सकता, अतः जो एक क्षेत्र में घुसता है वही निकलता है। अब आवेशित होता संधारित्र लो और वही लूप रखो, तार के चारों ओर एक वृत्त। चपटी चकती चुनो: तार उसे बेधता है, घिरी धारा I है, और नियम देता है ∮B·dl = μ₀I. थैली चुनो: उसी वृत्तीय किनारे से पृष्ठ को खींचकर एक प्लेट के ऊपर और चारों ओर फैलाओ, ताकि वह प्लेटों के बीच की दरार से किसी को छुए बिना गुज़रे। उस दरार को कोई आवेश पार नहीं करता। घिरी धारा शून्य है, और नियम देता है ∮B·dl = 0. बायाँ पक्ष बदला नहीं — वही लूप है, और उस पर B जो है सो है, नापी जा सकने वाली चीज़। अतः नियम ने एक नापी जा सकने वाली राशि के दो भिन्न मान दे दिए, जो व्याख्या की कठिनाई नहीं बल्कि सीधी-सादी असंगति है। कुछ न कुछ छोड़ना ही पड़ेगा, और पृष्ठ चुनने की स्वतंत्रता नहीं छोड़ी जा सकती, क्योंकि वह स्वतंत्रता नियम के कथन में ही गढ़ी है। मैक्सवेल की चाल यह देखने की थी कि दरार में हो क्या रहा है। प्लेट पर आवेश I दर से पहुँच रहा है, अतः प्लेटों के बीच क्षेत्र, E = σ/ε₀ = q/(ε₀A), बढ़ रहा है। इसलिए विद्युत फ्लक्स Φ_E = EA = q/ε₀, dΦ_E/dt = (1/ε₀)(dq/dt) = I/ε₀ दर से बढ़ रहा है। ε₀ से गुणा करो और ठीक I मिलता है। अतः दरार में राशि ε₀ dΦ_E/dt तार की चालन धारा के अंतिम अंक तक बराबर है। उसे चुंबकीय क्षेत्र के दूसरे स्रोत के रूप में नियम में जोड़ो, और दोनों पृष्ठ सहमत हो जाते हैं: चकती चालन धारा I देखती है और कोई बदलता फ्लक्स नहीं, थैली कोई चालन धारा नहीं देखती और विस्थापन धारा I देखती है। असंगति चली गई, और वह संयोग से नहीं बल्कि रचना से गई। दो बातों पर ज़ोर देना चाहिए। पहली, नाम ऐतिहासिक ग़लतफ़हमी है — कुछ भी विस्थापित नहीं होता और कुछ भी बहता नहीं। वह बदलता विद्युत क्षेत्र है, जिसे धारा का नाम इसलिए दिया गया कि वह चुंबकीय क्षेत्र बनाने का धारा वाला काम करता है। दूसरी, और कहीं अधिक महत्त्वपूर्ण, यह सुधार किसी माप से मिलाने के लिए नहीं किया गया था। वह सिद्धांत को आत्मसंगत रखने की माँग ने बाध्य किया, और लाभ बाद में आया: यह पद रहते मैक्सवेल के समीकरण सममित हो जाते हैं, बदलता E एक B बनाता है और बदलता B एक E, और युग्म ख़ाली आकाश में 1/√(ε₀μ₀) चाल से तरंग की तरह संचरित हो सकता है। हर्ट्ज़ ने दो दशक बाद वे तरंगें बनाईं और पकड़ीं। एक तार्किक छेद भरने को जोड़ा गया पद रेडियो की भविष्यवाणी निकला। (दूसरा विकल्प पृष्ठों पर ऐसी पाबंदी गढ़ता है जो नियम के किसी रूप में नहीं; तीसरा ऐसे आवेश-वाहक गढ़ता है जो निर्वात-दरार वाले संधारित्र में स्पष्टतः नहीं; चौथा असंगति देख लेता है और उसे सुधारने से इनकार करता है, जिससे वह सब हाथ से जाता है जो सुधार ने संभव किया।)",
          mr: "हे शालेय भौतिकीतल्या त्या थोड्या जागांपैकी आहे जिथे एखादा नियम केवळ मर्यादित नव्हे तर चूक दाखवला जातो, आणि दुरुस्ती तपशिलाने पाहण्याजोगी आहे कारण तिचा निकाल उरलेले अख्खे प्रकरण आहे. प्रश्न काळजीपूर्वक मांडा. अँपिअरचा नियम सांगतो की बंद वळशावरील B चे रेषा समाकलन त्यातून जाणाऱ्या धारेच्या μ₀ पट आहे. 'जाणाऱ्या' या शब्दाकडे लक्ष द्या: धारेला अशा एखाद्या पृष्ठातून जावे लागते ज्याची सीमा तो वळसा असेल. नियम कधीच सांगत नाही की कोणते पृष्ठ, आणि त्याला सांगण्याची गरजही नाही, कारण स्थिर धारेसाठी एकच कड वाटून घेणाऱ्या कोणत्याही दोन पृष्ठांना तीच धारा भेदते — प्रभार कुठेही साठू शकत नाही, म्हणून जे एका प्रदेशात शिरते तेच बाहेर पडते. आता प्रभारित होणारे धारित्र घ्या आणि तोच वळसा ठेवा, तारेभोवती एक वर्तुळ. सपाट तबकडी निवडा: तार तिला भेदते, घेरलेली धारा I आहे, आणि नियम देतो ∮B·dl = μ₀I. पिशवी निवडा: त्याच वर्तुळाकार कडेपासून पृष्ठ ओढून एका पट्टीच्या वर आणि भोवती पसरवा, जेणेकरून ती पट्ट्यांमधल्या फटीतून कोणालाही स्पर्श न करता जाईल. ती फट कोणताही प्रभार ओलांडत नाही. घेरलेली धारा शून्य आहे, आणि नियम देतो ∮B·dl = 0. डावी बाजू बदलली नाही — तोच वळसा आहे, आणि त्यावरचे B जे आहे ते आहे, मोजता येणारी गोष्ट. म्हणून नियमाने एका मोजता येणाऱ्या राशीची दोन वेगळी मूल्ये दिली, जी अर्थ लावण्याची अडचण नसून सरळसोट विसंगती आहे. काहीतरी सोडावेच लागेल, आणि पृष्ठ निवडण्याचे स्वातंत्र्य सोडता येत नाही, कारण ते स्वातंत्र्य नियमाच्या विधानातच घडवलेले आहे. मॅक्सवेलची चाल म्हणजे फटीत काय घडत आहे ते पाहणे. पट्टीवर प्रभार I गतीने पोहोचत आहे, म्हणून पट्ट्यांमधले क्षेत्र, E = σ/ε₀ = q/(ε₀A), वाढत आहे. म्हणून विद्युत फ्लक्स Φ_E = EA = q/ε₀ हा dΦ_E/dt = (1/ε₀)(dq/dt) = I/ε₀ या गतीने वाढत आहे. ε₀ ने गुणा आणि नेमके I मिळते. म्हणून फटीतली राशी ε₀ dΦ_E/dt ही तारेतील वहन धारेइतकी, शेवटच्या अंकापर्यंत, आहे. तिला चुंबकीय क्षेत्राचा दुसरा स्रोत म्हणून नियमात जोडा, आणि दोन्ही पृष्ठे सहमत होतात: तबकडी वहन धारा I पाहते आणि कोणताही बदलता फ्लक्स नाही, पिशवी कोणतीही वहन धारा पाहत नाही आणि विस्थापन धारा I पाहते. विसंगती गेली, आणि ती योगायोगाने नव्हे तर रचनेने गेली. दोन गोष्टींवर भर द्यायला हवा. पहिली, नाव हा ऐतिहासिक गैरसमज आहे — काहीही विस्थापित होत नाही आणि काहीही वाहत नाही. ते बदलते विद्युत क्षेत्र आहे, ज्याला धारेचे नाव यासाठी दिले गेले की ते चुंबकीय क्षेत्र बनवण्याचे धारेचे काम करते. दुसरी, आणि कितीतरी अधिक महत्त्वाची, ही दुरुस्ती कोणत्याही मापाशी जुळवण्यासाठी केली गेली नव्हती. ती सिद्धांताला स्वतःशी सुसंगत ठेवण्याच्या मागणीने भाग पाडली, आणि फायदा नंतर आला: हे पद असताना मॅक्सवेलची समीकरणे सममित होतात, बदलता E एक B बनवतो आणि बदलता B एक E, आणि जोडी रिकाम्या अवकाशात 1/√(ε₀μ₀) वेगाने लहर म्हणून संचरू शकते. हर्ट्झने दोन दशकांनंतर त्या लहरी बनवल्या आणि पकडल्या. एक तार्किक छिद्र भरायला जोडलेले पद रेडिओचे भाकीत निघाले. (दुसरा पर्याय पृष्ठांवर अशी बंदी घडवतो जी नियमाच्या कोणत्याही रूपात नाही; तिसरा असे प्रभार-वाहक घडवतो जे निर्वात-फट असलेल्या धारित्रात स्पष्टपणे नाहीत; चौथा विसंगती पाहतो आणि ती दुरुस्त करायला नकार देतो, ज्याने दुरुस्तीने शक्य केलेले सर्व हातून जाते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A radio mast radiates 50 kW and a person may stand beside it all day; a few minutes of midday sunlight, delivering a tiny fraction of that power to the same skin, causes sunburn. A student concludes that the radio measurement must be wrong. Resolve this.",
          hi: "एक रेडियो मस्तूल 50 kW विकिरित करता है और व्यक्ति दिन भर उसके पास खड़ा रह सकता है; दोपहर की धूप के कुछ मिनट, उसी त्वचा को उस शक्ति का नन्हा-सा अंश देकर, धूप की जलन कर देते हैं। विद्यार्थी निष्कर्ष निकालता है कि रेडियो का माप ग़लत होगा। इसे सुलझाओ।",
          mr: "एक रेडिओ मनोरा 50 kW प्रारित करतो आणि माणूस दिवसभर त्याच्याजवळ उभा राहू शकतो; दुपारच्या उन्हाची काही मिनिटे, त्याच त्वचेला त्या शक्तीचा चिमुकला अंश देऊन, उन्हाने भाजतात. विद्यार्थी निष्कर्ष काढतो की रेडिओचे माप चूक असले पाहिजे. हे सोडवा.",
        },
        choices: [
          {
            en: "Both measurements are right, because damage of this kind is not decided by total power but by the energy carried by each individual quantum, E = hf. Radio photons at 10⁸ Hz carry about 10⁻⁷ eV each — far too little to break any chemical bond, so an enormous number of them merely warm the tissue. Ultraviolet photons at 10¹⁵ Hz carry several eV, comparable with bond energies, so a single one can break a DNA bond however few arrive. Turning the transmitter up sends more photons, not more energetic ones, so it can never do what UV does",
            hi: "दोनों माप सही हैं, क्योंकि इस क़िस्म की क्षति कुल शक्ति से नहीं बल्कि हर अलग क्वांटम की ढोई ऊर्जा से तय होती है, E = hf. 10⁸ Hz के रेडियो फ़ोटॉन हर एक लगभग 10⁻⁷ eV ढोते हैं — किसी रासायनिक बंध को तोड़ने के लिए कहीं बहुत कम, अतः उनकी विशाल संख्या ऊतक को बस गर्म करती है। 10¹⁵ Hz के पराबैंगनी फ़ोटॉन कई eV ढोते हैं, बंध-ऊर्जाओं के बराबर, अतः एक अकेला ही DNA का बंध तोड़ सकता है चाहे कितने ही कम आएँ। प्रेषक तेज़ करने से अधिक फ़ोटॉन जाते हैं, अधिक ऊर्जावान नहीं, अतः वह वह कभी नहीं कर सकता जो पराबैंगनी करता है",
            mr: "दोन्ही मापे बरोबर आहेत, कारण अशा प्रकारची हानी एकूण शक्तीने नव्हे तर प्रत्येक वेगळ्या पुंजाने वाहलेल्या ऊर्जेने ठरते, E = hf. 10⁸ Hz चे रेडिओ फोटॉन प्रत्येकी सुमारे 10⁻⁷ eV वाहतात — कोणताही रासायनिक बंध तोडायला कितीतरी कमी, म्हणून त्यांची प्रचंड संख्या ऊतीला फक्त तापवते. 10¹⁵ Hz चे अतिनील फोटॉन कित्येक eV वाहतात, बंध-ऊर्जांच्या तोडीचे, म्हणून एकटाच DNA चा बंध तोडू शकतो कितीही कमी आले तरी. प्रक्षेपक वाढवल्याने अधिक फोटॉन जातात, अधिक ऊर्जावान नव्हे, म्हणून तो ते कधीच करू शकत नाही जे अतिनील करते",
          },
          {
            en: "The radio measurement is indeed wrong, since 50 kW delivered to a human body would be lethal within seconds by any mechanism",
            hi: "रेडियो का माप सचमुच ग़लत है, क्योंकि मानव शरीर को दिए गए 50 kW किसी भी क्रियाविधि से सेकंडों में प्राणघातक होते",
            mr: "रेडिओचे माप खरोखर चूक आहे, कारण मानवी शरीराला दिलेले 50 kW कोणत्याही यंत्रणेने सेकंदांत प्राणघातक ठरले असते",
          },
          {
            en: "Radio waves are longer than the body and therefore pass through it without interacting at all, while ultraviolet is short enough to be absorbed",
            hi: "रेडियो तरंगें शरीर से लंबी हैं और इसलिए बिना किसी अन्योन्यक्रिया के उसके आर-पार निकल जाती हैं, जबकि पराबैंगनी इतनी छोटी है कि सोख ली जाए",
            mr: "रेडिओ लहरी शरीराहून लांब आहेत आणि म्हणून कोणत्याही परस्परक्रियेविना त्यातून आरपार जातात, तर अतिनील इतकी लहान आहे की शोषली जावी",
          },
          {
            en: "The difference is one of distance only: the Sun is far away but its total output is enormous, and a radio mast at the same total output would burn the skin equally",
            hi: "अंतर केवल दूरी का है: सूर्य दूर है पर उसका कुल उत्पादन विशाल है, और उतने ही कुल उत्पादन वाला रेडियो मस्तूल त्वचा को उतना ही जलाता",
            mr: "फरक केवळ अंतराचा आहे: सूर्य दूर आहे पण त्याचे एकूण उत्पादन प्रचंड आहे, आणि तितक्याच एकूण उत्पादनाचा रेडिओ मनोरा त्वचेला तितकेच भाजला असता",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two observations are both accurate, and the reason they seem to conflict is that the student is measuring the wrong thing. Power is energy per second delivered in total; what determines whether a chemical bond breaks is the energy delivered in one indivisible packet. A spectrum ordered by frequency is therefore also ordered by how violently each individual arrival can act. Set the numbers side by side. The Planck relation gives E = hf. For an FM broadcast at about 10⁸ Hz, E ≈ 6.6 × 10⁻³⁴ × 10⁸ ≈ 6.6 × 10⁻²⁶ J, which is about 4 × 10⁻⁷ eV. For ultraviolet at about 10¹⁵ Hz, E ≈ 6.6 × 10⁻¹⁹ J, which is about 4 eV. The ratio is roughly ten million. Now compare each with the thing that has to be broken. A typical covalent bond in a biological molecule costs a few electron-volts to break — the C–C bond about 3.6 eV, a hydrogen bond much less, the bonds whose rupture causes a thymine dimer in DNA around 3 to 4 eV. Ultraviolet quanta sit exactly in that range. Radio quanta are seven orders of magnitude below it. That gap is decisive because energy arriving in separate packets does not pool. Ten million radio photons striking one molecule do not add up to one ultraviolet photon's worth of bond-breaking; each interacts, delivers its 10⁻⁷ eV, and the molecule simply jiggles and passes the energy on as heat to its neighbours. This is the same argument that runs the photoelectric effect in a later chapter, where increasing the INTENSITY of light below the threshold frequency ejects no electrons at all however bright it becomes, and it is worth recognising as one idea in two places. So what does a 50 kW mast do to a body? It heats it, slightly and harmlessly at any ordinary distance, because heating is exactly the collective effect that many low-energy quanta can produce. Push the power far enough and heating becomes the hazard — this is why safety limits for radio and microwave exposure are written in watts per square metre and are thermal limits. Ultraviolet is regulated differently, in terms of dose, because its damage is not thermal and does not require the skin to get hot at all. Two consequences follow that are worth carrying. First, the labels IONISING and NON-IONISING divide the spectrum at roughly the far ultraviolet, and they divide it by photon energy, not by power. Radio, microwave, infrared and visible light are non-ionising; ultraviolet, X-rays and gamma rays are ionising. Second, a stronger transmitter is not a more dangerous one in kind. Turning it up sends MORE photons, not more energetic ones, so it moves a source further along a scale it was already on and never moves it onto the other scale. (The second option rejects a correct measurement rather than the assumption behind the puzzle; the third invents a transparency that a warming body refutes; the fourth reduces a difference of quantum energy to a difference of intensity, which is precisely the confusion the question is built on.)",
          hi: "दोनों प्रेक्षण यथार्थ हैं, और वे टकराते इसलिए लगते हैं कि विद्यार्थी ग़लत चीज़ नाप रहा है। शक्ति कुल मिलाकर प्रति सेकंड दी गई ऊर्जा है; रासायनिक बंध टूटेगा या नहीं यह उस ऊर्जा से तय होता है जो एक अविभाज्य पुड़िया में आती है। अतः आवृत्ति से क्रमित स्पेक्ट्रम इससे भी क्रमित है कि हर अलग आगमन कितनी हिंसा से काम कर सकता है। संख्याएँ अगल-बगल रखो। प्लांक संबंध देता है E = hf. लगभग 10⁸ Hz के FM प्रसारण के लिए, E ≈ 6.6 × 10⁻³⁴ × 10⁸ ≈ 6.6 × 10⁻²⁶ J, जो लगभग 4 × 10⁻⁷ eV है। लगभग 10¹⁵ Hz के पराबैंगनी के लिए, E ≈ 6.6 × 10⁻¹⁹ J, जो लगभग 4 eV है। अनुपात मोटे तौर पर एक करोड़ है। अब हर एक की तुलना उससे करो जिसे तोड़ना है। जैविक अणु में विशिष्ट सहसंयोजक बंध तोड़ने में कुछ इलेक्ट्रॉन-वोल्ट लगते हैं — C–C बंध लगभग 3.6 eV, हाइड्रोजन बंध उससे बहुत कम, वे बंध जिनके टूटने से DNA में थाइमीन द्विलक बनता है लगभग 3 से 4 eV. पराबैंगनी क्वांटम ठीक उसी परास में बैठते हैं। रेडियो क्वांटम उससे सात कोटि नीचे हैं। वह खाई निर्णायक है क्योंकि अलग-अलग पुड़ियों में आती ऊर्जा इकट्ठी नहीं होती। एक अणु से टकराते एक करोड़ रेडियो फ़ोटॉन मिलकर एक पराबैंगनी फ़ोटॉन जितना बंध-भंजन नहीं करते; हर एक अन्योन्यक्रिया करता है, अपने 10⁻⁷ eV देता है, और अणु बस हिलता है और ऊर्जा अपने पड़ोसियों को ऊष्मा बनाकर आगे बढ़ा देता है। यह वही तर्क है जो आगे के अध्याय में प्रकाश-विद्युत प्रभाव चलाता है, जहाँ देहली आवृत्ति से नीचे प्रकाश की तीव्रता बढ़ाने पर एक भी इलेक्ट्रॉन नहीं निकलता चाहे वह कितना भी चमकीला हो जाए, और इसे दो जगहों पर एक ही विचार के रूप में पहचानना चाहिए। तो 50 kW का मस्तूल शरीर के साथ करता क्या है? वह उसे गर्म करता है, किसी भी साधारण दूरी पर हल्के से और बिना नुक़सान के, क्योंकि तापन ठीक वही सामूहिक प्रभाव है जो बहुत सारे कम-ऊर्जा क्वांटम दे सकते हैं। शक्ति पर्याप्त बढ़ाओ और तापन ही ख़तरा बन जाता है — इसीलिए रेडियो और सूक्ष्म तरंग के संपर्क की सुरक्षा सीमाएँ वाट प्रति वर्ग मीटर में लिखी जाती हैं और वे तापीय सीमाएँ हैं। पराबैंगनी का नियमन भिन्न है, मात्रा के रूप में, क्योंकि उसकी क्षति तापीय नहीं और उसके लिए त्वचा का गर्म होना ज़रूरी ही नहीं। दो परिणाम निकलते हैं जिन्हें साथ ले जाना चाहिए। पहला, आयनकारी और अनायनकारी लेबल स्पेक्ट्रम को मोटे तौर पर दूर पराबैंगनी पर बाँटते हैं, और वे उसे फ़ोटॉन ऊर्जा से बाँटते हैं, शक्ति से नहीं। रेडियो, सूक्ष्म तरंग, अवरक्त और दृश्य प्रकाश अनायनकारी हैं; पराबैंगनी, X-किरणें और गामा किरणें आयनकारी। दूसरा, अधिक प्रबल प्रेषक क़िस्म में अधिक ख़तरनाक नहीं होता। उसे तेज़ करने से अधिक फ़ोटॉन जाते हैं, अधिक ऊर्जावान नहीं, अतः वह स्रोत को उसी पैमाने पर आगे सरकाता है जिस पर वह पहले से था और दूसरे पैमाने पर कभी नहीं ले जाता। (दूसरा विकल्प पहेली के पीछे की मान्यता के बजाय सही माप को ख़ारिज कर देता है; तीसरा ऐसी पारदर्शिता गढ़ता है जिसे गर्म होता शरीर झुठला देता है; चौथा क्वांटम ऊर्जा के अंतर को तीव्रता के अंतर में घटा देता है, और प्रश्न ठीक इसी भ्रम पर बना है।)",
          mr: "दोन्ही निरीक्षणे अचूक आहेत, आणि ती परस्परविरोधी वाटतात कारण विद्यार्थी चुकीची गोष्ट मोजत आहे. शक्ती म्हणजे एकूण मिळून दर सेकंदाला दिलेली ऊर्जा; रासायनिक बंध तुटेल की नाही हे त्या ऊर्जेने ठरते जी एका अविभाज्य पुडीत येते. म्हणून वारंवारतेने क्रमित वर्णपट यानेही क्रमित आहे की प्रत्येक वेगळे आगमन किती हिंसकपणे काम करू शकते. संख्या शेजारीशेजारी ठेवा. प्लांक संबंध देतो E = hf. सुमारे 10⁸ Hz च्या FM प्रक्षेपणासाठी, E ≈ 6.6 × 10⁻³⁴ × 10⁸ ≈ 6.6 × 10⁻²⁶ J, जे सुमारे 4 × 10⁻⁷ eV आहे. सुमारे 10¹⁵ Hz च्या अतिनीलासाठी, E ≈ 6.6 × 10⁻¹⁹ J, जे सुमारे 4 eV आहे. गुणोत्तर ढोबळमानाने एक कोटी आहे. आता प्रत्येकाची तुलना ज्याला तोडायचे आहे त्याच्याशी करा. जैविक रेणूतील नमुनेदार सहसंयुज बंध तोडायला काही इलेक्ट्रॉन-व्होल्ट लागतात — C–C बंध सुमारे 3.6 eV, हायड्रोजन बंध त्याहून खूप कमी, ज्यांच्या तुटण्याने DNA मध्ये थायमिन द्विलक बनतो ते बंध सुमारे 3 ते 4 eV. अतिनील पुंज नेमके त्याच पल्ल्यात बसतात. रेडिओ पुंज त्याहून सात कोटी खाली आहेत. ती दरी निर्णायक आहे कारण वेगवेगळ्या पुड्यांत येणारी ऊर्जा एकत्र होत नाही. एका रेणूवर आदळणारे एक कोटी रेडिओ फोटॉन मिळून एका अतिनील फोटॉनइतके बंध-भंजन करत नाहीत; प्रत्येक परस्परक्रिया करतो, आपले 10⁻⁷ eV देतो, आणि रेणू फक्त हलतो आणि ऊर्जा आपल्या शेजाऱ्यांना उष्णता बनवून पुढे देतो. हाच तो युक्तिवाद जो पुढच्या प्रकरणात प्रकाश-विद्युत परिणाम चालवतो, जिथे उंबरठा वारंवारतेखालच्या प्रकाशाची तीव्रता वाढवल्यावर एकही इलेक्ट्रॉन निघत नाही तो कितीही तेजस्वी झाला तरी, आणि हे दोन ठिकाणी एकच कल्पना म्हणून ओळखण्याजोगे आहे. तर 50 kW चा मनोरा शरीराशी करतो काय? तो त्याला तापवतो, कोणत्याही सामान्य अंतरावर किंचित आणि निरुपद्रवीपणे, कारण तापन हाच तो सामूहिक परिणाम जो पुष्कळ कमी-ऊर्जा पुंज देऊ शकतात. शक्ती पुरेशी वाढवा आणि तापनच धोका बनतो — म्हणूनच रेडिओ आणि सूक्ष्म लहरी संपर्काच्या सुरक्षा मर्यादा वॅट प्रति चौरस मीटरमध्ये लिहिल्या जातात आणि त्या औष्णिक मर्यादा आहेत. अतिनीलाचे नियमन वेगळे आहे, मात्रेच्या रूपात, कारण त्याची हानी औष्णिक नाही आणि तिच्यासाठी त्वचा तापणे आवश्यकच नाही. दोन परिणाम निघतात जे सोबत न्यायला हवेत. पहिला, आयनकारी आणि अनायनकारी ही लेबले वर्णपटाला ढोबळमानाने दूर अतिनीलावर विभागतात, आणि ती त्याला फोटॉन ऊर्जेने विभागतात, शक्तीने नव्हे. रेडिओ, सूक्ष्म लहरी, अवरक्त आणि दृश्य प्रकाश अनायनकारी आहेत; अतिनील, क्ष-किरणे आणि गॅमा किरणे आयनकारी. दुसरा, अधिक तीव्र प्रक्षेपक प्रकाराने अधिक धोकादायक नसतो. तो वाढवल्याने अधिक फोटॉन जातात, अधिक ऊर्जावान नव्हे, म्हणून तो स्रोताला त्याच मापदंडावर पुढे सरकवतो ज्यावर तो आधीच होता आणि दुसऱ्या मापदंडावर कधीच नेत नाही. (दुसरा पर्याय कोड्यामागच्या गृहीतकाऐवजी बरोबर माप नाकारतो; तिसरा अशी पारदर्शकता घडवतो जिला तापणारे शरीर खोडून काढते; चौथा पुंज ऊर्जेचा फरक तीव्रतेच्या फरकात घटवतो, आणि प्रश्न नेमका याच गोंधळावर बांधलेला आहे.)",
        },
      },
    ],
  },
  /*C5*/
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
  "physics-12-magnetism-and-matter": [
    {
      level: 1,
      stem: {
        en: "A bar magnet 0.2 m long has a pole strength of 5 A m. What is its magnetic moment, in A m²?",
        hi: "0.2 m लंबी छड़ चुंबक की ध्रुव प्रबलता 5 A m है। उसका चुंबकीय आघूर्ण, A m² में, क्या है?",
        mr: "0.2 m लांब दांडा चुंबकाची ध्रुव तीव्रता 5 A m आहे. त्याचे चुंबकीय आघूर्ण, A m² मध्ये, किती?",
      },
      answer: 1,
      wrong: [25, 0.04, 10],
      checkExpr: "5*0.2",
      solution: {
        en: "The magnetic moment is pole strength times magnetic length: 5 × 0.2 = 1 A m². Pole strength is a bookkeeping device rather than a real thing — a magnet has no isolated poles — but the product it forms is genuine and is what a field actually exerts a torque on. (0.04 divides the length by the pole strength; 25 multiplies by 5 again.)",
        hi: "चुंबकीय आघूर्ण ध्रुव प्रबलता गुणा चुंबकीय लंबाई है: 5 × 0.2 = 1 A m². ध्रुव प्रबलता असली चीज़ नहीं बल्कि हिसाब की युक्ति है — चुंबक में अलग-थलग ध्रुव होते ही नहीं — पर वह जो गुणनफल बनाती है वह असली है और क्षेत्र वस्तुतः उसी पर बल-आघूर्ण लगाता है। (0.04 लंबाई को ध्रुव प्रबलता से भाग देता है; 25 फिर से 5 से गुणा कर देता है।)",
        mr: "चुंबकीय आघूर्ण म्हणजे ध्रुव तीव्रता गुणिले चुंबकीय लांबी: 5 × 0.2 = 1 A m². ध्रुव तीव्रता ही खरी गोष्ट नसून हिशेबाची युक्ती आहे — चुंबकात एकाकी ध्रुव असतातच नाहीत — पण ती जो गुणाकार बनवते तो खरा आहे आणि क्षेत्र प्रत्यक्षात त्यावरच बलआघूर्ण लावते. (0.04 लांबीला ध्रुव तीव्रतेने भागते; 25 पुन्हा 5 ने गुणते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A magnet of moment 4 A m² is held at right angles to a uniform field of 0.5 T. What torque, in N m, acts on it?",
        hi: "4 A m² आघूर्ण वाला चुंबक 0.5 T के एकसमान क्षेत्र के समकोण पर रखा है। उस पर कितना बल-आघूर्ण, N m में, लगता है?",
        mr: "4 A m² आघूर्ण असलेला चुंबक 0.5 T च्या एकसमान क्षेत्राला काटकोनात धरला आहे. त्यावर किती बलआघूर्ण, N m मध्ये, लागते?",
      },
      answer: 2,
      wrong: [8, 0.125, 0.5],
      checkExpr: "4*0.5",
      solution: {
        en: "τ = mB sin θ, and at right angles sin θ = 1, so τ = 4 × 0.5 = 2 N m. This is the maximum the field can exert; align the magnet with the field and the torque falls to zero, which is why a compass needle settles pointing along the field rather than across it. (0.125 inverts the ratio; 8 doubles.)",
        hi: "τ = mB sin θ, और समकोण पर sin θ = 1, अतः τ = 4 × 0.5 = 2 N m. क्षेत्र जितना अधिकतम लगा सकता है यह वही है; चुंबक को क्षेत्र के अनुदिश कर दो और बल-आघूर्ण शून्य हो जाता है, इसीलिए दिक्सूचक की सुई क्षेत्र के आर-पार नहीं बल्कि उसके अनुदिश जमती है। (0.125 अनुपात उलट देता है; 8 दुगुना कर देता है।)",
        mr: "τ = mB sin θ, आणि काटकोनात sin θ = 1, म्हणून τ = 4 × 0.5 = 2 N m. क्षेत्र जितके कमाल लावू शकते ते हेच; चुंबक क्षेत्राच्या दिशेने करा आणि बलआघूर्ण शून्य होते, म्हणूनच होकायंत्राची सुई क्षेत्राच्या आरपार न होता त्याच्या दिशेने स्थिरावते. (0.125 गुणोत्तर उलटवते; 8 दुप्पट करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A closed surface is drawn so that it encloses the north end of a bar magnet, cutting through the magnet at its middle. What is the net magnetic flux through that surface, in Wb?",
        hi: "एक बंद पृष्ठ ऐसे खींचा जाता है कि वह छड़ चुंबक के उत्तरी सिरे को घेरे और चुंबक को उसके बीच से काटे। उस पृष्ठ से नेट चुंबकीय फ्लक्स, Wb में, क्या है?",
        mr: "एक बंद पृष्ठ असे काढले जाते की ते दांडा चुंबकाचे उत्तर टोक घेरेल आणि चुंबकाला त्याच्या मधून कापेल. त्या पृष्ठातून जाणारा निव्वळ चुंबकीय फ्लक्स, Wb मध्ये, किती?",
      },
      answer: 0,
      wrong: [1, 5, 10],
      checkExpr: "5-5",
      solution: {
        en: "Gauss's law for magnetism gives 0 for every closed surface without exception, so 5 − 5 = 0 Wb here. The lines that stream out of the pole face all come back in through the part of the surface that cuts across the middle of the magnet, because inside the magnet the field runs from south to north. Enclosing 'one pole' is not possible: the surface always cuts the magnet somewhere. (Any non-zero answer amounts to claiming an isolated pole has been found.)",
        hi: "चुंबकत्व के लिए गाउस का नियम बिना अपवाद हर बंद पृष्ठ के लिए 0 देता है, अतः यहाँ 5 − 5 = 0 Wb. ध्रुव-फलक से बाहर बहती सारी रेखाएँ पृष्ठ के उस भाग से लौट आती हैं जो चुंबक के बीच से काटता है, क्योंकि चुंबक के भीतर क्षेत्र दक्षिण से उत्तर की ओर चलता है। 'एक ध्रुव' घेरना संभव ही नहीं: पृष्ठ चुंबक को कहीं न कहीं काटता ही है। (कोई भी शून्येतर उत्तर यह दावा करने के बराबर है कि अलग-थलग ध्रुव मिल गया।)",
        mr: "चुंबकत्वासाठीचा गॉसचा नियम अपवादाविना प्रत्येक बंद पृष्ठासाठी 0 देतो, म्हणून इथे 5 − 5 = 0 Wb. ध्रुव-पृष्ठभागातून बाहेर वाहणाऱ्या सर्व रेषा पृष्ठाच्या त्या भागातून परत येतात जो चुंबकाच्या मधून कापतो, कारण चुंबकाच्या आत क्षेत्र दक्षिणेकडून उत्तरेकडे चालते. 'एक ध्रुव' घेरणे शक्यच नाही: पृष्ठ चुंबकाला कुठेतरी कापतेच. (कोणतेही शून्येतर उत्तर म्हणजे एकाकी ध्रुव सापडल्याचा दावा.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "At a certain place the horizontal component of the Earth's field is 0.3 G and the angle of dip is 60°. What is the total field, in G? Take cos 60° = 0.5.",
        hi: "किसी जगह पृथ्वी के क्षेत्र का क्षैतिज घटक 0.3 G है और नति कोण 60° है। कुल क्षेत्र, G में, क्या है? cos 60° = 0.5 लो।",
        mr: "एका ठिकाणी पृथ्वीच्या क्षेत्राचा आडवा घटक 0.3 G आहे आणि नती कोन 60° आहे. एकूण क्षेत्र, G मध्ये, किती? cos 60° = 0.5 घ्या.",
      },
      answer: 0.6,
      wrong: [0.15, 0.3, 1.2],
      checkExpr: "0.3/0.5",
      solution: {
        en: "The horizontal component is the projection of the total onto the horizontal, H = B cos δ, so B = H/cos δ = 0.3/0.5 = 0.6 G. The total is always the larger of the two, since a projection cannot exceed what it is a projection of — a useful check on the direction of the division. (0.15 multiplies instead of dividing; 0.3 leaves the dip out altogether.)",
        hi: "क्षैतिज घटक कुल का क्षैतिज पर प्रक्षेप है, H = B cos δ, अतः B = H/cos δ = 0.3/0.5 = 0.6 G. कुल सदा दोनों में बड़ा होता है, क्योंकि प्रक्षेप जिसका प्रक्षेप है उससे बड़ा नहीं हो सकता — भाग की दिशा की उपयोगी जाँच। (0.15 भाग देने के बजाय गुणा कर देता है; 0.3 नति को छोड़ ही देता है।)",
        mr: "आडवा घटक हा एकूणाचा आडव्यावरील प्रक्षेप आहे, H = B cos δ, म्हणून B = H/cos δ = 0.3/0.5 = 0.6 G. एकूण नेहमी दोहोंत मोठे असते, कारण प्रक्षेप ज्याचा प्रक्षेप आहे त्याहून मोठा असू शकत नाही — भागाकाराच्या दिशेची उपयुक्त तपासणी. (0.15 भागण्याऐवजी गुणते; 0.3 नती गाळूनच टाकते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A magnet of moment 0.4 A m² is held at 30° to a field of 0.2 T. What torque, in N m, acts on it? Take sin 30° = 0.5.",
        hi: "0.4 A m² आघूर्ण वाला चुंबक 0.2 T के क्षेत्र से 30° पर रखा है। उस पर कितना बल-आघूर्ण, N m में, लगता है? sin 30° = 0.5 लो।",
        mr: "0.4 A m² आघूर्ण असलेला चुंबक 0.2 T च्या क्षेत्राशी 30° वर धरला आहे. त्यावर किती बलआघूर्ण, N m मध्ये, लागते? sin 30° = 0.5 घ्या.",
      },
      answer: 0.04,
      wrong: [0.08, 0.02, 0.24],
      checkExpr: "0.4*0.2*0.5",
      solution: {
        en: "τ = mB sin θ = 0.4 × 0.2 × 0.5 = 0.04 N m. The angle is measured between the moment and the field, so a small angle means a small torque: a magnet nearly aligned is barely being turned, which is exactly why alignment is the stable position. (0.08 omits the sine; 0.24 uses cos 30° in place of sin 30°.)",
        hi: "τ = mB sin θ = 0.4 × 0.2 × 0.5 = 0.04 N m. कोण आघूर्ण और क्षेत्र के बीच नापा जाता है, अतः छोटा कोण छोटा बल-आघूर्ण देता है: लगभग संरेखित चुंबक को मुश्किल से ही घुमाया जा रहा है, और ठीक इसीलिए संरेखण ही स्थायी स्थिति है। (0.08 ज्या छोड़ देता है; 0.24 sin 30° की जगह cos 30° लगा देता है।)",
        mr: "τ = mB sin θ = 0.4 × 0.2 × 0.5 = 0.04 N m. कोन आघूर्ण आणि क्षेत्र यांच्यात मोजला जातो, म्हणून लहान कोन लहान बलआघूर्ण देतो: जवळपास संरेखित चुंबक कसाबसा फिरवला जात आहे, आणि नेमके म्हणूनच संरेखन हीच स्थिर स्थिती. (0.08 साइन गाळते; 0.24 sin 30° च्या जागी cos 30° लावते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A coil of 200 turns, each of area 0.01 m², carries a current of 4 A. What is its magnetic moment, in A m²?",
        hi: "200 फेरों की कुंडली, हर फेरे का क्षेत्रफल 0.01 m², 4 A धारा ले जाती है। उसका चुंबकीय आघूर्ण, A m² में, क्या है?",
        mr: "200 वेढ्यांचे वेटोळे, प्रत्येक वेढ्याचे क्षेत्रफळ 0.01 m², 4 A धारा वाहते. त्याचे चुंबकीय आघूर्ण, A m² मध्ये, किती?",
      },
      answer: 8,
      wrong: [2000, 0.8, 80],
      checkExpr: "200*0.01*4",
      solution: {
        en: "m = NIA = 200 × 0.01 × 4 = 8 A m². That a current loop has a magnetic moment at all is the identification this chapter rests on: the loop and a bar magnet of the same moment are indistinguishable from outside, which is why a magnet can be treated as a solenoid and never as a pair of poles. (0.8 divides by the turns; 80 slips a decimal place.)",
        hi: "m = NIA = 200 × 0.01 × 4 = 8 A m². धारा-लूप का चुंबकीय आघूर्ण होना ही वह पहचान है जिस पर यह अध्याय टिका है: उसी आघूर्ण का लूप और छड़ चुंबक बाहर से पहचाने नहीं जा सकते, इसीलिए चुंबक को परिनालिका माना जा सकता है और ध्रुवों का युग्म कभी नहीं। (0.8 फेरों से भाग दे देता है; 80 में दशमलव एक स्थान खिसक जाता है।)",
        mr: "m = NIA = 200 × 0.01 × 4 = 8 A m². धारा-वळशाला मुळात चुंबकीय आघूर्ण असणे हीच ती ओळख जिच्यावर हे प्रकरण टिकले आहे: त्याच आघूर्णाचे वळसे आणि दांडा चुंबक बाहेरून ओळखता येत नाहीत, म्हणूनच चुंबकाला सोलेनॉइड मानता येते आणि ध्रुवांची जोडी कधीच नाही. (0.8 वेढ्यांनी भागते; 80 मध्ये दशांश एक स्थान सरकतो.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A magnetising field of 500 A/m produces a magnetisation of 2500 A/m in a specimen. What is its relative permeability?",
        hi: "500 A/m का चुंबकन क्षेत्र किसी नमूने में 2500 A/m का चुंबकन देता है। उसकी सापेक्ष चुंबकशीलता क्या है?",
        mr: "500 A/m चे चुंबकन क्षेत्र एका नमुन्यात 2500 A/m चे चुंबकन देते. त्याची सापेक्ष चुंबकशीलता किती?",
      },
      answer: 6,
      wrong: [5, 0.2, 2500],
      checkExpr: "2500/500+1",
      solution: {
        en: "The susceptibility is χ = M/H = 2500/500 = 5, and the relative permeability is μ_r = 1 + χ = 6. The extra 1 is the vacuum's own contribution, which is there whether or not any material is present, so it must be added and not forgotten. A positive susceptibility this large marks the specimen as at least paramagnetic. (5 quotes the susceptibility and stops; 0.2 inverts the ratio.)",
        hi: "प्रवृत्ति χ = M/H = 2500/500 = 5 है, और सापेक्ष चुंबकशीलता μ_r = 1 + χ = 6. अतिरिक्त 1 निर्वात का अपना अंश है, जो कोई पदार्थ हो या न हो, रहता ही है, अतः उसे जोड़ना चाहिए, भूलना नहीं। इतनी बड़ी धनात्मक प्रवृत्ति नमूने को कम से कम अनुचुंबकीय ठहराती है। (5 प्रवृत्ति बताकर रुक जाता है; 0.2 अनुपात उलट देता है।)",
        mr: "प्रवृत्ती χ = M/H = 2500/500 = 5 आहे, आणि सापेक्ष चुंबकशीलता μ_r = 1 + χ = 6. जादा 1 हा निर्वाताचा स्वतःचा वाटा आहे, जो कोणताही पदार्थ असो वा नसो, असतोच, म्हणून तो जोडावा, विसरू नये. इतकी मोठी धन प्रवृत्ती नमुन्याला किमान अनुचुंबकीय ठरवते. (5 प्रवृत्ती सांगून थांबते; 0.2 गुणोत्तर उलटवते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A transformer core is taken round its hysteresis loop 50 times a second, the loop area corresponding to 300 J per cubic metre per cycle. How much energy, in kilojoules, is dissipated in one cubic metre in one minute?",
        hi: "एक ट्रांसफ़ॉर्मर की क्रोड सेकंड में 50 बार अपने शैथिल्य लूप का चक्कर लगाती है, और लूप का क्षेत्रफल 300 J प्रति घन मीटर प्रति चक्र के अनुरूप है। एक मिनट में एक घन मीटर में कितनी ऊर्जा, किलोजूल में, खपती है?",
        mr: "एक ट्रान्सफॉर्मरचा गाभा सेकंदाला 50 वेळा आपल्या शैथिल्य वळशाची फेरी मारतो, आणि वळशाचे क्षेत्रफळ 300 J प्रति घनमीटर प्रति चक्र इतके आहे. एका मिनिटात एका घनमीटरमध्ये किती ऊर्जा, किलोज्यूलमध्ये, खर्च होते?",
      },
      answer: 900,
      wrong: [15, 18, 90],
      checkExpr: "300*50*60/1000",
      solution: {
        en: "The loop area is the energy per cycle per unit volume, so multiply by the cycles: 300 × 50 × 60 = 900000 J per cubic metre per minute, which is 900 kJ. That figure is why transformer cores are made of soft magnetic material with the narrowest loop obtainable — the loss is paid every cycle, all day, for the working life of the machine. (15 uses the cycles per second alone; 18 forgets the loop area.)",
        hi: "लूप का क्षेत्रफल प्रति चक्र प्रति एकांक आयतन ऊर्जा है, अतः चक्रों से गुणा करो: 300 × 50 × 60 = 900000 J प्रति घन मीटर प्रति मिनट, अर्थात् 900 kJ. यही आँकड़ा कारण है कि ट्रांसफ़ॉर्मर की क्रोड नरम चुंबकीय पदार्थ की, जितना सँकरा लूप मिल सके उतने के साथ, बनाई जाती है — हानि हर चक्र पर, दिन भर, मशीन के पूरे कार्यकाल तक चुकानी पड़ती है। (15 केवल प्रति सेकंड चक्र लगाता है; 18 लूप का क्षेत्रफल भूल जाता है।)",
        mr: "वळशाचे क्षेत्रफळ म्हणजे प्रति चक्र प्रति एकक घनफळ ऊर्जा, म्हणून चक्रांनी गुणा: 300 × 50 × 60 = 900000 J प्रति घनमीटर प्रति मिनिट, म्हणजे 900 kJ. हाच आकडा कारण आहे की ट्रान्सफॉर्मरचा गाभा मऊ चुंबकीय पदार्थाचा, जितका अरुंद वळसा मिळेल तितक्यासह, बनवला जातो — हानी प्रत्येक चक्रावर, दिवसभर, यंत्राच्या पूर्ण कार्यकाळापर्यंत मोजावी लागते. (15 केवळ प्रति सेकंद चक्रे लावते; 18 वळशाचे क्षेत्रफळ विसरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A magnet of moment 2 A m², initially aligned with a field of 0.5 T, is turned until it is at right angles to the field. How much work, in joules, is done?",
        hi: "2 A m² आघूर्ण वाला चुंबक, जो आरंभ में 0.5 T के क्षेत्र के अनुदिश था, तब तक घुमाया जाता है जब तक वह क्षेत्र के समकोण पर न हो जाए। कितना कार्य, जूल में, होता है?",
        mr: "2 A m² आघूर्ण असलेला चुंबक, जो सुरुवातीला 0.5 T च्या क्षेत्राच्या दिशेने होता, तोवर फिरवला जातो जोवर तो क्षेत्राला काटकोनात होत नाही. किती कार्य, ज्यूलमध्ये, होते?",
      },
      answer: 1,
      wrong: [0, 2, 0.25],
      checkExpr: "2*0.5",
      solution: {
        en: "The potential energy of a magnet in a field is U = −mB cos θ, so the work is mB(cos θ₁ − cos θ₂) = 2 × 0.5 × (1 − 0) = 1 J. The minus sign in U is doing real work: it makes the aligned position the minimum of energy, which is why a compass needle comes to rest there and why turning it away costs something. (0 assumes no work is needed since the field does not move; 2 uses a full reversal instead of a quarter turn.)",
        hi: "क्षेत्र में चुंबक की स्थितिज ऊर्जा U = −mB cos θ है, अतः कार्य mB(cos θ₁ − cos θ₂) = 2 × 0.5 × (1 − 0) = 1 J. U में ऋण चिह्न असली काम कर रहा है: वह संरेखित स्थिति को ऊर्जा का न्यूनतम बनाता है, इसीलिए दिक्सूचक की सुई वहीं आकर ठहरती है और इसीलिए उसे हटाने में कुछ लगता है। (0 मान लेता है कि कार्य चाहिए ही नहीं क्योंकि क्षेत्र हिलता नहीं; 2 चौथाई घुमाव के बजाय पूरा उलटाव लगा देता है।)",
        mr: "क्षेत्रातील चुंबकाची स्थितिज ऊर्जा U = −mB cos θ आहे, म्हणून कार्य mB(cos θ₁ − cos θ₂) = 2 × 0.5 × (1 − 0) = 1 J. U मधले ऋण चिन्ह खरे काम करत आहे: ते संरेखित स्थितीला ऊर्जेचे किमान बनवते, म्हणूनच होकायंत्राची सुई तिथेच येऊन थांबते आणि म्हणूनच तिला हलवायला काहीतरी लागते. (0 गृहीत धरते की कार्य लागतच नाही कारण क्षेत्र हलत नाही; 2 चतुर्थांश फिरवण्याऐवजी पूर्ण उलटवणे लावते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A magnet of moment 3 A m² lying along a field of 0.4 T is turned right round until it points the opposite way. How much work, in joules, is done?",
        hi: "0.4 T के क्षेत्र के अनुदिश पड़ा 3 A m² आघूर्ण वाला चुंबक तब तक घुमाया जाता है जब तक वह उलटी दिशा में न हो जाए। कितना कार्य, जूल में, होता है?",
        mr: "0.4 T च्या क्षेत्राच्या दिशेने पडलेला 3 A m² आघूर्ण असलेला चुंबक तोवर फिरवला जातो जोवर तो उलट दिशेने होत नाही. किती कार्य, ज्यूलमध्ये, होते?",
      },
      answer: 2.4,
      wrong: [1.2, 0, 0.6],
      checkExpr: "2*3*0.4",
      solution: {
        en: "W = mB(cos 0° − cos 180°) = mB(1 − (−1)) = 2mB = 2 × 3 × 0.4 = 2.4 J. Compare this with a quarter turn, which costs only mB: the second ninety degrees is as expensive as the first, because the magnet is being pushed from the minimum of energy right up to the maximum. Note also that the reversed position is an equilibrium — the torque there is zero — but an unstable one, since the smallest nudge sends the magnet swinging back through 180°. (1.2 stops at the perpendicular position; 0 argues that a full turn returns the magnet to an equivalent orientation, which is true of the field's direction but not of the magnet's.)",
        hi: "W = mB(cos 0° − cos 180°) = mB(1 − (−1)) = 2mB = 2 × 3 × 0.4 = 2.4 J. इसकी चौथाई घुमाव से तुलना करो, जिसमें केवल mB लगता है: दूसरे नब्बे अंश पहले जितने ही महँगे हैं, क्योंकि चुंबक को ऊर्जा के न्यूनतम से सीधे अधिकतम तक धकेला जा रहा है। यह भी ध्यान दो कि उलटी स्थिति संतुलन है — वहाँ बल-आघूर्ण शून्य है — पर अस्थायी, क्योंकि ज़रा-सा धक्का चुंबक को 180° घुमाकर वापस भेज देता है। (1.2 लंबवत स्थिति पर रुक जाता है; 0 तर्क देता है कि पूरा घुमाव चुंबक को समतुल्य अभिविन्यास पर लौटा देता है, जो क्षेत्र की दिशा के लिए सच है पर चुंबक की दिशा के लिए नहीं।)",
        mr: "W = mB(cos 0° − cos 180°) = mB(1 − (−1)) = 2mB = 2 × 3 × 0.4 = 2.4 J. याची चतुर्थांश फिरवण्याशी तुलना करा, ज्यात केवळ mB लागते: दुसरे नव्वद अंश पहिल्याइतकेच महाग आहेत, कारण चुंबकाला ऊर्जेच्या किमानापासून थेट कमालपर्यंत ढकलले जात आहे. हेही लक्षात घ्या की उलटी स्थिती हे संतुलन आहे — तिथे बलआघूर्ण शून्य आहे — पण अस्थिर, कारण जरासा धक्का चुंबकाला 180° फिरवून परत पाठवतो. (1.2 लंब स्थितीवर थांबते; 0 युक्तिवाद करते की पूर्ण फिरवणे चुंबकाला समतुल्य मांडणीवर परत आणते, जे क्षेत्राच्या दिशेसाठी खरे आहे पण चुंबकाच्या दिशेसाठी नाही.)",
      },
    },
  ],
  "physics-12-electromagnetic-induction": [
    {
      level: 1,
      stem: {
        en: "A coil of area 0.2 m² is placed with its plane at right angles to a uniform field of 0.5 T. What is the magnetic flux through it, in Wb?",
        hi: "0.2 m² क्षेत्रफल की कुंडली इस तरह रखी जाती है कि उसका तल 0.5 T के एकसमान क्षेत्र के समकोण पर हो। उससे गुज़रता चुंबकीय फ्लक्स, Wb में, क्या है?",
        mr: "0.2 m² क्षेत्रफळाचे वेटोळे असे ठेवले जाते की त्याचे प्रतल 0.5 T च्या एकसमान क्षेत्राला काटकोनात असेल. त्यातून जाणारा चुंबकीय फ्लक्स, Wb मध्ये, किती?",
      },
      answer: 0.1,
      wrong: [2.5, 0.7, 0.25],
      checkExpr: "0.2*0.5",
      solution: {
        en: "With the plane of the coil perpendicular to the field, the normal to the coil is along the field, θ = 0 and cos θ = 1, so Φ = BA = 0.5 × 0.2 = 0.1 Wb. The trap is the wording: the angle in the formula is measured to the NORMAL, not to the plane, so 'plane perpendicular to the field' is the maximum-flux case and not the zero-flux case. (0.7 adds the two numbers; 2.5 inverts the product.)",
        hi: "कुंडली का तल क्षेत्र के लंबवत होने पर कुंडली का अभिलंब क्षेत्र के अनुदिश है, θ = 0 और cos θ = 1, अतः Φ = BA = 0.5 × 0.2 = 0.1 Wb. जाल शब्दों में है: सूत्र में कोण अभिलंब से नापा जाता है, तल से नहीं, अतः 'तल क्षेत्र के लंबवत' अधिकतम फ्लक्स की स्थिति है, शून्य फ्लक्स की नहीं। (0.7 दोनों संख्याएँ जोड़ देता है; 2.5 गुणनफल उलट देता है।)",
        mr: "वेटोळ्याचे प्रतल क्षेत्राला लंब असल्याने वेटोळ्याचा लंब क्षेत्राच्या दिशेने आहे, θ = 0 आणि cos θ = 1, म्हणून Φ = BA = 0.5 × 0.2 = 0.1 Wb. सापळा शब्दांत आहे: सूत्रातला कोन लंबापासून मोजला जातो, प्रतलापासून नाही, म्हणून 'प्रतल क्षेत्राला लंब' ही कमाल फ्लक्सची स्थिती आहे, शून्य फ्लक्सची नाही. (0.7 दोन्ही संख्या जोडते; 2.5 गुणाकार उलटवते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "The magnetic flux through a single loop falls from 0.6 Wb to 0.2 Wb in 0.1 s. What is the magnitude of the induced e.m.f.?",
        hi: "एक अकेले लूप से गुज़रता चुंबकीय फ्लक्स 0.1 s में 0.6 Wb से घटकर 0.2 Wb हो जाता है। प्रेरित विद्युत वाहक बल का परिमाण क्या है?",
        mr: "एका वळशातून जाणारा चुंबकीय फ्लक्स 0.1 s मध्ये 0.6 Wb वरून घटून 0.2 Wb होतो. प्रेरित विद्युतचालक बलाचे परिमाण किती?",
      },
      answer: 4,
      wrong: [0.04, 8, 2],
      checkExpr: "0.4/0.1",
      fmt: volts,
      solution: {
        en: "Faraday's law gives |ε| = |ΔΦ|/Δt = 0.4/0.1 = 4 V. Only the CHANGE and the time enter; the actual values 0.6 and 0.2 matter to nothing except their difference, which is why a huge steady flux induces nothing at all. (0.04 multiplies by the time instead of dividing; 8 doubles.)",
        hi: "फैराडे का नियम देता है |ε| = |ΔΦ|/Δt = 0.4/0.1 = 4 V. केवल परिवर्तन और समय आते हैं; वास्तविक मान 0.6 और 0.2 उनके अंतर के सिवा किसी काम के नहीं, इसीलिए विशाल स्थिर फ्लक्स कुछ भी प्रेरित नहीं करता। (0.04 भाग देने के बजाय समय से गुणा कर देता है; 8 दुगुना कर देता है।)",
        mr: "फॅरेडेचा नियम देतो |ε| = |ΔΦ|/Δt = 0.4/0.1 = 4 V. केवळ बदल आणि काळ येतात; प्रत्यक्ष मूल्ये 0.6 आणि 0.2 त्यांच्या फरकाखेरीज कशाच्याही उपयोगाची नाहीत, म्हणूनच प्रचंड स्थिर फ्लक्स काहीही प्रेरित करत नाही. (0.04 भागण्याऐवजी काळाने गुणते; 8 दुप्पट करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A coil of 200 turns has the flux through each turn changed by 0.01 Wb in 0.4 s. What is the induced e.m.f.?",
        hi: "200 फेरों की कुंडली में हर फेरे से गुज़रता फ्लक्स 0.4 s में 0.01 Wb बदलता है। प्रेरित विद्युत वाहक बल क्या है?",
        mr: "200 वेढ्यांच्या वेटोळ्यात प्रत्येक वेढ्यातून जाणारा फ्लक्स 0.4 s मध्ये 0.01 Wb ने बदलतो. प्रेरित विद्युतचालक बल किती?",
      },
      answer: 5,
      wrong: [0.005, 50, 0.5],
      checkExpr: "200*0.01/0.4",
      fmt: volts,
      solution: {
        en: "For N turns, |ε| = N|ΔΦ|/Δt = 200 × 0.01/0.4 = 5 V. Each turn is a separate loop threaded by the same flux, and their e.m.f.s are in series, which is why winding more turns is the cheapest way to raise the output of any induction device. (0.005 forgets the turns; 50 divides by 0.04.)",
        hi: "N फेरों के लिए, |ε| = N|ΔΦ|/Δt = 200 × 0.01/0.4 = 5 V. हर फेरा वही फ्लक्स समेटे अलग लूप है, और उनके विद्युत वाहक बल श्रेणी में हैं, इसीलिए अधिक फेरे लपेटना किसी भी प्रेरण युक्ति का उत्पादन बढ़ाने का सबसे सस्ता रास्ता है। (0.005 फेरे भूल जाता है; 50 0.04 से भाग दे देता है।)",
        mr: "N वेढ्यांसाठी, |ε| = N|ΔΦ|/Δt = 200 × 0.01/0.4 = 5 V. प्रत्येक वेढा तोच फ्लक्स सामावणारा वेगळा वळसा आहे, आणि त्यांची विद्युतचालक बले श्रेणीत आहेत, म्हणूनच अधिक वेढे गुंडाळणे हा कोणत्याही प्रेरण साधनाचे उत्पादन वाढवण्याचा सर्वांत स्वस्त मार्ग आहे. (0.005 वेढे विसरते; 50 हे 0.04 ने भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A straight rod 0.5 m long moves at 4 m/s at right angles to both its own length and a field of 0.2 T. What e.m.f. appears across its ends?",
        hi: "0.5 m लंबी सीधी छड़ अपनी लंबाई और 0.2 T के क्षेत्र दोनों के समकोण पर 4 m/s से चलती है। उसके सिरों के आर-पार कौन-सा विद्युत वाहक बल प्रकट होता है?",
        mr: "0.5 m लांब सरळ कांडी आपल्या लांबीला आणि 0.2 T च्या क्षेत्राला दोन्हींना काटकोनात 4 m/s ने हलते. तिच्या टोकांच्या आरपार कोणते विद्युतचालक बल प्रकट होते?",
      },
      answer: 0.4,
      wrong: [4, 0.1, 1.6],
      checkExpr: "0.2*0.5*4",
      fmt: volts,
      solution: {
        en: "ε = Blv = 0.2 × 0.5 × 4 = 0.4 V. The rod need not be part of a circuit for this voltage to exist — the charges simply pile up at the ends until their own electric field balances the magnetic force. Complete the circuit and the same voltage drives a current; leave it open and the voltage sits there. (0.1 leaves out the speed; 1.6 divides by the field instead of multiplying.)",
        hi: "ε = Blv = 0.2 × 0.5 × 4 = 0.4 V. इस वोल्टता के होने के लिए छड़ का किसी परिपथ का भाग होना ज़रूरी नहीं — आवेश बस सिरों पर तब तक जमा होते हैं जब तक उनका अपना विद्युत क्षेत्र चुंबकीय बल को संतुलित न कर दे। परिपथ पूरा करो और वही वोल्टता धारा चलाती है; खुला छोड़ दो और वोल्टता वहीं बैठी रहती है। (0.1 चाल छोड़ देता है; 1.6 क्षेत्र से गुणा करने के बजाय भाग दे देता है।)",
        mr: "ε = Blv = 0.2 × 0.5 × 4 = 0.4 V. हा व्होल्टेज असण्यासाठी कांडीने कोणत्याही परिपथाचा भाग असणे गरजेचे नाही — प्रभार फक्त टोकांवर तोवर साठतात जोवर त्यांचे स्वतःचे विद्युत क्षेत्र चुंबकीय बलाला तोलत नाही. परिपथ पूर्ण करा आणि तोच व्होल्टेज धारा चालवतो; उघडा ठेवा आणि व्होल्टेज तिथेच बसून राहतो. (0.1 वेग गाळते; 1.6 क्षेत्राने गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A coil of self-inductance 2 H carries a current that is changing at 3 A/s. What is the magnitude of the induced e.m.f.?",
        hi: "2 H स्वप्रेरकत्व वाली कुंडली में बहती धारा 3 A/s की दर से बदल रही है। प्रेरित विद्युत वाहक बल का परिमाण क्या है?",
        mr: "2 H स्वयंप्रेरकत्व असलेल्या वेटोळ्यातून वाहणारी धारा 3 A/s या गतीने बदलत आहे. प्रेरित विद्युतचालक बलाचे परिमाण किती?",
      },
      answer: 6,
      wrong: [1.5, 0.5, 5],
      checkExpr: "2*3",
      fmt: volts,
      solution: {
        en: "|ε| = L|dI/dt| = 2 × 3 = 6 V. The e.m.f. depends on the RATE at which the current changes and not on the current itself, so a coil carrying a large steady current induces nothing while one carrying almost none but switching quickly can induce a great deal — which is why opening the switch on an electromagnet is where the spark appears. (1.5 inverts the ratio; 5 adds the two numbers.)",
        hi: "|ε| = L|dI/dt| = 2 × 3 = 6 V. विद्युत वाहक बल धारा के बदलने की दर पर निर्भर है, स्वयं धारा पर नहीं, अतः बड़ी स्थिर धारा ले जाती कुंडली कुछ प्रेरित नहीं करती जबकि लगभग कोई धारा न ले जाती पर तेज़ी से स्विच होती कुंडली बहुत कुछ प्रेरित कर सकती है — इसीलिए विद्युत चुंबक का स्विच खोलने पर ही चिनगारी दिखती है। (1.5 अनुपात उलट देता है; 5 दोनों संख्याएँ जोड़ देता है।)",
        mr: "|ε| = L|dI/dt| = 2 × 3 = 6 V. विद्युतचालक बल धारा बदलण्याच्या गतीवर अवलंबून आहे, स्वतः धारेवर नाही, म्हणून मोठी स्थिर धारा वाहणारे वेटोळे काहीही प्रेरित करत नाही तर जवळपास काहीच धारा न वाहणारे पण झटपट स्विच होणारे वेटोळे बरेच काही प्रेरित करू शकते — म्हणूनच विद्युत चुंबकाचा स्विच उघडतानाच ठिणगी दिसते. (1.5 गुणोत्तर उलटवते; 5 दोन्ही संख्या जोडते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "How much energy, in joules, is stored in an inductor of 4 H carrying a steady current of 3 A?",
        hi: "3 A की स्थिर धारा ले जाते 4 H के प्रेरक में कितनी ऊर्जा, जूल में, संचित है?",
        mr: "3 A ची स्थिर धारा वाहणाऱ्या 4 H च्या प्रेरकात किती ऊर्जा, ज्यूलमध्ये, साठलेली आहे?",
      },
      answer: 18,
      wrong: [36, 6, 12],
      checkExpr: "0.5*4*9",
      solution: {
        en: "U = ½LI² = 0.5 × 4 × 3² = 0.5 × 4 × 9 = 18 J. The energy is stored in the magnetic field rather than in the wire, and it has to go somewhere when the circuit is broken — which is why a large inductor draws an arc across an opening switch and why such circuits are fitted with a diode to give the current a path home. (36 drops the half; 6 forgets to square the current.)",
        hi: "U = ½LI² = 0.5 × 4 × 3² = 0.5 × 4 × 9 = 18 J. ऊर्जा तार में नहीं बल्कि चुंबकीय क्षेत्र में संचित है, और परिपथ टूटने पर उसे कहीं जाना ही पड़ता है — इसीलिए बड़ा प्रेरक खुलते स्विच के आर-पार चाप खींचता है और इसीलिए ऐसे परिपथों में धारा को घर लौटने का रास्ता देने को डायोड लगाया जाता है। (36 आधा छोड़ देता है; 6 धारा का वर्ग करना भूल जाता है।)",
        mr: "U = ½LI² = 0.5 × 4 × 3² = 0.5 × 4 × 9 = 18 J. ऊर्जा तारेत नव्हे तर चुंबकीय क्षेत्रात साठलेली आहे, आणि परिपथ तुटल्यावर तिला कुठेतरी जावेच लागते — म्हणूनच मोठा प्रेरक उघडणाऱ्या स्विचच्या आरपार चाप ओढतो आणि म्हणूनच अशा परिपथांत धारेला घरी परतायचा मार्ग देण्यास डायोड लावला जातो. (36 निम्मे गाळते; 6 धारेचा वर्ग करणे विसरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A current of 5 A in a coil produces a total flux linkage of 0.4 Wb. What is the coil's self-inductance, in H?",
        hi: "किसी कुंडली में 5 A धारा 0.4 Wb का कुल फ्लक्स-बंधन देती है। कुंडली का स्वप्रेरकत्व, H में, क्या है?",
        mr: "एका वेटोळ्यात 5 A धारा 0.4 Wb चे एकूण फ्लक्स-बंधन देते. वेटोळ्याचे स्वयंप्रेरकत्व, H मध्ये, किती?",
      },
      answer: 0.08,
      wrong: [12.5, 2, 0.8],
      checkExpr: "0.4/5",
      solution: {
        en: "L is defined as flux linkage per unit current: L = NΦ/I = 0.4/5 = 0.08 H. Like capacitance, it is fixed by geometry and the core, so this same coil would give 0.8 Wb at 10 A and its inductance would still read 0.08 H. (12.5 inverts the ratio; 2 multiplies instead of dividing.)",
        hi: "L की परिभाषा प्रति एकांक धारा फ्लक्स-बंधन है: L = NΦ/I = 0.4/5 = 0.08 H. धारिता की तरह यह ज्यामिति और क्रोड से तय है, अतः वही कुंडली 10 A पर 0.8 Wb देती और उसका प्रेरकत्व फिर भी 0.08 H ही पढ़ा जाता। (12.5 अनुपात उलट देता है; 2 भाग देने के बजाय गुणा कर देता है।)",
        mr: "L ची व्याख्या प्रति एकक धारा फ्लक्स-बंधन अशी आहे: L = NΦ/I = 0.4/5 = 0.08 H. धारितेप्रमाणे हे भूमिती आणि गाभ्याने ठरलेले आहे, म्हणून तेच वेटोळे 10 A वर 0.8 Wb देईल आणि त्याचे प्रेरकत्व तरीही 0.08 H च वाचले जाईल. (12.5 गुणोत्तर उलटवते; 2 भागण्याऐवजी गुणते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Two coils have a mutual inductance of 0.5 H. The current in the first is changing at 20 A/s. What e.m.f. is induced in the second?",
        hi: "दो कुंडलियों का अन्योन्य प्रेरकत्व 0.5 H है। पहली में धारा 20 A/s की दर से बदल रही है। दूसरी में कौन-सा विद्युत वाहक बल प्रेरित होता है?",
        mr: "दोन वेटोळ्यांचे अन्योन्य प्रेरकत्व 0.5 H आहे. पहिल्यातील धारा 20 A/s या गतीने बदलत आहे. दुसऱ्यात कोणते विद्युतचालक बल प्रेरित होते?",
      },
      answer: 10,
      wrong: [40, 2.5, 0.025],
      checkExpr: "0.5*20",
      fmt: volts,
      solution: {
        en: "|ε| = M|dI/dt| = 0.5 × 20 = 10 V. Mutual inductance is symmetric — the same M works either way round, so changing the current in the second coil at 20 A/s would induce 10 V in the first — and a transformer is nothing but this arrangement with the coupling made as close to complete as an iron core can manage. (2.5 inverts the ratio; 40 doubles.)",
        hi: "|ε| = M|dI/dt| = 0.5 × 20 = 10 V. अन्योन्य प्रेरकत्व सममित है — वही M दोनों दिशाओं में चलता है, अतः दूसरी कुंडली में धारा 20 A/s से बदलने पर पहली में 10 V प्रेरित होता — और ट्रांसफ़ॉर्मर इसी व्यवस्था के सिवा कुछ नहीं, जिसमें युग्मन को लोहे की क्रोड जितना पूर्ण कर सके उतना पूर्ण कर दिया गया है। (2.5 अनुपात उलट देता है; 40 दुगुना कर देता है।)",
        mr: "|ε| = M|dI/dt| = 0.5 × 20 = 10 V. अन्योन्य प्रेरकत्व सममित आहे — तोच M दोन्ही दिशांनी चालतो, म्हणून दुसऱ्या वेटोळ्यातील धारा 20 A/s ने बदलल्यास पहिल्यात 10 V प्रेरित होईल — आणि ट्रान्सफॉर्मर याच मांडणीखेरीज काहीच नाही, ज्यात जोडणी लोखंडाचा गाभा जितकी पूर्ण करू शकेल तितकी पूर्ण केली आहे. (2.5 गुणोत्तर उलटवते; 40 दुप्पट करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A rod of length 1 m slides on frictionless rails at 2 m/s in a field of 0.5 T, the circuit having a total resistance of 0.5 Ω. What force must be applied to keep the rod moving at constant speed?",
        hi: "1 m लंबी छड़ 0.5 T के क्षेत्र में घर्षणहीन पटरियों पर 2 m/s से सरकती है, और परिपथ का कुल प्रतिरोध 0.5 Ω है। छड़ को अचर चाल पर चलाए रखने के लिए कितना बल लगाना पड़ेगा?",
        mr: "1 m लांब कांडी 0.5 T च्या क्षेत्रात घर्षणविरहित रुळांवर 2 m/s ने सरकते, आणि परिपथाचा एकूण रोध 0.5 Ω आहे. कांडीला अचल वेगावर चालवत ठेवण्यासाठी किती बल लावावे लागेल?",
      },
      answer: 1,
      wrong: [0.5, 2, 4],
      checkExpr: "0.25*2/0.5",
      fmt: newtons,
      solution: {
        en: "The motional e.m.f. is Blv = 0.5 × 1 × 2 = 1 V, so the current is I = 1/0.5 = 2 A, and the rod carrying that current in the field feels F = BIl = 0.5 × 2 × 1 = 1 N against its motion. Combining, F = B²l²v/R = 0.25 × 2/0.5 = 1 N, and the applied force must match it exactly since the rails are frictionless and the speed is constant. Note that the force grows with speed, so this arrangement has a terminal velocity if the rod is simply released on a slope. (0.5 stops at the e.m.f.; 4 forgets to square the field.)",
        hi: "गतिक विद्युत वाहक बल Blv = 0.5 × 1 × 2 = 1 V है, अतः धारा I = 1/0.5 = 2 A, और क्षेत्र में वह धारा ले जाती छड़ अपनी गति के विरुद्ध F = BIl = 0.5 × 2 × 1 = 1 N अनुभव करती है। मिलाकर, F = B²l²v/R = 0.25 × 2/0.5 = 1 N, और लगाया गया बल ठीक उतना ही होना चाहिए क्योंकि पटरियाँ घर्षणहीन हैं और चाल अचर है। ध्यान दो कि बल चाल के साथ बढ़ता है, अतः छड़ को ढलान पर यों ही छोड़ दिया जाए तो इस व्यवस्था का सीमांत वेग होता है। (0.5 विद्युत वाहक बल पर रुक जाता है; 4 क्षेत्र का वर्ग करना भूल जाता है।)",
        mr: "गतिक विद्युतचालक बल Blv = 0.5 × 1 × 2 = 1 V आहे, म्हणून धारा I = 1/0.5 = 2 A, आणि क्षेत्रात ती धारा वाहणारी कांडी आपल्या गतीविरुद्ध F = BIl = 0.5 × 2 × 1 = 1 N अनुभवते. मिळून, F = B²l²v/R = 0.25 × 2/0.5 = 1 N, आणि लावलेले बल नेमके तितकेच असावे कारण रूळ घर्षणविरहित आहेत आणि वेग अचल आहे. लक्षात घ्या की बल वेगासोबत वाढते, म्हणून कांडी उतारावर नुसती सोडली तर या मांडणीला सीमांत वेग असतो. (0.5 विद्युतचालक बलावर थांबते; 4 क्षेत्राचा वर्ग करणे विसरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "For that same rod — 1 m long, 2 m/s, 0.5 T, circuit resistance 0.5 Ω — what electrical power, in watts, is dissipated in the resistance?",
        hi: "उसी छड़ के लिए — 1 m लंबी, 2 m/s, 0.5 T, परिपथ प्रतिरोध 0.5 Ω — प्रतिरोध में कितनी विद्युत शक्ति, वाट में, खपती है?",
        mr: "त्याच कांडीसाठी — 1 m लांब, 2 m/s, 0.5 T, परिपथ रोध 0.5 Ω — रोधात किती विद्युत शक्ती, वॉटमध्ये, खर्च होते?",
      },
      answer: 2,
      wrong: [1, 4, 0.5],
      checkExpr: "1/0.5",
      solution: {
        en: "P = ε²/R = 1²/0.5 = 1/0.5 = 2 W. Now check the books against the previous question: the applied force there was 1 N and the speed is 2 m/s, so the mechanical power supplied is Fv = 1 × 2 = 2 W — the same number. This is not a coincidence but the whole content of a generator: mechanical work goes in, electrical energy comes out, and Lenz's law is the mechanism that makes you pay. Open the circuit and R becomes infinite: no current, no retarding force, and the rod slides freely — which is why a dynamo is easy to turn until the lamp is switched on. (1 quotes the e.m.f. or the force; 4 squares the current without the resistance.)",
        hi: "P = ε²/R = 1²/0.5 = 1/0.5 = 2 W. अब पिछले प्रश्न से बहीखाता मिलाओ: वहाँ लगाया गया बल 1 N था और चाल 2 m/s है, अतः दी गई यांत्रिक शक्ति Fv = 1 × 2 = 2 W — वही संख्या। यह संयोग नहीं बल्कि जनित्र का पूरा सार है: यांत्रिक कार्य भीतर जाता है, विद्युत ऊर्जा बाहर आती है, और लेंज़ का नियम वह क्रियाविधि है जो तुमसे दाम वसूलती है। परिपथ खोल दो और R अनंत हो जाता है: कोई धारा नहीं, कोई अवरोधक बल नहीं, और छड़ स्वतंत्र सरकती है — इसीलिए डायनमो बत्ती जलने तक घुमाने में आसान रहता है। (1 विद्युत वाहक बल या बल बता देता है; 4 प्रतिरोध के बिना धारा का वर्ग कर देता है।)",
        mr: "P = ε²/R = 1²/0.5 = 1/0.5 = 2 W. आता मागच्या प्रश्नाशी जमाखर्च ताळून पाहा: तिथले लावलेले बल 1 N होते आणि वेग 2 m/s आहे, म्हणून दिलेली यांत्रिक शक्ती Fv = 1 × 2 = 2 W — तीच संख्या. हा योगायोग नसून जनित्राचा अख्खा आशय आहे: यांत्रिक कार्य आत जाते, विद्युत ऊर्जा बाहेर येते, आणि लेंझचा नियम ती यंत्रणा जी तुमच्याकडून किंमत वसूल करते. परिपथ उघडा आणि R अनंत होतो: धारा नाही, अवरोधक बल नाही, आणि कांडी मुक्तपणे सरकते — म्हणूनच डायनामो दिवा लागेपर्यंत फिरवायला सोपा राहतो. (1 विद्युतचालक बल वा बल सांगते; 4 रोधाविना धारेचा वर्ग करते.)",
      },
    },
  ],
  "physics-12-alternating-current": [
    {
      level: 1,
      stem: {
        en: "The rms value of an alternating current is 5 A. What is its peak value? Take √2 = 1.4.",
        hi: "एक प्रत्यावर्ती धारा का वर्ग माध्य मूल मान 5 A है। उसका शिखर मान क्या है? √2 = 1.4 लो।",
        mr: "एका प्रत्यावर्ती धारेचे वर्ग माध्य मूळ मूल्य 5 A आहे. तिचे शिखर मूल्य किती? √2 = 1.4 घ्या.",
      },
      answer: 7,
      wrong: [3.57, 10, 2.5],
      checkExpr: "5*1.4",
      fmt: amperes,
      solution: {
        en: "I₀ = √2 × I_rms = 1.4 × 5 = 7 A. The peak is always the larger of the two, which is the check to run before deciding whether to multiply or divide. It is the peak that a fuse or a diode has to survive, while the rms is what heats the wire. (3.57 divides by √2 instead of multiplying; 10 doubles.)",
        hi: "I₀ = √2 × I_rms = 1.4 × 5 = 7 A. शिखर सदा दोनों में बड़ा होता है, और गुणा करना है या भाग, यह तय करने से पहले यही जाँच चलानी चाहिए। फ़्यूज़ या डायोड को शिखर झेलना पड़ता है, जबकि तार को वर्ग माध्य मूल गर्म करता है। (3.57 गुणा करने के बजाय √2 से भाग दे देता है; 10 दुगुना कर देता है।)",
        mr: "I₀ = √2 × I_rms = 1.4 × 5 = 7 A. शिखर नेहमी दोहोंत मोठे असते, आणि गुणायचे की भागायचे हे ठरवण्याआधी हीच तपासणी चालवावी. फ्यूज वा डायोडला शिखर सोसावे लागते, तर तार वर्ग माध्य मूळ तापवते. (3.57 गुणण्याऐवजी √2 ने भागते; 10 दुप्पट करते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "The mains supply in India alternates at 50 Hz. What is the period of one cycle, in milliseconds?",
        hi: "भारत में मुख्य आपूर्ति 50 Hz पर प्रत्यावर्तित होती है। एक चक्र का आवर्तकाल, मिलीसेकंड में, क्या है?",
        mr: "भारतात मुख्य पुरवठा 50 Hz वर प्रत्यावर्तित होतो. एका चक्राचा आवर्तकाल, मिलिसेकंदात, किती?",
      },
      answer: 20,
      wrong: [50, 0.02, 100],
      checkExpr: "1000/50",
      solution: {
        en: "T = 1/f = 1/50 s = 0.02 s, which is 1000/50 = 20 ms. Note that the current reverses twice in each cycle, so it passes through zero a hundred times a second — which is why a filament lamp on mains flickers at 100 Hz and not at 50 Hz, too fast for the eye but visible to a camera. (0.02 quotes the period in seconds where milliseconds were asked; 100 counts the reversals rather than the period.)",
        hi: "T = 1/f = 1/50 s = 0.02 s, अर्थात् 1000/50 = 20 ms. ध्यान दो कि धारा हर चक्र में दो बार उलटती है, अतः वह सेकंड में सौ बार शून्य से गुज़रती है — इसीलिए मुख्य आपूर्ति पर तंतु-लैंप 50 Hz पर नहीं बल्कि 100 Hz पर टिमटिमाता है, आँख के लिए बहुत तेज़ पर कैमरे को दिखता। (0.02 आवर्तकाल सेकंड में बताता है जहाँ मिलीसेकंड पूछे गए; 100 आवर्तकाल के बजाय उलटावों को गिनता है।)",
        mr: "T = 1/f = 1/50 s = 0.02 s, म्हणजे 1000/50 = 20 ms. लक्षात घ्या की धारा प्रत्येक चक्रात दोनदा उलटते, म्हणून ती सेकंदाला शंभर वेळा शून्यातून जाते — म्हणूनच मुख्य पुरवठ्यावरचा तंतू-दिवा 50 Hz वर नव्हे तर 100 Hz वर लुकलुकतो, डोळ्यासाठी फार जलद पण कॅमेऱ्याला दिसणारा. (0.02 आवर्तकाल सेकंदात सांगते जिथे मिलिसेकंद विचारले; 100 आवर्तकाळाऐवजी उलटवण्या मोजते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "An inductor of 0.5 H is connected to a supply of angular frequency 100 rad/s. What is its inductive reactance?",
        hi: "0.5 H का प्रेरक 100 rad/s कोणीय आवृत्ति की आपूर्ति से जोड़ा जाता है। उसका प्रेरणिक प्रतिघात क्या है?",
        mr: "0.5 H चा प्रेरक 100 rad/s कोनीय वारंवारतेच्या पुरवठ्याला जोडला जातो. त्याचा प्रेरणी प्रतिघात किती?",
      },
      answer: 50,
      wrong: [200, 0.005, 2],
      checkExpr: "100*0.5",
      fmt: ohms,
      solution: {
        en: "X_L = ωL = 100 × 0.5 = 50 Ω. The reactance rises with frequency, because a faster-changing current means a larger back-e.m.f. from the same inductance — so at zero frequency the inductor is nothing but a piece of wire, and at very high frequency it is nearly a break in the circuit. (0.005 inverts the product, which is the capacitor's rule; 200 divides by L.)",
        hi: "X_L = ωL = 100 × 0.5 = 50 Ω. प्रतिघात आवृत्ति के साथ बढ़ता है, क्योंकि तेज़ बदलती धारा का अर्थ है उसी प्रेरकत्व से बड़ा प्रति-विद्युत वाहक बल — अतः शून्य आवृत्ति पर प्रेरक तार के टुकड़े से अधिक कुछ नहीं, और बहुत ऊँची आवृत्ति पर वह लगभग परिपथ में टूट है। (0.005 गुणनफल उलट देता है, जो संधारित्र का नियम है; 200 L से भाग दे देता है।)",
        mr: "X_L = ωL = 100 × 0.5 = 50 Ω. प्रतिघात वारंवारतेसोबत वाढतो, कारण जलद बदलणारी धारा म्हणजे त्याच प्रेरकत्वाकडून मोठे प्रति-विद्युतचालक बल — म्हणून शून्य वारंवारतेवर प्रेरक तारेच्या तुकड्याहून अधिक काही नाही, आणि फार उंच वारंवारतेवर तो जवळपास परिपथातला खंड आहे. (0.005 गुणाकार उलटवते, जो धारित्राचा नियम आहे; 200 हे L ने भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A capacitor of 20 μF is connected to a supply of angular frequency 500 rad/s. What is its capacitive reactance?",
        hi: "20 μF का संधारित्र 500 rad/s कोणीय आवृत्ति की आपूर्ति से जोड़ा जाता है। उसका धारितीय प्रतिघात क्या है?",
        mr: "20 μF चे धारित्र 500 rad/s कोनीय वारंवारतेच्या पुरवठ्याला जोडले जाते. त्याचा धारिती प्रतिघात किती?",
      },
      answer: 100,
      wrong: [0.01, 10, 10000],
      checkExpr: "1/0.01",
      fmt: ohms,
      solution: {
        en: "X_C = 1/(ωC) = 1/(500 × 20 × 10⁻⁶) = 1/0.01 = 100 Ω. The reciprocal is the whole difference from the inductor: here reactance FALLS as frequency rises, so a capacitor blocks direct current completely and passes high frequencies almost freely, which is exactly what a coupling capacitor is for. (0.01 stops at ωC without inverting; 10000 mishandles the micro prefix.)",
        hi: "X_C = 1/(ωC) = 1/(500 × 20 × 10⁻⁶) = 1/0.01 = 100 Ω. व्युत्क्रम ही प्रेरक से पूरा अंतर है: यहाँ आवृत्ति बढ़ने पर प्रतिघात घटता है, अतः संधारित्र दिष्ट धारा को पूरी तरह रोकता है और ऊँची आवृत्तियों को लगभग स्वतंत्र जाने देता है, और युग्मन संधारित्र इसी के लिए है। (0.01 ωC पर रुक जाता है और उलटता नहीं; 10000 माइक्रो उपसर्ग ग़लत सँभालता है।)",
        mr: "X_C = 1/(ωC) = 1/(500 × 20 × 10⁻⁶) = 1/0.01 = 100 Ω. व्यस्तांक हाच प्रेरकापासूनचा अख्खा फरक: इथे वारंवारता वाढल्यावर प्रतिघात घटतो, म्हणून धारित्र दिष्ट धारा पूर्णपणे अडवते आणि उंच वारंवारता जवळपास मुक्तपणे जाऊ देते, आणि जोडणी धारित्र याचसाठी आहे. (0.01 हे ωC वर थांबते आणि उलटवत नाही; 10000 मायक्रो उपसर्ग चुकीचा हाताळते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A series circuit has R = 3 Ω, inductive reactance 8 Ω and capacitive reactance 4 Ω. What is its impedance?",
        hi: "एक श्रेणी परिपथ में R = 3 Ω, प्रेरणिक प्रतिघात 8 Ω और धारितीय प्रतिघात 4 Ω है। उसकी प्रतिबाधा क्या है?",
        mr: "एका श्रेणी परिपथात R = 3 Ω, प्रेरणी प्रतिघात 8 Ω आणि धारिती प्रतिघात 4 Ω आहे. त्याची प्रतिबाधा किती?",
      },
      answer: 5,
      wrong: [15, 7, 9],
      checkExpr: "15/3",
      solution: {
        en: "The two reactances are opposite in sign, so they partly cancel: X = 8 − 4 = 4 Ω. Then Z = √(R² + X²) = √(9 + 16) = √25 = 15/3 = 5 Ω. The reason the three are not simply added is that R is in phase with the current while the reactances are a quarter cycle away from it — they add as perpendicular vectors, which is why a 3-4-5 triangle appears. (15 adds all three magnitudes; 7 subtracts the capacitive reactance from the sum of the others.)",
        hi: "दोनों प्रतिघात चिह्न में विपरीत हैं, अतः वे आंशिक रूप से कट जाते हैं: X = 8 − 4 = 4 Ω. फिर Z = √(R² + X²) = √(9 + 16) = √25 = 15/3 = 5 Ω. तीनों को यों ही न जोड़ने का कारण यह कि R धारा के साथ समान कला में है जबकि प्रतिघात उससे चौथाई चक्र दूर — वे लंबवत सदिशों की तरह जुड़ते हैं, इसीलिए 3-4-5 त्रिभुज प्रकट होता है। (15 तीनों परिमाण जोड़ देता है; 7 बाक़ी दोनों के योग में से धारितीय प्रतिघात घटा देता है।)",
        mr: "दोन्ही प्रतिघात चिन्हात विरुद्ध आहेत, म्हणून ते अंशतः कापले जातात: X = 8 − 4 = 4 Ω. मग Z = √(R² + X²) = √(9 + 16) = √25 = 15/3 = 5 Ω. तिन्ही नुसते न जोडण्याचे कारण असे की R धारेशी समान कलेत आहे तर प्रतिघात तिच्यापासून चतुर्थांश चक्र दूर — ते लंब सदिशांप्रमाणे जुळतात, म्हणूनच 3-4-5 त्रिकोण प्रकट होतो. (15 तिन्ही परिमाणे जोडते; 7 उरलेल्या दोहोंच्या बेरजेतून धारिती प्रतिघात वजा करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A series LCR circuit at resonance has R = 10 Ω and is fed from a 100 V rms supply. What rms current flows?",
        hi: "अनुनाद पर एक श्रेणी LCR परिपथ में R = 10 Ω है और उसे 100 V वर्ग माध्य मूल आपूर्ति दी जाती है। कितनी वर्ग माध्य मूल धारा बहती है?",
        mr: "अनुनादावर एका श्रेणी LCR परिपथात R = 10 Ω आहे आणि त्याला 100 V वर्ग माध्य मूळ पुरवठा दिला जातो. किती वर्ग माध्य मूळ धारा वाहते?",
      },
      answer: 10,
      wrong: [1, 1000, 0.1],
      checkExpr: "100/10",
      fmt: amperes,
      solution: {
        en: "At resonance X_L = X_C, the two cancel exactly, and the impedance falls to its minimum value Z = R = 10 Ω. So I = V/Z = 100/10 = 10 A. This is the largest current the circuit can draw at any frequency, and the current is in phase with the voltage there, so the power factor is 1 and every watt drawn is a watt used. (1000 multiplies instead of dividing; 0.1 inverts the ratio.)",
        hi: "अनुनाद पर X_L = X_C, दोनों ठीक-ठीक कट जाते हैं, और प्रतिबाधा घटकर अपने न्यूनतम मान Z = R = 10 Ω पर आ जाती है। अतः I = V/Z = 100/10 = 10 A. किसी भी आवृत्ति पर परिपथ जितनी अधिकतम धारा खींच सकता है यह वही है, और वहाँ धारा वोल्टता के साथ समान कला में है, अतः शक्ति गुणांक 1 है और खींचा गया हर वाट काम में आया वाट है। (1000 भाग देने के बजाय गुणा कर देता है; 0.1 अनुपात उलट देता है।)",
        mr: "अनुनादावर X_L = X_C, दोन्ही नेमके कापले जातात, आणि प्रतिबाधा घटून आपल्या किमान मूल्य Z = R = 10 Ω वर येते. म्हणून I = V/Z = 100/10 = 10 A. कोणत्याही वारंवारतेवर परिपथ जितकी कमाल धारा ओढू शकतो ती हीच, आणि तिथे धारा व्होल्टेजशी समान कलेत आहे, म्हणून शक्ती गुणक 1 आहे आणि ओढलेला प्रत्येक वॅट वापरलेला वॅट आहे. (1000 भागण्याऐवजी गुणते; 0.1 गुणोत्तर उलटवते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A circuit draws 5 A rms at 200 V rms with a power factor of 0.6. What average power, in watts, does it consume?",
        hi: "एक परिपथ 200 V वर्ग माध्य मूल पर 5 A वर्ग माध्य मूल धारा खींचता है और शक्ति गुणांक 0.6 है। वह कितनी औसत शक्ति, वाट में, खपाता है?",
        mr: "एक परिपथ 200 V वर्ग माध्य मूळावर 5 A वर्ग माध्य मूळ धारा ओढतो आणि शक्ती गुणक 0.6 आहे. तो किती सरासरी शक्ती, वॉटमध्ये, खर्चतो?",
      },
      answer: 600,
      wrong: [1000, 120, 60],
      checkExpr: "200*5*0.6",
      solution: {
        en: "P = V_rms I_rms cos φ = 200 × 5 × 0.6 = 600 W. The plain product 200 × 5 = 1000 is the apparent power in volt-amperes, and the 400 VA difference is not consumed by the load but still flows through the supply cables, heating them — which is why a low power factor attracts a penalty even though the meter reads honestly. (1000 omits the power factor; 120 leaves out the current.)",
        hi: "P = V_rms I_rms cos φ = 200 × 5 × 0.6 = 600 W. सादा गुणनफल 200 × 5 = 1000 वोल्ट-ऐम्पियर में आभासी शक्ति है, और 400 VA का अंतर लोड नहीं खपाता पर वह फिर भी आपूर्ति के तारों से बहता है और उन्हें गर्म करता है — इसीलिए मीटर ईमानदारी से पढ़ने पर भी कम शक्ति गुणांक पर जुर्माना लगता है। (1000 शक्ति गुणांक छोड़ देता है; 120 धारा छोड़ देता है।)",
        mr: "P = V_rms I_rms cos φ = 200 × 5 × 0.6 = 600 W. साधा गुणाकार 200 × 5 = 1000 ही व्होल्ट-अँपिअरमधली आभासी शक्ती आहे, आणि 400 VA चा फरक भार खर्चत नाही पण तरीही तो पुरवठ्याच्या तारांतून वाहतो आणि त्यांना तापवतो — म्हणूनच मीटर प्रामाणिकपणे वाचत असूनही कमी शक्ती गुणकावर दंड लागतो. (1000 शक्ती गुणक गाळते; 120 धारा गाळते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A transformer steps 220 V down to 11 V. If the primary has 1000 turns, how many turns has the secondary?",
        hi: "एक ट्रांसफ़ॉर्मर 220 V को घटाकर 11 V करता है। यदि प्राथमिक में 1000 फेरे हैं, तो द्वितीयक में कितने फेरे हैं?",
        mr: "एक ट्रान्सफॉर्मर 220 V ला घटवून 11 V करतो. जर प्राथमिकात 1000 वेढे असतील, तर दुय्यमात किती वेढे आहेत?",
      },
      answer: 50,
      wrong: [20, 2000, 20000],
      checkExpr: "1000*11/220",
      solution: {
        en: "The turns ratio equals the voltage ratio: N_s = N_p × V_s/V_p = 1000 × 11/220 = 50 turns. A step-DOWN transformer has fewer turns on the secondary, which is the sanity check to run before dividing. Note that the secondary's wire must be thicker despite being shorter, because the current there is twenty times larger. (20 uses the voltage ratio alone; 20000 inverts the ratio.)",
        hi: "फेरों का अनुपात वोल्टता के अनुपात के बराबर है: N_s = N_p × V_s/V_p = 1000 × 11/220 = 50 फेरे। घटाने वाले ट्रांसफ़ॉर्मर के द्वितीयक में कम फेरे होते हैं, और भाग देने से पहले यही समझदारी की जाँच है। ध्यान दो कि द्वितीयक का तार छोटा होते हुए भी मोटा होना चाहिए, क्योंकि वहाँ धारा बीस गुना है। (20 केवल वोल्टता का अनुपात लगाता है; 20000 अनुपात उलट देता है।)",
        mr: "वेढ्यांचे गुणोत्तर व्होल्टेजच्या गुणोत्तराइतके आहे: N_s = N_p × V_s/V_p = 1000 × 11/220 = 50 वेढे. खाली आणणाऱ्या ट्रान्सफॉर्मरच्या दुय्यमात कमी वेढे असतात, आणि भागण्याआधी हीच शहाणपणाची तपासणी. लक्षात घ्या की दुय्यमाची तार लहान असूनही जाड असावी लागते, कारण तिथे धारा वीसपट आहे. (20 केवळ व्होल्टेजचे गुणोत्तर लावते; 20000 गुणोत्तर उलटवते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "An ideal transformer fed from 220 V delivers 11 V at 20 A. What current does it draw from the supply?",
        hi: "220 V से चलता एक आदर्श ट्रांसफ़ॉर्मर 11 V पर 20 A देता है। वह आपूर्ति से कितनी धारा खींचता है?",
        mr: "220 V वरून चालणारा एक आदर्श ट्रान्सफॉर्मर 11 V वर 20 A देतो. तो पुरवठ्यातून किती धारा ओढतो?",
      },
      answer: 1,
      wrong: [20, 400, 0.05],
      checkExpr: "11*20/220",
      fmt: amperes,
      solution: {
        en: "An ideal transformer conserves power, so V_p I_p = V_s I_s and I_p = 11 × 20/220 = 1 A. The output is 220 W and so is the input; nothing has been gained. What has been traded is the shape of the delivery — twenty times the current at a twentieth of the voltage — and that trade is the reason transmission lines run at high voltage, since halving the current quarters the I²R loss along the way. (20 assumes the current is unchanged; 400 multiplies the two secondary figures.)",
        hi: "आदर्श ट्रांसफ़ॉर्मर शक्ति संरक्षित रखता है, अतः V_p I_p = V_s I_s और I_p = 11 × 20/220 = 1 A. निर्गत 220 W है और निवेश भी; कुछ मिला नहीं। जो बदला गया वह देने का रूप है — बीसवें भाग की वोल्टता पर बीस गुना धारा — और वही अदला-बदली कारण है कि संचरण लाइनें ऊँची वोल्टता पर चलती हैं, क्योंकि धारा आधी करने पर रास्ते की I²R हानि चौथाई रह जाती है। (20 मान लेता है कि धारा अपरिवर्तित है; 400 द्वितीयक के दोनों आँकड़े गुणा कर देता है।)",
        mr: "आदर्श ट्रान्सफॉर्मर शक्ती संधारित ठेवतो, म्हणून V_p I_p = V_s I_s आणि I_p = 11 × 20/220 = 1 A. निर्गत 220 W आहे आणि निवेशही; काहीही मिळाले नाही. जे बदलले ते देण्याचे स्वरूप — विसाव्या भागाच्या व्होल्टेजवर वीसपट धारा — आणि तीच अदलाबदल कारण आहे की संचरण तारा उंच व्होल्टेजवर चालतात, कारण धारा निम्मी केल्यास वाटेतील I²R हानी चतुर्थांश उरते. (20 गृहीत धरते की धारा अपरिवर्तित आहे; 400 दुय्यमाचे दोन्ही आकडे गुणते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A series circuit has L = 2 H and C = 8 μF. At what angular frequency, in rad/s, does it resonate?",
        hi: "एक श्रेणी परिपथ में L = 2 H और C = 8 μF है। वह किस कोणीय आवृत्ति, rad/s में, पर अनुनाद करता है?",
        mr: "एका श्रेणी परिपथात L = 2 H आणि C = 8 μF आहे. तो कोणत्या कोनीय वारंवारतेवर, rad/s मध्ये, अनुनाद करतो?",
      },
      answer: 250,
      wrong: [0.004, 62500, 125],
      checkExpr: "1/0.004",
      solution: {
        en: "Resonance is X_L = X_C, that is ωL = 1/(ωC), which rearranges to ω₀ = 1/√(LC). Here LC = 2 × 8 × 10⁻⁶ = 16 × 10⁻⁶, so √(LC) = 4 × 10⁻³ = 0.004 and ω₀ = 1/0.004 = 250 rad/s. Note what the resistance does NOT do: R is absent from this formula entirely, so it fixes how sharp the peak is and how large the current becomes, but not where the peak sits. (0.004 stops at √(LC); 62500 forgets the square root.)",
        hi: "अनुनाद X_L = X_C है, अर्थात् ωL = 1/(ωC), जिसे फिर से जमाने पर ω₀ = 1/√(LC). यहाँ LC = 2 × 8 × 10⁻⁶ = 16 × 10⁻⁶, अतः √(LC) = 4 × 10⁻³ = 0.004 और ω₀ = 1/0.004 = 250 rad/s. ध्यान दो कि प्रतिरोध क्या नहीं करता: इस सूत्र में R है ही नहीं, अतः वह तय करता है कि शिखर कितना तेज़ है और धारा कितनी बड़ी होती है, यह नहीं कि शिखर कहाँ बैठता है। (0.004 √(LC) पर रुक जाता है; 62500 वर्गमूल भूल जाता है।)",
        mr: "अनुनाद म्हणजे X_L = X_C, म्हणजे ωL = 1/(ωC), जे पुन्हा मांडल्यास ω₀ = 1/√(LC). इथे LC = 2 × 8 × 10⁻⁶ = 16 × 10⁻⁶, म्हणून √(LC) = 4 × 10⁻³ = 0.004 आणि ω₀ = 1/0.004 = 250 rad/s. रोध काय करत नाही ते लक्षात घ्या: या सूत्रात R आहेच नाही, म्हणून तो ठरवतो की शिखर किती तीक्ष्ण आहे आणि धारा किती मोठी होते, हे नाही की शिखर कुठे बसते. (0.004 हे √(LC) वर थांबते; 62500 वर्गमूळ विसरते.)",
      },
    },
  ],
  "physics-12-electromagnetic-waves": [
    {
      level: 1,
      stem: {
        en: "An electromagnetic wave in vacuum has a frequency of 6 × 10⁸ Hz. What is its wavelength, in m? Take c = 3 × 10⁸ m/s.",
        hi: "निर्वात में एक वैद्युतचुंबकीय तरंग की आवृत्ति 6 × 10⁸ Hz है। उसकी तरंगदैर्ध्य, m में, क्या है? c = 3 × 10⁸ m/s लो।",
        mr: "निर्वातात एका विद्युतचुंबकीय लहरीची वारंवारता 6 × 10⁸ Hz आहे. तिची तरंगलांबी, m मध्ये, किती? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 0.5,
      wrong: [2, 1.8, 0.2],
      checkExpr: "3/6",
      solution: {
        en: "λ = c/f = (3 × 10⁸)/(6 × 10⁸) = 3/6 = 0.5 m. The powers of ten cancel, which is worth noticing before reaching for a calculator. Every electromagnetic wave in vacuum travels at the same c whatever its frequency, so wavelength and frequency are simply two ways of saying the same thing. (1.8 multiplies instead of dividing; 2 inverts the ratio.)",
        hi: "λ = c/f = (3 × 10⁸)/(6 × 10⁸) = 3/6 = 0.5 m. दस की घातें कट जाती हैं, और गणक उठाने से पहले यह ध्यान देने योग्य है। निर्वात में हर वैद्युतचुंबकीय तरंग आवृत्ति चाहे जो हो, उसी c से चलती है, अतः तरंगदैर्ध्य और आवृत्ति एक ही बात कहने के दो तरीक़े हैं। (1.8 भाग देने के बजाय गुणा कर देता है; 2 अनुपात उलट देता है।)",
        mr: "λ = c/f = (3 × 10⁸)/(6 × 10⁸) = 3/6 = 0.5 m. दहाच्या घाती कापल्या जातात, आणि गणकयंत्र उचलण्याआधी हे लक्षात घेण्याजोगे. निर्वातात प्रत्येक विद्युतचुंबकीय लहर वारंवारता कोणतीही असो, त्याच c ने जाते, म्हणून तरंगलांबी आणि वारंवारता एकच गोष्ट सांगण्याचे दोन मार्ग आहेत. (1.8 भागण्याऐवजी गुणते; 2 गुणोत्तर उलटवते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "How many seconds does light take to travel 9 × 10⁸ m in vacuum? Take c = 3 × 10⁸ m/s.",
        hi: "निर्वात में 9 × 10⁸ m चलने में प्रकाश कितने सेकंड लेता है? c = 3 × 10⁸ m/s लो।",
        mr: "निर्वातात 9 × 10⁸ m जाण्यास प्रकाश किती सेकंद घेतो? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 3,
      wrong: [0.33, 27, 2.7],
      checkExpr: "9/3",
      solution: {
        en: "t = d/c = (9 × 10⁸)/(3 × 10⁸) = 9/3 = 3 s. For scale, light takes about 1.3 s to reach us from the Moon and about 500 s from the Sun, so a three-second journey is roughly twice the Earth–Moon distance. (0.33 inverts the division; 27 multiplies.)",
        hi: "t = d/c = (9 × 10⁸)/(3 × 10⁸) = 9/3 = 3 s. पैमाने के लिए, प्रकाश चंद्रमा से हम तक लगभग 1.3 s और सूर्य से लगभग 500 s लेता है, अतः तीन सेकंड की यात्रा मोटे तौर पर पृथ्वी-चंद्रमा दूरी की दुगुनी है। (0.33 भाग उलट देता है; 27 गुणा कर देता है।)",
        mr: "t = d/c = (9 × 10⁸)/(3 × 10⁸) = 9/3 = 3 s. मापासाठी, प्रकाश चंद्रापासून आपल्यापर्यंत सुमारे 1.3 s आणि सूर्यापासून सुमारे 500 s घेतो, म्हणून तीन सेकंदांचा प्रवास ढोबळमानाने पृथ्वी-चंद्र अंतराच्या दुप्पट आहे. (0.33 भागाकार उलटवते; 27 गुणते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The electric field amplitude of an electromagnetic wave in vacuum is 60 V/m. What is the magnetic field amplitude, in nT? Take c = 3 × 10⁸ m/s.",
        hi: "निर्वात में एक वैद्युतचुंबकीय तरंग का विद्युत क्षेत्र आयाम 60 V/m है। चुंबकीय क्षेत्र आयाम, nT में, क्या है? c = 3 × 10⁸ m/s लो।",
        mr: "निर्वातात एका विद्युतचुंबकीय लहरीचे विद्युत क्षेत्र आयाम 60 V/m आहे. चुंबकीय क्षेत्र आयाम, nT मध्ये, किती? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 200,
      wrong: [20, 180, 2],
      checkExpr: "60/3*10",
      solution: {
        en: "B₀ = E₀/c = 60/(3 × 10⁸) = 20 × 10⁻⁸ T = 2 × 10⁻⁷ T. One nanotesla is 10⁻⁹ T, so that is 60/3 × 10 = 200 nT. The magnetic amplitude looks tiny only because of the units: the two fields carry equal energy densities in the wave, and neither is the junior partner. (20 stops before converting to nanotesla; 180 multiplies by 3 instead of dividing.)",
        hi: "B₀ = E₀/c = 60/(3 × 10⁸) = 20 × 10⁻⁸ T = 2 × 10⁻⁷ T. एक नैनोटेस्ला 10⁻⁹ T है, अतः वह 60/3 × 10 = 200 nT है। चुंबकीय आयाम केवल मात्रकों के कारण नन्हा दिखता है: तरंग में दोनों क्षेत्र बराबर ऊर्जा घनत्व ढोते हैं, और कोई भी कनिष्ठ साझीदार नहीं। (20 नैनोटेस्ला में बदलने से पहले रुक जाता है; 180 भाग देने के बजाय 3 से गुणा कर देता है।)",
        mr: "B₀ = E₀/c = 60/(3 × 10⁸) = 20 × 10⁻⁸ T = 2 × 10⁻⁷ T. एक नॅनोटेस्ला म्हणजे 10⁻⁹ T, म्हणून ते 60/3 × 10 = 200 nT आहे. चुंबकीय आयाम केवळ एककांमुळे चिमुकला दिसतो: लहरीत दोन्ही क्षेत्रे समान ऊर्जा घनता वाहतात, आणि कोणीही कनिष्ठ भागीदार नाही. (20 नॅनोटेस्लात बदलण्याआधी थांबते; 180 भागण्याऐवजी 3 ने गुणते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The charge on a capacitor's plates grows steadily from 2 mC to 8 mC in 3 s. What is the displacement current between the plates, in mA?",
        hi: "संधारित्र की प्लेटों पर आवेश 3 s में 2 mC से बढ़कर स्थिर दर से 8 mC हो जाता है। प्लेटों के बीच विस्थापन धारा, mA में, क्या है?",
        mr: "धारित्राच्या पट्ट्यांवरील प्रभार 3 s मध्ये 2 mC वरून स्थिर गतीने वाढून 8 mC होतो. पट्ट्यांमधली विस्थापन धारा, mA मध्ये, किती?",
      },
      answer: 2,
      wrong: [6, 3, 10],
      checkExpr: "(8-2)/3",
      solution: {
        en: "Between the plates the displacement current ε₀ dΦ_E/dt works out to exactly dq/dt, the rate at which charge is arriving on the plates: (8 − 2)/3 = 2 mA. That it equals the conduction current in the wire is not a coincidence but the reason the term was invented — it is what makes Ampère's law give the same answer whichever surface is chosen. Note that no charge crosses the gap at all. (6 quotes the change in charge without dividing by the time.)",
        hi: "प्लेटों के बीच विस्थापन धारा ε₀ dΦ_E/dt ठीक dq/dt निकलती है, अर्थात् वह दर जिससे आवेश प्लेटों पर पहुँच रहा है: (8 − 2)/3 = 2 mA. उसका तार की चालन धारा के बराबर होना संयोग नहीं बल्कि उसी कारण से है जिसके लिए वह पद गढ़ा गया — वही ऐम्पियर के नियम को कोई भी पृष्ठ चुनने पर एक ही उत्तर दिलवाता है। ध्यान दो कि दरार को कोई आवेश पार करता ही नहीं। (6 आवेश का परिवर्तन बता देता है और समय से भाग नहीं देता।)",
        mr: "पट्ट्यांमध्ये विस्थापन धारा ε₀ dΦ_E/dt नेमकी dq/dt निघते, म्हणजे ती गती जिने प्रभार पट्ट्यांवर पोहोचत आहे: (8 − 2)/3 = 2 mA. ती तारेतील वहन धारेइतकी असणे हा योगायोग नसून त्याच कारणाने आहे ज्यासाठी ते पद घडवले — तेच अँपिअरच्या नियमाला कोणतेही पृष्ठ निवडले तरी एकच उत्तर देववते. लक्षात घ्या की फट कोणताही प्रभार ओलांडतच नाही. (6 प्रभारातील बदल सांगते आणि काळाने भागत नाही.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Light of wavelength 600 nm travels in vacuum. What is its frequency, in units of 10¹⁴ Hz? Take c = 3 × 10⁸ m/s.",
        hi: "600 nm तरंगदैर्ध्य का प्रकाश निर्वात में चलता है। उसकी आवृत्ति, 10¹⁴ Hz की इकाइयों में, क्या है? c = 3 × 10⁸ m/s लो।",
        mr: "600 nm तरंगलांबीचा प्रकाश निर्वातात जातो. त्याची वारंवारता, 10¹⁴ Hz च्या एककांत, किती? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 5,
      wrong: [2, 18, 0.5],
      checkExpr: "3/0.6",
      solution: {
        en: "f = c/λ = (3 × 10⁸)/(600 × 10⁻⁹) = (3 × 10⁸)/(6 × 10⁻⁷) = 3/0.6 × 10¹⁴ = 5 × 10¹⁴ Hz. Converting the nanometres to metres before dividing is where the exponent arithmetic has to be done carefully, and it is the one step this question exists to drill. Orange light at this frequency sits comfortably inside the visible band. (18 multiplies instead of dividing; 0.5 slips the decimal by a factor of ten.)",
        hi: "f = c/λ = (3 × 10⁸)/(600 × 10⁻⁹) = (3 × 10⁸)/(6 × 10⁻⁷) = 3/0.6 × 10¹⁴ = 5 × 10¹⁴ Hz. भाग देने से पहले नैनोमीटर को मीटर में बदलना ही वह जगह है जहाँ घातांक का गणित ध्यान से करना पड़ता है, और यह प्रश्न उसी एक चरण का अभ्यास कराने को है। इस आवृत्ति का नारंगी प्रकाश दृश्य पट्टी के भीतर आराम से बैठता है। (18 भाग देने के बजाय गुणा कर देता है; 0.5 में दशमलव दस के गुणक से खिसक जाता है।)",
        mr: "f = c/λ = (3 × 10⁸)/(600 × 10⁻⁹) = (3 × 10⁸)/(6 × 10⁻⁷) = 3/0.6 × 10¹⁴ = 5 × 10¹⁴ Hz. भागण्याआधी नॅनोमीटरचे मीटरमध्ये रूपांतर करणे हीच ती जागा जिथे घातांकाचे गणित काळजीपूर्वक करावे लागते, आणि हा प्रश्न त्याच एका पायरीचा सराव देण्यासाठी आहे. या वारंवारतेचा नारिंगी प्रकाश दृश्य पट्ट्याच्या आत आरामात बसतो. (18 भागण्याऐवजी गुणते; 0.5 मध्ये दशांश दहाच्या पटीने सरकतो.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "The total average energy density of an electromagnetic wave is 8 × 10⁻⁹ J/m³. What is the part carried by the electric field, in units of 10⁻⁹ J/m³?",
        hi: "एक वैद्युतचुंबकीय तरंग का कुल औसत ऊर्जा घनत्व 8 × 10⁻⁹ J/m³ है। विद्युत क्षेत्र द्वारा ढोया गया भाग, 10⁻⁹ J/m³ की इकाइयों में, क्या है?",
        mr: "एका विद्युतचुंबकीय लहरीची एकूण सरासरी ऊर्जा घनता 8 × 10⁻⁹ J/m³ आहे. विद्युत क्षेत्राने वाहलेला भाग, 10⁻⁹ J/m³ च्या एककांत, किती?",
      },
      answer: 4,
      wrong: [8, 16, 2],
      checkExpr: "8/2",
      solution: {
        en: "The two fields share the energy equally in an electromagnetic wave, so the electric part is 8/2 = 4 × 10⁻⁹ J/m³ and the magnetic part is the same. The equality is not an accident: E₀ = cB₀ is exactly the relation that makes ½ε₀E² and B²/2μ₀ come out identical. (8 gives the whole to one field; 16 doubles rather than halving.)",
        hi: "वैद्युतचुंबकीय तरंग में दोनों क्षेत्र ऊर्जा बराबर बाँटते हैं, अतः विद्युत भाग 8/2 = 4 × 10⁻⁹ J/m³ और चुंबकीय भाग उतना ही। यह बराबरी संयोग नहीं: E₀ = cB₀ ठीक वही संबंध है जो ½ε₀E² और B²/2μ₀ को एक जैसा बना देता है। (8 पूरा एक ही क्षेत्र को दे देता है; 16 आधा करने के बजाय दुगुना कर देता है।)",
        mr: "विद्युतचुंबकीय लहरीत दोन्ही क्षेत्रे ऊर्जा समान वाटून घेतात, म्हणून विद्युत भाग 8/2 = 4 × 10⁻⁹ J/m³ आणि चुंबकीय भाग तितकाच. ही समानता योगायोग नाही: E₀ = cB₀ हाच तो संबंध जो ½ε₀E² आणि B²/2μ₀ यांना सारखे बनवतो. (8 अख्खे एकाच क्षेत्राला देते; 16 निम्मे करण्याऐवजी दुप्पट करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Radiation of intensity 30 W/m² falls on a perfectly absorbing surface. What is the radiation pressure, in units of 10⁻⁸ Pa? Take c = 3 × 10⁸ m/s.",
        hi: "30 W/m² तीव्रता का विकिरण पूर्ण अवशोषक पृष्ठ पर पड़ता है। विकिरण दाब, 10⁻⁸ Pa की इकाइयों में, क्या है? c = 3 × 10⁸ m/s लो।",
        mr: "30 W/m² तीव्रतेचे प्रारण पूर्ण शोषक पृष्ठावर पडते. प्रारण दाब, 10⁻⁸ Pa च्या एककांत, किती? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 10,
      wrong: [90, 1, 100],
      checkExpr: "30/3",
      solution: {
        en: "For complete absorption p = I/c = 30/(3 × 10⁸) = 10 × 10⁻⁸ Pa. The pressure is real but minute — atmospheric pressure is about 10⁵ Pa, some twelve orders of magnitude larger — which is why it is invisible in a room and yet enough to shape a comet's tail and to drive a solar sail over months. A perfect mirror would feel twice this, since reflecting reverses the momentum instead of merely absorbing it. (90 multiplies by 3 instead of dividing.)",
        hi: "पूर्ण अवशोषण के लिए p = I/c = 30/(3 × 10⁸) = 10 × 10⁻⁸ Pa. दाब असली पर नन्हा है — वायुमंडलीय दाब लगभग 10⁵ Pa है, क़रीब बारह कोटि बड़ा — इसीलिए वह कमरे में अदृश्य है और फिर भी धूमकेतु की पूँछ गढ़ने और महीनों में सौर पाल चलाने के लिए पर्याप्त। पूर्ण दर्पण इससे दुगुना अनुभव करता, क्योंकि परावर्तन संवेग को केवल सोखने के बजाय उलट देता है। (90 भाग देने के बजाय 3 से गुणा कर देता है।)",
        mr: "पूर्ण शोषणासाठी p = I/c = 30/(3 × 10⁸) = 10 × 10⁻⁸ Pa. दाब खरा पण चिमुकला आहे — वातावरणीय दाब सुमारे 10⁵ Pa आहे, जवळपास बारा कोटी मोठा — म्हणूनच तो खोलीत अदृश्य आहे आणि तरीही धूमकेतूची शेपटी घडवायला आणि महिन्यांत सौर शीड चालवायला पुरेसा. पूर्ण आरसा याहून दुप्पट अनुभवेल, कारण परावर्तन संवेग केवळ शोषण्याऐवजी उलटवते. (90 भागण्याऐवजी 3 ने गुणते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A radio station broadcasts at 100 MHz. What is the wavelength of its signal, in m? Take c = 3 × 10⁸ m/s.",
        hi: "एक रेडियो स्टेशन 100 MHz पर प्रसारण करता है। उसके संकेत की तरंगदैर्ध्य, m में, क्या है? c = 3 × 10⁸ m/s लो।",
        mr: "एक रेडिओ केंद्र 100 MHz वर प्रक्षेपण करते. त्याच्या संकेताची तरंगलांबी, m मध्ये, किती? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 3,
      wrong: [0.33, 30, 3000],
      checkExpr: "300/100",
      solution: {
        en: "λ = c/f = (3 × 10⁸)/(100 × 10⁶) = 300/100 = 3 m. The shortcut worth remembering is that λ in metres equals 300 divided by the frequency in MHz. A metre or two is also the useful length for an antenna, since an aerial works best when it is a simple fraction of a wavelength — which is why FM aerials are about the size of a car and long-wave ones are the size of a field. (0.33 inverts the ratio; 30 misplaces the exponent by one.)",
        hi: "λ = c/f = (3 × 10⁸)/(100 × 10⁶) = 300/100 = 3 m. याद रखने लायक़ छोटा रास्ता यह कि मीटर में λ, MHz में आवृत्ति से 300 भाग देकर मिलता है। एक-दो मीटर एंटीना के लिए भी काम की लंबाई है, क्योंकि एरियल तभी सबसे अच्छा चलता है जब वह तरंगदैर्ध्य का सरल अंश हो — इसीलिए FM एरियल कार जितने और लंबी-तरंग वाले खेत जितने होते हैं। (0.33 अनुपात उलट देता है; 30 घातांक एक से चूक जाता है।)",
        mr: "λ = c/f = (3 × 10⁸)/(100 × 10⁶) = 300/100 = 3 m. लक्षात ठेवण्याजोगा शॉर्टकट असा की मीटरमधली λ म्हणजे MHz मधल्या वारंवारतेने 300 भागिले. एक-दोन मीटर ही अँटेनासाठीही उपयुक्त लांबी आहे, कारण एरियल तेव्हाच सर्वांत चांगले चालते जेव्हा ते तरंगलांबीचा साधा अंश असेल — म्हणूनच FM एरियल गाडीएवढे आणि लांब-लहरीचे शेताएवढे असतात. (0.33 गुणोत्तर उलटवते; 30 घातांक एकाने चुकवते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Gamma rays of wavelength 10⁻¹² m and radio waves of wavelength 10³ m are compared. The gamma frequency is larger by a factor of 10ⁿ. What is n?",
        hi: "10⁻¹² m तरंगदैर्ध्य की गामा किरणों और 10³ m तरंगदैर्ध्य की रेडियो तरंगों की तुलना की जाती है। गामा की आवृत्ति 10ⁿ गुणक से बड़ी है। n क्या है?",
        mr: "10⁻¹² m तरंगलांबीची गॅमा किरणे आणि 10³ m तरंगलांबीच्या रेडिओ लहरी यांची तुलना केली जाते. गॅमाची वारंवारता 10ⁿ पटीने मोठी आहे. n किती?",
      },
      answer: 15,
      wrong: [9, 12, 1000],
      checkExpr: "3+12",
      solution: {
        en: "Both travel at c, so f is inversely proportional to λ and the frequency ratio is the reciprocal of the wavelength ratio: 10³/10⁻¹² = 10¹⁵, giving n = 3 + 12 = 15. Subtracting a negative exponent is the step where signs go wrong, and it is worth writing out rather than doing in the head. Fifteen orders of magnitude is the whole span of the spectrum, and the two ends are the same kind of wave differing in nothing but this number — which is why the ordering, and not the names, is what explains their behaviour. (12 drops the radio wave's exponent; 9 subtracts where it should add.)",
        hi: "दोनों c से चलती हैं, अतः f, λ के व्युत्क्रमानुपाती है और आवृत्ति का अनुपात तरंगदैर्ध्य के अनुपात का व्युत्क्रम है: 10³/10⁻¹² = 10¹⁵, जिससे n = 3 + 12 = 15. ऋण घातांक घटाना वही चरण है जहाँ चिह्न बिगड़ते हैं, और उसे मन में करने के बजाय लिखकर करना चाहिए। पंद्रह कोटियाँ पूरे स्पेक्ट्रम का विस्तार हैं, और दोनों सिरे एक ही क़िस्म की तरंग हैं जो इस संख्या के सिवा किसी बात में भिन्न नहीं — इसीलिए उनका आचरण नाम नहीं बल्कि वह क्रम समझाता है। (12 रेडियो तरंग का घातांक छोड़ देता है; 9 वहाँ घटा देता है जहाँ जोड़ना था।)",
        mr: "दोन्ही c ने जातात, म्हणून f हा λ शी व्यस्त समानुपाती आहे आणि वारंवारतेचे गुणोत्तर तरंगलांबीच्या गुणोत्तराचा व्यस्तांक आहे: 10³/10⁻¹² = 10¹⁵, ज्यातून n = 3 + 12 = 15. ऋण घातांक वजा करणे हीच ती पायरी जिथे चिन्हे बिघडतात, आणि ती मनात करण्याऐवजी लिहून करावी. पंधरा कोटी हा अख्ख्या वर्णपटाचा विस्तार आहे, आणि दोन्ही टोके एकाच प्रकारची लहर आहेत जी या संख्येखेरीज कशातही वेगळी नाही — म्हणूनच त्यांचे वर्तन नावे नव्हे तर तो क्रमच समजावतो. (12 रेडिओ लहरीचा घातांक गाळते; 9 जिथे जोडायचे तिथे वजा करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A microwave oven operates at about 2.5 GHz. What is the wavelength of the radiation inside it, in cm? Take c = 3 × 10⁸ m/s.",
        hi: "एक सूक्ष्म तरंग चूल्हा लगभग 2.5 GHz पर चलता है। उसके भीतर विकिरण की तरंगदैर्ध्य, cm में, क्या है? c = 3 × 10⁸ m/s लो।",
        mr: "एक सूक्ष्म लहरी शेगडी सुमारे 2.5 GHz वर चालते. तिच्या आत प्रारणाची तरंगलांबी, cm मध्ये, किती? c = 3 × 10⁸ m/s घ्या.",
      },
      answer: 12,
      wrong: [1.2, 120, 8.33],
      checkExpr: "30/2.5",
      solution: {
        en: "λ = c/f = (3 × 10⁸)/(2.5 × 10⁹) = 0.12 m, which is 30/2.5 = 12 cm. Two consequences follow from that number and are worth carrying. First, the oven cavity is only a few wavelengths across, so a standing-wave pattern forms with real nodes inside the food — which is exactly what the turntable exists to defeat, and why an oven without one leaves cold patches at fixed positions. Second, this frequency is not a resonance of the water molecule, a claim repeated everywhere and false: it was chosen partly because absorption is broad and gentle enough to heat food through rather than only at the surface. (1.2 misplaces the exponent by one; 8.33 inverts the division.)",
        hi: "λ = c/f = (3 × 10⁸)/(2.5 × 10⁹) = 0.12 m, अर्थात् 30/2.5 = 12 cm. उस संख्या से दो परिणाम निकलते हैं जिन्हें साथ ले जाना चाहिए। पहला, चूल्हे की गुहा आर-पार कुछ ही तरंगदैर्ध्य चौड़ी है, अतः भोजन के भीतर असली निस्पंदों के साथ अप्रगामी तरंग का प्रतिरूप बनता है — घूमने वाली तश्तरी ठीक इसी को हराने के लिए है, और इसीलिए उसके बिना चूल्हा नियत जगहों पर ठंडे टुकड़े छोड़ देता है। दूसरा, यह आवृत्ति जल अणु का अनुनाद नहीं है, जो दावा सब जगह दोहराया जाता है और झूठा है: वह आंशिक रूप से इसलिए चुनी गई कि अवशोषण इतना चौड़ा और हल्का है कि भोजन केवल सतह पर नहीं बल्कि आर-पार गर्म हो। (1.2 घातांक एक से चूक जाता है; 8.33 भाग उलट देता है।)",
        mr: "λ = c/f = (3 × 10⁸)/(2.5 × 10⁹) = 0.12 m, म्हणजे 30/2.5 = 12 cm. त्या आकड्यातून दोन परिणाम निघतात जे सोबत न्यायला हवेत. पहिला, शेगडीची पोकळी आरपार काहीच तरंगलांबी रुंद आहे, म्हणून अन्नाच्या आत खऱ्या निस्पंदांसह अप्रगामी लहरीचा नमुना तयार होतो — फिरणारी तबकडी नेमकी हेच हरवण्यासाठी आहे, आणि म्हणूनच तिच्याविना शेगडी ठराविक जागी थंड तुकडे सोडते. दुसरा, ही वारंवारता पाण्याच्या रेणूचा अनुनाद नाही, हा दावा सर्वत्र पुन्हा पुन्हा केला जातो आणि खोटा आहे: ती अंशतः यासाठी निवडली गेली की शोषण इतके रुंद आणि सौम्य आहे की अन्न केवळ पृष्ठभागावर नव्हे तर आरपार तापावे. (1.2 घातांक एकाने चुकवते; 8.33 भागाकार उलटवते.)",
      },
    },
  ],
};
