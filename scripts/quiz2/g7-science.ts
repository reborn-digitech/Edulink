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
];
