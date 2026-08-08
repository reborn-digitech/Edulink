/**
 * Class 9 Science — NCERT, chapter by chapter, through the conceptual
 * engine. Matter is taken apart to its particles and atoms, forces are
 * given laws, and energy is followed as it changes coats. The experimenter's
 * notebook grows a theorist's margin. Same distractor rule as everywhere —
 * every statement must be false of every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Science (Class 9)";
const LICENCE = "CC-BY-SA-4.0";

export const G9_SCIENCE: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Matter in Our Surroundings (particles and their states)    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-matter-surroundings",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 1 — Matter in Our Surroundings",
      hi: "अध्याय 1 — हमारे आस-पास के पदार्थ",
      mr: "प्रकरण 1 — आपल्या सभोवतालचे पदार्थ",
    },
    name: {
      en: "Matter in Our Surroundings",
      hi: "हमारे आस-पास के पदार्थ",
      mr: "आपल्या सभोवतालचे पदार्थ",
    },
    summary: {
      en: "All matter as restless particles: three states set by how tightly they are held, melting and boiling as fixed doorways, diffusion proving the spaces between — and evaporation cooling by stealing the fastest away.",
      hi: "सारा पदार्थ बेचैन कणों के रूप में: पकड़ की मज़बूती से तय तीन अवस्थाएँ, गलन और क्वथन बतौर नियत द्वार, विसरण बीच की जगहें सिद्ध करता — और वाष्पन जो सबसे तेज़ कण चुराकर ठंडा करता है।",
      mr: "सारा पदार्थ अस्वस्थ कणांच्या रूपात: पकडीच्या घट्टपणाने ठरलेल्या तीन अवस्था, वितळणे आणि उकळणे ही ठरलेली दारे, विसरण मधल्या जागा सिद्ध करते — आणि बाष्पीभवन जे सर्वांत जलद कण चोरून थंड करते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "particle-nature",
        name: {
          en: "The particle nature of matter",
          hi: "पदार्थ का कणीय स्वभाव",
          mr: "पदार्थाचे कणस्वरूप",
        },
        kind: "idea",
        prompt: {
          en: "Sugar dissolves and vanishes into water, yet sweetens every sip. What does this reveal all matter to be made of?",
          hi: "शक्कर पानी में घुलकर ग़ायब हो जाती है, फिर भी हर घूँट मीठा करती है। यह सारे पदार्थ को किससे बना उजागर करता है?",
          mr: "साखर पाण्यात विरघळून नाहीशी होते, तरी प्रत्येक घोट गोड करते. हे सारा पदार्थ कशाने बनला हे उघड करते?",
        },
        statement: {
          en: "Matter is made of tiny particles with spaces between them — vast in number, ceaselessly moving, too small to see.",
          hi: "पदार्थ नन्हे कणों से बना है जिनके बीच जगह है — गिनती में विशाल, निरंतर गतिशील, देखने को बहुत छोटे।",
          mr: "पदार्थ इवल्या कणांनी बनला आहे ज्यांच्यामध्ये जागा आहे — संख्येने प्रचंड, अखंड हलणारे, पाहायला फार लहान.",
        },
        detail: {
          en: "A crystal of potassium permanganate colours bucket after bucket of water — proof of how many particles hide in a speck.",
          hi: "पोटैशियम परमैंगनेट का एक रवा बाल्टी-दर-बाल्टी पानी रँग देता है — प्रमाण कि एक कण में कितने कण छिपे हैं।",
          mr: "पोटॅशियम परमॅंगनेटचा एक स्फटिक बादलीमागून बादली पाणी रंगवतो — पुरावा की एका कणात किती कण दडले.",
        },
        extra: {
          en: "They attract one another too — the force of attraction is what holds a solid in one piece.",
          hi: "वे एक-दूसरे को खींचते भी हैं — यही आकर्षण-बल किसी ठोस को एक टुकड़ा बनाए रखता है।",
          mr: "ते एकमेकांना ओढतातही — हेच आकर्षण-बल एखाद्या घनाला एक तुकडा ठेवते.",
        },
        pair: {
          left: {
            en: "The vanished sugar",
            hi: "ग़ायब हुई शक्कर",
            mr: "नाहीशी झालेली साखर",
          },
          right: {
            en: "particles in the spaces",
            hi: "जगहों में बसे कण",
            mr: "जागांत विसावलेले कण",
          },
        },
      },
      {
        id: "solid",
        name: { en: "The solid state", hi: "ठोस अवस्था", mr: "घन अवस्था" },
        kind: "state",
        prompt: {
          en: "Which state holds its own shape and volume because its particles are packed tight and barely move?",
          hi: "कौन-सी अवस्था अपना आकार और आयतन बनाए रखती है क्योंकि उसके कण कसकर जमे और मुश्किल से हिलते हैं?",
          mr: "कोणती अवस्था स्वतःचा आकार आणि घनफळ राखते कारण तिचे कण घट्ट रचलेले आणि जेमतेम हलतात?",
        },
        statement: {
          en: "A solid has fixed shape and volume — its tightly-held particles only vibrate in place, never wandering.",
          hi: "ठोस का आकार और आयतन नियत है — उसके कसकर बँधे कण केवल अपनी जगह कंपते हैं, कभी भटकते नहीं।",
          mr: "घनाचा आकार आणि घनफळ ठरलेले — त्याचे घट्ट धरलेले कण फक्त जागीच कंपतात, कधी भटकत नाहीत.",
        },
        pair: {
          left: {
            en: "Shape and volume both fixed",
            hi: "आकार-आयतन दोनों नियत",
            mr: "आकार-घनफळ दोन्ही ठरलेले",
          },
          right: {
            en: "particles only vibrating",
            hi: "केवल कंपते कण",
            mr: "फक्त कंपणारे कण",
          },
        },
      },
      {
        id: "liquid",
        name: { en: "The liquid state", hi: "द्रव अवस्था", mr: "द्रव अवस्था" },
        kind: "state",
        prompt: {
          en: "Which state keeps its volume but takes the shape of any vessel, its particles loose enough to slide past one another?",
          hi: "कौन-सी अवस्था आयतन तो रखती है पर किसी भी बर्तन का आकार ले लेती है, उसके कण इतने ढीले कि एक-दूसरे से फिसल जाएँ?",
          mr: "कोणती अवस्था घनफळ राखते पण कोणत्याही भांड्याचा आकार घेते, तिचे कण इतके सैल की एकमेकांतून सरकतात?",
        },
        statement: {
          en: "A liquid has fixed volume but no fixed shape — its particles flow past one another, so it pours and fills its container.",
          hi: "द्रव का आयतन नियत पर आकार नहीं — उसके कण एक-दूसरे से बहते हैं, अतः वह ढलता और बर्तन भरता है।",
          mr: "द्रवाचे घनफळ ठरलेले पण आकार नाही — त्याचे कण एकमेकांतून वाहतात, म्हणून तो ओतला जातो आणि भांडे भरतो.",
        },
        pair: {
          left: {
            en: "Volume kept, shape borrowed",
            hi: "आयतन रखा, आकार उधार",
            mr: "घनफळ राखले, आकार उसना",
          },
          right: {
            en: "particles sliding past",
            hi: "फिसलते कण",
            mr: "सरकणारे कण",
          },
        },
      },
      {
        id: "gas",
        name: { en: "The gaseous state", hi: "गैसीय अवस्था", mr: "वायू अवस्था" },
        kind: "state",
        prompt: {
          en: "Which state fills any container completely and can be squeezed small, its particles flying free and far apart?",
          hi: "कौन-सी अवस्था किसी भी बर्तन को पूरा भर देती है और छोटी दबाई जा सकती है, उसके कण मुक्त उड़ते और दूर-दूर?",
          mr: "कोणती अवस्था कोणतेही भांडे पूर्ण भरते आणि लहान दाबता येते, तिचे कण मुक्त उडणारे आणि दूरदूर?",
        },
        statement: {
          en: "A gas has neither fixed shape nor volume — its far-flung particles fly freely, so it fills all space and compresses easily.",
          hi: "गैस का न आकार नियत है न आयतन — उसके दूर बिखरे कण मुक्त उड़ते हैं, अतः वह सारी जगह भरती और आसानी से दबती है।",
          mr: "वायूचा ना आकार ठरलेला ना घनफळ — त्याचे दूर विखुरलेले कण मुक्त उडतात, म्हणून तो सारी जागा भरतो आणि सहज दबतो.",
        },
        detail: {
          en: "The huge spaces between gas particles are why a cylinder of cooking gas holds so much in so little room.",
          hi: "गैस-कणों के बीच की विशाल जगहें ही कारण हैं कि रसोई-गैस का सिलेंडर इतनी थोड़ी जगह में इतना कुछ रखता है।",
          mr: "वायू-कणांमधल्या प्रचंड जागाच कारण की स्वयंपाक-गॅसचा सिलिंडर इतक्या थोड्या जागेत इतके धरतो.",
        },
        extra: {
          en: "Compressed gas presses on its walls in every direction — that steady drumming is pressure.",
          hi: "संपीड़ित गैस अपनी दीवारों पर हर दिशा में दबाती है — वही निरंतर थपथपाहट दाब है।",
          mr: "दाबलेला वायू आपल्या भिंतींवर प्रत्येक दिशेने दाबतो — तीच सततची थाप म्हणजे दाब.",
        },
        pair: {
          left: {
            en: "Fills all, squeezes small",
            hi: "सब भरे, छोटा दबे",
            mr: "सारे भरतो, लहान दबतो",
          },
          right: {
            en: "particles flying free and far",
            hi: "मुक्त दूर उड़ते कण",
            mr: "मुक्त दूर उडणारे कण",
          },
        },
      },
      {
        id: "melting-boiling",
        name: {
          en: "Melting and boiling points",
          hi: "गलनांक और क्वथनांक",
          mr: "वितळणांक आणि उकळणांक",
        },
        kind: "property",
        prompt: {
          en: "Ice melts at 0 °C and water boils at 100 °C, always. Which fixed temperatures mark a substance's doorways between states?",
          hi: "बर्फ़ 0 °C पर पिघलती और पानी 100 °C पर उबलता है, सदा। कौन-से नियत तापमान किसी पदार्थ के अवस्थाओं के बीच द्वार अंकित करते हैं?",
          mr: "बर्फ 0 °C ला वितळतो आणि पाणी 100 °C ला उकळते, नेहमी. कोणती ठरलेली तापमाने पदार्थाच्या अवस्थांमधली दारे दर्शवतात?",
        },
        statement: {
          en: "The melting and boiling points are fixed doorways — a pure substance changes state at its own exact temperatures.",
          hi: "गलनांक और क्वथनांक नियत द्वार हैं — शुद्ध पदार्थ अपने ठीक तापमानों पर अवस्था बदलता है।",
          mr: "वितळणांक आणि उकळणांक ही ठरलेली दारे — शुद्ध पदार्थ आपल्या नेमक्या तापमानांवर अवस्था बदलतो.",
        },
        detail: {
          en: "During the change the temperature STOPS rising — the heat goes into breaking bonds, not warming, so-called latent heat.",
          hi: "बदलाव के दौरान तापमान रुक जाता है — गर्मी बंधन तोड़ने में जाती है, गर्माने में नहीं; इसे गुप्त ऊष्मा कहते हैं।",
          mr: "बदलादरम्यान तापमान थांबते — उष्णता बंध तोडण्यात जाते, तापवण्यात नाही; याला सुप्त उष्णता म्हणतात.",
        },
        extra: {
          en: "That is why boiling water stays at 100 °C however hard the flame roars.",
          hi: "इसीलिए उबलता पानी 100 °C पर टिका रहता है, आँच कितनी भी गरजे।",
          mr: "म्हणूनच उकळते पाणी 100 °C वर टिकते, ज्योत कितीही गर्जो.",
        },
        pair: {
          left: {
            en: "Ice at 0, water at 100",
            hi: "बर्फ़ 0 पर, पानी 100 पर",
            mr: "बर्फ 0 वर, पाणी 100 वर",
          },
          right: {
            en: "fixed doorways between states",
            hi: "अवस्थाओं के नियत द्वार",
            mr: "अवस्थांमधली ठरलेली दारे",
          },
        },
      },
      {
        id: "diffusion",
        name: { en: "Diffusion", hi: "विसरण", mr: "विसरण" },
        kind: "process",
        prompt: {
          en: "Incense filling a room, ink spreading through still water — which process shows particles mingling into the spaces between others?",
          hi: "अगरबत्ती कमरा भरती, स्याही ठहरे पानी में फैलती — कौन-सी प्रक्रिया दिखाती है कि कण दूसरों के बीच की जगहों में घुल-मिल जाते हैं?",
          mr: "अगरबत्ती खोली भरते, शाई स्थिर पाण्यात पसरते — कोणती प्रक्रिया दाखवते की कण इतरांच्या मधल्या जागांत मिसळतात?",
        },
        statement: {
          en: "Diffusion is particles spreading into the gaps between others — fastest in gases, slower in liquids, barely there in solids.",
          hi: "विसरण कणों का दूसरों के बीच की जगहों में फैलना है — गैसों में सबसे तेज़, द्रवों में धीमा, ठोसों में नाममात्र।",
          mr: "विसरण म्हणजे कणांचे इतरांमधल्या जागांत पसरणे — वायूंत सर्वांत जलद, द्रवांत हळू, घनांत जेमतेम.",
        },
        detail: {
          en: "Heating speeds it — warm particles move faster, so tea steeps quicker in hot water than cold.",
          hi: "गर्माना उसे तेज़ करता है — गर्म कण तेज़ चलते हैं, अतः चाय ठंडे से गर्म पानी में जल्दी उतरती है।",
          mr: "तापवणे त्याला वेगवान करते — गरम कण जलद हलतात, म्हणून चहा थंडपेक्षा गरम पाण्यात लवकर उतरतो.",
        },
        extra: {
          en: "Diffusion is the particle theory made visible — no gaps, no mingling.",
          hi: "विसरण कण-सिद्धांत का दिखता रूप है — जगह नहीं तो घुलना नहीं।",
          mr: "विसरण म्हणजे कण-सिद्धान्ताचे दिसणारे रूप — जागा नाही तर मिसळणे नाही.",
        },
        pair: {
          left: {
            en: "Ink spreading through water",
            hi: "पानी में फैलती स्याही",
            mr: "पाण्यात पसरणारी शाई",
          },
          right: {
            en: "particles filling the gaps",
            hi: "जगहें भरते कण",
            mr: "जागा भरणारे कण",
          },
        },
      },
      {
        id: "evaporation",
        name: { en: "Evaporation", hi: "वाष्पन", mr: "बाष्पीभवन" },
        kind: "process",
        prompt: {
          en: "A wet floor dries and a khus curtain cools the room, both without boiling. Which surface process turns liquid to vapour AT ANY temperature — and cools as it goes?",
          hi: "गीला फ़र्श सूखता और खस का परदा कमरा ठंडा करता है, दोनों बिना उबले। कौन-सी सतही प्रक्रिया द्रव को किसी भी तापमान पर वाष्प बनाती है — और साथ-साथ ठंडा करती है?",
          mr: "ओला फरशी वाळते आणि वाळ्याचा पडदा खोली थंड करतो, दोन्ही न उकळता. कोणती पृष्ठभागाची प्रक्रिया द्रवाला कोणत्याही तापमानावर बाष्प करते — आणि सोबत थंड करते?",
        },
        statement: {
          en: "Evaporation is surface vaporisation at any temperature — the fastest particles escape, so the liquid left behind cools.",
          hi: "वाष्पन किसी भी तापमान पर सतही वाष्पीकरण है — सबसे तेज़ कण भाग निकलते हैं, अतः बचा द्रव ठंडा हो जाता है।",
          mr: "बाष्पीभवन म्हणजे कोणत्याही तापमानावर पृष्ठभागाचे बाष्पीभवन — सर्वांत जलद कण निसटतात, म्हणून उरलेला द्रव थंड होतो.",
        },
        detail: {
          en: "It is why sweating cools you, and why water in an earthen pot stays cold — the escaping fastest carry the heat off.",
          hi: "इसीलिए पसीना ठंडक देता है, और मटके का पानी ठंडा रहता है — भागते सबसे तेज़ कण गर्मी साथ ले जाते हैं।",
          mr: "म्हणूनच घाम थंडावा देतो, आणि मडक्यातले पाणी थंड राहते — निसटणारे सर्वांत जलद कण उष्णता सोबत नेतात.",
        },
        extra: {
          en: "Wind, heat and dryness all hurry it; humidity slows it, since the air is already crowded with vapour.",
          hi: "हवा, गर्मी और सूखापन इसे तेज़ करते; आर्द्रता धीमा करती है, क्योंकि हवा पहले से वाष्प से भरी है।",
          mr: "वारा, उष्णता आणि कोरडेपणा याला वेगवान करतात; आर्द्रता मंदावते, कारण हवा आधीच बाष्पाने भरलेली.",
        },
        pair: {
          left: {
            en: "The drying wet floor",
            hi: "सूखता गीला फ़र्श",
            mr: "वाळणारा ओला फरशी",
          },
          right: {
            en: "the fastest particles stolen away",
            hi: "चुरा ले गए सबसे तेज़ कण",
            mr: "चोरून नेलेले सर्वांत जलद कण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort the states by how their particles behave: A-solid, B-liquid, C-gas. Which trio is right?",
          hi: "अवस्थाओं को उनके कणों के व्यवहार से छाँटिए: अ-ठोस, ब-द्रव, स-गैस। कौन-सी तिकड़ी सही है?",
          mr: "अवस्थांना त्यांच्या कणांच्या वर्तनाने निवडा: अ-घन, ब-द्रव, क-वायू. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: packed tight, only vibrating · B: loose, sliding past · C: far apart, flying free",
            hi: "अ: कसकर जमे, केवल कंपते · ब: ढीले, फिसलते · स: दूर-दूर, मुक्त उड़ते",
            mr: "अ: घट्ट रचलेले, फक्त कंपणारे · ब: सैल, सरकणारे · क: दूरदूर, मुक्त उडणारे",
          },
          {
            en: "A: flying free · B: vibrating in place · C: sliding past",
            hi: "अ: मुक्त उड़ते · ब: जगह पर कंपते · स: फिसलते",
            mr: "अ: मुक्त उडणारे · ब: जागी कंपणारे · क: सरकणारे",
          },
          {
            en: "A: sliding past · B: flying free · C: packed tight",
            hi: "अ: फिसलते · ब: मुक्त उड़ते · स: कसकर जमे",
            mr: "अ: सरकणारे · ब: मुक्त उडणारे · क: घट्ट रचलेले",
          },
          {
            en: "All three have identically behaving particles",
            hi: "तीनों के कण एक-से व्यवहार करते हैं",
            mr: "तिघांचे कण सारखेच वागतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The three states are one story of loosening grip. In a solid the attraction wins utterly, so particles can only shiver in place — fixed shape. In a liquid the grip slackens enough to let them slide, so the shape flows while the volume holds. In a gas the grip nearly lets go, so particles fly apart to fill any space. Heat is what loosens the grip, walking matter up this same ladder.",
          hi: "तीनों अवस्थाएँ पकड़ ढीली होने की एक ही कहानी हैं। ठोस में आकर्षण पूरी तरह जीतता है, अतः कण केवल जगह पर काँप सकते हैं — नियत आकार। द्रव में पकड़ इतनी ढीली कि वे फिसलें, अतः आकार बहता है पर आयतन टिका। गैस में पकड़ लगभग छूट जाती है, अतः कण बिखरकर किसी भी जगह भर देते हैं। गर्मी ही पकड़ ढीली करती है, पदार्थ को इसी सीढ़ी पर चढ़ाती हुई।",
          mr: "तिन्ही अवस्था म्हणजे पकड सैल होण्याची एकच कथा. घनात आकर्षण पूर्ण जिंकते, म्हणून कण फक्त जागी थरथरतात — ठरलेला आकार. द्रवात पकड इतकी सैल की ते सरकतात, म्हणून आकार वाहतो पण घनफळ टिकते. वायूत पकड जवळजवळ सुटते, म्हणून कण विखुरून कोणतीही जागा भरतात. उष्णताच पकड सैल करते, पदार्थाला याच शिडीवर चढवत.",
        },
      },
      {
        level: 6,
        stem: {
          en: "On a hot day, water kept in an earthen (mud) pot stays cooler than water in a sealed steel bottle beside it. Both sat in the same sun. Why is the porous pot the cooler?",
          hi: "गरम दिन में मिट्टी के मटके का पानी बग़ल की बंद स्टील की बोतल के पानी से ठंडा रहता है। दोनों एक ही धूप में रखे थे। छिद्रयुक्त मटका ठंडा क्यों?",
          mr: "गरम दिवशी मातीच्या मडक्यातले पाणी शेजारच्या बंद स्टीलच्या बाटलीतल्या पाण्याहून थंड राहते. दोन्ही एकाच उन्हात होते. सच्छिद्र मडके थंड का?",
        },
        choices: [
          {
            en: "Water seeps through the pot's tiny pores and evaporates from the outside; the escaping fastest particles carry heat away, cooling what stays — the sealed bottle offers no such escape",
            hi: "पानी मटके के नन्हे छिद्रों से रिसकर बाहर से वाष्पित होता है; भागते सबसे तेज़ कण गर्मी साथ ले जाते हैं, बचे को ठंडा करते हुए — बंद बोतल में ऐसा भागना नहीं",
            mr: "पाणी मडक्याच्या इवल्या छिद्रांतून झिरपून बाहेरून बाष्पित होते; निसटणारे सर्वांत जलद कण उष्णता नेतात, उरलेल्याला थंड करत — बंद बाटलीत असे निसटणे नाही",
          },
          {
            en: "Mud is naturally colder than steel",
            hi: "मिट्टी स्टील से स्वभावतः ठंडी होती है",
            mr: "माती स्टीलहून स्वभावतः थंड असते",
          },
          {
            en: "Steel attracts sunlight into the water",
            hi: "स्टील धूप को पानी में खींच लेता है",
            mr: "स्टील ऊन पाण्यात ओढते",
          },
          {
            en: "The pot secretly makes ice",
            hi: "मटका चुपचाप बर्फ़ बनाता है",
            mr: "मडके गुपचूप बर्फ बनवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The pot is cool because it leaks — usefully. Its unglazed clay is riddled with pores through which water slowly seeps to the outer surface, and there it evaporates into the dry air. Evaporation is selective theft: only the most energetic particles have the speed to escape, and when they leave they carry their energy with them, so the water remaining loses heat and cools. The steel bottle, sealed and smooth, gives the water no route to the surface and no surface to evaporate from, so it simply warms with the day. The humble matka is a working model of evaporative cooling — the same physics behind sweat, khus curtains and the desert cooler.",
          hi: "मटका इसलिए ठंडा है कि वह रिसता है — काम की तरह। उसकी बिन-चमकी मिट्टी छिद्रों से भरी है, जिनसे पानी धीरे-धीरे बाहरी सतह तक रिसता है, और वहाँ सूखी हवा में वाष्पित होता है। वाष्पन चुनिंदा चोरी है: केवल सबसे ऊर्जावान कणों में भागने की गति होती है, और भागते हुए वे अपनी ऊर्जा साथ ले जाते हैं, अतः बचा पानी गर्मी खोकर ठंडा हो जाता है। बंद, चिकनी स्टील की बोतल पानी को सतह तक कोई राह नहीं देती और वाष्पित होने को कोई सतह नहीं, अतः वह बस दिन के साथ गर्म होती है। मामूली मटका वाष्पन-शीतलन का चलता मॉडल है — वही भौतिकी जो पसीने, खस के परदे और डेज़र्ट कूलर के पीछे है।",
          mr: "मडके म्हणून थंड की ते गळते — उपयुक्तपणे. त्याची न झिलई केलेली माती छिद्रांनी भरलेली, ज्यांतून पाणी हळूहळू बाहेरच्या पृष्ठापर्यंत झिरपते, आणि तिथे कोरड्या हवेत बाष्पित होते. बाष्पीभवन ही निवडक चोरी: फक्त सर्वांत ऊर्जावान कणांत निसटण्याची गती असते, आणि निसटताना ते आपली ऊर्जा सोबत नेतात, म्हणून उरलेले पाणी उष्णता गमावून थंड होते. बंद, गुळगुळीत स्टीलची बाटली पाण्याला पृष्ठापर्यंत वाट देत नाही आणि बाष्पित व्हायला पृष्ठ नाही, म्हणून ती नुसती दिवसासोबत तापते. साधे मडके म्हणजे बाष्पीभवन-शीतलनाचे चालते प्रारूप — घाम, वाळ्याचा पडदा आणि डेझर्ट कूलरमागचे तेच भौतिकशास्त्र.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Atoms and Molecules (the laws of combination)              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-atoms-molecules",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 3 — Atoms and Molecules",
      hi: "अध्याय 3 — परमाणु एवं अणु",
      mr: "प्रकरण 3 — अणू आणि रेणू",
    },
    name: { en: "Atoms and Molecules", hi: "परमाणु एवं अणु", mr: "अणू आणि रेणू" },
    summary: {
      en: "Matter's grammar in atoms: mass conserved through every reaction, elements combining in fixed ratios, the mole as chemistry's dozen — and formulae written by balancing invisible charges.",
      hi: "परमाणुओं में पदार्थ का व्याकरण: हर अभिक्रिया में संरक्षित द्रव्यमान, नियत अनुपातों में जुड़ते तत्व, रसायन का दर्जन बना मोल — और अदृश्य आवेश संतुलित कर लिखे सूत्र।",
      mr: "अणूंमधले पदार्थाचे व्याकरण: प्रत्येक अभिक्रियेत अक्षय वस्तुमान, ठरलेल्या गुणोत्तरांत जुळणारी मूलद्रव्ये, रसायनशास्त्राचा डझन झालेला मोल — आणि अदृश्य भार संतुलित करून लिहिलेली सूत्रे.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "conservation-mass",
        name: {
          en: "The law of conservation of mass",
          hi: "द्रव्यमान संरक्षण का नियम",
          mr: "वस्तुमान अक्षय्यतेचा नियम",
        },
        kind: "law",
        prompt: {
          en: "Burn, dissolve or react — the total mass before always equals the total mass after. Which law states this?",
          hi: "जलाइए, घोलिए या अभिक्रिया कराइए — पहले का कुल द्रव्यमान सदा बाद के कुल के बराबर होता है। यह कौन-सा नियम कहता है?",
          mr: "जाळा, विरघळवा वा अभिक्रिया करा — आधीचे एकूण वस्तुमान नेहमी नंतरच्या एकुणाइतके. हे कोणता नियम सांगतो?",
        },
        statement: {
          en: "Mass is neither created nor destroyed in a chemical reaction — the atoms only rearrange, so the total mass holds constant.",
          hi: "रासायनिक अभिक्रिया में द्रव्यमान न बनता है न नष्ट होता — परमाणु केवल फिर से सजते हैं, अतः कुल द्रव्यमान स्थिर रहता है।",
          mr: "रासायनिक अभिक्रियेत वस्तुमान ना निर्माण होते ना नष्ट — अणू फक्त पुन्हा मांडले जातात, म्हणून एकूण वस्तुमान स्थिर राहते.",
        },
        detail: {
          en: "Burning wood seems to lose mass only because the smoke and gases escape unweighed — trap them and the mass is all there.",
          hi: "जलती लकड़ी का द्रव्यमान घटता दिखता है केवल इसलिए कि धुआँ-गैस बिन तौले भाग जाते हैं — उन्हें पकड़िए और द्रव्यमान पूरा है।",
          mr: "जळणारे लाकूड वस्तुमान गमावताना दिसते फक्त म्हणून की धूर-वायू न तोलता निसटतात — त्यांना पकडा आणि वस्तुमान पूर्ण.",
        },
        extra: {
          en: "This law is why chemical equations must BALANCE — every atom entering must leave.",
          hi: "इसी नियम से रासायनिक समीकरण संतुलित होने चाहिए — भीतर आया हर परमाणु बाहर निकले।",
          mr: "याच नियमामुळे रासायनिक समीकरणे संतुलित हवीत — आत आलेला प्रत्येक अणू बाहेर पडावा.",
        },
        pair: {
          left: {
            en: "Before equals after",
            hi: "पहले = बाद",
            mr: "आधी = नंतर",
          },
          right: {
            en: "atoms only rearranged",
            hi: "केवल फिर सजे परमाणु",
            mr: "फक्त पुन्हा मांडलेले अणू",
          },
        },
      },
      {
        id: "constant-proportions",
        name: {
          en: "The law of constant proportions",
          hi: "स्थिर अनुपात का नियम",
          mr: "स्थिर प्रमाणाचा नियम",
        },
        kind: "law",
        prompt: {
          en: "Water from any river, any ocean, any tap is always 8 parts oxygen to 1 part hydrogen by mass. Which law demands this?",
          hi: "किसी भी नदी, समुद्र, नल का पानी सदा द्रव्यमान से 8 भाग ऑक्सीजन और 1 भाग हाइड्रोजन होता है। यह कौन-सा नियम माँगता है?",
          mr: "कोणत्याही नदी, समुद्र, नळाचे पाणी नेहमी वस्तुमानाने 8 भाग ऑक्सिजन आणि 1 भाग हायड्रोजन. हे कोणता नियम मागतो?",
        },
        statement: {
          en: "A pure compound always holds its elements in the same fixed ratio by mass — water is forever 8 : 1 oxygen to hydrogen.",
          hi: "शुद्ध यौगिक अपने तत्वों को सदा उसी नियत द्रव्यमान-अनुपात में रखता है — पानी सदा 8 : 1 ऑक्सीजन से हाइड्रोजन।",
          mr: "शुद्ध संयुग आपल्या मूलद्रव्यांना नेहमी त्याच ठरलेल्या वस्तुमान-गुणोत्तरात ठेवते — पाणी नेहमी 8 : 1 ऑक्सिजन ते हायड्रोजन.",
        },
        pair: {
          left: {
            en: "Water always 8 : 1",
            hi: "पानी सदा 8 : 1",
            mr: "पाणी नेहमी 8 : 1",
          },
          right: {
            en: "elements in a fixed ratio",
            hi: "नियत अनुपात में तत्व",
            mr: "ठरलेल्या गुणोत्तरात मूलद्रव्ये",
          },
        },
      },
      {
        id: "atom",
        name: { en: "The atom", hi: "परमाणु", mr: "अणू" },
        kind: "particle",
        prompt: {
          en: "Which smallest particle of an element still carries that element's identity, and cannot be broken by any chemical means?",
          hi: "किसी तत्व का कौन-सा सबसे छोटा कण उस तत्व की पहचान अब भी रखता है, और किसी रासायनिक तरीक़े से टूट नहीं सकता?",
          mr: "एखाद्या मूलद्रव्याचा कोणता सर्वांत लहान कण त्या मूलद्रव्याची ओळख अजूनही ठेवतो, आणि कोणत्याही रासायनिक मार्गाने तुटू शकत नाही?",
        },
        statement: {
          en: "An atom is the smallest particle of an element — unbreakable by chemistry, and the building block of all matter.",
          hi: "परमाणु किसी तत्व का सबसे छोटा कण है — रसायन से अटूट, और सारे पदार्थ की ईंट।",
          mr: "अणू म्हणजे मूलद्रव्याचा सर्वांत लहान कण — रसायनाने न तुटणारा, आणि सर्व पदार्थाची वीट.",
        },
        detail: {
          en: "Atoms are unimaginably small — millions would sit across the width of a hair, uncountable in a grain of sand.",
          hi: "परमाणु अकल्पनीय रूप से छोटे हैं — बाल की चौड़ाई भर लाखों बैठें, रेत के कण में अनगिनत।",
          mr: "अणू अकल्पनीय लहान — केसाच्या रुंदीभर लाखो बसतील, वाळूच्या कणात अगणित.",
        },
        extra: {
          en: "Dalton first gave them scientific weight — his atomic theory explained the two laws of combination in one stroke.",
          hi: "डाल्टन ने पहले उन्हें वैज्ञानिक भार दिया — उनके परमाणु-सिद्धांत ने संयोजन के दोनों नियम एक झटके में समझाए।",
          mr: "डाल्टनने प्रथम त्यांना वैज्ञानिक वजन दिले — त्याच्या अणु-सिद्धान्ताने संयोगाचे दोन्ही नियम एका फटक्यात समजावले.",
        },
        pair: {
          left: {
            en: "The element's smallest particle",
            hi: "तत्व का सबसे छोटा कण",
            mr: "मूलद्रव्याचा सर्वांत लहान कण",
          },
          right: {
            en: "unbreakable by chemistry",
            hi: "रसायन से अटूट",
            mr: "रसायनाने न तुटणारा",
          },
        },
      },
      {
        id: "molecule",
        name: { en: "The molecule", hi: "अणु", mr: "रेणू" },
        kind: "particle",
        prompt: {
          en: "Two or more atoms bonded together — like O₂ or H₂O — form which particle, the smallest bit of a substance that can exist alone?",
          hi: "दो या अधिक परमाणु जुड़कर — जैसे O₂ या H₂O — कौन-सा कण बनाते हैं, किसी पदार्थ का सबसे छोटा टुकड़ा जो अकेला रह सके?",
          mr: "दोन वा अधिक अणू जुळून — जसे O₂ किंवा H₂O — कोणता कण बनवतात, पदार्थाचा सर्वांत लहान तुकडा जो एकटा राहू शकतो?",
        },
        statement: {
          en: "A molecule is atoms bonded together — the smallest unit of a substance able to exist freely, from O₂ to a sugar molecule.",
          hi: "अणु जुड़े हुए परमाणु हैं — किसी पदार्थ की सबसे छोटी स्वतंत्र इकाई, O₂ से शक्कर के अणु तक।",
          mr: "रेणू म्हणजे जुळलेले अणू — पदार्थाचे सर्वांत लहान स्वतंत्र एकक, O₂ पासून साखरेच्या रेणूपर्यंत.",
        },
        pair: {
          left: {
            en: "Atoms bonded together",
            hi: "जुड़े हुए परमाणु",
            mr: "जुळलेले अणू",
          },
          right: {
            en: "the smallest free-standing unit",
            hi: "सबसे छोटी स्वतंत्र इकाई",
            mr: "सर्वांत लहान स्वतंत्र एकक",
          },
        },
      },
      {
        id: "valency",
        name: { en: "Valency", hi: "संयोजकता", mr: "संयुजा" },
        kind: "concept",
        prompt: {
          en: "Hydrogen combines with one bond, oxygen with two, so water is H₂O. Which combining capacity of an atom fixes the formula?",
          hi: "हाइड्रोजन एक बंधन से, ऑक्सीजन दो से जुड़ता है, अतः पानी H₂O है। परमाणु की कौन-सी संयोजन-क्षमता सूत्र तय करती है?",
          mr: "हायड्रोजन एका बंधाने, ऑक्सिजन दोनने जुळतो, म्हणून पाणी H₂O. अणूची कोणती संयोग-क्षमता सूत्र ठरवते?",
        },
        statement: {
          en: "Valency is an atom's combining capacity — it tells how many bonds the atom forms, and balancing valencies writes the formula.",
          hi: "संयोजकता परमाणु की संयोजन-क्षमता है — बताती है परमाणु कितने बंधन बनाता है, और संयोजकताएँ संतुलित कर सूत्र लिखा जाता है।",
          mr: "संयुजा म्हणजे अणूची संयोग-क्षमता — अणू किती बंध करतो हे सांगते, आणि संयुजा संतुलित करून सूत्र लिहिले जाते.",
        },
        detail: {
          en: "Cross the valencies over: Al (3) and O (2) give Al₂O₃ — each atom's number becomes the other's subscript.",
          hi: "संयोजकताएँ आड़ी कीजिए: Al (3) और O (2) से Al₂O₃ — हर परमाणु की संख्या दूसरे का अनुलेखांक बनती है।",
          mr: "संयुजा आडव्या करा: Al (3) आणि O (2) ने Al₂O₃ — प्रत्येक अणूची संख्या दुसऱ्याचा पादांक होते.",
        },
        extra: {
          en: "Valency is why formulae are not arbitrary — the numbers come from the atoms' own bonding arithmetic.",
          hi: "संयोजकता से ही सूत्र मनमाने नहीं — संख्याएँ परमाणुओं के अपने बंधन-गणित से आती हैं।",
          mr: "संयुजेमुळेच सूत्रे मनमानी नाहीत — संख्या अणूंच्या स्वतःच्या बंध-गणितातून येतात.",
        },
        pair: {
          left: {
            en: "The combining capacity",
            hi: "संयोजन-क्षमता",
            mr: "संयोग-क्षमता",
          },
          right: {
            en: "the formula's hidden rule",
            hi: "सूत्र का छिपा नियम",
            mr: "सूत्राचा दडलेला नियम",
          },
        },
      },
      {
        id: "mole",
        name: { en: "The mole", hi: "मोल", mr: "मोल" },
        kind: "unit",
        prompt: {
          en: "A chemist counts atoms not one by one but in packets of 6.022 × 10²³. What is this chemist's 'dozen' called?",
          hi: "रसायनज्ञ परमाणु एक-एक नहीं, 6.022 × 10²³ के पैकेट में गिनता है। रसायनज्ञ के इस 'दर्जन' को क्या कहते हैं?",
          mr: "रसायनशास्त्रज्ञ अणू एकेक नव्हे, 6.022 × 10²³ च्या पुड्यांत मोजतो. रसायनशास्त्रज्ञाच्या या 'डझना'ला काय म्हणतात?",
        },
        statement: {
          en: "A mole is 6.022 × 10²³ particles — chemistry's counting unit, Avogadro's number, the bridge from atoms to weighable grams.",
          hi: "मोल 6.022 × 10²³ कण है — रसायन की गिनती-इकाई, अवोगाद्रो संख्या, परमाणुओं से तौलने योग्य ग्रामों का सेतु।",
          mr: "मोल म्हणजे 6.022 × 10²³ कण — रसायनशास्त्राचे मोजणी-एकक, अवोगाद्रो संख्या, अणूंपासून तोलण्याजोग्या ग्रॅमांचा पूल.",
        },
        detail: {
          en: "One mole of any substance weighs its formula mass in grams — 18 g of water, 12 g of carbon, each holding the same countless number.",
          hi: "किसी भी पदार्थ का एक मोल उसके सूत्र-द्रव्यमान जितने ग्राम का होता है — 18 ग्राम पानी, 12 ग्राम कार्बन, हर एक में वही अनगिनत संख्या।",
          mr: "कोणत्याही पदार्थाचा एक मोल त्याच्या सूत्र-वस्तुमानाइतके ग्रॅम — 18 ग्रॅम पाणी, 12 ग्रॅम कार्बन, प्रत्येकात तीच अगणित संख्या.",
        },
        extra: {
          en: "The mole lets a chemist weigh out atoms by the trillion-trillion, simply by reading a balance.",
          hi: "मोल रसायनज्ञ को खरब-खरब परमाणु केवल तराज़ू पढ़कर तौलने देता है।",
          mr: "मोल रसायनशास्त्रज्ञाला खर्व-खर्व अणू फक्त तराजू वाचून तोलू देतो.",
        },
        pair: {
          left: {
            en: "Chemistry's dozen",
            hi: "रसायन का दर्जन",
            mr: "रसायनशास्त्राचा डझन",
          },
          right: {
            en: "atoms weighed by the gram",
            hi: "ग्राम से तौले परमाणु",
            mr: "ग्रॅमने तोललेले अणू",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the term to its scale: A-atom, B-molecule, C-mole. Which trio is right?",
          hi: "पद को उसके पैमाने से मिलाइए: अ-परमाणु, ब-अणु, स-मोल। कौन-सी तिकड़ी सही है?",
          mr: "संज्ञेला तिच्या प्रमाणाशी जुळवा: अ-अणू, ब-रेणू, क-मोल. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: one element's smallest particle · B: bonded atoms, a substance's smallest free unit · C: a fixed count of 6.022 × 10²³ particles",
            hi: "अ: एक तत्व का सबसे छोटा कण · ब: जुड़े परमाणु, पदार्थ की सबसे छोटी स्वतंत्र इकाई · स: 6.022 × 10²³ कणों की नियत गिनती",
            mr: "अ: एका मूलद्रव्याचा सर्वांत लहान कण · ब: जुळलेले अणू, पदार्थाचे सर्वांत लहान स्वतंत्र एकक · क: 6.022 × 10²³ कणांची ठरलेली मोजणी",
          },
          {
            en: "A: a count of particles · B: one element's smallest particle · C: bonded atoms",
            hi: "अ: कणों की गिनती · ब: एक तत्व का सबसे छोटा कण · स: जुड़े परमाणु",
            mr: "अ: कणांची मोजणी · ब: एका मूलद्रव्याचा सर्वांत लहान कण · क: जुळलेले अणू",
          },
          {
            en: "A: bonded atoms · B: a count of particles · C: one element's smallest particle",
            hi: "अ: जुड़े परमाणु · ब: कणों की गिनती · स: एक तत्व का सबसे छोटा कण",
            mr: "अ: जुळलेले अणू · ब: कणांची मोजणी · क: एका मूलद्रव्याचा सर्वांत लहान कण",
          },
          {
            en: "All three mean the same thing at different names",
            hi: "तीनों अलग नामों की एक ही चीज़ हैं",
            mr: "तिघे वेगळ्या नावांची एकच गोष्ट",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "These three words work at three different scales, and confusing them muddles all of chemistry. An atom is the indivisible unit of an element. A molecule is a small group of atoms bonded into the smallest piece of a substance that can stand alone. A mole is not a particle at all but a NUMBER — a specific count, like 'dozen' but astronomically large — used to bundle atoms and molecules into quantities big enough to weigh on a balance. Particle, particle, count: one is a thing, one is a thing, one is a tally.",
          hi: "ये तीन शब्द तीन अलग पैमानों पर काम करते हैं, और इन्हें गड्डमड्ड करना पूरी रसायन उलझा देता है। परमाणु किसी तत्व की अविभाज्य इकाई है। अणु परमाणुओं का छोटा समूह है, जो पदार्थ का सबसे छोटा अकेला रह सकने वाला टुकड़ा बनाता है। मोल कोई कण नहीं, एक संख्या है — एक निश्चित गिनती, 'दर्जन' जैसी पर खगोलीय रूप से बड़ी — जो परमाणुओं-अणुओं को तराज़ू पर तौलने लायक़ मात्रा में बाँधती है। कण, कण, गिनती: एक चीज़ है, एक चीज़ है, एक गिनती।",
          mr: "हे तीन शब्द तीन वेगळ्या प्रमाणांवर काम करतात, आणि त्यांची गल्लत अख्खे रसायनशास्त्र गोंधळवते. अणू म्हणजे मूलद्रव्याचे अविभाज्य एकक. रेणू म्हणजे अणूंचा लहान गट, पदार्थाचा एकटा राहू शकणारा सर्वांत लहान तुकडा. मोल हा कणच नाही, एक संख्या — एक ठरावीक मोजणी, 'डझना'सारखी पण खगोलीय मोठी — अणू-रेणूंना तराजूवर तोलण्याजोग्या राशीत बांधणारी. कण, कण, मोजणी: एक वस्तू, एक वस्तू, एक गणती.",
        },
      },
      {
        level: 6,
        stem: {
          en: "When magnesium ribbon burns in air, the white ash left behind weighs MORE than the ribbon did. Does this break the law of conservation of mass?",
          hi: "जब मैग्नीशियम फ़ीता हवा में जलता है, बची सफ़ेद राख फ़ीते से ज़्यादा भारी होती है। क्या यह द्रव्यमान संरक्षण नियम तोड़ता है?",
          mr: "जेव्हा मॅग्नेशियम फीत हवेत जळते, उरलेली पांढरी राख फितीहून जास्त जड असते. हे वस्तुमान अक्षय्यतेचा नियम मोडते का?",
        },
        choices: [
          {
            en: "No — the ash is magnesium PLUS the oxygen it grabbed from the air; count that oxygen's mass and the total before equals the total after exactly, as the law demands",
            hi: "नहीं — राख मैग्नीशियम और उसने हवा से पकड़ी ऑक्सीजन है; उस ऑक्सीजन का द्रव्यमान गिनिए तो पहले का कुल बाद के कुल से ठीक बराबर, जैसा नियम माँगता है",
            mr: "नाही — राख म्हणजे मॅग्नेशियम अधिक त्याने हवेतून पकडलेला ऑक्सिजन; त्या ऑक्सिजनचे वस्तुमान मोजा आणि आधीचे एकूण नंतरच्या एकुणाइतके नेमके, नियम मागतो तसे",
          },
          {
            en: "Yes — mass is clearly created when things burn",
            hi: "हाँ — जलने पर द्रव्यमान स्पष्ट रूप से बनता है",
            mr: "हो — जळताना वस्तुमान स्पष्टपणे निर्माण होते",
          },
          {
            en: "The extra weight is smoke settling on the ash",
            hi: "अतिरिक्त वज़न राख पर बैठा धुआँ है",
            mr: "जादा वजन म्हणजे राखेवर बसलेला धूर",
          },
          {
            en: "The law only applies to reactions in water",
            hi: "नियम केवल पानी में होती अभिक्रियाओं पर लागू है",
            mr: "नियम फक्त पाण्यातल्या अभिक्रियांना लागू",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The scales tell the truth only if you weigh everything that took part. The ribbon did not gain mass from nowhere — it seized oxygen out of the surrounding air and locked it into magnesium oxide, and that captured oxygen has mass of its own. Weigh the magnesium AND the oxygen it consumed before, then weigh the ash after, and the two totals match to the last milligram. The apparent gain is the mirror image of the burning-wood puzzle, where mass seems to vanish because the escaping gases go unweighed. In both cases the law holds perfectly; it is our accounting, not nature's, that was incomplete. Conservation of mass is really a demand to count the invisible reactants and products too.",
          hi: "तराज़ू सच तभी बताता है जब आप उस सबको तौलें जिसने भाग लिया। फ़ीते ने कहीं से द्रव्यमान नहीं पाया — उसने चारों ओर की हवा से ऑक्सीजन झपटकर मैग्नीशियम ऑक्साइड में बंद कर लिया, और उस पकड़ी ऑक्सीजन का अपना द्रव्यमान है। पहले मैग्नीशियम और उसकी खाई ऑक्सीजन तौलिए, फिर बाद में राख, और दोनों योग आख़िरी मिलीग्राम तक मिलते हैं। यह दिखता लाभ जलती-लकड़ी की पहेली का दर्पण-प्रतिबिंब है, जहाँ द्रव्यमान ग़ायब दिखता है क्योंकि भागती गैसें बिन तौले जाती हैं। दोनों में नियम पूरी तरह टिकता है; अधूरा हमारा हिसाब था, प्रकृति का नहीं। द्रव्यमान संरक्षण दरअसल अदृश्य अभिकारकों और उत्पादों को भी गिनने की माँग है।",
          mr: "तराजू खरे तेव्हाच सांगतो जेव्हा भाग घेतलेले सारे तोलता. फितीने कुठूनही वस्तुमान मिळवले नाही — तिने भोवतीच्या हवेतून ऑक्सिजन हिसकावून मॅग्नेशियम ऑक्साइडमध्ये बंद केला, आणि त्या पकडलेल्या ऑक्सिजनचे स्वतःचे वस्तुमान आहे. आधी मॅग्नेशियम आणि त्याने खाल्लेला ऑक्सिजन तोला, मग नंतर राख, आणि दोन्ही बेरजा शेवटच्या मिलिग्रॅमपर्यंत जुळतात. हा दिसणारा वाढावा जळणाऱ्या-लाकडाच्या कोड्याचे आरसा-प्रतिबिंब, जिथे वस्तुमान गायब दिसते कारण निसटणारे वायू न तोलता जातात. दोन्हींत नियम पूर्ण टिकतो; अपुरा आपला हिशेब होता, निसर्गाचा नाही. वस्तुमान अक्षय्यता म्हणजे खरे तर अदृश्य अभिक्रियाकारक आणि उत्पादनेही मोजण्याची मागणी.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Structure of the Atom (a nucleus and its electron shells)  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-structure-atom",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 4 — Structure of the Atom",
      hi: "अध्याय 4 — परमाणु की संरचना",
      mr: "प्रकरण 4 — अणूची रचना",
    },
    name: {
      en: "Structure of the Atom",
      hi: "परमाणु की संरचना",
      mr: "अणूची रचना",
    },
    summary: {
      en: "Inside the 'unbreakable' atom: a tiny dense nucleus of protons and neutrons, electrons in shells around it, the proton-count naming the element — and isotopes as same-element twins of different weight.",
      hi: "'अटूट' परमाणु के भीतर: प्रोटॉन-न्यूट्रॉन का नन्हा घना नाभिक, चारों ओर कोशों में इलेक्ट्रॉन, प्रोटॉन-संख्या तत्व का नाम रखती — और समस्थानिक बतौर अलग वज़न के सम-तत्व जुड़वाँ।",
      mr: "'न तुटणाऱ्या' अणूच्या आत: प्रोटॉन-न्यूट्रॉनचे इवले दाट केंद्रक, भोवती कवचांत इलेक्ट्रॉन, प्रोटॉन-संख्या मूलद्रव्याचे नाव ठेवते — आणि समस्थानिक म्हणजे वेगळ्या वजनाचे सम-मूलद्रव्य जुळे.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "nucleus",
        name: { en: "The nucleus", hi: "नाभिक", mr: "केंद्रक" },
        kind: "part",
        prompt: {
          en: "Rutherford's gold-foil experiment showed the atom's mass and positive charge crammed into a tiny centre. What is that centre called?",
          hi: "रदरफ़ोर्ड के स्वर्ण-पत्र प्रयोग ने दिखाया कि परमाणु का द्रव्यमान और धन-आवेश एक नन्हे केंद्र में ठसा है। उस केंद्र को क्या कहते हैं?",
          mr: "रुदरफोर्डच्या सुवर्ण-पत्र प्रयोगाने दाखवले की अणूचे वस्तुमान आणि धन-भार एका इवल्या केंद्रात कोंबले आहे. त्या केंद्राला काय म्हणतात?",
        },
        statement: {
          en: "The nucleus is the atom's tiny dense core — nearly all its mass and all its positive charge, with vast empty space around it.",
          hi: "नाभिक परमाणु का नन्हा घना क्रोड है — उसका लगभग सारा द्रव्यमान और पूरा धन-आवेश, चारों ओर विशाल ख़ाली जगह।",
          mr: "केंद्रक म्हणजे अणूचा इवला दाट गाभा — त्याचे जवळजवळ सारे वस्तुमान आणि सारा धन-भार, भोवती प्रचंड रिकामी जागा.",
        },
        detail: {
          en: "Most of Rutherford's particles sailed straight through the foil — the atom is almost entirely empty; the nucleus is a speck at its heart.",
          hi: "रदरफ़ोर्ड के अधिकांश कण पत्र के आर-पार सीधे निकल गए — परमाणु लगभग पूरा ख़ाली है; नाभिक उसके हृदय में एक कण है।",
          mr: "रुदरफोर्डचे बहुतेक कण पत्र्यातून सरळ निघून गेले — अणू जवळजवळ पूर्ण रिकामा; केंद्रक त्याच्या हृदयातला एक ठिपका.",
        },
        extra: {
          en: "If the atom were a stadium, the nucleus would be a pea at the centre circle — the rest is electrons and emptiness.",
          hi: "परमाणु स्टेडियम हो तो नाभिक बीच घेरे में एक मटर होगा — बाक़ी इलेक्ट्रॉन और ख़ालीपन।",
          mr: "अणू स्टेडियम असेल तर केंद्रक मध्यवर्तुळात एक वाटाणा — बाकी इलेक्ट्रॉन आणि पोकळी.",
        },
        pair: {
          left: {
            en: "The tiny dense core",
            hi: "नन्हा घना क्रोड",
            mr: "इवला दाट गाभा",
          },
          right: {
            en: "almost all the mass",
            hi: "लगभग सारा द्रव्यमान",
            mr: "जवळजवळ सारे वस्तुमान",
          },
        },
      },
      {
        id: "proton",
        name: { en: "The proton", hi: "प्रोटॉन", mr: "प्रोटॉन" },
        kind: "particle",
        prompt: {
          en: "Which positively charged nuclear particle, counted, tells you exactly which element the atom is?",
          hi: "कौन-सा धन-आवेशित नाभिकीय कण, गिना जाए तो ठीक बता देता है कि परमाणु कौन-सा तत्व है?",
          mr: "कोणता धन-भारित केंद्रकीय कण, मोजला तर नेमके सांगतो की अणू कोणते मूलद्रव्य आहे?",
        },
        statement: {
          en: "The proton carries positive charge and sits in the nucleus — its count, the atomic number, is the atom's identity card.",
          hi: "प्रोटॉन धन-आवेश ढोता और नाभिक में बैठता है — उसकी गिनती, परमाणु-संख्या, परमाणु का पहचान-पत्र है।",
          mr: "प्रोटॉन धन-भार वाहतो आणि केंद्रकात बसतो — त्याची मोजणी, अणुक्रमांक, अणूचे ओळखपत्र.",
        },
        detail: {
          en: "One proton is hydrogen, six is carbon, eight is oxygen — change the proton count and you change the element itself.",
          hi: "एक प्रोटॉन हाइड्रोजन, छह कार्बन, आठ ऑक्सीजन — प्रोटॉन-गिनती बदलिए और तत्व ही बदल जाता है।",
          mr: "एक प्रोटॉन हायड्रोजन, सहा कार्बन, आठ ऑक्सिजन — प्रोटॉन-मोजणी बदला आणि मूलद्रव्यच बदलते.",
        },
        extra: {
          en: "The atomic number, not the mass, defines the element — it is the true name written in protons.",
          hi: "तत्व को द्रव्यमान नहीं, परमाणु-संख्या परिभाषित करती है — यही प्रोटॉनों में लिखा असली नाम है।",
          mr: "मूलद्रव्याला वस्तुमान नव्हे, अणुक्रमांक परिभाषित करतो — हेच प्रोटॉनांत लिहिलेले खरे नाव.",
        },
        pair: {
          left: {
            en: "The counted positive",
            hi: "गिना गया धन",
            mr: "मोजलेला धन",
          },
          right: {
            en: "the element's identity",
            hi: "तत्व की पहचान",
            mr: "मूलद्रव्याची ओळख",
          },
        },
      },
      {
        id: "neutron",
        name: { en: "The neutron", hi: "न्यूट्रॉन", mr: "न्यूट्रॉन" },
        kind: "particle",
        prompt: {
          en: "Which nuclear particle has mass like a proton but NO charge, adding weight to the atom without changing its element?",
          hi: "कौन-सा नाभिकीय कण प्रोटॉन जैसा द्रव्यमान रखता है पर आवेश नहीं, परमाणु में वज़न जोड़ता है बिना तत्व बदले?",
          mr: "कोणता केंद्रकीय कण प्रोटॉनसारखे वस्तुमान ठेवतो पण भार नाही, अणूत वजन जोडतो मूलद्रव्य न बदलता?",
        },
        statement: {
          en: "The neutron is a chargeless nuclear particle with a proton's mass — it changes the atom's weight, never its element.",
          hi: "न्यूट्रॉन बिना आवेश का नाभिकीय कण है, प्रोटॉन जितने द्रव्यमान का — वह परमाणु का वज़न बदलता है, तत्व कभी नहीं।",
          mr: "न्यूट्रॉन म्हणजे भाराविनाचा केंद्रकीय कण, प्रोटॉनइतक्या वस्तुमानाचा — तो अणूचे वजन बदलतो, मूलद्रव्य कधीच नाही.",
        },
        pair: {
          left: {
            en: "Mass without charge",
            hi: "बिना आवेश का द्रव्यमान",
            mr: "भाराविनाचे वस्तुमान",
          },
          right: {
            en: "weight changed, element kept",
            hi: "वज़न बदला, तत्व वही",
            mr: "वजन बदलले, मूलद्रव्य तेच",
          },
        },
      },
      {
        id: "electron",
        name: { en: "The electron", hi: "इलेक्ट्रॉन", mr: "इलेक्ट्रॉन" },
        kind: "particle",
        prompt: {
          en: "Which tiny negatively charged particle orbits the nucleus in shells, and does the actual work of chemistry?",
          hi: "कौन-सा नन्हा ऋण-आवेशित कण नाभिक के गिर्द कोशों में परिक्रमा करता है, और रसायन का असली काम करता है?",
          mr: "कोणता इवला ऋण-भारित कण केंद्रकाभोवती कवचांत फिरतो, आणि रसायनशास्त्राचे खरे काम करतो?",
        },
        statement: {
          en: "The electron is the light, negatively charged particle in shells around the nucleus — and its outer shell drives all bonding.",
          hi: "इलेक्ट्रॉन नाभिक के गिर्द कोशों में हल्का, ऋण-आवेशित कण है — और उसका बाहरी कोश सारा बंधन चलाता है।",
          mr: "इलेक्ट्रॉन म्हणजे केंद्रकाभोवती कवचांतला हलका, ऋण-भारित कण — आणि त्याचे बाहेरचे कवच सारे बंध चालवते.",
        },
        detail: {
          en: "In a neutral atom, electrons exactly equal protons — negative balancing positive to zero overall charge.",
          hi: "उदासीन परमाणु में इलेक्ट्रॉन ठीक प्रोटॉनों के बराबर होते हैं — ऋण धन को संतुलित कर कुल आवेश शून्य।",
          mr: "उदासीन अणूत इलेक्ट्रॉन नेमके प्रोटॉनांइतके — ऋण धनाला संतुलित करून एकूण भार शून्य.",
        },
        extra: {
          en: "Gain or lose an electron and the atom becomes an ion — charged, and eager to react.",
          hi: "इलेक्ट्रॉन पाइए या खोइए और परमाणु आयन बन जाता है — आवेशित, और अभिक्रिया को उत्सुक।",
          mr: "इलेक्ट्रॉन मिळवा वा गमवा आणि अणू आयन होतो — भारित, आणि अभिक्रियेला उत्सुक.",
        },
        pair: {
          left: {
            en: "The orbiting negative",
            hi: "परिक्रमा करता ऋण",
            mr: "फिरणारा ऋण",
          },
          right: {
            en: "the doer of chemistry",
            hi: "रसायन का कर्ता",
            mr: "रसायनशास्त्राचा कर्ता",
          },
        },
      },
      {
        id: "shells",
        name: { en: "Electron shells", hi: "इलेक्ट्रॉन कोश", mr: "इलेक्ट्रॉन कवचे" },
        kind: "structure",
        prompt: {
          en: "Electrons fill fixed energy levels around the nucleus — the first holding 2, the next 8. What are these levels called?",
          hi: "इलेक्ट्रॉन नाभिक के गिर्द नियत ऊर्जा-स्तर भरते हैं — पहला 2, अगला 8 रखता। इन स्तरों को क्या कहते हैं?",
          mr: "इलेक्ट्रॉन केंद्रकाभोवती ठरलेले ऊर्जा-स्तर भरतात — पहिला 2, पुढचा 8 ठेवतो. या स्तरांना काय म्हणतात?",
        },
        statement: {
          en: "Electron shells are fixed energy levels — the first holds 2, the second 8, filling inward-out by the 2n² rule.",
          hi: "इलेक्ट्रॉन कोश नियत ऊर्जा-स्तर हैं — पहला 2, दूसरा 8 रखता, 2n² नियम से भीतर से बाहर भरते।",
          mr: "इलेक्ट्रॉन कवचे म्हणजे ठरलेले ऊर्जा-स्तर — पहिला 2, दुसरा 8 ठेवतो, 2n² नियमाने आतून बाहेर भरत.",
        },
        detail: {
          en: "The outermost shell — the valence shell — decides the atom's chemistry, since bonding trades those outer electrons.",
          hi: "सबसे बाहरी कोश — संयोजी कोश — परमाणु का रसायन तय करता है, क्योंकि बंधन उन्हीं बाहरी इलेक्ट्रॉनों का लेन-देन है।",
          mr: "सर्वांत बाहेरचे कवच — संयुजा कवच — अणूचे रसायन ठरवते, कारण बंध म्हणजे त्याच बाहेरच्या इलेक्ट्रॉनांची देवाणघेवाण.",
        },
        extra: {
          en: "A full outer shell means a happy, unreactive atom — that is the secret of the noble gases.",
          hi: "भरा बाहरी कोश यानी संतुष्ट, अक्रियाशील परमाणु — यही उत्कृष्ट गैसों का राज़ है।",
          mr: "भरलेले बाहेरचे कवच म्हणजे समाधानी, अक्रिय अणू — हेच उदात्त वायूंचे गुपित.",
        },
        pair: {
          left: {
            en: "The fixed energy levels",
            hi: "नियत ऊर्जा-स्तर",
            mr: "ठरलेले ऊर्जा-स्तर",
          },
          right: {
            en: "2, then 8, filling out",
            hi: "2, फिर 8, भरते हुए",
            mr: "2, मग 8, भरत",
          },
        },
      },
      {
        id: "isotopes",
        name: { en: "Isotopes", hi: "समस्थानिक", mr: "समस्थानिक" },
        kind: "concept",
        prompt: {
          en: "Carbon-12 and carbon-14 have the same protons but different neutrons. What are such same-element, different-mass atoms called?",
          hi: "कार्बन-12 और कार्बन-14 में प्रोटॉन समान पर न्यूट्रॉन अलग हैं। ऐसे सम-तत्व, अलग-द्रव्यमान परमाणुओं को क्या कहते हैं?",
          mr: "कार्बन-12 आणि कार्बन-14 मध्ये प्रोटॉन समान पण न्यूट्रॉन वेगळे. अशा सम-मूलद्रव्य, वेगळ्या-वस्तुमानाच्या अणूंना काय म्हणतात?",
        },
        statement: {
          en: "Isotopes are atoms of one element with different neutron counts — same chemistry, different mass, like carbon-12 and carbon-14.",
          hi: "समस्थानिक एक ही तत्व के अलग न्यूट्रॉन-गिनती वाले परमाणु हैं — रसायन वही, द्रव्यमान अलग, जैसे कार्बन-12 और कार्बन-14।",
          mr: "समस्थानिक म्हणजे एकाच मूलद्रव्याचे वेगळ्या न्यूट्रॉन-मोजणीचे अणू — रसायन तेच, वस्तुमान वेगळे, जसे कार्बन-12 आणि कार्बन-14.",
        },
        detail: {
          en: "Carbon-14's slow decay dates ancient wood and bone — an isotope reading time itself.",
          hi: "कार्बन-14 का धीमा क्षय प्राचीन लकड़ी और हड्डी की तारीख़ बताता है — समय ही पढ़ता एक समस्थानिक।",
          mr: "कार्बन-14 चा संथ क्षय प्राचीन लाकूड आणि हाडांची तारीख सांगतो — काळच वाचणारा समस्थानिक.",
        },
        extra: {
          en: "Because chemistry lives in the electrons, isotopes react identically — the extra neutrons change only the weight.",
          hi: "चूँकि रसायन इलेक्ट्रॉनों में बसता है, समस्थानिक एक-सी अभिक्रिया करते हैं — अतिरिक्त न्यूट्रॉन केवल वज़न बदलते हैं।",
          mr: "रसायन इलेक्ट्रॉनांत वसते म्हणून समस्थानिक सारखीच अभिक्रिया करतात — जादा न्यूट्रॉन फक्त वजन बदलतात.",
        },
        pair: {
          left: {
            en: "Same element, extra neutrons",
            hi: "सम तत्व, अतिरिक्त न्यूट्रॉन",
            mr: "सम मूलद्रव्य, जादा न्यूट्रॉन",
          },
          right: {
            en: "same chemistry, different mass",
            hi: "रसायन वही, द्रव्यमान अलग",
            mr: "रसायन तेच, वस्तुमान वेगळे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the particle to its job: A-proton, B-neutron, C-electron. Which trio is right?",
          hi: "कण को उसके काम से मिलाइए: अ-प्रोटॉन, ब-न्यूट्रॉन, स-इलेक्ट्रॉन। कौन-सी तिकड़ी सही है?",
          mr: "कणाला त्याच्या कामाशी जुळवा: अ-प्रोटॉन, ब-न्यूट्रॉन, क-इलेक्ट्रॉन. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: positive, names the element · B: neutral, adds mass · C: negative, drives bonding",
            hi: "अ: धन, तत्व का नाम रखता · ब: उदासीन, द्रव्यमान जोड़ता · स: ऋण, बंधन चलाता",
            mr: "अ: धन, मूलद्रव्याचे नाव ठेवतो · ब: उदासीन, वस्तुमान जोडतो · क: ऋण, बंध चालवतो",
          },
          {
            en: "A: negative, drives bonding · B: positive, names element · C: neutral, adds mass",
            hi: "अ: ऋण, बंधन चलाता · ब: धन, तत्व का नाम · स: उदासीन, द्रव्यमान जोड़ता",
            mr: "अ: ऋण, बंध चालवतो · ब: धन, मूलद्रव्याचे नाव · क: उदासीन, वस्तुमान जोडतो",
          },
          {
            en: "A: neutral, adds mass · B: negative, drives bonding · C: positive, names element",
            hi: "अ: उदासीन, द्रव्यमान जोड़ता · ब: ऋण, बंधन चलाता · स: धन, तत्व का नाम",
            mr: "अ: उदासीन, वस्तुमान जोडतो · ब: ऋण, बंध चालवतो · क: धन, मूलद्रव्याचे नाव",
          },
          {
            en: "All three particles do the same job",
            hi: "तीनों कण एक ही काम करते हैं",
            mr: "तिन्ही कण एकच काम करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three particles, three distinct duties. The proton, positive and in the nucleus, is the name-bearer — its count is the atomic number, and to change it is to change the element itself. The neutron, also nuclear but chargeless, is the makeweight — it adjusts mass and gives rise to isotopes without touching identity. The electron, light and negative and out in the shells, is the worker — bonding is entirely a game of outer electrons. Nucleus decides WHAT the atom is; electrons decide HOW it behaves.",
          hi: "तीन कण, तीन अलग कर्तव्य। प्रोटॉन, धन और नाभिक में, नाम-धारी है — उसकी गिनती परमाणु-संख्या है, और उसे बदलना तत्व ही बदलना। न्यूट्रॉन, नाभिकीय पर बिना आवेश, वज़न-सम है — वह द्रव्यमान समायोजित करता और पहचान छुए बिना समस्थानिक जनता है। इलेक्ट्रॉन, हल्का, ऋण और कोशों में, कारीगर है — बंधन पूरी तरह बाहरी इलेक्ट्रॉनों का खेल है। नाभिक तय करता है परमाणु क्या है; इलेक्ट्रॉन तय करते हैं वह कैसे बरतता है।",
          mr: "तीन कण, तीन वेगळी कर्तव्ये. प्रोटॉन, धन आणि केंद्रकात, नाव-धारक — त्याची मोजणी अणुक्रमांक, आणि तो बदलणे म्हणजे मूलद्रव्यच बदलणे. न्यूट्रॉन, केंद्रकीय पण भाराविना, वजन-भरणी — तो वस्तुमान जुळवतो आणि ओळख न स्पर्शता समस्थानिक जन्मवतो. इलेक्ट्रॉन, हलका, ऋण आणि कवचांत, कारागीर — बंध पूर्णपणे बाहेरच्या इलेक्ट्रॉनांचा खेळ. केंद्रक ठरवते अणू काय आहे; इलेक्ट्रॉन ठरवतात तो कसा वागतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Chlorine's atomic mass is listed as 35.5 — yet no single chlorine atom weighs 35.5, since atoms are built from whole protons and neutrons. How can an element's mass be a fraction?",
          hi: "क्लोरीन का परमाणु द्रव्यमान 35.5 दर्ज है — फिर भी कोई अकेला क्लोरीन परमाणु 35.5 का नहीं होता, क्योंकि परमाणु पूर्ण प्रोटॉन-न्यूट्रॉन से बने हैं। तत्व का द्रव्यमान भिन्न कैसे हो सकता है?",
          mr: "क्लोरीनचे अणुवस्तुमान 35.5 नोंदलेले — तरी कोणताही एकटा क्लोरीन अणू 35.5 चा नसतो, कारण अणू पूर्ण प्रोटॉन-न्यूट्रॉनांनी बनतात. मूलद्रव्याचे वस्तुमान अपूर्णांक कसे असू शकते?",
        },
        choices: [
          {
            en: "35.5 is a weighted AVERAGE of chlorine's isotopes — about three-quarters chlorine-35 and one-quarter chlorine-37 — so the listed mass is a mixture's average, not any one atom's real weight",
            hi: "35.5 क्लोरीन के समस्थानिकों का भारित औसत है — लगभग तीन-चौथाई क्लोरीन-35 और एक-चौथाई क्लोरीन-37 — अतः दर्ज द्रव्यमान मिश्रण का औसत है, किसी एक परमाणु का असली वज़न नहीं",
            mr: "35.5 म्हणजे क्लोरीनच्या समस्थानिकांचा भारित सरासरी — सुमारे तीन-चतुर्थांश क्लोरीन-35 आणि एक-चतुर्थांश क्लोरीन-37 — म्हणून नोंदलेले वस्तुमान मिश्रणाची सरासरी, कोणत्या एका अणूचे खरे वजन नाही",
          },
          {
            en: "Half a neutron exists in every chlorine atom",
            hi: "हर क्लोरीन परमाणु में आधा न्यूट्रॉन होता है",
            mr: "प्रत्येक क्लोरीन अणूत अर्धा न्यूट्रॉन असतो",
          },
          {
            en: "The measurement is simply too imprecise",
            hi: "मापन बस बहुत अशुद्ध है",
            mr: "मापन नुसते फार अशुद्ध",
          },
          {
            en: "Chlorine atoms slowly lose weight over time",
            hi: "क्लोरीन परमाणु समय के साथ धीरे-धीरे वज़न खोते हैं",
            mr: "क्लोरीन अणू काळानुसार हळूहळू वजन गमावतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "No atom weighs 35.5, and none needs to. Real chlorine is a blend of two isotopes: chlorine-35 (17 protons, 18 neutrons) and chlorine-37 (17 protons, 20 neutrons). Both are unmistakably chlorine — same 17 protons, same chemistry — but they differ in neutron count and hence in mass. In any natural sample, roughly three atoms in four are the lighter kind and one in four the heavier, and the number on the periodic table is their weighted average: (0.75 × 35) + (0.25 × 37) ≈ 35.5. So a fractional atomic mass is not a broken atom but an honest report of a mixture — the periodic table quietly averaging every isotope an element comes in. It is the same statistical move as a cricket team's 'average score': no innings need equal it for the average to be true.",
          hi: "कोई परमाणु 35.5 का नहीं, और किसी को होने की ज़रूरत नहीं। असली क्लोरीन दो समस्थानिकों का मिश्रण है: क्लोरीन-35 (17 प्रोटॉन, 18 न्यूट्रॉन) और क्लोरीन-37 (17 प्रोटॉन, 20 न्यूट्रॉन)। दोनों निःसंदेह क्लोरीन हैं — वही 17 प्रोटॉन, वही रसायन — पर न्यूट्रॉन-गिनती और इसलिए द्रव्यमान में भिन्न। किसी भी प्राकृतिक नमूने में लगभग चार में तीन परमाणु हल्के और एक भारी होते हैं, और आवर्त सारणी की संख्या उनका भारित औसत है: (0.75 × 35) + (0.25 × 37) ≈ 35.5। अतः भिन्न परमाणु-द्रव्यमान टूटा परमाणु नहीं, एक मिश्रण की ईमानदार रिपोर्ट है — आवर्त सारणी चुपचाप हर समस्थानिक का औसत लेती हुई। यह वही सांख्यिकीय चाल है जो क्रिकेट टीम के 'औसत स्कोर' की है: औसत सच होने को किसी पारी का उसके बराबर होना ज़रूरी नहीं।",
          mr: "कोणताही अणू 35.5 चा नाही, आणि कोणाला असण्याची गरज नाही. खरा क्लोरीन दोन समस्थानिकांचे मिश्रण: क्लोरीन-35 (17 प्रोटॉन, 18 न्यूट्रॉन) आणि क्लोरीन-37 (17 प्रोटॉन, 20 न्यूट्रॉन). दोन्ही निःसंशय क्लोरीन — तेच 17 प्रोटॉन, तेच रसायन — पण न्यूट्रॉन-मोजणी आणि म्हणून वस्तुमानात वेगळे. कोणत्याही नैसर्गिक नमुन्यात सुमारे चारांत तीन अणू हलके आणि एक जड, आणि आवर्तसारणीतली संख्या त्यांचा भारित सरासरी: (0.75 × 35) + (0.25 × 37) ≈ 35.5. म्हणून अपूर्णांक अणुवस्तुमान म्हणजे तुटलेला अणू नव्हे, मिश्रणाचा प्रामाणिक अहवाल — आवर्तसारणी गुपचूप प्रत्येक समस्थानिकाची सरासरी घेत. ही तीच सांख्यिकीय चाल जी क्रिकेट संघाच्या 'सरासरी धावसंख्ये'ची: सरासरी खरी होण्यासाठी कोणत्या डावाने तिच्याइतके असण्याची गरज नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Is Matter Around Us Pure (mixtures, solutions, separation)  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-is-matter-pure",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 2 — Is Matter Around Us Pure",
      hi: "अध्याय 2 — क्या हमारे आस-पास के पदार्थ शुद्ध हैं",
      mr: "प्रकरण 2 — आपल्या सभोवतालचे पदार्थ शुद्ध आहेत का",
    },
    name: {
      en: "Is Matter Around Us Pure",
      hi: "क्या हमारे आस-पास के पदार्थ शुद्ध हैं",
      mr: "आपल्या सभोवतालचे पदार्थ शुद्ध आहेत का",
    },
    summary: {
      en: "Almost nothing around us is pure: mixtures split into solutions, suspensions and the in-between colloid that scatters a torch-beam. Each mixture betrays its type by particle size, and each yields to a separation trick chosen to match it.",
      hi: "हमारे आस-पास लगभग कुछ भी शुद्ध नहीं: मिश्रण विलयन, निलंबन और बीच के कोलॉइड में बँटते हैं जो टॉर्च की किरण बिखेरता है। हर मिश्रण अपना प्रकार कण-आकार से बताता, और हर एक अपने मेल की पृथक्करण-चाल से खुलता है।",
      mr: "आपल्या सभोवताली जवळपास काहीच शुद्ध नाही: मिश्रणे द्रावण, निलंबन आणि मधल्या कलिलात विभागतात जे बॅटरीचा किरण विखुरते. प्रत्येक मिश्रण आपला प्रकार कण-आकाराने सांगते, आणि प्रत्येक आपल्या जुळणीच्या पृथक्करण-युक्तीने उलगडते.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "pure-substance",
        name: {
          en: "A pure substance",
          hi: "शुद्ध पदार्थ",
          mr: "शुद्ध पदार्थ",
        },
        kind: "idea",
        prompt: {
          en: "In science, what does it take for a sample to earn the word 'pure'?",
          hi: "विज्ञान में किसी नमूने को 'शुद्ध' शब्द पाने के लिए क्या चाहिए?",
          mr: "विज्ञानात एखाद्या नमुन्याला 'शुद्ध' हा शब्द मिळवण्यासाठी काय लागते?",
        },
        statement: {
          en: "A pure substance is made of one kind of particle throughout — every part identical, with no other matter mixed in.",
          hi: "शुद्ध पदार्थ पूरे में एक ही प्रकार के कणों से बना है — हर भाग एक-सा, कोई अन्य पदार्थ मिला नहीं।",
          mr: "शुद्ध पदार्थ संपूर्णभर एकाच प्रकारच्या कणांनी बनतो — प्रत्येक भाग सारखा, दुसरा कोणताही पदार्थ मिसळलेला नाही.",
        },
        detail: {
          en: "By this rule milk, air and sea water are all mixtures — only things like pure gold, distilled water or a single element qualify.",
          hi: "इस नियम से दूध, हवा और समुद्री पानी सब मिश्रण हैं — केवल शुद्ध सोना, आसुत जल या कोई एक तत्व ही योग्य हैं।",
          mr: "या नियमाने दूध, हवा आणि समुद्राचे पाणी ही सारी मिश्रणे — फक्त शुद्ध सोने, ऊर्ध्वपातित पाणी किंवा एखादे मूलद्रव्यच पात्र.",
        },
        extra: {
          en: "A pure substance melts and boils at one sharp temperature; a mixture's melting is smeared across a range.",
          hi: "शुद्ध पदार्थ एक तीक्ष्ण तापमान पर गलता-उबलता है; मिश्रण का गलन एक परास में फैला रहता है।",
          mr: "शुद्ध पदार्थ एका तीक्ष्ण तापमानावर वितळतो-उकळतो; मिश्रणाचे वितळणे एका पल्ल्यात पसरलेले.",
        },
        pair: {
          left: {
            en: "One kind of particle throughout",
            hi: "पूरे में एक प्रकार का कण",
            mr: "संपूर्णभर एक प्रकारचा कण",
          },
          right: {
            en: "a sharp, single melting point",
            hi: "तीक्ष्ण, एकल गलनांक",
            mr: "तीक्ष्ण, एकल वितळणबिंदू",
          },
        },
      },
      {
        id: "solution",
        name: { en: "A true solution", hi: "वास्तविक विलयन", mr: "खरे द्रावण" },
        kind: "mixture",
        prompt: {
          en: "Salt stirred into water disappears completely and never settles. What kind of mixture is this?",
          hi: "पानी में घोला नमक पूरी तरह ग़ायब हो जाता और कभी नहीं बैठता। यह कैसा मिश्रण है?",
          mr: "पाण्यात ढवळलेले मीठ पूर्णपणे नाहीसे होते आणि कधी तळाला बसत नाही. हे कोणते मिश्रण?",
        },
        statement: {
          en: "A true solution is uniform to the eye with particles smaller than a nanometre — they never settle, never scatter light, and slip through filter paper.",
          hi: "वास्तविक विलयन आँख को एकसमान, कण एक नैनोमीटर से भी छोटे — वे कभी नहीं बैठते, प्रकाश नहीं बिखेरते, और छन्ना-कागज़ पार कर जाते हैं।",
          mr: "खरे द्रावण डोळ्यांना एकसमान, कण एक नॅनोमीटरहूनही लहान — ते कधी तळाला बसत नाहीत, प्रकाश विखुरत नाहीत, आणि गाळण-कागद ओलांडतात.",
        },
        pair: {
          left: {
            en: "Particles too small to see or filter",
            hi: "देखने-छानने को बहुत छोटे कण",
            mr: "पाहायला-गाळायला फार लहान कण",
          },
          right: {
            en: "stays mixed forever",
            hi: "सदा मिला रहता",
            mr: "सदैव मिसळलेले राहते",
          },
        },
      },
      {
        id: "suspension",
        name: { en: "A suspension", hi: "निलंबन", mr: "निलंबन" },
        kind: "mixture",
        prompt: {
          en: "Chalk powder shaken into water clouds it, then slowly sinks to the bottom. What kind of mixture is this?",
          hi: "पानी में हिलाया चॉक-चूर्ण उसे धुँधला करता, फिर धीरे-धीरे तल में बैठ जाता। यह कैसा मिश्रण है?",
          mr: "पाण्यात हलवलेली खडूची पूड ते धूसर करते, मग हळूहळू तळाला बसते. हे कोणते मिश्रण?",
        },
        statement: {
          en: "A suspension holds particles big enough to see — it looks cloudy, its particles settle on standing, and a filter paper can trap them.",
          hi: "निलंबन में कण इतने बड़े कि दिखें — यह धुँधला लगता, खड़े रहने पर कण बैठ जाते, और छन्ना-कागज़ उन्हें रोक लेता है।",
          mr: "निलंबनात कण दिसण्याइतके मोठे — ते धूसर दिसते, स्थिर राहिल्यावर कण तळाला बसतात, आणि गाळण-कागद त्यांना अडवतो.",
        },
        pair: {
          left: {
            en: "Particles large enough to settle",
            hi: "बैठने-भर बड़े कण",
            mr: "तळाला बसण्याइतके मोठे कण",
          },
          right: {
            en: "a filter can catch them",
            hi: "छन्ना उन्हें पकड़ सकता",
            mr: "गाळणी त्यांना पकडू शकते",
          },
        },
      },
      {
        id: "colloid",
        name: { en: "A colloid", hi: "कोलॉइड", mr: "कलिल" },
        kind: "mixture",
        prompt: {
          en: "Milk looks perfectly mixed, never settles, yet a torch-beam shining through it glows as a visible path. What in-between mixture behaves so?",
          hi: "दूध बिलकुल मिला दिखता, कभी नहीं बैठता, फिर भी उसमें से गुज़रती टॉर्च-किरण एक दिखता रास्ता बनकर चमकती है। कौन-सा बीच का मिश्रण ऐसा करता है?",
          mr: "दूध अगदी मिसळलेले दिसते, कधी तळाला बसत नाही, तरी त्यातून जाणारा बॅटरी-किरण एक दिसणारा रस्ता बनून चमकतो. कोणते मधले मिश्रण असे वागते?",
        },
        statement: {
          en: "A colloid looks uniform and never settles, yet its particles are just big enough to scatter a beam of light into a visible path — the Tyndall effect.",
          hi: "कोलॉइड एकसमान दिखता और कभी नहीं बैठता, फिर भी उसके कण इतने बड़े कि प्रकाश-किरण को बिखेरकर दिखता रास्ता बना दें — टिंडल प्रभाव।",
          mr: "कलिल एकसमान दिसते आणि कधी तळाला बसत नाही, तरी त्याचे कण इतके मोठे की प्रकाश-किरण विखुरून दिसणारा रस्ता बनवतात — टिंडल परिणाम.",
        },
        detail: {
          en: "That same scattering is why a forest's mist glows where sunbeams pierce it, and why a cinema's projector beam hangs visible in the dusty air.",
          hi: "वही बिखराव है जिससे जंगल की धुंध सूरज-किरणों के भेदने पर चमकती, और सिनेमा के प्रोजेक्टर की किरण धूल-भरी हवा में दिखती टँगी रहती है।",
          mr: "तेच विखुरणे आहे ज्याने जंगलातील धुके सूर्यकिरण भेदताना चमकते, आणि सिनेमाच्या प्रक्षेपकाचा किरण धूळभऱ्या हवेत दिसत टांगलेला राहतो.",
        },
        extra: {
          en: "Its particles are too small for a filter paper but can be thrown out by the fierce spin of a centrifuge.",
          hi: "उसके कण छन्ना-कागज़ को बहुत छोटे पर अपकेंद्रित्र के तेज़ घुमाव से बाहर फेंके जा सकते हैं।",
          mr: "त्याचे कण गाळण-कागदाला फार लहान पण अपकेंद्रकाच्या तीव्र फिरण्याने बाहेर फेकता येतात.",
        },
        pair: {
          left: {
            en: "Never settles, yet scatters light",
            hi: "कभी न बैठे, फिर भी प्रकाश बिखेरे",
            mr: "कधी न बसे, तरी प्रकाश विखुरे",
          },
          right: {
            en: "the Tyndall effect",
            hi: "टिंडल प्रभाव",
            mr: "टिंडल परिणाम",
          },
        },
      },
      {
        id: "element-compound",
        name: {
          en: "Element versus compound",
          hi: "तत्व बनाम यौगिक",
          mr: "मूलद्रव्य विरुद्ध संयुग",
        },
        kind: "idea",
        prompt: {
          en: "Hydrogen and oxygen are gases that burn, yet joined they make water that puts out fire. What kind of pure substance is water, and what are its two ingredients?",
          hi: "हाइड्रोजन और ऑक्सीजन जलने वाली गैसें हैं, फिर भी जुड़कर वे आग बुझाने वाला पानी बनाती हैं। पानी कैसा शुद्ध पदार्थ है, और उसके दो घटक क्या हैं?",
          mr: "हायड्रोजन आणि ऑक्सिजन जळणारे वायू, तरी जोडून ते आग विझवणारे पाणी बनवतात. पाणी कोणता शुद्ध पदार्थ, आणि त्याचे दोन घटक काय?",
        },
        statement: {
          en: "A compound joins two or more elements in a fixed ratio with a new nature all its own; an element cannot be broken into anything simpler by chemistry.",
          hi: "यौगिक दो या अधिक तत्वों को नियत अनुपात में जोड़ता है, अपने ही नए स्वभाव के साथ; तत्व को रसायन किसी सरल चीज़ में नहीं तोड़ सकती।",
          mr: "संयुग दोन किंवा अधिक मूलद्रव्ये ठराविक प्रमाणात जोडते, स्वतःच्या नव्या स्वभावासह; मूलद्रव्य रसायनशास्त्र कशाही सोप्यात मोडू शकत नाही.",
        },
        detail: {
          en: "In a compound the ingredients lose their own properties; in a mixture like iron-and-sulphur powder each keeps its own until heated into a compound.",
          hi: "यौगिक में घटक अपने गुण खो देते हैं; लोहा-गंधक चूर्ण जैसे मिश्रण में हर एक अपना गुण रखता जब तक गरम कर यौगिक न बना दिया जाए।",
          mr: "संयुगात घटक स्वतःचे गुण गमावतात; लोखंड-गंधक पुडीसारख्या मिश्रणात प्रत्येक स्वतःचा गुण राखतो जोवर तापवून संयुग बनवले जात नाही.",
        },
        extra: {
          en: "A magnet lifts iron out of an iron-sulphur MIXTURE, but is helpless against iron sulphide, the COMPOUND — a fair test of which you have.",
          hi: "चुम्बक लोहा-गंधक मिश्रण से लोहा उठा लेता, पर लोहा-सल्फ़ाइड यौगिक के आगे बेबस — किसके पास क्या है इसकी परख।",
          mr: "लोहचुंबक लोखंड-गंधक मिश्रणातून लोखंड उचलतो, पण लोह-सल्फाइड संयुगापुढे हतबल — कोणाकडे काय आहे याची परीक्षा.",
        },
        pair: {
          left: {
            en: "Fixed ratio, brand-new nature",
            hi: "नियत अनुपात, बिलकुल नया स्वभाव",
            mr: "ठराविक प्रमाण, अगदी नवा स्वभाव",
          },
          right: {
            en: "a compound",
            hi: "यौगिक",
            mr: "संयुग",
          },
        },
      },
      {
        id: "separation-crystallisation",
        name: {
          en: "Choosing a separation",
          hi: "पृथक्करण चुनना",
          mr: "पृथक्करण निवडणे",
        },
        kind: "method",
        prompt: {
          en: "To recover pure copper sulphate crystals from its solution — without the scorching that plain boiling causes — which gentler method is chosen?",
          hi: "कॉपर सल्फ़ेट के विलयन से शुद्ध रवे पाने को — सादे उबाल की झुलसन के बिना — कौन-सी अधिक कोमल विधि चुनी जाती है?",
          mr: "कॉपर सल्फेटच्या द्रावणातून शुद्ध स्फटिक मिळवायला — साध्या उकळीच्या करपण्याविना — कोणती अधिक सौम्य पद्धत निवडतात?",
        },
        statement: {
          en: "Crystallisation cools a saturated solution slowly so the pure solid grows back as clean crystals, leaving impurities behind in the liquid.",
          hi: "क्रिस्टलन संतृप्त विलयन को धीरे ठंडा करता ताकि शुद्ध ठोस स्वच्छ रवों में फिर उगे, अशुद्धियाँ द्रव में पीछे छूट जाएँ।",
          mr: "स्फटिकीकरण संपृक्त द्रावण हळू थंड करते जेणेकरून शुद्ध घन स्वच्छ स्फटिकांत पुन्हा वाढतो, अशुद्धी द्रवात मागे राहतात.",
        },
        detail: {
          en: "The method fits the mixture: a magnet for iron, a separating funnel for oil-and-water, distillation for two miscible liquids of different boiling points.",
          hi: "विधि मिश्रण से मेल खाती है: लोहे को चुम्बक, तेल-पानी को पृथक्कारी कीप, भिन्न क्वथनांक के दो घुलनशील द्रवों को आसवन।",
          mr: "पद्धत मिश्रणाशी जुळते: लोखंडाला लोहचुंबक, तेल-पाण्याला पृथक्करण नरसाळे, वेगळ्या उकळणबिंदूच्या दोन मिसळणाऱ्या द्रवांना ऊर्ध्वपातन.",
        },
        extra: {
          en: "Chromatography goes further, spreading a dot of black ink into its hidden band of colours on a strip of paper.",
          hi: "वर्णलेखन और आगे जाता, काली स्याही की एक बूँद को कागज़-पट्टी पर उसके छिपे रंगों की पट्टियों में फैलाकर।",
          mr: "वर्णलेखन अजून पुढे जाते, काळ्या शाईचा एक थेंब कागद-पट्टीवर त्याच्या दडलेल्या रंगांच्या पट्ट्यांत पसरवून.",
        },
        pair: {
          left: {
            en: "Slow cooling grows clean crystals",
            hi: "धीमा शीतलन स्वच्छ रवे उगाता",
            mr: "हळू थंडावा स्वच्छ स्फटिक वाढवतो",
          },
          right: {
            en: "crystallisation",
            hi: "क्रिस्टलन",
            mr: "स्फटिकीकरण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Three glasses hold a salt solution, muddy water and milk. A torch is shone through each in a dark room. Which single test tells the true solution from the other two at once?",
          hi: "तीन गिलासों में नमक-विलयन, गंदला पानी और दूध हैं। अँधेरे कमरे में हर एक में से टॉर्च चमकाई जाती है। कौन-सी एक परख वास्तविक विलयन को बाकी दो से तुरंत अलग कर देती है?",
          mr: "तीन ग्लासांत मीठ-द्रावण, गढूळ पाणी आणि दूध आहे. अंधाऱ्या खोलीत प्रत्येकातून बॅटरी चमकवली जाते. कोणती एक परीक्षा खऱ्या द्रावणाला बाकी दोहोंपासून लगेच वेगळे करते?",
        },
        choices: [
          {
            en: "The salt solution alone lets the beam pass invisibly; muddy water and milk both light the beam's path, so only the solution stays clear",
            hi: "केवल नमक-विलयन किरण को अदृश्य पार जाने देता; गंदला पानी और दूध दोनों किरण का रास्ता जगमगाते, अतः केवल विलयन साफ़ रहता है",
            mr: "फक्त मीठ-द्रावण किरण अदृश्यपणे जाऊ देते; गढूळ पाणी आणि दूध दोन्ही किरणाचा रस्ता उजळतात, म्हणून फक्त द्रावण स्वच्छ राहते",
          },
          {
            en: "The milk alone lets the beam pass invisibly",
            hi: "केवल दूध किरण को अदृश्य पार जाने देता है",
            mr: "फक्त दूध किरण अदृश्यपणे जाऊ देते",
          },
          {
            en: "All three light up the beam identically",
            hi: "तीनों किरण को एक-सा जगमगाते हैं",
            mr: "तिन्ही किरण सारखेच उजळतात",
          },
          {
            en: "None of the three shows any beam at all",
            hi: "तीनों में से कोई भी कोई किरण नहीं दिखाता",
            mr: "तिन्हींपैकी कोणीही किरण दाखवत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The Tyndall test sorts them by particle size. In the true salt solution the particles are smaller than a wavelength of light, so the beam sails through untouched and invisible. In muddy water (a suspension) and in milk (a colloid) the particles are large enough to scatter light, so the beam lights up as a glowing path. That single glance splits the solution from the other two. To tell the last pair apart you would wait: the muddy suspension settles to the bottom on standing, while the milk colloid stays mixed forever. Size decides everything — whether light passes, whether particles settle, whether a filter can catch them.",
          hi: "टिंडल परख उन्हें कण-आकार से छाँटती है। वास्तविक नमक-विलयन में कण प्रकाश की तरंगदैर्घ्य से छोटे, अतः किरण अछूती, अदृश्य पार हो जाती है। गंदले पानी (निलंबन) और दूध (कोलॉइड) में कण इतने बड़े कि प्रकाश बिखेरें, अतः किरण चमकता रास्ता बन जाती है। वह एक नज़र विलयन को बाकी दो से अलग कर देती है। अंतिम जोड़ी को अलगाने को प्रतीक्षा करें: गंदला निलंबन खड़े रहने पर तल में बैठ जाता, जबकि दूध-कोलॉइड सदा मिला रहता है। आकार सब तय करता है — प्रकाश गुज़रे या नहीं, कण बैठें या नहीं, छन्ना पकड़े या नहीं।",
          mr: "टिंडल परीक्षा त्यांना कण-आकाराने वेगळे करते. खऱ्या मीठ-द्रावणात कण प्रकाशाच्या तरंगलांबीहून लहान, म्हणून किरण अस्पर्श, अदृश्य पार होते. गढूळ पाण्यात (निलंबन) आणि दुधात (कलिल) कण इतके मोठे की प्रकाश विखुरतात, म्हणून किरण चमकता रस्ता बनते. ती एक नजर द्रावणाला बाकी दोहोंपासून वेगळे करते. शेवटची जोडी वेगळी करायला थांबा: गढूळ निलंबन स्थिर राहिल्यावर तळाला बसते, तर दूध-कलिल सदैव मिसळलेले राहते. आकार सारे ठरवतो — प्रकाश जातो का नाही, कण बसतात का नाही, गाळणी पकडते का नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A child argues: 'Air is one clear, invisible thing that fills every room evenly, so surely it is a pure substance.' Where does the reasoning fail?",
          hi: "एक बच्चा तर्क देता है: 'हवा एक साफ़, अदृश्य चीज़ है जो हर कमरा एकसमान भरती है, तो निश्चय ही यह शुद्ध पदार्थ है।' तर्क कहाँ चूकता है?",
          mr: "एक मूल युक्तिवाद करते: 'हवा एक स्वच्छ, अदृश्य वस्तू आहे जी प्रत्येक खोली एकसमान भरते, तर नक्कीच ती शुद्ध पदार्थ आहे.' युक्तिवाद कुठे चुकतो?",
        },
        choices: [
          {
            en: "Looking uniform is not the test for purity — air is a MIXTURE of nitrogen, oxygen, argon, carbon dioxide and water vapour in no fixed ratio, and it can be separated by cooling it to a liquid and boiling the gases off one by one",
            hi: "एकसमान दिखना शुद्धता की परख नहीं — हवा नाइट्रोजन, ऑक्सीजन, आर्गन, कार्बन डाइऑक्साइड और जलवाष्प का मिश्रण है बिना नियत अनुपात के, और इसे द्रव बनाकर गैसों को एक-एक उबालकर अलग किया जा सकता है",
            mr: "एकसमान दिसणे ही शुद्धतेची परीक्षा नाही — हवा नायट्रोजन, ऑक्सिजन, आरगॉन, कार्बन डायऑक्साइड आणि जलबाष्पाचे मिश्रण आहे ठराविक प्रमाणाविना, आणि तिला द्रव बनवून वायू एक-एक उकळून वेगळे करता येतात",
          },
          {
            en: "The reasoning is correct — air really is a pure substance",
            hi: "तर्क सही है — हवा सचमुच शुद्ध पदार्थ है",
            mr: "युक्तिवाद बरोबर आहे — हवा खरोखर शुद्ध पदार्थ आहे",
          },
          {
            en: "Air is a compound with the fixed formula NO₂",
            hi: "हवा नियत सूत्र NO₂ वाला यौगिक है",
            mr: "हवा ठराविक सूत्र NO₂ असलेले संयुग आहे",
          },
          {
            en: "Air fails only because it is invisible, and pure substances must be visible",
            hi: "हवा केवल इसलिए चूकती क्योंकि अदृश्य है, और शुद्ध पदार्थ दिखने चाहिए",
            mr: "हवा फक्त अदृश्य असल्याने चुकते, आणि शुद्ध पदार्थ दिसायला हवेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The child has mistaken 'looks the same everywhere' for 'made of one kind of particle', and only the second is purity. Air is a mixture: mostly nitrogen and oxygen, with argon, carbon dioxide and a wandering amount of water vapour, and — crucially — the proportions are not fixed, a mountain-top's air differing from a city's. Two proofs clinch it. First, air can be separated by purely physical means: cool it until it liquefies, then warm it slowly and each gas boils off at its own temperature — no chemical reaction needed, the hallmark of a mixture. Second, a true compound like water has a fixed formula and a sharp boiling point; air has neither. Uniform appearance is a trap the eye sets — the real questions are 'fixed composition?' and 'separable without chemistry?', and air answers no and yes.",
          hi: "बच्चे ने 'हर जगह एक-सा दिखता' को 'एक प्रकार के कण से बना' समझ लिया, और शुद्धता केवल दूसरी है। हवा मिश्रण है: अधिकतर नाइट्रोजन-ऑक्सीजन, साथ आर्गन, कार्बन डाइऑक्साइड और बदलती जलवाष्प, और — मुख्यतः — अनुपात नियत नहीं, पर्वत-शिखर की हवा शहर से भिन्न। दो प्रमाण पक्का करते हैं। पहला, हवा को केवल भौतिक तरीक़ों से अलग किया जा सकता: द्रव बनने तक ठंडा करो, फिर धीरे गरम करो और हर गैस अपने तापमान पर उबल जाती — कोई रासायनिक क्रिया नहीं, मिश्रण की पहचान। दूसरा, पानी जैसे सच्चे यौगिक का नियत सूत्र और तीक्ष्ण क्वथनांक है; हवा के पास कोई नहीं। एकसमान रूप आँख का बिछाया जाल है — असली सवाल 'नियत संघटन?' और 'बिना रसायन अलग?' हैं, और हवा जवाब देती है नहीं और हाँ।",
          mr: "मुलाने 'सर्वत्र सारखे दिसते' याला 'एका प्रकारच्या कणाने बनलेले' समजले, आणि शुद्धता फक्त दुसरी आहे. हवा मिश्रण आहे: बहुतांश नायट्रोजन-ऑक्सिजन, सोबत आरगॉन, कार्बन डायऑक्साइड आणि बदलती जलबाष्प, आणि — मुख्यतः — प्रमाण ठरलेले नाही, डोंगरमाथ्याची हवा शहराहून वेगळी. दोन पुरावे पक्के करतात. पहिला, हवा फक्त भौतिक मार्गांनी वेगळी करता येते: द्रव होईपर्यंत थंड करा, मग हळू तापवा आणि प्रत्येक वायू आपल्या तापमानावर उकळतो — कोणतीही रासायनिक क्रिया नाही, मिश्रणाची खूण. दुसरा, पाण्यासारख्या खऱ्या संयुगाला ठराविक सूत्र आणि तीक्ष्ण उकळणबिंदू असतो; हवेला काहीच नाही. एकसमान रूप डोळ्याने रचलेला सापळा — खरे प्रश्न 'ठराविक संघटन?' आणि 'रसायनाविना वेगळे?' आहेत, आणि हवा उत्तर देते नाही आणि होय.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — The Fundamental Unit of Life (the cell)                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-fundamental-unit-life",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 5 — The Fundamental Unit of Life",
      hi: "अध्याय 5 — जीवन की मौलिक इकाई",
      mr: "प्रकरण 5 — जीवनाचे मूलभूत एकक",
    },
    name: {
      en: "The Fundamental Unit of Life",
      hi: "जीवन की मौलिक इकाई",
      mr: "जीवनाचे मूलभूत एकक",
    },
    summary: {
      en: "Every living thing is built of cells: a membrane that chooses what crosses, a nucleus that commands, and organelles that each hold one trade — the cell wall that only plants own, the mitochondrion that burns food for power, the plastid that cooks sunlight.",
      hi: "हर जीव कोशिकाओं से बना है: एक झिल्ली जो चुनती है क्या पार हो, एक केंद्रक जो आदेश देता, और अंगक जिनमें से हर एक एक धंधा रखता — कोशिका-भित्ति जो केवल पौधों की, माइटोकॉन्ड्रिया जो शक्ति को भोजन जलाता, प्लास्टिड जो धूप पकाता।",
      mr: "प्रत्येक सजीव पेशींनी बनला आहे: एक पडदा जो निवडतो काय ओलांडेल, एक केंद्रक जे आज्ञा देते, आणि अंगके ज्यांतले प्रत्येक एक व्यवसाय राखते — पेशीभिंत जी फक्त वनस्पतींची, तंतुकणिका जी शक्तीसाठी अन्न जाळते, लवक जे ऊन शिजवते.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "cell-theory",
        name: { en: "The cell theory", hi: "कोशिका सिद्धांत", mr: "पेशी सिद्धांत" },
        kind: "idea",
        prompt: {
          en: "From a giant whale to a speck of pond scum, what single unit is every living body ultimately built from?",
          hi: "विशाल व्हेल से लेकर तालाब की काई के कण तक, हर जीवित शरीर अंततः किस एक इकाई से बना है?",
          mr: "अवाढव्य देवमाशापासून तळ्यातील शेवाळाच्या कणापर्यंत, प्रत्येक सजीव शरीर अखेर कोणत्या एका एककाने बनते?",
        },
        statement: {
          en: "The cell theory holds that every living thing is made of one or more cells, and every cell arises only from a cell that lived before it.",
          hi: "कोशिका सिद्धांत मानता है कि हर जीव एक या अधिक कोशिकाओं से बना है, और हर कोशिका केवल पहले से जीवित कोशिका से जन्मती है।",
          mr: "पेशी सिद्धांत मानतो की प्रत्येक सजीव एक किंवा अधिक पेशींनी बनतो, आणि प्रत्येक पेशी फक्त आधी जगलेल्या पेशीपासूनच जन्मते.",
        },
        detail: {
          en: "Robert Hooke first saw them in 1665 in a shaving of cork — empty little rooms he named 'cells' after a monk's chamber.",
          hi: "रॉबर्ट हुक ने पहली बार 1665 में कॉर्क की एक फाँक में उन्हें देखा — खाली नन्हे कमरे जिन्हें उसने भिक्षु की कोठरी पर 'कोशिका' नाम दिया।",
          mr: "रॉबर्ट हूकने पहिल्यांदा 1665 मध्ये बुचाच्या एका पातळ कापात त्या पाहिल्या — रिकाम्या इवल्या खोल्या ज्यांना त्याने भिक्षूच्या कोठडीवरून 'पेशी' नाव दिले.",
        },
        extra: {
          en: "An amoeba does everything with one cell; you take billions, sorted into tissues and organs — but the unit is the same.",
          hi: "अमीबा सब कुछ एक कोशिका से करता; तुम अरबों लेते हो, ऊतकों-अंगों में बँटी — पर इकाई वही है।",
          mr: "अमीबा सारे एका पेशीने करतो; तू अब्जावधी घेतोस, ऊती-अवयवांत विभागलेल्या — पण एकक तेच.",
        },
        pair: {
          left: {
            en: "Every cell from a prior cell",
            hi: "हर कोशिका पूर्व कोशिका से",
            mr: "प्रत्येक पेशी आधीच्या पेशीपासून",
          },
          right: {
            en: "the cell theory",
            hi: "कोशिका सिद्धांत",
            mr: "पेशी सिद्धांत",
          },
        },
      },
      {
        id: "plasma-membrane",
        name: {
          en: "The plasma membrane",
          hi: "जीवद्रव्य झिल्ली",
          mr: "पेशीपटल",
        },
        kind: "part",
        prompt: {
          en: "Which boundary of every cell is a living gatekeeper — letting some substances in, keeping others out, choosing rather than merely walling?",
          hi: "हर कोशिका की कौन-सी सीमा जीवित द्वारपाल है — कुछ पदार्थ भीतर आने देती, कुछ रोकती, केवल दीवार नहीं बल्कि चुनती?",
          mr: "प्रत्येक पेशीची कोणती सीमा जिवंत द्वारपाल आहे — काही पदार्थ आत येऊ देते, काही अडवते, फक्त भिंत नव्हे तर निवडते?",
        },
        statement: {
          en: "The plasma membrane is selectively permeable — it decides which molecules cross, admitting some and barring others, and it surrounds every cell that lives.",
          hi: "जीवद्रव्य झिल्ली चयनात्मक पारगम्य है — तय करती कौन-से अणु पार हों, कुछ को भीतर लेती कुछ को रोकती, और हर जीवित कोशिका को घेरती है।",
          mr: "पेशीपटल निवडक पारगम्य आहे — कोणते रेणू ओलांडतील ठरवते, काहींना आत घेते काहींना अडवते, आणि प्रत्येक जिवंत पेशीभोवती असते.",
        },
        detail: {
          en: "Water crosses it by osmosis — flowing toward wherever solute is more crowded, so a cell can swell or shrink with its surroundings.",
          hi: "पानी इसे परासरण से पार करता — जहाँ विलेय अधिक भीड़ हो उधर बहता, अतः कोशिका अपने परिवेश से फूल या सिकुड़ सकती है।",
          mr: "पाणी हिला परासरणाने ओलांडते — जिथे विद्राव्य अधिक गर्दी तिकडे वाहते, म्हणून पेशी परिसरानुसार फुगते किंवा आकुंचते.",
        },
        extra: {
          en: "Being only a flexible film, it is the one boundary an animal cell has — no rigid outer layer beyond it.",
          hi: "केवल एक लचीली परत होने से, यह पशु-कोशिका की एकमात्र सीमा है — उसके परे कोई कठोर बाहरी परत नहीं।",
          mr: "फक्त एक लवचीक पडदा असल्याने, ती प्राणी-पेशीची एकमेव सीमा आहे — तिच्या पलीकडे कठीण बाह्य थर नाही.",
        },
        pair: {
          left: {
            en: "Chooses what may cross",
            hi: "चुनती क्या पार हो",
            mr: "काय ओलांडेल ते निवडते",
          },
          right: {
            en: "selectively permeable",
            hi: "चयनात्मक पारगम्य",
            mr: "निवडक पारगम्य",
          },
        },
      },
      {
        id: "cell-wall",
        name: { en: "The plant cell wall", hi: "पादप कोशिका भित्ति", mr: "वनस्पती पेशीभिंत" },
        kind: "part",
        prompt: {
          en: "Which rigid outer layer, made of cellulose, do plant cells wear over their membrane — while your own cells go without it entirely?",
          hi: "सेलुलोज़ की कौन-सी कठोर बाहरी परत पादप-कोशिकाएँ अपनी झिल्ली के ऊपर पहनती हैं — जबकि तुम्हारी अपनी कोशिकाएँ उसके बिना ही रहती हैं?",
          mr: "सेल्युलोजची कोणती कठीण बाह्य थर वनस्पती-पेशी आपल्या पडद्यावर घालतात — तर तुझ्या स्वतःच्या पेशी तिच्याविनाच राहतात?",
        },
        statement: {
          en: "The cell wall is a tough, non-living layer of cellulose outside the membrane — found only in plants, fungi and bacteria, giving the cell rigid shape.",
          hi: "कोशिका भित्ति झिल्ली के बाहर सेलुलोज़ की कठोर, निर्जीव परत है — केवल पौधों, कवक और जीवाणु में, कोशिका को कठोर आकार देती है।",
          mr: "पेशीभिंत पडद्याबाहेर सेल्युलोजचा कठीण, निर्जीव थर आहे — फक्त वनस्पती, बुरशी आणि जीवाणूंत, पेशीला कठीण आकार देते.",
        },
        detail: {
          en: "Because it is fully permeable, it lets everything through — the choosing is left to the membrane just inside it.",
          hi: "पूर्णतः पारगम्य होने से यह सब कुछ जाने देती — चुनाव उसके भीतर की झिल्ली पर छोड़ देती है।",
          mr: "पूर्ण पारगम्य असल्याने ती सारे जाऊ देते — निवड तिच्या आतल्या पडद्यावर सोडते.",
        },
        extra: {
          en: "It is why a plant cell placed in pure water swells but does not burst — the wall pushes back against the swelling.",
          hi: "इसी से शुद्ध पानी में रखी पादप-कोशिका फूलती पर फटती नहीं — भित्ति फूलन के विरुद्ध धकेलती है।",
          mr: "म्हणूनच शुद्ध पाण्यात ठेवलेली वनस्पती-पेशी फुगते पण फुटत नाही — भिंत फुगण्याविरुद्ध ढकलते.",
        },
        pair: {
          left: {
            en: "Rigid cellulose, plants only",
            hi: "कठोर सेलुलोज़, केवल पौधे",
            mr: "कठीण सेल्युलोज, फक्त वनस्पती",
          },
          right: {
            en: "the cell wall",
            hi: "कोशिका भित्ति",
            mr: "पेशीभिंत",
          },
        },
      },
      {
        id: "nucleus",
        name: { en: "The cell nucleus", hi: "कोशिका केंद्रक", mr: "पेशी केंद्रक" },
        kind: "part",
        prompt: {
          en: "Which dense, membrane-bound body holds the cell's chromosomes and directs its every activity, like a control room?",
          hi: "कौन-सा सघन, झिल्ली-बद्ध पिंड कोशिका के गुणसूत्र रखता और उसकी हर गतिविधि निर्देशित करता, नियंत्रण-कक्ष की तरह?",
          mr: "कोणते घन, पडदा-बद्ध पिंड पेशीची गुणसूत्रे राखते आणि तिची प्रत्येक क्रिया दिग्दर्शित करते, नियंत्रण-कक्षाप्रमाणे?",
        },
        statement: {
          en: "The nucleus is the cell's control centre — bounded by its own membrane and carrying the chromosomes of DNA that command growth and inheritance.",
          hi: "केंद्रक कोशिका का नियंत्रण-केंद्र है — अपनी झिल्ली से घिरा और DNA के गुणसूत्र वहन करता जो वृद्धि और वंशागति को आदेश देते हैं।",
          mr: "केंद्रक पेशीचे नियंत्रण-केंद्र आहे — स्वतःच्या पडद्याने वेढलेले आणि DNA ची गुणसूत्रे वाहते जी वाढ आणि आनुवंशिकतेला आज्ञा देतात.",
        },
        detail: {
          en: "A cell with its true membrane-bound nucleus is called eukaryotic; a bacterium, whose DNA floats free with no such envelope, is prokaryotic.",
          hi: "अपने सच्चे झिल्ली-बद्ध केंद्रक वाली कोशिका सुकेंद्रकी कहलाती; जीवाणु, जिसका DNA बिना ऐसे आवरण के मुक्त तैरता, अकेंद्रकी है।",
          mr: "स्वतःच्या खऱ्या पडदा-बद्ध केंद्रकाची पेशी दृश्यकेंद्रकी म्हणतात; जीवाणू, ज्याचे DNA अशा आवरणाविना मुक्त तरंगते, आदिकेंद्रकी.",
        },
        extra: {
          en: "Remove it and the cell soon dies, unable to repair or divide — the orders have stopped coming.",
          hi: "इसे हटाओ तो कोशिका शीघ्र मर जाती, न मरम्मत कर पाती न विभाजित — आदेश आना बंद हो गया।",
          mr: "ते काढा आणि पेशी लवकर मरते, दुरुस्ती वा विभाजन करू शकत नाही — आज्ञा येणे थांबले.",
        },
        pair: {
          left: {
            en: "Holds the chromosomes, gives orders",
            hi: "गुणसूत्र रखता, आदेश देता",
            mr: "गुणसूत्रे राखते, आज्ञा देते",
          },
          right: {
            en: "the nucleus",
            hi: "केंद्रक",
            mr: "केंद्रक",
          },
        },
      },
      {
        id: "mitochondria",
        name: {
          en: "The mitochondria",
          hi: "माइटोकॉन्ड्रिया",
          mr: "तंतुकणिका",
        },
        kind: "part",
        prompt: {
          en: "Which organelle burns the cell's food with oxygen to release energy, earning the nickname 'powerhouse of the cell'?",
          hi: "कौन-सा अंगक कोशिका के भोजन को ऑक्सीजन से जलाकर ऊर्जा छोड़ता, 'कोशिका का शक्ति-गृह' उपनाम पाता?",
          mr: "कोणते अंगक पेशीचे अन्न ऑक्सिजनने जाळून ऊर्जा सोडते, 'पेशीचे शक्ति-गृह' हे टोपणनाव मिळवते?",
        },
        statement: {
          en: "The mitochondrion is the powerhouse — it breaks down food with oxygen to make ATP, the cell's usable energy currency.",
          hi: "माइटोकॉन्ड्रिया शक्ति-गृह है — भोजन को ऑक्सीजन से तोड़कर ATP बनाता, कोशिका की उपयोगी ऊर्जा-मुद्रा।",
          mr: "तंतुकणिका शक्ति-गृह आहे — अन्न ऑक्सिजनने मोडून ATP बनवते, पेशीचे वापरण्याजोगे ऊर्जा-चलन.",
        },
        detail: {
          en: "It keeps its own small ring of DNA and makes some of its own proteins — a hint it was once a free-living microbe swallowed long ago.",
          hi: "यह अपना छोटा DNA-वलय रखता और अपने कुछ प्रोटीन बनाता — संकेत कि यह कभी बहुत पहले निगला गया स्वतंत्र जीवाणु था।",
          mr: "ती स्वतःचे लहान DNA-वलय राखते आणि स्वतःची काही प्रथिने बनवते — संकेत की ती कधीकाळी गिळलेला स्वतंत्र सूक्ष्मजीव होती.",
        },
        extra: {
          en: "Muscle and liver cells, hungriest for energy, are crowded with them; a resting skin cell keeps far fewer.",
          hi: "मांसपेशी और यकृत की कोशिकाएँ, ऊर्जा की सबसे भूखी, इनसे भरी रहती; विश्रामी त्वचा-कोशिका बहुत कम रखती।",
          mr: "स्नायू आणि यकृताच्या पेशी, ऊर्जेसाठी सर्वांत भुकेल्या, यांनी भरलेल्या; विश्रांत त्वचा-पेशी खूप कमी राखते.",
        },
        pair: {
          left: {
            en: "Burns food into ATP",
            hi: "भोजन को ATP में जलाता",
            mr: "अन्न ATP मध्ये जाळते",
          },
          right: {
            en: "the powerhouse",
            hi: "शक्ति-गृह",
            mr: "शक्ति-गृह",
          },
        },
      },
      {
        id: "plastids",
        name: { en: "The plastids", hi: "प्लास्टिड", mr: "लवक" },
        kind: "part",
        prompt: {
          en: "Which green organelle, found only in plant cells, traps sunlight to cook carbon dioxide and water into food?",
          hi: "कौन-सा हरा अंगक, केवल पादप-कोशिकाओं में, धूप पकड़कर कार्बन डाइऑक्साइड और पानी को भोजन में पकाता?",
          mr: "कोणते हिरवे अंगक, फक्त वनस्पती-पेशींत, ऊन पकडून कार्बन डायऑक्साइड आणि पाणी अन्नात शिजवते?",
        },
        statement: {
          en: "The chloroplast, a green plastid of plant cells, holds chlorophyll and carries out photosynthesis, building food from sunlight.",
          hi: "हरितलवक, पादप-कोशिका का हरा प्लास्टिड, क्लोरोफ़िल रखता और प्रकाश-संश्लेषण करता, धूप से भोजन बनाता।",
          mr: "हरितलवक, वनस्पती-पेशीचे हिरवे लवक, हरितद्रव्य राखते आणि प्रकाशसंश्लेषण करते, उन्हातून अन्न बनवते.",
        },
        detail: {
          en: "Not every plastid is green — a leucoplast stores starch colourlessly, and a chromoplast paints a petal or a ripe tomato red.",
          hi: "हर प्लास्टिड हरा नहीं — श्वेतलवक बेरंग मंड जमा करता, और वर्णलवक पंखुड़ी या पके टमाटर को लाल रँगता।",
          mr: "प्रत्येक लवक हिरवे नाही — श्वेतलवक बेरंग पिष्ट साठवते, आणि वर्णलवक पाकळी किंवा पिकलेला टोमॅटो लाल रंगवते.",
        },
        extra: {
          en: "Like the mitochondrion it too carries its own DNA — a second guest that plant cells long ago took in.",
          hi: "माइटोकॉन्ड्रिया की तरह यह भी अपना DNA रखता — दूसरा अतिथि जिसे पादप-कोशिकाओं ने बहुत पहले भीतर लिया।",
          mr: "तंतुकणिकेप्रमाणे तीही स्वतःचे DNA राखते — दुसरा पाहुणा जो वनस्पती-पेशींनी कधीकाळी आत घेतला.",
        },
        pair: {
          left: {
            en: "Green, traps sunlight for food",
            hi: "हरा, भोजन को धूप पकड़ता",
            mr: "हिरवे, अन्नासाठी ऊन पकडते",
          },
          right: {
            en: "the chloroplast",
            hi: "हरितलवक",
            mr: "हरितलवक",
          },
        },
      },
      {
        id: "vacuole",
        name: { en: "The vacuole", hi: "रसधानी", mr: "रिक्तिका" },
        kind: "part",
        prompt: {
          en: "Which large fluid-filled sac swells inside a plant cell to store sap and press outward, holding the cell firm and upright?",
          hi: "कौन-सी बड़ी द्रव-भरी थैली पादप-कोशिका के भीतर फूलकर रस जमा करती और बाहर दबाती, कोशिका को दृढ़ और तना रखती?",
          mr: "कोणती मोठी द्रव-भरली पिशवी वनस्पती-पेशीत फुगून रस साठवते आणि बाहेर दाबते, पेशीला घट्ट आणि ताठ ठेवते?",
        },
        statement: {
          en: "The vacuole is a fluid-filled storage sac — huge and central in plant cells, where its pressure keeps the cell turgid and the plant standing.",
          hi: "रसधानी द्रव-भरी भंडारण-थैली है — पादप-कोशिका में विशाल और केंद्रीय, जहाँ इसका दाब कोशिका को स्फीत और पौधे को खड़ा रखता।",
          mr: "रिक्तिका द्रव-भरली साठवण-पिशवी आहे — वनस्पती-पेशीत अवाढव्य आणि मध्यवर्ती, जिथे तिचा दाब पेशीला टणक आणि झाडाला ताठ ठेवतो.",
        },
        detail: {
          en: "It is why a watered plant stands crisp and a thirsty one wilts — the vacuoles have lost their pressure.",
          hi: "इसी से सींचा पौधा कुरकुरा खड़ा और प्यासा मुरझाता — रसधानियों ने अपना दाब खो दिया।",
          mr: "म्हणूनच पाणी दिलेले झाड टवटवीत उभे आणि तहानलेले कोमेजते — रिक्तिकांनी आपला दाब गमावला.",
        },
        extra: {
          en: "Animal cells keep only tiny vacuoles, if any — they have no such water-balloon holding their shape.",
          hi: "पशु-कोशिकाएँ केवल नन्ही रसधानियाँ रखतीं, यदि कोई — उनके पास आकार थामे ऐसा जल-गुब्बारा नहीं।",
          mr: "प्राणी-पेशी फक्त इवल्या रिक्तिका राखतात, असल्यास — त्यांच्याकडे आकार धरणारा असा जल-फुगा नाही.",
        },
        pair: {
          left: {
            en: "Big sap-sac, presses the cell firm",
            hi: "बड़ी रस-थैली, कोशिका को दृढ़ दबाती",
            mr: "मोठी रस-पिशवी, पेशीला घट्ट दाबते",
          },
          right: {
            en: "the vacuole",
            hi: "रसधानी",
            mr: "रिक्तिका",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A shrivelled raisin is dropped in a bowl of plain water and left an hour; it comes out plump and swollen. A second raisin is left in strong sugar syrup and shrivels further. What single process explains both?",
          hi: "एक सिकुड़ी किशमिश सादे पानी के कटोरे में डाली और एक घंटा छोड़ी जाती; वह फूली-सूजी निकलती है। दूसरी किशमिश गाढ़े चाशनी में छोड़ी और और सिकुड़ जाती है। एक ही कौन-सी प्रक्रिया दोनों समझाती है?",
          mr: "एक सुरकुतलेली मनुका साध्या पाण्याच्या वाटीत टाकून एक तास ठेवली; ती टपोरी-फुगून निघते. दुसरी मनुका दाट पाकात ठेवली आणि आणखी सुरकुतते. एकच कोणती प्रक्रिया दोन्ही समजावते?",
        },
        choices: [
          {
            en: "Osmosis: water crosses the membrane toward the side where sugar is more crowded — into the raisin from plain water, out of the raisin into strong syrup",
            hi: "परासरण: पानी झिल्ली पार उस ओर जाता जहाँ शक्कर अधिक भीड़ — सादे पानी से किशमिश में, किशमिश से गाढ़ी चाशनी में बाहर",
            mr: "परासरण: पाणी पडदा ओलांडून त्या बाजूला जाते जिथे साखर अधिक गर्दी — साध्या पाण्यातून मनुक्यात, मनुक्यातून दाट पाकात बाहेर",
          },
          {
            en: "The plain water is simply hotter than the sugar syrup",
            hi: "सादा पानी बस चाशनी से अधिक गरम है",
            mr: "साधे पाणी नुसते पाकाहून अधिक गरम आहे",
          },
          {
            en: "The raisin's cell walls dissolve in water and rebuild in syrup",
            hi: "किशमिश की कोशिका-भित्तियाँ पानी में घुलतीं और चाशनी में फिर बनतीं",
            mr: "मनुक्याच्या पेशीभिंती पाण्यात विरघळतात आणि पाकात पुन्हा बनतात",
          },
          {
            en: "Sugar molecules are small enough to pump water out by force",
            hi: "शक्कर के अणु इतने छोटे कि बलपूर्वक पानी बाहर पंप करें",
            mr: "साखरेचे रेणू इतके लहान की जबरदस्तीने पाणी बाहेर पंप करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both are osmosis — water crossing a selectively permeable membrane toward wherever dissolved substance is more crowded, seeking to even out the concentration. The dried raisin's inside is rich in sugars and salts; plain water outside is nearly pure. So water flows inward, down its own gradient, and the raisin plumps up. Reverse the surroundings and you reverse the flow: in strong syrup the outside is more crowded than the inside, so water leaves the raisin and it shrivels further. The membrane never chooses a direction; it simply lets water pass, and the crowding of solute decides which way. The very same rule swells a plant's root hairs to drink from moist soil, and would burst a red blood cell dropped in pure water.",
          hi: "दोनों परासरण हैं — पानी का चयनात्मक पारगम्य झिल्ली पार उस ओर जाना जहाँ घुला पदार्थ अधिक भीड़, सांद्रता बराबर करने को। सूखी किशमिश के भीतर शक्कर-नमक भरपूर; बाहर सादा पानी लगभग शुद्ध। अतः पानी भीतर बहता, अपनी प्रवणता से नीचे, और किशमिश फूल जाती। परिवेश उलटो तो बहाव उलट जाता: गाढ़ी चाशनी में बाहर भीतर से अधिक भीड़, अतः पानी किशमिश छोड़ता और वह और सिकुड़ती। झिल्ली दिशा नहीं चुनती; बस पानी जाने देती, और विलेय की भीड़ तय करती किधर। वही नियम पौधे के मूल-रोम फुलाकर नम मिट्टी से पिलाता, और शुद्ध पानी में डाली लाल रक्त-कोशिका को फोड़ देता।",
          mr: "दोन्ही परासरण आहेत — पाणी निवडक पारगम्य पडदा ओलांडून त्या बाजूला जाणे जिथे विरघळलेला पदार्थ अधिक गर्दी, सांद्रता समान करायला. सुकलेल्या मनुक्याच्या आत साखर-मीठ भरपूर; बाहेर साधे पाणी जवळपास शुद्ध. म्हणून पाणी आत वाहते, स्वतःच्या उतारावर, आणि मनुका टपोरतो. परिसर उलटा तर प्रवाह उलटतो: दाट पाकात बाहेर आतापेक्षा अधिक गर्दी, म्हणून पाणी मनुका सोडते आणि तो आणखी सुरकुततो. पडदा दिशा निवडत नाही; फक्त पाणी जाऊ देतो, आणि विद्राव्याची गर्दी ठरवते कोणीकडे. तोच नियम झाडाचे मूल-रोम फुगवून ओल्या मातीतून पाजतो, आणि शुद्ध पाण्यात टाकलेली लाल रक्त-पेशी फोडतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A red blood cell and a plant's leaf cell are both placed in a beaker of pure distilled water. The blood cell swells and bursts; the leaf cell swells but holds firm. What one structural difference decides these opposite fates?",
          hi: "एक लाल रक्त-कोशिका और एक पौधे की पत्ती-कोशिका दोनों शुद्ध आसुत जल के बीकर में रखी जाती हैं। रक्त-कोशिका फूलकर फट जाती; पत्ती-कोशिका फूलती पर टिकी रहती है। कौन-सा एक संरचनात्मक अंतर इन विपरीत नियतियों को तय करता है?",
          mr: "एक लाल रक्त-पेशी आणि एक झाडाची पान-पेशी दोन्ही शुद्ध ऊर्ध्वपातित पाण्याच्या पेल्यात ठेवल्या जातात. रक्त-पेशी फुगून फुटते; पान-पेशी फुगते पण टिकून राहते. कोणता एक रचनात्मक फरक या विरुद्ध नियती ठरवतो?",
        },
        choices: [
          {
            en: "The plant cell has a rigid cellulose wall outside its membrane that pushes back against the inward rush of water; the animal cell has only a soft membrane with nothing to resist the swelling, so it bursts",
            hi: "पादप-कोशिका की झिल्ली के बाहर कठोर सेलुलोज़-भित्ति है जो पानी की भीतरी धार के विरुद्ध धकेलती; पशु-कोशिका के पास केवल कोमल झिल्ली, फूलन रोकने को कुछ नहीं, अतः फट जाती",
            mr: "वनस्पती-पेशीच्या पडद्याबाहेर कठीण सेल्युलोज-भिंत आहे जी पाण्याच्या आतल्या लोंढ्याविरुद्ध ढकलते; प्राणी-पेशीकडे फक्त मऊ पडदा, फुगणे अडवायला काही नाही, म्हणून फुटते",
          },
          {
            en: "The plant cell contains no water to begin with, so nothing can enter it",
            hi: "पादप-कोशिका में शुरू से कोई पानी नहीं, अतः उसमें कुछ प्रवेश नहीं कर सकता",
            mr: "वनस्पती-पेशीत सुरुवातीलाच पाणी नाही, म्हणून तिच्यात काही प्रवेश करू शकत नाही",
          },
          {
            en: "The blood cell's membrane is not permeable to water at all",
            hi: "रक्त-कोशिका की झिल्ली पानी को बिलकुल पारगम्य नहीं",
            mr: "रक्त-पेशीचा पडदा पाण्याला मुळीच पारगम्य नाही",
          },
          {
            en: "Distilled water pushes into plant cells but is repelled by animal cells",
            hi: "आसुत जल पादप-कोशिकाओं में घुसता पर पशु-कोशिकाओं से विकर्षित होता",
            mr: "ऊर्ध्वपातित पाणी वनस्पती-पेशींत घुसते पण प्राणी-पेशींनी परतवले जाते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Osmosis works identically on both cells: pure water outside is far less crowded than the salty, sugary inside, so water floods into each. What differs is what happens as they fill. The animal red blood cell is wrapped in nothing but its flexible plasma membrane; as water pours in it stretches, thins, and past its limit it tears open — the cell lyses. The plant leaf cell wears, outside that same membrane, a tough non-living wall of cellulose. Water still rushes in and the cell swells, but the rigid wall pushes back with an equal outward-resisting force. The cell becomes turgid — firm, pressurised, but intact — and that very turgor pressure is what holds a well-watered plant crisp and upright. So the wall is not just armour; it is the reason a plant can stand in the rain and a lone animal cell cannot survive fresh water. Same physics of water; opposite outcome, decided entirely by the presence or absence of one rigid layer.",
          hi: "परासरण दोनों कोशिकाओं पर एक-सा काम करता: बाहर शुद्ध पानी भीतर की नमकीन-मीठी भीड़ से बहुत कम, अतः पानी हर एक में उमड़ता। अंतर यह कि भरने पर क्या होता। पशु लाल रक्त-कोशिका केवल अपनी लचीली झिल्ली में लिपटी; पानी भरते वह खिंचती, पतली होती, सीमा पार फट जाती — कोशिका लयित। पादप पत्ती-कोशिका उसी झिल्ली के बाहर सेलुलोज़ की कठोर निर्जीव भित्ति पहनती। पानी फिर भी उमड़ता, कोशिका फूलती, पर कठोर भित्ति बराबर बाहर-रोकते बल से धकेलती। कोशिका स्फीत होती — दृढ़, दबावग्रस्त, पर अखंड — और वही स्फीति-दाब सींचे पौधे को कुरकुरा-तना रखता। अतः भित्ति केवल कवच नहीं; यही कारण कि पौधा वर्षा में खड़ा रह सकता और अकेली पशु-कोशिका मीठे पानी में नहीं जी सकती। पानी की वही भौतिकी; विपरीत परिणाम, पूरी तरह एक कठोर परत के होने-न होने से तय।",
          mr: "परासरण दोन्ही पेशींवर सारखेच काम करते: बाहेर शुद्ध पाणी आतल्या खारट-गोड गर्दीहून खूप कमी, म्हणून पाणी प्रत्येकात लोटते. फरक हा की भरताना काय होते. प्राणी लाल रक्त-पेशी फक्त आपल्या लवचीक पडद्यात गुंडाळलेली; पाणी भरताना ती ताणते, पातळ होते, मर्यादेपलीकडे फाटते — पेशी लयित. वनस्पती पान-पेशी त्याच पडद्याबाहेर सेल्युलोजची कठीण निर्जीव भिंत घालते. पाणी तरी लोटते, पेशी फुगते, पण कठीण भिंत समान बाहेर-अडवणाऱ्या बलाने ढकलते. पेशी टणक होते — घट्ट, दाबग्रस्त, पण अखंड — आणि तोच टणकपणाचा दाब पाणी दिलेल्या झाडाला टवटवीत-ताठ ठेवतो. म्हणून भिंत फक्त चिलखत नाही; हेच कारण की झाड पावसात उभे राहू शकते आणि एकटी प्राणी-पेशी गोड्या पाण्यात जगू शकत नाही. पाण्याचे तेच भौतिकशास्त्र; विरुद्ध परिणाम, पूर्णपणे एका कठीण थराच्या असण्या-नसण्याने ठरलेला.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Tissues (division of labour in many-celled life)            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-tissues",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 6 — Tissues",
      hi: "अध्याय 6 — ऊतक",
      mr: "प्रकरण 6 — ऊती",
    },
    name: {
      en: "Tissues",
      hi: "ऊतक",
      mr: "ऊती",
    },
    summary: {
      en: "Many-celled life divides its labour: cells alike in shape and task band into tissues. Plants keep dividing tissue at their tips and dead pipes for water; animals wrap surfaces, bind parts, contract for movement and carry the spark of thought — each tissue shaped to its one job.",
      hi: "बहुकोशिकीय जीवन श्रम बाँटता: आकार और काम में एक-से कोशिकाएँ ऊतक में जुड़तीं। पौधे अपने सिरों पर विभाजित होता ऊतक और पानी के मृत नल रखते; प्राणी सतहें ढाँपते, भाग बाँधते, गति को सिकुड़ते और विचार की चिंगारी ढोते — हर ऊतक अपने एक काम को गढ़ा।",
      mr: "बहुपेशीय जीवन श्रम वाटते: आकार आणि कामात सारख्या पेशी ऊतीत जुळतात. वनस्पती आपल्या टोकांवर विभाजित होणारी ऊती आणि पाण्याचे मृत नळ राखतात; प्राणी पृष्ठे झाकतात, भाग बांधतात, गतीला आकुंचतात आणि विचाराची ठिणगी वाहतात — प्रत्येक ऊती आपल्या एका कामाला घडवलेली.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "meristematic",
        name: {
          en: "Meristematic tissue",
          hi: "विभज्योतक",
          mr: "विभाजी ऊती",
        },
        kind: "plant-tissue",
        prompt: {
          en: "Which plant tissue, sitting at root and shoot tips, keeps dividing all a plant's life so it grows ever longer and taller?",
          hi: "कौन-सा पादप ऊतक, जड़ और प्ररोह के सिरों पर बैठा, पौधे भर विभाजित होता रहता ताकि वह और लंबा-ऊँचा बढ़े?",
          mr: "कोणती वनस्पती ऊती, मूळ आणि खोडाच्या टोकांवर बसून, झाडभर विभाजित होत राहते जेणेकरून ते आणखी लांब-उंच वाढते?",
        },
        statement: {
          en: "Meristematic tissue is made of small, thin-walled, dividing cells packed with cytoplasm at the growing tips — it is where a plant lengthens and thickens.",
          hi: "विभज्योतक छोटी, पतली-भित्ति, विभाजित होती कोशिकाओं का, कोशिकाद्रव्य से भरी, बढ़ते सिरों पर — यहीं पौधा लंबा और मोटा होता है।",
          mr: "विभाजी ऊती लहान, पातळ-भिंतीच्या, विभाजित होणाऱ्या पेशींची, पेशीद्रव्याने भरलेली, वाढत्या टोकांवर — इथेच झाड लांब आणि जाड होते.",
        },
        detail: {
          en: "Its cells have no vacuole and never rest; every other plant tissue is made from cells this one first produced.",
          hi: "इसकी कोशिकाओं में रसधानी नहीं और वे कभी नहीं थमतीं; हर अन्य पादप ऊतक इसी की पहले बनाई कोशिकाओं से बना है।",
          mr: "तिच्या पेशींत रिक्तिका नाही आणि त्या कधी थांबत नाहीत; प्रत्येक इतर वनस्पती ऊती हिनेच आधी बनवलेल्या पेशींपासून बनते.",
        },
        extra: {
          en: "A gardener's pinching of a shoot-tip removes this tissue, forcing the plant to grow bushy and sideways instead of tall.",
          hi: "माली का प्ररोह-सिरा दबाना यह ऊतक हटा देता, पौधे को ऊँचे के बजाय झाड़ीदार-बग़ली बढ़ने को बाध्य करता।",
          mr: "माळ्याचे खोड-टोक खुडणे ही ऊती काढते, झाडाला उंचऐवजी झुडूपदार-बाजूला वाढायला भाग पाडते.",
        },
        pair: {
          left: {
            en: "Dividing cells at the tips",
            hi: "सिरों पर विभाजित कोशिकाएँ",
            mr: "टोकांवर विभाजित पेशी",
          },
          right: {
            en: "meristematic tissue",
            hi: "विभज्योतक",
            mr: "विभाजी ऊती",
          },
        },
      },
      {
        id: "parenchyma",
        name: { en: "Parenchyma", hi: "मृदूतक", mr: "मृदूतक" },
        kind: "plant-tissue",
        prompt: {
          en: "Which soft, living packing tissue with thin walls and air-gaps fills a leaf and stem, storing food and, when green, doing photosynthesis?",
          hi: "कौन-सा कोमल, जीवित भराव-ऊतक पतली भित्ति और हवा-रिक्तियों वाला पत्ती-तने को भरता, भोजन जमा करता और, हरा होने पर, प्रकाश-संश्लेषण करता?",
          mr: "कोणती मऊ, जिवंत भरण-ऊती पातळ भिंती आणि हवा-पोकळ्यांसह पान-खोड भरते, अन्न साठवते आणि, हिरवी असता, प्रकाशसंश्लेषण करते?",
        },
        statement: {
          en: "Parenchyma is soft, living, thin-walled tissue with gaps between cells — it packs the plant's body, stores food, and when it holds chlorophyll it feeds the plant.",
          hi: "मृदूतक कोमल, जीवित, पतली-भित्ति ऊतक है कोशिकाओं के बीच रिक्तियों वाला — पौधे का शरीर भरता, भोजन जमा करता, और क्लोरोफ़िल रखने पर पौधे को पालता।",
          mr: "मृदूतक मऊ, जिवंत, पातळ-भिंतीची ऊती आहे पेशींमध्ये पोकळ्यांसह — झाडाचे शरीर भरते, अन्न साठवते, आणि हरितद्रव्य राखता झाडाला पोसते.",
        },
        detail: {
          en: "In a water plant these gaps swell into large air-chambers, and the buoyant tissue is then called aerenchyma, helping it float.",
          hi: "जलीय पौधे में ये रिक्तियाँ बड़े वायु-कक्षों में फूलतीं, और तैरता ऊतक तब वायूतक कहलाता, उसे तैरने में मदद करता।",
          mr: "जलवनस्पतीत या पोकळ्या मोठ्या वायु-कक्षांत फुगतात, आणि तरंगती ऊती तेव्हा वायूतक म्हणतात, तिला तरंगायला मदत करते.",
        },
        extra: {
          en: "The juicy flesh of a fruit and the soft pith of a stem are both parenchyma swollen with stored sugar and water.",
          hi: "फल का रसीला गूदा और तने का कोमल मज्जा दोनों जमा शक्कर-पानी से फूला मृदूतक हैं।",
          mr: "फळाचा रसाळ गर आणि खोडाचा मऊ भेंड दोन्ही साठलेल्या साखर-पाण्याने फुगलेले मृदूतक आहेत.",
        },
        pair: {
          left: {
            en: "Soft living packing, stores food",
            hi: "कोमल जीवित भराव, भोजन जमाता",
            mr: "मऊ जिवंत भरण, अन्न साठवते",
          },
          right: {
            en: "parenchyma",
            hi: "मृदूतक",
            mr: "मृदूतक",
          },
        },
      },
      {
        id: "sclerenchyma",
        name: { en: "Sclerenchyma", hi: "दृढ़ोतक", mr: "दृढोतक" },
        kind: "plant-tissue",
        prompt: {
          en: "Which plant tissue is made of dead cells with thick, hard, lignified walls, giving stems their strength and a coconut its stony shell?",
          hi: "कौन-सा पादप ऊतक मोटी, कठोर, लिग्निन-युक्त भित्ति वाली मृत कोशिकाओं का है, तनों को मज़बूती और नारियल को पथरीला खोल देता?",
          mr: "कोणती वनस्पती ऊती जाड, कठीण, लिग्निनयुक्त भिंतीच्या मृत पेशींची आहे, खोडांना बळकटी आणि नारळाला दगडी कवच देते?",
        },
        statement: {
          en: "Sclerenchyma is dead tissue with thick lignified walls and no living contents — it is the plant's hardest, strongest support, stiff and unbending.",
          hi: "दृढ़ोतक मृत ऊतक है मोटी लिग्निन-भित्ति और बिना जीवित अंश के — यह पौधे का सबसे कठोर, मज़बूत आधार, अकड़ा और अनम्य।",
          mr: "दृढोतक मृत ऊती आहे जाड लिग्निन-भिंती आणि जिवंत आशयाविना — ती झाडाचा सर्वांत कठीण, बळकट आधार, ताठ आणि न वाकणारा.",
        },
        detail: {
          en: "It is the grit you feel in a pear's flesh and the tough husk of a coconut — hardness with no life left inside.",
          hi: "यही नाशपाती के गूदे में लगती किरकिरी और नारियल का कठोर छिलका है — कठोरता जिसमें भीतर जान नहीं बची।",
          mr: "हीच पेअरच्या गरात जाणवणारी कणकण आणि नारळाचे कठीण साल आहे — कठीणपणा ज्यात आत जीव उरलेला नाही.",
        },
        extra: {
          en: "The strong fibres of jute and coir that we twist into rope are long strands of this dead, stiff tissue.",
          hi: "जूट और कॉयर के मज़बूत रेशे जिन्हें हम रस्सी में बटते, इसी मृत, अकड़े ऊतक की लंबी लड़ियाँ हैं।",
          mr: "ज्यूट आणि काथ्याचे बळकट तंतू जे आपण दोरीत पिळतो, याच मृत, ताठ ऊतीच्या लांब लडी आहेत.",
        },
        pair: {
          left: {
            en: "Dead, thick-walled, hardest support",
            hi: "मृत, मोटी-भित्ति, कठोरतम आधार",
            mr: "मृत, जाड-भिंत, कठीणतम आधार",
          },
          right: {
            en: "sclerenchyma",
            hi: "दृढ़ोतक",
            mr: "दृढोतक",
          },
        },
      },
      {
        id: "xylem",
        name: { en: "Xylem", hi: "जाइलम", mr: "प्रकाष्ठ" },
        kind: "plant-tissue",
        prompt: {
          en: "Which pipe-like plant tissue, its cells dead and hollow, carries water and minerals straight up from the roots to the highest leaf?",
          hi: "कौन-सा नली-सा पादप ऊतक, कोशिकाएँ मृत और खोखली, पानी और खनिज जड़ों से सीधे सबसे ऊँची पत्ती तक ले जाता?",
          mr: "कोणती नळीसारखी वनस्पती ऊती, पेशी मृत आणि पोकळ, पाणी आणि खनिजे मुळांपासून सरळ सर्वांत उंच पानापर्यंत नेते?",
        },
        statement: {
          en: "Xylem is a tissue of dead, hollow tubes carrying water and dissolved minerals in one direction only — upward from root to leaf.",
          hi: "जाइलम मृत, खोखली नलियों का ऊतक है जो पानी और घुले खनिज केवल एक दिशा में ले जाता — जड़ से पत्ती तक ऊपर।",
          mr: "प्रकाष्ठ मृत, पोकळ नळ्यांची ऊती आहे जी पाणी आणि विरघळलेली खनिजे फक्त एका दिशेत नेते — मुळापासून पानापर्यंत वर.",
        },
        detail: {
          en: "It moves without any pumping — water evaporating from the leaves pulls the whole thread up behind it, like sucking a straw.",
          hi: "यह बिना किसी पंप के चलता — पत्तियों से वाष्पित होता पानी पूरे धागे को पीछे ऊपर खींचता, तिनके से खींचने जैसा।",
          mr: "ती कोणत्याही पंपाविना चालते — पानांतून बाष्पित होणारे पाणी संपूर्ण धागा मागे वर ओढते, नळीने ओढल्यासारखे.",
        },
        extra: {
          en: "Being dead and woody, old xylem is exactly what we count as the rings and grain of timber.",
          hi: "मृत और काष्ठीय होने से, पुराना जाइलम ठीक वही है जिसे हम लकड़ी के छल्ले और रेशा गिनते हैं।",
          mr: "मृत आणि काष्ठमय असल्याने, जुने प्रकाष्ठ नेमके तेच जे आपण लाकडाची वलये आणि तंतू मोजतो.",
        },
        pair: {
          left: {
            en: "Dead tubes, water upward only",
            hi: "मृत नलियाँ, केवल पानी ऊपर",
            mr: "मृत नळ्या, फक्त पाणी वर",
          },
          right: {
            en: "xylem",
            hi: "जाइलम",
            mr: "प्रकाष्ठ",
          },
        },
      },
      {
        id: "phloem",
        name: { en: "Phloem", hi: "फ्लोएम", mr: "परिकाष्ठ" },
        kind: "plant-tissue",
        prompt: {
          en: "Which living plant tissue carries the sugary food made in the leaves both up and down — to the roots to store and to the buds to grow?",
          hi: "कौन-सा जीवित पादप ऊतक पत्तियों में बना शर्करामय भोजन ऊपर और नीचे दोनों ले जाता — जड़ों को जमा करने और कलियों को बढ़ने?",
          mr: "कोणती जिवंत वनस्पती ऊती पानांत बनलेले साखरयुक्त अन्न वर आणि खाली दोन्हीकडे नेते — मुळांना साठवायला आणि कळ्यांना वाढायला?",
        },
        statement: {
          en: "Phloem is living tissue that carries food made in the leaves in both directions — up and down — to wherever the plant needs to grow or store.",
          hi: "फ्लोएम जीवित ऊतक है जो पत्तियों में बना भोजन दोनों दिशाओं में — ऊपर और नीचे — ले जाता जहाँ पौधे को बढ़ना या जमा करना हो।",
          mr: "परिकाष्ठ जिवंत ऊती आहे जी पानांत बनलेले अन्न दोन्ही दिशांत — वर आणि खाली — नेते जिथे झाडाला वाढायचे किंवा साठवायचे.",
        },
        detail: {
          en: "Unlike the dead pipes of xylem, its main cells stay alive, helped by small companion cells that keep them working.",
          hi: "जाइलम की मृत नलियों के विपरीत, इसकी मुख्य कोशिकाएँ जीवित रहतीं, छोटी सहचर कोशिकाओं की मदद से चलती।",
          mr: "प्रकाष्ठाच्या मृत नळ्यांविरुद्ध, तिच्या मुख्य पेशी जिवंत राहतात, लहान सहचर पेशींच्या मदतीने चालतात.",
        },
        extra: {
          en: "Cut a ring of bark all round a tree and it slowly starves — you have severed the phloem carrying food down to its roots.",
          hi: "पेड़ के चारों ओर छाल का एक छल्ला काटो तो वह धीरे भूखा मरता — तुमने जड़ों को भोजन ले जाता फ्लोएम काट दिया।",
          mr: "झाडाभोवती सालीचे एक वलय कापा तर ते हळू उपाशी मरते — तू मुळांना अन्न नेणारे परिकाष्ठ कापलेस.",
        },
        pair: {
          left: {
            en: "Living, food both up and down",
            hi: "जीवित, भोजन ऊपर-नीचे दोनों",
            mr: "जिवंत, अन्न वर-खाली दोन्ही",
          },
          right: {
            en: "phloem",
            hi: "फ्लोएम",
            mr: "परिकाष्ठ",
          },
        },
      },
      {
        id: "epithelial",
        name: {
          en: "Epithelial tissue",
          hi: "उपकला ऊतक",
          mr: "अभिस्तर ऊती",
        },
        kind: "animal-tissue",
        prompt: {
          en: "Which animal tissue is a tight, continuous sheet of cells that covers the body's surfaces and lines its tubes, a barrier between inside and out?",
          hi: "कौन-सा प्राणी ऊतक कोशिकाओं की कसी, अखंड चादर है जो शरीर की सतहें ढाँपती और नलियाँ अस्तरती, भीतर-बाहर के बीच अवरोध?",
          mr: "कोणती प्राणी ऊती पेशींची घट्ट, अखंड चादर आहे जी शरीराची पृष्ठे झाकते आणि नळ्या अस्तरते, आत-बाहेरमधील अडसर?",
        },
        statement: {
          en: "Epithelial tissue is a continuous covering sheet of tightly packed cells — it lines skin, mouth and inner tubes, guarding and separating what lies on either side.",
          hi: "उपकला ऊतक कसकर जमी कोशिकाओं की अखंड ढँकने वाली चादर है — त्वचा, मुँह और भीतरी नलियाँ अस्तरती, दोनों ओर के को रक्षती और अलगाती।",
          mr: "अभिस्तर ऊती घट्ट रचलेल्या पेशींची अखंड झाकणारी चादर आहे — त्वचा, तोंड आणि आतल्या नळ्या अस्तरते, दोन्ही बाजूंचे रक्षते आणि वेगळे करते.",
        },
        detail: {
          en: "It has almost no gaps between cells and sits on a thin base membrane — a wall so close-fitting that germs struggle to slip through.",
          hi: "इसमें कोशिकाओं के बीच लगभग रिक्ति नहीं और यह पतली आधार-झिल्ली पर बैठती — इतनी सटी दीवार कि रोगाणु मुश्किल से घुसें।",
          mr: "तिच्यात पेशींमध्ये जवळपास पोकळी नाही आणि ती पातळ आधार-पडद्यावर बसते — इतकी घट्ट भिंत की जंतू कसेबसे शिरतात.",
        },
        extra: {
          en: "It comes in styles to suit its post — flat and thin where things must diffuse, tall and column-like where it must absorb or secrete.",
          hi: "यह अपने काम के अनुरूप रूप लेती — जहाँ विसरण हो वहाँ चपटी-पतली, जहाँ सोखना-स्रवना हो वहाँ ऊँची-स्तंभाकार।",
          mr: "ती आपल्या कामानुरूप रूप घेते — जिथे विसरण तिथे सपाट-पातळ, जिथे शोषण-स्राव तिथे उंच-स्तंभाकार.",
        },
        pair: {
          left: {
            en: "Continuous sheet, covers and lines",
            hi: "अखंड चादर, ढाँपती-अस्तरती",
            mr: "अखंड चादर, झाकते-अस्तरते",
          },
          right: {
            en: "epithelial tissue",
            hi: "उपकला ऊतक",
            mr: "अभिस्तर ऊती",
          },
        },
      },
      {
        id: "connective",
        name: {
          en: "Connective tissue",
          hi: "संयोजी ऊतक",
          mr: "संयोजी ऊती",
        },
        kind: "animal-tissue",
        prompt: {
          en: "Which animal tissue has its cells scattered in a large matrix between them — the family that includes blood, bone, cartilage and the fat under your skin?",
          hi: "कौन-से प्राणी ऊतक की कोशिकाएँ उनके बीच के बड़े आधात्री में बिखरी हैं — वह कुल जिसमें रक्त, अस्थि, उपास्थि और त्वचा-तल की वसा हैं?",
          mr: "कोणत्या प्राणी ऊतीच्या पेशी त्यांच्यामधल्या मोठ्या आधारद्रव्यात विखुरलेल्या आहेत — ते कुळ ज्यात रक्त, हाड, कूर्चा आणि त्वचेखालची चरबी आहे?",
        },
        statement: {
          en: "Connective tissue holds cells loosely apart in an abundant matrix between them — it binds, supports and packs, and even flowing blood belongs to it.",
          hi: "संयोजी ऊतक कोशिकाओं को उनके बीच के भरपूर आधात्री में ढीले-अलग रखता — बाँधता, सहारता और भरता, और बहता रक्त भी इसी का।",
          mr: "संयोजी ऊती पेशी त्यांच्यामधल्या विपुल आधारद्रव्यात सैल-वेगळ्या ठेवते — बांधते, आधार देते आणि भरते, आणि वाहते रक्तही हिचेच.",
        },
        detail: {
          en: "The matrix decides its role: fluid in blood, jelly-firm in cartilage, and hard with calcium salts in bone.",
          hi: "आधात्री इसकी भूमिका तय करता: रक्त में तरल, उपास्थि में जेली-दृढ़, और अस्थि में कैल्शियम-लवण से कठोर।",
          mr: "आधारद्रव्य तिची भूमिका ठरवते: रक्तात द्रव, कूर्चेत जेली-घट्ट, आणि हाडात कॅल्शियम-क्षारांनी कठीण.",
        },
        extra: {
          en: "A tendon tying muscle to bone and a ligament tying bone to bone are both tough connective cords.",
          hi: "मांसपेशी को अस्थि से बाँधता कंडरा और अस्थि को अस्थि से बाँधता स्नायुबंध दोनों दृढ़ संयोजी डोरियाँ हैं।",
          mr: "स्नायूला हाडाशी बांधणारा कंडरा आणि हाडाला हाडाशी बांधणारा अस्थिबंध दोन्ही टणक संयोजी दोर आहेत.",
        },
        pair: {
          left: {
            en: "Cells scattered in a matrix, binds",
            hi: "आधात्री में बिखरी कोशिकाएँ, बाँधता",
            mr: "आधारद्रव्यात विखुरल्या पेशी, बांधते",
          },
          right: {
            en: "connective tissue",
            hi: "संयोजी ऊतक",
            mr: "संयोजी ऊती",
          },
        },
      },
      {
        id: "muscular",
        name: {
          en: "Muscular tissue",
          hi: "पेशीय ऊतक",
          mr: "स्नायू ऊती",
        },
        kind: "animal-tissue",
        prompt: {
          en: "Which animal tissue is built of long fibres that can shorten and pull, and so produce every movement from a blink to a heartbeat?",
          hi: "कौन-सा प्राणी ऊतक लंबे रेशों का बना है जो छोटे होकर खींच सकते, और इसलिए पलक से धड़कन तक हर गति पैदा करते?",
          mr: "कोणती प्राणी ऊती लांब तंतूंची बनलेली आहे जे आखूड होऊन ओढू शकतात, आणि म्हणून पापणीपासून हृदयस्पंदापर्यंत प्रत्येक हालचाल घडवतात?",
        },
        statement: {
          en: "Muscular tissue is made of long fibres that contract and relax — by shortening, it pulls bones and organs to make every movement of the body.",
          hi: "पेशीय ऊतक लंबे रेशों का है जो सिकुड़ते-ढीले होते — छोटा होकर यह अस्थियों-अंगों को खींचकर शरीर की हर गति बनाता।",
          mr: "स्नायू ऊती लांब तंतूंची आहे जे आकुंचतात-शिथिल होतात — आखूड होऊन ती हाडे-अवयव ओढून शरीराची प्रत्येक हालचाल घडवते.",
        },
        detail: {
          en: "It comes in three kinds: striped voluntary muscle you command, smooth muscle that quietly works your gut, and the tireless muscle of the heart.",
          hi: "यह तीन प्रकार का: धारीदार ऐच्छिक पेशी जिसे तुम आदेश दो, चिकनी पेशी जो चुपचाप आँत चलाती, और हृदय की अथक पेशी।",
          mr: "ती तीन प्रकारची: रेखांकित ऐच्छिक स्नायू जिला तू आज्ञा देतोस, गुळगुळीत स्नायू जी गुपचूप आतडे चालवते, आणि हृदयाची अथक स्नायू.",
        },
        extra: {
          en: "The proteins inside its fibres slide over one another to shorten the cell — movement written at the scale of molecules.",
          hi: "इसके रेशों के भीतर के प्रोटीन एक-दूसरे पर फिसलकर कोशिका छोटी करते — अणुओं के पैमाने पर लिखी गति।",
          mr: "तिच्या तंतूंतली प्रथिने एकमेकांवर सरकून पेशी आखूड करतात — रेणूंच्या मापावर लिहिलेली हालचाल.",
        },
        pair: {
          left: {
            en: "Fibres that contract to pull",
            hi: "खींचने को सिकुड़ते रेशे",
            mr: "ओढायला आकुंचणारे तंतू",
          },
          right: {
            en: "muscular tissue",
            hi: "पेशीय ऊतक",
            mr: "स्नायू ऊती",
          },
        },
      },
      {
        id: "nervous",
        name: {
          en: "Nervous tissue",
          hi: "तंत्रिका ऊतक",
          mr: "चेता ऊती",
        },
        kind: "animal-tissue",
        prompt: {
          en: "Which animal tissue is made of long, branched cells that carry electrical messages at speed, wiring the brain to every corner of the body?",
          hi: "कौन-सा प्राणी ऊतक लंबी, शाखित कोशिकाओं का है जो विद्युत संदेश तेज़ी से ढोतीं, मस्तिष्क को शरीर के हर कोने से जोड़तीं?",
          mr: "कोणती प्राणी ऊती लांब, फांद्या असलेल्या पेशींची आहे जी विद्युत संदेश वेगाने वाहतात, मेंदूला शरीराच्या प्रत्येक कोपऱ्याशी जोडतात?",
        },
        statement: {
          en: "Nervous tissue is made of neurons — long, branched cells that carry electrical impulses swiftly, letting the body sense, decide and respond.",
          hi: "तंत्रिका ऊतक न्यूरॉनों का है — लंबी, शाखित कोशिकाएँ जो विद्युत आवेग तेज़ी से ढोतीं, शरीर को अनुभव, निर्णय और प्रतिक्रिया देतीं।",
          mr: "चेता ऊती चेतापेशींची आहे — लांब, फांद्या असलेल्या पेशी ज्या विद्युत आवेग वेगाने वाहतात, शरीराला जाणीव, निर्णय आणि प्रतिसाद देतात.",
        },
        detail: {
          en: "A single neuron can run over a metre — from your spinal cord to your toe — making it the longest cell in the human body.",
          hi: "एक अकेला न्यूरॉन एक मीटर से अधिक चल सकता — मेरुरज्जु से पैर की उँगली तक — मानव शरीर की सबसे लंबी कोशिका।",
          mr: "एकच चेतापेशी एक मीटरहून अधिक धावू शकते — मेरुरज्जूपासून पायाच्या बोटापर्यंत — मानवी शरीरातील सर्वांत लांब पेशी.",
        },
        extra: {
          en: "The impulse leaps between neurons across a tiny gap, the synapse, where a chemical carries the message the last step across.",
          hi: "आवेग न्यूरॉनों के बीच एक नन्हे अंतराल, सिनैप्स, पर छलाँगता, जहाँ एक रसायन संदेश को अंतिम क़दम पार ले जाता।",
          mr: "आवेग चेतापेशींमध्ये एका इवल्या फटी, अनुबंध, वर उडी मारतो, जिथे एक रसायन संदेश शेवटचे पाऊल पार नेतो.",
        },
        pair: {
          left: {
            en: "Branched cells carrying impulses",
            hi: "आवेग ढोती शाखित कोशिकाएँ",
            mr: "आवेग वाहणाऱ्या फांद्यांच्या पेशी",
          },
          right: {
            en: "nervous tissue",
            hi: "तंत्रिका ऊतक",
            mr: "चेता ऊती",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A gardener carefully peels a complete ring of bark from all around a young tree's trunk. Months later the leaves are green and healthy, yet the roots below the ring slowly starve and the tree dies. Which tissue was cut, and why does that fit?",
          hi: "एक माली सावधानी से एक युवा पेड़ के तने के चारों ओर से छाल का पूरा छल्ला उतारता है। महीनों बाद पत्तियाँ हरी-स्वस्थ हैं, फिर भी छल्ले के नीचे की जड़ें धीरे भूखी मरतीं और पेड़ मर जाता। कौन-सा ऊतक कटा, और यह क्यों बैठता है?",
          mr: "एक माळी काळजीपूर्वक एका तरुण झाडाच्या खोडाभोवती सालीचे पूर्ण वलय काढतो. महिन्यांनी पाने हिरवी-निरोगी आहेत, तरी वलयाखालची मुळे हळू उपाशी मरतात आणि झाड मरते. कोणती ऊती कापली, आणि ते का जुळते?",
        },
        choices: [
          {
            en: "The phloem was cut. It carries food made in the leaves down to the roots; the leaves still get water through the untouched inner xylem, so they stay green, but the roots below the cut are starved of food",
            hi: "फ्लोएम कटा। यह पत्तियों में बना भोजन जड़ों तक नीचे ले जाता; पत्तियों को अछूते भीतरी जाइलम से पानी अब भी मिलता, अतः वे हरी रहतीं, पर कट के नीचे की जड़ें भोजन से वंचित",
            mr: "परिकाष्ठ कापले. ते पानांत बनलेले अन्न मुळांपर्यंत खाली नेते; पानांना अस्पर्श आतल्या प्रकाष्ठातून पाणी अजूनही मिळते, म्हणून ती हिरवी राहतात, पण कापाखालची मुळे अन्नापासून वंचित",
          },
          {
            en: "The xylem was cut, so the roots got no water",
            hi: "जाइलम कटा, अतः जड़ों को पानी नहीं मिला",
            mr: "प्रकाष्ठ कापले, म्हणून मुळांना पाणी मिळाले नाही",
          },
          {
            en: "The meristematic tissue was cut, stopping all growth at once",
            hi: "विभज्योतक कटा, सारी वृद्धि एकदम रुकी",
            mr: "विभाजी ऊती कापली, सारी वाढ एकदम थांबली",
          },
          {
            en: "The bark holds no tissue that matters; the tree died of the wound itself",
            hi: "छाल में कोई महत्व का ऊतक नहीं; पेड़ घाव से ही मरा",
            mr: "सालीत महत्त्वाची कोणतीही ऊती नाही; झाड जखमेनेच मेले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This old orchard trick, called girdling, cuts the phloem — which runs in the soft bark, the outer living layer — while leaving the woody xylem deep in the trunk untouched. The two transport tissues run in opposite errands. Xylem, dead hollow pipes buried in the wood, carries water and minerals UP from root to leaf, and it is still whole, so the leaves keep their water and stay green and busy making food. But phloem, the living tissue just under the bark, is the only road that carries that food DOWNWARD to the roots. Sever the ring of phloem and the food can no longer reach below it: the leaves feast, sugars even pile up above the cut, but the roots, cut off from all nourishment, slowly exhaust their reserves and starve — and with dead roots the whole tree follows. The clue that it is phloem and not xylem is exactly this pattern: green top, dying bottom. Had the xylem been cut, the leaves would have wilted first for want of water.",
          hi: "यह पुरानी बाग़-चाल, जिसे वलयन कहते, फ्लोएम काटती — जो कोमल छाल, बाहरी जीवित परत में चलता — जबकि तने में गहरे काष्ठीय जाइलम को अछूता छोड़ती। दोनों वहन-ऊतक उल्टे काम पर चलते। जाइलम, लकड़ी में दबी मृत खोखली नलियाँ, पानी-खनिज जड़ से पत्ती तक ऊपर ले जाता, और वह अब भी पूरा, अतः पत्तियाँ पानी रखतीं, हरी और भोजन बनाने में व्यस्त। पर फ्लोएम, छाल के ठीक नीचे का जीवित ऊतक, एकमात्र सड़क जो वह भोजन जड़ों को नीचे ले जाती। फ्लोएम का छल्ला काटो तो भोजन उसके नीचे नहीं पहुँच पाता: पत्तियाँ दावत उड़ातीं, शक्कर कट के ऊपर जमा भी होती, पर जड़ें, सारे पोषण से कटी, धीरे अपना भंडार चुकातीं और भूखी मरतीं — और मृत जड़ों के साथ पूरा पेड़ चला जाता। संकेत कि यह फ्लोएम है जाइलम नहीं, ठीक यही नमूना: हरा शिखर, मरता तल। जाइलम कटा होता तो पत्तियाँ पानी के अभाव में पहले मुरझातीं।",
          mr: "ही जुनी बाग-युक्ती, जिला वलयन म्हणतात, परिकाष्ठ कापते — जे मऊ सालीत, बाहेरच्या जिवंत थरात चालते — तर खोडात खोल काष्ठमय प्रकाष्ठ अस्पर्श सोडते. दोन्ही वहन-ऊती उलट्या कामावर चालतात. प्रकाष्ठ, लाकडात दडलेल्या मृत पोकळ नळ्या, पाणी-खनिजे मुळापासून पानापर्यंत वर नेते, आणि ते अजून अखंड, म्हणून पाने पाणी राखतात, हिरवी आणि अन्न बनवण्यात व्यग्र. पण परिकाष्ठ, सालीच्या नेमके खालचे जिवंत ऊती, एकमेव रस्ता जो ते अन्न मुळांना खाली नेतो. परिकाष्ठाचे वलय कापा तर अन्न त्याखाली पोहोचू शकत नाही: पाने मेजवानी झोडतात, साखर कापाच्या वर साठतेही, पण मुळे, साऱ्या पोषणापासून तुटलेली, हळू आपला साठा संपवतात आणि उपाशी मरतात — आणि मृत मुळांसह संपूर्ण झाड जाते. संकेत की हे परिकाष्ठ आहे प्रकाष्ठ नव्हे, नेमका हाच नमुना: हिरवे शिखर, मरता तळ. प्रकाष्ठ कापले असते तर पाने पाण्याअभावी आधी कोमेजली असती.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Xylem and phloem both transport, yet one is built of dead cells and the other must stay alive. Why does a water-carrier work best dead, while a food-carrier must be living?",
          hi: "जाइलम और फ्लोएम दोनों परिवहन करते, फिर भी एक मृत कोशिकाओं का बना और दूसरे को जीवित रहना होता। पानी-वाहक मृत ही सबसे अच्छा क्यों चलता, जबकि भोजन-वाहक को जीवित रहना ज़रूरी?",
          mr: "प्रकाष्ठ आणि परिकाष्ठ दोन्ही वहन करतात, तरी एक मृत पेशींचे बनलेले आणि दुसऱ्याला जिवंत राहावे लागते. पाणी-वाहक मृतच उत्तम का चालतो, तर अन्न-वाहकाला जिवंत राहणे का आवश्यक?",
        },
        choices: [
          {
            en: "Water rises by a passive pull from the leaves, so xylem needs only clear, hollow, dead pipes with the cell contents removed; but pushing food both up and down needs living cells that spend energy to load and move it, so phloem must stay alive",
            hi: "पानी पत्तियों की निष्क्रिय खिंचाई से चढ़ता, अतः जाइलम को केवल साफ़, खोखली, मृत नलियाँ चाहिए जिनका कोशिका-अंश हटा हो; पर भोजन को ऊपर-नीचे धकेलने को ऊर्जा खर्चती जीवित कोशिकाएँ चाहिए, अतः फ्लोएम जीवित रहे",
            mr: "पाणी पानांच्या निष्क्रिय ओढीने चढते, म्हणून प्रकाष्ठाला फक्त स्वच्छ, पोकळ, मृत नळ्या हव्यात ज्यांचा पेशी-आशय काढलेला; पण अन्न वर-खाली ढकलायला ऊर्जा खर्चणाऱ्या जिवंत पेशी हव्यात, म्हणून परिकाष्ठ जिवंत राहावे",
          },
          {
            en: "Dead cells are simply cheaper for the plant, and it randomly chose xylem to be the cheap one",
            hi: "मृत कोशिकाएँ बस पौधे को सस्ती, और उसने बेतरतीब जाइलम को सस्ता चुना",
            mr: "मृत पेशी नुसत्या झाडाला स्वस्त, आणि त्याने यादृच्छिक प्रकाष्ठ स्वस्त निवडले",
          },
          {
            en: "Phloem is alive only because it happens to sit nearer the warm sunlight",
            hi: "फ्लोएम जीवित केवल इसलिए कि वह गरम धूप के पास होता",
            mr: "परिकाष्ठ जिवंत फक्त म्हणून की ते उबदार उन्हाजवळ असते",
          },
          {
            en: "Both are actually dead; the textbook distinction is a myth",
            hi: "दोनों वास्तव में मृत; पाठ्यपुस्तक का भेद एक मिथक",
            mr: "दोन्ही खरे तर मृत; पाठ्यपुस्तकातील भेद एक कल्पित",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The difference in life follows from the difference in the job. Xylem's cargo is water, and water is not pushed up the plant — it is pulled. As water evaporates from the leaves (transpiration), it drags the continuous thread of water up behind it under tension, all the way from the roots. For that, the ideal conduit is an empty, unobstructed pipe: so xylem cells die, dissolve away their contents and even their end-walls, and leave a clean hollow tube of reinforced wall. Being dead is not a flaw here — it is the design, removing every obstacle to a passive upward flow. Phloem's cargo is dissolved food, and its task is far harder: it must move sugar in whichever direction the plant needs — up to a growing bud in spring, down to the roots in autumn — often against the direction water flows, and often 'uphill' into a store. That takes active work: living companion cells spend ATP energy to load sugar into the phloem at the leaf and move it along, so the tissue cannot be dead. So the same word 'transport' hides two opposite engineering answers — a dead passive pipe for the pulled water, a living active pump for the pushed food.",
          hi: "जीवन का अंतर काम के अंतर से निकलता। जाइलम का माल पानी है, और पानी पौधे में ऊपर धकेला नहीं जाता — खींचा जाता। जैसे पत्तियों से पानी वाष्पित होता (वाष्पोत्सर्जन), वह पानी के अटूट धागे को तनाव में पीछे ऊपर घसीटता, जड़ों से सारा रास्ता। इसके लिए आदर्श नाली एक खाली, बेरोक नली है: अतः जाइलम कोशिकाएँ मरतीं, अपना अंश और अंत-भित्तियाँ भी घोल देतीं, और प्रबलित भित्ति की साफ़ खोखली नली छोड़तीं। मृत होना यहाँ दोष नहीं — यही डिज़ाइन, निष्क्रिय ऊपरी बहाव की हर बाधा हटाता। फ्लोएम का माल घुला भोजन है, और उसका काम कहीं कठिन: उसे शक्कर पौधे की ज़रूरत की किसी भी दिशा में ले जाना — वसंत में बढ़ती कली को ऊपर, पतझड़ में जड़ों को नीचे — अक्सर पानी की दिशा के विरुद्ध, और अक्सर भंडार में 'चढ़ाई' पर। यह सक्रिय श्रम माँगता: जीवित सहचर कोशिकाएँ ATP-ऊर्जा खर्च कर पत्ती पर शक्कर भरतीं और आगे बढ़ातीं, अतः ऊतक मृत नहीं हो सकता। अतः वही शब्द 'परिवहन' दो विपरीत अभियांत्रिक उत्तर छिपाता — खींचे पानी को मृत निष्क्रिय नली, धकेले भोजन को जीवित सक्रिय पंप।",
          mr: "जीवनातील फरक कामातील फरकातून निघतो. प्रकाष्ठाचा माल पाणी, आणि पाणी झाडात वर ढकलले जात नाही — ओढले जाते. पानांतून पाणी बाष्पित होताना (बाष्पोत्सर्जन), ते पाण्याचा अखंड धागा ताणात मागे वर ओढते, मुळांपासून सगळा रस्ता. त्यासाठी आदर्श नळ एक रिकामा, बिनअडथळा नळ: म्हणून प्रकाष्ठ पेशी मरतात, आपला आशय आणि टोक-भिंतीही विरघळवतात, आणि बळकट भिंतीचा स्वच्छ पोकळ नळ सोडतात. मृत असणे इथे दोष नाही — हेच रचनाकौशल्य, निष्क्रिय वरच्या प्रवाहाचा प्रत्येक अडथळा काढते. परिकाष्ठाचा माल विरघळलेले अन्न, आणि त्याचे काम कितीतरी कठीण: त्याला साखर झाडाच्या गरजेच्या कोणत्याही दिशेत न्यायची — वसंतात वाढत्या कळीला वर, शरद ऋतूत मुळांना खाली — बहुधा पाण्याच्या दिशेविरुद्ध, आणि बहुधा साठ्यात 'चढावर'. हे सक्रिय श्रम मागते: जिवंत सहचर पेशी ATP-ऊर्जा खर्चून पानावर साखर भरतात आणि पुढे नेतात, म्हणून ऊती मृत असू शकत नाही. म्हणून तोच शब्द 'वहन' दोन विरुद्ध अभियांत्रिकी उत्तरे लपवतो — ओढल्या पाण्याला मृत निष्क्रिय नळ, ढकलल्या अन्नाला जिवंत सक्रिय पंप.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Motion (describing how things move)                        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-motion",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 8 — Motion",
      hi: "अध्याय 8 — गति",
      mr: "प्रकरण 8 — गती",
    },
    name: {
      en: "Motion",
      hi: "गति",
      mr: "गती",
    },
    summary: {
      en: "Motion measured honestly: distance is the whole path walked, displacement only the straight gap from start to end. Speed ignores direction, velocity insists on it, and any change of velocity — even at steady speed round a circle — is acceleration.",
      hi: "गति ईमानदारी से नापी: दूरी चला पूरा रास्ता, विस्थापन केवल आरंभ से अंत की सीधी दूरी। चाल दिशा अनदेखी करती, वेग उस पर अड़ता, और वेग का कोई भी परिवर्तन — वृत्त में स्थिर चाल पर भी — त्वरण है।",
      mr: "गती प्रामाणिकपणे मोजली: अंतर चाललेला संपूर्ण मार्ग, विस्थापन फक्त सुरुवातीपासून शेवटपर्यंतचे सरळ अंतर. चाल दिशा दुर्लक्षिते, वेग तिच्यावर अडतो, आणि वेगाचा कोणताही बदल — वर्तुळात स्थिर चालीवरही — त्वरण आहे.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "distance-displacement",
        name: {
          en: "Distance and displacement",
          hi: "दूरी और विस्थापन",
          mr: "अंतर आणि विस्थापन",
        },
        kind: "idea",
        prompt: {
          en: "You jog once round a circular park and stop exactly where you began. Which quantity counts the whole path you ran, and which is now zero?",
          hi: "तुम एक वृत्ताकार बाग़ का एक चक्कर लगाकर ठीक वहीं रुकते जहाँ शुरू किया। कौन-सी राशि तुम्हारा दौड़ा पूरा रास्ता गिनती, और कौन-सी अब शून्य है?",
          mr: "तू एका वर्तुळाकार बागेची एक फेरी मारून नेमके तिथेच थांबतोस जिथे सुरू केले. कोणती राशी तू धावलेला संपूर्ण मार्ग मोजते, आणि कोणती आता शून्य आहे?",
        },
        statement: {
          en: "Distance is the total length of the path actually travelled; displacement is only the straight-line gap from start to finish, with a direction — and it can be zero even after a long walk.",
          hi: "दूरी वास्तव में तय किए रास्ते की कुल लंबाई है; विस्थापन केवल आरंभ से अंत की सीधी-रेखा दूरी, दिशा-सहित — और लंबे चलने पर भी शून्य हो सकता है।",
          mr: "अंतर प्रत्यक्ष चाललेल्या मार्गाची एकूण लांबी आहे; विस्थापन फक्त सुरुवातीपासून शेवटपर्यंतचे सरळ-रेषेतील अंतर, दिशेसह — आणि लांब चालल्यावरही शून्य असू शकते.",
        },
        detail: {
          en: "Distance can only grow or hold still, never shrink; displacement can rise and fall as you turn back toward where you began.",
          hi: "दूरी केवल बढ़ या ठहर सकती, कभी घट नहीं; विस्थापन बढ़-घट सकता जैसे तुम आरंभ की ओर लौटते।",
          mr: "अंतर फक्त वाढू किंवा थांबू शकते, कधी घटत नाही; विस्थापन वाढू-घटू शकते जसे तू सुरुवातीकडे परततोस.",
        },
        extra: {
          en: "Distance is a scalar — a bare number; displacement is a vector, useless until you also name its direction.",
          hi: "दूरी अदिश है — मात्र संख्या; विस्थापन सदिश है, दिशा बताए बिना बेकार।",
          mr: "अंतर अदिश आहे — नुसती संख्या; विस्थापन सदिश आहे, दिशा सांगितल्याविना निरुपयोगी.",
        },
        pair: {
          left: {
            en: "Zero after a full loop back",
            hi: "पूरे चक्कर लौटने पर शून्य",
            mr: "पूर्ण फेरी परतल्यावर शून्य",
          },
          right: {
            en: "displacement",
            hi: "विस्थापन",
            mr: "विस्थापन",
          },
        },
      },
      {
        id: "speed-velocity",
        name: {
          en: "Speed and velocity",
          hi: "चाल और वेग",
          mr: "चाल आणि वेग",
        },
        kind: "idea",
        prompt: {
          en: "Two cars both read 60 km/h, but one heads north and one south. Which quantity tells them apart, and which calls them the same?",
          hi: "दो कारें दोनों 60 किमी/घंटा दिखातीं, पर एक उत्तर एक दक्षिण जाती। कौन-सी राशि उन्हें अलग बताती, और कौन-सी एक-सा कहती?",
          mr: "दोन गाड्या दोन्ही 60 किमी/तास दाखवतात, पण एक उत्तरेला एक दक्षिणेला जाते. कोणती राशी त्यांना वेगळे सांगते, आणि कोणती सारखे म्हणते?",
        },
        statement: {
          en: "Speed is distance covered per unit time with no direction; velocity is displacement per unit time and carries a direction — so two equal speeds can be opposite velocities.",
          hi: "चाल प्रति एकांक समय तय दूरी है बिना दिशा; वेग प्रति एकांक समय विस्थापन है और दिशा रखता — अतः दो बराबर चालें विपरीत वेग हो सकतीं।",
          mr: "चाल प्रति एकक वेळेत चाललेले अंतर आहे दिशेविना; वेग प्रति एकक वेळेत विस्थापन आहे आणि दिशा राखतो — म्हणून दोन समान चाली विरुद्ध वेग असू शकतात.",
        },
        detail: {
          en: "Average speed is total distance over total time; it can stay positive even when average velocity, using displacement, is zero for a round trip.",
          hi: "औसत चाल कुल दूरी बटा कुल समय; यह धनात्मक रह सकती जब चक्कर के लिए विस्थापन से औसत वेग शून्य हो।",
          mr: "सरासरी चाल एकूण अंतर भागिले एकूण वेळ; ती धन राहू शकते जेव्हा फेरीसाठी विस्थापनाने सरासरी वेग शून्य असतो.",
        },
        extra: {
          en: "A speedometer shows speed alone; to log velocity you would need a compass beside it naming the heading.",
          hi: "चालमापी केवल चाल दिखाता; वेग दर्ज करने को उसके साथ दिशा बताता कम्पास चाहिए।",
          mr: "चालमापक फक्त चाल दाखवतो; वेग नोंदायला त्याच्याशेजारी दिशा सांगणारा होकायंत्र हवा.",
        },
        pair: {
          left: {
            en: "Displacement per unit time, with heading",
            hi: "प्रति समय विस्थापन, दिशा-सहित",
            mr: "प्रति वेळ विस्थापन, दिशेसह",
          },
          right: {
            en: "velocity",
            hi: "वेग",
            mr: "वेग",
          },
        },
      },
      {
        id: "uniform-motion",
        name: {
          en: "Uniform motion",
          hi: "एकसमान गति",
          mr: "एकसमान गती",
        },
        kind: "idea",
        prompt: {
          en: "A body that covers equal distances in every equal slice of time — 10 m each second, second after second — is said to be in what kind of motion?",
          hi: "जो पिंड समय के हर बराबर टुकड़े में बराबर दूरी तय करे — हर सेकंड 10 मी, सेकंड-दर-सेकंड — वह किस प्रकार की गति में कहलाता?",
          mr: "जो पिंड वेळेच्या प्रत्येक समान तुकड्यात समान अंतर चालतो — प्रत्येक सेकंदाला 10 मी, सेकंदामागून सेकंद — तो कोणत्या प्रकारच्या गतीत म्हणतात?",
        },
        statement: {
          en: "In uniform motion a body covers equal distances in equal intervals of time — its speed never changes, and a distance-time graph of it is a straight slanting line.",
          hi: "एकसमान गति में पिंड बराबर समय-अंतरालों में बराबर दूरी तय करता — इसकी चाल कभी नहीं बदलती, और इसका दूरी-समय ग्राफ़ सीधी तिरछी रेखा है।",
          mr: "एकसमान गतीत पिंड समान वेळ-अंतरांत समान अंतर चालतो — त्याची चाल कधी बदलत नाही, आणि त्याचा अंतर-वेळ आलेख सरळ तिरपी रेषा आहे.",
        },
        detail: {
          en: "It is an idealisation rarely met in full — real cars speed up and slow down — but a straight highway stretch comes close.",
          hi: "यह एक आदर्श है जो पूरा शायद ही मिले — असली कारें तेज़-धीमी होतीं — पर सीधा राजमार्ग-खंड पास आता है।",
          mr: "हे एक आदर्शीकरण आहे जे पूर्ण क्वचित भेटते — खऱ्या गाड्या वेगवान-मंद होतात — पण सरळ महामार्ग-टप्पा जवळ येतो.",
        },
        extra: {
          en: "Because speed holds fixed, the distance grows in simple proportion to time — double the time, double the distance.",
          hi: "चाल नियत रहने से दूरी समय के सरल अनुपात में बढ़ती — समय दुगुना, दूरी दुगुनी।",
          mr: "चाल स्थिर राहिल्याने अंतर वेळेच्या सोप्या प्रमाणात वाढते — वेळ दुप्पट, अंतर दुप्पट.",
        },
        pair: {
          left: {
            en: "Equal distances in equal times",
            hi: "बराबर समय में बराबर दूरी",
            mr: "समान वेळेत समान अंतर",
          },
          right: {
            en: "uniform motion",
            hi: "एकसमान गति",
            mr: "एकसमान गती",
          },
        },
      },
      {
        id: "acceleration",
        name: { en: "Acceleration", hi: "त्वरण", mr: "त्वरण" },
        kind: "idea",
        prompt: {
          en: "When a bus pulls away and its velocity climbs from rest, what do we call the rate at which that velocity is changing each second?",
          hi: "जब बस चल पड़ती और उसका वेग विराम से चढ़ता, हर सेकंड उस वेग के बदलने की दर को हम क्या कहते?",
          mr: "जेव्हा बस निघते आणि तिचा वेग विश्रांतीतून चढतो, प्रत्येक सेकंदाला तो वेग बदलण्याच्या दराला आपण काय म्हणतो?",
        },
        statement: {
          en: "Acceleration is the rate of change of velocity with time — how fast velocity itself rises or falls; if velocity does not change, acceleration is zero.",
          hi: "त्वरण समय के साथ वेग के परिवर्तन की दर है — वेग स्वयं कितनी तेज़ी से चढ़ता-गिरता; यदि वेग न बदले तो त्वरण शून्य।",
          mr: "त्वरण वेळेसह वेग बदलण्याचा दर आहे — वेग स्वतः किती वेगाने चढतो-घटतो; वेग बदलला नाही तर त्वरण शून्य.",
        },
        detail: {
          en: "When velocity falls — a braking train — the acceleration points backward and is often called deceleration or retardation.",
          hi: "जब वेग गिरता — ब्रेक लगाती रेल — त्वरण पीछे की ओर होता और अक्सर मंदन या अवत्वरण कहलाता।",
          mr: "जेव्हा वेग घटतो — ब्रेक लावणारी रेल्वे — त्वरण मागच्या दिशेला असते आणि बहुधा मंदन म्हणतात.",
        },
        extra: {
          en: "In uniform acceleration the velocity climbs by equal steps each second, and the neat equations v = u + at and s = ut + ½at² then hold.",
          hi: "एकसमान त्वरण में वेग हर सेकंड बराबर क़दमों से चढ़ता, और तब सुथरे समीकरण v = u + at और s = ut + ½at² लागू होते।",
          mr: "एकसमान त्वरणात वेग प्रत्येक सेकंदाला समान पावलांनी चढतो, आणि तेव्हा नीटनेटकी समीकरणे v = u + at आणि s = ut + ½at² लागू होतात.",
        },
        pair: {
          left: {
            en: "Rate at which velocity changes",
            hi: "वेग बदलने की दर",
            mr: "वेग बदलण्याचा दर",
          },
          right: {
            en: "acceleration",
            hi: "त्वरण",
            mr: "त्वरण",
          },
        },
      },
      {
        id: "uniform-circular",
        name: {
          en: "Uniform circular motion",
          hi: "एकसमान वृत्तीय गति",
          mr: "एकसमान वर्तुळाकार गती",
        },
        kind: "idea",
        prompt: {
          en: "A stone whirled on a string goes round at a steady speed, yet physics insists it is accelerating every instant. What kind of motion hides this surprise?",
          hi: "डोरी पर घुमाया पत्थर स्थिर चाल से चक्कर लगाता, फिर भी भौतिकी अड़ती कि वह हर क्षण त्वरित हो रहा। कौन-सी गति यह अचरज छिपाती?",
          mr: "दोरीवर फिरवलेला दगड स्थिर चालीने फेरी मारतो, तरी भौतिकशास्त्र अडते की तो प्रत्येक क्षणी त्वरित होतोय. कोणती गती हे आश्चर्य लपवते?",
        },
        statement: {
          en: "In uniform circular motion the speed stays constant but the direction keeps turning — so the velocity is always changing, and the body is accelerating the whole time.",
          hi: "एकसमान वृत्तीय गति में चाल नियत रहती पर दिशा मुड़ती रहती — अतः वेग सदा बदलता, और पिंड पूरे समय त्वरित होता।",
          mr: "एकसमान वर्तुळाकार गतीत चाल स्थिर राहते पण दिशा वळत राहते — म्हणून वेग सदैव बदलतो, आणि पिंड संपूर्ण वेळ त्वरित होतो.",
        },
        detail: {
          en: "The acceleration points always toward the centre, and the pull of the string that supplies it is what stops the stone flying straight off.",
          hi: "त्वरण सदा केंद्र की ओर होता, और उसे देती डोरी की खिंचाई ही पत्थर को सीधे उड़ जाने से रोकती।",
          mr: "त्वरण सदैव केंद्राकडे असते, आणि ते देणारी दोरीची ओढच दगडाला सरळ उडून जाण्यापासून रोखते.",
        },
        extra: {
          en: "Let the string snap and the stone leaves along the tangent — a straight line touching the circle where it was released.",
          hi: "डोरी टूटे तो पत्थर स्पर्शरेखा के साथ निकलता — छूटने की जगह वृत्त को छूती सीधी रेखा।",
          mr: "दोरी तुटली तर दगड स्पर्शरेषेने निघतो — सुटण्याच्या जागी वर्तुळाला स्पर्शणारी सरळ रेषा.",
        },
        pair: {
          left: {
            en: "Steady speed, ever-turning direction",
            hi: "स्थिर चाल, सदा मुड़ती दिशा",
            mr: "स्थिर चाल, सदैव वळती दिशा",
          },
          right: {
            en: "uniform circular motion",
            hi: "एकसमान वृत्तीय गति",
            mr: "एकसमान वर्तुळाकार गती",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A cyclist rides 3 km due east, then turns and rides 4 km due north, taking half an hour in all. Her friend says 'you travelled 7 km'; her coach says 'you are 5 km from where you began'. Both are right — how?",
          hi: "एक साइकिल-सवार 3 किमी पूर्व, फिर मुड़कर 4 किमी उत्तर जाती, कुल आधे घंटे में। उसकी सहेली कहती '7 किमी चली'; उसका कोच कहता 'तुम आरंभ से 5 किमी दूर हो'। दोनों सही — कैसे?",
          mr: "एक सायकलस्वार 3 किमी पूर्वेला, मग वळून 4 किमी उत्तरेला जाते, एकूण अर्ध्या तासात. तिची मैत्रीण म्हणते '7 किमी चाललीस'; तिचा प्रशिक्षक म्हणतो 'तू सुरुवातीपासून 5 किमी दूर आहेस'. दोन्ही बरोबर — कसे?",
        },
        choices: [
          {
            en: "7 km is the distance — the whole path added up (3 + 4); 5 km is the displacement — the straight-line gap from start to finish, from the right triangle √(3² + 4²) = 5",
            hi: "7 किमी दूरी है — पूरा रास्ता जोड़ा (3 + 4); 5 किमी विस्थापन है — आरंभ से अंत की सीधी दूरी, समकोण त्रिभुज से √(3² + 4²) = 5",
            mr: "7 किमी अंतर आहे — संपूर्ण मार्ग जोडलेला (3 + 4); 5 किमी विस्थापन आहे — सुरुवातीपासून शेवटपर्यंतचे सरळ अंतर, काटकोन त्रिकोणातून √(3² + 4²) = 5",
          },
          {
            en: "The friend simply measured wrongly; the true answer is only 5 km",
            hi: "सहेली ने बस ग़लत नापा; सही उत्तर केवल 5 किमी",
            mr: "मैत्रिणीने नुसते चुकीचे मोजले; खरे उत्तर फक्त 5 किमी",
          },
          {
            en: "7 km is the displacement and 5 km is the distance",
            hi: "7 किमी विस्थापन और 5 किमी दूरी",
            mr: "7 किमी विस्थापन आणि 5 किमी अंतर",
          },
          {
            en: "Both numbers describe her speed, not her position",
            hi: "दोनों संख्याएँ उसकी चाल बतातीं, स्थिति नहीं",
            mr: "दोन्ही संख्या तिची चाल सांगतात, स्थिती नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both are right because they are measuring two different things. Distance is the whole length of the path actually pedalled: 3 km east and then 4 km north add up to 7 km, and no matter how she wound about, distance only ever accumulates. Displacement, on the other hand, asks a blunter question — how far, in a straight line, is she now from her starting point, and in what direction? Her two legs are at right angles, so start-point, corner, and end-point form a right-angled triangle with legs 3 and 4. The straight gap is the hypotenuse: √(3² + 4²) = √(9 + 16) = √25 = 5 km, pointing north-east. So 7 km is how far she rode, 5 km is how far she got — and the two are equal only when the motion is in one straight line without turning back. (Her average speed is 7 km ÷ ½ h = 14 km/h; her average velocity is 5 km ÷ ½ h = 10 km/h north-east — the same split, one step up.)",
          hi: "दोनों सही क्योंकि दो अलग चीज़ें नाप रहे। दूरी वास्तव में चलाए रास्ते की पूरी लंबाई: 3 किमी पूर्व फिर 4 किमी उत्तर जुड़कर 7 किमी, और चाहे जैसे घूमे, दूरी केवल जमा होती। विस्थापन, दूसरी ओर, कठोर सवाल पूछता — सीधी रेखा में वह अब आरंभ से कितनी दूर, और किस दिशा? उसके दो चरण समकोण पर, अतः आरंभ, कोना, अंत एक समकोण त्रिभुज बनाते भुजाएँ 3 और 4। सीधी दूरी कर्ण है: √(3² + 4²) = √(9 + 16) = √25 = 5 किमी, उत्तर-पूर्व की ओर। अतः 7 किमी वह कितना चली, 5 किमी वह कितनी पहुँची — और दोनों बराबर केवल तब जब गति एक सीधी रेखा में बिना लौटे। (उसकी औसत चाल 7 किमी ÷ ½ घं = 14 किमी/घं; औसत वेग 5 किमी ÷ ½ घं = 10 किमी/घं उत्तर-पूर्व — वही भेद, एक क़दम ऊपर।)",
          mr: "दोन्ही बरोबर कारण दोन वेगळ्या गोष्टी मोजताहेत. अंतर प्रत्यक्ष चालवलेल्या मार्गाची संपूर्ण लांबी: 3 किमी पूर्व मग 4 किमी उत्तर जोडून 7 किमी, आणि कशीही फिरली तरी अंतर फक्त जमा होते. विस्थापन, दुसरीकडे, कठोर प्रश्न विचारते — सरळ रेषेत ती आता सुरुवातीपासून किती दूर, आणि कोणत्या दिशेला? तिचे दोन टप्पे काटकोनात, म्हणून सुरुवात, कोपरा, शेवट एक काटकोन त्रिकोण बनवतात बाजू 3 आणि 4. सरळ अंतर कर्ण आहे: √(3² + 4²) = √(9 + 16) = √25 = 5 किमी, उत्तर-पूर्वेला. म्हणून 7 किमी ती किती चालली, 5 किमी ती किती पोहोचली — आणि दोन्ही समान फक्त तेव्हा जेव्हा गती एका सरळ रेषेत न परतता. (तिची सरासरी चाल 7 किमी ÷ ½ तास = 14 किमी/तास; सरासरी वेग 5 किमी ÷ ½ तास = 10 किमी/तास उत्तर-पूर्व — तोच भेद, एक पाऊल वर.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A stone tied to a string is whirled overhead so it goes round and round at a perfectly steady speed. A student objects: 'Its speed never changes, so its acceleration must be zero.' Why is the student wrong?",
          hi: "डोरी से बँधा पत्थर सिर के ऊपर घुमाया जाता ताकि वह बिलकुल स्थिर चाल से गोल-गोल घूमे। एक छात्र आपत्ति करता: 'इसकी चाल कभी नहीं बदलती, अतः त्वरण शून्य होगा।' छात्र क्यों ग़लत है?",
          mr: "दोरीला बांधलेला दगड डोक्यावर फिरवला जातो जेणेकरून तो अगदी स्थिर चालीने गोल-गोल फिरतो. एक विद्यार्थी आक्षेप घेतो: 'याची चाल कधी बदलत नाही, म्हणून त्वरण शून्य असेल.' विद्यार्थी का चुकतो?",
        },
        choices: [
          {
            en: "Acceleration is any change in velocity, and velocity includes direction. Going round a circle the direction turns every instant, so the velocity is always changing even at constant speed — the stone accelerates continuously, pulled toward the centre by the string",
            hi: "त्वरण वेग का कोई भी परिवर्तन है, और वेग में दिशा शामिल। वृत्त में घूमते दिशा हर क्षण मुड़ती, अतः स्थिर चाल पर भी वेग सदा बदलता — पत्थर निरंतर त्वरित, डोरी से केंद्र की ओर खिंचा",
            mr: "त्वरण वेगाचा कोणताही बदल आहे, आणि वेगात दिशा समाविष्ट. वर्तुळात फिरताना दिशा प्रत्येक क्षणी वळते, म्हणून स्थिर चालीवरही वेग सदैव बदलतो — दगड सतत त्वरित, दोरीने केंद्राकडे ओढलेला",
          },
          {
            en: "The student is right — steady speed does mean zero acceleration",
            hi: "छात्र सही — स्थिर चाल का अर्थ शून्य त्वरण ही है",
            mr: "विद्यार्थी बरोबर — स्थिर चाल म्हणजे शून्य त्वरणच",
          },
          {
            en: "The stone is accelerating only because it is slowly speeding up unnoticed",
            hi: "पत्थर त्वरित केवल इसलिए कि वह चुपके धीरे तेज़ हो रहा",
            mr: "दगड त्वरित फक्त म्हणून की तो गुपचूप हळू वेगवान होतोय",
          },
          {
            en: "Circular motion has no velocity at all, so acceleration cannot be defined",
            hi: "वृत्तीय गति में वेग होता ही नहीं, अतः त्वरण परिभाषित नहीं",
            mr: "वर्तुळाकार गतीत वेग असतोच नाही, म्हणून त्वरण व्याख्यित होत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has quietly swapped 'speed' for 'velocity', and the whole subtlety lives in that gap. Speed is just a number — how fast — and here it truly is constant. But acceleration is defined as the rate of change of VELOCITY, and velocity is a vector: it has both a size (the speed) and a direction. As the stone sweeps around the circle its direction of motion swings continuously — north, then east, then south, then west — so even though the length of the velocity arrow never changes, the arrow itself is forever turning. A changing velocity is, by definition, an acceleration, so the stone is accelerating at every instant. The acceleration points toward the centre of the circle (it is called centripetal, 'centre-seeking'), and it is supplied by the inward tension of the string. Cut the string and there is nothing left to keep turning the velocity, so the stone flies off in a straight line along the tangent. This is exactly why the Moon, circling Earth at near-steady speed, is nonetheless in constant free fall toward us — steady speed and zero acceleration are not the same claim.",
          hi: "छात्र ने चुपचाप 'चाल' को 'वेग' से बदल दिया, और पूरी सूक्ष्मता उसी अंतर में बसती। चाल मात्र संख्या — कितनी तेज़ — और यहाँ वह सचमुच नियत। पर त्वरण वेग के परिवर्तन की दर परिभाषित, और वेग सदिश: उसमें आकार (चाल) और दिशा दोनों। पत्थर वृत्त में घूमते उसकी गति की दिशा निरंतर घूमती — उत्तर, फिर पूर्व, फिर दक्षिण, फिर पश्चिम — अतः यद्यपि वेग-तीर की लंबाई कभी न बदले, तीर स्वयं सदा मुड़ता। बदलता वेग, परिभाषा से, त्वरण है, अतः पत्थर हर क्षण त्वरित। त्वरण वृत्त के केंद्र की ओर (अभिकेंद्री कहलाता, 'केंद्र-खोजी'), और उसे डोरी की भीतरी तनाव देती। डोरी काटो तो वेग मोड़ने को कुछ नहीं बचता, अतः पत्थर स्पर्शरेखा के साथ सीधी रेखा में उड़ता। ठीक इसीलिए चंद्रमा, पृथ्वी की लगभग-स्थिर चाल से परिक्रमा करता, फिर भी हमारी ओर निरंतर मुक्त-पतन में — स्थिर चाल और शून्य त्वरण एक दावा नहीं।",
          mr: "विद्यार्थ्याने गुपचूप 'चाल' 'वेगा'ने बदलली, आणि सारी सूक्ष्मता त्याच फटीत वसते. चाल नुसती संख्या — किती वेगाने — आणि इथे ती खरोखर स्थिर. पण त्वरण वेगाच्या बदलाचा दर व्याख्यित, आणि वेग सदिश: त्यात आकार (चाल) आणि दिशा दोन्ही. दगड वर्तुळात फिरताना त्याच्या गतीची दिशा सतत फिरते — उत्तर, मग पूर्व, मग दक्षिण, मग पश्चिम — म्हणून वेग-बाणाची लांबी कधी बदलली नाही तरी बाण स्वतः सदैव वळतो. बदलता वेग, व्याख्येनुसार, त्वरण आहे, म्हणून दगड प्रत्येक क्षणी त्वरित. त्वरण वर्तुळाच्या केंद्राकडे (अभिकेंद्री म्हणतात, 'केंद्र-शोधी'), आणि ते दोरीचा आतला ताण देतो. दोरी कापा तर वेग वळवायला काही उरत नाही, म्हणून दगड स्पर्शरेषेने सरळ रेषेत उडतो. नेमके म्हणूनच चंद्र, पृथ्वीभोवती जवळपास-स्थिर चालीने परिभ्रमण करत, तरी आपल्याकडे सतत मुक्त-पतनात — स्थिर चाल आणि शून्य त्वरण एकच दावा नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — Force and Laws of Motion (Newton's three laws)             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-force-laws-motion",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 9 — Force and Laws of Motion",
      hi: "अध्याय 9 — बल तथा गति के नियम",
      mr: "प्रकरण 9 — बल आणि गतीचे नियम",
    },
    name: {
      en: "Force and Laws of Motion",
      hi: "बल तथा गति के नियम",
      mr: "बल आणि गतीचे नियम",
    },
    summary: {
      en: "Newton's three laws read together: a body left alone keeps doing what it was doing, a force changes its momentum in proportion, and every push answers with an equal push back on another body — so in a closed system the total momentum is never spent.",
      hi: "न्यूटन के तीन नियम एक साथ: छोड़ा गया पिंड जो कर रहा था वही करता रहता, बल उसके संवेग को अनुपात में बदलता, और हर धक्का दूसरे पिंड पर बराबर धक्के से उत्तर देता — अतः बंद तंत्र में कुल संवेग कभी नहीं चुकता।",
      mr: "न्यूटनचे तीन नियम एकत्र: एकटा सोडलेला पिंड जे करत होता तेच करत राहतो, बल त्याचा संवेग प्रमाणात बदलते, आणि प्रत्येक धक्का दुसऱ्या पिंडावर समान धक्क्याने उत्तरतो — म्हणून बंद यंत्रणेत एकूण संवेग कधी संपत नाही.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "first-law",
        name: {
          en: "The first law and inertia",
          hi: "पहला नियम और जड़त्व",
          mr: "पहिला नियम आणि जडत्व",
        },
        kind: "law",
        prompt: {
          en: "A ball on a smooth floor rolls on and on, and a resting book never stirs by itself. Which law says a body keeps its state of rest or motion until a force changes it?",
          hi: "चिकने फ़र्श पर गेंद लुढ़कती ही जाती, और विश्रामी किताब स्वयं कभी नहीं हिलती। कौन-सा नियम कहता कि पिंड विराम या गति की अवस्था बनाए रखता जब तक बल न बदले?",
          mr: "गुळगुळीत जमिनीवर चेंडू लोटतच राहतो, आणि विश्रांत पुस्तक स्वतः कधी हलत नाही. कोणता नियम सांगतो की पिंड विश्रांती वा गतीची अवस्था राखतो जोवर बल बदलत नाही?",
        },
        statement: {
          en: "Newton's first law says a body stays at rest or in uniform straight-line motion unless a net external force acts — this reluctance to change is called inertia.",
          hi: "न्यूटन का पहला नियम कहता पिंड विराम या एकसमान सरल-रेखीय गति में रहता जब तक बाहरी नेट बल न लगे — बदलने की यही अनिच्छा जड़त्व कहलाती।",
          mr: "न्यूटनचा पहिला नियम सांगतो पिंड विश्रांती वा एकसमान सरळ-रेषीय गतीत राहतो जोवर बाह्य निव्वळ बल लागत नाही — बदलण्याची हीच अनिच्छा जडत्व म्हणतात.",
        },
        detail: {
          en: "It overturned the old belief that a force is needed to keep moving — on a frictionless floor, no force is needed at all, only to start or stop.",
          hi: "इसने पुरानी मान्यता उलटी कि चलते रहने को बल चाहिए — घर्षणहीन फ़र्श पर कोई बल नहीं चाहिए, केवल शुरू या रोकने को।",
          mr: "याने जुनी समजूत उलटवली की चालत राहायला बल हवे — घर्षणहीन जमिनीवर कोणतेही बल नको, फक्त सुरू वा थांबवायला.",
        },
        extra: {
          en: "Friction is exactly the hidden force that stops a real ball — remove it and the ball would roll forever, as the law promises.",
          hi: "घर्षण ठीक वह छिपा बल है जो असली गेंद को रोकता — हटाओ तो गेंद सदा लुढ़कती, जैसा नियम वादा करता।",
          mr: "घर्षण नेमके ते दडलेले बल जे खऱ्या चेंडूला थांबवते — काढा तर चेंडू सदैव लोटेल, जसे नियम वचन देतो.",
        },
        pair: {
          left: {
            en: "Keeps its state till a force acts",
            hi: "बल लगने तक अवस्था रखता",
            mr: "बल लागेपर्यंत अवस्था राखतो",
          },
          right: {
            en: "the first law (inertia)",
            hi: "पहला नियम (जड़त्व)",
            mr: "पहिला नियम (जडत्व)",
          },
        },
      },
      {
        id: "inertia-mass",
        name: {
          en: "Inertia and mass",
          hi: "जड़त्व और द्रव्यमान",
          mr: "जडत्व आणि वस्तुमान",
        },
        kind: "idea",
        prompt: {
          en: "A loaded truck is far harder to start or stop than a bicycle. What single property of a body measures how strongly it resists any change in its motion?",
          hi: "लदा ट्रक साइकिल से कहीं कठिन शुरू या रोकने में। किसी पिंड का कौन-सा एक गुण नापता कि वह अपनी गति में किसी परिवर्तन का कितना प्रबल विरोध करता?",
          mr: "भरलेला ट्रक सायकलीहून कितीतरी कठीण सुरू वा थांबवायला. एखाद्या पिंडाचा कोणता एक गुण मोजतो की तो आपल्या गतीतील कोणत्याही बदलाचा किती प्रबळ विरोध करतो?",
        },
        statement: {
          en: "The mass of a body is the measure of its inertia — the more mass, the harder it is to start, stop or turn, needing a greater force for the same change.",
          hi: "पिंड का द्रव्यमान उसके जड़त्व का माप है — जितना अधिक द्रव्यमान, उतना कठिन शुरू, रोकना या मोड़ना, उसी परिवर्तन को अधिक बल चाहिए।",
          mr: "पिंडाचे वस्तुमान त्याच्या जडत्वाचे माप आहे — जितके अधिक वस्तुमान, तितके कठीण सुरू, थांबवणे वा वळवणे, त्याच बदलाला अधिक बल हवे.",
        },
        detail: {
          en: "This is why a cricket ball, not a football, is chosen for a game of strength — its greater mass carries more inertia for the same size.",
          hi: "इसी से बल के खेल को क्रिकेट गेंद चुनी जाती, फुटबॉल नहीं — उसका अधिक द्रव्यमान उसी आकार में अधिक जड़त्व रखता।",
          mr: "म्हणूनच बळाच्या खेळाला क्रिकेट चेंडू निवडतात, फुटबॉल नाही — त्याचे अधिक वस्तुमान त्याच आकारात अधिक जडत्व राखते.",
        },
        extra: {
          en: "Mass here is not size: a small lead ball has more inertia than a big beach ball, because inertia rides on matter, not on volume.",
          hi: "यहाँ द्रव्यमान आकार नहीं: छोटी सीसे की गेंद बड़ी समुद्री गेंद से अधिक जड़त्व रखती, क्योंकि जड़त्व पदार्थ पर सवार, आयतन पर नहीं।",
          mr: "इथे वस्तुमान आकार नव्हे: लहान शिशाचा चेंडू मोठ्या समुद्री चेंडूहून अधिक जडत्व राखतो, कारण जडत्व पदार्थावर स्वार, घनफळावर नाही.",
        },
        pair: {
          left: {
            en: "Measures resistance to change of motion",
            hi: "गति-परिवर्तन का विरोध नापता",
            mr: "गती-बदलाचा विरोध मोजतो",
          },
          right: {
            en: "mass",
            hi: "द्रव्यमान",
            mr: "वस्तुमान",
          },
        },
      },
      {
        id: "momentum",
        name: { en: "Momentum", hi: "संवेग", mr: "संवेग" },
        kind: "idea",
        prompt: {
          en: "A slow lorry and a fast bullet can each flatten what they hit. Which quantity, made of mass times velocity, captures this 'quantity of motion' a body carries?",
          hi: "धीमी लॉरी और तेज़ गोली दोनों टकराए को कुचल सकतीं। कौन-सी राशि, द्रव्यमान गुणा वेग से बनी, पिंड की इस 'गति-मात्रा' को पकड़ती?",
          mr: "मंद लॉरी आणि वेगवान गोळी दोन्ही आदळलेल्याला चिरडू शकतात. कोणती राशी, वस्तुमान गुणिले वेग, पिंडाची ही 'गती-मात्रा' पकडते?",
        },
        statement: {
          en: "Momentum is mass times velocity — the 'quantity of motion' a body carries; it grows with either a heavier mass or a faster speed, and points along the velocity.",
          hi: "संवेग द्रव्यमान गुणा वेग है — पिंड की 'गति-मात्रा'; यह भारी द्रव्यमान या तेज़ चाल किसी से बढ़ता, और वेग की दिशा में होता।",
          mr: "संवेग वस्तुमान गुणिले वेग आहे — पिंडाची 'गती-मात्रा'; तो जड वस्तुमान वा वेगवान चाल कोणत्याही एकाने वाढतो, आणि वेगाच्या दिशेत असतो.",
        },
        detail: {
          en: "It explains why a light bullet is deadly and a drifting ship is unstoppable — one buys momentum with speed, the other with mass.",
          hi: "यह समझाता क्यों हल्की गोली घातक और बहता जहाज़ अजेय — एक चाल से संवेग खरीदता, दूसरा द्रव्यमान से।",
          mr: "हे समजावते का हलकी गोळी घातक आणि वाहते जहाज अजिंक्य — एक चालीने संवेग विकत घेतो, दुसरा वस्तुमानाने.",
        },
        extra: {
          en: "A karate blow works by changing momentum fast — the quicker the strike, the greater the force delivered.",
          hi: "कराटे का वार संवेग तेज़ी से बदलकर काम करता — जितना तेज़ प्रहार, उतना अधिक बल।",
          mr: "कराटेचा प्रहार संवेग वेगाने बदलून काम करतो — जितका जलद प्रहार, तितके अधिक बल.",
        },
        pair: {
          left: {
            en: "Mass times velocity",
            hi: "द्रव्यमान गुणा वेग",
            mr: "वस्तुमान गुणिले वेग",
          },
          right: {
            en: "momentum",
            hi: "संवेग",
            mr: "संवेग",
          },
        },
      },
      {
        id: "second-law",
        name: {
          en: "The second law",
          hi: "दूसरा नियम",
          mr: "दुसरा नियम",
        },
        kind: "law",
        prompt: {
          en: "Which law ties force to motion by saying the force on a body equals its mass times the acceleration it produces — the famous F = ma?",
          hi: "कौन-सा नियम बल को गति से जोड़ता यह कहकर कि पिंड पर बल उसके द्रव्यमान गुणा उत्पन्न त्वरण के बराबर — प्रसिद्ध F = ma?",
          mr: "कोणता नियम बलाला गतीशी जोडतो हे सांगून की पिंडावरचे बल त्याच्या वस्तुमान गुणिले घडवलेल्या त्वरणाइतके — प्रसिद्ध F = ma?",
        },
        statement: {
          en: "Newton's second law says the rate of change of momentum is proportional to the applied force, giving F = ma — a given force makes a lighter body accelerate more.",
          hi: "न्यूटन का दूसरा नियम कहता संवेग परिवर्तन की दर लगे बल के समानुपाती, देता F = ma — दिया बल हल्के पिंड को अधिक त्वरित करता।",
          mr: "न्यूटनचा दुसरा नियम सांगतो संवेग बदलाचा दर लावलेल्या बलाच्या समप्रमाणात, देतो F = ma — दिलेले बल हलक्या पिंडाला अधिक त्वरित करते.",
        },
        detail: {
          en: "It hides the first law inside it: put F = 0 and a = 0, so with no force there is no acceleration — the body's motion never changes.",
          hi: "यह पहला नियम अपने भीतर छिपाता: F = 0 रखो तो a = 0, अतः बल बिना कोई त्वरण नहीं — पिंड की गति कभी नहीं बदलती।",
          mr: "हे पहिला नियम आत लपवते: F = 0 ठेवा तर a = 0, म्हणून बलाविना कोणतेही त्वरण नाही — पिंडाची गती कधी बदलत नाही.",
        },
        extra: {
          en: "A cricketer draws his hands back while catching to stretch the time of stopping — same momentum change, longer time, so a gentler force on his palms.",
          hi: "क्रिकेटर कैच लेते हाथ पीछे खींचता ताकि रुकने का समय बढ़े — वही संवेग परिवर्तन, अधिक समय, अतः हथेली पर हल्का बल।",
          mr: "क्रिकेटपटू झेल घेताना हात मागे खेचतो जेणेकरून थांबण्याचा वेळ वाढतो — तोच संवेग बदल, अधिक वेळ, म्हणून तळहातावर सौम्य बल.",
        },
        pair: {
          left: {
            en: "Force equals mass times acceleration",
            hi: "बल = द्रव्यमान गुणा त्वरण",
            mr: "बल = वस्तुमान गुणिले त्वरण",
          },
          right: {
            en: "the second law",
            hi: "दूसरा नियम",
            mr: "दुसरा नियम",
          },
        },
      },
      {
        id: "third-law",
        name: {
          en: "The third law",
          hi: "तीसरा नियम",
          mr: "तिसरा नियम",
        },
        kind: "law",
        prompt: {
          en: "Push a wall and it pushes back; a swimmer shoves water back and is thrust forward. Which law says every action has an equal and opposite reaction?",
          hi: "दीवार धकेलो तो वह वापस धकेलती; तैराक पानी पीछे ढकेलता और आगे बढ़ता। कौन-सा नियम कहता हर क्रिया की बराबर और विपरीत प्रतिक्रिया?",
          mr: "भिंत ढकला तर ती परत ढकलते; पोहणारा पाणी मागे ढकलतो आणि पुढे सरकतो. कोणता नियम सांगतो प्रत्येक क्रियेला समान आणि विरुद्ध प्रतिक्रिया?",
        },
        statement: {
          en: "Newton's third law says every action has an equal and opposite reaction — but the two forces act on different bodies, so they never cancel each other.",
          hi: "न्यूटन का तीसरा नियम कहता हर क्रिया की बराबर और विपरीत प्रतिक्रिया — पर दोनों बल भिन्न पिंडों पर लगते, अतः वे कभी एक-दूसरे को रद्द नहीं करते।",
          mr: "न्यूटनचा तिसरा नियम सांगतो प्रत्येक क्रियेला समान आणि विरुद्ध प्रतिक्रिया — पण दोन्ही बले वेगळ्या पिंडांवर लागतात, म्हणून ती कधी एकमेकांना रद्द करत नाहीत.",
        },
        detail: {
          en: "It is why a gun kicks back, a boat slides away as you step off it, and a rocket climbs by throwing gas the other way.",
          hi: "इसी से बंदूक पीछे लात मारती, नाव तुम्हारे उतरते खिसकती, और रॉकेट गैस दूसरी ओर फेंककर चढ़ता।",
          mr: "म्हणूनच बंदूक मागे लाथ मारते, बोट तू उतरताना सरकते, आणि रॉकेट वायू दुसरीकडे फेकून चढते.",
        },
        extra: {
          en: "The forces are equal in size but the effects need not be — the same push barely moves the Earth yet flings you back off it.",
          hi: "बल आकार में बराबर पर प्रभाव बराबर हो ज़रूरी नहीं — वही धक्का पृथ्वी को मुश्किल से हिलाता पर तुम्हें उससे पीछे उछालता।",
          mr: "बले आकारात समान पण परिणाम समान असणे आवश्यक नाही — तोच धक्का पृथ्वीला कसाबसा हलवतो पण तुला तिच्यापासून मागे उडवतो.",
        },
        pair: {
          left: {
            en: "Equal, opposite, on two bodies",
            hi: "बराबर, विपरीत, दो पिंडों पर",
            mr: "समान, विरुद्ध, दोन पिंडांवर",
          },
          right: {
            en: "the third law",
            hi: "तीसरा नियम",
            mr: "तिसरा नियम",
          },
        },
      },
      {
        id: "conservation-momentum",
        name: {
          en: "Conservation of momentum",
          hi: "संवेग संरक्षण",
          mr: "संवेग संधारण",
        },
        kind: "law",
        prompt: {
          en: "When two skaters push apart, or a gun fires a bullet, the total 'quantity of motion' before and after stays the same. Which principle guarantees this?",
          hi: "जब दो स्केटर एक-दूसरे को धकेलते, या बंदूक गोली दागती, पहले और बाद की कुल 'गति-मात्रा' वही रहती। कौन-सा सिद्धांत इसकी गारंटी देता?",
          mr: "जेव्हा दोन स्केटर एकमेकांना ढकलतात, किंवा बंदूक गोळी झाडते, आधीची आणि नंतरची एकूण 'गती-मात्रा' तीच राहते. कोणते तत्त्व याची हमी देते?",
        },
        statement: {
          en: "The law of conservation of momentum says that with no outside force, the total momentum of a system is unchanged — what one part gains, another loses in equal measure.",
          hi: "संवेग संरक्षण का नियम कहता बाहरी बल बिना तंत्र का कुल संवेग अपरिवर्तित — एक भाग जो पाता, दूसरा बराबर खोता।",
          mr: "संवेग संधारणाचा नियम सांगतो बाह्य बलाविना यंत्रणेचा एकूण संवेग अपरिवर्तित — एक भाग जे मिळवतो, दुसरा समान गमावतो.",
        },
        detail: {
          en: "It follows straight from the third law: the equal-and-opposite forces give the two bodies equal-and-opposite momentum changes that cancel in the total.",
          hi: "यह सीधे तीसरे नियम से निकलता: बराबर-विपरीत बल दोनों पिंडों को बराबर-विपरीत संवेग परिवर्तन देते जो कुल में रद्द होते।",
          mr: "हे थेट तिसऱ्या नियमातून निघते: समान-विरुद्ध बले दोन्ही पिंडांना समान-विरुद्ध संवेग बदल देतात जे एकूणात रद्द होतात.",
        },
        extra: {
          en: "A firing gun stays a still system: the bullet's forward momentum is matched exactly by the gun's backward recoil, so the two sum to the zero they started at.",
          hi: "दागती बंदूक स्थिर तंत्र रहती: गोली का अगला संवेग ठीक बंदूक के पिछले प्रतिक्षेप से मेल खाता, अतः दोनों उसी शून्य में जुड़ते जहाँ शुरू किया।",
          mr: "झाडणारी बंदूक स्थिर यंत्रणा राहते: गोळीचा पुढचा संवेग नेमका बंदुकीच्या मागच्या प्रतिक्षेपाशी जुळतो, म्हणून दोन्ही त्याच शून्यात मिळतात जिथे सुरू केले.",
        },
        pair: {
          left: {
            en: "Total motion unchanged without outside force",
            hi: "बाहरी बल बिना कुल गति अपरिवर्तित",
            mr: "बाह्य बलाविना एकूण गती अपरिवर्तित",
          },
          right: {
            en: "conservation of momentum",
            hi: "संवेग संरक्षण",
            mr: "संवेग संधारण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Standing in a moving bus, passengers lurch forward the instant the driver brakes hard, and are thrown backward the instant it accelerates from a stop. Which idea explains both jerks at once?",
          hi: "चलती बस में खड़े यात्री, ड्राइवर के ज़ोर से ब्रेक लगाते ही आगे झुक जाते, और रुकी बस के चल पड़ते ही पीछे फेंके जाते। कौन-सा विचार दोनों झटके एक साथ समझाता?",
          mr: "चालत्या बसमध्ये उभे प्रवासी, चालकाने जोरात ब्रेक लावताच पुढे झुकतात, आणि थांबलेली बस निघताच मागे फेकले जातात. कोणती कल्पना दोन्ही झटके एकाच वेळी समजावते?",
        },
        choices: [
          {
            en: "Inertia: the passenger's body keeps doing what it was doing. When the bus brakes, the body keeps moving forward; when the bus starts, the body tries to stay at rest, so it is left behind",
            hi: "जड़त्व: यात्री का शरीर जो कर रहा था वही करता रहता। बस ब्रेक करती तो शरीर आगे बढ़ता रहता; बस चलती तो शरीर विराम में रहना चाहता, अतः पीछे छूट जाता",
            mr: "जडत्व: प्रवाशाचे शरीर जे करत होते तेच करत राहते. बस ब्रेक करते तेव्हा शरीर पुढे सरकत राहते; बस निघते तेव्हा शरीर विश्रांतीत राहू पाहते, म्हणून मागे राहते",
          },
          {
            en: "The bus floor pushes the passengers deliberately in each case",
            hi: "बस का फ़र्श हर बार यात्रियों को जान-बूझकर धकेलता",
            mr: "बसची जमीन प्रत्येक वेळी प्रवाशांना मुद्दाम ढकलते",
          },
          {
            en: "Gravity suddenly changes direction when the bus speeds up or slows",
            hi: "बस तेज़ या धीमी होने पर गुरुत्व अचानक दिशा बदलता",
            mr: "बस वेगवान वा मंद होताना गुरुत्व अचानक दिशा बदलते",
          },
          {
            en: "The passengers weigh more while the bus is braking",
            hi: "ब्रेक लगते यात्रियों का वज़न बढ़ जाता",
            mr: "ब्रेक लागताना प्रवाशांचे वजन वाढते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both jerks are inertia — the body's stubborn tendency to keep its own state of motion, quite separate from the bus's. While the bus rolls, you and the bus share the same forward velocity. When the driver brakes, a force acts on the BUS through its wheels and slows it, but no such backward force acts on your upper body; by the first law it keeps moving forward at the old speed, and so you pitch forward relative to the slowing bus. The start is the mirror image: the stationary bus suddenly accelerates, a force drives the bus forward, but your body, obeying its inertia of rest, tries to stay put — so the bus moves out from under you and you are thrown backward. In both cases nothing actively pushes you; you are simply the part of the system that no force reached in time, left doing what you were already doing. It is the very reason buses ask you to hold the rail — the rail supplies the missing force to bring your body along with the vehicle.",
          hi: "दोनों झटके जड़त्व हैं — शरीर की अपनी गति-अवस्था बनाए रखने की ज़िद, बस से बिलकुल अलग। बस चलते तुम और बस वही अगला वेग साझा करते। ड्राइवर ब्रेक करता तो बल पहियों से बस पर लगता और उसे धीमा करता, पर तुम्हारे ऊपरी शरीर पर ऐसा पिछला बल नहीं; पहले नियम से वह पुरानी चाल से आगे बढ़ता रहता, अतः तुम धीमी होती बस के सापेक्ष आगे झुकते। शुरुआत दर्पण-छवि: रुकी बस अचानक त्वरित होती, बल बस को आगे ले जाता, पर तुम्हारा शरीर, विराम-जड़त्व मानते, टिका रहना चाहता — अतः बस तुम्हारे नीचे से निकल जाती और तुम पीछे फेंके जाते। दोनों में कुछ तुम्हें सक्रिय नहीं धकेलता; तुम बस वह भाग हो जिस तक कोई बल समय पर नहीं पहुँचा, जो पहले कर रहे थे वही करते। यही कारण बसें रेलिंग पकड़ने को कहतीं — रेलिंग गुम बल देती कि तुम्हारा शरीर वाहन के संग आए।",
          mr: "दोन्ही झटके जडत्व आहेत — शरीराची स्वतःची गती-अवस्था राखण्याची हट्टीपणा, बसपासून अगदी वेगळी. बस चालताना तू आणि बस तोच पुढचा वेग वाटतात. चालक ब्रेक करतो तेव्हा बल चाकांतून बसवर लागते आणि तिला मंदावते, पण तुझ्या वरच्या शरीरावर असे मागचे बल नाही; पहिल्या नियमाने ते जुन्या चालीने पुढे सरकत राहते, म्हणून तू मंदावणाऱ्या बसच्या सापेक्ष पुढे झुकतोस. सुरुवात आरशातली प्रतिमा: थांबलेली बस अचानक त्वरित होते, बल बसला पुढे नेते, पण तुझे शरीर, विश्रांती-जडत्व मानत, टिकून राहू पाहते — म्हणून बस तुझ्या खालून निघते आणि तू मागे फेकला जातोस. दोन्हींत काही तुला सक्रियपणे ढकलत नाही; तू फक्त तो भाग आहेस ज्यापर्यंत कोणतेही बल वेळेत पोहोचले नाही, जे आधी करत होतास तेच करत. हेच कारण बसा रेलिंग धरायला सांगतात — रेलिंग हरवलेले बल देते जेणेकरून तुझे शरीर वाहनासोबत येते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A rifle of mass 4 kg fires a 20 g bullet, and the rifle kicks back into the shooter's shoulder. A student asks: 'If the action and reaction forces are equal, why does the tiny bullet fly out fast while the heavy rifle barely moves?'",
          hi: "4 किग्रा की राइफ़ल 20 ग्राम की गोली दागती, और राइफ़ल निशानेबाज़ के कंधे में पीछे लात मारती। एक छात्र पूछता: 'यदि क्रिया-प्रतिक्रिया बल बराबर हैं, तो नन्ही गोली तेज़ उड़ती जबकि भारी राइफ़ल मुश्किल से हिलती क्यों?'",
          mr: "4 किलोची रायफल 20 ग्रॅमची गोळी झाडते, आणि रायफल नेमबाजाच्या खांद्यात मागे लाथ मारते. एक विद्यार्थी विचारतो: 'क्रिया-प्रतिक्रिया बले समान असतील, तर इवली गोळी वेगाने उडते तर जड रायफल कशीबशी हलते का?'",
        },
        choices: [
          {
            en: "By conservation of momentum the two gain equal and opposite momentum, but momentum is mass × velocity: the light bullet needs a huge velocity to carry the same momentum the heavy rifle carries at a small recoil velocity",
            hi: "संवेग संरक्षण से दोनों बराबर-विपरीत संवेग पाते, पर संवेग द्रव्यमान × वेग है: हल्की गोली को उतना ही संवेग ढोने को विशाल वेग चाहिए जो भारी राइफ़ल छोटे प्रतिक्षेप-वेग पर ढोती",
            mr: "संवेग संधारणाने दोन्ही समान-विरुद्ध संवेग मिळवतात, पण संवेग वस्तुमान × वेग आहे: हलक्या गोळीला तेवढाच संवेग वाहायला प्रचंड वेग हवा जो जड रायफल लहान प्रतिक्षेप-वेगावर वाहते",
          },
          {
            en: "The reaction force on the rifle is actually much smaller than the action on the bullet",
            hi: "राइफ़ल पर प्रतिक्रिया बल गोली पर क्रिया से वास्तव में बहुत छोटा",
            mr: "रायफलवरचे प्रतिक्रिया बल गोळीवरच्या क्रियेहून खरे तर खूप लहान",
          },
          {
            en: "The bullet is faster only because gunpowder pushes it and nothing pushes the rifle",
            hi: "गोली तेज़ केवल इसलिए कि बारूद उसे धकेलता और राइफ़ल को कुछ नहीं",
            mr: "गोळी वेगवान फक्त म्हणून की दारू तिला ढकलते आणि रायफलला काही नाही",
          },
          {
            en: "Momentum is not conserved when a gun is fired",
            hi: "बंदूक दागते संवेग संरक्षित नहीं रहता",
            mr: "बंदूक झाडताना संवेग संधारित राहत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The forces really are equal and opposite — that part of the third law holds exactly — but 'equal force' does not mean 'equal effect', and the difference is all about mass. Before firing, the gun-and-bullet system is at rest, so its total momentum is zero. The explosion drives them apart with equal and opposite forces for the same brief instant, so each gains the same size of momentum, one forward and one backward, and the two still sum to zero. But momentum is mass × velocity. The bullet's mass is a mere 0.02 kg against the rifle's 4 kg — two hundred times lighter. To carry the same momentum on a two-hundred-times-smaller mass, the bullet must move two hundred times faster: if the rifle recoils at, say, 2 m/s, the bullet leaves at about 400 m/s. So the shared momentum is split fairly, but the shared velocity is not — the light body races off while the heavy body barely stirs. The same logic launches a rocket (hot gas thrown down at speed, rocket eased up) and slides a boat back as you leap forward off it: equal momentum, wildly unequal speeds, because inertia hoards the motion in whatever has the greater mass.",
          hi: "बल सचमुच बराबर-विपरीत हैं — तीसरे नियम का वह अंश ठीक टिकता — पर 'बराबर बल' का अर्थ 'बराबर प्रभाव' नहीं, और अंतर पूरा द्रव्यमान का। दागने से पहले बंदूक-गोली तंत्र विराम में, अतः कुल संवेग शून्य। विस्फोट उन्हें बराबर-विपरीत बलों से उसी क्षण अलग करता, अतः हर एक बराबर आकार का संवेग पाता, एक आगे एक पीछे, और दोनों फिर शून्य में जुड़ते। पर संवेग द्रव्यमान × वेग है। गोली का द्रव्यमान मात्र 0.02 किग्रा राइफ़ल के 4 किग्रा के आगे — दो सौ गुना हल्का। दो सौ गुना छोटे द्रव्यमान पर उतना संवेग ढोने को गोली को दो सौ गुना तेज़ चलना होगा: राइफ़ल यदि 2 मी/से पीछे हटे, गोली लगभग 400 मी/से निकलती। अतः साझा संवेग न्यायपूर्ण बँटता, पर साझा वेग नहीं — हल्का पिंड दौड़ता जबकि भारी मुश्किल से हिलता। यही तर्क रॉकेट छोड़ता (गरम गैस तेज़ी से नीचे फेंकी, रॉकेट ऊपर) और नाव को पीछे खिसकाता जैसे तुम आगे कूदते: बराबर संवेग, बेहद असमान चाल, क्योंकि जड़त्व गति को उसमें जमा करता जिसका द्रव्यमान अधिक।",
          mr: "बले खरोखर समान-विरुद्ध आहेत — तिसऱ्या नियमाचा तो भाग नेमका टिकतो — पण 'समान बल' म्हणजे 'समान परिणाम' नव्हे, आणि फरक सारा वस्तुमानाचा. झाडण्यापूर्वी बंदूक-गोळी यंत्रणा विश्रांतीत, म्हणून एकूण संवेग शून्य. स्फोट त्यांना समान-विरुद्ध बलांनी त्याच क्षणी वेगळे करतो, म्हणून प्रत्येक समान आकाराचा संवेग मिळवतो, एक पुढे एक मागे, आणि दोन्ही पुन्हा शून्यात मिळतात. पण संवेग वस्तुमान × वेग आहे. गोळीचे वस्तुमान नुसते 0.02 किलो रायफलच्या 4 किलोपुढे — दोनशे पट हलके. दोनशे पट लहान वस्तुमानावर तेवढा संवेग वाहायला गोळीला दोनशे पट वेगाने चालावे लागेल: रायफल जर 2 मी/से मागे हटली, गोळी सुमारे 400 मी/से निघते. म्हणून वाटलेला संवेग न्याय्यपणे विभागतो, पण वाटलेला वेग नाही — हलका पिंड धावतो तर जड कसाबसा हलतो. हेच तर्कशास्त्र रॉकेट सोडते (गरम वायू वेगाने खाली फेकला, रॉकेट वर) आणि बोट मागे सरकवते जसे तू पुढे उडी मारतोस: समान संवेग, प्रचंड असमान वेग, कारण जडत्व गती त्यात साठवते ज्याचे वस्तुमान अधिक.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 10 — Gravitation (the universal pull, and floating)            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-gravitation",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 10 — Gravitation",
      hi: "अध्याय 10 — गुरुत्वाकर्षण",
      mr: "प्रकरण 10 — गुरुत्वाकर्षण",
    },
    name: {
      en: "Gravitation",
      hi: "गुरुत्वाकर्षण",
      mr: "गुरुत्वाकर्षण",
    },
    summary: {
      en: "One law reaches from the falling apple to the orbiting Moon: every mass pulls every other. It gives all objects the same fall, splits the steady mass from the place-dependent weight, and — through Archimedes' upthrust — lets a steel ship float where a nail sinks.",
      hi: "एक नियम गिरते सेब से परिक्रमा करते चंद्रमा तक पहुँचता: हर द्रव्यमान हर दूसरे को खींचता। यह सब वस्तुओं को एक-सा गिराता, स्थिर द्रव्यमान को स्थान-निर्भर भार से अलगाता, और — आर्किमिडीज़ के उत्प्लावन से — इस्पात-जहाज़ को वहाँ तैराता जहाँ कील डूबती।",
      mr: "एक नियम पडणाऱ्या सफरचंदापासून परिभ्रमण करणाऱ्या चंद्रापर्यंत पोहोचतो: प्रत्येक वस्तुमान प्रत्येक दुसऱ्याला ओढते. तो सर्व वस्तूंना सारखे पाडतो, स्थिर वस्तुमानाला स्थान-अवलंबी भारापासून वेगळे करतो, आणि — आर्किमिडीजच्या उत्प्रणोदाने — पोलादी जहाजाला तिथे तरंगवतो जिथे खिळा बुडतो.",
    },
    position: 10,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "universal-gravitation",
        name: {
          en: "Universal gravitation",
          hi: "सार्वत्रिक गुरुत्वाकर्षण",
          mr: "वैश्विक गुरुत्वाकर्षण",
        },
        kind: "law",
        prompt: {
          en: "What one law says that every object in the universe pulls every other, with a force that grows with their masses and fades with the square of their distance?",
          hi: "कौन-सा एक नियम कहता कि ब्रह्मांड की हर वस्तु हर दूसरी को खींचती, ऐसे बल से जो उनके द्रव्यमानों से बढ़ता और दूरी के वर्ग से घटता?",
          mr: "कोणता एक नियम सांगतो की विश्वातील प्रत्येक वस्तू प्रत्येक दुसरीला ओढते, अशा बलाने जे त्यांच्या वस्तुमानांनी वाढते आणि अंतराच्या वर्गाने घटते?",
        },
        statement: {
          en: "Newton's law of universal gravitation says every mass attracts every other with a force proportional to the product of their masses and inversely to the square of the distance between them.",
          hi: "न्यूटन का सार्वत्रिक गुरुत्वाकर्षण नियम कहता हर द्रव्यमान हर दूसरे को खींचता ऐसे बल से जो उनके द्रव्यमानों के गुणनफल के समानुपाती और उनके बीच दूरी के वर्ग के व्युत्क्रमानुपाती।",
          mr: "न्यूटनचा वैश्विक गुरुत्वाकर्षण नियम सांगतो प्रत्येक वस्तुमान प्रत्येक दुसऱ्याला ओढते अशा बलाने जे त्यांच्या वस्तुमानांच्या गुणाकाराशी समप्रमाणात आणि त्यांच्यातील अंतराच्या वर्गाशी व्यस्तप्रमाणात.",
        },
        detail: {
          en: "The same pull that drops an apple holds the Moon in its orbit — Newton's leap was to see the two as one force reaching across space.",
          hi: "वही खिंचाव जो सेब गिराता चंद्रमा को कक्षा में थामता — न्यूटन की छलाँग दोनों को अंतरिक्ष में पहुँचता एक बल देखना थी।",
          mr: "तीच ओढ जी सफरचंद पाडते चंद्राला कक्षेत धरते — न्यूटनची झेप दोन्हींना अवकाशात पोहोचणारे एक बल पाहणे होती.",
        },
        extra: {
          en: "Being inverse-square, doubling the distance does not halve the pull but quarters it — the reach weakens fast.",
          hi: "व्युत्क्रम-वर्ग होने से दूरी दुगुनी करने पर खिंचाव आधा नहीं चौथाई होता — पहुँच तेज़ी से कमज़ोर।",
          mr: "व्यस्त-वर्ग असल्याने अंतर दुप्पट केल्यास ओढ अर्धी नव्हे चतुर्थांश होते — पोहोच वेगाने कमजोर.",
        },
        pair: {
          left: {
            en: "Every mass pulls every other, inverse-square",
            hi: "हर द्रव्यमान हर को खींचे, व्युत्क्रम-वर्ग",
            mr: "प्रत्येक वस्तुमान प्रत्येकाला ओढे, व्यस्त-वर्ग",
          },
          right: {
            en: "universal gravitation",
            hi: "सार्वत्रिक गुरुत्वाकर्षण",
            mr: "वैश्विक गुरुत्वाकर्षण",
          },
        },
      },
      {
        id: "free-fall-g",
        name: {
          en: "Free fall and g",
          hi: "मुक्त पतन और g",
          mr: "मुक्त पतन आणि g",
        },
        kind: "idea",
        prompt: {
          en: "Drop a coin and a feather together in a tube emptied of air, and they hit the bottom at the very same instant. What fact about gravity's acceleration does this reveal?",
          hi: "हवा निकाली नली में सिक्का और पंख साथ गिराओ, वे ठीक उसी क्षण तल छूते। यह गुरुत्व-त्वरण के बारे में कौन-सा तथ्य उजागर करता?",
          mr: "हवा काढलेल्या नळीत नाणे आणि पीस एकत्र टाका, ते नेमके त्याच क्षणी तळ स्पर्शतात. हे गुरुत्व-त्वरणाबद्दल कोणते तथ्य उघड करते?",
        },
        statement: {
          en: "Under gravity alone, all bodies fall with the same acceleration g (about 9.8 m/s²) regardless of their mass — heavy and light drop together when air is removed.",
          hi: "केवल गुरुत्व में सब पिंड एक-से त्वरण g (लगभग 9.8 मी/से²) से गिरते चाहे द्रव्यमान कुछ भी — हवा हटाने पर भारी-हल्के साथ गिरते।",
          mr: "फक्त गुरुत्वात सर्व पिंड सारख्या त्वरण g (सुमारे 9.8 मी/से²) ने पडतात वस्तुमान कितीही असो — हवा काढल्यावर जड-हलके एकत्र पडतात.",
        },
        detail: {
          en: "In everyday air a feather drifts only because air resistance holds it back — the pull of gravity itself never plays favourites by weight.",
          hi: "रोज़ की हवा में पंख केवल इसलिए तैरता कि वायु-प्रतिरोध उसे रोकता — गुरुत्व का खिंचाव स्वयं भार से पक्षपात नहीं करता।",
          mr: "रोजच्या हवेत पीस फक्त म्हणून तरंगते की हवा-रोध त्याला अडवतो — गुरुत्वाची ओढ स्वतः भाराने पक्षपात करत नाही.",
        },
        extra: {
          en: "Astronauts proved it on the airless Moon, dropping a hammer and a feather side by side — they landed together.",
          hi: "अंतरिक्षयात्रियों ने हवाहीन चंद्रमा पर सिद्ध किया, हथौड़ा और पंख साथ गिराकर — वे साथ उतरे।",
          mr: "अंतराळवीरांनी हवाहीन चंद्रावर सिद्ध केले, हातोडा आणि पीस शेजारी टाकून — ते एकत्र उतरले.",
        },
        pair: {
          left: {
            en: "Same acceleration for every mass",
            hi: "हर द्रव्यमान को एक-सा त्वरण",
            mr: "प्रत्येक वस्तुमानाला सारखे त्वरण",
          },
          right: {
            en: "free fall (g)",
            hi: "मुक्त पतन (g)",
            mr: "मुक्त पतन (g)",
          },
        },
      },
      {
        id: "mass-weight",
        name: {
          en: "Mass versus weight",
          hi: "द्रव्यमान बनाम भार",
          mr: "वस्तुमान विरुद्ध भार",
        },
        kind: "idea",
        prompt: {
          en: "An astronaut's 60 kg of matter is unchanged on the Moon, yet there she feels only a sixth as heavy. Which quantity stays fixed everywhere, and which shrinks with weaker gravity?",
          hi: "अंतरिक्षयात्री का 60 किग्रा पदार्थ चंद्रमा पर अपरिवर्तित, फिर भी वहाँ वह छठाई ही भारी लगती। कौन-सी राशि हर जगह नियत रहती, और कौन-सी कमज़ोर गुरुत्व से घटती?",
          mr: "अंतराळवीराचे 60 किलो पदार्थ चंद्रावर अपरिवर्तित, तरी तिथे ती फक्त षष्टांश जड वाटते. कोणती राशी सर्वत्र स्थिर राहते, आणि कोणती कमजोर गुरुत्वाने घटते?",
        },
        statement: {
          en: "Mass is the fixed amount of matter in a body, the same everywhere; weight is the pull of gravity on it, weight = mass × g, and it changes wherever g changes.",
          hi: "द्रव्यमान पिंड में पदार्थ की नियत मात्रा, हर जगह वही; भार उस पर गुरुत्व का खिंचाव, भार = द्रव्यमान × g, और जहाँ g बदले वहाँ बदलता।",
          mr: "वस्तुमान पिंडातील पदार्थाची स्थिर मात्रा, सर्वत्र तीच; भार त्यावरची गुरुत्वाची ओढ, भार = वस्तुमान × g, आणि जिथे g बदलतो तिथे बदलतो.",
        },
        detail: {
          en: "On the Moon g is about one-sixth of Earth's, so the same person weighs a sixth as much yet carries exactly the same mass of matter.",
          hi: "चंद्रमा पर g पृथ्वी के लगभग छठे भाग, अतः वही व्यक्ति छठाई भार रखती फिर भी ठीक वही द्रव्यमान।",
          mr: "चंद्रावर g पृथ्वीच्या सुमारे षष्टांश, म्हणून तीच व्यक्ती षष्टांश भार राखते तरी नेमके तेच वस्तुमान.",
        },
        extra: {
          en: "This is why a balance that compares masses reads the same on the Moon, but a spring scale that measures pull would read only a sixth.",
          hi: "इसी से द्रव्यमान तुलती तराज़ू चंद्रमा पर वही पढ़ती, पर खिंचाव नापता कमानी-काँटा केवल छठाई पढ़ता।",
          mr: "म्हणूनच वस्तुमान तुलणारा तराजू चंद्रावर तेच वाचतो, पण ओढ मोजणारा स्प्रिंग-काटा फक्त षष्टांश वाचतो.",
        },
        pair: {
          left: {
            en: "Changes with g from place to place",
            hi: "स्थान-दर-स्थान g से बदलता",
            mr: "स्थानोस्थान g ने बदलतो",
          },
          right: {
            en: "weight",
            hi: "भार",
            mr: "भार",
          },
        },
      },
      {
        id: "thrust-pressure",
        name: {
          en: "Thrust and pressure",
          hi: "प्रणोद और दाब",
          mr: "प्रणोद आणि दाब",
        },
        kind: "idea",
        prompt: {
          en: "A sharp nail pierces wood at a tap, but its blunt head does not, though the same force pushes both. Which quantity, force spread over area, explains the difference?",
          hi: "तेज़ कील एक ठोक में लकड़ी बेधती, पर उसका कुंद सिरा नहीं, यद्यपि वही बल दोनों को धकेलता। कौन-सी राशि, क्षेत्रफल पर फैला बल, अंतर समझाती?",
          mr: "टोकदार खिळा एका ठोक्यात लाकूड भेदतो, पण त्याचे बोथट टोक नाही, जरी तेच बल दोन्हींना ढकलते. कोणती राशी, क्षेत्रफळावर पसरलेले बल, फरक समजावते?",
        },
        statement: {
          en: "Pressure is the force acting on each unit of area — the same thrust concentrated on a smaller area gives a greater pressure, which is why a sharp point cuts.",
          hi: "दाब प्रति एकांक क्षेत्रफल पर लगता बल है — वही प्रणोद छोटे क्षेत्रफल पर केंद्रित अधिक दाब देता, इसी से तेज़ नोक काटती।",
          mr: "दाब प्रति एकक क्षेत्रफळावर लागणारे बल आहे — तोच प्रणोद लहान क्षेत्रफळावर केंद्रित अधिक दाब देतो, म्हणूनच टोकदार टोक कापते.",
        },
        detail: {
          en: "It is why a camel's broad foot does not sink in sand while a stiletto heel would — the same weight, spread wide or squeezed narrow.",
          hi: "इसी से ऊँट का चौड़ा पैर रेत में नहीं धँसता जबकि पतली एड़ी धँसती — वही भार, चौड़ा फैला या सँकरा दबा।",
          mr: "म्हणूनच उंटाचा रुंद पाय वाळूत रुतत नाही तर बारीक टाच रुतते — तेच भार, रुंद पसरलेले वा अरुंद दाबलेले.",
        },
        extra: {
          en: "A fluid presses too, and its pressure grows with depth — which is why a dam is built thick at its base where the water pushes hardest.",
          hi: "तरल भी दबाता, और उसका दाब गहराई से बढ़ता — इसी से बाँध तल पर मोटा बनाया जाता जहाँ पानी सबसे ज़ोर दबाता।",
          mr: "द्रवही दाबतो, आणि त्याचा दाब खोलीने वाढतो — म्हणूनच धरण तळाशी जाड बांधतात जिथे पाणी सर्वांत जोरात दाबते.",
        },
        pair: {
          left: {
            en: "Force per unit area",
            hi: "प्रति एकांक क्षेत्रफल बल",
            mr: "प्रति एकक क्षेत्रफळ बल",
          },
          right: {
            en: "pressure",
            hi: "दाब",
            mr: "दाब",
          },
        },
      },
      {
        id: "buoyancy",
        name: {
          en: "Buoyancy and Archimedes",
          hi: "उत्प्लावन और आर्किमिडीज़",
          mr: "उत्प्रणोद आणि आर्किमिडीज",
        },
        kind: "idea",
        prompt: {
          en: "A bucket of water feels lighter to lift while it is still under the pond's surface. Which upward push from a fluid, equal to the weight of fluid pushed aside, causes this?",
          hi: "पानी की बाल्टी तालाब की सतह के नीचे रहते उठाने में हल्की लगती। तरल का कौन-सा ऊपरी धक्का, हटाए तरल के भार के बराबर, यह करता?",
          mr: "पाण्याची बादली तळ्याच्या पृष्ठाखाली असताना उचलायला हलकी वाटते. द्रवाचा कोणता वरचा धक्का, बाजूला केलेल्या द्रवाच्या भाराइतका, हे घडवतो?",
        },
        statement: {
          en: "Buoyancy is the upward push a fluid gives any object dipped in it; by Archimedes' principle that upthrust equals the weight of the fluid the object displaces.",
          hi: "उत्प्लावन तरल में डुबोई किसी वस्तु को तरल का ऊपरी धक्का है; आर्किमिडीज़ के सिद्धांत से वह उत्प्लावन वस्तु द्वारा हटाए तरल के भार के बराबर।",
          mr: "उत्प्रणोद द्रवात बुडवलेल्या कोणत्याही वस्तूला द्रवाचा वरचा धक्का आहे; आर्किमिडीजच्या तत्त्वाने तो उत्प्रणोद वस्तूने बाजूला केलेल्या द्रवाच्या भाराइतका.",
        },
        detail: {
          en: "It is why you feel lighter in a swimming pool and why a stone, heavy in air, is easy to lift while under water.",
          hi: "इसी से तुम तरणताल में हल्के लगते और हवा में भारी पत्थर पानी के नीचे उठाना आसान।",
          mr: "म्हणूनच तू पोहण्याच्या तलावात हलका वाटतोस आणि हवेत जड दगड पाण्याखाली उचलणे सोपे.",
        },
        extra: {
          en: "Archimedes is said to have found it in his bath, watching the water rise, and run out crying 'Eureka!' — 'I have found it.'",
          hi: "कहते आर्किमिडीज़ ने इसे अपने स्नान में पाया, पानी चढ़ता देखकर, और 'यूरेका!' — 'मैंने पा लिया' — चिल्लाता दौड़ा।",
          mr: "म्हणतात आर्किमिडीजने हे आपल्या आंघोळीत शोधले, पाणी चढताना पाहून, आणि 'युरेका!' — 'मला सापडले' — ओरडत धावला.",
        },
        pair: {
          left: {
            en: "Upthrust equals weight of fluid displaced",
            hi: "उत्प्लावन = हटाए तरल का भार",
            mr: "उत्प्रणोद = बाजूला केलेल्या द्रवाचे भार",
          },
          right: {
            en: "Archimedes' principle",
            hi: "आर्किमिडीज़ का सिद्धांत",
            mr: "आर्किमिडीजचे तत्त्व",
          },
        },
      },
      {
        id: "density-floating",
        name: {
          en: "Density and floating",
          hi: "घनत्व और तैरना",
          mr: "घनता आणि तरंगणे",
        },
        kind: "idea",
        prompt: {
          en: "A solid iron nail sinks in water, yet iron ships weighing thousands of tonnes float. Which single property, comparing an object's packing to water's, decides whether it floats or sinks?",
          hi: "ठोस लोहे की कील पानी में डूबती, फिर भी हज़ारों टन के लोहे-जहाज़ तैरते। कौन-सा एक गुण, वस्तु की सघनता की पानी से तुलना, तय करता तैरे या डूबे?",
          mr: "घन लोखंडी खिळा पाण्यात बुडतो, तरी हजारो टनांची लोखंडी जहाजे तरंगतात. कोणता एक गुण, वस्तूच्या घट्टपणाची पाण्याशी तुलना, ठरवतो तरंगेल की बुडेल?",
        },
        statement: {
          en: "Density is mass packed into each unit of volume; an object floats if its average density is less than the fluid's, and sinks if it is more.",
          hi: "घनत्व प्रति एकांक आयतन में भरा द्रव्यमान है; वस्तु तैरती यदि उसका औसत घनत्व तरल से कम, डूबती यदि अधिक।",
          mr: "घनता प्रति एकक घनफळात भरलेले वस्तुमान आहे; वस्तू तरंगते जर तिची सरासरी घनता द्रवाहून कमी, बुडते जर अधिक.",
        },
        detail: {
          en: "A ship floats because its hull is mostly hollow air, dropping its average density below water's even though iron itself is far denser.",
          hi: "जहाज़ तैरता क्योंकि उसका पतवारा अधिकतर खोखली हवा, उसका औसत घनत्व पानी से नीचे गिराता यद्यपि लोहा स्वयं कहीं सघन।",
          mr: "जहाज तरंगते कारण त्याचा तळ बहुतांश पोकळ हवा, त्याची सरासरी घनता पाण्याखाली आणते जरी लोखंड स्वतः कितीतरी घन.",
        },
        extra: {
          en: "The same trick floats you more easily in the salty Dead Sea — dissolved salt makes the water denser than your body.",
          hi: "वही चाल तुम्हें खारे मृत सागर में आसान तैराती — घुला नमक पानी को तुम्हारे शरीर से सघन बनाता।",
          mr: "तीच युक्ती तुला खाऱ्या मृत समुद्रात सहज तरंगवते — विरघळलेले मीठ पाण्याला तुझ्या शरीराहून घन बनवते.",
        },
        pair: {
          left: {
            en: "Floats when lighter than its own volume of water",
            hi: "अपने आयतन के पानी से हल्का हो तो तैरे",
            mr: "स्वतःच्या घनफळाच्या पाण्याहून हलके तर तरंगे",
          },
          right: {
            en: "lower density",
            hi: "कम घनत्व",
            mr: "कमी घनता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "On Earth a hammer thumps down long before a feather flutters to the floor, yet on the airless Moon an astronaut drops both together and they land at the very same moment. What does the Moon experiment prove about gravity?",
          hi: "पृथ्वी पर हथौड़ा पंख के फ़र्श तक फड़फड़ाने से बहुत पहले धम्म गिरता, फिर भी हवाहीन चंद्रमा पर अंतरिक्षयात्री दोनों साथ गिराता और वे ठीक उसी क्षण उतरते। चंद्र-प्रयोग गुरुत्व के बारे में क्या सिद्ध करता?",
          mr: "पृथ्वीवर हातोडा पिसाच्या जमिनीपर्यंत फडफडण्याआधी खूप आधी धाडकन पडतो, तरी हवाहीन चंद्रावर अंतराळवीर दोन्ही एकत्र टाकतो आणि ते नेमके त्याच क्षणी उतरतात. चंद्र-प्रयोग गुरुत्वाबद्दल काय सिद्ध करतो?",
        },
        choices: [
          {
            en: "Gravity gives every object the same acceleration regardless of mass; on Earth only air resistance holds the feather back, and with no air on the Moon that difference vanishes",
            hi: "गुरुत्व हर वस्तु को द्रव्यमान चाहे जो एक-सा त्वरण देता; पृथ्वी पर केवल वायु-प्रतिरोध पंख को रोकता, और चंद्रमा पर हवा न होने से वह अंतर मिट जाता",
            mr: "गुरुत्व प्रत्येक वस्तूला वस्तुमान कितीही असो सारखे त्वरण देते; पृथ्वीवर फक्त हवा-रोध पिसाला अडवतो, आणि चंद्रावर हवा नसल्याने तो फरक नाहीसा होतो",
          },
          {
            en: "The Moon has no gravity, so the two objects simply drift down equally",
            hi: "चंद्रमा पर गुरुत्व नहीं, अतः दोनों वस्तुएँ बस बराबर तैरती उतरतीं",
            mr: "चंद्रावर गुरुत्व नाही, म्हणून दोन्ही वस्तू फक्त समान तरंगत उतरतात",
          },
          {
            en: "Heavier things always fall faster, and the hammer just happened to match the feather",
            hi: "भारी चीज़ें सदा तेज़ गिरतीं, और हथौड़ा बस संयोग से पंख से मेल खा गया",
            mr: "जड वस्तू नेहमी वेगाने पडतात, आणि हातोडा फक्त योगायोगाने पिसाशी जुळला",
          },
          {
            en: "The feather became heavier on the Moon and so could keep up",
            hi: "पंख चंद्रमा पर भारी हो गया अतः साथ रह सका",
            mr: "पीस चंद्रावर जड झाले म्हणून सोबत राहू शकले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The demonstration proves that gravity's acceleration does not depend on an object's mass — a claim that looks false on Earth only because of a hidden second force. When a feather drifts down slowly here, gravity is pulling it exactly as eagerly as it pulls the hammer; what slows the feather is air resistance, which bites hard on its broad, light form and barely touches the dense hammer. Strip the air away, as on the Moon (which does have gravity, about a sixth of Earth's), and nothing is left to hold the feather back. Now both objects feel only gravity, both accelerate at the very same rate, and both reach the ground together despite their wildly different masses. This is why g is written as a single number for a place, not one number per object: the more massive hammer is pulled with a greater force, but it also has more inertia to overcome, and the two effects cancel perfectly, leaving the same acceleration for all. It is exactly the point of the coin-and-feather tube in the lab, played out on a grander stage.",
          hi: "प्रदर्शन सिद्ध करता कि गुरुत्व का त्वरण वस्तु के द्रव्यमान पर निर्भर नहीं — दावा जो पृथ्वी पर केवल एक छिपे दूसरे बल के कारण झूठा दिखता। जब पंख यहाँ धीरे उतरता, गुरुत्व उसे ठीक उतनी ही उत्सुकता से खींचता जितना हथौड़े को; पंख को धीमा करता वायु-प्रतिरोध, जो उसके चौड़े, हल्के रूप पर ज़ोर काटता और सघन हथौड़े को मुश्किल से छूता। हवा हटाओ, जैसे चंद्रमा पर (जिसमें गुरुत्व है, पृथ्वी का लगभग छठा), और पंख को रोकने को कुछ नहीं बचता। अब दोनों वस्तुएँ केवल गुरुत्व महसूस करतीं, दोनों ठीक उसी दर से त्वरित, और दोनों अपने बेहद भिन्न द्रव्यमानों के बावजूद साथ ज़मीन पहुँचतीं। इसी से g किसी स्थान के लिए एक संख्या लिखी जाती, प्रति वस्तु एक नहीं: अधिक द्रव्यमान का हथौड़ा अधिक बल से खिंचता, पर उसमें पार करने को अधिक जड़त्व भी, और दोनों प्रभाव पूरी तरह रद्द, सबके लिए वही त्वरण छोड़ते। यह ठीक प्रयोगशाला की सिक्का-पंख नली का मर्म, बड़े मंच पर खेला।",
          mr: "प्रात्यक्षिक सिद्ध करते की गुरुत्वाचे त्वरण वस्तूच्या वस्तुमानावर अवलंबून नाही — दावा जो पृथ्वीवर फक्त एका दडलेल्या दुसऱ्या बलामुळे खोटा दिसतो. जेव्हा पीस इथे हळू उतरते, गुरुत्व त्याला नेमके तितक्याच उत्सुकतेने ओढते जितके हातोड्याला; पिसाला मंदावते हवा-रोध, जो त्याच्या रुंद, हलक्या रूपावर जोरात चावतो आणि घन हातोड्याला कसाबसा स्पर्शतो. हवा काढा, जसे चंद्रावर (ज्यात गुरुत्व आहे, पृथ्वीच्या सुमारे षष्टांश), आणि पिसाला अडवायला काही उरत नाही. आता दोन्ही वस्तू फक्त गुरुत्व अनुभवतात, दोन्ही नेमके त्याच दराने त्वरित, आणि दोन्ही आपल्या प्रचंड वेगळ्या वस्तुमानांनंतरही एकत्र जमिनीवर पोहोचतात. म्हणूनच g एका स्थानासाठी एक संख्या लिहितात, प्रति वस्तू एक नाही: अधिक वस्तुमानाचा हातोडा अधिक बलाने ओढला जातो, पण त्यात पार करायला अधिक जडत्वही, आणि दोन्ही परिणाम पूर्णपणे रद्द, सर्वांसाठी तेच त्वरण सोडत. हे नेमके प्रयोगशाळेतील नाणे-पीस नळीचे मर्म, मोठ्या रंगमंचावर खेळलेले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A solid iron nail dropped in water sinks straight to the bottom, yet a ship built of thousands of tonnes of the same iron floats. How can identical metal do both?",
          hi: "पानी में गिराई ठोस लोहे की कील सीधे तल तक डूबती, फिर भी उसी लोहे के हज़ारों टन से बना जहाज़ तैरता। एक-सा धातु दोनों कैसे कर सकता?",
          mr: "पाण्यात टाकलेला घन लोखंडी खिळा सरळ तळाला बुडतो, तरी त्याच लोखंडाच्या हजारो टनांनी बनलेले जहाज तरंगते. एकच धातू दोन्ही कसे करू शकतो?",
        },
        choices: [
          {
            en: "Floating depends on average density, not on the material alone. The nail is solid iron, denser than water, so it sinks; the ship is a hollow shell enclosing air, whose average density (iron plus the trapped air-filled space) is less than water, so it floats",
            hi: "तैरना औसत घनत्व पर निर्भर, केवल पदार्थ पर नहीं। कील ठोस लोहा, पानी से सघन, अतः डूबती; जहाज़ हवा घेरता खोखला खोल, जिसका औसत घनत्व (लोहा जमा फँसी हवा-भरी जगह) पानी से कम, अतः तैरता",
            mr: "तरंगणे सरासरी घनतेवर अवलंबून, फक्त पदार्थावर नाही. खिळा घन लोखंड, पाण्याहून घन, म्हणून बुडतो; जहाज हवा वेढणारे पोकळ कवच, ज्याची सरासरी घनता (लोखंड अधिक अडकलेली हवा-भरली जागा) पाण्याहून कमी, म्हणून तरंगते",
          },
          {
            en: "The ship is painted with a special material that repels water",
            hi: "जहाज़ पर पानी को दूर करता विशेष पदार्थ पुता होता",
            mr: "जहाजावर पाणी दूर करणारा विशेष पदार्थ लावलेला असतो",
          },
          {
            en: "Large objects always float and small objects always sink",
            hi: "बड़ी वस्तुएँ सदा तैरतीं और छोटी सदा डूबतीं",
            mr: "मोठ्या वस्तू नेहमी तरंगतात आणि लहान नेहमी बुडतात",
          },
          {
            en: "The ship's engines constantly push it upward against gravity",
            hi: "जहाज़ के इंजन उसे गुरुत्व के विरुद्ध लगातार ऊपर धकेलते",
            mr: "जहाजाची इंजिने त्याला गुरुत्वाविरुद्ध सतत वर ढकलतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The secret is that 'will it float?' is never a question about the material by itself — it is a question about average density, mass divided by the whole volume the object occupies. A nail is a lump of solid iron through and through, and iron is nearly eight times denser than water; a nail-sized volume of iron weighs far more than the same volume of water, so the water it pushes aside cannot supply enough upthrust to hold it, and it sinks. A ship is made of the same iron, but it is not solid: it is a thin hull wrapped around an enormous hollow filled with air. Its total mass, spread over that huge enclosed volume, gives an AVERAGE density well below water's. Now Archimedes settles it: as the ship sits lower, it pushes aside more and more water, and it keeps sinking only until the weight of water displaced equals the ship's own weight — at that draught the upthrust balances gravity and it floats. Overload the ship, or breach the hull so water floods the hollow, and its average density climbs past water's — and then the very same steel goes down like the nail. Shape, not substance, decides it.",
          hi: "रहस्य यह कि 'तैरेगा?' कभी अकेले पदार्थ का सवाल नहीं — यह औसत घनत्व का सवाल है, द्रव्यमान बटा वस्तु के घेरे पूरे आयतन। कील आर-पार ठोस लोहे का ढेला, और लोहा पानी से लगभग आठ गुना सघन; कील-भर आयतन का लोहा उसी आयतन के पानी से कहीं भारी, अतः हटाया पानी उसे थामने भर उत्प्लावन नहीं दे पाता, और वह डूबती। जहाज़ उसी लोहे का, पर ठोस नहीं: हवा भरे विशाल खोखले को लपेटता पतला पतवारा। उसका कुल द्रव्यमान, उस विशाल घेरे आयतन पर फैला, पानी से कहीं नीचे औसत घनत्व देता। अब आर्किमिडीज़ निपटाते: जहाज़ जितना नीचे बैठता, उतना अधिक पानी हटाता, और तभी तक डूबता जब तक हटाए पानी का भार जहाज़ के अपने भार के बराबर न हो — उस डूबाव पर उत्प्लावन गुरुत्व संतुलित करता और वह तैरता। जहाज़ अतिभारित करो, या पतवारा फोड़ो कि पानी खोखले में भरे, उसका औसत घनत्व पानी से ऊपर चढ़ता — और तब वही इस्पात कील-सा डूबता। आकार, पदार्थ नहीं, तय करता।",
          mr: "रहस्य हे की 'तरंगेल?' कधीच एकट्या पदार्थाचा प्रश्न नाही — तो सरासरी घनतेचा प्रश्न आहे, वस्तुमान भागिले वस्तूने व्यापलेले संपूर्ण घनफळ. खिळा आरपार घन लोखंडाचा गोळा, आणि लोखंड पाण्याहून जवळपास आठ पट घन; खिळ्याएवढ्या घनफळाचे लोखंड त्याच घनफळाच्या पाण्याहून कितीतरी जड, म्हणून बाजूला केलेले पाणी त्याला धरण्याइतका उत्प्रणोद देऊ शकत नाही, आणि तो बुडतो. जहाज त्याच लोखंडाचे, पण घन नाही: हवा भरलेल्या अवाढव्य पोकळीला वेढणारे पातळ कवच. त्याचे एकूण वस्तुमान, त्या प्रचंड वेढलेल्या घनफळावर पसरलेले, पाण्याहून कितीतरी खाली सरासरी घनता देते. आता आर्किमिडीज निकाल लावतात: जहाज जितके खाली बसते, तितके अधिक पाणी बाजूला करते, आणि तोवरच बुडते जोवर बाजूला केलेल्या पाण्याचे भार जहाजाच्या स्वतःच्या भाराइतके होत नाही — त्या बुडावावर उत्प्रणोद गुरुत्व संतुलित करतो आणि ते तरंगते. जहाज अतिभारित करा, किंवा कवच फोडा जेणेकरून पाणी पोकळीत भरते, त्याची सरासरी घनता पाण्याहून वर चढते — आणि मग तेच पोलाद खिळ्यासारखे बुडते. आकार, पदार्थ नव्हे, ठरवतो.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — Work and Energy (the currency of change)                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-work-energy",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 11 — Work and Energy",
      hi: "अध्याय 11 — कार्य तथा ऊर्जा",
      mr: "प्रकरण 11 — कार्य आणि ऊर्जा",
    },
    name: {
      en: "Work and Energy",
      hi: "कार्य तथा ऊर्जा",
      mr: "कार्य आणि ऊर्जा",
    },
    summary: {
      en: "Work in physics is force times the distance moved along it — no motion, no work, however tired you feel. Energy is the capacity to do that work, carried as motion or as height, spent as power over time, and — through every trade — never created nor destroyed, only changed in form.",
      hi: "भौतिकी में कार्य बल गुणा उसकी दिशा में चली दूरी है — गति नहीं तो कार्य नहीं, चाहे तुम कितने थके। ऊर्जा वह कार्य करने की क्षमता, गति या ऊँचाई के रूप में ढोई, समय पर शक्ति बतौर खर्ची, और — हर सौदे में — न बनती न नष्ट होती, केवल रूप बदलती।",
      mr: "भौतिकशास्त्रात कार्य बल गुणिले त्याच्या दिशेत चाललेले अंतर आहे — गती नाही तर कार्य नाही, तू कितीही थकलास तरी. ऊर्जा ते कार्य करण्याची क्षमता, गती वा उंचीच्या रूपात वाहिलेली, वेळेवर शक्ती म्हणून खर्चलेली, आणि — प्रत्येक देवाणघेवाणीत — न बनते न नष्ट होते, फक्त रूप बदलते.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "work-definition",
        name: {
          en: "Work done by a force",
          hi: "बल द्वारा किया कार्य",
          mr: "बलाने केलेले कार्य",
        },
        kind: "idea",
        prompt: {
          en: "You push a stalled car and it rolls forward; you shove a wall and it does not budge. In which case does physics say work was done, and how is that work measured?",
          hi: "तुम रुकी कार धकेलते और वह आगे लुढ़कती; दीवार धकेलते और वह टस से मस नहीं। किसमें भौतिकी कहती कार्य हुआ, और वह कार्य कैसे नापा?",
          mr: "तू थांबलेली गाडी ढकलतोस आणि ती पुढे लोटते; भिंत ढकलतोस आणि ती हलत नाही. कशात भौतिकशास्त्र म्हणते कार्य झाले, आणि ते कार्य कसे मोजले?",
        },
        statement: {
          en: "Work is done only when a force moves its point of application; it equals force times the distance moved along the force's direction, so no displacement means no work at all.",
          hi: "कार्य तभी होता जब बल अपने लगने के बिंदु को हिलाए; यह बल गुणा बल की दिशा में चली दूरी के बराबर, अतः विस्थापन नहीं तो कार्य बिलकुल नहीं।",
          mr: "कार्य तेव्हाच होते जेव्हा बल आपल्या लागण्याच्या बिंदूला हलवते; ते बल गुणिले बलाच्या दिशेत चाललेल्या अंतराइतके, म्हणून विस्थापन नाही तर कार्य मुळीच नाही.",
        },
        detail: {
          en: "Pushing a wall that never moves does zero work in physics, no matter how it exhausts you — effort is not the same as work.",
          hi: "कभी न हिलती दीवार धकेलना भौतिकी में शून्य कार्य, चाहे तुम कितने थको — मेहनत कार्य के बराबर नहीं।",
          mr: "कधीही न हलणारी भिंत ढकलणे भौतिकशास्त्रात शून्य कार्य, तू कितीही थकलास तरी — कष्ट कार्याइतके नाही.",
        },
        extra: {
          en: "If the force is at right angles to the motion — like gravity on a bag carried level — it does no work either, for nothing moves along its line.",
          hi: "यदि बल गति के समकोण पर हो — जैसे समतल ढोए थैले पर गुरुत्व — तो वह भी कोई कार्य नहीं करता, क्योंकि उसकी रेखा में कुछ नहीं चलता।",
          mr: "जर बल गतीच्या काटकोनात असेल — जसे सपाट वाहिलेल्या पिशवीवर गुरुत्व — तर तेही कोणतेही कार्य करत नाही, कारण त्याच्या रेषेत काही हलत नाही.",
        },
        pair: {
          left: {
            en: "Force times distance moved along it",
            hi: "बल गुणा उसकी दिशा में चली दूरी",
            mr: "बल गुणिले त्याच्या दिशेत चाललेले अंतर",
          },
          right: {
            en: "work",
            hi: "कार्य",
            mr: "कार्य",
          },
        },
      },
      {
        id: "kinetic-energy",
        name: {
          en: "Kinetic energy",
          hi: "गतिज ऊर्जा",
          mr: "गतिज ऊर्जा",
        },
        kind: "idea",
        prompt: {
          en: "A rolling cricket ball can knock over a stump; a rushing river can turn a wheel. Which form of energy does a body carry purely by virtue of its motion?",
          hi: "लुढ़कती क्रिकेट गेंद स्टंप गिरा सकती; बहती नदी पहिया घुमा सकती। कौन-सी ऊर्जा पिंड केवल अपनी गति के कारण ढोता?",
          mr: "लोटणारा क्रिकेट चेंडू स्टंप पाडू शकतो; वाहणारी नदी चाक फिरवू शकते. कोणती ऊर्जा पिंड फक्त आपल्या गतीमुळे वाहतो?",
        },
        statement: {
          en: "Kinetic energy is the energy a body has because of its motion; it equals ½mv², so it grows with mass and, far faster, with the square of the speed.",
          hi: "गतिज ऊर्जा वह ऊर्जा जो पिंड अपनी गति के कारण रखता; यह ½mv² के बराबर, अतः द्रव्यमान से और, कहीं तेज़, चाल के वर्ग से बढ़ती।",
          mr: "गतिज ऊर्जा ती ऊर्जा जी पिंड आपल्या गतीमुळे राखतो; ती ½mv² इतकी, म्हणून वस्तुमानाने आणि, कितीतरी वेगाने, चालीच्या वर्गाने वाढते.",
        },
        detail: {
          en: "Because it goes as speed squared, doubling a car's speed quadruples its kinetic energy — and roughly its stopping distance.",
          hi: "चाल-वर्ग के अनुसार होने से कार की चाल दुगुनी करने पर गतिज ऊर्जा चौगुनी — और लगभग उसकी रुकने की दूरी।",
          mr: "चाल-वर्गानुसार असल्याने गाडीची चाल दुप्पट केल्यास गतिज ऊर्जा चौपट — आणि साधारण तिचे थांबण्याचे अंतर.",
        },
        extra: {
          en: "The work done to speed a body up from rest is stored exactly as this kinetic energy — work in, motion-energy out.",
          hi: "पिंड को विराम से तेज़ करने में किया कार्य ठीक इसी गतिज ऊर्जा में जमा — कार्य भीतर, गति-ऊर्जा बाहर।",
          mr: "पिंडाला विश्रांतीतून वेगवान करण्यात केलेले कार्य नेमके याच गतिज ऊर्जेत साठते — कार्य आत, गती-ऊर्जा बाहेर.",
        },
        pair: {
          left: {
            en: "Energy of motion, ½mv²",
            hi: "गति की ऊर्जा, ½mv²",
            mr: "गतीची ऊर्जा, ½mv²",
          },
          right: {
            en: "kinetic energy",
            hi: "गतिज ऊर्जा",
            mr: "गतिज ऊर्जा",
          },
        },
      },
      {
        id: "potential-energy",
        name: {
          en: "Potential energy",
          hi: "स्थितिज ऊर्जा",
          mr: "स्थितिज ऊर्जा",
        },
        kind: "idea",
        prompt: {
          en: "A brick held high on a shelf, or a stretched bowstring, threatens to do work the moment it is released. Which stored energy comes from a body's position or shape rather than its motion?",
          hi: "ऊँची ताक पर रखी ईंट, या खिंची धनुष-डोरी, छूटते ही कार्य करने को तत्पर। कौन-सी संचित ऊर्जा पिंड की स्थिति या आकार से आती, गति से नहीं?",
          mr: "उंच फळीवर ठेवलेली वीट, किंवा ताणलेली धनुष्य-दोरी, सुटताच कार्य करायला तत्पर. कोणती साठलेली ऊर्जा पिंडाच्या स्थितीतून किंवा आकारातून येते, गतीतून नाही?",
        },
        statement: {
          en: "Potential energy is stored energy a body holds by virtue of its position or shape — a raised weight stores gravitational PE equal to mgh, ready to be released.",
          hi: "स्थितिज ऊर्जा वह संचित ऊर्जा जो पिंड अपनी स्थिति या आकार के कारण रखता — उठाया भार mgh के बराबर गुरुत्वीय स्थितिज ऊर्जा जमा करता, छूटने को तैयार।",
          mr: "स्थितिज ऊर्जा ती साठलेली ऊर्जा जी पिंड आपल्या स्थितीमुळे किंवा आकारामुळे राखतो — उचललेले भार mgh इतकी गुरुत्वीय स्थितिज ऊर्जा साठवते, सुटायला तयार.",
        },
        detail: {
          en: "Lift a body slowly through a height h and the work you spend, mgh, is banked as its gravitational potential energy — nothing is lost.",
          hi: "पिंड को ऊँचाई h तक धीरे उठाओ और तुम्हारा खर्चा कार्य, mgh, उसकी गुरुत्वीय स्थितिज ऊर्जा में जमा — कुछ नहीं खोता।",
          mr: "पिंडाला उंची h पर्यंत हळू उचला आणि तुझे खर्चलेले कार्य, mgh, त्याच्या गुरुत्वीय स्थितिज ऊर्जेत जमा — काही हरवत नाही.",
        },
        extra: {
          en: "A wound spring, a drawn bow and a raised hammer all hold this waiting energy — released, it turns straight into motion.",
          hi: "लपेटी कमानी, खिंचा धनुष और उठाया हथौड़ा सब यह प्रतीक्षारत ऊर्जा रखते — छूटने पर सीधे गति में बदलती।",
          mr: "गुंडाळलेली स्प्रिंग, ताणलेले धनुष्य आणि उचललेला हातोडा सर्व ही प्रतीक्षारत ऊर्जा राखतात — सुटल्यावर थेट गतीत बदलते.",
        },
        pair: {
          left: {
            en: "Stored by height or shape, mgh",
            hi: "ऊँचाई या आकार से जमा, mgh",
            mr: "उंची वा आकाराने साठलेली, mgh",
          },
          right: {
            en: "potential energy",
            hi: "स्थितिज ऊर्जा",
            mr: "स्थितिज ऊर्जा",
          },
        },
      },
      {
        id: "conservation-energy",
        name: {
          en: "Conservation of energy",
          hi: "ऊर्जा संरक्षण",
          mr: "ऊर्जा संधारण",
        },
        kind: "law",
        prompt: {
          en: "As a ball falls, it loses height but gains speed; a swinging pendulum trades slowness at the top for rush at the bottom. Which law says energy only changes form, never vanishing?",
          hi: "गिरती गेंद ऊँचाई खोती पर चाल पाती; झूलता लोलक शिखर की सुस्ती को तल की तेज़ी से बदलता। कौन-सा नियम कहता ऊर्जा केवल रूप बदलती, कभी लुप्त नहीं होती?",
          mr: "पडणारा चेंडू उंची गमावतो पण चाल मिळवतो; झुलणारा लंबक शिखराची मंदता तळाच्या वेगाने बदलतो. कोणता नियम सांगतो ऊर्जा फक्त रूप बदलते, कधी नाहीशी होत नाही?",
        },
        statement: {
          en: "The law of conservation of energy says energy can neither be created nor destroyed, only changed from one form to another — the total in a closed system stays constant.",
          hi: "ऊर्जा संरक्षण का नियम कहता ऊर्जा न बनाई न नष्ट की जा सकती, केवल एक रूप से दूसरे में बदली — बंद तंत्र में कुल नियत रहता।",
          mr: "ऊर्जा संधारणाचा नियम सांगतो ऊर्जा न निर्माण न नष्ट करता येते, फक्त एका रूपातून दुसऱ्यात बदलते — बंद यंत्रणेत एकूण स्थिर राहते.",
        },
        detail: {
          en: "In a falling body the potential energy lost is gained exactly as kinetic energy, so their sum holds steady all the way down.",
          hi: "गिरते पिंड में खोई स्थितिज ऊर्जा ठीक गतिज ऊर्जा बनकर मिलती, अतः उनका योग पूरे रास्ते नियत रहता।",
          mr: "पडणाऱ्या पिंडात गमावलेली स्थितिज ऊर्जा नेमकी गतिज ऊर्जा बनून मिळते, म्हणून त्यांची बेरीज संपूर्ण खाली स्थिर राहते.",
        },
        extra: {
          en: "Where energy seems to disappear — a bouncing ball slowly stopping — it has only slipped away as heat and sound, still counted in the total.",
          hi: "जहाँ ऊर्जा लुप्त लगती — उछलती गेंद धीरे रुकती — वह केवल ऊष्मा और ध्वनि बनकर खिसकी, कुल में अब भी गिनी।",
          mr: "जिथे ऊर्जा नाहीशी वाटते — उसळणारा चेंडू हळू थांबतो — ती फक्त उष्णता आणि ध्वनी बनून निसटली, एकूणात अजूनही मोजलेली.",
        },
        pair: {
          left: {
            en: "Never created or destroyed, only transformed",
            hi: "कभी न बने न नष्ट, केवल रूपांतरित",
            mr: "कधी न बने न नष्ट, फक्त रूपांतरित",
          },
          right: {
            en: "conservation of energy",
            hi: "ऊर्जा संरक्षण",
            mr: "ऊर्जा संधारण",
          },
        },
      },
      {
        id: "power",
        name: { en: "Power", hi: "शक्ति", mr: "शक्ती" },
        kind: "idea",
        prompt: {
          en: "Two porters carry the same load up the same stairs, but one races up in half the time. They do equal work — so which quantity tells them apart?",
          hi: "दो कुली वही बोझ उन्हीं सीढ़ियों पर ले जाते, पर एक आधे समय में दौड़कर चढ़ता। वे बराबर कार्य करते — तो कौन-सी राशि उन्हें अलग बताती?",
          mr: "दोन हमाल तेच ओझे त्याच पायऱ्यांवर नेतात, पण एक अर्ध्या वेळात धावत चढतो. ते समान कार्य करतात — तर कोणती राशी त्यांना वेगळे सांगते?",
        },
        statement: {
          en: "Power is the rate of doing work — work done divided by the time taken; the faster the same work is finished, the greater the power, measured in watts.",
          hi: "शक्ति कार्य करने की दर है — किया कार्य बटा लगा समय; वही कार्य जितना तेज़ पूरा, उतनी अधिक शक्ति, वॉट में नापी।",
          mr: "शक्ती कार्य करण्याचा दर आहे — केलेले कार्य भागिले लागलेला वेळ; तेच कार्य जितके जलद पूर्ण, तितकी अधिक शक्ती, वॅटमध्ये मोजली.",
        },
        detail: {
          en: "One watt is one joule of work each second; a bright room light burns tens of watts, a running motorbike tens of thousands.",
          hi: "एक वॉट प्रति सेकंड एक जूल कार्य; तेज़ कमरे की बत्ती दसियों वॉट जलाती, दौड़ती मोटरसाइकिल दसियों हज़ार।",
          mr: "एक वॅट प्रति सेकंद एक ज्यूल कार्य; तेजस्वी खोलीची बत्ती दहा-वीस वॅट जाळते, धावती मोटरसायकल दहा-वीस हजार.",
        },
        extra: {
          en: "Because power and time together give energy, the electricity board bills you not in watts but in kilowatt-hours — power multiplied by hours run.",
          hi: "शक्ति और समय मिलकर ऊर्जा देते, अतः बिजली-बोर्ड तुम्हें वॉट में नहीं किलोवॉट-घंटा में बिल करता — शक्ति गुणा चले घंटे।",
          mr: "शक्ती आणि वेळ मिळून ऊर्जा देतात, म्हणून वीज-मंडळ तुला वॅटमध्ये नव्हे किलोवॅट-तासात बिल देते — शक्ती गुणिले चाललेले तास.",
        },
        pair: {
          left: {
            en: "Work done per unit time",
            hi: "प्रति समय किया कार्य",
            mr: "प्रति वेळ केलेले कार्य",
          },
          right: {
            en: "power",
            hi: "शक्ति",
            mr: "शक्ती",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A porter lifts a heavy trunk onto his head, then walks a long, level platform at a steady pace to the far end, and sets it down. He is drenched in sweat and insists he did enormous work. On which part of this journey did he do NO work on the trunk against gravity, and why?",
          hi: "एक कुली भारी पेटी सिर पर उठाता, फिर लंबे समतल प्लेटफ़ॉर्म पर स्थिर चाल से दूर छोर तक चलता, और उतार देता। वह पसीने में तर और अड़ता कि उसने भारी कार्य किया। इस यात्रा के किस भाग में उसने पेटी पर गुरुत्व के विरुद्ध कोई कार्य नहीं किया, और क्यों?",
          mr: "एक हमाल जड ट्रंक डोक्यावर उचलतो, मग लांब सपाट फलाटावर स्थिर चालीने दूरच्या टोकापर्यंत चालतो, आणि खाली ठेवतो. तो घामाने निथळतो आणि अडतो की त्याने प्रचंड कार्य केले. या प्रवासाच्या कोणत्या भागात त्याने ट्रंकवर गुरुत्वाविरुद्ध कोणतेही कार्य केले नाही, आणि का?",
        },
        choices: [
          {
            en: "While walking level: his supporting force on the trunk points up, but the trunk moves horizontally, so the force is at right angles to the motion and does zero work against gravity — only the initial lift did that work",
            hi: "समतल चलते: पेटी पर उसका सहारा-बल ऊपर, पर पेटी क्षैतिज चलती, अतः बल गति के समकोण पर और गुरुत्व के विरुद्ध शून्य कार्य — वह कार्य केवल आरंभिक उठान ने किया",
            mr: "सपाट चालताना: ट्रंकवरचे त्याचे आधार-बल वर, पण ट्रंक आडवी हलते, म्हणून बल गतीच्या काटकोनात आणि गुरुत्वाविरुद्ध शून्य कार्य — ते कार्य फक्त सुरुवातीच्या उचलण्याने केले",
          },
          {
            en: "While lifting the trunk onto his head, because lifting is effortless",
            hi: "पेटी सिर पर उठाते, क्योंकि उठाना अनायास",
            mr: "ट्रंक डोक्यावर उचलताना, कारण उचलणे सहज",
          },
          {
            en: "He does equal work at every stage of the journey",
            hi: "वह यात्रा के हर चरण में बराबर कार्य करता",
            mr: "तो प्रवासाच्या प्रत्येक टप्प्यात समान कार्य करतो",
          },
          {
            en: "He does no work at all anywhere, since the trunk returns to the ground",
            hi: "वह कहीं कोई कार्य नहीं करता, क्योंकि पेटी ज़मीन पर लौटती",
            mr: "तो कुठेही कोणतेही कार्य करत नाही, कारण ट्रंक जमिनीवर परतते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Physics measures work as force times the distance moved ALONG that force's direction — and that is what separates the lift from the walk. When the porter first hoists the trunk to his head, his force points upward and the trunk actually rises through that height: force and motion are in the same direction, so real work is done against gravity, stored as the trunk's gained potential energy. But once the trunk is riding level on his head, the force he supplies to hold it up still points straight up (balancing its weight), while the trunk now moves horizontally along the platform. Force up, motion sideways — the two are at right angles, and a force perpendicular to the motion does no work. So across the entire level walk, however long and exhausting, he does zero work on the trunk against gravity; its height, and hence its potential energy, never changes. His sweat is real, but it goes into the biological cost of keeping his muscles tensed, not into physics-work on the load. (Only if he stumbled and the trunk rose or fell would gravity-work reappear.) It is the same reason the Moon, forever pulled sideways-to-its-motion by Earth, needs no energy fed in to keep circling.",
          hi: "भौतिकी कार्य नापती बल गुणा उस बल की दिशा में चली दूरी — और यही उठान को चाल से अलग करता। जब कुली पहले पेटी सिर तक उठाता, उसका बल ऊपर और पेटी सचमुच उस ऊँचाई चढ़ती: बल और गति एक दिशा में, अतः गुरुत्व के विरुद्ध असली कार्य, पेटी की पाई स्थितिज ऊर्जा में जमा। पर जब पेटी सिर पर समतल सवार, उसे थामने का बल अब भी सीधे ऊपर (भार संतुलित), जबकि पेटी अब प्लेटफ़ॉर्म पर क्षैतिज चलती। बल ऊपर, गति बग़ल — दोनों समकोण पर, और गति के लंब बल कोई कार्य नहीं करता। अतः पूरे समतल चलने में, चाहे कितना लंबा-थकाऊ, वह पेटी पर गुरुत्व के विरुद्ध शून्य कार्य करता; उसकी ऊँचाई, और इसलिए स्थितिज ऊर्जा, कभी नहीं बदलती। उसका पसीना असली, पर वह माँसपेशियों को तने रखने की जैविक लागत में जाता, भार पर भौतिकी-कार्य में नहीं। (केवल यदि वह लड़खड़ाए और पेटी चढ़े या गिरे तो गुरुत्व-कार्य लौटता।) यही कारण चंद्रमा, पृथ्वी से सदा अपनी-गति-के-बग़ल खिंचा, परिक्रमा जारी रखने को भीतर कोई ऊर्जा नहीं माँगता।",
          mr: "भौतिकशास्त्र कार्य मोजते बल गुणिले त्या बलाच्या दिशेत चाललेले अंतर — आणि हेच उचलण्याला चालण्यापासून वेगळे करते. जेव्हा हमाल आधी ट्रंक डोक्यापर्यंत उचलतो, त्याचे बल वर आणि ट्रंक खरोखर त्या उंचीवर चढते: बल आणि गती एका दिशेत, म्हणून गुरुत्वाविरुद्ध खरे कार्य, ट्रंकच्या मिळवलेल्या स्थितिज ऊर्जेत साठलेले. पण एकदा ट्रंक डोक्यावर सपाट स्वार, तिला धरण्याचे बल अजूनही सरळ वर (भार संतुलित), तर ट्रंक आता फलाटावर आडवी हलते. बल वर, गती बाजूला — दोन्ही काटकोनात, आणि गतीला लंब बल कोणतेही कार्य करत नाही. म्हणून संपूर्ण सपाट चालण्यात, कितीही लांब-थकवणारे असो, तो ट्रंकवर गुरुत्वाविरुद्ध शून्य कार्य करतो; तिची उंची, आणि म्हणून स्थितिज ऊर्जा, कधी बदलत नाही. त्याचा घाम खरा, पण तो स्नायू ताणलेले ठेवण्याच्या जैविक खर्चात जातो, भारावर भौतिकी-कार्यात नाही. (फक्त जर तो अडखळला आणि ट्रंक चढली वा पडली तर गुरुत्व-कार्य परतते.) हेच कारण चंद्र, पृथ्वीने सदैव आपल्या-गतीला-आडवा ओढलेला, परिभ्रमण चालू ठेवायला आत कोणतीही ऊर्जा मागत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A stone is dropped from a height. Halfway down, careful measurement shows it has lost exactly half its starting potential energy but gained exactly that much kinetic energy, and at the ground all the potential energy has become kinetic. What principle is on display, and what would it look like for a swinging pendulum?",
          hi: "एक पत्थर ऊँचाई से गिराया जाता। आधे नीचे, सावधान मापन दिखाता उसने अपनी आरंभिक स्थितिज ऊर्जा ठीक आधी खोई पर उतनी ही गतिज पाई, और ज़मीन पर सारी स्थितिज गतिज बन गई। कौन-सा सिद्धांत प्रदर्शित, और झूलते लोलक के लिए यह कैसा दिखेगा?",
          mr: "एक दगड उंचीवरून टाकला जातो. अर्ध्या खाली, काळजीपूर्वक मापन दाखवते त्याने आपली सुरुवातीची स्थितिज ऊर्जा नेमकी अर्धी गमावली पण तितकीच गतिज मिळवली, आणि जमिनीवर सारी स्थितिज गतिज बनली. कोणते तत्त्व प्रदर्शित, आणि झुलणाऱ्या लंबकासाठी हे कसे दिसेल?",
        },
        choices: [
          {
            en: "Conservation of mechanical energy: PE is not lost but converted into KE, their sum staying constant throughout the fall. A pendulum shows the same trade — all PE at the ends where it pauses, all KE at the bottom where it moves fastest, swapping back and forth",
            hi: "यांत्रिक ऊर्जा संरक्षण: स्थितिज खोई नहीं बल्कि गतिज में बदली, उनका योग पूरे पतन में नियत। लोलक वही सौदा दिखाता — सिरों पर जहाँ ठहरता सारी स्थितिज, तल पर जहाँ सबसे तेज़ सारी गतिज, आगे-पीछे बदलते",
            mr: "यांत्रिक ऊर्जा संधारण: स्थितिज हरवली नाही तर गतिजात बदलली, त्यांची बेरीज संपूर्ण पतनात स्थिर. लंबक तोच व्यवहार दाखवतो — टोकांना जिथे थांबतो सारी स्थितिज, तळाशी जिथे सर्वांत जलद सारी गतिज, पुढे-मागे बदलत",
          },
          {
            en: "The stone is creating new energy as it falls, which is why it speeds up",
            hi: "पत्थर गिरते नई ऊर्जा बनाता, इसी से तेज़ होता",
            mr: "दगड पडताना नवी ऊर्जा बनवतो, म्हणून वेगवान होतो",
          },
          {
            en: "Potential energy is simply destroyed and the stone's speed is unrelated",
            hi: "स्थितिज ऊर्जा बस नष्ट होती और पत्थर की चाल असंबंधित",
            mr: "स्थितिज ऊर्जा फक्त नष्ट होते आणि दगडाची चाल असंबंधित",
          },
          {
            en: "A pendulum has kinetic energy at the top and potential energy at the bottom",
            hi: "लोलक में शिखर पर गतिज और तल पर स्थितिज ऊर्जा",
            mr: "लंबकात शिखरावर गतिज आणि तळाशी स्थितिज ऊर्जा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "What the measurements display is the conservation of mechanical energy: as the stone falls, the gravitational potential energy it gives up (mgh, shrinking as its height h drops) is not lost but converted, joule for joule, into kinetic energy (½mv², growing as it speeds up). At the halfway point half the PE has become KE; at the ground, where h is zero, every last joule of the original PE has turned into kinetic energy, and the stone is moving at its fastest — the sum PE + KE holding constant the whole way down. A swinging pendulum is the same bargain made to repeat: at the two ends of its swing it stops for an instant at its highest point, so there its energy is entirely potential and its speed is zero; as it sweeps down to the lowest point it trades that height for speed, arriving with zero PE and maximum KE, moving fastest exactly at the bottom; then it climbs the far side, spending kinetic back into potential, and pauses again. Energy sloshes endlessly between the two forms while their total stays fixed. In the real world a little leaks away each swing as heat from air drag and friction at the pivot — which is why a real pendulum slowly dies down — but that lost energy has not vanished; counted as heat and sound, the grand total is still conserved.",
          hi: "मापन जो दिखाते वह यांत्रिक ऊर्जा का संरक्षण: पत्थर गिरते, जो गुरुत्वीय स्थितिज ऊर्जा वह छोड़ता (mgh, ऊँचाई h गिरते सिकुड़ती) खोई नहीं बल्कि जूल-दर-जूल गतिज ऊर्जा (½mv², तेज़ होते बढ़ती) में बदली। आधे बिंदु पर आधी स्थितिज गतिज बनी; ज़मीन पर, जहाँ h शून्य, मूल स्थितिज का हर अंतिम जूल गतिज बना, और पत्थर सबसे तेज़ चलता — योग स्थितिज + गतिज पूरे रास्ते नियत। झूलता लोलक वही सौदा दोहराता: झूले के दोनों सिरों पर वह क्षण-भर अपने उच्चतम बिंदु पर रुकता, अतः वहाँ उसकी ऊर्जा पूरी स्थितिज और चाल शून्य; निम्नतम बिंदु तक झूलते वह ऊँचाई को चाल से बदलता, शून्य स्थितिज और अधिकतम गतिज के साथ पहुँचता, ठीक तल पर सबसे तेज़; फिर दूर की ओर चढ़ता, गतिज को स्थितिज में लौटाता, और फिर ठहरता। ऊर्जा दोनों रूपों के बीच अनवरत छलकती जबकि उनका कुल नियत। असल दुनिया में हर झूले में थोड़ी वायु-घर्षण और धुरी की रगड़ से ऊष्मा बनकर रिसती — इसी से असली लोलक धीरे थमता — पर वह खोई ऊर्जा लुप्त नहीं; ऊष्मा-ध्वनि गिनें तो महायोग अब भी संरक्षित।",
          mr: "मापन जे दाखवतात ते यांत्रिक ऊर्जेचे संधारण: दगड पडताना, जी गुरुत्वीय स्थितिज ऊर्जा तो सोडतो (mgh, उंची h घटताना आकुंचणारी) हरवली नाही तर ज्यूल-दर-ज्यूल गतिज ऊर्जेत (½mv², वेगवान होताना वाढणारी) बदलली. अर्ध्या बिंदूवर अर्धी स्थितिज गतिज बनली; जमिनीवर, जिथे h शून्य, मूळ स्थितिजचा प्रत्येक शेवटचा ज्यूल गतिज बनला, आणि दगड सर्वांत जलद चालतो — बेरीज स्थितिज + गतिज संपूर्ण खाली स्थिर. झुलणारा लंबक तोच व्यवहार पुन्हा करतो: झुल्याच्या दोन टोकांना तो क्षणभर आपल्या सर्वोच्च बिंदूवर थांबतो, म्हणून तिथे त्याची ऊर्जा पूर्ण स्थितिज आणि चाल शून्य; सर्वांत खालच्या बिंदूपर्यंत झुलताना तो उंची चालीने बदलतो, शून्य स्थितिज आणि कमाल गतिजासह पोहोचतो, नेमके तळाशी सर्वांत जलद; मग दूरची बाजू चढतो, गतिज स्थितिजात परत खर्चतो, आणि पुन्हा थांबतो. ऊर्जा दोन्ही रूपांत अखंड हिंदकळते तर त्यांची बेरीज स्थिर राहते. खऱ्या जगात प्रत्येक झुल्यात थोडी हवा-रोध आणि आसाच्या घर्षणातून उष्णता बनून झिरपते — म्हणूनच खरा लंबक हळू थांबतो — पण ती हरवलेली ऊर्जा नाहीशी झाली नाही; उष्णता-ध्वनी मोजली तर महाबेरीज अजूनही संधारित.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 12 — Sound (a travelling squeeze of the air)                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-9-sound",
    subject: "SCIENCE",
    classLevel: 9,
    chapter: {
      en: "Chapter 12 — Sound",
      hi: "अध्याय 12 — ध्वनि",
      mr: "प्रकरण 12 — ध्वनी",
    },
    name: {
      en: "Sound",
      hi: "ध्वनि",
      mr: "ध्वनी",
    },
    summary: {
      en: "Sound is a vibration handed particle to particle: a travelling train of squeezes and stretches that needs matter to carry it and falls silent in a vacuum. Its frequency sets the pitch, its amplitude the loudness, and its echoes measure the sea by the time they take to return.",
      hi: "ध्वनि कण-दर-कण सौंपा कंपन है: दबाव और खिंचाव की चलती रेलगाड़ी जिसे ढोने को पदार्थ चाहिए और निर्वात में मौन। इसकी आवृत्ति तारत्व तय करती, आयाम प्रबलता, और इसकी प्रतिध्वनियाँ लौटने में लगे समय से समुद्र नापतीं।",
      mr: "ध्वनी कण-दर-कण सुपूर्द केलेले कंपन आहे: दाब आणि ताणाची चालती आगगाडी जिला वाहायला पदार्थ हवा आणि निर्वातात मौन. तिची वारंवारता स्वरमान ठरवते, परमप्रसर मोठेपणा, आणि तिचे प्रतिध्वनी परतायला लागलेल्या वेळेने समुद्र मोजतात.",
    },
    position: 12,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "sound-vibration",
        name: {
          en: "Sound from vibration",
          hi: "कंपन से ध्वनि",
          mr: "कंपनातून ध्वनी",
        },
        kind: "idea",
        prompt: {
          en: "Pluck a taut string, strike a bell, or touch a ringing tuning fork to water and it sprays — every sound traces back to what kind of motion in its source?",
          hi: "तनी डोरी छेड़ो, घंटी बजाओ, या बजते स्वरित्र को पानी छुआओ और वह छींटे उड़ाता — हर ध्वनि अपने स्रोत में किस प्रकार की गति तक जाती?",
          mr: "ताणलेली दोरी छेडा, घंटा वाजवा, किंवा वाजणारा स्वरित्र पाण्याला स्पर्शा आणि ते तुषार उडवते — प्रत्येक ध्वनी आपल्या स्रोतातील कोणत्या प्रकारच्या गतीपर्यंत जाते?",
        },
        statement: {
          en: "Sound is produced by a vibrating body — a rapid to-and-fro shaking; stop the vibration and the sound dies at once, no matter the instrument.",
          hi: "ध्वनि कंपित पिंड से उत्पन्न — तेज़ आगे-पीछे हिलना; कंपन रोको तो ध्वनि तुरंत मरती, वाद्य कोई भी हो।",
          mr: "ध्वनी कंपित पिंडातून निर्माण — जलद पुढे-मागे हलणे; कंपन थांबवा तर ध्वनी लगेच मरते, वाद्य कोणतेही असो.",
        },
        detail: {
          en: "Rest a finger on a struck bell and both the ringing and the trembling stop together — proof the two are one.",
          hi: "बजी घंटी पर उँगली रखो और गूँज तथा कँपन दोनों साथ रुकते — प्रमाण कि दोनों एक।",
          mr: "वाजलेल्या घंटेवर बोट ठेवा आणि निनाद तसेच थरथर दोन्ही एकत्र थांबतात — पुरावा की दोन्ही एक.",
        },
        extra: {
          en: "Your own voice is your vocal cords vibrating; feel your throat as you hum and the buzz is right there under your fingers.",
          hi: "तुम्हारी अपनी आवाज़ तुम्हारे स्वर-तंतुओं का कंपन; गुनगुनाते गला छुओ और भनभनाहट ठीक उँगलियों के नीचे।",
          mr: "तुझा स्वतःचा आवाज तुझ्या स्वरतंतूंचे कंपन; गुणगुणताना गळा स्पर्शा आणि गुणगुण नेमकी बोटांखाली.",
        },
        pair: {
          left: {
            en: "Source shakes to and fro",
            hi: "स्रोत आगे-पीछे हिलता",
            mr: "स्रोत पुढे-मागे हलतो",
          },
          right: {
            en: "vibration makes sound",
            hi: "कंपन ध्वनि बनाता",
            mr: "कंपन ध्वनी बनवते",
          },
        },
      },
      {
        id: "medium-needed",
        name: {
          en: "Sound needs a medium",
          hi: "ध्वनि को माध्यम चाहिए",
          mr: "ध्वनीला माध्यम हवे",
        },
        kind: "idea",
        prompt: {
          en: "An electric bell ringing inside a jar grows fainter and fades to total silence as the air is pumped out, though you still see it striking. What does this prove sound must have to travel?",
          hi: "जार के भीतर बजती बिजली की घंटी हवा निकाले जाने पर मंद होती और पूर्ण मौन में लुप्त, यद्यपि तुम उसे बजते देखते। यह सिद्ध करता ध्वनि को चलने के लिए क्या चाहिए?",
          mr: "बरणीत वाजणारी विद्युत घंटी हवा काढल्यावर क्षीण होते आणि पूर्ण मौनात लुप्त, जरी तू तिला वाजताना पाहतोस. हे सिद्ध करते ध्वनीला चालायला काय हवे?",
        },
        statement: {
          en: "Sound needs a material medium — solid, liquid or gas — to carry it; across a vacuum, with no particles to pass the vibration along, it cannot travel at all.",
          hi: "ध्वनि को ढोने के लिए भौतिक माध्यम चाहिए — ठोस, द्रव या गैस; निर्वात में, कंपन आगे बढ़ाने को कण न होने से, वह बिलकुल नहीं चल सकती।",
          mr: "ध्वनीला वाहायला भौतिक माध्यम हवे — घन, द्रव वा वायू; निर्वातात, कंपन पुढे नेण्याला कण नसल्याने, ती मुळीच चालू शकत नाही.",
        },
        detail: {
          en: "This is why space is utterly silent — no explosion, however vast, can be heard across the airless void between the stars.",
          hi: "इसी से अंतरिक्ष पूर्णतः मौन — कोई विस्फोट, चाहे कितना विशाल, तारों के बीच हवाहीन शून्य के पार नहीं सुना जा सकता।",
          mr: "म्हणूनच अवकाश पूर्णपणे मौन — कोणताही स्फोट, कितीही अवाढव्य, ताऱ्यांमधल्या हवाहीन पोकळीपलीकडे ऐकू येत नाही.",
        },
        extra: {
          en: "Light needs no medium and crosses the vacuum freely, which is why you see the distant lightning yet, across empty space, would hear no thunder.",
          hi: "प्रकाश को माध्यम नहीं चाहिए और निर्वात मुक्त पार करता, इसी से तुम दूर की बिजली देखते फिर भी, खाली अंतरिक्ष के पार, कोई गर्जन नहीं सुनते।",
          mr: "प्रकाशाला माध्यम नको आणि निर्वात मुक्त ओलांडतो, म्हणूनच तू दूरची वीज पाहतोस तरी, रिकाम्या अवकाशापलीकडे, कोणतीही गर्जना ऐकत नाहीस.",
        },
        pair: {
          left: {
            en: "Falls silent in a vacuum",
            hi: "निर्वात में मौन हो जाती",
            mr: "निर्वातात मौन होते",
          },
          right: {
            en: "needs a material medium",
            hi: "भौतिक माध्यम चाहिए",
            mr: "भौतिक माध्यम हवे",
          },
        },
      },
      {
        id: "longitudinal-wave",
        name: {
          en: "A longitudinal wave",
          hi: "अनुदैर्घ्य तरंग",
          mr: "अनुतरंग",
        },
        kind: "idea",
        prompt: {
          en: "As sound moves through air, the particles shuffle back and forth along the very direction the sound travels, bunching and thinning. What is such a wave called?",
          hi: "जैसे ध्वनि हवा में चलती, कण ठीक उसी दिशा में जिधर ध्वनि जाती आगे-पीछे सरकते, गुँथते और छँटते। ऐसी तरंग क्या कहलाती?",
          mr: "जसे ध्वनी हवेत चालते, कण नेमक्या त्याच दिशेत जिकडे ध्वनी जाते पुढे-मागे सरकतात, दाटतात आणि विरळतात. अशी तरंग काय म्हणतात?",
        },
        statement: {
          en: "Sound is a longitudinal wave — the medium's particles vibrate back and forth along the same line the wave travels, creating compressions and rarefactions.",
          hi: "ध्वनि अनुदैर्घ्य तरंग है — माध्यम के कण उसी रेखा के अनुदिश आगे-पीछे कंपते जिधर तरंग चलती, संपीडन और विरलन बनाते।",
          mr: "ध्वनी अनुतरंग आहे — माध्यमाचे कण त्याच रेषेच्या दिशेने पुढे-मागे कंपतात जिकडे तरंग चालते, संपीडन आणि विरलन बनवतात.",
        },
        detail: {
          en: "A compression is where particles crowd close and pressure rises; a rarefaction is where they thin out and pressure drops — the two chase each other along.",
          hi: "संपीडन जहाँ कण पास भिड़ते और दाब चढ़ता; विरलन जहाँ वे छँटते और दाब गिरता — दोनों एक-दूसरे का पीछा करते चलते।",
          mr: "संपीडन जिथे कण जवळ दाटतात आणि दाब चढतो; विरलन जिथे ते विरळतात आणि दाब घटतो — दोन्ही एकमेकांचा पाठलाग करत चालतात.",
        },
        extra: {
          en: "You can watch the same pattern run down a stretched slinky pushed end-on — bands of coils squeezing tight then springing apart.",
          hi: "वही नमूना तुम छोर से धकेले खिंचे स्लिंकी में दौड़ता देख सकते — कुंडलियों की पट्टियाँ कसकर भिड़तीं फिर छिटकतीं।",
          mr: "तोच नमुना तू टोकाकडून ढकललेल्या ताणलेल्या स्लिंकीत धावताना पाहू शकतोस — वेटोळ्यांच्या पट्ट्या घट्ट दाटतात मग विलग होतात.",
        },
        pair: {
          left: {
            en: "Particles vibrate along the travel direction",
            hi: "कण चलने की दिशा में कंपते",
            mr: "कण चालण्याच्या दिशेत कंपतात",
          },
          right: {
            en: "a longitudinal wave",
            hi: "अनुदैर्घ्य तरंग",
            mr: "अनुतरंग",
          },
        },
      },
      {
        id: "pitch-loudness",
        name: {
          en: "Pitch and loudness",
          hi: "तारत्व और प्रबलता",
          mr: "स्वरमान आणि मोठेपणा",
        },
        kind: "idea",
        prompt: {
          en: "A whistle is shrill and a drum is deep; a whisper is soft and a shout is loud. Which property of the wave sets a note's highness, and which sets how loud it is?",
          hi: "सीटी तीखी और ढोल गहरा; फुसफुसाहट धीमी और चीख तेज़। तरंग का कौन-सा गुण स्वर की ऊँचाई तय करता, और कौन-सा वह कितनी तेज़?",
          mr: "शिट्टी तीक्ष्ण आणि ढोल खोल; कुजबुज मंद आणि किंकाळी मोठी. तरंगेचा कोणता गुण सुराची उंची ठरवतो, आणि कोणता ती किती मोठी?",
        },
        statement: {
          en: "The frequency of a sound wave sets its pitch — more vibrations per second means a higher note — while its amplitude sets the loudness, a bigger swing meaning a louder sound.",
          hi: "ध्वनि-तरंग की आवृत्ति उसका तारत्व तय करती — प्रति सेकंड अधिक कंपन यानी ऊँचा स्वर — जबकि उसका आयाम प्रबलता तय करता, बड़ा झूला यानी तेज़ ध्वनि।",
          mr: "ध्वनी-तरंगेची वारंवारता तिचे स्वरमान ठरवते — प्रति सेकंद अधिक कंपन म्हणजे उंच सूर — तर तिचा परमप्रसर मोठेपणा ठरवतो, मोठा झोका म्हणजे मोठा आवाज.",
        },
        detail: {
          en: "Frequency is counted in hertz, one hertz being one vibration each second; a child's voice runs at a higher frequency than an adult's.",
          hi: "आवृत्ति हर्ट्ज़ में गिनी, एक हर्ट्ज़ प्रति सेकंड एक कंपन; बच्चे की आवाज़ वयस्क से अधिक आवृत्ति पर चलती।",
          mr: "वारंवारता हर्ट्झमध्ये मोजली, एक हर्ट्झ म्हणजे प्रति सेकंद एक कंपन; मुलाचा आवाज प्रौढाहून अधिक वारंवारतेवर चालतो.",
        },
        extra: {
          en: "Pitch and loudness are independent: you can sing the same high note softly or at full volume, changing amplitude while frequency holds.",
          hi: "तारत्व और प्रबलता स्वतंत्र: तुम वही ऊँचा स्वर धीरे या पूरी आवाज़ में गा सकते, आयाम बदलते जबकि आवृत्ति टिकी।",
          mr: "स्वरमान आणि मोठेपणा स्वतंत्र: तू तोच उंच सूर हळू किंवा पूर्ण आवाजात गाऊ शकतोस, परमप्रसर बदलत तर वारंवारता टिकून.",
        },
        pair: {
          left: {
            en: "Vibrations per second sets the note's highness",
            hi: "प्रति सेकंड कंपन स्वर की ऊँचाई तय करे",
            mr: "प्रति सेकंद कंपन सुराची उंची ठरवते",
          },
          right: {
            en: "frequency (pitch)",
            hi: "आवृत्ति (तारत्व)",
            mr: "वारंवारता (स्वरमान)",
          },
        },
      },
      {
        id: "speed-in-media",
        name: {
          en: "Speed of sound in media",
          hi: "माध्यमों में ध्वनि की चाल",
          mr: "माध्यमांत ध्वनीची चाल",
        },
        kind: "idea",
        prompt: {
          en: "Put your ear to a steel rail and a distant tap arrives before the same tap heard through the air. In which kind of medium does sound race fastest — solid, liquid or gas?",
          hi: "इस्पात की पटरी पर कान लगाओ और दूर की ठोक हवा से सुनी उसी ठोक से पहले पहुँचती। ध्वनि किस प्रकार के माध्यम में सबसे तेज़ दौड़ती — ठोस, द्रव या गैस?",
          mr: "पोलादी रुळावर कान लावा आणि दूरचा ठोका हवेतून ऐकलेल्या त्याच ठोक्याआधी पोहोचतो. ध्वनी कोणत्या प्रकारच्या माध्यमात सर्वांत जलद धावते — घन, द्रव वा वायू?",
        },
        statement: {
          en: "Sound travels fastest through solids, slower through liquids and slowest through gases — the more tightly the particles are linked, the quicker they pass the vibration on.",
          hi: "ध्वनि ठोसों में सबसे तेज़, द्रवों में धीमी और गैसों में सबसे धीमी चलती — कण जितने कसकर जुड़े, उतनी तेज़ी से कंपन आगे बढ़ाते।",
          mr: "ध्वनी घनांत सर्वांत जलद, द्रवांत मंद आणि वायूंत सर्वांत मंद चालते — कण जितके घट्ट जोडलेले, तितक्या जलद कंपन पुढे नेतात.",
        },
        detail: {
          en: "In air sound crawls at about 340 metres a second, but in steel it flies nearly fifteen times faster — the rail delivers the tap first.",
          hi: "हवा में ध्वनि लगभग 340 मीटर प्रति सेकंड रेंगती, पर इस्पात में लगभग पंद्रह गुना तेज़ उड़ती — पटरी ठोक पहले पहुँचाती।",
          mr: "हवेत ध्वनी सुमारे 340 मीटर प्रति सेकंद रांगते, पण पोलादात जवळपास पंधरा पट जलद उडते — रूळ ठोका आधी पोहोचवतो.",
        },
        extra: {
          en: "This is the opposite of light, which is fastest in empty space and slows down inside matter — sound loves company, light does not.",
          hi: "यह प्रकाश के उल्टा, जो खाली अंतरिक्ष में सबसे तेज़ और पदार्थ में धीमा — ध्वनि संगत चाहती, प्रकाश नहीं।",
          mr: "हे प्रकाशाच्या उलट, जो रिकाम्या अवकाशात सर्वांत जलद आणि पदार्थात मंदावतो — ध्वनी सोबत चाहते, प्रकाश नाही.",
        },
        pair: {
          left: {
            en: "Fastest where particles are tightly linked",
            hi: "जहाँ कण कसकर जुड़े वहाँ सबसे तेज़",
            mr: "जिथे कण घट्ट जोडलेले तिथे सर्वांत जलद",
          },
          right: {
            en: "quickest in solids",
            hi: "ठोसों में सबसे तेज़",
            mr: "घनांत सर्वांत जलद",
          },
        },
      },
      {
        id: "echo-sonar",
        name: {
          en: "Echo and reflection",
          hi: "प्रतिध्वनि और परावर्तन",
          mr: "प्रतिध्वनी आणि परावर्तन",
        },
        kind: "idea",
        prompt: {
          en: "Shout across a valley and your words return a moment later; a ship pings the seabed and times the reply to read the depth. Which behaviour of sound — bouncing off a surface — lies behind both?",
          hi: "घाटी के पार चिल्लाओ और तुम्हारे शब्द क्षण-भर बाद लौटते; जहाज़ समुद्र-तल पर ध्वनि भेजता और उत्तर का समय लेकर गहराई पढ़ता। ध्वनि का कौन-सा व्यवहार — सतह से टकराना — दोनों के पीछे?",
          mr: "दरीपलीकडे ओरडा आणि तुझे शब्द क्षणभराने परततात; जहाज समुद्रतळावर ध्वनी पाठवते आणि उत्तराचा वेळ घेऊन खोली वाचते. ध्वनीचे कोणते वर्तन — पृष्ठावर आदळणे — दोन्हीमागे?",
        },
        statement: {
          en: "Sound reflects off hard surfaces, and a reflection heard as a separate repeat is an echo; timing such a reflected pulse lets sonar measure how far away the surface is.",
          hi: "ध्वनि कठोर सतहों से परावर्तित होती, और अलग दोहराव बनकर सुना परावर्तन प्रतिध्वनि है; ऐसी परावर्तित स्पंद का समय लेकर सोनार नापता सतह कितनी दूर।",
          mr: "ध्वनी कठीण पृष्ठांवरून परावर्तित होते, आणि वेगळा पुनरुच्चार बनून ऐकलेले परावर्तन प्रतिध्वनी आहे; अशा परावर्तित स्पंदाचा वेळ घेऊन सोनार मोजते पृष्ठ किती दूर.",
        },
        detail: {
          en: "Because the pulse travels to the surface and back, the distance is speed times time divided by two — the trip is counted twice over.",
          hi: "स्पंद सतह तक और वापस चलता, अतः दूरी चाल गुणा समय बटा दो — यात्रा दो बार गिनी जाती।",
          mr: "स्पंद पृष्ठापर्यंत आणि परत चालतो, म्हणून अंतर चाल गुणिले वेळ भागिले दोन — प्रवास दोनदा मोजला जातो.",
        },
        extra: {
          en: "Bats and dolphins do this by ear, sending out squeaks and reading the echoes to hunt in the dark — nature's own sonar.",
          hi: "चमगादड़ और डॉल्फ़िन यह कान से करते, चीख भेजकर और प्रतिध्वनि पढ़कर अँधेरे में शिकार — प्रकृति का अपना सोनार।",
          mr: "वटवाघळे आणि डॉल्फिन हे कानाने करतात, किंकाळ्या पाठवून आणि प्रतिध्वनी वाचून अंधारात शिकार — निसर्गाचे स्वतःचे सोनार.",
        },
        pair: {
          left: {
            en: "A reflection timed to measure distance",
            hi: "दूरी नापने को समयबद्ध परावर्तन",
            mr: "अंतर मोजायला वेळबद्ध परावर्तन",
          },
          right: {
            en: "echo and sonar",
            hi: "प्रतिध्वनि और सोनार",
            mr: "प्रतिध्वनी आणि सोनार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "During a thunderstorm you almost always SEE the flash of lightning several seconds before you HEAR the thunder, even though both are born at the same instant in the same cloud. What explains the gap — and how could you use it to guess how far the storm is?",
          hi: "आँधी में तुम प्रायः बिजली की चमक गर्जन सुनने से कई सेकंड पहले देखते, यद्यपि दोनों उसी क्षण उसी बादल में जन्मते। अंतर क्या समझाता — और तुम इससे कैसे अंदाज़ लगा सकते तूफ़ान कितना दूर?",
          mr: "वादळात तू बहुधा विजेची चमक गर्जना ऐकण्याआधी काही सेकंद पाहतोस, जरी दोन्ही त्याच क्षणी त्याच ढगात जन्मतात. फरक काय समजावतो — आणि तू यातून कसा अंदाज लावू शकतोस वादळ किती दूर?",
        },
        choices: [
          {
            en: "Light travels almost a million times faster than sound, so the flash reaches you almost instantly while the thunder crawls at about 340 m/s. Counting the seconds and multiplying by 340 m gives the storm's rough distance",
            hi: "प्रकाश ध्वनि से लगभग दस लाख गुना तेज़ चलता, अतः चमक लगभग तुरंत पहुँचती जबकि गर्जन लगभग 340 मी/से रेंगता। सेकंड गिनकर 340 मी से गुणा करने पर तूफ़ान की मोटी दूरी",
            mr: "प्रकाश ध्वनीहून जवळपास दहा लाख पट जलद चालतो, म्हणून चमक जवळपास लगेच पोहोचते तर गर्जना सुमारे 340 मी/से रांगते. सेकंद मोजून 340 मी ने गुणल्यास वादळाचे ढोबळ अंतर",
          },
          {
            en: "Thunder is simply created a few seconds after the lightning",
            hi: "गर्जन बस बिजली के कुछ सेकंड बाद बनता",
            mr: "गर्जना फक्त विजेच्या काही सेकंदांनी बनते",
          },
          {
            en: "Your eyes react faster than your ears, so the sound arrives on time but is noticed late",
            hi: "तुम्हारी आँखें कानों से तेज़ प्रतिक्रिया करतीं, अतः ध्वनि समय पर पहुँचती पर देर से जानी जाती",
            mr: "तुझे डोळे कानांहून जलद प्रतिक्रिया देतात, म्हणून ध्वनी वेळेवर पोहोचते पण उशिरा जाणवते",
          },
          {
            en: "Sound cannot travel through storm clouds and must find a way around",
            hi: "ध्वनि आँधी के बादलों से नहीं चल सकती और चक्कर काटकर आती",
            mr: "ध्वनी वादळी ढगांतून चालू शकत नाही आणि वळसा घालून येते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Lightning and thunder are one event — the flash and the crash begin together — so the delay is entirely a race between two messengers of very different speed. Light travels at about 300,000 kilometres every second, so from a storm a few kilometres away the flash reaches your eyes in a tiny fraction of a millisecond, effectively at once. Sound, though, crawls through air at only about 340 metres per second — nearly a million times slower — so the thunder needs several seconds to cover the same few kilometres. That mismatch is the gap you notice. It also hands you a simple ruler: start counting the moment you see the flash and stop when the thunder arrives; each second of delay means the sound covered roughly 340 metres, so about three seconds means the storm is roughly a kilometre off. If the flash and bang land together, the strike is almost on top of you. The same speed gap is why a distant cricket shot is seen struck before the crack is heard, and why fireworks bloom silently a beat before their boom.",
          hi: "बिजली और गर्जन एक घटना — चमक और कड़क साथ शुरू होते — अतः देरी पूरी तरह दो बहुत भिन्न-चाल दूतों की दौड़। प्रकाश लगभग 3,00,000 किलोमीटर प्रति सेकंड चलता, अतः कुछ किलोमीटर दूर तूफ़ान से चमक तुम्हारी आँखों तक मिलीसेकंड के नन्हे अंश में पहुँचती, प्रभावतः तुरंत। ध्वनि, पर, हवा में केवल लगभग 340 मीटर प्रति सेकंड रेंगती — लगभग दस लाख गुना धीमी — अतः गर्जन को उन्हीं कुछ किलोमीटर को पार करने में कई सेकंड। वही बेमेल तुम्हारा देखा अंतर। यह तुम्हें सरल फुट्टा भी देता: चमक देखते ही गिनना शुरू करो और गर्जन आते रोको; देरी का हर सेकंड यानी ध्वनि ने लगभग 340 मीटर तय किया, अतः लगभग तीन सेकंड यानी तूफ़ान लगभग एक किलोमीटर दूर। यदि चमक और धमाका साथ पड़ें, प्रहार लगभग तुम्हारे ऊपर। वही चाल-अंतर कारण कि दूर का क्रिकेट शॉट कड़क सुनने से पहले लगा दिखता, और आतिशबाज़ी अपने धमाके से एक धड़कन पहले मौन खिलती।",
          mr: "वीज आणि गर्जना एक घटना — चमक आणि कडकडाट एकत्र सुरू होतात — म्हणून विलंब पूर्णपणे दोन अतिशय वेगळ्या-चालीच्या दूतांची शर्यत. प्रकाश सुमारे 3,00,000 किलोमीटर प्रति सेकंद चालतो, म्हणून काही किलोमीटर दूरच्या वादळातून चमक तुझ्या डोळ्यांपर्यंत मिलिसेकंदाच्या इवल्या अंशात पोहोचते, प्रत्यक्षात लगेच. ध्वनी मात्र हवेत फक्त सुमारे 340 मीटर प्रति सेकंद रांगते — जवळपास दहा लाख पट मंद — म्हणून गर्जनेला त्याच काही किलोमीटर ओलांडायला अनेक सेकंद. तीच विसंगती तुला जाणवणारा फरक. ती तुला एक सोपे मोजपट्टीही देते: चमक दिसताच मोजायला सुरू करा आणि गर्जना येताच थांबा; विलंबाचा प्रत्येक सेकंद म्हणजे ध्वनीने सुमारे 340 मीटर ओलांडले, म्हणून सुमारे तीन सेकंद म्हणजे वादळ सुमारे एक किलोमीटर दूर. जर चमक आणि धमाका एकत्र पडले, प्रहार जवळपास तुझ्या डोक्यावर. तीच चाल-दरी कारण की दूरचा क्रिकेट फटका कडकडाट ऐकण्याआधी मारलेला दिसतो, आणि फटाके आपल्या धमाक्याआधी एक ठोका मौन फुलतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A ship's sonar sends a sound pulse straight down and hears its echo return from the seabed 3 seconds later. Taking the speed of sound in sea water as 1500 m/s, how deep is the sea — and why must you not simply multiply 1500 by 3?",
          hi: "एक जहाज़ का सोनार ध्वनि-स्पंद सीधे नीचे भेजता और समुद्र-तल से उसकी प्रतिध्वनि 3 सेकंड बाद सुनता। समुद्री पानी में ध्वनि की चाल 1500 मी/से लेकर, समुद्र कितना गहरा — और तुम्हें सीधे 1500 को 3 से गुणा क्यों नहीं करना?",
          mr: "एका जहाजाचा सोनार ध्वनी-स्पंद सरळ खाली पाठवतो आणि समुद्रतळावरून त्याची प्रतिध्वनी 3 सेकंदांनी ऐकतो. समुद्री पाण्यात ध्वनीची चाल 1500 मी/से घेऊन, समुद्र किती खोल — आणि तू सरळ 1500 ला 3 ने का गुणू नये?",
        },
        choices: [
          {
            en: "The pulse travels down AND back, so 3 seconds covers twice the depth. Total path = 1500 × 3 = 4500 m, and the depth is half of that, 2250 m",
            hi: "स्पंद नीचे और वापस चलता, अतः 3 सेकंड दुगुनी गहराई तय करते। कुल रास्ता = 1500 × 3 = 4500 मी, और गहराई उसकी आधी, 2250 मी",
            mr: "स्पंद खाली आणि परत चालतो, म्हणून 3 सेकंद दुप्पट खोली ओलांडतात. एकूण मार्ग = 1500 × 3 = 4500 मी, आणि खोली त्याची अर्धी, 2250 मी",
          },
          {
            en: "The depth is 1500 × 3 = 4500 m, counting the trip once",
            hi: "गहराई 1500 × 3 = 4500 मी, यात्रा एक बार गिनकर",
            mr: "खोली 1500 × 3 = 4500 मी, प्रवास एकदा मोजून",
          },
          {
            en: "The depth is 1500 ÷ 3 = 500 m",
            hi: "गहराई 1500 ÷ 3 = 500 मी",
            mr: "खोली 1500 ÷ 3 = 500 मी",
          },
          {
            en: "The depth cannot be found without knowing the water's temperature",
            hi: "पानी का तापमान जाने बिना गहराई नहीं मिल सकती",
            mr: "पाण्याचे तापमान जाणल्याविना खोली सापडू शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The trap is that the 3 seconds is a ROUND trip, not a one-way journey. When the sonar fires its pulse, that sound must travel all the way down to the seabed, bounce off it, and travel all the way back up to the ship's receiver before the echo is heard — so in those 3 seconds the sound has covered the depth twice over, once going and once returning. First find the whole path length: distance = speed × time = 1500 m/s × 3 s = 4500 m. That 4500 m is down-and-up together, so the actual depth is half of it: 4500 ÷ 2 = 2250 m. Multiplying 1500 by 3 directly would give the total there-and-back path and so double the true depth — the classic sonar mistake. This 'halve it' step is built into every echo measurement, whether a bat judging a wall, a doctor's ultrasound scan, or a ship sounding the ocean: the pulse always pays for a return ticket, so you divide the round-trip distance by two to get the one-way distance you actually want.",
          hi: "जाल यह कि 3 सेकंड एक चक्कर की यात्रा, एकतरफ़ा नहीं। जब सोनार स्पंद दागता, वह ध्वनि सारा नीचे समुद्र-तल तक चले, उससे टकराए, और सारा वापस जहाज़ के ग्राही तक ऊपर चले तभी प्रतिध्वनि सुनी जाती — अतः उन 3 सेकंड में ध्वनि ने गहराई दो बार तय की, एक बार जाते एक बार लौटते। पहले पूरा रास्ता निकालो: दूरी = चाल × समय = 1500 मी/से × 3 से = 4500 मी। वह 4500 मी नीचे-और-ऊपर साथ, अतः असली गहराई उसकी आधी: 4500 ÷ 2 = 2250 मी। सीधे 1500 को 3 से गुणा करने पर कुल आने-जाने का रास्ता मिलता और असली गहराई दुगुनी — क्लासिक सोनार भूल। यह 'आधा करो' क़दम हर प्रतिध्वनि मापन में गुँथा, चाहे चमगादड़ दीवार आँकता, डॉक्टर का अल्ट्रासाउंड, या जहाज़ समुद्र थाहता: स्पंद सदा वापसी टिकट चुकाता, अतः चक्कर-दूरी को दो से बाँटकर असली एकतरफ़ा दूरी पाओ जो तुम्हें चाहिए।",
          mr: "सापळा हा की 3 सेकंद एक फेरीचा प्रवास, एकमार्गी नाही. जेव्हा सोनार स्पंद झाडतो, ती ध्वनी सगळी खाली समुद्रतळापर्यंत चालावी, त्यावर आदळावी, आणि सगळी परत जहाजाच्या ग्राहकापर्यंत वर चालावी तेव्हाच प्रतिध्वनी ऐकली जाते — म्हणून त्या 3 सेकंदांत ध्वनीने खोली दोनदा ओलांडली, एकदा जाताना एकदा परतताना. आधी संपूर्ण मार्ग काढा: अंतर = चाल × वेळ = 1500 मी/से × 3 से = 4500 मी. ते 4500 मी खाली-आणि-वर एकत्र, म्हणून खरी खोली त्याची अर्धी: 4500 ÷ 2 = 2250 मी. सरळ 1500 ला 3 ने गुणल्यास एकूण जाण्या-येण्याचा मार्ग मिळतो आणि खरी खोली दुप्पट — क्लासिक सोनार चूक. हे 'अर्धे करा' पाऊल प्रत्येक प्रतिध्वनी मापनात गुंफलेले, वटवाघूळ भिंत मोजो, डॉक्टरचे अल्ट्रासाऊंड, वा जहाज समुद्र थाहो: स्पंद सदैव परतीचे तिकीट भरतो, म्हणून फेरी-अंतराला दोनने भागून खरे एकमार्गी अंतर मिळवा जे तुला हवे.",
        },
      },
    ],
  },
];
