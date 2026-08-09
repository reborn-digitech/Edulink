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
];
