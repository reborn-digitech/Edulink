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
];
