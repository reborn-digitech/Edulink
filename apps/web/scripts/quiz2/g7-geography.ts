/**
 * Class 7 Geography — NCERT "Our Environment", chapter by chapter, through
 * the conceptual engine. The earth-science voice deepens: layers under the
 * crust, rocks with pages, rivers that abandon their own bends. Same
 * distractor rule as everywhere — every statement must be false of every
 * other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Our Environment (Class 7)";
const LICENCE = "CC-BY-SA-4.0";

export const G7_GEOGRAPHY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Environment (the surroundings, natural and built)           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-7-environment",
    subject: "GEOGRAPHY",
    classLevel: 7,
    chapter: {
      en: "Chapter 1 — Environment",
      hi: "अध्याय 1 — पर्यावरण",
      mr: "प्रकरण 1 — पर्यावरण",
    },
    name: { en: "Environment", hi: "पर्यावरण", mr: "पर्यावरण" },
    summary: {
      en: "The surroundings that make life possible — nature's own gift and the layer we built over it, the living half and the silent stage, and the pond that teaches how everything ties to everything.",
      hi: "जीवन को संभव करने वाला परिवेश — प्रकृति की अपनी देन और उस पर हमारी चढ़ाई परत, जीवित आधा और मौन मंच, और वह तालाब जो सिखाता है कि सब कुछ सबसे जुड़ा है।",
      mr: "जीवन शक्य करणारा परिसर — निसर्गाची स्वतःची देणगी आणि तिच्यावर आम्ही चढवलेला थर, जिवंत अर्धा आणि मूक रंगमंच, आणि सारे साऱ्याशी जुळलेले आहे हे शिकवणारे तळे.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "environment",
        name: { en: "The environment", hi: "पर्यावरण", mr: "पर्यावरण" },
        kind: "whole",
        prompt: {
          en: "Everything that surrounds and sustains a living thing — land, water, air, people and other creatures. What is this surrounding whole called?",
          hi: "जो कुछ किसी जीव को घेरता और पालता है — ज़मीन, पानी, हवा, लोग और दूसरे जीव। इस घेरने वाले समग्र का नाम क्या है?",
          mr: "जे काही एखाद्या सजीवाला वेढते आणि पोसते — जमीन, पाणी, हवा, माणसे आणि इतर जीव. या वेढणाऱ्या समग्राचे नाव काय?",
        },
        statement: {
          en: "The environment is everything around us — living and non-living together, each shaping the other without pause.",
          hi: "पर्यावरण हमारे चारों ओर का सब कुछ है — जीवित और निर्जीव साथ-साथ, हर एक दूसरे को बिना रुके गढ़ता हुआ।",
          mr: "पर्यावरण म्हणजे आपल्याभोवतीचे सारे — सजीव आणि निर्जीव एकत्र, प्रत्येक दुसऱ्याला अखंड घडवत.",
        },
        pair: {
          left: {
            en: "Everything around a life",
            hi: "जीवन के गिर्द सब कुछ",
            mr: "जीवाभोवतीचे सारे",
          },
          right: {
            en: "its shaping surroundings",
            hi: "उसे गढ़ता परिवेश",
            mr: "त्याला घडवणारा परिसर",
          },
        },
      },
      {
        id: "natural-env",
        name: { en: "The natural environment", hi: "प्राकृतिक पर्यावरण", mr: "नैसर्गिक पर्यावरण" },
        kind: "layer",
        prompt: {
          en: "Mountains, rivers, air and living creatures — the surroundings no human hand made. What are they together called?",
          hi: "पहाड़, नदियाँ, हवा और जीव-जंतु — वह परिवेश जिसे किसी मानव हाथ ने नहीं बनाया। इन सबको मिलाकर क्या कहते हैं?",
          mr: "डोंगर, नद्या, हवा आणि जीवसृष्टी — कोणत्याही मानवी हाताने न घडवलेला परिसर. या साऱ्यांना मिळून काय म्हणतात?",
        },
        statement: {
          en: "The natural environment is nature's own gift — land, water, air and life, none of it manufactured by anyone.",
          hi: "प्राकृतिक पर्यावरण प्रकृति की अपनी देन है — ज़मीन, पानी, हवा और जीवन, इनमें से कुछ भी किसी का बनाया नहीं।",
          mr: "नैसर्गिक पर्यावरण ही निसर्गाची स्वतःची देणगी — जमीन, पाणी, हवा आणि जीवन, यांतले काहीही कोणी बनवलेले नाही.",
        },
        pair: {
          left: {
            en: "Surroundings no one built",
            hi: "किसी का न बनाया परिवेश",
            mr: "कोणी न बांधलेला परिसर",
          },
          right: { en: "nature's own gift", hi: "प्रकृति की अपनी देन", mr: "निसर्गाची स्वतःची देणगी" },
        },
      },
      {
        id: "human-env",
        name: {
          en: "The human-made environment",
          hi: "मानव-निर्मित पर्यावरण",
          mr: "मानवनिर्मित पर्यावरण",
        },
        kind: "layer",
        prompt: {
          en: "Roads, bridges, parks, factories and cities — which environment did people themselves build?",
          hi: "सड़कें, पुल, पार्क, कारख़ाने और शहर — कौन-सा पर्यावरण लोगों ने स्वयं खड़ा किया?",
          mr: "रस्ते, पूल, उद्याने, कारखाने आणि शहरे — कोणते पर्यावरण माणसांनी स्वतः उभे केले?",
        },
        statement: {
          en: "The human-made environment is our own construction — buildings, roads and industries layered over nature's base.",
          hi: "मानव-निर्मित पर्यावरण हमारा अपना निर्माण है — प्रकृति की नींव पर चढ़ाई इमारतें, सड़कें और उद्योग।",
          mr: "मानवनिर्मित पर्यावरण हे आपले स्वतःचे बांधकाम — निसर्गाच्या पायावर चढवलेल्या इमारती, रस्ते आणि उद्योग.",
        },
        pair: {
          left: { en: "Roads, bridges, cities", hi: "सड़कें, पुल, शहर", mr: "रस्ते, पूल, शहरे" },
          right: {
            en: "surroundings we built",
            hi: "हमारा बनाया परिवेश",
            mr: "आम्ही बांधलेला परिसर",
          },
        },
      },
      {
        id: "ecosystem",
        name: { en: "The ecosystem", hi: "पारितंत्र", mr: "परिसंस्था" },
        kind: "system",
        prompt: {
          en: "Plants, animals and their non-living home — soil, water, sunlight — working as one linked web. What is such a unit called?",
          hi: "पौधे, प्राणी और उनका निर्जीव घर — मिट्टी, पानी, धूप — एक जुड़े जाल की तरह काम करते हुए। ऐसी इकाई का नाम क्या है?",
          mr: "वनस्पती, प्राणी आणि त्यांचे निर्जीव घर — माती, पाणी, ऊन — एका जुळलेल्या जाळ्यासारखे काम करणारे. अशा एककाचे नाव काय?",
        },
        statement: {
          en: "An ecosystem is life plus its non-living home, tied in one web — a pond, a forest or a single fallen log can each be one.",
          hi: "पारितंत्र यानी जीवन और उसका निर्जीव घर, एक जाल में बँधे — एक तालाब, एक जंगल या एक गिरा हुआ लट्ठा, हर एक पारितंत्र हो सकता है।",
          mr: "परिसंस्था म्हणजे जीवन अधिक त्याचे निर्जीव घर, एका जाळ्यात बांधलेले — एक तळे, एक जंगल वा एक पडलेला ओंडका, प्रत्येक परिसंस्था असू शकते.",
        },
        detail: {
          en: "The pond is the classroom favourite: fish, weeds, mud and sunlight — pull one strand and the whole web trembles.",
          hi: "तालाब कक्षा का चहेता उदाहरण है: मछली, काई, कीचड़ और धूप — एक धागा खींचिए और पूरा जाल काँप उठता है।",
          mr: "तळे हा वर्गाचा आवडता नमुना: मासे, शेवाळ, चिखल आणि ऊन — एक धागा ओढा आणि सारे जाळे थरथरते.",
        },
        extra: {
          en: "Great or small, every one runs on the same loops — food, water, air and decay, going round.",
          hi: "बड़ा हो या छोटा, हर एक उन्हीं चक्रों पर चलता है — भोजन, पानी, हवा और सड़न, घूमते हुए।",
          mr: "मोठी असो वा लहान, प्रत्येक त्याच चक्रांवर चालते — अन्न, पाणी, हवा आणि कुजणे, फिरत राहणारे.",
        },
        pair: {
          left: { en: "The pond as one web", hi: "एक जाल के रूप में तालाब", mr: "एक जाळे म्हणून तळे" },
          right: {
            en: "life tied to its home",
            hi: "अपने घर से बँधा जीवन",
            mr: "आपल्या घराशी बांधलेले जीवन",
          },
        },
      },
      {
        id: "biotic",
        name: { en: "The biotic world", hi: "जैविक संसार", mr: "जैविक जग" },
        kind: "half",
        prompt: {
          en: "Plants, animals and microbes form which half of the environment — the living half?",
          hi: "पौधे, प्राणी और सूक्ष्मजीव पर्यावरण का कौन-सा आधा बनाते हैं — जीवित आधा?",
          mr: "वनस्पती, प्राणी आणि सूक्ष्मजीव पर्यावरणाचा कोणता अर्धा भाग बनवतात — जिवंत अर्धा?",
        },
        statement: {
          en: "The biotic world is the living half of the environment — from banyan to bacteria, everything that grows and breathes.",
          hi: "जैविक संसार पर्यावरण का जीवित आधा है — बरगद से जीवाणु तक, जो कुछ उगता और साँस लेता है।",
          mr: "जैविक जग हा पर्यावरणाचा जिवंत अर्धा — वडापासून जीवाणूपर्यंत, जे काही वाढते आणि श्वास घेते.",
        },
        pair: {
          left: { en: "The living half", hi: "जीवित आधा", mr: "जिवंत अर्धा" },
          right: {
            en: "all that grows and breathes",
            hi: "जो उगता-साँस लेता सब",
            mr: "वाढणारे-श्वास घेणारे सारे",
          },
        },
      },
      {
        id: "abiotic",
        name: { en: "The abiotic world", hi: "अजैविक संसार", mr: "अजैविक जग" },
        kind: "half",
        prompt: {
          en: "Land, water, air and sunlight form which half of the environment — the never-alive half?",
          hi: "ज़मीन, पानी, हवा और धूप पर्यावरण का कौन-सा आधा बनाते हैं — कभी-न-जीवित आधा?",
          mr: "जमीन, पाणी, हवा आणि ऊन पर्यावरणाचा कोणता अर्धा भाग बनवतात — कधीही-न-जिवंत अर्धा?",
        },
        statement: {
          en: "The abiotic world is the non-living half — rock, river, air and light: the stage on which all life plays.",
          hi: "अजैविक संसार निर्जीव आधा है — चट्टान, नदी, हवा और रोशनी: वह मंच जिस पर सारा जीवन खेलता है।",
          mr: "अजैविक जग हा निर्जीव अर्धा — खडक, नदी, हवा आणि प्रकाश: ज्यावर सारे जीवन खेळते तो रंगमंच.",
        },
        pair: {
          left: { en: "The never-alive half", hi: "कभी-न-जीवित आधा", mr: "कधीही-न-जिवंत अर्धा" },
          right: { en: "life's silent stage", hi: "जीवन का मौन मंच", mr: "जीवनाचा मूक रंगमंच" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Which list holds ONLY members of the natural environment?",
          hi: "किस सूची में केवल प्राकृतिक पर्यावरण के सदस्य हैं?",
          mr: "कोणत्या यादीत फक्त नैसर्गिक पर्यावरणाचे सदस्य आहेत?",
        },
        choices: [
          {
            en: "A river · the monsoon wind · a herd of deer",
            hi: "नदी · मानसूनी हवा · हिरनों का झुंड",
            mr: "नदी · मोसमी वारा · हरणांचा कळप",
          },
          {
            en: "A river · a canal · a herd of deer",
            hi: "नदी · नहर · हिरनों का झुंड",
            mr: "नदी · कालवा · हरणांचा कळप",
          },
          {
            en: "The monsoon wind · a park lawn · a mountain",
            hi: "मानसूनी हवा · पार्क की घास · पहाड़",
            mr: "मोसमी वारा · उद्यानातली हिरवळ · डोंगर",
          },
          {
            en: "A herd of deer · a bridge · the sea",
            hi: "हिरनों का झुंड · पुल · समुद्र",
            mr: "हरणांचा कळप · पूल · समुद्र",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Ask of each member: did anyone build it? River, wind and deer answer no — pure nature. The other lists each hide one human fingerprint: a canal is a river with an engineer, a park lawn is grass with a gardener, a bridge never grew anywhere. The sorting is about ORIGIN, not appearance.",
          hi: "हर सदस्य से पूछिए: क्या इसे किसी ने बनाया? नदी, हवा और हिरन कहते हैं नहीं — शुद्ध प्रकृति। बाक़ी सूचियों में एक-एक मानवी छाप छिपी है: नहर इंजीनियर वाली नदी है, पार्क की घास माली वाली घास, और पुल कहीं उगा नहीं। छँटाई मूल की है, शक्ल की नहीं।",
          mr: "प्रत्येक सदस्याला विचारा: हे कोणी बांधले का? नदी, वारा आणि हरीण म्हणतात नाही — शुद्ध निसर्ग. बाकी याद्यांत एक-एक मानवी ठसा लपला आहे: कालवा म्हणजे अभियंता असलेली नदी, उद्यानाची हिरवळ म्हणजे माळी असलेले गवत, आणि पूल कुठेही उगवला नाही. निवड मुळाची आहे, रूपाची नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A city child shrugs: 'My whole environment is human-made — nature has nothing to do with my life.' What has the child not noticed?",
          hi: "शहर का एक बच्चा कंधे उचकाता है: 'मेरा पूरा पर्यावरण मानव-निर्मित है — प्रकृति का मेरे जीवन से कोई लेना-देना नहीं।' बच्चे ने क्या नहीं देखा?",
          mr: "शहरातले एक मूल खांदे उडवते: 'माझे सारे पर्यावरण मानवनिर्मित — निसर्गाचा माझ्या जीवनाशी संबंधच नाही.' मुलाने काय पाहिलेले नाही?",
        },
        choices: [
          {
            en: "The built layer stands ON nature: the tap's water is a river's, the plate's food is soil's, every breath is the air's — cut the base and the layer falls",
            hi: "बनाई परत प्रकृति पर ही खड़ी है: नल का पानी नदी का है, थाली का भोजन मिट्टी का, हर साँस हवा की — नींव काटिए और परत गिर पड़े",
            mr: "बांधलेला थर निसर्गावरच उभा आहे: नळाचे पाणी नदीचे, ताटातले अन्न मातीचे, प्रत्येक श्वास हवेचा — पाया कापा आणि थर कोसळेल",
          },
          {
            en: "Cities genuinely need nothing from nature once built",
            hi: "बन जाने पर शहरों को सचमुच प्रकृति से कुछ नहीं चाहिए",
            mr: "बांधून झाल्यावर शहरांना खरेच निसर्गाकडून काही लागत नाही",
          },
          {
            en: "The child is right, since parks are artificial anyway",
            hi: "बच्चा सही है, क्योंकि पार्क तो वैसे भी बनावटी हैं",
            mr: "मूल बरोबर आहे, कारण उद्याने तशीही कृत्रिमच",
          },
          {
            en: "Nature exists only in villages, not in cities",
            hi: "प्रकृति केवल गाँवों में है, शहरों में नहीं",
            mr: "निसर्ग फक्त खेड्यांत असतो, शहरांत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The human-made environment is a layer, not a replacement. Trace anything in the child's day to its source — water, food, air, the bricks themselves — and the trail ends in a river, a field, the sky, the earth. The built world processes nature; it cannot manufacture it. That dependence, invisible on a normal day, is exactly what droughts and smog make visible.",
          hi: "मानव-निर्मित पर्यावरण परत है, विकल्प नहीं। बच्चे के दिन की किसी भी चीज़ का सिरा पकड़िए — पानी, भोजन, हवा, ख़ुद ईंटें — और डोर नदी, खेत, आसमान, धरती पर जाकर ख़त्म होती है। बना हुआ संसार प्रकृति को सँवारता है; उसे गढ़ नहीं सकता। यही निर्भरता, जो आम दिन अदृश्य रहती है, सूखा और धुँआसा ठीक उसी को दिखा देते हैं।",
          mr: "मानवनिर्मित पर्यावरण हा थर आहे, पर्याय नाही. मुलाच्या दिवसातल्या कोणत्याही गोष्टीचा माग काढा — पाणी, अन्न, हवा, खुद्द विटा — आणि दोर नदी, शेत, आकाश, पृथ्वीवर संपतो. बांधलेले जग निसर्गावर प्रक्रिया करते; त्याला घडवू शकत नाही. हीच अवलंबितता, जी नेहमीच्या दिवशी अदृश्य असते, दुष्काळ आणि धुरके नेमकी तीच दाखवतात.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Inside Our Earth (layers down, and the three rock tribes)   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-7-inside-our-earth",
    subject: "GEOGRAPHY",
    classLevel: 7,
    chapter: {
      en: "Chapter 2 — Inside Our Earth",
      hi: "अध्याय 2 — हमारी पृथ्वी के अंदर",
      mr: "प्रकरण 2 — आपल्या पृथ्वीच्या अंतरंगात",
    },
    name: {
      en: "Inside Our Earth",
      hi: "हमारी पृथ्वी के अंदर",
      mr: "आपल्या पृथ्वीच्या अंतरंगात",
    },
    summary: {
      en: "Down through the skin, the stirring middle and the metal heart — then the three rock tribes: fire-born, pressed in pages, and remade under heat, all riding one endless cycle.",
      hi: "त्वचा से उतरते हुए, हिलते बीच और धातु के हृदय तक — फिर चट्टानों के तीन कुनबे: आग-जने, परतों में दबे, और ताप में ढले — सब एक अंतहीन चक्र पर सवार।",
      mr: "त्वचेतून उतरत, ढवळणाऱ्या मध्यापर्यंत आणि धातूच्या हृदयापर्यंत — मग खडकांच्या तीन जमाती: अग्निजन्य, थरांत दाबलेल्या, आणि उष्णतेत घडवलेल्या — साऱ्या एका अखंड चक्रावर स्वार.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "crust",
        name: { en: "The crust", hi: "भूपर्पटी", mr: "भूकवच" },
        kind: "layer",
        prompt: {
          en: "On which thinnest, outermost layer of the Earth do we live, farm and build?",
          hi: "पृथ्वी की किस सबसे पतली, सबसे बाहरी परत पर हम रहते, खेती करते और बनाते हैं?",
          mr: "पृथ्वीच्या कोणत्या सर्वांत पातळ, सर्वांत बाहेरच्या थरावर आपण राहतो, शेती करतो आणि बांधतो?",
        },
        statement: {
          en: "The crust is the Earth's thin outer skin — the deepest mines and drills barely scratch its surface.",
          hi: "भूपर्पटी पृथ्वी की पतली बाहरी त्वचा है — गहरी से गहरी खदानें और छेद उसे बस खुरचते भर हैं।",
          mr: "भूकवच ही पृथ्वीची पातळ बाह्य त्वचा — खोलात खोल खाणी आणि छिद्रे तिला जेमतेम खरवडतात.",
        },
        pair: {
          left: { en: "The Earth's skin", hi: "पृथ्वी की त्वचा", mr: "पृथ्वीची त्वचा" },
          right: {
            en: "thinnest of the layers",
            hi: "परतों में सबसे पतली",
            mr: "थरांतली सर्वांत पातळ",
          },
        },
      },
      {
        id: "mantle",
        name: { en: "The mantle", hi: "मैंटल (प्रावार)", mr: "प्रावरण (मॅन्टल)" },
        kind: "layer",
        prompt: {
          en: "Below the crust lies which thick middle layer, where hot molten rock slowly stirs?",
          hi: "भूपर्पटी के नीचे कौन-सी मोटी बीच की परत है, जहाँ गर्म पिघली चट्टान धीरे-धीरे हिलती रहती है?",
          mr: "भूकवचाखाली कोणता जाड मधला थर आहे, जिथे गरम वितळलेला खडक हळूहळू ढवळत असतो?",
        },
        statement: {
          en: "The mantle is the hot middle layer — magma stirs there, waiting to rise wherever the crust cracks open.",
          hi: "मैंटल गर्म बीच की परत है — मैग्मा वहीं मथता रहता है, जहाँ भी भूपर्पटी चटके वहाँ चढ़ने को तैयार।",
          mr: "प्रावरण हा गरम मधला थर — मॅग्मा तिथे ढवळत राहतो, भूकवच जिथे तडकेल तिथे चढायला तयार.",
        },
        pair: {
          left: { en: "The middle layer", hi: "बीच की परत", mr: "मधला थर" },
          right: {
            en: "hot rock, slowly stirring",
            hi: "धीरे मथती गर्म चट्टान",
            mr: "हळू ढवळणारा गरम खडक",
          },
        },
      },
      {
        id: "core",
        name: { en: "The core", hi: "क्रोड", mr: "गाभा" },
        kind: "layer",
        prompt: {
          en: "Which deepest layer, mainly nickel and iron, sits at the very centre of the Earth?",
          hi: "मुख्यतः निकल और लोहे की कौन-सी सबसे गहरी परत पृथ्वी के ठीक केंद्र में बैठी है?",
          mr: "मुख्यतः निकेल आणि लोखंडाचा कोणता सर्वांत खोल थर पृथ्वीच्या नेमक्या केंद्रात बसला आहे?",
        },
        statement: {
          en: "The core is the Earth's metal heart — nickel and iron, crushingly deep and fiercely hot.",
          hi: "क्रोड पृथ्वी का धातु-हृदय है — निकल और लोहा, कुचल देने वाली गहराई और प्रचंड ताप।",
          mr: "गाभा हे पृथ्वीचे धातू-हृदय — निकेल आणि लोखंड, चिरडणारी खोली आणि प्रखर ताप.",
        },
        detail: {
          en: "Its nickname 'nife' is chemistry shorthand — Ni for nickel, Fe for iron.",
          hi: "उसका उपनाम 'नाइफ़' रसायन का शॉर्टहैंड है — निकल का Ni, लोहे का Fe।",
          mr: "त्याचे टोपणनाव 'नायफे' ही रसायनाची लघुलिपी — निकेलचे Ni, लोखंडाचे Fe.",
        },
        extra: {
          en: "No drill has come remotely close — we know it by listening to earthquake waves ring through it.",
          hi: "कोई छेद उसके पास तक नहीं फटका — हम उसे भूकंपी तरंगों की गूँज सुनकर जानते हैं।",
          mr: "कोणतेही छिद्र त्याच्या जवळपासही गेले नाही — भूकंपलहरींचा त्याच्यातून येणारा नाद ऐकून आपण त्याला ओळखतो.",
        },
        pair: {
          left: { en: "The metal heart", hi: "धातु का हृदय", mr: "धातूचे हृदय" },
          right: {
            en: "nickel and iron, 'nife'",
            hi: "निकल और लोहा, 'नाइफ़'",
            mr: "निकेल आणि लोखंड, 'नायफे'",
          },
        },
      },
      {
        id: "igneous",
        name: { en: "Igneous rock", hi: "आग्नेय चट्टान", mr: "अग्निजन्य खडक" },
        kind: "rock",
        prompt: {
          en: "When molten magma cools and hardens, which 'fire-born' family of rock forms — basalt and granite among them?",
          hi: "पिघला मैग्मा ठंडा होकर जमता है तो चट्टानों का कौन-सा 'आग-जना' कुनबा बनता है — जिसमें बेसाल्ट और ग्रेनाइट शामिल हैं?",
          mr: "वितळलेला मॅग्मा निवून घट्ट होतो तेव्हा खडकांची कोणती 'अग्निजन्य' जमात बनते — जिच्यात बेसाल्ट आणि ग्रॅनाइट आहेत?",
        },
        statement: {
          en: "Igneous rocks are fire-born — cooled magma or lava, granite and basalt among them: the primary rocks, first of all families.",
          hi: "आग्नेय चट्टानें आग-जनी हैं — ठंडा हुआ मैग्मा या लावा, ग्रेनाइट-बेसाल्ट उन्हीं में: प्राथमिक चट्टानें, सब कुनबों में पहली।",
          mr: "अग्निजन्य खडक आगीतून जन्मले — निवलेला मॅग्मा वा लाव्हा, ग्रॅनाइट-बेसाल्ट त्यांतलेच: प्राथमिक खडक, साऱ्या जमातींत पहिले.",
        },
        detail: {
          en: "The Deccan's black cotton soil is weathered basalt — an ancient lava field turned farmland.",
          hi: "दक्कन की काली कपास-मिट्टी घिसा हुआ बेसाल्ट है — प्राचीन लावा-मैदान जो खेत बन गया।",
          mr: "दख्खनची काळी कापूस-माती म्हणजे झिजलेला बेसाल्ट — प्राचीन लाव्हा-मैदान शेत झालेले.",
        },
        extra: {
          en: "They are called primary rocks — the first-formed, parents of the other two families.",
          hi: "इन्हें प्राथमिक चट्टानें कहते हैं — पहले बनीं, बाक़ी दोनों कुनबों की जननी।",
          mr: "यांना प्राथमिक खडक म्हणतात — आधी बनलेले, बाकी दोन जमातींचे जनक.",
        },
        pair: {
          left: { en: "Cooled molten rock", hi: "ठंडी हुई पिघली चट्टान", mr: "निवलेला वितळखडक" },
          right: {
            en: "the fire-born family",
            hi: "आग-जना कुनबा",
            mr: "अग्निजन्य जमात",
          },
        },
      },
      {
        id: "sedimentary",
        name: { en: "Sedimentary rock", hi: "अवसादी चट्टान", mr: "गाळाचा खडक" },
        kind: "rock",
        prompt: {
          en: "Layer upon layer of pressed sand, mud and pebbles hardens into which family of rock — sandstone among them?",
          hi: "दबी रेत, कीचड़ और कंकड़ की परत-दर-परत जमकर चट्टानों का कौन-सा कुनबा बनती है — जिसमें बलुआ पत्थर है?",
          mr: "दाबलेल्या वाळू, चिखल आणि खड्यांचा थरावर थर घट्ट होऊन खडकांची कोणती जमात बनते — जिच्यात वाळूचा दगड आहे?",
        },
        statement: {
          en: "Sedimentary rocks are pressed layers of loose material — sandstone from sand, with sometimes a fossil kept between the pages.",
          hi: "अवसादी चट्टानें ढीले मलबे की दबी परतें हैं — रेत से बलुआ पत्थर, और कभी-कभी पन्नों के बीच सहेजा एक जीवाश्म।",
          mr: "गाळाचे खडक म्हणजे सैल मालाचे दाबलेले थर — वाळूतून वाळूचा दगड, आणि कधी पानांमध्ये जपलेला एखादा जीवाश्म.",
        },
        detail: {
          en: "Fossils are their speciality — only gentle layering can keep a leaf or a shell for crores of years.",
          hi: "जीवाश्म इनकी ख़ासियत हैं — कोमल परत-चढ़ाई ही पत्ती या सीपी को करोड़ों वर्ष सँभाल सकती है।",
          mr: "जीवाश्म ही यांची खासियत — हळुवार थर-रचनाच पान वा शिंपला कोट्यवधी वर्षे जपू शकते.",
        },
        extra: {
          en: "Read them like a book — each layer is a page laid down upon the one before.",
          hi: "इन्हें किताब की तरह पढ़िए — हर परत पिछली पर रखा एक पन्ना है।",
          mr: "यांना पुस्तकासारखे वाचा — प्रत्येक थर म्हणजे आधीच्यावर ठेवलेले एक पान.",
        },
        pair: {
          left: {
            en: "Pressed layers of sand",
            hi: "दबी रेत की परतें",
            mr: "दाबलेले वाळूचे थर",
          },
          right: { en: "rock with pages", hi: "पन्नों वाली चट्टान", mr: "पाने असलेला खडक" },
        },
      },
      {
        id: "metamorphic",
        name: { en: "Metamorphic rock", hi: "कायांतरित चट्टान", mr: "रूपांतरित खडक" },
        kind: "rock",
        prompt: {
          en: "Heat and pressure remake old rock into which changed family — limestone into marble, clay into slate?",
          hi: "ताप और दाब पुरानी चट्टान को किस बदले हुए कुनबे में ढाल देते हैं — चूना-पत्थर से संगमरमर, चिकनी मिट्टी से स्लेट?",
          mr: "ताप आणि दाब जुन्या खडकाला कोणत्या बदललेल्या जमातीत घडवतात — चुनखडीतून संगमरवर, मातीतून पाटीचा दगड?",
        },
        statement: {
          en: "Metamorphic rocks are remade under heat and pressure — limestone turns to marble, clay to slate: old stone, new nature.",
          hi: "कायांतरित चट्टानें ताप-दाब में फिर गढ़ी गई हैं — चूना-पत्थर संगमरमर बना, चिकनी मिट्टी स्लेट: पुराना पत्थर, नया स्वभाव।",
          mr: "रूपांतरित खडक ताप-दाबाखाली पुन्हा घडले — चुनखडीचा संगमरवर, मातीचा पाटीचा दगड: जुना दगड, नवा स्वभाव.",
        },
        pair: {
          left: { en: "Rock remade by heat", hi: "ताप में फिर गढ़ी चट्टान", mr: "तापाने पुन्हा घडलेला खडक" },
          right: {
            en: "limestone gone marble",
            hi: "संगमरमर बना चूना-पत्थर",
            mr: "संगमरवर झालेली चुनखडी",
          },
        },
      },
      {
        id: "rock-cycle",
        name: { en: "The rock cycle", hi: "शैल चक्र", mr: "खडक चक्र" },
        kind: "cycle",
        prompt: {
          en: "Igneous weathers to sediment, sediment hardens to rock, rock remelts to magma — which endless loop is this?",
          hi: "आग्नेय घिसकर अवसाद, अवसाद जमकर चट्टान, चट्टान पिघलकर फिर मैग्मा — यह कौन-सा अंतहीन चक्कर है?",
          mr: "अग्निजन्य झिजून गाळ, गाळ घट्ट होऊन खडक, खडक वितळून पुन्हा मॅग्मा — हे कोणते अखंड चक्र?",
        },
        statement: {
          en: "The rock cycle turns each family into the others across ages — no rock keeps its form forever.",
          hi: "शैल चक्र युगों में हर कुनबे को दूसरों में बदलता रहता है — कोई चट्टान सदा अपना रूप नहीं रखती।",
          mr: "खडक चक्र युगानुयुगे प्रत्येक जमातीला इतरांत बदलत राहते — कोणताही खडक कायम आपले रूप राखत नाही.",
        },
        pair: {
          left: { en: "The endless remaking", hi: "अंतहीन फिर-गढ़ाई", mr: "अखंड पुनर्घडण" },
          right: { en: "no rock forever", hi: "कोई चट्टान सदा नहीं", mr: "कोणताही खडक कायमचा नाही" },
        },
      },
      {
        id: "minerals7",
        name: { en: "Minerals", hi: "खनिज", mr: "खनिजे" },
        kind: "substance",
        prompt: {
          en: "Rocks are built of which naturally occurring substances — mined as ores of iron, gold and more?",
          hi: "चट्टानें किन प्राकृतिक पदार्थों से बनी हैं — जो लोहे, सोने वग़ैरह के अयस्क बनकर खोदे जाते हैं?",
          mr: "खडक कोणत्या नैसर्गिक पदार्थांनी बनले आहेत — जे लोखंड, सोने वगैरेंची धातुके म्हणून खणले जातात?",
        },
        statement: {
          en: "Minerals are the natural substances rocks are made of — ores of metal, fuels and gems all count among them.",
          hi: "खनिज वे प्राकृतिक पदार्थ हैं जिनसे चट्टानें बनी हैं — धातुओं के अयस्क, ईंधन और रत्न सब इन्हीं में गिने जाते हैं।",
          mr: "खनिजे म्हणजे खडक ज्यांनी बनले ते नैसर्गिक पदार्थ — धातूंची धातुके, इंधने आणि रत्ने सारी यांतच मोजली जातात.",
        },
        pair: {
          left: { en: "The rock's ingredients", hi: "चट्टान की सामग्री", mr: "खडकाचे घटक" },
          right: { en: "mined and prized", hi: "खोदे और सराहे गए", mr: "खणलेले आणि मोलाचे" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Walk one rock round the cycle, starting from magma. Which order is right?",
          hi: "मैग्मा से शुरू कर एक चट्टान को चक्र में घुमाइए। कौन-सा क्रम सही है?",
          mr: "मॅग्मापासून सुरुवात करून एक खडक चक्रात फिरवा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Magma cools to igneous → weathers into sediment → presses into sedimentary → heat and pressure make it metamorphic → remelts to magma",
            hi: "मैग्मा ठंडा होकर आग्नेय → घिसकर अवसाद → दबकर अवसादी → ताप-दाब से कायांतरित → पिघलकर फिर मैग्मा",
            mr: "मॅग्मा निवून अग्निजन्य → झिजून गाळ → दाबून गाळाचा → ताप-दाबाने रूपांतरित → वितळून पुन्हा मॅग्मा",
          },
          {
            en: "Magma → sedimentary → igneous → sediment → metamorphic",
            hi: "मैग्मा → अवसादी → आग्नेय → अवसाद → कायांतरित",
            mr: "मॅग्मा → गाळाचा → अग्निजन्य → गाळ → रूपांतरित",
          },
          {
            en: "Magma → metamorphic → sediment → igneous → sedimentary",
            hi: "मैग्मा → कायांतरित → अवसाद → आग्नेय → अवसादी",
            mr: "मॅग्मा → रूपांतरित → गाळ → अग्निजन्य → गाळाचा",
          },
          {
            en: "Magma cools to sediment → hardens to igneous → weathers to metamorphic → remelts",
            hi: "मैग्मा ठंडा होकर अवसाद → जमकर आग्नेय → घिसकर कायांतरित → फिर पिघलता है",
            mr: "मॅग्मा निवून गाळ → घट्ट होऊन अग्निजन्य → झिजून रूपांतरित → पुन्हा वितळतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each step follows its own physics: cooling makes igneous, weathering makes loose sediment, pressing makes sedimentary, deep heat and squeeze make metamorphic, and full melting returns everything to magma. The cycle has no first rock and no last — only stations, visited in any age, in this order.",
          hi: "हर क़दम की अपनी भौतिकी है: ठंडा होना आग्नेय बनाता है, घिसाव ढीला अवसाद, दबाव अवसादी, गहरा ताप-निचोड़ कायांतरित, और पूरा पिघलना सबको मैग्मा लौटा देता है। चक्र में न पहली चट्टान है न आख़िरी — केवल पड़ाव हैं, किसी भी युग में, इसी क्रम से।",
          mr: "प्रत्येक पावलाचे स्वतःचे भौतिकशास्त्र: निवणे अग्निजन्य बनवते, झीज सैल गाळ, दाब गाळाचा खडक, खोल ताप-पिळवणूक रूपांतरित, आणि पूर्ण वितळणे साऱ्यांना मॅग्मा परत करते. चक्रात पहिला खडक नाही की शेवटचा — फक्त स्थानके, कोणत्याही युगात, याच क्रमाने.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Fossils of leaves and shells turn up in sedimentary rock but almost never in igneous rock. What explains the missing fossils?",
          hi: "पत्तियों और सीपियों के जीवाश्म अवसादी चट्टानों में मिलते हैं पर आग्नेय में लगभग कभी नहीं। ग़ायब जीवाश्मों की व्याख्या क्या है?",
          mr: "पाने आणि शिंपल्यांचे जीवाश्म गाळाच्या खडकांत सापडतात पण अग्निजन्यात जवळजवळ कधीच नाहीत. गायब जीवाश्मांचे स्पष्टीकरण काय?",
        },
        choices: [
          {
            en: "Igneous rock is born molten — any remains are burnt away before it hardens, while sediment buries remains gently and keeps them",
            hi: "आग्नेय चट्टान पिघली पैदा होती है — जमने से पहले कोई भी अवशेष जलकर मिट जाता है, जबकि अवसाद अवशेषों को कोमलता से दबाकर सहेज लेता है",
            mr: "अग्निजन्य खडक वितळलेला जन्मतो — घट्ट होण्याआधी कोणतेही अवशेष जळून जातात, तर गाळ अवशेषांना हळुवार पुरून जपतो",
          },
          {
            en: "Ancient creatures simply avoided volcanic regions",
            hi: "प्राचीन जीव ज्वालामुखी इलाक़ों से बस बचते रहते थे",
            mr: "प्राचीन जीव ज्वालामुखी भागांना नुसते टाळत असत",
          },
          {
            en: "Fossils dissolve in granite over time",
            hi: "जीवाश्म समय के साथ ग्रेनाइट में घुल जाते हैं",
            mr: "जीवाश्म काळानुसार ग्रॅनाइटमध्ये विरघळतात",
          },
          {
            en: "Igneous rocks are too young to hold fossils",
            hi: "आग्नेय चट्टानें जीवाश्म रखने के लिए बहुत नई हैं",
            mr: "अग्निजन्य खडक जीवाश्म ठेवण्यास फारच तरुण आहेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A fossil needs two favours: a quick burial and an undisturbed bed. Sediment grants both — mud settles softly over a shell and presses slowly for ages. Magma grants neither: at over a thousand degrees, leaf and shell are ash before the rock exists. So the fossil record is written almost entirely in one family's handwriting — and geologists hunting for ancient life read sedimentary pages first.",
          hi: "जीवाश्म को दो मेहरबानियाँ चाहिए: जल्दी दफ़न और अनछुई सेज। अवसाद दोनों देता है — कीचड़ सीपी पर कोमलता से बैठता है और युगों तक धीरे-धीरे दबाता है। मैग्मा दोनों में से कुछ नहीं देता: हज़ार डिग्री से ऊपर, पत्ती और सीपी चट्टान बनने से पहले ही राख हैं। इसलिए जीवाश्म-अभिलेख लगभग पूरा एक ही कुनबे की लिखावट में है — और प्राचीन जीवन खोजते भूविज्ञानी पहले अवसादी पन्ने पढ़ते हैं।",
          mr: "जीवाश्माला दोन मेहेरबान्या लागतात: झटपट दफन आणि अस्पर्श शय्या. गाळ दोन्ही देतो — चिखल शिंपल्यावर हळुवार बसतो आणि युगे हळूहळू दाबतो. मॅग्मा दोन्हींतले काहीच देत नाही: हजार अंशांवर, पान आणि शिंपला खडक बनण्याआधीच राख. म्हणून जीवाश्म-दप्तर जवळजवळ पूर्ण एकाच जमातीच्या हस्ताक्षरात — आणि प्राचीन जीवन शोधणारे भूवैज्ञानिक आधी गाळाची पाने वाचतात.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Our Changing Earth (the sculptors of the surface)           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-7-our-changing-earth",
    subject: "GEOGRAPHY",
    classLevel: 7,
    chapter: {
      en: "Chapter 3 — Our Changing Earth",
      hi: "अध्याय 3 — हमारी बदलती पृथ्वी",
      mr: "प्रकरण 3 — आपली बदलती पृथ्वी",
    },
    name: {
      en: "Our Changing Earth",
      hi: "हमारी बदलती पृथ्वी",
      mr: "आपली बदलती पृथ्वी",
    },
    summary: {
      en: "The surface never sits still: rock broken in place and carried away, rivers that plunge, loop and let go, wind heaping hills, ice grinding valleys, waves carving cave, arch and stack.",
      hi: "सतह कभी स्थिर नहीं बैठती: जगह पर टूटती और बहा ले जाई जाती चट्टान, गिरती-घूमती-छोड़ती नदियाँ, टीले उठाती हवा, घाटियाँ घिसती बर्फ़, गुफा-मेहराब-स्तंभ तराशती लहरें।",
      mr: "पृष्ठभाग कधी स्थिर बसत नाही: जागीच फुटणारा आणि वाहून नेला जाणारा खडक, कोसळणाऱ्या-वळणाऱ्या-सोडून देणाऱ्या नद्या, टेकड्या रचणारा वारा, दऱ्या घासणारे हिम, गुहा-कमान-स्तंभ कोरणाऱ्या लाटा.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "weathering",
        name: { en: "Weathering", hi: "अपक्षय", mr: "विदारण" },
        kind: "process",
        prompt: {
          en: "Sun, frost, rain and roots slowly break rock IN PLACE, without carrying it anywhere. What is this breaking called?",
          hi: "धूप, पाला, बारिश और जड़ें चट्टान को उसकी जगह पर ही धीरे-धीरे तोड़ती हैं, कहीं ले जाए बिना। इस तोड़ने का नाम क्या है?",
          mr: "ऊन, हिम, पाऊस आणि मुळे खडकाला जागीच हळूहळू फोडतात, कुठेही न नेता. या फोडण्याचे नाव काय?",
        },
        statement: {
          en: "Weathering breaks rock where it stands — heat cracks it, frost wedges it, roots pry it, and the pieces stay home.",
          hi: "अपक्षय चट्टान को वहीं तोड़ता है जहाँ वह खड़ी है — गर्मी चटकाती है, पाला फाड़ता है, जड़ें उचकाती हैं, और टुकड़े घर पर ही रहते हैं।",
          mr: "विदारण खडकाला तो उभा आहे तिथेच फोडते — ऊन तडकवते, हिम फाकवते, मुळे उचकटतात, आणि तुकडे घरीच राहतात.",
        },
        pair: {
          left: { en: "Rock broken in place", hi: "जगह पर टूटी चट्टान", mr: "जागीच फुटलेला खडक" },
          right: {
            en: "sun, frost and roots at work",
            hi: "धूप, पाले और जड़ों का काम",
            mr: "ऊन, हिम आणि मुळांचे काम",
          },
        },
      },
      {
        id: "erosion",
        name: { en: "Erosion", hi: "अपरदन", mr: "झीज (अपक्षरण)" },
        kind: "process",
        prompt: {
          en: "Rivers, wind, ice and the sea wear the land down and CARRY the pieces away. What is this wearing-and-carrying called?",
          hi: "नदियाँ, हवा, बर्फ़ और समुद्र ज़मीन को घिसते हैं और टुकड़ों को बहा ले जाते हैं। इस घिसाई-ढुलाई का नाम क्या है?",
          mr: "नद्या, वारा, हिम आणि समुद्र जमिनीला झिजवतात आणि तुकडे वाहून नेतात. या झिजवण्या-वाहण्याचे नाव काय?",
        },
        statement: {
          en: "Erosion wears the land and carries it off — a sculptor whose chisels are water, wind and ice.",
          hi: "अपरदन ज़मीन को घिसकर बहा ले जाता है — वह मूर्तिकार जिसकी छेनियाँ पानी, हवा और बर्फ़ हैं।",
          mr: "झीज जमिनीला झिजवून वाहून नेते — ज्याच्या छिन्न्या पाणी, वारा आणि हिम आहेत असा शिल्पकार.",
        },
        pair: {
          left: {
            en: "Land worn and carried",
            hi: "घिसी और ढोई गई ज़मीन",
            mr: "झिजलेली आणि वाहिलेली जमीन",
          },
          right: { en: "the moving sculptor", hi: "चलता मूर्तिकार", mr: "फिरता शिल्पकार" },
        },
      },
      {
        id: "waterfall",
        name: { en: "The waterfall", hi: "जलप्रपात", mr: "धबधबा" },
        kind: "landform",
        prompt: {
          en: "Where a river plunges over a step of hard rock, which roaring landform is born?",
          hi: "जहाँ नदी कठोर चट्टान की सीढ़ी से कूदती है, वहाँ कौन-सी गरजती भू-आकृति जन्मती है?",
          mr: "जिथे नदी कठीण खडकाच्या पायरीवरून झेपावते, तिथे कोणते गर्जणारे भूरूप जन्मते?",
        },
        statement: {
          en: "A waterfall is the river's plunge over resistant rock — the hard step survives while the softer rock below keeps retreating.",
          hi: "जलप्रपात नदी की कठोर चट्टान से छलाँग है — कड़ी सीढ़ी टिकी रहती है जबकि नीचे की नरम चट्टान पीछे हटती जाती है।",
          mr: "धबधबा म्हणजे नदीची प्रतिरोधक खडकावरून झेप — कठीण पायरी टिकते तर खालचा मऊ खडक मागे हटत राहतो.",
        },
        pair: {
          left: { en: "The river's plunge", hi: "नदी की छलाँग", mr: "नदीची झेप" },
          right: { en: "a step of hard rock", hi: "कठोर चट्टान की सीढ़ी", mr: "कठीण खडकाची पायरी" },
        },
      },
      {
        id: "oxbow",
        name: { en: "The ox-bow lake", hi: "चापाकार झील", mr: "नालाकृती सरोवर" },
        kind: "landform",
        prompt: {
          en: "A looping river pinches off one of its own exaggerated bends, leaving which crescent of still water beside its new course?",
          hi: "घुमावदार नदी अपना ही बढ़ा-चढ़ा मोड़ काट देती है, नई राह के बग़ल में ठहरे पानी का कौन-सा चाँद-टुकड़ा छोड़ती हुई?",
          mr: "वळणदार नदी आपलेच फुगलेले वळण कापून टाकते, नव्या वाटेशेजारी स्थिर पाण्याची कोणती चंद्रकोर ठेवत?",
        },
        statement: {
          en: "An ox-bow lake is a cast-off meander — the river straightens its path and abandons the loop to stillness.",
          hi: "चापाकार झील त्यागा हुआ विसर्प है — नदी अपनी राह सीधी कर मोड़ को ठहराव के हवाले कर देती है।",
          mr: "नालाकृती सरोवर म्हणजे टाकून दिलेले वळण — नदी आपली वाट सरळ करून वळणाला स्थिरतेच्या हवाली करते.",
        },
        detail: {
          en: "In flood plains the Ganga's abandoned loops lie scattered like discarded bangles.",
          hi: "बाढ़ के मैदानों में गंगा के छोड़े मोड़ उतारी हुई चूड़ियों की तरह बिखरे पड़े हैं।",
          mr: "पूरमैदानांत गंगेची सोडलेली वळणे उतरवलेल्या बांगड्यांसारखी विखुरलेली आहेत.",
        },
        extra: {
          en: "It begins life as a meander — a bend the current exaggerates year after year until the neck gives way.",
          hi: "उसका जन्म विसर्प के रूप में होता है — वह मोड़ जिसे धारा साल-दर-साल बढ़ाती है, जब तक गर्दन टूट न जाए।",
          mr: "त्याचा जन्म वळण म्हणून होतो — जे वळण प्रवाह वर्षानुवर्षे फुगवतो, मान तुटेपर्यंत.",
        },
        pair: {
          left: { en: "The abandoned bend", hi: "छोड़ा हुआ मोड़", mr: "सोडलेले वळण" },
          right: {
            en: "a crescent of still water",
            hi: "ठहरे पानी का चाँद-टुकड़ा",
            mr: "स्थिर पाण्याची चंद्रकोर",
          },
        },
      },
      {
        id: "delta7",
        name: { en: "The delta", hi: "डेल्टा", mr: "त्रिभुज प्रदेश" },
        kind: "landform",
        prompt: {
          en: "At the sea's edge a slowing river drops its load and splits into fingers over new flat land. Which landform is this?",
          hi: "समुद्र के किनारे धीमी पड़ती नदी अपना बोझ उतारकर नई समतल ज़मीन पर उँगलियों में बँट जाती है। यह कौन-सी भू-आकृति है?",
          mr: "समुद्राच्या काठी मंदावणारी नदी आपले ओझे उतरवून नव्या सपाट जमिनीवर बोटांत विभागते. हे कोणते भूरूप?",
        },
        statement: {
          en: "A delta is the river's final gift — silt laid down at the mouth, split by distributaries, farmed for its richness.",
          hi: "डेल्टा नदी की अंतिम भेंट है — मुहाने पर बिछी गाद, शाखाओं में बँटी, अपनी उर्वरता के लिए जोती गई।",
          mr: "त्रिभुज प्रदेश ही नदीची अखेरची भेट — मुखाशी अंथरलेला गाळ, उपवाहिन्यांत विभागलेला, सुपीकतेसाठी कसलेला.",
        },
        detail: {
          en: "The Ganga and Brahmaputra together build the world's largest — the Sundarbans stands on it.",
          hi: "गंगा और ब्रह्मपुत्र मिलकर संसार का सबसे बड़ा डेल्टा रचते हैं — सुंदरबन उसी पर खड़ा है।",
          mr: "गंगा आणि ब्रह्मपुत्रा मिळून जगातला सर्वांत मोठा त्रिभुज प्रदेश घडवतात — सुंदरबन त्यावरच उभे आहे.",
        },
        extra: {
          en: "Not every river earns one — a steep coast or strong tides can sweep the silt away faster than it lands.",
          hi: "हर नदी को डेल्टा नसीब नहीं — खड़ा तट या तेज़ ज्वार गाद को बैठने से पहले ही बहा ले जा सकते हैं।",
          mr: "प्रत्येक नदीला तो लाभत नाही — तीव्र किनारा वा जोरदार भरती गाळ बसण्याआधीच वाहून नेऊ शकते.",
        },
        pair: {
          left: { en: "The river's last gift", hi: "नदी की अंतिम भेंट", mr: "नदीची अखेरची भेट" },
          right: {
            en: "silt split into fingers",
            hi: "उँगलियों में बँटी गाद",
            mr: "बोटांत विभागलेला गाळ",
          },
        },
      },
      {
        id: "dune",
        name: { en: "The sand dune", hi: "बालू का टीला", mr: "वाळूची टेकडी" },
        kind: "landform",
        prompt: {
          en: "In deserts the wind heaps loose sand into which low hills that slowly travel?",
          hi: "रेगिस्तानों में हवा ढीली रेत को किन नीचे टीलों में जमा करती है, जो धीरे-धीरे सफ़र करते हैं?",
          mr: "वाळवंटांत वारा सैल वाळू कोणत्या सखल टेकड्यांत रचतो, ज्या हळूहळू प्रवास करतात?",
        },
        statement: {
          en: "Sand dunes are wind-built hills that creep — the desert redrawn grain by grain, night after night.",
          hi: "बालू के टीले हवा के बनाए सरकते पहाड़ हैं — रेगिस्तान रात-दर-रात कण-कण फिर खिंचता हुआ।",
          mr: "वाळूच्या टेकड्या म्हणजे वाऱ्याने बांधलेले सरकणारे डोंगर — वाळवंट रात्रीमागून रात्र कणाकणाने पुन्हा रेखाटलेले.",
        },
        pair: {
          left: { en: "Wind-heaped sand", hi: "हवा की जमाई रेत", mr: "वाऱ्याने रचलेली वाळू" },
          right: { en: "hills that travel", hi: "सफ़र करते टीले", mr: "प्रवास करणाऱ्या टेकड्या" },
        },
      },
      {
        id: "glacier",
        name: { en: "The glacier", hi: "हिमनद", mr: "हिमनदी" },
        kind: "landform",
        prompt: {
          en: "Which slow river of ice grinds its valley wide and deep, leaving ridges of rock-debris called moraines where it melts?",
          hi: "बर्फ़ की कौन-सी धीमी नदी अपनी घाटी को चौड़ा-गहरा घिसती है, पिघलने की जगह हिमोढ़ नामक मलबे की मेड़ें छोड़ती हुई?",
          mr: "हिमाची कोणती संथ नदी आपली दरी रुंद-खोल घासते, वितळण्याच्या जागी हिमोढ नावाच्या मलब्याच्या रांगा ठेवत?",
        },
        statement: {
          en: "A glacier is a slow river of ice — it bulldozes its valley wide and dumps moraines wherever it melts away.",
          hi: "हिमनद बर्फ़ की धीमी नदी है — वह घाटी को बुलडोज़र-सा चौड़ा करता है और जहाँ पिघले वहाँ हिमोढ़ पटक जाता है।",
          mr: "हिमनदी ही हिमाची संथ नदी — ती दरीला बुलडोझरसारखी रुंद करते आणि जिथे वितळेल तिथे हिमोढ टाकते.",
        },
        pair: {
          left: { en: "The river of ice", hi: "बर्फ़ की नदी", mr: "हिमाची नदी" },
          right: { en: "valleys ground wide", hi: "घिसकर चौड़ी घाटियाँ", mr: "घासून रुंद झालेल्या दऱ्या" },
        },
      },
      {
        id: "sea-carving",
        name: {
          en: "The sea's cave, arch and stack",
          hi: "समुद्र की गुफा, मेहराब और स्तंभ",
          mr: "समुद्राची गुहा, कमान आणि स्तंभ",
        },
        kind: "landform",
        prompt: {
          en: "Waves hollow a cliff into caves; two caves meet as an arch; the arch collapses, leaving a lone pillar. What is this coastal series called?",
          hi: "लहरें चट्टानी कगार में गुफाएँ खोदती हैं; दो गुफाएँ मिलकर मेहराब बनती हैं; मेहराब ढहकर अकेला स्तंभ छोड़ती है। इस तटीय शृंखला का नाम क्या है?",
          mr: "लाटा कड्यात गुहा कोरतात; दोन गुहा मिळून कमान होते; कमान कोसळून एकटा स्तंभ उरतो. या किनारी मालिकेचे नाव काय?",
        },
        statement: {
          en: "The sea carves cliffs into caves, arches and stacks, in that order — the coast is the ocean's patient workshop.",
          hi: "समुद्र कगारों को गुफा, मेहराब और स्तंभ में तराशता है, इसी क्रम से — तट सागर की धीरजवान कार्यशाला है।",
          mr: "समुद्र कड्यांना गुहा, कमान आणि स्तंभात कोरतो, याच क्रमाने — किनारा ही सागराची संयमी कार्यशाळा.",
        },
        pair: {
          left: { en: "The wave-carved cliff", hi: "लहर-तराशा कगार", mr: "लाटांनी कोरलेला कडा" },
          right: {
            en: "cave, then arch, then stack",
            hi: "गुफा, फिर मेहराब, फिर स्तंभ",
            mr: "गुहा, मग कमान, मग स्तंभ",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Follow a river from mountain to sea. In which order does it usually build these landforms?",
          hi: "नदी के साथ पहाड़ से समुद्र तक चलिए। वह प्रायः ये भू-आकृतियाँ किस क्रम में रचती है?",
          mr: "नदीसोबत डोंगरापासून समुद्रापर्यंत चला. ती बहुधा ही भूरूपे कोणत्या क्रमाने घडवते?",
        },
        choices: [
          {
            en: "Waterfall in the hills → meanders on the plain → ox-bow lakes as loops are cut → delta at the mouth",
            hi: "पहाड़ों में जलप्रपात → मैदान पर विसर्प → मोड़ कटने पर चापाकार झीलें → मुहाने पर डेल्टा",
            mr: "डोंगरांत धबधबा → मैदानावर वळणे → वळणे कापली जाताच नालाकृती सरोवरे → मुखाशी त्रिभुज प्रदेश",
          },
          {
            en: "Delta in the hills → waterfall on the plain → meanders at the mouth → ox-bow at sea",
            hi: "पहाड़ों में डेल्टा → मैदान पर जलप्रपात → मुहाने पर विसर्प → समुद्र में चापाकार झील",
            mr: "डोंगरांत त्रिभुज → मैदानावर धबधबा → मुखाशी वळणे → समुद्रात नालाकृती",
          },
          {
            en: "Ox-bow lakes first → waterfall → delta → meanders",
            hi: "पहले चापाकार झीलें → जलप्रपात → डेल्टा → विसर्प",
            mr: "आधी नालाकृती सरोवरे → धबधबा → त्रिभुज → वळणे",
          },
          {
            en: "Meanders in the hills → delta on the plain → waterfall at the mouth",
            hi: "पहाड़ों में विसर्प → मैदान पर डेल्टा → मुहाने पर जलप्रपात",
            mr: "डोंगरांत वळणे → मैदानावर त्रिभुज → मुखाशी धबधबा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The river's energy writes its geography. Young and steep, it cuts down and leaps — waterfalls. Older and flatter, it swings sideways — meanders, then the loops it abandons as ox-bow lakes. At the sea it has no strength left to carry anything, so it lays everything down — the delta. Read any river backwards and you read its slope.",
          hi: "नदी की ऊर्जा ही उसका भूगोल लिखती है। जवान और खड़ी ढाल पर वह काटती और कूदती है — जलप्रपात। बूढ़ी और समतल पर वह करवटें लेती है — विसर्प, फिर छोड़े मोड़ों की चापाकार झीलें। समुद्र तक पहुँचते-पहुँचते ढोने की ताक़त नहीं बचती, तो सब बिछा देती है — डेल्टा। किसी भी नदी को उल्टा पढ़िए और आप उसकी ढलान पढ़ लेंगे।",
          mr: "नदीची ऊर्जाच तिचा भूगोल लिहिते. तरुण आणि तीव्र उतारावर ती कापते आणि झेपावते — धबधबे. वयस्क आणि सपाट भागात ती कुशी बदलते — वळणे, मग सोडलेल्या वळणांची नालाकृती सरोवरे. समुद्रापर्यंत वाहून न्यायची ताकद उरत नाही, म्हणून सारे अंथरते — त्रिभुज प्रदेश. कोणतीही नदी उलटी वाचा आणि तुम्ही तिचा उतार वाचाल.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The delta's farmland is famously fertile — yet its soil exists only because mountains hundreds of kilometres away are being slowly destroyed. What is the connection?",
          hi: "डेल्टा की खेती-ज़मीन मशहूर उपजाऊ है — पर उसकी मिट्टी केवल इसलिए है कि सैकड़ों किलोमीटर दूर के पहाड़ धीरे-धीरे नष्ट हो रहे हैं। संबंध क्या है?",
          mr: "त्रिभुज प्रदेशातली शेतजमीन प्रसिद्ध सुपीक — पण तिची माती केवळ म्हणून आहे की शेकडो किलोमीटर दूरचे डोंगर हळूहळू नष्ट होत आहेत. संबंध काय?",
        },
        choices: [
          {
            en: "Erosion and deposition are one process with two ends: what the river wears off the mountains is exactly what it lays down at the mouth",
            hi: "अपरदन और निक्षेपण एक ही प्रक्रिया के दो सिरे हैं: नदी पहाड़ों से जो घिसती है, ठीक वही मुहाने पर बिछाती है",
            mr: "झीज आणि संचयन ही एकाच प्रक्रियेची दोन टोके: नदी डोंगरांतून जे झिजवते, नेमके तेच मुखाशी अंथरते",
          },
          {
            en: "Deltas make their own soil from seawater",
            hi: "डेल्टा अपनी मिट्टी समुद्र-जल से बनाते हैं",
            mr: "त्रिभुज प्रदेश आपली माती समुद्रजलातून बनवतात",
          },
          {
            en: "It is coincidence — mountains and deltas are unrelated",
            hi: "यह संयोग है — पहाड़ों और डेल्टाओं का कोई नाता नहीं",
            mr: "हा योगायोग — डोंगर आणि त्रिभुजांचा संबंध नाही",
          },
          {
            en: "Farmers cart the mountain soil down themselves",
            hi: "किसान पहाड़ की मिट्टी ख़ुद ढोकर लाते हैं",
            mr: "शेतकरी डोंगराची माती स्वतः वाहून आणतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Follow the silt. Frost cracks a Himalayan slope; the river picks up the crumbs and grinds them finer for a thousand kilometres; at the sea it slows and surrenders the lot. The delta is the mountain, re-delivered — soil that took a geological journey. That is why silencing a river with dams upstream slowly starves its delta downstream: the two ends were never separate.",
          hi: "गाद का पीछा कीजिए। पाला हिमालयी ढलान चटकाता है; नदी चूरा उठाकर हज़ार किलोमीटर उसे और महीन पीसती है; समुद्र पर धीमी पड़कर सब सौंप देती है। डेल्टा दरअसल पहाड़ ही है, नए पते पर पहुँचाया — वह मिट्टी जिसने भूगर्भीय यात्रा की। इसीलिए ऊपर बाँधों से नदी को चुप कराना नीचे उसके डेल्टा को धीरे-धीरे भूखा करता है: दोनों सिरे कभी अलग थे ही नहीं।",
          mr: "गाळाचा पाठलाग करा. हिम हिमालयी उतार तडकवते; नदी चुरा उचलून हजार किलोमीटर तो अधिक बारीक दळते; समुद्रापाशी मंदावून सारे सोपवते. त्रिभुज प्रदेश म्हणजे डोंगरच, नव्या पत्त्यावर पोहोचवलेला — भूगर्भीय प्रवास केलेली माती. म्हणूनच वर धरणांनी नदीला गप्प करणे खाली तिच्या त्रिभुजाला हळूहळू उपाशी ठेवते: दोन टोके कधी वेगळी नव्हतीच.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Air (layers, moods and the gas blanket)                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-7-air",
    subject: "GEOGRAPHY",
    classLevel: 7,
    chapter: {
      en: "Chapter 4 — Air",
      hi: "अध्याय 4 — वायु",
      mr: "प्रकरण 4 — हवा",
    },
    name: { en: "Air", hi: "वायु", mr: "हवा" },
    summary: {
      en: "The atmosphere in storeys — weather's floor and the calm above it — plus the difference between the sky's mood and its temperament, air's own weight, and the gas blanket we are thickening.",
      hi: "मंज़िलों में वायुमंडल — मौसम का फ़र्श और उसके ऊपर की शांति — साथ में आसमान के मिज़ाज और स्वभाव का फ़र्क़, हवा का अपना वज़न, और वह गैस-कंबल जिसे हम मोटा कर रहे हैं।",
      mr: "मजल्यांमधले वातावरण — हवामानाचा तळमजला आणि त्यावरची शांतता — सोबत आकाशाच्या मूडचा आणि स्वभावाचा फरक, हवेचे स्वतःचे वजन, आणि आपण जाड करत असलेले वायू-पांघरूण.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "troposphere",
        name: { en: "The troposphere", hi: "क्षोभमंडल", mr: "तपांबर" },
        kind: "layer",
        prompt: {
          en: "In which lowest storey of the atmosphere does all our weather — clouds, rain, storms — actually happen?",
          hi: "वायुमंडल की किस सबसे निचली मंज़िल में हमारा सारा मौसम — बादल, बारिश, आँधियाँ — सचमुच घटता है?",
          mr: "वातावरणाच्या कोणत्या सर्वांत खालच्या मजल्यावर आपले सारे हवामान — ढग, पाऊस, वादळे — खरोखर घडते?",
        },
        statement: {
          en: "The troposphere is the lowest layer — the air we breathe, and the floor on which every cloud and storm performs.",
          hi: "क्षोभमंडल सबसे निचली परत है — वही हवा जो हम साँस लेते हैं, और वह फ़र्श जिस पर हर बादल और आँधी अपना खेल दिखाती है।",
          mr: "तपांबर हा सर्वांत खालचा थर — आपण श्वास घेतो ती हवा, आणि ज्यावर प्रत्येक ढग आणि वादळ आपला खेळ करते तो तळमजला.",
        },
        detail: {
          en: "Only about 13 km thick — a short bus ride stood on end — yet it holds every monsoon and every kite.",
          hi: "केवल लगभग 13 किमी मोटी — खड़ी की गई एक छोटी बस-यात्रा — फिर भी हर मानसून और हर पतंग इसी में समाई है।",
          mr: "फक्त सुमारे 13 किमी जाड — उभा केलेला एक छोटा बस-प्रवास — तरी प्रत्येक मान्सून आणि प्रत्येक पतंग यातच मावतो.",
        },
        extra: {
          en: "Cross its ceiling and the weather simply stops — pilots climb into permanent calm.",
          hi: "इसकी छत पार कीजिए और मौसम बस थम जाता है — पायलट स्थायी शांति में चढ़ जाते हैं।",
          mr: "याचे छत ओलांडा आणि हवामान नुसते थांबते — वैमानिक कायमच्या शांततेत चढतात.",
        },
        pair: {
          left: { en: "The weather's floor", hi: "मौसम का फ़र्श", mr: "हवामानाचा तळमजला" },
          right: {
            en: "clouds, rain and storms",
            hi: "बादल, बारिश और आँधियाँ",
            mr: "ढग, पाऊस आणि वादळे",
          },
        },
      },
      {
        id: "stratosphere",
        name: { en: "The stratosphere", hi: "समतापमंडल", mr: "स्थितांबर" },
        kind: "layer",
        prompt: {
          en: "Above the weather lies which calm storey — home of the ozone shield and of cruising jet planes?",
          hi: "मौसम के ऊपर कौन-सी शांत मंज़िल है — ओज़ोन-ढाल और मँडराते जेट विमानों का घर?",
          mr: "हवामानाच्या वर कोणता शांत मजला आहे — ओझोन-ढाल आणि विहरणाऱ्या जेट विमानांचे घर?",
        },
        statement: {
          en: "The stratosphere sits above the weather — calm thin air where jets cruise and ozone absorbs the Sun's ultraviolet.",
          hi: "समतापमंडल मौसम के ऊपर बैठा है — शांत पतली हवा, जहाँ जेट मँडराते हैं और ओज़ोन सूर्य की पराबैंगनी सोख लेती है।",
          mr: "स्थितांबर हवामानाच्या वर बसले आहे — शांत विरळ हवा, जिथे जेट विहरतात आणि ओझोन सूर्याची अतिनील शोषते.",
        },
        pair: {
          left: {
            en: "The calm second storey",
            hi: "शांत दूसरी मंज़िल",
            mr: "शांत दुसरा मजला",
          },
          right: {
            en: "ozone and cruising jets",
            hi: "ओज़ोन और मँडराते जेट",
            mr: "ओझोन आणि विहरणारे जेट",
          },
        },
      },
      {
        id: "weather7",
        name: { en: "Weather", hi: "मौसम", mr: "हवामान" },
        kind: "state",
        prompt: {
          en: "The hour-by-hour state of the air — hot, wet, windy — that can change before evening. What is it called?",
          hi: "हवा की घंटे-दर-घंटे की दशा — गर्म, गीली, तेज़ — जो शाम से पहले बदल सकती है। उसका नाम क्या है?",
          mr: "हवेची तासागणिक अवस्था — गरम, ओली, वादळी — जी संध्याकाळच्या आत बदलू शकते. तिचे नाव काय?",
        },
        statement: {
          en: "Weather is the atmosphere's mood of the moment — it can flip completely between morning and evening.",
          hi: "मौसम वायुमंडल का पल भर का मिज़ाज है — वह सुबह और शाम के बीच पूरा पलट सकता है।",
          mr: "हवामान म्हणजे वातावरणाचा क्षणाचा मूड — तो सकाळ आणि संध्याकाळच्या दरम्यान पूर्ण पालटू शकतो.",
        },
        pair: {
          left: { en: "The sky's mood today", hi: "आज का आसमानी मिज़ाज", mr: "आजचा आकाशाचा मूड" },
          right: { en: "changed by evening", hi: "शाम तक बदला हुआ", mr: "संध्याकाळपर्यंत बदललेला" },
        },
      },
      {
        id: "climate7",
        name: { en: "Climate", hi: "जलवायु", mr: "जलवायुमान" },
        kind: "state",
        prompt: {
          en: "The average pattern of weather a place keeps over many, many years — what is this long record called?",
          hi: "किसी जगह का कई-कई वर्षों में सधा मौसम का औसत ढर्रा — इस लंबे अभिलेख का नाम क्या है?",
          mr: "एखाद्या जागेचा अनेकानेक वर्षांत बसलेला हवामानाचा सरासरी साचा — या दीर्घ नोंदीचे नाव काय?",
        },
        statement: {
          en: "Climate is weather's long average — twenty-five years of records speaking as one sentence about a place.",
          hi: "जलवायु मौसम का लंबा औसत है — पच्चीस वर्षों के अभिलेख किसी जगह के बारे में एक वाक्य बनकर बोलते हुए।",
          mr: "जलवायुमान म्हणजे हवामानाची दीर्घ सरासरी — पंचवीस वर्षांच्या नोंदी एखाद्या जागेबद्दल एक वाक्य होऊन बोलणाऱ्या.",
        },
        detail: {
          en: "'Hot wet summers, cool dry winters' — a climate sentence that no single day's weather can contradict.",
          hi: "'गर्म गीली गर्मियाँ, ठंडी सूखी सर्दियाँ' — जलवायु का ऐसा वाक्य जिसे किसी एक दिन का मौसम झुठला नहीं सकता।",
          mr: "'उष्ण दमट उन्हाळे, थंड कोरडे हिवाळे' — जलवायुमानाचे असे वाक्य ज्याला एका दिवसाचे हवामान खोटे ठरवू शकत नाही.",
        },
        extra: {
          en: "Weather is mood; climate is temperament — a pair the newspapers mix up daily.",
          hi: "मौसम मिज़ाज है; जलवायु स्वभाव — वह जोड़ी जिसे अख़बार रोज़ गड्डमड्ड करते हैं।",
          mr: "हवामान म्हणजे मूड; जलवायुमान म्हणजे स्वभाव — वृत्तपत्रे रोज गल्लत करतात ती जोडी.",
        },
        pair: {
          left: { en: "The long average", hi: "लंबा औसत", mr: "दीर्घ सरासरी" },
          right: {
            en: "many years in one sentence",
            hi: "एक वाक्य में कई वर्ष",
            mr: "एका वाक्यात अनेक वर्षे",
          },
        },
      },
      {
        id: "pressure",
        name: { en: "Air pressure", hi: "वायुदाब", mr: "हवेचा दाब" },
        kind: "measure",
        prompt: {
          en: "The weight of the whole column of air pressing down on every point of the Earth — what is this push called?",
          hi: "पृथ्वी के हर बिंदु पर दबता हवा के पूरे स्तंभ का वज़न — इस दबाव का नाम क्या है?",
          mr: "पृथ्वीच्या प्रत्येक बिंदूवर दाबणारे हवेच्या सबंध स्तंभाचे वजन — या दाबाचे नाव काय?",
        },
        statement: {
          en: "Air pressure is the atmosphere's own weight — highest at sea level and thinning steadily as you climb.",
          hi: "वायुदाब वायुमंडल का अपना वज़न है — समुद्र-तल पर सबसे ज़्यादा, और चढ़ते जाइए तो लगातार पतला।",
          mr: "हवेचा दाब हे वातावरणाचे स्वतःचे वजन — समुद्रसपाटीवर सर्वाधिक, आणि चढत जाल तसे सतत विरळ.",
        },
        detail: {
          en: "Mountaineers gasp on high peaks because each breath simply holds fewer molecules — the air itself has grown thin.",
          hi: "पर्वतारोही ऊँची चोटियों पर इसलिए हाँफते हैं कि हर साँस में अणु ही कम समाते हैं — हवा स्वयं पतली हो चुकी है।",
          mr: "गिर्यारोहक उंच शिखरांवर म्हणून धापावतात की प्रत्येक श्वासात रेणूच कमी मावतात — हवा स्वतःच विरळ झाली आहे.",
        },
        extra: {
          en: "Weather maps are really pressure maps — air forever runs from high pressure to low.",
          hi: "मौसम के नक़्शे असल में दाब के नक़्शे हैं — हवा सदा ऊँचे दाब से नीचे की ओर दौड़ती है।",
          mr: "हवामानाचे नकाशे खरे तर दाबाचे नकाशे — हवा नेहमी उच्च दाबाकडून कमीकडे धावते.",
        },
        pair: {
          left: { en: "The air's own weight", hi: "हवा का अपना वज़न", mr: "हवेचे स्वतःचे वजन" },
          right: {
            en: "strongest at sea level",
            hi: "समुद्र-तल पर सबसे प्रबल",
            mr: "समुद्रसपाटीवर सर्वांत जोरदार",
          },
        },
      },
      {
        id: "wind7",
        name: { en: "Wind", hi: "पवन", mr: "वारा" },
        kind: "motion",
        prompt: {
          en: "Air pouring from a region of high pressure toward a region of low pressure — what do we call it once it starts to flow?",
          hi: "ऊँचे दाब के इलाक़े से नीचे दाब के इलाक़े की ओर बहती हवा — बहने लगे तो हम उसे क्या कहते हैं?",
          mr: "उच्च दाबाच्या प्रदेशाकडून कमी दाबाच्या प्रदेशाकडे ओतणारी हवा — वाहू लागली की आपण तिला काय म्हणतो?",
        },
        statement: {
          en: "Wind is air on the move — always running from high pressure toward low, gentle or fierce as the gap dictates.",
          hi: "पवन चलती हुई हवा है — सदा ऊँचे दाब से नीचे की ओर दौड़ती, फ़ासले के हिसाब से कोमल या प्रचंड।",
          mr: "वारा म्हणजे चालती हवा — नेहमी उच्च दाबाकडून कमीकडे धावणारी, फरकाच्या मानाने सौम्य वा प्रचंड.",
        },
        pair: {
          left: { en: "Air on the run", hi: "दौड़ती हवा", mr: "धावणारी हवा" },
          right: {
            en: "high pressure to low",
            hi: "ऊँचे दाब से नीचे को",
            mr: "उच्च दाबाकडून कमीकडे",
          },
        },
      },
      {
        id: "humidity",
        name: { en: "Humidity", hi: "आर्द्रता", mr: "आर्द्रता" },
        kind: "measure",
        prompt: {
          en: "The amount of water vapour the air happens to be carrying — which measure makes a sticky day sticky?",
          hi: "हवा में उस समय मौजूद जलवाष्प की मात्रा — कौन-सी माप चिपचिपे दिन को चिपचिपा बनाती है?",
          mr: "हवेत त्या वेळी असलेल्या बाष्पाचे प्रमाण — कोणते माप चिकट दिवसाला चिकट करते?",
        },
        statement: {
          en: "Humidity is the air's cargo of water vapour — heavy on sticky coastal days, feather-light in desert air.",
          hi: "आर्द्रता हवा का जलवाष्प-लदान है — चिपचिपे तटीय दिनों में भारी, रेगिस्तानी हवा में पर-सी हल्की।",
          mr: "आर्द्रता म्हणजे हवेचे बाष्प-ओझे — चिकट किनारी दिवसांत जड, वाळवंटी हवेत पिसासारखे हलके.",
        },
        pair: {
          left: { en: "The air's water cargo", hi: "हवा का जल-लदान", mr: "हवेचे पाणी-ओझे" },
          right: {
            en: "the sticky-day measure",
            hi: "चिपचिपे दिन की माप",
            mr: "चिकट दिवसाचे माप",
          },
        },
      },
      {
        id: "greenhouse",
        name: { en: "The greenhouse effect", hi: "पौधाघर प्रभाव", mr: "हरितगृह परिणाम" },
        kind: "effect",
        prompt: {
          en: "Carbon dioxide and its fellow gases hold the Sun's warmth close to the Earth, like glass over a plant nursery. What is this trapping called?",
          hi: "कार्बन डाइऑक्साइड और उसकी साथी गैसें सूर्य की गर्मी को पृथ्वी के पास रोके रखती हैं, जैसे पौधशाला पर शीशा। इस रोक का नाम क्या है?",
          mr: "कार्बन डायऑक्साइड आणि तिच्या सोबती वायू सूर्याची ऊब पृथ्वीजवळ धरून ठेवतात, रोपवाटिकेवरच्या काचेसारखे. या धरून ठेवण्याचे नाव काय?",
        },
        statement: {
          en: "The greenhouse effect is heat held in by atmospheric gases — a natural blanket that human smoke keeps thickening.",
          hi: "पौधाघर प्रभाव वायुमंडलीय गैसों में रुकी गर्मी है — वह प्राकृतिक कंबल जिसे मानवी धुआँ मोटा करता जा रहा है।",
          mr: "हरितगृह परिणाम म्हणजे वातावरणीय वायूंनी धरलेली उष्णता — मानवी धूर जाड करत असलेले नैसर्गिक पांघरूण.",
        },
        detail: {
          en: "Without it the Earth would freeze; with too much, glaciers melt and seas rise — the dose makes the blanket.",
          hi: "इसके बिना पृथ्वी जम जाती; इसके अधिक होने पर हिमनद पिघलते और समुद्र चढ़ते हैं — मात्रा ही कंबल तय करती है।",
          mr: "याच्याविना पृथ्वी गोठली असती; हे जास्त झाले की हिमनद्या वितळतात आणि समुद्र चढतात — मात्राच पांघरूण ठरवते.",
        },
        extra: {
          en: "Its lead gas is carbon dioxide — the very gas plants drink for their food.",
          hi: "इसकी प्रमुख गैस कार्बन डाइऑक्साइड है — वही गैस जिसे पौधे भोजन के लिए पीते हैं।",
          mr: "याचा प्रमुख वायू कार्बन डायऑक्साइड — तोच वायू जो वनस्पती अन्नासाठी पितात.",
        },
        pair: {
          left: { en: "The gas blanket", hi: "गैसों का कंबल", mr: "वायूंचे पांघरूण" },
          right: { en: "warmth held close", hi: "पास रोकी गर्मी", mr: "जवळ धरलेली ऊब" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Which of these sentences is about CLIMATE, not weather?",
          hi: "इनमें से कौन-सा वाक्य मौसम का नहीं, जलवायु का है?",
          mr: "यांतले कोणते वाक्य हवामानाचे नव्हे, जलवायुमानाचे आहे?",
        },
        choices: [
          {
            en: "Mumbai has hot, humid summers and mild winters, year after year",
            hi: "मुंबई में साल-दर-साल गर्म, उमस भरी गर्मियाँ और नरम सर्दियाँ होती हैं",
            mr: "मुंबईत वर्षानुवर्षे उष्ण, दमट उन्हाळे आणि सौम्य हिवाळे असतात",
          },
          {
            en: "It rained heavily this morning near the school",
            hi: "आज सुबह स्कूल के पास ज़ोरदार बारिश हुई",
            mr: "आज सकाळी शाळेजवळ जोरदार पाऊस पडला",
          },
          {
            en: "A dust storm struck the town at four o'clock",
            hi: "चार बजे क़स्बे पर धूल भरी आँधी टूटी",
            mr: "चार वाजता गावावर धुळीचे वादळ आदळले",
          },
          {
            en: "Today is noticeably cooler than yesterday",
            hi: "आज कल से साफ़ ठंडा है",
            mr: "आज कालपेक्षा स्पष्ट थंड आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three of the sentences carry a clock — this morning, four o'clock, today — and anything datable to a day is weather. Only the Mumbai sentence speaks in 'year after year': a pattern held across decades, which is climate. The test is the timestamp: mood has a time, temperament does not.",
          hi: "तीन वाक्यों में घड़ी लगी है — आज सुबह, चार बजे, आज — और जो एक दिन पर टाँका जा सके वह मौसम है। केवल मुंबई वाला वाक्य 'साल-दर-साल' बोलता है: दशकों में सधा ढर्रा, यानी जलवायु। कसौटी है समय-मुहर: मिज़ाज का वक़्त होता है, स्वभाव का नहीं।",
          mr: "तीन वाक्यांत घड्याळ आहे — आज सकाळी, चार वाजता, आज — आणि जे एका दिवसावर टाचता येते ते हवामान. फक्त मुंबईचे वाक्य 'वर्षानुवर्षे' बोलते: दशकांत बसलेला साचा, म्हणजे जलवायुमान. कसोटी आहे वेळ-शिक्का: मूडला वेळ असते, स्वभावाला नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "After one unusually cold, rainy week, someone announces: 'So much for global warming!' Why does one cold week prove nothing about a warming climate?",
          hi: "एक असामान्य ठंडे, बरसाती हफ़्ते के बाद कोई घोषणा करता है: 'हो गई ग्लोबल वार्मिंग की पोल खुली!' एक ठंडा हफ़्ता गर्म होती जलवायु के बारे में कुछ क्यों नहीं सिद्ध करता?",
          mr: "एका असामान्य थंड, पावसाळी आठवड्यानंतर कोणी जाहीर करते: 'झाली ग्लोबल वॉर्मिंगची पोलखोल!' एक थंड आठवडा तापणाऱ्या जलवायुमानाबद्दल काही का सिद्ध करत नाही?",
        },
        choices: [
          {
            en: "A week is weather, warming is climate — one cold mood cannot contradict a temperament measured across decades of averages",
            hi: "हफ़्ता मौसम है, तपन जलवायु — एक ठंडा मिज़ाज दशकों के औसतों में नपे स्वभाव को नहीं झुठला सकता",
            mr: "आठवडा म्हणजे हवामान, तापणे म्हणजे जलवायुमान — एक थंड मूड दशकांच्या सरासरींत मोजलेल्या स्वभावाला खोटे ठरवू शकत नाही",
          },
          {
            en: "Cold weeks are impossible now, so the report must be wrong",
            hi: "अब ठंडे हफ़्ते असंभव हैं, अतः ख़बर ही ग़लत होगी",
            mr: "आता थंड आठवडे अशक्य, म्हणून बातमीच चुकीची असेल",
          },
          {
            en: "The announcement is right — one week is a fair sample",
            hi: "घोषणा सही है — एक हफ़्ता वाजिब नमूना है",
            mr: "घोषणा बरोबर — एक आठवडा रास्त नमुना आहे",
          },
          {
            en: "Warming applies only to summer months",
            hi: "तपन केवल गर्मी के महीनों पर लागू होती है",
            mr: "तापणे फक्त उन्हाळी महिन्यांना लागू होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Climate claims are averages over decades; weather is one roll of the dice. A warming world still throws cold weeks, just as a good batter still plays bad innings — the average moves while single days scatter widely around it. To test the warming claim you must look where it lives: in thirty-year records, glacier lines and sea levels, not out of this week's window.",
          hi: "जलवायु के दावे दशकों के औसत हैं; मौसम पासे की एक फेंक। गर्म होती दुनिया में भी ठंडे हफ़्ते आते हैं, जैसे अच्छा बल्लेबाज़ भी बुरी पारियाँ खेलता है — औसत खिसकता है जबकि अकेले दिन उसके गिर्द दूर-दूर बिखरते हैं। तपन के दावे को परखना हो तो वहीं देखिए जहाँ वह बसता है: तीस वर्षों के अभिलेख, हिमनद-रेखाएँ और समुद्र-तल — इस हफ़्ते की खिड़की से नहीं।",
          mr: "जलवायुमानाचे दावे दशकांच्या सरासरी; हवामान म्हणजे फाशाची एक फेक. तापणाऱ्या जगातही थंड आठवडे येतात, जसा चांगला फलंदाजही वाईट डाव खेळतो — सरासरी सरकते तर एकेकटे दिवस तिच्याभोवती दूरवर विखुरतात. तापण्याचा दावा तपासायचा तर तो जिथे राहतो तिथे पाहा: तीस वर्षांच्या नोंदी, हिमनदी-रेषा आणि समुद्रपातळी — या आठवड्याच्या खिडकीतून नाही.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Water (one stock of water, restlessly shared)               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-7-water",
    subject: "GEOGRAPHY",
    classLevel: 7,
    chapter: {
      en: "Chapter 5 — Water",
      hi: "अध्याय 5 — जल",
      mr: "प्रकरण 5 — पाणी",
    },
    name: { en: "Water", hi: "जल", mr: "पाणी" },
    summary: {
      en: "One ancient stock of water going round forever — waves that race while water bobs, tides on the Moon's timetable, rivers inside the sea, and the salt that only ever accumulates.",
      hi: "पानी का एक प्राचीन भंडार सदा घूमता हुआ — लहरें जो दौड़ती हैं जबकि पानी वहीं डोलता है, चाँद की समय-सारिणी पर ज्वार, समुद्र के भीतर नदियाँ, और वह नमक जो केवल जमा ही होता जाता है।",
      mr: "पाण्याचा एक प्राचीन साठा कायम फिरणारा — पाणी जागीच डुलत असताना धावणाऱ्या लाटा, चंद्राच्या वेळापत्रकावरची भरती-ओहोटी, समुद्राच्या आतल्या नद्या, आणि फक्त साचतच जाणारे मीठ.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "water-cycle7",
        name: { en: "The water cycle", hi: "जल चक्र", mr: "जलचक्र" },
        kind: "cycle",
        prompt: {
          en: "Evaporation lifts the sea, clouds carry it inland, rain returns it, rivers run it home again. Which endless loop is this?",
          hi: "वाष्पन समुद्र को उठाता है, बादल उसे भीतर ले जाते हैं, बारिश लौटाती है, नदियाँ फिर घर पहुँचा देती हैं। यह कौन-सा अंतहीन चक्कर है?",
          mr: "बाष्पीभवन समुद्राला उचलते, ढग त्याला आत नेतात, पाऊस परत करतो, नद्या पुन्हा घरी पोहोचवतात. हे कोणते अखंड चक्र?",
        },
        statement: {
          en: "The water cycle moves the same water forever — sea to sky to land and back, with nothing new ever added to the stock.",
          hi: "जल चक्र वही पानी सदा घुमाता है — समुद्र से आसमान, आसमान से ज़मीन, फिर वापस; भंडार में कभी कुछ नया नहीं जुड़ता।",
          mr: "जलचक्र तेच पाणी कायम फिरवते — समुद्रातून आकाश, आकाशातून जमीन, पुन्हा परत; साठ्यात कधी नवे काही जुडत नाही.",
        },
        detail: {
          en: "The water you drank today may once have rained on dinosaurs — the stock is ancient and fixed.",
          hi: "जो पानी आपने आज पिया, वह कभी डायनासोरों पर बरसा हो सकता है — भंडार प्राचीन और नियत है।",
          mr: "तुम्ही आज प्यायलेले पाणी कधी डायनोसॉरांवर बरसले असेल — साठा प्राचीन आणि ठरलेला आहे.",
        },
        extra: {
          en: "The Sun powers the whole machine — the sky's pump has no other engine.",
          hi: "पूरी मशीन सूर्य चलाता है — आसमान के पंप का और कोई इंजन नहीं।",
          mr: "सारे यंत्र सूर्य चालवतो — आकाशाच्या पंपाला दुसरे इंजिन नाही.",
        },
        pair: {
          left: { en: "Sea to sky to sea", hi: "समुद्र से आसमान, फिर समुद्र", mr: "समुद्रातून आकाश, पुन्हा समुद्र" },
          right: {
            en: "the same water, forever",
            hi: "वही पानी, सदा",
            mr: "तेच पाणी, कायम",
          },
        },
      },
      {
        id: "waves7",
        name: { en: "Waves", hi: "तरंगें (लहरें)", mr: "लाटा" },
        kind: "motion",
        prompt: {
          en: "The wind rubs the sea's surface into which endless rise and fall that finally crashes on the shore?",
          hi: "हवा समुद्र की सतह को किस अंतहीन उठा-गिरी में मल देती है, जो अंततः किनारे पर टूटती है?",
          mr: "वारा समुद्राच्या पृष्ठाला कोणत्या अखंड चढ-उतारात घासतो, जो अखेर किनाऱ्यावर फुटतो?",
        },
        statement: {
          en: "Waves are wind's ripples grown tall — the water itself bobs in place while only the SHAPE races ashore.",
          hi: "लहरें हवा की बड़ी हुई सिलवटें हैं — पानी स्वयं वहीं डोलता रहता है, किनारे की ओर केवल आकृति दौड़ती है।",
          mr: "लाटा म्हणजे वाऱ्याच्या उंचावलेल्या सुरकुत्या — पाणी स्वतः जागीच डुलते, किनाऱ्याकडे फक्त आकार धावतो.",
        },
        pair: {
          left: {
            en: "The sea's rise and fall",
            hi: "समुद्र की उठा-गिरी",
            mr: "समुद्राचा चढ-उतार",
          },
          right: { en: "shapes racing ashore", hi: "किनारे दौड़ती आकृतियाँ", mr: "किनाऱ्याकडे धावणारे आकार" },
        },
      },
      {
        id: "tides",
        name: { en: "Tides", hi: "ज्वार-भाटा", mr: "भरती-ओहोटी" },
        kind: "motion",
        prompt: {
          en: "Twice a day the sea climbs high up the beach and twice it slides back. What are these regular risings and fallings called?",
          hi: "दिन में दो बार समुद्र तट पर ऊँचा चढ़ता है और दो बार लौट जाता है। इन नियमित चढ़ावों-उतारों का नाम क्या है?",
          mr: "दिवसातून दोनदा समुद्र किनाऱ्यावर उंच चढतो आणि दोनदा मागे सरकतो. या नियमित चढ-उतारांचे नाव काय?",
        },
        statement: {
          en: "Tides are the sea's twice-daily breathing — raised chiefly by the Moon's pull on the ocean's water.",
          hi: "ज्वार-भाटा समुद्र की दिन में दो बार की साँस है — मुख्यतः सागर-जल पर चाँद के खिंचाव से उठी।",
          mr: "भरती-ओहोटी म्हणजे समुद्राचा दिवसातून दोनदाचा श्वास — मुख्यतः सागरजलावरील चंद्राच्या ओढीने उठलेला.",
        },
        detail: {
          en: "Full-moon and new-moon days bring the highest spring tides — Sun and Moon hauling in one line.",
          hi: "पूर्णिमा और अमावस्या के दिन सबसे ऊँचे ज्वार आते हैं — सूर्य और चाँद एक ही रेखा में खींचते हुए।",
          mr: "पौर्णिमा आणि अमावास्येला सर्वांत उंच उधाणे येतात — सूर्य आणि चंद्र एकाच रेषेत ओढणारे.",
        },
        extra: {
          en: "Fisherfolk, ports and mudflat birds all keep the Moon's timetable, not the clock's.",
          hi: "मछुआरे, बंदरगाह और कीचड़-मैदानों के पंछी सब घड़ी की नहीं, चाँद की समय-सारिणी मानते हैं।",
          mr: "कोळी, बंदरे आणि चिखलाणातले पक्षी सारे घड्याळाचे नव्हे, चंद्राचे वेळापत्रक पाळतात.",
        },
        pair: {
          left: {
            en: "The sea's twice-daily climb",
            hi: "समुद्र की दो बार की चढ़ाई",
            mr: "समुद्राची दोनदाची चढाई",
          },
          right: {
            en: "the Moon's pull at work",
            hi: "काम पर चाँद का खिंचाव",
            mr: "कामाला लागलेली चंद्राची ओढ",
          },
        },
      },
      {
        id: "currents",
        name: { en: "Ocean currents", hi: "महासागरीय धाराएँ", mr: "सागरी प्रवाह" },
        kind: "motion",
        prompt: {
          en: "Which steady rivers WITHIN the sea carry warm or cold water across whole oceans on fixed paths?",
          hi: "समुद्र के भीतर की कौन-सी सधी नदियाँ गर्म या ठंडा पानी बँधे रास्तों पर पूरे महासागर पार ले जाती हैं?",
          mr: "समुद्राच्या आतल्या कोणत्या स्थिर नद्या गरम वा थंड पाणी ठरलेल्या वाटांनी अख्खे महासागर पार नेतात?",
        },
        statement: {
          en: "Ocean currents are rivers inside the sea — warm ones and cold ones, steering climates and fish alike.",
          hi: "महासागरीय धाराएँ समुद्र के भीतर की नदियाँ हैं — गर्म और ठंडी, जलवायु और मछलियाँ दोनों को हाँकती हुईं।",
          mr: "सागरी प्रवाह म्हणजे समुद्राच्या आतल्या नद्या — गरम आणि थंड, जलवायुमान आणि मासे दोघांना वळवणाऱ्या.",
        },
        detail: {
          en: "Where a warm current meets a cold one, fog thickens and fish gather — the world's great fishing grounds sit at these meetings.",
          hi: "जहाँ गर्म धारा ठंडी से मिलती है, कोहरा गहराता है और मछलियाँ जुटती हैं — दुनिया के बड़े मत्स्य-क्षेत्र इन्हीं मिलनों पर बसे हैं।",
          mr: "जिथे गरम प्रवाह थंडाला भेटतो, तिथे धुके दाटते आणि मासे जमतात — जगातली मोठी मासेमारी-क्षेत्रे याच भेटींवर वसली आहेत.",
        },
        extra: {
          en: "Europe's mild winters ride on one warm current's back — climate delivered by sea.",
          hi: "यूरोप की नरम सर्दियाँ एक गर्म धारा की पीठ पर सवार हैं — समुद्र से पहुँचाई गई जलवायु।",
          mr: "युरोपचे सौम्य हिवाळे एका गरम प्रवाहाच्या पाठीवर स्वार आहेत — समुद्राने पोहोचवलेले जलवायुमान.",
        },
        pair: {
          left: { en: "Rivers within the sea", hi: "समुद्र के भीतर नदियाँ", mr: "समुद्राच्या आतल्या नद्या" },
          right: {
            en: "warm and cold conveyor belts",
            hi: "गर्म-ठंडी वाहक पट्टियाँ",
            mr: "गरम-थंड वाहक पट्टे",
          },
        },
      },
      {
        id: "salinity",
        name: { en: "Salinity", hi: "लवणता", mr: "क्षारता" },
        kind: "measure",
        prompt: {
          en: "Which measure counts the grams of dissolved salt in every thousand grams of seawater?",
          hi: "कौन-सी माप समुद्र-जल के हर हज़ार ग्राम में घुले नमक के ग्राम गिनती है?",
          mr: "कोणते माप समुद्रजलाच्या दर हजार ग्रॅममधले विरघळलेल्या मिठाचे ग्रॅम मोजते?",
        },
        statement: {
          en: "Salinity measures the sea's salt — about 35 grams in every thousand of ordinary ocean water.",
          hi: "लवणता समुद्र का नमक नापती है — साधारण सागर-जल के हर हज़ार ग्राम में लगभग 35 ग्राम।",
          mr: "क्षारता समुद्राचे मीठ मोजते — साध्या सागरजलाच्या दर हजारात सुमारे 35 ग्रॅम.",
        },
        detail: {
          en: "The Dead Sea is so saline that a swimmer floats reading a newspaper — salt is buoyancy.",
          hi: "मृत सागर इतना खारा है कि तैराक अख़बार पढ़ते हुए तैरता रहता है — नमक ही उछाल है।",
          mr: "मृत समुद्र इतका क्षारयुक्त की पोहणारा वर्तमानपत्र वाचत तरंगतो — मीठ म्हणजेच तरंगणे.",
        },
        extra: {
          en: "Rivers deliver the salt grain by grain, and evaporation leaves it behind — so the sea can only grow saltier.",
          hi: "नदियाँ नमक कण-कण पहुँचाती हैं, और वाष्पन उसे पीछे छोड़ जाता है — अतः समुद्र केवल और खारा ही हो सकता है।",
          mr: "नद्या मीठ कणाकणाने पोहोचवतात, आणि बाष्पीभवन ते मागे ठेवते — म्हणून समुद्र फक्त अधिकच खारट होऊ शकतो.",
        },
        pair: {
          left: { en: "The sea's saltiness", hi: "समुद्र का खारापन", mr: "समुद्राचा खारटपणा" },
          right: {
            en: "35 parts per thousand",
            hi: "हज़ार में 35 हिस्से",
            mr: "हजारात 35 भाग",
          },
        },
      },
      {
        id: "fresh-water",
        name: { en: "Fresh water", hi: "मीठा (अलवण) जल", mr: "गोडे पाणी" },
        kind: "resource",
        prompt: {
          en: "Of all the Earth's water, which tiny usable share fills our rivers, wells and taps?",
          hi: "पृथ्वी के सारे पानी में से कौन-सा नन्हा उपयोगी हिस्सा हमारी नदियों, कुओं और नलों को भरता है?",
          mr: "पृथ्वीच्या साऱ्या पाण्यातला कोणता इवला वापरण्याजोगा वाटा आपल्या नद्या, विहिरी आणि नळ भरतो?",
        },
        statement: {
          en: "Fresh water is the rare fraction — most of Earth's water is salt sea, and much of the fresh is locked away in ice.",
          hi: "मीठा जल दुर्लभ अंश है — पृथ्वी का अधिकांश पानी खारा समुद्र है, और मीठे का बड़ा हिस्सा बर्फ़ में बंद।",
          mr: "गोडे पाणी हा दुर्मीळ अंश — पृथ्वीचे बहुतेक पाणी खारा समुद्र, आणि गोड्यातला मोठा वाटा बर्फात बंद.",
        },
        pair: {
          left: { en: "The drinkable fraction", hi: "पीने लायक़ अंश", mr: "पिण्याजोगा अंश" },
          right: {
            en: "rare and mostly frozen",
            hi: "दुर्लभ और प्रायः जमा हुआ",
            mr: "दुर्मीळ आणि बहुतांश गोठलेला",
          },
        },
      },
      {
        id: "tsunami",
        name: { en: "The tsunami", hi: "सुनामी", mr: "त्सुनामी" },
        kind: "motion",
        prompt: {
          en: "An undersea earthquake can hurl the ocean into which giant wave — barely a ripple in deep water, a wall at the shore?",
          hi: "समुद्र-तल का भूकंप सागर को किस विराट लहर में उछाल सकता है — गहरे पानी में मामूली सिलवट, किनारे पर दीवार?",
          mr: "समुद्रतळाचा भूकंप सागराला कोणत्या महाकाय लाटेत उधळू शकतो — खोल पाण्यात जेमतेम सुरकुती, किनाऱ्यावर भिंत?",
        },
        statement: {
          en: "A tsunami is an earthquake's wave — it crosses deep ocean almost unnoticed and rears into a wall of water at the coast.",
          hi: "सुनामी भूकंप की लहर है — गहरे सागर को लगभग अनदेखी पार करती है और तट पर पानी की दीवार बनकर उठती है।",
          mr: "त्सुनामी ही भूकंपाची लाट — खोल सागर जवळजवळ नकळत पार करते आणि किनाऱ्यावर पाण्याची भिंत होऊन उभी राहते.",
        },
        pair: {
          left: { en: "The earthquake's wave", hi: "भूकंप की लहर", mr: "भूकंपाची लाट" },
          right: {
            en: "a ripple grown into a wall",
            hi: "सिलवट से बनी दीवार",
            mr: "सुरकुतीची झालेली भिंत",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the sea's three movements: A-the twice-daily rise and fall at the beach, B-the wind-made rise and fall of the surface, C-the steady river of water inside the ocean. Which trio is right?",
          hi: "समुद्र की तीन हलचलें मिलाइए: अ-तट पर दिन में दो बार की चढ़ा-उतरी, ब-हवा की बनाई सतह की उठा-गिरी, स-सागर के भीतर पानी की सधी नदी। कौन-सी तिकड़ी सही है?",
          mr: "समुद्राच्या तीन हालचाली जुळवा: अ-किनाऱ्यावरची दिवसातून दोनदाची चढ-उतर, ब-वाऱ्याने केलेला पृष्ठाचा चढ-उतार, क-सागराच्या आतली पाण्याची स्थिर नदी. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: tides · B: waves · C: ocean currents",
            hi: "अ: ज्वार-भाटा · ब: लहरें · स: महासागरीय धाराएँ",
            mr: "अ: भरती-ओहोटी · ब: लाटा · क: सागरी प्रवाह",
          },
          {
            en: "A: waves · B: ocean currents · C: tides",
            hi: "अ: लहरें · ब: महासागरीय धाराएँ · स: ज्वार-भाटा",
            mr: "अ: लाटा · ब: सागरी प्रवाह · क: भरती-ओहोटी",
          },
          {
            en: "A: ocean currents · B: tides · C: waves",
            hi: "अ: महासागरीय धाराएँ · ब: ज्वार-भाटा · स: लहरें",
            mr: "अ: सागरी प्रवाह · ब: भरती-ओहोटी · क: लाटा",
          },
          {
            en: "A: tides · B: ocean currents · C: waves",
            hi: "अ: ज्वार-भाटा · ब: महासागरीय धाराएँ · स: लहरें",
            mr: "अ: भरती-ओहोटी · ब: सागरी प्रवाह · क: लाटा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Sort them by their engines. The Moon's pull works on a timetable — tides. The wind rubs the surface — waves. Density and steady winds drive the deep conveyor — currents. Three movements, three engines, and no two share a cause.",
          hi: "इन्हें इनके इंजनों से छाँटिए। चाँद का खिंचाव समय-सारिणी पर चलता है — ज्वार-भाटा। हवा सतह को मलती है — लहरें। घनत्व और सधी हवाएँ गहरी पट्टी चलाती हैं — धाराएँ। तीन हलचलें, तीन इंजन, और कोई दो एक कारण नहीं बाँटतीं।",
          mr: "यांना त्यांच्या इंजिनांनी निवडा. चंद्राची ओढ वेळापत्रकावर चालते — भरती-ओहोटी. वारा पृष्ठ घासतो — लाटा. घनता आणि स्थिर वारे खोल पट्टा चालवतात — प्रवाह. तीन हालचाली, तीन इंजिने, आणि कोणत्याही दोघांचे कारण एक नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The world's richest fishing grounds sit exactly where warm and cold ocean currents meet — which is also where ships most fear fog. Why does one meeting produce both gifts and danger?",
          hi: "दुनिया के सबसे समृद्ध मत्स्य-क्षेत्र ठीक वहीं हैं जहाँ गर्म और ठंडी धाराएँ मिलती हैं — और वहीं जहाज़ कोहरे से सबसे ज़्यादा डरते हैं। एक मिलन से वरदान और ख़तरा दोनों क्यों?",
          mr: "जगातली सर्वांत समृद्ध मासेमारी-क्षेत्रे नेमकी तिथे आहेत जिथे गरम आणि थंड प्रवाह भेटतात — आणि तिथेच जहाजे धुक्याला सर्वाधिक भितात. एका भेटीतून देणगी आणि धोका दोन्ही का?",
        },
        choices: [
          {
            en: "The meeting stirs nutrients up from the deep, so plankton bloom and fish crowd in — while warm damp air over cold water condenses into thick fog: one mixing, two consequences",
            hi: "मिलन गहराई से पोषक ऊपर मथ देता है, तो प्लवक खिलते हैं और मछलियाँ जुटती हैं — जबकि ठंडे पानी पर गर्म नम हवा गाढ़े कोहरे में जम जाती है: एक मिश्रण, दो नतीजे",
            mr: "भेट खोलीतून पोषके वर ढवळते, म्हणून प्लवंग फुलतात आणि मासे गर्दी करतात — तर थंड पाण्यावरची गरम दमट हवा दाट धुक्यात साकळते: एक मिसळण, दोन परिणाम",
          },
          {
            en: "Fish enjoy fog and gather to hide in it",
            hi: "मछलियों को कोहरा भाता है और वे उसमें छिपने जुटती हैं",
            mr: "माशांना धुके आवडते आणि ते त्यात लपायला जमतात",
          },
          {
            en: "It is coincidence — fog and fish have separate causes entirely",
            hi: "यह संयोग है — कोहरे और मछलियों के कारण बिलकुल अलग हैं",
            mr: "हा योगायोग — धुके आणि माशांची कारणे पूर्ण वेगळी",
          },
          {
            en: "Warm currents alone create both fish and fog",
            hi: "गर्म धाराएँ अकेले ही मछली और कोहरा दोनों बनाती हैं",
            mr: "गरम प्रवाह एकटेच मासे आणि धुके दोन्ही घडवतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One physical meeting, read twice. Below the surface, colliding waters churn — nutrients climb from the deep, plankton feast, small fish follow the plankton and big fish the small: a food chain switched on by turbulence. Above the surface, air that crossed the warm current arrives moist and meets the chill — its vapour condenses into fog banks. The fisherman's fortune and the sailor's dread are two altitudes of the same event.",
          hi: "एक भौतिक मिलन, दो बार पढ़ा हुआ। सतह के नीचे टकराते पानी मथते हैं — गहराई से पोषक चढ़ते हैं, प्लवक की दावत होती है, छोटी मछलियाँ प्लवक के पीछे और बड़ी छोटी के पीछे: हलचल से चालू हुई भोजन-शृंखला। सतह के ऊपर, गर्म धारा पार कर आई हवा नम पहुँचती है और ठंडक से मिलती है — उसकी भाप कोहरे की चादरों में जम जाती है। मछुआरे की क़िस्मत और नाविक का डर एक ही घटना की दो ऊँचाइयाँ हैं।",
          mr: "एक भौतिक भेट, दोनदा वाचलेली. पृष्ठाखाली आदळणारी पाणी घुसळतात — खोलीतून पोषके चढतात, प्लवंगांची मेजवानी होते, लहान मासे प्लवंगांमागे आणि मोठे लहानांमागे: खळबळीने सुरू झालेली अन्नसाखळी. पृष्ठावर, गरम प्रवाह ओलांडून आलेली हवा दमट पोहोचते आणि गारव्याला भेटते — तिची वाफ धुक्याच्या चादरींत साकळते. कोळ्याचे नशीब आणि खलाशाची धास्ती या एकाच घटनेच्या दोन उंची आहेत.",
        },
      },
    ],
  },
];
