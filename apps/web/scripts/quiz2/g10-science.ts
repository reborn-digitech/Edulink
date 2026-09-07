/**
 * Class 10 Science — NCERT, chapter by chapter, through the conceptual engine.
 * Reactions are balanced atom for atom, acids and bases are read on the pH
 * scale, and metals are ranked by how fiercely they react. The chemist's
 * bookkeeping made visible. Same distractor rule as everywhere — every
 * statement must be false of every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Science (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

export const G10_SCIENCE: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Chemical Reactions and Equations                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-chemical-reactions",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 1 — Chemical Reactions and Equations",
      hi: "अध्याय 1 — रासायनिक अभिक्रियाएँ एवं समीकरण",
      mr: "प्रकरण 1 — रासायनिक अभिक्रिया आणि समीकरणे",
    },
    name: {
      en: "Chemical Reactions and Equations",
      hi: "रासायनिक अभिक्रियाएँ एवं समीकरण",
      mr: "रासायनिक अभिक्रिया आणि समीकरणे",
    },
    summary: {
      en: "Matter rearranged and the books kept balanced: a chemical change betrayed by colour, gas, heat or a precipitate; an equation balanced atom for atom because mass is conserved; and the family of reactions — combination, decomposition, displacement and the give-and-take of oxygen in redox.",
      hi: "पदार्थ फिर से सजा और बही संतुलित: रंग, गैस, ऊष्मा या अवक्षेप से पहचाना रासायनिक परिवर्तन; परमाणु-दर-परमाणु संतुलित समीकरण क्योंकि द्रव्यमान संरक्षित; और अभिक्रियाओं का कुल — संयोजन, वियोजन, विस्थापन और उपचयन-अपचयन में ऑक्सीजन का लेन-देन।",
      mr: "पदार्थ पुन्हा मांडलेला आणि खतावणी संतुलित: रंग, वायू, उष्णता वा अवक्षेपाने ओळखलेला रासायनिक बदल; अणू-दर-अणू संतुलित समीकरण कारण वस्तुमान संधारित; आणि अभिक्रियांचे कुळ — संयोग, वियोग, विस्थापन आणि रेडॉक्समधील ऑक्सिजनची देवाणघेवाण.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "chemical-change",
        name: {
          en: "A chemical reaction",
          hi: "रासायनिक अभिक्रिया",
          mr: "रासायनिक अभिक्रिया",
        },
        kind: "idea",
        prompt: {
          en: "When iron rusts or milk turns to curd, a brand-new substance appears that cannot easily be turned back. What kind of change makes new substances, and how is it spotted?",
          hi: "जब लोहा जंग खाता या दूध दही बनता, एक बिलकुल नया पदार्थ प्रकट होता जो आसानी से वापस नहीं होता। कौन-सा परिवर्तन नए पदार्थ बनाता, और कैसे पहचाना जाता?",
          mr: "जेव्हा लोखंड गंजते किंवा दूध दही होते, एक अगदी नवा पदार्थ प्रकट होतो जो सहज परत होत नाही. कोणता बदल नवे पदार्थ बनवतो, आणि कसा ओळखला जातो?",
        },
        statement: {
          en: "A chemical change forms one or more new substances with new properties, and is often signalled by a colour change, a gas released, heat given out or taken in, or a precipitate forming.",
          hi: "रासायनिक परिवर्तन नए गुणों वाले एक या अधिक नए पदार्थ बनाता, और अक्सर रंग-परिवर्तन, गैस निकलने, ऊष्मा देने या लेने, या अवक्षेप बनने से संकेतित।",
          mr: "रासायनिक बदल नव्या गुणांचे एक किंवा अधिक नवे पदार्थ बनवतो, आणि अनेकदा रंग-बदल, वायू सुटणे, उष्णता देणे वा घेणे, किंवा अवक्षेप बनण्याने संकेतित.",
        },
        detail: {
          en: "It differs from a physical change like melting ice, where water stays water — no new substance and easily reversed.",
          hi: "यह बर्फ़ पिघलने जैसे भौतिक परिवर्तन से भिन्न, जहाँ पानी पानी रहता — कोई नया पदार्थ नहीं और आसानी से उलटा।",
          mr: "हे बर्फ वितळण्यासारख्या भौतिक बदलाहून वेगळे, जिथे पाणी पाणीच राहते — नवा पदार्थ नाही आणि सहज उलट.",
        },
        extra: {
          en: "The burning of a magnesium ribbon shows several signs at once — a blinding light, heat, and a white powder utterly unlike the shiny metal.",
          hi: "मैग्नीशियम रिबन का जलना एक साथ कई संकेत दिखाता — चौंधियाता प्रकाश, ऊष्मा, और चमकीली धातु से बिलकुल भिन्न सफ़ेद चूर्ण।",
          mr: "मॅग्नेशियम रिबनचे जळणे एकाच वेळी अनेक संकेत दाखवते — डोळे दिपवणारा प्रकाश, उष्णता, आणि चमकत्या धातूहून अगदी वेगळी पांढरी पूड.",
        },
        pair: {
          left: {
            en: "New substance, hard to reverse",
            hi: "नया पदार्थ, उलटना कठिन",
            mr: "नवा पदार्थ, उलटणे कठीण",
          },
          right: {
            en: "a chemical change",
            hi: "रासायनिक परिवर्तन",
            mr: "रासायनिक बदल",
          },
        },
      },
      {
        id: "balanced-equation",
        name: {
          en: "A balanced equation",
          hi: "संतुलित समीकरण",
          mr: "संतुलित समीकरण",
        },
        kind: "idea",
        prompt: {
          en: "In a chemical equation the number of atoms of each element must be the same on both sides. Which requirement, rooted in the conservation of mass, does this describe?",
          hi: "रासायनिक समीकरण में हर तत्व के परमाणुओं की संख्या दोनों ओर समान होनी चाहिए। द्रव्यमान संरक्षण में जड़ी यह कौन-सी आवश्यकता बताती?",
          mr: "रासायनिक समीकरणात प्रत्येक मूलद्रव्याच्या अणूंची संख्या दोन्ही बाजूंना समान असावी. वस्तुमान संधारणात रुजलेली ही कोणती आवश्यकता सांगते?",
        },
        statement: {
          en: "A balanced equation has equal numbers of atoms of every element on both sides, because in a reaction atoms are only rearranged, never created or destroyed — the law of conservation of mass.",
          hi: "संतुलित समीकरण में दोनों ओर हर तत्व के परमाणु बराबर, क्योंकि अभिक्रिया में परमाणु केवल फिर सजते, कभी बनते या नष्ट नहीं — द्रव्यमान संरक्षण का नियम।",
          mr: "संतुलित समीकरणात दोन्ही बाजूंना प्रत्येक मूलद्रव्याचे अणू समान, कारण अभिक्रियेत अणू फक्त पुन्हा मांडले जातात, कधी बनत वा नष्ट होत नाहीत — वस्तुमान संधारणाचा नियम.",
        },
        detail: {
          en: "We balance by placing coefficients (numbers before formulae), never by changing a formula, since that would make a different substance.",
          hi: "हम गुणांक (सूत्रों के आगे संख्याएँ) रखकर संतुलित करते, सूत्र कभी बदलकर नहीं, क्योंकि वह भिन्न पदार्थ बना देता।",
          mr: "आपण सहगुणक (सूत्रांपुढील संख्या) ठेवून संतुलित करतो, सूत्र कधी बदलून नाही, कारण ते वेगळा पदार्थ बनवेल.",
        },
        extra: {
          en: "The total mass of reactants always equals the total mass of products — weigh a sealed flask before and after and the needle does not move.",
          hi: "अभिकारकों का कुल द्रव्यमान सदा उत्पादों के कुल द्रव्यमान के बराबर — बंद फ्लास्क को पहले-बाद तौलो और काँटा नहीं हिलता।",
          mr: "अभिक्रियाकारकांचे एकूण वस्तुमान सदैव उत्पादांच्या एकूण वस्तुमानाइतके — बंद फ्लास्क आधी-नंतर तोला आणि काटा हलत नाही.",
        },
        pair: {
          left: {
            en: "Atoms equal on both sides",
            hi: "दोनों ओर परमाणु बराबर",
            mr: "दोन्ही बाजूंना अणू समान",
          },
          right: {
            en: "a balanced equation",
            hi: "संतुलित समीकरण",
            mr: "संतुलित समीकरण",
          },
        },
      },
      {
        id: "combination-reaction",
        name: {
          en: "A combination reaction",
          hi: "संयोजन अभिक्रिया",
          mr: "संयोग अभिक्रिया",
        },
        kind: "reaction",
        prompt: {
          en: "When quicklime is added to water, the two join into a single new compound, slaked lime, releasing much heat. What type of reaction combines two or more substances into one?",
          hi: "जब बिना बुझा चूना पानी में डाला जाता, दोनों एक नए यौगिक, बुझे चूने, में जुड़ते, बहुत ऊष्मा छोड़ते। कौन-सी अभिक्रिया दो या अधिक पदार्थों को एक में जोड़ती?",
          mr: "जेव्हा कळीचा चुना पाण्यात टाकला जातो, दोन्ही एका नव्या संयुगात, विझलेल्या चुन्यात, जुळतात, पुष्कळ उष्णता सोडत. कोणती अभिक्रिया दोन किंवा अधिक पदार्थ एकात जोडते?",
        },
        statement: {
          en: "A combination reaction is one in which two or more reactants join to form a single product — like calcium oxide and water forming calcium hydroxide.",
          hi: "संयोजन अभिक्रिया वह जिसमें दो या अधिक अभिकारक जुड़कर एक ही उत्पाद बनाते — जैसे कैल्शियम ऑक्साइड और पानी कैल्शियम हाइड्रॉक्साइड बनाते।",
          mr: "संयोग अभिक्रिया ती ज्यात दोन किंवा अधिक अभिक्रियाकारक जुळून एकच उत्पाद बनवतात — जसे कॅल्शियम ऑक्साइड आणि पाणी कॅल्शियम हायड्रॉक्साइड बनवतात.",
        },
        detail: {
          en: "It usually gives out heat, so it is exothermic — the slaking of lime grows hot enough to steam.",
          hi: "यह आमतौर पर ऊष्मा देती, अतः ऊष्माक्षेपी — चूने का बुझना भाप देने भर गरम होता।",
          mr: "ती सहसा उष्णता देते, म्हणून उष्माक्षेपी — चुना विझणे वाफ येण्याइतके गरम होते.",
        },
        extra: {
          en: "It is the reverse of decomposition — where combination joins many into one, decomposition splits one into many.",
          hi: "यह वियोजन का उल्टा — जहाँ संयोजन अनेक को एक में जोड़ता, वियोजन एक को अनेक में तोड़ता।",
          mr: "हे वियोगाच्या उलट — जिथे संयोग अनेकांना एकात जोडतो, वियोग एकाला अनेकांत मोडतो.",
        },
        pair: {
          left: {
            en: "Two or more join into one",
            hi: "दो या अधिक एक में जुड़ें",
            mr: "दोन किंवा अधिक एकात जुळतात",
          },
          right: {
            en: "a combination reaction",
            hi: "संयोजन अभिक्रिया",
            mr: "संयोग अभिक्रिया",
          },
        },
      },
      {
        id: "decomposition-reaction",
        name: {
          en: "A decomposition reaction",
          hi: "वियोजन अभिक्रिया",
          mr: "वियोग अभिक्रिया",
        },
        kind: "reaction",
        prompt: {
          en: "Heat limestone and it breaks apart into lime and carbon dioxide; pass electricity through water and it splits into hydrogen and oxygen. What type of reaction breaks one substance into two or more?",
          hi: "चूना-पत्थर गरम करो और यह चूने और कार्बन डाइऑक्साइड में टूटता; पानी में बिजली प्रवाहित करो और यह हाइड्रोजन-ऑक्सीजन में बँटता। कौन-सी अभिक्रिया एक पदार्थ को दो या अधिक में तोड़ती?",
          mr: "चुनखडी तापवा आणि ती चुना आणि कार्बन डायऑक्साइडमध्ये मोडते; पाण्यातून वीज पाठवा आणि ते हायड्रोजन-ऑक्सिजनमध्ये विभागते. कोणती अभिक्रिया एक पदार्थ दोन किंवा अधिकांत मोडते?",
        },
        statement: {
          en: "A decomposition reaction breaks a single reactant into two or more products, using energy from heat, light or electricity.",
          hi: "वियोजन अभिक्रिया एक अभिकारक को दो या अधिक उत्पादों में तोड़ती, ऊष्मा, प्रकाश या बिजली की ऊर्जा से।",
          mr: "वियोग अभिक्रिया एक अभिक्रियाकारक दोन किंवा अधिक उत्पादांत मोडते, उष्णता, प्रकाश वा विजेच्या ऊर्जेने.",
        },
        detail: {
          en: "It usually absorbs energy, so it is endothermic — the split of limestone needs constant strong heating to keep going.",
          hi: "यह आमतौर पर ऊर्जा सोखती, अतः ऊष्माशोषी — चूना-पत्थर का टूटना चलते रहने को लगातार तेज़ गरमी माँगता।",
          mr: "ती सहसा ऊर्जा शोषते, म्हणून उष्माशोषी — चुनखडीचे मोडणे चालू राहायला सतत तीव्र तापणे मागते.",
        },
        extra: {
          en: "It is named by its energy source — thermal (by heat), electrolytic (by electricity), and photolytic (by light, as when silver salts darken in a photograph).",
          hi: "यह अपने ऊर्जा-स्रोत से नाम पाती — तापीय (ऊष्मा से), विद्युत-अपघटनी (बिजली से), और प्रकाशीय (प्रकाश से, जैसे चाँदी-लवण फ़ोटो में काले पड़ते)।",
          mr: "ती आपल्या ऊर्जा-स्रोताने नाव पावते — औष्णिक (उष्णतेने), विद्युत-अपघटनी (विजेने), आणि प्रकाशीय (प्रकाशाने, जसे चांदी-क्षार फोटोत काळे पडतात).",
        },
        pair: {
          left: {
            en: "One splits into two or more",
            hi: "एक दो या अधिक में टूटे",
            mr: "एक दोन किंवा अधिकांत मोडतो",
          },
          right: {
            en: "a decomposition reaction",
            hi: "वियोजन अभिक्रिया",
            mr: "वियोग अभिक्रिया",
          },
        },
      },
      {
        id: "displacement-reaction",
        name: {
          en: "A displacement reaction",
          hi: "विस्थापन अभिक्रिया",
          mr: "विस्थापन अभिक्रिया",
        },
        kind: "reaction",
        prompt: {
          en: "Dip an iron nail in blue copper sulphate solution and it turns brown as the iron pushes the copper out of the compound. What type of reaction lets a more reactive metal oust a less reactive one?",
          hi: "नीले कॉपर सल्फ़ेट विलयन में लोहे की कील डुबोओ और यह भूरी हो जाती जैसे लोहा ताँबे को यौगिक से बाहर धकेलता। कौन-सी अभिक्रिया अधिक क्रियाशील धातु को कम क्रियाशील को हटाने देती?",
          mr: "निळ्या कॉपर सल्फेट द्रावणात लोखंडी खिळा बुडवा आणि तो तपकिरी होतो जसे लोखंड तांब्याला संयुगातून बाहेर ढकलते. कोणती अभिक्रिया अधिक क्रियाशील धातूला कमी क्रियाशील हटवू देते?",
        },
        statement: {
          en: "A displacement reaction is one in which a more reactive element takes the place of a less reactive one in a compound — as iron displaces copper from copper sulphate.",
          hi: "विस्थापन अभिक्रिया वह जिसमें अधिक क्रियाशील तत्व यौगिक में कम क्रियाशील की जगह लेता — जैसे लोहा कॉपर सल्फ़ेट से ताँबा विस्थापित करता।",
          mr: "विस्थापन अभिक्रिया ती ज्यात अधिक क्रियाशील मूलद्रव्य संयुगात कमी क्रियाशीलाची जागा घेते — जसे लोखंड कॉपर सल्फेटमधून तांबे विस्थापित करते.",
        },
        detail: {
          en: "It runs only if the free metal is more reactive than the one it displaces — copper cannot push iron out, because copper is the weaker of the two.",
          hi: "यह तभी चलती जब मुक्त धातु विस्थापित की जाती से अधिक क्रियाशील — ताँबा लोहे को नहीं धकेल सकता, क्योंकि ताँबा दोनों में कमज़ोर।",
          mr: "ती तेव्हाच चालते जेव्हा मुक्त धातू विस्थापित होणाऱ्याहून अधिक क्रियाशील — तांबे लोखंडाला ढकलू शकत नाही, कारण तांबे दोहोंत कमजोर.",
        },
        extra: {
          en: "The blue of the solution fades to pale green as copper leaves and iron enters — the colour change is the reaction made visible.",
          hi: "विलयन का नीलापन हल्के हरे में फीका पड़ता जैसे ताँबा निकलता और लोहा प्रवेशता — रंग-परिवर्तन अभिक्रिया को दृश्य बनाता।",
          mr: "द्रावणाचा निळेपणा फिकट हिरव्यात मावळतो जसे तांबे निघते आणि लोखंड शिरते — रंग-बदल अभिक्रिया दृश्य करतो.",
        },
        pair: {
          left: {
            en: "Reactive metal ousts a weaker one",
            hi: "क्रियाशील धातु कमज़ोर को हटाए",
            mr: "क्रियाशील धातू कमजोराला हटवते",
          },
          right: {
            en: "a displacement reaction",
            hi: "विस्थापन अभिक्रिया",
            mr: "विस्थापन अभिक्रिया",
          },
        },
      },
      {
        id: "redox-reaction",
        name: {
          en: "Oxidation and reduction",
          hi: "उपचयन और अपचयन",
          mr: "ऑक्सिडीकरण आणि क्षपण",
        },
        kind: "idea",
        prompt: {
          en: "When one substance gains oxygen (or loses electrons) another loses oxygen (or gains them) in the same reaction — the two always happen together. What paired process is this?",
          hi: "जब एक पदार्थ ऑक्सीजन पाता (या इलेक्ट्रॉन खोता) दूसरा उसी अभिक्रिया में ऑक्सीजन खोता (या पाता) — दोनों सदा साथ होते। यह कौन-सी युग्म-प्रक्रिया है?",
          mr: "जेव्हा एक पदार्थ ऑक्सिजन मिळवतो (किंवा इलेक्ट्रॉन गमावतो) दुसरा त्याच अभिक्रियेत ऑक्सिजन गमावतो (किंवा मिळवतो) — दोन्ही सदैव एकत्र होतात. ही कोणती जोडी-प्रक्रिया?",
        },
        statement: {
          en: "Oxidation is the gain of oxygen or loss of electrons, and reduction is the loss of oxygen or gain of electrons; the two occur together in a single redox reaction.",
          hi: "उपचयन ऑक्सीजन पाना या इलेक्ट्रॉन खोना, और अपचयन ऑक्सीजन खोना या इलेक्ट्रॉन पाना; दोनों एक ही उपचयन-अपचयन अभिक्रिया में साथ होते।",
          mr: "ऑक्सिडीकरण ऑक्सिजन मिळवणे वा इलेक्ट्रॉन गमावणे, आणि क्षपण ऑक्सिजन गमावणे वा इलेक्ट्रॉन मिळवणे; दोन्ही एकाच रेडॉक्स अभिक्रियेत एकत्र होतात.",
        },
        detail: {
          en: "One reactant cannot be oxidised unless another is reduced — the electrons lost by one are exactly the electrons gained by the other.",
          hi: "एक अभिकारक तब तक उपचयित नहीं जब तक दूसरा अपचयित न हो — एक द्वारा खोए इलेक्ट्रॉन ठीक दूसरे द्वारा पाए इलेक्ट्रॉन।",
          mr: "एक अभिक्रियाकारक तोवर ऑक्सिडीकृत होत नाही जोवर दुसरा क्षपित होत नाही — एकाने गमावलेले इलेक्ट्रॉन नेमके दुसऱ्याने मिळवलेले इलेक्ट्रॉन.",
        },
        extra: {
          en: "The everyday rusting of iron and the rancidity of stale food are slow oxidations — which is why chips are sealed in nitrogen to keep the oxygen out.",
          hi: "रोज़ का लोहे का जंग और बासी भोजन का विकृतगंधित होना धीमे उपचयन — इसी से चिप्स नाइट्रोजन में बंद कर ऑक्सीजन बाहर रखी जाती।",
          mr: "रोजचे लोखंडाचे गंजणे आणि शिळ्या अन्नाचे विकृतगंधी होणे मंद ऑक्सिडीकरण — म्हणूनच चिप्स नायट्रोजनमध्ये बंद करून ऑक्सिजन बाहेर ठेवली जाते.",
        },
        pair: {
          left: {
            en: "Oxygen gained by one, lost by another, together",
            hi: "एक ऑक्सीजन पाए, दूसरा खोए, साथ",
            mr: "एक ऑक्सिजन मिळवे, दुसरा गमावे, एकत्र",
          },
          right: {
            en: "a redox reaction",
            hi: "उपचयन-अपचयन अभिक्रिया",
            mr: "रेडॉक्स अभिक्रिया",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "When 2 g of hydrogen burns in 16 g of oxygen it makes exactly 18 g of water — never more, never less. A student writes 'H₂ + O₂ → H₂O' and is told it is wrong until balanced. Why must a chemical equation be balanced, and what deeper law is it obeying?",
          hi: "जब 2 ग्राम हाइड्रोजन 16 ग्राम ऑक्सीजन में जलती तो ठीक 18 ग्राम पानी बनाती — न अधिक, न कम। एक छात्र 'H₂ + O₂ → H₂O' लिखता और उसे बताया जाता संतुलित होने तक ग़लत। रासायनिक समीकरण संतुलित क्यों होना चाहिए, और यह कौन-सा गहरा नियम मानता?",
          mr: "जेव्हा 2 ग्रॅम हायड्रोजन 16 ग्रॅम ऑक्सिजनमध्ये जळतो तेव्हा नेमके 18 ग्रॅम पाणी बनते — ना अधिक, ना कमी. एक विद्यार्थी 'H₂ + O₂ → H₂O' लिहितो आणि त्याला सांगितले जाते संतुलित होईपर्यंत चूक. रासायनिक समीकरण संतुलित का असावे, आणि ते कोणता खोल नियम पाळते?",
        },
        choices: [
          {
            en: "Because atoms are neither created nor destroyed in a reaction — the law of conservation of mass — so every element must have the same number of atoms on both sides; the unbalanced form has 2 oxygen atoms on the left but only 1 on the right, which would mean an oxygen atom vanished",
            hi: "क्योंकि अभिक्रिया में परमाणु न बनते न नष्ट होते — द्रव्यमान संरक्षण का नियम — अतः हर तत्व के दोनों ओर बराबर परमाणु; असंतुलित रूप में बाईं ओर 2 ऑक्सीजन परमाणु पर दाईं ओर केवल 1, जिसका अर्थ एक ऑक्सीजन परमाणु ग़ायब हो गया",
            mr: "कारण अभिक्रियेत अणू ना बनतात ना नष्ट होतात — वस्तुमान संधारणाचा नियम — म्हणून प्रत्येक मूलद्रव्याचे दोन्ही बाजूंना समान अणू; असंतुलित रूपात डाव्या बाजूला 2 ऑक्सिजन अणू पण उजव्या बाजूला फक्त 1, ज्याचा अर्थ एक ऑक्सिजन अणू नाहीसा झाला",
          },
          {
            en: "Because chemists prefer equations to look tidy, with no real physical reason",
            hi: "क्योंकि रसायनज्ञ समीकरण सुथरे दिखना पसंद करते, बिना किसी असली भौतिक कारण",
            mr: "कारण रसायनशास्त्रज्ञांना समीकरणे नीटनेटकी दिसणे आवडते, कोणत्याही खऱ्या भौतिक कारणाविना",
          },
          {
            en: "Because balancing changes the substances into different, better ones",
            hi: "क्योंकि संतुलन पदार्थों को भिन्न, बेहतर में बदल देता",
            mr: "कारण संतुलन पदार्थांना वेगळ्या, चांगल्यांत बदलते",
          },
          {
            en: "Because mass is actually destroyed in reactions and balancing hides it",
            hi: "क्योंकि अभिक्रियाओं में द्रव्यमान वास्तव में नष्ट होता और संतुलन इसे छिपाता",
            mr: "कारण अभिक्रियांत वस्तुमान खरे तर नष्ट होते आणि संतुलन ते लपवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A chemical reaction does not make or destroy matter; it only takes the atoms that were there and links them up in new ways. Every atom present among the reactants must reappear somewhere among the products — none can vanish and none can appear from nowhere. This is the law of conservation of mass, and it is exactly why the 2 g of hydrogen and 16 g of oxygen give precisely 18 g of water: the atoms are all still there, just rebonded. A chemical equation is a statement about those atoms, so it must respect the same law. In the unbalanced 'H₂ + O₂ → H₂O', count the oxygen: two atoms on the left (in O₂) but only one on the right (in H₂O). Taken literally, that claims an oxygen atom disappeared — impossible. We fix it not by rewriting any formula (changing H₂O to HO would describe a different substance that doesn't exist here) but by placing whole-number coefficients in front: 2H₂ + O₂ → 2H₂O. Now there are 4 hydrogen and 2 oxygen atoms on each side, and the books balance. So balancing is not cosmetic bookkeeping; it is the equation being made to tell the truth about a reaction in which every atom is conserved. If an equation cannot be balanced with sensible coefficients, that is a sign the reaction as written does not really happen.",
          hi: "रासायनिक अभिक्रिया पदार्थ न बनाती न नष्ट करती; यह केवल वहाँ मौजूद परमाणुओं को लेकर उन्हें नए तरीक़ों से जोड़ती। अभिकारकों में मौजूद हर परमाणु उत्पादों में कहीं फिर प्रकट होना चाहिए — कोई लुप्त नहीं हो सकता और कोई कहीं से प्रकट नहीं। यह द्रव्यमान संरक्षण का नियम, और ठीक इसीलिए 2 ग्राम हाइड्रोजन और 16 ग्राम ऑक्सीजन ठीक 18 ग्राम पानी देते: परमाणु सब अब भी वहाँ, बस फिर बँधे। रासायनिक समीकरण उन परमाणुओं के बारे में कथन, अतः उसे वही नियम मानना। असंतुलित 'H₂ + O₂ → H₂O' में ऑक्सीजन गिनो: बाईं ओर दो परमाणु (O₂ में) पर दाईं ओर केवल एक (H₂O में)। शाब्दिक रूप से यह दावा कि एक ऑक्सीजन परमाणु ग़ायब — असंभव। हम इसे किसी सूत्र को फिर लिखकर नहीं (H₂O को HO बदलना यहाँ न मौजूद भिन्न पदार्थ बताता) बल्कि आगे पूर्ण-संख्या गुणांक रखकर सुधारते: 2H₂ + O₂ → 2H₂O. अब हर ओर 4 हाइड्रोजन और 2 ऑक्सीजन, और बही संतुलित। अतः संतुलन प्रसाधन-बही नहीं; यह समीकरण को उस अभिक्रिया के बारे में सच बताने बनाया जिसमें हर परमाणु संरक्षित। यदि समीकरण समझदार गुणांकों से संतुलित न हो सके, यह संकेत कि अभिक्रिया जैसी लिखी वैसे सचमुच नहीं होती।",
          mr: "रासायनिक अभिक्रिया पदार्थ ना बनवते ना नष्ट करते; ती फक्त तिथे असलेले अणू घेऊन त्यांना नव्या मार्गांनी जोडते. अभिक्रियाकारकांत असलेला प्रत्येक अणू उत्पादांत कुठेतरी पुन्हा प्रकट व्हायला हवा — कोणी नाहीसा होऊ शकत नाही आणि कोणी कुठूनही प्रकट होत नाही. हा वस्तुमान संधारणाचा नियम, आणि नेमके म्हणूनच 2 ग्रॅम हायड्रोजन आणि 16 ग्रॅम ऑक्सिजन नेमके 18 ग्रॅम पाणी देतात: अणू सारे अजून तिथे, फक्त पुन्हा बांधलेले. रासायनिक समीकरण त्या अणूंबद्दलचे विधान, म्हणून त्याने तोच नियम पाळावा. असंतुलित 'H₂ + O₂ → H₂O' मध्ये ऑक्सिजन मोजा: डाव्या बाजूला दोन अणू (O₂ मध्ये) पण उजव्या बाजूला फक्त एक (H₂O मध्ये). शब्दशः हा दावा की एक ऑक्सिजन अणू नाहीसा झाला — अशक्य. आपण ते कोणतेही सूत्र पुन्हा लिहून नाही (H₂O ला HO बदलणे इथे नसलेला वेगळा पदार्थ सांगते) तर पुढे पूर्ण-संख्या सहगुणक ठेवून दुरुस्त करतो: 2H₂ + O₂ → 2H₂O. आता प्रत्येक बाजूला 4 हायड्रोजन आणि 2 ऑक्सिजन, आणि खतावणी संतुलित. म्हणून संतुलन सजावटीची खतावणी नाही; ते समीकरणाला त्या अभिक्रियेबद्दल खरे सांगायला बनवलेले जिच्यात प्रत्येक अणू संधारित. जर समीकरण समजूतदार सहगुणकांनी संतुलित होऊ शकत नसेल, तो संकेत की अभिक्रिया जशी लिहिली तशी खरोखर होत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "When an iron nail is dipped in copper sulphate solution, the iron slowly dissolves and reddish copper deposits on it, the blue solution fading to green. Textbooks call this both a displacement reaction and a redox reaction. How can it be both, and what is actually being oxidised and reduced?",
          hi: "जब लोहे की कील कॉपर सल्फ़ेट विलयन में डुबोई जाती, लोहा धीरे घुलता और लाल-सा ताँबा उस पर जमता, नीला विलयन हरे में फीका पड़ता। पाठ्यपुस्तकें इसे विस्थापन अभिक्रिया और उपचयन-अपचयन अभिक्रिया दोनों कहतीं। यह दोनों कैसे हो सकती, और वास्तव में क्या उपचयित और क्या अपचयित हो रहा?",
          mr: "जेव्हा लोखंडी खिळा कॉपर सल्फेट द्रावणात बुडवला जातो, लोखंड हळू विरघळते आणि लालसर तांबे त्यावर साचते, निळे द्रावण हिरव्यात मावळते. पाठ्यपुस्तके याला विस्थापन अभिक्रिया आणि रेडॉक्स अभिक्रिया दोन्ही म्हणतात. हे दोन्ही कसे असू शकते, आणि प्रत्यक्षात काय ऑक्सिडीकृत आणि काय क्षपित होत आहे?",
        },
        choices: [
          {
            en: "The more reactive iron displaces the less reactive copper — that is the displacement. Underneath, iron atoms lose electrons (oxidised) to become Fe²⁺ ions in solution, and copper ions gain those electrons (reduced) to become copper metal; loss and gain of electrons happening together make it a redox reaction too",
            hi: "अधिक क्रियाशील लोहा कम क्रियाशील ताँबे को विस्थापित करता — वह विस्थापन। नीचे, लोहे के परमाणु इलेक्ट्रॉन खोकर (उपचयित) विलयन में Fe²⁺ आयन बनते, और ताँबे के आयन वे इलेक्ट्रॉन पाकर (अपचयित) ताँबा धातु बनते; इलेक्ट्रॉन का खोना-पाना साथ होना इसे उपचयन-अपचयन अभिक्रिया भी बनाता",
            mr: "अधिक क्रियाशील लोखंड कमी क्रियाशील तांब्याला विस्थापित करते — ते विस्थापन. खाली, लोखंडाचे अणू इलेक्ट्रॉन गमावून (ऑक्सिडीकृत) द्रावणात Fe²⁺ आयन बनतात, आणि तांब्याचे आयन ते इलेक्ट्रॉन मिळवून (क्षपित) तांबे धातू बनतात; इलेक्ट्रॉनचे गमावणे-मिळवणे एकत्र होणे याला रेडॉक्स अभिक्रियाही बनवते",
          },
          {
            en: "A reaction can only ever be one type; the textbook is mistaken to give it two names",
            hi: "अभिक्रिया कभी केवल एक प्रकार की; पाठ्यपुस्तक इसे दो नाम देकर ग़लती करती",
            mr: "अभिक्रिया कधीही फक्त एका प्रकारची; पाठ्यपुस्तक तिला दोन नावे देऊन चूक करते",
          },
          {
            en: "The copper is oxidised and the iron is reduced, the opposite way round",
            hi: "ताँबा उपचयित और लोहा अपचयित, उल्टे तरीक़े से",
            mr: "तांबे ऑक्सिडीकृत आणि लोखंड क्षपित, उलट पद्धतीने",
          },
          {
            en: "No electrons move at all; only the colour changes",
            hi: "कोई इलेक्ट्रॉन बिलकुल नहीं चलते; केवल रंग बदलता",
            mr: "कोणतेही इलेक्ट्रॉन मुळीच हलत नाहीत; फक्त रंग बदलतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two names describe the same event at two levels of detail, so there is no contradiction. At the level of substances, this is a displacement reaction: iron, being higher in the reactivity series than copper, pushes copper out of copper sulphate and takes its place, giving iron sulphate and copper metal. That is the visible story — the nail eating into the solution, red copper settling on it, the blue paling to the green of iron sulphate. At the level of electrons, the same event is a redox reaction, and this is what is really driving it. Each iron atom hands over two electrons and becomes a positive iron ion (Fe → Fe²⁺ + 2e⁻); losing electrons is oxidation, so iron is oxidised. Those very electrons are picked up by copper ions already in the solution, which become neutral copper metal (Cu²⁺ + 2e⁻ → Cu); gaining electrons is reduction, so copper is reduced. Oxidation and reduction are two halves of one transfer — the electrons iron loses are exactly the electrons copper gains, which is why they must happen together. So 'displacement' names what you see (a reactive metal replacing a less reactive one), while 'redox' names the mechanism beneath (electrons moving from the metal being oxidised to the ion being reduced). Crucially, it is iron that is oxidised and copper that is reduced, not the reverse: the more reactive metal is the one giving up electrons, which is exactly why it is the more reactive one. The two descriptions are not rivals; the redox view explains why the displacement happens at all.",
          hi: "दोनों नाम एक ही घटना को दो स्तर के विवरण पर बताते, अतः कोई विरोध नहीं। पदार्थ के स्तर पर यह विस्थापन अभिक्रिया: लोहा, क्रियाशीलता श्रेणी में ताँबे से ऊँचा, कॉपर सल्फ़ेट से ताँबा धकेल उसकी जगह लेता, आयरन सल्फ़ेट और ताँबा धातु देता। यह दृश्य कहानी — कील विलयन में खाती, लाल ताँबा उस पर बैठता, नीला आयरन सल्फ़ेट के हरे में फीका। इलेक्ट्रॉन के स्तर पर वही घटना उपचयन-अपचयन अभिक्रिया, और यही इसे सचमुच चला रहा। हर लोहे का परमाणु दो इलेक्ट्रॉन सौंपकर धन आयरन आयन बनता (Fe → Fe²⁺ + 2e⁻); इलेक्ट्रॉन खोना उपचयन, अतः लोहा उपचयित। वही इलेक्ट्रॉन विलयन में पहले से ताँबे के आयन उठाते, जो उदासीन ताँबा धातु बनते (Cu²⁺ + 2e⁻ → Cu); इलेक्ट्रॉन पाना अपचयन, अतः ताँबा अपचयित। उपचयन-अपचयन एक स्थानांतरण के दो आधे — लोहा जो इलेक्ट्रॉन खोता ठीक वही ताँबा पाता, इसी से वे साथ होने चाहिए। अतः 'विस्थापन' जो दिखता उसका नाम (क्रियाशील धातु कम क्रियाशील की जगह), जबकि 'रेडॉक्स' नीचे की क्रियाविधि का नाम (उपचयित होती धातु से अपचयित होते आयन को इलेक्ट्रॉन जाते)। मुख्यतः, लोहा उपचयित और ताँबा अपचयित, उल्टा नहीं: अधिक क्रियाशील धातु ही इलेक्ट्रॉन देती, ठीक इसीलिए वह अधिक क्रियाशील। दोनों वर्णन प्रतिद्वंद्वी नहीं; रेडॉक्स दृष्टि समझाती विस्थापन होता ही क्यों।",
          mr: "दोन्ही नावे एकाच घटनेला दोन तपशील-स्तरांवर सांगतात, म्हणून कोणताही विरोध नाही. पदार्थांच्या स्तरावर ही विस्थापन अभिक्रिया: लोखंड, क्रियाशीलता श्रेणीत तांब्याहून वर, कॉपर सल्फेटमधून तांबे ढकलून त्याची जागा घेते, आयर्न सल्फेट आणि तांबे धातू देते. ही दृश्य कथा — खिळा द्रावणात खात, लाल तांबे त्यावर बसत, निळे आयर्न सल्फेटच्या हिरव्यात मावळत. इलेक्ट्रॉनच्या स्तरावर तीच घटना रेडॉक्स अभिक्रिया, आणि हेच तिला खरोखर चालवत आहे. प्रत्येक लोखंडाचा अणू दोन इलेक्ट्रॉन देऊन धन आयर्न आयन बनतो (Fe → Fe²⁺ + 2e⁻); इलेक्ट्रॉन गमावणे ऑक्सिडीकरण, म्हणून लोखंड ऑक्सिडीकृत. तेच इलेक्ट्रॉन द्रावणात आधीपासून असलेले तांब्याचे आयन उचलतात, जे उदासीन तांबे धातू बनतात (Cu²⁺ + 2e⁻ → Cu); इलेक्ट्रॉन मिळवणे क्षपण, म्हणून तांबे क्षपित. ऑक्सिडीकरण-क्षपण एका स्थानांतराचे दोन अर्धे — लोखंड जे इलेक्ट्रॉन गमावते नेमके तेच तांबे मिळवते, म्हणूनच ते एकत्र व्हायला हवे. म्हणून 'विस्थापन' जे दिसते त्याचे नाव (क्रियाशील धातू कमी क्रियाशीलाची जागा घेते), तर 'रेडॉक्स' खालच्या क्रियाविधीचे नाव (ऑक्सिडीकृत होणाऱ्या धातूकडून क्षपित होणाऱ्या आयनाकडे इलेक्ट्रॉन जातात). मुख्यतः, लोखंड ऑक्सिडीकृत आणि तांबे क्षपित, उलट नाही: अधिक क्रियाशील धातूच इलेक्ट्रॉन देते, नेमके म्हणूनच ती अधिक क्रियाशील. दोन्ही वर्णने प्रतिस्पर्धी नाहीत; रेडॉक्स दृष्टी समजावते विस्थापन मुळात का होते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Acids, Bases and Salts                                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-acids-bases-salts",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 2 — Acids, Bases and Salts",
      hi: "अध्याय 2 — अम्ल, क्षारक एवं लवण",
      mr: "प्रकरण 2 — आम्ल, आम्लारी आणि क्षार",
    },
    name: {
      en: "Acids, Bases and Salts",
      hi: "अम्ल, क्षारक एवं लवण",
      mr: "आम्ल, आम्लारी आणि क्षार",
    },
    summary: {
      en: "Two opposites and their offspring: acids that release H⁺ in water and bases that release OH⁻, told apart by indicators and ranked on the pH scale; their meeting in neutralisation that yields a salt and water; and the everyday salts — table salt, washing soda, baking soda — drawn from them.",
      hi: "दो विपरीत और उनकी संतान: पानी में H⁺ छोड़ते अम्ल और OH⁻ छोड़ते क्षारक, सूचकों से पहचाने और pH मापनी पर क्रमित; उदासीनीकरण में उनका मिलन जो लवण और पानी देता; और उनसे निकले रोज़मर्रा लवण — खाने का नमक, धावन सोडा, खाने का सोडा।",
      mr: "दोन विरुद्ध आणि त्यांची संतती: पाण्यात H⁺ सोडणारी आम्ले आणि OH⁻ सोडणारी आम्लारी, दर्शकांनी ओळखलेली आणि pH मापनीवर क्रमित; उदासीनीकरणात त्यांचे मिलन जे क्षार आणि पाणी देते; आणि त्यांतून निघालेले रोजचे क्षार — खाण्याचे मीठ, धुण्याचा सोडा, खाण्याचा सोडा.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "indicators",
        name: {
          en: "Indicators",
          hi: "सूचक",
          mr: "दर्शक",
        },
        kind: "idea",
        prompt: {
          en: "A slip of paper turns red in lemon juice and blue in soap solution, telling you which is which without a taste. What are such substances, which change colour to reveal acid or base, called?",
          hi: "एक काग़ज़-पर्ची नींबू के रस में लाल और साबुन-विलयन में नीली हो जाती, बिना चखे बताती कौन क्या। ऐसे पदार्थ, जो अम्ल या क्षारक उजागर करने रंग बदलते, क्या कहलाते?",
          mr: "एक कागद-पट्टी लिंबाच्या रसात लाल आणि साबण-द्रावणात निळी होते, न चाखता सांगते कोण काय. असे पदार्थ, जे आम्ल वा आम्लारी उघड करायला रंग बदलतात, काय म्हणतात?",
        },
        statement: {
          en: "Indicators are substances that change colour to show whether a solution is acidic or basic — litmus turns red in acid and blue in base, and turmeric turns red only in a base.",
          hi: "सूचक वे पदार्थ जो विलयन अम्लीय है या क्षारीय दिखाने रंग बदलते — लिटमस अम्ल में लाल और क्षारक में नीला, और हल्दी केवल क्षारक में लाल।",
          mr: "दर्शक ते पदार्थ जे द्रावण आम्लधर्मी की आम्लारीधर्मी दाखवायला रंग बदलतात — लिटमस आम्लात लाल आणि आम्लारीत निळा, आणि हळद फक्त आम्लारीत लाल.",
        },
        detail: {
          en: "Some indicators are 'olfactory' — they change smell, not colour: onion and vanilla lose their scent in a base but keep it in an acid.",
          hi: "कुछ सूचक 'गंधीय' — वे गंध बदलते, रंग नहीं: प्याज़ और वनीला क्षारक में अपनी गंध खोते पर अम्ल में रखते।",
          mr: "काही दर्शक 'गंधीय' — ते वास बदलतात, रंग नाही: कांदा आणि व्हॅनिला आम्लारीत आपला वास गमावतात पण आम्लात राखतात.",
        },
        extra: {
          en: "Phenolphthalein is colourless in acid but bright pink in base, and methyl orange is red in acid but yellow in base — each with its own two colours.",
          hi: "फ़ीनॉल्फ़्थेलिन अम्ल में रंगहीन पर क्षारक में गुलाबी, और मिथाइल ऑरेंज अम्ल में लाल पर क्षारक में पीला — हर एक अपने दो रंगों के साथ।",
          mr: "फिनॉल्फ्थॅलिन आम्लात रंगहीन पण आम्लारीत गुलाबी, आणि मिथाइल ऑरेंज आम्लात लाल पण आम्लारीत पिवळा — प्रत्येक आपल्या दोन रंगांसह.",
        },
        pair: {
          left: {
            en: "Changes colour to reveal acid or base",
            hi: "अम्ल या क्षारक बताने रंग बदले",
            mr: "आम्ल वा आम्लारी सांगायला रंग बदले",
          },
          right: {
            en: "an indicator",
            hi: "सूचक",
            mr: "दर्शक",
          },
        },
      },
      {
        id: "acids",
        name: {
          en: "Acids and their H⁺ ions",
          hi: "अम्ल और उनके H⁺ आयन",
          mr: "आम्ले आणि त्यांचे H⁺ आयन",
        },
        kind: "substance",
        prompt: {
          en: "They taste sour, turn blue litmus red, and fizz when they meet a metal, giving off hydrogen. What class of substances releases H⁺ ions when dissolved in water?",
          hi: "वे स्वाद में खट्टे, नीले लिटमस को लाल करते, और धातु से मिलने पर बुदबुदाते, हाइड्रोजन छोड़ते। कौन-सा पदार्थ-वर्ग पानी में घुलने पर H⁺ आयन छोड़ता?",
          mr: "ते चवीला आंबट, निळ्या लिटमसला लाल करतात, आणि धातूला भेटताना बुडबुडतात, हायड्रोजन सोडतात. कोणता पदार्थ-वर्ग पाण्यात विरघळताना H⁺ आयन सोडतो?",
        },
        statement: {
          en: "Acids are substances that release hydrogen ions (H⁺) in water; they taste sour, turn blue litmus red, and react with many metals to give off hydrogen gas.",
          hi: "अम्ल वे पदार्थ जो पानी में हाइड्रोजन आयन (H⁺) छोड़ते; वे खट्टे, नीले लिटमस को लाल करते, और कई धातुओं से मिलकर हाइड्रोजन गैस छोड़ते।",
          mr: "आम्ले ते पदार्थ जे पाण्यात हायड्रोजन आयन (H⁺) सोडतात; ते आंबट, निळ्या लिटमसला लाल करतात, आणि अनेक धातूंशी क्रिया करून हायड्रोजन वायू सोडतात.",
        },
        detail: {
          en: "It is the H⁺ ion that makes an acid an acid — a dry acid, or one dissolved in a liquid that gives no H⁺, shows no acidic behaviour.",
          hi: "H⁺ आयन ही अम्ल को अम्ल बनाता — सूखा अम्ल, या ऐसे द्रव में घुला जो H⁺ न दे, कोई अम्लीय व्यवहार नहीं दिखाता।",
          mr: "H⁺ आयनच आम्लाला आम्ल बनवतो — कोरडे आम्ल, किंवा असा द्रवात विरघळलेले जे H⁺ देत नाही, कोणतेही आम्लधर्मी वर्तन दाखवत नाही.",
        },
        extra: {
          en: "The sting of a nettle, the sourness of curd and the tartness of a lemon are all the work of natural acids.",
          hi: "बिच्छू-बूटी का डंक, दही का खट्टापन और नींबू की तीखी खटास सब प्राकृतिक अम्लों का काम।",
          mr: "खाजकुइलीचा डंख, दह्याचा आंबटपणा आणि लिंबाची तिखट आंबट सारे नैसर्गिक आम्लांचे काम.",
        },
        pair: {
          left: {
            en: "Releases H⁺ in water, sour, frees hydrogen from metals",
            hi: "पानी में H⁺ छोड़े, खट्टा, धातु से हाइड्रोजन मुक्त करे",
            mr: "पाण्यात H⁺ सोडे, आंबट, धातूतून हायड्रोजन मुक्त करे",
          },
          right: {
            en: "an acid",
            hi: "अम्ल",
            mr: "आम्ल",
          },
        },
      },
      {
        id: "bases",
        name: {
          en: "Bases",
          hi: "क्षारक",
          mr: "आम्लारी",
        },
        kind: "substance",
        prompt: {
          en: "They feel soapy, taste bitter, and turn red litmus blue. What class of substances releases hydroxide ions (OH⁻) when dissolved in water?",
          hi: "वे साबुन-से लगते, स्वाद में कड़वे, और लाल लिटमस को नीला करते। कौन-सा पदार्थ-वर्ग पानी में घुलने पर हाइड्रॉक्साइड आयन (OH⁻) छोड़ता?",
          mr: "ते साबणासारखे लागतात, चवीला कडू, आणि लाल लिटमसला निळा करतात. कोणता पदार्थ-वर्ग पाण्यात विरघळताना हायड्रॉक्साइड आयन (OH⁻) सोडतो?",
        },
        statement: {
          en: "Bases are substances that release hydroxide ions (OH⁻) in water; they taste bitter, feel soapy, and turn red litmus blue — a base that dissolves in water is called an alkali.",
          hi: "क्षारक वे पदार्थ जो पानी में हाइड्रॉक्साइड आयन (OH⁻) छोड़ते; वे कड़वे, साबुन-से, और लाल लिटमस को नीला करते — पानी में घुलनशील क्षारक क्षार कहलाता।",
          mr: "आम्लारी ते पदार्थ जे पाण्यात हायड्रॉक्साइड आयन (OH⁻) सोडतात; ते कडू, साबणासारखे, आणि लाल लिटमसला निळा करतात — पाण्यात विरघळणारी आम्लारी अल्कली म्हणतात.",
        },
        detail: {
          en: "The OH⁻ ion is to a base what H⁺ is to an acid — and it is these two ions that cancel each other when acid meets base.",
          hi: "OH⁻ आयन क्षारक को वह जो H⁺ अम्ल को — और यही दो आयन एक-दूसरे को रद्द करते जब अम्ल क्षारक से मिले।",
          mr: "OH⁻ आयन आम्लारीला ते जे H⁺ आम्लाला — आणि हेच दोन आयन एकमेकांना रद्द करतात जेव्हा आम्ल आम्लारीला भेटते.",
        },
        extra: {
          en: "Soap, lime water and milk of magnesia are common bases — the last swallowed to calm an acid stomach.",
          hi: "साबुन, चूने का पानी और मिल्क ऑफ़ मैग्नीशिया आम क्षारक — अंतिम अम्लीय पेट शांत करने निगला।",
          mr: "साबण, चुन्याचे पाणी आणि मिल्क ऑफ मॅग्नेशिया सामान्य आम्लारी — शेवटचे आम्लधर्मी पोट शांत करायला गिळलेले.",
        },
        pair: {
          left: {
            en: "Releases OH⁻ in water, bitter, soapy",
            hi: "पानी में OH⁻ छोड़े, कड़वा, साबुन-सा",
            mr: "पाण्यात OH⁻ सोडे, कडू, साबणासारखे",
          },
          right: {
            en: "a base",
            hi: "क्षारक",
            mr: "आम्लारी",
          },
        },
      },
      {
        id: "neutralisation",
        name: {
          en: "Acid–base neutralisation",
          hi: "अम्ल-क्षारक उदासीनीकरण",
          mr: "आम्ल-आम्लारी उदासीनीकरण",
        },
        kind: "reaction",
        prompt: {
          en: "When an acid and a base are mixed in the right amounts, each cancels the other and the mixture becomes neither sour nor bitter, yielding a salt and water. What is this reaction called?",
          hi: "जब अम्ल और क्षारक सही मात्रा में मिलाए जाते, हर एक दूसरे को रद्द करता और मिश्रण न खट्टा न कड़वा रहता, लवण और पानी देता। यह अभिक्रिया क्या कहलाती?",
          mr: "जेव्हा आम्ल आणि आम्लारी योग्य प्रमाणात मिसळली जातात, प्रत्येक दुसऱ्याला रद्द करते आणि मिश्रण ना आंबट ना कडू राहते, क्षार आणि पाणी देते. ही अभिक्रिया काय म्हणतात?",
        },
        statement: {
          en: "Neutralisation is the reaction between an acid and a base that produces a salt and water, as their H⁺ and OH⁻ ions combine to form neutral water.",
          hi: "उदासीनीकरण अम्ल और क्षारक के बीच अभिक्रिया जो लवण और पानी बनाती, जैसे उनके H⁺ और OH⁻ आयन मिलकर उदासीन पानी बनाते।",
          mr: "उदासीनीकरण आम्ल आणि आम्लारीदरम्यानची अभिक्रिया जी क्षार आणि पाणी बनवते, जसे त्यांचे H⁺ आणि OH⁻ आयन मिळून उदासीन पाणी बनवतात.",
        },
        detail: {
          en: "The heart of it is H⁺ + OH⁻ → H₂O — the acid's proton and the base's hydroxide joining to make plain water, leaving the salt behind.",
          hi: "इसका हृदय H⁺ + OH⁻ → H₂O — अम्ल का प्रोटॉन और क्षारक का हाइड्रॉक्साइड जुड़कर सादा पानी बनाते, लवण पीछे छोड़ते।",
          mr: "याचे हृदय H⁺ + OH⁻ → H₂O — आम्लाचा प्रोटॉन आणि आम्लारीचा हायड्रॉक्साइड जुळून साधे पाणी बनवतात, क्षार मागे सोडत.",
        },
        extra: {
          en: "It is why an antacid tablet (a base) eases the burn of too much stomach acid, and why lime is spread on soil that has turned too acidic.",
          hi: "इसी से अम्लनाशक गोली (क्षारक) बहुत ज़्यादा पेट-अम्ल की जलन शांत करती, और बहुत अम्लीय हुई मिट्टी पर चूना बिखेरा जाता।",
          mr: "म्हणूनच आम्लनाशक गोळी (आम्लारी) फार जास्त पोट-आम्लाची जळजळ शांत करते, आणि फार आम्लधर्मी झालेल्या मातीवर चुना पसरवला जातो.",
        },
        pair: {
          left: {
            en: "Acid plus base gives salt and water",
            hi: "अम्ल जमा क्षारक दे लवण और पानी",
            mr: "आम्ल अधिक आम्लारी दे क्षार आणि पाणी",
          },
          right: {
            en: "neutralisation",
            hi: "उदासीनीकरण",
            mr: "उदासीनीकरण",
          },
        },
      },
      {
        id: "ph-scale",
        name: {
          en: "The pH scale",
          hi: "pH मापनी",
          mr: "pH मापनी",
        },
        kind: "idea",
        prompt: {
          en: "A single number from 0 to 14 tells how acidic or basic a solution is — 7 for neutral, lower for acid, higher for base. What is this measure of hydrogen-ion concentration called?",
          hi: "0 से 14 तक एक अकेली संख्या बताती विलयन कितना अम्लीय या क्षारीय — 7 उदासीन को, कम अम्ल को, अधिक क्षारक को। हाइड्रोजन-आयन सांद्रता का यह माप क्या कहलाता?",
          mr: "0 ते 14 पर्यंत एक एकटी संख्या सांगते द्रावण किती आम्लधर्मी वा आम्लारीधर्मी — 7 उदासीनला, कमी आम्लाला, जास्त आम्लारीला. हायड्रोजन-आयन सांद्रतेचे हे माप काय म्हणतात?",
        },
        statement: {
          en: "The pH scale runs from 0 to 14 and measures how acidic or basic a solution is: 7 is neutral, below 7 is acidic (the lower the stronger), and above 7 is basic.",
          hi: "pH मापनी 0 से 14 तक चलती और नापती विलयन कितना अम्लीय या क्षारीय: 7 उदासीन, 7 से नीचे अम्लीय (जितना कम उतना प्रबल), और 7 से ऊपर क्षारीय।",
          mr: "pH मापनी 0 ते 14 पर्यंत चालते आणि मोजते द्रावण किती आम्लधर्मी वा आम्लारीधर्मी: 7 उदासीन, 7 खाली आम्लधर्मी (जितके कमी तितके प्रबळ), आणि 7 वर आम्लारीधर्मी.",
        },
        detail: {
          en: "It tracks the crowding of H⁺ ions — more H⁺ means a lower pH, and each step down the scale means ten times as many H⁺ ions.",
          hi: "यह H⁺ आयनों की भीड़ को ट्रैक करती — अधिक H⁺ यानी कम pH, और मापनी पर हर क़दम नीचे यानी दस गुना अधिक H⁺ आयन।",
          mr: "ती H⁺ आयनांची गर्दी टिपते — अधिक H⁺ म्हणजे कमी pH, आणि मापनीवर प्रत्येक पाऊल खाली म्हणजे दहा पट अधिक H⁺ आयन.",
        },
        extra: {
          en: "pH rules everyday life: our blood must stay near 7.4, tooth enamel dissolves below 5.5, and plants sulk if the soil's pH strays too far.",
          hi: "pH रोज़ के जीवन पर राज करती: हमारा रक्त 7.4 के पास रहे, दाँत का इनैमल 5.5 से नीचे घुलता, और मिट्टी की pH बहुत भटके तो पौधे रूठते।",
          mr: "pH रोजच्या जीवनावर राज्य करते: आपले रक्त 7.4 जवळ राहावे, दाताचे इनॅमल 5.5 खाली विरघळते, आणि मातीची pH फार भटकली तर रोपे रुसतात.",
        },
        pair: {
          left: {
            en: "0 to 14, with 7 as neutral",
            hi: "0 से 14, 7 उदासीन",
            mr: "0 ते 14, 7 उदासीन",
          },
          right: {
            en: "the pH scale",
            hi: "pH मापनी",
            mr: "pH मापनी",
          },
        },
      },
      {
        id: "salts",
        name: {
          en: "Salts and their uses",
          hi: "लवण और उनके उपयोग",
          mr: "क्षार आणि त्यांचे उपयोग",
        },
        kind: "substance",
        prompt: {
          en: "The product of an acid meeting a base gives us table salt, washing soda, baking soda and plaster of Paris — a whole family of useful compounds. What are these compounds called?",
          hi: "अम्ल के क्षारक से मिलने का उत्पाद हमें खाने का नमक, धावन सोडा, खाने का सोडा और प्लास्टर ऑफ़ पेरिस देता — उपयोगी यौगिकों का पूरा कुल। ये यौगिक क्या कहलाते?",
          mr: "आम्ल आम्लारीला भेटण्याचे उत्पाद आपल्याला खाण्याचे मीठ, धुण्याचा सोडा, खाण्याचा सोडा आणि प्लास्टर ऑफ पॅरिस देते — उपयुक्त संयुगांचे अख्खे कुळ. ही संयुगे काय म्हणतात?",
        },
        statement: {
          en: "Salts are the compounds formed when an acid and a base neutralise each other; the family includes common salt, washing soda, baking soda, bleaching powder and plaster of Paris.",
          hi: "लवण वे यौगिक जो अम्ल और क्षारक के एक-दूसरे को उदासीन करने पर बनते; कुल में खाने का नमक, धावन सोडा, खाने का सोडा, विरंजक चूर्ण और प्लास्टर ऑफ़ पेरिस।",
          mr: "क्षार ती संयुगे जी आम्ल आणि आम्लारी एकमेकांना उदासीन करताना बनतात; कुळात खाण्याचे मीठ, धुण्याचा सोडा, खाण्याचा सोडा, विरंजक चूर्ण आणि प्लास्टर ऑफ पॅरिस.",
        },
        detail: {
          en: "Common salt (sodium chloride) is the parent of many — electrolysing its solution yields the chlorine, hydrogen and sodium hydroxide behind bleaching powder, baking soda and washing soda.",
          hi: "खाने का नमक (सोडियम क्लोराइड) अनेकों का जनक — इसके विलयन के विद्युत-अपघटन से क्लोरीन, हाइड्रोजन और सोडियम हाइड्रॉक्साइड मिलते जो विरंजक चूर्ण, खाने के सोडे और धावन सोडे के पीछे।",
          mr: "खाण्याचे मीठ (सोडियम क्लोराइड) अनेकांचे जनक — त्याच्या द्रावणाच्या विद्युत-अपघटनातून क्लोरीन, हायड्रोजन आणि सोडियम हायड्रॉक्साइड मिळतात जे विरंजक चूर्ण, खाण्याचा सोडा आणि धुण्याच्या सोड्यामागे.",
        },
        extra: {
          en: "Plaster of Paris sets hard by taking up water, which is why a doctor wraps a broken bone in it wet and it hardens into a cast.",
          hi: "प्लास्टर ऑफ़ पेरिस पानी लेकर कड़ा जमता, इसी से डॉक्टर टूटी हड्डी को गीला लपेटता और यह ढाँचे में कड़ा हो जाता।",
          mr: "प्लास्टर ऑफ पॅरिस पाणी घेऊन कठीण जमते, म्हणूनच डॉक्टर मोडलेले हाड ओले गुंडाळतो आणि ते साच्यात कठीण होते.",
        },
        pair: {
          left: {
            en: "The product of neutralisation, many everyday uses",
            hi: "उदासीनीकरण का उत्पाद, अनेक रोज़ उपयोग",
            mr: "उदासीनीकरणाचे उत्पाद, अनेक रोजचे उपयोग",
          },
          right: {
            en: "a salt",
            hi: "लवण",
            mr: "क्षार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A person with acidity swallows an antacid tablet and the burning in the stomach quickly eases. The tablet is a mild base. Explain, in terms of ions and pH, why swallowing a base relieves an acidic stomach.",
          hi: "अम्लता से पीड़ित व्यक्ति एक अम्लनाशक गोली निगलता और पेट की जलन जल्दी शांत हो जाती। गोली एक हल्का क्षारक है। आयनों और pH के संदर्भ में समझाइए, क्षारक निगलना अम्लीय पेट को क्यों राहत देता।",
          mr: "आम्लपित्ताने त्रस्त व्यक्ती एक आम्लनाशक गोळी गिळते आणि पोटातील जळजळ लवकर शांत होते. गोळी एक सौम्य आम्लारी आहे. आयन आणि pH च्या संदर्भात समजावा, आम्लारी गिळणे आम्लधर्मी पोटाला का आराम देते.",
        },
        choices: [
          {
            en: "The stomach's excess acid is full of H⁺ ions, giving a very low pH; the base provides OH⁻ ions that combine with the H⁺ to form neutral water (H⁺ + OH⁻ → H₂O), cutting the H⁺ crowd and raising the pH toward neutral, so the burn eases — this is neutralisation",
            hi: "पेट का अधिक अम्ल H⁺ आयनों से भरा, बहुत कम pH देता; क्षारक OH⁻ आयन देता जो H⁺ से मिलकर उदासीन पानी बनाते (H⁺ + OH⁻ → H₂O), H⁺ भीड़ घटाते और pH उदासीन की ओर उठाते, अतः जलन शांत — यह उदासीनीकरण",
            mr: "पोटातील जास्त आम्ल H⁺ आयनांनी भरलेले, फार कमी pH देते; आम्लारी OH⁻ आयन देते जे H⁺ शी मिळून उदासीन पाणी बनवतात (H⁺ + OH⁻ → H₂O), H⁺ गर्दी घटवत आणि pH उदासीनकडे उंचावत, म्हणून जळजळ शांत — हे उदासीनीकरण",
          },
          {
            en: "The base makes the stomach even more acidic, which somehow feels better",
            hi: "क्षारक पेट को और भी अम्लीय बनाता, जो किसी तरह बेहतर लगता",
            mr: "आम्लारी पोटाला आणखी आम्लधर्मी बनवते, जे कसेतरी बरे वाटते",
          },
          {
            en: "The tablet coats the stomach with a plastic layer and no reaction occurs",
            hi: "गोली पेट को प्लास्टिक परत से ढकती और कोई अभिक्रिया नहीं होती",
            mr: "गोळी पोटाला प्लास्टिक थराने झाकते आणि कोणतीही अभिक्रिया होत नाही",
          },
          {
            en: "The base removes all water from the stomach, ending the burn",
            hi: "क्षारक पेट से सारा पानी हटाता, जलन समाप्त करता",
            mr: "आम्लारी पोटातून सारे पाणी काढते, जळजळ संपवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Acidity is a case of too much acid — the stomach normally makes hydrochloric acid to digest food, and when it makes too much, the fluid is crowded with hydrogen ions (H⁺) and its pH drops well below the comfortable range, which we feel as burning. An antacid is a mild base, and a base supplies the opposite ion, hydroxide (OH⁻). When the tablet dissolves, its OH⁻ ions meet the excess H⁺ ions and the two combine to form plain, neutral water: H⁺ + OH⁻ → H₂O. Every pair that joins removes one H⁺ from the fluid, thinning out the H⁺ crowd and pushing the pH back up toward 7. As the acidity falls, so does the burning. This is precisely a neutralisation reaction — acid plus base giving a salt and water — happening inside the stomach. The antacid must be only a mild base, not a strong one, because a strong base would overshoot and make the stomach basic, which would be just as harmful. The same logic runs through everyday life: farmers spread lime (a base) on soil that has turned too acidic, and toothpaste (mildly basic) neutralises the acids that bacteria make on our teeth. In every case a base is used to cancel an excess of acid by turning H⁺ and OH⁻ into water.",
          hi: "अम्लता बहुत अधिक अम्ल का मामला — पेट सामान्यतः भोजन पचाने हाइड्रोक्लोरिक अम्ल बनाता, और जब बहुत बनाता, तरल हाइड्रोजन आयनों (H⁺) से भरा और उसकी pH सुखद परास से बहुत नीचे गिरती, जिसे हम जलन महसूस करते। अम्लनाशक हल्का क्षारक, और क्षारक उल्टा आयन, हाइड्रॉक्साइड (OH⁻), देता। जब गोली घुलती, उसके OH⁻ आयन अधिक H⁺ आयनों से मिलते और दोनों जुड़कर सादा, उदासीन पानी बनाते: H⁺ + OH⁻ → H₂O. जुड़ती हर जोड़ी तरल से एक H⁺ हटाती, H⁺ भीड़ पतली करती और pH को 7 की ओर वापस धकेलती। जैसे अम्लता गिरती, वैसे जलन। यह ठीक उदासीनीकरण अभिक्रिया — अम्ल जमा क्षारक देता लवण और पानी — पेट के भीतर होती। अम्लनाशक केवल हल्का क्षारक हो, प्रबल नहीं, क्योंकि प्रबल क्षारक हद पार कर पेट को क्षारीय बना देता, जो उतना ही हानिकारक। वही तर्क रोज़ के जीवन में चलता: किसान बहुत अम्लीय हुई मिट्टी पर चूना (क्षारक) बिखेरते, और टूथपेस्ट (हल्का क्षारीय) दाँतों पर जीवाणुओं के बनाए अम्ल उदासीन करता। हर मामले में क्षारक अम्ल की अधिकता रद्द करने H⁺ और OH⁻ को पानी बनाकर वापरा।",
          mr: "आम्लपित्त फार जास्त आम्लाचे प्रकरण — पोट सामान्यतः अन्न पचवायला हायड्रोक्लोरिक आम्ल बनवते, आणि जेव्हा फार बनवते, द्रव हायड्रोजन आयनांनी (H⁺) भरलेले आणि त्याची pH सुखद पल्ल्याहून बरीच खाली घसरते, जी आपण जळजळ अनुभवतो. आम्लनाशक सौम्य आम्लारी, आणि आम्लारी उलट आयन, हायड्रॉक्साइड (OH⁻), देते. जेव्हा गोळी विरघळते, तिचे OH⁻ आयन जास्त H⁺ आयनांना भेटतात आणि दोन्ही जुळून साधे, उदासीन पाणी बनवतात: H⁺ + OH⁻ → H₂O. जुळणारी प्रत्येक जोडी द्रवातून एक H⁺ काढते, H⁺ गर्दी पातळ करत आणि pH ला 7 कडे परत ढकलत. जशी आम्लता घसरते, तशी जळजळ. ही नेमकी उदासीनीकरण अभिक्रिया — आम्ल अधिक आम्लारी देते क्षार आणि पाणी — पोटाच्या आत होणारी. आम्लनाशक फक्त सौम्य आम्लारी असावे, प्रबळ नाही, कारण प्रबळ आम्लारी सीमा ओलांडून पोटाला आम्लारीधर्मी बनवेल, जे तितकेच हानिकारक. तेच तर्कशास्त्र रोजच्या जीवनात चालते: शेतकरी फार आम्लधर्मी झालेल्या मातीवर चुना (आम्लारी) पसरवतात, आणि टूथपेस्ट (सौम्य आम्लारी) दातांवर जीवाणूंनी बनवलेली आम्ले उदासीन करते. प्रत्येक बाबतीत आम्लारी आम्लाचे आधिक्य रद्द करायला H⁺ आणि OH⁻ ला पाणी बनवून वापरली.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student says 'hydrochloric acid is dangerous and acetic acid (vinegar) is safe, so hydrochloric acid must be more concentrated.' But you can have very dilute hydrochloric acid and very concentrated vinegar. What is the student confusing, and what is the real difference?",
          hi: "एक छात्र कहता 'हाइड्रोक्लोरिक अम्ल ख़तरनाक और एसीटिक अम्ल (सिरका) सुरक्षित, अतः हाइड्रोक्लोरिक अम्ल अधिक सांद्र होगा।' पर तुम्हारे पास बहुत तनु हाइड्रोक्लोरिक अम्ल और बहुत सांद्र सिरका हो सकता। छात्र क्या गड़बड़ा रहा, और असली अंतर क्या?",
          mr: "एक विद्यार्थी म्हणतो 'हायड्रोक्लोरिक आम्ल धोकादायक आणि अ‍ॅसिटिक आम्ल (व्हिनेगर) सुरक्षित, म्हणून हायड्रोक्लोरिक आम्ल अधिक संहत असेल.' पण तुझ्याकडे फार विरळ हायड्रोक्लोरिक आम्ल आणि फार संहत व्हिनेगर असू शकते. विद्यार्थी काय गोंधळतोय, आणि खरा फरक काय?",
        },
        choices: [
          {
            en: "The student confuses strength with concentration. Concentration is how much acid is dissolved in water; strength is what fraction of the acid's molecules actually release H⁺ ions. HCl is a strong acid (nearly all molecules ionise) while acetic acid is weak (only a few do), so even at the same concentration HCl gives far more H⁺ and a lower pH",
            hi: "छात्र प्रबलता को सांद्रता से गड़बड़ाता। सांद्रता कितना अम्ल पानी में घुला; प्रबलता अम्ल के अणुओं का कितना भाग वास्तव में H⁺ छोड़ता। HCl प्रबल अम्ल (लगभग सभी अणु आयनित) जबकि एसीटिक अम्ल दुर्बल (केवल कुछ), अतः समान सांद्रता पर भी HCl कहीं अधिक H⁺ और कम pH देता",
            mr: "विद्यार्थी प्रबळता संहततेशी गोंधळतो. संहतता किती आम्ल पाण्यात विरघळले; प्रबळता आम्लाच्या रेणूंचा किती भाग प्रत्यक्षात H⁺ सोडतो. HCl प्रबळ आम्ल (जवळपास सारे रेणू आयनित) तर अ‍ॅसिटिक आम्ल दुर्बल (फक्त काही), म्हणून समान संहततेवरही HCl कितीतरी अधिक H⁺ आणि कमी pH देते",
          },
          {
            en: "Nothing is confused; a dangerous acid is always more concentrated than a safe one",
            hi: "कुछ नहीं गड़बड़ाया; ख़तरनाक अम्ल सदा सुरक्षित से अधिक सांद्र",
            mr: "काही गोंधळलेले नाही; धोकादायक आम्ल नेहमी सुरक्षिताहून अधिक संहत",
          },
          {
            en: "Strength and concentration mean exactly the same thing",
            hi: "प्रबलता और सांद्रता का ठीक एक ही अर्थ",
            mr: "प्रबळता आणि संहतता यांचा नेमका एकच अर्थ",
          },
          {
            en: "Acetic acid releases more H⁺ ions than hydrochloric acid does",
            hi: "एसीटिक अम्ल हाइड्रोक्लोरिक अम्ल से अधिक H⁺ आयन छोड़ता",
            mr: "अ‍ॅसिटिक आम्ल हायड्रोक्लोरिक आम्लाहून अधिक H⁺ आयन सोडते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has merged two different ideas — concentration and strength — that chemistry keeps carefully apart. Concentration is simply how much acid is dissolved in a given amount of water: a lot of acid in little water is concentrated, a little acid in much water is dilute. You can make any acid concentrated or dilute just by adding or removing water; that has nothing to do with which acid it is. Strength is a different property altogether. When an acid dissolves, its molecules can split to release H⁺ ions — but not every acid does this to the same extent. A strong acid like hydrochloric acid ionises almost completely: nearly every HCl molecule gives up its H⁺, so the solution is packed with hydrogen ions. A weak acid like the acetic acid in vinegar only ionises a little: most of its molecules stay whole and hold onto their H⁺, so far fewer hydrogen ions are set free. Because acidity — the sour taste, the burn, the low pH, the vigour of reactions — comes from the H⁺ ions actually present, a strong acid is fiercer than a weak one even at the same concentration, and it is this that makes hydrochloric acid the more dangerous. The two properties are independent: you can have dilute-but-strong (a little HCl in a lot of water, still fully ionised) or concentrated-but-weak (lots of acetic acid, still only partly ionised). So the right questions are two, not one — 'how much acid is dissolved?' (concentration) and 'how completely does it ionise?' (strength) — and only both together tell you how many H⁺ ions, and hence how low the pH, the solution really has.",
          hi: "छात्र ने दो भिन्न विचार — सांद्रता और प्रबलता — मिला दिए जिन्हें रसायन सावधानी से अलग रखती। सांद्रता बस कितना अम्ल दी गई पानी-मात्रा में घुला: थोड़े पानी में बहुत अम्ल सांद्र, बहुत पानी में थोड़ा अम्ल तनु। किसी भी अम्ल को पानी जोड़-हटाकर सांद्र या तनु बना सकते; इसका इससे कोई संबंध नहीं कौन-सा अम्ल। प्रबलता बिलकुल भिन्न गुण। जब अम्ल घुलता, उसके अणु H⁺ आयन छोड़ने बँट सकते — पर हर अम्ल उतना नहीं करता। हाइड्रोक्लोरिक जैसा प्रबल अम्ल लगभग पूरी तरह आयनित: लगभग हर HCl अणु अपना H⁺ देता, अतः विलयन हाइड्रोजन आयनों से भरा। सिरके के एसीटिक जैसा दुर्बल अम्ल केवल थोड़ा आयनित: उसके अधिकांश अणु पूरे रहते और अपना H⁺ थामे, अतः कहीं कम हाइड्रोजन आयन मुक्त। क्योंकि अम्लता — खट्टा स्वाद, जलन, कम pH, अभिक्रियाओं की तेज़ी — वास्तव में मौजूद H⁺ आयनों से आती, प्रबल अम्ल समान सांद्रता पर भी दुर्बल से प्रचंड, और यही हाइड्रोक्लोरिक अम्ल को अधिक ख़तरनाक बनाता। दो गुण स्वतंत्र: तनु-पर-प्रबल (बहुत पानी में थोड़ा HCl, फिर भी पूर्ण आयनित) या सांद्र-पर-दुर्बल (बहुत एसीटिक अम्ल, फिर भी केवल आंशिक आयनित) हो सकता। अतः सही सवाल दो, एक नहीं — 'कितना अम्ल घुला?' (सांद्रता) और 'कितना पूरा आयनित?' (प्रबलता) — और केवल दोनों साथ बताते कितने H⁺ आयन, और अतः विलयन की pH कितनी नीची।",
          mr: "विद्यार्थ्याने दोन वेगळ्या कल्पना — संहतता आणि प्रबळता — मिसळल्या ज्या रसायनशास्त्र काळजीपूर्वक वेगळ्या ठेवते. संहतता फक्त किती आम्ल दिलेल्या पाणी-प्रमाणात विरघळले: थोड्या पाण्यात पुष्कळ आम्ल संहत, पुष्कळ पाण्यात थोडे आम्ल विरळ. कोणतेही आम्ल पाणी जोडून-काढून संहत वा विरळ बनवता येते; याचा त्याच्याशी संबंध नाही कोणते आम्ल. प्रबळता अगदी वेगळा गुण. जेव्हा आम्ल विरघळते, त्याचे रेणू H⁺ आयन सोडायला विभागू शकतात — पण प्रत्येक आम्ल तितके करत नाही. हायड्रोक्लोरिकसारखे प्रबळ आम्ल जवळपास पूर्णपणे आयनित: जवळपास प्रत्येक HCl रेणू आपला H⁺ देतो, म्हणून द्रावण हायड्रोजन आयनांनी भरलेले. व्हिनेगरमधल्या अ‍ॅसिटिकसारखे दुर्बल आम्ल फक्त थोडे आयनित: त्याचे बहुतांश रेणू पूर्ण राहतात आणि आपला H⁺ धरतात, म्हणून कितीतरी कमी हायड्रोजन आयन मुक्त. कारण आम्लधर्म — आंबट चव, जळजळ, कमी pH, अभिक्रियांचा जोम — प्रत्यक्षात असलेल्या H⁺ आयनांतून येतो, प्रबळ आम्ल समान संहततेवरही दुर्बलाहून प्रखर, आणि हेच हायड्रोक्लोरिक आम्लाला अधिक धोकादायक बनवते. दोन गुण स्वतंत्र: विरळ-पण-प्रबळ (पुष्कळ पाण्यात थोडे HCl, तरी पूर्ण आयनित) किंवा संहत-पण-दुर्बल (पुष्कळ अ‍ॅसिटिक आम्ल, तरी फक्त अंशतः आयनित) असू शकते. म्हणून योग्य प्रश्न दोन, एक नाही — 'किती आम्ल विरघळले?' (संहतता) आणि 'किती पूर्ण आयनित होते?' (प्रबळता) — आणि फक्त दोन्ही एकत्र सांगतात किती H⁺ आयन, आणि म्हणून द्रावणाची pH किती खाली.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Metals and Non-metals                                       */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-metals-non-metals",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 3 — Metals and Non-metals",
      hi: "अध्याय 3 — धातु एवं अधातु",
      mr: "प्रकरण 3 — धातू आणि अधातू",
    },
    name: {
      en: "Metals and Non-metals",
      hi: "धातु एवं अधातु",
      mr: "धातू आणि अधातू",
    },
    summary: {
      en: "The two great families of elements: metals that shine, bend and conduct, ranked by reactivity; non-metals that do the opposite; the ionic bond struck when a metal hands electrons to a non-metal; and the winning of metals from their ores and their guarding against rust.",
      hi: "तत्वों के दो बड़े कुल: चमकतीं, मुड़तीं और चालन करतीं धातुएँ, क्रियाशीलता से क्रमित; उल्टा करतीं अधातुएँ; धातु द्वारा अधातु को इलेक्ट्रॉन सौंपने पर बना आयनिक बंध; और अयस्कों से धातुओं का जीतना और जंग से उनका बचाव।",
      mr: "मूलद्रव्यांची दोन मोठी कुळे: चमकणाऱ्या, वाकणाऱ्या आणि वहन करणाऱ्या धातू, क्रियाशीलतेने क्रमित; उलट करणाऱ्या अधातू; धातूने अधातूला इलेक्ट्रॉन दिल्यावर बनलेला आयनिक बंध; आणि धातूंचे धातुकांतून जिंकणे आणि गंजापासून त्यांचे रक्षण.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "metal-properties",
        name: {
          en: "Physical properties of metals",
          hi: "धातुओं के भौतिक गुण",
          mr: "धातूंचे भौतिक गुणधर्म",
        },
        kind: "idea",
        prompt: {
          en: "They gleam when polished, can be hammered into sheets or drawn into wires, ring when struck, and carry heat and electricity well. What class of elements has these physical traits?",
          hi: "वे चमकाने पर दमकतीं, चादरों में पीटी या तारों में खींची जा सकतीं, ठोकने पर बजतीं, और ऊष्मा-बिजली अच्छी ढोतीं। किन तत्वों में ये भौतिक गुण?",
          mr: "त्या चमकवल्यावर झळकतात, पत्र्यांत ठोकता वा तारांत ओढता येतात, ठोकल्यावर वाजतात, आणि उष्णता-वीज चांगली वाहतात. कोणत्या मूलद्रव्यांत हे भौतिक गुण?",
        },
        statement: {
          en: "Metals are lustrous, malleable (can be beaten into sheets), ductile (can be drawn into wires), sonorous, and good conductors of heat and electricity.",
          hi: "धातुएँ चमकीली, आघातवर्ध्य (चादरों में पीटी जा सकतीं), तन्य (तारों में खींची जा सकतीं), ध्वानिक, और ऊष्मा-बिजली की अच्छी चालक।",
          mr: "धातू चमकदार, वर्धनीय (पत्र्यांत ठोकता येतात), तन्य (तारांत ओढता येतात), नादमय, आणि उष्णता-विजेच्या चांगल्या वाहक.",
        },
        detail: {
          en: "There are exceptions that keep chemistry humble — mercury is a liquid metal, and sodium is soft enough to cut with a knife.",
          hi: "अपवाद हैं जो रसायन को विनम्र रखते — पारा द्रव धातु, और सोडियम चाकू से काटने भर मुलायम।",
          mr: "अपवाद आहेत जे रसायनशास्त्राला नम्र ठेवतात — पारा द्रव धातू, आणि सोडियम चाकूने कापण्याइतके मऊ.",
        },
        extra: {
          en: "Non-metals are the mirror image — dull, brittle, non-conducting — with their own exception in graphite, a non-metal that conducts electricity.",
          hi: "अधातुएँ दर्पण-छवि — मंद, भंगुर, अचालक — अपने अपवाद ग्रेफ़ाइट के साथ, बिजली चलाती अधातु।",
          mr: "अधातू आरशातली प्रतिमा — निस्तेज, ठिसूळ, अवाहक — आपल्या अपवाद ग्रॅफाइटसह, वीज वाहणारा अधातू.",
        },
        pair: {
          left: {
            en: "Lustrous, malleable, ductile, conducting",
            hi: "चमकीली, आघातवर्ध्य, तन्य, चालक",
            mr: "चमकदार, वर्धनीय, तन्य, वाहक",
          },
          right: {
            en: "metals",
            hi: "धातुएँ",
            mr: "धातू",
          },
        },
      },
      {
        id: "reactivity-series",
        name: {
          en: "The reactivity series",
          hi: "क्रियाशीलता श्रेणी",
          mr: "क्रियाशीलता श्रेणी",
        },
        kind: "idea",
        prompt: {
          en: "Potassium and sodium react with water violently, iron only rusts slowly, and gold barely reacts at all. What is the ranking of metals from most to least reactive called?",
          hi: "पोटैशियम और सोडियम पानी से प्रचंड अभिक्रिया करते, लोहा केवल धीरे जंग खाता, और सोना मुश्किल से कोई अभिक्रिया। धातुओं का सबसे अधिक से सबसे कम क्रियाशील क्रम क्या कहलाता?",
          mr: "पोटॅशियम आणि सोडियम पाण्याशी प्रचंड क्रिया करतात, लोखंड फक्त हळू गंजते, आणि सोने जेमतेम क्रिया करते. धातूंचा सर्वांत अधिक ते सर्वांत कमी क्रियाशील क्रम काय म्हणतात?",
        },
        statement: {
          en: "The reactivity series ranks metals from most to least reactive — potassium, sodium and calcium at the top, iron and lead in the middle, and copper, silver and gold at the bottom.",
          hi: "क्रियाशीलता श्रेणी धातुओं को सबसे अधिक से सबसे कम क्रियाशील क्रमित करती — शीर्ष पर पोटैशियम, सोडियम, कैल्शियम, मध्य में लोहा-सीसा, और तल पर ताँबा, चाँदी, सोना।",
          mr: "क्रियाशीलता श्रेणी धातूंना सर्वांत अधिक ते सर्वांत कमी क्रियाशील क्रमित करते — शिखरावर पोटॅशियम, सोडियम, कॅल्शियम, मध्यात लोखंड-शिसे, आणि तळाशी तांबे, चांदी, सोने.",
        },
        detail: {
          en: "A metal higher in the series can displace a lower one from its compound, and reacts more readily with air, water and acids.",
          hi: "श्रेणी में ऊँची धातु नीची को उसके यौगिक से विस्थापित कर सकती, और हवा, पानी, अम्ल से अधिक सहज अभिक्रिया करती।",
          mr: "श्रेणीत उंच धातू खालच्याला त्याच्या संयुगातून विस्थापित करू शकते, आणि हवा, पाणी, आम्लाशी अधिक सहज क्रिया करते.",
        },
        extra: {
          en: "The order explains the world: reactive metals live locked in compounds, while gold, at the very bottom, is found gleaming and pure in the earth.",
          hi: "क्रम दुनिया समझाता: क्रियाशील धातुएँ यौगिकों में बंद रहतीं, जबकि सोना, बिलकुल तल पर, धरती में दमकता और शुद्ध मिलता।",
          mr: "क्रम जग समजावतो: क्रियाशील धातू संयुगांत बंद राहतात, तर सोने, अगदी तळाशी, जमिनीत झळकत आणि शुद्ध मिळते.",
        },
        pair: {
          left: {
            en: "Metals ranked most to least reactive",
            hi: "धातुएँ सबसे अधिक से कम क्रियाशील क्रमित",
            mr: "धातू सर्वांत अधिक ते कमी क्रियाशील क्रमित",
          },
          right: {
            en: "the reactivity series",
            hi: "क्रियाशीलता श्रेणी",
            mr: "क्रियाशीलता श्रेणी",
          },
        },
      },
      {
        id: "ionic-bond",
        name: {
          en: "The ionic bond",
          hi: "आयनिक बंध",
          mr: "आयनिक बंध",
        },
        kind: "idea",
        prompt: {
          en: "When sodium meets chlorine, the metal hands over an electron and both become charged ions that lock together by electrical attraction. What kind of bond forms between a metal and a non-metal this way?",
          hi: "जब सोडियम क्लोरीन से मिलता, धातु एक इलेक्ट्रॉन सौंपती और दोनों आवेशित आयन बनते जो विद्युत आकर्षण से जुड़ते। धातु और अधातु के बीच यों कौन-सा बंध बनता?",
          mr: "जेव्हा सोडियम क्लोरीनला भेटतो, धातू एक इलेक्ट्रॉन देते आणि दोन्ही भारित आयन बनतात जे विद्युत आकर्षणाने जुळतात. धातू आणि अधातूदरम्यान अशा प्रकारे कोणता बंध बनतो?",
        },
        statement: {
          en: "An ionic bond forms when a metal gives up electrons to a non-metal, making positive and negative ions that are held together by strong electrostatic attraction.",
          hi: "आयनिक बंध तब बनता जब धातु अधातु को इलेक्ट्रॉन देती, धन और ऋण आयन बनाते जो प्रबल स्थिर-वैद्युत आकर्षण से जुड़े।",
          mr: "आयनिक बंध तेव्हा बनतो जेव्हा धातू अधातूला इलेक्ट्रॉन देते, धन आणि ऋण आयन बनवत जे प्रबळ स्थिर-विद्युत आकर्षणाने जुळलेले.",
        },
        detail: {
          en: "The strong attraction between the ions gives ionic compounds high melting points and hard, crystalline solids.",
          hi: "आयनों के बीच प्रबल आकर्षण आयनिक यौगिकों को ऊँचे गलनांक और कठोर, क्रिस्टलीय ठोस देता।",
          mr: "आयनांमधले प्रबळ आकर्षण आयनिक संयुगांना उच्च वितळणबिंदू आणि कठीण, स्फटिकमय घन देते.",
        },
        extra: {
          en: "Such compounds do not conduct electricity as solids, because the ions are locked in place — but they conduct when molten or dissolved, when the ions are free to move.",
          hi: "ऐसे यौगिक ठोस रूप में बिजली नहीं चलाते, क्योंकि आयन जगह पर बंद — पर पिघले या घुले वे चलाते, जब आयन चलने को मुक्त।",
          mr: "अशी संयुगे घन रूपात वीज वाहत नाहीत, कारण आयन जागी बंद — पण वितळलेली वा विरघळलेली ती वाहतात, जेव्हा आयन हलायला मुक्त.",
        },
        pair: {
          left: {
            en: "Metal gives electrons, ions attract",
            hi: "धातु इलेक्ट्रॉन दे, आयन आकर्षित",
            mr: "धातू इलेक्ट्रॉन दे, आयन आकर्षित",
          },
          right: {
            en: "the ionic bond",
            hi: "आयनिक बंध",
            mr: "आयनिक बंध",
          },
        },
      },
      {
        id: "metal-reactions",
        name: {
          en: "Reactions of metals",
          hi: "धातुओं की अभिक्रियाएँ",
          mr: "धातूंच्या अभिक्रिया",
        },
        kind: "idea",
        prompt: {
          en: "Metals burn or tarnish in air to form oxides, some fizz in water, and many react with acids to release hydrogen. What do we call this whole set of chemical behaviours of metals?",
          hi: "धातुएँ हवा में जलतीं या मलिन होतीं ऑक्साइड बनातीं, कुछ पानी में बुदबुदातीं, और कई अम्लों से हाइड्रोजन छोड़तीं। धातुओं के इस पूरे रासायनिक व्यवहार-समूह को क्या कहते?",
          mr: "धातू हवेत जळतात वा काळवंडतात ऑक्साइड बनवत, काही पाण्यात बुडबुडतात, आणि अनेक आम्लांशी हायड्रोजन सोडतात. धातूंच्या या अख्ख्या रासायनिक वर्तन-समूहाला काय म्हणतो?",
        },
        statement: {
          en: "Metals react chemically in typical ways — with oxygen to form basic oxides, with water to give hydroxides or oxides and hydrogen, and with dilute acids to release hydrogen gas.",
          hi: "धातुएँ विशिष्ट तरीक़ों से रासायनिक अभिक्रिया करतीं — ऑक्सीजन से क्षारकीय ऑक्साइड, पानी से हाइड्रॉक्साइड या ऑक्साइड और हाइड्रोजन, और तनु अम्लों से हाइड्रोजन गैस छोड़तीं।",
          mr: "धातू विशिष्ट मार्गांनी रासायनिक क्रिया करतात — ऑक्सिजनशी आम्लारीधर्मी ऑक्साइड, पाण्याशी हायड्रॉक्साइड वा ऑक्साइड आणि हायड्रोजन, आणि विरळ आम्लांशी हायड्रोजन वायू सोडत.",
        },
        detail: {
          en: "How eagerly a metal does all this is set by its place in the reactivity series — sodium bursts into flame on water, gold shrugs off acid.",
          hi: "धातु यह सब कितनी उत्सुकता से करती उसकी क्रियाशीलता-श्रेणी की जगह से तय — सोडियम पानी पर आग पकड़ता, सोना अम्ल को झटक देता।",
          mr: "धातू हे सारे किती उत्सुकतेने करते तिच्या क्रियाशीलता-श्रेणीतील जागेने ठरते — सोडियम पाण्यावर पेट घेतो, सोने आम्ल झटकते.",
        },
        extra: {
          en: "The oxide it makes reveals its nature — metal oxides are basic and turn red litmus blue, unlike the acidic oxides of non-metals.",
          hi: "बनाया ऑक्साइड उसका स्वभाव उजागर करता — धातु-ऑक्साइड क्षारकीय और लाल लिटमस को नीला करते, अधातुओं के अम्लीय ऑक्साइड के विपरीत।",
          mr: "बनवलेला ऑक्साइड त्याचा स्वभाव उघड करतो — धातू-ऑक्साइड आम्लारीधर्मी आणि लाल लिटमसला निळा करतात, अधातूंच्या आम्लधर्मी ऑक्साइडविरुद्ध.",
        },
        pair: {
          left: {
            en: "With oxygen, water and acids in typical ways",
            hi: "ऑक्सीजन, पानी, अम्ल से विशिष्ट तरीक़ों",
            mr: "ऑक्सिजन, पाणी, आम्लाशी विशिष्ट मार्गांनी",
          },
          right: {
            en: "reactions of metals",
            hi: "धातुओं की अभिक्रियाएँ",
            mr: "धातूंच्या अभिक्रिया",
          },
        },
      },
      {
        id: "metallurgy",
        name: {
          en: "Extraction of metals",
          hi: "धातुओं का निष्कर्षण",
          mr: "धातूंचे निष्कर्षण",
        },
        kind: "method",
        prompt: {
          en: "Most metals hide in the earth as compounds in ores, and must be roasted, then reduced to free the metal from its oxide. What is this science of winning a metal from its ore called?",
          hi: "अधिकांश धातुएँ धरती में अयस्कों में यौगिकों के रूप में छिपीं, और उन्हें भूनकर, फिर अपचयित कर ऑक्साइड से धातु मुक्त करनी होती। अयस्क से धातु जीतने का यह विज्ञान क्या कहलाता?",
          mr: "बहुतांश धातू जमिनीत धातुकांत संयुगांच्या रूपात दडलेल्या, आणि त्यांना भाजून, मग क्षपित करून ऑक्साइडमधून धातू मुक्त करावी लागते. धातुकातून धातू जिंकण्याचे हे शास्त्र काय म्हणतात?",
        },
        statement: {
          en: "Metallurgy is the extraction of a metal from its ore — the ore is concentrated, converted to the oxide by roasting or calcination, and then reduced to set the pure metal free.",
          hi: "धातुकर्म अयस्क से धातु का निष्कर्षण — अयस्क सांद्रित, भूनने या निस्तापन से ऑक्साइड में बदला, फिर अपचयित कर शुद्ध धातु मुक्त की जाती।",
          mr: "धातुशास्त्र धातुकातून धातूचे निष्कर्षण — धातुक संहत, भाजणे वा निस्तापनाने ऑक्साइडमध्ये बदलले, मग क्षपित करून शुद्ध धातू मुक्त केली जाते.",
        },
        detail: {
          en: "How the oxide is reduced depends on reactivity — a reactive metal like aluminium is won by passing electricity, a middling one like iron by heating with carbon.",
          hi: "ऑक्साइड कैसे अपचयित हो क्रियाशीलता पर निर्भर — एल्युमिनियम जैसी क्रियाशील धातु बिजली प्रवाहित कर जीती, लोहे जैसी मध्यम कार्बन के साथ गरम कर।",
          mr: "ऑक्साइड कसा क्षपित व्हावा क्रियाशीलतेवर अवलंबून — अ‍ॅल्युमिनियमसारखी क्रियाशील धातू वीज पाठवून जिंकली, लोखंडासारखी मध्यम कार्बनसह तापवून.",
        },
        extra: {
          en: "The least reactive metals — gold, silver, platinum — need no reduction at all, for they lie in the earth already as the free metal.",
          hi: "सबसे कम क्रियाशील धातुएँ — सोना, चाँदी, प्लैटिनम — किसी अपचयन की ज़रूरत नहीं, क्योंकि वे धरती में पहले से मुक्त धातु के रूप में।",
          mr: "सर्वांत कमी क्रियाशील धातू — सोने, चांदी, प्लॅटिनम — कोणत्याही क्षपणाची गरज नाही, कारण त्या जमिनीत आधीच मुक्त धातूच्या रूपात.",
        },
        pair: {
          left: {
            en: "Roast then reduce the ore to free the metal",
            hi: "अयस्क भूनो फिर अपचयित कर धातु मुक्त करो",
            mr: "धातुक भाजा मग क्षपित करून धातू मुक्त करा",
          },
          right: {
            en: "metallurgy",
            hi: "धातुकर्म",
            mr: "धातुशास्त्र",
          },
        },
      },
      {
        id: "corrosion",
        name: {
          en: "Corrosion and its prevention",
          hi: "संक्षारण और उसकी रोकथाम",
          mr: "गंजणे आणि त्याचे प्रतिबंध",
        },
        kind: "idea",
        prompt: {
          en: "Iron left in damp air slowly crumbles into a flaky brown coat, and silver dulls to black — the metal eaten away by air and moisture. What is this slow spoiling, and how is it fought?",
          hi: "नम हवा में छोड़ा लोहा धीरे परतदार भूरे लेप में भुरभुराता, और चाँदी काले में मलिन — हवा-नमी से खाई धातु। यह धीमा बिगाड़ क्या, और कैसे लड़ा जाता?",
          mr: "ओलसर हवेत सोडलेले लोखंड हळू पापुद्रेदार तपकिरी आवरणात भुसभुशीत होते, आणि चांदी काळ्यात निस्तेज — हवा-ओलाव्याने खाल्लेली धातू. हे मंद बिघडणे काय, आणि कसे लढले जाते?",
        },
        statement: {
          en: "Corrosion is the slow eating-away of a metal by air and moisture — like iron rusting — and it is prevented by keeping air and water out through painting, oiling, galvanising or alloying.",
          hi: "संक्षारण हवा-नमी से धातु का धीमा क्षरण — जैसे लोहे का जंग — और इसे रँगाई, तेल, जस्तीकरण या मिश्रधातु से हवा-पानी दूर रखकर रोका जाता।",
          mr: "गंजणे हवा-ओलाव्याने धातूचे मंद क्षरण — जसे लोखंडाचे गंजणे — आणि ते रंगवणे, तेल, गॅल्व्हनायझिंग वा मिश्रधातूने हवा-पाणी दूर ठेवून रोखले जाते.",
        },
        detail: {
          en: "Rusting needs both oxygen and water together — iron kept in dry air or in boiled, air-free water does not rust.",
          hi: "जंग को ऑक्सीजन और पानी दोनों साथ चाहिए — सूखी हवा या उबले, हवा-रहित पानी में रखा लोहा जंग नहीं खाता।",
          mr: "गंजण्याला ऑक्सिजन आणि पाणी दोन्ही एकत्र हवे — कोरड्या हवेत वा उकळलेल्या, हवा-रहित पाण्यात ठेवलेले लोखंड गंजत नाही.",
        },
        extra: {
          en: "Galvanising coats iron with a layer of zinc, a more reactive metal that corrodes in iron's place, protecting the iron beneath.",
          hi: "जस्तीकरण लोहे को जस्ते की परत से ढकता, अधिक क्रियाशील धातु जो लोहे की जगह संक्षारित होकर नीचे के लोहे को रक्षती।",
          mr: "गॅल्व्हनायझिंग लोखंडाला जस्ताच्या थराने झाकते, अधिक क्रियाशील धातू जी लोखंडाच्या जागी गंजून खालच्या लोखंडाचे रक्षण करते.",
        },
        pair: {
          left: {
            en: "Metal eaten by air and moisture, kept out to prevent it",
            hi: "हवा-नमी से खाई धातु, दूर रखकर रोकी",
            mr: "हवा-ओलाव्याने खाल्लेली धातू, दूर ठेवून रोखली",
          },
          right: {
            en: "corrosion",
            hi: "संक्षारण",
            mr: "गंजणे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Gold and silver are often found in the earth as the shining pure metal, ready to be picked up, while sodium and potassium are never found free — only locked inside compounds. What explains this difference in how metals occur in nature?",
          hi: "सोना और चाँदी अक्सर धरती में चमकती शुद्ध धातु के रूप में मिलते, उठाने को तैयार, जबकि सोडियम और पोटैशियम कभी मुक्त नहीं मिलते — केवल यौगिकों में बंद। धातुओं के प्रकृति में मिलने के इस अंतर को क्या समझाता?",
          mr: "सोने आणि चांदी अनेकदा जमिनीत चमकत्या शुद्ध धातूच्या रूपात मिळतात, उचलायला तयार, तर सोडियम आणि पोटॅशियम कधीच मुक्त मिळत नाहीत — फक्त संयुगांत बंद. धातू निसर्गात मिळण्याच्या या फरकाला काय समजावते?",
        },
        choices: [
          {
            en: "Their place in the reactivity series: very reactive metals like sodium and potassium combine so eagerly with oxygen, water and other elements that any free metal is quickly turned into a compound, so they survive only as compounds; unreactive metals like gold barely combine with anything, so they endure as the free metal",
            hi: "क्रियाशीलता श्रेणी में उनकी जगह: सोडियम-पोटैशियम जैसी बहुत क्रियाशील धातुएँ ऑक्सीजन, पानी, अन्य तत्वों से इतनी उत्सुकता से जुड़तीं कि कोई मुक्त धातु जल्दी यौगिक बन जाती, अतः वे केवल यौगिक रूप में बचतीं; सोने जैसी अक्रियाशील धातुएँ किसी से मुश्किल से जुड़तीं, अतः मुक्त धातु रूप में टिकतीं",
            mr: "क्रियाशीलता श्रेणीतील त्यांची जागा: सोडियम-पोटॅशियमसारख्या फार क्रियाशील धातू ऑक्सिजन, पाणी, इतर मूलद्रव्यांशी इतक्या उत्सुकतेने जुळतात की कोणतीही मुक्त धातू लवकर संयुग बनते, म्हणून त्या फक्त संयुग रूपात टिकतात; सोन्यासारख्या अक्रियाशील धातू कशाशीही जेमतेम जुळतात, म्हणून मुक्त धातू रूपात टिकतात",
          },
          {
            en: "Gold and silver are simply heavier, so they sink to where miners can find them",
            hi: "सोना-चाँदी बस भारी, अतः वे वहाँ बैठते जहाँ खनिक उन्हें पातें",
            mr: "सोने-चांदी फक्त जड, म्हणून ती तिथे बसतात जिथे खाणकामगार त्यांना मिळतात",
          },
          {
            en: "Sodium and potassium are rarer, which is why they are never found free",
            hi: "सोडियम-पोटैशियम दुर्लभ, इसी से कभी मुक्त नहीं मिलते",
            mr: "सोडियम-पोटॅशियम दुर्मिळ, म्हणून कधी मुक्त मिळत नाहीत",
          },
          {
            en: "It is pure chance; where a metal is found has nothing to do with its chemistry",
            hi: "यह विशुद्ध संयोग; धातु कहाँ मिलती उसका उसके रसायन से कोई संबंध नहीं",
            mr: "हा विशुद्ध योगायोग; धातू कुठे मिळते त्याचा तिच्या रसायनाशी संबंध नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Where a metal is found in nature — free or only as a compound — is decided by how reactive it is, its place in the reactivity series. To exist as a free metal, an element has to resist combining with the oxygen, water, carbon dioxide and sulphur that fill the earth and air. The metals at the top of the series, like sodium and potassium, are ferociously reactive; a lump of pure sodium reacts instantly with the moisture and oxygen around it, so over the vast ages of geology any free sodium was long ago swallowed into compounds. That is why we only ever dig them up combined — as chlorides, carbonates or silicates — never as the shining metal. The metals at the bottom of the series, like gold, silver and platinum, are the opposite: they are so unreactive that they barely combine with anything, even over millions of years. So they survive in the ground as the pure, free metal, which is exactly why gold could be gathered and prized by ancient people who had no way to extract reactive metals from ore. This same reactivity ranking then dictates how hard a metal is to extract: the reactive ones hold onto their compounds so tightly that only powerful methods like electrolysis can tear them free, while the unreactive ones need no extraction at all. Reactivity, not luck or weight or rarity, is the thread running through where metals are found and how they are won.",
          hi: "धातु प्रकृति में कहाँ मिलती — मुक्त या केवल यौगिक — इससे तय कि वह कितनी क्रियाशील, क्रियाशीलता श्रेणी में उसकी जगह। मुक्त धातु रहने को तत्व को धरती-हवा भरते ऑक्सीजन, पानी, कार्बन डाइऑक्साइड, गंधक से जुड़ने का विरोध करना होता। श्रेणी शीर्ष की धातुएँ, सोडियम-पोटैशियम जैसी, प्रचंड क्रियाशील; शुद्ध सोडियम का ढेला आसपास की नमी-ऑक्सीजन से तुरंत अभिक्रिया करता, अतः भूविज्ञान के विशाल युगों में कोई मुक्त सोडियम बहुत पहले यौगिकों में निगला गया। इसी से हम इन्हें केवल जुड़ा खोदते — क्लोराइड, कार्बोनेट या सिलिकेट — कभी चमकती धातु नहीं। श्रेणी तल की धातुएँ, सोना-चाँदी-प्लैटिनम, उल्टीं: वे इतनी अक्रियाशील कि किसी से मुश्किल से जुड़तीं, लाखों वर्षों में भी। अतः वे ज़मीन में शुद्ध, मुक्त धातु रहतीं, ठीक इसीलिए सोना प्राचीन लोग बटोर-सराह सकते जिनके पास अयस्क से क्रियाशील धातु निकालने का कोई तरीक़ा नहीं। यही क्रियाशीलता-क्रम फिर तय करता धातु निकालना कितना कठिन: क्रियाशील अपने यौगिक इतने कसकर थामतीं कि केवल विद्युत-अपघटन जैसे शक्तिशाली तरीक़े उन्हें मुक्त कर सकें, जबकि अक्रियाशील को किसी निष्कर्षण की ज़रूरत नहीं। क्रियाशीलता, न कि भाग्य, भार या दुर्लभता, वह धागा जो धातुएँ कहाँ मिलतीं और कैसे जीती जातीं उसमें चलता।",
          mr: "धातू निसर्गात कुठे मिळते — मुक्त की फक्त संयुग — हे यावरून ठरते की ती किती क्रियाशील, क्रियाशीलता श्रेणीतील तिची जागा. मुक्त धातू राहायला मूलद्रव्याला जमीन-हवा भरणाऱ्या ऑक्सिजन, पाणी, कार्बन डायऑक्साइड, गंधकाशी जुळण्याचा विरोध करावा लागतो. श्रेणीच्या शिखरावरील धातू, सोडियम-पोटॅशियमसारख्या, प्रचंड क्रियाशील; शुद्ध सोडियमचा गोळा आजूबाजूच्या ओलावा-ऑक्सिजनशी तत्काळ क्रिया करतो, म्हणून भूविज्ञानाच्या प्रचंड युगांत कोणताही मुक्त सोडियम फार पूर्वी संयुगांत गिळला गेला. म्हणूनच आपण यांना फक्त जुळलेले खणतो — क्लोराइड, कार्बोनेट वा सिलिकेट — कधी चमकती धातू नाही. श्रेणीच्या तळाशी असलेल्या धातू, सोने-चांदी-प्लॅटिनम, उलट: त्या इतक्या अक्रियाशील की कशाशीही जेमतेम जुळतात, लाखो वर्षांतही. म्हणून त्या जमिनीत शुद्ध, मुक्त धातू राहतात, नेमके म्हणूनच सोने प्राचीन लोक गोळा करून-नावाजू शकत ज्यांच्याकडे धातुकातून क्रियाशील धातू काढण्याचा मार्ग नव्हता. हाच क्रियाशीलता-क्रम मग ठरवतो धातू काढणे किती कठीण: क्रियाशील आपली संयुगे इतकी घट्ट धरतात की फक्त विद्युत-अपघटनासारखे शक्तिशाली मार्ग त्यांना मुक्त करू शकतात, तर अक्रियाशीलांना कोणत्याही निष्कर्षणाची गरज नाही. क्रियाशीलता, न की नशीब, भार वा दुर्मिळता, तो धागा जो धातू कुठे मिळतात आणि कशा जिंकल्या जातात त्यात चालतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A block of solid common salt (sodium chloride) does not conduct electricity, yet the moment it is melted, or dissolved in water, it conducts well. The salt is made of ions all along. Why does it conduct only when molten or dissolved, and not as a solid?",
          hi: "ठोस खाने के नमक (सोडियम क्लोराइड) का टुकड़ा बिजली नहीं चलाता, फिर भी पिघलते ही, या पानी में घुलते ही, अच्छी चलाता। नमक आर-पार आयनों का बना। यह केवल पिघला या घुला क्यों चलाता, ठोस रूप में नहीं?",
          mr: "घन खाण्याच्या मिठाचा (सोडियम क्लोराइड) तुकडा वीज वाहत नाही, तरी वितळताच, वा पाण्यात विरघळताच, चांगली वाहतो. मीठ आरपार आयनांचे बनलेले. ते फक्त वितळलेले वा विरघळलेले का वाहते, घन रूपात नाही?",
        },
        choices: [
          {
            en: "Electric current through such a compound is carried by moving ions. In the solid, the ions are locked rigidly in place in the crystal and cannot move, so no current flows. Melting or dissolving frees the ions to move about, and moving charged ions are exactly what carries the current",
            hi: "ऐसे यौगिक में विद्युत धारा चलते आयनों से ढोई जाती। ठोस में आयन क्रिस्टल में जगह पर कठोरता से बंद और चल नहीं सकते, अतः कोई धारा नहीं। पिघलना या घुलना आयनों को घूमने मुक्त करता, और चलते आवेशित आयन ही धारा ढोते",
            mr: "अशा संयुगातून विद्युत प्रवाह हलणाऱ्या आयनांनी वाहिला जातो. घनात आयन स्फटिकात जागी घट्ट बंद आणि हलू शकत नाहीत, म्हणून कोणताही प्रवाह नाही. वितळणे वा विरघळणे आयनांना फिरायला मुक्त करते, आणि हलणारे भारित आयनच प्रवाह वाहतात",
          },
          {
            en: "Solid salt has no ions; melting creates them from nothing",
            hi: "ठोस नमक में कोई आयन नहीं; पिघलना उन्हें शून्य से बनाता",
            mr: "घन मिठात आयन नाहीत; वितळणे त्यांना शून्यातून बनवते",
          },
          {
            en: "Water is a metal, so any solution of anything conducts",
            hi: "पानी एक धातु, अतः किसी भी चीज़ का कोई भी विलयन चलाता",
            mr: "पाणी एक धातू, म्हणून कशाचेही कोणतेही द्रावण वाहते",
          },
          {
            en: "Salt only conducts when hot, and melting just heats it up",
            hi: "नमक केवल गरम होने पर चलाता, और पिघलना बस इसे गरम करता",
            mr: "मीठ फक्त गरम असताना वाहते, आणि वितळणे फक्त त्याला गरम करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The key is to ask what actually carries an electric current. In a metal wire it is loose electrons that drift and carry the charge, but an ionic compound like sodium chloride has no such free electrons — instead it is built entirely of charged ions, positive sodium ions and negative chloride ions. A current through such a substance is carried not by electrons but by the ions themselves physically moving toward the electrodes. Now the whole puzzle resolves. In solid salt, those ions certainly exist — the compound is nothing but ions — but they are locked into a rigid crystal lattice, each ion clamped in a fixed position by the strong attractions of its neighbours. They can vibrate a little, but they cannot travel, and charge that cannot move cannot make a current. So solid salt does not conduct, even though it is 'made of charge'. Melting the salt supplies enough energy to break down that rigid lattice: the ions come loose and can drift freely through the liquid. Dissolving it in water does the same in a different way — the water molecules pull the lattice apart and surround the ions, letting them move about in solution. In both cases the ions are now mobile, and mobile ions drifting toward opposite electrodes are precisely what an electric current through this material is. So the deciding factor is not whether ions are present — they always are — but whether they are free to move. Locked in a solid, they cannot conduct; freed by melting or dissolving, they can. This is a hallmark of ionic compounds and one of the ways we tell them apart from covalent ones.",
          hi: "कुंजी यह पूछना कि विद्युत धारा वास्तव में क्या ढोता। धातु-तार में ढीले इलेक्ट्रॉन बहकर आवेश ढोते, पर सोडियम क्लोराइड जैसे आयनिक यौगिक में ऐसे मुक्त इलेक्ट्रॉन नहीं — बजाय यह पूरी तरह आवेशित आयनों का बना, धन सोडियम आयन और ऋण क्लोराइड आयन। ऐसे पदार्थ से धारा इलेक्ट्रॉनों से नहीं बल्कि स्वयं आयनों के इलेक्ट्रोडों की ओर भौतिक रूप से चलने से ढोई जाती। अब पूरी पहेली सुलझती। ठोस नमक में वे आयन निश्चय मौजूद — यौगिक आयनों के सिवा कुछ नहीं — पर वे कठोर क्रिस्टल जालक में बंद, हर आयन पड़ोसियों के प्रबल आकर्षण से नियत स्थिति में जकड़ा। वे थोड़ा कंप सकते, पर यात्रा नहीं कर सकते, और जो आवेश चल न सके धारा नहीं बना सकता। अतः ठोस नमक नहीं चलाता, यद्यपि यह 'आवेश का बना'। नमक पिघलाना उस कठोर जालक को तोड़ने भर ऊर्जा देता: आयन ढीले होकर द्रव में मुक्त बह सकते। पानी में घोलना वही भिन्न तरह करता — पानी के अणु जालक को अलग खींचते और आयनों को घेरते, उन्हें विलयन में घूमने देते। दोनों में आयन अब गतिशील, और विपरीत इलेक्ट्रोडों की ओर बहते गतिशील आयन ठीक वही जो इस पदार्थ से विद्युत धारा। अतः निर्णायक कारक यह नहीं कि आयन मौजूद — वे सदा — बल्कि वे चलने को मुक्त या नहीं। ठोस में बंद, चला नहीं सकते; पिघलने-घुलने से मुक्त, चला सकते। यह आयनिक यौगिकों की पहचान और एक तरीक़ा जिससे हम उन्हें सहसंयोजी से अलग बताते।",
          mr: "किल्ली हे विचारणे की विद्युत प्रवाह प्रत्यक्षात काय वाहतो. धातू-तारेत सैल इलेक्ट्रॉन वाहून भार वाहतात, पण सोडियम क्लोराइडसारख्या आयनिक संयुगात असे मुक्त इलेक्ट्रॉन नाहीत — त्याऐवजी ते पूर्णपणे भारित आयनांचे बनलेले, धन सोडियम आयन आणि ऋण क्लोराइड आयन. अशा पदार्थातून प्रवाह इलेक्ट्रॉनांनी नव्हे तर स्वतः आयनांच्या इलेक्ट्रोडांकडे भौतिकरीत्या हलण्याने वाहिला जातो. आता अख्खे कोडे सुटते. घन मिठात ते आयन नक्कीच असतात — संयुग आयनांशिवाय काहीच नाही — पण ते कठीण स्फटिक जाळीत बंद, प्रत्येक आयन शेजाऱ्यांच्या प्रबळ आकर्षणाने ठराविक स्थितीत जखडलेला. ते थोडे कंपू शकतात, पण प्रवास करू शकत नाहीत, आणि जो भार हलू शकत नाही तो प्रवाह बनवू शकत नाही. म्हणून घन मीठ वाहत नाही, जरी ते 'भाराचे बनलेले'. मीठ वितळवणे त्या कठीण जाळीला मोडण्याइतकी ऊर्जा देते: आयन सैल होऊन द्रवात मुक्त वाहू शकतात. पाण्यात विरघळवणे तेच वेगळ्या रीतीने करते — पाण्याचे रेणू जाळी वेगळी खेचतात आणि आयनांना वेढतात, त्यांना द्रावणात फिरू देत. दोन्हींत आयन आता हलणारे, आणि विरुद्ध इलेक्ट्रोडांकडे वाहणारे हलणारे आयन नेमके तेच जे या पदार्थातून विद्युत प्रवाह. म्हणून निर्णायक घटक हे नाही की आयन आहेत — ते सदैव असतात — तर ते हलायला मुक्त आहेत की नाही. घनात बंद, वाहू शकत नाहीत; वितळून-विरघळून मुक्त, वाहू शकतात. ही आयनिक संयुगांची खूण आणि एक मार्ग ज्याने आपण त्यांना सहसंयुज संयुगांपासून वेगळे ओळखतो.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Carbon and its Compounds                                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-carbon-compounds",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 4 — Carbon and its Compounds",
      hi: "अध्याय 4 — कार्बन एवं उसके यौगिक",
      mr: "प्रकरण 4 — कार्बन आणि त्याची संयुगे",
    },
    name: {
      en: "Carbon and its Compounds",
      hi: "कार्बन एवं उसके यौगिक",
      mr: "कार्बन आणि त्याची संयुगे",
    },
    summary: {
      en: "One element, a million compounds: carbon shares four electrons in covalent bonds, links endlessly to itself in chains and rings, and hangs functional groups off its backbone. Saturated and unsaturated, burning to carbon dioxide, and — in soap — one molecule with a water-loving head and a grease-loving tail.",
      hi: "एक तत्व, दस लाख यौगिक: कार्बन सहसंयोजी बंधों में चार इलेक्ट्रॉन साझा करता, शृंखलाओं-वलयों में स्वयं से अनंत जुड़ता, और अपने ढाँचे पर क्रियात्मक समूह लटकाता। संतृप्त और असंतृप्त, कार्बन डाइऑक्साइड में जलता, और — साबुन में — पानी-प्रेमी सिर और चिकनाई-प्रेमी पूँछ वाला एक अणु।",
      mr: "एक मूलद्रव्य, दहा लाख संयुगे: कार्बन सहसंयुज बंधांत चार इलेक्ट्रॉन वाटतो, साखळ्या-वलयांत स्वतःशी अनंत जुळतो, आणि आपल्या सांगाड्यावर कार्यकारी गट टांगतो. संतृप्त आणि असंतृप्त, कार्बन डायऑक्साइडमध्ये जळणारा, आणि — साबणात — पाणी-प्रेमी डोके आणि स्निग्ध-प्रेमी शेपूट असलेला एक रेणू.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "covalent-bond",
        name: {
          en: "The covalent bond",
          hi: "सहसंयोजी बंध",
          mr: "सहसंयुज बंध",
        },
        kind: "idea",
        prompt: {
          en: "Carbon has four outer electrons and, rather than give or take four, it shares them with other atoms so both reach a full shell. What kind of bond forms by the sharing of electrons?",
          hi: "कार्बन के चार बाहरी इलेक्ट्रॉन, और चार देने या लेने के बजाय, यह उन्हें अन्य परमाणुओं से साझा करता ताकि दोनों पूर्ण कोश पाएँ। इलेक्ट्रॉन साझा करने से कौन-सा बंध बनता?",
          mr: "कार्बनचे चार बाहेरचे इलेक्ट्रॉन, आणि चार देण्या वा घेण्याऐवजी, तो ते इतर अणूंशी वाटतो जेणेकरून दोघे पूर्ण कवच मिळवतात. इलेक्ट्रॉन वाटल्याने कोणता बंध बनतो?",
        },
        statement: {
          en: "A covalent bond forms when two atoms share a pair of electrons; carbon makes four such bonds, and covalent compounds have low melting points and do not conduct electricity.",
          hi: "सहसंयोजी बंध तब बनता जब दो परमाणु इलेक्ट्रॉन-युग्म साझा करते; कार्बन चार ऐसे बंध बनाता, और सहसंयोजी यौगिकों के गलनांक कम और बिजली नहीं चलाते।",
          mr: "सहसंयुज बंध तेव्हा बनतो जेव्हा दोन अणू इलेक्ट्रॉन-जोडी वाटतात; कार्बन चार असे बंध बनवतो, आणि सहसंयुज संयुगांचे वितळणबिंदू कमी आणि वीज वाहत नाहीत.",
        },
        detail: {
          en: "Sharing, not giving, means no ions form — so covalent compounds are mostly poor conductors even when melted or dissolved.",
          hi: "साझा करना, न देना, यानी कोई आयन नहीं बनता — अतः सहसंयोजी यौगिक पिघले या घुले भी अधिकतर ख़राब चालक।",
          mr: "वाटणे, न देणे, म्हणजे कोणतेही आयन बनत नाहीत — म्हणून सहसंयुज संयुगे वितळलेली वा विरघळलेलीही बहुतांश वाईट वाहक.",
        },
        extra: {
          en: "A single shared pair is a single bond, two shared pairs a double bond, three a triple bond — carbon uses all three.",
          hi: "एक साझा युग्म एकल बंध, दो साझा युग्म द्विबंध, तीन त्रिबंध — कार्बन तीनों वापरता।",
          mr: "एक वाटलेली जोडी एकबंध, दोन वाटलेल्या जोड्या द्विबंध, तीन त्रिबंध — कार्बन तिन्ही वापरतो.",
        },
        pair: {
          left: {
            en: "Atoms share electrons to fill their shells",
            hi: "परमाणु कोश भरने इलेक्ट्रॉन साझा करें",
            mr: "अणू कवच भरायला इलेक्ट्रॉन वाटतात",
          },
          right: {
            en: "the covalent bond",
            hi: "सहसंयोजी बंध",
            mr: "सहसंयुज बंध",
          },
        },
      },
      {
        id: "catenation-tetravalency",
        name: {
          en: "Catenation and tetravalency",
          hi: "शृंखलन और चतुर्संयोजकता",
          mr: "साखळीकरण आणि चतुःसंयुजता",
        },
        kind: "idea",
        prompt: {
          en: "Carbon can join to other carbon atoms in long chains, branches and rings, and each carbon still has four bonds to spare for other atoms. Which two properties together give carbon its millions of compounds?",
          hi: "कार्बन अन्य कार्बन परमाणुओं से लंबी शृंखलाओं, शाखाओं और वलयों में जुड़ सकता, और हर कार्बन के पास अन्य परमाणुओं को देने चार बंध बचते। कौन-से दो गुण मिलकर कार्बन को उसके लाखों यौगिक देते?",
          mr: "कार्बन इतर कार्बन अणूंशी लांब साखळ्या, फांद्या आणि वलयांत जुळू शकतो, आणि प्रत्येक कार्बनकडे इतर अणूंना द्यायला चार बंध शिल्लक. कोणते दोन गुण मिळून कार्बनला त्याची लाखो संयुगे देतात?",
        },
        statement: {
          en: "Catenation is carbon's ability to bond to other carbon atoms in chains, branches and rings, and tetravalency is its four bonding electrons; together they let carbon form an almost endless variety of compounds.",
          hi: "शृंखलन कार्बन की अन्य कार्बन परमाणुओं से शृंखलाओं, शाखाओं-वलयों में जुड़ने की क्षमता, और चतुर्संयोजकता उसके चार बंधन-इलेक्ट्रॉन; साथ मिलकर वे कार्बन को यौगिकों की लगभग अनंत विविधता बनाने देते।",
          mr: "साखळीकरण कार्बनची इतर कार्बन अणूंशी साखळ्या, फांद्या-वलयांत जुळण्याची क्षमता, आणि चतुःसंयुजता त्याचे चार बंधन-इलेक्ट्रॉन; एकत्र ते कार्बनला संयुगांची जवळपास अनंत विविधता बनवू देतात.",
        },
        detail: {
          en: "Carbon's small size makes its bonds — to itself and to other atoms — unusually strong and stable, so the long chains do not fall apart.",
          hi: "कार्बन का छोटा आकार उसके बंधों को — स्वयं से और अन्य परमाणुओं से — असामान्य रूप से प्रबल-स्थिर बनाता, अतः लंबी शृंखलाएँ टूटतीं नहीं।",
          mr: "कार्बनचा लहान आकार त्याचे बंध — स्वतःशी आणि इतर अणूंशी — असामान्यपणे प्रबळ-स्थिर बनवतो, म्हणून लांब साखळ्या तुटत नाहीत.",
        },
        extra: {
          en: "It is why carbon alone gives rise to the whole of organic chemistry — from petrol and plastic to the proteins and DNA of life itself.",
          hi: "इसी से अकेला कार्बन पूरे कार्बनिक रसायन को जन्म देता — पेट्रोल-प्लास्टिक से जीवन के प्रोटीन-DNA तक।",
          mr: "म्हणूनच एकटा कार्बन अख्ख्या सेंद्रिय रसायनशास्त्राला जन्म देतो — पेट्रोल-प्लास्टिकपासून जीवनाच्या प्रथिने-DNA पर्यंत.",
        },
        pair: {
          left: {
            en: "Self-linking chains plus four bonds each",
            hi: "स्वयं-जुड़तीं शृंखलाएँ साथ हर एक चार बंध",
            mr: "स्वतः-जुळणाऱ्या साखळ्या अधिक प्रत्येकी चार बंध",
          },
          right: {
            en: "catenation and tetravalency",
            hi: "शृंखलन और चतुर्संयोजकता",
            mr: "साखळीकरण आणि चतुःसंयुजता",
          },
        },
      },
      {
        id: "saturated-unsaturated",
        name: {
          en: "Saturated and unsaturated compounds",
          hi: "संतृप्त और असंतृप्त यौगिक",
          mr: "संतृप्त आणि असंतृप्त संयुगे",
        },
        kind: "idea",
        prompt: {
          en: "Some hydrocarbons have only single bonds between their carbons, while others carry a double or triple bond that can add more atoms. What is the difference between these two types called?",
          hi: "कुछ हाइड्रोकार्बनों में कार्बनों के बीच केवल एकल बंध, जबकि अन्य में द्विबंध या त्रिबंध जो अधिक परमाणु जोड़ सकता। इन दो प्रकारों के बीच अंतर को क्या कहते?",
          mr: "काही हायड्रोकार्बनांत कार्बनांमध्ये फक्त एकबंध, तर इतरांत द्विबंध वा त्रिबंध जो अधिक अणू जोडू शकतो. या दोन प्रकारांतील फरकाला काय म्हणतात?",
        },
        statement: {
          en: "A saturated compound has only single bonds between carbon atoms, while an unsaturated compound has at least one double or triple bond, letting it add more atoms across that bond.",
          hi: "संतृप्त यौगिक में कार्बन परमाणुओं के बीच केवल एकल बंध, जबकि असंतृप्त में कम से कम एक द्विबंध या त्रिबंध, जो उस बंध के आर-पार अधिक परमाणु जोड़ने देता।",
          mr: "संतृप्त संयुगात कार्बन अणूंमध्ये फक्त एकबंध, तर असंतृप्तात किमान एक द्विबंध वा त्रिबंध, जो त्या बंधापलीकडे अधिक अणू जोडू देतो.",
        },
        detail: {
          en: "Saturated hydrocarbons (alkanes) burn with a clean blue flame; unsaturated ones (alkenes, alkynes) tend to burn with a yellow, sooty flame.",
          hi: "संतृप्त हाइड्रोकार्बन (एल्केन) साफ़ नीली लौ से जलते; असंतृप्त (एल्कीन, एल्काइन) पीली, कज्जल-भरी लौ से।",
          mr: "संतृप्त हायड्रोकार्बन (अल्केन) स्वच्छ निळ्या ज्योतीने जळतात; असंतृप्त (अल्कीन, अल्काइन) पिवळ्या, काजळी-भरल्या ज्योतीने.",
        },
        extra: {
          en: "The extra bond makes unsaturated compounds more reactive — they add hydrogen across it, which is how liquid vegetable oils are hardened into solid vanaspati.",
          hi: "अतिरिक्त बंध असंतृप्त यौगिकों को अधिक क्रियाशील बनाता — वे उसके आर-पार हाइड्रोजन जोड़ते, जैसे द्रव वनस्पति तेल ठोस वनस्पति में कड़े होते।",
          mr: "जादा बंध असंतृप्त संयुगांना अधिक क्रियाशील बनवतो — ते त्यापलीकडे हायड्रोजन जोडतात, जसे द्रव वनस्पती तेल घन वनस्पतीत कठीण होते.",
        },
        pair: {
          left: {
            en: "Only single bonds, adds no more atoms",
            hi: "केवल एकल बंध, और परमाणु न जोड़े",
            mr: "फक्त एकबंध, आणखी अणू न जोडे",
          },
          right: {
            en: "a saturated compound",
            hi: "संतृप्त यौगिक",
            mr: "संतृप्त संयुग",
          },
        },
      },
      {
        id: "functional-group",
        name: {
          en: "The functional group",
          hi: "क्रियात्मक समूह",
          mr: "कार्यकारी गट",
        },
        kind: "idea",
        prompt: {
          en: "Swap a hydrogen on a carbon chain for an —OH and you get an alcohol; for a —COOH and you get an acid. Which reactive cluster of atoms decides a compound's chemical behaviour?",
          hi: "कार्बन शृंखला पर एक हाइड्रोजन को —OH से बदलो और अल्कोहल मिलता; —COOH से अम्ल मिलता। कौन-सा परमाणुओं का क्रियाशील गुच्छा यौगिक का रासायनिक व्यवहार तय करता?",
          mr: "कार्बन साखळीवरील एक हायड्रोजन —OH ने बदला आणि अल्कोहोल मिळते; —COOH ने आम्ल मिळते. कोणता अणूंचा क्रियाशील गुच्छ संयुगाचे रासायनिक वर्तन ठरवतो?",
        },
        statement: {
          en: "A functional group is a reactive atom or cluster of atoms attached to a carbon chain that gives the compound its characteristic properties — like —OH for alcohols and —COOH for carboxylic acids.",
          hi: "क्रियात्मक समूह कार्बन शृंखला से जुड़ा एक क्रियाशील परमाणु या परमाणु-गुच्छा जो यौगिक को उसके विशिष्ट गुण देता — जैसे अल्कोहलों को —OH और कार्बोक्सिलिक अम्लों को —COOH।",
          mr: "कार्यकारी गट कार्बन साखळीशी जोडलेला एक क्रियाशील अणू वा अणू-गुच्छ जो संयुगाला त्याचे वैशिष्ट्यपूर्ण गुण देतो — जसे अल्कोहोलांना —OH आणि कार्बोक्झिलिक आम्लांना —COOH.",
        },
        detail: {
          en: "The carbon chain is a passive backbone; it is the functional group that reacts, so all alcohols behave alike whatever the length of their chain.",
          hi: "कार्बन शृंखला निष्क्रिय रीढ़; क्रियात्मक समूह ही अभिक्रिया करता, अतः सभी अल्कोहल शृंखला-लंबाई चाहे जो एक-से बरतते।",
          mr: "कार्बन साखळी निष्क्रिय कणा; कार्यकारी गटच अभिक्रिया करतो, म्हणून सर्व अल्कोहोल साखळी-लांबी कितीही असो सारखे वागतात.",
        },
        extra: {
          en: "Grouping compounds by their functional group into families (a homologous series) is what makes the huge world of carbon compounds manageable.",
          hi: "यौगिकों को उनके क्रियात्मक समूह से कुलों (समजातीय श्रेणी) में समूहित करना कार्बन यौगिकों की विशाल दुनिया को सँभालने योग्य बनाता।",
          mr: "संयुगांना त्यांच्या कार्यकारी गटाने कुळांत (समजातीय श्रेणी) गटबद्ध करणे कार्बन संयुगांचे प्रचंड जग हाताळण्याजोगे बनवते.",
        },
        pair: {
          left: {
            en: "The cluster that sets a compound's behaviour",
            hi: "यौगिक का व्यवहार तय करता गुच्छा",
            mr: "संयुगाचे वर्तन ठरवणारा गुच्छ",
          },
          right: {
            en: "the functional group",
            hi: "क्रियात्मक समूह",
            mr: "कार्यकारी गट",
          },
        },
      },
      {
        id: "ethanol-ethanoic-acid",
        name: {
          en: "Ethanol and ethanoic acid",
          hi: "इथेनॉल और इथेनोइक अम्ल",
          mr: "इथेनॉल आणि इथॅनॉइक आम्ल",
        },
        kind: "substance",
        prompt: {
          en: "One is the alcohol in drinks and a fuel; the other, a weak acid, is the sour ingredient of vinegar. Which pair of everyday carbon compounds, differing by their functional group, is this?",
          hi: "एक पेयों की अल्कोहल और ईंधन; दूसरा, दुर्बल अम्ल, सिरके का खट्टा घटक। क्रियात्मक समूह से भिन्न रोज़मर्रा कार्बन यौगिकों की यह कौन-सी जोड़ी है?",
          mr: "एक पेयांतील अल्कोहोल आणि इंधन; दुसरे, दुर्बल आम्ल, व्हिनेगरचा आंबट घटक. कार्यकारी गटाने वेगळ्या रोजच्या कार्बन संयुगांची ही कोणती जोडी?",
        },
        statement: {
          en: "Ethanol is the alcohol (—OH group) used in drinks and as a fuel, while ethanoic acid (—COOH group) is a weak acid, the sour component of vinegar.",
          hi: "इथेनॉल पेयों और ईंधन में प्रयुक्त अल्कोहल (—OH समूह), जबकि इथेनोइक अम्ल (—COOH समूह) एक दुर्बल अम्ल, सिरके का खट्टा घटक।",
          mr: "इथेनॉल पेयांत आणि इंधन म्हणून वापरले अल्कोहोल (—OH गट), तर इथॅनॉइक आम्ल (—COOH गट) एक दुर्बल आम्ल, व्हिनेगरचा आंबट घटक.",
        },
        detail: {
          en: "Warm ethanol with ethanoic acid over an acid catalyst and they join into a sweet-smelling ester — the fragrance of many fruits and perfumes.",
          hi: "इथेनॉल को इथेनोइक अम्ल के साथ अम्ल-उत्प्रेरक पर गरम करो और वे मीठी-गंध एस्टर में जुड़ते — कई फलों-इत्रों की सुगंध।",
          mr: "इथेनॉल इथॅनॉइक आम्लासोबत आम्ल-उत्प्रेरकावर गरम करा आणि ते गोड-वासाच्या एस्टरमध्ये जुळतात — अनेक फळे-अत्तरांचा सुगंध.",
        },
        extra: {
          en: "Pure ethanoic acid freezes just below room temperature into ice-like crystals, which is why it is called glacial acetic acid.",
          hi: "शुद्ध इथेनोइक अम्ल कमरे के तापमान से थोड़ा नीचे बर्फ़-से रवों में जमता, इसी से इसे हिमशीतल एसीटिक अम्ल कहते।",
          mr: "शुद्ध इथॅनॉइक आम्ल खोलीच्या तापमानाहून थोडे खाली बर्फासारख्या स्फटिकांत गोठते, म्हणूनच त्याला हिमशीतल अ‍ॅसिटिक आम्ल म्हणतात.",
        },
        pair: {
          left: {
            en: "The alcohol of drinks and the acid of vinegar",
            hi: "पेयों की अल्कोहल और सिरके का अम्ल",
            mr: "पेयांचे अल्कोहोल आणि व्हिनेगरचे आम्ल",
          },
          right: {
            en: "ethanol and ethanoic acid",
            hi: "इथेनॉल और इथेनोइक अम्ल",
            mr: "इथेनॉल आणि इथॅनॉइक आम्ल",
          },
        },
      },
      {
        id: "soap-micelle",
        name: {
          en: "Soap and the micelle",
          hi: "साबुन और मिसेल",
          mr: "साबण आणि मिसेल",
        },
        kind: "idea",
        prompt: {
          en: "A soap molecule has one end that loves water and one end that loves oil, so it can grip greasy dirt and carry it into rinse water. What ball-like cluster do many soap molecules form around a droplet of grease?",
          hi: "साबुन के अणु का एक सिरा पानी-प्रेमी और एक सिरा तेल-प्रेमी, अतः यह चिकनी मैल पकड़ धो-पानी में ले जा सकता। कई साबुन अणु चिकनाई की बूँद के चारों ओर कौन-सा गेंद-सा गुच्छा बनाते?",
          mr: "साबणाच्या रेणूचे एक टोक पाणी-प्रेमी आणि एक टोक तेल-प्रेमी, म्हणून तो स्निग्ध मळ पकडून धुण्याच्या पाण्यात नेऊ शकतो. अनेक साबण रेणू स्निग्धतेच्या थेंबाभोवती कोणता चेंडूसारखा गुच्छ बनवतात?",
        },
        statement: {
          en: "A soap molecule has a water-loving (hydrophilic) head and an oil-loving (hydrophobic) tail; in water many soaps cluster into a micelle, tails pointing inward around a trapped droplet of grease and heads facing out.",
          hi: "साबुन के अणु का पानी-प्रेमी (जलरागी) सिर और तेल-प्रेमी (जलविरागी) पूँछ; पानी में कई साबुन मिसेल में गुच्छित होते, पूँछें फँसी चिकनाई-बूँद के चारों ओर भीतर और सिर बाहर।",
          mr: "साबणाच्या रेणूचे पाणी-प्रेमी (जलस्नेही) डोके आणि तेल-प्रेमी (जलविरोधी) शेपूट; पाण्यात अनेक साबण मिसेलमध्ये गुच्छित होतात, शेपट्या अडकलेल्या स्निग्धता-थेंबाभोवती आत आणि डोकी बाहेर.",
        },
        detail: {
          en: "The grease is hidden inside the micelle, held by the oily tails, while the water-loving heads let the whole ball wash away — that is how soap cleans.",
          hi: "चिकनाई मिसेल के भीतर छिपी, तैलीय पूँछों से थमी, जबकि पानी-प्रेमी सिर पूरे गेंद को धो जाने देते — यही साबुन की सफ़ाई।",
          mr: "स्निग्धता मिसेलच्या आत लपलेली, तैलीय शेपट्यांनी धरलेली, तर पाणी-प्रेमी डोकी अख्खा चेंडू वाहून जाऊ देतात — हीच साबणाची स्वच्छता.",
        },
        extra: {
          en: "In hard water soap wastes itself forming a useless scum with the calcium and magnesium, which is why detergents were invented to work where soap fails.",
          hi: "कठोर पानी में साबुन कैल्शियम-मैग्नीशियम से बेकार मैल बनाकर स्वयं बर्बाद होता, इसी से अपमार्जक बने जो साबुन के विफल होने पर काम करें।",
          mr: "जड पाण्यात साबण कॅल्शियम-मॅग्नेशियमशी निरुपयोगी साक बनवून स्वतः वाया जातो, म्हणूनच डिटर्जंट बनवले जे साबण अपयशी होताना काम करतात.",
        },
        pair: {
          left: {
            en: "Grease trapped inside, water-loving heads out",
            hi: "चिकनाई भीतर फँसी, पानी-प्रेमी सिर बाहर",
            mr: "स्निग्धता आत अडकली, पाणी-प्रेमी डोकी बाहेर",
          },
          right: {
            en: "a micelle",
            hi: "मिसेल",
            mr: "मिसेल",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Only about a hundred elements exist, yet the compounds of just one of them — carbon — number in the millions, more than all other elements' compounds put together. What special properties of the carbon atom account for this staggering variety?",
          hi: "केवल लगभग सौ तत्व हैं, फिर भी उनमें से केवल एक — कार्बन — के यौगिक लाखों में, अन्य सभी तत्वों के यौगिकों को मिलाकर से अधिक। कार्बन परमाणु के कौन-से विशेष गुण इस चौंकाती विविधता का कारण?",
          mr: "फक्त सुमारे शंभर मूलद्रव्ये आहेत, तरी त्यांतल्या फक्त एकाची — कार्बनची — संयुगे लाखांत, इतर सर्व मूलद्रव्यांच्या संयुगांना मिळून त्याहून अधिक. कार्बन अणूचे कोणते विशेष गुण या थक्क करणाऱ्या विविधतेचे कारण?",
        },
        choices: [
          {
            en: "Catenation — carbon's ability to bond to more carbon atoms in long chains, branches and rings — combined with its tetravalency (four bonds each) and small size, which makes those bonds strong and stable; together these let carbon build an almost limitless number of stable structures",
            hi: "शृंखलन — कार्बन की और कार्बन परमाणुओं से लंबी शृंखलाओं, शाखाओं-वलयों में जुड़ने की क्षमता — इसकी चतुर्संयोजकता (हर एक चार बंध) और छोटे आकार से जुड़ी, जो उन बंधों को प्रबल-स्थिर बनाता; साथ मिलकर ये कार्बन को स्थिर संरचनाओं की लगभग असीम संख्या बनाने देते",
            mr: "साखळीकरण — कार्बनची आणखी कार्बन अणूंशी लांब साखळ्या, फांद्या-वलयांत जुळण्याची क्षमता — त्याच्या चतुःसंयुजतेशी (प्रत्येकी चार बंध) आणि लहान आकाराशी जोडलेली, जी ते बंध प्रबळ-स्थिर बनवते; एकत्र हे कार्बनला स्थिर रचनांची जवळपास असीम संख्या बांधू देतात",
          },
          {
            en: "Carbon is simply the most abundant element on Earth, so it forms the most compounds",
            hi: "कार्बन बस पृथ्वी पर सबसे प्रचुर तत्व, अतः सबसे अधिक यौगिक बनाता",
            mr: "कार्बन फक्त पृथ्वीवरील सर्वांत विपुल मूलद्रव्य, म्हणून सर्वांत अधिक संयुगे बनवतो",
          },
          {
            en: "Carbon is radioactive, which lets it change into other elements and form more compounds",
            hi: "कार्बन रेडियोधर्मी, जो इसे अन्य तत्वों में बदलने और अधिक यौगिक बनाने देता",
            mr: "कार्बन किरणोत्सर्गी, जे त्याला इतर मूलद्रव्यांत बदलू आणि अधिक संयुगे बनवू देते",
          },
          {
            en: "Carbon forms only ionic bonds, which are the strongest of all",
            hi: "कार्बन केवल आयनिक बंध बनाता, जो सबसे प्रबल",
            mr: "कार्बन फक्त आयनिक बंध बनवतो, जे सर्वांत प्रबळ",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Carbon's runaway compound-count comes from a rare combination of properties, all rooted in the atom itself. The first and most important is catenation: carbon atoms can bond to other carbon atoms, again and again, building straight chains, branched chains and closed rings of almost any length. A few other elements can do this a little, but none comes close to carbon. The second is tetravalency: each carbon has exactly four bonds to make. So even in the middle of a long carbon chain, every carbon still has spare bonds pointing outward for hydrogen or oxygen or a functional group to attach — every skeleton can be decorated in countless ways. The third, quieter, property is carbon's small size. A small atom holds its shared electrons close and tight, so carbon–carbon and carbon–other bonds are unusually strong and stable; the long chains do not spontaneously fall apart the way the longer, weaker chains of larger elements (like silicon) tend to. Put these together — endless self-linking, four attachment points on every atom, and bonds strong enough to survive — and you get a construction kit that can assemble an essentially unlimited number of different, stable molecules. That is why the chemistry of carbon is a subject of its own, called organic chemistry, and why the molecules of life itself — proteins, fats, carbohydrates, DNA — are all built on carbon skeletons. Abundance, radioactivity and ionic bonding have nothing to do with it; it is catenation and tetravalency, backed by small size, that do the work.",
          hi: "कार्बन की बेलगाम यौगिक-गिनती गुणों के दुर्लभ संयोजन से, सब परमाणु में ही जड़े। पहला और सबसे महत्वपूर्ण शृंखलन: कार्बन परमाणु और कार्बन परमाणुओं से बार-बार जुड़ सकते, लगभग किसी भी लंबाई की सीधी शृंखलाएँ, शाखित शृंखलाएँ और बंद वलय बनाते। कुछ अन्य तत्व यह थोड़ा कर सकते, पर कोई कार्बन के पास नहीं आता। दूसरा चतुर्संयोजकता: हर कार्बन को ठीक चार बंध बनाने। अतः लंबी कार्बन-शृंखला के बीच में भी हर कार्बन के पास हाइड्रोजन या ऑक्सीजन या क्रियात्मक समूह जोड़ने बाहर की ओर बचे बंध — हर ढाँचा अनगिनत तरीक़ों से सजाया जा सकता। तीसरा, शांत, गुण कार्बन का छोटा आकार। छोटा परमाणु अपने साझा इलेक्ट्रॉन पास-कसे रखता, अतः कार्बन-कार्बन और कार्बन-अन्य बंध असामान्य प्रबल-स्थिर; लंबी शृंखलाएँ बड़े तत्वों (सिलिकॉन जैसे) की लंबी, कमज़ोर शृंखलाओं की तरह स्वतः नहीं टूटतीं। इन्हें मिलाओ — अनंत स्व-जुड़ाव, हर परमाणु पर चार जोड़-बिंदु, और जीने भर प्रबल बंध — और तुम्हें ऐसी निर्माण-किट मिलती जो मूलतः असीमित भिन्न, स्थिर अणु जोड़ सके। इसी से कार्बन का रसायन अपना विषय, कार्बनिक रसायन कहलाता, और जीवन के अणु — प्रोटीन, वसा, कार्बोहाइड्रेट, DNA — सब कार्बन ढाँचों पर बने। प्रचुरता, रेडियोधर्मिता, आयनिक बंधन का इससे कोई संबंध नहीं; शृंखलन और चतुर्संयोजकता, छोटे आकार से समर्थित, काम करते।",
          mr: "कार्बनची बेलगाम संयुग-मोजणी गुणांच्या दुर्मिळ संयोजनातून, सारे अणूतच रुजलेले. पहिला आणि सर्वांत महत्त्वाचा साखळीकरण: कार्बन अणू आणखी कार्बन अणूंशी पुन्हा पुन्हा जुळू शकतात, जवळपास कोणत्याही लांबीच्या सरळ साखळ्या, फांद्यांच्या साखळ्या आणि बंद वलये बांधत. काही इतर मूलद्रव्ये हे थोडे करू शकतात, पण कोणी कार्बनजवळ येत नाही. दुसरा चतुःसंयुजता: प्रत्येक कार्बनला नेमके चार बंध बनवायचे. म्हणून लांब कार्बन-साखळीच्या मध्येही प्रत्येक कार्बनकडे हायड्रोजन वा ऑक्सिजन वा कार्यकारी गट जोडायला बाहेरच्या दिशेने शिल्लक बंध — प्रत्येक सांगाडा असंख्य मार्गांनी सजवता येतो. तिसरा, शांत, गुण कार्बनचा लहान आकार. लहान अणू आपले वाटलेले इलेक्ट्रॉन जवळ-घट्ट धरतो, म्हणून कार्बन-कार्बन आणि कार्बन-इतर बंध असामान्य प्रबळ-स्थिर; लांब साखळ्या मोठ्या मूलद्रव्यांच्या (सिलिकॉनसारख्या) लांब, कमजोर साखळ्यांप्रमाणे आपोआप तुटत नाहीत. हे एकत्र करा — अनंत स्व-जुळणी, प्रत्येक अणूवर चार जोड-बिंदू, आणि जगण्याइतके प्रबळ बंध — आणि तुम्हाला अशी बांधकाम-किट मिळते जी मूलतः असीमित वेगळे, स्थिर रेणू जोडू शकते. म्हणूनच कार्बनचे रसायन स्वतःचा विषय, सेंद्रिय रसायनशास्त्र म्हणतात, आणि जीवनाचे रेणू — प्रथिने, स्निग्ध, कर्बोदके, DNA — सारे कार्बन सांगाड्यांवर बांधलेले. विपुलता, किरणोत्सर्ग, आयनिक बंधनाचा याच्याशी संबंध नाही; साखळीकरण आणि चतुःसंयुजता, लहान आकाराने पाठबळ दिलेली, काम करतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Oil and water do not mix, yet a little soap in the wash water lets water lift greasy dirt off cloth and carry it away. Since soap does not chemically destroy the grease, how does it manage to clean?",
          hi: "तेल और पानी नहीं मिलते, फिर भी धो-पानी में थोड़ा साबुन पानी को कपड़े से चिकनी मैल उठाने और ले जाने देता। चूँकि साबुन चिकनाई को रासायनिक रूप से नष्ट नहीं करता, यह सफ़ाई कैसे कर लेता?",
          mr: "तेल आणि पाणी मिसळत नाहीत, तरी धुण्याच्या पाण्यात थोडा साबण पाण्याला कापडावरून स्निग्ध मळ उचलू आणि वाहून नेऊ देतो. साबण स्निग्धतेला रासायनिकरीत्या नष्ट करत नसल्याने, तो स्वच्छता कशी करतो?",
        },
        choices: [
          {
            en: "Each soap molecule has a water-loving head and an oil-loving tail; the tails bury themselves in a grease droplet while the heads face the water, wrapping the droplet in a micelle whose watery outside lets it be rinsed away — so soap surrounds and floats off the grease rather than destroying it",
            hi: "हर साबुन अणु का पानी-प्रेमी सिर और तेल-प्रेमी पूँछ; पूँछें चिकनाई-बूँद में दबतीं जबकि सिर पानी की ओर, बूँद को मिसेल में लपेटते जिसका पानीदार बाहर उसे धो जाने देता — अतः साबुन चिकनाई को नष्ट करने के बजाय घेरकर तैरा देता",
            mr: "प्रत्येक साबण रेणूचे पाणी-प्रेमी डोके आणि तेल-प्रेमी शेपूट; शेपट्या स्निग्धता-थेंबात दडतात तर डोकी पाण्याकडे, थेंबाला मिसेलमध्ये गुंडाळत ज्याचे पाणीदार बाहेर त्याला धुऊन जाऊ देते — म्हणून साबण स्निग्धतेला नष्ट करण्याऐवजी वेढून तरंगवतो",
          },
          {
            en: "Soap chemically burns the grease into carbon dioxide and water",
            hi: "साबुन चिकनाई को रासायनिक रूप से कार्बन डाइऑक्साइड और पानी में जला देता",
            mr: "साबण स्निग्धतेला रासायनिकरीत्या कार्बन डायऑक्साइड आणि पाण्यात जाळतो",
          },
          {
            en: "Soap makes the water hotter, and hot water alone removes grease",
            hi: "साबुन पानी को गरम करता, और गरम पानी अकेला चिकनाई हटाता",
            mr: "साबण पाणी गरम करतो, आणि गरम पाणी एकटे स्निग्धता काढते",
          },
          {
            en: "Soap turns the grease into more soap",
            hi: "साबुन चिकनाई को और साबुन में बदल देता",
            mr: "साबण स्निग्धतेला आणखी साबणात बदलतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The whole trick lies in the shape of a single soap molecule, which is built to bridge two worlds that normally refuse to meet. One end of the molecule — the head — is ionic and 'water-loving' (hydrophilic): it is perfectly happy surrounded by water. The other end — a long carbon tail — is 'water-hating' (hydrophobic) but oil-loving: it will not dissolve in water but is quite at home in grease. Greasy dirt clings to cloth precisely because it is oily and water cannot get at it. When soap is added, the oil-loving tails of the soap molecules dig into the grease droplet, while the water-loving heads stay out in the surrounding water. Many soap molecules do this to the same droplet, arranging themselves into a tiny sphere called a micelle: all the tails point inward, buried in the trapped ball of grease, and all the heads point outward, presenting a water-friendly surface to the wash water. Now the grease, which water could never touch directly, is wrapped in a water-loving coat. The micelle, heads and all, mixes freely with the water and is simply rinsed away, carrying the dirt with it. Crucially, the soap has not destroyed or chemically changed the grease at all — it has only surrounded it and made it dispersible in water, floating it off the cloth. This is also why soap struggles in hard water: the calcium and magnesium ions there react with the soap to form an insoluble scum, using up the soap before it can make micelles — which is exactly the problem detergents were designed to solve.",
          hi: "पूरी चाल एक अकेले साबुन अणु की आकृति में, जो सामान्यतः मिलने से इनकार करती दो दुनियाओं को पाटने बना। अणु का एक सिरा — सिर — आयनिक और 'पानी-प्रेमी' (जलरागी): यह पानी से घिरा पूर्णतः प्रसन्न। दूसरा सिरा — लंबी कार्बन पूँछ — 'पानी-द्वेषी' (जलविरागी) पर तेल-प्रेमी: यह पानी में नहीं घुलती पर चिकनाई में सहज। चिकनी मैल कपड़े से ठीक इसलिए चिपकती क्योंकि तैलीय और पानी उस तक नहीं पहुँच सकता। साबुन जोड़ने पर साबुन अणुओं की तेल-प्रेमी पूँछें चिकनाई-बूँद में धँसतीं, जबकि पानी-प्रेमी सिर आसपास के पानी में रहते। कई साबुन अणु उसी बूँद को यह करते, मिसेल नामक नन्हे गोले में सजते: सारी पूँछें भीतर, फँसी चिकनाई-गेंद में दबीं, और सारे सिर बाहर, धो-पानी को पानी-मैत्री सतह देते। अब चिकनाई, जिसे पानी सीधे कभी न छू सके, पानी-प्रेमी कोट में लिपटी। मिसेल, सिरों समेत, पानी से मुक्त मिलता और बस धो जाता, मैल साथ ले जाता। मुख्यतः, साबुन ने चिकनाई को नष्ट या रासायनिक रूप से बदला बिलकुल नहीं — केवल घेरा और पानी में फैलने-योग्य बनाया, कपड़े से तैरा दिया। इसी से साबुन कठोर पानी में जूझता: वहाँ कैल्शियम-मैग्नीशियम आयन साबुन से अघुलनशील मैल बनाते, मिसेल बनाने से पहले साबुन चुकाते — ठीक वह समस्या जो अपमार्जक सुलझाने बने।",
          mr: "अख्खी युक्ती एका साबण रेणूच्या आकारात, जो सामान्यतः भेटायला नकार देणाऱ्या दोन जगांना जोडायला बांधलेला. रेणूचे एक टोक — डोके — आयनिक आणि 'पाणी-प्रेमी' (जलस्नेही): ते पाण्याने वेढलेले पूर्णपणे आनंदी. दुसरे टोक — लांब कार्बन शेपूट — 'पाणी-द्वेषी' (जलविरोधी) पण तेल-प्रेमी: ते पाण्यात विरघळत नाही पण स्निग्धतेत सहज. स्निग्ध मळ कापडाला नेमके म्हणून चिकटतो कारण तैलीय आणि पाणी त्यापर्यंत पोहोचू शकत नाही. साबण जोडल्यावर साबण रेणूंच्या तेल-प्रेमी शेपट्या स्निग्धता-थेंबात घुसतात, तर पाणी-प्रेमी डोकी आजूबाजूच्या पाण्यात राहतात. अनेक साबण रेणू त्याच थेंबाला हे करतात, मिसेल नावाच्या इवल्या गोलात मांडत: सर्व शेपट्या आत, अडकलेल्या स्निग्धता-चेंडूत दडलेल्या, आणि सर्व डोकी बाहेर, धुण्याच्या पाण्याला पाणी-स्नेही पृष्ठ देत. आता स्निग्धता, जिला पाणी थेट कधी स्पर्शू शकत नाही, पाणी-प्रेमी आवरणात गुंडाळलेली. मिसेल, डोक्यांसह, पाण्याशी मुक्त मिसळते आणि फक्त धुऊन जाते, मळ सोबत नेत. मुख्यतः, साबणाने स्निग्धतेला नष्ट वा रासायनिकरीत्या बदलले मुळीच नाही — फक्त वेढले आणि पाण्यात पसरण्याजोगे बनवले, कापडावरून तरंगवले. म्हणूनच साबण जड पाण्यात झगडतो: तिथले कॅल्शियम-मॅग्नेशियम आयन साबणाशी अविद्राव्य साक बनवतात, मिसेल बनवण्याआधी साबण संपवत — नेमकी ती समस्या जी डिटर्जंट सोडवायला बनवले.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Life Processes                                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-life-processes",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 5 — Life Processes",
      hi: "अध्याय 5 — जैव प्रक्रम",
      mr: "प्रकरण 5 — जीवन प्रक्रिया",
    },
    name: {
      en: "Life Processes",
      hi: "जैव प्रक्रम",
      mr: "जीवन प्रक्रिया",
    },
    summary: {
      en: "The housekeeping that keeps a body alive: food made by autotrophs and taken by heterotrophs, glucose built in photosynthesis and burnt in respiration, materials carried by blood and sap, and waste filtered out — the same four tasks of nutrition, respiration, transport and excretion in every living thing.",
      hi: "वह देख-रेख जो शरीर को जीवित रखती: स्वपोषी बनाते और परपोषी लेते भोजन, प्रकाश-संश्लेषण में बना और श्वसन में जला ग्लूकोज़, रक्त-रस से ढोए पदार्थ, और छाना अपशिष्ट — हर जीव में पोषण, श्वसन, वहन और उत्सर्जन के वही चार काम।",
      mr: "ती देखभाल जी शरीराला जिवंत ठेवते: स्वयंपोषी बनवतात आणि परपोषी घेतात ते अन्न, प्रकाशसंश्लेषणात बनलेले आणि श्वसनात जळलेले ग्लुकोज, रक्त-रसाने वाहिलेले पदार्थ, आणि गाळलेला कचरा — प्रत्येक सजीवात पोषण, श्वसन, वहन आणि उत्सर्जनाची तीच चार कामे.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "nutrition-types",
        name: {
          en: "Autotrophic and heterotrophic nutrition",
          hi: "स्वपोषी और परपोषी पोषण",
          mr: "स्वयंपोषी आणि परपोषी पोषण",
        },
        kind: "idea",
        prompt: {
          en: "A green plant builds its own food from sunlight, while an animal must eat food made by others. What are these two ways of getting food called?",
          hi: "हरा पौधा धूप से अपना भोजन बनाता, जबकि पशु को दूसरों का बनाया भोजन खाना होता। भोजन पाने के इन दो तरीक़ों को क्या कहते?",
          mr: "हिरवे झाड उन्हातून स्वतःचे अन्न बनवते, तर प्राण्याला इतरांनी बनवलेले अन्न खावे लागते. अन्न मिळवण्याच्या या दोन मार्गांना काय म्हणतात?",
        },
        statement: {
          en: "Autotrophic nutrition is making one's own food from simple substances using light, as green plants do; heterotrophic nutrition is taking in food made by other organisms, as animals and fungi do.",
          hi: "स्वपोषी पोषण प्रकाश से सरल पदार्थों से अपना भोजन बनाना, जैसे हरे पौधे करते; परपोषी पोषण अन्य जीवों का बनाया भोजन लेना, जैसे पशु और कवक करते।",
          mr: "स्वयंपोषी पोषण प्रकाशाने साध्या पदार्थांतून स्वतःचे अन्न बनवणे, जसे हिरवी झाडे करतात; परपोषी पोषण इतर सजीवांनी बनवलेले अन्न घेणे, जसे प्राणी आणि बुरशी करतात.",
        },
        detail: {
          en: "Autotrophs are the makers at the base of every food chain; heterotrophs, direct or indirect, all depend on the food the autotrophs first captured from the sun.",
          hi: "स्वपोषी हर खाद्य-शृंखला के आधार पर निर्माता; परपोषी, प्रत्यक्ष या अप्रत्यक्ष, सब उस भोजन पर निर्भर जो स्वपोषी ने पहले सूरज से पकड़ा।",
          mr: "स्वयंपोषी प्रत्येक अन्नसाखळीच्या पायथ्याशी निर्माते; परपोषी, प्रत्यक्ष वा अप्रत्यक्ष, सारे त्या अन्नावर अवलंबून जे स्वयंपोषींनी आधी सूर्याकडून पकडले.",
        },
        extra: {
          en: "Some heterotrophs feed in special ways — a fungus digests dead matter around it, and a Cuscuta vine sucks sap straight from a living host.",
          hi: "कुछ परपोषी विशेष तरीक़ों से खाते — कवक अपने आसपास मृत पदार्थ पचाता, और अमरबेल जीवित पोषी से सीधे रस चूसती।",
          mr: "काही परपोषी विशेष मार्गांनी खातात — बुरशी आपल्या आजूबाजूचा मृत पदार्थ पचवते, आणि अमरवेल जिवंत यजमानाकडून थेट रस शोषते.",
        },
        pair: {
          left: {
            en: "Makes its own food from light",
            hi: "प्रकाश से अपना भोजन बनाता",
            mr: "प्रकाशातून स्वतःचे अन्न बनवते",
          },
          right: {
            en: "autotrophic nutrition",
            hi: "स्वपोषी पोषण",
            mr: "स्वयंपोषी पोषण",
          },
        },
      },
      {
        id: "photosynthesis",
        name: {
          en: "Photosynthesis in autotrophs",
          hi: "स्वपोषियों में प्रकाश-संश्लेषण",
          mr: "स्वयंपोषींतील प्रकाशसंश्लेषण",
        },
        kind: "process",
        prompt: {
          en: "In a green leaf, chlorophyll traps sunlight and uses it to turn carbon dioxide and water into glucose, releasing oxygen. What is this food-making process called?",
          hi: "हरे पत्ते में क्लोरोफ़िल धूप पकड़ता और उससे कार्बन डाइऑक्साइड और पानी को ग्लूकोज़ में बदलता, ऑक्सीजन छोड़ते। यह भोजन-बनाती प्रक्रिया क्या कहलाती?",
          mr: "हिरव्या पानात हरितद्रव्य ऊन पकडते आणि त्याने कार्बन डायऑक्साइड आणि पाणी ग्लुकोजमध्ये बदलते, ऑक्सिजन सोडत. ही अन्न-बनवणारी प्रक्रिया काय म्हणतात?",
        },
        statement: {
          en: "Photosynthesis is the process by which green plants use chlorophyll to trap light energy and convert carbon dioxide and water into glucose, releasing oxygen as a by-product.",
          hi: "प्रकाश-संश्लेषण वह प्रक्रिया जिससे हरे पौधे क्लोरोफ़िल से प्रकाश-ऊर्जा पकड़ते और कार्बन डाइऑक्साइड-पानी को ग्लूकोज़ में बदलते, उपोत्पाद बतौर ऑक्सीजन छोड़ते।",
          mr: "प्रकाशसंश्लेषण ती प्रक्रिया ज्याने हिरवी झाडे हरितद्रव्याने प्रकाश-ऊर्जा पकडतात आणि कार्बन डायऑक्साइड-पाणी ग्लुकोजमध्ये बदलतात, उपउत्पाद म्हणून ऑक्सिजन सोडत.",
        },
        detail: {
          en: "It stores the sun's energy in the chemical bonds of glucose — the food that feeds the plant and, in the end, almost every living thing.",
          hi: "यह सूरज की ऊर्जा को ग्लूकोज़ के रासायनिक बंधों में जमा करता — वह भोजन जो पौधे को और अंततः लगभग हर जीव को पालता।",
          mr: "ते सूर्याची ऊर्जा ग्लुकोजच्या रासायनिक बंधांत साठवते — ते अन्न जे झाडाला आणि अखेर जवळपास प्रत्येक सजीवाला पोसते.",
        },
        extra: {
          en: "The oxygen we breathe is photosynthesis's leftover — the whole of Earth's oxygen atmosphere was made, over ages, by green things splitting water.",
          hi: "जो ऑक्सीजन हम साँस लेते वह प्रकाश-संश्लेषण की बची — पृथ्वी का पूरा ऑक्सीजन-वायुमंडल युगों में हरी चीज़ों के पानी तोड़ने से बना।",
          mr: "जो ऑक्सिजन आपण श्वासात घेतो तो प्रकाशसंश्लेषणाचा उरलेला — पृथ्वीचे अख्खे ऑक्सिजन-वातावरण युगांत हिरव्या गोष्टींनी पाणी मोडून बनवले.",
        },
        pair: {
          left: {
            en: "Light plus CO₂ and water make glucose",
            hi: "प्रकाश साथ CO₂ और पानी ग्लूकोज़ बनाएँ",
            mr: "प्रकाश अधिक CO₂ आणि पाणी ग्लुकोज बनवतात",
          },
          right: {
            en: "photosynthesis",
            hi: "प्रकाश-संश्लेषण",
            mr: "प्रकाशसंश्लेषण",
          },
        },
      },
      {
        id: "respiration",
        name: {
          en: "Respiration",
          hi: "श्वसन",
          mr: "श्वसन",
        },
        kind: "process",
        prompt: {
          en: "Inside every cell, glucose is broken down — usually with oxygen — to release the energy the body runs on, stored as ATP. What is this energy-releasing process called?",
          hi: "हर कोशिका के भीतर ग्लूकोज़ तोड़ा जाता — आमतौर पर ऑक्सीजन से — शरीर जिस ऊर्जा पर चलता उसे छोड़ते, ATP में जमा। यह ऊर्जा-छोड़ती प्रक्रिया क्या कहलाती?",
          mr: "प्रत्येक पेशीत ग्लुकोज मोडले जाते — सहसा ऑक्सिजनने — शरीर ज्या ऊर्जेवर चालते ती सोडत, ATP मध्ये साठवत. ही ऊर्जा-सोडणारी प्रक्रिया काय म्हणतात?",
        },
        statement: {
          en: "Respiration is the breakdown of glucose in the cells to release energy, stored as ATP; aerobic respiration uses oxygen and gives much energy, while anaerobic respiration works without oxygen and gives less.",
          hi: "श्वसन कोशिकाओं में ग्लूकोज़ का टूटना ऊर्जा छोड़ने, ATP में जमा; वायवीय श्वसन ऑक्सीजन वापरता और अधिक ऊर्जा देता, जबकि अवायवीय बिना ऑक्सीजन काम करता और कम देता।",
          mr: "श्वसन पेशींत ग्लुकोजचे मोडणे ऊर्जा सोडण्यासाठी, ATP मध्ये साठवत; ऑक्सिश्वसन ऑक्सिजन वापरते आणि पुष्कळ ऊर्जा देते, तर विनॉक्सिश्वसन ऑक्सिजनविना काम करते आणि कमी देते.",
        },
        detail: {
          en: "Aerobic respiration finishes glucose off into carbon dioxide and water; anaerobic leaves it half-broken as lactic acid (in our muscles) or alcohol (in yeast).",
          hi: "वायवीय श्वसन ग्लूकोज़ को कार्बन डाइऑक्साइड-पानी में पूरा करता; अवायवीय इसे आधा-टूटा लैक्टिक अम्ल (हमारी माँसपेशियों में) या अल्कोहल (यीस्ट में) छोड़ता।",
          mr: "ऑक्सिश्वसन ग्लुकोज कार्बन डायऑक्साइड-पाण्यात पूर्ण करते; विनॉक्सिश्वसन ते अर्धे-मोडलेले लॅक्टिक आम्ल (आपल्या स्नायूंत) वा अल्कोहोल (यीस्टमध्ये) सोडते.",
        },
        extra: {
          en: "The cramp of hard exercise is anaerobic respiration — muscles starved of oxygen build up lactic acid until you rest and breathe deep.",
          hi: "कठिन व्यायाम की ऐंठन अवायवीय श्वसन — ऑक्सीजन-भूखी माँसपेशियाँ लैक्टिक अम्ल जमा करतीं जब तक तुम आराम कर गहरी साँस न लो।",
          mr: "कठीण व्यायामाचा गोळा विनॉक्सिश्वसन — ऑक्सिजन-भुकेल्या स्नायू लॅक्टिक आम्ल साठवतात जोवर तू विश्रांती घेऊन खोल श्वास घेत नाहीस.",
        },
        pair: {
          left: {
            en: "Glucose broken to release energy as ATP",
            hi: "ग्लूकोज़ टूटे ATP बतौर ऊर्जा छोड़ने",
            mr: "ग्लुकोज मोडले ATP म्हणून ऊर्जा सोडायला",
          },
          right: {
            en: "respiration",
            hi: "श्वसन",
            mr: "श्वसन",
          },
        },
      },
      {
        id: "transport",
        name: {
          en: "Transport in the body",
          hi: "शरीर में परिवहन",
          mr: "शरीरातील वहन",
        },
        kind: "process",
        prompt: {
          en: "Blood carries food, oxygen and waste around an animal's body while a pump keeps it moving, and in a plant tubes carry water up and food down. What life process does this describe?",
          hi: "रक्त पशु के शरीर में भोजन, ऑक्सीजन और अपशिष्ट ढोता जबकि एक पंप उसे चलाए रखता, और पौधे में नलियाँ पानी ऊपर और भोजन नीचे ढोतीं। यह कौन-सा जैव-प्रक्रम बताता?",
          mr: "रक्त प्राण्याच्या शरीरात अन्न, ऑक्सिजन आणि कचरा वाहते तर एक पंप ते चालू ठेवतो, आणि झाडात नळ्या पाणी वर आणि अन्न खाली वाहतात. ही कोणती जीवन-प्रक्रिया सांगते?",
        },
        statement: {
          en: "Transport is the carrying of materials around a body: in animals blood pumped by the heart carries food, oxygen and wastes, while in plants xylem carries water up and phloem carries food.",
          hi: "परिवहन शरीर में पदार्थ ढोना: पशुओं में हृदय द्वारा पंप रक्त भोजन, ऑक्सीजन और अपशिष्ट ढोता, जबकि पौधों में जाइलम पानी ऊपर और फ्लोएम भोजन ढोता।",
          mr: "वहन शरीरात पदार्थ वाहणे: प्राण्यांत हृदयाने पंप केलेले रक्त अन्न, ऑक्सिजन आणि कचरा वाहते, तर झाडांत प्रकाष्ठ पाणी वर आणि परिकाष्ठ अन्न वाहते.",
        },
        detail: {
          en: "In humans the heart drives a double circulation — blood passes through the heart twice for each full round of the body, keeping the supply brisk.",
          hi: "मनुष्यों में हृदय दोहरा परिसंचरण चलाता — शरीर के हर पूरे चक्कर को रक्त हृदय से दो बार गुज़रता, आपूर्ति तेज़ रखते।",
          mr: "मनुष्यांत हृदय दुहेरी अभिसरण चालवते — शरीराच्या प्रत्येक पूर्ण फेरीला रक्त हृदयातून दोनदा जाते, पुरवठा जलद ठेवत.",
        },
        extra: {
          en: "Water climbs a tall tree without any pump — it is pulled up as leaves lose water by transpiration, dragging the whole thread behind it.",
          hi: "पानी ऊँचे पेड़ पर बिना किसी पंप चढ़ता — पत्तियों के वाष्पोत्सर्जन से पानी खोने पर यह ऊपर खिंचता, पूरे धागे को पीछे घसीटते।",
          mr: "पाणी उंच झाडावर कोणत्याही पंपाविना चढते — पानांच्या बाष्पोत्सर्जनाने पाणी गमावताना ते वर ओढले जाते, अख्खा धागा मागे ओढत.",
        },
        pair: {
          left: {
            en: "Blood and sap ferrying materials around",
            hi: "पदार्थ ढोते रक्त और रस",
            mr: "पदार्थ वाहणारे रक्त आणि रस",
          },
          right: {
            en: "transport",
            hi: "परिवहन",
            mr: "वहन",
          },
        },
      },
      {
        id: "excretion",
        name: {
          en: "Excretion",
          hi: "उत्सर्जन",
          mr: "उत्सर्जन",
        },
        kind: "process",
        prompt: {
          en: "The body's chemistry makes poisonous nitrogen-containing wastes that must be filtered out of the blood and thrown away as urine. What is this removal of metabolic waste called?",
          hi: "शरीर का रसायन विषैले नाइट्रोजन-युक्त अपशिष्ट बनाता जिन्हें रक्त से छानकर मूत्र बतौर फेंकना होता। उपापचयी अपशिष्ट के इस हटाने को क्या कहते?",
          mr: "शरीराचे रसायन विषारी नायट्रोजन-युक्त कचरा बनवते जो रक्तातून गाळून मूत्र म्हणून फेकावा लागतो. चयापचयी कचऱ्याच्या या काढण्याला काय म्हणतात?",
        },
        statement: {
          en: "Excretion is the removal of harmful nitrogenous waste made by the body's chemistry; in humans the kidneys filter it from the blood and pass it out as urine.",
          hi: "उत्सर्जन शरीर के रसायन से बना हानिकारक नाइट्रोजनी अपशिष्ट हटाना; मनुष्यों में गुर्दे इसे रक्त से छानते और मूत्र बतौर बाहर निकालते।",
          mr: "उत्सर्जन शरीराच्या रसायनाने बनलेला हानिकारक नायट्रोजनी कचरा काढणे; मनुष्यांत मूत्रपिंडे तो रक्तातून गाळतात आणि मूत्र म्हणून बाहेर काढतात.",
        },
        detail: {
          en: "The kidney's working unit is the nephron — a tiny filter that lets waste and water pass, then reclaims the water and useful substances the body still needs.",
          hi: "गुर्दे की कार्य-इकाई वृक्काणु — एक नन्हा छन्ना जो अपशिष्ट-पानी जाने देता, फिर पानी और उपयोगी पदार्थ जो शरीर को अब भी चाहिए वापस लेता।",
          mr: "मूत्रपिंडाचे कार्य-एकक वृक्कक — एक इवली गाळणी जी कचरा-पाणी जाऊ देते, मग पाणी आणि उपयुक्त पदार्थ जे शरीराला अजून हवे परत घेते.",
        },
        extra: {
          en: "Plants have no kidneys — they shed waste in falling leaves, store it in bark and vacuoles, or simply release it into the soil around their roots.",
          hi: "पौधों के गुर्दे नहीं — वे गिरती पत्तियों में अपशिष्ट त्यागते, छाल-रसधानियों में जमा करते, या बस जड़ों के आसपास मिट्टी में छोड़ते।",
          mr: "झाडांना मूत्रपिंडे नाहीत — ती गळणाऱ्या पानांत कचरा टाकतात, साल-रिक्तिकांत साठवतात, किंवा फक्त मुळांभोवतीच्या मातीत सोडतात.",
        },
        pair: {
          left: {
            en: "Filtering nitrogen waste out as urine",
            hi: "नाइट्रोजन अपशिष्ट मूत्र बतौर छानना",
            mr: "नायट्रोजन कचरा मूत्र म्हणून गाळणे",
          },
          right: {
            en: "excretion",
            hi: "उत्सर्जन",
            mr: "उत्सर्जन",
          },
        },
      },
      {
        id: "digestion",
        name: {
          en: "Digestion",
          hi: "पाचन",
          mr: "पचन",
        },
        kind: "process",
        prompt: {
          en: "The bread you eat is too big and complex for a cell to use, so enzymes break it down step by step into simple sugars the body can absorb. What is this breaking-down of food called?",
          hi: "जो रोटी तुम खाते वह कोशिका के काम आने को बहुत बड़ी-जटिल, अतः एंज़ाइम इसे क़दम-दर-क़दम सरल शर्कराओं में तोड़ते जिन्हें शरीर सोख सके। भोजन के इस टूटने को क्या कहते?",
          mr: "जी भाकर तू खातोस ती पेशीच्या उपयोगाला फार मोठी-गुंतागुंतीची, म्हणून विकरे ती पाऊल-दर-पाऊल साध्या साखरांत मोडतात जी शरीर शोषू शकते. अन्नाच्या या मोडण्याला काय म्हणतात?",
        },
        statement: {
          en: "Digestion is the breaking down of large, complex food into small, simple molecules that the body can absorb, carried out step by step by enzymes along the alimentary canal.",
          hi: "पाचन बड़े, जटिल भोजन को छोटे, सरल अणुओं में तोड़ना जिन्हें शरीर सोख सके, आहार-नाल के साथ एंज़ाइमों द्वारा क़दम-दर-क़दम किया।",
          mr: "पचन मोठे, गुंतागुंतीचे अन्न लहान, साध्या रेणूंत मोडणे जे शरीर शोषू शकते, अन्ननलिकेच्या बाजूने विकरांनी पाऊल-दर-पाऊल केलेले.",
        },
        detail: {
          en: "Each enzyme has one job — saliva's amylase starts on starch, the stomach's pepsin on protein, and the intestine finishes them all into absorbable units.",
          hi: "हर एंज़ाइम का एक काम — लार का एमाइलेज़ मंड पर शुरू, पेट का पेप्सिन प्रोटीन पर, और आँत उन सबको सोखे-योग्य इकाइयों में पूरा करती।",
          mr: "प्रत्येक विकराचे एक काम — लाळेचे अमायलेज पिष्टावर सुरू, पोटाचे पेप्सिन प्रथिनावर, आणि आतडे त्या साऱ्यांना शोषण्याजोग्या एककांत पूर्ण करते.",
        },
        extra: {
          en: "The digested nutrients are soaked up through the finger-like villi of the small intestine, whose vast folded surface makes absorption swift.",
          hi: "पचे पोषक छोटी आँत के उँगली-से रसांकुरों से सोखे जाते, जिनकी विशाल मुड़ी सतह अवशोषण तेज़ करती।",
          mr: "पचलेले पोषक लहान आतड्याच्या बोटांसारख्या रसांकुरांतून शोषले जातात, ज्यांचे प्रचंड घडीचे पृष्ठ शोषण जलद करते.",
        },
        pair: {
          left: {
            en: "Enzymes break big food into absorbable units",
            hi: "एंज़ाइम बड़े भोजन को सोखे-योग्य में तोड़ें",
            mr: "विकरे मोठे अन्न शोषण्याजोग्यात मोडतात",
          },
          right: {
            en: "digestion",
            hi: "पाचन",
            mr: "पचन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Photosynthesis builds glucose and stores energy, releasing oxygen; respiration breaks glucose down and releases energy, using oxygen. A student says the two are 'opposites'. In what sense is respiration essentially the reverse of photosynthesis, and why does that matter for life on Earth?",
          hi: "प्रकाश-संश्लेषण ग्लूकोज़ बनाता और ऊर्जा जमा करता, ऑक्सीजन छोड़ते; श्वसन ग्लूकोज़ तोड़ता और ऊर्जा छोड़ता, ऑक्सीजन वापरते। एक छात्र कहता दोनों 'विपरीत'। श्वसन किस अर्थ में मूलतः प्रकाश-संश्लेषण का उल्टा, और यह पृथ्वी पर जीवन को क्यों मायने रखता?",
          mr: "प्रकाशसंश्लेषण ग्लुकोज बनवते आणि ऊर्जा साठवते, ऑक्सिजन सोडत; श्वसन ग्लुकोज मोडते आणि ऊर्जा सोडते, ऑक्सिजन वापरत. एक विद्यार्थी म्हणतो दोन्ही 'विरुद्ध'. श्वसन कोणत्या अर्थाने मूलतः प्रकाशसंश्लेषणाचे उलट, आणि ते पृथ्वीवरील जीवनाला का महत्त्वाचे?",
        },
        choices: [
          {
            en: "Photosynthesis uses light energy to combine CO₂ and water into glucose and oxygen (storing energy); respiration recombines glucose and oxygen back into CO₂ and water (releasing that stored energy). The two run in opposite directions and, cycling together, keep the atmosphere's oxygen and carbon dioxide — and the flow of energy from the sun — in balance for all living things",
            hi: "प्रकाश-संश्लेषण प्रकाश-ऊर्जा से CO₂ और पानी को ग्लूकोज़-ऑक्सीजन में जोड़ता (ऊर्जा जमा); श्वसन ग्लूकोज़-ऑक्सीजन को वापस CO₂-पानी में जोड़ता (वह जमा ऊर्जा छोड़ते)। दोनों उल्टी दिशाओं में चलते और, साथ चक्र करते, वायुमंडल की ऑक्सीजन-कार्बन डाइऑक्साइड — और सूरज से ऊर्जा-प्रवाह — सब जीवों के लिए संतुलित रखते",
            mr: "प्रकाशसंश्लेषण प्रकाश-ऊर्जेने CO₂ आणि पाणी ग्लुकोज-ऑक्सिजनमध्ये जोडते (ऊर्जा साठवत); श्वसन ग्लुकोज-ऑक्सिजन परत CO₂-पाण्यात जोडते (ती साठलेली ऊर्जा सोडत). दोन्ही उलट दिशांत चालतात आणि, एकत्र चक्र करत, वातावरणाची ऑक्सिजन-कार्बन डायऑक्साइड — आणि सूर्याकडून ऊर्जा-प्रवाह — सर्व सजीवांसाठी संतुलित ठेवतात",
          },
          {
            en: "They are unrelated processes that happen to share some chemicals by chance",
            hi: "वे असंबंधित प्रक्रियाएँ जो संयोग से कुछ रसायन साझा करतीं",
            mr: "त्या असंबंधित प्रक्रिया ज्या योगायोगाने काही रसायने वाटतात",
          },
          {
            en: "Respiration also uses light, so it is identical to photosynthesis",
            hi: "श्वसन भी प्रकाश वापरता, अतः प्रकाश-संश्लेषण के समान",
            mr: "श्वसनही प्रकाश वापरते, म्हणून प्रकाशसंश्लेषणासारखेच",
          },
          {
            en: "Only plants respire and only animals photosynthesise",
            hi: "केवल पौधे श्वसन करते और केवल पशु प्रकाश-संश्लेषण",
            mr: "फक्त झाडे श्वसन करतात आणि फक्त प्राणी प्रकाशसंश्लेषण",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Written as word-equations, the two processes really are near-mirror images. Photosynthesis takes carbon dioxide and water, and using the energy of sunlight captured by chlorophyll, builds them up into glucose and oxygen — an 'uphill' reaction that stores the sun's energy in the chemical bonds of the glucose. Respiration does the reverse: it takes glucose and oxygen and breaks them back down into carbon dioxide and water, and in doing so releases the very energy that photosynthesis had locked away, capturing it in ATP for the cell to spend. So one builds the fuel and banks the energy; the other burns the fuel and withdraws the energy — opposite directions of the same transformation. This matters enormously for life on Earth because the two together form a great cycle. The oxygen that respiration consumes is exactly what photosynthesis pours back into the air; the carbon dioxide that respiration produces is exactly what photosynthesis draws in. Left to itself, respiration by every animal, plant and microbe would strip the atmosphere of oxygen and choke it with carbon dioxide — but green plants, running photosynthesis, continually replace the oxygen and remove the carbon dioxide. And the deeper current beneath the gas exchange is energy: sunlight, captured by plants, is passed on as food to every other organism and finally released by respiration to power life. (Note the common misconception the wrong options carry: plants respire too, all day and night, not only animals — photosynthesis is an extra thing green plants do on top of the respiration every living cell must do.) So 'reverse of each other' is the right idea, and it is precisely this reversibility, cycling endlessly, that keeps both the air and the energy supply of the living world in balance.",
          hi: "शब्द-समीकरणों में लिखें तो दोनों प्रक्रियाएँ सचमुच लगभग दर्पण-छवि। प्रकाश-संश्लेषण कार्बन डाइऑक्साइड और पानी लेता, और क्लोरोफ़िल से पकड़ी धूप की ऊर्जा से, उन्हें ग्लूकोज़ और ऑक्सीजन में बनाता — एक 'चढ़ाई' अभिक्रिया जो सूरज की ऊर्जा ग्लूकोज़ के रासायनिक बंधों में जमा करती। श्वसन उल्टा करता: यह ग्लूकोज़-ऑक्सीजन लेकर उन्हें वापस कार्बन डाइऑक्साइड-पानी में तोड़ता, और ऐसा करते वही ऊर्जा छोड़ता जो प्रकाश-संश्लेषण ने बंद की थी, कोशिका के खर्च को ATP में पकड़ते। अतः एक ईंधन बनाता और ऊर्जा जमा; दूसरा ईंधन जलाता और ऊर्जा निकालता — उसी रूपांतरण की उल्टी दिशाएँ। यह पृथ्वी पर जीवन को बहुत मायने रखता क्योंकि दोनों मिलकर एक बड़ा चक्र बनाते। जो ऑक्सीजन श्वसन खपाता ठीक वही प्रकाश-संश्लेषण हवा में वापस उँड़ेलता; जो कार्बन डाइऑक्साइड श्वसन बनाता ठीक वही प्रकाश-संश्लेषण खींचता। अपने भरोसे छोड़ा, हर पशु, पौधे, सूक्ष्मजीव का श्वसन वायुमंडल से ऑक्सीजन छील कार्बन डाइऑक्साइड से घोंट देता — पर हरे पौधे, प्रकाश-संश्लेषण चलाते, लगातार ऑक्सीजन बदलते और कार्बन डाइऑक्साइड हटाते। और गैस-विनिमय के नीचे गहरी धारा ऊर्जा: धूप, पौधों से पकड़ी, हर अन्य जीव को भोजन बतौर सौंपी और अंततः श्वसन से छोड़ी जीवन को शक्ति देने। (ग़लत विकल्प जो आम भ्रांति ढोते नोट करो: पौधे भी श्वसन करते, दिन-रात, केवल पशु नहीं — प्रकाश-संश्लेषण अतिरिक्त चीज़ जो हरे पौधे हर जीवित कोशिका के श्वसन के ऊपर करते।) अतः 'एक-दूसरे का उल्टा' सही विचार, और ठीक यही उलटावपन, अनंत चक्र करता, जीवित दुनिया की हवा और ऊर्जा-आपूर्ति दोनों संतुलित रखता।",
          mr: "शब्द-समीकरणांत लिहिले तर दोन्ही प्रक्रिया खरोखर जवळपास आरशातल्या प्रतिमा. प्रकाशसंश्लेषण कार्बन डायऑक्साइड आणि पाणी घेते, आणि हरितद्रव्याने पकडलेल्या उन्हाच्या ऊर्जेने, त्यांना ग्लुकोज आणि ऑक्सिजनमध्ये बांधते — एक 'चढाची' अभिक्रिया जी सूर्याची ऊर्जा ग्लुकोजच्या रासायनिक बंधांत साठवते. श्वसन उलट करते: ते ग्लुकोज-ऑक्सिजन घेऊन त्यांना परत कार्बन डायऑक्साइड-पाण्यात मोडते, आणि असे करताना तीच ऊर्जा सोडते जी प्रकाशसंश्लेषणाने बंद केली होती, पेशीच्या खर्चाला ATP मध्ये पकडत. म्हणून एक इंधन बनवते आणि ऊर्जा साठवते; दुसरे इंधन जाळते आणि ऊर्जा काढते — त्याच रूपांतराच्या उलट दिशा. हे पृथ्वीवरील जीवनाला प्रचंड महत्त्वाचे कारण दोन्ही एकत्र एक मोठे चक्र बनवतात. जो ऑक्सिजन श्वसन वापरते नेमके तेच प्रकाशसंश्लेषण हवेत परत ओतते; जो कार्बन डायऑक्साइड श्वसन बनवते नेमके तेच प्रकाशसंश्लेषण खेचते. स्वतःवर सोडले, प्रत्येक प्राणी, झाड, सूक्ष्मजीवाचे श्वसन वातावरणातून ऑक्सिजन सोलून कार्बन डायऑक्साइडने गुदमरवेल — पण हिरवी झाडे, प्रकाशसंश्लेषण चालवत, सतत ऑक्सिजन बदलतात आणि कार्बन डायऑक्साइड काढतात. आणि वायू-देवाणघेवाणीखालचा खोल प्रवाह ऊर्जा: ऊन, झाडांनी पकडलेले, प्रत्येक इतर सजीवाला अन्न म्हणून सोपवलेले आणि अखेर श्वसनाने सोडलेले जीवनाला शक्ती द्यायला. (चुकीचे पर्याय जी सामान्य गैरसमज वाहतात लक्षात घ्या: झाडेही श्वसन करतात, दिवसरात्र, फक्त प्राणी नाही — प्रकाशसंश्लेषण अतिरिक्त गोष्ट जी हिरवी झाडे प्रत्येक जिवंत पेशीच्या श्वसनावर करतात.) म्हणून 'एकमेकांचे उलट' योग्य कल्पना, आणि नेमके हेच उलटपण, अनंत चक्र करत, जिवंत जगाची हवा आणि ऊर्जा-पुरवठा दोन्ही संतुलित ठेवते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Fish have a heart with two chambers and blood that passes through it once per body-circuit, but birds and mammals have a four-chambered heart with double circulation, keeping oxygen-rich and oxygen-poor blood strictly apart. Why did warm-blooded animals evolve this more complex plumbing?",
          hi: "मछलियों के हृदय में दो कक्ष और रक्त जो शरीर-चक्कर में एक बार गुज़रता, पर पक्षियों-स्तनधारियों में चार-कक्षीय हृदय दोहरे परिसंचरण के साथ, ऑक्सीजन-समृद्ध और ऑक्सीजन-दरिद्र रक्त कड़ाई से अलग रखते। गर्म-रक्त पशुओं ने यह अधिक जटिल नलसाज़ी क्यों विकसित की?",
          mr: "माशांच्या हृदयात दोन कप्पे आणि रक्त जे शरीर-फेरीत एकदा जाते, पण पक्षी-सस्तन प्राण्यांत चार-कप्प्यांचे हृदय दुहेरी अभिसरणासह, ऑक्सिजन-समृद्ध आणि ऑक्सिजन-दरिद्री रक्त कडकपणे वेगळे ठेवत. उष्ण-रक्त प्राण्यांनी ही अधिक गुंतागुंतीची नळकाम का विकसित केली?",
        },
        choices: [
          {
            en: "Warm-blooded animals need a great deal of energy to keep a constant body temperature, so their cells need a rich, steady oxygen supply; a four-chambered heart keeps oxygenated and deoxygenated blood from mixing, so fully oxygen-loaded blood is pumped hard to the body, delivering oxygen fast enough to fuel their high energy needs",
            hi: "गर्म-रक्त पशुओं को नियत शरीर-तापमान रखने बहुत ऊर्जा चाहिए, अतः उनकी कोशिकाओं को समृद्ध, स्थिर ऑक्सीजन-आपूर्ति चाहिए; चार-कक्षीय हृदय ऑक्सीजनित-विऑक्सीजनित रक्त को मिलने से रोकता, अतः पूर्ण ऑक्सीजन-भरा रक्त शरीर को ज़ोर से पंप, ऑक्सीजन इतनी तेज़ पहुँचाते कि उनकी उच्च ऊर्जा-ज़रूरतें ईंधित करें",
            mr: "उष्ण-रक्त प्राण्यांना स्थिर शरीर-तापमान राखायला पुष्कळ ऊर्जा हवी, म्हणून त्यांच्या पेशींना समृद्ध, स्थिर ऑक्सिजन-पुरवठा हवा; चार-कप्प्यांचे हृदय ऑक्सिजनयुक्त-ऑक्सिजनरहित रक्त मिसळण्यापासून रोखते, म्हणून पूर्ण ऑक्सिजन-भरलेले रक्त शरीराला जोरात पंप, ऑक्सिजन इतक्या जलद पोहोचवत की त्यांच्या उच्च ऊर्जा-गरजा इंधित करतात",
          },
          {
            en: "A four-chambered heart is simply larger and looks more impressive",
            hi: "चार-कक्षीय हृदय बस बड़ा और अधिक प्रभावशाली दिखता",
            mr: "चार-कप्प्यांचे हृदय फक्त मोठे आणि अधिक प्रभावी दिसते",
          },
          {
            en: "Warm-blooded animals do not need oxygen, so they keep the blood separate for no reason",
            hi: "गर्म-रक्त पशुओं को ऑक्सीजन नहीं चाहिए, अतः वे रक्त बिना कारण अलग रखते",
            mr: "उष्ण-रक्त प्राण्यांना ऑक्सिजन नको, म्हणून ते रक्त कारणाविना वेगळे ठेवतात",
          },
          {
            en: "Mixing the blood would make it flow faster, so they avoid mixing to slow it down",
            hi: "रक्त मिलाना इसे तेज़ बहाता, अतः वे धीमा करने मिलाने से बचते",
            mr: "रक्त मिसळणे ते जलद वाहवते, म्हणून ते मंद करायला मिसळणे टाळतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The answer ties heart design directly to how an animal makes its living. Fish are cold-blooded: their body temperature drifts with the water around them, and their energy demands are relatively modest, so a simpler heart with two chambers, pushing blood once around a single loop, is enough — even though the blood loses pressure passing through the gills before reaching the body. Birds and mammals are warm-blooded, which is a costly way to live: they hold their body temperature steady and high regardless of the weather, and that constant internal warmth has to be generated by burning fuel all the time in every tissue. Such a furnace demands a rich and unfailing supply of oxygen to every cell, delivered fast and at full strength. That is exactly what the four-chambered heart with double circulation provides. By splitting the heart into four chambers, it keeps two streams completely separate: oxygen-poor blood coming back from the body is sent only to the lungs, and oxygen-rich blood returning from the lungs is sent only out to the body — the two never mix. This means the blood reaching the tissues is fully loaded with oxygen, not diluted by any oxygen-poor blood, and because it passes through the heart a second time it can be pumped out again at high pressure. The result is oxygen delivered to the cells both at maximum concentration and at speed — precisely what a high-energy, warm-blooded metabolism needs. So the more elaborate plumbing is not decoration; it is the circulatory system rebuilt to match a much greater and steadier demand for energy, which cold-blooded fish, living at nature's pace, simply do not have.",
          hi: "उत्तर हृदय-रचना को सीधे इससे बाँधता कि पशु अपनी जीविका कैसे कमाता। मछलियाँ ठंडे-रक्त: उनका शरीर-तापमान आसपास के पानी से बहता, और उनकी ऊर्जा-माँगें अपेक्षाकृत मामूली, अतः दो कक्षों वाला सरल हृदय, रक्त को एकल लूप में एक बार धकेलते, काफ़ी — यद्यपि रक्त गलफड़ों से गुज़रते शरीर पहुँचने से पहले दबाव खोता। पक्षी-स्तनधारी गर्म-रक्त, जो जीने का महँगा तरीक़ा: वे मौसम चाहे जो शरीर-तापमान स्थिर-ऊँचा रखते, और वह नियत भीतरी गरमी हर ऊतक में हर समय ईंधन जलाकर बनानी होती। ऐसी भट्टी हर कोशिका को समृद्ध-अचूक ऑक्सीजन-आपूर्ति माँगती, तेज़ और पूरी शक्ति से पहुँचाई। ठीक वही चार-कक्षीय हृदय दोहरे परिसंचरण से देता। हृदय को चार कक्षों में बाँटकर, यह दो धाराएँ पूर्णतः अलग रखता: शरीर से लौटता ऑक्सीजन-दरिद्र रक्त केवल फेफड़ों को, और फेफड़ों से लौटता ऑक्सीजन-समृद्ध रक्त केवल शरीर को — दोनों कभी नहीं मिलते। इसका अर्थ ऊतकों पहुँचता रक्त पूर्ण ऑक्सीजन-भरा, किसी ऑक्सीजन-दरिद्र रक्त से पतला नहीं, और हृदय से दूसरी बार गुज़रने से यह फिर उच्च दाब पर पंप। परिणाम कोशिकाओं को ऑक्सीजन अधिकतम सांद्रता और गति दोनों पर पहुँचाई — ठीक जो उच्च-ऊर्जा, गर्म-रक्त उपापचय माँगता। अतः अधिक विस्तृत नलसाज़ी सजावट नहीं; यह परिसंचरण-तंत्र कहीं अधिक और स्थिर ऊर्जा-माँग से मेल खाने फिर बना, जो ठंडे-रक्त मछलियाँ, प्रकृति की गति पर जीतीं, बस नहीं रखतीं।",
          mr: "उत्तर हृदय-रचनेला थेट यांशी बांधते की प्राणी आपली उपजीविका कशी कमावतो. मासे थंड-रक्त: त्यांचे शरीर-तापमान आजूबाजूच्या पाण्याशी वाहते, आणि त्यांच्या ऊर्जा-मागण्या तुलनेने माफक, म्हणून दोन कप्प्यांचे साधे हृदय, रक्ताला एकल फेरीत एकदा ढकलत, पुरेसे — जरी रक्त कल्ल्यांतून जाताना शरीर गाठण्याआधी दाब गमावते. पक्षी-सस्तन उष्ण-रक्त, जो जगण्याचा महाग मार्ग: ते हवामान कितीही असो शरीर-तापमान स्थिर-उच्च ठेवतात, आणि ती स्थिर आतली उब प्रत्येक ऊतीत सर्वकाळ इंधन जाळून बनवावी लागते. अशी भट्टी प्रत्येक पेशीला समृद्ध-अचूक ऑक्सिजन-पुरवठा मागते, जलद आणि पूर्ण शक्तीने पोहोचवलेला. नेमके तेच चार-कप्प्यांचे हृदय दुहेरी अभिसरणाने देते. हृदयाला चार कप्प्यांत विभागून, ते दोन प्रवाह पूर्णपणे वेगळे ठेवते: शरीराकडून परतणारे ऑक्सिजन-दरिद्री रक्त फक्त फुप्फुसांना, आणि फुप्फुसांकडून परतणारे ऑक्सिजन-समृद्ध रक्त फक्त शरीराला — दोन्ही कधी मिसळत नाहीत. याचा अर्थ ऊतींपर्यंत पोहोचणारे रक्त पूर्ण ऑक्सिजन-भरलेले, कोणत्याही ऑक्सिजन-दरिद्री रक्ताने पातळ नाही, आणि हृदयातून दुसऱ्यांदा जाताना ते पुन्हा उच्च दाबावर पंप. परिणाम पेशींना ऑक्सिजन कमाल सांद्रता आणि वेग दोन्हीवर पोहोचवलेला — नेमके जे उच्च-ऊर्जा, उष्ण-रक्त चयापचय मागते. म्हणून अधिक विस्तृत नळकाम सजावट नाही; ते अभिसरण-तंत्र कितीतरी अधिक आणि स्थिर ऊर्जा-मागणीशी जुळायला पुन्हा बांधलेले, जे थंड-रक्त मासे, निसर्गाच्या गतीने जगत, फक्त बाळगत नाहीत.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Control and Coordination                                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-control-coordination",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 6 — Control and Coordination",
      hi: "अध्याय 6 — नियंत्रण एवं समन्वय",
      mr: "प्रकरण 6 — नियंत्रण आणि समन्वय",
    },
    name: {
      en: "Control and Coordination",
      hi: "नियंत्रण एवं समन्वय",
      mr: "नियंत्रण आणि समन्वय",
    },
    summary: {
      en: "How a body keeps its parts working together: neurons flashing impulses along the nervous system, the reflex that yanks a hand from a flame before thought, the brain's divided offices, and the slower chemical messengers — hormones in animals, auxin in plants — that steer growth and balance.",
      hi: "शरीर अपने भागों को कैसे मिलकर काम कराता: तंत्रिका-तंत्र में आवेग चमकाते न्यूरॉन, विचार से पहले आग से हाथ खींचता प्रतिवर्त, मस्तिष्क के बँटे दफ़्तर, और धीमे रासायनिक दूत — पशुओं में हार्मोन, पौधों में ऑक्सिन — जो वृद्धि-संतुलन चलाते।",
      mr: "शरीर आपल्या भागांना कसे एकत्र काम करवते: चेतासंस्थेत आवेग चमकवणारे चेतापेशी, विचाराआधी आगीतून हात खेचणारा प्रतिक्षिप्त, मेंदूचे विभागलेले कार्यालये, आणि मंद रासायनिक दूत — प्राण्यांत संप्रेरके, झाडांत ऑक्सिन — जे वाढ-समतोल चालवतात.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "neuron-nervous",
        name: {
          en: "The nervous system",
          hi: "तंत्रिका तंत्र",
          mr: "चेतासंस्था",
        },
        kind: "system",
        prompt: {
          en: "A message races from your fingertip to your brain in a flash, carried by long branched cells as an electrical impulse. What system, built of neurons, controls the body by such fast signals?",
          hi: "एक संदेश तुम्हारी उँगली से मस्तिष्क तक पल में दौड़ता, लंबी शाखित कोशिकाओं द्वारा विद्युत आवेग बतौर। न्यूरॉनों का बना कौन-सा तंत्र ऐसे तेज़ संकेतों से शरीर नियंत्रित करता?",
          mr: "एक संदेश तुझ्या बोटाच्या टोकातून मेंदूपर्यंत क्षणात धावतो, लांब फांद्यांच्या पेशींद्वारे विद्युत आवेग म्हणून. चेतापेशींनी बनलेली कोणती संस्था अशा जलद संकेतांनी शरीर नियंत्रित करते?",
        },
        statement: {
          en: "The nervous system controls the body through fast electrical impulses carried by neurons — long branched cells — and is made of the brain, the spinal cord and the nerves reaching every part.",
          hi: "तंत्रिका तंत्र न्यूरॉनों — लंबी शाखित कोशिकाओं — द्वारा ढोए तेज़ विद्युत आवेगों से शरीर नियंत्रित करता, और मस्तिष्क, मेरुरज्जु और हर भाग तक पहुँचती तंत्रिकाओं का बना।",
          mr: "चेतासंस्था चेतापेशी — लांब फांद्यांच्या पेशी — यांनी वाहिलेल्या जलद विद्युत आवेगांनी शरीर नियंत्रित करते, आणि मेंदू, मेरुरज्जू आणि प्रत्येक भागापर्यंत पोहोचणाऱ्या चेतांनी बनलेली.",
        },
        detail: {
          en: "A neuron passes its signal to the next across a tiny gap, the synapse, where a chemical carries the message the last step over.",
          hi: "न्यूरॉन अपना संकेत अगले को एक नन्हे अंतराल, सिनैप्स, पर देता, जहाँ एक रसायन संदेश को अंतिम क़दम पार ले जाता।",
          mr: "चेतापेशी आपला संकेत पुढच्याला एका इवल्या फटी, अनुबंध, वर देते, जिथे एक रसायन संदेश शेवटचे पाऊल पार नेते.",
        },
        extra: {
          en: "The impulse is electrical inside a neuron but chemical across the synapse — the same relay that a nerve-gas or an anaesthetic can silence.",
          hi: "आवेग न्यूरॉन के भीतर विद्युत पर सिनैप्स के पार रासायनिक — वही रिले जिसे नस-गैस या निश्चेतक चुप करा सकता।",
          mr: "आवेग चेतापेशीच्या आत विद्युत पण अनुबंधापलीकडे रासायनिक — तोच रिले जो चेता-वायू वा भूल देणारे औषध शांत करू शकते.",
        },
        pair: {
          left: {
            en: "Controls the body by fast electrical impulses",
            hi: "तेज़ विद्युत आवेगों से शरीर नियंत्रित करे",
            mr: "जलद विद्युत आवेगांनी शरीर नियंत्रित करे",
          },
          right: {
            en: "the nervous system",
            hi: "तंत्रिका तंत्र",
            mr: "चेतासंस्था",
          },
        },
      },
      {
        id: "reflex-action",
        name: {
          en: "A reflex action",
          hi: "प्रतिवर्ती क्रिया",
          mr: "प्रतिक्षिप्त क्रिया",
        },
        kind: "idea",
        prompt: {
          en: "Touch something scalding and your hand jerks back before you have even decided to move it, the signal looping through the spinal cord rather than waiting for the brain. What is this rapid automatic response called?",
          hi: "कुछ झुलसाता छुओ और तुम्हारा हाथ हिलाने का निर्णय करने से पहले ही पीछे झटकता, संकेत मस्तिष्क की प्रतीक्षा के बजाय मेरुरज्जु से लूप करते। इस तीव्र स्वचालित प्रतिक्रिया को क्या कहते?",
          mr: "काही भाजणारे स्पर्शा आणि तुझा हात हलवण्याचा निर्णय घेण्याआधीच मागे झटकतो, संकेत मेंदूची वाट पाहण्याऐवजी मेरुरज्जूतून वळत. या जलद स्वयंचलित प्रतिसादाला काय म्हणतात?",
        },
        statement: {
          en: "A reflex action is a rapid, automatic response to a stimulus in which the signal travels a short reflex arc through the spinal cord, producing the reaction without waiting for the brain to decide.",
          hi: "प्रतिवर्ती क्रिया उद्दीपन के प्रति तीव्र, स्वचालित प्रतिक्रिया जिसमें संकेत मेरुरज्जु से एक छोटा प्रतिवर्त-चाप चलता, मस्तिष्क के निर्णय की प्रतीक्षा बिना प्रतिक्रिया देते।",
          mr: "प्रतिक्षिप्त क्रिया उद्दीपकाला जलद, स्वयंचलित प्रतिसाद ज्यात संकेत मेरुरज्जूतून एक लहान प्रतिक्षिप्त-चाप चालतो, मेंदूच्या निर्णयाची वाट न पाहता प्रतिक्रिया देत.",
        },
        detail: {
          en: "The reflex arc runs stimulus → sensory neuron → spinal cord → motor neuron → muscle, skipping the long climb up to the thinking brain.",
          hi: "प्रतिवर्त-चाप चलता उद्दीपन → संवेदी न्यूरॉन → मेरुरज्जु → प्रेरक न्यूरॉन → माँसपेशी, सोचते मस्तिष्क तक की लंबी चढ़ाई छोड़ते।",
          mr: "प्रतिक्षिप्त-चाप चालतो उद्दीपक → संवेदी चेतापेशी → मेरुरज्जू → प्रेरक चेतापेशी → स्नायू, विचार करणाऱ्या मेंदूपर्यंतची लांब चढाई वगळत.",
        },
        extra: {
          en: "The brain is told a moment later, which is why you feel the pain just after your hand has already pulled away.",
          hi: "मस्तिष्क को पल-भर बाद बताया जाता, इसी से तुम दर्द ठीक तब महसूस करते जब हाथ पहले ही खिंच चुका।",
          mr: "मेंदूला क्षणभराने सांगितले जाते, म्हणूनच तू वेदना नेमकी तेव्हा जाणवतोस जेव्हा हात आधीच खेचला गेला.",
        },
        pair: {
          left: {
            en: "Instant response looping through the spinal cord",
            hi: "मेरुरज्जु से लूप करती तत्काल प्रतिक्रिया",
            mr: "मेरुरज्जूतून वळणारा तत्काळ प्रतिसाद",
          },
          right: {
            en: "a reflex action",
            hi: "प्रतिवर्ती क्रिया",
            mr: "प्रतिक्षिप्त क्रिया",
          },
        },
      },
      {
        id: "brain-regions",
        name: {
          en: "The regions of the brain",
          hi: "मस्तिष्क के भाग",
          mr: "मेंदूचे भाग",
        },
        kind: "structure",
        prompt: {
          en: "One part of the brain thinks and decides, another keeps you balanced and your movements smooth, and a third silently runs your breathing and heartbeat. How is the brain divided by these jobs?",
          hi: "मस्तिष्क का एक भाग सोचता-निर्णय करता, दूसरा तुम्हें संतुलित और गति सहज रखता, और तीसरा चुपचाप साँस-धड़कन चलाता। इन कामों से मस्तिष्क कैसे बँटा?",
          mr: "मेंदूचा एक भाग विचार-निर्णय करतो, दुसरा तुला संतुलित आणि हालचाली सहज ठेवतो, आणि तिसरा गुपचूप श्वास-हृदयस्पंद चालवतो. या कामांनी मेंदू कसा विभागला?",
        },
        statement: {
          en: "The brain is divided by function: the cerebrum handles thinking, memory and voluntary action; the cerebellum keeps balance and smooth coordinated movement; and the medulla runs involuntary acts like breathing and heartbeat.",
          hi: "मस्तिष्क कार्य से बँटा: प्रमस्तिष्क सोच, स्मृति और ऐच्छिक क्रिया सँभालता; अनुमस्तिष्क संतुलन और सहज समन्वित गति रखता; और मेडुला साँस-धड़कन जैसी अनैच्छिक क्रियाएँ चलाता।",
          mr: "मेंदू कार्याने विभागला: प्रमस्तिष्क विचार, स्मृती आणि ऐच्छिक क्रिया हाताळतो; अनुमस्तिष्क संतुलन आणि सहज समन्वित हालचाल राखतो; आणि मेडुला श्वास-हृदयस्पंदासारख्या अनैच्छिक क्रिया चालवतो.",
        },
        detail: {
          en: "This is why an injury to one region robs one ability but not others — damage to the cerebellum wrecks balance while leaving thought intact.",
          hi: "इसी से एक भाग की चोट एक क्षमता छीनती पर अन्य नहीं — अनुमस्तिष्क की क्षति संतुलन बिगाड़ती जबकि सोच अछूती छोड़ती।",
          mr: "म्हणूनच एका भागाची इजा एक क्षमता हिरावते पण इतर नाही — अनुमस्तिष्काची इजा संतुलन बिघडवते तर विचार अस्पर्श ठेवते.",
        },
        extra: {
          en: "The medulla's involuntary control is why breathing and the heart carry on even in deep sleep, when the thinking cerebrum is switched off.",
          hi: "मेडुला का अनैच्छिक नियंत्रण ही क्यों साँस-हृदय गहरी नींद में भी चलते, जब सोचता प्रमस्तिष्क बंद।",
          mr: "मेडुलाचे अनैच्छिक नियंत्रण म्हणूनच श्वास-हृदय गाढ झोपेतही चालतात, जेव्हा विचार करणारा प्रमस्तिष्क बंद.",
        },
        pair: {
          left: {
            en: "Thinking, balance and involuntary control split apart",
            hi: "सोच, संतुलन और अनैच्छिक नियंत्रण अलग",
            mr: "विचार, संतुलन आणि अनैच्छिक नियंत्रण वेगळे",
          },
          right: {
            en: "the regions of the brain",
            hi: "मस्तिष्क के भाग",
            mr: "मेंदूचे भाग",
          },
        },
      },
      {
        id: "hormones",
        name: {
          en: "Hormones and the endocrine system",
          hi: "हार्मोन और अंतःस्रावी तंत्र",
          mr: "संप्रेरके आणि अंतःस्रावी संस्था",
        },
        kind: "system",
        prompt: {
          en: "Besides its electric nerves, the body sends slower chemical messengers through the blood — a squirt of one readies you to fight or flee, another controls your blood sugar. What are these messengers and their glands called?",
          hi: "अपनी विद्युत तंत्रिकाओं के अलावा, शरीर रक्त से धीमे रासायनिक दूत भेजता — एक की फुहार तुम्हें लड़ने या भागने तैयार करती, दूसरा रक्त-शर्करा नियंत्रित करता। इन दूतों और उनकी ग्रंथियों को क्या कहते?",
          mr: "आपल्या विद्युत चेतांखेरीज, शरीर रक्तातून मंद रासायनिक दूत पाठवते — एकाची फवारणी तुला लढायला वा पळायला तयार करते, दुसरा रक्त-साखर नियंत्रित करतो. या दूतांना आणि त्यांच्या ग्रंथींना काय म्हणतात?",
        },
        statement: {
          en: "Hormones are chemical messengers made by endocrine glands and carried in the blood; they act more slowly than nerves but their effects are widespread and lasting — like adrenaline for fright and insulin for blood sugar.",
          hi: "हार्मोन अंतःस्रावी ग्रंथियों के बने रासायनिक दूत जो रक्त में ढोए; वे तंत्रिकाओं से धीरे काम करते पर उनके प्रभाव व्यापक और टिकाऊ — जैसे भय को एड्रेनालिन और रक्त-शर्करा को इंसुलिन।",
          mr: "संप्रेरके अंतःस्रावी ग्रंथींनी बनवलेले रासायनिक दूत जे रक्तात वाहिले; ते चेतांहून हळू काम करतात पण त्यांचे परिणाम व्यापक आणि टिकाऊ — जसे भीतीला अ‍ॅड्रेनालिन आणि रक्त-साखरेला इन्शुलिन.",
        },
        detail: {
          en: "A gland pours its hormone straight into the blood, which carries it everywhere, yet only the organs built to respond — its 'target' tissues — react.",
          hi: "ग्रंथि अपना हार्मोन सीधे रक्त में उँड़ेलती, जो इसे हर जगह ले जाता, फिर भी केवल जवाब देने बने अंग — उसके 'लक्ष्य' ऊतक — प्रतिक्रिया देते।",
          mr: "ग्रंथी आपले संप्रेरक थेट रक्तात ओतते, जे ते सर्वत्र नेते, तरी फक्त प्रतिसाद द्यायला बनलेले अवयव — त्याच्या 'लक्ष्य' ऊती — प्रतिक्रिया देतात.",
        },
        extra: {
          en: "Too little of a hormone is as harmful as too much — a shortage of thyroid slows the whole body, and a shortage of insulin causes diabetes.",
          hi: "हार्मोन बहुत कम बहुत ज़्यादा जितना ही हानिकारक — थायरॉइड की कमी पूरे शरीर को धीमा करती, और इंसुलिन की कमी मधुमेह लाती।",
          mr: "संप्रेरक फार कमी फार जास्तइतकेच हानिकारक — थायरॉइडची कमतरता अख्खे शरीर मंदावते, आणि इन्शुलिनची कमतरता मधुमेह आणते.",
        },
        pair: {
          left: {
            en: "Slow chemical messengers carried in the blood",
            hi: "रक्त में ढोए धीमे रासायनिक दूत",
            mr: "रक्तात वाहिलेले मंद रासायनिक दूत",
          },
          right: {
            en: "hormones",
            hi: "हार्मोन",
            mr: "संप्रेरके",
          },
        },
      },
      {
        id: "plant-tropism",
        name: {
          en: "Plant hormones and tropism",
          hi: "पादप हार्मोन और अनुवर्तन",
          mr: "वनस्पती संप्रेरके आणि अनुवर्तन",
        },
        kind: "idea",
        prompt: {
          en: "A plant, without nerves or muscles, still bends its shoot toward a window's light and drives its root down into the soil. Which chemical-driven directional growth toward or away from a stimulus is this?",
          hi: "एक पौधा, बिना तंत्रिका या माँसपेशी, फिर भी अपना प्ररोह खिड़की के प्रकाश की ओर मोड़ता और जड़ मिट्टी में नीचे चलाता। उद्दीपन की ओर या से दूर यह रासायनिक-चालित दिशात्मक वृद्धि कौन-सी है?",
          mr: "एक झाड, चेता वा स्नायूविना, तरी आपले खोड खिडकीच्या प्रकाशाकडे वाकवते आणि मूळ मातीत खाली चालवते. उद्दीपकाकडे वा त्यापासून दूर ही रासायनिक-चालित दिशात्मक वाढ कोणती?",
        },
        statement: {
          en: "Tropism is the directional growth of a plant toward or away from a stimulus, driven by hormones like auxin — shoots grow toward light (phototropism) and roots grow down toward gravity (geotropism).",
          hi: "अनुवर्तन पौधे की उद्दीपन की ओर या से दूर दिशात्मक वृद्धि, ऑक्सिन जैसे हार्मोनों से चालित — प्ररोह प्रकाश की ओर (प्रकाशानुवर्तन) और जड़ें गुरुत्व की ओर नीचे (गुरुत्वानुवर्तन)।",
          mr: "अनुवर्तन झाडाची उद्दीपकाकडे वा त्यापासून दूर दिशात्मक वाढ, ऑक्सिनसारख्या संप्रेरकांनी चालित — खोडे प्रकाशाकडे (प्रकाशानुवर्तन) आणि मुळे गुरुत्वाकडे खाली (गुरुत्वानुवर्तन).",
        },
        detail: {
          en: "Auxin gathers on the shaded side of a shoot and makes those cells grow longer, so the shoot bends toward the light — growth, not muscle, does the moving.",
          hi: "ऑक्सिन प्ररोह की छायादार ओर जमता और उन कोशिकाओं को अधिक लंबा उगाता, अतः प्ररोह प्रकाश की ओर मुड़ता — वृद्धि, न कि माँसपेशी, हिलाती।",
          mr: "ऑक्सिन खोडाच्या सावलीच्या बाजूला जमते आणि त्या पेशी अधिक लांब वाढवते, म्हणून खोड प्रकाशाकडे वाकते — वाढ, न की स्नायू, हलवते.",
        },
        extra: {
          en: "Because growth is slow, plant responses take hours or days — a sunflower turning to follow the sun, not a hand snatched from a flame.",
          hi: "क्योंकि वृद्धि धीमी, पादप-प्रतिक्रियाएँ घंटे या दिन लेतीं — सूरजमुखी सूरज का पीछा करने मुड़ता, न कि आग से झटका हाथ।",
          mr: "कारण वाढ मंद, वनस्पती-प्रतिक्रिया तास वा दिवस घेतात — सूर्यफूल सूर्याचा पाठलाग करायला वळते, न की आगीतून झटकलेला हात.",
        },
        pair: {
          left: {
            en: "Growth bending toward or away from a stimulus",
            hi: "उद्दीपन की ओर या से दूर मुड़ती वृद्धि",
            mr: "उद्दीपकाकडे वा दूर वाकणारी वाढ",
          },
          right: {
            en: "tropism",
            hi: "अनुवर्तन",
            mr: "अनुवर्तन",
          },
        },
      },
      {
        id: "feedback-control",
        name: {
          en: "Feedback regulation",
          hi: "पुनर्भरण नियमन",
          mr: "पुनर्भरण नियमन",
        },
        kind: "idea",
        prompt: {
          en: "When blood sugar rises after a meal, insulin is released to bring it down; when it falls too low, the release stops. What self-correcting control, where the output regulates its own cause, is this?",
          hi: "भोजन बाद रक्त-शर्करा चढ़ती, इसे घटाने इंसुलिन छूटता; बहुत नीचे गिरने पर छूटना रुकता। कौन-सा स्व-सुधारता नियंत्रण, जहाँ परिणाम अपना कारण नियमित करता, यह है?",
          mr: "जेवणानंतर रक्त-साखर चढते, ती घटवायला इन्शुलिन सुटते; फार खाली गेल्यावर सुटणे थांबते. कोणते स्व-दुरुस्त नियंत्रण, जिथे परिणाम आपले कारण नियमित करतो, हे आहे?",
        },
        statement: {
          en: "Feedback regulation is a self-correcting control in which the amount of a hormone is adjusted by its own effect — insulin is released when blood sugar is high and held back when it is low, keeping the level steady.",
          hi: "पुनर्भरण नियमन एक स्व-सुधारता नियंत्रण जिसमें हार्मोन की मात्रा उसके अपने प्रभाव से समायोजित — रक्त-शर्करा ऊँची होने पर इंसुलिन छूटता और नीची होने पर रोका, स्तर स्थिर रखते।",
          mr: "पुनर्भरण नियमन एक स्व-दुरुस्त नियंत्रण ज्यात संप्रेरकाची मात्रा त्याच्या स्वतःच्या परिणामाने जुळवली — रक्त-साखर जास्त असता इन्शुलिन सुटते आणि कमी असता रोखले, पातळी स्थिर ठेवत.",
        },
        detail: {
          en: "This keeps hormone levels from running wild — the gland is switched on and off by the very condition it is meant to correct.",
          hi: "यह हार्मोन-स्तर को बेलगाम होने से रोकता — ग्रंथि ठीक उसी दशा से चालू-बंद होती जिसे उसे सुधारना है।",
          mr: "हे संप्रेरक-पातळी बेलगाम होण्यापासून रोखते — ग्रंथी नेमक्या त्याच अवस्थेने चालू-बंद होते जी तिला दुरुस्त करायची.",
        },
        extra: {
          en: "It is the body's thermostat idea — like a heater that switches itself off once the room is warm enough, then on again when it cools.",
          hi: "यह शरीर का ताप-नियंत्रक विचार — जैसे हीटर जो कमरा पर्याप्त गरम होते स्वयं बंद, फिर ठंडा होते चालू।",
          mr: "हे शरीराचे तापनियंत्रक तत्त्व — जसे हीटर जे खोली पुरेशी गरम होताच स्वतः बंद, मग थंड होताच चालू.",
        },
        pair: {
          left: {
            en: "Output switching its own cause on and off",
            hi: "परिणाम अपना कारण चालू-बंद करे",
            mr: "परिणाम आपले कारण चालू-बंद करे",
          },
          right: {
            en: "feedback regulation",
            hi: "पुनर्भरण नियमन",
            mr: "पुनर्भरण नियमन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "If your fingers touch a hot pan, your hand pulls back in a fraction of a second — long before you consciously feel the heat and 'decide' to move. Why is this reflex so much faster than an ordinary thought-out action?",
          hi: "यदि तुम्हारी उँगलियाँ गरम तवे को छुएँ, तुम्हारा हाथ सेकंड के अंश में पीछे खिंचता — तुम्हारे सचेत रूप से गरमी महसूस करने और हिलने का 'निर्णय' करने से बहुत पहले। यह प्रतिवर्त एक साधारण सोची-समझी क्रिया से इतना तेज़ क्यों?",
          mr: "जर तुझी बोटे गरम तव्याला स्पर्शली, तुझा हात सेकंदाच्या अंशात मागे खेचतो — तू जाणीवपूर्वक उष्णता जाणवण्याआधी आणि हलण्याचा 'निर्णय' घेण्याआधी. हा प्रतिक्षिप्त एका साध्या विचार केलेल्या क्रियेहून इतका जलद का?",
        },
        choices: [
          {
            en: "In a reflex the signal takes a short cut: it goes stimulus → sensory neuron → spinal cord → motor neuron → muscle, and the spinal cord orders the muscle to act at once, without the signal having to travel all the way up to the brain and back for a conscious decision — saving that long trip is what makes it so fast",
            hi: "प्रतिवर्त में संकेत छोटा रास्ता लेता: उद्दीपन → संवेदी न्यूरॉन → मेरुरज्जु → प्रेरक न्यूरॉन → माँसपेशी, और मेरुरज्जु माँसपेशी को तुरंत क्रिया का आदेश देती, संकेत को सचेत निर्णय के लिए मस्तिष्क तक पूरी यात्रा और वापस किए बिना — वह लंबी यात्रा बचाना ही इसे इतना तेज़ बनाता",
            mr: "प्रतिक्षिप्तात संकेत आडवाट घेतो: उद्दीपक → संवेदी चेतापेशी → मेरुरज्जू → प्रेरक चेतापेशी → स्नायू, आणि मेरुरज्जू स्नायूला लगेच क्रियेचा आदेश देते, संकेताला जाणीवपूर्वक निर्णयासाठी मेंदूपर्यंत संपूर्ण प्रवास आणि परत न करता — तो लांब प्रवास वाचवणे हेच त्याला इतके जलद बनवते",
          },
          {
            en: "Reflexes are faster because the brain thinks especially quickly about danger",
            hi: "प्रतिवर्त तेज़ क्योंकि मस्तिष्क ख़तरे के बारे में विशेष रूप से जल्दी सोचता",
            mr: "प्रतिक्षिप्त जलद कारण मेंदू धोक्याबद्दल विशेष जलद विचार करतो",
          },
          {
            en: "The hand moves before any nerve signal travels at all",
            hi: "हाथ किसी तंत्रिका संकेत के चलने से पहले ही हिलता",
            mr: "हात कोणताही चेता-संकेत चालण्याआधीच हलतो",
          },
          {
            en: "Reflexes use hormones, which travel faster than nerve impulses",
            hi: "प्रतिवर्त हार्मोन वापरते, जो तंत्रिका आवेगों से तेज़ चलते",
            mr: "प्रतिक्षिप्त संप्रेरके वापरते, जी चेता-आवेगांहून जलद चालतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The speed of a reflex comes from the short route its signal takes, not from any special quickness of thought. In a deliberate action, a message from your skin has to travel all the way up the spinal cord to the brain, where it is consciously registered and a decision is made, and then a fresh command must travel all the way back down to the muscle — a long round trip that takes noticeable time. For something like touching a hot pan, that delay could mean a serious burn. Evolution's solution is the reflex arc, a built-in short cut wired through the spinal cord itself. When the sensory neuron in your fingertip fires, its signal reaches the spinal cord and is passed almost immediately to a motor neuron, which orders the arm muscle to contract and pull the hand away. The command is issued right there in the spinal cord, without waiting for the signal to climb to the brain, be thought about, and come back. That is why the hand is already moving before you consciously feel the pain — the brain does get the message, but a moment later, as a report of something that has already happened rather than as the decision to act. So the reflex is faster purely because it skips the longest and slowest leg of the journey: the trip to and from the thinking brain. (Note the traps in the wrong answers: the signal is still a nerve impulse, not a hormone, and hormones are slower, not faster; and the hand certainly does not move with no signal at all.) This built-in shortcut is exactly why reflexes protect us from sudden dangers that a slower, thought-out response could not.",
          hi: "प्रतिवर्त की गति उसके संकेत के छोटे रास्ते से, न कि सोच की किसी विशेष तेज़ी से। जान-बूझकर की क्रिया में तुम्हारी त्वचा का संदेश मेरुरज्जु से पूरा ऊपर मस्तिष्क तक जाता, जहाँ सचेत रूप से दर्ज और निर्णय, फिर नया आदेश पूरा नीचे माँसपेशी तक — एक लंबा चक्कर जो उल्लेखनीय समय लेता। गरम तवा छूने जैसे को वह देरी गंभीर जलन का अर्थ हो सकती। विकास का समाधान प्रतिवर्त-चाप, मेरुरज्जु से ही तार-बद्ध अंतर्निहित छोटा रास्ता। जब तुम्हारी उँगली का संवेदी न्यूरॉन दागता, उसका संकेत मेरुरज्जु पहुँचता और लगभग तुरंत प्रेरक न्यूरॉन को दिया, जो बाँह की माँसपेशी को सिकुड़ने और हाथ खींचने आदेश देता। आदेश वहीं मेरुरज्जु में जारी, संकेत के मस्तिष्क चढ़ने, सोचे जाने, वापस आने की प्रतीक्षा बिना। इसी से हाथ पहले ही हिलता जब तुम सचेत रूप से दर्द महसूस करते — मस्तिष्क को संदेश मिलता ही, पर पल-भर बाद, पहले ही हो चुके की रिपोर्ट बतौर, न कि क्रिया के निर्णय बतौर। अतः प्रतिवर्त तेज़ विशुद्ध इसलिए कि यह यात्रा का सबसे लंबा-धीमा चरण छोड़ता: सोचते मस्तिष्क तक और से। (ग़लत उत्तरों के जाल नोट करो: संकेत अब भी तंत्रिका आवेग, न कि हार्मोन, और हार्मोन धीमे, तेज़ नहीं; और हाथ निश्चय बिना किसी संकेत नहीं हिलता।) यह अंतर्निहित छोटा रास्ता ठीक क्यों प्रतिवर्त हमें अचानक ख़तरों से रक्षते जिनसे धीमी, सोची-समझी प्रतिक्रिया न रक्ष सके।",
          mr: "प्रतिक्षिप्ताचा वेग त्याच्या संकेताच्या आडवाटेतून, न की विचाराच्या कोणत्याही विशेष जलदपणातून. जाणीवपूर्वक क्रियेत तुझ्या त्वचेचा संदेश मेरुरज्जूतून पूर्ण वर मेंदूपर्यंत जातो, जिथे जाणीवपूर्वक नोंदला आणि निर्णय, मग नवा आदेश पूर्ण खाली स्नायूपर्यंत — एक लांब फेरी जी लक्षणीय वेळ घेते. गरम तवा स्पर्शण्यासारख्याला तो विलंब गंभीर भाजण्याचा अर्थ असू शकतो. उत्क्रांतीचा उपाय प्रतिक्षिप्त-चाप, मेरुरज्जूतूनच जोडलेली अंगभूत आडवाट. जेव्हा तुझ्या बोटाची संवेदी चेतापेशी झडते, तिचा संकेत मेरुरज्जूला पोहोचतो आणि जवळपास लगेच प्रेरक चेतापेशीला दिला, जी बाहूच्या स्नायूला आकुंचायला आणि हात खेचायला आदेश देते. आदेश तिथेच मेरुरज्जूत जारी, संकेताला मेंदूकडे चढणे, विचारले जाणे, परत येण्याची वाट न पाहता. म्हणूनच हात आधीच हलतो जेव्हा तू जाणीवपूर्वक वेदना जाणवतोस — मेंदूला संदेश मिळतोच, पण क्षणभराने, आधीच घडलेल्याचा अहवाल म्हणून, न की क्रियेच्या निर्णयाप्रमाणे. म्हणून प्रतिक्षिप्त जलद विशुद्ध म्हणून की तो प्रवासाचा सर्वांत लांब-मंद टप्पा वगळतो: विचार करणाऱ्या मेंदूपर्यंत आणि परत. (चुकीच्या उत्तरांतील सापळे लक्षात घ्या: संकेत अजून चेता-आवेग, न की संप्रेरक, आणि संप्रेरके मंद, जलद नाही; आणि हात नक्कीच कोणत्याही संकेताविना हलत नाही.) ही अंगभूत आडवाट नेमके का प्रतिक्षिप्त आपल्याला अचानक धोक्यांपासून रक्षतात ज्यांपासून मंद, विचार केलेला प्रतिसाद रक्षू शकणार नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The body has two separate systems for control — the nervous system and the hormonal (endocrine) system. If nerves already carry messages, why does the body also need the slower chemical messengers of hormones? What does each do better?",
          hi: "शरीर के नियंत्रण को दो अलग तंत्र — तंत्रिका तंत्र और हार्मोनी (अंतःस्रावी) तंत्र। यदि तंत्रिकाएँ पहले ही संदेश ढोतीं, शरीर को हार्मोनों के धीमे रासायनिक दूत भी क्यों चाहिए? हर एक क्या बेहतर करता?",
          mr: "शरीराच्या नियंत्रणाला दोन वेगळ्या संस्था — चेतासंस्था आणि संप्रेरकी (अंतःस्रावी) संस्था. जर चेता आधीच संदेश वाहतात, शरीराला संप्रेरकांचे मंद रासायनिक दूतही का हवेत? प्रत्येक काय अधिक चांगले करते?",
        },
        choices: [
          {
            en: "Nerves send fast, precise, short-lived signals to a specific spot — ideal for instant actions like pulling a hand away; hormones travel slowly through the blood but reach the whole body and act for a long time — ideal for slow, widespread, sustained changes like growth, metabolism and puberty. The two suit different jobs, so both are needed",
            hi: "तंत्रिकाएँ तेज़, सटीक, अल्पकालिक संकेत एक विशिष्ट स्थान भेजतीं — हाथ खींचने जैसी तत्काल क्रियाओं को आदर्श; हार्मोन रक्त से धीरे चलते पर पूरे शरीर पहुँचते और लंबे समय काम करते — वृद्धि, उपापचय, यौवन जैसे धीमे, व्यापक, निरंतर परिवर्तनों को आदर्श। दोनों भिन्न कामों के अनुकूल, अतः दोनों चाहिए",
            mr: "चेता जलद, अचूक, अल्पकालिक संकेत एका विशिष्ट जागी पाठवतात — हात खेचण्यासारख्या तत्काळ क्रियांना आदर्श; संप्रेरके रक्तातून हळू चालतात पण अख्ख्या शरीरात पोहोचतात आणि दीर्घकाळ काम करतात — वाढ, चयापचय, तारुण्यासारख्या मंद, व्यापक, सातत्यपूर्ण बदलांना आदर्श. दोन्ही वेगळ्या कामांना अनुकूल, म्हणून दोन्ही हवेत",
          },
          {
            en: "The hormonal system is just a backup that does nothing unless the nerves fail",
            hi: "हार्मोनी तंत्र बस एक बैकअप जो तंत्रिकाओं के विफल होने तक कुछ नहीं करता",
            mr: "संप्रेरकी संस्था फक्त एक बॅकअप जी चेता अपयशी होईपर्यंत काही करत नाही",
          },
          {
            en: "Nerves and hormones do exactly the same thing, so having both is wasteful",
            hi: "तंत्रिकाएँ और हार्मोन ठीक एक ही काम करते, अतः दोनों होना बर्बादी",
            mr: "चेता आणि संप्रेरके नेमके एकच काम करतात, म्हणून दोन्ही असणे नासाडी",
          },
          {
            en: "Hormones are faster and more precise than nerves in every way",
            hi: "हार्मोन तंत्रिकाओं से हर तरह तेज़ और अधिक सटीक",
            mr: "संप्रेरके चेतांहून प्रत्येक प्रकारे जलद आणि अधिक अचूक",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two control systems are not rivals or duplicates; they are complementary tools suited to different kinds of jobs, and a body needs both because life poses both kinds of problem. The nervous system works by electrical impulses shooting along neurons, which gives it three defining qualities: it is fast (the message arrives in a fraction of a second), it is precise (a nerve runs to one particular muscle or spot, so the effect is exactly localised), and it is short-lived (the moment the impulses stop, so does the effect). That combination is perfect for split-second, targeted actions — snatching a hand from a flame, blinking as dust flies in, adjusting your grip. But it is wasteful and unsuited for changes that must be slow, body-wide and sustained. That is where hormones come in. An endocrine gland releases a hormone into the blood, which carries it everywhere in the body, so its reach is broad rather than pin-point; it acts more slowly, taking minutes, hours or longer; and its effect lasts as long as the hormone circulates. That makes hormones ideal for the opposite class of task: the gradual, widespread, long-running processes of the body — growth from child to adult, the sweeping changes of puberty, the day-long control of blood sugar and metabolism. You would not want a reflex to control your growth, and you could not blink using a hormone. So the body keeps both: fast, sharp, brief nerves for instant reactions, and slow, broad, lasting hormones for sustained regulation. Far from being redundant, each covers precisely the ground the other cannot, and together they let the body respond appropriately to everything from a sudden pinprick to the years-long journey of growing up.",
          hi: "दो नियंत्रण-तंत्र प्रतिद्वंद्वी या नक़ल नहीं; वे भिन्न प्रकार के कामों के अनुकूल पूरक औज़ार, और शरीर को दोनों चाहिए क्योंकि जीवन दोनों प्रकार की समस्या रखता। तंत्रिका तंत्र न्यूरॉनों पर विद्युत आवेग दौड़ाकर काम करता, जो इसे तीन परिभाषक गुण देता: यह तेज़ (संदेश सेकंड के अंश में पहुँचता), सटीक (तंत्रिका एक विशेष माँसपेशी या स्थान चलती, अतः प्रभाव ठीक स्थानीय), और अल्पकालिक (आवेग रुकते ही प्रभाव भी)। वह संयोजन क्षण-भर, लक्षित क्रियाओं को पूर्ण — आग से हाथ झटकना, धूल उड़ते पलक झपकना, पकड़ समायोजित करना। पर उन परिवर्तनों को बर्बाद और अनुपयुक्त जो धीमे, शरीर-भर और निरंतर हों। वहीं हार्मोन आते। अंतःस्रावी ग्रंथि हार्मोन रक्त में छोड़ती, जो इसे शरीर में हर जगह ले जाता, अतः पहुँच व्यापक न कि सुई-नोक; यह धीरे काम करता, मिनट, घंटे या अधिक लेते; और प्रभाव जब तक हार्मोन घूमता टिकता। वह हार्मोनों को उल्टे वर्ग के काम को आदर्श बनाता: शरीर की क्रमिक, व्यापक, लंबी प्रक्रियाएँ — बच्चे से वयस्क वृद्धि, यौवन के व्यापक परिवर्तन, रक्त-शर्करा-उपापचय का दिन-भर नियंत्रण। तुम प्रतिवर्त से अपनी वृद्धि नियंत्रित न चाहोगे, और हार्मोन से पलक न झपका सकोगे। अतः शरीर दोनों रखता: तत्काल प्रतिक्रियाओं को तेज़, तीक्ष्ण, संक्षिप्त तंत्रिकाएँ, और निरंतर नियमन को धीमे, व्यापक, टिकाऊ हार्मोन। अनावश्यक होने से दूर, हर एक ठीक वह भूमि ढकता जो दूसरा नहीं, और साथ वे शरीर को अचानक चुभन से बड़े होने की वर्षों-लंबी यात्रा तक हर चीज़ का उचित जवाब देने देते।",
          mr: "दोन नियंत्रण-संस्था प्रतिस्पर्धी वा नक्कल नाहीत; त्या वेगळ्या प्रकारच्या कामांना अनुकूल पूरक साधने, आणि शरीराला दोन्ही हव्यात कारण जीवन दोन्ही प्रकारची समस्या मांडते. चेतासंस्था चेतापेशींवर विद्युत आवेग धाववून काम करते, जे तिला तीन व्याख्यादर्शक गुण देते: ती जलद (संदेश सेकंदाच्या अंशात पोहोचतो), अचूक (चेता एका विशिष्ट स्नायू वा जागी चालते, म्हणून परिणाम नेमका स्थानिक), आणि अल्पकालिक (आवेग थांबताच परिणामही). ते संयोजन क्षणार्धाच्या, लक्ष्यित क्रियांना परिपूर्ण — आगीतून हात झटकणे, धूळ उडताना पापणी लवणे, पकड जुळवणे. पण त्या बदलांना नासाडी आणि अयोग्य जे मंद, शरीर-भर आणि सातत्यपूर्ण असावेत. तिथेच संप्रेरके येतात. अंतःस्रावी ग्रंथी संप्रेरक रक्तात सोडते, जे ते शरीरात सर्वत्र नेते, म्हणून पोहोच व्यापक न की सुई-टोक; ते हळू काम करते, मिनिटे, तास वा अधिक घेत; आणि परिणाम जोवर संप्रेरक फिरते तोवर टिकतो. ते संप्रेरकांना उलट वर्गाच्या कामाला आदर्श बनवते: शरीराच्या क्रमिक, व्यापक, दीर्घ प्रक्रिया — मुलापासून प्रौढ वाढ, तारुण्याचे व्यापक बदल, रक्त-साखर-चयापचयाचे दिवसभर नियंत्रण. तू प्रतिक्षिप्ताने आपली वाढ नियंत्रित करू इच्छिणार नाहीस, आणि संप्रेरकाने पापणी लवू शकणार नाहीस. म्हणून शरीर दोन्ही ठेवते: तत्काळ प्रतिक्रियांना जलद, तीक्ष्ण, संक्षिप्त चेता, आणि सातत्यपूर्ण नियमनाला मंद, व्यापक, टिकाऊ संप्रेरके. अनावश्यक असण्यापासून दूर, प्रत्येक नेमकी ती जमीन व्यापते जी दुसरा व्यापू शकत नाही, आणि एकत्र ती शरीराला अचानक टोचण्यापासून मोठे होण्याच्या वर्षानुवर्षांच्या प्रवासापर्यंत प्रत्येक गोष्टीला योग्य प्रतिसाद देऊ देतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — How do Organisms Reproduce?                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-reproduction",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 7 — How do Organisms Reproduce?",
      hi: "अध्याय 7 — जीव जनन कैसे करते हैं?",
      mr: "प्रकरण 7 — सजीव पुनरुत्पादन कसे करतात?",
    },
    name: {
      en: "How do Organisms Reproduce?",
      hi: "जीव जनन कैसे करते हैं?",
      mr: "सजीव पुनरुत्पादन कसे करतात?",
    },
    summary: {
      en: "How life copies itself: reproduction copying DNA with small variations, one parent cloning itself in asexual reproduction and two mixing their genes in sexual reproduction, flowers and human bodies built for the second way, and the variation that gives a species its chance against a changing world.",
      hi: "जीवन स्वयं की नक़ल कैसे बनाता: जनन DNA को छोटी विविधताओं से नक़ल करता, एक जनक अलैंगिक जनन में स्वयं का क्लोन और दो लैंगिक जनन में अपने जीन मिलाते, फूल और मानव शरीर दूसरे तरीक़े को बने, और वह विविधता जो प्रजाति को बदलती दुनिया के विरुद्ध मौक़ा देती।",
      mr: "जीवन स्वतःची नक्कल कशी बनवते: पुनरुत्पादन DNA ला लहान विविधतांसह नक्कल करते, एक पालक अलैंगिक पुनरुत्पादनात स्वतःचा क्लोन आणि दोन लैंगिक पुनरुत्पादनात आपले जनुके मिसळत, फुले आणि मानवी शरीर दुसऱ्या मार्गाला बनवलेली, आणि ती विविधता जी प्रजातीला बदलत्या जगाविरुद्ध संधी देते.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "reproduction-variation",
        name: {
          en: "Reproduction and variation",
          hi: "जनन और विविधता",
          mr: "पुनरुत्पादन आणि विविधता",
        },
        kind: "idea",
        prompt: {
          en: "Living things make new individuals of their own kind by copying their DNA, but the copying is never perfect, so small differences creep in. What twin idea does this describe?",
          hi: "जीव अपने DNA की नक़ल कर अपनी ही तरह के नए जीव बनाते, पर नक़ल कभी पूर्ण नहीं, अतः छोटे अंतर घुस आते। यह कौन-सा युग्म-विचार बताता?",
          mr: "सजीव आपल्या DNA ची नक्कल करून आपल्याच प्रकारचे नवे जीव बनवतात, पण नक्कल कधी परिपूर्ण नाही, म्हणून लहान फरक शिरतात. हे कोणते जोडी-विचार सांगते?",
        },
        statement: {
          en: "Reproduction is the making of new individuals of the same kind by copying DNA; because the copying is never perfect, small variations arise, which are the raw material of evolution.",
          hi: "जनन DNA नक़ल कर उसी तरह के नए जीव बनाना; क्योंकि नक़ल कभी पूर्ण नहीं, छोटी विविधताएँ उठतीं, जो विकास का कच्चा माल।",
          mr: "पुनरुत्पादन DNA नक्कल करून त्याच प्रकारचे नवे जीव बनवणे; कारण नक्कल कधी परिपूर्ण नाही, लहान विविधता उठतात, ज्या उत्क्रांतीचा कच्चा माल.",
        },
        detail: {
          en: "The DNA is the blueprint of the body, and copying it is the deepest event in reproduction — a new life begins as a fresh copy of that blueprint.",
          hi: "DNA शरीर का ख़ाका, और उसकी नक़ल जनन की गहनतम घटना — नया जीवन उस ख़ाके की ताज़ी नक़ल बतौर शुरू।",
          mr: "DNA शरीराचा आराखडा, आणि त्याची नक्कल पुनरुत्पादनातील सखोल घटना — नवे जीवन त्या आराखड्याची ताजी नक्कल म्हणून सुरू.",
        },
        extra: {
          en: "A little variation is useful, but a wildly wrong copy usually cannot survive — so reproduction copies carefully, allowing only small changes.",
          hi: "थोड़ी विविधता उपयोगी, पर बुरी तरह ग़लत नक़ल आमतौर पर जी नहीं सकती — अतः जनन सावधानी से नक़ल करता, केवल छोटे परिवर्तन देते।",
          mr: "थोडी विविधता उपयुक्त, पण फार चुकीची नक्कल सहसा जगू शकत नाही — म्हणून पुनरुत्पादन काळजीपूर्वक नक्कल करते, फक्त लहान बदल देत.",
        },
        pair: {
          left: {
            en: "DNA copied, with small differences creeping in",
            hi: "DNA नक़ल, छोटे अंतर घुसते",
            mr: "DNA नक्कल, लहान फरक शिरत",
          },
          right: {
            en: "reproduction and variation",
            hi: "जनन और विविधता",
            mr: "पुनरुत्पादन आणि विविधता",
          },
        },
      },
      {
        id: "asexual-reproduction",
        name: {
          en: "Asexual reproduction",
          hi: "अलैंगिक जनन",
          mr: "अलैंगिक पुनरुत्पादन",
        },
        kind: "idea",
        prompt: {
          en: "A single amoeba splits in two, a hydra sprouts a bud that grows into a copy, and a potato eye grows a whole new plant — all from one parent, all identical to it. What kind of reproduction is this?",
          hi: "एक अकेला अमीबा दो में बँटता, हाइड्रा एक कली उगाता जो नक़ल बनती, और आलू की आँख पूरा नया पौधा उगाती — सब एक जनक से, सब उसके समान। यह कौन-सा जनन है?",
          mr: "एक एकटा अमीबा दोनांत विभागतो, हायड्रा एक कळी फुटवतो जी नक्कल बनते, आणि बटाट्याचा डोळा अख्खे नवे झाड उगवतो — सारे एका पालकाकडून, सारे त्याच्यासारखे. हे कोणते पुनरुत्पादन?",
        },
        statement: {
          en: "Asexual reproduction makes offspring from a single parent, and because there is no mixing of two sets of DNA, the offspring are genetically identical to the parent — clones.",
          hi: "अलैंगिक जनन एक जनक से संतान बनाता, और क्योंकि दो DNA-समुच्चयों का मिश्रण नहीं, संतान जनक के आनुवंशिक रूप से समान — क्लोन।",
          mr: "अलैंगिक पुनरुत्पादन एका पालकाकडून संतती बनवते, आणि कारण दोन DNA-संचांचे मिश्रण नाही, संतती पालकाची आनुवंशिकदृष्ट्या समान — क्लोन.",
        },
        detail: {
          en: "It comes in many forms — binary fission in an amoeba, budding in a hydra, fragmentation in Spirogyra, and vegetative propagation from a plant's own stems, roots or leaves.",
          hi: "यह कई रूपों में — अमीबा में द्विखंडन, हाइड्रा में मुकुलन, स्पाइरोगाइरा में विखंडन, और पौधे के अपने तने, जड़ या पत्तों से कायिक प्रवर्धन।",
          mr: "हे अनेक रूपांत — अमीबात द्विखंडन, हायड्रात मुकुलन, स्पायरोगायरात खंडन, आणि झाडाच्या स्वतःच्या खोड, मूळ वा पानांतून शाकीय प्रजनन.",
        },
        extra: {
          en: "It is fast and needs no partner, so it is ideal for spreading quickly — but every offspring being a clone leaves the whole line with no variation to face change.",
          hi: "यह तेज़ और साथी नहीं चाहिए, अतः जल्दी फैलने को आदर्श — पर हर संतान क्लोन होने से पूरी वंश-रेखा को परिवर्तन झेलने कोई विविधता नहीं।",
          mr: "हे जलद आणि जोडीदार नको, म्हणून लवकर पसरायला आदर्श — पण प्रत्येक संतती क्लोन असल्याने अख्ख्या वंश-रेषेला बदल सोसायला कोणतीही विविधता नाही.",
        },
        pair: {
          left: {
            en: "One parent, offspring identical clones",
            hi: "एक जनक, संतान समान क्लोन",
            mr: "एक पालक, संतती समान क्लोन",
          },
          right: {
            en: "asexual reproduction",
            hi: "अलैंगिक जनन",
            mr: "अलैंगिक पुनरुत्पादन",
          },
        },
      },
      {
        id: "sexual-reproduction",
        name: {
          en: "Sexual reproduction",
          hi: "लैंगिक जनन",
          mr: "लैंगिक पुनरुत्पादन",
        },
        kind: "idea",
        prompt: {
          en: "Two parents each contribute a sex cell, and when these fuse the offspring gets a new mix of DNA from both, so it resembles each parent yet is exactly like neither. What kind of reproduction is this?",
          hi: "दो जनक हर एक एक लिंग-कोशिका देते, और जब ये मिलते संतान को दोनों से DNA का नया मिश्रण मिलता, अतः यह हर जनक से मिलती फिर भी किसी के ठीक समान नहीं। यह कौन-सा जनन है?",
          mr: "दोन पालक प्रत्येक एक लिंग-पेशी देतात, आणि जेव्हा ही मिळतात संततीला दोघांकडून DNA चे नवे मिश्रण मिळते, म्हणून ती प्रत्येक पालकासारखी तरी कोणासारखी नेमकी नाही. हे कोणते पुनरुत्पादन?",
        },
        statement: {
          en: "Sexual reproduction involves two parents, each contributing a gamete; the gametes fuse in fertilisation, so the offspring gets a fresh combination of DNA from both, producing rich variation.",
          hi: "लैंगिक जनन में दो जनक, हर एक एक युग्मक देता; युग्मक निषेचन में मिलते, अतः संतान को दोनों से DNA का ताज़ा संयोजन मिलता, समृद्ध विविधता बनाते।",
          mr: "लैंगिक पुनरुत्पादनात दोन पालक, प्रत्येक एक युग्मक देतो; युग्मके फलनात मिळतात, म्हणून संततीला दोघांकडून DNA चे ताजे संयोजन मिळते, समृद्ध विविधता बनवत.",
        },
        detail: {
          en: "Each gamete carries only half the DNA, so when two fuse the full amount is restored — and it is the shuffling of the two halves that makes every offspring unique.",
          hi: "हर युग्मक केवल आधा DNA ढोता, अतः दो मिलते पूरी मात्रा बहाल — और दो हिस्सों की फेंटन ही हर संतान अनूठी बनाती।",
          mr: "प्रत्येक युग्मक फक्त अर्धा DNA वाहते, म्हणून दोन मिळताच पूर्ण मात्रा पुनर्स्थापित — आणि दोन अर्ध्यांचे मिसळणेच प्रत्येक संतती अनन्य बनवते.",
        },
        extra: {
          en: "It is slower and needs two parents, but the variety it makes is a species' insurance — a mixed population is far likelier to weather a changing world.",
          hi: "यह धीमा और दो जनक चाहिए, पर जो विविधता बनाता वह प्रजाति का बीमा — मिश्रित जनसंख्या बदलती दुनिया झेलने कहीं अधिक संभावित।",
          mr: "हे मंद आणि दोन पालक हवेत, पण जी विविधता बनवते ती प्रजातीचा विमा — मिश्र लोकसंख्या बदलते जग सोसायला कितीतरी अधिक शक्य.",
        },
        pair: {
          left: {
            en: "Two parents, genes mixed, every offspring unique",
            hi: "दो जनक, जीन मिश्रित, हर संतान अनूठी",
            mr: "दोन पालक, जनुके मिश्रित, प्रत्येक संतती अनन्य",
          },
          right: {
            en: "sexual reproduction",
            hi: "लैंगिक जनन",
            mr: "लैंगिक पुनरुत्पादन",
          },
        },
      },
      {
        id: "flower-reproduction",
        name: {
          en: "Reproduction in a flower",
          hi: "फूल में जनन",
          mr: "फुलातील पुनरुत्पादन",
        },
        kind: "process",
        prompt: {
          en: "A flower is a plant's sexual organ: pollen from the male stamen must reach the female stigma, then a tube grows down to fertilise the ovule and make a seed. What are these two steps called?",
          hi: "फूल पौधे का लैंगिक अंग: नर पुंकेसर से पराग को मादा वर्तिकाग्र तक पहुँचना, फिर एक नली नीचे बढ़ बीजांड निषेचित कर बीज बनाती। इन दो चरणों को क्या कहते?",
          mr: "फूल झाडाचा लैंगिक अवयव: नर पुंकेसरातील पराग मादी कुक्षीपर्यंत पोहोचावा, मग एक नळी खाली वाढून बीजांड फलित करून बी बनवते. या दोन पायऱ्यांना काय म्हणतात?",
        },
        statement: {
          en: "In a flower, pollination carries pollen from the stamen to the stigma, and fertilisation follows when the male gamete travels down a pollen tube to fuse with the egg in the ovule, forming a seed.",
          hi: "फूल में परागण पराग को पुंकेसर से वर्तिकाग्र तक ले जाता, और निषेचन तब जब नर युग्मक पराग-नली से नीचे चल बीजांड में अंड से मिलता, बीज बनाते।",
          mr: "फुलात परागण परागाला पुंकेसरातून कुक्षीपर्यंत नेते, आणि फलन तेव्हा जेव्हा नर युग्मक पराग-नळीतून खाली चालून बीजांडातील अंड्याशी मिळते, बी बनवत.",
        },
        detail: {
          en: "Pollination can be carried out by wind, water or animals — a bee dusted with pollen from one flower ferries it to the next as it drinks nectar.",
          hi: "परागण हवा, पानी या पशुओं से हो सकता — एक फूल के पराग से सना मधुमक्खी इसे अगले तक ढोती जब वह रस पीती।",
          mr: "परागण वारा, पाणी वा प्राण्यांनी होऊ शकते — एका फुलाच्या परागाने माखलेली मधमाशी ते पुढच्यापर्यंत वाहते जेव्हा ती मध पिते.",
        },
        extra: {
          en: "After fertilisation the ovule becomes the seed and the ovary swells into the fruit around it — which is why a fruit carries the seeds inside.",
          hi: "निषेचन बाद बीजांड बीज बनता और अंडाशय उसके चारों ओर फल में फूलता — इसी से फल भीतर बीज ढोता।",
          mr: "फलनानंतर बीजांड बी बनते आणि अंडाशय त्याभोवती फळात फुगते — म्हणूनच फळ आत बिया वाहते.",
        },
        pair: {
          left: {
            en: "Pollen reaches the stigma, then the egg is fertilised",
            hi: "पराग वर्तिकाग्र पहुँचे, फिर अंड निषेचित",
            mr: "पराग कुक्षीला पोहोचे, मग अंडे फलित",
          },
          right: {
            en: "pollination and fertilisation",
            hi: "परागण और निषेचन",
            mr: "परागण आणि फलन",
          },
        },
      },
      {
        id: "human-reproduction",
        name: {
          en: "Human reproduction",
          hi: "मानव जनन",
          mr: "मानवी पुनरुत्पादन",
        },
        kind: "process",
        prompt: {
          en: "In humans a sperm from the father fertilises an egg from the mother, and the resulting cell grows, protected inside the mother, into a baby over about nine months. What life process is this?",
          hi: "मनुष्यों में पिता का शुक्राणु माता के अंड को निषेचित करता, और बनी कोशिका, माता के भीतर रक्षित, लगभग नौ महीनों में शिशु में बढ़ती। यह कौन-सा जैव-प्रक्रम है?",
          mr: "मनुष्यांत वडिलांचा शुक्राणू आईच्या अंड्याला फलित करतो, आणि बनलेली पेशी, आईच्या आत रक्षित, सुमारे नऊ महिन्यांत बाळात वाढते. ही कोणती जीवन-प्रक्रिया?",
        },
        statement: {
          en: "Human reproduction is sexual: a sperm made in the father's testes fertilises an egg made in the mother's ovary, and the fertilised egg develops in the mother's uterus into a baby over about nine months.",
          hi: "मानव जनन लैंगिक: पिता के वृषण में बना शुक्राणु माता के अंडाशय में बने अंड को निषेचित करता, और निषेचित अंड माता के गर्भाशय में लगभग नौ महीनों में शिशु में विकसित।",
          mr: "मानवी पुनरुत्पादन लैंगिक: वडिलांच्या वृषणात बनलेला शुक्राणू आईच्या अंडाशयात बनलेल्या अंड्याला फलित करतो, आणि फलित अंडे आईच्या गर्भाशयात सुमारे नऊ महिन्यांत बाळात विकसित.",
        },
        detail: {
          en: "The developing baby is fed and given oxygen through the placenta, a special organ that links its blood supply to the mother's without the two mixing.",
          hi: "विकसित होता शिशु अपरा से पाला और ऑक्सीजन पाता, एक विशेष अंग जो उसकी रक्त-आपूर्ति को माता की से बिना दोनों मिले जोड़ता।",
          mr: "विकसित होणारे बाळ वारेतून पोसले आणि ऑक्सिजन मिळवते, एक विशेष अवयव जो त्याचा रक्त-पुरवठा आईच्याशी दोन्ही न मिसळता जोडतो.",
        },
        extra: {
          en: "The onset of these abilities at puberty is driven by hormones, which also bring the bodily changes that mark the move from child to adult.",
          hi: "यौवन पर इन क्षमताओं का आरंभ हार्मोनों से चालित, जो बच्चे से वयस्क की ओर बढ़त चिह्नित करते शारीरिक परिवर्तन भी लाते।",
          mr: "तारुण्यात या क्षमतांचा आरंभ संप्रेरकांनी चालित, जे मुलापासून प्रौढाकडे वाटचाल चिन्हांकित करणारे शारीरिक बदलही आणतात.",
        },
        pair: {
          left: {
            en: "Sperm fertilises egg, baby grows in the uterus",
            hi: "शुक्राणु अंड निषेचित, शिशु गर्भाशय में बढ़े",
            mr: "शुक्राणू अंडे फलित, बाळ गर्भाशयात वाढे",
          },
          right: {
            en: "human reproduction",
            hi: "मानव जनन",
            mr: "मानवी पुनरुत्पादन",
          },
        },
      },
      {
        id: "reproductive-health",
        name: {
          en: "Reproductive health",
          hi: "जनन स्वास्थ्य",
          mr: "पुनरुत्पादन आरोग्य",
        },
        kind: "idea",
        prompt: {
          en: "Choosing whether and when to have children, spacing births, and guarding against infections spread by physical intimacy are all part of keeping the reproductive system well. What is this whole concern called?",
          hi: "बच्चे हों या न हों और कब, जन्मों में अंतर, और शारीरिक निकटता से फैलते संक्रमणों से बचाव सब जनन-तंत्र को स्वस्थ रखने का भाग। इस पूरी चिंता को क्या कहते?",
          mr: "मुले व्हावीत की नाही आणि केव्हा, जन्मांत अंतर, आणि शारीरिक जवळिकीने पसरणाऱ्या संसर्गांपासून रक्षण सारे पुनरुत्पादन-संस्था निरोगी ठेवण्याचा भाग. या अख्ख्या चिंतेला काय म्हणतात?",
        },
        statement: {
          en: "Reproductive health is the well-being of the reproductive system, including family planning to choose and space children, and protection against sexually transmitted infections.",
          hi: "जनन स्वास्थ्य जनन-तंत्र का कल्याण, बच्चे चुनने-अंतर देने का परिवार नियोजन और यौन-संचारित संक्रमणों से रक्षा सहित।",
          mr: "पुनरुत्पादन आरोग्य पुनरुत्पादन-संस्थेचे कल्याण, मुले निवडायला-अंतर द्यायला कुटुंब नियोजन आणि लैंगिक-संक्रमित संसर्गांपासून रक्षणासह.",
        },
        detail: {
          en: "Various contraceptive methods let a couple decide when to have children and space them for the health of mother and child alike.",
          hi: "विविध गर्भनिरोधक तरीक़े दंपती को तय करने देते कब बच्चे हों और उन्हें माता-शिशु दोनों के स्वास्थ्य को अंतर देना।",
          mr: "विविध गर्भनिरोधक पद्धती जोडप्याला ठरवू देतात केव्हा मुले व्हावीत आणि त्यांना आई-बाळ दोघांच्या आरोग्यासाठी अंतर द्यावे.",
        },
        extra: {
          en: "It also means fighting the social evil of choosing a child's sex before birth, which has skewed the ratio of girls to boys in many places.",
          hi: "इसका अर्थ जन्म से पहले बच्चे का लिंग चुनने की सामाजिक बुराई से लड़ना भी, जिसने कई जगह लड़कियों-लड़कों का अनुपात बिगाड़ा।",
          mr: "याचा अर्थ जन्माआधी बाळाचे लिंग निवडण्याच्या सामाजिक दुष्कृत्याशी लढणेही, ज्याने अनेक ठिकाणी मुली-मुलांचे प्रमाण बिघडवले.",
        },
        pair: {
          left: {
            en: "Family planning and protection from infection",
            hi: "परिवार नियोजन और संक्रमण से रक्षा",
            mr: "कुटुंब नियोजन आणि संसर्गापासून रक्षण",
          },
          right: {
            en: "reproductive health",
            hi: "जनन स्वास्थ्य",
            mr: "पुनरुत्पादन आरोग्य",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The offspring of an amoeba (which reproduces asexually) are exact copies of the parent, but the children of two human parents (who reproduce sexually) all differ from their parents and from each other. What causes this difference between the two modes of reproduction?",
          hi: "अमीबा (जो अलैंगिक जनन करता) की संतान जनक की ठीक नक़ल, पर दो मानव जनकों (जो लैंगिक जनन करते) के बच्चे सब अपने जनकों से और एक-दूसरे से भिन्न। जनन के दो तरीक़ों के बीच इस अंतर का कारण क्या?",
          mr: "अमीबाची (जो अलैंगिक पुनरुत्पादन करतो) संतती पालकाची नेमकी नक्कल, पण दोन मानवी पालकांची (जे लैंगिक पुनरुत्पादन करतात) मुले सारी आपल्या पालकांहून आणि एकमेकांहून वेगळी. पुनरुत्पादनाच्या दोन मार्गांतील या फरकाचे कारण काय?",
        },
        choices: [
          {
            en: "In asexual reproduction one parent simply copies its own DNA, so the offspring is a genetic clone; in sexual reproduction each of two parents contributes half its DNA and the halves combine in a new mix, so every child gets a fresh, unique combination and differs from both parents and from its siblings",
            hi: "अलैंगिक जनन में एक जनक बस अपना DNA नक़ल करता, अतः संतान आनुवंशिक क्लोन; लैंगिक जनन में दो जनकों में हर एक अपना आधा DNA देता और आधे नए मिश्रण में जुड़ते, अतः हर बच्चा ताज़ा, अनूठा संयोजन पाता और दोनों जनकों से और भाई-बहनों से भिन्न",
            mr: "अलैंगिक पुनरुत्पादनात एक पालक फक्त आपले DNA नक्कल करतो, म्हणून संतती आनुवंशिक क्लोन; लैंगिक पुनरुत्पादनात दोन पालकांतील प्रत्येक आपले अर्धे DNA देतो आणि अर्धे नव्या मिश्रणात जुळतात, म्हणून प्रत्येक मूल ताजे, अनन्य संयोजन मिळवते आणि दोन्ही पालकांहून आणि भावंडांहून वेगळे",
          },
          {
            en: "Amoebae have no DNA, so their offspring cannot vary",
            hi: "अमीबा में कोई DNA नहीं, अतः उनकी संतान भिन्न नहीं हो सकती",
            mr: "अमीबात कोणतेही DNA नाही, म्हणून त्यांची संतती वेगळी होऊ शकत नाही",
          },
          {
            en: "Human children differ only because they are fed differently after birth",
            hi: "मानव बच्चे केवल इसलिए भिन्न क्योंकि जन्म बाद उन्हें अलग खिलाया",
            mr: "मानवी मुले फक्त म्हणून वेगळी कारण जन्मानंतर त्यांना वेगळे खाऊ घातले",
          },
          {
            en: "Asexual reproduction mixes DNA from two parents and sexual reproduction copies one",
            hi: "अलैंगिक जनन दो जनकों का DNA मिलाता और लैंगिक जनन एक की नक़ल करता",
            mr: "अलैंगिक पुनरुत्पादन दोन पालकांचे DNA मिसळते आणि लैंगिक पुनरुत्पादन एकाची नक्कल करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The difference in variation comes straight from the difference in how the DNA is passed on. When an amoeba reproduces asexually, there is only one parent and only one set of DNA involved: the amoeba simply copies its own DNA and splits, handing each daughter cell a duplicate of exactly the same genetic instructions. With no second set to mix in, the offspring are genetic clones — identical to the parent and to each other, apart from the rare copying error. Sexual reproduction works on a completely different principle. Here two parents are involved, and each contributes not a full copy of its DNA but a gamete carrying only half. When a sperm and an egg fuse in fertilisation, the two halves combine to restore a full set — but it is a new combination, half from the father and half from the mother, shuffled together in a way that has never existed before. Because which half of each parent's DNA ends up in any given gamete is itself variable, every sperm and every egg is different, and so every child is a fresh mix — resembling each parent in some features but identical to neither, and different from every brother and sister too. That is why sexual reproduction is a machine for generating variety while asexual reproduction produces sameness. (Watch the traps: amoebae certainly do have DNA — that is what they copy; the differences among human children are genetic, present from the fertilised egg, not caused by later feeding; and the last option simply reverses the two modes.) This variety is not a mere curiosity: it is the raw material on which natural selection works, and it is why sexually reproducing species carry a built-in advantage in facing a changing world.",
          hi: "विविधता का अंतर सीधे इससे कि DNA कैसे सौंपा जाता। जब अमीबा अलैंगिक जनन करता, केवल एक जनक और केवल एक DNA-समुच्चय शामिल: अमीबा बस अपना DNA नक़ल कर बँटता, हर पुत्री-कोशिका को ठीक उन्हीं आनुवंशिक निर्देशों की प्रतिलिपि देते। मिलाने कोई दूसरा समुच्चय न होने से, संतान आनुवंशिक क्लोन — जनक और एक-दूसरे के समान, दुर्लभ नक़ल-त्रुटि छोड़। लैंगिक जनन बिलकुल भिन्न सिद्धांत पर। यहाँ दो जनक शामिल, और हर एक अपने DNA की पूरी नक़ल नहीं बल्कि केवल आधा ढोता युग्मक देता। जब शुक्राणु-अंड निषेचन में मिलते, दो आधे जुड़कर पूरा समुच्चय बहाल — पर यह नया संयोजन, आधा पिता आधा माता से, ऐसे फेंटा जो पहले कभी न रहा। क्योंकि हर जनक के DNA का कौन-सा आधा किसी युग्मक में जाता स्वयं परिवर्ती, हर शुक्राणु-अंड भिन्न, अतः हर बच्चा ताज़ा मिश्रण — हर जनक से कुछ गुणों में मिलता पर किसी के समान नहीं, हर भाई-बहन से भी भिन्न। इसी से लैंगिक जनन विविधता बनाने की मशीन जबकि अलैंगिक समानता बनाता। (जाल देखो: अमीबा में निश्चय DNA है — वही नक़ल करता; मानव बच्चों के अंतर आनुवंशिक, निषेचित अंड से मौजूद, बाद के खिलाने से नहीं; और अंतिम विकल्प बस दो तरीक़े उल्टे करता।) यह विविधता महज़ कौतूहल नहीं: यह वह कच्चा माल जिस पर प्राकृतिक चयन काम करता, और क्यों लैंगिक जनन करती प्रजातियाँ बदलती दुनिया झेलने अंतर्निहित लाभ ढोतीं।",
          mr: "विविधतेतील फरक थेट यातून की DNA कसे सोपवले जाते. जेव्हा अमीबा अलैंगिक पुनरुत्पादन करतो, फक्त एक पालक आणि फक्त एक DNA-संच सामील: अमीबा फक्त आपले DNA नक्कल करून विभागतो, प्रत्येक कन्या-पेशीला नेमक्या त्याच आनुवंशिक सूचनांची प्रत देत. मिसळायला दुसरा संच नसल्याने, संतती आनुवंशिक क्लोन — पालक आणि एकमेकांसारखी, दुर्मिळ नक्कल-चुकीखेरीज. लैंगिक पुनरुत्पादन अगदी वेगळ्या तत्त्वावर. इथे दोन पालक सामील, आणि प्रत्येक आपल्या DNA ची पूर्ण नक्कल नव्हे तर फक्त अर्धे वाहणारे युग्मक देतो. जेव्हा शुक्राणू-अंडे फलनात मिळतात, दोन अर्धे जुळून पूर्ण संच पुनर्स्थापित — पण ते नवे संयोजन, अर्धे वडिलांकडून अर्धे आईकडून, असे मिसळलेले जे आधी कधी नव्हते. कारण प्रत्येक पालकाच्या DNA चा कोणता अर्धा कोणत्या युग्मकात जातो हेच परिवर्ती, प्रत्येक शुक्राणू-अंडे वेगळे, म्हणून प्रत्येक मूल ताजे मिश्रण — प्रत्येक पालकासारखे काही गुणांत पण कोणासारखे नेमके नाही, प्रत्येक भावंडाहूनही वेगळे. म्हणूनच लैंगिक पुनरुत्पादन विविधता निर्माण करण्याचे यंत्र तर अलैंगिक सारखेपणा बनवते. (सापळे पाहा: अमीबात नक्कीच DNA आहे — तेच नक्कल करतो; मानवी मुलांतील फरक आनुवंशिक, फलित अंड्यापासून उपस्थित, नंतरच्या खाऊ घालण्याने नाही; आणि शेवटचा पर्याय फक्त दोन मार्ग उलट करतो.) ही विविधता केवळ कुतूहल नाही: तो कच्चा माल ज्यावर नैसर्गिक निवड काम करते, आणि का लैंगिक पुनरुत्पादन करणाऱ्या प्रजाती बदलते जग सोसायला अंगभूत फायदा वाहतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "If asexual reproduction is faster, needs no partner, and reliably copies a well-adapted parent, why has sexual reproduction — slower and needing two parents — become so widespread among plants and animals? What advantage makes the extra trouble worth it?",
          hi: "यदि अलैंगिक जनन तेज़, साथी नहीं चाहिए, और सुव्यवस्थित जनक की भरोसेमंद नक़ल करता, तो लैंगिक जनन — धीमा और दो जनक चाहिए — पौधों-पशुओं में इतना व्यापक क्यों हुआ? कौन-सा लाभ अतिरिक्त परेशानी को योग्य बनाता?",
          mr: "जर अलैंगिक पुनरुत्पादन जलद, जोडीदार नको, आणि सुजुळलेल्या पालकाची भरवशाची नक्कल करते, तर लैंगिक पुनरुत्पादन — मंद आणि दोन पालक हवेत — झाडे-प्राण्यांत इतके व्यापक का झाले? कोणता फायदा जादा त्रासाला पात्र बनवतो?",
        },
        choices: [
          {
            en: "The variation it creates. Sexual reproduction mixes two parents' DNA so offspring differ from one another; in a population facing a changing environment, disease or new threats, this variety means some individuals are likely to have traits that let them survive and reproduce — so the species as a whole is far more able to adapt and endure than a uniform line of clones",
            hi: "जो विविधता यह बनाता। लैंगिक जनन दो जनकों का DNA मिलाता अतः संतान एक-दूसरे से भिन्न; बदलते परिवेश, रोग या नए ख़तरे झेलती जनसंख्या में यह विविधता यानी कुछ व्यक्तियों में संभवतः ऐसे गुण जो उन्हें जीने-जनने दें — अतः प्रजाति समग्र क्लोनों की एकरूप रेखा से कहीं अधिक अनुकूलन और टिकने योग्य",
            mr: "जी विविधता ते बनवते. लैंगिक पुनरुत्पादन दोन पालकांचे DNA मिसळते म्हणून संतती एकमेकांहून वेगळी; बदलते परिसर, रोग वा नवे धोके सोसणाऱ्या लोकसंख्येत ही विविधता म्हणजे काही व्यक्तींत कदाचित असे गुण जे त्यांना जगू-जन्मवू देतात — म्हणून प्रजाती समग्र क्लोनांच्या एकसमान रेषेहून कितीतरी अधिक जुळवून घेण्या-टिकण्याजोगी",
          },
          {
            en: "Sexual reproduction is actually faster than asexual reproduction in every case",
            hi: "लैंगिक जनन वास्तव में हर मामले में अलैंगिक से तेज़",
            mr: "लैंगिक पुनरुत्पादन खरे तर प्रत्येक बाबतीत अलैंगिकहून जलद",
          },
          {
            en: "There is no advantage; sexual reproduction spread purely by chance",
            hi: "कोई लाभ नहीं; लैंगिक जनन विशुद्ध संयोग से फैला",
            mr: "कोणताही फायदा नाही; लैंगिक पुनरुत्पादन विशुद्ध योगायोगाने पसरले",
          },
          {
            en: "Sexual reproduction avoids using DNA, which makes offspring healthier",
            hi: "लैंगिक जनन DNA वापरने से बचता, जो संतान को स्वस्थ बनाता",
            mr: "लैंगिक पुनरुत्पादन DNA वापरणे टाळते, जे संततीला निरोगी बनवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "On the face of it asexual reproduction looks like the better deal — quicker, no need to find a mate, and it faithfully reproduces a parent that has already proved it can survive. And indeed, when conditions are stable and favourable, cloning yourself is an excellent strategy. The catch is that conditions do not stay stable. Climates shift, new diseases appear, food sources fail, predators arrive. A population of identical clones has a fatal weakness against such change: if the environment turns against their single shared design, it turns against all of them at once, and the whole line can be wiped out, because not one of them carries anything different that might cope. This is exactly the gap sexual reproduction fills. By mixing the DNA of two parents into a fresh combination in every offspring, it produces a population whose members are all slightly different from one another. When hard times come, that variety is a hedge: out of many different individuals, some are likely, purely by the luck of their particular combination, to possess traits — resistance to the new disease, tolerance of the drought, a use for the new food — that let them survive and reproduce when others cannot. Those survivors then carry the species forward. So the advantage of sexual reproduction is not speed or convenience, which it lacks, but resilience: variation is a kind of insurance policy, spreading a species' bets across many different designs so that a changing world cannot destroy all of them at a single stroke. Over long stretches of evolutionary time, that ability to adapt and endure outweighs the extra cost of needing two parents and going slower — which is why sexual reproduction, despite its inconveniences, has become the dominant way of reproducing across the plant and animal kingdoms.",
          hi: "ऊपरी तौर अलैंगिक जनन बेहतर सौदा दिखता — तेज़, साथी खोजने की ज़रूरत नहीं, और जनक जो जीना सिद्ध कर चुका उसकी वफ़ादार नक़ल। और सचमुच, जब दशाएँ स्थिर-अनुकूल, स्वयं का क्लोन बनाना उत्तम रणनीति। पकड़ यह कि दशाएँ स्थिर नहीं रहतीं। जलवायु बदलती, नए रोग आते, भोजन-स्रोत बिगड़ते, शिकारी आते। समान क्लोनों की जनसंख्या की ऐसे परिवर्तन के विरुद्ध घातक कमज़ोरी: यदि परिवेश उनके एकल साझा डिज़ाइन के विरुद्ध हो, वह सबके विरुद्ध एक साथ, और पूरी रेखा मिट सकती, क्योंकि उनमें से एक भी कुछ भिन्न नहीं ढोता जो निपट सके। ठीक यही खाई लैंगिक जनन भरता। दो जनकों का DNA हर संतान में ताज़ा संयोजन में मिलाकर, यह ऐसी जनसंख्या बनाता जिसके सदस्य सब एक-दूसरे से थोड़े भिन्न। जब कठिन समय आता, वह विविधता एक बचाव: कई भिन्न व्यक्तियों में से कुछ संभवतः, विशुद्ध अपने विशेष संयोजन के भाग्य से, ऐसे गुण रखते — नए रोग का प्रतिरोध, सूखे की सहनशीलता, नए भोजन का उपयोग — जो उन्हें जीने-जनने दें जब अन्य न सकें। वे उत्तरजीवी फिर प्रजाति आगे ढोते। अतः लैंगिक जनन का लाभ गति या सुविधा नहीं, जो इसमें नहीं, बल्कि लचीलापन: विविधता एक बीमा-पॉलिसी, प्रजाति के दाँव कई भिन्न डिज़ाइनों में फैलाते ताकि बदलती दुनिया एक ही वार में सबको नष्ट न कर सके। विकास के लंबे खंडों में, वह अनुकूलन-टिकने की क्षमता दो जनक चाहिए और धीमा होने की अतिरिक्त लागत से भारी — इसी से लैंगिक जनन, अपनी असुविधाओं के बावजूद, पादप-पशु जगत भर जनन का प्रमुख तरीक़ा बना।",
          mr: "वरवर पाहता अलैंगिक पुनरुत्पादन उत्तम सौदा दिसते — जलद, जोडीदार शोधण्याची गरज नाही, आणि जो पालक जगणे सिद्ध करून चुकला त्याची प्रामाणिक नक्कल. आणि खरोखर, जेव्हा परिस्थिती स्थिर-अनुकूल, स्वतःचा क्लोन बनवणे उत्तम रणनीती. पकड ही की परिस्थिती स्थिर राहत नाही. हवामान बदलते, नवे रोग येतात, अन्न-स्रोत बुडतात, भक्षक येतात. समान क्लोनांच्या लोकसंख्येची अशा बदलाविरुद्ध घातक कमजोरी: जर परिसर त्यांच्या एकल सामायिक रचनेविरुद्ध झाला, तो सर्वांविरुद्ध एकाच वेळी, आणि अख्खी रेषा पुसली जाऊ शकते, कारण त्यांतले एकही काही वेगळे वाहत नाही जे निभावू शकेल. नेमकी हीच दरी लैंगिक पुनरुत्पादन भरते. दोन पालकांचे DNA प्रत्येक संततीत ताज्या संयोजनात मिसळून, ते अशी लोकसंख्या बनवते जिचे सदस्य सारे एकमेकांहून थोडे वेगळे. जेव्हा कठीण काळ येतो, ती विविधता एक बचाव: अनेक वेगळ्या व्यक्तींतून काही कदाचित, विशुद्ध आपल्या विशिष्ट संयोजनाच्या नशिबाने, असे गुण बाळगतात — नव्या रोगाचा प्रतिकार, दुष्काळाची सहनशीलता, नव्या अन्नाचा उपयोग — जे त्यांना जगू-जन्मवू देतात जेव्हा इतर करू शकत नाहीत. ते वाचलेले मग प्रजाती पुढे वाहतात. म्हणून लैंगिक पुनरुत्पादनाचा फायदा वेग वा सोय नाही, जी त्यात नाही, तर लवचिकता: विविधता एक विमा-पॉलिसी, प्रजातीच्या पैजा अनेक वेगळ्या रचनांत पसरवत जेणेकरून बदलते जग एकाच फटक्यात सर्वांना नष्ट करू शकत नाही. उत्क्रांतीच्या दीर्घ टप्प्यांत, ती जुळवून घेण्या-टिकण्याची क्षमता दोन पालक हवेत आणि मंद होण्याच्या जादा खर्चाहून भारी — म्हणूनच लैंगिक पुनरुत्पादन, आपल्या गैरसोयींनंतरही, वनस्पती-प्राणी जगतभर पुनरुत्पादनाचा प्रमुख मार्ग बनला.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Heredity                                                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-heredity",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 8 — Heredity",
      hi: "अध्याय 8 — आनुवंशिकता",
      mr: "प्रकरण 8 — आनुवंशिकता",
    },
    name: {
      en: "Heredity",
      hi: "आनुवंशिकता",
      mr: "आनुवंशिकता",
    },
    summary: {
      en: "How traits pass down the generations: genes carrying characters from parent to child, alleles that dominate or hide, Mendel's neat 3:1 ratio, the split between the genes you carry and the traits you show, and the chromosomes that quietly decide a child's sex.",
      hi: "गुण पीढ़ियों में कैसे उतरते: जनक से बच्चे को गुण ढोते जीन, हावी होते या छिपते युग्मविकल्पी, मेंडल का सुथरा 3:1 अनुपात, तुम जो जीन ढोते और जो गुण दिखाते के बीच बँटवारा, और चुपचाप बच्चे का लिंग तय करते गुणसूत्र।",
      mr: "गुण पिढ्यांत कसे उतरतात: पालकाकडून मुलाला गुण वाहणारी जनुके, वर्चस्व गाजवणारे वा लपणारे युग्मविकल्पी, मेंडेलचे नीटस 3:1 प्रमाण, तू जी जनुके वाहतोस आणि जे गुण दाखवतोस यांतील विभागणी, आणि गुपचूप मुलाचे लिंग ठरवणारी गुणसूत्रे.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "heredity-genes",
        name: {
          en: "Heredity and genes",
          hi: "आनुवंशिकता और जीन",
          mr: "आनुवंशिकता आणि जनुके",
        },
        kind: "idea",
        prompt: {
          en: "A child has its mother's eyes and its father's nose because units of inheritance passed down in the sex cells carry those characters. What is this passing of traits from parents to offspring, and what units carry it?",
          hi: "बच्चे के माता की आँखें और पिता की नाक क्योंकि लिंग-कोशिकाओं में उतरी वंशागति-इकाइयाँ वे गुण ढोतीं। जनकों से संतान को गुणों का यह उतरना, और कौन-सी इकाइयाँ इसे ढोतीं?",
          mr: "मुलाला आईचे डोळे आणि वडिलांचे नाक कारण लिंग-पेशींत उतरलेली वंशागत-एकके ते गुण वाहतात. पालकांकडून संततीला गुणांचे हे उतरणे, आणि कोणती एकके ते वाहतात?",
        },
        statement: {
          en: "Heredity is the passing of traits from parents to offspring, carried by genes — units of DNA on chromosomes, one set inherited from each parent.",
          hi: "आनुवंशिकता जनकों से संतान को गुणों का उतरना, जीनों द्वारा ढोया — गुणसूत्रों पर DNA की इकाइयाँ, हर जनक से एक समुच्चय वंशागत।",
          mr: "आनुवंशिकता पालकांकडून संततीला गुणांचे उतरणे, जनुकांनी वाहिलेले — गुणसूत्रांवरील DNA ची एकके, प्रत्येक पालकाकडून एक संच वंशागत.",
        },
        detail: {
          en: "Each child gets a full pair of every gene — one copy from the mother's egg and one from the father's sperm — so it inherits from both.",
          hi: "हर बच्चा हर जीन की पूरी जोड़ी पाता — एक प्रति माता के अंड से और एक पिता के शुक्राणु से — अतः दोनों से वंशागत।",
          mr: "प्रत्येक मूल प्रत्येक जनुकाची पूर्ण जोडी मिळवते — एक प्रत आईच्या अंड्यातून आणि एक वडिलांच्या शुक्राणूतून — म्हणून दोघांकडून वंशागत.",
        },
        extra: {
          en: "The rules of how these genes combine and reappear were first worked out by Gregor Mendel, breeding thousands of pea plants in a monastery garden.",
          hi: "ये जीन कैसे जुड़ते और फिर प्रकट होते उसके नियम पहले ग्रेगर मेंडल ने खोजे, एक मठ-बग़ीचे में हज़ारों मटर पौधे उगाते।",
          mr: "ही जनुके कशी जुळतात आणि पुन्हा प्रकट होतात त्याचे नियम प्रथम ग्रेगर मेंडेलने शोधले, एका मठ-बागेत हजारो वाटाणा झाडे उगवत.",
        },
        pair: {
          left: {
            en: "Traits passed on by units of DNA",
            hi: "DNA की इकाइयों से उतरते गुण",
            mr: "DNA च्या एककांनी उतरणारे गुण",
          },
          right: {
            en: "heredity and genes",
            hi: "आनुवंशिकता और जीन",
            mr: "आनुवंशिकता आणि जनुके",
          },
        },
      },
      {
        id: "dominant-recessive",
        name: {
          en: "Dominant and recessive alleles",
          hi: "प्रभावी और अप्रभावी युग्मविकल्पी",
          mr: "प्रभावी आणि अप्रभावी युग्मविकल्पी",
        },
        kind: "idea",
        prompt: {
          en: "A gene can come in two versions, and when a plant carries one of each, only one version shows in the plant while the other stays hidden. What are these two kinds of gene version called?",
          hi: "एक जीन दो रूपों में आ सकता, और जब पौधा हर एक की एक प्रति ढोता, केवल एक रूप पौधे में दिखता जबकि दूसरा छिपा रहता। जीन-रूप के इन दो प्रकारों को क्या कहते?",
          mr: "एक जनुक दोन रूपांत येऊ शकते, आणि जेव्हा झाड प्रत्येकाची एक प्रत वाहते, फक्त एक रूप झाडात दिसते तर दुसरे लपून राहते. जनुक-रूपाच्या या दोन प्रकारांना काय म्हणतात?",
        },
        statement: {
          en: "Alleles are alternative versions of a gene; a dominant allele shows its effect even when only one copy is present, while a recessive allele shows only when both copies are recessive.",
          hi: "युग्मविकल्पी जीन के वैकल्पिक रूप; प्रभावी युग्मविकल्पी केवल एक प्रति होने पर भी प्रभाव दिखाता, जबकि अप्रभावी केवल तब दिखता जब दोनों प्रतियाँ अप्रभावी।",
          mr: "युग्मविकल्पी जनुकाची पर्यायी रूपे; प्रभावी युग्मविकल्पी फक्त एक प्रत असतानाही परिणाम दाखवतो, तर अप्रभावी फक्त तेव्हा दिसतो जेव्हा दोन्ही प्रती अप्रभावी.",
        },
        detail: {
          en: "So an organism carrying one dominant and one recessive allele looks just like one carrying two dominants — the recessive is present but masked.",
          hi: "अतः एक प्रभावी और एक अप्रभावी युग्मविकल्पी ढोता जीव ठीक दो प्रभावी ढोते जैसा दिखता — अप्रभावी मौजूद पर ढका।",
          mr: "म्हणून एक प्रभावी आणि एक अप्रभावी युग्मविकल्पी वाहणारा जीव नेमका दोन प्रभावी वाहणाऱ्यासारखा दिसतो — अप्रभावी उपस्थित पण झाकलेला.",
        },
        extra: {
          en: "The hidden recessive is not lost — it can be passed to the next generation and reappear when it meets another recessive copy.",
          hi: "छिपा अप्रभावी लुप्त नहीं — यह अगली पीढ़ी को दिया जा सकता और दूसरी अप्रभावी प्रति मिलने पर फिर प्रकट।",
          mr: "लपलेला अप्रभावी हरवत नाही — तो पुढच्या पिढीला देता येतो आणि दुसरी अप्रभावी प्रत भेटल्यावर पुन्हा प्रकट.",
        },
        pair: {
          left: {
            en: "One shows with a single copy, the other only with two",
            hi: "एक एकल प्रति से दिखे, दूसरा केवल दो से",
            mr: "एक एकल प्रतीने दिसे, दुसरा फक्त दोनने",
          },
          right: {
            en: "dominant and recessive alleles",
            hi: "प्रभावी और अप्रभावी युग्मविकल्पी",
            mr: "प्रभावी आणि अप्रभावी युग्मविकल्पी",
          },
        },
      },
      {
        id: "mendel-ratio",
        name: {
          en: "Mendel's monohybrid ratio",
          hi: "मेंडल का एकसंकर अनुपात",
          mr: "मेंडेलचे एकसंकर प्रमाण",
        },
        kind: "idea",
        prompt: {
          en: "Cross a tall pea plant with a short one and all the first-generation plants are tall; let those breed and the short trait returns in a quarter of the next generation. What famous ratio of tall to short does this give?",
          hi: "लंबे मटर पौधे को छोटे से संकरित करो और पहली पीढ़ी के सब पौधे लंबे; उन्हें प्रजनित करने दो और अगली पीढ़ी के एक-चौथाई में छोटा गुण लौटता। लंबे-से-छोटे का यह प्रसिद्ध अनुपात क्या देता?",
          mr: "उंच वाटाणा झाड आखूडशी संकरित करा आणि पहिल्या पिढीतील सारी झाडे उंच; त्यांना प्रजनन करू द्या आणि पुढच्या पिढीतील एक-चतुर्थांशात आखूड गुण परततो. उंच-ते-आखूडचे हे प्रसिद्ध प्रमाण काय देते?",
        },
        statement: {
          en: "Mendel's monohybrid cross gives a 3:1 ratio in the second generation — three showing the dominant trait to one showing the recessive — because the recessive allele, hidden in the first generation, reappears when two recessive copies meet.",
          hi: "मेंडल का एकसंकर संकरण दूसरी पीढ़ी में 3:1 अनुपात देता — तीन प्रभावी गुण दिखाते एक अप्रभावी को — क्योंकि पहली पीढ़ी में छिपा अप्रभावी युग्मविकल्पी दो अप्रभावी प्रतियाँ मिलने पर फिर प्रकट।",
          mr: "मेंडेलचे एकसंकर संकरण दुसऱ्या पिढीत 3:1 प्रमाण देते — तीन प्रभावी गुण दाखवणारे एक अप्रभावी दाखवणाऱ्याला — कारण पहिल्या पिढीत लपलेला अप्रभावी युग्मविकल्पी दोन अप्रभावी प्रती भेटल्यावर पुन्हा प्रकट.",
        },
        detail: {
          en: "The first generation is all tall (each has one tall and one short allele, tall dominant), but breeding them mixes the alleles four ways, three of which give tall and one short.",
          hi: "पहली पीढ़ी सब लंबी (हर एक में एक लंबा एक छोटा युग्मविकल्पी, लंबा प्रभावी), पर उन्हें प्रजनित करना युग्मविकल्पियों को चार तरह मिलाता, जिनमें तीन लंबे एक छोटा देते।",
          mr: "पहिली पिढी सारी उंच (प्रत्येकात एक उंच एक आखूड युग्मविकल्पी, उंच प्रभावी), पण त्यांना प्रजनन करणे युग्मविकल्पींना चार प्रकारे मिसळते, ज्यांत तीन उंच एक आखूड देतात.",
        },
        extra: {
          en: "Mendel found this by counting thousands of pea plants — the first time inheritance was studied as clean numbers rather than vague resemblance.",
          hi: "मेंडल ने यह हज़ारों मटर पौधे गिनकर पाया — पहली बार वंशागति अस्पष्ट समानता के बजाय साफ़ संख्याओं के रूप में अध्ययन की गई।",
          mr: "मेंडेलने हे हजारो वाटाणा झाडे मोजून शोधले — पहिल्यांदा वंशागत अस्पष्ट साम्याऐवजी स्वच्छ संख्यांच्या रूपात अभ्यासली गेली.",
        },
        pair: {
          left: {
            en: "Three dominant to one recessive in the F2",
            hi: "F2 में तीन प्रभावी एक अप्रभावी",
            mr: "F2 मध्ये तीन प्रभावी एक अप्रभावी",
          },
          right: {
            en: "the 3:1 ratio",
            hi: "3:1 अनुपात",
            mr: "3:1 प्रमाण",
          },
        },
      },
      {
        id: "genotype-phenotype",
        name: {
          en: "Genotype and phenotype",
          hi: "जीनप्ररूप और लक्षणप्ररूप",
          mr: "जनुकप्रकार आणि लक्षणप्रकार",
        },
        kind: "idea",
        prompt: {
          en: "Two tall pea plants may look identical, yet one carries two tall alleles and the other one tall and one short. What is the difference between the genes an organism carries and the traits it actually shows?",
          hi: "दो लंबे मटर पौधे समान दिख सकते, फिर भी एक दो लंबे युग्मविकल्पी ढोता और दूसरा एक लंबा एक छोटा। जीव जो जीन ढोता और जो गुण वास्तव में दिखाता के बीच अंतर क्या?",
          mr: "दोन उंच वाटाणा झाडे सारखी दिसू शकतात, तरी एक दोन उंच युग्मविकल्पी वाहते आणि दुसरे एक उंच एक आखूड. जीव जी जनुके वाहतो आणि जे गुण प्रत्यक्षात दाखवतो यांतील फरक काय?",
        },
        statement: {
          en: "The genotype is the actual set of alleles an organism carries, while the phenotype is the visible trait it shows; because a dominant allele can mask a recessive one, the same phenotype can hide different genotypes.",
          hi: "जीनप्ररूप जीव जो युग्मविकल्पी वास्तव में ढोता, जबकि लक्षणप्ररूप जो दृश्य गुण दिखाता; क्योंकि प्रभावी युग्मविकल्पी अप्रभावी को ढक सकता, एक ही लक्षणप्ररूप भिन्न जीनप्ररूप छिपा सकता।",
          mr: "जनुकप्रकार जीव जी युग्मविकल्पी प्रत्यक्षात वाहतो, तर लक्षणप्रकार जो दृश्य गुण दाखवतो; कारण प्रभावी युग्मविकल्पी अप्रभावीला झाकू शकतो, एकच लक्षणप्रकार वेगळे जनुकप्रकार लपवू शकतो.",
        },
        detail: {
          en: "So 'tall' as a phenotype could mean two tall alleles or one of each — you cannot always read the genotype from the appearance alone.",
          hi: "अतः लक्षणप्ररूप बतौर 'लंबा' दो लंबे युग्मविकल्पी या हर एक का एक हो सकता — तुम सदा केवल दिखावट से जीनप्ररूप नहीं पढ़ सकते।",
          mr: "म्हणून लक्षणप्रकार म्हणून 'उंच' दोन उंच युग्मविकल्पी वा प्रत्येकाचा एक असू शकतो — तू सदैव फक्त दिसण्यावरून जनुकप्रकार वाचू शकत नाहीस.",
        },
        extra: {
          en: "This is exactly why a recessive trait can skip a generation — carried silently in the genotype without showing in the phenotype.",
          hi: "ठीक इसीलिए अप्रभावी गुण एक पीढ़ी छोड़ सकता — जीनप्ररूप में चुपचाप ढोया बिना लक्षणप्ररूप में दिखे।",
          mr: "नेमके म्हणूनच अप्रभावी गुण एक पिढी वगळू शकतो — जनुकप्रकारात गुपचूप वाहिलेला लक्षणप्रकारात न दिसता.",
        },
        pair: {
          left: {
            en: "The alleles carried versus the trait shown",
            hi: "ढोए युग्मविकल्पी बनाम दिखाया गुण",
            mr: "वाहिलेले युग्मविकल्पी विरुद्ध दाखवलेला गुण",
          },
          right: {
            en: "genotype and phenotype",
            hi: "जीनप्ररूप और लक्षणप्ररूप",
            mr: "जनुकप्रकार आणि लक्षणप्रकार",
          },
        },
      },
      {
        id: "sex-determination",
        name: {
          en: "Sex determination",
          hi: "लिंग निर्धारण",
          mr: "लिंग निर्धारण",
        },
        kind: "idea",
        prompt: {
          en: "A human female has two X chromosomes and a male an X and a Y; the mother's egg always carries an X, but the father's sperm carries either an X or a Y. What decides whether a child is a girl or a boy?",
          hi: "मानव स्त्री के दो X गुणसूत्र और पुरुष के एक X एक Y; माता का अंड सदा X ढोता, पर पिता का शुक्राणु या तो X या Y ढोता। क्या तय करता बच्चा लड़की या लड़का?",
          mr: "मानवी स्त्रीचे दोन X गुणसूत्र आणि पुरुषाचे एक X एक Y; आईचे अंडे सदैव X वाहते, पण वडिलांचा शुक्राणू एकतर X वा Y वाहतो. काय ठरवते मूल मुलगी की मुलगा?",
        },
        statement: {
          en: "Sex determination in humans depends on the sex chromosomes: a child inheriting two X chromosomes is female, and one inheriting an X and a Y is male. The mother's egg always gives an X, so it is the father's sperm — X or Y — that decides the child's sex.",
          hi: "मनुष्यों में लिंग निर्धारण लिंग-गुणसूत्रों पर निर्भर: दो X गुणसूत्र वंशागत करता बच्चा स्त्री, और एक X एक Y वंशागत करता पुरुष। माता का अंड सदा X देता, अतः पिता का शुक्राणु — X या Y — बच्चे का लिंग तय करता।",
          mr: "मनुष्यांत लिंग निर्धारण लिंग-गुणसूत्रांवर अवलंबून: दोन X गुणसूत्र वंशागत करणारे मूल स्त्री, आणि एक X एक Y वंशागत करणारे पुरुष. आईचे अंडे सदैव X देते, म्हणून वडिलांचा शुक्राणू — X वा Y — मुलाचे लिंग ठरवतो.",
        },
        detail: {
          en: "If a Y-bearing sperm fertilises the egg the child is a boy (XY); if an X-bearing sperm does, the child is a girl (XX). The egg's contribution is always the same X.",
          hi: "यदि Y-वाहक शुक्राणु अंड निषेचित करे बच्चा लड़का (XY); यदि X-वाहक करे, बच्चा लड़की (XX)। अंड का योगदान सदा वही X।",
          mr: "जर Y-वाहक शुक्राणू अंडे फलित करेल मूल मुलगा (XY); जर X-वाहक करेल, मूल मुलगी (XX). अंड्याचे योगदान सदैव तेच X.",
        },
        extra: {
          en: "This is why blaming a mother for the sex of her child is not only cruel but plainly wrong — she can only ever give an X.",
          hi: "इसी से बच्चे के लिंग को माता को दोष देना केवल क्रूर नहीं बल्कि स्पष्ट ग़लत — वह केवल X ही दे सकती।",
          mr: "म्हणूनच मुलाच्या लिंगासाठी आईला दोष देणे केवळ क्रूर नव्हे तर स्पष्ट चूक — ती फक्त X च देऊ शकते.",
        },
        pair: {
          left: {
            en: "The father's X or Y sperm settles it",
            hi: "पिता का X या Y शुक्राणु तय करे",
            mr: "वडिलांचा X वा Y शुक्राणू ठरवे",
          },
          right: {
            en: "sex determination",
            hi: "लिंग निर्धारण",
            mr: "लिंग निर्धारण",
          },
        },
      },
      {
        id: "inherited-acquired",
        name: {
          en: "Inherited and acquired traits",
          hi: "आनुवंशिक और उपार्जित लक्षण",
          mr: "वंशागत आणि उपार्जित गुण",
        },
        kind: "idea",
        prompt: {
          en: "A person's eye colour, written in their genes, passes to their children, but a scar earned in an accident or muscles built by exercise does not. What is the difference between these two kinds of trait?",
          hi: "किसी की आँख का रंग, उसके जीनों में लिखा, बच्चों को उतरता, पर दुर्घटना में पाया घाव या व्यायाम से बनी माँसपेशियाँ नहीं। इन दो प्रकार के लक्षणों के बीच अंतर क्या?",
          mr: "एखाद्याच्या डोळ्याचा रंग, त्याच्या जनुकांत लिहिलेला, मुलांना उतरतो, पण अपघातात मिळालेली जखम वा व्यायामाने बनलेले स्नायू नाही. या दोन प्रकारच्या गुणांतील फरक काय?",
        },
        statement: {
          en: "Inherited traits are written in the genes and pass to the offspring, while acquired traits are gained during life — a scar, a suntan, learned skill or built muscle — and are not passed on, because they never change the DNA of the germ cells.",
          hi: "आनुवंशिक लक्षण जीनों में लिखे और संतान को उतरते, जबकि उपार्जित लक्षण जीवन-भर पाए — घाव, धूप-ताम्रता, सीखा कौशल या बनी माँसपेशी — और नहीं उतरते, क्योंकि वे जनन-कोशिकाओं का DNA कभी नहीं बदलते।",
          mr: "वंशागत गुण जनुकांत लिहिलेले आणि संततीला उतरतात, तर उपार्जित गुण आयुष्यभर मिळवलेले — जखम, ऊन-ताम्रता, शिकलेले कौशल्य वा बनलेले स्नायू — आणि उतरत नाहीत, कारण ते जनन-पेशींचे DNA कधी बदलत नाहीत.",
        },
        detail: {
          en: "Only a change in the DNA of the germ cells (the eggs and sperm) can be inherited; a change to the body's other cells dies with the body.",
          hi: "केवल जनन-कोशिकाओं (अंड और शुक्राणु) के DNA का परिवर्तन वंशागत हो सकता; शरीर की अन्य कोशिकाओं का परिवर्तन शरीर के साथ मरता।",
          mr: "फक्त जनन-पेशींच्या (अंडी आणि शुक्राणू) DNA चा बदल वंशागत होऊ शकतो; शरीराच्या इतर पेशींचा बदल शरीरासोबत मरतो.",
        },
        extra: {
          en: "This is why the children of a weightlifter are not born strong, and why cutting the tails of mice for generations never gives rise to tailless mice.",
          hi: "इसी से भारोत्तोलक के बच्चे बलवान नहीं जन्मते, और पीढ़ियों चूहों की पूँछ काटने से कभी बिना-पूँछ चूहे नहीं जन्मते।",
          mr: "म्हणूनच वजन उचलणाऱ्याची मुले बलवान जन्मत नाहीत, आणि पिढ्यानपिढ्या उंदरांच्या शेपट्या कापल्याने कधी बिनशेपटीचे उंदीर जन्मत नाहीत.",
        },
        pair: {
          left: {
            en: "In the genes and passed on, versus gained in life",
            hi: "जीनों में और उतरे, बनाम जीवन में पाए",
            mr: "जनुकांत आणि उतरणारे, विरुद्ध आयुष्यात मिळवलेले",
          },
          right: {
            en: "inherited and acquired traits",
            hi: "आनुवंशिक और उपार्जित लक्षण",
            mr: "वंशागत आणि उपार्जित गुण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Mendel crossed a pure tall pea plant with a pure short one. Every plant in the next generation was tall — the short trait seemed to vanish. But when he bred those tall plants together, short plants reappeared in about a quarter of their offspring. Where was the 'short' factor hiding, and why did it come back?",
          hi: "मेंडल ने शुद्ध लंबे मटर पौधे को शुद्ध छोटे से संकरित किया। अगली पीढ़ी का हर पौधा लंबा — छोटा गुण लुप्त लगा। पर जब उसने उन लंबे पौधों को साथ प्रजनित किया, उनकी संतान के लगभग एक-चौथाई में छोटे पौधे फिर प्रकट हुए। 'छोटा' कारक कहाँ छिपा था, और यह वापस क्यों आया?",
          mr: "मेंडेलने शुद्ध उंच वाटाणा झाड शुद्ध आखूडशी संकरित केले. पुढच्या पिढीतील प्रत्येक झाड उंच — आखूड गुण नाहीसा वाटला. पण जेव्हा त्याने ती उंच झाडे एकत्र प्रजनन केली, त्यांच्या संततीच्या सुमारे एक-चतुर्थांशात आखूड झाडे पुन्हा प्रकट झाली. 'आखूड' घटक कुठे लपला होता, आणि तो परत का आला?",
        },
        choices: [
          {
            en: "The tall allele is dominant and the short recessive. The first-generation plants each carried one tall and one short allele, so they all looked tall while silently carrying the hidden short allele. Breeding them lets two short alleles meet again in about a quarter of the offspring, where — with no tall allele to mask it — the short trait shows once more",
            hi: "लंबा युग्मविकल्पी प्रभावी और छोटा अप्रभावी। पहली पीढ़ी के पौधे हर एक एक लंबा एक छोटा युग्मविकल्पी ढोते, अतः सब लंबे दिखते जबकि छिपा छोटा युग्मविकल्पी चुपचाप ढोते। उन्हें प्रजनित करना संतान के लगभग एक-चौथाई में दो छोटे युग्मविकल्पी फिर मिलने देता, जहाँ — ढकने कोई लंबा युग्मविकल्पी न होने से — छोटा गुण फिर दिखता",
            mr: "उंच युग्मविकल्पी प्रभावी आणि आखूड अप्रभावी. पहिल्या पिढीतील झाडे प्रत्येक एक उंच एक आखूड युग्मविकल्पी वाहत, म्हणून सारी उंच दिसत तर लपलेला आखूड युग्मविकल्पी गुपचूप वाहत. त्यांना प्रजनन करणे संततीच्या सुमारे एक-चतुर्थांशात दोन आखूड युग्मविकल्पी पुन्हा भेटू देते, जिथे — झाकायला कोणता उंच युग्मविकल्पी नसल्याने — आखूड गुण पुन्हा दिसतो",
          },
          {
            en: "The short factor was destroyed in the first generation and randomly recreated later",
            hi: "छोटा कारक पहली पीढ़ी में नष्ट हुआ और बाद में बेतरतीब फिर बनाया",
            mr: "आखूड घटक पहिल्या पिढीत नष्ट झाला आणि नंतर यादृच्छिक पुन्हा बनवला",
          },
          {
            en: "The tall plants turned short because the soil changed",
            hi: "लंबे पौधे छोटे हुए क्योंकि मिट्टी बदली",
            mr: "उंच झाडे आखूड झाली कारण माती बदलली",
          },
          {
            en: "The short trait is dominant, which is why it came back",
            hi: "छोटा गुण प्रभावी, इसी से वापस आया",
            mr: "आखूड गुण प्रभावी, म्हणून परत आला",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The 'short' factor never went anywhere — it was hidden, not lost, and understanding why is the whole of Mendel's insight. Height in his peas is controlled by a gene that comes in two alleles: a tall allele, which is dominant, and a short allele, which is recessive. The pure parents each carried two matching alleles — the tall parent two tall, the short parent two short. Their offspring, the first generation, therefore received one tall allele from one parent and one short allele from the other, so every one of them had the pair 'tall + short'. Because tall is dominant, it masks the short allele completely, and all these plants look tall — yet each still silently carries the short allele in its genotype. This is the crucial point: the short factor is present the whole time, just not showing. When these first-generation plants are bred with each other, each parent passes on either its tall allele or its short allele, at random, to each offspring. The offspring can then end up with tall+tall, tall+short, short+tall, or short+short — four equally likely combinations. Three of those four include at least one tall allele, so those plants are tall; but one in four gets short+short, with no tall allele to mask anything, and in those plants the short trait reappears. That is the origin of the famous 3:1 ratio, and it shows that a recessive trait vanishing in one generation has not been erased — it is riding along hidden in the genotype, ready to show again whenever two recessive copies meet. (The wrong answers miss this: the factor was not destroyed and remade, the environment did not change the plants, and short is recessive, not dominant — if it were dominant it would never have hidden in the first generation at all.)",
          hi: "'छोटा' कारक कहीं नहीं गया — यह छिपा था, लुप्त नहीं, और क्यों समझना मेंडल की पूरी अंतर्दृष्टि। उसके मटर में ऊँचाई एक जीन से नियंत्रित जो दो युग्मविकल्पियों में आता: लंबा युग्मविकल्पी, प्रभावी, और छोटा, अप्रभावी। शुद्ध जनक हर एक दो मेल खाते युग्मविकल्पी ढोते — लंबा जनक दो लंबे, छोटा जनक दो छोटे। उनकी संतान, पहली पीढ़ी, इसलिए एक जनक से एक लंबा और दूसरे से एक छोटा युग्मविकल्पी पाई, अतः हर एक के पास 'लंबा + छोटा' जोड़ी। क्योंकि लंबा प्रभावी, यह छोटे युग्मविकल्पी को पूरी तरह ढकता, और ये सब पौधे लंबे दिखते — फिर भी हर एक अपने जीनप्ररूप में छोटा युग्मविकल्पी चुपचाप ढोता। यह मुख्य बिंदु: छोटा कारक पूरे समय मौजूद, बस न दिखता। जब ये पहली पीढ़ी के पौधे एक-दूसरे से प्रजनित, हर जनक अपना लंबा या छोटा युग्मविकल्पी, बेतरतीब, हर संतान को देता। संतान फिर लंबा+लंबा, लंबा+छोटा, छोटा+लंबा, या छोटा+छोटा पा सकती — चार समसंभावी संयोजन। उन चार में से तीन में कम से कम एक लंबा युग्मविकल्पी, अतः वे पौधे लंबे; पर चार में एक छोटा+छोटा पाता, ढकने कोई लंबा युग्मविकल्पी नहीं, और उन पौधों में छोटा गुण फिर प्रकट। वह प्रसिद्ध 3:1 अनुपात का उद्गम, और दिखाता कि एक पीढ़ी में लुप्त होता अप्रभावी गुण मिटा नहीं — यह जीनप्ररूप में छिपा सवारी करता, जब भी दो अप्रभावी प्रतियाँ मिलें फिर दिखने तैयार। (ग़लत उत्तर यह चूकते: कारक नष्ट-पुनर्निर्मित नहीं हुआ, परिवेश ने पौधे नहीं बदले, और छोटा अप्रभावी, प्रभावी नहीं — यदि प्रभावी होता तो पहली पीढ़ी में छिपता ही नहीं।)",
          mr: "'आखूड' घटक कुठेही गेला नाही — तो लपला होता, हरवला नाही, आणि का समजणे मेंडेलची अख्खी अंतर्दृष्टी. त्याच्या वाटाण्यात उंची एका जनुकाने नियंत्रित जे दोन युग्मविकल्पींत येते: उंच युग्मविकल्पी, प्रभावी, आणि आखूड, अप्रभावी. शुद्ध पालक प्रत्येक दोन जुळणारे युग्मविकल्पी वाहत — उंच पालक दोन उंच, आखूड पालक दोन आखूड. त्यांची संतती, पहिली पिढी, म्हणून एका पालकाकडून एक उंच आणि दुसऱ्याकडून एक आखूड युग्मविकल्पी मिळवली, म्हणून प्रत्येकाकडे 'उंच + आखूड' जोडी. कारण उंच प्रभावी, तो आखूड युग्मविकल्पीला पूर्णपणे झाकतो, आणि ही सारी झाडे उंच दिसतात — तरी प्रत्येक आपल्या जनुकप्रकारात आखूड युग्मविकल्पी गुपचूप वाहते. हा महत्त्वाचा मुद्दा: आखूड घटक संपूर्ण वेळ उपस्थित, फक्त न दिसणारा. जेव्हा ही पहिल्या पिढीतील झाडे एकमेकांशी प्रजनन, प्रत्येक पालक आपला उंच वा आखूड युग्मविकल्पी, यादृच्छिक, प्रत्येक संततीला देतो. संतती मग उंच+उंच, उंच+आखूड, आखूड+उंच, वा आखूड+आखूड मिळवू शकते — चार समसंभाव्य संयोजने. त्या चारांतील तीनांत किमान एक उंच युग्मविकल्पी, म्हणून ती झाडे उंच; पण चारांत एक आखूड+आखूड मिळवते, झाकायला कोणता उंच युग्मविकल्पी नाही, आणि त्या झाडांत आखूड गुण पुन्हा प्रकट. तो प्रसिद्ध 3:1 प्रमाणाचा उगम, आणि दाखवतो की एका पिढीत नाहीसा होणारा अप्रभावी गुण पुसला नाही — तो जनुकप्रकारात लपून स्वार होतो, जेव्हाही दोन अप्रभावी प्रती भेटतील पुन्हा दिसायला तयार. (चुकीची उत्तरे हे चुकवतात: घटक नष्ट-पुनर्निर्मित झाला नाही, परिसराने झाडे बदलली नाहीत, आणि आखूड अप्रभावी, प्रभावी नाही — तो प्रभावी असता तर पहिल्या पिढीत लपलाच नसता.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "In many societies a woman is blamed, even punished, when she gives birth only to daughters. But the biology of sex determination shows this blame is not just unjust but scientifically impossible. Whose contribution actually decides a child's sex, and why can the mother never be responsible?",
          hi: "कई समाजों में स्त्री को दोष, यहाँ तक कि दंड, जब वह केवल बेटियाँ जनती। पर लिंग-निर्धारण की जीव-विज्ञान दिखाती यह दोष केवल अन्यायपूर्ण नहीं बल्कि वैज्ञानिक रूप से असंभव। किसका योगदान वास्तव में बच्चे का लिंग तय करता, और माता कभी ज़िम्मेदार क्यों नहीं हो सकती?",
          mr: "अनेक समाजांत स्त्रीला दोष, अगदी शिक्षा, जेव्हा ती फक्त मुली जन्मते. पण लिंग-निर्धारणाचे जीवशास्त्र दाखवते हा दोष केवळ अन्याय्य नव्हे तर वैज्ञानिकदृष्ट्या अशक्य. कोणाचे योगदान प्रत्यक्षात मुलाचे लिंग ठरवते, आणि आई कधी जबाबदार का असू शकत नाही?",
        },
        choices: [
          {
            en: "The father's sperm decides. The mother has two X chromosomes, so every egg she makes carries an X — she can only ever contribute an X. The father has an X and a Y, so his sperm carries either one: an X-sperm makes a girl (XX) and a Y-sperm makes a boy (XY). Since the egg is always X, the child's sex is fixed entirely by which sperm fertilises it, so the mother cannot possibly be responsible",
            hi: "पिता का शुक्राणु तय करता। माता के दो X गुणसूत्र, अतः वह जो अंड बनाती हर एक X ढोता — वह केवल X ही दे सकती। पिता के एक X एक Y, अतः उसका शुक्राणु या तो ढोता: X-शुक्राणु लड़की (XX) और Y-शुक्राणु लड़का (XY) बनाता। चूँकि अंड सदा X, बच्चे का लिंग पूरी तरह इससे तय कि कौन-सा शुक्राणु निषेचित करता, अतः माता संभवतः ज़िम्मेदार नहीं हो सकती",
            mr: "वडिलांचा शुक्राणू ठरवतो. आईचे दोन X गुणसूत्र, म्हणून ती जे अंडे बनवते प्रत्येक X वाहते — ती फक्त X च देऊ शकते. वडिलांचे एक X एक Y, म्हणून त्याचा शुक्राणू एकतर वाहतो: X-शुक्राणू मुलगी (XX) आणि Y-शुक्राणू मुलगा (XY) बनवतो. अंडे सदैव X असल्याने, मुलाचे लिंग पूर्णपणे यावरून ठरते की कोणता शुक्राणू फलित करतो, म्हणून आई शक्यतो जबाबदार असू शकत नाही",
          },
          {
            en: "The mother decides, because the baby grows inside her body",
            hi: "माता तय करती, क्योंकि शिशु उसके शरीर में बढ़ता",
            mr: "आई ठरवते, कारण बाळ तिच्या शरीरात वाढते",
          },
          {
            en: "The sex is decided by what the mother eats during pregnancy",
            hi: "लिंग इससे तय कि माता गर्भावस्था में क्या खाती",
            mr: "लिंग यावरून ठरते की आई गर्भावस्थेत काय खाते",
          },
          {
            en: "Both parents' chromosomes are identical, so neither decides",
            hi: "दोनों जनकों के गुणसूत्र समान, अतः कोई तय नहीं करता",
            mr: "दोन्ही पालकांचे गुणसूत्र समान, म्हणून कोणी ठरवत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The science here is completely settled, and it flatly contradicts the social blame. A person's sex in humans is set by a pair of sex chromosomes. A female has two X chromosomes (XX) and a male has one X and one Y (XY). When gametes — eggs and sperm — are made, each carries only one of the pair. Now look at what each parent can contribute. The mother is XX, so no matter which of her chromosomes goes into an egg, it is always an X; every single egg she produces carries an X, and she has no Y to give at all. The father is XY, so his sperm are of two kinds: half carry his X and half carry his Y. When a sperm fertilises the egg, the egg's X is fixed, and the outcome depends entirely on the sperm. If an X-bearing sperm wins, the child is XX — a girl. If a Y-bearing sperm wins, the child is XY — a boy. So the child's sex is determined solely by whether the fertilising sperm carried an X or a Y — and that comes from the father, never the mother. The mother physically cannot influence it, because the only chromosome she can supply is an X in every case. Blaming a woman for the sex of her children is therefore not merely cruel and unjust; it is biologically impossible, resting on ignorance of a fact that is as certain as any in science. (The wrong answers repeat exactly the myths biology overturns: carrying the baby, or the mother's diet, has nothing to do with which sperm fertilised the egg, and the two parents' sex chromosomes are precisely not identical — that difference is the whole point.) This is one of the clearest cases where understanding basic heredity directly refutes a harmful social prejudice.",
          hi: "यहाँ विज्ञान पूरी तरह तय, और यह सामाजिक दोष का सपाट खंडन करता। मनुष्यों में किसी का लिंग लिंग-गुणसूत्रों की जोड़ी से सधता। स्त्री के दो X गुणसूत्र (XX) और पुरुष के एक X एक Y (XY)। जब युग्मक — अंड और शुक्राणु — बनते, हर एक जोड़ी का केवल एक ढोता। अब देखो हर जनक क्या दे सकता। माता XX, अतः उसका कौन-सा गुणसूत्र अंड में जाए, यह सदा X; उसका हर अंड X ढोता, और उसके पास देने कोई Y है ही नहीं। पिता XY, अतः उसके शुक्राणु दो तरह के: आधे उसका X और आधे उसका Y ढोते। जब शुक्राणु अंड निषेचित करता, अंड का X सधा, और परिणाम पूरी तरह शुक्राणु पर। यदि X-वाहक शुक्राणु जीते, बच्चा XX — लड़की। यदि Y-वाहक जीते, बच्चा XY — लड़का। अतः बच्चे का लिंग केवल इससे तय कि निषेचित करता शुक्राणु X या Y ढोता — और वह पिता से, कभी माता से नहीं। माता भौतिक रूप से इसे प्रभावित नहीं कर सकती, क्योंकि वह हर मामले में केवल X दे सकती। बच्चों के लिंग को स्त्री को दोष देना इसलिए केवल क्रूर-अन्यायपूर्ण नहीं; यह जीव-वैज्ञानिक रूप से असंभव, विज्ञान के किसी भी तथ्य जितने निश्चित तथ्य की अनभिज्ञता पर टिका। (ग़लत उत्तर ठीक वे मिथक दोहराते जो जीव-विज्ञान उलटती: शिशु ढोना, या माता का आहार, इससे कोई संबंध नहीं कि कौन-सा शुक्राणु अंड निषेचित करता, और दो जनकों के लिंग-गुणसूत्र ठीक समान नहीं — वही अंतर पूरा मर्म।) यह सबसे स्पष्ट मामलों में जहाँ बुनियादी आनुवंशिकता समझना सीधे एक हानिकारक सामाजिक पूर्वाग्रह का खंडन करता।",
          mr: "इथले विज्ञान पूर्णपणे ठरलेले, आणि ते सामाजिक दोषाचे सपाट खंडन करते. मनुष्यांत एखाद्याचे लिंग लिंग-गुणसूत्रांच्या जोडीने ठरते. स्त्रीचे दोन X गुणसूत्र (XX) आणि पुरुषाचे एक X एक Y (XY). जेव्हा युग्मके — अंडी आणि शुक्राणू — बनतात, प्रत्येक जोडीचा फक्त एक वाहते. आता पाहा प्रत्येक पालक काय देऊ शकतो. आई XX, म्हणून तिचे कोणते गुणसूत्र अंड्यात जाईल, ते सदैव X; तिचे प्रत्येक अंडे X वाहते, आणि तिच्याकडे द्यायला कोणतेही Y नाहीच. वडील XY, म्हणून त्याचे शुक्राणू दोन प्रकारचे: अर्धे त्याचा X आणि अर्धे त्याचा Y वाहतात. जेव्हा शुक्राणू अंडे फलित करतो, अंड्याचा X ठरलेला, आणि परिणाम पूर्णपणे शुक्राणूवर. जर X-वाहक शुक्राणू जिंकला, मूल XX — मुलगी. जर Y-वाहक जिंकला, मूल XY — मुलगा. म्हणून मुलाचे लिंग फक्त यावरून ठरते की फलित करणारा शुक्राणू X वा Y वाहतो — आणि तो वडिलांकडून, कधी आईकडून नाही. आई भौतिकदृष्ट्या त्यावर प्रभाव टाकू शकत नाही, कारण ती प्रत्येक बाबतीत फक्त X देऊ शकते. मुलांच्या लिंगासाठी स्त्रीला दोष देणे म्हणून केवळ क्रूर-अन्याय्य नव्हे; ते जीवशास्त्रीयदृष्ट्या अशक्य, विज्ञानातील कोणत्याही तथ्याइतक्या निश्चित तथ्याच्या अज्ञानावर टेकलेले. (चुकीची उत्तरे नेमके ते समज पुन्हा सांगतात जे जीवशास्त्र उलटवते: बाळ वाहणे, वा आईचा आहार, याचा संबंध नाही की कोणता शुक्राणू अंडे फलित करतो, आणि दोन पालकांचे लिंग-गुणसूत्र नेमके समान नाहीत — तोच फरक अख्खा मुद्दा.) हे सर्वांत स्पष्ट प्रकरणांपैकी जिथे मूलभूत आनुवंशिकता समजणे थेट एका हानिकारक सामाजिक पूर्वग्रहाचे खंडन करते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — Light: Reflection and Refraction                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-light",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 9 — Light: Reflection and Refraction",
      hi: "अध्याय 9 — प्रकाश: परावर्तन तथा अपवर्तन",
      mr: "प्रकरण 9 — प्रकाश: परावर्तन आणि अपवर्तन",
    },
    name: {
      en: "Light: Reflection and Refraction",
      hi: "प्रकाश: परावर्तन तथा अपवर्तन",
      mr: "प्रकाश: परावर्तन आणि अपवर्तन",
    },
    summary: {
      en: "A ray obeying two strict rules and one act of bending: equal angles at every mirror, a curved mirror that gathers or spreads, light slowing as it enters glass and turning at the boundary, the refractive index that measures the turn, and lenses ranked by the power to bend.",
      hi: "दो कड़े नियम मानती किरण और एक मुड़ने की क्रिया: हर दर्पण पर बराबर कोण, समेटता या फैलाता वक्र दर्पण, काँच में घुसते धीमा होता और सीमा पर मुड़ता प्रकाश, मोड़ नापता अपवर्तनांक, और मोड़ने की क्षमता से आँके लेंस।",
      mr: "दोन कडक नियम पाळणारा किरण आणि एक वळण्याची क्रिया: प्रत्येक आरशावर समान कोन, गोळा करणारा वा पसरवणारा वक्र आरसा, काचेत शिरताना मंदावणारा आणि सीमेवर वळणारा प्रकाश, वळण मोजणारा अपवर्तनांक, आणि वाकवण्याच्या क्षमतेने मोजलेली भिंगे.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "laws-of-reflection",
        name: {
          en: "The laws of reflection",
          hi: "परावर्तन के नियम",
          mr: "परावर्तनाचे नियम",
        },
        kind: "law",
        prompt: {
          en: "A ray striking a polished surface bounces off at exactly the same angle at which it arrived, and both rays lie flat in one plane with the normal. Which pair of rules is being stated?",
          hi: "पॉलिश सतह से टकराती किरण ठीक उसी कोण पर लौटती जिस पर आई, और दोनों किरणें अभिलंब के साथ एक ही तल में सपाट पड़ीं। कौन-सी नियम-जोड़ी बताई जा रही?",
          mr: "पॉलिश केलेल्या पृष्ठावर आदळणारा किरण नेमक्या त्याच कोनात परततो ज्या कोनात आला, आणि दोन्ही किरण स्तंभिकेसह एकाच प्रतलात सपाट. कोणती नियम-जोडी सांगितली जात आहे?",
        },
        statement: {
          en: "The laws of reflection say the angle of incidence equals the angle of reflection, and the incident ray, the reflected ray and the normal at the point of incidence all lie in the same plane.",
          hi: "परावर्तन के नियम कहते आपतन कोण परावर्तन कोण के बराबर, और आपतित किरण, परावर्तित किरण तथा आपतन बिंदु पर अभिलंब सब एक ही तल में।",
          mr: "परावर्तनाचे नियम सांगतात आपाती कोन परावर्तन कोनाइतका, आणि आपाती किरण, परावर्तित किरण व आपाती बिंदूवरील स्तंभिका सर्व एकाच प्रतलात.",
        },
        detail: {
          en: "The normal is the line drawn perpendicular to the surface at the point where the ray lands, and every angle is measured from it — never from the surface itself.",
          hi: "अभिलंब वह रेखा जो किरण के गिरने के बिंदु पर सतह के लंबवत खींची, और हर कोण उसी से नापा — कभी सतह से नहीं।",
          mr: "स्तंभिका ती रेषा जी किरण पडलेल्या बिंदूवर पृष्ठाला लंब काढली, आणि प्रत्येक कोन तिच्यापासूनच मोजला — कधी पृष्ठापासून नाही.",
        },
        extra: {
          en: "These two laws hold for every reflecting surface — flat, curved, polished metal or still water — which is why one rule explains both a bathroom mirror and a car's headlamp.",
          hi: "ये दो नियम हर परावर्तक सतह पर लागू — सपाट, वक्र, पॉलिश धातु या ठहरा पानी — इसी से एक नियम स्नानघर के दर्पण और गाड़ी की हेडलैंप दोनों समझाता।",
          mr: "हे दोन नियम प्रत्येक परावर्तक पृष्ठावर लागू — सपाट, वक्र, पॉलिश धातू वा स्थिर पाणी — म्हणूनच एक नियम स्नानगृहाचा आरसा आणि गाडीचा दिवा दोन्ही समजावतो.",
        },
        pair: {
          left: {
            en: "Angle in equals angle out",
            hi: "आने का कोण जाने के कोण बराबर",
            mr: "येण्याचा कोन जाण्याच्या कोनाइतका",
          },
          right: {
            en: "the laws of reflection",
            hi: "परावर्तन के नियम",
            mr: "परावर्तनाचे नियम",
          },
        },
      },
      {
        id: "concave-mirror",
        name: {
          en: "The converging concave mirror",
          hi: "अभिसारी अवतल दर्पण",
          mr: "अभिसारी अंतर्वक्र आरसा",
        },
        kind: "device",
        prompt: {
          en: "A mirror curved inward like the inside of a spoon gathers parallel rays to a single burning point. Which mirror converges light, and where does it send those parallel rays?",
          hi: "चम्मच के भीतरी भाग जैसा अंदर मुड़ा दर्पण समांतर किरणों को एक जलते बिंदु पर समेटता। कौन-सा दर्पण प्रकाश अभिसरित करता, और वे समांतर किरणें कहाँ भेजता?",
          mr: "चमच्याच्या आतल्या भागासारखा आत वळलेला आरसा समांतर किरण एका जळत्या बिंदूवर गोळा करतो. कोणता आरसा प्रकाश अभिसरित करतो, आणि ते समांतर किरण कुठे पाठवतो?",
        },
        statement: {
          en: "A concave mirror curves inward and converges light: rays arriving parallel to its principal axis all meet at its principal focus, which lies in front of the mirror.",
          hi: "अवतल दर्पण अंदर मुड़ा और प्रकाश अभिसरित करता: उसके मुख्य अक्ष के समांतर आती किरणें सब उसके मुख्य फोकस पर मिलतीं, जो दर्पण के आगे।",
          mr: "अंतर्वक्र आरसा आत वळलेला आणि प्रकाश अभिसरित करतो: त्याच्या मुख्य अक्षाला समांतर येणारे किरण सर्व त्याच्या मुख्य नाभीवर मिळतात, जी आरशापुढे.",
        },
        detail: {
          en: "Its image changes with the object's position — real and inverted for a distant object, but virtual, erect and magnified when the object sits between the pole and the focus.",
          hi: "उसका प्रतिबिंब वस्तु की स्थिति से बदलता — दूर वस्तु के लिए वास्तविक और उल्टा, पर वस्तु ध्रुव और फोकस के बीच हो तो आभासी, सीधा और बड़ा।",
          mr: "त्याची प्रतिमा वस्तूच्या स्थानानुसार बदलते — दूरच्या वस्तूसाठी खरी आणि उलटी, पण वस्तू ध्रुव आणि नाभीदरम्यान असल्यास आभासी, सरळ आणि मोठी.",
        },
        extra: {
          en: "That is why a dentist and a shaving mirror both use it up close for an enlarged view, while a torch places its bulb at the focus to throw a parallel beam.",
          hi: "इसी से दंत-चिकित्सक और दाढ़ी का दर्पण दोनों पास से बड़ा दृश्य पाने इसे लेते, जबकि टॉर्च अपना बल्ब फोकस पर रखकर समांतर पुंज फेंकती।",
          mr: "म्हणूनच दंतवैद्य आणि दाढीचा आरसा दोघे जवळून मोठे दृश्य मिळवायला हा वापरतात, तर बॅटरी आपला बल्ब नाभीवर ठेवून समांतर झोत फेकते.",
        },
        pair: {
          left: {
            en: "Curves inward, gathers rays",
            hi: "अंदर मुड़ा, किरणें समेटे",
            mr: "आत वळलेला, किरण गोळा करी",
          },
          right: {
            en: "the converging concave mirror",
            hi: "अभिसारी अवतल दर्पण",
            mr: "अभिसारी अंतर्वक्र आरसा",
          },
        },
      },
      {
        id: "convex-mirror",
        name: {
          en: "The diverging convex mirror",
          hi: "अपसारी उत्तल दर्पण",
          mr: "अपसारी बहिर्वक्र आरसा",
        },
        kind: "device",
        prompt: {
          en: "A mirror bulging outward spreads parallel rays apart, and always shows a small upright picture of a wide scene. Which mirror diverges light, and what image does it always give?",
          hi: "बाहर उभरा दर्पण समांतर किरणों को फैलाता, और सदा चौड़े दृश्य का छोटा सीधा चित्र दिखाता। कौन-सा दर्पण प्रकाश अपसरित करता, और सदा कैसा प्रतिबिंब देता?",
          mr: "बाहेर फुगलेला आरसा समांतर किरण पसरवतो, आणि सदैव रुंद दृश्याचे लहान सरळ चित्र दाखवतो. कोणता आरसा प्रकाश अपसरित करतो, आणि सदैव कशी प्रतिमा देतो?",
        },
        statement: {
          en: "A convex mirror bulges outward and diverges light, always forming a virtual, erect and diminished image, whatever the object's distance.",
          hi: "उत्तल दर्पण बाहर उभरा और प्रकाश अपसरित करता, सदा आभासी, सीधा और छोटा प्रतिबिंब बनाता, वस्तु की दूरी चाहे जो हो।",
          mr: "बहिर्वक्र आरसा बाहेर फुगलेला आणि प्रकाश अपसरित करतो, सदैव आभासी, सरळ आणि लहान प्रतिमा बनवतो, वस्तूचे अंतर कोणतेही असो.",
        },
        detail: {
          en: "Its focus lies behind the mirror, where the diverging rays only appear to come from — which is why the image can never be caught on a screen.",
          hi: "उसका फोकस दर्पण के पीछे, जहाँ से अपसरित किरणें केवल आती प्रतीत होतीं — इसी से प्रतिबिंब कभी पर्दे पर नहीं पकड़ा जा सकता।",
          mr: "त्याची नाभी आरशामागे, जिथून अपसरित किरण केवळ येताना भासतात — म्हणूनच प्रतिमा कधी पडद्यावर पकडता येत नाही.",
        },
        extra: {
          en: "A vehicle's rear-view mirror is convex on purpose: a smaller image is the price paid for a much wider field of view behind.",
          hi: "गाड़ी का पश्च-दृश्य दर्पण जानबूझकर उत्तल: छोटा प्रतिबिंब पीछे के कहीं चौड़े दृष्टि-क्षेत्र की चुकाई क़ीमत।",
          mr: "गाडीचा मागील-दृश्य आरसा मुद्दाम बहिर्वक्र: लहान प्रतिमा ही मागच्या कितीतरी रुंद दृष्टिक्षेत्राची दिलेली किंमत.",
        },
        pair: {
          left: {
            en: "Bulges outward, spreads rays",
            hi: "बाहर उभरा, किरणें फैलाए",
            mr: "बाहेर फुगलेला, किरण पसरवी",
          },
          right: {
            en: "the diverging convex mirror",
            hi: "अपसारी उत्तल दर्पण",
            mr: "अपसारी बहिर्वक्र आरसा",
          },
        },
      },
      {
        id: "refraction",
        name: {
          en: "Refraction of light",
          hi: "प्रकाश का अपवर्तन",
          mr: "प्रकाशाचे अपवर्तन",
        },
        kind: "process",
        prompt: {
          en: "A pencil standing in a glass of water looks broken at the surface, and a coin in a bowl seems to rise. Which bending of light as it passes from one medium into another explains both?",
          hi: "पानी के गिलास में खड़ी पेंसिल सतह पर टूटी दिखती, और कटोरे में सिक्का उठा प्रतीत होता। एक माध्यम से दूसरे में जाते प्रकाश का कौन-सा मुड़ना दोनों समझाता?",
          mr: "पाण्याच्या ग्लासात उभी पेन्सिल पृष्ठावर मोडलेली दिसते, आणि वाडग्यातले नाणे वर आल्यासारखे भासते. एका माध्यमातून दुसऱ्यात जाताना प्रकाशाचे कोणते वळणे दोन्ही समजावते?",
        },
        statement: {
          en: "Refraction is the bending of light when it passes from one transparent medium into another, caused by the change in its speed at the boundary.",
          hi: "अपवर्तन प्रकाश का मुड़ना जब वह एक पारदर्शी माध्यम से दूसरे में जाता, सीमा पर उसकी चाल बदलने से।",
          mr: "अपवर्तन म्हणजे प्रकाश एका पारदर्शक माध्यमातून दुसऱ्यात जाताना वाकणे, सीमेवर त्याचा वेग बदलल्यामुळे.",
        },
        detail: {
          en: "Going into a denser medium the ray slows and bends toward the normal; coming out into a rarer one it speeds up and bends away from the normal.",
          hi: "सघन माध्यम में जाते किरण धीमी होकर अभिलंब की ओर मुड़ती; विरल में निकलते तेज़ होकर अभिलंब से दूर मुड़ती।",
          mr: "घन माध्यमात जाताना किरण मंदावून स्तंभिकेकडे वळतो; विरळात बाहेर पडताना वेगावून स्तंभिकेपासून दूर वळतो.",
        },
        extra: {
          en: "A ray striking the boundary straight on, along the normal, goes through unbent — it still changes speed, but there is no sideways direction to turn toward.",
          hi: "सीमा पर सीधे, अभिलंब के अनुदिश टकराती किरण बिना मुड़े निकलती — चाल फिर भी बदलती, पर मुड़ने को कोई बग़ली दिशा नहीं।",
          mr: "सीमेवर सरळ, स्तंभिकेच्या दिशेने आदळणारा किरण न वाकता जातो — वेग तरीही बदलतो, पण वळायला कोणती बाजूची दिशा नाही.",
        },
        pair: {
          left: {
            en: "Bending on changing medium",
            hi: "माध्यम बदलने पर मुड़ना",
            mr: "माध्यम बदलल्यावर वाकणे",
          },
          right: {
            en: "refraction",
            hi: "अपवर्तन",
            mr: "अपवर्तन",
          },
        },
      },
      {
        id: "refractive-index",
        name: {
          en: "The refractive index",
          hi: "अपवर्तनांक",
          mr: "अपवर्तनांक",
        },
        kind: "quantity",
        prompt: {
          en: "Light travels through glass at about two-thirds of its speed in vacuum, and that ratio is written as the number 1.5 for glass. Which quantity compares the two speeds and predicts how sharply a ray will turn?",
          hi: "प्रकाश काँच में निर्वात की अपनी चाल के लगभग दो-तिहाई से चलता, और वह अनुपात काँच के लिए 1.5 संख्या से लिखा। कौन-सी राशि दोनों चालों की तुलना करती और बताती किरण कितनी तीखी मुड़ेगी?",
          mr: "प्रकाश काचेतून निर्वातातील आपल्या वेगाच्या सुमारे दोन-तृतीयांश वेगाने जातो, आणि ते गुणोत्तर काचेसाठी 1.5 या संख्येने लिहिले. कोणती राशी दोन्ही वेगांची तुलना करते आणि किरण किती तीव्र वळेल हे सांगते?",
        },
        statement: {
          en: "The refractive index of a medium is the ratio of the speed of light in vacuum to its speed in that medium — the larger it is, the slower the light and the more sharply a ray bends.",
          hi: "किसी माध्यम का अपवर्तनांक निर्वात में प्रकाश की चाल का उस माध्यम में चाल से अनुपात — जितना बड़ा, प्रकाश उतना धीमा और किरण उतनी तीखी मुड़ती।",
          mr: "एखाद्या माध्यमाचा अपवर्तनांक म्हणजे निर्वातातील प्रकाशाच्या वेगाचे त्या माध्यमातील वेगाशी गुणोत्तर — जितका मोठा, प्रकाश तितका मंद आणि किरण तितका तीव्र वाकतो.",
        },
        detail: {
          en: "It is a pure number with no unit, because it is one speed divided by another, and it is never less than 1 for any ordinary material.",
          hi: "यह बिना मात्रक की शुद्ध संख्या, क्योंकि एक चाल दूसरी से भागी, और किसी साधारण पदार्थ के लिए 1 से कम कभी नहीं।",
          mr: "ही एककाविना शुद्ध संख्या, कारण एक वेग दुसऱ्याने भागलेला, आणि कोणत्याही सामान्य पदार्थासाठी 1 पेक्षा कमी कधीही नाही.",
        },
        extra: {
          en: "Diamond's very high value, about 2.42, slows light so much and bends it so hard that rays entering it bounce around inside before escaping — the source of its famous sparkle.",
          hi: "हीरे का बहुत ऊँचा मान, लगभग 2.42, प्रकाश को इतना धीमा और इतना तीखा मोड़ता कि भीतर घुसी किरणें निकलने से पहले अंदर उछलती रहतीं — उसकी प्रसिद्ध चमक का स्रोत।",
          mr: "हिऱ्याचे खूप उच्च मूल्य, सुमारे 2.42, प्रकाश इतका मंदावते आणि इतका तीव्र वाकवते की आत शिरलेले किरण बाहेर पडण्याआधी आत उसळत राहतात — त्याच्या प्रसिद्ध लखलखाटाचा स्रोत.",
        },
        pair: {
          left: {
            en: "Speed in vacuum over speed in medium",
            hi: "निर्वात की चाल बटा माध्यम की चाल",
            mr: "निर्वातातील वेग भागिले माध्यमातील वेग",
          },
          right: {
            en: "the refractive index",
            hi: "अपवर्तनांक",
            mr: "अपवर्तनांक",
          },
        },
      },
      {
        id: "convex-lens",
        name: {
          en: "The converging convex lens",
          hi: "अभिसारी उत्तल लेंस",
          mr: "अभिसारी बहिर्वक्र भिंग",
        },
        kind: "device",
        prompt: {
          en: "A piece of glass thicker in the middle than at its edges brings sunlight to a scorching point on paper. Which lens converges light, and what is that meeting point called?",
          hi: "किनारों से बीच में मोटा काँच का टुकड़ा धूप को काग़ज़ पर झुलसाते बिंदु पर लाता। कौन-सा लेंस प्रकाश अभिसरित करता, और वह मिलन-बिंदु क्या कहलाता?",
          mr: "कडांपेक्षा मध्यभागी जाड असलेला काचेचा तुकडा सूर्यप्रकाश कागदावर जाळणाऱ्या बिंदूवर आणतो. कोणते भिंग प्रकाश अभिसरित करते, आणि तो मिलन-बिंदू काय म्हणतात?",
        },
        statement: {
          en: "A convex lens is thicker at the middle than at the edges and converges parallel rays to its principal focus, which is why it is also called a converging lens.",
          hi: "उत्तल लेंस किनारों से बीच में मोटा और समांतर किरणों को अपने मुख्य फोकस पर अभिसरित करता, इसी से अभिसारी लेंस भी कहलाता।",
          mr: "बहिर्वक्र भिंग कडांपेक्षा मध्यभागी जाड आणि समांतर किरण आपल्या मुख्य नाभीवर अभिसरित करते, म्हणूनच त्याला अभिसारी भिंगही म्हणतात.",
        },
        detail: {
          en: "It gives a real, inverted image for an object beyond the focus, but a virtual, erect and magnified one when the object is nearer than the focus — the magnifying glass at work.",
          hi: "फोकस से परे वस्तु के लिए यह वास्तविक, उल्टा प्रतिबिंब देता, पर वस्तु फोकस से नज़दीक हो तो आभासी, सीधा और बड़ा — आवर्धक काँच का काम।",
          mr: "नाभीच्या पलीकडील वस्तूसाठी ते खरी, उलटी प्रतिमा देते, पण वस्तू नाभीहून जवळ असल्यास आभासी, सरळ आणि मोठी — भिंग-काचेचे काम.",
        },
        extra: {
          en: "A concave lens is its opposite in every way — thinner at the middle, diverging the rays, and giving only a virtual, erect, diminished image.",
          hi: "अवतल लेंस हर तरह इसका उल्टा — बीच में पतला, किरणें अपसरित करता, और केवल आभासी, सीधा, छोटा प्रतिबिंब देता।",
          mr: "अंतर्वक्र भिंग प्रत्येक बाबतीत याच्या उलट — मध्यभागी पातळ, किरण अपसरित करणारे, आणि फक्त आभासी, सरळ, लहान प्रतिमा देणारे.",
        },
        pair: {
          left: {
            en: "Thick in the middle, converging",
            hi: "बीच में मोटा, अभिसारी",
            mr: "मध्यभागी जाड, अभिसारी",
          },
          right: {
            en: "the converging convex lens",
            hi: "अभिसारी उत्तल लेंस",
            mr: "अभिसारी बहिर्वक्र भिंग",
          },
        },
      },
      {
        id: "power-of-lens",
        name: {
          en: "The power of a lens",
          hi: "लेंस की क्षमता",
          mr: "भिंगाची क्षमता",
        },
        kind: "quantity",
        prompt: {
          en: "An optician's prescription reads '+2 D' or '−1.5 D', a single number standing for the reciprocal of the focal length in metres. Which quantity measures how strongly a lens bends light?",
          hi: "चश्मे के नुस्ख़े पर '+2 D' या '−1.5 D' लिखा, एक संख्या जो मीटर में फोकस दूरी का व्युत्क्रम। कौन-सी राशि नापती लेंस प्रकाश को कितनी प्रबलता से मोड़ता?",
          mr: "चष्म्याच्या प्रिस्क्रिप्शनवर '+2 D' वा '−1.5 D' लिहिलेले, एक संख्या जी मीटरमधील नाभीय अंतराचा व्यस्तांक. कोणती राशी मोजते भिंग प्रकाश किती प्रबळपणे वाकवते?",
        },
        statement: {
          en: "The power of a lens is the reciprocal of its focal length in metres, measured in dioptres (D) — it is positive for a convex lens and negative for a concave one.",
          hi: "लेंस की क्षमता मीटर में उसकी फोकस दूरी का व्युत्क्रम, डाइऑप्टर (D) में नापी — उत्तल लेंस के लिए धनात्मक और अवतल के लिए ऋणात्मक।",
          mr: "भिंगाची क्षमता म्हणजे मीटरमधील तिच्या नाभीय अंतराचा व्यस्तांक, डायऑप्टर (D) मध्ये मोजलेली — बहिर्वक्र भिंगासाठी धन आणि अंतर्वक्रासाठी ऋण.",
        },
        detail: {
          en: "A short focal length means a strongly bending lens and so a large power — a 25 cm lens is 4 D, while a 1 m lens is only 1 D.",
          hi: "छोटी फोकस दूरी का अर्थ प्रबल मोड़ता लेंस और इसलिए बड़ी क्षमता — 25 सेमी का लेंस 4 D, जबकि 1 मीटर का केवल 1 D।",
          mr: "आखूड नाभीय अंतर म्हणजे प्रबळ वाकवणारे भिंग आणि म्हणून मोठी क्षमता — 25 सेमीचे भिंग 4 D, तर 1 मीटरचे फक्त 1 D.",
        },
        extra: {
          en: "Powers add up when lenses are placed touching, which is exactly how an optician builds an unusual prescription out of a few standard lenses.",
          hi: "लेंस सटाकर रखे जाएँ तो क्षमताएँ जुड़तीं, ठीक इसी से चश्मा-विक्रेता कुछ मानक लेंसों से असामान्य नुस्ख़ा बनाता।",
          mr: "भिंगे चिकटवून ठेवल्यास क्षमता बेरजेने जुळतात, नेमके यामुळेच चष्मेवाला काही प्रमाणित भिंगांतून असामान्य प्रिस्क्रिप्शन बनवतो.",
        },
        pair: {
          left: {
            en: "One over the focal length, in dioptres",
            hi: "फोकस दूरी का व्युत्क्रम, डाइऑप्टर में",
            mr: "नाभीय अंतराचा व्यस्तांक, डायऑप्टरमध्ये",
          },
          right: {
            en: "the power of a lens",
            hi: "लेंस की क्षमता",
            mr: "भिंगाची क्षमता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A shopkeeper fixes a large mirror high in a corner and can watch the whole shop in it, though everyone appears small. A dentist uses a different mirror to see one tooth hugely enlarged. Both are curved mirrors, so why does one shrink everything while the other magnifies?",
          hi: "एक दुकानदार कोने में ऊपर बड़ा दर्पण लगाता और उसमें पूरी दुकान देख लेता, यद्यपि सब छोटे दिखते। एक दंत-चिकित्सक भिन्न दर्पण से एक दाँत बहुत बड़ा देखता। दोनों वक्र दर्पण, तो एक सब छोटा क्यों करता जबकि दूसरा बड़ा?",
          mr: "एक दुकानदार कोपऱ्यात वर मोठा आरसा लावतो आणि त्यात अख्खे दुकान पाहू शकतो, जरी सर्व लहान दिसत. एक दंतवैद्य वेगळ्या आरशाने एक दात खूप मोठा पाहतो. दोन्ही वक्र आरसे, मग एक सर्व लहान का करतो तर दुसरा मोठे?",
        },
        choices: [
          {
            en: "The shop mirror is convex: it bulges outward and diverges the light, so it always gives a small, erect, virtual image — and that shrinking is exactly what packs a wide view into one mirror. The dentist's is concave: held closer to the tooth than its focus, it converges light and gives a magnified, erect, virtual image",
            hi: "दुकान का दर्पण उत्तल: बाहर उभरा और प्रकाश अपसरित करता, अतः सदा छोटा, सीधा, आभासी प्रतिबिंब देता — और वही सिकुड़न एक दर्पण में चौड़ा दृश्य भरती। दंत-चिकित्सक का अवतल: दाँत से उसके फोकस से नज़दीक रखा, प्रकाश अभिसरित कर बड़ा, सीधा, आभासी प्रतिबिंब देता",
            mr: "दुकानाचा आरसा बहिर्वक्र: बाहेर फुगलेला आणि प्रकाश अपसरित करणारा, म्हणून सदैव लहान, सरळ, आभासी प्रतिमा देतो — आणि तेच लहान होणे एका आरशात रुंद दृश्य भरते. दंतवैद्याचा अंतर्वक्र: दातापासून त्याच्या नाभीहून जवळ धरलेला, प्रकाश अभिसरित करून मोठी, सरळ, आभासी प्रतिमा देतो",
          },
          {
            en: "The shop mirror is simply made of thicker glass, which shrinks whatever it shows",
            hi: "दुकान का दर्पण बस मोटे काँच का, जो जो दिखाए उसे छोटा करता",
            mr: "दुकानाचा आरसा फक्त जाड काचेचा, जे दाखवेल ते लहान करणारा",
          },
          {
            en: "The shop mirror is concave and the dentist's is convex, the other way round",
            hi: "दुकान का दर्पण अवतल और दंत-चिकित्सक का उत्तल, उल्टे तरीक़े से",
            mr: "दुकानाचा आरसा अंतर्वक्र आणि दंतवैद्याचा बहिर्वक्र, उलट पद्धतीने",
          },
          {
            en: "Both are the same mirror; only the distance from the wall changes the size",
            hi: "दोनों एक ही दर्पण; केवल दीवार से दूरी आकार बदलती",
            mr: "दोन्ही एकच आरसा; फक्त भिंतीपासूनचे अंतर आकार बदलते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two mirrors are curved in opposite directions, and that single difference decides everything. The shopkeeper's mirror is convex — it bulges outward, like the back of a spoon. Rays arriving on it are spread apart, and the reflected rays only seem to come from a point behind the mirror. So a convex mirror always, without exception, gives an image that is virtual, erect and smaller than the object, no matter where the object stands. That sounds like a drawback until you see what it buys: because everything is shrunk, a very wide slice of the shop — far wider than a flat mirror of the same size could show — is squeezed into the glass. The shrinking is not a flaw; it is the price of the wide field of view, which is exactly why the same design is used for vehicle rear-view mirrors and blind corners on roads. The dentist's mirror is concave — curved inward, like the bowl of a spoon — and it converges light. A concave mirror's image is not fixed: it changes with the object's distance. Held far from an object it makes a real, inverted image, but the dentist deliberately holds it very close to the tooth, nearer than the mirror's focus. In that one position the reflected rays diverge and appear to come from behind the mirror, producing an image that is virtual, erect and magnified — a big, upright picture of the tooth. So the answer is not that one mirror 'is a magnifier' and the other 'is a shrinker' by nature; it is that a convex mirror can only ever diminish, while a concave mirror can magnify provided it is held within its focus. (The wrong answers get it backwards or blame thickness and distance from the wall, neither of which curves a mirror.)",
          hi: "दोनों दर्पण उल्टी दिशाओं में मुड़े, और वही एक अंतर सब तय करता। दुकानदार का दर्पण उत्तल — बाहर उभरा, चम्मच की पीठ जैसा। उस पर आती किरणें फैल जातीं, और परावर्तित किरणें केवल दर्पण के पीछे किसी बिंदु से आती प्रतीत होतीं। अतः उत्तल दर्पण सदा, बिना अपवाद, आभासी, सीधा और वस्तु से छोटा प्रतिबिंब देता, वस्तु चाहे कहीं खड़ी हो। यह कमी लगती जब तक न दिखे यह क्या ख़रीदती: क्योंकि सब सिकुड़ा, दुकान की बहुत चौड़ी फाँक — उसी आकार के सपाट दर्पण से कहीं चौड़ी — काँच में भर जाती। सिकुड़न दोष नहीं; यह चौड़े दृष्टि-क्षेत्र की क़ीमत, ठीक इसी से वही रचना गाड़ी के पश्च-दृश्य दर्पणों और सड़क के अंधे मोड़ों पर। दंत-चिकित्सक का दर्पण अवतल — अंदर मुड़ा, चम्मच के कटोरे जैसा — और प्रकाश अभिसरित करता। अवतल दर्पण का प्रतिबिंब नियत नहीं: वस्तु की दूरी से बदलता। वस्तु से दूर रखे तो वास्तविक, उल्टा प्रतिबिंब बनाता, पर दंत-चिकित्सक इसे जानबूझकर दाँत के बहुत पास, दर्पण के फोकस से नज़दीक रखता। उस एक स्थिति में परावर्तित किरणें अपसरित होकर दर्पण के पीछे से आती प्रतीत होतीं, और आभासी, सीधा तथा बड़ा प्रतिबिंब बनता — दाँत का बड़ा, सीधा चित्र। अतः उत्तर यह नहीं कि एक दर्पण स्वभाव से 'बड़ा करने वाला' और दूसरा 'छोटा करने वाला'; यह कि उत्तल दर्पण केवल छोटा ही कर सकता, जबकि अवतल दर्पण बड़ा कर सकता बशर्ते अपने फोकस के भीतर रखा जाए। (ग़लत उत्तर इसे उल्टा करते या मोटाई और दीवार से दूरी को दोष देते, जिनमें से कोई दर्पण को मोड़ता नहीं।)",
          mr: "दोन्ही आरसे उलट्या दिशांना वळलेले, आणि तोच एक फरक सर्व ठरवतो. दुकानदाराचा आरसा बहिर्वक्र — बाहेर फुगलेला, चमच्याच्या पाठीसारखा. त्यावर येणारे किरण पसरतात, आणि परावर्तित किरण केवळ आरशामागील एका बिंदूतून येताना भासतात. म्हणून बहिर्वक्र आरसा सदैव, अपवादाविना, आभासी, सरळ आणि वस्तूहून लहान प्रतिमा देतो, वस्तू कुठेही असो. हा तोटा वाटतो जोवर ते काय विकत घेते हे दिसत नाही: कारण सर्व लहान झाले, दुकानाची खूप रुंद फाळी — त्याच आकाराच्या सपाट आरशाहून कितीतरी रुंद — काचेत दाटते. लहान होणे दोष नाही; ती रुंद दृष्टिक्षेत्राची किंमत, नेमके म्हणूनच तीच रचना गाडीच्या मागील-दृश्य आरशांत आणि रस्त्याच्या आंधळ्या वळणांवर. दंतवैद्याचा आरसा अंतर्वक्र — आत वळलेला, चमच्याच्या वाडग्यासारखा — आणि प्रकाश अभिसरित करतो. अंतर्वक्र आरशाची प्रतिमा ठरलेली नाही: वस्तूच्या अंतरानुसार बदलते. वस्तूपासून दूर धरल्यास खरी, उलटी प्रतिमा बनवतो, पण दंतवैद्य तो मुद्दाम दाताच्या खूप जवळ, आरशाच्या नाभीहून जवळ धरतो. त्या एका स्थानी परावर्तित किरण अपसरित होऊन आरशामागून येताना भासतात, आणि आभासी, सरळ व मोठी प्रतिमा बनते — दाताचे मोठे, सरळ चित्र. म्हणून उत्तर हे नाही की एक आरसा स्वभावाने 'मोठे करणारा' आणि दुसरा 'लहान करणारा'; तर हे की बहिर्वक्र आरसा फक्त लहानच करू शकतो, तर अंतर्वक्र आरसा मोठे करू शकतो जर आपल्या नाभीच्या आत धरला. (चुकीची उत्तरे हे उलटे करतात वा जाडी आणि भिंतीपासूनच्या अंतराला दोष देतात, ज्यांपैकी कोणतेही आरसा वाकवत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A coin lying at the bottom of a bucket of water appears to sit higher than it really does, so a child reaching for it grabs at empty water. The coin has not moved and the eye is not faulty. Explain precisely why the water lies to the eye, and what would happen to the illusion if the bucket held a liquid that bent light even more strongly.",
          hi: "पानी की बाल्टी के तल पर पड़ा सिक्का वास्तव से ऊँचा बैठा प्रतीत होता, अतः उसे पकड़ने बढ़ता बच्चा ख़ाली पानी पकड़ता। सिक्का हिला नहीं और आँख में दोष नहीं। ठीक-ठीक समझाओ पानी आँख से झूठ क्यों बोलता, और यदि बाल्टी में और प्रबलता से प्रकाश मोड़ता द्रव हो तो भ्रम का क्या होगा।",
          mr: "पाण्याच्या बादलीच्या तळाशी पडलेले नाणे प्रत्यक्षाहून वर बसल्यासारखे भासते, म्हणून ते पकडायला जाणारे मूल रिकामे पाणी पकडते. नाणे हललेले नाही आणि डोळ्यात दोष नाही. नेमके समजावा पाणी डोळ्याशी खोटे का बोलते, आणि बादलीत अधिक प्रबळपणे प्रकाश वाकवणारा द्रव असल्यास भ्रमाचे काय होईल.",
        },
        choices: [
          {
            en: "Light from the coin slows in water and, on leaving the water into the rarer air, bends away from the normal. The eye cannot know a ray has bent — it traces every ray back in a straight line, and those backward straight lines meet at a point above the real coin, so the coin is seen raised. A liquid with a higher refractive index would bend the rays more, making the apparent rise greater still",
            hi: "सिक्के से चला प्रकाश पानी में धीमा, और पानी से विरल हवा में निकलते अभिलंब से दूर मुड़ता। आँख जान नहीं सकती कि किरण मुड़ी — वह हर किरण को सीधी रेखा में पीछे खींचती, और वे पीछे की सीधी रेखाएँ असली सिक्के से ऊपर एक बिंदु पर मिलतीं, अतः सिक्का उठा दिखता। ऊँचे अपवर्तनांक का द्रव किरणें और मोड़ता, अतः प्रतीत उठान और भी बड़ी",
            mr: "नाण्यापासून निघालेला प्रकाश पाण्यात मंदावतो, आणि पाण्यातून विरळ हवेत बाहेर पडताना स्तंभिकेपासून दूर वाकतो. डोळा जाणू शकत नाही की किरण वाकला — तो प्रत्येक किरण सरळ रेषेत मागे नेतो, आणि त्या मागच्या सरळ रेषा खऱ्या नाण्याहून वरच्या एका बिंदूवर भेटतात, म्हणून नाणे उंचावलेले दिसते. अधिक अपवर्तनांकाचा द्रव किरण अधिक वाकवेल, म्हणून भासणारी उंची आणखी मोठी",
          },
          {
            en: "The water physically pushes the coin upward, so it really is higher than the bucket's floor",
            hi: "पानी सिक्के को भौतिक रूप से ऊपर धकेलता, अतः वह सचमुच बाल्टी के तल से ऊँचा",
            mr: "पाणी नाण्याला भौतिकदृष्ट्या वर ढकलते, म्हणून ते खरोखर बादलीच्या तळाहून वर",
          },
          {
            en: "The eye's lens is confused by the wetness, and a stronger liquid would remove the illusion",
            hi: "आँख का लेंस गीलेपन से भ्रमित, और प्रबल द्रव भ्रम मिटा देता",
            mr: "डोळ्याचे भिंग ओलेपणाने गोंधळलेले, आणि प्रबळ द्रव भ्रम मिटवेल",
          },
          {
            en: "Light travels in curves inside water, and the curve stops the moment it leaves the surface",
            hi: "प्रकाश पानी के भीतर वक्रों में चलता, और सतह छोड़ते ही वक्र रुक जाता",
            mr: "प्रकाश पाण्याच्या आत वक्रांत चालतो, आणि पृष्ठ सोडताच वक्र थांबतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Nothing is wrong with the coin, the water or the eye — the illusion is built entirely out of refraction plus one honest assumption the eye cannot help making. Start with the light. Rays leave the coin in all directions and travel up through the water, which is optically denser than air, so inside the water they move more slowly. At the water's surface each ray crosses into the rarer air, speeds up, and therefore bends away from the normal. This is ordinary refraction, and it is real and measurable. Now comes the crucial step, which is about seeing rather than about light. The eye and brain have no way of detecting that a ray changed direction somewhere along its path; they can only receive the ray that finally arrives and assume, as they always do, that it travelled in a straight line all the way. So the brain traces each arriving ray straight backwards. Because the rays were bent away from the normal on leaving the water, these backward extensions do not reach down to the real coin — they cross each other at a point higher up. That crossing point is where the brain places the coin: a virtual image, sitting above the true position. The coin has not risen; the straight-line assumption has been violated, and the error shows up as apparent depth being less than real depth. The child, reaching for what the eye reports, grabs above the coin. The extension follows directly. How far the rays bend on leaving depends on how different the two media are — that is, on the refractive index. A liquid with a higher refractive index slows light more, bends the emerging rays more sharply away from the normal, and so pushes the backward extensions' meeting point higher still. The illusion would be stronger, not weaker. This same reasoning explains the pencil that looks broken at the water line, the apparent flattening of a pond's floor, and why a fisherman aiming a spear at a fish must aim below where the fish appears. (The wrong answers invoke a physical push, a confused eye, or curved travel inside water — but light goes perfectly straight within a uniform medium and bends only at the boundary.)",
            hi: "सिक्के, पानी या आँख में कुछ ग़लत नहीं — भ्रम पूरा अपवर्तन और एक ईमानदार मान्यता से बना जो आँख किए बिना रह नहीं सकती। प्रकाश से शुरू करो। किरणें सिक्के से हर दिशा में निकलतीं और पानी से ऊपर चलतीं, जो हवा से प्रकाशिकीय रूप से सघन, अतः पानी के भीतर वे धीमे चलतीं। पानी की सतह पर हर किरण विरल हवा में पार करती, तेज़ होती, और इसलिए अभिलंब से दूर मुड़ती। यह साधारण अपवर्तन, और यह असली तथा मापनीय। अब मुख्य चरण, जो देखने के बारे में, प्रकाश के नहीं। आँख और मस्तिष्क के पास यह भाँपने का कोई उपाय नहीं कि किरण ने रास्ते में कहीं दिशा बदली; वे केवल अंत में पहुँची किरण पा सकते और मान लेते, जैसा सदा करते, कि वह पूरे रास्ते सीधी रेखा में चली। अतः मस्तिष्क हर आती किरण को सीधा पीछे खींचता। क्योंकि पानी छोड़ते किरणें अभिलंब से दूर मुड़ीं, ये पीछे के विस्तार असली सिक्के तक नीचे नहीं पहुँचते — वे ऊपर एक बिंदु पर एक-दूसरे को काटते। वही कटान-बिंदु जहाँ मस्तिष्क सिक्का रखता: आभासी प्रतिबिंब, असली स्थिति से ऊपर बैठा। सिक्का उठा नहीं; सीधी-रेखा मान्यता टूटी, और त्रुटि प्रतीत गहराई के असली गहराई से कम होने में दिखती। बच्चा, जो आँख बताती उसे पकड़ने बढ़ता, सिक्के से ऊपर पकड़ता। विस्तार सीधा निकलता। निकलते किरणें कितनी मुड़तीं यह इस पर कि दोनों माध्यम कितने भिन्न — यानी अपवर्तनांक पर। ऊँचे अपवर्तनांक का द्रव प्रकाश अधिक धीमा करता, निकलती किरणें अभिलंब से और तीखी मोड़ता, और इस तरह पीछे के विस्तारों का मिलन-बिंदु और ऊपर धकेलता। भ्रम प्रबल होगा, दुर्बल नहीं। यही तर्क पानी की रेखा पर टूटी दिखती पेंसिल, तालाब के तल का प्रतीत चपटापन, और क्यों मछली पर भाला ताकता मछुआरा मछली दिखने से नीचे ताके — सब समझाता। (ग़लत उत्तर भौतिक धक्का, भ्रमित आँख, या पानी के भीतर वक्र यात्रा बुलाते — पर प्रकाश एकसमान माध्यम में बिलकुल सीधा चलता और केवल सीमा पर मुड़ता।)",
          mr: "नाण्यात, पाण्यात वा डोळ्यात काही चुकीचे नाही — भ्रम पूर्णपणे अपवर्तन आणि एका प्रामाणिक गृहीतकातून बनलेला जे डोळा केल्याविना राहू शकत नाही. प्रकाशापासून सुरू करा. किरण नाण्यापासून सर्व दिशांना निघतात आणि पाण्यातून वर जातात, जे हवेहून प्रकाशीयदृष्ट्या घन, म्हणून पाण्याच्या आत ते अधिक मंद चालतात. पाण्याच्या पृष्ठावर प्रत्येक किरण विरळ हवेत ओलांडतो, वेगावतो, आणि म्हणून स्तंभिकेपासून दूर वाकतो. हे सामान्य अपवर्तन, आणि ते खरे आणि मोजण्याजोगे. आता महत्त्वाची पायरी, जी पाहण्याबद्दल, प्रकाशाबद्दल नाही. डोळा आणि मेंदूकडे हे ओळखण्याचा कोणताही मार्ग नाही की किरणाने वाटेत कुठेतरी दिशा बदलली; ते फक्त शेवटी पोहोचलेला किरण मिळवू शकतात आणि गृहीत धरतात, जसे सदैव करतात, की तो अख्खा मार्ग सरळ रेषेत चालला. म्हणून मेंदू प्रत्येक येणारा किरण सरळ मागे नेतो. कारण पाणी सोडताना किरण स्तंभिकेपासून दूर वाकले, हे मागचे विस्तार खऱ्या नाण्यापर्यंत खाली पोहोचत नाहीत — ते वरच्या एका बिंदूवर एकमेकांना छेदतात. तोच छेदन-बिंदू जिथे मेंदू नाणे ठेवतो: आभासी प्रतिमा, खऱ्या स्थानाहून वर बसलेली. नाणे वर आले नाही; सरळ-रेषेचे गृहीतक मोडले, आणि चूक भासणारी खोली खऱ्या खोलीहून कमी असण्यात दिसते. मूल, जे डोळा सांगतो ते पकडायला जाते, नाण्याहून वर पकडते. विस्तार थेट निघतो. बाहेर पडताना किरण किती वाकतील हे यावर की दोन्ही माध्यमे किती वेगळी — म्हणजे अपवर्तनांकावर. अधिक अपवर्तनांकाचा द्रव प्रकाश अधिक मंदावतो, बाहेर पडणारे किरण स्तंभिकेपासून अधिक तीव्र वाकवतो, आणि अशा प्रकारे मागच्या विस्तारांचा मिलन-बिंदू आणखी वर ढकलतो. भ्रम प्रबळ होईल, दुर्बळ नाही. हेच तर्क पाण्याच्या रेषेवर मोडलेली दिसणारी पेन्सिल, तळ्याच्या तळाचा भासणारा चपटेपणा, आणि माशावर भाला रोखणाऱ्या कोळ्याने मासा दिसतो त्याहून खाली का रोखावे — सर्व समजावते. (चुकीची उत्तरे भौतिक धक्का, गोंधळलेला डोळा, वा पाण्याच्या आत वक्र प्रवास सुचवतात — पण प्रकाश एकसमान माध्यमात अगदी सरळ चालतो आणि फक्त सीमेवर वाकतो.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 10 — The Human Eye and the Colourful World                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-human-eye",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 10 — The Human Eye and the Colourful World",
      hi: "अध्याय 10 — मानव नेत्र तथा रंगबिरंगा संसार",
      mr: "प्रकरण 10 — मानवी डोळा आणि रंगीबेरंगी जग",
    },
    name: {
      en: "The Human Eye and the Colourful World",
      hi: "मानव नेत्र तथा रंगबिरंगा संसार",
      mr: "मानवी डोळा आणि रंगीबेरंगी जग",
    },
    summary: {
      en: "A living lens that refocuses itself, and the two defects a spectacle-maker corrects; then the sky's own optics — white light split into seven colours by a prism, the air bending starlight until it twinkles, and the blue of noon and the red of sunset both explained by which colours scatter.",
      hi: "स्वयं फोकस बदलता जीवित लेंस, और चश्मा बनाने वाला जिन दो दोषों को सुधारता; फिर आकाश की अपनी प्रकाशिकी — प्रिज़्म से सात रंगों में बँटा श्वेत प्रकाश, तारों का प्रकाश मोड़ती हवा जिससे वे टिमटिमाते, और दोपहर का नीला तथा सूर्यास्त का लाल दोनों इससे समझे कि कौन-से रंग प्रकीर्णित।",
      mr: "स्वतःचा नाभिबिंदू बदलणारे जिवंत भिंग, आणि चष्मेवाला ज्या दोन दोषांची दुरुस्ती करतो; मग आकाशाचे स्वतःचे प्रकाशशास्त्र — लोलकाने सात रंगांत विभागलेला श्वेत प्रकाश, ताऱ्यांचा प्रकाश वाकवणारी हवा ज्यामुळे ते लुकलुकतात, आणि दुपारचा निळा व सूर्यास्ताचा लाल दोन्ही कोणते रंग विखुरतात यावरून समजलेले.",
    },
    position: 10,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "accommodation",
        name: {
          en: "Accommodation of the eye",
          hi: "नेत्र का समंजन",
          mr: "डोळ्याचे समायोजन",
        },
        kind: "process",
        prompt: {
          en: "Look up from a book to a distant hill and the view is sharp within a moment, though the retina never moves. Which adjustment, made by muscles changing the lens's curvature, allows this?",
          hi: "किताब से नज़र उठाकर दूर पहाड़ी देखो और दृश्य पल भर में साफ़, यद्यपि दृष्टिपटल कभी हिलता नहीं। लेंस की वक्रता बदलती पेशियों द्वारा किया कौन-सा समायोजन यह संभव करता?",
          mr: "पुस्तकावरून नजर उचलून दूरची टेकडी पाहा आणि दृश्य क्षणात स्पष्ट, जरी दृष्टिपटल कधी हलत नाही. भिंगाची वक्रता बदलणाऱ्या स्नायूंनी केलेले कोणते समायोजन हे शक्य करते?",
        },
        statement: {
          en: "Accommodation is the eye's power to change the focal length of its lens — ciliary muscles thicken the lens for near objects and slacken to flatten it for distant ones — so the image always lands on the retina.",
          hi: "समंजन नेत्र की अपने लेंस की फोकस दूरी बदलने की शक्ति — पक्ष्माभी पेशियाँ पास की वस्तुओं के लिए लेंस मोटा करतीं और दूर की के लिए ढीली होकर चपटा — ताकि प्रतिबिंब सदा दृष्टिपटल पर गिरे।",
          mr: "समायोजन म्हणजे डोळ्याची आपल्या भिंगाचे नाभीय अंतर बदलण्याची शक्ती — पक्ष्माभी स्नायू जवळच्या वस्तूंसाठी भिंग जाड करतात आणि दूरच्यांसाठी सैल होऊन सपाट — जेणेकरून प्रतिमा सदैव दृष्टिपटलावर पडते.",
        },
        detail: {
          en: "There is a limit: the nearest point of distinct vision for a normal eye is about 25 cm, and holding a book closer than that only blurs it.",
          hi: "एक सीमा है: सामान्य नेत्र के लिए स्पष्ट दृष्टि का निकटतम बिंदु लगभग 25 सेमी, और किताब उससे नज़दीक रखना उसे केवल धुँधला करता।",
          mr: "एक मर्यादा आहे: सामान्य डोळ्यासाठी स्पष्ट दृष्टीचा जवळचा बिंदू सुमारे 25 सेमी, आणि पुस्तक त्याहून जवळ धरणे ते फक्त अस्पष्ट करते.",
        },
        extra: {
          en: "With age the lens stiffens and the muscles weaken, so this range shrinks — the reason many older people need reading glasses even with otherwise sound sight.",
          hi: "उम्र के साथ लेंस कड़ा होता और पेशियाँ दुर्बल, अतः यह परास सिकुड़ती — इसी से कई बुज़ुर्गों को अन्यथा ठीक दृष्टि होते भी पढ़ने का चश्मा चाहिए।",
          mr: "वयाबरोबर भिंग कडक होते आणि स्नायू दुर्बळ, म्हणून ही व्याप्ती आकुंचते — म्हणूनच अनेक वृद्धांना एरवी चांगली दृष्टी असूनही वाचनाचा चष्मा लागतो.",
        },
        pair: {
          left: {
            en: "Lens reshaped to refocus",
            hi: "फिर फोकस करने लेंस का आकार बदलना",
            mr: "पुन्हा नाभिबिंदू साधण्यास भिंगाचा आकार बदलणे",
          },
          right: {
            en: "accommodation",
            hi: "समंजन",
            mr: "समायोजन",
          },
        },
      },
      {
        id: "myopia",
        name: {
          en: "Myopia",
          hi: "निकट-दृष्टि दोष",
          mr: "निकटदृष्टिता",
        },
        kind: "defect",
        prompt: {
          en: "A student reads comfortably but cannot make out the blackboard, because the image of a distant object forms in front of the retina instead of on it. Which defect is this, and which lens corrects it?",
          hi: "एक छात्र आराम से पढ़ता पर श्यामपट्ट नहीं पढ़ पाता, क्योंकि दूर की वस्तु का प्रतिबिंब दृष्टिपटल पर नहीं, उसके आगे बनता। यह कौन-सा दोष, और कौन-सा लेंस इसे सुधारता?",
          mr: "एक विद्यार्थी आरामात वाचतो पण फळा वाचू शकत नाही, कारण दूरच्या वस्तूची प्रतिमा दृष्टिपटलावर नव्हे तर त्याच्यापुढे बनते. हा कोणता दोष, आणि कोणते भिंग तो दुरुस्त करते?",
        },
        statement: {
          en: "Myopia, or short-sightedness, is the defect in which distant objects focus in front of the retina, and it is corrected with a concave lens of suitable power.",
          hi: "निकट-दृष्टि दोष वह जिसमें दूर की वस्तुएँ दृष्टिपटल के आगे फोकस होतीं, और उपयुक्त क्षमता के अवतल लेंस से सुधारा जाता।",
          mr: "निकटदृष्टिता म्हणजे तो दोष ज्यात दूरच्या वस्तू दृष्टिपटलापुढे नाभिबिंदू साधतात, आणि योग्य क्षमतेच्या अंतर्वक्र भिंगाने दुरुस्त केला जातो.",
        },
        detail: {
          en: "It arises when the eyeball has grown too long or the lens curves too strongly, so the eye bends light more than it needs to.",
          hi: "यह तब उठता जब नेत्रगोलक बहुत लंबा हो गया या लेंस बहुत प्रबल वक्र, अतः नेत्र आवश्यकता से अधिक प्रकाश मोड़ता।",
          mr: "हा तेव्हा उद्भवतो जेव्हा नेत्रगोल फार लांब वाढला वा भिंग फार प्रबळ वक्र, म्हणून डोळा गरजेहून अधिक प्रकाश वाकवतो.",
        },
        extra: {
          en: "The correcting lens has a negative power, because it must first spread the rays a little so the eye's own over-strong focusing lands them exactly on the retina.",
          hi: "सुधारक लेंस की क्षमता ऋणात्मक, क्योंकि उसे पहले किरणें थोड़ी फैलानी होतीं ताकि नेत्र का अपना अति-प्रबल फोकस उन्हें ठीक दृष्टिपटल पर उतारे।",
          mr: "दुरुस्त करणाऱ्या भिंगाची क्षमता ऋण, कारण त्याने आधी किरण थोडे पसरवावे लागतात जेणेकरून डोळ्याचे स्वतःचे अति-प्रबळ नाभीकरण त्यांना नेमके दृष्टिपटलावर उतरवते.",
        },
        pair: {
          left: {
            en: "Distant blur, image before the retina",
            hi: "दूर धुँधला, प्रतिबिंब दृष्टिपटल से पहले",
            mr: "दूरचे अस्पष्ट, प्रतिमा दृष्टिपटलाआधी",
          },
          right: {
            en: "myopia",
            hi: "निकट-दृष्टि दोष",
            mr: "निकटदृष्टिता",
          },
        },
      },
      {
        id: "hypermetropia",
        name: {
          en: "Hypermetropia",
          hi: "दूर-दृष्टि दोष",
          mr: "दूरदृष्टिता",
        },
        kind: "defect",
        prompt: {
          en: "An elder can read a signboard across the street but must hold the newspaper at arm's length, because near objects focus behind the retina. Which defect is this, and which lens corrects it?",
          hi: "एक बुज़ुर्ग सड़क पार का साइनबोर्ड पढ़ लेता पर अख़बार हाथ भर दूर रखना पड़ता, क्योंकि पास की वस्तुएँ दृष्टिपटल के पीछे फोकस होतीं। यह कौन-सा दोष, और कौन-सा लेंस इसे सुधारता?",
          mr: "एक वृद्ध रस्त्यापलीकडचा फलक वाचू शकतो पण वर्तमानपत्र हातभर दूर धरावे लागते, कारण जवळच्या वस्तू दृष्टिपटलामागे नाभिबिंदू साधतात. हा कोणता दोष, आणि कोणते भिंग तो दुरुस्त करते?",
        },
        statement: {
          en: "Hypermetropia, or long-sightedness, is the defect in which nearby objects focus behind the retina, and it is corrected with a convex lens of suitable power.",
          hi: "दूर-दृष्टि दोष वह जिसमें पास की वस्तुएँ दृष्टिपटल के पीछे फोकस होतीं, और उपयुक्त क्षमता के उत्तल लेंस से सुधारा जाता।",
          mr: "दूरदृष्टिता म्हणजे तो दोष ज्यात जवळच्या वस्तू दृष्टिपटलामागे नाभिबिंदू साधतात, आणि योग्य क्षमतेच्या बहिर्वक्र भिंगाने दुरुस्त केला जातो.",
        },
        detail: {
          en: "It arises when the eyeball is too short or the lens too flat, so the eye does not bend light enough to bring near objects to a focus in time.",
          hi: "यह तब उठता जब नेत्रगोलक बहुत छोटा या लेंस बहुत चपटा, अतः नेत्र पास की वस्तुओं को समय पर फोकस करने भर प्रकाश नहीं मोड़ता।",
          mr: "हा तेव्हा उद्भवतो जेव्हा नेत्रगोल फार आखूड वा भिंग फार सपाट, म्हणून डोळा जवळच्या वस्तू वेळेत नाभिबिंदूवर आणण्याइतका प्रकाश वाकवत नाही.",
        },
        extra: {
          en: "The correcting lens has a positive power, converging the rays a little before they enter so the eye's weaker focusing is topped up to just enough.",
          hi: "सुधारक लेंस की क्षमता धनात्मक, प्रवेश से पहले किरणें थोड़ी अभिसरित करता ताकि नेत्र का दुर्बल फोकस ठीक भर तक पूरा हो।",
          mr: "दुरुस्त करणाऱ्या भिंगाची क्षमता धन, प्रवेशापूर्वी किरण थोडे अभिसरित करते जेणेकरून डोळ्याचे दुर्बळ नाभीकरण नेमके पुरेसे भरून निघते.",
        },
        pair: {
          left: {
            en: "Near blur, image beyond the retina",
            hi: "पास धुँधला, प्रतिबिंब दृष्टिपटल से परे",
            mr: "जवळचे अस्पष्ट, प्रतिमा दृष्टिपटलापलीकडे",
          },
          right: {
            en: "hypermetropia",
            hi: "दूर-दृष्टि दोष",
            mr: "दूरदृष्टिता",
          },
        },
      },
      {
        id: "dispersion",
        name: {
          en: "Dispersion through a prism",
          hi: "प्रिज़्म से विक्षेपण",
          mr: "लोलकातून अपस्करण",
        },
        kind: "process",
        prompt: {
          en: "A narrow beam of sunlight entering a glass prism leaves it fanned into a band running from violet to red. Which splitting of white light into its colours is this, and why does it happen?",
          hi: "काँच के प्रिज़्म में घुसती धूप की पतली किरण-पुंज बैंगनी से लाल तक फैली पट्टी बनकर निकलती। श्वेत प्रकाश का रंगों में यह कौन-सा बँटना, और क्यों होता?",
          mr: "काचेच्या लोलकात शिरणारा सूर्यप्रकाशाचा अरुंद झोत जांभळ्यापासून लालपर्यंत पसरलेल्या पट्ट्यात बाहेर पडतो. श्वेत प्रकाशाचे रंगांत हे कोणते विभाजन, आणि का घडते?",
        },
        statement: {
          en: "Dispersion is the splitting of white light into its component colours by a prism, and it happens because each colour is bent through a different angle — violet most and red least.",
          hi: "विक्षेपण प्रिज़्म द्वारा श्वेत प्रकाश का उसके घटक रंगों में बँटना, और होता क्योंकि हर रंग भिन्न कोण से मुड़ता — बैंगनी सर्वाधिक और लाल सबसे कम।",
          mr: "अपस्करण म्हणजे लोलकाने श्वेत प्रकाशाचे त्याच्या घटक रंगांत विभाजन, आणि ते घडते कारण प्रत्येक रंग वेगळ्या कोनातून वाकतो — जांभळा सर्वाधिक आणि लाल सर्वांत कमी.",
        },
        detail: {
          en: "A second, inverted prism placed after the first recombines the band back into white light, proving the prism only separated colours already present, and never made them.",
          hi: "पहले के बाद रखा दूसरा, उल्टा प्रिज़्म पट्टी को फिर श्वेत प्रकाश में जोड़ देता, सिद्ध करता कि प्रिज़्म ने पहले से मौजूद रंग केवल अलग किए, बनाए कभी नहीं।",
          mr: "पहिल्यानंतर ठेवलेला दुसरा, उलटा लोलक पट्टी पुन्हा श्वेत प्रकाशात जोडतो, सिद्ध करत की लोलकाने आधीच असलेले रंग फक्त वेगळे केले, बनवले कधीच नाहीत.",
        },
        extra: {
          en: "A rainbow is this same effect performed by raindrops, each drop refracting the sunlight, reflecting it inside, and refracting it out again.",
          hi: "इंद्रधनुष वही प्रभाव वर्षा-बूँदों द्वारा किया, हर बूँद धूप का अपवर्तन करती, भीतर परावर्तित करती, और फिर बाहर अपवर्तित।",
          mr: "इंद्रधनुष्य हाच परिणाम पावसाच्या थेंबांनी केलेला, प्रत्येक थेंब सूर्यप्रकाशाचे अपवर्तन करतो, आत परावर्तित करतो, आणि पुन्हा बाहेर अपवर्तित.",
        },
        pair: {
          left: {
            en: "White light fanned into colours",
            hi: "श्वेत प्रकाश रंगों में फैला",
            mr: "श्वेत प्रकाश रंगांत पसरलेला",
          },
          right: {
            en: "dispersion",
            hi: "विक्षेपण",
            mr: "अपस्करण",
          },
        },
      },
      {
        id: "atmospheric-refraction",
        name: {
          en: "Atmospheric refraction",
          hi: "वायुमंडलीय अपवर्तन",
          mr: "वातावरणीय अपवर्तन",
        },
        kind: "process",
        prompt: {
          en: "Stars seem to twinkle, the sun is visible a couple of minutes before it actually rises, and hot air above a road makes distant objects shimmer. Which bending of light by air of changing density explains all three?",
          hi: "तारे टिमटिमाते प्रतीत होते, सूर्य वास्तव में उगने से कुछ मिनट पहले दिख जाता, और सड़क के ऊपर गरम हवा दूर की वस्तुएँ लहराती दिखाती। बदलते घनत्व की हवा द्वारा प्रकाश का कौन-सा मुड़ना तीनों समझाता?",
          mr: "तारे लुकलुकताना भासतात, सूर्य प्रत्यक्ष उगवण्याआधी काही मिनिटे दिसतो, आणि रस्त्यावरील तप्त हवा दूरच्या वस्तू थरथरताना दाखवते. बदलत्या घनतेच्या हवेने प्रकाशाचे कोणते वाकणे तिन्ही समजावते?",
        },
        statement: {
          en: "Atmospheric refraction is the bending of light as it passes through air layers of different density, and it makes stars twinkle, advances sunrise, delays sunset and produces the shimmer above hot ground.",
          hi: "वायुमंडलीय अपवर्तन भिन्न घनत्व की वायु-परतों से गुज़रते प्रकाश का मुड़ना, और यह तारों को टिमटिमाता, सूर्योदय जल्दी करता, सूर्यास्त देर से, और गरम ज़मीन के ऊपर लहर बनाता।",
          mr: "वातावरणीय अपवर्तन म्हणजे वेगळ्या घनतेच्या हवेच्या थरांतून जाताना प्रकाशाचे वाकणे, आणि ते ताऱ्यांना लुकलुकवते, सूर्योदय लवकर करते, सूर्यास्त उशिरा, आणि तप्त जमिनीवर थरथर निर्माण करते.",
        },
        detail: {
          en: "The air's density keeps shifting as it is stirred and heated, so a star's light arrives along a slightly different path each instant, and its brightness seems to flicker.",
          hi: "हवा का घनत्व हिलने-गरम होने से बदलता रहता, अतः तारे का प्रकाश हर पल थोड़े भिन्न पथ से आता, और उसकी चमक झिलमिलाती प्रतीत होती।",
          mr: "हवेची घनता ढवळल्याने-तापल्याने बदलत राहते, म्हणून ताऱ्याचा प्रकाश प्रत्येक क्षणी थोड्या वेगळ्या मार्गाने येतो, आणि त्याची तेजस्विता लुकलुकल्यासारखी भासते.",
        },
        extra: {
          en: "Planets do not twinkle, because they are near enough to appear as tiny discs rather than points, and the flickers from all their parts average out.",
          hi: "ग्रह नहीं टिमटिमाते, क्योंकि वे इतने पास कि बिंदु नहीं बल्कि नन्ही चकतियों जैसे दिखते, और उनके सब भागों की झिलमिल औसत में मिट जाती।",
          mr: "ग्रह लुकलुकत नाहीत, कारण ते इतके जवळ की बिंदू नव्हे तर लहान चकत्यांसारखे दिसतात, आणि त्यांच्या सर्व भागांची लुकलुक सरासरीत मिटते.",
        },
        pair: {
          left: {
            en: "Air layers bending starlight",
            hi: "तारों का प्रकाश मोड़तीं वायु-परतें",
            mr: "ताऱ्यांचा प्रकाश वाकवणारे हवेचे थर",
          },
          right: {
            en: "atmospheric refraction",
            hi: "वायुमंडलीय अपवर्तन",
            mr: "वातावरणीय अपवर्तन",
          },
        },
      },
      {
        id: "scattering",
        name: {
          en: "Scattering of light",
          hi: "प्रकाश का प्रकीर्णन",
          mr: "प्रकाशाचे विखुरणे",
        },
        kind: "process",
        prompt: {
          en: "The midday sky is blue, the setting sun is red, and a beam through dusty air shows up as a visible shaft. Which throwing of light in all directions by small particles explains these together?",
          hi: "दोपहर का आकाश नीला, डूबता सूर्य लाल, और धूल भरी हवा से गुज़रता किरण-पुंज दिखती लकीर बनता। छोटे कणों द्वारा प्रकाश का हर दिशा में कौन-सा फेंका जाना ये साथ समझाता?",
          mr: "दुपारचे आकाश निळे, मावळता सूर्य लाल, आणि धूळभरल्या हवेतून जाणारा झोत दिसणारी रेघ बनतो. लहान कणांनी प्रकाश सर्व दिशांना कोणत्या प्रकारे फेकला जाणे हे एकत्र समजावते?",
        },
        statement: {
          en: "Scattering is the throwing of light in all directions by particles in its path, and because shorter wavelengths scatter far more strongly, blue is scattered most and red least.",
          hi: "प्रकीर्णन पथ के कणों द्वारा प्रकाश का हर दिशा में फेंका जाना, और क्योंकि छोटी तरंगदैर्घ्य कहीं प्रबलता से प्रकीर्णित, नीला सर्वाधिक और लाल सबसे कम प्रकीर्णित।",
          mr: "विखुरणे म्हणजे मार्गातील कणांनी प्रकाश सर्व दिशांना फेकला जाणे, आणि लहान तरंगलांबी कितीतरी प्रबळपणे विखुरत असल्याने, निळा सर्वाधिक आणि लाल सर्वांत कमी विखुरतो.",
        },
        detail: {
          en: "The sky is blue because the air scatters blue light down to us from every part of the sky, while the sun looks white or yellow because the rest comes straight through.",
          hi: "आकाश नीला क्योंकि हवा आकाश के हर भाग से नीला प्रकाश हम तक प्रकीर्णित करती, जबकि सूर्य श्वेत या पीला दिखता क्योंकि शेष सीधा चला आता।",
          mr: "आकाश निळे कारण हवा आकाशाच्या प्रत्येक भागातून निळा प्रकाश आपल्यापर्यंत विखुरते, तर सूर्य श्वेत वा पिवळा दिसतो कारण उरलेला सरळ येतो.",
        },
        extra: {
          en: "The Tyndall effect is this same scattering made visible in a colloid — a torch beam turns into a bright shaft when it crosses smoky or misty air.",
          hi: "टिंडल प्रभाव वही प्रकीर्णन कोलॉइड में दिखाई पड़ता — टॉर्च का पुंज धुएँ या कोहरे भरी हवा पार करते चमकती लकीर बन जाता।",
          mr: "टिंडल परिणाम म्हणजे तेच विखुरणे कलिलात दृश्य झालेले — बॅटरीचा झोत धुरकट वा धुक्याच्या हवेतून जाताना तेजस्वी रेघ बनतो.",
        },
        pair: {
          left: {
            en: "Small particles throwing light everywhere",
            hi: "छोटे कण प्रकाश हर ओर फेंकें",
            mr: "लहान कण प्रकाश सर्वत्र फेकतात",
          },
          right: {
            en: "scattering",
            hi: "प्रकीर्णन",
            mr: "विखुरणे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A boy who sits at the back of the class cannot read the blackboard but reads his book easily. His grandfather can read the same blackboard from the doorway yet holds the newspaper at arm's length. The optician gives the boy a lens marked −2 D and the grandfather one marked +2 D. Explain both defects and why the corrections are opposite.",
          hi: "कक्षा में पीछे बैठा एक लड़का श्यामपट्ट नहीं पढ़ पाता पर अपनी किताब आसानी से पढ़ता। उसके दादा वही श्यामपट्ट दरवाज़े से पढ़ लेते पर अख़बार हाथ भर दूर रखते। चश्मा-विक्रेता लड़के को −2 D और दादा को +2 D अंकित लेंस देता। दोनों दोष और सुधार उल्टे क्यों, समझाओ।",
          mr: "वर्गात मागे बसलेला एक मुलगा फळा वाचू शकत नाही पण आपले पुस्तक सहज वाचतो. त्याचे आजोबा तोच फळा दारातून वाचू शकतात पण वर्तमानपत्र हातभर दूर धरतात. चष्मेवाला मुलाला −2 D आणि आजोबांना +2 D चिन्हांकित भिंग देतो. दोन्ही दोष आणि दुरुस्त्या उलट का, हे समजावा.",
        },
        choices: [
          {
            en: "The boy has myopia: his eye bends light too strongly, so distant objects focus in front of the retina — a concave lens of negative power first diverges the rays so the eye's own focusing lands them on the retina. The grandfather has hypermetropia: his eye bends light too weakly, so near objects focus behind the retina — a convex lens of positive power converges the rays a little first, topping up the eye's shortfall",
            hi: "लड़के को निकट-दृष्टि दोष: उसका नेत्र प्रकाश बहुत प्रबलता से मोड़ता, अतः दूर की वस्तुएँ दृष्टिपटल के आगे फोकस — ऋण क्षमता का अवतल लेंस पहले किरणें अपसरित करता ताकि नेत्र का अपना फोकस उन्हें दृष्टिपटल पर उतारे। दादा को दूर-दृष्टि दोष: उनका नेत्र प्रकाश बहुत दुर्बलता से मोड़ता, अतः पास की वस्तुएँ दृष्टिपटल के पीछे फोकस — धन क्षमता का उत्तल लेंस पहले किरणें थोड़ी अभिसरित करता, नेत्र की कमी पूरी करता",
            mr: "मुलाला निकटदृष्टिता: त्याचा डोळा प्रकाश फार प्रबळपणे वाकवतो, म्हणून दूरच्या वस्तू दृष्टिपटलापुढे नाभिबिंदू साधतात — ऋण क्षमतेचे अंतर्वक्र भिंग आधी किरण अपसरित करते जेणेकरून डोळ्याचे स्वतःचे नाभीकरण त्यांना दृष्टिपटलावर उतरवते. आजोबांना दूरदृष्टिता: त्यांचा डोळा प्रकाश फार दुर्बळपणे वाकवतो, म्हणून जवळच्या वस्तू दृष्टिपटलामागे नाभिबिंदू साधतात — धन क्षमतेचे बहिर्वक्र भिंग आधी किरण थोडे अभिसरित करते, डोळ्याची कमतरता भरून काढते",
          },
          {
            en: "Both have the same defect; the signs on the lenses merely record which eye is weaker",
            hi: "दोनों को एक ही दोष; लेंसों पर चिह्न बस दर्ज करते कौन-सा नेत्र दुर्बल",
            mr: "दोघांना एकच दोष; भिंगांवरील चिन्हे फक्त कोणता डोळा दुर्बळ हे नोंदवतात",
          },
          {
            en: "The boy is long-sighted and the grandfather short-sighted, the other way round",
            hi: "लड़का दूर-दृष्टि और दादा निकट-दृष्टि, उल्टे तरीक़े से",
            mr: "मुलगा दूरदृष्टीचा आणि आजोबा निकटदृष्टीचे, उलट पद्धतीने",
          },
          {
            en: "Neither has a lens defect; both simply need to sit at the correct distance",
            hi: "किसी को लेंस-दोष नहीं; दोनों को बस ठीक दूरी पर बैठना चाहिए",
            mr: "कोणालाही भिंग-दोष नाही; दोघांनी फक्त योग्य अंतरावर बसावे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both problems come from the same requirement — a sharp image must land exactly on the retina — and they fail it in opposite directions. Take the boy first. He sees near things well but distant things blur, which is myopia, or short-sightedness. His eye is bending light too strongly for far objects: either the eyeball has grown a little too long, or the lens and cornea curve too much. Rays from the blackboard arrive nearly parallel, the over-strong eye converges them too soon, and they come to a focus in front of the retina and then spread again before reaching it — so the image on the retina is a blur. To fix it you must weaken the incoming light before the eye touches it, so a concave (diverging) lens is placed in front. It spreads the parallel rays slightly, and the eye's excess converging power is then exactly right to bring them together on the retina. Because a concave lens has a negative focal length, its power is negative — hence −2 D. The grandfather is the mirror case. He sees the distant blackboard well but must push the newspaper away, which is hypermetropia, or long-sightedness. His eye bends light too weakly for near objects: the eyeball may be a little short, or the lens too flat and stiffened with age. Rays from a close page arrive strongly diverging and need a lot of converging; his eye cannot supply enough, so they are still converging when they reach the retina and would only meet behind it — again a blur. The fix is to add the missing converging power, so a convex lens is placed in front. It brings the rays partway together before they enter, and the eye's weaker focusing completes the job on the retina. A convex lens has a positive focal length, so its power is positive — hence +2 D. The corrections are opposite because the errors are opposite: one eye focuses too soon and must be given diverging help, the other too late and must be given converging help. The equal magnitudes, 2 D each, are a coincidence of these two particular eyes and say nothing about the defects being the same. (The wrong answers either deny the distinction, reverse the two defects, or pretend seating distance could cure an eye that cannot form a sharp image at any distance.)",
          hi: "दोनों समस्याएँ एक ही आवश्यकता से — तीखा प्रतिबिंब ठीक दृष्टिपटल पर गिरे — और वे उसमें उल्टी दिशाओं में चूकतीं। पहले लड़का। वह पास की चीज़ें ठीक देखता पर दूर की धुँधली, यह निकट-दृष्टि दोष। उसका नेत्र दूर की वस्तुओं के लिए प्रकाश बहुत प्रबलता से मोड़ रहा: या तो नेत्रगोलक थोड़ा अधिक लंबा हो गया, या लेंस और स्वच्छपटल बहुत वक्र। श्यामपट्ट से किरणें लगभग समांतर आतीं, अति-प्रबल नेत्र उन्हें बहुत जल्दी अभिसरित करता, और वे दृष्टिपटल के आगे फोकस होकर पहुँचने से पहले फिर फैल जातीं — अतः दृष्टिपटल पर प्रतिबिंब धुँधला। सुधार को आते प्रकाश को नेत्र से छूने से पहले दुर्बल करना होगा, अतः आगे अवतल (अपसारी) लेंस रखा। यह समांतर किरणें थोड़ी फैलाता, और नेत्र की अतिरिक्त अभिसरण-शक्ति तब ठीक इतनी कि उन्हें दृष्टिपटल पर मिलाए। क्योंकि अवतल लेंस की फोकस दूरी ऋणात्मक, उसकी क्षमता ऋणात्मक — इसीलिए −2 D। दादा दर्पण-प्रकरण। वे दूर का श्यामपट्ट ठीक देखते पर अख़बार दूर धकेलना पड़ता, यह दूर-दृष्टि दोष। उनका नेत्र पास की वस्तुओं के लिए प्रकाश बहुत दुर्बलता से मोड़ता: नेत्रगोलक थोड़ा छोटा हो सकता, या लेंस बहुत चपटा और उम्र से कड़ा। पास के पन्ने से किरणें प्रबल अपसरित होकर आतीं और बहुत अभिसरण चाहतीं; उनका नेत्र इतना नहीं दे पाता, अतः दृष्टिपटल तक पहुँचते वे अब भी अभिसरित हो रहीं और केवल उसके पीछे मिलतीं — फिर धुँधला। सुधार लुप्त अभिसरण-शक्ति जोड़ना, अतः आगे उत्तल लेंस रखा। यह प्रवेश से पहले किरणें आधी दूर तक मिला देता, और नेत्र का दुर्बल फोकस काम दृष्टिपटल पर पूरा करता। उत्तल लेंस की फोकस दूरी धनात्मक, अतः क्षमता धनात्मक — इसीलिए +2 D। सुधार उल्टे क्योंकि त्रुटियाँ उल्टीं: एक नेत्र बहुत जल्दी फोकस करता और उसे अपसारी सहायता चाहिए, दूसरा बहुत देर से और उसे अभिसारी। बराबर परिमाण, 2 D प्रत्येक, इन दो विशेष नेत्रों का संयोग और दोषों के एक होने का कोई संकेत नहीं। (ग़लत उत्तर या तो भेद नकारते, दोनों दोष उलटते, या दिखावा करते कि बैठने की दूरी उस नेत्र को ठीक कर देती जो किसी भी दूरी पर तीखा प्रतिबिंब नहीं बना सकता।)",
          mr: "दोन्ही समस्या एकाच आवश्यकतेतून — तीक्ष्ण प्रतिमा नेमकी दृष्टिपटलावर पडावी — आणि त्या तीत उलट दिशांनी चुकतात. आधी मुलगा. तो जवळच्या गोष्टी नीट पाहतो पण दूरच्या अस्पष्ट, ही निकटदृष्टिता. त्याचा डोळा दूरच्या वस्तूंसाठी प्रकाश फार प्रबळपणे वाकवत आहे: एकतर नेत्रगोल थोडा जास्त लांब वाढला, वा भिंग आणि पारपटल फार वक्र. फळ्यापासून किरण जवळजवळ समांतर येतात, अति-प्रबळ डोळा त्यांना फार लवकर अभिसरित करतो, आणि ते दृष्टिपटलापुढे नाभिबिंदू साधून पोहोचण्याआधी पुन्हा पसरतात — म्हणून दृष्टिपटलावरील प्रतिमा अस्पष्ट. दुरुस्तीसाठी येणारा प्रकाश डोळ्याला स्पर्शण्याआधी दुर्बळ करावा लागेल, म्हणून पुढे अंतर्वक्र (अपसारी) भिंग ठेवले. ते समांतर किरण थोडे पसरवते, आणि डोळ्याची अतिरिक्त अभिसरण-शक्ती मग नेमकी इतकी की त्यांना दृष्टिपटलावर जुळवते. अंतर्वक्र भिंगाचे नाभीय अंतर ऋण असल्याने, त्याची क्षमता ऋण — म्हणून −2 D. आजोबा उलट प्रकरण. ते दूरचा फळा नीट पाहतात पण वर्तमानपत्र दूर ढकलावे लागते, ही दूरदृष्टिता. त्यांचा डोळा जवळच्या वस्तूंसाठी प्रकाश फार दुर्बळपणे वाकवतो: नेत्रगोल थोडा आखूड असू शकतो, वा भिंग फार सपाट आणि वयाने कडक. जवळच्या पानापासून किरण प्रबळ अपसरित होऊन येतात आणि खूप अभिसरण मागतात; त्यांचा डोळा तितके देऊ शकत नाही, म्हणून दृष्टिपटलापर्यंत पोहोचताना ते अजून अभिसरित होत असतात आणि केवळ त्याच्यामागे भेटतील — पुन्हा अस्पष्ट. दुरुस्ती म्हणजे हरवलेली अभिसरण-शक्ती जोडणे, म्हणून पुढे बहिर्वक्र भिंग ठेवले. ते प्रवेशापूर्वी किरण अर्ध्या वाटेत जुळवते, आणि डोळ्याचे दुर्बळ नाभीकरण काम दृष्टिपटलावर पूर्ण करते. बहिर्वक्र भिंगाचे नाभीय अंतर धन, म्हणून क्षमता धन — म्हणून +2 D. दुरुस्त्या उलट कारण चुका उलट: एक डोळा फार लवकर नाभिबिंदू साधतो आणि त्याला अपसारी मदत हवी, दुसरा फार उशिरा आणि त्याला अभिसारी. समान परिमाणे, प्रत्येकी 2 D, या दोन विशिष्ट डोळ्यांचा योगायोग आणि दोष एकच असल्याचा कोणताही संकेत नाही. (चुकीची उत्तरे एकतर भेद नाकारतात, दोन्ही दोष उलटवतात, वा असे भासवतात की बसण्याचे अंतर त्या डोळ्याला बरे करेल जो कोणत्याही अंतरावर तीक्ष्ण प्रतिमा बनवू शकत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "The sky overhead is blue at noon, yet the same sun turns deep red at sunset, and an astronaut in orbit sees a black sky with a white sun. One single mechanism explains all three. Identify it and show how it produces each of these very different sights.",
          hi: "दोपहर ऊपर का आकाश नीला, फिर भी वही सूर्य सूर्यास्त पर गहरा लाल, और कक्षा में अंतरिक्ष-यात्री काला आकाश और श्वेत सूर्य देखता। एक ही क्रियाविधि तीनों समझाती। उसे पहचानो और दिखाओ वह ये अत्यंत भिन्न दृश्य कैसे बनाती।",
          mr: "दुपारी वरचे आकाश निळे, तरीही तोच सूर्य सूर्यास्ताला गडद लाल, आणि कक्षेतील अंतराळवीर काळे आकाश आणि श्वेत सूर्य पाहतो. एकच क्रियाविधी तिन्ही समजावते. ती ओळखा आणि दाखवा ती ही अतिशय वेगळी दृश्ये कशी घडवते.",
        },
        choices: [
          {
            en: "Scattering of sunlight by air molecules, which is far stronger for short wavelengths. At noon the air scatters blue light down to us from all over the sky, so the sky looks blue. At sunset the light travels a much longer slanting path through the atmosphere, so nearly all the blue is scattered away before it arrives and only the surviving red and orange reach the eye. In orbit there is no air to scatter anything, so the sky is black and the sun stays white",
            hi: "वायु-अणुओं द्वारा सूर्य-प्रकाश का प्रकीर्णन, जो छोटी तरंगदैर्घ्य के लिए कहीं प्रबल। दोपहर हवा आकाश भर से नीला प्रकाश हम तक प्रकीर्णित करती, अतः आकाश नीला। सूर्यास्त पर प्रकाश वायुमंडल से कहीं लंबा तिरछा पथ चलता, अतः पहुँचने से पहले लगभग सारा नीला प्रकीर्णित हो जाता और केवल बचे लाल-नारंगी आँख तक। कक्षा में प्रकीर्णित करने कोई हवा नहीं, अतः आकाश काला और सूर्य श्वेत रहता",
            mr: "हवेच्या रेणूंनी सूर्यप्रकाशाचे विखुरणे, जे लहान तरंगलांबींसाठी कितीतरी प्रबळ. दुपारी हवा आकाशभरातून निळा प्रकाश आपल्यापर्यंत विखुरते, म्हणून आकाश निळे. सूर्यास्ताला प्रकाश वातावरणातून कितीतरी लांब तिरका मार्ग चालतो, म्हणून पोहोचण्याआधी जवळजवळ सर्व निळा विखुरून जातो आणि फक्त उरलेला लाल-केशरी डोळ्यापर्यंत. कक्षेत विखुरायला हवाच नाही, म्हणून आकाश काळे आणि सूर्य श्वेत राहतो",
          },
          {
            en: "The sun itself changes colour through the day, burning bluer at noon and redder in the evening",
            hi: "सूर्य स्वयं दिन भर रंग बदलता, दोपहर नीला और शाम लाल जलता",
            mr: "सूर्य स्वतः दिवसभर रंग बदलतो, दुपारी निळा आणि संध्याकाळी लाल जळतो",
          },
          {
            en: "The sky is blue because it reflects the blue of the seas, and red at sunset because it reflects the warm ground",
            hi: "आकाश नीला क्योंकि वह समुद्रों का नीला परावर्तित करता, और सूर्यास्त पर लाल क्योंकि गरम ज़मीन परावर्तित करता",
            mr: "आकाश निळे कारण ते समुद्रांचा निळा परावर्तित करते, आणि सूर्यास्ताला लाल कारण तप्त जमीन परावर्तित करते",
          },
          {
            en: "Air absorbs red light during the day and blue light in the evening, in a daily cycle",
            hi: "हवा दिन में लाल प्रकाश और शाम को नीला सोखती, एक दैनिक चक्र में",
            mr: "हवा दिवसा लाल प्रकाश आणि संध्याकाळी निळा शोषते, एका दैनंदिन चक्रात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One mechanism — the scattering of sunlight by the molecules of the air — accounts for all three sights, and the whole argument turns on a single fact: scattering is far stronger for short wavelengths than for long ones. Blue and violet, at the short end of the visible spectrum, are scattered many times more than orange and red. Begin with the noon sky. Sunlight entering the atmosphere is white, a mixture of all colours. As it passes through the air, the molecules scatter it in every direction, but they scatter the blue far more than the red. So when you look up at a part of the sky away from the sun, what reaches your eye from that patch is mostly scattered blue light — the sky glows blue everywhere, even though there is nothing blue up there. The direct beam, meanwhile, has lost only a little of its blue and still looks white-yellow. Now the sunset. The sun is low, so its light no longer comes down through the thin overhead layer but slants across a far longer stretch of atmosphere before reaching you. Over that long path, scattering has many more chances to act, and virtually all the blue and green are scattered out of the beam sideways — away from your line of sight. What survives the journey and arrives at your eye is the light that scatters least: the reds and oranges. The sun therefore looks deep red, and the clouds near it are lit red too. Nothing about the sun has changed; only the length of air the light had to cross. Finally, the astronaut. In orbit there is essentially no atmosphere, and scattering needs particles to do the scattering. With no air molecules along the line of sight, no light is thrown sideways into the eye from empty directions, so the sky away from the sun is simply black — you see only where a source actually is. And the sunlight arriving directly has lost nothing at all on the way, so the sun appears white, its full mixture intact. The same law thus explains a blue sky, a red sunset and a black sky with a white sun, purely by varying how much air the light passes through. (The wrong answers are the common misconceptions: the sun's own output does not change through our day; the sky is blue over deserts and above the clouds where no sea is in view; and air does not absorb colours on a daily schedule — it scatters them, which is a redirection, not a removal.)",
          hi: "एक क्रियाविधि — वायु के अणुओं द्वारा सूर्य-प्रकाश का प्रकीर्णन — तीनों दृश्यों का हिसाब देती, और पूरा तर्क एक तथ्य पर घूमता: प्रकीर्णन छोटी तरंगदैर्घ्य के लिए लंबी से कहीं प्रबल। दृश्य वर्णक्रम के छोटे सिरे पर नीला-बैंगनी नारंगी-लाल से कई गुना अधिक प्रकीर्णित। दोपहर के आकाश से शुरू। वायुमंडल में घुसती धूप श्वेत, सब रंगों का मिश्रण। हवा से गुज़रते अणु उसे हर दिशा में प्रकीर्णित करते, पर नीला लाल से कहीं अधिक। अतः सूर्य से हटकर आकाश के किसी भाग को देखो तो उस टुकड़े से आँख तक जो आता वह अधिकतर प्रकीर्णित नीला प्रकाश — आकाश हर ओर नीला दमकता, यद्यपि ऊपर कुछ नीला है नहीं। इस बीच सीधी किरण-पुंज ने अपना थोड़ा-सा नीला ही खोया और अब भी श्वेत-पीला दिखता। अब सूर्यास्त। सूर्य नीचा, अतः उसका प्रकाश अब ऊपर की पतली परत से सीधा नहीं आता बल्कि पहुँचने से पहले वायुमंडल की कहीं लंबी फैलाव पर तिरछा चलता। उस लंबे पथ पर प्रकीर्णन को काम करने कहीं अधिक अवसर, और लगभग सारा नीला-हरा किरण-पुंज से बग़ल में — तुम्हारी दृष्टि-रेखा से दूर — प्रकीर्णित हो जाता। यात्रा से बचकर आँख तक जो पहुँचता वह सबसे कम प्रकीर्णित होता प्रकाश: लाल और नारंगी। अतः सूर्य गहरा लाल दिखता, और पास के बादल भी लाल रँगे। सूर्य के बारे में कुछ नहीं बदला; केवल हवा की वह लंबाई जो प्रकाश को पार करनी पड़ी। अंत में अंतरिक्ष-यात्री। कक्षा में मूलतः कोई वायुमंडल नहीं, और प्रकीर्णन को प्रकीर्णित करने कण चाहिए। दृष्टि-रेखा पर कोई वायु-अणु न होने से ख़ाली दिशाओं से आँख में बग़ल का कोई प्रकाश नहीं फेंका जाता, अतः सूर्य से हटकर आकाश बस काला — तुम केवल वहीं देखते जहाँ सचमुच स्रोत। और सीधा पहुँचती धूप ने रास्ते में कुछ भी नहीं खोया, अतः सूर्य श्वेत दिखता, उसका पूरा मिश्रण अक्षत। यही नियम इस तरह नीला आकाश, लाल सूर्यास्त और श्वेत सूर्य वाला काला आकाश समझाता, केवल यह बदलकर कि प्रकाश कितनी हवा से गुज़रा। (ग़लत उत्तर सामान्य भ्रांतियाँ: सूर्य का अपना उत्सर्जन हमारे दिन भर नहीं बदलता; आकाश रेगिस्तानों के ऊपर और बादलों से ऊपर भी नीला जहाँ कोई समुद्र दृष्टि में नहीं; और हवा दैनिक समय-सारणी पर रंग नहीं सोखती — वह उन्हें प्रकीर्णित करती, जो दिशा-परिवर्तन है, हटाना नहीं।)",
          mr: "एक क्रियाविधी — हवेच्या रेणूंनी सूर्यप्रकाशाचे विखुरणे — तिन्ही दृश्यांचा हिशोब देते, आणि अख्खा युक्तिवाद एका तथ्यावर फिरतो: विखुरणे लहान तरंगलांबींसाठी लांबींहून कितीतरी प्रबळ. दृश्य वर्णपटाच्या लहान टोकाला निळा-जांभळा केशरी-लालहून कैकपट अधिक विखुरतो. दुपारच्या आकाशापासून सुरू. वातावरणात शिरणारा सूर्यप्रकाश श्वेत, सर्व रंगांचे मिश्रण. हवेतून जाताना रेणू तो सर्व दिशांना विखुरतात, पण निळा लालहून कितीतरी अधिक. म्हणून सूर्यापासून दूर आकाशाचा एखादा भाग पाहिल्यास त्या तुकड्यातून डोळ्यापर्यंत जे येते ते बहुतांश विखुरलेला निळा प्रकाश — आकाश सर्वत्र निळे तळपते, जरी वर काही निळे नाही. दरम्यान सरळ झोताने आपला थोडाच निळा गमावला आणि अजून श्वेत-पिवळा दिसतो. आता सूर्यास्त. सूर्य खाली, म्हणून त्याचा प्रकाश आता वरच्या पातळ थरातून सरळ येत नाही तर पोहोचण्याआधी वातावरणाच्या कितीतरी लांब पल्ल्यावर तिरका चालतो. त्या लांब मार्गावर विखुरण्याला काम करायला कितीतरी अधिक संधी, आणि जवळजवळ सर्व निळा-हिरवा झोतातून बाजूला — तुमच्या दृष्टिरेषेपासून दूर — विखुरून जातो. प्रवासातून वाचून डोळ्यापर्यंत जे पोहोचते तो सर्वांत कमी विखुरणारा प्रकाश: लाल आणि केशरी. म्हणून सूर्य गडद लाल दिसतो, आणि जवळचे ढगही लाल रंगलेले. सूर्याबद्दल काहीही बदलले नाही; फक्त हवेची ती लांबी जी प्रकाशाला ओलांडावी लागली. शेवटी अंतराळवीर. कक्षेत मुळात कोणतेही वातावरण नाही, आणि विखुरण्याला विखुरायला कण लागतात. दृष्टिरेषेवर कोणतेही हवेचे रेणू नसल्याने रिकाम्या दिशांतून डोळ्यात बाजूचा कोणता प्रकाश फेकला जात नाही, म्हणून सूर्यापासून दूरचे आकाश फक्त काळे — तुम्ही केवळ तिथेच पाहता जिथे खरोखर स्रोत. आणि सरळ पोहोचणाऱ्या सूर्यप्रकाशाने वाटेत काहीच गमावले नाही, म्हणून सूर्य श्वेत दिसतो, त्याचे पूर्ण मिश्रण अभंग. हाच नियम अशा प्रकारे निळे आकाश, लाल सूर्यास्त आणि श्वेत सूर्यासह काळे आकाश समजावतो, केवळ प्रकाश किती हवेतून गेला हे बदलून. (चुकीची उत्तरे सामान्य गैरसमज आहेत: सूर्याचे स्वतःचे उत्सर्जन आपल्या दिवसभरात बदलत नाही; आकाश वाळवंटांवर आणि ढगांच्या वरही निळे जिथे कोणता समुद्र दृष्टीत नाही; आणि हवा दैनंदिन वेळापत्रकावर रंग शोषत नाही — ती त्यांना विखुरते, जे दिशा-बदल आहे, काढून टाकणे नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — Electricity                                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-electricity",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 11 — Electricity",
      hi: "अध्याय 11 — विद्युत",
      mr: "प्रकरण 11 — विद्युत",
    },
    name: {
      en: "Electricity",
      hi: "विद्युत",
      mr: "विद्युत",
    },
    summary: {
      en: "Charge counted as it flows, the push that drives it, and the law tying the two together; then a conductor's opposition traced to its length and thickness, two ways of joining resistors that pull the total in opposite directions, and the rate at which a circuit turns electrical energy into heat and light.",
      hi: "बहते हुए गिना गया आवेश, उसे चलाता धक्का, और दोनों को बाँधता नियम; फिर चालक का विरोध उसकी लंबाई-मोटाई तक खोजा, प्रतिरोधक जोड़ने के दो तरीक़े जो कुल को उल्टी दिशाओं में खींचते, और वह दर जिससे परिपथ विद्युत ऊर्जा को ऊष्मा-प्रकाश में बदलता।",
      mr: "वाहताना मोजलेला विद्युतभार, त्याला चालवणारा रेटा, आणि दोघांना बांधणारा नियम; मग वाहकाचा विरोध त्याच्या लांबी-जाडीपर्यंत शोधलेला, रोधक जोडण्याचे दोन मार्ग जे एकूण उलट दिशांना ओढतात, आणि तो दर ज्याने परिपथ विद्युत ऊर्जेचे उष्णता-प्रकाशात रूपांतर करतो.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "electric-current",
        name: {
          en: "Electric current",
          hi: "विद्युत धारा",
          mr: "विद्युत धारा",
        },
        kind: "quantity",
        prompt: {
          en: "One coulomb of charge crossing a wire's cross-section every second is called one ampere. Which quantity is defined as the charge flowing per unit time?",
          hi: "हर सेकंड तार के अनुप्रस्थ काट से पार होता एक कूलॉम आवेश एक ऐम्पियर कहलाता। कौन-सी राशि प्रति एकांक समय बहते आवेश के रूप में परिभाषित?",
          mr: "प्रत्येक सेकंदाला तारेच्या छेदातून जाणारा एक कूलोम विद्युतभार एक अँपिअर म्हणतात. कोणती राशी प्रति एकक काळात वाहणारा विद्युतभार म्हणून व्याख्यायित?",
        },
        statement: {
          en: "Electric current is the rate of flow of charge — the charge passing a point divided by the time taken — measured in amperes, where one ampere is one coulomb per second.",
          hi: "विद्युत धारा आवेश के बहने की दर — किसी बिंदु से गुज़रा आवेश बटा लगा समय — ऐम्पियर में नापी, जहाँ एक ऐम्पियर एक कूलॉम प्रति सेकंड।",
          mr: "विद्युत धारा म्हणजे विद्युतभाराच्या वाहण्याचा दर — एका बिंदूतून गेलेला विद्युतभार भागिले लागलेला काळ — अँपिअरमध्ये मोजलेली, जिथे एक अँपिअर म्हणजे एक कूलोम प्रति सेकंद.",
        },
        detail: {
          en: "It is measured with an ammeter, which must be joined in series so the whole current passes through it.",
          hi: "यह ऐमीटर से नापी जाती, जिसे श्रेणी में जोड़ना होता ताकि पूरी धारा उससे गुज़रे।",
          mr: "ती अँमीटरने मोजली जाते, जो श्रेणीत जोडावा लागतो जेणेकरून अख्खी धारा त्यातून जाते.",
        },
        extra: {
          en: "By convention current is drawn as flowing from the positive to the negative terminal, though in a metal it is electrons that actually drift the other way.",
          hi: "परिपाटी से धारा धन से ऋण सिरे की ओर बहती दिखाई जाती, यद्यपि धातु में वास्तव में इलेक्ट्रॉन दूसरी ओर सरकते।",
          mr: "संकेतानुसार धारा धन टोकाकडून ऋण टोकाकडे वाहताना दाखवली जाते, जरी धातूत प्रत्यक्षात इलेक्ट्रॉन दुसऱ्या दिशेने सरकतात.",
        },
        pair: {
          left: {
            en: "Charge per second",
            hi: "आवेश प्रति सेकंड",
            mr: "विद्युतभार प्रति सेकंद",
          },
          right: {
            en: "electric current",
            hi: "विद्युत धारा",
            mr: "विद्युत धारा",
          },
        },
      },
      {
        id: "potential-difference",
        name: {
          en: "Potential difference",
          hi: "विभवांतर",
          mr: "विभवांतर",
        },
        kind: "quantity",
        prompt: {
          en: "Moving one coulomb of charge between two points takes one joule of work, and that pair of points is said to differ by one volt. Which quantity is the work done per unit charge?",
          hi: "दो बिंदुओं के बीच एक कूलॉम आवेश ले जाने में एक जूल कार्य लगता, और उन बिंदुओं में एक वोल्ट का अंतर कहा जाता। कौन-सी राशि प्रति एकांक आवेश किया कार्य?",
          mr: "दोन बिंदूंदरम्यान एक कूलोम विद्युतभार हलवायला एक ज्यूल कार्य लागते, आणि त्या बिंदूंत एक व्होल्टचा फरक म्हटला जातो. कोणती राशी प्रति एकक विद्युतभार केलेले कार्य?",
        },
        statement: {
          en: "Potential difference between two points is the work done in moving a unit charge from one to the other, measured in volts, where one volt is one joule per coulomb.",
          hi: "दो बिंदुओं के बीच विभवांतर एक से दूसरे तक एकांक आवेश ले जाने में किया कार्य, वोल्ट में नापा, जहाँ एक वोल्ट एक जूल प्रति कूलॉम।",
          mr: "दोन बिंदूंमधील विभवांतर म्हणजे एकाकडून दुसऱ्याकडे एकक विद्युतभार हलवण्यात केलेले कार्य, व्होल्टमध्ये मोजलेले, जिथे एक व्होल्ट म्हणजे एक ज्यूल प्रति कूलोम.",
        },
        detail: {
          en: "It is measured with a voltmeter, which must be joined in parallel across the two points whose difference is wanted.",
          hi: "यह वोल्टमीटर से नापा जाता, जिसे उन दो बिंदुओं के आर-पार समांतर जोड़ना होता जिनका अंतर चाहिए।",
          mr: "ते व्होल्टमीटरने मोजले जाते, जो ज्या दोन बिंदूंचा फरक हवा त्यांच्या आरपार समांतर जोडावा लागतो.",
        },
        extra: {
          en: "A cell or battery is what maintains this difference, and without it the free electrons in a wire simply jostle about without any net flow.",
          hi: "सेल या बैटरी ही यह अंतर बनाए रखती, और उसके बिना तार के मुक्त इलेक्ट्रॉन बस धक्का-मुक्की करते, कोई कुल बहाव नहीं।",
          mr: "विद्युतघट वा बॅटरीच हा फरक टिकवते, आणि तिच्याविना तारेतील मुक्त इलेक्ट्रॉन फक्त धक्काबुक्की करतात, कोणताही निव्वळ प्रवाह नाही.",
        },
        pair: {
          left: {
            en: "Work per unit charge",
            hi: "कार्य प्रति एकांक आवेश",
            mr: "कार्य प्रति एकक विद्युतभार",
          },
          right: {
            en: "potential difference",
            hi: "विभवांतर",
            mr: "विभवांतर",
          },
        },
      },
      {
        id: "ohms-law",
        name: {
          en: "Ohm's law",
          hi: "ओम का नियम",
          mr: "ओहमचा नियम",
        },
        kind: "law",
        prompt: {
          en: "Double the voltage across a metal wire at fixed temperature and the current through it doubles exactly, so a graph of V against I is a straight line. Which law is this?",
          hi: "नियत ताप पर धातु के तार के आर-पार वोल्टता दुगुनी करो और उससे बहती धारा ठीक दुगुनी, अतः V विरुद्ध I का आलेख सरल रेखा। यह कौन-सा नियम?",
          mr: "स्थिर तापमानावर धातूच्या तारेवरील व्होल्टता दुप्पट करा आणि तिच्यातून वाहणारी धारा नेमकी दुप्पट, म्हणून V विरुद्ध I चा आलेख सरळ रेषा. हा कोणता नियम?",
        },
        statement: {
          en: "Ohm's law states that at constant temperature the current through a conductor is directly proportional to the potential difference across it, so V equals I times R.",
          hi: "ओम का नियम कहता स्थिर ताप पर चालक से बहती धारा उसके आर-पार विभवांतर के समानुपाती, अतः V बराबर I गुणा R।",
          mr: "ओहमचा नियम सांगतो स्थिर तापमानावर वाहकातून वाहणारी धारा त्यावरील विभवांतराच्या समप्रमाणात, म्हणून V बरोबर I गुणिले R.",
        },
        detail: {
          en: "The constant of proportionality R is the conductor's resistance, so the slope of the V–I graph is the resistance itself.",
          hi: "समानुपात स्थिरांक R चालक का प्रतिरोध, अतः V–I आलेख की ढाल स्वयं प्रतिरोध।",
          mr: "समप्रमाण स्थिरांक R म्हणजे वाहकाचा रोध, म्हणून V–I आलेखाचा उतार स्वतः रोध.",
        },
        extra: {
          en: "The law fails if the temperature is allowed to change — a glowing bulb's filament is far more resistive when hot than when cold.",
          hi: "ताप बदलने दिया जाए तो नियम टूटता — दमकते बल्ब का तंतु गरम में ठंडे से कहीं अधिक प्रतिरोधी।",
          mr: "तापमान बदलू दिल्यास नियम मोडतो — तळपत्या बल्बचा तंतू गरम असताना थंडपेक्षा कितीतरी अधिक रोधक.",
        },
        pair: {
          left: {
            en: "Current proportional to voltage",
            hi: "धारा वोल्टता के समानुपाती",
            mr: "धारा व्होल्टतेच्या समप्रमाणात",
          },
          right: {
            en: "Ohm's law",
            hi: "ओम का नियम",
            mr: "ओहमचा नियम",
          },
        },
      },
      {
        id: "resistance-factors",
        name: {
          en: "What resistance depends on",
          hi: "प्रतिरोध किस पर निर्भर",
          mr: "रोध कशावर अवलंबून",
        },
        kind: "idea",
        prompt: {
          en: "A long thin wire opposes current far more than a short thick one of the same metal, and heating it makes matters worse. On which four things does a conductor's opposition to current depend?",
          hi: "उसी धातु का लंबा पतला तार छोटे मोटे से कहीं अधिक धारा का विरोध करता, और गरम करने पर बात और बिगड़ती। चालक का धारा-विरोध किन चार चीज़ों पर निर्भर?",
          mr: "त्याच धातूची लांब बारीक तार आखूड जाडीहून कितीतरी अधिक धारेचा विरोध करते, आणि तापवल्याने प्रकरण आणखी बिघडते. वाहकाचा धारा-विरोध कोणत्या चार गोष्टींवर अवलंबून?",
        },
        statement: {
          en: "The resistance of a conductor grows with its length, falls as its area of cross-section grows, and depends on the material and the temperature.",
          hi: "चालक का प्रतिरोध उसकी लंबाई के साथ बढ़ता, अनुप्रस्थ काट का क्षेत्रफल बढ़ने पर घटता, और पदार्थ तथा ताप पर निर्भर।",
          mr: "वाहकाचा रोध त्याच्या लांबीबरोबर वाढतो, छेदाचे क्षेत्रफळ वाढल्यास घटतो, आणि पदार्थ व तापमानावर अवलंबून.",
        },
        detail: {
          en: "The material's own share is called resistivity, a property of the substance itself and not of the particular piece's size or shape.",
          hi: "पदार्थ का अपना हिस्सा प्रतिरोधकता कहलाता, स्वयं पदार्थ का गुण, किसी विशेष टुकड़े के आकार-रूप का नहीं।",
          mr: "पदार्थाचा स्वतःचा वाटा रोधकता म्हणतात, स्वतः पदार्थाचा गुणधर्म, विशिष्ट तुकड्याच्या आकार-रूपाचा नाही.",
        },
        extra: {
          en: "This is why the long supply lines outside are made of thick wire to waste little, while a heater's element is a thin coil of high-resistivity alloy meant to waste much.",
          hi: "इसी से बाहर की लंबी संचरण-लाइनें मोटे तार की, कम गँवाने को, जबकि हीटर का तत्व ऊँची प्रतिरोधकता वाली मिश्रधातु की पतली कुंडली, बहुत गँवाने को बनी।",
          mr: "म्हणूनच बाहेरच्या लांब पुरवठा-तारा जाड तारेच्या, कमी वाया घालवायला, तर हीटरचा घटक उच्च रोधकतेच्या मिश्रधातूची बारीक तार-गुंडाळी, पुष्कळ वाया घालवायला बनवलेली.",
        },
        pair: {
          left: {
            en: "Longer and thinner means more opposition",
            hi: "अधिक लंबा और पतला यानी अधिक विरोध",
            mr: "अधिक लांब आणि बारीक म्हणजे अधिक विरोध",
          },
          right: {
            en: "what resistance depends on",
            hi: "प्रतिरोध किस पर निर्भर",
            mr: "रोध कशावर अवलंबून",
          },
        },
      },
      {
        id: "series-combination",
        name: {
          en: "Resistors in series",
          hi: "श्रेणीक्रम में प्रतिरोधक",
          mr: "श्रेणीत रोधक",
        },
        kind: "arrangement",
        prompt: {
          en: "Three resistors joined end to end in a single loop carry the very same current, and their total opposition is simply the sum of the three. Which arrangement is this?",
          hi: "एक ही पाश में सिरे-से-सिरे जुड़े तीन प्रतिरोधक ठीक वही धारा ढोते, और उनका कुल विरोध बस तीनों का जोड़। यह कौन-सी व्यवस्था?",
          mr: "एकाच फेऱ्यात टोकाला-टोक जोडलेले तीन रोधक नेमकी तीच धारा वाहतात, आणि त्यांचा एकूण विरोध फक्त तिघांची बेरीज. ही कोणती मांडणी?",
        },
        statement: {
          en: "In a series combination the resistors lie one after another on a single path, the same current flows through each, and the total resistance is the sum of the individual resistances.",
          hi: "श्रेणी संयोजन में प्रतिरोधक एक ही पथ पर एक के बाद एक, हर एक से वही धारा बहती, और कुल प्रतिरोध अलग-अलग प्रतिरोधों का जोड़।",
          mr: "श्रेणी जोडणीत रोधक एकाच मार्गावर एकामागोमाग, प्रत्येकातून तीच धारा वाहते, आणि एकूण रोध वेगवेगळ्या रोधांची बेरीज.",
        },
        detail: {
          en: "The supply voltage divides among them in proportion to their resistances, so the largest resistor takes the largest share.",
          hi: "आपूर्ति वोल्टता उनमें उनके प्रतिरोधों के अनुपात में बँटती, अतः सबसे बड़ा प्रतिरोधक सबसे बड़ा हिस्सा लेता।",
          mr: "पुरवठा व्होल्टता त्यांच्यात त्यांच्या रोधांच्या प्रमाणात विभागते, म्हणून सर्वांत मोठा रोधक सर्वांत मोठा वाटा घेतो.",
        },
        extra: {
          en: "Because there is only one path, a break anywhere kills the whole line — the reason one dead bulb once darkened a whole string of decorative lights.",
          hi: "क्योंकि पथ केवल एक, कहीं भी टूट पूरी लाइन मार देती — इसी से एक मरा बल्ब कभी सजावटी लड़ी पूरी बुझा देता था।",
          mr: "मार्ग फक्त एकच असल्याने, कुठेही तुटले तर अख्खी ओळ मरते — म्हणूनच एक मेलेला बल्ब कधी अख्खी सजावटीची माळ विझवत असे.",
        },
        pair: {
          left: {
            en: "One path, resistances add",
            hi: "एक पथ, प्रतिरोध जुड़ें",
            mr: "एक मार्ग, रोध बेरजेने",
          },
          right: {
            en: "a series combination",
            hi: "श्रेणी संयोजन",
            mr: "श्रेणी जोडणी",
          },
        },
      },
      {
        id: "parallel-combination",
        name: {
          en: "Resistors in parallel",
          hi: "समांतर क्रम में प्रतिरोधक",
          mr: "समांतर रोधक",
        },
        kind: "arrangement",
        prompt: {
          en: "Three resistors joined across the same two points each get the full voltage, the current divides among them, and the total resistance comes out smaller than the smallest one. Which arrangement is this?",
          hi: "उन्हीं दो बिंदुओं के आर-पार जुड़े तीन प्रतिरोधक हर एक पूरी वोल्टता पाता, धारा उनमें बँटती, और कुल प्रतिरोध सबसे छोटे से भी छोटा निकलता। यह कौन-सी व्यवस्था?",
          mr: "त्याच दोन बिंदूंच्या आरपार जोडलेले तीन रोधक प्रत्येकाला पूर्ण व्होल्टता मिळते, धारा त्यांच्यात विभागते, आणि एकूण रोध सर्वांत लहानाहूनही लहान निघतो. ही कोणती मांडणी?",
        },
        statement: {
          en: "In a parallel combination every resistor is joined across the same two points, so each has the full potential difference; the current splits between them and the reciprocal of the total resistance is the sum of the reciprocals.",
          hi: "समांतर संयोजन में हर प्रतिरोधक उन्हीं दो बिंदुओं के आर-पार जुड़ा, अतः हर एक को पूरा विभवांतर; धारा उनमें बँटती और कुल प्रतिरोध का व्युत्क्रम व्युत्क्रमों का जोड़।",
          mr: "समांतर जोडणीत प्रत्येक रोधक त्याच दोन बिंदूंच्या आरपार जोडलेला, म्हणून प्रत्येकाला पूर्ण विभवांतर; धारा त्यांच्यात विभागते आणि एकूण रोधाचा व्यस्तांक व्यस्तांकांची बेरीज.",
        },
        detail: {
          en: "Adding another resistor here opens one more route for the current, so the combined resistance always falls below the smallest branch.",
          hi: "यहाँ एक और प्रतिरोधक जोड़ना धारा को एक और मार्ग खोलता, अतः संयुक्त प्रतिरोध सदा सबसे छोटी शाखा से नीचे गिरता।",
          mr: "इथे आणखी एक रोधक जोडणे धारेला आणखी एक मार्ग उघडते, म्हणून एकत्रित रोध सदैव सर्वांत लहान फांदीखाली घसरतो.",
        },
        extra: {
          en: "Household wiring uses it for two reasons: every appliance gets the same full 220 V, and each can be switched off on its own without cutting the rest.",
          hi: "घरेलू वायरिंग इसे दो कारणों से लेती: हर उपकरण को वही पूरे 220 V मिलते, और हर एक बाक़ी काटे बिना अलग से बंद हो सकता।",
          mr: "घरगुती वायरिंग ही दोन कारणांसाठी वापरते: प्रत्येक उपकरणाला तेच पूर्ण 220 V मिळतात, आणि प्रत्येक बाकीचे न तोडता स्वतंत्रपणे बंद करता येते.",
        },
        pair: {
          left: {
            en: "Many paths, total falls below the smallest",
            hi: "कई पथ, कुल सबसे छोटे से नीचे",
            mr: "अनेक मार्ग, एकूण सर्वांत लहानाखाली",
          },
          right: {
            en: "a parallel combination",
            hi: "समांतर संयोजन",
            mr: "समांतर जोडणी",
          },
        },
      },
      {
        id: "electric-power",
        name: {
          en: "Electric power",
          hi: "विद्युत शक्ति",
          mr: "विद्युत शक्ती",
        },
        kind: "quantity",
        prompt: {
          en: "A bulb marked 60 W turns sixty joules of electrical energy into light and heat every second. Which quantity is the rate at which electrical energy is consumed, and how is it found from V and I?",
          hi: "60 W अंकित बल्ब हर सेकंड साठ जूल विद्युत ऊर्जा को प्रकाश और ऊष्मा में बदलता। कौन-सी राशि विद्युत ऊर्जा खर्च होने की दर, और V तथा I से कैसे निकाली?",
          mr: "60 W चिन्हांकित बल्ब प्रत्येक सेकंदाला साठ ज्यूल विद्युत ऊर्जेचे प्रकाश आणि उष्णतेत रूपांतर करतो. कोणती राशी विद्युत ऊर्जा खर्च होण्याचा दर, आणि V व I वरून कशी काढली?",
        },
        statement: {
          en: "Electric power is the rate at which electrical energy is consumed, equal to the product of potential difference and current, and measured in watts.",
          hi: "विद्युत शक्ति विद्युत ऊर्जा खर्च होने की दर, विभवांतर और धारा के गुणनफल के बराबर, और वाट में नापी।",
          mr: "विद्युत शक्ती म्हणजे विद्युत ऊर्जा खर्च होण्याचा दर, विभवांतर आणि धारेच्या गुणाकाराइतकी, आणि वॅटमध्ये मोजलेली.",
        },
        detail: {
          en: "Using Ohm's law it can also be written as I²R or as V²/R, whichever pair of quantities is known.",
          hi: "ओम के नियम से इसे I²R या V²/R भी लिखा जा सकता, जो जोड़ी ज्ञात हो।",
          mr: "ओहमच्या नियमाने ती I²R वा V²/R अशीही लिहिता येते, जी जोडी माहीत असेल ती.",
        },
        extra: {
          en: "The electricity bill is charged not in watts but in kilowatt-hours — a unit of energy, being a power of one kilowatt drawn for one hour.",
          hi: "बिजली का बिल वाट में नहीं बल्कि किलोवाट-घंटा में लगता — ऊर्जा का मात्रक, एक किलोवाट शक्ति एक घंटे तक ली गई।",
          mr: "विजेचे बिल वॅटमध्ये नव्हे तर किलोवॅट-तासात आकारले जाते — ऊर्जेचे एकक, एक किलोवॅट शक्ती एक तासभर घेतलेली.",
        },
        pair: {
          left: {
            en: "Energy consumed per second",
            hi: "प्रति सेकंड खर्च ऊर्जा",
            mr: "प्रति सेकंद खर्च ऊर्जा",
          },
          right: {
            en: "electric power",
            hi: "विद्युत शक्ति",
            mr: "विद्युत शक्ती",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Two identical bulbs are joined to the same battery, first one after another in a single loop and then side by side across the terminals. In the second case both glow far brighter, and the battery runs down sooner. Explain the difference using how resistances combine.",
          hi: "दो एक जैसे बल्ब उसी बैटरी से जुड़े, पहले एक ही पाश में एक के बाद एक और फिर सिरों के आर-पार अगल-बग़ल। दूसरी दशा में दोनों कहीं अधिक चमकते, और बैटरी जल्दी चुक जाती। प्रतिरोध कैसे जुड़ते, इससे अंतर समझाओ।",
          mr: "दोन सारखे बल्ब त्याच बॅटरीला जोडले, आधी एकाच फेऱ्यात एकामागोमाग आणि मग टोकांच्या आरपार शेजारीशेजारी. दुसऱ्या स्थितीत दोन्ही कितीतरी अधिक तेजस्वी, आणि बॅटरी लवकर संपते. रोध कसे जोडले जातात यावरून फरक समजावा.",
        },
        choices: [
          {
            en: "In series the two resistances add, so the circuit's total resistance doubles and the single shared current is halved, leaving each bulb dim. In parallel each bulb gets the battery's full voltage on its own branch, so each draws its normal current; the combined resistance is halved, the total current is four times the series value, and both bulbs are bright — which is exactly why the battery drains faster",
            hi: "श्रेणी में दोनों प्रतिरोध जुड़ते, अतः परिपथ का कुल प्रतिरोध दुगुना और एकमात्र साझा धारा आधी, हर बल्ब मंद। समांतर में हर बल्ब को अपनी शाखा पर बैटरी की पूरी वोल्टता, अतः हर एक अपनी सामान्य धारा खींचता; संयुक्त प्रतिरोध आधा, कुल धारा श्रेणी के मान की चार गुनी, और दोनों बल्ब चमकीले — ठीक इसी से बैटरी तेज़ी से चुकती",
            mr: "श्रेणीत दोन्ही रोध बेरजेने, म्हणून परिपथाचा एकूण रोध दुप्पट आणि एकमेव सामायिक धारा निम्मी, प्रत्येक बल्ब मंद. समांतरात प्रत्येक बल्बला स्वतःच्या फांदीवर बॅटरीची पूर्ण व्होल्टता, म्हणून प्रत्येक आपली सामान्य धारा खेचतो; एकत्रित रोध निम्मा, एकूण धारा श्रेणीच्या मूल्याच्या चौपट, आणि दोन्ही बल्ब तेजस्वी — नेमके म्हणूनच बॅटरी वेगाने संपते",
          },
          {
            en: "Parallel wiring adds extra voltage to the battery, which is where the brightness comes from",
            hi: "समांतर वायरिंग बैटरी में अतिरिक्त वोल्टता जोड़ती, चमक वहीं से आती",
            mr: "समांतर वायरिंग बॅटरीत अतिरिक्त व्होल्टता जोडते, तेजस्विता तिथूनच येते",
          },
          {
            en: "Series wiring gives the lower total resistance, so it should have been the brighter arrangement",
            hi: "श्रेणी वायरिंग कम कुल प्रतिरोध देती, अतः वही अधिक चमकीली व्यवस्था होनी चाहिए थी",
            mr: "श्रेणी वायरिंग कमी एकूण रोध देते, म्हणून तीच अधिक तेजस्वी मांडणी असायला हवी होती",
          },
          {
            en: "The bulbs behave identically in both; only the wires' length changes the brightness",
            hi: "बल्ब दोनों में एक-से बरतते; केवल तारों की लंबाई चमक बदलती",
            mr: "बल्ब दोन्हींत सारखेच वागतात; फक्त तारांची लांबी तेजस्विता बदलते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A bulb's brightness is set by the power it consumes, and power depends on the current through it and the voltage across it — so the question is really about how each arrangement shares those out. Call one bulb's resistance R and the battery's voltage V. In series the two bulbs lie one after another on a single path, so the same current must pass through both, and their resistances add: the circuit's total is 2R. By Ohm's law the current is V divided by 2R — that is, half of what a single bulb alone would draw. Each bulb also gets only half the battery's voltage, since the supply divides between them. With half the current and half the voltage, each bulb burns at about a quarter of its normal power, so both look distinctly dim. In parallel the two bulbs are joined across the very same two terminals, so each branch has the battery's full voltage V across it. Each bulb therefore draws its own normal current, V divided by R, exactly as it would if it were alone. The battery now supplies both branches, so the total current is twice V/R, and the combined resistance is R/2 — smaller than either bulb, because adding a branch opens another route for charge to flow. Compare the two totals: V/2R in series against 2V/R in parallel, a factor of four. So the parallel arrangement draws four times as much current from the same battery and converts four times as much energy per second into light and heat. That is why both bulbs shine at full brightness — and, inescapably, why the battery is drained far sooner: the brightness is being paid for out of stored chemical energy at four times the rate. The trade-off is real and unavoidable; you cannot get more light from the same cell without spending its energy faster. (The wrong answers misstate the physics: a wiring pattern cannot add voltage to a battery, series combination raises rather than lowers total resistance, and connecting-wire length is negligible compared with the bulbs' own resistance.)",
          hi: "बल्ब की चमक उसकी खपत शक्ति से सधती, और शक्ति उससे बहती धारा तथा उसके आर-पार वोल्टता पर निर्भर — अतः प्रश्न वास्तव में यह कि हर व्यवस्था इन्हें कैसे बाँटती। एक बल्ब का प्रतिरोध R और बैटरी की वोल्टता V कहो। श्रेणी में दोनों बल्ब एक ही पथ पर एक के बाद एक, अतः वही धारा दोनों से गुज़रनी चाहिए, और उनके प्रतिरोध जुड़ते: परिपथ का कुल 2R। ओम के नियम से धारा V बटा 2R — यानी अकेला बल्ब जितनी खींचता उसकी आधी। हर बल्ब को बैटरी की आधी वोल्टता भी, क्योंकि आपूर्ति उनमें बँटती। आधी धारा और आधी वोल्टता से हर बल्ब अपनी सामान्य शक्ति के लगभग चौथाई पर जलता, अतः दोनों स्पष्ट मंद दिखते। समांतर में दोनों बल्ब ठीक उन्हीं दो सिरों के आर-पार जुड़े, अतः हर शाखा पर बैटरी की पूरी वोल्टता V। इसलिए हर बल्ब अपनी सामान्य धारा, V बटा R, खींचता, ठीक वैसे जैसे अकेला होता। बैटरी अब दोनों शाखाओं को देती, अतः कुल धारा दुगुनी V/R, और संयुक्त प्रतिरोध R/2 — किसी भी बल्ब से छोटा, क्योंकि शाखा जोड़ना आवेश को बहने का एक और मार्ग खोलता। दोनों कुल की तुलना: श्रेणी में V/2R बनाम समांतर में 2V/R, चार का गुणक। अतः समांतर व्यवस्था उसी बैटरी से चार गुनी धारा खींचती और प्रति सेकंड चार गुनी ऊर्जा प्रकाश-ऊष्मा में बदलती। इसी से दोनों बल्ब पूरी चमक पर दमकते — और अनिवार्य रूप से, इसी से बैटरी कहीं जल्दी चुकती: चमक संचित रासायनिक ऊर्जा से चार गुनी दर पर चुकाई जा रही। यह सौदा असली और अटल; उसी सेल से अधिक प्रकाश उसकी ऊर्जा तेज़ी से खर्च किए बिना नहीं मिल सकता। (ग़लत उत्तर भौतिकी ग़लत बताते: वायरिंग का ढंग बैटरी में वोल्टता नहीं जोड़ सकता, श्रेणी संयोजन कुल प्रतिरोध घटाता नहीं बढ़ाता, और जोड़ने वाले तारों की लंबाई बल्बों के अपने प्रतिरोध के आगे नगण्य।)",
          mr: "बल्बची तेजस्विता त्याच्या खर्च शक्तीने ठरते, आणि शक्ती त्यातून वाहणारी धारा व त्यावरील व्होल्टतेवर अवलंबून — म्हणून प्रश्न खरे तर हा की प्रत्येक मांडणी ती कशी वाटते. एका बल्बचा रोध R आणि बॅटरीची व्होल्टता V म्हणा. श्रेणीत दोन्ही बल्ब एकाच मार्गावर एकामागोमाग, म्हणून तीच धारा दोघांतून जावी लागते, आणि त्यांचे रोध बेरजेने: परिपथाचा एकूण 2R. ओहमच्या नियमाने धारा V भागिले 2R — म्हणजे एकटा बल्ब जितकी खेचेल तिच्या निम्मी. प्रत्येक बल्बला बॅटरीची निम्मी व्होल्टताही, कारण पुरवठा त्यांच्यात विभागतो. निम्मी धारा आणि निम्मी व्होल्टता असल्याने प्रत्येक बल्ब आपल्या सामान्य शक्तीच्या सुमारे चतुर्थांशावर जळतो, म्हणून दोन्ही स्पष्ट मंद दिसतात. समांतरात दोन्ही बल्ब नेमक्या त्याच दोन टोकांच्या आरपार जोडलेले, म्हणून प्रत्येक फांदीवर बॅटरीची पूर्ण व्होल्टता V. म्हणून प्रत्येक बल्ब आपली सामान्य धारा, V भागिले R, खेचतो, नेमके जसे एकटा असता तसे. बॅटरी आता दोन्ही फांद्यांना पुरवते, म्हणून एकूण धारा दुप्पट V/R, आणि एकत्रित रोध R/2 — कोणत्याही बल्बहून लहान, कारण फांदी जोडणे विद्युतभाराला वाहायला आणखी एक मार्ग उघडते. दोन्ही एकूणांची तुलना: श्रेणीत V/2R विरुद्ध समांतरात 2V/R, चारचा गुणक. म्हणून समांतर मांडणी त्याच बॅटरीतून चौपट धारा खेचते आणि प्रति सेकंद चौपट ऊर्जेचे प्रकाश-उष्णतेत रूपांतर करते. म्हणूनच दोन्ही बल्ब पूर्ण तेजाने तळपतात — आणि अटळपणे, म्हणूनच बॅटरी कितीतरी लवकर संपते: तेजस्विता साठवलेल्या रासायनिक ऊर्जेतून चौपट दराने चुकवली जात आहे. हा सौदा खरा आणि अपरिहार्य; त्याच घटातून अधिक प्रकाश तिची ऊर्जा वेगाने खर्च केल्याविना मिळू शकत नाही. (चुकीची उत्तरे भौतिकशास्त्र चुकीचे मांडतात: वायरिंगची पद्धत बॅटरीत व्होल्टता जोडू शकत नाही, श्रेणी जोडणी एकूण रोध घटवत नाही तर वाढवते, आणि जोडणाऱ्या तारांची लांबी बल्बांच्या स्वतःच्या रोधापुढे नगण्य.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Electricity is generated at a power station and carried to a distant town. The engineers deliberately step the voltage up to thousands of volts for the journey, then step it back down for houses — even though the high-voltage lines are dangerous and the transformers are costly. What are they saving, and why does raising the voltage save it?",
          hi: "बिजली एक विद्युत-गृह में बनती और दूर शहर तक ले जाई जाती। अभियंता जानबूझकर यात्रा के लिए वोल्टता हज़ारों वोल्ट तक चढ़ाते, फिर घरों के लिए वापस उतारते — यद्यपि ऊँची वोल्टता की लाइनें ख़तरनाक और ट्रांसफ़ॉर्मर महँगे। वे क्या बचा रहे, और वोल्टता बढ़ाना उसे क्यों बचाता?",
          mr: "वीज एका वीजनिर्मिती केंद्रात तयार होते आणि दूरच्या शहरापर्यंत नेली जाते. अभियंते मुद्दाम प्रवासासाठी व्होल्टता हजारो व्होल्टपर्यंत चढवतात, मग घरांसाठी पुन्हा उतरवतात — जरी उच्च-व्होल्टतेच्या तारा धोकादायक आणि रोहित्रे महाग. ते काय वाचवत आहेत, आणि व्होल्टता वाढवणे ते का वाचवते?",
        },
        choices: [
          {
            en: "They are saving the energy wasted as heat in the transmission wires. That waste is I²R, so it depends on the square of the current, not on the voltage. For a given power delivered, power equals voltage times current, so raising the voltage a hundredfold cuts the current a hundredfold — and cuts the heating loss ten thousandfold. The transformers step the voltage back down at the town because appliances need a safe low voltage",
            hi: "वे संचरण-तारों में ऊष्मा के रूप में गँवाई ऊर्जा बचा रहे। वह हानि I²R, अतः धारा के वर्ग पर निर्भर, वोल्टता पर नहीं। दी जाती नियत शक्ति के लिए शक्ति बराबर वोल्टता गुणा धारा, अतः वोल्टता सौ गुनी करना धारा सौ गुनी घटाता — और ऊष्मा-हानि दस हज़ार गुनी। ट्रांसफ़ॉर्मर शहर पर वोल्टता वापस उतारते क्योंकि उपकरणों को सुरक्षित कम वोल्टता चाहिए",
            mr: "ते संक्रमण-तारांत उष्णतेच्या रूपात वाया जाणारी ऊर्जा वाचवत आहेत. ती हानी I²R, म्हणून धारेच्या वर्गावर अवलंबून, व्होल्टतेवर नाही. दिल्या जाणाऱ्या ठराविक शक्तीसाठी शक्ती बरोबर व्होल्टता गुणिले धारा, म्हणून व्होल्टता शंभरपट करणे धारा शंभरपट घटवते — आणि उष्णता-हानी दहा हजारपट. रोहित्रे शहरात व्होल्टता पुन्हा उतरवतात कारण उपकरणांना सुरक्षित कमी व्होल्टता लागते",
          },
          {
            en: "High voltage makes the electrons travel faster, so the electricity arrives sooner and less of it is lost on the way",
            hi: "ऊँची वोल्टता इलेक्ट्रॉनों को तेज़ चलाती, अतः बिजली जल्दी पहुँचती और रास्ते में कम गँवाई जाती",
            mr: "उच्च व्होल्टता इलेक्ट्रॉनांना वेगाने चालवते, म्हणून वीज लवकर पोहोचते आणि वाटेत कमी वाया जाते",
          },
          {
            en: "The loss depends on the square of the voltage, so a higher voltage would waste more — the practice is a historical mistake",
            hi: "हानि वोल्टता के वर्ग पर निर्भर, अतः ऊँची वोल्टता अधिक गँवाती — यह प्रथा एक ऐतिहासिक भूल",
            mr: "हानी व्होल्टतेच्या वर्गावर अवलंबून, म्हणून उच्च व्होल्टता अधिक वाया घालवेल — ही प्रथा एक ऐतिहासिक चूक",
          },
          {
            en: "Nothing is saved; the voltage is raised only so that the same wires can carry more separate customers",
            hi: "कुछ नहीं बचता; वोल्टता केवल इसलिए बढ़ाई कि वही तारें अधिक अलग ग्राहक ढो सकें",
            mr: "काहीही वाचत नाही; व्होल्टता फक्त यासाठी वाढवली की त्याच तारा अधिक स्वतंत्र ग्राहक वाहू शकतील",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "What is being saved is energy — specifically the electrical energy that would otherwise be lost as heat in the long transmission wires, and never reach the town at all. The reasoning rests on two formulae and the difference between them. The heat produced per second in a wire of resistance R carrying current I is I²R. Notice what appears in it and what does not: the loss depends on the current squared and on the wire's resistance, but the transmission voltage does not appear at all. So if you want to cut the waste, the only real lever is the current — and because the dependence is on I², halving the current quarters the loss, while cutting the current to a tenth cuts the loss to a hundredth. The wire's resistance R is fixed by the length of the run and the thickness of the cable; making it thicker helps but copper is expensive and there is a practical limit. Now the second formula: the power actually delivered to the town is P = VI. The town needs a certain power, and that number is fixed by what its people use. But the same P can be carried by a large current at a low voltage or by a small current at a high voltage, and those two combinations are equally good for the customer. This is the opening the engineers exploit. Raise the transmission voltage a hundredfold and, to deliver the same P, the current falls to one hundredth. The heating loss, going as I², falls to one ten-thousandth. A waste that might have consumed a large fraction of the generated power becomes almost negligible. That saving is worth more than the danger and the expense — hence the tall towers, the wide clearances and the transformers at both ends. At the town, of course, thousands of volts would be lethal in a house and would destroy every appliance, so a step-down transformer returns the supply to a safe 220 V before it reaches the wires in the walls. It is a genuine engineering trade: accept high voltage where nobody touches it, in exchange for very low current where the losses happen. (The wrong answers get the physics backwards — drift speed is irrelevant and in fact very slow, the loss goes as current squared and not voltage squared, and the practice is universal precisely because it works, not by accident.)",
          hi: "जो बचाया जा रहा वह ऊर्जा — विशेष रूप से वह विद्युत ऊर्जा जो अन्यथा लंबी संचरण-तारों में ऊष्मा बनकर गँवाई जाती और शहर तक पहुँचती ही नहीं। तर्क दो सूत्रों और उनके अंतर पर टिका। धारा I ढोते प्रतिरोध R के तार में प्रति सेकंड बनी ऊष्मा I²R। ध्यान दो उसमें क्या है और क्या नहीं: हानि धारा के वर्ग और तार के प्रतिरोध पर निर्भर, पर संचरण वोल्टता उसमें बिलकुल नहीं। अतः हानि घटानी हो तो असली उत्तोलक केवल धारा — और क्योंकि निर्भरता I² पर, धारा आधी करना हानि चौथाई करता, जबकि धारा दसवाँ करना हानि सौवाँ। तार का प्रतिरोध R दौड़ की लंबाई और केबल की मोटाई से सधा; मोटा करना मदद करता पर ताँबा महँगा और व्यावहारिक सीमा। अब दूसरा सूत्र: शहर तक वास्तव में पहुँचाई शक्ति P = VI। शहर को एक निश्चित शक्ति चाहिए, और वह संख्या उसके लोगों के उपयोग से सधी। पर वही P कम वोल्टता पर बड़ी धारा से या ऊँची वोल्टता पर छोटी धारा से ढोई जा सकती, और वे दोनों संयोजन ग्राहक के लिए समान रूप से अच्छे। यही झिरी अभियंता भुनाते। संचरण वोल्टता सौ गुनी करो और, वही P देने को, धारा सौवें भाग पर गिरती। I² से चलती ऊष्मा-हानि दस-हज़ारवें भाग पर गिरती। जो हानि उत्पन्न शक्ति का बड़ा अंश खा जाती वह लगभग नगण्य हो जाती। वह बचत ख़तरे और ख़र्च से अधिक मूल्यवान — इसी से ऊँचे मीनार, चौड़ी दूरियाँ और दोनों सिरों पर ट्रांसफ़ॉर्मर। शहर पर, ज़ाहिर है, हज़ारों वोल्ट घर में प्राणघातक होते और हर उपकरण नष्ट कर देते, अतः अपचायी ट्रांसफ़ॉर्मर दीवारों के तारों तक पहुँचने से पहले आपूर्ति सुरक्षित 220 V पर लौटाता। यह असली अभियांत्रिक सौदा: ऊँची वोल्टता वहाँ स्वीकारो जहाँ कोई छूता नहीं, बदले में बहुत कम धारा वहाँ जहाँ हानि होती। (ग़लत उत्तर भौतिकी उल्टी करते — अपवाह चाल अप्रासंगिक और वास्तव में बहुत धीमी, हानि धारा के वर्ग से चलती वोल्टता के वर्ग से नहीं, और यह प्रथा सार्वभौमिक ठीक इसलिए कि काम करती, संयोग से नहीं।)",
          mr: "जे वाचवले जात आहे ती ऊर्जा — विशेषतः ती विद्युत ऊर्जा जी एरवी लांब संक्रमण-तारांत उष्णता बनून वाया जाईल आणि शहरापर्यंत पोहोचणारच नाही. युक्तिवाद दोन सूत्रांवर आणि त्यांच्यातील फरकावर टेकलेला. धारा I वाहणाऱ्या रोध R च्या तारेत प्रति सेकंद निर्माण होणारी उष्णता I²R. लक्षात घ्या तीत काय आहे आणि काय नाही: हानी धारेच्या वर्गावर आणि तारेच्या रोधावर अवलंबून, पण संक्रमण व्होल्टता तीत मुळीच नाही. म्हणून हानी घटवायची असल्यास खरा उत्तोलक फक्त धारा — आणि अवलंबित्व I² वर असल्याने, धारा निम्मी करणे हानी चतुर्थांश करते, तर धारा दशांश करणे हानी शतांश. तारेचा रोध R धावेची लांबी आणि केबलच्या जाडीने ठरलेला; जाड करणे मदत करते पण तांबे महाग आणि व्यावहारिक मर्यादा. आता दुसरे सूत्र: शहरापर्यंत प्रत्यक्ष पोहोचवलेली शक्ती P = VI. शहराला ठराविक शक्ती लागते, आणि ती संख्या तिथल्या लोकांच्या वापराने ठरलेली. पण तीच P कमी व्होल्टतेवर मोठ्या धारेने वा उच्च व्होल्टतेवर लहान धारेने वाहता येते, आणि ती दोन्ही संयोजने ग्राहकासाठी सारखीच चांगली. हीच फट अभियंते वापरतात. संक्रमण व्होल्टता शंभरपट करा आणि, तीच P द्यायला, धारा शतांशावर घसरते. I² ने चालणारी उष्णता-हानी दहा-हजारांशावर घसरते. जी हानी निर्मित शक्तीचा मोठा अंश खाऊन टाकेल ती जवळजवळ नगण्य होते. ती बचत धोक्याहून आणि खर्चाहून अधिक मोलाची — म्हणूनच उंच मनोरे, रुंद अंतरे आणि दोन्ही टोकांना रोहित्रे. शहरात, अर्थात, हजारो व्होल्ट घरात प्राणघातक ठरतील आणि प्रत्येक उपकरण नष्ट करतील, म्हणून अपचायी रोहित्र भिंतींतील तारांपर्यंत पोहोचण्याआधी पुरवठा सुरक्षित 220 V वर परत आणते. हा खराखुरा अभियांत्रिकी सौदा: उच्च व्होल्टता तिथे स्वीकारा जिथे कोणी स्पर्श करत नाही, त्याबदल्यात खूप कमी धारा तिथे जिथे हानी होते. (चुकीची उत्तरे भौतिकशास्त्र उलटे करतात — अपवहन वेग असंबद्ध आणि प्रत्यक्षात खूप मंद, हानी धारेच्या वर्गाने चालते व्होल्टतेच्या वर्गाने नाही, आणि ही प्रथा सार्वत्रिक नेमके यासाठी की ती चालते, योगायोगाने नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 12 — Magnetic Effects of Electric Current                       */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-magnetic-effects",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 12 — Magnetic Effects of Electric Current",
      hi: "अध्याय 12 — विद्युत धारा के चुंबकीय प्रभाव",
      mr: "प्रकरण 12 — विद्युत धारेचे चुंबकीय परिणाम",
    },
    name: {
      en: "Magnetic Effects of Electric Current",
      hi: "विद्युत धारा के चुंबकीय प्रभाव",
      mr: "विद्युत धारेचे चुंबकीय परिणाम",
    },
    summary: {
      en: "Two effects that turn out to be one relationship read in both directions: current making a field around every wire, a field pushing back on every current-carrying wire, the motor built on that push, the generator built on the reverse — and, at home, the third wire that quietly waits for the day the appliance fails.",
      hi: "दो प्रभाव जो निकलते एक ही संबंध दोनों दिशाओं में पढ़ा: हर तार के चारों ओर क्षेत्र बनाती धारा, हर धारावाही तार पर वापस धकेलता क्षेत्र, उस धक्के पर बनी मोटर, उलटे पर बना जनित्र — और घर में वह तीसरा तार जो चुपचाप उस दिन की प्रतीक्षा करता जब उपकरण बिगड़े।",
      mr: "दोन परिणाम जे निघतात एकच नाते दोन्ही दिशांनी वाचलेले: प्रत्येक तारेभोवती क्षेत्र निर्माण करणारी धारा, प्रत्येक धारावाही तारेवर परत ढकलणारे क्षेत्र, त्या धक्क्यावर बांधलेली मोटर, उलट्यावर बांधलेले जनित्र — आणि घरात ती तिसरी तार जी गुपचूप त्या दिवसाची वाट पाहते जेव्हा उपकरण बिघडेल.",
    },
    position: 12,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "magnetic-field-lines",
        name: {
          en: "Magnetic field lines",
          hi: "चुंबकीय क्षेत्र रेखाएँ",
          mr: "चुंबकीय क्षेत्र रेषा",
        },
        kind: "idea",
        prompt: {
          en: "Iron filings sprinkled around a bar magnet arrange themselves into closed curves running out of one end and into the other. Which drawn curves represent the direction and strength of a magnetic field?",
          hi: "छड़ चुंबक के चारों ओर छिड़का लोहचूर्ण एक सिरे से निकल दूसरे में घुसते बंद वक्रों में सज जाता। कौन-से खींचे वक्र चुंबकीय क्षेत्र की दिशा और प्रबलता दर्शाते?",
          mr: "दंडचुंबकाभोवती शिंपडलेला लोहकीस एका टोकातून निघून दुसऱ्यात शिरणाऱ्या बंद वक्रांत मांडला जातो. कोणते काढलेले वक्र चुंबकीय क्षेत्राची दिशा आणि प्रबळता दर्शवतात?",
        },
        statement: {
          en: "Magnetic field lines are drawn to show a field's direction — from north to south outside the magnet and south to north inside it — with crowded lines meaning a stronger field.",
          hi: "चुंबकीय क्षेत्र रेखाएँ क्षेत्र की दिशा दिखाने खींचीं — चुंबक के बाहर उत्तर से दक्षिण और भीतर दक्षिण से उत्तर — घनी रेखाएँ यानी प्रबल क्षेत्र।",
          mr: "चुंबकीय क्षेत्र रेषा क्षेत्राची दिशा दाखवायला काढल्या — चुंबकाबाहेर उत्तरेकडून दक्षिणेकडे आणि आत दक्षिणेकडून उत्तरेकडे — दाट रेषा म्हणजे प्रबळ क्षेत्र.",
        },
        detail: {
          en: "No two of them can ever cross, because a compass needle placed at a crossing would have to point two ways at once.",
          hi: "उनमें से कोई दो कभी नहीं कट सकतीं, क्योंकि कटान पर रखी दिक्सूचक सुई को एक साथ दो ओर इशारा करना पड़ता।",
          mr: "त्यांतील कोणत्याही दोन कधीही छेदू शकत नाहीत, कारण छेदावर ठेवलेल्या दिशादर्शक सुईला एकाच वेळी दोन दिशांना निर्देश करावा लागेल.",
        },
        extra: {
          en: "They are always closed loops, never beginning or ending anywhere, unlike the lines drawn around an isolated electric charge.",
          hi: "वे सदा बंद पाश, कहीं न आरंभ न अंत, एकाकी विद्युत आवेश के चारों ओर खींची रेखाओं के विपरीत।",
          mr: "त्या सदैव बंद फेरे, कुठे ना सुरू ना संपणाऱ्या, एकाकी विद्युतभाराभोवती काढलेल्या रेषांच्या उलट.",
        },
        pair: {
          left: {
            en: "Closed curves showing a field's direction",
            hi: "क्षेत्र की दिशा दिखाते बंद वक्र",
            mr: "क्षेत्राची दिशा दाखवणारे बंद वक्र",
          },
          right: {
            en: "magnetic field lines",
            hi: "चुंबकीय क्षेत्र रेखाएँ",
            mr: "चुंबकीय क्षेत्र रेषा",
          },
        },
      },
      {
        id: "right-hand-thumb-rule",
        name: {
          en: "The right-hand thumb rule",
          hi: "दाहिने हाथ के अंगूठे का नियम",
          mr: "उजव्या हाताच्या अंगठ्याचा नियम",
        },
        kind: "rule",
        prompt: {
          en: "Grip a straight wire with your right hand, thumb pointing the way the current flows, and your curled fingers show which way the circular field runs. Which rule is this?",
          hi: "सीधे तार को दाहिने हाथ से पकड़ो, अंगूठा धारा की दिशा में, और मुड़ी उँगलियाँ दिखातीं वृत्ताकार क्षेत्र किस ओर घूमता। यह कौन-सा नियम?",
          mr: "सरळ तार उजव्या हाताने पकडा, अंगठा धारेच्या दिशेने, आणि वळलेली बोटे दाखवतात वर्तुळाकार क्षेत्र कोणत्या दिशेने फिरते. हा कोणता नियम?",
        },
        statement: {
          en: "The right-hand thumb rule gives the direction of the circular field around a straight conductor: point the thumb along the current and the curled fingers give the field's sense.",
          hi: "दाहिने हाथ के अंगूठे का नियम सीधे चालक के चारों ओर वृत्ताकार क्षेत्र की दिशा देता: अंगूठा धारा के अनुदिश और मुड़ी उँगलियाँ क्षेत्र का घुमाव देतीं।",
          mr: "उजव्या हाताच्या अंगठ्याचा नियम सरळ वाहकाभोवतीच्या वर्तुळाकार क्षेत्राची दिशा देतो: अंगठा धारेच्या दिशेने आणि वळलेली बोटे क्षेत्राचा फेरा देतात.",
        },
        detail: {
          en: "The circles are concentric with the wire and grow wider apart further from it, showing the field weakens with distance.",
          hi: "वृत्त तार के संकेंद्री और उससे दूर जाते चौड़े होते जाते, दिखाते क्षेत्र दूरी से दुर्बल होता।",
          mr: "वर्तुळे तारेशी समकेंद्री आणि तिच्यापासून दूर जाताना रुंदावत जातात, दाखवत क्षेत्र अंतराने दुर्बळ होते.",
        },
        extra: {
          en: "Reverse the current and every circle reverses with it — the field has no life of its own once the switch opens.",
          hi: "धारा उलटो और हर वृत्त उसके साथ उलटता — स्विच खुलते ही क्षेत्र का अपना कोई जीवन नहीं।",
          mr: "धारा उलटवा आणि प्रत्येक वर्तुळ तिच्यासोबत उलटते — बटण उघडताच क्षेत्राला स्वतःचे जीवन नाही.",
        },
        pair: {
          left: {
            en: "Thumb on the current, fingers on the field",
            hi: "अंगूठा धारा पर, उँगलियाँ क्षेत्र पर",
            mr: "अंगठा धारेवर, बोटे क्षेत्रावर",
          },
          right: {
            en: "the right-hand thumb rule",
            hi: "दाहिने हाथ के अंगूठे का नियम",
            mr: "उजव्या हाताच्या अंगठ्याचा नियम",
          },
        },
      },
      {
        id: "solenoid",
        name: {
          en: "The current-carrying solenoid",
          hi: "धारावाही परिनालिका",
          mr: "धारावाही नलिकावेटोळे",
        },
        kind: "device",
        prompt: {
          en: "Wind a long insulated wire into many close turns, pass a current, and the field inside comes out uniform and straight, with the whole coil behaving like a bar magnet. Which arrangement is this?",
          hi: "लंबा विद्युतरोधी तार अनेक पास-पास फेरों में लपेटो, धारा बहाओ, और भीतर का क्षेत्र एकसमान और सीधा निकलता, पूरी कुंडली छड़ चुंबक-सी बरतती। यह कौन-सी व्यवस्था?",
          mr: "लांब विद्युतरोधक तार अनेक जवळजवळ वेढ्यांत गुंडाळा, धारा वाहवा, आणि आतले क्षेत्र एकसमान आणि सरळ निघते, अख्खे वेटोळे दंडचुंबकासारखे वागते. ही कोणती मांडणी?",
        },
        statement: {
          en: "A solenoid is a long coil of many closely wound turns; a current through it produces a uniform field inside and a pattern outside exactly like a bar magnet's, with a north and a south end.",
          hi: "परिनालिका अनेक पास-पास लपेटे फेरों की लंबी कुंडली; उससे बहती धारा भीतर एकसमान क्षेत्र और बाहर ठीक छड़ चुंबक जैसा प्रतिरूप बनाती, एक उत्तर और एक दक्षिण सिरे के साथ।",
          mr: "नलिकावेटोळे म्हणजे अनेक जवळजवळ गुंडाळलेल्या वेढ्यांची लांब कुंडली; तिच्यातून वाहणारी धारा आत एकसमान क्षेत्र आणि बाहेर नेमके दंडचुंबकासारखे प्रारूप बनवते, एक उत्तर आणि एक दक्षिण टोकासह.",
        },
        detail: {
          en: "Its field strengthens if the current is raised, if more turns are packed in, or if a soft iron core is slipped inside.",
          hi: "इसका क्षेत्र प्रबल होता यदि धारा बढ़ाई जाए, अधिक फेरे भरे जाएँ, या भीतर नर्म लोहे का क्रोड सरकाया जाए।",
          mr: "तिचे क्षेत्र प्रबळ होते जर धारा वाढवली, अधिक वेढे भरले, वा आत मऊ लोखंडाचा गाभा सरकवला.",
        },
        extra: {
          en: "Soft iron is chosen for the core precisely because it loses its magnetism the moment the current stops, which is what makes the magnetism switchable.",
          hi: "क्रोड के लिए नर्म लोहा ठीक इसीलिए चुना कि धारा रुकते ही वह अपना चुंबकत्व खो देता, यही चुंबकत्व को स्विच से चलाने योग्य बनाता।",
          mr: "गाभ्यासाठी मऊ लोखंड नेमके यासाठीच निवडले की धारा थांबताच ते आपले चुंबकत्व गमावते, हेच चुंबकत्व बटणाने चालवण्याजोगे बनवते.",
        },
        pair: {
          left: {
            en: "A coil that behaves like a bar magnet",
            hi: "छड़ चुंबक-सी बरतती कुंडली",
            mr: "दंडचुंबकासारखे वागणारे वेटोळे",
          },
          right: {
            en: "a solenoid",
            hi: "परिनालिका",
            mr: "नलिकावेटोळे",
          },
        },
      },
      {
        id: "flemings-left-hand-rule",
        name: {
          en: "Fleming's left-hand rule",
          hi: "फ़्लेमिंग का वाम-हस्त नियम",
          mr: "फ्लेमिंगचा डाव्या हाताचा नियम",
        },
        kind: "rule",
        prompt: {
          en: "Stretch the first three fingers of the left hand mutually perpendicular: forefinger on the field, middle finger on the current, and the thumb then points where the wire is pushed. Which rule gives the direction of that force?",
          hi: "बाएँ हाथ की पहली तीन उँगलियाँ परस्पर लंबवत तानो: तर्जनी क्षेत्र पर, मध्यमा धारा पर, और अंगूठा तब बताता तार किधर धकेला जाता। कौन-सा नियम उस बल की दिशा देता?",
          mr: "डाव्या हाताची पहिली तीन बोटे परस्पर लंब ताणा: तर्जनी क्षेत्रावर, मधले बोट धारेवर, आणि अंगठा मग दाखवतो तार कुठे ढकलली जाते. कोणता नियम त्या बलाची दिशा देतो?",
        },
        statement: {
          en: "Fleming's left-hand rule gives the direction of the force on a current-carrying conductor placed in a magnetic field, with forefinger for field, middle finger for current and thumb for force.",
          hi: "फ़्लेमिंग का वाम-हस्त नियम चुंबकीय क्षेत्र में रखे धारावाही चालक पर बल की दिशा देता, तर्जनी क्षेत्र के लिए, मध्यमा धारा के लिए और अंगूठा बल के लिए।",
          mr: "फ्लेमिंगचा डाव्या हाताचा नियम चुंबकीय क्षेत्रात ठेवलेल्या धारावाही वाहकावरील बलाची दिशा देतो, तर्जनी क्षेत्रासाठी, मधले बोट धारेसाठी आणि अंगठा बलासाठी.",
        },
        detail: {
          en: "The force is largest when the wire lies at right angles to the field, and falls to nothing when the wire lies along it.",
          hi: "बल सबसे बड़ा जब तार क्षेत्र के समकोण पर, और शून्य हो जाता जब तार उसके अनुदिश।",
          mr: "बल सर्वांत मोठे जेव्हा तार क्षेत्राला काटकोनात, आणि शून्य होते जेव्हा तार तिच्या दिशेने.",
        },
        extra: {
          en: "Reversing either the current or the field flips the push; reversing both together leaves it exactly where it was.",
          hi: "धारा या क्षेत्र में से कोई एक उलटो तो धक्का पलटता; दोनों साथ उलटो तो वह ठीक वहीं रहता।",
          mr: "धारा वा क्षेत्र यांपैकी एक उलटवल्यास धक्का पलटतो; दोन्ही एकत्र उलटवल्यास तो नेमका तिथेच राहतो.",
        },
        pair: {
          left: {
            en: "Field, current, force on three left fingers",
            hi: "बाएँ हाथ की तीन उँगलियों पर क्षेत्र, धारा, बल",
            mr: "डाव्या हाताच्या तीन बोटांवर क्षेत्र, धारा, बल",
          },
          right: {
            en: "Fleming's left-hand rule",
            hi: "फ़्लेमिंग का वाम-हस्त नियम",
            mr: "फ्लेमिंगचा डाव्या हाताचा नियम",
          },
        },
      },
      {
        id: "electric-motor",
        name: {
          en: "The electric motor",
          hi: "विद्युत मोटर",
          mr: "विद्युत मोटर",
        },
        kind: "device",
        prompt: {
          en: "A coil in a magnetic field is pushed one way on one side and the opposite way on the other, so it spins — and a split ring reverses the current every half turn to keep it spinning. Which machine is this?",
          hi: "चुंबकीय क्षेत्र में कुंडली एक ओर एक दिशा में और दूसरी ओर उल्टी दिशा में धकेली जाती, अतः घूमती — और विभक्त वलय हर आधे चक्कर पर धारा उलटकर घुमाव बनाए रखता। यह कौन-सी मशीन?",
          mr: "चुंबकीय क्षेत्रातील कुंडली एका बाजूला एका दिशेने आणि दुसऱ्या बाजूला उलट दिशेने ढकलली जाते, म्हणून फिरते — आणि विभक्त कडे प्रत्येक अर्ध्या फेऱ्याला धारा उलटवून फिरणे टिकवते. हे कोणते यंत्र?",
        },
        statement: {
          en: "An electric motor converts electrical energy into mechanical energy, using the force on a current-carrying coil in a magnetic field to turn a shaft.",
          hi: "विद्युत मोटर विद्युत ऊर्जा को यांत्रिक ऊर्जा में बदलती, चुंबकीय क्षेत्र में धारावाही कुंडली पर बल से धुरी घुमाती।",
          mr: "विद्युत मोटर विद्युत ऊर्जेचे यांत्रिक ऊर्जेत रूपांतर करते, चुंबकीय क्षेत्रातील धारावाही कुंडलीवरील बलाने दांडा फिरवते.",
        },
        detail: {
          en: "The split-ring commutator is the essential part: without it the coil would turn half a circle, be pushed back, and merely rock instead of rotating.",
          hi: "विभक्त वलय दिक्परिवर्तक अनिवार्य भाग: उसके बिना कुंडली आधा चक्कर घूमकर वापस धकेली जाती और घूमने के बजाय बस झूलती।",
          mr: "विभक्त कडे दिशाबदलक अत्यावश्यक भाग: त्याविना कुंडली अर्धा फेरा फिरून परत ढकलली जाई आणि फिरण्याऐवजी फक्त झुलत राही.",
        },
        extra: {
          en: "It sits inside fans, pumps, mixers and washing machines — nearly every household machine that moves something is one of these.",
          hi: "यह पंखों, पंपों, मिक्सर और वॉशिंग मशीनों के भीतर बैठी — घर की लगभग हर मशीन जो कुछ हिलाती इन्हीं में से एक।",
          mr: "ती पंखे, पंप, मिक्सर आणि वॉशिंग मशीनच्या आत बसलेली — घरातले जवळजवळ प्रत्येक यंत्र जे काही हलवते ते यांपैकीच एक.",
        },
        pair: {
          left: {
            en: "Electrical energy turned into motion",
            hi: "विद्युत ऊर्जा गति में बदली",
            mr: "विद्युत ऊर्जेचे गतीत रूपांतर",
          },
          right: {
            en: "an electric motor",
            hi: "विद्युत मोटर",
            mr: "विद्युत मोटर",
          },
        },
      },
      {
        id: "electromagnetic-induction",
        name: {
          en: "Electromagnetic induction",
          hi: "विद्युतचुंबकीय प्रेरण",
          mr: "विद्युतचुंबकीय प्रेरण",
        },
        kind: "process",
        prompt: {
          en: "Push a magnet into a closed coil and the galvanometer needle kicks; hold the magnet still inside and it falls back to zero. Which production of a current by a changing magnetic field is this?",
          hi: "चुंबक को बंद कुंडली में धकेलो और धारामापी की सुई झटका खाती; चुंबक भीतर स्थिर रखो और वह शून्य पर लौट आती। बदलते चुंबकीय क्षेत्र से धारा का यह कौन-सा उत्पादन?",
          mr: "चुंबक बंद कुंडलीत ढकला आणि धारामापकाची सुई झटका घेते; चुंबक आत स्थिर धरा आणि ती शून्यावर परतते. बदलत्या चुंबकीय क्षेत्राने धारेची ही कोणती निर्मिती?",
        },
        statement: {
          en: "Electromagnetic induction is the setting up of a current in a coil by a changing magnetic field, and its direction is given by Fleming's right-hand rule.",
          hi: "विद्युतचुंबकीय प्रेरण बदलते चुंबकीय क्षेत्र द्वारा कुंडली में धारा का उठना, और उसकी दिशा फ़्लेमिंग के दक्षिण-हस्त नियम से।",
          mr: "विद्युतचुंबकीय प्रेरण म्हणजे बदलत्या चुंबकीय क्षेत्राने कुंडलीत धारा उभी राहणे, आणि तिची दिशा फ्लेमिंगच्या उजव्या हाताच्या नियमाने.",
        },
        detail: {
          en: "It is the change that matters, not the field itself — a magnet resting inside a coil induces nothing at all, however strong it is.",
          hi: "मायने बदलाव रखता, क्षेत्र स्वयं नहीं — कुंडली के भीतर विश्राम करता चुंबक कुछ भी प्रेरित नहीं करता, चाहे कितना प्रबल हो।",
          mr: "महत्त्व बदलाला, क्षेत्राला स्वतःला नाही — कुंडलीच्या आत विसावलेला चुंबक काहीही प्रेरित करत नाही, कितीही प्रबळ असो.",
        },
        extra: {
          en: "The electric generator is built on it, spinning a coil in a field so that the change is produced continuously and mechanical energy becomes electrical.",
          hi: "विद्युत जनित्र इसी पर बना, क्षेत्र में कुंडली घुमाकर ताकि बदलाव लगातार बने और यांत्रिक ऊर्जा विद्युत बने।",
          mr: "विद्युत जनित्र यावरच बांधलेले, क्षेत्रात कुंडली फिरवून जेणेकरून बदल सतत घडतो आणि यांत्रिक ऊर्जा विद्युत बनते.",
        },
        pair: {
          left: {
            en: "A changing field making a current",
            hi: "बदलता क्षेत्र धारा बनाए",
            mr: "बदलते क्षेत्र धारा घडवते",
          },
          right: {
            en: "electromagnetic induction",
            hi: "विद्युतचुंबकीय प्रेरण",
            mr: "विद्युतचुंबकीय प्रेरण",
          },
        },
      },
      {
        id: "earth-wire",
        name: {
          en: "The earth wire",
          hi: "भू-संपर्क तार",
          mr: "भूसंपर्क तार",
        },
        kind: "safety",
        prompt: {
          en: "The third pin of a plug leads to a green wire that carries no current at all in normal use, yet a metal-bodied iron must never be run without it. Which safety conductor is this?",
          hi: "प्लग की तीसरी पिन एक हरे तार तक जाती जो सामान्य उपयोग में कोई धारा नहीं ढोता, फिर भी धातु-देह वाली इस्तरी उसके बिना कभी नहीं चलानी। यह कौन-सा सुरक्षा चालक?",
          mr: "प्लगची तिसरी पिन एका हिरव्या तारेकडे जाते जी सामान्य वापरात कोणतीही धारा वाहत नाही, तरीही धातू-देहाची इस्त्री तिच्याविना कधीही चालवू नये. हा कोणता सुरक्षा वाहक?",
        },
        statement: {
          en: "The earth wire connects an appliance's metal body to the ground, so that if a live wire touches the body the fault current escapes safely into the earth instead of through a person.",
          hi: "भू-संपर्क तार उपकरण की धातु-देह को ज़मीन से जोड़ता, ताकि विद्युन्मय तार देह छू जाए तो दोष-धारा किसी व्यक्ति से नहीं, सुरक्षित ज़मीन में निकल जाए।",
          mr: "भूसंपर्क तार उपकरणाच्या धातू-देहाला जमिनीशी जोडते, जेणेकरून विद्युतयुक्त तार देहाला लागल्यास दोष-धारा माणसातून नव्हे तर सुरक्षितपणे जमिनीत निसटते.",
        },
        detail: {
          en: "That sudden large current also blows the fuse or trips the breaker, cutting the supply within a fraction of a second.",
          hi: "वह अचानक बड़ी धारा फ़्यूज़ भी उड़ाती या ब्रेकर गिराती, सेकंड के अंश में आपूर्ति काट देती।",
          mr: "ती अचानक मोठी धारा फ्यूजही उडवते वा ब्रेकर पाडते, सेकंदाच्या अंशात पुरवठा तोडते.",
        },
        extra: {
          en: "It works only because the earth is a huge conductor at zero potential, always ready to absorb charge without its own voltage rising.",
          hi: "यह केवल इसलिए काम करता कि पृथ्वी शून्य विभव पर विशाल चालक, अपनी वोल्टता चढ़ाए बिना आवेश सोखने सदा तैयार।",
          mr: "ते केवळ यामुळे काम करते की पृथ्वी शून्य विभवावरील विशाल वाहक, स्वतःची व्होल्टता न चढवता विद्युतभार शोषायला सदैव तयार.",
        },
        pair: {
          left: {
            en: "Idle in normal use, life-saving in a fault",
            hi: "सामान्य उपयोग में निष्क्रिय, दोष में प्राणरक्षक",
            mr: "सामान्य वापरात निष्क्रिय, दोषात प्राणरक्षक",
          },
          right: {
            en: "the earth wire",
            hi: "भू-संपर्क तार",
            mr: "भूसंपर्क तार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A simple motor is built from a rectangular coil between two magnet poles. Without one small component the coil swings a half turn, stops, and swings back — it rocks but never rotates. Name that component, and explain exactly what it must do and why the motor is useless without it.",
          hi: "दो चुंबक ध्रुवों के बीच आयताकार कुंडली से साधारण मोटर बनी। एक छोटे पुर्ज़े के बिना कुंडली आधा चक्कर झूलती, रुकती, और वापस झूलती — वह डोलती पर कभी घूमती नहीं। उस पुर्ज़े का नाम लो, और ठीक-ठीक समझाओ उसे क्या करना और उसके बिना मोटर बेकार क्यों।",
          mr: "दोन चुंबक ध्रुवांदरम्यान आयताकार कुंडलीतून साधी मोटर बनवली. एका लहान भागाविना कुंडली अर्धा फेरा झुलते, थांबते, आणि परत झुलते — ती डुलते पण कधी फिरत नाही. त्या भागाचे नाव सांगा, आणि नेमके समजावा त्याने काय करावे आणि त्याविना मोटर निरुपयोगी का.",
        },
        choices: [
          {
            en: "The split-ring commutator. The two sides of the coil carry current in opposite directions, so Fleming's left-hand rule pushes one side up and the other down, turning the coil. But after half a turn the sides have swapped places and the same pushes would now drive it back. The commutator reverses the current in the coil at exactly that moment, so the forces keep turning it the same way and the rotation continues",
            hi: "विभक्त वलय दिक्परिवर्तक। कुंडली की दोनों भुजाएँ उल्टी दिशाओं में धारा ढोतीं, अतः फ़्लेमिंग का वाम-हस्त नियम एक भुजा ऊपर और दूसरी नीचे धकेलता, कुंडली घुमाता। पर आधे चक्कर बाद भुजाएँ जगह बदल चुकीं और वही धक्के अब उसे वापस चलाते। दिक्परिवर्तक ठीक उसी क्षण कुंडली में धारा उलट देता, अतः बल उसे उसी ओर घुमाते रहते और घूर्णन चलता रहता",
            mr: "विभक्त कडे दिशाबदलक. कुंडलीच्या दोन्ही बाजू उलट दिशांना धारा वाहतात, म्हणून फ्लेमिंगचा डाव्या हाताचा नियम एक बाजू वर आणि दुसरी खाली ढकलतो, कुंडली फिरवतो. पण अर्ध्या फेऱ्यानंतर बाजूंनी जागा बदलल्या आणि तेच धक्के आता तिला परत चालवतील. दिशाबदलक नेमक्या त्याच क्षणी कुंडलीतील धारा उलटवतो, म्हणून बले तिला त्याच दिशेने फिरवत राहतात आणि परिभ्रमण चालू राहते",
          },
          {
            en: "A second battery, which is needed because one cell cannot supply enough current to complete a full turn",
            hi: "दूसरी बैटरी, जो चाहिए क्योंकि एक सेल पूरा चक्कर पूरा करने भर धारा नहीं दे सकता",
            mr: "दुसरी बॅटरी, जी लागते कारण एक घट पूर्ण फेरा पूर्ण करण्याइतकी धारा देऊ शकत नाही",
          },
          {
            en: "A stronger magnet, since the rocking simply means the field is too weak to complete the circle",
            hi: "अधिक प्रबल चुंबक, क्योंकि डोलने का अर्थ बस यह कि क्षेत्र वृत्त पूरा करने को बहुत दुर्बल",
            mr: "अधिक प्रबळ चुंबक, कारण डुलण्याचा अर्थ फक्त इतका की क्षेत्र वर्तुळ पूर्ण करायला फार दुर्बळ",
          },
          {
            en: "An extra coil at right angles, because a single coil can never experience any force at all",
            hi: "समकोण पर एक अतिरिक्त कुंडली, क्योंकि अकेली कुंडली पर कोई बल कभी लग ही नहीं सकता",
            mr: "काटकोनात एक जादा कुंडली, कारण एकट्या कुंडलीवर कोणतेही बल कधी लागूच शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The missing part is the split-ring commutator, and understanding why it is indispensable means following the coil through one full turn. Start with the force. A wire carrying current in a magnetic field is pushed sideways, and Fleming's left-hand rule gives the direction: forefinger along the field, middle finger along the current, thumb showing the push. Now look at the rectangular coil. Current runs around the loop, so on one arm it flows one way and on the opposite arm it flows the other way — while the magnetic field is the same across both. Opposite currents in the same field mean opposite forces, so one arm is pushed up while the other is pushed down. Two opposite pushes on opposite sides of an axle are exactly a turning effect, and the coil begins to rotate. So far so good — but now trace it half a turn onward. The arm that started on the left is now on the right, and vice versa. The field has not changed and the current direction in each arm has not changed, so the arm now on the right is still being pushed the same way in space as before. But 'the same way in space' now works against the rotation, because the arm has swapped sides. The turning effect reverses, the coil is driven back the way it came, and all you get is a rocking motion — the coil oscillates about one position and never completes a circle. The commutator fixes precisely this. It is a metal ring split into two halves, each half connected to one end of the coil, with brushes pressing against it. As the coil turns, the halves slide past the brushes and, at the very moment the arms swap sides, each half meets the opposite brush. That reverses the current through the coil. Reversing the current reverses the force on each arm, and since the arms have also swapped position, the two reversals cancel out — the turning effect points the same way as before. The coil is pushed onward instead of backward, and it keeps rotating. So the commutator's job is not to supply power or strengthen the field; it is to flip the current twice per revolution, at the exact instants when the geometry would otherwise turn a driving force into a braking one. (The wrong answers reach for more current, a stronger magnet or another coil — but none of those addresses the real problem, which is a reversal of direction and not a shortage of strength. A stronger magnet only makes the rocking more vigorous.)",
          hi: "लुप्त पुर्ज़ा विभक्त वलय दिक्परिवर्तक, और वह अपरिहार्य क्यों समझने को कुंडली को एक पूरे चक्कर तक पीछा करना होगा। बल से शुरू। चुंबकीय क्षेत्र में धारा ढोता तार बग़ल में धकेला जाता, और फ़्लेमिंग का वाम-हस्त नियम दिशा देता: तर्जनी क्षेत्र के अनुदिश, मध्यमा धारा के अनुदिश, अंगूठा धक्का दिखाता। अब आयताकार कुंडली देखो। धारा पाश के चारों ओर दौड़ती, अतः एक भुजा में एक ओर और सामने वाली भुजा में दूसरी ओर बहती — जबकि चुंबकीय क्षेत्र दोनों पर वही। उसी क्षेत्र में उल्टी धाराओं का अर्थ उल्टे बल, अतः एक भुजा ऊपर धकेली जबकि दूसरी नीचे। धुरी की उल्टी ओरों पर दो उल्टे धक्के ठीक घूर्णन-प्रभाव, और कुंडली घूमने लगती। यहाँ तक ठीक — पर अब आधा चक्कर आगे पीछा करो। जो भुजा बाईं ओर शुरू हुई अब दाईं ओर, और उल्टे। क्षेत्र नहीं बदला और हर भुजा में धारा की दिशा नहीं बदली, अतः अब दाईं ओर की भुजा अब भी अंतरिक्ष में उसी ओर धकेली जा रही जैसे पहले। पर 'अंतरिक्ष में वही ओर' अब घूर्णन के विरुद्ध काम करती, क्योंकि भुजा ने पक्ष बदल लिया। घूर्णन-प्रभाव उलटता, कुंडली जिस राह आई उसी वापस चलाई जाती, और जो मिलता वह बस डोलती गति — कुंडली एक स्थिति के आसपास दोलन करती और वृत्त कभी पूरा नहीं करती। दिक्परिवर्तक ठीक यही सुधारता। यह दो आधों में विभक्त धातु का वलय, हर आधा कुंडली के एक सिरे से जुड़ा, ब्रुश उससे दबे। कुंडली घूमते आधे ब्रुशों से सरकते और, ठीक उसी क्षण जब भुजाएँ पक्ष बदलतीं, हर आधा उल्टे ब्रुश से मिलता। वह कुंडली में धारा उलट देता। धारा उलटना हर भुजा पर बल उलटता, और चूँकि भुजाओं ने भी स्थिति बदली, दोनों उलटाव कट जाते — घूर्णन-प्रभाव पहले जैसी ही ओर इशारा करता। कुंडली पीछे नहीं, आगे धकेली जाती, और घूमती रहती। अतः दिक्परिवर्तक का काम शक्ति देना या क्षेत्र प्रबल करना नहीं; यह प्रति चक्कर दो बार धारा पलटना, ठीक उन क्षणों पर जब ज्यामिति अन्यथा चालक बल को रोकने वाला बना देती। (ग़लत उत्तर अधिक धारा, प्रबल चुंबक या एक और कुंडली की ओर बढ़ते — पर उनमें से कोई असली समस्या नहीं छूता, जो दिशा का उलटाव है, प्रबलता की कमी नहीं। प्रबल चुंबक केवल डोलना और ज़ोरदार बनाता।)",
          mr: "हरवलेला भाग विभक्त कडे दिशाबदलक, आणि तो अपरिहार्य का हे समजण्यासाठी कुंडलीचा एका पूर्ण फेऱ्यापर्यंत पाठलाग करावा लागेल. बलापासून सुरू. चुंबकीय क्षेत्रात धारा वाहणारी तार बाजूला ढकलली जाते, आणि फ्लेमिंगचा डाव्या हाताचा नियम दिशा देतो: तर्जनी क्षेत्राच्या दिशेने, मधले बोट धारेच्या दिशेने, अंगठा धक्का दाखवतो. आता आयताकार कुंडली पाहा. धारा फेऱ्याभोवती धावते, म्हणून एका बाजूत एका दिशेने आणि समोरच्या बाजूत दुसऱ्या दिशेने वाहते — तर चुंबकीय क्षेत्र दोन्हींवर तेच. त्याच क्षेत्रात उलट धारांचा अर्थ उलट बले, म्हणून एक बाजू वर ढकलली तर दुसरी खाली. दांड्याच्या उलट बाजूंवरील दोन उलट धक्के म्हणजे नेमका परिभ्रमण-परिणाम, आणि कुंडली फिरू लागते. इथवर ठीक — पण आता अर्धा फेरा पुढे पाठलाग करा. जी बाजू डावीकडे सुरू झाली ती आता उजवीकडे, आणि उलट. क्षेत्र बदलले नाही आणि प्रत्येक बाजूतील धारेची दिशा बदलली नाही, म्हणून आता उजवीकडची बाजू अजूनही अवकाशात त्याच दिशेने ढकलली जात आहे जशी आधी. पण 'अवकाशात तीच दिशा' आता परिभ्रमणाविरुद्ध काम करते, कारण बाजूने बाजू बदलली. परिभ्रमण-परिणाम उलटतो, कुंडली ज्या वाटेने आली त्याच वाटेने परत चालवली जाते, आणि जे मिळते ती फक्त डुलती गती — कुंडली एका स्थानाभोवती दोलन करते आणि वर्तुळ कधीही पूर्ण करत नाही. दिशाबदलक नेमके हेच दुरुस्त करतो. तो दोन अर्ध्यांत विभागलेला धातूचा कडा, प्रत्येक अर्धा कुंडलीच्या एका टोकाशी जोडलेला, ब्रश त्यावर दाबलेले. कुंडली फिरताना अर्धे ब्रशांवरून सरकतात आणि, नेमक्या त्याच क्षणी जेव्हा बाजू जागा बदलतात, प्रत्येक अर्धा उलट ब्रशला भेटतो. ते कुंडलीतील धारा उलटवते. धारा उलटवणे प्रत्येक बाजूवरील बल उलटवते, आणि बाजूंनीही स्थान बदलल्याने, दोन्ही उलटी रद्द होतात — परिभ्रमण-परिणाम आधीसारख्याच दिशेने निर्देश करतो. कुंडली मागे नव्हे तर पुढे ढकलली जाते, आणि फिरत राहते. म्हणून दिशाबदलकाचे काम शक्ती पुरवणे वा क्षेत्र प्रबळ करणे नाही; ते प्रति फेरा दोनदा धारा पलटणे, नेमक्या त्या क्षणी जेव्हा भूमिती एरवी चालक बलाचे रोखणारे बल करून टाकेल. (चुकीची उत्तरे अधिक धारा, प्रबळ चुंबक वा आणखी एक कुंडलीकडे जातात — पण त्यांपैकी कोणतेही खरी समस्या स्पर्शत नाही, जी दिशेचे उलटणे आहे, प्रबळतेची कमतरता नाही. प्रबळ चुंबक फक्त डुलणे अधिक जोरदार करतो.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Coal stations, nuclear plants, dams and windmills look nothing alike, yet almost every one of them makes electricity in the identical final step: something is made to spin a coil near magnets. Explain the principle that forces this common design, and why simply parking a very powerful magnet inside a coil would produce no electricity at all.",
          hi: "कोयला-गृह, नाभिकीय संयंत्र, बाँध और पवनचक्कियाँ बिलकुल एक-सी नहीं दिखतीं, फिर भी उनमें से लगभग हर एक बिजली उसी समान अंतिम चरण में बनाती: कुछ चुंबकों के पास कुंडली घुमाने लगाया जाता। वह सिद्धांत समझाओ जो यह साझा रचना थोपता, और क्यों कुंडली के भीतर बहुत प्रबल चुंबक बस खड़ा कर देने से कोई बिजली नहीं बनेगी।",
          mr: "कोळसा-केंद्रे, अणुसंयंत्रे, धरणे आणि पवनचक्क्या मुळीच सारख्या दिसत नाहीत, तरीही त्यांपैकी जवळजवळ प्रत्येक वीज त्याच समान अंतिम पायरीत बनवते: काहीतरी चुंबकांजवळ कुंडली फिरवायला लावले जाते. ती सामायिक रचना लादणारे तत्त्व समजावा, आणि कुंडलीच्या आत खूप प्रबळ चुंबक फक्त उभा करून ठेवल्याने वीज का बनणारच नाही.",
        },
        choices: [
          {
            en: "Electromagnetic induction: a current is induced in a coil only when the magnetic field through it is changing. A field that is merely strong but steady induces nothing, because there is no change — so a resting magnet, however powerful, gives no current. Spinning a coil in a field makes the field through it change continuously, which is why every one of these stations ends by turning a shaft, differing only in what supplies the turning",
            hi: "विद्युतचुंबकीय प्रेरण: कुंडली में धारा तभी प्रेरित होती जब उससे गुज़रता चुंबकीय क्षेत्र बदल रहा हो। केवल प्रबल पर स्थिर क्षेत्र कुछ प्रेरित नहीं करता, क्योंकि कोई बदलाव नहीं — अतः विश्राम करता चुंबक, चाहे कितना प्रबल, कोई धारा नहीं देता। क्षेत्र में कुंडली घुमाना उससे गुज़रता क्षेत्र लगातार बदलता, इसी से इनमें से हर गृह धुरी घुमाकर समाप्त होता, केवल इसमें भिन्न कि घुमाव कौन देता",
            mr: "विद्युतचुंबकीय प्रेरण: कुंडलीत धारा तेव्हाच प्रेरित होते जेव्हा तिच्यातून जाणारे चुंबकीय क्षेत्र बदलत असते. केवळ प्रबळ पण स्थिर क्षेत्र काहीही प्रेरित करत नाही, कारण कोणताही बदल नाही — म्हणून विसावलेला चुंबक, कितीही प्रबळ असो, कोणतीही धारा देत नाही. क्षेत्रात कुंडली फिरवणे तिच्यातून जाणारे क्षेत्र सतत बदलवते, म्हणूनच यांपैकी प्रत्येक केंद्र दांडा फिरवून संपते, फक्त फिरवणे कोण पुरवते यात वेगळे",
          },
          {
            en: "Magnets simply contain stored electricity, and spinning the coil is only a way of scraping it out faster",
            hi: "चुंबकों में बस संचित बिजली भरी, और कुंडली घुमाना उसे तेज़ी से खुरचने का बस एक तरीक़ा",
            mr: "चुंबकांत फक्त साठवलेली वीज भरलेली, आणि कुंडली फिरवणे ती वेगाने खरवडून काढण्याचा फक्त एक मार्ग",
          },
          {
            en: "A strong steady magnet inside a coil does give a steady current; the spinning is only to make the current larger",
            hi: "कुंडली के भीतर प्रबल स्थिर चुंबक स्थिर धारा देता ही है; घुमाना केवल धारा बड़ी करने को",
            mr: "कुंडलीच्या आत प्रबळ स्थिर चुंबक स्थिर धारा देतोच; फिरवणे फक्त धारा मोठी करायला",
          },
          {
            en: "The common design is a historical accident of engineering, with no physical principle behind it",
            hi: "साझा रचना अभियांत्रिकी का ऐतिहासिक संयोग, उसके पीछे कोई भौतिक सिद्धांत नहीं",
            mr: "सामायिक रचना अभियांत्रिकीचा ऐतिहासिक योगायोग, तिच्यामागे कोणतेही भौतिक तत्त्व नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The principle is electromagnetic induction, and its precise wording is what settles both halves of the question: a current is induced in a closed coil when the magnetic field passing through that coil changes. The word doing all the work is 'changes'. It is not the presence of a field that drives a current, and not its strength either — it is the alteration of the field from one instant to the next. This immediately answers the second part. Park the most powerful magnet you can find inside a coil, leave it there, and the field through the coil is enormous but perfectly constant. Nothing changes from moment to moment, so nothing is induced, and a galvanometer connected to the coil reads exactly zero. This is not a limitation of weak equipment; a magnet a thousand times stronger, held still, would give the same zero. You can see the point in the classroom demonstration: the needle kicks while you push the magnet in, kicks the other way while you pull it out, and rests at zero whenever the magnet is stationary — even when it is sitting deep inside the coil, where the field is strongest of all. Motion, or more precisely change, is the whole source. Now the first part follows. To generate electricity continuously you must arrange for the field through a coil to keep changing, and the most practical way ever found is to spin the coil in a magnetic field (or spin magnets past a fixed coil). As the coil turns, the amount of field passing through it rises and falls smoothly through every rotation, so a current is induced continuously — and, incidentally, one that reverses direction twice per turn, which is why mains supply is alternating current. This is what standardises the design of almost every power station on earth. A coal or gas station burns fuel to boil water and drive steam through a turbine; a nuclear plant uses fission heat to do the same; a hydroelectric dam lets falling water push the turbine; a windmill lets moving air do it. The fuel, the ethics, the cost and the pollution differ enormously — but the final step is identical, because induction offers no other way. Every one of them is, at its heart, a machine for turning a shaft. What separates a wind farm from a coal plant is not the physics of generation but where the turning comes from and what it costs the world to obtain it. (The wrong answers imagine magnets as reservoirs of stored electricity, or claim a steady field yields a steady current — both contradict the demonstration in which a stationary magnet gives nothing — or dismiss a deep physical necessity as mere convention.)",
          hi: "सिद्धांत विद्युतचुंबकीय प्रेरण, और उसका ठीक शब्दांकन ही प्रश्न के दोनों आधे तय करता: बंद कुंडली में धारा तब प्रेरित होती जब उस कुंडली से गुज़रता चुंबकीय क्षेत्र बदलता। सारा काम करता शब्द 'बदलता'। धारा को क्षेत्र की उपस्थिति नहीं चलाती, न उसकी प्रबलता — यह एक क्षण से अगले तक क्षेत्र का परिवर्तन। यह तुरंत दूसरा भाग उत्तरित करता। जो सबसे प्रबल चुंबक मिले उसे कुंडली के भीतर खड़ा करो, वहीं छोड़ दो, और कुंडली से गुज़रता क्षेत्र विशाल पर बिलकुल अचर। पल-पल कुछ नहीं बदलता, अतः कुछ प्रेरित नहीं, और कुंडली से जुड़ा धारामापी ठीक शून्य पढ़ता। यह दुर्बल उपकरण की सीमा नहीं; हज़ार गुना प्रबल चुंबक, स्थिर रखा, वही शून्य देता। कक्षा के प्रदर्शन में बात दिखती: चुंबक भीतर धकेलते सुई झटका खाती, बाहर खींचते दूसरी ओर झटका, और जब भी चुंबक स्थिर तब शून्य पर विश्राम — तब भी जब वह कुंडली के गहरे भीतर बैठा, जहाँ क्षेत्र सबसे प्रबल। गति, या अधिक ठीक कहें बदलाव, ही पूरा स्रोत। अब पहला भाग निकलता। लगातार बिजली बनाने को कुंडली से गुज़रता क्षेत्र बदलता रहे यह जुगाड़ना होगा, और अब तक मिला सबसे व्यावहारिक तरीक़ा चुंबकीय क्षेत्र में कुंडली घुमाना (या स्थिर कुंडली के पास चुंबक घुमाना)। कुंडली घूमते उससे गुज़रता क्षेत्र हर घूर्णन में सहज चढ़ता-उतरता, अतः धारा लगातार प्रेरित — और, संयोग से, ऐसी जो प्रति चक्कर दो बार दिशा उलटती, इसी से मेन्स की आपूर्ति प्रत्यावर्ती धारा। यही पृथ्वी के लगभग हर विद्युत-गृह की रचना मानकीकृत करता। कोयला या गैस का गृह ईंधन जलाकर पानी उबालता और भाप टरबाइन से चलाता; नाभिकीय संयंत्र विखंडन की ऊष्मा से वही करता; जलविद्युत बाँध गिरते पानी से टरबाइन धकेलवाता; पवनचक्की चलती हवा से। ईंधन, नैतिकता, लागत और प्रदूषण अत्यंत भिन्न — पर अंतिम चरण समान, क्योंकि प्रेरण कोई और रास्ता देता ही नहीं। उनमें से हर एक, मूल में, धुरी घुमाने की मशीन। पवन-खेत को कोयला-संयंत्र से जो अलग करता वह उत्पादन की भौतिकी नहीं बल्कि घुमाव कहाँ से आता और उसे पाने में दुनिया को क्या चुकाना पड़ता। (ग़लत उत्तर चुंबकों को संचित बिजली के भंडार मानते, या दावा करते स्थिर क्षेत्र स्थिर धारा देता — दोनों उस प्रदर्शन का खंडन जिसमें स्थिर चुंबक कुछ नहीं देता — या एक गहरी भौतिक अनिवार्यता को मात्र प्रथा कहकर टाल देते।)",
          mr: "तत्त्व विद्युतचुंबकीय प्रेरण, आणि त्याची नेमकी मांडणीच प्रश्नाचे दोन्ही अर्धे ठरवते: बंद कुंडलीत धारा तेव्हा प्रेरित होते जेव्हा त्या कुंडलीतून जाणारे चुंबकीय क्षेत्र बदलते. सर्व काम करणारा शब्द 'बदलते'. धारेला क्षेत्राची उपस्थिती चालवत नाही, ना तिची प्रबळता — तर एका क्षणापासून पुढच्यापर्यंत क्षेत्राचा बदल. हे लगेच दुसरा भाग उत्तरित करते. जो सर्वांत प्रबळ चुंबक मिळेल तो कुंडलीच्या आत उभा करा, तिथेच सोडा, आणि कुंडलीतून जाणारे क्षेत्र प्रचंड पण अगदी अचल. क्षणोक्षणी काहीच बदलत नाही, म्हणून काहीच प्रेरित होत नाही, आणि कुंडलीशी जोडलेला धारामापक नेमके शून्य वाचतो. ही दुर्बळ उपकरणाची मर्यादा नाही; हजारपट प्रबळ चुंबक, स्थिर धरलेला, तेच शून्य देईल. वर्गातील प्रात्यक्षिकात मुद्दा दिसतो: चुंबक आत ढकलताना सुई झटका घेते, बाहेर ओढताना दुसऱ्या दिशेने झटका, आणि जेव्हाही चुंबक स्थिर तेव्हा शून्यावर विसावा — तेव्हाही जेव्हा तो कुंडलीच्या खोल आत बसलेला, जिथे क्षेत्र सर्वांत प्रबळ. गती, किंवा अधिक नेमके सांगायचे तर बदल, हाच अख्खा स्रोत. आता पहिला भाग निघतो. सतत वीज बनवायला कुंडलीतून जाणारे क्षेत्र बदलत राहील अशी जुळणी करावी लागेल, आणि आजवर सापडलेला सर्वांत व्यावहारिक मार्ग म्हणजे चुंबकीय क्षेत्रात कुंडली फिरवणे (वा स्थिर कुंडलीजवळून चुंबक फिरवणे). कुंडली फिरताना तिच्यातून जाणारे क्षेत्र प्रत्येक परिभ्रमणात सहज चढते-उतरते, म्हणून धारा सतत प्रेरित — आणि, योगायोगाने, अशी जी प्रति फेरा दोनदा दिशा उलटवते, म्हणूनच मुख्य पुरवठा प्रत्यावर्ती धारा. हेच पृथ्वीवरील जवळजवळ प्रत्येक वीजकेंद्राची रचना प्रमाणित करते. कोळसा वा वायूचे केंद्र इंधन जाळून पाणी उकळते आणि वाफ टर्बाइनमधून चालवते; अणुसंयंत्र विखंडनाच्या उष्णतेने तेच करते; जलविद्युत धरण पडत्या पाण्याने टर्बाइन ढकलवते; पवनचक्की वाहत्या हवेने. इंधन, नीती, खर्च आणि प्रदूषण अतिशय वेगळे — पण अंतिम पायरी समान, कारण प्रेरण दुसरा मार्ग देतच नाही. त्यांपैकी प्रत्येक, मुळात, दांडा फिरवण्याचे यंत्र. पवन-शेताला कोळसा-संयंत्रापासून जे वेगळे करते ते निर्मितीचे भौतिकशास्त्र नव्हे तर फिरवणे कुठून येते आणि ते मिळवायला जगाला काय मोजावे लागते. (चुकीची उत्तरे चुंबकांना साठवलेल्या विजेचे साठे मानतात, वा दावा करतात स्थिर क्षेत्र स्थिर धारा देते — दोन्ही त्या प्रात्यक्षिकाचे खंडन ज्यात स्थिर चुंबक काहीच देत नाही — वा एका खोल भौतिक अपरिहार्यतेला केवळ प्रथा म्हणून झटकतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 13 — Our Environment                                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-10-our-environment",
    subject: "SCIENCE",
    classLevel: 10,
    chapter: {
      en: "Chapter 13 — Our Environment",
      hi: "अध्याय 13 — हमारा पर्यावरण",
      mr: "प्रकरण 13 — आपले पर्यावरण",
    },
    name: {
      en: "Our Environment",
      hi: "हमारा पर्यावरण",
      mr: "आपले पर्यावरण",
    },
    summary: {
      en: "Energy entering at one door and leaking away at every step: the living and non-living parts that make a working system, the three jobs every community must fill, the chain that carries food upward while ninety per cent of the energy is lost, the poison that travels the same chain and concentrates instead, and the waste and the shield that measure what we have done.",
      hi: "एक द्वार से घुसती और हर चरण पर रिसती ऊर्जा: काम करता तंत्र बनाते सजीव-निर्जीव अंग, हर समुदाय में भरे जाते तीन काम, ऊपर की ओर भोजन ढोती शृंखला जबकि नब्बे प्रतिशत ऊर्जा नष्ट, वही शृंखला चढ़ता पर इसके उलट गाढ़ा होता विष, और कचरा तथा कवच जो नापते हमने क्या किया।",
      mr: "एका दारातून शिरणारी आणि प्रत्येक पायरीवर गळणारी ऊर्जा: काम करणारी यंत्रणा घडवणारे सजीव-निर्जीव भाग, प्रत्येक समुदायात भरावी लागणारी तीन कामे, वर अन्न वाहून नेणारी साखळी तर नव्वद टक्के ऊर्जा नष्ट, तीच साखळी चढणारे पण याउलट दाट होणारे विष, आणि आपण काय केले हे मोजणारा कचरा व कवच.",
    },
    position: 13,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "ecosystem-components",
        name: {
          en: "The components of an ecosystem",
          hi: "पारितंत्र के घटक",
          mr: "परिसंस्थेचे घटक",
        },
        kind: "idea",
        prompt: {
          en: "A pond is not just its fish and weeds — its water, mud, light and temperature are as much a part of the working whole. Which pairing of living and non-living parts makes up such a self-running unit?",
          hi: "तालाब केवल उसकी मछलियाँ और घास-फूस नहीं — उसका पानी, कीचड़, प्रकाश और ताप भी काम करते पूरे का उतना ही अंग। सजीव और निर्जीव अंगों की कौन-सी जोड़ी ऐसी स्वयं-चलती इकाई बनाती?",
          mr: "तळे म्हणजे फक्त त्यातले मासे आणि शेवाळ नव्हे — त्याचे पाणी, गाळ, प्रकाश आणि तापमानही काम करणाऱ्या पूर्णाचा तितकाच भाग. सजीव आणि निर्जीव भागांची कोणती जोडी अशी स्वतः चालणारी एकक बनवते?",
        },
        statement: {
          en: "An ecosystem's components are its biotic part — all the living organisms — together with its abiotic part of soil, water, air, light and temperature, the two interacting as one working unit.",
          hi: "पारितंत्र के घटक उसका जैविक अंग — सब सजीव — और उसका अजैविक अंग मिट्टी, पानी, हवा, प्रकाश तथा ताप, दोनों एक कार्यरत इकाई की तरह अंतःक्रिया करते।",
          mr: "परिसंस्थेचे घटक म्हणजे तिचा जैविक भाग — सर्व सजीव — आणि तिचा अजैविक भाग माती, पाणी, हवा, प्रकाश व तापमान, दोन्ही एक कार्यरत एकक म्हणून परस्परक्रिया करत.",
        },
        detail: {
          en: "Some ecosystems are natural, like a forest or a lake, and others are made and maintained by people, like a crop field or an aquarium.",
          hi: "कुछ पारितंत्र प्राकृतिक, जैसे वन या झील, और कुछ लोगों द्वारा बने-संभाले, जैसे फ़सल का खेत या एक्वेरियम।",
          mr: "काही परिसंस्था नैसर्गिक, जसे जंगल वा सरोवर, आणि काही लोकांनी बनवलेल्या-सांभाळलेल्या, जसे पिकाचे शेत वा मत्स्यालय.",
        },
        extra: {
          en: "A human-made one usually needs constant tending because it lacks the variety that lets a natural system absorb a shock on its own.",
          hi: "मानव-निर्मित को आमतौर पर लगातार देखभाल चाहिए क्योंकि उसमें वह विविधता नहीं जो प्राकृतिक तंत्र को अपने आप झटका सह लेने देती।",
          mr: "मानवनिर्मितीला सहसा सतत निगा लागते कारण तिच्यात ती विविधता नाही जी नैसर्गिक यंत्रणेला स्वतःहून धक्का पचवू देते.",
        },
        pair: {
          left: {
            en: "Living and non-living working as one unit",
            hi: "सजीव और निर्जीव एक इकाई की तरह काम करते",
            mr: "सजीव आणि निर्जीव एक एकक म्हणून काम करत",
          },
          right: {
            en: "the components of an ecosystem",
            hi: "पारितंत्र के घटक",
            mr: "परिसंस्थेचे घटक",
          },
        },
      },
      {
        id: "producers-consumers-decomposers",
        name: {
          en: "Producers, consumers and decomposers",
          hi: "उत्पादक, उपभोक्ता और अपघटक",
          mr: "उत्पादक, भक्षक आणि विघटक",
        },
        kind: "idea",
        prompt: {
          en: "Green plants make the food, animals eat what others have made, and bacteria and fungi break the dead back into soil. Which three roles must every community fill for it to keep running?",
          hi: "हरे पौधे भोजन बनाते, जीव-जंतु दूसरों का बनाया खाते, और जीवाणु-कवक मृत को तोड़कर मिट्टी में लौटाते। हर समुदाय को चलते रहने को कौन-से तीन काम भरने होते?",
          mr: "हिरव्या वनस्पती अन्न बनवतात, प्राणी इतरांनी बनवलेले खातात, आणि जीवाणू-बुरशी मेलेल्यांना मोडून मातीत परत आणतात. प्रत्येक समुदायाला चालू राहायला कोणती तीन कामे भरावी लागतात?",
        },
        statement: {
          en: "Producers make their own food from sunlight, consumers feed on other organisms, and decomposers break down dead matter and return its nutrients to the soil.",
          hi: "उत्पादक धूप से अपना भोजन बनाते, उपभोक्ता दूसरे जीवों पर पलते, और अपघटक मृत पदार्थ तोड़कर उसके पोषक तत्व मिट्टी में लौटाते।",
          mr: "उत्पादक सूर्यप्रकाशातून स्वतःचे अन्न बनवतात, भक्षक इतर जीवांवर जगतात, आणि विघटक मृत पदार्थ मोडून त्यातील पोषक द्रव्ये मातीत परत करतात.",
        },
        detail: {
          en: "Consumers are sorted further into herbivores, carnivores, omnivores and parasites, by what exactly they take their food from.",
          hi: "उपभोक्ता आगे शाकाहारी, माँसाहारी, सर्वाहारी और परजीवी में छाँटे, ठीक किससे भोजन लेते इससे।",
          mr: "भक्षक पुढे शाकाहारी, मांसाहारी, मिश्राहारी आणि परजीवी असे विभागले, नेमके कशातून अन्न घेतात यावरून.",
        },
        extra: {
          en: "Remove the decomposers and the whole system chokes: nutrients would stay locked in corpses and dead leaves, and the producers would starve for want of soil minerals.",
          hi: "अपघटक हटाओ और पूरा तंत्र घुट जाता: पोषक तत्व शवों और मृत पत्तों में क़ैद रह जाते, और उत्पादक मिट्टी के खनिजों के अभाव में भूखे मरते।",
          mr: "विघटक काढा आणि अख्खी यंत्रणा गुदमरते: पोषक द्रव्ये प्रेतांत आणि मेलेल्या पानांत कोंडून राहतील, आणि उत्पादक मातीतील खनिजांच्या अभावी उपाशी मरतील.",
        },
        pair: {
          left: {
            en: "Maker, eater and recycler",
            hi: "बनाने वाला, खाने वाला और लौटाने वाला",
            mr: "बनवणारा, खाणारा आणि परत करणारा",
          },
          right: {
            en: "producers, consumers and decomposers",
            hi: "उत्पादक, उपभोक्ता और अपघटक",
            mr: "उत्पादक, भक्षक आणि विघटक",
          },
        },
      },
      {
        id: "food-chain",
        name: {
          en: "The food chain",
          hi: "आहार शृंखला",
          mr: "अन्नसाखळी",
        },
        kind: "idea",
        prompt: {
          en: "Grass is eaten by a grasshopper, the grasshopper by a frog, the frog by a snake, the snake by a hawk — a single line along which food and energy travel. What is such a series called?",
          hi: "घास टिड्डा खाता, टिड्डे को मेंढक, मेंढक को साँप, साँप को बाज़ — एक ही रेखा जिस पर भोजन और ऊर्जा चलते। ऐसी शृंखला क्या कहलाती?",
          mr: "गवत नाकतोडा खातो, नाकतोड्याला बेडूक, बेडकाला साप, सापाला ससाणा — एकच रेषा जिच्यावरून अन्न आणि ऊर्जा प्रवास करतात. अशी मालिका काय म्हणतात?",
        },
        statement: {
          en: "A food chain is a series of organisms in which each feeds on the one before it, so food and the energy in it pass step by step from producers upward.",
          hi: "आहार शृंखला जीवों की वह शृंखला जिसमें हर एक अपने पहले वाले पर पलता, अतः भोजन और उसमें की ऊर्जा उत्पादकों से ऊपर की ओर चरण-दर-चरण जाते।",
          mr: "अन्नसाखळी म्हणजे जीवांची ती मालिका जिच्यात प्रत्येक आपल्या आधीच्यावर जगतो, म्हणून अन्न आणि त्यातील ऊर्जा उत्पादकांपासून वर पायरीपायरीने जातात.",
        },
        detail: {
          en: "In nature such chains rarely stand alone — they cross and branch into a food web, since most animals eat more than one kind of food.",
          hi: "प्रकृति में ऐसी शृंखलाएँ कम ही अकेली खड़ीं — वे कटतीं और शाखाओं में बँटकर आहार जाल बनतीं, क्योंकि अधिकांश जीव एक से अधिक तरह का भोजन खाते।",
          mr: "निसर्गात अशा साखळ्या क्वचितच एकट्या उभ्या — त्या छेदतात आणि फांद्यांत विभागून अन्नजाळे बनवतात, कारण बहुतांश प्राणी एकाहून अधिक प्रकारचे अन्न खातात.",
        },
        extra: {
          en: "A web is far sturdier than a single chain: if one prey species vanishes, its predators can switch to another instead of starving.",
          hi: "जाल अकेली शृंखला से कहीं मज़बूत: यदि एक शिकार-जाति लुप्त हो, उसके शिकारी भूखे मरने के बजाय दूसरी पर मुड़ सकते।",
          mr: "जाळे एकट्या साखळीहून कितीतरी भक्कम: एखादी भक्ष्य-जात नाहीशी झाल्यास, तिचे शिकारी उपाशी मरण्याऐवजी दुसरीकडे वळू शकतात.",
        },
        pair: {
          left: {
            en: "Each eaten by the next in line",
            hi: "हर एक अगले द्वारा खाया",
            mr: "प्रत्येक पुढच्याकडून खाल्ला",
          },
          right: {
            en: "a food chain",
            hi: "आहार शृंखला",
            mr: "अन्नसाखळी",
          },
        },
      },
      {
        id: "ten-per-cent-law",
        name: {
          en: "The ten per cent law",
          hi: "दस प्रतिशत का नियम",
          mr: "दहा टक्क्यांचा नियम",
        },
        kind: "law",
        prompt: {
          en: "Of all the energy a deer takes from grass, only a tenth is stored in its body and available to the tiger; the rest is spent in living or lost as heat. Which rule of energy transfer between feeding levels is this?",
          hi: "हिरन घास से जितनी ऊर्जा लेता उसका केवल दसवाँ उसकी देह में संचित और बाघ को उपलब्ध; शेष जीने में खर्च या ऊष्मा बनकर नष्ट। पोषण-स्तरों के बीच ऊर्जा-स्थानांतरण का यह कौन-सा नियम?",
          mr: "हरीण गवतातून जेवढी ऊर्जा घेते तिचा फक्त दशांश त्याच्या देहात साठतो आणि वाघाला उपलब्ध; उरलेली जगण्यात खर्च वा उष्णता बनून नष्ट. पोषण-पातळ्यांदरम्यान ऊर्जा-हस्तांतराचा हा कोणता नियम?",
        },
        statement: {
          en: "The ten per cent law says that only about a tenth of the energy at one trophic level passes to the next, the remaining ninety per cent being used up in life processes or lost as heat.",
          hi: "दस प्रतिशत का नियम कहता एक पोषण-स्तर की ऊर्जा का केवल लगभग दसवाँ अगले तक जाता, शेष नब्बे प्रतिशत जैविक क्रियाओं में खर्च या ऊष्मा बनकर नष्ट।",
          mr: "दहा टक्क्यांचा नियम सांगतो एका पोषण-पातळीवरील ऊर्जेचा फक्त सुमारे दशांश पुढच्यापर्यंत जातो, उरलेली नव्वद टक्के जीवनक्रियांत खर्च वा उष्णता बनून नष्ट.",
        },
        detail: {
          en: "This is why food chains are short, usually three or four links: after a few steps there is simply too little energy left to support another level.",
          hi: "इसी से आहार शृंखलाएँ छोटी, आमतौर पर तीन या चार कड़ियाँ: कुछ चरणों बाद बस इतनी कम ऊर्जा बचती कि एक और स्तर सँभाला ही नहीं जा सकता।",
          mr: "म्हणूनच अन्नसाखळ्या आखूड, सहसा तीन वा चार दुवे: काही पायऱ्यांनंतर इतकी कमी ऊर्जा उरते की आणखी एक पातळी तोलताच येत नाही.",
        },
        extra: {
          en: "It also explains why a given field can feed far more people directly as grain than indirectly as meat from animals raised on that grain.",
          hi: "यह भी समझाता कि एक खेत सीधे अनाज के रूप में कहीं अधिक लोगों को खिला सकता, बनिस्बत उसी अनाज पर पले जानवरों के माँस के रूप में परोक्ष रूप से।",
          mr: "हेही समजावते की एक शेत थेट धान्य म्हणून कितीतरी अधिक लोकांना खाऊ घालू शकते, त्याच धान्यावर पोसलेल्या प्राण्यांच्या मांसाच्या रूपात अप्रत्यक्षपणे नव्हे.",
        },
        pair: {
          left: {
            en: "A tenth passes on, nine tenths are spent",
            hi: "दसवाँ आगे जाता, नौ-दसवाँ खर्च",
            mr: "दशांश पुढे जातो, नऊ-दशांश खर्च",
          },
          right: {
            en: "the ten per cent law",
            hi: "दस प्रतिशत का नियम",
            mr: "दहा टक्क्यांचा नियम",
          },
        },
      },
      {
        id: "biomagnification",
        name: {
          en: "Biomagnification",
          hi: "जैव आवर्धन",
          mr: "जैव विशालन",
        },
        kind: "process",
        prompt: {
          en: "A pesticide sprayed thinly on a crop is found in far greater concentration in the fish that eat the water fleas, and greatest of all in the people who eat the fish. Which build-up along a food chain is this?",
          hi: "फ़सल पर पतला छिड़का कीटनाशक जल-पिस्सू खाती मछलियों में कहीं अधिक सांद्रता में मिलता, और सबसे अधिक मछली खाते लोगों में। आहार शृंखला के साथ यह कौन-सा जमाव?",
          mr: "पिकावर पातळ फवारलेले कीटकनाशक पाणपिसू खाणाऱ्या माशांत कितीतरी अधिक संहतीत सापडते, आणि सर्वाधिक मासे खाणाऱ्या माणसांत. अन्नसाखळीबरोबर हे कोणते साठणे?",
        },
        statement: {
          en: "Biomagnification is the increase in the concentration of a harmful, non-degradable substance at each successive level of a food chain, so top consumers carry the heaviest load.",
          hi: "जैव आवर्धन आहार शृंखला के हर अगले स्तर पर हानिकारक, अ-अपघटनीय पदार्थ की सांद्रता का बढ़ना, अतः शीर्ष उपभोक्ता सबसे भारी बोझ ढोते।",
          mr: "जैव विशालन म्हणजे अन्नसाखळीच्या प्रत्येक पुढच्या पातळीवर हानिकारक, न-विघटनशील पदार्थाच्या संहतीत होणारी वाढ, म्हणून शिखरावरचे भक्षक सर्वांत जड ओझे वाहतात.",
        },
        detail: {
          en: "It happens because such substances are neither broken down nor excreted, so each predator inherits the whole accumulated store of everything it eats.",
          hi: "यह इसलिए होता कि ऐसे पदार्थ न टूटते न उत्सर्जित होते, अतः हर शिकारी जो खाता उस सबका पूरा जमा भंडार विरासत में पाता।",
          mr: "हे यामुळे घडते की असे पदार्थ ना मोडले जातात ना उत्सर्जित होतात, म्हणून प्रत्येक शिकारी जे खातो त्या सर्वांचा अख्खा साठलेला संचय वारशाने मिळवतो.",
        },
        extra: {
          en: "Washing vegetables and fruit before eating removes some surface residue, but it cannot undo what has already gathered inside the tissues of an animal.",
          hi: "खाने से पहले सब्ज़ी-फल धोना कुछ सतही अवशेष हटाता, पर जो किसी जीव के ऊतकों के भीतर जमा हो चुका उसे नहीं मिटा सकता।",
          mr: "खाण्यापूर्वी भाज्या-फळे धुणे काही पृष्ठभागावरचा अवशेष काढते, पण जे एखाद्या प्राण्याच्या ऊतींत आधीच साठले ते पुसू शकत नाही.",
        },
        pair: {
          left: {
            en: "Concentration rising at every level",
            hi: "हर स्तर पर चढ़ती सांद्रता",
            mr: "प्रत्येक पातळीवर चढणारी संहती",
          },
          right: {
            en: "biomagnification",
            hi: "जैव आवर्धन",
            mr: "जैव विशालन",
          },
        },
      },
      {
        id: "biodegradable-waste",
        name: {
          en: "Biodegradable and non-biodegradable waste",
          hi: "जैव निम्नीकरणीय और अजैव निम्नीकरणीय कचरा",
          mr: "जैवविघटनशील आणि अविघटनशील कचरा",
        },
        kind: "idea",
        prompt: {
          en: "A banana peel buried in a pit is gone within weeks; a plastic bag buried beside it is intact after decades. On which distinction does this difference rest?",
          hi: "गड्ढे में गाड़ा केले का छिलका हफ़्तों में ग़ायब; उसके बग़ल गाड़ी प्लास्टिक थैली दशकों बाद भी सही-सलामत। यह अंतर किस भेद पर टिका?",
          mr: "खड्ड्यात पुरलेली केळ्याची साल आठवड्यांत नाहीशी; तिच्या शेजारी पुरलेली प्लास्टिकची पिशवी दशकांनंतरही अभंग. हा फरक कोणत्या भेदावर टेकलेला?",
        },
        statement: {
          en: "Biodegradable waste is broken down by decomposers into simpler substances, while non-biodegradable waste resists them and persists in the environment for a very long time.",
          hi: "जैव निम्नीकरणीय कचरा अपघटकों द्वारा सरल पदार्थों में तोड़ा जाता, जबकि अजैव निम्नीकरणीय उनका प्रतिरोध करता और परिवेश में बहुत लंबे समय बना रहता।",
          mr: "जैवविघटनशील कचरा विघटकांकडून सोप्या पदार्थांत मोडला जातो, तर अविघटनशील त्यांना दाद देत नाही आणि पर्यावरणात खूप काळ टिकून राहतो.",
        },
        detail: {
          en: "The difference is chemical: decomposers have enzymes evolved to attack natural materials, but none for the synthetic bonds in most plastics.",
          hi: "अंतर रासायनिक: अपघटकों के पास प्राकृतिक पदार्थों पर आक्रमण को विकसित एंज़ाइम, पर अधिकांश प्लास्टिक के संश्लेषित बंधों के लिए कोई नहीं।",
          mr: "फरक रासायनिक: विघटकांकडे नैसर्गिक पदार्थांवर हल्ला करायला उत्क्रांत झालेली विकरे, पण बहुतांश प्लास्टिकच्या संश्लेषित बंधांसाठी एकही नाही.",
        },
        extra: {
          en: "This is why waste is separated at source — the first kind can be composted back into the soil, while the second must be recycled or it simply accumulates.",
          hi: "इसी से कचरा स्रोत पर अलग किया — पहली तरह खाद बनकर मिट्टी में लौट सकती, जबकि दूसरी का पुनर्चक्रण करना ही होगा वरना वह बस जमा होती जाती।",
          mr: "म्हणूनच कचरा स्रोतावरच वेगळा केला — पहिला प्रकार खत बनून मातीत परतू शकतो, तर दुसऱ्याचे पुनर्चक्रण करावेच लागते नाहीतर तो फक्त साठत जातो.",
        },
        pair: {
          left: {
            en: "Rots away versus lasts for decades",
            hi: "सड़ जाता बनाम दशकों टिकता",
            mr: "कुजून जातो विरुद्ध दशके टिकतो",
          },
          right: {
            en: "biodegradable and non-biodegradable waste",
            hi: "जैव निम्नीकरणीय और अजैव निम्नीकरणीय कचरा",
            mr: "जैवविघटनशील आणि अविघटनशील कचरा",
          },
        },
      },
      {
        id: "ozone-layer",
        name: {
          en: "The ozone layer",
          hi: "ओज़ोन परत",
          mr: "ओझोन थर",
        },
        kind: "idea",
        prompt: {
          en: "High above the weather, a thin sheet of a three-atom form of oxygen absorbs the sun's most damaging ultraviolet rays before they reach the ground. Which shield is this, and what has been thinning it?",
          hi: "मौसम से बहुत ऊपर, ऑक्सीजन के तीन-परमाणु रूप की पतली चादर सूर्य की सबसे हानिकारक पराबैंगनी किरणें ज़मीन तक पहुँचने से पहले सोख लेती। यह कौन-सा कवच, और उसे क्या पतला करता रहा?",
          mr: "हवामानाच्या खूप वर, ऑक्सिजनच्या तीन-अणू रूपाची पातळ चादर सूर्याची सर्वांत हानिकारक अतिनील किरणे जमिनीपर्यंत पोहोचण्याआधी शोषून घेते. हे कोणते कवच, आणि त्याला काय पातळ करत आले?",
        },
        statement: {
          en: "The ozone layer is a band of O₃ high in the atmosphere that absorbs harmful ultraviolet radiation, and it has been thinned by chlorofluorocarbons released from refrigerants and aerosol sprays.",
          hi: "ओज़ोन परत वायुमंडल में ऊँचे O₃ की पट्टी जो हानिकारक पराबैंगनी विकिरण सोखती, और प्रशीतकों तथा एरोसोल स्प्रे से निकले क्लोरोफ़्लोरोकार्बन ने इसे पतला किया।",
          mr: "ओझोन थर म्हणजे वातावरणात उंचावर O₃ चा पट्टा जो हानिकारक अतिनील प्रारण शोषतो, आणि शीतकांतून व एरोसोल फवाऱ्यांतून सुटलेल्या क्लोरोफ्लुरोकार्बन्सनी तो पातळ केला.",
        },
        detail: {
          en: "The ultraviolet it stops causes skin cancer, cataracts and damage to crops, so a thinner shield means measurable harm on the ground.",
          hi: "जो पराबैंगनी वह रोकती वह त्वचा कैंसर, मोतियाबिंद और फ़सलों को नुक़सान करती, अतः पतला कवच यानी ज़मीन पर नापने योग्य हानि।",
          mr: "जे अतिनील तो अडवतो ते त्वचेचा कर्करोग, मोतीबिंदू आणि पिकांचे नुकसान करते, म्हणून पातळ कवच म्हणजे जमिनीवर मोजण्याजोगी हानी.",
        },
        extra: {
          en: "Nations agreed in 1987 to phase out those chemicals, and the layer has slowly begun to recover — a rare case of a global environmental problem being acted on in time.",
          hi: "राष्ट्रों ने 1987 में उन रसायनों को चरणबद्ध हटाने पर सहमति दी, और परत धीरे-धीरे उबरने लगी — वैश्विक पर्यावरणीय समस्या पर समय रहते कार्रवाई का दुर्लभ प्रकरण।",
          mr: "राष्ट्रांनी 1987 मध्ये ती रसायने टप्प्याटप्प्याने हटवण्यास मान्यता दिली, आणि थर हळूहळू सावरू लागला — जागतिक पर्यावरणीय समस्येवर वेळेत कृती झाल्याचे दुर्मीळ प्रकरण.",
        },
        pair: {
          left: {
            en: "A high shield against ultraviolet",
            hi: "पराबैंगनी के विरुद्ध ऊँचा कवच",
            mr: "अतिनीलविरुद्ध उंचावरील कवच",
          },
          right: {
            en: "the ozone layer",
            hi: "ओज़ोन परत",
            mr: "ओझोन थर",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A field of grass supports many deer, the deer support a few tigers, and there the chain stops — no predator lives by hunting tigers. Food chains almost never run beyond four or five links, in any habitat on Earth. What sets this limit, and why can no ecosystem escape it?",
          hi: "घास का खेत कई हिरनों को सँभालता, हिरन कुछ बाघों को, और वहीं शृंखला रुक जाती — बाघों का शिकार कर जीने वाला कोई परभक्षी नहीं। पृथ्वी के किसी भी आवास में आहार शृंखलाएँ चार-पाँच कड़ियों से आगे लगभग कभी नहीं जातीं। यह सीमा क्या लगाती, और कोई पारितंत्र इससे बच क्यों नहीं सकता?",
          mr: "गवताचे शेत अनेक हरणांना तोलते, हरणे काही वाघांना, आणि तिथेच साखळी थांबते — वाघांची शिकार करून जगणारा कोणता भक्षक नाही. पृथ्वीवरील कोणत्याही अधिवासात अन्नसाखळ्या चार-पाच दुव्यांच्या पुढे जवळजवळ कधीच जात नाहीत. ही मर्यादा काय घालते, आणि कोणती परिसंस्था तिच्यातून का सुटू शकत नाही?",
        },
        choices: [
          {
            en: "The ten per cent law. Only about a tenth of the energy at one level reaches the next, the other ninety per cent being spent on respiration, movement and growth or lost as heat. After three or four such steps the energy remaining is a tiny fraction of what the producers captured — far too little to support a further level of predators, whatever the habitat",
            hi: "दस प्रतिशत का नियम। एक स्तर की ऊर्जा का केवल लगभग दसवाँ अगले तक पहुँचता, शेष नब्बे प्रतिशत श्वसन, गति और वृद्धि में खर्च या ऊष्मा बनकर नष्ट। ऐसे तीन-चार चरणों बाद बची ऊर्जा उत्पादकों द्वारा पकड़ी ऊर्जा का नन्हा अंश — किसी भी आवास में परभक्षियों का एक और स्तर सँभालने को कहीं बहुत कम",
            mr: "दहा टक्क्यांचा नियम. एका पातळीवरील ऊर्जेचा फक्त सुमारे दशांश पुढच्यापर्यंत पोहोचतो, उरलेली नव्वद टक्के श्वसन, हालचाल आणि वाढीत खर्च वा उष्णता बनून नष्ट. अशा तीन-चार पायऱ्यांनंतर उरलेली ऊर्जा उत्पादकांनी पकडलेल्या ऊर्जेचा लहानसा अंश — कोणत्याही अधिवासात भक्षकांची आणखी एक पातळी तोलायला कितीतरी कमी",
          },
          {
            en: "Large predators are simply too rare to be hunted, so the chain ends by chance rather than by any rule",
            hi: "बड़े परभक्षी बस इतने विरल कि उनका शिकार नहीं होता, अतः शृंखला किसी नियम से नहीं, संयोग से समाप्त होती",
            mr: "मोठे भक्षक फक्त इतके दुर्मीळ की त्यांची शिकार होत नाही, म्हणून साखळी कोणत्याही नियमाने नव्हे तर योगायोगाने संपते",
          },
          {
            en: "Energy actually increases at each level, so the chain stops only when no larger animal exists",
            hi: "ऊर्जा वास्तव में हर स्तर पर बढ़ती, अतः शृंखला तभी रुकती जब कोई बड़ा जीव न बचे",
            mr: "ऊर्जा प्रत्यक्षात प्रत्येक पातळीवर वाढते, म्हणून साखळी तेव्हाच थांबते जेव्हा मोठा प्राणी उरत नाही",
          },
          {
            en: "Decomposers eat the top predators, which is what cuts every chain short at four links",
            hi: "अपघटक शीर्ष परभक्षियों को खा जाते, यही हर शृंखला चार कड़ियों पर काट देता",
            mr: "विघटक शिखरावरच्या भक्षकांना खातात, हेच प्रत्येक साखळी चार दुव्यांवर कापते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The limit is set by energy, and specifically by how badly energy leaks at every transfer — the ten per cent law. Follow the energy from the start. Green plants capture sunlight and store a fraction of it as chemical energy in their tissues; that store is the total budget for everything above them. When a deer eats grass, it does not turn all that food into deer. Most of it is burned in respiration to keep the animal alive, spent on moving, searching and staying warm, or passed out undigested; and every one of those uses ends with the energy escaping as heat, which no organism can recapture. What is left — very roughly a tenth — is locked up in the deer's own body, and that is all a tiger can ever obtain by eating it. The same wastage repeats at every step, and because the losses multiply rather than add, the fall is brutally steep. Start with 10,000 units captured by the grass: about 1,000 reach the deer, about 100 reach the tiger, and a predator of tigers would have roughly 10 units to live on — a thousandth of what the field originally captured. Long before that, the energy left is too thin to support a viable population of large animals, which need a great deal of food each and must also find each other to breed. So the chain simply runs out of fuel. Notice that this argument does not depend on which animals or which habitat you choose. It follows from the fact that respiration is unavoidable and heat cannot be recycled back into food, so every ecosystem — ocean, desert, forest or pond — meets the same wall after three, four or at most five links. It also explains a striking pattern: top predators are always few and always need enormous territories, because each one is standing on a vast pyramid of grass beneath it. And it explains why the same field can feed far more people as grain than as meat — eating one level lower means throwing away one factor of ten less. (The wrong answers miss the mechanism: predators being rare is a consequence of the energy limit, not its cause; energy decreases rather than increases along a chain; and decomposers act on dead bodies at every level, not as a predator that terminates chains.)",
          hi: "सीमा ऊर्जा लगाती, और विशेष रूप से यह कि हर स्थानांतरण पर ऊर्जा कितनी बुरी तरह रिसती — दस प्रतिशत का नियम। ऊर्जा का आरंभ से पीछा करो। हरे पौधे धूप पकड़ते और उसका एक अंश अपने ऊतकों में रासायनिक ऊर्जा के रूप में संचित करते; वह भंडार उनके ऊपर की हर चीज़ का कुल बजट। जब हिरन घास खाता, वह उस पूरे भोजन को हिरन में नहीं बदलता। उसका अधिकांश जीव को जीवित रखने श्वसन में जलता, चलने-खोजने-गरम रहने में खर्च, या बिना पचे निकल जाता; और उन उपयोगों में से हर एक ऊर्जा के ऊष्मा बनकर भागने से समाप्त, जिसे कोई जीव फिर नहीं पकड़ सकता। जो बचता — बहुत मोटे तौर पर दसवाँ — हिरन की अपनी देह में क़ैद, और बाघ उसे खाकर बस इतना ही पा सकता। वही अपव्यय हर चरण पर दोहराता, और क्योंकि हानियाँ जुड़तीं नहीं गुणा होतीं, गिरावट निर्ममता से खड़ी। घास द्वारा पकड़ी 10,000 इकाइयों से शुरू करो: लगभग 1,000 हिरन तक, लगभग 100 बाघ तक, और बाघों का परभक्षी जीने को मोटे तौर पर 10 इकाइयाँ पाता — खेत ने मूलतः जो पकड़ा उसका हज़ारवाँ। उससे बहुत पहले ही बची ऊर्जा बड़े जीवों की टिकाऊ जनसंख्या सँभालने को बहुत पतली, जिन्हें हर एक को बहुत भोजन चाहिए और प्रजनन को एक-दूसरे को खोजना भी होता। अतः शृंखला का ईंधन बस चुक जाता। ध्यान दो यह तर्क इस पर निर्भर नहीं कि तुम कौन-से जीव या कौन-सा आवास चुनते। यह इस तथ्य से निकलता कि श्वसन अनिवार्य और ऊष्मा वापस भोजन में पुनर्चक्रित नहीं हो सकती, अतः हर पारितंत्र — महासागर, रेगिस्तान, वन या तालाब — तीन, चार या अधिक से अधिक पाँच कड़ियों बाद वही दीवार पाता। यह एक चौंकाता प्रतिरूप भी समझाता: शीर्ष परभक्षी सदा थोड़े और सदा विशाल क्षेत्र चाहते, क्योंकि हर एक अपने नीचे घास के विशाल पिरामिड पर खड़ा। और यह समझाता क्यों वही खेत माँस के बजाय अनाज के रूप में कहीं अधिक लोगों को खिला सकता — एक स्तर नीचे खाने का अर्थ दस का एक गुणक कम फेंकना। (ग़लत उत्तर क्रियाविधि चूकते: परभक्षियों का विरल होना ऊर्जा-सीमा का परिणाम, उसका कारण नहीं; ऊर्जा शृंखला के साथ बढ़ती नहीं घटती; और अपघटक हर स्तर पर मृत देहों पर काम करते, शृंखलाएँ समाप्त करते परभक्षी की तरह नहीं।)",
          mr: "मर्यादा ऊर्जा घालते, आणि विशेषतः प्रत्येक हस्तांतरणावर ऊर्जा किती वाईटरीत्या गळते हे — दहा टक्क्यांचा नियम. ऊर्जेचा सुरुवातीपासून पाठलाग करा. हिरव्या वनस्पती सूर्यप्रकाश पकडतात आणि त्याचा एक अंश आपल्या ऊतींत रासायनिक ऊर्जा म्हणून साठवतात; तो साठा त्यांच्यावरील सर्व गोष्टींचे एकूण अंदाजपत्रक. जेव्हा हरीण गवत खाते, ते ते अख्खे अन्न हरणात बदलत नाही. त्यातील बहुतांश प्राण्याला जिवंत ठेवायला श्वसनात जळते, हालचाल-शोध-ऊब यांत खर्च होते, वा न पचता बाहेर पडते; आणि त्या प्रत्येक वापराचा शेवट ऊर्जा उष्णता बनून निसटण्यात, जी कोणताही जीव पुन्हा पकडू शकत नाही. जे उरते — अगदी ढोबळमानाने दशांश — हरणाच्या स्वतःच्या देहात कोंडलेले, आणि वाघ ते खाऊन एवढेच मिळवू शकतो. तीच नासाडी प्रत्येक पायरीवर पुनरावृत्त होते, आणि हानी बेरजेने नव्हे तर गुणाकाराने होत असल्याने, घसरण निर्दयपणे तीव्र. गवताने पकडलेल्या 10,000 एककांपासून सुरू करा: सुमारे 1,000 हरणापर्यंत, सुमारे 100 वाघापर्यंत, आणि वाघांचा भक्षक जगायला ढोबळमानाने 10 एकके मिळवतो — शेताने मुळात जे पकडले त्याचा हजारावा भाग. त्याच्या खूप आधीच उरलेली ऊर्जा मोठ्या प्राण्यांची टिकाऊ लोकसंख्या तोलायला फार पातळ, ज्यांना प्रत्येकाला पुष्कळ अन्न लागते आणि प्रजननासाठी एकमेकांना शोधावेही लागते. म्हणून साखळीचे इंधन फक्त संपते. लक्षात घ्या हा युक्तिवाद तुम्ही कोणते प्राणी वा कोणता अधिवास निवडता यावर अवलंबून नाही. तो या तथ्यातून निघतो की श्वसन अपरिहार्य आणि उष्णता परत अन्नात पुनर्चक्रित होऊ शकत नाही, म्हणून प्रत्येक परिसंस्था — महासागर, वाळवंट, जंगल वा तळे — तीन, चार वा फार तर पाच दुव्यांनंतर तीच भिंत गाठते. हे एक लक्षवेधी प्रारूपही समजावते: शिखरावरचे भक्षक सदैव थोडे आणि सदैव प्रचंड प्रदेश मागणारे, कारण प्रत्येक जण आपल्याखालच्या गवताच्या विशाल मनोऱ्यावर उभा. आणि हे समजावते तेच शेत मांसाऐवजी धान्य म्हणून कितीतरी अधिक लोकांना का खाऊ घालू शकते — एक पातळी खाली खाणे म्हणजे दहाचा एक गुणक कमी फेकणे. (चुकीची उत्तरे क्रियाविधी चुकवतात: भक्षक दुर्मीळ असणे हा ऊर्जा-मर्यादेचा परिणाम, तिचे कारण नाही; ऊर्जा साखळीबरोबर वाढत नाही तर घटते; आणि विघटक प्रत्येक पातळीवर मृतदेहांवर काम करतात, साखळ्या संपवणाऱ्या भक्षकासारखे नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Along a food chain, the energy available shrinks to a tenth at every step, yet a pesticide sprayed on the crop is found at its highest concentration in the animal at the very top. Energy falls while the poison climbs. Explain why these two opposite patterns are not a contradiction, and what it means for what we choose to eat.",
          hi: "आहार शृंखला के साथ उपलब्ध ऊर्जा हर चरण पर दसवें भाग तक सिकुड़ती, फिर भी फ़सल पर छिड़का कीटनाशक सबसे ऊपर के जीव में अपनी उच्चतम सांद्रता में मिलता। ऊर्जा गिरती जबकि विष चढ़ता। समझाओ ये दो उल्टे प्रतिरूप विरोधाभास क्यों नहीं, और हम क्या खाना चुनते इसके लिए इसका क्या अर्थ।",
          mr: "अन्नसाखळीबरोबर उपलब्ध ऊर्जा प्रत्येक पायरीवर दशांशापर्यंत आकुंचते, तरीही पिकावर फवारलेले कीटकनाशक अगदी शिखरावरच्या प्राण्यात आपल्या सर्वोच्च संहतीत सापडते. ऊर्जा घसरते तर विष चढते. समजावा ही दोन उलट प्रारूपे विरोधाभास का नाहीत, आणि आपण काय खायचे निवडतो त्यासाठी याचा काय अर्थ.",
        },
        choices: [
          {
            en: "Energy is spent — burned in respiration and lost as heat — so it genuinely disappears at each level. The pesticide is neither broken down nor excreted, so it is only transferred: a predator eating many prey inherits all of their accumulated poison packed into its own smaller body. Falling energy and rising concentration are the same transfer seen for two different substances, one consumable and one not — which is why eating lower on the chain lowers the dose",
            hi: "ऊर्जा खर्च होती — श्वसन में जलती और ऊष्मा बनकर नष्ट — अतः वह हर स्तर पर सचमुच लुप्त होती। कीटनाशक न टूटता न उत्सर्जित, अतः वह केवल स्थानांतरित: अनेक शिकार खाता परभक्षी उन सबका जमा विष अपनी छोटी देह में भरा विरासत में पाता। गिरती ऊर्जा और चढ़ती सांद्रता एक ही स्थानांतरण दो भिन्न पदार्थों के लिए देखा, एक खर्च होता और एक नहीं — इसी से शृंखला में नीचे खाना मात्रा घटाता",
            mr: "ऊर्जा खर्च होते — श्वसनात जळते आणि उष्णता बनून नष्ट — म्हणून ती प्रत्येक पातळीवर खरोखर नाहीशी होते. कीटकनाशक ना मोडले जाते ना उत्सर्जित होते, म्हणून ते फक्त हस्तांतरित: अनेक भक्ष्ये खाणारा भक्षक त्या सर्वांचे साठलेले विष आपल्या लहान देहात भरून वारशाने मिळवतो. घसरती ऊर्जा आणि चढती संहती हेच एक हस्तांतरण दोन वेगळ्या पदार्थांसाठी पाहिलेले, एक खर्च होणारा आणि एक नाही — म्हणूनच साखळीत खाली खाणे मात्रा घटवते",
          },
          {
            en: "Predators manufacture extra pesticide in their own bodies, which is why the level rises as you go up",
            hi: "परभक्षी अपनी देह में अतिरिक्त कीटनाशक बनाते, इसी से ऊपर जाते स्तर चढ़ता",
            mr: "भक्षक आपल्या देहात अधिक कीटकनाशक तयार करतात, म्हणूनच वर जाताना पातळी चढते",
          },
          {
            en: "The pesticide also falls to a tenth at each step; the reports of high levels in top predators are measurement errors",
            hi: "कीटनाशक भी हर चरण पर दसवें भाग तक गिरता; शीर्ष परभक्षियों में ऊँचे स्तर की रिपोर्टें मापन-त्रुटियाँ",
            mr: "कीटकनाशकही प्रत्येक पायरीवर दशांशापर्यंत घसरते; शिखरावरच्या भक्षकांतील उच्च पातळीचे अहवाल मापन-चुका",
          },
          {
            en: "Energy and poison behave identically, so nothing about our diet can change our exposure",
            hi: "ऊर्जा और विष एक-से बरतते, अतः हमारे आहार का कुछ भी हमारा जोखिम नहीं बदल सकता",
            mr: "ऊर्जा आणि विष सारखेच वागतात, म्हणून आपल्या आहाराचे काहीही आपला संपर्क बदलू शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "There is no contradiction, because energy and a persistent pesticide are two entirely different kinds of thing moving along the same chain, and the difference is whether they can be used up. Take energy first. An organism does not merely hold its energy; it constantly spends it. Respiration burns food to power movement, growth, temperature and every cell process, and the end product of all that spending is heat, radiated away into the surroundings and gone for good — no living thing can turn heat back into food. So only the small remainder actually stored in the body is available to whatever eats it, and that is why roughly ninety per cent vanishes at every step. Energy genuinely leaves the chain. Now the pesticide. It is chosen and manufactured to be chemically stable, which is exactly what makes it persist in the field — but that same stability means an animal's body cannot break it down. It is also fat-soluble rather than water-soluble, so the kidneys cannot flush it out; it settles into fatty tissue and stays. Nothing removes it, so unlike energy it does not leave the chain at all. It can only be handed on. Now put the two facts together and the rising concentration becomes inevitable. A single fish must eat a very large number of contaminated water fleas over its lifetime, and it keeps the pesticide from every one of them while burning away almost all of their energy. So the poison from hundreds of prey ends up packed into one much smaller body — a tenth of the mass carrying nearly all of the original poison means roughly ten times the concentration. Repeat that at each level and the concentration multiplies upward with the same brutal arithmetic by which energy divides downward. The two patterns are not opposed; they are the same transfer viewed for a substance that is consumed and one that is not. The consequence for eating is direct and practical. Every step up the chain multiplies the dose you receive, so people who eat high on the chain — particularly large predatory fish — carry the heaviest burden, and human beings, eating at the top of several chains at once, are among the most exposed animals on Earth. Eating lower down — grains, vegetables, pulses — means taking food before the concentration has been multiplied. It is also why this reasoning drove real regulation: DDT was banned in many countries not because it harmed insects but because of what it was doing to birds and people at the top. Washing produce helps a little with surface residue, but nothing can wash out what has already accumulated inside an animal's tissues. (The wrong answers suppose predators manufacture the poison, or that it dilutes like energy, or that diet cannot matter — each contradicts the measured fact that concentration rises step by step precisely because the substance is neither destroyed nor excreted.)",
          hi: "कोई विरोधाभास नहीं, क्योंकि ऊर्जा और टिकाऊ कीटनाशक एक ही शृंखला पर चलती दो बिलकुल भिन्न तरह की चीज़ें, और अंतर यह कि वे खर्च हो सकतीं या नहीं। पहले ऊर्जा। जीव अपनी ऊर्जा बस पकड़े नहीं रहता; वह उसे लगातार खर्च करता। श्वसन भोजन जलाकर गति, वृद्धि, ताप और हर कोशिकीय क्रिया चलाता, और उस सारे खर्च का अंतिम उत्पाद ऊष्मा, परिवेश में विकिरित होकर सदा के लिए गई — कोई सजीव ऊष्मा को वापस भोजन नहीं बना सकता। अतः केवल देह में सचमुच संचित छोटा शेष उसे खाने वाले को उपलब्ध, और इसी से हर चरण पर लगभग नब्बे प्रतिशत ग़ायब। ऊर्जा सचमुच शृंखला छोड़ जाती। अब कीटनाशक। यह रासायनिक रूप से स्थिर होने को चुना और बनाया, ठीक यही उसे खेत में टिकाता — पर वही स्थिरता का अर्थ जीव की देह उसे तोड़ नहीं सकती। यह जल-घुलनशील नहीं बल्कि वसा-घुलनशील भी, अतः वृक्क उसे बहा नहीं सकते; यह वसा-ऊतक में बैठ जाता और रहता। कुछ इसे हटाता नहीं, अतः ऊर्जा के विपरीत यह शृंखला छोड़ता ही नहीं। इसे केवल आगे सौंपा जा सकता। अब दोनों तथ्य साथ रखो और चढ़ती सांद्रता अवश्यंभावी हो जाती। एक अकेली मछली को अपने जीवन में बहुत बड़ी संख्या में दूषित जल-पिस्सू खाने पड़ते, और वह उन सबका कीटनाशक रखती जबकि उनकी लगभग सारी ऊर्जा जला देती। अतः सैकड़ों शिकारों का विष एक कहीं छोटी देह में भरा जा पहुँचता — द्रव्यमान का दसवाँ लगभग पूरा मूल विष ढोए तो मोटे तौर पर दस गुनी सांद्रता। हर स्तर पर यह दोहराओ और सांद्रता उसी निर्मम अंकगणित से ऊपर की ओर गुणा होती जिससे ऊर्जा नीचे की ओर भाग होती। दोनों प्रतिरूप विरोधी नहीं; वे एक ही स्थानांतरण, एक खर्च होते और एक न होते पदार्थ के लिए देखा। खाने के लिए परिणाम सीधा और व्यावहारिक। शृंखला में हर चरण ऊपर तुम्हें मिलती मात्रा गुणा करता, अतः शृंखला में ऊँचा खाते लोग — विशेषकर बड़ी परभक्षी मछलियाँ — सबसे भारी बोझ ढोते, और मनुष्य, एक साथ कई शृंखलाओं के शीर्ष पर खाते, पृथ्वी के सबसे अधिक उजागर जीवों में। नीचे खाना — अनाज, सब्ज़ियाँ, दालें — यानी सांद्रता गुणा होने से पहले भोजन लेना। इसी से यह तर्क असली नियमन तक ले गया: DDT कई देशों में इसलिए प्रतिबंधित नहीं कि वह कीड़ों को हानि पहुँचाता बल्कि इसलिए कि वह शीर्ष पर पक्षियों और लोगों के साथ क्या कर रहा था। उपज धोना सतही अवशेष में थोड़ी मदद करता, पर जो किसी जीव के ऊतकों के भीतर पहले ही जमा हो चुका उसे कुछ नहीं धो सकता। (ग़लत उत्तर मानते परभक्षी विष बनाते, या वह ऊर्जा-सा तनु होता, या आहार से फ़र्क़ नहीं पड़ सकता — हर एक उस मापे तथ्य का खंडन कि सांद्रता चरण-दर-चरण ठीक इसलिए चढ़ती कि पदार्थ न नष्ट होता न उत्सर्जित।)",
          mr: "कोणताही विरोधाभास नाही, कारण ऊर्जा आणि टिकाऊ कीटकनाशक एकाच साखळीवरून जाणाऱ्या दोन अगदी वेगळ्या प्रकारच्या गोष्टी, आणि फरक हा की त्या खर्च होऊ शकतात की नाही. आधी ऊर्जा. जीव आपली ऊर्जा फक्त धरून ठेवत नाही; तो ती सतत खर्च करतो. श्वसन अन्न जाळून हालचाल, वाढ, तापमान आणि प्रत्येक पेशी-क्रिया चालवते, आणि त्या सर्व खर्चाचे अंतिम उत्पाद उष्णता, परिसरात प्रारित होऊन कायमची गेलेली — कोणताही सजीव उष्णतेचे परत अन्न करू शकत नाही. म्हणून फक्त देहात खरोखर साठलेला लहान उरलेला भाग त्याला खाणाऱ्याला उपलब्ध, आणि म्हणूनच प्रत्येक पायरीवर सुमारे नव्वद टक्के नाहीसे. ऊर्जा खरोखर साखळी सोडून जाते. आता कीटकनाशक. ते रासायनिकदृष्ट्या स्थिर असावे म्हणून निवडलेले आणि बनवलेले, नेमके तेच त्याला शेतात टिकवते — पण तीच स्थिरता म्हणजे प्राण्याचा देह ते मोडू शकत नाही. ते जलविद्राव्य नव्हे तर स्निग्धविद्राव्यही, म्हणून मूत्रपिंडे ते वाहून नेऊ शकत नाहीत; ते स्निग्ध ऊतीत बसते आणि राहते. काहीही ते काढत नाही, म्हणून ऊर्जेच्या उलट ते साखळी सोडतच नाही. ते फक्त पुढे सोपवले जाऊ शकते. आता दोन्ही तथ्ये एकत्र ठेवा आणि चढती संहती अटळ होते. एका माशाला आयुष्यभरात खूप मोठ्या संख्येने दूषित पाणपिसू खावे लागतात, आणि तो त्या प्रत्येकाचे कीटकनाशक ठेवतो तर त्यांची जवळजवळ सर्व ऊर्जा जाळून टाकतो. म्हणून शेकडो भक्ष्यांचे विष एका कितीतरी लहान देहात भरून जाते — वस्तुमानाचा दशांश जवळजवळ अख्खे मूळ विष वाहत असेल तर ढोबळमानाने दसपट संहती. प्रत्येक पातळीवर हे पुनरावृत्त करा आणि संहती त्याच निर्दय अंकगणिताने वर गुणाकाराने वाढते ज्याने ऊर्जा खाली भागाकाराने घटते. दोन्ही प्रारूपे विरोधी नाहीत; ती एकच हस्तांतरण, एक खर्च होणाऱ्या आणि एक न होणाऱ्या पदार्थासाठी पाहिलेले. खाण्यासाठी परिणाम थेट आणि व्यावहारिक. साखळीत प्रत्येक पायरी वर तुम्हाला मिळणारी मात्रा गुणाकाराने वाढवते, म्हणून साखळीत उंच खाणारे लोक — विशेषतः मोठे भक्षक मासे — सर्वांत जड ओझे वाहतात, आणि माणसे, एकाच वेळी अनेक साखळ्यांच्या शिखरावर खाणारी, पृथ्वीवरील सर्वाधिक संपर्कात असलेल्या प्राण्यांपैकी. खाली खाणे — धान्य, भाज्या, कडधान्ये — म्हणजे संहती गुणाकाराने वाढण्याआधी अन्न घेणे. म्हणूनच हा युक्तिवाद खऱ्या नियमनापर्यंत नेला: DDT अनेक देशांत यासाठी बंदी घातले नाही की ते कीटकांना हानी करत होते तर यासाठी की ते शिखरावरच्या पक्ष्यांचे आणि माणसांचे काय करत होते. उत्पादन धुणे पृष्ठभागावरच्या अवशेषात थोडी मदत करते, पण जे एखाद्या प्राण्याच्या ऊतींत आधीच साठले ते काहीही धुऊ शकत नाही. (चुकीची उत्तरे मानतात भक्षक विष तयार करतात, वा ते ऊर्जेसारखे विरळ होते, वा आहाराने फरक पडू शकत नाही — प्रत्येक त्या मोजलेल्या तथ्याचे खंडन की संहती पायरीपायरीने नेमके यासाठी चढते की पदार्थ ना नष्ट होतो ना उत्सर्जित.)",
        },
      },
    ],
  },
];
