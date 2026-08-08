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
  /* ----------------------------------------------------------------------- */
  /* Chapter 19 — Our Friends — Animals (caring for animals)                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-our-friends-animals",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 19 — Our Friends — Animals",
      hi: "अध्याय 19 — हमारे साथी — जानवर",
      mr: "प्रकरण 19 — आपले मित्र — प्राणी",
    },
    name: {
      en: "Our Friends — Animals",
      hi: "हमारे साथी — जानवर",
      mr: "आपले मित्र — प्राणी",
    },
    summary: {
      en: "The animals who live and work beside us — what each gives, what each needs, and how a child can be kind to them.",
      hi: "हमारे साथ रहने-काम करने वाले जानवर — कौन क्या देता है, किसे क्या चाहिए, और बच्चा उनके लिए दयालु कैसे बने।",
      mr: "आपल्यासोबत राहणारे-काम करणारे प्राणी — कोण काय देतो, कोणाला काय लागते, आणि मूल त्यांच्याशी दयाळू कसे वागू शकते.",
    },
    position: 19,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "bullock",
        name: { en: "The bullock", hi: "बैल", mr: "बैल" },
        kind: "working-animal",
        prompt: {
          en: "Which strong animal pulls the farmer's plough and cart in villages?",
          hi: "कौन-सा बलवान जानवर गाँवों में किसान का हल और गाड़ी खींचता है?",
          mr: "कोणता बलवान प्राणी खेड्यांत शेतकऱ्याचा नांगर आणि गाडी ओढतो?",
        },
        statement: {
          en: "The bullock pulls the plough through the field and the loaded cart along the road.",
          hi: "बैल खेत में हल और सड़क पर लदी गाड़ी खींचता है।",
          mr: "बैल शेतात नांगर आणि रस्त्यावर भरलेली गाडी ओढतो.",
        },
        pair: {
          left: { en: "The bullock", hi: "बैल", mr: "बैल" },
          right: { en: "plough and cart", hi: "हल और गाड़ी", mr: "नांगर आणि गाडी" },
        },
      },
      {
        id: "camel",
        name: { en: "The camel", hi: "ऊँट", mr: "उंट" },
        kind: "working-animal",
        prompt: {
          en: "Which tall animal, called the ship of the desert, carries loads across hot sand for days?",
          hi: "रेगिस्तान का जहाज़ कहलाने वाला कौन-सा ऊँचा जानवर दिनों तक गर्म रेत पर बोझ ढोता है?",
          mr: "वाळवंटातील जहाज म्हणवला जाणारा कोणता उंच प्राणी दिवसेंदिवस तापल्या वाळूवर ओझी वाहतो?",
        },
        statement: {
          en: "The camel crosses hot sand for days without water, its wide feet not sinking in — the ship of the desert.",
          hi: "ऊँट बिना पानी दिनों तक गर्म रेत पार करता है, चौड़े पैर धँसते नहीं — रेगिस्तान का जहाज़।",
          mr: "उंट पाण्याविना दिवसेंदिवस तापली वाळू पार करतो, रुंद पाय रुतत नाहीत — वाळवंटातील जहाज.",
        },
        detail: {
          en: "The hump on its back stores fat that feeds it through long journeys.",
          hi: "इसकी पीठ का कूबड़ चर्बी जमा रखता है, जो लंबे सफ़र में इसे खुराक देती है।",
          mr: "याच्या पाठीवरचे वशिंड चरबी साठवते, जी लांब प्रवासात त्याला खुराक देते.",
        },
        pair: {
          left: { en: "The camel", hi: "ऊँट", mr: "उंट" },
          right: { en: "ship of the desert", hi: "रेगिस्तान का जहाज़", mr: "वाळवंटातील जहाज" },
        },
      },
      {
        id: "hen",
        name: { en: "The hen", hi: "मुर्ग़ी", mr: "कोंबडी" },
        kind: "farm-animal",
        prompt: {
          en: "Which bird of the courtyard gives us eggs and clucks over her chicks?",
          hi: "आँगन की कौन-सी चिड़िया हमें अंडे देती है और चूज़ों पर कुड़कुड़ाती रहती है?",
          mr: "अंगणातली कोणती पक्षीण आपल्याला अंडी देते आणि पिलांवर कुडकुडत असते?",
        },
        statement: {
          en: "The hen lays the eggs we eat and gathers her chicks under her wings at dusk.",
          hi: "मुर्ग़ी वे अंडे देती है जो हम खाते हैं, और साँझ को चूज़ों को परों तले समेट लेती है।",
          mr: "कोंबडी आपण खातो ती अंडी घालते, आणि संध्याकाळी पिलांना पंखांखाली गोळा करते.",
        },
        pair: {
          left: { en: "The hen", hi: "मुर्ग़ी", mr: "कोंबडी" },
          right: { en: "eggs", hi: "अंडे", mr: "अंडी" },
        },
      },
      {
        id: "sheep",
        name: { en: "The sheep", hi: "भेड़", mr: "मेंढी" },
        kind: "farm-animal",
        prompt: {
          en: "From which animal's thick coat is wool cut to knit our winter sweaters?",
          hi: "किस जानवर के घने बालों से ऊन कतरकर हमारे सर्दियों के स्वेटर बुनते हैं?",
          mr: "कोणत्या प्राण्याच्या दाट केसांतून लोकर कातरून आपले हिवाळी स्वेटर विणतात?",
        },
        statement: {
          en: "The sheep grows a thick woolly coat, sheared each year to make sweaters and blankets.",
          hi: "भेड़ पर घना ऊनी कोट उगता है, जो हर साल कतरकर स्वेटर-कंबल बनते हैं।",
          mr: "मेंढीवर दाट लोकरीचा कोट वाढतो; तो दरवर्षी कातरून स्वेटर-घोंगड्या होतात.",
        },
        pair: {
          left: { en: "The sheep", hi: "भेड़", mr: "मेंढी" },
          right: { en: "wool", hi: "ऊन", mr: "लोकर" },
        },
      },
      {
        id: "donkey",
        name: { en: "The donkey", hi: "गधा", mr: "गाढव" },
        kind: "working-animal",
        prompt: {
          en: "Which patient animal carries the washerman's heavy bundles of clothes on its back?",
          hi: "कौन-सा धैर्यवान जानवर धोबी के कपड़ों की भारी गठरियाँ पीठ पर ढोता है?",
          mr: "कोणता सोशीक प्राणी परटाची कपड्यांची जड गाठोडी पाठीवर वाहतो?",
        },
        statement: {
          en: "The donkey carries heavy bundles up and down the lanes, working quietly all day.",
          hi: "गधा गलियों में भारी गठरियाँ ढोता है, दिन भर चुपचाप काम करता हुआ।",
          mr: "गाढव गल्ल्यांतून जड गाठोडी वाहते, दिवसभर मुकाट्याने काम करत.",
        },
      },
      {
        id: "strayfeeding",
        name: {
          en: "Keeping water out for animals",
          hi: "जानवरों के लिए पानी रखना",
          mr: "प्राण्यांसाठी पाणी ठेवणे",
        },
        kind: "kindness",
        prompt: {
          en: "In the hottest weeks of summer, what simple kindness can a child do daily for birds and street animals?",
          hi: "गर्मी के सबसे तपते हफ़्तों में बच्चा पक्षियों और गली के जानवरों के लिए रोज़ कौन-सी सीधी-सी दया कर सकता है?",
          mr: "उन्हाळ्याच्या सर्वांत तापल्या आठवड्यांत मूल पक्ष्यांसाठी आणि गल्लीतल्या प्राण्यांसाठी रोज कोणती साधी दया करू शकते?",
        },
        statement: {
          en: "Keeping a bowl of clean water on the ledge or doorstep saves birds and street animals through the summer heat.",
          hi: "मुँडेर या दहलीज़ पर साफ़ पानी का कटोरा रखना पक्षियों और गली के जानवरों को गर्मी से बचा लेता है।",
          mr: "कठड्यावर वा उंबरठ्यावर स्वच्छ पाण्याची वाटी ठेवणे पक्ष्यांना आणि गल्लीतल्या प्राण्यांना उन्हाळ्यातून वाचवते.",
        },
      },
      {
        id: "notteasing",
        name: {
          en: "Never teasing or stoning",
          hi: "न चिढ़ाना, न पत्थर मारना",
          mr: "न चिडवणे, न दगड मारणे",
        },
        kind: "kindness",
        prompt: {
          en: "What must a child NEVER do to a street dog or a tied bullock, however bored the afternoon?",
          hi: "दोपहर चाहे कितनी भी सूनी हो, बच्चे को गली के कुत्ते या बँधे बैल के साथ क्या कभी नहीं करना चाहिए?",
          mr: "दुपार कितीही कंटाळवाणी असो, मुलाने गल्लीतल्या कुत्र्याशी वा बांधलेल्या बैलाशी काय कधीही करू नये?",
        },
        statement: {
          en: "Teasing or throwing stones frightens and hurts animals — and a frightened animal may bite or kick to save itself.",
          hi: "चिढ़ाना या पत्थर फेंकना जानवरों को डराता और चोट देता है — और डरा हुआ जानवर ख़ुद को बचाने के लिए काट या दुलत्ती मार सकता है।",
          mr: "चिडवणे वा दगड फेकणे प्राण्यांना घाबरवते आणि दुखवते — आणि घाबरलेला प्राणी स्वतःला वाचवायला चावू वा लाथ मारू शकतो.",
        },
      },
      {
        id: "birdsgrain",
        name: {
          en: "Scattering grain",
          hi: "दाना बिखेरना",
          mr: "दाणे टाकणे",
        },
        kind: "kindness",
        prompt: {
          en: "What do many families scatter on the roof or courtyard each morning for sparrows and pigeons?",
          hi: "कई परिवार रोज़ सुबह छत या आँगन में गौरैयों और कबूतरों के लिए क्या बिखेरते हैं?",
          mr: "अनेक कुटुंबे रोज सकाळी गच्चीवर वा अंगणात चिमण्या-कबुतरांसाठी काय टाकतात?",
        },
        statement: {
          en: "A handful of grain scattered each morning brings the sparrows and pigeons back day after day.",
          hi: "रोज़ सुबह बिखेरी मुट्ठी भर दाना गौरैयों-कबूतरों को दिन-प्रतिदिन लौटा लाती है।",
          mr: "रोज सकाळी टाकलेली मूठभर दाणे चिमण्या-कबुतरांना दिवसेंदिवस परत आणतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the animal to what it gives or does: bullock, hen, sheep, camel — plough-pulling, eggs, wool, desert journeys. Which line is entirely right?",
          hi: "जानवर को उसके काम या देन से मिलाइए: बैल, मुर्ग़ी, भेड़, ऊँट — हल खींचना, अंडे, ऊन, रेगिस्तानी सफ़र। कौन-सी पंक्ति पूरी सही है?",
          mr: "प्राण्याला त्याच्या कामाशी वा देणगीशी जुळवा: बैल, कोंबडी, मेंढी, उंट — नांगर ओढणे, अंडी, लोकर, वाळवंटी प्रवास. कोणती ओळ पूर्ण बरोबर?",
        },
        choices: [
          {
            en: "Bullock: plough · hen: eggs · sheep: wool · camel: desert",
            hi: "बैल: हल · मुर्ग़ी: अंडे · भेड़: ऊन · ऊँट: रेगिस्तान",
            mr: "बैल: नांगर · कोंबडी: अंडी · मेंढी: लोकर · उंट: वाळवंट",
          },
          {
            en: "Bullock: eggs · hen: wool · sheep: desert · camel: plough",
            hi: "बैल: अंडे · मुर्ग़ी: ऊन · भेड़: रेगिस्तान · ऊँट: हल",
            mr: "बैल: अंडी · कोंबडी: लोकर · मेंढी: वाळवंट · उंट: नांगर",
          },
          {
            en: "Bullock: wool · hen: eggs · sheep: plough · camel: desert",
            hi: "बैल: ऊन · मुर्ग़ी: अंडे · भेड़: हल · ऊँट: रेगिस्तान",
            mr: "बैल: लोकर · कोंबडी: अंडी · मेंढी: नांगर · उंट: वाळवंट",
          },
          {
            en: "Bullock: plough · hen: wool · sheep: eggs · camel: desert",
            hi: "बैल: हल · मुर्ग़ी: ऊन · भेड़: अंडे · ऊँट: रेगिस्तान",
            mr: "बैल: नांगर · कोंबडी: लोकर · मेंढी: अंडी · उंट: वाळवंट",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Strength pulls the plough (bullock), the courtyard bird lays eggs (hen), the woolly coat gives wool (sheep), and the wide-footed humped walker owns the desert (camel). Every wrong line has at least one animal doing another's work.",
          hi: "ताक़त हल खींचती है (बैल), आँगन की चिड़िया अंडे देती है (मुर्ग़ी), ऊनी कोट ऊन देता है (भेड़), और चौड़े पैर व कूबड़ वाला रेगिस्तान का स्वामी है (ऊँट)। हर ग़लत पंक्ति में कोई जानवर दूसरे का काम कर रहा है।",
          mr: "ताकद नांगर ओढते (बैल), अंगणातली पक्षीण अंडी देते (कोंबडी), लोकरीचा कोट लोकर देतो (मेंढी), आणि रुंद पायांचा वशिंडवाला वाळवंटाचा धनी (उंट). प्रत्येक चुकीच्या ओळीत कोणीतरी दुसऱ्याचे काम करतो आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A street dog usually lets children pass quietly, but today it growls, ears flat, backed into a corner with a wounded leg. What is the WISE and kind thing to do?",
          hi: "गली का कुत्ता प्रायः बच्चों को चुपचाप जाने देता है, पर आज घायल टाँग लिए कोने में सिमटा, कान चिपकाए ग़ुर्रा रहा है। समझदारी और दया की बात क्या होगी?",
          mr: "गल्लीतला कुत्रा एरवी मुलांना शांतपणे जाऊ देतो, पण आज जखमी पायाने कोपऱ्यात दबून, कान चिकटवून गुरगुरतो आहे. शहाणपणाची आणि दयेची गोष्ट कोणती?",
        },
        choices: [
          {
            en: "Keep your distance and tell an adult or an animal helpline — a hurt, cornered animal may bite even a friend",
            hi: "दूरी रखें और किसी बड़े या पशु-सहायता को बताएँ — घायल, घिरा जानवर दोस्त को भी काट सकता है",
            mr: "अंतर ठेवा आणि मोठ्यांना वा प्राणी-मदतकेंद्राला सांगा — जखमी, कोंडलेला प्राणी मित्रालाही चावू शकतो",
          },
          {
            en: "Hug it to show it is loved",
            hi: "गले लगाकर दिखाएँ कि उसे प्यार मिलता है",
            mr: "मिठी मारून प्रेम दाखवा",
          },
          {
            en: "Throw a small stone so it moves out of the corner",
            hi: "छोटा पत्थर फेंकें ताकि वह कोने से हट जाए",
            mr: "छोटा दगड फेका म्हणजे तो कोपऱ्यातून हलेल",
          },
          {
            en: "Growl back so it learns who is stronger",
            hi: "पलटकर ग़ुर्राएँ ताकि उसे पता चले कौन ताक़तवर है",
            mr: "उलट गुरगुरा म्हणजे कोण बलवान ते त्याला कळेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The growl, flat ears and corner all say the same thing: 'I am scared and hurt.' Kindness to a frightened animal is space plus grown-up help, not hands. The fact from this chapter doing the work: a frightened animal defends itself — even against a friend.",
          hi: "ग़ुर्राहट, चिपके कान और कोना — तीनों एक ही बात कहते हैं: 'मैं डरा और घायल हूँ।' डरे जानवर के लिए दया है दूरी और बड़ों की मदद, हाथ नहीं। अध्याय का यही तथ्य काम कर रहा है: डरा जानवर अपनी रक्षा करता है — दोस्त से भी।",
          mr: "गुरगुर, चिकटलेले कान आणि कोपरा — तिन्ही एकच सांगतात: 'मी घाबरलो आणि जखमी आहे.' घाबरलेल्या प्राण्यासाठी दया म्हणजे अंतर आणि मोठ्यांची मदत, हात नव्हे. प्रकरणातले हेच तथ्य काम करते: घाबरलेला प्राणी स्वतःचे रक्षण करतो — मित्रापासूनही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Grandmother says: 'In my village nobody fed the sparrows, yet there were many. In this city people scatter grain daily, yet sparrows are few.' What best explains the puzzle?",
          hi: "दादी कहती हैं: 'मेरे गाँव में कोई गौरैयों को दाना नहीं देता था, फिर भी वे बहुत थीं। इस शहर में लोग रोज़ दाना डालते हैं, फिर भी गौरैया कम हैं।' पहेली की सबसे अच्छी व्याख्या क्या है?",
          mr: "आजी म्हणते: 'माझ्या गावात कोणी चिमण्यांना दाणे देत नसे, तरी त्या पुष्कळ होत्या. या शहरात लोक रोज दाणे टाकतात, तरी चिमण्या थोड्या.' कोड्याचे सर्वांत चांगले स्पष्टीकरण कोणते?",
        },
        choices: [
          {
            en: "Food is only one need — the village gave bushes, insects and nesting nooks that city buildings and noise take away",
            hi: "दाना एक ही ज़रूरत है — गाँव झाड़ियाँ, कीड़े और घोंसले की जगहें देता था, जो शहर की इमारतें और शोर छीन लेते हैं",
            mr: "दाणे ही एकच गरज — गाव झुडपे, किडे आणि घरट्यांच्या जागा देत असे, ज्या शहरातील इमारती आणि गोंगाट हिरावतात",
          },
          {
            en: "City sparrows dislike free grain",
            hi: "शहरी गौरैयों को मुफ़्त दाना पसंद नहीं",
            mr: "शहरी चिमण्यांना फुकट दाणे आवडत नाहीत",
          },
          {
            en: "Grandmother is remembering wrongly",
            hi: "दादी को ग़लत याद है",
            mr: "आजीला चुकीचे आठवते आहे",
          },
          {
            en: "Village grain was tastier than city grain",
            hi: "गाँव का दाना शहर के दाने से स्वादिष्ट था",
            mr: "गावचे दाणे शहरच्या दाण्यांहून चविष्ट होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "An animal needs food AND shelter AND a place to raise its young. The village supplied all three without anyone trying; the city hands out only the first. When kindness gives one need and takes two, the count still falls — which is why real care means bushes and nest-boxes, not grain alone.",
          hi: "जानवर को खाना भी चाहिए, ठिकाना भी, और बच्चे पालने की जगह भी। गाँव बिना किसी कोशिश के तीनों देता था; शहर केवल पहली चीज़ बाँटता है। जब दया एक ज़रूरत देकर दो छीन ले, तो गिनती फिर भी गिरती है — असली देखभाल इसीलिए दाने के साथ झाड़ियाँ और घोंसला-घर भी है।",
          mr: "प्राण्याला अन्नही हवे, निवाराही, आणि पिले वाढवण्याची जागाही. गाव न प्रयत्न करता तिन्ही देत असे; शहर फक्त पहिली गोष्ट वाटते. दया एक गरज देऊन दोन हिरावते, तेव्हा संख्या तरीही घटते — खरी काळजी म्हणूनच दाण्यांसोबत झुडपे आणि घरटी-पेट्याही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 16 — Games We Play                                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-games-we-play",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 16 — Games We Play",
      hi: "अध्याय 16 — हमारे खेल",
      mr: "प्रकरण 16 — आपले खेळ",
    },
    name: { en: "Games We Play", hi: "हमारे खेल", mr: "आपले खेळ" },
    summary: {
      en: "Indoor and outdoor, old and new — the games children play, what each one needs, and why the body loves to run.",
      hi: "घर के भीतर और बाहर, पुराने और नए — बच्चों के खेल, हर एक को क्या चाहिए, और शरीर को दौड़ना क्यों भाता है।",
      mr: "घरातले आणि बाहेरचे, जुने आणि नवे — मुलांचे खेळ, प्रत्येकाला काय लागते, आणि शरीराला धावणे का आवडते.",
    },
    position: 16,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "kabaddi",
        name: { en: "Kabaddi", hi: "कबड्डी", mr: "कबड्डी" },
        kind: "outdoor-game",
        prompt: {
          en: "In which game does a raider cross a line chanting one word in a single breath, trying to tag and return?",
          hi: "किस खेल में धावक एक ही साँस में एक शब्द रटते हुए रेखा पार करता है, छूकर लौटने की कोशिश में?",
          mr: "कोणत्या खेळात चढाई करणारा एकाच दमात एक शब्द म्हणत रेषा ओलांडतो, शिवून परतण्याच्या प्रयत्नात?",
        },
        statement: {
          en: "In kabaddi the raider chants the word without taking a breath, tags opponents and races back across the line.",
          hi: "कबड्डी में धावक बिना साँस लिए शब्द रटता है, विरोधियों को छूता है और रेखा के पार दौड़ लौटता है।",
          mr: "कबड्डीत चढाई करणारा दम न घेता शब्द म्हणतो, प्रतिस्पर्ध्यांना शिवतो आणि रेषेपलीकडे धावत परततो.",
        },
        detail: {
          en: "This game needs no ball, no bat — only a court scratched on the ground and two teams.",
          hi: "इस खेल को न गेंद चाहिए, न बल्ला — बस ज़मीन पर खिंचा पाला और दो टोलियाँ।",
          mr: "या खेळाला चेंडू नको, बॅट नको — फक्त जमिनीवर आखलेले मैदान आणि दोन संघ.",
        },
        pair: {
          left: { en: "Kabaddi", hi: "कबड्डी", mr: "कबड्डी" },
          right: { en: "one breath", hi: "एक साँस", mr: "एक दम" },
        },
      },
      {
        id: "khokho",
        name: { en: "Kho-kho", hi: "खो-खो", mr: "खो-खो" },
        kind: "outdoor-game",
        prompt: {
          en: "In which chasing game do squatting players face opposite ways in a row, and the chaser shouts a word to pass the chase on?",
          hi: "किस पीछा करने वाले खेल में बैठे खिलाड़ी क़तार में उल्टी-सीधी दिशा देखते हैं, और धावक पीछा सौंपने को एक शब्द पुकारता है?",
          mr: "कोणत्या पाठलागाच्या खेळात बसलेले खेळाडू रांगेत उलटसुलट दिशांना तोंड करतात, आणि पाठलाग सोपवायला धावणारा एक शब्द ओरडतो?",
        },
        statement: {
          en: "In kho-kho the chasers squat in a row facing alternate ways, and a touch with the word passes the chase to a sitter.",
          hi: "खो-खो में पीछा करने वाले क़तार में एकांतर दिशाएँ देखते बैठते हैं, और शब्द के साथ छूने से पीछा बैठे खिलाड़ी को मिल जाता है।",
          mr: "खो-खोमध्ये पाठलाग करणारे रांगेत आलटूनपालटून दिशांना तोंड करून बसतात, आणि शब्दासह स्पर्शाने पाठलाग बसलेल्याकडे जातो.",
        },
        pair: {
          left: { en: "Kho-kho", hi: "खो-खो", mr: "खो-खो" },
          right: { en: "squatting row", hi: "बैठी क़तार", mr: "बसलेली रांग" },
        },
      },
      {
        id: "ludo",
        name: { en: "Ludo", hi: "लूडो", mr: "ल्युडो" },
        kind: "indoor-game",
        prompt: {
          en: "Which indoor board game moves four coloured tokens home on the throws of a die?",
          hi: "कौन-सा भीतरी खेल पासे की चाल पर चार रंगीन गोटियाँ घर पहुँचाता है?",
          mr: "कोणता घरातला पटावरचा खेळ फाशाच्या दानावर चार रंगीत सोंगट्या घरी पोहोचवतो?",
        },
        statement: {
          en: "Ludo is played sitting down, racing four tokens around a board by the luck of the die.",
          hi: "लूडो बैठकर खेला जाता है — पासे की क़िस्मत पर चार गोटियों की पटरी-दौड़।",
          mr: "ल्युडो बसून खेळतात — फाशाच्या नशिबावर चार सोंगट्यांची पटावरची शर्यत.",
        },
        pair: {
          left: { en: "Ludo", hi: "लूडो", mr: "ल्युडो" },
          right: { en: "a die and tokens", hi: "पासा और गोटियाँ", mr: "फासा आणि सोंगट्या" },
        },
      },
      {
        id: "hopscotch",
        name: {
          en: "Hopscotch (stapu)",
          hi: "स्टापू (कित-कित)",
          mr: "लंगडी-पाणी (स्टापू)",
        },
        kind: "outdoor-game",
        prompt: {
          en: "In which game do you toss a stone into chalk squares and hop through them on one leg?",
          hi: "किस खेल में चॉक के ख़ानों में पत्थर फेंककर एक टाँग पर फुदकते हुए पार जाते हैं?",
          mr: "कोणत्या खेळात खडूच्या चौकटींत दगड टाकून एका पायावर उड्या मारत पार जातात?",
        },
        statement: {
          en: "In hopscotch a stone is tossed into numbered squares and the player hops across on one leg without touching the lines.",
          hi: "स्टापू में गिनती वाले ख़ानों में पत्थर फेंका जाता है और खिलाड़ी रेखाएँ छुए बिना एक टाँग पर फुदककर पार जाता है।",
          mr: "स्टापूत आकड्यांच्या चौकटींत दगड टाकतात आणि खेळाडू रेषांना न शिवता एका पायावर उड्या मारत पार जातो.",
        },
        pair: {
          left: { en: "Hopscotch", hi: "स्टापू", mr: "स्टापू" },
          right: { en: "hopping on one leg", hi: "एक टाँग की फुदक", mr: "एका पायावर उड्या" },
        },
      },
      {
        id: "carrom",
        name: { en: "Carrom", hi: "कैरम", mr: "कॅरम" },
        kind: "indoor-game",
        prompt: {
          en: "In which board game do fingers flick a striker to pocket black and white coins at the four corners?",
          hi: "किस पटिया-खेल में उँगलियाँ स्ट्राइकर चलाकर काली-सफ़ेद गोटियाँ चारों कोनों के गड्ढों में डालती हैं?",
          mr: "कोणत्या पटाच्या खेळात बोटे स्ट्रायकर उडवून काळ्या-पांढऱ्या सोंगट्या चार कोपऱ्यांतील खळग्यांत टाकतात?",
        },
        statement: {
          en: "Carrom is played with a flicked striker, sending coins into the four corner pockets of a powdered board.",
          hi: "कैरम में उँगली से चला स्ट्राइकर पाउडर लगे बोर्ड की चारों कोनों की जेबों में गोटियाँ पहुँचाता है।",
          mr: "कॅरममध्ये बोटाने उडवलेला स्ट्रायकर पावडर लावलेल्या पटाच्या चार कोपऱ्यांतील खिशांत सोंगट्या पाठवतो.",
        },
      },
      {
        id: "running",
        name: {
          en: "Running games",
          hi: "दौड़ के खेल",
          mr: "धावण्याचे खेळ",
        },
        kind: "why-play",
        prompt: {
          en: "Which kind of games make the heart beat fast, the lungs breathe deep and the legs grow strong?",
          hi: "किस तरह के खेल दिल की धड़कन तेज़, साँस गहरी और टाँगें मज़बूत करते हैं?",
          mr: "कोणत्या प्रकारचे खेळ हृदयाची धडधड जलद, श्वास खोल आणि पाय मजबूत करतात?",
        },
        statement: {
          en: "Running games work the heart, lungs and legs — the body grows strong by playing, not by sitting.",
          hi: "दौड़ के खेल दिल, फेफड़े और टाँगों से काम लेते हैं — शरीर बैठने से नहीं, खेलने से मज़बूत होता है।",
          mr: "धावण्याचे खेळ हृदय, फुप्फुसे आणि पायांकडून काम करवतात — शरीर बसण्याने नव्हे, खेळण्याने मजबूत होते.",
        },
      },
      {
        id: "teamturns",
        name: {
          en: "Taking turns fairly",
          hi: "बारी का न्याय",
          mr: "पाळीचा न्याय",
        },
        kind: "why-play",
        prompt: {
          en: "Besides strong legs, what does playing in a team quietly teach — shown every time the bat passes to the next child?",
          hi: "मज़बूत टाँगों के अलावा, टोली में खेलना चुपचाप क्या सिखाता है — जो हर बार बल्ला अगले बच्चे को देते समय दिखता है?",
          mr: "मजबूत पायांखेरीज, संघात खेळणे गुपचूप काय शिकवते — जे प्रत्येक वेळी बॅट पुढच्या मुलाकडे देताना दिसते?",
        },
        statement: {
          en: "Team games teach waiting for your turn, following rules everyone agreed on, and losing without quarrelling.",
          hi: "टोली के खेल सिखाते हैं — अपनी बारी की प्रतीक्षा, सबके माने नियमों का पालन, और बिना झगड़े हारना।",
          mr: "संघाचे खेळ शिकवतात — आपल्या पाळीची वाट पाहणे, सर्वांनी मान्य केलेले नियम पाळणे, आणि भांडणाविना हरणे.",
        },
      },
      {
        id: "grandmothergames",
        name: {
          en: "Grandmother's games",
          hi: "दादी-नानी के खेल",
          mr: "आजीचे खेळ",
        },
        kind: "why-play",
        prompt: {
          en: "Gitte (five stones), gilli-danda, spinning tops — whose childhood games are these, still playable without buying anything?",
          hi: "गिट्टे, गिल्ली-डंडा, लट्टू — ये किसके बचपन के खेल हैं, जो आज भी बिना कुछ ख़रीदे खेले जा सकते हैं?",
          mr: "गजगे, विटी-दांडू, भोवरे — हे कोणाच्या बालपणीचे खेळ, आजही काहीही विकत न घेता खेळता येणारे?",
        },
        statement: {
          en: "Grandparents played gitte, gilli-danda and tops — games of pebbles, sticks and string that cost nothing and are still fun.",
          hi: "दादा-दादी गिट्टे, गिल्ली-डंडा और लट्टू खेलते थे — कंकड़, लकड़ी और डोरी के खेल, जिन पर कुछ ख़र्च नहीं होता और मज़ा आज भी है।",
          mr: "आजी-आजोबा गजगे, विटी-दांडू आणि भोवरे खेळत — खडे, काठ्या आणि दोरीचे खेळ; खर्च शून्य आणि मजा आजही तितकीच.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into INDOOR and OUTDOOR: kabaddi, ludo, kho-kho, carrom. Which sorting is right?",
          hi: "इन्हें भीतरी और बाहरी में छाँटिए: कबड्डी, लूडो, खो-खो, कैरम। कौन-सी छँटाई सही है?",
          mr: "यांची घरातले आणि बाहेरचे अशी वर्गवारी करा: कबड्डी, ल्युडो, खो-खो, कॅरम. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Indoor: ludo, carrom · Outdoor: kabaddi, kho-kho",
            hi: "भीतरी: लूडो, कैरम · बाहरी: कबड्डी, खो-खो",
            mr: "घरातले: ल्युडो, कॅरम · बाहेरचे: कबड्डी, खो-खो",
          },
          {
            en: "Indoor: kabaddi, ludo · Outdoor: carrom, kho-kho",
            hi: "भीतरी: कबड्डी, लूडो · बाहरी: कैरम, खो-खो",
            mr: "घरातले: कबड्डी, ल्युडो · बाहेरचे: कॅरम, खो-खो",
          },
          {
            en: "Indoor: kho-kho, carrom · Outdoor: kabaddi, ludo",
            hi: "भीतरी: खो-खो, कैरम · बाहरी: कबड्डी, लूडो",
            mr: "घरातले: खो-खो, कॅरम · बाहेरचे: कबड्डी, ल्युडो",
          },
          {
            en: "Indoor: kabaddi, carrom · Outdoor: ludo, kho-kho",
            hi: "भीतरी: कबड्डी, कैरम · बाहरी: लूडो, खो-खो",
            mr: "घरातले: कबड्डी, कॅरम · बाहेरचे: ल्युडो, खो-खो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The test is space and sweat: ludo and carrom sit on a table-top; kabaddi and kho-kho need a court and running room. Any sorting that sends a running game indoors has not pictured the game being played.",
          hi: "कसौटी है जगह और पसीना: लूडो और कैरम मेज़ पर सिमटते हैं; कबड्डी और खो-खो को पाला और दौड़ की जगह चाहिए। जो छँटाई दौड़ के खेल को भीतर भेजे, उसने खेल को खेलते हुए सोचा ही नहीं।",
          mr: "कसोटी आहे जागा आणि घाम: ल्युडो आणि कॅरम टेबलावर मावतात; कबड्डी आणि खो-खोला मैदान आणि धावायला जागा लागते. धावण्याचा खेळ घरात पाठवणाऱ्या वर्गवारीने खेळ खेळताना पाहिलेलाच नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "It has rained all week. Four friends have one carrom board, one die, no open ground, and a grandmother full of games. Which afternoon plan uses what they actually HAVE?",
          hi: "हफ़्ते भर बारिश हुई है। चार दोस्तों के पास एक कैरम बोर्ड, एक पासा, कोई खुला मैदान नहीं, और खेलों से भरी एक दादी हैं। कौन-सी दोपहर की योजना वही इस्तेमाल करती है जो उनके पास सचमुच है?",
          mr: "आठवडाभर पाऊस पडला आहे. चार मित्रांकडे एक कॅरम बोर्ड, एक फासा, मोकळे मैदान नाही, आणि खेळांनी भरलेली एक आजी आहे. कोणती दुपारची योजना त्यांच्याकडे खरोखर आहे तेच वापरते?",
        },
        choices: [
          {
            en: "Carrom in pairs, then gitte with pebbles the way grandmother teaches",
            hi: "जोड़ियों में कैरम, फिर दादी के सिखाए ढंग से कंकड़ों के गिट्टे",
            mr: "जोड्यांनी कॅरम, मग आजी शिकवते तशा खड्यांचे गजगे",
          },
          {
            en: "Kabaddi in the bedroom",
            hi: "सोने के कमरे में कबड्डी",
            mr: "झोपायच्या खोलीत कबड्डी",
          },
          {
            en: "Kho-kho on the wet street",
            hi: "गीली गली में खो-खो",
            mr: "ओल्या रस्त्यावर खो-खो",
          },
          {
            en: "Wait indoors doing nothing till the rain ends",
            hi: "बारिश थमने तक भीतर बैठे कुछ न करना",
            mr: "पाऊस थांबेपर्यंत घरात काहीही न करता बसणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Match the plan to the room and the things in hand: a board, a die, pebbles from the sill and a teacher of old games — all indoor, all present. Kabaddi in a bedroom breaks furniture and rules alike, and doing nothing wastes the best equipment they own: the grandmother.",
          hi: "योजना को कमरे और हाथ की चीज़ों से मिलाइए: बोर्ड, पासा, मुँडेर के कंकड़ और पुराने खेलों की एक उस्ताद — सब भीतर, सब मौजूद। कमरे में कबड्डी फ़र्नीचर और नियम दोनों तोड़ती है, और कुछ न करना उनके सबसे अच्छे साज़-ओ-सामान — दादी — को बेकार करना है।",
          mr: "योजना खोलीशी आणि हातातल्या गोष्टींशी जुळवा: पट, फासा, कठड्यावरचे खडे आणि जुन्या खेळांची एक गुरू — सारे घरातले, सारे हजर. खोलीत कबड्डी सामान आणि नियम दोन्ही मोडते, आणि काहीही न करणे म्हणजे त्यांच्याकडचे सर्वोत्तम साहित्य — आजी — वाया घालवणे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Kabaddi's raider must chant in ONE breath; a runner who breathes again before crossing back is out. What is this rule really measuring?",
          hi: "कबड्डी के धावक को एक ही साँस में रटना होता है; लौटने से पहले दोबारा साँस लेने वाला आउट है। यह नियम असल में क्या नाप रहा है?",
          mr: "कबड्डीच्या चढाई करणाऱ्याला एकाच दमात म्हणावे लागते; परतण्याआधी पुन्हा श्वास घेणारा बाद. हा नियम खरोखर काय मोजतो आहे?",
        },
        choices: [
          {
            en: "How long the raider's lungs can last — turning breath itself into the game's clock",
            hi: "धावक के फेफड़े कितनी देर टिकते हैं — साँस को ही खेल की घड़ी बना देना",
            mr: "चढाई करणाऱ्याची फुप्फुसे किती वेळ टिकतात — श्वासालाच खेळाचे घड्याळ करणे",
          },
          {
            en: "How loudly the raider can shout",
            hi: "धावक कितनी ज़ोर से चिल्ला सकता है",
            mr: "चढाई करणारा किती मोठ्याने ओरडू शकतो",
          },
          {
            en: "Whether the raider knows the word's meaning",
            hi: "धावक शब्द का अर्थ जानता है या नहीं",
            mr: "चढाई करणाऱ्याला शब्दाचा अर्थ माहीत आहे का",
          },
          {
            en: "Which team has more players",
            hi: "किस टोली में खिलाड़ी ज़्यादा हैं",
            mr: "कोणत्या संघात खेळाडू जास्त",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The chant is a breath-meter: as long as the word flows unbroken, the raider has not inhaled. No stopwatch, no referee's count — the rule builds the timer into the player's own body, which is why the game needs nothing but ground and lungs.",
          hi: "रट साँस का मीटर है: जब तक शब्द अटूट बह रहा है, धावक ने साँस नहीं ली। न घड़ी, न गिनती करता निर्णायक — नियम घड़ी को खिलाड़ी के शरीर में ही रख देता है; इसीलिए खेल को मैदान और फेफड़ों के सिवा कुछ नहीं चाहिए।",
          mr: "पालुपद हे श्वासाचे मीटर: शब्द अखंड वाहतो तोवर चढाई करणाऱ्याने श्वास घेतलेला नाही. घड्याळ नाही, मोजणारा पंच नाही — नियम घड्याळ खेळाडूच्या शरीरातच बसवतो; म्हणूनच खेळाला मैदान आणि फुप्फुसांखेरीज काहीही लागत नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Our First School (the family teaches first)                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-our-first-school",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 4 — Our First School",
      hi: "अध्याय 4 — हमारी पहली पाठशाला",
      mr: "प्रकरण 4 — आपली पहिली शाळा",
    },
    name: { en: "Our First School", hi: "हमारी पहली पाठशाला", mr: "आपली पहिली शाळा" },
    summary: {
      en: "Long before the school bell, home has been teaching — words, manners, skills and the ways of the family.",
      hi: "स्कूल की घंटी से बहुत पहले से घर सिखाता आया है — बोली, आदतें, हुनर और परिवार के तौर-तरीक़े।",
      mr: "शाळेच्या घंटेच्या खूप आधीपासून घर शिकवत आले आहे — बोली, रीती, कौशल्ये आणि कुटुंबाच्या तऱ्हा.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "family",
        name: { en: "The family", hi: "परिवार", mr: "कुटुंब" },
        kind: "idea",
        prompt: {
          en: "We learn our first words, first steps and first habits before any school begins — who teaches all this, and is called our first school?",
          hi: "पहली बोली, पहले क़दम और पहली आदतें हम किसी भी स्कूल से पहले सीख लेते हैं — यह सब कौन सिखाता है, जिसे हमारी पहली पाठशाला कहते हैं?",
          mr: "पहिले शब्द, पहिली पावले आणि पहिल्या सवयी आपण कोणत्याही शाळेआधी शिकतो — हे सारे कोण शिकवते, ज्याला आपली पहिली शाळा म्हणतात?",
        },
        statement: {
          en: "The family is our first school — walking, speaking and behaving are all learnt at home first.",
          hi: "परिवार हमारी पहली पाठशाला है — चलना, बोलना और बरतना, सब पहले घर में ही सीखा जाता है।",
          mr: "कुटुंब ही आपली पहिली शाळा — चालणे, बोलणे आणि वागणे, सारे आधी घरातच शिकले जाते.",
        },
        detail: {
          en: "In this school there is no bell, no blackboard and no examination, yet lessons happen every day.",
          hi: "इस पाठशाला में न घंटी है, न श्यामपट्ट, न परीक्षा — फिर भी पाठ रोज़ चलते हैं।",
          mr: "या शाळेत घंटा नाही, फळा नाही, परीक्षा नाही — तरी धडे रोज चालतात.",
        },
        extra: {
          en: "What it teaches — language, manners, little skills — stays with us for the whole of life.",
          hi: "यह जो सिखाता है — बोली, आदतें, छोटे-छोटे हुनर — वह जीवन भर साथ रहता है।",
          mr: "ते जे शिकवते — बोली, रीती, छोटी छोटी कौशल्ये — ते आयुष्यभर सोबत राहते.",
        },
        pair: {
          left: { en: "Our first school", hi: "हमारी पहली पाठशाला", mr: "आपली पहिली शाळा" },
          right: { en: "the family", hi: "परिवार", mr: "कुटुंब" },
        },
      },
      {
        id: "mothertongue",
        name: { en: "The mother tongue", hi: "मातृभाषा", mr: "मातृभाषा" },
        kind: "home-lesson",
        prompt: {
          en: "Which language does a child pick up at home only by hearing it — no book, no teacher, no test?",
          hi: "कौन-सी भाषा बच्चा घर में सिर्फ़ सुन-सुनकर सीख लेता है — न किताब, न शिक्षक, न परीक्षा?",
          mr: "कोणती भाषा मूल घरात नुसती ऐकून शिकते — पुस्तक नाही, शिक्षक नाही, परीक्षा नाही?",
        },
        statement: {
          en: "The mother tongue is learnt at home just by listening and speaking — no one sits down to teach it.",
          hi: "मातृभाषा घर में सुनते-बोलते ही आ जाती है — उसे बैठाकर कोई नहीं पढ़ाता।",
          mr: "मातृभाषा घरात ऐकता-बोलता आपोआप येते — ती बसवून कोणी शिकवत नाही.",
        },
        pair: {
          left: { en: "The mother tongue", hi: "मातृभाषा", mr: "मातृभाषा" },
          right: { en: "learnt just by listening", hi: "बस सुनकर सीखी जाती है", mr: "नुसती ऐकून येते" },
        },
      },
      {
        id: "watching",
        name: { en: "Learning by watching", hi: "देखकर सीखना", mr: "पाहून शिकणे" },
        kind: "home-lesson",
        prompt: {
          en: "A child rolls a roti round because she has seen her mother do it a hundred times. What is this way of learning called?",
          hi: "बच्ची रोटी गोल बेल लेती है क्योंकि उसने माँ को सौ बार करते देखा है। सीखने के इस ढंग को क्या कहते हैं?",
          mr: "आईला शंभरदा करताना पाहिले म्हणून मुलगी पोळी गोल लाटते. शिकण्याच्या या रीतीला काय म्हणतात?",
        },
        statement: {
          en: "At home much is learnt by watching elders do a thing and then trying it with one's own hands.",
          hi: "घर में बहुत कुछ बड़ों को करते देखकर और फिर अपने हाथों आज़माकर सीखा जाता है।",
          mr: "घरात बरेच काही मोठ्यांना करताना पाहून आणि मग स्वतःच्या हाताने करून पाहून शिकले जाते.",
        },
      },
      {
        id: "grandparents",
        name: { en: "Grandparents", hi: "दादा-दादी, नाना-नानी", mr: "आजी-आजोबा" },
        kind: "teacher-at-home",
        prompt: {
          en: "Who in the family tells stories of long ago and knows a home remedy for every little illness?",
          hi: "परिवार में कौन बीते ज़माने के क़िस्से सुनाते हैं और हर छोटी बीमारी का घरेलू नुस्ख़ा जानते हैं?",
          mr: "कुटुंबात जुन्या काळाच्या गोष्टी कोण सांगतात, आणि प्रत्येक छोट्या दुखण्यावर घरगुती उपाय कोणाला ठाऊक असतो?",
        },
        statement: {
          en: "Grandparents tell stories of the old days and teach many things that no book carries.",
          hi: "दादा-दादी बीते दिनों के क़िस्से सुनाते हैं और वह बहुत कुछ सिखाते हैं जो किसी किताब में नहीं मिलता।",
          mr: "आजी-आजोबा जुन्या दिवसांच्या गोष्टी सांगतात आणि पुस्तकात न सापडणारे बरेच काही शिकवतात.",
        },
        pair: {
          left: { en: "Grandparents", hi: "दादा-दादी, नाना-नानी", mr: "आजी-आजोबा" },
          right: { en: "stories of long ago", hi: "बीते ज़माने के क़िस्से", mr: "जुन्या काळाच्या गोष्टी" },
        },
        decoys: [
          { en: "The school teacher", hi: "स्कूल के शिक्षक", mr: "शाळेतले शिक्षक" },
          { en: "The neighbours", hi: "पड़ोसी", mr: "शेजारी" },
        ],
      },
      {
        id: "manners",
        name: { en: "Good manners", hi: "अच्छे संस्कार", mr: "चांगले संस्कार" },
        kind: "home-lesson",
        prompt: {
          en: "Greeting elders, sharing what you have, speaking gently — what are these first lessons of home together called?",
          hi: "बड़ों का अभिवादन, अपनी चीज़ बाँटना, नरमी से बोलना — घर के इन पहले पाठों को एक साथ क्या कहते हैं?",
          mr: "मोठ्यांना नमस्कार, आपली वस्तू वाटून घेणे, हळुवार बोलणे — घरच्या या पहिल्या धड्यांना मिळून काय म्हणतात?",
        },
        statement: {
          en: "Manners — greeting elders, sharing, speaking gently — are copied from the family long before anyone explains them.",
          hi: "संस्कार — बड़ों का अभिवादन, बाँटना, नरमी से बोलना — समझाए जाने से बहुत पहले परिवार से देख-देखकर आ जाते हैं।",
          mr: "संस्कार — मोठ्यांना नमस्कार, वाटून घेणे, हळुवार बोलणे — कोणी समजावण्याआधीच कुटुंबाकडून उचलले जातात.",
        },
        pair: {
          left: { en: "Good manners", hi: "अच्छे संस्कार", mr: "चांगले संस्कार" },
          right: { en: "copied from the family", hi: "परिवार से देखकर आते हैं", mr: "कुटुंबाकडून उचलले जातात" },
        },
      },
      {
        id: "resemblance",
        name: { en: "Family likeness", hi: "परिवार से मिलती शक्ल", mr: "कुटुंबाशी मिळतेजुळते रूप" },
        kind: "family-trait",
        prompt: {
          en: "\"Your nose is just like your father's, and you laugh like your grandmother!\" — what is this called, that runs in families?",
          hi: "\"तुम्हारी नाक बिलकुल पिताजी जैसी है, और हँसी दादी जैसी!\" — परिवारों में चली आती इस समानता को क्या कहते हैं?",
          mr: "\"तुझे नाक अगदी बाबांसारखे, आणि हसणे आजीसारखे!\" — कुटुंबात चालत आलेल्या या साम्याला काय म्हणतात?",
        },
        statement: {
          en: "Children often look or sound like their family — a nose, a walk, a laugh travels down a family.",
          hi: "बच्चे अक्सर अपने परिवार जैसे दिखते या बोलते हैं — नाक, चाल, हँसी परिवार में उतरती चली आती है।",
          mr: "मुले अनेकदा आपल्या कुटुंबासारखी दिसतात वा बोलतात — नाक, चाल, हसणे कुटुंबात उतरत येते.",
        },
        detail: {
          en: "The likeness may be in looks — eyes, nose, height — or in ways — voice, walk, laugh.",
          hi: "यह मेल शक्ल में हो सकता है — आँखें, नाक, क़द — या ढंग में — आवाज़, चाल, हँसी।",
          mr: "हे साम्य रूपात असू शकते — डोळे, नाक, उंची — किंवा तऱ्हेत — आवाज, चाल, हसणे.",
        },
        extra: {
          en: "A child may take after grandparents or an aunt, not only mother and father.",
          hi: "बच्चा दादा-दादी या बुआ-मौसी पर भी जा सकता है, केवल माता-पिता पर नहीं।",
          mr: "मूल आजी-आजोबांवर वा आत्या-मावशीवरही जाऊ शकते, केवळ आई-वडिलांवर नाही.",
        },
      },
      {
        id: "familywork",
        name: {
          en: "By helping elders at the family's work",
          hi: "बड़ों के काम में हाथ बँटाकर",
          mr: "मोठ्यांच्या कामात हातभार लावून",
        },
        kind: "home-lesson",
        prompt: {
          en: "A potter's daughter can shape a little diya, a farmer's son can tell seeds apart — how did they learn it?",
          hi: "कुम्हार की बेटी नन्हा दीया गढ़ लेती है, किसान का बेटा बीज पहचान लेता है — उन्होंने यह कैसे सीखा?",
          mr: "कुंभाराची मुलगी इवली पणती घडवते, शेतकऱ्याचा मुलगा बियाणे ओळखतो — ते हे कसे शिकले?",
        },
        statement: {
          en: "The family's work — sowing, weaving, shaping clay — is learnt by helping elders at it, little by little.",
          hi: "परिवार का काम — बोना, बुनना, मिट्टी गढ़ना — बड़ों के साथ हाथ बँटाते-बँटाते थोड़ा-थोड़ा सीखा जाता है।",
          mr: "कुटुंबाचे काम — पेरणे, विणणे, माती घडवणे — मोठ्यांसोबत हातभार लावता लावता थोडे थोडे शिकले जाते.",
        },
        pair: {
          left: { en: "The family's own work", hi: "परिवार का अपना काम", mr: "कुटुंबाचे स्वतःचे काम" },
          right: {
            en: "learnt by helping at it",
            hi: "हाथ बँटाकर सीखा जाता है",
            mr: "हातभार लावून शिकले जाते",
          },
        },
      },
      {
        id: "habits",
        name: { en: "Healthy habits", hi: "सेहत की आदतें", mr: "आरोग्याच्या सवयी" },
        kind: "home-lesson",
        prompt: {
          en: "Washing hands before food, brushing teeth, sleeping on time — what are these everyday lessons of the body called?",
          hi: "खाने से पहले हाथ धोना, दाँत माँजना, समय पर सोना — शरीर के इन रोज़ के पाठों को क्या कहते हैं?",
          mr: "जेवणाआधी हात धुणे, दात घासणे, वेळेवर झोपणे — शरीराच्या या रोजच्या धड्यांना काय म्हणतात?",
        },
        statement: {
          en: "Healthy habits — washing hands before food, brushing teeth — are set at home in early childhood.",
          hi: "सेहत की आदतें — खाने से पहले हाथ धोना, दाँत माँजना — बचपन में घर पर ही पड़ जाती हैं।",
          mr: "आरोग्याच्या सवयी — जेवणाआधी हात धुणे, दात घासणे — लहानपणी घरातच लागतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into LEARNT AT HOME FIRST and LEARNT AT SCHOOL: speaking the mother tongue, writing on a slate, greeting elders, sitting for an examination. Which sorting is right?",
          hi: "इन्हें पहले घर में सीखा और स्कूल में सीखा में छाँटिए: मातृभाषा बोलना, स्लेट पर लिखना, बड़ों का अभिवादन, परीक्षा देना। कौन-सी छँटाई सही है?",
          mr: "यांची आधी घरात शिकले आणि शाळेत शिकले अशी वर्गवारी करा: मातृभाषा बोलणे, पाटीवर लिहिणे, मोठ्यांना नमस्कार, परीक्षा देणे. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Home: mother tongue, greeting elders · School: writing on a slate, examinations",
            hi: "घर: मातृभाषा, बड़ों का अभिवादन · स्कूल: स्लेट पर लिखना, परीक्षा",
            mr: "घर: मातृभाषा, मोठ्यांना नमस्कार · शाळा: पाटीवर लिहिणे, परीक्षा",
          },
          {
            en: "Home: writing on a slate, examinations · School: mother tongue, greeting elders",
            hi: "घर: स्लेट पर लिखना, परीक्षा · स्कूल: मातृभाषा, बड़ों का अभिवादन",
            mr: "घर: पाटीवर लिहिणे, परीक्षा · शाळा: मातृभाषा, मोठ्यांना नमस्कार",
          },
          {
            en: "Home: mother tongue, examinations · School: greeting elders, writing on a slate",
            hi: "घर: मातृभाषा, परीक्षा · स्कूल: बड़ों का अभिवादन, स्लेट पर लिखना",
            mr: "घर: मातृभाषा, परीक्षा · शाळा: मोठ्यांना नमस्कार, पाटीवर लिहिणे",
          },
          {
            en: "Home: greeting elders, writing on a slate · School: mother tongue, examinations",
            hi: "घर: बड़ों का अभिवादन, स्लेट पर लिखना · स्कूल: मातृभाषा, परीक्षा",
            mr: "घर: मोठ्यांना नमस्कार, पाटीवर लिहिणे · शाळा: मातृभाषा, परीक्षा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The test is: did anyone sit you down with a book for it? Speech and manners soak in at home years before school; slates and examinations begin only in a classroom.",
          hi: "कसौटी यह है: क्या इसके लिए किसी ने आपको किताब लेकर बैठाया था? बोली और संस्कार स्कूल से बरसों पहले घर में रच-बस जाते हैं; स्लेट और परीक्षा कक्षा में ही शुरू होती हैं।",
          mr: "कसोटी अशी: यासाठी कोणी तुम्हाला पुस्तक घेऊन बसवले होते का? बोली आणि संस्कार शाळेच्या कितीतरी वर्षे आधी घरात मुरतात; पाटी आणि परीक्षा वर्गातच सुरू होतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Munna's grandmother never went to school, yet she knows a hundred stories, a cure for a cough, and how to weave a mat. What does this show?",
          hi: "मुन्ना की दादी कभी स्कूल नहीं गईं, फिर भी उन्हें सौ क़िस्से, खाँसी का इलाज और चटाई बुनना आता है। इससे क्या पता चलता है?",
          mr: "मुन्नाची आजी कधी शाळेत गेली नाही, तरी तिला शंभर गोष्टी, खोकल्यावरचा उपाय आणि चटई विणणे येते. यावरून काय कळते?",
        },
        choices: [
          {
            en: "A person can know a great deal without schooling — family and life also teach",
            hi: "बिना स्कूल गए भी इंसान बहुत कुछ जान सकता है — परिवार और जीवन भी सिखाते हैं",
            mr: "शाळेत न जाताही माणसाला खूप काही येऊ शकते — कुटुंब आणि जीवनही शिकवतात",
          },
          {
            en: "Stories and mat-weaving do not count as real knowledge",
            hi: "क़िस्से और चटाई बुनना असली ज्ञान नहीं कहलाते",
            mr: "गोष्टी आणि चटई विणणे खरे ज्ञान म्हणता येत नाही",
          },
          {
            en: "Whatever is worth knowing can only be taught in a school",
            hi: "जो भी जानने लायक़ है, वह केवल स्कूल में ही सिखाया जा सकता है",
            mr: "जे काही शिकण्याजोगे आहे, ते फक्त शाळेतच शिकवले जाऊ शकते",
          },
          {
            en: "Grandmother must have secretly attended a school",
            hi: "दादी ज़रूर चुपके से किसी स्कूल गई होंगी",
            mr: "आजी नक्कीच गुपचूप कुठल्या तरी शाळेत गेली असणार",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Everything she knows was learnt the first-school way — from her own elders, by listening, watching and doing. School is one place of learning, not the only one; that is exactly why the family is called our first school.",
          hi: "उनका सारा ज्ञान पहली पाठशाला के ढंग से आया — अपने बड़ों से, सुनकर, देखकर, करके। स्कूल सीखने की एक जगह है, इकलौती नहीं; इसीलिए तो परिवार को हमारी पहली पाठशाला कहते हैं।",
          mr: "तिचे सारे ज्ञान पहिल्या शाळेच्या रीतीने आले — आपल्या मोठ्यांकडून, ऐकून, पाहून, करून. शाळा ही शिकण्याची एक जागा आहे, एकमेव नाही; म्हणूनच कुटुंबाला आपली पहिली शाळा म्हणतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — It's Raining (where rain comes from and what it wakes)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-its-raining",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 9 — It's Raining",
      hi: "अध्याय 9 — बरसात आई",
      mr: "प्रकरण 9 — पाऊस आला",
    },
    name: { en: "It's Raining", hi: "बरसात आई", mr: "पाऊस आला" },
    summary: {
      en: "Where rain comes from and where it goes — the Sun, the vapour, the clouds, the falling drops, and everything that wakes up wet and happy.",
      hi: "बारिश कहाँ से आती है और कहाँ जाती है — सूरज, भाप, बादल, गिरती बूँदें, और वह सब जो भीगकर ख़ुश हो उठता है।",
      mr: "पाऊस कुठून येतो आणि कुठे जातो — सूर्य, वाफ, ढग, पडणारे थेंब, आणि भिजून आनंदणारे सारे काही.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "sun",
        name: { en: "The Sun", hi: "सूरज", mr: "सूर्य" },
        kind: "cycle-step",
        seq: 1,
        prompt: {
          en: "Who heats the water of ponds, rivers and seas until some of it climbs invisibly into the air?",
          hi: "कौन तालाबों, नदियों और समुद्रों के पानी को तपाता है, जिससे उसका कुछ हिस्सा अनदेखे ही हवा में चढ़ जाता है?",
          mr: "तळी, नद्या आणि समुद्रांचे पाणी कोण तापवतो, ज्याने त्याचा काही भाग न दिसता हवेत चढतो?",
        },
        statement: {
          en: "The Sun's heat turns the water of ponds and seas into vapour and sends it up into the air.",
          hi: "सूरज की गरमी तालाबों-समुद्रों के पानी को भाप बनाकर हवा में ऊपर भेज देती है।",
          mr: "सूर्याची उष्णता तळ्या-समुद्रांच्या पाण्याची वाफ करून ती हवेत वर पाठवते.",
        },
        pair: {
          left: { en: "The Sun", hi: "सूरज", mr: "सूर्य" },
          right: { en: "turns water into vapour", hi: "पानी को भाप बनाता है", mr: "पाण्याची वाफ करतो" },
        },
      },
      {
        id: "vapour",
        name: { en: "Water vapour", hi: "भाप", mr: "वाफ" },
        kind: "cycle-step",
        seq: 2,
        prompt: {
          en: "What is water called when it floats in the air as a gas too fine to see?",
          hi: "पानी को क्या कहते हैं जब वह इतना महीन होकर हवा में तैरता है कि दिखता ही नहीं?",
          mr: "पाणी इतके सूक्ष्म होऊन हवेत तरंगते की दिसतच नाही, तेव्हा त्याला काय म्हणतात?",
        },
        statement: {
          en: "Water vapour is water floating in the air, too fine for the eye to see.",
          hi: "भाप हवा में तैरता पानी है — इतना महीन कि आँख से दिखे नहीं।",
          mr: "वाफ म्हणजे हवेत तरंगणारे पाणी — डोळ्यांना न दिसण्याइतके सूक्ष्म.",
        },
      },
      {
        id: "clouds",
        name: { en: "Clouds", hi: "बादल", mr: "ढग" },
        kind: "cycle-step",
        seq: 3,
        prompt: {
          en: "High in the sky the vapour cools into countless tiny drops that gather in floating heaps — what are these heaps called?",
          hi: "आसमान में ऊँचे जाकर भाप ठंडी होकर अनगिनत नन्ही बूँदें बन जाती है, जो तैरते ढेरों में जमा होती हैं — इन ढेरों को क्या कहते हैं?",
          mr: "आकाशात उंच गेल्यावर वाफ थंड होऊन असंख्य इवले थेंब बनते, जे तरंगत्या पुंजक्यांत जमतात — या पुंजक्यांना काय म्हणतात?",
        },
        statement: {
          en: "Clouds are crowds of tiny water drops floating high in the sky.",
          hi: "बादल आसमान में ऊँचे तैरती नन्ही बूँदों की भीड़ हैं।",
          mr: "ढग म्हणजे आकाशात उंच तरंगणाऱ्या इवल्या थेंबांची गर्दी.",
        },
        detail: {
          en: "They are made of the very vapour the Sun sent up, cooled in the high air.",
          hi: "ये उसी भाप से बने हैं जो सूरज ने ऊपर भेजी थी — ऊँची हवा में ठंडी होकर।",
          mr: "सूर्याने वर पाठवलेल्या त्याच वाफेपासून हे बनतात — उंच हवेत थंड होऊन.",
        },
        pair: {
          left: { en: "Clouds", hi: "बादल", mr: "ढग" },
          right: { en: "crowds of tiny drops", hi: "नन्ही बूँदों की भीड़", mr: "इवल्या थेंबांची गर्दी" },
        },
      },
      {
        id: "rain",
        name: { en: "Rain", hi: "बारिश", mr: "पाऊस" },
        kind: "cycle-step",
        seq: 4,
        prompt: {
          en: "When the drops inside a cloud grow too big and heavy to float, what do they come down as?",
          hi: "जब बादल के भीतर की बूँदें इतनी बड़ी और भारी हो जाएँ कि तैर न सकें, तो वे किस रूप में नीचे आती हैं?",
          mr: "ढगातले थेंब इतके मोठे आणि जड होतात की तरंगू शकत नाहीत, तेव्हा ते कोणत्या रूपात खाली येतात?",
        },
        statement: {
          en: "Rain falls when a cloud's drops grow too heavy to stay floating.",
          hi: "बारिश तब गिरती है जब बादल की बूँदें तैरते रहने के लिए बहुत भारी हो जाती हैं।",
          mr: "ढगातले थेंब तरंगत राहण्यास फार जड झाले की पाऊस पडतो.",
        },
        detail: {
          en: "It fills ponds, rivers and wells again, and soaks deep into the fields.",
          hi: "यह तालाब, नदियाँ और कुएँ फिर से भर देती है, और खेतों में गहरे उतर जाती है।",
          mr: "तो तळी, नद्या आणि विहिरी पुन्हा भरतो, आणि शेतांत खोल मुरतो.",
        },
        extra: {
          en: "Its first drops on hot dry earth raise the lovely smell every child knows.",
          hi: "तपी सूखी मिट्टी पर इसकी पहली बूँदें वह प्यारी सौंधी ख़ुशबू उठाती हैं जिसे हर बच्चा पहचानता है।",
          mr: "तापल्या कोरड्या मातीवर त्याचे पहिले थेंब तो ओळखीचा मृद्गंध उठवतात, जो प्रत्येक मुलाला ठाऊक असतो.",
        },
        pair: {
          left: { en: "The falling rain", hi: "गिरती बारिश", mr: "पडणारा पाऊस" },
          right: {
            en: "drops too heavy to float",
            hi: "तैर न सकने जितनी भारी बूँदें",
            mr: "तरंगू न शकणारे जड थेंब",
          },
        },
      },
      {
        id: "rainbow",
        name: { en: "The rainbow", hi: "इंद्रधनुष", mr: "इंद्रधनुष्य" },
        kind: "rain-sight",
        prompt: {
          en: "Sunshine on one side, falling rain on the other — which seven-coloured bow then bends across the sky?",
          hi: "एक ओर धूप, दूसरी ओर गिरती बारिश — तब कौन-सा सतरंगा धनुष आसमान में तन जाता है?",
          mr: "एका बाजूला ऊन, दुसरीकडे पडणारा पाऊस — तेव्हा कोणते सप्तरंगी धनुष्य आकाशात वाकते?",
        },
        statement: {
          en: "A rainbow appears only when sunshine and rain are in the sky together.",
          hi: "इंद्रधनुष तभी दिखता है जब धूप और बारिश आसमान में साथ-साथ हों।",
          mr: "ऊन आणि पाऊस आकाशात एकत्र असतील तेव्हाच इंद्रधनुष्य दिसते.",
        },
      },
      {
        id: "earthworms",
        name: { en: "Earthworms", hi: "केंचुए", mr: "गांडुळे" },
        kind: "rain-friend",
        prompt: {
          en: "Which soft crawlers come up out of the soil when rain fills their burrows?",
          hi: "कौन-से नरम रेंगने वाले जीव मिट्टी से बाहर निकल आते हैं जब बारिश उनके बिलों में भर जाती है?",
          mr: "पाऊस बिळांत भरला की कोणते मऊ सरपटणारे जीव मातीतून वर येतात?",
        },
        statement: {
          en: "Earthworms climb out of the wet ground when rain fills their burrows with water.",
          hi: "बारिश जब बिलों में पानी भर देती है तो केंचुए गीली मिट्टी से बाहर निकल आते हैं।",
          mr: "पावसाने बिळांत पाणी भरले की गांडुळे ओल्या मातीतून बाहेर येतात.",
        },
      },
      {
        id: "frogs",
        name: { en: "Frogs", hi: "मेंढक", mr: "बेडूक" },
        kind: "rain-friend",
        prompt: {
          en: "Whose croaking chorus fills the ponds as soon as the rains arrive?",
          hi: "बारिश आते ही तालाबों में किसकी टर्र-टर्र गूँज उठती है?",
          mr: "पाऊस येताच तळ्यांत कोणाचे डराँव-डराँव घुमू लागते?",
        },
        statement: {
          en: "Frogs croak loudest in the rainy season, when every pond and puddle fills up.",
          hi: "मेंढक बरसात में सबसे ज़ोर से टर्राते हैं, जब हर तालाब और डबरा भर जाता है।",
          mr: "पावसाळ्यात बेडूक सर्वांत मोठ्याने ओरडतात, जेव्हा प्रत्येक तळे आणि डबके भरते.",
        },
      },
      {
        id: "paperboats",
        name: { en: "Paper boats", hi: "काग़ज़ की नावें", mr: "कागदी होड्या" },
        kind: "rain-sight",
        prompt: {
          en: "What do children fold out of old pages and float on the little streams that rain makes?",
          hi: "बच्चे पुराने पन्नों को मोड़कर क्या बनाते हैं और बारिश की बनाई नन्ही धाराओं पर तैराते हैं?",
          mr: "मुले जुन्या पानांची घडी घालून काय बनवतात आणि पावसाने केलेल्या इवल्या ओहळांवर सोडतात?",
        },
        statement: {
          en: "Paper boats are folded from old pages and sailed on the run-off streams of rain.",
          hi: "काग़ज़ की नावें पुराने पन्नों से मोड़कर बनती हैं और बारिश के बहते पानी पर तैराई जाती हैं।",
          mr: "कागदी होड्या जुन्या पानांची घडी घालून बनतात आणि पावसाच्या वाहत्या पाण्यावर सोडल्या जातात.",
        },
        pair: {
          left: { en: "Paper boats", hi: "काग़ज़ की नावें", mr: "कागदी होड्या" },
          right: { en: "rain's little streams", hi: "बारिश की नन्ही धाराएँ", mr: "पावसाचे इवले ओहळ" },
        },
      },
      {
        id: "flood",
        name: { en: "A flood", hi: "बाढ़", mr: "पूर" },
        kind: "rain-trouble",
        prompt: {
          en: "When far too much rain falls and water climbs into streets and homes, what do we call it?",
          hi: "जब हद से ज़्यादा बारिश हो और पानी गलियों और घरों में चढ़ आए, तो उसे क्या कहते हैं?",
          mr: "अति पाऊस पडून पाणी रस्त्यांत आणि घरांत चढते, तेव्हा त्याला काय म्हणतात?",
        },
        statement: {
          en: "A flood comes when too much rain falls at once and water spreads over streets and fields.",
          hi: "बाढ़ तब आती है जब एक साथ बहुत ज़्यादा बारिश हो और पानी गलियों-खेतों पर फैल जाए।",
          mr: "एकदम फार पाऊस पडून पाणी रस्त्यां-शेतांवर पसरते तेव्हा पूर येतो.",
        },
      },
      {
        id: "drought",
        name: { en: "A drought", hi: "सूखा", mr: "दुष्काळ" },
        kind: "rain-trouble",
        prompt: {
          en: "When the rains fail and ponds dry, fields crack and wells sink low — what is that hard time called?",
          hi: "जब बारिश न हो, तालाब सूख जाएँ, खेत चटख जाएँ और कुएँ उतर जाएँ — उस कठिन समय को क्या कहते हैं?",
          mr: "पाऊसच पडला नाही, तळी आटली, शेते भेगाळली आणि विहिरी खोल गेल्या — त्या कठीण काळाला काय म्हणतात?",
        },
        statement: {
          en: "A drought comes when the rains fail — ponds dry up, fields crack and water runs short.",
          hi: "सूखा तब पड़ता है जब बारिश ही न हो — तालाब सूखते हैं, खेत चटखते हैं और पानी घट जाता है।",
          mr: "पाऊसच न पडल्याने दुष्काळ येतो — तळी आटतात, शेते भेगाळतात आणि पाणी कमी पडते.",
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "After the rain a big puddle shone in the school yard. Two sunny days later it was gone, though nobody swept the water away. Where did most of it go?",
          hi: "बारिश के बाद स्कूल के आँगन में बड़ा-सा डबरा चमक रहा था। दो धूप भरे दिनों बाद वह ग़ायब था, जबकि पानी किसी ने हटाया नहीं। उसका ज़्यादातर हिस्सा कहाँ गया?",
          mr: "पावसानंतर शाळेच्या अंगणात मोठे डबके चमकत होते. दोन उन्हाच्या दिवसांनंतर ते नाहीसे झाले, पण पाणी कोणीही काढले नव्हते. त्यातले बहुतेक पाणी कुठे गेले?",
        },
        choices: [
          {
            en: "The Sun turned it into vapour, and it rose into the air",
            hi: "सूरज ने उसे भाप बनाया, और वह हवा में चढ़ गया",
            mr: "सूर्याने त्याची वाफ केली, आणि ते हवेत चढले",
          },
          {
            en: "It only soaked into the ground — the sunshine had nothing to do with it",
            hi: "वह सिर्फ़ ज़मीन में समाया — धूप का इसमें कोई हाथ नहीं",
            mr: "ते फक्त जमिनीत मुरले — उन्हाचा याच्याशी काही संबंध नाही",
          },
          {
            en: "That water is finished for ever and will never return",
            hi: "वह पानी हमेशा के लिए ख़त्म हो गया, अब कभी नहीं लौटेगा",
            mr: "ते पाणी कायमचे संपले, आता कधीही परतणार नाही",
          },
          {
            en: "Someone must have carried it away in buckets at night",
            hi: "रात में कोई उसे बाल्टियों में भरकर ले गया होगा",
            mr: "रात्री कोणीतरी ते बादल्यांत भरून नेले असणार",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A little soaks in, yes — but a puddle shining on hard-trodden ground dries from the top, and two days of sunshine is the clue: the Sun sipped it up as vapour, the same first step that one day brings it back as rain. The water is not finished; it is travelling.",
          hi: "थोड़ा ज़मीन में ज़रूर समाता है — पर कड़ी रौंदी ज़मीन पर चमकता डबरा ऊपर से सूखता है, और दो दिन की धूप ही सुराग़ है: सूरज ने उसे भाप बनाकर पी लिया — वही पहला क़दम जो किसी दिन उसे बारिश बनाकर लौटा देगा। पानी ख़त्म नहीं हुआ; वह सफ़र पर है।",
          mr: "थोडे जमिनीत मुरते खरे — पण तुडवलेल्या कडक जमिनीवर चमकणारे डबके वरून सुकते, आणि दोन दिवसांचे ऊन हाच धागा आहे: सूर्याने त्याची वाफ करून ते पिऊन घेतले — तेच पहिले पाऊल, जे एखाद्या दिवशी त्याला पाऊस बनवून परत आणते. पाणी संपले नाही; ते प्रवासाला निघाले आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Rain has fallen for thousands and thousands of years — yet the world's water never gets finished. Why not?",
          hi: "हज़ारों-हज़ार बरसों से बारिश गिर रही है — फिर भी दुनिया का पानी कभी ख़त्म नहीं होता। क्यों?",
          mr: "हजारो-हजार वर्षांपासून पाऊस पडतो आहे — तरी जगातले पाणी कधी संपत नाही. का?",
        },
        choices: [
          {
            en: "Because the same water goes round and round — sea to sky, sky to earth, earth to sea again",
            hi: "क्योंकि वही पानी घूमता रहता है — समुद्र से आसमान, आसमान से धरती, धरती से फिर समुद्र",
            mr: "कारण तेच पाणी फिरत राहते — समुद्रातून आकाशात, आकाशातून जमिनीवर, जमिनीवरून पुन्हा समुद्रात",
          },
          {
            en: "Because clouds make new water out of nothing",
            hi: "क्योंकि बादल शून्य से नया पानी बना लेते हैं",
            mr: "कारण ढग शून्यातून नवे पाणी बनवतात",
          },
          {
            en: "Because rivers manufacture water from mud as they flow",
            hi: "क्योंकि नदियाँ बहते-बहते कीचड़ से पानी बना लेती हैं",
            mr: "कारण नद्या वाहता वाहता चिखलातून पाणी तयार करतात",
          },
          {
            en: "Because the sea never gives any of its water to the sky",
            hi: "क्योंकि समुद्र अपना पानी आसमान को कभी नहीं देता",
            mr: "कारण समुद्र आपले पाणी आकाशाला कधीच देत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Nothing new is made and nothing is lost — the Sun lifts water as vapour, clouds carry it, rain returns it, rivers walk it back to the sea, and the round begins again. Rain is not new water; it is old water coming home.",
          hi: "न कुछ नया बनता है, न कुछ खोता है — सूरज पानी को भाप बनाकर उठाता है, बादल उसे ढोते हैं, बारिश लौटाती है, नदियाँ उसे समुद्र तक पहुँचाती हैं, और फेरा फिर शुरू। बारिश नया पानी नहीं — पुराने पानी की घर-वापसी है।",
          mr: "नवे काही बनत नाही, काही हरवत नाही — सूर्य पाण्याची वाफ करून ते उचलतो, ढग ते वाहतात, पाऊस ते परत करतो, नद्या ते समुद्रापर्यंत नेतात, आणि फेरा पुन्हा सुरू. पाऊस म्हणजे नवे पाणी नव्हे — जुन्या पाण्याची घरवापसी.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — From Here to There (how people and goods travel)           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-from-here-to-there",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 11 — From Here to There",
      hi: "अध्याय 11 — यहाँ से वहाँ",
      mr: "प्रकरण 11 — इथून तिथे",
    },
    name: { en: "From Here to There", hi: "यहाँ से वहाँ", mr: "इथून तिथे" },
    summary: {
      en: "Trains that sing over rails, carts and cycles, boats and planes — the many ways people and goods travel from here to there.",
      hi: "पटरियों पर गाती रेल, गाड़ियाँ और साइकिलें, नावें और हवाई जहाज़ — लोगों और सामान के यहाँ से वहाँ पहुँचने के कितने ही रास्ते।",
      mr: "रुळांवर गाणारी रेल्वे, गाड्या आणि सायकली, होड्या आणि विमाने — माणसे आणि सामान इथून तिथे पोहोचण्याच्या कितीतरी वाटा.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "train",
        name: { en: "The train", hi: "रेलगाड़ी", mr: "रेल्वेगाडी" },
        kind: "land",
        prompt: {
          en: "Which long traveller runs only on iron rails — one engine singing chhuk-chhuk, pulling coach after coach?",
          hi: "कौन-सा लंबा मुसाफ़िर सिर्फ़ लोहे की पटरियों पर चलता है — एक इंजन छुक-छुक गाता, पीछे डिब्बे ही डिब्बे खींचता?",
          mr: "कोणता लांबलचक प्रवासी फक्त लोखंडी रुळांवर धावतो — एक इंजिन झुक-झुक करत, मागे डबेच डबे ओढत?",
        },
        statement: {
          en: "A train runs on iron rails, one engine pulling a long line of coaches.",
          hi: "रेलगाड़ी लोहे की पटरियों पर चलती है — एक इंजन डिब्बों की लंबी क़तार खींचता है।",
          mr: "रेल्वेगाडी लोखंडी रुळांवर धावते — एक इंजिन डब्यांची लांब रांग ओढते.",
        },
        detail: {
          en: "It can carry hundreds of people together across whole states — far more than any bus.",
          hi: "यह सैकड़ों लोगों को एक साथ कई राज्यों के पार ले जा सकती है — किसी भी बस से कहीं ज़्यादा।",
          mr: "ती शेकडो माणसांना एकत्र अनेक राज्यांपार नेऊ शकते — कोणत्याही बसपेक्षा कितीतरी जास्त.",
        },
        extra: {
          en: "At every station it halts a little — some travellers climb down, new ones climb in.",
          hi: "हर स्टेशन पर यह थोड़ा ठहरती है — कुछ मुसाफ़िर उतरते हैं, नए चढ़ते हैं।",
          mr: "प्रत्येक स्थानकावर ती थोडी थांबते — काही प्रवासी उतरतात, नवे चढतात.",
        },
        pair: {
          left: { en: "The train", hi: "रेलगाड़ी", mr: "रेल्वेगाडी" },
          right: { en: "iron rails", hi: "लोहे की पटरियाँ", mr: "लोखंडी रूळ" },
        },
      },
      {
        id: "bullockcart",
        name: { en: "The bullock cart", hi: "बैलगाड़ी", mr: "बैलगाडी" },
        kind: "land",
        prompt: {
          en: "Which village cart rolls slowly on big wooden wheels, pulled by two strong animals?",
          hi: "कौन-सी गाँव की गाड़ी बड़े लकड़ी के पहियों पर धीरे-धीरे चलती है, जिसे दो बलवान पशु खींचते हैं?",
          mr: "कोणती गावाकडची गाडी मोठ्या लाकडी चाकांवर सावकाश चालते, जिला दोन धष्टपुष्ट जनावरे ओढतात?",
        },
        statement: {
          en: "A bullock cart is pulled by two bullocks and rolls slowly on big wooden wheels.",
          hi: "बैलगाड़ी को दो बैल खींचते हैं और वह बड़े लकड़ी के पहियों पर धीरे-धीरे चलती है।",
          mr: "बैलगाडी दोन बैल ओढतात आणि ती मोठ्या लाकडी चाकांवर सावकाश चालते.",
        },
        pair: {
          left: { en: "The bullock cart", hi: "बैलगाड़ी", mr: "बैलगाडी" },
          right: { en: "two bullocks", hi: "दो बैल", mr: "दोन बैल" },
        },
      },
      {
        id: "bicycle",
        name: { en: "The bicycle", hi: "साइकिल", mr: "सायकल" },
        kind: "land",
        prompt: {
          en: "Which two-wheeler needs no petrol and no ticket — only your own legs pedalling?",
          hi: "किस दो-पहिए को न पेट्रोल चाहिए, न टिकट — बस आपकी अपनी टाँगों की पैडल-मार?",
          mr: "कोणत्या दुचाकीला पेट्रोल नको, तिकीटही नको — फक्त तुमच्या पायांचे पॅडल मारणे?",
        },
        statement: {
          en: "A bicycle moves by pedalling alone — it burns no fuel and makes no smoke.",
          hi: "साइकिल केवल पैडल से चलती है — न ईंधन फूँकती है, न धुआँ छोड़ती है।",
          mr: "सायकल केवळ पॅडलने चालते — इंधन जाळत नाही, धूरही सोडत नाही.",
        },
        pair: {
          left: { en: "The bicycle", hi: "साइकिल", mr: "सायकल" },
          right: { en: "your own pedalling", hi: "आपकी अपनी पैडल-मार", mr: "तुमचे स्वतःचे पॅडल" },
        },
      },
      {
        id: "bus",
        name: { en: "The bus", hi: "बस", mr: "बस" },
        kind: "land",
        prompt: {
          en: "Which road carrier halts at fixed stops, where a conductor gives you a ticket for your ride?",
          hi: "सड़क की कौन-सी सवारी तय पड़ावों पर रुकती है, जहाँ कंडक्टर आपको सफ़र का टिकट देता है?",
          mr: "रस्त्यावरचे कोणते वाहन ठरलेल्या थांब्यांवर थांबते, जिथे कंडक्टर तुम्हाला प्रवासाचे तिकीट देतो?",
        },
        statement: {
          en: "A bus carries many passengers by road, halting at bus stops where a conductor gives tickets.",
          hi: "बस सड़क से बहुत-से मुसाफ़िर ले जाती है — बस-पड़ावों पर रुकती है, जहाँ कंडक्टर टिकट देता है।",
          mr: "बस रस्त्याने पुष्कळ प्रवासी नेते — थांब्यांवर थांबते, जिथे कंडक्टर तिकीट देतो.",
        },
      },
      {
        id: "boat",
        name: { en: "The boat", hi: "नाव", mr: "होडी" },
        kind: "water",
        prompt: {
          en: "Where there is no road and no bridge, only water — which carrier takes people across?",
          hi: "जहाँ न सड़क हो, न पुल — सिर्फ़ पानी — वहाँ लोगों को पार कौन ले जाता है?",
          mr: "जिथे रस्ता नाही, पूलही नाही — फक्त पाणी — तिथे माणसांना पलीकडे कोण नेते?",
        },
        statement: {
          en: "A boat carries people across rivers and lakes, where no road can go.",
          hi: "नाव लोगों को नदियों और झीलों के पार ले जाती है, जहाँ कोई सड़क नहीं पहुँचती।",
          mr: "होडी माणसांना नद्या आणि तळ्यांच्या पलीकडे नेते, जिथे कोणताही रस्ता पोहोचत नाही.",
        },
        pair: {
          left: { en: "The boat", hi: "नाव", mr: "होडी" },
          right: {
            en: "water, where roads end",
            hi: "पानी, जहाँ सड़कें ख़त्म होती हैं",
            mr: "पाणी, जिथे रस्ते संपतात",
          },
        },
      },
      {
        id: "aeroplane",
        name: { en: "The aeroplane", hi: "हवाई जहाज़", mr: "विमान" },
        kind: "air",
        prompt: {
          en: "Which is the fastest traveller of all, carrying people high above the clouds?",
          hi: "सबसे तेज़ मुसाफ़िर कौन है, जो लोगों को लेकर बादलों से भी ऊपर उड़ता है?",
          mr: "सर्वांत वेगवान प्रवासी कोण, जो माणसांना घेऊन ढगांच्याही वर उडतो?",
        },
        statement: {
          en: "An aeroplane flies above the clouds and is the fastest way to travel far.",
          hi: "हवाई जहाज़ बादलों के ऊपर उड़ता है और दूर जाने का सबसे तेज़ तरीक़ा है।",
          mr: "विमान ढगांच्या वर उडते आणि दूर जाण्याचा सर्वांत वेगवान मार्ग आहे.",
        },
        pair: {
          left: { en: "The aeroplane", hi: "हवाई जहाज़", mr: "विमान" },
          right: { en: "high above the clouds", hi: "बादलों के ऊपर", mr: "ढगांच्या वर" },
        },
      },
      {
        id: "camel",
        name: { en: "The camel", hi: "ऊँट", mr: "उंट" },
        kind: "land",
        prompt: {
          en: "In the desert, where wheels sink into the sand, which tall animal carries people and loads?",
          hi: "रेगिस्तान में, जहाँ पहिए रेत में धँस जाते हैं, कौन-सा ऊँचा पशु लोगों और बोझ को ढोता है?",
          mr: "वाळवंटात, जिथे चाके वाळूत रुततात, कोणता उंच प्राणी माणसे आणि ओझी वाहतो?",
        },
        statement: {
          en: "In the desert camels carry people and loads across sand where wheels sink.",
          hi: "रेगिस्तान में ऊँट लोगों और बोझ को उस रेत के पार ले जाते हैं जहाँ पहिए धँस जाते हैं।",
          mr: "वाळवंटात उंट माणसे आणि ओझी त्या वाळूपार नेतात जिथे चाके रुततात.",
        },
      },
      {
        id: "wheel",
        name: { en: "The wheel", hi: "पहिया", mr: "चाक" },
        kind: "idea",
        prompt: {
          en: "Round and rolling under carts, cycles, buses and trains alike — which one old invention moves them all?",
          hi: "गाड़ी, साइकिल, बस और रेल — सबके नीचे गोल-गोल घूमता — कौन-सा एक पुराना आविष्कार इन सबको चलाता है?",
          mr: "गाडी, सायकल, बस आणि रेल्वे — साऱ्यांच्या खाली गोल गोल फिरणारा — कोणता एक जुना शोध या साऱ्यांना चालवतो?",
        },
        statement: {
          en: "The wheel is the one round helper turning under almost every land carrier.",
          hi: "पहिया वह एक गोल सहायक है जो ज़मीन की लगभग हर सवारी के नीचे घूमता है।",
          mr: "चाक हा एक गोल मदतनीस आहे, जो जमिनीवरच्या जवळजवळ प्रत्येक वाहनाखाली फिरतो.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Arrange from SLOWEST to FASTEST: aeroplane, bullock cart, train, bicycle. Which order is right?",
          hi: "सबसे धीमे से सबसे तेज़ के क्रम में लगाइए: हवाई जहाज़, बैलगाड़ी, रेलगाड़ी, साइकिल। कौन-सा क्रम सही है?",
          mr: "सर्वांत हळू ते सर्वांत वेगवान क्रमाने लावा: विमान, बैलगाडी, रेल्वेगाडी, सायकल. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "bullock cart → bicycle → train → aeroplane",
            hi: "बैलगाड़ी → साइकिल → रेलगाड़ी → हवाई जहाज़",
            mr: "बैलगाडी → सायकल → रेल्वेगाडी → विमान",
          },
          {
            en: "bicycle → bullock cart → aeroplane → train",
            hi: "साइकिल → बैलगाड़ी → हवाई जहाज़ → रेलगाड़ी",
            mr: "सायकल → बैलगाडी → विमान → रेल्वेगाडी",
          },
          {
            en: "bullock cart → train → bicycle → aeroplane",
            hi: "बैलगाड़ी → रेलगाड़ी → साइकिल → हवाई जहाज़",
            mr: "बैलगाडी → रेल्वेगाडी → सायकल → विमान",
          },
          {
            en: "bicycle → train → bullock cart → aeroplane",
            hi: "साइकिल → रेलगाड़ी → बैलगाड़ी → हवाई जहाज़",
            mr: "सायकल → रेल्वेगाडी → बैलगाडी → विमान",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Walking bullocks are slower than pedalling legs; an engine on rails beats both; and wings beat everything on the ground. Slowest to fastest: cart, cycle, train, plane.",
          hi: "चलते बैल पैडल मारती टाँगों से धीमे हैं; पटरियों पर इंजन दोनों से आगे; और पंख ज़मीन की हर चीज़ से आगे। धीमे से तेज़: गाड़ी, साइकिल, रेल, जहाज़।",
          mr: "चालणारे बैल पॅडल मारणाऱ्या पायांहून हळू; रुळांवरचे इंजिन दोघांच्या पुढे; आणि पंख जमिनीवरच्या साऱ्यांच्या पुढे. हळू ते वेगवान: गाडी, सायकल, रेल्वे, विमान.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Three errands in one day: cross a river that has no bridge, reach another state by night, and fetch milk from the next lane. Which set of carriers fits all three, in order?",
          hi: "एक दिन के तीन काम: बिना पुल की नदी पार करनी है, रात तक दूसरे राज्य पहुँचना है, और पड़ोस की गली से दूध लाना है। कौन-सा सवारी-समूह तीनों पर, क्रम से, ठीक बैठता है?",
          mr: "एका दिवसातली तीन कामे: पूल नसलेली नदी ओलांडायची, रात्रीपर्यंत दुसऱ्या राज्यात पोहोचायचे, आणि शेजारच्या गल्लीतून दूध आणायचे. कोणता वाहन-संच तिन्हींना, क्रमाने, नीट बसतो?",
        },
        choices: [
          {
            en: "boat · train · bicycle",
            hi: "नाव · रेलगाड़ी · साइकिल",
            mr: "होडी · रेल्वेगाडी · सायकल",
          },
          {
            en: "train · boat · aeroplane",
            hi: "रेलगाड़ी · नाव · हवाई जहाज़",
            mr: "रेल्वेगाडी · होडी · विमान",
          },
          {
            en: "bicycle · boat · train",
            hi: "साइकिल · नाव · रेलगाड़ी",
            mr: "सायकल · होडी · रेल्वेगाडी",
          },
          {
            en: "aeroplane · bicycle · boat",
            hi: "हवाई जहाज़ · साइकिल · नाव",
            mr: "विमान · सायकल · होडी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Match the carrier to the ground and the distance: water with no bridge asks for a boat; a state away by night asks for a train; the next lane asks for nothing grander than a bicycle. Any other order sends a train onto a river or a boat down a lane.",
          hi: "सवारी को ज़मीन और दूरी से मिलाइए: बिना पुल का पानी नाव माँगता है; रात तक दूसरा राज्य रेल माँगता है; पड़ोस की गली को साइकिल से बड़ा कुछ नहीं चाहिए। कोई और क्रम रेल को नदी पर और नाव को गली में उतार देता है।",
          mr: "वाहन जमिनीशी आणि अंतराशी जुळवा: पूल नसलेले पाणी होडी मागते; रात्रीपर्यंत दुसरे राज्य रेल्वे मागते; शेजारच्या गल्लीला सायकलहून मोठे काही नको. दुसरा कोणताही क्रम रेल्वेला नदीवर आणि होडीला गल्लीत उतरवतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A cart cannot move without wheels, yet a boat has none at all and still glides along. Why does a boat need no wheels?",
          hi: "बिना पहियों के गाड़ी हिल नहीं सकती, पर नाव के पास एक भी पहिया नहीं — फिर भी वह सरकती चलती है। नाव को पहिए क्यों नहीं चाहिए?",
          mr: "चाकांशिवाय गाडी हलू शकत नाही, पण होडीला एकही चाक नाही — तरी ती सरकत जाते. होडीला चाके का लागत नाहीत?",
        },
        choices: [
          {
            en: "Water holds the boat up and lets it glide — a cart sits on hard ground, which grips, so it must roll",
            hi: "पानी नाव को थामे रखता है और सरकने देता है — गाड़ी कड़ी ज़मीन पर टिकी है, जो जकड़ती है, इसलिए उसे लुढ़कना पड़ता है",
            mr: "पाणी होडीला तोलून धरते आणि सरकू देते — गाडी कडक जमिनीवर टेकलेली असते, जी घट्ट धरते, म्हणून तिला घरंगळावे लागते",
          },
          {
            en: "Boats are lighter than carts, and light things need no wheels",
            hi: "नावें गाड़ियों से हलकी होती हैं, और हलकी चीज़ों को पहिए नहीं चाहिए",
            mr: "होड्या गाड्यांपेक्षा हलक्या असतात, आणि हलक्या वस्तूंना चाके लागत नाहीत",
          },
          {
            en: "Boats do have wheels — they are hidden under the water",
            hi: "नावों के पहिए होते हैं — बस पानी के नीचे छिपे रहते हैं",
            mr: "होड्यांना चाके असतात — फक्त ती पाण्याखाली लपलेली असतात",
          },
          {
            en: "A cart could float too, if only it were pushed hard enough",
            hi: "गाड़ी भी तैर सकती थी, बस उसे ज़ोर से धकेलना पड़ता",
            mr: "गाडीही तरंगू शकली असती, फक्त तिला जोरात ढकलावे लागले असते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Wheels exist to beat the ground's grip: land holds a cart up but rubs against it, so the cart must roll. Water does the holding differently — it lifts the whole boat and slips past its sides, so the boat glides with no wheels at all. Weight is not the reason: a huge loaded boat still floats, a feather-light cart still needs wheels.",
          hi: "पहिए ज़मीन की जकड़ से पार पाने के लिए हैं: ज़मीन गाड़ी को थामती तो है पर रगड़ती भी है, इसलिए गाड़ी को लुढ़कना पड़ता है। पानी थामने का काम अलग ढंग से करता है — वह पूरी नाव को उठा लेता है और उसके किनारों से फिसलता जाता है, इसलिए नाव बिना पहियों के सरकती है। वज़न वजह नहीं: लदी-फँदी बड़ी नाव भी तैरती है, और पंख-सी हलकी गाड़ी को भी पहिए चाहिए।",
          mr: "चाके जमिनीच्या पकडीवर मात करण्यासाठी असतात: जमीन गाडीला तोलते खरी, पण घासतेही, म्हणून गाडीला घरंगळावे लागते. पाणी तोलण्याचे काम वेगळ्या रीतीने करते — ते सबंध होडीला उचलते आणि तिच्या कडांवरून निसटत जाते, म्हणून होडी चाकांशिवाय सरकते. वजन हे कारण नव्हे: भरलेली मोठी होडीही तरंगते, आणि पिसासारख्या हलक्या गाडीलाही चाके लागतातच.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 12 — Work We Do (who does what, and why every work counts)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-3-work-we-do",
    subject: "EVS",
    classLevel: 3,
    chapter: {
      en: "Chapter 12 — Work We Do",
      hi: "अध्याय 12 — हमारे काम",
      mr: "प्रकरण 12 — आपली कामे",
    },
    name: { en: "Work We Do", hi: "हमारे काम", mr: "आपली कामे" },
    summary: {
      en: "Farmers and potters, postmen and tailors, and the never-ending work inside the home — who does what, and why every kind of work counts.",
      hi: "किसान और कुम्हार, डाकिया और दर्ज़ी, और घर के भीतर का कभी न चुकने वाला काम — कौन क्या करता है, और हर काम क्यों मायने रखता है।",
      mr: "शेतकरी आणि कुंभार, पोस्टमन आणि शिंपी, आणि घरातले कधी न संपणारे काम — कोण काय करते, आणि प्रत्येक काम का मोलाचे.",
    },
    position: 12,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "farmer",
        name: { en: "The farmer", hi: "किसान", mr: "शेतकरी" },
        kind: "worker",
        prompt: {
          en: "Who ploughs the field, sows the seed and raises the grain that reaches every plate?",
          hi: "कौन खेत जोतता है, बीज बोता है और वह अनाज उगाता है जो हर थाली तक पहुँचता है?",
          mr: "कोण शेत नांगरतो, बी पेरतो आणि प्रत्येक ताटापर्यंत पोहोचणारे धान्य पिकवतो?",
        },
        statement: {
          en: "The farmer ploughs, sows and harvests — the grain on every plate begins in a farmer's field.",
          hi: "किसान जोतता, बोता और काटता है — हर थाली का अनाज किसी किसान के खेत से ही चलता है।",
          mr: "शेतकरी नांगरतो, पेरतो आणि कापणी करतो — प्रत्येक ताटातले धान्य कोणा शेतकऱ्याच्या शेतातूनच निघते.",
        },
        pair: {
          left: { en: "The farmer", hi: "किसान", mr: "शेतकरी" },
          right: { en: "field and seed", hi: "खेत और बीज", mr: "शेत आणि बियाणे" },
        },
      },
      {
        id: "potter",
        name: { en: "The potter", hi: "कुम्हार", mr: "कुंभार" },
        kind: "worker",
        prompt: {
          en: "Whose spinning wheel turns soft wet clay into pots, pitchers and diyas?",
          hi: "किसका घूमता चाक गीली नरम मिट्टी को घड़ों, सुराहियों और दीयों में बदल देता है?",
          mr: "कोणाचे फिरते चाक ओल्या मऊ मातीला मडकी, घागरी आणि पणत्यांत बदलते?",
        },
        statement: {
          en: "The potter shapes wet clay on a spinning wheel and bakes it hard in a kiln.",
          hi: "कुम्हार गीली मिट्टी को घूमते चाक पर गढ़ता है और आवे में पकाकर कड़ा करता है।",
          mr: "कुंभार ओली माती फिरत्या चाकावर घडवतो आणि भट्टीत भाजून कडक करतो.",
        },
        pair: {
          left: { en: "The potter", hi: "कुम्हार", mr: "कुंभार" },
          right: {
            en: "the spinning wheel and clay",
            hi: "घूमता चाक और मिट्टी",
            mr: "फिरते चाक आणि माती",
          },
        },
      },
      {
        id: "postman",
        name: { en: "The postman", hi: "डाकिया", mr: "पोस्टमन" },
        kind: "worker",
        prompt: {
          en: "Who walks door to door with a full bag, bringing letters and parcels in every weather?",
          hi: "कौन भरे थैले के साथ घर-घर जाता है, हर मौसम में चिट्ठियाँ और पार्सल पहुँचाता?",
          mr: "कोण भरलेली थैली घेऊन दारोदार फिरतो, प्रत्येक ऋतूत पत्रे आणि पार्सले पोहोचवत?",
        },
        statement: {
          en: "The postman carries letters and parcels door to door, in sun and in rain alike.",
          hi: "डाकिया धूप हो या बारिश, चिट्ठियाँ और पार्सल घर-घर पहुँचाता है।",
          mr: "ऊन असो वा पाऊस, पोस्टमन पत्रे आणि पार्सले घरोघर पोहोचवतो.",
        },
        pair: {
          left: { en: "The postman", hi: "डाकिया", mr: "पोस्टमन" },
          right: { en: "letters and parcels", hi: "चिट्ठियाँ और पार्सल", mr: "पत्रे आणि पार्सले" },
        },
      },
      {
        id: "carpenter",
        name: { en: "The carpenter", hi: "बढ़ई", mr: "सुतार" },
        kind: "worker",
        prompt: {
          en: "Who saws, planes and joins wood into doors, beds and school benches?",
          hi: "कौन लकड़ी को चीरता, रंदा करता और जोड़कर दरवाज़े, पलंग और स्कूल की बेंचें बनाता है?",
          mr: "कोण लाकूड कापतो, रंधा मारतो आणि जोडून दारे, पलंग आणि शाळेची बाके बनवतो?",
        },
        statement: {
          en: "The carpenter works in wood — sawing, planing and joining it into doors, beds and benches.",
          hi: "बढ़ई लकड़ी का काम करता है — चीरकर, रंदा कर, जोड़कर दरवाज़े, पलंग और बेंचें बनाता है।",
          mr: "सुतार लाकडाचे काम करतो — कापून, रंधा मारून, जोडून दारे, पलंग आणि बाके बनवतो.",
        },
        pair: {
          left: { en: "The carpenter", hi: "बढ़ई", mr: "सुतार" },
          right: { en: "saw and wood", hi: "आरी और लकड़ी", mr: "करवत आणि लाकूड" },
        },
      },
      {
        id: "tailor",
        name: { en: "The tailor", hi: "दर्ज़ी", mr: "शिंपी" },
        kind: "worker",
        prompt: {
          en: "Who measures you with a tape, cuts the cloth and stitches it into a shirt that fits?",
          hi: "कौन फ़ीते से नाप लेता है, कपड़ा काटता है और सिलकर ठीक बैठने वाली क़मीज़ बनाता है?",
          mr: "कोण टेपने माप घेतो, कापड कापतो आणि शिवून अंगाला बसणारा सदरा बनवतो?",
        },
        statement: {
          en: "The tailor measures, cuts and stitches cloth into clothes that fit the wearer.",
          hi: "दर्ज़ी नापता, काटता और सिलता है — कपड़े को पहनने वाले पर ठीक बैठते लिबास में बदलता है।",
          mr: "शिंपी मापतो, कापतो आणि शिवतो — कापडाचे घालणाऱ्याला नीट बसणारे कपडे करतो.",
        },
        pair: {
          left: { en: "The tailor", hi: "दर्ज़ी", mr: "शिंपी" },
          right: {
            en: "needle, thread and cloth",
            hi: "सुई, धागा और कपड़ा",
            mr: "सुई, दोरा आणि कापड",
          },
        },
      },
      {
        id: "housework",
        name: {
          en: "The work inside the home",
          hi: "घर के भीतर का काम",
          mr: "घरातले काम",
        },
        kind: "idea",
        prompt: {
          en: "Cooking, sweeping, washing, fetching water — day after day, with no salary and no holiday. What is all this together?",
          hi: "खाना पकाना, झाड़ू-बुहारू, धुलाई, पानी भरना — दिन-पर-दिन, बिना वेतन, बिना छुट्टी। यह सब मिलाकर क्या है?",
          mr: "स्वयंपाक, झाडलोट, धुणी, पाणी भरणे — दिवसामागून दिवस, पगाराविना, सुट्टीविना. हे सारे मिळून काय?",
        },
        statement: {
          en: "Housework — cooking, cleaning, washing — is real work, though it earns no salary.",
          hi: "घर का काम — पकाना, सफ़ाई, धुलाई — सचमुच का काम है, भले उसका कोई वेतन नहीं मिलता।",
          mr: "घरकाम — स्वयंपाक, स्वच्छता, धुणी — हे खरेखुरे काम आहे, जरी त्याला पगार मिळत नाही.",
        },
        detail: {
          en: "In many homes most of it is done by the mothers and grandmothers.",
          hi: "बहुत-से घरों में इसका ज़्यादातर हिस्सा माँ और दादी-नानी ही करती हैं।",
          mr: "पुष्कळ घरांत त्यातले बहुतेक आई आणि आजीच करतात.",
        },
        extra: {
          en: "It takes no holiday — food must be cooked and dishes washed every single day.",
          hi: "इसे छुट्टी नहीं मिलती — खाना हर दिन पकाना है, बर्तन हर दिन धोने हैं।",
          mr: "त्याला सुट्टी नसते — जेवण रोज रांधावे लागते, भांडी रोज घासावी लागतात.",
        },
      },
      {
        id: "childrenshelp",
        name: { en: "Children's help", hi: "बच्चों का हाथ बँटाना", mr: "मुलांची मदत" },
        kind: "idea",
        prompt: {
          en: "Watering the plants, carrying grain to the shop, minding the little one — whose small daily work is this, done alongside school?",
          hi: "पौधों को पानी देना, दुकान तक अनाज ले जाना, छोटे को सँभालना — स्कूल के साथ-साथ चलता यह छोटा रोज़ का काम किसका है?",
          mr: "झाडांना पाणी घालणे, दुकानापर्यंत धान्य नेणे, धाकट्याला सांभाळणे — शाळेबरोबर चालणारे हे छोटे रोजचे काम कोणाचे?",
        },
        statement: {
          en: "Children too do real work — watering, fetching, minding younger ones — alongside their school.",
          hi: "बच्चे भी सचमुच का काम करते हैं — पानी देना, लाना-ले जाना, छोटों को सँभालना — अपने स्कूल के साथ-साथ।",
          mr: "मुलेही खरेखुरे काम करतात — पाणी घालणे, आणणे-नेणे, धाकट्यांना सांभाळणे — शाळेसोबतच.",
        },
      },
      {
        id: "dignity",
        name: { en: "No work is small", hi: "कोई काम छोटा नहीं", mr: "कोणतेही काम छोटे नाही" },
        kind: "idea",
        prompt: {
          en: "The town needs its sweepers as much as its doctors — which lesson about work is this?",
          hi: "शहर को अपने सफ़ाई करने वालों की उतनी ही ज़रूरत है जितनी डॉक्टरों की — यह काम के बारे में कौन-सा पाठ है?",
          mr: "गावाला डॉक्टरांइतकीच सफाई करणाऱ्यांचीही गरज असते — हा कामाविषयीचा कोणता धडा?",
        },
        statement: {
          en: "No work is small — if sweepers or farmers stopped for a week, the whole town would feel it at once.",
          hi: "कोई काम छोटा नहीं — सफ़ाई करने वाले या किसान हफ़्ते भर रुक जाएँ, तो पूरा शहर तुरंत महसूस करेगा।",
          mr: "कोणतेही काम छोटे नाही — सफाई करणारे वा शेतकरी आठवडाभर थांबले, तर साऱ्या गावाला लगेच जाणवेल.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A shirt's journey, first to last: the tailor stitches the cloth, the farmer grows the cotton, the weaver turns thread into cloth, the spinner twists cotton into thread. Which order is right?",
          hi: "क़मीज़ का सफ़र, पहले से आख़िर तक: दर्ज़ी कपड़ा सिलता है, किसान कपास उगाता है, बुनकर धागे से कपड़ा बुनता है, कतवारा कपास से धागा कातता है। कौन-सा क्रम सही है?",
          mr: "सदऱ्याचा प्रवास, पहिल्यापासून शेवटपर्यंत: शिंपी कापड शिवतो, शेतकरी कापूस पिकवतो, विणकर धाग्याचे कापड विणतो, कातणारा कापसाचा धागा कातो. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "farmer → spinner → weaver → tailor",
            hi: "किसान → कतवारा → बुनकर → दर्ज़ी",
            mr: "शेतकरी → कातणारा → विणकर → शिंपी",
          },
          {
            en: "farmer → weaver → spinner → tailor",
            hi: "किसान → बुनकर → कतवारा → दर्ज़ी",
            mr: "शेतकरी → विणकर → कातणारा → शिंपी",
          },
          {
            en: "tailor → weaver → spinner → farmer",
            hi: "दर्ज़ी → बुनकर → कतवारा → किसान",
            mr: "शिंपी → विणकर → कातणारा → शेतकरी",
          },
          {
            en: "spinner → farmer → tailor → weaver",
            hi: "कतवारा → किसान → दर्ज़ी → बुनकर",
            mr: "कातणारा → शेतकरी → शिंपी → विणकर",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each worker needs the one before: cotton must grow before it can be spun into thread, thread must exist before cloth can be woven, and only woven cloth can be stitched. Field, then thread, then cloth, then shirt.",
          hi: "हर कारीगर को पिछले वाले की ज़रूरत है: कपास उगे तभी धागा कते, धागा हो तभी कपड़ा बुने, और बुना कपड़ा ही सिला जा सकता है। पहले खेत, फिर धागा, फिर कपड़ा, फिर क़मीज़।",
          mr: "प्रत्येक कारागिराला आधीच्याची गरज: कापूस पिकला तरच धागा कातता येतो, धागा असला तरच कापड विणता येते, आणि विणलेले कापडच शिवता येते. आधी शेत, मग धागा, मग कापड, मग सदरा.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The potter is paid for a pot and the tailor for a shirt — but nobody pays mother for the day's cooking. Does that mean cooking is not work?",
          hi: "कुम्हार को घड़े के पैसे मिलते हैं और दर्ज़ी को क़मीज़ के — पर माँ को दिन भर के खाने के पैसे कोई नहीं देता। तो क्या खाना पकाना काम नहीं है?",
          mr: "कुंभाराला मडक्याचे पैसे मिळतात आणि शिंप्याला सदऱ्याचे — पण आईला दिवसभराच्या स्वयंपाकाचे पैसे कोणी देत नाही. म्हणजे स्वयंपाक हे काम नाही का?",
        },
        choices: [
          {
            en: "It is work all the same — effort and need make work real, not the salary",
            hi: "यह फिर भी काम है — काम को सच्चा मेहनत और ज़रूरत बनाती है, वेतन नहीं",
            mr: "हे कामच आहे — कामाला खरे ठरवतात मेहनत आणि गरज, पगार नव्हे",
          },
          {
            en: "It is not work, because real work always brings money",
            hi: "यह काम नहीं है, क्योंकि असली काम से हमेशा पैसे मिलते हैं",
            mr: "हे काम नाही, कारण खऱ्या कामातून नेहमी पैसे मिळतात",
          },
          {
            en: "Cooking at home is only play, since no customer ordered it",
            hi: "घर का खाना पकाना खेल भर है, क्योंकि किसी ग्राहक ने उसे कहा नहीं",
            mr: "घरचा स्वयंपाक हा खेळच, कारण कोणा गिऱ्हाइकाने तो सांगितलेला नाही",
          },
          {
            en: "It would become work only if it were done in a hotel",
            hi: "वह काम तभी बनेगा जब होटल में किया जाए",
            mr: "ते होटेलात केले तरच काम ठरेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The same hands doing the same cooking in a hotel would earn a wage — the cooking did not change, only the payment did. Housework feeds, clothes and cleans the whole family every day; the chapter's point is that unpaid work is still work, and hands at home deserve helping and thanking.",
          hi: "वही हाथ वही खाना होटल में पकाएँ तो मज़दूरी मिलेगी — पकाना नहीं बदला, सिर्फ़ भुगतान बदला। घर का काम रोज़ पूरे परिवार को खिलाता, पहनाता और सँवारता है; पाठ का मर्म यही है कि बिना वेतन का काम भी काम है, और घर के हाथों का साथ और शुक्रिया दोनों बनते हैं।",
          mr: "तेच हात तोच स्वयंपाक होटेलात करतील तर मजुरी मिळेल — स्वयंपाक बदलला नाही, फक्त मोबदला बदलला. घरकाम रोज साऱ्या कुटुंबाला जेवू घालते, नेसवते आणि सांभाळते; धड्याचा गाभा हाच — पगाराविनाचे कामही कामच, आणि घरच्या हातांना हातभार आणि आभार दोन्ही द्यायला हवेत.",
        },
      },
    ],
  },
];
