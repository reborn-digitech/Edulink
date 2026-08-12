/**
 * Class 12 Biology — NCERT, chapter by chapter.
 *
 * Class 11 biology asked what things ARE: what a species is, what a cell is
 * made of, how a body is organised. Class 12 asks what happens across
 * generations and across populations, and the questions worth setting are
 * mostly about WHY A MECHANISM IS BUILT THE WAY IT IS rather than what its
 * parts are called. Why does a flowering plant fertilise twice when once would
 * make an embryo? Why is an egg's meiosis interrupted for decades while a
 * sperm's runs to completion in weeks? Why does the same hormone suppress an
 * event at one concentration and trigger it at another? A part list answers
 * none of these, and a student who can only name the parts has learned the
 * vocabulary of the subject rather than the subject.
 *
 * `G12_BIOLOGY_NUMERIC` follows the Class 11 rule and stays empty for chapters
 * whose subject is not measured by calculation. An empty entry is a claim: it
 * says the counting in this chapter would be invented. Where the counting is
 * real — ploidy through a life cycle, Mendelian ratios, base composition — the
 * entries are there.
 *
 * Entity names avoid the Class 10 and Class 11 biology vocabulary already in
 * the bank ("Reproduction in a flower", "Heredity and variation", "Cell the
 * unit of life"). This is not those chapters restated at greater length.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";
import type { NumQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Biology (Class 12)";
const LICENCE = "CC-BY-SA-4.0";

export const G12_BIOLOGY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Sexual Reproduction in Flowering Plants                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-12-sexual-reproduction-in-flowering-plants",
    subject: "BIOLOGY",
    classLevel: 12,
    chapter: {
      en: "Chapter 1 — Sexual Reproduction in Flowering Plants",
      hi: "अध्याय 1 — पुष्पी पादपों में लैंगिक जनन",
      mr: "प्रकरण 1 — सपुष्प वनस्पतींतील लैंगिक प्रजनन",
    },
    name: {
      en: "Sexual Reproduction in Flowering Plants",
      hi: "पुष्पी पादपों में लैंगिक जनन",
      mr: "सपुष्प वनस्पतींतील लैंगिक प्रजनन",
    },
    summary: {
      en: "A plant that cannot move solving the problem of getting one gamete to another, and every structure in the flower turns out to be an answer to that problem rather than an ornament: a wall of nourishing cells around the developing pollen and a hard outer coat that survives in rock for millions of years; a female structure reduced to seven cells, which is as small as a whole organism gets and still enough; a fertilisation that happens twice in one embryo sac, the second one making a tissue that feeds an embryo which does not yet exist and would not have existed had the first failed, so that nothing is stockpiled before it is needed; a set of devices by which a flower carrying both sexes goes to considerable trouble to avoid using its own pollen, including one in which the rejection is chemical and happens after the pollen has already landed and started to grow; and one plant that abandons the whole apparatus and makes a seed with no fertilisation at all, which costs it the variation everything else was for.",
      hi: "ऐसा पादप जो हिल नहीं सकता और एक युग्मक को दूसरे तक पहुँचाने की समस्या हल कर रहा है, और पुष्प की हर संरचना उस समस्या का उत्तर निकलती है, सजावट नहीं: विकसित होते परागकण के गिर्द पोषक कोशिकाओं की दीवार और ऐसा कठोर बाहरी आवरण जो चट्टान में लाखों वर्ष टिकता है; सात कोशिकाओं तक सिमटी मादा संरचना, जो किसी पूरे जीव का जितना छोटा होना संभव है उतनी है और फिर भी पर्याप्त; एक ही भ्रूणकोष में दो बार होता निषेचन, जिसका दूसरा ऐसा ऊतक बनाता है जो उस भ्रूण को खिलाएगा जो अभी है ही नहीं और होता भी नहीं यदि पहला विफल हो जाता, अतः ज़रूरत से पहले कुछ भी जमा नहीं किया जाता; ऐसी युक्तियों का समुच्चय जिनसे दोनों लिंग ढोता पुष्प अपना ही पराग काम में लेने से बचने की काफ़ी मशक़्क़त करता है, और उनमें एक ऐसी है जिसमें अस्वीकार रासायनिक है और पराग के उतर चुकने तथा उगना शुरू कर देने के बाद होता है; और एक ऐसा पादप जो पूरा तामझाम छोड़कर बिना किसी निषेचन के बीज बना लेता है, और इसकी क़ीमत वही विविधता है जिसके लिए बाक़ी सब था।",
      mr: "अशी वनस्पती जी हलू शकत नाही आणि एका युग्मकाला दुसऱ्यापर्यंत पोहोचवण्याची समस्या सोडवत आहे, आणि फुलातली प्रत्येक रचना त्या समस्येचे उत्तर निघते, सजावट नव्हे: विकसित होणाऱ्या परागकणाभोवती पोषक पेशींची भिंत आणि असे कठीण बाह्य आवरण जे खडकात लाखो वर्षे टिकते; सात पेशींपर्यंत आक्रसलेली मादी रचना, जी कोणत्याही अख्ख्या जीवाचे जितके लहान असणे शक्य आहे तितकी आहे आणि तरीही पुरेशी; एकाच भ्रूणकोशात दोनदा घडणारे फलन, ज्याचे दुसरे असे ऊतक बनवते जे त्या भ्रूणाला खाऊ घालेल जो अजून आहेच नाही आणि पहिले अपयशी ठरले असते तर झालाही नसता, म्हणून गरजेआधी काहीही साठवले जात नाही; अशा युक्त्यांचा संच ज्यांनी दोन्ही लिंगे वाहणारे फूल आपलेच पराग वापरणे टाळण्याची बरीच खटपट करते, आणि त्यांत एक अशी आहे जिच्यात नकार रासायनिक आहे आणि पराग उतरून उगवायला लागल्यानंतर घडतो; आणि अशी एक वनस्पती जी अख्खा जामानिमा सोडून कोणत्याही फलनाविना बी बनवते, आणि याची किंमत तीच विविधता आहे जिच्यासाठी बाकी सर्व होते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-anther-wall-and-the-pollen-grain",
        name: {
          en: "The anther wall and the pollen grain",
          hi: "परागकोश भित्ति और परागकण",
          mr: "परागकोश भित्ती आणि परागकण",
        },
        kind: "structure and the problem it solves",
        prompt: {
          en: "An innermost layer of the anther that is consumed entirely in feeding the cells it surrounds, and a two-layered coat on the product, the outer one so resistant that it is recovered from rock millions of years old. What is being described?",
          hi: "परागकोश की सबसे भीतरी परत जो उन्हीं कोशिकाओं को खिलाने में पूरी तरह ख़र्च हो जाती है जिन्हें वह घेरे है, और उत्पाद पर दो-परती आवरण, जिसका बाहरी इतना प्रतिरोधी है कि वह लाखों वर्ष पुरानी चट्टान से बरामद होता है। यहाँ किसका वर्णन है?",
          mr: "परागकोशाचा सर्वांत आतला थर जो ज्या पेशींना वेढतो त्यांनाच खाऊ घालण्यात पूर्णपणे खर्च होतो, आणि उत्पादनावर दोन-थरी आवरण, ज्याचा बाहेरचा इतका प्रतिरोधक आहे की तो लाखो वर्षे जुन्या खडकातून हाती लागतो. इथे कशाचे वर्णन आहे?",
        },
        statement: {
          en: "The anther wall and the pollen grain are built for nourishment and for survival: the tapetum is used up feeding the developing microspores, and the exine of sporopollenin protects the grain in transit.",
          hi: "परागकोश भित्ति और परागकण पोषण तथा उत्तरजीविता के लिए बने हैं: टेपीटम विकसित होते लघुबीजाणुओं को खिलाने में ख़र्च हो जाता है, और स्पोरोपोलेनिन की बाह्यचोल परागकण को यात्रा में बचाती है।",
          mr: "परागकोश भित्ती आणि परागकण पोषण आणि तगून राहण्यासाठी बनलेले आहेत: टॅपेटम विकसित होणाऱ्या लघुबीजाणूंना खाऊ घालण्यात खर्च होते, आणि स्पोरोपोलेनिनचे बाह्यावरण परागकणाला प्रवासात वाचवते.",
        },
        detail: {
          en: "Sporopollenin resists acids, alkalis and enzymes and cannot be degraded by any known enzyme, which is why fossil pollen survives when everything else in a deposit has rotted.",
          hi: "स्पोरोपोलेनिन अम्लों, क्षारों और एंज़ाइमों का प्रतिरोध करता है और किसी भी ज्ञात एंज़ाइम से नहीं टूटता, इसीलिए जीवाश्म पराग तब भी बचा रहता है जब निक्षेप में बाक़ी सब गल चुका हो।",
          mr: "स्पोरोपोलेनिन आम्ले, क्षार आणि विकरांना विरोध करते आणि कोणत्याही ज्ञात विकराने तुटत नाही, म्हणूनच जीवाश्म पराग तेव्हाही टिकतो जेव्हा निक्षेपातले बाकी सर्व कुजून गेलेले असते.",
        },
        extra: {
          en: "The coat is not sealed all over: germ pores are left where the outer layer is absent, and it is through one of these that the tube emerges after the grain lands.",
          hi: "आवरण हर जगह बंद नहीं है: जनन छिद्र वहाँ छूटे रहते हैं जहाँ बाहरी परत नहीं, और परागकण के उतरने के बाद इन्हीं में से एक से नलिका निकलती है।",
          mr: "आवरण सर्वत्र बंद नाही: जनन छिद्रे तिथे उरतात जिथे बाहेरचा थर नाही, आणि परागकण उतरल्यानंतर याच पैकी एकातून नलिका बाहेर येते.",
        },
        pair: {
          left: {
            en: "A layer that dies to feed, and a coat that outlasts the rock",
            hi: "खिलाने के लिए मरती परत, और चट्टान से भी अधिक टिकता आवरण",
            mr: "खाऊ घालण्यासाठी मरणारा थर, आणि खडकाहूनही अधिक टिकणारे आवरण",
          },
          right: {
            en: "the anther wall and the pollen grain",
            hi: "परागकोश भित्ति और परागकण",
            mr: "परागकोश भित्ती आणि परागकण",
          },
        },
      },
      {
        id: "the-embryo-sac",
        name: {
          en: "The embryo sac",
          hi: "भ्रूणकोष",
          mr: "भ्रूणकोश",
        },
        kind: "structure and the problem it solves",
        prompt: {
          en: "A whole generation of an organism reduced to seven cells and eight nuclei, sitting inside the tissue of the generation before it and never leaving. What is it?",
          hi: "किसी जीव की पूरी पीढ़ी सात कोशिकाओं और आठ केंद्रकों तक सिमटी, अपने से पहली पीढ़ी के ऊतक के भीतर बैठी और कभी बाहर न निकलती। यह क्या है?",
          mr: "एखाद्या जीवाची अख्खी पिढी सात पेशी आणि आठ केंद्रकांपर्यंत आक्रसलेली, आपल्या आधीच्या पिढीच्या ऊतकाच्या आत बसलेली आणि कधीही बाहेर न पडणारी. हे काय आहे?",
        },
        statement: {
          en: "The embryo sac is the female gametophyte of a flowering plant, formed from one surviving megaspore and organised into an egg apparatus, a large central cell and three cells at the opposite end.",
          hi: "भ्रूणकोष पुष्पी पादप का मादा युग्मकोद्भिद है, जो एक बचे गुरुबीजाणु से बनता है और अंड उपकरण, एक बड़ी केंद्रीय कोशिका तथा विपरीत सिरे पर तीन कोशिकाओं में व्यवस्थित होता है।",
          mr: "भ्रूणकोश हा सपुष्प वनस्पतीचा मादी युग्मकोद्भिद आहे, जो एका उरलेल्या गुरुबीजाणूपासून बनतो आणि अंड उपकरण, एक मोठी मध्यवर्ती पेशी आणि विरुद्ध टोकाला तीन पेशींत मांडला जातो.",
        },
        detail: {
          en: "Three of the four megaspores produced by meiosis die, so the sac descends from just one, and every nucleus in it is therefore genetically identical.",
          hi: "अर्धसूत्री विभाजन से बने चार गुरुबीजाणुओं में से तीन मर जाते हैं, अतः कोष केवल एक से उतरता है, और इसलिए उसका हर केंद्रक आनुवंशिक रूप से समरूप है।",
          mr: "अर्धसूत्री विभाजनातून बनलेल्या चार गुरुबीजाणूंपैकी तीन मरतात, म्हणून कोश केवळ एकापासून उतरतो, आणि म्हणून त्यातला प्रत्येक केंद्रक आनुवंशिकदृष्ट्या सारखा आहे.",
        },
        extra: {
          en: "The synergids beside the egg secrete the chemicals that guide the pollen tube in, so the structure does not merely wait to be found — it advertises its position.",
          hi: "अंड के बग़ल की सहायक कोशिकाएँ वे रसायन स्रावित करती हैं जो परागनलिका को भीतर तक राह दिखाते हैं, अतः संरचना केवल ढूँढ़े जाने की प्रतीक्षा नहीं करती — वह अपनी जगह का विज्ञापन करती है।",
          mr: "अंडाशेजारच्या सहाय्यक पेशी ती रसायने स्रवतात जी परागनलिकेला आत वाट दाखवतात, म्हणून रचना केवळ सापडण्याची वाट पाहत नाही — ती आपल्या जागेची जाहिरात करते.",
        },
        pair: {
          left: {
            en: "An entire generation that never leaves its parent's tissue",
            hi: "ऐसी पूरी पीढ़ी जो अपने जनक के ऊतक से कभी बाहर नहीं निकलती",
            mr: "अशी अख्खी पिढी जी आपल्या जनकाच्या ऊतकातून कधीच बाहेर पडत नाही",
          },
          right: {
            en: "the embryo sac",
            hi: "भ्रूणकोष",
            mr: "भ्रूणकोश",
          },
        },
      },
      {
        id: "pollen-pistil-interaction",
        name: {
          en: "Pollen–pistil interaction",
          hi: "पराग-स्त्रीकेसर अन्योन्यक्रिया",
          mr: "पराग-स्त्रीकेसर परस्परक्रिया",
        },
        kind: "structure and the problem it solves",
        prompt: {
          en: "A landing surface that lets some arrivals grow and refuses others, the refusal being chemical and taking effect after the visitor has already attached. What is this called?",
          hi: "ऐसी उतरने की सतह जो कुछ आगंतुकों को उगने देती है और दूसरों को मना कर देती है, और मनाही रासायनिक है तथा आगंतुक के जुड़ चुकने के बाद असर करती है। इसे क्या कहते हैं?",
          mr: "अशी उतरण्याची पृष्ठभाग जी काही पाहुण्यांना उगवू देते आणि इतरांना नकार देते, आणि नकार रासायनिक आहे व पाहुणा जोडला गेल्यानंतर परिणाम करतो. याला काय म्हणतात?",
        },
        statement: {
          en: "Pollen–pistil interaction is the recognition between the arriving grain and the stigma, which admits compatible pollen and blocks the rest before or during tube growth.",
          hi: "पराग-स्त्रीकेसर अन्योन्यक्रिया आते परागकण और वर्तिकाग्र के बीच की पहचान है, जो संगत पराग को भीतर आने देती है और बाक़ी को नलिका वृद्धि से पहले या उसके दौरान रोक देती है।",
          mr: "पराग-स्त्रीकेसर परस्परक्रिया म्हणजे येणारा परागकण आणि कुक्षी यांच्यातील ओळख, जी सुसंगत परागाला आत येऊ देते आणि बाकीच्यांना नलिका वाढीआधी वा तिच्या दरम्यान अडवते.",
        },
        detail: {
          en: "The interaction is a conversation in chemicals, and its outcome depends on genes rather than on whether the grain physically fits — pollen of the wrong species may germinate and still be stopped in the style.",
          hi: "यह अन्योन्यक्रिया रसायनों में हुई बातचीत है, और उसका परिणाम इस पर निर्भर है कि जीन क्या कहते हैं, न कि इस पर कि परागकण भौतिक रूप से बैठता है या नहीं — ग़लत जाति का पराग अंकुरित हो सकता है और फिर भी वर्तिका में रोक दिया जाता है।",
          mr: "ही परस्परक्रिया रसायनांतली संभाषण आहे, आणि तिचा निकाल जनुके काय म्हणतात यावर अवलंबून आहे, परागकण भौतिकदृष्ट्या बसतो का यावर नाही — चुकीच्या जातीचा पराग अंकुरू शकतो आणि तरीही वर्तिकेत अडवला जातो.",
        },
        extra: {
          en: "It is what makes self-incompatibility possible, and a plant breeder who wants a cross the plant refuses can get round it by placing pollen directly on the ovule in culture.",
          hi: "इसी से स्व-अयोग्यता संभव होती है, और जो पादप प्रजनक ऐसा संकरण चाहता है जिसे पादप मना करता है वह पराग को संवर्धन में सीधे बीजांड पर रखकर उसे पार कर सकता है।",
          mr: "यामुळेच स्व-अयोग्यता शक्य होते, आणि ज्या वनस्पती प्रजननकर्त्याला असे संकरण हवे जे वनस्पती नाकारते तो पराग संवर्धनात थेट बीजांडावर ठेवून ते पार करू शकतो.",
        },
        pair: {
          left: {
            en: "A rejection that happens after the arrival, not before it",
            hi: "ऐसा अस्वीकार जो पहुँचने के बाद होता है, पहले नहीं",
            mr: "असा नकार जो पोहोचल्यानंतर घडतो, आधी नाही",
          },
          right: {
            en: "pollen–pistil interaction",
            hi: "पराग-स्त्रीकेसर अन्योन्यक्रिया",
            mr: "पराग-स्त्रीकेसर परस्परक्रिया",
          },
        },
      },
      {
        id: "double-fertilisation",
        name: {
          en: "Double fertilisation",
          hi: "द्विनिषेचन",
          mr: "द्विफलन",
        },
        kind: "process and what it reveals",
        prompt: {
          en: "Two male gametes delivered by one tube, one making the embryo and the other making the tissue that will feed it, so that the food supply is never built before the thing that eats it exists. Which event is this?",
          hi: "एक ही नलिका से पहुँचे दो नर युग्मक, एक भ्रूण बनाता और दूसरा वह ऊतक जो उसे खिलाएगा, अतः खाने वाले के होने से पहले भोजन का भंडार कभी नहीं बनता। यह कौन-सी घटना है?",
          mr: "एकाच नलिकेने पोहोचवलेले दोन नर युग्मक, एक भ्रूण बनवतो आणि दुसरा ते ऊतक जे त्याला खाऊ घालेल, म्हणून खाणारा अस्तित्वात येण्याआधी अन्नसाठा कधीच बनवला जात नाही. ही कोणती घटना?",
        },
        statement: {
          en: "Double fertilisation is the fusion of one male gamete with the egg and of the other with the two polar nuclei, giving a diploid zygote and a triploid primary endosperm nucleus.",
          hi: "द्विनिषेचन एक नर युग्मक का अंड से और दूसरे का दोनों ध्रुवीय केंद्रकों से संलयन है, जो द्विगुणित युग्मनज और त्रिगुणित प्राथमिक भ्रूणपोष केंद्रक देता है।",
          mr: "द्विफलन म्हणजे एका नर युग्मकाचे अंडाशी आणि दुसऱ्याचे दोन्ही ध्रुवीय केंद्रकांशी संमीलन, जे द्विगुणित युग्मनज आणि त्रिगुणित प्राथमिक भ्रूणपोष केंद्रक देते.",
        },
        detail: {
          en: "It is found in flowering plants and nowhere else, and it means the nutritive tissue is a product of fertilisation rather than a store laid down in advance.",
          hi: "यह पुष्पी पादपों में मिलता है और कहीं नहीं, और इसका अर्थ है कि पोषक ऊतक निषेचन का उत्पाद है, पहले से जमा किया गया भंडार नहीं।",
          mr: "हे सपुष्प वनस्पतींत आढळते आणि इतरत्र कुठेही नाही, आणि याचा अर्थ पोषक ऊतक फलनाचे उत्पादन आहे, आधीच साठवलेला साठा नाही.",
        },
        extra: {
          en: "A gymnosperm builds its nutritive tissue before fertilisation and wastes it whenever fertilisation fails, which is the comparison that shows what the arrangement is worth.",
          hi: "अनावृतबीजी अपना पोषक ऊतक निषेचन से पहले बनाता है और जब भी निषेचन विफल हो उसे गँवा देता है, और यही तुलना दिखाती है कि इस व्यवस्था की क़ीमत क्या है।",
          mr: "अनावृतबीजी आपले पोषक ऊतक फलनाआधी बनवते आणि जेव्हाही फलन अपयशी ठरते तेव्हा ते वाया घालवते, आणि हीच तुलना दाखवते की या व्यवस्थेची किंमत काय आहे.",
        },
        pair: {
          left: {
            en: "The larder is stocked only once there is a mouth to feed",
            hi: "भंडार तभी भरा जाता है जब खिलाने को मुँह हो",
            mr: "कोठार तेव्हाच भरले जाते जेव्हा खाऊ घालायला तोंड असते",
          },
          right: {
            en: "double fertilisation",
            hi: "द्विनिषेचन",
            mr: "द्विफलन",
          },
        },
      },
      {
        id: "outbreeding-devices",
        name: {
          en: "Outbreeding devices",
          hi: "बहिःप्रजनन युक्तियाँ",
          mr: "बहिःप्रजनन युक्त्या",
        },
        kind: "process and what it reveals",
        prompt: {
          en: "A flower carrying both sexes at once and then arranging, by timing, by position or by chemistry, not to use its own pollen. What are these arrangements called?",
          hi: "ऐसा पुष्प जो एक साथ दोनों लिंग ढोता है और फिर समय से, स्थिति से या रसायन से यह प्रबंध करता है कि अपना ही पराग काम में न आए। इन प्रबंधों को क्या कहते हैं?",
          mr: "असे फूल जे एकाच वेळी दोन्ही लिंगे वाहते आणि मग वेळेने, जागेने वा रसायनाने अशी व्यवस्था करते की आपलाच पराग वापरला जाऊ नये. या व्यवस्थांना काय म्हणतात?",
        },
        statement: {
          en: "Outbreeding devices are the arrangements by which a bisexual flower avoids self-pollination, including maturing the two sexes at different times, placing them out of each other's reach, and rejecting its own pollen chemically.",
          hi: "बहिःप्रजनन युक्तियाँ वे प्रबंध हैं जिनसे द्विलिंगी पुष्प स्व-परागण से बचता है, जिनमें दोनों लिंगों का भिन्न समय पर परिपक्व होना, उन्हें एक-दूसरे की पहुँच से बाहर रखना, और अपने ही पराग को रासायनिक रूप से अस्वीकार करना शामिल है।",
          mr: "बहिःप्रजनन युक्त्या म्हणजे ती व्यवस्था ज्यांनी द्विलिंगी फूल स्व-परागणापासून वाचते, ज्यांत दोन्ही लिंगांचे वेगळ्या वेळी परिपक्व होणे, त्यांना एकमेकांच्या आवाक्याबाहेर ठेवणे, आणि आपलाच पराग रासायनिकरीत्या नाकारणे यांचा समावेश आहे.",
        },
        detail: {
          en: "The cost is real: pollen must be produced in quantity, an agent must be paid in nectar, and a proportion of the pollen is lost, all to avoid a mating that would otherwise be free.",
          hi: "क़ीमत असली है: पराग मात्रा में बनाना पड़ता है, वाहक को मकरंद में मज़दूरी देनी पड़ती है, और पराग का एक हिस्सा नष्ट होता है, और यह सब ऐसे मिलन से बचने को जो वरना मुफ़्त होता।",
          mr: "किंमत खरी आहे: पराग प्रमाणात बनवावा लागतो, वाहकाला मकरंदात मजुरी द्यावी लागते, आणि परागाचा एक भाग वाया जातो, आणि हे सर्व अशा मीलनापासून वाचण्यासाठी जे एरवी फुकट असते.",
        },
        extra: {
          en: "The comparison that shows what is being bought is cleistogamy: a flower that never opens is guaranteed its seed and gets no new combinations at all.",
          hi: "जो दिखाता है कि ख़रीदा क्या जा रहा है वह तुलना अनुन्मील्यता है: जो पुष्प कभी खुलता ही नहीं उसका बीज पक्का है और उसे कोई नया संयोजन मिलता ही नहीं।",
          mr: "जे दाखवते की विकत काय घेतले जात आहे ती तुलना अनुन्मील्यता आहे: जे फूल कधी उघडतच नाही त्याचे बी नक्की आहे आणि त्याला कोणतेही नवे संयोजन मिळतच नाही.",
        },
        pair: {
          left: {
            en: "Considerable trouble taken to avoid the easiest option",
            hi: "सबसे आसान विकल्प से बचने को उठाई गई काफ़ी मशक़्क़त",
            mr: "सर्वांत सोपा पर्याय टाळण्यासाठी घेतलेली बरीच खटपट",
          },
          right: {
            en: "outbreeding devices",
            hi: "बहिःप्रजनन युक्तियाँ",
            mr: "बहिःप्रजनन युक्त्या",
          },
        },
      },
      {
        id: "apomixis-and-polyembryony",
        name: {
          en: "Apomixis and polyembryony",
          hi: "असंगजनन और बहुभ्रूणता",
          mr: "असंगजनन आणि बहुभ्रूणता",
        },
        kind: "process and what it reveals",
        prompt: {
          en: "Seeds produced with no fertilisation at all, and more than one embryo found inside a single seed of an orange. What are these two called?",
          hi: "बिना किसी निषेचन के बने बीज, और संतरे के एक ही बीज के भीतर मिले एक से अधिक भ्रूण। इन दोनों को क्या कहते हैं?",
          mr: "कोणत्याही फलनाविना बनलेली बिया, आणि संत्र्याच्या एकाच बियेत सापडलेले एकाहून अधिक भ्रूण. या दोघांना काय म्हणतात?",
        },
        statement: {
          en: "Apomixis and polyembryony are the production of a seed without fertilisation and the presence of more than one embryo in a seed, and both give offspring genetically identical to the parent.",
          hi: "असंगजनन और बहुभ्रूणता क्रमशः बिना निषेचन बीज का बनना और एक बीज में एक से अधिक भ्रूण का होना है, और दोनों जनक से आनुवंशिक रूप से समरूप संतति देते हैं।",
          mr: "असंगजनन आणि बहुभ्रूणता म्हणजे अनुक्रमे फलनाविना बी बनणे आणि एका बीत एकाहून अधिक भ्रूण असणे, आणि दोन्ही जनकाशी आनुवंशिकदृष्ट्या सारखी संतती देतात.",
        },
        detail: {
          en: "The extra embryos in a citrus seed arise from cells of the surrounding maternal tissue, so they carry the mother's genotype exactly and not a recombined one.",
          hi: "सिट्रस बीज के अतिरिक्त भ्रूण गिर्द के मातृ ऊतक की कोशिकाओं से उठते हैं, अतः वे माँ का जीनप्ररूप हूबहू ढोते हैं, कोई पुनर्संयोजित नहीं।",
          mr: "सिट्रस बीतले अतिरिक्त भ्रूण भोवतीच्या मातृ ऊतकाच्या पेशींतून उद्भवतात, म्हणून ते आईचा जनुकप्ररूप जसाच्या तसा वाहतात, कोणताही पुनर्संयोजित नाही.",
        },
        extra: {
          en: "This is exactly what a hybrid seed producer wants, because a hybrid's advantage is lost when it is allowed to reproduce sexually and the combination is broken up again.",
          hi: "संकर बीज उत्पादक को ठीक यही चाहिए, क्योंकि संकर को लैंगिक जनन करने दिया जाए तो संयोजन फिर बिखर जाता है और उसका लाभ चला जाता है।",
          mr: "संकरित बी उत्पादकाला नेमके हेच हवे, कारण संकरिताला लैंगिक प्रजनन करू दिले तर संयोजन पुन्हा विखुरते आणि त्याचा फायदा जातो.",
        },
        pair: {
          left: {
            en: "A seed that is a copy rather than a combination",
            hi: "ऐसा बीज जो संयोजन नहीं बल्कि नक़ल है",
            mr: "असे बी जे संयोजन नव्हे तर नक्कल आहे",
          },
          right: {
            en: "apomixis and polyembryony",
            hi: "असंगजनन और बहुभ्रूणता",
            mr: "असंगजनन आणि बहुभ्रूणता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A flowering plant fertilises twice in the same embryo sac: one male gamete makes the zygote and the other makes the nutritive tissue. A gymnosperm builds its nutritive tissue in advance and fertilises once. Explain what the flowering plant's arrangement achieves.",
          hi: "पुष्पी पादप उसी भ्रूणकोष में दो बार निषेचन करता है: एक नर युग्मक युग्मनज बनाता है और दूसरा पोषक ऊतक। अनावृतबीजी अपना पोषक ऊतक पहले से बना लेता है और एक ही बार निषेचन करता है। बताओ कि पुष्पी पादप की व्यवस्था क्या हासिल करती है।",
          mr: "सपुष्प वनस्पती त्याच भ्रूणकोशात दोनदा फलन करते: एक नर युग्मक युग्मनज बनवतो आणि दुसरा पोषक ऊतक. अनावृतबीजी आपले पोषक ऊतक आधीच बनवते आणि एकदाच फलन करते. सपुष्प वनस्पतीची व्यवस्था काय साधते ते सांगा.",
        },
        choices: [
          {
            en: "It ties the food supply to the event that creates the mouth to feed. The nutritive tissue is a product of fertilisation, so it is built only in ovules where an embryo has actually been formed, and nothing is invested in an ovule that was never fertilised. The gymnosperm commits its resources before knowing the outcome and loses them whenever fertilisation fails. The triploid nature of the tissue is part of the same logic: it carries two maternal genomes and one paternal, so a father's genes influence how much the mother invests, and the tissue develops fast because it is a feeding tissue rather than an organism",
            hi: "वह भोजन के भंडार को उसी घटना से बाँध देती है जो खिलाने को मुँह बनाती है। पोषक ऊतक निषेचन का उत्पाद है, अतः वह केवल उन्हीं बीजांडों में बनता है जहाँ सचमुच भ्रूण बना है, और ऐसे बीजांड में कुछ नहीं लगाया जाता जो कभी निषेचित हुआ ही नहीं। अनावृतबीजी परिणाम जाने बिना अपने संसाधन लगा देता है और जब भी निषेचन विफल हो उन्हें गँवा देता है। ऊतक का त्रिगुणित होना उसी तर्क का हिस्सा है: वह दो मातृ जीनोम और एक पितृ ढोता है, अतः पिता के जीन इस पर असर डालते हैं कि माँ कितना लगाए, और ऊतक तेज़ी से विकसित होता है क्योंकि वह जीव नहीं बल्कि खिलाने वाला ऊतक है",
            mr: "ती अन्नसाठ्याला त्याच घटनेशी बांधते जी खाऊ घालायला तोंड बनवते. पोषक ऊतक फलनाचे उत्पादन आहे, म्हणून ते केवळ त्याच बीजांडांत बनते जिथे खरोखर भ्रूण बनला आहे, आणि अशा बीजांडात काहीही गुंतवले जात नाही जे कधी फलित झालेच नाही. अनावृतबीजी निकाल कळण्याआधी आपली संसाधने लावते आणि जेव्हाही फलन अपयशी ठरते तेव्हा ती गमावते. ऊतकाचे त्रिगुणित असणे त्याच तर्काचा भाग आहे: ते दोन मातृ जीनोम आणि एक पितृ वाहते, म्हणून वडिलांची जनुके आई किती गुंतवते यावर परिणाम करतात, आणि ऊतक झपाट्याने विकसित होते कारण ते जीव नव्हे तर खाऊ घालणारे ऊतक आहे",
          },
          {
            en: "It doubles the chance of success, since if one fertilisation fails the other can still produce an embryo, which is why two gametes are sent rather than one",
            hi: "वह सफलता की संभावना दुगुनी कर देती है, क्योंकि यदि एक निषेचन विफल हो तो दूसरा फिर भी भ्रूण बना सकता है, इसीलिए एक के बजाय दो युग्मक भेजे जाते हैं",
            mr: "ती यशाची शक्यता दुप्पट करते, कारण एक फलन अपयशी ठरले तर दुसरे तरीही भ्रूण बनवू शकते, म्हणूनच एकाऐवजी दोन युग्मक पाठवले जातात",
          },
          {
            en: "It makes the embryo triploid, which gives it an extra set of genes and therefore more vigour than a diploid embryo would have",
            hi: "वह भ्रूण को त्रिगुणित बना देती है, जिससे उसे जीनों का एक अतिरिक्त समुच्चय और इसलिए द्विगुणित भ्रूण से अधिक ओज मिलता है",
            mr: "ती भ्रूणाला त्रिगुणित बनवते, ज्याने त्याला जनुकांचा एक अतिरिक्त संच आणि म्हणून द्विगुणित भ्रूणाहून अधिक जोम मिळतो",
          },
          {
            en: "It allows the plant to dispense with a pollen tube, since the two gametes travel independently to their separate destinations inside the ovule",
            hi: "वह पादप को परागनलिका के बिना काम चलाने देती है, चूँकि दोनों युग्मक बीजांड के भीतर अपने-अपने गंतव्य तक स्वतंत्र रूप से जाते हैं",
            mr: "ती वनस्पतीला परागनलिकेविना काम चालवू देते, कारण दोन्ही युग्मक बीजांडाच्या आत आपापल्या ठिकाणी स्वतंत्रपणे जातात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The question is not 'what happens' but 'what is it for', and the way to answer it is to compare the two arrangements on the same task. Both plants must end up with an embryo and a food supply inside a seed; the difference is the ORDER in which they commit. THE GYMNOSPERM'S ORDER. Its nutritive tissue is the female gametophyte itself, built up before any pollen arrives. That means the resources are spent on the strength of a forecast. When fertilisation does not happen — and in a wind-pollinated plant it often does not — the whole investment in that ovule is lost. The plant has paid in advance for an embryo that never came. THE FLOWERING PLANT'S ORDER. Here nothing nutritive exists until the moment of fertilisation. One male gamete fuses with the egg to give the zygote; the other fuses with the two polar nuclei to give the primary endosperm nucleus, and only then does the endosperm begin to grow. The food supply and the thing that will eat it are created by the same event. An ovule that is not fertilised simply withers, having consumed almost nothing. The saving compounds across the thousands of ovules a plant may produce in a season. WHY TRIPLOID, AND NOT MERELY DIPLOID. Two points are worth drawing out. First, the endosperm is not an organism and does not need to be a balanced one — it is a tissue whose job is to be consumed, so an unusual ploidy costs it nothing and the extra maternal set may help it grow fast. Second, and more interestingly, its paternal genome means the father has a say in how much the mother invests in this particular seed. That is a genuine conflict of interest — the mother's genes favour spreading resources evenly across all her seeds, the father's favour maximising this one — and it is now thought to be part of why endosperm development is so tightly regulated. NOTICE THE SHAPE OF THE REASONING. A structure is explained not by what it is made of but by comparing an organism that has it with one that does not, on the same problem. The gymnosperm is the control. Without it, 'double fertilisation produces a triploid endosperm' is a fact to memorise; with it, the fact becomes an answer to a question about waste. (The second option treats the two fusions as redundant backups, but they have different targets and different products; the third confuses which product is triploid — the embryo is diploid and the endosperm triploid; the fourth contradicts the observation that both gametes are delivered by a single tube.)",
          hi: "प्रश्न 'क्या होता है' नहीं बल्कि 'वह किसलिए है' है, और उसका उत्तर देने का तरीक़ा दोनों व्यवस्थाओं की उसी काम पर तुलना करना है। दोनों पादपों को बीज के भीतर भ्रूण और भोजन का भंडार लेकर निकलना है; अंतर उस क्रम का है जिसमें वे प्रतिबद्ध होते हैं। अनावृतबीजी का क्रम। उसका पोषक ऊतक स्वयं मादा युग्मकोद्भिद है, जो किसी पराग के आने से पहले खड़ा किया जाता है। इसका अर्थ है कि संसाधन एक पूर्वानुमान के बल पर ख़र्च किए जाते हैं। जब निषेचन नहीं होता — और वायुपरागित पादप में प्रायः नहीं होता — तो उस बीजांड में लगा पूरा निवेश चला जाता है। पादप ने उस भ्रूण के लिए पहले ही क़ीमत चुका दी जो कभी आया ही नहीं। पुष्पी पादप का क्रम। यहाँ निषेचन के क्षण तक कोई पोषक चीज़ है ही नहीं। एक नर युग्मक अंड से संलयित होकर युग्मनज देता है; दूसरा दोनों ध्रुवीय केंद्रकों से संलयित होकर प्राथमिक भ्रूणपोष केंद्रक देता है, और तभी भ्रूणपोष बढ़ना शुरू करता है। भोजन का भंडार और उसे खाने वाली चीज़ एक ही घटना से बनते हैं। जो बीजांड निषेचित नहीं होता वह बस मुरझा जाता है, और उसने लगभग कुछ भी नहीं खाया होता। एक मौसम में पादप जितने हज़ारों बीजांड बनाए, उन सब पर यह बचत जुड़ती जाती है। त्रिगुणित क्यों, केवल द्विगुणित क्यों नहीं। दो बातें निकालने लायक़ हैं। पहली, भ्रूणपोष जीव नहीं है और उसे संतुलित होने की ज़रूरत नहीं — वह ऐसा ऊतक है जिसका काम खाया जाना है, अतः असामान्य गुणिता उसे कुछ नहीं पड़ती और अतिरिक्त मातृ समुच्चय उसे तेज़ी से बढ़ने में मदद कर सकता है। दूसरी, और अधिक रोचक, उसका पितृ जीनोम का होना मतलब पिता का इसमें दख़ल है कि माँ इस ख़ास बीज में कितना लगाए। यह असली हितों का टकराव है — माँ के जीन संसाधनों को अपने सब बीजों में बराबर बाँटने के पक्ष में हैं, पिता के इसी एक को अधिकतम करने के — और अब यह भ्रूणपोष विकास के इतने कसकर नियंत्रित होने के कारणों में गिना जाता है। तर्क की बनावट पर ध्यान दो। किसी संरचना की व्याख्या इससे नहीं होती कि वह किस चीज़ की बनी है बल्कि उसी समस्या पर उस जीव की तुलना से जिसके पास वह है और जिसके पास नहीं। अनावृतबीजी नियंत्रण है। उसके बिना 'द्विनिषेचन त्रिगुणित भ्रूणपोष देता है' रटने का तथ्य है; उसके साथ वह तथ्य अपव्यय के बारे में पूछे प्रश्न का उत्तर बन जाता है। (दूसरा विकल्प दोनों संलयनों को अतिरेकी बैकअप मान लेता है, जबकि उनके लक्ष्य और उत्पाद भिन्न हैं; तीसरा गड्डमड्ड कर देता है कि त्रिगुणित कौन-सा उत्पाद है — भ्रूण द्विगुणित है और भ्रूणपोष त्रिगुणित; चौथा इस प्रेक्षण का खंडन करता है कि दोनों युग्मक एक ही नलिका से पहुँचाए जाते हैं।)",
          mr: "प्रश्न 'काय घडते' नसून 'ते कशासाठी आहे' असा आहे, आणि त्याचे उत्तर देण्याचा मार्ग म्हणजे दोन्ही व्यवस्थांची त्याच कामावर तुलना करणे. दोन्ही वनस्पतींना बीच्या आत भ्रूण आणि अन्नसाठा घेऊन निघायचे आहे; फरक त्या क्रमाचा आहे ज्यात त्या वचनबद्ध होतात. अनावृतबीजीचा क्रम. तिचे पोषक ऊतक स्वतः मादी युग्मकोद्भिद आहे, जो कोणताही पराग येण्याआधी उभा केला जातो. याचा अर्थ संसाधने एका अंदाजाच्या बळावर खर्च केली जातात. जेव्हा फलन होत नाही — आणि वायुपरागित वनस्पतीत बहुधा होत नाही — तेव्हा त्या बीजांडात लावलेली अख्खी गुंतवणूक जाते. वनस्पतीने त्या भ्रूणासाठी आधीच किंमत मोजली जो कधी आलाच नाही. सपुष्प वनस्पतीचा क्रम. इथे फलनाच्या क्षणापर्यंत कोणतीही पोषक गोष्ट आहेच नाही. एक नर युग्मक अंडाशी संमीलन करून युग्मनज देतो; दुसरा दोन्ही ध्रुवीय केंद्रकांशी संमीलन करून प्राथमिक भ्रूणपोष केंद्रक देतो, आणि तेव्हाच भ्रूणपोष वाढू लागते. अन्नसाठा आणि तो खाणारी गोष्ट एकाच घटनेतून बनतात. जे बीजांड फलित होत नाही ते फक्त कोमेजते, आणि त्याने जवळपास काहीही खाल्लेले नसते. एका हंगामात वनस्पती जितकी हजारो बीजांडे बनवेल, त्या सर्वांवर ही बचत जमत जाते. त्रिगुणित का, केवळ द्विगुणित का नाही. दोन बाबी काढण्याजोग्या आहेत. पहिली, भ्रूणपोष जीव नाही आणि त्याला संतुलित असण्याची गरज नाही — ते असे ऊतक आहे ज्याचे काम खाल्ले जाणे आहे, म्हणून असामान्य गुणिता त्याला काहीच पडत नाही आणि अतिरिक्त मातृ संच त्याला झपाट्याने वाढायला मदत करू शकतो. दुसरी, आणि अधिक रोचक, त्याचा पितृ जीनोम असणे म्हणजे वडिलांचा यात हस्तक्षेप आहे की आईने या विशिष्ट बीत किती लावावे. हा खरा हितसंघर्ष आहे — आईची जनुके संसाधने आपल्या सर्व बियांत समान वाटण्याच्या बाजूने आहेत, वडिलांची याच एकाला जास्तीत जास्त करण्याच्या — आणि आता हे भ्रूणपोष विकास इतका घट्ट नियंत्रित असण्याच्या कारणांत गणले जाते. युक्तिवादाच्या रचनेकडे लक्ष द्या. एखाद्या रचनेचे स्पष्टीकरण ती कशाची बनली आहे यातून होत नाही तर त्याच समस्येवर ज्या जीवाकडे ती आहे आणि ज्याच्याकडे नाही त्यांच्या तुलनेतून होते. अनावृतबीजी हे नियंत्रण आहे. त्याविना 'द्विफलन त्रिगुणित भ्रूणपोष देते' हे पाठ करण्याचे सत्य आहे; त्याच्यासह ते सत्य अपव्ययाबद्दल विचारलेल्या प्रश्नाचे उत्तर बनते. (दुसरा पर्याय दोन्ही संमीलनांना अतिरिक्त राखीव मानतो, तर त्यांची लक्ष्ये आणि उत्पादने वेगळी आहेत; तिसरा गल्लत करतो की त्रिगुणित कोणते उत्पादन आहे — भ्रूण द्विगुणित आहे आणि भ्रूणपोष त्रिगुणित; चौथा या निरीक्षणाचे खंडन करतो की दोन्ही युग्मक एकाच नलिकेने पोहोचवले जातात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Many flowers carry stamens and carpel together and could self-pollinate at no cost, yet they mature the two at different times, place them apart, or reject their own pollen chemically after it has landed. Meanwhile some plants produce closed flowers that must self-pollinate. Explain both.",
          hi: "बहुत से पुष्प पुंकेसर और स्त्रीकेसर साथ ढोते हैं और बिना किसी क़ीमत के स्व-परागण कर सकते हैं, फिर भी वे दोनों को भिन्न समय पर परिपक्व करते हैं, अलग-अलग रखते हैं, या उतर चुकने के बाद अपने ही पराग को रासायनिक रूप से अस्वीकार कर देते हैं। वहीं कुछ पादप ऐसे बंद पुष्प बनाते हैं जिन्हें स्व-परागण करना ही पड़ता है। दोनों समझाओ।",
          mr: "अनेक फुले पुंकेसर आणि स्त्रीकेसर एकत्र वाहतात आणि कोणत्याही किमतीविना स्व-परागण करू शकतात, तरीही ती दोघांना वेगळ्या वेळी परिपक्व करतात, वेगवेगळी ठेवतात, वा उतरल्यानंतर आपलाच पराग रासायनिकरीत्या नाकारतात. तर काही वनस्पती अशी बंद फुले बनवतात ज्यांना स्व-परागण करावेच लागते. दोन्ही समजावा.",
        },
        choices: [
          {
            en: "The two strategies buy different things and the choice is a trade-off, not a right answer. Outbreeding devices exist because self-pollination repeatedly produces offspring carrying two copies of the same alleles, which exposes harmful recessives and destroys the variation on which selection acts. The plant pays for avoidance in pollen, nectar and lost grains — and self-incompatibility is the most thorough method precisely because it acts on genotype rather than on timing or geometry, rejecting the plant's own pollen even when it has landed and germinated. Cleistogamy buys the opposite: a closed flower spends nothing on attraction and its seed set is assured, which is worth having where pollinators are unreliable, but it forfeits new combinations entirely. Many species hedge by making both kinds of flower",
            hi: "दोनों रणनीतियाँ भिन्न चीज़ें ख़रीदती हैं और चुनाव एक अदला-बदली है, कोई सही उत्तर नहीं। बहिःप्रजनन युक्तियाँ इसलिए हैं कि स्व-परागण बार-बार ऐसी संतति देता है जो एक ही एलील की दो प्रतियाँ ढोती है, जिससे हानिकारक अप्रभावी उजागर हो जाते हैं और वह विविधता नष्ट हो जाती है जिस पर चयन काम करता है। पादप इस बचाव की क़ीमत पराग, मकरंद और खोए कणों में चुकाता है — और स्व-अयोग्यता सबसे पूरी विधि ठीक इसलिए है कि वह समय या ज्यामिति के बजाय जीनप्ररूप पर काम करती है, और पादप के अपने पराग को उतर चुकने और अंकुरित हो जाने पर भी अस्वीकार कर देती है। अनुन्मील्यता उलटी चीज़ ख़रीदती है: बंद पुष्प आकर्षण पर कुछ ख़र्च नहीं करता और उसका बीज बनना पक्का है, जो वहाँ काम का है जहाँ परागणकर्ता भरोसे के नहीं, पर वह नए संयोजन पूरी तरह गँवा देता है। बहुत सी जातियाँ दोनों तरह के पुष्प बनाकर जोखिम बाँट लेती हैं",
            mr: "दोन्ही रणनीती वेगळ्या गोष्टी विकत घेतात आणि निवड ही तडजोड आहे, कोणतेही बरोबर उत्तर नव्हे. बहिःप्रजनन युक्त्या यासाठी आहेत की स्व-परागण वारंवार अशी संतती देते जी एकाच अ‍ॅलिलच्या दोन प्रती वाहते, ज्याने हानिकारक अप्रभावी उघड होतात आणि ती विविधता नष्ट होते जिच्यावर निवड काम करते. वनस्पती या टाळण्याची किंमत पराग, मकरंद आणि हरवलेल्या कणांत मोजते — आणि स्व-अयोग्यता सर्वांत पूर्ण पद्धत नेमकी यासाठी आहे की ती वेळ वा भूमितीऐवजी जनुकप्ररूपावर काम करते, आणि वनस्पतीचा स्वतःचा पराग उतरून अंकुरल्यावरही नाकारते. अनुन्मील्यता उलट गोष्ट विकत घेते: बंद फूल आकर्षणावर काहीही खर्च करत नाही आणि त्याचे बी बनणे नक्की आहे, जे तिथे उपयुक्त आहे जिथे परागणकर्ते भरवशाचे नाहीत, पण ते नवी संयोजने पूर्णपणे गमावते. अनेक जाती दोन्ही प्रकारची फुले बनवून जोखीम वाटून घेतात",
          },
          {
            en: "Self-pollination is avoided because a flower's own pollen is chemically defective and cannot fertilise, so outbreeding devices simply prevent a wasted attempt",
            hi: "स्व-परागण इसलिए टाला जाता है कि पुष्प का अपना पराग रासायनिक रूप से दोषपूर्ण है और निषेचन कर ही नहीं सकता, अतः बहिःप्रजनन युक्तियाँ बस एक व्यर्थ प्रयास रोक देती हैं",
            mr: "स्व-परागण यासाठी टाळले जाते की फुलाचा स्वतःचा पराग रासायनिकदृष्ट्या सदोष आहे आणि फलन करूच शकत नाही, म्हणून बहिःप्रजनन युक्त्या फक्त एक व्यर्थ प्रयत्न थांबवतात",
          },
          {
            en: "Outbreeding is always superior and cleistogamy is a defect found only in unhealthy plants, which is why it appears alongside normal flowers on the same individual",
            hi: "बहिःप्रजनन हमेशा श्रेष्ठ है और अनुन्मील्यता केवल अस्वस्थ पादपों में मिलने वाला दोष है, इसीलिए वह उसी व्यक्ति पर सामान्य पुष्पों के साथ दिखती है",
            mr: "बहिःप्रजनन नेहमी श्रेष्ठ आहे आणि अनुन्मील्यता केवळ अस्वस्थ वनस्पतींत आढळणारा दोष आहे, म्हणूनच ती त्याच व्यक्तीवर सामान्य फुलांसोबत दिसते",
          },
          {
            en: "The devices exist to increase the number of seeds, since pollen from another plant fertilises more ovules than the plant's own pollen can",
            hi: "ये युक्तियाँ बीजों की संख्या बढ़ाने के लिए हैं, चूँकि दूसरे पादप का पराग पादप के अपने पराग से अधिक बीजांडों को निषेचित करता है",
            mr: "या युक्त्या बियांची संख्या वाढवण्यासाठी आहेत, कारण दुसऱ्या वनस्पतीचा पराग वनस्पतीच्या स्वतःच्या परागाहून अधिक बीजांडे फलित करतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The puzzle is a good one because the behaviour looks wasteful. A bisexual flower has both gametes to hand; self-pollination requires no pollinator, no nectar and almost no pollen, and guarantees a result. Something must be worth all that expense. WHAT SELFING COSTS. Repeated self-pollination makes the offspring homozygous at more and more loci, because each generation halves the remaining heterozygosity. Two consequences follow. First, recessive alleles that were harmless while masked are now expressed in pairs — this is inbreeding depression, and it is why the seed from a long self-pollinated line is often visibly weaker. Second, and over the longer run more serious, the population stops generating new combinations: recombination has nothing to shuffle when both chromosomes carry the same alleles. Selection can only act on variation that exists. HOW THE DEVICES DIFFER IN THOROUGHNESS, WHICH IS THE INTERESTING PART. Dichogamy — anthers and stigma maturing at different times — is a timing solution, and it fails whenever the two windows happen to overlap. Herkogamy — placing them out of reach of each other — is a geometry solution, and a clumsy pollinator can defeat it. Self-incompatibility is different in kind: the stigma or style identifies the pollen's genotype and blocks a tube carrying an allele matching its own. It works even when the pollen has landed, hydrated and germinated. Notice what that means — the plant is not preventing contact but making a decision after inspecting what arrived, which is why it is the only one of the three that cannot be defeated by an accident of timing or a careless bee. WHY THE OPPOSITE STRATEGY ALSO EXISTS. Cleistogamous flowers never open. There is no expenditure on petals, scent or nectar, no pollen wasted in transit, and no dependence on an animal that may not arrive. In a poor season or a place where pollinators are scarce, a plant that insists on outbreeding may set no seed at all, and no seed is worse than uniform seed. The decisive observation is that many species — Viola, Oxalis, Commelina — produce BOTH kinds of flower on the same plant, chasmogamous ones early and cleistogamous ones later or under stress. That is not a defect; it is a plant taking both sides of the trade-off, buying variation when conditions allow and certainty when they do not. THE GENERAL POINT. When a trait looks costly, ask what it buys rather than assuming it is wasteful, and when two opposite traits both persist, expect a trade-off rather than one of them being a mistake. (The second option makes self-pollen defective, which the success of cleistogamy disproves; the third calls a widespread adaptive strategy a disease, and cannot explain its appearance on healthy plants; the fourth invents a fertility difference for which there is no evidence — the benefit is in the quality of the offspring, not the number of seeds.)",
          hi: "यह पहेली अच्छी है क्योंकि यह बरताव फ़िज़ूलख़र्ची लगता है। द्विलिंगी पुष्प के पास दोनों युग्मक हाथ में हैं; स्व-परागण को न परागणकर्ता चाहिए, न मकरंद, न लगभग कोई पराग, और परिणाम पक्का है। इतने ख़र्च के लायक़ कुछ तो होगा ही। स्वपरागण की क़ीमत। बार-बार स्व-परागण संतति को अधिक से अधिक स्थलों पर समयुग्मजी बना देता है, क्योंकि हर पीढ़ी बची विषमयुग्मजता आधी कर देती है। दो परिणाम निकलते हैं। पहला, वे अप्रभावी एलील जो ढके रहने तक हानिरहित थे अब जोड़ों में अभिव्यक्त होते हैं — यही अंतःप्रजनन अवनमन है, और इसीलिए लंबे समय तक स्व-परागित वंशक्रम का बीज प्रायः दिखने में ही कमज़ोर होता है। दूसरा, और लंबी दौड़ में अधिक गंभीर, आबादी नए संयोजन बनाना बंद कर देती है: जब दोनों गुणसूत्र वही एलील ढोते हों तो पुनर्संयोजन के पास फेंटने को कुछ नहीं। चयन केवल उसी विविधता पर काम कर सकता है जो मौजूद हो। युक्तियाँ पूर्णता में कैसे भिन्न हैं, और यही रोचक हिस्सा है। भिन्नकालपक्वता — परागकोश और वर्तिकाग्र का भिन्न समय पर परिपक्व होना — समय का हल है, और जब भी दोनों खिड़कियाँ संयोग से ऊपर-नीचे पड़ जाएँ वह विफल हो जाता है। हर्कोगैमी — उन्हें एक-दूसरे की पहुँच से बाहर रखना — ज्यामिति का हल है, और भोंडा परागणकर्ता उसे हरा सकता है। स्व-अयोग्यता क़िस्म से ही भिन्न है: वर्तिकाग्र या वर्तिका पराग का जीनप्ररूप पहचानती है और ऐसी नलिका रोक देती है जो अपने ही जैसा एलील ढोती हो। वह तब भी चलती है जब पराग उतर, जलयोजित हो और अंकुरित हो चुका हो। ध्यान दो इसका अर्थ क्या है — पादप संपर्क रोक नहीं रहा बल्कि जो आया उसे जाँचकर निर्णय ले रहा है, इसीलिए तीनों में केवल यही है जिसे समय की दुर्घटना या लापरवाह मधुमक्खी हरा नहीं सकती। उलटी रणनीति भी क्यों है। अनुन्मील्य पुष्प कभी खुलते ही नहीं। न पंखुड़ियों, सुगंध या मकरंद पर ख़र्च, न यात्रा में पराग की बर्बादी, न ऐसे प्राणी पर निर्भरता जो शायद आए ही नहीं। ख़राब मौसम में या ऐसी जगह जहाँ परागणकर्ता कम हों, बहिःप्रजनन पर अड़ा पादप शायद बीज बनाए ही नहीं, और एक जैसे बीज से भी बुरा है कोई बीज न होना। निर्णायक प्रेक्षण यह कि बहुत सी जातियाँ — वायोला, ऑक्सैलिस, कॉमेलाइना — एक ही पादप पर दोनों तरह के पुष्प बनाती हैं, पहले उन्मील्य और बाद में या दबाव में अनुन्मील्य। वह दोष नहीं; वह पादप का अदला-बदली के दोनों पक्ष ले लेना है, परिस्थिति दे तो विविधता ख़रीदना और न दे तो निश्चितता। सामान्य बात। जब कोई लक्षण महँगा दिखे, तो यह मानने के बजाय कि वह फ़िज़ूल है पूछो कि वह ख़रीदता क्या है, और जब दो उलटे लक्षण दोनों टिके रहें, तो एक के ग़लती होने के बजाय अदला-बदली की अपेक्षा करो। (दूसरा विकल्प स्वपराग को दोषपूर्ण बना देता है, जिसे अनुन्मील्यता की सफलता ग़लत सिद्ध करती है; तीसरा एक व्यापक अनुकूली रणनीति को रोग कह देता है, और स्वस्थ पादपों पर उसकी उपस्थिति नहीं समझा सकता; चौथा ऐसा प्रजननक्षमता अंतर गढ़ता है जिसका कोई प्रमाण नहीं — लाभ संतति की गुणवत्ता में है, बीजों की संख्या में नहीं।)",
          mr: "हे कोडे चांगले आहे कारण हे वर्तन उधळपट्टीचे वाटते. द्विलिंगी फुलाकडे दोन्ही युग्मक हाताशी आहेत; स्व-परागणाला परागणकर्ता नको, मकरंद नको, जवळपास पराग नको, आणि निकाल नक्की. इतक्या खर्चाला योग्य असे काहीतरी असलेच पाहिजे. स्वपरागणाची किंमत. वारंवार स्व-परागण संततीला अधिकाधिक स्थळांवर समयुग्मजी बनवते, कारण प्रत्येक पिढी उरलेली विषमयुग्मजता निम्मी करते. दोन परिणाम निघतात. पहिला, ती अप्रभावी अ‍ॅलिले जी झाकलेली असेपर्यंत निरुपद्रवी होती ती आता जोड्यांत व्यक्त होतात — हेच अंतःप्रजनन अवनमन आहे, आणि म्हणूनच दीर्घकाळ स्व-परागित वंशाचे बी बहुधा दिसण्यातच दुर्बल असते. दुसरा, आणि लांब पल्ल्यात अधिक गंभीर, लोकसंख्या नवी संयोजने बनवणे थांबवते: जेव्हा दोन्ही गुणसूत्रे तीच अ‍ॅलिले वाहतात तेव्हा पुनर्संयोजनाकडे पिसायला काही नाही. निवड केवळ त्याच विविधतेवर काम करू शकते जी अस्तित्वात असेल. युक्त्या पूर्णतेत कशा वेगळ्या आहेत, आणि हाच रोचक भाग आहे. भिन्नकालपक्वता — परागकोश आणि कुक्षीचे वेगळ्या वेळी परिपक्व होणे — वेळेचे उत्तर आहे, आणि जेव्हाही दोन्ही खिडक्या योगायोगाने एकावर एक येतील तेव्हा ते अपयशी ठरते. हर्कोगॅमी — त्यांना एकमेकांच्या आवाक्याबाहेर ठेवणे — भूमितीचे उत्तर आहे, आणि अनाड़ी परागणकर्ता ते हरवू शकतो. स्व-अयोग्यता प्रकारानेच वेगळी आहे: कुक्षी वा वर्तिका परागाचा जनुकप्ररूप ओळखते आणि अशी नलिका अडवते जी स्वतःसारखेच अ‍ॅलिल वाहते. ती तेव्हाही चालते जेव्हा पराग उतरून, जलयोजित होऊन अंकुरलेला असतो. याचा अर्थ काय ते लक्षात घ्या — वनस्पती संपर्क रोखत नाही तर जो आला त्याची तपासणी करून निर्णय घेत आहे, म्हणूनच तिघांत केवळ हीच अशी आहे जिला वेळेचा अपघात वा निष्काळजी मधमाशी हरवू शकत नाही. उलट रणनीतीही का आहे. अनुन्मील्य फुले कधी उघडतच नाहीत. पाकळ्या, सुगंध वा मकरंदावर खर्च नाही, प्रवासात परागाची नासाडी नाही, आणि कदाचित न येणाऱ्या प्राण्यावर अवलंबित्व नाही. वाईट हंगामात वा जिथे परागणकर्ते कमी आहेत अशा जागी, बहिःप्रजननावर अडून बसलेली वनस्पती कदाचित बीच बनवणार नाही, आणि एकसारख्या बियांहूनही वाईट म्हणजे कोणतेच बी नसणे. निर्णायक निरीक्षण हे की अनेक जाती — व्हायोला, ऑक्झॅलिस, कॉमेलायना — एकाच वनस्पतीवर दोन्ही प्रकारची फुले बनवतात, आधी उन्मील्य आणि नंतर वा ताणाखाली अनुन्मील्य. तो दोष नाही; ते वनस्पतीचे तडजोडीच्या दोन्ही बाजू घेणे आहे, परिस्थिती देईल तेव्हा विविधता विकत घेणे आणि न देईल तेव्हा निश्चितता. सर्वसाधारण मुद्दा. जेव्हा एखादे लक्षण महाग दिसते, तेव्हा ते उधळपट्टी आहे असे गृहीत धरण्याऐवजी ते काय विकत घेते ते विचारा, आणि जेव्हा दोन उलट लक्षणे दोन्ही टिकून राहतात, तेव्हा त्यांपैकी एक चूक असण्याऐवजी तडजोडीची अपेक्षा करा. (दुसरा पर्याय स्वपरागाला सदोष बनवतो, ज्याला अनुन्मील्यतेचे यश खोटे ठरवते; तिसरा एका व्यापक अनुकूली रणनीतीला रोग म्हणतो, आणि निरोगी वनस्पतींवरची तिची उपस्थिती समजावू शकत नाही; चौथा असा प्रजननक्षमतेचा फरक घडवतो ज्याचा कोणताही पुरावा नाही — फायदा संततीच्या गुणवत्तेत आहे, बियांच्या संख्येत नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Human Reproduction                                          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-12-human-reproduction",
    subject: "BIOLOGY",
    classLevel: 12,
    chapter: {
      en: "Chapter 2 — Human Reproduction",
      hi: "अध्याय 2 — मानव जनन",
      mr: "प्रकरण 2 — मानवी प्रजनन",
    },
    name: {
      en: "Human Reproduction",
      hi: "मानव जनन",
      mr: "मानवी प्रजनन",
    },
    summary: {
      en: "The same process of making gametes run in two bodies and arranged completely differently, and the difference turns out to follow from what each gamete costs: one is small and made continuously in enormous numbers from cells that keep dividing for a lifetime, the other is large and expensive and comes from a stock laid down before birth and never added to, its division interrupted for decades and completed only if it is fertilised, so that meiosis in one sex is a process and in the other a pause; a cycle governed by a loop in which the same hormone suppresses the gland above it at low concentration and provokes it at high, which is not an inconsistency but the switch that makes a surge possible at one moment of the month and not the rest; a structure grown for a few months and then discarded that is both an organ of exchange and a gland outproducing several permanent ones; and an implantation that succeeds only because the tissue it invades stops treating it as foreign.",
      hi: "युग्मक बनाने की वही प्रक्रिया दो शरीरों में चलती और बिलकुल भिन्न ढंग से जमाई गई, और अंतर इससे निकलता है कि हर युग्मक की क़ीमत क्या है: एक छोटा है और उन कोशिकाओं से लगातार विशाल संख्या में बनता है जो जीवन भर विभाजित होती रहती हैं, दूसरा बड़ा और महँगा है और उस भंडार से आता है जो जन्म से पहले जमा हुआ और जिसमें फिर कभी कुछ नहीं जुड़ा, और उसका विभाजन दशकों तक रुका रहता है तथा तभी पूरा होता है जब वह निषेचित हो, अतः अर्धसूत्री विभाजन एक लिंग में प्रक्रिया है और दूसरे में ठहराव; ऐसे लूप से शासित चक्र जिसमें वही हार्मोन कम सांद्रता पर अपने ऊपर की ग्रंथि को दबाता और अधिक पर उकसाता है, जो असंगति नहीं बल्कि वही स्विच है जो महीने के एक क्षण पर उछाल संभव बनाता है और बाक़ी पर नहीं; कुछ महीनों के लिए उगाई और फिर फेंकी गई ऐसी संरचना जो विनिमय का अंग भी है और कई स्थायी ग्रंथियों से अधिक उत्पादन करती ग्रंथि भी; और ऐसा रोपण जो केवल इसलिए सफल होता है कि जिस ऊतक में वह घुसता है वह उसे पराया मानना छोड़ देता है।",
      mr: "युग्मके बनवण्याची तीच प्रक्रिया दोन शरीरांत चालते आणि पूर्णपणे वेगळ्या प्रकारे मांडलेली, आणि फरक यातून निघतो की प्रत्येक युग्मकाची किंमत काय आहे: एक लहान आहे आणि त्या पेशींतून सतत प्रचंड संख्येने बनतो ज्या आयुष्यभर विभाजित होत राहतात, दुसरा मोठा आणि महाग आहे आणि त्या साठ्यातून येतो जो जन्माआधी जमला आणि ज्यात पुन्हा कधीही काही जोडले गेले नाही, आणि त्याचे विभाजन दशके थांबलेले राहते व तेव्हाच पूर्ण होते जेव्हा तो फलित होतो, म्हणून अर्धसूत्री विभाजन एका लिंगात प्रक्रिया आहे आणि दुसऱ्यात थांबा; अशा लूपने चालवलेले चक्र ज्यात तेच संप्रेरक कमी संहतीवर आपल्यावरच्या ग्रंथीला दाबते आणि जास्तवर चिथावते, जे विसंगती नसून तोच स्विच आहे जो महिन्याच्या एका क्षणी उसळी शक्य करतो आणि बाकीच्यांवर नाही; काही महिन्यांसाठी वाढवलेली आणि मग टाकून दिलेली अशी रचना जी देवाणघेवाणीचा अवयवही आहे आणि कित्येक कायम ग्रंथींहून अधिक उत्पादन करणारी ग्रंथीही; आणि असे रोपण जे केवळ यासाठी यशस्वी होते की ज्या ऊतकात ते शिरते ते त्याला परके मानणे सोडते.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-seminiferous-tubule",
        name: {
          en: "The seminiferous tubule and its two helper cells",
          hi: "शुक्रजनक नलिका और उसकी दो सहायक कोशिकाएँ",
          mr: "शुक्रजनक नलिका आणि तिच्या दोन सहाय्यक पेशी",
        },
        kind: "structure and its role",
        prompt: {
          en: "A coiled tube in which one kind of cell nurses the dividing cells and forms a barrier around them, while another kind sits outside the tube altogether and makes the hormone. What is being described?",
          hi: "ऐसी कुंडलित नलिका जिसमें एक क़िस्म की कोशिका विभाजित होती कोशिकाओं को पालती है और उनके गिर्द अवरोध बनाती है, जबकि दूसरी क़िस्म नलिका से बिलकुल बाहर बैठकर हार्मोन बनाती है। यहाँ किसका वर्णन है?",
          mr: "अशी वेटोळी नलिका जिच्यात एका प्रकारची पेशी विभाजित होणाऱ्या पेशींना पोसते आणि त्यांच्याभोवती अडसर बनवते, तर दुसरा प्रकार नलिकेच्या पूर्ण बाहेर बसून संप्रेरक बनवतो. इथे कशाचे वर्णन आहे?",
        },
        statement: {
          en: "The seminiferous tubule is where sperm are made, with Sertoli cells inside nourishing the developing cells and Leydig cells outside secreting testosterone.",
          hi: "शुक्रजनक नलिका वह जगह है जहाँ शुक्राणु बनते हैं, जिसके भीतर सर्टोली कोशिकाएँ विकसित होती कोशिकाओं को पोषण देती हैं और बाहर लेडिग कोशिकाएँ टेस्टोस्टेरोन स्रावित करती हैं।",
          mr: "शुक्रजनक नलिका ही ती जागा आहे जिथे शुक्राणू बनतात, जिच्या आत सर्टोली पेशी विकसित होणाऱ्या पेशींना पोषण देतात आणि बाहेर लेडिग पेशी टेस्टोस्टेरोन स्रवतात.",
        },
        detail: {
          en: "The Sertoli cells join to each other so tightly that they seal the developing cells off from the bloodstream, which matters because those cells appear long after the immune system has learned what belongs to the body.",
          hi: "सर्टोली कोशिकाएँ आपस में इतनी कसकर जुड़ती हैं कि वे विकसित होती कोशिकाओं को रक्तप्रवाह से सील कर देती हैं, और यह इसलिए मायने रखता है कि वे कोशिकाएँ प्रतिरक्षा तंत्र के यह सीख लेने के बहुत बाद प्रकट होती हैं कि शरीर का अपना क्या है।",
          mr: "सर्टोली पेशी परस्पर इतक्या घट्ट जोडल्या जातात की त्या विकसित होणाऱ्या पेशींना रक्तप्रवाहापासून बंद करतात, आणि हे यासाठी महत्त्वाचे की त्या पेशी प्रतिकारशक्तीने शरीराचे स्वतःचे काय आहे हे शिकल्यानंतर कितीतरी उशिरा प्रकट होतात.",
        },
        extra: {
          en: "The whole organ sits outside the body cavity because the process needs a temperature a couple of degrees below the body's, which is why an undescended testis does not produce sperm.",
          hi: "पूरा अंग शरीर गुहा से बाहर बैठता है क्योंकि इस प्रक्रिया को शरीर से दो-एक अंश नीचे ताप चाहिए, इसीलिए जो वृषण नीचे नहीं उतरा वह शुक्राणु नहीं बनाता।",
          mr: "अख्खा अवयव शरीरगुहेबाहेर बसतो कारण या प्रक्रियेला शरीराहून दोनेक अंश खालचे तापमान लागते, म्हणूनच जो वृषण खाली उतरला नाही तो शुक्राणू बनवत नाही.",
        },
        pair: {
          left: {
            en: "A nurse inside the tube and a hormone factory outside it",
            hi: "नलिका के भीतर धाय और बाहर हार्मोन का कारख़ाना",
            mr: "नलिकेच्या आत दाई आणि बाहेर संप्रेरकाचा कारखाना",
          },
          right: {
            en: "the seminiferous tubule and its two helper cells",
            hi: "शुक्रजनक नलिका और उसकी दो सहायक कोशिकाएँ",
            mr: "शुक्रजनक नलिका आणि तिच्या दोन सहाय्यक पेशी",
          },
        },
      },
      {
        id: "the-ovarian-follicle",
        name: {
          en: "The ovarian follicle",
          hi: "अंडाशयी पुटक",
          mr: "अंडाशयी पुटक",
        },
        kind: "structure and its role",
        prompt: {
          en: "A fluid-filled structure that grows around one cell, releases it, and then does not disappear but converts into a temporary gland whose survival decides what happens next. What is it?",
          hi: "ऐसी द्रव भरी संरचना जो एक कोशिका के गिर्द बढ़ती है, उसे छोड़ देती है, और फिर ग़ायब नहीं होती बल्कि ऐसी अस्थायी ग्रंथि में बदल जाती है जिसका बचना तय करता है कि आगे क्या होगा। यह क्या है?",
          mr: "अशी द्रवभरली रचना जी एका पेशीभोवती वाढते, तिला सोडते, आणि मग नाहीशी होत नाही तर अशा तात्पुरत्या ग्रंथीत बदलते जिचे टिकणे पुढे काय होईल हे ठरवते. ही काय आहे?",
        },
        statement: {
          en: "The ovarian follicle is the structure that grows around a developing egg, ruptures to release it, and then becomes the corpus luteum, a temporary gland secreting progesterone.",
          hi: "अंडाशयी पुटक वह संरचना है जो विकसित होते अंड के गिर्द बढ़ती है, फटकर उसे छोड़ती है, और फिर कॉर्पस ल्यूटियम बन जाती है, जो प्रोजेस्टेरोन स्रावित करती अस्थायी ग्रंथि है।",
          mr: "अंडाशयी पुटक ही ती रचना आहे जी विकसित होणाऱ्या अंडाभोवती वाढते, फुटून त्याला सोडते, आणि मग कॉर्पस ल्युटियम बनते, जी प्रोजेस्टेरॉन स्रवणारी तात्पुरती ग्रंथी आहे.",
        },
        detail: {
          en: "That gland maintains the lining of the uterus, so whether it survives or breaks down is what decides between a continuing pregnancy and a period.",
          hi: "वही ग्रंथि गर्भाशय की परत बनाए रखती है, अतः वह बचती है या टूटती है यही तय करता है कि गर्भ चलेगा या मासिक धर्म आएगा।",
          mr: "तीच ग्रंथी गर्भाशयाचे अस्तर टिकवते, म्हणून ती टिकते की मोडते हेच ठरवते की गर्भ चालेल की मासिक पाळी येईल.",
        },
        extra: {
          en: "Many follicles begin growing in each cycle and all but one degenerate, so the ovary discards far more than it ever releases.",
          hi: "हर चक्र में कई पुटक बढ़ना शुरू करते हैं और एक को छोड़ बाक़ी सब क्षय हो जाते हैं, अतः अंडाशय जितना छोड़ता है उससे कहीं अधिक फेंक देता है।",
          mr: "प्रत्येक चक्रात कित्येक पुटके वाढू लागतात आणि एक सोडून बाकी सर्व क्षय पावतात, म्हणून अंडाशय जितके सोडते त्याहून कितीतरी अधिक टाकून देते.",
        },
        pair: {
          left: {
            en: "A container that becomes a gland after emptying",
            hi: "ऐसा पात्र जो ख़ाली होने के बाद ग्रंथि बन जाता है",
            mr: "असे पात्र जे रिकामे झाल्यावर ग्रंथी बनते",
          },
          right: {
            en: "the ovarian follicle",
            hi: "अंडाशयी पुटक",
            mr: "अंडाशयी पुटक",
          },
        },
      },
      {
        id: "the-placenta",
        name: {
          en: "The placenta",
          hi: "अपरा",
          mr: "वार",
        },
        kind: "structure and its role",
        prompt: {
          en: "An organ built for a few months and then thrown away, which exchanges gases and wastes between two circulations that never mix, and which also outproduces several permanent glands. What is it?",
          hi: "ऐसा अंग जो कुछ महीनों के लिए बनाया और फिर फेंक दिया जाता है, जो दो ऐसे परिसंचरणों के बीच गैसों और अपशिष्टों का विनिमय करता है जो कभी मिलते नहीं, और जो कई स्थायी ग्रंथियों से अधिक उत्पादन भी करता है। यह क्या है?",
          mr: "असा अवयव जो काही महिन्यांसाठी बनवला आणि मग फेकून दिला जातो, जो दोन अशा रक्ताभिसरणांमध्ये वायू आणि टाकाऊ पदार्थांची देवाणघेवाण करतो जी कधी मिसळत नाहीत, आणि जो कित्येक कायम ग्रंथींहून अधिक उत्पादनही करतो. हा काय आहे?",
        },
        statement: {
          en: "The placenta is the temporary organ connecting the foetus to the uterine wall, carrying out exchange between two separate circulations and secreting hormones of its own.",
          hi: "अपरा वह अस्थायी अंग है जो भ्रूण को गर्भाशय भित्ति से जोड़ता है, दो अलग परिसंचरणों के बीच विनिमय करता है और अपने हार्मोन भी स्रावित करता है।",
          mr: "वार हा तो तात्पुरता अवयव आहे जो गर्भाला गर्भाशय भित्तीशी जोडतो, दोन वेगळ्या रक्ताभिसरणांमध्ये देवाणघेवाण करतो आणि आपली स्वतःची संप्रेरकेही स्रवतो.",
        },
        detail: {
          en: "The two blood supplies come close enough to exchange by diffusion but are never joined, which keeps the mother's immune cells and pressure away from the foetus.",
          hi: "दोनों रक्त आपूर्तियाँ विसरण से विनिमय भर पास आती हैं पर कभी जुड़ती नहीं, जिससे माँ की प्रतिरक्षा कोशिकाएँ और दाब भ्रूण से दूर रहते हैं।",
          mr: "दोन्ही रक्तपुरवठे विसरणाने देवाणघेवाणीपुरते जवळ येतात पण कधीच जोडले जात नाहीत, ज्याने आईच्या प्रतिकारपेशी आणि दाब गर्भापासून दूर राहतात.",
        },
        extra: {
          en: "Its hormone output is what allows the corpus luteum to be dispensed with after the first few months, and one of those hormones is what a pregnancy test detects.",
          hi: "उसका हार्मोन उत्पादन ही पहले कुछ महीनों के बाद कॉर्पस ल्यूटियम के बिना काम चलने देता है, और उन्हीं हार्मोनों में से एक को गर्भ परीक्षण पकड़ता है।",
          mr: "त्याचे संप्रेरक उत्पादनच पहिल्या काही महिन्यांनंतर कॉर्पस ल्युटियमविना काम चालू देते, आणि त्याच संप्रेरकांपैकी एक गर्भ चाचणी पकडते.",
        },
        pair: {
          left: {
            en: "Two bloodstreams close enough to trade and never to touch",
            hi: "दो रक्तधाराएँ लेन-देन भर पास और छूने को कभी नहीं",
            mr: "दोन रक्तप्रवाह देवाणघेवाणीपुरते जवळ आणि स्पर्शाला कधीच नाही",
          },
          right: {
            en: "the placenta",
            hi: "अपरा",
            mr: "वार",
          },
        },
      },
      {
        id: "spermatogenesis-against-oogenesis",
        name: {
          en: "Spermatogenesis against oogenesis",
          hi: "शुक्रजनन बनाम अंडजनन",
          mr: "शुक्रजनन विरुद्ध अंडजनन",
        },
        kind: "process and what it costs",
        prompt: {
          en: "One process runs continuously from puberty and yields four usable products from every starting cell; the other begins before birth, stops twice, and yields one usable product and three discarded ones. Which comparison is this?",
          hi: "एक प्रक्रिया यौवनारंभ से लगातार चलती है और हर आरंभिक कोशिका से चार काम के उत्पाद देती है; दूसरी जन्म से पहले शुरू होती है, दो बार रुकती है, और एक काम का तथा तीन फेंके गए उत्पाद देती है। यह कौन-सी तुलना है?",
          mr: "एक प्रक्रिया यौवनारंभापासून सतत चालते आणि प्रत्येक प्रारंभिक पेशीपासून चार उपयुक्त उत्पादने देते; दुसरी जन्माआधी सुरू होते, दोनदा थांबते, आणि एक उपयुक्त व तीन टाकून दिलेली उत्पादने देते. ही कोणती तुलना?",
        },
        statement: {
          en: "Spermatogenesis against oogenesis is the comparison of two versions of the same meiosis, one continuous and symmetrical, the other interrupted and unequal.",
          hi: "शुक्रजनन बनाम अंडजनन उसी अर्धसूत्री विभाजन के दो रूपों की तुलना है, एक लगातार और सममित, दूसरा बाधित और असमान।",
          mr: "शुक्रजनन विरुद्ध अंडजनन ही त्याच अर्धसूत्री विभाजनाच्या दोन आवृत्त्यांची तुलना आहे, एक सतत आणि सममित, दुसरी खंडित आणि असमान.",
        },
        detail: {
          en: "The unequal division keeps almost all the cytoplasm in one cell, because an egg must supply everything the first days of an embryo will need and a polar body needs nothing.",
          hi: "असमान विभाजन लगभग सारा कोशिकाद्रव्य एक ही कोशिका में रखता है, क्योंकि अंड को वह सब देना है जो भ्रूण के पहले दिनों को चाहिए और ध्रुवीय काय को कुछ नहीं चाहिए।",
          mr: "असमान विभाजन जवळपास अख्खे पेशीद्रव्य एकाच पेशीत ठेवते, कारण अंडाला ते सर्व द्यायचे आहे जे भ्रूणाच्या पहिल्या दिवसांना लागेल आणि ध्रुवीय कायेला काहीही लागत नाही.",
        },
        extra: {
          en: "The second interruption is only released if fertilisation happens, so the egg completes its meiosis after the sperm has entered and not before.",
          hi: "दूसरा ठहराव तभी छूटता है जब निषेचन हो, अतः अंड अपना अर्धसूत्री विभाजन शुक्राणु के भीतर आने के बाद पूरा करता है, पहले नहीं।",
          mr: "दुसरा थांबा तेव्हाच सुटतो जेव्हा फलन होते, म्हणून अंड आपले अर्धसूत्री विभाजन शुक्राणू आत आल्यानंतर पूर्ण करते, आधी नाही.",
        },
        pair: {
          left: {
            en: "Four useful products, or one useful and three thrown away",
            hi: "चार काम के उत्पाद, या एक काम का और तीन फेंके गए",
            mr: "चार उपयुक्त उत्पादने, वा एक उपयुक्त आणि तीन टाकून दिलेली",
          },
          right: {
            en: "spermatogenesis against oogenesis",
            hi: "शुक्रजनन बनाम अंडजनन",
            mr: "शुक्रजनन विरुद्ध अंडजनन",
          },
        },
      },
      {
        id: "hormonal-control-of-the-menstrual-cycle",
        name: {
          en: "Hormonal control of the menstrual cycle",
          hi: "आर्तव चक्र का हार्मोनी नियंत्रण",
          mr: "आर्तव चक्राचे संप्रेरकी नियंत्रण",
        },
        kind: "process and what it costs",
        prompt: {
          en: "A loop in which the same hormone holds the gland above it down for most of the month and then, once it passes a threshold, drives that gland into a sudden surge. What is being controlled?",
          hi: "ऐसा लूप जिसमें वही हार्मोन महीने के अधिकांश समय अपने ऊपर की ग्रंथि को दबाए रखता है और फिर, किसी देहली को पार करते ही, उसी ग्रंथि को अचानक उछाल में धकेल देता है। यहाँ किसका नियंत्रण हो रहा है?",
          mr: "असा लूप ज्यात तेच संप्रेरक महिन्याचा बहुतांश काळ आपल्यावरच्या ग्रंथीला दाबून ठेवते आणि मग, एखादा उंबरठा ओलांडताच, त्याच ग्रंथीला अचानक उसळीत ढकलते. इथे कशाचे नियंत्रण होत आहे?",
        },
        statement: {
          en: "Hormonal control of the menstrual cycle works by feedback that is negative at low oestrogen and positive at high, so a steady rise ends in a sudden surge of luteinising hormone.",
          hi: "आर्तव चक्र का हार्मोनी नियंत्रण ऐसी पुनर्भरण से चलता है जो कम एस्ट्रोजन पर ऋणात्मक और अधिक पर धनात्मक है, अतः लगातार बढ़त ल्यूटिनाइजिंग हार्मोन की अचानक उछाल पर ख़त्म होती है।",
          mr: "आर्तव चक्राचे संप्रेरकी नियंत्रण अशा पुनर्भरणाने चालते जे कमी इस्ट्रोजनवर ऋण आणि जास्तवर धन आहे, म्हणून सतत वाढ ल्युटिनायझिंग संप्रेरकाच्या अचानक उसळीवर संपते.",
        },
        detail: {
          en: "It is the switch from one sign to the other that makes ovulation an event rather than a gradual leak, and the surge is what ruptures the follicle.",
          hi: "एक चिह्न से दूसरे में यही पलटाव अंडोत्सर्ग को धीरे-धीरे रिसने के बजाय एक घटना बनाता है, और वही उछाल पुटक को फाड़ती है।",
          mr: "एका चिन्हावरून दुसऱ्यावरचे हेच पलटणे अंडोत्सर्गाला हळूहळू झिरपण्याऐवजी एक घटना बनवते, आणि तीच उसळी पुटक फोडते.",
        },
        extra: {
          en: "Progesterone from the corpus luteum then suppresses the whole axis again, which is exactly what a combined oral contraceptive imitates.",
          hi: "फिर कॉर्पस ल्यूटियम से आया प्रोजेस्टेरोन पूरे अक्ष को दोबारा दबा देता है, और संयुक्त मुख गर्भनिरोधक ठीक इसी की नक़ल करता है।",
          mr: "मग कॉर्पस ल्युटियमकडून आलेले प्रोजेस्टेरॉन अख्खा अक्ष पुन्हा दाबते, आणि संयुक्त मुखी गर्भनिरोधक नेमकी याचीच नक्कल करते.",
        },
        pair: {
          left: {
            en: "The same signal suppresses at low level and triggers at high",
            hi: "वही संकेत कम स्तर पर दबाता और अधिक पर छेड़ता है",
            mr: "तेच संकेत कमी पातळीवर दाबते आणि जास्तवर चेतवते",
          },
          right: {
            en: "hormonal control of the menstrual cycle",
            hi: "आर्तव चक्र का हार्मोनी नियंत्रण",
            mr: "आर्तव चक्राचे संप्रेरकी नियंत्रण",
          },
        },
      },
      {
        id: "fertilisation-and-implantation",
        name: {
          en: "Fertilisation and implantation",
          hi: "निषेचन और अंतर्रोपण",
          mr: "फलन आणि अंतर्रोपण",
        },
        kind: "process and what it costs",
        prompt: {
          en: "An entry that must happen once and be barred to everyone afterwards, followed some days later by a ball of cells burrowing into a wall that has been made ready for it. Which pair of events is this?",
          hi: "ऐसा प्रवेश जो एक बार होना ही चाहिए और उसके बाद सबके लिए बंद, और कुछ दिन बाद ऐसी भित्ति में घुसती कोशिकाओं की गेंद जिसे उसके लिए तैयार किया गया है। यह कौन-सी घटनाओं की जोड़ी है?",
          mr: "असा प्रवेश जो एकदा घडलाच पाहिजे आणि नंतर सर्वांसाठी बंद, आणि काही दिवसांनी अशा भित्तीत शिरणारा पेशींचा गोळा जी त्याच्यासाठी तयार केली गेली आहे. ही कोणत्या घटनांची जोडी?",
        },
        statement: {
          en: "Fertilisation and implantation are the entry of one sperm into the egg, with the egg's covering immediately altered to block the rest, and the later embedding of the blastocyst in the uterine lining.",
          hi: "निषेचन और अंतर्रोपण एक शुक्राणु का अंड में प्रवेश हैं, जिसके साथ ही अंड का आवरण बाक़ी सबको रोकने के लिए तुरंत बदल जाता है, और बाद में कोरकपुटी का गर्भाशय की परत में धँसना।",
          mr: "फलन आणि अंतर्रोपण म्हणजे एका शुक्राणूचा अंडात प्रवेश, ज्यासोबतच अंडाचे आवरण बाकी सर्वांना अडवण्यासाठी लगेच बदलते, आणि नंतर कोरकपुटीचे गर्भाशयाच्या अस्तरात रुजणे.",
        },
        detail: {
          en: "The block to more than one sperm is immediate and chemical, because two sperm entering would give a cell with the wrong number of chromosomes and it would not survive.",
          hi: "एक से अधिक शुक्राणु पर रोक तुरंत और रासायनिक है, क्योंकि दो शुक्राणुओं के भीतर आने पर ऐसी कोशिका बनती जिसमें गुणसूत्रों की संख्या ग़लत होती और वह बचती नहीं।",
          mr: "एकाहून अधिक शुक्राणूंवरचा अडसर तात्काळ आणि रासायनिक आहे, कारण दोन शुक्राणू आत आल्यास अशी पेशी बनेल जिच्यात गुणसूत्रांची संख्या चुकीची असेल आणि ती टिकणार नाही.",
        },
        extra: {
          en: "Implantation succeeds only because the mother's tissue tolerates cells carrying a father's genes, which is a suppression of the normal response to foreign tissue.",
          hi: "अंतर्रोपण केवल इसलिए सफल होता है कि माँ का ऊतक पिता के जीन ढोती कोशिकाओं को सह लेता है, और यह पराए ऊतक के प्रति सामान्य प्रतिक्रिया का दमन है।",
          mr: "अंतर्रोपण केवळ यासाठी यशस्वी होते की आईचे ऊतक वडिलांची जनुके वाहणाऱ्या पेशी सहन करते, आणि हे परक्या ऊतकाबाबतच्या सामान्य प्रतिसादाचे दमन आहे.",
        },
        pair: {
          left: {
            en: "A door shut the instant it has been used once",
            hi: "एक बार काम में आते ही बंद हुआ दरवाज़ा",
            mr: "एकदा वापरताच बंद झालेला दरवाजा",
          },
          right: {
            en: "fertilisation and implantation",
            hi: "निषेचन और अंतर्रोपण",
            mr: "फलन आणि अंतर्रोपण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sperm production runs continuously from puberty and divides its cytoplasm equally; egg production starts before birth, is interrupted twice — once for years and once until fertilisation — and divides its cytoplasm very unequally. Explain why the same meiosis is organised so differently in the two sexes.",
          hi: "शुक्राणु उत्पादन यौवनारंभ से लगातार चलता है और अपना कोशिकाद्रव्य बराबर बाँटता है; अंड उत्पादन जन्म से पहले शुरू होता है, दो बार बाधित होता है — एक बार वर्षों के लिए और एक बार निषेचन तक — और अपना कोशिकाद्रव्य बहुत असमान बाँटता है। बताओ कि वही अर्धसूत्री विभाजन दोनों लिंगों में इतना भिन्न ढंग से क्यों जमाया गया है।",
          mr: "शुक्राणू उत्पादन यौवनारंभापासून सतत चालते आणि आपले पेशीद्रव्य समान वाटते; अंड उत्पादन जन्माआधी सुरू होते, दोनदा खंडित होते — एकदा वर्षांसाठी आणि एकदा फलनापर्यंत — आणि आपले पेशीद्रव्य फार असमान वाटते. तेच अर्धसूत्री विभाजन दोन्ही लिंगांत इतक्या वेगळ्या प्रकारे का मांडले आहे ते सांगा.",
        },
        choices: [
          {
            en: "The difference follows from what each gamete has to supply. A sperm delivers a nucleus and needs only a tail and mitochondria to get there, so it can be small, made in huge numbers, and produced symmetrically — four from every starting cell, continuously, from stem cells that keep dividing for life. An egg must supply the entire cytoplasm, organelles and stored material for the first days of the embryo, so it is expensive; the unequal division concentrates all of that in one cell and discards the other nuclei as polar bodies. The stock is fixed before birth because making such cells is costly, and the second arrest until fertilisation means the last step is not paid for unless it is needed",
            hi: "अंतर इससे निकलता है कि हर युग्मक को देना क्या है। शुक्राणु एक केंद्रक पहुँचाता है और वहाँ तक जाने को उसे केवल पूँछ और सूत्रकणिकाएँ चाहिए, अतः वह छोटा हो सकता है, विशाल संख्या में बन सकता है, और सममित रूप से बनता है — हर आरंभिक कोशिका से चार, लगातार, ऐसी मूल कोशिकाओं से जो जीवन भर विभाजित होती रहती हैं। अंड को भ्रूण के पहले दिनों के लिए पूरा कोशिकाद्रव्य, कोशिकांग और संचित सामग्री देनी है, अतः वह महँगा है; असमान विभाजन वह सब एक ही कोशिका में केंद्रित करता है और बाक़ी केंद्रकों को ध्रुवीय काय बनाकर फेंक देता है। भंडार जन्म से पहले तय हो जाता है क्योंकि ऐसी कोशिकाएँ बनाना महँगा है, और निषेचन तक का दूसरा ठहराव मतलब अंतिम चरण की क़ीमत तब तक नहीं चुकाई जाती जब तक ज़रूरत न हो",
            mr: "फरक यातून निघतो की प्रत्येक युग्मकाला काय द्यायचे आहे. शुक्राणू एक केंद्रक पोहोचवतो आणि तिथवर जायला त्याला केवळ शेपूट आणि तंतुकणिका लागतात, म्हणून तो लहान असू शकतो, प्रचंड संख्येने बनू शकतो, आणि सममितपणे बनतो — प्रत्येक प्रारंभिक पेशीपासून चार, सतत, अशा मूलपेशींपासून ज्या आयुष्यभर विभाजित होत राहतात. अंडाला भ्रूणाच्या पहिल्या दिवसांसाठी अख्खे पेशीद्रव्य, पेशीअंगके आणि साठवलेली सामग्री द्यायची आहे, म्हणून ते महाग आहे; असमान विभाजन ते सर्व एकाच पेशीत केंद्रित करते आणि बाकीची केंद्रके ध्रुवीय काया बनवून टाकून देते. साठा जन्माआधी ठरतो कारण अशा पेशी बनवणे महाग आहे, आणि फलनापर्यंतचा दुसरा थांबा म्हणजे शेवटच्या पायरीची किंमत गरज पडेपर्यंत मोजली जात नाही",
          },
          {
            en: "The egg's meiosis is arrested because eggs divide much more slowly than sperm at the cellular level, and the unequal cytoplasm simply reflects that slowness",
            hi: "अंड का अर्धसूत्री विभाजन इसलिए रुकता है कि कोशिकीय स्तर पर अंड शुक्राणुओं से कहीं धीमे विभाजित होते हैं, और असमान कोशिकाद्रव्य बस उसी धीमेपन को दर्शाता है",
            mr: "अंडाचे अर्धसूत्री विभाजन यासाठी थांबते की पेशीय पातळीवर अंडे शुक्राणूंहून कितीतरी सावकाश विभाजित होतात, आणि असमान पेशीद्रव्य फक्त तोच सावकाशपणा दर्शवते",
          },
          {
            en: "The polar bodies are spare eggs held in reserve in case the main one is not fertilised, which is why three are produced alongside it",
            hi: "ध्रुवीय काय अतिरिक्त अंड हैं जो इस स्थिति के लिए रखे जाते हैं कि मुख्य वाला निषेचित न हो, इसीलिए उसके साथ तीन बनते हैं",
            mr: "ध्रुवीय काया अतिरिक्त अंडी आहेत जी मुख्य फलित न झाल्यास राखीव ठेवली जातात, म्हणूनच त्याच्यासोबत तीन बनतात",
          },
          {
            en: "The difference is imposed by the hormones: testosterone drives meiosis to completion while oestrogen halts it, so the arrest is a hormonal accident with no function",
            hi: "अंतर हार्मोन थोपते हैं: टेस्टोस्टेरोन अर्धसूत्री विभाजन को पूरा करवाता है जबकि एस्ट्रोजन उसे रोक देता है, अतः ठहराव एक हार्मोनी दुर्घटना है जिसका कोई काम नहीं",
            mr: "फरक संप्रेरके लादतात: टेस्टोस्टेरोन अर्धसूत्री विभाजन पूर्ण करवते तर इस्ट्रोजन ते थांबवते, म्हणून थांबा हा एक संप्रेरकी अपघात आहे ज्याचे कोणतेही काम नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both sexes run the same meiosis — one round of DNA replication, two divisions, four haploid nuclei. Everything else about the two processes differs, and the way to make sense of that is to ask what each gamete is actually required to deliver. WHAT A SPERM MUST DELIVER. A nucleus, and the means to reach the egg. That is all. It needs no stored food, no organelle inheritance to pass on — even its mitochondria are destroyed after fertilisation — and so it can be stripped down to almost nothing but chromatin, a tail and the mitochondria that power the tail. A cheap gamete can be made in quantity, and it is: the process runs continuously because the spermatogonia are stem cells that keep dividing throughout life, and all four products of each meiosis are usable, since none of them needs more than its share. WHAT AN EGG MUST DELIVER. Everything else. The zygote's cytoplasm, its mitochondria, its ribosomes, the maternal messenger RNAs and proteins that run development before the embryo's own genes switch on, and the food to do it with. All of that comes from the egg and none from the sperm. So an egg is expensive, and the unequal division is the direct consequence: at each meiotic division the spindle sits near the edge of the cell, so one daughter keeps nearly all the cytoplasm and the other is pinched off as a polar body carrying a nucleus and almost nothing else. Dividing equally would give four cells, none of which had enough to support an embryo. Better one adequate cell than four inadequate ones. WHY THE TWO ARRESTS, WHICH IS THE SUBTLEST PART. The first arrest begins before birth: all the primary oocytes a person will ever have are formed by then, and each stops in prophase I. Some remain there for forty years or more — one of the longest pauses in cell biology, and also, incidentally, why the risk of chromosomal errors rises with age, since the spindle apparatus has been held in position for decades. The second arrest comes at metaphase II and is released only when a sperm enters. That timing is not arbitrary: completing the second division means committing the last of the cell's resources and producing the second polar body, and there is no reason to pay that cost for an egg that is never fertilised. So the egg is released still unfinished, and finishes only if it is used. THE UNIFYING IDEA. Where a gamete is cheap, make many and make them symmetrically. Where a gamete is expensive, make few, concentrate everything into one, and defer the final expense until it is certain to be needed. The asymmetry between the sexes is not two unrelated designs but one economic principle applied to two very different price tags. (The second option offers a rate difference in place of a reason; the third misunderstands polar bodies, which have almost no cytoplasm and cannot be fertilised; the fourth inverts cause and effect — hormones regulate the timing but do not explain why the timing is worth having.)",
          hi: "दोनों लिंग वही अर्धसूत्री विभाजन चलाते हैं — DNA प्रतिकृति का एक दौर, दो विभाजन, चार अगुणित केंद्रक। दोनों प्रक्रियाओं की बाक़ी हर बात भिन्न है, और उसका अर्थ निकालने का तरीक़ा यह पूछना है कि हर युग्मक से वस्तुतः क्या पहुँचाना अपेक्षित है। शुक्राणु को क्या पहुँचाना है। एक केंद्रक, और अंड तक पहुँचने का साधन। बस इतना ही। उसे न संचित भोजन चाहिए, न आगे देने को कोई कोशिकांग विरासत — उसकी सूत्रकणिकाएँ तक निषेचन के बाद नष्ट कर दी जाती हैं — अतः उसे क्रोमैटिन, एक पूँछ और पूँछ को शक्ति देती सूत्रकणिकाओं के सिवा लगभग कुछ भी नहीं तक छाँटा जा सकता है। सस्ता युग्मक मात्रा में बनाया जा सकता है, और बनाया जाता है: प्रक्रिया लगातार चलती है क्योंकि शुक्रजनन कोशिकाएँ मूल कोशिकाएँ हैं जो जीवन भर विभाजित होती रहती हैं, और हर अर्धसूत्री विभाजन के चारों उत्पाद काम के हैं, चूँकि किसी को भी अपने हिस्से से अधिक नहीं चाहिए। अंड को क्या पहुँचाना है। बाक़ी सब कुछ। युग्मनज का कोशिकाद्रव्य, उसकी सूत्रकणिकाएँ, उसके राइबोसोम, वे मातृ संदेशवाहक RNA और प्रोटीन जो भ्रूण के अपने जीन चालू होने से पहले विकास चलाते हैं, और वह सब करने का भोजन। यह सब अंड से आता है और शुक्राणु से कुछ नहीं। अतः अंड महँगा है, और असमान विभाजन उसका सीधा परिणाम है: हर अर्धसूत्री विभाजन में तर्कु कोशिका के किनारे के पास बैठता है, अतः एक पुत्री लगभग सारा कोशिकाद्रव्य रख लेती है और दूसरी ध्रुवीय काय बनकर चिटक जाती है, केंद्रक ढोती और लगभग कुछ नहीं। बराबर बाँटने पर चार कोशिकाएँ मिलतीं, और किसी के पास भी भ्रूण संभालने भर नहीं होता। चार अपर्याप्त से एक पर्याप्त बेहतर है। दोनों ठहराव क्यों, और यही सबसे सूक्ष्म हिस्सा है। पहला ठहराव जन्म से पहले शुरू होता है: व्यक्ति के जीवन की सारी प्राथमिक अंडक कोशिकाएँ तब तक बन चुकी होती हैं, और हर एक पूर्वावस्था I में रुक जाती है। कुछ वहीं चालीस या अधिक वर्ष रहती हैं — कोशिका जीवविज्ञान के सबसे लंबे ठहरावों में से एक, और संयोग से यही कारण भी कि उम्र के साथ गुणसूत्री त्रुटियों का जोखिम बढ़ता है, चूँकि तर्कु तंत्र दशकों से अपनी जगह थमा हुआ है। दूसरा ठहराव मध्यावस्था II पर आता है और तभी छूटता है जब शुक्राणु भीतर आए। वह समय मनमाना नहीं: दूसरा विभाजन पूरा करने का अर्थ है कोशिका के बचे संसाधन लगा देना और दूसरी ध्रुवीय काय बनाना, और ऐसे अंड के लिए वह क़ीमत चुकाने का कोई कारण नहीं जो कभी निषेचित ही न हो। अतः अंड अधूरा ही छोड़ा जाता है, और तभी पूरा होता है जब काम में आए। एकीकृत विचार। जहाँ युग्मक सस्ता है, वहाँ बहुत बनाओ और सममित बनाओ। जहाँ युग्मक महँगा है, वहाँ थोड़े बनाओ, सब कुछ एक में केंद्रित करो, और अंतिम ख़र्च तब तक टालो जब तक ज़रूरत पक्की न हो। दोनों लिंगों की विषमता दो असंबद्ध डिज़ाइन नहीं बल्कि दो बहुत भिन्न क़ीमतों पर लगाया गया एक ही आर्थिक सिद्धांत है। (दूसरा विकल्प कारण की जगह वेग का अंतर रख देता है; तीसरा ध्रुवीय कायों को ग़लत समझता है, जिनमें लगभग कोशिकाद्रव्य नहीं और जो निषेचित हो ही नहीं सकतीं; चौथा कारण और प्रभाव उलट देता है — हार्मोन समय नियंत्रित करते हैं पर यह नहीं समझाते कि वह समय रखने लायक़ क्यों है।)",
          mr: "दोन्ही लिंगे तेच अर्धसूत्री विभाजन चालवतात — DNA प्रतिकृतीची एक फेरी, दोन विभाजने, चार अगुणित केंद्रके. दोन्ही प्रक्रियांची बाकी प्रत्येक गोष्ट वेगळी आहे, आणि त्याचा अर्थ लावण्याचा मार्ग म्हणजे प्रत्येक युग्मकाकडून प्रत्यक्षात काय पोहोचवणे अपेक्षित आहे हे विचारणे. शुक्राणूला काय पोहोचवायचे आहे. एक केंद्रक, आणि अंडापर्यंत पोहोचण्याचे साधन. एवढेच. त्याला साठवलेले अन्न नको, पुढे द्यायला कोणताही पेशीअंगक वारसा नको — त्याच्या तंतुकणिकासुद्धा फलनानंतर नष्ट केल्या जातात — म्हणून त्याला क्रोमॅटिन, एक शेपूट आणि शेपटीला शक्ती देणाऱ्या तंतुकणिकांखेरीज जवळपास काहीही नाही इतके छाटता येते. स्वस्त युग्मक प्रमाणात बनवता येतो, आणि बनवला जातो: प्रक्रिया सतत चालते कारण शुक्रजनन पेशी या मूलपेशी आहेत ज्या आयुष्यभर विभाजित होत राहतात, आणि प्रत्येक अर्धसूत्री विभाजनाची चारही उत्पादने उपयुक्त आहेत, कारण कोणालाही आपल्या वाट्याहून अधिक लागत नाही. अंडाला काय पोहोचवायचे आहे. बाकी सर्व काही. युग्मनजाचे पेशीद्रव्य, त्याच्या तंतुकणिका, त्याचे रायबोसोम, ती मातृ संदेशवाहक RNA आणि प्रथिने जी भ्रूणाची स्वतःची जनुके चालू होण्याआधी विकास चालवतात, आणि ते सर्व करण्याचे अन्न. हे सर्व अंडाकडून येते आणि शुक्राणूकडून काहीही नाही. म्हणून अंडे महाग आहे, आणि असमान विभाजन त्याचा थेट परिणाम आहे: प्रत्येक अर्धसूत्री विभाजनात तर्कु पेशीच्या कडेजवळ बसतो, म्हणून एक कन्या जवळपास अख्खे पेशीद्रव्य ठेवते आणि दुसरी ध्रुवीय काया बनून चिमटली जाते, केंद्रक वाहत आणि जवळपास काहीही नाही. समान वाटल्यास चार पेशी मिळतील, आणि कोणाकडेही भ्रूण सांभाळण्याइतके नसेल. चार अपुऱ्यांहून एक पुरेशी बरी. दोन्ही थांबे का, आणि हाच सर्वांत सूक्ष्म भाग आहे. पहिला थांबा जन्माआधी सुरू होतो: व्यक्तीच्या आयुष्यातील सर्व प्राथमिक अंडक पेशी तोवर बनलेल्या असतात, आणि प्रत्येक पूर्वावस्था I मध्ये थांबते. काही तिथेच चाळीस वा अधिक वर्षे राहतात — पेशीजीवशास्त्रातल्या सर्वांत लांब थांब्यांपैकी एक, आणि योगायोगाने हेच कारणही की वयासोबत गुणसूत्री चुकांचा धोका वाढतो, कारण तर्कु यंत्रणा दशके आपल्या जागी धरून ठेवली आहे. दुसरा थांबा मध्यावस्था II वर येतो आणि तेव्हाच सुटतो जेव्हा शुक्राणू आत येतो. ती वेळ मनमानी नाही: दुसरे विभाजन पूर्ण करणे म्हणजे पेशीची उरलेली संसाधने लावणे आणि दुसरी ध्रुवीय काया बनवणे, आणि अशा अंडासाठी ती किंमत मोजण्याचे कोणतेही कारण नाही जे कधी फलितच होणार नाही. म्हणून अंडे अपुरेच सोडले जाते, आणि तेव्हाच पूर्ण होते जेव्हा ते वापरले जाते. एकत्रित कल्पना. जिथे युग्मक स्वस्त आहे तिथे खूप बनवा आणि सममित बनवा. जिथे युग्मक महाग आहे तिथे थोडे बनवा, सर्व काही एकात केंद्रित करा, आणि शेवटचा खर्च गरज नक्की होईपर्यंत पुढे ढकला. दोन्ही लिंगांतील विषमता ही दोन असंबद्ध रचना नसून दोन फार वेगळ्या किमतींवर लावलेले एकच आर्थिक तत्त्व आहे. (दुसरा पर्याय कारणाच्या जागी वेगाचा फरक ठेवतो; तिसरा ध्रुवीय कायांना चुकीचे समजतो, ज्यांच्यात जवळपास पेशीद्रव्य नाही आणि ज्या फलित होऊच शकत नाहीत; चौथा कारण आणि परिणाम उलटवतो — संप्रेरके वेळ नियंत्रित करतात पण ती वेळ ठेवण्याजोगी का आहे हे समजावत नाहीत.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Rising oestrogen suppresses the pituitary for most of the cycle, yet at its peak it drives that same pituitary into a sudden surge of luteinising hormone. Explain how one hormone can have opposite effects on the same gland, and what the arrangement achieves.",
          hi: "बढ़ता एस्ट्रोजन चक्र के अधिकांश समय पीयूष ग्रंथि को दबाता है, फिर भी अपने शिखर पर वह उसी ग्रंथि को ल्यूटिनाइजिंग हार्मोन की अचानक उछाल में धकेल देता है। बताओ कि एक ही हार्मोन उसी ग्रंथि पर उलटे प्रभाव कैसे डाल सकता है, और यह व्यवस्था क्या हासिल करती है।",
          mr: "वाढते इस्ट्रोजन चक्राचा बहुतांश काळ पियुषिका ग्रंथीला दाबते, तरीही आपल्या शिखरावर ते त्याच ग्रंथीला ल्युटिनायझिंग संप्रेरकाच्या अचानक उसळीत ढकलते. एकच संप्रेरक त्याच ग्रंथीवर उलट परिणाम कसे करू शकते, आणि ही व्यवस्था काय साधते ते सांगा.",
        },
        choices: [
          {
            en: "The feedback changes sign with concentration and with duration. At the low, fluctuating levels of the early cycle, oestrogen inhibits the pituitary — ordinary negative feedback keeping the system steady. Once a dominant follicle is mature it secretes oestrogen at a high level and keeps it there for a day or more, and above that threshold the feedback becomes positive: the pituitary is driven to release a large burst of luteinising hormone, which ruptures the follicle. The threshold is what makes the signal informative — a sustained high oestrogen means one follicle is ready, so the surge is triggered by the maturity of the follicle itself rather than by a clock. Afterwards progesterone from the corpus luteum restores negative feedback and shuts the system down, which is why no second ovulation follows",
            hi: "पुनर्भरण सांद्रता और अवधि के साथ अपना चिह्न बदल देती है। आरंभिक चक्र के कम, उतार-चढ़ाव वाले स्तरों पर एस्ट्रोजन पीयूष को रोकता है — साधारण ऋणात्मक पुनर्भरण जो तंत्र को स्थिर रखती है। एक बार प्रभावी पुटक परिपक्व हो जाए तो वह एस्ट्रोजन ऊँचे स्तर पर स्रावित करता है और उसे एक दिन या अधिक वहीं थामे रखता है, और उस देहली से ऊपर पुनर्भरण धनात्मक हो जाती है: पीयूष को ल्यूटिनाइजिंग हार्मोन का बड़ा विस्फोट छोड़ने पर मजबूर किया जाता है, जो पुटक को फाड़ देता है। देहली ही संकेत को सूचनाप्रद बनाती है — लगातार ऊँचा एस्ट्रोजन कहता है कि एक पुटक तैयार है, अतः उछाल किसी घड़ी से नहीं बल्कि स्वयं पुटक की परिपक्वता से छिड़ती है। बाद में कॉर्पस ल्यूटियम से आया प्रोजेस्टेरोन ऋणात्मक पुनर्भरण बहाल कर तंत्र बंद कर देता है, इसीलिए दूसरा अंडोत्सर्ग नहीं होता",
            mr: "पुनर्भरण संहती आणि कालावधीसोबत आपले चिन्ह बदलते. सुरुवातीच्या चक्राच्या कमी, चढउतार असलेल्या पातळ्यांवर इस्ट्रोजन पियुषिकेला अडवते — साधे ऋण पुनर्भरण जे यंत्रणा स्थिर ठेवते. एकदा प्रभावी पुटक परिपक्व झाले की ते इस्ट्रोजन उच्च पातळीवर स्रवते आणि ते एक दिवस वा अधिक तिथेच धरून ठेवते, आणि त्या उंबरठ्यावर पुनर्भरण धन होते: पियुषिकेला ल्युटिनायझिंग संप्रेरकाचा मोठा स्फोट सोडायला भाग पाडले जाते, जो पुटक फोडतो. उंबरठाच संकेताला माहितीपूर्ण बनवतो — सतत उच्च इस्ट्रोजन सांगते की एक पुटक तयार आहे, म्हणून उसळी कोणत्याही घड्याळाने नव्हे तर स्वतः पुटकाच्या परिपक्वतेने पेटते. नंतर कॉर्पस ल्युटियमकडून आलेले प्रोजेस्टेरॉन ऋण पुनर्भरण पुनर्स्थापित करून यंत्रणा बंद करते, म्हणूनच दुसरा अंडोत्सर्ग होत नाही",
          },
          {
            en: "There is no reversal: the surge is caused by a different hormone entirely, and oestrogen's role throughout the cycle is purely inhibitory",
            hi: "कोई पलटाव है ही नहीं: उछाल पूरी तरह किसी दूसरे हार्मोन से होती है, और चक्र भर एस्ट्रोजन की भूमिका विशुद्ध निरोधी है",
            mr: "कोणतेही पलटणे नाहीच: उसळी पूर्णपणे दुसऱ्या संप्रेरकाने होते, आणि अख्ख्या चक्रात इस्ट्रोजनची भूमिका निव्वळ प्रतिबंधक आहे",
          },
          {
            en: "The pituitary becomes exhausted by prolonged suppression and releases its stored hormone all at once, so the surge is a failure of the inhibition rather than a response",
            hi: "लंबे दमन से पीयूष थक जाती है और अपना संचित हार्मोन एक साथ छोड़ देती है, अतः उछाल प्रतिक्रिया नहीं बल्कि निषेध की विफलता है",
            mr: "दीर्घ दमनाने पियुषिका थकते आणि आपले साठवलेले संप्रेरक एकदम सोडते, म्हणून उसळी प्रतिसाद नसून प्रतिबंधाचे अपयश आहे",
          },
          {
            en: "Oestrogen acts on the ovary rather than the pituitary, and the surge is simply the ovary responding to its own hormone without any involvement of the brain",
            hi: "एस्ट्रोजन पीयूष पर नहीं बल्कि अंडाशय पर काम करता है, और उछाल बस अंडाशय का अपने ही हार्मोन को दिया उत्तर है, जिसमें मस्तिष्क की कोई भूमिका नहीं",
            mr: "इस्ट्रोजन पियुषिकेवर नव्हे तर अंडाशयावर काम करते, आणि उसळी फक्त अंडाशयाचा आपल्याच संप्रेरकाला दिलेला प्रतिसाद आहे, ज्यात मेंदूची कोणतीही भूमिका नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The apparent contradiction is worth stating precisely: for about twelve days oestrogen holds gonadotrophin release down, and then over a few hours it drives it up more than tenfold. Same hormone, same target, opposite sign. THE RESOLUTION IS THAT FEEDBACK IS NOT A FIXED PROPERTY. Whether a signal inhibits or stimulates depends on how much of it there is and for how long. At the low and moderate levels of the early follicular phase, oestrogen acts on the hypothalamus and pituitary to reduce output — ordinary negative feedback, the same arrangement that keeps blood glucose or body temperature near a set point. But when a dominant follicle matures it secretes oestrogen far above that range and, crucially, SUSTAINS it for roughly a day and a half. Sustained high oestrogen alters the pituitary's own responsiveness: the gonadotrophs become far more sensitive to hypothalamic GnRH and release a large burst of luteinising hormone. Positive feedback then does what positive feedback always does — it accelerates, which is why the result is a spike rather than a plateau. WHAT THE ARRANGEMENT ACHIEVES, WHICH IS THE POINT OF THE QUESTION. Ovulation must happen once per cycle, at the moment when a follicle is ready and not before. How is 'ready' to be detected? The threshold answers it. Oestrogen output rises with the size and maturity of the dominant follicle, so a sustained high level is a reliable report that a follicle has completed its growth. The system is not timed by a clock; it is triggered by the readiness of the thing it is waiting for. Both features of the threshold matter. The height ensures that a few small follicles cannot between them fake the signal. The duration requirement ensures that a brief fluctuation cannot either — the follicle must hold the level, which only a genuinely mature one can do. WHY IT SWITCHES OFF AGAIN. Positive feedback is inherently unstable and must be terminated or it would run away. After ovulation the ruptured follicle becomes the corpus luteum and secretes progesterone, which restores strong negative feedback and suppresses the axis for the rest of the cycle. So no second ovulation follows, and the endometrium is maintained while it might be needed. If no implantation occurs the corpus luteum degenerates, progesterone falls, the lining is shed, and the suppression lifts — which is what allows the next cycle to begin. THE TRANSFERABLE IDEA. A control system with a single sign can only hold a value steady. Discrete events — a surge, a birth, a clotting cascade — require positive feedback, and a system that needs both stability and events must be able to switch between them. Looking for the threshold at which the sign flips is the way to understand such a system, and 'the same hormone does opposite things' is a clue about mechanism rather than an inconsistency in the textbook. (The second option denies a well-documented reversal; the third describes exhaustion, which would give a decline rather than a surge and could not be timed to follicular maturity; the fourth removes the pituitary from a loop whose surge is measured in pituitary hormone.)",
          hi: "स्पष्ट विरोध को ठीक-ठीक कहना चाहिए: क़रीब बारह दिन एस्ट्रोजन गोनैडोट्रॉफ़िन का निकलना दबाए रखता है, और फिर कुछ ही घंटों में उसे दस गुने से अधिक ऊपर धकेल देता है। वही हार्मोन, वही लक्ष्य, उलटा चिह्न। समाधान यह कि पुनर्भरण कोई नियत गुण नहीं है। कोई संकेत रोकेगा या उकसाएगा यह इस पर निर्भर है कि वह कितना है और कितनी देर। आरंभिक पुटकीय प्रावस्था के कम और मध्यम स्तरों पर एस्ट्रोजन हाइपोथैलेमस और पीयूष पर काम करके उत्पादन घटाता है — साधारण ऋणात्मक पुनर्भरण, वही व्यवस्था जो रक्त शर्करा या शरीर के ताप को नियत बिंदु के पास रखती है। पर जब प्रभावी पुटक परिपक्व होता है तो वह एस्ट्रोजन उस परास से कहीं ऊपर स्रावित करता है और, जो निर्णायक है, उसे क़रीब डेढ़ दिन थामे रखता है। लगातार ऊँचा एस्ट्रोजन पीयूष की अपनी अनुक्रियाशीलता बदल देता है: गोनैडोट्रॉफ़ हाइपोथैलेमी GnRH के प्रति कहीं अधिक संवेदी हो जाते हैं और ल्यूटिनाइजिंग हार्मोन का बड़ा विस्फोट छोड़ते हैं। फिर धनात्मक पुनर्भरण वही करती है जो वह हमेशा करती है — तेज़ करती है, इसीलिए परिणाम पठार नहीं बल्कि नुकीली चोटी है। यह व्यवस्था क्या हासिल करती है, और यही प्रश्न का मर्म है। अंडोत्सर्ग प्रति चक्र एक बार होना ही चाहिए, उसी क्षण जब पुटक तैयार हो और उससे पहले नहीं। 'तैयार' को पहचाना कैसे जाए? देहली इसका उत्तर देती है। एस्ट्रोजन का उत्पादन प्रभावी पुटक के आकार और परिपक्वता के साथ बढ़ता है, अतः लगातार ऊँचा स्तर यह भरोसेमंद ख़बर है कि पुटक ने अपनी वृद्धि पूरी कर ली। तंत्र किसी घड़ी से समयबद्ध नहीं; वह उसी चीज़ की तैयारी से छिड़ता है जिसका वह इंतज़ार कर रहा है। देहली के दोनों लक्षण मायने रखते हैं। ऊँचाई सुनिश्चित करती है कि कुछ छोटे पुटक मिलकर संकेत की नक़ल न कर सकें। अवधि की शर्त सुनिश्चित करती है कि कोई क्षणिक उतार-चढ़ाव भी न कर सके — पुटक को स्तर थामे रखना पड़ेगा, जो केवल वस्तुतः परिपक्व पुटक ही कर सकता है। वह फिर बंद क्यों होती है। धनात्मक पुनर्भरण स्वभावतः अस्थिर है और उसे समाप्त करना ही पड़ता है वरना वह बेक़ाबू हो जाए। अंडोत्सर्ग के बाद फटा पुटक कॉर्पस ल्यूटियम बन जाता है और प्रोजेस्टेरोन स्रावित करता है, जो प्रबल ऋणात्मक पुनर्भरण बहाल कर बाक़ी चक्र भर अक्ष को दबा देता है। अतः दूसरा अंडोत्सर्ग नहीं होता, और गर्भाशय अंतःस्तर तब तक बना रहता है जब तक उसकी ज़रूरत हो सकती है। यदि अंतर्रोपण न हो तो कॉर्पस ल्यूटियम क्षय हो जाता है, प्रोजेस्टेरोन गिरता है, परत झड़ जाती है, और दमन उठ जाता है — और यही अगला चक्र शुरू होने देता है। ले जाने योग्य विचार। एकल चिह्न वाला नियंत्रण तंत्र केवल किसी मान को स्थिर रख सकता है। असतत घटनाएँ — उछाल, प्रसव, थक्का जमने की शृंखला — धनात्मक पुनर्भरण माँगती हैं, और जिस तंत्र को स्थिरता भी चाहिए और घटनाएँ भी उसे दोनों के बीच स्विच कर पाना चाहिए। जिस देहली पर चिह्न पलटता है उसे ढूँढ़ना ही ऐसे तंत्र को समझने का तरीक़ा है, और 'वही हार्मोन उलटे काम करता है' पाठ्यपुस्तक की असंगति नहीं बल्कि क्रियाविधि का सुराग़ है। (दूसरा विकल्प एक भलीभाँति प्रलेखित पलटाव से इनकार करता है; तीसरा थकान का वर्णन करता है, जो उछाल नहीं बल्कि गिरावट देती और जिसे पुटकीय परिपक्वता से समयबद्ध नहीं किया जा सकता; चौथा पीयूष को उस लूप से हटा देता है जिसकी उछाल पीयूष हार्मोन में ही नापी जाती है।)",
          mr: "स्पष्ट विरोध नेमकेपणाने मांडण्याजोगा आहे: सुमारे बारा दिवस इस्ट्रोजन गोनॅडोट्रॉफिनचे निघणे दाबून ठेवते, आणि मग काही तासांतच ते दहापटींहून अधिक वर ढकलते. तेच संप्रेरक, तेच लक्ष्य, उलट चिन्ह. समाधान हे की पुनर्भरण हा कोणताही ठराविक गुणधर्म नाही. एखादे संकेत अडवेल की चेतवेल हे यावर अवलंबून आहे की ते किती आहे आणि किती वेळ. सुरुवातीच्या पुटकीय अवस्थेच्या कमी आणि मध्यम पातळ्यांवर इस्ट्रोजन हायपोथॅलॅमस आणि पियुषिकेवर काम करून उत्पादन घटवते — साधे ऋण पुनर्भरण, तीच व्यवस्था जी रक्तशर्करा वा शरीराचे तापमान ठराविक बिंदूजवळ ठेवते. पण जेव्हा प्रभावी पुटक परिपक्व होते तेव्हा ते इस्ट्रोजन त्या व्याप्तीहून कितीतरी वर स्रवते आणि, जे निर्णायक आहे, ते सुमारे दीड दिवस धरून ठेवते. सतत उच्च इस्ट्रोजन पियुषिकेची स्वतःची प्रतिसादक्षमता बदलते: गोनॅडोट्रॉफ हायपोथॅलॅमी GnRH बाबत कितीतरी अधिक संवेदी होतात आणि ल्युटिनायझिंग संप्रेरकाचा मोठा स्फोट सोडतात. मग धन पुनर्भरण तेच करते जे ते नेहमी करते — गती देते, म्हणूनच निकाल पठार नसून टोकदार शिखर आहे. ही व्यवस्था काय साधते, आणि हाच प्रश्नाचा गाभा आहे. अंडोत्सर्ग प्रति चक्र एकदाच घडलाच पाहिजे, नेमक्या त्या क्षणी जेव्हा पुटक तयार असेल आणि त्याआधी नाही. 'तयार' कसे ओळखायचे? उंबरठा याचे उत्तर देतो. इस्ट्रोजनचे उत्पादन प्रभावी पुटकाच्या आकार आणि परिपक्वतेसोबत वाढते, म्हणून सतत उच्च पातळी ही विश्वासार्ह बातमी आहे की पुटकाने आपली वाढ पूर्ण केली. यंत्रणा कोणत्याही घड्याळाने वेळबद्ध नाही; ती ज्या गोष्टीची वाट पाहत आहे तिच्या तयारीने पेटते. उंबरठ्याची दोन्ही लक्षणे महत्त्वाची आहेत. उंची खात्री देते की काही लहान पुटके मिळून संकेताची नक्कल करू शकणार नाहीत. कालावधीची अट खात्री देते की कोणताही क्षणिक चढउतारही करू शकणार नाही — पुटकाला पातळी धरून ठेवावी लागेल, जे केवळ खरोखर परिपक्व पुटकच करू शकते. ती पुन्हा बंद का होते. धन पुनर्भरण स्वभावतः अस्थिर आहे आणि ते संपवावेच लागते नाहीतर ते हाताबाहेर जाईल. अंडोत्सर्गानंतर फुटलेले पुटक कॉर्पस ल्युटियम बनते आणि प्रोजेस्टेरॉन स्रवते, जे तीव्र ऋण पुनर्भरण पुनर्स्थापित करून उरलेल्या चक्रभर अक्ष दाबते. म्हणून दुसरा अंडोत्सर्ग होत नाही, आणि गर्भाशयाचे अंतःस्तर तोवर टिकते जोवर त्याची गरज पडू शकते. जर अंतर्रोपण झाले नाही तर कॉर्पस ल्युटियम क्षय पावते, प्रोजेस्टेरॉन घसरते, अस्तर गळते, आणि दमन उठते — आणि हेच पुढचे चक्र सुरू होऊ देते. सोबत न्यायची कल्पना. एकाच चिन्हाची नियंत्रण यंत्रणा केवळ एखादे मूल्य स्थिर ठेवू शकते. सुट्या घटना — उसळी, प्रसूती, गुठळी बनण्याची साखळी — धन पुनर्भरण मागतात, आणि ज्या यंत्रणेला स्थिरताही हवी आणि घटनाही तिला दोघांत स्विच करता आले पाहिजे. ज्या उंबरठ्यावर चिन्ह पलटते तो शोधणे हाच अशी यंत्रणा समजण्याचा मार्ग आहे, आणि 'तेच संप्रेरक उलट कामे करते' ही पाठ्यपुस्तकातली विसंगती नसून यंत्रणेचा सुगावा आहे. (दुसरा पर्याय एका उत्तम नोंदलेल्या पलटण्याचे खंडन करतो; तिसरा थकव्याचे वर्णन करतो, जो उसळी नव्हे तर घसरण देईल आणि ज्याला पुटकीय परिपक्वतेशी वेळबद्ध करता येणार नाही; चौथा पियुषिकेला त्या लूपमधून काढतो जिची उसळी पियुषिका संप्रेरकातच मोजली जाते.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Reproductive Health                                         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-12-reproductive-health",
    subject: "BIOLOGY",
    classLevel: 12,
    chapter: {
      en: "Chapter 3 — Reproductive Health",
      hi: "अध्याय 3 — जनन स्वास्थ्य",
      mr: "प्रकरण 3 — प्रजनन आरोग्य",
    },
    name: {
      en: "Reproductive Health",
      hi: "जनन स्वास्थ्य",
      mr: "प्रजनन आरोग्य",
    },
    summary: {
      en: "The chapter where biology meets what is done with it, and the organising question is not what each method is called but where in a chain of events it intervenes: a chain running from making a gamete, to the two gametes meeting, to the embryo attaching, and every contraceptive breaks it at exactly one of those points, so that a list of names becomes a short argument once the chain is drawn; a set of infections whose spread is a matter of behaviour and detection rather than of any special virulence, and two of which give no symptoms for years while remaining transmissible the whole time; a set of techniques for a couple who cannot conceive, which move fertilisation progressively further out of the body until in one of them a single sperm is injected into a single egg by hand; a diagnostic test devised to find a chromosomal disorder before birth and then misused to find something else, which is why the law now restricts the test and not the treatment; and a sex ratio that records the misuse in the population figures.",
      hi: "यह वह अध्याय है जहाँ जीवविज्ञान का सामना इससे होता है कि उसका किया क्या जाता है, और व्यवस्थित करने वाला प्रश्न यह नहीं कि हर विधि का नाम क्या है बल्कि यह कि वह घटनाओं की शृंखला में कहाँ दख़ल देती है: ऐसी शृंखला जो युग्मक बनने से, दोनों युग्मकों के मिलने तक, भ्रूण के जुड़ने तक चलती है, और हर गर्भनिरोधक उसे ठीक उन्हीं में से एक बिंदु पर तोड़ता है, अतः शृंखला खींच लेने पर नामों की सूची एक छोटा तर्क बन जाती है; ऐसे संक्रमणों का समुच्चय जिनका फैलाव किसी ख़ास उग्रता का नहीं बल्कि व्यवहार और पहचान का मामला है, और जिनमें से दो वर्षों तक कोई लक्षण नहीं देते और पूरे समय संचरणीय बने रहते हैं; ऐसे दंपती के लिए तकनीकों का समुच्चय जो गर्भ धारण नहीं कर पाते, जो निषेचन को उत्तरोत्तर शरीर से बाहर ले जाती हैं यहाँ तक कि उनमें से एक में एक ही शुक्राणु हाथ से एक ही अंड में डाला जाता है; ऐसा नैदानिक परीक्षण जो जन्म से पहले गुणसूत्री विकार ढूँढ़ने को बनाया गया और फिर कुछ और ढूँढ़ने में दुरुपयुक्त हुआ, इसीलिए क़ानून अब उपचार नहीं बल्कि परीक्षण को सीमित करता है; और ऐसा लिंगानुपात जो उस दुरुपयोग को आबादी के आँकड़ों में दर्ज कर देता है।",
      mr: "हे ते प्रकरण आहे जिथे जीवशास्त्राचा सामना त्याचे काय केले जाते याच्याशी होतो, आणि मांडणी करणारा प्रश्न हा नाही की प्रत्येक पद्धतीचे नाव काय तर हा की ती घटनांच्या साखळीत कुठे हस्तक्षेप करते: अशी साखळी जी युग्मक बनण्यापासून, दोन्ही युग्मके भेटण्यापर्यंत, भ्रूण जोडले जाण्यापर्यंत चालते, आणि प्रत्येक गर्भनिरोधक तिला नेमक्या त्यांपैकी एका बिंदूवर तोडतो, म्हणून साखळी काढल्यावर नावांची यादी एक लहान युक्तिवाद बनते; अशा संसर्गांचा संच ज्यांचा प्रसार कोणत्याही विशेष तीव्रतेचा नव्हे तर वर्तन आणि ओळखीचा प्रश्न आहे, आणि ज्यांपैकी दोन वर्षानुवर्षे कोणतीही लक्षणे देत नाहीत आणि अख्खा काळ संक्रमणक्षम राहतात; अशा जोडप्यासाठी तंत्रांचा संच जे गर्भधारणा करू शकत नाहीत, जी फलनाला उत्तरोत्तर शरीराबाहेर नेतात इतके की त्यांपैकी एकात एकच शुक्राणू हाताने एकाच अंडात टोचला जातो; अशी निदान चाचणी जी जन्माआधी गुणसूत्री विकार शोधायला बनवली गेली आणि मग काहीतरी वेगळेच शोधण्यात दुरुपयोगली गेली, म्हणूनच कायदा आता उपचार नव्हे तर चाचणी मर्यादित करतो; आणि असे लिंगगुणोत्तर जे तो दुरुपयोग लोकसंख्येच्या आकड्यांत नोंदवते.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "where-a-contraceptive-intervenes",
        name: {
          en: "Where a contraceptive intervenes",
          hi: "गर्भनिरोधक कहाँ दख़ल देता है",
          mr: "गर्भनिरोधक कुठे हस्तक्षेप करतो",
        },
        kind: "principle behind an intervention",
        prompt: {
          en: "A way of sorting methods not by their names but by which link in the chain they break — gamete production, gamete meeting, or attachment of the embryo. What is this organising idea?",
          hi: "विधियों को उनके नामों से नहीं बल्कि इससे छाँटने का तरीक़ा कि वे शृंखला की कौन-सी कड़ी तोड़ती हैं — युग्मक का बनना, युग्मकों का मिलना, या भ्रूण का जुड़ना। यह व्यवस्थित करने वाला विचार क्या है?",
          mr: "पद्धतींना त्यांच्या नावांनी नव्हे तर त्या साखळीतील कोणता दुवा तोडतात यावरून वेगळे करण्याचा मार्ग — युग्मक बनणे, युग्मके भेटणे, वा भ्रूण जोडले जाणे. ही मांडणी करणारी कल्पना काय आहे?",
        },
        statement: {
          en: "Where a contraceptive intervenes is the useful way to classify methods: hormonal ones prevent ovulation, barriers and sterilisation stop the gametes meeting, and an intrauterine device acts mainly on what happens afterwards.",
          hi: "गर्भनिरोधक कहाँ दख़ल देता है यही विधियों को वर्गीकृत करने का काम का तरीक़ा है: हार्मोनी विधियाँ अंडोत्सर्ग रोकती हैं, अवरोध और बंध्यीकरण युग्मकों का मिलना रोकते हैं, और अंतर्गर्भाशयी युक्ति मुख्यतः उसके बाद जो होता है उस पर काम करती है।",
          mr: "गर्भनिरोधक कुठे हस्तक्षेप करतो हाच पद्धती वर्गीकृत करण्याचा उपयुक्त मार्ग आहे: संप्रेरकी पद्धती अंडोत्सर्ग थांबवतात, अडसर आणि निर्बीजीकरण युग्मके भेटणे थांबवतात, आणि अंतर्गर्भाशयी साधन मुख्यतः त्यानंतर जे घडते त्यावर काम करते.",
        },
        detail: {
          en: "A combined pill works by holding oestrogen and progesterone high enough that the pituitary is suppressed and no surge occurs, which is the same negative feedback the body uses after ovulation.",
          hi: "संयुक्त गोली एस्ट्रोजन और प्रोजेस्टेरोन को इतना ऊँचा थामे रखकर काम करती है कि पीयूष दब जाए और कोई उछाल न हो, और यह वही ऋणात्मक पुनर्भरण है जो शरीर अंडोत्सर्ग के बाद काम में लेता है।",
          mr: "संयुक्त गोळी इस्ट्रोजन आणि प्रोजेस्टेरॉन इतके उच्च धरून ठेवून काम करते की पियुषिका दबावी आणि कोणतीही उसळी होऊ नये, आणि हेच ते ऋण पुनर्भरण आहे जे शरीर अंडोत्सर्गानंतर वापरते.",
        },
        extra: {
          en: "Only the barrier methods also block the transmission of infection, which is why they are recommended even when another method is already in use.",
          hi: "केवल अवरोध विधियाँ ही संक्रमण का संचरण भी रोकती हैं, इसीलिए दूसरी विधि पहले से काम में होने पर भी उन्हीं की सिफ़ारिश की जाती है।",
          mr: "केवळ अडसर पद्धतीच संसर्गाचे संक्रमणही रोखतात, म्हणूनच दुसरी पद्धत आधीच वापरात असतानाही त्यांचीच शिफारस केली जाते.",
        },
        pair: {
          left: {
            en: "Sort the methods by which link they break, not by their names",
            hi: "विधियों को नामों से नहीं, तोड़ी गई कड़ी से छाँटो",
            mr: "पद्धती नावांनी नव्हे, तोडलेल्या दुव्याने वेगळ्या करा",
          },
          right: {
            en: "where a contraceptive intervenes",
            hi: "गर्भनिरोधक कहाँ दख़ल देता है",
            mr: "गर्भनिरोधक कुठे हस्तक्षेप करतो",
          },
        },
      },
      {
        id: "assisted-reproductive-technologies",
        name: {
          en: "Assisted reproductive technologies",
          hi: "सहायक जनन प्रौद्योगिकियाँ",
          mr: "सहाय्यक प्रजनन तंत्रज्ञान",
        },
        kind: "principle behind an intervention",
        prompt: {
          en: "A graded set of procedures that move the meeting of the gametes progressively further out of the body, ending with one sperm placed inside one egg by hand. What are these called?",
          hi: "प्रक्रियाओं का ऐसा श्रेणीबद्ध समुच्चय जो युग्मकों के मिलने को उत्तरोत्तर शरीर से बाहर ले जाता है, और जिसका अंत हाथ से एक अंड के भीतर एक शुक्राणु रखने पर होता है। इन्हें क्या कहते हैं?",
          mr: "प्रक्रियांचा असा श्रेणीबद्ध संच जो युग्मकांच्या भेटीला उत्तरोत्तर शरीराबाहेर नेतो, आणि ज्याचा शेवट हाताने एका अंडात एक शुक्राणू ठेवण्यावर होतो. यांना काय म्हणतात?",
        },
        statement: {
          en: "Assisted reproductive technologies are the methods that help a couple conceive when the usual route fails, ranging from placing sperm in the uterus to fertilising outside the body and transferring the embryo back.",
          hi: "सहायक जनन प्रौद्योगिकियाँ वे विधियाँ हैं जो सामान्य रास्ते के विफल होने पर दंपती को गर्भ धारण में मदद करती हैं, और गर्भाशय में शुक्राणु रखने से लेकर शरीर के बाहर निषेचन कर भ्रूण वापस स्थानांतरित करने तक फैली हैं।",
          mr: "सहाय्यक प्रजनन तंत्रज्ञान म्हणजे त्या पद्धती ज्या नेहमीचा मार्ग अपयशी ठरल्यावर जोडप्याला गर्भधारणेत मदत करतात, आणि गर्भाशयात शुक्राणू ठेवण्यापासून शरीराबाहेर फलन करून भ्रूण परत स्थानांतरित करण्यापर्यंत पसरलेल्या आहेत.",
        },
        detail: {
          en: "Which one is chosen follows from where the obstruction is: a blocked tube is bypassed by fertilising outside, while a low sperm count may need a single sperm injected directly.",
          hi: "कौन-सी चुनी जाएगी यह इससे निकलता है कि रुकावट कहाँ है: अवरुद्ध नलिका को बाहर निषेचन कर पार किया जाता है, जबकि कम शुक्राणु संख्या के लिए शायद एक ही शुक्राणु सीधे डालना पड़े।",
          mr: "कोणती निवडली जाईल हे यातून निघते की अडथळा कुठे आहे: अडलेली नलिका बाहेर फलन करून पार केली जाते, तर कमी शुक्राणू संख्येसाठी कदाचित एकच शुक्राणू थेट टोचावा लागेल.",
        },
        extra: {
          en: "The commonest cause of infertility is not any one condition but a failure to look for the cause at all, and a substantial share of cases turn out to be treatable once identified.",
          hi: "बाँझपन का सबसे आम कारण कोई एक स्थिति नहीं बल्कि कारण को खोजा ही न जाना है, और पहचान हो जाने पर मामलों का काफ़ी हिस्सा उपचार योग्य निकलता है।",
          mr: "वंध्यत्वाचे सर्वांत सामान्य कारण कोणतीही एक स्थिती नसून कारण शोधलेच न जाणे आहे, आणि ओळख झाल्यावर प्रकरणांचा बराच हिस्सा उपचारयोग्य निघतो.",
        },
        pair: {
          left: {
            en: "The procedure is chosen by where the obstruction lies",
            hi: "प्रक्रिया इससे चुनी जाती है कि रुकावट कहाँ है",
            mr: "प्रक्रिया अडथळा कुठे आहे यावरून निवडली जाते",
          },
          right: {
            en: "assisted reproductive technologies",
            hi: "सहायक जनन प्रौद्योगिकियाँ",
            mr: "सहाय्यक प्रजनन तंत्रज्ञान",
          },
        },
      },
      {
        id: "prenatal-diagnosis-and-its-misuse",
        name: {
          en: "Prenatal diagnosis and its misuse",
          hi: "प्रसवपूर्व निदान और उसका दुरुपयोग",
          mr: "प्रसवपूर्व निदान आणि त्याचा दुरुपयोग",
        },
        kind: "principle behind an intervention",
        prompt: {
          en: "A test developed to detect chromosomal disorders before birth, which was then used for something quite different, and which the law now restricts although the technique itself is sound. What is this?",
          hi: "जन्म से पहले गुणसूत्री विकार पकड़ने को विकसित परीक्षण, जो फिर बिलकुल किसी और काम में लिया गया, और जिसे क़ानून अब सीमित करता है यद्यपि तकनीक स्वयं ठीक है। यह क्या है?",
          mr: "जन्माआधी गुणसूत्री विकार पकडायला विकसित केलेली चाचणी, जी मग अगदी वेगळ्याच कामासाठी वापरली गेली, आणि जिला कायदा आता मर्यादित करतो जरी तंत्र स्वतः बरोबर आहे. हे काय आहे?",
        },
        statement: {
          en: "Prenatal diagnosis and its misuse is the case of amniocentesis, a genuine diagnostic tool that was turned to determining sex and thereby to selective abortion, and is now legally restricted.",
          hi: "प्रसवपूर्व निदान और उसका दुरुपयोग उल्बवेधन का मामला है, जो असली नैदानिक उपकरण था और जिसे लिंग तय करने में और इस तरह चयनात्मक गर्भपात में मोड़ दिया गया, और जो अब क़ानूनन सीमित है।",
          mr: "प्रसवपूर्व निदान आणि त्याचा दुरुपयोग हे उल्बवेधनाचे प्रकरण आहे, जे खरे निदान साधन होते आणि ज्याला लिंग ठरवण्यात व त्यायोगे निवडक गर्भपातात वळवले गेले, आणि जे आता कायद्याने मर्यादित आहे.",
        },
        detail: {
          en: "The restriction falls on disclosing the sex rather than on the test itself, because the test remains necessary for the purpose it was designed for.",
          hi: "प्रतिबंध परीक्षण पर नहीं बल्कि लिंग बताने पर है, क्योंकि जिस काम के लिए परीक्षण बना था उसके लिए वह अब भी ज़रूरी है।",
          mr: "निर्बंध चाचणीवर नव्हे तर लिंग सांगण्यावर आहे, कारण ज्या कामासाठी चाचणी बनली होती त्यासाठी ती अजूनही आवश्यक आहे.",
        },
        extra: {
          en: "The consequence is visible in the population figures: the ratio of girls to boys in the youngest age group fell in exactly the districts where the technology spread fastest.",
          hi: "परिणाम आबादी के आँकड़ों में दिखता है: सबसे छोटी आयु वर्ग में लड़कियों का लड़कों से अनुपात ठीक उन्हीं ज़िलों में गिरा जहाँ यह तकनीक सबसे तेज़ी से फैली।",
          mr: "परिणाम लोकसंख्येच्या आकड्यांत दिसतो: सर्वांत लहान वयोगटातील मुलींचे मुलांशी प्रमाण नेमक्या त्याच जिल्ह्यांत घसरले जिथे हे तंत्रज्ञान सर्वांत वेगाने पसरले.",
        },
        pair: {
          left: {
            en: "The law restricts the disclosure and not the technique",
            hi: "क़ानून तकनीक को नहीं, बताने को सीमित करता है",
            mr: "कायदा तंत्राला नव्हे, सांगण्याला मर्यादित करतो",
          },
          right: {
            en: "prenatal diagnosis and its misuse",
            hi: "प्रसवपूर्व निदान और उसका दुरुपयोग",
            mr: "प्रसवपूर्व निदान आणि त्याचा दुरुपयोग",
          },
        },
      },
      {
        id: "sexually-transmitted-infections",
        name: {
          en: "Sexually transmitted infections",
          hi: "यौन संचारित संक्रमण",
          mr: "लैंगिक संक्रमित संसर्ग",
        },
        kind: "public health fact",
        prompt: {
          en: "A group of diseases in which two of the most serious produce no symptoms for years while remaining fully transmissible throughout. Which group is this?",
          hi: "रोगों का ऐसा समूह जिसमें दो सबसे गंभीर वर्षों तक कोई लक्षण नहीं देते और पूरे समय पूरी तरह संचरणीय बने रहते हैं। यह कौन-सा समूह है?",
          mr: "रोगांचा असा गट ज्यात दोन सर्वांत गंभीर वर्षानुवर्षे कोणतीही लक्षणे देत नाहीत आणि अख्खा काळ पूर्णपणे संक्रमणक्षम राहतात. हा कोणता गट?",
        },
        statement: {
          en: "Sexually transmitted infections spread through sexual contact, and several of them are dangerous chiefly because they are silent for long periods and so go untreated.",
          hi: "यौन संचारित संक्रमण यौन संपर्क से फैलते हैं, और उनमें से कई मुख्यतः इसलिए ख़तरनाक हैं कि वे लंबे समय तक चुप रहते हैं और इसलिए अनुपचारित रह जाते हैं।",
          mr: "लैंगिक संक्रमित संसर्ग लैंगिक संपर्काने पसरतात, आणि त्यांतले कित्येक मुख्यतः यासाठी धोकादायक आहेत की ते दीर्घकाळ मूक राहतात आणि म्हणून उपचाराविना उरतात.",
        },
        detail: {
          en: "Most of the bacterial ones are curable if found early, so the harm they do is largely a consequence of late detection rather than of the organism being hard to kill.",
          hi: "जीवाणुजनित अधिकांश जल्दी पकड़ में आ जाएँ तो उपचार योग्य हैं, अतः वे जो नुक़सान करते हैं वह बड़े हिस्से में देर से पहचान का परिणाम है, न कि जीव के मारे जाने में कठिन होने का।",
          mr: "जिवाणूजन्य बहुतांश लवकर सापडल्यास बरे होण्याजोगे आहेत, म्हणून ते जे नुकसान करतात ते मोठ्या प्रमाणात उशिरा ओळखीचा परिणाम आहे, जीव मारायला कठीण असण्याचा नाही.",
        },
        extra: {
          en: "Untreated infection is itself a leading cause of infertility, so the two topics of this chapter turn out to be one topic seen at different stages.",
          hi: "अनुपचारित संक्रमण स्वयं बाँझपन का एक प्रमुख कारण है, अतः इस अध्याय के दोनों विषय भिन्न चरणों पर देखा गया एक ही विषय निकलते हैं।",
          mr: "उपचार न केलेला संसर्ग स्वतः वंध्यत्वाचे एक प्रमुख कारण आहे, म्हणून या प्रकरणाचे दोन्ही विषय वेगळ्या टप्प्यांवर पाहिलेला एकच विषय निघतात.",
        },
        pair: {
          left: {
            en: "Dangerous because silent, not because incurable",
            hi: "ख़तरनाक इसलिए कि चुप हैं, इसलिए नहीं कि लाइलाज हैं",
            mr: "धोकादायक यासाठी की मूक आहेत, यासाठी नाही की असाध्य आहेत",
          },
          right: {
            en: "sexually transmitted infections",
            hi: "यौन संचारित संक्रमण",
            mr: "लैंगिक संक्रमित संसर्ग",
          },
        },
      },
      {
        id: "medical-termination-of-pregnancy",
        name: {
          en: "Medical termination of pregnancy",
          hi: "गर्भ का चिकित्सकीय समापन",
          mr: "गर्भाचे वैद्यकीय समापन",
        },
        kind: "public health fact",
        prompt: {
          en: "A procedure legalised chiefly to replace something already happening in unsafe conditions, so that the change was in who performed it and where rather than in whether it happened. What is this?",
          hi: "ऐसी प्रक्रिया जो मुख्यतः इसलिए वैध की गई कि वह उस चीज़ की जगह ले जो असुरक्षित परिस्थितियों में पहले से हो रही थी, अतः बदलाव इसमें आया कि वह कौन और कहाँ करता है, न कि इसमें कि वह होती है या नहीं। यह क्या है?",
          mr: "अशी प्रक्रिया जी मुख्यतः यासाठी कायदेशीर केली गेली की तिने त्या गोष्टीची जागा घ्यावी जी असुरक्षित परिस्थितीत आधीच घडत होती, म्हणून बदल यात आला की ती कोण आणि कुठे करते, ती घडते की नाही यात नाही. हे काय आहे?",
        },
        statement: {
          en: "Medical termination of pregnancy was legalised in India in 1971 largely to reduce the deaths and injuries caused by unsafe procedures performed outside medical care.",
          hi: "भारत में गर्भ का चिकित्सकीय समापन 1971 में बड़े हिस्से में इसलिए वैध किया गया कि चिकित्सा देखरेख से बाहर की गई असुरक्षित प्रक्रियाओं से होती मौतें और चोटें घटें।",
          mr: "भारतात गर्भाचे वैद्यकीय समापन 1971 मध्ये मोठ्या प्रमाणात यासाठी कायदेशीर केले गेले की वैद्यकीय देखरेखीबाहेर केलेल्या असुरक्षित प्रक्रियांमुळे होणारे मृत्यू आणि दुखापती कमी व्हाव्यात.",
        },
        detail: {
          en: "The law places conditions on the stage of pregnancy and on who may carry it out, which is what distinguishes a regulated procedure from an unregulated one.",
          hi: "क़ानून गर्भ की अवस्था पर और यह कौन कर सकता है इस पर शर्तें रखता है, और यही नियंत्रित प्रक्रिया को अनियंत्रित से अलग करता है।",
          mr: "कायदा गर्भाच्या अवस्थेवर आणि हे कोण करू शकते यावर अटी ठेवतो, आणि हेच नियंत्रित प्रक्रियेला अनियंत्रितापासून वेगळे करते.",
        },
        extra: {
          en: "It is not a method of contraception and is not classified as one, because it acts after a pregnancy has already been established rather than preventing it.",
          hi: "यह गर्भनिरोध की विधि नहीं है और न ही वैसी वर्गीकृत की जाती है, क्योंकि वह गर्भ को रोकने के बजाय गर्भ के स्थापित हो जाने के बाद काम करती है।",
          mr: "ही गर्भनिरोधाची पद्धत नाही आणि तशी वर्गीकृतही केली जात नाही, कारण ती गर्भ रोखण्याऐवजी गर्भ प्रस्थापित झाल्यानंतर काम करते.",
        },
        pair: {
          left: {
            en: "What changed was the conditions, not the occurrence",
            hi: "जो बदला वह परिस्थितियाँ थीं, घटित होना नहीं",
            mr: "जे बदलले ती परिस्थिती होती, घडणे नव्हे",
          },
          right: {
            en: "medical termination of pregnancy",
            hi: "गर्भ का चिकित्सकीय समापन",
            mr: "गर्भाचे वैद्यकीय समापन",
          },
        },
      },
      {
        id: "what-reproductive-health-programmes-measure",
        name: {
          en: "What reproductive health programmes measure",
          hi: "जनन स्वास्थ्य कार्यक्रम क्या नापते हैं",
          mr: "प्रजनन आरोग्य कार्यक्रम काय मोजतात",
        },
        kind: "public health fact",
        prompt: {
          en: "A set of indicators — maternal deaths, infant deaths, births per woman, and the sex ratio at birth — chosen because each one reports on a different part of the same system. What is being described?",
          hi: "सूचकों का ऐसा समुच्चय — मातृ मृत्यु, शिशु मृत्यु, प्रति स्त्री जन्म, और जन्म पर लिंगानुपात — जो इसलिए चुना गया कि हर एक उसी तंत्र के भिन्न हिस्से की ख़बर देता है। यहाँ किसका वर्णन है?",
          mr: "निर्देशकांचा असा संच — मातृ मृत्यू, अर्भक मृत्यू, प्रति स्त्री जन्म, आणि जन्मावेळचे लिंगगुणोत्तर — जो यासाठी निवडला की प्रत्येक त्याच यंत्रणेच्या वेगळ्या भागाची बातमी देतो. इथे कशाचे वर्णन आहे?",
        },
        statement: {
          en: "What reproductive health programmes measure is a small set of population indicators, each reporting on a different stage — the safety of childbirth, the survival of infants, the number of births, and whether daughters are being born in the expected proportion.",
          hi: "जनन स्वास्थ्य कार्यक्रम आबादी के सूचकों का एक छोटा समुच्चय नापते हैं, और हर एक भिन्न चरण की ख़बर देता है — प्रसव की सुरक्षा, शिशुओं का बचना, जन्मों की संख्या, और यह कि बेटियाँ अपेक्षित अनुपात में जन्म ले रही हैं या नहीं।",
          mr: "प्रजनन आरोग्य कार्यक्रम लोकसंख्या निर्देशकांचा एक लहान संच मोजतात, आणि प्रत्येक वेगळ्या टप्प्याची बातमी देतो — प्रसूतीची सुरक्षितता, अर्भकांचे टिकणे, जन्मांची संख्या, आणि मुली अपेक्षित प्रमाणात जन्म घेत आहेत की नाही.",
        },
        detail: {
          en: "The indicators are chosen so that no single one can be improved by neglecting another, which is what makes the set more informative than any one figure.",
          hi: "सूचक ऐसे चुने जाते हैं कि किसी एक को दूसरे की उपेक्षा करके सुधारा न जा सके, और यही समुच्चय को किसी एक आँकड़े से अधिक ज्ञानप्रद बनाता है।",
          mr: "निर्देशक असे निवडले जातात की कोणताही एक दुसऱ्याकडे दुर्लक्ष करून सुधारता येऊ नये, आणि हेच संचाला कोणत्याही एका आकड्याहून अधिक माहितीपूर्ण बनवते.",
        },
        extra: {
          en: "The sex ratio is the one that reports on something no clinical record would show, because it detects a pattern of decisions rather than a disease.",
          hi: "लिंगानुपात वही है जो ऐसी चीज़ की ख़बर देता है जो किसी नैदानिक अभिलेख में नहीं दिखेगी, क्योंकि वह रोग नहीं बल्कि निर्णयों का प्रतिरूप पकड़ता है।",
          mr: "लिंगगुणोत्तर तेच आहे जे अशा गोष्टीची बातमी देते जी कोणत्याही वैद्यकीय नोंदीत दिसणार नाही, कारण ते रोग नव्हे तर निर्णयांचा नमुना पकडते.",
        },
        pair: {
          left: {
            en: "A figure that detects decisions rather than disease",
            hi: "ऐसा आँकड़ा जो रोग नहीं बल्कि निर्णय पकड़ता है",
            mr: "असा आकडा जो रोग नव्हे तर निर्णय पकडतो",
          },
          right: {
            en: "what reproductive health programmes measure",
            hi: "जनन स्वास्थ्य कार्यक्रम क्या नापते हैं",
            mr: "प्रजनन आरोग्य कार्यक्रम काय मोजतात",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student is asked to learn the contraceptive methods and produces a list of a dozen names. Suggest a better way to organise the same material, and say what the organisation makes obvious that the list does not.",
          hi: "एक विद्यार्थी से गर्भनिरोधक विधियाँ सीखने को कहा जाता है और वह एक दर्जन नामों की सूची बना देता है। उसी सामग्री को व्यवस्थित करने का बेहतर तरीक़ा सुझाओ, और बताओ कि वह व्यवस्था क्या स्पष्ट कर देती है जो सूची नहीं करती।",
          mr: "एका विद्यार्थ्याला गर्भनिरोधक पद्धती शिकायला सांगितले जाते आणि तो डझनभर नावांची यादी बनवतो. त्याच सामग्रीची मांडणी करण्याचा अधिक चांगला मार्ग सुचवा, आणि ती मांडणी काय स्पष्ट करते जे यादी करत नाही ते सांगा.",
        },
        choices: [
          {
            en: "Draw the chain of events a pregnancy requires — a gamete is produced, the two gametes meet, the embryo implants — and place each method at the link it breaks. Hormonal methods act at the first link by suppressing the pituitary so no egg is released; barriers and sterilisation act at the second by keeping the gametes apart; an intrauterine device acts chiefly at the third. The organisation makes several things obvious at once: why a method that stops ovulation cannot also stop infection, since infection is not part of that chain at all; why sterilisation is the most reliable, being a physical interruption rather than a daily compliance; and why the failure rate of each method depends on where it acts and how much it depends on being used correctly",
            hi: "उन घटनाओं की शृंखला खींचो जो किसी गर्भ के लिए ज़रूरी हैं — युग्मक बनता है, दोनों युग्मक मिलते हैं, भ्रूण अंतर्रोपित होता है — और हर विधि को उसी कड़ी पर रखो जिसे वह तोड़ती है। हार्मोनी विधियाँ पहली कड़ी पर पीयूष दबाकर काम करती हैं ताकि कोई अंड छूटे ही नहीं; अवरोध और बंध्यीकरण दूसरी पर युग्मकों को अलग रखकर; अंतर्गर्भाशयी युक्ति मुख्यतः तीसरी पर। यह व्यवस्था एक साथ कई बातें स्पष्ट कर देती है: कि जो विधि अंडोत्सर्ग रोकती है वह संक्रमण क्यों नहीं रोक सकती, चूँकि संक्रमण उस शृंखला का हिस्सा है ही नहीं; कि बंध्यीकरण सबसे भरोसेमंद क्यों है, चूँकि वह रोज़ के अनुपालन के बजाय भौतिक व्यवधान है; और कि हर विधि की विफलता दर इस पर क्यों निर्भर है कि वह कहाँ काम करती है और सही ढंग से काम में लिए जाने पर कितना निर्भर है",
            mr: "गर्भासाठी आवश्यक असलेल्या घटनांची साखळी काढा — युग्मक बनते, दोन्ही युग्मके भेटतात, भ्रूण अंतर्रोपित होतो — आणि प्रत्येक पद्धत ती जो दुवा तोडते त्यावर ठेवा. संप्रेरकी पद्धती पहिल्या दुव्यावर पियुषिका दाबून काम करतात जेणेकरून कोणतेही अंड सुटूच नये; अडसर आणि निर्बीजीकरण दुसऱ्यावर युग्मके वेगळी ठेवून; अंतर्गर्भाशयी साधन मुख्यतः तिसऱ्यावर. ही मांडणी एकाच वेळी कित्येक गोष्टी स्पष्ट करते: जी पद्धत अंडोत्सर्ग थांबवते ती संसर्ग का थांबवू शकत नाही, कारण संसर्ग त्या साखळीचा भागच नाही; निर्बीजीकरण सर्वांत भरवशाचे का आहे, कारण ते रोजच्या पालनाऐवजी भौतिक व्यत्यय आहे; आणि प्रत्येक पद्धतीचा अपयश दर ती कुठे काम करते आणि योग्य प्रकारे वापरण्यावर किती अवलंबून आहे यावर का अवलंबून आहे",
          },
          {
            en: "Arrange them by how long each has been available, since the newer methods are always more effective than the older ones and the order therefore records their reliability",
            hi: "उन्हें इससे जमाओ कि हर एक कब से उपलब्ध है, चूँकि नई विधियाँ हमेशा पुरानी से अधिक प्रभावी होती हैं और इसलिए यह क्रम उनकी विश्वसनीयता दर्ज करता है",
            mr: "त्यांना प्रत्येक कधीपासून उपलब्ध आहे यावरून मांडा, कारण नव्या पद्धती नेहमी जुन्यांहून अधिक परिणामकारक असतात आणि म्हणून हा क्रम त्यांची विश्वासार्हता नोंदवतो",
          },
          {
            en: "Group them by whether they are used by men or by women, which is the only distinction that affects how any of them works",
            hi: "उन्हें इससे समूहित करो कि वे पुरुष काम में लेते हैं या स्त्री, और यही एकमात्र भेद है जो इनमें से किसी के चलने पर असर डालता है",
            mr: "त्यांना पुरुष वापरतात की स्त्री यावरून गटबद्ध करा, आणि हाच एकमेव भेद आहे जो यांपैकी कोणतीही कशी चालते यावर परिणाम करतो",
          },
          {
            en: "List them by cost, since a method's mechanism can always be worked out from its price and the cheaper ones act earlier in the process",
            hi: "उन्हें क़ीमत से सूचीबद्ध करो, चूँकि किसी विधि की क्रियाविधि उसके दाम से हमेशा निकाली जा सकती है और सस्ती विधियाँ प्रक्रिया में पहले काम करती हैं",
            mr: "त्यांना किमतीने सूचीबद्ध करा, कारण एखाद्या पद्धतीची यंत्रणा तिच्या किमतीवरून नेहमी काढता येते आणि स्वस्त पद्धती प्रक्रियेत आधी काम करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A list of a dozen names is a memory problem. The same material organised by mechanism is a short argument, and the difference is not presentational — the organised version answers questions the list cannot. FIRST, DRAW THE CHAIN. For a pregnancy to occur, several things must happen in order: an egg must be released; sperm must be deposited and must reach it; fertilisation must occur; and the resulting embryo must implant in a prepared uterine lining. Break any one link and no pregnancy follows. Every contraceptive method is an attack on one specified link, and once that is seen, the methods sort themselves. LINK ONE — PREVENTING OVULATION. Combined oral pills and injectable preparations supply oestrogen and progesterone at levels high enough to hold the pituitary suppressed, so no LH surge occurs and no follicle ruptures. Note that this is not a new trick: it is the body's own post-ovulatory negative feedback, sustained artificially. LINK TWO — KEEPING THE GAMETES APART. Condoms and diaphragms interpose a physical barrier. Vasectomy and tubectomy remove the route entirely by cutting and tying the duct. The distinction within this group is reversibility and reliance on correct use, not mechanism. LINK THREE — AFTERWARDS. Intrauterine devices act mainly on the uterine environment, and copper-bearing ones also impair sperm function. WHAT THE ORGANISATION SHOWS THAT THE LIST DOES NOT. Three things, at least. (1) Only barrier methods block infection, and the reason is now obvious rather than a separate fact to memorise: an infection is not a link in this chain, so a method that acts on ovulation or implantation has no reason to touch it. That is why a barrier is advised even alongside another method. (2) Reliability tracks how much the method depends on a person doing something correctly and repeatedly. Sterilisation is a one-off structural change and is the most reliable; a pill requires daily compliance; a barrier requires correct use every time. The gap between 'perfect use' and 'typical use' failure rates is largest exactly where the demand on the user is greatest. (3) The chain shows what is NOT contraception: medical termination acts after implantation, that is after the chain has completed, so it belongs to a different category however often it is confused with one. THE GENERAL HABIT. When faced with a list, look for the process the items act on and place them along it. A classification built on mechanism predicts properties; a classification built on names or dates predicts nothing. (The second option assumes newer is better, which the reliability of sterilisation refutes; the third picks a distinction that cuts across mechanism, since both sexes have barrier and surgical options; the fourth invents a relation between price and mechanism.)",
          hi: "एक दर्जन नामों की सूची याददाश्त की समस्या है। वही सामग्री क्रियाविधि से व्यवस्थित हो जाए तो एक छोटा तर्क बन जाती है, और अंतर प्रस्तुति का नहीं — व्यवस्थित रूप उन प्रश्नों का उत्तर देता है जिनका सूची नहीं दे सकती। पहले शृंखला खींचो। गर्भ होने के लिए कई चीज़ें क्रम से होनी चाहिए: अंड छूटे; शुक्राणु पहुँचें और उस तक जाएँ; निषेचन हो; और बना भ्रूण तैयार गर्भाशय परत में अंतर्रोपित हो। किसी भी एक कड़ी को तोड़ो और गर्भ नहीं होता। हर गर्भनिरोधक विधि किसी एक निर्दिष्ट कड़ी पर हमला है, और यह दिख जाने पर विधियाँ ख़ुद-ब-ख़ुद छँट जाती हैं। कड़ी एक — अंडोत्सर्ग रोकना। संयुक्त मुख गोलियाँ और इंजेक्शन वाली तैयारियाँ एस्ट्रोजन और प्रोजेस्टेरोन इतने स्तर पर देती हैं कि पीयूष दबा रहे, अतः कोई LH उछाल नहीं होती और कोई पुटक नहीं फटता। ध्यान दो कि यह कोई नई तरकीब नहीं: यह शरीर की अपनी अंडोत्सर्ग-पश्च ऋणात्मक पुनर्भरण है, कृत्रिम रूप से बनाए रखी हुई। कड़ी दो — युग्मकों को अलग रखना। कंडोम और डायाफ़्राम भौतिक अवरोध बीच में रखते हैं। पुरुष नसबंदी और नलिका बंधन वाहिनी काटकर और बाँधकर रास्ता ही हटा देते हैं। इस समूह के भीतर भेद उत्क्रमणीयता और सही उपयोग पर निर्भरता का है, क्रियाविधि का नहीं। कड़ी तीन — उसके बाद। अंतर्गर्भाशयी युक्तियाँ मुख्यतः गर्भाशय के परिवेश पर काम करती हैं, और ताँबा वाली शुक्राणु की क्रिया भी बिगाड़ती हैं। व्यवस्था क्या दिखाती है जो सूची नहीं दिखाती। कम से कम तीन बातें। (1) केवल अवरोध विधियाँ संक्रमण रोकती हैं, और कारण अब स्पष्ट है, रटने का अलग तथ्य नहीं: संक्रमण इस शृंखला की कड़ी है ही नहीं, अतः जो विधि अंडोत्सर्ग या अंतर्रोपण पर काम करती है उसके पास उसे छूने का कोई कारण नहीं। इसीलिए दूसरी विधि के साथ भी अवरोध की सलाह दी जाती है। (2) विश्वसनीयता इस पर चलती है कि विधि किसी व्यक्ति के बार-बार सही ढंग से कुछ करने पर कितना निर्भर है। बंध्यीकरण एक बार का संरचनात्मक बदलाव है और सबसे भरोसेमंद; गोली को रोज़ का अनुपालन चाहिए; अवरोध को हर बार सही उपयोग। 'सही उपयोग' और 'सामान्य उपयोग' की विफलता दरों का फ़ासला ठीक वहाँ सबसे बड़ा है जहाँ उपयोगकर्ता से माँग सबसे अधिक है। (3) शृंखला यह भी दिखाती है कि गर्भनिरोध क्या नहीं है: चिकित्सकीय समापन अंतर्रोपण के बाद काम करता है, यानी शृंखला पूरी हो जाने के बाद, अतः वह भिन्न श्रेणी का है चाहे उसे कितनी ही बार गड्डमड्ड किया जाए। सामान्य आदत। जब कोई सूची सामने हो, तो उस प्रक्रिया को ढूँढ़ो जिस पर वे मदें काम करती हैं और उन्हें उसके अनुदिश रखो। क्रियाविधि पर बना वर्गीकरण गुणों की भविष्यवाणी करता है; नामों या तारीख़ों पर बना कुछ भी नहीं। (दूसरा विकल्प मान लेता है कि नया बेहतर है, जिसका खंडन बंध्यीकरण की विश्वसनीयता करती है; तीसरा ऐसा भेद चुनता है जो क्रियाविधि को काटकर जाता है, चूँकि दोनों लिंगों के पास अवरोध और शल्य दोनों विकल्प हैं; चौथा दाम और क्रियाविधि के बीच रिश्ता गढ़ लेता है।)",
          mr: "डझनभर नावांची यादी ही स्मरणाची समस्या आहे. तीच सामग्री यंत्रणेने मांडली तर एक लहान युक्तिवाद बनते, आणि फरक सादरीकरणाचा नाही — मांडलेली आवृत्ती त्या प्रश्नांची उत्तरे देते जी यादी देऊ शकत नाही. आधी साखळी काढा. गर्भ होण्यासाठी कित्येक गोष्टी क्रमाने घडल्या पाहिजेत: अंड सुटावे; शुक्राणू पोहोचावेत आणि त्यापर्यंत जावेत; फलन व्हावे; आणि बनलेला भ्रूण तयार गर्भाशय अस्तरात अंतर्रोपित व्हावा. कोणताही एक दुवा तोडा आणि गर्भ होत नाही. प्रत्येक गर्भनिरोधक पद्धत कोणत्यातरी एका निर्दिष्ट दुव्यावरचा हल्ला आहे, आणि हे दिसल्यावर पद्धती आपोआप वेगळ्या होतात. दुवा एक — अंडोत्सर्ग थांबवणे. संयुक्त मुखी गोळ्या आणि इंजेक्शनच्या तयारी इस्ट्रोजन आणि प्रोजेस्टेरॉन इतक्या पातळीवर देतात की पियुषिका दबलेली राहावी, म्हणून कोणतीही LH उसळी होत नाही आणि कोणतेही पुटक फुटत नाही. लक्षात घ्या की ही कोणतीही नवी युक्ती नाही: हे शरीराचे स्वतःचे अंडोत्सर्गोत्तर ऋण पुनर्भरण आहे, कृत्रिमरीत्या टिकवलेले. दुवा दोन — युग्मके वेगळी ठेवणे. कंडोम आणि डायाफ्राम भौतिक अडसर मध्ये ठेवतात. पुरुष नसबंदी आणि नलिकाबंधन वाहिनी कापून व बांधून मार्गच काढून टाकतात. या गटातील भेद उत्क्रमणीयता आणि योग्य वापरावरील अवलंबित्वाचा आहे, यंत्रणेचा नाही. दुवा तीन — त्यानंतर. अंतर्गर्भाशयी साधने मुख्यतः गर्भाशयाच्या परिसरावर काम करतात, आणि तांबे असलेली शुक्राणूची क्रियाही बिघडवतात. मांडणी काय दाखवते जे यादी दाखवत नाही. किमान तीन गोष्टी. (1) केवळ अडसर पद्धती संसर्ग रोखतात, आणि कारण आता स्पष्ट आहे, पाठ करण्याचे वेगळे सत्य नाही: संसर्ग या साखळीचा दुवाच नाही, म्हणून जी पद्धत अंडोत्सर्ग वा अंतर्रोपणावर काम करते तिच्याकडे त्याला स्पर्श करण्याचे कोणतेही कारण नाही. म्हणूनच दुसऱ्या पद्धतीसोबतही अडसराचा सल्ला दिला जातो. (2) विश्वासार्हता यावर चालते की पद्धत एखाद्या व्यक्तीने वारंवार योग्य प्रकारे काहीतरी करण्यावर किती अवलंबून आहे. निर्बीजीकरण हा एकदाचा संरचनात्मक बदल आहे आणि सर्वांत भरवशाचा; गोळीला रोजचे पालन लागते; अडसराला प्रत्येक वेळी योग्य वापर. 'योग्य वापर' आणि 'नेहमीचा वापर' यांच्या अपयश दरांतील अंतर नेमके तिथे सर्वांत मोठे आहे जिथे वापरकर्त्याकडून मागणी सर्वाधिक आहे. (3) साखळी हेही दाखवते की गर्भनिरोध काय नाही: वैद्यकीय समापन अंतर्रोपणानंतर काम करते, म्हणजे साखळी पूर्ण झाल्यावर, म्हणून ते वेगळ्या वर्गाचे आहे कितीही वेळा त्याची गल्लत केली गेली तरी. सर्वसाधारण सवय. जेव्हा एखादी यादी समोर असेल, तेव्हा ती प्रक्रिया शोधा जिच्यावर त्या बाबी काम करतात आणि त्यांना तिच्या दिशेने ठेवा. यंत्रणेवर बांधलेले वर्गीकरण गुणधर्मांचे भाकीत करते; नावांवर वा तारखांवर बांधलेले काहीही नाही. (दुसरा पर्याय गृहीत धरतो की नवे चांगले, ज्याचे खंडन निर्बीजीकरणाची विश्वासार्हता करते; तिसरा असा भेद निवडतो जो यंत्रणेला कापून जातो, कारण दोन्ही लिंगांकडे अडसर आणि शस्त्रक्रिया दोन्ही पर्याय आहेत; चौथा किंमत आणि यंत्रणेत नाते घडवतो.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Amniocentesis was developed to detect chromosomal disorders before birth and is medically valuable. It was then widely used to determine sex, and the sex ratio at birth fell in the districts where it spread fastest. Indian law now restricts it. Explain what exactly was restricted and why that is the right target.",
          hi: "उल्बवेधन जन्म से पहले गुणसूत्री विकार पकड़ने को विकसित हुआ और चिकित्सकीय रूप से मूल्यवान है। फिर वह व्यापक रूप से लिंग तय करने में काम में लिया गया, और जिन ज़िलों में वह सबसे तेज़ी से फैला वहाँ जन्म पर लिंगानुपात गिर गया। भारतीय क़ानून अब उसे सीमित करता है। बताओ कि ठीक-ठीक किस चीज़ को सीमित किया गया और वह सही लक्ष्य क्यों है।",
          mr: "उल्बवेधन जन्माआधी गुणसूत्री विकार पकडायला विकसित झाले आणि वैद्यकीयदृष्ट्या मौल्यवान आहे. मग ते व्यापकपणे लिंग ठरवण्यात वापरले गेले, आणि ज्या जिल्ह्यांत ते सर्वांत वेगाने पसरले तिथे जन्मावेळचे लिंगगुणोत्तर घसरले. भारतीय कायदा आता त्याला मर्यादित करतो. नेमके कशाला मर्यादित केले गेले आणि ते योग्य लक्ष्य का आहे ते सांगा.",
        },
        choices: [
          {
            en: "What is restricted is the disclosure of the foetus's sex, not the test. The technique remains necessary — it detects chromosomal and metabolic disorders that cannot be found any other way, and banning it would remove a genuine diagnostic capability to prevent a misuse that is separable from it. The misuse depended on one particular piece of information being passed on, so the law targets that piece: the procedure may be performed on medical indication, the sex must not be communicated, and clinics must register and keep records. This is the general shape of regulating a dual-use technology — identify the specific step at which the harmful application diverges from the beneficial one, and control that step rather than the tool. The law is also only part of the answer, since the demand it addresses comes from outside medicine",
            hi: "जो सीमित है वह भ्रूण का लिंग बताया जाना है, परीक्षण नहीं। तकनीक ज़रूरी बनी हुई है — वह ऐसे गुणसूत्री और उपापचयी विकार पकड़ती है जो किसी और तरह नहीं मिलते, और उस पर प्रतिबंध ऐसे दुरुपयोग को रोकने के लिए असली नैदानिक क्षमता छीन लेता जो उससे अलग किया जा सकता है। दुरुपयोग एक ख़ास सूचना के आगे पहुँचाए जाने पर निर्भर था, अतः क़ानून उसी टुकड़े को निशाना बनाता है: प्रक्रिया चिकित्सकीय संकेत पर की जा सकती है, लिंग बताया नहीं जाना चाहिए, और क्लिनिकों को पंजीकृत होना और अभिलेख रखना पड़ता है। द्विउपयोगी तकनीक के नियमन की सामान्य बनावट यही है — वह विशिष्ट चरण पहचानो जहाँ हानिकारक उपयोग लाभकारी से अलग होता है, और औज़ार के बजाय उस चरण को नियंत्रित करो। क़ानून उत्तर का केवल एक हिस्सा भी है, चूँकि वह जिस माँग को संबोधित करता है वह चिकित्सा के बाहर से आती है",
            mr: "जे मर्यादित आहे ते गर्भाचे लिंग सांगितले जाणे आहे, चाचणी नव्हे. तंत्र आवश्यक राहिले आहे — ते असे गुणसूत्री आणि चयापचयी विकार पकडते जे इतर कोणत्याही प्रकारे सापडत नाहीत, आणि त्यावर बंदी अशा दुरुपयोगाला रोखण्यासाठी खरी निदान क्षमता हिरावून घेईल जो त्याहून वेगळा करता येतो. दुरुपयोग एका विशिष्ट माहितीच्या पुढे पोहोचवण्यावर अवलंबून होता, म्हणून कायदा त्याच तुकड्याला लक्ष्य करतो: प्रक्रिया वैद्यकीय संकेतावर करता येते, लिंग सांगितले जाऊ नये, आणि दवाखान्यांना नोंदणी करावी लागते व नोंदी ठेवाव्या लागतात. द्विउपयोगी तंत्रज्ञानाच्या नियमनाची सर्वसाधारण रचना हीच आहे — तो विशिष्ट टप्पा ओळखा जिथे हानिकारक वापर लाभदायकापासून वेगळा होतो, आणि साधनाऐवजी तो टप्पा नियंत्रित करा. कायदा उत्तराचा केवळ एक भागही आहे, कारण तो ज्या मागणीला संबोधित करतो ती वैद्यकाबाहेरून येते",
          },
          {
            en: "The test itself was banned outright, because a technique capable of misuse cannot be permitted at all, and the chromosomal disorders it detected are now found by other means",
            hi: "परीक्षण को ही पूरी तरह प्रतिबंधित कर दिया गया, क्योंकि दुरुपयोग योग्य तकनीक की अनुमति दी ही नहीं जा सकती, और वह जो गुणसूत्री विकार पकड़ता था वे अब दूसरे तरीक़ों से मिल जाते हैं",
            mr: "चाचणीलाच पूर्णपणे बंदी घातली गेली, कारण दुरुपयोग होऊ शकणाऱ्या तंत्राला परवानगी देताच येत नाही, आणि ते जे गुणसूत्री विकार पकडत होते ते आता इतर मार्गांनी सापडतात",
          },
          {
            en: "Nothing was restricted, since the fall in the sex ratio was a statistical artefact caused by better registration of male births in those districts",
            hi: "कुछ भी सीमित नहीं किया गया, चूँकि लिंगानुपात की गिरावट उन ज़िलों में पुरुष जन्मों के बेहतर पंजीकरण से पैदा हुई सांख्यिकीय कृति थी",
            mr: "काहीही मर्यादित केले गेले नाही, कारण लिंगगुणोत्तरातील घसरण त्या जिल्ह्यांत पुरुष जन्मांच्या अधिक चांगल्या नोंदणीने निर्माण झालेली सांख्यिकीय कृती होती",
          },
          {
            en: "The law restricts who may become pregnant rather than the test, on the grounds that regulating the diagnostic step would be ineffective",
            hi: "क़ानून परीक्षण के बजाय यह सीमित करता है कि कौन गर्भवती हो सकता है, इस आधार पर कि नैदानिक चरण का नियमन बेअसर होता",
            mr: "कायदा चाचणीऐवजी कोण गर्भवती होऊ शकते हे मर्यादित करतो, या आधारावर की निदान टप्प्याचे नियमन निष्प्रभ ठरले असते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is a case worth thinking through rather than memorising, because it is the standard shape of a problem that recurs across science: a technique that is genuinely useful and also enables something harmful, where banning the technique and permitting it are both wrong answers. WHY THE TECHNIQUE IS WORTH KEEPING. Amniocentesis samples the fluid around the foetus and cultures the cells in it. Their karyotype reveals chromosomal disorders — trisomy 21 and others — and biochemical assays on the same cells detect certain metabolic diseases. For a family with a known inherited risk this information changes what can be prepared for and what care is arranged. There is no substitute that gives the same certainty. Ban the procedure and that capability is lost, and the loss falls entirely on people the ban was not aimed at. WHY PERMITTING IT UNCONDITIONALLY WAS ALSO WRONG. The karyotype that shows trisomy also shows the sex chromosomes. Once that information was routinely available and routinely disclosed, it was used for selective abortion of female foetuses on a scale visible in national statistics: the child sex ratio fell, and it fell furthest in exactly the districts where diagnostic clinics multiplied fastest. That is an unusually clean piece of evidence — the effect appears where the cause was introduced, and it appears in a figure no clinic reports and no individual controls. WHERE THE TWO USES DIVERGE, WHICH IS WHERE TO INTERVENE. Both uses share the procedure, the culture and the karyotype. They separate at exactly one step: whether the sex is communicated. So that is what the law targets. Under the Pre-Conception and Pre-Natal Diagnostic Techniques Act, the test may be performed only on stated medical indications, clinics must register and keep records, the sex must not be disclosed to anyone, and advertising sex determination is itself an offence. Notice what is being controlled: not the tool and not the medical decision, but one transfer of information. WHY THE LAW IS NOT THE WHOLE ANSWER. The demand did not originate in medicine and does not end there. Practices around dowry, inheritance and where a daughter is expected to live after marriage are what make a family want the information in the first place, and a regulation on clinics addresses the supply rather than the demand. Enforcement is correspondingly difficult, and the ratio has responded slowly. THE TRANSFERABLE PRINCIPLE. When a technology is dual-use, the useful question is not 'is this technology good or bad' but 'at which step do the two applications diverge, and can that step be controlled without disabling the beneficial one'. Sometimes the answer is yes and the regulation can be precise, as here. Sometimes it is no, and a harder decision has to be made. (The second option is factually wrong about the ban and about the availability of substitutes; the third dismisses a well-established demographic finding; the fourth proposes something neither enacted nor coherent.)",
          hi: "यह मामला रटने के बजाय सोचकर समझने लायक़ है, क्योंकि यह उस समस्या की मानक बनावट है जो विज्ञान भर में लौटती है: ऐसी तकनीक जो वस्तुतः काम की है और साथ ही कुछ हानिकारक भी संभव बनाती है, और जहाँ तकनीक पर प्रतिबंध और उसकी छूट दोनों ग़लत उत्तर हैं। तकनीक रखने लायक़ क्यों है। उल्बवेधन भ्रूण के गिर्द के द्रव का नमूना लेता है और उसमें की कोशिकाओं का संवर्धन करता है। उनका गुणसूत्रचित्र गुणसूत्री विकार उजागर करता है — ट्राइसोमी 21 और अन्य — और उन्हीं कोशिकाओं पर जैवरासायनिक जाँचें कुछ उपापचयी रोग पकड़ती हैं। जिस परिवार में ज्ञात वंशागत जोखिम हो उसके लिए यह सूचना बदल देती है कि किसकी तैयारी की जा सकती है और कैसी देखभाल जुटाई जाए। ऐसा कोई विकल्प नहीं जो वही निश्चितता दे। प्रक्रिया पर प्रतिबंध लगाओ और वह क्षमता चली जाती है, और नुक़सान पूरा उन लोगों पर पड़ता है जिन्हें प्रतिबंध ने निशाना बनाया ही नहीं था। बिना शर्त छूट भी ग़लत क्यों थी। जो गुणसूत्रचित्र ट्राइसोमी दिखाता है वही लिंग गुणसूत्र भी दिखाता है। जैसे ही वह सूचना नियमित रूप से उपलब्ध और नियमित रूप से बताई जाने लगी, वह मादा भ्रूणों के चयनात्मक गर्भपात में इस पैमाने पर काम में आई कि राष्ट्रीय आँकड़ों में दिखने लगी: बाल लिंगानुपात गिरा, और सबसे अधिक ठीक उन्हीं ज़िलों में गिरा जहाँ नैदानिक क्लिनिक सबसे तेज़ी से बढ़े। यह असामान्य रूप से साफ़ प्रमाण है — प्रभाव वहीं प्रकट होता है जहाँ कारण डाला गया, और वह ऐसे आँकड़े में प्रकट होता है जिसे न कोई क्लिनिक बताता है न कोई व्यक्ति नियंत्रित करता है। दोनों उपयोग कहाँ अलग होते हैं, और वहीं दख़ल देना है। दोनों उपयोगों में प्रक्रिया, संवर्धन और गुणसूत्रचित्र साझे हैं। वे ठीक एक ही चरण पर अलग होते हैं: लिंग बताया जाता है या नहीं। अतः क़ानून उसी को निशाना बनाता है। पूर्व-गर्भाधान और प्रसवपूर्व निदान तकनीक अधिनियम के तहत परीक्षण केवल बताए गए चिकित्सकीय संकेतों पर किया जा सकता है, क्लिनिकों को पंजीकृत होना और अभिलेख रखना पड़ता है, लिंग किसी को नहीं बताया जाना चाहिए, और लिंग निर्धारण का विज्ञापन स्वयं अपराध है। ध्यान दो कि नियंत्रित क्या हो रहा है: न औज़ार, न चिकित्सकीय निर्णय, बल्कि सूचना का एक हस्तांतरण। क़ानून पूरा उत्तर क्यों नहीं है। माँग चिकित्सा में नहीं जन्मी और वहीं ख़त्म नहीं होती। दहेज, उत्तराधिकार और विवाह के बाद बेटी से कहाँ रहने की अपेक्षा है, इनके इर्द-गिर्द की प्रथाएँ ही परिवार को वह सूचना चाहने पर मजबूर करती हैं, और क्लिनिकों पर नियमन आपूर्ति को संबोधित करता है, माँग को नहीं। प्रवर्तन तदनुरूप कठिन है, और अनुपात ने धीरे-धीरे उत्तर दिया है। ले जाने योग्य सिद्धांत। जब कोई तकनीक द्विउपयोगी हो, तो काम का प्रश्न 'यह तकनीक अच्छी है या बुरी' नहीं बल्कि 'दोनों उपयोग किस चरण पर अलग होते हैं, और क्या उस चरण को लाभकारी उपयोग अपंग किए बिना नियंत्रित किया जा सकता है' है। कभी उत्तर हाँ होता है और नियमन सटीक हो सकता है, जैसा यहाँ। कभी नहीं, और तब कठिन निर्णय लेना पड़ता है। (दूसरा विकल्प प्रतिबंध के बारे में और विकल्पों की उपलब्धता के बारे में तथ्यतः ग़लत है; तीसरा भलीभाँति स्थापित जनसांख्यिकीय निष्कर्ष को झटक देता है; चौथा ऐसा कुछ प्रस्तावित करता है जो न लागू हुआ न संगत है।)",
          mr: "हे प्रकरण पाठ करण्याऐवजी विचार करून समजण्याजोगे आहे, कारण ही त्या समस्येची प्रमाणित रचना आहे जी विज्ञानभर परतते: असे तंत्र जे खरोखर उपयुक्त आहे आणि सोबतच काहीतरी हानिकारकही शक्य करते, आणि जिथे तंत्रावर बंदी आणि त्याला मुभा दोन्ही चुकीची उत्तरे आहेत. तंत्र ठेवण्याजोगे का आहे. उल्बवेधन गर्भाभोवतीच्या द्रवाचा नमुना घेते आणि त्यातल्या पेशींचे संवर्धन करते. त्यांचा गुणसूत्रचित्र गुणसूत्री विकार उघड करतो — ट्रायसोमी 21 आणि इतर — आणि त्याच पेशींवरच्या जैवरासायनिक तपासण्या काही चयापचयी रोग पकडतात. ज्या कुटुंबात ज्ञात वंशागत धोका आहे त्यांच्यासाठी ही माहिती बदलते की कशाची तयारी करता येईल आणि कशी देखभाल जुळवावी. असा कोणताही पर्याय नाही जो तीच निश्चितता देईल. प्रक्रियेवर बंदी घाला आणि ती क्षमता जाते, आणि नुकसान अख्खे त्या लोकांवर पडते ज्यांना बंदीने लक्ष्य केलेच नव्हते. बिनशर्त मुभाही चुकीची का होती. जो गुणसूत्रचित्र ट्रायसोमी दाखवतो तोच लिंग गुणसूत्रेही दाखवतो. जशी ती माहिती नियमितपणे उपलब्ध आणि नियमितपणे सांगितली जाऊ लागली, तशी ती मादी गर्भांच्या निवडक गर्भपातात इतक्या प्रमाणावर वापरली गेली की राष्ट्रीय आकडेवारीत दिसू लागली: बाल लिंगगुणोत्तर घसरले, आणि सर्वाधिक नेमक्या त्याच जिल्ह्यांत घसरले जिथे निदान दवाखाने सर्वांत वेगाने वाढले. हा असामान्यपणे स्वच्छ पुरावा आहे — परिणाम तिथेच प्रकट होतो जिथे कारण घातले गेले, आणि तो अशा आकड्यात प्रकट होतो जो कोणताही दवाखाना सांगत नाही आणि कोणतीही व्यक्ती नियंत्रित करत नाही. दोन्ही वापर कुठे वेगळे होतात, आणि तिथेच हस्तक्षेप करायचा. दोन्ही वापरांत प्रक्रिया, संवर्धन आणि गुणसूत्रचित्र समाईक आहेत. ते नेमक्या एकाच टप्प्यावर वेगळे होतात: लिंग सांगितले जाते की नाही. म्हणून कायदा त्यालाच लक्ष्य करतो. पूर्व-गर्भधारणा आणि प्रसवपूर्व निदान तंत्र अधिनियमांतर्गत चाचणी केवळ सांगितलेल्या वैद्यकीय संकेतांवर करता येते, दवाखान्यांना नोंदणी करावी लागते व नोंदी ठेवाव्या लागतात, लिंग कोणालाही सांगितले जाऊ नये, आणि लिंग निर्धारणाची जाहिरात स्वतः गुन्हा आहे. लक्षात घ्या की नियंत्रित काय होत आहे: साधन नव्हे, वैद्यकीय निर्णयही नव्हे, तर माहितीचे एक हस्तांतरण. कायदा अख्खे उत्तर का नाही. मागणी वैद्यकात जन्मली नाही आणि तिथेच संपत नाही. हुंडा, वारसा आणि विवाहानंतर मुलीने कुठे राहावे अशी अपेक्षा, यांच्याभोवतीच्या प्रथाच कुटुंबाला ती माहिती हवीशी करतात, आणि दवाखान्यांवरचे नियमन पुरवठ्याला संबोधित करते, मागणीला नाही. अंमलबजावणी त्याअनुषंगाने कठीण आहे, आणि गुणोत्तराने सावकाश प्रतिसाद दिला आहे. सोबत न्यायचे तत्त्व. जेव्हा एखादे तंत्रज्ञान द्विउपयोगी असते, तेव्हा उपयुक्त प्रश्न 'हे तंत्रज्ञान चांगले की वाईट' नसून 'दोन्ही वापर कोणत्या टप्प्यावर वेगळे होतात, आणि तो टप्पा लाभदायक वापर अपंग न करता नियंत्रित करता येईल का' असा आहे. कधी उत्तर होय असते आणि नियमन नेमके असू शकते, जसे इथे. कधी नाही, आणि तेव्हा कठीण निर्णय घ्यावा लागतो. (दुसरा पर्याय बंदीबद्दल आणि पर्यायांच्या उपलब्धतेबद्दल तथ्यतः चुकीचा आहे; तिसरा उत्तम प्रस्थापित लोकसंख्याशास्त्रीय निष्कर्ष झटकतो; चौथा असे काही मांडतो जे लागूही झाले नाही आणि सुसंगतही नाही.)",
        },
      },
    ],
  },
  /*C1*/
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Principles of Inheritance and Variation                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-12-principles-of-inheritance-and-variation",
    subject: "BIOLOGY",
    classLevel: 12,
    chapter: {
      en: "Chapter 4 — Principles of Inheritance and Variation",
      hi: "अध्याय 4 — वंशागति तथा विविधता के सिद्धांत",
      mr: "प्रकरण 4 — आनुवंशिकता आणि विविधतेची तत्त्वे",
    },
    name: {
      en: "Principles of Inheritance and Variation",
      hi: "वंशागति तथा विविधता के सिद्धांत",
      mr: "आनुवंशिकता आणि विविधतेची तत्त्वे",
    },
    summary: {
      en: "A set of rules worked out by counting plants, decades before anyone knew what a gene was made of or where it sat, and the reason they held is that the counting was done on a large enough sample and on characters that happened to behave simply; a rule about factors separating that turns out to be a description of what chromosomes do in the first meiotic division, so that a conclusion drawn from garden peas was later confirmed by looking down a microscope at a grasshopper; a second rule about characters being inherited independently, which is true only when the two lie on different chromosomes and is broken in a way that becomes a method for mapping where genes are; a pattern in which neither parent's version disappears and the offspring is intermediate, which does not refute the rules but shows that dominance was never a property of a factor but of how a factor is read; a single gene affecting many characters at once and many genes affecting one character together, which is why most inherited variation is a gradient rather than two boxes; and a pair of chromosomes that differ between the sexes, which makes some conditions appear far more often in one sex than the other for a reason that is purely a matter of counting copies.",
      hi: "नियमों का ऐसा समुच्चय जो पादप गिनकर निकाला गया, यह जानने से दशकों पहले कि जीन किस चीज़ का बना है या कहाँ बैठता है, और वे इसलिए टिके कि गिनती काफ़ी बड़े नमूने पर और ऐसे लक्षणों पर हुई जो संयोग से सरल बरताव करते थे; कारकों के अलग होने का ऐसा नियम जो पहले अर्धसूत्री विभाजन में गुणसूत्र जो करते हैं उसी का वर्णन निकलता है, अतः बग़ीचे के मटरों से निकाला निष्कर्ष बाद में सूक्ष्मदर्शी से टिड्डे को देखकर पुष्ट हुआ; लक्षणों के स्वतंत्र रूप से वंशागत होने का दूसरा नियम, जो केवल तब सही है जब दोनों भिन्न गुणसूत्रों पर हों और जो ऐसे टूटता है कि टूटना ही जीन कहाँ हैं यह मानचित्रित करने की विधि बन जाता है; ऐसा प्रतिरूप जिसमें किसी भी जनक का रूप ग़ायब नहीं होता और संतति बीच की होती है, जो नियमों का खंडन नहीं करता बल्कि दिखाता है कि प्रभाविता कभी कारक का गुण थी ही नहीं बल्कि इसका कि कारक को पढ़ा कैसे जाता है; एक ही जीन का एक साथ कई लक्षणों को प्रभावित करना और कई जीनों का मिलकर एक लक्षण को, इसीलिए अधिकांश वंशागत विविधता दो ख़ानों के बजाय एक ढाल है; और गुणसूत्रों की ऐसी जोड़ी जो लिंगों में भिन्न है, जिससे कुछ स्थितियाँ एक लिंग में दूसरे से कहीं अधिक बार दिखती हैं, और कारण विशुद्ध रूप से प्रतियाँ गिनने का है।",
      mr: "नियमांचा असा संच जो वनस्पती मोजून काढला गेला, जनुक कशाचे बनले आहे वा कुठे बसते हे कळण्याच्या कित्येक दशके आधी, आणि ते यासाठी टिकले की मोजणी पुरेशा मोठ्या नमुन्यावर आणि अशा लक्षणांवर झाली जी योगायोगाने सोपे वर्तन करत होती; घटक वेगळे होण्याचा असा नियम जो पहिल्या अर्धसूत्री विभाजनात गुणसूत्रे जे करतात त्याचेच वर्णन निघतो, म्हणून बागेतल्या वाटाण्यांतून काढलेला निष्कर्ष नंतर सूक्ष्मदर्शकातून नाकतोड्याकडे पाहून पक्का झाला; लक्षणे स्वतंत्रपणे आनुवंशिक होण्याचा दुसरा नियम, जो केवळ तेव्हा खरा आहे जेव्हा दोन्ही वेगळ्या गुणसूत्रांवर असतील आणि जो असा मोडतो की मोडणेच जनुके कुठे आहेत हे नकाशित करण्याची पद्धत बनते; असा नमुना ज्यात कोणत्याही जनकाचे रूप नाहीसे होत नाही आणि संतती मधली असते, जो नियमांचे खंडन करत नाही तर दाखवतो की प्रभाविता कधी घटकाचा गुणधर्म नव्हतीच तर घटक कसा वाचला जातो याची होती; एकाच जनुकाने एकाच वेळी कित्येक लक्षणांवर परिणाम करणे आणि कित्येक जनुकांनी मिळून एका लक्षणावर, म्हणूनच बहुतांश आनुवंशिक विविधता दोन खोक्यांऐवजी एक उतार आहे; आणि गुणसूत्रांची अशी जोडी जी लिंगांत वेगळी आहे, ज्याने काही स्थिती एका लिंगात दुसऱ्याहून कितीतरी अधिक वेळा दिसतात, आणि कारण निव्वळ प्रती मोजण्याचे आहे.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-law-of-segregation",
        name: {
          en: "The law of segregation",
          hi: "पृथक्करण का नियम",
          mr: "पृथक्करणाचा नियम",
        },
        kind: "rule and the evidence for it",
        prompt: {
          en: "A rule stating that the two factors an individual carries for a character come apart during gamete formation, so that each gamete receives one and only one of them. Which law is this?",
          hi: "ऐसा नियम जो कहता है कि किसी लक्षण के लिए व्यक्ति जो दो कारक ढोता है वे युग्मक बनते समय अलग हो जाते हैं, अतः हर युग्मक को उनमें से एक और केवल एक मिलता है। यह कौन-सा नियम है?",
          mr: "असा नियम जो सांगतो की एखाद्या लक्षणासाठी व्यक्ती जे दोन घटक वाहते ते युग्मक बनताना वेगळे होतात, म्हणून प्रत्येक युग्मकाला त्यांपैकी एक आणि केवळ एकच मिळतो. हा कोणता नियम?",
        },
        statement: {
          en: "The law of segregation says the two alleles of a gene separate during gamete formation, so a gamete carries one of them and the pair is restored at fertilisation.",
          hi: "पृथक्करण का नियम कहता है कि किसी जीन के दोनों एलील युग्मक बनते समय अलग हो जाते हैं, अतः युग्मक उनमें से एक ढोता है और निषेचन पर जोड़ा बहाल हो जाता है।",
          mr: "पृथक्करणाचा नियम सांगतो की एखाद्या जनुकाची दोन्ही अ‍ॅलिले युग्मक बनताना वेगळी होतात, म्हणून युग्मक त्यांपैकी एक वाहतो आणि फलनावर जोडी पुनर्स्थापित होते.",
        },
        detail: {
          en: "The evidence was a ratio: a cross between two heterozygotes gave three plants of one appearance to one of the other, and the recessive form reappeared unchanged after being absent for a whole generation.",
          hi: "प्रमाण एक अनुपात था: दो विषमयुग्मजियों के संकरण ने एक रूप के तीन पादप और दूसरे का एक दिया, और अप्रभावी रूप पूरी एक पीढ़ी अनुपस्थित रहने के बाद अपरिवर्तित लौट आया।",
          mr: "पुरावा एक गुणोत्तर होता: दोन विषमयुग्मजींच्या संकरणाने एका रूपाच्या तीन वनस्पती आणि दुसऱ्याची एक दिली, आणि अप्रभावी रूप अख्खी एक पिढी अनुपस्थित राहून अपरिवर्तित परतले.",
        },
        extra: {
          en: "That reappearance is what ruled out blending: a factor that had been diluted could not have come back at full strength, so the factors must stay separate and intact.",
          hi: "वही लौटना मिश्रण को ख़ारिज करता है: जो कारक पतला हो चुका हो वह पूरी ताक़त से वापस नहीं आ सकता था, अतः कारकों को अलग और सलामत रहना ही चाहिए।",
          mr: "तेच परतणे मिश्रण नाकारते: जो घटक विरळ झाला असेल तो पूर्ण ताकदीने परत येऊ शकला नसता, म्हणून घटकांना वेगळे आणि शाबूत राहावेच लागते.",
        },
        pair: {
          left: {
            en: "A form that vanishes for a generation and returns undiluted",
            hi: "ऐसा रूप जो एक पीढ़ी लुप्त रहकर बिना पतला हुए लौटता है",
            mr: "असे रूप जे एक पिढी लोप पावून विरळ न होता परतते",
          },
          right: {
            en: "the law of segregation",
            hi: "पृथक्करण का नियम",
            mr: "पृथक्करणाचा नियम",
          },
        },
      },
      {
        id: "the-law-of-independent-assortment",
        name: {
          en: "The law of independent assortment",
          hi: "स्वतंत्र अपव्यूहन का नियम",
          mr: "स्वतंत्र अपव्यूहनाचा नियम",
        },
        kind: "rule and the evidence for it",
        prompt: {
          en: "A rule stating that the factors for one character are dealt out to the gametes without regard to the factors for another, which holds only under a condition its author could not have known about. Which law is this?",
          hi: "ऐसा नियम जो कहता है कि एक लक्षण के कारक युग्मकों में बाँटे जाते समय दूसरे लक्षण के कारकों की परवाह नहीं करते, और जो केवल ऐसी शर्त पर टिकता है जिसे उसका प्रतिपादक जान ही नहीं सकता था। यह कौन-सा नियम है?",
          mr: "असा नियम जो सांगतो की एका लक्षणाचे घटक युग्मकांत वाटले जाताना दुसऱ्या लक्षणाच्या घटकांची पर्वा करत नाहीत, आणि जो केवळ अशा अटीवर टिकतो जी त्याचा मांडणारा जाणूच शकत नव्हता. हा कोणता नियम?",
        },
        statement: {
          en: "The law of independent assortment says the alleles of one gene sort into gametes independently of those of another, and it holds when the two genes lie on different chromosomes.",
          hi: "स्वतंत्र अपव्यूहन का नियम कहता है कि एक जीन के एलील युग्मकों में दूसरे जीन के एलीलों से स्वतंत्र रूप से छँटते हैं, और वह तब टिकता है जब दोनों जीन भिन्न गुणसूत्रों पर हों।",
          mr: "स्वतंत्र अपव्यूहनाचा नियम सांगतो की एका जनुकाची अ‍ॅलिले युग्मकांत दुसऱ्या जनुकाच्या अ‍ॅलिलांपासून स्वतंत्रपणे विभागली जातात, आणि तो तेव्हा टिकतो जेव्हा दोन्ही जनुके वेगळ्या गुणसूत्रांवर असतील.",
        },
        detail: {
          en: "The evidence was a nine to three to three to one ratio from a dihybrid cross, which is exactly the two three-to-one ratios multiplied together as independent events should be.",
          hi: "प्रमाण द्विसंकर संकरण से मिला नौ, तीन, तीन, एक का अनुपात था, जो ठीक दोनों तीन-से-एक अनुपातों का गुणनफल है, जैसा स्वतंत्र घटनाओं का होना चाहिए।",
          mr: "पुरावा द्विसंकर संकरणातून मिळालेले नऊ, तीन, तीन, एक हे गुणोत्तर होते, जे नेमके दोन्ही तीन-ला-एक गुणोत्तरांचा गुणाकार आहे, जसे स्वतंत्र घटनांचे असावे.",
        },
        extra: {
          en: "Genes on the same chromosome tend to travel together and break the rule, and the frequency with which they are separated turned out to measure how far apart they lie.",
          hi: "एक ही गुणसूत्र पर के जीन साथ चलने की प्रवृत्ति रखते हैं और नियम तोड़ते हैं, और जिस बारंबारता से वे अलग होते हैं वह उनके बीच की दूरी नापती निकली।",
          mr: "एकाच गुणसूत्रावरची जनुके सोबत जाण्याची प्रवृत्ती ठेवतात आणि नियम मोडतात, आणि ज्या वारंवारतेने ती वेगळी होतात ती त्यांच्यातले अंतर मोजते असे निघाले.",
        },
        pair: {
          left: {
            en: "The exception to the rule became the way to map a chromosome",
            hi: "नियम का अपवाद ही गुणसूत्र मानचित्रित करने का तरीक़ा बन गया",
            mr: "नियमाचा अपवादच गुणसूत्र नकाशित करण्याचा मार्ग बनला",
          },
          right: {
            en: "the law of independent assortment",
            hi: "स्वतंत्र अपव्यूहन का नियम",
            mr: "स्वतंत्र अपव्यूहनाचा नियम",
          },
        },
      },
      {
        id: "the-chromosomal-theory-of-inheritance",
        name: {
          en: "The chromosomal theory of inheritance",
          hi: "वंशागति का गुणसूत्र सिद्धांत",
          mr: "आनुवंशिकतेचा गुणसूत्र सिद्धांत",
        },
        kind: "rule and the evidence for it",
        prompt: {
          en: "A proposal that the abstract factors inferred from counting plants are carried on the visible bodies that pair up and separate under a microscope. Which idea is this?",
          hi: "यह प्रस्ताव कि पादप गिनकर निकाले गए अमूर्त कारक उन्हीं दृश्य पिंडों पर ढोए जाते हैं जो सूक्ष्मदर्शी के नीचे जोड़े बनाते और अलग होते हैं। यह कौन-सा विचार है?",
          mr: "हा प्रस्ताव की वनस्पती मोजून काढलेले अमूर्त घटक त्याच दृश्य पिंडांवर वाहिले जातात जे सूक्ष्मदर्शकाखाली जोड्या बनवतात आणि वेगळे होतात. ही कोणती कल्पना?",
        },
        statement: {
          en: "The chromosomal theory of inheritance holds that genes are carried on chromosomes, because chromosomes pair and separate in meiosis exactly as the inferred factors were said to do.",
          hi: "वंशागति का गुणसूत्र सिद्धांत मानता है कि जीन गुणसूत्रों पर ढोए जाते हैं, क्योंकि गुणसूत्र अर्धसूत्री विभाजन में ठीक वैसे ही जोड़े बनाते और अलग होते हैं जैसा निकाले गए कारकों के बारे में कहा गया था।",
          mr: "आनुवंशिकतेचा गुणसूत्र सिद्धांत मानतो की जनुके गुणसूत्रांवर वाहिली जातात, कारण गुणसूत्रे अर्धसूत्री विभाजनात नेमकी तशीच जोड्या बनवतात आणि वेगळी होतात जसे काढलेल्या घटकांबद्दल सांगितले गेले होते.",
        },
        detail: {
          en: "The match is exact in every respect that matters: factors come in pairs and so do chromosomes, one of each pair goes to each gamete, and different pairs behave independently of one another.",
          hi: "मेल हर उस बात में हूबहू है जो मायने रखती है: कारक जोड़ों में आते हैं और गुणसूत्र भी, हर जोड़े में से एक हर युग्मक को जाता है, और भिन्न जोड़े एक-दूसरे से स्वतंत्र बरतते हैं।",
          mr: "जुळणी प्रत्येक महत्त्वाच्या बाबतीत जशीच्या तशी आहे: घटक जोड्यांत येतात आणि गुणसूत्रेही, प्रत्येक जोडीतले एक प्रत्येक युग्मकाला जाते, आणि वेगळ्या जोड्या परस्परांपासून स्वतंत्र वागतात.",
        },
        extra: {
          en: "It was settled by a fly with white eyes: the character was inherited along with sex, which is only possible if the gene sits on the chromosome that differs between the sexes.",
          hi: "इसे सफ़ेद आँखों वाली एक मक्खी ने तय किया: वह लक्षण लिंग के साथ-साथ वंशागत हुआ, जो केवल तभी संभव है जब जीन उसी गुणसूत्र पर बैठा हो जो लिंगों में भिन्न है।",
          mr: "हे पांढऱ्या डोळ्यांच्या एका माशीने ठरवले: ते लक्षण लिंगासोबत आनुवंशिक झाले, जे केवळ तेव्हाच शक्य आहे जेव्हा जनुक त्याच गुणसूत्रावर बसले असेल जे लिंगांत वेगळे आहे.",
        },
        pair: {
          left: {
            en: "An inference from counting, confirmed under a lens",
            hi: "गिनती से निकाला अनुमान, लेंस के नीचे पुष्ट",
            mr: "मोजणीतून काढलेले अनुमान, भिंगाखाली पक्के",
          },
          right: {
            en: "the chromosomal theory of inheritance",
            hi: "वंशागति का गुणसूत्र सिद्धांत",
            mr: "आनुवंशिकतेचा गुणसूत्र सिद्धांत",
          },
        },
      },
      {
        id: "incomplete-dominance-and-codominance",
        name: {
          en: "Incomplete dominance and codominance",
          hi: "अपूर्ण प्रभाविता और सहप्रभाविता",
          mr: "अपूर्ण प्रभाविता आणि सहप्रभाविता",
        },
        kind: "pattern that looks like an exception",
        prompt: {
          en: "One cross in which the offspring is intermediate between its parents, and another in which both parental versions appear in full, side by side. What are these two patterns called?",
          hi: "ऐसा एक संकरण जिसमें संतति अपने जनकों के बीच की होती है, और दूसरा जिसमें दोनों जनकीय रूप पूरे-पूरे, अगल-बग़ल प्रकट होते हैं। इन दोनों प्रतिरूपों को क्या कहते हैं?",
          mr: "असे एक संकरण ज्यात संतती आपल्या जनकांच्या मधली असते, आणि दुसरे ज्यात दोन्ही जनकीय रूपे पूर्णपणे, शेजारीशेजारी प्रकट होतात. या दोन नमुन्यांना काय म्हणतात?",
        },
        statement: {
          en: "Incomplete dominance and codominance are the patterns in which the heterozygote is intermediate, or shows both alleles fully, instead of resembling one parent.",
          hi: "अपूर्ण प्रभाविता और सहप्रभाविता वे प्रतिरूप हैं जिनमें विषमयुग्मजी बीच का होता है, या दोनों एलील पूरे दिखाता है, किसी एक जनक जैसा होने के बजाय।",
          mr: "अपूर्ण प्रभाविता आणि सहप्रभाविता हे ते नमुने आहेत ज्यांत विषमयुग्मजी मधला असतो, वा दोन्ही अ‍ॅलिले पूर्ण दाखवतो, कोणत्याही एका जनकासारखा असण्याऐवजी.",
        },
        detail: {
          en: "Neither pattern breaks the law of segregation, because the underlying ratio of genotypes is still one to two to one — only the reading of the middle class has changed.",
          hi: "कोई भी प्रतिरूप पृथक्करण के नियम को नहीं तोड़ता, क्योंकि नीचे का जीनप्ररूप अनुपात अब भी एक, दो, एक है — केवल बीच के वर्ग का पढ़ा जाना बदला है।",
          mr: "कोणताही नमुना पृथक्करणाच्या नियमाला मोडत नाही, कारण खालचे जनुकप्ररूप गुणोत्तर अजूनही एक, दोन, एक आहे — केवळ मधल्या वर्गाचे वाचन बदलले आहे.",
        },
        extra: {
          en: "The lesson is that dominance is not a property of an allele but of the relation between an allele and the character being scored, and the same allele can look dominant for one character and not for another.",
          hi: "सीख यह कि प्रभाविता किसी एलील का गुण नहीं बल्कि एलील और जिस लक्षण को आँका जा रहा है उसके बीच के रिश्ते का गुण है, और वही एलील एक लक्षण के लिए प्रभावी दिख सकता है और दूसरे के लिए नहीं।",
          mr: "बोध हा की प्रभाविता कोणत्याही अ‍ॅलिलचा गुणधर्म नसून अ‍ॅलिल आणि जे लक्षण मोजले जात आहे त्यांच्यातील नात्याचा गुणधर्म आहे, आणि तेच अ‍ॅलिल एका लक्षणासाठी प्रभावी दिसू शकते आणि दुसऱ्यासाठी नाही.",
        },
        pair: {
          left: {
            en: "The ratio underneath is unchanged; only the reading differs",
            hi: "नीचे का अनुपात अपरिवर्तित है; केवल पढ़ना भिन्न है",
            mr: "खालचे गुणोत्तर अपरिवर्तित आहे; केवळ वाचन वेगळे आहे",
          },
          right: {
            en: "incomplete dominance and codominance",
            hi: "अपूर्ण प्रभाविता और सहप्रभाविता",
            mr: "अपूर्ण प्रभाविता आणि सहप्रभाविता",
          },
        },
      },
      {
        id: "pleiotropy-and-polygenic-inheritance",
        name: {
          en: "Pleiotropy and polygenic inheritance",
          hi: "बहुप्रभाविता और बहुजीनी वंशागति",
          mr: "बहुप्रभाविता आणि बहुजनुकी आनुवंशिकता",
        },
        kind: "pattern that looks like an exception",
        prompt: {
          en: "One gene changing several unrelated-looking characters at once, and several genes each adding a little to one character. What are these two called?",
          hi: "एक जीन जो एक साथ कई असंबद्ध दिखते लक्षण बदल देता है, और कई जीन जिनमें से हर एक किसी एक लक्षण में थोड़ा-थोड़ा जोड़ता है। इन दोनों को क्या कहते हैं?",
          mr: "एक जनुक जे एकाच वेळी कित्येक असंबद्ध दिसणारी लक्षणे बदलते, आणि कित्येक जनुके ज्यांपैकी प्रत्येक एका लक्षणात थोडे थोडे जोडते. या दोघांना काय म्हणतात?",
        },
        statement: {
          en: "Pleiotropy and polygenic inheritance are one gene affecting many characters and many genes each contributing to one character.",
          hi: "बहुप्रभाविता और बहुजीनी वंशागति क्रमशः एक जीन का कई लक्षणों को प्रभावित करना और कई जीनों में से हर एक का किसी एक लक्षण में योगदान देना है।",
          mr: "बहुप्रभाविता आणि बहुजनुकी आनुवंशिकता म्हणजे अनुक्रमे एका जनुकाने कित्येक लक्षणांवर परिणाम करणे आणि कित्येक जनुकांपैकी प्रत्येकाने एका लक्षणात योगदान देणे.",
        },
        detail: {
          en: "Pleiotropy usually comes from one product being used in several places, so a single defect shows up wherever that product was needed.",
          hi: "बहुप्रभाविता प्रायः एक ही उत्पाद के कई जगह काम में आने से आती है, अतः एक ही दोष वहाँ-वहाँ दिखता है जहाँ वह उत्पाद चाहिए था।",
          mr: "बहुप्रभाविता बहुधा एकाच उत्पादनाच्या कित्येक ठिकाणी वापरले जाण्यातून येते, म्हणून एकच दोष तिथेतिथे दिसतो जिथे ते उत्पादन लागत होते.",
        },
        extra: {
          en: "Polygenic characters give a continuous range rather than distinct classes, which is why height and skin colour do not sort into two boxes the way a pea's shape does.",
          hi: "बहुजीनी लक्षण अलग वर्गों के बजाय एक सतत परास देते हैं, इसीलिए ऊँचाई और त्वचा का रंग वैसे दो ख़ानों में नहीं छँटते जैसे मटर का आकार छँटता है।",
          mr: "बहुजनुकी लक्षणे वेगळ्या वर्गांऐवजी एक सलग व्याप्ती देतात, म्हणूनच उंची आणि त्वचेचा रंग तसे दोन खोक्यांत विभागले जात नाहीत जसे वाटाण्याचा आकार विभागला जातो.",
        },
        pair: {
          left: {
            en: "A gradient in the population instead of two clean classes",
            hi: "आबादी में दो साफ़ वर्गों के बजाय एक ढाल",
            mr: "लोकसंख्येत दोन स्वच्छ वर्गांऐवजी एक उतार",
          },
          right: {
            en: "pleiotropy and polygenic inheritance",
            hi: "बहुप्रभाविता और बहुजीनी वंशागति",
            mr: "बहुप्रभाविता आणि बहुजनुकी आनुवंशिकता",
          },
        },
      },
      {
        id: "sex-linked-inheritance",
        name: {
          en: "Sex-linked inheritance",
          hi: "लिंग सहलग्न वंशागति",
          mr: "लिंग सहलग्न आनुवंशिकता",
        },
        kind: "pattern that looks like an exception",
        prompt: {
          en: "A pattern in which a condition appears far more often in one sex, is passed from a mother who does not have it to half her sons, and never passes from a father to a son at all. What is it?",
          hi: "ऐसा प्रतिरूप जिसमें कोई स्थिति एक लिंग में कहीं अधिक बार दिखती है, ऐसी माँ से जिसे वह नहीं है उसके आधे बेटों तक जाती है, और पिता से बेटे तक कभी नहीं जाती। यह क्या है?",
          mr: "असा नमुना ज्यात एखादी स्थिती एका लिंगात कितीतरी अधिक वेळा दिसते, अशा आईकडून जिला ती नाही तिच्या निम्म्या मुलांपर्यंत जाते, आणि वडिलांकडून मुलापर्यंत कधीच जात नाही. हा काय आहे?",
        },
        statement: {
          en: "Sex-linked inheritance is the transmission of a gene carried on a sex chromosome, and for a gene on the X chromosome a male has only one copy and so shows a recessive allele that a female would mask.",
          hi: "लिंग सहलग्न वंशागति किसी लिंग गुणसूत्र पर ढोए जीन का संचरण है, और X गुणसूत्र पर के जीन के लिए नर के पास केवल एक प्रति है और इसलिए वह ऐसा अप्रभावी एलील दिखा देता है जिसे मादा ढक लेती।",
          mr: "लिंग सहलग्न आनुवंशिकता म्हणजे लिंग गुणसूत्रावर वाहिलेल्या जनुकाचे संक्रमण, आणि X गुणसूत्रावरच्या जनुकासाठी नराकडे केवळ एक प्रत आहे आणि म्हणून तो असे अप्रभावी अ‍ॅलिल दाखवतो जे मादी झाकेल.",
        },
        detail: {
          en: "The whole asymmetry is a matter of counting copies: with only one copy there is no second allele available to mask anything, so a recessive is expressed whenever it is present.",
          hi: "पूरी विषमता प्रतियाँ गिनने का मामला है: केवल एक प्रति के साथ ढकने को कोई दूसरा एलील उपलब्ध ही नहीं, अतः अप्रभावी जब भी मौजूद हो अभिव्यक्त हो जाता है।",
          mr: "अख्खी विषमता प्रती मोजण्याची बाब आहे: केवळ एका प्रतीसह झाकायला दुसरे अ‍ॅलिल उपलब्धच नाही, म्हणून अप्रभावी जेव्हाही उपस्थित असेल तेव्हा व्यक्त होते.",
        },
        extra: {
          en: "The father-to-son gap is the giveaway in a pedigree: a father passes his Y to a son and his X to a daughter, so an X-linked condition cannot travel down the male line.",
          hi: "वंशवृक्ष में पिता-से-बेटा वाला अंतराल ही भेद खोल देता है: पिता अपना Y बेटे को और अपना X बेटी को देता है, अतः X-सहलग्न स्थिति पुरुष वंशरेखा में नीचे नहीं जा सकती।",
          mr: "वंशवृक्षात वडील-ते-मुलगा हे अंतरच रहस्य उघडते: वडील आपले Y मुलाला आणि आपले X मुलीला देतात, म्हणून X-सहलग्न स्थिती पुरुष वंशरेषेत खाली जाऊ शकत नाही.",
        },
        pair: {
          left: {
            en: "Never father to son, and that alone identifies it",
            hi: "पिता से बेटे तक कभी नहीं, और यही अकेला उसे पहचान देता है",
            mr: "वडिलांकडून मुलाकडे कधीच नाही, आणि हेच एकटे तिला ओळख देते",
          },
          right: {
            en: "sex-linked inheritance",
            hi: "लिंग सहलग्न वंशागति",
            mr: "लिंग सहलग्न आनुवंशिकता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Mendel worked out the rules of inheritance decades before anyone knew what a gene was made of, where it sat, or that chromosomes carried anything. Explain how that was possible, and what he did that his predecessors had not.",
          hi: "मेंडेल ने वंशागति के नियम उन दशकों पहले निकाल लिए जब कोई नहीं जानता था कि जीन किस चीज़ का बना है, कहाँ बैठता है, या कि गुणसूत्र कुछ ढोते भी हैं। बताओ कि यह कैसे संभव हुआ, और उसने ऐसा क्या किया जो उससे पहले वालों ने नहीं किया था।",
          mr: "मेंडेलने आनुवंशिकतेचे नियम त्या दशकांआधी काढले जेव्हा जनुक कशाचे बनले आहे, कुठे बसते, वा गुणसूत्रे काही वाहतात हे कोणालाच माहीत नव्हते. हे कसे शक्य झाले, आणि त्याने असे काय केले जे त्याच्या आधीच्यांनी केले नव्हते ते सांगा.",
        },
        choices: [
          {
            en: "He treated inheritance as a counting problem rather than a descriptive one. He chose a plant that could be self-pollinated and cross-pollinated at will, started from true-breeding lines so that the starting material was known, followed one character at a time before combining them, and counted thousands of offspring so that ratios emerged from the noise. He was also fortunate in his characters: each was controlled by a single gene with clean dominance, and the seven he studied were not linked in a way that would have obscured independent assortment. The result was a set of rules about abstract factors whose physical nature was irrelevant to the argument, which is why they survived unchanged when chromosomes and DNA were later discovered",
            hi: "उसने वंशागति को वर्णन की नहीं बल्कि गिनती की समस्या माना। उसने ऐसा पादप चुना जिसका मनचाहा स्व-परागण और पर-परागण हो सके, शुद्ध वंशक्रमों से शुरू किया ताकि आरंभिक सामग्री ज्ञात हो, लक्षणों को जोड़ने से पहले एक-एक करके पीछा किया, और हज़ारों संततियाँ गिनीं ताकि शोर में से अनुपात उभर आएँ। वह अपने लक्षणों में भाग्यशाली भी था: हर एक साफ़ प्रभाविता वाले अकेले जीन से नियंत्रित था, और उसने जिन सातों का अध्ययन किया वे ऐसे सहलग्न नहीं थे कि स्वतंत्र अपव्यूहन धुँधला पड़ जाता। परिणाम अमूर्त कारकों के बारे में नियमों का ऐसा समुच्चय था जिसके तर्क के लिए उनकी भौतिक प्रकृति अप्रासंगिक थी, इसीलिए बाद में गुणसूत्र और DNA मिलने पर भी वे अपरिवर्तित बचे",
            mr: "त्याने आनुवंशिकतेला वर्णनाची नव्हे तर मोजणीची समस्या मानले. त्याने अशी वनस्पती निवडली जिचे मनाजोगे स्व-परागण आणि पर-परागण होऊ शकेल, शुद्ध वंशांपासून सुरुवात केली जेणेकरून प्रारंभिक सामग्री ज्ञात असावी, लक्षणे एकत्र करण्याआधी एकेक करून पाठलाग केला, आणि हजारो संतती मोजल्या जेणेकरून गोंगाटातून गुणोत्तरे उमटावीत. तो आपल्या लक्षणांतही भाग्यवान होता: प्रत्येक स्वच्छ प्रभाविता असलेल्या एकाच जनुकाने नियंत्रित होते, आणि त्याने ज्या सातांचा अभ्यास केला ती अशी सहलग्न नव्हती की स्वतंत्र अपव्यूहन धूसर व्हावे. निकाल अमूर्त घटकांबद्दलच्या नियमांचा असा संच होता ज्याच्या युक्तिवादासाठी त्यांचे भौतिक स्वरूप असंबद्ध होते, म्हणूनच नंतर गुणसूत्रे आणि DNA सापडल्यावरही ते अपरिवर्तित टिकले",
          },
          {
            en: "He had access to early microscopes that showed him the chromosomes separating, and inferred the rules from watching that directly rather than from any counting",
            hi: "उसके पास ऐसे आरंभिक सूक्ष्मदर्शी थे जिन्होंने उसे गुणसूत्र अलग होते दिखाए, और उसने किसी गिनती से नहीं बल्कि उसे सीधे देखकर नियम निकाले",
            mr: "त्याच्याकडे असे प्रारंभिक सूक्ष्मदर्शक होते ज्यांनी त्याला गुणसूत्रे वेगळी होताना दाखवली, आणि त्याने कोणत्याही मोजणीतून नव्हे तर ते थेट पाहून नियम काढले",
          },
          {
            en: "He worked on a single character in a single generation, which is why his conclusions were simple enough to be correct without any knowledge of cells",
            hi: "उसने एक ही पीढ़ी में एक ही लक्षण पर काम किया, इसीलिए उसके निष्कर्ष कोशिकाओं के किसी ज्ञान के बिना ठीक होने भर सरल थे",
            mr: "त्याने एकाच पिढीत एकाच लक्षणावर काम केले, म्हणूनच त्याचे निष्कर्ष पेशींच्या कोणत्याही ज्ञानाविना बरोबर असण्याइतके सोपे होते",
          },
          {
            en: "His rules were in fact wrong until chromosomes were discovered, at which point they had to be substantially rewritten to match what was seen under the microscope",
            hi: "गुणसूत्रों की खोज तक उसके नियम वस्तुतः ग़लत थे, और तब सूक्ष्मदर्शी के नीचे जो दिखा उससे मेल खाने को उन्हें काफ़ी हद तक फिर से लिखना पड़ा",
            mr: "गुणसूत्रांच्या शोधापर्यंत त्याचे नियम प्रत्यक्षात चुकीचे होते, आणि तेव्हा सूक्ष्मदर्शकाखाली जे दिसले त्याच्याशी जुळण्यास ते बऱ्याच प्रमाणात पुन्हा लिहावे लागले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The question is really about method, and it is worth taking seriously, because 'he was clever' explains nothing. Others before him had crossed plants and looked at the results for a century. What he did differently is recoverable from the design of the experiments. HE MADE IT A COUNTING PROBLEM. Earlier workers described what offspring looked like. Mendel counted them — 19,959 plants in the F₂ of one experiment alone. That matters because the rules he was after are statements about proportions, and a proportion cannot be seen in a handful of plants. Three-to-one is invisible in eight offspring and unmistakable in eight hundred. THE CHOICE OF ORGANISM WAS PART OF THE ARGUMENT. Peas self-pollinate naturally, so true-breeding lines could be established and verified before the experiment began, which means he knew what he was starting with — something his predecessors usually did not. The flower structure also allows deliberate cross-pollination with the anthers removed, so he controlled which cross happened. And peas grow fast in quantity, which is what made the large numbers affordable. HE SIMPLIFIED BEFORE COMBINING. He followed one character at a time — seed shape alone, then flower colour alone — until each was understood, and only then crossed plants differing in two characters at once. That ordering is what let him see that the dihybrid ratio was the product of two monohybrid ratios rather than a new phenomenon needing its own explanation. HE WAS ALSO LUCKY, AND SAYING SO IS NOT A CRITICISM. Each of his seven characters happened to be governed by a single gene with complete dominance; had he chosen flower colour in snapdragons he would have found intermediates and might have concluded something quite different. And although peas have only seven chromosome pairs, the genes he studied were either on different chromosomes or far enough apart to assort nearly independently — with a different set he would have found linkage and no clean nine-three-three-one. Good design put him in a position where luck could help. WHY THE RULES SURVIVED. This is the part worth carrying away. His conclusions were about ABSTRACT FACTORS: things that come in pairs, separate in gamete formation, and stay intact rather than blending. Nothing in the argument depended on what those factors were made of or where they were. So when Sutton and Boveri noticed that chromosomes behave in exactly that way, and when DNA was later identified as the material, neither discovery required the rules to change — they supplied the mechanism underneath rules that were already correct. A conclusion drawn at the right level of abstraction is not overturned by discoveries at a lower level; it is explained by them. (The second option invents microscopy he did not use and inverts his actual method; the third understates the work — he followed characters through several generations, and a single generation could not have shown segregation at all; the fourth reverses the history, since the chromosomal theory confirmed the rules rather than replacing them.)",
          hi: "प्रश्न असल में विधि के बारे में है, और उसे गंभीरता से लेना चाहिए, क्योंकि 'वह चतुर था' कुछ नहीं समझाता। उससे पहले भी लोग सौ साल से पादपों का संकरण कर परिणाम देख रहे थे। उसने अलग क्या किया यह प्रयोगों की बनावट से निकाला जा सकता है। उसने इसे गिनती की समस्या बनाया। पहले के काम करने वाले वर्णन करते थे कि संतति कैसी दिखी। मेंडेल ने उन्हें गिना — अकेले एक प्रयोग की F₂ में 19,959 पादप। यह इसलिए मायने रखता है कि वह जिन नियमों के पीछे था वे अनुपातों के बारे में कथन हैं, और मुट्ठी भर पादपों में अनुपात दिख ही नहीं सकता। तीन-से-एक आठ संततियों में अदृश्य है और आठ सौ में अचूक। जीव का चुनाव तर्क का हिस्सा था। मटर स्वाभाविक रूप से स्व-परागित होते हैं, अतः प्रयोग शुरू होने से पहले शुद्ध वंशक्रम स्थापित और सत्यापित किए जा सकते थे, यानी वह जानता था कि वह किससे शुरू कर रहा है — जो उससे पहले वाले प्रायः नहीं जानते थे। पुष्प की संरचना परागकोश हटाकर जानबूझकर पर-परागण भी होने देती है, अतः कौन-सा संकरण होगा यह उसके नियंत्रण में था। और मटर तेज़ी से बड़ी मात्रा में उगते हैं, जिससे बड़ी संख्याएँ वहन योग्य हुईं। उसने जोड़ने से पहले सरल किया। उसने एक बार में एक लक्षण का पीछा किया — केवल बीज का आकार, फिर केवल पुष्प का रंग — जब तक हर एक समझ में न आ जाए, और तभी दो लक्षणों में भिन्न पादपों का एक साथ संकरण किया। उसी क्रम ने उसे देखने दिया कि द्विसंकर अनुपात दो एकसंकर अनुपातों का गुणनफल है, न कि कोई नई परिघटना जिसे अपनी अलग व्याख्या चाहिए। वह भाग्यशाली भी था, और यह कहना आलोचना नहीं है। उसके सातों लक्षण संयोग से पूर्ण प्रभाविता वाले अकेले जीन से शासित थे; यदि उसने स्नैपड्रैगन में पुष्प का रंग चुना होता तो उसे बीच के रूप मिलते और वह कुछ और ही निष्कर्ष निकालता। और यद्यपि मटर में केवल सात गुणसूत्र जोड़े हैं, उसने जिन जीनों का अध्ययन किया वे या तो भिन्न गुणसूत्रों पर थे या इतनी दूर कि लगभग स्वतंत्र छँटें — किसी और समुच्चय से उसे सहलग्नता मिलती और कोई साफ़ नौ-तीन-तीन-एक नहीं। अच्छी बनावट ने उसे उस जगह पहुँचाया जहाँ भाग्य मदद कर सके। नियम क्यों टिके। यही हिस्सा साथ ले जाने लायक़ है। उसके निष्कर्ष अमूर्त कारकों के बारे में थे: ऐसी चीज़ें जो जोड़ों में आती हैं, युग्मक बनते समय अलग होती हैं, और मिलने के बजाय सलामत रहती हैं। तर्क में कुछ भी इस पर निर्भर नहीं था कि वे कारक किस चीज़ के बने हैं या कहाँ हैं। अतः जब सटन और बोवेरी ने देखा कि गुणसूत्र ठीक वैसे ही बरतते हैं, और जब बाद में DNA को वह सामग्री पहचाना गया, तो किसी भी खोज को नियम बदलने की ज़रूरत नहीं पड़ी — उन्होंने उन नियमों के नीचे की क्रियाविधि दी जो पहले से ही ठीक थे। सही स्तर के अमूर्तन पर निकाला निष्कर्ष निचले स्तर की खोजों से उलटता नहीं; वे उसे समझाती हैं। (दूसरा विकल्प ऐसी सूक्ष्मदर्शिकी गढ़ता है जो उसने काम में ली ही नहीं और उसकी असली विधि उलट देता है; तीसरा काम को कम आँकता है — उसने लक्षणों का कई पीढ़ियों तक पीछा किया, और एक ही पीढ़ी पृथक्करण दिखा ही नहीं सकती थी; चौथा इतिहास उलट देता है, चूँकि गुणसूत्र सिद्धांत ने नियमों की जगह लेने के बजाय उनकी पुष्टि की।)",
          mr: "प्रश्न खरे तर पद्धतीबद्दल आहे, आणि तो गांभीर्याने घेण्याजोगा आहे, कारण 'तो हुशार होता' काहीही समजावत नाही. त्याच्याआधीही लोक शंभर वर्षे वनस्पतींचे संकरण करून निकाल पाहत होते. त्याने वेगळे काय केले हे प्रयोगांच्या रचनेतून काढता येते. त्याने याला मोजणीची समस्या बनवले. आधीचे काम करणारे संतती कशी दिसली याचे वर्णन करत. मेंडेलने त्यांना मोजले — एकाच प्रयोगाच्या F₂ मध्ये 19,959 वनस्पती. हे यासाठी महत्त्वाचे की तो ज्या नियमांच्या मागे होता ती प्रमाणांबद्दलची विधाने आहेत, आणि मूठभर वनस्पतींत प्रमाण दिसूच शकत नाही. तीन-ला-एक आठ संततींत अदृश्य आहे आणि आठशेत अचूक. जीवाची निवड युक्तिवादाचा भाग होती. वाटाणे नैसर्गिकरीत्या स्व-परागित होतात, म्हणून प्रयोग सुरू होण्याआधी शुद्ध वंश प्रस्थापित आणि पडताळता येत होते, म्हणजे तो कशापासून सुरू करत आहे हे त्याला माहीत होते — जे त्याच्याआधीच्यांना बहुधा माहीत नव्हते. फुलाची रचना परागकोश काढून जाणीवपूर्वक पर-परागणही होऊ देते, म्हणून कोणते संकरण घडेल हे त्याच्या नियंत्रणात होते. आणि वाटाणे झपाट्याने मोठ्या प्रमाणात उगवतात, ज्याने मोठ्या संख्या परवडणाऱ्या झाल्या. त्याने जोडण्याआधी सोपे केले. त्याने एका वेळी एका लक्षणाचा पाठलाग केला — केवळ बियाचा आकार, मग केवळ फुलाचा रंग — जोवर प्रत्येक समजत नाही, आणि तेव्हाच दोन लक्षणांत वेगळ्या वनस्पतींचे एकाच वेळी संकरण केले. त्याच क्रमाने त्याला पाहू दिले की द्विसंकर गुणोत्तर हे दोन एकसंकर गुणोत्तरांचा गुणाकार आहे, कोणतीही नवी घटना नव्हे जिला स्वतःचे वेगळे स्पष्टीकरण लागेल. तो भाग्यवानही होता, आणि हे म्हणणे टीका नाही. त्याची सातही लक्षणे योगायोगाने पूर्ण प्रभाविता असलेल्या एकाच जनुकाने शासित होती; जर त्याने स्नॅपड्रॅगनमध्ये फुलाचा रंग निवडला असता तर त्याला मधली रूपे मिळाली असती आणि त्याने काहीतरी वेगळाच निष्कर्ष काढला असता. आणि जरी वाटाण्यात केवळ सात गुणसूत्र जोड्या असल्या तरी त्याने ज्या जनुकांचा अभ्यास केला ती एकतर वेगळ्या गुणसूत्रांवर होती वा इतकी दूर की जवळपास स्वतंत्रपणे विभागावीत — दुसऱ्या संचाने त्याला सहलग्नता मिळाली असती आणि कोणतेही स्वच्छ नऊ-तीन-तीन-एक नाही. चांगल्या रचनेने त्याला त्या जागी नेले जिथे नशीब मदत करू शकेल. नियम का टिकले. हाच भाग सोबत न्यायचा आहे. त्याचे निष्कर्ष अमूर्त घटकांबद्दल होते: अशा गोष्टी ज्या जोड्यांत येतात, युग्मक बनताना वेगळ्या होतात, आणि मिसळण्याऐवजी शाबूत राहतात. युक्तिवादात काहीही यावर अवलंबून नव्हते की ते घटक कशाचे बनले आहेत वा कुठे आहेत. म्हणून जेव्हा सटन आणि बोवेरींनी पाहिले की गुणसूत्रे नेमकी तशीच वागतात, आणि जेव्हा नंतर DNA ला ती सामग्री ओळखले गेले, तेव्हा कोणत्याही शोधाला नियम बदलण्याची गरज पडली नाही — त्यांनी आधीच बरोबर असलेल्या नियमांखालची यंत्रणा दिली. योग्य अमूर्ततेच्या पातळीवर काढलेला निष्कर्ष खालच्या पातळीच्या शोधांनी उलटत नाही; ते त्याला समजावतात. (दुसरा पर्याय अशी सूक्ष्मदर्शिकी घडवतो जी त्याने वापरलीच नाही आणि त्याची खरी पद्धत उलटवतो; तिसरा कामाला कमी लेखतो — त्याने लक्षणांचा कित्येक पिढ्यांपर्यंत पाठलाग केला, आणि एकच पिढी पृथक्करण दाखवूच शकली नसती; चौथा इतिहास उलटवतो, कारण गुणसूत्र सिद्धांताने नियमांची जागा घेण्याऐवजी त्यांची खात्री दिली.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Haemophilia and red-green colour blindness appear far more often in males than in females, are typically passed from an unaffected mother to half her sons, and are never passed from a father to his son. Explain all three observations from a single fact, and say what a pedigree showing father-to-son transmission would tell you.",
          hi: "हीमोफ़ीलिया और लाल-हरा वर्णांधता पुरुषों में स्त्रियों से कहीं अधिक बार दिखते हैं, प्रायः ऐसी माँ से जिसे वह नहीं है उसके आधे बेटों तक जाते हैं, और पिता से बेटे तक कभी नहीं जाते। तीनों प्रेक्षणों को एक ही तथ्य से समझाओ, और बताओ कि पिता-से-बेटे संचरण दिखाता वंशवृक्ष तुम्हें क्या बता देगा।",
          mr: "हिमोफिलिया आणि तांबडा-हिरवा वर्णांधत्व पुरुषांत स्त्रियांहून कितीतरी अधिक वेळा दिसतात, बहुधा अशा आईकडून जिला ते नाही तिच्या निम्म्या मुलांपर्यंत जातात, आणि वडिलांकडून मुलापर्यंत कधीच जात नाहीत. तिन्ही निरीक्षणे एकाच सत्यातून समजावा, आणि वडील-ते-मुलगा संक्रमण दाखवणारा वंशवृक्ष तुम्हाला काय सांगेल ते सांगा.",
        },
        choices: [
          {
            en: "The single fact is that the gene sits on the X chromosome, and a male has one X where a female has two. A female with one faulty allele has a normal one on her other X to mask it, so she is an unaffected carrier; a male has no second copy, so a recessive allele on his only X is expressed whenever it is present — hence the excess in males. A carrier mother passes one or other of her X chromosomes at random, so half her sons receive the faulty one and are affected. And a father gives his son a Y, never an X, so the condition cannot pass down the male line at all. A pedigree showing father-to-son transmission would therefore rule out X-linkage immediately, and point to an autosomal gene or one on the Y",
            hi: "वह अकेला तथ्य यह है कि जीन X गुणसूत्र पर बैठा है, और नर के पास एक X है जहाँ मादा के पास दो। जिस मादा के पास एक दोषपूर्ण एलील है उसके दूसरे X पर उसे ढकने को सामान्य एलील है, अतः वह अप्रभावित वाहक है; नर के पास दूसरी प्रति है ही नहीं, अतः उसके अकेले X पर का अप्रभावी एलील जब भी मौजूद हो अभिव्यक्त हो जाता है — इसीलिए पुरुषों में अधिकता। वाहक माँ अपने दोनों X में से कोई एक बेतरतीब देती है, अतः उसके आधे बेटों को दोषपूर्ण वाला मिलता है और वे प्रभावित होते हैं। और पिता अपने बेटे को Y देता है, X कभी नहीं, अतः यह स्थिति पुरुष वंशरेखा में नीचे जा ही नहीं सकती। अतः पिता-से-बेटे संचरण दिखाता वंशवृक्ष X-सहलग्नता को तुरंत ख़ारिज कर देगा, और अलिंगसूत्री जीन या Y पर के जीन की ओर इशारा करेगा",
            mr: "ते एकच सत्य हे की जनुक X गुणसूत्रावर बसले आहे, आणि नराकडे एक X आहे जिथे मादीकडे दोन. ज्या मादीकडे एक सदोष अ‍ॅलिल आहे तिच्या दुसऱ्या X वर ते झाकायला सामान्य अ‍ॅलिल आहे, म्हणून ती अप्रभावित वाहक आहे; नराकडे दुसरी प्रत आहेच नाही, म्हणून त्याच्या एकट्या X वरचे अप्रभावी अ‍ॅलिल जेव्हाही उपस्थित असेल तेव्हा व्यक्त होते — म्हणूनच पुरुषांत अधिक्य. वाहक आई आपल्या दोन X पैकी कोणतेही एक यादृच्छिक देते, म्हणून तिच्या निम्म्या मुलांना सदोष मिळते आणि ते प्रभावित होतात. आणि वडील आपल्या मुलाला Y देतात, X कधीच नाही, म्हणून ही स्थिती पुरुष वंशरेषेत खाली जाऊच शकत नाही. म्हणून वडील-ते-मुलगा संक्रमण दाखवणारा वंशवृक्ष X-सहलग्नता लगेच नाकारेल, आणि अलिंगसूत्री जनुक वा Y वरच्या जनुकाकडे बोट दाखवेल",
          },
          {
            en: "The condition is more common in males because male cells are more susceptible to mutation, and the father-to-son gap reflects the shorter time a Y chromosome spends replicating",
            hi: "यह स्थिति पुरुषों में इसलिए अधिक आम है कि पुरुष कोशिकाएँ उत्परिवर्तन के प्रति अधिक संवेदी हैं, और पिता-से-बेटे का अंतराल Y गुणसूत्र के प्रतिकृति में कम समय बिताने को दर्शाता है",
            mr: "ही स्थिती पुरुषांत यासाठी अधिक सामान्य आहे की पुरुष पेशी उत्परिवर्तनाबाबत अधिक संवेदनशील आहेत, आणि वडील-ते-मुलगा अंतर Y गुणसूत्र प्रतिकृतीत कमी वेळ घालवते हे दर्शवते",
          },
          {
            en: "The gene is on the Y chromosome, which is why only males are affected and why the mother is the one who transmits it",
            hi: "जीन Y गुणसूत्र पर है, इसीलिए केवल पुरुष प्रभावित होते हैं और इसीलिए संचरण माँ करती है",
            mr: "जनुक Y गुणसूत्रावर आहे, म्हणूनच केवळ पुरुष प्रभावित होतात आणि म्हणूनच संक्रमण आई करते",
          },
          {
            en: "Females are protected because the condition requires male hormones to be expressed, so a female carrying two faulty alleles would still show no symptoms",
            hi: "स्त्रियाँ इसलिए बची रहती हैं कि इस स्थिति को अभिव्यक्त होने के लिए पुरुष हार्मोन चाहिए, अतः दो दोषपूर्ण एलील ढोती स्त्री में भी कोई लक्षण नहीं दिखेगा",
            mr: "स्त्रिया यासाठी वाचतात की या स्थितीला व्यक्त होण्यास पुरुष संप्रेरके लागतात, म्हणून दोन सदोष अ‍ॅलिले वाहणाऱ्या स्त्रीतही कोणतीही लक्षणे दिसणार नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three observations, and the satisfying thing is that one structural fact produces all three without any extra assumptions. The fact: the gene lies on the X chromosome, and the sexes differ in how many X chromosomes they have — a female has two, a male one X and one Y. THE EXCESS IN MALES IS A MATTER OF COUNTING COPIES. Take a recessive allele on the X. A female carrying one copy has a functional allele on her other X, which supplies the missing product, so she is unaffected — a carrier. For her to be affected she would need the faulty allele on both X chromosomes, which requires a carrier or affected mother AND an affected father, a much rarer coincidence. A male has only one X. There is no second copy to mask anything, so the allele is expressed whenever he inherits it. The terminology is worth being precise about: he is hemizygous, neither homozygous nor heterozygous, because the question of a pair does not arise. If the allele has a frequency of q in the population, the proportion of affected males is q and of affected females q² — for a rare allele, an enormous difference. HALF THE SONS OF A CARRIER, BECAUSE MEIOSIS IS FAIR. A carrier mother has one normal X and one carrying the faulty allele. Segregation sends one or the other into each egg with equal probability. A son gets his single X from his mother, so half her sons inherit the faulty allele and, having nothing to mask it, are affected. Half her daughters inherit it too, but they receive a normal X from their father and so become carriers in their turn — the condition travels through females and appears in males, generation after generation. NO FATHER-TO-SON TRANSMISSION, WHICH IS THE DECISIVE SIGN. A son is a son precisely because he received his father's Y. Whatever is on the father's X goes to his daughters — all of them, in fact, so an affected man's daughters are all carriers. There is simply no route by which an X-linked gene can pass from a father to a son. WHAT THE HYPOTHETICAL PEDIGREE WOULD TELL YOU. This is the useful part, because it shows the reasoning working as a test rather than as a story. If a pedigree showed an affected father with an affected son, and the mother was not a carrier, X-linkage is excluded outright — not made less likely, excluded, because the transmission route does not exist. The remaining possibilities are an autosomal gene (dominant, if it appears in every generation) or a Y-linked one, which would be distinguishable because a Y-linked condition passes to ALL sons and no daughters. THE GENERAL POINT. A good explanation does not just accommodate the observations; it forbids something. Here it forbids one specific transmission, and that prohibition is what makes the hypothesis testable from a family tree alone, with no molecular work at all. (The second option invents a susceptibility difference and misdescribes Y replication; the third places the gene on the Y, which contradicts a mother transmitting it; the fourth would predict no affected females ever, which is false — such women are rare but real.)",
          hi: "तीन प्रेक्षण, और संतोष की बात यह कि एक ही संरचनात्मक तथ्य बिना किसी अतिरिक्त धारणा के तीनों पैदा कर देता है। वह तथ्य: जीन X गुणसूत्र पर है, और लिंग इसमें भिन्न हैं कि उनके पास कितने X गुणसूत्र हैं — मादा के पास दो, नर के पास एक X और एक Y. पुरुषों में अधिकता प्रतियाँ गिनने का मामला है। X पर एक अप्रभावी एलील लो। जिस मादा के पास एक प्रति है उसके दूसरे X पर क्रियाशील एलील है, जो अनुपस्थित उत्पाद दे देता है, अतः वह अप्रभावित है — वाहक। उसके प्रभावित होने के लिए दोषपूर्ण एलील दोनों X गुणसूत्रों पर चाहिए, जिसके लिए वाहक या प्रभावित माँ और प्रभावित पिता दोनों चाहिए, जो कहीं दुर्लभ संयोग है। नर के पास केवल एक X है। ढकने को कोई दूसरी प्रति नहीं, अतः एलील जब भी उसे विरासत में मिले अभिव्यक्त हो जाता है। शब्दावली में सटीक होना चाहिए: वह अर्धयुग्मजी है, न समयुग्मजी न विषमयुग्मजी, क्योंकि जोड़े का प्रश्न ही नहीं उठता। यदि आबादी में एलील की बारंबारता q हो, तो प्रभावित पुरुषों का अनुपात q है और प्रभावित स्त्रियों का q² — दुर्लभ एलील के लिए विशाल अंतर। वाहक के आधे बेटे, क्योंकि अर्धसूत्री विभाजन निष्पक्ष है। वाहक माँ के पास एक सामान्य X और एक दोषपूर्ण एलील वाला। पृथक्करण बराबर संभावना से हर अंड में कोई एक भेजता है। बेटे को अपना अकेला X माँ से मिलता है, अतः उसके आधे बेटों को दोषपूर्ण एलील मिलता है और ढकने को कुछ न होने से वे प्रभावित होते हैं। उसकी आधी बेटियों को भी वह मिलता है, पर उन्हें पिता से सामान्य X मिलता है और वे अपनी बारी में वाहक बन जाती हैं — स्थिति स्त्रियों से होकर चलती है और पुरुषों में प्रकट होती है, पीढ़ी दर पीढ़ी। पिता से बेटे तक संचरण नहीं, और यही निर्णायक चिह्न है। बेटा बेटा ठीक इसलिए है कि उसे पिता का Y मिला। पिता के X पर जो कुछ है वह उसकी बेटियों को जाता है — वस्तुतः सबको, अतः प्रभावित पुरुष की सारी बेटियाँ वाहक होती हैं। ऐसा कोई रास्ता है ही नहीं जिससे X-सहलग्न जीन पिता से बेटे तक जा सके। वह काल्पनिक वंशवृक्ष क्या बता देगा। यही काम का हिस्सा है, क्योंकि यह तर्क को कहानी नहीं बल्कि परीक्षण की तरह चलते दिखाता है। यदि कोई वंशवृक्ष प्रभावित पिता के साथ प्रभावित बेटा दिखाए, और माँ वाहक न हो, तो X-सहलग्नता एकदम ख़ारिज है — कम संभावित नहीं, ख़ारिज, क्योंकि संचरण का रास्ता मौजूद ही नहीं। बची संभावनाएँ अलिंगसूत्री जीन (प्रभावी, यदि वह हर पीढ़ी में दिखे) या Y-सहलग्न हैं, और वह अलग पहचाना जा सकता क्योंकि Y-सहलग्न स्थिति सारे बेटों को जाती है और किसी बेटी को नहीं। सामान्य बात। अच्छी व्याख्या केवल प्रेक्षणों को समा नहीं लेती; वह कुछ वर्जित करती है। यहाँ वह एक विशिष्ट संचरण वर्जित करती है, और वही निषेध परिकल्पना को अकेले वंशवृक्ष से परीक्षण योग्य बनाता है, बिना किसी आणविक काम के। (दूसरा विकल्प संवेदिता का अंतर गढ़ता है और Y प्रतिकृति का ग़लत वर्णन करता है; तीसरा जीन को Y पर रख देता है, जो माँ के संचरण का खंडन करता है; चौथा भविष्यवाणी करता कि कोई प्रभावित स्त्री कभी होगी ही नहीं, जो ग़लत है — ऐसी स्त्रियाँ दुर्लभ हैं पर असली।)",
          mr: "तीन निरीक्षणे, आणि समाधानाची बाब ही की एकच संरचनात्मक सत्य कोणत्याही अतिरिक्त गृहीतकाविना तिन्ही निर्माण करते. ते सत्य: जनुक X गुणसूत्रावर आहे, आणि लिंगे यात वेगळी आहेत की त्यांच्याकडे किती X गुणसूत्रे आहेत — मादीकडे दोन, नराकडे एक X आणि एक Y. पुरुषांतले अधिक्य प्रती मोजण्याची बाब आहे. X वरचे एक अप्रभावी अ‍ॅलिल घ्या. ज्या मादीकडे एक प्रत आहे तिच्या दुसऱ्या X वर क्रियाशील अ‍ॅलिल आहे, जे अनुपस्थित उत्पादन देते, म्हणून ती अप्रभावित आहे — वाहक. तिच्या प्रभावित होण्यासाठी सदोष अ‍ॅलिल दोन्ही X गुणसूत्रांवर लागेल, ज्यासाठी वाहक वा प्रभावित आई आणि प्रभावित वडील दोन्ही लागतील, जो कितीतरी दुर्मीळ योगायोग आहे. नराकडे केवळ एक X आहे. झाकायला कोणतीही दुसरी प्रत नाही, म्हणून अ‍ॅलिल जेव्हाही त्याला वारशाने मिळेल तेव्हा व्यक्त होते. शब्दावलीत नेमके असावे: तो अर्धयुग्मजी आहे, समयुग्मजीही नाही आणि विषमयुग्मजीही नाही, कारण जोडीचा प्रश्नच उद्भवत नाही. जर लोकसंख्येत अ‍ॅलिलची वारंवारता q असेल, तर प्रभावित पुरुषांचे प्रमाण q आहे आणि प्रभावित स्त्रियांचे q² — दुर्मीळ अ‍ॅलिलसाठी प्रचंड फरक. वाहकाची निम्मी मुले, कारण अर्धसूत्री विभाजन निःपक्ष आहे. वाहक आईकडे एक सामान्य X आणि एक सदोष अ‍ॅलिल असलेले. पृथक्करण समान शक्यतेने प्रत्येक अंडात कोणतेही एक पाठवते. मुलाला आपले एकटे X आईकडून मिळते, म्हणून तिच्या निम्म्या मुलांना सदोष अ‍ॅलिल मिळते आणि झाकायला काही नसल्याने ते प्रभावित होतात. तिच्या निम्म्या मुलींनाही ते मिळते, पण त्यांना वडिलांकडून सामान्य X मिळते आणि त्या आपल्या पाळीत वाहक बनतात — स्थिती स्त्रियांतून चालते आणि पुरुषांत प्रकट होते, पिढ्यानपिढ्या. वडिलांकडून मुलाकडे संक्रमण नाही, आणि हेच निर्णायक चिन्ह आहे. मुलगा मुलगा नेमका यासाठी आहे की त्याला वडिलांचे Y मिळाले. वडिलांच्या X वर जे काही आहे ते त्यांच्या मुलींना जाते — प्रत्यक्षात सर्वांना, म्हणून प्रभावित पुरुषाच्या सर्व मुली वाहक असतात. असा कोणताही मार्ग नाहीच ज्याने X-सहलग्न जनुक वडिलांकडून मुलाकडे जाऊ शकेल. तो काल्पनिक वंशवृक्ष काय सांगेल. हाच उपयुक्त भाग आहे, कारण हे युक्तिवादाला कथा नव्हे तर चाचणी म्हणून चालताना दाखवते. जर एखादा वंशवृक्ष प्रभावित वडिलांसोबत प्रभावित मुलगा दाखवेल, आणि आई वाहक नसेल, तर X-सहलग्नता एकदम नाकारली जाते — कमी शक्य नाही, नाकारली, कारण संक्रमणाचा मार्ग अस्तित्वातच नाही. उरलेल्या शक्यता अलिंगसूत्री जनुक (प्रभावी, जर ते प्रत्येक पिढीत दिसेल) वा Y-सहलग्न आहेत, आणि ते वेगळे ओळखता येईल कारण Y-सहलग्न स्थिती सर्व मुलांना जाते आणि कोणत्याही मुलीला नाही. सर्वसाधारण मुद्दा. चांगले स्पष्टीकरण केवळ निरीक्षणे सामावून घेत नाही; ते काहीतरी वर्ज्य करते. इथे ते एक विशिष्ट संक्रमण वर्ज्य करते, आणि तोच निषेध गृहीतकाला एकट्या वंशवृक्षावरून तपासण्याजोगे बनवतो, कोणत्याही रेणवीय कामाविना. (दुसरा पर्याय संवेदनशीलतेचा फरक घडवतो आणि Y प्रतिकृतीचे चुकीचे वर्णन करतो; तिसरा जनुक Y वर ठेवतो, जे आईच्या संक्रमणाचे खंडन करते; चौथा भाकीत करेल की कोणतीही प्रभावित स्त्री कधी असणारच नाही, जे चूक आहे — अशा स्त्रिया दुर्मीळ आहेत पण खऱ्या.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Molecular Basis of Inheritance                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-12-molecular-basis-of-inheritance",
    subject: "BIOLOGY",
    classLevel: 12,
    chapter: {
      en: "Chapter 5 — Molecular Basis of Inheritance",
      hi: "अध्याय 5 — वंशागति का आणविक आधार",
      mr: "प्रकरण 5 — आनुवंशिकतेचा रेणवीय आधार",
    },
    name: {
      en: "Molecular Basis of Inheritance",
      hi: "वंशागति का आणविक आधार",
      mr: "आनुवंशिकतेचा रेणवीय आधार",
    },
    summary: {
      en: "The chapter that supplies the material underneath the rules, and almost every step of it was settled by an experiment designed to distinguish two possibilities rather than to look and see: a transforming substance identified by destroying each candidate in turn and finding which destruction stopped the transformation; a virus labelled in two different atoms so that whichever entered the cell could be told apart from whichever stayed outside; a structure whose pairing rule was already sitting in somebody else's table of base ratios, unexplained, for years before it explained itself; a replication whose three imaginable schemes predicted three different band patterns in a centrifuge tube, of which exactly one was seen; a code read three letters at a time whose redundancy is not sloppiness but a buffer, since the third letter of most triplets can change without changing anything; and a control circuit in which a gene is switched on by the arrival of the very substance its product exists to digest, so that the cell is not paying for an enzyme it has nothing to use it on.",
      hi: "यह वह अध्याय है जो नियमों के नीचे की सामग्री देता है, और उसका लगभग हर क़दम ऐसे प्रयोग से तय हुआ जो देखने-भर के लिए नहीं बल्कि दो संभावनाओं में भेद करने को रचा गया था: ऐसा रूपांतरक पदार्थ जो हर उम्मीदवार को बारी-बारी नष्ट करके और यह पाकर पहचाना गया कि किसका नष्ट होना रूपांतरण रोकता है; दो भिन्न परमाणुओं में चिह्नित ऐसा विषाणु कि जो कोशिका में घुसा उसे जो बाहर रहा उससे अलग बताया जा सके; ऐसी संरचना जिसका युग्मन नियम वर्षों से किसी और की क्षार अनुपातों की तालिका में बिना व्याख्या बैठा था इससे पहले कि वह स्वयं को समझाए; ऐसी प्रतिकृति जिसकी तीन कल्पनीय योजनाएँ अपकेंद्रित्र नली में तीन भिन्न पट्टी प्रतिरूपों की भविष्यवाणी करती थीं और जिनमें से ठीक एक ही दिखा; तीन अक्षर एक साथ पढ़ा जाता ऐसा कूट जिसका आधिक्य ढिलाई नहीं बल्कि बचाव है, चूँकि अधिकांश त्रिक का तीसरा अक्षर बिना कुछ बदले बदल सकता है; और ऐसा नियंत्रण परिपथ जिसमें कोई जीन उसी पदार्थ के आने से चालू होता है जिसे पचाने के लिए उसका उत्पाद है, ताकि कोशिका ऐसे एंज़ाइम की क़ीमत न चुकाए जिसे लगाने को उसके पास कुछ है ही नहीं।",
      mr: "हे ते प्रकरण आहे जे नियमांखालची सामग्री पुरवते, आणि त्याची जवळपास प्रत्येक पायरी अशा प्रयोगाने ठरली जो केवळ पाहण्यासाठी नव्हे तर दोन शक्यतांत भेद करण्यासाठी रचला होता: असा रूपांतरक पदार्थ जो प्रत्येक उमेदवार आळीपाळीने नष्ट करून आणि कोणाचे नष्ट होणे रूपांतरण थांबवते हे शोधून ओळखला गेला; दोन वेगळ्या अणूंत चिन्हांकित असा विषाणू की जो पेशीत शिरला त्याला जो बाहेर राहिला त्याहून वेगळे सांगता यावे; अशी रचना जिचा युग्मन नियम वर्षानुवर्षे दुसऱ्याच कोणाच्या क्षार गुणोत्तरांच्या तक्त्यात स्पष्टीकरणाविना बसला होता तो स्वतःला समजावण्याआधी; अशी प्रतिकृती जिच्या तीन कल्पनीय योजना अपकेंद्रित्र नळीत तीन वेगळ्या पट्टी नमुन्यांचे भाकीत करत होत्या आणि ज्यांपैकी नेमका एकच दिसला; तीन अक्षरे एकावेळी वाचला जाणारा असा संकेत ज्याचे आधिक्य ढिलाई नसून बचाव आहे, कारण बहुतांश त्रिकांचे तिसरे अक्षर काहीही न बदलता बदलू शकते; आणि असे नियंत्रण परिपथ ज्यात एखादे जनुक त्याच पदार्थाच्या येण्याने चालू होते ज्याला पचवण्यासाठी त्याचे उत्पादन आहे, जेणेकरून पेशी अशा विकराची किंमत मोजू नये ज्याला लावायला तिच्याकडे काहीच नाही.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-experiments-that-identified-the-genetic-material",
        name: {
          en: "The experiments that identified the genetic material",
          hi: "वे प्रयोग जिन्होंने आनुवंशिक पदार्थ पहचाना",
          mr: "ज्या प्रयोगांनी आनुवंशिक पदार्थ ओळखला ते",
        },
        kind: "experiment and what it decided",
        prompt: {
          en: "A series in which each candidate substance was destroyed in turn to see which destruction abolished the effect, and then a virus was labelled in two different atoms to see which one went inside. What is being described?",
          hi: "ऐसी शृंखला जिसमें हर उम्मीदवार पदार्थ को बारी-बारी नष्ट किया गया यह देखने को कि किसका नष्ट होना प्रभाव मिटा देता है, और फिर एक विषाणु को दो भिन्न परमाणुओं में चिह्नित किया गया यह देखने को कि भीतर कौन गया। यहाँ किसका वर्णन है?",
          mr: "अशी मालिका ज्यात प्रत्येक उमेदवार पदार्थ आळीपाळीने नष्ट केला गेला हे पाहायला की कोणाचे नष्ट होणे परिणाम मिटवते, आणि मग एक विषाणू दोन वेगळ्या अणूंत चिन्हांकित केला गेला हे पाहायला की आत कोण गेला. इथे कशाचे वर्णन आहे?",
        },
        statement: {
          en: "The experiments that identified the genetic material worked by elimination: destroying protein or RNA left transformation intact, destroying DNA abolished it, and a labelled virus showed that DNA and not protein entered the host cell.",
          hi: "जिन प्रयोगों ने आनुवंशिक पदार्थ पहचाना वे निराकरण से चले: प्रोटीन या RNA नष्ट करने पर रूपांतरण बना रहा, DNA नष्ट करने पर वह मिट गया, और चिह्नित विषाणु ने दिखाया कि परपोषी कोशिका में प्रोटीन नहीं बल्कि DNA घुसा।",
          mr: "ज्या प्रयोगांनी आनुवंशिक पदार्थ ओळखला ते निराकरणाने चालले: प्रथिन वा RNA नष्ट केल्यावर रूपांतरण टिकले, DNA नष्ट केल्यावर ते मिटले, आणि चिन्हांकित विषाणूने दाखवले की यजमान पेशीत प्रथिन नव्हे तर DNA शिरला.",
        },
        detail: {
          en: "The labelling worked because phosphorus occurs in DNA and not in protein, while sulphur occurs in protein and not in DNA, so one atom marks each molecule uniquely.",
          hi: "चिह्नन इसलिए चला कि फ़ॉस्फ़ोरस DNA में है और प्रोटीन में नहीं, जबकि सल्फ़र प्रोटीन में है और DNA में नहीं, अतः एक-एक परमाणु हर अणु को अनन्य रूप से चिह्नित करता है।",
          mr: "चिन्हांकन यासाठी चालले की फॉस्फरस DNA मध्ये आहे आणि प्रथिनात नाही, तर सल्फर प्रथिनात आहे आणि DNA मध्ये नाही, म्हणून एकेक अणू प्रत्येक रेणूला अनन्यपणे चिन्हांकित करतो.",
        },
        extra: {
          en: "The point of both designs was to make the two hypotheses predict different results, which is what turns an observation into evidence.",
          hi: "दोनों रचनाओं का मर्म यह था कि दोनों परिकल्पनाएँ भिन्न परिणामों की भविष्यवाणी करें, और यही किसी प्रेक्षण को प्रमाण बनाता है।",
          mr: "दोन्ही रचनांचा गाभा हा होता की दोन्ही गृहीतकांनी वेगळ्या निकालांचे भाकीत करावे, आणि हेच एखाद्या निरीक्षणाला पुरावा बनवते.",
        },
        pair: {
          left: {
            en: "Destroy each candidate and see which destruction matters",
            hi: "हर उम्मीदवार को नष्ट करो और देखो किसका नष्ट होना मायने रखता है",
            mr: "प्रत्येक उमेदवार नष्ट करा आणि पाहा कोणाचे नष्ट होणे महत्त्वाचे",
          },
          right: {
            en: "the experiments that identified the genetic material",
            hi: "वे प्रयोग जिन्होंने आनुवंशिक पदार्थ पहचाना",
            mr: "ज्या प्रयोगांनी आनुवंशिक पदार्थ ओळखला ते",
          },
        },
      },
      {
        id: "semiconservative-replication",
        name: {
          en: "Semiconservative replication",
          hi: "अर्धसंरक्षी प्रतिकृति",
          mr: "अर्धसंरक्षी प्रतिकृती",
        },
        kind: "experiment and what it decided",
        prompt: {
          en: "A scheme in which each new molecule keeps one old strand and builds one new one, chosen over two rivals because it alone predicted the band pattern that a centrifuge actually showed. Which one is it?",
          hi: "ऐसी योजना जिसमें हर नया अणु एक पुरानी लड़ी रखता है और एक नई बनाता है, जो दो प्रतिद्वंद्वियों पर इसलिए चुनी गई कि अकेली उसी ने उस पट्टी प्रतिरूप की भविष्यवाणी की जो अपकेंद्रित्र ने सचमुच दिखाया। यह कौन-सी है?",
          mr: "अशी योजना ज्यात प्रत्येक नवा रेणू एक जुना पदर ठेवतो आणि एक नवा बनवतो, जी दोन प्रतिस्पर्ध्यांवर यासाठी निवडली गेली की एकट्या तिनेच त्या पट्टी नमुन्याचे भाकीत केले जो अपकेंद्रित्राने खरोखर दाखवला. ही कोणती?",
        },
        statement: {
          en: "Semiconservative replication is the scheme in which each daughter molecule consists of one parental strand and one newly made strand.",
          hi: "अर्धसंरक्षी प्रतिकृति वह योजना है जिसमें हर पुत्री अणु एक जनकीय लड़ी और एक नई बनी लड़ी से मिलकर बनता है।",
          mr: "अर्धसंरक्षी प्रतिकृती ही ती योजना आहे ज्यात प्रत्येक कन्या रेणू एक जनकीय पदर आणि एक नव्याने बनलेला पदर यांनी बनतो.",
        },
        detail: {
          en: "The alternatives were that both strands are new and the old molecule is kept whole, or that old and new material is scattered through both strands, and each predicted a distinguishable outcome after one and two rounds of division.",
          hi: "विकल्प ये थे कि दोनों लड़ियाँ नई हों और पुराना अणु समूचा बचा रहे, या पुरानी और नई सामग्री दोनों लड़ियों में बिखरी हो, और हर एक ने एक और दो विभाजनों के बाद अलग पहचाने जाने योग्य परिणाम की भविष्यवाणी की।",
          mr: "पर्याय हे होते की दोन्ही पदर नवे असावेत आणि जुना रेणू अख्खा टिकावा, वा जुनी आणि नवी सामग्री दोन्ही पदरांत विखुरलेली असावी, आणि प्रत्येकाने एक व दोन विभाजनांनंतर वेगळे ओळखता येण्याजोग्या निकालाचे भाकीत केले.",
        },
        extra: {
          en: "The design worked by growing cells in a heavy nitrogen isotope and then shifting them to the light one, so that generation could be read off from density.",
          hi: "रचना इस तरह चली कि कोशिकाएँ भारी नाइट्रोजन समस्थानिक में उगाई गईं और फिर हल्के वाले में डाल दी गईं, ताकि पीढ़ी घनत्व से पढ़ी जा सके।",
          mr: "रचना अशी चालली की पेशी जड नायट्रोजन समस्थानिकात वाढवल्या गेल्या आणि मग हलक्यात हलवल्या गेल्या, जेणेकरून पिढी घनतेवरून वाचता यावी.",
        },
        pair: {
          left: {
            en: "Three schemes, three predicted patterns, one observed",
            hi: "तीन योजनाएँ, तीन भविष्यवाणित प्रतिरूप, एक देखा गया",
            mr: "तीन योजना, तीन भाकीत नमुने, एक निरीक्षिलेला",
          },
          right: {
            en: "semiconservative replication",
            hi: "अर्धसंरक्षी प्रतिकृति",
            mr: "अर्धसंरक्षी प्रतिकृती",
          },
        },
      },
      {
        id: "the-lac-operon",
        name: {
          en: "The lac operon",
          hi: "लैक ऑपेरॉन",
          mr: "लॅक ऑपेरॉन",
        },
        kind: "experiment and what it decided",
        prompt: {
          en: "A cluster of genes kept switched off by a bound protein, and switched on when the sugar they are needed for arrives and pulls that protein away. What is this arrangement?",
          hi: "जीनों का ऐसा गुच्छा जो एक बँधे प्रोटीन से बंद रखा जाता है, और तब चालू होता है जब वह शर्करा आ जाए जिसके लिए वे चाहिए और वह उस प्रोटीन को खींच ले जाए। यह व्यवस्था क्या है?",
          mr: "जनुकांचा असा गुच्छ जो एका बांधलेल्या प्रथिनाने बंद ठेवला जातो, आणि तेव्हा चालू होतो जेव्हा ती शर्करा येते जिच्यासाठी ती लागतात आणि ती त्या प्रथिनाला ओढून नेते. ही व्यवस्था काय आहे?",
        },
        statement: {
          en: "The lac operon is a set of genes transcribed together and held off by a repressor protein, which is released when lactose is present so the enzymes are made only when there is something to digest.",
          hi: "लैक ऑपेरॉन ऐसे जीनों का समुच्चय है जो साथ अनुलेखित होते हैं और एक दमनकारी प्रोटीन से रोके रखे जाते हैं, जो लैक्टोस के मौजूद होने पर छूट जाता है, अतः एंज़ाइम तभी बनते हैं जब पचाने को कुछ हो।",
          mr: "लॅक ऑपेरॉन हा अशा जनुकांचा संच आहे जी एकत्र अनुलेखित होतात आणि एका दमनकारी प्रथिनाने अडवली जातात, जे लॅक्टोज उपस्थित असल्यावर सुटते, म्हणून विकरे तेव्हाच बनतात जेव्हा पचवायला काही असते.",
        },
        detail: {
          en: "The signal is the substrate itself, which is the neatest possible arrangement: the thing that makes the enzyme necessary is also the thing that switches its gene on.",
          hi: "संकेत स्वयं क्रियाधार है, और यही सबसे सुघड़ संभव व्यवस्था है: जो चीज़ एंज़ाइम को ज़रूरी बनाती है वही उसका जीन चालू भी करती है।",
          mr: "संकेत स्वतः क्रियाधार आहे, आणि हीच सर्वांत नेटकी शक्य व्यवस्था आहे: जी गोष्ट विकराला आवश्यक करते तीच त्याचे जनुक चालूही करते.",
        },
        extra: {
          en: "The economy is real: making an unused enzyme costs energy and materials, and a bacterium that wastes them is outgrown by one that does not.",
          hi: "किफ़ायत असली है: अनुपयोगी एंज़ाइम बनाने में ऊर्जा और सामग्री लगती है, और जो जीवाणु उन्हें गँवाता है वह उससे पिछड़ जाता है जो नहीं गँवाता।",
          mr: "काटकसर खरी आहे: न वापरले जाणारे विकर बनवण्यात ऊर्जा आणि सामग्री लागते, आणि जो जिवाणू ती वाया घालवतो तो न घालवणाऱ्याहून मागे पडतो.",
        },
        pair: {
          left: {
            en: "The substrate is its own switch",
            hi: "क्रियाधार स्वयं अपना स्विच है",
            mr: "क्रियाधार स्वतःच आपला स्विच आहे",
          },
          right: {
            en: "the lac operon",
            hi: "लैक ऑपेरॉन",
            mr: "लॅक ऑपेरॉन",
          },
        },
      },
      {
        id: "the-double-helix",
        name: {
          en: "The double helix",
          hi: "द्विकुंडली",
          mr: "द्विकुंडली",
        },
        kind: "structure and what it explains",
        prompt: {
          en: "A structure of two strands running in opposite directions with the bases turned inward, whose pairing rule was sitting unexplained in somebody else's table of ratios for years. What is it?",
          hi: "उलटी दिशाओं में चलती दो लड़ियों की ऐसी संरचना जिसमें क्षार भीतर की ओर मुड़े हैं, और जिसका युग्मन नियम वर्षों तक किसी और की अनुपातों की तालिका में बिना व्याख्या बैठा रहा। यह क्या है?",
          mr: "उलट दिशांनी चालणाऱ्या दोन पदरांची अशी रचना ज्यात क्षार आतल्या बाजूला वळलेले आहेत, आणि जिचा युग्मन नियम वर्षानुवर्षे दुसऱ्याच कोणाच्या गुणोत्तरांच्या तक्त्यात स्पष्टीकरणाविना बसून राहिला. ही काय आहे?",
        },
        statement: {
          en: "The double helix is two antiparallel strands wound about a common axis, with the sugar–phosphate backbones outside and the paired bases inside.",
          hi: "द्विकुंडली एक साझी अक्ष के गिर्द लिपटी दो प्रतिसमांतर लड़ियाँ हैं, जिनमें शर्करा–फ़ॉस्फ़ेट रीढ़ बाहर और युग्मित क्षार भीतर हैं।",
          mr: "द्विकुंडली म्हणजे एका सामायिक अक्षाभोवती गुंडाळलेले दोन प्रतिसमांतर पदर, ज्यांत शर्करा–फॉस्फेट कणे बाहेर आणि युग्मित क्षार आत आहेत.",
        },
        detail: {
          en: "The pairing is fixed by hydrogen bonding and by size, a larger base always facing a smaller one, which keeps the width of the helix the same all along its length.",
          hi: "युग्मन हाइड्रोजन आबंधन और आकार से तय है, बड़ा क्षार हमेशा छोटे के सामने, जिससे कुंडली की चौड़ाई पूरी लंबाई भर एक-सी बनी रहती है।",
          mr: "युग्मन हायड्रोजन बंधन आणि आकाराने ठरते, मोठे क्षार नेहमी लहानासमोर, ज्याने कुंडलीची रुंदी अख्ख्या लांबीभर सारखी राहते.",
        },
        extra: {
          en: "Chargaff had measured equal amounts of the two members of each pair in every organism examined, a regularity that had no explanation until the structure supplied one.",
          hi: "शार्गाफ़ ने जाँचे गए हर जीव में हर जोड़े के दोनों सदस्यों की बराबर मात्रा नापी थी, और यह नियमितता तब तक बिना व्याख्या थी जब तक संरचना ने एक न दे दी।",
          mr: "शारगाफने तपासलेल्या प्रत्येक जीवात प्रत्येक जोडीच्या दोन्ही सदस्यांचे समान प्रमाण मोजले होते, आणि ही नियमितता तोवर स्पष्टीकरणाविना होती जोवर रचनेने एक दिले नाही.",
        },
        pair: {
          left: {
            en: "A regularity in a table waiting years for its explanation",
            hi: "तालिका में बैठी नियमितता जो वर्षों अपनी व्याख्या की प्रतीक्षा करती रही",
            mr: "तक्त्यात बसलेली नियमितता जी वर्षानुवर्षे आपल्या स्पष्टीकरणाची वाट पाहत राहिली",
          },
          right: {
            en: "the double helix",
            hi: "द्विकुंडली",
            mr: "द्विकुंडली",
          },
        },
      },
      {
        id: "the-genetic-code",
        name: {
          en: "The genetic code",
          hi: "आनुवंशिक कूट",
          mr: "आनुवंशिक संकेत",
        },
        kind: "structure and what it explains",
        prompt: {
          en: "A reading in threes, in which several different triplets specify the same amino acid and the surplus falls almost entirely on the last of the three letters. What is this?",
          hi: "तीन-तीन में पढ़ा जाना, जिसमें कई भिन्न त्रिक वही ऐमीनो अम्ल निर्दिष्ट करते हैं और अतिरेक लगभग पूरा तीनों में से अंतिम अक्षर पर पड़ता है। यह क्या है?",
          mr: "तीन-तीनमध्ये वाचणे, ज्यात कित्येक वेगळी त्रिके तेच अमिनो आम्ल निर्दिष्ट करतात आणि अतिरिक्तता जवळपास अख्खी तिघांतल्या शेवटच्या अक्षरावर पडते. हे काय आहे?",
        },
        statement: {
          en: "The genetic code is read in non-overlapping triplets, and it is degenerate: most amino acids are specified by more than one codon, usually differing only in the third base.",
          hi: "आनुवंशिक कूट अनतिव्यापी त्रिकों में पढ़ा जाता है, और वह अपह्रासित है: अधिकांश ऐमीनो अम्ल एक से अधिक कोडॉन से निर्दिष्ट होते हैं, जो प्रायः केवल तीसरे क्षार में भिन्न हैं।",
          mr: "आनुवंशिक संकेत अनतिव्यापी त्रिकांत वाचला जातो, आणि तो अपह्रासित आहे: बहुतांश अमिनो आम्ले एकाहून अधिक कोडॉनने निर्दिष्ट होतात, जी बहुधा केवळ तिसऱ्या क्षारात वेगळी आहेत.",
        },
        detail: {
          en: "Three had to be the length because two letters from four options give sixteen combinations, which is not enough for twenty amino acids, while three give sixty-four.",
          hi: "लंबाई तीन ही होनी थी क्योंकि चार विकल्पों में से दो अक्षर सोलह संयोजन देते हैं, जो बीस ऐमीनो अम्लों के लिए काफ़ी नहीं, जबकि तीन चौंसठ देते हैं।",
          mr: "लांबी तीनच असावी लागली कारण चार पर्यायांतून दोन अक्षरे सोळा संयोजने देतात, जी वीस अमिनो आम्लांसाठी पुरेशी नाहीत, तर तीन चौसष्ट देतात.",
        },
        extra: {
          en: "The surplus is not waste: a change in the third base of most codons leaves the amino acid unchanged, so a good many mutations have no effect at all.",
          hi: "अतिरेक अपव्यय नहीं है: अधिकांश कोडॉन के तीसरे क्षार में बदलाव ऐमीनो अम्ल को अपरिवर्तित छोड़ देता है, अतः बहुत से उत्परिवर्तनों का कोई प्रभाव ही नहीं होता।",
          mr: "अतिरिक्तता अपव्यय नाही: बहुतांश कोडॉनच्या तिसऱ्या क्षारातील बदल अमिनो आम्ल अपरिवर्तित सोडतो, म्हणून बऱ्याच उत्परिवर्तनांचा कोणताही परिणामच होत नाही.",
        },
        pair: {
          left: {
            en: "Redundancy that works as a buffer against mutation",
            hi: "ऐसा आधिक्य जो उत्परिवर्तन के विरुद्ध बचाव का काम करता है",
            mr: "असे आधिक्य जे उत्परिवर्तनाविरुद्ध बचावाचे काम करते",
          },
          right: {
            en: "the genetic code",
            hi: "आनुवंशिक कूट",
            mr: "आनुवंशिक संकेत",
          },
        },
      },
      {
        id: "transcription-and-translation",
        name: {
          en: "Transcription and translation",
          hi: "अनुलेखन और अनुवाद",
          mr: "अनुलेखन आणि भाषांतर",
        },
        kind: "structure and what it explains",
        prompt: {
          en: "A copy made in a related language and carried out of the store, and then a reading of that copy into a quite different kind of molecule. Which pair of processes is this?",
          hi: "एक ऐसी नक़ल जो संबंधित भाषा में बनती है और भंडार से बाहर ले जाई जाती है, और फिर उस नक़ल का बिलकुल भिन्न क़िस्म के अणु में पढ़ा जाना। यह कौन-सी प्रक्रियाओं की जोड़ी है?",
          mr: "अशी एक नक्कल जी संबंधित भाषेत बनते आणि साठ्यातून बाहेर नेली जाते, आणि मग त्या नकलेचे अगदी वेगळ्या प्रकारच्या रेणूत वाचन. ही कोणत्या प्रक्रियांची जोडी?",
        },
        statement: {
          en: "Transcription and translation are the copying of one DNA strand into RNA and the reading of that RNA into a chain of amino acids at the ribosome.",
          hi: "अनुलेखन और अनुवाद क्रमशः एक DNA लड़ी का RNA में नक़ल होना और उस RNA का राइबोसोम पर ऐमीनो अम्लों की शृंखला में पढ़ा जाना है।",
          mr: "अनुलेखन आणि भाषांतर म्हणजे अनुक्रमे एका DNA पदराची RNA मध्ये नक्कल होणे आणि त्या RNA चे रायबोसोमवर अमिनो आम्लांच्या साखळीत वाचन होणे.",
        },
        detail: {
          en: "The transfer RNA is what makes the code physical: one end recognises a triplet on the message and the other carries the amino acid that triplet stands for.",
          hi: "स्थानांतरण RNA ही कूट को भौतिक बनाता है: उसका एक सिरा संदेश पर के त्रिक को पहचानता है और दूसरा वह ऐमीनो अम्ल ढोता है जिसके लिए वह त्रिक खड़ा है।",
          mr: "स्थानांतरण RNA च संकेताला भौतिक बनवते: त्याचे एक टोक संदेशावरचे त्रिक ओळखते आणि दुसरे ते अमिनो आम्ल वाहते ज्यासाठी ते त्रिक उभे आहे.",
        },
        extra: {
          en: "In a eukaryote the first copy is edited before use, with stretches cut out and the rest joined up, so the gene and its product are not the same length.",
          hi: "सुकेंद्रकी में पहली नक़ल काम में आने से पहले संपादित होती है, कुछ हिस्से काटकर निकाल दिए जाते हैं और बाक़ी जोड़ दिए जाते हैं, अतः जीन और उसका उत्पाद बराबर लंबे नहीं होते।",
          mr: "सुकेंद्रकीत पहिली नक्कल वापरण्याआधी संपादित होते, काही भाग कापून काढले जातात आणि बाकीचे जोडले जातात, म्हणून जनुक आणि त्याचे उत्पादन सारख्या लांबीचे नसतात.",
        },
        pair: {
          left: {
            en: "One molecule with a triplet at one end and its meaning at the other",
            hi: "ऐसा अणु जिसके एक सिरे पर त्रिक है और दूसरे पर उसका अर्थ",
            mr: "असा रेणू ज्याच्या एका टोकाला त्रिक आहे आणि दुसऱ्याला त्याचा अर्थ",
          },
          right: {
            en: "transcription and translation",
            hi: "अनुलेखन और अनुवाद",
            mr: "अनुलेखन आणि भाषांतर",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Three schemes for replication were imaginable: both strands new with the parent kept whole, one old and one new strand in each daughter, or old and new material scattered through both strands. Explain how one experiment distinguished them, and why that design was decisive.",
          hi: "प्रतिकृति की तीन योजनाएँ कल्पनीय थीं: दोनों लड़ियाँ नई और जनक समूचा बचा, हर पुत्री में एक पुरानी और एक नई लड़ी, या पुरानी और नई सामग्री दोनों लड़ियों में बिखरी। बताओ कि एक ही प्रयोग ने उनमें भेद कैसे किया, और वह रचना निर्णायक क्यों थी।",
          mr: "प्रतिकृतीच्या तीन योजना कल्पनीय होत्या: दोन्ही पदर नवे आणि जनक अख्खा टिकलेला, प्रत्येक कन्येत एक जुना आणि एक नवा पदर, वा जुनी आणि नवी सामग्री दोन्ही पदरांत विखुरलेली. एकाच प्रयोगाने त्यांच्यात भेद कसा केला, आणि ती रचना निर्णायक का होती ते सांगा.",
        },
        choices: [
          {
            en: "Bacteria were grown for many generations in a heavy nitrogen isotope so that all their DNA was dense, then transferred to ordinary nitrogen, and samples were centrifuged after each division. After one round every molecule was of intermediate density — a single band. That alone killed the first scheme, which predicted two bands, one heavy and one light. After a second round there were two bands, one intermediate and one light, in equal amounts. That killed the third scheme, which predicted a single band getting steadily lighter with no intermediate persisting. Only the semiconservative scheme predicted both results, and the design is decisive because the three hypotheses predicted different observable patterns before the experiment was run",
            hi: "जीवाणु कई पीढ़ियों तक भारी नाइट्रोजन समस्थानिक में उगाए गए ताकि उनका सारा DNA घना हो, फिर साधारण नाइट्रोजन में डाले गए, और हर विभाजन के बाद नमूने अपकेंद्रित किए गए। एक दौर के बाद हर अणु मध्यवर्ती घनत्व का था — एक अकेली पट्टी। वह अकेला पहली योजना को मार देता है, जो दो पट्टियों की भविष्यवाणी करती थी, एक भारी और एक हल्की। दूसरे दौर के बाद दो पट्टियाँ थीं, एक मध्यवर्ती और एक हल्की, बराबर मात्रा में। इसने तीसरी योजना को मारा, जो एक ही पट्टी के लगातार हल्के होते जाने की भविष्यवाणी करती थी और जिसमें कोई मध्यवर्ती टिकती नहीं। केवल अर्धसंरक्षी योजना ने दोनों परिणामों की भविष्यवाणी की, और रचना इसलिए निर्णायक है कि तीनों परिकल्पनाओं ने प्रयोग चलने से पहले ही भिन्न प्रेक्षणीय प्रतिरूपों की भविष्यवाणी की थी",
            mr: "जिवाणू कित्येक पिढ्या जड नायट्रोजन समस्थानिकात वाढवले गेले जेणेकरून त्यांचा सर्व DNA दाट असावा, मग साध्या नायट्रोजनात हलवले गेले, आणि प्रत्येक विभाजनानंतर नमुने अपकेंद्रित केले गेले. एका फेरीनंतर प्रत्येक रेणू मध्यवर्ती घनतेचा होता — एकच पट्टी. ते एकटेच पहिली योजना मारते, जी दोन पट्ट्यांचे भाकीत करत होती, एक जड आणि एक हलकी. दुसऱ्या फेरीनंतर दोन पट्ट्या होत्या, एक मध्यवर्ती आणि एक हलकी, समान प्रमाणात. याने तिसरी योजना मारली, जी एकाच पट्टीच्या सतत हलके होत जाण्याचे भाकीत करत होती आणि जिच्यात कोणतीही मध्यवर्ती टिकत नाही. केवळ अर्धसंरक्षी योजनेने दोन्ही निकालांचे भाकीत केले, आणि रचना यासाठी निर्णायक आहे की तिन्ही गृहीतकांनी प्रयोग चालण्याआधीच वेगळ्या निरीक्षणीय नमुन्यांचे भाकीत केले होते",
          },
          {
            en: "The strands were separated and examined under an electron microscope, which showed directly that one of each pair was old, so no inference from density was required",
            hi: "लड़ियाँ अलग कर इलेक्ट्रॉन सूक्ष्मदर्शी में देखी गईं, जिसने सीधे दिखा दिया कि हर जोड़े में से एक पुरानी है, अतः घनत्व से किसी अनुमान की ज़रूरत ही नहीं पड़ी",
            mr: "पदर वेगळे करून इलेक्ट्रॉन सूक्ष्मदर्शकात पाहिले गेले, ज्याने थेट दाखवले की प्रत्येक जोडीतला एक जुना आहे, म्हणून घनतेवरून कोणत्याही अनुमानाची गरजच पडली नाही",
          },
          {
            en: "Only one generation was examined, and since a single intermediate band is consistent with all three schemes, the experiment established the answer by weight of opinion rather than by evidence",
            hi: "केवल एक पीढ़ी जाँची गई, और चूँकि अकेली मध्यवर्ती पट्टी तीनों योजनाओं से संगत है, प्रयोग ने उत्तर प्रमाण से नहीं बल्कि राय के भार से तय किया",
            mr: "केवळ एक पिढी तपासली गेली, आणि एकटी मध्यवर्ती पट्टी तिन्ही योजनांशी सुसंगत असल्याने, प्रयोगाने उत्तर पुराव्याने नव्हे तर मताच्या वजनाने ठरवले",
          },
          {
            en: "The heavy isotope was radioactive and killed the cells that used it, so the surviving cells were those replicating conservatively, which is how the scheme was identified",
            hi: "भारी समस्थानिक रेडियोऐक्टिव था और उसे काम में लेती कोशिकाओं को मार देता था, अतः बची कोशिकाएँ वही थीं जो संरक्षी ढंग से प्रतिकृति कर रही थीं, और इसी से योजना पहचानी गई",
            mr: "जड समस्थानिक किरणोत्सर्गी होता आणि तो वापरणाऱ्या पेशी मारत होता, म्हणून वाचलेल्या पेशी त्याच होत्या ज्या संरक्षी पद्धतीने प्रतिकृती करत होत्या, आणि यानेच योजना ओळखली गेली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is one of the cleanest experiments in biology, and what makes it clean is that the three hypotheses were made to predict three different observable outcomes BEFORE anything was measured. Work out those predictions first and the result reads itself. THE TRICK THAT MAKES DNA VISIBLE BY AGE. Nitrogen occurs in the bases, so DNA made in a medium of the heavy isotope ¹⁵N is denser than DNA made with ordinary ¹⁴N. Density is not a chemical difference — the DNA behaves identically — but it can be separated in a caesium chloride gradient, where molecules settle at the depth matching their own density and form visible bands. So a band's position reports on when the material in it was made. THE SETUP. Grow E. coli for many generations in ¹⁵N until all its DNA is heavy. Transfer to ¹⁴N, so every new strand from now on is light. Sample after one division, and after a second. THE THREE PREDICTIONS, WHICH IS WHERE THE WORK IS. Conservative: the parent molecule stays intact and an entirely new one is made, so after one round there should be two bands — heavy parent, light daughter. Semiconservative: each daughter has one heavy old strand and one light new one, so after one round every molecule is hybrid and there should be a single band of intermediate density. Dispersive: old and new material is interspersed along both strands, so after one round every molecule is also intermediate — a single band, indistinguishable from the semiconservative prediction at this stage. AFTER ONE ROUND. A single intermediate band was seen. That eliminates conservative replication outright — it had predicted two bands and there was one. It does not yet separate the other two, and this is why a second generation was essential. AFTER TWO ROUNDS. Semiconservative predicts that each hybrid molecule separates, its heavy strand pairing with a new light one to give a hybrid, its light strand giving an all-light molecule: two bands, half intermediate and half light. Dispersive predicts that the old material is now spread twice as thin through every molecule, so all molecules remain identical and the single band simply shifts a little lighter — never splitting. Two bands in equal amounts were seen. Dispersive is eliminated. WHY THE DESIGN IS DECISIVE RATHER THAN MERELY SUGGESTIVE. Each hypothesis was committed to a specific, different, observable outcome in advance, and each observation eliminated one. Nothing had to be argued about which explanation felt more natural. Notice too that one generation was not enough — the experiment had to run to the point where the surviving hypotheses diverged, which is a general lesson about designing tests. (The second option describes a technique that could not resolve strand age; the third misstates the experiment, which ran to several generations, and misdescribes how evidence works; the fourth invents lethal radioactivity — ¹⁵N is a stable isotope and the cells grew normally.)",
          hi: "यह जीवविज्ञान के सबसे साफ़ प्रयोगों में से एक है, और उसे साफ़ यह बनाता है कि कुछ भी नापने से पहले ही तीनों परिकल्पनाओं से तीन भिन्न प्रेक्षणीय परिणामों की भविष्यवाणी करवा ली गई। पहले वे भविष्यवाणियाँ निकाल लो और परिणाम ख़ुद को पढ़ा देता है। वह तरकीब जो DNA को उसकी उम्र से दिखा देती है। नाइट्रोजन क्षारों में है, अतः भारी समस्थानिक ¹⁵N के माध्यम में बना DNA साधारण ¹⁴N से बने DNA से घना है। घनत्व रासायनिक अंतर नहीं — DNA समरूप बरतता है — पर उसे सीज़ियम क्लोराइड प्रवणता में अलग किया जा सकता है, जहाँ अणु अपने घनत्व से मेल खाती गहराई पर बैठ जाते हैं और दृश्य पट्टियाँ बनाते हैं। अतः पट्टी की जगह बता देती है कि उसमें की सामग्री कब बनी। जमावट। E. coli को कई पीढ़ियों तक ¹⁵N में उगाओ जब तक उसका सारा DNA भारी न हो जाए। ¹⁴N में डालो, ताकि अब से हर नई लड़ी हल्की हो। एक विभाजन के बाद और दूसरे के बाद नमूने लो। तीन भविष्यवाणियाँ, और काम यहीं है। संरक्षी: जनक अणु सलामत रहता है और बिलकुल नया बनता है, अतः एक दौर के बाद दो पट्टियाँ होनी चाहिए — भारी जनक, हल्की पुत्री। अर्धसंरक्षी: हर पुत्री के पास एक भारी पुरानी लड़ी और एक हल्की नई, अतः एक दौर के बाद हर अणु संकर है और मध्यवर्ती घनत्व की एक अकेली पट्टी होनी चाहिए। विक्षेपी: पुरानी और नई सामग्री दोनों लड़ियों में बीच-बीच बिखरी, अतः एक दौर के बाद हर अणु भी मध्यवर्ती है — एक अकेली पट्टी, जो इस चरण पर अर्धसंरक्षी भविष्यवाणी से अलग नहीं पहचानी जा सकती। एक दौर के बाद। एक अकेली मध्यवर्ती पट्टी दिखी। यह संरक्षी प्रतिकृति को एकदम ख़ारिज कर देती है — उसने दो पट्टियों की भविष्यवाणी की थी और एक थी। यह अभी बाक़ी दोनों में भेद नहीं करती, और इसीलिए दूसरी पीढ़ी अनिवार्य थी। दो दौर के बाद। अर्धसंरक्षी भविष्यवाणी करती है कि हर संकर अणु अलग होता है, उसकी भारी लड़ी नई हल्की से जुड़कर संकर देती है, उसकी हल्की लड़ी पूरी हल्का अणु देती है: दो पट्टियाँ, आधी मध्यवर्ती और आधी हल्की। विक्षेपी भविष्यवाणी करती है कि पुरानी सामग्री अब हर अणु में दुगुनी पतली फैली है, अतः सारे अणु समरूप रहते हैं और अकेली पट्टी बस थोड़ी और हल्की खिसक जाती है — कभी फटती नहीं। बराबर मात्रा में दो पट्टियाँ दिखीं। विक्षेपी ख़ारिज। रचना महज़ संकेतक न होकर निर्णायक क्यों है। हर परिकल्पना पहले से एक विशिष्ट, भिन्न, प्रेक्षणीय परिणाम पर प्रतिबद्ध थी, और हर प्रेक्षण ने एक को हटाया। इस पर बहस करने की ज़रूरत ही नहीं पड़ी कि कौन-सी व्याख्या अधिक स्वाभाविक लगती है। यह भी ध्यान दो कि एक पीढ़ी काफ़ी नहीं थी — प्रयोग को उस बिंदु तक चलना पड़ा जहाँ बची परिकल्पनाएँ अलग होती हैं, और यह परीक्षण रचने के बारे में सामान्य सीख है। (दूसरा विकल्प ऐसी तकनीक का वर्णन करता है जो लड़ी की उम्र सुलझा नहीं सकती थी; तीसरा प्रयोग को ग़लत बताता है, जो कई पीढ़ियों तक चला, और प्रमाण के काम करने का ग़लत वर्णन करता है; चौथा प्राणघातक रेडियोऐक्टिवता गढ़ता है — ¹⁵N स्थायी समस्थानिक है और कोशिकाएँ सामान्य रूप से बढ़ीं।)",
          mr: "हा जीवशास्त्रातल्या सर्वांत स्वच्छ प्रयोगांपैकी एक आहे, आणि त्याला स्वच्छ हे बनवते की काहीही मोजण्याआधीच तिन्ही गृहीतकांकडून तीन वेगळ्या निरीक्षणीय निकालांचे भाकीत करवून घेतले गेले. आधी ती भाकिते काढा आणि निकाल स्वतःला वाचून दाखवतो. ती युक्ती जी DNA ला त्याच्या वयावरून दाखवते. नायट्रोजन क्षारांत आहे, म्हणून जड समस्थानिक ¹⁵N च्या माध्यमात बनलेला DNA साध्या ¹⁴N ने बनलेल्या DNA हून दाट आहे. घनता हा रासायनिक फरक नाही — DNA सारखाच वागतो — पण त्याला सीझियम क्लोराइड प्रवणतेत वेगळे करता येते, जिथे रेणू आपल्या घनतेशी जुळणाऱ्या खोलीवर बसतात आणि दृश्य पट्ट्या बनवतात. म्हणून पट्टीची जागा सांगते की तिच्यातली सामग्री कधी बनली. मांडणी. E. coli ला कित्येक पिढ्या ¹⁵N मध्ये वाढवा जोवर त्याचा सर्व DNA जड होत नाही. ¹⁴N मध्ये हलवा, जेणेकरून आतापासून प्रत्येक नवा पदर हलका असावा. एका विभाजनानंतर आणि दुसऱ्यानंतर नमुने घ्या. तीन भाकिते, आणि काम इथेच आहे. संरक्षी: जनक रेणू शाबूत राहतो आणि पूर्णपणे नवा बनतो, म्हणून एका फेरीनंतर दोन पट्ट्या असाव्यात — जड जनक, हलकी कन्या. अर्धसंरक्षी: प्रत्येक कन्येकडे एक जड जुना पदर आणि एक हलका नवा, म्हणून एका फेरीनंतर प्रत्येक रेणू संकर आहे आणि मध्यवर्ती घनतेची एकच पट्टी असावी. विक्षेपी: जुनी आणि नवी सामग्री दोन्ही पदरांत मधूनमधून विखुरलेली, म्हणून एका फेरीनंतर प्रत्येक रेणूही मध्यवर्ती आहे — एकच पट्टी, जी या टप्प्यावर अर्धसंरक्षी भाकितापासून वेगळी ओळखता येत नाही. एका फेरीनंतर. एकच मध्यवर्ती पट्टी दिसली. ती संरक्षी प्रतिकृती एकदम नाकारते — तिने दोन पट्ट्यांचे भाकीत केले होते आणि एक होती. ती अजून बाकीच्या दोघांत भेद करत नाही, आणि म्हणूनच दुसरी पिढी अनिवार्य होती. दोन फेऱ्यांनंतर. अर्धसंरक्षी भाकीत करते की प्रत्येक संकर रेणू वेगळा होतो, त्याचा जड पदर नव्या हलक्याशी जोडून संकर देतो, त्याचा हलका पदर अख्खा हलका रेणू देतो: दोन पट्ट्या, निम्म्या मध्यवर्ती आणि निम्म्या हलक्या. विक्षेपी भाकीत करते की जुनी सामग्री आता प्रत्येक रेणूत दुप्पट विरळ पसरली आहे, म्हणून सर्व रेणू सारखेच राहतात आणि एकच पट्टी फक्त थोडी अधिक हलकी सरकते — कधीही फुटत नाही. समान प्रमाणात दोन पट्ट्या दिसल्या. विक्षेपी नाकारली. रचना केवळ सूचक न राहता निर्णायक का आहे. प्रत्येक गृहीतक आधीच एका विशिष्ट, वेगळ्या, निरीक्षणीय निकालावर वचनबद्ध होते, आणि प्रत्येक निरीक्षणाने एक हटवले. कोणते स्पष्टीकरण अधिक नैसर्गिक वाटते यावर वाद घालण्याची गरजच पडली नाही. हेही लक्षात घ्या की एक पिढी पुरेशी नव्हती — प्रयोगाला त्या बिंदूपर्यंत चालावे लागले जिथे उरलेली गृहीतके वेगळी होतात, आणि हा चाचणी रचण्याबद्दलचा सर्वसाधारण बोध आहे. (दुसरा पर्याय अशा तंत्राचे वर्णन करतो जे पदराचे वय सोडवू शकले नसते; तिसरा प्रयोगाबद्दल चुकीचे सांगतो, जो कित्येक पिढ्या चालला, आणि पुरावा कसा काम करतो याचे चुकीचे वर्णन करतो; चौथा प्राणघातक किरणोत्सर्ग घडवतो — ¹⁵N स्थिर समस्थानिक आहे आणि पेशी सामान्यपणे वाढल्या.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "There are four bases and twenty amino acids, yet the code uses triplets and most amino acids have more than one codon, the alternatives usually differing in the third base. Explain why the length is three, and why the surplus is not simply waste.",
          hi: "चार क्षार और बीस ऐमीनो अम्ल हैं, फिर भी कूट त्रिक काम में लेता है और अधिकांश ऐमीनो अम्लों के एक से अधिक कोडॉन हैं, और विकल्प प्रायः तीसरे क्षार में भिन्न होते हैं। बताओ कि लंबाई तीन क्यों है, और अतिरेक महज़ अपव्यय क्यों नहीं।",
          mr: "चार क्षार आणि वीस अमिनो आम्ले आहेत, तरीही संकेत त्रिके वापरतो आणि बहुतांश अमिनो आम्लांना एकाहून अधिक कोडॉन आहेत, आणि पर्याय बहुधा तिसऱ्या क्षारात वेगळे असतात. लांबी तीन का आहे, आणि अतिरिक्तता केवळ अपव्यय का नाही ते सांगा.",
        },
        choices: [
          {
            en: "Three is the shortest length that works: singlets give four meanings and doublets sixteen, neither enough for twenty amino acids plus a stop signal, while triplets give sixty-four. The surplus of forty-four is then distributed so that synonymous codons usually differ only at the third position, and this is a buffer rather than an accident. A mutation in the third base of most codons changes nothing about the protein — a silent mutation — so a large fraction of random base changes are harmless. The pattern also limits the damage of the changes that do register, since chemically similar amino acids tend to have similar codons, and it tolerates small errors in tRNA pairing at that same third position",
            hi: "तीन सबसे छोटी लंबाई है जो चलती है: एकल चार अर्थ देते हैं और युगल सोलह, और कोई भी बीस ऐमीनो अम्लों तथा एक रुकने के संकेत के लिए काफ़ी नहीं, जबकि त्रिक चौंसठ देते हैं। फिर चौवालीस का अतिरेक ऐसे बाँटा गया है कि समानार्थी कोडॉन प्रायः केवल तीसरे स्थान पर भिन्न हों, और यह दुर्घटना नहीं बल्कि बचाव है। अधिकांश कोडॉन के तीसरे क्षार में उत्परिवर्तन प्रोटीन के बारे में कुछ नहीं बदलता — मौन उत्परिवर्तन — अतः बेतरतीब क्षार बदलावों का बड़ा हिस्सा हानिरहित है। यह प्रतिरूप उन बदलावों का नुक़सान भी सीमित करता है जो दर्ज होते हैं, चूँकि रासायनिक रूप से समान ऐमीनो अम्लों के कोडॉन समान होने की प्रवृत्ति रखते हैं, और वह उसी तीसरे स्थान पर tRNA युग्मन की छोटी ग़लतियाँ सह लेता है",
            mr: "तीन ही सर्वांत लहान लांबी आहे जी चालते: एकके चार अर्थ देतात आणि जोड्या सोळा, आणि कोणतीही वीस अमिनो आम्ले व एक थांबण्याचे संकेत यांसाठी पुरेशी नाही, तर त्रिके चौसष्ट देतात. मग चव्वेचाळीसची अतिरिक्तता अशी वाटली आहे की समानार्थी कोडॉन बहुधा केवळ तिसऱ्या जागी वेगळे असावेत, आणि हा अपघात नसून बचाव आहे. बहुतांश कोडॉनच्या तिसऱ्या क्षारातील उत्परिवर्तन प्रथिनाबद्दल काहीही बदलत नाही — मूक उत्परिवर्तन — म्हणून यादृच्छिक क्षार बदलांचा मोठा हिस्सा निरुपद्रवी आहे. हा नमुना जे बदल नोंदले जातात त्यांचे नुकसानही मर्यादित करतो, कारण रासायनिकदृष्ट्या सारख्या अमिनो आम्लांचे कोडॉन सारखे असण्याची प्रवृत्ती असते, आणि तो त्याच तिसऱ्या जागी tRNA युग्मनाच्या लहान चुका सहन करतो",
          },
          {
            en: "Three is used because amino acids have three chemically distinct regions and each base specifies one of them, so the correspondence is physical rather than a matter of counting",
            hi: "तीन इसलिए काम में लिए जाते हैं कि ऐमीनो अम्लों के तीन रासायनिक रूप से भिन्न क्षेत्र होते हैं और हर क्षार उनमें से एक को निर्दिष्ट करता है, अतः यह संगति गिनती का नहीं बल्कि भौतिक मामला है",
            mr: "तीन यासाठी वापरले जातात की अमिनो आम्लांना तीन रासायनिकदृष्ट्या वेगळे प्रदेश असतात आणि प्रत्येक क्षार त्यांपैकी एक निर्दिष्ट करतो, म्हणून ही संगती मोजणीची नव्हे तर भौतिक बाब आहे",
          },
          {
            en: "The extra codons are relics that no longer code for anything, and cells expend energy skipping over them during translation",
            hi: "अतिरिक्त कोडॉन ऐसे अवशेष हैं जो अब किसी चीज़ के लिए कूट नहीं करते, और कोशिकाएँ अनुवाद के दौरान उन्हें लाँघने में ऊर्जा ख़र्च करती हैं",
            mr: "अतिरिक्त कोडॉन असे अवशेष आहेत जे आता कशासाठीही संकेत करत नाहीत, आणि पेशी भाषांतरादरम्यान त्यांना ओलांडण्यात ऊर्जा खर्च करतात",
          },
          {
            en: "The surplus exists so that each organism can use its own private set of codons, which is why the code differs substantially from one species to another",
            hi: "अतिरेक इसलिए है कि हर जीव अपना निजी कोडॉन समुच्चय काम में ले सके, इसीलिए कूट एक जाति से दूसरी में काफ़ी भिन्न है",
            mr: "अतिरिक्तता यासाठी आहे की प्रत्येक जीव आपला खासगी कोडॉन संच वापरू शकेल, म्हणूनच संकेत एका जातीपासून दुसरीत बराच वेगळा आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two questions, and both are answered by arithmetic followed by a look at what the arithmetic leaves over. WHY THREE. The code must map sequences of four bases onto twenty amino acids plus an instruction to stop. Count the possibilities at each length. One base gives 4 meanings — far too few. Two bases give 4² = 16 — still short of twenty-one, and short by enough that no amount of cleverness rescues it. Three bases give 4³ = 64, comfortably more than needed. So three is not merely sufficient; it is the SHORTEST sufficient length, which matters because a longer codon would mean more DNA to store, copy and read for the same protein. Note that this argument was made before the code was cracked, and the experiments then confirmed it. WHAT HAPPENS TO THE SURPLUS. Sixty-four codons for twenty-one meanings leaves forty-three to spare. They are not left unused — that would be the wasteful option, and would also mean two thirds of all random mutations produce a nonsense codon and a truncated protein. Instead every codon has a meaning, and most amino acids have several. Leucine, serine and arginine have six each; only methionine and tryptophan have one. WHY THE PATTERN OF THE REDUNDANCY IS THE INTERESTING PART. The synonyms are not scattered at random. For most amino acids, the alternatives share the first two bases and differ only in the third — the four codons beginning GG all specify glycine, whatever the third letter. Three consequences follow. First, a mutation at the third position of such a codon is silent: the protein is unchanged, so the mutation has no effect on the phenotype at all. Since a third of all base positions are third positions, this makes a substantial fraction of random substitutions harmless. Second, the code is arranged so that codons differing in one base often specify chemically similar amino acids, so even a mutation that does change the protein tends to make a conservative substitution rather than a drastic one. Third, it permits wobble: the pairing between the third base of the codon and the corresponding base of the tRNA anticodon is less strict than the other two, which is why fewer than sixty-four tRNAs are needed and why a small pairing error there is usually harmless. THE UNIFYING IDEA, WHICH IS WORTH GENERALISING. Redundancy in a code is what makes it robust to errors — the same reason a checksum is added to a bank account number or an error-correcting code to a data transmission. A system with no spare capacity fails at the first mistake. So the 'surplus' here is not slack in the design; it is the design absorbing the mutations that a replicating molecule is bound to accumulate. One more fact worth having: the code is very nearly universal, the same in bacteria and in humans, which is itself strong evidence that all life descends from a common ancestor in which it was already fixed. (The second option invents a structural correspondence that does not exist; the third contradicts the fact that all sixty-four codons have assigned meanings; the fourth contradicts the near-universality of the code, which is one of its most striking properties.)",
          hi: "दो प्रश्न, और दोनों का उत्तर पहले गणित से और फिर यह देखने से मिलता है कि गणित क्या बचा जाता है। तीन क्यों। कूट को चार क्षारों के अनुक्रमों को बीस ऐमीनो अम्लों और एक रुकने के निर्देश पर मानचित्रित करना है। हर लंबाई पर संभावनाएँ गिनो। एक क्षार 4 अर्थ देता है — कहीं बहुत कम। दो क्षार 4² = 16 देते हैं — इक्कीस से अब भी कम, और इतने कम कि कोई चतुराई उसे नहीं बचाती। तीन क्षार 4³ = 64 देते हैं, ज़रूरत से आराम से अधिक। अतः तीन केवल पर्याप्त नहीं; वह सबसे छोटी पर्याप्त लंबाई है, और यह इसलिए मायने रखता है कि लंबा कोडॉन होने पर उसी प्रोटीन के लिए अधिक DNA संचित, नक़ल और पढ़ा जाना पड़ता। ध्यान दो कि यह तर्क कूट के खुलने से पहले दिया गया था, और फिर प्रयोगों ने उसकी पुष्टि की। अतिरेक का क्या होता है। इक्कीस अर्थों के लिए चौंसठ कोडॉन तैंतालीस बचा देते हैं। उन्हें अप्रयुक्त नहीं छोड़ा गया — वही अपव्ययी विकल्प होता, और उसका अर्थ यह भी होता कि सारे बेतरतीब उत्परिवर्तनों का दो-तिहाई निरर्थक कोडॉन और कटा-फटा प्रोटीन दे। इसके बजाय हर कोडॉन का अर्थ है, और अधिकांश ऐमीनो अम्लों के कई हैं। ल्यूसीन, सेरीन और आर्जिनीन के छह-छह; केवल मेथियोनीन और ट्रिप्टोफ़ैन के एक-एक। आधिक्य का प्रतिरूप ही रोचक हिस्सा क्यों है। समानार्थी बेतरतीब बिखरे नहीं हैं। अधिकांश ऐमीनो अम्लों के लिए विकल्प पहले दो क्षार साझा करते हैं और केवल तीसरे में भिन्न होते हैं — GG से शुरू होते चारों कोडॉन ग्लाइसीन ही निर्दिष्ट करते हैं, तीसरा अक्षर चाहे जो हो। तीन परिणाम निकलते हैं। पहला, ऐसे कोडॉन के तीसरे स्थान पर उत्परिवर्तन मौन है: प्रोटीन अपरिवर्तित है, अतः उत्परिवर्तन का लक्षणप्ररूप पर कोई प्रभाव ही नहीं। चूँकि सारे क्षार स्थानों का एक-तिहाई तीसरा स्थान है, इससे बेतरतीब प्रतिस्थापनों का काफ़ी हिस्सा हानिरहित हो जाता है। दूसरा, कूट ऐसे जमा है कि एक क्षार में भिन्न कोडॉन प्रायः रासायनिक रूप से समान ऐमीनो अम्ल निर्दिष्ट करते हैं, अतः जो उत्परिवर्तन प्रोटीन बदलता भी है वह प्रायः कठोर के बजाय संयत प्रतिस्थापन करता है। तीसरा, वह डगमगाहट की छूट देता है: कोडॉन के तीसरे क्षार और tRNA प्रतिकोडॉन के तदनुरूप क्षार के बीच युग्मन बाक़ी दोनों से कम सख़्त है, इसीलिए चौंसठ से कम tRNA चाहिए और इसीलिए वहाँ छोटी युग्मन ग़लती प्रायः हानिरहित है। एकीकृत विचार, जिसे सामान्यीकृत करना चाहिए। किसी कूट का आधिक्य ही उसे ग़लतियों के प्रति दृढ़ बनाता है — उसी कारण से जिससे बैंक खाता संख्या में जाँच अंक जोड़ा जाता है या डेटा संचरण में त्रुटि-सुधारक कूट। जिस तंत्र में कोई अतिरिक्त क्षमता नहीं वह पहली ग़लती पर ही विफल हो जाता है। अतः यहाँ का 'अतिरेक' रचना की ढील नहीं; वह रचना का उन उत्परिवर्तनों को सोख लेना है जो प्रतिकृति करते अणु में जमा होने ही हैं। एक और तथ्य रखने लायक़: कूट लगभग पूरी तरह सार्वभौम है, जीवाणुओं और मनुष्यों में वही, और यह स्वयं प्रबल प्रमाण है कि सारा जीवन ऐसे साझे पूर्वज से उतरा है जिसमें वह पहले ही तय हो चुका था। (दूसरा विकल्प ऐसी संरचनात्मक संगति गढ़ता है जो है ही नहीं; तीसरा इस तथ्य का खंडन करता है कि चौंसठों कोडॉन के अर्थ नियत हैं; चौथा कूट की लगभग-सार्वभौमिकता का खंडन करता है, जो उसके सबसे उल्लेखनीय गुणों में से एक है।)",
          mr: "दोन प्रश्न, आणि दोघांचे उत्तर आधी गणिताने आणि मग गणित काय शिल्लक ठेवते हे पाहून मिळते. तीन का. संकेताला चार क्षारांच्या क्रमांना वीस अमिनो आम्ले आणि एक थांबण्याची सूचना यांवर नकाशित करायचे आहे. प्रत्येक लांबीवर शक्यता मोजा. एक क्षार 4 अर्थ देतो — कितीतरी कमी. दोन क्षार 4² = 16 देतात — एकविसाहून अजूनही कमी, आणि इतके कमी की कोणतीही हुशारी त्याला वाचवत नाही. तीन क्षार 4³ = 64 देतात, गरजेहून आरामात अधिक. म्हणून तीन केवळ पुरेसे नाही; ती सर्वांत लहान पुरेशी लांबी आहे, आणि हे यासाठी महत्त्वाचे की लांब कोडॉन असल्यास त्याच प्रथिनासाठी अधिक DNA साठवावा, नक्कल करावा आणि वाचावा लागेल. लक्षात घ्या की हा युक्तिवाद संकेत उलगडण्याआधी मांडला गेला होता, आणि मग प्रयोगांनी त्याची खात्री दिली. अतिरिक्ततेचे काय होते. एकवीस अर्थांसाठी चौसष्ट कोडॉन त्रेचाळीस शिल्लक ठेवतात. त्यांना न वापरता सोडले गेले नाही — तोच उधळपट्टीचा पर्याय ठरला असता, आणि त्याचा अर्थ हाही झाला असता की सर्व यादृच्छिक उत्परिवर्तनांचा दोन-तृतीयांश निरर्थक कोडॉन आणि तुटके प्रथिन देईल. त्याऐवजी प्रत्येक कोडॉनला अर्थ आहे, आणि बहुतांश अमिनो आम्लांना कित्येक. ल्युसिन, सेरिन आणि आर्जिनिनला सहा-सहा; केवळ मिथिओनिन आणि ट्रिप्टोफॅनला एकेक. आधिक्याचा नमुनाच रोचक भाग का आहे. समानार्थी यादृच्छिक विखुरलेले नाहीत. बहुतांश अमिनो आम्लांसाठी पर्याय पहिली दोन क्षारे समाईक ठेवतात आणि केवळ तिसऱ्यात वेगळे असतात — GG ने सुरू होणारे चारही कोडॉन ग्लायसिनच निर्दिष्ट करतात, तिसरे अक्षर काहीही असो. तीन परिणाम निघतात. पहिला, अशा कोडॉनच्या तिसऱ्या जागी उत्परिवर्तन मूक आहे: प्रथिन अपरिवर्तित आहे, म्हणून उत्परिवर्तनाचा लक्षणप्ररूपावर कोणताही परिणामच नाही. सर्व क्षार जागांचा एक-तृतीयांश तिसरी जागा असल्याने, यामुळे यादृच्छिक प्रतिस्थापनांचा बराच हिस्सा निरुपद्रवी होतो. दुसरा, संकेत असा मांडला आहे की एका क्षारात वेगळे कोडॉन बहुधा रासायनिकदृष्ट्या सारखी अमिनो आम्ले निर्दिष्ट करतात, म्हणून जे उत्परिवर्तन प्रथिन बदलतेही ते बहुधा तीव्रऐवजी संयत प्रतिस्थापन करते. तिसरा, तो डगमगण्याची मुभा देतो: कोडॉनच्या तिसऱ्या क्षार आणि tRNA प्रतिकोडॉनच्या त्याअनुषंगिक क्षारातील युग्मन बाकी दोघांहून कमी कडक आहे, म्हणूनच चौसष्टहून कमी tRNA लागतात आणि म्हणूनच तिथे लहान युग्मन चूक बहुधा निरुपद्रवी असते. एकत्रित कल्पना, जिचे सामान्यीकरण करण्याजोगे आहे. एखाद्या संकेताचे आधिक्यच त्याला चुकांबाबत खंबीर बनवते — त्याच कारणाने ज्याने बँक खाते क्रमांकात तपासणी अंक जोडला जातो वा माहिती संक्रमणात त्रुटी-सुधारक संकेत. ज्या यंत्रणेत कोणतीही अतिरिक्त क्षमता नाही ती पहिल्याच चुकीवर अपयशी ठरते. म्हणून इथली 'अतिरिक्तता' रचनेतली ढील नाही; ती रचनेने त्या उत्परिवर्तनांना शोषून घेणे आहे जी प्रतिकृती करणाऱ्या रेणूत जमणारच आहेत. आणखी एक ठेवण्याजोगे सत्य: संकेत जवळपास पूर्णपणे वैश्विक आहे, जिवाणूंत आणि माणसांत तोच, आणि हा स्वतः भक्कम पुरावा आहे की सर्व जीवन अशा सामायिक पूर्वजापासून उतरले आहे ज्यात तो आधीच ठरलेला होता. (दुसरा पर्याय अशी संरचनात्मक संगती घडवतो जी अस्तित्वातच नाही; तिसरा या सत्याचे खंडन करतो की चौसष्टही कोडॉनना अर्थ नेमून दिलेले आहेत; चौथा संकेताच्या जवळपास-वैश्विकतेचे खंडन करतो, जो त्याच्या सर्वांत लक्षणीय गुणधर्मांपैकी एक आहे.)",
        },
      },
    ],
  },
  /*C4*/
];

export const G12_BIOLOGY_NUMERIC: Record<string, NumQ[]> = {
  /*N1*/
  "biology-12-principles-of-inheritance-and-variation": [
    {
      level: 1,
      stem: {
        en: "Two heterozygous tall pea plants are crossed. Out of every four offspring, how many are expected to be short?",
        hi: "दो विषमयुग्मजी लंबे मटर पादपों का संकरण किया जाता है। हर चार संततियों में से कितनी बौनी होने की अपेक्षा है?",
        mr: "दोन विषमयुग्मजी उंच वाटाणा वनस्पतींचे संकरण केले जाते. प्रत्येक चार संततींपैकी किती खुज्या असण्याची अपेक्षा आहे?",
      },
      answer: 1,
      wrong: [3, 2, 0],
      checkExpr: "4-3",
      solution: {
        en: "Three of the four are tall and one is short: 4 − 3 = 1. The short plant is the one that received the recessive allele from both parents, and its reappearance is the whole point of the cross — a character that vanished entirely in the previous generation comes back undiluted, which is what ruled out the idea that inherited factors blend. (3 counts the tall ones.)",
        hi: "चारों में से तीन लंबे और एक बौना है: 4 − 3 = 1. बौना पादप वही है जिसे दोनों जनकों से अप्रभावी एलील मिला, और उसका लौटना ही संकरण का पूरा मर्म है — जो लक्षण पिछली पीढ़ी में बिलकुल लुप्त हो गया था वह बिना पतला हुए लौट आता है, और इसी ने इस विचार को ख़ारिज किया कि वंशागत कारक मिल जाते हैं। (3 लंबे वाले गिनता है।)",
        mr: "चौघांपैकी तीन उंच आणि एक खुजी आहे: 4 − 3 = 1. खुजी वनस्पती तीच आहे जिला दोन्ही जनकांकडून अप्रभावी अ‍ॅलिल मिळाले, आणि तिचे परतणे हाच संकरणाचा अख्खा गाभा आहे — जे लक्षण मागच्या पिढीत पूर्णपणे लोप पावले होते ते विरळ न होता परतते, आणि यानेच ही कल्पना नाकारली की आनुवंशिक घटक मिसळतात. (3 उंच मोजते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "How many different kinds of gamete can a plant heterozygous for one gene produce with respect to that gene?",
        hi: "किसी एक जीन के लिए विषमयुग्मजी पादप उस जीन के संदर्भ में कितनी भिन्न क़िस्म के युग्मक बना सकता है?",
        mr: "एखाद्या जनुकासाठी विषमयुग्मजी वनस्पती त्या जनुकाच्या संदर्भात किती वेगळ्या प्रकारचे युग्मक बनवू शकते?",
      },
      answer: 2,
      wrong: [1, 4, 3],
      checkExpr: "1+1",
      solution: {
        en: "1 + 1 = 2 kinds, one carrying each allele, in equal numbers. This is the law of segregation stated in terms of gametes rather than offspring, and it is what the whole ratio rests on: if the two alleles did not separate cleanly and equally, no three-to-one would appear. (1 assumes both gametes carry the same thing, which would be true only of a homozygote.)",
        hi: "1 + 1 = 2 क़िस्में, हर एक एलील ढोती हुई, बराबर संख्या में। यह पृथक्करण का नियम है, संतति के बजाय युग्मकों की भाषा में कहा गया, और पूरा अनुपात इसी पर टिका है: यदि दोनों एलील साफ़ और बराबर अलग न होते तो कोई तीन-से-एक प्रकट ही न होता। (1 मान लेता है कि दोनों युग्मक वही चीज़ ढोते हैं, जो केवल समयुग्मजी के लिए सही होता।)",
        mr: "1 + 1 = 2 प्रकार, प्रत्येक एक अ‍ॅलिल वाहणारा, समान संख्येत. हा पृथक्करणाचा नियम आहे, संततीऐवजी युग्मकांच्या भाषेत सांगितलेला, आणि अख्खे गुणोत्तर याच्यावरच टिकले आहे: जर दोन्ही अ‍ॅलिले स्वच्छ आणि समान वेगळी झाली नसती तर कोणतेही तीन-ला-एक प्रकटच झाले नसते. (1 गृहीत धरते की दोन्ही युग्मक तीच गोष्ट वाहतात, जे केवळ समयुग्मजीसाठी बरोबर असते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "How many different kinds of gamete can a plant heterozygous for two independently assorting genes produce?",
        hi: "दो स्वतंत्र रूप से छँटते जीनों के लिए विषमयुग्मजी पादप कितनी भिन्न क़िस्म के युग्मक बना सकता है?",
        mr: "दोन स्वतंत्रपणे विभागल्या जाणाऱ्या जनुकांसाठी विषमयुग्मजी वनस्पती किती वेगळ्या प्रकारचे युग्मक बनवू शकते?",
      },
      answer: 4,
      wrong: [2, 8, 16],
      checkExpr: "2*2",
      solution: {
        en: "Each gene contributes two choices and the choices are independent, so 2 × 2 = 4 kinds in equal numbers. The multiplication is the whole content of the second law: if the genes were not independent the four kinds would not be equally frequent. In general n heterozygous genes give 2ⁿ kinds of gamete, which is why a small number of genes generates an enormous number of possible offspring. (8 uses three genes.)",
        hi: "हर जीन दो विकल्प देता है और विकल्प स्वतंत्र हैं, अतः 2 × 2 = 4 क़िस्में बराबर संख्या में। गुणा ही दूसरे नियम का पूरा सार है: यदि जीन स्वतंत्र न होते तो चारों क़िस्में बराबर बारंबारता की न होतीं। सामान्यतः n विषमयुग्मजी जीन 2ⁿ क़िस्म के युग्मक देते हैं, इसीलिए थोड़े से जीन विशाल संख्या में संभव संततियाँ पैदा कर देते हैं। (8 तीन जीन काम में लेता है।)",
        mr: "प्रत्येक जनुक दोन पर्याय देते आणि पर्याय स्वतंत्र आहेत, म्हणून 2 × 2 = 4 प्रकार समान संख्येत. गुणाकारच दुसऱ्या नियमाचा अख्खा सार आहे: जर जनुके स्वतंत्र नसती तर चारही प्रकार समान वारंवारतेचे नसते. सर्वसाधारणपणे n विषमयुग्मजी जनुके 2ⁿ प्रकारचे युग्मक देतात, म्हणूनच थोडी जनुके प्रचंड संख्येने शक्य संतती निर्माण करतात. (8 तीन जनुके वापरते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "In a dihybrid cross between two double heterozygotes, how many offspring out of sixteen show both recessive characters?",
        hi: "दो द्विविषमयुग्मजियों के बीच द्विसंकर संकरण में सोलह संततियों में से कितनी दोनों अप्रभावी लक्षण दिखाती हैं?",
        mr: "दोन द्विविषमयुग्मजींमधल्या द्विसंकर संकरणात सोळा संततींपैकी किती दोन्ही अप्रभावी लक्षणे दाखवतात?",
      },
      answer: 1,
      wrong: [9, 3, 4],
      checkExpr: "16-15",
      solution: {
        en: "16 − 15 = 1, the rarest class in the nine to three to three to one ratio. It is worth seeing where that ratio comes from rather than memorising it: each character on its own gives three to one, and if the two are independent the combined proportions are the products — three-quarters times three-quarters gives nine sixteenths, and one-quarter times one-quarter gives one sixteenth. A dihybrid ratio is two monohybrid ratios multiplied, which is what independence means. (9 gives the commonest class instead.)",
        hi: "16 − 15 = 1, नौ, तीन, तीन, एक के अनुपात का सबसे दुर्लभ वर्ग। उस अनुपात को रटने के बजाय यह देखना काम का है कि वह आता कहाँ से है: हर लक्षण अकेला तीन-से-एक देता है, और यदि दोनों स्वतंत्र हों तो संयुक्त अनुपात उनके गुणनफल हैं — तीन-चौथाई गुणा तीन-चौथाई नौ-सोलहवाँ देता है, और एक-चौथाई गुणा एक-चौथाई एक-सोलहवाँ। द्विसंकर अनुपात दो एकसंकर अनुपातों का गुणनफल है, और स्वतंत्रता का यही अर्थ है। (9 इसके बजाय सबसे आम वर्ग देता है।)",
        mr: "16 − 15 = 1, नऊ, तीन, तीन, एक या गुणोत्तरातील सर्वांत दुर्मीळ वर्ग. ते गुणोत्तर पाठ करण्याऐवजी ते कुठून येते हे पाहणे उपयुक्त आहे: प्रत्येक लक्षण एकटे तीन-ला-एक देते, आणि जर दोन्ही स्वतंत्र असतील तर संयुक्त प्रमाणे त्यांचे गुणाकार आहेत — तीन-चतुर्थांश गुणिले तीन-चतुर्थांश नऊ-सोळांश देते, आणि एक-चतुर्थांश गुणिले एक-चतुर्थांश एक-सोळांश. द्विसंकर गुणोत्तर हे दोन एकसंकर गुणोत्तरांचा गुणाकार आहे, आणि स्वातंत्र्याचा हाच अर्थ आहे. (9 त्याऐवजी सर्वांत सामान्य वर्ग देते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A woman is a carrier for an X-linked recessive condition and her husband is unaffected. Out of every four children, how many sons are expected to be affected?",
        hi: "कोई स्त्री किसी X-सहलग्न अप्रभावी स्थिति की वाहक है और उसका पति अप्रभावित है। हर चार बच्चों में से कितने बेटों के प्रभावित होने की अपेक्षा है?",
        mr: "एक स्त्री एखाद्या X-सहलग्न अप्रभावी स्थितीची वाहक आहे आणि तिचा पती अप्रभावित आहे. प्रत्येक चार मुलांपैकी किती मुलगे प्रभावित असण्याची अपेक्षा आहे?",
      },
      answer: 1,
      wrong: [2, 4, 0],
      checkExpr: "4-3",
      solution: {
        en: "4 − 3 = 1. Of four children about two are sons, and each son has an even chance of receiving the faulty X from his mother, so one in four children is an affected son. Follow the daughters too, because the pattern is the informative part: about two are daughters, each with an even chance of being a carrier, and none can be affected since her father contributes a normal X. So the condition appears in males and travels through females — and it cannot pass from a father to a son at all, which is the sign that identifies X-linkage in a pedigree. (2 counts all the sons rather than the affected ones.)",
        hi: "4 − 3 = 1. चार बच्चों में से क़रीब दो बेटे हैं, और हर बेटे के माँ से दोषपूर्ण X पाने की बराबर संभावना है, अतः चार बच्चों में से एक प्रभावित बेटा है। बेटियों का भी पीछा करो, क्योंकि प्रतिरूप ही ज्ञानप्रद हिस्सा है: क़रीब दो बेटियाँ हैं, हर एक के वाहक होने की बराबर संभावना, और कोई प्रभावित नहीं हो सकती चूँकि उसका पिता सामान्य X देता है। अतः स्थिति पुरुषों में प्रकट होती है और स्त्रियों से होकर चलती है — और वह पिता से बेटे तक जा ही नहीं सकती, और वंशवृक्ष में X-सहलग्नता को यही चिह्न पहचानता है। (2 प्रभावितों के बजाय सारे बेटे गिनता है।)",
        mr: "4 − 3 = 1. चार मुलांपैकी सुमारे दोन मुलगे आहेत, आणि प्रत्येक मुलाला आईकडून सदोष X मिळण्याची समान शक्यता आहे, म्हणून चार मुलांपैकी एक प्रभावित मुलगा आहे. मुलींचाही मागोवा घ्या, कारण नमुनाच माहितीपूर्ण भाग आहे: सुमारे दोन मुली आहेत, प्रत्येकीला वाहक असण्याची समान शक्यता, आणि कोणीही प्रभावित असू शकत नाही कारण तिचे वडील सामान्य X देतात. म्हणून स्थिती पुरुषांत प्रकट होते आणि स्त्रियांतून चालते — आणि ती वडिलांकडून मुलाकडे जाऊच शकत नाही, आणि वंशवृक्षात X-सहलग्नता हेच चिन्ह ओळखते. (2 प्रभावितांऐवजी सर्व मुलगे मोजते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "How many autosomes does a normal human somatic cell contain?",
        hi: "किसी सामान्य मानव कायिक कोशिका में कितने अलिंगसूत्र होते हैं?",
        mr: "एका सामान्य मानवी कायिक पेशीत किती अलिंगसूत्रे असतात?",
      },
      answer: 44,
      wrong: [46, 22, 23],
      checkExpr: "46-2",
      solution: {
        en: "46 − 2 = 44, because two of the forty-six chromosomes are the sex chromosomes. The distinction matters for reading a pedigree rather than for counting: a gene on one of the forty-four is present in two copies in everyone, so its inheritance looks the same in both sexes, while a gene on the X is present twice in a female and once in a male, which is the whole source of the sex-linked pattern. (46 counts every chromosome.)",
        hi: "46 − 2 = 44, क्योंकि छियालीस में से दो गुणसूत्र लिंग गुणसूत्र हैं। यह भेद गिनने के लिए नहीं बल्कि वंशवृक्ष पढ़ने के लिए मायने रखता है: चौवालीस में से किसी एक पर का जीन हर किसी में दो प्रतियों में है, अतः उसकी वंशागति दोनों लिंगों में एक जैसी दिखती है, जबकि X पर का जीन मादा में दो बार और नर में एक बार है, और लिंग सहलग्न प्रतिरूप का पूरा स्रोत यही है। (46 हर गुणसूत्र गिनता है।)",
        mr: "46 − 2 = 44, कारण छत्तेचाळिसांपैकी दोन गुणसूत्रे लिंग गुणसूत्रे आहेत. हा भेद मोजण्यासाठी नव्हे तर वंशवृक्ष वाचण्यासाठी महत्त्वाचा आहे: चव्वेचाळिसांपैकी एकावरचे जनुक प्रत्येकात दोन प्रतींत आहे, म्हणून त्याची आनुवंशिकता दोन्ही लिंगांत सारखी दिसते, तर X वरचे जनुक मादीत दोनदा आणि नरात एकदा आहे, आणि लिंग सहलग्न नमुन्याचा अख्खा स्रोत हाच आहे. (46 प्रत्येक गुणसूत्र मोजते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A test cross between a heterozygote and a homozygous recessive gives how many offspring showing the recessive character, out of every four?",
        hi: "किसी विषमयुग्मजी और समयुग्मजी अप्रभावी के बीच परीक्षण संकरण हर चार में से कितनी अप्रभावी लक्षण दिखाती संततियाँ देता है?",
        mr: "एका विषमयुग्मजी आणि समयुग्मजी अप्रभावीमधले चाचणी संकरण प्रत्येक चारांपैकी किती अप्रभावी लक्षण दाखवणाऱ्या संतती देते?",
      },
      answer: 2,
      wrong: [1, 3, 4],
      checkExpr: "4/2",
      solution: {
        en: "4/2 = 2, a one-to-one ratio. That is what makes the test cross useful: a plant showing the dominant character could be either homozygous or heterozygous, and its own appearance cannot tell you which. Cross it to a homozygous recessive and the two possibilities give visibly different results — a homozygote gives all dominant offspring, a heterozygote gives half and half. So an unobservable genotype has been read off from a countable ratio, which is the same move Mendel made throughout. (1 gives the self-cross ratio instead.)",
        hi: "4/2 = 2, यानी एक-से-एक अनुपात। परीक्षण संकरण को काम का यही बनाता है: प्रभावी लक्षण दिखाता पादप समयुग्मजी भी हो सकता है और विषमयुग्मजी भी, और उसकी अपनी शक्ल यह नहीं बता सकती कि कौन-सा। उसका समयुग्मजी अप्रभावी से संकरण करो और दोनों संभावनाएँ दृश्यतः भिन्न परिणाम देती हैं — समयुग्मजी सारी प्रभावी संततियाँ देता है, विषमयुग्मजी आधी-आधी। अतः एक अप्रेक्षणीय जीनप्ररूप गिनने योग्य अनुपात से पढ़ लिया गया, और मेंडेल ने आद्योपांत यही चाल चली। (1 इसके बजाय स्व-संकरण का अनुपात देता है।)",
        mr: "4/2 = 2, म्हणजे एक-ला-एक गुणोत्तर. चाचणी संकरणाला उपयुक्त हेच बनवते: प्रभावी लक्षण दाखवणारी वनस्पती समयुग्मजीही असू शकते आणि विषमयुग्मजीही, आणि तिचे स्वतःचे रूप कोणते ते सांगू शकत नाही. तिचे समयुग्मजी अप्रभावीशी संकरण करा आणि दोन्ही शक्यता दृश्यतः वेगळे निकाल देतात — समयुग्मजी सर्व प्रभावी संतती देते, विषमयुग्मजी निम्मी-निम्मी. म्हणून एक अनिरीक्षणीय जनुकप्ररूप मोजण्याजोग्या गुणोत्तरावरून वाचला गेला, आणि मेंडेलने सर्वत्र हीच चाल केली. (1 त्याऐवजी स्व-संकरणाचे गुणोत्तर देते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "How many different genotypes are possible in the offspring of a cross between two heterozygotes for a single gene?",
        hi: "किसी एक जीन के लिए दो विषमयुग्मजियों के संकरण की संतति में कितने भिन्न जीनप्ररूप संभव हैं?",
        mr: "एखाद्या जनुकासाठी दोन विषमयुग्मजींच्या संकरणाच्या संततीत किती वेगळे जनुकप्ररूप शक्य आहेत?",
      },
      answer: 3,
      wrong: [2, 4, 1],
      checkExpr: "4-1",
      solution: {
        en: "4 − 1 = 3 genotypes in the ratio one homozygous dominant, two heterozygous, one homozygous recessive — the four gamete combinations collapse to three because the two heterozygous ones are the same genotype. That the genotypes are three while the appearances are two is the useful point, and it is why incomplete dominance is not an exception to Mendel's laws: when the heterozygote looks intermediate rather than like the dominant parent, the visible ratio becomes one to two to one, but the genotypes underneath have not changed at all. Only the reading has. (2 counts the visible classes.)",
        hi: "4 − 1 = 3 जीनप्ररूप, अनुपात में एक समयुग्मजी प्रभावी, दो विषमयुग्मजी, एक समयुग्मजी अप्रभावी — चार युग्मक संयोजन तीन पर सिमट जाते हैं क्योंकि दोनों विषमयुग्मजी वही जीनप्ररूप हैं। जीनप्ररूप तीन और शक्लें दो होना ही काम की बात है, और इसीलिए अपूर्ण प्रभाविता मेंडेल के नियमों का अपवाद नहीं: जब विषमयुग्मजी प्रभावी जनक जैसा न होकर बीच का दिखता है, तो दृश्य अनुपात एक, दो, एक हो जाता है, पर नीचे के जीनप्ररूप बिलकुल नहीं बदले। केवल पढ़ना बदला है। (2 दृश्य वर्ग गिनता है।)",
        mr: "4 − 1 = 3 जनुकप्ररूप, गुणोत्तरात एक समयुग्मजी प्रभावी, दोन विषमयुग्मजी, एक समयुग्मजी अप्रभावी — चार युग्मक संयोजने तिनांवर आक्रसतात कारण दोन्ही विषमयुग्मजी तोच जनुकप्ररूप आहेत. जनुकप्ररूप तीन आणि रूपे दोन असणे हाच उपयुक्त मुद्दा आहे, आणि म्हणूनच अपूर्ण प्रभाविता मेंडेलच्या नियमांचा अपवाद नाही: जेव्हा विषमयुग्मजी प्रभावी जनकासारखा न दिसता मधला दिसतो, तेव्हा दृश्य गुणोत्तर एक, दोन, एक होते, पण खालचे जनुकप्ररूप मुळीच बदललेले नाहीत. केवळ वाचन बदलले आहे. (2 दृश्य वर्ग मोजते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "In a dihybrid cross, the F₂ shows 9 : 3 : 3 : 1. How many of the sixteen show at least one dominant character?",
        hi: "किसी द्विसंकर संकरण में F₂ में 9 : 3 : 3 : 1 दिखता है। सोलह में से कितनी संततियाँ कम से कम एक प्रभावी लक्षण दिखाती हैं?",
        mr: "एका द्विसंकर संकरणात F₂ मध्ये 9 : 3 : 3 : 1 दिसते. सोळांपैकी किती संतती किमान एक प्रभावी लक्षण दाखवतात?",
      },
      answer: 15,
      wrong: [9, 12, 16],
      checkExpr: "9+6",
      solution: {
        en: "Nine show both dominant characters and six show one of the two, so 9 + 6 = 15, and only the single double-recessive plant shows neither. The arithmetic is easy; noticing what it means is the point. Rare classes carry the information. That single plant in sixteen is the only one whose genotype can be read directly from its appearance, and it is also the class most easily lost in a small experiment — with sixteen plants you might get none by chance, which is exactly why Mendel counted thousands. A ratio that needs a rare class to be distinguished from another ratio needs a large sample to be trusted. (9 counts only the double dominants.)",
        hi: "नौ दोनों प्रभावी लक्षण दिखाती हैं और छह उन दोनों में से एक, अतः 9 + 6 = 15, और केवल अकेला द्विअप्रभावी पादप कोई नहीं दिखाता। गणित आसान है; मर्म यह देखना है कि उसका अर्थ क्या है। सूचना दुर्लभ वर्ग ढोते हैं। सोलह में वह अकेला पादप ही ऐसा है जिसका जीनप्ररूप उसकी शक्ल से सीधे पढ़ा जा सकता है, और वही वर्ग छोटे प्रयोग में सबसे आसानी से खो भी जाता है — सोलह पादपों में संयोगवश एक भी न मिले, और ठीक इसीलिए मेंडेल ने हज़ारों गिने। जिस अनुपात को दूसरे अनुपात से अलग बताने के लिए कोई दुर्लभ वर्ग चाहिए उस पर भरोसा करने को बड़ा नमूना चाहिए। (9 केवल द्विप्रभावी गिनता है।)",
        mr: "नऊ दोन्ही प्रभावी लक्षणे दाखवतात आणि सहा त्या दोघांपैकी एक, म्हणून 9 + 6 = 15, आणि केवळ एकटी द्विअप्रभावी वनस्पती एकही दाखवत नाही. गणित सोपे आहे; गाभा त्याचा अर्थ काय हे पाहणे. माहिती दुर्मीळ वर्ग वाहतात. सोळांतली ती एकटी वनस्पतीच अशी आहे जिचा जनुकप्ररूप तिच्या रूपावरून थेट वाचता येतो, आणि तोच वर्ग लहान प्रयोगात सर्वांत सहज हरवतोही — सोळा वनस्पतींत योगायोगाने एकही मिळणार नाही, आणि नेमके म्हणूनच मेंडेलने हजारो मोजल्या. ज्या गुणोत्तराला दुसऱ्या गुणोत्तरापासून वेगळे सांगण्यास एखादा दुर्मीळ वर्ग लागतो त्यावर भरवसा ठेवायला मोठा नमुना लागतो. (9 केवळ द्विप्रभावी मोजते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Two genes lie on the same chromosome and recombinants make up 12 per cent of the offspring of a test cross. What is the distance between them in map units?",
        hi: "दो जीन एक ही गुणसूत्र पर हैं और परीक्षण संकरण की संतति में पुनर्संयोजी 12 प्रतिशत हैं। उनके बीच की दूरी मानचित्र इकाइयों में कितनी है?",
        mr: "दोन जनुके एकाच गुणसूत्रावर आहेत आणि चाचणी संकरणाच्या संततीत पुनर्संयोजी 12 टक्के आहेत. त्यांच्यातले अंतर नकाशा एककांत किती?",
      },
      answer: 12,
      wrong: [24, 6, 88],
      checkExpr: "6*2",
      solution: {
        en: "6 × 2 = 12 map units, because one map unit is defined as one per cent recombination. The definition looks circular until you see what it is doing. Two genes on the same chromosome tend to be inherited together, so independent assortment fails and the test-cross ratio is not one to one to one to one. The departure is not a nuisance: crossing over between the two genes separates them, and the chance of a crossover falling between them rises with the distance separating them. So the recombinant frequency measures a physical distance — and a genuinely broken rule has been converted into a measuring instrument. Two limits are worth knowing. The relationship stops being linear over long distances, because a second crossover restores the original combination and the recombinants are undercounted; and above about fifty per cent the genes assort as though unlinked, so genes at opposite ends of one chromosome are indistinguishable from genes on different chromosomes by this test alone. (24 doubles the percentage.)",
        hi: "6 × 2 = 12 मानचित्र इकाइयाँ, क्योंकि एक मानचित्र इकाई की परिभाषा एक प्रतिशत पुनर्संयोजन है। परिभाषा तब तक चक्रीय लगती है जब तक यह न दिखे कि वह कर क्या रही है। एक ही गुणसूत्र पर के दो जीन साथ वंशागत होने की प्रवृत्ति रखते हैं, अतः स्वतंत्र अपव्यूहन विफल हो जाता है और परीक्षण संकरण का अनुपात एक, एक, एक, एक नहीं रहता। यह विचलन उपद्रव नहीं: दोनों जीनों के बीच का विनिमय उन्हें अलग करता है, और उनके बीच विनिमय पड़ने की संभावना उन्हें अलग करती दूरी के साथ बढ़ती है। अतः पुनर्संयोजी बारंबारता एक भौतिक दूरी नापती है — और एक वस्तुतः टूटा नियम मापक यंत्र में बदल दिया गया है। दो सीमाएँ जानने लायक़ हैं। संबंध लंबी दूरियों पर रैखिक नहीं रहता, क्योंकि दूसरा विनिमय मूल संयोजन बहाल कर देता है और पुनर्संयोजी कम गिने जाते हैं; और लगभग पचास प्रतिशत से ऊपर जीन ऐसे छँटते हैं मानो असहलग्न हों, अतः एक ही गुणसूत्र के विपरीत सिरों के जीन अकेले इस परीक्षण से भिन्न गुणसूत्रों के जीनों से अलग नहीं पहचाने जा सकते। (24 प्रतिशत को दुगुना कर देता है।)",
        mr: "6 × 2 = 12 नकाशा एकके, कारण एका नकाशा एककाची व्याख्या एक टक्का पुनर्संयोजन आहे. व्याख्या तोवर वर्तुळाकार वाटते जोवर ती काय करत आहे हे दिसत नाही. एकाच गुणसूत्रावरची दोन जनुके सोबत आनुवंशिक होण्याची प्रवृत्ती ठेवतात, म्हणून स्वतंत्र अपव्यूहन अपयशी ठरते आणि चाचणी संकरणाचे गुणोत्तर एक, एक, एक, एक राहत नाही. हे विचलन उपद्रव नाही: दोन्ही जनुकांमधली अदलाबदल त्यांना वेगळे करते, आणि त्यांच्यामध्ये अदलाबदल पडण्याची शक्यता त्यांना वेगळे करणाऱ्या अंतरासोबत वाढते. म्हणून पुनर्संयोजी वारंवारता एक भौतिक अंतर मोजते — आणि एक खरोखर मोडलेला नियम मापक यंत्रात बदलला गेला आहे. दोन मर्यादा जाणण्याजोग्या आहेत. नाते लांब अंतरांवर रेषीय राहत नाही, कारण दुसरी अदलाबदल मूळ संयोजन पुनर्स्थापित करते आणि पुनर्संयोजी कमी मोजले जातात; आणि सुमारे पन्नास टक्क्यांच्या वर जनुके अशी विभागली जातात जणू असहलग्न असावीत, म्हणून एकाच गुणसूत्राच्या विरुद्ध टोकांची जनुके एकट्या या चाचणीने वेगळ्या गुणसूत्रांच्या जनुकांपासून वेगळी ओळखता येत नाहीत. (24 टक्केवारी दुप्पट करते.)",
      },
    },
  ],
  "biology-12-molecular-basis-of-inheritance": [
    {
      level: 1,
      stem: {
        en: "How many kinds of nitrogenous base are found in DNA?",
        hi: "DNA में कितनी क़िस्म के नाइट्रोजनी क्षार मिलते हैं?",
        mr: "DNA मध्ये किती प्रकारची नायट्रोजनी क्षारे आढळतात?",
      },
      answer: 4,
      wrong: [2, 5, 20],
      checkExpr: "2*2",
      solution: {
        en: "2 × 2 = 4: two purines, adenine and guanine, and two pyrimidines, thymine and cytosine. RNA has four as well, but uracil takes the place of thymine, so a molecule can be identified as one or the other by which of those two it carries. (2 counts the two classes rather than the four bases.)",
        hi: "2 × 2 = 4: दो प्यूरीन, ऐडेनीन और ग्वानीन, तथा दो पिरिमिडीन, थाइमीन और साइटोसीन। RNA में भी चार हैं, पर थाइमीन की जगह यूरैसिल ले लेता है, अतः कोई अणु इनमें से कौन-सा ढोता है इससे उसे एक या दूसरा पहचाना जा सकता है। (2 चार क्षारों के बजाय दो वर्ग गिनता है।)",
        mr: "2 × 2 = 4: दोन प्युरीन, अ‍ॅडेनिन आणि ग्वानिन, आणि दोन पिरिमिडीन, थायमिन आणि सायटोसिन. RNA मध्येही चार आहेत, पण थायमिनची जागा युरॅसिल घेते, म्हणून एखादा रेणू यांपैकी कोणते वाहतो यावरून त्याला एक वा दुसरा ओळखता येतो. (2 चार क्षारांऐवजी दोन वर्ग मोजते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "How many bases make up one codon?",
        hi: "एक कोडॉन कितने क्षारों से बनता है?",
        mr: "एक कोडॉन किती क्षारांनी बनतो?",
      },
      answer: 3,
      wrong: [2, 4, 1],
      checkExpr: "1*3",
      solution: {
        en: "1 × 3 = 3. The length is not arbitrary: two bases would give only sixteen combinations, which cannot specify twenty amino acids and a stop signal, while three give sixty-four. Three is the shortest length that suffices, and a longer codon would mean more DNA to store and copy for the same protein. (2 gives the length that was ruled out by counting.)",
        hi: "1 × 3 = 3. लंबाई मनमानी नहीं: दो क्षार केवल सोलह संयोजन देते, जो बीस ऐमीनो अम्ल और एक रुकने का संकेत निर्दिष्ट नहीं कर सकते, जबकि तीन चौंसठ देते हैं। तीन सबसे छोटी पर्याप्त लंबाई है, और लंबे कोडॉन का अर्थ उसी प्रोटीन के लिए अधिक DNA संचित और नक़ल करना होता। (2 वह लंबाई देता है जिसे गिनती ने ख़ारिज किया।)",
        mr: "1 × 3 = 3. लांबी मनमानी नाही: दोन क्षारे केवळ सोळा संयोजने देतील, जी वीस अमिनो आम्ले आणि एक थांबण्याचे संकेत निर्दिष्ट करू शकत नाहीत, तर तीन चौसष्ट देतात. तीन ही सर्वांत लहान पुरेशी लांबी आहे, आणि लांब कोडॉनचा अर्थ त्याच प्रथिनासाठी अधिक DNA साठवणे आणि नक्कल करणे असेल. (2 ती लांबी देते जी मोजणीने नाकारली.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "How many different codons are possible with four bases read three at a time?",
        hi: "चार क्षारों को तीन-तीन करके पढ़ने पर कितने भिन्न कोडॉन संभव हैं?",
        mr: "चार क्षारे तीन-तीन करून वाचल्यास किती वेगळे कोडॉन शक्य आहेत?",
      },
      answer: 64,
      wrong: [12, 16, 20],
      checkExpr: "4*16",
      solution: {
        en: "Four choices at each of three positions: 4 × 16 = 64, that is 4³. Compare the alternatives to see why three won. One base gives 4 meanings and two give 16, neither enough for twenty amino acids plus a stop instruction, and this arithmetic was worked out before the code itself was cracked. The forty-three spare codons are not left unused — every one has a meaning, which is why most amino acids have several codons and a good many mutations turn out to be silent. (12 multiplies rather than raising to a power.)",
        hi: "तीनों स्थानों में से हर एक पर चार विकल्प: 4 × 16 = 64, यानी 4³. यह देखने को कि तीन क्यों जीते, विकल्पों से तुलना करो। एक क्षार 4 अर्थ देता है और दो 16, और कोई भी बीस ऐमीनो अम्लों तथा एक रुकने के निर्देश के लिए काफ़ी नहीं, और यह गणित कूट के खुलने से पहले ही निकाल लिया गया था। तैंतालीस बचे कोडॉन अप्रयुक्त नहीं छोड़े गए — हर एक का अर्थ है, इसीलिए अधिकांश ऐमीनो अम्लों के कई कोडॉन हैं और बहुत से उत्परिवर्तन मौन निकलते हैं। (12 घात लगाने के बजाय गुणा कर देता है।)",
        mr: "तिन्ही जागांपैकी प्रत्येकावर चार पर्याय: 4 × 16 = 64, म्हणजे 4³. तीन का जिंकले हे पाहायला पर्यायांशी तुलना करा. एक क्षार 4 अर्थ देतो आणि दोन 16, आणि कोणतेही वीस अमिनो आम्ले व एक थांबण्याची सूचना यांसाठी पुरेसे नाही, आणि हे गणित संकेत उलगडण्याआधीच काढले गेले होते. त्रेचाळीस उरलेले कोडॉन न वापरता सोडलेले नाहीत — प्रत्येकाला अर्थ आहे, म्हणूनच बहुतांश अमिनो आम्लांना कित्येक कोडॉन आहेत आणि बरीच उत्परिवर्तने मूक निघतात. (12 घात घेण्याऐवजी गुणाकार करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A DNA sample contains 22 per cent cytosine. What percentage is adenine?",
        hi: "किसी DNA नमूने में 22 प्रतिशत साइटोसीन है। ऐडेनीन कितने प्रतिशत है?",
        mr: "एका DNA नमुन्यात 22 टक्के सायटोसिन आहे. अ‍ॅडेनिन किती टक्के आहे?",
      },
      answer: 28,
      wrong: [22, 78, 56],
      checkExpr: "56/2",
      solution: {
        en: "Cytosine pairs with guanine, so guanine is also 22 per cent and the pair together is 44. That leaves 56 per cent shared equally between adenine and thymine: 56/2 = 28 per cent adenine. Every step comes from the pairing rule, and it is worth noticing that Chargaff measured these equalities years before anyone could explain them — a regularity sitting unexplained in a table until the double helix showed it had to be so. (22 assumes all four bases are equally abundant, which no organism requires.)",
        hi: "साइटोसीन ग्वानीन से युग्मित होता है, अतः ग्वानीन भी 22 प्रतिशत है और जोड़ा मिलकर 44. बचे 56 प्रतिशत ऐडेनीन और थाइमीन में बराबर बँटते हैं: 56/2 = 28 प्रतिशत ऐडेनीन। हर क़दम युग्मन नियम से आता है, और ध्यान देने लायक़ है कि शार्गाफ़ ने ये बराबरियाँ किसी के समझा पाने से वर्षों पहले नापी थीं — तालिका में बिना व्याख्या बैठी नियमितता, जब तक द्विकुंडली ने न दिखाया कि ऐसा होना ही था। (22 मान लेता है कि चारों क्षार बराबर प्रचुर हैं, जिसकी किसी जीव को ज़रूरत नहीं।)",
        mr: "सायटोसिन ग्वानिनशी युग्मित होते, म्हणून ग्वानिनही 22 टक्के आहे आणि जोडी मिळून 44. उरलेले 56 टक्के अ‍ॅडेनिन आणि थायमिनमध्ये समान वाटले जातात: 56/2 = 28 टक्के अ‍ॅडेनिन. प्रत्येक पायरी युग्मन नियमातून येते, आणि लक्षात घेण्याजोगे आहे की शारगाफने ही समानता कोणी समजावू शकण्याच्या कित्येक वर्षे आधी मोजली होती — तक्त्यात स्पष्टीकरणाविना बसलेली नियमितता, जोवर द्विकुंडलीने दाखवले नाही की असे असावेच लागते. (22 गृहीत धरते की चारही क्षारे समान विपुल आहेत, जे कोणत्याही जीवाला आवश्यक नाही.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A messenger RNA has 90 bases in its coding region. How many amino acids does it specify?",
        hi: "किसी संदेशवाहक RNA के कूटलेखन क्षेत्र में 90 क्षार हैं। वह कितने ऐमीनो अम्ल निर्दिष्ट करता है?",
        mr: "एका संदेशवाहक RNA च्या संकेतन प्रदेशात 90 क्षारे आहेत. तो किती अमिनो आम्ले निर्दिष्ट करतो?",
      },
      answer: 30,
      wrong: [270, 45, 90],
      checkExpr: "90/3",
      solution: {
        en: "90/3 = 30, since the message is read in non-overlapping triplets. The 'non-overlapping' is doing work in that sentence: if codons overlapped, a sequence of ninety bases would specify far more than thirty amino acids, and a single base change would alter three of them at once. Experiments with induced mutations showed that a single substitution changes one amino acid, which is how the code was established to be non-overlapping. (270 multiplies instead of dividing.)",
        hi: "90/3 = 30, चूँकि संदेश अनतिव्यापी त्रिकों में पढ़ा जाता है। उस वाक्य में 'अनतिव्यापी' काम कर रहा है: यदि कोडॉन अतिव्यापी होते, तो नब्बे क्षारों का अनुक्रम तीस से कहीं अधिक ऐमीनो अम्ल निर्दिष्ट करता, और एक ही क्षार का बदलाव एक साथ तीन को बदल देता। प्रेरित उत्परिवर्तनों के प्रयोगों ने दिखाया कि एक प्रतिस्थापन एक ऐमीनो अम्ल बदलता है, और इसी से कूट अनतिव्यापी सिद्ध हुआ। (270 भाग देने के बजाय गुणा कर देता है।)",
        mr: "90/3 = 30, कारण संदेश अनतिव्यापी त्रिकांत वाचला जातो. त्या वाक्यात 'अनतिव्यापी' काम करत आहे: जर कोडॉन अतिव्यापी असते, तर नव्वद क्षारांचा क्रम तिसांहून कितीतरी अधिक अमिनो आम्ले निर्दिष्ट करेल, आणि एकाच क्षाराचा बदल एकाच वेळी तीन बदलेल. प्रेरित उत्परिवर्तनांच्या प्रयोगांनी दाखवले की एक प्रतिस्थापन एक अमिनो आम्ल बदलते, आणि यानेच संकेत अनतिव्यापी सिद्ध झाला. (270 भागण्याऐवजी गुणाकार करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A DNA molecule replicates semiconservatively. Out of the four strands present after one round of replication, how many are newly made?",
        hi: "कोई DNA अणु अर्धसंरक्षी ढंग से प्रतिकृति करता है। प्रतिकृति के एक दौर के बाद मौजूद चार लड़ियों में से कितनी नई बनी हैं?",
        mr: "एखादा DNA रेणू अर्धसंरक्षी पद्धतीने प्रतिकृती करतो. प्रतिकृतीच्या एका फेरीनंतर उपस्थित चार पदरांपैकी किती नव्याने बनलेले आहेत?",
      },
      answer: 2,
      wrong: [4, 1, 3],
      checkExpr: "4-2",
      solution: {
        en: "4 − 2 = 2 new strands, because the two original strands are both retained, one in each daughter molecule. This is exactly what the density experiment tested. Conservative replication would have kept the parent molecule whole and made two entirely new strands together, giving one heavy molecule and one light one; semiconservative gives two molecules of intermediate density. A single band of intermediate density after one round is what was seen, and it eliminated the conservative scheme on the spot. (4 assumes both strands of each daughter are new.)",
        hi: "4 − 2 = 2 नई लड़ियाँ, क्योंकि दोनों मूल लड़ियाँ बची रहती हैं, हर पुत्री अणु में एक। घनत्व प्रयोग ने ठीक यही परखा। संरक्षी प्रतिकृति जनक अणु को समूचा रखती और दोनों बिलकुल नई लड़ियाँ साथ बनाती, जिससे एक भारी और एक हल्का अणु मिलता; अर्धसंरक्षी मध्यवर्ती घनत्व के दो अणु देती है। एक दौर के बाद मध्यवर्ती घनत्व की एक अकेली पट्टी ही दिखी, और उसने संरक्षी योजना को वहीं ख़ारिज कर दिया। (4 मान लेता है कि हर पुत्री की दोनों लड़ियाँ नई हैं।)",
        mr: "4 − 2 = 2 नवे पदर, कारण दोन्ही मूळ पदर टिकतात, प्रत्येक कन्या रेणूत एक. घनता प्रयोगाने नेमके हेच तपासले. संरक्षी प्रतिकृती जनक रेणू अख्खा ठेवेल आणि दोन्ही पूर्णपणे नवे पदर एकत्र बनवेल, ज्याने एक जड आणि एक हलका रेणू मिळेल; अर्धसंरक्षी मध्यवर्ती घनतेचे दोन रेणू देते. एका फेरीनंतर मध्यवर्ती घनतेची एकच पट्टी दिसली, आणि तिने संरक्षी योजना तिथेच नाकारली. (4 गृहीत धरते की प्रत्येक कन्येचे दोन्ही पदर नवे आहेत.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Starting from one DNA molecule, how many molecules are present after three rounds of replication?",
        hi: "एक DNA अणु से शुरू करके प्रतिकृति के तीन दौर के बाद कितने अणु मौजूद हैं?",
        mr: "एका DNA रेणूपासून सुरुवात करून प्रतिकृतीच्या तीन फेऱ्यांनंतर किती रेणू उपस्थित आहेत?",
      },
      answer: 8,
      wrong: [6, 4, 3],
      checkExpr: "2*4",
      solution: {
        en: "Each round doubles the number: 2 × 4 = 8, that is 2³. Now ask how many of those eight still contain an original strand. Only two do, because there were only two original strands to begin with and each one has stayed intact in some molecule. So the proportion carrying original material falls as 2/2ⁿ while the total rises as 2ⁿ, which is exactly the pattern the density experiment tracked from one generation to the next. (6 adds two per round instead of doubling.)",
        hi: "हर दौर संख्या दुगुनी करता है: 2 × 4 = 8, यानी 2³. अब पूछो कि उन आठ में से कितनों में अब भी मूल लड़ी है। केवल दो में, क्योंकि शुरू में मूल लड़ियाँ केवल दो ही थीं और हर एक किसी न किसी अणु में सलामत रही है। अतः मूल सामग्री ढोते अणुओं का अनुपात 2/2ⁿ की तरह गिरता है जबकि कुल 2ⁿ की तरह बढ़ता है, और घनत्व प्रयोग ने एक पीढ़ी से अगली तक ठीक यही प्रतिरूप पकड़ा। (6 दुगुना करने के बजाय हर दौर दो जोड़ देता है।)",
        mr: "प्रत्येक फेरी संख्या दुप्पट करते: 2 × 4 = 8, म्हणजे 2³. आता विचारा की त्या आठांपैकी कितींत अजून मूळ पदर आहे. केवळ दोहोंत, कारण सुरुवातीला मूळ पदर केवळ दोनच होते आणि प्रत्येक कोणत्या ना कोणत्या रेणूत शाबूत राहिला आहे. म्हणून मूळ सामग्री वाहणाऱ्या रेणूंचे प्रमाण 2/2ⁿ प्रमाणे घसरते तर एकूण 2ⁿ प्रमाणे वाढते, आणि घनता प्रयोगाने एका पिढीपासून पुढच्यापर्यंत नेमका हाच नमुना पकडला. (6 दुप्पट करण्याऐवजी प्रत्येक फेरीत दोन जोडते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "How many hydrogen bonds hold a guanine–cytosine pair together?",
        hi: "ग्वानीन–साइटोसीन युग्म को कितने हाइड्रोजन बंध साथ थामते हैं?",
        mr: "ग्वानिन–सायटोसिन जोडीला किती हायड्रोजन बंध एकत्र धरतात?",
      },
      answer: 3,
      wrong: [2, 1, 6],
      checkExpr: "2+1",
      solution: {
        en: "2 + 1 = 3, one more than the two holding adenine to thymine. The difference has a measurable consequence: a region rich in G–C pairs takes more energy to pull apart, so DNA with a high proportion of them melts at a higher temperature, and organisms living in hot springs tend to have G-C-rich genomes. The pairing itself is fixed by where each base can donate or accept a hydrogen bond, and by size — a larger purine always facing a smaller pyrimidine, which is what keeps the helix a constant width. (2 gives the adenine–thymine count.)",
        hi: "2 + 1 = 3, ऐडेनीन को थाइमीन से थामते दो से एक अधिक। इस अंतर का नापने योग्य परिणाम है: G–C युग्मों से समृद्ध क्षेत्र को खींचकर अलग करने में अधिक ऊर्जा लगती है, अतः जिस DNA में उनका अनुपात अधिक है वह ऊँचे ताप पर पिघलता है, और गर्म झरनों में रहते जीवों के जीनोम G-C समृद्ध होते हैं। युग्मन स्वयं इससे तय है कि हर क्षार कहाँ हाइड्रोजन बंध दे या ले सकता है, और आकार से — बड़ा प्यूरीन हमेशा छोटे पिरिमिडीन के सामने, और यही कुंडली की चौड़ाई एक-सी रखता है। (2 ऐडेनीन–थाइमीन की गिनती देता है।)",
        mr: "2 + 1 = 3, अ‍ॅडेनिनला थायमिनशी धरणाऱ्या दोघांहून एक अधिक. या फरकाचा मोजण्याजोगा परिणाम आहे: G–C जोड्यांनी समृद्ध प्रदेश ओढून वेगळा करण्यास अधिक ऊर्जा लागते, म्हणून ज्या DNA मध्ये त्यांचे प्रमाण अधिक आहे तो उच्च तापमानावर वितळतो, आणि गरम झऱ्यांत राहणाऱ्या जीवांचे जीनोम G-C समृद्ध असतात. युग्मन स्वतः यावरून ठरते की प्रत्येक क्षार कुठे हायड्रोजन बंध देऊ वा घेऊ शकते, आणि आकारावरून — मोठे प्युरीन नेहमी लहान पिरिमिडीनसमोर, आणि हेच कुंडलीची रुंदी सारखी ठेवते. (2 अ‍ॅडेनिन–थायमिनची मोजणी देते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Starting from cells whose DNA is entirely heavy, how many of the sixteen molecules present after four rounds of replication in light medium still contain a heavy strand?",
        hi: "ऐसी कोशिकाओं से शुरू करके जिनका DNA पूरी तरह भारी है, हल्के माध्यम में प्रतिकृति के चार दौर के बाद मौजूद सोलह अणुओं में से कितनों में अब भी भारी लड़ी है?",
        mr: "ज्यांचा DNA पूर्णपणे जड आहे अशा पेशींपासून सुरुवात करून, हलक्या माध्यमात प्रतिकृतीच्या चार फेऱ्यांनंतर उपस्थित सोळा रेणूंपैकी कितींत अजून जड पदर आहे?",
      },
      answer: 2,
      wrong: [8, 4, 16],
      checkExpr: "4-2",
      solution: {
        en: "4 − 2 = 2. The reasoning is worth doing carefully because the answer surprises people. The original molecule had exactly two heavy strands, and semiconservative replication never destroys a strand — it only pairs each one with a new partner. So after any number of rounds there are still exactly two heavy strands in existence, sitting in two molecules, however large the population has grown. After four rounds there are 2⁴ = 16 molecules, of which 2 are hybrid and 14 are entirely light. That falling proportion is precisely what the density experiment watched: the intermediate band never disappears but grows fainter relative to the light band with every generation, which is a signature no other scheme produces. Conservative replication would keep one wholly heavy molecule for ever; dispersive would leave no distinct band at all. (8 halves the total instead of counting the surviving strands.)",
        hi: "4 − 2 = 2. तर्क ध्यान से करना चाहिए क्योंकि उत्तर लोगों को चौंकाता है। मूल अणु में ठीक दो भारी लड़ियाँ थीं, और अर्धसंरक्षी प्रतिकृति कभी कोई लड़ी नष्ट नहीं करती — वह केवल हर एक को नए साथी से जोड़ती है। अतः कितने भी दौर के बाद ठीक दो भारी लड़ियाँ अब भी मौजूद हैं, दो अणुओं में बैठी, आबादी चाहे कितनी भी बढ़ जाए। चार दौर के बाद 2⁴ = 16 अणु हैं, जिनमें 2 संकर और 14 पूरी तरह हल्के हैं। यही गिरता अनुपात घनत्व प्रयोग ने देखा: मध्यवर्ती पट्टी कभी ग़ायब नहीं होती पर हर पीढ़ी के साथ हल्की पट्टी के मुक़ाबले मंद पड़ती जाती है, और यह ऐसा हस्ताक्षर है जो कोई दूसरी योजना नहीं देती। संरक्षी प्रतिकृति एक पूरी तरह भारी अणु हमेशा के लिए रखती; विक्षेपी कोई अलग पट्टी छोड़ती ही नहीं। (8 बची लड़ियाँ गिनने के बजाय कुल को आधा कर देता है।)",
        mr: "4 − 2 = 2. युक्तिवाद काळजीपूर्वक करण्याजोगा आहे कारण उत्तर लोकांना चकित करते. मूळ रेणूत नेमके दोन जड पदर होते, आणि अर्धसंरक्षी प्रतिकृती कधीही कोणताही पदर नष्ट करत नाही — ती केवळ प्रत्येकाला नव्या जोडीदाराशी जोडते. म्हणून कितीही फेऱ्यांनंतर नेमके दोन जड पदर अजूनही अस्तित्वात आहेत, दोन रेणूंत बसलेले, लोकसंख्या कितीही वाढो. चार फेऱ्यांनंतर 2⁴ = 16 रेणू आहेत, ज्यांपैकी 2 संकर आणि 14 पूर्णपणे हलके आहेत. हेच घसरणारे प्रमाण घनता प्रयोगाने पाहिले: मध्यवर्ती पट्टी कधीही नाहीशी होत नाही पण प्रत्येक पिढीसोबत हलक्या पट्टीच्या तुलनेत मंद होत जाते, आणि ही अशी सही आहे जी कोणतीही दुसरी योजना देत नाही. संरक्षी प्रतिकृती एक पूर्णपणे जड रेणू कायमचा ठेवेल; विक्षेपी कोणतीही वेगळी पट्टी सोडणारच नाही. (8 उरलेले पदर मोजण्याऐवजी एकूण निम्मे करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Of the 64 codons, 3 are stop signals and the rest specify 20 amino acids. How many codons are left over once each amino acid has been given one?",
        hi: "64 कोडॉन में से 3 रुकने के संकेत हैं और बाक़ी 20 ऐमीनो अम्ल निर्दिष्ट करते हैं। हर ऐमीनो अम्ल को एक-एक दे देने के बाद कितने कोडॉन बचते हैं?",
        mr: "64 कोडॉनांपैकी 3 थांबण्याची संकेते आहेत आणि बाकीचे 20 अमिनो आम्ले निर्दिष्ट करतात. प्रत्येक अमिनो आम्लाला एकेक दिल्यानंतर किती कोडॉन उरतात?",
      },
      answer: 41,
      wrong: [44, 61, 20],
      checkExpr: "61-20",
      solution: {
        en: "61 codons specify amino acids, and giving one to each of the twenty leaves 61 − 20 = 41 spare. What happens to those forty-one is the substance of the chapter. They are not discarded — every codon has a meaning — so most amino acids end up with several, leucine, serine and arginine with six each, while methionine and tryptophan keep just one. And the synonyms are not scattered at random: they usually share their first two bases and differ only in the third, so GGA, GGC, GGG and GGU all specify glycine. Three consequences follow. A change in the third base of such a codon is silent, which makes a large share of random substitutions harmless. The code is also arranged so that codons differing by one base often specify chemically similar amino acids, so a mutation that does show tends to be a mild substitution rather than a drastic one. And the looser pairing permitted at that third position means fewer than sixty-four tRNAs are needed. Redundancy in a code is what makes it tolerant of error, exactly as a checksum is — the surplus is not slack in the design but the design absorbing the mutations a replicating molecule is bound to accumulate. (44 forgets to remove the three stop codons before subtracting.)",
        hi: "61 कोडॉन ऐमीनो अम्ल निर्दिष्ट करते हैं, और बीसों में से हर एक को एक दे देने पर 61 − 20 = 41 बचते हैं। उन इकतालीस का क्या होता है यही अध्याय का सार है। वे फेंके नहीं जाते — हर कोडॉन का अर्थ है — अतः अधिकांश ऐमीनो अम्लों के पास कई हो जाते हैं, ल्यूसीन, सेरीन और आर्जिनीन के छह-छह, जबकि मेथियोनीन और ट्रिप्टोफ़ैन के पास केवल एक रहता है। और समानार्थी बेतरतीब बिखरे नहीं हैं: वे प्रायः अपने पहले दो क्षार साझा करते हैं और केवल तीसरे में भिन्न होते हैं, अतः GGA, GGC, GGG और GGU सब ग्लाइसीन निर्दिष्ट करते हैं। तीन परिणाम निकलते हैं। ऐसे कोडॉन के तीसरे क्षार में बदलाव मौन है, जिससे बेतरतीब प्रतिस्थापनों का बड़ा हिस्सा हानिरहित हो जाता है। कूट ऐसे भी जमा है कि एक क्षार में भिन्न कोडॉन प्रायः रासायनिक रूप से समान ऐमीनो अम्ल निर्दिष्ट करते हैं, अतः जो उत्परिवर्तन दिखता भी है वह प्रायः कठोर नहीं बल्कि हल्का प्रतिस्थापन होता है। और उसी तीसरे स्थान पर छूट वाले युग्मन का अर्थ है कि चौंसठ से कम tRNA चाहिए। किसी कूट का आधिक्य ही उसे ग़लती सहनशील बनाता है, ठीक जैसे जाँच अंक — अतिरेक रचना की ढील नहीं बल्कि रचना का उन उत्परिवर्तनों को सोख लेना है जो प्रतिकृति करते अणु में जमा होने ही हैं। (44 घटाने से पहले तीन रुकने वाले कोडॉन हटाना भूल जाता है।)",
        mr: "61 कोडॉन अमिनो आम्ले निर्दिष्ट करतात, आणि विसांपैकी प्रत्येकाला एक दिल्यावर 61 − 20 = 41 उरतात. त्या एकेचाळिसांचे काय होते हाच प्रकरणाचा सार आहे. ते फेकले जात नाहीत — प्रत्येक कोडॉनला अर्थ आहे — म्हणून बहुतांश अमिनो आम्लांकडे कित्येक येतात, ल्युसिन, सेरिन आणि आर्जिनिनकडे सहा-सहा, तर मिथिओनिन आणि ट्रिप्टोफॅनकडे केवळ एक राहतो. आणि समानार्थी यादृच्छिक विखुरलेले नाहीत: ते बहुधा आपली पहिली दोन क्षारे समाईक ठेवतात आणि केवळ तिसऱ्यात वेगळे असतात, म्हणून GGA, GGC, GGG आणि GGU सर्व ग्लायसिन निर्दिष्ट करतात. तीन परिणाम निघतात. अशा कोडॉनच्या तिसऱ्या क्षारातील बदल मूक आहे, ज्याने यादृच्छिक प्रतिस्थापनांचा मोठा हिस्सा निरुपद्रवी होतो. संकेत असाही मांडला आहे की एका क्षारात वेगळे कोडॉन बहुधा रासायनिकदृष्ट्या सारखी अमिनो आम्ले निर्दिष्ट करतात, म्हणून जे उत्परिवर्तन दिसतेही ते बहुधा तीव्र नव्हे तर सौम्य प्रतिस्थापन असते. आणि त्याच तिसऱ्या जागी परवानगी असलेल्या सैल युग्मनाचा अर्थ चौसष्टहून कमी tRNA लागतात. एखाद्या संकेताचे आधिक्यच त्याला चूकसहिष्णू बनवते, नेमके जसे तपासणी अंक — अतिरिक्तता रचनेतली ढील नसून रचनेने त्या उत्परिवर्तनांना शोषून घेणे आहे जी प्रतिकृती करणाऱ्या रेणूत जमणारच आहेत. (44 वजा करण्याआधी तीन थांबण्याचे कोडॉन काढायला विसरते.)",
      },
    },
  ],
};
