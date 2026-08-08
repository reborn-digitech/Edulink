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
];
