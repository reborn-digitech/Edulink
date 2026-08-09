/**
 * Class 11 Chemistry — NCERT, chapter by chapter, on the same footing as
 * `g11-physics.ts`: a conceptual ladder from the fact engine with individually
 * authored computed problems bolted on by `withNumeric`.
 *
 * Chemistry needs that mixture as badly as physics does, and for a slightly
 * different reason. A pupil who can recite the definition of a limiting reagent
 * and cannot find one in a given pair of quantities has learnt nothing usable;
 * a pupil who can grind out mole ratios and does not know why a mole is
 * 6.022 × 10²³ of anything has learnt a procedure rather than a subject. The
 * two halves are on one card so neither can be revised without the other.
 *
 * Entity names avoid the Class 9–10 chemistry vocabulary already in the bank
 * ("The mole", "The atom", "Isotopes", "The law of constant proportions").
 * Class 11 is not those chapters restated: it asks what a mole COUNTS, why a
 * formula found from percentages is not the formula of a molecule, and why the
 * electron's address is a probability cloud rather than an orbit.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";
import type { NumQ } from "./numeric";
import { unit } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Chemistry Part I (Class 11)";
const LICENCE = "CC-BY-SA-4.0";

const grams = unit("g");
const moles = unit("mol");

export const G11_CHEMISTRY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Some Basic Concepts of Chemistry                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-some-basic-concepts",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 1 — Some Basic Concepts of Chemistry",
      hi: "अध्याय 1 — रसायन विज्ञान की कुछ मूल अवधारणाएँ",
      mr: "प्रकरण 1 — रसायनशास्त्रातील काही मूलभूत संकल्पना",
    },
    name: {
      en: "Some Basic Concepts of Chemistry",
      hi: "रसायन विज्ञान की कुछ मूल अवधारणाएँ",
      mr: "रसायनशास्त्रातील काही मूलभूत संकल्पना",
    },
    summary: {
      en: "Chemistry happens one particle at a time and is weighed a gram at a time, so the whole subject rests on a bridge between the two: a number chosen to make that bridge exact, a formula that says the ratio and not the molecule, a reactant that runs out first and decides how much can ever be made, two concentrations that differ only in what the denominator is, and a law of whole-number ratios that was the first real evidence for atoms.",
      hi: "रसायन एक-एक कण करके घटता है और एक-एक ग्राम करके तौला जाता है, अतः पूरा विषय दोनों के बीच एक पुल पर टिका है: वह संख्या जो उस पुल को ठीक-ठीक बनाने के लिए चुनी गई, वह सूत्र जो अनुपात बताता है, अणु नहीं, वह अभिकारक जो पहले चुक जाता है और तय कर देता है कि कभी कितना बन सकता है, वे दो सांद्रताएँ जो केवल हर में भिन्न हैं, और पूर्णांक अनुपातों का वह नियम जो परमाणुओं का पहला असली प्रमाण था।",
      mr: "रसायन एकेक कणाने घडते आणि एकेक ग्रॅमने तोलले जाते, म्हणून अख्खा विषय दोघांमधल्या एका पुलावर टेकलेला आहे: तो आकडा जो तो पूल नेमका बनवण्यासाठी निवडला, ते सूत्र जे गुणोत्तर सांगते, रेणू नव्हे, तो अभिक्रियाकारक जो आधी संपतो आणि किती बनू शकते हे ठरवतो, त्या दोन संहती ज्या केवळ छेदात वेगळ्या, आणि पूर्णांक गुणोत्तरांचा तो नियम जो अणूंचा पहिला खरा पुरावा होता.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "mole-as-a-counting-unit",
        name: {
          en: "The mole as a counting unit",
          hi: "गणना-मात्रक के रूप में मोल",
          mr: "मोजणी-एकक म्हणून मोल",
        },
        kind: "bridge",
        prompt: {
          en: "A shopkeeper counts eggs in dozens because counting them singly is absurd; a chemist counts particles in units of 6.022 × 10²³ for exactly the same reason, and that unit is chosen so the count weighs a convenient number of grams. What is it?",
          hi: "दुकानदार अंडे दर्जन में गिनता है क्योंकि एक-एक गिनना बेतुका है; रसायनज्ञ ठीक उसी कारण कणों को 6.022 × 10²³ की इकाइयों में गिनता है, और वह इकाई ऐसी चुनी गई है कि गिनती सुविधाजनक ग्राम तौले। वह क्या है?",
          mr: "दुकानदार अंडी डझनांत मोजतो कारण एकेक मोजणे हास्यास्पद; रसायनशास्त्रज्ञ नेमक्या त्याच कारणाने कण 6.022 × 10²³ च्या एककांत मोजतो, आणि ते एकक असे निवडले आहे की मोजणी सोयीस्कर ग्रॅम तोलेल. ते काय?",
        },
        statement: {
          en: "A mole is 6.022 × 10²³ particles, and the number is chosen so that one mole of any substance has a mass in grams equal to its relative atomic or molecular mass.",
          hi: "एक मोल 6.022 × 10²³ कण हैं, और यह संख्या ऐसी चुनी गई है कि किसी भी पदार्थ के एक मोल का ग्राम में द्रव्यमान उसके सापेक्ष परमाणु या आण्विक द्रव्यमान के बराबर हो।",
          mr: "एक मोल म्हणजे 6.022 × 10²³ कण, आणि हा आकडा असा निवडला आहे की कोणत्याही पदार्थाच्या एका मोलचे ग्रॅममधले वस्तुमान त्याच्या सापेक्ष अणु वा रेणु वस्तुमानाइतके असावे.",
        },
        detail: {
          en: "It is a pure count and says nothing about what is being counted, so a mole of electrons, a mole of ions and a mole of sand grains are all the same number of things.",
          hi: "यह शुद्ध गिनती है और यह नहीं बताती कि गिना क्या जा रहा है, अतः एक मोल इलेक्ट्रॉन, एक मोल आयन और एक मोल रेत-कण सब एक ही संख्या की चीज़ें हैं।",
          mr: "ही शुद्ध मोजणी आणि काय मोजले जात आहे हे सांगत नाही, म्हणून एक मोल इलेक्ट्रॉन, एक मोल आयन आणि एक मोल वाळूचे कण हे सर्व एकाच संख्येच्या गोष्टी.",
        },
        extra: {
          en: "Its whole purpose is to let a balance do the counting: nobody can count 10²³ molecules, but anybody can weigh 18 g of water and know it holds one mole of them.",
          hi: "उसका पूरा प्रयोजन यह है कि गिनती तराज़ू कर दे: 10²³ अणु कोई नहीं गिन सकता, पर 18 g पानी कोई भी तौल सकता है और जान सकता है कि उसमें उनका एक मोल है।",
          mr: "तिचा अख्खा हेतू हा की मोजणी तराजूने व्हावी: 10²³ रेणू कोणीही मोजू शकत नाही, पण 18 g पाणी कोणीही तोलू शकतो आणि जाणू शकतो की त्यात त्यांचा एक मोल आहे.",
        },
        pair: {
          left: {
            en: "Let the balance do the counting",
            hi: "गिनती तराज़ू से करवाओ",
            mr: "मोजणी तराजूकडून करवा",
          },
          right: {
            en: "the mole as a counting unit",
            hi: "गणना-मात्रक के रूप में मोल",
            mr: "मोजणी-एकक म्हणून मोल",
          },
        },
      },
      {
        id: "empirical-against-molecular-formula",
        name: {
          en: "Empirical against molecular formula",
          hi: "मूलानुपाती बनाम आण्विक सूत्र",
          mr: "मूलानुपाती विरुद्ध रेणवीय सूत्र",
        },
        kind: "bridge",
        prompt: {
          en: "Analysis by mass gives CH₂O for both formaldehyde and glucose, because it can only ever recover the simplest whole-number ratio and never how many of those units make up one molecule. Which contrast is this?",
          hi: "द्रव्यमान से विश्लेषण फ़ॉर्मल्डिहाइड और ग्लूकोज़ दोनों के लिए CH₂O देता है, क्योंकि वह केवल सरलतम पूर्णांक अनुपात ही निकाल सकता है, यह कभी नहीं कि उनमें से कितनी इकाइयाँ मिलकर एक अणु बनाती हैं। यह कौन-सा भेद है?",
          mr: "वस्तुमानाने विश्लेषण फॉर्मल्डिहाइड आणि ग्लुकोज दोघांसाठी CH₂O देते, कारण ते केवळ सर्वांत सोपे पूर्णांक गुणोत्तरच काढू शकते, त्यांतील किती एकके मिळून एक रेणू बनतो हे कधीच नाही. हा कोणता भेद?",
        },
        statement: {
          en: "The empirical formula gives the simplest whole-number ratio of atoms and the molecular formula gives the actual number in one molecule, so the second is always a whole multiple of the first.",
          hi: "मूलानुपाती सूत्र परमाणुओं का सरलतम पूर्णांक अनुपात देता है और आण्विक सूत्र एक अणु में वास्तविक संख्या, अतः दूसरा सदा पहले का पूर्णांक गुणज होता है।",
          mr: "मूलानुपाती सूत्र अणूंचे सर्वांत सोपे पूर्णांक गुणोत्तर देते आणि रेणवीय सूत्र एका रेणूतील प्रत्यक्ष संख्या, म्हणून दुसरे नेहमी पहिल्याचा पूर्णांक पट असते.",
        },
        detail: {
          en: "Finding the multiplier needs a separate measurement of the molar mass, which is why elemental analysis alone can never distinguish glucose from formaldehyde.",
          hi: "गुणक निकालने के लिए मोलर द्रव्यमान का अलग माप चाहिए, इसीलिए अकेला तात्विक विश्लेषण ग्लूकोज़ और फ़ॉर्मल्डिहाइड में कभी भेद नहीं कर सकता।",
          mr: "गुणक काढण्यासाठी मोलर वस्तुमानाचे वेगळे माप लागते, म्हणूनच एकटे मूलद्रव्य-विश्लेषण ग्लुकोज आणि फॉर्मल्डिहाइड यांत कधीच फरक करू शकत नाही.",
        },
        extra: {
          en: "For an ionic solid there is no molecule at all, so the formula written is only ever the ratio — a crystal of sodium chloride is one giant lattice, not a collection of NaCl units.",
          hi: "आयनिक ठोस के लिए अणु होता ही नहीं, अतः लिखा गया सूत्र सदा केवल अनुपात है — सोडियम क्लोराइड का क्रिस्टल एक विशाल जालक है, NaCl इकाइयों का संग्रह नहीं।",
          mr: "आयनिक घनपदार्थासाठी रेणू असतोच नाही, म्हणून लिहिलेले सूत्र नेहमी केवळ गुणोत्तर — सोडियम क्लोराइडचा स्फटिक एक अवाढव्य जालक आहे, NaCl एककांचा संग्रह नव्हे.",
        },
        pair: {
          left: {
            en: "Same answer for glucose and formaldehyde",
            hi: "ग्लूकोज़ और फ़ॉर्मल्डिहाइड का वही उत्तर",
            mr: "ग्लुकोज आणि फॉर्मल्डिहाइडचे तेच उत्तर",
          },
          right: {
            en: "empirical against molecular formula",
            hi: "मूलानुपाती बनाम आण्विक सूत्र",
            mr: "मूलानुपाती विरुद्ध रेणवीय सूत्र",
          },
        },
      },
      {
        id: "limiting-reagent",
        name: {
          en: "The limiting reagent",
          hi: "सीमांत अभिकारक",
          mr: "सीमित अभिक्रियाकारक",
        },
        kind: "stoichiometry",
        prompt: {
          en: "Twenty slices of bread and six slices of cheese make six sandwiches and leave eight slices of bread on the counter, however much bread is added afterwards. Which idea is this?",
          hi: "बीस पाव और छह पनीर की स्लाइसें छह सैंडविच बनाती हैं और आठ पाव मेज़ पर छोड़ जाती हैं, बाद में चाहे कितना ही पाव और जोड़ा जाए। यह कौन-सा विचार है?",
          mr: "वीस पावाचे आणि सहा चीजचे तुकडे सहा सँडविच बनवतात आणि आठ पावाचे तुकडे टेबलावर उरवतात, नंतर कितीही पाव जोडला तरी. ही कोणती कल्पना?",
        },
        statement: {
          en: "The limiting reagent is the reactant that is used up first, and it alone fixes how much product can form; every other reactant is in excess and part of it must survive the reaction.",
          hi: "सीमांत अभिकारक वह अभिकारक है जो पहले चुक जाता है, और अकेला वही तय करता है कि उत्पाद कितना बन सकता है; बाक़ी हर अभिकारक आधिक्य में है और उसका कुछ भाग अभिक्रिया के बाद बचना ही है।",
          mr: "सीमित अभिक्रियाकारक तो जो आधी संपतो, आणि एकटा तोच ठरवतो की उत्पाद किती बनू शकते; बाकी प्रत्येक अभिक्रियाकारक अधिक्यात असतो आणि त्याचा काही भाग अभिक्रियेनंतर उरतोच.",
        },
        detail: {
          en: "It is found by dividing each reactant's available moles by its coefficient in the balanced equation, and the smallest quotient names the one that runs out.",
          hi: "उसे हर अभिकारक के उपलब्ध मोलों को संतुलित समीकरण में उसके गुणांक से भाग देकर खोजा जाता है, और सबसे छोटा भागफल बताता है कि कौन चुकेगा।",
          mr: "तो प्रत्येक अभिक्रियाकारकाचे उपलब्ध मोल संतुलित समीकरणातील त्याच्या गुणांकाने भागून शोधला जातो, आणि सर्वांत लहान भागाकार कोण संपेल ते सांगतो.",
        },
        extra: {
          en: "Industry deliberately makes the cheaper reactant the excess one, so the expensive one is fully consumed — which is why air is fed in surplus to a furnace and never the fuel.",
          hi: "उद्योग जानबूझकर सस्ते अभिकारक को आधिक्य वाला बनाता है, ताकि महँगा पूरी तरह ख़र्च हो — इसीलिए भट्ठी में हवा अधिक दी जाती है, ईंधन कभी नहीं।",
          mr: "उद्योग मुद्दाम स्वस्त अभिक्रियाकारकाला अधिक्यातला बनवतो, म्हणजे महाग पूर्णपणे वापरला जाईल — म्हणूनच भट्टीत हवा जास्त दिली जाते, इंधन कधीच नाही.",
        },
        pair: {
          left: {
            en: "Eight slices of bread left on the counter",
            hi: "मेज़ पर छूटे आठ पाव",
            mr: "टेबलावर उरलेले आठ पावाचे तुकडे",
          },
          right: {
            en: "the limiting reagent",
            hi: "सीमांत अभिकारक",
            mr: "सीमित अभिक्रियाकारक",
          },
        },
      },
      {
        id: "molarity-against-molality",
        name: {
          en: "Molarity against molality",
          hi: "मोलरता बनाम मोललता",
          mr: "मोलरता विरुद्ध मोललता",
        },
        kind: "stoichiometry",
        prompt: {
          en: "One divides the moles of solute by the volume of the whole solution and the other by the mass of the solvent alone, and only the second is unchanged when the flask is warmed. Which contrast is this?",
          hi: "एक विलेय के मोलों को पूरे विलयन के आयतन से भाग देता है और दूसरा अकेले विलायक के द्रव्यमान से, और फ़्लास्क गरम करने पर केवल दूसरा अपरिवर्तित रहता है। यह कौन-सा भेद है?",
          mr: "एक विद्राव्याचे मोल अख्ख्या द्रावणाच्या घनफळाने भागतो आणि दुसरा एकट्या विद्रावकाच्या वस्तुमानाने, आणि फ्लास्क तापवल्यावर केवळ दुसराच अपरिवर्तित राहतो. हा कोणता भेद?",
        },
        statement: {
          en: "Molarity is moles of solute per litre of solution and molality is moles of solute per kilogram of solvent, so molarity varies with temperature and molality does not.",
          hi: "मोलरता प्रति लीटर विलयन विलेय के मोल है और मोललता प्रति किलोग्राम विलायक विलेय के मोल, अतः मोलरता ताप से बदलती है और मोललता नहीं।",
          mr: "मोलरता म्हणजे प्रति लिटर द्रावण विद्राव्याचे मोल आणि मोललता म्हणजे प्रति किलोग्रॅम विद्रावक विद्राव्याचे मोल, म्हणून मोलरता तापमानानुसार बदलते आणि मोललता नाही.",
        },
        detail: {
          en: "The reason is that volume expands on heating while mass does not, so a 1 M solution left in the sun quietly becomes slightly less than 1 M without a single particle leaving it.",
          hi: "कारण यह कि गरम होने पर आयतन फैलता है और द्रव्यमान नहीं, अतः धूप में छोड़ा 1 M विलयन चुपचाप 1 M से थोड़ा कम हो जाता है, बिना एक भी कण के निकले।",
          mr: "कारण हे की तापल्यावर घनफळ प्रसरण पावते आणि वस्तुमान नाही, म्हणून उन्हात ठेवलेले 1 M द्रावण गुपचूप 1 M हून थोडे कमी होते, एकही कण न निघता.",
        },
        extra: {
          en: "Molarity is far more convenient at the bench, because a measuring cylinder is quicker than a balance, and molality is preferred wherever the temperature will change — in freezing-point and boiling-point work.",
          hi: "प्रयोग-मेज़ पर मोलरता कहीं सुविधाजनक है, क्योंकि मापक सिलिंडर तराज़ू से तेज़ है, और जहाँ ताप बदलेगा वहाँ मोललता पसंद की जाती है — हिमांक तथा क्वथनांक के काम में।",
          mr: "प्रयोगमेजावर मोलरता कितीतरी सोयीची, कारण मापन सिलिंडर तराजूहून जलद, आणि जिथे तापमान बदलेल तिथे मोललता पसंत केली जाते — गोठणबिंदू व उकळबिंदूच्या कामात.",
        },
        pair: {
          left: {
            en: "Warm the flask and only one of them changes",
            hi: "फ़्लास्क गरम करो और उनमें से केवल एक बदलता है",
            mr: "फ्लास्क तापवा आणि त्यांपैकी केवळ एकच बदलतो",
          },
          right: {
            en: "molarity against molality",
            hi: "मोलरता बनाम मोललता",
            mr: "मोलरता विरुद्ध मोललता",
          },
        },
      },
      {
        id: "law-of-multiple-proportions",
        name: {
          en: "The law of multiple proportions",
          hi: "गुणित अनुपात का नियम",
          mr: "गुणित प्रमाणाचा नियम",
        },
        kind: "evidence",
        prompt: {
          en: "The same 12 g of carbon combines with 16 g of oxygen in one compound and with exactly 32 g in another — never with 20 g or 25 g — and the ratio of those masses is a small whole number. Which law is this?",
          hi: "वही 12 g कार्बन एक यौगिक में 16 g ऑक्सीजन से जुड़ता है और दूसरे में ठीक 32 g से — कभी 20 g या 25 g से नहीं — और उन द्रव्यमानों का अनुपात छोटा पूर्णांक है। यह कौन-सा नियम है?",
          mr: "तेच 12 g कार्बन एका संयुगात 16 g ऑक्सिजनशी जुळते आणि दुसऱ्यात नेमक्या 32 g शी — कधीही 20 g वा 25 g शी नाही — आणि त्या वस्तुमानांचे गुणोत्तर लहान पूर्णांक. हा कोणता नियम?",
        },
        statement: {
          en: "The law of multiple proportions says that when two elements form more than one compound, the masses of one that combine with a fixed mass of the other are in a ratio of small whole numbers.",
          hi: "गुणित अनुपात का नियम कहता है कि जब दो तत्व एक से अधिक यौगिक बनाते हैं, तो एक के जो द्रव्यमान दूसरे के नियत द्रव्यमान से जुड़ते हैं वे छोटे पूर्णांकों के अनुपात में होते हैं।",
          mr: "गुणित प्रमाणाचा नियम सांगतो की जेव्हा दोन मूलद्रव्ये एकाहून अधिक संयुगे बनवतात, तेव्हा एकाची जी वस्तुमाने दुसऱ्याच्या ठरलेल्या वस्तुमानाशी जुळतात ती लहान पूर्णांकांच्या गुणोत्तरात असतात.",
        },
        detail: {
          en: "It was the strongest early evidence for atoms, because a continuous substance could combine in any proportion at all and only discrete indivisible units force whole-number ratios.",
          hi: "यह परमाणुओं का सबसे प्रबल आरंभिक प्रमाण था, क्योंकि सतत पदार्थ किसी भी अनुपात में जुड़ सकता था और केवल असतत अविभाज्य इकाइयाँ ही पूर्णांक अनुपात बाध्य करती हैं।",
          mr: "हा अणूंचा सर्वांत प्रबळ सुरुवातीचा पुरावा होता, कारण सलग पदार्थ कोणत्याही प्रमाणात जुळू शकला असता आणि केवळ विलग अविभाज्य एककेच पूर्णांक गुणोत्तरे सक्तीची करतात.",
        },
        extra: {
          en: "Dalton read the 1:2 ratio for the oxides of carbon exactly as we do — one oxygen atom in the first, two in the second — and that reading is what turned a chemical regularity into a physical picture.",
          hi: "डाल्टन ने कार्बन के ऑक्साइडों का 1:2 अनुपात ठीक वैसे ही पढ़ा जैसे हम पढ़ते हैं — पहले में एक ऑक्सीजन परमाणु, दूसरे में दो — और उसी पठन ने रासायनिक नियमितता को भौतिक चित्र में बदल दिया।",
          mr: "डाल्टनने कार्बनच्या ऑक्साइडांचे 1:2 गुणोत्तर नेमके तसेच वाचले जसे आपण वाचतो — पहिल्यात एक ऑक्सिजन अणू, दुसऱ्यात दोन — आणि त्याच वाचनाने रासायनिक नियमिततेला भौतिक चित्रात बदलले.",
        },
        pair: {
          left: {
            en: "16 g or 32 g, and never 25 g",
            hi: "16 g या 32 g, और 25 g कभी नहीं",
            mr: "16 g वा 32 g, आणि 25 g कधीच नाही",
          },
          right: {
            en: "the law of multiple proportions",
            hi: "गुणित अनुपात का नियम",
            mr: "गुणित प्रमाणाचा नियम",
          },
        },
      },
      {
        id: "percentage-composition-by-mass",
        name: {
          en: "Percentage composition by mass",
          hi: "द्रव्यमान से प्रतिशत संघटन",
          mr: "वस्तुमानानुसार शेकडा संघटन",
        },
        kind: "evidence",
        prompt: {
          en: "Carbon dioxide is 27.3 per cent carbon whether the sample came from a limekiln in Rajasthan or a volcano in Iceland, and a sample that reads 30 per cent is simply not carbon dioxide. Which quantity is this?",
          hi: "कार्बन डाइऑक्साइड 27.3 प्रतिशत कार्बन है, नमूना चाहे राजस्थान के चूना-भट्ठे से आया हो या आइसलैंड के ज्वालामुखी से, और जो नमूना 30 प्रतिशत दिखाए वह कार्बन डाइऑक्साइड है ही नहीं। यह कौन-सी राशि है?",
          mr: "कार्बन डायऑक्साइड 27.3 टक्के कार्बन असतो, नमुना राजस्थानातील चुनाभट्टीतून आला असो वा आइसलँडमधील ज्वालामुखीतून, आणि जो नमुना 30 टक्के दाखवतो तो कार्बन डायऑक्साइड नाहीच. ही कोणती राशी?",
        },
        statement: {
          en: "Percentage composition by mass is the mass of each element in a compound expressed as a percentage of the whole, and for a given compound it is a fixed set of numbers wherever the sample came from.",
          hi: "द्रव्यमान से प्रतिशत संघटन यौगिक में हर तत्व का द्रव्यमान पूरे के प्रतिशत के रूप में है, और किसी दिए यौगिक के लिए वह संख्याओं का नियत समुच्चय है, नमूना कहीं से भी आया हो।",
          mr: "वस्तुमानानुसार शेकडा संघटन म्हणजे संयुगातील प्रत्येक मूलद्रव्याचे वस्तुमान अख्ख्याच्या शेकड्यात मांडलेले, आणि दिलेल्या संयुगासाठी तो संख्यांचा ठरलेला संच, नमुना कुठूनही आलेला असो.",
        },
        detail: {
          en: "It is the raw output of elemental analysis, and dividing each percentage by the element's atomic mass converts it into the mole ratio from which the empirical formula follows.",
          hi: "यह तात्विक विश्लेषण का कच्चा निर्गत है, और हर प्रतिशत को उस तत्व के परमाणु द्रव्यमान से भाग देने पर वह उस मोल-अनुपात में बदल जाता है जिससे मूलानुपाती सूत्र निकलता है।",
          mr: "हे मूलद्रव्य-विश्लेषणाचे कच्चे निर्गत, आणि प्रत्येक शेकडा त्या मूलद्रव्याच्या अणुवस्तुमानाने भागल्यास ते त्या मोल-गुणोत्तरात बदलते ज्यातून मूलानुपाती सूत्र निघते.",
        },
        extra: {
          en: "Its constancy is the law of definite proportions stated as a measurement, and a sample whose percentages do not match is either impure or a different compound altogether.",
          hi: "उसकी स्थिरता ही निश्चित अनुपात का नियम है, माप के रूप में कहा गया, और जिस नमूने के प्रतिशत मेल न खाएँ वह या तो अशुद्ध है या बिलकुल भिन्न यौगिक।",
          mr: "तिचे स्थैर्य हाच निश्चित प्रमाणाचा नियम, मापाच्या रूपात मांडलेला, आणि ज्या नमुन्याचे शेकडे जुळत नाहीत तो एकतर अशुद्ध आहे वा अगदी वेगळे संयुग.",
        },
        pair: {
          left: {
            en: "The same figure from a kiln and from a volcano",
            hi: "भट्ठे से और ज्वालामुखी से वही आँकड़ा",
            mr: "भट्टीतून आणि ज्वालामुखीतून तोच आकडा",
          },
          right: {
            en: "percentage composition by mass",
            hi: "द्रव्यमान से प्रतिशत संघटन",
            mr: "वस्तुमानानुसार शेकडा संघटन",
          },
        },
      },
      /*F1C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Six moles of hydrogen and two moles of oxygen are sparked together to make water. A student answers six moles of water, since there are six moles of hydrogen. Correct this, and say how much of each gas is left over.",
          hi: "छह मोल हाइड्रोजन और दो मोल ऑक्सीजन को साथ चिंगारी देकर पानी बनाया जाता है। एक विद्यार्थी उत्तर देता है छह मोल पानी, क्योंकि हाइड्रोजन छह मोल है। इसे सुधारो, और बताओ कि हर गैस कितनी बची।",
          mr: "सहा मोल हायड्रोजन आणि दोन मोल ऑक्सिजन एकत्र ठिणगी देऊन पाणी बनवले जाते. एक विद्यार्थी उत्तर देतो सहा मोल पाणी, कारण हायड्रोजन सहा मोल आहे. हे दुरुस्त करा, आणि प्रत्येक वायू किती उरला ते सांगा.",
        },
        choices: [
          {
            en: "The equation is 2H₂ + O₂ → 2H₂O, so two moles of oxygen can consume only four moles of hydrogen and yield four moles of water. Oxygen is the limiting reagent, hydrogen is in excess, and two moles of hydrogen remain unreacted at the end. The student read the larger number as the deciding one, but what decides is moles divided by coefficient: 6/2 = 3 for hydrogen against 2/1 = 2 for oxygen, and the smaller quotient names the reagent that runs out",
            hi: "समीकरण 2H₂ + O₂ → 2H₂O है, अतः दो मोल ऑक्सीजन केवल चार मोल हाइड्रोजन ही खपा सकती है और चार मोल पानी देती है। ऑक्सीजन सीमांत अभिकारक है, हाइड्रोजन आधिक्य में, और अंत में दो मोल हाइड्रोजन बिना अभिक्रिया के बचती है। विद्यार्थी ने बड़ी संख्या को निर्णायक पढ़ा, पर निर्णय करता है मोल बटा गुणांक: हाइड्रोजन के लिए 6/2 = 3 के सामने ऑक्सीजन के लिए 2/1 = 2, और छोटा भागफल बताता है कि कौन-सा अभिकारक चुकेगा",
            mr: "समीकरण 2H₂ + O₂ → 2H₂O, म्हणून दोन मोल ऑक्सिजन केवळ चार मोल हायड्रोजनच वापरू शकतो आणि चार मोल पाणी देतो. ऑक्सिजन हा सीमित अभिक्रियाकारक, हायड्रोजन अधिक्यात, आणि शेवटी दोन मोल हायड्रोजन अभिक्रियेविना उरतो. विद्यार्थ्याने मोठी संख्या निर्णायक वाचली, पण निर्णय करते मोल भागिले गुणांक: हायड्रोजनसाठी 6/2 = 3 समोर ऑक्सिजनसाठी 2/1 = 2, आणि लहान भागाकार कोणता अभिक्रियाकारक संपेल ते सांगतो",
          },
          {
            en: "The student is right: six moles of hydrogen give six moles of water, and the oxygen simply supplies whatever is needed",
            hi: "विद्यार्थी सही है: छह मोल हाइड्रोजन छह मोल पानी देती है, और ऑक्सीजन बस जितना चाहिए उतना दे देती है",
            mr: "विद्यार्थी बरोबर: सहा मोल हायड्रोजन सहा मोल पाणी देतो, आणि ऑक्सिजन फक्त जितका लागेल तितका देतो",
          },
          {
            en: "Two moles of water form, because oxygen is limiting and two moles of it are present",
            hi: "दो मोल पानी बनता है, क्योंकि ऑक्सीजन सीमांत है और उसके दो मोल मौजूद हैं",
            mr: "दोन मोल पाणी तयार होते, कारण ऑक्सिजन सीमित आहे आणि त्याचे दोन मोल उपस्थित आहेत",
          },
          {
            en: "Eight moles of water form, since the eight moles of gas present must all end up in the product",
            hi: "आठ मोल पानी बनता है, क्योंकि मौजूद आठ मोल गैस सब उत्पाद में ही जाएगी",
            mr: "आठ मोल पाणी तयार होते, कारण उपस्थित आठ मोल वायू सर्व उत्पादातच जाईल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Balance the equation before doing anything else, because every stoichiometric answer is read off the coefficients. Water is H₂O, so 2H₂ + O₂ → 2H₂O: two hydrogens for every one oxygen, and two waters out. Now the two candidates. Hydrogen: 6 moles available, 2 required per unit of reaction, so it could support 6/2 = 3 units. Oxygen: 2 moles available, 1 required per unit, so it could support 2/1 = 2 units. The reaction can only run as many times as the poorest supply allows — two units. Two units of reaction means 4 moles of hydrogen consumed, 2 of oxygen consumed and 4 moles of water produced, with 6 − 4 = 2 moles of hydrogen left sitting in the vessel with nothing to react with. The student's mistake is a natural one and worth naming precisely. They compared raw amounts — six against two — and concluded that hydrogen, being plentiful, was in charge. But raw amounts cannot be compared across different substances, because a mole of one is not interchangeable with a mole of another. The coefficients are the exchange rate, and only after dividing by them are the two numbers on the same footing. Notice also that having MORE of something makes it more likely to be in excess, not less, which is the exact reverse of the student's instinct. Two habits follow, and they will carry a pupil through the whole of stoichiometry. First, always divide by the coefficient before comparing; the smallest quotient is the limiting reagent, and this works however many reactants there are. Second, once the limiting reagent is identified, ignore every other quantity given — the product is calculated from the limiting reagent alone, and the excess amounts are only needed if the question asks what is left over. The practical reading is worth a line too. In a laboratory an excess reagent is a nuisance to separate afterwards; in industry it is a deliberate choice, because whichever reactant is cheap is supplied in surplus to make sure the expensive one is completely used up. A furnace is fed more air than it strictly needs for exactly this reason: air costs nothing and unburnt fuel is money going up the chimney. (The third answer identifies the limiting reagent correctly and then forgets the 2:1 coefficient in the product, and the fourth conserves moles, which no chemical equation ever does.)",
          hi: "कुछ भी करने से पहले समीकरण संतुलित करो, क्योंकि हर रससमीकरणमितीय उत्तर गुणांकों से ही पढ़ा जाता है। पानी H₂O है, अतः 2H₂ + O₂ → 2H₂O: हर एक ऑक्सीजन पर दो हाइड्रोजन, और दो पानी बाहर। अब दोनों उम्मीदवार। हाइड्रोजन: 6 मोल उपलब्ध, प्रति अभिक्रिया-इकाई 2 चाहिए, अतः वह 6/2 = 3 इकाइयाँ सँभाल सकती। ऑक्सीजन: 2 मोल उपलब्ध, प्रति इकाई 1 चाहिए, अतः वह 2/1 = 2 इकाइयाँ सँभाल सकती। अभिक्रिया उतनी ही बार चल सकती है जितनी सबसे कमज़ोर आपूर्ति दे — दो इकाइयाँ। दो इकाइयों का अर्थ 4 मोल हाइड्रोजन खपी, 2 मोल ऑक्सीजन खपी और 4 मोल पानी बना, और 6 − 4 = 2 मोल हाइड्रोजन पात्र में बैठी रह गई जिसके साथ अभिक्रिया करने को कुछ नहीं। विद्यार्थी की भूल स्वाभाविक है और ठीक-ठीक नाम लेने योग्य। उसने कच्ची मात्राओं की तुलना की — छह के सामने दो — और निष्कर्ष निकाला कि हाइड्रोजन, प्रचुर होने से, प्रभारी है। पर कच्ची मात्राओं की तुलना भिन्न पदार्थों के बीच हो नहीं सकती, क्योंकि एक का मोल दूसरे के मोल से अदल-बदल योग्य नहीं। गुणांक ही विनिमय-दर हैं, और उनसे भाग देने के बाद ही दोनों संख्याएँ एक धरातल पर आती हैं। यह भी ध्यान दो कि किसी चीज़ का अधिक होना उसे आधिक्य में होने की अधिक संभावना देता है, कम नहीं, जो विद्यार्थी की सहज बुद्धि का ठीक उलटा है। दो आदतें निकलती हैं, और वे छात्र को पूरी रससमीकरणमिति के पार ले जाएँगी। पहली, तुलना से पहले सदा गुणांक से भाग दो; सबसे छोटा भागफल सीमांत अभिकारक है, और यह अभिकारक कितने भी हों तब चलता है। दूसरी, सीमांत अभिकारक पहचान लेने पर दी गई हर दूसरी मात्रा अनदेखी करो — उत्पाद अकेले सीमांत अभिकारक से निकाला जाता है, और आधिक्य की मात्राएँ केवल तब चाहिए जब प्रश्न पूछे कि बचा क्या। व्यावहारिक पठन भी एक पंक्ति के योग्य है। प्रयोगशाला में आधिक्य अभिकारक बाद में अलग करने की झंझट है; उद्योग में वह जानबूझकर किया चुनाव है, क्योंकि जो भी अभिकारक सस्ता हो उसे अधिक दिया जाता है ताकि महँगा पूरी तरह ख़र्च हो जाए। भट्ठी को कड़ाई से ज़रूरत से अधिक हवा ठीक इसी कारण दी जाती है: हवा मुफ़्त है और बिना जला ईंधन चिमनी से उड़ता पैसा। (तीसरा उत्तर सीमांत अभिकारक ठीक पहचानता है और फिर उत्पाद में 2:1 गुणांक भूल जाता है, और चौथा मोल संरक्षित करता है, जो कोई रासायनिक समीकरण कभी नहीं करता।)",
          mr: "काहीही करण्याआधी समीकरण संतुलित करा, कारण प्रत्येक रससमीकरणमितीय उत्तर गुणांकांवरूनच वाचले जाते. पाणी H₂O, म्हणून 2H₂ + O₂ → 2H₂O: प्रत्येक एका ऑक्सिजनमागे दोन हायड्रोजन, आणि दोन पाणी बाहेर. आता दोन उमेदवार. हायड्रोजन: 6 मोल उपलब्ध, प्रति अभिक्रिया-एकक 2 लागतात, म्हणून तो 6/2 = 3 एकके सांभाळू शकला असता. ऑक्सिजन: 2 मोल उपलब्ध, प्रति एकक 1 लागतो, म्हणून तो 2/1 = 2 एकके सांभाळू शकतो. अभिक्रिया तितक्याच वेळा चालू शकते जितकी सर्वांत कमकुवत पुरवठा देईल — दोन एकके. दोन एककांचा अर्थ 4 मोल हायड्रोजन वापरला, 2 मोल ऑक्सिजन वापरला आणि 4 मोल पाणी तयार झाले, आणि 6 − 4 = 2 मोल हायड्रोजन भांड्यात बसून राहिला ज्याच्यासोबत अभिक्रिया करायला काहीच नाही. विद्यार्थ्याची चूक नैसर्गिक आणि नेमके नाव घेण्याजोगी. त्याने कच्च्या प्रमाणांची तुलना केली — सहा समोर दोन — आणि निष्कर्ष काढला की हायड्रोजन, विपुल असल्याने, प्रभारी आहे. पण कच्च्या प्रमाणांची तुलना वेगळ्या पदार्थांमध्ये होऊच शकत नाही, कारण एकाचा मोल दुसऱ्याच्या मोलशी अदलाबदल करण्याजोगा नाही. गुणांक हाच विनिमय-दर, आणि त्यांनी भागल्यावरच दोन्ही संख्या एका पातळीवर येतात. हेही लक्षात घ्या की एखादी गोष्ट अधिक असणे तिला अधिक्यात असण्याची अधिक शक्यता देते, कमी नाही, जे विद्यार्थ्याच्या सहजबुद्धीच्या नेमके उलटे. दोन सवयी निघतात, आणि त्या विद्यार्थ्याला अख्ख्या रससमीकरणमितीपार नेतील. पहिली, तुलनेआधी नेहमी गुणांकाने भागा; सर्वांत लहान भागाकार हा सीमित अभिक्रियाकारक, आणि हे अभिक्रियाकारक कितीही असोत चालते. दुसरी, सीमित अभिक्रियाकारक ओळखल्यावर दिलेले प्रत्येक दुसरे प्रमाण दुर्लक्षा — उत्पाद एकट्या सीमित अभिक्रियाकारकातून काढले जाते, आणि अधिक्याची प्रमाणे केवळ प्रश्नाने काय उरले विचारल्यासच लागतात. व्यावहारिक वाचनही एका ओळीस पात्र. प्रयोगशाळेत अधिक्यातला अभिक्रियाकारक नंतर वेगळा करण्याची कटकट; उद्योगात ती मुद्दाम केलेली निवड, कारण जो अभिक्रियाकारक स्वस्त तो जास्त दिला जातो जेणेकरून महाग पूर्णपणे वापरला जाईल. भट्टीला काटेकोर गरजेहून अधिक हवा नेमक्या याच कारणाने दिली जाते: हवा फुकट आणि न जळलेले इंधन धुराड्यातून उडणारा पैसा. (तिसरे उत्तर सीमित अभिक्रियाकारक बरोबर ओळखते आणि मग उत्पादातील 2:1 गुणांक विसरते, आणि चौथे मोल संरक्षित करते, जे कोणतेही रासायनिक समीकरण कधीच करत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Elemental analysis of a compound gives 40 per cent carbon, 6.7 per cent hydrogen and 53.3 per cent oxygen by mass. A student concludes the compound is formaldehyde, CH₂O. Assess the reasoning and say what further measurement would settle it.",
          hi: "किसी यौगिक के तात्विक विश्लेषण से द्रव्यमान के अनुसार 40 प्रतिशत कार्बन, 6.7 प्रतिशत हाइड्रोजन और 53.3 प्रतिशत ऑक्सीजन मिलता है। एक विद्यार्थी निष्कर्ष निकालता है कि यौगिक फ़ॉर्मल्डिहाइड, CH₂O है। तर्क का आकलन करो और बताओ कि कौन-सा और माप मामला निपटाएगा।",
          mr: "एका संयुगाच्या मूलद्रव्य-विश्लेषणातून वस्तुमानानुसार 40 टक्के कार्बन, 6.7 टक्के हायड्रोजन आणि 53.3 टक्के ऑक्सिजन मिळते. एक विद्यार्थी निष्कर्ष काढतो की संयुग फॉर्मल्डिहाइड, CH₂O आहे. युक्तिवादाचे मूल्यमापन करा आणि कोणते आणखी माप प्रकरण निकाली काढेल ते सांगा.",
        },
        choices: [
          {
            en: "The empirical formula CH₂O is correct and the identification is not. Dividing each percentage by the atomic mass gives 3.33 : 6.7 : 3.33, which is 1 : 2 : 1 — but that ratio is shared by formaldehyde (CH₂O, 30), acetic acid (C₂H₄O₂, 60) and glucose (C₆H₁₂O₆, 180) alike. Only a measurement of the molar mass can fix the multiplier: divide it by 30 and the quotient is how many CH₂O units make one molecule",
            hi: "मूलानुपाती सूत्र CH₂O सही है और पहचान नहीं। हर प्रतिशत को परमाणु द्रव्यमान से भाग देने पर 3.33 : 6.7 : 3.33 मिलता है, जो 1 : 2 : 1 है — पर वही अनुपात फ़ॉर्मल्डिहाइड (CH₂O, 30), ऐसीटिक अम्ल (C₂H₄O₂, 60) और ग्लूकोज़ (C₆H₁₂O₆, 180) सब साझा करते हैं। केवल मोलर द्रव्यमान का माप ही गुणक तय कर सकता है: उसे 30 से भाग दो और भागफल बताता है कि कितनी CH₂O इकाइयाँ एक अणु बनाती हैं",
            mr: "मूलानुपाती सूत्र CH₂O बरोबर आणि ओळख नाही. प्रत्येक शेकडा अणुवस्तुमानाने भागल्यास 3.33 : 6.7 : 3.33 मिळते, जे 1 : 2 : 1 — पण तेच गुणोत्तर फॉर्मल्डिहाइड (CH₂O, 30), ॲसिटिक आम्ल (C₂H₄O₂, 60) आणि ग्लुकोज (C₆H₁₂O₆, 180) सर्व वाटून घेतात. केवळ मोलर वस्तुमानाचे मापच गुणक ठरवू शकते: ते 30 ने भागा आणि भागाकार सांगतो की किती CH₂O एकके एक रेणू बनवतात",
          },
          {
            en: "The student is right: percentages by mass determine a compound uniquely, so no further measurement is needed",
            hi: "विद्यार्थी सही है: द्रव्यमान से प्रतिशत यौगिक को अद्वितीय रूप से तय कर देते हैं, अतः और कोई माप नहीं चाहिए",
            mr: "विद्यार्थी बरोबर: वस्तुमानानुसार शेकडे संयुग अद्वितीयपणे ठरवतात, म्हणून आणखी कोणतेही माप लागत नाही",
          },
          {
            en: "The percentages give no formula at all, because mass ratios cannot be converted into atom ratios",
            hi: "प्रतिशत कोई सूत्र देते ही नहीं, क्योंकि द्रव्यमान-अनुपात परमाणु-अनुपात में बदले नहीं जा सकते",
            mr: "शेकडे कोणतेही सूत्र देतच नाहीत, कारण वस्तुमान-गुणोत्तरे अणु-गुणोत्तरांत बदलता येत नाहीत",
          },
          {
            en: "The empirical formula is C₃H₇O₃, since the percentages should be used directly as subscripts",
            hi: "मूलानुपाती सूत्र C₃H₇O₃ है, क्योंकि प्रतिशत सीधे अधोलेख के रूप में लगाए जाने चाहिए",
            mr: "मूलानुपाती सूत्र C₃H₇O₃ आहे, कारण शेकडे थेट अधोलेख म्हणून वापरावेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Work the analysis through first, because half the student's reasoning is impeccable. Percentages are masses, and masses cannot be compared across elements — a gram of hydrogen is twelve times as many atoms as a gram of carbon. To get atom ratios, divide each mass by the atomic mass of that element, which converts grams into moles. Carbon: 40/12 = 3.33. Hydrogen: 6.7/1 = 6.7. Oxygen: 53.3/16 = 3.33. Now divide through by the smallest, 3.33, giving 1 : 2.01 : 1, which is 1 : 2 : 1 to within experimental error. So the empirical formula is CH₂O, and the student has done that part correctly. The error is the last step, and it is a step that cannot be taken. An empirical formula reports a RATIO. It says one carbon for every two hydrogens and one oxygen, and it is silent about how many of those units a molecule contains. Formaldehyde is CH₂O with molar mass 30. Acetic acid is C₂H₄O₂ with molar mass 60 — twice the unit. Glucose is C₆H₁₂O₆ with molar mass 180 — six times the unit. All three give exactly 40, 6.7 and 53.3 per cent, and no combustion analysis however careful can tell them apart, because burning a sample destroys the molecule and reports only what atoms were in it. The three substances could hardly be less alike: a preservative gas, the acid in vinegar and the sugar in blood. So what settles it? A measurement that responds to the whole molecule rather than to its atoms. The molar mass is the classic one, found from vapour density, from freezing-point depression, or nowadays from mass spectrometry, which weighs individual molecules directly. Divide the measured molar mass by the empirical formula mass of 30 and the quotient n is a whole number: n = 1 gives formaldehyde, n = 2 acetic acid, n = 6 glucose. Two closing points. First, even the molecular formula does not identify a substance uniquely — C₂H₆O is both ethanol and dimethyl ether, two liquids with completely different properties, and separating those needs structural evidence such as infrared or nuclear magnetic resonance. Each level of formula answers a narrower question than the last. Second, for an ionic compound the question does not arise: sodium chloride has no molecules, so NaCl is a ratio and there is nothing further to determine. (The third answer denies a conversion that is simply division by atomic masses, and the fourth uses masses as though they were counts — the exact mistake the division exists to prevent.)",
          hi: "पहले विश्लेषण चलाकर देखो, क्योंकि विद्यार्थी का आधा तर्क निर्दोष है। प्रतिशत द्रव्यमान हैं, और द्रव्यमानों की तुलना तत्वों के बीच हो नहीं सकती — एक ग्राम हाइड्रोजन में एक ग्राम कार्बन से बारह गुना परमाणु हैं। परमाणु-अनुपात पाने के लिए हर द्रव्यमान को उस तत्व के परमाणु द्रव्यमान से भाग दो, जो ग्राम को मोल में बदल देता है। कार्बन: 40/12 = 3.33. हाइड्रोजन: 6.7/1 = 6.7. ऑक्सीजन: 53.3/16 = 3.33. अब सबसे छोटे 3.33 से भाग दो, जिससे 1 : 2.01 : 1 मिलता है, यानी प्रायोगिक त्रुटि के भीतर 1 : 2 : 1. अतः मूलानुपाती सूत्र CH₂O है, और विद्यार्थी ने वह भाग ठीक किया है। भूल अंतिम क़दम है, और वह ऐसा क़दम है जो उठाया ही नहीं जा सकता। मूलानुपाती सूत्र अनुपात बताता है। वह कहता है हर दो हाइड्रोजन और एक ऑक्सीजन पर एक कार्बन, और इस पर चुप है कि अणु में उन इकाइयों में से कितनी हैं। फ़ॉर्मल्डिहाइड CH₂O है, मोलर द्रव्यमान 30. ऐसीटिक अम्ल C₂H₄O₂ है, मोलर द्रव्यमान 60 — इकाई का दुगुना। ग्लूकोज़ C₆H₁₂O₆ है, मोलर द्रव्यमान 180 — इकाई का छह गुना। तीनों ठीक 40, 6.7 और 53.3 प्रतिशत देते हैं, और कितना भी सावधान दहन-विश्लेषण उन्हें अलग नहीं बता सकता, क्योंकि नमूना जलाना अणु को नष्ट कर देता है और केवल यह बताता है कि उसमें कौन-से परमाणु थे। तीनों पदार्थ इससे अधिक भिन्न हो ही नहीं सकते: एक परिरक्षक गैस, सिरके का अम्ल और रक्त की शर्करा। तो मामला निपटाता क्या है? ऐसा माप जो पूरे अणु पर प्रतिक्रिया दे, उसके परमाणुओं पर नहीं। मोलर द्रव्यमान चिरसम्मत है, जो वाष्प घनत्व से, हिमांक अवनमन से, या आजकल द्रव्यमान स्पेक्ट्रममिति से मिलता है, जो अलग-अलग अणु सीधे तौलती है। नापे गए मोलर द्रव्यमान को मूलानुपाती सूत्र-द्रव्यमान 30 से भाग दो और भागफल n पूर्णांक है: n = 1 फ़ॉर्मल्डिहाइड देता है, n = 2 ऐसीटिक अम्ल, n = 6 ग्लूकोज़। दो समापन बिंदु। पहला, आण्विक सूत्र भी पदार्थ को अद्वितीय रूप से नहीं पहचानता — C₂H₆O एथेनॉल भी है और डाइमेथिल ईथर भी, बिलकुल भिन्न गुणों वाले दो द्रव, और उन्हें अलग करने के लिए संरचनात्मक प्रमाण चाहिए जैसे अवरक्त या नाभिकीय चुंबकीय अनुनाद। सूत्र का हर स्तर पिछले से संकरा प्रश्न उत्तरित करता है। दूसरा, आयनिक यौगिक के लिए प्रश्न उठता ही नहीं: सोडियम क्लोराइड में अणु हैं ही नहीं, अतः NaCl एक अनुपात है और तय करने को और कुछ नहीं। (तीसरा उत्तर ऐसे रूपांतरण को नकारता है जो बस परमाणु द्रव्यमानों से भाग है, और चौथा द्रव्यमानों को गिनती की तरह लगाता है — ठीक वही भूल जिसे रोकने के लिए वह भाग है।)",
          mr: "आधी विश्लेषण चालवून पाहा, कारण विद्यार्थ्याचा अर्धा युक्तिवाद निर्दोष आहे. शेकडे ही वस्तुमाने, आणि वस्तुमानांची तुलना मूलद्रव्यांमध्ये होऊच शकत नाही — एका ग्रॅम हायड्रोजनमध्ये एका ग्रॅम कार्बनहून बारापट अणू आहेत. अणु-गुणोत्तरे मिळवायला प्रत्येक वस्तुमान त्या मूलद्रव्याच्या अणुवस्तुमानाने भागा, जे ग्रॅमला मोलमध्ये बदलते. कार्बन: 40/12 = 3.33. हायड्रोजन: 6.7/1 = 6.7. ऑक्सिजन: 53.3/16 = 3.33. आता सर्वांत लहान 3.33 ने भागा, ज्यातून 1 : 2.01 : 1 मिळते, म्हणजे प्रायोगिक त्रुटीच्या आत 1 : 2 : 1. म्हणून मूलानुपाती सूत्र CH₂O, आणि विद्यार्थ्याने तो भाग बरोबर केला आहे. चूक शेवटचे पाऊल, आणि ते असे पाऊल जे उचलताच येत नाही. मूलानुपाती सूत्र गुणोत्तर सांगते. ते सांगते प्रत्येक दोन हायड्रोजन आणि एका ऑक्सिजनमागे एक कार्बन, आणि रेणूत त्या एककांपैकी किती आहेत याबद्दल गप्प. फॉर्मल्डिहाइड CH₂O, मोलर वस्तुमान 30. ॲसिटिक आम्ल C₂H₄O₂, मोलर वस्तुमान 60 — एककाच्या दुप्पट. ग्लुकोज C₆H₁₂O₆, मोलर वस्तुमान 180 — एककाच्या सहापट. तिन्ही नेमके 40, 6.7 आणि 53.3 टक्के देतात, आणि कितीही काळजीपूर्वक ज्वलन-विश्लेषण त्यांना वेगळे सांगू शकत नाही, कारण नमुना जाळणे रेणू नष्ट करते आणि केवळ त्यात कोणते अणू होते हेच सांगते. तिन्ही पदार्थ याहून अधिक वेगळे असूच शकत नाहीत: एक परिरक्षक वायू, व्हिनेगरचे आम्ल आणि रक्तातील साखर. मग प्रकरण निकाली काढते काय? असे माप जे अख्ख्या रेणूला प्रतिसाद देते, त्याच्या अणूंना नव्हे. मोलर वस्तुमान हे अभिजात, जे बाष्प घनतेवरून, गोठणबिंदू अवनमनावरून, वा आजकाल वस्तुमान वर्णपटमापनावरून मिळते, जे वेगवेगळे रेणू थेट तोलते. मोजलेले मोलर वस्तुमान मूलानुपाती सूत्र-वस्तुमान 30 ने भागा आणि भागाकार n हा पूर्णांक: n = 1 फॉर्मल्डिहाइड देतो, n = 2 ॲसिटिक आम्ल, n = 6 ग्लुकोज. दोन समारोपाचे मुद्दे. पहिला, रेणवीय सूत्रही पदार्थ अद्वितीयपणे ओळखत नाही — C₂H₆O हे इथेनॉलही आणि डायमिथाइल ईथरही, पूर्णपणे वेगळ्या गुणधर्मांचे दोन द्रव, आणि त्यांना वेगळे करायला संरचनात्मक पुरावा लागतो जसा अवरक्त वा केंद्रकीय चुंबकीय अनुनाद. सूत्राची प्रत्येक पातळी मागच्याहून अरुंद प्रश्नाचे उत्तर देते. दुसरा, आयनिक संयुगासाठी प्रश्न उद्भवतच नाही: सोडियम क्लोराइडमध्ये रेणूच नाहीत, म्हणून NaCl हे गुणोत्तर आणि ठरवायला आणखी काही नाही. (तिसरे उत्तर असे रूपांतर नाकारते जे फक्त अणुवस्तुमानांनी भागणे आहे, आणि चौथे वस्तुमाने मोजणीसारखी वापरते — नेमकी तीच चूक जी रोखण्यासाठी तो भागाकार आहे.)",
        },
      },
      /*H1C*/
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Structure of Atom                                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-structure-of-atom",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 2 — Structure of Atom",
      hi: "अध्याय 2 — परमाणु की संरचना",
      mr: "प्रकरण 2 — अणूची संरचना",
    },
    name: {
      en: "Structure of Atom",
      hi: "परमाणु की संरचना",
      mr: "अणूची संरचना",
    },
    summary: {
      en: "The chapter where classical physics runs out and has to be replaced. Light that knocks electrons out only above a threshold colour and not below it however bright, an atom whose electrons are allowed only certain orbits because anything else would have it collapse in an instant, a limit that forbids knowing where a particle is and how fast it is going at once, and an address system of four numbers that ends by explaining the shape of the periodic table.",
      hi: "वह अध्याय जहाँ चिरसम्मत भौतिकी चुक जाती है और उसे बदलना पड़ता है। वह प्रकाश जो केवल एक देहली-रंग के ऊपर इलेक्ट्रॉन निकालता है, उससे नीचे चाहे कितना ही तेज़ हो नहीं, वह परमाणु जिसके इलेक्ट्रॉनों को केवल कुछ ही कक्षाएँ मिलती हैं क्योंकि और कुछ उसे क्षण भर में ढहा देता, वह सीमा जो एक साथ यह जानने से मना करती है कि कण कहाँ है और कितना तेज़ जा रहा है, और चार संख्याओं की वह पता-प्रणाली जो अंत में आवर्त सारणी का आकार समझा देती है।",
      mr: "ते प्रकरण जिथे अभिजात भौतिकी संपते आणि तिला बदलावे लागते. तो प्रकाश जो केवळ एका उंबरठा-रंगाच्या वर इलेक्ट्रॉन बाहेर काढतो, त्याखाली कितीही तेजस्वी असो नाही, तो अणू ज्याच्या इलेक्ट्रॉनांना केवळ काहीच कक्षा मिळतात कारण दुसरे काहीही त्याला क्षणात कोसळवले असते, ती मर्यादा जी एकाच वेळी कण कुठे आहे आणि किती वेगाने जात आहे हे जाणण्यास मनाई करते, आणि चार संख्यांची ती पत्ता-प्रणाली जी शेवटी आवर्त सारणीचा आकार समजावते.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "photoelectric-effect",
        name: {
          en: "The photoelectric effect",
          hi: "प्रकाश-विद्युत् प्रभाव",
          mr: "प्रकाशविद्युत परिणाम",
        },
        kind: "evidence",
        prompt: {
          en: "A dim blue lamp ejects electrons from a metal the instant it is switched on, while a blinding red one ejects none however long it shines — which no theory of light as a wave can account for. Which observation is this?",
          hi: "मंद नीला दीपक चालू होते ही धातु से इलेक्ट्रॉन निकाल देता है, जबकि चकाचौंध लाल दीपक चाहे कितनी देर चमके एक भी नहीं निकालता — जिसका हिसाब प्रकाश को तरंग मानने वाला कोई सिद्धांत नहीं दे सकता। यह कौन-सा प्रेक्षण है?",
          mr: "मंद निळा दिवा लावताक्षणी धातूतून इलेक्ट्रॉन बाहेर काढतो, तर डोळे दिपवणारा लाल दिवा कितीही वेळ चमको एकही काढत नाही — ज्याचा हिशोब प्रकाशाला लहर मानणारा कोणताही सिद्धांत देऊ शकत नाही. हे कोणते निरीक्षण?",
        },
        statement: {
          en: "In the photoelectric effect electrons are ejected only above a threshold frequency, immediately and regardless of intensity, which shows light delivers its energy in discrete packets rather than continuously.",
          hi: "प्रकाश-विद्युत् प्रभाव में इलेक्ट्रॉन केवल एक देहली आवृत्ति के ऊपर निकलते हैं, तुरंत और तीव्रता की परवाह किए बिना, जो दिखाता है कि प्रकाश अपनी ऊर्जा सतत नहीं बल्कि असतत पुड़ियों में देता है।",
          mr: "प्रकाशविद्युत परिणामात इलेक्ट्रॉन केवळ एका उंबरठा वारंवारतेच्या वर बाहेर पडतात, लगेच आणि तीव्रतेची पर्वा न करता, जे दाखवते की प्रकाश आपली ऊर्जा सलग नव्हे तर विलग पुड्यांत देतो.",
        },
        detail: {
          en: "Einstein's equation says the ejected electron's maximum kinetic energy is hν minus the work function, so brighter light sends out more electrons and never faster ones.",
          hi: "आइंस्टीन का समीकरण कहता है कि निकले इलेक्ट्रॉन की अधिकतम गतिज ऊर्जा hν घटा कार्य-फलन है, अतः तेज़ प्रकाश अधिक इलेक्ट्रॉन भेजता है, कभी अधिक तेज़ नहीं।",
          mr: "आइनस्टाइनचे समीकरण सांगते की बाहेर पडलेल्या इलेक्ट्रॉनची कमाल गतिज ऊर्जा hν वजा कार्यफलन, म्हणून तेजस्वी प्रकाश अधिक इलेक्ट्रॉन पाठवतो, कधीही अधिक वेगवान नाही.",
        },
        extra: {
          en: "A wave theory predicts the opposite on every count — that any colour would work given time, that brighter light would give faster electrons, and that a dim source would need a measurable delay.",
          hi: "तरंग सिद्धांत हर बिंदु पर उलटा बताता है — कि समय मिले तो कोई भी रंग काम करेगा, कि तेज़ प्रकाश तेज़ इलेक्ट्रॉन देगा, और कि मंद स्रोत को मापने योग्य विलंब चाहिए।",
          mr: "लहर सिद्धांत प्रत्येक मुद्द्यावर उलटे सांगतो — की वेळ मिळाल्यास कोणताही रंग चालेल, की तेजस्वी प्रकाश वेगवान इलेक्ट्रॉन देईल, आणि की मंद स्रोताला मोजण्याजोगा विलंब लागेल.",
        },
        pair: {
          left: {
            en: "A dim blue lamp beating a blinding red one",
            hi: "चकाचौंध लाल को हराता मंद नीला दीपक",
            mr: "डोळे दिपवणाऱ्या लालला हरवणारा मंद निळा दिवा",
          },
          right: {
            en: "the photoelectric effect",
            hi: "प्रकाश-विद्युत् प्रभाव",
            mr: "प्रकाशविद्युत परिणाम",
          },
        },
      },
      {
        id: "bohrs-quantised-orbits",
        name: {
          en: "Bohr's quantised orbits",
          hi: "बोर की क्वांटित कक्षाएँ",
          mr: "बोरच्या पुंजित कक्षा",
        },
        kind: "model",
        prompt: {
          en: "Classical physics says a circling electron must radiate and spiral into the nucleus within a fraction of a nanosecond; the model that saved the atom simply declared certain orbits to be radiationless. Which model is this?",
          hi: "चिरसम्मत भौतिकी कहती है कि घूमता इलेक्ट्रॉन विकिरण करेगा और नैनोसेकंड के अंश में नाभिक में सर्पिल होकर गिर जाएगा; जिस निदर्श ने परमाणु बचाया उसने बस कुछ कक्षाओं को विकिरण-रहित घोषित कर दिया। यह कौन-सा निदर्श है?",
          mr: "अभिजात भौतिकी सांगते की फिरणारा इलेक्ट्रॉन प्रारण करेल आणि नॅनोसेकंदाच्या अंशात केंद्रकात सर्पिल होऊन पडेल; ज्या प्रतिरूपाने अणू वाचवला त्याने फक्त काही कक्षा प्रारणविरहित घोषित केल्या. हे कोणते प्रतिरूप?",
        },
        statement: {
          en: "Bohr's model allows an electron only orbits of quantised angular momentum, in which it does not radiate, and light is emitted or absorbed only when it jumps between them.",
          hi: "बोर का निदर्श इलेक्ट्रॉन को केवल क्वांटित कोणीय संवेग वाली कक्षाएँ देता है, जिनमें वह विकिरण नहीं करता, और प्रकाश केवल तब उत्सर्जित या अवशोषित होता है जब वह उनके बीच छलाँग लगाए।",
          mr: "बोरचे प्रतिरूप इलेक्ट्रॉनला केवळ पुंजित कोनीय संवेगाच्या कक्षा देते, ज्यांत तो प्रारण करत नाही, आणि प्रकाश केवळ तेव्हाच उत्सर्जित वा शोषला जातो जेव्हा तो त्यांच्यात उडी मारतो.",
        },
        detail: {
          en: "It explains the hydrogen spectrum's sharp lines exactly, because a jump between two fixed energies can only ever emit one definite frequency.",
          hi: "यह हाइड्रोजन वर्णक्रम की तीखी रेखाएँ ठीक-ठीक समझाता है, क्योंकि दो नियत ऊर्जाओं के बीच की छलाँग सदा एक ही निश्चित आवृत्ति उत्सर्जित कर सकती है।",
          mr: "हे हायड्रोजन वर्णपटाच्या तीक्ष्ण रेषा नेमक्या समजावते, कारण दोन ठरलेल्या ऊर्जांमधली उडी नेहमी एकच निश्चित वारंवारता उत्सर्जित करू शकते.",
        },
        extra: {
          en: "It fails for every atom with more than one electron, and it was replaced within fifteen years, but the idea that energy comes in fixed levels survived intact.",
          hi: "यह एक से अधिक इलेक्ट्रॉन वाले हर परमाणु पर विफल है, और पंद्रह वर्षों में उसकी जगह ले ली गई, पर यह विचार कि ऊर्जा नियत स्तरों में आती है ज्यों का त्यों बचा रहा।",
          mr: "हे एकाहून अधिक इलेक्ट्रॉन असलेल्या प्रत्येक अणूवर अपयशी, आणि पंधरा वर्षांत त्याची जागा घेतली गेली, पण ऊर्जा ठरलेल्या पातळ्यांत येते ही कल्पना जशीच्या तशी टिकली.",
        },
        pair: {
          left: {
            en: "Declared radiationless to stop the atom collapsing",
            hi: "परमाणु को ढहने से रोकने को विकिरण-रहित घोषित",
            mr: "अणू कोसळू नये म्हणून प्रारणविरहित घोषित",
          },
          right: {
            en: "Bohr's quantised orbits",
            hi: "बोर की क्वांटित कक्षाएँ",
            mr: "बोरच्या पुंजित कक्षा",
          },
        },
      },
      {
        id: "uncertainty-principle",
        name: {
          en: "Heisenberg's uncertainty principle",
          hi: "हाइज़नबर्ग का अनिश्चितता सिद्धांत",
          mr: "हायझेनबर्गचे अनिश्चितता तत्त्व",
        },
        kind: "model",
        prompt: {
          en: "Pin down an electron's position more precisely and its momentum becomes correspondingly less definite, and the limit is not a failing of the apparatus but a property of nature. Which principle is this?",
          hi: "इलेक्ट्रॉन की स्थिति जितनी अधिक परिशुद्धता से बाँधो उसका संवेग उतना ही कम निश्चित हो जाता है, और यह सीमा उपकरण की कमी नहीं बल्कि प्रकृति का गुण है। यह कौन-सा सिद्धांत है?",
          mr: "इलेक्ट्रॉनची स्थिती जितक्या अधिक अचूकतेने बांधाल तितका त्याचा संवेग कमी निश्चित होतो, आणि ही मर्यादा उपकरणाची उणीव नव्हे तर निसर्गाचा गुणधर्म. हे कोणते तत्त्व?",
        },
        statement: {
          en: "The uncertainty principle states that the product of the uncertainties in position and momentum can never be less than h/4π, so both cannot be known exactly at the same time.",
          hi: "अनिश्चितता सिद्धांत कहता है कि स्थिति और संवेग की अनिश्चितताओं का गुणनफल कभी h/4π से कम नहीं हो सकता, अतः दोनों एक साथ ठीक-ठीक नहीं जाने जा सकते।",
          mr: "अनिश्चितता तत्त्व सांगते की स्थिती आणि संवेग यांच्या अनिश्चिततांचा गुणाकार कधीही h/4π हून कमी असू शकत नाही, म्हणून दोन्ही एकाच वेळी नेमके जाणता येत नाहीत.",
        },
        detail: {
          en: "It destroys the idea of an orbit outright, since a path is precisely a statement of where a particle is and how fast at every instant.",
          hi: "यह कक्षा के विचार को सिरे से नष्ट कर देता है, क्योंकि पथ ठीक यही कथन है कि कण हर क्षण कहाँ है और कितना तेज़।",
          mr: "हे कक्षेची कल्पना मुळापासून नष्ट करते, कारण मार्ग म्हणजे नेमके हेच विधान की कण प्रत्येक क्षणी कुठे आहे आणि किती वेगात.",
        },
        extra: {
          en: "The limit is utterly negligible for anything visible — for a cricket ball it is smaller than the diameter of a nucleus — which is why the everyday world looks classical.",
          hi: "यह सीमा किसी भी दिखने वाली चीज़ के लिए नितांत नगण्य है — क्रिकेट गेंद के लिए वह नाभिक के व्यास से भी छोटी है — इसीलिए रोज़मर्रा का संसार चिरसम्मत दिखता है।",
          mr: "ही मर्यादा कोणत्याही दिसणाऱ्या गोष्टीसाठी पूर्णपणे नगण्य — क्रिकेट चेंडूसाठी ती केंद्रकाच्या व्यासाहूनही लहान — म्हणूनच रोजचे जग अभिजात दिसते.",
        },
        pair: {
          left: {
            en: "Not a failing of the apparatus",
            hi: "उपकरण की कमी नहीं",
            mr: "उपकरणाची उणीव नव्हे",
          },
          right: {
            en: "Heisenberg's uncertainty principle",
            hi: "हाइज़नबर्ग का अनिश्चितता सिद्धांत",
            mr: "हायझेनबर्गचे अनिश्चितता तत्त्व",
          },
        },
      },
      {
        id: "orbital-against-orbit",
        name: {
          en: "The orbital against the orbit",
          hi: "कक्षक बनाम कक्षा",
          mr: "कक्षक विरुद्ध कक्षा",
        },
        kind: "model",
        prompt: {
          en: "One is a path a particle follows and the other is a region in which it is ninety per cent likely to be found, drawn as a fuzzy cloud with no line anywhere in it. Which contrast is this?",
          hi: "एक वह पथ है जिस पर कण चलता है और दूसरा वह क्षेत्र जिसमें उसके मिलने की संभावना नब्बे प्रतिशत है, जो धुँधले बादल के रूप में खींचा जाता है जिसमें कहीं कोई रेखा नहीं। यह कौन-सा भेद है?",
          mr: "एक तो मार्ग ज्यावरून कण जातो आणि दुसरा तो प्रदेश ज्यात तो सापडण्याची शक्यता नव्वद टक्के, जो धूसर ढग म्हणून काढला जातो ज्यात कुठेही रेषा नाही. हा कोणता भेद?",
        },
        statement: {
          en: "An orbit is a definite path and an orbital is a region of high probability described by a wave function, so an orbital has a shape and a size but never a trajectory.",
          hi: "कक्षा निश्चित पथ है और कक्षक तरंग-फलन से वर्णित उच्च संभावना का क्षेत्र, अतः कक्षक का आकार और माप होता है, प्रक्षेप-पथ कभी नहीं।",
          mr: "कक्षा हा निश्चित मार्ग आणि कक्षक हा तरंग-फलनाने वर्णिलेला उच्च संभाव्यतेचा प्रदेश, म्हणून कक्षकाला आकार आणि माप असते, प्रक्षेप-मार्ग कधीच नाही.",
        },
        detail: {
          en: "The s orbital is spherical, the three p orbitals are dumb-bells along the three axes, and those shapes are what molecular geometry is ultimately built out of.",
          hi: "s कक्षक गोलाकार है, तीन p कक्षक तीनों अक्षों के अनुदिश डंबल हैं, और आण्विक ज्यामिति अंततः उन्हीं आकारों से बनती है।",
          mr: "s कक्षक गोलाकार, तीन p कक्षक तिन्ही अक्षांच्या दिशेने डंबेल, आणि रेणवीय भूमिती अखेर त्याच आकारांतून बनते.",
        },
        extra: {
          en: "A node inside an orbital is a surface where the probability is exactly zero, and an electron is found on both sides of it without ever being found on it — which has no classical picture at all.",
          hi: "कक्षक के भीतर निस्पंद वह पृष्ठ है जहाँ संभावना ठीक शून्य है, और इलेक्ट्रॉन उसके दोनों ओर मिलता है पर उस पर कभी नहीं — जिसका कोई चिरसम्मत चित्र है ही नहीं।",
          mr: "कक्षकाच्या आत निस्पंद हा तो पृष्ठभाग जिथे संभाव्यता नेमकी शून्य, आणि इलेक्ट्रॉन त्याच्या दोन्ही बाजूंना सापडतो पण त्याच्यावर कधीच नाही — ज्याचे कोणतेही अभिजात चित्र नाहीच.",
        },
        pair: {
          left: {
            en: "A cloud with no line anywhere in it",
            hi: "ऐसा बादल जिसमें कहीं कोई रेखा नहीं",
            mr: "असा ढग ज्यात कुठेही रेषा नाही",
          },
          right: {
            en: "the orbital against the orbit",
            hi: "कक्षक बनाम कक्षा",
            mr: "कक्षक विरुद्ध कक्षा",
          },
        },
      },
      {
        id: "four-quantum-numbers",
        name: {
          en: "The four quantum numbers",
          hi: "चार क्वांटम संख्याएँ",
          mr: "चार पुंज संख्या",
        },
        kind: "bookkeeping",
        prompt: {
          en: "A shell, a subshell within it, an orientation within that, and a spin — four labels that between them give every electron in an atom an address that no other electron shares. What are these?",
          hi: "एक कोश, उसके भीतर एक उपकोश, उसके भीतर एक अभिविन्यास, और एक चक्रण — चार लेबल जो मिलकर परमाणु के हर इलेक्ट्रॉन को ऐसा पता देते हैं जो कोई दूसरा इलेक्ट्रॉन साझा नहीं करता। ये क्या हैं?",
          mr: "एक कवच, त्याच्या आत एक उपकवच, त्याच्या आत एक दिशा, आणि एक परिवलन — चार शिक्के जे मिळून अणूतील प्रत्येक इलेक्ट्रॉनला असा पत्ता देतात जो दुसरा कोणताही इलेक्ट्रॉन वाटून घेत नाही. ही काय?",
        },
        statement: {
          en: "The four quantum numbers n, l, m and s fix the shell, the subshell's shape, the orbital's orientation and the spin, and no two electrons in an atom may have all four the same.",
          hi: "चार क्वांटम संख्याएँ n, l, m और s कोश, उपकोश का आकार, कक्षक का अभिविन्यास और चक्रण तय करती हैं, और परमाणु के किन्हीं दो इलेक्ट्रॉनों की चारों समान नहीं हो सकतीं।",
          mr: "चार पुंज संख्या n, l, m आणि s कवच, उपकवचाचा आकार, कक्षकाची दिशा आणि परिवलन ठरवतात, आणि अणूतील कोणत्याही दोन इलेक्ट्रॉनांच्या चारही सारख्या असू शकत नाहीत.",
        },
        detail: {
          en: "The permitted values are nested: l runs from 0 to n − 1, m from −l to +l, and s takes one of two values, which is what makes each shell hold exactly 2n² electrons.",
          hi: "अनुमत मान एक-दूसरे में समाए हैं: l 0 से n − 1 तक, m −l से +l तक, और s दो मानों में से एक लेता है, और इसी से हर कोश ठीक 2n² इलेक्ट्रॉन रखता है।",
          mr: "परवानगी असलेली मूल्ये एकमेकांत गुंफलेली: l हा 0 ते n − 1, m हा −l ते +l, आणि s दोन मूल्यांपैकी एक घेतो, आणि यामुळेच प्रत्येक कवच नेमके 2n² इलेक्ट्रॉन ठेवते.",
        },
        extra: {
          en: "That last count is why the periods of the periodic table are 2, 8, 8, 18, 18, 32 long — the table's shape is a consequence of the permitted addresses and not of chemistry.",
          hi: "वही अंतिम गिनती है जिससे आवर्त सारणी के आवर्त 2, 8, 8, 18, 18, 32 लंबे हैं — सारणी का आकार अनुमत पतों का परिणाम है, रसायन का नहीं।",
          mr: "तीच शेवटची मोजणी ज्यामुळे आवर्त सारणीचे आवर्त 2, 8, 8, 18, 18, 32 लांब — सारणीचा आकार परवानगी असलेल्या पत्त्यांचा परिणाम, रसायनाचा नव्हे.",
        },
        pair: {
          left: {
            en: "An address no other electron shares",
            hi: "ऐसा पता जो कोई दूसरा इलेक्ट्रॉन साझा नहीं करता",
            mr: "असा पत्ता जो दुसरा कोणताही इलेक्ट्रॉन वाटून घेत नाही",
          },
          right: {
            en: "the four quantum numbers",
            hi: "चार क्वांटम संख्याएँ",
            mr: "चार पुंज संख्या",
          },
        },
      },
      {
        id: "aufbau-order",
        name: {
          en: "The Aufbau filling order",
          hi: "ऑफ़बाउ भरण-क्रम",
          mr: "ऑफबाऊ भरण-क्रम",
        },
        kind: "bookkeeping",
        prompt: {
          en: "The 4s subshell is filled before the 3d one although its shell number is larger, because what decides the order is not n alone but the sum n + l. Which rule is this?",
          hi: "4s उपकोश 3d से पहले भरा जाता है यद्यपि उसका कोश-अंक बड़ा है, क्योंकि क्रम अकेला n नहीं बल्कि योग n + l तय करता है। यह कौन-सा नियम है?",
          mr: "4s उपकवच 3d च्या आधी भरले जाते जरी त्याचा कवच-अंक मोठा असला तरी, कारण क्रम एकटा n नव्हे तर बेरीज n + l ठरवते. हा कोणता नियम?",
        },
        statement: {
          en: "The Aufbau principle fills subshells in order of increasing n + l, and where two are equal the one with the smaller n goes first, so 4s precedes 3d.",
          hi: "ऑफ़बाउ सिद्धांत उपकोशों को बढ़ते n + l के क्रम में भरता है, और जहाँ दो बराबर हों वहाँ छोटा n वाला पहले जाता है, अतः 4s, 3d से पहले आता है।",
          mr: "ऑफबाऊ तत्त्व उपकवचे वाढत्या n + l च्या क्रमाने भरते, आणि जिथे दोन समान असतील तिथे लहान n वाले आधी जाते, म्हणून 4s हे 3d च्या आधी येते.",
        },
        detail: {
          en: "Two companion rules complete it: Pauli's, that no orbital may hold more than two electrons and those must have opposite spins, and Hund's, that a set of equal-energy orbitals fills singly before any pairs up.",
          hi: "दो साथी नियम उसे पूरा करते हैं: पॉली का, कि कोई कक्षक दो से अधिक इलेक्ट्रॉन नहीं रख सकता और उनके चक्रण विपरीत होने चाहिए, और हुंड का, कि समान ऊर्जा वाले कक्षकों का समुच्चय किसी में जोड़ी बनने से पहले एक-एक करके भरता है।",
          mr: "दोन सोबतीचे नियम ते पूर्ण करतात: पौलीचा, की कोणतेही कक्षक दोनहून अधिक इलेक्ट्रॉन ठेवू शकत नाही आणि त्यांची परिवलने विरुद्ध असावीत, आणि हुंडचा, की समान ऊर्जेच्या कक्षकांचा संच कोणत्यातही जोडी होण्याआधी एकेक करून भरतो.",
        },
        extra: {
          en: "The order is a good rule and not a law: chromium and copper both break it to gain the extra stability of a half-filled or filled d subshell.",
          hi: "यह क्रम अच्छा नियम है, विधान नहीं: क्रोमियम और कॉपर दोनों उसे तोड़कर अर्ध-भरे या भरे d उपकोश की अतिरिक्त स्थिरता पा लेते हैं।",
          mr: "हा क्रम चांगला नियम आहे, कायदा नव्हे: क्रोमियम आणि तांबे दोघेही तो मोडून अर्ध-भरलेल्या वा भरलेल्या d उपकवचाची जादा स्थिरता मिळवतात.",
        },
        pair: {
          left: {
            en: "4s before 3d, though four exceeds three",
            hi: "3d से पहले 4s, यद्यपि चार तीन से बड़ा है",
            mr: "3d च्या आधी 4s, जरी चार तीनहून मोठा असला तरी",
          },
          right: {
            en: "the Aufbau filling order",
            hi: "ऑफ़बाउ भरण-क्रम",
            mr: "ऑफबाऊ भरण-क्रम",
          },
        },
      },
      /*F2C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A metal has a work function of 2 eV. It is lit first by very bright red light of photon energy 1.8 eV and then by a faint ultraviolet lamp of photon energy 5 eV. A student expects the bright lamp to eject electrons and the faint one not to. Explain what actually happens and why.",
          hi: "किसी धातु का कार्य-फलन 2 eV है। उस पर पहले 1.8 eV फ़ोटॉन-ऊर्जा का बहुत तेज़ लाल प्रकाश डाला जाता है और फिर 5 eV फ़ोटॉन-ऊर्जा का मंद पराबैंगनी दीपक। एक विद्यार्थी अपेक्षा करता है कि तेज़ दीपक इलेक्ट्रॉन निकालेगा और मंद नहीं। समझाओ वस्तुतः क्या होता है और क्यों।",
          mr: "एका धातूचे कार्यफलन 2 eV आहे. त्यावर आधी 1.8 eV फोटॉन-ऊर्जेचा फार तेजस्वी लाल प्रकाश टाकला जातो आणि मग 5 eV फोटॉन-ऊर्जेचा मंद अतिनील दिवा. एक विद्यार्थी अपेक्षा करतो की तेजस्वी दिवा इलेक्ट्रॉन काढेल आणि मंद नाही. प्रत्यक्षात काय घडते आणि का ते समजावा.",
        },
        choices: [
          {
            en: "Exactly the reverse. The red light ejects nothing however bright, because each photon carries only 1.8 eV and one photon frees one electron — 1.8 is below the 2 eV needed, and turning up the brightness merely sends more photons that are each individually too weak. The ultraviolet lamp ejects electrons immediately, each with up to 5 − 2 = 3 eV of kinetic energy, and a fainter lamp gives fewer such electrons but never slower ones",
            hi: "ठीक उलटा। लाल प्रकाश चाहे कितना ही तेज़ हो कुछ नहीं निकालता, क्योंकि हर फ़ोटॉन केवल 1.8 eV ढोता है और एक फ़ोटॉन एक इलेक्ट्रॉन मुक्त करता है — 1.8 चाहिए 2 eV से कम है, और तीव्रता बढ़ाना बस अधिक फ़ोटॉन भेजता है जो हर एक अकेले-अकेले बहुत दुर्बल हैं। पराबैंगनी दीपक तुरंत इलेक्ट्रॉन निकालता है, हर एक 5 − 2 = 3 eV तक गतिज ऊर्जा के साथ, और मंद दीपक ऐसे इलेक्ट्रॉन कम देता है, कभी धीमे नहीं",
            mr: "नेमके उलटे. लाल प्रकाश कितीही तेजस्वी असो काहीही काढत नाही, कारण प्रत्येक फोटॉन केवळ 1.8 eV वाहतो आणि एक फोटॉन एक इलेक्ट्रॉन मुक्त करतो — 1.8 हे लागणाऱ्या 2 eV हून कमी, आणि तेजस्वीपणा वाढवणे फक्त अधिक फोटॉन पाठवते जे प्रत्येक स्वतंत्रपणे फारच दुर्बल. अतिनील दिवा लगेच इलेक्ट्रॉन काढतो, प्रत्येक 5 − 2 = 3 eV पर्यंत गतिज ऊर्जेसह, आणि मंद दिवा असे इलेक्ट्रॉन कमी देतो, कधीही सावकाश नाही",
          },
          {
            en: "The student is right: brightness is what supplies the energy, so a sufficiently bright lamp of any colour will eject electrons",
            hi: "विद्यार्थी सही है: ऊर्जा तीव्रता ही देती है, अतः किसी भी रंग का पर्याप्त तेज़ दीपक इलेक्ट्रॉन निकालेगा",
            mr: "विद्यार्थी बरोबर: ऊर्जा तेजस्वीपणाच पुरवतो, म्हणून कोणत्याही रंगाचा पुरेसा तेजस्वी दिवा इलेक्ट्रॉन काढेल",
          },
          {
            en: "Both lamps eject electrons, but the red one takes longer because its photons must accumulate until 2 eV has been delivered",
            hi: "दोनों दीपक इलेक्ट्रॉन निकालते हैं, पर लाल को अधिक समय लगता है क्योंकि उसके फ़ोटॉनों को 2 eV पहुँचने तक जमा होना पड़ता है",
            mr: "दोन्ही दिवे इलेक्ट्रॉन काढतात, पण लालला अधिक वेळ लागतो कारण त्याच्या फोटॉनांना 2 eV पोहोचेपर्यंत साचावे लागते",
          },
          {
            en: "Neither ejects electrons, since 2 eV is far too large a barrier for visible or ultraviolet light to overcome",
            hi: "कोई भी इलेक्ट्रॉन नहीं निकालता, क्योंकि 2 eV ऐसी बाधा है जिसे दृश्य या पराबैंगनी प्रकाश पार नहीं कर सकता",
            mr: "कोणीही इलेक्ट्रॉन काढत नाही, कारण 2 eV ही अशी अडचण जी दृश्य वा अतिनील प्रकाश ओलांडू शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The whole result turns on one idea: light delivers its energy in indivisible packets, and an electron deals with one packet at a time. Red lamp, 1.8 eV per photon. The metal holds its electrons with a binding energy of 2 eV, so an electron needs at least 2 eV in a single delivery to escape. Every red photon arrives 0.2 eV short. Making the lamp brighter increases the NUMBER of photons per second and not the energy of any one of them, so a floodlight of red delivers vast numbers of individually inadequate packets and not one electron leaves. Ultraviolet lamp, 5 eV per photon. Every photon that is absorbed frees an electron and hands it the surplus: KE_max = hν − φ = 5 − 2 = 3 eV. This happens the instant the lamp is switched on, with no measurable delay, and dimming the lamp reduces the number of electrons per second while leaving every individual electron's energy at exactly 3 eV. That last point is the sharpest test of the whole picture, and it is what the third option gets wrong. A wave theory says energy arrives continuously and spreads over the surface, so a faint source should need a warm-up period while an electron accumulates enough — for a really dim lamp, calculation gives delays of minutes or hours. No such delay has ever been observed; emission begins within nanoseconds at any intensity above zero. Energy simply does not accumulate, because the packet is indivisible: an electron either absorbs a whole photon or none. Two consequences are worth carrying. First, the threshold frequency is a property of the metal and identifies it: caesium releases electrons in visible light and needs only about 2 eV, while zinc needs ultraviolet at around 4 eV, which is why a caesium photocell responds to a light beam and a zinc one does not. Second, the graph of maximum kinetic energy against frequency is a straight line whose slope is Planck's constant and whose intercept is the work function — and Millikan measured h that way, having set out to disprove Einstein's equation and ending by confirming it to one per cent. (The fourth answer treats 2 eV as a large barrier when it is a modest one, comfortably within the range of visible light.)",
          hi: "पूरा परिणाम एक विचार पर टिका है: प्रकाश अपनी ऊर्जा अविभाज्य पुड़ियों में देता है, और इलेक्ट्रॉन एक बार में एक पुड़िया से निपटता है। लाल दीपक, 1.8 eV प्रति फ़ोटॉन। धातु अपने इलेक्ट्रॉनों को 2 eV बंधन-ऊर्जा से थामे है, अतः इलेक्ट्रॉन को भागने के लिए एक ही डिलीवरी में कम से कम 2 eV चाहिए। हर लाल फ़ोटॉन 0.2 eV कम पड़ता है। दीपक तेज़ करने से प्रति सेकंड फ़ोटॉनों की संख्या बढ़ती है, उनमें से किसी एक की ऊर्जा नहीं, अतः लाल का सर्चलाइट अकेले-अकेले अपर्याप्त पुड़ियों की विशाल संख्या देता है और एक भी इलेक्ट्रॉन नहीं निकलता। पराबैंगनी दीपक, 5 eV प्रति फ़ोटॉन। जो भी फ़ोटॉन अवशोषित होता है वह एक इलेक्ट्रॉन मुक्त करता है और उसे बचा हुआ सौंप देता है: KE_अधिकतम = hν − φ = 5 − 2 = 3 eV. यह दीपक चालू होते ही होता है, बिना किसी मापने योग्य विलंब के, और दीपक मंद करने से प्रति सेकंड इलेक्ट्रॉनों की संख्या घटती है जबकि हर अलग इलेक्ट्रॉन की ऊर्जा ठीक 3 eV बनी रहती है। वही अंतिम बिंदु पूरे चित्र की सबसे तीखी परीक्षा है, और वही तीसरा विकल्प ग़लत करता है। तरंग सिद्धांत कहता है ऊर्जा सतत आती है और सतह पर फैलती है, अतः मंद स्रोत को गरमाने का समय चाहिए जब तक इलेक्ट्रॉन पर्याप्त जमा न कर ले — सचमुच मंद दीपक के लिए गणना मिनटों या घंटों का विलंब देती है। ऐसा कोई विलंब कभी देखा नहीं गया; शून्य से ऊपर किसी भी तीव्रता पर उत्सर्जन नैनोसेकंडों में शुरू हो जाता है। ऊर्जा जमा होती ही नहीं, क्योंकि पुड़िया अविभाज्य है: इलेक्ट्रॉन या तो पूरा फ़ोटॉन सोखता है या एक भी नहीं। दो परिणाम ले जाने योग्य हैं। पहला, देहली आवृत्ति धातु का गुण है और उसे पहचानती है: सीज़ियम दृश्य प्रकाश में इलेक्ट्रॉन छोड़ता है और उसे केवल लगभग 2 eV चाहिए, जबकि ज़िंक को लगभग 4 eV का पराबैंगनी चाहिए, इसीलिए सीज़ियम की प्रकाश-सेल प्रकाश-पुंज पर प्रतिक्रिया देती है और ज़िंक की नहीं। दूसरा, आवृत्ति बनाम अधिकतम गतिज ऊर्जा का आलेख सीधी रेखा है जिसकी ढाल प्लांक स्थिरांक है और अंतःखंड कार्य-फलन — और मिलिकन ने h उसी तरह नापा, जो आइंस्टीन के समीकरण को झुठलाने निकले थे और अंत में उसे एक प्रतिशत तक पुष्ट कर बैठे। (चौथा उत्तर 2 eV को बड़ी बाधा मान लेता है जबकि वह मामूली है, दृश्य प्रकाश की परास के भीतर आराम से।)",
          mr: "अख्खा निकाल एका कल्पनेवर टेकलेला: प्रकाश आपली ऊर्जा अविभाज्य पुड्यांत देतो, आणि इलेक्ट्रॉन एका वेळी एका पुडीशी व्यवहार करतो. लाल दिवा, 1.8 eV प्रति फोटॉन. धातू आपले इलेक्ट्रॉन 2 eV बंधन-ऊर्जेने धरून आहे, म्हणून इलेक्ट्रॉनला सुटायला एकाच वितरणात किमान 2 eV लागतात. प्रत्येक लाल फोटॉन 0.2 eV ने कमी पडतो. दिवा तेजस्वी केल्याने प्रति सेकंद फोटॉनांची संख्या वाढते, त्यांपैकी कोणा एकाची ऊर्जा नाही, म्हणून लालचा झोतदिवा स्वतंत्रपणे अपुऱ्या पुड्यांची प्रचंड संख्या देतो आणि एकही इलेक्ट्रॉन निघत नाही. अतिनील दिवा, 5 eV प्रति फोटॉन. जो फोटॉन शोषला जातो तो एक इलेक्ट्रॉन मुक्त करतो आणि त्याला उरलेले सोपवतो: KE_कमाल = hν − φ = 5 − 2 = 3 eV. हे दिवा लावताक्षणी घडते, कोणत्याही मोजण्याजोग्या विलंबाशिवाय, आणि दिवा मंद केल्याने प्रति सेकंद इलेक्ट्रॉनांची संख्या घटते तर प्रत्येक वेगळ्या इलेक्ट्रॉनची ऊर्जा नेमकी 3 eV राहते. तोच शेवटचा मुद्दा अख्ख्या चित्राची सर्वांत तीक्ष्ण परीक्षा, आणि तेच तिसरा पर्याय चुकीचे करतो. लहर सिद्धांत सांगतो की ऊर्जा सलग येते आणि पृष्ठभागावर पसरते, म्हणून मंद स्रोताला तापण्याचा काळ लागेल जोवर इलेक्ट्रॉन पुरेसे साठवत नाही — खरोखर मंद दिव्यासाठी गणना मिनिटांचे वा तासांचे विलंब देते. असा कोणताही विलंब कधीच पाहिला गेला नाही; शून्याहून अधिक कोणत्याही तीव्रतेवर उत्सर्जन नॅनोसेकंदांत सुरू होते. ऊर्जा साचतच नाही, कारण पुडी अविभाज्य: इलेक्ट्रॉन एकतर अख्खा फोटॉन शोषतो वा एकही नाही. दोन परिणाम नेण्याजोगे. पहिला, उंबरठा वारंवारता हा धातूचा गुणधर्म आणि तिला ओळखते: सीझियम दृश्य प्रकाशात इलेक्ट्रॉन सोडते आणि तिला केवळ सुमारे 2 eV लागतात, तर जस्ताला सुमारे 4 eV चा अतिनील लागतो, म्हणूनच सीझियमचा प्रकाशघट प्रकाशझोताला प्रतिसाद देतो आणि जस्ताचा नाही. दुसरा, वारंवारता विरुद्ध कमाल गतिज ऊर्जेचा आलेख ही सरळ रेषा जिचा उतार प्लांक स्थिरांक आणि अंतःखंड कार्यफलन — आणि मिलिकनने h तसाच मोजला, जो आइनस्टाइनचे समीकरण खोडायला निघाला होता आणि शेवटी ते एक टक्क्यापर्यंत सिद्ध करून बसला. (चौथे उत्तर 2 eV ला मोठी अडचण मानते तर ती माफक आहे, दृश्य प्रकाशाच्या पल्ल्यात आरामात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student draws the electron in a hydrogen atom as a small ball travelling round a circular orbit of radius 0.53 Å, as in Bohr's model. Explain what is right and what is wrong about this picture, and what replaced it.",
          hi: "एक विद्यार्थी हाइड्रोजन परमाणु के इलेक्ट्रॉन को 0.53 Å त्रिज्या की वृत्तीय कक्षा पर चलती छोटी गेंद के रूप में खींचता है, जैसा बोर के निदर्श में है। समझाओ इस चित्र में सही क्या है और ग़लत क्या, और उसकी जगह क्या आया।",
          mr: "एक विद्यार्थी हायड्रोजन अणूतील इलेक्ट्रॉन 0.53 Å त्रिज्येच्या वर्तुळाकार कक्षेवर जाणारा लहान चेंडू म्हणून काढतो, जसा बोरच्या प्रतिरूपात आहे. या चित्रात बरोबर काय आणि चूक काय ते समजावा, आणि त्याची जागा कशाने घेतली ते सांगा.",
        },
        choices: [
          {
            en: "The energy levels and the 0.53 Å scale are right; the orbit is wrong. Speaking of a path requires knowing position and momentum together at every instant, which the uncertainty principle forbids. What replaced it is the orbital: a wave function whose square gives the probability of finding the electron at each point, drawn as a spherical cloud densest at about 0.53 Å. The radius survives as the most probable distance rather than as a fixed one, and the quantised energies survive intact",
            hi: "ऊर्जा-स्तर और 0.53 Å का पैमाना सही हैं; कक्षा ग़लत है। पथ की बात करने के लिए हर क्षण स्थिति और संवेग एक साथ जानने होंगे, जिसे अनिश्चितता सिद्धांत मना करता है। उसकी जगह आया कक्षक: वह तरंग-फलन जिसका वर्ग हर बिंदु पर इलेक्ट्रॉन मिलने की संभावना देता है, जो लगभग 0.53 Å पर सबसे घने गोलाकार बादल के रूप में खींचा जाता है। त्रिज्या नियत दूरी के बजाय सर्वाधिक संभावित दूरी के रूप में बची रहती है, और क्वांटित ऊर्जाएँ ज्यों की त्यों",
            mr: "ऊर्जा-पातळ्या आणि 0.53 Å चे माप बरोबर; कक्षा चूक. मार्गाबद्दल बोलायला प्रत्येक क्षणी स्थिती आणि संवेग एकत्र जाणावे लागतील, ज्याला अनिश्चितता तत्त्व मनाई करते. त्याची जागा घेतली कक्षकाने: ते तरंग-फलन ज्याचा वर्ग प्रत्येक बिंदूवर इलेक्ट्रॉन सापडण्याची संभाव्यता देतो, जो सुमारे 0.53 Å वर सर्वांत दाट अशा गोलाकार ढगाच्या रूपात काढला जातो. त्रिज्या ठरलेल्या अंतराऐवजी सर्वांत संभाव्य अंतर म्हणून टिकते, आणि पुंजित ऊर्जा जशाच्या तशा",
          },
          {
            en: "The picture is entirely correct, since Bohr's model gives the hydrogen spectrum exactly right and a correct prediction settles the matter",
            hi: "चित्र पूरी तरह सही है, क्योंकि बोर का निदर्श हाइड्रोजन वर्णक्रम ठीक-ठीक देता है और सही भविष्यवाणी मामला निपटा देती है",
            mr: "चित्र पूर्णपणे बरोबर, कारण बोरचे प्रतिरूप हायड्रोजन वर्णपट नेमका बरोबर देते आणि बरोबर भाकीत प्रकरण निकाली काढते",
          },
          {
            en: "The picture is entirely wrong, including the energy levels, which the modern theory abandoned along with the orbits",
            hi: "चित्र पूरी तरह ग़लत है, ऊर्जा-स्तर भी, जिन्हें आधुनिक सिद्धांत ने कक्षाओं के साथ छोड़ दिया",
            mr: "चित्र पूर्णपणे चूक, ऊर्जा-पातळ्यांसह, ज्या आधुनिक सिद्धांताने कक्षांसोबत सोडून दिल्या",
          },
          {
            en: "The orbit is right but the radius is wrong, since the electron is actually found at a fixed distance far smaller than 0.53 Å",
            hi: "कक्षा सही है पर त्रिज्या ग़लत, क्योंकि इलेक्ट्रॉन वस्तुतः 0.53 Å से कहीं छोटी नियत दूरी पर मिलता है",
            mr: "कक्षा बरोबर पण त्रिज्या चूक, कारण इलेक्ट्रॉन प्रत्यक्षात 0.53 Å हून कितीतरी लहान ठरलेल्या अंतरावर सापडतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Superseded models are rarely wrong about everything, and sorting the surviving parts from the discarded ones is most of what understanding a replacement means. What Bohr got right, and what nobody has taken back. First, that the atom's energies are quantised — the electron can hold certain definite energies and nothing in between, which is why the hydrogen spectrum is a set of sharp lines rather than a continuous smear. Second, that light is emitted when the electron moves between two of those levels, with the photon's energy exactly the difference. Third, the scale: 0.53 Å is still the right size for a hydrogen atom, and it still appears in the modern theory. What he got wrong is the orbit. An orbit is a trajectory — a statement of exactly where the electron is and how fast at every instant. Heisenberg's principle forbids that: Δx·Δp cannot be less than h/4π, and for an electron confined to a region the size of an atom the momentum uncertainty is comparable to the momentum itself. There is no path to draw, and the failure is not that we cannot measure it but that the quantity does not exist to be measured. What replaced it is the orbital. Schrödinger's equation gives a wave function ψ for the electron, and |ψ|² at each point is the probability density of finding it there. For the ground state of hydrogen that cloud is spherical, densest near the nucleus, and thinning outwards with no boundary at all — an atom has no edge, only a distance beyond which the electron is very unlikely to be. The 0.53 Å survives as the radius at which the electron is MOST LIKELY to be found, which is why the number is the same and its meaning is not. There is a lesson about theories here, and the second option gets it backwards. A correct prediction does not establish a model. Bohr's model predicts the hydrogen spectrum beautifully and fails completely for helium, the very next element, because its central assumption — one electron on a definite path — cannot be extended. A model that works for one case and nowhere else has usually captured something real inside a wrong frame, and the job is to find which part was the real one. Here it was quantisation, and it survived into a theory that abandoned everything else Bohr had assumed. (The third answer throws away the energy levels, which are the best-confirmed feature of atomic physics, and the fourth keeps the trajectory while adjusting a number, which fixes nothing at all.)",
          hi: "जिन निदर्शों की जगह ले ली जाती है वे शायद ही हर बात पर ग़लत होते हैं, और बचे हिस्सों को फेंके हिस्सों से छाँटना ही किसी प्रतिस्थापन को समझने का अधिकांश अर्थ है। बोर ने क्या सही किया, और किसे किसी ने वापस नहीं लिया। पहला, कि परमाणु की ऊर्जाएँ क्वांटित हैं — इलेक्ट्रॉन कुछ निश्चित ऊर्जाएँ रख सकता है और बीच में कुछ नहीं, इसीलिए हाइड्रोजन वर्णक्रम सतत धब्बा नहीं बल्कि तीखी रेखाओं का समुच्चय है। दूसरा, कि प्रकाश तब उत्सर्जित होता है जब इलेक्ट्रॉन उन दो स्तरों के बीच जाए, और फ़ोटॉन की ऊर्जा ठीक अंतर हो। तीसरा, पैमाना: 0.53 Å आज भी हाइड्रोजन परमाणु का सही माप है, और वह आधुनिक सिद्धांत में भी आता है। ग़लत उसने कक्षा की। कक्षा एक प्रक्षेप-पथ है — यह कथन कि इलेक्ट्रॉन हर क्षण ठीक कहाँ है और कितना तेज़। हाइज़नबर्ग का सिद्धांत इसे मना करता है: Δx·Δp, h/4π से कम नहीं हो सकता, और परमाणु के आकार के क्षेत्र में बँधे इलेक्ट्रॉन के लिए संवेग की अनिश्चितता स्वयं संवेग के तुल्य है। खींचने को कोई पथ है ही नहीं, और विफलता यह नहीं कि हम उसे नाप नहीं सकते बल्कि यह कि नापने को वह राशि है ही नहीं। उसकी जगह आया कक्षक। श्रोडिंगर का समीकरण इलेक्ट्रॉन के लिए तरंग-फलन ψ देता है, और हर बिंदु पर |ψ|² उसे वहाँ मिलने का संभावना-घनत्व है। हाइड्रोजन की मूल अवस्था के लिए वह बादल गोलाकार है, नाभिक के पास सबसे घना, और बाहर की ओर पतला होता जाता है बिना किसी सीमा के — परमाणु का कोई किनारा नहीं, केवल वह दूरी जिसके आगे इलेक्ट्रॉन मिलना बहुत असंभाव्य है। 0.53 Å उस त्रिज्या के रूप में बचा रहता है जिस पर इलेक्ट्रॉन मिलना सर्वाधिक संभावित है, इसीलिए संख्या वही है और उसका अर्थ नहीं। यहाँ सिद्धांतों के बारे में एक सबक़ है, और दूसरा विकल्प उसे उलटा कर देता है। सही भविष्यवाणी निदर्श को स्थापित नहीं करती। बोर का निदर्श हाइड्रोजन वर्णक्रम सुंदर ढंग से बताता है और ठीक अगले तत्व हीलियम पर पूरी तरह विफल हो जाता है, क्योंकि उसकी केंद्रीय मान्यता — निश्चित पथ पर एक इलेक्ट्रॉन — बढ़ाई नहीं जा सकती। जो निदर्श एक स्थिति पर चले और कहीं नहीं, उसने प्रायः ग़लत ढाँचे के भीतर कुछ असली पकड़ा है, और काम यह खोजना है कि असली भाग कौन-सा था। यहाँ वह क्वांटीकरण था, और वह ऐसे सिद्धांत में बचा रहा जिसने बोर की मानी हर दूसरी बात छोड़ दी। (तीसरा उत्तर ऊर्जा-स्तर फेंक देता है, जो परमाणु भौतिकी की सबसे पुष्ट विशेषता हैं, और चौथा प्रक्षेप-पथ रखते हुए एक संख्या सुधारता है, जो कुछ भी ठीक नहीं करता।)",
          mr: "ज्या प्रतिरूपांची जागा घेतली जाते ती क्वचितच प्रत्येक बाबतीत चुकीची असतात, आणि टिकलेले भाग टाकून दिलेल्यांपासून वेगळे करणे हाच एखादे प्रतिस्थापन समजण्याचा बहुतांश अर्थ. बोरने काय बरोबर केले, आणि कोणते कोणीही परत घेतले नाही. पहिले, की अणूच्या ऊर्जा पुंजित आहेत — इलेक्ट्रॉन काही निश्चित ऊर्जा ठेवू शकतो आणि मधले काहीही नाही, म्हणूनच हायड्रोजन वर्णपट सलग डाग नव्हे तर तीक्ष्ण रेषांचा संच. दुसरे, की प्रकाश तेव्हा उत्सर्जित होतो जेव्हा इलेक्ट्रॉन त्या दोन पातळ्यांमध्ये जातो, आणि फोटॉनची ऊर्जा नेमकी फरक. तिसरे, माप: 0.53 Å आजही हायड्रोजन अणूचे बरोबर माप, आणि ते आधुनिक सिद्धांतातही येते. चूक त्याने कक्षेची केली. कक्षा हा प्रक्षेप-मार्ग — हे विधान की इलेक्ट्रॉन प्रत्येक क्षणी नेमका कुठे आणि किती वेगात. हायझेनबर्गचे तत्त्व याला मनाई करते: Δx·Δp हे h/4π हून कमी असू शकत नाही, आणि अणूच्या आकाराच्या प्रदेशात बांधलेल्या इलेक्ट्रॉनसाठी संवेगाची अनिश्चितता स्वतः संवेगाइतकीच. काढायला कोणताही मार्ग नाहीच, आणि अपयश हे नाही की आपण तो मोजू शकत नाही तर हे की मोजायला ती राशीच नाही. त्याची जागा घेतली कक्षकाने. श्रोडिंगरचे समीकरण इलेक्ट्रॉनसाठी तरंग-फलन ψ देते, आणि प्रत्येक बिंदूवर |ψ|² ही तो तिथे सापडण्याची संभाव्यता-घनता. हायड्रोजनच्या मूळ अवस्थेसाठी तो ढग गोलाकार, केंद्रकाजवळ सर्वांत दाट, आणि बाहेरच्या दिशेने विरळ होत जाणारा कोणत्याही सीमेशिवाय — अणूला कडा नाही, केवळ ते अंतर ज्यापुढे इलेक्ट्रॉन सापडणे फार असंभाव्य. 0.53 Å त्या त्रिज्येच्या रूपात टिकते जिच्यावर इलेक्ट्रॉन सापडणे सर्वांत संभाव्य, म्हणूनच संख्या तीच आणि तिचा अर्थ नाही. इथे सिद्धांतांबद्दल एक धडा आहे, आणि दुसरा पर्याय तो उलटा करतो. बरोबर भाकीत प्रतिरूप प्रस्थापित करत नाही. बोरचे प्रतिरूप हायड्रोजन वर्णपट सुरेखपणे सांगते आणि अगदी पुढच्या मूलद्रव्यावर, हेलियमवर, पूर्णपणे अपयशी ठरते, कारण त्याचे केंद्रीय गृहीतक — निश्चित मार्गावरचा एक इलेक्ट्रॉन — वाढवता येत नाही. जे प्रतिरूप एका स्थितीत चालते आणि दुसरीकडे कुठेही नाही, त्याने बहुधा चुकीच्या चौकटीत काहीतरी खरे पकडले आहे, आणि काम हे शोधणे की खरा भाग कोणता होता. इथे तो पुंजीकरण होता, आणि तो अशा सिद्धांतात टिकला ज्याने बोरने गृहीत धरलेले बाकी सर्व सोडून दिले. (तिसरे उत्तर ऊर्जा-पातळ्या फेकून देते, ज्या अणुभौतिकीचे सर्वांत सिद्ध वैशिष्ट्य, आणि चौथे प्रक्षेप-मार्ग ठेवून एक संख्या दुरुस्त करते, जे काहीही ठीक करत नाही.)",
        },
      },
      /*H2C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Classification of Elements and Periodicity                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-periodicity",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 3 — Classification of Elements and Periodicity in Properties",
      hi: "अध्याय 3 — तत्वों का वर्गीकरण एवं गुणधर्मों में आवर्तिता",
      mr: "प्रकरण 3 — मूलद्रव्यांचे वर्गीकरण आणि गुणधर्मांतील आवर्तिता",
    },
    name: {
      en: "Classification of Elements and Periodicity",
      hi: "तत्वों का वर्गीकरण एवं आवर्तिता",
      mr: "मूलद्रव्यांचे वर्गीकरण आणि आवर्तिता",
    },
    summary: {
      en: "A table that looks like a filing cabinet and is really a consequence of the last chapter: elements repeat their behaviour because their outermost electron arrangements repeat. A charge the outer electron actually feels rather than the one the nucleus carries, a radius that shrinks along a row and grows down a column, an energy that measures how tightly an atom holds on, a number that says how hard it pulls in a shared pair, and two elements in different groups that behave alike because they are the same size.",
      hi: "वह सारणी जो फ़ाइल-अलमारी जैसी दिखती है और वस्तुतः पिछले अध्याय का परिणाम है: तत्व अपना व्यवहार दोहराते हैं क्योंकि उनके बाहरी इलेक्ट्रॉन-विन्यास दोहराते हैं। वह आवेश जो बाहरी इलेक्ट्रॉन वस्तुतः महसूस करता है, वह नहीं जो नाभिक ढोता है, वह त्रिज्या जो पंक्ति में सिकुड़ती और स्तंभ में बढ़ती है, वह ऊर्जा जो नापती है कि परमाणु कितनी कसकर पकड़े है, वह संख्या जो बताती है कि वह साझा युग्म को कितना ज़ोर से खींचता है, और भिन्न वर्गों के वे दो तत्व जो एक-से व्यवहार करते हैं क्योंकि वे एक ही आकार के हैं।",
      mr: "ती सारणी जी फाइल-कपाटासारखी दिसते आणि प्रत्यक्षात मागच्या प्रकरणाचा परिणाम आहे: मूलद्रव्ये आपले वर्तन पुन्हा करतात कारण त्यांची बाहेरची इलेक्ट्रॉन-मांडणी पुन्हा होते. तो भार जो बाहेरचा इलेक्ट्रॉन प्रत्यक्षात अनुभवतो, केंद्रक वाहतो तो नव्हे, ती त्रिज्या जी ओळीत आकुंचते आणि स्तंभात वाढते, ती ऊर्जा जी अणू किती घट्ट धरून आहे हे मोजते, ती संख्या जी तो वाटलेल्या जोडीला किती जोराने ओढतो हे सांगते, आणि वेगळ्या गटांतील ती दोन मूलद्रव्ये जी सारखी वागतात कारण ती एकाच आकाराची आहेत.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "modern-periodic-law",
        name: {
          en: "The modern periodic law",
          hi: "आधुनिक आवर्त नियम",
          mr: "आधुनिक आवर्त नियम",
        },
        kind: "law",
        prompt: {
          en: "Mendeleev ordered the elements by atomic mass and had to swap two pairs to make the chemistry come out right; Moseley found the quantity that needs no swapping at all. Which law is this?",
          hi: "मेंडलीफ़ ने तत्वों को परमाणु द्रव्यमान से क्रम में रखा और रसायन ठीक बैठाने के लिए दो जोड़े बदलने पड़े; मोज़ली ने वह राशि खोजी जिसमें कोई बदल नहीं करना पड़ता। यह कौन-सा नियम है?",
          mr: "मेंडेलिव्हने मूलद्रव्ये अणुवस्तुमानाने क्रमात लावली आणि रसायन बरोबर बसवायला दोन जोड्या बदलाव्या लागल्या; मोजलीने ती राशी शोधली जिच्यात कोणतीही अदलाबदल करावी लागत नाही. हा कोणता नियम?",
        },
        statement: {
          en: "The modern periodic law states that the properties of elements are a periodic function of their atomic numbers, not their atomic masses, which is why argon precedes potassium despite being heavier.",
          hi: "आधुनिक आवर्त नियम कहता है कि तत्वों के गुणधर्म उनके परमाणु क्रमांकों के आवर्त फलन हैं, उनके परमाणु द्रव्यमानों के नहीं, इसीलिए आर्गन भारी होते हुए भी पोटैशियम से पहले आता है।",
          mr: "आधुनिक आवर्त नियम सांगतो की मूलद्रव्यांचे गुणधर्म त्यांच्या अणुक्रमांकांचे आवर्त फलन आहेत, त्यांच्या अणुवस्तुमानांचे नव्हे, म्हणूनच आर्गॉन जड असूनही पोटॅशियमच्या आधी येते.",
        },
        detail: {
          en: "The periodicity is a direct consequence of electron configuration: every element in a group has the same outer arrangement, and chemistry is almost entirely the business of the outermost electrons.",
          hi: "आवर्तिता इलेक्ट्रॉन विन्यास का सीधा परिणाम है: किसी वर्ग के हर तत्व का बाहरी विन्यास एक-सा है, और रसायन लगभग पूरा बाहरी इलेक्ट्रॉनों का ही कारोबार है।",
          mr: "आवर्तिता हा इलेक्ट्रॉन विन्यासाचा थेट परिणाम: एखाद्या गटातील प्रत्येक मूलद्रव्याची बाहेरची मांडणी सारखी, आणि रसायन जवळपास पूर्णपणे बाहेरच्या इलेक्ट्रॉनांचाच व्यवसाय.",
        },
        extra: {
          en: "Mendeleev's real achievement was not the ordering but the gaps: he left blanks and predicted the properties of eka-aluminium and eka-silicon, which arrived a decade later as gallium and germanium.",
          hi: "मेंडलीफ़ की असली उपलब्धि क्रम नहीं बल्कि रिक्तियाँ थीं: उन्होंने ख़ाली जगहें छोड़ीं और एका-ऐलुमिनियम तथा एका-सिलिकॉन के गुणधर्म बताए, जो दशक भर बाद गैलियम और जर्मेनियम बनकर आए।",
          mr: "मेंडेलिव्हची खरी कामगिरी क्रम नव्हे तर रिकाम्या जागा: त्याने जागा मोकळ्या सोडल्या आणि एका-ॲल्युमिनियम व एका-सिलिकॉनचे गुणधर्म सांगितले, जे दशकभराने गॅलियम आणि जर्मेनियम बनून आले.",
        },
        pair: {
          left: {
            en: "Argon before potassium, though it weighs more",
            hi: "पोटैशियम से पहले आर्गन, यद्यपि वह भारी है",
            mr: "पोटॅशियमच्या आधी आर्गॉन, जरी ते जड असले तरी",
          },
          right: {
            en: "the modern periodic law",
            hi: "आधुनिक आवर्त नियम",
            mr: "आधुनिक आवर्त नियम",
          },
        },
      },
      {
        id: "effective-nuclear-charge",
        name: {
          en: "Effective nuclear charge",
          hi: "प्रभावी नाभिकीय आवेश",
          mr: "परिणामी केंद्रकीय भार",
        },
        kind: "cause",
        prompt: {
          en: "Sodium's nucleus carries eleven positive charges, but its outermost electron behaves as though pulled by rather less than three, because the ten inner electrons stand between them. Which quantity is this?",
          hi: "सोडियम का नाभिक ग्यारह धन आवेश ढोता है, पर उसका बाहरी इलेक्ट्रॉन ऐसे व्यवहार करता है मानो उसे तीन से भी कम खींच रहे हों, क्योंकि दस भीतरी इलेक्ट्रॉन उनके बीच खड़े हैं। यह कौन-सी राशि है?",
          mr: "सोडियमचे केंद्रक अकरा धन भार वाहते, पण त्याचा बाहेरचा इलेक्ट्रॉन असा वागतो जणू त्याला तिनाहूनही कमी ओढत असावेत, कारण दहा आतले इलेक्ट्रॉन त्यांच्यामध्ये उभे आहेत. ही कोणती राशी?",
        },
        statement: {
          en: "The effective nuclear charge is the nuclear charge reduced by the screening of the inner electrons, and it is what an outer electron actually experiences rather than the full charge Z.",
          hi: "प्रभावी नाभिकीय आवेश वह नाभिकीय आवेश है जो भीतरी इलेक्ट्रॉनों के परिरक्षण से घट जाता है, और बाहरी इलेक्ट्रॉन पूरा आवेश Z नहीं बल्कि यही वस्तुतः अनुभव करता है।",
          mr: "परिणामी केंद्रकीय भार म्हणजे आतल्या इलेक्ट्रॉनांच्या आवरणाने घटलेला केंद्रकीय भार, आणि बाहेरचा इलेक्ट्रॉन पूर्ण भार Z नव्हे तर हाच प्रत्यक्षात अनुभवतो.",
        },
        detail: {
          en: "It explains almost every trend in the table at once: it rises steadily across a period because protons are added while the shell stays the same, and it barely changes down a group.",
          hi: "यह सारणी की लगभग हर प्रवृत्ति एक साथ समझाता है: वह आवर्त में लगातार बढ़ता है क्योंकि प्रोटॉन जुड़ते हैं जबकि कोश वही रहता है, और वर्ग में नीचे जाते हुए वह मुश्किल से बदलता है।",
          mr: "हे सारणीतील जवळपास प्रत्येक कल एकाच वेळी समजावते: तो आवर्तात सतत वाढतो कारण प्रोटॉन जोडले जातात तर कवच तेच राहते, आणि गटात खाली जाताना तो जेमतेम बदलतो.",
        },
        extra: {
          en: "Screening is not equally effective for every kind of orbital: s electrons penetrate closer to the nucleus than p, and d and f electrons screen poorly, which is why the lanthanides contract as they do.",
          hi: "परिरक्षण हर क़िस्म के कक्षक के लिए समान रूप से असरदार नहीं: s इलेक्ट्रॉन p की तुलना में नाभिक के पास तक घुसते हैं, और d तथा f इलेक्ट्रॉन कमज़ोर परिरक्षण करते हैं, इसीलिए लैंथेनाइड वैसे सिकुड़ते हैं जैसे सिकुड़ते हैं।",
          mr: "आवरण प्रत्येक प्रकारच्या कक्षकासाठी सारखेच प्रभावी नाही: s इलेक्ट्रॉन p च्या तुलनेत केंद्रकाजवळ शिरतात, आणि d व f इलेक्ट्रॉन कमकुवत आवरण करतात, म्हणूनच लॅन्थॅनाइड जसे आकुंचतात तसे आकुंचतात.",
        },
        pair: {
          left: {
            en: "Eleven protons that feel like fewer than three",
            hi: "ग्यारह प्रोटॉन जो तीन से भी कम लगते हैं",
            mr: "अकरा प्रोटॉन जे तिनाहूनही कमी वाटतात",
          },
          right: {
            en: "effective nuclear charge",
            hi: "प्रभावी नाभिकीय आवेश",
            mr: "परिणामी केंद्रकीय भार",
          },
        },
      },
      {
        id: "trend-in-atomic-radius",
        name: {
          en: "The trend in atomic radius",
          hi: "परमाणु त्रिज्या की प्रवृत्ति",
          mr: "अणुत्रिज्येचा कल",
        },
        kind: "trend",
        prompt: {
          en: "Adding electrons ought to make an atom bigger, and yet fluorine with nine of them is less than half the size of lithium with three — because they are going into the same shell while the nucleus keeps growing. Which trend is this?",
          hi: "इलेक्ट्रॉन जोड़ने से परमाणु बड़ा होना चाहिए, फिर भी नौ इलेक्ट्रॉन वाला फ़्लुओरीन तीन वाले लिथियम के आधे से भी छोटा है — क्योंकि वे उसी कोश में जा रहे हैं जबकि नाभिक बढ़ता जाता है। यह कौन-सी प्रवृत्ति है?",
          mr: "इलेक्ट्रॉन जोडल्याने अणू मोठा व्हायला हवा, तरीही नऊ इलेक्ट्रॉन असलेला फ्लोरिन तीन असलेल्या लिथियमच्या निम्म्याहूनही लहान — कारण ते त्याच कवचात जात आहेत तर केंद्रक वाढतच जाते. हा कोणता कल?",
        },
        statement: {
          en: "Atomic radius decreases across a period as the effective nuclear charge rises with no new shell added, and increases down a group as each element gains a shell further out.",
          hi: "आवर्त में परमाणु त्रिज्या घटती है क्योंकि प्रभावी नाभिकीय आवेश बढ़ता है और कोई नया कोश नहीं जुड़ता, और वर्ग में नीचे बढ़ती है क्योंकि हर तत्व और बाहर एक कोश पाता है।",
          mr: "आवर्तात अणुत्रिज्या घटते कारण परिणामी केंद्रकीय भार वाढतो आणि नवे कवच जोडले जात नाही, आणि गटात खाली वाढते कारण प्रत्येक मूलद्रव्याला आणखी बाहेर एक कवच मिळते.",
        },
        detail: {
          en: "A cation is always smaller than its parent atom and an anion always larger, because losing an electron leaves the same nucleus pulling on fewer and gaining one adds repulsion without adding charge.",
          hi: "धनायन सदा अपने मूल परमाणु से छोटा और ऋणायन सदा बड़ा होता है, क्योंकि इलेक्ट्रॉन खोने पर वही नाभिक कम इलेक्ट्रॉनों को खींचता है और पाने पर आवेश बढ़ाए बिना प्रतिकर्षण जुड़ जाता है।",
          mr: "धनायन नेहमी आपल्या मूळ अणूहून लहान आणि ऋणायन नेहमी मोठा, कारण इलेक्ट्रॉन गमावल्यावर तेच केंद्रक कमी इलेक्ट्रॉनांना ओढते आणि मिळवल्यावर भार न वाढवता प्रतिकर्षण जोडले जाते.",
        },
        extra: {
          en: "In an isoelectronic series — ions with the same electron count — the radius falls steadily as nuclear charge rises, so N³⁻ is much larger than Mg²⁺ although both hold ten electrons.",
          hi: "समइलेक्ट्रॉनी श्रेणी में — समान इलेक्ट्रॉन-गिनती वाले आयन — नाभिकीय आवेश बढ़ने पर त्रिज्या लगातार घटती है, अतः N³⁻, Mg²⁺ से कहीं बड़ा है यद्यपि दोनों दस इलेक्ट्रॉन रखते हैं।",
          mr: "समइलेक्ट्रॉनी मालिकेत — समान इलेक्ट्रॉन-मोजणीचे आयन — केंद्रकीय भार वाढताना त्रिज्या सतत घटते, म्हणून N³⁻ हा Mg²⁺ हून कितीतरी मोठा जरी दोघे दहा इलेक्ट्रॉन ठेवतात.",
        },
        pair: {
          left: {
            en: "Nine electrons in a smaller atom than three",
            hi: "तीन वाले से छोटे परमाणु में नौ इलेक्ट्रॉन",
            mr: "तीन असलेल्याहून लहान अणूत नऊ इलेक्ट्रॉन",
          },
          right: {
            en: "the trend in atomic radius",
            hi: "परमाणु त्रिज्या की प्रवृत्ति",
            mr: "अणुत्रिज्येचा कल",
          },
        },
      },
      {
        id: "ionisation-enthalpy",
        name: {
          en: "Ionisation enthalpy",
          hi: "आयनन एन्थैल्पी",
          mr: "आयनीकरण एन्थाल्पी",
        },
        kind: "trend",
        prompt: {
          en: "Sodium gives up its first electron for 496 kJ per mole and refuses the second until nine times that is offered, because the second would have to be prised out of a completed shell. Which quantity is this?",
          hi: "सोडियम अपना पहला इलेक्ट्रॉन प्रति मोल 496 kJ में दे देता है और दूसरा तब तक नहीं देता जब तक उसका नौ गुना न दिया जाए, क्योंकि दूसरे को पूर्ण कोश से उखाड़ना पड़ेगा। यह कौन-सी राशि है?",
          mr: "सोडियम आपला पहिला इलेक्ट्रॉन प्रति मोल 496 kJ ला देऊन टाकतो आणि दुसरा तोवर देत नाही जोवर त्याच्या नऊपट दिले जात नाही, कारण दुसरा पूर्ण कवचातून उपटावा लागेल. ही कोणती राशी?",
        },
        statement: {
          en: "Ionisation enthalpy is the energy needed to remove the most loosely held electron from a gaseous atom, and it rises across a period and falls down a group.",
          hi: "आयनन एन्थैल्पी गैसीय परमाणु से सबसे ढीले बँधे इलेक्ट्रॉन को हटाने के लिए चाहिए ऊर्जा है, और वह आवर्त में बढ़ती और वर्ग में नीचे घटती है।",
          mr: "आयनीकरण एन्थाल्पी म्हणजे वायुरूप अणूतून सर्वांत सैल धरलेला इलेक्ट्रॉन काढायला लागणारी ऊर्जा, आणि ती आवर्तात वाढते आणि गटात खाली घटते.",
        },
        detail: {
          en: "Successive values always rise, and a sudden jump between two of them reveals a completed shell — which is how the group number of an unknown element can be read straight off its ionisation series.",
          hi: "क्रमिक मान सदा बढ़ते हैं, और उनमें से दो के बीच अचानक छलाँग पूर्ण कोश उजागर करती है — इसी से किसी अज्ञात तत्व का वर्ग-अंक उसकी आयनन-श्रेणी से सीधे पढ़ा जा सकता है।",
          mr: "क्रमवार मूल्ये नेहमी वाढतात, आणि त्यांतील दोघांमधली अचानक उडी पूर्ण कवच उघड करते — यामुळेच अज्ञात मूलद्रव्याचा गट-अंक त्याच्या आयनीकरण-मालिकेवरून थेट वाचता येतो.",
        },
        extra: {
          en: "The trend across a period is not perfectly smooth: boron dips below beryllium because its outer electron is in a higher p orbital, and oxygen dips below nitrogen because pairing two electrons in one p orbital costs repulsion.",
          hi: "आवर्त की प्रवृत्ति पूरी तरह चिकनी नहीं: बोरॉन बेरिलियम से नीचे गिरता है क्योंकि उसका बाहरी इलेक्ट्रॉन ऊँचे p कक्षक में है, और ऑक्सीजन नाइट्रोजन से नीचे क्योंकि एक p कक्षक में दो इलेक्ट्रॉन जोड़ने पर प्रतिकर्षण चुकाना पड़ता है।",
          mr: "आवर्तातील कल पूर्णपणे गुळगुळीत नाही: बोरॉन बेरिलियमच्या खाली येतो कारण त्याचा बाहेरचा इलेक्ट्रॉन उंच p कक्षकात आहे, आणि ऑक्सिजन नायट्रोजनच्या खाली कारण एका p कक्षकात दोन इलेक्ट्रॉन जोडल्यास प्रतिकर्षण द्यावे लागते.",
        },
        pair: {
          left: {
            en: "A jump that gives away the group number",
            hi: "वह छलाँग जो वर्ग-अंक बता देती है",
            mr: "ती उडी जी गट-अंक सांगून टाकते",
          },
          right: {
            en: "ionisation enthalpy",
            hi: "आयनन एन्थैल्पी",
            mr: "आयनीकरण एन्थाल्पी",
          },
        },
      },
      {
        id: "electronegativity",
        name: {
          en: "Electronegativity",
          hi: "विद्युत्-ऋणात्मकता",
          mr: "विद्युतऋणता",
        },
        kind: "trend",
        prompt: {
          en: "Fluorine is given 4.0 and caesium 0.7 on a scale with no units at all, and the difference between two atoms' values predicts whether the bond between them will be ionic or covalent. Which property is this?",
          hi: "बिना किसी मात्रक के पैमाने पर फ़्लुओरीन को 4.0 और सीज़ियम को 0.7 दिया जाता है, और दो परमाणुओं के मानों का अंतर बताता है कि उनके बीच का बंध आयनिक होगा या सहसंयोजक। यह कौन-सा गुण है?",
          mr: "कोणत्याही एककाशिवाय असलेल्या मापनश्रेणीवर फ्लोरिनला 4.0 आणि सीझियमला 0.7 दिले जाते, आणि दोन अणूंच्या मूल्यांतील फरक त्यांच्यातील बंध आयनिक असेल की सहसंयुज हे सांगतो. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Electronegativity is an atom's tendency to attract a shared electron pair towards itself in a bond, and unlike ionisation enthalpy it is a property of an atom in a molecule rather than of an isolated one.",
          hi: "विद्युत्-ऋणात्मकता बंध में साझा इलेक्ट्रॉन-युग्म को अपनी ओर खींचने की परमाणु की प्रवृत्ति है, और आयनन एन्थैल्पी के विपरीत वह अलग-थलग परमाणु का नहीं बल्कि अणु में बैठे परमाणु का गुण है।",
          mr: "विद्युतऋणता म्हणजे बंधात वाटलेली इलेक्ट्रॉन जोडी स्वतःकडे ओढण्याची अणूची प्रवृत्ती, आणि आयनीकरण एन्थाल्पीच्या उलट तो वेगळ्या अणूचा नव्हे तर रेणूतील अणूचा गुणधर्म.",
        },
        detail: {
          en: "It has no unit and no direct measurement; Pauling's scale was constructed from bond energies, and it is useful precisely because it compresses a great deal of chemistry into one number per element.",
          hi: "उसका न कोई मात्रक है न कोई सीधा माप; पॉलिंग का पैमाना बंध-ऊर्जाओं से बनाया गया, और वह ठीक इसलिए उपयोगी है कि प्रति तत्व एक संख्या में बहुत सारा रसायन दबा देता है।",
          mr: "तिला ना कोणते एकक ना कोणते थेट माप; पॉलिंगची मापनश्रेणी बंध-ऊर्जांतून बनवली, आणि ती नेमकी यासाठी उपयुक्त की प्रति मूलद्रव्य एका संख्येत बरेच रसायन दाबते.",
        },
        extra: {
          en: "A difference below about 0.4 gives a nearly non-polar bond, between 0.4 and 1.7 a polar covalent one, and above 1.7 a largely ionic one — a rule of thumb with no sharp boundaries anywhere in it.",
          hi: "लगभग 0.4 से कम अंतर लगभग अध्रुवीय बंध देता है, 0.4 और 1.7 के बीच ध्रुवीय सहसंयोजक, और 1.7 से ऊपर अधिकतर आयनिक — ऐसा अंगूठा-नियम जिसमें कहीं कोई तीखी सीमा नहीं।",
          mr: "सुमारे 0.4 हून कमी फरक जवळपास अध्रुवीय बंध देतो, 0.4 आणि 1.7 दरम्यान ध्रुवीय सहसंयुज, आणि 1.7 हून वर बहुतांश आयनिक — असा अंगठा-नियम ज्यात कुठेही तीक्ष्ण सीमा नाही.",
        },
        pair: {
          left: {
            en: "A scale with no units and no direct measurement",
            hi: "ऐसा पैमाना जिसका न मात्रक है न सीधा माप",
            mr: "अशी मापनश्रेणी जिला ना एकक ना थेट माप",
          },
          right: {
            en: "electronegativity",
            hi: "विद्युत्-ऋणात्मकता",
            mr: "विद्युतऋणता",
          },
        },
      },
      {
        id: "diagonal-relationship",
        name: {
          en: "The diagonal relationship",
          hi: "विकर्ण संबंध",
          mr: "कर्ण संबंध",
        },
        kind: "cause",
        prompt: {
          en: "Lithium behaves far more like magnesium than like sodium, and beryllium like aluminium, because moving one place right and one place down leaves the size and charge density almost unchanged. Which pattern is this?",
          hi: "लिथियम सोडियम की तुलना में मैग्नीशियम जैसा कहीं अधिक व्यवहार करता है, और बेरिलियम ऐलुमिनियम जैसा, क्योंकि एक जगह दाएँ और एक जगह नीचे जाने पर आकार तथा आवेश-घनत्व लगभग अपरिवर्तित रह जाते हैं। यह कौन-सा प्रतिरूप है?",
          mr: "लिथियम सोडियमपेक्षा मॅग्नेशियमसारखे कितीतरी अधिक वागते, आणि बेरिलियम ॲल्युमिनियमसारखे, कारण एक जागा उजवीकडे आणि एक जागा खाली गेल्यास आकार व भार-घनता जवळपास अपरिवर्तित राहतात. हा कोणता आकृतिबंध?",
        },
        statement: {
          en: "The diagonal relationship is the resemblance between an element and the one below and to its right, and it arises because the size decrease across a period is cancelled by the increase down a group.",
          hi: "विकर्ण संबंध किसी तत्व और उसके नीचे-दाएँ वाले तत्व की समानता है, और वह इसलिए उठता है कि आवर्त में आकार की कमी वर्ग में नीचे की वृद्धि से कट जाती है।",
          mr: "कर्ण संबंध म्हणजे एखादे मूलद्रव्य आणि त्याच्या खाली-उजवीकडचे मूलद्रव्य यांतील साम्य, आणि तो यामुळे उद्भवतो की आवर्तातील आकाराची घट गटात खालच्या वाढीने कापली जाते.",
        },
        detail: {
          en: "It is why lithium alone among the alkali metals forms a nitride and a carbonate that decomposes on heating, and why beryllium's oxide is amphoteric like aluminium's rather than basic.",
          hi: "इसी से क्षार धातुओं में केवल लिथियम नाइट्राइड बनाता है और ऐसा कार्बोनेट जो गरम करने पर विघटित हो जाए, और इसी से बेरिलियम का ऑक्साइड क्षारकीय नहीं बल्कि ऐलुमिनियम जैसा उभयधर्मी है।",
          mr: "म्हणूनच अल्कधर्मी धातूंत केवळ लिथियम नायट्राइड बनवते आणि असे कार्बोनेट जे तापवल्यावर विघटित होते, आणि म्हणूनच बेरिलियमचे ऑक्साइड आम्लारीधर्मी नव्हे तर ॲल्युमिनियमसारखे उभयधर्मी.",
        },
        extra: {
          en: "It fades away after the second period, because by then the size changes across and down have stopped cancelling so neatly and the d electrons have entered the accounting.",
          hi: "दूसरे आवर्त के बाद यह फीका पड़ जाता है, क्योंकि तब तक आर-पार और नीचे के आकार-परिवर्तन इतनी सफ़ाई से कटना बंद कर देते हैं और d इलेक्ट्रॉन हिसाब में आ जाते हैं।",
          mr: "दुसऱ्या आवर्तानंतर तो फिकट होतो, कारण तोवर आडवे आणि खालचे आकार-बदल इतक्या नीटपणे कापले जाणे थांबतात आणि d इलेक्ट्रॉन हिशोबात येतात.",
        },
        pair: {
          left: {
            en: "Lithium resembling magnesium more than sodium",
            hi: "सोडियम से अधिक मैग्नीशियम जैसा लिथियम",
            mr: "सोडियमहून अधिक मॅग्नेशियमसारखे लिथियम",
          },
          right: {
            en: "the diagonal relationship",
            hi: "विकर्ण संबंध",
            mr: "कर्ण संबंध",
          },
        },
      },
      /*F3C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The successive ionisation enthalpies of an element, in kJ/mol, are 738, 1451, 7733 and 10540. A student says the element is in group 1 because the first value is the smallest. Identify the group correctly and explain the reasoning.",
          hi: "किसी तत्व की क्रमिक आयनन एन्थैल्पियाँ, kJ/mol में, 738, 1451, 7733 और 10540 हैं। एक विद्यार्थी कहता है कि तत्व वर्ग 1 का है क्योंकि पहला मान सबसे छोटा है। वर्ग ठीक-ठीक पहचानो और तर्क समझाओ।",
          mr: "एका मूलद्रव्याच्या क्रमवार आयनीकरण एन्थाल्पी, kJ/mol मध्ये, 738, 1451, 7733 आणि 10540 आहेत. एक विद्यार्थी म्हणतो की मूलद्रव्य गट 1 चे आहे कारण पहिले मूल्य सर्वांत लहान. गट नेमका ओळखा आणि युक्तिवाद समजावा.",
        },
        choices: [
          {
            en: "It is in group 2. What identifies the group is not the size of the first value but where the SUDDEN JUMP falls: 738 to 1451 is an ordinary rise, but 1451 to 7733 is more than fivefold. Two electrons come off with moderate difficulty and the third meets a completed noble-gas shell, so the atom had exactly two valence electrons. The element is magnesium",
            hi: "वह वर्ग 2 का है। वर्ग की पहचान पहले मान का आकार नहीं बल्कि यह है कि अचानक छलाँग कहाँ पड़ती है: 738 से 1451 साधारण वृद्धि है, पर 1451 से 7733 पाँच गुने से अधिक। दो इलेक्ट्रॉन मध्यम कठिनाई से निकलते हैं और तीसरा पूर्ण उत्कृष्ट-गैस कोश से टकराता है, अतः परमाणु के पास ठीक दो संयोजी इलेक्ट्रॉन थे। तत्व मैग्नीशियम है",
            mr: "ते गट 2 चे आहे. गटाची ओळख पहिल्या मूल्याचा आकार नव्हे तर अचानक उडी कुठे पडते ही: 738 ते 1451 ही सामान्य वाढ, पण 1451 ते 7733 ही पाचपटीहून अधिक. दोन इलेक्ट्रॉन मध्यम कष्टाने निघतात आणि तिसरा पूर्ण निष्क्रिय-वायू कवचाला भिडतो, म्हणून अणूकडे नेमके दोन संयुजा इलेक्ट्रॉन होते. मूलद्रव्य मॅग्नेशियम आहे",
          },
          {
            en: "The student is right: it is in group 1, since the smallest ionisation enthalpy always belongs to the most reactive metals",
            hi: "विद्यार्थी सही है: वह वर्ग 1 का है, क्योंकि सबसे छोटी आयनन एन्थैल्पी सदा सबसे क्रियाशील धातुओं की होती है",
            mr: "विद्यार्थी बरोबर: ते गट 1 चे, कारण सर्वांत लहान आयनीकरण एन्थाल्पी नेहमी सर्वांत क्रियाशील धातूंची असते",
          },
          {
            en: "It is in group 4, because four ionisation enthalpies have been listed",
            hi: "वह वर्ग 4 का है, क्योंकि चार आयनन एन्थैल्पियाँ सूचीबद्ध हैं",
            mr: "ते गट 4 चे, कारण चार आयनीकरण एन्थाल्पी यादीत आहेत",
          },
          {
            en: "The group cannot be found from ionisation enthalpies, which depend only on atomic size and not on electron configuration",
            hi: "आयनन एन्थैल्पियों से वर्ग नहीं निकाला जा सकता, जो केवल परमाणु आकार पर निर्भर हैं, इलेक्ट्रॉन विन्यास पर नहीं",
            mr: "आयनीकरण एन्थाल्पींवरून गट काढता येत नाही, ज्या केवळ अणूच्या आकारावर अवलंबून, इलेक्ट्रॉन विन्यासावर नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Look at the ratios rather than the values, because a single number in isolation says almost nothing. From the first to the second, 1451/738 = 1.97: not quite a doubling, and every successive ionisation is harder than the last simply because the ion left behind is more positively charged and holds the remaining electrons more tightly. That much is routine. From the second to the third, 7733/1451 = 5.33. That is not a routine rise, and something structural has changed. What has changed is which shell the electron is coming from. The first two electrons were the outermost ones, sitting in the highest occupied shell with substantial screening beneath them. Once both have gone, the ion has a noble-gas configuration, and the third electron must be prised out of a complete inner shell — closer to the nucleus, poorly screened, and part of a particularly stable arrangement. It costs several times as much. So the number of electrons removed before the jump is the number of valence electrons the atom had, and that is the group number. Two came off easily, so the element is in group 2. With a first ionisation enthalpy of 738 kJ/mol it is magnesium. The student's error is worth naming precisely. A small first ionisation enthalpy does indicate a metal, and group 1 metals do have the smallest values in their periods — but 'smallest in its period' is a comparison across elements, and here only one element is on the table. There is nothing to compare 738 with. The information about the group is not in the first value at all; it is in the pattern of the sequence, which is why the question gives four numbers rather than one. Two applications follow. First, this is how the group of an unknown element is determined experimentally, and the method is robust: the jump is so large that no measurement error could hide it. Second, the same argument explains why the common ion of an element is what it is. Magnesium forms Mg²⁺ and never Mg³⁺, not because a third electron is impossible to remove but because no chemical reaction releases 7733 kJ/mol to pay for it. Group 1 stops at +1 and group 13 at +3 for exactly the same reason. (The third answer counts the data rather than reading it, and the fourth denies the configuration dependence on which the whole method rests.)",
          hi: "मानों के बजाय अनुपात देखो, क्योंकि अकेली संख्या लगभग कुछ नहीं कहती। पहले से दूसरे तक, 1451/738 = 1.97: दुगुना भी नहीं, और हर क्रमिक आयनन पिछले से कठिन होता ही है क्योंकि पीछे बचा आयन अधिक धनावेशित है और शेष इलेक्ट्रॉनों को अधिक कसकर पकड़ता है। इतना नित्य है। दूसरे से तीसरे तक, 7733/1451 = 5.33. यह नित्य वृद्धि नहीं, और कुछ संरचनात्मक बदल चुका है। बदला यह है कि इलेक्ट्रॉन किस कोश से आ रहा है। पहले दो इलेक्ट्रॉन बाहरी थे, सबसे ऊँचे भरे कोश में बैठे, जिनके नीचे पर्याप्त परिरक्षण था। दोनों के जाते ही आयन का विन्यास उत्कृष्ट-गैस जैसा हो जाता है, और तीसरे इलेक्ट्रॉन को पूर्ण भीतरी कोश से उखाड़ना पड़ता है — नाभिक के अधिक पास, कमज़ोर परिरक्षित, और विशेष रूप से स्थिर व्यवस्था का भाग। वह कई गुना महँगा पड़ता है। अतः छलाँग से पहले हटाए गए इलेक्ट्रॉनों की संख्या ही परमाणु के संयोजी इलेक्ट्रॉनों की संख्या है, और वही वर्ग-अंक है। दो आसानी से निकले, अतः तत्व वर्ग 2 का है। 738 kJ/mol की पहली आयनन एन्थैल्पी के साथ वह मैग्नीशियम है। विद्यार्थी की भूल ठीक-ठीक नाम लेने योग्य है। छोटी पहली आयनन एन्थैल्पी धातु का संकेत देती ही है, और वर्ग 1 की धातुओं के अपने आवर्तों में सबसे छोटे मान होते ही हैं — पर 'अपने आवर्त में सबसे छोटा' तत्वों के बीच की तुलना है, और यहाँ मेज़ पर केवल एक तत्व है। 738 की तुलना करने को कुछ है ही नहीं। वर्ग की सूचना पहले मान में है ही नहीं; वह अनुक्रम के प्रतिरूप में है, इसीलिए प्रश्न एक के बजाय चार संख्याएँ देता है। दो अनुप्रयोग निकलते हैं। पहला, अज्ञात तत्व का वर्ग प्रयोग से इसी तरह तय होता है, और विधि दृढ़ है: छलाँग इतनी बड़ी है कि कोई माप-त्रुटि उसे छिपा नहीं सकती। दूसरा, वही तर्क समझाता है कि किसी तत्व का सामान्य आयन वही क्यों है जो है। मैग्नीशियम Mg²⁺ बनाता है, Mg³⁺ कभी नहीं, इसलिए नहीं कि तीसरा इलेक्ट्रॉन हटाना असंभव है बल्कि इसलिए कि कोई रासायनिक अभिक्रिया उसे चुकाने को 7733 kJ/mol नहीं छोड़ती। वर्ग 1 +1 पर और वर्ग 13 +3 पर ठीक इसी कारण रुक जाते हैं। (तीसरा उत्तर आँकड़े पढ़ने के बजाय गिनता है, और चौथा उस विन्यास-निर्भरता को नकारता है जिस पर पूरी विधि टिकी है।)",
          mr: "मूल्यांऐवजी गुणोत्तरे पाहा, कारण एकटी संख्या जवळपास काहीच सांगत नाही. पहिल्यापासून दुसऱ्यापर्यंत, 1451/738 = 1.97: दुप्पटही नाही, आणि प्रत्येक क्रमवार आयनीकरण मागच्याहून कठीण असतेच कारण मागे उरलेला आयन अधिक धनभारित आणि उरलेले इलेक्ट्रॉन अधिक घट्ट धरतो. इतके नेहमीचे. दुसऱ्यापासून तिसऱ्यापर्यंत, 7733/1451 = 5.33. ही नेहमीची वाढ नव्हे, आणि काहीतरी संरचनात्मक बदलले आहे. बदलले हे की इलेक्ट्रॉन कोणत्या कवचातून येत आहे. पहिले दोन इलेक्ट्रॉन बाहेरचे होते, सर्वांत उंच भरलेल्या कवचात बसलेले, ज्यांच्याखाली पुरेसे आवरण होते. दोघेही गेल्यावर आयनाचा विन्यास निष्क्रिय-वायूसारखा होतो, आणि तिसरा इलेक्ट्रॉन पूर्ण आतल्या कवचातून उपटावा लागतो — केंद्रकाच्या अधिक जवळ, कमकुवत आवरलेला, आणि विशेष स्थिर मांडणीचा भाग. तो कैकपट महाग पडतो. म्हणून उडीच्या आधी काढलेल्या इलेक्ट्रॉनांची संख्या हीच अणूच्या संयुजा इलेक्ट्रॉनांची संख्या, आणि तोच गट-अंक. दोन सहज निघाले, म्हणून मूलद्रव्य गट 2 चे. 738 kJ/mol च्या पहिल्या आयनीकरण एन्थाल्पीसह ते मॅग्नेशियम आहे. विद्यार्थ्याची चूक नेमके नाव घेण्याजोगी. लहान पहिली आयनीकरण एन्थाल्पी धातूचा संकेत देतेच, आणि गट 1 च्या धातूंची त्यांच्या आवर्तांत सर्वांत लहान मूल्ये असतातच — पण 'आपल्या आवर्तात सर्वांत लहान' ही मूलद्रव्यांमधली तुलना, आणि इथे मेजावर केवळ एकच मूलद्रव्य आहे. 738 शी तुलना करायला काहीच नाही. गटाची माहिती पहिल्या मूल्यात नाहीच; ती अनुक्रमाच्या आकृतिबंधात आहे, म्हणूनच प्रश्न एकाऐवजी चार संख्या देतो. दोन उपयोजने निघतात. पहिले, अज्ञात मूलद्रव्याचा गट प्रयोगाने असाच ठरतो, आणि पद्धत भक्कम: उडी इतकी मोठी की कोणतीही माप-त्रुटी ती लपवू शकत नाही. दुसरे, तोच युक्तिवाद समजावतो की एखाद्या मूलद्रव्याचा नेहमीचा आयन तोच का आहे. मॅग्नेशियम Mg²⁺ बनवते, Mg³⁺ कधीच नाही, तिसरा इलेक्ट्रॉन काढणे अशक्य म्हणून नव्हे तर कोणतीही रासायनिक अभिक्रिया तो भरायला 7733 kJ/mol सोडत नाही म्हणून. गट 1 हा +1 वर आणि गट 13 हा +3 वर नेमक्या याच कारणाने थांबतात. (तिसरे उत्तर आकडेवारी वाचण्याऐवजी मोजते, आणि चौथे ज्या विन्यास-अवलंबितेवर अख्खी पद्धत टेकली आहे ती नाकारते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Across period 2 the first ionisation enthalpy generally rises, and yet boron's is lower than beryllium's and oxygen's is lower than nitrogen's. A student concludes the trend is unreliable. Explain both dips and say what they reveal.",
          hi: "आवर्त 2 में पहली आयनन एन्थैल्पी आम तौर पर बढ़ती है, फिर भी बोरॉन की बेरिलियम से कम है और ऑक्सीजन की नाइट्रोजन से। एक विद्यार्थी निष्कर्ष निकालता है कि प्रवृत्ति अविश्वसनीय है। दोनों गिरावटें समझाओ और बताओ वे क्या उजागर करती हैं।",
          mr: "आवर्त 2 मध्ये पहिली आयनीकरण एन्थाल्पी सर्वसाधारणपणे वाढते, तरीही बोरॉनची बेरिलियमहून कमी आणि ऑक्सिजनची नायट्रोजनहून. एक विद्यार्थी निष्कर्ष काढतो की कल अविश्वसनीय आहे. दोन्ही घटी समजावा आणि त्या काय उघड करतात ते सांगा.",
        },
        choices: [
          {
            en: "Both dips are predicted, not anomalies. Beryllium's outer electron is in a filled 2s orbital while boron's is a lone 2p, which is higher in energy and better screened, so boron gives it up more easily. Nitrogen has three 2p electrons singly occupying three orbitals while oxygen's fourth must pair with one of them, and that pairing costs repulsion energy, so oxygen loses it more easily. The dips confirm the sub-shell structure rather than undermining the trend",
            hi: "दोनों गिरावटें भविष्यवाणी की गई हैं, विसंगतियाँ नहीं। बेरिलियम का बाहरी इलेक्ट्रॉन भरे 2s कक्षक में है जबकि बोरॉन का अकेला 2p, जो ऊर्जा में ऊँचा और बेहतर परिरक्षित है, अतः बोरॉन उसे अधिक आसानी से दे देता है। नाइट्रोजन के तीन 2p इलेक्ट्रॉन तीन कक्षकों में एक-एक बैठे हैं जबकि ऑक्सीजन के चौथे को उनमें से एक के साथ जोड़ी बनानी पड़ती है, और उस जोड़ी में प्रतिकर्षण-ऊर्जा चुकानी पड़ती है, अतः ऑक्सीजन उसे अधिक आसानी से खोता है। गिरावटें प्रवृत्ति को कमज़ोर नहीं करतीं बल्कि उपकोश-संरचना की पुष्टि करती हैं",
            mr: "दोन्ही घटी भाकीत केलेल्या आहेत, विसंगती नव्हेत. बेरिलियमचा बाहेरचा इलेक्ट्रॉन भरलेल्या 2s कक्षकात तर बोरॉनचा एकटा 2p, जो ऊर्जेत उंच आणि चांगला आवरलेला, म्हणून बोरॉन तो अधिक सहज देतो. नायट्रोजनचे तीन 2p इलेक्ट्रॉन तीन कक्षकांत एकेक बसलेले तर ऑक्सिजनच्या चौथ्याला त्यांतील एकाशी जोडी करावी लागते, आणि त्या जोडीत प्रतिकर्षण-ऊर्जा द्यावी लागते, म्हणून ऑक्सिजन तो अधिक सहज गमावतो. घटी कल कमकुवत करत नाहीत तर उपकवच-रचनेची पुष्टी करतात",
          },
          {
            en: "The student is right: ionisation enthalpies do not follow any reliable pattern, and the trend is a rough generalisation with many exceptions",
            hi: "विद्यार्थी सही है: आयनन एन्थैल्पियाँ किसी विश्वसनीय प्रतिरूप का पालन नहीं करतीं, और प्रवृत्ति अनेक अपवादों वाली मोटी सामान्यीकरण है",
            mr: "विद्यार्थी बरोबर: आयनीकरण एन्थाल्पी कोणत्याही विश्वासार्ह आकृतिबंधाचे पालन करत नाहीत, आणि कल अनेक अपवादांचे ढोबळ सामान्यीकरण",
          },
          {
            en: "The dips are experimental errors, since theory predicts a perfectly smooth rise across every period",
            hi: "गिरावटें प्रायोगिक त्रुटियाँ हैं, क्योंकि सिद्धांत हर आवर्त में पूरी तरह चिकनी वृद्धि बताता है",
            mr: "घटी प्रायोगिक त्रुटी आहेत, कारण सिद्धांत प्रत्येक आवर्तात पूर्णपणे गुळगुळीत वाढ सांगतो",
          },
          {
            en: "Both dips are caused by atomic radius increasing at boron and at oxygen, against the general trend of the period",
            hi: "दोनों गिरावटें बोरॉन और ऑक्सीजन पर परमाणु त्रिज्या के बढ़ने से आती हैं, आवर्त की सामान्य प्रवृत्ति के विरुद्ध",
            mr: "दोन्ही घटी बोरॉन आणि ऑक्सिजनवर अणुत्रिज्या वाढल्याने येतात, आवर्ताच्या सर्वसाधारण कलाविरुद्ध",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "An exception that a theory predicts is not an exception at all — it is a test the theory has passed — and these two dips are among the best evidence that the sub-shell picture is right. Take the first. Beryllium is 1s²2s², so the electron being removed comes from a filled 2s orbital. Boron is 1s²2s²2p¹, and the electron removed is the lone 2p. Two things make that 2p electron easier to detach. It lies in a higher-energy orbital to begin with, and it is screened not only by the 1s core but by the filled 2s beneath it, so the effective nuclear charge it feels is lower. Both effects push the same way, and boron's first ionisation enthalpy comes out about 3 per cent below beryllium's although its nuclear charge is one greater. Now the second. Nitrogen is 2p³, and by Hund's rule those three electrons occupy the three separate p orbitals singly, all with parallel spins — a half-filled sub-shell, and an arrangement of unusual stability because no two electrons share an orbital and repulsion is minimised. Oxygen is 2p⁴, so its fourth p electron has no empty orbital left and must pair with one already there. Two electrons in the same small orbital repel each other strongly, and that repulsion energy is already 'paid in'. Removing one of the pair recovers it, so oxygen surrenders an electron more readily than nitrogen does, and its first ionisation enthalpy dips below. Notice the shape of the argument in both cases. The general trend comes from effective nuclear charge rising steadily across a period; the dips come from the finer structure of orbitals and spin. Two effects, two scales, and the smaller one occasionally overturns the larger by a few per cent. That is exactly what a good physical theory looks like — a dominant term plus corrections, each with its own reason. Two closing points. First, the same two dips repeat in period 3, at aluminium and at sulphur, and for the same reasons; a genuinely anomalous result would not repeat on schedule. Second, the half-filled stability that lowers oxygen's value is the same effect that makes chromium adopt 3d⁵4s¹ rather than the Aufbau-predicted 3d⁴4s² — the electron configuration and the ionisation trend are the same physics seen from two sides. (The third answer expects a smooth rise no theory has ever predicted, and the fourth invents a radius increase that measurement flatly contradicts.)",
          hi: "जिस अपवाद की भविष्यवाणी सिद्धांत करे वह अपवाद है ही नहीं — वह ऐसी परीक्षा है जो सिद्धांत ने पास की — और ये दोनों गिरावटें उपकोश-चित्र के सही होने के सर्वोत्तम प्रमाणों में हैं। पहली लो। बेरिलियम 1s²2s² है, अतः हटाया जाने वाला इलेक्ट्रॉन भरे 2s कक्षक से आता है। बोरॉन 1s²2s²2p¹ है, और हटाया गया इलेक्ट्रॉन अकेला 2p है। दो बातें उस 2p इलेक्ट्रॉन को अलग करना आसान बनाती हैं। वह शुरू से ही ऊँची ऊर्जा के कक्षक में है, और उसे केवल 1s क्रोड ही नहीं बल्कि नीचे के भरे 2s ने भी परिरक्षित किया है, अतः वह जो प्रभावी नाभिकीय आवेश महसूस करता है वह कम है। दोनों प्रभाव एक ही ओर धकेलते हैं, और बोरॉन की पहली आयनन एन्थैल्पी बेरिलियम से लगभग 3 प्रतिशत नीचे निकलती है यद्यपि उसका नाभिकीय आवेश एक अधिक है। अब दूसरी। नाइट्रोजन 2p³ है, और हुंड के नियम से वे तीन इलेक्ट्रॉन तीनों अलग p कक्षकों में एक-एक बैठते हैं, सबके चक्रण समांतर — अर्ध-भरा उपकोश, और असामान्य स्थिरता की व्यवस्था क्योंकि कोई दो इलेक्ट्रॉन कक्षक साझा नहीं करते और प्रतिकर्षण न्यूनतम रहता है। ऑक्सीजन 2p⁴ है, अतः उसके चौथे p इलेक्ट्रॉन के लिए कोई ख़ाली कक्षक नहीं बचा और उसे पहले से मौजूद किसी एक के साथ जोड़ी बनानी पड़ती है। एक ही छोटे कक्षक में दो इलेक्ट्रॉन एक-दूसरे को प्रबलता से प्रतिकर्षित करते हैं, और वह प्रतिकर्षण-ऊर्जा पहले ही 'चुकाई जा चुकी' है। जोड़ी में से एक को हटाने पर वह वापस मिलती है, अतः ऑक्सीजन नाइट्रोजन की तुलना में इलेक्ट्रॉन अधिक तत्परता से सौंप देता है, और उसकी पहली आयनन एन्थैल्पी नीचे गिर जाती है। दोनों स्थितियों में तर्क का आकार ध्यान दो। सामान्य प्रवृत्ति आवर्त में प्रभावी नाभिकीय आवेश के लगातार बढ़ने से आती है; गिरावटें कक्षकों और चक्रण की सूक्ष्म संरचना से। दो प्रभाव, दो पैमाने, और छोटा वाला कभी-कभी बड़े को कुछ प्रतिशत से उलट देता है। अच्छा भौतिक सिद्धांत ठीक ऐसा ही दिखता है — एक प्रधान पद और सुधार, हर एक का अपना कारण। दो समापन बिंदु। पहला, वही दोनों गिरावटें आवर्त 3 में ऐलुमिनियम और सल्फ़र पर दोहराती हैं, और उन्हीं कारणों से; सचमुच विसंगत परिणाम समय पर नहीं दोहराता। दूसरा, जो अर्ध-भरी स्थिरता ऑक्सीजन का मान गिराती है वही प्रभाव क्रोमियम को ऑफ़बाउ-अपेक्षित 3d⁴4s² के बजाय 3d⁵4s¹ अपनाने देता है — इलेक्ट्रॉन विन्यास और आयनन प्रवृत्ति एक ही भौतिकी हैं, दो ओर से देखी गई। (तीसरा उत्तर ऐसी चिकनी वृद्धि की अपेक्षा करता है जिसकी भविष्यवाणी किसी सिद्धांत ने कभी नहीं की, और चौथा ऐसी त्रिज्या-वृद्धि गढ़ता है जिसका माप सीधा खंडन करता है।)",
          mr: "ज्या अपवादाचे भाकीत सिद्धांत करतो तो अपवादच नाही — ती अशी परीक्षा जी सिद्धांताने उत्तीर्ण केली — आणि या दोन्ही घटी उपकवच-चित्र बरोबर असल्याच्या सर्वोत्तम पुराव्यांपैकी. पहिली घ्या. बेरिलियम 1s²2s², म्हणून काढला जाणारा इलेक्ट्रॉन भरलेल्या 2s कक्षकातून येतो. बोरॉन 1s²2s²2p¹, आणि काढलेला इलेक्ट्रॉन एकटा 2p. दोन गोष्टी त्या 2p इलेक्ट्रॉनला वेगळे करणे सोपे करतात. तो सुरुवातीपासूनच उंच ऊर्जेच्या कक्षकात, आणि त्याला केवळ 1s गाभ्यानेच नव्हे तर खालच्या भरलेल्या 2s नेही आवरले, म्हणून तो जो परिणामी केंद्रकीय भार अनुभवतो तो कमी. दोन्ही परिणाम एकाच दिशेने ढकलतात, आणि बोरॉनची पहिली आयनीकरण एन्थाल्पी बेरिलियमहून सुमारे 3 टक्के खाली निघते जरी त्याचा केंद्रकीय भार एकने अधिक. आता दुसरी. नायट्रोजन 2p³, आणि हुंडच्या नियमाने ते तीन इलेक्ट्रॉन तिन्ही वेगळ्या p कक्षकांत एकेक बसतात, सर्वांची परिवलने समांतर — अर्ध-भरलेले उपकवच, आणि असामान्य स्थिरतेची मांडणी कारण कोणतेही दोन इलेक्ट्रॉन कक्षक वाटून घेत नाहीत आणि प्रतिकर्षण किमान राहते. ऑक्सिजन 2p⁴, म्हणून त्याच्या चौथ्या p इलेक्ट्रॉनसाठी कोणतेही रिकामे कक्षक उरले नाही आणि त्याला आधीच असलेल्या एकाशी जोडी करावी लागते. एकाच लहान कक्षकात दोन इलेक्ट्रॉन एकमेकांना जोरदार प्रतिकर्षित करतात, आणि ती प्रतिकर्षण-ऊर्जा आधीच 'भरलेली' आहे. जोडीतील एक काढल्यावर ती परत मिळते, म्हणून ऑक्सिजन नायट्रोजनच्या तुलनेत इलेक्ट्रॉन अधिक तत्परतेने सोपवतो, आणि त्याची पहिली आयनीकरण एन्थाल्पी खाली येते. दोन्ही स्थितींत युक्तिवादाचा आकार लक्षात घ्या. सर्वसाधारण कल आवर्तात परिणामी केंद्रकीय भार सतत वाढल्याने येतो; घटी कक्षके आणि परिवलनाच्या सूक्ष्म रचनेतून. दोन परिणाम, दोन मापे, आणि लहान कधीकधी मोठ्याला काही टक्क्यांनी उलटवतो. चांगला भौतिक सिद्धांत नेमका असाच दिसतो — एक प्रमुख पद अधिक दुरुस्त्या, प्रत्येकीचे स्वतःचे कारण. दोन समारोपाचे मुद्दे. पहिला, त्याच दोन्ही घटी आवर्त 3 मध्ये ॲल्युमिनियम आणि गंधकावर पुन्हा होतात, आणि त्याच कारणांनी; खरोखर विसंगत निकाल वेळेवर पुन्हा होत नाही. दुसरा, जी अर्ध-भरलेली स्थिरता ऑक्सिजनचे मूल्य घटवते तोच परिणाम क्रोमियमला ऑफबाऊ-अपेक्षित 3d⁴4s² ऐवजी 3d⁵4s¹ स्वीकारू देतो — इलेक्ट्रॉन विन्यास आणि आयनीकरण कल ही एकच भौतिकी, दोन बाजूंनी पाहिलेली. (तिसरे उत्तर अशा गुळगुळीत वाढीची अपेक्षा करते जिचे भाकीत कोणत्याही सिद्धांताने कधीच केले नाही, आणि चौथे अशी त्रिज्या-वाढ घडवते जिचे माप थेट खंडन करते.)",
        },
      },
      /*H3C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Chemical Bonding and Molecular Structure                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-chemical-bonding",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 4 — Chemical Bonding and Molecular Structure",
      hi: "अध्याय 4 — रासायनिक आबंधन तथा आण्विक संरचना",
      mr: "प्रकरण 4 — रासायनिक बंधन आणि रेणवीय संरचना",
    },
    name: {
      en: "Chemical Bonding and Molecular Structure",
      hi: "रासायनिक आबंधन तथा आण्विक संरचना",
      mr: "रासायनिक बंधन आणि रेणवीय संरचना",
    },
    summary: {
      en: "Why atoms join, and why the result has a shape. A rule of eight that is broken by half the periodic table and kept anyway because it works where it works, a shared pair pulled unequally so a bond has a direction, a prediction of geometry made by counting electron pairs and letting them get out of each other's way, orbitals mixed to make bonds that plain atomic orbitals could not, and a weak attraction that nonetheless decides why water is a liquid at all.",
      hi: "परमाणु जुड़ते क्यों हैं, और परिणाम का आकार क्यों होता है। आठ का वह नियम जिसे आधी आवर्त सारणी तोड़ती है और जो फिर भी रखा जाता है क्योंकि जहाँ चलता है वहाँ चलता है, वह साझा युग्म जो असमान रूप से खिंचता है और बंध को दिशा दे देता है, वह ज्यामिति-भविष्यवाणी जो इलेक्ट्रॉन-युग्म गिनकर और उन्हें एक-दूसरे से दूर हटने देकर की जाती है, वे मिश्रित कक्षक जो ऐसे बंध बनाते हैं जो सादे परमाण्विक कक्षक नहीं बना सकते थे, और वह दुर्बल आकर्षण जो फिर भी तय करता है कि पानी द्रव क्यों है।",
      mr: "अणू का जुळतात, आणि निकालाला आकार का असतो. आठाचा तो नियम जो अर्धी आवर्त सारणी मोडते आणि जो तरीही ठेवला जातो कारण जिथे चालतो तिथे चालतो, ती वाटलेली जोडी जी असमानपणे ओढली जाते आणि बंधाला दिशा देते, ते भूमिती-भाकीत जे इलेक्ट्रॉन-जोड्या मोजून आणि त्यांना एकमेकांपासून दूर सरकू देऊन केले जाते, ती मिश्रित कक्षके जी असे बंध बनवतात जे साधी अणुकक्षके बनवू शकली नसती, आणि ते दुर्बल आकर्षण जे तरीही पाणी द्रव का आहे हे ठरवते.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "octet-rule-and-exceptions",
        name: {
          en: "The octet rule and its exceptions",
          hi: "अष्टक नियम और उसके अपवाद",
          mr: "अष्टक नियम आणि त्याचे अपवाद",
        },
        kind: "rule",
        prompt: {
          en: "Atoms combine so as to reach eight electrons in the outer shell — except boron, which settles for six, and sulphur and phosphorus, which comfortably exceed eight. Which rule is this?",
          hi: "परमाणु इस तरह जुड़ते हैं कि बाहरी कोश में आठ इलेक्ट्रॉन हो जाएँ — सिवाय बोरॉन के, जो छह पर मान जाता है, और सल्फ़र तथा फ़ॉस्फ़ोरस के, जो आराम से आठ पार कर जाते हैं। यह कौन-सा नियम है?",
          mr: "अणू अशा प्रकारे जुळतात की बाहेरच्या कवचात आठ इलेक्ट्रॉन होतील — बोरॉन सोडून, जो सहावर समाधानी, आणि गंधक व स्फुरद सोडून, जे आरामात आठ ओलांडतात. हा कोणता नियम?",
        },
        statement: {
          en: "The octet rule says atoms bond so as to attain eight valence electrons, and it holds well for the second period but is routinely broken above and below it.",
          hi: "अष्टक नियम कहता है कि परमाणु आठ संयोजी इलेक्ट्रॉन पाने के लिए आबंधित होते हैं, और वह दूसरे आवर्त पर अच्छा चलता है पर उसके ऊपर और नीचे नित्य टूटता है।",
          mr: "अष्टक नियम सांगतो की अणू आठ संयुजा इलेक्ट्रॉन मिळवण्यासाठी बंध करतात, आणि तो दुसऱ्या आवर्तावर चांगला चालतो पण त्याच्या वर आणि खाली नेहमी मोडतो.",
        },
        detail: {
          en: "Elements from period 3 onwards have vacant d orbitals available, so sulphur can hold twelve electrons in SF₆ and phosphorus ten in PCl₅, which no second-period element can manage.",
          hi: "आवर्त 3 से आगे के तत्वों के पास ख़ाली d कक्षक उपलब्ध हैं, अतः सल्फ़र SF₆ में बारह इलेक्ट्रॉन और फ़ॉस्फ़ोरस PCl₅ में दस रख सकता है, जो दूसरे आवर्त का कोई तत्व नहीं कर सकता।",
          mr: "आवर्त 3 पासून पुढच्या मूलद्रव्यांकडे रिकामी d कक्षके उपलब्ध, म्हणून गंधक SF₆ मध्ये बारा इलेक्ट्रॉन आणि स्फुरद PCl₅ मध्ये दहा ठेवू शकतो, जे दुसऱ्या आवर्तातील कोणतेही मूलद्रव्य करू शकत नाही.",
        },
        extra: {
          en: "Molecules with an odd electron count — nitric oxide, nitrogen dioxide — cannot obey it at all, and they are correspondingly reactive, which is why NO is used as a signalling molecule in the body.",
          hi: "विषम इलेक्ट्रॉन-गिनती वाले अणु — नाइट्रिक ऑक्साइड, नाइट्रोजन डाइऑक्साइड — उसे मान ही नहीं सकते, और वे तदनुरूप क्रियाशील हैं, इसीलिए शरीर में NO संकेतक अणु के रूप में काम आता है।",
          mr: "विषम इलेक्ट्रॉन-मोजणीचे रेणू — नायट्रिक ऑक्साइड, नायट्रोजन डायऑक्साइड — तो पाळूच शकत नाहीत, आणि ते त्यानुसार क्रियाशील, म्हणूनच शरीरात NO संकेत-रेणू म्हणून वापरला जातो.",
        },
        pair: {
          left: {
            en: "Boron settling for six and sulphur taking twelve",
            hi: "छह पर मानता बोरॉन और बारह लेता सल्फ़र",
            mr: "सहावर समाधानी बोरॉन आणि बारा घेणारा गंधक",
          },
          right: {
            en: "the octet rule and its exceptions",
            hi: "अष्टक नियम और उसके अपवाद",
            mr: "अष्टक नियम आणि त्याचे अपवाद",
          },
        },
      },
      {
        id: "polar-covalent-bond",
        name: {
          en: "The polar covalent bond",
          hi: "ध्रुवीय सहसंयोजक बंध",
          mr: "ध्रुवीय सहसंयुज बंध",
        },
        kind: "rule",
        prompt: {
          en: "The pair is genuinely shared and yet it spends more of its time near one atom than the other, leaving one end slightly negative and the other slightly positive. Which kind of bond is this?",
          hi: "युग्म सचमुच साझा है और फिर भी वह अपना अधिक समय एक परमाणु के पास बिताता है, दूसरे के पास नहीं, जिससे एक सिरा थोड़ा ऋणात्मक और दूसरा थोड़ा धनात्मक रह जाता है। यह कौन-सा बंध है?",
          mr: "जोडी खरोखर वाटलेली आणि तरीही ती आपला अधिक वेळ एका अणूजवळ घालवते, दुसऱ्याजवळ नाही, ज्यामुळे एक टोक किंचित ऋण आणि दुसरे किंचित धन राहते. हा कोणत्या प्रकारचा बंध?",
        },
        statement: {
          en: "A polar covalent bond is a shared pair displaced towards the more electronegative atom, giving the bond a dipole moment and the molecule a direction of charge.",
          hi: "ध्रुवीय सहसंयोजक बंध ऐसा साझा युग्म है जो अधिक विद्युत्-ऋणात्मक परमाणु की ओर खिसका है, जिससे बंध को द्विध्रुव आघूर्ण और अणु को आवेश की एक दिशा मिलती है।",
          mr: "ध्रुवीय सहसंयुज बंध म्हणजे अधिक विद्युतऋण अणूकडे सरकलेली वाटलेली जोडी, ज्यातून बंधाला द्विध्रुव आघूर्ण आणि रेणूला भाराची दिशा मिळते.",
        },
        detail: {
          en: "Polar bonds do not always make a polar molecule: carbon dioxide has two strongly polar C=O bonds pointing in opposite directions, and their dipoles cancel exactly.",
          hi: "ध्रुवीय बंध सदा ध्रुवीय अणु नहीं बनाते: कार्बन डाइऑक्साइड में दो प्रबल ध्रुवीय C=O बंध विपरीत दिशाओं में हैं, और उनके द्विध्रुव ठीक-ठीक कट जाते हैं।",
          mr: "ध्रुवीय बंध नेहमी ध्रुवीय रेणू बनवत नाहीत: कार्बन डायऑक्साइडमध्ये दोन प्रबळ ध्रुवीय C=O बंध विरुद्ध दिशांना, आणि त्यांचे द्विध्रुव नेमके कापले जातात.",
        },
        extra: {
          en: "There is no sharp line between covalent and ionic: as the electronegativity difference grows the pair shifts further until it is effectively transferred, so the two bond types are the ends of one continuum.",
          hi: "सहसंयोजक और आयनिक के बीच कोई तीखी रेखा नहीं: विद्युत्-ऋणात्मकता अंतर बढ़ने पर युग्म और खिसकता जाता है जब तक वह प्रभावतः स्थानांतरित न हो जाए, अतः दोनों बंध-प्रकार एक ही सातत्य के सिरे हैं।",
          mr: "सहसंयुज आणि आयनिक यांच्यात तीक्ष्ण रेषा नाही: विद्युतऋणता फरक वाढताना जोडी अधिक सरकत जाते जोवर ती प्रत्यक्षात हस्तांतरित होत नाही, म्हणून दोन्ही बंध-प्रकार एकाच सातत्याची टोके.",
        },
        pair: {
          left: {
            en: "Two polar bonds and a molecule with no dipole",
            hi: "दो ध्रुवीय बंध और बिना द्विध्रुव वाला अणु",
            mr: "दोन ध्रुवीय बंध आणि द्विध्रुवाविना रेणू",
          },
          right: {
            en: "the polar covalent bond",
            hi: "ध्रुवीय सहसंयोजक बंध",
            mr: "ध्रुवीय सहसंयुज बंध",
          },
        },
      },
      {
        id: "vsepr-and-shape",
        name: {
          en: "VSEPR and molecular shape",
          hi: "VSEPR और आण्विक आकार",
          mr: "VSEPR आणि रेणवीय आकार",
        },
        kind: "geometry",
        prompt: {
          en: "Count the electron pairs around the central atom, let them push each other as far apart as they can, and the shape of the molecule falls out — with lone pairs pushing harder than bonding ones. Which model is this?",
          hi: "केंद्रीय परमाणु के इर्द-गिर्द इलेक्ट्रॉन-युग्म गिनो, उन्हें जितना दूर हट सकें उतना एक-दूसरे को धकेलने दो, और अणु का आकार निकल आता है — और एकाकी युग्म आबंधी युग्मों से अधिक ज़ोर से धकेलते हैं। यह कौन-सा निदर्श है?",
          mr: "केंद्रीय अणूभोवतीच्या इलेक्ट्रॉन-जोड्या मोजा, त्यांना जितके दूर सरकता येईल तितके एकमेकांना ढकलू द्या, आणि रेणूचा आकार निघतो — आणि एकाकी जोड्या बंधकारी जोड्यांहून अधिक जोराने ढकलतात. हे कोणते प्रतिरूप?",
        },
        statement: {
          en: "VSEPR predicts molecular shape by arranging the electron pairs around a central atom to minimise repulsion, and it treats lone pairs as repelling more strongly than bonding pairs.",
          hi: "VSEPR केंद्रीय परमाणु के इर्द-गिर्द इलेक्ट्रॉन-युग्मों को इस तरह जमाकर आण्विक आकार बताता है कि प्रतिकर्षण न्यूनतम हो, और वह एकाकी युग्मों को आबंधी युग्मों से अधिक प्रबल प्रतिकर्षक मानता है।",
          mr: "VSEPR केंद्रीय अणूभोवतीच्या इलेक्ट्रॉन-जोड्या प्रतिकर्षण किमान होईल अशा मांडून रेणवीय आकार सांगते, आणि ते एकाकी जोड्यांना बंधकारी जोड्यांहून अधिक प्रबळ प्रतिकर्षक मानते.",
        },
        detail: {
          en: "That extra push explains a whole family of bent shapes: methane's four bonding pairs give 109.5°, ammonia's three bonds and one lone pair narrow it to 107°, and water's two lone pairs to 104.5°.",
          hi: "वह अतिरिक्त धक्का मुड़े आकारों का पूरा कुनबा समझाता है: मेथेन के चार आबंधी युग्म 109.5° देते हैं, अमोनिया के तीन बंध और एक एकाकी युग्म उसे 107° तक सँकरा करते हैं, और पानी के दो एकाकी युग्म 104.5° तक।",
          mr: "तो जादा रेटा वाकड्या आकारांचे अख्खे कुटुंब समजावतो: मिथेनच्या चार बंधकारी जोड्या 109.5° देतात, अमोनियाचे तीन बंध आणि एक एकाकी जोडी तो 107° पर्यंत अरुंद करतात, आणि पाण्याच्या दोन एकाकी जोड्या 104.5° पर्यंत.",
        },
        extra: {
          en: "It is a rule of thumb with no underlying equation, and it fails for some transition-metal compounds — but for main-group molecules it predicts shapes correctly with nothing more than a count on the fingers.",
          hi: "यह बिना किसी अंतर्निहित समीकरण का अंगूठा-नियम है, और कुछ संक्रमण-धातु यौगिकों पर विफल होता है — पर मुख्य-वर्ग अणुओं के लिए वह उँगलियों पर गिनती भर से आकार ठीक बता देता है।",
          mr: "हा कोणत्याही अंतर्निहित समीकरणाविना अंगठा-नियम, आणि काही संक्रमण-धातू संयुगांवर अपयशी ठरतो — पण मुख्य-गट रेणूंसाठी तो बोटांवर मोजण्याइतक्यानेच आकार बरोबर सांगतो.",
        },
        pair: {
          left: {
            en: "Lone pairs shouldering the bonds closer together",
            hi: "बंधों को पास सरकाते एकाकी युग्म",
            mr: "बंधांना जवळ सरकवणाऱ्या एकाकी जोड्या",
          },
          right: {
            en: "VSEPR and molecular shape",
            hi: "VSEPR और आण्विक आकार",
            mr: "VSEPR आणि रेणवीय आकार",
          },
        },
      },
      {
        id: "hybridisation",
        name: {
          en: "Hybridisation",
          hi: "संकरण",
          mr: "संकरण",
        },
        kind: "geometry",
        prompt: {
          en: "Carbon's ground state has only two unpaired electrons and yet it forms four identical bonds in methane, all at the same angle — because one s and three p orbitals are mixed into four equivalent ones. Which idea is this?",
          hi: "कार्बन की मूल अवस्था में केवल दो अयुग्मित इलेक्ट्रॉन हैं, फिर भी वह मेथेन में चार एक-से बंध बनाता है, सब एक ही कोण पर — क्योंकि एक s और तीन p कक्षक मिलकर चार समतुल्य कक्षक बन जाते हैं। यह कौन-सा विचार है?",
          mr: "कार्बनच्या मूळ अवस्थेत केवळ दोन अयुग्मित इलेक्ट्रॉन आहेत, तरीही तो मिथेनमध्ये चार सारखे बंध बनवतो, सर्व एकाच कोनावर — कारण एक s आणि तीन p कक्षके मिळून चार समतुल्य कक्षके बनतात. ही कोणती कल्पना?",
        },
        statement: {
          en: "Hybridisation mixes atomic orbitals of similar energy into an equal number of new equivalent orbitals, which point in the directions the observed geometry requires.",
          hi: "संकरण समान ऊर्जा के परमाण्विक कक्षकों को मिलाकर उतने ही नए समतुल्य कक्षक बनाता है, जो उन दिशाओं में इंगित करते हैं जो प्रेक्षित ज्यामिति माँगती है।",
          mr: "संकरण समान ऊर्जेची अणुकक्षके मिसळून तितकीच नवी समतुल्य कक्षके बनवते, जी निरीक्षित भूमिती मागते त्या दिशांना निर्देश करतात.",
        },
        detail: {
          en: "The count of hybrid orbitals fixes the shape directly: sp gives linear at 180°, sp² trigonal planar at 120° and sp³ tetrahedral at 109.5°.",
          hi: "संकर कक्षकों की गिनती आकार सीधे तय करती है: sp 180° पर रैखिक देता है, sp² 120° पर त्रिकोणीय समतलीय और sp³ 109.5° पर चतुष्फलकीय।",
          mr: "संकर कक्षकांची मोजणी आकार थेट ठरवते: sp 180° वर रेषीय देते, sp² 120° वर त्रिकोणी प्रतलीय आणि sp³ 109.5° वर चतुष्फलकी.",
        },
        extra: {
          en: "In a double bond only the hybrids form the sigma framework while the leftover unhybridised p orbitals overlap sideways to make the pi bond, which is why a C=C cannot be twisted without breaking it.",
          hi: "द्विबंध में केवल संकर सिग्मा ढाँचा बनाते हैं जबकि बचे असंकरित p कक्षक बग़ल से अतिव्यापन कर पाई बंध बनाते हैं, इसीलिए C=C को बिना तोड़े मरोड़ा नहीं जा सकता।",
          mr: "द्विबंधात केवळ संकर सिग्मा सांगाडा बनवतात तर उरलेली असंकरित p कक्षके बाजूने अतिव्यापन करून पाय बंध बनवतात, म्हणूनच C=C न तोडता पिळता येत नाही.",
        },
        pair: {
          left: {
            en: "Two unpaired electrons making four identical bonds",
            hi: "दो अयुग्मित इलेक्ट्रॉन, चार एक-से बंध",
            mr: "दोन अयुग्मित इलेक्ट्रॉन, चार सारखे बंध",
          },
          right: {
            en: "hybridisation",
            hi: "संकरण",
            mr: "संकरण",
          },
        },
      },
      {
        id: "hydrogen-bond",
        name: {
          en: "The hydrogen bond",
          hi: "हाइड्रोजन बंध",
          mr: "हायड्रोजन बंध",
        },
        kind: "force",
        prompt: {
          en: "Water boils at 100 °C while hydrogen sulphide, a heavier molecule of the same shape, boils at −60 °C — because one of them can form a weak directional link between its own molecules. Which attraction is this?",
          hi: "पानी 100 °C पर उबलता है जबकि हाइड्रोजन सल्फ़ाइड, उसी आकार का भारी अणु, −60 °C पर — क्योंकि उनमें से एक अपने ही अणुओं के बीच दुर्बल दिशात्मक कड़ी बना सकता है। यह कौन-सा आकर्षण है?",
          mr: "पाणी 100 °C वर उकळते तर हायड्रोजन सल्फाइड, त्याच आकाराचा जड रेणू, −60 °C वर — कारण त्यांपैकी एक स्वतःच्याच रेणूंमध्ये दुर्बल दिशात्मक दुवा बनवू शकतो. हे कोणते आकर्षण?",
        },
        statement: {
          en: "A hydrogen bond forms when hydrogen already bonded to nitrogen, oxygen or fluorine is attracted to a lone pair on another such atom, and it is far weaker than a covalent bond but far stronger than ordinary dispersion forces.",
          hi: "हाइड्रोजन बंध तब बनता है जब नाइट्रोजन, ऑक्सीजन या फ़्लुओरीन से पहले से बँधा हाइड्रोजन ऐसे ही किसी दूसरे परमाणु के एकाकी युग्म की ओर आकर्षित हो, और वह सहसंयोजक बंध से कहीं दुर्बल पर साधारण परिक्षेपण बलों से कहीं प्रबल है।",
          mr: "हायड्रोजन बंध तेव्हा तयार होतो जेव्हा नायट्रोजन, ऑक्सिजन वा फ्लोरिनशी आधीच बांधलेला हायड्रोजन अशाच दुसऱ्या अणूवरील एकाकी जोडीकडे आकर्षित होतो, आणि तो सहसंयुज बंधाहून कितीतरी दुर्बल पण सामान्य विकिरण बलांहून कितीतरी प्रबळ.",
        },
        detail: {
          en: "It is the reason ice floats: the bonds hold the molecules in an open hexagonal lattice with more empty space than the liquid has, so freezing makes water expand.",
          hi: "इसी से बर्फ़ तैरती है: बंध अणुओं को ऐसे खुले षट्कोणीय जालक में थामे रखते हैं जिसमें द्रव से अधिक ख़ाली जगह है, अतः जमने पर पानी फैलता है।",
          mr: "यामुळेच बर्फ तरंगतो: बंध रेणूंना अशा मोकळ्या षट्कोनी जालकात धरतात ज्यात द्रवाहून अधिक रिकामी जागा, म्हणून गोठताना पाणी प्रसरण पावते.",
        },
        extra: {
          en: "It also holds the two strands of DNA together, weakly enough to be unzipped by an enzyme and specifically enough that each base pairs only with its partner.",
          hi: "यही DNA की दोनों लड़ियों को साथ थामे रहता है, इतना दुर्बल कि एंज़ाइम उन्हें खोल दे और इतना विशिष्ट कि हर क्षारक केवल अपने साथी से ही जोड़ी बनाए।",
          mr: "हाच DNA च्या दोन्ही धाग्यांना एकत्र धरतो, इतका दुर्बल की विकर त्यांना उलगडेल आणि इतका विशिष्ट की प्रत्येक क्षार केवळ आपल्या जोडीदाराशीच जोडी करेल.",
        },
        pair: {
          left: {
            en: "A hundred and sixty degrees of boiling point",
            hi: "क्वथनांक के एक सौ साठ डिग्री",
            mr: "उकळबिंदूचे एकशे साठ अंश",
          },
          right: {
            en: "the hydrogen bond",
            hi: "हाइड्रोजन बंध",
            mr: "हायड्रोजन बंध",
          },
        },
      },
      {
        id: "bond-order-and-length",
        name: {
          en: "Bond order and bond length",
          hi: "बंध कोटि और बंध लंबाई",
          mr: "बंध कोटी आणि बंध लांबी",
        },
        kind: "force",
        prompt: {
          en: "The carbon–carbon distance falls from 154 pm in ethane to 134 pm in ethene and 120 pm in ethyne, and the energy needed to break it rises correspondingly at every step. Which pair of quantities is this?",
          hi: "कार्बन-कार्बन दूरी एथेन के 154 pm से घटकर एथीन में 134 pm और एथाइन में 120 pm हो जाती है, और उसे तोड़ने को चाहिए ऊर्जा हर चरण पर तदनुरूप बढ़ती है। यह कौन-सी राशि-जोड़ी है?",
          mr: "कार्बन-कार्बन अंतर इथेनच्या 154 pm वरून इथीनमध्ये 134 pm आणि इथाइनमध्ये 120 pm होते, आणि तो तोडायला लागणारी ऊर्जा प्रत्येक टप्प्यावर त्यानुसार वाढते. ही कोणती राशी-जोडी?",
        },
        statement: {
          en: "Bond order is the number of shared pairs between two atoms, and a higher bond order always means a shorter and stronger bond between the same pair of elements.",
          hi: "बंध कोटि दो परमाणुओं के बीच साझा युग्मों की संख्या है, और उन्हीं दो तत्वों के बीच ऊँची बंध कोटि सदा छोटे और प्रबल बंध का अर्थ रखती है।",
          mr: "बंध कोटी म्हणजे दोन अणूंमधल्या वाटलेल्या जोड्यांची संख्या, आणि त्याच दोन मूलद्रव्यांमध्ये उच्च बंध कोटी नेहमी लहान आणि प्रबळ बंधाचा अर्थ राखते.",
        },
        detail: {
          en: "Molecular orbital theory lets it be fractional and even predicts species with a bond order of one half, and it explains why O₂ is paramagnetic when every Lewis structure says it should not be.",
          hi: "आण्विक कक्षक सिद्धांत उसे भिन्नात्मक होने देता है और आधे बंध कोटि वाली स्पीशीज़ तक बता देता है, और वह समझाता है कि O₂ अनुचुंबकीय क्यों है जबकि हर लूइस संरचना कहती है कि उसे नहीं होना चाहिए।",
          mr: "रेणवीय कक्षक सिद्धांत तिला अपूर्णांकी होऊ देतो आणि अर्ध्या बंध कोटीच्या प्रजाती सांगतो, आणि तो समजावतो की O₂ अनुचुंबकीय का आहे तर प्रत्येक लुईस संरचना सांगते की तो असू नये.",
        },
        extra: {
          en: "In benzene the six carbon–carbon bonds are all 139 pm — between a single and a double — because the pi electrons are delocalised over the whole ring rather than sitting in three fixed double bonds.",
          hi: "बेंज़ीन में छहों कार्बन-कार्बन बंध 139 pm के हैं — एकल और द्विबंध के बीच — क्योंकि पाई इलेक्ट्रॉन तीन नियत द्विबंधों में बैठने के बजाय पूरे वलय पर विस्थानीकृत हैं।",
          mr: "बेंझिनमध्ये सहाही कार्बन-कार्बन बंध 139 pm चे — एकेरी आणि द्विबंधाच्या मध्ये — कारण पाय इलेक्ट्रॉन तीन ठरलेल्या द्विबंधांत बसण्याऐवजी अख्ख्या वलयावर विस्थानित आहेत.",
        },
        pair: {
          left: {
            en: "Six benzene bonds all the same and none of them either",
            hi: "बेंज़ीन के छहों बंध एक-से, और कोई भी दोनों में से नहीं",
            mr: "बेंझिनचे सहाही बंध सारखे, आणि कोणताही दोहोंपैकी नाही",
          },
          right: {
            en: "bond order and bond length",
            hi: "बंध कोटि और बंध लंबाई",
            mr: "बंध कोटी आणि बंध लांबी",
          },
        },
      },
      /*F4C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Carbon dioxide and water each contain two strongly polar bonds to oxygen. Carbon dioxide has no dipole moment at all and water has a large one. A student says the difference must be in the bond polarities. Explain what actually differs.",
          hi: "कार्बन डाइऑक्साइड और पानी दोनों में ऑक्सीजन से दो प्रबल ध्रुवीय बंध हैं। कार्बन डाइऑक्साइड का कोई द्विध्रुव आघूर्ण नहीं और पानी का बड़ा है। एक विद्यार्थी कहता है कि भेद बंध-ध्रुवताओं में होगा। समझाओ वस्तुतः भिन्न क्या है।",
          mr: "कार्बन डायऑक्साइड आणि पाणी दोघांतही ऑक्सिजनशी दोन प्रबळ ध्रुवीय बंध आहेत. कार्बन डायऑक्साइडला द्विध्रुव आघूर्ण मुळीच नाही आणि पाण्याला मोठा आहे. एक विद्यार्थी म्हणतो की फरक बंध-ध्रुवतांत असावा. प्रत्यक्षात वेगळे काय ते समजावा.",
        },
        choices: [
          {
            en: "The bond polarities are similar; the shapes are not. Carbon dioxide is linear, so its two bond dipoles point in exactly opposite directions and cancel to zero. Water is bent at 104.5°, because oxygen carries two lone pairs that push the bonds together, so its two dipoles add to a large resultant. Dipole moment is a vector sum, and geometry decides it — which is why a measured dipole moment is itself evidence about shape",
            hi: "बंध-ध्रुवताएँ मिलती-जुलती हैं; आकार नहीं। कार्बन डाइऑक्साइड रैखिक है, अतः उसके दो बंध-द्विध्रुव ठीक विपरीत दिशाओं में हैं और कटकर शून्य हो जाते हैं। पानी 104.5° पर मुड़ा है, क्योंकि ऑक्सीजन दो एकाकी युग्म ढोता है जो बंधों को पास धकेलते हैं, अतः उसके दो द्विध्रुव जुड़कर बड़ा परिणामी देते हैं। द्विध्रुव आघूर्ण सदिश योग है, और उसे ज्यामिति तय करती है — इसीलिए नापा गया द्विध्रुव आघूर्ण स्वयं आकार के बारे में प्रमाण है",
            mr: "बंध-ध्रुवता सारख्या आहेत; आकार नाहीत. कार्बन डायऑक्साइड रेषीय, म्हणून त्याचे दोन बंध-द्विध्रुव नेमक्या विरुद्ध दिशांना आणि कापले जाऊन शून्य होतात. पाणी 104.5° वर वाकडे, कारण ऑक्सिजन दोन एकाकी जोड्या वाहतो ज्या बंधांना जवळ ढकलतात, म्हणून त्याचे दोन द्विध्रुव जोडून मोठा परिणामी देतात. द्विध्रुव आघूर्ण ही सदिश बेरीज, आणि तिला भूमिती ठरवते — म्हणूनच मोजलेला द्विध्रुव आघूर्ण स्वतः आकाराबद्दलचा पुरावा",
          },
          {
            en: "The student is right: the C=O bonds must be non-polar, since two polar bonds could never give a molecule with no dipole",
            hi: "विद्यार्थी सही है: C=O बंध अध्रुवीय होंगे, क्योंकि दो ध्रुवीय बंध कभी बिना द्विध्रुव वाला अणु नहीं दे सकते",
            mr: "विद्यार्थी बरोबर: C=O बंध अध्रुवीय असणार, कारण दोन ध्रुवीय बंध कधीच द्विध्रुवाविना रेणू देऊ शकत नाहीत",
          },
          {
            en: "Carbon dioxide has more atoms, and dipole moments always fall as a molecule gets larger",
            hi: "कार्बन डाइऑक्साइड में अधिक परमाणु हैं, और अणु बड़ा होने पर द्विध्रुव आघूर्ण सदा घटता है",
            mr: "कार्बन डायऑक्साइडमध्ये अधिक अणू आहेत, आणि रेणू मोठा होताना द्विध्रुव आघूर्ण नेहमी घटतो",
          },
          {
            en: "Water's dipole comes entirely from its lone pairs, and its two O–H bonds contribute nothing at all",
            hi: "पानी का द्विध्रुव पूरी तरह उसके एकाकी युग्मों से आता है, और उसके दो O–H बंध कुछ भी योगदान नहीं देते",
            mr: "पाण्याचा द्विध्रुव पूर्णपणे त्याच्या एकाकी जोड्यांतून येतो, आणि त्याचे दोन O–H बंध काहीही वाटा देत नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The premise the student rejects is true, and rejecting it is what leads them astray. Both C=O bonds in carbon dioxide are strongly polar: oxygen at 3.5 on the Pauling scale against carbon at 2.5 gives a difference of 1.0, comparable to water's O–H difference of 1.4. Neither bond is anything like non-polar. What differs is the geometry, and the reason for it is VSEPR. Carbon in CO₂ has two regions of electron density around it — the two double bonds — and no lone pairs, so they arrange at 180° and the molecule is linear. Oxygen in water has four regions: two bonding pairs and two lone pairs. Four regions arrange tetrahedrally, and with two of the positions occupied by lone pairs the two O–H bonds are left at 104.5° rather than 180°. Now add the dipoles as vectors, because that is what they are. In CO₂ two equal arrows point directly away from each other and the resultant is exactly zero — the molecule is non-polar despite having the more polar-looking formula. In water two equal arrows meet at 104.5°, and the resultant bisects that angle with a magnitude of about 1.85 D, one of the larger dipole moments among small molecules. This is not a curiosity. Water's polarity is why it dissolves salts and why it has a high boiling point; carbon dioxide's lack of polarity is why it is a gas at room temperature and why it dissolves in water only sparingly. Two habits follow. First, always ask about shape before pronouncing on polarity: BF₃ and NH₃ both have three polar bonds, and BF₃ is trigonal planar and non-polar while NH₃ is pyramidal and strongly polar, entirely because boron has no lone pair and nitrogen has one. Second, the inference runs both ways. A measured dipole moment of zero for a molecule with polar bonds is direct evidence of a symmetric shape, and that is how the linearity of CO₂ and the tetrahedral symmetry of CCl₄ were established before any diffraction experiment could see them. (The fourth answer is worth naming: lone pairs do contribute to a molecular dipole, but the O–H bonds contribute the larger share, and no dipole survives if the bond contributions cancel.)",
          hi: "जिस मान्यता को विद्यार्थी नकारता है वह सच है, और उसे नकारना ही उसे भटका देता है। कार्बन डाइऑक्साइड के दोनों C=O बंध प्रबल ध्रुवीय हैं: पॉलिंग पैमाने पर ऑक्सीजन 3.5 के सामने कार्बन 2.5, यानी 1.0 का अंतर, जो पानी के O–H अंतर 1.4 के तुल्य है। कोई भी बंध अध्रुवीय जैसा नहीं। भिन्न है ज्यामिति, और उसका कारण VSEPR है। CO₂ में कार्बन के इर्द-गिर्द इलेक्ट्रॉन-घनत्व के दो क्षेत्र हैं — दो द्विबंध — और कोई एकाकी युग्म नहीं, अतः वे 180° पर जमते हैं और अणु रैखिक है। पानी में ऑक्सीजन के चार क्षेत्र हैं: दो आबंधी युग्म और दो एकाकी। चार क्षेत्र चतुष्फलकीय जमते हैं, और दो स्थान एकाकी युग्मों के घेरने से दोनों O–H बंध 180° के बजाय 104.5° पर बचते हैं। अब द्विध्रुवों को सदिशों की तरह जोड़ो, क्योंकि वे यही हैं। CO₂ में दो बराबर तीर सीधे एक-दूसरे से दूर इंगित करते हैं और परिणामी ठीक शून्य है — अणु अध्रुवीय है यद्यपि उसका सूत्र अधिक ध्रुवीय दिखता है। पानी में दो बराबर तीर 104.5° पर मिलते हैं, और परिणामी उस कोण को समद्विभाजित करता है, परिमाण लगभग 1.85 D, छोटे अणुओं में बड़े द्विध्रुव आघूर्णों में से एक। यह कोई कौतुक नहीं। पानी की ध्रुवता ही उससे लवण घुलवाती है और उसे ऊँचा क्वथनांक देती है; कार्बन डाइऑक्साइड की अध्रुवता ही उसे कमरे के ताप पर गैस रखती है और पानी में उसे बहुत कम घुलने देती है। दो आदतें निकलती हैं। पहली, ध्रुवता पर फ़ैसला सुनाने से पहले सदा आकार पूछो: BF₃ और NH₃ दोनों में तीन ध्रुवीय बंध हैं, और BF₃ त्रिकोणीय समतलीय तथा अध्रुवीय है जबकि NH₃ पिरामिडी तथा प्रबल ध्रुवीय, पूरी तरह इसलिए कि बोरॉन के पास एकाकी युग्म नहीं और नाइट्रोजन के पास एक है। दूसरी, अनुमान दोनों ओर चलता है। ध्रुवीय बंधों वाले अणु का नापा गया शून्य द्विध्रुव आघूर्ण सममित आकार का सीधा प्रमाण है, और इसी से CO₂ की रैखिकता तथा CCl₄ की चतुष्फलकीय सममिति किसी विवर्तन प्रयोग के उन्हें देखने से पहले ही स्थापित हो गई थीं। (चौथा उत्तर नाम लेने योग्य है: एकाकी युग्म आण्विक द्विध्रुव में योगदान देते ही हैं, पर बड़ा हिस्सा O–H बंध देते हैं, और बंधों का योगदान कट जाए तो कोई द्विध्रुव नहीं बचता।)",
          mr: "विद्यार्थी जे गृहीतक नाकारतो ते खरे आहे, आणि ते नाकारणेच त्याला भरकटवते. कार्बन डायऑक्साइडचे दोन्ही C=O बंध प्रबळ ध्रुवीय: पॉलिंग मापनश्रेणीवर ऑक्सिजन 3.5 समोर कार्बन 2.5, म्हणजे 1.0 चा फरक, जो पाण्याच्या O–H फरक 1.4 शी तुलनायोग्य. कोणताही बंध अध्रुवीयसारखा नाही. वेगळी आहे भूमिती, आणि तिचे कारण VSEPR. CO₂ मध्ये कार्बनभोवती इलेक्ट्रॉन-घनतेचे दोन प्रदेश — दोन द्विबंध — आणि कोणतीही एकाकी जोडी नाही, म्हणून ते 180° वर मांडतात आणि रेणू रेषीय. पाण्यात ऑक्सिजनचे चार प्रदेश: दोन बंधकारी जोड्या आणि दोन एकाकी. चार प्रदेश चतुष्फलकी मांडतात, आणि दोन जागा एकाकी जोड्यांनी व्यापल्याने दोन्ही O–H बंध 180° ऐवजी 104.5° वर उरतात. आता द्विध्रुव सदिशांसारखे जोडा, कारण ते तेच आहेत. CO₂ मध्ये दोन समान बाण थेट एकमेकांपासून दूर निर्देश करतात आणि परिणामी नेमका शून्य — रेणू अध्रुवीय जरी त्याचे सूत्र अधिक ध्रुवीय दिसते तरी. पाण्यात दोन समान बाण 104.5° वर भेटतात, आणि परिणामी तो कोन दुभागतो, परिमाण सुमारे 1.85 D, लहान रेणूंतील मोठ्या द्विध्रुव आघूर्णांपैकी एक. हे कुतूहल नव्हे. पाण्याची ध्रुवता हीच त्यातून क्षार विरघळवते आणि त्याला उच्च उकळबिंदू देते; कार्बन डायऑक्साइडची अध्रुवता हीच त्याला खोलीच्या तापमानावर वायू ठेवते आणि पाण्यात त्याला फारच कमी विरघळू देते. दोन सवयी निघतात. पहिली, ध्रुवतेवर निवाडा देण्याआधी नेहमी आकार विचारा: BF₃ आणि NH₃ दोघांतही तीन ध्रुवीय बंध, आणि BF₃ त्रिकोणी प्रतलीय व अध्रुवीय तर NH₃ पिरॅमिडी व प्रबळ ध्रुवीय, पूर्णपणे यामुळे की बोरॉनकडे एकाकी जोडी नाही आणि नायट्रोजनकडे एक आहे. दुसरी, अनुमान दोन्ही बाजूंनी चालते. ध्रुवीय बंध असलेल्या रेणूचा मोजलेला शून्य द्विध्रुव आघूर्ण हा सममित आकाराचा थेट पुरावा, आणि यामुळेच CO₂ ची रेषीयता आणि CCl₄ ची चतुष्फलकी सममिती कोणत्याही विवर्तन प्रयोगाने त्या पाहण्याआधीच प्रस्थापित झाल्या. (चौथे उत्तर नाव घेण्याजोगे: एकाकी जोड्या रेणवीय द्विध्रुवात वाटा देतातच, पण मोठा वाटा O–H बंध देतात, आणि बंधांचा वाटा कापला गेल्यास कोणताही द्विध्रुव उरत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Every Lewis structure of O₂ shows a double bond with all electrons paired, which predicts the molecule should be diamagnetic. Liquid oxygen is in fact drawn strongly to a magnet. Explain the discrepancy and what resolves it.",
          hi: "O₂ की हर लूइस संरचना सब इलेक्ट्रॉनों को युग्मित दिखाते हुए द्विबंध दिखाती है, जिससे अनुमान लगता है कि अणु प्रतिचुंबकीय होगा। द्रव ऑक्सीजन वस्तुतः चुंबक की ओर प्रबलता से खिंचती है। विसंगति और उसका समाधान समझाओ।",
          mr: "O₂ ची प्रत्येक लुईस संरचना सर्व इलेक्ट्रॉन युग्मित दाखवत द्विबंध दाखवते, ज्यातून अनुमान निघते की रेणू प्रतिचुंबकीय असावा. द्रव ऑक्सिजन प्रत्यक्षात चुंबकाकडे जोरदार ओढला जातो. विसंगती आणि तिचे निराकरण समजावा.",
        },
        choices: [
          {
            en: "Lewis structures cannot represent O₂ correctly. Molecular orbital theory fills the molecule's own orbitals in energy order, and the last two electrons go singly into two degenerate pi-antibonding orbitals with parallel spins, exactly as Hund's rule requires. That leaves two unpaired electrons, which makes O₂ paramagnetic, while the bond order still comes out as (10 − 6)/2 = 2, agreeing with the double bond. The paramagnetism was one of the first decisive successes of MO theory over the Lewis picture",
            hi: "लूइस संरचनाएँ O₂ का सही निरूपण कर ही नहीं सकतीं। आण्विक कक्षक सिद्धांत अणु के अपने कक्षकों को ऊर्जा-क्रम में भरता है, और अंतिम दो इलेक्ट्रॉन दो अपभ्रष्ट पाई-प्रतिआबंधी कक्षकों में एक-एक जाते हैं, समांतर चक्रणों के साथ, ठीक जैसा हुंड का नियम माँगता है। इससे दो अयुग्मित इलेक्ट्रॉन बचते हैं, जो O₂ को अनुचुंबकीय बनाते हैं, जबकि बंध कोटि फिर भी (10 − 6)/2 = 2 निकलती है, जो द्विबंध से मेल खाती है। यह अनुचुंबकत्व लूइस चित्र पर आण्विक कक्षक सिद्धांत की पहली निर्णायक सफलताओं में से एक था",
            mr: "लुईस संरचना O₂ चे बरोबर निरूपण करूच शकत नाहीत. रेणवीय कक्षक सिद्धांत रेणूची स्वतःची कक्षके ऊर्जा-क्रमाने भरतो, आणि शेवटचे दोन इलेक्ट्रॉन दोन अपभ्रष्ट पाय-प्रतिबंधकारी कक्षकांत एकेक जातात, समांतर परिवलनांसह, नेमके जसे हुंडचा नियम मागतो. यातून दोन अयुग्मित इलेक्ट्रॉन उरतात, जे O₂ ला अनुचुंबकीय बनवतात, तर बंध कोटी तरीही (10 − 6)/2 = 2 निघते, जी द्विबंधाशी जुळते. हे अनुचुंबकत्व लुईस चित्रावर रेणवीय कक्षक सिद्धांताच्या पहिल्या निर्णायक यशांपैकी एक होते",
          },
          {
            en: "The observation is mistaken: liquid oxygen is not attracted to a magnet, and the apparent attraction is due to impurities of iron",
            hi: "प्रेक्षण ग़लत है: द्रव ऑक्सीजन चुंबक की ओर नहीं खिंचती, और आभासी आकर्षण लोहे की अशुद्धियों से है",
            mr: "निरीक्षण चुकीचे: द्रव ऑक्सिजन चुंबकाकडे ओढला जात नाही, आणि आभासी आकर्षण लोखंडाच्या अशुद्धींमुळे",
          },
          {
            en: "O₂ actually has a single bond with two unpaired electrons, so the double bond in Lewis structures is simply wrong",
            hi: "O₂ में वस्तुतः दो अयुग्मित इलेक्ट्रॉनों के साथ एकल बंध है, अतः लूइस संरचनाओं का द्विबंध बस ग़लत है",
            mr: "O₂ मध्ये प्रत्यक्षात दोन अयुग्मित इलेक्ट्रॉनांसह एकेरी बंध आहे, म्हणून लुईस संरचनांतील द्विबंध फक्त चूक आहे",
          },
          {
            en: "The paramagnetism comes from the oxygen nuclei rather than from its electrons, so no electronic model needs changing",
            hi: "अनुचुंबकत्व इलेक्ट्रॉनों से नहीं बल्कि ऑक्सीजन के नाभिकों से आता है, अतः किसी इलेक्ट्रॉनिक निदर्श को बदलने की ज़रूरत नहीं",
            mr: "अनुचुंबकत्व इलेक्ट्रॉनांकडून नव्हे तर ऑक्सिजनच्या केंद्रकांकडून येते, म्हणून कोणतेही इलेक्ट्रॉनिक प्रतिरूप बदलण्याची गरज नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The experiment is the sort that settles arguments. Pour liquid oxygen between the poles of a strong magnet and it does not fall through — it clings there, visibly suspended, which is a demonstration film students have watched for decades. Paramagnetism of that strength requires unpaired electrons, and the Lewis structure of O₂ has none: two lone pairs on each oxygen and a double bond between them, sixteen electrons all neatly paired. The Lewis picture is not merely incomplete here, it makes a definite prediction and the prediction is wrong. Molecular orbital theory starts differently. Instead of assigning electrons to atoms and then to shared pairs, it combines the atomic orbitals of both atoms into molecular orbitals belonging to the molecule as a whole, some bonding and some antibonding, and then fills them in energy order by the same rules that fill an atom — Aufbau, Pauli and Hund. For O₂ the count runs: the bonding orbitals take ten electrons and the antibonding six. Bond order is (bonding − antibonding)/2 = (10 − 6)/2 = 2, so MO theory agrees with Lewis about the double bond, and about the bond length and strength that follow from it. But the last two electrons are the interesting ones. They must go into the two pi-antibonding orbitals, which are degenerate — exactly equal in energy. Hund's rule then applies just as it does in an atom: the electrons occupy the two orbitals singly with parallel spins rather than pairing up in one. Two unpaired electrons, and O₂ is paramagnetic. Notice the shape of the resolution. MO theory did not overturn what Lewis got right; it reproduced the bond order exactly and added the one prediction Lewis could not make. That is what a successful replacement looks like — the older model is recovered as an approximation and the residue it could not explain becomes a consequence. Two further payoffs are worth knowing. The same method predicts that removing an electron from O₂ makes the bond stronger, since it comes out of an antibonding orbital, and O₂⁺ does indeed have a shorter bond than O₂ — a result Lewis structures cannot even express. And it predicts that He₂ cannot exist, because its two bonding and two antibonding electrons give a bond order of zero. (The second answer denies a reproducible demonstration, the third abandons a bond order that MO theory confirms, and the fourth invokes nuclear magnetism some ten thousand times too weak to lift a liquid.)",
          hi: "यह प्रयोग उस क़िस्म का है जो बहस निपटा देता है। प्रबल चुंबक के ध्रुवों के बीच द्रव ऑक्सीजन उड़ेलो और वह नीचे नहीं गिरती — वह वहीं चिपकी रहती है, दिखाई देने लायक़ लटकी हुई, और यह प्रदर्शन-फ़िल्म छात्र दशकों से देखते आए हैं। उस प्रबलता का अनुचुंबकत्व अयुग्मित इलेक्ट्रॉन माँगता है, और O₂ की लूइस संरचना में एक भी नहीं: हर ऑक्सीजन पर दो एकाकी युग्म और उनके बीच द्विबंध, सोलह इलेक्ट्रॉन सब सफ़ाई से युग्मित। लूइस चित्र यहाँ केवल अधूरा नहीं, वह एक निश्चित भविष्यवाणी करता है और वह भविष्यवाणी ग़लत है। आण्विक कक्षक सिद्धांत भिन्न ढंग से शुरू करता है। इलेक्ट्रॉनों को परमाणुओं और फिर साझा युग्मों को सौंपने के बजाय, वह दोनों परमाणुओं के परमाण्विक कक्षकों को मिलाकर ऐसे आण्विक कक्षक बनाता है जो पूरे अणु के हैं, कुछ आबंधी और कुछ प्रतिआबंधी, और फिर उन्हें उन्हीं नियमों से ऊर्जा-क्रम में भरता है जो परमाणु भरते हैं — ऑफ़बाउ, पॉली और हुंड। O₂ के लिए गिनती यों चलती है: आबंधी कक्षक दस इलेक्ट्रॉन लेते हैं और प्रतिआबंधी छह। बंध कोटि (आबंधी − प्रतिआबंधी)/2 = (10 − 6)/2 = 2, अतः द्विबंध के बारे में, और उससे निकलने वाली बंध लंबाई तथा प्रबलता के बारे में, आण्विक कक्षक सिद्धांत लूइस से सहमत है। पर दिलचस्प अंतिम दो इलेक्ट्रॉन हैं। उन्हें दो पाई-प्रतिआबंधी कक्षकों में जाना पड़ता है, जो अपभ्रष्ट हैं — ऊर्जा में ठीक बराबर। तब हुंड का नियम वैसे ही लागू होता है जैसे परमाणु में: इलेक्ट्रॉन एक में जोड़ी बनाने के बजाय दोनों कक्षकों में एक-एक बैठते हैं, समांतर चक्रणों के साथ। दो अयुग्मित इलेक्ट्रॉन, और O₂ अनुचुंबकीय। समाधान का आकार ध्यान दो। आण्विक कक्षक सिद्धांत ने वह नहीं पलटा जो लूइस ने सही किया था; उसने बंध कोटि ठीक-ठीक दोहराई और वह एक भविष्यवाणी जोड़ दी जो लूइस नहीं कर सकता था। सफल प्रतिस्थापन ऐसा ही दिखता है — पुराना निदर्श सन्निकटन के रूप में वापस मिलता है और जो अवशेष वह नहीं समझा सका वह परिणाम बन जाता है। दो और कमाइयाँ जानने योग्य हैं। वही विधि बताती है कि O₂ से इलेक्ट्रॉन हटाने पर बंध प्रबल हो जाता है, क्योंकि वह प्रतिआबंधी कक्षक से निकलता है, और O₂⁺ का बंध सचमुच O₂ से छोटा है — ऐसा परिणाम जिसे लूइस संरचनाएँ व्यक्त तक नहीं कर सकतीं। और वह बताती है कि He₂ हो ही नहीं सकता, क्योंकि उसके दो आबंधी और दो प्रतिआबंधी इलेक्ट्रॉन बंध कोटि शून्य देते हैं। (दूसरा उत्तर दोहराए जा सकने वाले प्रदर्शन को नकारता है, तीसरा उस बंध कोटि को छोड़ देता है जिसकी आण्विक कक्षक सिद्धांत पुष्टि करता है, और चौथा ऐसा नाभिकीय चुंबकत्व बुलाता है जो द्रव उठाने के लिए लगभग दस हज़ार गुना दुर्बल है।)",
          mr: "हा प्रयोग असा आहे जो वाद निकाली काढतो. प्रबळ चुंबकाच्या ध्रुवांमध्ये द्रव ऑक्सिजन ओता आणि तो खाली पडत नाही — तो तिथेच चिकटतो, दिसण्याइतका टांगलेला, आणि ही प्रात्यक्षिक-चित्रफीत विद्यार्थी दशकांपासून पाहत आले आहेत. त्या प्रबळतेचे अनुचुंबकत्व अयुग्मित इलेक्ट्रॉन मागते, आणि O₂ च्या लुईस संरचनेत एकही नाही: प्रत्येक ऑक्सिजनवर दोन एकाकी जोड्या आणि त्यांच्यात द्विबंध, सोळा इलेक्ट्रॉन सर्व नीटपणे युग्मित. लुईस चित्र इथे केवळ अपूर्ण नाही, ते एक निश्चित भाकीत करते आणि ते भाकीत चुकीचे आहे. रेणवीय कक्षक सिद्धांत वेगळ्या पद्धतीने सुरू होतो. इलेक्ट्रॉन अणूंना आणि मग वाटलेल्या जोड्यांना सोपवण्याऐवजी, तो दोन्ही अणूंची अणुकक्षके मिसळून अशी रेणवीय कक्षके बनवतो जी अख्ख्या रेणूची, काही बंधकारी आणि काही प्रतिबंधकारी, आणि मग ती त्याच नियमांनी ऊर्जा-क्रमाने भरतो जे अणू भरतात — ऑफबाऊ, पौली आणि हुंड. O₂ साठी मोजणी अशी चालते: बंधकारी कक्षके दहा इलेक्ट्रॉन घेतात आणि प्रतिबंधकारी सहा. बंध कोटी (बंधकारी − प्रतिबंधकारी)/2 = (10 − 6)/2 = 2, म्हणून द्विबंधाबद्दल, आणि त्यातून निघणाऱ्या बंध लांबी व प्रबळतेबद्दल, रेणवीय कक्षक सिद्धांत लुईसशी सहमत. पण रोचक शेवटचे दोन इलेक्ट्रॉन. त्यांना दोन पाय-प्रतिबंधकारी कक्षकांत जावे लागते, जी अपभ्रष्ट आहेत — ऊर्जेत नेमकी समान. मग हुंडचा नियम तसाच लागू होतो जसा अणूत: इलेक्ट्रॉन एकात जोडी करण्याऐवजी दोन्ही कक्षकांत एकेक बसतात, समांतर परिवलनांसह. दोन अयुग्मित इलेक्ट्रॉन, आणि O₂ अनुचुंबकीय. निराकरणाचा आकार लक्षात घ्या. रेणवीय कक्षक सिद्धांताने लुईसने बरोबर केलेले उलटवले नाही; त्याने बंध कोटी नेमकी पुन्हा मिळवली आणि ते एक भाकीत जोडले जे लुईस करू शकत नव्हता. यशस्वी प्रतिस्थापन असेच दिसते — जुने प्रतिरूप सन्निकटन म्हणून परत मिळते आणि ते जे समजावू शकले नाही तो शेष परिणाम बनतो. आणखी दोन कमाया जाणण्याजोग्या. तीच पद्धत सांगते की O₂ मधून इलेक्ट्रॉन काढल्यास बंध प्रबळ होतो, कारण तो प्रतिबंधकारी कक्षकातून निघतो, आणि O₂⁺ चा बंध खरोखर O₂ हून लहान — असा निकाल जो लुईस संरचना व्यक्तही करू शकत नाहीत. आणि ती सांगते की He₂ असूच शकत नाही, कारण त्याचे दोन बंधकारी आणि दोन प्रतिबंधकारी इलेक्ट्रॉन बंध कोटी शून्य देतात. (दुसरे उत्तर पुन्हा करता येणारे प्रात्यक्षिक नाकारते, तिसरे ती बंध कोटी सोडते जिची रेणवीय कक्षक सिद्धांत पुष्टी करतो, आणि चौथे असे केंद्रकीय चुंबकत्व बोलावते जे द्रव उचलण्यासाठी सुमारे दहा हजारपट दुर्बल आहे.)",
        },
      },
      /*H4C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Thermodynamics                                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-thermodynamics",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 5 — Thermodynamics",
      hi: "अध्याय 5 — ऊष्मागतिकी",
      mr: "प्रकरण 5 — उष्मागतिकी",
    },
    name: {
      en: "Chemical Thermodynamics",
      hi: "रासायनिक ऊष्मागतिकी",
      mr: "रासायनिक उष्मागतिकी",
    },
    summary: {
      en: "The physics chapter of the same name asked what an engine may do; this one asks whether a reaction will happen at all. A heat measured at constant pressure because that is how a beaker works, a law that lets an unmeasurable heat be assembled from measurable ones, a count of arrangements that gives disorder a number, and a single combination of the two that decides — for a given temperature — which way a reaction will go and how far.",
      hi: "इसी नाम के भौतिकी अध्याय ने पूछा था कि इंजन क्या कर सकता है; यह पूछता है कि अभिक्रिया होगी भी या नहीं। वह ऊष्मा जो अचर दाब पर नापी जाती है क्योंकि बीकर ऐसे ही चलता है, वह नियम जो अमापनीय ऊष्मा को मापनीय ऊष्माओं से जोड़ लेने देता है, व्यवस्थाओं की वह गिनती जो अव्यवस्था को संख्या दे देती है, और उन दोनों का वह एक संयोजन जो दिए ताप पर तय करता है कि अभिक्रिया किस ओर जाएगी और कितनी दूर।",
      mr: "याच नावाच्या भौतिकी प्रकरणाने विचारले होते की इंजिन काय करू शकते; हे विचारते की अभिक्रिया घडेल का. ती उष्णता जी अचल दाबावर मोजली जाते कारण बीकर तसाच चालतो, तो नियम जो न मोजता येणारी उष्णता मोजता येणाऱ्यांतून जोडू देतो, मांडणींची ती मोजणी जी अव्यवस्थेला संख्या देते, आणि त्या दोघांचे ते एक संयोजन जे दिलेल्या तापमानावर ठरवते की अभिक्रिया कोणत्या दिशेने जाईल आणि किती दूर.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "enthalpy-against-internal-energy",
        name: {
          en: "Enthalpy against internal energy",
          hi: "एन्थैल्पी बनाम आंतरिक ऊर्जा",
          mr: "एन्थाल्पी विरुद्ध आंतरिक ऊर्जा",
        },
        kind: "quantity",
        prompt: {
          en: "A reaction in a sealed bomb releases one figure and the same reaction in an open beaker releases another, because in the beaker some of the energy is spent pushing the atmosphere out of the way. Which pair is this?",
          hi: "बंद बम में हुई अभिक्रिया एक आँकड़ा छोड़ती है और वही अभिक्रिया खुले बीकर में दूसरा, क्योंकि बीकर में कुछ ऊर्जा वायुमंडल को हटाने में ख़र्च होती है। यह कौन-सी जोड़ी है?",
          mr: "बंद बॉम्बमधली अभिक्रिया एक आकडा सोडते आणि तीच अभिक्रिया उघड्या बीकरमध्ये दुसरा, कारण बीकरमध्ये काही ऊर्जा वातावरण बाजूला सारण्यात खर्च होते. ही कोणती जोडी?",
        },
        statement: {
          en: "Internal energy change is the heat at constant volume and enthalpy change is the heat at constant pressure, and they differ by the work done against the surroundings: ΔH = ΔU + ΔnRT for gases.",
          hi: "आंतरिक ऊर्जा-परिवर्तन अचर आयतन पर ऊष्मा है और एन्थैल्पी-परिवर्तन अचर दाब पर, और वे परिवेश के विरुद्ध किए कार्य से भिन्न हैं: गैसों के लिए ΔH = ΔU + ΔnRT.",
          mr: "आंतरिक ऊर्जा-बदल म्हणजे अचल घनफळावरची उष्णता आणि एन्थाल्पी-बदल म्हणजे अचल दाबावरची, आणि ते परिसराविरुद्ध केलेल्या कार्याने वेगळे: वायूंसाठी ΔH = ΔU + ΔnRT.",
        },
        detail: {
          en: "Enthalpy is the more useful of the two for chemistry because almost every reaction a chemist runs is open to the air, and open to the air means at constant pressure.",
          hi: "रसायन के लिए दोनों में एन्थैल्पी अधिक उपयोगी है क्योंकि रसायनज्ञ जो भी अभिक्रिया चलाता है वह लगभग सदा हवा के लिए खुली होती है, और हवा के लिए खुली होने का अर्थ है अचर दाब पर।",
          mr: "रसायनासाठी दोघांपैकी एन्थाल्पी अधिक उपयुक्त कारण रसायनशास्त्रज्ञ जी अभिक्रिया चालवतो ती जवळपास नेहमी हवेला उघडी असते, आणि हवेला उघडी असणे म्हणजे अचल दाबावर.",
        },
        extra: {
          en: "The two are identical when no gas is made or consumed, so for a reaction entirely between solids and liquids the distinction quietly disappears.",
          hi: "जब कोई गैस न बने न ख़र्च हो तब दोनों समान हैं, अतः पूरी तरह ठोसों और द्रवों के बीच की अभिक्रिया के लिए यह भेद चुपचाप ग़ायब हो जाता है।",
          mr: "जेव्हा कोणताही वायू तयार होत नाही वा वापरला जात नाही तेव्हा दोन्ही सारखे, म्हणून पूर्णपणे घन आणि द्रवांमधल्या अभिक्रियेसाठी हा भेद गुपचूप नाहीसा होतो.",
        },
        pair: {
          left: {
            en: "The beaker's figure and the bomb's",
            hi: "बीकर का आँकड़ा और बम का",
            mr: "बीकरचा आकडा आणि बॉम्बचा",
          },
          right: {
            en: "enthalpy against internal energy",
            hi: "एन्थैल्पी बनाम आंतरिक ऊर्जा",
            mr: "एन्थाल्पी विरुद्ध आंतरिक ऊर्जा",
          },
        },
      },
      {
        id: "hesss-law",
        name: {
          en: "Hess's law",
          hi: "हेस का नियम",
          mr: "हेसचा नियम",
        },
        kind: "method",
        prompt: {
          en: "Carbon cannot be burnt to carbon monoxide cleanly enough to measure, so the figure is obtained by subtracting two combustions that can be measured — because the total depends only on where you start and finish. Which law is this?",
          hi: "कार्बन को कार्बन मोनोऑक्साइड तक इतनी सफ़ाई से नहीं जलाया जा सकता कि नापा जा सके, अतः आँकड़ा उन दो दहनों को घटाकर मिलता है जो नापे जा सकते हैं — क्योंकि कुल केवल इस पर निर्भर है कि तुम कहाँ से चले और कहाँ पहुँचे। यह कौन-सा नियम है?",
          mr: "कार्बन कार्बन मोनॉक्साइडपर्यंत इतक्या स्वच्छपणे जाळता येत नाही की मोजता येईल, म्हणून आकडा मोजता येणारी दोन ज्वलने वजा करून मिळतो — कारण एकूण केवळ तुम्ही कुठून निघालात आणि कुठे पोहोचलात यावर अवलंबून. हा कोणता नियम?",
        },
        statement: {
          en: "Hess's law states that the enthalpy change of a reaction is the same whatever route is taken, so unknown enthalpies can be assembled by adding and subtracting known ones.",
          hi: "हेस का नियम कहता है कि किसी अभिक्रिया का एन्थैल्पी-परिवर्तन वही रहता है, रास्ता चाहे जो लिया जाए, अतः अज्ञात एन्थैल्पियाँ ज्ञात एन्थैल्पियों को जोड़-घटाकर बनाई जा सकती हैं।",
          mr: "हेसचा नियम सांगतो की अभिक्रियेचा एन्थाल्पी-बदल तोच राहतो, मार्ग कोणताही घेतला तरी, म्हणून अज्ञात एन्थाल्पी ज्ञात एन्थाल्पी जोडून-वजा करून बनवता येतात.",
        },
        detail: {
          en: "It is the first law wearing chemical clothes: enthalpy is a state function, so a cycle that returns to its starting point must sum to zero or energy could be made from nothing.",
          hi: "यह रासायनिक कपड़े पहने पहला नियम है: एन्थैल्पी अवस्था-फलन है, अतः जो चक्र अपने आरंभ-बिंदु पर लौटे उसका योग शून्य होना ही चाहिए, वरना शून्य से ऊर्जा बन जाती।",
          mr: "हा रासायनिक कपडे घातलेला पहिला नियम: एन्थाल्पी हे अवस्था-फलन, म्हणून जे चक्र आपल्या आरंभबिंदूवर परतते त्याची बेरीज शून्य असावीच लागते, नाहीतर शून्यातून ऊर्जा बनली असती.",
        },
        extra: {
          en: "It is what makes tables of standard enthalpies of formation worth compiling: from one number per compound, the enthalpy of any reaction between them can be calculated without ever running it.",
          hi: "इसी से मानक संभवन एन्थैल्पियों की तालिकाएँ बनाना सार्थक है: प्रति यौगिक एक संख्या से, उनके बीच की किसी भी अभिक्रिया की एन्थैल्पी बिना उसे चलाए निकाली जा सकती है।",
          mr: "यामुळेच प्रमाणित संभवन एन्थाल्पींचे तक्ते बनवणे सार्थक: प्रति संयुग एका संख्येतून, त्यांच्यातील कोणत्याही अभिक्रियेची एन्थाल्पी ती न चालवता काढता येते.",
        },
        pair: {
          left: {
            en: "Measuring what cannot be measured, by subtraction",
            hi: "जो नापा नहीं जा सकता उसे घटाव से नापना",
            mr: "जे मोजता येत नाही ते वजाबाकीने मोजणे",
          },
          right: {
            en: "Hess's law",
            hi: "हेस का नियम",
            mr: "हेसचा नियम",
          },
        },
      },
      {
        id: "bond-enthalpy",
        name: {
          en: "Bond enthalpy",
          hi: "बंध एन्थैल्पी",
          mr: "बंध एन्थाल्पी",
        },
        kind: "method",
        prompt: {
          en: "Breaking bonds always costs energy and making them always releases it, so a reaction's heat is the difference between what was spent taking the reactants apart and what was recovered assembling the products. Which quantity is this?",
          hi: "बंध तोड़ने में सदा ऊर्जा लगती है और बनाने में सदा निकलती है, अतः अभिक्रिया की ऊष्मा उसका अंतर है जो अभिकारकों को अलग करने में ख़र्च हुआ और जो उत्पाद जोड़ने में वापस मिला। यह कौन-सी राशि है?",
          mr: "बंध तोडायला नेहमी ऊर्जा लागते आणि बनवायला नेहमी निघते, म्हणून अभिक्रियेची उष्णता म्हणजे अभिक्रियाकारक वेगळे करण्यात खर्चलेले आणि उत्पादे जोडण्यात परत मिळालेले यांतील फरक. ही कोणती राशी?",
        },
        statement: {
          en: "Bond enthalpy is the energy needed to break one mole of a given bond in the gas phase, and a reaction's enthalpy is the sum of the bonds broken minus the sum of the bonds formed.",
          hi: "बंध एन्थैल्पी गैस प्रावस्था में किसी दिए बंध का एक मोल तोड़ने के लिए चाहिए ऊर्जा है, और अभिक्रिया की एन्थैल्पी टूटे बंधों का योग घटा बने बंधों का योग है।",
          mr: "बंध एन्थाल्पी म्हणजे वायू अवस्थेत दिलेल्या बंधाचा एक मोल तोडायला लागणारी ऊर्जा, आणि अभिक्रियेची एन्थाल्पी म्हणजे तुटलेल्या बंधांची बेरीज वजा तयार झालेल्या बंधांची बेरीज.",
        },
        detail: {
          en: "Tabulated values are averages across many molecules, so a bond enthalpy calculation is always approximate — the four C–H bonds in methane do not in fact take equal energy to break one after another.",
          hi: "तालिका के मान अनेक अणुओं का औसत हैं, अतः बंध एन्थैल्पी की गणना सदा सन्निकट है — मेथेन के चार C–H बंध वस्तुतः एक के बाद एक तोड़ने में बराबर ऊर्जा नहीं लेते।",
          mr: "तक्त्यातील मूल्ये अनेक रेणूंची सरासरी, म्हणून बंध एन्थाल्पीची गणना नेहमी अंदाजे — मिथेनचे चार C–H बंध प्रत्यक्षात एकामागून एक तोडायला समान ऊर्जा घेत नाहीत.",
        },
        extra: {
          en: "It explains why combustion is so reliably exothermic: the bonds in carbon dioxide and water are unusually strong, so far more energy comes back than the fuel's own bonds cost to break.",
          hi: "यही समझाता है कि दहन इतनी भरोसेमंद ढंग से ऊष्माक्षेपी क्यों है: कार्बन डाइऑक्साइड और पानी के बंध असामान्य रूप से प्रबल हैं, अतः ईंधन के अपने बंध तोड़ने की लागत से कहीं अधिक ऊर्जा वापस आती है।",
          mr: "हेच समजावते की ज्वलन इतक्या विश्वासार्हपणे उष्माक्षेपी का: कार्बन डायऑक्साइड आणि पाण्याचे बंध असामान्यपणे प्रबळ, म्हणून इंधनाचे स्वतःचे बंध तोडण्याच्या खर्चाहून कितीतरी अधिक ऊर्जा परत येते.",
        },
        pair: {
          left: {
            en: "Spent taking apart, recovered putting together",
            hi: "अलग करने में ख़र्च, जोड़ने में वापस",
            mr: "वेगळे करण्यात खर्च, जोडण्यात परत",
          },
          right: {
            en: "bond enthalpy",
            hi: "बंध एन्थैल्पी",
            mr: "बंध एन्थाल्पी",
          },
        },
      },
      {
        id: "entropy-as-arrangements",
        name: {
          en: "Entropy as a count of arrangements",
          hi: "व्यवस्थाओं की गिनती के रूप में एन्ट्रॉपी",
          mr: "मांडणींची मोजणी म्हणून एन्ट्रॉपी",
        },
        kind: "quantity",
        prompt: {
          en: "A gas has vastly more ways of arranging its molecules than the same substance frozen into a crystal, and the quantity that turns that count into a number in joules per kelvin gives disorder a currency. Which quantity is this?",
          hi: "गैस के पास अपने अणु जमाने के उतने ही पदार्थ के क्रिस्टल में जमे होने से कहीं अधिक तरीक़े हैं, और वह राशि जो उस गिनती को जूल प्रति केल्विन की संख्या में बदल देती है, अव्यवस्था को मुद्रा दे देती है। यह कौन-सी राशि है?",
          mr: "वायूकडे आपले रेणू मांडण्याचे त्याच पदार्थाच्या स्फटिकात गोठलेल्या स्थितीहून कितीतरी अधिक मार्ग असतात, आणि ती राशी जी त्या मोजणीला ज्यूल प्रति केल्विनच्या संख्येत बदलते ती अव्यवस्थेला चलन देते. ही कोणती राशी?",
        },
        statement: {
          en: "Entropy measures the number of microscopic arrangements a system can adopt, so it rises with temperature, with volume, and sharply on melting and again on boiling.",
          hi: "एन्ट्रॉपी उन सूक्ष्म व्यवस्थाओं की संख्या नापती है जो निकाय अपना सकता है, अतः वह ताप के साथ, आयतन के साथ, और गलन पर तथा फिर क्वथन पर तीव्रता से बढ़ती है।",
          mr: "एन्ट्रॉपी संच स्वीकारू शकेल अशा सूक्ष्म मांडणींची संख्या मोजते, म्हणून ती तापमानासोबत, घनफळासोबत, आणि द्रवीभवनावर व पुन्हा उकळण्यावर झपाट्याने वाढते.",
        },
        detail: {
          en: "The rise on boiling is far larger than on melting, because a gas's molecules are free to be anywhere in the container while a liquid's are still touching their neighbours.",
          hi: "क्वथन पर वृद्धि गलन की तुलना में कहीं बड़ी है, क्योंकि गैस के अणु पात्र में कहीं भी होने को स्वतंत्र हैं जबकि द्रव के अभी भी अपने पड़ोसियों को छू रहे हैं।",
          mr: "उकळण्यावरची वाढ द्रवीभवनाहून कितीतरी मोठी, कारण वायूचे रेणू भांड्यात कुठेही असायला मोकळे तर द्रवाचे अजूनही आपल्या शेजाऱ्यांना स्पर्श करत आहेत.",
        },
        extra: {
          en: "A perfect crystal at absolute zero has exactly one arrangement and therefore zero entropy, which is the third law and the reason entropies can be quoted as absolute values rather than as changes.",
          hi: "परम शून्य पर पूर्ण क्रिस्टल की ठीक एक व्यवस्था है और इसलिए एन्ट्रॉपी शून्य, यही तीसरा नियम है और यही कारण कि एन्ट्रॉपियाँ परिवर्तनों के बजाय निरपेक्ष मानों के रूप में बताई जा सकती हैं।",
          mr: "निरपेक्ष शून्यावर परिपूर्ण स्फटिकाची नेमकी एक मांडणी आणि म्हणून एन्ट्रॉपी शून्य, हाच तिसरा नियम आणि हेच कारण की एन्ट्रॉपी बदलांऐवजी निरपेक्ष मूल्यांच्या रूपात सांगता येतात.",
        },
        pair: {
          left: {
            en: "One arrangement only, and therefore zero",
            hi: "केवल एक व्यवस्था, और इसलिए शून्य",
            mr: "केवळ एक मांडणी, आणि म्हणून शून्य",
          },
          right: {
            en: "entropy as a count of arrangements",
            hi: "व्यवस्थाओं की गिनती के रूप में एन्ट्रॉपी",
            mr: "मांडणींची मोजणी म्हणून एन्ट्रॉपी",
          },
        },
      },
      {
        id: "gibbs-free-energy",
        name: {
          en: "Gibbs free energy",
          hi: "गिब्स मुक्त ऊर्जा",
          mr: "गिब्स मुक्त ऊर्जा",
        },
        kind: "criterion",
        prompt: {
          en: "Ice melts above zero and freezes below it although the enthalpy change is the same size either way, because one term is multiplied by the temperature and the other is not. Which combination decides?",
          hi: "बर्फ़ शून्य से ऊपर पिघलती है और नीचे जमती है यद्यपि एन्थैल्पी-परिवर्तन दोनों ओर उतना ही है, क्योंकि एक पद ताप से गुणा होता है और दूसरा नहीं। कौन-सा संयोजन तय करता है?",
          mr: "बर्फ शून्याच्या वर वितळतो आणि खाली गोठतो जरी एन्थाल्पी-बदल दोन्ही बाजूंनी तितकाच असला तरी, कारण एक पद तापमानाने गुणले जाते आणि दुसरे नाही. कोणते संयोजन ठरवते?",
        },
        statement: {
          en: "The Gibbs free energy change ΔG = ΔH − TΔS decides spontaneity: a process goes forward of its own accord when ΔG is negative and not otherwise.",
          hi: "गिब्स मुक्त ऊर्जा-परिवर्तन ΔG = ΔH − TΔS स्वतःस्फूर्तता तय करता है: प्रक्रिया अपने आप आगे तब बढ़ती है जब ΔG ऋणात्मक हो, अन्यथा नहीं।",
          mr: "गिब्स मुक्त ऊर्जा-बदल ΔG = ΔH − TΔS स्वयंस्फूर्तता ठरवतो: प्रक्रिया आपोआप पुढे तेव्हा जाते जेव्हा ΔG ऋण असतो, अन्यथा नाही.",
        },
        detail: {
          en: "The two terms can pull in opposite directions, and then temperature decides which wins — which is why a reaction that refuses to go at room temperature may run readily in a furnace.",
          hi: "दोनों पद विपरीत दिशाओं में खींच सकते हैं, और तब ताप तय करता है कि कौन जीते — इसीलिए जो अभिक्रिया कमरे के ताप पर मना कर देती है वह भट्ठी में सहज चल सकती है।",
          mr: "दोन्ही पदे विरुद्ध दिशांना ओढू शकतात, आणि मग तापमान कोण जिंकते ते ठरवते — म्हणूनच जी अभिक्रिया खोलीच्या तापमानावर नकार देते ती भट्टीत सहज चालू शकते.",
        },
        extra: {
          en: "Spontaneous does not mean fast: diamond turning to graphite has a negative ΔG at ordinary temperatures and takes longer than the age of the universe, because thermodynamics says nothing about rate.",
          hi: "स्वतःस्फूर्त का अर्थ तेज़ नहीं: हीरे का ग्रेफ़ाइट बनना साधारण तापों पर ऋणात्मक ΔG रखता है और ब्रह्मांड की आयु से अधिक समय लेता है, क्योंकि ऊष्मागतिकी दर के बारे में कुछ नहीं कहती।",
          mr: "स्वयंस्फूर्त म्हणजे वेगवान नव्हे: हिऱ्याचे ग्रॅफाइट होणे सामान्य तापमानांवर ऋण ΔG राखते आणि विश्वाच्या वयाहून अधिक काळ घेते, कारण उष्मागतिकी दराबद्दल काहीही सांगत नाही.",
        },
        pair: {
          left: {
            en: "Negative, and still slower than the universe is old",
            hi: "ऋणात्मक, और फिर भी ब्रह्मांड की आयु से धीमा",
            mr: "ऋण, आणि तरीही विश्वाच्या वयाहून सावकाश",
          },
          right: {
            en: "Gibbs free energy",
            hi: "गिब्स मुक्त ऊर्जा",
            mr: "गिब्स मुक्त ऊर्जा",
          },
        },
      },
      {
        id: "standard-state-convention",
        name: {
          en: "The standard state convention",
          hi: "मानक अवस्था परिपाटी",
          mr: "प्रमाणित अवस्था संकेत",
        },
        kind: "criterion",
        prompt: {
          en: "The enthalpy of an element in its most stable form at one bar is declared to be zero, not because it holds no energy but because only differences can ever be measured. Which agreement is this?",
          hi: "एक बार पर अपने सबसे स्थिर रूप में तत्व की एन्थैल्पी शून्य घोषित की जाती है, इसलिए नहीं कि उसमें ऊर्जा नहीं बल्कि इसलिए कि केवल अंतर ही कभी नापे जा सकते हैं। यह कौन-सी सहमति है?",
          mr: "एक बारवर आपल्या सर्वांत स्थिर रूपातील मूलद्रव्याची एन्थाल्पी शून्य घोषित केली जाते, त्यात ऊर्जा नाही म्हणून नव्हे तर केवळ फरकच कधी मोजता येतात म्हणून. हा कोणता करार?",
        },
        statement: {
          en: "By convention the standard enthalpy of formation of an element in its most stable state at one bar is zero, which gives every compound's enthalpy a fixed reference to be quoted against.",
          hi: "परिपाटी से एक बार पर अपनी सबसे स्थिर अवस्था में तत्व की मानक संभवन एन्थैल्पी शून्य है, जिससे हर यौगिक की एन्थैल्पी को बताने के लिए नियत संदर्भ मिल जाता है।",
          mr: "संकेताने एक बारवर आपल्या सर्वांत स्थिर अवस्थेतील मूलद्रव्याची प्रमाणित संभवन एन्थाल्पी शून्य, ज्यातून प्रत्येक संयुगाच्या एन्थाल्पीला सांगण्यासाठी ठरलेला संदर्भ मिळतो.",
        },
        detail: {
          en: "It is the same freedom as choosing where to put the zero of gravitational potential energy: nothing observable changes, and the choice is made for convenience alone.",
          hi: "यह वही स्वतंत्रता है जो गुरुत्वीय स्थितिज ऊर्जा का शून्य कहाँ रखा जाए चुनने में है: कुछ भी प्रेक्षणीय नहीं बदलता, और चुनाव केवल सुविधा के लिए किया जाता है।",
          mr: "हीच ती स्वतंत्रता जी गुरुत्वीय स्थितिज ऊर्जेचे शून्य कुठे ठेवायचे हे निवडण्यात असते: काहीही निरीक्षणीय बदलत नाही, आणि निवड केवळ सोयीसाठी केली जाते.",
        },
        extra: {
          en: "The 'most stable form' clause matters: graphite is the standard state of carbon and diamond is not, so diamond has a small positive enthalpy of formation even though it is an element.",
          hi: "'सबसे स्थिर रूप' वाला उपवाक्य मायने रखता है: कार्बन की मानक अवस्था ग्रेफ़ाइट है, हीरा नहीं, अतः हीरे की संभवन एन्थैल्पी थोड़ी धनात्मक है यद्यपि वह तत्व है।",
          mr: "'सर्वांत स्थिर रूप' हे उपवाक्य महत्त्वाचे: कार्बनची प्रमाणित अवस्था ग्रॅफाइट, हिरा नव्हे, म्हणून हिऱ्याची संभवन एन्थाल्पी थोडी धन आहे जरी तो मूलद्रव्य असला तरी.",
        },
        pair: {
          left: {
            en: "Graphite at zero and diamond just above it",
            hi: "ग्रेफ़ाइट शून्य पर और हीरा उससे ज़रा ऊपर",
            mr: "ग्रॅफाइट शून्यावर आणि हिरा त्याहून जरा वर",
          },
          right: {
            en: "the standard state convention",
            hi: "मानक अवस्था परिपाटी",
            mr: "प्रमाणित अवस्था संकेत",
          },
        },
      },
      /*F5C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Ammonium chloride dissolves in water and the beaker goes noticeably cold, so the process absorbs heat. A student says an endothermic process cannot happen on its own. Explain why it does, and what would happen at a much lower temperature.",
          hi: "अमोनियम क्लोराइड पानी में घुलता है और बीकर साफ़ तौर पर ठंडा हो जाता है, अतः प्रक्रिया ऊष्मा सोखती है। एक विद्यार्थी कहता है कि ऊष्माशोषी प्रक्रिया अपने आप नहीं हो सकती। समझाओ वह होती क्यों है, और कहीं कम ताप पर क्या होता।",
          mr: "अमोनियम क्लोराइड पाण्यात विरघळते आणि बीकर स्पष्टपणे थंड होतो, म्हणून प्रक्रिया उष्णता शोषते. एक विद्यार्थी म्हणतो की उष्माशोषी प्रक्रिया आपोआप होऊ शकत नाही. ती का होते, आणि कितीतरी कमी तापमानावर काय झाले असते ते समजावा.",
        },
        choices: [
          {
            en: "Enthalpy is not the criterion; ΔG = ΔH − TΔS is. Dissolving breaks an ordered crystal into ions dispersed through the solvent, so ΔS is strongly positive, and at room temperature the TΔS term outweighs the positive ΔH and makes ΔG negative. Cool the water far enough and TΔS shrinks until ΔH dominates, at which point ΔG turns positive and the salt stops dissolving — which is exactly why solubility of such salts falls as temperature falls",
            hi: "कसौटी एन्थैल्पी नहीं; ΔG = ΔH − TΔS है। घुलना व्यवस्थित क्रिस्टल को तोड़कर आयनों को विलायक भर बिखेर देता है, अतः ΔS प्रबल धनात्मक है, और कमरे के ताप पर TΔS पद धनात्मक ΔH पर भारी पड़कर ΔG को ऋणात्मक बना देता है। पानी को पर्याप्त ठंडा करो और TΔS तब तक घटता है जब तक ΔH हावी न हो जाए, जिस बिंदु पर ΔG धनात्मक हो जाता है और लवण घुलना बंद कर देता है — ठीक इसीलिए ऐसे लवणों की विलेयता ताप गिरने पर गिरती है",
            mr: "कसोटी एन्थाल्पी नव्हे; ΔG = ΔH − TΔS आहे. विरघळणे व्यवस्थित स्फटिक तोडून आयन विद्रावकभर विखुरते, म्हणून ΔS प्रबळ धन, आणि खोलीच्या तापमानावर TΔS पद धन ΔH वर वरचढ ठरून ΔG ऋण बनवते. पाणी पुरेसे थंड करा आणि TΔS तोवर घटते जोवर ΔH वरचढ होत नाही, ज्या बिंदूवर ΔG धन होतो आणि क्षार विरघळणे थांबवते — नेमके म्हणूनच अशा क्षारांची विद्राव्यता तापमान घटताना घटते",
          },
          {
            en: "The student is right: the beaker must actually be warming, and the sensation of cold is a trick of evaporation from the outside of the glass",
            hi: "विद्यार्थी सही है: बीकर वस्तुतः गरम हो रहा होगा, और ठंड की अनुभूति काँच के बाहर से वाष्पन का छल है",
            mr: "विद्यार्थी बरोबर: बीकर प्रत्यक्षात तापत असणार, आणि थंडीची संवेदना काचेच्या बाहेरून बाष्पीभवनाची फसवणूक",
          },
          {
            en: "It happens because water supplies the energy, so the process is really exothermic once the solvent is included in the accounting",
            hi: "यह इसलिए होता है कि ऊर्जा पानी देता है, अतः विलायक को हिसाब में लेने पर प्रक्रिया वस्तुतः ऊष्माक्षेपी है",
            mr: "हे यासाठी घडते की ऊर्जा पाणी पुरवते, म्हणून विद्रावक हिशोबात घेतल्यास प्रक्रिया प्रत्यक्षात उष्माक्षेपी आहे",
          },
          {
            en: "Cooling the water would make the salt dissolve faster, since a lower temperature always favours an endothermic process",
            hi: "पानी ठंडा करने से लवण तेज़ी से घुलता, क्योंकि नीचा ताप सदा ऊष्माशोषी प्रक्रिया के पक्ष में होता है",
            mr: "पाणी थंड केल्याने क्षार वेगाने विरघळला असता, कारण कमी तापमान नेहमी उष्माशोषी प्रक्रियेच्या बाजूने असते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student is applying a rule that was true in an earlier chapter and has just been superseded. Up to now 'exothermic' has been a good proxy for 'happens' — most spontaneous reactions do release heat, and it is a useful first guess. But it is only a proxy, and this experiment is the counter-example. The real criterion is the Gibbs free energy: ΔG = ΔH − TΔS, and a process is spontaneous exactly when ΔG is negative. Two terms, and they can disagree. For ammonium chloride dissolving, ΔH is positive at about +15 kJ/mol — energy must be found to pull the ions out of a crystal lattice, and the hydration of those ions does not quite pay it back. That is why the beaker cools: the heat is taken from the water itself. But ΔS is also positive, and substantially so. A crystal is one of the most ordered arrangements matter takes: every ion in a fixed place in a repeating lattice. Dissolving it scatters those ions randomly through the liquid, and the number of available arrangements rises enormously. At 298 K the TΔS term is larger than ΔH, so ΔG comes out negative and the salt dissolves of its own accord — driven entirely by entropy, with enthalpy opposing throughout. Now the temperature question, which the fourth option gets backwards. The entropy term carries a factor of T, and the enthalpy term does not. Lower the temperature and TΔS shrinks while ΔH stays put, so the balance tips towards ΔH. Below some temperature the positive ΔH wins, ΔG turns positive, and dissolution stops being spontaneous. This is not hypothetical: the solubility of ammonium chloride falls steadily as water is cooled, which is exactly how such salts are purified by recrystallisation — dissolve hot, cool, and the crystals come back. The general pattern is worth tabulating. When ΔH is negative and ΔS positive, a process is spontaneous at every temperature. When both are positive, it needs a high temperature. When both are negative, it needs a low one. When ΔH is positive and ΔS negative, it never happens at all. Every reaction in chemistry falls into one of those four boxes, and knowing which one predicts how heating will change its behaviour without any further measurement. (The second answer denies a reading anyone can take with a thermometer, and the third smuggles the surroundings into the system to preserve a rule that does not need preserving.)",
          hi: "विद्यार्थी ऐसा नियम लगा रहा है जो पिछले अध्याय में सच था और अभी-अभी बदल दिया गया है। अब तक 'ऊष्माक्षेपी' 'होता है' का अच्छा एवजी रहा है — अधिकांश स्वतःस्फूर्त अभिक्रियाएँ ऊष्मा छोड़ती ही हैं, और यह उपयोगी पहला अनुमान है। पर वह केवल एवजी है, और यही प्रयोग प्रति-उदाहरण है। असली कसौटी गिब्स मुक्त ऊर्जा है: ΔG = ΔH − TΔS, और प्रक्रिया ठीक तब स्वतःस्फूर्त है जब ΔG ऋणात्मक हो। दो पद, और वे असहमत हो सकते हैं। अमोनियम क्लोराइड के घुलने के लिए ΔH लगभग +15 kJ/mol धनात्मक है — क्रिस्टल जालक से आयन खींचने को ऊर्जा जुटानी पड़ती है, और उन आयनों का जलयोजन उसे पूरी तरह नहीं चुकाता। इसीलिए बीकर ठंडा होता है: ऊष्मा स्वयं पानी से ली जाती है। पर ΔS भी धनात्मक है, और काफ़ी। क्रिस्टल द्रव्य की सबसे व्यवस्थित व्यवस्थाओं में से एक है: दोहराते जालक में हर आयन नियत स्थान पर। उसे घोलना उन आयनों को द्रव भर यादृच्छिक बिखेर देता है, और उपलब्ध व्यवस्थाओं की संख्या विशाल रूप से बढ़ जाती है। 298 K पर TΔS पद ΔH से बड़ा है, अतः ΔG ऋणात्मक निकलता है और लवण अपने आप घुल जाता है — पूरी तरह एन्ट्रॉपी से चालित, जबकि एन्थैल्पी पूरे समय विरोध करती है। अब ताप वाला प्रश्न, जिसे चौथा विकल्प उलटा कर देता है। एन्ट्रॉपी पद T का गुणक ढोता है, और एन्थैल्पी पद नहीं। ताप घटाओ और TΔS सिकुड़ता है जबकि ΔH टिका रहता है, अतः तुला ΔH की ओर झुक जाती है। किसी ताप से नीचे धनात्मक ΔH जीत जाता है, ΔG धनात्मक हो जाता है, और घुलना स्वतःस्फूर्त होना बंद कर देता है। यह काल्पनिक नहीं: पानी ठंडा होते-होते अमोनियम क्लोराइड की विलेयता लगातार गिरती है, और ठीक इसी तरह ऐसे लवण पुनःक्रिस्टलन से शुद्ध किए जाते हैं — गरम में घोलो, ठंडा करो, और क्रिस्टल वापस आ जाते हैं। सामान्य प्रतिरूप तालिकाबद्ध करने योग्य है। जब ΔH ऋणात्मक और ΔS धनात्मक हो, प्रक्रिया हर ताप पर स्वतःस्फूर्त है। जब दोनों धनात्मक हों, उसे ऊँचा ताप चाहिए। जब दोनों ऋणात्मक हों, नीचा। जब ΔH धनात्मक और ΔS ऋणात्मक हो, वह कभी होती ही नहीं। रसायन की हर अभिक्रिया इन्हीं चार डिब्बों में से एक में पड़ती है, और कौन-सा, यह जान लेना बिना किसी और माप के बता देता है कि गरम करने से उसका व्यवहार कैसे बदलेगा। (दूसरा उत्तर ऐसे पाठ्यांक को नकारता है जो कोई भी तापमापी से ले सकता है, और तीसरा ऐसे नियम को बचाने के लिए परिवेश को निकाय में तस्करी से भेज देता है जिसे बचाने की ज़रूरत ही नहीं।)",
          mr: "विद्यार्थी असा नियम लावत आहे जो मागच्या प्रकरणात खरा होता आणि आत्ताच बदलला गेला आहे. आतापर्यंत 'उष्माक्षेपी' हा 'घडते' चा चांगला पर्याय होता — बहुतांश स्वयंस्फूर्त अभिक्रिया उष्णता सोडतातच, आणि हा उपयुक्त पहिला अंदाज. पण तो केवळ पर्याय, आणि हाच प्रयोग प्रतिउदाहरण. खरी कसोटी गिब्स मुक्त ऊर्जा: ΔG = ΔH − TΔS, आणि प्रक्रिया नेमकी तेव्हा स्वयंस्फूर्त जेव्हा ΔG ऋण असतो. दोन पदे, आणि ती असहमत असू शकतात. अमोनियम क्लोराइड विरघळण्यासाठी ΔH सुमारे +15 kJ/mol धन — स्फटिक जालकातून आयन ओढायला ऊर्जा जमवावी लागते, आणि त्या आयनांचे जलयोजन ती पूर्णपणे भरून काढत नाही. म्हणूनच बीकर थंड होतो: उष्णता स्वतः पाण्यातून घेतली जाते. पण ΔS ही धन आहे, आणि बरीच. स्फटिक ही द्रव्याच्या सर्वांत व्यवस्थित मांडणींपैकी एक: पुनरावृत्त जालकात प्रत्येक आयन ठरलेल्या जागी. तो विरघळवणे ते आयन द्रवभर यादृच्छिक विखुरते, आणि उपलब्ध मांडणींची संख्या प्रचंड वाढते. 298 K वर TΔS पद ΔH हून मोठे, म्हणून ΔG ऋण निघतो आणि क्षार आपोआप विरघळतो — पूर्णपणे एन्ट्रॉपीने चालवलेला, तर एन्थाल्पी पूर्ण काळ विरोध करत. आता तापमानाचा प्रश्न, जो चौथा पर्याय उलटा करतो. एन्ट्रॉपी पद T चा गुणक वाहते, आणि एन्थाल्पी पद नाही. तापमान घटवा आणि TΔS आकुंचते तर ΔH जागेवर राहते, म्हणून तराजू ΔH कडे झुकतो. एका तापमानाखाली धन ΔH जिंकतो, ΔG धन होतो, आणि विरघळणे स्वयंस्फूर्त असणे थांबते. हे काल्पनिक नाही: पाणी थंड होताना अमोनियम क्लोराइडची विद्राव्यता सतत घटते, आणि नेमक्या याच पद्धतीने असे क्षार पुनःस्फटिकीकरणाने शुद्ध केले जातात — गरमात विरघळवा, थंड करा, आणि स्फटिक परत येतात. सामान्य आकृतिबंध तक्त्यात मांडण्याजोगा. जेव्हा ΔH ऋण आणि ΔS धन, प्रक्रिया प्रत्येक तापमानावर स्वयंस्फूर्त. जेव्हा दोन्ही धन, तिला उच्च तापमान लागते. जेव्हा दोन्ही ऋण, कमी. जेव्हा ΔH धन आणि ΔS ऋण, ती कधी घडतच नाही. रसायनातील प्रत्येक अभिक्रिया याच चार खोक्यांपैकी एकात पडते, आणि कोणत्या हे जाणणे कोणत्याही पुढील मापाशिवाय सांगते की तापवल्याने तिचे वर्तन कसे बदलेल. (दुसरे उत्तर असे वाचन नाकारते जे कोणीही तापमापकाने घेऊ शकतो, आणि तिसरे जो नियम वाचवण्याची गरजच नाही तो वाचवायला परिसराला संचात चोरून पाठवते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "The synthesis of ammonia from nitrogen and hydrogen has ΔH = −92 kJ/mol and ΔS = −0.198 kJ/mol/K. It is nevertheless run industrially at about 700 K, where those figures make ΔG positive. Explain the apparent contradiction.",
          hi: "नाइट्रोजन और हाइड्रोजन से अमोनिया के संश्लेषण का ΔH = −92 kJ/mol और ΔS = −0.198 kJ/mol/K है। फिर भी वह औद्योगिक रूप से लगभग 700 K पर चलाया जाता है, जहाँ ये आँकड़े ΔG को धनात्मक बना देते हैं। आभासी विरोधाभास समझाओ।",
          mr: "नायट्रोजन आणि हायड्रोजनपासून अमोनियाच्या संश्लेषणाचा ΔH = −92 kJ/mol आणि ΔS = −0.198 kJ/mol/K आहे. तरीही ते औद्योगिकरीत्या सुमारे 700 K वर चालवले जाते, जिथे हे आकडे ΔG धन बनवतात. आभासी विरोधाभास समजावा.",
        },
        choices: [
          {
            en: "Thermodynamics and kinetics are answering different questions. ΔG says how far a reaction can go, and at 700 K it is indeed unfavourable — the equilibrium yield is poor. But at 298 K, where ΔG is comfortably negative, the nitrogen triple bond is so strong that the reaction is immeasurably slow. The high temperature is a deliberate sacrifice of yield for rate, and the loss is recovered by running at 200 atmospheres, which shifts the equilibrium back by Le Chatelier since four moles of gas become two",
            hi: "ऊष्मागतिकी और बलगतिकी भिन्न प्रश्नों के उत्तर दे रही हैं। ΔG बताता है कि अभिक्रिया कितनी दूर जा सकती है, और 700 K पर वह सचमुच प्रतिकूल है — साम्य लब्धि ख़राब है। पर 298 K पर, जहाँ ΔG आराम से ऋणात्मक है, नाइट्रोजन का त्रिबंध इतना प्रबल है कि अभिक्रिया अमापनीय रूप से धीमी है। ऊँचा ताप लब्धि की जानबूझकर दी गई क़ुर्बानी है दर के लिए, और हानि 200 वायुमंडल पर चलाकर वापस पाई जाती है, जो ले शातेलिए से साम्य वापस खिसका देता है क्योंकि चार मोल गैस दो हो जाती है",
            mr: "उष्मागतिकी आणि गतिकी वेगळ्या प्रश्नांची उत्तरे देत आहेत. ΔG सांगतो की अभिक्रिया किती दूर जाऊ शकते, आणि 700 K वर ती खरोखर प्रतिकूल — समतोल उत्पन्न वाईट. पण 298 K वर, जिथे ΔG आरामात ऋण, नायट्रोजनचा त्रिबंध इतका प्रबळ की अभिक्रिया न मोजण्याइतकी सावकाश. उच्च तापमान ही उत्पन्नाची मुद्दाम दिलेली कुर्बानी दरासाठी, आणि हानी 200 वातावरणांवर चालवून परत मिळवली जाते, जे ल शातेलिएने समतोल परत सरकवते कारण चार मोल वायू दोन होतात",
          },
          {
            en: "The figures must be wrong, since a reaction cannot be run at a temperature where its ΔG is positive",
            hi: "आँकड़े ग़लत होंगे, क्योंकि जिस ताप पर ΔG धनात्मक हो उस पर अभिक्रिया चलाई नहीं जा सकती",
            mr: "आकडे चुकीचे असणार, कारण ज्या तापमानावर ΔG धन असतो त्यावर अभिक्रिया चालवता येत नाही",
          },
          {
            en: "The catalyst changes ΔG to a negative value, which is what catalysts are for",
            hi: "उत्प्रेरक ΔG को ऋणात्मक मान में बदल देता है, और उत्प्रेरक इसी के लिए होते हैं",
            mr: "उत्प्रेरक ΔG ला ऋण मूल्यात बदलतो, आणि उत्प्रेरक याचसाठी असतात",
          },
          {
            en: "Raising the temperature always increases the yield of an exothermic reaction, so 700 K is chosen for yield rather than rate",
            hi: "ताप बढ़ाने से ऊष्माक्षेपी अभिक्रिया की लब्धि सदा बढ़ती है, अतः 700 K दर के लिए नहीं लब्धि के लिए चुना गया है",
            mr: "तापमान वाढवल्याने उष्माक्षेपी अभिक्रियेचे उत्पन्न नेहमी वाढते, म्हणून 700 K दरासाठी नव्हे तर उत्पन्नासाठी निवडले आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Do the arithmetic first, because it confirms rather than dissolves the puzzle. At 298 K, ΔG = −92 − (298)(−0.198) = −92 + 59 = −33 kJ/mol: comfortably spontaneous. At 700 K, ΔG = −92 − (700)(−0.198) = −92 + 139 = +47 kJ/mol: distinctly unfavourable. The industrial process really is run in the unfavourable region, and the figures are not in error. The resolution is that ΔG answers only one of the two questions a chemical engineer must ask. It says where equilibrium lies — how much ammonia can be present when the reaction has finished changing. It says nothing whatever about how long that will take. Rate is governed by activation energy, and the barrier here is the nitrogen–nitrogen triple bond at 941 kJ/mol, one of the strongest in chemistry. At room temperature the fraction of collisions carrying that much energy is so small that a mixture of nitrogen and hydrogen can sit indefinitely with no detectable ammonia forming. A perfect yield reached in ten thousand years is worth nothing. So Haber's process trades one against the other. Raising the temperature to about 700 K makes the reaction fast enough to be useful, at the cost of a poor equilibrium position. Then the yield is bought back by a second lever: pressure. The reaction takes four moles of gas to two, so compressing the mixture to around 200 atmospheres shifts the equilibrium towards the side with fewer molecules, exactly as Le Chatelier's principle requires. And an iron catalyst is added, which lowers the activation barrier and so allows a lower temperature than would otherwise be needed — recovering some of the sacrificed yield. Note carefully what the catalyst does not do, since the third option gets this wrong. A catalyst provides an easier path between the same two states. It changes the rate, and it changes the forward and reverse rates equally, so the position of equilibrium is untouched. ΔG is a difference between initial and final states and cannot depend on the route, by exactly the argument that gives Hess's law. A catalyst that shifted an equilibrium would be a perpetual-motion machine. The general lesson is the one worth carrying out of both thermodynamics chapters. Thermodynamics tells you whether something is possible and how far it can go; kinetics tells you whether it will happen this century. Neither answers the other's question, and an industrial process is almost always a negotiated settlement between them. (The fourth answer inverts Le Chatelier: heating an exothermic reaction always lowers its yield, which is precisely the cost being paid here.)",
          hi: "पहले गणना करो, क्योंकि वह पहेली घोलने के बजाय पुष्ट करती है। 298 K पर, ΔG = −92 − (298)(−0.198) = −92 + 59 = −33 kJ/mol: आराम से स्वतःस्फूर्त। 700 K पर, ΔG = −92 − (700)(−0.198) = −92 + 139 = +47 kJ/mol: स्पष्ट रूप से प्रतिकूल। औद्योगिक प्रक्रम सचमुच प्रतिकूल क्षेत्र में चलाया जाता है, और आँकड़े ग़लत नहीं। समाधान यह कि रासायनिक अभियंता को जो दो प्रश्न पूछने हैं ΔG उनमें से केवल एक का उत्तर देता है। वह बताता है कि साम्य कहाँ है — अभिक्रिया के बदलना बंद कर देने पर कितनी अमोनिया मौजूद हो सकती है। वह इस बारे में कुछ भी नहीं कहता कि उसमें कितना समय लगेगा। दर सक्रियण ऊर्जा से शासित है, और यहाँ बाधा नाइट्रोजन-नाइट्रोजन त्रिबंध है, 941 kJ/mol पर, रसायन के सबसे प्रबल बंधों में से एक। कमरे के ताप पर उतनी ऊर्जा ढोती टक्करों का अंश इतना छोटा है कि नाइट्रोजन और हाइड्रोजन का मिश्रण अनिश्चित काल बैठा रह सकता है और पकड़ने योग्य कोई अमोनिया नहीं बनती। दस हज़ार वर्ष में मिली पूर्ण लब्धि किसी काम की नहीं। अतः हैबर प्रक्रम एक का सौदा दूसरे से करता है। ताप को लगभग 700 K तक बढ़ाना अभिक्रिया को उपयोगी होने भर तेज़ बना देता है, ख़राब साम्य-स्थिति की क़ीमत पर। फिर लब्धि दूसरे लीवर से वापस ख़रीदी जाती है: दाब। अभिक्रिया चार मोल गैस को दो में ले जाती है, अतः मिश्रण को लगभग 200 वायुमंडल तक संपीड़ित करना साम्य को कम अणुओं वाली ओर खिसका देता है, ठीक जैसा ले शातेलिए का सिद्धांत माँगता है। और लोहे का उत्प्रेरक जोड़ा जाता है, जो सक्रियण बाधा घटाता है और इसलिए उससे नीचा ताप चलने देता है जो अन्यथा चाहिए होता — क़ुर्बान की गई लब्धि का कुछ हिस्सा वापस पाकर। ध्यान से देखो उत्प्रेरक क्या नहीं करता, क्योंकि तीसरा विकल्प यही ग़लत करता है। उत्प्रेरक उन्हीं दो अवस्थाओं के बीच आसान रास्ता देता है। वह दर बदलता है, और अग्र तथा प्रतीप दोनों दरें बराबर बदलता है, अतः साम्य की स्थिति अछूती रहती है। ΔG आरंभिक और अंतिम अवस्थाओं का अंतर है और रास्ते पर निर्भर हो ही नहीं सकता, ठीक उसी तर्क से जो हेस का नियम देता है। जो उत्प्रेरक साम्य खिसका दे वह सतत-गति यंत्र होता। सामान्य सबक़ वही है जो दोनों ऊष्मागतिकी अध्यायों से ले जाने योग्य है। ऊष्मागतिकी बताती है कि कुछ संभव है या नहीं और कितनी दूर जा सकता है; बलगतिकी बताती है कि वह इस शताब्दी में होगा या नहीं। कोई भी दूसरे के प्रश्न का उत्तर नहीं देती, और औद्योगिक प्रक्रम लगभग सदा उनके बीच बातचीत से हुआ समझौता है। (चौथा उत्तर ले शातेलिए को उलट देता है: ऊष्माक्षेपी अभिक्रिया को गरम करना उसकी लब्धि सदा घटाता है, और यही वह क़ीमत है जो यहाँ चुकाई जा रही है।)",
          mr: "आधी आकडेमोड करा, कारण ती कोडे विरघळवण्याऐवजी पुष्ट करते. 298 K वर, ΔG = −92 − (298)(−0.198) = −92 + 59 = −33 kJ/mol: आरामात स्वयंस्फूर्त. 700 K वर, ΔG = −92 − (700)(−0.198) = −92 + 139 = +47 kJ/mol: स्पष्टपणे प्रतिकूल. औद्योगिक प्रक्रिया खरोखर प्रतिकूल प्रदेशात चालवली जाते, आणि आकडे चुकीचे नाहीत. निराकरण हे की रासायनिक अभियंत्याला जे दोन प्रश्न विचारायचे त्यांपैकी ΔG केवळ एकाचे उत्तर देतो. तो सांगतो की समतोल कुठे आहे — अभिक्रिया बदलणे थांबवल्यावर किती अमोनिया उपस्थित असू शकतो. त्याला किती वेळ लागेल याबद्दल तो काहीही सांगत नाही. दर सक्रियण ऊर्जेने नियंत्रित, आणि इथली अडचण नायट्रोजन-नायट्रोजन त्रिबंध, 941 kJ/mol वर, रसायनातील सर्वांत प्रबळ बंधांपैकी एक. खोलीच्या तापमानावर तितकी ऊर्जा वाहणाऱ्या टक्करींचा अंश इतका लहान की नायट्रोजन आणि हायड्रोजनचे मिश्रण अनिश्चित काळ बसून राहू शकते आणि ओळखण्याजोगा कोणताही अमोनिया तयार होत नाही. दहा हजार वर्षांत मिळालेले परिपूर्ण उत्पन्न कशाच्याही कामाचे नाही. म्हणून हेबर प्रक्रिया एकाचा सौदा दुसऱ्याशी करते. तापमान सुमारे 700 K पर्यंत वाढवणे अभिक्रियेला उपयोगी होण्याइतके वेगवान बनवते, वाईट समतोल-स्थितीच्या किमतीवर. मग उत्पन्न दुसऱ्या लिव्हरने परत विकत घेतले जाते: दाब. अभिक्रिया चार मोल वायूला दोनमध्ये नेते, म्हणून मिश्रण सुमारे 200 वातावरणांपर्यंत संपीडित करणे समतोल कमी रेणूंच्या बाजूला सरकवते, अगदी जसे ल शातेलिएचे तत्त्व मागते. आणि लोखंडाचा उत्प्रेरक जोडला जातो, जो सक्रियण अडचण घटवतो आणि म्हणून अन्यथा लागले असते त्याहून कमी तापमान चालू देतो — कुर्बान केलेल्या उत्पन्नाचा काही भाग परत मिळवून. काळजीपूर्वक पाहा उत्प्रेरक काय करत नाही, कारण तिसरा पर्याय हेच चुकीचे करतो. उत्प्रेरक त्याच दोन अवस्थांमध्ये सोपा मार्ग देतो. तो दर बदलतो, आणि पुढचे व मागचे दोन्ही दर समान बदलतो, म्हणून समतोलाची स्थिती अस्पर्श राहते. ΔG हा सुरुवातीच्या आणि शेवटच्या अवस्थांमधला फरक आणि मार्गावर अवलंबून असूच शकत नाही, नेमक्या त्याच युक्तिवादाने जो हेसचा नियम देतो. जो उत्प्रेरक समतोल सरकवेल तो सततगती यंत्र ठरला असता. सामान्य धडा तोच जो दोन्ही उष्मागतिकी प्रकरणांतून नेण्याजोगा. उष्मागतिकी सांगते की काही शक्य आहे का आणि किती दूर जाऊ शकते; गतिकी सांगते की ते या शतकात घडेल का. कोणीही दुसऱ्याच्या प्रश्नाचे उत्तर देत नाही, आणि औद्योगिक प्रक्रिया जवळपास नेहमी त्यांच्यातील वाटाघाटीने झालेली तडजोड. (चौथे उत्तर ल शातेलिए उलटवते: उष्माक्षेपी अभिक्रिया तापवणे तिचे उत्पन्न नेहमी घटवते, आणि हीच ती किंमत जी इथे दिली जात आहे.)",
        },
      },
      /*H5C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Equilibrium                                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-equilibrium",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 6 — Equilibrium",
      hi: "अध्याय 6 — साम्यावस्था",
      mr: "प्रकरण 6 — समतोल",
    },
    name: {
      en: "Equilibrium",
      hi: "साम्यावस्था",
      mr: "समतोल",
    },
    summary: {
      en: "Most reactions do not go to completion; they arrive somewhere and stop, and the stopping place can be predicted. A stillness that is nothing of the sort because both directions are still running at the same speed, a number that fixes the resting composition at a given temperature, a rule for how a disturbed system pushes back, and the same arithmetic applied to water itself, which turns out to be very slightly split at all times.",
      hi: "अधिकांश अभिक्रियाएँ पूर्णता तक नहीं जातीं; वे कहीं पहुँचकर रुक जाती हैं, और रुकने की जगह बताई जा सकती है। वह निश्चलता जो निश्चलता है ही नहीं क्योंकि दोनों दिशाएँ अब भी उसी चाल से चल रही हैं, वह संख्या जो दिए ताप पर विश्राम-संघटन तय करती है, वह नियम जो बताता है कि विचलित निकाय कैसे पलटकर धकेलता है, और वही गणित स्वयं पानी पर लगाया गया, जो निकलता है कि हर समय बहुत थोड़ा टूटा हुआ है।",
      mr: "बहुतांश अभिक्रिया पूर्णत्वापर्यंत जात नाहीत; त्या कुठेतरी पोहोचून थांबतात, आणि थांबण्याची जागा सांगता येते. ती निश्चलता जी निश्चलता नाहीच कारण दोन्ही दिशा अजूनही त्याच वेगाने चालत आहेत, ती संख्या जी दिलेल्या तापमानावर विश्रांती-संघटन ठरवते, तो नियम जो सांगतो की विचलित संच कसा उलट रेटा देतो, आणि तेच गणित स्वतः पाण्यावर लावलेले, जे निघते की ते सर्व वेळ फार थोडे तुटलेले असते.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "dynamic-equilibrium",
        name: {
          en: "Dynamic equilibrium",
          hi: "गतिक साम्य",
          mr: "गतिक समतोल",
        },
        kind: "state",
        prompt: {
          en: "A sealed bottle of water shows no change for years, and yet molecules are leaving the surface and returning at exactly matched rates the whole time, as a radioactive tracer would immediately reveal. Which state is this?",
          hi: "पानी की बंद बोतल वर्षों कोई परिवर्तन नहीं दिखाती, फिर भी पूरे समय अणु सतह से निकल रहे और लौट रहे हैं, ठीक बराबर दरों पर, जैसा रेडियोसक्रिय अनुरेखक तुरंत उजागर कर देता। यह कौन-सी अवस्था है?",
          mr: "पाण्याची बंद बाटली वर्षानुवर्षे कोणताही बदल दाखवत नाही, तरीही पूर्ण काळ रेणू पृष्ठभागावरून निघत आणि परतत आहेत, नेमक्या समान दरांनी, जसे किरणोत्सर्गी अनुरेखक लगेच उघड करेल. ही कोणती अवस्था?",
        },
        statement: {
          en: "At dynamic equilibrium the forward and reverse processes continue at equal rates, so the composition stays constant although nothing has actually stopped.",
          hi: "गतिक साम्य पर अग्र और प्रतीप प्रक्रियाएँ बराबर दरों पर चलती रहती हैं, अतः संघटन अचर रहता है यद्यपि वस्तुतः कुछ रुका नहीं है।",
          mr: "गतिक समतोलावर पुढच्या आणि मागच्या प्रक्रिया समान दरांनी चालू राहतात, म्हणून संघटन अचल राहते जरी प्रत्यक्षात काहीही थांबलेले नाही.",
        },
        detail: {
          en: "It can only be reached in a closed system, because an open one lets a product escape and the reverse reaction never gets the chance to catch up.",
          hi: "वह केवल बंद निकाय में मिल सकता है, क्योंकि खुला निकाय किसी उत्पाद को निकल जाने देता है और प्रतीप अभिक्रिया को पकड़ने का मौक़ा कभी नहीं मिलता।",
          mr: "तो केवळ बंद संचातच मिळू शकतो, कारण उघडा संच एखाद्या उत्पादाला निसटू देतो आणि मागच्या अभिक्रियेला गाठण्याची संधी कधीच मिळत नाही.",
        },
        extra: {
          en: "The same equilibrium is reached from either side: start with pure reactants or pure products at the same temperature and pressure, and the final composition is identical.",
          hi: "वही साम्य दोनों ओर से मिलता है: उसी ताप और दाब पर शुद्ध अभिकारकों से शुरू करो या शुद्ध उत्पादों से, अंतिम संघटन समान होता है।",
          mr: "तोच समतोल दोन्ही बाजूंनी गाठला जातो: त्याच तापमान आणि दाबावर शुद्ध अभिक्रियाकारकांपासून सुरू करा वा शुद्ध उत्पादांपासून, शेवटचे संघटन सारखेच.",
        },
        pair: {
          left: {
            en: "Nothing changing and nothing stopped",
            hi: "कुछ नहीं बदलता और कुछ रुका नहीं",
            mr: "काहीही बदलत नाही आणि काहीही थांबलेले नाही",
          },
          right: {
            en: "dynamic equilibrium",
            hi: "गतिक साम्य",
            mr: "गतिक समतोल",
          },
        },
      },
      {
        id: "equilibrium-constant",
        name: {
          en: "The equilibrium constant",
          hi: "साम्य स्थिरांक",
          mr: "समतोल स्थिरांक",
        },
        kind: "state",
        prompt: {
          en: "However much of each substance is put in at the start, the products and reactants at rest always settle into the same ratio of concentrations raised to their coefficients. Which quantity is this?",
          hi: "आरंभ में हर पदार्थ कितना भी डाला जाए, विश्राम पर उत्पाद और अभिकारक सदा सांद्रताओं के उसी अनुपात पर ठहरते हैं, जिनमें हर सांद्रता अपने गुणांक की घात पर हो। यह कौन-सी राशि है?",
          mr: "सुरुवातीला प्रत्येक पदार्थ कितीही टाकला तरी, विश्रांतीवर उत्पादे आणि अभिक्रियाकारक नेहमी संहतींच्या त्याच गुणोत्तरावर स्थिरावतात, जिथे प्रत्येक संहती आपल्या गुणांकाच्या घातेवर. ही कोणती राशी?",
        },
        statement: {
          en: "The equilibrium constant is the ratio of product concentrations to reactant concentrations, each raised to its stoichiometric coefficient, and it depends only on the temperature.",
          hi: "साम्य स्थिरांक उत्पादों की सांद्रताओं और अभिकारकों की सांद्रताओं का अनुपात है, जिनमें हर एक अपने रससमीकरणमितीय गुणांक की घात पर है, और वह केवल ताप पर निर्भर है।",
          mr: "समतोल स्थिरांक म्हणजे उत्पादांच्या संहती आणि अभिक्रियाकारकांच्या संहती यांचे गुणोत्तर, जिथे प्रत्येक आपल्या रससमीकरणमितीय गुणांकाच्या घातेवर, आणि तो केवळ तापमानावर अवलंबून.",
        },
        detail: {
          en: "It says where equilibrium lies and nothing about how fast it is reached, so a reaction with an enormous K can still take a century if no catalyst is present.",
          hi: "वह बताता है कि साम्य कहाँ है, यह नहीं कि वहाँ कितनी जल्दी पहुँचा जाता है, अतः विशाल K वाली अभिक्रिया भी बिना उत्प्रेरक के सदी भर ले सकती है।",
          mr: "तो सांगतो की समतोल कुठे आहे, तिथे किती लवकर पोहोचले जाते हे नाही, म्हणून प्रचंड K असलेली अभिक्रियाही उत्प्रेरकाशिवाय शतकभर घेऊ शकते.",
        },
        extra: {
          en: "Pure solids and pure liquids are left out of the expression, because their concentrations cannot change — a lump of limestone has the same density however much of it is present.",
          hi: "शुद्ध ठोस और शुद्ध द्रव व्यंजक से बाहर रखे जाते हैं, क्योंकि उनकी सांद्रताएँ बदल ही नहीं सकतीं — चूना-पत्थर के ढेले का घनत्व वही रहता है, वह कितना भी हो।",
          mr: "शुद्ध घन आणि शुद्ध द्रव अभिव्यक्तीबाहेर ठेवले जातात, कारण त्यांच्या संहती बदलूच शकत नाहीत — चुनखडीच्या ढेकळाची घनता तीच राहते, तो कितीही असो.",
        },
        pair: {
          left: {
            en: "Says where, and never says when",
            hi: "बताता है कहाँ, कभी नहीं बताता कब",
            mr: "सांगतो कुठे, कधीच सांगत नाही केव्हा",
          },
          right: {
            en: "the equilibrium constant",
            hi: "साम्य स्थिरांक",
            mr: "समतोल स्थिरांक",
          },
        },
      },
      {
        id: "le-chateliers-principle",
        name: {
          en: "Le Chatelier's principle",
          hi: "ले शातेलिए का सिद्धांत",
          mr: "ल शातेलिएचे तत्त्व",
        },
        kind: "response",
        prompt: {
          en: "Squeeze a mixture of nitrogen, hydrogen and ammonia and more ammonia appears, because the system shifts towards the side with fewer gas molecules and so partly undoes the squeeze. Which principle is this?",
          hi: "नाइट्रोजन, हाइड्रोजन और अमोनिया के मिश्रण को दबाओ और अधिक अमोनिया प्रकट होती है, क्योंकि निकाय कम गैस-अणुओं वाली ओर खिसक जाता है और इस तरह दबाव को आंशिक रूप से उलट देता है। यह कौन-सा सिद्धांत है?",
          mr: "नायट्रोजन, हायड्रोजन आणि अमोनियाचे मिश्रण दाबा आणि अधिक अमोनिया प्रकट होते, कारण संच कमी वायुरेणू असलेल्या बाजूला सरकतो आणि अशा प्रकारे दाब अंशतः उलटवतो. हे कोणते तत्त्व?",
        },
        statement: {
          en: "Le Chatelier's principle says a system at equilibrium responds to a disturbance by shifting in the direction that partly opposes it, whether the disturbance is concentration, pressure or temperature.",
          hi: "ले शातेलिए का सिद्धांत कहता है कि साम्य पर निकाय किसी विक्षोभ का उत्तर उस दिशा में खिसककर देता है जो उसका आंशिक विरोध करे, विक्षोभ चाहे सांद्रता का हो, दाब का या ताप का।",
          mr: "ल शातेलिएचे तत्त्व सांगते की समतोलावरचा संच एखाद्या विक्षोभाला त्याला अंशतः विरोध करणाऱ्या दिशेने सरकून उत्तर देतो, विक्षोभ संहतीचा असो, दाबाचा असो वा तापमानाचा.",
        },
        detail: {
          en: "Only temperature actually changes the equilibrium constant; concentration and pressure move the system along a curve that K itself has already fixed.",
          hi: "साम्य स्थिरांक वस्तुतः केवल ताप बदलता है; सांद्रता और दाब निकाय को उस वक्र पर सरकाते हैं जिसे K ने पहले ही तय कर रखा है।",
          mr: "समतोल स्थिरांक प्रत्यक्षात केवळ तापमानच बदलते; संहती आणि दाब संचाला त्या वक्रावर सरकवतात जो K ने आधीच ठरवला आहे.",
        },
        extra: {
          en: "A catalyst disturbs nothing at all: it speeds the forward and reverse reactions by the same factor, so equilibrium arrives sooner and in exactly the same place.",
          hi: "उत्प्रेरक कुछ भी विचलित नहीं करता: वह अग्र और प्रतीप दोनों अभिक्रियाओं को उसी गुणक से तेज़ करता है, अतः साम्य जल्दी आता है और ठीक उसी जगह।",
          mr: "उत्प्रेरक काहीही विचलित करत नाही: तो पुढच्या आणि मागच्या दोन्ही अभिक्रिया त्याच पटीने वेगवान करतो, म्हणून समतोल लवकर येतो आणि नेमक्या त्याच ठिकाणी.",
        },
        pair: {
          left: {
            en: "Push, and it pushes back — partly",
            hi: "धकेलो, और वह पलटकर धकेलता है — आंशिक रूप से",
            mr: "ढकला, आणि तो उलट ढकलतो — अंशतः",
          },
          right: {
            en: "Le Chatelier's principle",
            hi: "ले शातेलिए का सिद्धांत",
            mr: "ल शातेलिएचे तत्त्व",
          },
        },
      },
      {
        id: "reaction-quotient",
        name: {
          en: "The reaction quotient",
          hi: "अभिक्रिया भागफल",
          mr: "अभिक्रिया भागांक",
        },
        kind: "response",
        prompt: {
          en: "The same expression as the equilibrium constant, but evaluated at any moment rather than only at rest — and comparing it with K tells you which way the mixture is about to move. Which quantity is this?",
          hi: "साम्य स्थिरांक जैसा ही व्यंजक, पर केवल विश्राम पर नहीं बल्कि किसी भी क्षण निकाला गया — और उसकी K से तुलना बताती है कि मिश्रण किस ओर बढ़ने वाला है। यह कौन-सी राशि है?",
          mr: "समतोल स्थिरांकासारखीच अभिव्यक्ती, पण केवळ विश्रांतीवर नव्हे तर कोणत्याही क्षणी काढलेली — आणि तिची K शी तुलना सांगते की मिश्रण कोणत्या दिशेने जाणार आहे. ही कोणती राशी?",
        },
        statement: {
          en: "The reaction quotient Q has the same form as K but uses the concentrations present at that instant, so Q less than K means the reaction goes forward and Q greater than K means it goes back.",
          hi: "अभिक्रिया भागफल Q का रूप K जैसा ही है पर वह उस क्षण मौजूद सांद्रताएँ लगाता है, अतः Q का K से कम होना अभिक्रिया के आगे बढ़ने और अधिक होना पीछे जाने का अर्थ रखता है।",
          mr: "अभिक्रिया भागांक Q चे रूप K सारखेच पण तो त्या क्षणी उपस्थित संहती वापरतो, म्हणून Q हा K हून कमी असणे म्हणजे अभिक्रिया पुढे जाते आणि जास्त असणे म्हणजे मागे.",
        },
        detail: {
          en: "It turns Le Chatelier's qualitative rule into an arithmetic one: instead of reasoning about which way a disturbance pushes, compute Q after the disturbance and compare.",
          hi: "वह ले शातेलिए के गुणात्मक नियम को अंकगणितीय बना देता है: विक्षोभ किस ओर धकेलता है यह तर्क करने के बजाय, विक्षोभ के बाद Q निकालो और तुलना करो।",
          mr: "तो ल शातेलिएचा गुणात्मक नियम अंकगणितीय बनवतो: विक्षोभ कोणत्या दिशेने ढकलतो हा युक्तिवाद करण्याऐवजी, विक्षोभानंतर Q काढा आणि तुलना करा.",
        },
        extra: {
          en: "The same comparison decides whether a precipitate forms: work out the ionic product for a salt about to be mixed, and if it exceeds the solubility product the solid appears.",
          hi: "वही तुलना तय करती है कि अवक्षेप बनेगा या नहीं: मिलाए जाने वाले लवण का आयनिक गुणनफल निकालो, और वह विलेयता गुणनफल से बड़ा हो तो ठोस प्रकट हो जाता है।",
          mr: "तीच तुलना अवक्षेप तयार होईल की नाही हे ठरवते: मिसळल्या जाणाऱ्या क्षाराचा आयनिक गुणाकार काढा, आणि तो विद्राव्यता गुणाकाराहून मोठा असल्यास घन प्रकट होतो.",
        },
        pair: {
          left: {
            en: "Compare it with K and you know the direction",
            hi: "उसकी K से तुलना करो और दिशा पता चल जाती है",
            mr: "त्याची K शी तुलना करा आणि दिशा कळते",
          },
          right: {
            en: "the reaction quotient",
            hi: "अभिक्रिया भागफल",
            mr: "अभिक्रिया भागांक",
          },
        },
      },
      {
        id: "ionic-product-of-water",
        name: {
          en: "The ionic product of water",
          hi: "जल का आयनिक गुणनफल",
          mr: "पाण्याचा आयनिक गुणाकार",
        },
        kind: "aqueous",
        prompt: {
          en: "Even the purest water conducts very slightly, because about one molecule in every five hundred million has split into a hydrogen ion and a hydroxide ion at any instant. Which constant describes this?",
          hi: "सबसे शुद्ध पानी भी बहुत थोड़ा चालन करता है, क्योंकि किसी भी क्षण लगभग हर पचास करोड़ में से एक अणु हाइड्रोजन आयन और हाइड्रॉक्साइड आयन में टूटा हुआ है। यह कौन-सा स्थिरांक इसका वर्णन करता है?",
          mr: "सर्वांत शुद्ध पाणीही फार थोडे वहन करते, कारण कोणत्याही क्षणी सुमारे प्रत्येक पन्नास कोटींपैकी एक रेणू हायड्रोजन आयन आणि हायड्रॉक्साइड आयनात तुटलेला असतो. हा कोणता स्थिरांक याचे वर्णन करतो?",
        },
        statement: {
          en: "The ionic product Kw is the product of the hydrogen-ion and hydroxide-ion concentrations, equal to 10⁻¹⁴ at 25 °C, and it holds in every aqueous solution however acidic or alkaline.",
          hi: "आयनिक गुणनफल Kw हाइड्रोजन-आयन और हाइड्रॉक्साइड-आयन सांद्रताओं का गुणनफल है, 25 °C पर 10⁻¹⁴ के बराबर, और वह हर जलीय विलयन में चलता है, वह कितना ही अम्लीय या क्षारीय हो।",
          mr: "आयनिक गुणाकार Kw म्हणजे हायड्रोजन-आयन आणि हायड्रॉक्साइड-आयन संहतींचा गुणाकार, 25 °C वर 10⁻¹⁴ इतका, आणि तो प्रत्येक जलीय द्रावणात चालतो, ते कितीही आम्लधर्मी वा आम्लारीधर्मी असो.",
        },
        detail: {
          en: "It is why pH and pOH always add to 14 at that temperature, and why an acid does not merely add hydrogen ions but drives the hydroxide concentration down to keep the product fixed.",
          hi: "इसी से उस ताप पर pH और pOH सदा जुड़कर 14 होते हैं, और इसी से अम्ल केवल हाइड्रोजन आयन जोड़ता ही नहीं बल्कि गुणनफल टिकाए रखने को हाइड्रॉक्साइड सांद्रता नीचे धकेल देता है।",
          mr: "म्हणूनच त्या तापमानावर pH आणि pOH नेहमी मिळून 14 होतात, आणि म्हणूनच आम्ल केवळ हायड्रोजन आयन जोडत नाही तर गुणाकार टिकवण्यासाठी हायड्रॉक्साइड संहती खाली ढकलते.",
        },
        extra: {
          en: "Kw rises with temperature, so water at 60 °C is neutral at a pH near 6.5 rather than 7 — neutrality means equal ion concentrations, not the number seven.",
          hi: "Kw ताप के साथ बढ़ता है, अतः 60 °C का पानी 7 के बजाय लगभग 6.5 pH पर उदासीन है — उदासीनता का अर्थ बराबर आयन-सांद्रताएँ है, संख्या सात नहीं।",
          mr: "Kw तापमानासोबत वाढतो, म्हणून 60 °C चे पाणी 7 ऐवजी सुमारे 6.5 pH वर उदासीन — उदासीनता म्हणजे समान आयन-संहती, सात ही संख्या नव्हे.",
        },
        pair: {
          left: {
            en: "Neutral at 6.5, and still neutral",
            hi: "6.5 पर उदासीन, और फिर भी उदासीन",
            mr: "6.5 वर उदासीन, आणि तरीही उदासीन",
          },
          right: {
            en: "the ionic product of water",
            hi: "जल का आयनिक गुणनफल",
            mr: "पाण्याचा आयनिक गुणाकार",
          },
        },
      },
      {
        id: "buffer-solution",
        name: {
          en: "The buffer solution",
          hi: "बफ़र विलयन",
          mr: "बफर द्रावण",
        },
        kind: "aqueous",
        prompt: {
          en: "Add a drop of strong acid to pure water and the pH plunges by four units; add the same drop to a mixture of a weak acid and its salt and the pH barely stirs. Which system is this?",
          hi: "शुद्ध पानी में प्रबल अम्ल की एक बूँद डालो और pH चार इकाई गिर जाता है; वही बूँद दुर्बल अम्ल और उसके लवण के मिश्रण में डालो और pH मुश्किल से हिलता है। यह कौन-सा निकाय है?",
          mr: "शुद्ध पाण्यात प्रबळ आम्लाचा एक थेंब टाका आणि pH चार एककांनी कोसळतो; तोच थेंब दुर्बल आम्ल आणि त्याच्या क्षाराच्या मिश्रणात टाका आणि pH जेमतेम हलतो. ही कोणती प्रणाली?",
        },
        statement: {
          en: "A buffer is a mixture of a weak acid and its conjugate base which resists change in pH, because each added hydrogen ion is mopped up by the base and each added hydroxide by the acid.",
          hi: "बफ़र दुर्बल अम्ल और उसके संयुग्मी क्षारक का मिश्रण है जो pH में परिवर्तन का प्रतिरोध करता है, क्योंकि जोड़ा गया हर हाइड्रोजन आयन क्षारक सोख लेता है और हर हाइड्रॉक्साइड अम्ल।",
          mr: "बफर म्हणजे दुर्बल आम्ल आणि त्याचा संयुग्मी आम्लारी यांचे मिश्रण जे pH मधील बदलाला विरोध करते, कारण जोडलेला प्रत्येक हायड्रोजन आयन आम्लारी शोषतो आणि प्रत्येक हायड्रॉक्साइड आम्ल.",
        },
        detail: {
          en: "Its pH is given by pKa plus the logarithm of the salt-to-acid ratio, so a buffer made with equal amounts of the two sits exactly at the acid's pKa.",
          hi: "उसका pH, pKa जोड़ लवण-और-अम्ल अनुपात का लघुगणक है, अतः दोनों की बराबर मात्राओं से बना बफ़र ठीक अम्ल के pKa पर बैठता है।",
          mr: "त्याचा pH म्हणजे pKa अधिक क्षार-आणि-आम्ल गुणोत्तराचा लॉगरिथम, म्हणून दोघांच्या समान प्रमाणांनी बनवलेले बफर नेमके आम्लाच्या pKa वर बसते.",
        },
        extra: {
          en: "Blood is buffered by carbonic acid and hydrogencarbonate and is held between 7.35 and 7.45; a drift of a few tenths in either direction is a medical emergency.",
          hi: "रक्त कार्बोनिक अम्ल और हाइड्रोजनकार्बोनेट से बफ़रित है और 7.35 तथा 7.45 के बीच थामा जाता है; किसी भी ओर कुछ दसवें हिस्से का खिसकाव चिकित्सकीय आपात है।",
          mr: "रक्त कार्बोनिक आम्ल आणि हायड्रोजनकार्बोनेटने बफर केलेले आणि 7.35 व 7.45 दरम्यान धरलेले; कोणत्याही दिशेने काही दशांशांचे सरकणे ही वैद्यकीय आणीबाणी.",
        },
        pair: {
          left: {
            en: "Four units in water and almost none here",
            hi: "पानी में चार इकाई और यहाँ लगभग कुछ नहीं",
            mr: "पाण्यात चार एकके आणि इथे जवळपास काहीच नाही",
          },
          right: {
            en: "the buffer solution",
            hi: "बफ़र विलयन",
            mr: "बफर द्रावण",
          },
        },
      },
      /*F6C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In the Haber process a chemist adds a catalyst and observes that ammonia appears far sooner. A student concludes the catalyst has increased the yield. Explain what a catalyst does and does not change, and how the yield is actually raised.",
          hi: "हैबर प्रक्रम में एक रसायनज्ञ उत्प्रेरक जोड़ता है और देखता है कि अमोनिया कहीं जल्दी प्रकट होती है। एक विद्यार्थी निष्कर्ष निकालता है कि उत्प्रेरक ने लब्धि बढ़ा दी। समझाओ उत्प्रेरक क्या बदलता है और क्या नहीं, और लब्धि वस्तुतः कैसे बढ़ाई जाती है।",
          mr: "हेबर प्रक्रियेत एक रसायनशास्त्रज्ञ उत्प्रेरक जोडतो आणि पाहतो की अमोनिया कितीतरी लवकर प्रकट होते. एक विद्यार्थी निष्कर्ष काढतो की उत्प्रेरकाने उत्पन्न वाढवले. उत्प्रेरक काय बदलतो आणि काय नाही, आणि उत्पन्न प्रत्यक्षात कसे वाढवले जाते ते समजावा.",
        },
        choices: [
          {
            en: "The catalyst changes only the rate. It lowers the activation barrier for the forward and reverse reactions by exactly the same amount, so both speed up equally and equilibrium is reached sooner but in precisely the same place — K is untouched. The yield is raised instead by high pressure, which shifts the equilibrium towards the two moles of ammonia from four moles of reactant gas, and by keeping the temperature no higher than the rate demands",
            hi: "उत्प्रेरक केवल दर बदलता है। वह अग्र और प्रतीप दोनों अभिक्रियाओं की सक्रियण बाधा ठीक उतनी ही घटाता है, अतः दोनों बराबर तेज़ होती हैं और साम्य जल्दी मिलता है पर ठीक उसी जगह — K अछूता है। लब्धि इसके बजाय ऊँचे दाब से बढ़ाई जाती है, जो साम्य को चार मोल अभिकारक गैस से दो मोल अमोनिया की ओर खिसकाता है, और ताप को दर की माँग से अधिक ऊँचा न रखकर",
            mr: "उत्प्रेरक केवळ दर बदलतो. तो पुढच्या आणि मागच्या दोन्ही अभिक्रियांची सक्रियण अडचण नेमकी तितकीच घटवतो, म्हणून दोन्ही समान वेगवान होतात आणि समतोल लवकर गाठला जातो पण नेमक्या त्याच ठिकाणी — K अस्पर्श. उत्पन्न त्याऐवजी उच्च दाबाने वाढवले जाते, जो समतोल चार मोल अभिक्रियाकारक वायूकडून दोन मोल अमोनियाकडे सरकवतो, आणि तापमान दराच्या मागणीहून अधिक उंच न ठेवून",
          },
          {
            en: "The student is right: a catalyst shifts the equilibrium towards the products, which is what makes it worth adding",
            hi: "विद्यार्थी सही है: उत्प्रेरक साम्य को उत्पादों की ओर खिसका देता है, और इसीलिए उसे जोड़ना सार्थक है",
            mr: "विद्यार्थी बरोबर: उत्प्रेरक समतोल उत्पादांकडे सरकवतो, आणि म्हणूनच तो जोडणे सार्थक",
          },
          {
            en: "The catalyst speeds only the forward reaction, since it is designed for the product that is wanted",
            hi: "उत्प्रेरक केवल अग्र अभिक्रिया तेज़ करता है, क्योंकि वह उसी उत्पाद के लिए बनाया गया है जो चाहिए",
            mr: "उत्प्रेरक केवळ पुढची अभिक्रिया वेगवान करतो, कारण तो हव्या असलेल्या उत्पादासाठीच बनवलेला",
          },
          {
            en: "Yield cannot be changed at all once the reactants are chosen, so pressure and temperature are irrelevant",
            hi: "अभिकारक चुन लेने पर लब्धि बदली ही नहीं जा सकती, अतः दाब और ताप अप्रासंगिक हैं",
            mr: "अभिक्रियाकारक निवडल्यावर उत्पन्न बदलताच येत नाही, म्हणून दाब आणि तापमान असंबद्ध",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The observation is real and the inference is not, and separating them turns on a distinction this chapter exists to draw: where equilibrium lies against how fast it arrives. A catalyst works by offering an alternative path with a lower activation barrier. But a path is a path in both directions. If the forward reaction can now cross a lower hill, so can the reverse — the barrier from the product side is lowered by exactly the same amount, because it is the same hill. Both rate constants rise by the same factor, and since K is the ratio of the two, K is unchanged. Equilibrium arrives sooner and settles in precisely the same place. Nothing else is possible, and the reason is thermodynamic rather than kinetic. ΔG depends only on the initial and final states, by the same argument that gives Hess's law, so a catalyst that shifted equilibrium would have changed ΔG by offering a different route — and one could then run the reaction forward with the catalyst, remove it, let the system relax back, and extract work each time round. A catalyst that moved an equilibrium would be a perpetual-motion machine. So how is the yield actually raised? By the two levers Le Chatelier identifies. Pressure: the reaction takes four moles of gas to two, so compressing to about 200 atmospheres shifts the system towards the side with fewer molecules. Temperature: the reaction is exothermic, so heating lowers the yield — which means the temperature should be kept as low as the rate will allow, and this is exactly what the catalyst buys. It does not raise the yield directly; it makes an acceptable rate available at a lower temperature, and the lower temperature raises the yield. The student's observation and the correct account are therefore not far apart in practice, only in mechanism. Two footnotes. Removing ammonia as it forms is a third lever, and industrially it is used: condensing the product out and recycling the unreacted gases keeps Q below K permanently, so the system never actually reaches equilibrium and the reaction runs continuously. And the third option is worth naming — a catalyst that accelerated only one direction would create a mixture richer in products than equilibrium allows, which is the same impossible machine in different clothes. (The fourth answer denies Le Chatelier's principle outright.)",
          hi: "प्रेक्षण असली है और अनुमान नहीं, और उन्हें अलग करना उस भेद पर टिका है जिसे खींचने के लिए यह अध्याय है: साम्य कहाँ है, इसके सामने वह कितनी जल्दी आता है। उत्प्रेरक कम सक्रियण बाधा वाला वैकल्पिक रास्ता देकर काम करता है। पर रास्ता दोनों दिशाओं में रास्ता है। यदि अग्र अभिक्रिया अब नीची पहाड़ी पार कर सकती है, तो प्रतीप भी — उत्पाद की ओर से बाधा ठीक उतनी ही घटती है, क्योंकि पहाड़ी वही है। दोनों दर-स्थिरांक उसी गुणक से बढ़ते हैं, और चूँकि K दोनों का अनुपात है, K अपरिवर्तित रहता है। साम्य जल्दी आता है और ठीक उसी जगह ठहरता है। और कुछ संभव ही नहीं, और कारण बलगतिक नहीं ऊष्मागतिक है। ΔG केवल आरंभिक और अंतिम अवस्थाओं पर निर्भर है, उसी तर्क से जो हेस का नियम देता है, अतः जो उत्प्रेरक साम्य खिसका दे उसने भिन्न रास्ता देकर ΔG बदल दिया होता — और तब कोई उत्प्रेरक के साथ अभिक्रिया आगे चला सकता, उसे हटा सकता, निकाय को वापस ढलने दे सकता, और हर चक्कर पर कार्य निकाल सकता। जो उत्प्रेरक साम्य खिसकाए वह सतत-गति यंत्र होता। तो लब्धि वस्तुतः बढ़ाई कैसे जाती है? उन्हीं दो लीवरों से जिन्हें ले शातेलिए पहचानते हैं। दाब: अभिक्रिया चार मोल गैस को दो में ले जाती है, अतः लगभग 200 वायुमंडल तक संपीड़न निकाय को कम अणुओं वाली ओर खिसकाता है। ताप: अभिक्रिया ऊष्माक्षेपी है, अतः गरम करना लब्धि घटाता है — जिसका अर्थ है कि ताप उतना ही नीचा रखना चाहिए जितना दर होने दे, और उत्प्रेरक ठीक यही ख़रीदता है। वह लब्धि सीधे नहीं बढ़ाता; वह नीचे ताप पर स्वीकार्य दर उपलब्ध करा देता है, और नीचा ताप लब्धि बढ़ा देता है। अतः विद्यार्थी का प्रेक्षण और सही विवरण व्यवहार में दूर नहीं, केवल क्रियाविधि में। दो पादटिप्पणियाँ। बनते ही अमोनिया हटा देना तीसरा लीवर है, और औद्योगिक रूप से वह लगाया जाता है: उत्पाद को संघनित कर निकालना और बिना अभिक्रिया की गैसें पुनःचक्रित करना Q को स्थायी रूप से K से नीचे रखता है, अतः निकाय वस्तुतः साम्य तक पहुँचता ही नहीं और अभिक्रिया लगातार चलती है। और तीसरा विकल्प नाम लेने योग्य है — जो उत्प्रेरक केवल एक दिशा तेज़ करे वह ऐसा मिश्रण बना देता जो साम्य की अनुमति से अधिक उत्पाद-समृद्ध हो, जो वही असंभव यंत्र है भिन्न कपड़ों में। (चौथा उत्तर ले शातेलिए के सिद्धांत को सिरे से नकार देता है।)",
          mr: "निरीक्षण खरे आणि अनुमान नाही, आणि त्यांना वेगळे करणे त्या भेदावर टेकलेले जो काढण्यासाठी हे प्रकरण आहे: समतोल कुठे आहे, याच्यासमोर तो किती लवकर येतो. उत्प्रेरक कमी सक्रियण अडचणीचा पर्यायी मार्ग देऊन काम करतो. पण मार्ग हा दोन्ही दिशांना मार्गच. पुढची अभिक्रिया आता खालची टेकडी ओलांडू शकत असेल, तर मागचीही — उत्पादाच्या बाजूने अडचण नेमकी तितकीच घटते, कारण टेकडी तीच. दोन्ही दर-स्थिरांक त्याच पटीने वाढतात, आणि K हा दोघांचे गुणोत्तर असल्याने K अपरिवर्तित राहतो. समतोल लवकर येतो आणि नेमक्या त्याच ठिकाणी स्थिरावतो. दुसरे काहीही शक्यच नाही, आणि कारण गतिक नव्हे तर उष्मागतिक. ΔG केवळ सुरुवातीच्या आणि शेवटच्या अवस्थांवर अवलंबून, त्याच युक्तिवादाने जो हेसचा नियम देतो, म्हणून जो उत्प्रेरक समतोल सरकवेल त्याने वेगळा मार्ग देऊन ΔG बदलले असते — आणि मग कोणी उत्प्रेरकासह अभिक्रिया पुढे चालवू शकला असता, तो काढू शकला असता, संचाला परत ढळू दिला असता, आणि प्रत्येक फेरीला कार्य काढू शकला असता. जो उत्प्रेरक समतोल सरकवेल तो सततगती यंत्र ठरला असता. मग उत्पन्न प्रत्यक्षात कसे वाढवले जाते? त्याच दोन लिव्हरनी ज्या ल शातेलिए ओळखतात. दाब: अभिक्रिया चार मोल वायूला दोनमध्ये नेते, म्हणून सुमारे 200 वातावरणांपर्यंत संपीडन संचाला कमी रेणूंच्या बाजूला सरकवते. तापमान: अभिक्रिया उष्माक्षेपी, म्हणून तापवणे उत्पन्न घटवते — याचा अर्थ तापमान दर देईल तितकेच खाली ठेवावे, आणि उत्प्रेरक नेमके हेच विकत घेतो. तो उत्पन्न थेट वाढवत नाही; तो कमी तापमानावर स्वीकारार्ह दर उपलब्ध करून देतो, आणि कमी तापमान उत्पन्न वाढवते. म्हणून विद्यार्थ्याचे निरीक्षण आणि बरोबर वर्णन व्यवहारात दूर नाहीत, केवळ कार्यपद्धतीत. दोन तळटिपा. तयार होताच अमोनिया काढून टाकणे हा तिसरा लिव्हर, आणि औद्योगिकरीत्या तो वापरला जातो: उत्पाद संघनित करून काढणे आणि अभिक्रिया न झालेले वायू पुनर्वापरात आणणे Q ला कायमचे K खाली ठेवते, म्हणून संच प्रत्यक्षात समतोलापर्यंत पोहोचतच नाही आणि अभिक्रिया सतत चालते. आणि तिसरा पर्याय नाव घेण्याजोगा — जो उत्प्रेरक केवळ एक दिशा वेगवान करेल तो समतोल परवानगी देतो त्याहून अधिक उत्पाद-समृद्ध मिश्रण बनवला असता, जो तोच अशक्य यंत्र वेगळ्या कपड्यांत. (चौथे उत्तर ल शातेलिएचे तत्त्व मुळापासून नाकारते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student measures the pH of pure water at 60 °C, finds 6.5, and concludes the water has become acidic. Explain why the reading is correct and the conclusion is not.",
          hi: "एक विद्यार्थी 60 °C पर शुद्ध पानी का pH नापता है, 6.5 पाता है, और निष्कर्ष निकालता है कि पानी अम्लीय हो गया। समझाओ पाठ्यांक सही क्यों है और निष्कर्ष क्यों नहीं।",
          mr: "एक विद्यार्थी 60 °C वर शुद्ध पाण्याचा pH मोजतो, 6.5 आढळतो, आणि निष्कर्ष काढतो की पाणी आम्लधर्मी झाले. वाचन बरोबर का आणि निष्कर्ष का नाही ते समजावा.",
        },
        choices: [
          {
            en: "Neutrality means equal concentrations of hydrogen and hydroxide ions, not a pH of 7. The self-ionisation of water is endothermic, so warming shifts it forward by Le Chatelier and Kw rises above 10⁻¹⁴. Both ion concentrations rise together and stay equal, so the water is still exactly neutral — but pH, being minus the logarithm of the hydrogen-ion concentration, falls to 6.5. The number 7 is neutral only at 25 °C, and it is the equality that defines neutrality, not the figure",
            hi: "उदासीनता का अर्थ हाइड्रोजन और हाइड्रॉक्साइड आयनों की बराबर सांद्रताएँ है, 7 का pH नहीं। पानी का स्व-आयनन ऊष्माशोषी है, अतः गरम करना उसे ले शातेलिए से आगे खिसकाता है और Kw, 10⁻¹⁴ से ऊपर चढ़ जाता है। दोनों आयन-सांद्रताएँ साथ बढ़ती हैं और बराबर बनी रहती हैं, अतः पानी अब भी ठीक-ठीक उदासीन है — पर pH, जो हाइड्रोजन-आयन सांद्रता के लघुगणक का ऋणात्मक है, गिरकर 6.5 हो जाता है। संख्या 7 केवल 25 °C पर उदासीन है, और उदासीनता को बराबरी परिभाषित करती है, आँकड़ा नहीं",
            mr: "उदासीनता म्हणजे हायड्रोजन आणि हायड्रॉक्साइड आयनांच्या समान संहती, 7 चा pH नव्हे. पाण्याचे स्व-आयनीकरण उष्माशोषी, म्हणून तापवणे ते ल शातेलिएने पुढे सरकवते आणि Kw हा 10⁻¹⁴ हून वर चढतो. दोन्ही आयन-संहती एकत्र वाढतात आणि समान राहतात, म्हणून पाणी अजूनही नेमके उदासीन — पण pH, जो हायड्रोजन-आयन संहतीच्या लॉगरिथमचा ऋण, घटून 6.5 होतो. 7 ही संख्या केवळ 25 °C वर उदासीन, आणि उदासीनता समानता व्याख्यायित करते, आकडा नव्हे",
          },
          {
            en: "The student is right: any pH below 7 is acidic by definition, at every temperature",
            hi: "विद्यार्थी सही है: 7 से नीचे कोई भी pH परिभाषा से अम्लीय है, हर ताप पर",
            mr: "विद्यार्थी बरोबर: 7 हून खालचा कोणताही pH व्याख्येने आम्लधर्मी, प्रत्येक तापमानावर",
          },
          {
            en: "The reading must be an instrument error, since the pH of pure water cannot change with temperature",
            hi: "पाठ्यांक यंत्र की त्रुटि होगी, क्योंकि शुद्ध पानी का pH ताप से बदल ही नहीं सकता",
            mr: "वाचन उपकरणाची त्रुटी असणार, कारण शुद्ध पाण्याचा pH तापमानाने बदलूच शकत नाही",
          },
          {
            en: "Warming decomposes some water into hydrogen and oxygen gas, and the dissolved gases make the solution acidic",
            hi: "गरम करना कुछ पानी को हाइड्रोजन और ऑक्सीजन गैस में विघटित कर देता है, और घुली गैसें विलयन को अम्लीय बना देती हैं",
            mr: "तापवणे काही पाणी हायड्रोजन आणि ऑक्सिजन वायूत विघटित करते, आणि विरघळलेले वायू द्रावण आम्लधर्मी बनवतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This question turns on a definition that is usually taught as a number and is really a comparison. Water is very slightly self-ionising: H₂O ⇌ H⁺ + OH⁻, and Kw is the equilibrium constant for it. Splitting a molecule against its own bonding costs energy, so the process is endothermic, and by Le Chatelier's principle warming the water shifts the equilibrium forward. More molecules are split at any instant, and Kw rises — from 1.0 × 10⁻¹⁴ at 25 °C to about 9.6 × 10⁻¹⁴ at 60 °C, nearly a tenfold increase. Now note what does not change. The two ions are produced in a strict one-to-one ratio, so however far the equilibrium shifts, [H⁺] and [OH⁻] remain exactly equal in pure water. That equality is what neutrality means. The solution has not become richer in hydrogen ions than in hydroxide ions; it has become richer in both. But pH is defined as −log[H⁺], and [H⁺] has risen. With Kw = 9.6 × 10⁻¹⁴ and the two concentrations equal, each is √Kw ≈ 3.1 × 10⁻⁷, giving pH ≈ 6.5. The reading is exactly what theory predicts, and the water is neutral at 6.5 because pOH is also 6.5 and the two are equal. The general lesson is that 7 is not a magic number. It is the value of −log√Kw at 25 °C and nowhere else. At 0 °C neutral water has a pH near 7.5; at 100 °C, near 6.1. A pH of 6.5 measured at 60 °C is neutral; the same reading at 25 °C is genuinely, if weakly, acidic. Quoting a pH without a temperature is like quoting a length without a unit. Two consequences follow. First, laboratory pH meters are temperature-compensated for exactly this reason, and a careful measurement always records the temperature alongside. Second, blood at 37 °C is held near 7.4, which sounds alkaline against the familiar 7 but is only about 0.6 units above neutrality at that temperature rather than 0.4 — the physiological margin is narrower than the number suggests. (The third answer denies a well-measured temperature dependence, and the fourth invents a decomposition that needs electrolysis or a thousand degrees, not a warm beaker.)",
          hi: "यह प्रश्न ऐसी परिभाषा पर टिका है जो प्रायः संख्या के रूप में पढ़ाई जाती है और वस्तुतः तुलना है। पानी बहुत थोड़ा स्व-आयनित होता है: H₂O ⇌ H⁺ + OH⁻, और Kw उसका साम्य स्थिरांक है। अणु को उसके अपने आबंधन के विरुद्ध तोड़ने में ऊर्जा लगती है, अतः प्रक्रिया ऊष्माशोषी है, और ले शातेलिए के सिद्धांत से पानी गरम करना साम्य को आगे खिसकाता है। किसी भी क्षण अधिक अणु टूटे होते हैं, और Kw चढ़ता है — 25 °C पर 1.0 × 10⁻¹⁴ से 60 °C पर लगभग 9.6 × 10⁻¹⁴ तक, लगभग दस गुनी वृद्धि। अब देखो क्या नहीं बदलता। दोनों आयन कड़ाई से एक-के-बदले-एक अनुपात में बनते हैं, अतः साम्य कितना भी खिसके, शुद्ध पानी में [H⁺] और [OH⁻] ठीक बराबर रहते हैं। वही बराबरी उदासीनता का अर्थ है। विलयन हाइड्रॉक्साइड आयनों की तुलना में हाइड्रोजन आयनों से समृद्ध नहीं हुआ; वह दोनों से समृद्ध हुआ है। पर pH को −log[H⁺] परिभाषित किया गया है, और [H⁺] चढ़ा है। Kw = 9.6 × 10⁻¹⁴ और दोनों सांद्रताएँ बराबर होने पर, हर एक √Kw ≈ 3.1 × 10⁻⁷ है, जिससे pH ≈ 6.5. पाठ्यांक ठीक वही है जो सिद्धांत बताता है, और पानी 6.5 पर उदासीन है क्योंकि pOH भी 6.5 है और दोनों बराबर। सामान्य सबक़ यह कि 7 कोई जादुई संख्या नहीं। वह 25 °C पर −log√Kw का मान है और कहीं नहीं। 0 °C पर उदासीन पानी का pH लगभग 7.5 है; 100 °C पर लगभग 6.1. 60 °C पर नापा गया 6.5 का pH उदासीन है; वही पाठ्यांक 25 °C पर सचमुच, यद्यपि दुर्बल रूप से, अम्लीय है। बिना ताप के pH बताना बिना मात्रक के लंबाई बताने जैसा है। दो परिणाम निकलते हैं। पहला, प्रयोगशाला के pH मीटर ठीक इसी कारण ताप-प्रतिपूरित होते हैं, और सावधान माप सदा ताप भी दर्ज करता है। दूसरा, 37 °C पर रक्त लगभग 7.4 पर थामा जाता है, जो जाने-पहचाने 7 के सामने क्षारीय लगता है पर उस ताप पर उदासीनता से 0.4 नहीं बल्कि केवल लगभग 0.6 इकाई ऊपर है — शरीरक्रियात्मक हाशिया संख्या के सुझाव से सँकरा है। (तीसरा उत्तर भली-भाँति नापी गई ताप-निर्भरता नकारता है, और चौथा ऐसा विघटन गढ़ता है जिसे विद्युत्-अपघटन या हज़ार डिग्री चाहिए, गरम बीकर नहीं।)",
          mr: "हा प्रश्न अशा व्याख्येवर टेकलेला जी सहसा संख्या म्हणून शिकवली जाते आणि प्रत्यक्षात तुलना आहे. पाणी फार थोडे स्व-आयनीकृत होते: H₂O ⇌ H⁺ + OH⁻, आणि Kw हा त्याचा समतोल स्थिरांक. रेणू त्याच्या स्वतःच्या बंधनाविरुद्ध तोडायला ऊर्जा लागते, म्हणून प्रक्रिया उष्माशोषी, आणि ल शातेलिएच्या तत्त्वाने पाणी तापवणे समतोल पुढे सरकवते. कोणत्याही क्षणी अधिक रेणू तुटलेले असतात, आणि Kw चढतो — 25 °C वर 1.0 × 10⁻¹⁴ पासून 60 °C वर सुमारे 9.6 × 10⁻¹⁴ पर्यंत, जवळपास दसपट वाढ. आता पाहा काय बदलत नाही. दोन्ही आयन काटेकोर एकास-एक गुणोत्तरात तयार होतात, म्हणून समतोल कितीही सरको, शुद्ध पाण्यात [H⁺] आणि [OH⁻] नेमके समान राहतात. तीच समानता म्हणजे उदासीनतेचा अर्थ. द्रावण हायड्रॉक्साइड आयनांच्या तुलनेत हायड्रोजन आयनांनी समृद्ध झाले नाही; ते दोघांनीही समृद्ध झाले. पण pH ची व्याख्या −log[H⁺] अशी, आणि [H⁺] चढला आहे. Kw = 9.6 × 10⁻¹⁴ आणि दोन्ही संहती समान असल्याने, प्रत्येक √Kw ≈ 3.1 × 10⁻⁷, ज्यातून pH ≈ 6.5. वाचन नेमके तेच जे सिद्धांत सांगतो, आणि पाणी 6.5 वर उदासीन कारण pOH ही 6.5 आणि दोन्ही समान. सामान्य धडा हा की 7 ही जादूची संख्या नाही. ते 25 °C वरचे −log√Kw चे मूल्य आणि दुसरीकडे कुठेही नाही. 0 °C वर उदासीन पाण्याचा pH सुमारे 7.5; 100 °C वर सुमारे 6.1. 60 °C वर मोजलेला 6.5 चा pH उदासीन; तेच वाचन 25 °C वर खरोखर, जरी दुर्बलपणे, आम्लधर्मी. तापमानाशिवाय pH सांगणे म्हणजे एककाशिवाय लांबी सांगण्यासारखे. दोन परिणाम निघतात. पहिला, प्रयोगशाळेतील pH मापक नेमक्या याच कारणाने तापमान-भरपाई केलेले असतात, आणि काळजीपूर्वक माप नेहमी तापमानही नोंदवते. दुसरा, 37 °C वर रक्त सुमारे 7.4 वर धरले जाते, जे ओळखीच्या 7 समोर आम्लारीधर्मी वाटते पण त्या तापमानावर उदासीनतेहून 0.4 नव्हे तर केवळ सुमारे 0.6 एकके वर — शरीरक्रियात्मक फरक संख्या सुचवते त्याहून अरुंद. (तिसरे उत्तर नीट मोजलेली तापमान-अवलंबिता नाकारते, आणि चौथे असे विघटन घडवते ज्याला विद्युत-अपघटन वा हजार अंश लागतात, उबदार बीकर नव्हे.)",
        },
      },
      /*H6C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Redox Reactions                                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-redox-reactions",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 7 — Redox Reactions",
      hi: "अध्याय 7 — अपचयोपचय अभिक्रियाएँ",
      mr: "प्रकरण 7 — क्षपण-ऑक्सिडीकरण अभिक्रिया",
    },
    name: {
      en: "Redox Reactions",
      hi: "अपचयोपचय अभिक्रियाएँ",
      mr: "क्षपण-ऑक्सिडीकरण अभिक्रिया",
    },
    summary: {
      en: "Rusting, respiration, a battery and a forest fire turn out to be the same reaction wearing different clothes: something has lost electrons and something else has gained exactly as many. A bookkeeping number that is not a real charge, two agents each of which does the opposite of what its name suggests, one element doing both jobs at once, and a method of balancing that counts electrons rather than guessing coefficients.",
      hi: "जंग लगना, श्वसन, बैटरी और जंगल की आग — सब एक ही अभिक्रिया निकलती है, भिन्न कपड़े पहने: किसी ने इलेक्ट्रॉन खोए हैं और किसी और ने ठीक उतने ही पाए हैं। वह बहीखाता-संख्या जो असली आवेश नहीं, वे दो कारक जिनमें से हर एक अपने नाम के सुझाव का उलटा करता है, वह एक तत्व जो दोनों काम एक साथ करता है, और संतुलन की वह विधि जो गुणांक अटकलने के बजाय इलेक्ट्रॉन गिनती है।",
      mr: "गंज चढणे, श्वसन, बॅटरी आणि जंगलातील आग — सर्व एकच अभिक्रिया निघते, वेगळे कपडे घातलेली: कोणीतरी इलेक्ट्रॉन गमावले आहेत आणि दुसऱ्या कोणीतरी नेमके तितकेच मिळवले आहेत. ती वहीखाता-संख्या जी खरा भार नाही, ते दोन घटक ज्यांपैकी प्रत्येक आपल्या नावाच्या सूचनेच्या उलट करतो, ते एक मूलद्रव्य जे दोन्ही कामे एकाच वेळी करते, आणि संतुलनाची ती पद्धत जी गुणांक अंदाजण्याऐवजी इलेक्ट्रॉन मोजते.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "redox-as-electron-transfer",
        name: {
          en: "Redox as electron transfer",
          hi: "इलेक्ट्रॉन-स्थानांतरण के रूप में अपचयोपचय",
          mr: "इलेक्ट्रॉन-हस्तांतरण म्हणून क्षपण-ऑक्सिडीकरण",
        },
        kind: "definition",
        prompt: {
          en: "The old definition needed oxygen to be present and could not describe the reaction of sodium with chlorine; the modern one covers both, and also rusting, respiration and every battery ever built. Which idea is this?",
          hi: "पुरानी परिभाषा को ऑक्सीजन की उपस्थिति चाहिए थी और वह सोडियम तथा क्लोरीन की अभिक्रिया का वर्णन नहीं कर पाती थी; आधुनिक परिभाषा दोनों को समेटती है, और जंग, श्वसन तथा अब तक बनी हर बैटरी को भी। यह कौन-सा विचार है?",
          mr: "जुन्या व्याख्येला ऑक्सिजनची उपस्थिती लागत होती आणि ती सोडियम व क्लोरिनच्या अभिक्रियेचे वर्णन करू शकत नव्हती; आधुनिक व्याख्या दोघांना सामावते, आणि गंज, श्वसन व आजवर बनलेली प्रत्येक बॅटरीही. ही कोणती कल्पना?",
        },
        statement: {
          en: "Oxidation is loss of electrons and reduction is gain, so the two always occur together and in exactly matched amounts — no electron is ever released without something taking it.",
          hi: "उपचयन इलेक्ट्रॉनों की हानि है और अपचयन प्राप्ति, अतः दोनों सदा साथ और ठीक बराबर मात्राओं में होते हैं — कोई इलेक्ट्रॉन कभी बिना किसी के लिए छोड़ा नहीं जाता।",
          mr: "ऑक्सिडीकरण म्हणजे इलेक्ट्रॉनांची हानी आणि क्षपण म्हणजे प्राप्ती, म्हणून दोन्ही नेहमी एकत्र आणि नेमक्या समान प्रमाणांत घडतात — कोणताही इलेक्ट्रॉन कधीही कोणी न घेता सोडला जात नाही.",
        },
        detail: {
          en: "The older oxygen-and-hydrogen definitions still work wherever they apply, but they are special cases: gaining oxygen and losing hydrogen both amount to losing electron density.",
          hi: "पुरानी ऑक्सीजन-और-हाइड्रोजन वाली परिभाषाएँ जहाँ लागू हों वहाँ अब भी चलती हैं, पर वे विशेष स्थितियाँ हैं: ऑक्सीजन पाना और हाइड्रोजन खोना दोनों का अर्थ इलेक्ट्रॉन-घनत्व खोना ही है।",
          mr: "जुन्या ऑक्सिजन-आणि-हायड्रोजनच्या व्याख्या जिथे लागू तिथे अजूनही चालतात, पण त्या विशेष स्थिती: ऑक्सिजन मिळवणे आणि हायड्रोजन गमावणे दोन्हींचा अर्थ इलेक्ट्रॉन-घनता गमावणेच.",
        },
        extra: {
          en: "Separating the two halves and letting the electrons travel through a wire instead of jumping directly is the whole of electrochemistry, and it is what a cell is.",
          hi: "दोनों आधों को अलग करना और इलेक्ट्रॉनों को सीधे कूदने के बजाय तार से यात्रा कराना ही पूरा विद्युत्-रसायन है, और सेल यही है।",
          mr: "दोन्ही अर्धे वेगळे करणे आणि इलेक्ट्रॉनांना थेट उडी मारण्याऐवजी तारेतून प्रवास करू देणे हेच अख्खे विद्युतरसायन, आणि घट हेच आहे.",
        },
        pair: {
          left: {
            en: "One loses and another gains, always exactly",
            hi: "एक खोता और दूसरा पाता, सदा ठीक-ठीक",
            mr: "एक गमावतो आणि दुसरा मिळवतो, नेहमी नेमके",
          },
          right: {
            en: "redox as electron transfer",
            hi: "इलेक्ट्रॉन-स्थानांतरण के रूप में अपचयोपचय",
            mr: "इलेक्ट्रॉन-हस्तांतरण म्हणून क्षपण-ऑक्सिडीकरण",
          },
        },
      },
      {
        id: "oxidation-number",
        name: {
          en: "Oxidation number",
          hi: "उपचयन संख्या",
          mr: "ऑक्सिडीकरण संख्या",
        },
        kind: "definition",
        prompt: {
          en: "Carbon in methane is assigned −4 and in carbon dioxide +4, although neither molecule contains an ion of any kind, because every shared pair is awarded outright to the more electronegative atom. Which quantity is this?",
          hi: "मेथेन में कार्बन को −4 दिया जाता है और कार्बन डाइऑक्साइड में +4, यद्यपि दोनों में से किसी अणु में किसी क़िस्म का आयन है ही नहीं, क्योंकि हर साझा युग्म पूरी तरह अधिक विद्युत्-ऋणात्मक परमाणु को सौंप दिया जाता है। यह कौन-सी राशि है?",
          mr: "मिथेनमधील कार्बनला −4 दिले जाते आणि कार्बन डायऑक्साइडमध्ये +4, जरी दोघांपैकी कोणत्याही रेणूत कोणत्याही प्रकारचा आयन नाहीच, कारण प्रत्येक वाटलेली जोडी पूर्णपणे अधिक विद्युतऋण अणूला दिली जाते. ही कोणती राशी?",
        },
        statement: {
          en: "The oxidation number is the charge an atom would carry if every bond were treated as fully ionic, so it is a bookkeeping device rather than a real charge on the atom.",
          hi: "उपचयन संख्या वह आवेश है जो परमाणु ढोता यदि हर बंध पूरी तरह आयनिक माना जाता, अतः वह परमाणु पर असली आवेश नहीं बल्कि बहीखाता-युक्ति है।",
          mr: "ऑक्सिडीकरण संख्या म्हणजे तो भार जो अणू वाहिला असता जर प्रत्येक बंध पूर्णपणे आयनिक मानला असता, म्हणून ती अणूवरचा खरा भार नव्हे तर वहीखाता-युक्ती.",
        },
        detail: {
          en: "It need not be a whole number: iron in Fe₃O₄ averages +8/3 and sulphur in tetrathionate +2.5, because the atoms in such a compound are not all in the same environment.",
          hi: "उसका पूर्णांक होना ज़रूरी नहीं: Fe₃O₄ में लोहे का औसत +8/3 है और चतुर्थायोनेट में सल्फ़र का +2.5, क्योंकि ऐसे यौगिक के सब परमाणु एक ही परिवेश में नहीं होते।",
          mr: "ती पूर्णांक असायलाच हवी असे नाही: Fe₃O₄ मध्ये लोखंडाची सरासरी +8/3 आणि टेट्राथायोनेटमध्ये गंधकाची +2.5, कारण अशा संयुगातील सर्व अणू एकाच परिसरात नसतात.",
        },
        extra: {
          en: "Its whole purpose is to make redox visible in reactions where no ions appear: a change in oxidation number is the definition of oxidation or reduction having happened.",
          hi: "उसका पूरा प्रयोजन उन अभिक्रियाओं में अपचयोपचय को दिखाई देने योग्य बनाना है जिनमें कोई आयन प्रकट नहीं होता: उपचयन संख्या का परिवर्तन ही उपचयन या अपचयन हो चुकने की परिभाषा है।",
          mr: "तिचा अख्खा हेतू ज्या अभिक्रियांत कोणताही आयन प्रकट होत नाही त्यांत क्षपण-ऑक्सिडीकरण दृश्य करणे: ऑक्सिडीकरण संख्येतील बदल हीच ऑक्सिडीकरण वा क्षपण घडल्याची व्याख्या.",
        },
        pair: {
          left: {
            en: "A charge on an atom that carries no charge",
            hi: "उस परमाणु पर आवेश जिस पर आवेश है ही नहीं",
            mr: "ज्या अणूवर भार नाही त्याच्यावरचा भार",
          },
          right: {
            en: "oxidation number",
            hi: "उपचयन संख्या",
            mr: "ऑक्सिडीकरण संख्या",
          },
        },
      },
      {
        id: "oxidising-and-reducing-agent",
        name: {
          en: "The oxidising and reducing agents",
          hi: "उपचायक और अपचायक",
          mr: "ऑक्सिडीकारक आणि क्षपणकारक",
        },
        kind: "role",
        prompt: {
          en: "The substance that oxidises something else is itself reduced in the process, so its name describes what it does to its partner and not what happens to it. Which pair of roles is this?",
          hi: "जो पदार्थ किसी और का उपचयन करता है वह स्वयं उस प्रक्रिया में अपचयित हो जाता है, अतः उसका नाम बताता है कि वह अपने साथी के साथ क्या करता है, यह नहीं कि उसके साथ क्या होता है। यह कौन-सी भूमिका-जोड़ी है?",
          mr: "जो पदार्थ दुसऱ्याचे ऑक्सिडीकरण करतो तो स्वतः त्या प्रक्रियेत क्षपित होतो, म्हणून त्याचे नाव तो आपल्या जोडीदाराशी काय करतो हे सांगते, त्याचे काय होते हे नाही. ही कोणती भूमिका-जोडी?",
        },
        statement: {
          en: "An oxidising agent takes electrons and is itself reduced, and a reducing agent gives electrons and is itself oxidised, so each name refers to the effect on the other reactant.",
          hi: "उपचायक इलेक्ट्रॉन लेता है और स्वयं अपचयित होता है, और अपचायक इलेक्ट्रॉन देता है और स्वयं उपचयित होता है, अतः हर नाम दूसरे अभिकारक पर पड़े प्रभाव को इंगित करता है।",
          mr: "ऑक्सिडीकारक इलेक्ट्रॉन घेतो आणि स्वतः क्षपित होतो, आणि क्षपणकारक इलेक्ट्रॉन देतो आणि स्वतः ऑक्सिडीकृत होतो, म्हणून प्रत्येक नाव दुसऱ्या अभिक्रियाकारकावरील परिणाम दर्शवते.",
        },
        detail: {
          en: "The strongest oxidising agents sit at the electronegative end of the table — fluorine, oxygen, permanganate — and the strongest reducing agents are the alkali metals, which part with an electron most readily.",
          hi: "सबसे प्रबल उपचायक सारणी के विद्युत्-ऋणात्मक छोर पर बैठते हैं — फ़्लुओरीन, ऑक्सीजन, परमैंगनेट — और सबसे प्रबल अपचायक क्षार धातुएँ हैं, जो इलेक्ट्रॉन सबसे तत्परता से छोड़ती हैं।",
          mr: "सर्वांत प्रबळ ऑक्सिडीकारक सारणीच्या विद्युतऋण टोकाला बसतात — फ्लोरिन, ऑक्सिजन, परमँगनेट — आणि सर्वांत प्रबळ क्षपणकारक म्हणजे अल्कधर्मी धातू, ज्या इलेक्ट्रॉन सर्वांत तत्परतेने सोडतात.",
        },
        extra: {
          en: "An element in an intermediate oxidation state can act as either, depending on its partner: hydrogen peroxide oxidises iodide and reduces permanganate in the same afternoon.",
          hi: "मध्यवर्ती उपचयन अवस्था वाला तत्व साथी के अनुसार कोई भी भूमिका निभा सकता है: हाइड्रोजन परॉक्साइड उसी दोपहर आयोडाइड का उपचयन और परमैंगनेट का अपचयन कर देता है।",
          mr: "मध्यवर्ती ऑक्सिडीकरण अवस्थेतील मूलद्रव्य जोडीदारानुसार कोणतीही भूमिका बजावू शकते: हायड्रोजन पेरॉक्साइड त्याच दुपारी आयोडाइडचे ऑक्सिडीकरण आणि परमँगनेटचे क्षपण करते.",
        },
        pair: {
          left: {
            en: "Named for what it does to somebody else",
            hi: "नाम इस पर कि वह किसी और के साथ क्या करता है",
            mr: "नाव तो दुसऱ्याशी काय करतो यावरून",
          },
          right: {
            en: "the oxidising and reducing agents",
            hi: "उपचायक और अपचायक",
            mr: "ऑक्सिडीकारक आणि क्षपणकारक",
          },
        },
      },
      {
        id: "disproportionation",
        name: {
          en: "Disproportionation",
          hi: "असमानुपातन",
          mr: "असमानुपातन",
        },
        kind: "role",
        prompt: {
          en: "Chlorine dropped into cold alkali comes out as chloride and hypochlorite at once — some of it reduced and some oxidised, with no other element changing at all. Which reaction is this?",
          hi: "ठंडे क्षार में डाली गई क्लोरीन एक साथ क्लोराइड और हाइपोक्लोराइट बनकर निकलती है — उसका कुछ अपचयित और कुछ उपचयित, और कोई दूसरा तत्व बिलकुल नहीं बदलता। यह कौन-सी अभिक्रिया है?",
          mr: "थंड आम्लारीत टाकलेला क्लोरिन एकाच वेळी क्लोराइड आणि हायपोक्लोराइट बनून निघतो — त्यातील काही क्षपित आणि काही ऑक्सिडीकृत, आणि दुसरे कोणतेही मूलद्रव्य मुळीच बदलत नाही. ही कोणती अभिक्रिया?",
        },
        statement: {
          en: "Disproportionation is a redox reaction in which one element is simultaneously oxidised and reduced, so a single substance acts as both agents at once.",
          hi: "असमानुपातन वह अपचयोपचय अभिक्रिया है जिसमें एक ही तत्व एक साथ उपचयित और अपचयित होता है, अतः अकेला पदार्थ एक ही समय दोनों कारकों की भूमिका निभाता है।",
          mr: "असमानुपातन ही ती क्षपण-ऑक्सिडीकरण अभिक्रिया जिच्यात एकच मूलद्रव्य एकाच वेळी ऑक्सिडीकृत आणि क्षपित होते, म्हणून एकटा पदार्थ एकाच वेळी दोन्ही घटकांची भूमिका बजावतो.",
        },
        detail: {
          en: "It requires the element to start in an intermediate oxidation state, with room to move in both directions — which is why chlorine at zero can do it and chloride at −1 cannot.",
          hi: "उसके लिए तत्व का मध्यवर्ती उपचयन अवस्था में शुरू होना ज़रूरी है, जिसमें दोनों दिशाओं में जगह हो — इसीलिए शून्य पर क्लोरीन यह कर सकती है और −1 पर क्लोराइड नहीं।",
          mr: "त्यासाठी मूलद्रव्याने मध्यवर्ती ऑक्सिडीकरण अवस्थेत सुरू व्हावे लागते, ज्यात दोन्ही दिशांना जागा असेल — म्हणूनच शून्यावरचा क्लोरिन हे करू शकतो आणि −1 वरचा क्लोराइड नाही.",
        },
        extra: {
          en: "It is the basis of household bleach, made industrially by exactly this reaction, and the reverse process — two different oxidation states meeting to give one — is called comproportionation.",
          hi: "घरेलू ब्लीच का आधार यही है, जो औद्योगिक रूप से ठीक इसी अभिक्रिया से बनता है, और उलटी प्रक्रिया — दो भिन्न उपचयन अवस्थाओं का मिलकर एक देना — समानुपातन कहलाती है।",
          mr: "घरगुती ब्लीचचा पाया हाच, जो औद्योगिकरीत्या नेमक्या याच अभिक्रियेने बनतो, आणि उलटी प्रक्रिया — दोन वेगळ्या ऑक्सिडीकरण अवस्था मिळून एक देणे — समानुपातन म्हणतात.",
        },
        pair: {
          left: {
            en: "Both agents, and only one element",
            hi: "दोनों कारक, और केवल एक तत्व",
            mr: "दोन्ही घटक, आणि केवळ एक मूलद्रव्य",
          },
          right: {
            en: "disproportionation",
            hi: "असमानुपातन",
            mr: "असमानुपातन",
          },
        },
      },
      {
        id: "balancing-by-half-reactions",
        name: {
          en: "Balancing by half-reactions",
          hi: "अर्ध-अभिक्रियाओं से संतुलन",
          mr: "अर्ध-अभिक्रियांनी संतुलन",
        },
        kind: "method",
        prompt: {
          en: "The equation is split into an oxidation and a reduction, each balanced separately for atoms and then for charge with electrons, and the two are scaled until the electrons cancel. Which method is this?",
          hi: "समीकरण को एक उपचयन और एक अपचयन में बाँटा जाता है, हर एक अलग-अलग परमाणुओं के लिए और फिर इलेक्ट्रॉनों से आवेश के लिए संतुलित किया जाता है, और दोनों को तब तक गुणा किया जाता है जब तक इलेक्ट्रॉन कट न जाएँ। यह कौन-सी विधि है?",
          mr: "समीकरण एका ऑक्सिडीकरण आणि एका क्षपणात विभागले जाते, प्रत्येक स्वतंत्रपणे अणूंसाठी आणि मग इलेक्ट्रॉनांनी भारासाठी संतुलित केले जाते, आणि दोन्ही इलेक्ट्रॉन कापले जाईपर्यंत गुणले जातात. ही कोणती पद्धत?",
        },
        statement: {
          en: "The half-reaction method balances a redox equation by writing the two halves separately, adding electrons to balance charge, and multiplying so that electrons lost equal electrons gained.",
          hi: "अर्ध-अभिक्रिया विधि दोनों आधों को अलग लिखकर, आवेश संतुलित करने को इलेक्ट्रॉन जोड़कर, और खोए इलेक्ट्रॉन पाए इलेक्ट्रॉनों के बराबर हों इस तरह गुणा करके अपचयोपचय समीकरण संतुलित करती है।",
          mr: "अर्ध-अभिक्रिया पद्धत दोन्ही अर्धे स्वतंत्र लिहून, भार संतुलित करायला इलेक्ट्रॉन जोडून, आणि गमावलेले इलेक्ट्रॉन मिळवलेल्या इलेक्ट्रॉनांइतके होतील अशा प्रकारे गुणून क्षपण-ऑक्सिडीकरण समीकरण संतुलित करते.",
        },
        detail: {
          en: "In acid solution the leftover oxygens are balanced with water and the leftover hydrogens with H⁺; in alkali the same is done and hydroxide is then added to both sides to mop up the H⁺.",
          hi: "अम्लीय विलयन में बची ऑक्सीजन पानी से और बचे हाइड्रोजन H⁺ से संतुलित किए जाते हैं; क्षार में वही किया जाता है और फिर H⁺ सोखने को दोनों ओर हाइड्रॉक्साइड जोड़ दिया जाता है।",
          mr: "आम्लधर्मी द्रावणात उरलेले ऑक्सिजन पाण्याने आणि उरलेले हायड्रोजन H⁺ ने संतुलित केले जातात; आम्लारीत तेच केले जाते आणि मग H⁺ शोषायला दोन्ही बाजूंना हायड्रॉक्साइड जोडले जाते.",
        },
        extra: {
          en: "It is far more reliable than balancing by inspection for anything complicated, and it has the advantage of showing how many electrons the reaction actually moves — which is what a titration measures.",
          hi: "किसी भी जटिल चीज़ के लिए वह देखकर संतुलित करने से कहीं अधिक भरोसेमंद है, और उसका यह लाभ है कि वह दिखा देती है कि अभिक्रिया वस्तुतः कितने इलेक्ट्रॉन हिलाती है — और अनुमापन यही नापता है।",
          mr: "कोणत्याही गुंतागुंतीच्या गोष्टीसाठी ती पाहून संतुलित करण्याहून कितीतरी अधिक विश्वासार्ह, आणि तिचा हा फायदा की ती दाखवते की अभिक्रिया प्रत्यक्षात किती इलेक्ट्रॉन हलवते — आणि अनुमापन हेच मोजते.",
        },
        pair: {
          left: {
            en: "Scale until the electrons cancel",
            hi: "तब तक गुणा करो जब तक इलेक्ट्रॉन कट न जाएँ",
            mr: "इलेक्ट्रॉन कापले जाईपर्यंत गुणा",
          },
          right: {
            en: "balancing by half-reactions",
            hi: "अर्ध-अभिक्रियाओं से संतुलन",
            mr: "अर्ध-अभिक्रियांनी संतुलन",
          },
        },
      },
      {
        id: "activity-series",
        name: {
          en: "The activity series",
          hi: "सक्रियता श्रेणी",
          mr: "क्रियाशीलता मालिका",
        },
        kind: "method",
        prompt: {
          en: "An iron nail dropped into copper sulphate goes copper-coloured, and a copper wire dropped into iron sulphate does nothing at all — because the order in which metals surrender electrons is fixed and can be tabulated. Which list is this?",
          hi: "कॉपर सल्फ़ेट में डाली लोहे की कील ताँबे के रंग की हो जाती है, और आयरन सल्फ़ेट में डाला ताँबे का तार कुछ भी नहीं करता — क्योंकि धातुएँ जिस क्रम में इलेक्ट्रॉन सौंपती हैं वह तय है और तालिकाबद्ध किया जा सकता है। यह कौन-सी सूची है?",
          mr: "कॉपर सल्फेटमध्ये टाकलेला लोखंडी खिळा तांब्याच्या रंगाचा होतो, आणि आयर्न सल्फेटमध्ये टाकलेली तांब्याची तार काहीही करत नाही — कारण धातू ज्या क्रमाने इलेक्ट्रॉन सोपवतात तो ठरलेला आणि तक्त्यात मांडता येतो. ही कोणती यादी?",
        },
        statement: {
          en: "The activity series ranks metals by how readily they give up electrons, and a metal higher in the series will displace any metal below it from a solution of its salt.",
          hi: "सक्रियता श्रेणी धातुओं को इस क्रम में रखती है कि वे कितनी तत्परता से इलेक्ट्रॉन छोड़ती हैं, और श्रेणी में ऊपर की धातु अपने नीचे की किसी भी धातु को उसके लवण के विलयन से विस्थापित कर देगी।",
          mr: "क्रियाशीलता मालिका धातूंना ते किती तत्परतेने इलेक्ट्रॉन सोडतात या क्रमाने मांडते, आणि मालिकेत वरची धातू आपल्या खालच्या कोणत्याही धातूला तिच्या क्षाराच्या द्रावणातून विस्थापित करेल.",
        },
        detail: {
          en: "It predicts a great deal at once: which metals react with acids, which occur native in the ground, and how each was first extracted — the reactive ones had to wait for electrolysis.",
          hi: "वह एक साथ बहुत कुछ बता देती है: कौन-सी धातुएँ अम्लों से अभिक्रिया करती हैं, कौन-सी ज़मीन में मुक्त अवस्था में मिलती हैं, और हर एक पहली बार निकाली कैसे गई — क्रियाशील धातुओं को विद्युत्-अपघटन की प्रतीक्षा करनी पड़ी।",
          mr: "ती एकाच वेळी बरेच काही सांगते: कोणत्या धातू आम्लांशी अभिक्रिया करतात, कोणत्या जमिनीत मुक्त अवस्थेत सापडतात, आणि प्रत्येक प्रथमच कशी काढली गेली — क्रियाशील धातूंना विद्युत-अपघटनाची वाट पाहावी लागली.",
        },
        extra: {
          en: "It is the qualitative face of the electrochemical series, whose numbers are electrode potentials in volts — and those numbers are what let a cell's voltage be predicted before it is built.",
          hi: "यह विद्युत्-रासायनिक श्रेणी का गुणात्मक चेहरा है, जिसकी संख्याएँ वोल्ट में इलेक्ट्रोड विभव हैं — और वही संख्याएँ सेल बनाए जाने से पहले उसका वोल्टता बताने देती हैं।",
          mr: "हा विद्युतरासायनिक मालिकेचा गुणात्मक चेहरा, जिच्या संख्या व्होल्टमधील विद्युताग्र विभव — आणि त्याच संख्या घट बांधण्याआधी त्याचे व्होल्टेज सांगू देतात.",
        },
        pair: {
          left: {
            en: "The nail changes colour and the wire does nothing",
            hi: "कील रंग बदलती है और तार कुछ नहीं करता",
            mr: "खिळा रंग बदलतो आणि तार काहीही करत नाही",
          },
          right: {
            en: "the activity series",
            hi: "सक्रियता श्रेणी",
            mr: "क्रियाशीलता मालिका",
          },
        },
      },
      /*F7C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In the reaction Zn + CuSO₄ → ZnSO₄ + Cu, a student says copper sulphate is the reducing agent because it causes the zinc to change. Identify the two agents correctly and explain the naming.",
          hi: "अभिक्रिया Zn + CuSO₄ → ZnSO₄ + Cu में एक विद्यार्थी कहता है कि कॉपर सल्फ़ेट अपचायक है क्योंकि वह ज़िंक को बदलने पर मजबूर करता है। दोनों कारक ठीक-ठीक पहचानो और नामकरण समझाओ।",
          mr: "Zn + CuSO₄ → ZnSO₄ + Cu या अभिक्रियेत एक विद्यार्थी म्हणतो की कॉपर सल्फेट हा क्षपणकारक कारण तो जस्ताला बदलायला भाग पाडतो. दोन्ही घटक नेमके ओळखा आणि नामकरण समजावा.",
        },
        choices: [
          {
            en: "Zinc is the reducing agent and copper sulphate the oxidising agent. Zinc goes from 0 to +2, losing two electrons — it is oxidised, and by giving those electrons away it reduces the copper. Copper goes from +2 to 0, gaining them — it is reduced, and by taking them it oxidises the zinc. Each name describes what the substance does to its partner, not what happens to itself, which is exactly the inversion the student has missed",
            hi: "ज़िंक अपचायक है और कॉपर सल्फ़ेट उपचायक। ज़िंक 0 से +2 जाता है, दो इलेक्ट्रॉन खोकर — वह उपचयित होता है, और वे इलेक्ट्रॉन देकर वह कॉपर का अपचयन करता है। कॉपर +2 से 0 जाता है, उन्हें पाकर — वह अपचयित होता है, और उन्हें लेकर वह ज़िंक का उपचयन करता है। हर नाम बताता है कि पदार्थ अपने साथी के साथ क्या करता है, अपने साथ क्या होता है यह नहीं, और यही उलटाव विद्यार्थी चूक गया",
            mr: "जस्त हा क्षपणकारक आणि कॉपर सल्फेट ऑक्सिडीकारक. जस्त 0 वरून +2 वर जाते, दोन इलेक्ट्रॉन गमावून — ते ऑक्सिडीकृत होते, आणि ते इलेक्ट्रॉन देऊन ते तांब्याचे क्षपण करते. तांबे +2 वरून 0 वर जाते, ते मिळवून — ते क्षपित होते, आणि ते घेऊन ते जस्ताचे ऑक्सिडीकरण करते. प्रत्येक नाव पदार्थ आपल्या जोडीदाराशी काय करतो हे सांगते, त्याचे स्वतःचे काय होते हे नाही, आणि हेच उलटणे विद्यार्थी चुकवतो",
          },
          {
            en: "The student is right: copper sulphate is the reducing agent, since it is the substance that gets reduced",
            hi: "विद्यार्थी सही है: कॉपर सल्फ़ेट अपचायक है, क्योंकि वही पदार्थ अपचयित होता है",
            mr: "विद्यार्थी बरोबर: कॉपर सल्फेट क्षपणकारक, कारण तोच पदार्थ क्षपित होतो",
          },
          {
            en: "Neither is an agent, because no oxygen is involved anywhere in the reaction",
            hi: "कोई भी कारक नहीं, क्योंकि अभिक्रिया में कहीं ऑक्सीजन शामिल ही नहीं",
            mr: "कोणीही घटक नाही, कारण अभिक्रियेत कुठेही ऑक्सिजन सामील नाही",
          },
          {
            en: "Zinc is both agents at once, since it is the only substance actually changing",
            hi: "ज़िंक ही दोनों कारक है, क्योंकि वस्तुतः बदलने वाला एकमात्र पदार्थ वही है",
            mr: "जस्तच दोन्ही घटक, कारण प्रत्यक्षात बदलणारा एकमेव पदार्थ तोच",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Track the oxidation numbers first, because they make the whole reaction visible. Zinc begins as the free metal at 0 and ends in zinc sulphate at +2. Copper begins in copper sulphate at +2 and ends as the free metal at 0. Sulphate is unchanged throughout — a spectator ion that appears on both sides and takes no part. Two electrons have moved from each zinc atom to each copper ion, and that is the entire reaction. Now the naming, which is where the student went wrong and where almost everyone goes wrong once. The names describe an ACTION PERFORMED ON THE OTHER SUBSTANCE. Zinc hands over electrons; handing over electrons to copper is what reduces the copper; therefore zinc is the reducing agent. In doing so zinc is itself oxidised. Copper takes electrons; taking electrons from zinc is what oxidises the zinc; therefore copper sulphate is the oxidising agent. In doing so the copper is itself reduced. The pattern is worth stating as a rule because it never varies: the oxidising agent is always the substance reduced, and the reducing agent is always the substance oxidised. The name and the fate are always opposite. It may help to think of an agent in the ordinary sense — a person who acts on behalf of a transaction. A reducing agent is the one that brings about a reduction, in the same way that an estate agent brings about a sale without being the property. The second option gets the fate right and reads it as the name, which is the single commonest error in this chapter. The third option is worth naming too. It is applying the old definition — oxidation as combination with oxygen — which is exactly what the modern electron-transfer definition was formulated to replace. No oxygen is needed. The reaction of sodium with chlorine is a textbook redox with no oxygen anywhere, and so is this one, where oxygen is present only as a passenger inside the sulphate. Two practical readings follow. First, this reaction happens because zinc is above copper in the activity series, and the reverse — a copper wire in zinc sulphate — does nothing at all. Second, separate the two halves into different beakers and connect them with a wire and a salt bridge, and the electrons make the same journey through the wire instead: that is the Daniell cell, and the reaction that merely warms a beaker here will light a lamp there. (The fourth answer forgets that copper is changing too, from +2 to 0.)",
          hi: "पहले उपचयन संख्याएँ ट्रैक करो, क्योंकि वे पूरी अभिक्रिया दिखाई देने योग्य बना देती हैं। ज़िंक मुक्त धातु के रूप में 0 पर शुरू होता है और ज़िंक सल्फ़ेट में +2 पर समाप्त। कॉपर, कॉपर सल्फ़ेट में +2 पर शुरू होता है और मुक्त धातु के रूप में 0 पर समाप्त। सल्फ़ेट पूरे समय अपरिवर्तित है — दर्शक आयन जो दोनों ओर आता है और कोई भाग नहीं लेता। हर ज़िंक परमाणु से हर कॉपर आयन तक दो इलेक्ट्रॉन गए हैं, और अभिक्रिया पूरी की पूरी यही है। अब नामकरण, जहाँ विद्यार्थी ग़लत हुआ और जहाँ लगभग हर कोई एक बार ग़लत होता है। नाम दूसरे पदार्थ पर की गई क्रिया का वर्णन करते हैं। ज़िंक इलेक्ट्रॉन सौंपता है; कॉपर को इलेक्ट्रॉन सौंपना ही कॉपर का अपचयन करता है; अतः ज़िंक अपचायक है। ऐसा करते हुए ज़िंक स्वयं उपचयित होता है। कॉपर इलेक्ट्रॉन लेता है; ज़िंक से इलेक्ट्रॉन लेना ही ज़िंक का उपचयन करता है; अतः कॉपर सल्फ़ेट उपचायक है। ऐसा करते हुए कॉपर स्वयं अपचयित होता है। प्रतिरूप नियम के रूप में कहने योग्य है क्योंकि वह कभी नहीं बदलता: उपचायक सदा वही पदार्थ है जो अपचयित हो, और अपचायक सदा वही जो उपचयित हो। नाम और नियति सदा उलटे होते हैं। साधारण अर्थ में 'कारक' सोचना मदद कर सकता है — वह व्यक्ति जो किसी सौदे की ओर से काम करे। अपचायक वह है जो अपचयन करा देता है, उसी तरह जैसे संपत्ति-दलाल बिक्री करा देता है बिना स्वयं संपत्ति हुए। दूसरा विकल्प नियति ठीक पकड़ता है और उसे नाम पढ़ लेता है, जो इस अध्याय की सबसे आम अकेली भूल है। तीसरा विकल्प भी नाम लेने योग्य है। वह पुरानी परिभाषा लगा रहा है — ऑक्सीजन से संयोग के रूप में उपचयन — जिसे बदलने के लिए ही आधुनिक इलेक्ट्रॉन-स्थानांतरण परिभाषा गढ़ी गई थी। ऑक्सीजन की ज़रूरत नहीं। सोडियम और क्लोरीन की अभिक्रिया पाठ्यपुस्तक की अपचयोपचय है जिसमें कहीं ऑक्सीजन नहीं, और यह भी वैसी ही है, जहाँ ऑक्सीजन केवल सल्फ़ेट के भीतर सवारी के रूप में मौजूद है। दो व्यावहारिक पाठ निकलते हैं। पहला, यह अभिक्रिया इसलिए होती है कि सक्रियता श्रेणी में ज़िंक कॉपर से ऊपर है, और उलटा — ज़िंक सल्फ़ेट में ताँबे का तार — कुछ भी नहीं करता। दूसरा, दोनों आधों को अलग बीकरों में बाँटो और उन्हें तार तथा लवण-सेतु से जोड़ो, और इलेक्ट्रॉन वही यात्रा तार से कर लेते हैं: वही डेनियल सेल है, और जो अभिक्रिया यहाँ केवल बीकर गरम करती है वह वहाँ दीपक जला देती है। (चौथा उत्तर भूल जाता है कि कॉपर भी बदल रहा है, +2 से 0.)",
          mr: "आधी ऑक्सिडीकरण संख्या मागोवा घ्या, कारण त्या अख्खी अभिक्रिया दृश्य करतात. जस्त मुक्त धातू म्हणून 0 वर सुरू होते आणि झिंक सल्फेटमध्ये +2 वर संपते. तांबे कॉपर सल्फेटमध्ये +2 वर सुरू होते आणि मुक्त धातू म्हणून 0 वर संपते. सल्फेट पूर्ण काळ अपरिवर्तित — प्रेक्षक आयन जो दोन्ही बाजूंना येतो आणि कोणताही भाग घेत नाही. प्रत्येक जस्त अणूकडून प्रत्येक तांबे आयनाकडे दोन इलेक्ट्रॉन गेले आहेत, आणि अभिक्रिया अख्खीच्या अख्खी हीच. आता नामकरण, जिथे विद्यार्थी चुकला आणि जिथे जवळपास प्रत्येकजण एकदा चुकतो. नावे दुसऱ्या पदार्थावर केलेल्या क्रियेचे वर्णन करतात. जस्त इलेक्ट्रॉन सोपवते; तांब्याला इलेक्ट्रॉन सोपवणे हेच तांब्याचे क्षपण करते; म्हणून जस्त क्षपणकारक. असे करताना जस्त स्वतः ऑक्सिडीकृत होते. तांबे इलेक्ट्रॉन घेते; जस्ताकडून इलेक्ट्रॉन घेणे हेच जस्ताचे ऑक्सिडीकरण करते; म्हणून कॉपर सल्फेट ऑक्सिडीकारक. असे करताना तांबे स्वतः क्षपित होते. आकृतिबंध नियम म्हणून सांगण्याजोगा कारण तो कधीच बदलत नाही: ऑक्सिडीकारक नेहमी तोच पदार्थ जो क्षपित होतो, आणि क्षपणकारक नेहमी तोच जो ऑक्सिडीकृत होतो. नाव आणि नियती नेहमी उलटी. सामान्य अर्थाने 'घटक' विचार करणे मदत करू शकते — जी व्यक्ती एखाद्या व्यवहारातर्फे काम करते. क्षपणकारक तो जो क्षपण घडवून आणतो, त्याच पद्धतीने जसा मालमत्ता-दलाल विक्री घडवून आणतो स्वतः मालमत्ता न होता. दुसरा पर्याय नियती बरोबर पकडतो आणि तिला नाव वाचतो, जी या प्रकरणातील सर्वांत नेहमीची एकमेव चूक. तिसरा पर्यायही नाव घेण्याजोगा. तो जुनी व्याख्या लावत आहे — ऑक्सिजनशी संयोग म्हणून ऑक्सिडीकरण — जिला बदलण्यासाठीच आधुनिक इलेक्ट्रॉन-हस्तांतरण व्याख्या घडवली गेली. ऑक्सिजनची गरज नाही. सोडियम आणि क्लोरिनची अभिक्रिया ही पाठ्यपुस्तकातील क्षपण-ऑक्सिडीकरण जिच्यात कुठेही ऑक्सिजन नाही, आणि हीसुद्धा तशीच, जिथे ऑक्सिजन केवळ सल्फेटच्या आत प्रवासी म्हणून उपस्थित. दोन व्यावहारिक वाचने निघतात. पहिले, ही अभिक्रिया यासाठी घडते की क्रियाशीलता मालिकेत जस्त तांब्याहून वर आहे, आणि उलटे — झिंक सल्फेटमधली तांब्याची तार — काहीही करत नाही. दुसरे, दोन्ही अर्धे वेगळ्या बीकरांत विभागा आणि त्यांना तार व क्षार-सेतूने जोडा, आणि इलेक्ट्रॉन तोच प्रवास तारेतून करतात: तोच डॅनियल घट, आणि जी अभिक्रिया इथे केवळ बीकर तापवते ती तिथे दिवा लावते. (चौथे उत्तर विसरते की तांबेही बदलत आहे, +2 वरून 0 वर.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Chlorine is bubbled into cold dilute sodium hydroxide and gives sodium chloride and sodium hypochlorite. A student says a redox reaction needs two different elements to change, so this cannot be one. Assess the claim and name what is happening.",
          hi: "ठंडे तनु सोडियम हाइड्रॉक्साइड में क्लोरीन प्रवाहित की जाती है और वह सोडियम क्लोराइड तथा सोडियम हाइपोक्लोराइट देती है। एक विद्यार्थी कहता है कि अपचयोपचय अभिक्रिया के लिए दो भिन्न तत्वों का बदलना ज़रूरी है, अतः यह वैसी हो ही नहीं सकती। दावे का आकलन करो और बताओ हो क्या रहा है।",
          mr: "थंड विरळ सोडियम हायड्रॉक्साइडमध्ये क्लोरिन सोडला जातो आणि तो सोडियम क्लोराइड व सोडियम हायपोक्लोराइट देतो. एक विद्यार्थी म्हणतो की क्षपण-ऑक्सिडीकरण अभिक्रियेसाठी दोन वेगळी मूलद्रव्ये बदलणे आवश्यक, म्हणून ही तशी असूच शकत नाही. दाव्याचे मूल्यमापन करा आणि काय घडत आहे ते सांगा.",
        },
        choices: [
          {
            en: "The claim is false and the reaction is a disproportionation. Chlorine starts at 0; in chloride it is −1, reduced, and in hypochlorite it is +1, oxidised. One element has done both jobs, acting as its own oxidising and reducing agent, and the electrons still balance exactly — one chlorine atom gains one for every chlorine atom that loses one. It is possible only because chlorine begins in an intermediate oxidation state with room to move in both directions",
            hi: "दावा झूठा है और अभिक्रिया असमानुपातन है। क्लोरीन 0 पर शुरू होती है; क्लोराइड में वह −1 है, अपचयित, और हाइपोक्लोराइट में +1, उपचयित। एक ही तत्व ने दोनों काम किए हैं, अपना ही उपचायक तथा अपचायक बनकर, और इलेक्ट्रॉन फिर भी ठीक-ठीक संतुलित हैं — जितने क्लोरीन परमाणु एक खोते हैं उतने ही एक पाते हैं। यह केवल इसलिए संभव है कि क्लोरीन मध्यवर्ती उपचयन अवस्था में शुरू होती है जिसमें दोनों दिशाओं में जगह है",
            mr: "दावा खोटा आणि अभिक्रिया ही असमानुपातन. क्लोरिन 0 वर सुरू होतो; क्लोराइडमध्ये तो −1, क्षपित, आणि हायपोक्लोराइटमध्ये +1, ऑक्सिडीकृत. एकाच मूलद्रव्याने दोन्ही कामे केली आहेत, स्वतःचाच ऑक्सिडीकारक आणि क्षपणकारक बनून, आणि इलेक्ट्रॉन तरीही नेमके संतुलित — जितके क्लोरिन अणू एक गमावतात तितकेच एक मिळवतात. हे केवळ यामुळे शक्य की क्लोरिन मध्यवर्ती ऑक्सिडीकरण अवस्थेत सुरू होतो जिच्यात दोन्ही दिशांना जागा आहे",
          },
          {
            en: "The student is right: only one element changes, so this is an ordinary acid–base reaction and not a redox one",
            hi: "विद्यार्थी सही है: केवल एक तत्व बदलता है, अतः यह साधारण अम्ल-क्षारक अभिक्रिया है, अपचयोपचय नहीं",
            mr: "विद्यार्थी बरोबर: केवळ एक मूलद्रव्य बदलते, म्हणून ही सामान्य आम्ल-आम्लारी अभिक्रिया, क्षपण-ऑक्सिडीकरण नव्हे",
          },
          {
            en: "It is a redox reaction in which sodium is oxidised and chlorine reduced",
            hi: "यह अपचयोपचय अभिक्रिया है जिसमें सोडियम उपचयित और क्लोरीन अपचयित होती है",
            mr: "ही क्षपण-ऑक्सिडीकरण अभिक्रिया जिच्यात सोडियम ऑक्सिडीकृत आणि क्लोरिन क्षपित होतो",
          },
          {
            en: "Chlorine is only reduced here, and the hypochlorite's oxygen supplies the compensating oxidation",
            hi: "यहाँ क्लोरीन केवल अपचयित होती है, और भरपाई करने वाला उपचयन हाइपोक्लोराइट की ऑक्सीजन देती है",
            mr: "इथे क्लोरिन केवळ क्षपित होतो, आणि भरपाई करणारे ऑक्सिडीकरण हायपोक्लोराइटचा ऑक्सिजन देतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Assign the oxidation numbers and the answer is unavoidable. Chlorine gas is an element in its standard state, so every atom is at 0. In sodium chloride the chlorine is at −1 — it has gained an electron and been reduced. In sodium hypochlorite, NaOCl, sodium is +1 and oxygen is −2, so chlorine must be +1 — it has lost an electron and been oxidised. Sodium is +1 on both sides and oxygen −2 on both sides; neither has changed at all, which disposes of the third and fourth options directly. One element, two fates. The student's premise sounds reasonable and is simply a rule that was never stated. What a redox reaction requires is that electrons move and that the books balance, not that two different elements be involved. Here the balance is exact: for every chlorine atom that gains an electron to become chloride, another loses one to become hypochlorite, and the equation comes out as Cl₂ + 2NaOH → NaCl + NaOCl + H₂O — one of each product from every molecule of chlorine. Why chlorine and not, say, chloride? Because disproportionation needs an element with somewhere to go in both directions. Chlorine at 0 sits between its lowest state, −1, and its several positive states, so it can fall or rise. Chloride at −1 is already at the bottom and can only be oxidised; perchlorate at +7 is at the top and can only be reduced. Neither can disproportionate, and the general rule follows: only an intermediate oxidation state can. The reaction is not a curiosity. It is how household bleach is manufactured, and the same chemistry run hot gives chlorate instead of hypochlorite, which is how potassium chlorate for matches is made — temperature decides which disproportionation you get. Two further examples are worth recognising, because the pattern recurs: hydrogen peroxide, with oxygen at −1 between its usual 0 and −2, decomposes to water and oxygen entirely by disproportionation, and copper(I) in solution disproportionates to copper metal and copper(II), which is why Cu⁺ salts are stable as solids and vanish the moment they are dissolved. The reverse process, two different oxidation states of one element meeting to give a single intermediate one, is comproportionation — and it is how iodine is liberated when iodide meets iodate in a titration. (The second answer denies a change in oxidation number that the formulae make plain.)",
          hi: "उपचयन संख्याएँ सौंपो और उत्तर टाला नहीं जा सकता। क्लोरीन गैस अपनी मानक अवस्था में तत्व है, अतः हर परमाणु 0 पर है। सोडियम क्लोराइड में क्लोरीन −1 पर है — उसने इलेक्ट्रॉन पाया और अपचयित हुई। सोडियम हाइपोक्लोराइट, NaOCl, में सोडियम +1 और ऑक्सीजन −2 है, अतः क्लोरीन को +1 होना ही है — उसने इलेक्ट्रॉन खोया और उपचयित हुई। सोडियम दोनों ओर +1 और ऑक्सीजन दोनों ओर −2; कोई भी बिलकुल नहीं बदला, जो तीसरे और चौथे विकल्प को सीधे निपटा देता है। एक तत्व, दो नियतियाँ। विद्यार्थी की मान्यता उचित लगती है और वह बस ऐसा नियम है जो कभी कहा ही नहीं गया। अपचयोपचय अभिक्रिया यह माँगती है कि इलेक्ट्रॉन हिलें और बहीखाता मिले, यह नहीं कि दो भिन्न तत्व शामिल हों। यहाँ संतुलन ठीक-ठीक है: जो भी क्लोरीन परमाणु इलेक्ट्रॉन पाकर क्लोराइड बनता है उसके बदले दूसरा एक खोकर हाइपोक्लोराइट बनता है, और समीकरण Cl₂ + 2NaOH → NaCl + NaOCl + H₂O निकलता है — क्लोरीन के हर अणु से हर उत्पाद का एक। क्लोरीन ही क्यों, क्लोराइड क्यों नहीं? क्योंकि असमानुपातन को ऐसा तत्व चाहिए जिसके पास दोनों दिशाओं में जाने की जगह हो। 0 पर क्लोरीन अपनी सबसे नीची अवस्था −1 और अपनी कई धनात्मक अवस्थाओं के बीच बैठी है, अतः वह गिर भी सकती है और चढ़ भी। −1 पर क्लोराइड पहले से तल पर है और केवल उपचयित हो सकता है; +7 पर परक्लोरेट शिखर पर है और केवल अपचयित। कोई भी असमानुपातन नहीं कर सकता, और सामान्य नियम निकलता है: केवल मध्यवर्ती उपचयन अवस्था ही कर सकती है। अभिक्रिया कोई कौतुक नहीं। घरेलू ब्लीच इसी तरह बनता है, और वही रसायन गरम चलाने पर हाइपोक्लोराइट के बजाय क्लोरेट देता है, और माचिस के लिए पोटैशियम क्लोरेट ऐसे ही बनता है — कौन-सा असमानुपातन मिले यह ताप तय करता है। दो और उदाहरण पहचानने योग्य हैं, क्योंकि प्रतिरूप लौटता है: हाइड्रोजन परॉक्साइड, जिसमें ऑक्सीजन अपनी सामान्य 0 और −2 के बीच −1 पर है, पूरी तरह असमानुपातन से पानी और ऑक्सीजन में विघटित होता है, और विलयन में कॉपर(I) असमानुपातित होकर ताँबा धातु और कॉपर(II) देता है, इसीलिए Cu⁺ लवण ठोस के रूप में स्थिर हैं और घुलते ही ग़ायब हो जाते हैं। उलटी प्रक्रिया, एक तत्व की दो भिन्न उपचयन अवस्थाओं का मिलकर एक मध्यवर्ती देना, समानुपातन है — और अनुमापन में आयोडाइड के आयोडेट से मिलने पर आयोडीन इसी तरह मुक्त होती है। (दूसरा उत्तर उपचयन संख्या के उस परिवर्तन को नकारता है जिसे सूत्र स्पष्ट कर देते हैं।)",
          mr: "ऑक्सिडीकरण संख्या द्या आणि उत्तर टाळता येत नाही. क्लोरिन वायू आपल्या प्रमाणित अवस्थेतील मूलद्रव्य, म्हणून प्रत्येक अणू 0 वर. सोडियम क्लोराइडमध्ये क्लोरिन −1 वर — त्याने इलेक्ट्रॉन मिळवला आणि क्षपित झाला. सोडियम हायपोक्लोराइट, NaOCl, मध्ये सोडियम +1 आणि ऑक्सिजन −2, म्हणून क्लोरिन +1 असावाच — त्याने इलेक्ट्रॉन गमावला आणि ऑक्सिडीकृत झाला. सोडियम दोन्ही बाजूंना +1 आणि ऑक्सिजन दोन्ही बाजूंना −2; कोणीही मुळीच बदलले नाही, जे तिसरा आणि चौथा पर्याय थेट निकाली काढते. एक मूलद्रव्य, दोन नियती. विद्यार्थ्याचे गृहीतक वाजवी वाटते आणि तो फक्त असा नियम जो कधी सांगितलाच गेला नाही. क्षपण-ऑक्सिडीकरण अभिक्रिया हे मागते की इलेक्ट्रॉन हलावेत आणि वहीखाते जुळावे, दोन वेगळी मूलद्रव्ये सामील असावीत हे नाही. इथे संतुलन नेमके: जो क्लोरिन अणू इलेक्ट्रॉन मिळवून क्लोराइड बनतो त्याबदल्यात दुसरा एक गमावून हायपोक्लोराइट बनतो, आणि समीकरण Cl₂ + 2NaOH → NaCl + NaOCl + H₂O असे निघते — क्लोरिनच्या प्रत्येक रेणूतून प्रत्येक उत्पादाचे एक. क्लोरिनच का, क्लोराइड का नाही? कारण असमानुपातनाला असे मूलद्रव्य लागते ज्याच्याकडे दोन्ही दिशांना जायला जागा असेल. 0 वरचा क्लोरिन आपल्या सर्वांत खालच्या अवस्था −1 आणि आपल्या अनेक धन अवस्थांमध्ये बसलेला, म्हणून तो खाली येऊ शकतो आणि वरही जाऊ शकतो. −1 वरचा क्लोराइड आधीच तळाशी आणि केवळ ऑक्सिडीकृत होऊ शकतो; +7 वरचा परक्लोरेट शिखरावर आणि केवळ क्षपित. कोणीही असमानुपातन करू शकत नाही, आणि सामान्य नियम निघतो: केवळ मध्यवर्ती ऑक्सिडीकरण अवस्थाच करू शकते. अभिक्रिया कुतूहल नव्हे. घरगुती ब्लीच याच पद्धतीने बनते, आणि तेच रसायन गरम चालवल्यास हायपोक्लोराइटऐवजी क्लोरेट देते, आणि काडेपेटीसाठी पोटॅशियम क्लोरेट असेच बनते — कोणते असमानुपातन मिळेल हे तापमान ठरवते. आणखी दोन उदाहरणे ओळखण्याजोगी, कारण आकृतिबंध परततो: हायड्रोजन पेरॉक्साइड, ज्यात ऑक्सिजन आपल्या नेहमीच्या 0 आणि −2 दरम्यान −1 वर, पूर्णपणे असमानुपातनाने पाणी आणि ऑक्सिजनमध्ये विघटित होते, आणि द्रावणातील कॉपर(I) असमानुपातित होऊन तांबे धातू आणि कॉपर(II) देते, म्हणूनच Cu⁺ क्षार घन रूपात स्थिर आणि विरघळताच नाहीसे होतात. उलटी प्रक्रिया, एका मूलद्रव्याच्या दोन वेगळ्या ऑक्सिडीकरण अवस्था मिळून एक मध्यवर्ती देणे, हे समानुपातन — आणि अनुमापनात आयोडाइड आयोडेटला भेटल्यावर आयोडीन याच पद्धतीने मुक्त होते. (दुसरे उत्तर ऑक्सिडीकरण संख्येतील तो बदल नाकारते जो सूत्रे स्पष्ट करतात.)",
        },
      },
      /*H7C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Organic Chemistry: Some Basic Principles                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-organic-basic-principles",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 8 — Organic Chemistry: Some Basic Principles and Techniques",
      hi: "अध्याय 8 — कार्बनिक रसायन: कुछ आधारभूत सिद्धांत तथा तकनीकें",
      mr: "प्रकरण 8 — सेंद्रिय रसायन: काही मूलभूत तत्त्वे आणि तंत्रे",
    },
    name: {
      en: "Organic Chemistry: Basic Principles",
      hi: "कार्बनिक रसायन: आधारभूत सिद्धांत",
      mr: "सेंद्रिय रसायन: मूलभूत तत्त्वे",
    },
    summary: {
      en: "One element accounts for more compounds than all the others together, and the reason is that carbon bonds to itself indefinitely without weakening. A family whose members differ by one CH₂ and behave almost identically, two substances with the same formula and nothing else in common, a naming system built so that a name can be read back into a structure, and two effects — one travelling through bonds, one spread across them — that explain most of what organic reactions do.",
      hi: "एक तत्व बाक़ी सब मिलाकर जितने यौगिक बनाते हैं उससे अधिक बनाता है, और कारण यह कि कार्बन अपने से अनिश्चित काल तक बिना दुर्बल हुए जुड़ता जाता है। वह कुनबा जिसके सदस्य एक CH₂ से भिन्न हैं और लगभग एक-सा व्यवहार करते हैं, वे दो पदार्थ जिनका सूत्र एक और बाक़ी कुछ साझा नहीं, वह नाम-प्रणाली जो इस तरह बनी कि नाम को वापस संरचना में पढ़ा जा सके, और वे दो प्रभाव — एक बंधों से होकर यात्रा करता, दूसरा उन पर फैला — जो कार्बनिक अभिक्रियाओं का अधिकांश समझा देते हैं।",
      mr: "एक मूलद्रव्य बाकी सर्व मिळून जितकी संयुगे बनवतात त्याहून अधिक बनवते, आणि कारण हे की कार्बन स्वतःशी अनिश्चित काळ न दुर्बल होता जुळत जातो. ते कुटुंब ज्याचे सदस्य एका CH₂ ने वेगळे आणि जवळपास सारखेच वागतात, ते दोन पदार्थ ज्यांचे सूत्र एक आणि बाकी काहीही समान नाही, ती नाम-प्रणाली जी अशी बनवली की नाव पुन्हा संरचनेत वाचता यावे, आणि ते दोन परिणाम — एक बंधांतून प्रवास करणारा, दुसरा त्यांच्यावर पसरलेला — जे सेंद्रिय अभिक्रियांचे बहुतांश समजावतात.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "homologous-series",
        name: {
          en: "The homologous series",
          hi: "समजातीय श्रेणी",
          mr: "समजातीय मालिका",
        },
        kind: "family",
        prompt: {
          en: "Methane, ethane, propane and butane differ from each other by exactly one CH₂ unit, share one general formula and one set of reactions, and their boiling points climb in an orderly line. Which arrangement is this?",
          hi: "मेथेन, एथेन, प्रोपेन और ब्यूटेन एक-दूसरे से ठीक एक CH₂ इकाई भिन्न हैं, एक सामान्य सूत्र और अभिक्रियाओं का एक समुच्चय साझा करते हैं, और उनके क्वथनांक व्यवस्थित रेखा में चढ़ते हैं। यह कौन-सी व्यवस्था है?",
          mr: "मिथेन, इथेन, प्रोपेन आणि ब्युटेन एकमेकांहून नेमक्या एका CH₂ एककाने वेगळे, एक सामान्य सूत्र आणि अभिक्रियांचा एक संच वाटून घेतात, आणि त्यांचे उकळबिंदू व्यवस्थित रेषेत चढतात. ही कोणती मांडणी?",
        },
        statement: {
          en: "A homologous series is a family of compounds differing by a CH₂ unit, sharing a general formula and chemical behaviour, with physical properties that change gradually along the series.",
          hi: "समजातीय श्रेणी उन यौगिकों का कुनबा है जो एक CH₂ इकाई से भिन्न हैं, एक सामान्य सूत्र और रासायनिक व्यवहार साझा करते हैं, और जिनके भौतिक गुण श्रेणी भर क्रमशः बदलते हैं।",
          mr: "समजातीय मालिका म्हणजे एका CH₂ एककाने वेगळ्या असणाऱ्या संयुगांचे कुटुंब, जी एक सामान्य सूत्र आणि रासायनिक वर्तन वाटून घेतात, आणि ज्यांचे भौतिक गुणधर्म मालिकेभर क्रमाक्रमाने बदलतात.",
        },
        detail: {
          en: "It is what makes organic chemistry learnable at all: study one member and the reactions of every other are known, so millions of compounds reduce to a few dozen families.",
          hi: "यही कार्बनिक रसायन को सीखने योग्य बनाता है: एक सदस्य पढ़ो और बाक़ी सबकी अभिक्रियाएँ ज्ञात हो जाती हैं, अतः लाखों यौगिक कुछ दर्जन कुनबों में सिमट आते हैं।",
          mr: "हेच सेंद्रिय रसायन शिकण्याजोगे बनवते: एक सदस्य अभ्यासा आणि बाकी सर्वांच्या अभिक्रिया कळतात, म्हणून लाखो संयुगे काही डझन कुटुंबांत आटतात.",
        },
        extra: {
          en: "The gradation is why crude oil can be separated at all: fractional distillation sorts the alkanes by boiling point, and the boiling point rises steadily because each added CH₂ adds surface for dispersion forces to act on.",
          hi: "यही क्रमिकता है जिससे कच्चा तेल अलग किया जा सकता है: प्रभाजी आसवन ऐल्केनों को क्वथनांक से छाँटता है, और क्वथनांक लगातार चढ़ता है क्योंकि हर जुड़ा CH₂ परिक्षेपण बलों को लगने के लिए और सतह देता है।",
          mr: "हीच क्रमवारता ज्यामुळे कच्चे तेल वेगळे करता येते: अंशात्मक ऊर्ध्वपातन अल्केनांना उकळबिंदूने वेगळे करते, आणि उकळबिंदू सतत चढतो कारण प्रत्येक जोडलेला CH₂ विकिरण बलांना लागायला अधिक पृष्ठभाग देतो.",
        },
        pair: {
          left: {
            en: "Learn one member and you know the family",
            hi: "एक सदस्य सीखो और पूरा कुनबा जान जाओ",
            mr: "एक सदस्य शिका आणि अख्खे कुटुंब कळते",
          },
          right: {
            en: "the homologous series",
            hi: "समजातीय श्रेणी",
            mr: "समजातीय मालिका",
          },
        },
      },
      {
        id: "structural-isomerism",
        name: {
          en: "Structural isomerism",
          hi: "संरचनात्मक समावयवता",
          mr: "संरचनात्मक समघटकता",
        },
        kind: "family",
        prompt: {
          en: "C₂H₆O is a drinkable liquid boiling at 78 °C and also a gas boiling at −24 °C, and the difference lies entirely in which atom sits between which. Which phenomenon is this?",
          hi: "C₂H₆O 78 °C पर उबलता पीने योग्य द्रव भी है और −24 °C पर उबलती गैस भी, और भेद पूरी तरह इसमें है कि कौन-सा परमाणु किसके बीच बैठा है। यह कौन-सी परिघटना है?",
          mr: "C₂H₆O हे 78 °C वर उकळणारे पिण्याजोगे द्रवही आहे आणि −24 °C वर उकळणारा वायूही, आणि फरक पूर्णपणे कोणता अणू कोणामध्ये बसला आहे यात. ही कोणती घटना?",
        },
        statement: {
          en: "Structural isomers share a molecular formula but differ in how the atoms are connected, and they are different substances with different properties in every respect.",
          hi: "संरचनात्मक समावयवी आण्विक सूत्र साझा करते हैं पर इसमें भिन्न हैं कि परमाणु जुड़े कैसे हैं, और वे हर दृष्टि से भिन्न गुणों वाले भिन्न पदार्थ हैं।",
          mr: "संरचनात्मक समघटक रेणवीय सूत्र वाटून घेतात पण अणू कसे जोडले आहेत यात वेगळे, आणि ते प्रत्येक दृष्टीने वेगळ्या गुणधर्मांचे वेगळे पदार्थ आहेत.",
        },
        detail: {
          en: "The number of isomers climbs alarmingly with chain length: butane has two, pentane three, decane seventy-five, and C₃₀H₆₂ over four thousand million.",
          hi: "शृंखला लंबी होते ही समावयवियों की संख्या डरावने ढंग से चढ़ती है: ब्यूटेन के दो, पेंटेन के तीन, डेकेन के पचहत्तर, और C₃₀H₆₂ के चार अरब से अधिक।",
          mr: "साखळी लांब होताच समघटकांची संख्या भीतिदायकपणे चढते: ब्युटेनचे दोन, पेंटेनचे तीन, डेकेनचे पंचाहत्तर, आणि C₃₀H₆₂ चे चार अब्जांहून अधिक.",
        },
        extra: {
          en: "It is why a molecular formula is never a sufficient answer in organic chemistry, and why the whole apparatus of naming exists — a name must specify the connections and not merely the atom count.",
          hi: "इसी से कार्बनिक रसायन में आण्विक सूत्र कभी पर्याप्त उत्तर नहीं, और इसी से नामकरण का पूरा तंत्र है — नाम को जोड़ बताने पड़ते हैं, केवल परमाणु-गिनती नहीं।",
          mr: "यामुळेच सेंद्रिय रसायनात रेणवीय सूत्र कधीही पुरेसे उत्तर नाही, आणि यामुळेच नामकरणाचा अख्खा डोलारा — नावाने जोडण्या सांगाव्या लागतात, केवळ अणु-मोजणी नव्हे.",
        },
        pair: {
          left: {
            en: "One formula, a drink and a gas",
            hi: "एक सूत्र, एक पेय और एक गैस",
            mr: "एक सूत्र, एक पेय आणि एक वायू",
          },
          right: {
            en: "structural isomerism",
            hi: "संरचनात्मक समावयवता",
            mr: "संरचनात्मक समघटकता",
          },
        },
      },
      {
        id: "iupac-naming",
        name: {
          en: "IUPAC naming rules",
          hi: "IUPAC नामकरण नियम",
          mr: "IUPAC नामकरण नियम",
        },
        kind: "family",
        prompt: {
          en: "Find the longest chain containing the principal group, number it from the end that gives that group the lowest locant, and list the branches alphabetically — and the resulting name can be read straight back into a structure. Which system is this?",
          hi: "मुख्य समूह वाली सबसे लंबी शृंखला खोजो, उसे उस सिरे से गिनो जो उस समूह को सबसे छोटा अंक दे, और शाखाएँ वर्णक्रम में गिनाओ — और बना नाम सीधे वापस संरचना में पढ़ा जा सकता है। यह कौन-सी प्रणाली है?",
          mr: "मुख्य गट असलेली सर्वांत लांब साखळी शोधा, तिला त्या टोकापासून क्रमांक द्या जे त्या गटाला सर्वांत लहान अंक देईल, आणि फांद्या वर्णक्रमाने सांगा — आणि बनलेले नाव थेट पुन्हा संरचनेत वाचता येते. ही कोणती प्रणाली?",
        },
        statement: {
          en: "IUPAC nomenclature builds a name from a root for the chain length, a suffix for the principal functional group and prefixes for substituents, so that name and structure determine each other.",
          hi: "IUPAC नामपद्धति नाम को शृंखला-लंबाई के मूल, मुख्य क्रियात्मक समूह के प्रत्यय और प्रतिस्थापियों के उपसर्गों से बनाती है, ताकि नाम और संरचना एक-दूसरे को तय कर दें।",
          mr: "IUPAC नामपद्धती नाव साखळी-लांबीच्या मुळापासून, मुख्य कार्यकारी गटाच्या प्रत्ययापासून आणि प्रतिस्थापकांच्या उपसर्गांपासून बनवते, जेणेकरून नाव आणि संरचना एकमेकांना ठरवतील.",
        },
        detail: {
          en: "The lowest-locant rule is what makes a name unique: 2-methylbutane and 3-methylbutane describe the same molecule, and only the first is correct.",
          hi: "सबसे छोटे अंक का नियम ही नाम को अद्वितीय बनाता है: 2-मेथिलब्यूटेन और 3-मेथिलब्यूटेन एक ही अणु का वर्णन करते हैं, और केवल पहला सही है।",
          mr: "सर्वांत लहान अंकाचा नियम हाच नाव अद्वितीय बनवतो: 2-मिथाइलब्युटेन आणि 3-मिथाइलब्युटेन एकाच रेणूचे वर्णन करतात, आणि केवळ पहिले बरोबर.",
        },
        extra: {
          en: "Common names survive where they are shorter and unambiguous — nobody says 2-hydroxy-1,2,3-propanetricarboxylic acid when citric acid will do — but only the systematic name can be invented for a compound never seen before.",
          hi: "प्रचलित नाम वहाँ बचे रहते हैं जहाँ वे छोटे और असंदिग्ध हैं — जब सिट्रिक अम्ल से काम चल जाए तो 2-हाइड्रॉक्सी-1,2,3-प्रोपेनट्राइकार्बोक्सिलिक अम्ल कोई नहीं कहता — पर अभी तक न देखे गए यौगिक के लिए केवल पद्धतिगत नाम ही गढ़ा जा सकता है।",
          mr: "प्रचलित नावे तिथे टिकतात जिथे ती लहान आणि निःसंदिग्ध — सायट्रिक आम्लाने भागत असेल तर 2-हायड्रॉक्सी-1,2,3-प्रोपेनट्रायकार्बोक्सिलिक आम्ल कोणी म्हणत नाही — पण अजून न पाहिलेल्या संयुगासाठी केवळ पद्धतशीर नावच घडवता येते.",
        },
        pair: {
          left: {
            en: "A name that can be read back into a drawing",
            hi: "ऐसा नाम जिसे वापस चित्र में पढ़ा जा सके",
            mr: "असे नाव जे पुन्हा चित्रात वाचता येईल",
          },
          right: {
            en: "IUPAC naming rules",
            hi: "IUPAC नामकरण नियम",
            mr: "IUPAC नामकरण नियम",
          },
        },
      },
      {
        id: "inductive-effect",
        name: {
          en: "The inductive effect",
          hi: "प्रेरणिक प्रभाव",
          mr: "प्रेरणिक परिणाम",
        },
        kind: "effect",
        prompt: {
          en: "A chlorine at one end of a chain pulls electron density along the sigma bonds towards itself, strongly at the first carbon, weakly at the second and hardly at all by the fourth. Which effect is this?",
          hi: "शृंखला के एक सिरे का क्लोरीन सिग्मा बंधों के अनुदिश इलेक्ट्रॉन-घनत्व को अपनी ओर खींचता है, पहले कार्बन पर प्रबलता से, दूसरे पर दुर्बल और चौथे तक लगभग कुछ भी नहीं। यह कौन-सा प्रभाव है?",
          mr: "साखळीच्या एका टोकाचा क्लोरिन सिग्मा बंधांच्या दिशेने इलेक्ट्रॉन-घनता स्वतःकडे ओढतो, पहिल्या कार्बनवर प्रबळपणे, दुसऱ्यावर दुर्बल आणि चौथ्यापर्यंत जवळपास काहीच नाही. हा कोणता परिणाम?",
        },
        statement: {
          en: "The inductive effect is the permanent displacement of electron density along a chain of sigma bonds towards a more electronegative atom, and it dies away rapidly with distance.",
          hi: "प्रेरणिक प्रभाव सिग्मा बंधों की शृंखला के अनुदिश इलेक्ट्रॉन-घनत्व का अधिक विद्युत्-ऋणात्मक परमाणु की ओर स्थायी विस्थापन है, और वह दूरी के साथ तेज़ी से क्षीण हो जाता है।",
          mr: "प्रेरणिक परिणाम म्हणजे सिग्मा बंधांच्या साखळीच्या दिशेने इलेक्ट्रॉन-घनतेचे अधिक विद्युतऋण अणूकडे कायमचे विस्थापन, आणि तो अंतरासोबत झपाट्याने क्षीण होतो.",
        },
        detail: {
          en: "It explains acid strengths directly: chloroacetic acid is far stronger than acetic acid because the chlorine pulls charge away from the carboxylate and stabilises it once the proton has left.",
          hi: "यह अम्ल-प्रबलताएँ सीधे समझाता है: क्लोरोऐसीटिक अम्ल ऐसीटिक अम्ल से कहीं प्रबल है क्योंकि क्लोरीन कार्बोक्सिलेट से आवेश खींच लेती है और प्रोटॉन के जाने के बाद उसे स्थिर कर देती है।",
          mr: "हा आम्ल-प्रबळता थेट समजावतो: क्लोरोॲसिटिक आम्ल ॲसिटिक आम्लाहून कितीतरी प्रबळ कारण क्लोरिन कार्बोक्सिलेटपासून भार ओढते आणि प्रोटॉन गेल्यावर त्याला स्थिर करते.",
        },
        extra: {
          en: "Alkyl groups push electron density the other way, which is why a carbocation with three of them attached is far more stable than one with none — and that ordering decides the outcome of a great many reactions.",
          hi: "ऐल्किल समूह इलेक्ट्रॉन-घनत्व उलटी ओर धकेलते हैं, इसीलिए जिस कार्बधनायन से तीन जुड़े हों वह उससे कहीं अधिक स्थिर है जिससे एक भी न जुड़ा हो — और वही क्रम बहुत सारी अभिक्रियाओं का परिणाम तय करता है।",
          mr: "अल्काइल गट इलेक्ट्रॉन-घनता उलट दिशेने ढकलतात, म्हणूनच ज्या कार्बधनायनाला तीन जोडलेले असतील तो एकही न जोडलेल्याहून कितीतरी अधिक स्थिर — आणि तोच क्रम पुष्कळ अभिक्रियांचा निकाल ठरवतो.",
        },
        pair: {
          left: {
            en: "Strong at the first carbon and gone by the fourth",
            hi: "पहले कार्बन पर प्रबल और चौथे तक ग़ायब",
            mr: "पहिल्या कार्बनवर प्रबळ आणि चौथ्यापर्यंत गायब",
          },
          right: {
            en: "the inductive effect",
            hi: "प्रेरणिक प्रभाव",
            mr: "प्रेरणिक परिणाम",
          },
        },
      },
      {
        id: "resonance-in-organic-molecules",
        name: {
          en: "Resonance in organic molecules",
          hi: "कार्बनिक अणुओं में अनुनाद",
          mr: "सेंद्रिय रेणूंतील अनुनाद",
        },
        kind: "effect",
        prompt: {
          en: "The two carbon–oxygen bonds in a carboxylate ion are found to be identical in length, although any single structure drawn for it shows one double and one single. Which idea resolves this?",
          hi: "कार्बोक्सिलेट आयन के दोनों कार्बन-ऑक्सीजन बंध लंबाई में समान पाए जाते हैं, यद्यपि उसके लिए खींची कोई भी अकेली संरचना एक द्विबंध और एक एकल दिखाती है। कौन-सा विचार इसे सुलझाता है?",
          mr: "कार्बोक्सिलेट आयनाचे दोन्ही कार्बन-ऑक्सिजन बंध लांबीत सारखे आढळतात, जरी त्यासाठी काढलेली कोणतीही एकच संरचना एक द्विबंध आणि एक एकेरी दाखवते. कोणती कल्पना हे सोडवते?",
        },
        statement: {
          en: "Resonance describes a molecule whose real structure is a single hybrid intermediate between several drawable ones, because the pi electrons are delocalised rather than fixed in particular bonds.",
          hi: "अनुनाद ऐसे अणु का वर्णन करता है जिसकी असली संरचना कई खींची जा सकने वाली संरचनाओं के बीच का एक ही संकर है, क्योंकि पाई इलेक्ट्रॉन विशेष बंधों में जड़े नहीं बल्कि विस्थानीकृत हैं।",
          mr: "अनुनाद अशा रेणूचे वर्णन करतो ज्याची खरी संरचना काढता येणाऱ्या अनेक संरचनांमधला एकच संकर आहे, कारण पाय इलेक्ट्रॉन विशिष्ट बंधांत जखडलेले नसून विस्थानित आहेत.",
        },
        detail: {
          en: "The molecule does not flicker between the drawings — it is never any of them, in the same way a mule is not alternately a horse and a donkey.",
          hi: "अणु उन चित्रों के बीच झिलमिलाता नहीं — वह उनमें से कोई कभी नहीं होता, ठीक वैसे जैसे ख़च्चर बारी-बारी से घोड़ा और गधा नहीं होता।",
          mr: "रेणू त्या चित्रांमध्ये लुकलुकत नाही — तो त्यांपैकी कोणीही कधीच नसतो, अगदी तसेच जसे खेचर आळीपाळीने घोडा आणि गाढव नसते.",
        },
        extra: {
          en: "Delocalisation always lowers the energy, which is why a carboxylic acid gives up its proton far more readily than an alcohol does — the anion it leaves behind is stabilised and the alcohol's is not.",
          hi: "विस्थानीकरण सदा ऊर्जा घटाता है, इसीलिए कार्बोक्सिलिक अम्ल ऐल्कोहॉल की तुलना में अपना प्रोटॉन कहीं अधिक तत्परता से छोड़ता है — वह जो ऋणायन पीछे छोड़ता है वह स्थिर होता है और ऐल्कोहॉल का नहीं।",
          mr: "विस्थानीकरण नेहमी ऊर्जा घटवते, म्हणूनच कार्बोक्सिलिक आम्ल अल्कोहोलच्या तुलनेत आपला प्रोटॉन कितीतरी अधिक तत्परतेने सोडते — तो जो ऋणायन मागे सोडतो तो स्थिर असतो आणि अल्कोहोलचा नाही.",
        },
        pair: {
          left: {
            en: "Never a horse and never a donkey",
            hi: "न कभी घोड़ा और न कभी गधा",
            mr: "ना कधी घोडा ना कधी गाढव",
          },
          right: {
            en: "resonance in organic molecules",
            hi: "कार्बनिक अणुओं में अनुनाद",
            mr: "सेंद्रिय रेणूंतील अनुनाद",
          },
        },
      },
      {
        id: "carbocation-stability",
        name: {
          en: "Carbocation stability",
          hi: "कार्बधनायन स्थिरता",
          mr: "कार्बधनायन स्थिरता",
        },
        kind: "effect",
        prompt: {
          en: "A positively charged carbon with three alkyl groups around it survives long enough to react; one with none is so unstable it is barely a species at all — and the order tertiary above secondary above primary decides where a reaction goes. Which trend is this?",
          hi: "जिस धनावेशित कार्बन के इर्द-गिर्द तीन ऐल्किल समूह हों वह अभिक्रिया करने भर जीवित रहता है; जिसके पास एक भी न हो वह इतना अस्थिर है कि वह मुश्किल से कोई स्पीशीज़ है — और तृतीयक ऊपर द्वितीयक ऊपर प्राथमिक का क्रम तय करता है कि अभिक्रिया कहाँ जाएगी। यह कौन-सी प्रवृत्ति है?",
          mr: "ज्या धनभारित कार्बनभोवती तीन अल्काइल गट असतील तो अभिक्रिया करण्याइतका जिवंत राहतो; ज्याच्याकडे एकही नाही तो इतका अस्थिर की तो जेमतेम एखादी प्रजाती आहे — आणि तृतीयक वर द्वितीयक वर प्राथमिक हा क्रम अभिक्रिया कुठे जाईल हे ठरवतो. हा कोणता कल?",
        },
        statement: {
          en: "Carbocation stability rises from primary through secondary to tertiary, because each attached alkyl group pushes electron density towards the positive centre and helps to spread the charge.",
          hi: "कार्बधनायन स्थिरता प्राथमिक से द्वितीयक होते हुए तृतीयक तक चढ़ती है, क्योंकि हर जुड़ा ऐल्किल समूह धन केंद्र की ओर इलेक्ट्रॉन-घनत्व धकेलता है और आवेश फैलाने में मदद करता है।",
          mr: "कार्बधनायन स्थिरता प्राथमिकपासून द्वितीयकमार्गे तृतीयकपर्यंत चढते, कारण प्रत्येक जोडलेला अल्काइल गट धन केंद्राकडे इलेक्ट्रॉन-घनता ढकलतो आणि भार पसरवायला मदत करतो.",
        },
        detail: {
          en: "It is the reason behind Markovnikov's rule: when a hydrogen halide adds to an unsymmetrical alkene, the proton goes wherever leaves the more stable cation behind.",
          hi: "मार्कोवनिकोव के नियम के पीछे यही कारण है: जब हाइड्रोजन हैलाइड असममित ऐल्कीन से जुड़ता है, प्रोटॉन वहाँ जाता है जहाँ जाने से पीछे अधिक स्थिर धनायन बचे।",
          mr: "मार्कोव्हनिकॉव्हच्या नियमामागचे कारण हेच: जेव्हा हायड्रोजन हॅलाइड असममित अल्कीनला जोडते, तेव्हा प्रोटॉन तिथे जातो जिथे गेल्याने मागे अधिक स्थिर धनायन उरेल.",
        },
        extra: {
          en: "A carbocation next to a double bond or a benzene ring beats even a tertiary one, because resonance spreads the charge over several atoms instead of merely leaning on three neighbours.",
          hi: "द्विबंध या बेंज़ीन वलय के पास वाला कार्बधनायन तृतीयक को भी हरा देता है, क्योंकि अनुनाद आवेश को केवल तीन पड़ोसियों पर टिकाने के बजाय कई परमाणुओं पर फैला देता है।",
          mr: "द्विबंध वा बेंझिन वलयाजवळचा कार्बधनायन तृतीयकालाही हरवतो, कारण अनुनाद भार केवळ तीन शेजाऱ्यांवर टेकवण्याऐवजी अनेक अणूंवर पसरवतो.",
        },
        pair: {
          left: {
            en: "Three neighbours beat two, and resonance beats three",
            hi: "तीन पड़ोसी दो को हराते, और अनुनाद तीनों को",
            mr: "तीन शेजारी दोघांना हरवतात, आणि अनुनाद तिघांना",
          },
          right: {
            en: "carbocation stability",
            hi: "कार्बधनायन स्थिरता",
            mr: "कार्बधनायन स्थिरता",
          },
        },
      },
      /*F8C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Ethanol boils at 78 °C and dimethyl ether at −24 °C, although both are C₂H₆O with identical molar masses. A student says one of the two boiling points must be misprinted. Explain the difference.",
          hi: "एथेनॉल 78 °C पर उबलता है और डाइमेथिल ईथर −24 °C पर, यद्यपि दोनों C₂H₆O हैं और उनके मोलर द्रव्यमान समान हैं। एक विद्यार्थी कहता है कि दोनों में से कोई एक क्वथनांक ग़लत छपा होगा। भेद समझाओ।",
          mr: "इथेनॉल 78 °C वर उकळते आणि डायमिथाइल ईथर −24 °C वर, जरी दोन्ही C₂H₆O आणि त्यांची मोलर वस्तुमाने सारखी. एक विद्यार्थी म्हणतो की दोघांपैकी एक उकळबिंदू चुकीचा छापला असणार. फरक समजावा.",
        },
        choices: [
          {
            en: "Both figures are correct: the two are structural isomers, not the same substance. Ethanol is CH₃CH₂OH with a hydrogen bonded directly to oxygen, so its molecules hydrogen-bond to one another and a great deal of energy is needed to separate them. In dimethyl ether, CH₃OCH₃, every hydrogen is on carbon, so no hydrogen bonding is possible between its molecules and only weak dipole and dispersion forces hold them together",
            hi: "दोनों आँकड़े सही हैं: वे दोनों संरचनात्मक समावयवी हैं, एक ही पदार्थ नहीं। एथेनॉल CH₃CH₂OH है जिसमें हाइड्रोजन सीधे ऑक्सीजन से बँधा है, अतः उसके अणु आपस में हाइड्रोजन बंध बनाते हैं और उन्हें अलग करने को बहुत ऊर्जा चाहिए। डाइमेथिल ईथर, CH₃OCH₃, में हर हाइड्रोजन कार्बन पर है, अतः उसके अणुओं के बीच हाइड्रोजन बंधन संभव ही नहीं और उन्हें केवल दुर्बल द्विध्रुव तथा परिक्षेपण बल थामे रहते हैं",
            mr: "दोन्ही आकडे बरोबर: ते दोघे संरचनात्मक समघटक, एकच पदार्थ नव्हे. इथेनॉल हे CH₃CH₂OH ज्यात हायड्रोजन थेट ऑक्सिजनशी बांधलेला, म्हणून त्याचे रेणू आपापसात हायड्रोजन बंध करतात आणि त्यांना वेगळे करायला खूप ऊर्जा लागते. डायमिथाइल ईथर, CH₃OCH₃, मध्ये प्रत्येक हायड्रोजन कार्बनवर, म्हणून त्याच्या रेणूंमध्ये हायड्रोजन बंधन शक्यच नाही आणि त्यांना केवळ दुर्बल द्विध्रुव व विकिरण बले धरून ठेवतात",
          },
          {
            en: "The student is right: substances with the same molecular formula must have the same boiling point",
            hi: "विद्यार्थी सही है: एक ही आण्विक सूत्र वाले पदार्थों का क्वथनांक एक ही होना चाहिए",
            mr: "विद्यार्थी बरोबर: एकाच रेणवीय सूत्राच्या पदार्थांचा उकळबिंदू एकच असावा",
          },
          {
            en: "Ethanol boils higher because it is heavier, since the hydroxyl group adds mass to the molecule",
            hi: "एथेनॉल ऊँचे पर उबलता है क्योंकि वह भारी है, चूँकि हाइड्रॉक्सिल समूह अणु में द्रव्यमान जोड़ता है",
            mr: "इथेनॉल उंच उकळते कारण ते जड आहे, कारण हायड्रॉक्सिल गट रेणूत वस्तुमान जोडतो",
          },
          {
            en: "Dimethyl ether is non-polar and ethanol is polar, and polarity alone accounts for a hundred-degree difference",
            hi: "डाइमेथिल ईथर अध्रुवीय है और एथेनॉल ध्रुवीय, और अकेली ध्रुवता सौ डिग्री का अंतर समझा देती है",
            mr: "डायमिथाइल ईथर अध्रुवीय आणि इथेनॉल ध्रुवीय, आणि एकटी ध्रुवता शंभर अंशांचा फरक समजावते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's premise is the mistake, and it is worth stating plainly: a molecular formula does not determine a substance. C₂H₆O is a count of atoms, and the same atoms can be joined in more than one way. Join them as CH₃CH₂OH and you get ethanol; join them as CH₃OCH₃ and you get dimethyl ether. These are structural isomers — different compounds, with different melting points, different densities, different smells and different chemistry. One is drinkable in dilution and the other is an anaesthetic gas. Now the boiling points, which follow from one structural detail. In ethanol the oxygen carries a hydrogen directly, so an ethanol molecule presents both a hydrogen bonded to a very electronegative atom and a lone pair on that atom. That is exactly the requirement for hydrogen bonding, and every ethanol molecule can therefore link to its neighbours. Boiling means pulling molecules entirely apart, so all those links must be broken, and 78 °C is what that costs. In dimethyl ether the oxygen sits between two carbons and carries no hydrogen of its own. The molecule still has lone pairs and it is still polar — so it can accept a hydrogen bond from something else, such as water, which is why the ether is appreciably soluble. But it has no hydrogen on an electronegative atom to donate one, so ether molecules cannot bond to each other. Only dipole–dipole attraction and dispersion forces remain, and those give way at −24 °C. The hundred-degree gap is the strength of hydrogen bonding, made visible by holding everything else constant. Note the shape of the argument, because it recurs throughout organic chemistry. Molar mass and polarity are the same for both isomers, so neither can be the explanation — the third and fourth options both reach for a variable that has not changed. What differs is a specific structural feature, an O–H bond, and identifying which feature is responsible is most of what explaining a physical property amounts to. The same reasoning ranks the boiling points of an alkane, an aldehyde and an alcohol of similar mass in that order, and it is why water is a liquid while hydrogen sulphide, heavier, is a gas. (The second answer would make isomerism impossible, and every organic chemistry textbook is a catalogue of counter-examples.)",
          hi: "विद्यार्थी की मान्यता ही भूल है, और उसे साफ़ कहना सार्थक है: आण्विक सूत्र पदार्थ तय नहीं करता। C₂H₆O परमाणुओं की गिनती है, और वही परमाणु एक से अधिक तरीक़ों से जोड़े जा सकते हैं। उन्हें CH₃CH₂OH की तरह जोड़ो तो एथेनॉल मिलता है; CH₃OCH₃ की तरह जोड़ो तो डाइमेथिल ईथर। ये संरचनात्मक समावयवी हैं — भिन्न यौगिक, भिन्न गलनांक, भिन्न घनत्व, भिन्न गंध और भिन्न रसायन वाले। एक तनुकरण में पीने योग्य है और दूसरा निश्चेतक गैस। अब क्वथनांक, जो एक संरचनात्मक ब्योरे से निकलते हैं। एथेनॉल में ऑक्सीजन सीधे हाइड्रोजन ढोता है, अतः एथेनॉल का अणु दोनों प्रस्तुत करता है — अत्यंत विद्युत्-ऋणात्मक परमाणु से बँधा हाइड्रोजन और उसी परमाणु पर एकाकी युग्म। हाइड्रोजन बंधन की शर्त ठीक यही है, और इसलिए हर एथेनॉल अणु अपने पड़ोसियों से जुड़ सकता है। उबलने का अर्थ अणुओं को पूरी तरह अलग करना है, अतः वे सारे जोड़ तोड़ने पड़ते हैं, और 78 °C उसकी क़ीमत है। डाइमेथिल ईथर में ऑक्सीजन दो कार्बनों के बीच बैठा है और अपना कोई हाइड्रोजन नहीं ढोता। अणु के पास अब भी एकाकी युग्म हैं और वह अब भी ध्रुवीय है — अतः वह किसी और से, जैसे पानी से, हाइड्रोजन बंध स्वीकार कर सकता है, इसीलिए ईथर उल्लेखनीय रूप से विलेय है। पर उसके पास देने को विद्युत्-ऋणात्मक परमाणु पर कोई हाइड्रोजन नहीं, अतः ईथर के अणु आपस में बंध नहीं बना सकते। केवल द्विध्रुव-द्विध्रुव आकर्षण और परिक्षेपण बल बचते हैं, और वे −24 °C पर छूट जाते हैं। सौ डिग्री का अंतर हाइड्रोजन बंधन की प्रबलता है, बाक़ी सब अचर रखकर दिखाई देने योग्य बनाई गई। तर्क का आकार ध्यान दो, क्योंकि वह कार्बनिक रसायन भर लौटता है। दोनों समावयवियों के लिए मोलर द्रव्यमान और ध्रुवता एक-सी हैं, अतः कोई भी व्याख्या नहीं हो सकती — तीसरा और चौथा विकल्प दोनों ऐसा चर पकड़ते हैं जो बदला ही नहीं। भिन्न है एक विशिष्ट संरचनात्मक लक्षण, एक O–H बंध, और कौन-सा लक्षण ज़िम्मेदार है यह पहचानना ही किसी भौतिक गुण को समझाने का अधिकांश अर्थ है। वही तर्क समान द्रव्यमान के ऐल्केन, ऐल्डिहाइड और ऐल्कोहॉल के क्वथनांक उसी क्रम में रखता है, और इसी से पानी द्रव है जबकि भारी हाइड्रोजन सल्फ़ाइड गैस। (दूसरा उत्तर समावयवता को असंभव बना देता, और कार्बनिक रसायन की हर पाठ्यपुस्तक प्रति-उदाहरणों की सूची है।)",
          mr: "विद्यार्थ्याचे गृहीतक हीच चूक, आणि ते स्पष्ट सांगणे सार्थक: रेणवीय सूत्र पदार्थ ठरवत नाही. C₂H₆O ही अणूंची मोजणी, आणि तेच अणू एकाहून अधिक मार्गांनी जोडता येतात. त्यांना CH₃CH₂OH सारखे जोडा तर इथेनॉल मिळते; CH₃OCH₃ सारखे जोडा तर डायमिथाइल ईथर. ही संरचनात्मक समघटक — वेगळी संयुगे, वेगळे द्रवणबिंदू, वेगळ्या घनता, वेगळे वास आणि वेगळे रसायन असलेली. एक विरळ केल्यावर पिण्याजोगे आणि दुसरा भूल देणारा वायू. आता उकळबिंदू, जे एका संरचनात्मक तपशिलातून निघतात. इथेनॉलमध्ये ऑक्सिजन थेट हायड्रोजन वाहतो, म्हणून इथेनॉलचा रेणू दोन्ही सादर करतो — अत्यंत विद्युतऋण अणूशी बांधलेला हायड्रोजन आणि त्याच अणूवरची एकाकी जोडी. हायड्रोजन बंधनाची अट नेमकी हीच, आणि म्हणून प्रत्येक इथेनॉल रेणू आपल्या शेजाऱ्यांशी जोडला जाऊ शकतो. उकळणे म्हणजे रेणू पूर्णपणे वेगळे करणे, म्हणून ते सर्व दुवे तोडावे लागतात, आणि 78 °C ही त्याची किंमत. डायमिथाइल ईथरमध्ये ऑक्सिजन दोन कार्बनांमध्ये बसलेला आणि स्वतःचा कोणताही हायड्रोजन वाहत नाही. रेणूकडे अजूनही एकाकी जोड्या आहेत आणि तो अजूनही ध्रुवीय — म्हणून तो दुसऱ्या कोणाकडून, जसे पाण्याकडून, हायड्रोजन बंध स्वीकारू शकतो, म्हणूनच ईथर लक्षणीयरीत्या विद्राव्य. पण त्याच्याकडे द्यायला विद्युतऋण अणूवरचा कोणताही हायड्रोजन नाही, म्हणून ईथरचे रेणू आपापसात बंध करू शकत नाहीत. केवळ द्विध्रुव-द्विध्रुव आकर्षण आणि विकिरण बले उरतात, आणि ती −24 °C वर सुटतात. शंभर अंशांचा फरक ही हायड्रोजन बंधनाची प्रबळता, बाकी सर्व अचल ठेवून दृश्य केलेली. युक्तिवादाचा आकार लक्षात घ्या, कारण तो सेंद्रिय रसायनभर परततो. दोन्ही समघटकांसाठी मोलर वस्तुमान आणि ध्रुवता सारखी, म्हणून कोणतीही स्पष्टीकरण असू शकत नाही — तिसरा आणि चौथा पर्याय दोघेही असे चल पकडतात जे बदललेच नाही. वेगळे आहे एक विशिष्ट संरचनात्मक वैशिष्ट्य, एक O–H बंध, आणि कोणते वैशिष्ट्य जबाबदार हे ओळखणे हाच एखादा भौतिक गुणधर्म समजावण्याचा बहुतांश अर्थ. तोच युक्तिवाद समान वस्तुमानाच्या अल्केन, अल्डिहाइड आणि अल्कोहोलचे उकळबिंदू त्याच क्रमाने ठेवतो, आणि म्हणूनच पाणी द्रव तर जड हायड्रोजन सल्फाइड वायू. (दुसरे उत्तर समघटकता अशक्य बनवेल, आणि सेंद्रिय रसायनाचे प्रत्येक पाठ्यपुस्तक प्रतिउदाहरणांची यादी आहे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Acetic acid is around ten trillion times stronger an acid than ethanol, although both give up a proton from an O–H group. Explain the difference, and say why chloroacetic acid is stronger still.",
          hi: "ऐसीटिक अम्ल एथेनॉल से लगभग दस खरब गुना प्रबल अम्ल है, यद्यपि दोनों O–H समूह से प्रोटॉन छोड़ते हैं। भेद समझाओ, और बताओ क्लोरोऐसीटिक अम्ल उससे भी प्रबल क्यों है।",
          mr: "ॲसिटिक आम्ल इथेनॉलहून सुमारे दहा खर्व पट प्रबळ आम्ल आहे, जरी दोघेही O–H गटातून प्रोटॉन सोडतात. फरक समजावा, आणि क्लोरोॲसिटिक आम्ल त्याहूनही प्रबळ का ते सांगा.",
        },
        choices: [
          {
            en: "What matters is the stability of the anion left behind. Ethanol's ethoxide puts the whole negative charge on one oxygen with nothing to share it. Acetate spreads the charge equally over two oxygens by resonance, and both C–O bonds are found to be the same length — so the proton leaves far more readily. Chloroacetic acid adds a second stabilising effect: the chlorine's inductive pull drags electron density away along the sigma bonds, spreading the charge further still",
            hi: "मायने पीछे बचे ऋणायन की स्थिरता रखती है। एथेनॉल का एथॉक्साइड पूरा ऋण आवेश एक ऑक्सीजन पर रख देता है और उसे बाँटने को कुछ नहीं। ऐसीटेट अनुनाद से आवेश दो ऑक्सीजनों पर बराबर फैला देता है, और दोनों C–O बंध एक ही लंबाई के पाए जाते हैं — अतः प्रोटॉन कहीं अधिक तत्परता से निकलता है। क्लोरोऐसीटिक अम्ल दूसरा स्थिरकारी प्रभाव जोड़ता है: क्लोरीन का प्रेरणिक खिंचाव सिग्मा बंधों के अनुदिश इलेक्ट्रॉन-घनत्व को दूर घसीटता है, आवेश को और फैलाते हुए",
            mr: "महत्त्वाची आहे मागे उरलेल्या ऋणायनाची स्थिरता. इथेनॉलचे इथॉक्साइड अख्खा ऋण भार एका ऑक्सिजनवर ठेवते आणि तो वाटायला काहीही नाही. ॲसिटेट अनुनादाने भार दोन ऑक्सिजनांवर समान पसरवते, आणि दोन्ही C–O बंध एकाच लांबीचे आढळतात — म्हणून प्रोटॉन कितीतरी अधिक तत्परतेने निघतो. क्लोरोॲसिटिक आम्ल दुसरा स्थिरीकरण परिणाम जोडते: क्लोरिनची प्रेरणिक ओढ सिग्मा बंधांच्या दिशेने इलेक्ट्रॉन-घनता दूर ओढते, भार आणखी पसरवत",
          },
          {
            en: "Acetic acid is stronger because it contains more oxygen atoms, and acidity always rises with the number of oxygens",
            hi: "ऐसीटिक अम्ल इसलिए प्रबल है कि उसमें अधिक ऑक्सीजन परमाणु हैं, और अम्लता सदा ऑक्सीजनों की संख्या के साथ बढ़ती है",
            mr: "ॲसिटिक आम्ल यासाठी प्रबळ की त्यात अधिक ऑक्सिजन अणू आहेत, आणि आम्लता नेहमी ऑक्सिजनांच्या संख्येसोबत वाढते",
          },
          {
            en: "The O–H bond in acetic acid is weaker, and bond strength alone determines how easily a proton leaves",
            hi: "ऐसीटिक अम्ल का O–H बंध दुर्बल है, और अकेली बंध-प्रबलता तय करती है कि प्रोटॉन कितनी आसानी से निकले",
            mr: "ॲसिटिक आम्लातील O–H बंध दुर्बल आहे, आणि एकटी बंध-प्रबळता प्रोटॉन किती सहज निघतो हे ठरवते",
          },
          {
            en: "Chlorine makes chloroacetic acid stronger by donating electron density to the carboxylate group",
            hi: "क्लोरीन कार्बोक्सिलेट समूह को इलेक्ट्रॉन-घनत्व देकर क्लोरोऐसीटिक अम्ल को प्रबल बनाती है",
            mr: "क्लोरिन कार्बोक्सिलेट गटाला इलेक्ट्रॉन-घनता देऊन क्लोरोॲसिटिक आम्ल प्रबळ बनवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Acid strength is not a property of the acid alone; it is a comparison between the acid and the anion it becomes. Both molecules break the same kind of bond and release the same proton, so the difference must lie in what is left behind. Ethanol gives ethoxide, CH₃CH₂O⁻. The negative charge sits on one oxygen and stays there — there is nothing adjacent to share it with, and a concentrated charge on a single small atom is a high-energy arrangement. The anion is unstable, so the equilibrium sits far to the left and ethanol is barely an acid at all. Acetic acid gives acetate, CH₃COO⁻, and here something structural intervenes. The carbon carries two oxygens, and the negative charge is delocalised across both by resonance. The evidence is not merely theoretical: X-ray measurements find the two C–O bonds identical at about 127 pm, between a single bond's 143 and a double bond's 123. Neither oxygen carries a full negative charge; each carries half. Spreading charge lowers energy, the anion is far more stable, and the proton leaves accordingly — a pKa of 4.76 against ethanol's 16, which is the ten-trillion-fold ratio in the question. Chloroacetic acid adds a second, independent mechanism. Chlorine is strongly electronegative, and it pulls electron density towards itself along the chain of sigma bonds. That withdrawal drains charge away from the carboxylate, spreading it over still more of the molecule and stabilising the anion further. The pKa falls to 2.86 — about eighty times stronger. The effect is confirmed by its distance dependence, which is the signature of induction: with the chlorine one carbon further away, in 3-chloropropanoic acid, the strengthening is much diminished, and by the fourth carbon it has all but vanished. The general principle is worth carrying out of the chapter: anything that stabilises the conjugate base strengthens the acid. Resonance does it by delocalising, induction by withdrawing, and the two are additive — trichloroacetic acid, with three chlorines pulling, is a strong acid comparable to hydrochloric. (The second answer counts atoms instead of examining structure; the third names a real factor that is not the dominant one here, since the O–H bond energies are similar; and the fourth reverses the direction of chlorine's effect, which would make the acid weaker rather than stronger.)",
          hi: "अम्ल-प्रबलता अकेले अम्ल का गुण नहीं; वह अम्ल और उस ऋणायन की तुलना है जो वह बन जाता है। दोनों अणु उसी क़िस्म का बंध तोड़ते हैं और वही प्रोटॉन छोड़ते हैं, अतः भेद उसी में होगा जो पीछे बचता है। एथेनॉल एथॉक्साइड देता है, CH₃CH₂O⁻. ऋण आवेश एक ऑक्सीजन पर बैठता है और वहीं रहता है — बाँटने को पास कुछ नहीं, और अकेले छोटे परमाणु पर केंद्रित आवेश उच्च-ऊर्जा व्यवस्था है। ऋणायन अस्थिर है, अतः साम्य दूर बाईं ओर बैठता है और एथेनॉल मुश्किल से अम्ल है। ऐसीटिक अम्ल ऐसीटेट देता है, CH₃COO⁻, और यहाँ कुछ संरचनात्मक बीच में आ जाता है। कार्बन दो ऑक्सीजन ढोता है, और ऋण आवेश अनुनाद से दोनों पर विस्थानीकृत हो जाता है। प्रमाण केवल सैद्धांतिक नहीं: एक्स-किरण माप दोनों C–O बंध लगभग 127 pm पर समान पाते हैं, एकल बंध के 143 और द्विबंध के 123 के बीच। कोई भी ऑक्सीजन पूरा ऋण आवेश नहीं ढोता; हर एक आधा ढोता है। आवेश फैलाना ऊर्जा घटाता है, ऋणायन कहीं अधिक स्थिर है, और प्रोटॉन तदनुसार निकल जाता है — एथेनॉल के 16 के सामने 4.76 का pKa, और यही प्रश्न वाला दस खरब गुना अनुपात है। क्लोरोऐसीटिक अम्ल दूसरी, स्वतंत्र क्रियाविधि जोड़ता है। क्लोरीन प्रबल विद्युत्-ऋणात्मक है, और वह सिग्मा बंधों की शृंखला के अनुदिश इलेक्ट्रॉन-घनत्व अपनी ओर खींचती है। वह खिंचाव कार्बोक्सिलेट से आवेश बहा ले जाता है, उसे अणु के और अधिक हिस्से पर फैलाकर ऋणायन को और स्थिर करता है। pKa गिरकर 2.86 हो जाता है — लगभग अस्सी गुना प्रबल। प्रभाव की पुष्टि उसकी दूरी-निर्भरता से होती है, जो प्रेरण की पहचान है: क्लोरीन एक कार्बन और दूर हो, 3-क्लोरोप्रोपेनोइक अम्ल में, तो प्रबलन बहुत घट जाता है, और चौथे कार्बन तक वह लगभग ग़ायब है। अध्याय से ले जाने योग्य सामान्य सिद्धांत: जो भी संयुग्मी क्षारक को स्थिर करे वह अम्ल को प्रबल करता है। अनुनाद विस्थानीकरण से करता है, प्रेरण खींचकर, और दोनों जुड़ते हैं — तीन क्लोरीन खींचती ट्राइक्लोरोऐसीटिक अम्ल हाइड्रोक्लोरिक के तुल्य प्रबल अम्ल है। (दूसरा उत्तर संरचना जाँचने के बजाय परमाणु गिनता है; तीसरा ऐसे असली कारक का नाम लेता है जो यहाँ प्रधान नहीं, क्योंकि O–H बंध-ऊर्जाएँ मिलती-जुलती हैं; और चौथा क्लोरीन के प्रभाव की दिशा उलट देता है, जिससे अम्ल प्रबल नहीं दुर्बल होता।)",
          mr: "आम्ल-प्रबळता हा एकट्या आम्लाचा गुणधर्म नव्हे; ती आम्ल आणि तो जो ऋणायन बनतो यांची तुलना. दोन्ही रेणू त्याच प्रकारचा बंध तोडतात आणि तोच प्रोटॉन सोडतात, म्हणून फरक मागे उरणाऱ्यातच असावा. इथेनॉल इथॉक्साइड देते, CH₃CH₂O⁻. ऋण भार एका ऑक्सिजनवर बसतो आणि तिथेच राहतो — वाटायला जवळ काहीही नाही, आणि एकट्या लहान अणूवर केंद्रित भार ही उच्च-ऊर्जा मांडणी. ऋणायन अस्थिर, म्हणून समतोल दूर डावीकडे बसतो आणि इथेनॉल जेमतेम आम्ल. ॲसिटिक आम्ल ॲसिटेट देते, CH₃COO⁻, आणि इथे काहीतरी संरचनात्मक मध्ये येते. कार्बन दोन ऑक्सिजन वाहतो, आणि ऋण भार अनुनादाने दोघांवर विस्थानित होतो. पुरावा केवळ सैद्धांतिक नाही: क्ष-किरण मापे दोन्ही C–O बंध सुमारे 127 pm वर सारखे आढळतात, एकेरी बंधाच्या 143 आणि द्विबंधाच्या 123 दरम्यान. कोणताही ऑक्सिजन पूर्ण ऋण भार वाहत नाही; प्रत्येक अर्धा वाहतो. भार पसरवणे ऊर्जा घटवते, ऋणायन कितीतरी अधिक स्थिर, आणि प्रोटॉन त्यानुसार निघतो — इथेनॉलच्या 16 समोर 4.76 चा pKa, आणि हेच प्रश्नातले दहा खर्व पट गुणोत्तर. क्लोरोॲसिटिक आम्ल दुसरी, स्वतंत्र कार्यपद्धती जोडते. क्लोरिन प्रबळ विद्युतऋण, आणि तो सिग्मा बंधांच्या साखळीच्या दिशेने इलेक्ट्रॉन-घनता स्वतःकडे ओढतो. ती ओढ कार्बोक्सिलेटपासून भार वाहून नेते, तो रेणूच्या आणखी अधिक भागावर पसरवून ऋणायनाला अधिक स्थिर करते. pKa घटून 2.86 होतो — सुमारे ऐंशीपट प्रबळ. परिणामाची पुष्टी त्याच्या अंतर-अवलंबितेतून होते, जी प्रेरणाची ओळख: क्लोरिन एक कार्बन आणखी दूर असल्यास, 3-क्लोरोप्रोपानोइक आम्लात, प्रबळीकरण बरेच घटते, आणि चौथ्या कार्बनपर्यंत ते जवळपास नाहीसे. प्रकरणातून नेण्याजोगे सामान्य तत्त्व: जे काही संयुग्मी आम्लारीला स्थिर करते ते आम्ल प्रबळ करते. अनुनाद विस्थानीकरणाने करतो, प्रेरणा ओढून, आणि दोन्ही जोडले जातात — तीन क्लोरिन ओढणारे ट्रायक्लोरोॲसिटिक आम्ल हायड्रोक्लोरिकच्या तोडीचे प्रबळ आम्ल. (दुसरे उत्तर संरचना तपासण्याऐवजी अणू मोजते; तिसरे अशा खऱ्या घटकाचे नाव घेते जो इथे प्रमुख नाही, कारण O–H बंध-ऊर्जा सारख्या आहेत; आणि चौथे क्लोरिनच्या परिणामाची दिशा उलटवते, ज्याने आम्ल प्रबळ नव्हे तर दुर्बल झाले असते.)",
        },
      },
      /*H8C*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — Hydrocarbons                                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-11-hydrocarbons",
    subject: "CHEMISTRY",
    classLevel: 11,
    chapter: {
      en: "Chapter 9 — Hydrocarbons",
      hi: "अध्याय 9 — हाइड्रोकार्बन",
      mr: "प्रकरण 9 — हायड्रोकार्बन",
    },
    name: {
      en: "Hydrocarbons",
      hi: "हाइड्रोकार्बन",
      mr: "हायड्रोकार्बन",
    },
    summary: {
      en: "Carbon and hydrogen alone make thousands of compounds, and their reactions divide sharply by what holds the molecule together: a saturated chain that will only be attacked by a radical in light, a double bond so rich in electrons that it attracts them anyway, a triple bond whose hydrogen is faintly acidic because of the orbital it sits on, and a ring whose six shared electrons make it refuse the very addition an alkene welcomes.",
      hi: "अकेले कार्बन और हाइड्रोजन हज़ारों यौगिक बनाते हैं, और उनकी अभिक्रियाएँ इस बात से तीखे ढंग से बँटती हैं कि अणु को जोड़े क्या रखता है: वह संतृप्त शृंखला जिस पर केवल प्रकाश में मूलक ही हमला करेगा, वह द्विबंध जो इलेक्ट्रॉनों से इतना धनी है कि फिर भी उन्हें खींचता है, वह त्रिबंध जिसका हाइड्रोजन उस कक्षक के कारण हल्का अम्लीय है जिस पर वह बैठा है, और वह वलय जिसके छह साझा इलेक्ट्रॉन उसे ठीक वही योग करने से मना करा देते हैं जिसका ऐल्कीन स्वागत करता है।",
      mr: "एकटे कार्बन आणि हायड्रोजन हजारो संयुगे बनवतात, आणि त्यांच्या अभिक्रिया रेणूला काय जोडून ठेवते यावरून तीव्रपणे विभागल्या जातात: ती संतृप्त साखळी जिच्यावर केवळ प्रकाशातला मूलकच हल्ला करेल, तो द्विबंध जो इलेक्ट्रॉनांनी इतका श्रीमंत की तरीही त्यांना ओढतो, तो त्रिबंध ज्याचा हायड्रोजन तो ज्या कक्षकावर बसला आहे त्यामुळे किंचित आम्लधर्मी, आणि ते वलय ज्याचे सहा वाटलेले इलेक्ट्रॉन त्याला नेमकी तीच योगक्रिया नाकारायला लावतात जिचे अल्कीन स्वागत करते.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "free-radical-substitution-in-alkanes",
        name: {
          en: "Substitution that needs light to start",
          hi: "वह प्रतिस्थापन जिसे शुरू होने को प्रकाश चाहिए",
          mr: "सुरू व्हायला प्रकाश लागणारे प्रतिस्थापन",
        },
        kind: "mechanism",
        prompt: {
          en: "Methane and chlorine can sit mixed in a dark flask indefinitely and do nothing, yet a flash of sunlight sets off a reaction that will not stop at one product. Which process is this?",
          hi: "मीथेन और क्लोरीन अंधेरी शीशी में अनिश्चित काल मिले बैठे रह सकते हैं और कुछ नहीं करते, फिर भी धूप की एक चमक ऐसी अभिक्रिया छेड़ देती है जो एक उत्पाद पर रुकेगी नहीं। यह कौन-सी प्रक्रिया है?",
          mr: "मिथेन आणि क्लोरिन अंधाऱ्या कुपीत अनिश्चित काळ मिसळून बसू शकतात आणि काहीच करत नाहीत, तरीही सूर्यप्रकाशाची एक झळक अशी अभिक्रिया पेटवते जी एका उत्पादावर थांबणार नाही. ही कोणती प्रक्रिया?",
        },
        statement: {
          en: "An alkane reacts with a halogen by free-radical substitution: light splits the halogen into two radicals, each of which pulls a hydrogen off the alkane and starts a chain that keeps itself going.",
          hi: "ऐल्केन हैलोजन से मुक्त-मूलक प्रतिस्थापन द्वारा अभिक्रिया करता है: प्रकाश हैलोजन को दो मूलकों में तोड़ता है, और हर मूलक ऐल्केन से एक हाइड्रोजन खींच लेता है और ऐसी शृंखला शुरू करता है जो स्वयं को चलाती रहती है।",
          mr: "अल्केन हॅलोजनशी मुक्त-मूलक प्रतिस्थापनाने अभिक्रिया करते: प्रकाश हॅलोजनला दोन मूलकांत तोडतो, आणि प्रत्येक मूलक अल्केनकडून एक हायड्रोजन ओढतो आणि अशी साखळी सुरू करतो जी स्वतःला चालवत राहते.",
        },
        detail: {
          en: "Because the product still has hydrogens on it, it is attacked in its turn, so the flask ends up holding a mixture of mono-, di-, tri- and tetrachloromethane rather than one clean substance.",
          hi: "चूँकि उत्पाद पर अब भी हाइड्रोजन हैं, उस पर भी अपनी बारी में हमला होता है, अतः शीशी में एक साफ़ पदार्थ के बजाय मोनो-, डाइ-, ट्राइ- और टेट्राक्लोरोमीथेन का मिश्रण बचता है।",
          mr: "उत्पादावर अजूनही हायड्रोजन असल्याने त्याच्यावरही आपल्या वेळी हल्ला होतो, म्हणून कुपीत एका स्वच्छ पदार्थाऐवजी मोनो-, डाय-, ट्राय- आणि टेट्राक्लोरोमिथेनचे मिश्रण उरते.",
        },
        extra: {
          en: "The dark flask is the evidence: no reaction without light means the first step must be one that light performs, which is breaking a bond homolytically rather than into ions.",
          hi: "अंधेरी शीशी ही प्रमाण है: प्रकाश बिना कोई अभिक्रिया नहीं, अर्थात पहला क़दम वही होगा जो प्रकाश करता है, यानी बंध को आयनों में नहीं बल्कि समांशी ढंग से तोड़ना।",
          mr: "अंधारी कुपीच पुरावा: प्रकाशाशिवाय अभिक्रिया नाही, म्हणजे पहिले पाऊल तेच असावे जे प्रकाश करतो, म्हणजे बंध आयनांत नव्हे तर समांशी पद्धतीने तोडणे.",
        },
        pair: {
          left: {
            en: "Nothing in the dark, everything in sunlight",
            hi: "अंधेरे में कुछ नहीं, धूप में सब कुछ",
            mr: "अंधारात काहीच नाही, सूर्यप्रकाशात सर्व काही",
          },
          right: {
            en: "substitution that needs light to start",
            hi: "वह प्रतिस्थापन जिसे शुरू होने को प्रकाश चाहिए",
            mr: "सुरू व्हायला प्रकाश लागणारे प्रतिस्थापन",
          },
        },
      },
      {
        id: "addition-to-an-unsymmetrical-double-bond",
        name: {
          en: "Which end the hydrogen joins",
          hi: "हाइड्रोजन किस सिरे से जुड़ता है",
          mr: "हायड्रोजन कोणत्या टोकाला जोडतो",
        },
        kind: "rule",
        prompt: {
          en: "When HBr adds to propene, two products are conceivable but one dominates overwhelmingly, and the deciding factor is which of the two possible intermediates is more stable. Which rule is this?",
          hi: "जब HBr प्रोपीन से जुड़ता है, दो उत्पाद कल्पनीय हैं पर एक भारी बहुमत से प्रबल रहता है, और निर्णायक बात यह है कि दो संभव मध्यवर्तियों में से कौन अधिक स्थिर है। यह कौन-सा नियम है?",
          mr: "जेव्हा HBr प्रोपीनला जोडतो, दोन उत्पादे कल्पनीय आहेत पण एक प्रचंड बहुमताने प्रबळ ठरते, आणि निर्णायक बाब ही की दोन संभाव्य मध्यस्थांपैकी कोणता अधिक स्थिर. हा कोणता नियम?",
        },
        statement: {
          en: "Markovnikov's rule: in the addition of a hydrogen halide to an unsymmetrical alkene, the hydrogen attaches to the carbon that already has more hydrogens, because that route passes through the more stable carbocation.",
          hi: "मार्कोवनिकॉफ़ का नियम: असममित ऐल्कीन में हाइड्रोजन हैलाइड के योग में हाइड्रोजन उस कार्बन से जुड़ता है जिस पर पहले से अधिक हाइड्रोजन हैं, क्योंकि वह मार्ग अधिक स्थिर कार्बधनायन से होकर जाता है।",
          mr: "मार्कोव्हनिकॉफचा नियम: असममित अल्कीनमध्ये हायड्रोजन हॅलाइडच्या योगात हायड्रोजन त्या कार्बनला जोडतो ज्यावर आधीच अधिक हायड्रोजन आहेत, कारण तो मार्ग अधिक स्थिर कार्बधनायनातून जातो.",
        },
        detail: {
          en: "The rule is a consequence, not a cause: the alkene's electrons take the proton first, and the positive charge that results settles wherever it can be spread out best.",
          hi: "नियम परिणाम है, कारण नहीं: ऐल्कीन के इलेक्ट्रॉन पहले प्रोटॉन ले लेते हैं, और जो धन आवेश बनता है वह वहीं बैठता है जहाँ वह सबसे बेहतर फैल सके।",
          mr: "नियम हा परिणाम आहे, कारण नव्हे: अल्कीनचे इलेक्ट्रॉन आधी प्रोटॉन घेतात, आणि तयार होणारा धन भार तिथेच बसतो जिथे तो उत्तम पसरू शकतो.",
        },
        extra: {
          en: "In the presence of peroxides the addition of HBr reverses and gives the other product, which proves the rule was never about the atoms themselves but about the mechanism they happen to follow.",
          hi: "परॉक्साइडों की उपस्थिति में HBr का योग उलट जाता है और दूसरा उत्पाद देता है, जो सिद्ध करता है कि नियम कभी परमाणुओं के बारे में था ही नहीं, बल्कि उस क्रियाविधि के बारे में जिससे वे गुज़रते हैं।",
          mr: "पेरॉक्साइडांच्या उपस्थितीत HBr चा योग उलटतो आणि दुसरे उत्पाद देतो, जे सिद्ध करते की नियम कधीच अणूंबद्दल नव्हता, तर ते ज्या कार्यपद्धतीने जातात तिच्याबद्दल होता.",
        },
        pair: {
          left: {
            en: "Peroxides reverse the outcome",
            hi: "परॉक्साइड परिणाम उलट देते हैं",
            mr: "पेरॉक्साइड परिणाम उलटवतात",
          },
          right: {
            en: "which end the hydrogen joins",
            hi: "हाइड्रोजन किस सिरे से जुड़ता है",
            mr: "हायड्रोजन कोणत्या टोकाला जोडतो",
          },
        },
      },
      {
        id: "acidity-of-a-terminal-triple-bond",
        name: {
          en: "The one hydrocarbon hydrogen a base can take",
          hi: "वह इकलौता हाइड्रोकार्बन हाइड्रोजन जिसे क्षारक ले सकता है",
          mr: "आम्लारी घेऊ शकेल असा एकमेव हायड्रोकार्बन हायड्रोजन",
        },
        kind: "contrast",
        prompt: {
          en: "Sodium amide will not touch ethane or ethene, but it strips a hydrogen off ethyne at once, and the reason is the fraction of s character in the orbital holding that hydrogen. Which property is this?",
          hi: "सोडियम एमाइड एथेन या एथीन को छूता तक नहीं, पर एथाइन से तुरंत एक हाइड्रोजन छीन लेता है, और कारण है उस कक्षक में s-गुण का अंश जो उस हाइड्रोजन को थामे है। यह कौन-सा गुण है?",
          mr: "सोडियम अमाइड इथेन वा इथीनला स्पर्शही करत नाही, पण इथाइनकडून लगेच एक हायड्रोजन ओढून घेतो, आणि कारण म्हणजे तो हायड्रोजन धरून ठेवणाऱ्या कक्षकातील s-गुणाचा अंश. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "A hydrogen on the carbon of a terminal triple bond is weakly acidic, because that carbon is sp hybridised and its 50 per cent s character holds the shared pair closer to the nucleus.",
          hi: "अंतिम त्रिबंध वाले कार्बन पर लगा हाइड्रोजन दुर्बल अम्लीय है, क्योंकि वह कार्बन sp संकरित है और उसका 50 प्रतिशत s-गुण साझा युग्म को नाभिक के अधिक पास थामे रखता है।",
          mr: "अंतिम त्रिबंधाच्या कार्बनवरचा हायड्रोजन दुर्बल आम्लधर्मी, कारण तो कार्बन sp संकरित आणि त्याचा 50 टक्के s-गुण वाटलेली जोडी केंद्रकाच्या अधिक जवळ धरून ठेवतो.",
        },
        detail: {
          en: "The trend follows the s character exactly: sp at 50 per cent gives a pKa near 25, sp² at 33 per cent gives about 44, and sp³ at 25 per cent gives about 50.",
          hi: "प्रवृत्ति ठीक s-गुण के अनुसार चलती है: 50 प्रतिशत पर sp लगभग 25 का pKa देता है, 33 प्रतिशत पर sp² लगभग 44, और 25 प्रतिशत पर sp³ लगभग 50।",
          mr: "कल नेमका s-गुणानुसार चालतो: 50 टक्क्यांवर sp सुमारे 25 चा pKa देतो, 33 टक्क्यांवर sp² सुमारे 44, आणि 25 टक्क्यांवर sp³ सुमारे 50.",
        },
        extra: {
          en: "It is acidic only by hydrocarbon standards — water is some ten billion times stronger — so the base used to remove it must itself be extremely strong.",
          hi: "वह केवल हाइड्रोकार्बन के पैमाने पर अम्लीय है — पानी उससे लगभग दस अरब गुना प्रबल है — अतः उसे हटाने वाला क्षारक स्वयं अत्यंत प्रबल होना चाहिए।",
          mr: "तो केवळ हायड्रोकार्बनच्या मोजपट्टीवर आम्लधर्मी — पाणी त्याहून सुमारे दहा अब्जपट प्रबळ — म्हणून तो काढणारा आम्लारी स्वतः अत्यंत प्रबळ असावा लागतो.",
        },
        pair: {
          left: {
            en: "Fifty per cent s character",
            hi: "पचास प्रतिशत s-गुण",
            mr: "पन्नास टक्के s-गुण",
          },
          right: {
            en: "the one hydrocarbon hydrogen a base can take",
            hi: "वह इकलौता हाइड्रोकार्बन हाइड्रोजन जिसे क्षारक ले सकता है",
            mr: "आम्लारी घेऊ शकेल असा एकमेव हायड्रोकार्बन हायड्रोजन",
          },
        },
      },
      {
        id: "why-a-ring-refuses-to-add",
        name: {
          en: "The ring that will not add",
          hi: "वह वलय जो योग नहीं करता",
          mr: "जोडून घेण्यास नकार देणारे वलय",
        },
        kind: "contrast",
        prompt: {
          en: "An alkene decolourises bromine water in seconds; a molecule with three double bonds in a ring leaves it orange all afternoon, because adding across one bond would destroy something the whole ring shares. What is that?",
          hi: "ऐल्कीन ब्रोमीन जल का रंग सेकंडों में उड़ा देता है; वलय में तीन द्विबंध वाला अणु उसे पूरी दोपहर नारंगी छोड़ देता है, क्योंकि एक बंध पर योग वह चीज़ नष्ट कर देगा जिसे पूरा वलय साझा करता है। वह क्या है?",
          mr: "अल्कीन ब्रोमिन पाण्याचा रंग सेकंदांत उडवते; वलयात तीन द्विबंध असलेला रेणू ते अख्खी दुपार नारिंगी ठेवतो, कारण एका बंधावर योग केल्याने अख्खे वलय जे वाटून घेते ते नष्ट होईल. ते काय?",
        },
        statement: {
          en: "Benzene's six π electrons are delocalised over the whole ring, and that delocalisation lowers its energy by about 150 kJ/mol, so the ring undergoes substitution rather than addition in order to keep it.",
          hi: "बेंज़ीन के छह π इलेक्ट्रॉन पूरे वलय पर विस्थानीकृत हैं, और वह विस्थानीकरण उसकी ऊर्जा लगभग 150 kJ/mol घटा देता है, अतः उसे बनाए रखने के लिए वलय योग के बजाय प्रतिस्थापन से गुज़रता है।",
          mr: "बेंझिनचे सहा π इलेक्ट्रॉन अख्ख्या वलयावर विस्थानित आहेत, आणि ते विस्थानीकरण त्याची ऊर्जा सुमारे 150 kJ/mol घटवते, म्हणून ते टिकवण्यासाठी वलय योगाऐवजी प्रतिस्थापनातून जाते.",
        },
        detail: {
          en: "The evidence is in the bond lengths: all six carbon–carbon bonds measure 139 pm, between a single bond's 154 and a double bond's 134, so there are no alternating long and short bonds to find.",
          hi: "प्रमाण बंध-लंबाइयों में है: सभी छह कार्बन–कार्बन बंध 139 pm नापते हैं, एकल बंध के 154 और द्विबंध के 134 के बीच, अतः खोजने को बारी-बारी लंबे और छोटे बंध हैं ही नहीं।",
          mr: "पुरावा बंध-लांबींत आहे: सर्व सहा कार्बन–कार्बन बंध 139 pm मोजतात, एकेरी बंधाच्या 154 आणि द्विबंधाच्या 134 दरम्यान, म्हणून शोधायला आलटून-पालटून लांब आणि लहान बंध नाहीतच.",
        },
        extra: {
          en: "Hydrogenation confirms the figure: adding hydrogen to the ring releases about 150 kJ/mol less than three separate double bonds would, and that shortfall is the stability being paid back.",
          hi: "हाइड्रोजनीकरण आँकड़े की पुष्टि करता है: वलय में हाइड्रोजन जोड़ने पर तीन अलग द्विबंधों से लगभग 150 kJ/mol कम निकलता है, और वह कमी ही चुकाई जा रही स्थिरता है।",
          mr: "हायड्रोजनीकरण आकडा पक्का करते: वलयात हायड्रोजन जोडल्यास तीन वेगळ्या द्विबंधांहून सुमारे 150 kJ/mol कमी निघते, आणि तीच तूट म्हणजे परत फेडली जाणारी स्थिरता.",
        },
        pair: {
          left: {
            en: "All six bonds the same length",
            hi: "सभी छह बंध एक ही लंबाई के",
            mr: "सर्व सहा बंध एकाच लांबीचे",
          },
          right: {
            en: "the ring that will not add",
            hi: "वह वलय जो योग नहीं करता",
            mr: "जोडून घेण्यास नकार देणारे वलय",
          },
        },
      },
      {
        id: "attack-by-an-electron-seeking-species",
        name: {
          en: "Attack by a species short of electrons",
          hi: "इलेक्ट्रॉनों की कमी वाली स्पीशीज़ का हमला",
          mr: "इलेक्ट्रॉनांची कमतरता असलेल्या स्पीशीजचा हल्ला",
        },
        kind: "mechanism",
        prompt: {
          en: "Nitric acid alone does nothing to benzene; mixed with sulphuric acid it nitrates it readily, because the second acid manufactures the positively charged particle that does the attacking. Which mechanism is this?",
          hi: "अकेला नाइट्रिक अम्ल बेंज़ीन का कुछ नहीं बिगाड़ता; सल्फ़्यूरिक अम्ल के साथ मिलने पर वह उसे सहज नाइट्रीकृत कर देता है, क्योंकि दूसरा अम्ल वह धनावेशित कण बना देता है जो हमला करता है। यह कौन-सी क्रियाविधि है?",
          mr: "एकटे नायट्रिक आम्ल बेंझिनचे काहीच बिघडवत नाही; सल्फ्यूरिक आम्लासोबत मिसळल्यावर ते त्याचे सहज नायट्रीकरण करते, कारण दुसरे आम्ल हल्ला करणारा धनभारित कण तयार करते. ही कोणती कार्यपद्धती?",
        },
        statement: {
          en: "Aromatic rings react by electrophilic substitution: an electron-poor species is attacked by the ring's π cloud, and a hydrogen is then lost so the delocalisation is restored.",
          hi: "ऐरोमैटिक वलय इलेक्ट्रॉनरागी प्रतिस्थापन से अभिक्रिया करते हैं: इलेक्ट्रॉन-दरिद्र स्पीशीज़ पर वलय का π बादल हमला करता है, और फिर एक हाइड्रोजन खो जाता है ताकि विस्थानीकरण लौट आए।",
          mr: "सुगंधी वलये इलेक्ट्रॉनरागी प्रतिस्थापनाने अभिक्रिया करतात: इलेक्ट्रॉन-दरिद्री स्पीशीजवर वलयाचा π ढग हल्ला करतो, आणि मग एक हायड्रोजन गमावला जातो जेणेकरून विस्थानीकरण परत यावे.",
        },
        detail: {
          en: "The intermediate is a ring that has temporarily lost its aromaticity and carries a positive charge spread over five carbons, which is why the hydrogen leaves rather than a second group joining.",
          hi: "मध्यवर्ती वह वलय है जिसने अपनी ऐरोमैटिकता अस्थायी रूप से खो दी है और पाँच कार्बनों पर फैला धन आवेश ढो रहा है, इसीलिए दूसरा समूह जुड़ने के बजाय हाइड्रोजन निकल जाता है।",
          mr: "मध्यस्थ म्हणजे ते वलय ज्याने आपली सुगंधिता तात्पुरती गमावली आहे आणि पाच कार्बनांवर पसरलेला धन भार वाहतो, म्हणूनच दुसरा गट जोडण्याऐवजी हायड्रोजन निघून जातो.",
        },
        extra: {
          en: "Every named reaction of benzene fits the same shape and differs only in the electrophile: NO₂⁺ for nitration, SO₃ for sulphonation, and R⁺ or RCO⁺ made by aluminium chloride for the Friedel–Crafts pair.",
          hi: "बेंज़ीन की हर नामित अभिक्रिया उसी ढाँचे में बैठती है और केवल इलेक्ट्रॉनरागी में भिन्न है: नाइट्रीकरण को NO₂⁺, सल्फ़ोनीकरण को SO₃, और फ़्रीडेल–क्राफ़्ट्स युग्म को ऐलुमिनियम क्लोराइड से बना R⁺ या RCO⁺।",
          mr: "बेंझिनची प्रत्येक नामांकित अभिक्रिया त्याच साच्यात बसते आणि केवळ इलेक्ट्रॉनरागीत वेगळी: नायट्रीकरणाला NO₂⁺, सल्फोनीकरणाला SO₃, आणि फ्रीडेल–क्राफ्ट्स जोडीला ॲल्युमिनियम क्लोराइडने बनवलेला R⁺ वा RCO⁺.",
        },
        pair: {
          left: {
            en: "The second acid makes the attacker",
            hi: "दूसरा अम्ल हमलावर बनाता है",
            mr: "दुसरे आम्ल हल्लेखोर बनवते",
          },
          right: {
            en: "attack by a species short of electrons",
            hi: "इलेक्ट्रॉनों की कमी वाली स्पीशीज़ का हमला",
            mr: "इलेक्ट्रॉनांची कमतरता असलेल्या स्पीशीजचा हल्ला",
          },
        },
      },
      {
        id: "where-the-second-group-goes",
        name: {
          en: "Where the second group goes",
          hi: "दूसरा समूह कहाँ जाता है",
          mr: "दुसरा गट कुठे जातो",
        },
        kind: "rule",
        prompt: {
          en: "Nitrating toluene puts the new group next to or opposite the methyl and hardly ever between; nitrating nitrobenzene does the exact reverse, and slowly. Which effect is this?",
          hi: "टॉलूईन का नाइट्रीकरण नए समूह को मेथिल के बग़ल में या सामने रखता है और बीच में शायद ही कभी; नाइट्रोबेंज़ीन का नाइट्रीकरण ठीक उलटा करता है, और धीरे। यह कौन-सा प्रभाव है?",
          mr: "टोल्यूइनचे नायट्रीकरण नवा गट मिथाइलच्या शेजारी वा समोर ठेवते आणि मध्ये क्वचितच; नायट्रोबेंझिनचे नायट्रीकरण नेमके उलटे करते, आणि सावकाश. हा कोणता परिणाम?",
        },
        statement: {
          en: "A group already on the ring directs the next one: electron-donating groups activate the ring and send the newcomer to the ortho and para positions, while electron-withdrawing groups deactivate it and send the newcomer to the meta position.",
          hi: "वलय पर पहले से लगा समूह अगले को दिशा देता है: इलेक्ट्रॉन-दानी समूह वलय को सक्रिय करते हैं और नवागत को ऑर्थो और पैरा स्थानों पर भेजते हैं, जबकि इलेक्ट्रॉन-खींचू समूह उसे निष्क्रिय करते हैं और नवागत को मेटा स्थान पर भेजते हैं।",
          mr: "वलयावर आधीच असलेला गट पुढच्याला दिशा देतो: इलेक्ट्रॉन-दाते गट वलय सक्रिय करतात आणि नवागताला ऑर्थो व पॅरा स्थानी पाठवतात, तर इलेक्ट्रॉन-ओढे गट ते निष्क्रिय करतात आणि नवागताला मेटा स्थानी पाठवतात.",
        },
        detail: {
          en: "The direction is decided by the intermediate: a donating group can share the positive charge when it sits ortho or para to the attack, and cannot when it sits meta.",
          hi: "दिशा मध्यवर्ती तय करता है: दानी समूह धन आवेश तब साझा कर सकता है जब वह हमले के ऑर्थो या पैरा हो, और तब नहीं जब वह मेटा हो।",
          mr: "दिशा मध्यस्थ ठरवतो: दाता गट धन भार तेव्हाच वाटून घेऊ शकतो जेव्हा तो हल्ल्याच्या ऑर्थो वा पॅरा असतो, आणि मेटा असताना नाही.",
        },
        extra: {
          en: "The halogens are the standing exception: they deactivate the ring by induction yet still direct ortho and para by donating a lone pair, so speed and position answer to different causes.",
          hi: "हैलोजन स्थायी अपवाद हैं: वे प्रेरण से वलय को निष्क्रिय करते हैं फिर भी एकाकी युग्म देकर ऑर्थो और पैरा दिशा देते हैं, अतः गति और स्थान अलग-अलग कारणों को उत्तर देते हैं।",
          mr: "हॅलोजन हे कायमचे अपवाद: ते प्रेरणेने वलय निष्क्रिय करतात तरीही एकाकी जोडी देऊन ऑर्थो व पॅरा दिशा देतात, म्हणून वेग आणि स्थान वेगवेगळ्या कारणांना उत्तर देतात.",
        },
        pair: {
          left: {
            en: "Halogens slow the ring and still aim it",
            hi: "हैलोजन वलय को धीमा करते हैं और फिर भी निशाना देते हैं",
            mr: "हॅलोजन वलय मंदावतात आणि तरीही नेम देतात",
          },
          right: {
            en: "where the second group goes",
            hi: "दूसरा समूह कहाँ जाता है",
            mr: "दुसरा गट कुठे जातो",
          },
        },
      },
      /*F9C*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student reasons that benzene, having three double bonds, should decolourise bromine water about three times as fast as cyclohexene does. In the laboratory cyclohexene clears the colour at once and benzene leaves it unchanged. Explain the failure of the reasoning.",
          hi: "एक विद्यार्थी तर्क करता है कि बेंज़ीन में तीन द्विबंध होने से वह ब्रोमीन जल का रंग साइक्लोहेक्सीन से लगभग तीन गुना तेज़ी से उड़ाएगा। प्रयोगशाला में साइक्लोहेक्सीन रंग तुरंत साफ़ कर देता है और बेंज़ीन उसे अपरिवर्तित छोड़ देता है। तर्क की विफलता समझाओ।",
          mr: "एक विद्यार्थी तर्क करतो की बेंझिनमध्ये तीन द्विबंध असल्याने ते ब्रोमिन पाण्याचा रंग सायक्लोहेक्सीनहून सुमारे तिप्पट वेगाने उडवेल. प्रयोगशाळेत सायक्लोहेक्सीन रंग लगेच स्वच्छ करते आणि बेंझिन तो अपरिवर्तित ठेवते. तर्काचे अपयश समजावा.",
        },
        choices: [
          {
            en: "The three double bonds in benzene are not three double bonds. Their six electrons are delocalised over the whole ring, all six carbon–carbon bonds measure the same 139 pm, and the arrangement is about 150 kJ/mol lower in energy than three isolated double bonds would be. Adding bromine across one position would break that delocalisation, so the ring declines the reaction and substitutes instead — and substitution needs a catalyst and an electrophile, which bromine water does not supply. Counting double bonds counts a drawing rather than a molecule",
            hi: "बेंज़ीन के तीन द्विबंध तीन द्विबंध हैं ही नहीं। उनके छह इलेक्ट्रॉन पूरे वलय पर विस्थानीकृत हैं, सभी छह कार्बन–कार्बन बंध वही 139 pm नापते हैं, और वह व्यवस्था तीन पृथक द्विबंधों से लगभग 150 kJ/mol कम ऊर्जा पर है। एक स्थान पर ब्रोमीन जोड़ना वह विस्थानीकरण तोड़ देगा, अतः वलय अभिक्रिया से इनकार करता है और उसके बजाय प्रतिस्थापन करता है — और प्रतिस्थापन को उत्प्रेरक और इलेक्ट्रॉनरागी चाहिए, जो ब्रोमीन जल देता नहीं। द्विबंध गिनना अणु नहीं, चित्र गिनना है",
            mr: "बेंझिनचे तीन द्विबंध हे तीन द्विबंध नाहीतच. त्यांचे सहा इलेक्ट्रॉन अख्ख्या वलयावर विस्थानित, सर्व सहा कार्बन–कार्बन बंध तेच 139 pm मोजतात, आणि ती मांडणी तीन वेगळ्या द्विबंधांहून सुमारे 150 kJ/mol कमी ऊर्जेवर आहे. एका जागी ब्रोमिन जोडल्याने ते विस्थानीकरण तुटेल, म्हणून वलय अभिक्रिया नाकारते आणि त्याऐवजी प्रतिस्थापन करते — आणि प्रतिस्थापनाला उत्प्रेरक व इलेक्ट्रॉनरागी लागतो, जो ब्रोमिन पाणी देत नाही. द्विबंध मोजणे म्हणजे रेणू नव्हे, चित्र मोजणे",
          },
          {
            en: "The student is right in principle but benzene is simply too dilute in the test, so the reaction is there and merely slow",
            hi: "विद्यार्थी सिद्धांततः सही है पर परीक्षण में बेंज़ीन बस बहुत तनु है, अतः अभिक्रिया है और केवल धीमी है",
            mr: "विद्यार्थी तत्त्वतः बरोबर पण चाचणीत बेंझिन फक्त खूप विरळ, म्हणून अभिक्रिया आहे आणि केवळ मंद आहे",
          },
          {
            en: "Benzene has no double bonds at all; the ring is held together by six single bonds and a separate set of electrons that take no part in bonding",
            hi: "बेंज़ीन में द्विबंध हैं ही नहीं; वलय छह एकल बंधों और इलेक्ट्रॉनों के एक अलग समुच्चय से जुड़ा है जो आबंधन में कोई भाग नहीं लेते",
            mr: "बेंझिनमध्ये द्विबंध नाहीतच; वलय सहा एकेरी बंधांनी आणि बंधनात भाग न घेणाऱ्या इलेक्ट्रॉनांच्या वेगळ्या संचाने जोडलेले",
          },
          {
            en: "Benzene is a liquid and cyclohexene is a gas, so the two cannot be compared in an aqueous test at all",
            hi: "बेंज़ीन द्रव है और साइक्लोहेक्सीन गैस, अतः दोनों की तुलना जलीय परीक्षण में की ही नहीं जा सकती",
            mr: "बेंझिन द्रव आणि सायक्लोहेक्सीन वायू, म्हणून दोघांची तुलना जलीय चाचणीत करताच येत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has read a structural formula as if it were an inventory. Kekulé's drawing of benzene shows three double bonds because a drawing on paper must put each pair of electrons somewhere, but the molecule does not oblige. Three pieces of evidence say so, and they are worth holding together. First, bond length. If the ring really alternated single and double bonds it would have three long bonds of about 154 pm and three short ones of about 134 pm, and the molecule would be a slightly lopsided hexagon. X-ray and electron diffraction find six identical bonds of 139 pm and a perfectly regular hexagon. There is nothing intermediate about an average of measurements; each individual bond is intermediate. Second, energy. Hydrogenating cyclohexene releases about 120 kJ/mol, so three of those bonds should release about 360. Hydrogenating benzene releases only about 210. The missing 150 kJ/mol is energy the ring does not have to give up because it never had three separate double bonds to begin with — it is the price the delocalisation has already banked. Third, chemistry, which is what the test is showing. Cyclohexene adds bromine because its two π electrons are localised between two carbons, easy to reach and, once used, replaced by two new sigma bonds that are stronger than what was lost. Benzene cannot make that trade. Adding across one position would strand the remaining four electrons in an ordinary diene and destroy the 150 kJ/mol, so the addition is uphill and does not happen. The ring will react — with a real electrophile and a Lewis acid catalyst, it substitutes, losing a hydrogen and getting its aromaticity back at the end. Bromine water supplies neither. The general lesson outlasts the example. A structural formula records connectivity, not the true distribution of electrons, and wherever a molecule has more than one reasonable drawing the truth is usually none of them but something in between and lower in energy than any. The bromine water test is a good one precisely because it distinguishes localised electrons from delocalised ones, and a pupil who has watched it once will not confuse an alkene with an aromatic ring again. (The second answer treats a difference in kind as a difference in degree; the third denies the π system entirely, which cannot explain the ring's chemistry or its planarity; and the fourth invents physical states — both are liquids at room temperature — and would be irrelevant even if true.)",
          hi: "विद्यार्थी ने संरचना-सूत्र को सूची की तरह पढ़ लिया है। बेंज़ीन का केकुले-चित्र तीन द्विबंध दिखाता है क्योंकि काग़ज़ पर बने चित्र को इलेक्ट्रॉनों का हर युग्म कहीं न कहीं रखना ही पड़ता है, पर अणु यह मानने को बाध्य नहीं। तीन प्रमाण ऐसा कहते हैं, और उन्हें साथ रखना चाहिए। पहला, बंध-लंबाई। यदि वलय सचमुच एकल और द्विबंध बारी-बारी रखता तो उसमें लगभग 154 pm के तीन लंबे बंध होते और लगभग 134 pm के तीन छोटे, और अणु थोड़ा बेढब षट्भुज होता। एक्स-किरण और इलेक्ट्रॉन विवर्तन 139 pm के छह समान बंध और पूर्णतः नियमित षट्भुज पाते हैं। मापों के औसत में कुछ मध्यवर्ती नहीं होता; हर अकेला बंध मध्यवर्ती है। दूसरा, ऊर्जा। साइक्लोहेक्सीन का हाइड्रोजनीकरण लगभग 120 kJ/mol छोड़ता है, अतः उन तीन बंधों को लगभग 360 छोड़ना चाहिए। बेंज़ीन का हाइड्रोजनीकरण केवल लगभग 210 छोड़ता है। ग़ायब 150 kJ/mol वह ऊर्जा है जो वलय को छोड़नी नहीं पड़ती क्योंकि उसके पास तीन अलग द्विबंध कभी थे ही नहीं — वह क़ीमत विस्थानीकरण पहले ही जमा कर चुका है। तीसरा, रसायन, जो यह परीक्षण दिखा रहा है। साइक्लोहेक्सीन ब्रोमीन जोड़ लेता है क्योंकि उसके दो π इलेक्ट्रॉन दो कार्बनों के बीच स्थानीकृत हैं, पहुँचने में आसान और एक बार लग जाने पर दो नए सिग्मा बंधों से बदल दिए जाते हैं जो खोए हुए से प्रबल हैं। बेंज़ीन वह सौदा नहीं कर सकता। एक स्थान पर योग बचे चार इलेक्ट्रॉनों को साधारण डाईन में फँसा देगा और 150 kJ/mol नष्ट कर देगा, अतः योग चढ़ाई है और होता नहीं। वलय अभिक्रिया करेगा — असली इलेक्ट्रॉनरागी और लूइस अम्ल उत्प्रेरक के साथ वह प्रतिस्थापन करता है, एक हाइड्रोजन खोता है और अंत में अपनी ऐरोमैटिकता वापस पा लेता है। ब्रोमीन जल दोनों में से कुछ नहीं देता। सामान्य सीख उदाहरण से लंबी चलती है। संरचना-सूत्र संयोजकता दर्ज करता है, इलेक्ट्रॉनों का सच्चा वितरण नहीं, और जहाँ भी किसी अणु के एक से अधिक उचित चित्र हों वहाँ सच प्रायः उनमें से कोई नहीं बल्कि बीच का कुछ होता है और सबसे कम ऊर्जा पर। ब्रोमीन जल परीक्षण ठीक इसीलिए अच्छा है कि वह स्थानीकृत इलेक्ट्रॉनों को विस्थानीकृत से अलग कर देता है, और जिसने उसे एक बार देख लिया वह ऐल्कीन और ऐरोमैटिक वलय फिर नहीं गड्डमड्ड करेगा। (दूसरा उत्तर क़िस्म के भेद को मात्रा का भेद मान लेता है; तीसरा π तंत्र से पूरी तरह इनकार करता है, जो न वलय का रसायन समझा सकता है न उसकी समतलता; और चौथा भौतिक अवस्थाएँ गढ़ लेता है — दोनों कमरे के ताप पर द्रव हैं — और सच होता तब भी असंगत रहता।)",
          mr: "विद्यार्थ्याने संरचना-सूत्र यादीसारखे वाचले आहे. बेंझिनचे केकुले-चित्र तीन द्विबंध दाखवते कारण कागदावरच्या चित्राला इलेक्ट्रॉनांची प्रत्येक जोडी कुठेतरी ठेवावीच लागते, पण रेणू ते मानायला बांधील नाही. तीन पुरावे तसे सांगतात, आणि ते एकत्र धरणे योग्य. पहिला, बंध-लांबी. वलयाने खरोखर एकेरी आणि द्विबंध आलटून-पालटून ठेवले असते तर त्यात सुमारे 154 pm चे तीन लांब बंध असते आणि सुमारे 134 pm चे तीन लहान, आणि रेणू किंचित असमतोल षट्कोन झाला असता. क्ष-किरण आणि इलेक्ट्रॉन विवर्तन 139 pm चे सहा सारखे बंध आणि पूर्णपणे नियमित षट्कोन आढळतात. मापांच्या सरासरीत काही मध्यवर्ती नसते; प्रत्येक एकेक बंधच मध्यवर्ती आहे. दुसरा, ऊर्जा. सायक्लोहेक्सीनचे हायड्रोजनीकरण सुमारे 120 kJ/mol सोडते, म्हणून त्या तीन बंधांनी सुमारे 360 सोडावे. बेंझिनचे हायड्रोजनीकरण केवळ सुमारे 210 सोडते. हरवलेले 150 kJ/mol ही ती ऊर्जा जी वलयाला सोडावी लागत नाही कारण त्याच्याकडे तीन वेगळे द्विबंध कधी होतेच नाहीत — ती किंमत विस्थानीकरणाने आधीच जमा केली आहे. तिसरा, रसायन, जे ही चाचणी दाखवत आहे. सायक्लोहेक्सीन ब्रोमिन जोडून घेते कारण त्याचे दोन π इलेक्ट्रॉन दोन कार्बनांमध्ये स्थानित, पोहोचायला सोपे आणि एकदा वापरले की दोन नव्या सिग्मा बंधांनी बदलले जातात जे गमावलेल्याहून प्रबळ. बेंझिन तो सौदा करू शकत नाही. एका जागी योग उरलेल्या चार इलेक्ट्रॉनांना सामान्य डाईनमध्ये अडकवेल आणि 150 kJ/mol नष्ट करेल, म्हणून योग चढाव आहे आणि होत नाही. वलय अभिक्रिया करेल — खऱ्या इलेक्ट्रॉनरागीसोबत आणि लुईस आम्ल उत्प्रेरकासोबत ते प्रतिस्थापन करते, एक हायड्रोजन गमावते आणि शेवटी आपली सुगंधिता परत मिळवते. ब्रोमिन पाणी दोन्हींपैकी काहीच देत नाही. सामान्य धडा उदाहरणाहून लांब चालतो. संरचना-सूत्र जोडणी नोंदवते, इलेक्ट्रॉनांचे खरे वितरण नव्हे, आणि जिथे कुठे रेणूची एकाहून अधिक रास्त चित्रे असतील तिथे सत्य बहुधा त्यांतले कोणतेच नसून मधले काहीतरी असते आणि कोणत्याहीपेक्षा कमी ऊर्जेवर. ब्रोमिन पाणी चाचणी नेमकी म्हणूनच चांगली की ती स्थानित इलेक्ट्रॉन विस्थानितांपासून वेगळे करते, आणि जिने ती एकदा पाहिली ती अल्कीन आणि सुगंधी वलय पुन्हा गोंधळणार नाही. (दुसरे उत्तर प्रकाराचा फरक प्रमाणाचा फरक मानते; तिसरे π प्रणाली पूर्णपणे नाकारते, जे ना वलयाचे रसायन समजावू शकते ना त्याची समतलता; आणि चौथे भौतिक अवस्था रचते — दोन्ही खोलीच्या तापमानाला द्रव आहेत — आणि खरे असते तरी असंबद्धच राहिले असते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Adding HBr to propene in the presence of a peroxide gives 1-bromopropane, the opposite of what the acid gives on its own. A student concludes that peroxides reverse all hydrogen-halide additions. Test that conclusion against HCl and HI.",
          hi: "परॉक्साइड की उपस्थिति में प्रोपीन से HBr का योग 1-ब्रोमोप्रोपेन देता है, जो अकेले अम्ल के देने से उलटा है। एक विद्यार्थी निष्कर्ष निकालता है कि परॉक्साइड सभी हाइड्रोजन-हैलाइड योगों को उलट देते हैं। उस निष्कर्ष को HCl और HI पर परखो।",
          mr: "पेरॉक्साइडाच्या उपस्थितीत प्रोपीनला HBr चा योग 1-ब्रोमोप्रोपेन देतो, जे एकट्या आम्लाने मिळणाऱ्याच्या उलट. एक विद्यार्थी निष्कर्ष काढतो की पेरॉक्साइड सर्व हायड्रोजन-हॅलाइड योग उलटवतात. तो निष्कर्ष HCl आणि HI वर तपासा.",
        },
        choices: [
          {
            en: "The conclusion fails: only HBr shows the peroxide effect. The reversal happens because peroxides start a radical chain in which a halogen atom, not a proton, adds first, and that chain requires both of its steps to be energetically downhill. For HBr they are. For HCl the H–Cl bond is too strong for the chlorine atom to be abstracted in the chain-carrying step, and for HI the C–I bond formed is too weak for the iodine atom to add usefully; in each case one step is uphill, the chain dies, and the ordinary ionic Markovnikov addition proceeds instead",
            hi: "निष्कर्ष विफल है: परॉक्साइड प्रभाव केवल HBr दिखाता है। उलटाव इसलिए होता है कि परॉक्साइड ऐसी मूलक शृंखला शुरू करते हैं जिसमें प्रोटॉन नहीं, हैलोजन परमाणु पहले जुड़ता है, और उस शृंखला के दोनों क़दमों का ऊर्जा की दृष्टि से उतार होना ज़रूरी है। HBr के लिए वे हैं। HCl के लिए H–Cl बंध इतना प्रबल है कि शृंखला-वाहक क़दम में क्लोरीन परमाणु खींचा नहीं जा सकता, और HI के लिए बनने वाला C–I बंध इतना दुर्बल है कि आयोडीन परमाणु उपयोगी ढंग से जुड़ नहीं सकता; हर हाल में एक क़दम चढ़ाई है, शृंखला मर जाती है, और उसके बजाय साधारण आयनिक मार्कोवनिकॉफ़ योग चलता है",
            mr: "निष्कर्ष अपयशी: पेरॉक्साइड परिणाम केवळ HBr दाखवते. उलथापालथ यासाठी होते की पेरॉक्साइड अशी मूलक साखळी सुरू करतात जिच्यात प्रोटॉन नव्हे, हॅलोजन अणू आधी जोडतो, आणि त्या साखळीची दोन्ही पावले ऊर्जेच्या दृष्टीने उतार असणे आवश्यक. HBr साठी ती आहेत. HCl साठी H–Cl बंध इतका प्रबळ की साखळी-वाहक पावलात क्लोरिन अणू ओढला जाऊ शकत नाही, आणि HI साठी तयार होणारा C–I बंध इतका दुर्बल की आयोडिन अणू उपयुक्तपणे जोडू शकत नाही; प्रत्येक बाबतीत एक पाऊल चढाव, साखळी मरते, आणि त्याऐवजी सामान्य आयनिक मार्कोव्हनिकॉफ योग चालतो",
          },
          {
            en: "The conclusion holds: peroxides reverse HCl and HI additions in exactly the same way, since the mechanism depends only on the peroxide and not on the acid",
            hi: "निष्कर्ष टिकता है: परॉक्साइड HCl और HI के योग भी ठीक उसी तरह उलट देते हैं, क्योंकि क्रियाविधि केवल परॉक्साइड पर निर्भर है, अम्ल पर नहीं",
            mr: "निष्कर्ष टिकतो: पेरॉक्साइड HCl आणि HI चे योगही नेमक्या त्याच पद्धतीने उलटवतात, कारण कार्यपद्धती केवळ पेरॉक्साइडवर अवलंबून, आम्लावर नाही",
          },
          {
            en: "The conclusion fails because peroxides prevent addition altogether with HCl and HI, so no product of either orientation forms",
            hi: "निष्कर्ष विफल है क्योंकि परॉक्साइड HCl और HI के साथ योग को पूरी तरह रोक देते हैं, अतः किसी भी अभिविन्यास का उत्पाद नहीं बनता",
            mr: "निष्कर्ष अपयशी कारण पेरॉक्साइड HCl आणि HI सोबत योग पूर्णपणे रोखतात, म्हणून कोणत्याही अभिमुखतेचे उत्पाद तयार होत नाही",
          },
          {
            en: "The conclusion fails because Markovnikov's rule itself is wrong, and the peroxide result shows the hydrogen always joins the carbon with fewer hydrogens",
            hi: "निष्कर्ष विफल है क्योंकि मार्कोवनिकॉफ़ का नियम स्वयं ग़लत है, और परॉक्साइड का परिणाम दिखाता है कि हाइड्रोजन सदा कम हाइड्रोजन वाले कार्बन से जुड़ता है",
            mr: "निष्कर्ष अपयशी कारण मार्कोव्हनिकॉफचा नियम स्वतःच चुकीचा, आणि पेरॉक्साइडचा निकाल दाखवतो की हायड्रोजन नेहमी कमी हायड्रोजन असलेल्या कार्बनला जोडतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has generalised from one case, which is the commonest way a correct observation becomes a wrong rule. The observation is real: HBr and a peroxide do give 1-bromopropane, and HBr alone gives 2-bromopropane. But the reversal is not a property of peroxides. It is a property of a mechanism that peroxides can start and that only one of the three acids can sustain. Take the two mechanisms apart. Without peroxide the addition is ionic. The alkene's π electrons reach for the proton, and the proton attaches wherever it leaves the better carbocation — on the end carbon, because that puts the positive charge on the middle carbon, which is secondary and therefore stabilised by two alkyl groups instead of one. Bromide then joins the charge. The bromine ends up on the middle carbon and the product is 2-bromopropane. That is Markovnikov's rule, and note that the rule is a description of where the charge went, not an instruction the atoms follow. With peroxide the first thing to break is the weak O–O bond, giving two alkoxy radicals. One of them abstracts hydrogen from HBr to give a bromine atom, and it is the bromine ATOM, not a proton, that adds to the alkene. It adds to the end carbon, because that leaves the unpaired electron on the middle carbon, and a secondary radical is more stable than a primary one for the same reason a secondary cation is. The resulting radical takes a hydrogen from another HBr, regenerating the bromine atom and carrying the chain. The bromine has ended up on the end carbon and the product is 1-bromopropane. The orientation is unchanged in its logic — the more stable intermediate still wins — and only the identity of what adds first has changed. Now the test the question asks for. The chain has two steps and both must be exothermic or the chain will not carry. For HBr: abstracting hydrogen from H–Br, at 366 kJ/mol, is feasible, and the C–Br bond formed, at about 285, is worth forming. For HCl the H–Cl bond is 431 kJ/mol, too strong to give up its hydrogen in the chain step, so the chlorine atom is never made in useful quantity. For HI the H–I bond at 299 is easy enough to break, but the C–I bond formed is only about 220 kJ/mol, too weak to make the addition step favourable, and the iodine atoms simply recombine. In both cases the chain fails at one step, the radical route is unavailable, and the ordinary ionic addition proceeds — Markovnikov, peroxide or no peroxide. Three things are worth carrying away. A mechanism, not a reagent, determines an outcome, and the same reagent may sit in two different mechanisms with opposite results. A chain reaction is only as good as its worst step, since every step must run millions of times. And an exception that applies to exactly one member of a family is usually not an exception to the rule but evidence that a second rule is operating, which is precisely what the peroxide effect turned out to be. (The second answer treats the peroxide as the whole cause; the third invents an inhibition that is not observed, since HCl and HI add perfectly well; and the fourth throws away a rule that holds in every ionic addition on the strength of a single radical case.)",
          hi: "विद्यार्थी ने एक मामले से सामान्यीकरण कर लिया है, और यही सबसे आम तरीक़ा है जिससे सही प्रेक्षण ग़लत नियम बन जाता है। प्रेक्षण असली है: HBr और परॉक्साइड सचमुच 1-ब्रोमोप्रोपेन देते हैं, और अकेला HBr 2-ब्रोमोप्रोपेन। पर उलटाव परॉक्साइडों का गुण नहीं। वह उस क्रियाविधि का गुण है जिसे परॉक्साइड शुरू कर सकते हैं और जिसे तीन अम्लों में से केवल एक टिका सकता है। दोनों क्रियाविधियाँ अलग-अलग देखो। परॉक्साइड बिना योग आयनिक है। ऐल्कीन के π इलेक्ट्रॉन प्रोटॉन की ओर बढ़ते हैं, और प्रोटॉन वहीं जुड़ता है जहाँ बेहतर कार्बधनायन बचे — सिरे के कार्बन पर, क्योंकि इससे धन आवेश बीच के कार्बन पर आता है, जो द्वितीयक है और इसलिए एक के बजाय दो ऐल्किल समूहों से स्थिर होता है। फिर ब्रोमाइड आवेश से जुड़ता है। ब्रोमीन बीच के कार्बन पर बैठ जाती है और उत्पाद 2-ब्रोमोप्रोपेन है। यही मार्कोवनिकॉफ़ का नियम है, और ध्यान दो कि नियम इसका वर्णन है कि आवेश कहाँ गया, वह निर्देश नहीं जिसका परमाणु पालन करते हों। परॉक्साइड के साथ सबसे पहले दुर्बल O–O बंध टूटता है, जिससे दो ऐल्कॉक्सी मूलक मिलते हैं। उनमें से एक HBr से हाइड्रोजन खींचकर ब्रोमीन परमाणु देता है, और ऐल्कीन से ब्रोमीन परमाणु जुड़ता है, प्रोटॉन नहीं। वह सिरे के कार्बन से जुड़ता है, क्योंकि इससे अयुग्मित इलेक्ट्रॉन बीच के कार्बन पर बचता है, और द्वितीयक मूलक प्राथमिक से उसी कारण अधिक स्थिर है जिस कारण द्वितीयक धनायन होता है। बना मूलक दूसरे HBr से हाइड्रोजन ले लेता है, ब्रोमीन परमाणु फिर बनाकर शृंखला आगे बढ़ाता है। ब्रोमीन सिरे के कार्बन पर बैठ गई और उत्पाद 1-ब्रोमोप्रोपेन है। अभिविन्यास का तर्क अपरिवर्तित है — अधिक स्थिर मध्यवर्ती अब भी जीतता है — और केवल यह बदला है कि पहले जुड़ता कौन है। अब वह परख जो प्रश्न माँगता है। शृंखला के दो क़दम हैं और दोनों ऊष्माक्षेपी होने चाहिए वरना शृंखला चलेगी नहीं। HBr के लिए: 366 kJ/mol वाले H–Br से हाइड्रोजन खींचना संभव है, और बनने वाला C–Br बंध, लगभग 285 पर, बनाने योग्य है। HCl के लिए H–Cl बंध 431 kJ/mol है, इतना प्रबल कि शृंखला-क़दम में अपना हाइड्रोजन दे न सके, अतः क्लोरीन परमाणु उपयोगी मात्रा में बनता ही नहीं। HI के लिए 299 पर H–I बंध तोड़ना आसान है, पर बनने वाला C–I बंध केवल लगभग 220 kJ/mol है, इतना दुर्बल कि योग-क़दम अनुकूल न हो, और आयोडीन परमाणु बस फिर जुड़ जाते हैं। दोनों हाल में शृंखला एक क़दम पर विफल है, मूलक मार्ग उपलब्ध नहीं, और साधारण आयनिक योग चलता है — मार्कोवनिकॉफ़, परॉक्साइड हो या न हो। तीन बातें ले जाने योग्य हैं। परिणाम अभिकर्मक नहीं, क्रियाविधि तय करती है, और वही अभिकर्मक दो भिन्न क्रियाविधियों में विपरीत परिणामों के साथ बैठ सकता है। शृंखला अभिक्रिया अपने सबसे बुरे क़दम जितनी ही अच्छी है, क्योंकि हर क़दम को लाखों बार चलना है। और वह अपवाद जो कुनबे के ठीक एक सदस्य पर लगे प्रायः नियम का अपवाद नहीं बल्कि इस बात का प्रमाण होता है कि दूसरा नियम काम कर रहा है, और परॉक्साइड प्रभाव ठीक यही निकला। (दूसरा उत्तर परॉक्साइड को पूरा कारण मान लेता है; तीसरा ऐसा अवरोधन गढ़ता है जो देखा नहीं जाता, क्योंकि HCl और HI बख़ूबी जुड़ते हैं; और चौथा एक अकेले मूलक मामले के बल पर वह नियम फेंक देता है जो हर आयनिक योग में टिकता है।)",
          mr: "विद्यार्थ्याने एका प्रकरणावरून सामान्यीकरण केले आहे, आणि हाच तो सर्वांत सामान्य मार्ग ज्याने बरोबर निरीक्षण चुकीचा नियम बनते. निरीक्षण खरे आहे: HBr आणि पेरॉक्साइड खरोखर 1-ब्रोमोप्रोपेन देतात, आणि एकटा HBr 2-ब्रोमोप्रोपेन. पण उलथापालथ हा पेरॉक्साइडांचा गुणधर्म नाही. तो त्या कार्यपद्धतीचा गुणधर्म आहे जी पेरॉक्साइड सुरू करू शकतात आणि जी तीन आम्लांपैकी केवळ एकच टिकवू शकते. दोन्ही कार्यपद्धती वेगवेगळ्या पाहा. पेरॉक्साइडविना योग आयनिक असतो. अल्कीनचे π इलेक्ट्रॉन प्रोटॉनकडे झेपावतात, आणि प्रोटॉन तिथेच जोडतो जिथे अधिक चांगला कार्बधनायन उरेल — टोकाच्या कार्बनवर, कारण त्याने धन भार मधल्या कार्बनवर येतो, जो द्वितीयक आणि म्हणून एकाऐवजी दोन अल्किल गटांनी स्थिर. मग ब्रोमाइड भाराशी जोडतो. ब्रोमिन मधल्या कार्बनवर बसते आणि उत्पाद 2-ब्रोमोप्रोपेन. हाच मार्कोव्हनिकॉफचा नियम, आणि लक्षात घ्या की नियम हे भार कुठे गेला याचे वर्णन आहे, अणू पाळत असलेली सूचना नव्हे. पेरॉक्साइडसोबत सर्वांत आधी दुर्बल O–O बंध तुटतो, ज्यातून दोन अल्कॉक्सी मूलक मिळतात. त्यांतला एक HBr कडून हायड्रोजन ओढून ब्रोमिन अणू देतो, आणि अल्कीनला ब्रोमिन अणू जोडतो, प्रोटॉन नव्हे. तो टोकाच्या कार्बनला जोडतो, कारण त्याने अयुग्मित इलेक्ट्रॉन मधल्या कार्बनवर उरतो, आणि द्वितीयक मूलक प्राथमिकहून त्याच कारणाने अधिक स्थिर ज्या कारणाने द्वितीयक धनायन असतो. तयार झालेला मूलक दुसऱ्या HBr कडून हायड्रोजन घेतो, ब्रोमिन अणू पुन्हा बनवून साखळी पुढे नेतो. ब्रोमिन टोकाच्या कार्बनवर बसली आणि उत्पाद 1-ब्रोमोप्रोपेन. अभिमुखतेचा तर्क अपरिवर्तित — अधिक स्थिर मध्यस्थ अजूनही जिंकतो — आणि केवळ आधी कोण जोडतो हेच बदलले. आता प्रश्नाने मागितलेली तपासणी. साखळीची दोन पावले आणि दोन्ही उष्माक्षेपी असावीत नाहीतर साखळी चालणार नाही. HBr साठी: 366 kJ/mol च्या H–Br कडून हायड्रोजन ओढणे शक्य, आणि तयार होणारा C–Br बंध, सुमारे 285 वर, बनवण्याजोगा. HCl साठी H–Cl बंध 431 kJ/mol, इतका प्रबळ की साखळी-पावलात आपला हायड्रोजन देऊ शकत नाही, म्हणून क्लोरिन अणू उपयुक्त प्रमाणात बनतच नाही. HI साठी 299 वरचा H–I बंध तोडणे सोपे, पण तयार होणारा C–I बंध केवळ सुमारे 220 kJ/mol, इतका दुर्बल की योग-पाऊल अनुकूल होणार नाही, आणि आयोडिन अणू फक्त पुन्हा जुळतात. दोन्ही बाबतीत साखळी एका पावलावर अपयशी, मूलक मार्ग उपलब्ध नाही, आणि सामान्य आयनिक योग चालतो — मार्कोव्हनिकॉफ, पेरॉक्साइड असो वा नसो. तीन गोष्टी नेण्याजोग्या. निकाल अभिकर्मक नव्हे, कार्यपद्धती ठरवते, आणि तोच अभिकर्मक दोन वेगळ्या कार्यपद्धतींत विरुद्ध निकालांसह बसू शकतो. साखळी अभिक्रिया आपल्या सर्वांत वाईट पावलाइतकीच चांगली, कारण प्रत्येक पाऊल लाखो वेळा चालायचे आहे. आणि कुटुंबाच्या नेमक्या एका सदस्याला लागू होणारा अपवाद बहुधा नियमाचा अपवाद नसून दुसरा नियम काम करत असल्याचा पुरावा असतो, आणि पेरॉक्साइड परिणाम नेमका तोच निघाला. (दुसरे उत्तर पेरॉक्साइडला अख्खे कारण मानते; तिसरे न पाहिलेला अडथळा रचते, कारण HCl आणि HI उत्तम जोडतात; आणि चौथे एकाच मूलक प्रकरणाच्या बळावर प्रत्येक आयनिक योगात टिकणारा नियम फेकून देते.)",
        },
      },
      /*H9C*/
    ],
  },

];

export const G11_CHEMISTRY_NUMERIC: Record<string, NumQ[]> = {
  "chemistry-11-some-basic-concepts": [
    {
      level: 1,
      stem: {
        en: "How many moles are there in 36 g of water, whose molar mass is 18 g/mol?",
        hi: "36 g पानी में कितने मोल हैं, जिसका मोलर द्रव्यमान 18 g/mol है?",
        mr: "36 g पाण्यात किती मोल आहेत, ज्याचे मोलर वस्तुमान 18 g/mol आहे?",
      },
      answer: 2,
      wrong: [648, 0.5, 18],
      checkExpr: "36/18",
      fmt: moles,
      solution: {
        en: "Moles are mass divided by molar mass: 36/18 = 2 mol. That is 2 × 6.022 × 10²³ molecules, counted by a balance rather than one at a time. (648 multiplies and 0.5 inverts the division.)",
        hi: "मोल द्रव्यमान बटा मोलर द्रव्यमान हैं: 36/18 = 2 mol. यह 2 × 6.022 × 10²³ अणु हैं, जो एक-एक करके नहीं बल्कि तराज़ू से गिने गए। (648 गुणा करता है और 0.5 भाग उलट देता है।)",
        mr: "मोल म्हणजे वस्तुमान भागिले मोलर वस्तुमान: 36/18 = 2 mol. ते 2 × 6.022 × 10²³ रेणू, एकेक करून नव्हे तर तराजूने मोजलेले. (648 गुणते आणि 0.5 भागाकार उलटा करते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "What is the mass of 0.5 mol of carbon dioxide, whose molar mass is 44 g/mol?",
        hi: "0.5 mol कार्बन डाइऑक्साइड का द्रव्यमान क्या है, जिसका मोलर द्रव्यमान 44 g/mol है?",
        mr: "0.5 mol कार्बन डायऑक्साइडचे वस्तुमान किती, ज्याचे मोलर वस्तुमान 44 g/mol आहे?",
      },
      answer: 22,
      wrong: [88, 44, 11],
      checkExpr: "0.5*44",
      fmt: grams,
      solution: {
        en: "Mass is moles times molar mass: 0.5 × 44 = 22 g. (88 divides by 0.5 instead of multiplying, and 44 quotes the molar mass itself as though the question had asked for one mole.)",
        hi: "द्रव्यमान मोल गुणा मोलर द्रव्यमान है: 0.5 × 44 = 22 g. (88 गुणा के बजाय 0.5 से भाग देता है, और 44 स्वयं मोलर द्रव्यमान बता देता है मानो प्रश्न ने एक मोल माँगा हो।)",
        mr: "वस्तुमान म्हणजे मोल गुणिले मोलर वस्तुमान: 0.5 × 44 = 22 g. (88 गुणण्याऐवजी 0.5 ने भागते, आणि 44 स्वतः मोलर वस्तुमान सांगते जणू प्रश्नाने एक मोल मागितला असावा.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "What percentage of the mass of carbon dioxide is carbon? Take the atomic masses as C = 12 and O = 16.",
        hi: "कार्बन डाइऑक्साइड के द्रव्यमान का कितना प्रतिशत कार्बन है? परमाणु द्रव्यमान C = 12 और O = 16 लो।",
        mr: "कार्बन डायऑक्साइडच्या वस्तुमानाच्या किती टक्के कार्बन आहे? अणुवस्तुमाने C = 12 आणि O = 16 घ्या.",
      },
      answer: 27.272727,
      wrong: [72.727273, 33.333333, 12],
      checkExpr: "100*12/44",
      solution: {
        en: "The molar mass is 12 + 32 = 44, so carbon's share is 100 × 12/44 = 27.272727 per cent. Note it is not 33.3 per cent: the molecule has one carbon out of three atoms, but percentage composition is by MASS and oxygen is heavier. (33.333333 is precisely that atom-count answer.)",
        hi: "मोलर द्रव्यमान 12 + 32 = 44 है, अतः कार्बन का हिस्सा 100 × 12/44 = 27.272727 प्रतिशत। ध्यान दो यह 33.3 प्रतिशत नहीं: अणु में तीन परमाणुओं में एक कार्बन है, पर प्रतिशत संघटन द्रव्यमान से है और ऑक्सीजन भारी है। (33.333333 ठीक वही परमाणु-गिनती वाला उत्तर है।)",
        mr: "मोलर वस्तुमान 12 + 32 = 44, म्हणून कार्बनचा वाटा 100 × 12/44 = 27.272727 टक्के. लक्षात घ्या ते 33.3 टक्के नाही: रेणूत तीन अणूंपैकी एक कार्बन, पण शेकडा संघटन वस्तुमानानुसार आणि ऑक्सिजन जड आहे. (33.333333 हेच नेमके ते अणु-मोजणीचे उत्तर.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "0.5 mol of solute is dissolved to make 250 mL of solution. What is the molarity, in mol/L?",
        hi: "0.5 mol विलेय घोलकर 250 mL विलयन बनाया जाता है। मोलरता mol/L में क्या है?",
        mr: "0.5 mol विद्राव्य विरघळवून 250 mL द्रावण बनवले जाते. मोलरता mol/L मध्ये किती?",
      },
      answer: 2,
      wrong: [0.125, 125, 0.002],
      checkExpr: "0.5/0.25",
      solution: {
        en: "Molarity is moles per litre of solution, and 250 mL is 0.25 L, so M = 0.5/0.25 = 2 mol/L. The volume that matters is the whole solution's, not the solvent's — which is why a volumetric flask is filled to the mark AFTER the solute has dissolved. (0.125 multiplies instead of dividing.)",
        hi: "मोलरता प्रति लीटर विलयन मोल है, और 250 mL = 0.25 L, अतः M = 0.5/0.25 = 2 mol/L. मायने रखता है पूरे विलयन का आयतन, विलायक का नहीं — इसीलिए आयतनमापी फ़्लास्क विलेय घुलने के बाद निशान तक भरा जाता है। (0.125 भाग के बजाय गुणा करता है।)",
        mr: "मोलरता म्हणजे प्रति लिटर द्रावण मोल, आणि 250 mL = 0.25 L, म्हणून M = 0.5/0.25 = 2 mol/L. महत्त्वाचे अख्ख्या द्रावणाचे घनफळ, विद्रावकाचे नव्हे — म्हणूनच घनफळमापी फ्लास्क विद्राव्य विरघळल्यावर खुणेपर्यंत भरला जातो. (0.125 भागण्याऐवजी गुणते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A compound has the empirical formula CH₂O, of formula mass 30, and its measured molar mass is 180 g/mol. How many empirical units are there in one molecule?",
        hi: "किसी यौगिक का मूलानुपाती सूत्र CH₂O है, जिसका सूत्र-द्रव्यमान 30 है, और उसका नापा गया मोलर द्रव्यमान 180 g/mol है। एक अणु में कितनी मूलानुपाती इकाइयाँ हैं?",
        mr: "एका संयुगाचे मूलानुपाती सूत्र CH₂O, ज्याचे सूत्र-वस्तुमान 30, आणि त्याचे मोजलेले मोलर वस्तुमान 180 g/mol. एका रेणूत किती मूलानुपाती एकके आहेत?",
      },
      answer: 6,
      wrong: [30, 150, 3],
      checkExpr: "180/30",
      solution: {
        en: "n = molar mass / empirical formula mass = 180/30 = 6, so the molecular formula is C₆H₁₂O₆ — glucose. The same empirical formula with n = 1 would be formaldehyde and with n = 2 acetic acid, which is why the molar mass measurement is not optional. (150 subtracts instead of dividing.)",
        hi: "n = मोलर द्रव्यमान / मूलानुपाती सूत्र-द्रव्यमान = 180/30 = 6, अतः आण्विक सूत्र C₆H₁₂O₆ है — ग्लूकोज़। वही मूलानुपाती सूत्र n = 1 पर फ़ॉर्मल्डिहाइड होता और n = 2 पर ऐसीटिक अम्ल, इसीलिए मोलर द्रव्यमान का माप वैकल्पिक नहीं। (150 भाग के बजाय घटाता है।)",
        mr: "n = मोलर वस्तुमान / मूलानुपाती सूत्र-वस्तुमान = 180/30 = 6, म्हणून रेणवीय सूत्र C₆H₁₂O₆ — ग्लुकोज. तेच मूलानुपाती सूत्र n = 1 वर फॉर्मल्डिहाइड झाले असते आणि n = 2 वर ॲसिटिक आम्ल, म्हणूनच मोलर वस्तुमानाचे माप ऐच्छिक नाही. (150 भागण्याऐवजी वजा करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Six moles of hydrogen react with two moles of oxygen by 2H₂ + O₂ → 2H₂O. How many moles of water are formed?",
        hi: "छह मोल हाइड्रोजन दो मोल ऑक्सीजन से 2H₂ + O₂ → 2H₂O के अनुसार अभिक्रिया करती है। कितने मोल पानी बनता है?",
        mr: "सहा मोल हायड्रोजन दोन मोल ऑक्सिजनशी 2H₂ + O₂ → 2H₂O प्रमाणे अभिक्रिया करतो. किती मोल पाणी तयार होते?",
      },
      answer: 4,
      wrong: [6, 3, 8],
      checkExpr: "2*2",
      fmt: moles,
      solution: {
        en: "Divide each amount by its coefficient: hydrogen 6/2 = 3, oxygen 2/1 = 2. Oxygen is limiting, and two moles of it give 2 × 2 = 4 mol of water, leaving 2 mol of hydrogen unreacted. (6 assumes the plentiful reactant decides, which is exactly backwards.)",
        hi: "हर मात्रा को उसके गुणांक से भाग दो: हाइड्रोजन 6/2 = 3, ऑक्सीजन 2/1 = 2. ऑक्सीजन सीमांत है, और उसके दो मोल 2 × 2 = 4 mol पानी देते हैं, तथा 2 mol हाइड्रोजन बिना अभिक्रिया के बचती है। (6 मान लेता है कि प्रचुर अभिकारक तय करता है, जो ठीक उलटा है।)",
        mr: "प्रत्येक प्रमाण त्याच्या गुणांकाने भागा: हायड्रोजन 6/2 = 3, ऑक्सिजन 2/1 = 2. ऑक्सिजन सीमित, आणि त्याचे दोन मोल 2 × 2 = 4 mol पाणी देतात, आणि 2 mol हायड्रोजन अभिक्रियेविना उरतो. (6 गृहीत धरते की विपुल अभिक्रियाकारक ठरवतो, जे नेमके उलटे.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "0.2 mol of solute is dissolved in 500 g of solvent. What is the molality, in mol/kg?",
        hi: "0.2 mol विलेय 500 g विलायक में घोला जाता है। मोललता mol/kg में क्या है?",
        mr: "0.2 mol विद्राव्य 500 g विद्रावकात विरघळवले जाते. मोललता mol/kg मध्ये किती?",
      },
      answer: 0.4,
      wrong: [100, 0.0004, 2.5],
      checkExpr: "0.2/0.5",
      solution: {
        en: "Molality is moles of solute per kilogram of SOLVENT, and 500 g is 0.5 kg, so m = 0.2/0.5 = 0.4 mol/kg. Unlike molarity this figure does not change if the flask is warmed, because mass does not expand. (2.5 inverts the ratio.)",
        hi: "मोललता प्रति किलोग्राम विलायक विलेय के मोल है, और 500 g = 0.5 kg, अतः m = 0.2/0.5 = 0.4 mol/kg. मोलरता के विपरीत यह आँकड़ा फ़्लास्क गरम करने पर नहीं बदलता, क्योंकि द्रव्यमान फैलता नहीं। (2.5 अनुपात उलट देता है।)",
        mr: "मोललता म्हणजे प्रति किलोग्रॅम विद्रावक विद्राव्याचे मोल, आणि 500 g = 0.5 kg, म्हणून m = 0.2/0.5 = 0.4 mol/kg. मोलरतेच्या उलट हा आकडा फ्लास्क तापवल्यावर बदलत नाही, कारण वस्तुमान प्रसरण पावत नाही. (2.5 गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In carbon monoxide 12 g of carbon combines with 16 g of oxygen. In carbon dioxide the same 12 g of carbon combines with how many grams of oxygen?",
        hi: "कार्बन मोनोऑक्साइड में 12 g कार्बन 16 g ऑक्सीजन से जुड़ता है। कार्बन डाइऑक्साइड में वही 12 g कार्बन कितने ग्राम ऑक्सीजन से जुड़ता है?",
        mr: "कार्बन मोनॉक्साइडमध्ये 12 g कार्बन 16 g ऑक्सिजनशी जुळतो. कार्बन डायऑक्साइडमध्ये तोच 12 g कार्बन किती ग्रॅम ऑक्सिजनशी जुळतो?",
      },
      answer: 32,
      wrong: [16, 8, 48],
      checkExpr: "16*2",
      fmt: grams,
      solution: {
        en: "Carbon dioxide has twice as many oxygen atoms per carbon, so 16 × 2 = 32 g. The masses combining with a fixed 12 g of carbon are therefore in the ratio 16 : 32 = 1 : 2 — a small whole-number ratio, which is the law of multiple proportions and the earliest hard evidence that matter comes in indivisible units. (48 would need three oxygens, which no oxide of carbon has.)",
        hi: "कार्बन डाइऑक्साइड में प्रति कार्बन दुगुने ऑक्सीजन परमाणु हैं, अतः 16 × 2 = 32 g. नियत 12 g कार्बन से जुड़ते द्रव्यमान इसलिए 16 : 32 = 1 : 2 के अनुपात में हैं — छोटा पूर्णांक अनुपात, जो गुणित अनुपात का नियम है और यह सबसे आरंभिक कठोर प्रमाण कि द्रव्य अविभाज्य इकाइयों में आता है। (48 के लिए तीन ऑक्सीजन चाहिए, जो कार्बन के किसी ऑक्साइड में नहीं।)",
        mr: "कार्बन डायऑक्साइडमध्ये प्रति कार्बन दुप्पट ऑक्सिजन अणू, म्हणून 16 × 2 = 32 g. ठरलेल्या 12 g कार्बनशी जुळणारी वस्तुमाने म्हणून 16 : 32 = 1 : 2 या गुणोत्तरात — लहान पूर्णांक गुणोत्तर, जो गुणित प्रमाणाचा नियम आणि द्रव्य अविभाज्य एककांत येते याचा सर्वांत सुरुवातीचा ठोस पुरावा. (48 साठी तीन ऑक्सिजन लागतील, जे कार्बनच्या कोणत्याही ऑक्साइडमध्ये नाहीत.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "100 mL of a 2 M solution is diluted with water to a final volume of 500 mL. What is the new molarity, in mol/L?",
        hi: "2 M विलयन के 100 mL को पानी से पतला करके अंतिम आयतन 500 mL किया जाता है। नई मोलरता mol/L में क्या है?",
        mr: "2 M द्रावणाचे 100 mL पाण्याने पातळ करून अंतिम घनफळ 500 mL केले जाते. नवी मोलरता mol/L मध्ये किती?",
      },
      answer: 0.4,
      wrong: [10, 0.2, 4],
      checkExpr: "2*100/500",
      solution: {
        en: "Adding water changes the volume and not the number of moles, so M₁V₁ = M₂V₂ and M₂ = 2 × 100/500 = 0.4 mol/L. The 0.2 mol of solute present at the start is still there; it is simply spread through five times the volume. Note that the amount of water ADDED never entered the calculation — only the final volume matters, which is why dilutions are made up to a mark rather than by measuring out the diluent. (10 inverts the volume ratio.)",
        hi: "पानी जोड़ने से आयतन बदलता है, मोलों की संख्या नहीं, अतः M₁V₁ = M₂V₂ और M₂ = 2 × 100/500 = 0.4 mol/L. आरंभ में मौजूद 0.2 mol विलेय अब भी वहीं है; वह बस पाँच गुना आयतन में फैल गया। ध्यान दो जोड़े गए पानी की मात्रा गणना में कभी आई ही नहीं — मायने रखता है केवल अंतिम आयतन, इसीलिए तनुकरण निशान तक बनाए जाते हैं, तनुकारक नापकर नहीं। (10 आयतन-अनुपात उलट देता है।)",
        mr: "पाणी जोडल्याने घनफळ बदलते, मोलांची संख्या नाही, म्हणून M₁V₁ = M₂V₂ आणि M₂ = 2 × 100/500 = 0.4 mol/L. सुरुवातीला उपस्थित 0.2 mol विद्राव्य अजूनही तिथेच; ते फक्त पाचपट घनफळात पसरले. लक्षात घ्या जोडलेल्या पाण्याचे प्रमाण गणनेत कधी आलेच नाही — महत्त्वाचे केवळ अंतिम घनफळ, म्हणूनच विरळीकरणे खुणेपर्यंत बनवली जातात, विरळक मोजून नव्हे. (10 घनफळ-गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A reaction should theoretically yield 44 g of carbon dioxide, but only 33 g is collected. What is the percentage yield?",
        hi: "किसी अभिक्रिया से सैद्धांतिक रूप से 44 g कार्बन डाइऑक्साइड मिलनी चाहिए, पर केवल 33 g एकत्र होती है। प्रतिशत लब्धि क्या है?",
        mr: "एका अभिक्रियेतून सैद्धांतिकदृष्ट्या 44 g कार्बन डायऑक्साइड मिळायला हवा, पण केवळ 33 g गोळा होतो. शेकडा उत्पन्न किती?",
      },
      answer: 75,
      wrong: [133.333333, 25, 11],
      checkExpr: "100*33/44",
      solution: {
        en: "Percentage yield is 100 × actual/theoretical = 100 × 33/44 = 75 per cent. The theoretical figure is what the limiting reagent permits if every molecule reacts and nothing is lost; the actual figure is what reaches the collection vessel. The shortfall has three usual causes, and distinguishing them is what improving a process means. Some reactions are reversible and reach equilibrium before completion. Some reactants take a side path and make something else. And some product is simply lost in handling — left in the flask, dissolved in the washings, evaporated during drying. Note that a yield above 100 per cent is not a triumph but a warning: it means the product was weighed while still wet or contaminated, since no reaction can produce more atoms than were put in. That is why 133.333333, the inverted ratio, is a diagnostic rather than an answer. Note also that the percentage yield says nothing at all about how FAST the reaction went; a reaction can have a superb yield and take a week, or be over in seconds with half the product lost, and industry has to optimise both separately. (25 quotes the fraction lost rather than the fraction obtained.)",
        hi: "प्रतिशत लब्धि 100 × वास्तविक/सैद्धांतिक = 100 × 33/44 = 75 प्रतिशत है। सैद्धांतिक आँकड़ा वह है जो सीमांत अभिकारक तब देता जब हर अणु अभिक्रिया करे और कुछ न खोए; वास्तविक आँकड़ा वह जो संग्रह-पात्र तक पहुँचे। कमी के तीन सामान्य कारण हैं, और उन्हें अलग करना ही प्रक्रिया सुधारना है। कुछ अभिक्रियाएँ उत्क्रमणीय हैं और पूरी होने से पहले साम्य पर पहुँच जाती हैं। कुछ अभिकारक बग़ल का रास्ता लेकर कुछ और बना देते हैं। और कुछ उत्पाद बस सँभालने में खो जाता है — फ़्लास्क में छूटा, धोवन में घुला, सुखाते समय उड़ा। ध्यान दो 100 प्रतिशत से ऊपर की लब्धि विजय नहीं बल्कि चेतावनी है: उसका अर्थ है कि उत्पाद गीला या अशुद्ध रहते तौला गया, क्योंकि कोई अभिक्रिया डाले गए से अधिक परमाणु नहीं बना सकती। इसीलिए 133.333333, उलटा अनुपात, उत्तर नहीं बल्कि निदान है। यह भी ध्यान दो कि प्रतिशत लब्धि इस बारे में कुछ नहीं कहती कि अभिक्रिया कितनी तेज़ चली; अभिक्रिया की लब्धि शानदार हो सकती और उसे हफ़्ता लग सकता है, या वह सेकंडों में ख़त्म हो सकती और आधा उत्पाद खो सकता है, और उद्योग को दोनों अलग-अलग साधने पड़ते हैं। (25 प्राप्त अंश के बजाय खोया अंश बता देता है।)",
        mr: "शेकडा उत्पन्न 100 × प्रत्यक्ष/सैद्धांतिक = 100 × 33/44 = 75 टक्के. सैद्धांतिक आकडा तो जो सीमित अभिक्रियाकारक तेव्हा देईल जेव्हा प्रत्येक रेणू अभिक्रिया करेल आणि काहीही हरवणार नाही; प्रत्यक्ष आकडा तो जो संकलन-भांड्यापर्यंत पोहोचतो. तुटीची तीन नेहमीची कारणे, आणि ती वेगळी करणे म्हणजेच प्रक्रिया सुधारणे. काही अभिक्रिया उलटवण्याजोग्या आणि पूर्ण होण्याआधी समतोलावर पोहोचतात. काही अभिक्रियाकारक बाजूची वाट घेऊन दुसरे काहीतरी बनवतात. आणि काही उत्पाद फक्त हाताळण्यात हरवते — फ्लास्कमध्ये उरलेले, धुण्याच्या पाण्यात विरघळलेले, सुकवताना उडालेले. लक्षात घ्या 100 टक्क्यांहून अधिक उत्पन्न हा विजय नव्हे तर इशारा: त्याचा अर्थ उत्पाद ओले वा अशुद्ध असतानाच तोलले गेले, कारण कोणतीही अभिक्रिया टाकल्याहून अधिक अणू बनवू शकत नाही. म्हणूनच 133.333333, उलटे गुणोत्तर, हे उत्तर नव्हे तर निदान. हेही लक्षात घ्या की शेकडा उत्पन्न अभिक्रिया किती वेगाने चालली याबद्दल काहीही सांगत नाही; अभिक्रियेचे उत्पन्न उत्कृष्ट असू शकते आणि तिला आठवडा लागू शकतो, वा ती सेकंदांत संपू शकते आणि अर्धे उत्पाद हरवू शकते, आणि उद्योगाला दोन्ही स्वतंत्रपणे साधावी लागतात. (25 मिळालेल्या अंशाऐवजी हरवलेला अंश सांगते.)",
      },
    },
  ],
  "chemistry-11-structure-of-atom": [
    {
      level: 1,
      stem: {
        en: "The maximum number of electrons a shell can hold is 2n². How many can the third shell hold?",
        hi: "किसी कोश में अधिकतम इलेक्ट्रॉनों की संख्या 2n² है। तीसरा कोश कितने रख सकता है?",
        mr: "एका कवचात कमाल इलेक्ट्रॉनांची संख्या 2n² आहे. तिसरे कवच किती ठेवू शकते?",
      },
      answer: 18,
      wrong: [6, 9, 32],
      checkExpr: "2*3^2",
      solution: {
        en: "2n² with n = 3 gives 2 × 9 = 18. The formula is not arbitrary: it counts the permitted combinations of the four quantum numbers within that shell. (6 forgets to square n and 32 uses n = 4.)",
        hi: "n = 3 पर 2n² देता है 2 × 9 = 18. सूत्र मनमाना नहीं: वह उस कोश के भीतर चार क्वांटम संख्याओं के अनुमत संयोजन गिनता है। (6 n का वर्ग करना भूलता है और 32 n = 4 लगाता है।)",
        mr: "n = 3 वर 2n² देते 2 × 9 = 18. सूत्र मनमानी नाही: ते त्या कवचातील चार पुंज संख्यांची परवानगी असलेली संयोजने मोजते. (6 n चा वर्ग करायचे विसरते आणि 32 हे n = 4 वापरते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A subshell has orbital quantum number l = 2. The number of orbitals in it is 2l + 1. How many orbitals are there?",
        hi: "किसी उपकोश की कक्षक क्वांटम संख्या l = 2 है। उसमें कक्षकों की संख्या 2l + 1 है। कितने कक्षक हैं?",
        mr: "एका उपकवचाची कक्षक पुंज संख्या l = 2 आहे. त्यात कक्षकांची संख्या 2l + 1 आहे. किती कक्षके आहेत?",
      },
      answer: 5,
      wrong: [3, 7, 10],
      checkExpr: "2*2+1",
      solution: {
        en: "2 × 2 + 1 = 5, which is the d subshell — five orbitals, each able to hold two electrons, so ten in all. (3 is the p subshell with l = 1, and 10 is the electron capacity rather than the orbital count.)",
        hi: "2 × 2 + 1 = 5, जो d उपकोश है — पाँच कक्षक, हर एक दो इलेक्ट्रॉन रख सकने वाला, अतः कुल दस। (3 l = 1 वाला p उपकोश है, और 10 कक्षकों की गिनती नहीं बल्कि इलेक्ट्रॉन-क्षमता है।)",
        mr: "2 × 2 + 1 = 5, जे d उपकवच — पाच कक्षके, प्रत्येक दोन इलेक्ट्रॉन ठेवू शकणारे, म्हणून एकूण दहा. (3 हे l = 1 चे p उपकवच, आणि 10 ही कक्षकांची मोजणी नव्हे तर इलेक्ट्रॉन-क्षमता.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "How many electrons can a d subshell hold in total?",
        hi: "एक d उपकोश कुल कितने इलेक्ट्रॉन रख सकता है?",
        mr: "एक d उपकवच एकूण किती इलेक्ट्रॉन ठेवू शकते?",
      },
      answer: 10,
      wrong: [6, 14, 5],
      checkExpr: "2*(2*2+1)",
      solution: {
        en: "A d subshell has l = 2, so 2l + 1 = 5 orbitals, and Pauli's principle allows two electrons per orbital: 2 × 5 = 10. That ten is why the transition-metal block is ten columns wide. (6 is the p subshell and 14 the f.)",
        hi: "d उपकोश का l = 2 है, अतः 2l + 1 = 5 कक्षक, और पॉली का सिद्धांत प्रति कक्षक दो इलेक्ट्रॉन देता है: 2 × 5 = 10. वही दस है जिससे संक्रमण-धातु खंड दस स्तंभ चौड़ा है। (6 p उपकोश है और 14 f.)",
        mr: "d उपकवचाचा l = 2, म्हणून 2l + 1 = 5 कक्षके, आणि पौलीचे तत्त्व प्रति कक्षक दोन इलेक्ट्रॉन देते: 2 × 5 = 10. तेच दहा ज्यामुळे संक्रमण-धातू गट दहा स्तंभ रुंद. (6 हे p उपकवच आणि 14 हे f.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "In Bohr's model the energy of the nth level in hydrogen is −13.6/n² eV. What is the magnitude of the energy of the second level, in eV?",
        hi: "बोर के निदर्श में हाइड्रोजन के nवें स्तर की ऊर्जा −13.6/n² eV है। दूसरे स्तर की ऊर्जा का परिमाण eV में क्या है?",
        mr: "बोरच्या प्रतिरूपात हायड्रोजनच्या nव्या पातळीची ऊर्जा −13.6/n² eV आहे. दुसऱ्या पातळीच्या ऊर्जेचे परिमाण eV मध्ये किती?",
      },
      answer: 3.4,
      wrong: [6.8, 27.2, 1.7],
      checkExpr: "13.6/2^2",
      solution: {
        en: "13.6/4 = 3.4 eV. The levels crowd together as n rises, converging on zero at infinity — which is the ionisation limit, and 13.6 eV is therefore exactly the energy needed to strip the electron from the ground state. (6.8 divides by 2 rather than by 2².)",
        hi: "13.6/4 = 3.4 eV. n बढ़ने पर स्तर पास-पास सिमटते हैं, अनंत पर शून्य की ओर अभिसरित — वही आयनन सीमा है, और इसलिए 13.6 eV ठीक वह ऊर्जा है जो मूल अवस्था से इलेक्ट्रॉन छीनने को चाहिए। (6.8 2² के बजाय 2 से भाग देता है।)",
        mr: "13.6/4 = 3.4 eV. n वाढताना पातळ्या जवळजवळ येतात, अनंतावर शून्याकडे अभिसरत — तीच आयनीकरण मर्यादा, आणि म्हणून 13.6 eV ही नेमकी ती ऊर्जा जी मूळ अवस्थेतून इलेक्ट्रॉन हिरावायला लागते. (6.8 हे 2² ऐवजी 2 ने भागते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "In Bohr's model the radius of the nth orbit is 0.529n² Å. What is the radius of the third orbit, in Å?",
        hi: "बोर के निदर्श में nवीं कक्षा की त्रिज्या 0.529n² Å है। तीसरी कक्षा की त्रिज्या Å में क्या है?",
        mr: "बोरच्या प्रतिरूपात nव्या कक्षेची त्रिज्या 0.529n² Å आहे. तिसऱ्या कक्षेची त्रिज्या Å मध्ये किती?",
      },
      answer: 4.761,
      wrong: [1.587, 0.058778, 15.87],
      checkExpr: "0.529*3^2",
      solution: {
        en: "0.529 × 9 = 4.761 Å. The orbits spread out as n², so the atom grows rapidly in excited states — an electron in the n = 10 level sits a hundred times further out than in the ground state. (1.587 multiplies by n instead of n².)",
        hi: "0.529 × 9 = 4.761 Å. कक्षाएँ n² के अनुसार फैलती हैं, अतः उत्तेजित अवस्थाओं में परमाणु तेज़ी से बड़ा होता है — n = 10 स्तर का इलेक्ट्रॉन मूल अवस्था से सौ गुना बाहर बैठता है। (1.587 n² के बजाय n से गुणा करता है।)",
        mr: "0.529 × 9 = 4.761 Å. कक्षा n² नुसार पसरतात, म्हणून उत्तेजित अवस्थांत अणू झपाट्याने मोठा होतो — n = 10 पातळीचा इलेक्ट्रॉन मूळ अवस्थेहून शंभरपट बाहेर बसतो. (1.587 हे n² ऐवजी n ने गुणते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A photon's energy in electronvolts is 1240 divided by its wavelength in nanometres. What is the energy of a 620 nm photon, in eV?",
        hi: "किसी फ़ोटॉन की इलेक्ट्रॉनवोल्ट में ऊर्जा 1240 बटा उसका नैनोमीटर में तरंगदैर्घ्य है। 620 nm फ़ोटॉन की ऊर्जा eV में क्या है?",
        mr: "एका फोटॉनची इलेक्ट्रॉनव्होल्टमधील ऊर्जा 1240 भागिले त्याची नॅनोमीटरमधील तरंगलांबी. 620 nm फोटॉनची ऊर्जा eV मध्ये किती?",
      },
      answer: 2,
      wrong: [0.5, 620, 1240],
      checkExpr: "1240/620",
      solution: {
        en: "1240/620 = 2 eV, an orange-red photon. The inverse relation means blue light carries roughly twice the energy per photon of red, which is the whole reason ultraviolet damages skin and infrared merely warms it. (0.5 inverts the ratio.)",
        hi: "1240/620 = 2 eV, नारंगी-लाल फ़ोटॉन। व्युत्क्रम संबंध का अर्थ है कि नीला प्रकाश प्रति फ़ोटॉन लाल से मोटे तौर पर दुगुनी ऊर्जा ढोता है, और पराबैंगनी त्वचा को नुक़सान पहुँचाता तथा अवरक्त बस गरमाता है, इसका पूरा कारण यही है। (0.5 अनुपात उलट देता है।)",
        mr: "1240/620 = 2 eV, नारिंगी-लाल फोटॉन. व्यस्त संबंधाचा अर्थ असा की निळा प्रकाश प्रति फोटॉन लालच्या ढोबळमानाने दुप्पट ऊर्जा वाहतो, आणि अतिनील त्वचेला हानी पोहोचवतो तर अवरक्त फक्त उबदार करतो, याचे अख्खे कारण हेच. (0.5 गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A metal has a work function of 2 eV and is lit by photons of energy 5 eV. What is the maximum kinetic energy of the ejected electrons, in eV?",
        hi: "किसी धातु का कार्य-फलन 2 eV है और उस पर 5 eV ऊर्जा के फ़ोटॉन डाले जाते हैं। निकले इलेक्ट्रॉनों की अधिकतम गतिज ऊर्जा eV में क्या है?",
        mr: "एका धातूचे कार्यफलन 2 eV आहे आणि त्यावर 5 eV ऊर्जेचे फोटॉन टाकले जातात. बाहेर पडलेल्या इलेक्ट्रॉनांची कमाल गतिज ऊर्जा eV मध्ये किती?",
      },
      answer: 3,
      wrong: [7, 2.5, 10],
      checkExpr: "5-2",
      solution: {
        en: "KE_max = hν − φ = 5 − 2 = 3 eV. It is a maximum because electrons deeper in the metal lose more than the minimum on their way out. Making the light brighter increases the number of such electrons and leaves this figure untouched. (7 adds the work function instead of subtracting it.)",
        hi: "KE_अधिकतम = hν − φ = 5 − 2 = 3 eV. यह अधिकतम इसलिए है कि धातु के भीतर गहरे इलेक्ट्रॉन बाहर आते हुए न्यूनतम से अधिक खोते हैं। प्रकाश तेज़ करने से ऐसे इलेक्ट्रॉनों की संख्या बढ़ती है और यह आँकड़ा अछूता रहता है। (7 कार्य-फलन घटाने के बजाय जोड़ देता है।)",
        mr: "KE_कमाल = hν − φ = 5 − 2 = 3 eV. हे कमाल यासाठी की धातूत खोल असलेले इलेक्ट्रॉन बाहेर येताना किमानाहून अधिक गमावतात. प्रकाश तेजस्वी केल्याने अशा इलेक्ट्रॉनांची संख्या वाढते आणि हा आकडा अस्पर्श राहतो. (7 कार्यफलन वजा करण्याऐवजी जोडते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A metal's work function is 2 eV. Using E(eV) = 1240/λ(nm), what is its threshold wavelength, in nm?",
        hi: "किसी धातु का कार्य-फलन 2 eV है। E(eV) = 1240/λ(nm) लगाते हुए, उसका देहली तरंगदैर्घ्य nm में क्या है?",
        mr: "एका धातूचे कार्यफलन 2 eV आहे. E(eV) = 1240/λ(nm) वापरून, त्याची उंबरठा तरंगलांबी nm मध्ये किती?",
      },
      answer: 620,
      wrong: [2480, 310, 1240],
      checkExpr: "1240/2",
      solution: {
        en: "λ_threshold = 1240/2 = 620 nm, in the orange. Any light of shorter wavelength than this ejects electrons and any of longer wavelength does not, however intense — so this metal responds to blue, green and yellow but is blind to deep red and to all infrared. Note the direction: a LOWER work function means a LONGER threshold wavelength and a metal that is easier to trigger. (2480 multiplies and 310 halves the answer.)",
        hi: "λ_देहली = 1240/2 = 620 nm, नारंगी में। इससे छोटे तरंगदैर्घ्य का कोई भी प्रकाश इलेक्ट्रॉन निकालता है और बड़े तरंगदैर्घ्य का कोई नहीं, चाहे कितना ही तीव्र हो — अतः यह धातु नीले, हरे और पीले पर प्रतिक्रिया देती है पर गहरे लाल तथा सारे अवरक्त के प्रति अंधी है। दिशा पर ध्यान दो: कम कार्य-फलन का अर्थ है लंबा देहली तरंगदैर्घ्य और ऐसी धातु जिसे चलाना आसान है। (2480 गुणा करता है और 310 उत्तर आधा कर देता है।)",
        mr: "λ_उंबरठा = 1240/2 = 620 nm, नारिंगीत. याहून लहान तरंगलांबीचा कोणताही प्रकाश इलेक्ट्रॉन काढतो आणि मोठ्या तरंगलांबीचा कोणीही नाही, तो कितीही तीव्र असो — म्हणून ही धातू निळ्या, हिरव्या आणि पिवळ्याला प्रतिसाद देते पण गडद लाल आणि सर्व अवरक्ताबाबत आंधळी. दिशेकडे लक्ष द्या: कमी कार्यफलन म्हणजे लांब उंबरठा तरंगलांबी आणि चालवायला सोपी धातू. (2480 गुणते आणि 310 उत्तर निम्मे करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "The number of orbitals in a shell is n². How many orbitals are there in the shell with n = 4?",
        hi: "किसी कोश में कक्षकों की संख्या n² है। n = 4 वाले कोश में कितने कक्षक हैं?",
        mr: "एका कवचात कक्षकांची संख्या n² आहे. n = 4 असलेल्या कवचात किती कक्षके आहेत?",
      },
      answer: 16,
      wrong: [32, 8, 4],
      checkExpr: "4^2",
      solution: {
        en: "n² = 16 orbitals: one 4s, three 4p, five 4d and seven 4f, and 1 + 3 + 5 + 7 = 16. Each holds two electrons, giving the 2n² = 32 that the shell can accommodate. Notice how the two formulae are related — the electron capacity is simply twice the orbital count, and the factor of two is Pauli's principle and nothing else. (32 quotes the electron capacity as though the question had asked for it.)",
        hi: "n² = 16 कक्षक: एक 4s, तीन 4p, पाँच 4d और सात 4f, और 1 + 3 + 5 + 7 = 16. हर एक दो इलेक्ट्रॉन रखता है, जिससे कोश की 2n² = 32 क्षमता बनती है। ध्यान दो दोनों सूत्र कैसे जुड़े हैं — इलेक्ट्रॉन-क्षमता बस कक्षकों की गिनती की दुगुनी है, और दो का गुणक पॉली का सिद्धांत है और कुछ नहीं। (32 इलेक्ट्रॉन-क्षमता बता देता है मानो प्रश्न ने वही माँगी हो।)",
        mr: "n² = 16 कक्षके: एक 4s, तीन 4p, पाच 4d आणि सात 4f, आणि 1 + 3 + 5 + 7 = 16. प्रत्येक दोन इलेक्ट्रॉन ठेवते, ज्यातून कवचाची 2n² = 32 क्षमता बनते. लक्षात घ्या दोन्ही सूत्रे कशी जोडलेली — इलेक्ट्रॉन-क्षमता फक्त कक्षकांच्या मोजणीच्या दुप्पट, आणि दोनचा गुणक म्हणजे पौलीचे तत्त्व आणि दुसरे काहीही नाही. (32 इलेक्ट्रॉन-क्षमता सांगते जणू प्रश्नाने तीच मागितली असावी.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "An atom in its ground state has the configuration 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰. What is its atomic number?",
        hi: "मूल अवस्था में किसी परमाणु का विन्यास 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰ है। उसका परमाणु क्रमांक क्या है?",
        mr: "मूळ अवस्थेतील एका अणूचा विन्यास 1s²2s²2p⁶3s²3p⁶4s²3d¹⁰ आहे. त्याचा अणुक्रमांक किती?",
      },
      answer: 30,
      wrong: [28, 26, 36],
      checkExpr: "2+2+6+2+6+2+10",
      solution: {
        en: "Adding the superscripts: 2 + 2 + 6 + 2 + 6 + 2 + 10 = 30, which is zinc. Two things in the configuration are worth reading rather than just counting. First, 4s appears before 3d, which looks wrong until the Aufbau rule is recalled: subshells fill in order of n + l, and 4 + 0 = 4 beats 3 + 2 = 5. The shell number alone does not decide. Second, the d subshell is full at ten, which is why zinc closes the first transition series and why it behaves so much less like a transition metal than the elements before it — a filled d shell is stable and largely uninvolved in bonding, so zinc shows essentially one oxidation state where iron and copper show several. There is a further subtlety worth knowing. Once the 3d subshell begins to fill, its energy drops below that of 4s, so a zinc ION loses its 4s electrons first and not its 3d ones: Zn²⁺ is 3d¹⁰ and not 4s²3d⁸. The filling order and the removal order are different, and confusing them is the commonest error in transition-metal chemistry. (28 and 26 count nickel and iron, and 36 is krypton's total.)",
        hi: "अधोलेख जोड़ो: 2 + 2 + 6 + 2 + 6 + 2 + 10 = 30, जो ज़िंक है। विन्यास में दो बातें केवल गिनने के बजाय पढ़ने योग्य हैं। पहली, 4s, 3d से पहले आता है, जो ग़लत दिखता है जब तक ऑफ़बाउ नियम याद न आए: उपकोश n + l के क्रम में भरते हैं, और 4 + 0 = 4, 3 + 2 = 5 को हरा देता है। अकेला कोश-अंक तय नहीं करता। दूसरी, d उपकोश दस पर भरा है, इसीलिए ज़िंक पहली संक्रमण श्रेणी बंद करता है और इसीलिए वह अपने से पहले के तत्वों की तुलना में संक्रमण धातु जैसा कहीं कम व्यवहार करता है — भरा d कोश स्थिर है और आबंधन में अधिकतर अनुपस्थित, अतः ज़िंक मूलतः एक ही ऑक्सीकरण अवस्था दिखाता है जहाँ लोहा और कॉपर कई दिखाते हैं। एक और सूक्ष्मता जानने योग्य है। 3d उपकोश भरना शुरू होते ही उसकी ऊर्जा 4s से नीचे गिर जाती है, अतः ज़िंक का आयन पहले अपने 4s इलेक्ट्रॉन खोता है, 3d नहीं: Zn²⁺ 3d¹⁰ है, 4s²3d⁸ नहीं। भरण-क्रम और निष्कासन-क्रम भिन्न हैं, और उन्हें गड्डमड्ड करना संक्रमण-धातु रसायन की सबसे आम भूल है। (28 और 26 निकल तथा लोहा गिनते हैं, और 36 क्रिप्टॉन का कुल है।)",
        mr: "अधोलेख जोडा: 2 + 2 + 6 + 2 + 6 + 2 + 10 = 30, जे जस्त. विन्यासातील दोन गोष्टी केवळ मोजण्याऐवजी वाचण्याजोग्या. पहिली, 4s हे 3d च्या आधी येते, जे चुकीचे दिसते जोवर ऑफबाऊ नियम आठवत नाही: उपकवचे n + l च्या क्रमाने भरतात, आणि 4 + 0 = 4 हे 3 + 2 = 5 ला हरवते. एकटा कवच-अंक ठरवत नाही. दुसरी, d उपकवच दहावर भरलेले, म्हणूनच जस्त पहिली संक्रमण मालिका बंद करते आणि म्हणूनच ते त्याच्या आधीच्या मूलद्रव्यांच्या तुलनेत संक्रमण धातूसारखे कितीतरी कमी वागते — भरलेले d कवच स्थिर आणि बंधनात बहुतांश अनुपस्थित, म्हणून जस्त मुळात एकच ऑक्सिडीकरण अवस्था दाखवते जिथे लोखंड आणि तांबे अनेक दाखवतात. आणखी एक सूक्ष्मता जाणण्याजोगी. 3d उपकवच भरणे सुरू होताच त्याची ऊर्जा 4s हून खाली येते, म्हणून जस्ताचा आयन आधी आपले 4s इलेक्ट्रॉन गमावतो, 3d नव्हे: Zn²⁺ हे 3d¹⁰ आहे, 4s²3d⁸ नव्हे. भरण-क्रम आणि काढून टाकण्याचा क्रम वेगळे, आणि त्यांची गल्लत ही संक्रमण-धातू रसायनातील सर्वांत नेहमीची चूक. (28 आणि 26 निकेल व लोखंड मोजतात, आणि 36 हे क्रिप्टॉनचे एकूण.)",
      },
    },
  ],
  "chemistry-11-periodicity": [
    {
      level: 1,
      stem: {
        en: "Sodium has 11 protons and a screening constant of 8.5 for its outer electron. What effective nuclear charge does that electron experience?",
        hi: "सोडियम में 11 प्रोटॉन हैं और उसके बाहरी इलेक्ट्रॉन के लिए परिरक्षण स्थिरांक 8.5 है। वह इलेक्ट्रॉन कितना प्रभावी नाभिकीय आवेश अनुभव करता है?",
        mr: "सोडियममध्ये 11 प्रोटॉन आणि त्याच्या बाहेरच्या इलेक्ट्रॉनसाठी आवरण स्थिरांक 8.5. तो इलेक्ट्रॉन किती परिणामी केंद्रकीय भार अनुभवतो?",
      },
      answer: 2.5,
      wrong: [19.5, 11, 8.5],
      checkExpr: "11-8.5",
      solution: {
        en: "Zeff = Z − S = 11 − 8.5 = 2.5. The outer electron feels less than a quarter of the nucleus's actual charge, which is why sodium gives it up so readily. (19.5 adds the screening instead of subtracting it.)",
        hi: "Zeff = Z − S = 11 − 8.5 = 2.5. बाहरी इलेक्ट्रॉन नाभिक के वास्तविक आवेश के एक चौथाई से भी कम महसूस करता है, इसीलिए सोडियम उसे इतनी तत्परता से दे देता है। (19.5 परिरक्षण घटाने के बजाय जोड़ देता है।)",
        mr: "Zeff = Z − S = 11 − 8.5 = 2.5. बाहेरचा इलेक्ट्रॉन केंद्रकाच्या प्रत्यक्ष भाराच्या एक चतुर्थांशाहूनही कमी अनुभवतो, म्हणूनच सोडियम तो इतक्या तत्परतेने देतो. (19.5 आवरण वजा करण्याऐवजी जोडते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "An element has 6 electrons in its outermost shell. How many more does it need to complete its octet?",
        hi: "किसी तत्व के बाहरी कोश में 6 इलेक्ट्रॉन हैं। अष्टक पूरा करने के लिए उसे और कितने चाहिए?",
        mr: "एका मूलद्रव्याच्या बाहेरच्या कवचात 6 इलेक्ट्रॉन आहेत. अष्टक पूर्ण करायला त्याला आणखी किती लागतील?",
      },
      answer: 2,
      wrong: [6, 8, 4],
      checkExpr: "8-6",
      solution: {
        en: "8 − 6 = 2, which is why group 16 elements typically form ions of charge −2 or two covalent bonds. (6 quotes the electrons already present rather than those still needed.)",
        hi: "8 − 6 = 2, इसीलिए वर्ग 16 के तत्व प्रायः −2 आवेश के आयन या दो सहसंयोजक बंध बनाते हैं। (6 अभी चाहिए इलेक्ट्रॉनों के बजाय पहले से मौजूद इलेक्ट्रॉन बता देता है।)",
        mr: "8 − 6 = 2, म्हणूनच गट 16 ची मूलद्रव्ये सहसा −2 भाराचे आयन वा दोन सहसंयुज बंध बनवतात. (6 अजून लागणाऱ्या इलेक्ट्रॉनांऐवजी आधीच असलेले सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Across period 2 the atomic radius falls from 152 pm for lithium to 64 pm for fluorine. By what percentage does it fall?",
        hi: "आवर्त 2 में परमाणु त्रिज्या लिथियम के 152 pm से घटकर फ़्लुओरीन की 64 pm हो जाती है। वह कितने प्रतिशत घटती है?",
        mr: "आवर्त 2 मध्ये अणुत्रिज्या लिथियमच्या 152 pm वरून फ्लोरिनच्या 64 pm पर्यंत घटते. ती किती टक्क्यांनी घटते?",
      },
      answer: 57.894737,
      wrong: [42.105263, 88, 237.5],
      checkExpr: "100*(152-64)/152",
      solution: {
        en: "100 × (152 − 64)/152 = 57.894737 per cent. Six more protons and six more electrons, and the atom ends up well under half its original size — because every one of those electrons went into the same shell. (42.105263 quotes what remains rather than what was lost.)",
        hi: "100 × (152 − 64)/152 = 57.894737 प्रतिशत। छह और प्रोटॉन तथा छह और इलेक्ट्रॉन, और परमाणु अपने मूल आकार के आधे से भी काफ़ी नीचे पहुँच जाता है — क्योंकि उनमें से हर इलेक्ट्रॉन उसी कोश में गया। (42.105263 खोए के बजाय बचे को बता देता है।)",
        mr: "100 × (152 − 64)/152 = 57.894737 टक्के. आणखी सहा प्रोटॉन आणि आणखी सहा इलेक्ट्रॉन, आणि अणू आपल्या मूळ आकाराच्या निम्म्याहूनही बराच खाली येतो — कारण त्यांतील प्रत्येक इलेक्ट्रॉन त्याच कवचात गेला. (42.105263 गमावलेल्याऐवजी उरलेले सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Sodium's first ionisation enthalpy is 496 kJ/mol and its second is 4562 kJ/mol. What is the ratio of the second to the first?",
        hi: "सोडियम की पहली आयनन एन्थैल्पी 496 kJ/mol और दूसरी 4562 kJ/mol है। दूसरी और पहली का अनुपात क्या है?",
        mr: "सोडियमची पहिली आयनीकरण एन्थाल्पी 496 kJ/mol आणि दुसरी 4562 kJ/mol. दुसरीचे पहिलीशी गुणोत्तर किती?",
      },
      answer: 9.197581,
      wrong: [0.108724, 4066, 5058],
      checkExpr: "4562/496",
      solution: {
        en: "4562/496 = 9.197581. A ninefold jump between the first and second is the signature of a group 1 element: after one electron leaves, the ion has a noble-gas configuration and the next electron must come out of a completed shell. (4066 subtracts instead of dividing.)",
        hi: "4562/496 = 9.197581. पहली और दूसरी के बीच नौ गुनी छलाँग वर्ग 1 के तत्व की पहचान है: एक इलेक्ट्रॉन जाने के बाद आयन का विन्यास उत्कृष्ट-गैस जैसा हो जाता है और अगला इलेक्ट्रॉन पूर्ण कोश से निकालना पड़ता है। (4066 भाग के बजाय घटाता है।)",
        mr: "4562/496 = 9.197581. पहिली आणि दुसरीमधली नऊपट उडी ही गट 1 च्या मूलद्रव्याची ओळख: एक इलेक्ट्रॉन गेल्यावर आयनाचा विन्यास निष्क्रिय-वायूसारखा होतो आणि पुढचा इलेक्ट्रॉन पूर्ण कवचातून काढावा लागतो. (4066 भागण्याऐवजी वजा करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A magnesium atom has 12 protons and 12 electrons. How many electrons does the Mg²⁺ ion have?",
        hi: "मैग्नीशियम परमाणु में 12 प्रोटॉन और 12 इलेक्ट्रॉन हैं। Mg²⁺ आयन में कितने इलेक्ट्रॉन हैं?",
        mr: "मॅग्नेशियम अणूत 12 प्रोटॉन आणि 12 इलेक्ट्रॉन आहेत. Mg²⁺ आयनात किती इलेक्ट्रॉन आहेत?",
      },
      answer: 10,
      wrong: [14, 12, 2],
      checkExpr: "12-2",
      solution: {
        en: "A 2+ charge means two electrons have been lost: 12 − 2 = 10, the neon configuration. The ion is much smaller than the atom, because the same 12 protons now pull on only 10 electrons. (14 adds the charge instead of subtracting it, which would describe an anion.)",
        hi: "2+ आवेश का अर्थ है दो इलेक्ट्रॉन खो गए: 12 − 2 = 10, निऑन का विन्यास। आयन परमाणु से कहीं छोटा है, क्योंकि वही 12 प्रोटॉन अब केवल 10 इलेक्ट्रॉनों को खींचते हैं। (14 आवेश घटाने के बजाय जोड़ देता है, जो ऋणायन का वर्णन होता।)",
        mr: "2+ भाराचा अर्थ दोन इलेक्ट्रॉन गमावले: 12 − 2 = 10, निऑनचा विन्यास. आयन अणूहून कितीतरी लहान, कारण तेच 12 प्रोटॉन आता केवळ 10 इलेक्ट्रॉनांना ओढतात. (14 भार वजा करण्याऐवजी जोडते, जे ऋणायनाचे वर्णन ठरले असते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Bromine's configuration ends 4s²4p⁵. How many electrons does it have in the n = 4 shell?",
        hi: "ब्रोमीन का विन्यास 4s²4p⁵ पर समाप्त होता है। n = 4 कोश में उसके कितने इलेक्ट्रॉन हैं?",
        mr: "ब्रोमिनचा विन्यास 4s²4p⁵ वर संपतो. n = 4 कवचात त्याचे किती इलेक्ट्रॉन आहेत?",
      },
      answer: 7,
      wrong: [17, 5, 18],
      checkExpr: "2+5",
      solution: {
        en: "2 + 5 = 7, which is the group 17 count and explains why bromine needs one electron to complete its octet. Note the 3d¹⁰ electrons are not counted: they are in the n = 3 shell, filled after 4s but belonging to the shell below. (17 quotes the group number.)",
        hi: "2 + 5 = 7, जो वर्ग 17 की गिनती है और समझाती है कि ब्रोमीन को अष्टक पूरा करने के लिए एक इलेक्ट्रॉन क्यों चाहिए। ध्यान दो 3d¹⁰ इलेक्ट्रॉन नहीं गिने जाते: वे n = 3 कोश में हैं, 4s के बाद भरे पर नीचे वाले कोश के। (17 वर्ग-अंक बता देता है।)",
        mr: "2 + 5 = 7, जी गट 17 ची मोजणी आणि ब्रोमिनला अष्टक पूर्ण करायला एक इलेक्ट्रॉन का लागतो हे समजावते. लक्षात घ्या 3d¹⁰ इलेक्ट्रॉन मोजले जात नाहीत: ते n = 3 कवचात, 4s नंतर भरलेले पण खालच्या कवचाचे. (17 गट-अंक सांगते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "An element's first ionisation enthalpy is 738 kJ/mol. Taking 1 eV per atom as 96.5 kJ/mol, what is the value in eV per atom?",
        hi: "किसी तत्व की पहली आयनन एन्थैल्पी 738 kJ/mol है। प्रति परमाणु 1 eV को 96.5 kJ/mol लेते हुए, यह मान प्रति परमाणु eV में क्या है?",
        mr: "एका मूलद्रव्याची पहिली आयनीकरण एन्थाल्पी 738 kJ/mol आहे. प्रति अणू 1 eV हे 96.5 kJ/mol घेतल्यास, हे मूल्य प्रति अणू eV मध्ये किती?",
      },
      answer: 7.647668,
      wrong: [71217, 96.5, 0.130759],
      checkExpr: "738/96.5",
      solution: {
        en: "738/96.5 = 7.647668 eV. The two units answer different questions: kJ/mol is what a chemist weighs out in the laboratory and eV is what a single atom experiences, and the conversion is simply Avogadro's number in disguise. (71217 multiplies instead of dividing.)",
        hi: "738/96.5 = 7.647668 eV. दोनों मात्रक भिन्न प्रश्नों के उत्तर देते हैं: kJ/mol वह है जो रसायनज्ञ प्रयोगशाला में तौलता है और eV वह जो अकेला परमाणु अनुभव करता है, और रूपांतरण बस भेस बदले आवोगाद्रो संख्या है। (71217 भाग के बजाय गुणा करता है।)",
        mr: "738/96.5 = 7.647668 eV. दोन्ही एकके वेगळ्या प्रश्नांची उत्तरे देतात: kJ/mol हे रसायनशास्त्रज्ञ प्रयोगशाळेत तोलतो ते आणि eV हे एकटा अणू अनुभवतो ते, आणि रूपांतर म्हणजे फक्त वेष बदललेला आवोगाद्रो आकडा. (71217 भागण्याऐवजी गुणते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "On the Pauling scale sodium is 0.9 and chlorine is 3.0. What is the electronegativity difference in sodium chloride?",
        hi: "पॉलिंग पैमाने पर सोडियम 0.9 और क्लोरीन 3.0 है। सोडियम क्लोराइड में विद्युत्-ऋणात्मकता अंतर क्या है?",
        mr: "पॉलिंग मापनश्रेणीवर सोडियम 0.9 आणि क्लोरिन 3.0. सोडियम क्लोराइडमधील विद्युतऋणता फरक किती?",
      },
      answer: 2.1,
      wrong: [3.9, 2.7, 1.2],
      checkExpr: "3.0-0.9",
      solution: {
        en: "3.0 − 0.9 = 2.1, comfortably above the rough 1.7 mark, so the bond is largely ionic — which matches sodium chloride's high melting point and its conduction when molten. (3.9 adds the two values and 2.7 multiplies them.)",
        hi: "3.0 − 0.9 = 2.1, जो मोटे 1.7 के निशान से आराम से ऊपर है, अतः बंध अधिकतर आयनिक है — जो सोडियम क्लोराइड के ऊँचे गलनांक और पिघली अवस्था में उसके चालन से मेल खाता है। (3.9 दोनों मान जोड़ता है और 2.7 उन्हें गुणा करता है।)",
        mr: "3.0 − 0.9 = 2.1, जे ढोबळ 1.7 च्या खुणेहून आरामात वर, म्हणून बंध बहुतांश आयनिक — जे सोडियम क्लोराइडच्या उच्च द्रवणबिंदूशी आणि वितळलेल्या अवस्थेतील त्याच्या वहनाशी जुळते. (3.9 दोन्ही मूल्ये जोडते आणि 2.7 त्यांना गुणते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Period 4 fills the 4s, 3d and 4p subshells, holding 2, 10 and 6 electrons. How many elements are in that period?",
        hi: "आवर्त 4 में 4s, 3d और 4p उपकोश भरते हैं, जो 2, 10 और 6 इलेक्ट्रॉन रखते हैं। उस आवर्त में कितने तत्व हैं?",
        mr: "आवर्त 4 मध्ये 4s, 3d आणि 4p उपकवचे भरतात, जी 2, 10 आणि 6 इलेक्ट्रॉन ठेवतात. त्या आवर्तात किती मूलद्रव्ये आहेत?",
      },
      answer: 18,
      wrong: [8, 32, 10],
      checkExpr: "2+10+6",
      solution: {
        en: "2 + 10 + 6 = 18. The length of a period is simply the number of electrons the subshells filled in it can hold, which is why the periods run 2, 8, 8, 18, 18, 32 and not in any round arithmetic pattern. The ten in the middle is the first transition series, appearing for the first time because the 3d subshell only becomes accessible after 4s. (8 uses only the s and p subshells, which is the period 3 answer.)",
        hi: "2 + 10 + 6 = 18. आवर्त की लंबाई बस उन इलेक्ट्रॉनों की संख्या है जो उसमें भरे उपकोश रख सकते हैं, इसीलिए आवर्त 2, 8, 8, 18, 18, 32 चलते हैं, किसी गोल अंकगणितीय प्रतिरूप में नहीं। बीच के दस पहली संक्रमण श्रेणी हैं, जो पहली बार प्रकट होती है क्योंकि 3d उपकोश 4s के बाद ही सुलभ होता है। (8 केवल s और p उपकोश लेता है, जो आवर्त 3 का उत्तर है।)",
        mr: "2 + 10 + 6 = 18. आवर्ताची लांबी म्हणजे फक्त त्यात भरलेली उपकवचे ठेवू शकतील इतक्या इलेक्ट्रॉनांची संख्या, म्हणूनच आवर्त 2, 8, 8, 18, 18, 32 चालतात, कोणत्याही गोल अंकगणितीय आकृतिबंधात नाही. मधले दहा ही पहिली संक्रमण मालिका, जी प्रथमच प्रकट होते कारण 3d उपकवच 4s नंतरच उपलब्ध होते. (8 फक्त s आणि p उपकवचे घेते, जे आवर्त 3 चे उत्तर.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "The isoelectronic ions N³⁻, O²⁻, F⁻, Na⁺ and Mg²⁺ all have 10 electrons, with nuclear charges 7, 8, 9, 11 and 12. What is the nuclear charge of the ion with the largest radius?",
        hi: "समइलेक्ट्रॉनी आयन N³⁻, O²⁻, F⁻, Na⁺ और Mg²⁺ सबके 10 इलेक्ट्रॉन हैं, और नाभिकीय आवेश 7, 8, 9, 11 तथा 12. सबसे बड़ी त्रिज्या वाले आयन का नाभिकीय आवेश क्या है?",
        mr: "समइलेक्ट्रॉनी आयन N³⁻, O²⁻, F⁻, Na⁺ आणि Mg²⁺ या सर्वांचे 10 इलेक्ट्रॉन, आणि केंद्रकीय भार 7, 8, 9, 11 व 12. सर्वांत मोठ्या त्रिज्येच्या आयनाचा केंद्रकीय भार किती?",
      },
      answer: 7,
      wrong: [12, 10, 9],
      checkExpr: "10-3",
      solution: {
        en: "All five have exactly ten electrons, so screening is identical throughout the series and only the nuclear charge varies. The weakest pull gives the biggest ion, so N³⁻ with Z = 7 is the largest and Mg²⁺ with Z = 12 the smallest. The radii run 171, 140, 133, 95 and 65 pm — a factor of more than two and a half across a series in which the electron count never changes at all. Two lessons come out of this. First, the size of an ion is set by the balance between nuclear pull and electron count, not by the size of the parent atom: a nitrogen atom is smaller than a sodium atom, yet N³⁻ is nearly twice the size of Na⁺. Second, this is why the anions in an ionic crystal are typically much larger than the cations, and why the structure of a salt is usually described as a close-packed array of anions with the smaller cations tucked into the gaps. (12 picks the smallest ion, and 10 quotes the electron count that is the same for all of them.)",
        hi: "पाँचों के ठीक दस इलेक्ट्रॉन हैं, अतः पूरी श्रेणी में परिरक्षण समान है और केवल नाभिकीय आवेश बदलता है। सबसे कमज़ोर खिंचाव सबसे बड़ा आयन देता है, अतः Z = 7 वाला N³⁻ सबसे बड़ा और Z = 12 वाला Mg²⁺ सबसे छोटा। त्रिज्याएँ 171, 140, 133, 95 और 65 pm चलती हैं — ऐसी श्रेणी में ढाई गुने से अधिक का अंतर जिसमें इलेक्ट्रॉन-गिनती बिलकुल नहीं बदलती। इससे दो सबक़ निकलते हैं। पहला, आयन का आकार नाभिकीय खिंचाव और इलेक्ट्रॉन-गिनती के संतुलन से तय होता है, मूल परमाणु के आकार से नहीं: नाइट्रोजन परमाणु सोडियम परमाणु से छोटा है, फिर भी N³⁻, Na⁺ के लगभग दुगुने आकार का है। दूसरा, इसीलिए आयनिक क्रिस्टल में ऋणायन प्रायः धनायनों से कहीं बड़े होते हैं, और इसीलिए किसी लवण की संरचना प्रायः ऋणायनों की सघन-संकुलित व्यवस्था के रूप में बताई जाती है जिसके अंतरालों में छोटे धनायन धँसे रहते हैं। (12 सबसे छोटा आयन चुनता है, और 10 वह इलेक्ट्रॉन-गिनती बताता है जो उन सबकी एक ही है।)",
        mr: "पाचहीचे नेमके दहा इलेक्ट्रॉन, म्हणून अख्ख्या मालिकेत आवरण समान आणि केवळ केंद्रकीय भार बदलतो. सर्वांत कमकुवत ओढ सर्वांत मोठा आयन देते, म्हणून Z = 7 चा N³⁻ सर्वांत मोठा आणि Z = 12 चा Mg²⁺ सर्वांत लहान. त्रिज्या 171, 140, 133, 95 आणि 65 pm चालतात — अशा मालिकेत अडीचपटीहून अधिक फरक जिच्यात इलेक्ट्रॉन-मोजणी मुळीच बदलत नाही. यातून दोन धडे निघतात. पहिला, आयनाचा आकार केंद्रकीय ओढ आणि इलेक्ट्रॉन-मोजणी यांच्या संतुलनाने ठरतो, मूळ अणूच्या आकाराने नाही: नायट्रोजन अणू सोडियम अणूहून लहान, तरीही N³⁻ हा Na⁺ च्या जवळपास दुप्पट आकाराचा. दुसरा, म्हणूनच आयनिक स्फटिकात ऋणायन सहसा धनायनांहून कितीतरी मोठे असतात, आणि म्हणूनच एखाद्या क्षाराची रचना सहसा ऋणायनांची घट्ट-रचलेली मांडणी म्हणून सांगितली जाते जिच्या फटींत लहान धनायन बसवलेले असतात. (12 सर्वांत लहान आयन निवडते, आणि 10 ती इलेक्ट्रॉन-मोजणी सांगते जी त्या सर्वांची एकच आहे.)",
      },
    },
  ],
  "chemistry-11-chemical-bonding": [
    {
      level: 1,
      stem: {
        en: "Nitrogen has 7 electrons in total, with 2 in the first shell. How many valence electrons does it have?",
        hi: "नाइट्रोजन में कुल 7 इलेक्ट्रॉन हैं, जिनमें 2 पहले कोश में। उसके कितने संयोजी इलेक्ट्रॉन हैं?",
        mr: "नायट्रोजनमध्ये एकूण 7 इलेक्ट्रॉन, त्यांतील 2 पहिल्या कवचात. त्याचे किती संयुजा इलेक्ट्रॉन आहेत?",
      },
      answer: 5,
      wrong: [7, 3, 8],
      checkExpr: "7-2",
      solution: {
        en: "7 − 2 = 5 valence electrons, which is why nitrogen forms three bonds and keeps one lone pair — the three bonds and the pair together make its octet. (7 counts every electron and 3 counts the bonds rather than the electrons.)",
        hi: "7 − 2 = 5 संयोजी इलेक्ट्रॉन, इसीलिए नाइट्रोजन तीन बंध बनाता है और एक एकाकी युग्म रखता है — तीन बंध और वह युग्म मिलकर उसका अष्टक बनाते हैं। (7 हर इलेक्ट्रॉन गिनता है और 3 इलेक्ट्रॉनों के बजाय बंध गिनता है।)",
        mr: "7 − 2 = 5 संयुजा इलेक्ट्रॉन, म्हणूनच नायट्रोजन तीन बंध बनवतो आणि एक एकाकी जोडी ठेवतो — तीन बंध आणि ती जोडी मिळून त्याचे अष्टक बनवतात. (7 प्रत्येक इलेक्ट्रॉन मोजते आणि 3 इलेक्ट्रॉनांऐवजी बंध मोजते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "In molecular orbital theory the bond order is (Nb − Na)/2. For O₂ the bonding electrons Nb number 10 and the antibonding Na number 6. What is the bond order?",
        hi: "आण्विक कक्षक सिद्धांत में बंध कोटि (Nb − Na)/2 है। O₂ के लिए आबंधी इलेक्ट्रॉन Nb 10 और प्रतिआबंधी Na 6 हैं। बंध कोटि क्या है?",
        mr: "रेणवीय कक्षक सिद्धांतात बंध कोटी (Nb − Na)/2 आहे. O₂ साठी बंधकारी इलेक्ट्रॉन Nb 10 आणि प्रतिबंधकारी Na 6. बंध कोटी किती?",
      },
      answer: 2,
      wrong: [4, 8, 16],
      checkExpr: "(10-6)/2",
      solution: {
        en: "(10 − 6)/2 = 2, a double bond — which agrees with the Lewis structure, even though the MO picture also produces two unpaired electrons that Lewis cannot. (4 forgets to halve and 16 adds the two counts.)",
        hi: "(10 − 6)/2 = 2, द्विबंध — जो लूइस संरचना से मेल खाता है, यद्यपि आण्विक कक्षक चित्र दो अयुग्मित इलेक्ट्रॉन भी देता है जो लूइस नहीं दे सकता। (4 आधा करना भूलता है और 16 दोनों गिनतियाँ जोड़ देता है।)",
        mr: "(10 − 6)/2 = 2, द्विबंध — जो लुईस संरचनेशी जुळतो, जरी रेणवीय कक्षक चित्र दोन अयुग्मित इलेक्ट्रॉनही देते जे लुईस देऊ शकत नाही. (4 निम्मे करायचे विसरते आणि 16 दोन्ही मोजण्या जोडते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Carbon in methane is sp³ hybridised, mixing one s and three p orbitals. How many hybrid orbitals result?",
        hi: "मेथेन में कार्बन sp³ संकरित है, जो एक s और तीन p कक्षक मिलाता है। कितने संकर कक्षक बनते हैं?",
        mr: "मिथेनमधील कार्बन sp³ संकरित, जो एक s आणि तीन p कक्षके मिसळतो. किती संकर कक्षके तयार होतात?",
      },
      answer: 4,
      wrong: [3, 2, 5],
      checkExpr: "1+3",
      solution: {
        en: "1 + 3 = 4, and hybridisation always conserves the number of orbitals — four in, four out. The four point to the corners of a tetrahedron at 109.5°, which is exactly the shape methane is measured to have. (3 counts only the p orbitals.)",
        hi: "1 + 3 = 4, और संकरण सदा कक्षकों की संख्या बनाए रखता है — चार भीतर, चार बाहर। चारों 109.5° पर चतुष्फलक के कोनों की ओर इंगित करते हैं, जो ठीक वही आकार है जो मेथेन का नापा जाता है। (3 केवल p कक्षक गिनता है।)",
        mr: "1 + 3 = 4, आणि संकरण नेहमी कक्षकांची संख्या टिकवते — चार आत, चार बाहेर. चारही 109.5° वर चतुष्फलकाच्या कोपऱ्यांकडे निर्देश करतात, जो नेमका तोच आकार जो मिथेनचा मोजला जातो. (3 फक्त p कक्षके मोजते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Ammonia's nitrogen has four electron pairs around it, of which one is a lone pair. How many bond pairs are there?",
        hi: "अमोनिया के नाइट्रोजन के इर्द-गिर्द चार इलेक्ट्रॉन-युग्म हैं, जिनमें एक एकाकी युग्म है। कितने आबंधी युग्म हैं?",
        mr: "अमोनियाच्या नायट्रोजनभोवती चार इलेक्ट्रॉन-जोड्या, त्यांपैकी एक एकाकी जोडी. किती बंधकारी जोड्या आहेत?",
      },
      answer: 3,
      wrong: [5, 4, 2],
      checkExpr: "4-1",
      solution: {
        en: "4 − 1 = 3 bond pairs, so ammonia has three N–H bonds. Four pairs would be tetrahedral at 109.5°, but the lone pair pushes harder and squeezes the bonds to 107°, giving the familiar pyramid. (4 counts every pair rather than the bonding ones.)",
        hi: "4 − 1 = 3 आबंधी युग्म, अतः अमोनिया में तीन N–H बंध हैं। चार युग्म 109.5° पर चतुष्फलकीय होते, पर एकाकी युग्म अधिक ज़ोर से धकेलता है और बंधों को 107° तक दबा देता है, जिससे जाना-पहचाना पिरामिड बनता है। (4 आबंधी के बजाय हर युग्म गिनता है।)",
        mr: "4 − 1 = 3 बंधकारी जोड्या, म्हणून अमोनियात तीन N–H बंध. चार जोड्या 109.5° वर चतुष्फलकी झाल्या असत्या, पण एकाकी जोडी अधिक जोराने ढकलते आणि बंध 107° पर्यंत दाबते, ज्यातून ओळखीचा पिरॅमिड बनतो. (4 बंधकारीऐवजी प्रत्येक जोडी मोजते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Carbon has 4 valence electrons and oxygen 6. How many valence electrons are there in total in a carbon dioxide molecule?",
        hi: "कार्बन के 4 संयोजी इलेक्ट्रॉन हैं और ऑक्सीजन के 6. कार्बन डाइऑक्साइड अणु में कुल कितने संयोजी इलेक्ट्रॉन हैं?",
        mr: "कार्बनचे 4 संयुजा इलेक्ट्रॉन आणि ऑक्सिजनचे 6. कार्बन डायऑक्साइड रेणूत एकूण किती संयुजा इलेक्ट्रॉन आहेत?",
      },
      answer: 16,
      wrong: [10, 12, 22],
      checkExpr: "4+2*6",
      solution: {
        en: "4 + 2 × 6 = 16. Those sixteen are distributed as two C=O double bonds — eight electrons — and two lone pairs on each oxygen, another eight, which completes every octet. Counting valence electrons first is the reliable way to draw a Lewis structure. (10 forgets one oxygen and 22 adds the atomic numbers instead.)",
        hi: "4 + 2 × 6 = 16. वे सोलह दो C=O द्विबंधों — आठ इलेक्ट्रॉन — और हर ऑक्सीजन पर दो एकाकी युग्म, यानी और आठ, के रूप में बँटते हैं, जिससे हर अष्टक पूरा होता है। पहले संयोजी इलेक्ट्रॉन गिनना लूइस संरचना खींचने का भरोसेमंद रास्ता है। (10 एक ऑक्सीजन भूल जाता है और 22 इसके बजाय परमाणु क्रमांक जोड़ देता है।)",
        mr: "4 + 2 × 6 = 16. ती सोळा दोन C=O द्विबंध — आठ इलेक्ट्रॉन — आणि प्रत्येक ऑक्सिजनवर दोन एकाकी जोड्या, म्हणजे आणखी आठ, अशी वाटली जातात, ज्यातून प्रत्येक अष्टक पूर्ण होते. आधी संयुजा इलेक्ट्रॉन मोजणे हा लुईस संरचना काढण्याचा विश्वासार्ह मार्ग. (10 एक ऑक्सिजन विसरते आणि 22 त्याऐवजी अणुक्रमांक जोडते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Methane's bond angle is 109.5° and water's is 104.5°. By how many degrees is water's angle smaller?",
        hi: "मेथेन का बंध कोण 109.5° और पानी का 104.5° है। पानी का कोण कितने डिग्री छोटा है?",
        mr: "मिथेनचा बंध कोन 109.5° आणि पाण्याचा 104.5°. पाण्याचा कोन किती अंशांनी लहान?",
      },
      answer: 5,
      wrong: [214, 4.5, 10],
      checkExpr: "109.5-104.5",
      solution: {
        en: "109.5 − 104.5 = 5°. Both molecules have four electron pairs around the central atom, so both start from the tetrahedral angle; water's two lone pairs then squeeze the bonds closer. Ammonia, with one lone pair, sits between them at 107°. (214 adds the two angles.)",
        hi: "109.5 − 104.5 = 5°. दोनों अणुओं के केंद्रीय परमाणु के इर्द-गिर्द चार इलेक्ट्रॉन-युग्म हैं, अतः दोनों चतुष्फलकीय कोण से शुरू होते हैं; फिर पानी के दो एकाकी युग्म बंधों को पास दबा देते हैं। एक एकाकी युग्म वाला अमोनिया 107° पर उनके बीच बैठता है। (214 दोनों कोण जोड़ देता है।)",
        mr: "109.5 − 104.5 = 5°. दोन्ही रेणूंच्या केंद्रीय अणूभोवती चार इलेक्ट्रॉन-जोड्या, म्हणून दोघेही चतुष्फलकी कोनापासून सुरू होतात; मग पाण्याच्या दोन एकाकी जोड्या बंध जवळ दाबतात. एक एकाकी जोडी असलेला अमोनिया 107° वर त्यांच्यामध्ये बसतो. (214 दोन्ही कोन जोडते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Formal charge is valence electrons minus lone-pair electrons minus bonds. For nitrogen in NH₄⁺, with 5 valence electrons, 0 lone-pair electrons and 4 bonds, what is the formal charge?",
        hi: "औपचारिक आवेश = संयोजी इलेक्ट्रॉन घटा एकाकी-युग्म इलेक्ट्रॉन घटा बंध। NH₄⁺ में नाइट्रोजन के लिए, 5 संयोजी इलेक्ट्रॉन, 0 एकाकी-युग्म इलेक्ट्रॉन और 4 बंध के साथ, औपचारिक आवेश क्या है?",
        mr: "औपचारिक भार = संयुजा इलेक्ट्रॉन वजा एकाकी-जोडी इलेक्ट्रॉन वजा बंध. NH₄⁺ मधील नायट्रोजनसाठी, 5 संयुजा इलेक्ट्रॉन, 0 एकाकी-जोडी इलेक्ट्रॉन आणि 4 बंध यांसह, औपचारिक भार किती?",
      },
      answer: 1,
      wrong: [0, 2, 4],
      checkExpr: "5-0-4",
      solution: {
        en: "5 − 0 − 4 = +1, which is where the ion's charge sits. Formal charge is a bookkeeping device rather than a real charge — the electron density is spread over all five atoms — but it is the tool that decides between competing Lewis structures, since the best one puts the smallest formal charges on the most sensible atoms. (0 would be the value for neutral ammonia.)",
        hi: "5 − 0 − 4 = +1, और आयन का आवेश वहीं बैठता है। औपचारिक आवेश असली आवेश नहीं बल्कि बहीखाता-युक्ति है — इलेक्ट्रॉन घनत्व पाँचों परमाणुओं पर फैला है — पर वही उपकरण प्रतिस्पर्धी लूइस संरचनाओं में चुनाव करता है, क्योंकि सबसे अच्छी वह है जो सबसे छोटे औपचारिक आवेश सबसे समझदार परमाणुओं पर रखे। (0 उदासीन अमोनिया का मान होता।)",
        mr: "5 − 0 − 4 = +1, आणि आयनाचा भार तिथेच बसतो. औपचारिक भार हा खरा भार नव्हे तर वहीखाता-युक्ती — इलेक्ट्रॉन घनता पाचही अणूंवर पसरलेली — पण तेच साधन स्पर्धक लुईस संरचनांतून निवड करते, कारण सर्वांत चांगली ती जी सर्वांत लहान औपचारिक भार सर्वांत समजूतदार अणूंवर ठेवते. (0 हे उदासीन अमोनियाचे मूल्य ठरले असते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "For N₂ the bonding electrons number 10 and the antibonding 4. What is its bond order?",
        hi: "N₂ के लिए आबंधी इलेक्ट्रॉन 10 और प्रतिआबंधी 4 हैं। उसकी बंध कोटि क्या है?",
        mr: "N₂ साठी बंधकारी इलेक्ट्रॉन 10 आणि प्रतिबंधकारी 4. त्याची बंध कोटी किती?",
      },
      answer: 3,
      wrong: [6, 2, 14],
      checkExpr: "(10-4)/2",
      solution: {
        en: "(10 − 4)/2 = 3, a triple bond — the strongest bond between two like atoms in ordinary chemistry, at 941 kJ/mol. That strength is why nitrogen gas is so unreactive that plants cannot use it directly, and why fixing it industrially by the Haber process needs high temperature, high pressure and a catalyst. (6 forgets to halve.)",
        hi: "(10 − 4)/2 = 3, त्रिबंध — साधारण रसायन में दो समान परमाणुओं के बीच सबसे प्रबल बंध, 941 kJ/mol पर। वही प्रबलता है जिससे नाइट्रोजन गैस इतनी अक्रिय है कि पौधे उसे सीधे काम में नहीं ला सकते, और जिससे हैबर प्रक्रम से औद्योगिक स्थिरीकरण को ऊँचा ताप, ऊँचा दाब और उत्प्रेरक चाहिए। (6 आधा करना भूलता है।)",
        mr: "(10 − 4)/2 = 3, त्रिबंध — सामान्य रसायनात दोन सारख्या अणूंमधला सर्वांत प्रबळ बंध, 941 kJ/mol वर. तीच प्रबळता ज्यामुळे नायट्रोजन वायू इतका अक्रिय की वनस्पती तो थेट वापरू शकत नाहीत, आणि ज्यामुळे हेबर प्रक्रियेने औद्योगिक स्थिरीकरणाला उच्च तापमान, उच्च दाब आणि उत्प्रेरक लागतो. (6 निम्मे करायचे विसरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Percentage ionic character can be estimated as 16Δ + 3.5Δ², where Δ is the electronegativity difference. For sodium chloride Δ is 2.1. What is the estimate, as a percentage?",
        hi: "प्रतिशत आयनिक लक्षण का आकलन 16Δ + 3.5Δ² से किया जा सकता है, जहाँ Δ विद्युत्-ऋणात्मकता अंतर है। सोडियम क्लोराइड के लिए Δ = 2.1. आकलन प्रतिशत में क्या है?",
        mr: "शेकडा आयनिक लक्षणाचा अंदाज 16Δ + 3.5Δ² ने काढता येतो, जिथे Δ हा विद्युतऋणता फरक. सोडियम क्लोराइडसाठी Δ = 2.1. अंदाज शेकड्यात किती?",
      },
      answer: 49.035,
      wrong: [33.6, 15.435, 63.7],
      checkExpr: "16*2.1+3.5*2.1^2",
      solution: {
        en: "16 × 2.1 + 3.5 × 4.41 = 33.6 + 15.435 = 49.035 per cent. The figure is worth reading carefully: even sodium chloride, the textbook ionic compound, comes out only about half ionic on this estimate. No bond is purely one type or the other — the electron pair is displaced, sometimes almost completely, but 'ionic' and 'covalent' are the two ends of a continuum rather than two boxes. (33.6 keeps only the linear term and 15.435 only the quadratic.)",
        hi: "16 × 2.1 + 3.5 × 4.41 = 33.6 + 15.435 = 49.035 प्रतिशत। आँकड़ा ध्यान से पढ़ने योग्य है: सोडियम क्लोराइड तक, पाठ्यपुस्तक का आयनिक यौगिक, इस आकलन पर केवल लगभग आधा आयनिक निकलता है। कोई बंध विशुद्ध रूप से एक या दूसरी क़िस्म का नहीं — इलेक्ट्रॉन युग्म खिसका होता है, कभी लगभग पूरी तरह, पर 'आयनिक' और 'सहसंयोजक' दो डिब्बे नहीं बल्कि एक ही सातत्य के दो सिरे हैं। (33.6 केवल रैखिक पद रखता है और 15.435 केवल द्विघात।)",
        mr: "16 × 2.1 + 3.5 × 4.41 = 33.6 + 15.435 = 49.035 टक्के. आकडा काळजीपूर्वक वाचण्याजोगा: सोडियम क्लोराइडसुद्धा, पाठ्यपुस्तकातले आयनिक संयुग, या अंदाजावर केवळ सुमारे निम्मे आयनिक निघते. कोणताही बंध निव्वळ एका वा दुसऱ्या प्रकारचा नाही — इलेक्ट्रॉन जोडी सरकलेली असते, कधी जवळपास पूर्णपणे, पण 'आयनिक' आणि 'सहसंयुज' ही दोन खोकी नव्हेत तर एकाच सातत्याची दोन टोके. (33.6 फक्त रेषीय पद ठेवते आणि 15.435 फक्त द्विघात.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Boron trifluoride has three polar bonds and no dipole moment, while nitrogen trifluoride has three polar bonds and a small one. Nitrogen has 5 valence electrons and forms 3 bonds, using pairs. How many lone pairs does its nitrogen carry?",
        hi: "बोरॉन ट्राइफ़्लुओराइड में तीन ध्रुवीय बंध हैं और कोई द्विध्रुव आघूर्ण नहीं, जबकि नाइट्रोजन ट्राइफ़्लुओराइड में तीन ध्रुवीय बंध और एक छोटा द्विध्रुव है। नाइट्रोजन के 5 संयोजी इलेक्ट्रॉन हैं और वह युग्मों का उपयोग करके 3 बंध बनाता है। उसका नाइट्रोजन कितने एकाकी युग्म ढोता है?",
        mr: "बोरॉन ट्रायफ्लोराइडमध्ये तीन ध्रुवीय बंध आणि द्विध्रुव आघूर्ण नाही, तर नायट्रोजन ट्रायफ्लोराइडमध्ये तीन ध्रुवीय बंध आणि एक लहान द्विध्रुव. नायट्रोजनचे 5 संयुजा इलेक्ट्रॉन आणि तो जोड्या वापरून 3 बंध बनवतो. त्याचा नायट्रोजन किती एकाकी जोड्या वाहतो?",
      },
      answer: 1,
      wrong: [0, 2, 3],
      checkExpr: "4-3",
      solution: {
        en: "Nitrogen's five valence electrons make three bonds using three of them, leaving two — one lone pair. So the nitrogen has four electron regions in all, 4 − 3 = 1 of them a lone pair, and VSEPR makes the molecule pyramidal. Boron has only three valence electrons and no lone pair, so BF₃ has three regions and is trigonal planar. That single structural difference explains both observations. In BF₃ the three bond dipoles lie at 120° in one plane and sum to exactly zero, so the molecule is non-polar despite fluorine being the most electronegative element there is. In NF₃ the three bonds are pushed to one side of the nitrogen by the lone pair, so they do not cancel — and the lone pair's own dipole points the opposite way and partly cancels them again, which is why NF₃'s dipole moment is unusually small at 0.24 D, far below ammonia's 1.47 D even though fluorine is far more electronegative than hydrogen. The molecule is a standard demonstration that bond polarity, geometry and lone-pair contributions all have to be added as vectors, and that guessing from the formula alone is unreliable. (0 describes boron rather than nitrogen, and 2 would make the molecule bent like water.)",
        hi: "नाइट्रोजन के पाँच संयोजी इलेक्ट्रॉन तीन का उपयोग करके तीन बंध बनाते हैं, और दो बचते हैं — एक एकाकी युग्म। अतः नाइट्रोजन के कुल चार इलेक्ट्रॉन-क्षेत्र हैं, जिनमें 4 − 3 = 1 एकाकी युग्म है, और VSEPR अणु को पिरामिडी बना देता है। बोरॉन के केवल तीन संयोजी इलेक्ट्रॉन हैं और कोई एकाकी युग्म नहीं, अतः BF₃ के तीन क्षेत्र हैं और वह त्रिकोणीय समतलीय है। वही एक संरचनात्मक भेद दोनों प्रेक्षण समझा देता है। BF₃ में तीनों बंध-द्विध्रुव एक ही समतल में 120° पर हैं और जुड़कर ठीक शून्य होते हैं, अतः अणु अध्रुवीय है यद्यपि फ़्लुओरीन सबसे अधिक विद्युत्-ऋणात्मक तत्व है। NF₃ में एकाकी युग्म तीनों बंधों को नाइट्रोजन के एक ओर धकेल देता है, अतः वे कटते नहीं — और एकाकी युग्म का अपना द्विध्रुव उलटी ओर इंगित करके उन्हें फिर आंशिक रूप से काट देता है, इसीलिए NF₃ का द्विध्रुव आघूर्ण असामान्य रूप से छोटा 0.24 D है, अमोनिया के 1.47 D से कहीं नीचे, यद्यपि फ़्लुओरीन हाइड्रोजन से कहीं अधिक विद्युत्-ऋणात्मक है। यह अणु मानक प्रदर्शन है कि बंध-ध्रुवता, ज्यामिति और एकाकी युग्मों का योगदान सबको सदिशों की तरह जोड़ना पड़ता है, और अकेले सूत्र से अनुमान लगाना भरोसेमंद नहीं। (0 नाइट्रोजन नहीं बोरॉन का वर्णन करता है, और 2 अणु को पानी जैसा मुड़ा बना देता।)",
        mr: "नायट्रोजनचे पाच संयुजा इलेक्ट्रॉन तीन वापरून तीन बंध बनवतात, आणि दोन उरतात — एक एकाकी जोडी. म्हणून नायट्रोजनचे एकूण चार इलेक्ट्रॉन-प्रदेश, त्यांतील 4 − 3 = 1 एकाकी जोडी, आणि VSEPR रेणूला पिरॅमिडी बनवते. बोरॉनचे केवळ तीन संयुजा इलेक्ट्रॉन आणि कोणतीही एकाकी जोडी नाही, म्हणून BF₃ चे तीन प्रदेश आणि तो त्रिकोणी प्रतलीय. तोच एक संरचनात्मक फरक दोन्ही निरीक्षणे समजावतो. BF₃ मध्ये तिन्ही बंध-द्विध्रुव एकाच प्रतलात 120° वर आणि जोडून नेमके शून्य होतात, म्हणून रेणू अध्रुवीय जरी फ्लोरिन सर्वांत अधिक विद्युतऋण मूलद्रव्य असले तरी. NF₃ मध्ये एकाकी जोडी तिन्ही बंधांना नायट्रोजनच्या एका बाजूला ढकलते, म्हणून ते कापले जात नाहीत — आणि एकाकी जोडीचा स्वतःचा द्विध्रुव उलट दिशेने निर्देश करून त्यांना पुन्हा अंशतः कापतो, म्हणूनच NF₃ चा द्विध्रुव आघूर्ण असामान्यपणे लहान 0.24 D आहे, अमोनियाच्या 1.47 D हून कितीतरी खाली, जरी फ्लोरिन हायड्रोजनहून कितीतरी अधिक विद्युतऋण असले तरी. हा रेणू प्रमाणित प्रात्यक्षिक की बंध-ध्रुवता, भूमिती आणि एकाकी जोड्यांचा वाटा या सर्वांना सदिशांसारखे जोडावे लागते, आणि एकट्या सूत्रावरून अंदाज बांधणे विश्वासार्ह नाही. (0 नायट्रोजन नव्हे तर बोरॉनचे वर्णन करते, आणि 2 रेणूला पाण्यासारखा वाकडा बनवले असते.)",
      },
    },
  ],
  "chemistry-11-thermodynamics": [
    {
      level: 1,
      stem: {
        en: "A process has ΔU = 400 J and does 100 J of work pushing back the atmosphere. Using ΔH = ΔU + PΔV, what is ΔH in joules?",
        hi: "किसी प्रक्रिया का ΔU = 400 J है और वह वायुमंडल को पीछे धकेलने में 100 J कार्य करती है। ΔH = ΔU + PΔV लगाते हुए, ΔH जूल में क्या है?",
        mr: "एका प्रक्रियेचा ΔU = 400 J आणि ती वातावरण मागे ढकलण्यात 100 J कार्य करते. ΔH = ΔU + PΔV वापरून, ΔH ज्यूलमध्ये किती?",
      },
      answer: 500,
      wrong: [300, 40000, 4],
      checkExpr: "400+100",
      solution: {
        en: "ΔH = 400 + 100 = 500 J. The extra hundred joules is the work spent making room for the products against atmospheric pressure — which is why a reaction in an open beaker and the same reaction in a sealed bomb give different figures. (300 subtracts the work instead of adding it.)",
        hi: "ΔH = 400 + 100 = 500 J. अतिरिक्त सौ जूल वह कार्य है जो वायुमंडलीय दाब के विरुद्ध उत्पादों के लिए जगह बनाने में ख़र्च हुआ — इसीलिए खुले बीकर की अभिक्रिया और वही अभिक्रिया बंद बम में भिन्न आँकड़े देती हैं। (300 कार्य जोड़ने के बजाय घटा देता है।)",
        mr: "ΔH = 400 + 100 = 500 J. जादा शंभर ज्यूल हे ते कार्य जे वातावरणीय दाबाविरुद्ध उत्पादांसाठी जागा करण्यात खर्च झाले — म्हणूनच उघड्या बीकरमधली अभिक्रिया आणि तीच अभिक्रिया बंद बॉम्बमध्ये वेगळे आकडे देतात. (300 कार्य जोडण्याऐवजी वजा करते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "The enthalpy of combustion of methane is 890 kJ per mole. How much heat, in kJ, is released by burning 2 moles?",
        hi: "मेथेन की दहन एन्थैल्पी प्रति मोल 890 kJ है। 2 मोल जलाने से कितनी ऊष्मा kJ में निकलती है?",
        mr: "मिथेनची ज्वलन एन्थाल्पी प्रति मोल 890 kJ आहे. 2 मोल जाळल्याने किती उष्णता kJ मध्ये निघते?",
      },
      answer: 1780,
      wrong: [445, 892, 890],
      checkExpr: "890*2",
      solution: {
        en: "890 × 2 = 1780 kJ. Enthalpy is an extensive quantity: double the amount and you double the heat, which is why every thermochemical equation must state the amounts it refers to. (890 quotes the molar figure as though the amount did not matter.)",
        hi: "890 × 2 = 1780 kJ. एन्थैल्पी विस्तीर्ण राशि है: मात्रा दोगुनी करो और ऊष्मा दोगुनी, इसीलिए हर ऊष्मारासायनिक समीकरण को वे मात्राएँ बतानी पड़ती हैं जिनकी वह बात कर रहा है। (890 मोलर आँकड़ा ऐसे बताता है मानो मात्रा से फ़र्क़ ही न पड़ता हो।)",
        mr: "890 × 2 = 1780 kJ. एन्थाल्पी ही विस्तारक राशी: प्रमाण दुप्पट करा आणि उष्णता दुप्पट, म्हणूनच प्रत्येक उष्मारासायनिक समीकरणाला ती कोणत्या प्रमाणांबद्दल बोलत आहे ते सांगावे लागते. (890 मोलर आकडा असा सांगते जणू प्रमाणाने फरकच पडत नसावा.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "By Hess's law a target reaction is the sum of two steps releasing 390 kJ and 290 kJ. What is the magnitude of the total enthalpy change, in kJ?",
        hi: "हेस के नियम से कोई लक्ष्य अभिक्रिया 390 kJ और 290 kJ छोड़ते दो चरणों का योग है। कुल एन्थैल्पी-परिवर्तन का परिमाण kJ में क्या है?",
        mr: "हेसच्या नियमाने एक लक्ष्य अभिक्रिया 390 kJ आणि 290 kJ सोडणाऱ्या दोन टप्प्यांची बेरीज आहे. एकूण एन्थाल्पी-बदलाचे परिमाण kJ मध्ये किती?",
      },
      answer: 680,
      wrong: [100, 1130, 340],
      checkExpr: "390+290",
      solution: {
        en: "390 + 290 = 680 kJ released. Enthalpy is a state function, so the total for a route is simply the sum of its steps and nothing depends on the order they are taken in. (100 subtracts the two and 340 averages them.)",
        hi: "390 + 290 = 680 kJ निकलती है। एन्थैल्पी अवस्था-फलन है, अतः किसी रास्ते का कुल बस उसके चरणों का योग है और कुछ भी इस पर निर्भर नहीं कि वे किस क्रम में लिए गए। (100 दोनों को घटाता है और 340 उनका औसत लेता है।)",
        mr: "390 + 290 = 680 kJ निघते. एन्थाल्पी हे अवस्था-फलन, म्हणून एखाद्या मार्गाची एकूण म्हणजे फक्त त्याच्या टप्प्यांची बेरीज आणि ते कोणत्या क्रमाने घेतले यावर काहीही अवलंबून नाही. (100 दोघांना वजा करते आणि 340 त्यांची सरासरी घेते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Bond enthalpies are H–H 436, Cl–Cl 242 and H–Cl 431 kJ/mol. For H₂ + Cl₂ → 2HCl, what is the magnitude of the enthalpy change, in kJ?",
        hi: "बंध एन्थैल्पियाँ H–H 436, Cl–Cl 242 और H–Cl 431 kJ/mol हैं। H₂ + Cl₂ → 2HCl के लिए एन्थैल्पी-परिवर्तन का परिमाण kJ में क्या है?",
        mr: "बंध एन्थाल्पी H–H 436, Cl–Cl 242 आणि H–Cl 431 kJ/mol. H₂ + Cl₂ → 2HCl साठी एन्थाल्पी-बदलाचे परिमाण kJ मध्ये किती?",
      },
      answer: 184,
      wrong: [247, 1540, 92],
      checkExpr: "2*431-436-242",
      solution: {
        en: "Bonds broken cost 436 + 242 = 678 kJ; bonds formed release 2 × 431 = 862 kJ. The reaction is exothermic by 862 − 678 = 184 kJ. Note that two H–Cl bonds form, not one — forgetting the coefficient is the standard slip here. (92 halves the answer by counting one HCl.)",
        hi: "टूटे बंध 436 + 242 = 678 kJ माँगते हैं; बने बंध 2 × 431 = 862 kJ छोड़ते हैं। अभिक्रिया 862 − 678 = 184 kJ से ऊष्माक्षेपी है। ध्यान दो दो H–Cl बंध बनते हैं, एक नहीं — गुणांक भूलना यहाँ की मानक चूक है। (92 एक HCl गिनकर उत्तर आधा कर देता है।)",
        mr: "तुटलेले बंध 436 + 242 = 678 kJ मागतात; तयार झालेले बंध 2 × 431 = 862 kJ सोडतात. अभिक्रिया 862 − 678 = 184 kJ ने उष्माक्षेपी. लक्षात घ्या दोन H–Cl बंध तयार होतात, एक नाही — गुणांक विसरणे ही इथली प्रमाणित चूक. (92 एक HCl मोजून उत्तर निम्मे करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A reaction has ΔH = 100 kJ and ΔS = 0.2 kJ/K. At 300 K, what is ΔG in kJ?",
        hi: "किसी अभिक्रिया का ΔH = 100 kJ और ΔS = 0.2 kJ/K है। 300 K पर ΔG kJ में क्या है?",
        mr: "एका अभिक्रियेचा ΔH = 100 kJ आणि ΔS = 0.2 kJ/K. 300 K वर ΔG kJ मध्ये किती?",
      },
      answer: 40,
      wrong: [160, 40000, 6000],
      checkExpr: "100-300*0.2",
      solution: {
        en: "ΔG = ΔH − TΔS = 100 − 60 = 40 kJ, positive, so the reaction is not spontaneous at 300 K. Raise the temperature far enough and the TΔS term will overtake ΔH and turn ΔG negative. (160 adds the entropy term instead of subtracting it.)",
        hi: "ΔG = ΔH − TΔS = 100 − 60 = 40 kJ, धनात्मक, अतः 300 K पर अभिक्रिया स्वतःस्फूर्त नहीं। ताप पर्याप्त बढ़ाओ और TΔS पद ΔH से आगे निकलकर ΔG को ऋणात्मक कर देगा। (160 एन्ट्रॉपी पद घटाने के बजाय जोड़ देता है।)",
        mr: "ΔG = ΔH − TΔS = 100 − 60 = 40 kJ, धन, म्हणून 300 K वर अभिक्रिया स्वयंस्फूर्त नाही. तापमान पुरेसे वाढवा आणि TΔS पद ΔH च्या पुढे जाऊन ΔG ऋण करेल. (160 एन्ट्रॉपी पद वजा करण्याऐवजी जोडते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A reaction has ΔH = 60 kJ and ΔS = 0.2 kJ/K, both positive. Above what temperature, in kelvin, does it become spontaneous?",
        hi: "किसी अभिक्रिया का ΔH = 60 kJ और ΔS = 0.2 kJ/K है, दोनों धनात्मक। वह किस ताप, केल्विन में, से ऊपर स्वतःस्फूर्त हो जाती है?",
        mr: "एका अभिक्रियेचा ΔH = 60 kJ आणि ΔS = 0.2 kJ/K, दोन्ही धन. ती कोणत्या तापमानाच्या, केल्विनमध्ये, वर स्वयंस्फूर्त होते?",
      },
      answer: 300,
      wrong: [12, 0.003333, 3000],
      checkExpr: "60/0.2",
      solution: {
        en: "ΔG turns negative when TΔS exceeds ΔH, so T > ΔH/ΔS = 60/0.2 = 300 K. This is the pattern for every reaction with both terms positive: unfavourable when cold and favourable when hot, with the crossover set by the ratio. Melting is the everyday example. (12 multiplies instead of dividing.)",
        hi: "ΔG तब ऋणात्मक होता है जब TΔS, ΔH से बड़ा हो, अतः T > ΔH/ΔS = 60/0.2 = 300 K. दोनों पद धनात्मक वाली हर अभिक्रिया का यही प्रतिरूप है: ठंडे में प्रतिकूल और गरम में अनुकूल, और संक्रमण-बिंदु अनुपात से तय। गलन रोज़मर्रा का उदाहरण है। (12 भाग के बजाय गुणा करता है।)",
        mr: "ΔG तेव्हा ऋण होतो जेव्हा TΔS हा ΔH हून मोठा, म्हणून T > ΔH/ΔS = 60/0.2 = 300 K. दोन्ही पदे धन असलेल्या प्रत्येक अभिक्रियेचा हाच आकृतिबंध: थंडीत प्रतिकूल आणि गरमीत अनुकूल, आणि संक्रमण-बिंदू गुणोत्तराने ठरलेला. द्रवीभवन हे रोजचे उदाहरण. (12 भागण्याऐवजी गुणते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In a calorimeter 500 g of water rises by 2 K. Taking the specific heat as 4.2 J/g/K, how much heat, in joules, was released?",
        hi: "कैलोरीमापी में 500 g पानी का ताप 2 K चढ़ता है। विशिष्ट ऊष्मा 4.2 J/g/K लेते हुए, कितनी ऊष्मा जूल में निकली?",
        mr: "कॅलरीमापकात 500 g पाण्याचे तापमान 2 K ने चढते. विशिष्ट उष्णता 4.2 J/g/K घेतल्यास, किती उष्णता ज्यूलमध्ये निघाली?",
      },
      answer: 4200,
      wrong: [2100, 420, 42000],
      checkExpr: "500*4.2*2",
      solution: {
        en: "q = mcΔT = 500 × 4.2 × 2 = 4200 J. The water is the measuring instrument: the reaction's heat is inferred entirely from how much the surrounding water warmed, which is why a calorimeter must be insulated and its own heat capacity accounted for. (2100 uses a 1 K rise.)",
        hi: "q = mcΔT = 500 × 4.2 × 2 = 4200 J. पानी ही मापक यंत्र है: अभिक्रिया की ऊष्मा पूरी तरह इससे निकाली जाती है कि आसपास का पानी कितना गरम हुआ, इसीलिए कैलोरीमापी को रोधित करना और उसकी अपनी ऊष्मा धारिता का हिसाब रखना पड़ता है। (2100 1 K की वृद्धि लगाता है।)",
        mr: "q = mcΔT = 500 × 4.2 × 2 = 4200 J. पाणीच मापन उपकरण: अभिक्रियेची उष्णता पूर्णपणे आजूबाजूचे पाणी किती तापले यावरून काढली जाते, म्हणूनच कॅलरीमापक उष्णतारोधक करावा लागतो आणि त्याची स्वतःची उष्णता धारकता हिशोबात घ्यावी लागते. (2100 हे 1 K ची वाढ वापरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Ice melts at 273 K with an enthalpy of fusion of 6000 J/mol. What is the entropy change of melting, in J/mol/K?",
        hi: "बर्फ़ 273 K पर 6000 J/mol गलन एन्थैल्पी के साथ पिघलती है। गलन का एन्ट्रॉपी-परिवर्तन J/mol/K में क्या है?",
        mr: "बर्फ 273 K वर 6000 J/mol द्रवीभवन एन्थाल्पीसह वितळतो. द्रवीभवनाचा एन्ट्रॉपी-बदल J/mol/K मध्ये किती?",
      },
      answer: 21.978022,
      wrong: [1638000, 0.045500, 22.5],
      checkExpr: "6000/273",
      solution: {
        en: "For a change of state at constant temperature ΔS = ΔH/T = 6000/273 = 21.978022 J/mol/K, positive because a liquid has far more available arrangements than a crystal. The corresponding figure for boiling is about 109 J/mol/K, five times larger — a gas is very much more disordered than a liquid. (1638000 multiplies instead of dividing.)",
        hi: "अचर ताप पर अवस्था-परिवर्तन के लिए ΔS = ΔH/T = 6000/273 = 21.978022 J/mol/K, धनात्मक क्योंकि द्रव के पास क्रिस्टल से कहीं अधिक उपलब्ध व्यवस्थाएँ हैं। क्वथन का तदनुरूप आँकड़ा लगभग 109 J/mol/K है, पाँच गुना बड़ा — गैस द्रव से कहीं अधिक अव्यवस्थित है। (1638000 भाग के बजाय गुणा करता है।)",
        mr: "अचल तापमानावर अवस्थाबदलासाठी ΔS = ΔH/T = 6000/273 = 21.978022 J/mol/K, धन कारण द्रवाकडे स्फटिकाहून कितीतरी अधिक उपलब्ध मांडण्या. उकळण्याचा तदनुरूप आकडा सुमारे 109 J/mol/K, पाचपट मोठा — वायू द्रवाहून कितीतरी अधिक अव्यवस्थित. (1638000 भागण्याऐवजी गुणते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "For CH₄ + 2O₂ → CO₂ + 2H₂O the standard enthalpies of formation in kJ/mol are CH₄ −75, CO₂ −394, H₂O −286 and O₂ zero. What is the magnitude of ΔH for the reaction, in kJ?",
        hi: "CH₄ + 2O₂ → CO₂ + 2H₂O के लिए मानक संभवन एन्थैल्पियाँ kJ/mol में CH₄ −75, CO₂ −394, H₂O −286 और O₂ शून्य हैं। अभिक्रिया के ΔH का परिमाण kJ में क्या है?",
        mr: "CH₄ + 2O₂ → CO₂ + 2H₂O साठी प्रमाणित संभवन एन्थाल्पी kJ/mol मध्ये CH₄ −75, CO₂ −394, H₂O −286 आणि O₂ शून्य. अभिक्रियेच्या ΔH चे परिमाण kJ मध्ये किती?",
      },
      answer: 891,
      wrong: [605, 755, 1041],
      checkExpr: "394+2*286-75",
      solution: {
        en: "ΔH = Σ products − Σ reactants = [−394 + 2(−286)] − [−75 + 0] = −966 + 75 = −891 kJ, so 891 kJ is released. Two details decide the answer: the water's coefficient of 2 must be applied, and oxygen contributes nothing because an element in its standard state is defined as zero. (605 forgets to double the water.)",
        hi: "ΔH = Σ उत्पाद − Σ अभिकारक = [−394 + 2(−286)] − [−75 + 0] = −966 + 75 = −891 kJ, अतः 891 kJ निकलती है। दो ब्योरे उत्तर तय करते हैं: पानी का गुणांक 2 लगाना पड़ता है, और ऑक्सीजन कुछ योगदान नहीं देती क्योंकि अपनी मानक अवस्था में तत्व शून्य परिभाषित है। (605 पानी दोगुना करना भूलता है।)",
        mr: "ΔH = Σ उत्पादे − Σ अभिक्रियाकारक = [−394 + 2(−286)] − [−75 + 0] = −966 + 75 = −891 kJ, म्हणून 891 kJ निघते. दोन तपशील उत्तर ठरवतात: पाण्याचा गुणांक 2 लावावा लागतो, आणि ऑक्सिजन काहीही वाटा देत नाही कारण आपल्या प्रमाणित अवस्थेतील मूलद्रव्य शून्य व्याख्यायित. (605 पाणी दुप्पट करायचे विसरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A reaction has ΔH = −100 kJ and ΔS = −0.2 kJ/K, both negative. Above what temperature, in kelvin, does it stop being spontaneous?",
        hi: "किसी अभिक्रिया का ΔH = −100 kJ और ΔS = −0.2 kJ/K है, दोनों ऋणात्मक। वह किस ताप, केल्विन में, से ऊपर स्वतःस्फूर्त होना बंद कर देती है?",
        mr: "एका अभिक्रियेचा ΔH = −100 kJ आणि ΔS = −0.2 kJ/K, दोन्ही ऋण. ती कोणत्या तापमानाच्या, केल्विनमध्ये, वर स्वयंस्फूर्त असणे थांबवते?",
      },
      answer: 500,
      wrong: [20, 0.002, 300],
      checkExpr: "100/0.2",
      solution: {
        en: "With both terms negative, ΔG = ΔH − TΔS = −100 + 0.2T, which is negative while T is below 100/0.2 = 500 K and positive above it. So this reaction runs when cold and stops when hot — the exact opposite of the more familiar case where heating helps. Four combinations exhaust the possibilities and each behaves differently. ΔH negative with ΔS positive: spontaneous at every temperature, since both terms push the same way. ΔH positive with ΔS negative: never spontaneous at any temperature. ΔH positive with ΔS positive: needs heat, like melting and like dissolving ammonium chloride. ΔH negative with ΔS negative, this case: needs cold, and freezing is the everyday example — water freezes below 273 K and not above it, for exactly this reason. The industrial significance is real. Ammonia synthesis falls in this fourth box, which is why its equilibrium yield falls as the temperature is raised, and why the Haber process has to buy back with pressure what it spends on heat. A reaction that is helped by cooling is a reaction that will always be slow, and that tension is the central problem of industrial chemistry. (20 multiplies rather than divides, and 300 borrows a number from a different question.)",
        hi: "दोनों पद ऋणात्मक होने पर ΔG = ΔH − TΔS = −100 + 0.2T, जो T के 100/0.2 = 500 K से नीचे रहते ऋणात्मक है और ऊपर धनात्मक। अतः यह अभिक्रिया ठंडे में चलती है और गरम में रुक जाती है — उस अधिक जाने-पहचाने प्रकरण के ठीक उलटा जहाँ गरम करना मदद करता है। चार संयोजन सारी संभावनाएँ चुका देते हैं और हर एक भिन्न व्यवहार करता है। ΔH ऋणात्मक और ΔS धनात्मक: हर ताप पर स्वतःस्फूर्त, क्योंकि दोनों पद एक ही ओर धकेलते हैं। ΔH धनात्मक और ΔS ऋणात्मक: किसी भी ताप पर कभी स्वतःस्फूर्त नहीं। ΔH धनात्मक और ΔS धनात्मक: ऊष्मा चाहिए, जैसे गलन और जैसे अमोनियम क्लोराइड का घुलना। ΔH ऋणात्मक और ΔS ऋणात्मक, यह प्रकरण: ठंड चाहिए, और हिमीकरण रोज़मर्रा का उदाहरण है — पानी 273 K से नीचे जमता है, ऊपर नहीं, ठीक इसी कारण। औद्योगिक महत्व असली है। अमोनिया संश्लेषण इसी चौथे डिब्बे में पड़ता है, इसीलिए ताप बढ़ाने पर उसकी साम्य-लब्धि गिरती है, और इसीलिए हैबर प्रक्रम को ऊष्मा पर जो ख़र्च हुआ वह दाब से वापस ख़रीदना पड़ता है। जिस अभिक्रिया को ठंडा करना मदद करे वह सदा धीमी रहेगी, और वही तनाव औद्योगिक रसायन की केंद्रीय समस्या है। (20 भाग के बजाय गुणा करता है, और 300 किसी और प्रश्न से संख्या उधार ले लेता है।)",
        mr: "दोन्ही पदे ऋण असल्याने ΔG = ΔH − TΔS = −100 + 0.2T, जो T हा 100/0.2 = 500 K च्या खाली असेपर्यंत ऋण आणि वर धन. म्हणून ही अभिक्रिया थंडीत चालते आणि गरमीत थांबते — त्या अधिक ओळखीच्या प्रकरणाच्या नेमके उलटे जिथे तापवणे मदत करते. चार संयोजने सर्व शक्यता संपवतात आणि प्रत्येक वेगळे वागते. ΔH ऋण आणि ΔS धन: प्रत्येक तापमानावर स्वयंस्फूर्त, कारण दोन्ही पदे एकाच दिशेने ढकलतात. ΔH धन आणि ΔS ऋण: कोणत्याही तापमानावर कधीच स्वयंस्फूर्त नाही. ΔH धन आणि ΔS धन: उष्णता लागते, जसे द्रवीभवन आणि जसे अमोनियम क्लोराइड विरघळणे. ΔH ऋण आणि ΔS ऋण, हे प्रकरण: थंडी लागते, आणि गोठणे हे रोजचे उदाहरण — पाणी 273 K च्या खाली गोठते, वर नाही, नेमक्या याच कारणाने. औद्योगिक महत्त्व खरे. अमोनिया संश्लेषण याच चौथ्या खोक्यात पडते, म्हणूनच तापमान वाढवल्यावर त्याचे समतोल-उत्पन्न घटते, आणि म्हणूनच हेबर प्रक्रियेला उष्णतेवर जे खर्चले ते दाबाने परत विकत घ्यावे लागते. ज्या अभिक्रियेला थंड करणे मदत करते ती नेहमी सावकाश राहील, आणि तोच ताण औद्योगिक रसायनाची केंद्रीय समस्या. (20 भागण्याऐवजी गुणते, आणि 300 दुसऱ्या प्रश्नातून संख्या उसनी घेते.)",
      },
    },
  ],
  "chemistry-11-equilibrium": [
    {
      level: 1,
      stem: {
        en: "For the equilibrium A ⇌ B the concentrations at rest are [B] = 0.8 M and [A] = 0.2 M. What is the equilibrium constant?",
        hi: "साम्य A ⇌ B के लिए विश्राम पर सांद्रताएँ [B] = 0.8 M और [A] = 0.2 M हैं। साम्य स्थिरांक क्या है?",
        mr: "समतोल A ⇌ B साठी विश्रांतीवर संहती [B] = 0.8 M आणि [A] = 0.2 M. समतोल स्थिरांक किती?",
      },
      answer: 4,
      wrong: [0.25, 1, 0.6],
      checkExpr: "0.8/0.2",
      solution: {
        en: "K = [B]/[A] = 0.8/0.2 = 4. A value greater than one means the equilibrium favours the products, though it says nothing about how quickly that position is reached. (0.25 inverts the ratio, which is the constant for the reverse reaction.)",
        hi: "K = [B]/[A] = 0.8/0.2 = 4. एक से बड़ा मान बताता है कि साम्य उत्पादों के पक्ष में है, यद्यपि वह यह नहीं कहता कि उस स्थिति तक कितनी जल्दी पहुँचा जाता है। (0.25 अनुपात उलट देता है, जो प्रतीप अभिक्रिया का स्थिरांक है।)",
        mr: "K = [B]/[A] = 0.8/0.2 = 4. एकाहून मोठे मूल्य सांगते की समतोल उत्पादांच्या बाजूने, जरी ते त्या स्थितीपर्यंत किती लवकर पोहोचले जाते हे सांगत नाही. (0.25 गुणोत्तर उलटे करते, जो मागच्या अभिक्रियेचा स्थिरांक.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "At 25 °C, pH + pOH = 14. A solution has pOH = 5. What is its pH?",
        hi: "25 °C पर pH + pOH = 14. किसी विलयन का pOH = 5 है। उसका pH क्या है?",
        mr: "25 °C वर pH + pOH = 14. एका द्रावणाचा pOH = 5 आहे. त्याचा pH किती?",
      },
      answer: 9,
      wrong: [19, 5, 7],
      checkExpr: "14-5",
      solution: {
        en: "pH = 14 − 5 = 9, so the solution is alkaline. The relation holds because the product of the two ion concentrations is fixed at 10⁻¹⁴, which means pushing one down necessarily pushes the other up. (19 adds instead of subtracting.)",
        hi: "pH = 14 − 5 = 9, अतः विलयन क्षारीय है। यह संबंध इसलिए चलता है कि दोनों आयन-सांद्रताओं का गुणनफल 10⁻¹⁴ पर तय है, जिसका अर्थ है कि एक को नीचे धकेलना अनिवार्यतः दूसरे को ऊपर धकेलता है। (19 घटाने के बजाय जोड़ देता है।)",
        mr: "pH = 14 − 5 = 9, म्हणून द्रावण आम्लारीधर्मी. हा संबंध यामुळे चालतो की दोन्ही आयन-संहतींचा गुणाकार 10⁻¹⁴ वर ठरलेला, म्हणजे एकाला खाली ढकलणे अपरिहार्यपणे दुसऱ्याला वर ढकलते. (19 वजा करण्याऐवजी जोडते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A solution has a hydrogen-ion concentration of 10⁻⁴ M, giving pH 4. At 25 °C, what is its pOH?",
        hi: "किसी विलयन की हाइड्रोजन-आयन सांद्रता 10⁻⁴ M है, जिससे pH 4 मिलता है। 25 °C पर उसका pOH क्या है?",
        mr: "एका द्रावणाची हायड्रोजन-आयन संहती 10⁻⁴ M, ज्यातून pH 4 मिळतो. 25 °C वर त्याचा pOH किती?",
      },
      answer: 10,
      wrong: [4, 18, 7],
      checkExpr: "14-4",
      solution: {
        en: "pOH = 14 − 4 = 10, so the hydroxide concentration is 10⁻¹⁰ M — ten thousand times lower than in pure water, although it has not fallen to zero. Adding acid does not remove hydroxide entirely; it drives the equilibrium back until the product is right again. (4 confuses the two scales.)",
        hi: "pOH = 14 − 4 = 10, अतः हाइड्रॉक्साइड सांद्रता 10⁻¹⁰ M है — शुद्ध पानी से दस हज़ार गुना कम, यद्यपि वह शून्य नहीं हुई। अम्ल जोड़ना हाइड्रॉक्साइड को पूरी तरह नहीं हटाता; वह साम्य को तब तक पीछे धकेलता है जब तक गुणनफल फिर सही न हो जाए। (4 दोनों पैमाने गड्डमड्ड कर देता है।)",
        mr: "pOH = 14 − 4 = 10, म्हणून हायड्रॉक्साइड संहती 10⁻¹⁰ M — शुद्ध पाण्याहून दहा हजारपट कमी, जरी ती शून्य झालेली नाही. आम्ल जोडणे हायड्रॉक्साइड पूर्णपणे काढत नाही; ते समतोल तोवर मागे ढकलते जोवर गुणाकार पुन्हा बरोबर होत नाही. (4 दोन्ही मापनश्रेण्यांची गल्लत करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "In N₂ + 3H₂ ⇌ 2NH₃, four moles of gas become two. What is the magnitude of the change in the number of moles of gas?",
        hi: "N₂ + 3H₂ ⇌ 2NH₃ में चार मोल गैस दो हो जाती है। गैस के मोलों की संख्या में परिवर्तन का परिमाण क्या है?",
        mr: "N₂ + 3H₂ ⇌ 2NH₃ मध्ये चार मोल वायू दोन होतात. वायूच्या मोलांच्या संख्येतील बदलाचे परिमाण किती?",
      },
      answer: 2,
      wrong: [6, 1, 3],
      checkExpr: "4-2",
      solution: {
        en: "4 − 2 = 2, a decrease. That decrease is why raising the pressure shifts this equilibrium towards ammonia: compressing a mixture favours whichever side occupies less volume. A reaction with no change in gas moles is unaffected by pressure altogether. (6 adds the two sides.)",
        hi: "4 − 2 = 2, कमी। वही कमी है जिससे दाब बढ़ाना इस साम्य को अमोनिया की ओर खिसकाता है: मिश्रण संपीड़ित करना उस ओर के पक्ष में है जो कम आयतन घेरे। जिस अभिक्रिया में गैस-मोलों का परिवर्तन न हो वह दाब से बिलकुल अप्रभावित रहती है। (6 दोनों पक्ष जोड़ देता है।)",
        mr: "4 − 2 = 2, घट. तीच घट ज्यामुळे दाब वाढवणे हा समतोल अमोनियाकडे सरकवते: मिश्रण संपीडित करणे कमी घनफळ व्यापणाऱ्या बाजूच्या पक्षात. ज्या अभिक्रियेत वायू-मोलांचा बदल नाही ती दाबाने पूर्णपणे अप्रभावित. (6 दोन्ही बाजू जोडते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A mixture has a reaction quotient Q of 5 while the equilibrium constant K is 20. What is the ratio K/Q?",
        hi: "किसी मिश्रण का अभिक्रिया भागफल Q = 5 है जबकि साम्य स्थिरांक K = 20. अनुपात K/Q क्या है?",
        mr: "एका मिश्रणाचा अभिक्रिया भागांक Q = 5 तर समतोल स्थिरांक K = 20. गुणोत्तर K/Q किती?",
      },
      answer: 4,
      wrong: [0.25, 100, 15],
      checkExpr: "20/5",
      solution: {
        en: "20/5 = 4, and since the ratio exceeds one, Q is below K and the reaction must run forward to raise Q until the two match. Had Q exceeded K the reaction would have run backwards instead. This single comparison replaces all the qualitative reasoning about which way a disturbance pushes. (0.25 inverts the ratio.)",
        hi: "20/5 = 4, और चूँकि अनुपात एक से बड़ा है, Q, K से नीचे है और अभिक्रिया को Q बढ़ाने के लिए आगे चलना होगा जब तक दोनों न मिल जाएँ। Q, K से बड़ा होता तो अभिक्रिया इसके बजाय पीछे चलती। यह अकेली तुलना उस सारे गुणात्मक तर्क की जगह ले लेती है कि विक्षोभ किस ओर धकेलता है। (0.25 अनुपात उलट देता है।)",
        mr: "20/5 = 4, आणि गुणोत्तर एकाहून मोठे असल्याने Q हा K खाली आहे आणि अभिक्रियेला Q वाढवण्यासाठी पुढे चालावे लागेल जोवर दोन्ही जुळत नाहीत. Q हा K हून मोठा असता तर अभिक्रिया त्याऐवजी मागे चालली असती. ही एकच तुलना विक्षोभ कोणत्या दिशेने ढकलतो या सर्व गुणात्मक युक्तिवादाची जागा घेते. (0.25 गुणोत्तर उलटे करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A strong acid solution has pH 2. It is diluted ten times with water. What is the new pH?",
        hi: "किसी प्रबल अम्ल विलयन का pH 2 है। उसे पानी से दस गुना पतला किया जाता है। नया pH क्या है?",
        mr: "एका प्रबळ आम्ल द्रावणाचा pH 2 आहे. ते पाण्याने दसपट पातळ केले जाते. नवा pH किती?",
      },
      answer: 3,
      wrong: [1, 20, 0.2],
      checkExpr: "2+1",
      solution: {
        en: "Tenfold dilution divides the hydrogen-ion concentration by ten, and pH is a logarithmic scale, so it rises by exactly one unit: pH 3. Note the limit, though — no amount of dilution takes a strong acid past about pH 7, because at that point the water's own ionisation is supplying more hydrogen ions than the acid is. (1 moves the pH the wrong way.)",
        hi: "दस गुना तनुकरण हाइड्रोजन-आयन सांद्रता को दस से भाग देता है, और pH लघुगणकीय पैमाना है, अतः वह ठीक एक इकाई चढ़ता है: pH 3. पर सीमा ध्यान दो — कितना भी तनुकरण प्रबल अम्ल को लगभग pH 7 से आगे नहीं ले जाता, क्योंकि उस बिंदु पर पानी का अपना आयनन अम्ल से अधिक हाइड्रोजन आयन दे रहा होता है। (1 pH को उलटी ओर हिला देता है।)",
        mr: "दसपट विरळीकरण हायड्रोजन-आयन संहती दहाने भागते, आणि pH ही लॉगरिथमी मापनश्रेणी, म्हणून तो नेमका एक एककाने चढतो: pH 3. पण मर्यादा लक्षात घ्या — कितीही विरळीकरण प्रबळ आम्लाला सुमारे pH 7 च्या पुढे नेत नाही, कारण त्या बिंदूवर पाण्याचे स्वतःचे आयनीकरण आम्लाहून अधिक हायड्रोजन आयन देत असते. (1 pH उलट दिशेने हलवते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In N₂ + 3H₂ ⇌ 2NH₃, the gas moles go from 4 to 2. By what factor does the mole count change on going forward?",
        hi: "N₂ + 3H₂ ⇌ 2NH₃ में गैस-मोल 4 से 2 हो जाते हैं। आगे बढ़ने पर मोल-गिनती किस गुणक से बदलती है?",
        mr: "N₂ + 3H₂ ⇌ 2NH₃ मध्ये वायू-मोल 4 वरून 2 होतात. पुढे जाताना मोल-मोजणी कोणत्या पटीने बदलते?",
      },
      answer: 0.5,
      wrong: [2, 4, 6],
      checkExpr: "2/4",
      solution: {
        en: "2/4 = 0.5: the forward reaction halves the number of gas molecules. Compressing the mixture therefore drives it forward, since the system relieves the pressure by occupying less volume — which is exactly why the Haber process runs at around 200 atmospheres. (2 inverts the ratio and describes the reverse reaction.)",
        hi: "2/4 = 0.5: अग्र अभिक्रिया गैस-अणुओं की संख्या आधी कर देती है। अतः मिश्रण संपीड़ित करना उसे आगे धकेलता है, क्योंकि निकाय कम आयतन घेरकर दाब घटाता है — ठीक इसीलिए हैबर प्रक्रम लगभग 200 वायुमंडल पर चलता है। (2 अनुपात उलटकर प्रतीप अभिक्रिया का वर्णन करता है।)",
        mr: "2/4 = 0.5: पुढची अभिक्रिया वायुरेणूंची संख्या निम्मी करते. म्हणून मिश्रण संपीडित करणे त्याला पुढे रेटते, कारण संच कमी घनफळ व्यापून दाब घटवतो — नेमके म्हणूनच हेबर प्रक्रिया सुमारे 200 वातावरणांवर चालते. (2 गुणोत्तर उलटवून मागच्या अभिक्रियेचे वर्णन करते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A buffer is made from an acid of pKa 4.74 with a salt-to-acid ratio of 10, so the logarithm of that ratio is 1. Using pH = pKa + log(ratio), what is the pH?",
        hi: "4.74 pKa वाले अम्ल से 10 के लवण-अम्ल अनुपात पर बफ़र बनाया जाता है, अतः उस अनुपात का लघुगणक 1 है। pH = pKa + log(अनुपात) लगाते हुए, pH क्या है?",
        mr: "4.74 pKa असलेल्या आम्लापासून 10 च्या क्षार-आम्ल गुणोत्तरावर बफर बनवले जाते, म्हणून त्या गुणोत्तराचा लॉगरिथम 1. pH = pKa + log(गुणोत्तर) वापरून, pH किती?",
      },
      answer: 5.74,
      wrong: [3.74, 4.74, 47.4],
      checkExpr: "4.74+1",
      solution: {
        en: "pH = 4.74 + 1 = 5.74. Note that a tenfold excess of salt buys only one pH unit, which is why buffers are effective over a narrow band — roughly pKa ± 1 — and why choosing an acid whose pKa is near the target pH matters far more than adjusting the ratio. Equal amounts of the two would give exactly 4.74. (3.74 subtracts the logarithm instead of adding it.)",
        hi: "pH = 4.74 + 1 = 5.74. ध्यान दो लवण की दस गुनी अधिकता केवल एक pH इकाई ख़रीदती है, इसीलिए बफ़र सँकरी पट्टी पर असरदार होते हैं — मोटे तौर पर pKa ± 1 — और इसीलिए ऐसा अम्ल चुनना जिसका pKa लक्ष्य pH के पास हो, अनुपात समायोजित करने से कहीं अधिक मायने रखता है। दोनों की बराबर मात्राएँ ठीक 4.74 देतीं। (3.74 लघुगणक जोड़ने के बजाय घटा देता है।)",
        mr: "pH = 4.74 + 1 = 5.74. लक्षात घ्या क्षाराचे दसपट अधिक्य केवळ एक pH एकक विकत घेते, म्हणूनच बफर अरुंद पट्ट्यावर प्रभावी असतात — ढोबळमानाने pKa ± 1 — आणि म्हणूनच ज्याचा pKa लक्ष्य pH जवळ आहे असे आम्ल निवडणे गुणोत्तर जुळवण्याहून कितीतरी अधिक महत्त्वाचे. दोघांची समान प्रमाणे नेमके 4.74 दिली असती. (3.74 लॉगरिथम जोडण्याऐवजी वजा करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "For A ⇌ 2B, one mole of A is placed in a one-litre vessel and 0.2 mol of A remains at equilibrium. How many moles of B are present?",
        hi: "A ⇌ 2B के लिए एक लीटर पात्र में एक मोल A रखा जाता है और साम्य पर 0.2 mol A बचता है। कितने मोल B मौजूद हैं?",
        mr: "A ⇌ 2B साठी एक लिटर भांड्यात एक मोल A ठेवला जातो आणि समतोलावर 0.2 mol A उरतो. किती मोल B उपस्थित आहेत?",
      },
      answer: 1.6,
      wrong: [0.8, 0.4, 2],
      checkExpr: "2*(1-0.2)",
      solution: {
        en: "0.8 mol of A reacted, and each mole of A gives two of B, so 2 × 0.8 = 1.6 mol of B. The coefficient must be applied: it is the commonest slip to report the amount consumed rather than the amount produced. (0.8 quotes the A that reacted and 0.4 halves it instead of doubling.)",
        hi: "0.8 mol A ने अभिक्रिया की, और A का हर मोल B के दो देता है, अतः 2 × 0.8 = 1.6 mol B. गुणांक लगाना ही पड़ता है: बनी मात्रा के बजाय खपी मात्रा बता देना सबसे आम चूक है। (0.8 अभिक्रिया कर चुके A को बताता है और 0.4 दोगुना करने के बजाय आधा कर देता है।)",
        mr: "0.8 mol A ने अभिक्रिया केली, आणि A चा प्रत्येक मोल B चे दोन देतो, म्हणून 2 × 0.8 = 1.6 mol B. गुणांक लावावाच लागतो: तयार झालेल्या प्रमाणाऐवजी वापरलेले प्रमाण सांगणे ही सर्वांत नेहमीची चूक. (0.8 अभिक्रिया केलेला A सांगते आणि 0.4 दुप्पट करण्याऐवजी निम्मे करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "In that same equilibrium A ⇌ 2B in a one-litre vessel, [A] = 0.2 M and [B] = 1.6 M. What is the equilibrium constant Kc?",
        hi: "उसी साम्य A ⇌ 2B में एक लीटर पात्र में [A] = 0.2 M और [B] = 1.6 M हैं। साम्य स्थिरांक Kc क्या है?",
        mr: "त्याच समतोल A ⇌ 2B मध्ये एक लिटर भांड्यात [A] = 0.2 M आणि [B] = 1.6 M. समतोल स्थिरांक Kc किती?",
      },
      answer: 12.8,
      wrong: [8, 2.56, 1.28],
      checkExpr: "1.6^2/0.2",
      solution: {
        en: "Kc = [B]²/[A] = 2.56/0.2 = 12.8. The square on B is the coefficient from the balanced equation, and leaving it out — which gives 8 — is the single commonest error in equilibrium arithmetic. Three things are worth reading off this number rather than just computing it. First, K is well above one, so the equilibrium lies towards B, as the composition already showed. Second, the units are not the same as for A ⇌ B: here Kc carries units of concentration, because the powers do not cancel, and this is why K values for different reactions cannot be compared directly. Third, and most usefully, K depends only on temperature — put in twice as much A and the concentrations will all shift, but this ratio will come back to 12.8. That invariance is what makes K worth tabulating, and it is what lets a chemist predict the resting composition of a mixture never yet prepared. (2.56 forgets to divide by [A], and 1.28 divides by ten somewhere.)",
        hi: "Kc = [B]²/[A] = 2.56/0.2 = 12.8. B पर वर्ग संतुलित समीकरण का गुणांक है, और उसे छोड़ देना — जो 8 देता है — साम्य-गणित की सबसे आम अकेली भूल है। इस संख्या को केवल निकालने के बजाय उससे तीन बातें पढ़ने योग्य हैं। पहली, K एक से काफ़ी ऊपर है, अतः साम्य B की ओर है, जैसा संघटन पहले ही दिखा चुका था। दूसरी, मात्रक A ⇌ B जैसे नहीं: यहाँ Kc सांद्रता के मात्रक ढोता है, क्योंकि घातें कटती नहीं, और इसीलिए भिन्न अभिक्रियाओं के K मानों की सीधी तुलना नहीं हो सकती। तीसरी, और सबसे उपयोगी, K केवल ताप पर निर्भर है — दोगुना A डालो और सारी सांद्रताएँ खिसक जाएँगी, पर यह अनुपात लौटकर 12.8 पर आ जाएगा। वही अपरिवर्तनीयता K को तालिकाबद्ध करने योग्य बनाती है, और वही रसायनज्ञ को ऐसे मिश्रण का विश्राम-संघटन बताने देती है जो अभी तक बनाया ही नहीं गया। (2.56 [A] से भाग देना भूलता है, और 1.28 कहीं दस से भाग दे देता है।)",
        mr: "Kc = [B]²/[A] = 2.56/0.2 = 12.8. B वरचा वर्ग हा संतुलित समीकरणाचा गुणांक, आणि तो सोडून देणे — जे 8 देते — ही समतोल-गणितातील सर्वांत नेहमीची एकमेव चूक. या संख्येला केवळ काढण्याऐवजी तिच्यावरून तीन गोष्टी वाचण्याजोग्या. पहिली, K एकाहून बराच वर, म्हणून समतोल B कडे, जसे संघटनाने आधीच दाखवले. दुसरी, एकके A ⇌ B सारखी नाहीत: इथे Kc संहतीची एकके वाहतो, कारण घात कापल्या जात नाहीत, आणि म्हणूनच वेगवेगळ्या अभिक्रियांच्या K मूल्यांची थेट तुलना होऊ शकत नाही. तिसरी, आणि सर्वांत उपयुक्त, K केवळ तापमानावर अवलंबून — दुप्पट A टाका आणि सर्व संहती सरकतील, पण हे गुणोत्तर परत 12.8 वर येईल. तीच अपरिवर्तनीयता K ला तक्त्यात मांडण्याजोगे बनवते, आणि तीच रसायनशास्त्रज्ञाला अजून बनवलेच नाही अशा मिश्रणाचे विश्रांती-संघटन सांगू देते. (2.56 [A] ने भागायचे विसरते, आणि 1.28 कुठेतरी दहाने भागते.)",
      },
    },
  ],
  "chemistry-11-redox-reactions": [
    {
      level: 1,
      stem: {
        en: "In H₂SO₄ the two hydrogens contribute +2 and the four oxygens −8. What is the oxidation number of sulphur?",
        hi: "H₂SO₄ में दो हाइड्रोजन +2 और चार ऑक्सीजन −8 का योगदान देते हैं। सल्फ़र की उपचयन संख्या क्या है?",
        mr: "H₂SO₄ मध्ये दोन हायड्रोजन +2 आणि चार ऑक्सिजन −8 चा वाटा देतात. गंधकाची ऑक्सिडीकरण संख्या किती?",
      },
      answer: 6,
      wrong: [4, 2, 8],
      checkExpr: "8-2",
      solution: {
        en: "The molecule is neutral, so the numbers must sum to zero: 2 + x − 8 = 0 gives x = +6. That is sulphur's maximum, matching its six valence electrons, which is why sulphuric acid is a good oxidising agent — the sulphur has nowhere higher to go. (4 is the oxidation number in sulphurous acid.)",
        hi: "अणु उदासीन है, अतः संख्याओं का योग शून्य होना चाहिए: 2 + x − 8 = 0 से x = +6. यह सल्फ़र का अधिकतम है, उसके छह संयोजी इलेक्ट्रॉनों से मेल खाता, इसीलिए सल्फ्यूरिक अम्ल अच्छा उपचायक है — सल्फ़र के पास और ऊपर जाने को जगह नहीं। (4 सल्फ्यूरस अम्ल की उपचयन संख्या है।)",
        mr: "रेणू उदासीन, म्हणून संख्यांची बेरीज शून्य असावी: 2 + x − 8 = 0 वरून x = +6. हे गंधकाचे कमाल, त्याच्या सहा संयुजा इलेक्ट्रॉनांशी जुळणारे, म्हणूनच सल्फ्युरिक आम्ल चांगला ऑक्सिडीकारक — गंधकाकडे आणखी वर जायला जागा नाही. (4 ही सल्फ्युरस आम्लाची ऑक्सिडीकरण संख्या.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "In KMnO₄ the potassium contributes +1 and the four oxygens −8. What is the oxidation number of manganese?",
        hi: "KMnO₄ में पोटैशियम +1 और चार ऑक्सीजन −8 का योगदान देते हैं। मैंगनीज़ की उपचयन संख्या क्या है?",
        mr: "KMnO₄ मध्ये पोटॅशियम +1 आणि चार ऑक्सिजन −8 चा वाटा देतात. मँगेनीजची ऑक्सिडीकरण संख्या किती?",
      },
      answer: 7,
      wrong: [5, 6, 4],
      checkExpr: "8-1",
      solution: {
        en: "1 + x − 8 = 0 gives x = +7, the highest oxidation state manganese reaches and the reason permanganate is such a powerful oxidising agent: it can only go down. The deep purple colour disappears as it falls to the almost colourless Mn²⁺, which is what makes it self-indicating in a titration. (6 is the manganate ion.)",
        hi: "1 + x − 8 = 0 से x = +7, मैंगनीज़ की सबसे ऊँची उपचयन अवस्था और यही कारण कि परमैंगनेट इतना प्रबल उपचायक है: वह केवल नीचे ही जा सकता है। गहरा बैंगनी रंग तब लुप्त हो जाता है जब वह लगभग रंगहीन Mn²⁺ तक गिरता है, और इसी से वह अनुमापन में स्वयं-सूचक बन जाता है। (6 मैंगनेट आयन है।)",
        mr: "1 + x − 8 = 0 वरून x = +7, मँगेनीजची सर्वांत उच्च ऑक्सिडीकरण अवस्था आणि हेच कारण की परमँगनेट इतका प्रबळ ऑक्सिडीकारक: तो केवळ खालीच जाऊ शकतो. गडद जांभळा रंग तेव्हा नाहीसा होतो जेव्हा तो जवळपास रंगहीन Mn²⁺ पर्यंत येतो, आणि यामुळेच तो अनुमापनात स्वयं-सूचक बनतो. (6 हा मँगनेट आयन.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "In K₂Cr₂O₇ the two potassiums give +2 and the seven oxygens −14, and there are two chromium atoms. What is the oxidation number of each chromium?",
        hi: "K₂Cr₂O₇ में दो पोटैशियम +2 और सात ऑक्सीजन −14 देते हैं, और क्रोमियम के दो परमाणु हैं। हर क्रोमियम की उपचयन संख्या क्या है?",
        mr: "K₂Cr₂O₇ मध्ये दोन पोटॅशियम +2 आणि सात ऑक्सिजन −14 देतात, आणि क्रोमियमचे दोन अणू आहेत. प्रत्येक क्रोमियमची ऑक्सिडीकरण संख्या किती?",
      },
      answer: 6,
      wrong: [3, 7, 12],
      checkExpr: "12/2",
      solution: {
        en: "2 + 2x − 14 = 0 gives 2x = 12 and x = +6 for each chromium. Dividing by the number of atoms is the step most often skipped — 12 is the total, not the value per atom. Dichromate is orange and falls to green Cr³⁺ on reduction. (12 quotes that total.)",
        hi: "2 + 2x − 14 = 0 से 2x = 12 और हर क्रोमियम के लिए x = +6. परमाणुओं की संख्या से भाग देना वही चरण है जो सबसे अधिक छूटता है — 12 कुल है, प्रति परमाणु मान नहीं। डाइक्रोमेट नारंगी है और अपचयन पर हरे Cr³⁺ तक गिरता है। (12 वही कुल बता देता है।)",
        mr: "2 + 2x − 14 = 0 वरून 2x = 12 आणि प्रत्येक क्रोमियमसाठी x = +6. अणूंच्या संख्येने भागणे हाच तो टप्पा जो सर्वाधिक वेळा वगळला जातो — 12 ही एकूण, प्रति अणू मूल्य नव्हे. डायक्रोमेट नारिंगी आणि क्षपणावर हिरव्या Cr³⁺ पर्यंत येतो. (12 तीच एकूण सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "An iron ion changes from Fe²⁺ to Fe³⁺. How many electrons does each ion lose?",
        hi: "एक लोहे का आयन Fe²⁺ से Fe³⁺ हो जाता है। हर आयन कितने इलेक्ट्रॉन खोता है?",
        mr: "एक लोखंडाचा आयन Fe²⁺ वरून Fe³⁺ होतो. प्रत्येक आयन किती इलेक्ट्रॉन गमावतो?",
      },
      answer: 1,
      wrong: [5, 2, 3],
      checkExpr: "3-2",
      solution: {
        en: "3 − 2 = 1 electron lost, so the iron has been oxidised. Losing electrons makes the charge more positive, which is worth fixing in mind because the arithmetic reads backwards at first glance — a rise in oxidation number always means a loss. (5 adds the two charges.)",
        hi: "3 − 2 = 1 इलेक्ट्रॉन खोया, अतः लोहा उपचयित हुआ। इलेक्ट्रॉन खोने से आवेश अधिक धनात्मक होता है, और यह मन में बिठाने योग्य है क्योंकि पहली नज़र में गणित उलटा पढ़ा जाता है — उपचयन संख्या का चढ़ना सदा हानि का अर्थ रखता है। (5 दोनों आवेश जोड़ देता है।)",
        mr: "3 − 2 = 1 इलेक्ट्रॉन गमावला, म्हणून लोखंड ऑक्सिडीकृत झाले. इलेक्ट्रॉन गमावल्याने भार अधिक धन होतो, आणि हे मनात बसवण्याजोगे कारण पहिल्या नजरेत गणित उलटे वाचले जाते — ऑक्सिडीकरण संख्येचे चढणे नेहमी हानीचा अर्थ राखते. (5 दोन्ही भार जोडते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "In HNO₃ the hydrogen gives +1 and the three oxygens −6. What is the oxidation number of nitrogen?",
        hi: "HNO₃ में हाइड्रोजन +1 और तीन ऑक्सीजन −6 देते हैं। नाइट्रोजन की उपचयन संख्या क्या है?",
        mr: "HNO₃ मध्ये हायड्रोजन +1 आणि तीन ऑक्सिजन −6 देतात. नायट्रोजनची ऑक्सिडीकरण संख्या किती?",
      },
      answer: 5,
      wrong: [3, 4, 7],
      checkExpr: "6-1",
      solution: {
        en: "1 + x − 6 = 0 gives x = +5, nitrogen's maximum and the reason concentrated nitric acid is such an aggressive oxidising agent. Nitrogen is unusual in reaching every oxidation state from −3 in ammonia to +5 here, which is why its chemistry is so varied. (3 is the value in nitrous acid.)",
        hi: "1 + x − 6 = 0 से x = +5, नाइट्रोजन का अधिकतम और यही कारण कि सांद्र नाइट्रिक अम्ल इतना आक्रामक उपचायक है। नाइट्रोजन असामान्य है कि वह अमोनिया के −3 से यहाँ के +5 तक हर उपचयन अवस्था तक पहुँचती है, इसीलिए उसका रसायन इतना विविध है। (3 नाइट्रस अम्ल का मान है।)",
        mr: "1 + x − 6 = 0 वरून x = +5, नायट्रोजनचे कमाल आणि हेच कारण की संहत नायट्रिक आम्ल इतका आक्रमक ऑक्सिडीकारक. नायट्रोजन असामान्य की तो अमोनियातील −3 पासून इथल्या +5 पर्यंत प्रत्येक ऑक्सिडीकरण अवस्थेपर्यंत पोहोचतो, म्हणूनच त्याचे रसायन इतके वैविध्यपूर्ण. (3 हे नायट्रस आम्लाचे मूल्य.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Dichromate is reduced from chromium at +6 to two Cr³⁺ ions at +3 each. How many electrons in total are gained?",
        hi: "डाइक्रोमेट +6 वाले क्रोमियम से अपचयित होकर +3 वाले दो Cr³⁺ आयन बनता है। कुल कितने इलेक्ट्रॉन प्राप्त होते हैं?",
        mr: "डायक्रोमेट +6 वरील क्रोमियमपासून क्षपित होऊन प्रत्येकी +3 वरचे दोन Cr³⁺ आयन बनते. एकूण किती इलेक्ट्रॉन मिळवले जातात?",
      },
      answer: 6,
      wrong: [3, 9, 12],
      checkExpr: "2*(6-3)",
      solution: {
        en: "Each chromium falls by three, and there are two of them: 2 × 3 = 6 electrons. That six is what makes dichromate such a useful titrant — one mole of it oxidises six moles of Fe²⁺, and the ratio comes straight from the electron count. (3 counts only one chromium.)",
        hi: "हर क्रोमियम तीन गिरता है, और वे दो हैं: 2 × 3 = 6 इलेक्ट्रॉन। वही छह डाइक्रोमेट को इतना उपयोगी अनुमापक बनाते हैं — उसका एक मोल Fe²⁺ के छह मोल का उपचयन करता है, और अनुपात सीधे इलेक्ट्रॉन-गिनती से आता है। (3 केवल एक क्रोमियम गिनता है।)",
        mr: "प्रत्येक क्रोमियम तीनने खाली येतो, आणि ते दोन आहेत: 2 × 3 = 6 इलेक्ट्रॉन. तेच सहा डायक्रोमेटला इतका उपयुक्त अनुमापक बनवतात — त्याचा एक मोल Fe²⁺ च्या सहा मोलचे ऑक्सिडीकरण करतो, आणि गुणोत्तर थेट इलेक्ट्रॉन-मोजणीतून येते. (3 फक्त एक क्रोमियम मोजते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In acid solution permanganate is reduced from manganese at +7 to Mn²⁺ at +2. How many electrons does each permanganate ion gain?",
        hi: "अम्लीय विलयन में परमैंगनेट +7 वाले मैंगनीज़ से अपचयित होकर +2 वाला Mn²⁺ बनता है। हर परमैंगनेट आयन कितने इलेक्ट्रॉन पाता है?",
        mr: "आम्लधर्मी द्रावणात परमँगनेट +7 वरील मँगेनीजपासून क्षपित होऊन +2 वरचा Mn²⁺ बनतो. प्रत्येक परमँगनेट आयन किती इलेक्ट्रॉन मिळवतो?",
      },
      answer: 5,
      wrong: [2, 9, 4],
      checkExpr: "7-2",
      solution: {
        en: "7 − 2 = 5 electrons per ion. That is why one mole of permanganate oxidises five moles of Fe²⁺, and the 1:5 ratio is what a titration calculation turns on. In alkaline solution the reduction stops at manganese dioxide, +4, and only three electrons are taken — so the same reagent has a different strength depending on the medium. (2 quotes the final oxidation state rather than the change.)",
        hi: "7 − 2 = 5 इलेक्ट्रॉन प्रति आयन। इसीलिए परमैंगनेट का एक मोल Fe²⁺ के पाँच मोल का उपचयन करता है, और 1:5 अनुपात पर ही अनुमापन की गणना टिकती है। क्षारीय विलयन में अपचयन मैंगनीज़ डाइऑक्साइड, +4, पर रुक जाता है और केवल तीन इलेक्ट्रॉन लिए जाते हैं — अतः वही अभिकर्मक माध्यम के अनुसार भिन्न प्रबलता रखता है। (2 परिवर्तन के बजाय अंतिम उपचयन अवस्था बता देता है।)",
        mr: "7 − 2 = 5 इलेक्ट्रॉन प्रति आयन. म्हणूनच परमँगनेटचा एक मोल Fe²⁺ च्या पाच मोलचे ऑक्सिडीकरण करतो, आणि 1:5 गुणोत्तरावरच अनुमापनाची गणना टेकते. आम्लारीधर्मी द्रावणात क्षपण मँगेनीज डायऑक्साइड, +4, वर थांबते आणि केवळ तीन इलेक्ट्रॉन घेतले जातात — म्हणून तोच अभिकर्मक माध्यमानुसार वेगळी प्रबळता राखतो. (2 बदलाऐवजी अंतिम ऑक्सिडीकरण अवस्था सांगते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Chlorine at oxidation number 0 disproportionates to chloride at −1 and hypochlorite at +1. What is the difference in oxidation number between the two products?",
        hi: "उपचयन संख्या 0 वाली क्लोरीन असमानुपातित होकर −1 वाला क्लोराइड और +1 वाला हाइपोक्लोराइट बनाती है। दोनों उत्पादों की उपचयन संख्याओं में अंतर क्या है?",
        mr: "ऑक्सिडीकरण संख्या 0 असलेला क्लोरिन असमानुपातित होऊन −1 वरचा क्लोराइड आणि +1 वरचा हायपोक्लोराइट बनतो. दोन्ही उत्पादांच्या ऑक्सिडीकरण संख्यांतील फरक किती?",
      },
      answer: 2,
      wrong: [0, 1, 3],
      checkExpr: "1-(-1)",
      solution: {
        en: "1 − (−1) = 2. The two products sit one unit either side of the starting element, so the electrons balance exactly: one chlorine atom gains one for every chlorine atom that loses one, and the equation needs equal amounts of the two products. Only an element starting in an intermediate state can do this. (0 subtracts the wrong way round and gets no difference at all.)",
        hi: "1 − (−1) = 2. दोनों उत्पाद आरंभिक तत्व के दोनों ओर एक-एक इकाई पर बैठते हैं, अतः इलेक्ट्रॉन ठीक-ठीक संतुलित हैं: जितने क्लोरीन परमाणु एक खोते हैं उतने ही एक पाते हैं, और समीकरण को दोनों उत्पादों की बराबर मात्राएँ चाहिए। यह केवल मध्यवर्ती अवस्था में शुरू होने वाला तत्व ही कर सकता है। (0 उलटा घटाकर कोई अंतर ही नहीं पाता।)",
        mr: "1 − (−1) = 2. दोन्ही उत्पादे सुरुवातीच्या मूलद्रव्याच्या दोन्ही बाजूंना एकेक एककावर बसतात, म्हणून इलेक्ट्रॉन नेमके संतुलित: जितके क्लोरिन अणू एक गमावतात तितकेच एक मिळवतात, आणि समीकरणाला दोन्ही उत्पादांची समान प्रमाणे लागतात. हे केवळ मध्यवर्ती अवस्थेत सुरू होणारे मूलद्रव्यच करू शकते. (0 उलटे वजा करून कोणताही फरक मिळवत नाही.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "In a titration 0.02 mol of permanganate is used, each ion taking 5 electrons, and each Fe²⁺ gives 1. How many moles of Fe²⁺ are oxidised?",
        hi: "अनुमापन में 0.02 mol परमैंगनेट लगता है, हर आयन 5 इलेक्ट्रॉन लेता है, और हर Fe²⁺ 1 देता है। कितने मोल Fe²⁺ का उपचयन होता है?",
        mr: "अनुमापनात 0.02 mol परमँगनेट वापरले जाते, प्रत्येक आयन 5 इलेक्ट्रॉन घेतो, आणि प्रत्येक Fe²⁺ 1 देतो. किती मोल Fe²⁺ चे ऑक्सिडीकरण होते?",
      },
      answer: 0.1,
      wrong: [0.004, 0.002, 0.5],
      checkExpr: "0.02*5",
      fmt: moles,
      solution: {
        en: "Electrons gained must equal electrons lost: 0.02 × 5 = 0.1 mol of electrons, and since each Fe²⁺ supplies one, 0.1 mol of iron is oxidised. Note that the stoichiometric ratio was never looked up — it was derived from the electron count, which is the whole advantage of the half-reaction method. (0.004 divides by five instead of multiplying.)",
        hi: "पाए इलेक्ट्रॉन खोए इलेक्ट्रॉनों के बराबर होने चाहिए: 0.02 × 5 = 0.1 mol इलेक्ट्रॉन, और चूँकि हर Fe²⁺ एक देता है, 0.1 mol लोहे का उपचयन होता है। ध्यान दो रससमीकरणमितीय अनुपात कहीं देखा ही नहीं गया — वह इलेक्ट्रॉन-गिनती से निकला, और अर्ध-अभिक्रिया विधि का पूरा लाभ यही है। (0.004 गुणा के बजाय पाँच से भाग देता है।)",
        mr: "मिळवलेले इलेक्ट्रॉन गमावलेल्या इलेक्ट्रॉनांइतके असावेत: 0.02 × 5 = 0.1 mol इलेक्ट्रॉन, आणि प्रत्येक Fe²⁺ एक देत असल्याने 0.1 mol लोखंडाचे ऑक्सिडीकरण होते. लक्षात घ्या रससमीकरणमितीय गुणोत्तर कुठेही पाहिलेच गेले नाही — ते इलेक्ट्रॉन-मोजणीतून निघाले, आणि अर्ध-अभिक्रिया पद्धतीचा अख्खा फायदा हाच. (0.004 गुणण्याऐवजी पाचने भागते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "In sodium tetrathionate Na₂S₄O₆ the two sodiums give +2 and the six oxygens −12, shared among four sulphur atoms. What is the average oxidation number of sulphur?",
        hi: "सोडियम टेट्राथायोनेट Na₂S₄O₆ में दो सोडियम +2 और छह ऑक्सीजन −12 देते हैं, जो चार सल्फ़र परमाणुओं में बँटते हैं। सल्फ़र की औसत उपचयन संख्या क्या है?",
        mr: "सोडियम टेट्राथायोनेट Na₂S₄O₆ मध्ये दोन सोडियम +2 आणि सहा ऑक्सिजन −12 देतात, जे चार गंधक अणूंत वाटले जातात. गंधकाची सरासरी ऑक्सिडीकरण संख्या किती?",
      },
      answer: 2.5,
      wrong: [2, 3, 6],
      checkExpr: "10/4",
      solution: {
        en: "2 + 4x − 12 = 0 gives 4x = 10 and x = +2.5. A fractional value should not be alarming — it is a straightforward consequence of the definition, which averages over atoms that are not in identical environments. In tetrathionate the four sulphurs really are different: the two on the outside are bonded to oxygen and sit at +5, while the two in the middle are bonded only to sulphur and sit at 0, and the average of 5, 0, 0 and 5 is 2.5. Two lessons follow. First, this is direct evidence that oxidation number is a bookkeeping device rather than a physical charge — no atom carries half an electron's worth of charge, and the +2.5 describes the formula rather than any particular sulphur. Second, the same thing happens in Fe₃O₄, where the average is +8/3 because the crystal contains one Fe²⁺ for every two Fe³⁺, and in the superoxides, where oxygen averages −0.5. Whenever an average comes out fractional it is a signal that the atoms of that element are not all alike, and it is worth asking which are which. (2 and 3 are the nearest whole numbers, and rounding is exactly the instinct to resist here.)",
        hi: "2 + 4x − 12 = 0 से 4x = 10 और x = +2.5. भिन्नात्मक मान चिंता की बात नहीं — वह परिभाषा का सीधा परिणाम है, जो उन परमाणुओं पर औसत निकालती है जो समान परिवेश में नहीं। टेट्राथायोनेट में चारों सल्फ़र सचमुच भिन्न हैं: बाहर के दो ऑक्सीजन से बँधे हैं और +5 पर बैठते हैं, जबकि बीच के दो केवल सल्फ़र से बँधे हैं और 0 पर, और 5, 0, 0 तथा 5 का औसत 2.5 है। दो सबक़ निकलते हैं। पहला, यह सीधा प्रमाण है कि उपचयन संख्या भौतिक आवेश नहीं बल्कि बहीखाता-युक्ति है — कोई परमाणु आधे इलेक्ट्रॉन जितना आवेश नहीं ढोता, और +2.5 सूत्र का वर्णन करता है, किसी विशेष सल्फ़र का नहीं। दूसरा, वही Fe₃O₄ में होता है, जहाँ औसत +8/3 है क्योंकि क्रिस्टल में हर दो Fe³⁺ पर एक Fe²⁺ है, और सुपरऑक्साइडों में, जहाँ ऑक्सीजन का औसत −0.5 है। जब भी औसत भिन्नात्मक निकले वह संकेत है कि उस तत्व के सब परमाणु एक-से नहीं, और यह पूछना सार्थक है कि कौन-सा कौन है। (2 और 3 निकटतम पूर्णांक हैं, और पूर्णांकन ठीक वही सहज प्रवृत्ति है जिसका यहाँ प्रतिरोध करना है।)",
        mr: "2 + 4x − 12 = 0 वरून 4x = 10 आणि x = +2.5. अपूर्णांकी मूल्य चिंतेची बाब नाही — तो व्याख्येचा थेट परिणाम, जी समान परिसरात नसलेल्या अणूंवर सरासरी काढते. टेट्राथायोनेटमध्ये चारही गंधक खरोखर वेगळे: बाहेरचे दोन ऑक्सिजनशी बांधलेले आणि +5 वर बसतात, तर मधले दोन केवळ गंधकाशी बांधलेले आणि 0 वर, आणि 5, 0, 0 व 5 यांची सरासरी 2.5. दोन धडे निघतात. पहिला, हा थेट पुरावा की ऑक्सिडीकरण संख्या ही भौतिक भार नव्हे तर वहीखाता-युक्ती — कोणताही अणू अर्ध्या इलेक्ट्रॉनइतका भार वाहत नाही, आणि +2.5 सूत्राचे वर्णन करते, कोणत्याही विशिष्ट गंधकाचे नाही. दुसरा, तेच Fe₃O₄ मध्ये घडते, जिथे सरासरी +8/3 कारण स्फटिकात प्रत्येक दोन Fe³⁺ मागे एक Fe²⁺, आणि सुपरऑक्साइडांत, जिथे ऑक्सिजनची सरासरी −0.5. जेव्हा जेव्हा सरासरी अपूर्णांकी निघते तेव्हा ते संकेत की त्या मूलद्रव्याचे सर्व अणू सारखे नाहीत, आणि कोणता कोणता हे विचारणे सार्थक. (2 आणि 3 हे जवळचे पूर्णांक, आणि पूर्णांकन हीच ती सहज प्रवृत्ती जिचा इथे प्रतिकार करायचा.)",
      },
    },
  ],
  "chemistry-11-organic-basic-principles": [
    {
      level: 1,
      stem: {
        en: "Alkanes have the general formula CₙH₂ₙ₊₂. How many hydrogens does the alkane with five carbons have?",
        hi: "ऐल्केनों का सामान्य सूत्र CₙH₂ₙ₊₂ है। पाँच कार्बन वाले ऐल्केन में कितने हाइड्रोजन हैं?",
        mr: "अल्केनांचे सामान्य सूत्र CₙH₂ₙ₊₂ आहे. पाच कार्बन असलेल्या अल्केनमध्ये किती हायड्रोजन आहेत?",
      },
      answer: 12,
      wrong: [10, 11, 5],
      checkExpr: "2*5+2",
      solution: {
        en: "2 × 5 + 2 = 12, giving C₅H₁₂, pentane. The plus two comes from the two ends of the chain, where a carbon has a spare hydrogen instead of a neighbour — which is why the term vanishes in a ring, where CₙH₂ₙ applies instead. (10 forgets the two ends.)",
        hi: "2 × 5 + 2 = 12, जिससे C₅H₁₂, पेंटेन मिलता है। जोड़ दो शृंखला के दोनों सिरों से आता है, जहाँ कार्बन के पास पड़ोसी के बजाय एक फ़ालतू हाइड्रोजन है — इसीलिए वलय में वह पद ग़ायब हो जाता है, जहाँ इसके बजाय CₙH₂ₙ लगता है। (10 दोनों सिरे भूल जाता है।)",
        mr: "2 × 5 + 2 = 12, ज्यातून C₅H₁₂, पेंटेन मिळते. अधिक दोन साखळीच्या दोन टोकांतून येते, जिथे कार्बनकडे शेजाऱ्याऐवजी एक जादा हायड्रोजन असतो — म्हणूनच वलयात ते पद नाहीसे होते, जिथे त्याऐवजी CₙH₂ₙ लागते. (10 दोन्ही टोके विसरते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "Successive members of a homologous series differ by a CH₂ unit. Taking C as 12 and H as 1, what is the difference in molar mass?",
        hi: "समजातीय श्रेणी के क्रमिक सदस्य एक CH₂ इकाई से भिन्न हैं। C को 12 और H को 1 लेते हुए, मोलर द्रव्यमान में अंतर क्या है?",
        mr: "समजातीय मालिकेचे क्रमवार सदस्य एका CH₂ एककाने वेगळे. C हा 12 आणि H हा 1 घेतल्यास, मोलर वस्तुमानातील फरक किती?",
      },
      answer: 14,
      wrong: [16, 12, 2],
      checkExpr: "12+2",
      solution: {
        en: "12 + 2 × 1 = 14 g/mol. Every step up any homologous series adds exactly this, which is why a list of molar masses in an alkane series reads 16, 30, 44, 58 — a constant difference that identifies the family at a glance. (16 uses an oxygen atom by mistake.)",
        hi: "12 + 2 × 1 = 14 g/mol. किसी भी समजातीय श्रेणी में हर क़दम ठीक यही जोड़ता है, इसीलिए ऐल्केन श्रेणी के मोलर द्रव्यमानों की सूची 16, 30, 44, 58 पढ़ी जाती है — अचर अंतर जो कुनबे को एक नज़र में पहचान देता है। (16 भूल से ऑक्सीजन परमाणु लगा देता है।)",
        mr: "12 + 2 × 1 = 14 g/mol. कोणत्याही समजातीय मालिकेत प्रत्येक पाऊल नेमके हेच जोडते, म्हणूनच अल्केन मालिकेच्या मोलर वस्तुमानांची यादी 16, 30, 44, 58 अशी वाचली जाते — अचल फरक जो कुटुंब एका नजरेत ओळखवतो. (16 चुकून ऑक्सिजन अणू वापरते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Alkenes have the general formula CₙH₂ₙ. How many hydrogens does the alkene with four carbons have?",
        hi: "ऐल्कीनों का सामान्य सूत्र CₙH₂ₙ है। चार कार्बन वाले ऐल्कीन में कितने हाइड्रोजन हैं?",
        mr: "अल्कीनांचे सामान्य सूत्र CₙH₂ₙ आहे. चार कार्बन असलेल्या अल्कीनमध्ये किती हायड्रोजन आहेत?",
      },
      answer: 8,
      wrong: [10, 6, 4],
      checkExpr: "2*4",
      solution: {
        en: "2 × 4 = 8, giving C₄H₈, butene. It has two hydrogens fewer than butane C₄H₁₀ because the double bond ties up one bonding position on each of two carbons — every degree of unsaturation costs two hydrogens. (10 quotes the alkane.)",
        hi: "2 × 4 = 8, जिससे C₄H₈, ब्यूटीन मिलता है। उसमें ब्यूटेन C₄H₁₀ से दो हाइड्रोजन कम हैं क्योंकि द्विबंध दो कार्बनों में से हर एक की एक आबंधन-स्थिति बाँध लेता है — असंतृप्तता की हर कोटि दो हाइड्रोजन की क़ीमत माँगती है। (10 ऐल्केन बता देता है।)",
        mr: "2 × 4 = 8, ज्यातून C₄H₈, ब्युटीन मिळते. त्यात ब्युटेन C₄H₁₀ हून दोन हायड्रोजन कमी कारण द्विबंध दोन कार्बनांपैकी प्रत्येकाची एक बंधन-जागा अडवतो — असंतृप्ततेची प्रत्येक कोटी दोन हायड्रोजनांची किंमत मागते. (10 अल्केन सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "The degree of unsaturation is (2n + 2 − H)/2 for a hydrocarbon with n carbons and H hydrogens. What is it for benzene, C₆H₆?",
        hi: "n कार्बन और H हाइड्रोजन वाले हाइड्रोकार्बन के लिए असंतृप्तता की कोटि (2n + 2 − H)/2 है। बेंज़ीन, C₆H₆, के लिए वह क्या है?",
        mr: "n कार्बन आणि H हायड्रोजन असलेल्या हायड्रोकार्बनसाठी असंतृप्ततेची कोटी (2n + 2 − H)/2 आहे. बेंझिन, C₆H₆, साठी ती किती?",
      },
      answer: 4,
      wrong: [3, 2, 8],
      checkExpr: "(2*6+2-6)/2",
      solution: {
        en: "(12 + 2 − 6)/2 = 8/2 = 4. Benzene has one ring and three double bonds, and each counts as one degree — which is exactly the four. The formula is a fast structural check: a compound with a degree of four is almost always aromatic, and one with zero is a saturated chain. (3 counts the double bonds and forgets the ring.)",
        hi: "(12 + 2 − 6)/2 = 8/2 = 4. बेंज़ीन में एक वलय और तीन द्विबंध हैं, और हर एक एक कोटि गिना जाता है — ठीक वही चार। सूत्र झटपट संरचनात्मक जाँच है: चार कोटि वाला यौगिक लगभग सदा ऐरोमैटिक होता है, और शून्य वाला संतृप्त शृंखला। (3 द्विबंध गिनता है और वलय भूल जाता है।)",
        mr: "(12 + 2 − 6)/2 = 8/2 = 4. बेंझिनमध्ये एक वलय आणि तीन द्विबंध, आणि प्रत्येक एक कोटी मोजला जातो — नेमके तेच चार. सूत्र ही झटपट संरचनात्मक तपासणी: चार कोटी असलेले संयुग जवळपास नेहमी सुगंधी, आणि शून्य असलेले संतृप्त साखळी. (3 द्विबंध मोजते आणि वलय विसरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Using the same formula, what is the degree of unsaturation for C₅H₈?",
        hi: "उसी सूत्र से, C₅H₈ के लिए असंतृप्तता की कोटि क्या है?",
        mr: "त्याच सूत्राने, C₅H₈ साठी असंतृप्ततेची कोटी किती?",
      },
      answer: 2,
      wrong: [1, 3, 4],
      checkExpr: "(2*5+2-8)/2",
      solution: {
        en: "(10 + 2 − 8)/2 = 4/2 = 2. Two degrees could mean two double bonds, or one triple bond, or one ring and one double bond — the count constrains the structure without determining it, and further evidence is needed to choose. (1 would be a simple alkene.)",
        hi: "(10 + 2 − 8)/2 = 4/2 = 2. दो कोटियों का अर्थ दो द्विबंध हो सकता है, या एक त्रिबंध, या एक वलय और एक द्विबंध — गिनती संरचना को बाँधती है, तय नहीं करती, और चुनने को और प्रमाण चाहिए। (1 सादा ऐल्कीन होता।)",
        mr: "(10 + 2 − 8)/2 = 4/2 = 2. दोन कोटींचा अर्थ दोन द्विबंध असू शकतो, वा एक त्रिबंध, वा एक वलय आणि एक द्विबंध — मोजणी संरचनेला बांधते, ठरवत नाही, आणि निवडायला आणखी पुरावा लागतो. (1 हे साधे अल्कीन ठरले असते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Ethane is C₂H₆ with a molar mass of 30. Taking C as 12, what percentage of its mass is carbon?",
        hi: "एथेन C₂H₆ है जिसका मोलर द्रव्यमान 30 है। C को 12 लेते हुए, उसके द्रव्यमान का कितना प्रतिशत कार्बन है?",
        mr: "इथेन हे C₂H₆ ज्याचे मोलर वस्तुमान 30. C हा 12 घेतल्यास, त्याच्या वस्तुमानाच्या किती टक्के कार्बन?",
      },
      answer: 80,
      wrong: [20, 40, 24],
      checkExpr: "100*24/30",
      solution: {
        en: "Two carbons weigh 24 out of 30, so 100 × 24/30 = 80 per cent. Hydrogen is only 20 per cent by mass although it supplies six of the eight atoms — a reminder that mass percentages and atom counts answer different questions. (20 quotes the hydrogen share.)",
        hi: "दो कार्बन 30 में से 24 तौलते हैं, अतः 100 × 24/30 = 80 प्रतिशत। हाइड्रोजन द्रव्यमान से केवल 20 प्रतिशत है यद्यपि वह आठ में से छह परमाणु देता है — यह स्मरण कि द्रव्यमान-प्रतिशत और परमाणु-गिनती भिन्न प्रश्नों के उत्तर देते हैं। (20 हाइड्रोजन का हिस्सा बता देता है।)",
        mr: "दोन कार्बन 30 पैकी 24 तोलतात, म्हणून 100 × 24/30 = 80 टक्के. हायड्रोजन वस्तुमानाने केवळ 20 टक्के जरी तो आठांपैकी सहा अणू देतो — ही आठवण की वस्तुमान-शेकडे आणि अणु-मोजणी वेगळ्या प्रश्नांची उत्तरे देतात. (20 हायड्रोजनचा वाटा सांगते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "An alkane has a molar mass of 72 g/mol, and CₙH₂ₙ₊₂ gives a mass of 14n + 2. How many carbons does it have?",
        hi: "किसी ऐल्केन का मोलर द्रव्यमान 72 g/mol है, और CₙH₂ₙ₊₂ से द्रव्यमान 14n + 2 मिलता है। उसमें कितने कार्बन हैं?",
        mr: "एका अल्केनचे मोलर वस्तुमान 72 g/mol, आणि CₙH₂ₙ₊₂ वरून वस्तुमान 14n + 2 मिळते. त्यात किती कार्बन आहेत?",
      },
      answer: 5,
      wrong: [4, 6, 72],
      checkExpr: "(72-2)/14",
      solution: {
        en: "14n + 2 = 72 gives n = 70/14 = 5, so the compound is C₅H₁₂. But the molar mass alone does not identify it: pentane, 2-methylbutane and 2,2-dimethylpropane are all C₅H₁₂ with boiling points of 36, 28 and 10 °C. Mass gives the formula, and only structure gives the substance. (4 would give a mass of 58.)",
        hi: "14n + 2 = 72 से n = 70/14 = 5, अतः यौगिक C₅H₁₂ है। पर अकेला मोलर द्रव्यमान उसे पहचानता नहीं: पेंटेन, 2-मेथिलब्यूटेन और 2,2-डाइमेथिलप्रोपेन सब C₅H₁₂ हैं जिनके क्वथनांक 36, 28 और 10 °C हैं। द्रव्यमान सूत्र देता है, और पदार्थ केवल संरचना देती है। (4 से 58 द्रव्यमान मिलता।)",
        mr: "14n + 2 = 72 वरून n = 70/14 = 5, म्हणून संयुग C₅H₁₂. पण एकटे मोलर वस्तुमान ते ओळखत नाही: पेंटेन, 2-मिथाइलब्युटेन आणि 2,2-डायमिथाइलप्रोपेन सर्व C₅H₁₂ ज्यांचे उकळबिंदू 36, 28 आणि 10 °C. वस्तुमान सूत्र देते, आणि पदार्थ केवळ संरचना देते. (4 ने 58 वस्तुमान मिळाले असते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "What is the degree of unsaturation for toluene, C₇H₈?",
        hi: "टॉलूईन, C₇H₈, के लिए असंतृप्तता की कोटि क्या है?",
        mr: "टोल्यूइन, C₇H₈, साठी असंतृप्ततेची कोटी किती?",
      },
      answer: 4,
      wrong: [3, 5, 6],
      checkExpr: "(2*7+2-8)/2",
      solution: {
        en: "(14 + 2 − 8)/2 = 8/2 = 4, the same as benzene — because the extra CH₃ group adds one carbon and two hydrogens, which is exactly the increment that leaves the degree unchanged. Any saturated substituent behaves this way, so the degree of unsaturation reports the ring-and-multiple-bond skeleton and ignores the decorations hung on it. (3 forgets the ring again.)",
        hi: "(14 + 2 − 8)/2 = 8/2 = 4, बेंज़ीन जितना ही — क्योंकि अतिरिक्त CH₃ समूह एक कार्बन और दो हाइड्रोजन जोड़ता है, और यही वह वृद्धि है जो कोटि अपरिवर्तित छोड़ देती है। कोई भी संतृप्त प्रतिस्थापी ऐसे ही व्यवहार करता है, अतः असंतृप्तता की कोटि वलय-और-बहुबंध ढाँचा बताती है और उस पर टँगी सजावटें अनदेखी कर देती है। (3 फिर वलय भूल जाता है।)",
        mr: "(14 + 2 − 8)/2 = 8/2 = 4, बेंझिनइतकीच — कारण जादा CH₃ गट एक कार्बन आणि दोन हायड्रोजन जोडतो, आणि हीच ती वाढ जी कोटी अपरिवर्तित ठेवते. कोणताही संतृप्त प्रतिस्थापक असाच वागतो, म्हणून असंतृप्ततेची कोटी वलय-आणि-बहुबंध सांगाडा सांगते आणि त्यावर टांगलेल्या सजावटी दुर्लक्षते. (3 पुन्हा वलय विसरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Alkynes have the general formula CₙH₂ₙ₋₂. How many hydrogens does the alkyne with six carbons have?",
        hi: "ऐल्काइनों का सामान्य सूत्र CₙH₂ₙ₋₂ है। छह कार्बन वाले ऐल्काइन में कितने हाइड्रोजन हैं?",
        mr: "अल्काइनांचे सामान्य सूत्र CₙH₂ₙ₋₂ आहे. सहा कार्बन असलेल्या अल्काइनमध्ये किती हायड्रोजन आहेत?",
      },
      answer: 10,
      wrong: [12, 14, 6],
      checkExpr: "2*6-2",
      solution: {
        en: "2 × 6 − 2 = 10, giving C₆H₁₀. Notice the series: the alkane C₆H₁₄, the alkene C₆H₁₂ and the alkyne C₆H₁₀ fall by two hydrogens at each step, because each extra bond between the same two carbons removes one bonding position from each. The degree of unsaturation counts up 0, 1, 2 in step. But C₆H₁₀ is also the formula of cyclohexene — one ring plus one double bond — so the formula alone cannot distinguish a triple bond from a ring with a double bond. (12 quotes the alkene.)",
        hi: "2 × 6 − 2 = 10, जिससे C₆H₁₀ मिलता है। श्रेणी ध्यान दो: ऐल्केन C₆H₁₄, ऐल्कीन C₆H₁₂ और ऐल्काइन C₆H₁₀ हर क़दम पर दो हाइड्रोजन गिरते हैं, क्योंकि उन्हीं दो कार्बनों के बीच हर अतिरिक्त बंध हर एक से एक आबंधन-स्थिति हटा देता है। असंतृप्तता की कोटि साथ-साथ 0, 1, 2 गिनती है। पर C₆H₁₀ साइक्लोहेक्सीन का भी सूत्र है — एक वलय जोड़ एक द्विबंध — अतः अकेला सूत्र त्रिबंध और द्विबंध वाले वलय में भेद नहीं कर सकता। (12 ऐल्कीन बता देता है।)",
        mr: "2 × 6 − 2 = 10, ज्यातून C₆H₁₀ मिळते. मालिका लक्षात घ्या: अल्केन C₆H₁₄, अल्कीन C₆H₁₂ आणि अल्काइन C₆H₁₀ प्रत्येक पावलावर दोन हायड्रोजन घटतात, कारण त्याच दोन कार्बनांमधला प्रत्येक जादा बंध प्रत्येकाकडून एक बंधन-जागा काढतो. असंतृप्ततेची कोटी सोबतच 0, 1, 2 मोजते. पण C₆H₁₀ हे सायक्लोहेक्सीनचेही सूत्र — एक वलय अधिक एक द्विबंध — म्हणून एकटे सूत्र त्रिबंध आणि द्विबंध असलेले वलय यांत फरक करू शकत नाही. (12 अल्कीन सांगते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A compound has the empirical formula CH₂, of formula mass 14, and its molar mass is measured as 56. How many carbon atoms are in one molecule?",
        hi: "किसी यौगिक का मूलानुपाती सूत्र CH₂ है, जिसका सूत्र-द्रव्यमान 14 है, और उसका मोलर द्रव्यमान 56 नापा गया है। एक अणु में कितने कार्बन परमाणु हैं?",
        mr: "एका संयुगाचे मूलानुपाती सूत्र CH₂, ज्याचे सूत्र-वस्तुमान 14, आणि त्याचे मोलर वस्तुमान 56 मोजले आहे. एका रेणूत किती कार्बन अणू आहेत?",
      },
      answer: 4,
      wrong: [2, 8, 14],
      checkExpr: "56/14",
      solution: {
        en: "56/14 = 4, so the molecular formula is C₄H₈ and there are four carbons. But notice how far that still is from identifying the compound. C₄H₈ has a degree of unsaturation of (10 − 8)/2 = 1, so it is either an alkene or a ring, and there are five distinct structures with this formula: but-1-ene, but-2-ene in two geometric forms, 2-methylpropene and cyclobutane. Their boiling points run from −7 °C to 4 °C and their chemistry differs sharply — cyclobutane will not decolourise bromine water and every alkene will. Three levels of information are in play, and each answers a narrower question than the last. Elemental analysis gives the empirical formula, the ratio. Molar mass gives the molecular formula, the count. Only spectroscopy or a chemical test gives the structure, the substance. The empirical formula CH₂ alone would have been consistent with ethene, propene, butene, cyclohexane and any number of others, all sharing the same 85.7 per cent carbon by mass, and this is exactly why a chemist reporting a new compound must supply more than a combustion analysis. (2 would be ethene and 8 would be C₈H₁₆, both consistent with the ratio and ruled out by the mass.)",
        hi: "56/14 = 4, अतः आण्विक सूत्र C₄H₈ है और चार कार्बन हैं। पर ध्यान दो यह यौगिक पहचानने से अब भी कितना दूर है। C₄H₈ की असंतृप्तता कोटि (10 − 8)/2 = 1 है, अतः वह या तो ऐल्कीन है या वलय, और इस सूत्र की पाँच भिन्न संरचनाएँ हैं: ब्यूट-1-ईन, दो ज्यामितीय रूपों में ब्यूट-2-ईन, 2-मेथिलप्रोपीन और साइक्लोब्यूटेन। उनके क्वथनांक −7 °C से 4 °C तक चलते हैं और उनका रसायन तीखे ढंग से भिन्न है — साइक्लोब्यूटेन ब्रोमीन जल का रंग नहीं उड़ाएगा और हर ऐल्कीन उड़ाएगा। सूचना के तीन स्तर खेल में हैं, और हर एक पिछले से संकरे प्रश्न का उत्तर देता है। तात्विक विश्लेषण मूलानुपाती सूत्र देता है, अनुपात। मोलर द्रव्यमान आण्विक सूत्र देता है, गिनती। संरचना, यानी पदार्थ, केवल स्पेक्ट्रममिति या रासायनिक परीक्षण देता है। अकेला मूलानुपाती सूत्र CH₂ एथीन, प्रोपीन, ब्यूटीन, साइक्लोहेक्सेन और अनगिनत औरों के अनुरूप होता, सबका द्रव्यमान से वही 85.7 प्रतिशत कार्बन, और ठीक इसीलिए नया यौगिक बताते रसायनज्ञ को दहन-विश्लेषण से अधिक देना पड़ता है। (2 एथीन होता और 8 C₈H₁₆, दोनों अनुपात के अनुरूप और द्रव्यमान से बाहर।)",
        mr: "56/14 = 4, म्हणून रेणवीय सूत्र C₄H₈ आणि चार कार्बन. पण लक्षात घ्या हे संयुग ओळखण्यापासून अजूनही किती दूर आहे. C₄H₈ ची असंतृप्तता कोटी (10 − 8)/2 = 1, म्हणून ते एकतर अल्कीन आहे वा वलय, आणि या सूत्राच्या पाच वेगळ्या संरचना: ब्युट-1-ईन, दोन भूमितीय रूपांतील ब्युट-2-ईन, 2-मिथाइलप्रोपीन आणि सायक्लोब्युटेन. त्यांचे उकळबिंदू −7 °C ते 4 °C पर्यंत चालतात आणि त्यांचे रसायन तीव्रपणे वेगळे — सायक्लोब्युटेन ब्रोमिन पाण्याचा रंग उडवणार नाही आणि प्रत्येक अल्कीन उडवेल. माहितीचे तीन स्तर खेळात, आणि प्रत्येक मागच्याहून अरुंद प्रश्नाचे उत्तर देतो. मूलद्रव्य-विश्लेषण मूलानुपाती सूत्र देते, गुणोत्तर. मोलर वस्तुमान रेणवीय सूत्र देते, मोजणी. संरचना, म्हणजे पदार्थ, केवळ वर्णपटमापन वा रासायनिक चाचणी देते. एकटे मूलानुपाती सूत्र CH₂ इथीन, प्रोपीन, ब्युटीन, सायक्लोहेक्सेन आणि असंख्य इतरांशी सुसंगत ठरले असते, सर्वांचे वस्तुमानाने तेच 85.7 टक्के कार्बन, आणि नेमके म्हणूनच नवे संयुग सांगणाऱ्या रसायनशास्त्रज्ञाला ज्वलन-विश्लेषणाहून अधिक द्यावे लागते. (2 हे इथीन ठरले असते आणि 8 हे C₈H₁₆, दोन्ही गुणोत्तराशी सुसंगत आणि वस्तुमानाने बाद.)",
      },
    },
  ],
  "chemistry-11-hydrocarbons": [
    {
      level: 1,
      stem: {
        en: "Complete combustion of methane follows CH₄ + 2O₂ → CO₂ + 2H₂O. How many moles of oxygen are needed to burn 3 moles of methane?",
        hi: "मीथेन का पूर्ण दहन CH₄ + 2O₂ → CO₂ + 2H₂O के अनुसार होता है। 3 मोल मीथेन जलाने को कितने मोल ऑक्सीजन चाहिए?",
        mr: "मिथेनचे पूर्ण ज्वलन CH₄ + 2O₂ → CO₂ + 2H₂O प्रमाणे होते. 3 मोल मिथेन जाळायला किती मोल ऑक्सिजन लागतो?",
      },
      answer: 6,
      wrong: [3, 2, 5],
      checkExpr: "3*2",
      solution: {
        en: "The coefficients read two oxygen for every one methane, so 3 × 2 = 6 mol. This is why a burner starved of air makes carbon monoxide and soot instead: the fuel is unchanged but the oxygen supply is short, and incomplete combustion is a shortage rather than a different reaction. (3 copies the methane figure.)",
        hi: "गुणांक बताते हैं हर एक मीथेन पर दो ऑक्सीजन, अतः 3 × 2 = 6 mol. इसीलिए हवा से भूखा बर्नर कार्बन मोनोऑक्साइड और कालिख बनाता है: ईंधन वही है पर ऑक्सीजन की आपूर्ति कम, और अपूर्ण दहन कमी है, कोई भिन्न अभिक्रिया नहीं। (3 मीथेन का आँकड़ा नक़ल कर देता है।)",
        mr: "गुणांक सांगतात प्रत्येक एका मिथेनमागे दोन ऑक्सिजन, म्हणून 3 × 2 = 6 mol. म्हणूनच हवेने उपाशी बर्नर कार्बन मोनॉक्साइड आणि काजळी बनवतो: इंधन तेच पण ऑक्सिजनचा पुरवठा कमी, आणि अपूर्ण ज्वलन ही कमतरता आहे, वेगळी अभिक्रिया नव्हे. (3 मिथेनचा आकडा नक्कल करते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "Ethene is C₂H₄ with a molar mass of 28 g/mol. How many moles are there in 84 g?",
        hi: "एथीन C₂H₄ है जिसका मोलर द्रव्यमान 28 g/mol है। 84 g में कितने मोल हैं?",
        mr: "इथीन हे C₂H₄ ज्याचे मोलर वस्तुमान 28 g/mol. 84 g मध्ये किती मोल आहेत?",
      },
      answer: 3,
      wrong: [2, 4, 28],
      checkExpr: "84/28",
      solution: {
        en: "84/28 = 3 mol. Ethene is the most-produced organic chemical in the world, and it is counted in moles rather than grams because every reaction it undergoes — to polythene, to ethanol, to ethylene glycol — consumes it one molecule at a time. (2 divides by an alkane's mass by mistake.)",
        hi: "84/28 = 3 mol. एथीन विश्व में सबसे अधिक बनाया जाने वाला कार्बनिक रसायन है, और उसे ग्राम के बजाय मोल में गिना जाता है क्योंकि उसकी हर अभिक्रिया — पॉलिथीन तक, एथेनॉल तक, एथिलीन ग्लाइकॉल तक — उसे एक-एक अणु करके खपाती है। (2 भूल से किसी ऐल्केन के द्रव्यमान से भाग देता है।)",
        mr: "84/28 = 3 mol. इथीन हे जगात सर्वाधिक बनवले जाणारे कार्बनी रसायन, आणि ते ग्रॅमऐवजी मोलमध्ये मोजले जाते कारण त्याची प्रत्येक अभिक्रिया — पॉलिथीनपर्यंत, इथेनॉलपर्यंत, इथिलीन ग्लायकॉलपर्यंत — त्याला एकेक रेणू करून वापरते. (2 चुकून एका अल्केनच्या वस्तुमानाने भागते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Complete combustion of ethane follows 2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O. How many moles of carbon dioxide come from 6 moles of ethane?",
        hi: "एथेन का पूर्ण दहन 2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O के अनुसार होता है। 6 मोल एथेन से कितने मोल कार्बन डाइऑक्साइड मिलती है?",
        mr: "इथेनचे पूर्ण ज्वलन 2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O प्रमाणे होते. 6 मोल इथेनपासून किती मोल कार्बन डायऑक्साइड मिळतो?",
      },
      answer: 12,
      wrong: [6, 4, 24],
      checkExpr: "6*4/2",
      solution: {
        en: "The ratio is 4 CO₂ for every 2 ethane, so 6 × 4/2 = 12 mol. The shortcut worth noticing is that every carbon in the fuel becomes one carbon dioxide, and ethane has two carbons — 6 × 2 = 12 without touching the equation at all. (6 assumes one CO₂ per molecule of fuel.)",
        hi: "अनुपात हर 2 एथेन पर 4 CO₂ है, अतः 6 × 4/2 = 12 mol. ध्यान देने योग्य छोटा रास्ता यह है कि ईंधन का हर कार्बन एक कार्बन डाइऑक्साइड बनता है, और एथेन में दो कार्बन हैं — समीकरण छुए बिना 6 × 2 = 12. (6 मान लेता है कि ईंधन के हर अणु पर एक CO₂.)",
        mr: "गुणोत्तर प्रत्येक 2 इथेनमागे 4 CO₂, म्हणून 6 × 4/2 = 12 mol. लक्षात घेण्याजोगी शॉर्टकट अशी की इंधनातला प्रत्येक कार्बन एक कार्बन डायऑक्साइड बनतो, आणि इथेनमध्ये दोन कार्बन — समीकरणाला हातही न लावता 6 × 2 = 12. (6 गृहीत धरते की इंधनाच्या प्रत्येक रेणूमागे एक CO₂.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "One mole of ethyne, C₂H₂, adds two moles of hydrogen to become ethane. How many moles of hydrogen does 5 moles of ethyne need?",
        hi: "एक मोल एथाइन, C₂H₂, दो मोल हाइड्रोजन जोड़कर एथेन बन जाता है। 5 मोल एथाइन को कितने मोल हाइड्रोजन चाहिए?",
        mr: "एक मोल इथाइन, C₂H₂, दोन मोल हायड्रोजन जोडून इथेन बनते. 5 मोल इथाइनला किती मोल हायड्रोजन लागतो?",
      },
      answer: 10,
      wrong: [5, 15, 2],
      checkExpr: "5*2",
      solution: {
        en: "5 × 2 = 10 mol, because a triple bond takes two molecules of hydrogen — one to reach the double bond and one to reach the single. With a poisoned catalyst the reaction can be stopped after the first, which is exactly how ethene is made from ethyne industrially. (5 counts one addition only.)",
        hi: "5 × 2 = 10 mol, क्योंकि त्रिबंध दो अणु हाइड्रोजन लेता है — एक द्विबंध तक पहुँचने को और एक एकल तक। विषाक्त उत्प्रेरक से अभिक्रिया पहले के बाद रोकी जा सकती है, और उद्योग में एथाइन से एथीन ठीक ऐसे ही बनता है। (5 केवल एक योग गिनता है।)",
        mr: "5 × 2 = 10 mol, कारण त्रिबंध दोन रेणू हायड्रोजन घेतो — एक द्विबंधापर्यंत पोहोचायला आणि एक एकेरीपर्यंत. विषबाधित उत्प्रेरकाने अभिक्रिया पहिल्यानंतर थांबवता येते, आणि उद्योगात इथाइनपासून इथीन नेमके असेच बनते. (5 केवळ एक योग मोजते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Complete combustion of propane follows C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. How many moles of water come from 4 moles of propane?",
        hi: "प्रोपेन का पूर्ण दहन C₃H₈ + 5O₂ → 3CO₂ + 4H₂O के अनुसार होता है। 4 मोल प्रोपेन से कितने मोल पानी मिलता है?",
        mr: "प्रोपेनचे पूर्ण ज्वलन C₃H₈ + 5O₂ → 3CO₂ + 4H₂O प्रमाणे होते. 4 मोल प्रोपेनपासून किती मोल पाणी मिळते?",
      },
      answer: 16,
      wrong: [12, 4, 8],
      checkExpr: "4*4",
      solution: {
        en: "Four water per propane, so 4 × 4 = 16 mol. Again the formula alone would do it: eight hydrogens make four waters, since water takes two each. This is why a cold window fogs above a gas flame — burning a hydrocarbon produces water as surely as it produces carbon dioxide. (12 quotes the carbon dioxide instead.)",
        hi: "प्रति प्रोपेन चार पानी, अतः 4 × 4 = 16 mol. फिर अकेला सूत्र काम कर देता: आठ हाइड्रोजन चार पानी बनाते हैं, क्योंकि पानी हर बार दो लेता है। इसीलिए गैस की लौ के ऊपर ठंडी खिड़की धुँधली हो जाती है — हाइड्रोकार्बन जलाना उतनी ही निश्चितता से पानी बनाता है जितनी कार्बन डाइऑक्साइड। (12 उसके बजाय कार्बन डाइऑक्साइड बता देता है।)",
        mr: "प्रति प्रोपेन चार पाणी, म्हणून 4 × 4 = 16 mol. पुन्हा एकटे सूत्रच पुरले असते: आठ हायड्रोजन चार पाणी बनवतात, कारण पाणी प्रत्येक वेळी दोन घेते. म्हणूनच गॅसच्या ज्योतीवर थंड खिडकी धूसर होते — हायड्रोकार्बन जाळणे कार्बन डायऑक्साइडइतक्याच निश्चितीने पाणी बनवते. (12 त्याऐवजी कार्बन डायऑक्साइड सांगते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Benzene is C₆H₆ with a molar mass of 78 g/mol. What mass, in grams, is 0.5 mol?",
        hi: "बेंज़ीन C₆H₆ है जिसका मोलर द्रव्यमान 78 g/mol है। 0.5 mol का द्रव्यमान ग्राम में कितना है?",
        mr: "बेंझिन हे C₆H₆ ज्याचे मोलर वस्तुमान 78 g/mol. 0.5 mol चे वस्तुमान ग्रॅममध्ये किती?",
      },
      answer: 39,
      wrong: [78, 156, 12],
      checkExpr: "0.5*78",
      solution: {
        en: "0.5 × 78 = 39 g. Note that benzene's percentage of carbon is 72/78, over 92 per cent, the highest of any common hydrocarbon of its size — which is why aromatic fuels burn with a smoky yellow flame: there is more carbon than the available oxygen can reach. (78 forgets to halve.)",
        hi: "0.5 × 78 = 39 g. ध्यान दो कि बेंज़ीन में कार्बन का प्रतिशत 72/78 है, 92 प्रतिशत से ऊपर, उसके आकार के किसी भी सामान्य हाइड्रोकार्बन से अधिक — इसीलिए ऐरोमैटिक ईंधन धुँआदार पीली लौ से जलते हैं: कार्बन उससे अधिक है जितने तक उपलब्ध ऑक्सीजन पहुँच सके। (78 आधा करना भूल जाता है।)",
        mr: "0.5 × 78 = 39 g. लक्षात घ्या की बेंझिनमधले कार्बनचे शेकडा 72/78, 92 टक्क्यांहून अधिक, त्याच्या आकाराच्या कोणत्याही सामान्य हायड्रोकार्बनहून जास्त — म्हणूनच सुगंधी इंधने धुरकट पिवळ्या ज्योतीने जळतात: कार्बन उपलब्ध ऑक्सिजन पोहोचू शकेल त्याहून अधिक आहे. (78 अर्धे करायला विसरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Burning 2 moles of a hydrocarbon gives 8 moles of carbon dioxide. How many carbon atoms does one molecule contain?",
        hi: "किसी हाइड्रोकार्बन के 2 मोल जलाने पर 8 मोल कार्बन डाइऑक्साइड मिलती है। एक अणु में कितने कार्बन परमाणु हैं?",
        mr: "एका हायड्रोकार्बनचे 2 मोल जाळल्यास 8 मोल कार्बन डायऑक्साइड मिळतो. एका रेणूत किती कार्बन अणू आहेत?",
      },
      answer: 4,
      wrong: [8, 2, 16],
      checkExpr: "8/2",
      solution: {
        en: "Every carbon in the fuel ends as one CO₂, so 8/2 = 4 carbons per molecule. Combustion analysis works exactly on this principle: measure the carbon dioxide and you have counted the carbons, measure the water and you have counted the hydrogens, and the two together give the empirical formula. (8 forgets that two moles were burnt.)",
        hi: "ईंधन का हर कार्बन एक CO₂ बनकर समाप्त होता है, अतः 8/2 = 4 कार्बन प्रति अणु। दहन-विश्लेषण ठीक इसी सिद्धांत पर चलता है: कार्बन डाइऑक्साइड नापो और तुमने कार्बन गिन लिए, पानी नापो और तुमने हाइड्रोजन गिन लिए, और दोनों मिलकर मूलानुपाती सूत्र देते हैं। (8 भूल जाता है कि दो मोल जलाए गए थे।)",
        mr: "इंधनातला प्रत्येक कार्बन एक CO₂ बनून संपतो, म्हणून 8/2 = 4 कार्बन प्रति रेणू. ज्वलन-विश्लेषण नेमके याच तत्त्वावर चालते: कार्बन डायऑक्साइड मोजा आणि तुम्ही कार्बन मोजले, पाणी मोजा आणि तुम्ही हायड्रोजन मोजले, आणि दोन्ही मिळून मूलानुपाती सूत्र देतात. (8 विसरते की दोन मोल जाळले होते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Hydrogenating one mole of cyclohexene releases 120 kJ. If benzene behaved as three separate double bonds, how many kilojoules would one mole release?",
        hi: "एक मोल साइक्लोहेक्सीन का हाइड्रोजनीकरण 120 kJ छोड़ता है। यदि बेंज़ीन तीन पृथक द्विबंधों जैसा व्यवहार करता, तो एक मोल कितने किलोजूल छोड़ता?",
        mr: "एक मोल सायक्लोहेक्सीनचे हायड्रोजनीकरण 120 kJ सोडते. बेंझिनने तीन वेगळ्या द्विबंधांसारखे वर्तन केले असते, तर एक मोल किती किलोज्यूल सोडले असते?",
      },
      answer: 360,
      wrong: [240, 120, 210],
      checkExpr: "3*120",
      solution: {
        en: "3 × 120 = 360 kJ. The measured value is only about 210 kJ, and the 150 kJ shortfall is the resonance energy — the amount by which the real molecule sits below the imaginary one with three isolated double bonds. That gap is not a correction to the arithmetic; it is the arithmetic revealing that the model was wrong. (210 quotes the measured value the question is asking us to compare against.)",
        hi: "3 × 120 = 360 kJ. नापा गया मान केवल लगभग 210 kJ है, और 150 kJ की कमी अनुनाद ऊर्जा है — वह मात्रा जितनी असली अणु उस काल्पनिक अणु से नीचे बैठता है जिसमें तीन पृथक द्विबंध हों। वह अंतर गणित का सुधार नहीं; वह गणित का यह उजागर करना है कि प्रतिरूप ग़लत था। (210 वही नापा गया मान बता देता है जिससे प्रश्न तुलना कराना चाहता है।)",
        mr: "3 × 120 = 360 kJ. मोजलेले मूल्य केवळ सुमारे 210 kJ, आणि 150 kJ ची तूट म्हणजे अनुनाद ऊर्जा — तीन वेगळे द्विबंध असलेल्या काल्पनिक रेणूहून खरा रेणू जितका खाली बसतो ते प्रमाण. ती दरी गणिताची दुरुस्ती नव्हे; ते गणित उघड करते की प्रतिमान चुकीचे होते. (210 प्रश्न ज्याच्याशी तुलना करायला सांगतो तेच मोजलेले मूल्य सांगते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Complete combustion of butane follows 2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O. How many moles of oxygen are needed for 4 moles of butane?",
        hi: "ब्यूटेन का पूर्ण दहन 2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O के अनुसार होता है। 4 मोल ब्यूटेन को कितने मोल ऑक्सीजन चाहिए?",
        mr: "ब्युटेनचे पूर्ण ज्वलन 2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O प्रमाणे होते. 4 मोल ब्युटेनला किती मोल ऑक्सिजन लागतो?",
      },
      answer: 26,
      wrong: [13, 52, 6.5],
      checkExpr: "4*13/2",
      solution: {
        en: "The ratio is 13 oxygen for every 2 butane, so 4 × 13/2 = 26 mol. The odd coefficient is worth a comment. Butane needs six and a half molecules of oxygen per molecule of fuel, and since half a molecule is meaningless the whole equation is doubled to clear the fraction. That is the only reason the coefficients look ungainly. The practical consequence is the reason a gas cylinder is dangerous in a closed room: 26 moles of oxygen is about 124 moles of air, so every litre of butane vapour demands roughly thirty litres of air to burn cleanly, and a room that cannot supply it produces carbon monoxide instead. (13 forgets that four moles, not two, are being burnt.)",
        hi: "अनुपात हर 2 ब्यूटेन पर 13 ऑक्सीजन है, अतः 4 × 13/2 = 26 mol. विषम गुणांक टिप्पणी के योग्य है। ब्यूटेन को प्रति अणु ईंधन साढ़े छह अणु ऑक्सीजन चाहिए, और चूँकि आधा अणु निरर्थक है, भिन्न हटाने को पूरा समीकरण दोगुना कर दिया जाता है। गुणांक भद्दे दिखने का बस यही कारण है। व्यावहारिक परिणाम वही है जिससे बंद कमरे में गैस सिलिंडर ख़तरनाक होता है: 26 मोल ऑक्सीजन लगभग 124 मोल हवा है, अतः ब्यूटेन वाष्प के हर लीटर को साफ़ जलने के लिए मोटे तौर पर तीस लीटर हवा चाहिए, और जो कमरा वह न दे सके वह उसके बजाय कार्बन मोनोऑक्साइड बनाता है। (13 भूल जाता है कि दो नहीं, चार मोल जलाए जा रहे हैं।)",
        mr: "गुणोत्तर प्रत्येक 2 ब्युटेनमागे 13 ऑक्सिजन, म्हणून 4 × 13/2 = 26 mol. विषम गुणांक टिप्पणीस पात्र. ब्युटेनला प्रति रेणू इंधन साडेसहा रेणू ऑक्सिजन लागतो, आणि अर्धा रेणू निरर्थक असल्याने अपूर्णांक घालवायला अख्खे समीकरण दुप्पट केले जाते. गुणांक बेढब दिसण्याचे बस्स तेच कारण. व्यावहारिक परिणाम तोच ज्यामुळे बंद खोलीत गॅस सिलिंडर धोकादायक: 26 मोल ऑक्सिजन म्हणजे सुमारे 124 मोल हवा, म्हणून ब्युटेन वाफेच्या प्रत्येक लिटरला स्वच्छ जळायला ढोबळमानाने तीस लिटर हवा लागते, आणि जी खोली ती देऊ शकत नाही ती त्याऐवजी कार्बन मोनॉक्साइड बनवते. (13 विसरते की दोन नव्हे, चार मोल जाळले जात आहेत.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Burning 1 mole of a hydrocarbon gives 3 moles of carbon dioxide and 4 moles of water. How many hydrogen atoms are in one molecule?",
        hi: "किसी हाइड्रोकार्बन का 1 मोल जलाने पर 3 मोल कार्बन डाइऑक्साइड और 4 मोल पानी मिलता है। एक अणु में कितने हाइड्रोजन परमाणु हैं?",
        mr: "एका हायड्रोकार्बनचे 1 मोल जाळल्यास 3 मोल कार्बन डायऑक्साइड आणि 4 मोल पाणी मिळते. एका रेणूत किती हायड्रोजन अणू आहेत?",
      },
      answer: 8,
      wrong: [4, 6, 3],
      checkExpr: "4*2",
      solution: {
        en: "Each water carries two hydrogens, so 4 × 2 = 8 hydrogens, and each carbon dioxide carries one carbon, so there are 3 carbons. The molecular formula is C₃H₈ and the compound is propane. Notice how much this single experiment settles and how it settles it. The carbon dioxide counts the carbons and the water counts the hydrogens, and because the fuel was one mole the counts are per molecule directly, with no ratio to reduce. Check the answer against the general formula: an alkane with three carbons should have 2 × 3 + 2 = 8 hydrogens, and it does, so the degree of unsaturation is zero and the molecule is a saturated chain with no ring and no multiple bond. Propane has only one structure, so in this particular case combustion analysis has identified the compound outright — which is unusual and worth noticing as unusual. Had the answer come out as C₄H₈ there would have been five candidate structures and the analysis would have been silent about which. There is a second check available, and a careful chemist uses it. Balancing the equation gives C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, so the experiment should have consumed five moles of oxygen. If the measured oxygen were four or six, the mass balance would not close and something in the experiment — incomplete combustion, a leak, water condensing in the wrong place — would need finding before the formula could be trusted. The habit generalises far beyond this chapter: a result that satisfies only the equation you used to derive it has been checked once, and a result that also satisfies an independent relation has been checked twice. (4 quotes the moles of water without doubling; 6 doubles the carbon figure instead; and 3 reports the carbons.)",
        hi: "हर पानी दो हाइड्रोजन ढोता है, अतः 4 × 2 = 8 हाइड्रोजन, और हर कार्बन डाइऑक्साइड एक कार्बन ढोती है, अतः 3 कार्बन हैं। आण्विक सूत्र C₃H₈ है और यौगिक प्रोपेन। ध्यान दो यह अकेला प्रयोग कितना तय कर देता है और कैसे तय करता है। कार्बन डाइऑक्साइड कार्बन गिनती है और पानी हाइड्रोजन, और चूँकि ईंधन एक मोल था, गिनतियाँ सीधे प्रति अणु हैं, घटाने को कोई अनुपात नहीं। उत्तर को सामान्य सूत्र से जाँचो: तीन कार्बन वाले ऐल्केन में 2 × 3 + 2 = 8 हाइड्रोजन होने चाहिए, और हैं, अतः असंतृप्तता की कोटि शून्य है और अणु बिना वलय बिना बहुबंध की संतृप्त शृंखला है। प्रोपेन की केवल एक संरचना है, अतः इस विशेष हाल में दहन-विश्लेषण ने यौगिक सीधे पहचान लिया — जो असामान्य है और असामान्य के रूप में ध्यान देने योग्य। यदि उत्तर C₄H₈ निकलता तो पाँच उम्मीदवार संरचनाएँ होतीं और विश्लेषण चुप रहता कि कौन-सी। एक दूसरी जाँच उपलब्ध है, और सावधान रसायनज्ञ उसे काम में लेता है। समीकरण संतुलित करने पर C₃H₈ + 5O₂ → 3CO₂ + 4H₂O मिलता है, अतः प्रयोग में पाँच मोल ऑक्सीजन ख़र्च होनी चाहिए थी। नापी गई ऑक्सीजन चार या छह होती तो द्रव्यमान-संतुलन बंद न होता और प्रयोग में कुछ — अपूर्ण दहन, कोई रिसाव, ग़लत जगह संघनित होता पानी — सूत्र पर भरोसा करने से पहले खोजना पड़ता। आदत इस अध्याय से कहीं आगे तक फैलती है: जो परिणाम केवल उसी समीकरण को संतुष्ट करे जिससे वह निकाला गया, वह एक बार जाँचा गया, और जो एक स्वतंत्र संबंध भी संतुष्ट करे, वह दो बार। (4 पानी के मोल बिना दोगुना किए बता देता है; 6 उसके बजाय कार्बन का आँकड़ा दोगुना करता है; और 3 कार्बन बता देता है।)",
        mr: "प्रत्येक पाणी दोन हायड्रोजन वाहते, म्हणून 4 × 2 = 8 हायड्रोजन, आणि प्रत्येक कार्बन डायऑक्साइड एक कार्बन वाहतो, म्हणून 3 कार्बन आहेत. रेणवीय सूत्र C₃H₈ आणि संयुग प्रोपेन. लक्षात घ्या हा एकटा प्रयोग किती ठरवतो आणि कसे ठरवतो. कार्बन डायऑक्साइड कार्बन मोजतो आणि पाणी हायड्रोजन, आणि इंधन एक मोल असल्याने मोजण्या थेट प्रति रेणू आहेत, घटवायला कोणतेही गुणोत्तर नाही. उत्तर सामान्य सूत्राने तपासा: तीन कार्बन असलेल्या अल्केनमध्ये 2 × 3 + 2 = 8 हायड्रोजन असावेत, आणि आहेत, म्हणून असंतृप्ततेची कोटी शून्य आणि रेणू वलयाविना बहुबंधाविना संतृप्त साखळी. प्रोपेनची केवळ एकच संरचना, म्हणून या विशिष्ट बाबतीत ज्वलन-विश्लेषणाने संयुग थेट ओळखले — जे असामान्य आहे आणि असामान्य म्हणूनच लक्षात घेण्याजोगे. उत्तर C₄H₈ निघाले असते तर पाच उमेदवार संरचना असत्या आणि विश्लेषण कोणती याबद्दल गप्प राहिले असते. दुसरी तपासणी उपलब्ध आहे, आणि काळजीपूर्वक रसायनशास्त्रज्ञ ती वापरतो. समीकरण संतुलित केल्यास C₃H₈ + 5O₂ → 3CO₂ + 4H₂O मिळते, म्हणून प्रयोगात पाच मोल ऑक्सिजन वापरला गेला असावा. मोजलेला ऑक्सिजन चार वा सहा असता तर वस्तुमान-संतुलन जुळले नसते आणि प्रयोगातले काहीतरी — अपूर्ण ज्वलन, गळती, चुकीच्या जागी संघनित होणारे पाणी — सूत्रावर विश्वास ठेवण्याआधी शोधावे लागले असते. सवय या प्रकरणाहून कितीतरी पुढे पसरते: जो निकाल केवळ ज्या समीकरणातून काढला त्यालाच पूर्ण करतो तो एकदा तपासला गेला, आणि जो एका स्वतंत्र संबंधालाही पूर्ण करतो तो दोनदा. (4 पाण्याचे मोल दुप्पट न करता सांगते; 6 त्याऐवजी कार्बनचा आकडा दुप्पट करते; आणि 3 कार्बन सांगते.)",
      },
    },
  ],
  /*NC*/
};
