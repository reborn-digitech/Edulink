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
];
