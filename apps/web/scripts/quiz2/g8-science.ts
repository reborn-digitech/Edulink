/**
 * Class 8 Science — NCERT, chapter by chapter, through the conceptual
 * engine. The experimenter's notebook matures: seasons of sowing, microbes
 * as friends and foes, and the cell where all of it happens. Same
 * distractor rule as everywhere — every statement must be false of every
 * other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Science (Class 8)";
const LICENCE = "CC-BY-SA-4.0";

export const G8_SCIENCE: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Crop Production and Management (the farmer's year)          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-crop-production",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 1 — Crop Production and Management",
      hi: "अध्याय 1 — फ़सल उत्पादन एवं प्रबंध",
      mr: "प्रकरण 1 — पीक उत्पादन आणि व्यवस्थापन",
    },
    name: {
      en: "Crop Production and Management",
      hi: "फ़सल उत्पादन एवं प्रबंध",
      mr: "पीक उत्पादन आणि व्यवस्थापन",
    },
    summary: {
      en: "The farmer's year in steps: two sowing seasons, soil turned and fed, water rationed drop by drop, freeloading weeds evicted — and the harvest guarded from its quietest enemy, moisture.",
      hi: "क़दम-दर-क़दम किसान का साल: बुवाई के दो मौसम, पलटी और पोसी गई मिट्टी, बूँद-बूँद बँटा पानी, बेदख़ल मुफ़्तख़ोर खरपतवार — और नमी, उस सबसे ख़ामोश दुश्मन से बचाई फ़सल।",
      mr: "पावला-पावलांनी शेतकऱ्याचे वर्ष: पेरणीचे दोन हंगाम, उलथलेली आणि पोसलेली माती, थेंबाथेंबाने वाटलेले पाणी, हुसकावलेले फुकटे तण — आणि ओल, त्या सर्वांत शांत शत्रूपासून राखलेले पीक.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "kharif",
        name: { en: "Kharif crops", hi: "ख़रीफ़ फ़सलें", mr: "खरीप पिके" },
        kind: "season",
        prompt: {
          en: "Which crop season is sown as the monsoon arrives — paddy, maize, soyabean and cotton in its basket?",
          hi: "कौन-सा फ़सली मौसम मानसून के आते ही बोया जाता है — धान, मक्का, सोयाबीन और कपास उसकी टोकरी में?",
          mr: "कोणता पीक हंगाम मान्सून येताच पेरला जातो — भात, मका, सोयाबीन आणि कापूस त्याच्या टोपलीत?",
        },
        statement: {
          en: "Kharif crops are sown with the rains, June to September — paddy, maize, soyabean and cotton ride the monsoon.",
          hi: "ख़रीफ़ फ़सलें बारिश के साथ बोई जाती हैं, जून से सितंबर — धान, मक्का, सोयाबीन और कपास मानसून पर सवार।",
          mr: "खरीप पिके पावसासोबत पेरली जातात, जून ते सप्टेंबर — भात, मका, सोयाबीन आणि कापूस मान्सूनवर स्वार.",
        },
        pair: {
          left: { en: "Sown with the rains", hi: "बारिश संग बुवाई", mr: "पावसासोबतची पेरणी" },
          right: {
            en: "paddy in the monsoon's basket",
            hi: "मानसून की टोकरी में धान",
            mr: "मान्सूनच्या टोपलीतला भात",
          },
        },
      },
      {
        id: "rabi",
        name: { en: "Rabi crops", hi: "रबी फ़सलें", mr: "रब्बी पिके" },
        kind: "season",
        prompt: {
          en: "Which crop season is sown as winter begins — wheat, gram, pea and mustard its regulars?",
          hi: "कौन-सा फ़सली मौसम सर्दी शुरू होते ही बोया जाता है — गेहूँ, चना, मटर और सरसों उसके नियमित?",
          mr: "कोणता पीक हंगाम हिवाळा सुरू होताच पेरला जातो — गहू, हरभरा, वाटाणा आणि मोहरी त्याचे नेहमीचे?",
        },
        statement: {
          en: "Rabi crops grow from October to March — wheat, gram, pea and mustard, watered more by irrigation than by rain.",
          hi: "रबी फ़सलें अक्टूबर से मार्च तक बढ़ती हैं — गेहूँ, चना, मटर और सरसों, बारिश से ज़्यादा सिंचाई से सींची हुईं।",
          mr: "रब्बी पिके ऑक्टोबर ते मार्च वाढतात — गहू, हरभरा, वाटाणा आणि मोहरी, पावसाहून जास्त सिंचनाने भिजवलेली.",
        },
        pair: {
          left: { en: "The winter sowing", hi: "सर्दियों की बुवाई", mr: "हिवाळी पेरणी" },
          right: {
            en: "wheat, gram and mustard",
            hi: "गेहूँ, चना और सरसों",
            mr: "गहू, हरभरा आणि मोहरी",
          },
        },
      },
      {
        id: "tilling",
        name: { en: "Tilling (ploughing)", hi: "जुताई", mr: "नांगरणी" },
        kind: "step",
        prompt: {
          en: "Which first step of farming loosens and turns the soil, letting roots breathe and helpers reach the surface?",
          hi: "खेती का कौन-सा पहला क़दम मिट्टी को ढीला कर पलटता है, जड़ों को साँस और सहायकों को सतह देता हुआ?",
          mr: "शेतीचे कोणते पहिले पाऊल माती सैल करून उलथते, मुळांना श्वास आणि मदतनिसांना पृष्ठभाग देत?",
        },
        statement: {
          en: "Tilling loosens and turns the soil — air enters, nutrient-rich lower soil rises, and roots get room to dive.",
          hi: "जुताई मिट्टी को ढीला कर पलटती है — हवा भीतर आती है, पोषक-भरी निचली मिट्टी ऊपर चढ़ती है, और जड़ों को गोता लगाने की जगह मिलती है।",
          mr: "नांगरणी माती सैल करून उलथते — हवा आत येते, पोषक-भरली खालची माती वर चढते, आणि मुळांना सूर मारायला जागा मिळते.",
        },
        detail: {
          en: "Loosened soil also drinks rain instead of shedding it — the field becomes a sponge, not a slide.",
          hi: "ढीली मिट्टी बारिश बहाने की जगह पी लेती है — खेत फिसलपट्टी नहीं, स्पंज बन जाता है।",
          mr: "सैल माती पाऊस वाहवण्याऐवजी पिते — शेत घसरगुंडी नव्हे, स्पंज होते.",
        },
        extra: {
          en: "The earthworm tills free of charge — the farmer's silent, unpaid plough.",
          hi: "केंचुआ मुफ़्त जुताई करता है — किसान का ख़ामोश, बिन-पगार हल।",
          mr: "गांडूळ फुकट नांगरते — शेतकऱ्याचा मूक, बिनपगारी नांगर.",
        },
        pair: {
          left: { en: "The turned soil", hi: "पलटी हुई मिट्टी", mr: "उलथलेली माती" },
          right: { en: "roots given room", hi: "जड़ों को मिली जगह", mr: "मुळांना मिळालेली जागा" },
        },
      },
      {
        id: "seed-drill",
        name: { en: "The seed drill", hi: "सीड ड्रिल", mr: "पाभर (सीड ड्रिल)" },
        kind: "tool",
        prompt: {
          en: "Which tractor-drawn tool places seeds at even depth and spacing, covering them as it goes so birds go hungry?",
          hi: "ट्रैक्टर से जुता कौन-सा औज़ार बीजों को एक-सी गहराई और दूरी पर रखता है, साथ-साथ ढकता हुआ कि पंछी भूखे रहें?",
          mr: "ट्रॅक्टरला जोडलेले कोणते अवजार बियांना सारख्या खोलीवर आणि अंतरावर ठेवते, जाता-जाता झाकत की पक्षी उपाशी राहावेत?",
        },
        statement: {
          en: "The seed drill sows evenly and covers in the same pass — uniform depth, fair spacing, disappointed birds.",
          hi: "सीड ड्रिल एक ही फेरे में बराबर बोती और ढकती है — एक-सी गहराई, न्यायी दूरी, निराश पंछी।",
          mr: "पाभर एकाच फेरीत सारखे पेरते आणि झाकते — समान खोली, न्याय्य अंतर, निराश पक्षी.",
        },
        pair: {
          left: { en: "Seeds at even depth", hi: "एक गहराई पर बीज", mr: "सारख्या खोलीवरचे बी" },
          right: {
            en: "sown and covered in one pass",
            hi: "एक फेरे में बोया-ढका",
            mr: "एका फेरीत पेरले-झाकले",
          },
        },
      },
      {
        id: "manure",
        name: { en: "Manure", hi: "गोबर की खाद (जैविक खाद)", mr: "शेणखत (सेंद्रिय खत)" },
        kind: "input",
        prompt: {
          en: "Which soil food, made of rotted plant and animal waste, mends the soil's texture as well as feeding it?",
          hi: "सड़े पौध-पशु कचरे से बनी कौन-सी मिट्टी की ख़ुराक मिट्टी की बनावट भी सुधारती है और उसे खिलाती भी है?",
          mr: "कुजलेल्या वनस्पती-प्राणी कचऱ्यापासून बनलेले कोणते मातीचे खाद्य मातीचा पोतही सुधारते आणि तिला पोसतेही?",
        },
        statement: {
          en: "Manure is decomposed organic matter — slower than factory fertiliser, but a friend to soil structure and its microbes.",
          hi: "जैविक खाद सड़ा हुआ कार्बनिक पदार्थ है — कारख़ानी उर्वरक से धीमी, पर मिट्टी की बनावट और उसके सूक्ष्मजीवों की मित्र।",
          mr: "सेंद्रिय खत म्हणजे कुजलेला सेंद्रिय पदार्थ — कारखान्याच्या खताहून हळू, पण मातीच्या पोताचे आणि तिच्या सूक्ष्मजीवांचे मित्र.",
        },
        detail: {
          en: "Fertilisers are chemical and concentrated — quick food, but blind to the soil's long-term health.",
          hi: "उर्वरक रासायनिक और सांद्र हैं — फ़ौरी ख़ुराक, पर मिट्टी की दूरगामी सेहत से अनजान।",
          mr: "रासायनिक खते संहत असतात — तातडीचे खाद्य, पण मातीच्या दूरगामी आरोग्याबाबत आंधळे.",
        },
        extra: {
          en: "Overused fertiliser hardens fields and washes into ponds — feeding algae instead of people.",
          hi: "ज़्यादा उर्वरक खेत कड़े करता है और तालाबों में बह जाता है — लोगों की जगह काई को खिलाता हुआ।",
          mr: "जास्त खत शेते कडक करते आणि तळ्यांत वाहून जाते — माणसांऐवजी शेवाळाला पोसत.",
        },
        pair: {
          left: { en: "Rotted waste as food", hi: "ख़ुराक बना सड़ा कचरा", mr: "खाद्य झालेला कुजका कचरा" },
          right: {
            en: "soil fed, structure mended",
            hi: "मिट्टी पली, बनावट सुधरी",
            mr: "माती पोसली, पोत सुधारला",
          },
        },
      },
      {
        id: "irrigation8",
        name: { en: "Irrigation", hi: "सिंचाई", mr: "सिंचन" },
        kind: "step",
        prompt: {
          en: "Which scheduled supply of water — by canal, well, sprinkler or drip — keeps a crop alive between rains?",
          hi: "नहर, कुएँ, फुहारे या टपक से पानी की कौन-सी नियत आपूर्ति फ़सल को बारिशों के बीच जिलाए रखती है?",
          mr: "कालवा, विहीर, तुषार वा ठिबकाने पाण्याचा कोणता ठरलेला पुरवठा पिकाला पावसांच्या मध्ये जगवत ठेवतो?",
        },
        statement: {
          en: "Irrigation waters crops on schedule — from traditional lifts to modern drips, each method matched to land and purse.",
          hi: "सिंचाई फ़सल को नियत समय पर सींचती है — पारंपरिक रहट से आधुनिक टपक तक, हर विधि ज़मीन और जेब से मेल खाती।",
          mr: "सिंचन पिकाला ठरल्या वेळी भिजवते — पारंपरिक रहाटापासून आधुनिक ठिबकापर्यंत, प्रत्येक रीत जमीन आणि खिशाशी जुळलेली.",
        },
        detail: {
          en: "Drip irrigation feeds the roots drop by drop — the miser's method, and the one that wastes least.",
          hi: "टपक सिंचाई जड़ों को बूँद-बूँद खिलाती है — कंजूस की विधि, और सबसे कम गँवाने वाली।",
          mr: "ठिबक सिंचन मुळांना थेंबाथेंबाने पाजते — कंजुषाची रीत, आणि सर्वांत कमी वाया घालवणारी.",
        },
        extra: {
          en: "Sprinklers suit sandy, uneven land where flooded water would sink or run away.",
          hi: "फुहारे रेतीली, ऊबड़-खाबड़ ज़मीन के लिए हैं, जहाँ भरा पानी धँसता या भागता।",
          mr: "तुषार वालुकामय, उंचसखल जमिनीसाठी, जिथे साठवलेले पाणी मुरले वा पळाले असते.",
        },
        pair: {
          left: { en: "Water on schedule", hi: "नियत समय का पानी", mr: "ठरल्या वेळचे पाणी" },
          right: {
            en: "canal, sprinkler or drip",
            hi: "नहर, फुहारा या टपक",
            mr: "कालवा, तुषार वा ठिबक",
          },
        },
      },
      {
        id: "weeding",
        name: { en: "Weeding", hi: "निराई", mr: "खुरपणी (निंदणी)" },
        kind: "step",
        prompt: {
          en: "Which removal of unwanted plants stops them stealing the crop's water, nutrients, light and room?",
          hi: "अनचाहे पौधों की कौन-सी निकासी उन्हें फ़सल का पानी, पोषक, रोशनी और जगह चुराने से रोकती है?",
          mr: "नको असलेल्या झाडांचे कोणते काढणे त्यांना पिकाचे पाणी, पोषके, प्रकाश आणि जागा चोरण्यापासून रोखते?",
        },
        statement: {
          en: "Weeding evicts the field's freeloaders — weeds fight the crop for every input the farmer paid for.",
          hi: "निराई खेत के मुफ़्तख़ोरों को बेदख़ल करती है — खरपतवार किसान की चुकाई हर चीज़ के लिए फ़सल से लड़ते हैं।",
          mr: "खुरपणी शेतातल्या फुकट्यांना हुसकावते — तण शेतकऱ्याने भरलेल्या प्रत्येक गोष्टीसाठी पिकाशी भांडतात.",
        },
        pair: {
          left: {
            en: "The evicted freeloaders",
            hi: "बेदख़ल मुफ़्तख़ोर",
            mr: "हुसकावलेले फुकटे",
          },
          right: {
            en: "water and light reclaimed",
            hi: "वापस मिले पानी-रोशनी",
            mr: "परत मिळालेले पाणी-प्रकाश",
          },
        },
      },
      {
        id: "storage",
        name: { en: "Safe storage", hi: "सुरक्षित भंडारण", mr: "सुरक्षित साठवण" },
        kind: "step",
        prompt: {
          en: "After harvest, which step dries grain hard and seals it in sacks and bins against moisture, rats and weevils?",
          hi: "कटाई के बाद कौन-सा क़दम अनाज को कड़ा सुखाकर बोरों-कोठियों में बंद करता है — नमी, चूहों और घुनों से बचाकर?",
          mr: "कापणीनंतर कोणते पाऊल धान्य कडक वाळवून पोत्यां-कणग्यांत बंद करते — ओल, उंदीर आणि टोक्यांपासून वाचवत?",
        },
        statement: {
          en: "Safe storage dries grain first, then seals it — moisture is the first enemy; rats and weevils follow it in.",
          hi: "सुरक्षित भंडारण पहले अनाज सुखाता है, फिर बंद करता है — नमी पहली दुश्मन है; चूहे और घुन उसी के पीछे आते हैं।",
          mr: "सुरक्षित साठवण आधी धान्य वाळवते, मग बंद करते — ओल पहिली शत्रू; उंदीर आणि टोके तिच्यामागून येतात.",
        },
        detail: {
          en: "Dried neem leaves in home grain bins are the old, free chemistry of protection.",
          hi: "घर की कोठियों में सूखी नीम-पत्तियाँ बचाव की पुरानी, मुफ़्त रसायनशाला हैं।",
          mr: "घरच्या कणग्यांतली वाळलेली कडुनिंबाची पाने ही रक्षणाची जुनी, फुकट रसायनशाळा.",
        },
        extra: {
          en: "Big granaries fumigate before sealing — one lapse can rot a whole season's work.",
          hi: "बड़े अन्न-भंडार बंद करने से पहले धूमन करते हैं — एक चूक पूरे मौसम की मेहनत सड़ा सकती है।",
          mr: "मोठी धान्यागारे बंद करण्याआधी धुरी देतात — एक चूक अख्ख्या हंगामाचे श्रम कुजवू शकते.",
        },
        pair: {
          left: {
            en: "The dried, sealed grain",
            hi: "सूखा, बंद अनाज",
            mr: "वाळलेले, बंद धान्य",
          },
          right: {
            en: "a season's work guarded",
            hi: "बचाई हुई मौसम भर की मेहनत",
            mr: "राखलेले हंगामभराचे श्रम",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put the farmer's year in working order. Which sequence is right?",
          hi: "किसान के साल को काम के क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "शेतकऱ्याचे वर्ष कामाच्या क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Tilling → sowing → manuring and irrigation → weeding → harvest → storage",
            hi: "जुताई → बुवाई → खाद-सिंचाई → निराई → कटाई → भंडारण",
            mr: "नांगरणी → पेरणी → खत-सिंचन → खुरपणी → कापणी → साठवण",
          },
          {
            en: "Sowing → tilling → harvest → weeding → irrigation → storage",
            hi: "बुवाई → जुताई → कटाई → निराई → सिंचाई → भंडारण",
            mr: "पेरणी → नांगरणी → कापणी → खुरपणी → सिंचन → साठवण",
          },
          {
            en: "Storage → sowing → tilling → harvest → manuring → weeding",
            hi: "भंडारण → बुवाई → जुताई → कटाई → खाद → निराई",
            mr: "साठवण → पेरणी → नांगरणी → कापणी → खत → खुरपणी",
          },
          {
            en: "Tilling → weeding → storage → sowing → irrigation → harvest",
            hi: "जुताई → निराई → भंडारण → बुवाई → सिंचाई → कटाई",
            mr: "नांगरणी → खुरपणी → साठवण → पेरणी → सिंचन → कापणी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each step prepares the next: soil is readied before seed, seed before feeding and watering, the growing crop is weeded, the ripe crop cut, the dry grain sealed. Swap any two and one step works on something that isn't there yet — the order IS the logic.",
          hi: "हर क़दम अगले की तैयारी है: बीज से पहले मिट्टी, खिलाने-सींचने से पहले बीज, बढ़ती फ़सल की निराई, पकी की कटाई, सूखे अनाज की सीलबंदी। कोई दो पलटिए और एक क़दम उस पर काम करेगा जो अभी है ही नहीं — क्रम ही तर्क है।",
          mr: "प्रत्येक पाऊल पुढच्याची तयारी: बियाआधी माती, पोसण्या-भिजवण्याआधी बी, वाढत्या पिकाची खुरपणी, पिकल्याची कापणी, वाळल्या धान्याची बंदी. कोणतीही दोन उलटवा आणि एक पाऊल अजून नसलेल्या गोष्टीवर काम करेल — क्रम हाच तर्क.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A farmer alternates wheat one season with gram the next, though gram earns less at market. What is the wheat quietly being paid in?",
          hi: "एक किसान एक मौसम गेहूँ, अगले चना बोता है, हालाँकि चना बाज़ार में कम कमाता है। गेहूँ को चुपचाप किस चीज़ में भुगतान हो रहा है?",
          mr: "एक शेतकरी एका हंगामात गहू, पुढच्यात हरभरा पेरतो, जरी हरभरा बाजारात कमी कमावतो. गव्हाला गुपचूप कशात मोबदला मिळतो आहे?",
        },
        choices: [
          {
            en: "Nitrogen: the gram's root-nodule bacteria refill the soil's nitrogen that wheat drained — the 'cheaper' crop is a fertiliser factory the farmer never billed for",
            hi: "नाइट्रोजन: चने की जड़-ग्रंथियों के जीवाणु वह नाइट्रोजन लौटाते हैं जो गेहूँ खींच गया — 'सस्ती' फ़सल वह खाद-कारख़ाना है जिसका बिल किसान को कभी नहीं आया",
            mr: "नायट्रोजन: हरभऱ्याच्या मूळ-गाठींचे जीवाणू गव्हाने ओढलेला नायट्रोजन परत भरतात — 'स्वस्त' पीक म्हणजे शेतकऱ्याला कधी बिल न आलेला खत-कारखाना",
          },
          {
            en: "Nothing — alternating crops is only an old superstition",
            hi: "कुछ नहीं — फ़सल बदलना केवल पुराना अंधविश्वास है",
            mr: "काहीच नाही — पीक बदलणे केवळ जुनी अंधश्रद्धा",
          },
          {
            en: "Gram roots dig wells that water the next wheat",
            hi: "चने की जड़ें कुएँ खोदती हैं जो अगले गेहूँ को सींचते हैं",
            mr: "हरभऱ्याची मुळे विहिरी खणतात ज्या पुढच्या गव्हाला भिजवतात",
          },
          {
            en: "Wheat simply grows better when it rests in a warehouse",
            hi: "गेहूँ गोदाम में आराम करने से ही बेहतर उगता है",
            mr: "गहू गोदामात विश्रांती घेतल्यानेच चांगला उगवतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Wheat withdraws nitrogen; gram, a legume, hosts Rhizobium in its root nodules and deposits nitrogen back. The rotation is bookkeeping across seasons: one crop's rent pays the next crop's feed, and the farmer buys that much less fertiliser. Market price measured one season; the soil measures both.",
          hi: "गेहूँ नाइट्रोजन निकालता है; दलहनी चना अपनी जड़-ग्रंथियों में राइज़ोबियम पालकर नाइट्रोजन वापस जमा करता है। फ़सल-चक्र मौसमों के आर-पार की बहीखाता है: एक फ़सल का किराया अगली की ख़ुराक चुकाता है, और किसान उतनी खाद कम ख़रीदता है। बाज़ार-भाव एक मौसम नापता है; मिट्टी दोनों।",
          mr: "गहू नायट्रोजन काढतो; द्विदल हरभरा आपल्या मूळ-गाठींत रायझोबियम पोसून नायट्रोजन परत भरतो. फेरपालट म्हणजे हंगामांपारचा जमाखर्च: एका पिकाचे भाडे पुढच्याचे खाद्य देते, आणि शेतकरी तितके खत कमी घेतो. बाजारभाव एक हंगाम मोजतो; माती दोन्ही.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Microorganisms: Friend and Foe                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-microorganisms",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 2 — Microorganisms: Friend and Foe",
      hi: "अध्याय 2 — सूक्ष्मजीव: मित्र एवं शत्रु",
      mr: "प्रकरण 2 — सूक्ष्मजीव: मित्र आणि शत्रू",
    },
    name: {
      en: "Microorganisms: Friend and Foe",
      hi: "सूक्ष्मजीव: मित्र एवं शत्रु",
      mr: "सूक्ष्मजीव: मित्र आणि शत्रू",
    },
    summary: {
      en: "Life below eyesight, keeping both ledgers: curd set and dough raised, soil recharged and diseases couriered — with vaccines as rehearsal, antibiotics as microbe against microbe, and salt as siege.",
      hi: "नज़र से नीचे का जीवन, दोनों बहियाँ थामे: जमा दही और फूला आटा, भरी मिट्टी और ढोई गई बीमारियाँ — टीके बतौर पूर्वाभ्यास, प्रतिजैविक बतौर सूक्ष्मजीव-विरुद्ध-सूक्ष्मजीव, और नमक बतौर घेराबंदी।",
      mr: "नजरेखालचे जीवन, दोन्ही वह्या सांभाळणारे: लावलेले दही आणि फुगलेली कणीक, भरलेली माती आणि वाहिलेले आजार — तालीम म्हणून लसी, सूक्ष्मजीवाविरुद्ध सूक्ष्मजीव म्हणून प्रतिजैविके, आणि वेढा म्हणून मीठ.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "microbes",
        name: { en: "Microorganisms", hi: "सूक्ष्मजीव", mr: "सूक्ष्मजीव" },
        kind: "class",
        prompt: {
          en: "Which living things, too small for the naked eye, crowd every drop of pond water and pinch of soil?",
          hi: "नंगी आँख के लिए बहुत छोटे कौन-से जीव तालाब की हर बूँद और मिट्टी की हर चुटकी में भरे हैं?",
          mr: "उघड्या डोळ्यांना फारच लहान असलेले कोणते जीव तळ्याच्या प्रत्येक थेंबात आणि मातीच्या प्रत्येक चिमटीत भरले आहेत?",
        },
        statement: {
          en: "Microorganisms live everywhere unseen — bacteria, fungi, protozoa and algae, with viruses waiting at life's very edge.",
          hi: "सूक्ष्मजीव हर जगह अनदेखे बसे हैं — जीवाणु, कवक, प्रोटोज़ोआ और शैवाल; और जीवन की सरहद पर खड़े विषाणु।",
          mr: "सूक्ष्मजीव सर्वत्र न दिसता राहतात — जीवाणू, बुरशी, आदिजीव आणि शैवाल; आणि जीवनाच्या सीमेवर उभे विषाणू.",
        },
        detail: {
          en: "A microscope turns a water drop into a city — Leeuwenhoek saw his 'little animals' there in the 1670s.",
          hi: "सूक्ष्मदर्शी पानी की बूँद को शहर बना देता है — लीवेनहुक ने 1670 के दशक में वहीं अपने 'नन्हे जानवर' देखे।",
          mr: "सूक्ष्मदर्शक पाण्याच्या थेंबाला शहर करतो — लेवेनहूकने 1670 च्या दशकात तिथेच आपले 'इवले प्राणी' पाहिले.",
        },
        extra: {
          en: "They outnumber us beyond counting — most neither help nor harm, simply living alongside.",
          hi: "वे गिनती से परे हमसे ज़्यादा हैं — अधिकांश न मदद करते हैं न नुक़सान, बस साथ-साथ जीते हैं।",
          mr: "ते मोजण्यापलीकडे आपल्याहून जास्त आहेत — बहुतेक ना मदत करतात ना इजा, नुसते सोबत जगतात.",
        },
        pair: {
          left: { en: "Life below eyesight", hi: "नज़र से नीचे का जीवन", mr: "नजरेखालचे जीवन" },
          right: { en: "everywhere, unseen", hi: "हर जगह, अनदेखा", mr: "सर्वत्र, न दिसणारे" },
        },
      },
      {
        id: "lactobacillus",
        name: { en: "Lactobacillus", hi: "लैक्टोबैसिलस", mr: "लॅक्टोबॅसिलस" },
        kind: "friend",
        prompt: {
          en: "Which bacterium turns warm milk into curd overnight, multiplying as the milk sets?",
          hi: "कौन-सा जीवाणु गुनगुने दूध को रात भर में दही बना देता है, दूध जमने के साथ-साथ बढ़ता हुआ?",
          mr: "कोणता जीवाणू कोमट दुधाचे रात्रीत दही करतो, दूध लागता-लागता वाढत जाणारा?",
        },
        statement: {
          en: "Lactobacillus curdles milk — the spoonful of starter is a living seed of bacteria, sown in a warm pot.",
          hi: "लैक्टोबैसिलस दूध जमाता है — जामन की चम्मच जीवाणुओं का जीवित बीज है, गुनगुने बर्तन में बोया हुआ।",
          mr: "लॅक्टोबॅसिलस दूध लावतो — विरजणाचा चमचा म्हणजे जीवाणूंचे जिवंत बी, कोमट भांड्यात पेरलेले.",
        },
        pair: {
          left: { en: "The curd-maker", hi: "दही जमाने वाला", mr: "दही लावणारा" },
          right: { en: "a living starter", hi: "जीवित जामन", mr: "जिवंत विरजण" },
        },
      },
      {
        id: "yeast8",
        name: { en: "Yeast", hi: "ख़मीर (यीस्ट)", mr: "यीस्ट (खमीर)" },
        kind: "friend",
        prompt: {
          en: "Which microbe puffs up dough and brews drinks by eating sugar and breathing out carbon dioxide?",
          hi: "कौन-सा सूक्ष्मजीव शक्कर खाकर और कार्बन डाइऑक्साइड छोड़कर आटा फुलाता और आसव बनाता है?",
          mr: "कोणता सूक्ष्मजीव साखर खाऊन आणि कार्बन डायऑक्साइड सोडून कणीक फुगवतो आणि आसव घडवतो?",
        },
        statement: {
          en: "Yeast ferments sugar — its carbon dioxide bubbles raise the dough, and the process is called fermentation.",
          hi: "ख़मीर शक्कर का किण्वन करता है — उसकी कार्बन डाइऑक्साइड के बुलबुले आटा उठाते हैं, और प्रक्रिया किण्वन कहलाती है।",
          mr: "यीस्ट साखरेचे किण्वन करते — तिच्या कार्बन डायऑक्साइडचे बुडबुडे कणीक उचलतात, आणि प्रक्रियेला किण्वन म्हणतात.",
        },
        pair: {
          left: {
            en: "Sugar eaten, gas breathed",
            hi: "शक्कर खाई, गैस छोड़ी",
            mr: "साखर खाल्ली, वायू सोडला",
          },
          right: {
            en: "dough puffed by a microbe",
            hi: "सूक्ष्मजीव से फूला आटा",
            mr: "सूक्ष्मजीवाने फुगलेली कणीक",
          },
        },
      },
      {
        id: "antibiotics",
        name: { en: "Antibiotics", hi: "प्रतिजैविक (एंटीबायोटिक)", mr: "प्रतिजैविके (अँटिबायोटिक)" },
        kind: "medicine",
        prompt: {
          en: "Which medicines, made from microbes themselves, kill disease-causing bacteria — yet do nothing against colds and flu?",
          hi: "स्वयं सूक्ष्मजीवों से बनी कौन-सी दवाएँ रोगकारी जीवाणु मारती हैं — फिर भी ज़ुकाम और फ़्लू पर बेअसर रहती हैं?",
          mr: "स्वतः सूक्ष्मजीवांपासून बनलेली कोणती औषधे रोगकारक जीवाणू मारतात — तरी सर्दी आणि फ्लूवर निष्प्रभ राहतात?",
        },
        statement: {
          en: "Antibiotics set microbe against microbe — penicillin began the line, and viruses shrug the whole line off.",
          hi: "प्रतिजैविक सूक्ष्मजीव को सूक्ष्मजीव से भिड़ाते हैं — पेनिसिलिन ने वंश शुरू किया, और विषाणु पूरे वंश को झटक देते हैं।",
          mr: "प्रतिजैविके सूक्ष्मजीवाला सूक्ष्मजीवाशी भिडवतात — पेनिसिलिनने वंश सुरू केला, आणि विषाणू अख्खा वंश झटकतात.",
        },
        detail: {
          en: "Fleming noticed a stray mould killing his bacterial colonies in 1928 — the accident became penicillin.",
          hi: "1928 में फ़्लेमिंग ने देखा कि भटकी फफूँद उनकी जीवाणु-बस्तियाँ मार रही है — वही इत्तिफ़ाक़ पेनिसिलिन बना।",
          mr: "1928 मध्ये फ्लेमिंगने पाहिले की भटकी बुरशी त्यांच्या जीवाणू-वसाहती मारते आहे — तोच योगायोग पेनिसिलिन झाला.",
        },
        extra: {
          en: "Needless courses and half-finished ones train resistant germs — misuse is the medicine's own enemy.",
          hi: "बेवजह और अधूरे कोर्स प्रतिरोधी कीटाणु गढ़ते हैं — दुरुपयोग दवा का अपना दुश्मन है।",
          mr: "विनाकारण आणि अर्धवट कोर्स प्रतिरोधक जंतू घडवतात — गैरवापर हा औषधाचा स्वतःचा शत्रू.",
        },
        pair: {
          left: {
            en: "Microbe against microbe",
            hi: "सूक्ष्मजीव विरुद्ध सूक्ष्मजीव",
            mr: "सूक्ष्मजीवाविरुद्ध सूक्ष्मजीव",
          },
          right: { en: "penicillin's line", hi: "पेनिसिलिन का वंश", mr: "पेनिसिलिनचा वंश" },
        },
      },
      {
        id: "vaccines",
        name: { en: "Vaccines", hi: "टीके (वैक्सीन)", mr: "लसी" },
        kind: "medicine",
        prompt: {
          en: "Which preparation teaches the body to fight a disease BEFORE it arrives, using weakened or killed germs?",
          hi: "कौन-सी तैयारी कमज़ोर या मरे कीटाणुओं से शरीर को बीमारी आने से पहले ही लड़ना सिखा देती है?",
          mr: "कोणती तयारी दुबळ्या वा मेलेल्या जंतूंनी शरीराला आजार येण्याआधीच लढायला शिकवते?",
        },
        statement: {
          en: "A vaccine is a rehearsal — the body meets a disabled germ, learns its face, and remembers for the real day.",
          hi: "टीका पूर्वाभ्यास है — शरीर निष्क्रिय कीटाणु से मिलता है, चेहरा पहचानता है, और असली दिन के लिए याद रखता है।",
          mr: "लस म्हणजे तालीम — शरीर निष्क्रिय जंतूला भेटते, चेहरा ओळखते, आणि खऱ्या दिवसासाठी लक्षात ठेवते.",
        },
        detail: {
          en: "Smallpox was erased from the Earth by vaccination — the campaign declared victory in 1980.",
          hi: "चेचक टीकाकरण से धरती से मिटा — अभियान ने 1980 में विजय घोषित की।",
          mr: "देवी लसीकरणाने पृथ्वीवरून पुसली गेली — मोहिमेने 1980 मध्ये विजय जाहीर केला.",
        },
        extra: {
          en: "Pulse polio drops carried the same idea door to door across India.",
          hi: "पल्स पोलियो की बूँदें यही विचार भारत भर में घर-घर ले गईं।",
          mr: "पल्स पोलिओ थेंबांनी हीच कल्पना भारतभर घरोघरी नेली.",
        },
        pair: {
          left: { en: "The body's rehearsal", hi: "शरीर का पूर्वाभ्यास", mr: "शरीराची तालीम" },
          right: {
            en: "memory before the disease",
            hi: "बीमारी से पहले की याद",
            mr: "आजाराआधीची आठवण",
          },
        },
      },
      {
        id: "nitrogen-fixers",
        name: { en: "The nitrogen fixers", hi: "नाइट्रोजन स्थिरीकारक", mr: "नायट्रोजन स्थिरक" },
        kind: "friend",
        prompt: {
          en: "Which soil bacteria and blue-green algae turn the air's nitrogen into forms plants can drink?",
          hi: "कौन-से मिट्टी के जीवाणु और नील-हरित शैवाल हवा की नाइट्रोजन को पौधों के पीने लायक़ रूपों में बदलते हैं?",
          mr: "कोणते मातीतले जीवाणू आणि नील-हरित शैवाल हवेतल्या नायट्रोजनला वनस्पतींना पिता येणाऱ्या रूपांत बदलतात?",
        },
        statement: {
          en: "Nitrogen-fixing microbes recharge the soil — Rhizobium in legume nodules, blue-green algae in paddy water.",
          hi: "नाइट्रोजन-स्थिरीकारक सूक्ष्मजीव मिट्टी भरते हैं — दलहनों की ग्रंथियों में राइज़ोबियम, धान के पानी में नील-हरित शैवाल।",
          mr: "नायट्रोजन-स्थिरक सूक्ष्मजीव माती भरतात — द्विदलांच्या गाठींत रायझोबियम, भाताच्या पाण्यात नील-हरित शैवाल.",
        },
        pair: {
          left: {
            en: "Air turned to plant food",
            hi: "हवा बनी पौधों की ख़ुराक",
            mr: "हवेचे झालेले वनस्पती-खाद्य",
          },
          right: { en: "soil recharged unseen", hi: "अनदेखे भरी मिट्टी", mr: "न दिसता भरलेली माती" },
        },
      },
      {
        id: "pathogens",
        name: { en: "Pathogens", hi: "रोगजनक (पैथोजन)", mr: "रोगकारक (पॅथोजन)" },
        kind: "foe",
        prompt: {
          en: "Which disease-causing microbes travel by air, water, food and insect couriers?",
          hi: "कौन-से रोगकारी सूक्ष्मजीव हवा, पानी, भोजन और कीट-हरकारों से सफ़र करते हैं?",
          mr: "कोणते रोगकारक सूक्ष्मजीव हवा, पाणी, अन्न आणि कीटक-निरोप्यांनी प्रवास करतात?",
        },
        statement: {
          en: "Pathogens are the foe half of the ledger — cholera rides water, colds ride air, malaria's parasite rides the mosquito.",
          hi: "रोगजनक बही का शत्रु-पक्ष हैं — हैज़ा पानी पर सवार, ज़ुकाम हवा पर, मलेरिया का परजीवी मच्छर पर।",
          mr: "रोगकारक हे वहीची शत्रू-बाजू — कॉलरा पाण्यावर स्वार, सर्दी हवेवर, मलेरियाचा परजीवी डासावर.",
        },
        detail: {
          en: "Anopheles carries malaria's parasite; Aedes carries dengue's virus — control the courier and you control the disease.",
          hi: "एनॉफ़िलीज़ मलेरिया का परजीवी ढोता है; एडीस डेंगू का विषाणु — हरकारे को क़ाबू कीजिए तो बीमारी क़ाबू में।",
          mr: "अ‍ॅनॉफिलीस मलेरियाचा परजीवी वाहतो; एडिस डेंग्यूचा विषाणू — निरोप्याला आवरा म्हणजे आजार आवरला.",
        },
        extra: {
          en: "Clean water and covered food block more disease than any medicine cabinet ever will.",
          hi: "साफ़ पानी और ढका भोजन उतनी बीमारी रोकते हैं जितनी कोई दवा-अलमारी कभी नहीं रोकेगी।",
          mr: "स्वच्छ पाणी आणि झाकलेले अन्न इतका आजार रोखतात जितका कोणतेही औषध-कपाट कधीच रोखणार नाही.",
        },
        pair: {
          left: { en: "The disease couriers", hi: "बीमारी के हरकारे", mr: "आजाराचे निरोपे" },
          right: {
            en: "air, water and wings",
            hi: "हवा, पानी और पंख",
            mr: "हवा, पाणी आणि पंख",
          },
        },
      },
      {
        id: "preservation",
        name: { en: "Food preservation", hi: "खाद्य परिरक्षण", mr: "अन्न टिकवण" },
        kind: "practice",
        prompt: {
          en: "Salt, sugar, oil, vinegar and cold — which practice uses them all to keep microbes out of food?",
          hi: "नमक, शक्कर, तेल, सिरका और ठंडक — कौन-सी विधि इन सबसे भोजन को सूक्ष्मजीवों से बचाती है?",
          mr: "मीठ, साखर, तेल, व्हिनेगर आणि गारवा — कोणती रीत या साऱ्यांनी अन्नाला सूक्ष्मजीवांपासून राखते?",
        },
        statement: {
          en: "Preservation starves or blocks microbes — salt and sugar draw their water out, cold slows them, boiling ends them.",
          hi: "परिरक्षण सूक्ष्मजीवों को भूखा रखता या रोकता है — नमक-शक्कर उनका पानी खींच लेते हैं, ठंडक धीमा करती है, उबाल ख़त्म।",
          mr: "टिकवण सूक्ष्मजीवांना उपाशी ठेवते वा अडवते — मीठ-साखर त्यांचे पाणी ओढतात, गारवा मंदावतो, उकळी संपवते.",
        },
        detail: {
          en: "Pasteurisation heats milk briefly, then chills it fast — Pasteur's compromise that keeps the taste and kills the germs.",
          hi: "पाश्चुरीकरण दूध को थोड़ा तपाकर झट ठंडा करता है — पाश्चर का समझौता, जो स्वाद रखता है और कीटाणु मारता है।",
          mr: "पाश्चरीकरण दूध थोडे तापवून झटकन थंड करते — पाश्चरची तडजोड, जी चव राखते आणि जंतू मारते.",
        },
        extra: {
          en: "A pickle's oil is a moat, jam's sugar a desert — kitchen chemistry as fortress-building.",
          hi: "अचार का तेल खाई है, मुरब्बे की शक्कर रेगिस्तान — क़िलेबंदी करती रसोई की रसायनशाला।",
          mr: "लोणच्याचे तेल म्हणजे खंदक, मुरांब्याची साखर वाळवंट — किल्लेबांधणी करणारे स्वयंपाकघरचे रसायनशास्त्र.",
        },
        pair: {
          left: {
            en: "Salt, sugar, oil and cold",
            hi: "नमक, शक्कर, तेल और ठंडक",
            mr: "मीठ, साखर, तेल आणि गारवा",
          },
          right: { en: "microbes starved out", hi: "भूखे मारे सूक्ष्मजीव", mr: "उपाशी मारलेले सूक्ष्मजीव" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort the ledger: A-Lactobacillus, B-malaria's plasmodium, C-Rhizobium. Which trio labels them rightly?",
          hi: "बही छाँटिए: अ-लैक्टोबैसिलस, ब-मलेरिया का प्लाज़्मोडियम, स-राइज़ोबियम। कौन-सी तिकड़ी सही ठप्पे लगाती है?",
          mr: "वही निवडा: अ-लॅक्टोबॅसिलस, ब-मलेरियाचा प्लास्मोडियम, क-रायझोबियम. कोणती त्रयी बरोबर शिक्के मारते?",
        },
        choices: [
          {
            en: "A: friend (curd) · B: foe (disease) · C: friend (soil nitrogen)",
            hi: "अ: मित्र (दही) · ब: शत्रु (रोग) · स: मित्र (मिट्टी की नाइट्रोजन)",
            mr: "अ: मित्र (दही) · ब: शत्रू (रोग) · क: मित्र (मातीचा नायट्रोजन)",
          },
          {
            en: "A: foe · B: friend · C: foe",
            hi: "अ: शत्रु · ब: मित्र · स: शत्रु",
            mr: "अ: शत्रू · ब: मित्र · क: शत्रू",
          },
          {
            en: "A: friend · B: friend · C: foe",
            hi: "अ: मित्र · ब: मित्र · स: शत्रु",
            mr: "अ: मित्र · ब: मित्र · क: शत्रू",
          },
          {
            en: "All three are foes to be eliminated",
            hi: "तीनों मिटाने लायक़ शत्रु हैं",
            mr: "तिघेही नष्ट करण्याजोगे शत्रू",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The same invisible world keeps both ledgers. Lactobacillus sets breakfast, Rhizobium manures the field, and plasmodium burns through the blood — friend and foe are roles, not species-wide verdicts. That is the chapter's whole title, earned one microbe at a time.",
          hi: "वही अदृश्य संसार दोनों बहियाँ रखता है। लैक्टोबैसिलस नाश्ता जमाता है, राइज़ोबियम खेत को खाद देता है, और प्लाज़्मोडियम ख़ून में आग लगाता है — मित्र और शत्रु भूमिकाएँ हैं, पूरी जाति पर फ़ैसले नहीं। यही अध्याय का पूरा शीर्षक है, एक-एक सूक्ष्मजीव से कमाया हुआ।",
          mr: "तेच अदृश्य जग दोन्ही वह्या ठेवते. लॅक्टोबॅसिलस न्याहारी लावतो, रायझोबियम शेताला खत देतो, आणि प्लास्मोडियम रक्तात आग लावतो — मित्र आणि शत्रू या भूमिका आहेत, अख्ख्या जातीवरचे निकाल नाहीत. हेच प्रकरणाचे सारे शीर्षक, एकेका सूक्ष्मजीवाने कमावलेले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A doctor refuses antibiotics for a common cold, saying they would be useless — and worse than useless. What backs both halves of the refusal?",
          hi: "डॉक्टर सामान्य ज़ुकाम के लिए प्रतिजैविक देने से इनकार करते हैं — बेकार, बल्कि बेकार से बदतर कहकर। इनकार के दोनों हिस्सों का आधार क्या है?",
          mr: "डॉक्टर साध्या सर्दीसाठी प्रतिजैविके द्यायला नकार देतात — निरुपयोगी, किंबहुना त्याहून वाईट म्हणत. नकाराच्या दोन्ही भागांचा आधार काय?",
        },
        choices: [
          {
            en: "Colds are viral and antibiotics only hit bacterial machinery — and every needless course trains the body's resident bacteria to resist the drug for the day it is truly needed",
            hi: "ज़ुकाम विषाणुजनित है और प्रतिजैविक केवल जीवाणु-मशीनरी पर वार करते हैं — और हर बेवजह कोर्स शरीर के निवासी जीवाणुओं को उस दिन के लिए प्रतिरोधी बना देता है जब दवा की सचमुच ज़रूरत होगी",
            mr: "सर्दी विषाणूजन्य आणि प्रतिजैविके फक्त जीवाणू-यंत्रणेवर घाव घालतात — आणि प्रत्येक विनाकारण कोर्स शरीरातल्या रहिवासी जीवाणूंना त्या दिवसासाठी प्रतिरोधक करतो जेव्हा औषधाची खरी गरज असेल",
          },
          {
            en: "Antibiotics are simply too costly for small illnesses",
            hi: "प्रतिजैविक छोटी बीमारियों के लिए बस बहुत महँगे हैं",
            mr: "प्रतिजैविके लहान आजारांसाठी नुसती फार महाग",
          },
          {
            en: "Colds cure themselves, so no medicine of any kind ever helps",
            hi: "ज़ुकाम अपने आप ठीक होता है, अतः कोई भी दवा कभी काम नहीं आती",
            mr: "सर्दी आपोआप बरी होते, म्हणून कोणतेही औषध कधीच उपयोगी नाही",
          },
          {
            en: "The refusal is over-caution with no science in it",
            hi: "इनकार बिना विज्ञान की अति-सावधानी है",
            mr: "नकार म्हणजे विज्ञान नसलेली अति-खबरदारी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Antibiotics jam machinery that only bacteria have — cell walls, bacterial ribosomes; a virus, a hijacker with almost no machinery of its own, offers nothing to jam. Meanwhile the drug DOES reach the billions of harmless bacteria in the patient, killing the susceptible and promoting the resistant. Uselessness plus training-the-enemy: the refusal is the science.",
          hi: "प्रतिजैविक वह मशीनरी जाम करते हैं जो केवल जीवाणुओं के पास है — कोशिका-दीवारें, जीवाणु-राइबोसोम; विषाणु, जो लगभग बिना मशीनरी का अपहरणकर्ता है, जाम करने को कुछ देता ही नहीं। इस बीच दवा मरीज़ के अरबों निरापद जीवाणुओं तक पहुँचती ज़रूर है — संवेदनशील मरते हैं, प्रतिरोधी पनपते हैं। निरर्थकता और दुश्मन की ट्रेनिंग: इनकार ही विज्ञान है।",
          mr: "प्रतिजैविके फक्त जीवाणूंकडे असलेली यंत्रणा जाम करतात — पेशीभित्ती, जीवाणू-रायबोसोम; विषाणू, जवळजवळ स्वतःची यंत्रणा नसलेला अपहरणकर्ता, जाम करायला काहीच देत नाही. दरम्यान औषध रुग्णाच्या अब्जावधी निरुपद्रवी जीवाणूंपर्यंत पोहोचतेच — संवेदनशील मरतात, प्रतिरोधक फोफावतात. निरुपयोग अधिक शत्रूची तालीम: नकार हेच विज्ञान.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Cell: Structure and Functions                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-cell",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 8 — Cell: Structure and Functions",
      hi: "अध्याय 8 — कोशिका: संरचना एवं कार्य",
      mr: "प्रकरण 8 — पेशी: रचना आणि कार्ये",
    },
    name: {
      en: "Cell: Structure and Functions",
      hi: "कोशिका: संरचना एवं कार्य",
      mr: "पेशी: रचना आणि कार्ये",
    },
    summary: {
      en: "Life's smallest unit toured room by room: the control room and its instructions, the choosy gate, the plant cell's armour and kitchens — and whole lives lived inside one single cell.",
      hi: "जीवन की सबसे छोटी इकाई की कमरा-दर-कमरा सैर: नियंत्रण-कक्ष और उसके निर्देश, चुनिंदा फाटक, पादप कोशिका का कवच और रसोइयाँ — और एक अकेली कोशिका के भीतर जिए गए पूरे जीवन।",
      mr: "जीवनाच्या सर्वांत लहान एककाची खोली-खोलीने सफर: नियंत्रण-कक्ष आणि त्याच्या सूचना, निवडक फाटक, वनस्पती-पेशीचे चिलखत आणि स्वयंपाकघरे — आणि एका एकट्या पेशीत जगलेली अख्खी आयुष्ये.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "cell",
        name: { en: "The cell", hi: "कोशिका", mr: "पेशी" },
        kind: "unit",
        prompt: {
          en: "What is the smallest unit of life, first seen by Hooke in a slice of cork?",
          hi: "जीवन की सबसे छोटी इकाई क्या है, जिसे हुक ने कॉर्क की फाँक में पहली बार देखा?",
          mr: "जीवनाचे सर्वांत लहान एकक काय, जे हूकने कॉर्कच्या चकतीत पहिल्यांदा पाहिले?",
        },
        statement: {
          en: "The cell is life's brick and workshop at once — every living thing is one cell or many, nothing living is less.",
          hi: "कोशिका एक साथ जीवन की ईंट और कार्यशाला है — हर जीव एक कोशिका है या अनेक, उससे कम कुछ भी जीवित नहीं।",
          mr: "पेशी एकाच वेळी जीवनाची वीट आणि कार्यशाळा — प्रत्येक सजीव एक पेशी वा अनेक, त्याहून कमी काहीही जिवंत नाही.",
        },
        detail: {
          en: "Hooke saw cork's empty little rooms in 1665 and named them 'cells' — monks' chambers, he thought.",
          hi: "हुक ने 1665 में कॉर्क के ख़ाली छोटे कमरे देखे और उन्हें 'सेल' नाम दिया — उन्हें वे साधुओं की कोठरियाँ लगीं।",
          mr: "हूकने 1665 मध्ये कॉर्कच्या रिकाम्या छोट्या खोल्या पाहिल्या आणि त्यांना 'सेल' नाव दिले — त्याला त्या भिक्षूंच्या कोठड्या वाटल्या.",
        },
        extra: {
          en: "A hen's egg is a single cell grown visible — the exception that teaches the rule.",
          hi: "मुर्गी का अंडा दिखने लायक़ बड़ी हुई एक ही कोशिका है — नियम सिखाने वाला अपवाद।",
          mr: "कोंबडीचे अंडे म्हणजे दिसण्याइतकी मोठी झालेली एकच पेशी — नियम शिकवणारा अपवाद.",
        },
        pair: {
          left: { en: "Life's smallest unit", hi: "जीवन की सबसे छोटी इकाई", mr: "जीवनाचे सर्वांत लहान एकक" },
          right: {
            en: "brick and workshop at once",
            hi: "एक साथ ईंट और कार्यशाला",
            mr: "एकाच वेळी वीट आणि कार्यशाळा",
          },
        },
      },
      {
        id: "nucleus",
        name: { en: "The nucleus", hi: "केंद्रक", mr: "केंद्रक" },
        kind: "organelle",
        prompt: {
          en: "Which control room of the cell holds the chromosomes and directs all its work?",
          hi: "कोशिका का कौन-सा नियंत्रण-कक्ष गुणसूत्र रखता है और उसका सारा काम चलाता है?",
          mr: "पेशीचा कोणता नियंत्रण-कक्ष गुणसूत्रे ठेवतो आणि तिचे सारे काम चालवतो?",
        },
        statement: {
          en: "The nucleus directs the cell — its chromosomes carry the instructions of inheritance, generation to generation.",
          hi: "केंद्रक कोशिका को चलाता है — उसके गुणसूत्र वंशानुक्रम के निर्देश पीढ़ी-दर-पीढ़ी ढोते हैं।",
          mr: "केंद्रक पेशीला चालवतो — त्याची गुणसूत्रे आनुवंशिकतेच्या सूचना पिढ्यानपिढ्या वाहतात.",
        },
        pair: {
          left: { en: "The control room", hi: "नियंत्रण-कक्ष", mr: "नियंत्रण-कक्ष" },
          right: {
            en: "instructions kept inside",
            hi: "भीतर रखे निर्देश",
            mr: "आत ठेवलेल्या सूचना",
          },
        },
      },
      {
        id: "cytoplasm",
        name: { en: "The cytoplasm", hi: "कोशिकाद्रव्य", mr: "पेशीद्रव्य" },
        kind: "organelle",
        prompt: {
          en: "Which jelly fills the cell between nucleus and membrane, with the organelles afloat in it?",
          hi: "केंद्रक और झिल्ली के बीच कौन-सी जेली कोशिका भरती है, जिसमें कोशिकांग तैरते हैं?",
          mr: "केंद्रक आणि पटलामध्ये कोणती जेली पेशी भरते, जिच्यात पेशीअंगके तरंगतात?",
        },
        statement: {
          en: "Cytoplasm is the cell's busy jelly — organelles float and work in it, and nothing in the cell stands on dry land.",
          hi: "कोशिकाद्रव्य कोशिका की व्यस्त जेली है — कोशिकांग उसी में तैरते-काम करते हैं, और कोशिका में कुछ भी सूखी ज़मीन पर नहीं खड़ा।",
          mr: "पेशीद्रव्य ही पेशीची गजबजलेली जेली — पेशीअंगके तिच्यातच तरंगतात-काम करतात, आणि पेशीत काहीही कोरड्या जमिनीवर उभे नाही.",
        },
        pair: {
          left: { en: "The busy jelly", hi: "व्यस्त जेली", mr: "गजबजलेली जेली" },
          right: { en: "organelles afloat", hi: "तैरते कोशिकांग", mr: "तरंगणारी अंगके" },
        },
      },
      {
        id: "membrane",
        name: { en: "The cell membrane", hi: "कोशिका झिल्ली", mr: "पेशीपटल" },
        kind: "organelle",
        prompt: {
          en: "Which thin boundary lets chosen substances in and out of every cell — and only the chosen?",
          hi: "कौन-सी पतली सीमा हर कोशिका में चुने हुए पदार्थ ही भीतर-बाहर आने देती है — और केवल चुने हुए?",
          mr: "कोणती पातळ सीमा प्रत्येक पेशीत निवडलेले पदार्थच आत-बाहेर येऊ देते — आणि फक्त निवडलेले?",
        },
        statement: {
          en: "The membrane is a choosy gatekeeper — food and oxygen in, wastes out, and the riff-raff refused at the door.",
          hi: "झिल्ली चुनिंदा दरबान है — भोजन और ऑक्सीजन भीतर, कचरा बाहर, और ऐरे-ग़ैरे दरवाज़े पर ही लौटा दिए गए।",
          mr: "पटल हा निवडक द्वारपाल — अन्न आणि ऑक्सिजन आत, कचरा बाहेर, आणि उपटसुंभ दारावरच परतवलेले.",
        },
        pair: {
          left: { en: "The choosy gate", hi: "चुनिंदा फाटक", mr: "निवडक फाटक" },
          right: { en: "in by permission", hi: "अनुमति से प्रवेश", mr: "परवानगीने प्रवेश" },
        },
      },
      {
        id: "cell-wall",
        name: { en: "The cell wall", hi: "कोशिका भित्ति", mr: "पेशीभित्तिका" },
        kind: "organelle",
        prompt: {
          en: "Which extra rigid layer, outside the membrane, stiffens plant cells — and is absent in animal cells?",
          hi: "झिल्ली के बाहर की कौन-सी अतिरिक्त कड़ी परत पादप कोशिकाओं को अकड़ाती है — और प्राणी कोशिकाओं में नदारद है?",
          mr: "पटलाबाहेरचा कोणता जादा कडक थर वनस्पती-पेशींना ताठ करतो — आणि प्राणी-पेशींत नसतो?",
        },
        statement: {
          en: "The cell wall is the plant cell's armour — rigidity for a body without bones, absent from every animal cell.",
          hi: "कोशिका भित्ति पादप कोशिका का कवच है — बिना हड्डियों के शरीर की अकड़, हर प्राणी कोशिका से नदारद।",
          mr: "पेशीभित्तिका हे वनस्पती-पेशीचे चिलखत — हाडांविनाच्या शरीराची ताठर, प्रत्येक प्राणी-पेशीत नसलेली.",
        },
        detail: {
          en: "It is why trees stand without skeletons and why vegetables crunch between the teeth.",
          hi: "इसीलिए पेड़ बिना कंकाल खड़े हैं और सब्ज़ियाँ दाँतों में कुरकुराती हैं।",
          mr: "म्हणूनच झाडे सांगाड्याविना उभी आहेत आणि भाज्या दातांत कुरकुरतात.",
        },
        extra: {
          en: "Animal cells stay wall-less and flexible — an animal of walled cells could never bend.",
          hi: "प्राणी कोशिकाएँ बिना भित्ति, लचीली रहती हैं — भित्ति वाली कोशिकाओं का प्राणी कभी झुक न पाता।",
          mr: "प्राणी-पेशी भित्तिकेविना, लवचीक राहतात — भित्तिका असलेल्या पेशींचा प्राणी कधी वाकू शकला नसता.",
        },
        pair: {
          left: { en: "The plant cell's armour", hi: "पादप कोशिका का कवच", mr: "वनस्पती-पेशीचे चिलखत" },
          right: {
            en: "stiffness without bones",
            hi: "बिना हड्डियों की अकड़",
            mr: "हाडांविनाची ताठर",
          },
        },
      },
      {
        id: "chloroplast",
        name: { en: "The chloroplast", hi: "हरितलवक", mr: "हरितलवक" },
        kind: "organelle",
        prompt: {
          en: "Which green organelle, home of chlorophyll, runs photosynthesis inside plant cells?",
          hi: "क्लोरोफ़िल का घर कौन-सा हरा कोशिकांग पादप कोशिकाओं के भीतर प्रकाश-संश्लेषण चलाता है?",
          mr: "हरितद्रव्याचे घर असलेले कोणते हिरवे अंगक वनस्पती-पेशींच्या आत प्रकाशसंश्लेषण चालवते?",
        },
        statement: {
          en: "Chloroplasts are the leaf's kitchens at cell scale — green with chlorophyll, and absent from every animal cell.",
          hi: "हरितलवक कोशिका-पैमाने पर पत्ती की रसोइयाँ हैं — क्लोरोफ़िल से हरे, और हर प्राणी कोशिका से नदारद।",
          mr: "हरितलवके ही पेशी-पातळीवरची पानाची स्वयंपाकघरे — हरितद्रव्याने हिरवी, आणि प्रत्येक प्राणी-पेशीत नसलेली.",
        },
        pair: {
          left: { en: "The cell-scale kitchen", hi: "कोशिका-पैमाने की रसोई", mr: "पेशी-पातळीचे स्वयंपाकघर" },
          right: {
            en: "green and food-making",
            hi: "हरी और भोजन बनाती",
            mr: "हिरवे आणि अन्न बनवणारे",
          },
        },
      },
      {
        id: "vacuole",
        name: { en: "The vacuole", hi: "रसधानी (रिक्तिका)", mr: "रिक्तिका" },
        kind: "organelle",
        prompt: {
          en: "Which storage sac — huge in plant cells, tiny in animal cells — holds sap and wastes?",
          hi: "कौन-सी भंडारण-थैली — पादप कोशिकाओं में विशाल, प्राणी कोशिकाओं में नन्ही — रस और कचरा रखती है?",
          mr: "कोणती साठवण-पिशवी — वनस्पती-पेशींत प्रचंड, प्राणी-पेशींत इवली — रस आणि कचरा ठेवते?",
        },
        statement: {
          en: "The vacuole is the cell's storeroom — in plants one giant sac can crowd everything else to the walls.",
          hi: "रसधानी कोशिका का भंडार-घर है — पौधों में एक विराट थैली बाक़ी सब कुछ दीवारों तक धकेल सकती है।",
          mr: "रिक्तिका हे पेशीचे कोठार — वनस्पतींत एक अवाढव्य पिशवी बाकी साऱ्यांना भिंतींकडे ढकलू शकते.",
        },
        pair: {
          left: { en: "The storeroom sac", hi: "भंडार-थैली", mr: "कोठार-पिशवी" },
          right: {
            en: "huge in plants, small in animals",
            hi: "पौधों में विशाल, प्राणियों में छोटी",
            mr: "वनस्पतींत प्रचंड, प्राण्यांत लहान",
          },
        },
      },
      {
        id: "unicellular",
        name: { en: "Unicellular organisms", hi: "एककोशिकीय जीव", mr: "एकपेशीय जीव" },
        kind: "class",
        prompt: {
          en: "Which organisms — amoeba, paramecium, bacteria — complete an entire life within one single cell?",
          hi: "कौन-से जीव — अमीबा, पैरामीशियम, जीवाणु — पूरा जीवन एक ही कोशिका के भीतर जी लेते हैं?",
          mr: "कोणते जीव — अमिबा, पॅरामेशियम, जीवाणू — अख्खे आयुष्य एकाच पेशीच्या आत जगतात?",
        },
        statement: {
          en: "Unicellular organisms do everything within one cell — eating, moving, multiplying: no organs, yet nothing left undone.",
          hi: "एककोशिकीय जीव सब कुछ एक कोशिका में करते हैं — खाना, चलना, बढ़ना: कोई अंग नहीं, फिर भी कुछ अधूरा नहीं।",
          mr: "एकपेशीय जीव सारे एका पेशीत करतात — खाणे, हलणे, वाढणे: अवयव नाहीत, तरी काहीही अपूर्ण नाही.",
        },
        detail: {
          en: "Under a school microscope, one drop of pond water is a zoo of them.",
          hi: "स्कूली सूक्ष्मदर्शी के नीचे तालाब की एक बूँद उनका चिड़ियाघर है।",
          mr: "शाळेच्या सूक्ष्मदर्शकाखाली तळ्याचा एक थेंब म्हणजे त्यांचे प्राणिसंग्रहालय.",
        },
        extra: {
          en: "Multicellular bodies chose the other road — labour divided into tissues and organs, each cell a specialist.",
          hi: "बहुकोशिकीय शरीरों ने दूसरी राह चुनी — ऊतकों और अंगों में बँटा श्रम, हर कोशिका विशेषज्ञ।",
          mr: "बहुपेशीय शरीरांनी दुसरी वाट निवडली — ऊती आणि अवयवांत वाटलेले श्रम, प्रत्येक पेशी तज्ज्ञ.",
        },
        pair: {
          left: {
            en: "A whole life in one cell",
            hi: "एक कोशिका में पूरा जीवन",
            mr: "एका पेशीत अख्खे आयुष्य",
          },
          right: { en: "nothing left undone", hi: "कुछ अधूरा नहीं", mr: "काहीही अपूर्ण नाही" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the organelle to its duty: A-nucleus, B-chloroplast, C-vacuole. Which trio is right?",
          hi: "कोशिकांग को उसके कर्तव्य से मिलाइए: अ-केंद्रक, ब-हरितलवक, स-रसधानी। कौन-सी तिकड़ी सही है?",
          mr: "अंगकाला त्याच्या कर्तव्याशी जुळवा: अ-केंद्रक, ब-हरितलवक, क-रिक्तिका. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: directing and inheritance · B: food-making · C: storage",
            hi: "अ: संचालन और वंशानुक्रम · ब: भोजन-निर्माण · स: भंडारण",
            mr: "अ: संचालन आणि आनुवंशिकता · ब: अन्न-निर्मिती · क: साठवण",
          },
          {
            en: "A: storage · B: directing · C: food-making",
            hi: "अ: भंडारण · ब: संचालन · स: भोजन-निर्माण",
            mr: "अ: साठवण · ब: संचालन · क: अन्न-निर्मिती",
          },
          {
            en: "A: food-making · B: storage · C: directing",
            hi: "अ: भोजन-निर्माण · ब: भंडारण · स: संचालन",
            mr: "अ: अन्न-निर्मिती · ब: साठवण · क: संचालन",
          },
          {
            en: "All three do the same job in different rooms",
            hi: "तीनों अलग कमरों में एक ही काम करते हैं",
            mr: "तिघेही वेगळ्या खोल्यांत एकच काम करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The cell is a workshop with signed doors: the nucleus holds the drawings and gives the orders, the chloroplast cooks, the vacuole warehouses. Swap the labels and the story stops making sense — an organelle IS its duty, seen small.",
          hi: "कोशिका दस्तख़त वाले दरवाज़ों की कार्यशाला है: केंद्रक नक़्शे रखता और आदेश देता है, हरितलवक पकाता है, रसधानी गोदाम सँभालती है। ठप्पे बदल दीजिए और कहानी बेमानी हो जाती है — कोशिकांग अपना कर्तव्य ही है, छोटा करके देखा हुआ।",
          mr: "पेशी ही सह्यांची दारे असलेली कार्यशाळा: केंद्रक आराखडे ठेवतो आणि हुकूम देतो, हरितलवक शिजवते, रिक्तिका गोदाम सांभाळते. शिक्के बदला आणि कथा निरर्थक होते — अंगक म्हणजे त्याचे कर्तव्यच, लहान करून पाहिलेले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Onion peel cells show sturdy cell walls but NO chloroplasts. If chloroplasts define plant cells, why has the onion bulb none?",
          hi: "प्याज़ की झिल्ली की कोशिकाओं में मज़बूत भित्तियाँ दिखती हैं पर हरितलवक नहीं। यदि हरितलवक पादप कोशिका की पहचान हैं, तो प्याज़ की गाँठ में क्यों नहीं?",
          mr: "कांद्याच्या सालीच्या पेशींत भक्कम भित्तिका दिसतात पण हरितलवके नाहीत. हरितलवके वनस्पती-पेशीची ओळख असतील, तर कांद्याच्या गड्ड्यात का नाहीत?",
        },
        choices: [
          {
            en: "The WALL defines the plant cell; chloroplasts appear only where light reaches — an underground bulb never sees the sun, so it keeps the armour and skips the kitchen",
            hi: "पहचान भित्ति है; हरितलवक वहीं बनते हैं जहाँ रोशनी पहुँचे — ज़मीन के नीचे की गाँठ कभी सूरज नहीं देखती, अतः कवच रखती है और रसोई छोड़ देती है",
            mr: "ओळख भित्तिका आहे; हरितलवके फक्त प्रकाश पोहोचेल तिथेच बनतात — जमिनीखालचा गड्डा कधी सूर्य पाहत नाही, म्हणून चिलखत ठेवतो आणि स्वयंपाकघर वगळतो",
          },
          {
            en: "Onions are secretly animals",
            hi: "प्याज़ गुप्त रूप से प्राणी हैं",
            mr: "कांदे गुप्तपणे प्राणी आहेत",
          },
          {
            en: "The chloroplasts dissolved during peeling",
            hi: "छीलते समय हरितलवक घुल गए",
            mr: "सोलताना हरितलवके विरघळली",
          },
          {
            en: "Only leaves are truly plant tissue",
            hi: "केवल पत्तियाँ ही सच्चा पादप ऊतक हैं",
            mr: "फक्त पानेच खरी वनस्पती-ऊती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Green is a job, not a birthmark. Every onion cell carries the wall — the true plant signature — but chloroplasts are kitchens, built only where there is light to cook with. The bulb lives in the dark as a storehouse, fed by the green leaves above. One organism, different rooms furnished for different work: the microscope's first lesson in division of labour.",
          hi: "हरापन काम है, जन्म-चिह्न नहीं। प्याज़ की हर कोशिका में भित्ति है — असली पादप-दस्तख़त — पर हरितलवक रसोइयाँ हैं, वहीं बनतीं जहाँ पकाने को रोशनी हो। गाँठ अँधेरे में भंडार बनकर जीती है, ऊपर की हरी पत्तियों से पली हुई। एक जीव, अलग-अलग काम के लिए सजे अलग-अलग कमरे: श्रम-विभाजन में सूक्ष्मदर्शी का पहला पाठ।",
          mr: "हिरवेपणा हे काम आहे, जन्मखूण नाही. कांद्याच्या प्रत्येक पेशीत भित्तिका आहे — खरी वनस्पती-सही — पण हरितलवके स्वयंपाकघरे आहेत, शिजवायला प्रकाश असेल तिथेच बांधलेली. गड्डा अंधारात कोठार होऊन जगतो, वरच्या हिरव्या पानांनी पोसलेला. एक जीव, वेगवेगळ्या कामांसाठी सजवलेल्या वेगवेगळ्या खोल्या: श्रमविभागणीतला सूक्ष्मदर्शकाचा पहिला धडा.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Materials: Metals and Non-Metals                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-metals-non-metals",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 4 — Materials: Metals and Non-Metals",
      hi: "अध्याय 4 — पदार्थ: धातु और अधातु",
      mr: "प्रकरण 4 — पदार्थ: धातू आणि अधातू",
    },
    name: {
      en: "Materials: Metals and Non-Metals",
      hi: "पदार्थ: धातु और अधातु",
      mr: "पदार्थ: धातू आणि अधातू",
    },
    summary: {
      en: "Two tribes of matter: the shining, ringing conductors and the dull, brittle insulators — with oxides basic and acidic, a pecking order that evicts weaker metals, and graphite keeping the rules honest by breaking one.",
      hi: "पदार्थ के दो कुनबे: चमकते, बजते चालक और फीके, भुरभुरे कुचालक — क्षारकीय और अम्लीय ऑक्साइड, कमज़ोर धातुओं को बेदख़ल करता वरीयता-क्रम, और एक नियम तोड़कर सबको ईमानदार रखता ग्रेफ़ाइट।",
      mr: "पदार्थाच्या दोन जमाती: चमकणारे, वाजणारे वाहक आणि निस्तेज, ठिसूळ रोधक — आम्लारीय आणि आम्लीय ऑक्साइड, दुबळ्या धातूंना हुसकावणारा वरचष्मा-क्रम, आणि एक नियम मोडून साऱ्यांना प्रामाणिक ठेवणारे ग्रॅफाइट.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "metals",
        name: { en: "Metals", hi: "धातुएँ", mr: "धातू" },
        kind: "class",
        prompt: {
          en: "Which class of materials shines when polished, rings when struck, and lets heat and current pass through?",
          hi: "पदार्थों का कौन-सा वर्ग रगड़ने पर चमकता है, ठोकने पर बजता है, और ऊष्मा-धारा को गुज़रने देता है?",
          mr: "पदार्थांचा कोणता वर्ग घासल्यावर चमकतो, ठोकल्यावर वाजतो, आणि उष्णता-धारेला जाऊ देतो?",
        },
        statement: {
          en: "Metals are lustrous, sonorous, malleable and conducting — iron, copper and aluminium head the roll.",
          hi: "धातुएँ चमकीली, ध्वानिक, आघातवर्ध्य और चालक हैं — लोहा, ताँबा और अल्युमिनियम सूची के सिरे पर।",
          mr: "धातू चकचकीत, नादमय, ठोकून वाढणाऱ्या आणि वाहक — लोखंड, तांबे आणि अ‍ॅल्युमिनियम यादीच्या शिरोभागी.",
        },
        detail: {
          en: "Beaten into sheets, drawn into wires — they deform without shattering, which non-metals cannot forgive.",
          hi: "चादरों में पीटी, तारों में खींची जाती हैं — टूटे बिना ढलती हैं, जो अधातुओं से नहीं होता।",
          mr: "पत्र्यांत ठोकल्या, तारांत ओढल्या जातात — न फुटता वळतात, जे अधातूंना जमत नाही.",
        },
        extra: {
          en: "Sonority is why temple bells and school bells are metal — a struck non-metal just thuds.",
          hi: "ध्वानिकता ही कारण है कि मंदिर और स्कूल की घंटियाँ धातु की हैं — ठोकी गई अधातु बस धप्प करती है।",
          mr: "नादमयतेमुळेच देवळाच्या आणि शाळेच्या घंटा धातूच्या — ठोकलेली अधातू नुसती धप्प वाजते.",
        },
        pair: {
          left: {
            en: "The shining, ringing tribe",
            hi: "चमकता, बजता कुनबा",
            mr: "चमकणारी, वाजणारी जमात",
          },
          right: {
            en: "heat and current let through",
            hi: "गुज़रने दी गई ऊष्मा-धारा",
            mr: "जाऊ दिलेली उष्णता-धारा",
          },
        },
      },
      {
        id: "non-metals",
        name: { en: "Non-metals", hi: "अधातुएँ", mr: "अधातू" },
        kind: "class",
        prompt: {
          en: "Which class of materials — sulphur, carbon, oxygen among them — is dull, brittle and a poor conductor?",
          hi: "पदार्थों का कौन-सा वर्ग — गंधक, कार्बन, ऑक्सीजन जिनमें हैं — फीका, भुरभुरा और कुचालक है?",
          mr: "पदार्थांचा कोणता वर्ग — गंधक, कार्बन, ऑक्सिजन ज्यांत आहेत — निस्तेज, ठिसूळ आणि दुर्वाहक आहे?",
        },
        statement: {
          en: "Non-metals are dull and brittle, insulating rather than conducting — sulphur crumbles where copper would bend.",
          hi: "अधातुएँ फीकी और भुरभुरी हैं, चालक नहीं कुचालक — जहाँ ताँबा मुड़ता, वहाँ गंधक चूर हो जाता है।",
          mr: "अधातू निस्तेज आणि ठिसूळ, वाहक नव्हे रोधक — जिथे तांबे वाकले असते, तिथे गंधक चुरा होतो.",
        },
        pair: {
          left: {
            en: "The dull, brittle tribe",
            hi: "फीका, भुरभुरा कुनबा",
            mr: "निस्तेज, ठिसूळ जमात",
          },
          right: { en: "current refused", hi: "लौटाई गई धारा", mr: "परतवलेली धारा" },
        },
      },
      {
        id: "malleability",
        name: { en: "Malleability", hi: "आघातवर्ध्यता", mr: "ठोकवर्धनीयता (वर्धनीयता)" },
        kind: "property",
        prompt: {
          en: "Which property lets metals be beaten into sheets — silver into a foil thin as breath?",
          hi: "कौन-सा गुण धातुओं को चादरों में पीटने देता है — चाँदी को साँस-सी पतली पन्नी में?",
          mr: "कोणता गुणधर्म धातूंना पत्र्यांत ठोकू देतो — चांदीला श्वासाइतक्या पातळ वर्खात?",
        },
        statement: {
          en: "Malleability is the sheet-making property — gold and silver beaten to the leaf that decorates sweets.",
          hi: "आघातवर्ध्यता चादर बनाने का गुण है — सोना-चाँदी पीटकर वह वरक़ बनते हैं जो मिठाई सजाता है।",
          mr: "ठोकवर्धनीयता हा पत्रा बनवण्याचा गुणधर्म — सोने-चांदी ठोकून तो वर्ख होतो जो मिठाई सजवतो.",
        },
        pair: {
          left: { en: "Beaten into sheets", hi: "चादरों में पिटाई", mr: "पत्र्यांत ठोकलेले" },
          right: {
            en: "foil thin as breath",
            hi: "साँस-सी पतली पन्नी",
            mr: "श्वासाइतका पातळ वर्ख",
          },
        },
      },
      {
        id: "ductility",
        name: { en: "Ductility", hi: "तन्यता", mr: "तन्यता" },
        kind: "property",
        prompt: {
          en: "Which property lets metals be drawn into wires — one gram of gold into a two-kilometre thread?",
          hi: "कौन-सा गुण धातुओं को तारों में खींचने देता है — एक ग्राम सोने को दो किलोमीटर के धागे में?",
          mr: "कोणता गुणधर्म धातूंना तारांत ओढू देतो — एका ग्रॅम सोन्याला दोन किलोमीटरच्या धाग्यात?",
        },
        statement: {
          en: "Ductility draws metals into wires — copper's whole career hangs on it, from house wiring to the grid.",
          hi: "तन्यता धातुओं को तारों में खींचती है — घर की वायरिंग से ग्रिड तक, ताँबे का पूरा करियर इसी पर टिका है।",
          mr: "तन्यता धातूंना तारांत ओढते — घरच्या वायरिंगपासून ग्रिडपर्यंत, तांब्याची सारी कारकीर्द हिच्यावर उभी.",
        },
        pair: {
          left: { en: "Drawn into wire", hi: "तार में खिंचाई", mr: "तारेत ओढलेले" },
          right: { en: "a career in cables", hi: "केबलों में करियर", mr: "केबलांतली कारकीर्द" },
        },
      },
      {
        id: "metal-oxides",
        name: { en: "Metal oxides", hi: "धातु ऑक्साइड", mr: "धातू ऑक्साइड" },
        kind: "reaction",
        prompt: {
          en: "Metals burnt or weathered in air form which compounds — generally BASIC in nature?",
          hi: "हवा में जली या घिसी धातुएँ कौन-से यौगिक बनाती हैं — प्रायः क्षारकीय स्वभाव के?",
          mr: "हवेत जळलेल्या वा झिजलेल्या धातू कोणती संयुगे बनवतात — बहुधा आम्लारीय स्वभावाची?",
        },
        statement: {
          en: "Metals joining oxygen make metal oxides — mostly basic, turning red litmus blue when dissolved in water.",
          hi: "ऑक्सीजन से जुड़ी धातुएँ धातु ऑक्साइड बनाती हैं — प्रायः क्षारकीय, पानी में घुलकर लाल लिटमस को नीला करते हुए।",
          mr: "ऑक्सिजनशी जुळलेल्या धातू धातू ऑक्साइड बनवतात — बहुधा आम्लारीय, पाण्यात विरघळून लाल लिटमसला निळे करणारे.",
        },
        detail: {
          en: "Rub a burnt strip's white ash into water and test: red litmus turns blue — base by birth.",
          hi: "जली पट्टी की सफ़ेद राख पानी में घोलकर जाँचिए: लाल लिटमस नीला — जन्म से क्षारक।",
          mr: "जळलेल्या पट्टीची पांढरी राख पाण्यात घोळून तपासा: लाल लिटमस निळे — जन्मानेच आम्लारी.",
        },
        extra: {
          en: "Non-metal oxides run the other way — sulphur's fumes in water make an acid that reddens blue litmus.",
          hi: "अधातु ऑक्साइड उल्टा चलते हैं — गंधक का धुआँ पानी में अम्ल बनकर नीला लिटमस लाल करता है।",
          mr: "अधातू ऑक्साइड उलटे चालतात — गंधकाचा धूर पाण्यात आम्ल होऊन निळे लिटमस लाल करतो.",
        },
        pair: {
          left: { en: "Metal met by oxygen", hi: "ऑक्सीजन से मिली धातु", mr: "ऑक्सिजनला भेटलेली धातू" },
          right: {
            en: "an oxide, basic by birth",
            hi: "जन्म से क्षारकीय ऑक्साइड",
            mr: "जन्माने आम्लारीय ऑक्साइड",
          },
        },
      },
      {
        id: "displacement",
        name: {
          en: "The displacement reaction",
          hi: "विस्थापन अभिक्रिया",
          mr: "विस्थापन अभिक्रिया",
        },
        kind: "reaction",
        prompt: {
          en: "Dip an iron nail in blue copper sulphate: the blue fades and copper coats the nail. Which reaction just ran?",
          hi: "नीले तूतिये के घोल में लोहे की कील डुबोइए: नीलापन फीका पड़ता है और कील पर ताँबा चढ़ जाता है। कौन-सी अभिक्रिया चली?",
          mr: "निळ्या मोरचुदाच्या द्रावणात लोखंडी खिळा बुडवा: निळेपणा फिका पडतो आणि खिळ्यावर तांबे चढते. कोणती अभिक्रिया चालली?",
        },
        statement: {
          en: "In displacement a stronger metal evicts a weaker one from its compound — iron turns copper out of its own sulphate.",
          hi: "विस्थापन में प्रबल धातु दुर्बल को उसके यौगिक से बेदख़ल करती है — लोहा ताँबे को उसके ही सल्फ़ेट से निकाल देता है।",
          mr: "विस्थापनात बलवान धातू दुबळीला तिच्या संयुगातून हुसकावते — लोखंड तांब्याला त्याच्याच सल्फेटमधून काढते.",
        },
        detail: {
          en: "The blue fades as copper leaves the solution; the nail browns as copper settles on it — colour writes the receipt.",
          hi: "ताँबे के घोल छोड़ते ही नीलापन उतरता है; कील पर बैठते ही वह भूरी होती है — रंग ही रसीद लिखता है।",
          mr: "तांबे द्रावण सोडताच निळेपणा उतरतो; खिळ्यावर बसताच तो तपकिरी होतो — रंगच पावती लिहितो.",
        },
        extra: {
          en: "The reverse never runs — copper cannot push iron out. The pecking order of metals is fixed.",
          hi: "उलटा कभी नहीं चलता — ताँबा लोहे को नहीं धकेल सकता। धातुओं का वरीयता-क्रम अटल है।",
          mr: "उलटे कधीच चालत नाही — तांबे लोखंडाला ढकलू शकत नाही. धातूंचा वरचष्मा-क्रम पक्का आहे.",
        },
        pair: {
          left: { en: "The fading blue", hi: "फीका पड़ता नीलापन", mr: "फिका पडणारा निळेपणा" },
          right: {
            en: "a weaker metal evicted",
            hi: "बेदख़ल हुई दुर्बल धातु",
            mr: "हुसकावलेली दुबळी धातू",
          },
        },
      },
      {
        id: "graphite",
        name: { en: "Graphite, the exception", hi: "अपवाद ग्रेफ़ाइट", mr: "अपवाद ग्रॅफाइट" },
        kind: "exception",
        prompt: {
          en: "Which non-metal, a form of carbon, conducts electricity so well it sits inside every dry cell and pencil?",
          hi: "कार्बन का एक रूप, कौन-सी अधातु बिजली इतनी अच्छी चलाती है कि हर सूखे सेल और पेंसिल में बैठी है?",
          mr: "कार्बनचे एक रूप, कोणती अधातू वीज इतकी चांगली वाहते की प्रत्येक शुष्क घटात आणि पेन्सिलीत बसली आहे?",
        },
        statement: {
          en: "Graphite is the great exception — a non-metal that conducts current, keeping the rules honest by breaking one.",
          hi: "ग्रेफ़ाइट बड़ा अपवाद है — धारा चलाती अधातु, जो एक नियम तोड़कर बाक़ियों को ईमानदार रखती है।",
          mr: "ग्रॅफाइट हा मोठा अपवाद — धारा वाहणारी अधातू, जी एक नियम मोडून बाकीच्यांना प्रामाणिक ठेवते.",
        },
        pair: {
          left: {
            en: "The conducting non-metal",
            hi: "चालक अधातु",
            mr: "वाहक अधातू",
          },
          right: { en: "an exception on duty", hi: "ड्यूटी पर अपवाद", mr: "कामावरचा अपवाद" },
        },
      },
      {
        id: "noble-calm",
        name: {
          en: "Gold and silver's calm",
          hi: "सोने-चाँदी की शांति",
          mr: "सोन्या-चांदीची शांतता",
        },
        kind: "property",
        prompt: {
          en: "Which metals resist air and water so stubbornly that they serve as ornament for centuries?",
          hi: "कौन-सी धातुएँ हवा-पानी का इतनी ज़िद से प्रतिरोध करती हैं कि सदियों गहना बनकर चलती हैं?",
          mr: "कोणत्या धातू हवा-पाण्याला इतक्या हट्टाने विरोध करतात की शतके दागिना म्हणून चालतात?",
        },
        statement: {
          en: "Gold and silver barely react — their calm is why grandmother's bangles outlive generations while iron gates flake.",
          hi: "सोना-चाँदी मुश्किल से अभिक्रिया करते हैं — उनकी शांति ही कारण है कि दादी की चूड़ियाँ पीढ़ियाँ जीती हैं जबकि लोहे के फाटक झड़ते हैं।",
          mr: "सोने-चांदी जेमतेम अभिक्रिया करतात — त्यांच्या शांततेमुळेच आजीच्या बांगड्या पिढ्या जगतात तर लोखंडी फाटके झडतात.",
        },
        pair: {
          left: {
            en: "The unreacting ornaments",
            hi: "अभिक्रिया न करते गहने",
            mr: "अभिक्रिया न करणारे दागिने",
          },
          right: { en: "calm across centuries", hi: "सदियों की शांति", mr: "शतकांची शांतता" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the property to the product it makes possible: A-malleability, B-ductility, C-sonority. Which trio is right?",
          hi: "गुण को उस उत्पाद से मिलाइए जिसे वह संभव करता है: अ-आघातवर्ध्यता, ब-तन्यता, स-ध्वानिकता। कौन-सी तिकड़ी सही है?",
          mr: "गुणधर्माला तो शक्य करत असलेल्या उत्पादनाशी जुळवा: अ-ठोकवर्धनीयता, ब-तन्यता, क-नादमयता. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: silver foil · B: copper wire · C: the school bell",
            hi: "अ: चाँदी का वरक़ · ब: ताँबे का तार · स: स्कूल की घंटी",
            mr: "अ: चांदीचा वर्ख · ब: तांब्याची तार · क: शाळेची घंटा",
          },
          {
            en: "A: copper wire · B: the school bell · C: silver foil",
            hi: "अ: ताँबे का तार · ब: स्कूल की घंटी · स: चाँदी का वरक़",
            mr: "अ: तांब्याची तार · ब: शाळेची घंटा · क: चांदीचा वर्ख",
          },
          {
            en: "A: the school bell · B: silver foil · C: copper wire",
            hi: "अ: स्कूल की घंटी · ब: चाँदी का वरक़ · स: ताँबे का तार",
            mr: "अ: शाळेची घंटा · ब: चांदीचा वर्ख · क: तांब्याची तार",
          },
          {
            en: "All three products use the same single property",
            hi: "तीनों उत्पाद एक ही अकेले गुण से बनते हैं",
            mr: "तिन्ही उत्पादने एकाच गुणधर्माने बनतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each artefact is one property made visible: beating gives the foil, drawing gives the wire, ringing gives the bell. Reverse any pairing and the factory fails — you cannot beat a wire out of silver or ring a sheet. Products are properties wearing shapes.",
          hi: "हर वस्तु एक गुण का दिखता रूप है: पिटाई से वरक़, खिंचाई से तार, बजने से घंटी। कोई जोड़ी पलटिए और कारख़ाना ठप — चाँदी से तार पीटा नहीं जाता, न चादर बजाई जाती है। उत्पाद आकार पहने गुण ही हैं।",
          mr: "प्रत्येक वस्तू म्हणजे एक गुणधर्म दिसू लागलेला: ठोकण्याने वर्ख, ओढण्याने तार, वाजण्याने घंटा. कोणतीही जोडी उलटवा आणि कारखाना बंद — चांदीतून तार ठोकता येत नाही, ना पत्रा वाजवता येतो. उत्पादने म्हणजे आकार घातलेले गुणधर्मच.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A frying pan is metal but its handle is plastic or wood — one object built from BOTH tribes. What is the design saying?",
          hi: "कड़ाही धातु की है पर उसकी मूठ प्लास्टिक या लकड़ी की — एक वस्तु, दोनों कुनबों से बनी। यह बनावट क्या कह रही है?",
          mr: "तवा धातूचा पण त्याची मूठ प्लास्टिक वा लाकडाची — एक वस्तू, दोन्ही जमातींतून बांधलेली. ही रचना काय सांगते आहे?",
        },
        choices: [
          {
            en: "Each side of the pan has a different job: the flame side must CONDUCT heat into the food, the hand side must REFUSE it — so each job hires the tribe with the right property",
            hi: "कड़ाही के दो पक्षों के दो काम हैं: आँच वाले पक्ष को ऊष्मा भोजन तक पहुँचानी है, हाथ वाले को उसे रोकना है — अतः हर काम सही गुण वाले कुनबे को नौकरी देता है",
            mr: "तव्याच्या दोन बाजूंची दोन कामे: ज्योतीच्या बाजूने उष्णता अन्नापर्यंत न्यायची, हाताच्या बाजूने ती नाकारायची — म्हणून प्रत्येक काम योग्य गुणधर्माच्या जमातीला कामावर घेते",
          },
          {
            en: "Plastic handles are only for decoration",
            hi: "प्लास्टिक की मूठें केवल सजावट के लिए हैं",
            mr: "प्लास्टिकच्या मुठी फक्त सजावटीसाठी",
          },
          {
            en: "Metal was too costly to use for the whole pan",
            hi: "पूरी कड़ाही के लिए धातु बहुत महँगी थी",
            mr: "अख्ख्या तव्यासाठी धातू फार महाग होती",
          },
          {
            en: "Wood conducts heat better than steel",
            hi: "लकड़ी स्टील से बेहतर ऊष्मा चलाती है",
            mr: "लाकूड स्टीलहून चांगली उष्णता वाहते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The pan is a two-line job advertisement answered by two tribes. Conduction — the metal's gift — carries the flame's heat into the dal; the same gift at the handle would carry it into your palm, so there the insulating tribe is hired instead. Good design never asks which material is 'better'; it asks better AT WHAT — and the humble kadhai answers the question twice.",
          hi: "कड़ाही दो पंक्तियों का रोज़गार-विज्ञापन है जिसे दो कुनबों ने भरा। चालन — धातु की देन — आँच की ऊष्मा दाल तक ले जाता है; वही देन मूठ पर होती तो हथेली तक ले जाती, अतः वहाँ कुचालक कुनबे को नौकरी मिली। अच्छी बनावट कभी नहीं पूछती कौन-सा पदार्थ 'बेहतर' है; पूछती है किस काम में बेहतर — और मामूली कड़ाही इस सवाल का जवाब दो बार देती है।",
          mr: "तवा म्हणजे दोन ओळींची नोकरी-जाहिरात जिला दोन जमातींनी उत्तर दिले. वहन — धातूची देणगी — ज्योतीची उष्णता आमटीपर्यंत नेते; तीच देणगी मुठीवर असती तर तळहातापर्यंत नेली असती, म्हणून तिथे रोधक जमातीला काम मिळाले. चांगली रचना कधी विचारत नाही कोणता पदार्थ 'चांगला'; विचारते कशात चांगला — आणि साधा तवा या प्रश्नाचे उत्तर दोनदा देतो.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Coal and Petroleum (the buried treasury)                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-coal-petroleum",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 5 — Coal and Petroleum",
      hi: "अध्याय 5 — कोयला और पेट्रोलियम",
      mr: "प्रकरण 5 — कोळसा आणि पेट्रोलियम",
    },
    name: { en: "Coal and Petroleum", hi: "कोयला और पेट्रोलियम", mr: "कोळसा आणि पेट्रोलियम" },
    summary: {
      en: "The buried treasury: forests pressed to coal, plankton to crude, one barrel refined into a shelf of fuels — spent in decades what took aeons, with conservation as the only deposit slip.",
      hi: "गड़ा ख़ज़ाना: कोयला बने जंगल, कच्चा तेल बना प्लवक, एक बैरल से निकली ईंधनों की पूरी ताक़ — युगों की कमाई दशकों में ख़र्च, और बचत ही इकलौती जमा-पर्ची।",
      mr: "पुरलेला खजिना: कोळसा झालेली जंगले, कच्चे तेल झालेले प्लवंग, एका पिंपातून निघालेले इंधनांचे अख्खे फडताळ — युगांची कमाई दशकांत खर्च, आणि बचत हीच एकमेव भरणा-पावती.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "fossil-fuels",
        name: { en: "Fossil fuels", hi: "जीवाश्म ईंधन", mr: "जीवाश्म इंधने" },
        kind: "class",
        prompt: {
          en: "Coal, petroleum and natural gas — buried life pressed for ages into fuel. What are they together called?",
          hi: "कोयला, पेट्रोलियम और प्राकृतिक गैस — युगों दबा जीवन जो ईंधन बन गया। इन्हें मिलाकर क्या कहते हैं?",
          mr: "कोळसा, पेट्रोलियम आणि नैसर्गिक वायू — युगानुयुगे दबलेले जीवन जे इंधन झाले. यांना मिळून काय म्हणतात?",
        },
        statement: {
          en: "Fossil fuels are ancient life turned fuel — coal from drowned forests, petroleum from sea life, aeons in the pressing.",
          hi: "जीवाश्म ईंधन प्राचीन जीवन का बना ईंधन है — डूबे जंगलों से कोयला, समुद्री जीवन से पेट्रोलियम, दबाव में बीते युग।",
          mr: "जीवाश्म इंधने म्हणजे प्राचीन जीवनाचे झालेले इंधन — बुडालेल्या जंगलांतून कोळसा, सागरी जीवनातून पेट्रोलियम, दाबात गेलेली युगे.",
        },
        detail: {
          en: "They are exhaustible — what took crores of years to form burns away in decades of use.",
          hi: "वे समाप्य हैं — जिन्हें बनने में करोड़ों वर्ष लगे, वे उपयोग के दशकों में जल जाते हैं।",
          mr: "ती संपणारी आहेत — ज्यांना बनायला कोट्यवधी वर्षे लागली, ती वापराच्या दशकांत जळून जातात.",
        },
        extra: {
          en: "No factory can make them to order — every litre burnt is a withdrawal with no deposit behind it.",
          hi: "कोई कारख़ाना उन्हें फ़रमाइश पर नहीं बना सकता — जला हर लीटर बिना जमा की निकासी है।",
          mr: "कोणताही कारखाना ती मागणीवर बनवू शकत नाही — जळालेला प्रत्येक लिटर म्हणजे भरण्याविनाची उचल.",
        },
        pair: {
          left: { en: "Buried life as fuel", hi: "ईंधन बना गड़ा जीवन", mr: "इंधन झालेले पुरलेले जीवन" },
          right: {
            en: "aeons pressed to ash",
            hi: "राख तक दबे युग",
            mr: "राखेपर्यंत दबलेली युगे",
          },
        },
      },
      {
        id: "coal",
        name: { en: "Coal", hi: "कोयला", mr: "कोळसा" },
        kind: "fuel",
        prompt: {
          en: "Which black fuel, dug from seams of buried forests, fires thermal power plants?",
          hi: "गड़े जंगलों की परतों से खोदा कौन-सा काला ईंधन ताप-बिजलीघर चलाता है?",
          mr: "पुरलेल्या जंगलांच्या थरांतून खणलेले कोणते काळे इंधन औष्णिक वीजकेंद्रे चालवते?",
        },
        statement: {
          en: "Coal is carbonised forest — dug from seams, burnt for power: the steam age's food, still on the menu.",
          hi: "कोयला कार्बन बना जंगल है — परतों से खोदा, बिजली के लिए जला: भाप-युग का भोजन, अब भी मेनू पर।",
          mr: "कोळसा म्हणजे कार्बन झालेले जंगल — थरांतून खणलेला, विजेसाठी जळलेला: वाफयुगाचे अन्न, अजूनही मेनूवर.",
        },
        detail: {
          en: "Carbonisation made it: heat and pressure slowly turning dead vegetation into carbon.",
          hi: "उसे कार्बनीकरण ने बनाया: ताप और दाब ने मृत वनस्पति को धीरे-धीरे कार्बन में बदला।",
          mr: "त्याला कार्बनीकरणाने घडवले: ताप आणि दाबाने मृत वनस्पतींना हळूहळू कार्बनमध्ये बदलले.",
        },
        extra: {
          en: "Processing it yields coke, coal tar and coal gas — three workers walking out of one mine.",
          hi: "उसके प्रसंस्करण से कोक, कोलतार और कोयला-गैस मिलते हैं — एक खदान से निकले तीन कारीगर।",
          mr: "त्याच्या प्रक्रियेतून कोक, डांबर आणि कोल-गॅस मिळतात — एका खाणीतून निघालेले तीन कारागीर.",
        },
        pair: {
          left: { en: "The buried forest", hi: "गड़ा हुआ जंगल", mr: "पुरलेले जंगल" },
          right: { en: "power stations fed", hi: "पले हुए बिजलीघर", mr: "पोसलेली वीजकेंद्रे" },
        },
      },
      {
        id: "petroleum",
        name: { en: "Petroleum", hi: "पेट्रोलियम", mr: "पेट्रोलियम" },
        kind: "fuel",
        prompt: {
          en: "Which dark liquid, drilled from between rock layers, refines into petrol, diesel, LPG and more?",
          hi: "चट्टानी परतों के बीच से निकाला कौन-सा गहरा द्रव पेट्रोल, डीज़ल, एलपीजी वग़ैरह में परिष्कृत होता है?",
          mr: "खडकांच्या थरांमधून काढलेला कोणता गडद द्रव पेट्रोल, डिझेल, एलपीजी वगैरेंत शुद्ध होतो?",
        },
        statement: {
          en: "Petroleum is the sea's buried plankton — one crude liquid refined into a whole shelf of fuels and materials.",
          hi: "पेट्रोलियम समुद्र का गड़ा प्लवक है — एक कच्चा द्रव, जो ईंधनों-पदार्थों की पूरी ताक़ में परिष्कृत होता है।",
          mr: "पेट्रोलियम म्हणजे समुद्राचे पुरलेले प्लवंग — एक कच्चा द्रव, जो इंधने-पदार्थांच्या अख्ख्या फडताळात शुद्ध होतो.",
        },
        pair: {
          left: {
            en: "The drilled dark liquid",
            hi: "निकाला गया गहरा द्रव",
            mr: "काढलेला गडद द्रव",
          },
          right: {
            en: "a shelf of fuels from one barrel",
            hi: "एक बैरल से ईंधनों की ताक़",
            mr: "एका पिंपातून इंधनांचे फडताळ",
          },
        },
      },
      {
        id: "refining",
        name: { en: "Refining", hi: "परिष्करण (शोधन)", mr: "शुद्धीकरण" },
        kind: "process",
        prompt: {
          en: "In a tall tower, crude oil's parts separate by their boiling points. What is this separation called?",
          hi: "ऊँची मीनार में कच्चे तेल के हिस्से अपने क्वथनांकों से अलग होते हैं। इस पृथक्करण का नाम क्या है?",
          mr: "उंच मनोऱ्यात कच्च्या तेलाचे भाग आपल्या उत्कलनांकांनी वेगळे होतात. या विलगीकरणाचे नाव काय?",
        },
        statement: {
          en: "Refining fractions the crude — each height of the tower draws off its own product, petrol high, bitumen at the base.",
          hi: "परिष्करण कच्चे तेल के प्रभाग करता है — मीनार की हर ऊँचाई अपना उत्पाद खींचती है, पेट्रोल ऊपर, बिटुमेन तल पर।",
          mr: "शुद्धीकरण कच्च्या तेलाचे विभाग करते — मनोऱ्याची प्रत्येक उंची आपले उत्पादन ओढते, पेट्रोल वर, डांबर तळाशी.",
        },
        detail: {
          en: "The principle is boiling point — the lightest vapours climb highest before condensing back to liquid.",
          hi: "सिद्धांत है क्वथनांक — सबसे हल्की वाष्पें द्रव में लौटने से पहले सबसे ऊँचा चढ़ती हैं।",
          mr: "तत्त्व आहे उत्कलनांक — सर्वांत हलक्या वाफा द्रवात परतण्याआधी सर्वांत उंच चढतात.",
        },
        extra: {
          en: "One barrel walks out as LPG, petrol, diesel, kerosene, wax and road tar — a family separated by temperature.",
          hi: "एक बैरल एलपीजी, पेट्रोल, डीज़ल, मिट्टी का तेल, मोम और सड़क-तार बनकर निकलता है — तापमान से बँटा परिवार।",
          mr: "एक पिंप एलपीजी, पेट्रोल, डिझेल, रॉकेल, मेण आणि रस्ता-डांबर होऊन निघते — तापमानाने वाटलेले कुटुंब.",
        },
        pair: {
          left: {
            en: "The tall tower's floors",
            hi: "ऊँची मीनार की मंज़िलें",
            mr: "उंच मनोऱ्याचे मजले",
          },
          right: {
            en: "products drawn by height",
            hi: "ऊँचाई से खिंचे उत्पाद",
            mr: "उंचीने ओढलेली उत्पादने",
          },
        },
      },
      {
        id: "natural-gas",
        name: { en: "Natural gas (CNG)", hi: "प्राकृतिक गैस (सीएनजी)", mr: "नैसर्गिक वायू (सीएनजी)" },
        kind: "fuel",
        prompt: {
          en: "Which fossil fuel, compressed as CNG, burns cleanest and pipes straight into vehicles and kitchens?",
          hi: "कौन-सा जीवाश्म ईंधन, सीएनजी के रूप में संपीड़ित, सबसे साफ़ जलता है और सीधे वाहनों-रसोइयों में पहुँचता है?",
          mr: "कोणते जीवाश्म इंधन, सीएनजी म्हणून दाबलेले, सर्वांत स्वच्छ जळते आणि थेट वाहनां-स्वयंपाकघरांत पोहोचते?",
        },
        statement: {
          en: "Natural gas burns cleanest of the fossils — compressed as CNG for buses, piped as PNG to stoves.",
          hi: "प्राकृतिक गैस जीवाश्मों में सबसे साफ़ जलती है — बसों के लिए संपीड़ित सीएनजी, चूल्हों तक पाइप से पीएनजी।",
          mr: "नैसर्गिक वायू जीवाश्मांत सर्वांत स्वच्छ जळतो — बसगाड्यांसाठी दाबलेला सीएनजी, चुलींपर्यंत नळाने पीएनजी.",
        },
        pair: {
          left: { en: "The cleanest fossil", hi: "सबसे साफ़ जीवाश्म", mr: "सर्वांत स्वच्छ जीवाश्म" },
          right: { en: "piped and compressed", hi: "पाइप और संपीड़न से", mr: "नळाने आणि दाबाने" },
        },
      },
      {
        id: "coke",
        name: { en: "Coke", hi: "कोक", mr: "कोक" },
        kind: "product",
        prompt: {
          en: "Which almost-pure carbon, made by processing coal, reduces metal ores in steel plants?",
          hi: "कोयले के प्रसंस्करण से बना कौन-सा लगभग शुद्ध कार्बन इस्पात-संयंत्रों में अयस्क अपचयित करता है?",
          mr: "कोळशाच्या प्रक्रियेतून बनलेला कोणता जवळजवळ शुद्ध कार्बन पोलाद-प्रकल्पांत धातुके क्षपण करतो?",
        },
        statement: {
          en: "Coke is coal purified to carbon — the steel industry's reducing agent and furnace fuel in one.",
          hi: "कोक कार्बन तक शुद्ध किया कोयला है — इस्पात उद्योग का अपचायक और भट्ठी-ईंधन एक साथ।",
          mr: "कोक म्हणजे कार्बनपर्यंत शुद्ध केलेला कोळसा — पोलाद उद्योगाचा क्षपणक आणि भट्टी-इंधन एकत्र.",
        },
        pair: {
          left: {
            en: "Coal purified to carbon",
            hi: "कार्बन तक शुद्ध कोयला",
            mr: "कार्बनपर्यंत शुद्ध कोळसा",
          },
          right: { en: "steel's working fuel", hi: "इस्पात का कामकाजी ईंधन", mr: "पोलादाचे कामाचे इंधन" },
        },
      },
      {
        id: "coal-tar",
        name: { en: "Coal tar", hi: "कोलतार", mr: "डांबर (कोल टार)" },
        kind: "product",
        prompt: {
          en: "Which thick black liquid from coal processing feeds dye, drug and paint factories — and the mothball jar?",
          hi: "कोयला-प्रसंस्करण का कौन-सा गाढ़ा काला द्रव रंग, दवा और पेंट कारख़ानों को — और नेफ़्थलीन की गोलियों को — खिलाता है?",
          mr: "कोळसा-प्रक्रियेतला कोणता दाट काळा द्रव रंग, औषध आणि पेंट कारखान्यांना — आणि डांबरगोळ्यांना — पोसतो?",
        },
        statement: {
          en: "Coal tar is a black stew of two hundred substances — dyes, drugs, paints and naphthalene balls trace their line to it.",
          hi: "कोलतार दो सौ पदार्थों का काला शोरबा है — रंग, दवाएँ, पेंट और नेफ़्थलीन की गोलियाँ उसी के वंशज हैं।",
          mr: "डांबर हे दोनशे पदार्थांचे काळे कालवण — रंग, औषधे, पेंट आणि डांबरगोळ्या त्याचेच वंशज.",
        },
        detail: {
          en: "Roads today mostly use bitumen, a petroleum product, in its old place.",
          hi: "आज सड़कें उसकी पुरानी जगह प्रायः बिटुमेन — पेट्रोलियम-उत्पाद — बिछाती हैं।",
          mr: "आज रस्ते त्याच्या जुन्या जागी बहुधा बिट्युमेन — पेट्रोलियम-उत्पादन — अंथरतात.",
        },
        extra: {
          en: "The naphthalene balls guarding winter woollens are its most domestic descendants.",
          hi: "सर्दियों के ऊनी कपड़े बचाती नेफ़्थलीन की गोलियाँ उसकी सबसे घरेलू संतानें हैं।",
          mr: "हिवाळी लोकरी कपडे राखणाऱ्या डांबरगोळ्या ही त्याची सर्वांत घरगुती अपत्ये.",
        },
        pair: {
          left: { en: "The black stew", hi: "काला शोरबा", mr: "काळे कालवण" },
          right: { en: "dyes and mothballs", hi: "रंग और गोलियाँ", mr: "रंग आणि डांबरगोळ्या" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the fuel to its story: A-coal, B-petroleum, C-natural gas. Which trio is right?",
          hi: "ईंधन को उसकी कहानी से मिलाइए: अ-कोयला, ब-पेट्रोलियम, स-प्राकृतिक गैस। कौन-सी तिकड़ी सही है?",
          mr: "इंधनाला त्याच्या कथेशी जुळवा: अ-कोळसा, ब-पेट्रोलियम, क-नैसर्गिक वायू. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: buried forests, dug and burnt for power · B: sea life, drilled and refined · C: cleanest burner, piped and compressed",
            hi: "अ: गड़े जंगल, खोदकर बिजली को जले · ब: समुद्री जीवन, निकालकर परिष्कृत · स: सबसे साफ़ दहन, पाइप-संपीड़न से",
            mr: "अ: पुरलेली जंगले, खणून विजेसाठी जळालेली · ब: सागरी जीवन, काढून शुद्ध केलेले · क: सर्वांत स्वच्छ ज्वलन, नळ-दाबाने",
          },
          {
            en: "A: sea life refined · B: cleanest, piped · C: buried forests dug",
            hi: "अ: परिष्कृत समुद्री जीवन · ब: सबसे साफ़, पाइप से · स: खोदे गड़े जंगल",
            mr: "अ: शुद्ध केलेले सागरी जीवन · ब: सर्वांत स्वच्छ, नळाने · क: खणलेली पुरलेली जंगले",
          },
          {
            en: "A: cleanest, piped · B: buried forests · C: sea life refined",
            hi: "अ: सबसे साफ़, पाइप से · ब: गड़े जंगल · स: परिष्कृत समुद्री जीवन",
            mr: "अ: सर्वांत स्वच्छ, नळाने · ब: पुरलेली जंगले · क: शुद्ध सागरी जीवन",
          },
          {
            en: "All three formed last century and renew each monsoon",
            hi: "तीनों पिछली सदी में बने और हर मानसून नए होते हैं",
            mr: "तिन्ही गेल्या शतकात बनली आणि दर मान्सूनला नवी होतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Origin writes the biography: land forests pressed to coal seams, marine plankton cooked to crude, and the lightest fraction gathered as gas. Their handling follows their form — solid is dug, liquid is drilled and refined, gas is piped and compressed. The one wrong option renews them; nothing about them renews.",
          hi: "मूल ही जीवनी लिखता है: थल के जंगल दबकर कोयला-परतें, समुद्री प्लवक पककर कच्चा तेल, और सबसे हल्का अंश गैस बनकर जमा। रख-रखाव रूप के पीछे चलता है — ठोस खोदा जाता है, द्रव निकालकर परिष्कृत, गैस पाइप-संपीड़ित। इकलौता ग़लत विकल्प उन्हें नया बताता है; उनमें कुछ भी नया नहीं होता।",
          mr: "मूळच चरित्र लिहिते: जमिनीवरची जंगले दबून कोळसा-थर, सागरी प्लवंग शिजून कच्चे तेल, आणि सर्वांत हलका अंश वायू म्हणून जमलेला. हाताळणी रूपामागून चालते — घन खणले जाते, द्रव काढून शुद्ध, वायू नळ-दाबाने. एकमेव चुकीचा पर्याय त्यांना नवे म्हणतो; त्यांच्यात काहीही नवे होत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Petrol prices make national headlines; sunshine and wind are free and nobody reports their 'stock'. What underlies the asymmetry?",
          hi: "पेट्रोल के दाम राष्ट्रीय सुर्ख़ियाँ बनते हैं; धूप और हवा मुफ़्त हैं और उनके 'भंडार' की ख़बर कोई नहीं छापता। इस विषमता की जड़ क्या है?",
          mr: "पेट्रोलच्या किमती राष्ट्रीय मथळे होतात; ऊन आणि वारा फुकट आहेत आणि त्यांच्या 'साठ्या'ची बातमी कोणी छापत नाही. या विषमतेच्या मुळाशी काय?",
        },
        choices: [
          {
            en: "Exhaustibility: petroleum is a fixed buried stock that only shrinks, so scarcity gives it a price and politics — sun and wind are flows that tomorrow refills, unpriceable by scarcity",
            hi: "समाप्यता: पेट्रोलियम गड़ा हुआ नियत भंडार है जो केवल घटता है, अतः दुर्लभता उसे दाम और राजनीति देती है — धूप-हवा प्रवाह हैं जिन्हें कल फिर भर देता है, दुर्लभता से बेदाम",
            mr: "संपणारेपण: पेट्रोलियम हा पुरलेला ठरावीक साठा जो फक्त आटतो, म्हणून दुर्मिळता त्याला किंमत आणि राजकारण देते — ऊन-वारा हे प्रवाह जे उद्या पुन्हा भरतो, दुर्मिळतेने किंमत न लावता येणारे",
          },
          {
            en: "Sunshine is actually secretly running out too",
            hi: "धूप भी असल में चुपचाप ख़त्म हो रही है",
            mr: "ऊनही खरे तर गुपचूप संपते आहे",
          },
          {
            en: "Petrol is newsworthy only because vehicles are noisy",
            hi: "पेट्रोल केवल इसलिए ख़बर है कि वाहन शोर करते हैं",
            mr: "पेट्रोल फक्त म्हणून बातमी की वाहने गोंगाट करतात",
          },
          {
            en: "Wind cannot be used for any human purpose",
            hi: "हवा किसी मानवी काम में नहीं आ सकती",
            mr: "वारा कोणत्याही मानवी कामी येऊ शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Price is scarcity's shadow. A stock laid down once and never refilled — petroleum — obeys the arithmetic of emptying: every barrel burnt raises the worth of those left, so nations drill, bargain and quarrel over it. A flow — sunlight, wind — cannot be hoarded or exhausted, so it carries no scarcity price, only the cost of the machines that catch it. The chapter's quiet conclusion: the future belongs to fuels that arrive daily rather than treasure that only leaves.",
          hi: "दाम दुर्लभता की परछाईं है। एक बार जमा होकर कभी न भरने वाला भंडार — पेट्रोलियम — ख़ाली होने के गणित से चलता है: जला हर बैरल बचे हुओं का मोल बढ़ाता है, अतः राष्ट्र उस पर खुदाई, सौदे और झगड़े करते हैं। प्रवाह — धूप, हवा — न जमा हो सकता है न चुक सकता है, अतः उस पर दुर्लभता का दाम नहीं, केवल पकड़ने वाली मशीनों की लागत है। अध्याय का ख़ामोश निष्कर्ष: भविष्य रोज़ आने वाले ईंधनों का है, केवल जाने वाले ख़ज़ाने का नहीं।",
          mr: "किंमत ही दुर्मिळतेची सावली. एकदा साचून कधी न भरणारा साठा — पेट्रोलियम — रिकामे होण्याच्या गणिताने चालतो: जळालेले प्रत्येक पिंप उरलेल्यांचे मोल वाढवते, म्हणून राष्ट्रे त्यावर खोदाई, सौदे आणि भांडणे करतात. प्रवाह — ऊन, वारा — ना साठवता येतो ना संपतो, म्हणून त्यावर दुर्मिळतेची किंमत नाही, फक्त पकडणाऱ्या यंत्रांचा खर्च. प्रकरणाचा मूक निष्कर्ष: भविष्य रोज येणाऱ्या इंधनांचे आहे, फक्त जाणाऱ्या खजिन्याचे नाही.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Combustion and Flame (fire's rulebook)                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-combustion-flame",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 6 — Combustion and Flame",
      hi: "अध्याय 6 — दहन एवं ज्वाला",
      mr: "प्रकरण 6 — ज्वलन आणि ज्योत",
    },
    name: { en: "Combustion and Flame", hi: "दहन एवं ज्वाला", mr: "ज्वलन आणि ज्योत" },
    summary: {
      en: "Fire's rulebook: an entry fee every fuel must pay, a triangle that falls if one leg is cut, extinguishers matched to their fires — and the candle's three zones, hottest at the rim.",
      hi: "आग की नियम-पुस्तिका: हर ईंधन को चुकानी पड़ती प्रवेश-फ़ीस, एक टाँग कटते ही गिरता त्रिभुज, अपनी-अपनी आग से मिलाए गए अग्निशामक — और मोमबत्ती के तीन क्षेत्र, किनारे पर सबसे तप्त।",
      mr: "आगीची नियमपुस्तिका: प्रत्येक इंधनाला द्यावी लागणारी प्रवेश-फी, एक पाय कापताच पडणारा त्रिकोण, आपापल्या आगीशी जुळवलेली विझवणी — आणि मेणबत्तीचे तीन पट्टे, काठावर सर्वांत तप्त.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "combustion",
        name: { en: "Combustion", hi: "दहन", mr: "ज्वलन" },
        kind: "process",
        prompt: {
          en: "Which chemical process burns a substance with oxygen, releasing heat and usually light?",
          hi: "कौन-सी रासायनिक प्रक्रिया किसी पदार्थ को ऑक्सीजन के साथ जलाती है, ऊष्मा और प्रायः प्रकाश छोड़ती हुई?",
          mr: "कोणती रासायनिक प्रक्रिया पदार्थाला ऑक्सिजनसह जाळते, उष्णता आणि बहुधा प्रकाश सोडत?",
        },
        statement: {
          en: "Combustion is burning — fuel joining oxygen to give heat and light; a reaction, not a substance.",
          hi: "दहन जलना है — ईंधन का ऑक्सीजन से जुड़कर ऊष्मा-प्रकाश देना; एक अभिक्रिया, कोई पदार्थ नहीं।",
          mr: "ज्वलन म्हणजे जळणे — इंधनाने ऑक्सिजनशी जुळून उष्णता-प्रकाश देणे; एक अभिक्रिया, पदार्थ नव्हे.",
        },
        pair: {
          left: { en: "Fuel joined by oxygen", hi: "ऑक्सीजन से जुड़ा ईंधन", mr: "ऑक्सिजनशी जुळलेले इंधन" },
          right: {
            en: "heat and light released",
            hi: "छूटी ऊष्मा और प्रकाश",
            mr: "सुटलेली उष्णता आणि प्रकाश",
          },
        },
      },
      {
        id: "ignition-temp",
        name: {
          en: "The ignition temperature",
          hi: "ज्वलन ताप",
          mr: "प्रज्वलन तापमान",
        },
        kind: "condition",
        prompt: {
          en: "Which minimum temperature must a fuel reach before it can catch fire at all?",
          hi: "आग पकड़ने से पहले ईंधन को कौन-सा न्यूनतम तापमान छूना ही पड़ता है?",
          mr: "आग लागण्याआधी इंधनाला कोणते किमान तापमान गाठावेच लागते?",
        },
        statement: {
          en: "The ignition temperature is fire's entry fee — below it, fuel and air can only sit and wait.",
          hi: "ज्वलन ताप आग की प्रवेश-फ़ीस है — उससे नीचे ईंधन और हवा बस बैठे इंतज़ार कर सकते हैं।",
          mr: "प्रज्वलन तापमान ही आगीची प्रवेश-फी — त्याखाली इंधन आणि हवा नुसती बसून वाट पाहू शकतात.",
        },
        detail: {
          en: "Paper pays the fee easily; coal needs long coaxing — the fee differs fuel to fuel.",
          hi: "काग़ज़ फ़ीस आसानी से चुकाता है; कोयले को देर तक मनाना पड़ता है — फ़ीस ईंधन-दर-ईंधन बदलती है।",
          mr: "कागद फी सहज देतो; कोळशाला बराच वेळ मनवावे लागते — फी इंधनागणिक बदलते.",
        },
        extra: {
          en: "A matchstick pays it with friction heat — the strike IS the payment.",
          hi: "माचिस की तीली उसे घर्षण की गर्मी से चुकाती है — रगड़ ही भुगतान है।",
          mr: "काडेपेटीची काडी ती घर्षणाच्या उष्णतेने देते — घासणे हेच पैसे देणे.",
        },
        pair: {
          left: { en: "Fire's entry fee", hi: "आग की प्रवेश-फ़ीस", mr: "आगीची प्रवेश-फी" },
          right: { en: "below it, no flame", hi: "उससे नीचे, कोई लौ नहीं", mr: "त्याखाली ज्योत नाही" },
        },
      },
      {
        id: "inflammable",
        name: {
          en: "Inflammable substances",
          hi: "ज्वलनशील पदार्थ",
          mr: "ज्वालाग्राही पदार्थ",
        },
        kind: "class",
        prompt: {
          en: "Petrol, LPG, alcohol — which class of substances has ignition temperatures so low they flare at a spark?",
          hi: "पेट्रोल, एलपीजी, अल्कोहल — किन पदार्थों का ज्वलन ताप इतना कम है कि वे चिंगारी भर से भड़क उठते हैं?",
          mr: "पेट्रोल, एलपीजी, अल्कोहोल — कोणत्या पदार्थांचे प्रज्वलन तापमान इतके कमी की ते ठिणगीनेच भडकतात?",
        },
        statement: {
          en: "Inflammable substances catch fire at the least excuse — low ignition temperatures make them useful and dangerous in the same breath.",
          hi: "ज्वलनशील पदार्थ ज़रा-से बहाने पर आग पकड़ लेते हैं — कम ज्वलन ताप उन्हें एक ही साँस में उपयोगी और ख़तरनाक बनाता है।",
          mr: "ज्वालाग्राही पदार्थ जरा निमित्ताने पेट घेतात — कमी प्रज्वलन तापमान त्यांना एकाच श्वासात उपयुक्त आणि धोकादायक करते.",
        },
        pair: {
          left: { en: "Flaring at a spark", hi: "चिंगारी पर भड़कते", mr: "ठिणगीवर भडकणारे" },
          right: {
            en: "useful and dangerous alike",
            hi: "समान रूप से उपयोगी-ख़तरनाक",
            mr: "सारखेच उपयुक्त-धोकादायक",
          },
        },
      },
      {
        id: "fire-triangle",
        name: { en: "The fire triangle", hi: "अग्नि त्रिभुज", mr: "अग्नी त्रिकोण" },
        kind: "condition",
        prompt: {
          en: "Fuel, oxygen and heat — remove any one and the fire dies. What is this trio called?",
          hi: "ईंधन, ऑक्सीजन और ऊष्मा — कोई एक हटाइए और आग मर जाती है। इस तिकड़ी का नाम क्या है?",
          mr: "इंधन, ऑक्सिजन आणि उष्णता — कोणतेही एक काढा आणि आग मरते. या त्रिकुटाचे नाव काय?",
        },
        statement: {
          en: "The fire triangle names fire's three needs — every extinguisher in the world attacks at least one of its sides.",
          hi: "अग्नि त्रिभुज आग की तीन ज़रूरतें गिनाता है — दुनिया का हर अग्निशामक उसकी कम-से-कम एक भुजा पर वार करता है।",
          mr: "अग्नी त्रिकोण आगीच्या तीन गरजा सांगतो — जगातली प्रत्येक विझवणी त्याच्या किमान एका बाजूवर घाव घालते.",
        },
        detail: {
          en: "Water cools below the ignition fee; CO₂ walls off the oxygen; clearing fuel starves the third leg.",
          hi: "पानी ज्वलन-फ़ीस से नीचे ठंडा करता है; CO₂ ऑक्सीजन की दीवार खींचता है; ईंधन हटाना तीसरी टाँग भूखी करता है।",
          mr: "पाणी प्रज्वलन-फीखाली थंड करते; CO₂ ऑक्सिजनची भिंत घालतो; इंधन काढणे तिसरा पाय उपाशी ठेवते.",
        },
        extra: {
          en: "Water on an oil fire fails twice over — the oil floats on it and spatters, still burning.",
          hi: "तेल की आग पर पानी दो बार विफल है — तेल उस पर तैरता और छिटकता है, जलता हुआ ही।",
          mr: "तेलाच्या आगीवर पाणी दोनदा फसते — तेल त्यावर तरंगते आणि उडते, जळतच.",
        },
        pair: {
          left: { en: "The three-legged fire", hi: "तीन टाँगों की आग", mr: "तीन पायांची आग" },
          right: { en: "cut one leg, it falls", hi: "एक टाँग कटी, गिरी", mr: "एक पाय कापला, पडली" },
        },
      },
      {
        id: "co2-extinguisher",
        name: {
          en: "The CO₂ extinguisher",
          hi: "CO₂ अग्निशामक",
          mr: "CO₂ विझवणी",
        },
        kind: "tool",
        prompt: {
          en: "For electrical fires, which extinguisher blankets the flame in heavy gas without wetting a single wire?",
          hi: "बिजली की आग के लिए कौन-सा अग्निशामक एक भी तार भिगोए बिना लौ को भारी गैस से ढक देता है?",
          mr: "विजेच्या आगीसाठी कोणती विझवणी एकही तार न भिजवता ज्योतीला जड वायूने झाकते?",
        },
        statement: {
          en: "CO₂ smothers the fires it must not wet — heavier than air, it settles on the flame and starves it of oxygen.",
          hi: "CO₂ उन आगों को दम घोंटकर बुझाता है जिन्हें भिगोना मना है — हवा से भारी, वह लौ पर बैठकर उसकी ऑक्सीजन छीन लेता है।",
          mr: "CO₂ भिजवायला मनाई असलेल्या आगी गुदमरवून विझवतो — हवेहून जड, तो ज्योतीवर बसून तिचा ऑक्सिजन हिरावतो.",
        },
        pair: {
          left: { en: "The heavy gas blanket", hi: "भारी गैस का कंबल", mr: "जड वायूचे पांघरूण" },
          right: { en: "flames starved dry", hi: "सूखी भूखी मारी लपटें", mr: "कोरड्या उपाशी मारलेल्या ज्वाळा" },
        },
      },
      {
        id: "flame-zones",
        name: {
          en: "The flame's three zones",
          hi: "ज्वाला के तीन क्षेत्र",
          mr: "ज्योतीचे तीन पट्टे",
        },
        kind: "structure",
        prompt: {
          en: "A candle flame stacks three regions — dark at the wick, yellow in the middle, faint blue at the rim. What are they together called?",
          hi: "मोमबत्ती की लौ में तीन परतें हैं — बत्ती पर काली, बीच में पीली, किनारे पर हल्की नीली। इन्हें मिलाकर क्या कहते हैं?",
          mr: "मेणबत्तीच्या ज्योतीत तीन थर आहेत — वातीशी काळा, मध्ये पिवळा, काठावर फिकट निळा. यांना मिळून काय म्हणतात?",
        },
        statement: {
          en: "The flame's three zones: innermost dark unburnt vapour, middle yellow half-burnt glow, outer blue complete burning — and the outer rim is the hottest.",
          hi: "ज्वाला के तीन क्षेत्र: भीतरी काला अनजला वाष्प, बीच की पीली अधजली दमक, बाहरी नीला पूर्ण दहन — और बाहरी किनारा सबसे तप्त।",
          mr: "ज्योतीचे तीन पट्टे: आतला काळा न जळालेला बाष्प, मधला पिवळा अर्धवट जळता झळाळ, बाहेरचा निळा पूर्ण ज्वलन — आणि बाहेरचा काठ सर्वांत तप्त.",
        },
        detail: {
          en: "Hold a glass rod across the yellow zone and it comes away sooted — the signature of unfinished burning.",
          hi: "पीले क्षेत्र के आर-पार काँच की छड़ रखिए, वह कालिख लिए लौटती है — अधूरे दहन के दस्तख़त।",
          mr: "पिवळ्या पट्ट्यातून काचकांडी धरा, ती काजळी घेऊन परतते — अपुऱ्या ज्वलनाची सही.",
        },
        extra: {
          en: "Goldsmiths blow their pipes at the outer zone — the hottest, cleanest heat for the finest work.",
          hi: "सुनार अपनी फुँकनी बाहरी क्षेत्र पर साधते हैं — सबसे तप्त, सबसे साफ़ आँच, सबसे महीन काम के लिए।",
          mr: "सोनार आपली फुंकणी बाहेरच्या पट्ट्यावर धरतात — सर्वांत तप्त, सर्वांत स्वच्छ आच, सर्वांत बारीक कामासाठी.",
        },
        pair: {
          left: { en: "Dark, yellow and blue", hi: "काला, पीला और नीला", mr: "काळा, पिवळा आणि निळा" },
          right: { en: "hottest at the rim", hi: "किनारे पर सबसे तप्त", mr: "काठावर सर्वांत तप्त" },
        },
      },
      {
        id: "calorific",
        name: { en: "Calorific value", hi: "ऊष्मीय मान", mr: "उष्मांक मूल्य" },
        kind: "measure",
        prompt: {
          en: "Which number ranks fuels by the heat one kilogram of each releases — kilojoules per kilogram?",
          hi: "कौन-सी संख्या ईंधनों को उनके प्रति किलोग्राम छोड़ी ऊष्मा से क्रम देती है — किलोजूल प्रति किलोग्राम?",
          mr: "कोणता आकडा इंधनांना त्यांच्या प्रति किलोग्रॅम सोडलेल्या उष्णतेने क्रम देतो — किलोजूल प्रति किलोग्रॅम?",
        },
        statement: {
          en: "Calorific value measures a fuel's worth in heat per kilogram — hydrogen tops the table, dung cakes sit near the floor.",
          hi: "ऊष्मीय मान प्रति किलोग्राम ऊष्मा में ईंधन का मोल नापता है — हाइड्रोजन तालिका के शीर्ष पर, उपले फ़र्श के पास।",
          mr: "उष्मांक मूल्य प्रति किलोग्रॅम उष्णतेत इंधनाचे मोल मोजते — हायड्रोजन तक्त्याच्या शिरोभागी, गोवऱ्या तळाजवळ.",
        },
        pair: {
          left: { en: "Heat per kilogram", hi: "प्रति किलोग्राम ऊष्मा", mr: "प्रति किलोग्रॅम उष्णता" },
          right: { en: "fuels ranked honest", hi: "ईमानदारी से क्रमबद्ध ईंधन", mr: "प्रामाणिकपणे क्रम लावलेली इंधने" },
        },
      },
      {
        id: "ideal-fuel",
        name: { en: "The ideal fuel", hi: "आदर्श ईंधन", mr: "आदर्श इंधन" },
        kind: "idea",
        prompt: {
          en: "Cheap, plentiful, easy to store, high heat, no smoke — which fuel meets every wish on the list?",
          hi: "सस्ता, प्रचुर, रखने में आसान, ऊँची ऊष्मा, धुआँ नहीं — कौन-सा ईंधन सूची की हर इच्छा पूरी करता है?",
          mr: "स्वस्त, विपुल, साठवायला सोपे, उंच उष्णता, धूर नाही — कोणते इंधन यादीतली प्रत्येक इच्छा पुरवते?",
        },
        statement: {
          en: "The ideal fuel exists only as a checklist — every real fuel fails at least one line, so choosing fuel is choosing trade-offs.",
          hi: "आदर्श ईंधन केवल जाँच-सूची में बसता है — हर असली ईंधन कम-से-कम एक पंक्ति पर विफल है, अतः ईंधन चुनना समझौते चुनना है।",
          mr: "आदर्श इंधन फक्त तपासयादीत राहते — प्रत्येक खरे इंधन किमान एका ओळीवर अपयशी, म्हणून इंधन निवडणे म्हणजे तडजोडी निवडणे.",
        },
        pair: {
          left: {
            en: "The perfect-fuel checklist",
            hi: "पूर्ण-ईंधन की जाँच-सूची",
            mr: "परिपूर्ण-इंधनाची तपासयादी",
          },
          right: {
            en: "every real fuel fails a line",
            hi: "हर असली ईंधन कहीं विफल",
            mr: "प्रत्येक खरे इंधन कुठे ना कुठे अपयशी",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the fire to its right response: A-burning wood pile, B-sparking electrical panel, C-oil pan aflame in the kitchen. Which trio is right?",
          hi: "आग को उसके सही जवाब से मिलाइए: अ-जलता लकड़ी का ढेर, ब-चिंगारियाँ छोड़ता बिजली-पैनल, स-रसोई में धधकती तेल की कड़ाही। कौन-सी तिकड़ी सही है?",
          mr: "आगीला तिच्या योग्य उत्तराशी जुळवा: अ-जळणारा लाकडाचा ढीग, ब-ठिणग्या टाकणारे वीज-पॅनेल, क-स्वयंपाकघरात पेटलेली तेलाची कढई. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: water · B: CO₂, never water · C: cover with a lid, never water",
            hi: "अ: पानी · ब: CO₂, पानी कभी नहीं · स: ढक्कन से ढकिए, पानी कभी नहीं",
            mr: "अ: पाणी · ब: CO₂, पाणी कधीच नाही · क: झाकणाने झाका, पाणी कधीच नाही",
          },
          {
            en: "A: CO₂ · B: water · C: fan the flames",
            hi: "अ: CO₂ · ब: पानी · स: लपटें हवा दीजिए",
            mr: "अ: CO₂ · ब: पाणी · क: ज्वाळांना वारा घाला",
          },
          {
            en: "A: cover with lid · B: oil · C: water",
            hi: "अ: ढक्कन · ब: तेल · स: पानी",
            mr: "अ: झाकण · ब: तेल · क: पाणी",
          },
          {
            en: "Water serves all three fires equally well",
            hi: "पानी तीनों आगों पर एक-सा कारगर है",
            mr: "पाणी तिन्ही आगींवर सारखेच चालते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One triangle, three tactics. Wood: water cools it below its ignition fee — the classic. Electricity: water conducts and would put the current through YOU, so dry CO₂ starves the flame instead. Oil: water sinks under it and erupts as burning spray, so a lid steals the oxygen quietly. Reading the fire before reaching for anything is the whole discipline.",
          hi: "एक त्रिभुज, तीन दाँव। लकड़ी: पानी उसे ज्वलन-फ़ीस से नीचे ठंडा करता है — क्लासिक। बिजली: पानी चालक है और धारा आप तक पहुँचा देता, अतः सूखा CO₂ लौ को भूखा मारता है। तेल: पानी उसके नीचे धँसकर जलती फुहार बनकर फटता है, अतः ढक्कन चुपचाप ऑक्सीजन छीनता है। कुछ भी उठाने से पहले आग को पढ़ना — यही पूरा अनुशासन है।",
          mr: "एक त्रिकोण, तीन डाव. लाकूड: पाणी त्याला प्रज्वलन-फीखाली थंड करते — अभिजात. वीज: पाणी वाहक आहे आणि धारा तुमच्यापर्यंत आणले असते, म्हणून कोरडा CO₂ ज्योतीला उपाशी मारतो. तेल: पाणी त्याच्याखाली बुडून जळता फवारा होऊन फुटते, म्हणून झाकण गुपचूप ऑक्सिजन हिरावते. काहीही उचलण्याआधी आग वाचणे — हीच सारी शिस्त.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Blowing OUT a candle kills it, yet blowing INTO a blacksmith's forge makes the coals roar hotter. The same breath — why opposite results?",
          hi: "फूँक मारने से मोमबत्ती बुझती है, पर लोहार की भट्ठी में फूँकने से कोयले और दहक उठते हैं। वही साँस — नतीजे उलटे क्यों?",
          mr: "फुंकर मारल्याने मेणबत्ती विझते, पण लोहाराच्या भात्यात फुंकल्याने निखारे अधिक धगधगतात. तोच श्वास — निकाल उलटे का?",
        },
        choices: [
          {
            en: "The candle's small flame loses its heat to the gust and drops below ignition temperature; the forge's coals hold heat far above it, so extra air only delivers more oxygen to a fire already past its fee",
            hi: "मोमबत्ती की नन्ही लौ झोंके में अपनी गर्मी खोकर ज्वलन ताप से नीचे गिर जाती है; भट्ठी के कोयले उससे कहीं ऊपर गर्मी थामे हैं, अतः और हवा उस आग को बस और ऑक्सीजन देती है जो फ़ीस कब की चुका चुकी",
            mr: "मेणबत्तीची इवली ज्योत झोतात आपली उष्णता गमावून प्रज्वलन तापमानाखाली उतरते; भात्याचे निखारे त्याहून खूप वर उष्णता धरून आहेत, म्हणून जास्त हवा फी केव्हाच भरलेल्या आगीला फक्त अधिक ऑक्सिजन देते",
          },
          {
            en: "Candle wax hates moving air while coal loves it",
            hi: "मोम को चलती हवा से बैर है, कोयले को प्यार",
            mr: "मेणाला हलत्या हवेचा तिटकारा, कोळशाला प्रेम",
          },
          {
            en: "The forge's air is a different gas from ordinary breath",
            hi: "भट्ठी की हवा आम साँस से अलग गैस है",
            mr: "भात्याची हवा नेहमीच्या श्वासाहून वेगळा वायू",
          },
          {
            en: "Candles can only burn in perfectly still rooms",
            hi: "मोमबत्तियाँ केवल बिलकुल स्थिर कमरों में जल सकती हैं",
            mr: "मेणबत्त्या फक्त पूर्ण स्थिर खोल्यांतच जळू शकतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The breath carries two gifts at once — oxygen and cooling — and the fire's size decides which gift dominates. A candle flame is a whisper of hot vapour: one gust sweeps its heat away, the wax vapour falls below its ignition fee, and the reaction stops mid-sentence. A forge is a furnace of stored heat no breath can chill; there the gust's oxygen is pure bonus. Same act, two fires, opposite outcomes — because combustion obeys temperature first and enthusiasm second.",
          hi: "साँस एक साथ दो सौग़ातें लाती है — ऑक्सीजन और ठंडक — और आग का आकार तय करता है कि कौन-सी भारी पड़े। मोमबत्ती की लौ गर्म वाष्प की फुसफुसाहट है: एक झोंका उसकी गर्मी बुहार ले जाता है, मोम-वाष्प ज्वलन-फ़ीस से नीचे गिरता है, और अभिक्रिया वाक्य के बीच रुक जाती है। भट्ठी जमा गर्मी की ऐसी भट्टी है जिसे कोई साँस ठंडा नहीं कर सकती; वहाँ झोंके की ऑक्सीजन शुद्ध बोनस है। एक ही काम, दो आगें, उलटे नतीजे — क्योंकि दहन पहले तापमान की सुनता है, जोश की बाद में।",
          mr: "श्वास एकाच वेळी दोन भेटी आणतो — ऑक्सिजन आणि गारवा — आणि आगीचा आकार ठरवतो कोणती भेट वरचढ. मेणबत्तीची ज्योत म्हणजे गरम बाष्पाची कुजबुज: एक झोत तिची उष्णता झाडून नेतो, मेण-बाष्प प्रज्वलन-फीखाली उतरते, आणि अभिक्रिया वाक्याच्या मध्येच थांबते. भाता म्हणजे साठलेल्या उष्णतेची अशी भट्टी जिला कोणताही श्वास थंड करू शकत नाही; तिथे झोताचा ऑक्सिजन शुद्ध बोनस. एकच कृती, दोन आगी, उलटे निकाल — कारण ज्वलन आधी तापमानाचे ऐकते, उत्साहाचे नंतर.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — Force and Pressure (pushes, pulls and their spread)        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-force-pressure",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 11 — Force and Pressure",
      hi: "अध्याय 11 — बल तथा दाब",
      mr: "प्रकरण 11 — बल आणि दाब",
    },
    name: { en: "Force and Pressure", hi: "बल तथा दाब", mr: "बल आणि दाब" },
    summary: {
      en: "Pushes and pulls with and without touch, force spread thin or driven to a point — why knives bite, dams thicken downward, and an emptied can confesses to the atmosphere.",
      hi: "छूकर और बिना छुए धक्के-खिंचाव, पतला बिछा या नोक पर साधा बल — क्यों चाक़ू काटता है, बाँध नीचे मोटे होते हैं, और ख़ाली किया डिब्बा वायुमंडल के आगे इक़बाल करता है।",
      mr: "स्पर्शाने आणि स्पर्शाविना धक्के-ओढी, पातळ पसरलेले वा टोकावर साधलेले बल — सुरी का चावते, धरणे खाली का जाड होतात, आणि रिकामा केलेला डबा वातावरणापुढे कबुली का देतो.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "force",
        name: { en: "Force", hi: "बल", mr: "बल" },
        kind: "quantity",
        prompt: {
          en: "Which push or pull can move the still, stop the moving, turn the straight or change a thing's shape?",
          hi: "कौन-सा धक्का या खिंचाव ठहरे को चला, चलते को रोक, सीधे को मोड़ या वस्तु का आकार बदल सकता है?",
          mr: "कोणता धक्का वा ओढ स्थिराला हलवू, चालत्याला थांबवू, सरळाला वळवू वा वस्तूचा आकार बदलू शकते?",
        },
        statement: {
          en: "A force is a push or a pull — it can start, stop, turn or deform, and it never acts without two objects interacting.",
          hi: "बल धक्का या खिंचाव है — वह चला, रोक, मोड़ या विकृत कर सकता है, और दो वस्तुओं की अंतःक्रिया के बिना कभी नहीं लगता।",
          mr: "बल म्हणजे धक्का वा ओढ — ते सुरू, थांबवू, वळवू वा विरूप करू शकते, आणि दोन वस्तूंच्या आंतरक्रियेविना कधीच लागत नाही.",
        },
        detail: {
          en: "Forces come in interacting pairs — kick a ball and the ball presses your foot right back.",
          hi: "बल अंतःक्रिया की जोड़ियों में आते हैं — गेंद को ठोकर मारिए और गेंद आपके पैर को उतना ही दबाती है।",
          mr: "बले आंतरक्रियेच्या जोड्यांत येतात — चेंडूला लाथ मारा आणि चेंडू तुमच्या पायाला तितकाच दाबतो.",
        },
        extra: {
          en: "Every force needs an agent and an object — nothing in the universe pushes alone.",
          hi: "हर बल को कर्ता और वस्तु चाहिए — ब्रह्मांड में कुछ भी अकेला नहीं धकेलता।",
          mr: "प्रत्येक बलाला कर्ता आणि वस्तू लागते — विश्वात काहीही एकटे ढकलत नाही.",
        },
        pair: {
          left: { en: "The push or pull", hi: "धक्का या खिंचाव", mr: "धक्का वा ओढ" },
          right: {
            en: "start, stop, turn or bend",
            hi: "चलाए, रोके, मोड़े या झुकाए",
            mr: "सुरू, थांबवणे, वळवणे वा वाकवणे",
          },
        },
      },
      {
        id: "muscular",
        name: { en: "Muscular force", hi: "पेशीय बल", mr: "स्नायुबल" },
        kind: "force",
        prompt: {
          en: "Which contact force do animals apply through their own bodies — the bullock's pull, the porter's lift, your own chewing?",
          hi: "कौन-सा संपर्क बल प्राणी अपने शरीर से लगाते हैं — बैल का खिंचाव, क़ुली का उठाव, आपकी अपनी चबाई?",
          mr: "कोणते संपर्क बल प्राणी आपल्या शरीरातून लावतात — बैलाची ओढ, हमालाची उचल, तुमचे स्वतःचे चावणे?",
        },
        statement: {
          en: "Muscular force is the body's own — applied on contact, from chewing a roti to ploughing a field.",
          hi: "पेशीय बल शरीर का अपना है — संपर्क में लगाया गया, रोटी चबाने से खेत जोतने तक।",
          mr: "स्नायुबल हे शरीराचे स्वतःचे — संपर्कात लावलेले, पोळी चावण्यापासून शेत नांगरण्यापर्यंत.",
        },
        pair: {
          left: { en: "The body's own force", hi: "शरीर का अपना बल", mr: "शरीराचे स्वतःचे बल" },
          right: { en: "applied by touch", hi: "छूकर लगाया गया", mr: "स्पर्शाने लावलेले" },
        },
      },
      {
        id: "distance-forces",
        name: { en: "Forces at a distance", hi: "दूरी से लगते बल", mr: "दुरून लागणारी बले" },
        kind: "force",
        prompt: {
          en: "Magnetism, gravity, static electricity — which family of forces acts WITHOUT any touching at all?",
          hi: "चुंबकत्व, गुरुत्व, स्थैतिक विद्युत — बलों का कौन-सा परिवार बिना किसी छुअन के लगता है?",
          mr: "चुंबकत्व, गुरुत्व, स्थितिक विद्युत — बलांचे कोणते कुटुंब कोणत्याही स्पर्शाविना लागते?",
        },
        statement: {
          en: "Non-contact forces act across gaps — the magnet pulls the pin, the earth the mango, the charged comb the paper bits: all untouched.",
          hi: "असंपर्क बल दूरियों के पार लगते हैं — चुंबक पिन खींचता है, धरती आम, आवेशित कंघी काग़ज़ के टुकड़े: सब अनछुए।",
          mr: "असंपर्क बले अंतरापार लागतात — चुंबक टाचणी ओढतो, पृथ्वी आंबा, विद्युतभारित कंगवा कागदाचे कपटे: सारे अस्पर्श.",
        },
        pair: {
          left: { en: "Pull without touch", hi: "बिना छुए खिंचाव", mr: "स्पर्शाविना ओढ" },
          right: {
            en: "magnet, earth and comb",
            hi: "चुंबक, धरती और कंघी",
            mr: "चुंबक, पृथ्वी आणि कंगवा",
          },
        },
      },
      {
        id: "pressure",
        name: { en: "Pressure", hi: "दाब", mr: "दाब" },
        kind: "quantity",
        prompt: {
          en: "Which quantity is force divided by the area it presses on — the reason a sharp knife cuts where a blunt one bruises?",
          hi: "कौन-सी राशि बल बटा वह क्षेत्रफल है जिस पर वह दबता है — जिस कारण तेज़ चाक़ू काटता है जहाँ भोथरा कुचलता है?",
          mr: "कोणती राशी म्हणजे बल भागिले ते दाबणारे क्षेत्रफळ — ज्यामुळे धारदार सुरी कापते जिथे बोथट चेचते?",
        },
        statement: {
          en: "Pressure is force per unit area — shrink the area and the same push bites deeper; spread it and the push turns gentle.",
          hi: "दाब प्रति इकाई क्षेत्रफल बल है — क्षेत्र घटाइए तो वही धक्का गहरा काटता है; फैलाइए तो कोमल पड़ जाता है।",
          mr: "दाब म्हणजे प्रति एकक क्षेत्रफळ बल — क्षेत्र आकसवा आणि तोच धक्का खोल चावतो; पसरवा आणि तो सौम्य होतो.",
        },
        detail: {
          en: "Nails are pointed and shoulder-straps broad by the same law read in opposite directions.",
          hi: "कीलें नुकीली और कंधे की पट्टियाँ चौड़ी — एक ही नियम, दो दिशाओं में पढ़ा हुआ।",
          mr: "खिळे टोकदार आणि खांद्याचे पट्टे रुंद — एकच नियम, दोन दिशांनी वाचलेला.",
        },
        extra: {
          en: "Snowshoes and camel feet spread weight thin — walking on area itself.",
          hi: "बर्फ़-जूते और ऊँट के पैर वज़न को पतला बिछा देते हैं — मानो क्षेत्रफल पर ही चलना।",
          mr: "बर्फ-पादत्राणे आणि उंटाचे पाय वजन पातळ पसरतात — जणू क्षेत्रफळावरच चालणे.",
        },
        pair: {
          left: { en: "Force over area", hi: "क्षेत्रफल पर बल", mr: "क्षेत्रफळावरचे बल" },
          right: {
            en: "sharp bites, broad spreads",
            hi: "नुकीला काटे, चौड़ा बिछाए",
            mr: "टोकदार चावते, रुंद पसरते",
          },
        },
      },
      {
        id: "liquid-pressure",
        name: { en: "Liquid pressure", hi: "द्रव का दाब", mr: "द्रवाचा दाब" },
        kind: "quantity",
        prompt: {
          en: "Which pressure pushes on a vessel's walls and grows with depth — squirting farthest from the LOWEST hole in a leaky bottle?",
          hi: "कौन-सा दाब बर्तन की दीवारों पर दबता और गहराई से बढ़ता है — छेदों वाली बोतल के सबसे निचले छेद से सबसे दूर फुहारता हुआ?",
          mr: "कोणता दाब भांड्याच्या भिंतींवर दाबतो आणि खोलीने वाढतो — भोके पडलेल्या बाटलीच्या सर्वांत खालच्या भोकातून सर्वांत दूर उडणारा?",
        },
        statement: {
          en: "Liquids press on walls and bottom alike, harder with depth — the lowest leak always spurts farthest.",
          hi: "द्रव दीवारों और तल पर समान रूप से दबते हैं, गहराई के साथ ज़्यादा — सबसे निचला रिसाव सदा सबसे दूर फुहारता है।",
          mr: "द्रव भिंतींवर आणि तळावर सारखेच दाबतात, खोलीसोबत अधिक — सर्वांत खालची गळती नेहमी सर्वांत दूर उडते.",
        },
        pair: {
          left: { en: "Deeper, harder", hi: "जितना गहरा, उतना दाब", mr: "जितके खोल, तितका दाब" },
          right: {
            en: "the lowest leak spurts farthest",
            hi: "सबसे निचला रिसाव सबसे दूर",
            mr: "सर्वांत खालची गळती सर्वांत दूर",
          },
        },
      },
      {
        id: "atmospheric",
        name: {
          en: "Atmospheric pressure",
          hi: "वायुमंडलीय दाब",
          mr: "वातावरणीय दाब",
        },
        kind: "quantity",
        prompt: {
          en: "Which invisible pressure of the air's weight crushes an emptied tin can and pins the rubber sucker to the tile?",
          hi: "हवा के वज़न का कौन-सा अदृश्य दाब ख़ाली किए डिब्बे को पिचका देता है और रबर के चूषक को टाइल से चिपकाए रखता है?",
          mr: "हवेच्या वजनाचा कोणता अदृश्य दाब रिकाम्या केलेल्या डब्याला चेपतो आणि रबरी चोषकाला फरशीवर दाबून ठेवतो?",
        },
        statement: {
          en: "Atmospheric pressure presses from every side — unnoticed only because our bodies push back in equal measure.",
          hi: "वायुमंडलीय दाब हर ओर से दबता है — अनजाना केवल इसलिए कि हमारे शरीर बराबरी से पलट-दबाव देते हैं।",
          mr: "वातावरणीय दाब प्रत्येक बाजूने दाबतो — न जाणवणारा केवळ म्हणून की आपली शरीरे तितकाच प्रति-दाब देतात.",
        },
        detail: {
          en: "Pump the air from a tin and the atmosphere crumples it — one-sided pressure made suddenly visible.",
          hi: "डिब्बे से हवा खींचिए और वायुमंडल उसे मरोड़ देता है — एकतरफ़ा दाब अचानक दिखने लगता है।",
          mr: "डब्यातली हवा उपसा आणि वातावरण त्याला चुरगळते — एकतर्फी दाब अचानक दिसू लागतो.",
        },
        extra: {
          en: "The sucker hook holds because air presses it to the tile with nothing left inside to push back.",
          hi: "चूषक-हुक इसलिए टिकता है कि हवा उसे टाइल पर दबाती है और भीतर पलट-धक्के को कुछ बचा नहीं।",
          mr: "चोषक-हुक म्हणून टिकतो की हवा त्याला फरशीवर दाबते आणि आत प्रति-धक्क्याला काही उरले नाही.",
        },
        pair: {
          left: { en: "The unfelt crush", hi: "बिन महसूस दबाव", mr: "न जाणवणारी चेपण" },
          right: {
            en: "the crumpled can's confession",
            hi: "पिचके डिब्बे का इक़बाल",
            mr: "चेपलेल्या डब्याची कबुली",
          },
        },
      },
      {
        id: "gravity",
        name: { en: "Gravity's pull", hi: "गुरुत्व का खिंचाव", mr: "गुरुत्वाची ओढ" },
        kind: "force",
        prompt: {
          en: "Which force pulls every dropped thing earthward — no string attached, no touch required?",
          hi: "कौन-सा बल हर गिराई चीज़ को धरती की ओर खींचता है — न कोई डोर बँधी, न छुअन ज़रूरी?",
          mr: "कोणते बल प्रत्येक सोडलेल्या वस्तूला पृथ्वीकडे ओढते — ना दोरी बांधलेली, ना स्पर्श लागतो?",
        },
        statement: {
          en: "Gravity pulls at a distance — every mango, raindrop and satellite answers to the same unseen tug.",
          hi: "गुरुत्व दूरी से खींचता है — हर आम, बूँद और उपग्रह उसी अनदेखी खींच के जवाबदेह हैं।",
          mr: "गुरुत्व दुरून ओढते — प्रत्येक आंबा, थेंब आणि उपग्रह त्याच न दिसणाऱ्या ओढीला उत्तरदायी.",
        },
        pair: {
          left: { en: "The earthward pull", hi: "धरती की ओर खिंचाव", mr: "पृथ्वीकडची ओढ" },
          right: { en: "no string attached", hi: "बिना बँधी डोर", mr: "दोरी न बांधताच" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Explain the design: A-a knife's thin edge, B-a tractor's broad tyres, C-a dam thicker at its base. Which trio of reasons is right?",
          hi: "बनावट समझाइए: अ-चाक़ू की पतली धार, ब-ट्रैक्टर के चौड़े टायर, स-तल पर मोटा बाँध। कारणों की कौन-सी तिकड़ी सही है?",
          mr: "रचना समजावा: अ-सुरीची पातळ धार, ब-ट्रॅक्टरचे रुंद टायर, क-तळाशी जाड धरण. कारणांची कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: small area drives pressure up to cut · B: large area spreads weight so it won't sink · C: water presses hardest at depth, so the wall thickens there",
            hi: "अ: छोटा क्षेत्र दाब चढ़ाकर काटता है · ब: बड़ा क्षेत्र वज़न बिछाता है ताकि धँसे नहीं · स: पानी गहराई में सबसे ज़ोर से दबता है, अतः दीवार वहीं मोटी",
            mr: "अ: लहान क्षेत्र दाब चढवून कापते · ब: मोठे क्षेत्र वजन पसरवते म्हणजे रुतू नये · क: पाणी खोलीत सर्वांत जोरात दाबते, म्हणून भिंत तिथे जाड",
          },
          {
            en: "A: knives are thin to save steel · B: broad tyres look grand · C: dams thicken by mason's habit",
            hi: "अ: चाक़ू स्टील बचाने को पतले · ब: चौड़े टायर शान के लिए · स: बाँध राजगीर की आदत से मोटे",
            mr: "अ: सुऱ्या पोलाद वाचवायला पातळ · ब: रुंद टायर शानीसाठी · क: धरणे गवंड्याच्या सवयीने जाड",
          },
          {
            en: "All three designs share one purpose: speed",
            hi: "तीनों बनावटों का एक ही मक़सद: रफ़्तार",
            mr: "तिन्ही रचनांचा एकच हेतू: वेग",
          },
          {
            en: "A: large area cuts · B: small area floats · C: water presses hardest at the surface",
            hi: "अ: बड़ा क्षेत्र काटता है · ब: छोटा क्षेत्र तैराता है · स: पानी सतह पर सबसे ज़ोर से दबता है",
            mr: "अ: मोठे क्षेत्र कापते · ब: लहान क्षेत्र तरंगवते · क: पाणी पृष्ठावर सर्वांत जोरात दाबते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One formula, three artefacts. Pressure = force/area: the knife shrinks area to multiply bite; the tyre grows area to divide sinking; and the dam answers liquid pressure, which grows with depth — thin lip at the top, buttress at the bottom. Engineering is largely this fraction, read with intent.",
          hi: "एक सूत्र, तीन वस्तुएँ। दाब = बल/क्षेत्रफल: चाक़ू क्षेत्र घटाकर काट बढ़ाता है; टायर क्षेत्र बढ़ाकर धँसाव बाँटता है; और बाँध द्रव-दाब का जवाब है, जो गहराई से बढ़ता है — ऊपर पतला होंठ, तल पर पुश्ता। अभियांत्रिकी बहुत हद तक यही भिन्न है, इरादे से पढ़ी हुई।",
          mr: "एक सूत्र, तीन वस्तू. दाब = बल/क्षेत्रफळ: सुरी क्षेत्र आकसवून चावा वाढवते; टायर क्षेत्र वाढवून रुतणे वाटते; आणि धरण द्रव-दाबाचे उत्तर, जो खोलीने वाढतो — वर पातळ ओठ, तळाशी आधार. अभियांत्रिकी बऱ्याच अंशी हाच अपूर्णांक, हेतूने वाचलेला.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The atmosphere presses on your body with the weight of a small car — yet you feel nothing, while an emptied tin crumples instantly. What separates you from the tin?",
          hi: "वायुमंडल आपके शरीर पर छोटी कार जितने वज़न से दबता है — फिर भी आपको कुछ महसूस नहीं होता, जबकि ख़ाली डिब्बा पल में पिचक जाता है। आपमें और डिब्बे में क्या फ़र्क़ है?",
          mr: "वातावरण तुमच्या शरीरावर छोट्या गाडीइतक्या वजनाने दाबते — तरी तुम्हाला काही जाणवत नाही, तर रिकामा डबा क्षणात चेपतो. तुमच्यात आणि डब्यात फरक काय?",
        },
        choices: [
          {
            en: "Balance: your body's internal pressure pushes outward as hard as the air pushes in; the pumped-out tin lost its inside push, and one-sided pressure did the rest",
            hi: "संतुलन: आपके शरीर का भीतरी दाब उतना ही बाहर धकेलता है जितना हवा भीतर; ख़ाली डिब्बे ने भीतरी धक्का खो दिया, और एकतरफ़ा दाब ने बाक़ी कर दिखाया",
            mr: "समतोल: तुमच्या शरीराचा आतला दाब हवेच्या आतल्या दाबाइतकाच बाहेर ढकलतो; उपसलेल्या डब्याने आतला धक्का गमावला, आणि एकतर्फी दाबाने बाकी करून दाखवले",
          },
          {
            en: "Human skin is simply stronger than tin",
            hi: "मानव त्वचा टिन से बस मज़बूत है",
            mr: "मानवी त्वचा पत्र्याहून नुसती बळकट",
          },
          {
            en: "The atmosphere politely avoids living things",
            hi: "वायुमंडल जीवों से शालीनता से बचता है",
            mr: "वातावरण सजीवांना सभ्यपणे टाळते",
          },
          {
            en: "The tin story is a trick of slow rusting",
            hi: "डिब्बे की कहानी धीमी ज़ंग की चाल है",
            mr: "डब्याची गोष्ट हळू गंजण्याची चलाखी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Pressure hurts only when unopposed. Your lungs, blood and tissues run at the atmosphere's own pressure, so the enormous inward push meets an equal outward one and the net force on every patch of skin is nearly nil. The tin enjoyed the same truce until the pump broke it — air outside, nothing inside, and the walls folded. Divers and astronauts live by this arithmetic: it is never pressure that injures, but pressure DIFFERENCE.",
          hi: "दाब तभी चोट देता है जब उसका सामना न हो। आपके फेफड़े, रक्त और ऊतक वायुमंडल के ही दाब पर चलते हैं, अतः भीतर की विराट धकेल को बराबर की बाहरी धकेल मिलती है और त्वचा के हर टुकड़े पर शुद्ध बल लगभग शून्य है। डिब्बा भी इसी संधि में जीता था जब तक पंप ने उसे तोड़ा नहीं — बाहर हवा, भीतर कुछ नहीं, और दीवारें मुड़ गईं। गोताख़ोर और अंतरिक्षयात्री इसी गणित पर जीते हैं: चोट कभी दाब नहीं देता, दाब का अंतर देता है।",
          mr: "दाब तेव्हाच इजा करतो जेव्हा त्याला विरोध नसतो. तुमची फुप्फुसे, रक्त आणि ऊती वातावरणाच्याच दाबावर चालतात, म्हणून आतल्या प्रचंड रेट्याला तितकाच बाहेरचा रेटा भेटतो आणि त्वचेच्या प्रत्येक तुकड्यावरचे निव्वळ बल जवळजवळ शून्य. डबाही याच तहात जगत होता जोवर पंपाने तो मोडला नाही — बाहेर हवा, आत काही नाही, आणि भिंती दुमडल्या. पाणबुडे आणि अंतराळवीर याच गणितावर जगतात: इजा कधी दाब करत नाही, दाबाचा फरक करतो.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 12 — Friction (the necessary evil)                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-friction",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 12 — Friction",
      hi: "अध्याय 12 — घर्षण",
      mr: "प्रकरण 12 — घर्षण",
    },
    name: { en: "Friction", hi: "घर्षण", mr: "घर्षण" },
    summary: {
      en: "The necessary evil: interlocking roughness that resists all sliding, cheapened by wheels and oil, spent as heat — gripping roads and wearing soles with the same hand.",
      hi: "ज़रूरी बुराई: हर फिसलन का विरोध करता गुँथा खुरदुरापन, पहियों-तेल से सस्ता हुआ, ऊष्मा में ख़र्च — एक ही हाथ से सड़कें थामता और तलवे घिसता।",
      mr: "आवश्यक वाईट: प्रत्येक घसरणीला विरोध करणारा गुंफलेला खरखरीतपणा, चाके-तेलाने स्वस्त झालेला, उष्णतेत खर्चलेला — एकाच हाताने रस्ते धरणारा आणि तळवे झिजवणारा.",
    },
    position: 12,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "friction",
        name: { en: "Friction", hi: "घर्षण", mr: "घर्षण" },
        kind: "force",
        prompt: {
          en: "Which force opposes motion between touching surfaces, born of their microscopic interlocking roughness?",
          hi: "कौन-सा बल छूती सतहों के बीच गति का विरोध करता है, उनके सूक्ष्म गुँथे खुरदुरेपन से जन्मा?",
          mr: "कोणते बल स्पर्शणाऱ्या पृष्ठांमधल्या गतीला विरोध करते, त्यांच्या सूक्ष्म गुंफलेल्या खरखरीतपणातून जन्मलेले?",
        },
        statement: {
          en: "Friction resists sliding — every surface is a mountain range in miniature, and facing ranges interlock.",
          hi: "घर्षण फिसलन का विरोध करता है — हर सतह लघु पर्वतमाला है, और आमने-सामने की मालाएँ गुँथ जाती हैं।",
          mr: "घर्षण घसरणीला विरोध करते — प्रत्येक पृष्ठ म्हणजे लघु पर्वतरांग, आणि समोरासमोरच्या रांगा गुंफतात.",
        },
        detail: {
          en: "It acts opposite to attempted motion — and pushes back even BEFORE anything moves.",
          hi: "वह इरादतन गति के विपरीत लगता है — और कुछ हिलने से पहले ही पलट-धक्का देता है।",
          mr: "ते इच्छित गतीच्या विरुद्ध लागते — आणि काही हलण्याआधीच प्रति-धक्का देते.",
        },
        extra: {
          en: "Nothing walks, writes, knots or brakes without it — a world without friction slides forever.",
          hi: "इसके बिना कुछ भी चलता, लिखता, गाँठ बाँधता या रुकता नहीं — बिना घर्षण की दुनिया सदा फिसलती रहती।",
          mr: "त्याच्याविना काहीही चालत, लिहीत, गाठ बांधत वा थांबत नाही — घर्षणाविनाचे जग कायम घसरत राहिले असते.",
        },
        pair: {
          left: { en: "The opposing force", hi: "विरोधी बल", mr: "विरोधी बल" },
          right: { en: "roughness interlocked", hi: "गुँथा खुरदुरापन", mr: "गुंफलेला खरखरीतपणा" },
        },
      },
      {
        id: "rolling",
        name: { en: "Rolling friction", hi: "लोटनिक घर्षण", mr: "घरंगळ घर्षण" },
        kind: "force",
        prompt: {
          en: "Which kind of friction, far smaller than sliding, is the whole reason wheels changed the world?",
          hi: "कौन-सा घर्षण, फिसलन से कहीं छोटा, वह पूरा कारण है कि पहियों ने दुनिया बदल दी?",
          mr: "कोणते घर्षण, घसरणीहून कितीतरी लहान, हेच सारे कारण आहे की चाकांनी जग बदलले?",
        },
        statement: {
          en: "Rolling friction is sliding's cheaper cousin — wheels and ball bearings ride the discount everywhere.",
          hi: "लोटनिक घर्षण फिसलन का सस्ता चचेरा भाई है — पहिये और बॉल-बेयरिंग हर जगह इसी छूट पर सवार हैं।",
          mr: "घरंगळ घर्षण हे घसरणीचे स्वस्त चुलतभावंड — चाके आणि बॉल-बेअरिंग सर्वत्र याच सुटीवर स्वार.",
        },
        pair: {
          left: { en: "The wheel's discount", hi: "पहिये की छूट", mr: "चाकाची सूट" },
          right: { en: "far below sliding", hi: "फिसलन से बहुत नीचे", mr: "घसरणीहून खूप खाली" },
        },
      },
      {
        id: "lubricants",
        name: { en: "Lubricants", hi: "स्नेहक", mr: "वंगण" },
        kind: "remedy",
        prompt: {
          en: "Oil, grease, graphite powder — which substances float surfaces apart to cut friction down?",
          hi: "तेल, ग्रीस, ग्रेफ़ाइट चूर्ण — कौन-से पदार्थ सतहों को अलगाकर घर्षण घटाते हैं?",
          mr: "तेल, ग्रीस, ग्रॅफाइट चूर्ण — कोणते पदार्थ पृष्ठे विलग तरंगवून घर्षण घटवतात?",
        },
        statement: {
          en: "Lubricants slip a film between surfaces — the mountain ranges never meet, so wear and heat both fall.",
          hi: "स्नेहक सतहों के बीच परत सरका देते हैं — पर्वतमालाएँ मिलती ही नहीं, अतः घिसाई और गर्मी दोनों घटती हैं।",
          mr: "वंगण पृष्ठांमध्ये पातळ थर सरकवते — पर्वतरांगा भेटतच नाहीत, म्हणून झीज आणि उष्णता दोन्ही घटतात.",
        },
        pair: {
          left: { en: "The film between", hi: "बीच की परत", mr: "मधला थर" },
          right: { en: "ranges kept apart", hi: "अलग रखी मालाएँ", mr: "विलग ठेवलेल्या रांगा" },
        },
      },
      {
        id: "friction-heat",
        name: { en: "Friction's heat", hi: "घर्षण की ऊष्मा", mr: "घर्षणाची उष्णता" },
        kind: "effect",
        prompt: {
          en: "Rub your palms, strike a match — which by-product of friction warms the one and lights the other?",
          hi: "हथेलियाँ रगड़िए, माचिस जलाइए — घर्षण की कौन-सी उप-उपज एक को गर्माती और दूसरी को जलाती है?",
          mr: "तळहात चोळा, काडी ओढा — घर्षणाचे कोणते उप-उत्पादन एकाला ऊब देते आणि दुसरीला पेटवते?",
        },
        statement: {
          en: "Friction turns motion into heat — palms warm, matches light, and machines quietly waste power the same way.",
          hi: "घर्षण गति को ऊष्मा बनाता है — हथेलियाँ गर्म, माचिसें रोशन, और मशीनें उसी राह चुपचाप बिजली गँवाती हैं।",
          mr: "घर्षण गतीची उष्णता करते — तळहात गरम, काड्या पेटत्या, आणि यंत्रे त्याच वाटेने गुपचूप शक्ती गमावतात.",
        },
        pair: {
          left: { en: "Motion turned warm", hi: "गर्मी बनी गति", mr: "ऊब झालेली गती" },
          right: {
            en: "palms and matches agree",
            hi: "हथेलियाँ और माचिसें सहमत",
            mr: "तळहात आणि काड्या सहमत",
          },
        },
      },
      {
        id: "treads",
        name: { en: "Treads and soles", hi: "टायर-धारियाँ और तलवे", mr: "टायर-नक्षी आणि तळवे" },
        kind: "design",
        prompt: {
          en: "Tyres and shoe soles carry grooved patterns. What do the grooves buy?",
          hi: "टायरों और जूतों के तलवों पर खाँचेदार नमूने होते हैं। खाँचे क्या ख़रीदते हैं?",
          mr: "टायर आणि बुटांच्या तळव्यांवर खाचांची नक्षी असते. खाचा काय विकत घेतात?",
        },
        statement: {
          en: "Treads grip — they add useful friction and channel rainwater away, trading a little speed for a lot of control.",
          hi: "धारियाँ पकड़ती हैं — उपयोगी घर्षण जोड़ती और बारिश का पानी बहा देती हैं, थोड़ी रफ़्तार देकर बहुत क़ाबू ख़रीदती हुईं।",
          mr: "नक्षी पकडते — उपयुक्त घर्षण जोडते आणि पावसाचे पाणी वाहवते, थोडा वेग देऊन खूप ताबा घेत.",
        },
        pair: {
          left: { en: "The grooved grip", hi: "खाँचेदार पकड़", mr: "खाचांची पकड" },
          right: {
            en: "control bought with friction",
            hi: "घर्षण से ख़रीदा क़ाबू",
            mr: "घर्षणाने घेतलेला ताबा",
          },
        },
      },
      {
        id: "streamlining",
        name: { en: "Streamlining", hi: "धारारेखण", mr: "प्रवाहरेखन" },
        kind: "design",
        prompt: {
          en: "Fish, birds and aeroplanes share which tapered shape that slips past fluid friction (drag)?",
          hi: "मछलियाँ, पंछी और वायुयान कौन-सा नुकीला-ढलवाँ आकार बाँटते हैं जो तरल घर्षण (कर्षण) से बचकर निकलता है?",
          mr: "मासे, पक्षी आणि विमाने कोणता निमुळता आकार वाटून घेतात जो द्रायू घर्षणातून (कर्षणातून) निसटतो?",
        },
        statement: {
          en: "Streamlining parts the fluid gently — drag falls when the shape argues less with the medium it moves through.",
          hi: "धारारेखण तरल को कोमलता से चीरता है — आकार जितना कम माध्यम से झगड़े, कर्षण उतना घटे।",
          mr: "प्रवाहरेखन द्रायूला हळुवार कापते — आकार माध्यमाशी जितका कमी भांडेल, कर्षण तितके घटेल.",
        },
        detail: {
          en: "Air and water both charge every moving body this toll — shape is the only discount on offer.",
          hi: "हवा और पानी हर चलती देह से यह चुंगी लेते हैं — आकार ही इकलौती छूट है।",
          mr: "हवा आणि पाणी प्रत्येक चालत्या देहाकडून हा कर घेतात — आकार हीच एकमेव सूट.",
        },
        extra: {
          en: "Trucks add deflectors and trains grow noses for the same fuel-saving reason.",
          hi: "ट्रक विक्षेपक लगाते हैं और रेलगाड़ियाँ नाक उगाती हैं — उसी ईंधन-बचत के लिए।",
          mr: "ट्रक विक्षेपक लावतात आणि रेल्वेगाड्या नाके वाढवतात — त्याच इंधन-बचतीसाठी.",
        },
        pair: {
          left: { en: "The tapered shape", hi: "ढलवाँ आकार", mr: "निमुळता आकार" },
          right: { en: "drag's discount", hi: "कर्षण की छूट", mr: "कर्षणाची सूट" },
        },
      },
      {
        id: "friend-foe",
        name: {
          en: "Friction, friend and foe",
          hi: "घर्षण: मित्र और शत्रु",
          mr: "घर्षण: मित्र आणि शत्रू",
        },
        kind: "idea",
        prompt: {
          en: "It wears soles and heats machines, yet grips roads and holds every knot. What double role does friction play?",
          hi: "वह तलवे घिसता और मशीनें तपाता है, फिर भी सड़कें थामता और हर गाँठ पकड़ता है। घर्षण कौन-सी दोहरी भूमिका निभाता है?",
          mr: "ते तळवे झिजवते आणि यंत्रे तापवते, तरी रस्ते धरते आणि प्रत्येक गाठ पकडते. घर्षण कोणती दुहेरी भूमिका बजावते?",
        },
        statement: {
          en: "Friction is friend and foe at once — it wastes power and wears parts, yet walking, braking and every knot rent its grip.",
          hi: "घर्षण एक साथ मित्र और शत्रु है — बिजली गँवाता और पुर्ज़े घिसता है, फिर भी चलना, रुकना और हर गाँठ उसकी पकड़ किराये पर लेते हैं।",
          mr: "घर्षण एकाच वेळी मित्र आणि शत्रू — शक्ती गमावते आणि भाग झिजवते, तरी चालणे, थांबणे आणि प्रत्येक गाठ त्याची पकड भाड्याने घेतात.",
        },
        pair: {
          left: { en: "The double agent", hi: "दोहरा किरदार", mr: "दुहेरी हस्तक" },
          right: {
            en: "wears parts, grips roads",
            hi: "पुर्ज़े घिसे, सड़कें थामे",
            mr: "भाग झिजवतो, रस्ते धरतो",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Rank the three frictions from LARGEST to smallest for the same pair of surfaces. Which order is right?",
          hi: "एक ही सतह-जोड़ी के लिए तीनों घर्षणों को बड़े से छोटे क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "एकाच पृष्ठ-जोडीसाठी तिन्ही घर्षणे मोठ्यापासून लहानपर्यंत लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Static (to start moving) > sliding (while sliding) > rolling (on wheels)",
            hi: "स्थैतिक (चलाने के लिए) > सर्पी (फिसलते समय) > लोटनिक (पहियों पर)",
            mr: "स्थितिक (हलवण्यासाठी) > सर्पी (घसरताना) > घरंगळ (चाकांवर)",
          },
          {
            en: "Rolling > sliding > static",
            hi: "लोटनिक > सर्पी > स्थैतिक",
            mr: "घरंगळ > सर्पी > स्थितिक",
          },
          {
            en: "Sliding > rolling > static",
            hi: "सर्पी > लोटनिक > स्थैतिक",
            mr: "सर्पी > घरंगळ > स्थितिक",
          },
          {
            en: "All three are always exactly equal",
            hi: "तीनों सदा ठीक बराबर होते हैं",
            mr: "तिन्ही नेहमी नेमकी समान असतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Starting is hardest: at rest the surface-ranges settle deepest into each other, so static friction tops the list. Once sliding, the peaks skip instead of settling — sliding friction is less. Rolling barely gives the ranges time to touch at all. This is why a heavy trunk YIELDS suddenly once it starts, and why the wheel is civilisation's favourite discount.",
          hi: "शुरू करना सबसे कठिन है: ठहराव में सतह-मालाएँ एक-दूसरे में सबसे गहरा बैठ जाती हैं, अतः स्थैतिक घर्षण सूची के शीर्ष पर। फिसलन शुरू होते ही चोटियाँ बैठने की जगह फलाँगती हैं — सर्पी घर्षण कम है। लोटन में मालाओं को छूने तक की फ़ुरसत मुश्किल से मिलती है। इसीलिए भारी संदूक़ चलते ही अचानक 'मान' जाता है, और पहिया सभ्यता की प्रिय छूट है।",
          mr: "सुरुवात सर्वांत कठीण: स्थिरावस्थेत पृष्ठ-रांगा एकमेकींत सर्वांत खोल बसतात, म्हणून स्थितिक घर्षण यादीच्या शिरोभागी. घसरण सुरू होताच शिखरे बसण्याऐवजी उड्या मारतात — सर्पी घर्षण कमी. घरंगळण्यात रांगांना स्पर्शायलाही जेमतेम वेळ मिळतो. म्हणूनच जड पेटी हलताच अचानक 'ऐकते', आणि चाक ही संस्कृतीची आवडती सूट.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Kabaddi players rub their palms with soil; carrom players dust the board with fine powder. Same human hands — why opposite treatments?",
          hi: "कबड्डी खिलाड़ी हथेलियों पर मिट्टी मलते हैं; कैरम खिलाड़ी बोर्ड पर महीन पाउडर छिड़कते हैं। हाथ वही मानवी — बर्ताव उलटे क्यों?",
          mr: "कबड्डीपटू तळहातांना माती चोळतात; कॅरमपटू पटावर बारीक पावडर भुरभुरतात. हात तेच मानवी — वागणूक उलटी का?",
        },
        choices: [
          {
            en: "Each game hires the friction it needs: soil dries sweat and RAISES grip for holding an opponent, powder fills the board's roughness and LOWERS friction so the striker glides — friction is a dial, not a fate",
            hi: "हर खेल अपनी ज़रूरत का घर्षण किराये पर लेता है: मिट्टी पसीना सुखाकर पकड़ बढ़ाती है ताकि विरोधी थामा जाए, पाउडर बोर्ड का खुरदुरापन भरकर घर्षण घटाता है ताकि स्ट्राइकर सरके — घर्षण घुंडी है, नियति नहीं",
            mr: "प्रत्येक खेळ आपल्या गरजेचे घर्षण कामावर घेतो: माती घाम सुकवून पकड वाढवते म्हणजे प्रतिस्पर्धी धरता यावा, पावडर पटाचा खरखरीतपणा भरून घर्षण घटवते म्हणजे स्ट्रायकर सरकावा — घर्षण ही फिरकी आहे, नियती नाही",
          },
          {
            en: "Soil and powder are the same substance under different names",
            hi: "मिट्टी और पाउडर अलग नामों का एक ही पदार्थ हैं",
            mr: "माती आणि पावडर वेगळ्या नावांचा एकच पदार्थ",
          },
          {
            en: "Both habits are pure superstition with no physics",
            hi: "दोनों आदतें बिना भौतिकी का शुद्ध अंधविश्वास हैं",
            mr: "दोन्ही सवयी भौतिकशास्त्र नसलेली निव्वळ अंधश्रद्धा",
          },
          {
            en: "Carrom powder works by cooling the board",
            hi: "कैरम-पाउडर बोर्ड ठंडा करके काम करता है",
            mr: "कॅरम-पावडर पट थंड करून काम करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Friction has no loyalty; it serves whoever sets the surfaces. The kabaddi raider needs grip — dry soil sharpens the palm's micro-ranges and soaks the sweat that would lubricate an escape. The carrom striker needs glide — powder beds into the board's valleys and rolls like a million tiny bearings. Two games, two settings of the same dial, and the whole chapter in one contrast: we do not endure friction, we TUNE it.",
          hi: "घर्षण की कोई वफ़ादारी नहीं; जो सतहें सजाए, उसी की सेवा करता है। कबड्डी के धावक को पकड़ चाहिए — सूखी मिट्टी हथेली की सूक्ष्म-मालाएँ पैनी करती है और वह पसीना सोखती है जो बचकर निकलने की चिकनाई बनता। कैरम के खिलाड़ी को सरकन चाहिए — पाउडर बोर्ड की घाटियों में बिछकर लाखों नन्हे बेयरिंगों-सा लुढ़कता है। दो खेल, एक ही घुंडी की दो सेटिंगें, और पूरा अध्याय एक विरोध में: हम घर्षण झेलते नहीं, साधते हैं।",
          mr: "घर्षणाची निष्ठा नाही; जो पृष्ठे मांडेल त्याची सेवा करते. कबड्डीच्या चढाईपटूला पकड हवी — कोरडी माती तळहाताच्या सूक्ष्म-रांगा धारदार करते आणि निसटण्याचे वंगण होणारा घाम शोषते. कॅरमपटूला सरक हवी — पावडर पटाच्या दऱ्यांत बसून लाखो इवल्या बेअरिंगांसारखी घरंगळते. दोन खेळ, एकाच फिरकीच्या दोन जुळण्या, आणि अख्खे प्रकरण एका विरोधात: आपण घर्षण सोसत नाही, जुळवतो.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 13 — Sound (vibration, carried and heard)                       */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-8-sound",
    subject: "SCIENCE",
    classLevel: 8,
    chapter: {
      en: "Chapter 13 — Sound",
      hi: "अध्याय 13 — ध्वनि",
      mr: "प्रकरण 13 — ध्वनी",
    },
    name: { en: "Sound", hi: "ध्वनि", mr: "ध्वनी" },
    summary: {
      en: "Every sound a vibration, every vibration needing a carrier: pitch counted in hertz, loudness in swing, hearing fenced between 20 and 20,000 — and loudness itself turning injury past the fence.",
      hi: "हर ध्वनि एक कंपन, हर कंपन को चाहिए वाहक: हर्ट्ज़ में गिनी पिच, झूले में नपी प्रबलता, 20 से 20,000 के बीच घिरी सुनवाई — और हद पार होते ही चोट बन जाती प्रबलता।",
      mr: "प्रत्येक ध्वनी एक कंपन, प्रत्येक कंपनाला हवा वाहक: हर्ट्झमध्ये मोजलेली पट्टी, झोक्यात मोजलेला मोठेपणा, 20 ते 20,000 मध्ये कुंपणलेले ऐकणे — आणि मर्यादा ओलांडताच इजा होणारा मोठेपणा.",
    },
    position: 13,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "vibration",
        name: { en: "Vibration", hi: "कंपन", mr: "कंपन" },
        kind: "origin",
        prompt: {
          en: "Pluck a string, tap a drum: which to-and-fro motion is the birth of every sound?",
          hi: "तार छेड़िए, ढोल थपथपाइए: कौन-सी आगे-पीछे की गति हर ध्वनि का जन्म है?",
          mr: "तार छेडा, ढोल थापा: कोणती पुढे-मागे गती प्रत्येक ध्वनीचा जन्म आहे?",
        },
        statement: {
          en: "All sound begins in vibration — something must shake for anything to be heard.",
          hi: "हर ध्वनि कंपन से शुरू होती है — कुछ सुनाई देने के लिए कुछ काँपना ही चाहिए।",
          mr: "प्रत्येक ध्वनी कंपनातून सुरू होतो — काही ऐकू येण्यासाठी काहीतरी थरथरलेच पाहिजे.",
        },
        detail: {
          en: "Touch a ringing bell and the sound dies with the trembling — the proof sits at your fingertip.",
          hi: "बजती घंटी छूइए और थरथराहट के साथ आवाज़ मर जाती है — प्रमाण आपकी उँगली पर धरा है।",
          mr: "वाजणारी घंटा स्पर्शा आणि थरथरीसोबत आवाज मरतो — पुरावा तुमच्या बोटावर आहे.",
        },
        extra: {
          en: "Voice is vibration too — fingers on the throat feel the larynx hum as you speak.",
          hi: "आवाज़ भी कंपन है — गले पर उँगलियाँ रखिए तो बोलते हुए स्वरयंत्र गुनगुनाता महसूस होता है।",
          mr: "आवाजही कंपनच — गळ्यावर बोटे ठेवा आणि बोलताना स्वरयंत्राची गुणगुण जाणवते.",
        },
        pair: {
          left: { en: "The to-and-fro birth", hi: "आगे-पीछे का जन्म", mr: "पुढे-मागेचा जन्म" },
          right: { en: "no shake, no sound", hi: "कंपन नहीं तो ध्वनि नहीं", mr: "थरथर नाही तर ध्वनी नाही" },
        },
      },
      {
        id: "medium",
        name: { en: "The medium", hi: "माध्यम", mr: "माध्यम" },
        kind: "carrier",
        prompt: {
          en: "Sound crosses air, water and steel but dies in vacuum. What does it always need to travel?",
          hi: "ध्वनि हवा, पानी और इस्पात पार करती है पर निर्वात में मर जाती है। सफ़र के लिए उसे सदा क्या चाहिए?",
          mr: "ध्वनी हवा, पाणी आणि पोलाद पार करतो पण निर्वातात मरतो. प्रवासासाठी त्याला नेहमी काय लागते?",
        },
        statement: {
          en: "Sound needs a medium — particle jostling particle down the line; in vacuum there is no one to pass the message.",
          hi: "ध्वनि को माध्यम चाहिए — कण कण को क़तार में धकियाता चले; निर्वात में संदेश थमाने वाला कोई नहीं।",
          mr: "ध्वनीला माध्यम हवे — कण कणाला रांगेत ढकलत जाणारा; निर्वातात निरोप देणारे कोणी नाही.",
        },
        detail: {
          en: "The bell in the evacuated jar fades as air is pumped out — still seen ringing, no longer heard.",
          hi: "निर्वात-जार की घंटी हवा निकलते-निकलते धीमी पड़ती है — बजती दिखती है, सुनाई नहीं देती।",
          mr: "निर्वात-बरणीतली घंटा हवा उपसताना विरत जाते — वाजताना दिसते, ऐकू येत नाही.",
        },
        extra: {
          en: "The moon's silence is a vacuum fact, not a mood — no air, no messenger.",
          hi: "चाँद की ख़ामोशी निर्वात का तथ्य है, मिज़ाज नहीं — हवा नहीं तो संदेशवाहक नहीं।",
          mr: "चंद्राची शांतता ही निर्वाताची वस्तुस्थिती, मूड नाही — हवा नाही तर निरोप्या नाही.",
        },
        pair: {
          left: { en: "The needed carrier", hi: "ज़रूरी वाहक", mr: "आवश्यक वाहक" },
          right: { en: "vacuum's silence", hi: "निर्वात की ख़ामोशी", mr: "निर्वाताची शांतता" },
        },
      },
      {
        id: "eardrum",
        name: { en: "The eardrum", hi: "कान का परदा", mr: "कानाचा पडदा" },
        kind: "organ",
        prompt: {
          en: "Which stretched membrane in the ear trembles with arriving sound and relays the message inward?",
          hi: "कान की कौन-सी तनी झिल्ली आती ध्वनि से काँपती है और संदेश भीतर पहुँचाती है?",
          mr: "कानातला कोणता ताणलेला पडदा येणाऱ्या ध्वनीने थरथरतो आणि निरोप आत पोहोचवतो?",
        },
        statement: {
          en: "The eardrum vibrates with incoming sound — a drumhead played by the air, relayed inward by tiny bones.",
          hi: "कान का परदा आती ध्वनि से काँपता है — हवा से बजता ढोल-चर्म, नन्ही हड्डियों से भीतर पहुँचाया हुआ।",
          mr: "कानाचा पडदा येणाऱ्या ध्वनीने कंपतो — हवेने वाजवलेले ढोल-चर्म, इवल्या हाडांनी आत पोहोचवलेले.",
        },
        pair: {
          left: { en: "The drum in the ear", hi: "कान के भीतर का ढोल", mr: "कानातला ढोल" },
          right: {
            en: "played by arriving air",
            hi: "आती हवा से बजता",
            mr: "येणाऱ्या हवेने वाजणारा",
          },
        },
      },
      {
        id: "frequency",
        name: {
          en: "Frequency and pitch",
          hi: "आवृत्ति और तारत्व",
          mr: "वारंवारता आणि पट्टी",
        },
        kind: "property",
        prompt: {
          en: "Which count of vibrations per second decides how shrill or deep a sound is?",
          hi: "प्रति सेकंड कंपनों की कौन-सी गिनती तय करती है कि ध्वनि कितनी तीखी या गहरी होगी?",
          mr: "दर सेकंदाला कंपनांची कोणती मोजणी ठरवते की ध्वनी किती तीक्ष्ण वा खोल असेल?",
        },
        statement: {
          en: "Frequency sets pitch — more oscillations a second, shriller sound: a baby's voice outruns a buffalo's.",
          hi: "आवृत्ति तारत्व तय करती है — प्रति सेकंड जितने ज़्यादा दोलन, उतनी तीखी आवाज़: शिशु का स्वर भैंस से आगे दौड़ता है।",
          mr: "वारंवारता पट्टी ठरवते — सेकंदाला जितकी जास्त आंदोलने, तितका तीक्ष्ण आवाज: बाळाचा स्वर म्हशीच्या पुढे धावतो.",
        },
        detail: {
          en: "It is counted in hertz — one hertz, one vibration each second.",
          hi: "उसे हर्ट्ज़ में गिनते हैं — एक हर्ट्ज़ यानी हर सेकंड एक कंपन।",
          mr: "ती हर्ट्झमध्ये मोजतात — एक हर्ट्झ म्हणजे दर सेकंदाला एक कंपन.",
        },
        extra: {
          en: "Tighten a string and it quickens and shrills; slacken it and it slows and deepens.",
          hi: "तार कसिए तो वह तेज़ और तीखा होता है; ढीला कीजिए तो धीमा और गहरा।",
          mr: "तार आवळा आणि ती जलद-तीक्ष्ण होते; सैल करा आणि मंद-खोल.",
        },
        pair: {
          left: { en: "Vibrations per second", hi: "प्रति सेकंड कंपन", mr: "दर सेकंदाला कंपने" },
          right: {
            en: "shrill or deep decided",
            hi: "तीखा या गहरा तय",
            mr: "तीक्ष्ण वा खोल ठरलेले",
          },
        },
      },
      {
        id: "amplitude",
        name: {
          en: "Amplitude and loudness",
          hi: "आयाम और प्रबलता",
          mr: "आयाम आणि मोठेपणा",
        },
        kind: "property",
        prompt: {
          en: "Which size of the vibration's swing decides soft whisper against deafening shout?",
          hi: "कंपन के झूले का कौन-सा आकार तय करता है — धीमी फुसफुसाहट या बहरा करती चीख़?",
          mr: "कंपनाच्या झोक्याचा कोणता आकार ठरवतो — हळू कुजबुज की बहिरे करणारी आरोळी?",
        },
        statement: {
          en: "Amplitude sets loudness — the wider the swing, the louder the sound: strike harder, hear louder.",
          hi: "आयाम प्रबलता तय करता है — झूला जितना चौड़ा, आवाज़ उतनी ऊँची: ज़ोर से मारिए, ज़ोर से सुनिए।",
          mr: "आयाम मोठेपणा ठरवतो — झोका जितका रुंद, आवाज तितका मोठा: जोरात मारा, जोरात ऐका.",
        },
        pair: {
          left: { en: "The swing's width", hi: "झूले की चौड़ाई", mr: "झोक्याची रुंदी" },
          right: {
            en: "whisper or shout decided",
            hi: "फुसफुसाहट या चीख़ तय",
            mr: "कुजबुज वा आरोळी ठरलेली",
          },
        },
      },
      {
        id: "audible-range",
        name: { en: "The audible range", hi: "श्रव्य परास", mr: "श्रवणीय पल्ला" },
        kind: "limit",
        prompt: {
          en: "Between which two frequencies — 20 and 20,000 hertz — does human hearing live?",
          hi: "किन दो आवृत्तियों — 20 और 20,000 हर्ट्ज़ — के बीच मानव श्रवण बसता है?",
          mr: "कोणत्या दोन वारंवारता — 20 आणि 20,000 हर्ट्झ — यांच्यामध्ये मानवी श्रवण राहते?",
        },
        statement: {
          en: "We hear from about 20 to 20,000 hertz — below lies infrasound, above ultrasound: dogs and bats read pages closed to us.",
          hi: "हम लगभग 20 से 20,000 हर्ट्ज़ तक सुनते हैं — नीचे अवश्रव्य, ऊपर पराश्रव्य: कुत्ते और चमगादड़ हमारे लिए बंद पन्ने पढ़ते हैं।",
          mr: "आपण सुमारे 20 ते 20,000 हर्ट्झ ऐकतो — खाली अवश्राव्य, वर श्राव्यातीत: कुत्रे आणि वटवाघळे आपल्याला बंद पाने वाचतात.",
        },
        pair: {
          left: { en: "20 to 20,000 hertz", hi: "20 से 20,000 हर्ट्ज़", mr: "20 ते 20,000 हर्ट्झ" },
          right: {
            en: "hearing's fenced field",
            hi: "सुनवाई का घिरा खेत",
            mr: "श्रवणाचे कुंपणलेले शेत",
          },
        },
      },
      {
        id: "noise-music",
        name: { en: "Noise and music", hi: "शोर और संगीत", mr: "गोंगाट आणि संगीत" },
        kind: "idea",
        prompt: {
          en: "Regular, pleasant vibrations against irregular, jarring ones — which pair of labels sorts every sound we hear?",
          hi: "नियमित, सुखद कंपन बनाम अनियमित, कर्कश — कौन-सी जोड़ी हर सुनी ध्वनि को छाँटती है?",
          mr: "नियमित, सुखद कंपने विरुद्ध अनियमित, कर्कश — कोणती जोडी प्रत्येक ऐकलेल्या ध्वनीची निवड करते?",
        },
        statement: {
          en: "Music is ordered vibration, noise disordered — and unwanted sound, however sweet, turns noise by context.",
          hi: "संगीत सुव्यवस्थित कंपन है, शोर अस्तव्यस्त — और अनचाही ध्वनि, चाहे जितनी मीठी, संदर्भ से शोर बन जाती है।",
          mr: "संगीत म्हणजे सुव्यवस्थित कंपन, गोंगाट अस्ताव्यस्त — आणि नको असलेला ध्वनी, कितीही गोड, संदर्भाने गोंगाट होतो.",
        },
        pair: {
          left: {
            en: "Ordered against jarring",
            hi: "सुव्यवस्थित बनाम कर्कश",
            mr: "सुव्यवस्थित विरुद्ध कर्कश",
          },
          right: {
            en: "context crowns the noise",
            hi: "संदर्भ ही शोर का ताज",
            mr: "संदर्भच गोंगाटाचा मुकुट",
          },
        },
      },
      {
        id: "noise-pollution",
        name: { en: "Noise pollution", hi: "ध्वनि प्रदूषण", mr: "ध्वनिप्रदूषण" },
        kind: "harm",
        prompt: {
          en: "Horns, loudspeakers, machinery — which environmental harm damages hearing and sleep by sheer loudness?",
          hi: "हॉर्न, लाउडस्पीकर, मशीनें — कौन-सी पर्यावरणीय हानि केवल प्रबलता से सुनवाई और नींद बिगाड़ती है?",
          mr: "हॉर्न, ध्वनिक्षेपक, यंत्रे — कोणती पर्यावरणीय हानी नुसत्या मोठेपणाने श्रवण आणि झोप बिघडवते?",
        },
        statement: {
          en: "Noise pollution is loudness as injury — persistent din that erodes hearing, sleep and attention alike.",
          hi: "ध्वनि प्रदूषण चोट बनी प्रबलता है — लगातार का कोलाहल, जो सुनवाई, नींद और एकाग्रता तीनों घिसता है।",
          mr: "ध्वनिप्रदूषण म्हणजे इजा झालेला मोठेपणा — सततचा गदारोळ, जो श्रवण, झोप आणि एकाग्रता तिन्ही झिजवतो.",
        },
        detail: {
          en: "Long exposure above safe levels dulls hearing permanently — the loss arrives without pain and without return.",
          hi: "सुरक्षित स्तर से ऊपर लंबा संपर्क सुनवाई सदा के लिए मंद कर देता है — नुक़सान बिना दर्द आता है, बिना वापसी।",
          mr: "सुरक्षित पातळीवरचा दीर्घ संपर्क श्रवण कायमचे मंद करतो — हानी वेदनेविना येते, परतीविना.",
        },
        extra: {
          en: "Trees and walls baffle sound — planting a row of neems is also soundproofing.",
          hi: "पेड़ और दीवारें ध्वनि रोकती हैं — नीम की क़तार लगाना भी ध्वनिरोधन है।",
          mr: "झाडे आणि भिंती ध्वनी अडवतात — कडुनिंबांची रांग लावणे हेही ध्वनिरोधनच.",
        },
        pair: {
          left: { en: "Loudness as injury", hi: "चोट बनी प्रबलता", mr: "इजा झालेला मोठेपणा" },
          right: {
            en: "hearing eroded quietly",
            hi: "चुपचाप घिसी सुनवाई",
            mr: "गुपचूप झिजलेले श्रवण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the property to what it controls: A-frequency, B-amplitude, C-the 20–20,000 Hz range. Which trio is right?",
          hi: "गुण को उसके नियंत्रण से मिलाइए: अ-आवृत्ति, ब-आयाम, स-20–20,000 हर्ट्ज़ की परास। कौन-सी तिकड़ी सही है?",
          mr: "गुणधर्माला त्याच्या नियंत्रणाशी जुळवा: अ-वारंवारता, ब-आयाम, क-20–20,000 हर्ट्झचा पल्ला. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: pitch (shrill or deep) · B: loudness (soft or loud) · C: audibility (heard at all or not)",
            hi: "अ: तारत्व (तीखा या गहरा) · ब: प्रबलता (धीमा या ऊँचा) · स: श्रव्यता (सुनाई दे या नहीं)",
            mr: "अ: पट्टी (तीक्ष्ण वा खोल) · ब: मोठेपणा (हळू वा मोठा) · क: श्रवणीयता (ऐकू येते की नाही)",
          },
          {
            en: "A: loudness · B: audibility · C: pitch",
            hi: "अ: प्रबलता · ब: श्रव्यता · स: तारत्व",
            mr: "अ: मोठेपणा · ब: श्रवणीयता · क: पट्टी",
          },
          {
            en: "A: audibility · B: pitch · C: loudness",
            hi: "अ: श्रव्यता · ब: तारत्व · स: प्रबलता",
            mr: "अ: श्रवणीयता · ब: पट्टी · क: मोठेपणा",
          },
          {
            en: "All three control the sound's speed",
            hi: "तीनों ध्वनि की चाल नियंत्रित करते हैं",
            mr: "तिन्ही ध्वनीचा वेग नियंत्रित करतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three independent dials on one sound: how OFTEN it vibrates sets pitch, how WIDE it swings sets loudness, and whether the frequency lands inside the human fence decides if it is heard at all. A dog whistle proves their independence — loud and shrill, yet outside our fence, so silent to us.",
          hi: "एक ध्वनि पर तीन स्वतंत्र घुंडियाँ: कितनी बार काँपे — तारत्व; कितना चौड़ा झूले — प्रबलता; और आवृत्ति मानव-बाड़े के भीतर उतरे या नहीं — श्रव्यता। कुत्ते की सीटी इनकी स्वतंत्रता सिद्ध करती है — ऊँची और तीखी, फिर भी हमारे बाड़े से बाहर, अतः हमारे लिए मौन।",
          mr: "एका ध्वनीवर तीन स्वतंत्र फिरक्या: किती वेळा कंपते — पट्टी; किती रुंद झुलते — मोठेपणा; आणि वारंवारता मानवी कुंपणात उतरते की नाही — श्रवणीयता. कुत्र्याची शिट्टी त्यांचे स्वातंत्र्य सिद्ध करते — मोठी आणि तीक्ष्ण, तरी आपल्या कुंपणाबाहेर, म्हणून आपल्यासाठी मूक.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Lightning is SEEN at once; its thunder arrives seconds later — and villagers count the gap to judge the storm's distance. Why does the counting work?",
          hi: "बिजली तुरंत दिखती है; उसकी गरज सेकंडों बाद पहुँचती है — और गाँव वाले अंतराल गिनकर तूफ़ान की दूरी आँकते हैं। गिनती काम क्यों करती है?",
          mr: "वीज लगेच दिसते; तिचा गडगडाट सेकंदांनी पोहोचतो — आणि गावकरी मधले अंतर मोजून वादळाचे अंतर जोखतात. मोजणी का चालते?",
        },
        choices: [
          {
            en: "Light arrives almost instantly but sound plods at ~330 m/s — so every 3 counted seconds put the strike about a kilometre away: the gap IS the distance, in disguise",
            hi: "प्रकाश लगभग तुरंत पहुँचता है पर ध्वनि ~330 मी/से की चाल से रेंगती है — अतः गिने गए हर 3 सेकंड बिजली को क़रीब एक किलोमीटर दूर रखते हैं: अंतराल ही दूरी है, भेस बदले",
            mr: "प्रकाश जवळजवळ लगेच पोहोचतो पण ध्वनी ~330 मी/से वेगाने रांगतो — म्हणून मोजलेले दर 3 सेकंद विजेला सुमारे एक किलोमीटर दूर ठेवतात: मधले अंतर हेच अंतर, वेष बदललेले",
          },
          {
            en: "Thunder is created seconds after the lightning, far away",
            hi: "गरज बिजली के सेकंडों बाद, दूर कहीं बनती है",
            mr: "गडगडाट विजेनंतर सेकंदांनी, दूर कुठे बनतो",
          },
          {
            en: "The counting is folklore with no physical basis",
            hi: "गिनती बिना भौतिक आधार की लोक-रीत है",
            mr: "मोजणी भौतिक आधार नसलेली लोकरीत",
          },
          {
            en: "Sound speeds up in storms, confusing the estimate",
            hi: "तूफ़ान में ध्वनि तेज़ हो जाती है, अनुमान बिगाड़ती हुई",
            mr: "वादळात ध्वनी वेगावतो, अंदाज बिघडवत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Flash and boom are born together at the same spark; only their journeys differ. Light covers the distance in a microsecond's fraction — effectively instant. Sound must jostle particle to particle at about 330 metres each second, so it spends roughly 3 seconds on every kilometre. The villager's count is a speed-of-sound calculation performed on fingers — physics folk-worn but exact, and the same idea behind sonar and echo-depth measuring.",
          hi: "चमक और गरज एक ही चिंगारी पर साथ जन्मती हैं; केवल उनकी यात्राएँ अलग हैं। प्रकाश दूरी माइक्रोसेकंड के अंश में पार करता है — व्यावहारिक रूप से तुरंत। ध्वनि को कण-दर-कण धकियाते चलना है, हर सेकंड लगभग 330 मीटर — अतः हर किलोमीटर पर क़रीब 3 सेकंड। गाँव वाले की गिनती उँगलियों पर की गई ध्वनि-चाल की गणना है — लोक-घिसी पर सटीक भौतिकी, और सोनार व प्रतिध्वनि-गहराई नापने के पीछे भी यही विचार है।",
          mr: "लखलखाट आणि गडगडाट एकाच ठिणगीवर एकत्र जन्मतात; फक्त त्यांचे प्रवास वेगळे. प्रकाश अंतर मायक्रोसेकंदाच्या अंशात पार करतो — व्यवहारतः लगेच. ध्वनीला कणाकणाने ढकलत जायचे आहे, दर सेकंदाला सुमारे 330 मीटर — म्हणून दर किलोमीटरला जवळजवळ 3 सेकंद. गावकऱ्याची मोजणी म्हणजे बोटांवर केलेले ध्वनिवेगाचे गणित — लोक-झिजलेले पण अचूक भौतिकशास्त्र, आणि सोनार व प्रतिध्वनी-खोली मोजण्यामागेही हीच कल्पना.",
        },
      },
    ],
  },
];
