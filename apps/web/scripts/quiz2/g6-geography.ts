/**
 * Class 6 Geography — NCERT "The Earth: Our Habitat", chapter by chapter,
 * through the conceptual engine. The voice looks up and out: stars, grids,
 * seasons and the shape of the land, always tied back to what a child can
 * see from a rooftop or find on a globe with one finger.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT The Earth: Our Habitat (Class 6)";
const LICENCE = "CC-BY-SA-4.0";

export const G6_GEOGRAPHY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — The Earth in the Solar System                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-6-earth-in-the-solar-system",
    subject: "GEOGRAPHY",
    classLevel: 6,
    chapter: {
      en: "Chapter 1 — The Earth in the Solar System",
      hi: "अध्याय 1 — सौरमंडल में पृथ्वी",
      mr: "प्रकरण 1 — सूर्यमालेतील पृथ्वी",
    },
    name: {
      en: "The Earth in the Solar System",
      hi: "सौरमंडल में पृथ्वी",
      mr: "सूर्यमालेतील पृथ्वी",
    },
    summary: {
      en: "The Sun's family and Earth's place in it — the blue planet with life, the airless Moon, the still Pole Star, and the seven-star ladle that finds it.",
      hi: "सूर्य का परिवार और उसमें पृथ्वी की जगह — जीवन वाला नीला ग्रह, बे-हवा चाँद, अटल ध्रुवतारा, और उसे खोजता सात तारों का करछुल।",
      mr: "सूर्याचे कुटुंब आणि त्यात पृथ्वीची जागा — जीवन असलेला निळा ग्रह, हवाविहीन चंद्र, अढळ ध्रुवतारा, आणि त्याला शोधणारे सात ताऱ्यांचे पळू.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "sun",
        name: { en: "The Sun", hi: "सूर्य", mr: "सूर्य" },
        kind: "sky-body",
        prompt: {
          en: "Our nearest star, the burning heart of the whole system — every planet circles it and every noon belongs to it. Which body is this?",
          hi: "हमारा निकटतम तारा, पूरे मंडल का धधकता हृदय — हर ग्रह उसकी परिक्रमा करता है और हर दोपहर उसी की है। यह कौन-सा पिंड है?",
          mr: "आपला सर्वांत जवळचा तारा, साऱ्या मालेचे धगधगते हृदय — प्रत्येक ग्रह त्याची प्रदक्षिणा घालतो आणि प्रत्येक दुपार त्याचीच. हा कोणता गोल?",
        },
        statement: {
          en: "The Sun is a star — our nearest one — making its own heat and light, and holding the whole solar family in its pull.",
          hi: "सूर्य एक तारा है — हमारा निकटतम — अपनी गर्मी और रोशनी ख़ुद बनाता, और पूरे सौर-परिवार को अपने खिंचाव में थामे हुए।",
          mr: "सूर्य हा तारा आहे — आपला सर्वांत जवळचा — स्वतःची उष्णता आणि प्रकाश बनवणारा, आणि साऱ्या सौर-कुटुंबाला आपल्या ओढीत धरणारा.",
        },
        pair: {
          left: { en: "The Sun, our star", hi: "हमारा तारा सूर्य", mr: "आपला तारा सूर्य" },
          right: {
            en: "the family's own star",
            hi: "परिवार का अपना तारा",
            mr: "कुटुंबाचा स्वतःचा तारा",
          },
        },
      },
      {
        id: "earth",
        name: { en: "The Earth", hi: "पृथ्वी", mr: "पृथ्वी" },
        kind: "sky-body",
        prompt: {
          en: "Seen from space it glows blue with water and swirls with cloud — the ONE body known to carry life. Which planet is this?",
          hi: "अंतरिक्ष से वह पानी से नीली दमकती और बादलों से घिरी दिखती है — जीवन ढोने वाला इकलौता ज्ञात पिंड। यह कौन-सा ग्रह है?",
          mr: "अवकाशातून ती पाण्याने निळी झळकते आणि ढगांनी वेढलेली दिसते — जीवन वाहणारा एकमेव ज्ञात गोल. हा कोणता ग्रह?",
        },
        statement: {
          en: "The Earth is the blue planet — liquid water, breathable air and bearable warmth meet here, and nowhere else that we know carries life.",
          hi: "पृथ्वी नीला ग्रह है — बहता पानी, साँस लेने लायक़ हवा और सहने लायक़ गर्मी यहीं मिलते हैं, और हमारी जानकारी में जीवन और कहीं नहीं।",
          mr: "पृथ्वी हा निळा ग्रह — वाहते पाणी, श्वसण्याजोगी हवा आणि सोसण्याजोगी ऊब इथेच जुळतात, आणि आपल्या माहितीत जीवन दुसरीकडे कुठेही नाही.",
        },
        detail: {
          en: "It is neither too near the Sun to boil nor too far to freeze — the liveable middle distance.",
          hi: "वह न सूर्य के इतने पास है कि उबल जाए, न इतनी दूर कि जम जाए — जीने लायक़ बीच की दूरी।",
          mr: "ती सूर्याच्या इतकी जवळ नाही की उकळावी, इतकी दूरही नाही की गोठावी — जगण्याजोगे मधले अंतर.",
        },
        extra: {
          en: "Two-thirds of its face is ocean — hence the name 'blue planet'.",
          hi: "उसके चेहरे का दो-तिहाई महासागर है — इसीलिए नाम 'नीला ग्रह'।",
          mr: "तिच्या चेहऱ्याचा दोन-तृतीयांश महासागर — म्हणूनच नाव 'निळा ग्रह'.",
        },
        pair: {
          left: { en: "The Earth", hi: "पृथ्वी", mr: "पृथ्वी" },
          right: {
            en: "the liveable middle distance",
            hi: "जीने लायक़ बीच की दूरी",
            mr: "जगण्याजोगे मधले अंतर",
          },
        },
      },
      {
        id: "moon",
        name: { en: "The Moon", hi: "चंद्रमा", mr: "चंद्र" },
        kind: "sky-body",
        prompt: {
          en: "Earth's own companion, circling us month by month — cratered, silent, without a breath of air or a drop of water. Which body is this?",
          hi: "पृथ्वी का अपना साथी, महीने-दर-महीने हमारी परिक्रमा करता — गड्ढों भरा, चुप, बिना साँस भर हवा या बूँद भर पानी के। यह कौन-सा पिंड है?",
          mr: "पृथ्वीचा स्वतःचा सोबती, महिन्यामागून महिना आपली प्रदक्षिणा घालणारा — विवरांनी भरलेला, शांत, श्वासभर हवा वा थेंबभर पाण्याविना. हा कोणता गोल?",
        },
        statement: {
          en: "The Moon is Earth's natural satellite — it circles us, shines by borrowed sunlight, and holds no air or water, so nothing lives there.",
          hi: "चंद्रमा पृथ्वी का प्राकृतिक उपग्रह है — हमारी परिक्रमा करता, उधार की धूप से चमकता, और उसके पास न हवा है न पानी, तो वहाँ कुछ नहीं जीता।",
          mr: "चंद्र हा पृथ्वीचा नैसर्गिक उपग्रह — आपली प्रदक्षिणा घालतो, उसन्या उन्हाने चमकतो, आणि त्याच्याकडे हवा नाही, पाणी नाही, म्हणून तिथे काही जगत नाही.",
        },
        pair: {
          left: { en: "The Moon", hi: "चंद्रमा", mr: "चंद्र" },
          right: {
            en: "our circling companion",
            hi: "परिक्रमा करता हमारा साथी",
            mr: "प्रदक्षिणा घालणारा आपला सोबती",
          },
        },
      },
      {
        id: "planets",
        name: { en: "The planets", hi: "ग्रह", mr: "ग्रह" },
        kind: "sky-body",
        prompt: {
          en: "Eight wanderers circle the Sun on their own roads, shining only by the light they borrow. What are they called?",
          hi: "आठ घुमक्कड़ अपनी-अपनी राहों पर सूर्य की परिक्रमा करते हैं, केवल उधार की रोशनी से चमकते। वे क्या कहलाते हैं?",
          mr: "आठ भटके आपापल्या वाटांनी सूर्याची प्रदक्षिणा घालतात, फक्त उसन्या प्रकाशाने चमकत. त्यांना काय म्हणतात?",
        },
        statement: {
          en: "The planets are the Sun's eight circling companions — they make no light of their own, only returning the Sun's, each from its own path.",
          hi: "ग्रह सूर्य के आठ परिक्रमा करते साथी हैं — अपनी रोशनी नहीं बनाते, बस सूर्य की लौटाते हैं, हर एक अपनी राह से।",
          mr: "ग्रह हे सूर्याचे आठ प्रदक्षिणा घालणारे सोबती — स्वतःचा प्रकाश बनवत नाहीत, फक्त सूर्याचा परत करतात, प्रत्येक आपल्या वाटेने.",
        },
        detail: {
          en: "Earth is third from the Sun — after Mercury and Venus, before Mars.",
          hi: "पृथ्वी सूर्य से तीसरी है — बुध और शुक्र के बाद, मंगल से पहले।",
          mr: "पृथ्वी सूर्यापासून तिसरी — बुध आणि शुक्रानंतर, मंगळाआधी.",
        },
        extra: {
          en: "In the night sky they shine steadily, while the far stars twinkle.",
          hi: "रात के आसमान में वे स्थिर चमकते हैं, जबकि दूर के तारे टिमटिमाते हैं।",
          mr: "रात्रीच्या आकाशात ते स्थिर चमकतात, तर दूरचे तारे लुकलुकतात.",
        },
        pair: {
          left: { en: "The planets", hi: "ग्रह", mr: "ग्रह" },
          right: {
            en: "shining by borrowed light",
            hi: "उधार की रोशनी से चमकते",
            mr: "उसन्या प्रकाशाने चमकणारे",
          },
        },
      },
      {
        id: "polestar",
        name: { en: "The Pole Star", hi: "ध्रुवतारा", mr: "ध्रुवतारा" },
        kind: "night-guide",
        prompt: {
          en: "All night the sky wheels overhead — yet ONE northern star keeps its place, hour after hour. Which star is this?",
          hi: "रात भर आसमान सिर पर घूमता रहता है — फिर भी उत्तर का एक तारा घंटे-दर-घंटे अपनी जगह थामे रहता है। यह कौन-सा तारा है?",
          mr: "रात्रभर आकाश डोक्यावर फिरत राहते — तरी उत्तरेचा एक तारा तासामागून तास आपली जागा धरून राहतो. हा कोणता तारा?",
        },
        statement: {
          en: "The Pole Star stands almost still in the northern sky while every other star wheels round — travellers have read north from it for ages.",
          hi: "ध्रुवतारा उत्तरी आसमान में लगभग अटल खड़ा रहता है जबकि बाक़ी हर तारा घूमता है — मुसाफ़िर युगों से उससे उत्तर पढ़ते आए हैं।",
          mr: "ध्रुवतारा उत्तर आकाशात जवळजवळ अढळ उभा राहतो तर बाकी प्रत्येक तारा फिरतो — प्रवासी युगानुयुगे त्याच्यावरून उत्तर वाचत आले आहेत.",
        },
        detail: {
          en: "It happens to stand above the Earth's axis — the one point the spinning cannot move.",
          hi: "वह संयोग से पृथ्वी की धुरी के ऊपर खड़ा है — वही एक बिंदु जिसे घूर्णन हिला नहीं सकता।",
          mr: "तो नेमका पृथ्वीच्या आसाच्या वर उभा आहे — फिरण्याला हलवता न येणारा एकमेव बिंदू.",
        },
        extra: {
          en: "The compass agrees with it — needle by night, star by night, one north.",
          hi: "कुतुबनुमा उससे सहमत है — सुई भी, तारा भी, उत्तर एक।",
          mr: "होकायंत्र त्याच्याशी सहमत — सुईही, ताराही, उत्तर एकच.",
        },
        pair: {
          left: { en: "The Pole Star", hi: "ध्रुवतारा", mr: "ध्रुवतारा" },
          right: {
            en: "the sky's one still point",
            hi: "आसमान का एक अटल बिंदु",
            mr: "आकाशाचा एक अढळ बिंदू",
          },
        },
      },
      {
        id: "saptarishi",
        name: {
          en: "The Saptarishi (Great Bear)",
          hi: "सप्तर्षि",
          mr: "सप्तर्षी",
        },
        kind: "night-guide",
        prompt: {
          en: "Seven bright stars hang together like a ladle in the summer sky — and its pointer stars aim at the Pole Star. Which star-group is this?",
          hi: "गर्मियों के आसमान में सात चमकीले तारे करछुल-से साथ टँगे हैं — और उसके संकेतक तारे ध्रुवतारे की ओर ताकते हैं। यह कौन-सा तारा-समूह है?",
          mr: "उन्हाळी आकाशात सात तेजस्वी तारे पळूसारखे एकत्र टांगलेले — आणि त्याचे दर्शक तारे ध्रुवताऱ्याकडे रोखलेले. हा कोणता तारकासमूह?",
        },
        statement: {
          en: "The Saptarishi is a group of seven stars shaped like a ladle — a line through its front two stars runs straight to the Pole Star.",
          hi: "सप्तर्षि सात तारों का करछुल-सा समूह है — उसके अगले दो तारों से खिंची रेखा सीधी ध्रुवतारे तक जाती है।",
          mr: "सप्तर्षी हा पळूच्या आकाराचा सात ताऱ्यांचा समूह — त्याच्या पुढच्या दोन ताऱ्यांतून काढलेली रेषा थेट ध्रुवताऱ्यापर्यंत जाते.",
        },
        pair: {
          left: { en: "The Saptarishi", hi: "सप्तर्षि", mr: "सप्तर्षी" },
          right: {
            en: "the ladle that points north",
            hi: "उत्तर दिखाता करछुल",
            mr: "उत्तर दाखवणारे पळू",
          },
        },
      },
      {
        id: "meteors",
        name: { en: "Meteors", hi: "उल्काएँ", mr: "उल्का" },
        kind: "sky-body",
        prompt: {
          en: "A streak of light cuts the night — a 'falling star' that is really a small stone burning up as it hits our air. What is it called?",
          hi: "रात को रोशनी की लकीर कटती है — एक 'टूटता तारा' जो असल में हमारी हवा से टकराकर जलता छोटा पत्थर है। उसे क्या कहते हैं?",
          mr: "रात्री प्रकाशाची रेघ उमटते — एक 'तुटणारा तारा' जो खरे तर आपल्या हवेवर आदळून जळणारा लहान दगड आहे. त्याला काय म्हणतात?",
        },
        statement: {
          en: "A meteor is a small space-stone flaring up as it burns in our air — the 'shooting star' is no star at all.",
          hi: "उल्का अंतरिक्ष का छोटा पत्थर है जो हमारी हवा में जलकर भड़क उठता है — 'टूटता तारा' तारा है ही नहीं।",
          mr: "उल्का म्हणजे आपल्या हवेत जळून भडकणारा अवकाशातला लहान दगड — 'तुटणारा तारा' मुळी तारा नाहीच.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the body to its badge: A-makes its own light, B-shines by borrowed light and circles the Sun, C-circles a planet. Which trio is right?",
          hi: "पिंड को उसकी पहचान से मिलाइए: अ-अपनी रोशनी बनाता है, ब-उधार की रोशनी से चमकता और सूर्य की परिक्रमा करता है, स-किसी ग्रह की परिक्रमा करता है। कौन-सी तिकड़ी सही है?",
          mr: "गोल त्याच्या ओळखीशी जुळवा: अ-स्वतःचा प्रकाश बनवतो, ब-उसन्या प्रकाशाने चमकतो आणि सूर्याची प्रदक्षिणा घालतो, क-ग्रहाची प्रदक्षिणा घालतो. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the Sun (a star) · B: the Earth (a planet) · C: the Moon (a satellite)",
            hi: "अ: सूर्य (तारा) · ब: पृथ्वी (ग्रह) · स: चंद्रमा (उपग्रह)",
            mr: "अ: सूर्य (तारा) · ब: पृथ्वी (ग्रह) · क: चंद्र (उपग्रह)",
          },
          {
            en: "A: the Moon · B: the Sun · C: the Earth",
            hi: "अ: चंद्रमा · ब: सूर्य · स: पृथ्वी",
            mr: "अ: चंद्र · ब: सूर्य · क: पृथ्वी",
          },
          {
            en: "A: the Earth · B: the Moon · C: the Sun",
            hi: "अ: पृथ्वी · ब: चंद्रमा · स: सूर्य",
            mr: "अ: पृथ्वी · ब: चंद्र · क: सूर्य",
          },
          {
            en: "A: the Sun · B: the Moon · C: the Earth",
            hi: "अ: सूर्य · ब: चंद्रमा · स: पृथ्वी",
            mr: "अ: सूर्य · ब: चंद्र · क: पृथ्वी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Star, planet, satellite — three ranks in one family, told apart by light and by whom they circle: the Sun burns its own, the Earth circles the Sun on borrowed shine, the Moon circles the EARTH. The ranks nest like rings; knowing a body's circle names its rank.",
          hi: "तारा, ग्रह, उपग्रह — एक परिवार की तीन पदवियाँ, रोशनी से और परिक्रमा से पहचानी हुईं: सूर्य अपनी जलाता है, पृथ्वी उधार की चमक से सूर्य के गिर्द चलती है, चंद्रमा पृथ्वी के गिर्द। पदवियाँ छल्लों-सी एक-दूसरे में बसती हैं; पिंड का घेरा जानना उसकी पदवी बता देता है।",
          mr: "तारा, ग्रह, उपग्रह — एका कुटुंबातल्या तीन पदव्या, प्रकाशाने आणि कोणाभोवती फिरतो त्याने ओळखलेल्या: सूर्य स्वतःचा जाळतो, पृथ्वी उसन्या चमकीने सूर्याभोवती चालते, चंद्र पृथ्वीभोवती. पदव्या कड्यांसारख्या एकात एक बसतात; गोलाचा वेढा कळला की पदवी कळते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Moon has sunshine, rock and the same distance from the Sun as we do — yet not one blade of grass. By Earth's own recipe for life, what is the Moon missing?",
          hi: "चाँद के पास धूप है, चट्टान है और सूर्य से हमारे जितनी ही दूरी — फिर भी घास की एक पत्ती नहीं। पृथ्वी के जीवन-नुस्ख़े से, चाँद में क्या नहीं है?",
          mr: "चंद्राकडे ऊन आहे, खडक आहे आणि सूर्यापासून आपल्याइतकेच अंतर — तरी गवताचे एक पातेही नाही. पृथ्वीच्या जीवन-कृतीने, चंद्रात काय कमी आहे?",
        },
        choices: [
          {
            en: "Air and water — sunshine alone grows nothing; life's recipe needs all three together, and the Moon holds only the one",
            hi: "हवा और पानी — अकेली धूप कुछ नहीं उगाती; जीवन के नुस्ख़े को तीनों साथ चाहिए, और चाँद के पास एक ही है",
            mr: "हवा आणि पाणी — एकटे ऊन काही उगवत नाही; जीवनाच्या कृतीला तिन्ही एकत्र हवीत, आणि चंद्राकडे एकच आहे",
          },
          {
            en: "Good soil — its rock is simply too hard for roots",
            hi: "अच्छी मिट्टी — उसकी चट्टान जड़ों के लिए बस बहुत कड़ी है",
            mr: "चांगली माती — त्याचा खडक मुळांसाठी नुसता फार कठीण",
          },
          {
            en: "Warmth — the Moon is too far from the Sun",
            hi: "गर्मी — चाँद सूर्य से बहुत दूर है",
            mr: "ऊब — चंद्र सूर्यापासून फार दूर आहे",
          },
          {
            en: "Nothing — life there simply has not started yet",
            hi: "कुछ नहीं — वहाँ जीवन बस अभी शुरू नहीं हुआ",
            mr: "काहीच नाही — तिथे जीवन नुसते अजून सुरू झाले नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Distance is the one thing the Moon shares with us — so warmth is not the missing item. What it lacks is the pair that makes warmth useful: air to breathe and shield, water to drink and dissolve. Life is a three-ingredient recipe, and a kitchen stocked with only sunshine bakes nothing. That is why astronauts carried Earth on their backs — air and water in a suit.",
          hi: "दूरी ही वह एक चीज़ है जो चाँद हमसे साझा करता है — तो गर्मी छूटी हुई चीज़ नहीं। छूटी है वह जोड़ी जो गर्मी को काम का बनाती है: साँस लेने और ओट देने वाली हवा, पीने और घोलने वाला पानी। जीवन तीन सामग्रियों का नुस्ख़ा है, और सिर्फ़ धूप से भरी रसोई कुछ नहीं पकाती। इसीलिए अंतरिक्ष-यात्री पीठ पर पृथ्वी ढोकर गए — सूट में हवा और पानी।",
          mr: "अंतर हीच एक गोष्ट चंद्र आपल्याशी वाटून घेतो — म्हणून ऊब ही गळलेली गोष्ट नव्हे. गळली आहे ती ऊब उपयोगी करणारी जोडी: श्वसायला आणि आडोसा द्यायला हवा, प्यायला आणि विरघळवायला पाणी. जीवन ही तीन घटकांची कृती, आणि फक्त उन्हाने भरलेले स्वयंपाकघर काही भाजत नाही. म्हणूनच अंतराळवीर पाठीवर पृथ्वी वाहून गेले — पोशाखात हवा आणि पाणी.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Every star wheels across the night — except the Pole Star, which the spinning sky cannot move. What is its secret?",
          hi: "हर तारा रात भर घूमता है — सिवा ध्रुवतारे के, जिसे घूमता आसमान हिला नहीं पाता। उसका राज़ क्या है?",
          mr: "प्रत्येक तारा रात्रभर फिरतो — ध्रुवतारा सोडून, ज्याला फिरणारे आकाश हलवू शकत नाही. त्याचे गुपित काय?",
        },
        choices: [
          {
            en: "It stands almost exactly above the Earth's axis — the turning happens AROUND that point, so the point alone seems still",
            hi: "वह लगभग ठीक पृथ्वी की धुरी के ऊपर खड़ा है — घूर्णन उसी बिंदु के गिर्द होता है, तो अकेला वही बिंदु अटल दिखता है",
            mr: "तो जवळजवळ नेमका पृथ्वीच्या आसाच्या वर उभा आहे — फिरणे त्याच बिंदूभोवती घडते, म्हणून तो एकटा बिंदू अढळ दिसतो",
          },
          {
            en: "It is the nearest star, too close to seem to move",
            hi: "वह निकटतम तारा है, इतना पास कि चलता न दिखे",
            mr: "तो सर्वांत जवळचा तारा, हलताना न दिसण्याइतका जवळ",
          },
          {
            en: "It is nailed to the sky while others float",
            hi: "वह आसमान में जड़ा है जबकि बाक़ी तैरते हैं",
            mr: "तो आकाशात ठोकलेला आहे तर बाकी तरंगतात",
          },
          {
            en: "It circles so fast it looks like one point",
            hi: "वह इतना तेज़ घूमता है कि एक बिंदु दिखता है",
            mr: "तो इतका वेगात फिरतो की एक बिंदू दिसतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The wheeling is OURS: the Earth spins, so the whole sky seems to turn about the axis's two ends. Stand a stick in a spinning umbrella — everything circles except the point over the stick. The Pole Star merely happens to hang above the northern end, so the spin cannot slide it; that lucky accident gave every traveller before the compass a fixed north.",
          hi: "घूमना हमारा है: पृथ्वी घूमती है, तो पूरा आसमान धुरी के दो सिरों के गिर्द घूमता दिखता है। घूमती छतरी में डंडी गाड़िए — डंडी के ऊपर के बिंदु के सिवा सब घूमता है। ध्रुवतारा बस संयोग से उत्तरी सिरे के ऊपर टँगा है, तो घूर्णन उसे सरका नहीं सकता; उसी ख़ुशनसीब इत्तिफ़ाक़ ने कुतुबनुमा से पहले के हर मुसाफ़िर को अटल उत्तर दिया।",
          mr: "फिरणे आपले आहे: पृथ्वी फिरते, म्हणून सारे आकाश आसाच्या दोन टोकांभोवती फिरताना दिसते. फिरत्या छत्रीत काठी रोवा — काठीवरच्या बिंदूखेरीज सारे फिरते. ध्रुवतारा नुसता योगायोगाने उत्तर टोकाच्या वर टांगला आहे, म्हणून फिरणे त्याला सरकवू शकत नाही; त्याच भाग्यवान योगायोगाने होकायंत्राआधीच्या प्रत्येक प्रवाशाला अढळ उत्तर दिले.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Globe: Latitudes and Longitudes                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-6-globe-latitudes-longitudes",
    subject: "GEOGRAPHY",
    classLevel: 6,
    chapter: {
      en: "Chapter 2 — Globe: Latitudes and Longitudes",
      hi: "अध्याय 2 — ग्लोब: अक्षांश एवं देशांतर",
      mr: "प्रकरण 2 — पृथ्वीगोल: अक्षांश आणि रेखांश",
    },
    name: {
      en: "Globe: Latitudes and Longitudes",
      hi: "ग्लोब: अक्षांश एवं देशांतर",
      mr: "पृथ्वीगोल: अक्षांश आणि रेखांश",
    },
    summary: {
      en: "The globe's ruled lines — the equator and the tropics, heat zones sorted by sunshine, Greenwich's zero line, and the two numbers that pin any ship on any sea.",
      hi: "ग्लोब की खिंची रेखाएँ — विषुवत और कटिबंध, धूप से बँटे ताप-कटिबंध, ग्रीनविच की शून्य रेखा, और वे दो अंक जो किसी भी समुद्र पर किसी भी जहाज़ को जकड़ लेते हैं।",
      mr: "पृथ्वीगोलावरच्या आखलेल्या रेषा — विषुववृत्त आणि कटिबंध, उन्हाने वाटलेले उष्णता-पट्टे, ग्रिनिचची शून्य रेषा, आणि कोणत्याही समुद्रावर कोणतेही जहाज पकडणारे दोन आकडे.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "equator",
        name: { en: "The equator", hi: "विषुवत रेखा", mr: "विषुववृत्त" },
        kind: "line",
        prompt: {
          en: "The globe's widest circle, numbered 0°, halving the Earth into north and south — which line is this?",
          hi: "ग्लोब का सबसे चौड़ा घेरा, अंक 0°, पृथ्वी को उत्तर-दक्षिण में आधा बाँटता — यह कौन-सी रेखा है?",
          mr: "पृथ्वीगोलाचा सर्वांत रुंद वेढा, आकडा 0°, पृथ्वीला उत्तर-दक्षिणेत अर्धे वाटणारा — ही कोणती रेषा?",
        },
        statement: {
          en: "The equator is latitude 0° — the Earth's widest circle, splitting the globe into the northern and southern hemispheres.",
          hi: "विषुवत रेखा 0° अक्षांश है — पृथ्वी का सबसे चौड़ा घेरा, जो ग्लोब को उत्तरी और दक्षिणी गोलार्धों में बाँटता है।",
          mr: "विषुववृत्त म्हणजे 0° अक्षांश — पृथ्वीचा सर्वांत रुंद वेढा, जो गोलाला उत्तर आणि दक्षिण गोलार्धांत वाटतो.",
        },
        pair: {
          left: { en: "The equator", hi: "विषुवत रेखा", mr: "विषुववृत्त" },
          right: { en: "zero, and widest", hi: "शून्य, और सबसे चौड़ी", mr: "शून्य, आणि सर्वांत रुंद" },
        },
      },
      {
        id: "tropicofcancer",
        name: { en: "The Tropic of Cancer", hi: "कर्क रेखा", mr: "कर्कवृत्त" },
        kind: "line",
        prompt: {
          en: "Which latitude line at 23½° north runs right across the MIDDLE of India — through Gujarat, MP and onward east?",
          hi: "23½° उत्तर की कौन-सी अक्षांश रेखा भारत के ठीक बीच से गुज़रती है — गुजरात, मध्य प्रदेश और आगे पूर्व तक?",
          mr: "23½° उत्तरेची कोणती अक्षांश रेषा भारताच्या नेमक्या मधोमध जाते — गुजरात, मध्य प्रदेश आणि पुढे पूर्वेकडे?",
        },
        statement: {
          en: "The Tropic of Cancer, 23½° north, crosses the middle of India — the northern limit of the overhead sun.",
          hi: "कर्क रेखा, 23½° उत्तर, भारत के बीच से गुज़रती है — सिर पर आते सूरज की उत्तरी हद।",
          mr: "कर्कवृत्त, 23½° उत्तर, भारताच्या मधोमध जाते — डोक्यावर येणाऱ्या सूर्याची उत्तर हद्द.",
        },
        pair: {
          left: { en: "The Tropic of Cancer", hi: "कर्क रेखा", mr: "कर्कवृत्त" },
          right: {
            en: "the overhead sun's north limit",
            hi: "सिर के सूरज की उत्तरी हद",
            mr: "डोईवरच्या सूर्याची उत्तर हद्द",
          },
        },
      },
      {
        id: "torridzone",
        name: { en: "The torrid zone", hi: "उष्ण कटिबंध", mr: "उष्ण कटिबंध" },
        kind: "zone",
        prompt: {
          en: "Between the two tropics the noon sun climbs directly overhead at least once a year. What is this hottest belt called?",
          hi: "दोनों कटिबंधीय रेखाओं के बीच दोपहर का सूरज साल में कम-से-कम एक बार ठीक सिर पर चढ़ता है। इस सबसे गर्म पेटी को क्या कहते हैं?",
          mr: "दोन्ही कटिबंध-रेषांच्या मध्ये दुपारचा सूर्य वर्षातून किमान एकदा नेमका डोक्यावर चढतो. या सर्वांत उष्ण पट्ट्याला काय म्हणतात?",
        },
        statement: {
          en: "The torrid zone lies between the tropics — the sun stands overhead there, so it receives the most direct heat of all the belts.",
          hi: "उष्ण कटिबंध दोनों कटिबंधीय रेखाओं के बीच है — वहाँ सूरज सिर पर खड़ा होता है, इसलिए सब पेटियों में सबसे सीधी गर्मी उसी को मिलती है।",
          mr: "उष्ण कटिबंध दोन्ही कटिबंध-रेषांच्या मध्ये आहे — तिथे सूर्य डोक्यावर उभा राहतो, म्हणून साऱ्या पट्ट्यांत सर्वांत थेट उष्णता त्यालाच मिळते.",
        },
        pair: {
          left: { en: "The torrid zone", hi: "उष्ण कटिबंध", mr: "उष्ण कटिबंध" },
          right: { en: "the sun straight overhead", hi: "ठीक सिर पर सूरज", mr: "नेमका डोक्यावर सूर्य" },
        },
      },
      {
        id: "frigidzone",
        name: { en: "The frigid zones", hi: "शीत कटिबंध", mr: "शीत कटिबंध" },
        kind: "zone",
        prompt: {
          en: "Near the two poles the sun never climbs high — its rays arrive slanting and spread thin. What are these coldest belts called?",
          hi: "दोनों ध्रुवों के पास सूरज कभी ऊँचा नहीं चढ़ता — किरणें तिरछी आतीं, पतली फैलतीं। इन सबसे ठंडी पेटियों को क्या कहते हैं?",
          mr: "दोन्ही ध्रुवांजवळ सूर्य कधी उंच चढत नाही — किरणे तिरपी येतात, विरळ पसरतात. या सर्वांत थंड पट्ट्यांना काय म्हणतात?",
        },
        statement: {
          en: "The frigid zones ring the poles — the sun's rays strike them at a slant, spreading their heat thin, so ice keeps the land.",
          hi: "शीत कटिबंध ध्रुवों को घेरते हैं — सूरज की किरणें वहाँ तिरछी पड़ती हैं, गर्मी पतली फैलती है, तो बर्फ़ धरती थामे रहती है।",
          mr: "शीत कटिबंध ध्रुवांना वेढतात — सूर्याची किरणे तिथे तिरपी पडतात, उष्णता विरळ पसरते, म्हणून बर्फ भूमी धरून ठेवते.",
        },
        pair: {
          left: { en: "The frigid zones", hi: "शीत कटिबंध", mr: "शीत कटिबंध" },
          right: {
            en: "slanting rays, lasting ice",
            hi: "तिरछी किरणें, टिकी बर्फ़",
            mr: "तिरपी किरणे, टिकलेले बर्फ",
          },
        },
      },
      {
        id: "primemeridian",
        name: { en: "The Prime Meridian", hi: "प्रधान देशांतर रेखा", mr: "मूळ रेखावृत्त" },
        kind: "line",
        prompt: {
          en: "Longitude needed a zero, and the world agreed on the line through Greenwich in London. What is that 0° line called?",
          hi: "देशांतर को एक शून्य चाहिए था, और दुनिया लंदन के ग्रीनविच से गुज़रती रेखा पर सहमत हुई। उस 0° रेखा को क्या कहते हैं?",
          mr: "रेखांशाला एक शून्य हवे होते, आणि जग लंडनच्या ग्रिनिचमधून जाणाऱ्या रेषेवर सहमत झाले. त्या 0° रेषेला काय म्हणतात?",
        },
        statement: {
          en: "The Prime Meridian is longitude 0°, passing through Greenwich — east and west are counted from this agreed line.",
          hi: "प्रधान देशांतर रेखा 0° देशांतर है, ग्रीनविच से गुज़रती — पूर्व और पश्चिम इसी मानी हुई रेखा से गिने जाते हैं।",
          mr: "मूळ रेखावृत्त म्हणजे 0° रेखांश, ग्रिनिचमधून जाणारे — पूर्व आणि पश्चिम या मान्य रेषेपासून मोजले जातात.",
        },
        detail: {
          en: "Unlike the equator, nature marks no zero for longitude — this one is a human agreement.",
          hi: "विषुवत के उलट, देशांतर का शून्य प्रकृति नहीं बताती — यह इंसानी सहमति है।",
          mr: "विषुववृत्ताच्या उलट, रेखांशाचे शून्य निसर्ग सांगत नाही — ही माणसांची सहमती आहे.",
        },
        extra: {
          en: "Time itself is counted from it — each 15° of longitude is one hour of the clock.",
          hi: "समय भी उसी से गिना जाता है — देशांतर के हर 15° पर घड़ी का एक घंटा।",
          mr: "वेळही त्यावरूनच मोजली जाते — रेखांशाच्या दर 15° ला घड्याळाचा एक तास.",
        },
        pair: {
          left: { en: "The Prime Meridian", hi: "प्रधान देशांतर रेखा", mr: "मूळ रेखावृत्त" },
          right: {
            en: "the agreed zero of east-west",
            hi: "पूर्व-पश्चिम का माना शून्य",
            mr: "पूर्व-पश्चिमेचे मान्य शून्य",
          },
        },
      },
      {
        id: "ist",
        name: {
          en: "Indian Standard Time",
          hi: "भारतीय मानक समय",
          mr: "भारतीय प्रमाण वेळ",
        },
        kind: "time-idea",
        prompt: {
          en: "One clock for the whole country, set by the longitude 82½°E near Mirzapur — what is this shared time called?",
          hi: "पूरे देश की एक घड़ी, मिर्ज़ापुर के पास 82½° पूर्व देशांतर से मिलाई हुई — इस साझा समय को क्या कहते हैं?",
          mr: "साऱ्या देशाचे एक घड्याळ, मिर्झापूरजवळच्या 82½° पूर्व रेखांशाने लावलेले — या सामायिक वेळेला काय म्हणतात?",
        },
        statement: {
          en: "Indian Standard Time is the whole country's one clock, set to the longitude 82½°E — so trains, schools and news keep one time from Kutch to Kohima.",
          hi: "भारतीय मानक समय पूरे देश की एक घड़ी है, 82½° पूर्व देशांतर से मिली — ताकि कच्छ से कोहिमा तक रेलें, स्कूल और समाचार एक समय चलें।",
          mr: "भारतीय प्रमाण वेळ हे साऱ्या देशाचे एक घड्याळ, 82½° पूर्व रेखांशाला लावलेले — म्हणजे कच्छपासून कोहिमापर्यंत गाड्या, शाळा आणि बातम्या एका वेळेवर चालतात.",
        },
        pair: {
          left: { en: "IST", hi: "भारतीय मानक समय", mr: "भारतीय प्रमाण वेळ" },
          right: {
            en: "one clock, Kutch to Kohima",
            hi: "एक घड़ी, कच्छ से कोहिमा",
            mr: "एक घड्याळ, कच्छ ते कोहिमा",
          },
        },
      },
      {
        id: "grid",
        name: { en: "The grid", hi: "ग्रिड (जाल)", mr: "जाळी (ग्रिड)" },
        kind: "time-idea",
        prompt: {
          en: "A ship radios just two numbers — its latitude and longitude — and rescuers race to the exact spot on a trackless sea. What is this net of crossing lines called?",
          hi: "जहाज़ रेडियो पर बस दो अंक भेजता है — अपना अक्षांश और देशांतर — और बचाव-दल बे-निशान समुद्र के ठीक उसी बिंदु पर दौड़ पड़ते हैं। कटती रेखाओं के इस जाल को क्या कहते हैं?",
          mr: "जहाज रेडिओवर फक्त दोन आकडे पाठवते — आपला अक्षांश आणि रेखांश — आणि बचाव-पथके खुणाविहीन समुद्रावर नेमक्या त्याच बिंदूकडे धावतात. छेदणाऱ्या रेषांच्या या जाळ्याला काय म्हणतात?",
        },
        statement: {
          en: "The grid is the net of latitudes and longitudes — one line of each crosses at exactly one point, so two numbers pin any place on Earth.",
          hi: "ग्रिड अक्षांशों और देशांतरों का जाल है — हर एक की एक रेखा ठीक एक बिंदु पर कटती है, तो दो अंक पृथ्वी की कोई भी जगह जकड़ लेते हैं।",
          mr: "जाळी म्हणजे अक्षांश आणि रेखांशांचे जाळे — प्रत्येकाची एक रेषा नेमक्या एका बिंदूवर छेदते, म्हणून दोन आकडे पृथ्वीवरची कोणतीही जागा पकडतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort the places by heat zone: A-a town on the equator, B-a city at 45° north, C-a station at the South Pole. Which trio is right?",
          hi: "जगहों को ताप-कटिबंध से छाँटिए: अ-विषुवत पर बसा क़स्बा, ब-45° उत्तर का शहर, स-दक्षिणी ध्रुव का स्टेशन। कौन-सी तिकड़ी सही है?",
          mr: "जागा उष्णता-पट्ट्याने लावा: अ-विषुववृत्तावरचे गाव, ब-45° उत्तरेचे शहर, क-दक्षिण ध्रुवावरचे स्थानक. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: torrid zone · B: temperate zone · C: frigid zone",
            hi: "अ: उष्ण कटिबंध · ब: शीतोष्ण कटिबंध · स: शीत कटिबंध",
            mr: "अ: उष्ण कटिबंध · ब: समशीतोष्ण कटिबंध · क: शीत कटिबंध",
          },
          {
            en: "A: frigid zone · B: torrid zone · C: temperate zone",
            hi: "अ: शीत कटिबंध · ब: उष्ण कटिबंध · स: शीतोष्ण कटिबंध",
            mr: "अ: शीत कटिबंध · ब: उष्ण कटिबंध · क: समशीतोष्ण कटिबंध",
          },
          {
            en: "A: temperate zone · B: frigid zone · C: torrid zone",
            hi: "अ: शीतोष्ण कटिबंध · ब: शीत कटिबंध · स: उष्ण कटिबंध",
            mr: "अ: समशीतोष्ण कटिबंध · ब: शीत कटिबंध · क: उष्ण कटिबंध",
          },
          {
            en: "A: torrid zone · B: frigid zone · C: temperate zone",
            hi: "अ: उष्ण कटिबंध · ब: शीत कटिबंध · स: शीतोष्ण कटिबंध",
            mr: "अ: उष्ण कटिबंध · ब: शीत कटिबंध · क: समशीतोष्ण कटिबंध",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Latitude is a heat-ration card: the equator's town takes the sun overhead — torrid; at 45° the rays arrive tilted but useful — temperate; at the pole they graze the ice — frigid. Read a place's latitude and you have read its ration of sunshine.",
          hi: "अक्षांश गर्मी का राशन-कार्ड है: विषुवत का क़स्बा सिर पर सूरज पाता है — उष्ण; 45° पर किरणें झुकी पर काम की आती हैं — शीतोष्ण; ध्रुव पर वे बर्फ़ को छूकर निकल जाती हैं — शीत। जगह का अक्षांश पढ़ लिया तो उसकी धूप का राशन पढ़ लिया।",
          mr: "अक्षांश म्हणजे उष्णतेचे शिधापत्रक: विषुववृत्ताचे गाव डोक्यावर सूर्य घेते — उष्ण; 45° वर किरणे कललेली पण कामाची — समशीतोष्ण; ध्रुवावर ती बर्फाला घासून निघतात — शीत. जागेचा अक्षांश वाचला की तिच्या उन्हाचा शिधा वाचला.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The sun rises over Arunachal nearly two hours before Gujarat — yet both keep one IST. What does the single clock buy, and what does it cost?",
          hi: "अरुणाचल में सूरज गुजरात से क़रीब दो घंटे पहले उगता है — फिर भी दोनों एक ही भारतीय मानक समय रखते हैं। एक घड़ी क्या दिलाती है, और क्या क़ीमत लेती है?",
          mr: "अरुणाचलात सूर्य गुजरातहून जवळजवळ दोन तास आधी उगवतो — तरी दोघे एकच भारतीय प्रमाण वेळ पाळतात. एक घड्याळ काय मिळवून देते, आणि काय किंमत घेते?",
        },
        choices: [
          {
            en: "It buys one timetable for trains, exams and broadcasts across the land — at the cost that clock-time and sun-time drift apart at the country's edges",
            hi: "वह देश भर की रेलों, परीक्षाओं और प्रसारणों को एक समय-सारिणी दिलाती है — इस क़ीमत पर कि देश के छोरों पर घड़ी का समय और सूरज का समय अलग हो जाते हैं",
            mr: "ते देशभरच्या गाड्या, परीक्षा आणि प्रक्षेपणांना एक वेळापत्रक देते — या किमतीवर की देशाच्या टोकांना घड्याळाची वेळ आणि सूर्याची वेळ वेगळ्या होतात",
          },
          {
            en: "Nothing — the sun actually rises at the same moment everywhere in India",
            hi: "कुछ नहीं — भारत में सूरज सचमुच हर जगह एक ही पल उगता है",
            mr: "काहीच नाही — भारतात सूर्य खरोखर सर्वत्र एकाच क्षणी उगवतो",
          },
          {
            en: "It makes the eastern states' days two hours shorter",
            hi: "वह पूर्वी राज्यों के दिन दो घंटे छोटे कर देती है",
            mr: "ते पूर्वेकडच्या राज्यांचे दिवस दोन तासांनी लहान करते",
          },
          {
            en: "It was chosen to favour Gujarat's sunrise",
            hi: "वह गुजरात के सूर्योदय के पक्ष में चुनी गई",
            mr: "ते गुजरातच्या सूर्योदयाच्या बाजूने निवडले गेले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The Earth turns 15° an hour, and India spans about 30° — two sun-hours. A country could run many local times or one shared clock; India chose the middle longitude, 82½°E, and one IST. The gain is coordination: a 9 o'clock exam is 9 o'clock everywhere. The price is felt at the edges — Arunachal's bright 4 am, Gujarat's late dusk. Standard time is not nature; it is a country's agreement laid over nature.",
          hi: "पृथ्वी घंटे में 15° घूमती है, और भारत क़रीब 30° फैला है — सूरज के दो घंटे। देश कई स्थानीय समय रख सकता था या एक साझा घड़ी; भारत ने बीच का देशांतर, 82½° पूर्व, और एक भारतीय मानक समय चुना। लाभ है तालमेल: 9 बजे की परीक्षा हर जगह 9 बजे है। क़ीमत छोरों पर महसूस होती है — अरुणाचल की उजली सुबह 4 बजे, गुजरात की देर शाम। मानक समय प्रकृति नहीं; प्रकृति पर बिछाई देश की सहमति है।",
          mr: "पृथ्वी तासाला 15° फिरते, आणि भारत सुमारे 30° पसरला आहे — सूर्याचे दोन तास. देश अनेक स्थानिक वेळा ठेवू शकला असता वा एक सामायिक घड्याळ; भारताने मधले रेखांश, 82½° पूर्व, आणि एक प्रमाण वेळ निवडली. लाभ म्हणजे मेळ: 9 वाजताची परीक्षा सर्वत्र 9 वाजता. किंमत टोकांना जाणवते — अरुणाचलची उजळ पहाट 4 ला, गुजरातची उशिराची संध्याकाळ. प्रमाण वेळ म्हणजे निसर्ग नव्हे; निसर्गावर घातलेली देशाची सहमती.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A distress call gives only '20°N, 70°E' — and the rescue ship steams to one exact point of empty sea. Why do TWO numbers suffice to name any spot on Earth?",
          hi: "संकट-संदेश केवल '20° उत्तर, 70° पूर्व' कहता है — और बचाव-जहाज़ ख़ाली समुद्र के ठीक एक बिंदु की ओर चल पड़ता है। पृथ्वी की कोई भी जगह बताने को दो अंक काफ़ी क्यों हैं?",
          mr: "संकट-संदेश फक्त '20° उत्तर, 70° पूर्व' सांगतो — आणि बचाव-जहाज रिकाम्या समुद्राच्या नेमक्या एका बिंदूकडे निघते. पृथ्वीवरची कोणतीही जागा सांगायला दोन आकडे पुरेसे का?",
        },
        choices: [
          {
            en: "One latitude circle and one longitude line cross at exactly one point — the pair is a complete address, needing no landmark at all",
            hi: "एक अक्षांश-घेरा और एक देशांतर-रेखा ठीक एक बिंदु पर कटते हैं — यह जोड़ी पूरा पता है, जिसे किसी निशान की ज़रूरत नहीं",
            mr: "एक अक्षांश-वेढा आणि एक रेखांश-रेषा नेमक्या एका बिंदूवर छेदतात — ही जोडी म्हणजे पूर्ण पत्ता, कोणत्याही खुणेची गरज नसलेला",
          },
          {
            en: "Ships can only sail where lines are painted on the water",
            hi: "जहाज़ वहीं चल सकते हैं जहाँ पानी पर रेखाएँ खिंची हों",
            mr: "जहाजे फक्त पाण्यावर रेषा आखलेल्या जागीच चालू शकतात",
          },
          {
            en: "Two numbers narrow it to a region; the rest is luck",
            hi: "दो अंक इलाक़े तक ले जाते हैं; बाक़ी क़िस्मत",
            mr: "दोन आकडे प्रदेशापर्यंत नेतात; बाकी नशीब",
          },
          {
            en: "The sea is small enough to search once nearby",
            hi: "पास पहुँचकर समुद्र खोजने लायक़ छोटा है",
            mr: "जवळ पोहोचल्यावर समुद्र शोधण्याइतका लहान आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "On land, addresses lean on landmarks — street, lane, door. The open sea has none, so the grid carries the whole address in numbers: the latitude picks one ring round the Earth, the longitude picks one line pole to pole, and rings cross lines at single points. Every place on the planet — your school included — owns such a pair; the grid is the address book of the whole world.",
          hi: "ज़मीन पर पते निशानों पर टिकते हैं — सड़क, गली, दरवाज़ा। खुले समुद्र में कोई नहीं, तो ग्रिड पूरा पता अंकों में ढोता है: अक्षांश पृथ्वी का एक छल्ला चुनता है, देशांतर ध्रुव-से-ध्रुव एक रेखा, और छल्ले रेखाओं को एक-एक बिंदु पर काटते हैं। ग्रह की हर जगह — आपका स्कूल भी — ऐसी जोड़ी रखती है; ग्रिड पूरी दुनिया की पता-पुस्तिका है।",
          mr: "जमिनीवर पत्ते खुणांवर विसंबतात — रस्ता, गल्ली, दार. खुल्या समुद्रावर काहीच नाही, म्हणून जाळी सारा पत्ता आकड्यांत वाहते: अक्षांश पृथ्वीचे एक कडे निवडतो, रेखांश ध्रुव-ते-ध्रुव एक रेषा, आणि कडी रेषांना एकेका बिंदूवर छेदतात. ग्रहावरची प्रत्येक जागा — तुमची शाळाही — अशी जोडी बाळगते; जाळी म्हणजे साऱ्या जगाची पत्तावही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Motions of the Earth                                        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-6-motions-of-the-earth",
    subject: "GEOGRAPHY",
    classLevel: 6,
    chapter: {
      en: "Chapter 3 — Motions of the Earth",
      hi: "अध्याय 3 — पृथ्वी की गतियाँ",
      mr: "प्रकरण 3 — पृथ्वीच्या गती",
    },
    name: { en: "Motions of the Earth", hi: "पृथ्वी की गतियाँ", mr: "पृथ्वीच्या गती" },
    summary: {
      en: "Two motions, all our time — the spin that makes the day, the year-long journey round the Sun, and the steady tilt that deals out the seasons.",
      hi: "दो गतियाँ, हमारा सारा समय — दिन बनाता घूर्णन, सूर्य के गिर्द साल भर की यात्रा, और वह अटल झुकाव जो ऋतुएँ बाँटता है।",
      mr: "दोन गती, आपला सारा काळ — दिवस घडवणारे परिवलन, सूर्याभोवतीची वर्षभराची यात्रा, आणि ऋतू वाटणारा स्थिर कल.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "rotation",
        name: { en: "Rotation", hi: "घूर्णन", mr: "परिवलन" },
        kind: "motion",
        prompt: {
          en: "The Earth spins once on its own axis in about 24 hours. What is this first motion called?",
          hi: "पृथ्वी अपनी धुरी पर क़रीब 24 घंटे में एक चक्कर घूमती है। इस पहली गति को क्या कहते हैं?",
          mr: "पृथ्वी आपल्या आसाभोवती सुमारे 24 तासांत एक फेरी फिरते. या पहिल्या गतीला काय म्हणतात?",
        },
        statement: {
          en: "Rotation is the Earth's spin on its own axis — one turn in about 24 hours, the clock behind every day and night.",
          hi: "घूर्णन पृथ्वी का अपनी धुरी पर घूमना है — क़रीब 24 घंटे में एक चक्कर, हर दिन-रात के पीछे की घड़ी।",
          mr: "परिवलन म्हणजे पृथ्वीचे आपल्या आसाभोवती फिरणे — सुमारे 24 तासांत एक फेरी, प्रत्येक दिवस-रात्रीमागचे घड्याळ.",
        },
        pair: {
          left: { en: "Rotation", hi: "घूर्णन", mr: "परिवलन" },
          right: { en: "the day's own spin", hi: "दिन का अपना चक्कर", mr: "दिवसाची स्वतःची फेरी" },
        },
      },
      {
        id: "daynight",
        name: { en: "Day and night", hi: "दिन और रात", mr: "दिवस आणि रात्र" },
        kind: "motion-effect",
        prompt: {
          en: "At every moment half the Earth faces the Sun and half faces away — and the spin swaps the halves. What does this endless exchange give us?",
          hi: "हर पल पृथ्वी का आधा भाग सूर्य की ओर है और आधा उससे परे — और घूर्णन दोनों आधों की अदला-बदली करता रहता है। यह अंतहीन अदला-बदली हमें क्या देती है?",
          mr: "प्रत्येक क्षणी पृथ्वीचा अर्धा भाग सूर्याकडे आणि अर्धा पलीकडे — आणि परिवलन दोन्ही अर्ध्यांची अदलाबदल करत राहते. ही अखंड अदलाबदल आपल्याला काय देते?",
        },
        statement: {
          en: "Day and night come from rotation — the lit half lives its day while the dark half sleeps, and the spin trades them every hour.",
          hi: "दिन-रात घूर्णन से आते हैं — उजला आधा अपना दिन जीता है जब अँधेरा आधा सोता है, और चक्कर हर घंटे उनकी अदला-बदली करता है।",
          mr: "दिवस-रात्र परिवलनातून येतात — उजळ अर्धा आपला दिवस जगतो तर काळोखा अर्धा झोपतो, आणि फेरी दर तासाला त्यांची अदलाबदल करते.",
        },
        detail: {
          en: "The circle dividing lit from dark even has a name — the circle of illumination.",
          hi: "उजाले को अँधेरे से बाँटते घेरे का नाम भी है — प्रदीप्ति वृत्त।",
          mr: "उजेडाला काळोखापासून वाटणाऱ्या वेढ्याला नावही आहे — प्रकाशवृत्त.",
        },
        extra: {
          en: "Without the spin, one face would burn in endless day and the other freeze in endless night.",
          hi: "बिना चक्कर के एक चेहरा अनंत दिन में जलता और दूसरा अनंत रात में जमता।",
          mr: "फेरीविना एक चेहरा अनंत दिवसात जळाला असता आणि दुसरा अनंत रात्रीत गोठला असता.",
        },
        pair: {
          left: { en: "Day and night", hi: "दिन और रात", mr: "दिवस आणि रात्र" },
          right: {
            en: "the spin's hourly trade",
            hi: "चक्कर की घंटा-दर-घंटा अदला-बदली",
            mr: "फेरीची तासा-तासाची अदलाबदल",
          },
        },
      },
      {
        id: "revolution",
        name: { en: "Revolution", hi: "परिक्रमण", mr: "परिभ्रमण" },
        kind: "motion",
        prompt: {
          en: "While spinning, the Earth also travels one huge circuit round the Sun in 365¼ days. What is this second motion called?",
          hi: "घूमते-घूमते पृथ्वी 365¼ दिनों में सूर्य के गिर्द एक विशाल फेरा भी पूरा करती है। इस दूसरी गति को क्या कहते हैं?",
          mr: "फिरता फिरता पृथ्वी 365¼ दिवसांत सूर्याभोवती एक प्रचंड फेरीही पूर्ण करते. या दुसऱ्या गतीला काय म्हणतात?",
        },
        statement: {
          en: "Revolution is the Earth's year-long journey round the Sun — 365 days and a quarter for one full circuit.",
          hi: "परिक्रमण पृथ्वी की सूर्य के गिर्द साल भर की यात्रा है — एक पूरे फेरे में 365 दिन और चौथाई।",
          mr: "परिभ्रमण म्हणजे पृथ्वीची सूर्याभोवतीची वर्षभराची यात्रा — एका पूर्ण फेरीला 365 दिवस आणि पाव.",
        },
        pair: {
          left: { en: "Revolution", hi: "परिक्रमण", mr: "परिभ्रमण" },
          right: { en: "the year's long circuit", hi: "साल का लंबा फेरा", mr: "वर्षाची लांब फेरी" },
        },
      },
      {
        id: "leapyear",
        name: { en: "The leap year", hi: "अधिवर्ष", mr: "लीप वर्ष" },
        kind: "motion-effect",
        prompt: {
          en: "The journey takes 365 days AND a quarter — so every fourth year the calendar collects its four saved quarters into one extra day. What is that year called?",
          hi: "यात्रा में 365 दिन और एक चौथाई लगती है — तो हर चौथे साल कैलेंडर अपनी चार बची चौथाइयाँ जोड़कर एक अतिरिक्त दिन बनाता है। उस साल को क्या कहते हैं?",
          mr: "यात्रेला 365 दिवस आणि एक पाव लागतात — म्हणून दर चौथ्या वर्षी दिनदर्शिका आपले चार साठलेले पाव जोडून एक जादा दिवस करते. त्या वर्षाला काय म्हणतात?",
        },
        statement: {
          en: "A leap year gathers four saved quarter-days into February's 29th — the calendar settling its debt with the Earth's true journey.",
          hi: "अधिवर्ष चार बची चौथाई-दिनों को फ़रवरी की 29 तारीख़ में समेटता है — कैलेंडर का पृथ्वी की सच्ची यात्रा से हिसाब चुकता करना।",
          mr: "लीप वर्ष चार साठलेले पाव-दिवस फेब्रुवारीच्या 29 तारखेत गोळा करते — दिनदर्शिकेने पृथ्वीच्या खऱ्या यात्रेशी हिशेब चुकता करणे.",
        },
      },
      {
        id: "tiltedaxis",
        name: { en: "The tilted axis", hi: "झुकी हुई धुरी", mr: "कललेला आस" },
        kind: "motion",
        prompt: {
          en: "The Earth's axis does not stand upright — it leans at 23½° and keeps pointing the SAME way all round the journey. What is this lean called?",
          hi: "पृथ्वी की धुरी सीधी खड़ी नहीं — वह 23½° झुकी है और पूरी यात्रा में एक ही ओर ताकती रहती है। इस झुकाव को क्या कहते हैं?",
          mr: "पृथ्वीचा आस ताठ उभा नाही — तो 23½° कललेला आहे आणि साऱ्या यात्रेत एकाच दिशेला रोखलेला राहतो. या कलाला काय म्हणतात?",
        },
        statement: {
          en: "The axis leans at 23½° and holds that lean all year — the tilt never swings, only the Earth's position round the Sun changes.",
          hi: "धुरी 23½° झुकी है और साल भर वही झुकाव थामे रहती है — झुकाव नहीं डोलता, बस सूर्य के गिर्द पृथ्वी की जगह बदलती है।",
          mr: "आस 23½° कललेला आहे आणि वर्षभर तोच कल धरून राहतो — कल हलत नाही, फक्त सूर्याभोवतीची पृथ्वीची जागा बदलते.",
        },
        pair: {
          left: { en: "The tilted axis", hi: "झुकी धुरी", mr: "कललेला आस" },
          right: {
            en: "a lean that never swings",
            hi: "कभी न डोलता झुकाव",
            mr: "कधीही न हलणारा कल",
          },
        },
      },
      {
        id: "seasons",
        name: { en: "The seasons", hi: "ऋतुएँ", mr: "ऋतू" },
        kind: "motion-effect",
        prompt: {
          en: "Summer when your half of the Earth leans TOWARD the Sun, winter when it leans away — what does this yearly dealing-out of sunshine give us?",
          hi: "गर्मी जब आपका आधा भाग सूर्य की ओर झुका हो, सर्दी जब परे — धूप का यह सालाना बँटवारा हमें क्या देता है?",
          mr: "उन्हाळा जेव्हा तुमचा अर्धा भाग सूर्याकडे कललेला, हिवाळा जेव्हा पलीकडे — उन्हाची ही वार्षिक वाटणी आपल्याला काय देते?",
        },
        statement: {
          en: "The seasons come from tilt plus revolution — the half leaning sunward gets tall sun and long days (summer), the half leaning away gets slanting sun and short days (winter).",
          hi: "ऋतुएँ झुकाव और परिक्रमण से आती हैं — सूर्य की ओर झुका आधा ऊँचा सूरज और लंबे दिन पाता है (गर्मी), परे झुका आधा तिरछा सूरज और छोटे दिन (सर्दी)।",
          mr: "ऋतू कल आणि परिभ्रमणातून येतात — सूर्याकडे कललेला अर्धा उंच सूर्य आणि लांब दिवस मिळवतो (उन्हाळा), पलीकडे कललेला तिरपा सूर्य आणि आखूड दिवस (हिवाळा).",
        },
        detail: {
          en: "Distance is NOT the cause — the Earth is actually slightly nearer the Sun during the north's winter.",
          hi: "दूरी कारण नहीं है — उत्तर की सर्दियों में पृथ्वी असल में सूर्य से थोड़ी पास होती है।",
          mr: "अंतर हे कारण नाही — उत्तरेच्या हिवाळ्यात पृथ्वी खरे तर सूर्याच्या किंचित जवळ असते.",
        },
        extra: {
          en: "Halfway between the leans come the two equinoxes — day and night equal the world over.",
          hi: "दोनों झुकावों के बीच आते हैं दो विषुव — पूरी दुनिया में दिन-रात बराबर।",
          mr: "दोन्ही कलांच्या मध्ये येतात दोन विषुवदिन — साऱ्या जगात दिवस-रात्र सारखे.",
        },
        pair: {
          left: { en: "The seasons", hi: "ऋतुएँ", mr: "ऋतू" },
          right: {
            en: "sunshine dealt by the lean",
            hi: "झुकाव से बँटी धूप",
            mr: "कलाने वाटलेले ऊन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the motion to what it makes: A-day and night, B-the year, C-the seasons. Which trio is right?",
          hi: "गति को उसकी देन से मिलाइए: अ-दिन-रात, ब-वर्ष, स-ऋतुएँ। कौन-सी तिकड़ी सही है?",
          mr: "गती तिच्या देणगीशी जुळवा: अ-दिवस-रात्र, ब-वर्ष, क-ऋतू. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: rotation · B: revolution · C: the tilt riding on revolution",
            hi: "अ: घूर्णन · ब: परिक्रमण · स: परिक्रमण पर सवार झुकाव",
            mr: "अ: परिवलन · ब: परिभ्रमण · क: परिभ्रमणावर स्वार कल",
          },
          {
            en: "A: revolution · B: the tilt · C: rotation",
            hi: "अ: परिक्रमण · ब: झुकाव · स: घूर्णन",
            mr: "अ: परिभ्रमण · ब: कल · क: परिवलन",
          },
          {
            en: "A: the tilt · B: rotation · C: revolution",
            hi: "अ: झुकाव · ब: घूर्णन · स: परिक्रमण",
            mr: "अ: कल · ब: परिवलन · क: परिभ्रमण",
          },
          {
            en: "A: rotation · B: the tilt · C: revolution alone",
            hi: "अ: घूर्णन · ब: झुकाव · स: अकेला परिक्रमण",
            mr: "अ: परिवलन · ब: कल · क: एकटे परिभ्रमण",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The spin swaps light and dark — day and night; the circuit measures out the year; and the seasons need BOTH the steady lean and the journey that carries it round. Note the last one is a partnership: revolution without tilt would give a year with no seasons in it.",
          hi: "चक्कर उजाला-अँधेरा बदलता है — दिन-रात; फेरा वर्ष नापता है; और ऋतुओं को दोनों चाहिए — अटल झुकाव और उसे घुमाती यात्रा। ग़ौर कीजिए, आख़िरी साझेदारी है: बिना झुकाव का परिक्रमण ऐसा वर्ष देता जिसमें ऋतुएँ न होतीं।",
          mr: "फेरी उजेड-काळोख बदलते — दिवस-रात्र; प्रदक्षिणा वर्ष मोजते; आणि ऋतूंना दोन्ही हवे — स्थिर कल आणि त्याला फिरवणारी यात्रा. लक्षात घ्या, शेवटची भागीदारी आहे: कलाविना परिभ्रमणाने ऋतू नसलेले वर्ष दिले असते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Imagine the Earth's axis stood perfectly upright, everything else unchanged. What would happen to the seasons?",
          hi: "कल्पना कीजिए पृथ्वी की धुरी बिलकुल सीधी खड़ी होती, बाक़ी सब वैसा ही। ऋतुओं का क्या होता?",
          mr: "कल्पना करा पृथ्वीचा आस अगदी ताठ उभा असता, बाकी सारे तसेच. ऋतूंचे काय झाले असते?",
        },
        choices: [
          {
            en: "They would vanish — every place would keep one fixed climate and equal days all year, for no half would ever lean toward the Sun",
            hi: "वे मिट जातीं — हर जगह साल भर एक ही जलवायु और बराबर दिन रहते, क्योंकि कोई आधा कभी सूर्य की ओर न झुकता",
            mr: "ते नाहीसे झाले असते — प्रत्येक जागी वर्षभर एकच हवामान आणि सारखे दिवस राहिले असते, कारण कोणताही अर्धा कधी सूर्याकडे कलला नसता",
          },
          {
            en: "They would come twice as fast",
            hi: "वे दुगनी तेज़ी से आतीं",
            mr: "ते दुप्पट वेगाने आले असते",
          },
          {
            en: "Only summer would remain everywhere",
            hi: "हर जगह केवल गर्मी बचती",
            mr: "सर्वत्र फक्त उन्हाळा उरला असता",
          },
          {
            en: "Nothing — distance from the Sun makes the seasons",
            hi: "कुछ नहीं — ऋतुएँ तो सूर्य से दूरी बनाती है",
            mr: "काहीच नाही — ऋतू तर सूर्यापासूनचे अंतर घडवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The thought experiment isolates the true cause. Upright axis: every latitude keeps the same sun-angle all year — the equator always overhead-hot, the poles always graze-lit, nothing ever changing. The year would still pass (revolution continues) but would be seasonless, one long same. Seasons are the tilt's gift alone — which the 'distance' option fails, since Earth is nearest the Sun in northern winter.",
          hi: "यह कल्पना-प्रयोग असली कारण अलग कर देता है। सीधी धुरी: हर अक्षांश साल भर वही सूर्य-कोण रखता — विषुवत हमेशा सिर-पर-गर्म, ध्रुव हमेशा छूकर-उजले, कुछ कभी न बदलता। वर्ष फिर भी बीतता (परिक्रमण जारी) पर ऋतु-विहीन, एक लंबा एक-सा। ऋतुएँ अकेले झुकाव की देन हैं — 'दूरी' वाला विकल्प इसीलिए ग़लत है कि उत्तर की सर्दियों में पृथ्वी सूर्य के सबसे पास होती है।",
          mr: "हा कल्पना-प्रयोग खरे कारण वेगळे करतो. ताठ आस: प्रत्येक अक्षांश वर्षभर तोच सूर्य-कोन ठेवतो — विषुववृत्त सदा डोईवर-उष्ण, ध्रुव सदा घासून-उजळ, काहीही कधी न बदलणारे. वर्ष तरीही गेले असते (परिभ्रमण चालू) पण ऋतुहीन, एक लांब सारखेपण. ऋतू एकट्या कलाची देणगी — 'अंतर'वाला पर्याय म्हणूनच चुकतो, कारण उत्तरेच्या हिवाळ्यात पृथ्वी सूर्याच्या सर्वांत जवळ असते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In December, children in Delhi wear sweaters while children in Sydney head for the beach. How can one planet hold both at once?",
          hi: "दिसंबर में दिल्ली के बच्चे स्वेटर पहनते हैं जबकि सिडनी के बच्चे समुद्र-तट की ओर भागते हैं। एक ही ग्रह दोनों को एक साथ कैसे थामे है?",
          mr: "डिसेंबरात दिल्लीची मुले स्वेटर घालतात तर सिडनीची मुले समुद्रकिनाऱ्याकडे धावतात. एकच ग्रह दोन्ही एकदम कसे धरतो?",
        },
        choices: [
          {
            en: "The tilt leans one hemisphere sunward and the other away — December is the south's summer and the north's winter, two answers to one slant",
            hi: "झुकाव एक गोलार्ध को सूर्य की ओर और दूसरे को परे झुकाता है — दिसंबर दक्षिण की गर्मी और उत्तर की सर्दी है, एक झुकाव के दो उत्तर",
            mr: "कल एका गोलार्धाला सूर्याकडे आणि दुसऱ्याला पलीकडे कलवतो — डिसेंबर हा दक्षिणेचा उन्हाळा आणि उत्तरेचा हिवाळा, एका कलाची दोन उत्तरे",
          },
          {
            en: "Sydney sits nearer the Sun than Delhi does",
            hi: "सिडनी दिल्ली से सूर्य के पास बसा है",
            mr: "सिडनी दिल्लीहून सूर्याजवळ वसले आहे",
          },
          {
            en: "The southern ocean keeps Sydney warm in every month",
            hi: "दक्षिणी महासागर सिडनी को हर महीने गर्म रखता है",
            mr: "दक्षिणी महासागर सिडनीला दर महिन्यात ऊब देतो",
          },
          {
            en: "Australia's calendar runs six months behind",
            hi: "ऑस्ट्रेलिया का कैलेंडर छह महीने पीछे चलता है",
            mr: "ऑस्ट्रेलियाची दिनदर्शिका सहा महिने मागे चालते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One tilt, two hemispheres: in December the axis's southern end leans sunward, so Sydney gets the tall sun and long days that Delhi got in June. The seasons are not a property of months but of WHICH HALF leans — swap hemispheres and the calendar's seasons swap with you. That is why Christmas in Australia is a beach festival, no error anywhere.",
          hi: "एक झुकाव, दो गोलार्ध: दिसंबर में धुरी का दक्षिणी सिरा सूर्य की ओर झुका है, तो सिडनी को वही ऊँचा सूरज और लंबे दिन मिलते हैं जो दिल्ली को जून में मिले थे। ऋतुएँ महीनों की नहीं, इस बात की हैं कि कौन-सा आधा झुका है — गोलार्ध बदलिए तो कैलेंडर की ऋतुएँ आपके साथ बदल जाती हैं। इसीलिए ऑस्ट्रेलिया का क्रिसमस समुद्र-तट का त्योहार है, कहीं कोई भूल नहीं।",
          mr: "एक कल, दोन गोलार्ध: डिसेंबरात आसाचे दक्षिण टोक सूर्याकडे कललेले, म्हणून सिडनीला तोच उंच सूर्य आणि लांब दिवस मिळतात जे दिल्लीला जूनमध्ये मिळाले होते. ऋतू महिन्यांचे नव्हे, कोणता अर्धा कलला आहे याचे — गोलार्ध बदला की दिनदर्शिकेचे ऋतू तुमच्यासोबत बदलतात. म्हणूनच ऑस्ट्रेलियातला नाताळ हा समुद्रकिनाऱ्याचा सण, कुठेही चूक नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Major Domains of the Earth                                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-6-major-domains",
    subject: "GEOGRAPHY",
    classLevel: 6,
    chapter: {
      en: "Chapter 5 — Major Domains of the Earth",
      hi: "अध्याय 5 — पृथ्वी के प्रमुख परिमंडल",
      mr: "प्रकरण 5 — पृथ्वीची प्रमुख आवरणे",
    },
    name: {
      en: "Major Domains of the Earth",
      hi: "पृथ्वी के प्रमुख परिमंडल",
      mr: "पृथ्वीची प्रमुख आवरणे",
    },
    summary: {
      en: "Rock, water, air — and the thin meeting-film where all three touch and life happens; the seven continents and the oceans that outsize them all.",
      hi: "चट्टान, पानी, हवा — और वह पतली मिलन-परत जहाँ तीनों छूते हैं और जीवन घटता है; सात महाद्वीप और उन सबसे बड़े महासागर।",
      mr: "खडक, पाणी, हवा — आणि तिन्ही स्पर्शतात व जीवन घडते ती पातळ भेट-फिल्म; सात खंड आणि त्या साऱ्यांहून मोठे महासागर.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "lithosphere",
        name: { en: "The lithosphere", hi: "स्थलमंडल", mr: "शिलावरण" },
        kind: "domain",
        prompt: {
          en: "Mountains, plains, the sea-floor itself — which domain is the Earth's solid rocky shell, wearing a skin of soil?",
          hi: "पहाड़, मैदान, ख़ुद समुद्र-तल — कौन-सा परिमंडल पृथ्वी का ठोस चट्टानी खोल है, जो मिट्टी की खाल ओढ़े है?",
          mr: "पर्वत, मैदाने, स्वतः समुद्रतळ — कोणते आवरण पृथ्वीचे घन खडकाळ कवच आहे, मातीची कातडी ल्यालेले?",
        },
        statement: {
          en: "The lithosphere is the solid rock domain — the crust under every continent AND under every ocean, topped with the soil that feeds us.",
          hi: "स्थलमंडल ठोस चट्टान का परिमंडल है — हर महाद्वीप और हर महासागर के नीचे की पर्पटी, ऊपर वह मिट्टी जो हमें खिलाती है।",
          mr: "शिलावरण हे घन खडकाचे आवरण — प्रत्येक खंडाखालचे आणि प्रत्येक महासागराखालचेही कवच, वर आपल्याला पोसणारी माती.",
        },
        pair: {
          left: { en: "The lithosphere", hi: "स्थलमंडल", mr: "शिलावरण" },
          right: { en: "the rock shell", hi: "चट्टानी खोल", mr: "खडकाचे कवच" },
        },
      },
      {
        id: "hydrosphere",
        name: { en: "The hydrosphere", hi: "जलमंडल", mr: "जलावरण" },
        kind: "domain",
        prompt: {
          en: "Oceans, rivers, glaciers, the water underground — which domain gathers ALL the planet's water under one name?",
          hi: "महासागर, नदियाँ, हिमनद, भूमिगत पानी — कौन-सा परिमंडल ग्रह के सारे पानी को एक नाम तले समेटता है?",
          mr: "महासागर, नद्या, हिमनद्या, भूगर्भातले पाणी — कोणते आवरण ग्रहाचे सारे पाणी एका नावाखाली गोळा करते?",
        },
        statement: {
          en: "The hydrosphere is the water domain — seas, rivers, ice and groundwater together, covering about two-thirds of the Earth's face.",
          hi: "जलमंडल पानी का परिमंडल है — समुद्र, नदियाँ, बर्फ़ और भूजल मिलकर, पृथ्वी के चेहरे का क़रीब दो-तिहाई ढके हुए।",
          mr: "जलावरण हे पाण्याचे आवरण — समुद्र, नद्या, बर्फ आणि भूजल मिळून, पृथ्वीच्या चेहऱ्याचा सुमारे दोन-तृतीयांश झाकणारे.",
        },
        pair: {
          left: { en: "The hydrosphere", hi: "जलमंडल", mr: "जलावरण" },
          right: {
            en: "all the water, one name",
            hi: "सारा पानी, एक नाम",
            mr: "सारे पाणी, एक नाव",
          },
        },
      },
      {
        id: "atmosphere",
        name: { en: "The atmosphere", hi: "वायुमंडल", mr: "वातावरण" },
        kind: "domain",
        prompt: {
          en: "A blanket of air hundreds of kilometres thick, held to the planet by gravity's grip — which domain is this?",
          hi: "सैकड़ों किलोमीटर मोटा हवा का कंबल, गुरुत्व की पकड़ से ग्रह से बँधा — यह कौन-सा परिमंडल है?",
          mr: "शेकडो किलोमीटर जाड हवेचे पांघरूण, गुरुत्वाच्या पकडीने ग्रहाला बांधलेले — हे कोणते आवरण?",
        },
        statement: {
          en: "The atmosphere is the air domain — a gravity-held blanket that gives breath, carries weather and shields us from the sun's harshness.",
          hi: "वायुमंडल हवा का परिमंडल है — गुरुत्व से थमा कंबल जो साँस देता है, मौसम ढोता है और सूर्य की कठोरता से ओट देता है।",
          mr: "वातावरण हे हवेचे आवरण — गुरुत्वाने धरलेले पांघरूण जे श्वास देते, हवामान वाहते आणि सूर्याच्या कठोरतेपासून आडोसा देते.",
        },
        pair: {
          left: { en: "The atmosphere", hi: "वायुमंडल", mr: "वातावरण" },
          right: {
            en: "the gravity-held blanket",
            hi: "गुरुत्व से थमा कंबल",
            mr: "गुरुत्वाने धरलेले पांघरूण",
          },
        },
      },
      {
        id: "biosphere",
        name: { en: "The biosphere", hi: "जैवमंडल", mr: "जीवावरण" },
        kind: "domain",
        prompt: {
          en: "Where rock, water and air all touch, a narrow zone holds every living thing there is. What is this meeting-film called?",
          hi: "जहाँ चट्टान, पानी और हवा तीनों छूते हैं, वहाँ एक सँकरी पट्टी हर जीवित चीज़ को थामे है। इस मिलन-परत को क्या कहते हैं?",
          mr: "जिथे खडक, पाणी आणि हवा तिन्ही स्पर्शतात, तिथे एक अरुंद पट्टा प्रत्येक जिवंत गोष्ट धरून आहे. या भेट-फिल्मला काय म्हणतात?",
        },
        statement: {
          en: "The biosphere is the narrow zone where land, water and air meet — every plant, animal and person lives inside this one thin film.",
          hi: "जैवमंडल वह सँकरी पट्टी है जहाँ थल, जल और वायु मिलते हैं — हर पौधा, पशु और इंसान इसी एक पतली परत के भीतर जीता है।",
          mr: "जीवावरण म्हणजे भूमी, पाणी आणि हवा मिळतात तो अरुंद पट्टा — प्रत्येक वनस्पती, प्राणी आणि माणूस याच एका पातळ फिल्ममध्ये जगतो.",
        },
        detail: {
          en: "Set against the planet's size it is thinner than the peel on an apple.",
          hi: "ग्रह के नाप के आगे वह सेब के छिलके से भी पतली है।",
          mr: "ग्रहाच्या मापापुढे ती सफरचंदाच्या सालीहूनही पातळ आहे.",
        },
        extra: {
          en: "Harm to any one domain reaches it first — the film has no spare.",
          hi: "किसी भी परिमंडल की चोट सबसे पहले उसी तक पहुँचती है — परत के पास कोई अतिरिक्त नहीं।",
          mr: "कोणत्याही आवरणाची इजा आधी तिच्यापर्यंत पोहोचते — फिल्मकडे जादा काही नाही.",
        },
        pair: {
          left: { en: "The biosphere", hi: "जैवमंडल", mr: "जीवावरण" },
          right: { en: "life's thin film", hi: "जीवन की पतली परत", mr: "जीवनाची पातळ फिल्म" },
        },
      },
      {
        id: "asia",
        name: { en: "Asia", hi: "एशिया", mr: "आशिया" },
        kind: "continent-ocean",
        prompt: {
          en: "Of the seven continents, which is the LARGEST — home to India, China, the Himalayas and more people than all the others together?",
          hi: "सात महाद्वीपों में सबसे बड़ा कौन-सा है — भारत, चीन, हिमालय का घर, और बाक़ी सबसे मिलाकर ज़्यादा लोगों का?",
          mr: "सात खंडांत सर्वांत मोठा कोणता — भारत, चीन, हिमालयाचे घर, आणि बाकी साऱ्यांहून मिळून जास्त माणसांचे?",
        },
        statement: {
          en: "Asia is the largest continent — our own — holding the Himalayas and more people than all the other continents combined.",
          hi: "एशिया सबसे बड़ा महाद्वीप है — हमारा अपना — हिमालय को थामे, और बाक़ी सब महाद्वीपों के जोड़ से ज़्यादा लोगों को।",
          mr: "आशिया हा सर्वांत मोठा खंड — आपला स्वतःचा — हिमालय धरणारा, आणि बाकी साऱ्या खंडांच्या बेरजेहून जास्त माणसे असणारा.",
        },
        pair: {
          left: { en: "Asia", hi: "एशिया", mr: "आशिया" },
          right: { en: "the largest continent", hi: "सबसे बड़ा महाद्वीप", mr: "सर्वांत मोठा खंड" },
        },
      },
      {
        id: "pacific",
        name: { en: "The Pacific Ocean", hi: "प्रशांत महासागर", mr: "प्रशांत महासागर" },
        kind: "continent-ocean",
        prompt: {
          en: "The largest AND deepest ocean, wide enough to swallow all the continents together, its floor plunging to the Mariana Trench — which ocean is this?",
          hi: "सबसे बड़ा और सबसे गहरा महासागर, इतना चौड़ा कि सारे महाद्वीप उसमें समा जाएँ, उसका तल मारियाना गर्त तक धँसा — यह कौन-सा महासागर है?",
          mr: "सर्वांत मोठा आणि सर्वांत खोल महासागर, सारे खंड मावतील इतका रुंद, त्याचा तळ मारियाना गर्तेपर्यंत खचलेला — हा कोणता महासागर?",
        },
        statement: {
          en: "The Pacific is the largest and deepest ocean — all the continents could fit inside it, and its Mariana Trench is the planet's lowest point.",
          hi: "प्रशांत सबसे बड़ा और गहरा महासागर है — सारे महाद्वीप उसमें समा सकते हैं, और उसका मारियाना गर्त ग्रह का सबसे नीचा बिंदु है।",
          mr: "प्रशांत हा सर्वांत मोठा आणि खोल महासागर — सारे खंड त्यात मावू शकतात, आणि त्याची मारियाना गर्ता हा ग्रहाचा सर्वांत खालचा बिंदू.",
        },
        detail: {
          en: "The Mariana Trench sinks deeper below the waves than Mount Everest rises above them.",
          hi: "मारियाना गर्त लहरों के नीचे उतना धँसा है जितना एवरेस्ट उनके ऊपर उठा भी नहीं।",
          mr: "मारियाना गर्ता लाटांखाली इतकी खचली आहे की एव्हरेस्टही तितका वर चढलेला नाही.",
        },
        extra: {
          en: "Its name means 'peaceful' — given by sailors it happened to treat gently.",
          hi: "उसका नाम 'शांत' है — उन नाविकों का दिया, जिनसे वह संयोग से नरमी से पेश आया।",
          mr: "त्याचे नाव 'शांत' — ज्यांच्याशी तो योगायोगाने नरमीने वागला त्या खलाशांनी दिलेले.",
        },
        pair: {
          left: { en: "The Pacific", hi: "प्रशांत", mr: "प्रशांत" },
          right: {
            en: "largest, deepest, misnamed calm",
            hi: "सबसे बड़ा, गहरा, नाम भर का शांत",
            mr: "सर्वांत मोठा, खोल, नावापुरता शांत",
          },
        },
      },
      {
        id: "indianocean",
        name: { en: "The Indian Ocean", hi: "हिंद महासागर", mr: "हिंदी महासागर" },
        kind: "continent-ocean",
        prompt: {
          en: "Which is the only ocean named after a single country — the one whose head rests against our own peninsula?",
          hi: "एक अकेले देश के नाम पर कौन-सा इकलौता महासागर है — जिसका सिरहाना हमारे ही प्रायद्वीप से लगा है?",
          mr: "एकट्या देशाच्या नावावरचा एकमेव महासागर कोणता — ज्याचे उशाशी आपलेच द्वीपकल्प आहे?",
        },
        statement: {
          en: "The Indian Ocean is the only ocean named after one country — India sits at its head, with Africa west and Australia east.",
          hi: "हिंद महासागर एक देश के नाम वाला इकलौता महासागर है — उसके सिरहाने भारत, पश्चिम में अफ़्रीका, पूर्व में ऑस्ट्रेलिया।",
          mr: "हिंदी महासागर हा एका देशाच्या नावाचा एकमेव महासागर — त्याच्या उशाशी भारत, पश्चिमेला आफ्रिका, पूर्वेला ऑस्ट्रेलिया.",
        },
        pair: {
          left: { en: "The Indian Ocean", hi: "हिंद महासागर", mr: "हिंदी महासागर" },
          right: {
            en: "one country's name on the water",
            hi: "पानी पर एक देश का नाम",
            mr: "पाण्यावर एका देशाचे नाव",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "File each under its domain: A-a glacier, B-the Deccan's rock, C-the monsoon wind. Which trio is right?",
          hi: "हर एक को उसके परिमंडल में रखिए: अ-हिमनद, ब-दक्कन की चट्टान, स-मानसूनी हवा। कौन-सी तिकड़ी सही है?",
          mr: "प्रत्येकाला त्याच्या आवरणात ठेवा: अ-हिमनदी, ब-दख्खनचा खडक, क-मोसमी वारा. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: hydrosphere · B: lithosphere · C: atmosphere",
            hi: "अ: जलमंडल · ब: स्थलमंडल · स: वायुमंडल",
            mr: "अ: जलावरण · ब: शिलावरण · क: वातावरण",
          },
          {
            en: "A: lithosphere · B: atmosphere · C: hydrosphere",
            hi: "अ: स्थलमंडल · ब: वायुमंडल · स: जलमंडल",
            mr: "अ: शिलावरण · ब: वातावरण · क: जलावरण",
          },
          {
            en: "A: atmosphere · B: hydrosphere · C: lithosphere",
            hi: "अ: वायुमंडल · ब: जलमंडल · स: स्थलमंडल",
            mr: "अ: वातावरण · ब: जलावरण · क: शिलावरण",
          },
          {
            en: "A: hydrosphere · B: atmosphere · C: lithosphere",
            hi: "अ: जलमंडल · ब: वायुमंडल · स: स्थलमंडल",
            mr: "अ: जलावरण · ब: वातावरण · क: शिलावरण",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A glacier is water — frozen, but water still, so hydrosphere; the Deccan's rock is lithosphere; the monsoon wind is moving air, atmosphere. The trick entry is the glacier: the domains sort by WHAT a thing is, not what state it is in.",
          hi: "हिमनद पानी है — जमा हुआ, पर पानी ही, तो जलमंडल; दक्कन की चट्टान स्थलमंडल; मानसूनी हवा चलती हवा, वायुमंडल। फंदा हिमनद है: परिमंडल चीज़ के होने से छाँटते हैं, उसकी अवस्था से नहीं।",
          mr: "हिमनदी म्हणजे पाणी — गोठलेले, पण पाणीच, म्हणून जलावरण; दख्खनचा खडक शिलावरण; मोसमी वारा हलती हवा, वातावरण. सापळा हिमनदी आहे: आवरणे वस्तू काय आहे यावरून लावतात, अवस्थेवरून नव्हे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Every fish, forest and family on Earth fits inside a film thinner, in proportion, than an apple's peel. What warning does the biosphere's THINNESS carry?",
          hi: "पृथ्वी की हर मछली, हर वन और हर परिवार अनुपात में सेब के छिलके से पतली परत में समाता है। जैवमंडल का पतलापन कौन-सी चेतावनी ढोता है?",
          mr: "पृथ्वीवरचा प्रत्येक मासा, प्रत्येक वन आणि प्रत्येक कुटुंब प्रमाणात सफरचंदाच्या सालीहून पातळ फिल्ममध्ये मावते. जीवावरणाचा पातळपणा कोणता इशारा वाहतो?",
        },
        choices: [
          {
            en: "That life has no spare room — harm the air, water or soil of this one film and there is no second film to move to",
            hi: "कि जीवन के पास फ़ालतू जगह नहीं — इस एक परत की हवा, पानी या मिट्टी बिगाड़िए तो जाने को दूसरी परत है ही नहीं",
            mr: "की जीवनाकडे जादा जागा नाही — या एका फिल्मची हवा, पाणी वा माती बिघडवा, जायला दुसरी फिल्म नाहीच",
          },
          {
            en: "That life will soon spread through the whole planet's depth",
            hi: "कि जीवन जल्दी ही पूरे ग्रह की गहराई में फैल जाएगा",
            mr: "की जीवन लवकरच साऱ्या ग्रहाच्या खोलीत पसरेल",
          },
          {
            en: "That the deep rock is more important than the surface",
            hi: "कि गहरी चट्टान सतह से ज़्यादा अहम है",
            mr: "की खोल खडक पृष्ठभागाहून महत्त्वाचा आहे",
          },
          {
            en: "None — thin films are the strongest shapes",
            hi: "कोई नहीं — पतली परतें सबसे मज़बूत होती हैं",
            mr: "काहीच नाही — पातळ फिल्म सर्वांत बळकट असतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The planet is enormous; the liveable part of it is not. Below the film lies rock too hot and airless, above it air too thin and cold — everything alive crowds the boundary where the three domains overlap. Smoke poured into the air, waste into the rivers, poison into the soil all land in the same thin film we ourselves inhabit. Geography's first map is also its first warning.",
          hi: "ग्रह विशाल है; उसका जीने लायक़ हिस्सा नहीं। परत के नीचे बहुत गर्म, बे-हवा चट्टान है, ऊपर बहुत पतली, ठंडी हवा — हर जीवित चीज़ उसी सीमा पर सिमटी है जहाँ तीनों परिमंडल मिलते हैं। हवा में उड़ेला धुआँ, नदियों में डाला कचरा, मिट्टी में घोला ज़हर — सब उसी पतली परत में उतरते हैं जिसमें हम ख़ुद बसे हैं। भूगोल का पहला नक़्शा उसकी पहली चेतावनी भी है।",
          mr: "ग्रह प्रचंड आहे; त्याचा जगण्याजोगा भाग नाही. फिल्मखाली फार तापलेला, हवाविहीन खडक, वर फार विरळ, गार हवा — प्रत्येक जिवंत गोष्ट तिन्ही आवरणे मिळतात त्या सीमेवरच दाटलेली आहे. हवेत ओतलेला धूर, नद्यांत टाकलेला कचरा, मातीत कालवलेले विष — सारे आपण स्वतः राहतो त्याच पातळ फिल्ममध्ये उतरतात. भूगोलाचा पहिला नकाशा हाच त्याचा पहिला इशाराही आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Drop Mount Everest, peak first, into the Mariana Trench — its summit would still lie under two kilometres of water. What does this single comparison teach about the ocean floor?",
          hi: "एवरेस्ट को चोटी के बल मारियाना गर्त में उतार दीजिए — उसका शिखर फिर भी दो किलोमीटर पानी तले रहेगा। यह एक तुलना समुद्र-तल के बारे में क्या सिखाती है?",
          mr: "एव्हरेस्टला शिखराकडून मारियाना गर्तेत उतरवा — त्याचे शिखर तरीही दोन किलोमीटर पाण्याखाली राहील. ही एक तुलना समुद्रतळाबद्दल काय शिकवते?",
        },
        choices: [
          {
            en: "That the Earth's relief continues, even grander, under the sea — the ocean floor has trenches and mountains that out-scale the land's",
            hi: "कि पृथ्वी का उतार-चढ़ाव समुद्र तले भी, और भी विराट होकर, जारी है — समुद्र-तल के गर्त और पहाड़ थल वालों से बड़े पड़ते हैं",
            mr: "की पृथ्वीचा चढउतार समुद्राखालीही, आणखी भव्य होऊन, चालू आहे — समुद्रतळाच्या गर्ता आणि पर्वत भूमीवरच्यांहून मोठे भरतात",
          },
          {
            en: "That the sea is deepest wherever mountains are tallest",
            hi: "कि समुद्र वहीं सबसे गहरा है जहाँ पहाड़ सबसे ऊँचे हैं",
            mr: "की जिथे पर्वत सर्वांत उंच तिथेच समुद्र सर्वांत खोल",
          },
          {
            en: "That Everest is smaller than geographers claim",
            hi: "कि एवरेस्ट भूगोलवेत्ताओं के दावे से छोटा है",
            mr: "की एव्हरेस्ट भूगोलतज्ज्ञांच्या दाव्याहून लहान आहे",
          },
          {
            en: "That trenches are made by sinking mountains",
            hi: "कि गर्त धँसते पहाड़ों से बनते हैं",
            mr: "की गर्ता बुडणाऱ्या पर्वतांनी होतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The waves hide a landscape wilder than the one we walk: under the Pacific lie chasms past 11 km deep, and mid-ocean mountain chains longer than any on land. The flat blue of the map is a curtain, not a floor. Everest-in-the-trench is geography's way of saying: the lithosphere does not stop at the beach.",
          hi: "लहरें उस भूदृश्य को छिपाए हैं जो हमारे चलने वाले से भी विकट है: प्रशांत के नीचे 11 किमी से गहरी खाइयाँ हैं, और मध्य-महासागरीय पर्वतमालाएँ थल की किसी भी माला से लंबी। नक़्शे का सपाट नीला परदा है, फ़र्श नहीं। गर्त-में-एवरेस्ट भूगोल का यह कहने का ढंग है: स्थलमंडल समुद्र-तट पर नहीं रुकता।",
          mr: "लाटा आपण चालतो त्याहून रौद्र भूदृश्य लपवतात: प्रशांताखाली 11 किमीहून खोल दऱ्या आहेत, आणि मध्य-महासागरी पर्वतरांगा भूमीवरच्या कोणत्याही रांगेहून लांब. नकाशाचा सपाट निळा हा पडदा आहे, फरशी नव्हे. गर्तेतला-एव्हरेस्ट हा भूगोलाचा सांगण्याचा ढंग: शिलावरण समुद्रकिनाऱ्यावर थांबत नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Our Country: India                                          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-6-our-country-india",
    subject: "GEOGRAPHY",
    classLevel: 6,
    chapter: {
      en: "Chapter 7 — Our Country: India",
      hi: "अध्याय 7 — हमारा देश: भारत",
      mr: "प्रकरण 7 — आपला देश: भारत",
    },
    name: { en: "Our Country: India", hi: "हमारा देश: भारत", mr: "आपला देश: भारत" },
    summary: {
      en: "One country, every landform — the Himalayan wall, the river-built plains, the Thar's sands, the old southern plateau, and two island chains in two seas.",
      hi: "एक देश, हर भू-आकृति — हिमालयी दीवार, नदियों के बनाए मैदान, थार की रेत, दक्षिण का पुराना पठार, और दो समुद्रों में दो द्वीप-मालाएँ।",
      mr: "एक देश, प्रत्येक भूरूप — हिमालयी भिंत, नद्यांनी घडवलेली मैदाने, थरची वाळू, दक्षिणेचे जुने पठार, आणि दोन समुद्रांत दोन द्वीपमाला.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "himalayas",
        name: { en: "The Himalayas", hi: "हिमालय", mr: "हिमालय" },
        kind: "landform",
        prompt: {
          en: "Along India's whole northern edge stands a wall of the world's highest snow mountains. Which range is this?",
          hi: "भारत के पूरे उत्तरी छोर पर दुनिया के सबसे ऊँचे बर्फ़ीले पहाड़ों की दीवार खड़ी है। यह कौन-सी शृंखला है?",
          mr: "भारताच्या साऱ्या उत्तर कडेला जगातल्या सर्वांत उंच बर्फाळ पर्वतांची भिंत उभी आहे. ही कोणती रांग?",
        },
        statement: {
          en: "The Himalayas wall India's north — the world's highest mountains, snow-capped, guarding the plains and feeding their rivers.",
          hi: "हिमालय भारत के उत्तर की दीवार है — दुनिया के सबसे ऊँचे, बर्फ़ ओढ़े पहाड़, मैदानों की रखवाली करते और उनकी नदियों को पालते।",
          mr: "हिमालय भारताच्या उत्तरेची भिंत — जगातले सर्वांत उंच, बर्फाच्छादित पर्वत, मैदानांची राखण करणारे आणि त्यांच्या नद्यांना पोसणारे.",
        },
        detail: {
          en: "Their snows melt into rivers that run all year — the plains' unfailing water tower.",
          hi: "उनकी बर्फ़ पिघलकर साल भर बहती नदियाँ बनती है — मैदानों की अचूक पानी-मीनार।",
          mr: "त्यांचे बर्फ वितळून वर्षभर वाहणाऱ्या नद्या होतात — मैदानांचा अचूक पाणी-मनोरा.",
        },
        extra: {
          en: "They are young mountains, still rising a little every year.",
          hi: "वे जवान पहाड़ हैं, आज भी हर साल थोड़ा उठते हुए।",
          mr: "ते तरुण पर्वत आहेत, आजही दरवर्षी किंचित उंचावणारे.",
        },
        pair: {
          left: { en: "The Himalayas", hi: "हिमालय", mr: "हिमालय" },
          right: { en: "the northern wall", hi: "उत्तर की दीवार", mr: "उत्तरेची भिंत" },
        },
      },
      {
        id: "northernplains",
        name: { en: "The Northern Plains", hi: "उत्तरी मैदान", mr: "उत्तरेची मैदाने" },
        kind: "landform",
        prompt: {
          en: "South of the mountains lies flat, deep, dark soil laid down by the Ganga, Brahmaputra and their sisters. Which land is this?",
          hi: "पहाड़ों के दक्षिण में गंगा, ब्रह्मपुत्र और उनकी बहनों की बिछाई समतल, गहरी, साँवली मिट्टी है। यह कौन-सी धरती है?",
          mr: "पर्वतांच्या दक्षिणेला गंगा, ब्रह्मपुत्रा आणि त्यांच्या बहिणींनी अंथरलेली सपाट, खोल, सावळी माती आहे. ही कोणती भूमी?",
        },
        statement: {
          en: "The Northern Plains are river-built — flat, fertile silt laid down over ages by the Ganga, the Brahmaputra and their tributaries.",
          hi: "उत्तरी मैदान नदियों के बनाए हैं — गंगा, ब्रह्मपुत्र और उनकी सहायक नदियों की युगों में बिछाई समतल, उपजाऊ मिट्टी।",
          mr: "उत्तरेची मैदाने नद्यांनी घडवलेली — गंगा, ब्रह्मपुत्रा आणि त्यांच्या उपनद्यांनी युगानुयुगे अंथरलेला सपाट, सुपीक गाळ.",
        },
        detail: {
          en: "That gift of soil is why the plains carry India's thickest crowds of farms and towns.",
          hi: "मिट्टी की वही देन है कि मैदान भारत के सबसे घने खेत और शहर ढोते हैं।",
          mr: "मातीच्या त्याच देणगीमुळे मैदाने भारताची सर्वांत दाट शेते आणि गावे वाहतात.",
        },
        extra: {
          en: "Flat land also means easy roads, canals and railways — everything travels well on a plain.",
          hi: "समतल धरती यानी आसान सड़कें, नहरें और रेलें — मैदान पर हर चीज़ अच्छा चलती है।",
          mr: "सपाट भूमी म्हणजे सोप्या सडका, कालवे आणि रेल्वे — मैदानावर प्रत्येक गोष्ट नीट चालते.",
        },
        pair: {
          left: { en: "The Northern Plains", hi: "उत्तरी मैदान", mr: "उत्तरेची मैदाने" },
          right: {
            en: "the rivers' gift of soil",
            hi: "नदियों की मिट्टी-देन",
            mr: "नद्यांची माती-देणगी",
          },
        },
      },
      {
        id: "thar",
        name: { en: "The Thar Desert", hi: "थार मरुस्थल", mr: "थरचे वाळवंट" },
        kind: "landform",
        prompt: {
          en: "In India's west, sand dunes roll where rain hardly comes. Which dry land is this?",
          hi: "भारत के पश्चिम में रेत के टीले लुढ़कते हैं जहाँ बारिश मुश्किल से आती है। यह कौन-सी सूखी धरती है?",
          mr: "भारताच्या पश्चिमेला वाळूच्या टेकड्या पसरल्या आहेत जिथे पाऊस जेमतेम येतो. ही कोणती कोरडी भूमी?",
        },
        statement: {
          en: "The Thar is India's western desert — rolling dunes, scarce rain, and life built around every drop that falls.",
          hi: "थार भारत का पश्चिमी मरुस्थल है — लुढ़कते टीले, दुर्लभ बारिश, और हर गिरी बूँद के गिर्द बसा जीवन।",
          mr: "थर हे भारताचे पश्चिमी वाळवंट — पसरत्या टेकड्या, दुर्मीळ पाऊस, आणि पडणाऱ्या प्रत्येक थेंबाभोवती उभे जीवन.",
        },
        pair: {
          left: { en: "The Thar", hi: "थार", mr: "थर" },
          right: { en: "the western sands", hi: "पश्चिम की रेत", mr: "पश्चिमेची वाळू" },
        },
      },
      {
        id: "plateau",
        name: {
          en: "The Peninsular Plateau",
          hi: "प्रायद्वीपीय पठार",
          mr: "द्वीपकल्पीय पठार",
        },
        kind: "landform",
        prompt: {
          en: "South of the plains rises a huge triangular tableland of old, hard rock, rich in minerals. Which landform is this?",
          hi: "मैदानों के दक्षिण में पुरानी, कड़ी चट्टान का विशाल तिकोना अधित्यका-प्रदेश उठता है, खनिजों से भरा। यह कौन-सी भू-आकृति है?",
          mr: "मैदानांच्या दक्षिणेला जुन्या, कठीण खडकाचे प्रचंड त्रिकोणी पठार उंचावते, खनिजांनी भरलेले. हे कोणते भूरूप?",
        },
        statement: {
          en: "The Peninsular Plateau is a triangular tableland of some of the Earth's oldest rock — high, worn and heavy with minerals.",
          hi: "प्रायद्वीपीय पठार पृथ्वी की सबसे पुरानी चट्टानों में से बना तिकोना अधित्यका-प्रदेश है — ऊँचा, घिसा, खनिजों से लदा।",
          mr: "द्वीपकल्पीय पठार हे पृथ्वीच्या सर्वांत जुन्या खडकांपैकी घडलेले त्रिकोणी पठार — उंच, झिजलेले, खनिजांनी लगडलेले.",
        },
        detail: {
          en: "Old rock means treasure below — coal, iron and more hide in its depths.",
          hi: "पुरानी चट्टान यानी नीचे ख़ज़ाना — कोयला, लोहा और बहुत कुछ उसकी गहराइयों में छिपा है।",
          mr: "जुना खडक म्हणजे खाली खजिना — कोळसा, लोखंड आणि बरेच काही त्याच्या खोलीत दडले आहे.",
        },
        extra: {
          en: "Its rivers depend on the rains — swelling each monsoon, thinning each summer.",
          hi: "उसकी नदियाँ बारिश पर टिकी हैं — हर मानसून में उफनतीं, हर गर्मी में दुबलातीं।",
          mr: "त्याच्या नद्या पावसावर विसंबल्या आहेत — दर पावसाळ्यात फुगणाऱ्या, दर उन्हाळ्यात रोडावणाऱ्या.",
        },
        pair: {
          left: { en: "The Peninsular Plateau", hi: "प्रायद्वीपीय पठार", mr: "द्वीपकल्पीय पठार" },
          right: {
            en: "old rock, buried treasure",
            hi: "पुरानी चट्टान, गड़ा ख़ज़ाना",
            mr: "जुना खडक, पुरलेला खजिना",
          },
        },
      },
      {
        id: "coastalplains",
        name: { en: "The coastal plains", hi: "तटीय मैदान", mr: "किनारी मैदाने" },
        kind: "landform",
        prompt: {
          en: "Between the plateau and the two seas run narrow flat strips, busy with ports and coconut groves. What are these strips called?",
          hi: "पठार और दोनों समुद्रों के बीच सँकरी समतल पट्टियाँ चलती हैं, बंदरगाहों और नारियल-कुंजों से गुलज़ार। इन पट्टियों को क्या कहते हैं?",
          mr: "पठार आणि दोन समुद्रांच्या मध्ये अरुंद सपाट पट्ट्या धावतात, बंदरे आणि नारळी-पोफळींनी गजबजलेल्या. या पट्ट्यांना काय म्हणतात?",
        },
        statement: {
          en: "The coastal plains are the flat strips between plateau and sea on both flanks — lands of ports, fisheries and coconut groves.",
          hi: "तटीय मैदान दोनों ओर पठार और समुद्र के बीच की समतल पट्टियाँ हैं — बंदरगाहों, मछली-पालन और नारियल-कुंजों की धरती।",
          mr: "किनारी मैदाने म्हणजे दोन्ही बाजूंना पठार आणि समुद्र यांमधल्या सपाट पट्ट्या — बंदरे, मासेमारी आणि नारळी-बागांची भूमी.",
        },
      },
      {
        id: "lakshadweep",
        name: { en: "Lakshadweep", hi: "लक्षद्वीप", mr: "लक्षद्वीप" },
        kind: "islands",
        prompt: {
          en: "In the Arabian Sea lie tiny islands built by CORAL — living stone raised from the sea itself. Which island group is this?",
          hi: "अरब सागर में प्रवाल से बने नन्हे द्वीप हैं — ख़ुद समुद्र से उठा जीवित पत्थर। यह कौन-सा द्वीप-समूह है?",
          mr: "अरबी समुद्रात प्रवाळांनी घडलेली इवली बेटे आहेत — स्वतः समुद्रातून उठलेला जिवंत दगड. हा कोणता द्वीपसमूह?",
        },
        statement: {
          en: "Lakshadweep's islands, in the Arabian Sea, are built of coral — the sea's own tiny builders raised them ring by ring.",
          hi: "अरब सागर के लक्षद्वीप के द्वीप प्रवाल के बने हैं — समुद्र के अपने नन्हे कारीगरों ने उन्हें छल्ला-दर-छल्ला उठाया।",
          mr: "अरबी समुद्रातली लक्षद्वीपची बेटे प्रवाळांची — समुद्राच्या स्वतःच्या इवल्या कारागिरांनी ती कडे-कडेने उभारली.",
        },
        pair: {
          left: { en: "Lakshadweep", hi: "लक्षद्वीप", mr: "लक्षद्वीप" },
          right: {
            en: "coral in the Arabian Sea",
            hi: "अरब सागर का प्रवाल",
            mr: "अरबी समुद्रातले प्रवाळ",
          },
        },
      },
      {
        id: "andaman",
        name: {
          en: "Andaman and Nicobar",
          hi: "अंडमान और निकोबार",
          mr: "अंदमान आणि निकोबार",
        },
        kind: "islands",
        prompt: {
          en: "Far out in the Bay of Bengal stretches a long chain of forested islands. Which island group is this?",
          hi: "बंगाल की खाड़ी में दूर वनों से ढके द्वीपों की लंबी माला फैली है। यह कौन-सा द्वीप-समूह है?",
          mr: "बंगालच्या उपसागरात दूरवर वनाच्छादित बेटांची लांब माळ पसरली आहे. हा कोणता द्वीपसमूह?",
        },
        statement: {
          en: "The Andaman and Nicobar islands run in a long forested chain through the Bay of Bengal — India's far southeastern outposts.",
          hi: "अंडमान-निकोबार द्वीप बंगाल की खाड़ी में वनों भरी लंबी माला में फैले हैं — भारत की सुदूर दक्षिण-पूर्वी चौकियाँ।",
          mr: "अंदमान-निकोबार बेटे बंगालच्या उपसागरात वनांनी भरलेल्या लांब माळेत पसरली आहेत — भारताची दूरची आग्नेय ठाणी.",
        },
        pair: {
          left: { en: "Andaman and Nicobar", hi: "अंडमान-निकोबार", mr: "अंदमान-निकोबार" },
          right: {
            en: "the Bay of Bengal's chain",
            hi: "बंगाल की खाड़ी की माला",
            mr: "बंगालच्या उपसागरातली माळ",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Walk India north to south and name what you cross: A-the snow wall, B-the flat river-soil, C-the old triangular tableland. Which trio is right?",
          hi: "भारत को उत्तर से दक्षिण चलिए और जो पार हो उसे नाम दीजिए: अ-बर्फ़ की दीवार, ब-समतल नदी-मिट्टी, स-पुराना तिकोना अधित्यका-प्रदेश। कौन-सी तिकड़ी सही है?",
          mr: "भारत उत्तरेकडून दक्षिणेकडे चाला आणि जे ओलांडाल त्याला नाव द्या: अ-बर्फाची भिंत, ब-सपाट नदी-माती, क-जुने त्रिकोणी पठार. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the Himalayas · B: the Northern Plains · C: the Peninsular Plateau",
            hi: "अ: हिमालय · ब: उत्तरी मैदान · स: प्रायद्वीपीय पठार",
            mr: "अ: हिमालय · ब: उत्तरेची मैदाने · क: द्वीपकल्पीय पठार",
          },
          {
            en: "A: the Peninsular Plateau · B: the Himalayas · C: the Northern Plains",
            hi: "अ: प्रायद्वीपीय पठार · ब: हिमालय · स: उत्तरी मैदान",
            mr: "अ: द्वीपकल्पीय पठार · ब: हिमालय · क: उत्तरेची मैदाने",
          },
          {
            en: "A: the Northern Plains · B: the Peninsular Plateau · C: the Himalayas",
            hi: "अ: उत्तरी मैदान · ब: प्रायद्वीपीय पठार · स: हिमालय",
            mr: "अ: उत्तरेची मैदाने · ब: द्वीपकल्पीय पठार · क: हिमालय",
          },
          {
            en: "A: the Himalayas · B: the Peninsular Plateau · C: the Northern Plains",
            hi: "अ: हिमालय · ब: प्रायद्वीपीय पठार · स: उत्तरी मैदान",
            mr: "अ: हिमालय · ब: द्वीपकल्पीय पठार · क: उत्तरेची मैदाने",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The order IS the geography: mountains first at the top, then the plains their rivers built at their feet, then the old plateau filling the peninsula. India's landforms read like a story told downhill — snow to silt to ancient stone, with the coasts and islands as the story's edges.",
          hi: "क्रम ही भूगोल है: सबसे ऊपर पहले पहाड़, फिर उनके पैरों में उनकी नदियों के बनाए मैदान, फिर प्रायद्वीप भरता पुराना पठार। भारत की भू-आकृतियाँ ढलान पर कही कहानी-सी पढ़ी जाती हैं — बर्फ़ से मिट्टी, मिट्टी से प्राचीन पत्थर, और किनारे-द्वीप कहानी के हाशिये।",
          mr: "क्रम हाच भूगोल: सर्वांत वर आधी पर्वत, मग त्यांच्या पायाशी त्यांच्याच नद्यांनी घडवलेली मैदाने, मग द्वीपकल्प भरणारे जुने पठार. भारताची भूरूपे उताराने सांगितलेल्या गोष्टीसारखी वाचली जातात — बर्फाकडून गाळ, गाळाकडून प्राचीन दगड, आणि किनारे-बेटे गोष्टीच्या कडा.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Northern Plains hold some of the thickest crowds of people on Earth, while the beautiful Himalayas just above them hold few. What settles where people gather?",
          hi: "उत्तरी मैदान धरती की सबसे घनी आबादियों में से एक ढोते हैं, जबकि ठीक ऊपर का सुंदर हिमालय थोड़े ही लोग। लोग कहाँ जुटेंगे, यह क्या तय करता है?",
          mr: "उत्तरेची मैदाने पृथ्वीवरच्या सर्वांत दाट वस्त्यांपैकी एक वाहतात, तर लगेच वरचा सुंदर हिमालय थोडीच माणसे. माणसे कुठे जमतील हे काय ठरवते?",
        },
        choices: [
          {
            en: "Livelihood — flat fertile soil, year-round rivers and easy movement feed and connect millions; steep cold rock, however grand, cannot",
            hi: "रोज़ी — समतल उपजाऊ मिट्टी, बारहमासी नदियाँ और आसान आवाजाही करोड़ों को खिलाती-जोड़ती हैं; खड़ी ठंडी चट्टान, कितनी भी भव्य हो, नहीं कर सकती",
            mr: "रोजीरोटी — सपाट सुपीक माती, बारमाही नद्या आणि सोपी ये-जा कोट्यवधींना पोसते-जोडते; उभा गार खडक, कितीही भव्य असो, ते करू शकत नाही",
          },
          {
            en: "Beauty — people settle wherever the view is finest",
            hi: "सौंदर्य — लोग वहीं बसते हैं जहाँ नज़ारा सबसे अच्छा हो",
            mr: "सौंदर्य — जिथे देखावा उत्तम तिथेच माणसे वसतात",
          },
          {
            en: "Chance — crowds simply happened to start there",
            hi: "इत्तिफ़ाक़ — भीड़ बस वहीं से शुरू हो गई",
            mr: "योगायोग — गर्दी नुसती तिथून सुरू झाली",
          },
          {
            en: "Heat — people always choose the warmest place",
            hi: "गर्मी — लोग हमेशा सबसे गर्म जगह चुनते हैं",
            mr: "उष्णता — माणसे नेहमी सर्वांत उबदार जागा निवडतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Population maps are livelihood maps. The plains offer what a family needs: soil that yields two crops, rivers that never fail, flatness that lets roads, canals and markets run. The mountains offer grandeur and little else a plough can use. People vote with their feet for food and work — which is why the crowd and the fertile silt occupy the very same patch of map.",
          hi: "आबादी के नक़्शे रोज़ी के नक़्शे हैं। मैदान वह देते हैं जो परिवार को चाहिए: दो फ़सलें देती मिट्टी, कभी न चूकती नदियाँ, वह समतलपन जिस पर सड़कें, नहरें और बाज़ार दौड़ें। पहाड़ भव्यता देते हैं और हल के काम की चीज़ थोड़ी। लोग पैरों से भोजन और काम को वोट देते हैं — इसीलिए भीड़ और उपजाऊ मिट्टी नक़्शे के एक ही टुकड़े पर बसी हैं।",
          mr: "लोकसंख्येचे नकाशे म्हणजे रोजीरोटीचे नकाशे. मैदाने कुटुंबाला हवे ते देतात: दोन पिके देणारी माती, कधी न चुकणाऱ्या नद्या, सडका-कालवे-बाजार धावतील असा सपाटपणा. पर्वत भव्यता देतात आणि नांगराच्या कामाचे थोडेच. माणसे अन्न आणि कामाला पावलांनी मत देतात — म्हणूनच गर्दी आणि सुपीक गाळ नकाशाच्या एकाच तुकड्यावर वसले आहेत.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Ganga flows full even in the driest June, while many plateau rivers thin to a trickle. What different sources stand behind the two kinds of river?",
          hi: "गंगा सबसे सूखे जून में भी भरी बहती है, जबकि पठार की कई नदियाँ धार भर रह जाती हैं। दोनों क़िस्म की नदियों के पीछे कौन-से अलग स्रोत खड़े हैं?",
          mr: "गंगा सर्वांत कोरड्या जूनमध्येही भरून वाहते, तर पठारावरच्या अनेक नद्या धारेपुरत्या उरतात. दोन प्रकारच्या नद्यांमागे कोणते वेगळे स्रोत उभे आहेत?",
        },
        choices: [
          {
            en: "The Ganga is fed by Himalayan snows that melt all summer; plateau rivers live on rain alone, so they swell and shrink with the monsoon",
            hi: "गंगा को हिमालय की बर्फ़ पालती है जो गर्मी भर पिघलती है; पठारी नदियाँ केवल बारिश पर जीती हैं, तो मानसून के साथ उफनती-सिकुड़ती हैं",
            mr: "गंगेला हिमालयाचे बर्फ पोसते जे उन्हाळाभर वितळते; पठारी नद्या केवळ पावसावर जगतात, म्हणून मोसमासोबत फुगतात-आकसतात",
          },
          {
            en: "The Ganga is simply older and so runs deeper",
            hi: "गंगा बस पुरानी है इसलिए गहरी बहती है",
            mr: "गंगा नुसती जुनी आहे म्हणून खोल वाहते",
          },
          {
            en: "Plateau rivers flow uphill part of the year",
            hi: "पठारी नदियाँ साल के कुछ समय चढ़ाई पर बहती हैं",
            mr: "पठारी नद्या वर्षातला काही काळ चढावर वाहतात",
          },
          {
            en: "The plains pull water toward themselves",
            hi: "मैदान पानी को अपनी ओर खींचते हैं",
            mr: "मैदाने पाणी आपल्याकडे ओढतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A river is only as steady as its source. Himalayan rivers hold a double account — monsoon rain PLUS a bank of snow that pays out all summer, precisely when rain fails. Plateau rivers bank on the monsoon alone, flooding in July and fasting in May. That difference decides canals, crops and cities — geography's plumbing, drawn by the mountains.",
          hi: "नदी उतनी ही स्थिर है जितना उसका स्रोत। हिमालयी नदियों का दोहरा खाता है — मानसूनी बारिश और बर्फ़ की वह जमा-पूँजी जो पूरी गर्मी चुकती है, ठीक तब जब बारिश चूकती है। पठारी नदियाँ अकेले मानसून पर टिकी हैं — जुलाई में बाढ़, मई में उपवास। यही फ़र्क़ नहरें, फ़सलें और शहर तय करता है — पहाड़ों की खींची भूगोल की नलसाज़ी।",
          mr: "नदी तिच्या स्रोताइतकीच स्थिर असते. हिमालयी नद्यांचे दुहेरी खाते — मोसमी पाऊस अधिक बर्फाची ती ठेव जी अख्खा उन्हाळा फेडते, नेमकी पाऊस चुकतो तेव्हा. पठारी नद्या एकट्या मोसमावर विसंबतात — जुलैत पूर, मेमध्ये उपास. हाच फरक कालवे, पिके आणि शहरे ठरवतो — पर्वतांनी आखलेले भूगोलाचे नळकाम.",
        },
      },
    ],
  },
];
