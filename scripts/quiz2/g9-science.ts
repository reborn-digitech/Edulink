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
];
