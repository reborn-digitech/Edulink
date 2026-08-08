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

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — The Plant Fairy (plants around us)                          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-the-plant-fairy",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 2 — The Plant Fairy",
      hi: "अध्याय 2 — पौधों की परी",
      mr: "प्रकरण 2 — वनस्पतींची परी",
    },
    name: {
      en: "The Plant Fairy",
      hi: "पौधों की परी",
      mr: "वनस्पतींची परी",
    },
    summary: {
      en: "Trees, shrubs, climbers and grass — telling plants apart by their trunks, leaves and the way they stand.",
      hi: "पेड़, झाड़ियाँ, बेलें और घास — तनों, पत्तों और खड़े होने के ढंग से पौधों को पहचानना।",
      mr: "झाडे, झुडपे, वेली आणि गवत — खोड, पाने आणि उभे राहण्याच्या पद्धतीवरून वनस्पती ओळखणे.",
    },
    position: 2,
    source: "EduLink original, written against NCERT Looking Around (Class 3)",
    licence: "CC-BY-SA-4.0",
    facts: [
      {
        id: "tree",
        name: { en: "A tree", hi: "पेड़", mr: "झाड" },
        kind: "plant-type",
        prompt: {
          en: "Which kind of plant is big and tall, with one thick, hard brown trunk?",
          hi: "कौन-सा पौधा बड़ा और ऊँचा होता है, जिसका एक मोटा, कठोर भूरा तना होता है?",
          mr: "कोणती वनस्पती मोठी आणि उंच असते, जिला एक जाड, कठीण तपकिरी खोड असते?",
        },
        statement: {
          en: "A tree stands big and tall on one thick, hard trunk — like the mango and the neem.",
          hi: "पेड़ एक मोटे, कठोर तने पर बड़ा और ऊँचा खड़ा होता है — जैसे आम और नीम।",
          mr: "झाड एका जाड, कठीण खोडावर मोठे आणि उंच उभे असते — जसे आंबा आणि कडुनिंब.",
        },
        detail: {
          en: "Its branches spread out high above your head, and birds build nests in them.",
          hi: "इसकी डालियाँ सिर से बहुत ऊपर फैलती हैं, और उनमें पक्षी घोंसले बनाते हैं।",
          mr: "याच्या फांद्या डोक्याच्या खूप वर पसरतात, आणि त्यांत पक्षी घरटी बांधतात.",
        },
        pair: {
          left: { en: "A tree", hi: "पेड़", mr: "झाड" },
          right: { en: "one thick trunk", hi: "एक मोटा तना", mr: "एक जाड खोड" },
        },
      },
      {
        id: "shrub",
        name: { en: "A shrub", hi: "झाड़ी", mr: "झुडूप" },
        kind: "plant-type",
        prompt: {
          en: "Which kind of plant is smaller than a tree, with many hard stems branching near the ground?",
          hi: "कौन-सा पौधा पेड़ से छोटा होता है और ज़मीन के पास से ही उसकी कई कठोर टहनियाँ निकलती हैं?",
          mr: "कोणती वनस्पती झाडाहून लहान असते आणि जमिनीजवळूनच तिच्या अनेक कठीण फांद्या फुटतात?",
        },
        statement: {
          en: "A shrub is smaller than a tree, with many stems branching out close to the ground — like the rose and the mehndi.",
          hi: "झाड़ी पेड़ से छोटी होती है, ज़मीन के पास से कई तने फूटते हैं — जैसे गुलाब और मेहँदी।",
          mr: "झुडूप झाडाहून लहान असते, जमिनीजवळून अनेक फांद्या फुटतात — जसे गुलाब आणि मेंदी.",
        },
        pair: {
          left: { en: "A shrub", hi: "झाड़ी", mr: "झुडूप" },
          right: { en: "many stems near the ground", hi: "ज़मीन के पास कई तने", mr: "जमिनीजवळ अनेक फांद्या" },
        },
      },
      {
        id: "climber",
        name: { en: "A climber", hi: "बेल", mr: "वेल" },
        kind: "plant-type",
        prompt: {
          en: "Which plant has a stem so weak that it must hold a stick, wall or tree to go up?",
          hi: "किस पौधे का तना इतना कमज़ोर होता है कि ऊपर जाने के लिए उसे छड़ी, दीवार या पेड़ का सहारा लेना पड़ता है?",
          mr: "कोणत्या वनस्पतीचे खोड इतके कमजोर असते की वर जाण्यासाठी तिला काठी, भिंत वा झाडाचा आधार घ्यावा लागतो?",
        },
        statement: {
          en: "A climber's stem is too weak to stand, so it climbs a support — like the money plant and the grape vine.",
          hi: "बेल का तना खड़ा नहीं रह पाता, इसलिए वह सहारे पर चढ़ती है — जैसे मनी प्लांट और अंगूर की बेल।",
          mr: "वेलीचे खोड उभे राहू शकत नाही, म्हणून ती आधारावर चढते — जसे मनी प्लांट आणि द्राक्षवेल.",
        },
        detail: {
          en: "The pumpkin and gourd plants of this kind spread along the ground when no support is near.",
          hi: "कद्दू और लौकी के ऐसे पौधे सहारा न मिलने पर ज़मीन पर ही फैल जाते हैं।",
          mr: "भोपळा आणि दुधी अशा वनस्पती आधार नसल्यास जमिनीवरच पसरतात.",
        },
        pair: {
          left: { en: "A climber", hi: "बेल", mr: "वेल" },
          right: { en: "needs a support", hi: "सहारा चाहिए", mr: "आधार लागतो" },
        },
      },
      {
        id: "grass",
        name: { en: "Grass", hi: "घास", mr: "गवत" },
        kind: "plant-type",
        prompt: {
          en: "Which small plant carpets the ground, springs back when stepped on, and is what cows love to graze?",
          hi: "कौन-सा छोटा पौधा ज़मीन को हरी चादर-सा ढँकता है, पैर पड़ने पर फिर उठ जाता है, और गायें उसे चरना पसंद करती हैं?",
          mr: "कोणती छोटी वनस्पती जमिनीला हिरव्या गालिच्यासारखी झाकते, पाय पडल्यावर पुन्हा उठते, आणि गायींना ती चरायला आवडते?",
        },
        statement: {
          en: "Grass covers the ground like a green carpet and springs back up after being stepped on.",
          hi: "घास ज़मीन को हरी चादर-सी ढँकती है और पैर हटते ही फिर उठ खड़ी होती है।",
          mr: "गवत जमिनीला हिरव्या गालिच्यासारखे झाकते आणि पाय हटताच पुन्हा उभे राहते.",
        },
      },
      {
        id: "banyan",
        name: { en: "The banyan", hi: "बरगद", mr: "वड" },
        kind: "tree",
        prompt: {
          en: "Which huge tree drops long hanging roots from its own branches?",
          hi: "कौन-सा विशाल पेड़ अपनी ही डालियों से लंबी लटकती जड़ें गिराता है?",
          mr: "कोणते प्रचंड झाड आपल्याच फांद्यांतून लांब लोंबणारी मुळे सोडते?",
        },
        statement: {
          en: "The banyan drops roots from its branches, and old banyans look like a whole grove of trunks.",
          hi: "बरगद अपनी डालियों से जड़ें गिराता है, और पुराने बरगद तनों के पूरे झुरमुट-से दिखते हैं।",
          mr: "वड आपल्या फांद्यांतून मुळे सोडतो, आणि जुने वड खोडांच्या अख्ख्या राईसारखे दिसतात.",
        },
        decoys: [
          { en: "The mango tree", hi: "आम का पेड़", mr: "आंब्याचे झाड" },
          { en: "The coconut palm", hi: "नारियल का पेड़", mr: "नारळाचे झाड" },
        ],
        pair: {
          left: { en: "The banyan", hi: "बरगद", mr: "वड" },
          right: { en: "hanging roots", hi: "लटकती जड़ें", mr: "लोंबणारी मुळे" },
        },
      },
      {
        id: "neem",
        name: { en: "The neem", hi: "नीम", mr: "कडुनिंब" },
        kind: "tree",
        prompt: {
          en: "Which tree's bitter leaves are used to keep insects away from stored grain and clothes?",
          hi: "किस पेड़ की कड़वी पत्तियाँ रखे अनाज और कपड़ों से कीड़े दूर रखने के काम आती हैं?",
          mr: "कोणत्या झाडाची कडू पाने साठवलेल्या धान्यातून व कपड्यांतून किडे दूर ठेवायला वापरतात?",
        },
        statement: {
          en: "The neem's leaves taste bitter, and people keep them with grain and woollens to drive insects away.",
          hi: "नीम की पत्तियाँ कड़वी होती हैं, और लोग उन्हें अनाज व ऊनी कपड़ों के साथ रखते हैं ताकि कीड़े भागें।",
          mr: "कडुनिंबाची पाने कडू असतात, आणि किडे पळावेत म्हणून लोक ती धान्यात व लोकरी कपड्यांत ठेवतात.",
        },
        decoys: [
          { en: "The peepal", hi: "पीपल", mr: "पिंपळ" },
          { en: "The gulmohar", hi: "गुलमोहर", mr: "गुलमोहर" },
        ],
        pair: {
          left: { en: "The neem", hi: "नीम", mr: "कडुनिंब" },
          right: { en: "bitter leaves", hi: "कड़वी पत्तियाँ", mr: "कडू पाने" },
        },
      },
      {
        id: "cactus",
        name: { en: "The cactus", hi: "नागफनी (कैक्टस)", mr: "निवडुंग" },
        kind: "plant-type",
        prompt: {
          en: "Which desert plant has thorns instead of flat leaves, and a thick green stem that stores water?",
          hi: "किस रेगिस्तानी पौधे में चपटी पत्तियों की जगह काँटे होते हैं और मोटा हरा तना पानी जमा रखता है?",
          mr: "कोणत्या वाळवंटी वनस्पतीला सपाट पानांऐवजी काटे असतात आणि जाड हिरवे खोड पाणी साठवते?",
        },
        statement: {
          en: "The cactus grows thorns instead of flat leaves and stores water in its thick green stem, so it survives where rain is rare.",
          hi: "नागफनी में चपटी पत्तियों की जगह काँटे होते हैं और मोटा हरा तना पानी जमा रखता है — इसीलिए वह कम बारिश में भी जी लेती है।",
          mr: "निवडुंगाला सपाट पानांऐवजी काटे असतात आणि जाड हिरवे खोड पाणी साठवते — म्हणूनच तो कमी पावसातही जगतो.",
        },
      },
      {
        id: "lotus",
        name: { en: "The lotus", hi: "कमल", mr: "कमळ" },
        kind: "flower",
        prompt: {
          en: "Which flower grows in ponds, its big round leaves floating on the water?",
          hi: "कौन-सा फूल तालाबों में उगता है, जिसके बड़े गोल पत्ते पानी पर तैरते हैं?",
          mr: "कोणते फूल तळ्यांत उगवते, ज्याची मोठी गोल पाने पाण्यावर तरंगतात?",
        },
        statement: {
          en: "The lotus grows in ponds, and its big round leaves float flat on the water.",
          hi: "कमल तालाबों में उगता है, और उसके बड़े गोल पत्ते पानी पर चपटे तैरते हैं।",
          mr: "कमळ तळ्यांत उगवते, आणि त्याची मोठी गोल पाने पाण्यावर सपाट तरंगतात.",
        },
        decoys: [
          { en: "The rose", hi: "गुलाब", mr: "गुलाब" },
          { en: "The marigold", hi: "गेंदा", mr: "झेंडू" },
        ],
      },
      {
        id: "tulsi",
        name: { en: "The tulsi", hi: "तुलसी", mr: "तुळस" },
        kind: "plant-type",
        prompt: {
          en: "Which small fragrant plant is grown in many courtyards and its leaves put into kadha for coughs and colds?",
          hi: "कौन-सा छोटा सुगंधित पौधा कई आँगनों में लगाया जाता है और उसकी पत्तियाँ खाँसी-ज़ुकाम के काढ़े में डाली जाती हैं?",
          mr: "कोणती छोटी सुगंधी वनस्पती अनेक अंगणांत लावतात आणि तिची पाने खोकला-सर्दीच्या काढ्यात घालतात?",
        },
        statement: {
          en: "The tulsi is a small fragrant plant of courtyards, its leaves brewed for coughs and colds.",
          hi: "तुलसी आँगन का छोटा सुगंधित पौधा है, जिसकी पत्तियाँ खाँसी-ज़ुकाम में काढ़े के काम आती हैं।",
          mr: "तुळस ही अंगणातली छोटी सुगंधी वनस्पती, तिची पाने खोकला-सर्दीत काढ्यासाठी वापरतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Line these up from SHORTEST to TALLEST as they usually grow: grass, a mango tree, a rose shrub.",
          hi: "इन्हें उनकी सामान्य ऊँचाई के अनुसार सबसे छोटे से सबसे ऊँचे तक लगाइए: घास, आम का पेड़, गुलाब की झाड़ी।",
          mr: "यांना त्यांच्या नेहमीच्या उंचीनुसार सर्वांत लहान ते सर्वांत उंच असे लावा: गवत, आंब्याचे झाड, गुलाबाचे झुडूप.",
        },
        choices: [
          {
            en: "Grass → rose shrub → mango tree",
            hi: "घास → गुलाब की झाड़ी → आम का पेड़",
            mr: "गवत → गुलाबाचे झुडूप → आंब्याचे झाड",
          },
          {
            en: "Rose shrub → grass → mango tree",
            hi: "गुलाब की झाड़ी → घास → आम का पेड़",
            mr: "गुलाबाचे झुडूप → गवत → आंब्याचे झाड",
          },
          {
            en: "Mango tree → rose shrub → grass",
            hi: "आम का पेड़ → गुलाब की झाड़ी → घास",
            mr: "आंब्याचे झाड → गुलाबाचे झुडूप → गवत",
          },
          {
            en: "Grass → mango tree → rose shrub",
            hi: "घास → आम का पेड़ → गुलाब की झाड़ी",
            mr: "गवत → आंब्याचे झाड → गुलाबाचे झुडूप",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Grass hugs the ground, a shrub reaches about as high as a child, and a tree rises far above both. Sorting by height is really sorting by plant TYPE — the trunk decides how high a plant can go.",
          hi: "घास ज़मीन से लगी रहती है, झाड़ी बच्चे की ऊँचाई तक पहुँचती है, और पेड़ दोनों से बहुत ऊपर उठता है। ऊँचाई से छाँटना असल में पौधे के प्रकार से छाँटना है — तना ही तय करता है कि पौधा कितना ऊँचा जाएगा।",
          mr: "गवत जमिनीला बिलगते, झुडूप मुलाच्या उंचीपर्यंत पोहोचते, आणि झाड दोन्हींहून खूप वर जाते. उंचीने लावणे म्हणजे खरे तर वनस्पतीच्या प्रकाराने लावणे — खोडच ठरवते वनस्पती किती उंच जाईल.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A money plant in a bottle grows two hand-spans in a month, lying limp along the shelf. The same plant, given a stick, climbs upright the same two spans. What did the stick change?",
          hi: "बोतल में लगा मनी प्लांट महीने भर में दो बालिश्त बढ़ता है, ताक़ पर लस्त-सा लेटा हुआ। वही पौधा छड़ी मिलने पर उतना ही सीधा ऊपर चढ़ता है। छड़ी ने क्या बदला?",
          mr: "बाटलीतले मनी प्लांट महिन्यात दोन वीत वाढते, फळीवर लोळत. तेच रोप काठी मिळाल्यावर तितकेच सरळ वर चढते. काठीने काय बदलले?",
        },
        choices: [
          {
            en: "Only its direction — a climber's weak stem grows the same, but can go UP when it has a support",
            hi: "केवल दिशा — बेल का कमज़ोर तना उतना ही बढ़ता है, पर सहारा मिलने पर ऊपर जा पाता है",
            mr: "फक्त दिशा — वेलीचे कमजोर खोड तितकेच वाढते, पण आधार मिळाल्यावर वर जाऊ शकते",
          },
          {
            en: "The stick fed the plant and made it stronger",
            hi: "छड़ी ने पौधे को खुराक दी और मज़बूत बनाया",
            mr: "काठीने रोपाला खुराक दिली आणि मजबूत केले",
          },
          {
            en: "The plant became a tree once it stood upright",
            hi: "सीधा खड़ा होते ही पौधा पेड़ बन गया",
            mr: "सरळ उभे राहताच रोपाचे झाड झाले",
          },
          {
            en: "Climbers only grow at night, and the stick does not matter",
            hi: "बेलें केवल रात में बढ़ती हैं, छड़ी से कुछ नहीं बदलता",
            mr: "वेली फक्त रात्री वाढतात, काठीने काही बदलत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The growth was the same two spans either way — the stick supplied no food and changed no type. What a support gives a weak stem is direction: the defining trick of climbers, and the reason farmers stake beans and grapes.",
          hi: "बढ़त दोनों हाल में वही दो बालिश्त थी — छड़ी ने न खुराक दी, न प्रकार बदला। सहारा कमज़ोर तने को बस दिशा देता है: बेलों की यही पहचान है, और इसीलिए किसान सेम और अंगूर को थूनी देते हैं।",
          mr: "वाढ दोन्ही स्थितींत तीच दोन वीत — काठीने खुराकही दिली नाही, प्रकारही बदलला नाही. आधार कमजोर खोडाला फक्त दिशा देतो: हीच वेलींची खूण, आणि म्हणूनच शेतकरी घेवडा-द्राक्षांना मांडव घालतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two pots stand in a dry, sunny yard for two weeks without water: one holds a leafy rose, the other a cactus. Which plant does better, and WHY?",
          hi: "सूखे, धूप वाले आँगन में दो गमले दो हफ़्ते बिना पानी रहे: एक में पत्तेदार गुलाब, दूसरे में नागफनी। कौन-सा पौधा बेहतर टिकेगा, और क्यों?",
          mr: "कोरड्या, उन्हाच्या अंगणात दोन कुंड्या दोन आठवडे पाण्याविना राहिल्या: एकीत पानेदार गुलाब, दुसरीत निवडुंग. कोणती वनस्पती चांगली टिकेल, आणि का?",
        },
        choices: [
          {
            en: "The cactus — its thick stem stores water and its thorns lose almost none to the sun",
            hi: "नागफनी — उसका मोटा तना पानी जमा रखता है और काँटे धूप में लगभग कुछ नहीं गँवाते",
            mr: "निवडुंग — त्याचे जाड खोड पाणी साठवते आणि काटे उन्हात जवळजवळ काहीच गमावत नाहीत",
          },
          {
            en: "The rose — flowers always mean a healthy plant",
            hi: "गुलाब — फूल हमेशा सेहतमंद पौधे की निशानी हैं",
            mr: "गुलाब — फुले म्हणजे नेहमी निरोगी वनस्पती",
          },
          {
            en: "Both the same — plants only need soil, not water",
            hi: "दोनों बराबर — पौधों को केवल मिट्टी चाहिए, पानी नहीं",
            mr: "दोन्ही सारखी — वनस्पतींना फक्त माती लागते, पाणी नाही",
          },
          {
            en: "Neither — no plant can live two weeks anywhere",
            hi: "कोई नहीं — कोई पौधा कहीं भी दो हफ़्ते नहीं जी सकता",
            mr: "कोणतीही नाही — कोणतीही वनस्पती कुठेही दोन आठवडे जगू शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Broad soft leaves lose water to the sun all day, and the rose has many; the cactus swapped its leaves for thorns and keeps a store in its stem — desert equipment doing exactly its job in a dry yard.",
          hi: "चौड़ी नरम पत्तियाँ दिन भर धूप में पानी गँवाती हैं, और गुलाब के पास ऐसी बहुत हैं; नागफनी ने पत्तियों के बदले काँटे लिए और तने में भंडार रखा — रेगिस्तान का साज़-ओ-सामान सूखे आँगन में ठीक अपना काम करता हुआ।",
          mr: "रुंद मऊ पाने दिवसभर उन्हात पाणी गमावतात, आणि गुलाबाकडे ती पुष्कळ; निवडुंगाने पानांच्या बदल्यात काटे घेतले आणि खोडात साठा ठेवला — वाळवंटी सामग्री कोरड्या अंगणात नेमके आपले काम करते आहे.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Water O' Water! (where water comes from, keeping it safe)   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-water-o-water",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 3 — Water O' Water!",
      hi: "अध्याय 3 — पानी रे पानी!",
      mr: "प्रकरण 3 — पाणी रे पाणी!",
    },
    name: {
      en: "Water O' Water!",
      hi: "पानी रे पानी!",
      mr: "पाणी रे पाणी!",
    },
    summary: {
      en: "Where our water comes from — rain, wells, pumps and rivers — and what makes it safe to drink.",
      hi: "हमारा पानी कहाँ से आता है — बारिश, कुएँ, नल-पंप और नदियाँ — और उसे पीने लायक़ क्या बनाता है।",
      mr: "आपले पाणी कुठून येते — पाऊस, विहिरी, पंप आणि नद्या — आणि ते पिण्यायोग्य कशाने होते.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "rain",
        name: { en: "Rain", hi: "बारिश", mr: "पाऊस" },
        kind: "water-source",
        seq: 1,
        prompt: {
          en: "Which water falls from the clouds and fills the ponds and rivers?",
          hi: "कौन-सा पानी बादलों से गिरता है और तालाबों-नदियों को भर देता है?",
          mr: "कोणते पाणी ढगांतून पडते आणि तळी-नद्या भरते?",
        },
        statement: {
          en: "Rain falls from the clouds, and it is where the water in ponds, wells and rivers first comes from.",
          hi: "बारिश बादलों से गिरती है, और तालाबों, कुओं और नदियों का पानी पहले-पहल वहीं से आता है।",
          mr: "पाऊस ढगांतून पडतो, आणि तळी, विहिरी व नद्यांतले पाणी मुळात तिथूनच येते.",
        },
        detail: {
          en: "Farmers wait for this water for their fields, and its first drops smell of wet earth.",
          hi: "किसान अपने खेतों के लिए इसी पानी की राह देखते हैं, और इसकी पहली बूँदों से गीली मिट्टी की सोंधी महक उठती है।",
          mr: "शेतकरी आपल्या शेतांसाठी याच पाण्याची वाट पाहतात, आणि याच्या पहिल्या थेंबांनी ओल्या मातीचा सुगंध दरवळतो.",
        },
        pair: {
          left: { en: "Rain", hi: "बारिश", mr: "पाऊस" },
          right: { en: "falls from clouds", hi: "बादलों से गिरती", mr: "ढगांतून पडतो" },
        },
      },
      {
        id: "well",
        name: { en: "The well", hi: "कुआँ", mr: "विहीर" },
        kind: "water-source",
        prompt: {
          en: "From which round, deep place do people pull up water with a rope and bucket?",
          hi: "किस गोल, गहरी जगह से लोग रस्सी और बाल्टी से पानी खींचते हैं?",
          mr: "कोणत्या गोल, खोल जागेतून लोक दोरी आणि बादलीने पाणी ओढतात?",
        },
        statement: {
          en: "A well is a deep round hole reaching water under the ground, drawn up with a rope and bucket.",
          hi: "कुआँ ज़मीन के नीचे के पानी तक पहुँचता गहरा गोल गड्ढा है, जिससे रस्सी-बाल्टी से पानी खींचा जाता है।",
          mr: "विहीर म्हणजे जमिनीखालच्या पाण्यापर्यंत पोहोचणारा खोल गोल खड्डा; दोरी-बादलीने पाणी काढतात.",
        },
        detail: {
          en: "Its low round wall keeps children safe and dirt out.",
          hi: "इसकी नीची गोल मुँडेर बच्चों को गिरने से और गंदगी को अंदर जाने से रोकती है।",
          mr: "तिचा ठेंगणा गोल कठडा मुलांना पडण्यापासून आणि घाणीला आत जाण्यापासून रोखतो.",
        },
        pair: {
          left: { en: "The well", hi: "कुआँ", mr: "विहीर" },
          right: { en: "rope and bucket", hi: "रस्सी और बाल्टी", mr: "दोरी आणि बादली" },
        },
      },
      {
        id: "handpump",
        name: { en: "The hand pump", hi: "हैंडपंप", mr: "हातपंप" },
        kind: "water-source",
        prompt: {
          en: "Which machine brings up underground water when you push its long handle up and down?",
          hi: "कौन-सी मशीन लंबा हत्था ऊपर-नीचे चलाने पर ज़मीन के नीचे का पानी ऊपर लाती है?",
          mr: "कोणते यंत्र लांब दांडा वर-खाली केल्यावर जमिनीखालचे पाणी वर आणते?",
        },
        statement: {
          en: "The hand pump lifts underground water when its handle is worked up and down — no rope, no bucket.",
          hi: "हैंडपंप हत्था ऊपर-नीचे चलाने पर भूजल ऊपर उठाता है — न रस्सी, न बाल्टी।",
          mr: "हातपंप दांडा वर-खाली केल्यावर भूजल वर उचलतो — दोरी नाही, बादली नाही.",
        },
        pair: {
          left: { en: "The hand pump", hi: "हैंडपंप", mr: "हातपंप" },
          right: { en: "handle worked up and down", hi: "ऊपर-नीचे चलता हत्था", mr: "वर-खाली होणारा दांडा" },
        },
      },
      {
        id: "river",
        name: { en: "The river", hi: "नदी", mr: "नदी" },
        kind: "water-source",
        seq: 2,
        prompt: {
          en: "Which water flows day and night from the mountains toward the sea?",
          hi: "कौन-सा पानी पहाड़ों से समुद्र की ओर दिन-रात बहता रहता है?",
          mr: "कोणते पाणी डोंगरांतून समुद्राकडे रात्रंदिवस वाहत असते?",
        },
        statement: {
          en: "A river flows on and on from the hills toward the sea, and towns draw water from it on the way.",
          hi: "नदी पहाड़ों से समुद्र की ओर बहती चली जाती है, और रास्ते के नगर उससे पानी लेते हैं।",
          mr: "नदी डोंगरांतून समुद्राकडे वाहत राहते, आणि वाटेवरची गावे तिच्यातून पाणी घेतात.",
        },
        pair: {
          left: { en: "The river", hi: "नदी", mr: "नदी" },
          right: { en: "flows to the sea", hi: "समुद्र की ओर बहती", mr: "समुद्राकडे वाहते" },
        },
      },
      {
        id: "sea",
        name: { en: "The sea", hi: "समुद्र", mr: "समुद्र" },
        kind: "water-body",
        seq: 3,
        prompt: {
          en: "Which huge water is so salty that nobody can drink it?",
          hi: "कौन-सा विशाल पानी इतना खारा है कि कोई उसे पी नहीं सकता?",
          mr: "कोणते अफाट पाणी इतके खारट आहे की कोणी ते पिऊ शकत नाही?",
        },
        statement: {
          en: "The sea holds the most water of all, but it is salty — good for ships and fish, not for drinking.",
          hi: "समुद्र में सबसे ज़्यादा पानी है, पर वह खारा है — जहाज़ों और मछलियों के लिए ठीक, पीने के लिए नहीं।",
          mr: "समुद्रात सर्वांत जास्त पाणी आहे, पण ते खारट — जहाजे आणि माशांसाठी ठीक, पिण्यासाठी नाही.",
        },
      },
      {
        id: "pond",
        name: { en: "The pond", hi: "तालाब", mr: "तळे" },
        kind: "water-body",
        prompt: {
          en: "In which still water do buffaloes love to sit, and washermen wash clothes at the edge?",
          hi: "किस ठहरे पानी में भैंसें बैठना पसंद करती हैं, और किनारे धोबी कपड़े धोते हैं?",
          mr: "कोणत्या स्थिर पाण्यात म्हशींना बसायला आवडते, आणि काठावर परीट कपडे धुतात?",
        },
        statement: {
          en: "A pond is still water where buffaloes cool off and clothes get washed — which is exactly why its water must not be drunk unboiled.",
          hi: "तालाब ठहरा पानी है जहाँ भैंसें ठंडक पाती हैं और कपड़े धुलते हैं — ठीक इसीलिए उसका पानी बिना उबाले नहीं पीना चाहिए।",
          mr: "तळे म्हणजे स्थिर पाणी — तिथे म्हशी गारवा घेतात आणि कपडे धुतले जातात — नेमके म्हणूनच त्याचे पाणी न उकळता पिऊ नये.",
        },
      },
      {
        id: "boiling",
        name: { en: "Boiling", hi: "उबालना", mr: "उकळणे" },
        kind: "making-safe",
        prompt: {
          en: "What do we do to water on the stove to kill its unseen germs before drinking?",
          hi: "पीने से पहले पानी के अनदेखे कीटाणु मारने के लिए हम चूल्हे पर उसका क्या करते हैं?",
          mr: "पिण्याआधी पाण्यातले न दिसणारे जंतू मारण्यासाठी आपण चुलीवर त्याचे काय करतो?",
        },
        statement: {
          en: "Boiling water kills the germs we cannot see, making doubtful water safe to drink.",
          hi: "पानी उबालने से वे कीटाणु मर जाते हैं जो दिखते नहीं — और संदेह वाला पानी पीने लायक़ बन जाता है।",
          mr: "पाणी उकळल्याने न दिसणारे जंतू मरतात — आणि संशयास्पद पाणी पिण्यायोग्य होते.",
        },
        pair: {
          left: { en: "Boiling", hi: "उबालना", mr: "उकळणे" },
          right: { en: "kills germs", hi: "कीटाणु मारता है", mr: "जंतू मारते" },
        },
      },
      {
        id: "covering",
        name: { en: "Covering the pot", hi: "बर्तन ढँकना", mr: "भांडे झाकणे" },
        kind: "making-safe",
        prompt: {
          en: "What simple habit keeps dust and flies out of stored drinking water?",
          hi: "कौन-सी सीधी-सी आदत रखे हुए पीने के पानी को धूल और मक्खियों से बचाती है?",
          mr: "कोणती साधी सवय साठवलेल्या पिण्याच्या पाण्याला धूळ आणि माश्यांपासून वाचवते?",
        },
        statement: {
          en: "Keeping the water pot covered, and lifting water only with a long-handled ladle, keeps dust, flies and unwashed hands out.",
          hi: "पानी का बर्तन ढँककर रखना, और पानी केवल लंबी डंडी की कलछी से निकालना — धूल, मक्खियाँ और बिना धुले हाथ बाहर रहते हैं।",
          mr: "पाण्याचे भांडे झाकून ठेवणे, आणि पाणी फक्त लांब दांड्याच्या ओगराळ्याने काढणे — धूळ, माश्या आणि न धुतलेले हात बाहेर राहतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put water's journey in order: (1) the river carries it, (2) rain falls on the hills, (3) it reaches the salty sea.",
          hi: "पानी की यात्रा क्रम में रखें: (1) नदी उसे ले चलती है, (2) पहाड़ों पर बारिश गिरती है, (3) वह खारे समुद्र में पहुँचता है।",
          mr: "पाण्याचा प्रवास क्रमाने लावा: (1) नदी ते वाहून नेते, (2) डोंगरांवर पाऊस पडतो, (3) ते खाऱ्या समुद्रात पोहोचते.",
        },
        choices: [
          { en: "2 → 1 → 3", hi: "2 → 1 → 3", mr: "2 → 1 → 3" },
          { en: "1 → 2 → 3", hi: "1 → 2 → 3", mr: "1 → 2 → 3" },
          { en: "3 → 1 → 2", hi: "3 → 1 → 2", mr: "3 → 1 → 2" },
          { en: "2 → 3 → 1", hi: "2 → 3 → 1", mr: "2 → 3 → 1" },
        ],
        answerIndex: 0,
        solution: {
          en: "Rain falls on the hills first, rivers gather it and carry it down, and the sea is where the carrying ends. Every glass of river water is rain partway through this journey.",
          hi: "पहले पहाड़ों पर बारिश गिरती है, नदियाँ उसे बटोरकर नीचे ले चलती हैं, और समुद्र पर ढुलाई ख़त्म होती है। नदी का हर गिलास पानी इसी यात्रा के बीच की बारिश है।",
          mr: "आधी डोंगरांवर पाऊस पडतो, नद्या ते गोळा करून खाली नेतात, आणि समुद्रापाशी वाहून नेणे संपते. नदीच्या पाण्याचा प्रत्येक ग्लास म्हणजे या प्रवासाच्या मधली पावसाचीच धार.",
        },
      },
      {
        level: 6,
        stem: {
          en: "After the floods, the radio says: 'Drink only boiled water.' The hand-pump water LOOKS clear. Why does the warning still apply to it?",
          hi: "बाढ़ के बाद रेडियो कहता है: 'केवल उबला पानी पिएँ।' हैंडपंप का पानी देखने में साफ़ है। चेतावनी फिर भी उस पर क्यों लागू होती है?",
          mr: "पुरानंतर रेडिओ सांगतो: 'फक्त उकळलेले पाणी प्या.' हातपंपाचे पाणी दिसायला स्वच्छ आहे. तरीही इशारा त्याला का लागू होतो?",
        },
        choices: [
          {
            en: "Germs are too small to see — clear water can still carry them, and floods mix dirty water into the ground",
            hi: "कीटाणु इतने छोटे हैं कि दिखते नहीं — साफ़ दिखता पानी भी उन्हें लिए हो सकता है, और बाढ़ गंदा पानी ज़मीन में मिला देती है",
            mr: "जंतू इतके लहान की दिसत नाहीत — स्वच्छ दिसणारे पाणीही ते वाहून आणू शकते, आणि पूर घाण पाणी जमिनीत मिसळतो",
          },
          {
            en: "Boiling makes water taste sweeter after floods",
            hi: "उबालने से बाढ़ के बाद पानी मीठा लगता है",
            mr: "उकळल्याने पुरानंतर पाणी गोड लागते",
          },
          {
            en: "Hand pumps stop working during floods",
            hi: "बाढ़ में हैंडपंप चलना बंद कर देते हैं",
            mr: "पुरात हातपंप चालणे बंद होतात",
          },
          {
            en: "The radio warning is only for river water",
            hi: "रेडियो की चेतावनी केवल नदी के पानी के लिए है",
            mr: "रेडिओचा इशारा फक्त नदीच्या पाण्यासाठी आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Clean-LOOKING is not clean: germs are invisible, and flood water seeps underground where pumps drink from. Boiling is the one kitchen tool that kills what the eye cannot check — which is why the warning names no colour and no smell, only the fire.",
          hi: "साफ़ दिखना साफ़ होना नहीं है: कीटाणु अदृश्य हैं, और बाढ़ का पानी ज़मीन में रिसकर वहीं पहुँचता है जहाँ से पंप पीते हैं। उबालना रसोई का वही एक औज़ार है जो आँख से न जँचने वाले को मारता है — इसीलिए चेतावनी रंग या गंध का नहीं, केवल आग का नाम लेती है।",
          mr: "स्वच्छ दिसणे म्हणजे स्वच्छ असणे नव्हे: जंतू अदृश्य असतात, आणि पुराचे पाणी जमिनीत झिरपून पंप जिथून पितात तिथे पोहोचते. उकळणे हेच स्वयंपाकघरातले एकमेव हत्यार जे डोळ्यांना न तपासता येणाऱ्याला मारते — म्हणूनच इशारा रंगाचे वा वासाचे नाही, फक्त विस्तवाचे नाव घेतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two pots of drinking water stand in a kitchen: one covered with a plate and served with a long ladle, one open and dipped into with hands. A week later the family with the open pot falls ill. What best explains it?",
          hi: "रसोई में पीने के पानी के दो बर्तन हैं: एक थाली से ढँका, लंबी कलछी से; दूसरा खुला, हाथ डुबोकर। हफ़्ते भर बाद खुले बर्तन वाला परिवार बीमार पड़ता है। इसकी सबसे अच्छी व्याख्या क्या है?",
          mr: "स्वयंपाकघरात पिण्याच्या पाण्याची दोन भांडी: एक ताटाने झाकलेले, लांब ओगराळ्याने; दुसरे उघडे, हात बुडवून. आठवड्याने उघड्या भांड्याचे कुटुंब आजारी पडते. याचे सर्वांत चांगले स्पष्टीकरण काय?",
        },
        choices: [
          {
            en: "Hands and open air carried germs into the uncovered water day after day",
            hi: "हाथ और खुली हवा दिन-प्रतिदिन खुले पानी में कीटाणु पहुँचाते रहे",
            mr: "हात आणि उघडी हवा रोजच्या रोज उघड्या पाण्यात जंतू नेत राहिले",
          },
          {
            en: "Covered water becomes medicine over a week",
            hi: "ढँका पानी हफ़्ते भर में दवा बन जाता है",
            mr: "झाकलेले पाणी आठवड्यात औषध होते",
          },
          {
            en: "The plate on the first pot made its water cold",
            hi: "पहले बर्तन की थाली ने उसका पानी ठंडा कर दिया",
            mr: "पहिल्या भांड्यावरील ताटाने त्याचे पाणी थंड केले",
          },
          {
            en: "Illness had nothing to do with the water",
            hi: "बीमारी का पानी से कोई संबंध ही नहीं था",
            mr: "आजाराचा पाण्याशी संबंधच नव्हता",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two pots differ in exactly one habit, and the sickness followed the open one — the fair conclusion is that dipping hands and open air seeded germs all week. One changed thing, one changed result: that is how a fair test reads, even in a kitchen.",
          hi: "दोनों बर्तनों में फ़र्क़ ठीक एक आदत का था, और बीमारी खुले वाले के पीछे आई — उचित निष्कर्ष यही कि डूबते हाथ और खुली हवा हफ़्ते भर कीटाणु बोते रहे। एक चीज़ बदली, एक नतीजा बदला: निष्पक्ष परख ऐसे ही पढ़ी जाती है, रसोई में भी।",
          mr: "दोन भांड्यांत फरक नेमक्या एका सवयीचा, आणि आजार उघड्यामागे आला — रास्त निष्कर्ष हाच की बुडणारे हात आणि उघडी हवा आठवडाभर जंतू पेरत राहिली. एक गोष्ट बदलली, एक निकाल बदलला: नि:पक्ष चाचणी अशीच वाचतात, स्वयंपाकघरातही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Foods We Eat                                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-foods-we-eat",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 6 — Foods We Eat",
      hi: "अध्याय 6 — हमारा भोजन",
      mr: "प्रकरण 6 — आपले अन्न",
    },
    name: { en: "Foods We Eat", hi: "हमारा भोजन", mr: "आपले अन्न" },
    summary: {
      en: "What different people eat at different ages and places — and where the food on the plate began.",
      hi: "अलग-अलग उम्र और जगहों के लोग क्या खाते हैं — और थाली का खाना कहाँ से शुरू हुआ।",
      mr: "वेगवेगळ्या वयांचे आणि ठिकाणचे लोक काय खातात — आणि ताटातले अन्न कुठे सुरू झाले.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "milkfood",
        name: { en: "Milk", hi: "दूध", mr: "दूध" },
        kind: "food",
        prompt: {
          en: "Which is the ONLY food a newborn baby has for its first months?",
          hi: "नवजात शिशु पहले महीनों में केवल कौन-सा आहार लेता है?",
          mr: "नवजात बाळ पहिल्या महिन्यांत फक्त कोणता आहार घेते?",
        },
        statement: {
          en: "A newborn baby lives on milk alone for its first months — no rotis, no rice, only milk.",
          hi: "नवजात शिशु पहले महीनों में केवल दूध पर रहता है — न रोटी, न चावल, केवल दूध।",
          mr: "नवजात बाळ पहिल्या महिन्यांत फक्त दुधावर असते — पोळी नाही, भात नाही, फक्त दूध.",
        },
        detail: {
          en: "Curd, butter, ghee and paneer are all made from this one food.",
          hi: "दही, मक्खन, घी और पनीर — सब इसी एक आहार से बनते हैं।",
          mr: "दही, लोणी, तूप आणि पनीर — सारे याच एका अन्नापासून होतात.",
        },
        pair: {
          left: { en: "A newborn baby", hi: "नवजात शिशु", mr: "नवजात बाळ" },
          right: { en: "only milk", hi: "केवल दूध", mr: "फक्त दूध" },
        },
      },
      {
        id: "roti",
        name: { en: "Roti", hi: "रोटी", mr: "पोळी" },
        kind: "food",
        prompt: {
          en: "Which food is made by rolling wheat dough flat and cooking it on a hot tawa?",
          hi: "कौन-सा भोजन गेहूँ का आटा बेलकर गर्म तवे पर सेंकने से बनता है?",
          mr: "कोणते अन्न गव्हाची कणीक लाटून गरम तव्यावर भाजून होते?",
        },
        statement: {
          en: "Roti is rolled from wheat dough and cooked on a tawa, and it begins as grain in a farmer's field.",
          hi: "रोटी गेहूँ के आटे से बेली और तवे पर सेंकी जाती है — और उसकी शुरुआत किसान के खेत के दाने से होती है।",
          mr: "पोळी गव्हाच्या कणकेतून लाटून तव्यावर भाजतात — आणि तिची सुरुवात शेतकऱ्याच्या शेतातील दाण्यापासून होते.",
        },
        pair: {
          left: { en: "Roti", hi: "रोटी", mr: "पोळी" },
          right: { en: "wheat", hi: "गेहूँ", mr: "गहू" },
        },
      },
      {
        id: "ricefood",
        name: { en: "Rice", hi: "चावल", mr: "भात" },
        kind: "food",
        prompt: {
          en: "Which grain, boiled soft, is the main food in places where paddy grows in flooded fields?",
          hi: "कौन-सा अनाज, उबालकर, उन जगहों का मुख्य भोजन है जहाँ पानी भरे खेतों में धान उगता है?",
          mr: "कोणते धान्य, शिजवून, पाणथळ शेतांत भात पिकणाऱ्या ठिकाणचे मुख्य अन्न आहे?",
        },
        statement: {
          en: "Rice comes from paddy grown in water-filled fields, and in many homes it is eaten at every meal.",
          hi: "चावल पानी भरे खेतों के धान से आता है, और कई घरों में हर भोजन में खाया जाता है।",
          mr: "भात पाणथळ शेतांतील साळीपासून येतो, आणि अनेक घरांत प्रत्येक जेवणात खाल्ला जातो.",
        },
        pair: {
          left: { en: "Rice", hi: "चावल", mr: "भात" },
          right: { en: "paddy in flooded fields", hi: "पानी भरे खेतों का धान", mr: "पाणथळ शेतांतील साळ" },
        },
      },
      {
        id: "dal",
        name: { en: "Dal", hi: "दाल", mr: "डाळ" },
        kind: "food",
        prompt: {
          en: "Which everyday food is cooked from pulses like moong, tur and chana?",
          hi: "कौन-सा रोज़ का भोजन मूँग, तूर और चने जैसी दालों से पकता है?",
          mr: "कोणते रोजचे अन्न मूग, तूर आणि हरभऱ्यासारख्या कडधान्यांतून शिजते?",
        },
        statement: {
          en: "Dal is cooked from pulses — moong, tur, chana — and gives the body strength to grow.",
          hi: "दाल दालों से पकती है — मूँग, तूर, चना — और शरीर को बढ़ने की ताक़त देती है।",
          mr: "डाळ कडधान्यांतून शिजते — मूग, तूर, हरभरा — आणि शरीराला वाढण्याची ताकद देते.",
        },
        pair: {
          left: { en: "Dal", hi: "दाल", mr: "डाळ" },
          right: { en: "pulses", hi: "दालें (मूँग-तूर-चना)", mr: "कडधान्ये" },
        },
      },
      {
        id: "vegetables",
        name: { en: "Vegetables", hi: "सब्ज़ियाँ", mr: "भाज्या" },
        kind: "food",
        prompt: {
          en: "Which foods — bhindi, palak, gobhi — come fresh from the sabzi mandi and must be washed before cooking?",
          hi: "कौन-से भोजन — भिंडी, पालक, गोभी — सब्ज़ी मंडी से ताज़े आते हैं और पकाने से पहले धोने पड़ते हैं?",
          mr: "कोणते अन्न — भेंडी, पालक, फ्लॉवर — भाजी मंडईतून ताजे येते आणि शिजवण्याआधी धुवावे लागते?",
        },
        statement: {
          en: "Vegetables come fresh from the market and are washed before cooking, because they grew in open fields.",
          hi: "सब्ज़ियाँ मंडी से ताज़ी आती हैं और पकाने से पहले धोई जाती हैं, क्योंकि वे खुले खेतों में उगी हैं।",
          mr: "भाज्या मंडईतून ताज्या येतात आणि शिजवण्याआधी धुतात, कारण त्या उघड्या शेतांत वाढल्या.",
        },
      },
      {
        id: "eldertoothless",
        name: {
          en: "Soft, mashed food",
          hi: "नरम, मसला भोजन",
          mr: "मऊ, कुस्करलेले अन्न",
        },
        kind: "who-eats-what",
        prompt: {
          en: "What kind of food do very old people with few teeth — like Chhutki's grandmother — need?",
          hi: "बहुत बूढ़े, कम दाँतों वाले लोगों — जैसे छुटकी की दादी — को किस तरह का भोजन चाहिए?",
          mr: "फार वयस्कर, कमी दात असलेल्या माणसांना — जसे चुटकीची आजी — कोणत्या प्रकारचे अन्न लागते?",
        },
        statement: {
          en: "People with few teeth need food that is soft or mashed — khichdi, daliya, well-cooked rice — chewing does the choosing.",
          hi: "कम दाँतों वालों को नरम या मसला भोजन चाहिए — खिचड़ी, दलिया, गला हुआ चावल — चबाना ही चुनाव करा देता है।",
          mr: "कमी दात असलेल्यांना मऊ वा कुस्करलेले अन्न लागते — खिचडी, दलिया, मऊ भात — चावणेच निवड ठरवते.",
        },
      },
      {
        id: "sprouts",
        name: { en: "Sprouted chana", hi: "अंकुरित चना", mr: "मोड आलेले हरभरे" },
        kind: "food",
        prompt: {
          en: "Which food is made by soaking gram overnight and letting tiny white tails grow from the seeds?",
          hi: "कौन-सा भोजन चने को रात भर भिगोकर, दानों से नन्ही सफ़ेद पूँछें निकलने देकर बनता है?",
          mr: "कोणते अन्न हरभरे रात्रभर भिजवून, दाण्यांतून चिमुकल्या पांढऱ्या शेपट्या फुटू देऊन होते?",
        },
        statement: {
          en: "Sprouted chana is gram soaked overnight until little white shoots appear — the seed beginning to become a plant.",
          hi: "अंकुरित चना रात भर भीगा चना है जिसमें नन्हे सफ़ेद अंकुर निकल आते हैं — बीज का पौधा बनना शुरू।",
          mr: "मोड आलेले हरभरे म्हणजे रात्रभर भिजवलेले हरभरे, ज्यांतून चिमुकले पांढरे मोड फुटतात — बी रोप होऊ लागले.",
        },
      },
      {
        id: "midday",
        name: {
          en: "The mid-day meal",
          hi: "मध्याह्न भोजन",
          mr: "माध्यान्ह भोजन",
        },
        kind: "who-eats-what",
        prompt: {
          en: "What do we call the hot lunch cooked and served to children AT SCHOOL itself?",
          hi: "स्कूल में ही पकाकर बच्चों को परोसे जाने वाले गर्म दोपहर के खाने को क्या कहते हैं?",
          mr: "शाळेतच शिजवून मुलांना वाढल्या जाणाऱ्या गरम दुपारच्या जेवणाला काय म्हणतात?",
        },
        statement: {
          en: "The mid-day meal is cooked at school and eaten together by the whole class, so no child studies hungry.",
          hi: "मध्याह्न भोजन स्कूल में पकता है और पूरी कक्षा साथ खाती है — ताकि कोई बच्चा भूखा न पढ़े।",
          mr: "माध्यान्ह भोजन शाळेत शिजते आणि अख्खा वर्ग एकत्र जेवतो — म्हणजे कोणतेही मूल उपाशी शिकत नाही.",
        },
        pair: {
          left: { en: "The mid-day meal", hi: "मध्याह्न भोजन", mr: "माध्यान्ह भोजन" },
          right: { en: "cooked at school", hi: "स्कूल में पका", mr: "शाळेत शिजलेले" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Line up what one person eats as they grow: (1) dal-roti-sabzi like everyone, (2) only milk, (3) soft khichdi with few teeth.",
          hi: "एक ही व्यक्ति के बड़े होते खाने को क्रम दें: (1) सबकी तरह दाल-रोटी-सब्ज़ी, (2) केवल दूध, (3) कम दाँतों में नरम खिचड़ी।",
          mr: "एकाच माणसाचे वाढत्या वयातले खाणे क्रमाने लावा: (1) सर्वांसारखे डाळ-पोळी-भाजी, (2) फक्त दूध, (3) कमी दातांत मऊ खिचडी.",
        },
        choices: [
          { en: "2 → 1 → 3", hi: "2 → 1 → 3", mr: "2 → 1 → 3" },
          { en: "1 → 2 → 3", hi: "1 → 2 → 3", mr: "1 → 2 → 3" },
          { en: "3 → 2 → 1", hi: "3 → 2 → 1", mr: "3 → 2 → 1" },
          { en: "2 → 3 → 1", hi: "2 → 3 → 1", mr: "2 → 3 → 1" },
        ],
        answerIndex: 0,
        solution: {
          en: "A baby starts on milk alone (2), grows into the family's dal-roti-sabzi (1), and in great old age returns to soft food (3). Food follows teeth, and teeth follow age — the plate tells you how old its owner is.",
          hi: "शिशु केवल दूध से शुरू करता है (2), बड़ा होकर घर की दाल-रोटी-सब्ज़ी तक आता है (1), और बुढ़ापे में नरम भोजन पर लौटता है (3)। भोजन दाँतों के पीछे चलता है, और दाँत उम्र के — थाली बता देती है कि खाने वाला कितने बरस का है।",
          mr: "बाळ फक्त दुधापासून सुरुवात करते (2), मोठे होऊन घरच्या डाळ-पोळी-भाजीपर्यंत येते (1), आणि म्हातारपणी मऊ अन्नाकडे परतते (3). अन्न दातांमागे चालते, आणि दात वयामागे — ताट सांगते खाणारा किती वर्षांचा आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Trace a roti BACKWARD from the plate. Which chain is right?",
          hi: "थाली से रोटी को उल्टा पीछे ले जाइए। कौन-सी कड़ी सही है?",
          mr: "ताटातून पोळी उलटी मागे न्या. कोणती साखळी बरोबर?",
        },
        choices: [
          {
            en: "Roti ← dough ← flour ← wheat grain ← farmer's field",
            hi: "रोटी ← आटा गूँथा ← आटा ← गेहूँ का दाना ← किसान का खेत",
            mr: "पोळी ← कणीक ← पीठ ← गव्हाचा दाणा ← शेतकऱ्याचे शेत",
          },
          {
            en: "Roti ← flour ← dough ← field ← grain",
            hi: "रोटी ← आटा ← गूँथा आटा ← खेत ← दाना",
            mr: "पोळी ← पीठ ← कणीक ← शेत ← दाणा",
          },
          {
            en: "Roti ← wheat grain ← flour ← dough",
            hi: "रोटी ← गेहूँ का दाना ← आटा ← गूँथा आटा",
            mr: "पोळी ← गव्हाचा दाणा ← पीठ ← कणीक",
          },
          {
            en: "Roti ← shop ← tawa ← field",
            hi: "रोटी ← दुकान ← तवा ← खेत",
            mr: "पोळी ← दुकान ← तवा ← शेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Walk it forward to check: field grows grain, grain is ground to flour, flour is kneaded to dough, dough is rolled and cooked into roti. Reversed, that is exactly chain one. Every cooked food has such a chain, and most of them start in a field.",
          hi: "आगे की ओर चलकर जाँचें: खेत दाना उगाता है, दाना पिसकर आटा, आटा गुँधकर लोई, लोई बेलकर-सिंककर रोटी। उल्टा करने पर ठीक पहली कड़ी। हर पके भोजन की ऐसी कड़ी होती है, और अधिकांश की शुरुआत खेत से होती है।",
          mr: "पुढच्या दिशेने चालून तपासा: शेत दाणा पिकवते, दाणा दळून पीठ, पीठ मळून कणीक, कणीक लाटून-भाजून पोळी. उलट केल्यावर नेमकी पहिली साखळी. प्रत्येक शिजलेल्या अन्नाची अशी साखळी असते, आणि बहुतेकांची सुरुवात शेतातून होते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Ravi says: 'Everyone in India eats the same food every day.' Which single fact best shows he is wrong?",
          hi: "रवि कहता है: 'भारत में सब लोग रोज़ एक ही जैसा खाना खाते हैं।' कौन-सा एक तथ्य उसे सबसे अच्छी तरह ग़लत साबित करता है?",
          mr: "रवी म्हणतो: 'भारतात सर्व लोक रोज सारखेच अन्न खातात.' कोणते एक तथ्य त्याला सर्वांत चांगले खोटे ठरवते?",
        },
        choices: [
          {
            en: "In rice-growing places the plate holds rice at every meal, while in wheat-growing places it holds roti",
            hi: "धान वाले इलाक़ों की थाली में हर भोजन में चावल होता है, जबकि गेहूँ वाले इलाक़ों में रोटी",
            mr: "भाताच्या प्रदेशांत ताटात प्रत्येक जेवणात भात असतो, तर गव्हाच्या प्रदेशांत पोळी",
          },
          {
            en: "Everyone drinks water with their food",
            hi: "सब लोग खाने के साथ पानी पीते हैं",
            mr: "सर्व लोक जेवणाबरोबर पाणी पितात",
          },
          {
            en: "All food is cooked in some kitchen",
            hi: "सारा खाना किसी न किसी रसोई में पकता है",
            mr: "सारे अन्न कोणत्या ना कोणत्या स्वयंपाकघरात शिजते",
          },
          {
            en: "Most people eat at midday",
            hi: "अधिकतर लोग दोपहर में खाते हैं",
            mr: "बहुतेक लोक दुपारी जेवतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "To break an 'everyone, always' claim you need one clear difference — and the rice-lands versus wheat-lands plate is exactly that: what grows nearby shapes what is eaten daily. The other options are things people share, which SUPPORT sameness instead of disproving it.",
          hi: "'सब, हमेशा' वाले दावे को तोड़ने के लिए एक साफ़ अंतर चाहिए — और धान-प्रदेश बनाम गेहूँ-प्रदेश की थाली ठीक वही है: पास जो उगता है, वही रोज़ की थाली गढ़ता है। बाक़ी विकल्प सबकी साझी बातें हैं, जो समानता को काटने की जगह सहारा देती हैं।",
          mr: "'सर्व, नेहमी' हा दावा मोडायला एक स्पष्ट फरक लागतो — आणि भात-प्रदेश विरुद्ध गहू-प्रदेशाचे ताट नेमके तेच: जवळ जे पिकते तेच रोजचे ताट घडवते. इतर पर्याय सर्वांच्या समान गोष्टी — त्या साम्य खोडण्याऐवजी त्याला आधार देतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 18 — A House Like This (houses shaped by place and weather)     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-a-house-like-this",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 18 — A House Like This",
      hi: "अध्याय 18 — ऐसा भी एक घर",
      mr: "प्रकरण 18 — असेही एक घर",
    },
    name: { en: "A House Like This", hi: "ऐसा भी एक घर", mr: "असेही एक घर" },
    summary: {
      en: "Stilts over water, sloping roofs under rain, thick mud walls against heat — every house answers its own weather.",
      hi: "पानी पर खंभों वाले, बारिश में ढलवाँ छतों वाले, गर्मी के विरुद्ध मोटी मिट्टी की दीवारों वाले — हर घर अपने मौसम का उत्तर है।",
      mr: "पाण्यावर खांबांवरची, पावसात उतरत्या छपरांची, उष्णतेविरुद्ध जाड मातीच्या भिंतींची — प्रत्येक घर आपल्या हवामानाचे उत्तर आहे.",
    },
    position: 18,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "stilthouse",
        name: { en: "A house on stilts", hi: "खंभों पर घर", mr: "खांबांवरचे घर" },
        kind: "house",
        prompt: {
          en: "In Assam, where it rains heavily and water collects, houses are built raised up on what?",
          hi: "असम में, जहाँ ख़ूब बारिश होती है और पानी भर जाता है, घर किन पर उठाकर बनाए जाते हैं?",
          mr: "आसाममध्ये, जिथे खूप पाऊस पडतो आणि पाणी साचते, घरे कशावर उंच बांधतात?",
        },
        statement: {
          en: "In rainy Assam, houses stand on strong bamboo stilts so flood water passes below the floor.",
          hi: "बरसाती असम में घर मज़बूत बाँस के खंभों पर खड़े होते हैं, ताकि बाढ़ का पानी फ़र्श के नीचे से निकल जाए।",
          mr: "पावसाळी आसामात घरे मजबूत बांबूच्या खांबांवर उभी असतात, म्हणजे पुराचे पाणी जमिनीखालून वाहून जाते.",
        },
        detail: {
          en: "A ladder or wooden steps climb up to the door of such a house.",
          hi: "ऐसे घर के दरवाज़े तक सीढ़ी या लकड़ी के पायदान चढ़ते हैं।",
          mr: "अशा घराच्या दारापर्यंत शिडी वा लाकडी पायऱ्या चढतात.",
        },
        pair: {
          left: { en: "A house on stilts", hi: "खंभों पर घर", mr: "खांबांवरचे घर" },
          right: { en: "flood water passes below", hi: "बाढ़ का पानी नीचे से निकलता", mr: "पुराचे पाणी खालून जाते" },
        },
      },
      {
        id: "slopingroof",
        name: { en: "A sloping roof", hi: "ढलवाँ छत", mr: "उतरते छप्पर" },
        kind: "house-part",
        prompt: {
          en: "In places of heavy rain or snowfall, what shape of roof lets it all slide off?",
          hi: "ख़ूब बारिश या बर्फ़ वाली जगहों पर किस आकार की छत सब कुछ नीचे सरका देती है?",
          mr: "खूप पाऊस वा बर्फ पडणाऱ्या ठिकाणी कोणत्या आकाराचे छप्पर सारे खाली घसरवते?",
        },
        statement: {
          en: "A sloping roof lets rain and snow slide off instead of piling up and leaking through.",
          hi: "ढलवाँ छत बारिश और बर्फ़ को जमने-टपकने देने के बजाय नीचे सरका देती है।",
          mr: "उतरते छप्पर पाऊस आणि बर्फ साचून गळण्याऐवजी खाली घसरवते.",
        },
        pair: {
          left: { en: "A sloping roof", hi: "ढलवाँ छत", mr: "उतरते छप्पर" },
          right: { en: "rain slides off", hi: "बारिश सरक जाती", mr: "पाऊस घसरून जातो" },
        },
      },
      {
        id: "mudhouse",
        name: { en: "A mud house", hi: "मिट्टी का घर", mr: "मातीचे घर" },
        kind: "house",
        prompt: {
          en: "In hot desert villages of Rajasthan, houses with THICK walls of which material stay cool inside?",
          hi: "राजस्थान के गर्म रेगिस्तानी गाँवों में किस चीज़ की मोटी दीवारों वाले घर भीतर से ठंडे रहते हैं?",
          mr: "राजस्थानच्या उष्ण वाळवंटी खेड्यांत कशाच्या जाड भिंतींची घरे आतून थंड राहतात?",
        },
        statement: {
          en: "Thick mud walls keep desert houses cool inside when the sun blazes outside.",
          hi: "मोटी मिट्टी की दीवारें रेगिस्तानी घरों को बाहर धूप दहकने पर भी भीतर से ठंडा रखती हैं।",
          mr: "जाड मातीच्या भिंती बाहेर ऊन तापत असतानाही वाळवंटी घरे आतून थंड ठेवतात.",
        },
        detail: {
          en: "Their roofs are often thatched with dry grass, and walls painted with lovely patterns.",
          hi: "इनकी छतें प्रायः सूखी घास से छाई होती हैं, और दीवारों पर सुंदर चित्रकारी होती है।",
          mr: "यांची छपरे बहुधा वाळक्या गवताने शाकारलेली असतात, आणि भिंतींवर सुरेख नक्षी असते.",
        },
        pair: {
          left: { en: "Thick mud walls", hi: "मोटी मिट्टी की दीवारें", mr: "जाड मातीच्या भिंती" },
          right: { en: "cool in the heat", hi: "गर्मी में ठंडक", mr: "उष्णतेत गारवा" },
        },
      },
      {
        id: "houseboat",
        name: { en: "A houseboat", hi: "हाउसबोट (नाव-घर)", mr: "हाउसबोट (नाव-घर)" },
        kind: "house",
        prompt: {
          en: "On the lakes of Kashmir, some families live in carved wooden houses that FLOAT. What are these called?",
          hi: "कश्मीर की झीलों पर कुछ परिवार नक़्क़ाशीदार लकड़ी के तैरते घरों में रहते हैं। इन्हें क्या कहते हैं?",
          mr: "काश्मीरच्या सरोवरांवर काही कुटुंबे कोरीव लाकडी तरंगत्या घरांत राहतात. यांना काय म्हणतात?",
        },
        statement: {
          en: "A houseboat floats on a lake — a whole carved wooden home resting on the water.",
          hi: "हाउसबोट झील पर तैरता है — पानी पर टिका पूरा नक़्क़ाशीदार लकड़ी का घर।",
          mr: "हाउसबोट सरोवरावर तरंगते — पाण्यावर विसावलेले अख्खे कोरीव लाकडी घर.",
        },
        decoys: [
          { en: "A tent", hi: "तंबू", mr: "तंबू" },
          { en: "A flat-roofed house", hi: "सपाट छत वाला घर", mr: "सपाट छपराचे घर" },
        ],
        pair: {
          left: { en: "A houseboat", hi: "हाउसबोट", mr: "हाउसबोट" },
          right: { en: "floats on a lake", hi: "झील पर तैरता", mr: "सरोवरावर तरंगते" },
        },
      },
      {
        id: "tent",
        name: { en: "A tent", hi: "तंबू", mr: "तंबू" },
        kind: "house",
        prompt: {
          en: "Which cloth home can be folded up and carried when a family must keep moving from place to place?",
          hi: "कौन-सा कपड़े का घर तह करके साथ ले जाया जा सकता है, जब परिवार को जगह-जगह घूमते रहना हो?",
          mr: "कोणते कापडाचे घर घडी करून नेता येते, जेव्हा कुटुंबाला ठिकठिकाणी फिरत राहावे लागते?",
        },
        statement: {
          en: "A tent folds up and travels with the family — the home of people who keep moving, and of mountain climbers.",
          hi: "तंबू तह होकर परिवार के साथ चलता है — घूमते रहने वालों और पर्वतारोहियों का घर।",
          mr: "तंबू घडी होऊन कुटुंबाबरोबर प्रवास करतो — फिरस्त्यांचे आणि गिर्यारोहकांचे घर.",
        },
      },
      {
        id: "flatroof",
        name: {
          en: "A flat concrete roof",
          hi: "सपाट पक्की छत",
          mr: "सपाट पक्के छप्पर",
        },
        kind: "house-part",
        prompt: {
          en: "In dry city houses, which kind of roof can the family sleep and dry papads ON?",
          hi: "सूखी जगहों के शहरी घरों में किस तरह की छत पर परिवार सो सकता है और पापड़ सुखा सकता है?",
          mr: "कोरड्या ठिकाणच्या शहरी घरांत कोणत्या छपरावर कुटुंब झोपू शकते आणि पापड वाळवू शकते?",
        },
        statement: {
          en: "A flat concrete roof becomes a room without walls — for sleeping on hot nights, drying papads and flying kites.",
          hi: "सपाट पक्की छत बिना दीवारों का कमरा बन जाती है — गर्म रातों में सोने, पापड़ सुखाने और पतंग उड़ाने के लिए।",
          mr: "सपाट पक्के छप्पर भिंती नसलेली खोली होते — गरम रात्री झोपायला, पापड वाळवायला आणि पतंग उडवायला.",
        },
        pair: {
          left: { en: "A flat roof", hi: "सपाट छत", mr: "सपाट छप्पर" },
          right: { en: "works only where rain is little", hi: "कम बारिश में ही चलती", mr: "कमी पावसातच चालते" },
        },
      },
      {
        id: "igloo",
        name: { en: "An igloo", hi: "इग्लू", mr: "इग्लू" },
        kind: "house",
        prompt: {
          en: "In lands of ice, which round house is built from blocks of SNOW itself?",
          hi: "बर्फ़ के देशों में कौन-सा गोल घर ख़ुद बर्फ़ की सिल्लियों से बनता है?",
          mr: "बर्फाच्या प्रदेशांत कोणते गोल घर खुद्द बर्फाच्या ठोकळ्यांनी बांधतात?",
        },
        statement: {
          en: "An igloo is built from blocks of packed snow, and its round shape keeps the cold wind out and the warmth in.",
          hi: "इग्लू जमी बर्फ़ की सिल्लियों से बनता है, और उसका गोल आकार ठंडी हवा बाहर और गर्माहट भीतर रखता है।",
          mr: "इग्लू घट्ट बर्फाच्या ठोकळ्यांनी बांधतात, आणि त्याचा गोल आकार गार वारा बाहेर व ऊब आत ठेवतो.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the traveller to the house: Meenu is going to flooded Assam, Raza to a Kashmir lake, and Bala to a Rajasthan desert village. Which matching is right?",
          hi: "यात्री को घर से मिलाइए: मीनू बाढ़ वाले असम जा रही है, रज़ा कश्मीर की झील पर, और बाला राजस्थान के रेगिस्तानी गाँव। कौन-सा मेल सही है?",
          mr: "प्रवाशाला घराशी जुळवा: मीनू पुराच्या आसामला जाते आहे, रझा काश्मीरच्या सरोवरावर, आणि बाला राजस्थानच्या वाळवंटी खेड्यात. कोणती जुळणी बरोबर?",
        },
        choices: [
          {
            en: "Meenu: stilts · Raza: houseboat · Bala: thick mud walls",
            hi: "मीनू: खंभों वाला · रज़ा: हाउसबोट · बाला: मोटी मिट्टी की दीवारें",
            mr: "मीनू: खांबांवरचे · रझा: हाउसबोट · बाला: जाड मातीच्या भिंती",
          },
          {
            en: "Meenu: houseboat · Raza: mud walls · Bala: stilts",
            hi: "मीनू: हाउसबोट · रज़ा: मिट्टी की दीवारें · बाला: खंभे",
            mr: "मीनू: हाउसबोट · रझा: मातीच्या भिंती · बाला: खांब",
          },
          {
            en: "Meenu: igloo · Raza: stilts · Bala: houseboat",
            hi: "मीनू: इग्लू · रज़ा: खंभे · बाला: हाउसबोट",
            mr: "मीनू: इग्लू · रझा: खांब · बाला: हाउसबोट",
          },
          {
            en: "Meenu: mud walls · Raza: tent · Bala: houseboat",
            hi: "मीनू: मिट्टी की दीवारें · रज़ा: तंबू · बाला: हाउसबोट",
            mr: "मीनू: मातीच्या भिंती · रझा: तंबू · बाला: हाउसबोट",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each house answers its place: stilts lift floors above Assam's floods, a houseboat rests on the very lake Raza visits, and thick mud walls beat Bala's desert heat. Swap any pair and the house stops making sense — that is the whole lesson of the chapter.",
          hi: "हर घर अपनी जगह का उत्तर है: खंभे असम की बाढ़ से फ़र्श ऊपर उठाते हैं, हाउसबोट उसी झील पर टिका है जहाँ रज़ा जा रहा है, और मोटी मिट्टी की दीवारें बाला की रेगिस्तानी गर्मी झेलती हैं। कोई भी जोड़ा बदल दें तो घर बेमानी हो जाता है — अध्याय का सारा पाठ यही है।",
          mr: "प्रत्येक घर आपल्या जागेचे उत्तर: खांब आसामच्या पुरावर जमीन उचलतात, हाउसबोट रझा जातो त्याच सरोवरावर विसावते, आणि जाड मातीच्या भिंती बालाच्या वाळवंटी उष्णतेला पुरून उरतात. कोणतीही जोडी उलटा — घर निरर्थक होते. प्रकरणाचा सारा धडा हाच.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A builder copies a Rajasthan flat-roofed mud house, brick for brick, in a Kerala town where it rains for months. What goes wrong FIRST?",
          hi: "एक मिस्त्री राजस्थान का सपाट छत वाला मिट्टी का घर, जस का तस, केरल के उस नगर में बनाता है जहाँ महीनों बारिश होती है। सबसे पहले क्या बिगड़ेगा?",
          mr: "एक बांधकाम्या राजस्थानचे सपाट छपराचे मातीचे घर, जसेच्या तसे, महिनोन्महिने पाऊस पडणाऱ्या केरळच्या गावात बांधतो. सर्वांत आधी काय बिघडेल?",
        },
        choices: [
          {
            en: "Rain stands on the flat roof and soaks the mud walls — the house is answering the wrong weather",
            hi: "बारिश सपाट छत पर ठहरकर मिट्टी की दीवारें भिगो देगी — घर ग़लत मौसम का उत्तर दे रहा है",
            mr: "पाऊस सपाट छपरावर साचून मातीच्या भिंती भिजवेल — घर चुकीच्या हवामानाचे उत्तर देते आहे",
          },
          {
            en: "The house will be too cold inside",
            hi: "घर भीतर से बहुत ठंडा रहेगा",
            mr: "घर आतून फार थंड राहील",
          },
          {
            en: "Nothing — a good house suits every place",
            hi: "कुछ नहीं — अच्छा घर हर जगह चलता है",
            mr: "काही नाही — चांगले घर सगळीकडे चालते",
          },
          {
            en: "The paint will fade faster in Kerala",
            hi: "केरल में रंग जल्दी फीका होगा",
            mr: "केरळात रंग लवकर फिका होईल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The desert design assumes rain is rare: a flat roof stores water it never expected, and wet mud softens. Kerala's own houses answer their sky with sloping tiled roofs. A house is not good or bad in itself — it is right or wrong FOR ITS WEATHER, which is why the chapter shows so many kinds.",
          hi: "रेगिस्तानी बनावट मानकर चलती है कि बारिश दुर्लभ है: सपाट छत वह पानी रोक लेती है जिसकी उसे उम्मीद ही नहीं थी, और गीली मिट्टी नरम पड़ जाती है। केरल के अपने घर ढलवाँ खपरैल छतों से अपने आसमान का उत्तर देते हैं। घर अपने आप में अच्छा-बुरा नहीं होता — वह अपने मौसम के लिए सही या ग़लत होता है; इसीलिए अध्याय इतने तरह के घर दिखाता है।",
          mr: "वाळवंटी रचना पाऊस दुर्मीळ धरून चालते: सपाट छप्पर अनपेक्षित पाणी साठवते, आणि ओली माती मऊ पडते. केरळची स्वतःची घरे उतरत्या कौलारू छपरांनी आपल्या आभाळाला उत्तर देतात. घर स्वतःत चांगले-वाईट नसते — ते आपल्या हवामानासाठी बरोबर वा चूक असते; म्हणूनच प्रकरण इतकी घरे दाखवते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Why is an igloo — a house of SNOW — warm inside, when snow itself is freezing cold?",
          hi: "इग्लू — बर्फ़ का घर — भीतर से गर्म क्यों रहता है, जबकि बर्फ़ ख़ुद बर्फ़ीली ठंडी है?",
          mr: "इग्लू — बर्फाचे घर — आतून उबदार का असते, जेव्हा बर्फ स्वतः गोठवणारा गार आहे?",
        },
        choices: [
          {
            en: "Packed snow blocks the freezing WIND, and the small round space holds in the people's own warmth",
            hi: "जमी बर्फ़ बर्फ़ीली हवा को रोकती है, और छोटा गोल स्थान लोगों की अपनी गर्माहट सँजो लेता है",
            mr: "घट्ट बर्फ गोठवणारा वारा अडवतो, आणि लहान गोल जागा माणसांची स्वतःची ऊब धरून ठेवते",
          },
          {
            en: "The snow blocks are secretly heated before building",
            hi: "बर्फ़ की सिल्लियाँ बनाने से पहले चुपके से गर्म की जाती हैं",
            mr: "बर्फाचे ठोकळे बांधण्याआधी गुपचूप गरम करतात",
          },
          {
            en: "Igloos are actually cold inside too",
            hi: "इग्लू भीतर से भी ठंडे ही होते हैं",
            mr: "इग्लू आतूनही गारच असतात",
          },
          {
            en: "The sun melts the top open to let heat in",
            hi: "धूप ऊपर से पिघलाकर गर्मी अंदर आने देती है",
            mr: "ऊन वरून वितळवून उष्णता आत येऊ देते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Outside, the killing cold is mostly the WIND; snow walls stop it dead. Inside, a small closed dome keeps the warmth of bodies and a little lamp from escaping. The igloo does not make heat — it refuses to lose it, which in the coldest places is the same victory.",
          hi: "बाहर जानलेवा ठंड ज़्यादातर हवा है; बर्फ़ की दीवारें उसे वहीं रोक देती हैं। भीतर, छोटा बंद गुंबद शरीरों और नन्हे दीये की गर्माहट को निकलने नहीं देता। इग्लू गर्मी बनाता नहीं — उसे खोने से इनकार करता है, और सबसे ठंडी जगहों में यही जीत है।",
          mr: "बाहेर जीवघेणी थंडी मुख्यतः वारा असते; बर्फाच्या भिंती त्याला तिथेच थोपवतात. आत, लहान बंद घुमट शरीरांची आणि छोट्या दिव्याची ऊब निसटू देत नाही. इग्लू उष्णता निर्माण करत नाही — ती गमावण्यास नकार देतो, आणि सर्वांत थंड ठिकाणी हाच विजय.",
        },
      },
    ],
  },
];
