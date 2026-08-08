/**
 * Class 3 EVS — NCERT "Looking Around", chapter by chapter, through the
 * conceptual engine. The authoring voice matters here more than anywhere:
 * these read aloud to eight-year-olds, so prompts are short, concrete and
 * about things a child has seen. Same distractor rule as everywhere — every
 * statement must be false of every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Looking Around (Class 3)";
const LICENCE = "CC-BY-SA-4.0";

export const G3_EVS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Poonam's Day Out (animals around us)                        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-poonams-day-out",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 1 — Poonam's Day Out",
      hi: "अध्याय 1 — पूनम की सैर",
      mr: "प्रकरण 1 — पूनमची सहल",
    },
    name: {
      en: "Poonam's Day Out",
      hi: "पूनम की सैर",
      mr: "पूनमची सहल",
    },
    summary: {
      en: "The animals a walk can show you — who flies, who crawls, who hops, and who follows you home.",
      hi: "एक सैर में दिखने वाले जानवर — कौन उड़ता है, कौन रेंगता है, कौन फुदकता है, और कौन घर तक पीछे आता है।",
      mr: "फेरफटक्यात दिसणारे प्राणी — कोण उडते, कोण सरपटते, कोण टुणटुण उड्या मारते, आणि कोण घरापर्यंत मागे येते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "crow",
        name: { en: "The crow", hi: "कौआ", mr: "कावळा" },
        kind: "bird",
        prompt: {
          en: "Which black bird caws loudly and will snatch a roti straight from a plate?",
          hi: "कौन-सा काला पक्षी ज़ोर से काँव-काँव करता है और थाली से रोटी तक उठा ले जाता है?",
          mr: "कोणता काळा पक्षी मोठ्याने काव-काव करतो आणि ताटातली पोळीसुद्धा पळवतो?",
        },
        statement: {
          en: "The crow is black, calls 'caw caw', and boldly picks up food left in the open.",
          hi: "कौआ काला होता है, 'काँव-काँव' बोलता है, और खुले में रखा खाना बेझिझक उठा लेता है।",
          mr: "कावळा काळा असतो, 'काव-काव' ओरडतो, आणि उघड्यावर ठेवलेले अन्न बिनधास्त उचलतो.",
        },
        detail: {
          en: "This bird builds its untidy nest of twigs high up in trees.",
          hi: "यह पक्षी पेड़ों पर ऊँचाई पर टहनियों का बिखरा-सा घोंसला बनाता है।",
          mr: "हा पक्षी झाडांवर उंचावर काटक्यांचे पसरट घरटे बांधतो.",
        },
        pair: {
          left: { en: "The crow", hi: "कौआ", mr: "कावळा" },
          right: { en: "caw caw", hi: "काँव-काँव", mr: "काव-काव" },
        },
      },
      {
        id: "sparrow",
        name: { en: "The sparrow", hi: "गौरैया", mr: "चिमणी" },
        kind: "bird",
        prompt: {
          en: "Which small brown bird chirps and hops about, and sometimes nests inside houses?",
          hi: "कौन-सा छोटा भूरा पक्षी चीं-चीं करता और फुदकता है, और कभी-कभी घरों के अंदर घोंसला बनाता है?",
          mr: "कोणता लहान तपकिरी पक्षी चिवचिवतो आणि टुणटुण उडतो, आणि कधीकधी घरातही घरटे बांधतो?",
        },
        statement: {
          en: "The sparrow is a small brown bird that chirps and hops close to people's homes.",
          hi: "गौरैया छोटा भूरा पक्षी है जो चीं-चीं करती है और लोगों के घरों के पास फुदकती रहती है।",
          mr: "चिमणी हा लहान तपकिरी पक्षी आहे; ती चिवचिवते आणि माणसांच्या घरांजवळ टुणटुण फिरते.",
        },
        detail: {
          en: "This little bird picks up scattered grain, one seed at a time.",
          hi: "यह नन्ही चिड़िया बिखरे दाने एक-एक करके चुगती है।",
          mr: "ही चिमुकली पक्षीण विखुरलेले दाणे एक-एक करून टिपते.",
        },
      },
      {
        id: "cow",
        name: { en: "The cow", hi: "गाय", mr: "गाय" },
        kind: "big-animal",
        prompt: {
          en: "Which large animal chews grass slowly for hours and gives us milk?",
          hi: "कौन-सा बड़ा जानवर घंटों धीरे-धीरे घास चबाता है और हमें दूध देता है?",
          mr: "कोणता मोठा प्राणी तासन्तास हळूहळू गवत चघळतो आणि आपल्याला दूध देतो?",
        },
        statement: {
          en: "The cow eats grass, chews it again and again, and gives us milk.",
          hi: "गाय घास खाती है, उसे बार-बार चबाती है, और हमें दूध देती है।",
          mr: "गाय गवत खाते, ते पुन्हा-पुन्हा चघळते, आणि आपल्याला दूध देते.",
        },
        detail: {
          en: "This animal's calf runs to it on wobbly legs to drink.",
          hi: "इस जानवर का बछड़ा डगमगाते पैरों से दूध पीने उसके पास दौड़ता है।",
          mr: "या प्राण्याचे वासरू लटपटत्या पायांनी दूध प्यायला तिच्याकडे धावते.",
        },
        pair: {
          left: { en: "The cow", hi: "गाय", mr: "गाय" },
          right: { en: "milk", hi: "दूध", mr: "दूध" },
        },
      },
      {
        id: "dog",
        name: { en: "The dog", hi: "कुत्ता", mr: "कुत्रा" },
        kind: "big-animal",
        prompt: {
          en: "Which animal wags its tail when happy and often follows people down the lane?",
          hi: "कौन-सा जानवर ख़ुश होने पर पूँछ हिलाता है और अक्सर गली में लोगों के पीछे-पीछे चलता है?",
          mr: "कोणता प्राणी आनंदात शेपटी हलवतो आणि अनेकदा गल्लीत माणसांच्या मागे-मागे चालतो?",
        },
        statement: {
          en: "The dog wags its tail, guards houses, and can follow a smell along the ground.",
          hi: "कुत्ता पूँछ हिलाता है, घरों की रखवाली करता है, और ज़मीन पर सूँघते-सूँघते किसी गंध का पीछा कर सकता है।",
          mr: "कुत्रा शेपटी हलवतो, घरांची राखण करतो, आणि जमिनीवरचा वास हुंगत माग काढू शकतो.",
        },
        detail: {
          en: "This animal barks at strangers but licks the hands of friends.",
          hi: "यह जानवर अजनबियों पर भौंकता है पर दोस्तों के हाथ चाटता है।",
          mr: "हा प्राणी अनोळखी माणसांवर भुंकतो पण मित्रांचे हात चाटतो.",
        },
      },
      {
        id: "lizard",
        name: { en: "The lizard", hi: "छिपकली", mr: "पाल" },
        kind: "small-animal",
        prompt: {
          en: "Which small animal walks UPSIDE DOWN on the ceiling and catches insects near the light?",
          hi: "कौन-सा छोटा जीव छत पर उल्टा चलता है और बत्ती के पास कीड़े पकड़ता है?",
          mr: "कोणता लहान प्राणी छतावर उलटा चालतो आणि दिव्याजवळचे किडे पकडतो?",
        },
        statement: {
          en: "The lizard can walk upside down on the ceiling and waits near lights to catch insects.",
          hi: "छिपकली छत पर उल्टी चल सकती है और कीड़े पकड़ने के लिए बत्तियों के पास ताक लगाती है।",
          mr: "पाल छतावर उलटी चालू शकते आणि किडे पकडायला दिव्यांजवळ टपून बसते.",
        },
        detail: {
          en: "When in danger, this creature can drop its tail and grow it again.",
          hi: "ख़तरे में यह जीव अपनी पूँछ गिरा देता है और फिर से उगा लेता है।",
          mr: "धोक्यात हा प्राणी आपली शेपूट टाकून देतो आणि पुन्हा वाढवतो.",
        },
        extra: {
          en: "It clings to walls with tiny pads on its toes.",
          hi: "यह अपने पंजों की नन्ही गद्दियों से दीवारों पर चिपकता है।",
          mr: "तो बोटांवरील चिमुकल्या गाद्यांनी भिंतींना चिकटतो.",
        },
        pair: {
          left: { en: "The lizard", hi: "छिपकली", mr: "पाल" },
          right: { en: "the ceiling", hi: "छत", mr: "छत" },
        },
      },
      {
        id: "ant",
        name: { en: "The ant", hi: "चींटी", mr: "मुंगी" },
        kind: "small-animal",
        prompt: {
          en: "Which tiny creature marches in a long line and can carry food bigger than itself?",
          hi: "कौन-सा नन्हा जीव लंबी क़तार में चलता है और अपने से बड़ा खाना उठा सकता है?",
          mr: "कोणता चिमुकला प्राणी लांब रांगेत चालतो आणि स्वतःहून मोठे अन्न उचलू शकतो?",
        },
        statement: {
          en: "Ants move in long lines, and one ant can carry food heavier than its own body.",
          hi: "चींटियाँ लंबी क़तारों में चलती हैं, और एक चींटी अपने शरीर से भारी खाना उठा सकती है।",
          mr: "मुंग्या लांब रांगांनी चालतात, आणि एक मुंगी स्वतःच्या शरीराहून जड अन्न उचलू शकते.",
        },
        detail: {
          en: "Drop a little sugar on the floor, and this insect's whole line finds it by morning.",
          hi: "फ़र्श पर थोड़ी चीनी गिरा दें, तो सुबह तक इस कीट की पूरी क़तार उसे ढूँढ़ लेती है।",
          mr: "जमिनीवर थोडी साखर सांडा, सकाळपर्यंत या किड्याची अख्खी रांग ती शोधून काढते.",
        },
        pair: {
          left: { en: "The ant", hi: "चींटी", mr: "मुंगी" },
          right: { en: "a long line", hi: "लंबी क़तार", mr: "लांब रांग" },
        },
      },
      {
        id: "frog",
        name: { en: "The frog", hi: "मेंढक", mr: "बेडूक" },
        kind: "small-animal",
        prompt: {
          en: "Which animal hops on strong back legs and croaks loudly when the rains come?",
          hi: "कौन-सा जानवर मज़बूत पिछली टाँगों से फुदकता है और बारिश आने पर ज़ोर से टर्राता है?",
          mr: "कोणता प्राणी मजबूत मागच्या पायांनी उड्या मारतो आणि पाऊस आला की मोठ्याने डराव-डराव करतो?",
        },
        statement: {
          en: "The frog hops on its strong back legs and croaks the loudest in the rainy season.",
          hi: "मेंढक अपनी मज़बूत पिछली टाँगों से फुदकता है और बरसात में सबसे ज़ोर से टर्राता है।",
          mr: "बेडूक मजबूत मागच्या पायांनी उड्या मारतो आणि पावसाळ्यात सर्वांत मोठ्याने ओरडतो.",
        },
        detail: {
          en: "This animal is as happy in a pond as on the bank beside it.",
          hi: "यह जीव तालाब में भी उतना ही ख़ुश रहता है जितना उसके किनारे पर।",
          mr: "हा प्राणी तळ्यात जितका खूश तितकाच काठावरही असतो.",
        },
        pair: {
          left: { en: "The frog", hi: "मेंढक", mr: "बेडूक" },
          right: { en: "the rainy season", hi: "बरसात", mr: "पावसाळा" },
        },
      },
      {
        id: "butterfly",
        name: { en: "The butterfly", hi: "तितली", mr: "फुलपाखरू" },
        kind: "small-animal",
        prompt: {
          en: "Which insect with bright, patterned wings flutters from flower to flower?",
          hi: "चमकीले, नक़्शीदार पंखों वाला कौन-सा कीट फूल-फूल पर मँडराता है?",
          mr: "चमकदार, नक्षीदार पंखांचा कोणता किडा फुलाफुलांवर भिरभिरतो?",
        },
        statement: {
          en: "The butterfly has bright patterned wings and drinks nectar from flowers.",
          hi: "तितली के चमकीले नक़्शीदार पंख होते हैं और वह फूलों से रस पीती है।",
          mr: "फुलपाखराला चमकदार नक्षीदार पंख असतात आणि ते फुलांतील मध पिते.",
        },
        detail: {
          en: "Hold still, and this visitor may land on your finger for a moment — its wings feel like paper.",
          hi: "स्थिर खड़े रहें, तो यह मेहमान पल भर को आपकी उँगली पर बैठ सकता है — इसके पंख काग़ज़ जैसे लगते हैं।",
          mr: "स्तब्ध उभे राहा, हा पाहुणा क्षणभर तुमच्या बोटावर बसेल — त्याचे पंख कागदासारखे वाटतात.",
        },
      },
      {
        id: "pigeon",
        name: { en: "The pigeon", hi: "कबूतर", mr: "कबूतर" },
        kind: "bird",
        prompt: {
          en: "Which grey bird says 'gutur-goo', bobs its head as it walks, and crowds rooftops and ledges?",
          hi: "कौन-सा सलेटी पक्षी 'गुटर-गूँ' बोलता है, चलते हुए सिर हिलाता है, और छतों-मुँडेरों पर झुंड बनाता है?",
          mr: "कोणता करडा पक्षी 'गुटर्र-गूं' करतो, चालताना मान डोलावतो, आणि गच्च्या-कठड्यांवर थवा करतो?",
        },
        statement: {
          en: "The pigeon is grey, murmurs 'gutur-goo', and gathers in flocks on rooftops and window ledges.",
          hi: "कबूतर सलेटी होता है, 'गुटर-गूँ' गुनगुनाता है, और छतों तथा खिड़की की मुँडेरों पर झुंड में जुटता है।",
          mr: "कबूतर करडे असते, 'गुटर्र-गूं' गुणगुणते, आणि गच्च्यांवर व खिडकीच्या कठड्यांवर थव्याने जमते.",
        },
        detail: {
          en: "Long ago, trained birds of this kind carried letters tied to their legs.",
          hi: "बहुत पहले, इसी पक्षी को सिखाकर पैरों में बँधी चिट्ठियाँ भिजवाई जाती थीं।",
          mr: "फार पूर्वी, याच पक्ष्याला शिकवून पायाला बांधलेली पत्रे पाठवली जात.",
        },
      },
      {
        id: "buffalo",
        name: { en: "The buffalo", hi: "भैंस", mr: "म्हैस" },
        kind: "big-animal",
        prompt: {
          en: "Which big black animal loves to sit in ponds and muddy water on hot days?",
          hi: "कौन-सा बड़ा काला जानवर गर्मी के दिनों में तालाबों और कीचड़-भरे पानी में बैठना पसंद करता है?",
          mr: "कोणता मोठा काळा प्राणी उन्हाळ्यात तळ्यांत आणि चिखलाच्या पाण्यात बसायला आवडतो?",
        },
        statement: {
          en: "The buffalo is big and black and cools itself by sitting in ponds and mud.",
          hi: "भैंस बड़ी और काली होती है और तालाब या कीचड़ में बैठकर ख़ुद को ठंडा रखती है।",
          mr: "म्हैस मोठी आणि काळी असते आणि तळ्यात वा चिखलात बसून स्वतःला थंड ठेवते.",
        },
        detail: {
          en: "Its thick curved horns sweep back over its head.",
          hi: "इसके मोटे मुड़े हुए सींग सिर के ऊपर पीछे की ओर झुके होते हैं।",
          mr: "तिची जाड वळलेली शिंगे डोक्यावरून मागे झुकलेली असतात.",
        },
        pair: {
          left: { en: "The buffalo", hi: "भैंस", mr: "म्हैस" },
          right: { en: "muddy water", hi: "कीचड़-भरा पानी", mr: "चिखलाचे पाणी" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Poonam sorted animals by HOW THEY MOVE. Which one of these did she put in the WRONG group?",
          hi: "पूनम ने जानवरों को चलने के तरीक़े से छाँटा। इनमें से किसे उसने ग़लत समूह में रख दिया?",
          mr: "पूनमने प्राण्यांची हालचालीनुसार वर्गवारी केली. यांपैकी कोणाला तिने चुकीच्या गटात ठेवले?",
        },
        choices: [
          {
            en: "Flies: crow, pigeon, lizard",
            hi: "उड़ने वाले: कौआ, कबूतर, छिपकली",
            mr: "उडणारे: कावळा, कबूतर, पाल",
          },
          {
            en: "Hops: frog, sparrow",
            hi: "फुदकने वाले: मेंढक, गौरैया",
            mr: "उड्या मारणारे: बेडूक, चिमणी",
          },
          {
            en: "Walks: cow, buffalo, dog",
            hi: "चलने वाले: गाय, भैंस, कुत्ता",
            mr: "चालणारे: गाय, म्हैस, कुत्रा",
          },
          {
            en: "Crawls in lines: ant",
            hi: "क़तार में रेंगने वाले: चींटी",
            mr: "रांगेत सरपटणारे: मुंगी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The lizard cannot fly — it climbs and clings, even upside down on ceilings, but it has no wings. Crow and pigeon fly; frog and sparrow hop; cow, buffalo and dog walk; ants go in lines. One wrong member spoils a sorting, and finding it is the whole game.",
          hi: "छिपकली उड़ नहीं सकती — वह चढ़ती और चिपकती है, छत पर उल्टी भी, पर उसके पंख नहीं। कौआ-कबूतर उड़ते हैं; मेंढक-गौरैया फुदकते हैं; गाय, भैंस, कुत्ता चलते हैं; चींटियाँ क़तार में। एक ग़लत सदस्य पूरी छँटाई बिगाड़ देता है, और उसे ढूँढ़ना ही खेल है।",
          mr: "पाल उडू शकत नाही — ती चढते आणि चिकटते, छतावर उलटीसुद्धा, पण तिला पंख नाहीत. कावळा-कबूतर उडतात; बेडूक-चिमणी उड्या मारतात; गाय, म्हैस, कुत्रा चालतात; मुंग्या रांगेने. एक चुकीचा सदस्य अख्खी वर्गवारी बिघडवतो, आणि तो शोधणे हाच खेळ.",
        },
      },
      {
        level: 6,
        stem: {
          en: "At night Poonam heard something near the light, and by morning the insects that buzzed there were gone. Which visitor most likely ate them?",
          hi: "रात में पूनम को बत्ती के पास कुछ सुनाई दिया, और सुबह तक वहाँ भिनभिनाते कीड़े ग़ायब थे। सबसे अधिक संभावना है कि उन्हें किस मेहमान ने खाया?",
          mr: "रात्री पूनमला दिव्याजवळ काहीतरी ऐकू आले, आणि सकाळपर्यंत तिथले गुणगुणणारे किडे गायब होते. बहुधा त्यांना कोणत्या पाहुण्याने खाल्ले असेल?",
        },
        choices: [
          { en: "The lizard", hi: "छिपकली", mr: "पाल" },
          { en: "The cow", hi: "गाय", mr: "गाय" },
          { en: "The butterfly", hi: "तितली", mr: "फुलपाखरू" },
          { en: "The pigeon", hi: "कबूतर", mr: "कबूतर" },
        ],
        answerIndex: 0,
        solution: {
          en: "Insects gather at lights, and the lizard waits exactly there — that is its hunting spot. The cow eats grass, the butterfly drinks nectar, and the pigeon pecks grain by day. Matching the eater to the food and the place is how a scientist would think about it.",
          hi: "कीड़े बत्ती के पास जुटते हैं, और छिपकली ठीक वहीं ताक में रहती है — वही उसका शिकारगाह है। गाय घास खाती है, तितली रस पीती है, और कबूतर दिन में दाना चुगता है। खाने वाले को उसके खाने और जगह से मिलाना — वैज्ञानिक ऐसे ही सोचता है।",
          mr: "किडे दिव्याजवळ जमतात, आणि पाल नेमकी तिथेच टपलेली असते — तीच तिची शिकारीची जागा. गाय गवत खाते, फुलपाखरू मध पिते, आणि कबूतर दिवसा दाणे टिपते. खाणाऱ्याची त्याच्या खाण्याशी आणि जागेशी सांगड घालणे — शास्त्रज्ञ असाच विचार करतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Poonam saw claw marks going UP a dusty wall and a fallen, still-wriggling tail on the floor below. What had happened there?",
          hi: "पूनम ने धूल-भरी दीवार पर ऊपर जाते पंजों के निशान देखे और नीचे फ़र्श पर गिरी, अब भी हिलती पूँछ। वहाँ क्या हुआ था?",
          mr: "पूनमला धुळीच्या भिंतीवर वर जाणाऱ्या नख्यांच्या खुणा दिसल्या आणि खाली जमिनीवर पडलेली, अजून वळवळणारी शेपूट. तिथे काय घडले होते?",
        },
        choices: [
          {
            en: "A lizard escaped from danger by dropping its tail and climbing away",
            hi: "एक छिपकली पूँछ गिराकर और चढ़कर ख़तरे से बच निकली",
            mr: "एका पालीने शेपूट टाकून व चढून जाऊन धोक्यातून सुटका करून घेतली",
          },
          {
            en: "A frog hopped up the wall and left its tail behind",
            hi: "एक मेंढक दीवार पर फुदककर अपनी पूँछ छोड़ गया",
            mr: "एक बेडूक भिंतीवर उडी मारून शेपूट मागे ठेवून गेला",
          },
          {
            en: "A sparrow's feather fell while it flew past",
            hi: "उड़ती गौरैया का एक पंख गिर गया",
            mr: "उडणाऱ्या चिमणीचे पीस पडले",
          },
          {
            en: "An ant line carried the tail there as food",
            hi: "चींटियों की क़तार पूँछ को खाने के लिए वहाँ लाई",
            mr: "मुंग्यांच्या रांगेने शेपूट अन्न म्हणून तिथे आणली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two clues point one way: only the lizard both climbs walls and can drop a wriggling tail to distract an attacker — the tail even grows back. Grown frogs have no tails to lose, a feather is not a tail, and ants carry food TO their nest, not up a bare wall.",
          hi: "दोनों सुराग़ एक ही ओर इशारा करते हैं: केवल छिपकली दीवार पर चढ़ती भी है और हमलावर को भटकाने के लिए हिलती पूँछ गिरा भी सकती है — पूँछ फिर उग आती है। बड़े मेंढक की पूँछ होती ही नहीं, पंख पूँछ नहीं है, और चींटियाँ खाना अपने बिल की ओर ले जाती हैं, नंगी दीवार पर नहीं।",
          mr: "दोन्ही खुणा एकाच दिशेला बोट दाखवतात: फक्त पालच भिंतीवर चढते आणि हल्लेखोराला चकवायला वळवळणारी शेपूट टाकू शकते — शेपूट पुन्हा वाढतेही. मोठ्या बेडकाला शेपूटच नसते, पीस म्हणजे शेपूट नव्हे, आणि मुंग्या अन्न वारुळाकडे नेतात, उघड्या भिंतीवर नव्हे.",
        },
      },
    ],
  },
];
