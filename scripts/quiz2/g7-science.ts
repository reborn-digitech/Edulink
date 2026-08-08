/**
 * Class 7 Science — NCERT, chapter by chapter, through the conceptual
 * engine. The experimenter's voice grows a notebook: leaves tested with
 * iodine, spoons racing in hot dal, litmus changing its mind. Same
 * distractor rule as everywhere — every statement must be false of every
 * other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Science (Class 7)";
const LICENCE = "CC-BY-SA-4.0";

export const G7_SCIENCE: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Nutrition in Plants (the leaf's kitchen and its freeloaders)*/
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-7-nutrition-in-plants",
    subject: "SCIENCE",
    classLevel: 7,
    chapter: {
      en: "Chapter 1 — Nutrition in Plants",
      hi: "अध्याय 1 — पादपों में पोषण",
      mr: "प्रकरण 1 — वनस्पतींतील पोषण",
    },
    name: { en: "Nutrition in Plants", hi: "पादपों में पोषण", mr: "वनस्पतींतील पोषण" },
    summary: {
      en: "The leaf's kitchen: chlorophyll catching light, stomata breathing, iodine writing the lab report — and the freeloaders, hunters and partners who eat without cooking.",
      hi: "पत्ती की रसोई: रोशनी पकड़ता क्लोरोफ़िल, साँस लेते रंध्र, प्रयोग की रिपोर्ट लिखती आयोडीन — और वे मुफ़्तख़ोर, शिकारी और साझेदार जो बिना पकाए खाते हैं।",
      mr: "पानाचे स्वयंपाकघर: प्रकाश पकडणारे हरितद्रव्य, श्वास घेणारी पर्णरंध्रे, प्रयोगाचा अहवाल लिहिणारे आयोडीन — आणि न शिजवता खाणारे फुकटे, शिकारी आणि भागीदार.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "photosynthesis",
        name: { en: "Photosynthesis", hi: "प्रकाश-संश्लेषण", mr: "प्रकाशसंश्लेषण" },
        kind: "process",
        prompt: {
          en: "Leaves take sunlight, water and carbon dioxide and cook food from them. What is this process called?",
          hi: "पत्तियाँ धूप, पानी और कार्बन डाइऑक्साइड लेकर उनसे भोजन पकाती हैं। इस प्रक्रिया का नाम क्या है?",
          mr: "पाने सूर्यप्रकाश, पाणी आणि कार्बन डायऑक्साइड घेऊन त्यांतून अन्न शिजवतात. या प्रक्रियेचे नाव काय?",
        },
        statement: {
          en: "Photosynthesis is the leaf's cooking: sunlight, water and carbon dioxide go in; starch and oxygen come out.",
          hi: "प्रकाश-संश्लेषण पत्ती की रसोई है: धूप, पानी और कार्बन डाइऑक्साइड भीतर जाते हैं; माँड और ऑक्सीजन बाहर आते हैं।",
          mr: "प्रकाशसंश्लेषण म्हणजे पानाचा स्वयंपाक: सूर्यप्रकाश, पाणी आणि कार्बन डायऑक्साइड आत जातात; सत्त्व आणि ऑक्सिजन बाहेर येतात.",
        },
        detail: {
          en: "Boil a leaf soft, wash out its green with spirit, add iodine — blue-black appears only where light had fallen: the leaf files its own lab report.",
          hi: "पत्ती उबालिए, स्पिरिट से उसका हरापन धो दीजिए, आयोडीन डालिए — नीला-काला वहीं उभरता है जहाँ रोशनी पड़ी थी: पत्ती अपनी प्रयोग-रिपोर्ट ख़ुद दर्ज करती है।",
          mr: "पान उकळा, स्पिरिटने त्याचा हिरवेपणा धुवा, आयोडीन टाका — निळे-काळे तिथेच उमटते जिथे प्रकाश पडला होता: पान आपला प्रयोग-अहवाल स्वतः नोंदवते.",
        },
        extra: {
          en: "Every meal on Earth traces back to it — even the tiger's, three steps removed.",
          hi: "धरती का हर भोजन इसी तक लौटता है — बाघ का भी, तीन क़दम घूमकर।",
          mr: "पृथ्वीवरचे प्रत्येक जेवण याच्याकडेच परत जाते — वाघाचेही, तीन पावले फिरून.",
        },
        pair: {
          left: { en: "The leaf in sunlight", hi: "धूप में पत्ती", mr: "उन्हातले पान" },
          right: { en: "starch by evening", hi: "शाम तक माँड", mr: "संध्याकाळपर्यंत सत्त्व" },
        },
      },
      {
        id: "chlorophyll",
        name: { en: "Chlorophyll", hi: "क्लोरोफ़िल (पर्णहरित)", mr: "हरितद्रव्य" },
        kind: "part",
        prompt: {
          en: "Which green pigment in the leaf catches sunlight for the food-making — no green, no cooking?",
          hi: "पत्ती का कौन-सा हरा वर्णक भोजन बनाने के लिए धूप पकड़ता है — हरा नहीं तो रसोई नहीं?",
          mr: "पानातले कोणते हिरवे रंगद्रव्य अन्न बनवण्यासाठी सूर्यप्रकाश पकडते — हिरवे नाही तर स्वयंपाक नाही?",
        },
        statement: {
          en: "Chlorophyll is the green pigment that traps sunlight — the one worker every leaf-kitchen must employ.",
          hi: "क्लोरोफ़िल वह हरा वर्णक है जो धूप को क़ैद करता है — हर पत्ती-रसोई का अनिवार्य कारीगर।",
          mr: "हरितद्रव्य हे सूर्यप्रकाश पकडणारे हिरवे रंगद्रव्य — प्रत्येक पान-स्वयंपाकघराचा अनिवार्य कारागीर.",
        },
        pair: {
          left: { en: "Chlorophyll", hi: "क्लोरोफ़िल", mr: "हरितद्रव्य" },
          right: { en: "the sunlight-catcher", hi: "धूप पकड़ने वाला", mr: "सूर्यप्रकाश पकडणारा" },
        },
      },
      {
        id: "stomata",
        name: { en: "Stomata", hi: "रंध्र (स्टोमेटा)", mr: "पर्णरंध्रे" },
        kind: "part",
        prompt: {
          en: "Which tiny pores, mostly on the leaf's underside, let carbon dioxide in and water vapour out?",
          hi: "कौन-से नन्हे छिद्र, प्रायः पत्ती की निचली सतह पर, कार्बन डाइऑक्साइड को भीतर और जलवाष्प को बाहर जाने देते हैं?",
          mr: "कोणती इवली छिद्रे, बहुधा पानाच्या खालच्या बाजूला, कार्बन डायऑक्साइडला आत आणि बाष्पाला बाहेर जाऊ देतात?",
        },
        statement: {
          en: "Stomata are the leaf's doorways — carbon dioxide walks in and water vapour walks out through them.",
          hi: "रंध्र पत्ती के दरवाज़े हैं — कार्बन डाइऑक्साइड उनसे भीतर आती है और जलवाष्प बाहर जाती है।",
          mr: "पर्णरंध्रे ही पानाची दारे — कार्बन डायऑक्साइड त्यांतून आत येतो आणि बाष्प बाहेर जाते.",
        },
        detail: {
          en: "Each pore is fenced by two guard cells that swell to open it and slacken to shut it — doorkeepers who work by changing shape.",
          hi: "हर छिद्र के पहरे पर दो रक्षक कोशिकाएँ हैं जो फूलकर उसे खोलती और ढीली पड़कर बंद करती हैं — आकार बदलकर काम करते दरबान।",
          mr: "प्रत्येक छिद्राच्या पहाऱ्यावर दोन रक्षक पेशी — फुगून ते उघडतात आणि सैलावून मिटवतात: आकार बदलून काम करणारे द्वारपाल.",
        },
        extra: {
          en: "Most sit on the shaded underside, away from the drying sun — position is part of their design.",
          hi: "अधिकांश छाँह वाली निचली सतह पर बैठते हैं, सुखाती धूप से दूर — स्थान भी उनकी बनावट का हिस्सा है।",
          mr: "बहुतेक सावलीच्या खालच्या बाजूला बसतात, सुकवणाऱ्या उन्हापासून दूर — जागाही त्यांच्या रचनेचा भाग.",
        },
        pair: {
          left: { en: "Stomata", hi: "रंध्र", mr: "पर्णरंध्रे" },
          right: { en: "the leaf's doorways", hi: "पत्ती के दरवाज़े", mr: "पानाची दारे" },
        },
      },
      {
        id: "cuscuta",
        name: { en: "Cuscuta (amarbel)", hi: "अमरबेल (कस्कुटा)", mr: "अमरवेल (कस्कुटा)" },
        kind: "feeder",
        prompt: {
          en: "Which golden, leafless twiner sinks suckers into a host tree and drinks its readymade food?",
          hi: "कौन-सी सुनहरी, बिना पत्तों की बेल मेज़बान पेड़ में चूषक धँसाकर उसका बना-बनाया भोजन पीती है?",
          mr: "कोणती सोनेरी, पानेविरहित वेल यजमान झाडात शोषक रुतवून त्याचे तयार अन्न पिते?",
        },
        statement: {
          en: "Cuscuta is a parasite — leafless and yellow, it steals cooked food through suckers pushed into its host.",
          hi: "अमरबेल परजीवी है — बिना पत्तों की, पीली; मेज़बान में धँसे चूषकों से पका भोजन चुराती है।",
          mr: "अमरवेल परजीवी आहे — पानेविरहित, पिवळी; यजमानात रुतलेल्या शोषकांतून शिजलेले अन्न चोरते.",
        },
        pair: {
          left: { en: "The yellow twiner", hi: "पीली बेल", mr: "पिवळी वेल" },
          right: {
            en: "suckers into a host",
            hi: "मेज़बान में धँसे चूषक",
            mr: "यजमानात रुतलेले शोषक",
          },
        },
      },
      {
        id: "pitcher",
        name: { en: "The pitcher plant", hi: "घटपर्णी (पिचर पौधा)", mr: "घटपर्णी वनस्पती" },
        kind: "feeder",
        prompt: {
          en: "Which plant tips insects into a slippery jug of a leaf and digests them for the nitrogen its swampy soil lacks?",
          hi: "कौन-सा पौधा कीड़ों को पत्ती के फिसलन भरे घड़े में गिराकर पचा लेता है — उस नाइट्रोजन के लिए जो उसकी दलदली मिट्टी में नहीं है?",
          mr: "कोणती वनस्पती किड्यांना पानाच्या निसरड्या घड्यात पाडून पचवते — तिच्या दलदलीच्या मातीत नसलेल्या नायट्रोजनसाठी?",
        },
        statement: {
          en: "The pitcher plant traps insects in a jug-shaped leaf — its soil is poor in nitrogen, so it hunts for the missing mineral.",
          hi: "घटपर्णी कीड़ों को घड़े जैसी पत्ती में फँसाती है — उसकी मिट्टी में नाइट्रोजन कम है, अतः वह छूटे खनिज का शिकार करती है।",
          mr: "घटपर्णी किड्यांना घड्यासारख्या पानात अडकवते — तिच्या मातीत नायट्रोजन कमी, म्हणून ती हरवलेल्या खनिजाची शिकार करते.",
        },
        detail: {
          en: "The jug IS a modified leaf: a lid keeps rain out, downward-pointing hairs keep the prey in.",
          hi: "घड़ा स्वयं रूपांतरित पत्ती है: ढक्कन बारिश रोकता है, नीचे को झुके रोएँ शिकार को भीतर रखते हैं।",
          mr: "घडा स्वतः रूपांतरित पान आहे: झाकण पाऊस अडवते, खाली वळलेले केस भक्ष्याला आत ठेवतात.",
        },
        extra: {
          en: "It still photosynthesizes — insects are its mineral supplement, not its daily bread.",
          hi: "प्रकाश-संश्लेषण वह फिर भी करती है — कीड़े उसका खनिज-पूरक हैं, रोज़ की रोटी नहीं।",
          mr: "प्रकाशसंश्लेषण ती तरीही करते — किडे तिचे खनिज-पूरक, रोजची भाकरी नव्हे.",
        },
        pair: {
          left: { en: "The slippery jug", hi: "फिसलन भरा घड़ा", mr: "निसरडा घडा" },
          right: {
            en: "an insect-hunting leaf",
            hi: "कीट-शिकारी पत्ती",
            mr: "कीटक-शिकारी पान",
          },
        },
      },
      {
        id: "fungi",
        name: { en: "Fungi", hi: "कवक (फफूँद)", mr: "बुरशी (कवक)" },
        kind: "feeder",
        prompt: {
          en: "Which organisms — mushrooms, bread mould — pour digestive juices on dead and rotting matter, then drink the dissolved meal?",
          hi: "कौन-से जीव — कुकुरमुत्ते, रोटी की फफूँद — मरे-सड़े पदार्थ पर पाचक रस उँडेलकर घुला हुआ भोजन पी लेते हैं?",
          mr: "कोणते जीव — अळंबी, भाकरीवरची बुरशी — मृत-कुजलेल्या पदार्थांवर पाचक रस ओतून विरघळलेले जेवण पितात?",
        },
        statement: {
          en: "Fungi are saprotrophs — they digest dead matter OUTSIDE their bodies and absorb the result.",
          hi: "कवक मृतजीवी हैं — वे मृत पदार्थ को अपने शरीर के बाहर पचाते हैं और नतीजा सोख लेते हैं।",
          mr: "बुरशी मृतोपजीवी आहे — ती मृत पदार्थ शरीराबाहेर पचवते आणि निकाल शोषून घेते.",
        },
        detail: {
          en: "They arrive with the rains on damp bread and old leather, sprouting from spores that float everywhere, invisible.",
          hi: "वे बारिश के साथ नम रोटी और पुराने चमड़े पर आ धमकते हैं — हर जगह तैरते अदृश्य बीजाणुओं से उगकर।",
          mr: "ते पावसाबरोबर दमट भाकरीवर आणि जुन्या चामड्यावर अवतरतात — सर्वत्र तरंगणाऱ्या अदृश्य बीजाणूंतून उगवून.",
        },
        extra: {
          en: "The same tribe raises bread, brews antibiotics — and spoils the pickle when it wins.",
          hi: "यही बिरादरी रोटी फुलाती है, एंटीबायोटिक बनाती है — और जीत जाए तो अचार बिगाड़ देती है।",
          mr: "हीच जमात पाव फुगवते, प्रतिजैविके घडवते — आणि जिंकली तर लोणचे बिघडवते.",
        },
        pair: {
          left: { en: "The bread mould", hi: "रोटी की फफूँद", mr: "भाकरीवरची बुरशी" },
          right: {
            en: "a meal already dead",
            hi: "पहले से मरा भोजन",
            mr: "आधीच मृत जेवण",
          },
        },
      },
      {
        id: "lichens",
        name: { en: "Lichens", hi: "शैक (लाइकेन)", mr: "दगडफूल (लायकेन)" },
        kind: "feeder",
        prompt: {
          en: "On tree bark and old walls, an alga and a fungus live as one crust — the alga cooks, the fungus houses. Which organism is this partnership?",
          hi: "पेड़ की छाल और पुरानी दीवारों पर शैवाल और कवक एक पपड़ी बनकर रहते हैं — शैवाल पकाता है, कवक बसेरा देता है। यह साझेदारी कौन-सा जीव है?",
          mr: "झाडाच्या सालीवर आणि जुन्या भिंतींवर शैवाल आणि बुरशी एक पापुद्रा होऊन राहतात — शैवाल शिजवते, बुरशी निवारा देते. ही भागीदारी कोणता जीव?",
        },
        statement: {
          en: "A lichen is symbiosis in a crust: the alga cooks food, the fungus supplies water, minerals and shelter — each feeds the other.",
          hi: "शैक एक पपड़ी में सहजीविता है: शैवाल भोजन पकाता है, कवक पानी, खनिज और छत देता है — दोनों एक-दूसरे को पालते हैं।",
          mr: "दगडफूल म्हणजे पापुद्र्यातली सहजीविता: शैवाल अन्न शिजवते, बुरशी पाणी, खनिजे आणि छप्पर देते — दोघे एकमेकांना पोसतात.",
        },
        pair: {
          left: {
            en: "The alga and the fungus",
            hi: "शैवाल और कवक",
            mr: "शैवाल आणि बुरशी",
          },
          right: {
            en: "food traded for shelter",
            hi: "भोजन के बदले बसेरा",
            mr: "अन्नाच्या बदल्यात निवारा",
          },
        },
      },
      {
        id: "rhizobium",
        name: { en: "Rhizobium", hi: "राइज़ोबियम", mr: "रायझोबियम" },
        kind: "helper",
        prompt: {
          en: "Which bacterium lives in the root nodules of gram and pea, turning the air's nitrogen into plant food?",
          hi: "कौन-सा जीवाणु चने और मटर की जड़-ग्रंथियों में रहकर हवा की नाइट्रोजन को पौधे का भोजन बना देता है?",
          mr: "कोणता जीवाणू हरभरा आणि वाटाण्याच्या मूळ-गाठींत राहून हवेतल्या नायट्रोजनचे वनस्पतीचे अन्न करतो?",
        },
        statement: {
          en: "Rhizobium fixes nitrogen from the air inside the root nodules of pulses — a lodger who pays rent in fertiliser.",
          hi: "राइज़ोबियम दालों की जड़-ग्रंथियों में हवा की नाइट्रोजन स्थिर करता है — ऐसा किरायेदार जो किराया खाद में चुकाता है।",
          mr: "रायझोबियम डाळवर्गीयांच्या मूळ-गाठींत हवेतला नायट्रोजन स्थिर करतो — खतात भाडे देणारा बिऱ्हाडकरू.",
        },
        detail: {
          en: "This is why farmers rotate wheat with gram — the pulse's lodger refills the nitrogen the wheat drew down.",
          hi: "इसीलिए किसान गेहूँ के बाद चना बोते हैं — दाल का किरायेदार वह नाइट्रोजन लौटा देता है जो गेहूँ खींच गया था।",
          mr: "म्हणूनच शेतकरी गव्हानंतर हरभरा पेरतात — डाळीचा बिऱ्हाडकरू गव्हाने ओढलेला नायट्रोजन परत भरतो.",
        },
        extra: {
          en: "The plant houses and feeds the bacterium in return — symbiosis again, this time underground.",
          hi: "बदले में पौधा जीवाणु को घर और भोजन देता है — फिर वही सहजीविता, इस बार ज़मीन के नीचे।",
          mr: "बदल्यात वनस्पती जीवाणूला घर आणि अन्न देते — पुन्हा तीच सहजीविता, यावेळी जमिनीखाली.",
        },
        pair: {
          left: { en: "The root nodule", hi: "जड़ की ग्रंथि", mr: "मुळावरची गाठ" },
          right: {
            en: "a nitrogen factory",
            hi: "नाइट्रोजन का कारख़ाना",
            mr: "नायट्रोजनचा कारखाना",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the feeder to its way of eating: A-Cuscuta, B-bread mould, C-lichen. Which trio is right?",
          hi: "भोजी को उसके खाने के ढंग से मिलाइए: अ-अमरबेल, ब-रोटी की फफूँद, स-शैक। कौन-सी तिकड़ी सही है?",
          mr: "खाणाऱ्याला त्याच्या खाण्याच्या रीतीशी जुळवा: अ-अमरवेल, ब-भाकरीवरची बुरशी, क-दगडफूल. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: parasite · B: saprotroph · C: symbiosis",
            hi: "अ: परजीवी · ब: मृतजीवी · स: सहजीवी",
            mr: "अ: परजीवी · ब: मृतोपजीवी · क: सहजीवी",
          },
          {
            en: "A: saprotroph · B: symbiosis · C: parasite",
            hi: "अ: मृतजीवी · ब: सहजीवी · स: परजीवी",
            mr: "अ: मृतोपजीवी · ब: सहजीवी · क: परजीवी",
          },
          {
            en: "A: symbiosis · B: parasite · C: saprotroph",
            hi: "अ: सहजीवी · ब: परजीवी · स: मृतजीवी",
            mr: "अ: सहजीवी · ब: परजीवी · क: मृतोपजीवी",
          },
          {
            en: "A: parasite · B: symbiosis · C: saprotroph",
            hi: "अ: परजीवी · ब: सहजीवी · स: मृतजीवी",
            mr: "अ: परजीवी · ब: सहजीवी · क: मृतोपजीवी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Cuscuta drinks from the LIVING — parasite. Mould dines on the already dead — saprotroph. The lichen's two members feed each other — symbiosis. The test is always the same: who pays for the meal, and is anyone hurt by it?",
          hi: "अमरबेल जीवित से पीती है — परजीवी। फफूँद मरे हुए पर भोजन करती है — मृतजीवी। शैक के दोनों सदस्य एक-दूसरे को पालते हैं — सहजीवी। कसौटी हमेशा एक: भोजन की क़ीमत कौन चुकाता है, और क्या किसी को चोट पहुँचती है?",
          mr: "अमरवेल जिवंतातून पिते — परजीवी. बुरशी मेलेल्यावर जेवते — मृतोपजीवी. दगडफुलाचे दोघे सदस्य एकमेकांना पोसतात — सहजीवी. कसोटी नेहमी एकच: जेवणाची किंमत कोण देतो, आणि कोणाला इजा होते का?",
        },
      },
      {
        level: 6,
        stem: {
          en: "A potted plant spends a week in a dark cupboard; then a leaf is iodine-tested and shows NO blue-black at all. What does the blank result prove?",
          hi: "गमले का पौधा एक हफ़्ता अँधेरी अलमारी में रहता है; फिर एक पत्ती की आयोडीन-जाँच होती है और कहीं नीला-काला नहीं उभरता। यह कोरा नतीजा क्या सिद्ध करता है?",
          mr: "कुंडीतली वनस्पती आठवडाभर अंधाऱ्या कपाटात राहते; मग एका पानाची आयोडीन-चाचणी होते आणि कुठेही निळे-काळे उमटत नाही. हा कोरा निकाल काय सिद्ध करतो?",
        },
        choices: [
          {
            en: "Without light there was no photosynthesis, and the leaf spent its stored starch — light is a requirement, not a decoration",
            hi: "बिना रोशनी प्रकाश-संश्लेषण नहीं हुआ, और पत्ती ने जमा माँड ख़र्च कर डाला — रोशनी ज़रूरत है, सजावट नहीं",
            mr: "प्रकाशाविना प्रकाशसंश्लेषण झाले नाही, आणि पानाने साठवलेले सत्त्व खर्चले — प्रकाश ही गरज आहे, सजावट नाही",
          },
          {
            en: "The iodine must have been too old to work",
            hi: "आयोडीन ज़रूर इतनी पुरानी होगी कि काम न करे",
            mr: "आयोडीन नक्कीच इतके जुने असेल की चालले नाही",
          },
          {
            en: "Plants make starch only in cupboards with the door open",
            hi: "पौधे माँड केवल खुले दरवाज़े की अलमारियों में बनाते हैं",
            mr: "वनस्पती सत्त्व फक्त उघड्या दाराच्या कपाटांतच बनवतात",
          },
          {
            en: "The soil ran out of starch to send up",
            hi: "मिट्टी में ऊपर भेजने को माँड ख़त्म हो गया",
            mr: "मातीत वर पाठवायला सत्त्व संपले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The cupboard removed exactly one ingredient — light — and food-making stopped; meanwhile the plant lived on its stored starch and emptied the larder. A blank iodine test after a week of darkness is positive evidence: no light, no starch. Starch is MADE in leaves, never mined from soil.",
          hi: "अलमारी ने ठीक एक सामग्री हटाई — रोशनी — और भोजन बनना रुक गया; इस बीच पौधा जमा माँड पर जिया और भंडार ख़ाली कर गया। हफ़्ते भर के अँधेरे के बाद कोरी आयोडीन-जाँच सकारात्मक गवाही है: रोशनी नहीं तो माँड नहीं। माँड पत्तियों में बनता है, मिट्टी से नहीं खुदता।",
          mr: "कपाटाने नेमका एक घटक काढला — प्रकाश — आणि अन्न बनणे थांबले; दरम्यान वनस्पती साठवलेल्या सत्त्वावर जगली आणि कोठार रिकामे केले. आठवडाभराच्या अंधारानंतरची कोरी आयोडीन-चाचणी हा सकारात्मक पुरावा: प्रकाश नाही तर सत्त्व नाही. सत्त्व पानांत बनते, मातीतून उपसले जात नाही.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Nutrition in Animals (the food canal, end to end)           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-7-nutrition-in-animals",
    subject: "SCIENCE",
    classLevel: 7,
    chapter: {
      en: "Chapter 2 — Nutrition in Animals",
      hi: "अध्याय 2 — प्राणियों में पोषण",
      mr: "प्रकरण 2 — प्राण्यांतील पोषण",
    },
    name: { en: "Nutrition in Animals", hi: "प्राणियों में पोषण", mr: "प्राण्यांतील पोषण" },
    summary: {
      en: "The food canal end to end: saliva's first snip, the stomach's acid churn, villi's absorbing fingers — with the cow chewing twice and the amoeba eating with its arms.",
      hi: "आहार-नाल आदि से अंत तक: लार की पहली कैंची, आमाशय का तेज़ाबी मंथन, अवशोषण करती दीर्घरोम-उँगलियाँ — दो बार चबाती गाय और बाहों से खाता अमीबा साथ में।",
      mr: "अन्ननलिका टोकापासून टोकापर्यंत: लाळेची पहिली कात्री, जठराचे आम्ल-घुसळण, शोषण करणारी आंत्रांकुर-बोटे — दोनदा चावणारी गाय आणि हातांनी खाणारा अमिबा सोबत.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "digestion",
        name: { en: "Digestion", hi: "पाचन", mr: "पचन" },
        kind: "process",
        prompt: {
          en: "Complex food must be broken into simple substances the blood can carry. What is this breaking-down called?",
          hi: "जटिल भोजन को उन सरल पदार्थों में तोड़ना पड़ता है जिन्हें रक्त ढो सके। इस तोड़ने का नाम क्या है?",
          mr: "गुंतागुंतीचे अन्न रक्ताला वाहता येतील अशा साध्या पदार्थांत मोडावे लागते. या मोडण्याचे नाव काय?",
        },
        statement: {
          en: "Digestion breaks complex food into simple substances — only the simple forms can cross into blood and feed the body.",
          hi: "पाचन जटिल भोजन को सरल पदार्थों में तोड़ता है — केवल सरल रूप ही रक्त में उतरकर शरीर को पाल सकते हैं।",
          mr: "पचन गुंतागुंतीच्या अन्नाला साध्या पदार्थांत मोडते — फक्त साधी रूपेच रक्तात उतरून शरीराला पोसू शकतात.",
        },
        pair: {
          left: { en: "The digestive journey", hi: "पाचन-यात्रा", mr: "पचन-प्रवास" },
          right: {
            en: "complex made simple",
            hi: "जटिल से सरल",
            mr: "गुंतागुंतीचे साधे केलेले",
          },
        },
      },
      {
        id: "saliva",
        name: { en: "Salivary amylase", hi: "लार का एमाइलेज़", mr: "लाळेतील अमायलेज" },
        kind: "juice",
        prompt: {
          en: "Which enzyme in the mouth's juice begins breaking starch toward sugar while you still chew?",
          hi: "मुँह के रस का कौन-सा एंज़ाइम चबाते-चबाते ही माँड को शक्कर की ओर तोड़ने लगता है?",
          mr: "तोंडातल्या रसातले कोणते विकर चावता-चावताच सत्त्वाला साखरेकडे मोडू लागते?",
        },
        statement: {
          en: "Salivary amylase starts digestion in the mouth itself — it snips starch toward sugar before the first swallow.",
          hi: "लार का एमाइलेज़ पाचन मुँह में ही शुरू कर देता है — वह पहले निगलने से पहले ही माँड को शक्कर की ओर काटता है।",
          mr: "लाळेतील अमायलेज पचन तोंडातच सुरू करते — ते पहिल्या गिळण्याआधीच सत्त्वाला साखरेकडे कापते.",
        },
        detail: {
          en: "That is why a roti chewed long turns faintly sweet with no sugar added — the sweetness is starch surrendering.",
          hi: "इसीलिए देर तक चबाई रोटी बिना शक्कर डाले हल्की मीठी लगती है — वह मिठास माँड का आत्मसमर्पण है।",
          mr: "म्हणूनच खूप वेळ चावलेली पोळी साखर न घालता किंचित गोड लागते — ती गोडी म्हणजे सत्त्वाची शरणागती.",
        },
        extra: {
          en: "Chewing is service to it: smaller pieces give the juice more surface to work on.",
          hi: "चबाना उसकी सेवा है: छोटे टुकड़े रस को काम करने की ज़्यादा सतह देते हैं।",
          mr: "चावणे ही तिची सेवा: लहान तुकडे रसाला काम करायला जास्त पृष्ठभाग देतात.",
        },
        pair: {
          left: { en: "Roti chewed a hundred times", hi: "सौ बार चबाई रोटी", mr: "शंभरदा चावलेली पोळी" },
          right: { en: "a faint sweetness", hi: "हल्की मिठास", mr: "किंचित गोडी" },
        },
      },
      {
        id: "stomach7",
        name: { en: "The stomach", hi: "आमाशय", mr: "जठर" },
        kind: "organ",
        prompt: {
          en: "Which J-shaped bag churns food with hydrochloric acid and digestive juices — the acid killing germs and waking the enzymes?",
          hi: "कौन-सी J-आकार की थैली भोजन को हाइड्रोक्लोरिक अम्ल और पाचक रसों के साथ मथती है — अम्ल कीटाणु मारता और एंज़ाइम जगाता हुआ?",
          mr: "कोणती J-आकाराची पिशवी अन्नाला हायड्रोक्लोरिक आम्ल आणि पाचक रसांसह घुसळते — आम्ल जंतू मारते आणि विकरांना जागवते?",
        },
        statement: {
          en: "The stomach churns food with hydrochloric acid — the acid kills germs that rode in with the meal and makes the juices work.",
          hi: "आमाशय भोजन को हाइड्रोक्लोरिक अम्ल से मथता है — अम्ल भोजन के साथ आए कीटाणु मारता है और रसों को कारगर बनाता है।",
          mr: "जठर अन्नाला हायड्रोक्लोरिक आम्लाने घुसळते — आम्ल जेवणासोबत आलेले जंतू मारते आणि रसांना कार्यक्षम करते.",
        },
        detail: {
          en: "Its own wall would digest too — a lining of mucus keeps the acid at arm's length from its maker.",
          hi: "उसकी अपनी दीवार भी पच जाती — श्लेष्मा की परत अम्ल को उसके बनाने वाले से दूर रखती है।",
          mr: "त्याची स्वतःची भिंतही पचली असती — श्लेष्माचा थर आम्लाला त्याच्या निर्मात्यापासून दूर ठेवतो.",
        },
        extra: {
          en: "It is a store as well as a mill — meals wait there while the mill grinds in batches.",
          hi: "वह भंडार भी है और चक्की भी — भोजन वहीं ठहरता है जबकि चक्की किस्तों में पीसती है।",
          mr: "ते कोठारही आहे आणि गिरणीही — जेवण तिथे थांबते आणि गिरणी हप्त्याहप्त्याने दळते.",
        },
        pair: {
          left: { en: "The J-shaped bag", hi: "J-आकार की थैली", mr: "J-आकाराची पिशवी" },
          right: { en: "acid and churning", hi: "अम्ल और मंथन", mr: "आम्ल आणि घुसळण" },
        },
      },
      {
        id: "bile",
        name: { en: "Bile", hi: "पित्त", mr: "पित्त" },
        kind: "juice",
        prompt: {
          en: "Which liver-made juice, stored in the gall bladder, breaks fat into tiny droplets so enzymes can reach it?",
          hi: "यकृत का बनाया कौन-सा रस, पित्ताशय में जमा, वसा को नन्ही बूँदों में तोड़ता है ताकि एंज़ाइम उस तक पहुँच सकें?",
          mr: "यकृताने बनवलेला कोणता रस, पित्ताशयात साठलेला, स्निग्धाला इवल्या थेंबांत फोडतो जेणेकरून विकरे तिथे पोहोचतील?",
        },
        statement: {
          en: "Bile from the liver splits fat into fine droplets — soap's trick performed inside the body, making fat reachable.",
          hi: "यकृत का पित्त वसा को महीन बूँदों में बाँटता है — साबुन की तरकीब शरीर के भीतर, वसा को पहुँच में लाती हुई।",
          mr: "यकृताचे पित्त स्निग्धाला बारीक थेंबांत विभागते — साबणाची युक्ती शरीराच्या आत, स्निग्धाला आवाक्यात आणणारी.",
        },
        pair: {
          left: { en: "Bile on fat", hi: "वसा पर पित्त", mr: "स्निग्धावरचे पित्त" },
          right: {
            en: "droplets fit for enzymes",
            hi: "एंज़ाइम-योग्य बूँदें",
            mr: "विकर-योग्य थेंब",
          },
        },
      },
      {
        id: "villi",
        name: { en: "Villi", hi: "दीर्घरोम (विलाई)", mr: "आंत्रांकुर" },
        kind: "organ",
        prompt: {
          en: "Which thousands of finger-like folds line the small intestine, multiplying the surface through which digested food is absorbed?",
          hi: "कौन-सी हज़ारों उँगली जैसी तहें छोटी आँत के भीतर बिछी हैं, पचे भोजन के अवशोषण की सतह को कई गुना करती हुईं?",
          mr: "कोणत्या हजारो बोटांसारख्या घड्या लहान आतड्यात अंथरलेल्या आहेत, पचलेल्या अन्नाच्या शोषणाचा पृष्ठभाग कैकपट करणाऱ्या?",
        },
        statement: {
          en: "Villi are finger-like projections of the small intestine — they turn its lining into a vast absorbing field.",
          hi: "दीर्घरोम छोटी आँत के उँगली जैसे उभार हैं — वे उसकी भीतरी सतह को विशाल अवशोषण-क्षेत्र बना देते हैं।",
          mr: "आंत्रांकुर हे लहान आतड्याचे बोटांसारखे उंचवटे — ते तिच्या आतल्या पृष्ठाला विशाल शोषण-क्षेत्र करतात.",
        },
        detail: {
          en: "Each carries fine blood vessels — absorbed food steps straight from villus to bloodstream, no waiting room.",
          hi: "हर एक में महीन रक्त-नलिकाएँ हैं — सोखा भोजन दीर्घरोम से सीधे रक्त में उतरता है, कोई प्रतीक्षालय नहीं।",
          mr: "प्रत्येकात बारीक रक्तवाहिन्या — शोषलेले अन्न आंत्रांकुरातून थेट रक्तात उतरते, प्रतीक्षालय नाही.",
        },
        extra: {
          en: "Unfolded flat, the field would dwarf the modest tube that hides it.",
          hi: "खोलकर बिछा दें तो वह मैदान उस विनम्र नली को बौना कर दे जो उसे छिपाए है।",
          mr: "उलगडून पसरले तर ते मैदान त्याला लपवणाऱ्या विनम्र नळीला खुजे करील.",
        },
        pair: {
          left: { en: "Villi", hi: "दीर्घरोम", mr: "आंत्रांकुर" },
          right: {
            en: "the absorbing fingers",
            hi: "सोखने वाली उँगलियाँ",
            mr: "शोषणारी बोटे",
          },
        },
      },
      {
        id: "rumination",
        name: {
          en: "Rumination (cud-chewing)",
          hi: "रोमंथन (जुगाली)",
          mr: "रवंथ (जुगाली)",
        },
        kind: "process",
        prompt: {
          en: "Cows swallow grass in a hurry, then bring it back up to chew at leisure. What is this second, unhurried chewing called?",
          hi: "गायें घास जल्दी-जल्दी निगल जाती हैं, फिर उसे लौटाकर इत्मीनान से चबाती हैं। इस दूसरी, बेफ़िक्र चबाई का नाम क्या है?",
          mr: "गायी घाईघाईने गवत गिळतात, मग ते परत आणून निवांत चावतात. या दुसऱ्या, निवांत चावण्याचे नाव काय?",
        },
        statement: {
          en: "Rumination is the cow's second chewing — quick-swallowed grass waits in the rumen and returns to the mouth as cud.",
          hi: "रोमंथन गाय की दूसरी चबाई है — जल्दी निगली घास प्रथम आमाशय में ठहरती है और जुगाली बनकर मुँह में लौटती है।",
          mr: "रवंथ म्हणजे गायीचे दुसरे चावणे — घाईत गिळलेले गवत कोठीपोटात थांबते आणि जुगाली होऊन तोंडात परतते.",
        },
        detail: {
          en: "The rumen's resident bacteria digest cellulose — the tough fibre no human stomach can break.",
          hi: "प्रथम आमाशय के निवासी जीवाणु सेलुलोज़ पचाते हैं — वह कड़ा रेशा जिसे कोई मानव-आमाशय नहीं तोड़ पाता।",
          mr: "कोठीपोटातले रहिवासी जीवाणू सेल्युलोज पचवतात — जो चिवट तंतू कोणतेही मानवी जठर मोडू शकत नाही.",
        },
        extra: {
          en: "That bacterial help is why grass is a meal for the cow and mere roughage for us.",
          hi: "उसी जीवाणु-सहायता के कारण घास गाय के लिए भोजन है और हमारे लिए महज़ रेशा।",
          mr: "त्याच जीवाणू-मदतीमुळे गवत गायीसाठी जेवण आणि आपल्यासाठी नुसता चोथा.",
        },
        pair: {
          left: { en: "The hurried grass", hi: "जल्दी निगली घास", mr: "घाईत गिळलेले गवत" },
          right: {
            en: "chewed again at leisure",
            hi: "फिर इत्मीनान से चबाई",
            mr: "पुन्हा निवांत चावलेले",
          },
        },
      },
      {
        id: "amoeba",
        name: { en: "Amoeba", hi: "अमीबा", mr: "अमिबा" },
        kind: "creature",
        prompt: {
          en: "Which single-celled pond dweller flows finger-like arms around its food and swallows it into a bubble for digesting?",
          hi: "कौन-सा एककोशिकीय तालाब-वासी भोजन के चारों ओर उँगली जैसी बाहें बहाकर उसे पचाने के बुलबुले में निगल लेता है?",
          mr: "कोणता एकपेशीय तळे-रहिवासी अन्नाभोवती बोटांसारखे हात पसरून त्याला पचनाच्या बुडबुड्यात गिळतो?",
        },
        statement: {
          en: "Amoeba eats with pseudopodia — false feet that flow around food and pinch it into a food vacuole, a stomach made to order.",
          hi: "अमीबा कूटपादों से खाता है — छद्म पैर जो भोजन को घेरकर उसे खाद्य-धानी में बंद कर देते हैं, फ़रमाइशी आमाशय।",
          mr: "अमिबा छद्मपादांनी खातो — खोटे पाय अन्नाभोवती वाहून त्याला अन्न-रिक्तिकेत बंद करतात, मागणीनुसारचे जठर.",
        },
        pair: {
          left: { en: "The pseudopodia", hi: "कूटपाद", mr: "छद्मपाद" },
          right: {
            en: "arms that become a mouth",
            hi: "बाहें जो मुँह बन जाएँ",
            mr: "तोंड होणारे हात",
          },
        },
      },
      {
        id: "large-intestine",
        name: { en: "The large intestine", hi: "बड़ी आँत", mr: "मोठे आतडे" },
        kind: "organ",
        prompt: {
          en: "Which final, wider tube absorbs water and salts from undigested food before the waste leaves the body?",
          hi: "कौन-सी अंतिम, चौड़ी नली अनपचे भोजन से पानी और लवण सोख लेती है, इससे पहले कि अपशिष्ट शरीर छोड़े?",
          mr: "कोणती शेवटची, रुंद नळी न पचलेल्या अन्नातून पाणी आणि क्षार शोषते, कचरा शरीर सोडण्याआधी?",
        },
        statement: {
          en: "The large intestine reclaims water and salts from what remains — the body wastes no drop it can still save.",
          hi: "बड़ी आँत बचे-खुचे से पानी और लवण वापस लेती है — शरीर वह बूँद नहीं गँवाता जो बच सकती हो।",
          mr: "मोठे आतडे उरल्यासुरल्यातून पाणी आणि क्षार परत घेते — वाचू शकणारा थेंब शरीर वाया घालवत नाही.",
        },
        pair: {
          left: { en: "The last stretch of gut", hi: "आँत का आख़िरी पड़ाव", mr: "आतड्याचा शेवटचा टप्पा" },
          right: { en: "water reclaimed", hi: "वापस ली गई नमी", mr: "परत घेतलेले पाणी" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put the food canal in walking order, mouth first. Which route is right?",
          hi: "आहार-नाल को चलने के क्रम में रखिए, मुँह सबसे पहले। कौन-सा रास्ता सही है?",
          mr: "अन्ननलिका चालण्याच्या क्रमाने लावा, तोंड सर्वांत आधी. कोणता मार्ग बरोबर?",
        },
        choices: [
          {
            en: "Mouth → food pipe → stomach → small intestine → large intestine",
            hi: "मुँह → ग्रासनली → आमाशय → छोटी आँत → बड़ी आँत",
            mr: "तोंड → अन्ननलिका → जठर → लहान आतडे → मोठे आतडे",
          },
          {
            en: "Mouth → stomach → food pipe → large intestine → small intestine",
            hi: "मुँह → आमाशय → ग्रासनली → बड़ी आँत → छोटी आँत",
            mr: "तोंड → जठर → अन्ननलिका → मोठे आतडे → लहान आतडे",
          },
          {
            en: "Mouth → food pipe → small intestine → stomach → large intestine",
            hi: "मुँह → ग्रासनली → छोटी आँत → आमाशय → बड़ी आँत",
            mr: "तोंड → अन्ननलिका → लहान आतडे → जठर → मोठे आतडे",
          },
          {
            en: "Mouth → food pipe → stomach → large intestine → small intestine",
            hi: "मुँह → ग्रासनली → आमाशय → बड़ी आँत → छोटी आँत",
            mr: "तोंड → अन्ननलिका → जठर → मोठे आतडे → लहान आतडे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Chew, slide, churn, absorb, reclaim: mouth, food pipe, stomach, small intestine, large intestine. The small intestine comes BEFORE the large — digestion and absorption finish there; the large intestine only recovers water from what is left.",
          hi: "चबाओ, सरको, मथो, सोखो, वापस लो: मुँह, ग्रासनली, आमाशय, छोटी आँत, बड़ी आँत। छोटी आँत बड़ी से पहले आती है — पाचन और अवशोषण वहीं पूरे होते हैं; बड़ी आँत बचे हुए से केवल पानी लौटाती है।",
          mr: "चावा, सरकवा, घुसळा, शोषा, परत घ्या: तोंड, अन्ननलिका, जठर, लहान आतडे, मोठे आतडे. लहान आतडे मोठ्याच्या आधी येते — पचन आणि शोषण तिथेच संपते; मोठे आतडे उरल्यातून फक्त पाणी परत घेते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A patient too weak to eat is put on a glucose drip, straight into the blood — and it works. What does this reveal about the whole digestive canal?",
          hi: "खाने में असमर्थ रोगी को ग्लूकोज़ की ड्रिप सीधे रक्त में दी जाती है — और वह काम करती है। यह पूरी आहार-नाल के बारे में क्या उजागर करता है?",
          mr: "जेवू न शकणाऱ्या रुग्णाला ग्लुकोजचे सलाईन थेट रक्तात दिले जाते — आणि ते चालते. हे संपूर्ण अन्ननलिकेबद्दल काय उघड करते?",
        },
        choices: [
          {
            en: "The canal's whole job is to make food glucose-simple; glucose arrives already simple, so it can skip the queue entirely",
            hi: "नाल का पूरा काम भोजन को ग्लूकोज़ जैसा सरल बनाना है; ग्लूकोज़ पहले से सरल आता है, अतः वह पूरी क़तार लाँघ सकता है",
            mr: "नलिकेचे सारे काम अन्नाला ग्लुकोजइतके साधे करणे; ग्लुकोज आधीच साधे येते, म्हणून ते सारी रांग ओलांडू शकते",
          },
          {
            en: "Blood can digest any food if the stomach is tired",
            hi: "आमाशय थका हो तो रक्त कोई भी भोजन पचा सकता है",
            mr: "जठर थकले तर रक्त कोणतेही अन्न पचवू शकते",
          },
          {
            en: "Drips work only because hospitals warm the glucose first",
            hi: "ड्रिप केवल इसलिए चलती है कि अस्पताल ग्लूकोज़ पहले गर्म करते हैं",
            mr: "सलाईन फक्त म्हणून चालते की रुग्णालये ग्लुकोज आधी गरम करतात",
          },
          {
            en: "It shows the canal digests nothing and is only for storage",
            hi: "यह दिखाता है कि नाल कुछ नहीं पचाती, केवल भंडारण करती है",
            mr: "हे दाखवते की नलिका काही पचवत नाही, फक्त साठवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The drip is the exception that maps the rule. Blood accepts only simple substances; every organ from teeth to villi exists to bring a meal down to that simplicity. Glucose starts there — so the mouth, stomach and intestines have nothing left to add, and the needle can hand it straight to the blood.",
          hi: "ड्रिप वह अपवाद है जो नियम का नक़्शा खींच देती है। रक्त केवल सरल पदार्थ स्वीकारता है; दाँतों से दीर्घरोम तक हर अंग भोजन को उसी सरलता तक उतारने के लिए है। ग्लूकोज़ वहीं से शुरू होता है — अतः मुँह, आमाशय और आँतों के पास जोड़ने को कुछ नहीं बचता, और सुई उसे सीधे रक्त को सौंप सकती है।",
          mr: "सलाईन हा नियमाचा नकाशा काढणारा अपवाद. रक्त फक्त साधे पदार्थ स्वीकारते; दातांपासून आंत्रांकुरांपर्यंत प्रत्येक अवयव जेवणाला त्या साधेपणापर्यंत उतरवण्यासाठी आहे. ग्लुकोज तिथूनच सुरू होते — म्हणून तोंड, जठर आणि आतड्यांकडे जोडण्यासारखे काही उरत नाही, आणि सुई ते थेट रक्ताला देऊ शकते.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Heat (three roads for warmth, two thermometers)             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-7-heat",
    subject: "SCIENCE",
    classLevel: 7,
    chapter: {
      en: "Chapter 4 — Heat",
      hi: "अध्याय 4 — ऊष्मा",
      mr: "प्रकरण 4 — उष्णता",
    },
    name: { en: "Heat", hi: "ऊष्मा", mr: "उष्णता" },
    summary: {
      en: "Warmth's three roads — conduction through the spoon, convection's rising wheel, radiation across empty space — plus two honest thermometers and the winter wisdom of trapped air.",
      hi: "गर्मी की तीन राहें — चम्मच से चालन, उठते पहिये का संवहन, खाली जगह पार करता विकिरण — साथ में दो ईमानदार थर्मामीटर और क़ैद हवा की सर्दियों वाली समझ।",
      mr: "उबेच्या तीन वाटा — चमच्यातून वहन, चढत्या चाकाचे अभिसरण, रिकाम्या अवकाशापारचे प्रारण — सोबत दोन प्रामाणिक तापमापी आणि कोंडलेल्या हवेचे हिवाळी शहाणपण.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "conduction",
        name: { en: "Conduction", hi: "चालन", mr: "वहन" },
        kind: "transfer",
        prompt: {
          en: "A steel spoon left in hot dal grows hot to the handle, though nothing in the metal moves house. By which process does the heat travel?",
          hi: "गर्म दाल में छूटा स्टील का चम्मच मूठ तक गर्म हो जाता है, हालाँकि धातु में कोई कण घर नहीं छोड़ता। ऊष्मा किस प्रक्रिया से चलती है?",
          mr: "गरम आमटीत राहिलेला स्टीलचा चमचा मुठीपर्यंत गरम होतो, तरी धातूतला कोणी कण घर सोडत नाही. उष्णता कोणत्या प्रक्रियेने चालते?",
        },
        statement: {
          en: "Conduction carries heat through solids, particle jostling particle — the heat travels while everyone stays home.",
          hi: "चालन ठोसों में ऊष्मा ले जाता है, कण कण को धकियाता हुआ — गर्मी चलती है और सब अपने घर में रहते हैं।",
          mr: "वहन घनांतून उष्णता नेते, कण कणाला ढकलत — उष्णता चालते आणि सारे घरीच राहतात.",
        },
        detail: {
          en: "Metals pass the message eagerly; wood and plastic barely whisper it — which is why pans are steel and their handles are not.",
          hi: "धातुएँ संदेश तत्परता से बढ़ाती हैं; लकड़ी और प्लास्टिक मुश्किल से फुसफुसाते हैं — इसीलिए कड़ाही स्टील की है और उसकी मूठ नहीं।",
          mr: "धातू निरोप तत्परतेने पुढे देतात; लाकूड आणि प्लास्टिक जेमतेम कुजबुजतात — म्हणूनच कढई स्टीलची आणि तिची मूठ नाही.",
        },
        extra: {
          en: "Try two spoons, steel and wooden, in the same tea — only one bites your fingers.",
          hi: "एक ही चाय में स्टील और लकड़ी के दो चम्मच रखिए — उँगलियाँ केवल एक ही काटता है।",
          mr: "एकाच चहात स्टील आणि लाकडाचे दोन चमचे ठेवा — बोटे फक्त एकच चावतो.",
        },
        pair: {
          left: { en: "The spoon in hot dal", hi: "गर्म दाल में चम्मच", mr: "गरम आमटीतला चमचा" },
          right: {
            en: "warmth passed neighbour to neighbour",
            hi: "पड़ोसी-दर-पड़ोसी बढ़ी गर्मी",
            mr: "शेजाऱ्याकडून शेजाऱ्याकडे गेलेली ऊब",
          },
        },
      },
      {
        id: "convection",
        name: { en: "Convection", hi: "संवहन", mr: "अभिसरण" },
        kind: "transfer",
        prompt: {
          en: "Water in a pan heats throughout though only the bottom touches the flame. Which process moves the heat by moving the water itself?",
          hi: "पतीले का पानी पूरा गर्म हो जाता है जबकि आँच केवल तली छूती है। कौन-सी प्रक्रिया पानी को ही चलाकर ऊष्मा पहुँचाती है?",
          mr: "पातेल्यातले पाणी सगळे गरम होते, तरी ज्योत फक्त तळाला लागते. कोणती प्रक्रिया पाण्यालाच हलवून उष्णता पोहोचवते?",
        },
        statement: {
          en: "Convection moves heat in liquids and gases — warm portions rise, cool ones sink to take their place: a turning wheel of currents.",
          hi: "संवहन द्रवों और गैसों में ऊष्मा चलाता है — गर्म हिस्से उठते हैं, ठंडे उनकी जगह उतरते हैं: धाराओं का घूमता पहिया।",
          mr: "अभिसरण द्रव आणि वायूंत उष्णता हलवते — गरम भाग वर चढतात, थंड त्यांची जागा घेतात: प्रवाहांचे फिरते चाक.",
        },
        detail: {
          en: "The coast runs this wheel at landscape size — sea breeze by day, land breeze by night.",
          hi: "समुद्र-तट यही पहिया विराट आकार में चलाता है — दिन में समुद्री हवा, रात में स्थल की।",
          mr: "किनारा हेच चाक भव्य आकारात चालवतो — दिवसा खारा वारा, रात्री मतलई.",
        },
        extra: {
          en: "Heaters sit low and AC vents sit high for the same reason: let the rising and sinking do the delivery.",
          hi: "हीटर नीचे और एसी के झरोखे ऊपर इसी कारण हैं: चढ़ना-उतरना ही डाक बाँट दे।",
          mr: "हीटर खाली आणि एसीची झडप वर याच कारणाने: चढणे-उतरणेच वाटप करू दे.",
        },
        pair: {
          left: { en: "The warm water", hi: "गर्म पानी", mr: "गरम पाणी" },
          right: {
            en: "rising to share its heat",
            hi: "उठकर गर्मी बाँटता",
            mr: "वर चढून ऊब वाटणारे",
          },
        },
      },
      {
        id: "radiation",
        name: { en: "Radiation", hi: "विकिरण", mr: "प्रारण" },
        kind: "transfer",
        prompt: {
          en: "The Sun's heat crosses crores of kilometres of empty space where nothing flows and nothing touches. By which process does it arrive?",
          hi: "सूर्य की ऊष्मा करोड़ों किलोमीटर की उस खाली जगह को पार करती है जहाँ न कुछ बहता है न छूता है। वह किस प्रक्रिया से पहुँचती है?",
          mr: "सूर्याची उष्णता कोट्यवधी किलोमीटरचा तो रिकामा अवकाश ओलांडते जिथे काही वाहत नाही की स्पर्शत नाही. ती कोणत्या प्रक्रियेने पोहोचते?",
        },
        statement: {
          en: "Radiation needs no medium at all — heat travels as rays, from Sun to skin and from a bonfire to your face across the cold air.",
          hi: "विकिरण को कोई माध्यम नहीं चाहिए — ऊष्मा किरणों की तरह चलती है, सूर्य से त्वचा तक और ठंडी हवा के पार अलाव से आपके चेहरे तक।",
          mr: "प्रारणाला माध्यमच लागत नाही — उष्णता किरणांसारखी चालते, सूर्यापासून त्वचेपर्यंत आणि थंड हवेच्या पार शेकोटीपासून तुमच्या चेहऱ्यापर्यंत.",
        },
        pair: {
          left: {
            en: "Heat across empty space",
            hi: "खाली जगह पार करती ऊष्मा",
            mr: "रिकाम्या अवकाशापारची उष्णता",
          },
          right: { en: "no medium needed", hi: "बिना माध्यम के", mr: "माध्यमाविनाच" },
        },
      },
      {
        id: "clinical",
        name: {
          en: "The clinical thermometer",
          hi: "डॉक्टरी थर्मामीटर",
          mr: "वैद्यकीय तापमापी",
        },
        kind: "instrument",
        prompt: {
          en: "Which thermometer, marked 35 to 42 °C, holds its reading with a kink in the tube so the doctor can read it at leisure?",
          hi: "कौन-सा थर्मामीटर, 35 से 42 °C तक अंकित, नली की एक मरोड़ से अपना पाठ्यांक थामे रखता है ताकि डॉक्टर इत्मीनान से पढ़ सके?",
          mr: "कोणता तापमापी, 35 ते 42 °C खुणा असलेला, नळीतल्या एका वळणाने आपले वाचन धरून ठेवतो जेणेकरून डॉक्टर निवांत वाचू शकतील?",
        },
        statement: {
          en: "The clinical thermometer reads body heat on a short 35–42 °C scale — its kink stops the reading from falling until it is shaken down.",
          hi: "डॉक्टरी थर्मामीटर शरीर की गर्मी 35–42 °C के छोटे पैमाने पर पढ़ता है — उसकी मरोड़ पाठ्यांक को गिरने नहीं देती जब तक झटका न लगे।",
          mr: "वैद्यकीय तापमापी शरीराची उष्णता 35–42 °C च्या छोट्या पट्टीवर वाचतो — त्याचे वळण वाचनाला हिसका बसेपर्यंत उतरू देत नाही.",
        },
        detail: {
          en: "The healthy human reading sits near 37 °C — a number worth knowing by heart.",
          hi: "स्वस्थ मानव का पाठ्यांक 37 °C के पास बैठता है — कंठस्थ रखने लायक़ संख्या।",
          mr: "निरोगी माणसाचे वाचन 37 °C जवळ बसते — तोंडपाठ ठेवण्याजोगा आकडा.",
        },
        extra: {
          en: "Its short scale is a design choice: no living body needs the numbers beyond it.",
          hi: "छोटा पैमाना सोची-समझी बनावट है: कोई जीवित शरीर उसके पार की संख्याएँ नहीं माँगता।",
          mr: "छोटी पट्टी ही विचारपूर्वक रचना: कोणतेही जिवंत शरीर तिच्या पलीकडचे आकडे मागत नाही.",
        },
        pair: {
          left: { en: "The kink in the tube", hi: "नली की मरोड़", mr: "नळीतले वळण" },
          right: {
            en: "a reading that waits",
            hi: "ठहरा हुआ पाठ्यांक",
            mr: "थांबून राहणारे वाचन",
          },
        },
      },
      {
        id: "laboratory",
        name: {
          en: "The laboratory thermometer",
          hi: "प्रयोगशाला थर्मामीटर",
          mr: "प्रयोगशाळा तापमापी",
        },
        kind: "instrument",
        prompt: {
          en: "Which thermometer spans −10 to 110 °C and must be read while still dipped, since nothing holds its level?",
          hi: "कौन-सा थर्मामीटर −10 से 110 °C तक फैला है और डूबे-डूबे ही पढ़ना पड़ता है, क्योंकि उसका स्तर कोई नहीं थामता?",
          mr: "कोणता तापमापी −10 ते 110 °C पसरलेला आहे आणि बुडलेला असतानाच वाचावा लागतो, कारण त्याची पातळी कोणी धरत नाही?",
        },
        statement: {
          en: "The laboratory thermometer measures from −10 to 110 °C with no kink — lift it out and the truth starts sliding away.",
          hi: "प्रयोगशाला थर्मामीटर −10 से 110 °C तक बिना मरोड़ के नापता है — बाहर निकालिए और सच खिसकने लगता है।",
          mr: "प्रयोगशाळा तापमापी −10 ते 110 °C वळणाविना मोजतो — बाहेर काढा आणि खरे उत्तर घसरू लागते.",
        },
        pair: {
          left: { en: "The lab's tube", hi: "प्रयोगशाला की नली", mr: "प्रयोगशाळेची नळी" },
          right: { en: "read while dipped", hi: "डूबे-डूबे पढ़ो", mr: "बुडलेले असतानाच वाचा" },
        },
      },
      {
        id: "dark-colours",
        name: { en: "Dark colours", hi: "गहरे रंग", mr: "गडद रंग" },
        kind: "property",
        prompt: {
          en: "Which shades absorb the most radiated heat — making them winter's choice of dress and summer's mistake?",
          hi: "कौन-से रंग विकिरित ऊष्मा सबसे ज़्यादा सोखते हैं — जो उन्हें सर्दियों की पोशाक और गर्मियों की भूल बना देता है?",
          mr: "कोणते रंग प्रारित उष्णता सर्वाधिक शोषतात — ज्यामुळे ते हिवाळ्याचा पोशाख आणि उन्हाळ्याची चूक ठरतात?",
        },
        statement: {
          en: "Dark colours drink radiation deepest — black warms its wearer in winter while white returns summer's heat unopened.",
          hi: "गहरे रंग विकिरण सबसे गहरा पीते हैं — काला सर्दी में पहनने वाले को तपाता है, जबकि सफ़ेद गर्मी की ऊष्मा बिन खोले लौटा देता है।",
          mr: "गडद रंग प्रारण सर्वांत खोल पितात — काळा हिवाळ्यात घालणाऱ्याला ऊब देतो, तर पांढरा उन्हाळ्याची उष्णता न उघडताच परत करतो.",
        },
        pair: {
          left: {
            en: "The black kurta in the sun",
            hi: "धूप में काला कुर्ता",
            mr: "उन्हातला काळा कुर्ता",
          },
          right: { en: "heat drunk deep", hi: "गहरी पी गई गर्मी", mr: "खोल प्यालेली उष्णता" },
        },
      },
      {
        id: "trapped-air",
        name: { en: "Trapped air", hi: "क़ैद हवा", mr: "कोंडलेली हवा" },
        kind: "property",
        prompt: {
          en: "Two thin blankets warm better than one thick one. What do they hold between them that wool also holds between its fibres?",
          hi: "दो पतले कंबल एक मोटे से बेहतर गर्माते हैं। वे अपने बीच वह क्या थामे रखते हैं जो ऊन भी अपने रेशों के बीच रखती है?",
          mr: "दोन पातळ पांघरुणे एका जाड पांघरुणाहून चांगली ऊब देतात. ती आपल्यामध्ये ते काय धरतात जे लोकरही आपल्या धाग्यांमध्ये धरते?",
        },
        statement: {
          en: "Trapped air is a poor conductor — wool's warmth and the two-blanket trick are both a still layer of air doing nothing, beautifully.",
          hi: "क़ैद हवा ऊष्मा की बुरी चालक है — ऊन की गर्मी और दो-कंबल की तरकीब, दोनों ठहरी हवा की वह परत हैं जो कुछ न करके सब करती है।",
          mr: "कोंडलेली हवा उष्णतेची वाईट वाहक — लोकरीची ऊब आणि दोन-पांघरुणांची युक्ती, दोन्ही म्हणजे काहीही न करता सारे करणारा स्थिर हवेचा थर.",
        },
        detail: {
          en: "Held still between layers, the air cannot even convect — stillness itself is the insulation.",
          hi: "परतों के बीच ठहरी हवा संवहन तक नहीं कर पाती — ठहराव ही रोधन है।",
          mr: "थरांमध्ये स्थिर धरलेली हवा अभिसरणही करू शकत नाही — स्थिरताच रोधन आहे.",
        },
        extra: {
          en: "Birds know the trick: they fluff their feathers in cold to thicken their own air-quilt.",
          hi: "पक्षी यह तरकीब जानते हैं: ठंड में पर फुलाकर वे अपनी हवा-रज़ाई मोटी कर लेते हैं।",
          mr: "पक्ष्यांना ही युक्ती ठाऊक: थंडीत पिसे फुलवून ते आपली हवा-दुलई जाड करतात.",
        },
        pair: {
          left: { en: "Two thin blankets", hi: "दो पतले कंबल", mr: "दोन पातळ पांघरुणे" },
          right: {
            en: "a warm layer of nothing",
            hi: "कुछ-नहीं की गर्म परत",
            mr: "काही-नाहीचा उबदार थर",
          },
        },
      },
      {
        id: "sea-breeze",
        name: { en: "The sea breeze", hi: "समुद्री हवा", mr: "खारा वारा" },
        kind: "wind",
        prompt: {
          en: "On a hot afternoon at the coast, cool air slides in from over the water as the land's hot air rises. What is this daytime wind called?",
          hi: "तट पर तपती दोपहर में, स्थल की गर्म हवा उठते ही पानी के ऊपर से ठंडी हवा सरक आती है। इस दिन की हवा का नाम क्या है?",
          mr: "किनाऱ्यावर तापल्या दुपारी, जमिनीवरची गरम हवा वर चढताच पाण्यावरून थंड हवा सरकत येते. या दिवसाच्या वाऱ्याचे नाव काय?",
        },
        statement: {
          en: "The sea breeze blows from sea to land by day — land heats faster, its air rises, and the cooler sea air files in to fill the seat.",
          hi: "समुद्री हवा दिन में समुद्र से स्थल की ओर चलती है — ज़मीन जल्दी तपती है, उसकी हवा उठती है, और ठंडी समुद्री हवा ख़ाली कुर्सी भरने चली आती है।",
          mr: "खारा वारा दिवसा समुद्राकडून जमिनीकडे वाहतो — जमीन लवकर तापते, तिची हवा वर चढते, आणि थंड समुद्री हवा रिकामी खुर्ची भरायला येते.",
        },
        pair: {
          left: { en: "The afternoon coast", hi: "दोपहर का तट", mr: "दुपारचा किनारा" },
          right: { en: "wind from the water", hi: "पानी से आई हवा", mr: "पाण्यावरून आलेला वारा" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the journey to its road: A-spoon handle heating in dal, B-whole pan of water warming, C-warmth of a bonfire on your face. Which trio is right?",
          hi: "यात्रा को उसकी राह से मिलाइए: अ-दाल में तपती चम्मच की मूठ, ब-पतीले भर पानी का गर्माना, स-चेहरे पर अलाव की आँच। कौन-सी तिकड़ी सही है?",
          mr: "प्रवासाला त्याच्या वाटेशी जुळवा: अ-आमटीत तापणारी चमच्याची मूठ, ब-पातेलेभर पाण्याचे तापणे, क-चेहऱ्यावरची शेकोटीची ऊब. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: conduction · B: convection · C: radiation",
            hi: "अ: चालन · ब: संवहन · स: विकिरण",
            mr: "अ: वहन · ब: अभिसरण · क: प्रारण",
          },
          {
            en: "A: convection · B: radiation · C: conduction",
            hi: "अ: संवहन · ब: विकिरण · स: चालन",
            mr: "अ: अभिसरण · ब: प्रारण · क: वहन",
          },
          {
            en: "A: radiation · B: conduction · C: convection",
            hi: "अ: विकिरण · ब: चालन · स: संवहन",
            mr: "अ: प्रारण · ब: वहन · क: अभिसरण",
          },
          {
            en: "A: conduction · B: radiation · C: convection",
            hi: "अ: चालन · ब: विकिरण · स: संवहन",
            mr: "अ: वहन · ब: प्रारण · क: अभिसरण",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Ask what moves. In the spoon nothing moves house — conduction. In the pan the water itself circulates — convection. From the bonfire the heat crosses air without needing it — radiation. One question, three roads, no overlap.",
          hi: "पूछिए: चलता क्या है। चम्मच में कोई घर नहीं छोड़ता — चालन। पतीले में पानी स्वयं घूमता है — संवहन। अलाव से ऊष्मा हवा की मोहताज हुए बिना उसे पार करती है — विकिरण। एक सवाल, तीन राहें, कोई उलझाव नहीं।",
          mr: "विचारा: हलते काय. चमच्यात कोणी घर सोडत नाही — वहन. पातेल्यात पाणी स्वतः फिरते — अभिसरण. शेकोटीतून उष्णता हवेची गरज नसताना तिला ओलांडते — प्रारण. एक प्रश्न, तीन वाटा, गोंधळ नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "On a winter morning you step barefoot from the rug onto the stone floor beside it. Both spent the night in the same room, yet the stone feels far colder. Why?",
          hi: "सर्दी की सुबह आप नंगे पाँव दरी से उसकी बग़ल के पत्थर के फ़र्श पर उतरते हैं। दोनों ने रात एक ही कमरे में काटी, फिर भी पत्थर कहीं ठंडा लगता है। क्यों?",
          mr: "हिवाळी सकाळी तुम्ही अनवाणी सतरंजीवरून तिच्या शेजारच्या दगडी फरशीवर उतरता. दोघांनी रात्र एकाच खोलीत काढली, तरी दगड कितीतरी थंड लागतो. का?",
        },
        choices: [
          {
            en: "Both are equally cold, but stone conducts heat OUT of your foot far faster — your skin measures the leak, not the temperature",
            hi: "दोनों बराबर ठंडे हैं, पर पत्थर आपके पैर की गर्मी कहीं तेज़ी से खींचता है — त्वचा रिसाव नापती है, तापमान नहीं",
            mr: "दोघे सारखेच थंड, पण दगड तुमच्या पायातली उष्णता कितीतरी वेगाने ओढतो — त्वचा गळती मोजते, तापमान नाही",
          },
          {
            en: "Stone is always many degrees colder than cloth at night",
            hi: "रात में पत्थर कपड़े से हमेशा कई डिग्री ठंडा रहता है",
            mr: "रात्री दगड कापडाहून नेहमी कित्येक अंश थंड असतो",
          },
          {
            en: "The rug secretly makes its own heat",
            hi: "दरी चुपचाप अपनी गर्मी बनाती है",
            mr: "सतरंजी गुपचूप स्वतःची ऊब बनवते",
          },
          {
            en: "Bare feet cannot feel cloth at all",
            hi: "नंगे पाँव कपड़े को महसूस ही नहीं कर पाते",
            mr: "अनवाणी पायांना कापड जाणवतच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A night in one room leaves rug and stone at one temperature — a thermometer would swear to it. But your sole is not a thermometer; it reports how fast its own warmth is being taken. Stone, a good conductor, drains heat quickly; the rug's trapped air barely sips. 'Cold to the touch' is a speed, not a temperature.",
          hi: "एक कमरे की रात दरी और पत्थर को एक ही तापमान पर छोड़ती है — थर्मामीटर क़सम खा लेगा। पर आपका तलवा थर्मामीटर नहीं; वह बताता है कि उसकी अपनी गर्मी कितनी तेज़ी से छिन रही है। अच्छा चालक पत्थर गर्मी झटपट खींचता है; दरी की क़ैद हवा घूँट भर भी मुश्किल से लेती है। 'छूने में ठंडा' एक रफ़्तार है, तापमान नहीं।",
          mr: "एका खोलीतली रात्र सतरंजी आणि दगडाला एकाच तापमानावर सोडते — तापमापी शपथ घेईल. पण तुमचा तळवा तापमापी नाही; तो सांगतो की त्याची स्वतःची ऊब किती वेगाने नेली जात आहे. चांगला वाहक दगड उष्णता झटपट ओढतो; सतरंजीची कोंडलेली हवा जेमतेम घोट घेते. 'स्पर्शाला थंड' हा वेग आहे, तापमान नाही.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Acids, Bases and Salts (indicators and the great cancel)    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-7-acids-bases-salts",
    subject: "SCIENCE",
    classLevel: 7,
    chapter: {
      en: "Chapter 5 — Acids, Bases and Salts",
      hi: "अध्याय 5 — अम्ल, क्षारक और लवण",
      mr: "प्रकरण 5 — आम्ले, आम्लारी आणि क्षार",
    },
    name: {
      en: "Acids, Bases and Salts",
      hi: "अम्ल, क्षारक और लवण",
      mr: "आम्ले, आम्लारी आणि क्षार",
    },
    summary: {
      en: "The sour tribe and the bitter tribe, told apart by litmus, turmeric and china rose — and neutralisation, the great cancelling that leaves salt, water and warmth.",
      hi: "खट्टा कुनबा और कड़वा कुनबा, लिटमस, हल्दी और गुड़हल से पहचाने हुए — और उदासीनीकरण, वह महा-कटौती जो लवण, पानी और गर्मी छोड़ जाती है।",
      mr: "आंबट जमात आणि कडू जमात, लिटमस, हळद आणि जास्वंदाने ओळखलेल्या — आणि उदासिनीकरण, क्षार, पाणी व ऊब मागे ठेवणारी महा-रद्दबातल.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "acids",
        name: { en: "Acids", hi: "अम्ल", mr: "आम्ले" },
        kind: "class",
        prompt: {
          en: "Lemon, curd and vinegar share one sharp, sour taste. To which class of substances do they all belong?",
          hi: "नींबू, दही और सिरके में एक ही तीखा खट्टापन है। ये सब किस वर्ग के पदार्थ हैं?",
          mr: "लिंबू, दही आणि व्हिनेगरमध्ये एकच झणझणीत आंबटपणा आहे. हे सारे कोणत्या वर्गाचे पदार्थ?",
        },
        statement: {
          en: "Acids taste sour — lemon's citric, curd's lactic and vinegar's acetic all belong to the tribe, and all turn blue litmus red.",
          hi: "अम्ल खट्टे होते हैं — नींबू का सिट्रिक, दही का लैक्टिक और सिरके का ऐसीटिक सब इसी कुनबे के हैं, और सब नीले लिटमस को लाल करते हैं।",
          mr: "आम्ले आंबट असतात — लिंबाचे सायट्रिक, दह्याचे लॅक्टिक आणि व्हिनेगरचे अ‍ॅसेटिक सारे याच जमातीचे, आणि सारे निळ्या लिटमसला लाल करतात.",
        },
        detail: {
          en: "The lab's strong ones — sulphuric, hydrochloric — are never tasted; taste-testing is for food acids only, and even they are met diluted.",
          hi: "प्रयोगशाला के तेज़ अम्ल — सल्फ़्यूरिक, हाइड्रोक्लोरिक — कभी चखे नहीं जाते; स्वाद-परीक्षा केवल भोजन के अम्लों की होती है, और वे भी घुले-मिले।",
          mr: "प्रयोगशाळेतली कडक आम्ले — सल्फ्युरिक, हायड्रोक्लोरिक — कधीच चाखली जात नाहीत; चव-परीक्षा फक्त अन्नातल्या आम्लांची, तीही सौम्य रूपात.",
        },
        extra: {
          en: "Ant stings and nettle hairs inject formic acid — the tribe has soldiers as well as cooks.",
          hi: "चींटी का डंक और बिच्छू-बूटी के रोएँ फ़ॉर्मिक अम्ल चुभोते हैं — कुनबे में रसोइए ही नहीं, सिपाही भी हैं।",
          mr: "मुंगीचा डंख आणि खाजकुइलीचे केस फॉर्मिक आम्ल टोचतात — जमातीत स्वयंपाकीच नव्हे, शिपाईही आहेत.",
        },
        pair: {
          left: { en: "The sour tribe", hi: "खट्टा कुनबा", mr: "आंबट जमात" },
          right: {
            en: "blue litmus turned red",
            hi: "लाल हुआ नीला लिटमस",
            mr: "लाल झालेले निळे लिटमस",
          },
        },
      },
      {
        id: "bases",
        name: { en: "Bases", hi: "क्षारक", mr: "आम्लारी" },
        kind: "class",
        prompt: {
          en: "Soap solution and baking soda feel slippery and taste bitter. To which class of substances do they belong?",
          hi: "साबुन का घोल और खाने का सोडा फिसलते हैं और कड़वे लगते हैं। ये किस वर्ग के पदार्थ हैं?",
          mr: "साबणाचे द्रावण आणि खाण्याचा सोडा निसरडे लागतात आणि कडू. हे कोणत्या वर्गाचे पदार्थ?",
        },
        statement: {
          en: "Bases feel soapy and taste bitter — they are the acid's opposite camp, and they turn red litmus blue.",
          hi: "क्षारक साबुन जैसे फिसलते और कड़वे होते हैं — अम्ल का विरोधी ख़ेमा, जो लाल लिटमस को नीला करता है।",
          mr: "आम्लारी साबणासारखी निसरडी आणि कडू असतात — आम्लाची विरुद्ध छावणी, जी लाल लिटमसला निळे करते.",
        },
        pair: {
          left: {
            en: "The bitter, soapy tribe",
            hi: "कड़वा, साबुनी कुनबा",
            mr: "कडू, साबणी जमात",
          },
          right: {
            en: "red litmus turned blue",
            hi: "नीला हुआ लाल लिटमस",
            mr: "निळे झालेले लाल लिटमस",
          },
        },
      },
      {
        id: "litmus",
        name: { en: "Litmus", hi: "लिटमस", mr: "लिटमस" },
        kind: "indicator",
        prompt: {
          en: "Which dye, drawn from lichens, is the laboratory's classic acid-base indicator?",
          hi: "शैकों से निकाला कौन-सा रंग प्रयोगशाला का क्लासिक अम्ल-क्षारक सूचक है?",
          mr: "दगडफुलांतून काढलेला कोणता रंग प्रयोगशाळेचा अभिजात आम्ल-आम्लारी दर्शक आहे?",
        },
        statement: {
          en: "Litmus, extracted from lichens, gives every substance a colour-verdict: red for acid, blue for base.",
          hi: "शैकों से निकला लिटमस हर पदार्थ को रंग का फ़ैसला सुनाता है: अम्ल को लाल, क्षारक को नीला।",
          mr: "दगडफुलांतून काढलेले लिटमस प्रत्येक पदार्थाला रंगाचा निकाल देते: आम्लाला लाल, आम्लारीला निळा.",
        },
        detail: {
          en: "In distilled water it rests purple — the neutral shade between the two camps.",
          hi: "आसुत जल में वह बैंगनी ठहरता है — दोनों ख़ेमों के बीच का उदासीन रंग।",
          mr: "ऊर्ध्वपातित पाण्यात ते जांभळे थांबते — दोन छावण्यांमधली उदासीन छटा.",
        },
        extra: {
          en: "It travels as solution and as paper strips — the strips are the field notebook of chemistry.",
          hi: "वह घोल और काग़ज़ी पट्टियों, दोनों रूपों में चलता है — पट्टियाँ रसायनशास्त्र की फ़ील्ड-डायरी हैं।",
          mr: "ते द्रावण आणि कागदी पट्ट्या, दोन्ही रूपांत फिरते — पट्ट्या म्हणजे रसायनशास्त्राची फील्ड-वही.",
        },
        pair: {
          left: { en: "The lichen's dye", hi: "शैक का रंग", mr: "दगडफुलाचा रंग" },
          right: {
            en: "a colour for every camp",
            hi: "हर ख़ेमे का एक रंग",
            mr: "प्रत्येक छावणीला एक रंग",
          },
        },
      },
      {
        id: "turmeric",
        name: { en: "Turmeric", hi: "हल्दी", mr: "हळद" },
        kind: "indicator",
        prompt: {
          en: "A curry stain on a white shirt turns red exactly where soap touches it. Which kitchen indicator is running that experiment?",
          hi: "सफ़ेद क़मीज़ पर सब्ज़ी का दाग़ ठीक वहीं लाल हो जाता है जहाँ साबुन लगे। रसोई का कौन-सा सूचक वह प्रयोग चला रहा है?",
          mr: "पांढऱ्या सदऱ्यावरचा भाजीचा डाग नेमका तिथेच लाल होतो जिथे साबण लागतो. स्वयंपाकघरातला कोणता दर्शक तो प्रयोग चालवतो आहे?",
        },
        statement: {
          en: "Turmeric stays yellow in acid but turns red with bases — soap on a curry stain performs the test on laundry day.",
          hi: "हल्दी अम्ल में पीली रहती है पर क्षारक से लाल हो जाती है — धुलाई के दिन सब्ज़ी के दाग़ पर साबुन यही जाँच करता है।",
          mr: "हळद आम्लात पिवळी राहते पण आम्लारीने लाल होते — धुण्याच्या दिवशी भाजीच्या डागावर साबण हीच चाचणी करतो.",
        },
        detail: {
          en: "Paint paper with turmeric paste and dry it — you own indicator strips for the price of a pinch.",
          hi: "काग़ज़ पर हल्दी का लेप लगाकर सुखा लीजिए — चुटकी भर के दाम में सूचक-पट्टियाँ आपकी।",
          mr: "कागदावर हळदीचा लेप लावून वाळवा — चिमूटभराच्या किमतीत दर्शक-पट्ट्या तुमच्या.",
        },
        extra: {
          en: "In acid it simply stays yellow — in chemistry, silence is also an answer.",
          hi: "अम्ल में वह बस पीली रहती है — रसायन में चुप्पी भी एक उत्तर है।",
          mr: "आम्लात ती नुसती पिवळी राहते — रसायनशास्त्रात मौनही एक उत्तर आहे.",
        },
        pair: {
          left: {
            en: "The curry stain under soap",
            hi: "साबुन तले सब्ज़ी का दाग़",
            mr: "साबणाखालचा भाजीचा डाग",
          },
          right: { en: "a sudden red", hi: "अचानक लाली", mr: "अचानक लाली" },
        },
      },
      {
        id: "china-rose",
        name: { en: "China rose (gudhal)", hi: "गुड़हल", mr: "जास्वंद" },
        kind: "indicator",
        prompt: {
          en: "Which petal-made indicator turns acids dark pink and bases green?",
          hi: "पंखुड़ियों से बना कौन-सा सूचक अम्लों को गहरा गुलाबी और क्षारकों को हरा कर देता है?",
          mr: "पाकळ्यांपासून बनलेला कोणता दर्शक आम्लांना गडद गुलाबी आणि आम्लारींना हिरवे करतो?",
        },
        statement: {
          en: "China rose indicator signals both ways — dark pink for acids, green for bases: a two-colour message from a flower.",
          hi: "गुड़हल का सूचक दोनों ओर इशारा करता है — अम्ल को गहरा गुलाबी, क्षारक को हरा: फूल का दो-रंगा संदेश।",
          mr: "जास्वंदाचा दर्शक दोन्हीकडे खुणावतो — आम्लाला गडद गुलाबी, आम्लारीला हिरवे: फुलाचा दुरंगी निरोप.",
        },
        pair: {
          left: { en: "The hibiscus petals", hi: "गुड़हल की पंखुड़ियाँ", mr: "जास्वंदाच्या पाकळ्या" },
          right: {
            en: "pink for acid, green for base",
            hi: "अम्ल को गुलाबी, क्षारक को हरा",
            mr: "आम्लाला गुलाबी, आम्लारीला हिरवे",
          },
        },
      },
      {
        id: "neutralisation",
        name: { en: "Neutralisation", hi: "उदासीनीकरण", mr: "उदासिनीकरण" },
        kind: "reaction",
        prompt: {
          en: "Acid and base cancel each other, forming salt and water and setting heat free. What is this reaction called?",
          hi: "अम्ल और क्षारक एक-दूसरे को काटकर लवण और पानी बनाते हैं, गर्मी छोड़ते हुए। इस अभिक्रिया का नाम क्या है?",
          mr: "आम्ल आणि आम्लारी एकमेकांना रद्द करून क्षार आणि पाणी बनवतात, उष्णता सोडत. या अभिक्रियेचे नाव काय?",
        },
        statement: {
          en: "Neutralisation is acid meeting base: salt and water form, heat is released, and both fighters lose their natures.",
          hi: "उदासीनीकरण अम्ल-क्षारक की मुठभेड़ है: लवण और पानी बनते हैं, गर्मी निकलती है, और दोनों योद्धा अपना स्वभाव खो बैठते हैं।",
          mr: "उदासिनीकरण म्हणजे आम्ल-आम्लारीची गाठ: क्षार आणि पाणी बनतात, उष्णता सुटते, आणि दोन्ही लढवय्ये आपला स्वभाव गमावतात.",
        },
        detail: {
          en: "The warmth is no metaphor — mix the dilute pair and the test tube heats in your palm.",
          hi: "गर्मी कोई अलंकार नहीं — तनु जोड़ी मिलाइए और परखनली हथेली में गर्म हो उठती है।",
          mr: "ऊब हा अलंकार नाही — सौम्य जोडी मिसळा आणि परीक्षानळी तळहातात गरम होते.",
        },
        extra: {
          en: "Stomachs, soils, factory drains and stung skin all call on it — one reaction, many rescues.",
          hi: "आमाशय, मिट्टी, कारख़ानों की नालियाँ और डंक लगी त्वचा — सब इसे पुकारते हैं: एक अभिक्रिया, अनेक बचाव।",
          mr: "जठरे, माती, कारखान्यांची गटारे आणि डंख बसलेली त्वचा — सारे याला बोलावतात: एक अभिक्रिया, अनेक सुटका.",
        },
        pair: {
          left: { en: "Acid meeting base", hi: "अम्ल से मिलता क्षारक", mr: "आम्लाला भेटणारी आम्लारी" },
          right: {
            en: "salt, water and warmth",
            hi: "लवण, पानी और गर्मी",
            mr: "क्षार, पाणी आणि ऊब",
          },
        },
      },
      {
        id: "antacid",
        name: {
          en: "The antacid (milk of magnesia)",
          hi: "प्रति-अम्ल (मिल्क ऑफ़ मैग्नीशिया)",
          mr: "आम्लविरोधक (मिल्क ऑफ मॅग्नेशिया)",
        },
        kind: "remedy",
        prompt: {
          en: "Too much stomach acid burns. Which mild base does the doctor send down by the spoonful to calm it?",
          hi: "आमाशय का बढ़ा अम्ल जलन देता है। डॉक्टर कौन-सा हल्का क्षारक चम्मच भर भेजते हैं उसे शांत करने?",
          mr: "जठरातले वाढलेले आम्ल जळजळ देते. डॉक्टर कोणती सौम्य आम्लारी चमचाभर पाठवतात ते शांत करायला?",
        },
        statement: {
          en: "Milk of magnesia, a mild base, neutralises the stomach's excess acid — medicine that is chemistry by the spoon.",
          hi: "मिल्क ऑफ़ मैग्नीशिया, एक हल्का क्षारक, आमाशय का बढ़ा अम्ल उदासीन करता है — चम्मच से पिलाया रसायनशास्त्र।",
          mr: "मिल्क ऑफ मॅग्नेशिया ही सौम्य आम्लारी जठरातले जादा आम्ल उदासीन करते — चमच्याने पाजलेले रसायनशास्त्र.",
        },
        pair: {
          left: { en: "The burning stomach", hi: "जलता आमाशय", mr: "जळणारे जठर" },
          right: {
            en: "a mild base to calm it",
            hi: "शांत करता हल्का क्षारक",
            mr: "शांत करणारी सौम्य आम्लारी",
          },
        },
      },
      {
        id: "lime-soil",
        name: { en: "Lime (chuna) for sour soil", hi: "खट्टी मिट्टी के लिए चूना", mr: "आंबट मातीसाठी चुना" },
        kind: "remedy",
        prompt: {
          en: "A field too acidic for crops is dusted with which base, sack by sack, to sweeten its soil?",
          hi: "फ़सलों के लिए ज़्यादा अम्लीय खेत पर कौन-सा क्षारक बोरी-बोरी छिड़का जाता है, मिट्टी मीठी करने?",
          mr: "पिकांसाठी फार आम्लीय झालेल्या शेतावर कोणती आम्लारी पोत्या-पोत्याने भुरभुरली जाते, माती गोड करायला?",
        },
        statement: {
          en: "Quicklime and slaked lime neutralise acidic soil — the farmer's antacid, prescribed by the sackful.",
          hi: "बिना बुझा और बुझा चूना अम्लीय मिट्टी को उदासीन करते हैं — किसान का प्रति-अम्ल, बोरी के हिसाब से लिखा नुस्ख़ा।",
          mr: "कळीचा आणि विझवलेला चुना आम्लीय माती उदासीन करतो — शेतकऱ्याचा आम्लविरोधक, पोत्याच्या मापाने लिहिलेले औषध.",
        },
        detail: {
          en: "Basic soil gets the opposite prescription — rotting organic manure, gently acidic, pulls it back to the middle.",
          hi: "क्षारकीय मिट्टी को उल्टा नुस्ख़ा मिलता है — सड़ती जैविक खाद, हल्की अम्लीय, उसे बीच में लौटा लाती है।",
          mr: "आम्लारीय मातीला उलटे औषध मिळते — कुजणारे सेंद्रिय खत, सौम्य आम्लीय, तिला मध्यावर परत आणते.",
        },
        extra: {
          en: "Factory waste, often acidic, is limed before any river is made to drink it.",
          hi: "कारख़ानों का प्रायः अम्लीय कचरा नदी को पिलाने से पहले चूने से साधा जाता है।",
          mr: "कारखान्यांचा बहुधा आम्लीय कचरा नदीला पाजण्याआधी चुन्याने साधला जातो.",
        },
        pair: {
          left: { en: "The sour field", hi: "खट्टा खेत", mr: "आंबट शेत" },
          right: { en: "a dusting of lime", hi: "चूने का छिड़काव", mr: "चुन्याची भुरभुर" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Predict the colours: A-blue litmus in lemon juice, B-turmeric paper in soap solution, C-china rose in vinegar. Which trio is right?",
          hi: "रंग बताइए: अ-नींबू रस में नीला लिटमस, ब-साबुन के घोल में हल्दी पत्र, स-सिरके में गुड़हल। कौन-सी तिकड़ी सही है?",
          mr: "रंग सांगा: अ-लिंबाच्या रसात निळे लिटमस, ब-साबणाच्या द्रावणात हळद-कागद, क-व्हिनेगरमध्ये जास्वंद. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: red · B: red · C: dark pink",
            hi: "अ: लाल · ब: लाल · स: गहरा गुलाबी",
            mr: "अ: लाल · ब: लाल · क: गडद गुलाबी",
          },
          {
            en: "A: blue · B: yellow · C: green",
            hi: "अ: नीला · ब: पीला · स: हरा",
            mr: "अ: निळा · ब: पिवळा · क: हिरवा",
          },
          {
            en: "A: red · B: yellow · C: green",
            hi: "अ: लाल · ब: पीला · स: हरा",
            mr: "अ: लाल · ब: पिवळा · क: हिरवा",
          },
          {
            en: "A: blue · B: red · C: dark pink",
            hi: "अ: नीला · ब: लाल · स: गहरा गुलाबी",
            mr: "अ: निळा · ब: लाल · क: गडद गुलाबी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Lemon juice is acid, so blue litmus goes red. Soap is basic, so turmeric goes red too — two different reds from two different causes. Vinegar is acid, and china rose answers acids with dark pink. The trap is assuming one substance gives one colour everywhere: the COLOUR belongs to the indicator-substance pair.",
          hi: "नींबू रस अम्ल है, अतः नीला लिटमस लाल। साबुन क्षारकीय है, अतः हल्दी भी लाल — दो अलग कारणों से दो अलग लालियाँ। सिरका अम्ल है, और गुड़हल अम्लों को गहरे गुलाबी से जवाब देता है। जाल यह मानने में है कि एक पदार्थ हर जगह एक रंग देगा: रंग सूचक-पदार्थ की जोड़ी का होता है।",
          mr: "लिंबाचा रस आम्ल, म्हणून निळे लिटमस लाल. साबण आम्लारीय, म्हणून हळदही लाल — दोन वेगळ्या कारणांनी दोन वेगळ्या लाली. व्हिनेगर आम्ल, आणि जास्वंद आम्लांना गडद गुलाबीने उत्तर देते. सापळा हा की एक पदार्थ सर्वत्र एकच रंग देईल असे मानणे: रंग दर्शक-पदार्थाच्या जोडीचा असतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "An ant's sting injects formic acid, and rubbing moist baking soda on it eases the pain. Why would rubbing vinegar on the same sting be a mistake?",
          hi: "चींटी का डंक फ़ॉर्मिक अम्ल चुभोता है, और उस पर गीला खाने का सोडा मलने से आराम मिलता है। उसी डंक पर सिरका मलना ग़लती क्यों होगी?",
          mr: "मुंगीचा डंख फॉर्मिक आम्ल टोचतो, आणि त्यावर ओला खाण्याचा सोडा चोळल्याने आराम मिळतो. त्याच डंखावर व्हिनेगर चोळणे चूक का ठरेल?",
        },
        choices: [
          {
            en: "The pain is an acid's work; soda, a mild base, neutralises it — vinegar is more acid and only reinforces the attacker",
            hi: "दर्द अम्ल का काम है; सोडा, हल्का क्षारक, उसे उदासीन करता है — सिरका और अम्ल है, वह हमलावर की ही कुमक है",
            mr: "वेदना आम्लाचे काम; सोडा ही सौम्य आम्लारी ते उदासीन करते — व्हिनेगर आणखी आम्ल आहे, ते हल्लेखोराचीच कुमक",
          },
          {
            en: "Vinegar is too costly to waste on stings",
            hi: "सिरका डंक पर बर्बाद करने के लिए बहुत महँगा है",
            mr: "व्हिनेगर डंखावर वाया घालवण्यासाठी फार महाग आहे",
          },
          {
            en: "Soda works only because it is white",
            hi: "सोडा केवल इसलिए काम करता है कि वह सफ़ेद है",
            mr: "सोडा फक्त पांढरा असल्यामुळे चालतो",
          },
          {
            en: "Stings can only be treated with water",
            hi: "डंक का इलाज केवल पानी से हो सकता है",
            mr: "डंखावर फक्त पाण्यानेच उपचार होऊ शकतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Choosing a remedy means first naming the enemy. The sting's pain is formic acid at work, so the cure must come from the OTHER camp: baking soda neutralises it into harmless salt and water. Vinegar, an acid itself, joins the wrong side. The same logic runs the antacid bottle and the farmer's lime sack — always cancel with the opposite.",
          hi: "इलाज चुनने से पहले दुश्मन का नाम लेना पड़ता है। डंक का दर्द फ़ॉर्मिक अम्ल की कारगुज़ारी है, अतः दवा दूसरे ख़ेमे से आनी चाहिए: सोडा उसे निरापद लवण और पानी में उदासीन कर देता है। सिरका स्वयं अम्ल है — ग़लत पाले में खड़ा। यही तर्क प्रति-अम्ल की शीशी और किसान की चूने की बोरी चलाता है — काटो हमेशा विपरीत से।",
          mr: "उपाय निवडण्याआधी शत्रूचे नाव घ्यावे लागते. डंखाची वेदना फॉर्मिक आम्लाची करामत, म्हणून औषध दुसऱ्या छावणीतून यायला हवे: सोडा त्याला निरुपद्रवी क्षार आणि पाण्यात उदासीन करतो. व्हिनेगर स्वतः आम्ल — चुकीच्या बाजूला उभे. हाच तर्क आम्लविरोधकाची बाटली आणि शेतकऱ्याचे चुन्याचे पोते चालवतो — रद्द करा नेहमी विरुद्धाने.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Physical and Chemical Changes (reversible vs newborn)       */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-7-physical-chemical-changes",
    subject: "SCIENCE",
    classLevel: 7,
    chapter: {
      en: "Chapter 6 — Physical and Chemical Changes",
      hi: "अध्याय 6 — भौतिक एवं रासायनिक परिवर्तन",
      mr: "प्रकरण 6 — भौतिक व रासायनिक बदल",
    },
    name: {
      en: "Physical and Chemical Changes",
      hi: "भौतिक एवं रासायनिक परिवर्तन",
      mr: "भौतिक व रासायनिक बदल",
    },
    summary: {
      en: "Two kinds of change: the fold-and-melt kind that leaves the substance itself untouched, and the burn-and-curdle kind that births something new — with rust, crystals and a dazzling ribbon as witnesses.",
      hi: "परिवर्तन की दो जातियाँ: मोड़ने-पिघलने वाली, जो पदार्थ को अनछुआ छोड़ती है, और जलने-जमने वाली, जो कुछ नया जन्माती है — गवाही में ज़ंग, रवे और एक चौंधियाता फ़ीता।",
      mr: "बदलांच्या दोन जाती: दुमडण्या-वितळण्याची, जी पदार्थाला अस्पर्श ठेवते, आणि जळण्या-विरजण्याची, जी नवे काही जन्माला घालते — साक्षीला गंज, स्फटिक आणि एक दिपवणारी फीत.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "physical",
        name: { en: "A physical change", hi: "भौतिक परिवर्तन", mr: "भौतिक बदल" },
        kind: "change",
        prompt: {
          en: "Ice melts, paper is folded, wax softens — shape or state shifts, yet no new substance is born. What kind of change is this?",
          hi: "बर्फ़ पिघलती है, काग़ज़ मुड़ता है, मोम नरम पड़ता है — रूप या अवस्था बदलती है, पर कोई नया पदार्थ नहीं जन्मता। यह किस जाति का परिवर्तन है?",
          mr: "बर्फ वितळतो, कागद दुमडतो, मेण मऊ होते — रूप वा अवस्था बदलते, पण नवा पदार्थ जन्मत नाही. हा कोणत्या जातीचा बदल?",
        },
        statement: {
          en: "A physical change alters shape, size or state but makes no new substance — and the old one can usually be brought back.",
          hi: "भौतिक परिवर्तन रूप, आकार या अवस्था बदलता है पर कोई नया पदार्थ नहीं बनाता — और पुराना प्रायः लौटाया जा सकता है।",
          mr: "भौतिक बदल रूप, आकार वा अवस्था बदलतो पण नवा पदार्थ बनवत नाही — आणि जुना बहुधा परत आणता येतो.",
        },
        pair: {
          left: { en: "The melted ice", hi: "पिघली बर्फ़", mr: "वितळलेला बर्फ" },
          right: {
            en: "water it always was",
            hi: "पानी, जो वह सदा था",
            mr: "पाणी, जे ते नेहमीच होते",
          },
        },
      },
      {
        id: "chemical",
        name: { en: "A chemical change", hi: "रासायनिक परिवर्तन", mr: "रासायनिक बदल" },
        kind: "change",
        prompt: {
          en: "Paper burns to ash and smoke — substances that were never paper at all. What kind of change is this?",
          hi: "काग़ज़ जलकर राख और धुआँ बनता है — ऐसे पदार्थ जो कभी काग़ज़ थे ही नहीं। यह किस जाति का परिवर्तन है?",
          mr: "कागद जळून राख आणि धूर होतो — असे पदार्थ जे कधी कागद नव्हतेच. हा कोणत्या जातीचा बदल?",
        },
        statement: {
          en: "A chemical change creates new substances — ash and smoke cannot be folded back into paper by any trick.",
          hi: "रासायनिक परिवर्तन नए पदार्थ रचता है — राख और धुएँ को कोई तरकीब वापस काग़ज़ नहीं मोड़ सकती।",
          mr: "रासायनिक बदल नवे पदार्थ घडवतो — राख आणि धुराला कोणतीही युक्ती परत कागदात दुमडू शकत नाही.",
        },
        detail: {
          en: "Its telltales: heat, light, a gas, a smell, a colour — some newborn thing that was not on the table before.",
          hi: "उसकी निशानियाँ: गर्मी, रोशनी, कोई गैस, गंध, रंग — कोई नवजात चीज़ जो पहले मेज़ पर नहीं थी।",
          mr: "त्याच्या खुणा: उष्णता, प्रकाश, एखादा वायू, गंध, रंग — आधी टेबलावर नसलेले नवजात काही.",
        },
        extra: {
          en: "Most are one-way doors — the reverse journey needs far more than cooling down.",
          hi: "अधिकांश एकतरफ़ा दरवाज़े हैं — वापसी की राह ठंडा होने भर से नहीं खुलती।",
          mr: "बहुतेक एकतर्फी दारे — परतीची वाट नुसत्या थंड होण्याने उघडत नाही.",
        },
        pair: {
          left: { en: "The burnt paper", hi: "जला काग़ज़", mr: "जळलेला कागद" },
          right: {
            en: "ash that was never paper",
            hi: "राख, जो कभी काग़ज़ न थी",
            mr: "राख, जी कधी कागद नव्हती",
          },
        },
      },
      {
        id: "rusting",
        name: { en: "Rusting", hi: "ज़ंग लगना", mr: "गंजणे" },
        kind: "reaction",
        prompt: {
          en: "Iron left in damp air slowly grows a flaky brown coat. What is this slow chemical change called?",
          hi: "नम हवा में छूटे लोहे पर धीरे-धीरे भूरी परतदार चादर चढ़ती है। इस धीमे रासायनिक परिवर्तन का नाम क्या है?",
          mr: "दमट हवेत राहिलेल्या लोखंडावर हळूहळू तपकिरी पापुद्र्याचे कवच चढते. या संथ रासायनिक बदलाचे नाव काय?",
        },
        statement: {
          en: "Rusting turns iron into flaky brown rust — it needs BOTH air and moisture, and the coat is a brand-new substance.",
          hi: "ज़ंग लोहे को भूरी परतदार ज़ंग में बदलता है — उसे हवा और नमी दोनों चाहिए, और वह चादर नया ही पदार्थ है।",
          mr: "गंजणे लोखंडाला तपकिरी पापुद्री गंजात बदलते — त्याला हवा आणि ओल दोन्ही लागतात, आणि ते कवच नवाच पदार्थ आहे.",
        },
        detail: {
          en: "Paint, oil and grease all win the same way — they lock the pair of culprits out of iron's reach.",
          hi: "पेंट, तेल और ग्रीस एक ही ढंग से जीतते हैं — दोनों अपराधियों को लोहे की पहुँच से बाहर ताला लगाकर।",
          mr: "रंग, तेल आणि ग्रीस एकाच रीतीने जिंकतात — दोन्ही अपराध्यांना लोखंडाच्या आवाक्याबाहेर कुलूप लावून.",
        },
        extra: {
          en: "Ships, bridges and rail lines budget crores against this one quiet reaction.",
          hi: "जहाज़, पुल और रेल-पटरियाँ इस एक ख़ामोश अभिक्रिया के ख़िलाफ़ करोड़ों का बजट रखती हैं।",
          mr: "जहाजे, पूल आणि रेल्वे-रूळ या एका शांत अभिक्रियेविरुद्ध कोट्यवधींचे अंदाजपत्रक ठेवतात.",
        },
        pair: {
          left: { en: "Iron in damp air", hi: "नम हवा में लोहा", mr: "दमट हवेतले लोखंड" },
          right: { en: "a flaky brown coat", hi: "भूरी परतदार चादर", mr: "तपकिरी पापुद्री कवच" },
        },
      },
      {
        id: "galvanisation",
        name: { en: "Galvanisation", hi: "यशदलेपन (गैल्वनीकरण)", mr: "जस्तलेपन (गॅल्व्हनायझेशन)" },
        kind: "protection",
        prompt: {
          en: "Which protection wraps iron in a thin coat of zinc, so that damp air never finds the metal beneath?",
          hi: "कौन-सी सुरक्षा लोहे पर जस्ते की पतली परत चढ़ाती है, ताकि नम हवा नीचे की धातु तक पहुँचे ही नहीं?",
          mr: "कोणते संरक्षण लोखंडावर जस्ताचा पातळ थर चढवते, जेणेकरून दमट हवा खालच्या धातूपर्यंत पोहोचूच नये?",
        },
        statement: {
          en: "Galvanisation coats iron with zinc — the sacrificial metal faces the weather so the iron underneath need not.",
          hi: "यशदलेपन लोहे पर जस्ता चढ़ाता है — बलिदानी धातु मौसम झेलती है ताकि नीचे के लोहे को न झेलना पड़े।",
          mr: "जस्तलेपन लोखंडावर जस्त चढवते — बळी जाणारा धातू हवामान झेलतो म्हणजे खालच्या लोखंडाला झेलावे लागू नये.",
        },
        pair: {
          left: { en: "The zinc coat", hi: "जस्ते की परत", mr: "जस्ताचा थर" },
          right: {
            en: "weather met on iron's behalf",
            hi: "लोहे की ओर से झेला मौसम",
            mr: "लोखंडाच्या वतीने झेललेले हवामान",
          },
        },
      },
      {
        id: "crystallisation",
        name: { en: "Crystallisation", hi: "क्रिस्टलीकरण", mr: "स्फटिकीकरण" },
        kind: "method",
        prompt: {
          en: "From a hot, saturated copper sulphate solution cooling slowly, large even-shaped blue crystals appear. What is this method called?",
          hi: "धीरे-धीरे ठंडे होते गर्म, संतृप्त तूतिया के घोल से बड़े, सुडौल नीले रवे प्रकट होते हैं। इस विधि का नाम क्या है?",
          mr: "हळूहळू निवणाऱ्या गरम, संपृक्त मोरचूद द्रावणातून मोठे, रेखीव निळे स्फटिक प्रकटतात. या पद्धतीचे नाव काय?",
        },
        statement: {
          en: "Crystallisation grows large, pure crystals from a cooling saturated solution — order arriving slowly out of syrup.",
          hi: "क्रिस्टलीकरण ठंडे होते संतृप्त घोल से बड़े, शुद्ध रवे उगाता है — शरबत में से धीरे-धीरे आती सुव्यवस्था।",
          mr: "स्फटिकीकरण निवणाऱ्या संपृक्त द्रावणातून मोठे, शुद्ध स्फटिक वाढवते — पाकातून सावकाश येणारी सुव्यवस्था.",
        },
        detail: {
          en: "It is a PHYSICAL change: the crystals are still copper sulphate, only better dressed.",
          hi: "यह भौतिक परिवर्तन है: रवे अब भी तूतिया ही हैं, बस बेहतर पोशाक में।",
          mr: "हा भौतिक बदल आहे: स्फटिक अजूनही मोरचूदच, फक्त चांगल्या पोशाखात.",
        },
        extra: {
          en: "Sea-salt is its rougher cousin — evaporation in a hurry, crystals without the patience.",
          hi: "समुद्री नमक इसका खुरदुरा चचेरा भाई है — जल्दी का वाष्पन, बिना सब्र के रवे।",
          mr: "समुद्री मीठ हा त्याचा राठ चुलतभाऊ — घाईचे बाष्पीभवन, संयमाविनाचे स्फटिक.",
        },
        pair: {
          left: {
            en: "The cooling blue solution",
            hi: "ठंडा होता नीला घोल",
            mr: "निवणारे निळे द्रावण",
          },
          right: { en: "even-shaped crystals", hi: "सुडौल रवे", mr: "रेखीव स्फटिक" },
        },
      },
      {
        id: "curdling",
        name: { en: "The curdling of milk", hi: "दूध का जमना", mr: "दुधाचे विरजणे" },
        kind: "reaction",
        prompt: {
          en: "Warm milk with a spoon of starter becomes curd by morning, and no trick returns it to milk. Which everyday change is this?",
          hi: "जामन की चम्मच पड़ा गुनगुना दूध सुबह तक दही बन जाता है, और कोई तरकीब उसे दूध नहीं लौटाती। यह कौन-सा रोज़मर्रा का परिवर्तन है?",
          mr: "विरजणाचा चमचा पडलेले कोमट दूध सकाळपर्यंत दही होते, आणि कोणतीही युक्ती त्याला दूध परत करत नाही. हा कोणता रोजचा बदल?",
        },
        statement: {
          en: "Milk setting into curd is a chemical change — a new substance forms, and there is no road back to milk.",
          hi: "दूध का दही बनना रासायनिक परिवर्तन है — नया पदार्थ बनता है, और दूध तक लौटती कोई सड़क नहीं।",
          mr: "दुधाचे दही होणे हा रासायनिक बदल — नवा पदार्थ बनतो, आणि दुधाकडे परतणारा रस्ता नाही.",
        },
        pair: {
          left: { en: "Milk by night", hi: "रात का दूध", mr: "रात्रीचे दूध" },
          right: {
            en: "curd by morning, no return",
            hi: "सुबह का दही, वापसी नहीं",
            mr: "सकाळचे दही, परतीचा मार्ग नाही",
          },
        },
      },
      {
        id: "magnesium",
        name: {
          en: "The burning magnesium ribbon",
          hi: "जलता मैग्नीशियम फ़ीता",
          mr: "जळणारी मॅग्नेशियम फीत",
        },
        kind: "reaction",
        prompt: {
          en: "Which classroom ribbon burns with a dazzling white flame, leaving a white ash whose solution turns red litmus blue?",
          hi: "कक्षा का कौन-सा फ़ीता चौंधियाती सफ़ेद लौ से जलता है, ऐसी सफ़ेद राख छोड़ता हुआ जिसका घोल लाल लिटमस को नीला कर दे?",
          mr: "वर्गातली कोणती फीत दिपवणाऱ्या पांढऱ्या ज्योतीने जळते, अशी पांढरी राख ठेवत जिचे द्रावण लाल लिटमसला निळे करते?",
        },
        statement: {
          en: "Magnesium ribbon burns with brilliant white light into magnesium oxide — an ash that dissolves into a base.",
          hi: "मैग्नीशियम फ़ीता चमकदार सफ़ेद रोशनी से जलकर मैग्नीशियम ऑक्साइड बनता है — ऐसी राख जो घुलकर क्षारक बन जाती है।",
          mr: "मॅग्नेशियम फीत झळझळीत पांढऱ्या प्रकाशाने जळून मॅग्नेशियम ऑक्साइड होते — विरघळून आम्लारी बनणारी राख.",
        },
        detail: {
          en: "Teachers warn: never stare at the flame — its light is fierce enough to hurt the eyes.",
          hi: "शिक्षक चेताते हैं: लौ को घूरिए मत — उसकी रोशनी आँखें दुखाने जितनी तीव्र है।",
          mr: "शिक्षक बजावतात: ज्योतीकडे टक लावू नका — तिचा प्रकाश डोळे दुखवण्याइतका तीव्र आहे.",
        },
        extra: {
          en: "The ash-in-water experiment stitches two chapters together: a chemical change delivering a base.",
          hi: "राख-पानी का प्रयोग दो अध्याय सी देता है: रासायनिक परिवर्तन जो एक क्षारक सौंपता है।",
          mr: "राख-पाण्याचा प्रयोग दोन प्रकरणे शिवतो: आम्लारी सोपवणारा रासायनिक बदल.",
        },
        pair: {
          left: { en: "The dazzling ribbon", hi: "चौंधियाता फ़ीता", mr: "दिपवणारी फीत" },
          right: {
            en: "white ash, basic water",
            hi: "सफ़ेद राख, क्षारकीय पानी",
            mr: "पांढरी राख, आम्लारीय पाणी",
          },
        },
      },
      {
        id: "vinegar-soda",
        name: {
          en: "Vinegar meeting baking soda",
          hi: "सिरके से मिलता खाने का सोडा",
          mr: "व्हिनेगरला भेटणारा खाण्याचा सोडा",
        },
        kind: "reaction",
        prompt: {
          en: "Which kitchen pair fizzes furiously, releasing the gas that turns lime water milky?",
          hi: "रसोई की कौन-सी जोड़ी ज़ोर से झाग उठाती है, वह गैस छोड़ती हुई जो चूने के पानी को दूधिया कर दे?",
          mr: "स्वयंपाकघरातली कोणती जोडी जोरात फसफसते, चुन्याच्या निवळीला दुधाळ करणारा वायू सोडत?",
        },
        statement: {
          en: "Vinegar and baking soda fizz out carbon dioxide — the escaping gas is the visible receipt of a chemical change.",
          hi: "सिरका और खाने का सोडा कार्बन डाइऑक्साइड की फुहार छोड़ते हैं — निकलती गैस रासायनिक परिवर्तन की दिखती रसीद है।",
          mr: "व्हिनेगर आणि खाण्याचा सोडा कार्बन डायऑक्साइड फसफसवतात — निसटणारा वायू ही रासायनिक बदलाची दिसणारी पावती.",
        },
        pair: {
          left: { en: "The kitchen fizz", hi: "रसोई की फुहार", mr: "स्वयंपाकघरातली फसफस" },
          right: {
            en: "gas that clouds lime water",
            hi: "चूना-पानी धुँधलाती गैस",
            mr: "चुन्याची निवळी ढगाळणारा वायू",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Which list holds ONLY physical changes?",
          hi: "किस सूची में केवल भौतिक परिवर्तन हैं?",
          mr: "कोणत्या यादीत फक्त भौतिक बदल आहेत?",
        },
        choices: [
          {
            en: "Melting ice · folding paper · dissolving salt in water",
            hi: "बर्फ़ पिघलना · काग़ज़ मोड़ना · पानी में नमक घोलना",
            mr: "बर्फ वितळणे · कागद दुमडणे · पाण्यात मीठ विरघळवणे",
          },
          {
            en: "Melting ice · burning paper · dissolving salt",
            hi: "बर्फ़ पिघलना · काग़ज़ जलाना · नमक घोलना",
            mr: "बर्फ वितळणे · कागद जाळणे · मीठ विरघळवणे",
          },
          {
            en: "Rusting iron · folding paper · melting wax",
            hi: "लोहे पर ज़ंग · काग़ज़ मोड़ना · मोम पिघलाना",
            mr: "लोखंडाचा गंज · कागद दुमडणे · मेण वितळवणे",
          },
          {
            en: "Curdling milk · melting ice · folding paper",
            hi: "दूध जमना · बर्फ़ पिघलना · काग़ज़ मोड़ना",
            mr: "दूध विरजणे · बर्फ वितळणे · कागद दुमडणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Test each member: can the substance come back unchanged? Melted ice refreezes, folded paper unfolds, dissolved salt returns on evaporation — all physical. The other lists each smuggle in one one-way door: burning, rusting or curdling, where a NEW substance appears and the road back is closed.",
          hi: "हर सदस्य को परखिए: क्या पदार्थ अनबदला लौट सकता है? पिघली बर्फ़ फिर जमती है, मुड़ा काग़ज़ खुलता है, घुला नमक वाष्पन पर लौट आता है — सब भौतिक। बाक़ी सूचियों में एक-एक एकतरफ़ा दरवाज़ा छिपा है: जलना, ज़ंग या जमना, जहाँ नया पदार्थ प्रकट होता है और वापसी की सड़क बंद।",
          mr: "प्रत्येक सदस्याला तपासा: पदार्थ न बदलता परत येऊ शकतो का? वितळलेला बर्फ पुन्हा गोठतो, दुमडलेला कागद उलगडतो, विरघळलेले मीठ बाष्पीभवनाने परतते — सारे भौतिक. बाकी याद्यांत एक-एक एकतर्फी दार लपले आहे: जळणे, गंजणे वा विरजणे, जिथे नवा पदार्थ प्रकटतो आणि परतीचा रस्ता बंद.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A burning candle is the textbook's favourite riddle: teachers call it BOTH kinds of change at once. What are the two changes running together?",
          hi: "जलती मोमबत्ती पाठ्यपुस्तक की प्रिय पहेली है: शिक्षक उसे एक साथ दोनों जाति का परिवर्तन कहते हैं। साथ-साथ चलते वे दो परिवर्तन कौन-से हैं?",
          mr: "जळणारी मेणबत्ती ही पाठ्यपुस्तकाची आवडती कोडी: शिक्षक तिला एकाच वेळी दोन्ही जातींचा बदल म्हणतात. सोबत चालणारे ते दोन बदल कोणते?",
        },
        choices: [
          {
            en: "The wax MELTING is physical — it can resolidify; the wax BURNING to gases and soot is chemical — nothing brings those back to wax",
            hi: "मोम का पिघलना भौतिक है — वह फिर जम सकता है; मोम का जलकर गैसें और कालिख बनना रासायनिक है — उन्हें कुछ भी मोम नहीं लौटाता",
            mr: "मेणाचे वितळणे भौतिक — ते पुन्हा घट्ट होऊ शकते; मेणाचे जळून वायू आणि काजळी होणे रासायनिक — त्यांना काहीही मेणात परत आणत नाही",
          },
          {
            en: "The flame is physical and the wick is chemical",
            hi: "लौ भौतिक है और बत्ती रासायनिक",
            mr: "ज्योत भौतिक आणि वात रासायनिक",
          },
          {
            en: "Both changes are physical because the candle keeps its shape a while",
            hi: "दोनों परिवर्तन भौतिक हैं क्योंकि मोमबत्ती कुछ देर आकार रखती है",
            mr: "दोन्ही बदल भौतिक कारण मेणबत्ती काही वेळ आकार राखते",
          },
          {
            en: "Nothing chemical happens until the candle is fully gone",
            hi: "जब तक मोमबत्ती पूरी न चुके, कुछ रासायनिक नहीं होता",
            mr: "मेणबत्ती पूर्ण संपेपर्यंत रासायनिक काही घडत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Watch the candle as two experiments sharing one wick. Near the flame, solid wax melts and trickles — cool it and it hardens back: physical. In the flame, wax vapour burns to carbon dioxide, water vapour and soot — new substances with no road home: chemical. One object, two changes, and the sorting rule — is anything NEW born? — separates them cleanly.",
          hi: "मोमबत्ती को एक बत्ती साझा करते दो प्रयोगों की तरह देखिए। लौ के पास ठोस मोम पिघलकर बहता है — ठंडा कीजिए तो फिर जम जाता है: भौतिक। लौ के भीतर मोम की भाप जलकर कार्बन डाइऑक्साइड, जलवाष्प और कालिख बनती है — नए पदार्थ, जिनका घर लौटने का रास्ता नहीं: रासायनिक। एक वस्तु, दो परिवर्तन, और छाँटने का नियम — क्या कुछ नया जन्मा? — दोनों को साफ़ अलग कर देता है।",
          mr: "मेणबत्तीकडे एक वात वाटून घेणाऱ्या दोन प्रयोगांसारखे पाहा. ज्योतीजवळ घट्ट मेण वितळून ओघळते — थंड करा आणि पुन्हा घट्ट होते: भौतिक. ज्योतीच्या आत मेणाची वाफ जळून कार्बन डायऑक्साइड, बाष्प आणि काजळी होते — घरी परतायचा रस्ता नसलेले नवे पदार्थ: रासायनिक. एक वस्तू, दोन बदल, आणि निवडीचा नियम — नवे काही जन्मले का? — दोघांना स्वच्छ वेगळे करतो.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 10 — Respiration in Organisms (the slow fire in every cell)     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-7-respiration-in-organisms",
    subject: "SCIENCE",
    classLevel: 7,
    chapter: {
      en: "Chapter 10 — Respiration in Organisms",
      hi: "अध्याय 10 — जीवों में श्वसन",
      mr: "प्रकरण 10 — सजीवांतील श्वसन",
    },
    name: {
      en: "Respiration in Organisms",
      hi: "जीवों में श्वसन",
      mr: "सजीवांतील श्वसन",
    },
    summary: {
      en: "The slow fire in every cell: oxygen's route and the oxygen-less shortcut, the sprinter's cramp, the diaphragm's pump — and spiracles, moist skin and gills, three other ways to breathe.",
      hi: "हर कोशिका की धीमी आग: ऑक्सीजन की राह और बिना-ऑक्सीजन की पगडंडी, धावक की ऐंठन, डायाफ़्राम का पंप — और श्वास-रंध्र, नम त्वचा, गलफड़े: साँस की तीन और राहें।",
      mr: "प्रत्येक पेशीतली संथ आग: ऑक्सिजनची वाट आणि ऑक्सिजनविनाची पायवाट, धावपटूचा पेटका, श्वासपटलाचा पंप — आणि श्वासरंध्रे, ओली त्वचा, कल्ले: श्वासाच्या आणखी तीन वाटा.",
    },
    position: 10,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "cellular",
        name: { en: "Cellular respiration", hi: "कोशिकीय श्वसन", mr: "पेशीय श्वसन" },
        kind: "process",
        prompt: {
          en: "Inside every cell, food is broken down with oxygen to set its energy free. What is this process called?",
          hi: "हर कोशिका के भीतर भोजन को ऑक्सीजन के साथ तोड़कर उसकी ऊर्जा मुक्त की जाती है। इस प्रक्रिया का नाम क्या है?",
          mr: "प्रत्येक पेशीच्या आत अन्न ऑक्सिजनसह मोडून त्याची ऊर्जा मोकळी केली जाते. या प्रक्रियेचे नाव काय?",
        },
        statement: {
          en: "Cellular respiration burns food gently inside cells — the released energy runs everything else the body does.",
          hi: "कोशिकीय श्वसन कोशिकाओं के भीतर भोजन को धीमे जलाता है — निकली ऊर्जा शरीर का बाक़ी सब काम चलाती है।",
          mr: "पेशीय श्वसन पेशींच्या आत अन्न हळुवार जाळते — सुटलेली ऊर्जा शरीराचे बाकी सारे काम चालवते.",
        },
        detail: {
          en: "The slow fire has no flame — enzymes, not sparks, do this burning.",
          hi: "धीमी आग में लौ नहीं — यह जलाना चिंगारियाँ नहीं, एंज़ाइम करते हैं।",
          mr: "संथ आगीत ज्योत नाही — हे जाळणे ठिणग्या नव्हे, विकरे करतात.",
        },
        extra: {
          en: "Every living cell runs it without pause, asleep or awake — stopping is not among its options.",
          hi: "हर जीवित कोशिका इसे बिना रुके चलाती है, सोते-जागते — रुकना इसके विकल्पों में नहीं।",
          mr: "प्रत्येक जिवंत पेशी हे अखंड चालवते, झोपेत-जागेपणी — थांबणे तिच्या पर्यायांत नाही.",
        },
        pair: {
          left: { en: "Food met by oxygen", hi: "ऑक्सीजन से मिला भोजन", mr: "ऑक्सिजनला भेटलेले अन्न" },
          right: { en: "energy set free", hi: "मुक्त हुई ऊर्जा", mr: "मोकळी झालेली ऊर्जा" },
        },
      },
      {
        id: "anaerobic",
        name: { en: "Anaerobic respiration", hi: "अवायवीय श्वसन", mr: "विनॉक्सिश्वसन" },
        kind: "process",
        prompt: {
          en: "Yeast — and your own tired muscles — can pull energy from food entirely WITHOUT oxygen. What is this oxygen-less route called?",
          hi: "ख़मीर — और आपकी अपनी थकी माँसपेशियाँ — भोजन से ऊर्जा बिलकुल बिना ऑक्सीजन के खींच सकती हैं। इस बिना-ऑक्सीजन राह का नाम क्या है?",
          mr: "यीस्ट — आणि तुमचे स्वतःचे थकलेले स्नायू — अन्नातून ऊर्जा पूर्णपणे ऑक्सिजनशिवाय ओढू शकतात. या ऑक्सिजनविनाच्या वाटेचे नाव काय?",
        },
        statement: {
          en: "Anaerobic respiration works without oxygen — yeast makes alcohol by it, and overworked muscles make lactic acid.",
          hi: "अवायवीय श्वसन बिना ऑक्सीजन चलता है — ख़मीर उससे अल्कोहल बनाता है, और हद से थकी माँसपेशियाँ लैक्टिक अम्ल।",
          mr: "विनॉक्सिश्वसन ऑक्सिजनशिवाय चालते — यीस्ट त्याने अल्कोहोल बनवते, आणि अति थकलेले स्नायू लॅक्टिक आम्ल.",
        },
        detail: {
          en: "It pays poorly — far less energy per meal than the oxygen route ever yields.",
          hi: "यह कम चुकाता है — ऑक्सीजन वाली राह से प्रति भोजन कहीं कम ऊर्जा।",
          mr: "हे कमी देते — ऑक्सिजनच्या वाटेहून प्रत्येक जेवणामागे कितीतरी कमी ऊर्जा.",
        },
        extra: {
          en: "Yeast's version raises bread and brews — the dough's bubbles are its exhaled carbon dioxide.",
          hi: "ख़मीर का संस्करण रोटी फुलाता और आसव बनाता है — आटे के बुलबुले उसकी छोड़ी कार्बन डाइऑक्साइड हैं।",
          mr: "यीस्टची आवृत्ती पाव फुगवते आणि आसव घडवते — कणकेचे बुडबुडे म्हणजे तिने सोडलेला कार्बन डायऑक्साइड.",
        },
        pair: {
          left: { en: "The oxygen-less route", hi: "बिना-ऑक्सीजन राह", mr: "ऑक्सिजनविनाची वाट" },
          right: {
            en: "less energy, quick loan",
            hi: "कम ऊर्जा, फ़ौरी उधार",
            mr: "कमी ऊर्जा, तातडीचे कर्ज",
          },
        },
      },
      {
        id: "lactic",
        name: { en: "Lactic acid", hi: "लैक्टिक अम्ल", mr: "लॅक्टिक आम्ल" },
        kind: "substance",
        prompt: {
          en: "After a sudden sprint your calves knot and ache. Which acid, piled up in oxygen-starved muscles, is to blame?",
          hi: "अचानक दौड़ के बाद पिंडलियाँ ऐंठकर दुखती हैं। ऑक्सीजन-भूखी माँसपेशियों में जमा कौन-सा अम्ल दोषी है?",
          mr: "अचानक धावल्यावर पोटऱ्या आखडून दुखतात. ऑक्सिजन-भुकेल्या स्नायूंत साचलेले कोणते आम्ल दोषी?",
        },
        statement: {
          en: "Lactic acid collects when muscles outrun their oxygen supply — the cramp is its calling card.",
          hi: "जब माँसपेशियाँ अपनी ऑक्सीजन-आपूर्ति से आगे दौड़ जाती हैं तो लैक्टिक अम्ल जमा होता है — ऐंठन उसका परिचय-पत्र है।",
          mr: "स्नायू आपल्या ऑक्सिजन-पुरवठ्याच्या पुढे धावले की लॅक्टिक आम्ल साचते — पेटका हे त्याचे ओळखपत्र.",
        },
        detail: {
          en: "A hot-water bath or a massage eases the knot — better blood flow carries the acid away for disposal.",
          hi: "गर्म पानी का सेंक या मालिश गाँठ खोल देती है — बेहतर रक्त-प्रवाह अम्ल को निपटान के लिए बहा ले जाता है।",
          mr: "गरम पाण्याचा शेक वा मालीश गाठ सोडवते — सुधारलेला रक्तप्रवाह आम्लाला विल्हेवाटीसाठी वाहून नेतो.",
        },
        extra: {
          en: "The debt is repaid later — that is why you pant AFTER the race is over.",
          hi: "उधार बाद में चुकता है — इसीलिए हाँफना दौड़ ख़त्म होने के बाद भी चलता है।",
          mr: "कर्ज नंतर फिटते — म्हणूनच धाप शर्यत संपल्यावरही चालू राहते.",
        },
        pair: {
          left: { en: "The sprinter's cramp", hi: "धावक की ऐंठन", mr: "धावपटूचा पेटका" },
          right: {
            en: "an acid's calling card",
            hi: "अम्ल का परिचय-पत्र",
            mr: "आम्लाचे ओळखपत्र",
          },
        },
      },
      {
        id: "breathing-rate",
        name: { en: "The breathing rate", hi: "श्वसन दर", mr: "श्वसनाचा वेग" },
        kind: "measure",
        prompt: {
          en: "An adult at rest takes about 15 to 18 of them each minute, and hard play multiplies the count. What is this count called?",
          hi: "विश्राम में वयस्क हर मिनट इनमें से लगभग 15 से 18 लेता है, और कड़ा खेल गिनती कई गुना कर देता है। इस गिनती का नाम क्या है?",
          mr: "विश्रांतीत प्रौढ दर मिनिटाला यांतले सुमारे 15 ते 18 घेतो, आणि दमवणारा खेळ मोजणी कैकपट करतो. या मोजणीचे नाव काय?",
        },
        statement: {
          en: "The breathing rate counts breaths per minute — about 15 to 18 at rest, and several-fold higher when the body demands more oxygen.",
          hi: "श्वसन दर प्रति मिनट साँसें गिनती है — विश्राम में लगभग 15 से 18, और शरीर के ज़्यादा ऑक्सीजन माँगते ही कई गुना।",
          mr: "श्वसनाचा वेग दर मिनिटाला श्वास मोजतो — विश्रांतीत सुमारे 15 ते 18, आणि शरीराने जास्त ऑक्सिजन मागताच कैकपट.",
        },
        pair: {
          left: { en: "Breaths in a minute", hi: "मिनट भर की साँसें", mr: "मिनिटभरातले श्वास" },
          right: {
            en: "fifteen-odd at rest",
            hi: "विश्राम में पंद्रह-सोलह",
            mr: "विश्रांतीत पंधरा-सोळा",
          },
        },
      },
      {
        id: "diaphragm",
        name: { en: "The diaphragm", hi: "डायाफ़्राम (मध्यपट)", mr: "श्वासपटल" },
        kind: "organ",
        prompt: {
          en: "Which muscular sheet below the lungs moves down to draw breath in and rises to push it out?",
          hi: "फेफड़ों के नीचे की कौन-सी माँसल चादर नीचे उतरकर साँस भीतर खींचती है और उठकर बाहर धकेलती है?",
          mr: "फुप्फुसांखालची कोणती स्नायूची चादर खाली उतरून श्वास आत ओढते आणि वर येऊन बाहेर ढकलते?",
        },
        statement: {
          en: "The diaphragm is breathing's pump-handle — down for air in, up for air out, tirelessly, all life long.",
          hi: "डायाफ़्राम साँस का हत्था है — नीचे तो हवा भीतर, ऊपर तो बाहर; अथक, जीवन भर।",
          mr: "श्वासपटल हा श्वासाचा दांडा — खाली तर हवा आत, वर तर बाहेर; अथक, आयुष्यभर.",
        },
        pair: {
          left: { en: "The muscular floor", hi: "माँसल फ़र्श", mr: "स्नायूंचा तळ" },
          right: {
            en: "down for in, up for out",
            hi: "नीचे तो भीतर, ऊपर तो बाहर",
            mr: "खाली तर आत, वर तर बाहेर",
          },
        },
      },
      {
        id: "spiracles",
        name: {
          en: "Spiracles and tracheae",
          hi: "श्वास-रंध्र और वायु-नलियाँ",
          mr: "श्वासरंध्रे आणि श्वासनलिका",
        },
        kind: "organ",
        prompt: {
          en: "Insects breathe through which side-openings, feeding a network of air-pipes that reaches every cell directly?",
          hi: "कीट किन बग़ली छिद्रों से साँस लेते हैं, जो हर कोशिका तक सीधे पहुँचती वायु-नलियों के जाल को हवा देते हैं?",
          mr: "कीटक कोणत्या बाजूच्या छिद्रांतून श्वास घेतात, जी प्रत्येक पेशीपर्यंत थेट पोहोचणाऱ्या हवाई-नळ्यांच्या जाळ्याला हवा पुरवतात?",
        },
        statement: {
          en: "Insects breathe through spiracles into branching tracheae — air is piped door to door, and no lungs are involved at all.",
          hi: "कीट श्वास-रंध्रों से शाखादार वायु-नलियों में साँस लेते हैं — हवा घर-घर नल से पहुँचती है, फेफड़ों का कोई काम नहीं।",
          mr: "कीटक श्वासरंध्रांतून फांद्या फुटलेल्या श्वासनलिकांत श्वास घेतात — हवा घरोघरी नळाने पोहोचते, फुप्फुसांचे कामच नाही.",
        },
        pair: {
          left: {
            en: "The insect's side-doors",
            hi: "कीट के बग़ली दरवाज़े",
            mr: "कीटकाची बाजूची दारे",
          },
          right: {
            en: "air piped to every cell",
            hi: "हर कोशिका तक नल से हवा",
            mr: "प्रत्येक पेशीपर्यंत नळाने हवा",
          },
        },
      },
      {
        id: "earthworm-skin",
        name: { en: "The earthworm's skin", hi: "केंचुए की त्वचा", mr: "गांडुळाची त्वचा" },
        kind: "organ",
        prompt: {
          en: "Which moist surface lets the earthworm breathe through its entire body wall?",
          hi: "कौन-सी नम सतह केंचुए को उसकी पूरी देह-दीवार से साँस लेने देती है?",
          mr: "कोणता ओलसर पृष्ठभाग गांडुळाला त्याच्या सबंध देह-भिंतीतून श्वास घेऊ देतो?",
        },
        statement: {
          en: "The earthworm breathes through its moist skin — let the skin dry, and the animal suffocates in the open air.",
          hi: "केंचुआ अपनी नम त्वचा से साँस लेता है — त्वचा सूख जाए तो खुली हवा में भी उसका दम घुट जाता है।",
          mr: "गांडूळ आपल्या ओल्या त्वचेतून श्वास घेते — त्वचा वाळली तर मोकळ्या हवेतही त्याचा जीव गुदमरतो.",
        },
        detail: {
          en: "Rain floods its burrows, so it surfaces — trading the risk of drowning for the risk of daylight.",
          hi: "बारिश उसके बिलों में पानी भर देती है, तो वह ऊपर आ जाता है — डूबने का जोखिम दिन के उजाले के जोखिम से बदलकर।",
          mr: "पाऊस त्याची बिळे भरतो, म्हणून ते वर येते — बुडण्याचा धोका दिवसाउजेडाच्या धोक्याशी बदलून.",
        },
        extra: {
          en: "Frogs run the same trick underwater, switching to lungs on land — two tools for one job.",
          hi: "मेंढक पानी के भीतर यही तरकीब चलाते हैं, ज़मीन पर फेफड़ों पर लौटते हुए — एक काम के दो औज़ार।",
          mr: "बेडूक पाण्याखाली हीच युक्ती चालवतात, जमिनीवर फुप्फुसांकडे वळत — एका कामाची दोन हत्यारे.",
        },
        pair: {
          left: { en: "The moist body wall", hi: "नम देह-दीवार", mr: "ओली देह-भिंत" },
          right: {
            en: "breath without lungs",
            hi: "बिना फेफड़ों की साँस",
            mr: "फुप्फुसांविनाचा श्वास",
          },
        },
      },
      {
        id: "gills",
        name: { en: "Gills", hi: "गलफड़े", mr: "कल्ले" },
        kind: "organ",
        prompt: {
          en: "Which feathery organs strain dissolved oxygen out of the water flowing past a fish's throat?",
          hi: "कौन-से पंखनुमा अंग मछली के गले से बहते पानी में घुली ऑक्सीजन छान लेते हैं?",
          mr: "कोणते पिसांसारखे अवयव माशाच्या गळ्याजवळून वाहणाऱ्या पाण्यातला विरघळलेला ऑक्सिजन गाळून घेतात?",
        },
        statement: {
          en: "Gills take the oxygen dissolved in water — thin walls, rich blood supply, water in at the mouth and out past the flaps.",
          hi: "गलफड़े पानी में घुली ऑक्सीजन लेते हैं — पतली दीवारें, भरपूर रक्त-आपूर्ति, मुँह से पानी भीतर और पल्लों के पार बाहर।",
          mr: "कल्ले पाण्यात विरघळलेला ऑक्सिजन घेतात — पातळ भिंती, भरपूर रक्तपुरवठा, तोंडातून पाणी आत आणि झडपांपार बाहेर.",
        },
        pair: {
          left: { en: "The feathery strainers", hi: "पंखनुमा छलनियाँ", mr: "पिसांसारख्या चाळण्या" },
          right: {
            en: "oxygen sieved from water",
            hi: "पानी से छनी ऑक्सीजन",
            mr: "पाण्यातून गाळलेला ऑक्सिजन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the breather to its breathing gear: A-cockroach, B-earthworm, C-fish. Which trio is right?",
          hi: "साँस लेने वाले को उसके साँस-औज़ार से मिलाइए: अ-तिलचट्टा, ब-केंचुआ, स-मछली। कौन-सी तिकड़ी सही है?",
          mr: "श्वास घेणाऱ्याला त्याच्या श्वास-हत्याराशी जुळवा: अ-झुरळ, ब-गांडूळ, क-मासा. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: spiracles · B: moist skin · C: gills",
            hi: "अ: श्वास-रंध्र · ब: नम त्वचा · स: गलफड़े",
            mr: "अ: श्वासरंध्रे · ब: ओली त्वचा · क: कल्ले",
          },
          {
            en: "A: gills · B: spiracles · C: moist skin",
            hi: "अ: गलफड़े · ब: श्वास-रंध्र · स: नम त्वचा",
            mr: "अ: कल्ले · ब: श्वासरंध्रे · क: ओली त्वचा",
          },
          {
            en: "A: moist skin · B: gills · C: spiracles",
            hi: "अ: नम त्वचा · ब: गलफड़े · स: श्वास-रंध्र",
            mr: "अ: ओली त्वचा · ब: कल्ले · क: श्वासरंध्रे",
          },
          {
            en: "A: spiracles · B: gills · C: moist skin",
            hi: "अ: श्वास-रंध्र · ब: गलफड़े · स: नम त्वचा",
            mr: "अ: श्वासरंध्रे · ब: कल्ले · क: ओली त्वचा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Habitat writes the gear. The cockroach's dry armour needs piped air — spiracles and tracheae. The earthworm's damp burrow keeps its breathing skin moist. The fish lives where oxygen hides dissolved — gills sieve it out. Swap any two and the animal drowns, dries or suffocates.",
          hi: "आवास ही औज़ार लिखता है। तिलचट्टे के सूखे कवच को नल से हवा चाहिए — श्वास-रंध्र और वायु-नलियाँ। केंचुए का नम बिल उसकी साँस लेती त्वचा को गीला रखता है। मछली वहाँ रहती है जहाँ ऑक्सीजन घुली छिपी है — गलफड़े उसे छान लेते हैं। कोई दो बदल दीजिए और जीव डूबता, सूखता या घुटता है।",
          mr: "अधिवासच हत्यार लिहितो. झुरळाच्या कोरड्या चिलखताला नळाने हवा हवी — श्वासरंध्रे आणि श्वासनलिका. गांडुळाचे दमट बीळ त्याची श्वास घेणारी त्वचा ओली ठेवते. मासा तिथे राहतो जिथे ऑक्सिजन विरघळून लपला आहे — कल्ले तो गाळतात. कोणतेही दोन बदला आणि प्राणी बुडतो, वाळतो वा गुदमरतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Air holds far MORE oxygen than water does — yet a fish taken out of water dies of suffocation. How can it starve of oxygen inside a richer supply?",
          hi: "हवा में पानी से कहीं ज़्यादा ऑक्सीजन है — फिर भी पानी से निकाली मछली दम घुटकर मरती है। भरपूर आपूर्ति के बीच वह ऑक्सीजन की भूखी कैसे रह जाती है?",
          mr: "हवेत पाण्याहून कितीतरी जास्त ऑक्सिजन आहे — तरी पाण्याबाहेर काढलेला मासा गुदमरून मरतो. समृद्ध पुरवठ्यात तो ऑक्सिजनला उपाशी कसा राहतो?",
        },
        choices: [
          {
            en: "Gills work only wet and spread: in air the feathery filaments collapse and dry into a clump, and the absorbing surface is gone",
            hi: "गलफड़े केवल गीले और फैले हुए चलते हैं: हवा में पंखनुमा तंतु सिमटकर सूख जाते हैं, और सोखने की सतह ही मिट जाती है",
            mr: "कल्ले फक्त ओले आणि पसरलेले असतानाच चालतात: हवेत पिसांसारखे तंतू मिटून वाळतात, आणि शोषणारा पृष्ठभागच नाहीसा होतो",
          },
          {
            en: "Air's oxygen is a different, poisonous kind",
            hi: "हवा की ऑक्सीजन अलग, ज़हरीली क़िस्म की है",
            mr: "हवेतला ऑक्सिजन वेगळ्या, विषारी जातीचा आहे",
          },
          {
            en: "Fish die of fright, not of breathlessness",
            hi: "मछलियाँ डर से मरती हैं, दम घुटने से नहीं",
            mr: "मासे भीतीने मरतात, गुदमरून नाही",
          },
          {
            en: "Fish simply refuse to breathe outside water",
            hi: "मछलियाँ पानी के बाहर साँस लेने से इनकार कर देती हैं",
            mr: "मासे पाण्याबाहेर श्वास घ्यायला नकारच देतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The oxygen is there; the INSTRUMENT fails. Gill filaments are built to float apart in water, spreading a huge thin-walled surface; air lets them slump together and dry, and a clumped, drying gill has almost no working surface left. An organ is a bargain with its medium — outside that medium, abundance is unreachable. The earthworm dies the mirrored death: dried skin in dry air, surrounded by oxygen it can no longer touch.",
          hi: "ऑक्सीजन मौजूद है; औज़ार बिगड़ जाता है। गलफड़ों के तंतु पानी में अलग-अलग तैरने को बने हैं, विशाल पतली-दीवार वाली सतह फैलाते हुए; हवा उन्हें आपस में ढहाकर सुखा देती है, और सिमटे-सूखते गलफड़े के पास काम की सतह बचती ही नहीं। अंग अपने माध्यम से बँधा सौदा है — उस माध्यम के बाहर बहुतायत भी पहुँच से दूर है। केंचुआ इसका दर्पण-मरण मरता है: सूखी हवा में सूखी त्वचा, चारों ओर वह ऑक्सीजन जिसे वह अब छू नहीं सकता।",
          mr: "ऑक्सिजन आहे; हत्यारच बिघडते. कल्ल्यांचे तंतू पाण्यात वेगवेगळे तरंगायला घडले आहेत, प्रचंड पातळ-भिंतीचा पृष्ठभाग पसरत; हवा त्यांना एकमेकांवर कोसळवून वाळवते, आणि मिटलेल्या-वाळणाऱ्या कल्ल्याकडे कामाचा पृष्ठभाग उरतच नाही. अवयव हा त्याच्या माध्यमाशी केलेला करार — त्या माध्यमाबाहेर विपुलताही आवाक्याबाहेर. गांडूळ याचेच आरसा-मरण मरते: कोरड्या हवेत वाळलेली त्वचा, भोवती तो ऑक्सिजन जो त्याला आता स्पर्शताही येत नाही.",
        },
      },
    ],
  },
];
