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
  /*NC*/
};
