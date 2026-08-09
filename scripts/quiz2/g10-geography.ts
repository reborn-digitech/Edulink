/**
 * Class 10 Geography — NCERT "Contemporary India – II", chapter by chapter,
 * through the conceptual engine. India read as a working country rather than a
 * list: soils that decide crops, forests defended by the people who live in
 * them, water counted before it is dammed, and every resource asked the same
 * question — who gets it, and what does the getting cost.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Contemporary India – II (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

export const G10_GEOGRAPHY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Resources and Development                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-resources-development",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 1 — Resources and Development",
      hi: "अध्याय 1 — संसाधन एवं विकास",
      mr: "प्रकरण 1 — संसाधने आणि विकास",
    },
    name: {
      en: "Resources and Development",
      hi: "संसाधन एवं विकास",
      mr: "संसाधने आणि विकास",
    },
    summary: {
      en: "What a country has and what it can use are two different lists: the plan that matches a region's endowment to its needs, the difference between a known deposit and a usable one, and the four great soils whose grain size, colour and thirst quietly decide which crop a district grows — and how each is lost.",
      hi: "किसी देश के पास क्या है और वह क्या इस्तेमाल कर सकता है — ये दो अलग सूचियाँ हैं: वह योजना जो किसी क्षेत्र की संपदा को उसकी ज़रूरतों से मिलाती है, ज्ञात भंडार और उपयोग योग्य भंडार का अंतर, और वे चार बड़ी मिट्टियाँ जिनका कण-आकार, रंग और प्यास चुपचाप तय करते हैं कि कोई ज़िला कौन-सी फ़सल उगाएगा — और हर एक कैसे खोई जाती है।",
      mr: "एखाद्या देशाकडे काय आहे आणि तो काय वापरू शकतो या दोन वेगळ्या याद्या आहेत: एखाद्या प्रदेशाची संपदा त्याच्या गरजांशी जुळवणारी योजना, ज्ञात साठा आणि वापरण्याजोगा साठा यांतील फरक, आणि त्या चार मोठ्या मृदा ज्यांचा कणआकार, रंग आणि तहान गुपचूप ठरवतात की एखादा जिल्हा कोणते पीक घेईल — आणि प्रत्येक कशी हरवते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "resource-planning",
        name: {
          en: "Resource planning",
          hi: "संसाधन नियोजन",
          mr: "संसाधन नियोजन",
        },
        kind: "idea",
        prompt: {
          en: "Rajasthan has sunshine and wind but little water; Jharkhand has coal and iron but poor infrastructure; Arunachal has rivers but no easy roads. Which exercise takes stock of what each region has and matches it to what each region needs?",
          hi: "राजस्थान के पास धूप और पवन हैं पर पानी कम; झारखंड के पास कोयला और लोहा हैं पर ढाँचा कमज़ोर; अरुणाचल के पास नदियाँ हैं पर सुगम सड़कें नहीं। कौन-सा कार्य यह लेखा-जोखा लेता है कि हर क्षेत्र के पास क्या है और उसे उसकी ज़रूरत से मिलाता है?",
          mr: "राजस्थानकडे ऊन आणि वारा आहेत पण पाणी कमी; झारखंडकडे कोळसा आणि लोखंड आहेत पण पायाभूत सुविधा दुर्बळ; अरुणाचलकडे नद्या आहेत पण सुलभ रस्ते नाहीत. कोणते काम प्रत्येक प्रदेशाकडे काय आहे याचा हिशोब घेते आणि त्याला त्याच्या गरजेशी जुळवते?",
        },
        statement: {
          en: "Resource planning is the widely accepted strategy of surveying and mapping what resources a region holds, matching them to appropriate technology and institutions, and aligning the plan with the region's own development needs.",
          hi: "संसाधन नियोजन वह व्यापक रूप से स्वीकृत रणनीति है जो किसी क्षेत्र के संसाधनों का सर्वेक्षण और मानचित्रण करती है, उन्हें उपयुक्त तकनीक तथा संस्थाओं से मिलाती है, और योजना को उस क्षेत्र की अपनी विकास-ज़रूरतों के अनुरूप बिठाती है।",
          mr: "संसाधन नियोजन ही व्यापकपणे स्वीकारलेली रणनीती आहे जी एखाद्या प्रदेशाच्या संसाधनांचे सर्वेक्षण आणि नकाशांकन करते, त्यांना योग्य तंत्रज्ञान व संस्थांशी जुळवते, आणि योजना त्या प्रदेशाच्या स्वतःच्या विकास-गरजांशी सुसंगत करते.",
        },
        detail: {
          en: "It is needed because resources are distributed most unevenly — some states are rich in one thing and poor in everything else.",
          hi: "यह इसलिए चाहिए कि संसाधन अत्यंत असमान रूप से बँटे हैं — कुछ राज्य एक चीज़ में धनी और बाक़ी सब में निर्धन हैं।",
          mr: "ती यासाठी लागते की संसाधने अत्यंत असमानपणे वाटलेली आहेत — काही राज्ये एका गोष्टीत श्रीमंत आणि बाकी सर्वांत गरीब.",
        },
        extra: {
          en: "A stock of minerals guarantees nothing on its own: several resource-rich districts remain among the poorest, because ownership, technology and institutions decide who benefits.",
          hi: "खनिजों का भंडार अपने आप कुछ भी सुनिश्चित नहीं करता: कई संसाधन-समृद्ध ज़िले सबसे निर्धनों में बने हुए हैं, क्योंकि स्वामित्व, तकनीक और संस्थाएँ तय करती हैं कि लाभ किसे मिले।",
          mr: "खनिजांचा साठा स्वतःहून काहीही खात्री देत नाही: अनेक संसाधन-समृद्ध जिल्हे सर्वांत गरिबांत राहिले आहेत, कारण मालकी, तंत्रज्ञान आणि संस्था ठरवतात की फायदा कोणाला मिळेल.",
        },
        pair: {
          left: {
            en: "Survey, match to technology, align to needs",
            hi: "सर्वेक्षण, तकनीक से मिलान, ज़रूरतों से संरेखण",
            mr: "सर्वेक्षण, तंत्रज्ञानाशी जुळणी, गरजांशी संरेखन",
          },
          right: {
            en: "resource planning",
            hi: "संसाधन नियोजन",
            mr: "संसाधन नियोजन",
          },
        },
      },
      {
        id: "stock-and-reserves",
        name: {
          en: "Stock and reserves",
          hi: "भंडार और संचित कोष",
          mr: "साठा आणि राखीव",
        },
        kind: "idea",
        prompt: {
          en: "Water holds hydrogen that could fuel the world, but we lack the technology to release it cheaply; coal in a mapped seam, by contrast, can be dug tomorrow. Which pair of terms marks that difference?",
          hi: "पानी में वह हाइड्रोजन है जो दुनिया को ईंधन दे सकता, पर उसे सस्ते में निकालने की तकनीक हमारे पास नहीं; इसके विपरीत मानचित्रित परत का कोयला कल ही खोदा जा सकता है। कौन-सी शब्द-जोड़ी यह अंतर बताती है?",
          mr: "पाण्यात तो हायड्रोजन आहे जो जगाला इंधन देऊ शकतो, पण तो स्वस्तात मोकळा करण्याचे तंत्रज्ञान आपल्याकडे नाही; याउलट नकाशांकित थरातील कोळसा उद्याच खणता येतो. कोणती शब्द-जोडी हा फरक दाखवते?",
        },
        statement: {
          en: "Stock is the part of a country's endowment that cannot be used because the technology to access it does not yet exist, while reserves are the part that is known, accessible and usable with present technology.",
          hi: "भंडार किसी देश की उस संपदा का हिस्सा है जिसे इसलिए इस्तेमाल नहीं किया जा सकता कि उस तक पहुँचने की तकनीक अभी है ही नहीं, जबकि संचित कोष वह हिस्सा है जो ज्ञात, सुलभ और वर्तमान तकनीक से उपयोग योग्य है।",
          mr: "साठा म्हणजे देशाच्या त्या संपदेचा भाग जो यासाठी वापरता येत नाही की त्यापर्यंत पोहोचण्याचे तंत्रज्ञान अजून अस्तित्वातच नाही, तर राखीव म्हणजे तो भाग जो ज्ञात, सुलभ आणि सध्याच्या तंत्रज्ञानाने वापरण्याजोगा आहे.",
        },
        detail: {
          en: "The boundary between them moves with knowledge: a stock becomes a reserve the day a workable technology appears, without a gram of new material being created.",
          hi: "उनके बीच की सीमा ज्ञान के साथ हिलती है: भंडार उसी दिन संचित कोष बन जाता है जिस दिन कोई कारगर तकनीक आती है, और एक ग्राम नई सामग्री भी नहीं बनती।",
          mr: "त्यांच्यातील सीमा ज्ञानासोबत सरकते: साठा त्याच दिवशी राखीव बनतो ज्या दिवशी एखादे उपयोगी तंत्रज्ञान येते, आणि एक ग्रॅम नवा पदार्थही तयार होत नाही.",
        },
        extra: {
          en: "This is why a resource is best described as something that becomes rather than something that is — petroleum was useless rock oil until engines were invented to burn it.",
          hi: "इसीलिए संसाधन को 'जो है' कहने के बजाय 'जो बनता है' कहना बेहतर है — पेट्रोलियम तब तक बेकार शैल-तेल था जब तक उसे जलाने वाले इंजन नहीं बने।",
          mr: "म्हणूनच संसाधनाला 'जे आहे' म्हणण्याऐवजी 'जे बनते' म्हणणे अधिक योग्य — पेट्रोलियम तोवर निरुपयोगी खडक-तेल होते जोवर ते जाळणारी इंजिने बनली नाहीत.",
        },
        pair: {
          left: {
            en: "Present but unusable, versus known and usable",
            hi: "मौजूद पर अनुपयोगी, बनाम ज्ञात और उपयोगी",
            mr: "उपस्थित पण अवापरता, विरुद्ध ज्ञात आणि वापरण्याजोगा",
          },
          right: {
            en: "stock and reserves",
            hi: "भंडार और संचित कोष",
            mr: "साठा आणि राखीव",
          },
        },
      },
      {
        id: "alluvial-soil",
        name: {
          en: "Alluvial soil",
          hi: "जलोढ़ मृदा",
          mr: "गाळाची मृदा",
        },
        kind: "soil",
        prompt: {
          en: "Deposited by rivers across the northern plains and the eastern coastal deltas, it is rich in potash and lime, easy to plough, and supports the densest farming population in the country. Which soil is this?",
          hi: "उत्तरी मैदानों और पूर्वी तटीय डेल्टाओं में नदियों द्वारा बिछाई गई, यह पोटाश और चूने से भरपूर है, जोतने में आसान है, और देश की सबसे सघन कृषक आबादी को सँभालती है। यह कौन-सी मृदा है?",
          mr: "उत्तरेच्या मैदानांत आणि पूर्व किनारी त्रिभुज प्रदेशांत नद्यांनी पसरवलेली, ती पोटॅश आणि चुन्याने समृद्ध, नांगरायला सोपी, आणि देशातील सर्वांत दाट शेतकरी लोकसंख्येला तोलणारी. ही कोणती मृदा?",
        },
        statement: {
          en: "Alluvial soil is laid down by rivers across the northern plains and the deltas, is rich in potash, phosphoric acid and lime, and is the most fertile and most intensively farmed soil in India.",
          hi: "जलोढ़ मृदा नदियों द्वारा उत्तरी मैदानों और डेल्टाओं में बिछाई जाती है, पोटाश, फ़ॉस्फ़ोरिक अम्ल तथा चूने से भरपूर है, और भारत की सबसे उपजाऊ तथा सबसे सघन खेती वाली मृदा है।",
          mr: "गाळाची मृदा नद्यांकडून उत्तरेच्या मैदानांत आणि त्रिभुज प्रदेशांत पसरवली जाते, पोटॅश, फॉस्फोरिक आम्ल व चुन्याने समृद्ध, आणि भारतातील सर्वांत सुपीक व सर्वांत सघन शेती होणारी मृदा.",
        },
        detail: {
          en: "It comes in two ages — the older, coarser bangar with lime nodules, and the newer, finer khadar renewed by every flood.",
          hi: "यह दो आयुओं में आती है — पुरानी, मोटे कणों वाली बांगर जिसमें चूने की गाँठें होती हैं, और नई, महीन ख़ादर जो हर बाढ़ से नई हो जाती है।",
          mr: "ती दोन वयांत येते — जुनी, जाडसर बांगर जिच्यात चुन्याच्या गाठी असतात, आणि नवी, बारीक खादर जी प्रत्येक पुराने नवी होते.",
        },
        extra: {
          en: "Its fertility is the reason the Ganga plain carries so many people, and also the reason the loss of a centimetre of it matters more here than anywhere else.",
          hi: "उसकी उर्वरता ही कारण है कि गंगा का मैदान इतने लोग ढोता है, और यही कारण है कि उसका एक सेंटीमीटर खोना यहाँ किसी और जगह से अधिक मायने रखता है।",
          mr: "तिची सुपीकताच कारण आहे की गंगेचे मैदान इतके लोक वाहते, आणि तेच कारण की तिचा एक सेंटिमीटर हरवणे इथे इतर कुठल्याही ठिकाणाहून अधिक महत्त्वाचे.",
        },
        pair: {
          left: {
            en: "River-laid, potash-rich, most intensively farmed",
            hi: "नदी-निक्षेपित, पोटाश-समृद्ध, सबसे सघन खेती वाली",
            mr: "नदीने साचवलेली, पोटॅश-समृद्ध, सर्वांत सघन शेती होणारी",
          },
          right: {
            en: "alluvial soil",
            hi: "जलोढ़ मृदा",
            mr: "गाळाची मृदा",
          },
        },
      },
      {
        id: "black-soil",
        name: {
          en: "Black soil",
          hi: "काली मृदा",
          mr: "काळी मृदा",
        },
        kind: "soil",
        prompt: {
          en: "Formed from lava on the Deccan plateau, it is clayey, holds moisture through a long dry season, and develops wide cracks in summer that turn it over by itself. Which soil is this?",
          hi: "दक्कन के पठार पर लावा से बनी, यह चिकनी है, लंबे शुष्क मौसम भर नमी रोके रखती है, और गर्मियों में चौड़ी दरारें डालती है जो उसे स्वयं ही उलट-पलट देती हैं। यह कौन-सी मृदा है?",
          mr: "दख्खनच्या पठारावर लाव्हापासून बनलेली, ती चिकणमातीची, दीर्घ कोरड्या हंगामभर ओलावा धरून ठेवणारी, आणि उन्हाळ्यात रुंद भेगा पाडणारी ज्या तिला स्वतःच उलटवतात. ही कोणती मृदा?",
        },
        statement: {
          en: "Black soil, also called regur, formed from the weathering of Deccan lava, is clayey and moisture-retentive, rich in lime, magnesia and potash, and is the classic cotton soil.",
          hi: "काली मृदा, जिसे रेगुर भी कहते हैं, दक्कन के लावा के अपक्षय से बनी है, चिकनी और नमी रोकने वाली है, चूने, मैग्नेशिया तथा पोटाश से भरपूर है, और वही उत्कृष्ट कपास-मृदा है।",
          mr: "काळी मृदा, जिला रेगूरही म्हणतात, दख्खनच्या लाव्हाच्या विदारणातून बनलेली, चिकणमातीची व ओलावा धरणारी, चुना, मॅग्नेशिया व पोटॅशने समृद्ध, आणि तीच उत्कृष्ट कापूस-मृदा.",
        },
        detail: {
          en: "The deep cracks that open in the dry months let air down into the soil, so it aerates itself without ploughing.",
          hi: "शुष्क महीनों में खुलती गहरी दरारें हवा को मिट्टी के भीतर उतरने देती हैं, अतः वह बिना जुताई के स्वयं वातित हो जाती है।",
          mr: "कोरड्या महिन्यांत उघडणाऱ्या खोल भेगा हवेला मातीच्या आत उतरू देतात, म्हणून ती नांगरणीविना स्वतःच हवेशीर होते.",
        },
        extra: {
          en: "Wet, it becomes so sticky that it cannot be worked at all, so its ploughing has to be timed to the first showers or done just after the harvest.",
          hi: "गीली होने पर यह इतनी चिपचिपी हो जाती है कि उस पर काम ही नहीं हो सकता, अतः उसकी जुताई पहली बौछारों के समय पर या फ़सल कटते ही करनी पड़ती है।",
          mr: "ओली झाल्यावर ती इतकी चिकट होते की तिच्यावर कामच होत नाही, म्हणून तिची नांगरणी पहिल्या सरींच्या वेळेवर वा पीक निघताच करावी लागते.",
        },
        pair: {
          left: {
            en: "Lava-born, clayey, cracks that aerate themselves",
            hi: "लावा-जन्य, चिकनी, स्वयं वातित करती दरारें",
            mr: "लाव्हा-जन्य, चिकणमातीची, स्वतःच हवेशीर करणाऱ्या भेगा",
          },
          right: {
            en: "black soil",
            hi: "काली मृदा",
            mr: "काळी मृदा",
          },
        },
      },
      {
        id: "laterite-soil",
        name: {
          en: "Laterite soil",
          hi: "लैटेराइट मृदा",
          mr: "जांभी मृदा",
        },
        kind: "soil",
        prompt: {
          en: "Heavy tropical rain washes the lime and silica clean out of the rock, leaving behind iron and aluminium — a soil poor in humus, hard when dry, and cut into bricks in Kerala and Goa. Which soil is this?",
          hi: "भारी उष्णकटिबंधीय वर्षा चट्टान से चूना और सिलिका धो ले जाती है, पीछे लोहा और एल्युमिनियम छोड़कर — ऐसी मृदा जो ह्यूमस में निर्धन है, सूखने पर कठोर, और केरल तथा गोवा में ईंटों में काटी जाती है। यह कौन-सी मृदा है?",
          mr: "जोरदार उष्णकटिबंधीय पाऊस खडकातून चुना आणि सिलिका धुऊन नेतो, मागे लोखंड आणि अ‍ॅल्युमिनियम ठेवत — अशी मृदा जी ह्युमसमध्ये गरीब, वाळल्यावर कठीण, आणि केरळ व गोव्यात विटांत कापली जाते. ही कोणती मृदा?",
        },
        statement: {
          en: "Laterite soil develops in areas of high temperature and heavy rainfall where leaching washes out the lime and silica, leaving an iron- and aluminium-rich soil that is low in humus and fertility.",
          hi: "लैटेराइट मृदा उन क्षेत्रों में बनती है जहाँ ताप ऊँचा और वर्षा भारी हो, जहाँ निक्षालन चूना तथा सिलिका बहा ले जाता है और पीछे लोहा तथा एल्युमिनियम से भरी, ह्यूमस और उर्वरता में कम मृदा छोड़ जाता है।",
          mr: "जांभी मृदा त्या भागांत तयार होते जिथे तापमान उच्च आणि पाऊस जोरदार असतो, जिथे निक्षालन चुना व सिलिका वाहून नेते आणि मागे लोखंड व अ‍ॅल्युमिनियमने भरलेली, ह्युमस व सुपीकतेत कमी मृदा ठेवते.",
        },
        detail: {
          en: "It is unsuited to most food crops without heavy manuring, but with care it grows tea, coffee, cashew and rubber on the hill slopes.",
          hi: "यह भारी खाद के बिना अधिकांश खाद्य फ़सलों के अनुकूल नहीं, पर देखभाल से पहाड़ी ढलानों पर चाय, कॉफ़ी, काजू और रबड़ उगाती है।",
          mr: "ती जबर खतांविना बहुतांश अन्नपिकांना अनुकूल नाही, पण निगेने डोंगरउतारांवर चहा, कॉफी, काजू आणि रबर पिकवते.",
        },
        extra: {
          en: "Its name comes from the Latin for brick, because it hardens on exposure and has been cut and dried into building blocks for centuries.",
          hi: "उसका नाम ईंट के लैटिन शब्द से आया है, क्योंकि हवा लगते ही वह कठोर हो जाती है और सदियों से काटकर सुखाकर निर्माण-खंड बनाई जाती रही है।",
          mr: "तिचे नाव विटेच्या लॅटिन शब्दावरून आले, कारण हवा लागताच ती कठीण होते आणि शतके कापून वाळवून बांधकामाचे ठोकळे बनवली जात आहे.",
        },
        pair: {
          left: {
            en: "Leached of lime and silica, cut into bricks",
            hi: "चूना-सिलिका बह गए, ईंटों में काटी जाती",
            mr: "चुना-सिलिका वाहून गेलेली, विटांत कापली जाणारी",
          },
          right: {
            en: "laterite soil",
            hi: "लैटेराइट मृदा",
            mr: "जांभी मृदा",
          },
        },
      },
      {
        id: "gully-and-sheet-erosion",
        name: {
          en: "Gully and sheet erosion",
          hi: "अवनालिका और परत अपरदन",
          mr: "घळई आणि पत्री झीज",
        },
        kind: "process",
        prompt: {
          en: "In the Chambal basin running water has cut deep channels that make the land unfit for farming; elsewhere the topsoil is stripped off in an even layer so quietly that a farmer notices only when yields fall. Which two forms of soil loss are these?",
          hi: "चंबल बेसिन में बहते पानी ने ऐसी गहरी नालियाँ काट दी हैं कि भूमि खेती के लायक़ नहीं रही; अन्यत्र ऊपरी मिट्टी एक समान परत में इतने चुपचाप छिल जाती है कि किसान को तभी पता चलता है जब पैदावार गिरती है। ये मृदा-हानि के कौन-से दो रूप हैं?",
          mr: "चंबळ खोऱ्यात वाहत्या पाण्याने अशा खोल घळी कापल्या आहेत की जमीन शेतीयोग्य राहिली नाही; इतरत्र वरची माती एकसमान थरात इतकी गुपचूप सोलली जाते की शेतकऱ्याला तेव्हाच कळते जेव्हा उत्पादन घसरते. ही मृदा-हानीची कोणती दोन रूपे?",
        },
        statement: {
          en: "Gully erosion cuts deep channels that render land unfit for cultivation and creates badlands, while sheet erosion removes the topsoil in a thin even layer over a wide area, often unnoticed until fertility falls.",
          hi: "अवनालिका अपरदन ऐसी गहरी नालियाँ काटता है जो भूमि को खेती के अयोग्य कर देती हैं और उत्खात भूमि बनाती हैं, जबकि परत अपरदन ऊपरी मिट्टी को विस्तृत क्षेत्र पर एक पतली समान परत में हटाता है, जो अक्सर उर्वरता गिरने तक अनदेखा रह जाता है।",
          mr: "घळई झीज अशा खोल घळी कापते ज्या जमीन लागवडीस अयोग्य करतात आणि उजाड भूमी घडवतात, तर पत्री झीज वरची माती विस्तृत भागावर पातळ एकसमान थरात काढून नेते, जी सुपीकता घसरेपर्यंत अनेकदा लक्षातच येत नाही.",
        },
        detail: {
          en: "The remedies differ because the mechanisms do: contour ploughing and terracing slow water on slopes, while shelter belts of trees break the wind that strips dry plains.",
          hi: "उपाय इसलिए भिन्न हैं कि क्रियाविधियाँ भिन्न हैं: समोच्च जुताई और सीढ़ीदार खेत ढलानों पर पानी की गति धीमी करते हैं, जबकि पेड़ों की रक्षक मेखलाएँ उस पवन को तोड़ती हैं जो सूखे मैदानों को छीलती है।",
          mr: "उपाय यासाठी वेगळे की क्रियाविधी वेगळ्या: समोच्च नांगरणी आणि पायऱ्यांची शेती उतारांवर पाण्याचा वेग मंदावतात, तर झाडांचे संरक्षक पट्टे तो वारा मोडतात जो कोरडी मैदाने सोलतो.",
        },
        extra: {
          en: "Human causes dominate: deforestation, overgrazing, mining and ploughing up and down a slope instead of across it.",
          hi: "मानवीय कारण प्रमुख हैं: वनोन्मूलन, अतिचराई, खनन, और ढलान के आर-पार के बजाय ऊपर-नीचे जुताई।",
          mr: "मानवी कारणे प्रमुख: वनतोड, अतिचराई, खाणकाम, आणि उताराच्या आडव्याऐवजी वरखाली नांगरणी.",
        },
        pair: {
          left: {
            en: "Deep channels versus a thin layer taken quietly",
            hi: "गहरी नालियाँ बनाम चुपचाप ली गई पतली परत",
            mr: "खोल घळी विरुद्ध गुपचूप घेतलेला पातळ थर",
          },
          right: {
            en: "gully and sheet erosion",
            hi: "अवनालिका और परत अपरदन",
            mr: "घळई आणि पत्री झीज",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Some of India's districts richest in coal, iron ore and bauxite are also among its poorest by income, literacy and health. If resources create wealth, this should not happen. Explain why abundance alone does not produce development.",
          hi: "कोयले, लौह अयस्क और बॉक्साइट में भारत के सबसे धनी कुछ ज़िले आय, साक्षरता और स्वास्थ्य में उसके सबसे निर्धनों में भी हैं। यदि संसाधन संपत्ति बनाते हैं, तो ऐसा नहीं होना चाहिए। समझाओ केवल प्रचुरता विकास क्यों नहीं देती।",
          mr: "कोळसा, लोहधातुक आणि बॉक्साइटमध्ये भारतातील सर्वांत श्रीमंत काही जिल्हे उत्पन्न, साक्षरता आणि आरोग्यात त्याच्या सर्वांत गरिबांतही आहेत. संसाधने संपत्ती निर्माण करत असतील तर असे व्हायला नको. समजावा केवळ विपुलता विकास का देत नाही.",
        },
        choices: [
          {
            en: "Because a deposit becomes wealth only through technology to extract it, institutions to govern it and arrangements that share the proceeds. Where the ore is shipped out raw, the profits accrue to owners elsewhere, local people lose land and forest to the mine and gain only the lowest-paid work, and the damage — displacement, dust, ruined water — stays behind. Development requires resource planning that ties extraction to local benefit, not extraction alone",
            hi: "क्योंकि कोई भंडार तभी संपत्ति बनता है जब उसे निकालने की तकनीक, उसे शासित करने वाली संस्थाएँ और आय बाँटने की व्यवस्थाएँ हों। जहाँ अयस्क कच्चा ही बाहर भेज दिया जाता है, वहाँ लाभ अन्यत्र के मालिकों को जाता है, स्थानीय लोग खदान को भूमि और वन गँवाते हैं और केवल सबसे कम मज़दूरी वाला काम पाते हैं, और नुक़सान — विस्थापन, धूल, बिगड़ा पानी — पीछे रह जाता है। विकास के लिए ऐसा संसाधन नियोजन चाहिए जो निष्कर्षण को स्थानीय लाभ से बाँधे, केवल निष्कर्षण नहीं",
            mr: "कारण एखादा साठा तेव्हाच संपत्ती बनतो जेव्हा तो काढण्याचे तंत्रज्ञान, त्याचे शासन करणाऱ्या संस्था आणि उत्पन्न वाटण्याच्या व्यवस्था असतात. जिथे धातुक कच्चेच बाहेर पाठवले जाते, तिथे नफा इतरत्रच्या मालकांना जातो, स्थानिक लोक खाणीला जमीन व जंगल गमावतात आणि फक्त सर्वांत कमी मजुरीचे काम मिळवतात, आणि नुकसान — विस्थापन, धूळ, बिघडलेले पाणी — मागे राहते. विकासासाठी असे संसाधन नियोजन हवे जे उत्खननाला स्थानिक लाभाशी बांधेल, केवळ उत्खनन नव्हे",
          },
          {
            en: "Because minerals are inherently worthless, and only agriculture can create real wealth anywhere",
            hi: "क्योंकि खनिज स्वभावतः निर्मूल्य हैं, और कहीं भी असली संपत्ति केवल कृषि बना सकती है",
            mr: "कारण खनिजे मुळातच निर्मूल्य आहेत, आणि कुठेही खरी संपत्ती फक्त शेतीच निर्माण करू शकते",
          },
          {
            en: "Because the people of those districts refuse all employment offered to them",
            hi: "क्योंकि उन ज़िलों के लोग उन्हें दी गई हर नौकरी ठुकरा देते हैं",
            mr: "कारण त्या जिल्ह्यांतील लोक त्यांना दिलेली प्रत्येक नोकरी नाकारतात",
          },
          {
            en: "The premise is false: every mineral-rich district in India is among the wealthiest in the country",
            hi: "आधार ही ग़लत है: भारत का हर खनिज-समृद्ध ज़िला देश के सबसे धनी ज़िलों में है",
            mr: "गृहीतकच चुकीचे: भारतातील प्रत्येक खनिज-समृद्ध जिल्हा देशातील सर्वांत श्रीमंतांत आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The puzzle dissolves once you stop treating a resource as wealth and start treating it as a possibility that has to be converted. Three things stand between a deposit in the ground and a prosperous district, and all three can fail. The first is technology. Ore underground is worth nothing until it can be extracted, transported and processed. That requires capital, machinery and skills, and those are rarely local — they are brought in by a company from outside, which means the value the technology adds also belongs to outsiders. The second is institutions: who owns the mineral, who grants the lease, who is compensated for the land, whether that compensation is paid, and whether anyone is obliged to hire or train local people. Where these rules are weak or badly enforced, the mine can operate for decades with almost no obligation to the district it stands in. The third is the pattern of processing. If the ore leaves raw, the district exports the least valuable stage of the chain and captures almost none of the value; steel made elsewhere from that ore, and the goods made from that steel, carry all the profit. Now look at what the district actually receives. It loses farmland, forest and often the village itself to the pit and the spoil heaps. Its groundwater is drawn down or contaminated, and dust settles on the fields that remain. Adivasi communities in particular lose access to forests that were their food, fodder and medicine. What they gain is a small number of jobs, usually the least skilled and least paid, because the technical posts go to people brought in with the machinery. The books therefore balance the wrong way: the profits leave, the costs stay. This is why the chapter insists that resource planning is not merely an inventory. Surveying what exists is only the first step; the plan has to attach that endowment to appropriate technology, to institutions that secure a share for the people whose land it is, and to the region's own development needs — schools, health, roads, processing industry. Where that is done, minerals genuinely finance development. Where it is not, extraction and impoverishment sit side by side, which is exactly what these districts show. (The wrong answers dismiss mineral value altogether, blame the affected people for their own poverty, or deny a pattern that district-level census and income data document plainly.)",
          hi: "पहेली तभी घुल जाती है जब तुम संसाधन को संपत्ति मानना छोड़कर उसे एक ऐसी संभावना मानने लगो जिसे बदलना पड़ता है। ज़मीन के भंडार और समृद्ध ज़िले के बीच तीन चीज़ें खड़ी हैं, और तीनों विफल हो सकती हैं। पहली तकनीक। भूमिगत अयस्क तब तक कुछ मूल्य का नहीं जब तक उसे निकाला, ढोया और संसाधित न किया जा सके। इसके लिए पूँजी, मशीनरी और कौशल चाहिए, और वे शायद ही स्थानीय होते हैं — उन्हें बाहर की कंपनी लाती है, जिसका अर्थ है कि तकनीक जो मूल्य जोड़ती है वह भी बाहरवालों का होता है। दूसरी संस्थाएँ: खनिज का स्वामी कौन, पट्टा कौन देता, भूमि का मुआवज़ा किसे, वह मुआवज़ा चुकाया भी जाता या नहीं, और क्या कोई स्थानीय लोगों को रखने या प्रशिक्षित करने को बाध्य है। जहाँ ये नियम कमज़ोर या ठीक से लागू न हों, वहाँ खदान दशकों तक उस ज़िले के प्रति लगभग बिना किसी दायित्व के चल सकती है जिसमें वह खड़ी है। तीसरी प्रसंस्करण का ढंग। यदि अयस्क कच्चा ही जाता है, तो ज़िला शृंखला का सबसे कम मूल्यवान चरण निर्यात करता है और मूल्य का लगभग कुछ भी नहीं पकड़ता; उसी अयस्क से अन्यत्र बना इस्पात, और उस इस्पात से बना माल, सारा लाभ ढोता है। अब देखो ज़िले को वस्तुतः क्या मिलता है। वह खेत, वन और अक्सर स्वयं गाँव भी गड्ढे और मलबे के ढेरों को गँवाता है। उसका भूजल नीचे खिंच जाता या दूषित हो जाता है, और बचे खेतों पर धूल बैठती है। ख़ासकर आदिवासी समुदाय उन वनों तक पहुँच खोते हैं जो उनका भोजन, चारा और औषधि थे। जो मिलता है वह थोड़ी-सी नौकरियाँ, आमतौर पर सबसे कम कुशल और कम मज़दूरी वाली, क्योंकि तकनीकी पद उन लोगों को जाते हैं जो मशीनरी के साथ लाए जाते हैं। अतः बही उल्टी बैठती है: लाभ चला जाता, लागत ठहर जाती। इसीलिए अध्याय ज़ोर देता है कि संसाधन नियोजन मात्र सूची-निर्माण नहीं। जो है उसका सर्वेक्षण केवल पहला क़दम है; योजना को उस संपदा को उपयुक्त तकनीक से, ऐसी संस्थाओं से जो उन लोगों का हिस्सा सुरक्षित करें जिनकी वह भूमि है, और उस क्षेत्र की अपनी विकास-ज़रूरतों — विद्यालय, स्वास्थ्य, सड़कें, प्रसंस्करण उद्योग — से जोड़ना होता है। जहाँ यह होता है, खनिज सचमुच विकास का वित्तपोषण करते हैं। जहाँ नहीं होता, वहाँ निष्कर्षण और दरिद्रता कंधे से कंधा मिलाकर बैठते हैं — ठीक वही जो ये ज़िले दिखाते हैं। (ग़लत उत्तर खनिजों का मूल्य ही झटक देते, प्रभावित लोगों को उनकी अपनी निर्धनता का दोष देते, या उस प्रतिरूप को नकारते जिसे ज़िला-स्तरीय जनगणना और आय के आँकड़े साफ़ दर्ज करते हैं।)",
          mr: "कोडे तेव्हाच सुटते जेव्हा तुम्ही संसाधनाला संपत्ती मानणे सोडून त्याला अशी शक्यता मानू लागता जिचे रूपांतर करावे लागते. जमिनीतील साठा आणि समृद्ध जिल्हा यांच्यात तीन गोष्टी उभ्या आहेत, आणि तिन्ही फसू शकतात. पहिली तंत्रज्ञान. भूमिगत धातुक तोवर काही मोलाचे नाही जोवर ते काढता, वाहता आणि प्रक्रिया करता येत नाही. यासाठी भांडवल, यंत्रसामग्री आणि कौशल्ये लागतात, आणि ती क्वचितच स्थानिक असतात — ती बाहेरची कंपनी आणते, म्हणजे तंत्रज्ञान जे मूल्य जोडते तेही बाहेरच्यांचे असते. दुसरी संस्था: खनिजाचा मालक कोण, भाडेपट्टा कोण देतो, जमिनीचा मोबदला कोणाला, तो मोबदला दिला जातो का, आणि स्थानिक लोकांना कामावर ठेवायला वा प्रशिक्षित करायला कोणी बांधील आहे का. जिथे हे नियम दुर्बळ वा नीट न राबवलेले, तिथे खाण दशके ज्या जिल्ह्यात ती उभी आहे त्याप्रती जवळजवळ कोणत्याही दायित्वाविना चालू शकते. तिसरी प्रक्रियेची पद्धत. धातुक कच्चेच जात असेल, तर जिल्हा साखळीचा सर्वांत कमी मोलाचा टप्पा निर्यात करतो आणि मूल्याचे जवळजवळ काहीच पकडत नाही; त्याच धातुकातून इतरत्र बनलेले पोलाद, आणि त्या पोलादातून बनलेला माल, सर्व नफा वाहतो. आता जिल्ह्याला प्रत्यक्षात काय मिळते ते पाहा. तो शेती, जंगल आणि अनेकदा स्वतः गावही खड्ड्याला व मातीच्या ढिगांना गमावतो. त्याचे भूजल खाली ओढले जाते वा दूषित होते, आणि उरलेल्या शेतांवर धूळ बसते. विशेषतः आदिवासी समुदाय त्या जंगलांपर्यंतचा प्रवेश गमावतात जी त्यांचे अन्न, चारा आणि औषध होती. जे मिळते ते थोड्या नोकऱ्या, सहसा सर्वांत कमी कुशल आणि कमी मजुरीच्या, कारण तांत्रिक पदे यंत्रसामग्रीसोबत आणलेल्या लोकांना जातात. म्हणून खतावणी उलटी बसते: नफा जातो, खर्च राहतो. म्हणूनच प्रकरण आग्रह धरते की संसाधन नियोजन म्हणजे केवळ यादी करणे नव्हे. जे आहे त्याचे सर्वेक्षण ही केवळ पहिली पायरी; योजनेला ती संपदा योग्य तंत्रज्ञानाशी, ज्यांची ती जमीन आहे त्यांचा वाटा सुरक्षित करणाऱ्या संस्थांशी, आणि त्या प्रदेशाच्या स्वतःच्या विकास-गरजांशी — शाळा, आरोग्य, रस्ते, प्रक्रिया उद्योग — जोडावी लागते. जिथे हे होते तिथे खनिजे खरोखर विकासाला अर्थपुरवठा करतात. जिथे होत नाही तिथे उत्खनन आणि दारिद्र्य शेजारीशेजारी बसतात — नेमके तेच हे जिल्हे दाखवतात. (चुकीची उत्तरे खनिजांचे मोलच झटकतात, बाधित लोकांना त्यांच्याच गरिबीचा दोष देतात, वा जिल्हा-स्तरीय जनगणना व उत्पन्न आकडेवारी स्पष्ट नोंदवत असलेले प्रारूप नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Petroleum lay under the ground for millions of years while civilisations rose and fell without touching it; uranium was a curiosity in a mineral cabinet; sunlight fell on every roof and was called nothing at all. Each is now called a resource. What does this tell us about what a resource actually is, and what follows for how a country should treat its endowment?",
          hi: "पेट्रोलियम लाखों वर्ष ज़मीन के नीचे पड़ा रहा जबकि सभ्यताएँ उठीं और गिरीं बिना उसे छुए; यूरेनियम खनिज-अलमारी में एक कौतुक था; धूप हर छत पर गिरती थी और उसे कुछ कहा ही नहीं जाता था। अब हर एक को संसाधन कहा जाता है। यह हमें क्या बताता है कि संसाधन वस्तुतः है क्या, और किसी देश को अपनी संपदा के साथ कैसा बरताव करना चाहिए — इसके लिए इससे क्या निकलता है?",
          mr: "पेट्रोलियम लाखो वर्षे जमिनीखाली पडून राहिले तर संस्कृती उदयाला आल्या आणि लोपल्या ते न स्पर्शता; युरेनियम खनिज-कपाटातील एक कुतूहल होते; सूर्यप्रकाश प्रत्येक छपरावर पडे आणि त्याला काही म्हटलेच जात नसे. आता प्रत्येकाला संसाधन म्हणतात. हे आपल्याला काय सांगते की संसाधन प्रत्यक्षात काय आहे, आणि एखाद्या देशाने आपल्या संपदेशी कसे वागावे यासाठी यातून काय निघते?",
        },
        choices: [
          {
            en: "A resource is not a thing but a relationship between a material, a technology and a need — so the boundary between stock and reserve moves as knowledge does, and what is worthless today may be vital tomorrow. It follows that a country should not exhaust what it can currently sell, invest in the knowledge that converts stock into reserve, and treat unused material as an option for the future rather than as nothing — which is the reasoning behind sustainable development and Agenda 21",
            hi: "संसाधन कोई वस्तु नहीं बल्कि सामग्री, तकनीक और आवश्यकता के बीच का संबंध है — अतः भंडार और संचित कोष की सीमा ज्ञान के साथ हिलती है, और जो आज निर्मूल्य है वह कल अनिवार्य हो सकता है। इससे निकलता है कि देश को वह नहीं चुका देना चाहिए जो वह इस समय बेच सकता है, उस ज्ञान में निवेश करना चाहिए जो भंडार को संचित कोष में बदलता है, और अनुपयुक्त सामग्री को शून्य नहीं बल्कि भविष्य का विकल्प मानना चाहिए — यही सतत विकास और एजेंडा 21 के पीछे का तर्क है",
            mr: "संसाधन ही वस्तू नव्हे तर पदार्थ, तंत्रज्ञान आणि गरज यांच्यातील नाते आहे — म्हणून साठा आणि राखीव यांतील सीमा ज्ञानासोबत सरकते, आणि जे आज निर्मूल्य ते उद्या अत्यावश्यक असू शकते. यातून निघते की देशाने जे तो सध्या विकू शकतो ते संपवू नये, साठ्याचे राखीवात रूपांतर करणाऱ्या ज्ञानात गुंतवणूक करावी, आणि न वापरलेला पदार्थ शून्य नव्हे तर भविष्यातील पर्याय मानावा — हाच शाश्वत विकास आणि अजेंडा 21 मागचा तर्क",
          },
          {
            en: "It shows resources are fixed by nature and unchanging, so a country's wealth was settled once and for all by geology",
            hi: "यह दिखाता है कि संसाधन प्रकृति से नियत और अपरिवर्तनीय हैं, अतः किसी देश की संपत्ति भूविज्ञान ने एक ही बार में हमेशा के लिए तय कर दी",
            mr: "ते दाखवते की संसाधने निसर्गाने ठरलेली आणि अपरिवर्तनीय आहेत, म्हणून देशाची संपत्ती भूगर्भशास्त्राने एकदाच कायमची ठरवली",
          },
          {
            en: "It proves that conservation is pointless, since technology will always find a substitute for anything exhausted",
            hi: "यह सिद्ध करता है कि संरक्षण व्यर्थ है, क्योंकि तकनीक चुक गई हर चीज़ का विकल्प सदा खोज ही लेगी",
            mr: "ते सिद्ध करते की संधारण निरर्थक आहे, कारण तंत्रज्ञान संपलेल्या प्रत्येक गोष्टीचा पर्याय सदैव शोधून काढेलच",
          },
          {
            en: "It means only governments, never people or technology, can decide what counts as a resource",
            hi: "इसका अर्थ है कि केवल सरकारें, कभी लोग या तकनीक नहीं, तय कर सकती हैं कि संसाधन क्या गिना जाए",
            mr: "याचा अर्थ फक्त सरकारे, कधीही लोक वा तंत्रज्ञान नव्हे, ठरवू शकतात की संसाधन काय गणले जाईल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The three examples all make the same point from different directions: nothing in the material changed, and yet each became a resource. The petroleum under Mesopotamia was chemically identical to the petroleum under Texas, but for four thousand years it was a nuisance that seeped into wells; it became the most contested substance on earth only when the internal combustion engine created a use for it. Uranium sat in mineral collections as a heavy curiosity until physics found what its nucleus could do. Sunlight has fallen on every roof for as long as there have been roofs, and became a resource only when photovoltaic cells made it collectible. So the correct definition is relational: something is a resource when a material, a technology capable of using it and a human need coincide. Remove any one of the three and the resource disappears — which is exactly why the textbook distinction between stock and reserve is not bookkeeping but the heart of the idea. A stock is material we hold but cannot yet use; a reserve is the part we can. The line between them is drawn by knowledge, and it moves whenever knowledge does, without a gram of new matter being created anywhere. Several consequences follow, and they are practical rather than philosophical. First, an inventory of a country's resources is always provisional, so resource planning has to be revisited as technology changes; a survey written in 1950 was working with a different list from one written today. Second, investment in science and skills is itself a form of resource creation — the cheapest way to acquire a new reserve is often to develop the technology that unlocks a stock you already hold. India's own solar potential is the clearest case: the sunlight was always there, and the resource is the technology. Third, and most importantly, the relational definition cuts against the argument that we may use up whatever we can currently sell. If what counts as usable expands with knowledge, then material we exhaust today is not merely spent — it is removed from every future use that has not yet been invented, and the people who will need it are not yet born to object. That is the reasoning behind sustainable development: meeting present needs without compromising the ability of future generations to meet theirs, formalised at the 1992 Rio Earth Summit and the Agenda 21 programme. Note carefully what this does not license. It is not an argument that technology will always rescue us, because there is no guarantee a substitute exists for any particular material, and some losses — an extinct species, an aquifer drained, a soil eroded to rock — cannot be reversed by any technology at all. The honest position is that a resource is created by knowledge and destroyed by carelessness, and that a country must husband both the material and the learning that turns material into resource. (The wrong answers treat endowment as fixed by geology, use technological optimism to dismiss conservation, or confuse the state's power to regulate with the question of what makes something usable at all.)",
          hi: "तीनों उदाहरण अलग-अलग दिशाओं से एक ही बात कहते हैं: सामग्री में कुछ नहीं बदला, फिर भी हर एक संसाधन बन गया। मेसोपोटामिया के नीचे का पेट्रोलियम टेक्सस के नीचे के पेट्रोलियम से रासायनिक रूप से समान था, पर चार हज़ार वर्ष वह कुओं में रिसता एक झंझट था; वह पृथ्वी का सबसे विवादित पदार्थ तभी बना जब अंतर्दहन इंजन ने उसके लिए उपयोग रचा। यूरेनियम खनिज-संग्रहों में एक भारी कौतुक बना बैठा रहा जब तक भौतिकी ने न पाया कि उसका नाभिक क्या कर सकता है। धूप हर छत पर तब से गिरती रही जब से छतें हैं, और संसाधन तभी बनी जब प्रकाश-वोल्टीय सेलों ने उसे बटोरने योग्य बनाया। अतः सही परिभाषा सांबंधिक है: कोई चीज़ तब संसाधन है जब सामग्री, उसे इस्तेमाल करने में सक्षम तकनीक और मानवीय आवश्यकता एक साथ मिलें। तीनों में से किसी एक को हटाओ और संसाधन ग़ायब — ठीक इसीलिए भंडार और संचित कोष का पाठ्य-भेद बही-खाता नहीं बल्कि विचार का हृदय है। भंडार वह सामग्री है जो हमारे पास है पर अभी इस्तेमाल नहीं हो सकती; संचित कोष वह हिस्सा है जो हो सकती है। उनके बीच की रेखा ज्ञान खींचता है, और वह जब भी ज्ञान हिले तब हिलती है, और कहीं एक ग्राम नई सामग्री नहीं बनती। इससे कई परिणाम निकलते हैं, और वे दार्शनिक नहीं व्यावहारिक हैं। पहला, किसी देश के संसाधनों की सूची सदा अस्थायी है, अतः तकनीक बदलने पर संसाधन नियोजन फिर से देखना पड़ता है; 1950 में लिखा सर्वेक्षण आज लिखे सर्वेक्षण से भिन्न सूची पर काम कर रहा था। दूसरा, विज्ञान और कौशल में निवेश स्वयं संसाधन-निर्माण का एक रूप है — नया संचित कोष पाने का सबसे सस्ता रास्ता अक्सर वह तकनीक विकसित करना है जो पहले से रखे भंडार को खोल दे। भारत की अपनी सौर संभावना सबसे स्पष्ट प्रकरण है: धूप सदा वहाँ थी, और संसाधन तकनीक है। तीसरा, और सबसे महत्वपूर्ण, सांबंधिक परिभाषा उस तर्क को काटती है कि जो हम इस समय बेच सकते हैं उसे चुका देना ठीक है। यदि जो उपयोग योग्य गिना जाता वह ज्ञान के साथ फैलता है, तो आज जो सामग्री हम चुका देते हैं वह मात्र ख़र्च नहीं होती — वह हर उस भावी उपयोग से हट जाती है जिसका अभी आविष्कार भी नहीं हुआ, और जिन्हें उसकी ज़रूरत होगी वे आपत्ति करने को अभी जन्मे तक नहीं। यही सतत विकास के पीछे का तर्क है: वर्तमान ज़रूरतें ऐसे पूरी करना कि भावी पीढ़ियों की अपनी ज़रूरतें पूरी करने की क्षमता न घटे — जिसे 1992 के रियो पृथ्वी सम्मेलन और एजेंडा 21 कार्यक्रम में औपचारिक रूप दिया गया। ध्यान से देखो कि यह किसकी छूट नहीं देता। यह यह तर्क नहीं है कि तकनीक हमें सदा बचा लेगी, क्योंकि किसी विशेष सामग्री का विकल्प मौजूद होने की कोई गारंटी नहीं, और कुछ हानियाँ — लुप्त हुई जाति, चुक गया जलभृत, चट्टान तक कट गई मिट्टी — किसी भी तकनीक से पलटी नहीं जा सकतीं। ईमानदार स्थिति यह है कि संसाधन ज्ञान से बनता है और लापरवाही से नष्ट होता है, और देश को सामग्री तथा वह सीख — दोनों — सहेजनी होती है जो सामग्री को संसाधन बनाती है। (ग़लत उत्तर संपदा को भूविज्ञान से नियत मानते, तकनीकी आशावाद से संरक्षण झटकते, या राज्य की नियमन-शक्ति को इस प्रश्न से गड्डमड्ड करते कि कोई चीज़ उपयोग योग्य बनती किससे है।)",
          mr: "तिन्ही उदाहरणे वेगवेगळ्या दिशांनी एकच मुद्दा मांडतात: पदार्थात काही बदलले नाही, तरीही प्रत्येक संसाधन बनले. मेसोपोटेमियाखालचे पेट्रोलियम टेक्ससखालच्या पेट्रोलियमशी रासायनिकदृष्ट्या सारखे होते, पण चार हजार वर्षे ते विहिरींत झिरपणारी कटकट होते; ते पृथ्वीवरील सर्वांत वादग्रस्त पदार्थ तेव्हाच बनले जेव्हा अंतर्ज्वलन इंजिनाने त्यासाठी उपयोग घडवला. युरेनियम खनिज-संग्रहांत एक जड कुतूहल म्हणून बसून राहिले जोवर भौतिकशास्त्राला त्याचे केंद्रक काय करू शकते ते सापडले नाही. सूर्यप्रकाश प्रत्येक छपरावर तेव्हापासून पडत आहे जेव्हापासून छपरे आहेत, आणि संसाधन तेव्हाच बनला जेव्हा प्रकाश-विद्युत घटांनी तो गोळा करण्याजोगा केला. म्हणून योग्य व्याख्या नात्याची आहे: एखादी गोष्ट तेव्हा संसाधन असते जेव्हा पदार्थ, तो वापरण्यास सक्षम तंत्रज्ञान आणि मानवी गरज एकत्र येतात. तिघांपैकी एक काढा आणि संसाधन नाहीसे — नेमके म्हणूनच साठा आणि राखीव यांतील पाठ्य-भेद खतावणी नव्हे तर कल्पनेचे हृदय आहे. साठा म्हणजे तो पदार्थ जो आपल्याकडे आहे पण अजून वापरता येत नाही; राखीव म्हणजे तो भाग जो वापरता येतो. त्यांच्यातील रेषा ज्ञान आखते, आणि ज्ञान हलले की ती हलते, आणि कुठेही एक ग्रॅम नवा पदार्थ तयार होत नाही. यातून अनेक परिणाम निघतात, आणि ते तात्त्विक नव्हे तर व्यावहारिक आहेत. पहिला, देशाच्या संसाधनांची यादी सदैव तात्पुरती असते, म्हणून तंत्रज्ञान बदलल्यावर संसाधन नियोजन पुन्हा पाहावे लागते; 1950 मध्ये लिहिलेले सर्वेक्षण आज लिहिलेल्या सर्वेक्षणाहून वेगळ्या यादीवर काम करत होते. दुसरा, विज्ञान आणि कौशल्यांतील गुंतवणूक हे स्वतःच संसाधन-निर्मितीचे एक रूप — नवे राखीव मिळवण्याचा सर्वांत स्वस्त मार्ग अनेकदा ते तंत्रज्ञान विकसित करणे जे आधीच असलेला साठा उघडेल. भारताची स्वतःची सौर क्षमता हे सर्वांत स्पष्ट प्रकरण: सूर्यप्रकाश सदैव तिथे होता, आणि संसाधन म्हणजे तंत्रज्ञान. तिसरा, आणि सर्वांत महत्त्वाचा, नात्याची व्याख्या त्या युक्तिवादाला कापते की जे आपण सध्या विकू शकतो ते संपवणे ठीक. जे वापरण्याजोगे गणले जाते ते ज्ञानासोबत विस्तारत असेल, तर आज जो पदार्थ आपण संपवतो तो केवळ खर्च होत नाही — तो अजून शोधल्याही न गेलेल्या प्रत्येक भविष्यातील वापरातून काढून टाकला जातो, आणि ज्यांना त्याची गरज असेल ते आक्षेप घ्यायला अजून जन्मलेलेही नाहीत. हाच शाश्वत विकासामागचा तर्क: वर्तमान गरजा अशा भागवणे की भावी पिढ्यांची स्वतःच्या गरजा भागवण्याची क्षमता घटणार नाही — ज्याला 1992 च्या रिओ पृथ्वी परिषदेत आणि अजेंडा 21 कार्यक्रमात औपचारिक रूप दिले गेले. काळजीपूर्वक पाहा हे कशाची मुभा देत नाही. हा युक्तिवाद नाही की तंत्रज्ञान आपल्याला सदैव वाचवेल, कारण कोणत्याही विशिष्ट पदार्थाचा पर्याय अस्तित्वात असेल याची हमी नाही, आणि काही हानी — नामशेष झालेली जात, आटलेला जलधर, खडकापर्यंत झिजलेली माती — कोणत्याही तंत्रज्ञानाने उलटवता येत नाही. प्रामाणिक भूमिका ही की संसाधन ज्ञानाने घडते आणि निष्काळजीपणाने नष्ट होते, आणि देशाने पदार्थ आणि पदार्थाचे संसाधनात रूपांतर करणारे शिक्षण — दोन्ही — जपावे लागते. (चुकीची उत्तरे संपदा भूगर्भशास्त्राने ठरलेली मानतात, तांत्रिक आशावादाने संधारण झटकतात, वा राज्याच्या नियमन-सत्तेला एखादी गोष्ट मुळात वापरण्याजोगी कशाने बनते या प्रश्नाशी गोंधळवतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Forest and Wildlife Resources                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-forest-wildlife",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 2 — Forest and Wildlife Resources",
      hi: "अध्याय 2 — वन एवं वन्य जीव संसाधन",
      mr: "प्रकरण 2 — वने आणि वन्यजीव संसाधने",
    },
    name: {
      en: "Forest and Wildlife Resources",
      hi: "वन एवं वन्य जीव संसाधन",
      mr: "वने आणि वन्यजीव संसाधने",
    },
    summary: {
      en: "A country's living wealth counted and then defended: the variety that makes a forest more than its timber, species graded by how close they stand to disappearing, a campaign that saved one animal and a village that hugged its trees, and the grove no forest guard has ever needed to patrol.",
      hi: "किसी देश की जीवित संपदा गिनी और फिर बचाई गई: वह विविधता जो वन को उसकी लकड़ी से अधिक बनाती है, लुप्त होने से कितनी दूर खड़ी हैं इससे आँकी गई जातियाँ, वह अभियान जिसने एक जीव बचाया और वह गाँव जिसने अपने पेड़ों को गले लगाया, और वह उपवन जिस पर किसी वनरक्षक की गश्त कभी ज़रूरी नहीं पड़ी।",
      mr: "एखाद्या देशाची जिवंत संपदा मोजली आणि मग जपली: जी विविधता जंगलाला त्याच्या लाकडाहून अधिक करते, नाहीशा होण्यापासून किती जवळ आहेत यावरून मोजलेल्या जाती, ज्या मोहिमेने एक प्राणी वाचवला आणि ज्या गावाने आपल्या झाडांना मिठी मारली, आणि ज्या राईवर कोणत्या वनरक्षकाची गस्त कधी लागलीच नाही.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "biodiversity",
        name: {
          en: "Biodiversity",
          hi: "जैव विविधता",
          mr: "जैवविविधता",
        },
        kind: "idea",
        prompt: {
          en: "A single hectare of tropical forest may hold hundreds of tree species, thousands of insects and the birds, fungi and soil life that depend on them, all bound into one working web. What is this variety of life called?",
          hi: "उष्णकटिबंधीय वन का एक हेक्टेयर सैकड़ों वृक्ष-जातियाँ, हज़ारों कीट और उन पर निर्भर पक्षी, कवक तथा मृदा-जीवन समेटे हो सकता है, सब एक कार्यरत जाल में बँधे। जीवन की यह विविधता क्या कहलाती है?",
          mr: "उष्णकटिबंधीय जंगलाचा एक हेक्टर शेकडो वृक्षजाती, हजारो कीटक आणि त्यांच्यावर अवलंबून पक्षी, बुरशी व मृदा-जीवन सामावू शकतो, सर्व एका कार्यरत जाळ्यात बांधलेले. जीवनाची ही विविधता काय म्हणतात?",
        },
        statement: {
          en: "Biodiversity is the variety of living forms — species, the genes within them and the ecosystems they make up — and the interdependence among them that keeps the whole system working.",
          hi: "जैव विविधता जीवित रूपों की विविधता है — जातियाँ, उनके भीतर के जीन और वे पारितंत्र जो वे बनाते हैं — तथा उनके बीच वह परस्पर-निर्भरता जो पूरे तंत्र को चलाती रखती है।",
          mr: "जैवविविधता म्हणजे जिवंत रूपांची विविधता — जाती, त्यांच्यातील जनुके आणि त्या घडवणाऱ्या परिसंस्था — आणि त्यांच्यातील ती परस्परावलंबिता जी अख्खी यंत्रणा चालू ठेवते.",
        },
        detail: {
          en: "India holds about eight per cent of the world's recorded species on roughly two per cent of its land area, which makes it one of the most biodiverse countries on earth.",
          hi: "भारत विश्व की लगभग आठ प्रतिशत अभिलिखित जातियाँ लगभग दो प्रतिशत भूभाग पर रखता है, जो उसे पृथ्वी के सबसे जैव-विविध देशों में गिनवाता है।",
          mr: "भारत जगातील सुमारे आठ टक्के नोंदल्या गेलेल्या जाती सुमारे दोन टक्के भूभागावर बाळगतो, ज्यामुळे तो पृथ्वीवरील सर्वांत जैवविविध देशांपैकी एक ठरतो.",
        },
        extra: {
          en: "Its value is not only in the species themselves: pollinators, soil builders and water regulators do work that would cost enormous sums to replace.",
          hi: "उसका मूल्य केवल जातियों में नहीं: परागणकर्ता, मृदा-निर्माता और जल-नियामक ऐसा काम करते हैं जिसे बदलने में विशाल राशि लगेगी।",
          mr: "तिचे मोल केवळ जातींत नाही: परागकण वाहक, मृदा घडवणारे आणि जल नियंत्रक असे काम करतात ज्याची जागा भरायला प्रचंड रक्कम लागेल.",
        },
        pair: {
          left: {
            en: "Species, genes and ecosystems bound in one web",
            hi: "एक जाल में बँधे जातियाँ, जीन और पारितंत्र",
            mr: "एका जाळ्यात बांधलेल्या जाती, जनुके आणि परिसंस्था",
          },
          right: {
            en: "biodiversity",
            hi: "जैव विविधता",
            mr: "जैवविविधता",
          },
        },
      },
      {
        id: "threat-categories",
        name: {
          en: "Endangered and vulnerable species",
          hi: "संकटग्रस्त और सुभेद्य जातियाँ",
          mr: "संकटग्रस्त आणि असुरक्षित जाती",
        },
        kind: "idea",
        prompt: {
          en: "The blackbuck's numbers are falling but it survives in many places; the Asiatic cheetah is gone from India altogether; the Nicobar pigeon lives nowhere else on earth. Which grading of species by risk is being used here?",
          hi: "काले हिरन की संख्या घट रही है पर वह कई जगह बचा है; एशियाई चीता भारत से पूरी तरह जा चुका है; निकोबारी कबूतर पृथ्वी पर और कहीं नहीं रहता। यहाँ जातियों की जोखिम से कौन-सी श्रेणीबद्धता इस्तेमाल हो रही है?",
          mr: "काळवीटाची संख्या घटत आहे पण तो अनेक ठिकाणी टिकून आहे; आशियाई चित्ता भारतातून पूर्णपणे गेला आहे; निकोबारी कबूतर पृथ्वीवर इतरत्र कुठेही राहत नाही. इथे जातींची जोखमीनुसार कोणती श्रेणीबद्धता वापरली जात आहे?",
        },
        statement: {
          en: "Species are graded by how close they stand to disappearing — normal, vulnerable, endangered, rare, endemic to one region, and extinct — so that protection can be directed where the risk is highest.",
          hi: "जातियाँ इससे आँकी जाती हैं कि वे लुप्त होने से कितनी दूर खड़ी हैं — सामान्य, सुभेद्य, संकटग्रस्त, दुर्लभ, किसी एक क्षेत्र तक सीमित, और विलुप्त — ताकि संरक्षण वहाँ भेजा जा सके जहाँ जोखिम सबसे बड़ी है।",
          mr: "जाती त्या नाहीशा होण्यापासून किती जवळ आहेत यावरून मोजल्या जातात — सामान्य, असुरक्षित, संकटग्रस्त, दुर्मीळ, एकाच प्रदेशापुरत्या, आणि नामशेष — जेणेकरून संरक्षण तिथे पाठवता येईल जिथे जोखीम सर्वाधिक.",
        },
        detail: {
          en: "An endemic species is the most fragile of all, because it exists in only one place and a single local disaster can end it everywhere at once.",
          hi: "स्थानिक जाति सबसे नाज़ुक होती है, क्योंकि वह केवल एक ही जगह रहती है और एक स्थानीय आपदा उसे हर जगह एक साथ मिटा सकती है।",
          mr: "प्रदेशनिष्ठ जात सर्वांत नाजूक, कारण ती फक्त एकाच ठिकाणी असते आणि एक स्थानिक आपत्ती तिला सर्वत्र एकाच वेळी संपवू शकते.",
        },
        extra: {
          en: "The categories are not permanent: sustained protection has moved species back down the list, which is what makes the grading worth maintaining.",
          hi: "ये श्रेणियाँ स्थायी नहीं: लगातार संरक्षण ने जातियों को सूची में नीचे लौटाया है, और यही इस श्रेणीबद्धता को सँभालने योग्य बनाता है।",
          mr: "या श्रेणी कायमच्या नाहीत: सातत्यपूर्ण संरक्षणाने जाती यादीत खाली परत आणल्या आहेत, आणि हेच ही श्रेणीबद्धता जपण्याजोगी करते.",
        },
        pair: {
          left: {
            en: "Graded from vulnerable to extinct",
            hi: "सुभेद्य से विलुप्त तक आँकी गईं",
            mr: "असुरक्षितपासून नामशेषापर्यंत मोजलेल्या",
          },
          right: {
            en: "endangered and vulnerable species",
            hi: "संकटग्रस्त और सुभेद्य जातियाँ",
            mr: "संकटग्रस्त आणि असुरक्षित जाती",
          },
        },
      },
      {
        id: "project-tiger",
        name: {
          en: "Project Tiger",
          hi: "प्रोजेक्ट टाइगर",
          mr: "प्रोजेक्ट टायगर",
        },
        kind: "event",
        prompt: {
          en: "Launched in 1973 after numbers had fallen from an estimated forty thousand at the start of the century to under two thousand, it set aside reserves such as Corbett, Bandhavgarh and Periyar for one flagship animal. Which programme is this?",
          hi: "1973 में तब शुरू हुआ जब संख्या सदी के आरंभ के अनुमानित चालीस हज़ार से गिरकर दो हज़ार से नीचे आ गई थी, इसने कॉर्बेट, बांधवगढ़ और पेरियार जैसे आरक्षित क्षेत्र एक प्रमुख जीव के लिए अलग रखे। यह कौन-सा कार्यक्रम है?",
          mr: "1973 मध्ये तेव्हा सुरू झाला जेव्हा संख्या शतकाच्या सुरुवातीच्या अंदाजे चाळीस हजारांवरून दोन हजारांखाली आली होती, त्याने कॉर्बेट, बांधवगड आणि पेरियारसारखी राखीव क्षेत्रे एका प्रमुख प्राण्यासाठी बाजूला ठेवली. हा कोणता कार्यक्रम?",
        },
        statement: {
          en: "Project Tiger, begun in 1973, created a network of tiger reserves across India with strict protection of core areas, after poaching and habitat loss had reduced the population to a few hundred animals.",
          hi: "1973 में शुरू हुए प्रोजेक्ट टाइगर ने भारत भर बाघ आरक्षित क्षेत्रों का जाल बनाया जिनके क्रोड क्षेत्रों में कड़ा संरक्षण था, यह तब जब अवैध शिकार और आवास-हानि आबादी को कुछ सौ जानवरों तक ले आई थी।",
          mr: "1973 मध्ये सुरू झालेल्या प्रोजेक्ट टायगरने भारतभर वाघ राखीव क्षेत्रांचे जाळे उभारले ज्यांच्या गाभा क्षेत्रांत कडक संरक्षण होते, हे तेव्हा जेव्हा शिकार आणि अधिवास-हानीने संख्या काहीशे प्राण्यांपर्यंत आणली होती.",
        },
        detail: {
          en: "The tiger was chosen because it needs a very large territory and abundant prey, so protecting it protects the whole forest beneath it.",
          hi: "बाघ इसलिए चुना गया कि उसे बहुत बड़ा क्षेत्र और भरपूर शिकार चाहिए, अतः उसकी रक्षा उसके नीचे के पूरे वन की रक्षा करती है।",
          mr: "वाघ यासाठी निवडला की त्याला खूप मोठा प्रदेश आणि विपुल भक्ष्य लागते, म्हणून त्याचे रक्षण त्याच्याखालच्या अख्ख्या जंगलाचे रक्षण करते.",
        },
        extra: {
          en: "Its weakness was the same as its method: strict exclusion put reserve boundaries against the villages that had lived off those forests, and the conflict has never fully gone away.",
          hi: "उसकी दुर्बलता वही थी जो उसकी विधि: कड़े बहिष्कार ने आरक्षित सीमाओं को उन गाँवों के आमने-सामने खड़ा किया जो उन्हीं वनों से जीते थे, और वह टकराव कभी पूरी तरह गया नहीं।",
          mr: "त्याची दुर्बलता तीच होती जी त्याची पद्धत: कडक वगळण्याने राखीव सीमा त्या गावांसमोर उभ्या केल्या जी त्याच जंगलांवर जगत, आणि तो संघर्ष कधीच पूर्ण संपला नाही.",
        },
        pair: {
          left: {
            en: "Reserves for one flagship animal from 1973",
            hi: "1973 से एक प्रमुख जीव के लिए आरक्षित क्षेत्र",
            mr: "1973 पासून एका प्रमुख प्राण्यासाठी राखीव क्षेत्रे",
          },
          right: {
            en: "Project Tiger",
            hi: "प्रोजेक्ट टाइगर",
            mr: "प्रोजेक्ट टायगर",
          },
        },
      },
      {
        id: "chipko-movement",
        name: {
          en: "The Chipko movement",
          hi: "चिपको आंदोलन",
          mr: "चिपको चळवळ",
        },
        kind: "event",
        prompt: {
          en: "In the Garhwal Himalaya in the 1970s villagers, many of them women, put their arms around trees marked for felling by contractors, and won a ban on commercial logging in the region. Which movement is this?",
          hi: "1970 के दशक में गढ़वाल हिमालय में गाँववालों ने, जिनमें कई स्त्रियाँ थीं, ठेकेदारों द्वारा कटाई के लिए चिह्नित पेड़ों को बाँहों में भर लिया, और उस क्षेत्र में व्यावसायिक कटाई पर रोक जीत ली। यह कौन-सा आंदोलन है?",
          mr: "1970 च्या दशकात गढवाल हिमालयात गावकऱ्यांनी, ज्यांत अनेक स्त्रिया होत्या, कंत्राटदारांनी तोडणीसाठी खुणावलेल्या झाडांना मिठी मारली, आणि त्या प्रदेशात व्यापारी तोडणीवर बंदी मिळवली. ही कोणती चळवळ?",
        },
        statement: {
          en: "The Chipko movement of the 1970s in the Garhwal Himalaya saw villagers physically embrace trees to stop contractors felling them, and it succeeded in halting commercial logging and proving community afforestation could work.",
          hi: "1970 के दशक में गढ़वाल हिमालय के चिपको आंदोलन में गाँववालों ने ठेकेदारों को पेड़ काटने से रोकने के लिए उन्हें शारीरिक रूप से गले लगाया, और वह व्यावसायिक कटाई रोकने तथा यह सिद्ध करने में सफल रहा कि सामुदायिक वनरोपण चल सकता है।",
          mr: "1970 च्या दशकातील गढवाल हिमालयातील चिपको चळवळीत गावकऱ्यांनी कंत्राटदारांना झाडे तोडण्यापासून रोखायला त्यांना प्रत्यक्ष मिठी मारली, आणि ती व्यापारी तोडणी थांबवण्यात आणि सामुदायिक वनलागवड चालू शकते हे सिद्ध करण्यात यशस्वी ठरली.",
        },
        detail: {
          en: "The grievance was concrete: felled slopes had brought landslides and floods, and the timber went to distant industry while the village lost its fuel, fodder and topsoil.",
          hi: "शिकायत ठोस थी: कटी ढलानों ने भूस्खलन और बाढ़ें दीं, और लकड़ी दूर के उद्योग को गई जबकि गाँव ने अपना ईंधन, चारा और ऊपरी मिट्टी खोई।",
          mr: "तक्रार ठोस होती: तोडलेल्या उतारांनी भूस्खलन आणि पूर आणले, आणि लाकूड दूरच्या उद्योगाला गेले तर गावाने आपले इंधन, चारा आणि वरची माती गमावली.",
        },
        extra: {
          en: "Its lasting argument was that the people nearest a forest have the strongest interest in its survival, because they bear the cost of losing it first.",
          hi: "उसका टिकाऊ तर्क यह था कि वन के सबसे पास रहते लोगों का उसके बचे रहने में सबसे बड़ा हित है, क्योंकि उसे खोने की क़ीमत सबसे पहले वही चुकाते हैं।",
          mr: "तिचा टिकाऊ युक्तिवाद हा की जंगलाच्या सर्वांत जवळ राहणाऱ्या लोकांचे त्याच्या टिकण्यात सर्वांत मोठे हित, कारण ते गमावण्याची किंमत सर्वांत आधी तेच मोजतात.",
        },
        pair: {
          left: {
            en: "Arms around the marked trees in Garhwal",
            hi: "गढ़वाल में चिह्नित पेड़ों के गिर्द बाँहें",
            mr: "गढवालात खुणावलेल्या झाडांभोवती मिठी",
          },
          right: {
            en: "the Chipko movement",
            hi: "चिपको आंदोलन",
            mr: "चिपको चळवळ",
          },
        },
      },
      {
        id: "joint-forest-management",
        name: {
          en: "Joint Forest Management",
          hi: "संयुक्त वन प्रबंधन",
          mr: "संयुक्त वन व्यवस्थापन",
        },
        kind: "structure",
        prompt: {
          en: "Beginning in Odisha in 1988, village institutions were formally recognised as partners in protecting degraded state forest, in return for a share of the timber and rights to minor forest produce. What arrangement is this?",
          hi: "1988 में ओडिशा से शुरू होकर, गाँव की संस्थाओं को क्षरित राजकीय वन की रक्षा में औपचारिक साझेदार माना गया, बदले में लकड़ी में हिस्सा और गौण वन-उपज के अधिकार मिले। यह कौन-सी व्यवस्था है?",
          mr: "1988 मध्ये ओडिशापासून सुरू होऊन, गावातील संस्थांना क्षीण झालेल्या शासकीय जंगलाच्या रक्षणात औपचारिक भागीदार मानले गेले, बदल्यात लाकडात वाटा आणि गौण वनोपजाचे हक्क मिळाले. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "Joint Forest Management, begun in Odisha in 1988, involves local village committees in protecting and restoring degraded forests in partnership with the forest department, in exchange for a share of the produce.",
          hi: "संयुक्त वन प्रबंधन, जो 1988 में ओडिशा में शुरू हुआ, वन विभाग के साथ साझेदारी में क्षरित वनों की रक्षा और पुनर्स्थापना में स्थानीय ग्राम समितियों को जोड़ता है, उपज में हिस्से के बदले।",
          mr: "संयुक्त वन व्यवस्थापन, जे 1988 मध्ये ओडिशात सुरू झाले, वन विभागाच्या भागीदारीत क्षीण जंगलांचे रक्षण व पुनरुज्जीवन करण्यात स्थानिक ग्राम समित्यांना जोडते, उपजातील वाट्याच्या बदल्यात.",
        },
        detail: {
          en: "The logic is direct: a village that will receive a share of the harvest has a reason to stop outsiders — and its own members — from felling early.",
          hi: "तर्क सीधा है: जिस गाँव को उपज में हिस्सा मिलेगा उसके पास बाहरवालों को — और अपने ही सदस्यों को — जल्दी काटने से रोकने का कारण है।",
          mr: "तर्क सरळ आहे: ज्या गावाला उपजात वाटा मिळणार आहे त्याच्याकडे बाहेरच्यांना — आणि स्वतःच्या सदस्यांनाही — लवकर तोडण्यापासून रोखण्याचे कारण आहे.",
        },
        extra: {
          en: "It works best where the committee genuinely holds power; where the department keeps every decision, the partnership becomes a name for unpaid guard duty.",
          hi: "यह वहाँ सबसे अच्छा चलता है जहाँ समिति के पास सचमुच शक्ति हो; जहाँ हर निर्णय विभाग अपने पास रखे, वहाँ साझेदारी बिना वेतन की चौकीदारी का नाम बन जाती है।",
          mr: "ते तिथे सर्वांत चांगले चालते जिथे समितीकडे खरोखर सत्ता असते; जिथे प्रत्येक निर्णय विभाग स्वतःकडे ठेवतो, तिथे भागीदारी बिनपगारी पहारेकरीचे नाव बनते.",
        },
        pair: {
          left: {
            en: "Village committees as partners, with a share of produce",
            hi: "साझेदार के रूप में ग्राम समितियाँ, उपज में हिस्से के साथ",
            mr: "भागीदार म्हणून ग्राम समित्या, उपजातील वाट्यासह",
          },
          right: {
            en: "Joint Forest Management",
            hi: "संयुक्त वन प्रबंधन",
            mr: "संयुक्त वन व्यवस्थापन",
          },
        },
      },
      {
        id: "sacred-groves",
        name: {
          en: "Sacred groves",
          hi: "पवित्र उपवन",
          mr: "देवराया",
        },
        kind: "idea",
        prompt: {
          en: "In Rajasthan, Meghalaya, Kerala and the Western Ghats, patches of untouched forest are left standing because a deity is held to live there, and cutting even a branch is forbidden by custom. What are these called?",
          hi: "राजस्थान, मेघालय, केरल और पश्चिमी घाट में अछूते वन के टुकड़े इसलिए खड़े छोड़े जाते हैं कि वहाँ किसी देवता का वास माना जाता है, और परंपरा एक टहनी काटना भी मना करती है। ये क्या कहलाते हैं?",
          mr: "राजस्थान, मेघालय, केरळ आणि पश्चिम घाटांत अस्पर्श जंगलाचे तुकडे यासाठी उभे ठेवले जातात की तिथे एखाद्या देवतेचा वास मानला जातो, आणि परंपरा एक फांदी तोडणेही मनाई करते. यांना काय म्हणतात?",
        },
        statement: {
          en: "Sacred groves are patches of forest protected by religious belief and community custom rather than by law, and they often preserve species and old-growth trees lost from the surrounding landscape.",
          hi: "पवित्र उपवन वन के वे टुकड़े हैं जो क़ानून से नहीं बल्कि धार्मिक विश्वास और सामुदायिक परंपरा से सुरक्षित हैं, और वे अक्सर उन जातियों तथा पुराने पेड़ों को बचाए रखते हैं जो आसपास के भूदृश्य से जा चुके हैं।",
          mr: "देवराया म्हणजे जंगलाचे ते तुकडे जे कायद्याने नव्हे तर धार्मिक श्रद्धा आणि सामुदायिक परंपरेने सुरक्षित आहेत, आणि ते अनेकदा त्या जाती व जुनी झाडे टिकवतात जी भोवतीच्या भूदृश्यातून गेली आहेत.",
        },
        detail: {
          en: "The Bishnois of Rajasthan extend the same protection to animals, and the blackbuck and chinkara survive around their villages where they are hunted elsewhere.",
          hi: "राजस्थान के बिश्नोई वही सुरक्षा जीवों तक बढ़ाते हैं, और उनके गाँवों के आसपास काला हिरन तथा चिंकारा बचे हैं जहाँ अन्यत्र उनका शिकार होता है।",
          mr: "राजस्थानचे बिश्नोई तेच संरक्षण प्राण्यांपर्यंत वाढवतात, आणि त्यांच्या गावांभोवती काळवीट व चिंकारा टिकून आहेत जिथे इतरत्र त्यांची शिकार होते.",
        },
        extra: {
          en: "They matter as evidence, not just as relics: they show conservation can hold for centuries without a single guard, provided the community believes the rule is its own.",
          hi: "वे केवल अवशेष के रूप में नहीं, प्रमाण के रूप में मायने रखते हैं: वे दिखाते हैं कि संरक्षण बिना एक भी पहरेदार के सदियों टिक सकता है, बशर्ते समुदाय नियम को अपना माने।",
          mr: "ते केवळ अवशेष म्हणून नव्हे तर पुरावा म्हणून महत्त्वाचे: ते दाखवतात की संधारण एकही पहारेकरीविना शतके टिकू शकते, जर समुदायाला नियम आपला वाटत असेल.",
        },
        pair: {
          left: {
            en: "Forest kept whole by belief, not by law",
            hi: "क़ानून से नहीं, विश्वास से पूरा बचा वन",
            mr: "कायद्याने नव्हे, श्रद्धेने अखंड राखलेले जंगल",
          },
          right: {
            en: "sacred groves",
            hi: "पवित्र उपवन",
            mr: "देवराया",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Colonial and post-independence forest policy treated conservation as a matter of drawing a boundary and keeping people out, yet forests inside such boundaries have often degraded while village-protected patches nearby stayed intact. Explain why exclusion so frequently fails.",
          hi: "औपनिवेशिक और स्वतंत्रता के बाद की वन-नीति ने संरक्षण को सीमा खींचकर लोगों को बाहर रखने का मामला माना, फिर भी ऐसी सीमाओं के भीतर के वन अक्सर क्षरित हुए जबकि पास के गाँव-रक्षित टुकड़े अछूते बने रहे। समझाओ बहिष्कार इतनी बार विफल क्यों होता है।",
          mr: "वसाहती आणि स्वातंत्र्योत्तर वननीतीने संधारणाला सीमा आखून लोकांना बाहेर ठेवण्याची बाब मानले, तरीही अशा सीमांच्या आतली जंगले अनेकदा क्षीण झाली तर जवळचे गाव-रक्षित तुकडे अभंग राहिले. समजावा वगळणे इतक्या वेळा का फसते.",
        },
        choices: [
          {
            en: "Because a boundary removes the people with the strongest stake in the forest and replaces them with a handful of underpaid guards who cannot watch thousands of hectares. Villagers who lose fuel, fodder and grazing gain no reason to protect what is now someone else's, and every use becomes an offence, so they stop reporting outsiders. Where communities keep rights and a share — as in sacred groves and Joint Forest Management — protection has thousands of eyes instead of two",
            hi: "क्योंकि सीमा उन लोगों को हटा देती है जिनका वन में सबसे बड़ा दाँव है और उनकी जगह मुट्ठी भर कम-वेतन पहरेदार रख देती है जो हज़ारों हेक्टेयर नहीं देख सकते। जो गाँववाले ईंधन, चारा और चराई खोते हैं उनके पास अब किसी और की चीज़ बचाने का कोई कारण नहीं रहता, और हर उपयोग अपराध बन जाता है, अतः वे बाहरवालों की सूचना देना बंद कर देते हैं। जहाँ समुदाय अधिकार और हिस्सा रखते हैं — जैसे पवित्र उपवनों और संयुक्त वन प्रबंधन में — वहाँ रक्षा के पास दो के बजाय हज़ारों आँखें होती हैं",
            mr: "कारण सीमा त्या लोकांना काढून टाकते ज्यांचा जंगलात सर्वांत मोठा वाटा आहे आणि त्यांच्या जागी मूठभर कमी पगाराचे पहारेकरी ठेवते जे हजारो हेक्टर पाहू शकत नाहीत. जे गावकरी इंधन, चारा आणि चराई गमावतात त्यांच्याकडे आता दुसऱ्या कोणाची वस्तू जपण्याचे कारण उरत नाही, आणि प्रत्येक वापर गुन्हा बनतो, म्हणून ते बाहेरच्यांची खबर देणे थांबवतात. जिथे समुदाय हक्क आणि वाटा राखतात — जसे देवराया आणि संयुक्त वन व्यवस्थापनात — तिथे रक्षणाकडे दोनऐवजी हजारो डोळे असतात",
          },
          {
            en: "Because forests inside reserves receive less rainfall than forests outside them",
            hi: "क्योंकि आरक्षित क्षेत्रों के भीतर के वनों को बाहर के वनों से कम वर्षा मिलती है",
            mr: "कारण राखीव क्षेत्रांतील जंगलांना बाहेरच्या जंगलांपेक्षा कमी पाऊस मिळतो",
          },
          {
            en: "Because villagers are indifferent to forests and would destroy any forest they were allowed near",
            hi: "क्योंकि गाँववाले वनों के प्रति उदासीन हैं और जिस वन के पास उन्हें जाने दिया जाए उसे नष्ट कर देंगे",
            mr: "कारण गावकरी जंगलांबद्दल उदासीन आहेत आणि ज्या जंगलाजवळ त्यांना जाऊ दिले ते नष्ट करतील",
          },
          {
            en: "Because exclusion never fails; every protected area in India is in better condition than every unprotected one",
            hi: "क्योंकि बहिष्कार कभी विफल नहीं होता; भारत का हर संरक्षित क्षेत्र हर असंरक्षित क्षेत्र से बेहतर हालत में है",
            mr: "कारण वगळणे कधीच फसत नाही; भारतातील प्रत्येक संरक्षित क्षेत्र प्रत्येक असंरक्षित क्षेत्राहून चांगल्या स्थितीत आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The failure is not a failure of intention but of arithmetic and incentive, and both point the same way. Start with the arithmetic. A reserve may run to hundreds or thousands of square kilometres, patrolled by a small, poorly paid and thinly equipped staff. No number of guards a state can afford will cover that ground continuously. Effective protection has always depended on the fact that people who live in and around a forest are in it every day and notice immediately when a truck arrives, a snare is set or a tree is marked. The exclusion model removes precisely those observers and replaces them with a handful of officials, so surveillance collapses to almost nothing across most of the area most of the time. Now the incentive, which matters more. Before the boundary, a village's relationship to the forest was one of use and therefore of interest: it supplied firewood, fodder, grazing, bamboo, honey, medicinal plants and, for many Adivasi communities, a large part of the diet. A community that depends on a forest year after year has a direct stake in it still being there next year, and customary rules — seasons, quotas, protected patches, sacred groves — commonly enforced that. Draw a line and declare the forest state property, and that relationship is inverted. The villagers now bear pure cost: they lose the fuel and fodder, they must buy or walk further for what was free, they may be relocated, and crop-raiding animals from the protected area are the department's animals but the farmer's loss. What they gain is nothing. Worse, every ordinary use — a head-load of firewood, a goat let in to graze — becomes a punishable offence, so ordinary people become poachers in law, and the relationship with the forest staff becomes adversarial. The predictable consequence is that nobody reports the outsider with the chainsaw either, because informing serves an institution that treats you as a criminal. That is why the counter-examples are so instructive. Sacred groves have survived for centuries with no guard at all, protected by a rule the community regards as its own. The Bishnois protect blackbuck around their villages while the same species is hunted elsewhere. Chipko succeeded because the villagers' interest in standing trees — against landslides, for fuel and fodder — was stronger than any contractor's interest, and stronger than any patrol. Joint Forest Management was designed on exactly this reading: give the village committee a share of the produce and a genuine say, and protection acquires thousands of watchful people instead of two. None of this means protected areas are worthless; core zones with strict protection have been essential for species like the tiger that cannot tolerate disturbance. It means conservation designed against local people is fighting the one force that could make it cheap and permanent, and that where rights and benefits are shared, the forest gains a constituency rather than an enemy. (The wrong answers invent a rainfall difference, blame villagers for a destruction the record attributes largely to commercial logging and clearance, or deny the well-documented degradation inside many reserves.)",
          hi: "विफलता इरादे की नहीं, अंकगणित और प्रेरणा की है, और दोनों एक ही ओर इशारा करते हैं। अंकगणित से शुरू। कोई आरक्षित क्षेत्र सैकड़ों या हज़ारों वर्ग किलोमीटर का हो सकता है, जिस पर छोटा, कम-वेतन और कम साधन वाला अमला गश्त करता है। राज्य जितने पहरेदार जुटा सकता है वे उस भूभाग को लगातार नहीं ढक सकते। कारगर संरक्षण सदा इस तथ्य पर टिका रहा कि वन में और उसके आसपास रहते लोग हर दिन उसी में होते हैं और तुरंत भाँप लेते हैं कि कोई ट्रक आया, फंदा लगा या पेड़ चिह्नित हुआ। बहिष्कार का ढाँचा ठीक उन्हीं प्रेक्षकों को हटाता है और उनकी जगह मुट्ठी भर अधिकारी रखता है, अतः अधिकांश क्षेत्र में अधिकांश समय निगरानी लगभग शून्य पर आ जाती है। अब प्रेरणा, जो अधिक मायने रखती है। सीमा से पहले गाँव का वन से रिश्ता उपयोग का और इसलिए हित का था: वह ईंधन, चारा, चराई, बाँस, शहद, औषधीय पौधे और कई आदिवासी समुदायों के लिए आहार का बड़ा हिस्सा देता था। जो समुदाय वर्ष-दर-वर्ष वन पर निर्भर है उसका सीधा दाँव इसमें है कि वह अगले वर्ष भी वहाँ हो, और परंपरागत नियम — मौसम, मात्राएँ, सुरक्षित टुकड़े, पवित्र उपवन — आमतौर पर यही लागू करते थे। रेखा खींचो और वन को राजकीय संपत्ति घोषित करो, तो वह रिश्ता उलट जाता है। अब गाँववाले शुद्ध लागत ढोते हैं: वे ईंधन और चारा खोते हैं, जो मुफ़्त था उसके लिए ख़रीदना या दूर चलना पड़ता है, उन्हें हटाया जा सकता है, और संरक्षित क्षेत्र से आकर फ़सल उजाड़ते जानवर विभाग के हैं पर हानि किसान की। जो मिलता है वह कुछ नहीं। इससे बुरा यह कि हर साधारण उपयोग — सिर पर ईंधन का गट्ठर, चरने छोड़ी बकरी — दंडनीय अपराध बन जाता है, अतः साधारण लोग क़ानून की नज़र में शिकारी बन जाते हैं, और वन-कर्मियों से रिश्ता शत्रुता का हो जाता है। अपेक्षित परिणाम यह कि आरी लिए बाहरवाले की सूचना भी कोई नहीं देता, क्योंकि सूचना उस संस्था के काम आती है जो तुम्हें अपराधी मानती है। इसीलिए प्रति-उदाहरण इतने शिक्षाप्रद हैं। पवित्र उपवन बिना एक भी पहरेदार सदियों बचे रहे, ऐसे नियम से सुरक्षित जिसे समुदाय अपना मानता है। बिश्नोई अपने गाँवों के आसपास काले हिरन बचाते हैं जबकि वही जाति अन्यत्र शिकार होती है। चिपको इसलिए सफल हुआ कि खड़े पेड़ों में गाँववालों का हित — भूस्खलन के विरुद्ध, ईंधन और चारे के लिए — किसी ठेकेदार के हित से और किसी गश्त से अधिक प्रबल था। संयुक्त वन प्रबंधन ठीक इसी पाठ पर रचा गया: ग्राम समिति को उपज में हिस्सा और असली आवाज़ दो, और रक्षा को दो के बजाय हज़ारों चौकस लोग मिल जाते हैं। इसका अर्थ यह नहीं कि संरक्षित क्षेत्र निर्मूल्य हैं; कड़े संरक्षण वाले क्रोड क्षेत्र बाघ जैसी जातियों के लिए अनिवार्य रहे हैं जो व्यवधान नहीं सह सकतीं। इसका अर्थ यह है कि स्थानीय लोगों के विरुद्ध रचा संरक्षण उसी एक शक्ति से लड़ रहा है जो उसे सस्ता और स्थायी बना सकती थी, और जहाँ अधिकार और लाभ बाँटे जाते हैं वहाँ वन को शत्रु नहीं, एक पक्ष मिल जाता है। (ग़लत उत्तर वर्षा का अंतर गढ़ते, उस विनाश का दोष गाँववालों पर डालते जिसे अभिलेख बड़े हिस्से में व्यावसायिक कटाई और सफ़ाई को देते हैं, या कई आरक्षित क्षेत्रों के भीतर के भली-भाँति दर्ज क्षरण को नकारते हैं।)",
          mr: "अपयश हेतूचे नव्हे तर अंकगणित आणि प्रेरणेचे आहे, आणि दोन्ही एकाच दिशेने निर्देश करतात. अंकगणितापासून सुरू. एखादे राखीव क्षेत्र शेकडो वा हजारो चौरस किलोमीटरचे असू शकते, ज्यावर लहान, कमी पगाराचा आणि तुटपुंजी साधने असलेला कर्मचारीवर्ग गस्त घालतो. राज्य जितके पहारेकरी परवडू शकते ते तो भूभाग सतत झाकू शकत नाहीत. परिणामकारक संरक्षण सदैव या तथ्यावर टेकले की जंगलात व त्याभोवती राहणारे लोक रोज त्यातच असतात आणि लगेच ओळखतात की ट्रक आला, सापळा लावला वा झाड खुणावले. वगळण्याचे प्रारूप नेमके त्याच निरीक्षकांना काढते आणि त्यांच्या जागी मूठभर अधिकारी ठेवते, म्हणून बहुतांश क्षेत्रात बहुतांश वेळ देखरेख जवळजवळ शून्यावर येते. आता प्रेरणा, जी अधिक महत्त्वाची. सीमेआधी गावाचे जंगलाशी नाते वापराचे आणि म्हणून हिताचे होते: ते इंधन, चारा, चराई, बांबू, मध, औषधी वनस्पती आणि अनेक आदिवासी समुदायांसाठी आहाराचा मोठा भाग देत असे. जो समुदाय वर्षानुवर्षे जंगलावर अवलंबून आहे त्याचा थेट वाटा यात की ते पुढच्या वर्षीही तिथे असावे, आणि पारंपरिक नियम — हंगाम, मर्यादा, राखीव तुकडे, देवराया — सहसा तेच राबवत. रेषा आखा आणि जंगल शासकीय मालमत्ता घोषित करा, आणि ते नाते उलटते. आता गावकरी शुद्ध खर्च वाहतात: ते इंधन आणि चारा गमावतात, जे फुकट होते त्यासाठी विकत घ्यावे वा दूर चालावे लागते, त्यांना हलवले जाऊ शकते, आणि संरक्षित क्षेत्रातून येऊन पीक उद्ध्वस्त करणारे प्राणी विभागाचे पण नुकसान शेतकऱ्याचे. जे मिळते ते काहीच नाही. याहून वाईट म्हणजे प्रत्येक सामान्य वापर — डोक्यावरचा इंधनाचा भारा, चरायला सोडलेली शेळी — शिक्षापात्र गुन्हा बनतो, म्हणून सामान्य माणसे कायद्याच्या नजरेत शिकारी बनतात, आणि वनकर्मचाऱ्यांशी नाते शत्रुत्वाचे होते. अपेक्षित परिणाम हा की करवत घेतलेल्या बाहेरच्याचीही खबर कोणी देत नाही, कारण खबर त्या संस्थेच्या उपयोगी पडते जी तुम्हाला गुन्हेगार मानते. म्हणूनच प्रति-उदाहरणे इतकी शिकवणारी. देवराया एकही पहारेकरीविना शतके टिकल्या, अशा नियमाने सुरक्षित जो समुदायाला आपला वाटतो. बिश्नोई आपल्या गावांभोवती काळवीट जपतात तर तीच जात इतरत्र शिकारली जाते. चिपको यासाठी यशस्वी झाली की उभ्या झाडांतील गावकऱ्यांचे हित — भूस्खलनाविरुद्ध, इंधन आणि चाऱ्यासाठी — कोणत्याही कंत्राटदाराच्या हिताहून आणि कोणत्याही गस्तीहून प्रबळ होते. संयुक्त वन व्यवस्थापन नेमके याच वाचनावर रचले गेले: ग्राम समितीला उपजात वाटा आणि खरा आवाज द्या, आणि रक्षणाला दोनऐवजी हजारो जागरूक माणसे मिळतात. याचा अर्थ संरक्षित क्षेत्रे निरुपयोगी असा नाही; कडक संरक्षणाची गाभा क्षेत्रे वाघासारख्या जातींसाठी अत्यावश्यक ठरली आहेत ज्या व्यत्यय सोसू शकत नाहीत. याचा अर्थ हा की स्थानिक लोकांविरुद्ध रचलेले संधारण त्याच एका शक्तीशी लढत आहे जी त्याला स्वस्त आणि कायमचे करू शकत होती, आणि जिथे हक्क व लाभ वाटले जातात तिथे जंगलाला शत्रू नव्हे तर एक पाठिराखा मिळतो. (चुकीची उत्तरे पावसाचा फरक रचतात, नोंदी मुख्यत्वे व्यापारी तोडणी आणि साफसफाईला देत असलेल्या विनाशाचा दोष गावकऱ्यांवर टाकतात, वा अनेक राखीव क्षेत्रांतील नोंदलेला ऱ्हास नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "It is often argued that a poor country cannot afford biodiversity — that protecting species is a luxury to be taken up once poverty is solved, and that forests are better converted to farms, mines and dams. Assess that argument on its own economic terms.",
          hi: "अक्सर तर्क दिया जाता है कि कोई निर्धन देश जैव विविधता का बोझ नहीं उठा सकता — कि जातियों की रक्षा एक विलासिता है जिसे निर्धनता हल होने के बाद उठाया जाए, और वनों को खेतों, खदानों तथा बाँधों में बदलना बेहतर है। उस तर्क को उसी की आर्थिक शर्तों पर परखो।",
          mr: "अनेकदा युक्तिवाद केला जातो की एखादा गरीब देश जैवविविधता परवडू शकत नाही — की जातींचे रक्षण ही चैन आहे जी दारिद्र्य सुटल्यावर हाती घ्यावी, आणि जंगले शेते, खाणी व धरणांत बदलणे अधिक चांगले. तो युक्तिवाद त्याच्याच आर्थिक अटींवर तपासा.",
        },
        choices: [
          {
            en: "It fails on its own terms, because the forest is already producing economic value that no budget records: pollination of crops, groundwater recharge, flood and landslide control, soil formation, timber and non-timber produce, and the genetic stock from which medicines and crop varieties are drawn. Clearing it converts a permanent income into a single payment and shifts the costs onto the poorest, who lose fuel, fodder and food first — so the trade-off is not development against nature but short-term revenue against long-term productivity",
            hi: "यह अपनी ही शर्तों पर विफल होता है, क्योंकि वन पहले से ही ऐसा आर्थिक मूल्य पैदा कर रहा है जिसे कोई बजट दर्ज नहीं करता: फ़सलों का परागण, भूजल पुनर्भरण, बाढ़ और भूस्खलन पर रोक, मृदा-निर्माण, काष्ठ और गौण उपज, तथा वह आनुवंशिक भंडार जिससे औषधियाँ और फ़सल-क़िस्में निकाली जाती हैं। उसे साफ़ करना एक स्थायी आय को एक बार की अदायगी में बदल देता है और लागत सबसे निर्धनों पर डाल देता है, जो ईंधन, चारा और भोजन सबसे पहले खोते हैं — अतः सौदा विकास बनाम प्रकृति का नहीं बल्कि अल्पकालिक राजस्व बनाम दीर्घकालिक उत्पादकता का है",
            mr: "तो त्याच्याच अटींवर फसतो, कारण जंगल आधीच असे आर्थिक मूल्य निर्माण करत आहे जे कोणतेही अंदाजपत्रक नोंदवत नाही: पिकांचे परागण, भूजल पुनर्भरण, पूर व भूस्खलनावर नियंत्रण, मृदा-निर्मिती, लाकूड व गौण उपज, आणि तो जनुकीय साठा ज्यातून औषधे व पीक-जाती काढल्या जातात. ते साफ करणे कायमच्या उत्पन्नाचे एकदाच्या भरण्यात रूपांतर करते आणि खर्च सर्वांत गरिबांवर टाकते, जे इंधन, चारा आणि अन्न सर्वांत आधी गमावतात — म्हणून सौदा विकास विरुद्ध निसर्ग नव्हे तर अल्पकालीन महसूल विरुद्ध दीर्घकालीन उत्पादकता",
          },
          {
            en: "The argument is sound: forests produce nothing measurable, so any conversion is a clear economic gain",
            hi: "तर्क ठीक है: वन कुछ भी मापने योग्य नहीं देते, अतः कोई भी रूपांतरण स्पष्ट आर्थिक लाभ है",
            mr: "युक्तिवाद योग्य आहे: जंगले काहीही मोजण्याजोगे देत नाहीत, म्हणून कोणतेही रूपांतर स्पष्ट आर्थिक लाभ",
          },
          {
            en: "The argument fails only because species have spiritual value, and economics has nothing to say about it either way",
            hi: "तर्क केवल इसलिए विफल होता है कि जातियों का आध्यात्मिक मूल्य है, और अर्थशास्त्र के पास इस बारे में कहने को कुछ भी नहीं",
            mr: "युक्तिवाद केवळ यासाठी फसतो की जातींना आध्यात्मिक मोल आहे, आणि अर्थशास्त्राकडे याबद्दल सांगायला काहीच नाही",
          },
          {
            en: "It is irrelevant, since forest loss in India has been driven entirely by natural causes rather than human decisions",
            hi: "यह अप्रासंगिक है, क्योंकि भारत में वन-हानि पूरी तरह प्राकृतिक कारणों से हुई, मानवीय निर्णयों से नहीं",
            mr: "तो असंबद्ध आहे, कारण भारतातील वनहानी पूर्णपणे नैसर्गिक कारणांनी झाली, मानवी निर्णयांनी नव्हे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The argument deserves to be met on economics rather than sentiment, and on that ground it does not hold up. Its hidden assumption is that a standing forest yields nothing, so that anything built in its place is pure gain. But a forest is already a producing asset; its output simply never appears in a revenue statement. Consider what it delivers. Insects that live in and near forest patches pollinate the crops of the farms around them, and where the forest goes the yields of several fruit and oilseed crops fall measurably. Forested catchments slow rainfall, let it soak in and recharge the wells and springs that irrigate and supply drinking water downstream; strip them, and the same rain arrives as flood in one week and drought in the next, which is precisely the sequence Chipko's villagers described after the felling above their fields. Roots hold hill slopes together, so deforestation buys landslides. Leaf fall builds soil, and soil is not quickly replaceable. Beyond these services there is direct produce — timber, bamboo, honey, lac, gum, tendu leaves, medicinal plants, fruit and fodder — much of it collected by people with no other cash income at all. And there is the genetic library: a large share of modern medicines derives from wild organisms, and plant breeders return repeatedly to wild relatives of crops for resistance to new diseases. That last item is an option whose value is unknown precisely because the uses have not been discovered yet — and it is destroyed permanently the moment a species goes. Now compare the conversion. Clearing a forest for a mine or a plantation delivers a large payment, but it is a single payment: the timber is sold once, the ore runs out, the reservoir silts up. Set against a permanent annual stream of pollination, water and produce, the arithmetic is far less favourable than it looks, and it looks favourable only because one side is priced and the other is not. There is also a distributional point the argument ignores entirely. The revenue from conversion goes to a company or a state treasury; the losses fall on the people who used the forest — Adivasi communities and the landless poor, for whom it was fuel, fodder, food and medicine, and who have no way of buying replacements. Development that impoverishes the poorest is a strange kind of anti-poverty policy. None of this establishes that no forest may ever be cleared. Roads, power and farmland are real needs, and there are cases where the calculation genuinely favours conversion. What it establishes is that the calculation must include the whole ledger — services, produce, option value and who bears the loss — rather than counting only the timber revenue and the project cost. Done honestly, that accounting turns most conversions into a choice between a short-term receipt and a long-term productive asset, which is why sustainable use, community rights and Joint Forest Management are argued for as economics rather than as sentiment. (The wrong answers accept the false premise that forests produce nothing measurable, retreat to spiritual value where an economic case is available, or deny human causation that the record of logging, clearance and mining documents plainly.)",
          hi: "तर्क को भावना के बजाय अर्थशास्त्र पर मिलना चाहिए, और उस ज़मीन पर वह टिकता नहीं। उसकी छिपी मान्यता यह है कि खड़ा वन कुछ नहीं देता, अतः उसकी जगह जो भी बने वह शुद्ध लाभ है। पर वन पहले से ही एक उत्पादक परिसंपत्ति है; उसका उत्पादन बस कभी किसी राजस्व-विवरण में नहीं आता। देखो वह क्या देता है। वन-टुकड़ों में और उनके पास रहते कीट आसपास के खेतों की फ़सलों का परागण करते हैं, और जहाँ वन जाता है वहाँ कई फल तथा तिलहन फ़सलों की पैदावार मापने योग्य ढंग से गिरती है। वनाच्छादित जल-ग्रहण क्षेत्र वर्षा को धीमा करते हैं, उसे रिसने देते हैं और उन कुओं-सोतों को भरते हैं जो नीचे सिंचाई और पेयजल देते हैं; उन्हें उजाड़ो, और वही वर्षा एक हफ़्ते बाढ़ और अगले हफ़्ते सूखा बनकर आती है — ठीक वही क्रम जो चिपको के गाँववालों ने अपने खेतों के ऊपर कटाई के बाद बताया। जड़ें पहाड़ी ढलानों को बाँधे रखती हैं, अतः वनोन्मूलन भूस्खलन ख़रीदता है। पत्ती-झड़न मिट्टी बनाती है, और मिट्टी जल्दी बदली नहीं जा सकती। इन सेवाओं से परे सीधी उपज है — काष्ठ, बाँस, शहद, लाख, गोंद, तेंदू पत्ता, औषधीय पौधे, फल और चारा — जिसका बड़ा हिस्सा वे लोग बटोरते हैं जिनकी और कोई नक़द आय है ही नहीं। और आनुवंशिक पुस्तकालय है: आधुनिक औषधियों का बड़ा हिस्सा जंगली जीवों से निकला है, और पादप-प्रजनक नई बीमारियों के प्रतिरोध के लिए बार-बार फ़सलों के जंगली संबंधियों तक लौटते हैं। वह अंतिम मद एक ऐसा विकल्प है जिसका मूल्य ठीक इसलिए अज्ञात है कि उसके उपयोग अभी खोजे ही नहीं गए — और जाति के जाते ही वह स्थायी रूप से नष्ट हो जाता है। अब रूपांतरण से तुलना करो। खदान या बाग़ान के लिए वन साफ़ करना बड़ी अदायगी देता है, पर वह एक बार की अदायगी है: लकड़ी एक बार बिकती है, अयस्क चुक जाता है, जलाशय गाद से भर जाता है। परागण, जल और उपज की स्थायी वार्षिक धारा के सामने रखो तो अंकगणित दिखने से कहीं कम अनुकूल है, और अनुकूल केवल इसलिए दिखता है कि एक पक्ष की क़ीमत लगी है और दूसरे की नहीं। एक वितरण-संबंधी बिंदु भी है जिसे तर्क पूरी तरह अनदेखा करता है। रूपांतरण का राजस्व किसी कंपनी या राजकोष को जाता है; हानि उन लोगों पर पड़ती है जो वन इस्तेमाल करते थे — आदिवासी समुदाय और भूमिहीन निर्धन, जिनके लिए वह ईंधन, चारा, भोजन और औषधि था, और जिनके पास विकल्प ख़रीदने का कोई उपाय नहीं। जो विकास सबसे निर्धनों को और निर्धन करे वह विचित्र क़िस्म की निर्धनता-विरोधी नीति है। इसमें से कुछ भी यह सिद्ध नहीं करता कि कोई वन कभी साफ़ न किया जाए। सड़कें, बिजली और कृषि-भूमि असली ज़रूरतें हैं, और ऐसे प्रकरण हैं जहाँ गणना सचमुच रूपांतरण के पक्ष में जाती है। यह जो सिद्ध करता है वह यह कि गणना में पूरी बही आनी चाहिए — सेवाएँ, उपज, विकल्प-मूल्य और हानि कौन ढोता है — केवल काष्ठ-राजस्व और परियोजना-लागत गिनकर नहीं। ईमानदारी से किया जाए तो वह लेखांकन अधिकांश रूपांतरणों को अल्पकालिक रसीद और दीर्घकालिक उत्पादक परिसंपत्ति के बीच के चुनाव में बदल देता है — इसीलिए सतत उपयोग, सामुदायिक अधिकार और संयुक्त वन प्रबंधन के लिए भावना के बजाय अर्थशास्त्र के तर्क दिए जाते हैं। (ग़लत उत्तर इस झूठी मान्यता को स्वीकार लेते कि वन कुछ भी मापने योग्य नहीं देते, जहाँ आर्थिक तर्क उपलब्ध है वहाँ आध्यात्मिक मूल्य में लौट जाते, या उस मानवीय कारणता को नकारते जिसे कटाई, सफ़ाई और खनन का अभिलेख साफ़ दर्ज करता है।)",
          mr: "युक्तिवादाला भावनेऐवजी अर्थशास्त्रावर भेटले पाहिजे, आणि त्या भूमीवर तो टिकत नाही. त्याचे लपलेले गृहीतक हे की उभे जंगल काही देत नाही, म्हणून त्याच्या जागी जे बांधले जाईल ते शुद्ध लाभ. पण जंगल आधीच उत्पादक मालमत्ता आहे; तिचे उत्पादन फक्त कधीही महसूल-विवरणात येत नाही. ते काय देते ते पाहा. जंगल-तुकड्यांत आणि त्यांच्याजवळ राहणारे कीटक भोवतीच्या शेतांतील पिकांचे परागण करतात, आणि जिथे जंगल जाते तिथे अनेक फळ व तेलबिया पिकांचे उत्पादन मोजण्याजोगे घसरते. जंगलाच्छादित पाणलोट पाऊस मंदावतात, त्याला मुरू देतात आणि त्या विहिरी-झऱ्यांना भरतात जे खाली सिंचन व पिण्याचे पाणी देतात; ते उजाड करा, आणि तोच पाऊस एका आठवड्यात पूर आणि पुढच्या आठवड्यात दुष्काळ बनून येतो — नेमका तोच क्रम जो चिपकोच्या गावकऱ्यांनी आपल्या शेतांवरील तोडणीनंतर वर्णिला. मुळे डोंगरउतार बांधून ठेवतात, म्हणून वनतोड भूस्खलन विकत घेते. पानगळ माती घडवते, आणि माती लवकर बदलता येत नाही. या सेवांपलीकडे थेट उपज आहे — लाकूड, बांबू, मध, लाख, डिंक, तेंदूपाने, औषधी वनस्पती, फळे आणि चारा — ज्याचा मोठा भाग ते लोक गोळा करतात ज्यांना दुसरे कोणतेही रोख उत्पन्न नाहीच. आणि जनुकीय ग्रंथालय आहे: आधुनिक औषधांचा मोठा भाग वन्य जीवांतून आला आहे, आणि वनस्पती-प्रजननकर्ते नव्या रोगांच्या प्रतिकारासाठी वारंवार पिकांच्या वन्य नातलगांकडे परततात. ती शेवटची बाब असा पर्याय आहे जिचे मोल नेमके यासाठी अज्ञात की तिचे उपयोग अजून शोधलेच गेले नाहीत — आणि जात जाताच तो कायमचा नष्ट होतो. आता रूपांतराशी तुलना करा. खाण वा मळ्यासाठी जंगल साफ करणे मोठे भरणे देते, पण ते एकदाचे भरणे: लाकूड एकदा विकले जाते, धातुक संपते, जलाशय गाळाने भरतो. परागण, पाणी आणि उपजाच्या कायमच्या वार्षिक प्रवाहासमोर ठेवले तर अंकगणित दिसण्याहून कितीतरी कमी अनुकूल आहे, आणि अनुकूल केवळ यासाठी दिसते की एका बाजूची किंमत लावली आहे आणि दुसऱ्याची नाही. एक वाटपाचा मुद्दाही आहे जो युक्तिवाद पूर्णपणे दुर्लक्षितो. रूपांतराचा महसूल एखाद्या कंपनीला वा राजकोषाला जातो; हानी त्या लोकांवर पडते ज्यांनी जंगल वापरले — आदिवासी समुदाय आणि भूमिहीन गरीब, ज्यांच्यासाठी ते इंधन, चारा, अन्न आणि औषध होते, आणि ज्यांच्याकडे पर्याय विकत घेण्याचा कोणताही मार्ग नाही. जो विकास सर्वांत गरिबांना अधिक गरीब करतो ते विचित्र प्रकारचे दारिद्र्यविरोधी धोरण. यातील काहीही हे सिद्ध करत नाही की कोणतेही जंगल कधीही साफ करू नये. रस्ते, वीज आणि शेतजमीन या खऱ्या गरजा आहेत, आणि अशी प्रकरणे आहेत जिथे हिशोब खरोखर रूपांतराच्या बाजूने जातो. जे ते सिद्ध करते ते हे की हिशोबात अख्खी खतावणी यावी — सेवा, उपज, पर्याय-मोल आणि हानी कोण वाहतो — केवळ लाकूड-महसूल आणि प्रकल्प-खर्च मोजून नव्हे. प्रामाणिकपणे केल्यास ते लेखांकन बहुतांश रूपांतरांना अल्पकालीन पावती आणि दीर्घकालीन उत्पादक मालमत्ता यांतील निवडीत बदलते — म्हणूनच शाश्वत वापर, सामुदायिक हक्क आणि संयुक्त वन व्यवस्थापनासाठी भावनेऐवजी अर्थशास्त्राचे युक्तिवाद दिले जातात. (चुकीची उत्तरे जंगले काहीही मोजण्याजोगे देत नाहीत हे खोटे गृहीतक स्वीकारतात, जिथे आर्थिक युक्तिवाद उपलब्ध आहे तिथे आध्यात्मिक मोलाकडे माघार घेतात, वा तोडणी, साफसफाई व खाणकामाच्या नोंदी स्पष्ट दस्तऐवजीकृत करत असलेली मानवी कारणे नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Water Resources                                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-water-resources",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 3 — Water Resources",
      hi: "अध्याय 3 — जल संसाधन",
      mr: "प्रकरण 3 — जलसंसाधने",
    },
    name: {
      en: "Water Resources",
      hi: "जल संसाधन",
      mr: "जलसंसाधने",
    },
    summary: {
      en: "A country with plenty of rain and not enough water: shortage that comes from how it is shared rather than how much falls, the great dams sold as temples and the valleys they drowned, the movement that asked who pays for a reservoir — and the roof, the tanka and the bamboo pipe that answer the same question without a wall across a river.",
      hi: "भरपूर वर्षा और फिर भी पर्याप्त पानी नहीं वाला देश: वह कमी जो इससे आती है कि पानी कैसे बाँटा जाता, न कि कितना गिरता; मंदिर कहकर बेचे गए बड़े बाँध और उनके डुबोए घाटियाँ; वह आंदोलन जिसने पूछा कि जलाशय की क़ीमत कौन चुकाता — और वह छत, टाँका तथा बाँस की नली जो वही प्रश्न बिना नदी पर दीवार खींचे उत्तर देते हैं।",
      mr: "भरपूर पाऊस आणि तरीही पुरेसे पाणी नसलेला देश: ती टंचाई जी पाणी कसे वाटले जाते यातून येते, किती पडते यातून नव्हे; मंदिरे म्हणून विकली गेलेली मोठी धरणे आणि त्यांनी बुडवलेल्या दऱ्या; ज्या चळवळीने विचारले की जलाशयाची किंमत कोण मोजतो — आणि ते छप्पर, टाकं आणि बांबूची नळी जी तोच प्रश्न नदीवर भिंत न घालता उत्तरतात.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "water-stress",
        name: {
          en: "Water stress in India",
          hi: "भारत में जल-तनाव",
          mr: "भारतात जल-ताण",
        },
        kind: "idea",
        prompt: {
          en: "Cherrapunji receives some of the heaviest rainfall on earth and still faces drinking-water shortage in the dry months; Delhi has piped supply that reaches some colonies daily and others once a week. What condition do both illustrate?",
          hi: "चेरापूँजी पृथ्वी की सबसे भारी वर्षा में से कुछ पाता है और फिर भी शुष्क महीनों में पेयजल की कमी झेलता है; दिल्ली में पाइप की आपूर्ति कुछ कॉलोनियों तक रोज़ और कुछ तक हफ़्ते में एक बार पहुँचती है। दोनों कौन-सी स्थिति दिखाते हैं?",
          mr: "चेरापुंजीला पृथ्वीवरील सर्वांत जास्त पावसांपैकी काही मिळतो आणि तरीही कोरड्या महिन्यांत पिण्याच्या पाण्याची टंचाई सोसते; दिल्लीत नळाचा पुरवठा काही वसाहतींना रोज आणि काहींना आठवड्यातून एकदा पोहोचतो. दोन्ही कोणती स्थिती दाखवतात?",
        },
        statement: {
          en: "Water stress in India arises less from the total rainfall than from its uneven timing and distribution, over-extraction of groundwater, pollution of surface water, and unequal access between users.",
          hi: "भारत में जल-तनाव कुल वर्षा से कम, उसके असमान समय और वितरण, भूजल के अति-दोहन, सतही जल के प्रदूषण तथा उपयोगकर्ताओं के बीच असमान पहुँच से उठता है।",
          mr: "भारतातील जल-ताण एकूण पावसाहून कमी, त्याच्या असमान वेळ व वाटपातून, भूजलाच्या अति-उपशातून, पृष्ठजलाच्या प्रदूषणातून आणि वापरकर्त्यांमधील असमान प्रवेशातून उद्भवतो.",
        },
        detail: {
          en: "Most of the rain arrives in about a hundred days of the monsoon, so a place can be flooded in July and parched in April of the same year.",
          hi: "अधिकांश वर्षा मानसून के लगभग सौ दिनों में आती है, अतः कोई जगह उसी वर्ष जुलाई में डूबी और अप्रैल में सूखी हो सकती है।",
          mr: "बहुतांश पाऊस मान्सूनच्या सुमारे शंभर दिवसांत येतो, म्हणून एखादे ठिकाण त्याच वर्षी जुलैत बुडालेले आणि एप्रिलमध्ये कोरडे असू शकते.",
        },
        extra: {
          en: "Scarcity is therefore social as much as physical: two households on the same street can face entirely different shortages depending on which is on the pipe.",
          hi: "अतः कमी भौतिक जितनी ही सामाजिक है: एक ही गली के दो घर पूरी तरह भिन्न कमी झेल सकते हैं, यह इस पर कि पाइप किसके यहाँ है।",
          mr: "म्हणून टंचाई भौतिक जितकीच सामाजिक: एकाच गल्लीतील दोन घरे पूर्णपणे वेगळी टंचाई सोसू शकतात, नळ कोणाकडे आहे यावरून.",
        },
        pair: {
          left: {
            en: "Rain in a hundred days, shortage in the other two hundred",
            hi: "सौ दिनों में वर्षा, शेष दो सौ में कमी",
            mr: "शंभर दिवसांत पाऊस, उरलेल्या दोनशेत टंचाई",
          },
          right: {
            en: "water stress in India",
            hi: "भारत में जल-तनाव",
            mr: "भारतात जल-ताण",
          },
        },
      },
      {
        id: "multipurpose-projects",
        name: {
          en: "Multi-purpose river projects",
          hi: "बहुउद्देशीय नदी परियोजनाएँ",
          mr: "बहुउद्देशीय नदी प्रकल्प",
        },
        kind: "structure",
        prompt: {
          en: "Bhakra-Nangal on the Sutlej and Hirakud on the Mahanadi were each built to do several jobs at once — store water for irrigation, generate electricity, control floods and supply towns. What are such schemes called?",
          hi: "सतलुज पर भाखड़ा-नांगल और महानदी पर हीराकुंड — दोनों एक साथ कई काम करने बनाए गए: सिंचाई को पानी रोकना, बिजली बनाना, बाढ़ रोकना और शहरों को आपूर्ति देना। ऐसी योजनाएँ क्या कहलाती हैं?",
          mr: "सतलजवरील भाक्रा-नांगल आणि महानदीवरील हिराकूड — दोन्ही एकाच वेळी अनेक कामे करायला बांधली: सिंचनासाठी पाणी अडवणे, वीज निर्माण करणे, पूर रोखणे आणि शहरांना पुरवठा देणे. अशा योजना काय म्हणतात?",
        },
        statement: {
          en: "Multi-purpose river projects use a single dam to serve several ends at once — irrigation, hydroelectricity, flood control, water supply, navigation and fisheries — and were called the temples of modern India.",
          hi: "बहुउद्देशीय नदी परियोजनाएँ एक ही बाँध से एक साथ कई उद्देश्य साधती हैं — सिंचाई, जल-विद्युत, बाढ़-नियंत्रण, जल-आपूर्ति, नौवहन और मत्स्य-पालन — और इन्हें आधुनिक भारत के मंदिर कहा गया।",
          mr: "बहुउद्देशीय नदी प्रकल्प एकाच धरणातून एकाच वेळी अनेक उद्दिष्टे साधतात — सिंचन, जलविद्युत, पूरनियंत्रण, पाणीपुरवठा, जलवाहतूक आणि मत्स्यपालन — आणि यांना आधुनिक भारताची मंदिरे म्हटले गेले.",
        },
        detail: {
          en: "The gains were real: assured canal irrigation carried the Green Revolution in Punjab and Haryana, and hydel power ran the factories that followed.",
          hi: "लाभ असली थे: निश्चित नहर-सिंचाई ने पंजाब और हरियाणा में हरित क्रांति ढोई, और जल-विद्युत ने उसके बाद आए कारख़ाने चलाए।",
          mr: "फायदे खरे होते: खात्रीशीर कालवा-सिंचनाने पंजाब आणि हरियाणात हरितक्रांती वाहिली, आणि जलविद्युतेने नंतर आलेले कारखाने चालवले.",
        },
        extra: {
          en: "The costs were also real: submerged villages and forests, silt trapped behind the wall instead of enriching the fields, and floods made worse when a full reservoir must release water in a heavy year.",
          hi: "लागतें भी असली थीं: डूबे गाँव और वन, खेतों को समृद्ध करने के बजाय दीवार के पीछे फँसी गाद, और भारी वर्ष में भरे जलाशय से पानी छोड़ना पड़े तो और बिगड़ी बाढ़ें।",
          mr: "खर्चही खरे होते: बुडालेली गावे व जंगले, शेतांना समृद्ध करण्याऐवजी भिंतीमागे अडकलेला गाळ, आणि जास्त पावसाच्या वर्षी भरलेल्या जलाशयातून पाणी सोडावे लागल्यास अधिक बिघडलेले पूर.",
        },
        pair: {
          left: {
            en: "One dam for irrigation, power and flood control",
            hi: "सिंचाई, बिजली और बाढ़-नियंत्रण के लिए एक बाँध",
            mr: "सिंचन, वीज आणि पूरनियंत्रणासाठी एक धरण",
          },
          right: {
            en: "multi-purpose river projects",
            hi: "बहुउद्देशीय नदी परियोजनाएँ",
            mr: "बहुउद्देशीय नदी प्रकल्प",
          },
        },
      },
      {
        id: "narmada-bachao",
        name: {
          en: "The Narmada Bachao Andolan",
          hi: "नर्मदा बचाओ आंदोलन",
          mr: "नर्मदा बचाव आंदोलन",
        },
        kind: "event",
        prompt: {
          en: "A movement of villagers, Adivasi communities, farmers and environmentalists opposed the raising of a large dam on a central Indian river, arguing that those displaced were never properly resettled. Which movement is this?",
          hi: "गाँववालों, आदिवासी समुदायों, किसानों और पर्यावरणवादियों के एक आंदोलन ने मध्य भारत की एक नदी पर बड़े बाँध की ऊँचाई बढ़ाने का विरोध किया, यह तर्क देते हुए कि विस्थापितों का कभी ठीक से पुनर्वास हुआ ही नहीं। यह कौन-सा आंदोलन है?",
          mr: "गावकरी, आदिवासी समुदाय, शेतकरी आणि पर्यावरणवाद्यांच्या एका चळवळीने मध्य भारतातील एका नदीवरील मोठ्या धरणाची उंची वाढवण्यास विरोध केला, हा युक्तिवाद करत की विस्थापितांचे कधी नीट पुनर्वसन झालेच नाही. ही कोणती चळवळ?",
        },
        statement: {
          en: "The Narmada Bachao Andolan opposed the raising of the Sardar Sarovar dam on the Narmada, on the grounds that displaced villagers and Adivasi families were not properly resettled or compensated.",
          hi: "नर्मदा बचाओ आंदोलन ने नर्मदा पर सरदार सरोवर बाँध की ऊँचाई बढ़ाने का विरोध इस आधार पर किया कि विस्थापित गाँववालों और आदिवासी परिवारों का न ठीक से पुनर्वास हुआ न मुआवज़ा।",
          mr: "नर्मदा बचाव आंदोलनाने नर्मदेवरील सरदार सरोवर धरणाची उंची वाढवण्यास या आधारावर विरोध केला की विस्थापित गावकरी आणि आदिवासी कुटुंबांचे नीट पुनर्वसन झाले नाही ना मोबदला मिळाला.",
        },
        detail: {
          en: "The complaint was distributional rather than technical: the water and power went to distant districts while the submergence fell on the valley's own people.",
          hi: "शिकायत तकनीकी नहीं, वितरण-संबंधी थी: पानी और बिजली दूर के ज़िलों को गए जबकि डूब घाटी के अपने ही लोगों पर पड़ी।",
          mr: "तक्रार तांत्रिक नव्हे तर वाटपाची होती: पाणी आणि वीज दूरच्या जिल्ह्यांना गेली तर बुडीत खोऱ्याच्याच लोकांवर पडली.",
        },
        extra: {
          en: "It changed how such projects are judged, forcing resettlement, environmental clearance and public hearing into the approval process for large dams.",
          hi: "उसने बदल दिया कि ऐसी परियोजनाएँ कैसे आँकी जाती हैं, और बड़े बाँधों की स्वीकृति-प्रक्रिया में पुनर्वास, पर्यावरणीय अनापत्ति तथा जन-सुनवाई को घुसा दिया।",
          mr: "तिने असे प्रकल्प कसे तपासले जातात ते बदलले, आणि मोठ्या धरणांच्या मंजुरी-प्रक्रियेत पुनर्वसन, पर्यावरणीय मंजुरी व जनसुनावणी घुसवली.",
        },
        pair: {
          left: {
            en: "Who is drowned so that others may irrigate",
            hi: "कौन डूबे ताकि दूसरे सींच सकें",
            mr: "कोण बुडावे जेणेकरून इतरांना सिंचन मिळेल",
          },
          right: {
            en: "the Narmada Bachao Andolan",
            hi: "नर्मदा बचाओ आंदोलन",
            mr: "नर्मदा बचाव आंदोलन",
          },
        },
      },
      {
        id: "rainwater-harvesting",
        name: {
          en: "Rooftop rainwater harvesting",
          hi: "छत से वर्षाजल संचयन",
          mr: "छपरावरील पावसाळी जलसंचय",
        },
        kind: "process",
        prompt: {
          en: "In Shillong many households collect the rain that falls on their own roofs through pipes into a stored tank or a recharge pit, and meet a large part of their needs without any municipal line. What practice is this?",
          hi: "शिलांग में कई घर अपनी ही छतों पर गिरती वर्षा को पाइपों से संचित टंकी या पुनर्भरण गड्ढे में जमा करते हैं, और अपनी ज़रूरतों का बड़ा हिस्सा बिना किसी नगरपालिका लाइन के पूरा करते हैं। यह कौन-सी प्रथा है?",
          mr: "शिलाँगमध्ये अनेक घरे स्वतःच्या छपरांवर पडणारा पाऊस नळ्यांतून साठवण टाकीत वा पुनर्भरण खड्ड्यात गोळा करतात, आणि आपल्या गरजांचा मोठा भाग कोणत्याही नगरपालिका वाहिनीविना भागवतात. ही कोणती प्रथा?",
        },
        statement: {
          en: "Rooftop rainwater harvesting collects the rain falling on a roof and channels it into a storage tank or a pit that recharges the groundwater, giving a household water it does not have to be supplied.",
          hi: "छत से वर्षाजल संचयन छत पर गिरती वर्षा को इकट्ठा कर उसे संचय-टंकी या भूजल भरने वाले गड्ढे में ले जाता है, जिससे घर को वह पानी मिलता है जिसे आपूर्ति करनी नहीं पड़ती।",
          mr: "छपरावरील पावसाळी जलसंचय छपरावर पडणारा पाऊस गोळा करून तो साठवण टाकीत वा भूजल भरणाऱ्या खड्ड्यात नेतो, ज्यामुळे घराला ते पाणी मिळते जे पुरवावे लागत नाही.",
        },
        detail: {
          en: "It is cheap, needs no land acquisition and displaces nobody, and it puts the supply under the control of the household that built it.",
          hi: "यह सस्ता है, भूमि-अधिग्रहण नहीं माँगता और किसी को विस्थापित नहीं करता, और आपूर्ति उसी घर के नियंत्रण में रखता है जिसने उसे बनाया।",
          mr: "ते स्वस्त, जमीन-संपादन मागत नाही आणि कोणालाही विस्थापित करत नाही, आणि पुरवठा त्याच घराच्या नियंत्रणात ठेवते ज्याने ते बांधले.",
        },
        extra: {
          en: "Several states now require it in new buildings, and Tamil Nadu was the first to make it compulsory across the state.",
          hi: "कई राज्य अब इसे नए भवनों में अनिवार्य करते हैं, और तमिलनाडु पहला राज्य था जिसने इसे पूरे राज्य में अनिवार्य किया।",
          mr: "अनेक राज्ये आता नव्या इमारतींत ते सक्तीचे करतात, आणि तमिळनाडू हे ते संपूर्ण राज्यभर सक्तीचे करणारे पहिले राज्य होते.",
        },
        pair: {
          left: {
            en: "The roof's own rain, piped to a tank or a pit",
            hi: "छत की अपनी वर्षा, टंकी या गड्ढे तक पाइप से",
            mr: "छपराचा स्वतःचा पाऊस, नळीने टाकीत वा खड्ड्यात",
          },
          right: {
            en: "rooftop rainwater harvesting",
            hi: "छत से वर्षाजल संचयन",
            mr: "छपरावरील पावसाळी जलसंचय",
          },
        },
      },
      {
        id: "tankas",
        name: {
          en: "The tankas of Rajasthan",
          hi: "राजस्थान के टाँके",
          mr: "राजस्थानची टाकी",
        },
        kind: "structure",
        prompt: {
          en: "In Bikaner and Jaisalmer, underground rooms are dug beneath the courtyard, plastered watertight and fed by the rooftops, holding rain through a year in which almost none may fall again. What are these called?",
          hi: "बीकानेर और जैसलमेर में आँगन के नीचे भूमिगत कोठरियाँ खोदी जातीं, जलरोधी पलस्तर की जातीं और छतों से भरी जातीं, जो पूरे वर्ष वर्षा सँभालती हैं जिसमें शायद फिर कुछ भी न बरसे। ये क्या कहलाती हैं?",
          mr: "बिकानेर आणि जैसलमेरमध्ये अंगणाखाली भूमिगत खोल्या खणल्या जातात, जलरोधक गिलावा केला जातो आणि छपरांतून भरल्या जातात, ज्या अख्खे वर्षभर पाऊस सांभाळतात ज्यात कदाचित पुन्हा काहीच पडणार नाही. यांना काय म्हणतात?",
        },
        statement: {
          en: "Tankas are underground tanks built beneath the courtyards of desert houses in Rajasthan, plastered watertight and filled from the rooftops, storing rainwater for drinking through the long dry season.",
          hi: "टाँके राजस्थान के मरुस्थलीय घरों के आँगनों के नीचे बने भूमिगत कुंड हैं, जलरोधी पलस्तर किए और छतों से भरे जाते, जो लंबे शुष्क मौसम भर पीने का वर्षाजल संचित रखते हैं।",
          mr: "टाकी म्हणजे राजस्थानच्या वाळवंटी घरांच्या अंगणांखाली बांधलेली भूमिगत कुंडे, जलरोधक गिलावा केलेली आणि छपरांतून भरलेली, जी दीर्घ कोरड्या हंगामभर पिण्याचे पावसाळी पाणी साठवतात.",
        },
        detail: {
          en: "Being underground and covered, the water stays cool and clean, and some houses keep a room cooled simply by the tanka beneath it.",
          hi: "भूमिगत और ढका होने से पानी ठंडा तथा साफ़ रहता है, और कुछ घरों में नीचे के टाँके भर से एक कमरा ठंडा रहता है।",
          mr: "भूमिगत आणि झाकलेले असल्याने पाणी थंड आणि स्वच्छ राहते, आणि काही घरांत खालच्या टाक्यामुळेच एक खोली थंड राहते.",
        },
        extra: {
          en: "Where canal water arrived, many tankas fell out of use — and households discovered the loss when the canal ran dry or the supply was rationed.",
          hi: "जहाँ नहर का पानी पहुँचा वहाँ कई टाँके इस्तेमाल से बाहर हो गए — और घरों को हानि तब पता चली जब नहर सूखी या आपूर्ति राशन पर आई।",
          mr: "जिथे कालव्याचे पाणी पोहोचले तिथे अनेक टाकी वापराबाहेर गेली — आणि घरांना तोटा तेव्हा कळला जेव्हा कालवा आटला वा पुरवठा रेशनवर आला.",
        },
        pair: {
          left: {
            en: "A watertight room under the courtyard",
            hi: "आँगन के नीचे जलरोधी कोठरी",
            mr: "अंगणाखालची जलरोधक खोली",
          },
          right: {
            en: "the tankas of Rajasthan",
            hi: "राजस्थान के टाँके",
            mr: "राजस्थानची टाकी",
          },
        },
      },
      {
        id: "bamboo-drip-irrigation",
        name: {
          en: "Bamboo drip irrigation",
          hi: "बाँस की टपक सिंचाई",
          mr: "बांबूची ठिबक सिंचाई",
        },
        kind: "structure",
        prompt: {
          en: "In Meghalaya, spring water is carried across hillsides in split bamboo pipes that divide and narrow along the way, so that a few drops reach the base of each betel or pepper plant. What system is this?",
          hi: "मेघालय में झरने का पानी पहाड़ी ढलानों पर चीरे हुए बाँस की नलियों से ले जाया जाता है जो रास्ते में बँटती और सँकरी होती जाती हैं, ताकि हर पान या मिर्च के पौधे की जड़ तक कुछ बूँदें पहुँचें। यह कौन-सी प्रणाली है?",
          mr: "मेघालयात झऱ्याचे पाणी डोंगरउतारांवरून चिरलेल्या बांबूच्या नळ्यांतून नेले जाते ज्या वाटेत विभागत आणि अरुंद होत जातात, जेणेकरून प्रत्येक पान वा मिरीच्या रोपाच्या मुळाशी काही थेंब पोहोचतील. ही कोणती पद्धत?",
        },
        statement: {
          en: "Bamboo drip irrigation carries spring water across Meghalaya's hillsides in split bamboo channels that branch and narrow, delivering a slow drip to the roots of each plant with almost no loss.",
          hi: "बाँस की टपक सिंचाई मेघालय की पहाड़ी ढलानों पर झरने का पानी चीरे हुए बाँस की नालियों से ले जाती है जो बँटती और सँकरी होती जाती हैं, और लगभग बिना हानि हर पौधे की जड़ तक धीमी टपक पहुँचाती हैं।",
          mr: "बांबूची ठिबक सिंचाई मेघालयाच्या डोंगरउतारांवरून झऱ्याचे पाणी चिरलेल्या बांबूच्या नाल्यांतून नेते ज्या विभागत आणि अरुंद होत जातात, आणि जवळजवळ हानीविना प्रत्येक रोपाच्या मुळाशी मंद ठिबक पोहोचवतात.",
        },
        detail: {
          en: "It is two centuries old and uses gravity alone — no pump, no fuel and no part that cannot be cut from a nearby grove.",
          hi: "यह दो सौ वर्ष पुरानी है और केवल गुरुत्व से चलती है — न पंप, न ईंधन, न कोई ऐसा पुर्ज़ा जो पास के झुरमुट से न काटा जा सके।",
          mr: "ती दोनशे वर्षे जुनी आणि केवळ गुरुत्वावर चालते — ना पंप, ना इंधन, ना असा कोणता भाग जो जवळच्या बेटातून कापता येणार नाही.",
        },
        extra: {
          en: "Modern drip irrigation reaches the same conclusion with plastic and valves, which shows the local design had solved the problem long before the technology was patented.",
          hi: "आधुनिक टपक सिंचाई वही निष्कर्ष प्लास्टिक और वाल्वों से पाती है, जो दिखाता है कि स्थानीय रचना ने समस्या तकनीक के पेटेंट होने से बहुत पहले हल कर ली थी।",
          mr: "आधुनिक ठिबक सिंचाई तोच निष्कर्ष प्लास्टिक आणि झडपांनी गाठते, जे दाखवते की स्थानिक रचनेने समस्या तंत्रज्ञानाचे स्वामित्व नोंदवण्याच्या खूप आधी सोडवली होती.",
        },
        pair: {
          left: {
            en: "Split bamboo carrying a drip down a hillside",
            hi: "पहाड़ी ढलान पर टपक ले जाता चीरा बाँस",
            mr: "डोंगरउतारावरून ठिबक नेणारा चिरलेला बांबू",
          },
          right: {
            en: "bamboo drip irrigation",
            hi: "बाँस की टपक सिंचाई",
            mr: "बांबूची ठिबक सिंचाई",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A large dam is built to control floods, and for two decades it does. Thirty years later the same river floods worse than before in heavy years, and the fields downstream are visibly less fertile. Both changes trace to the same physical process. Identify it and explain the mechanism.",
          hi: "बाढ़ रोकने को एक बड़ा बाँध बनता है, और दो दशक वह रोकता भी है। तीस वर्ष बाद वही नदी भारी वर्षों में पहले से बुरी बाढ़ लाती है, और नीचे के खेत स्पष्ट रूप से कम उपजाऊ हैं। दोनों बदलाव उसी एक भौतिक प्रक्रिया तक जाते हैं। उसे पहचानो और क्रियाविधि समझाओ।",
          mr: "पूर रोखायला एक मोठे धरण बांधले जाते, आणि दोन दशके ते रोखतेही. तीस वर्षांनी तीच नदी जास्त पावसाच्या वर्षी आधीहून वाईट पूर आणते, आणि खालची शेते स्पष्टपणे कमी सुपीक. दोन्ही बदल त्याच एका भौतिक प्रक्रियेकडे जातात. ती ओळखा आणि क्रियाविधी समजावा.",
        },
        choices: [
          {
            en: "Sedimentation. A river carries silt that used to be spread over the floodplain each year, renewing its fertility; the dam traps that silt behind the wall instead. So downstream fields stop receiving their annual dressing and grow poorer, while the reservoir's own storage volume steadily fills up with mud — leaving less room to hold a flood peak, so that in a heavy year the dam must release large volumes and the flood arrives worse than it would have",
            hi: "अवसादन। नदी वह गाद ढोती है जो पहले हर वर्ष बाढ़-मैदान पर फैलकर उसकी उर्वरता नई करती थी; बाँध उस गाद को दीवार के पीछे फँसा लेता है। अतः नीचे के खेतों को उनकी वार्षिक परत मिलनी बंद हो जाती और वे निर्धन होते जाते, जबकि जलाशय की अपनी भंडारण-क्षमता लगातार कीचड़ से भरती जाती — बाढ़ का शिखर रोकने को कम जगह छोड़ते हुए, अतः भारी वर्ष में बाँध को बड़ी मात्रा छोड़नी पड़ती और बाढ़ उससे बुरी आती जितनी आती",
            mr: "गाळ साचणे. नदी तो गाळ वाहते जो पूर्वी दरवर्षी पूरमैदानावर पसरून त्याची सुपीकता नवी करत असे; धरण तो गाळ भिंतीमागे अडकवते. म्हणून खालच्या शेतांना त्यांचा वार्षिक थर मिळणे थांबते आणि ती गरीब होत जातात, तर जलाशयाची स्वतःची साठवण क्षमता सतत गाळाने भरत जाते — पुराचे शिखर धरायला कमी जागा ठेवत, म्हणून जास्त पावसाच्या वर्षी धरणाला मोठ्या प्रमाणात पाणी सोडावे लागते आणि पूर तो आला असता त्याहून वाईट येतो",
          },
          {
            en: "The dam physically increases the total rainfall in its catchment, so more water arrives every year",
            hi: "बाँध अपने जल-ग्रहण क्षेत्र में कुल वर्षा भौतिक रूप से बढ़ा देता है, अतः हर वर्ष अधिक पानी आता है",
            mr: "धरण आपल्या पाणलोटातील एकूण पाऊस भौतिकदृष्ट्या वाढवते, म्हणून दरवर्षी अधिक पाणी येते",
          },
          {
            en: "Concrete leaches chemicals that sterilise the soil for hundreds of kilometres downstream",
            hi: "कंक्रीट ऐसे रसायन छोड़ता है जो नीचे सैकड़ों किलोमीटर तक मिट्टी को बंजर कर देते हैं",
            mr: "काँक्रीट अशी रसायने सोडते जी खाली शेकडो किलोमीटर माती नापीक करतात",
          },
          {
            en: "Neither effect is real; dams keep their full storage capacity and downstream fertility indefinitely",
            hi: "दोनों प्रभाव असली नहीं; बाँध अपनी पूरी भंडारण-क्षमता और नीचे की उर्वरता अनिश्चित काल तक बनाए रखते हैं",
            mr: "दोन्ही परिणाम खरे नाहीत; धरणे आपली पूर्ण साठवण क्षमता आणि खालची सुपीकता अनिश्चित काळ टिकवतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both effects come from a single fact: a river carries not only water but a large load of suspended silt, and a dam stops the silt as effectively as it stops the water. Begin with what the river used to do. Every flood season, water spilling over the banks slowed as it spread across the floodplain, and slow water cannot hold silt in suspension. The load settled out over the fields as a thin layer of fresh mineral-rich material. This is why floodplain agriculture in the Ganga, Kaveri and Nile valleys has been productive for thousands of years without artificial fertiliser: the river was delivering it annually, free. Now insert a dam. The reservoir behind it is a large body of still water, so the incoming river slows and drops nearly its entire silt load there rather than downstream. Two consequences follow, and they unfold on different timescales. The first is felt in the fields. Water released from a dam is comparatively clear, so the annual dressing of silt stops arriving. The soil does not become barren overnight, but its natural replenishment ends, and over decades the fields need increasing quantities of purchased fertiliser to hold their yields — a cost transferred quietly from the river to the farmer. The delta at the river's mouth is starved too, and where silt no longer arrives to rebuild it, the sea begins eating into the coast. The second consequence accumulates behind the wall. Every year's trapped silt reduces the reservoir's volume. A dam designed with a certain flood cushion — a margin of empty space kept to absorb an unusually large inflow — finds that margin shrinking year by year as mud fills the basin. For the first decades this is invisible; the dam performs as designed and the flood-control claim looks vindicated. But once storage has been substantially lost, a heavy monsoon fills the reduced reservoir quickly, and the operators face a choice they cannot avoid: hold the water and risk the dam, or open the gates. They open the gates, and a large volume is released in a short time into a river whose downstream channel has often also silted up and been built along in the years of apparent safety. The resulting flood can be worse than the pre-dam floods, because it arrives as a sudden release rather than a natural rise. There is a bitter symmetry here worth noticing: the same silt that would have fertilised the fields is what destroys the flood-control capacity, so the two failures are not separate misfortunes but one process seen from two ends. This is why silt management — desilting, catchment afforestation to reduce erosion, and realistic accounting of a reservoir's working life — belongs in any honest assessment of a large dam, and why the projects' original benefit-cost calculations, which often assumed permanent storage, overstated what was being bought. (The wrong answers invent rainfall creation, chemical leaching, or deny effects that reservoir surveys and downstream soil records both document.)",
          hi: "दोनों प्रभाव एक ही तथ्य से आते हैं: नदी केवल पानी नहीं बल्कि निलंबित गाद का बड़ा भार ढोती है, और बाँध गाद को उतनी ही कारगरता से रोकता है जितनी पानी को। पहले देखो नदी पहले क्या करती थी। हर बाढ़-ऋतु में किनारों से छलकता पानी बाढ़-मैदान पर फैलते हुए धीमा होता, और धीमा पानी गाद को निलंबित नहीं रख सकता। वह भार खेतों पर ताज़ी खनिज-समृद्ध सामग्री की पतली परत बनकर बैठ जाता। इसीलिए गंगा, कावेरी और नील की घाटियों में बाढ़-मैदान की खेती हज़ारों वर्ष बिना कृत्रिम उर्वरक उत्पादक रही: नदी उसे हर वर्ष, मुफ़्त, पहुँचा रही थी। अब बाँध रखो। उसके पीछे का जलाशय ठहरे पानी का बड़ा पिंड है, अतः आती नदी धीमी होकर अपना लगभग पूरा गाद-भार नीचे नहीं, वहीं गिरा देती है। दो परिणाम निकलते हैं, और वे अलग-अलग काल-मापों पर खुलते हैं। पहला खेतों में महसूस होता है। बाँध से छोड़ा पानी तुलनात्मक रूप से साफ़ होता है, अतः गाद की वार्षिक परत आनी बंद हो जाती है। मिट्टी रातोंरात बंजर नहीं होती, पर उसका प्राकृतिक पुनर्भरण समाप्त हो जाता है, और दशकों में खेतों को अपनी पैदावार बनाए रखने के लिए बढ़ती मात्रा में ख़रीदा उर्वरक चाहिए होता है — एक लागत जो चुपचाप नदी से किसान पर सरक जाती है। नदी के मुहाने का डेल्टा भी भूखा रहता है, और जहाँ उसे फिर से बनाने को गाद नहीं आती वहाँ समुद्र तट को खाने लगता है। दूसरा परिणाम दीवार के पीछे जमा होता है। हर वर्ष फँसी गाद जलाशय का आयतन घटाती है। जिस बाँध में एक निश्चित बाढ़-गद्दी रखी गई — असामान्य रूप से बड़े प्रवाह को सोखने रखी ख़ाली जगह का हाशिया — वह हाशिया वर्ष-दर-वर्ष सिकुड़ता जाता है जैसे-जैसे कीचड़ बेसिन भरता है। पहले दशकों में यह अदृश्य रहता है; बाँध रचना के अनुसार काम करता है और बाढ़-नियंत्रण का दावा सही लगता है। पर एक बार भंडारण काफ़ी खो जाने के बाद, भारी मानसून घटे जलाशय को जल्दी भर देता है, और संचालकों के सामने ऐसा चुनाव आता है जिससे वे बच नहीं सकते: पानी रोको और बाँध जोखिम में डालो, या फाटक खोलो। वे फाटक खोलते हैं, और बड़ी मात्रा थोड़े समय में उस नदी में छूटती है जिसका नीचे का पाट अक्सर स्वयं भी गाद से भर चुका होता है और जिसके किनारे स्पष्ट सुरक्षा के वर्षों में बस्तियाँ बन चुकी होती हैं। परिणामी बाढ़ बाँध-पूर्व बाढ़ों से बुरी हो सकती है, क्योंकि वह प्राकृतिक चढ़ाव के बजाय अचानक छोड़ाव बनकर आती है। यहाँ एक कड़वी समरूपता ध्यान देने योग्य है: वही गाद जो खेतों को उपजाऊ करती वही बाढ़-नियंत्रण क्षमता नष्ट करती है, अतः दोनों विफलताएँ अलग दुर्भाग्य नहीं बल्कि एक ही प्रक्रिया दो सिरों से देखी गई हैं। इसीलिए गाद-प्रबंधन — गाद निकालना, अपरदन घटाने को जल-ग्रहण क्षेत्र में वनरोपण, और जलाशय के कार्यकाल का यथार्थ लेखा — किसी भी ईमानदार बड़े-बाँध आकलन में आना चाहिए, और इसीलिए परियोजनाओं की मूल लाभ-लागत गणनाएँ, जो अक्सर स्थायी भंडारण मान लेती थीं, यह बढ़ा-चढ़ाकर बतातीं कि ख़रीदा क्या जा रहा है। (ग़लत उत्तर वर्षा-निर्माण, रासायनिक रिसाव गढ़ते, या उन प्रभावों को नकारते जिन्हें जलाशय-सर्वेक्षण और नीचे की मृदा-अभिलेख दोनों दर्ज करते हैं।)",
          mr: "दोन्ही परिणाम एकाच तथ्यातून येतात: नदी केवळ पाणी नव्हे तर निलंबित गाळाचा मोठा भार वाहते, आणि धरण गाळ पाण्याइतक्याच परिणामकारकतेने अडवते. आधी नदी पूर्वी काय करत होती ते पाहा. प्रत्येक पूरहंगामात काठांवरून ओसंडणारे पाणी पूरमैदानावर पसरताना मंदावे, आणि मंद पाणी गाळ निलंबित ठेवू शकत नाही. तो भार शेतांवर ताज्या खनिज-समृद्ध पदार्थाचा पातळ थर बनून बसे. म्हणूनच गंगा, कावेरी आणि नाईलच्या खोऱ्यांतील पूरमैदानी शेती हजारो वर्षे कृत्रिम खताविना उत्पादक राहिली: नदी ते दरवर्षी, फुकट, पोहोचवत होती. आता धरण ठेवा. त्याच्यामागील जलाशय स्थिर पाण्याचा मोठा साठा आहे, म्हणून येणारी नदी मंदावून आपला जवळजवळ अख्खा गाळ-भार खाली नव्हे तर तिथेच टाकते. दोन परिणाम निघतात, आणि ते वेगवेगळ्या कालमापांवर उलगडतात. पहिला शेतांत जाणवतो. धरणातून सोडलेले पाणी तुलनेने स्वच्छ असते, म्हणून गाळाचा वार्षिक थर येणे थांबते. माती रातोरात नापीक होत नाही, पण तिचे नैसर्गिक पुनर्भरण संपते, आणि दशकांत शेतांना आपले उत्पादन टिकवायला वाढत्या प्रमाणात विकत खत लागते — एक खर्च जो गुपचूप नदीकडून शेतकऱ्यावर सरकतो. नदीच्या मुखाचा त्रिभुज प्रदेशही उपाशी राहतो, आणि जिथे त्याला पुन्हा घडवायला गाळ येत नाही तिथे समुद्र किनारा खाऊ लागतो. दुसरा परिणाम भिंतीमागे साचतो. प्रत्येक वर्षी अडकलेला गाळ जलाशयाचे घनफळ घटवतो. ज्या धरणात ठराविक पूर-उशी ठेवली — असामान्य मोठा प्रवाह शोषायला ठेवलेल्या रिकाम्या जागेचा हाशिया — तो हाशिया वर्षागणिक आकुंचत जातो जसजसा गाळ खोरे भरतो. पहिल्या दशकांत हे अदृश्य राहते; धरण रचनेप्रमाणे काम करते आणि पूरनियंत्रणाचा दावा खरा वाटतो. पण एकदा साठवण बरीच हरवल्यावर, जोरदार मान्सून घटलेला जलाशय लवकर भरतो, आणि संचालकांसमोर असा पर्याय येतो ज्यातून ते सुटू शकत नाहीत: पाणी अडवा आणि धरण धोक्यात घाला, वा दरवाजे उघडा. ते दरवाजे उघडतात, आणि मोठे प्रमाण थोड्या वेळात त्या नदीत सोडले जाते जिचे खालचे पात्र अनेकदा स्वतःही गाळाने भरलेले असते आणि जिच्या काठी स्पष्ट सुरक्षिततेच्या वर्षांत वस्त्या झालेल्या असतात. परिणामी पूर धरणपूर्व पुरांहून वाईट असू शकतो, कारण तो नैसर्गिक चढाऐवजी अचानक सोडाव बनून येतो. इथे एक कडवट सममिती लक्षात घेण्याजोगी: जो गाळ शेते सुपीक करेल तोच पूरनियंत्रण क्षमता नष्ट करतो, म्हणून दोन्ही अपयशे वेगळी दुर्दैवे नव्हेत तर एकच प्रक्रिया दोन टोकांतून पाहिलेली. म्हणूनच गाळ-व्यवस्थापन — गाळ काढणे, झीज घटवायला पाणलोटात वनलागवड, आणि जलाशयाच्या कार्यकाळाचा वास्तववादी हिशोब — कोणत्याही प्रामाणिक मोठ्या-धरण मूल्यमापनात यावे, आणि म्हणूनच प्रकल्पांची मूळ लाभ-खर्च गणिते, जी अनेकदा कायमची साठवण गृहीत धरत, काय विकत घेतले जात आहे ते वाढवून सांगत होती. (चुकीची उत्तरे पाऊस-निर्मिती, रासायनिक झिरपणे रचतात, वा जलाशय-सर्वेक्षणे आणि खालच्या मृदा-नोंदी दोन्ही दस्तऐवजीकृत करत असलेले परिणाम नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "India receives abundant rainfall by world standards, and its per-person availability is well above the level economists call absolute scarcity. Yet tankers serve whole neighbourhoods, wells are deepened every few years, and villages walk further for water each decade. Explain how a country can be short of water without being short of rain.",
          hi: "विश्व मानकों से भारत को भरपूर वर्षा मिलती है, और उसकी प्रति-व्यक्ति उपलब्धता उस स्तर से काफ़ी ऊपर है जिसे अर्थशास्त्री परम अभाव कहते हैं। फिर भी टैंकर पूरे-पूरे मोहल्लों को पानी देते हैं, कुएँ हर कुछ वर्षों में गहरे किए जाते हैं, और गाँव हर दशक पानी के लिए और दूर चलते हैं। समझाओ कोई देश वर्षा की कमी के बिना पानी की कमी में कैसे हो सकता है।",
          mr: "जागतिक मानकांनुसार भारताला भरपूर पाऊस मिळतो, आणि त्याची दरडोई उपलब्धता अर्थतज्ज्ञ ज्याला निरपेक्ष टंचाई म्हणतात त्या पातळीहून बरीच वर आहे. तरीही टँकर अख्ख्या वस्त्यांना पाणी देतात, विहिरी दर काही वर्षांनी खोल केल्या जातात, आणि गावे दर दशकात पाण्यासाठी अधिक दूर चालतात. समजावा एखादा देश पावसाची कमतरता नसताना पाण्याच्या कमतरतेत कसा असू शकतो.",
        },
        choices: [
          {
            en: "Because availability is not the same as access. The rain arrives in about a hundred days and must serve the whole year; groundwater is pumped faster than it recharges because the electricity is cheap and nobody owns the aquifer jointly; rivers are polluted until the water is present but unusable; and supply is distributed by pipe, borewell and tanker in ways that follow wealth. Scarcity is therefore produced by timing, over-extraction, contamination and unequal distribution rather than by a shortage of rainfall",
            hi: "क्योंकि उपलब्धता और पहुँच एक बात नहीं। वर्षा लगभग सौ दिनों में आती है और उसे पूरा वर्ष चलना है; भूजल पुनर्भरण से तेज़ खींचा जाता है क्योंकि बिजली सस्ती है और जलभृत का साझा स्वामी कोई नहीं; नदियाँ तब तक प्रदूषित होती हैं कि पानी मौजूद पर अनुपयोगी हो जाता है; और आपूर्ति पाइप, बोरवेल तथा टैंकर से इस ढंग बँटती है जो संपत्ति का पीछा करता है। अतः कमी वर्षा के अभाव से नहीं बल्कि समय, अति-दोहन, संदूषण और असमान वितरण से पैदा होती है",
            mr: "कारण उपलब्धता आणि प्रवेश एक नव्हे. पाऊस सुमारे शंभर दिवसांत येतो आणि त्याला अख्खे वर्ष पुरायचे असते; भूजल पुनर्भरणाहून वेगाने उपसले जाते कारण वीज स्वस्त आहे आणि जलधराचा सामायिक मालक कोणी नाही; नद्या तोवर प्रदूषित होतात की पाणी उपस्थित पण अवापरता होते; आणि पुरवठा नळ, बोअरवेल व टँकरने अशा प्रकारे वाटला जातो जो संपत्तीच्या मागे जातो. म्हणून टंचाई पावसाच्या कमतरतेने नव्हे तर वेळ, अति-उपसा, दूषण आणि असमान वाटपाने निर्माण होते",
          },
          {
            en: "Because India's rainfall figures are miscalculated, and the country actually receives very little rain",
            hi: "क्योंकि भारत के वर्षा-आँकड़े ग़लत गिने गए हैं, और देश को वस्तुतः बहुत कम वर्षा मिलती है",
            mr: "कारण भारताचे पर्जन्य-आकडे चुकीचे मोजले गेले आहेत, आणि देशाला प्रत्यक्षात फार कमी पाऊस मिळतो",
          },
          {
            en: "Because water is consumed permanently and destroyed when used, so the total on earth keeps falling",
            hi: "क्योंकि पानी इस्तेमाल होने पर स्थायी रूप से खपकर नष्ट हो जाता है, अतः पृथ्वी पर उसका कुल घटता जाता है",
            mr: "कारण पाणी वापरल्यावर कायमचे खर्ची पडून नष्ट होते, म्हणून पृथ्वीवरील एकूण घटत जाते",
          },
          {
            en: "Because scarcity is imaginary; where rainfall is adequate no real shortage can occur",
            hi: "क्योंकि कमी काल्पनिक है; जहाँ वर्षा पर्याप्त हो वहाँ कोई असली कमी हो ही नहीं सकती",
            mr: "कारण टंचाई काल्पनिक आहे; जिथे पाऊस पुरेसा असतो तिथे खरी कमतरता होऊच शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The apparent paradox dissolves once you stop asking how much water falls and start asking when it falls, who can reach it, and in what condition it arrives. Four mechanisms do the work, and they compound. First, timing. Most of India's rain arrives in roughly a hundred days of the monsoon and then stops. A national average that divides annual rainfall by the population describes a quantity that mostly runs to the sea within weeks. Whether it is available in March depends entirely on whether it was stored — in soil, in groundwater, in a tank, a reservoir or a tanka. A country can therefore be simultaneously flooded and water-short in the same district in the same year, which is exactly what Cherrapunji's dry-season shortage illustrates. Second, over-extraction. Groundwater is the largest source for both irrigation and drinking, and it behaves like a bank account: withdrawals above the recharge rate draw down the balance. Cheap or free electricity for pumps removes the cost signal, and because the aquifer under a village is shared by everyone but owned by no one, each farmer's rational choice — deepen the borewell before the neighbour does — collectively empties it. That is why wells must be deepened every few years, and why the water table falls even in areas of good rainfall. Third, contamination. Water that is physically present can be unusable. Untreated sewage, industrial effluent and fertiliser runoff have made stretches of major rivers unfit for drinking or bathing, and in some regions fluoride, arsenic or salinity make groundwater dangerous. This removes supply just as effectively as drought does, and it removes it permanently unless treatment is built. Fourth, and often decisive, distribution. Water reaches people through infrastructure — pipes, tankers, borewells — and infrastructure follows money and political weight. Two households on the same street can face entirely different situations depending on which is connected. A colony with private borewells has water when the municipal line fails; a settlement without them buys from tankers at many times the metered rate. Farmers with electric pumps irrigate through the dry season while those without watch their wells fall out of reach. The industrial user with a licensed extraction continues while the village walks further. Put together, these mean scarcity in India is largely produced rather than inherited. That conclusion is practical, not merely rhetorical, because it identifies where the remedies lie: storing the monsoon rather than only channelling it (rooftop harvesting, tankas, tanks, recharge pits), pricing and regulating extraction so the aquifer is managed as a common asset, treating effluent so present water stays usable, and distributing supply by rules rather than by purchasing power. It also explains why traditional systems — bamboo drip irrigation, the tanka, village tanks — remain relevant beside large dams: they address timing and local access directly, without displacing anyone, and they leave control with the household or village that built them. The single sentence worth keeping is that water is not scarce because there is too little of it, but because too little of it is stored, kept clean and shared fairly. (The wrong answers dispute well-measured rainfall data, imagine that water is destroyed by use when in fact it is degraded and displaced, or deny a scarcity that queues, tankers and falling water tables make plainly visible.)",
          hi: "प्रत्यक्ष विरोधाभास तभी घुल जाता है जब तुम यह पूछना छोड़ दो कि कितना पानी गिरता है और पूछने लगो कि कब गिरता है, उस तक पहुँच किसकी है, और वह किस हालत में आता है। चार क्रियाविधियाँ काम करती हैं, और वे एक-दूसरे को बढ़ाती हैं। पहली, समय। भारत की अधिकांश वर्षा मानसून के लगभग सौ दिनों में आती और फिर रुक जाती है। जो राष्ट्रीय औसत वार्षिक वर्षा को जनसंख्या से भाग देता है वह ऐसी मात्रा बताता है जो अधिकतर हफ़्तों में समुद्र तक बह जाती है। वह मार्च में उपलब्ध है या नहीं यह पूरी तरह इस पर कि उसे संचित किया गया था या नहीं — मिट्टी में, भूजल में, तालाब, जलाशय या टाँके में। अतः कोई देश उसी ज़िले में उसी वर्ष एक साथ बाढ़ में और पानी की कमी में हो सकता है — ठीक वही जो चेरापूँजी की शुष्क-ऋतु कमी दिखाती है। दूसरी, अति-दोहन। भूजल सिंचाई और पेयजल दोनों का सबसे बड़ा स्रोत है, और वह बैंक-खाते जैसा बरतता है: पुनर्भरण दर से ऊपर निकासी शेष घटा देती है। पंपों के लिए सस्ती या मुफ़्त बिजली लागत का संकेत मिटा देती है, और क्योंकि गाँव के नीचे का जलभृत सबका साझा है पर किसी का अपना नहीं, हर किसान का तर्कसंगत चुनाव — पड़ोसी से पहले बोरवेल गहरा करो — सामूहिक रूप से उसे ख़ाली कर देता है। इसीलिए कुएँ हर कुछ वर्षों में गहरे करने पड़ते, और इसीलिए अच्छी वर्षा वाले क्षेत्रों में भी जल-स्तर गिरता है। तीसरी, संदूषण। जो पानी भौतिक रूप से मौजूद है वह अनुपयोगी हो सकता है। बिना शोधित मल, औद्योगिक बहिःस्राव और उर्वरक-अपवाह ने बड़ी नदियों के हिस्सों को पीने या नहाने के अयोग्य बना दिया है, और कुछ क्षेत्रों में फ़्लोराइड, आर्सेनिक या लवणता भूजल को ख़तरनाक बनाती है। यह आपूर्ति उतनी ही कारगरता से हटाता है जितनी सूखा, और शोधन बने बिना स्थायी रूप से हटाता है। चौथी, और अक्सर निर्णायक, वितरण। पानी लोगों तक ढाँचे से पहुँचता है — पाइप, टैंकर, बोरवेल — और ढाँचा पैसे तथा राजनीतिक वज़न का पीछा करता है। एक ही गली के दो घर पूरी तरह भिन्न स्थितियों में हो सकते हैं, यह इस पर कि जुड़ा कौन है। निजी बोरवेल वाली कॉलोनी के पास नगरपालिका लाइन बिगड़ने पर भी पानी होता है; उनसे रहित बस्ती टैंकरों से मीटर की दर के कई गुने पर ख़रीदती है। बिजली के पंप वाले किसान शुष्क ऋतु भर सींचते हैं जबकि बिना पंप वाले अपने कुएँ पहुँच से बाहर होते देखते हैं। अनुज्ञप्त निकासी वाला औद्योगिक उपयोगकर्ता चलता रहता है जबकि गाँव और दूर चलता है। मिलाकर इनका अर्थ यह कि भारत में कमी बड़े हिस्से में विरासत में नहीं, पैदा की हुई है। यह निष्कर्ष केवल अलंकार नहीं, व्यावहारिक है, क्योंकि यह बताता है कि उपाय कहाँ हैं: मानसून को केवल बहाने के बजाय संचित करना (छत-संचयन, टाँके, तालाब, पुनर्भरण गड्ढे), निकासी की क़ीमत और नियमन ताकि जलभृत साझा परिसंपत्ति की तरह सँभाला जाए, बहिःस्राव का शोधन ताकि मौजूद पानी उपयोगी रहे, और आपूर्ति का वितरण क्रय-शक्ति से नहीं नियमों से। यह यह भी समझाता है कि परंपरागत प्रणालियाँ — बाँस की टपक सिंचाई, टाँका, गाँव के तालाब — बड़े बाँधों के साथ-साथ प्रासंगिक क्यों बनी हुई हैं: वे समय और स्थानीय पहुँच को सीधे सँभालती हैं, किसी को विस्थापित किए बिना, और नियंत्रण उसी घर या गाँव के पास छोड़ती हैं जिसने उन्हें बनाया। रखने योग्य एक वाक्य यह है कि पानी इसलिए दुर्लभ नहीं कि वह बहुत कम है, बल्कि इसलिए कि उसका बहुत कम हिस्सा संचित, साफ़ और न्यायपूर्वक बाँटा जाता है। (ग़लत उत्तर भली-भाँति मापे वर्षा-आँकड़ों पर विवाद करते, यह कल्पना करते कि पानी उपयोग से नष्ट हो जाता जबकि वस्तुतः वह क्षरित और विस्थापित होता है, या उस कमी को नकारते जिसे क़तारें, टैंकर और गिरते जल-स्तर स्पष्ट दिखाते हैं।)",
          mr: "दिसणारा विरोधाभास तेव्हाच सुटतो जेव्हा तुम्ही किती पाणी पडते हे विचारणे सोडून ते कधी पडते, त्यापर्यंत कोण पोहोचू शकते, आणि ते कोणत्या स्थितीत येते हे विचारू लागता. चार क्रियाविधी काम करतात, आणि त्या एकमेकांना वाढवतात. पहिली, वेळ. भारतातील बहुतांश पाऊस मान्सूनच्या सुमारे शंभर दिवसांत येतो आणि मग थांबतो. जो राष्ट्रीय सरासरी वार्षिक पाऊस लोकसंख्येने भागतो तो असे प्रमाण सांगतो जे बहुतांश आठवड्यांत समुद्रापर्यंत वाहून जाते. ते मार्चमध्ये उपलब्ध आहे की नाही हे पूर्णपणे यावर की ते साठवले होते का — मातीत, भूजलात, तळ्यात, जलाशयात वा टाक्यात. म्हणून एखादा देश त्याच जिल्ह्यात त्याच वर्षी एकाच वेळी पुरात आणि पाण्याच्या टंचाईत असू शकतो — नेमके तेच चेरापुंजीची कोरड्या हंगामातील टंचाई दाखवते. दुसरी, अति-उपसा. भूजल सिंचन आणि पिण्याचे पाणी दोन्हींचा सर्वांत मोठा स्रोत, आणि ते बँकखात्यासारखे वागते: पुनर्भरण दराहून अधिक उपसा शिल्लक घटवतो. पंपांसाठी स्वस्त वा फुकट वीज खर्चाचा संकेत मिटवते, आणि गावाखालचा जलधर सर्वांचा सामायिक पण कोणाचाही स्वतःचा नसल्याने, प्रत्येक शेतकऱ्याची तर्कशुद्ध निवड — शेजाऱ्याआधी बोअरवेल खोल करा — सामूहिकरीत्या तो रिकामा करते. म्हणूनच विहिरी दर काही वर्षांनी खोल कराव्या लागतात, आणि म्हणूनच चांगल्या पावसाच्या भागांतही पाण्याची पातळी घसरते. तिसरी, दूषण. जे पाणी भौतिकदृष्ट्या उपस्थित आहे ते अवापरता असू शकते. प्रक्रिया न केलेले सांडपाणी, औद्योगिक स्राव आणि खत-वाहून जाणे यांनी मोठ्या नद्यांचे पट्टे पिण्यास वा आंघोळीस अयोग्य केले आहेत, आणि काही भागांत फ्लोराइड, आर्सेनिक वा क्षारता भूजल धोकादायक करते. हे पुरवठा दुष्काळाइतक्याच परिणामकारकतेने काढून टाकते, आणि प्रक्रिया उभारल्याविना कायमचे काढून टाकते. चौथी, आणि अनेकदा निर्णायक, वाटप. पाणी लोकांपर्यंत पायाभूत सुविधांतून पोहोचते — नळ, टँकर, बोअरवेल — आणि पायाभूत सुविधा पैसा व राजकीय वजनाच्या मागे जातात. एकाच गल्लीतील दोन घरे पूर्णपणे वेगळ्या स्थितीत असू शकतात, जोडलेले कोण आहे यावरून. खासगी बोअरवेल असलेल्या वसाहतीकडे नगरपालिका वाहिनी बिघडली तरी पाणी असते; त्याविनाची वस्ती टँकरांकडून मीटर दराच्या कैकपट किमतीला विकत घेते. विजेचे पंप असलेले शेतकरी कोरड्या हंगामभर सिंचन करतात तर पंपाविनाचे आपल्या विहिरी आवाक्याबाहेर जाताना पाहतात. परवानाधारी उपसा असलेला औद्योगिक वापरकर्ता चालूच राहतो तर गाव अधिक दूर चालते. एकत्रितपणे यांचा अर्थ हा की भारतातील टंचाई मोठ्या प्रमाणात वारशाने नव्हे तर निर्माण केलेली आहे. हा निष्कर्ष केवळ अलंकार नव्हे तर व्यावहारिक, कारण तो उपाय कुठे आहेत ते सांगतो: मान्सून केवळ वाहवण्याऐवजी साठवणे (छप्पर-संचय, टाकी, तळी, पुनर्भरण खड्डे), उपशाची किंमत व नियमन जेणेकरून जलधर सामायिक मालमत्ता म्हणून सांभाळला जाईल, स्रावावर प्रक्रिया जेणेकरून उपस्थित पाणी वापरण्याजोगे राहील, आणि पुरवठ्याचे वाटप क्रयशक्तीने नव्हे तर नियमांनी. हे हेही समजावते की पारंपरिक पद्धती — बांबूची ठिबक सिंचाई, टाकं, गावतळी — मोठ्या धरणांबरोबरच का प्रासंगिक राहिल्या: त्या वेळ आणि स्थानिक प्रवेश थेट हाताळतात, कोणालाही विस्थापित न करता, आणि नियंत्रण त्याच घराकडे वा गावाकडे ठेवतात ज्याने त्या बांधल्या. जपण्याजोगे एक वाक्य हे की पाणी यासाठी दुर्मीळ नाही की ते फार कमी आहे, तर यासाठी की त्याचा फार कमी भाग साठवला, स्वच्छ ठेवला आणि न्याय्यपणे वाटला जातो. (चुकीची उत्तरे नीट मोजलेल्या पर्जन्य-आकडेवारीवर वाद घालतात, पाणी वापराने नष्ट होते अशी कल्पना करतात तर प्रत्यक्षात ते खालावते व स्थलांतरित होते, वा रांगा, टँकर आणि घसरती पाणीपातळी स्पष्ट दाखवत असलेली टंचाई नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Agriculture                                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-agriculture",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 4 — Agriculture",
      hi: "अध्याय 4 — कृषि",
      mr: "प्रकरण 4 — शेती",
    },
    name: {
      en: "Agriculture",
      hi: "कृषि",
      mr: "शेती",
    },
    summary: {
      en: "Half a country at work on the land: a plot too small to rest, a calendar split by the monsoon's arrival and departure, the thirsty grain of the east and the cold-loving grain of the north-west, the hardy crops that ask least and are eaten by those with least — and the seed that ended a famine while emptying a water table.",
      hi: "आधा देश ज़मीन पर काम में लगा: इतना छोटा खेत कि उसे बंजर छोड़ा नहीं जा सकता, मानसून के आने-जाने से बँटा पंचांग, पूरब का प्यासा अनाज और उत्तर-पश्चिम का ठंड-प्रिय अनाज, वे कठोर फ़सलें जो सबसे कम माँगतीं और सबसे कम वाले खाते हैं — और वह बीज जिसने अकाल ख़त्म किया और जल-स्तर ख़ाली कर दिया।",
      mr: "अर्धा देश जमिनीवर कामात: इतके लहान शेत की ते पडीक ठेवता येत नाही, मान्सूनच्या येण्या-जाण्याने विभागलेले दिनदर्शक, पूर्वेचे तहानलेले धान्य आणि वायव्येचे थंडीप्रिय धान्य, ती कणखर पिके जी सर्वांत कमी मागतात आणि सर्वांत कमी असलेले खातात — आणि ते बियाणे ज्याने दुष्काळ संपवला आणि पाण्याची पातळी रिकामी केली.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "intensive-subsistence",
        name: {
          en: "Intensive subsistence farming",
          hi: "गहन निर्वाह कृषि",
          mr: "सघन निर्वाह शेती",
        },
        kind: "idea",
        prompt: {
          en: "On a holding of barely a hectare a family works with hand tools, heavy manuring and irrigation, takes two or even three harvests a year, and still consumes most of what it grows. Which kind of farming is this?",
          hi: "मुश्किल से एक हेक्टेयर की जोत पर परिवार हाथ के औज़ारों, भारी खाद और सिंचाई से काम करता है, वर्ष में दो या तीन तक फ़सलें लेता है, और फिर भी जो उगाता उसका अधिकांश स्वयं खा जाता है। यह कौन-सी खेती है?",
          mr: "जेमतेम एक हेक्टरच्या शेतावर कुटुंब हाताच्या अवजारांनी, जबर खतांनी आणि सिंचनाने काम करते, वर्षात दोन वा तीनही पिके घेते, आणि तरीही जे पिकवते त्यातील बहुतांश स्वतःच खाते. ही कोणती शेती?",
        },
        statement: {
          en: "Intensive subsistence farming is practised on very small holdings with heavy inputs of labour, manure and irrigation to raise several crops a year, with most of the output consumed by the farming family itself.",
          hi: "गहन निर्वाह कृषि बहुत छोटी जोतों पर की जाती है, जिसमें श्रम, खाद और सिंचाई का भारी निवेश कर वर्ष में कई फ़सलें उठाई जाती हैं, और अधिकांश उपज कृषक परिवार स्वयं खा जाता है।",
          mr: "सघन निर्वाह शेती अतिशय लहान शेतांवर केली जाते, ज्यात श्रम, खत आणि सिंचनाची जबर गुंतवणूक करून वर्षात अनेक पिके घेतली जातात, आणि बहुतांश उपज शेतकरी कुटुंब स्वतःच खाते.",
        },
        detail: {
          en: "The pressure comes from arithmetic: with a huge rural population on a limited area, the land can never be left fallow and must be pushed for every season it can give.",
          hi: "दबाव अंकगणित से आता है: सीमित क्षेत्र पर विशाल ग्रामीण आबादी होने से भूमि कभी परती नहीं छोड़ी जा सकती और उससे हर संभव ऋतु निचोड़नी पड़ती है।",
          mr: "दबाव अंकगणितातून येतो: मर्यादित क्षेत्रावर प्रचंड ग्रामीण लोकसंख्या असल्याने जमीन कधीही पडीक ठेवता येत नाही आणि तिच्याकडून प्रत्येक शक्य हंगाम काढून घ्यावा लागतो.",
        },
        extra: {
          en: "Inheritance keeps dividing the plot between sons, so holdings shrink with each generation and the same effort supports steadily less land.",
          hi: "उत्तराधिकार खेत को पुत्रों में बाँटता रहता है, अतः जोतें हर पीढ़ी सिकुड़ती हैं और वही मेहनत लगातार कम भूमि सँभालती है।",
          mr: "वारसा शेत मुलांत विभागत राहतो, म्हणून शेते प्रत्येक पिढीत आकुंचतात आणि तेच कष्ट सतत कमी जमीन सांभाळतात.",
        },
        pair: {
          left: {
            en: "A tiny plot pushed for three harvests",
            hi: "तीन फ़सलों के लिए निचोड़ा नन्हा खेत",
            mr: "तीन पिकांसाठी पिळलेले लहानसे शेत",
          },
          right: {
            en: "intensive subsistence farming",
            hi: "गहन निर्वाह कृषि",
            mr: "सघन निर्वाह शेती",
          },
        },
      },
      {
        id: "cropping-seasons",
        name: {
          en: "The cropping seasons",
          hi: "फ़सल ऋतुएँ",
          mr: "पीक हंगाम",
        },
        kind: "idea",
        prompt: {
          en: "One set of crops is sown with the monsoon's onset in June and harvested in autumn; another is sown in the cool of November and harvested in spring; a third is squeezed into the months between. What are these three called?",
          hi: "एक समूह की फ़सलें जून में मानसून के आगमन के साथ बोई और शरद में काटी जाती हैं; दूसरी नवंबर की ठंड में बोई और वसंत में काटी जाती हैं; तीसरी बीच के महीनों में ठूँसी जाती हैं। ये तीनों क्या कहलाती हैं?",
          mr: "एका गटातील पिके जूनमध्ये मान्सूनच्या आगमनासोबत पेरली आणि शरदऋतूत कापली जातात; दुसरी नोव्हेंबरच्या थंडीत पेरली आणि वसंतात कापली जातात; तिसरी मधल्या महिन्यांत कोंबली जातात. ही तिन्ही काय म्हणतात?",
        },
        statement: {
          en: "India's cropping seasons are kharif, sown with the monsoon and harvested in autumn; rabi, sown in winter and harvested in spring; and zaid, the short summer season between them.",
          hi: "भारत की फ़सल ऋतुएँ हैं ख़रीफ़, जो मानसून के साथ बोई और शरद में काटी जाती; रबी, जो जाड़े में बोई और वसंत में काटी जाती; और ज़ायद, उनके बीच की छोटी ग्रीष्म ऋतु।",
          mr: "भारताचे पीक हंगाम आहेत खरीप, जो मान्सूनसोबत पेरला आणि शरदऋतूत कापला जातो; रब्बी, जो हिवाळ्यात पेरला आणि वसंतात कापला जातो; आणि झायद, त्यांच्यामधला आखूड उन्हाळी हंगाम.",
        },
        detail: {
          en: "The calendar is set by the monsoon, not by the sun: kharif crops depend on rainfall while rabi crops depend on winter moisture and irrigation.",
          hi: "पंचांग सूर्य से नहीं, मानसून से सधता है: ख़रीफ़ फ़सलें वर्षा पर निर्भर हैं जबकि रबी फ़सलें जाड़े की नमी और सिंचाई पर।",
          mr: "दिनदर्शक सूर्याने नव्हे तर मान्सूनने ठरतो: खरीप पिके पावसावर अवलंबून तर रब्बी पिके हिवाळ्यातील ओलावा आणि सिंचनावर.",
        },
        extra: {
          en: "This is why a late monsoon costs a farmer twice — the kharif sowing is delayed, and the rabi behind it is pushed into heat it cannot ripen in.",
          hi: "इसी से देर से आया मानसून किसान को दोहरी क़ीमत देता है — ख़रीफ़ की बुवाई पिछड़ती है, और उसके पीछे की रबी उस गर्मी में धकेल दी जाती है जिसमें वह पक नहीं सकती।",
          mr: "म्हणूनच उशिरा आलेला मान्सून शेतकऱ्याला दुहेरी किंमत देतो — खरिपाची पेरणी लांबते, आणि तिच्यामागचा रब्बी अशा उन्हात ढकलला जातो ज्यात तो पिकू शकत नाही.",
        },
        pair: {
          left: {
            en: "Kharif, rabi and zaid",
            hi: "ख़रीफ़, रबी और ज़ायद",
            mr: "खरीप, रब्बी आणि झायद",
          },
          right: {
            en: "the cropping seasons",
            hi: "फ़सल ऋतुएँ",
            mr: "पीक हंगाम",
          },
        },
      },
      {
        id: "rice-monsoon-staple",
        name: {
          en: "Rice, the monsoon staple",
          hi: "चावल — मानसून का मुख्य अन्न",
          mr: "भात — मान्सूनचे मुख्य अन्न",
        },
        kind: "crop",
        prompt: {
          en: "It needs high temperature, high humidity and more than a hundred centimetres of rain, is grown in standing water in West Bengal, Odisha and the deltas, and feeds most of eastern and southern India. Which crop is this?",
          hi: "इसे ऊँचा ताप, ऊँची आर्द्रता और सौ सेंटीमीटर से अधिक वर्षा चाहिए, यह पश्चिम बंगाल, ओडिशा तथा डेल्टाओं में खड़े पानी में उगाया जाता है, और पूर्वी तथा दक्षिणी भारत के अधिकांश को खिलाता है। यह कौन-सी फ़सल है?",
          mr: "याला उच्च तापमान, उच्च आर्द्रता आणि शंभर सेंटिमीटरहून अधिक पाऊस लागतो, हे पश्चिम बंगाल, ओडिशा आणि त्रिभुज प्रदेशांत साचलेल्या पाण्यात पिकवले जाते, आणि पूर्व व दक्षिण भारताच्या बहुतांश भागाला खाऊ घालते. हे कोणते पीक?",
        },
        statement: {
          en: "Rice is a kharif crop of high temperature, high humidity and heavy rainfall, grown in flooded fields across the eastern plains, the coastal deltas and the north-eastern states.",
          hi: "चावल ऊँचे ताप, ऊँची आर्द्रता और भारी वर्षा की ख़रीफ़ फ़सल है, जो पूर्वी मैदानों, तटीय डेल्टाओं तथा पूर्वोत्तर राज्यों में भरे खेतों में उगाई जाती है।",
          mr: "भात हे उच्च तापमान, उच्च आर्द्रता आणि जोरदार पावसाचे खरीप पीक, जे पूर्वेकडील मैदाने, किनारी त्रिभुज प्रदेश आणि ईशान्येकडील राज्यांत भरलेल्या शेतांत पिकवले जाते.",
        },
        detail: {
          en: "In drier states such as Punjab, Haryana and western Uttar Pradesh it is grown only because canals and tubewells supply the water the rain does not.",
          hi: "पंजाब, हरियाणा और पश्चिमी उत्तर प्रदेश जैसे सूखे राज्यों में यह केवल इसलिए उगाया जाता कि नहरें और नलकूप वह पानी देते हैं जो वर्षा नहीं देती।",
          mr: "पंजाब, हरियाणा आणि पश्चिम उत्तर प्रदेशसारख्या कोरड्या राज्यांत ते केवळ यासाठी पिकवले जाते की कालवे आणि कूपनलिका ते पाणी देतात जे पाऊस देत नाही.",
        },
        extra: {
          en: "India is among the world's largest producers, and in the wettest regions two or even three crops are taken from the same field in a year.",
          hi: "भारत विश्व के सबसे बड़े उत्पादकों में है, और सबसे अधिक वर्षा वाले क्षेत्रों में एक ही खेत से वर्ष में दो या तीन तक फ़सलें ली जाती हैं।",
          mr: "भारत जगातील सर्वांत मोठ्या उत्पादकांपैकी, आणि सर्वाधिक पावसाच्या भागांत एकाच शेतातून वर्षात दोन वा तीनही पिके घेतली जातात.",
        },
        pair: {
          left: {
            en: "Standing water, heavy rain, the eastern staple",
            hi: "खड़ा पानी, भारी वर्षा, पूरब का मुख्य अन्न",
            mr: "साचलेले पाणी, जोरदार पाऊस, पूर्वेचे मुख्य अन्न",
          },
          right: {
            en: "rice",
            hi: "चावल",
            mr: "भात",
          },
        },
      },
      {
        id: "wheat-winter-grain",
        name: {
          en: "Wheat, the winter grain",
          hi: "गेहूँ — जाड़े का अनाज",
          mr: "गहू — हिवाळ्याचे धान्य",
        },
        kind: "crop",
        prompt: {
          en: "It needs a cool growing season and bright sunshine at harvest, about fifty to seventy-five centimetres of rain, and is grown chiefly in Punjab, Haryana, Uttar Pradesh and Madhya Pradesh. Which crop is this?",
          hi: "इसे ठंडी बढ़वार-ऋतु और कटाई के समय तेज़ धूप चाहिए, लगभग पचास से पचहत्तर सेंटीमीटर वर्षा, और यह मुख्यतः पंजाब, हरियाणा, उत्तर प्रदेश तथा मध्य प्रदेश में उगाया जाता है। यह कौन-सी फ़सल है?",
          mr: "याला थंड वाढीचा हंगाम आणि कापणीच्या वेळी तेजस्वी ऊन लागते, सुमारे पन्नास ते पंचाहत्तर सेंटिमीटर पाऊस, आणि हे मुख्यत्वे पंजाब, हरियाणा, उत्तर प्रदेश आणि मध्य प्रदेशात पिकवले जाते. हे कोणते पीक?",
        },
        statement: {
          en: "Wheat is the main rabi crop, needing a cool growing season with bright sunshine at ripening, and it is grown mainly in the north-western plains and the black-soil tracts of central India.",
          hi: "गेहूँ मुख्य रबी फ़सल है, जिसे ठंडी बढ़वार-ऋतु और पकने के समय तेज़ धूप चाहिए, और यह मुख्यतः उत्तर-पश्चिमी मैदानों तथा मध्य भारत की काली-मृदा पट्टियों में उगाया जाता है।",
          mr: "गहू हे मुख्य रब्बी पीक, ज्याला थंड वाढीचा हंगाम आणि पिकताना तेजस्वी ऊन लागते, आणि ते मुख्यत्वे वायव्येकडील मैदाने आणि मध्य भारताच्या काळ्या-मृदा पट्ट्यांत पिकवले जाते.",
        },
        detail: {
          en: "The western disturbances of winter bring the light rain it needs, which is why the north-west suits it and the humid east does not.",
          hi: "जाड़े के पश्चिमी विक्षोभ वह हल्की वर्षा लाते हैं जो इसे चाहिए, इसीलिए उत्तर-पश्चिम इसके अनुकूल है और आर्द्र पूरब नहीं।",
          mr: "हिवाळ्यातील पश्चिमी विक्षोभ तो हलका पाऊस आणतात जो त्याला लागतो, म्हणूनच वायव्य त्याला अनुकूल आणि दमट पूर्व नाही.",
        },
        extra: {
          en: "It was the crop that gained most from the Green Revolution, and the north-western belt where it grew became the country's grain reserve.",
          hi: "यही वह फ़सल थी जिसे हरित क्रांति से सबसे अधिक लाभ हुआ, और जिस उत्तर-पश्चिमी पट्टी में यह उगी वह देश का अन्न-भंडार बन गई।",
          mr: "हेच ते पीक ज्याला हरितक्रांतीचा सर्वाधिक फायदा झाला, आणि ज्या वायव्य पट्ट्यात ते पिकले तो देशाचे धान्य-भांडार बनला.",
        },
        pair: {
          left: {
            en: "Cool season, bright ripening sun, the north-west",
            hi: "ठंडी ऋतु, पकाती तेज़ धूप, उत्तर-पश्चिम",
            mr: "थंड हंगाम, पिकवणारे तेजस्वी ऊन, वायव्य",
          },
          right: {
            en: "wheat",
            hi: "गेहूँ",
            mr: "गहू",
          },
        },
      },
      {
        id: "millets",
        name: {
          en: "The millets",
          hi: "मोटे अनाज (बाजरा-ज्वार-रागी)",
          mr: "भरडधान्ये (बाजरी-ज्वारी-नाचणी)",
        },
        kind: "crop",
        prompt: {
          en: "Jowar on dry Deccan soils, bajra on the sandy tracts of Rajasthan, ragi on the red soils of Karnataka — hardy grains that need little water and carry more iron and calcium than rice or wheat. What are these called?",
          hi: "सूखी दक्कन मिट्टी पर ज्वार, राजस्थान की बलुई पट्टियों पर बाजरा, कर्नाटक की लाल मिट्टी पर रागी — कठोर अनाज जिन्हें कम पानी चाहिए और जिनमें चावल-गेहूँ से अधिक लोहा तथा कैल्शियम है। ये क्या कहलाते हैं?",
          mr: "कोरड्या दख्खनी मातीवर ज्वारी, राजस्थानच्या वाळूच्या पट्ट्यांवर बाजरी, कर्नाटकाच्या तांबड्या मातीवर नाचणी — कणखर धान्ये ज्यांना कमी पाणी लागते आणि ज्यांत भात-गव्हाहून अधिक लोह व कॅल्शियम आहे. यांना काय म्हणतात?",
        },
        statement: {
          en: "The millets — jowar, bajra and ragi — are hardy rain-fed grains grown on poorer soils with little irrigation, and they are nutritionally richer in iron, calcium and roughage than rice or wheat.",
          hi: "मोटे अनाज — ज्वार, बाजरा और रागी — कठोर वर्षा-आधारित अनाज हैं जो कम सिंचाई वाली निर्धन मिट्टियों पर उगते हैं, और पोषण में चावल या गेहूँ से लोहे, कैल्शियम तथा रेशे में अधिक समृद्ध हैं।",
          mr: "भरडधान्ये — ज्वारी, बाजरी आणि नाचणी — कणखर पावसावर आधारित धान्ये जी कमी सिंचनाच्या हलक्या मातीवर पिकतात, आणि पोषणात भात वा गव्हाहून लोह, कॅल्शियम व तंतूंत अधिक समृद्ध.",
        },
        detail: {
          en: "They are called coarse grains, but the name records social prejudice rather than nutrition — they are the food of dry regions and poor households.",
          hi: "इन्हें मोटा अनाज कहा जाता है, पर यह नाम पोषण नहीं बल्कि सामाजिक पूर्वाग्रह दर्ज करता है — ये सूखे क्षेत्रों और निर्धन घरों का भोजन हैं।",
          mr: "यांना भरडधान्ये म्हणतात, पण हे नाव पोषण नव्हे तर सामाजिक पूर्वग्रह नोंदवते — ही कोरड्या भागांची आणि गरीब घरांची अन्ने.",
        },
        extra: {
          en: "Their low water demand is exactly why they are being promoted again in regions where the water table has fallen under rice and wheat.",
          hi: "उनकी कम पानी की माँग ही कारण है कि उन क्षेत्रों में उन्हें फिर बढ़ावा दिया जा रहा जहाँ चावल-गेहूँ के नीचे जल-स्तर गिर चुका है।",
          mr: "त्यांची कमी पाण्याची मागणी हेच कारण की ज्या भागांत भात-गव्हाखाली पाण्याची पातळी घसरली तिथे त्यांना पुन्हा प्रोत्साहन दिले जात आहे.",
        },
        pair: {
          left: {
            en: "Hardy, rain-fed, richer in iron than rice",
            hi: "कठोर, वर्षा-आधारित, चावल से लोहे में समृद्ध",
            mr: "कणखर, पावसावर आधारित, भाताहून लोहात समृद्ध",
          },
          right: {
            en: "the millets",
            hi: "मोटे अनाज",
            mr: "भरडधान्ये",
          },
        },
      },
      {
        id: "high-yielding-varieties",
        name: {
          en: "High-yielding varieties",
          hi: "उन्नत उपज वाली क़िस्में",
          mr: "अधिक उत्पादन देणाऱ्या जाती",
        },
        kind: "idea",
        prompt: {
          en: "From the mid-1960s new short-stemmed wheat and rice seeds were introduced that responded strongly to fertiliser and assured water, and India's grain output climbed steeply within a decade. What were these seeds called?",
          hi: "1960 के दशक के मध्य से गेहूँ और चावल के नए बौने बीज लाए गए जो उर्वरक तथा निश्चित पानी पर प्रबल प्रतिक्रिया देते थे, और एक दशक में भारत का अन्न-उत्पादन तेज़ी से चढ़ गया। ये बीज क्या कहलाते थे?",
          mr: "1960 च्या दशकाच्या मध्यापासून गहू आणि भाताची नवी बुटकी बियाणे आणली गेली जी खत आणि खात्रीशीर पाण्याला प्रबळ प्रतिसाद देत, आणि एका दशकात भारताचे धान्य-उत्पादन झपाट्याने चढले. या बियाण्यांना काय म्हणत?",
        },
        statement: {
          en: "High-yielding varieties are bred seeds that produce far more grain per hectare, provided they receive assured irrigation, chemical fertiliser and pesticide — the package that produced the Green Revolution.",
          hi: "उन्नत उपज वाली क़िस्में वे प्रजनित बीज हैं जो प्रति हेक्टेयर कहीं अधिक अनाज देते हैं, बशर्ते उन्हें निश्चित सिंचाई, रासायनिक उर्वरक और कीटनाशक मिलें — वही पैकेज जिसने हरित क्रांति दी।",
          mr: "अधिक उत्पादन देणाऱ्या जाती म्हणजे ती संकरित बियाणे जी प्रति हेक्टर कितीतरी अधिक धान्य देतात, जर त्यांना खात्रीशीर सिंचन, रासायनिक खत आणि कीटकनाशक मिळाले — तेच संच ज्याने हरितक्रांती दिली.",
        },
        detail: {
          en: "The short stem was the key: a plant that puts its growth into grain rather than straw does not fall over when heavily fertilised.",
          hi: "बौना तना ही कुंजी था: जो पौधा अपनी बढ़वार भूसे के बजाय दाने में लगाता है वह भारी उर्वरक पर लुढ़कता नहीं।",
          mr: "बुटके खोड हीच किल्ली होती: जे रोप आपली वाढ पेंढ्याऐवजी दाण्यात घालते ते जबर खत दिल्यावर लोळत नाही.",
        },
        extra: {
          en: "The gains were unevenly spread, concentrating in Punjab, Haryana and western Uttar Pradesh, where irrigation was already in place to meet the seeds' conditions.",
          hi: "लाभ असमान रूप से बँटे, पंजाब, हरियाणा और पश्चिमी उत्तर प्रदेश में केंद्रित रहे, जहाँ बीजों की शर्तें पूरी करने को सिंचाई पहले से मौजूद थी।",
          mr: "फायदे असमानपणे वाटले, पंजाब, हरियाणा आणि पश्चिम उत्तर प्रदेशात केंद्रित राहिले, जिथे बियाण्यांच्या अटी भागवायला सिंचन आधीच होते.",
        },
        pair: {
          left: {
            en: "Short-stemmed seed that answers fertiliser and water",
            hi: "उर्वरक और पानी का उत्तर देता बौना बीज",
            mr: "खत आणि पाण्याला उत्तर देणारे बुटके बियाणे",
          },
          right: {
            en: "high-yielding varieties",
            hi: "उन्नत उपज वाली क़िस्में",
            mr: "अधिक उत्पादन देणाऱ्या जाती",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Rice is the staple of West Bengal and Odisha and wheat of Punjab and Haryana, and the textbook explains this by climate. Yet Punjab today grows enormous quantities of rice, and its water table is falling by nearly a metre a year. Explain both the original pattern and why breaking it has been costly.",
          hi: "चावल पश्चिम बंगाल और ओडिशा का मुख्य अन्न है तथा गेहूँ पंजाब और हरियाणा का, और पाठ्यपुस्तक इसे जलवायु से समझाती है। फिर भी पंजाब आज विशाल मात्रा में चावल उगाता है, और उसका जल-स्तर लगभग एक मीटर प्रति वर्ष गिर रहा है। मूल प्रतिरूप और उसे तोड़ना महँगा क्यों पड़ा — दोनों समझाओ।",
          mr: "भात हे पश्चिम बंगाल आणि ओडिशाचे मुख्य अन्न आणि गहू पंजाब व हरियाणाचे, आणि पाठ्यपुस्तक हे हवामानाने समजावते. तरीही पंजाब आज प्रचंड प्रमाणात भात पिकवतो, आणि त्याची पाण्याची पातळी दरवर्षी जवळजवळ एक मीटर घसरत आहे. मूळ प्रारूप आणि ते मोडणे महाग का पडले — दोन्ही समजावा.",
        },
        choices: [
          {
            en: "Rice needs high humidity and over a hundred centimetres of rain, which the eastern plains supply naturally; wheat needs a cool season and moderate rain, which the north-west supplies. Punjab grows rice only by pumping groundwater to replace rain it does not get — assured procurement and subsidised power made it profitable — so the crop is being grown against the climate, and the aquifer is paying the difference",
            hi: "चावल को ऊँची आर्द्रता और सौ सेंटीमीटर से अधिक वर्षा चाहिए, जो पूर्वी मैदान स्वाभाविक रूप से देते हैं; गेहूँ को ठंडी ऋतु और मध्यम वर्षा चाहिए, जो उत्तर-पश्चिम देता है। पंजाब चावल केवल भूजल पंप करके उगाता है ताकि जो वर्षा उसे नहीं मिलती उसकी भरपाई हो — निश्चित ख़रीद और सस्ती बिजली ने उसे लाभप्रद बनाया — अतः फ़सल जलवायु के विरुद्ध उगाई जा रही, और अंतर जलभृत चुका रहा है",
            mr: "भाताला उच्च आर्द्रता आणि शंभर सेंटिमीटरहून अधिक पाऊस लागतो, जो पूर्वेकडील मैदाने नैसर्गिकरीत्या देतात; गव्हाला थंड हंगाम आणि मध्यम पाऊस लागतो, जो वायव्य देतो. पंजाब भात केवळ भूजल उपसून पिकवतो जेणेकरून जो पाऊस त्याला मिळत नाही त्याची भरपाई होईल — खात्रीशीर खरेदी आणि स्वस्त वीज यांनी तो फायदेशीर केला — म्हणून पीक हवामानाविरुद्ध पिकवले जात आहे, आणि फरक जलधर मोजत आहे",
          },
          {
            en: "Because rice cannot grow anywhere except in West Bengal, and Punjab's rice reports are mistaken",
            hi: "क्योंकि चावल पश्चिम बंगाल के अलावा कहीं उग ही नहीं सकता, और पंजाब के चावल-आँकड़े ग़लत हैं",
            mr: "कारण भात पश्चिम बंगालशिवाय कुठेही पिकूच शकत नाही, आणि पंजाबचे भात-आकडे चुकीचे आहेत",
          },
          {
            en: "Because Punjab's rainfall has risen to eastern levels, so the crop now matches the climate perfectly",
            hi: "क्योंकि पंजाब की वर्षा पूर्वी स्तरों तक बढ़ गई है, अतः फ़सल अब जलवायु से पूरी तरह मेल खाती है",
            mr: "कारण पंजाबचा पाऊस पूर्वेच्या पातळीपर्यंत वाढला आहे, म्हणून पीक आता हवामानाशी पूर्णपणे जुळते",
          },
          {
            en: "Because the falling water table has no connection to irrigation and is caused entirely by earthquakes",
            hi: "क्योंकि गिरते जल-स्तर का सिंचाई से कोई संबंध नहीं और वह पूरी तरह भूकंपों से होता है",
            mr: "कारण घसरत्या पाण्याच्या पातळीचा सिंचनाशी संबंध नाही आणि ती पूर्णपणे भूकंपांमुळे होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The original pattern is straightforward crop ecology. Rice is a plant of hot, humid conditions and standing water; it needs temperatures above 25°C and more than about 100 cm of rainfall, and it is traditionally grown in flooded fields. The eastern plains, the coastal deltas and the north-east supply exactly that from the monsoon, so rice became the staple wherever the rain was heavy. Wheat is the opposite: it needs a cool growing season of 10–15°C, moderate rainfall of about 50–75 cm, and — crucially — bright dry sunshine as the grain ripens, because humidity at ripening invites disease. The north-western plains get a cool winter, light rain from western disturbances, and a dry sunny spring, so wheat suits them and the humid east does not. Left to climate alone, the map draws itself. Now the departure. From the late 1960s Punjab and Haryana adopted the high-yielding wheat–rice rotation: wheat in rabi, which fits, and rice in kharif, which does not. Rice was grown there not because the rain arrived but because water could be pumped from below, and three policy choices made that pay. Assured government procurement at a minimum support price removed the market risk. Free or heavily subsidised electricity for tubewells removed the cost of pumping. And canal networks built for the Green Revolution supplied part of the water. A farmer facing those incentives is behaving perfectly rationally by growing rice; the losses do not appear on his account. They appear in the aquifer. Rice in a dry climate needs far more applied water than the same crop in Bengal, because evaporation is higher and rainfall supplies almost none of it. Extraction has run above recharge for decades, and across central Punjab the water table has fallen by tens of metres, with the annual decline now approaching a metre in the worst blocks. Wells must be deepened, submersible pumps replace centrifugal ones, energy use rises, and small farmers who cannot afford deeper borewells are squeezed out first. The soil suffers too: continuous flooding and heavy fertiliser use have degraded soil structure and left salinity in places. The lesson is not that the Green Revolution was a mistake — it ended dependence on food imports and famine — but that a crop grown against its climate has a hidden bill, and that bill is being paid by a resource that took millennia to fill and cannot be refilled on demand. This is why the recommended remedies are crop diversification back towards millets, maize and pulses, pricing or metering electricity, and paddy-transplanting laws timed to the monsoon: each attacks the mismatch between what the seed needs and what the sky provides. (The wrong answers deny documented cultivation, invent a rainfall increase that has not occurred, or attribute an extraction-driven decline to geology.)",
          hi: "मूल प्रतिरूप सीधी फ़सल-पारिस्थितिकी है। चावल गरम, आर्द्र दशाओं और खड़े पानी का पौधा है; उसे 25°C से ऊपर ताप और लगभग 100 सेमी से अधिक वर्षा चाहिए, और वह परंपरागत रूप से भरे खेतों में उगाया जाता है। पूर्वी मैदान, तटीय डेल्टा और पूर्वोत्तर मानसून से ठीक वही देते हैं, अतः जहाँ वर्षा भारी थी वहाँ चावल मुख्य अन्न बन गया। गेहूँ उल्टा है: उसे 10–15°C की ठंडी बढ़वार-ऋतु, लगभग 50–75 सेमी की मध्यम वर्षा, और — मुख्यतः — दाना पकते समय तेज़ शुष्क धूप चाहिए, क्योंकि पकते समय आर्द्रता रोग बुलाती है। उत्तर-पश्चिमी मैदानों को ठंडा जाड़ा, पश्चिमी विक्षोभों से हल्की वर्षा और शुष्क धूप वाला वसंत मिलता है, अतः गेहूँ उनके अनुकूल है और आर्द्र पूरब नहीं। केवल जलवायु पर छोड़ो तो नक़्शा स्वयं खिंच जाता है। अब विचलन। 1960 के दशक के अंत से पंजाब और हरियाणा ने उन्नत गेहूँ–चावल चक्र अपनाया: रबी में गेहूँ, जो बैठता है, और ख़रीफ़ में चावल, जो नहीं बैठता। चावल वहाँ इसलिए नहीं उगा कि वर्षा आई बल्कि इसलिए कि पानी नीचे से पंप किया जा सकता था, और तीन नीतिगत चुनावों ने उसे लाभप्रद बनाया। न्यूनतम समर्थन मूल्य पर निश्चित सरकारी ख़रीद ने बाज़ार का जोखिम हटाया। नलकूपों के लिए मुफ़्त या भारी सब्सिडी वाली बिजली ने पंप करने की लागत हटाई। और हरित क्रांति के लिए बनी नहर-प्रणालियों ने पानी का हिस्सा दिया। इन प्रोत्साहनों के सामने खड़ा किसान चावल उगाकर पूरी तरह तर्कसंगत बरत रहा है; हानियाँ उसके खाते में नहीं दिखतीं। वे जलभृत में दिखती हैं। शुष्क जलवायु में चावल को बंगाल की उसी फ़सल से कहीं अधिक लगाया गया पानी चाहिए, क्योंकि वाष्पन अधिक है और वर्षा उसका लगभग कुछ भी नहीं देती। निकासी दशकों से पुनर्भरण से ऊपर चली है, और मध्य पंजाब भर जल-स्तर दसियों मीटर गिरा है, और सबसे बुरे प्रखंडों में वार्षिक गिरावट अब एक मीटर के पास है। कुएँ गहरे करने पड़ते हैं, अपकेंद्री पंपों की जगह जलमग्न पंप आते हैं, ऊर्जा-उपयोग बढ़ता है, और जो छोटे किसान गहरे बोरवेल नहीं जुटा सकते वे सबसे पहले निचुड़ जाते हैं। मिट्टी भी झेलती है: लगातार भराव और भारी उर्वरक-उपयोग ने मृदा-संरचना बिगाड़ी है और जगह-जगह लवणता छोड़ी है। सबक़ यह नहीं कि हरित क्रांति भूल थी — उसने खाद्य आयात और अकाल पर निर्भरता ख़त्म की — बल्कि यह कि जलवायु के विरुद्ध उगाई फ़सल का एक छिपा बिल होता है, और वह बिल उस संसाधन से चुकाया जा रहा है जिसे भरने में सहस्राब्दियाँ लगीं और जो माँगने पर फिर नहीं भरता। इसीलिए सुझाए उपाय हैं मोटे अनाजों, मक्का और दालों की ओर फ़सल-विविधीकरण, बिजली की क़ीमत या मीटरिंग, और मानसून से बँधे धान-रोपाई क़ानून: हर एक बीज की माँग और आकाश की आपूर्ति के बेमेल पर हमला करता है। (ग़लत उत्तर दर्ज खेती को नकारते, न हुई वर्षा-वृद्धि गढ़ते, या निकासी-जनित गिरावट को भूविज्ञान पर डालते हैं।)",
          mr: "मूळ प्रारूप सरळ पीक-परिस्थितिकी आहे. भात हे उष्ण, दमट स्थिती आणि साचलेल्या पाण्याचे रोप; त्याला 25°C वरील तापमान आणि सुमारे 100 सेमीहून अधिक पाऊस लागतो, आणि ते पारंपरिकपणे भरलेल्या शेतांत पिकवले जाते. पूर्वेकडील मैदाने, किनारी त्रिभुज प्रदेश आणि ईशान्य मान्सूनकडून नेमके तेच देतात, म्हणून जिथे पाऊस जोरदार तिथे भात मुख्य अन्न बनले. गहू उलट: त्याला 10–15°C चा थंड वाढीचा हंगाम, सुमारे 50–75 सेमीचा मध्यम पाऊस, आणि — मुख्यतः — दाणा पिकताना तेजस्वी कोरडे ऊन लागते, कारण पिकताना आर्द्रता रोग बोलावते. वायव्येकडील मैदानांना थंड हिवाळा, पश्चिमी विक्षोभांकडून हलका पाऊस आणि कोरडा उन्हाळी वसंत मिळतो, म्हणून गहू त्यांना अनुकूल आणि दमट पूर्व नाही. केवळ हवामानावर सोडले तर नकाशा स्वतःच आखला जातो. आता विचलन. 1960 च्या दशकाच्या शेवटापासून पंजाब आणि हरियाणाने अधिक उत्पादन देणारे गहू–भात आवर्तन स्वीकारले: रब्बीत गहू, जो बसतो, आणि खरिपात भात, जो बसत नाही. भात तिथे यासाठी पिकला नाही की पाऊस आला तर यासाठी की पाणी खालून उपसता येत होते, आणि तीन धोरणात्मक निवडींनी तो फायदेशीर केला. किमान आधारभूत किमतीवर खात्रीशीर सरकारी खरेदीने बाजाराचा धोका काढला. कूपनलिकांसाठी फुकट वा जबर अनुदानित विजेने उपशाचा खर्च काढला. आणि हरितक्रांतीसाठी बांधलेल्या कालवा-जाळ्यांनी पाण्याचा भाग दिला. या प्रोत्साहनांसमोर उभा शेतकरी भात पिकवून पूर्णपणे तर्कशुद्ध वागत आहे; तोटे त्याच्या खात्यात दिसत नाहीत. ते जलधरात दिसतात. कोरड्या हवामानात भाताला बंगालच्या त्याच पिकाहून कितीतरी अधिक दिलेले पाणी लागते, कारण बाष्पीभवन अधिक आणि पाऊस त्यातील जवळजवळ काहीच देत नाही. उपसा दशके पुनर्भरणाहून वर चालला आहे, आणि मध्य पंजाबभर पाण्याची पातळी दहा-दहा मीटर घसरली आहे, आणि सर्वांत वाईट भागांत वार्षिक घसरण आता एका मीटरजवळ. विहिरी खोल कराव्या लागतात, अपकेंद्री पंपांच्या जागी जलमग्न पंप येतात, ऊर्जावापर वाढतो, आणि जे छोटे शेतकरी खोल बोअरवेल परवडू शकत नाहीत ते सर्वांत आधी पिळून निघतात. मातीही सोसते: सतत भरणे आणि जबर खतवापराने मृदा-रचना बिघडवली आहे आणि जागोजागी क्षारता ठेवली आहे. धडा हा नाही की हरितक्रांती चूक होती — तिने अन्नआयात आणि दुष्काळावरील अवलंबित्व संपवले — तर हा की हवामानाविरुद्ध पिकवलेल्या पिकाचे एक लपलेले बिल असते, आणि ते बिल त्या संसाधनातून भरले जात आहे ज्याला भरायला सहस्रके लागली आणि जे मागणीवर पुन्हा भरत नाही. म्हणूनच सुचवलेले उपाय आहेत भरडधान्ये, मका आणि कडधान्यांकडे पीक-विविधीकरण, विजेची किंमत वा मीटरिंग, आणि मान्सूनशी बांधलेले भात-लावणी कायदे: प्रत्येक बियाण्याची मागणी आणि आकाशाचा पुरवठा यांतील विसंगतीवर हल्ला करतो. (चुकीची उत्तरे नोंदलेली लागवड नाकारतात, न झालेली पर्जन्यवाढ रचतात, वा उपसा-जनित घसरण भूगर्भशास्त्रावर टाकतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Within fifteen years of the mid-1960s India went from importing grain under emergency aid to holding surplus stocks, and no famine has occurred since. Yet economists and farmers' movements have criticised the same transformation sharply. Give a full accounting — what it achieved, and what it cost and to whom.",
          hi: "1960 के दशक के मध्य से पंद्रह वर्षों के भीतर भारत आपातकालीन सहायता पर अनाज आयात करने से अधिशेष भंडार रखने तक पहुँच गया, और उसके बाद कोई अकाल नहीं पड़ा। फिर भी अर्थशास्त्रियों और किसान आंदोलनों ने उसी रूपांतरण की तीखी आलोचना की है। पूरा लेखा दो — उसने क्या पाया, और क्या क़ीमत चुकाई तथा किसने।",
          mr: "1960 च्या दशकाच्या मध्यापासून पंधरा वर्षांत भारत आणीबाणी मदतीवर धान्य आयात करण्यापासून अतिरिक्त साठे बाळगण्यापर्यंत पोहोचला, आणि त्यानंतर कोणताही दुष्काळ पडला नाही. तरीही अर्थतज्ज्ञ आणि शेतकरी चळवळींनी त्याच परिवर्तनावर तीव्र टीका केली आहे. पूर्ण हिशोब द्या — त्याने काय मिळवले, आणि काय किंमत मोजली आणि कोणी.",
        },
        choices: [
          {
            en: "It achieved food self-sufficiency and ended famine, which is an enormous gain. But the seeds needed assured irrigation, fertiliser and pesticide, so the benefits concentrated where irrigation already existed and among farmers who could finance inputs — widening regional and class inequality. Groundwater was overdrawn, soils degraded, pest resistance and pesticide contamination grew, and the wheat-rice focus narrowed diversity and displaced pulses and millets. The verdict is a real gain purchased with an unequally distributed and partly deferred cost",
            hi: "उसने खाद्य आत्मनिर्भरता पाई और अकाल ख़त्म किया, जो विशाल उपलब्धि है। पर बीजों को निश्चित सिंचाई, उर्वरक और कीटनाशक चाहिए थे, अतः लाभ वहाँ केंद्रित हुए जहाँ सिंचाई पहले से थी और उन किसानों में जो निवेश जुटा सकते थे — क्षेत्रीय तथा वर्गीय असमानता चौड़ी करते हुए। भूजल अति-खींचा गया, मिट्टियाँ क्षरित हुईं, कीट-प्रतिरोध और कीटनाशक-संदूषण बढ़ा, और गेहूँ-चावल पर ध्यान ने विविधता सँकरी की तथा दालों और मोटे अनाजों को विस्थापित किया। निर्णय: असली लाभ, पर असमान रूप से बँटी और आंशिक रूप से टाली गई क़ीमत पर ख़रीदा गया",
            mr: "तिने अन्न स्वयंपूर्णता मिळवली आणि दुष्काळ संपवला, जी प्रचंड कमाई. पण बियाण्यांना खात्रीशीर सिंचन, खत आणि कीटकनाशक लागत होते, म्हणून फायदे तिथे केंद्रित झाले जिथे सिंचन आधीच होते आणि त्या शेतकऱ्यांत जे गुंतवणूक करू शकत — प्रादेशिक व वर्गीय विषमता रुंदावत. भूजल अति-उपसले गेले, मृदा खालावल्या, कीड-प्रतिकार आणि कीटकनाशक-दूषण वाढले, आणि गहू-भातावरील भराने विविधता अरुंद केली व कडधान्ये आणि भरडधान्ये विस्थापित केली. निर्णय: खरी कमाई, पण असमानपणे वाटलेल्या आणि अंशतः पुढे ढकललेल्या किमतीवर विकत घेतलेली",
          },
          {
            en: "It achieved nothing measurable; grain output was unchanged and the reported surpluses were fabricated",
            hi: "उसने कुछ भी मापने योग्य नहीं पाया; अन्न-उत्पादन अपरिवर्तित रहा और बताए गए अधिशेष गढ़े हुए थे",
            mr: "तिने काहीही मोजण्याजोगे मिळवले नाही; धान्य उत्पादन अपरिवर्तित राहिले आणि सांगितलेले अतिरिक्त साठे बनावट होते",
          },
          {
            en: "It had benefits and no costs whatever, and the criticism comes only from those opposed to science",
            hi: "उसके केवल लाभ थे और कोई क़ीमत नहीं, और आलोचना केवल उनसे आती है जो विज्ञान के विरोधी हैं",
            mr: "तिचे फक्त फायदे होते आणि कोणतीही किंमत नाही, आणि टीका फक्त विज्ञानविरोधकांकडून येते",
          },
          {
            en: "Its costs fell equally on all farmers everywhere, so no question of inequality arises",
            hi: "उसकी क़ीमतें हर जगह सब किसानों पर समान रूप से पड़ीं, अतः असमानता का प्रश्न ही नहीं उठता",
            mr: "तिच्या किमती सर्वत्र सर्व शेतकऱ्यांवर समानपणे पडल्या, म्हणून विषमतेचा प्रश्नच उद्भवत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "An honest account has to hold two things together, because both are true and neither cancels the other. Start with the achievement, which was extraordinary and should not be minimised. In the mid-1960s India was importing wheat under emergency arrangements, harvests had failed two years running, and the country's food security depended on a foreign government's shipping schedule. Within about fifteen years production had roughly doubled, imports ended, and buffer stocks were large enough that later droughts produced hardship but not famine. Famine had been a recurring feature of Indian history for centuries; it stopped. Whatever else follows, that is a very large number of lives. Now the costs, which are of four kinds. The first is distributional by region. High-yielding varieties are not simply better seeds; they are seeds that outperform only when given assured water, chemical fertiliser and pesticide. That condition meant the technology could be adopted where irrigation already existed — Punjab, Haryana, western Uttar Pradesh, parts of Andhra Pradesh — and could not be adopted in the rain-fed uplands, the dry Deccan and eastern India. So a national programme deepened regional divergence: the irrigated north-west became the granary and the rain-fed regions fell further behind. The second is distributional by class. Seeds, fertiliser, pesticide and a tubewell all cost money before the harvest arrives. Farmers with land to pledge and access to credit could finance the package and gained; marginal farmers borrowed at high interest to do the same, and a bad season left them with debt against a small holding. Landless labourers gained employment from the intensified cropping but did not gain assets. The third is ecological. Continuous irrigation of rice in dry regions drew groundwater faster than recharge, so water tables fell; heavy fertiliser use degraded soil structure and left nitrate in the water; pesticide use bred resistant pests and left residues in food and, through biomagnification, in people. The fourth is agronomic and nutritional. Procurement and price support were concentrated on wheat and rice, so those two crops displaced pulses, oilseeds and millets. India's grain output rose while pulse availability per person fell, protein in poor diets suffered, and the millets — which need little water and carry more iron and calcium — went out of fashion precisely in the dry regions that most needed them. So the correct verdict is neither celebration nor condemnation. It is that a real and enormous benefit was purchased at a price that was unequally distributed across regions and classes, and partly deferred onto a groundwater stock and a soil that later generations must live with. That framing matters because it points to what should be done next, and the answers follow directly from the diagnosis: extend irrigation and credit to the regions and farmers left out, price water and power so extraction is not free, diversify support prices towards pulses and millets, and treat soil and aquifer as capital rather than as free inputs. Criticism of the Green Revolution, properly made, is not an argument against feeding people; it is an argument about who was fed, who paid, and what has been borrowed from the future. (The wrong answers deny a documented output increase, deny costs that soil and water records establish, or claim an equality of impact contradicted by every regional yield map of the period.)",
          hi: "ईमानदार लेखा दो बातें साथ थामे रहे, क्योंकि दोनों सच हैं और कोई दूसरे को काटती नहीं। उपलब्धि से शुरू, जो असाधारण थी और उसे छोटा नहीं करना चाहिए। 1960 के दशक के मध्य में भारत आपातकालीन प्रबंधों के तहत गेहूँ आयात कर रहा था, लगातार दो वर्ष फ़सलें विफल हुई थीं, और देश की खाद्य सुरक्षा किसी विदेशी सरकार की जहाज़-सारणी पर टिकी थी। लगभग पंद्रह वर्षों में उत्पादन लगभग दुगुना हुआ, आयात रुका, और बफ़र भंडार इतने बड़े हो गए कि बाद के सूखों ने कष्ट दिया पर अकाल नहीं। अकाल सदियों से भारतीय इतिहास की बार-बार लौटती विशेषता था; वह रुक गया। आगे जो भी हो, वह बहुत बड़ी संख्या में जीवन हैं। अब लागतें, जो चार क़िस्म की हैं। पहली क्षेत्र के अनुसार वितरणात्मक। उन्नत क़िस्में केवल बेहतर बीज नहीं; वे ऐसे बीज हैं जो तभी बेहतर करते हैं जब उन्हें निश्चित पानी, रासायनिक उर्वरक और कीटनाशक मिले। उस शर्त का अर्थ था कि तकनीक वहाँ अपनाई जा सकी जहाँ सिंचाई पहले से थी — पंजाब, हरियाणा, पश्चिमी उत्तर प्रदेश, आंध्र के हिस्से — और वर्षा-आधारित उच्चभूमि, शुष्क दक्कन तथा पूर्वी भारत में नहीं अपनाई जा सकी। अतः एक राष्ट्रीय कार्यक्रम ने क्षेत्रीय विचलन गहरा किया: सिंचित उत्तर-पश्चिम अन्न-भंडार बना और वर्षा-आधारित क्षेत्र और पीछे छूट गए। दूसरी वर्ग के अनुसार वितरणात्मक। बीज, उर्वरक, कीटनाशक और नलकूप — सबका दाम फ़सल आने से पहले लगता है। जिन किसानों के पास गिरवी रखने को भूमि और ऋण तक पहुँच थी वे पैकेज जुटा सके और लाभ में रहे; सीमांत किसानों ने वही करने को ऊँचे ब्याज पर उधार लिया, और बुरी ऋतु ने उन्हें छोटी जोत के विरुद्ध क़र्ज़ थमा दिया। भूमिहीन मज़दूरों को सघन खेती से रोज़गार मिला पर परिसंपत्ति नहीं। तीसरी पारिस्थितिक। शुष्क क्षेत्रों में चावल की लगातार सिंचाई ने भूजल पुनर्भरण से तेज़ खींचा, अतः जल-स्तर गिरे; भारी उर्वरक-उपयोग ने मृदा-संरचना बिगाड़ी और पानी में नाइट्रेट छोड़ा; कीटनाशक-उपयोग ने प्रतिरोधी कीट पैदा किए और भोजन में तथा जैव-आवर्धन से लोगों में अवशेष छोड़े। चौथी कृषि-वैज्ञानिक और पोषण-संबंधी। ख़रीद और मूल्य-समर्थन गेहूँ तथा चावल पर केंद्रित रहे, अतः उन दो फ़सलों ने दालों, तिलहनों और मोटे अनाजों को विस्थापित किया। भारत का अन्न-उत्पादन चढ़ा जबकि प्रति व्यक्ति दाल-उपलब्धता गिरी, निर्धन आहारों में प्रोटीन को चोट पहुँची, और मोटे अनाज — जिन्हें कम पानी चाहिए और जिनमें अधिक लोहा तथा कैल्शियम है — ठीक उन्हीं शुष्क क्षेत्रों में चलन से बाहर हुए जिन्हें उनकी सबसे अधिक ज़रूरत थी। अतः सही निर्णय न उत्सव है न भर्त्सना। यह कि एक असली और विशाल लाभ ऐसी क़ीमत पर ख़रीदा गया जो क्षेत्रों और वर्गों में असमान रूप से बँटी, और आंशिक रूप से एक भूजल-भंडार तथा एक मिट्टी पर टाल दी गई जिनके साथ बाद की पीढ़ियों को जीना है। यह ढाँचा इसलिए मायने रखता है कि वह बताता है आगे क्या करना चाहिए, और उत्तर निदान से सीधे निकलते हैं: छूट गए क्षेत्रों तथा किसानों तक सिंचाई और ऋण पहुँचाओ, पानी और बिजली की क़ीमत लगाओ ताकि निकासी मुफ़्त न रहे, समर्थन मूल्यों को दालों तथा मोटे अनाजों की ओर विविध करो, और मिट्टी तथा जलभृत को मुफ़्त निवेश नहीं, पूँजी मानो। हरित क्रांति की ठीक ढंग से की गई आलोचना लोगों को खिलाने के विरुद्ध तर्क नहीं है; वह इस बारे में तर्क है कि किसे खिलाया गया, किसने चुकाया, और भविष्य से क्या उधार लिया गया। (ग़लत उत्तर दर्ज उत्पादन-वृद्धि नकारते, उन लागतों को नकारते जिन्हें मृदा और जल अभिलेख सिद्ध करते, या प्रभाव की ऐसी समानता का दावा करते जिसका खंडन उस दौर का हर क्षेत्रीय उपज-नक़्शा करता है।)",
          mr: "प्रामाणिक हिशोबाने दोन गोष्टी एकत्र धराव्या लागतात, कारण दोन्ही खऱ्या आहेत आणि एक दुसरीला रद्द करत नाही. कमाईपासून सुरू, जी असामान्य होती आणि तिला लहान करू नये. 1960 च्या दशकाच्या मध्यावर भारत आणीबाणी व्यवस्थेखाली गहू आयात करत होता, सलग दोन वर्षे पिके बुडाली होती, आणि देशाची अन्नसुरक्षा एका परकी सरकारच्या जहाज-वेळापत्रकावर टेकली होती. सुमारे पंधरा वर्षांत उत्पादन जवळजवळ दुप्पट झाले, आयात थांबली, आणि राखीव साठे इतके मोठे झाले की नंतरच्या दुष्काळांनी हालअपेष्टा दिली पण दुष्काळमृत्यू नाही. दुष्काळ शतके भारतीय इतिहासाचे पुन्हापुन्हा परतणारे वैशिष्ट्य होते; तो थांबला. पुढे काहीही असो, ती खूप मोठ्या संख्येने आयुष्ये आहेत. आता किमती, ज्या चार प्रकारच्या. पहिली प्रदेशानुसार वाटपाची. अधिक उत्पादन देणाऱ्या जाती केवळ चांगली बियाणे नव्हेत; ती अशी बियाणे जी तेव्हाच चांगले देतात जेव्हा त्यांना खात्रीशीर पाणी, रासायनिक खत आणि कीटकनाशक मिळते. त्या अटीचा अर्थ हा की तंत्रज्ञान तिथे स्वीकारता आले जिथे सिंचन आधीच होते — पंजाब, हरियाणा, पश्चिम उत्तर प्रदेश, आंध्रचे भाग — आणि पावसावर आधारित उंचवटे, कोरडे दख्खन व पूर्व भारतात स्वीकारता आले नाही. म्हणून एका राष्ट्रीय कार्यक्रमाने प्रादेशिक अंतर खोल केले: सिंचित वायव्य धान्यभांडार बनला आणि पावसावर आधारित प्रदेश आणखी मागे पडले. दुसरी वर्गानुसार वाटपाची. बियाणे, खत, कीटकनाशक आणि कूपनलिका — सर्वांचे पैसे पीक येण्याआधी लागतात. ज्या शेतकऱ्यांकडे गहाण ठेवायला जमीन आणि कर्जाची सोय होती ते संच उभा करू शकले आणि फायद्यात राहिले; सीमांत शेतकऱ्यांनी तेच करायला जास्त व्याजाने उसने घेतले, आणि वाईट हंगामाने त्यांना लहान शेताविरुद्ध कर्ज दिले. भूमिहीन मजुरांना सघन शेतीतून रोजगार मिळाला पण मालमत्ता नाही. तिसरी पर्यावरणीय. कोरड्या भागांत भाताच्या सतत सिंचनाने भूजल पुनर्भरणाहून वेगाने ओढले, म्हणून पाण्याच्या पातळ्या घसरल्या; जबर खतवापराने मृदा-रचना खालावली आणि पाण्यात नायट्रेट सोडले; कीटकनाशक वापराने प्रतिकारक कीड निर्माण केली आणि अन्नात तसेच जैव-विशालनातून माणसांत अवशेष ठेवले. चौथी कृषिशास्त्रीय आणि पोषणविषयक. खरेदी आणि किंमत-आधार गहू व भातावर केंद्रित राहिले, म्हणून त्या दोन पिकांनी कडधान्ये, तेलबिया आणि भरडधान्ये विस्थापित केली. भारताचे धान्य उत्पादन चढले तर दरडोई कडधान्य उपलब्धता घसरली, गरीब आहारांतील प्रथिनांना फटका बसला, आणि भरडधान्ये — ज्यांना कमी पाणी लागते आणि ज्यांत अधिक लोह व कॅल्शियम आहे — नेमकी त्याच कोरड्या भागांत मागे पडली ज्यांना त्यांची सर्वाधिक गरज होती. म्हणून योग्य निर्णय ना उत्सव ना निंदा. तो हा की एक खरा आणि प्रचंड फायदा अशा किमतीवर विकत घेतला गेला जी प्रदेश आणि वर्गांत असमानपणे वाटली, आणि अंशतः एका भूजल-साठ्यावर व एका मातीवर पुढे ढकलली जिच्यासोबत नंतरच्या पिढ्यांना जगायचे आहे. ही मांडणी यासाठी महत्त्वाची की ती पुढे काय करावे ते सांगते, आणि उत्तरे निदानातून थेट निघतात: वगळलेल्या प्रदेशांपर्यंत व शेतकऱ्यांपर्यंत सिंचन आणि कर्ज न्या, पाणी व विजेला किंमत लावा जेणेकरून उपसा फुकट राहणार नाही, आधारभूत किमती कडधान्ये व भरडधान्यांकडे विविध करा, आणि माती व जलधर फुकट गुंतवणूक नव्हे तर भांडवल माना. हरितक्रांतीवरील योग्य प्रकारे केलेली टीका लोकांना खाऊ घालण्याविरुद्धचा युक्तिवाद नाही; तो कोणाला खाऊ घातले, कोणी मोजले, आणि भविष्यातून काय उसने घेतले याबद्दलचा युक्तिवाद आहे. (चुकीची उत्तरे नोंदलेली उत्पादनवाढ नाकारतात, मृदा व जल नोंदी सिद्ध करत असलेल्या किमती नाकारतात, वा त्या काळाचा प्रत्येक प्रादेशिक उत्पादन-नकाशा खोडून काढत असलेल्या परिणामाच्या समानतेचा दावा करतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Minerals and Energy Resources                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-minerals-energy",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 5 — Minerals and Energy Resources",
      hi: "अध्याय 5 — खनिज तथा ऊर्जा संसाधन",
      mr: "प्रकरण 5 — खनिजे आणि ऊर्जा संसाधने",
    },
    name: {
      en: "Minerals and Energy Resources",
      hi: "खनिज तथा ऊर्जा संसाधन",
      mr: "खनिजे आणि ऊर्जा संसाधने",
    },
    summary: {
      en: "What a country digs up and what it burns: the split between the iron-bearing ores and everything else, two grades of iron worth very different money, the ore that becomes aeroplanes, coal ranked by how long it sat under pressure, the oil trapped under a folded rock — and the sources that arrive free every morning and are still barely used.",
      hi: "कोई देश क्या खोदता और क्या जलाता है: लोहा-धारी अयस्कों और बाक़ी सबका विभाजन, बहुत भिन्न दाम वाले लोहे के दो दर्जे, वह अयस्क जो हवाई जहाज़ बनता है, दबाव के नीचे कितनी देर बैठा इससे आँका कोयला, मुड़ी चट्टान के नीचे फँसा तेल — और वे स्रोत जो हर सुबह मुफ़्त आते हैं और फिर भी मुश्किल से इस्तेमाल होते हैं।",
      mr: "एखादा देश काय खणतो आणि काय जाळतो: लोहधारी धातुके आणि बाकी सर्व यांतील फाळणी, फार वेगळ्या किमतीचे लोखंडाचे दोन दर्जे, विमाने बनणारे ते धातुक, दाबाखाली किती काळ बसला यावरून मोजलेला कोळसा, वळलेल्या खडकाखाली अडकलेले तेल — आणि ते स्रोत जे रोज सकाळी फुकट येतात आणि तरीही जेमतेम वापरले जातात.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "ferrous-non-ferrous",
        name: {
          en: "Ferrous and non-ferrous minerals",
          hi: "लौह और अलौह खनिज",
          mr: "लोहयुक्त आणि अलोह खनिजे",
        },
        kind: "idea",
        prompt: {
          en: "Iron ore, manganese, nickel and cobalt go into steel-making; copper, bauxite, lead and zinc do not contain iron at all and serve other trades entirely. Which division of metallic minerals is this?",
          hi: "लौह अयस्क, मैंगनीज़, निकल और कोबाल्ट इस्पात बनाने में जाते हैं; ताँबा, बॉक्साइट, सीसा और जस्ता में लोहा है ही नहीं और वे बिलकुल दूसरे धंधों के काम आते हैं। धात्विक खनिजों का यह कौन-सा विभाजन है?",
          mr: "लोहधातुक, मॅंगनीज, निकेल आणि कोबाल्ट पोलाद बनवण्यात जातात; तांबे, बॉक्साइट, शिसे आणि जस्त यांत लोखंड नाहीच आणि ते अगदी वेगळ्या धंद्यांच्या कामी येतात. धातुरूप खनिजांची ही कोणती फाळणी?",
        },
        statement: {
          en: "Metallic minerals divide into ferrous ones such as iron ore, manganese and nickel that contain iron and feed the steel industry, and non-ferrous ones such as copper, bauxite, lead and zinc that do not.",
          hi: "धात्विक खनिज लौह वर्ग में बँटते हैं — जैसे लौह अयस्क, मैंगनीज़ और निकल, जिनमें लोहा है और जो इस्पात उद्योग को खिलाते हैं — तथा अलौह वर्ग में, जैसे ताँबा, बॉक्साइट, सीसा और जस्ता, जिनमें नहीं।",
          mr: "धातुरूप खनिजे लोहयुक्त वर्गात विभागतात — जसे लोहधातुक, मॅंगनीज आणि निकेल, ज्यांत लोखंड आहे आणि जे पोलाद उद्योगाला पुरवतात — आणि अलोह वर्गात, जसे तांबे, बॉक्साइट, शिसे आणि जस्त, ज्यांत नाही.",
        },
        detail: {
          en: "About three-quarters of India's metallic mineral production by value is ferrous, and most of it lies in the Chotanagpur plateau and the Odisha–Chhattisgarh belt.",
          hi: "मूल्य के हिसाब से भारत के धात्विक खनिज उत्पादन का लगभग तीन-चौथाई लौह वर्ग का है, और उसका अधिकांश छोटानागपुर पठार तथा ओडिशा–छत्तीसगढ़ पट्टी में है।",
          mr: "मूल्याच्या हिशोबाने भारताच्या धातुरूप खनिज उत्पादनाचा सुमारे तीन-चतुर्थांश लोहयुक्त वर्गाचा, आणि त्याचा बहुतांश छोटानागपूर पठार व ओडिशा–छत्तीसगड पट्ट्यात.",
        },
        extra: {
          en: "Minerals also divide another way, into metallic and non-metallic — mica, limestone and gypsum belong to the second group and never yield a metal at all.",
          hi: "खनिज एक और तरह से भी बँटते हैं, धात्विक और अधात्विक में — अभ्रक, चूना-पत्थर और जिप्सम दूसरे समूह के हैं और कभी कोई धातु नहीं देते।",
          mr: "खनिजे आणखी एका प्रकारेही विभागतात, धातुरूप आणि अधातुरूप — अभ्रक, चुनखडी आणि जिप्सम दुसऱ्या गटाची आणि कधीही धातू देत नाहीत.",
        },
        pair: {
          left: {
            en: "With iron, for steel — and without it, for everything else",
            hi: "लोहे सहित, इस्पात को — और उसके बिना, बाक़ी सबको",
            mr: "लोखंडासह, पोलादासाठी — आणि त्याविना, बाकी सर्वांसाठी",
          },
          right: {
            en: "ferrous and non-ferrous minerals",
            hi: "लौह और अलौह खनिज",
            mr: "लोहयुक्त आणि अलोह खनिजे",
          },
        },
      },
      {
        id: "haematite-magnetite",
        name: {
          en: "Haematite and magnetite",
          hi: "हेमेटाइट और मैग्नेटाइट",
          mr: "हेमॅटाइट आणि मॅग्नेटाइट",
        },
        kind: "mineral",
        prompt: {
          en: "One is reddish, makes up most of what India mines and exports, and runs about sixty per cent iron; the other is black, has the highest iron content of any ore and carries magnetic properties. Which two ores are these?",
          hi: "एक लाल-सा है, भारत जो खोदता और निर्यात करता उसका अधिकांश यही है, और उसमें लगभग साठ प्रतिशत लोहा है; दूसरा काला है, किसी भी अयस्क से अधिक लौह-अंश रखता है और चुंबकीय गुण ढोता है। ये कौन-से दो अयस्क हैं?",
          mr: "एक तांबूस, भारत जे खणतो आणि निर्यात करतो त्याचा बहुतांश हाच, आणि त्यात सुमारे साठ टक्के लोखंड; दुसरा काळा, कोणत्याही धातुकाहून अधिक लोहांश बाळगणारा आणि चुंबकीय गुण वाहणारा. ही कोणती दोन धातुके?",
        },
        statement: {
          en: "Haematite is the reddish ore of about fifty to sixty per cent iron that forms the bulk of Indian production, while magnetite is the black ore with the highest iron content and excellent magnetic qualities.",
          hi: "हेमेटाइट लगभग पचास से साठ प्रतिशत लोहे वाला लाल-सा अयस्क है जो भारतीय उत्पादन का बड़ा हिस्सा बनाता है, जबकि मैग्नेटाइट सर्वोच्च लौह-अंश और उत्कृष्ट चुंबकीय गुणों वाला काला अयस्क है।",
          mr: "हेमॅटाइट हे सुमारे पन्नास ते साठ टक्के लोखंड असलेले तांबूस धातुक जे भारतीय उत्पादनाचा मोठा भाग बनवते, तर मॅग्नेटाइट हे सर्वोच्च लोहांश आणि उत्तम चुंबकीय गुणांचे काळे धातुक.",
        },
        detail: {
          en: "The main belts are Odisha–Jharkhand, Durg–Bastar–Chandrapur, Bellary–Chitradurga and Maharashtra–Goa, most of them close to the coal of the same plateau.",
          hi: "मुख्य पट्टियाँ हैं ओडिशा–झारखंड, दुर्ग–बस्तर–चंद्रपुर, बेल्लारी–चित्रदुर्ग और महाराष्ट्र–गोवा, जिनमें अधिकांश उसी पठार के कोयले के पास हैं।",
          mr: "मुख्य पट्टे आहेत ओडिशा–झारखंड, दुर्ग–बस्तर–चंद्रपूर, बेल्लारी–चित्रदुर्ग आणि महाराष्ट्र–गोवा, ज्यांतील बहुतांश त्याच पठाराच्या कोळशाजवळ.",
        },
        extra: {
          en: "Much of the Goa and Bellary output has been exported as raw ore, which sells the least valuable stage of the chain and lets the steel be made elsewhere.",
          hi: "गोवा और बेल्लारी की बहुत उपज कच्चे अयस्क के रूप में निर्यात हुई है, जो शृंखला का सबसे कम मूल्यवान चरण बेचती है और इस्पात कहीं और बनने देती है।",
          mr: "गोवा आणि बेल्लारीचे बरेच उत्पादन कच्च्या धातुकाच्या रूपात निर्यात झाले आहे, जे साखळीचा सर्वांत कमी मोलाचा टप्पा विकते आणि पोलाद इतरत्र बनू देते.",
        },
        pair: {
          left: {
            en: "The reddish bulk ore and the black high-grade one",
            hi: "लाल-सा थोक अयस्क और काला उच्च-श्रेणी अयस्क",
            mr: "तांबूस मोठ्या प्रमाणातले धातुक आणि काळे उच्च-दर्जाचे",
          },
          right: {
            en: "haematite and magnetite",
            hi: "हेमेटाइट और मैग्नेटाइट",
            mr: "हेमॅटाइट आणि मॅग्नेटाइट",
          },
        },
      },
      {
        id: "bauxite",
        name: {
          en: "Bauxite",
          hi: "बॉक्साइट",
          mr: "बॉक्साइट",
        },
        kind: "mineral",
        prompt: {
          en: "Formed by the weathering of aluminium-rich rocks, it is mined on the Amarkantak plateau and the hills of Odisha, and smelted into a metal light enough for aircraft and conductive enough for cables. Which ore is this?",
          hi: "एल्युमिनियम-समृद्ध चट्टानों के अपक्षय से बना, यह अमरकंटक पठार और ओडिशा की पहाड़ियों में खोदा जाता है, और ऐसी धातु में गलाया जाता है जो हवाई जहाज़ के लिए हल्की और तारों के लिए पर्याप्त चालक है। यह कौन-सा अयस्क है?",
          mr: "अ‍ॅल्युमिनियम-समृद्ध खडकांच्या विदारणातून बनलेले, हे अमरकंटक पठार आणि ओडिशाच्या डोंगरांत खणले जाते, आणि अशा धातूत वितळवले जाते जी विमानांसाठी हलकी आणि तारांसाठी पुरेशी वाहक. हे कोणते धातुक?",
        },
        statement: {
          en: "Bauxite is the ore from which aluminium is extracted, formed by the weathering of aluminium-rich rocks, and mined chiefly in Odisha, Jharkhand, Gujarat and the Amarkantak plateau.",
          hi: "बॉक्साइट वह अयस्क है जिससे एल्युमिनियम निकाला जाता है, जो एल्युमिनियम-समृद्ध चट्टानों के अपक्षय से बनता है, और मुख्यतः ओडिशा, झारखंड, गुजरात तथा अमरकंटक पठार में खोदा जाता है।",
          mr: "बॉक्साइट हे ते धातुक ज्यातून अ‍ॅल्युमिनियम काढले जाते, जे अ‍ॅल्युमिनियम-समृद्ध खडकांच्या विदारणातून बनते, आणि मुख्यत्वे ओडिशा, झारखंड, गुजरात आणि अमरकंटक पठारात खणले जाते.",
        },
        detail: {
          en: "Aluminium is prized for a rare combination — light, strong, corrosion-resistant, a good conductor and endlessly recyclable.",
          hi: "एल्युमिनियम एक दुर्लभ संयोजन के लिए मूल्यवान है — हल्का, मज़बूत, संक्षारण-रोधी, अच्छा चालक और अनंत बार पुनर्चक्रण योग्य।",
          mr: "अ‍ॅल्युमिनियम एका दुर्मीळ संयोजनासाठी मोलाचे — हलके, मजबूत, गंजरोधक, चांगले वाहक आणि अखंड पुनर्चक्रणीय.",
        },
        extra: {
          en: "Smelting it takes enormous electricity, which is why aluminium plants are built beside power stations rather than beside the mine.",
          hi: "उसे गलाने में विशाल बिजली लगती है, इसीलिए एल्युमिनियम संयंत्र खदान के बजाय बिजलीघरों के बग़ल बनाए जाते हैं।",
          mr: "ते वितळवायला प्रचंड वीज लागते, म्हणूनच अ‍ॅल्युमिनियम प्रकल्प खाणीऐवजी वीजनिर्मिती केंद्रांशेजारी बांधले जातात.",
        },
        pair: {
          left: {
            en: "The ore of a light, conductive, recyclable metal",
            hi: "हल्की, चालक, पुनर्चक्रणीय धातु का अयस्क",
            mr: "हलक्या, वाहक, पुनर्चक्रणीय धातूचे धातुक",
          },
          right: {
            en: "bauxite",
            hi: "बॉक्साइट",
            mr: "बॉक्साइट",
          },
        },
      },
      {
        id: "grades-of-coal",
        name: {
          en: "The grades of coal",
          hi: "कोयले के दर्जे",
          mr: "कोळशाचे दर्जे",
        },
        kind: "idea",
        prompt: {
          en: "Buried plant matter compressed for longer becomes harder, drier and hotter-burning, so the same substance runs from a soft brown fuel to a hard black one that is over ninety per cent carbon. What ranking is this?",
          hi: "अधिक समय दबा वनस्पति-पदार्थ कठोर, शुष्क और अधिक ताप देने वाला होता जाता है, अतः वही पदार्थ नरम भूरे ईंधन से लेकर नब्बे प्रतिशत से अधिक कार्बन वाले कठोर काले ईंधन तक फैलता है। यह कौन-सी श्रेणीबद्धता है?",
          mr: "अधिक काळ दाबलेले वनस्पती-द्रव्य कठीण, कोरडे आणि अधिक उष्णता देणारे होत जाते, म्हणून तोच पदार्थ मऊ तपकिरी इंधनापासून नव्वद टक्क्यांहून अधिक कार्बन असलेल्या कठीण काळ्या इंधनापर्यंत पसरतो. ही कोणती श्रेणीबद्धता?",
        },
        statement: {
          en: "Coal is graded by the degree of compression it has undergone — peat, then lignite, then bituminous, then anthracite — with carbon content and heating value rising and moisture falling at every step.",
          hi: "कोयला उस संपीडन की मात्रा से आँका जाता है जो उसने झेला — पीट, फिर लिग्नाइट, फिर बिटुमिनस, फिर एंथ्रासाइट — जहाँ हर चरण पर कार्बन-अंश तथा ऊष्मीय मान चढ़ते और नमी घटती है।",
          mr: "कोळसा त्याने सोसलेल्या दाबाच्या प्रमाणावरून मोजला जातो — पीट, मग लिग्नाइट, मग बिट्युमिनस, मग अँथ्रासाइट — जिथे प्रत्येक पायरीवर कार्बन-अंश व उष्मांक चढतात आणि ओलावा घटतो.",
        },
        detail: {
          en: "Bituminous is the workhorse of Indian industry, and the metallurgical grade of it is what a blast furnace needs to make steel.",
          hi: "बिटुमिनस भारतीय उद्योग का कामकाजी घोड़ा है, और उसका धातुकर्म-दर्जा वही है जो वात्या-भट्ठी को इस्पात बनाने चाहिए।",
          mr: "बिट्युमिनस हा भारतीय उद्योगाचा कामाचा घोडा, आणि त्याचा धातुकर्म-दर्जा तोच जो झोतभट्टीला पोलाद बनवायला लागतो.",
        },
        extra: {
          en: "India's reserves are dominated by the middling grades, so metallurgical coal must be imported even though the country has coal in abundance.",
          hi: "भारत के भंडारों में मध्यम दर्जों का बोलबाला है, अतः देश में कोयला भरपूर होते हुए भी धातुकर्म-कोयला आयात करना पड़ता है।",
          mr: "भारताच्या साठ्यांत मध्यम दर्जांचा भरणा, म्हणून देशात कोळसा भरपूर असूनही धातुकर्म-कोळसा आयात करावा लागतो.",
        },
        pair: {
          left: {
            en: "Peat to lignite to bituminous to anthracite",
            hi: "पीट से लिग्नाइट, बिटुमिनस, एंथ्रासाइट तक",
            mr: "पीटपासून लिग्नाइट, बिट्युमिनस, अँथ्रासाइटपर्यंत",
          },
          right: {
            en: "the grades of coal",
            hi: "कोयले के दर्जे",
            mr: "कोळशाचे दर्जे",
          },
        },
      },
      {
        id: "petroleum-natural-gas",
        name: {
          en: "Petroleum and natural gas",
          hi: "पेट्रोलियम और प्राकृतिक गैस",
          mr: "पेट्रोलियम आणि नैसर्गिक वायू",
        },
        kind: "idea",
        prompt: {
          en: "Both occur in the pores of sedimentary rock and are held in place by an impermeable layer above an upfold — Mumbai High, Gujarat and Assam are the chief Indian sources. Which pair is this?",
          hi: "दोनों अवसादी चट्टान के छिद्रों में मिलते हैं और किसी ऊपरमोड़ के ऊपर की अपारगम्य परत से जगह पर रुके रहते हैं — मुंबई हाई, गुजरात और असम मुख्य भारतीय स्रोत हैं। यह कौन-सी जोड़ी है?",
          mr: "दोन्ही गाळाच्या खडकाच्या छिद्रांत सापडतात आणि एखाद्या वरच्या घडीवरील अपारगम्य थराने जागी अडकून राहतात — मुंबई हाय, गुजरात आणि आसाम हे मुख्य भारतीय स्रोत. ही कोणती जोडी?",
        },
        statement: {
          en: "Petroleum and natural gas occur together in the pore spaces of sedimentary rocks, trapped beneath an impermeable cap in folded structures, and India draws them chiefly from Mumbai High, Gujarat and Assam.",
          hi: "पेट्रोलियम और प्राकृतिक गैस अवसादी चट्टानों के छिद्र-स्थानों में साथ मिलते हैं, मुड़ी संरचनाओं में अपारगम्य टोपी के नीचे फँसे, और भारत उन्हें मुख्यतः मुंबई हाई, गुजरात तथा असम से लेता है।",
          mr: "पेट्रोलियम आणि नैसर्गिक वायू गाळाच्या खडकांच्या छिद्र-जागांत एकत्र सापडतात, वळलेल्या रचनांत अपारगम्य टोपीखाली अडकलेले, आणि भारत ते मुख्यत्वे मुंबई हाय, गुजरात व आसाममधून घेतो.",
        },
        detail: {
          en: "Gas burns far more cleanly than coal or oil and is used as fuel, as feedstock for fertiliser and petrochemicals, and as compressed gas in vehicles.",
          hi: "गैस कोयले या तेल से कहीं साफ़ जलती है और ईंधन के रूप में, उर्वरक तथा पेट्रो-रसायनों की कच्ची सामग्री के रूप में, और वाहनों में संपीडित गैस के रूप में इस्तेमाल होती है।",
          mr: "वायू कोळसा वा तेलाहून कितीतरी स्वच्छ जळतो आणि इंधन म्हणून, खत व पेट्रोरसायनांसाठी कच्चा माल म्हणून, आणि वाहनांत संपीडित वायू म्हणून वापरला जातो.",
        },
        extra: {
          en: "India imports the large majority of the crude it consumes, which ties the national budget and the price of everything transported to decisions taken abroad.",
          hi: "भारत जो कच्चा तेल खपाता उसका बड़ा बहुमत आयात करता है, जो राष्ट्रीय बजट और हर ढोई जाती वस्तु की क़ीमत को विदेश में लिए निर्णयों से बाँध देता है।",
          mr: "भारत जे कच्चे तेल वापरतो त्याचा मोठा बहुसंख्य भाग आयात करतो, जे राष्ट्रीय अर्थसंकल्प आणि प्रत्येक वाहून नेलेल्या वस्तूची किंमत परदेशात घेतलेल्या निर्णयांशी बांधते.",
        },
        pair: {
          left: {
            en: "Trapped in sedimentary pores under a cap rock",
            hi: "टोपी-चट्टान के नीचे अवसादी छिद्रों में फँसे",
            mr: "टोपी-खडकाखाली गाळाच्या छिद्रांत अडकलेले",
          },
          right: {
            en: "petroleum and natural gas",
            hi: "पेट्रोलियम और प्राकृतिक गैस",
            mr: "पेट्रोलियम आणि नैसर्गिक वायू",
          },
        },
      },
      {
        id: "non-conventional-energy",
        name: {
          en: "Non-conventional energy sources",
          hi: "ग़ैर-परंपरागत ऊर्जा स्रोत",
          mr: "अपारंपरिक ऊर्जा स्रोत",
        },
        kind: "idea",
        prompt: {
          en: "Sunlight over Rajasthan, wind along the Tamil Nadu coast, tides in the Gulf of Kachchh, hot springs in Himachal, cattle dung in every village — sources that renew themselves and do not add carbon. What are these called?",
          hi: "राजस्थान पर धूप, तमिलनाडु के तट पर पवन, कच्छ की खाड़ी में ज्वार, हिमाचल में गरम सोते, हर गाँव में गोबर — ऐसे स्रोत जो स्वयं नए होते हैं और कार्बन नहीं जोड़ते। ये क्या कहलाते हैं?",
          mr: "राजस्थानवर ऊन, तमिळनाडूच्या किनाऱ्यावर वारा, कच्छच्या आखातात भरती, हिमाचलात गरम झरे, प्रत्येक गावात शेण — असे स्रोत जे स्वतः नवे होतात आणि कार्बन जोडत नाहीत. यांना काय म्हणतात?",
        },
        statement: {
          en: "Non-conventional energy sources — solar, wind, tidal, geothermal and biogas — renew themselves continuously, add little or no carbon, and can be generated close to where the energy is needed.",
          hi: "ग़ैर-परंपरागत ऊर्जा स्रोत — सौर, पवन, ज्वारीय, भूतापीय और बायोगैस — लगातार स्वयं नए होते हैं, कार्बन कम या बिलकुल नहीं जोड़ते, और वहीं पास बनाए जा सकते हैं जहाँ ऊर्जा चाहिए।",
          mr: "अपारंपरिक ऊर्जा स्रोत — सौर, पवन, भरती-ओहोटी, भूऔष्णिक आणि जैववायू — सतत स्वतः नवे होतात, कार्बन कमी वा मुळीच जोडत नाहीत, आणि जिथे ऊर्जा हवी तिथेच जवळ निर्माण करता येतात.",
        },
        detail: {
          en: "India's advantage is unusual: the country receives strong sunshine on most days of the year over a very large area, which is a resource nothing has to be dug up to obtain.",
          hi: "भारत का लाभ असामान्य है: देश को वर्ष के अधिकांश दिनों बहुत बड़े क्षेत्र पर तेज़ धूप मिलती है, और यह ऐसा संसाधन है जिसे पाने को कुछ खोदना नहीं पड़ता।",
          mr: "भारताचा फायदा असामान्य: देशाला वर्षाच्या बहुतांश दिवशी खूप मोठ्या क्षेत्रावर तीव्र ऊन मिळते, आणि हे असे संसाधन ज्यासाठी काहीही खणावे लागत नाही.",
        },
        extra: {
          en: "A biogas plant does two jobs at once — it gives a household clean cooking gas and returns a better manure than the dung burnt directly would have been.",
          hi: "बायोगैस संयंत्र एक साथ दो काम करता है — वह घर को साफ़ रसोई-गैस देता है और सीधे जलाए गोबर से बेहतर खाद लौटाता है।",
          mr: "जैववायू संयंत्र एकाच वेळी दोन कामे करते — ते घराला स्वच्छ स्वयंपाकाचा वायू देते आणि थेट जाळलेल्या शेणाहून चांगले खत परत करते.",
        },
        pair: {
          left: {
            en: "Renewing, low-carbon, generated where it is used",
            hi: "स्वयं नवीकरण, कम-कार्बन, उपयोग-स्थल पर उत्पन्न",
            mr: "स्वतः नवे होणारे, कमी-कार्बन, वापराच्या ठिकाणी निर्माण",
          },
          right: {
            en: "non-conventional energy sources",
            hi: "ग़ैर-परंपरागत ऊर्जा स्रोत",
            mr: "अपारंपरिक ऊर्जा स्रोत",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "India's integrated steel plants at Jamshedpur, Bhilai, Rourkela, Durgapur and Bokaro all sit within one broad region of the country rather than near the ports or the big consuming cities. Explain what determined those locations.",
          hi: "जमशेदपुर, भिलाई, राउरकेला, दुर्गापुर और बोकारो के भारत के एकीकृत इस्पात संयंत्र सब देश के एक ही व्यापक क्षेत्र में बैठे हैं, न कि बंदरगाहों या बड़े उपभोक्ता शहरों के पास। समझाओ उन स्थानों को किसने तय किया।",
          mr: "जमशेदपूर, भिलाई, राउरकेला, दुर्गापूर आणि बोकारो येथील भारताचे एकात्मिक पोलाद प्रकल्प सर्व देशाच्या एकाच व्यापक प्रदेशात बसले आहेत, बंदरे वा मोठ्या ग्राहक शहरांजवळ नव्हे. समजावा ती ठिकाणे कशाने ठरवली.",
        },
        choices: [
          {
            en: "Steel-making is a weight-losing process: several tonnes of iron ore, coking coal, limestone and manganese are consumed to make one tonne of steel, so it is far cheaper to move the light finished product than the heavy raw materials. The Chotanagpur plateau and the Odisha–Chhattisgarh belt hold iron ore, coal, limestone and manganese close together, with water and rail already there — so the plants went to the inputs rather than to the market",
            hi: "इस्पात बनाना भार-घटाती प्रक्रिया है: एक टन इस्पात बनाने में कई टन लौह अयस्क, कोकिंग कोयला, चूना-पत्थर और मैंगनीज़ खपते हैं, अतः भारी कच्चे माल के बजाय हल्का तैयार उत्पाद ढोना कहीं सस्ता है। छोटानागपुर पठार तथा ओडिशा–छत्तीसगढ़ पट्टी में लौह अयस्क, कोयला, चूना-पत्थर और मैंगनीज़ पास-पास हैं, और पानी तथा रेल पहले से वहीं — अतः संयंत्र बाज़ार के बजाय कच्चे माल के पास गए",
            mr: "पोलादनिर्मिती ही वजन-घटवणारी प्रक्रिया: एक टन पोलाद बनवायला कैक टन लोहधातुक, कोकिंग कोळसा, चुनखडी आणि मॅंगनीज खर्ची पडतात, म्हणून जड कच्च्या मालाऐवजी हलका तयार माल वाहणे कितीतरी स्वस्त. छोटानागपूर पठार आणि ओडिशा–छत्तीसगड पट्ट्यात लोहधातुक, कोळसा, चुनखडी व मॅंगनीज जवळजवळ, आणि पाणी व रेल्वे आधीच तिथे — म्हणून प्रकल्प बाजाराऐवजी कच्च्या मालाकडे गेले",
          },
          {
            en: "Because the government wished to keep steel plants as far from any railway line as possible",
            hi: "क्योंकि सरकार इस्पात संयंत्रों को हर रेलवे लाइन से जितना दूर हो सके रखना चाहती थी",
            mr: "कारण सरकारला पोलाद प्रकल्प प्रत्येक रेल्वेमार्गापासून शक्य तितके दूर ठेवायचे होते",
          },
          {
            en: "Because steel is a weight-gaining industry, so plants must sit next to the customer rather than the mine",
            hi: "क्योंकि इस्पात भार-बढ़ाता उद्योग है, अतः संयंत्रों को खदान के बजाय ग्राहक के बग़ल बैठना चाहिए",
            mr: "कारण पोलाद हा वजन-वाढवणारा उद्योग, म्हणून प्रकल्प खाणीऐवजी ग्राहकाशेजारी बसावेत",
          },
          {
            en: "The locations were chosen at random and have no relationship to raw materials at all",
            hi: "स्थान बेतरतीब चुने गए और कच्चे माल से उनका कोई संबंध ही नहीं",
            mr: "ठिकाणे यादृच्छिक निवडली गेली आणि कच्च्या मालाशी त्यांचा संबंधच नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The answer turns on a simple comparison of what has to be moved. Making a tonne of steel is not a matter of melting a tonne of ore. A blast furnace consumes roughly one and a half to two tonnes of iron ore, close to a tonne of coking coal, several hundred kilograms of limestone as flux, plus manganese and large volumes of water, to yield one tonne of finished metal. Everything else — the gangue in the ore, the ash and gases from the coal, the slag from the flux — is waste that leaves as rock, smoke and heat. An industry with this profile is called weight-losing, and for such an industry the transport arithmetic is decisive. If you build the plant at the market, you must haul four or five tonnes of heavy, low-value bulk across the country for every tonne of steel eventually sold. If you build it at the raw materials, you haul one tonne of high-value product. The freight bill differs by a factor of several, and steel is a commodity sold in a competitive market where a few per cent on cost decides who survives. Now look at where those inputs coincide. The Chotanagpur plateau and the belt running through Jharkhand, Odisha, Chhattisgarh and West Bengal is one of the few places on earth where high-grade iron ore, coking coal, limestone, dolomite and manganese all lie within a short radius of each other. The Damodar valley coalfields sit beside the Singhbhum and Odisha ore belts. Water for cooling comes from the Damodar, Subarnarekha and their tributaries. The colonial railway network already ran through the region to carry coal, so the transport link existed before the plants did. Jamshedpur, founded by Tata in 1907, was sited on exactly this logic, and the public-sector plants of the 1950s and 1960s — Bhilai, Rourkela, Durgapur, Bokaro — followed the same reasoning with foreign technical collaboration. A second consideration reinforced it: cheap labour was available locally, and the region's own poverty made industrial employment a stated policy aim. It is worth noticing what this explanation predicts elsewhere, because that is the test of it. Industries that are weight-gaining or perishable behave oppositely: soft-drink bottling, bread and furniture are made near consumers because the finished product is bulkier or more fragile than the inputs. Aluminium smelting, which consumes enormous electricity, locates near power stations rather than near bauxite. Sugar mills sit in the cane fields because cane loses sucrose within hours of cutting. And modern electronics and software, whose product weighs almost nothing, are free to locate wherever skilled people wish to live — which is why Bengaluru's growth had nothing to do with any mineral at all. One principle, applied to different physical facts, explains all of these. (The wrong answers invert the weight relationship, imagine deliberate isolation from rail, or deny a pattern that maps the ore and coal belts almost exactly.)",
          hi: "उत्तर इस सीधी तुलना पर घूमता है कि ढोना क्या पड़ता है। एक टन इस्पात बनाना एक टन अयस्क गलाने का मामला नहीं। वात्या-भट्ठी एक टन तैयार धातु देने के लिए लगभग डेढ़ से दो टन लौह अयस्क, क़रीब एक टन कोकिंग कोयला, कई सौ किलोग्राम चूना-पत्थर गालक के रूप में, और मैंगनीज़ तथा विशाल मात्रा में पानी खपाती है। बाक़ी सब — अयस्क की गैंग, कोयले की राख और गैसें, गालक का धातुमल — कचरा है जो चट्टान, धुएँ और ऊष्मा के रूप में निकल जाता है। ऐसे स्वभाव वाले उद्योग को भार-घटाता कहते हैं, और ऐसे उद्योग के लिए परिवहन का अंकगणित निर्णायक होता है। यदि संयंत्र बाज़ार पर बनाओ, तो अंततः बिकते हर टन इस्पात के लिए चार-पाँच टन भारी, कम-मूल्य थोक देश भर ढोना पड़ेगा। यदि कच्चे माल पर बनाओ, तो एक टन उच्च-मूल्य उत्पाद ढोना पड़ेगा। भाड़े का बिल कई गुना भिन्न होता है, और इस्पात ऐसी वस्तु है जो प्रतिस्पर्धी बाज़ार में बिकती है जहाँ लागत पर कुछ प्रतिशत तय करते हैं कौन बचेगा। अब देखो वे कच्चे माल कहाँ एक साथ मिलते हैं। छोटानागपुर पठार और झारखंड, ओडिशा, छत्तीसगढ़ तथा पश्चिम बंगाल से गुज़रती पट्टी पृथ्वी के उन थोड़े स्थानों में है जहाँ उच्च-श्रेणी लौह अयस्क, कोकिंग कोयला, चूना-पत्थर, डोलोमाइट और मैंगनीज़ सब एक-दूसरे की छोटी त्रिज्या में पड़े हैं। दामोदर घाटी के कोयला-क्षेत्र सिंहभूम और ओडिशा की अयस्क-पट्टियों के बग़ल हैं। ठंडा करने का पानी दामोदर, स्वर्णरेखा और उनकी सहायक नदियों से आता है। कोयला ढोने को औपनिवेशिक रेल-जाल पहले से उस क्षेत्र से गुज़रता था, अतः परिवहन-कड़ी संयंत्रों से पहले मौजूद थी। 1907 में टाटा द्वारा स्थापित जमशेदपुर ठीक इसी तर्क पर बसाया गया, और 1950-60 के दशकों के सार्वजनिक क्षेत्र के संयंत्र — भिलाई, राउरकेला, दुर्गापुर, बोकारो — विदेशी तकनीकी सहयोग के साथ उसी तर्क का पालन करते रहे। एक दूसरा विचार उसे और मज़बूत करता था: सस्ता श्रम स्थानीय रूप से उपलब्ध था, और उस क्षेत्र की अपनी निर्धनता ने औद्योगिक रोज़गार को घोषित नीति-लक्ष्य बना दिया था। ध्यान देने योग्य है कि यह व्याख्या अन्यत्र क्या भविष्यवाणी करती है, क्योंकि वही उसकी कसौटी है। जो उद्योग भार-बढ़ाते या शीघ्र नष्ट होने वाले हैं वे उल्टे बरतते हैं: शीतल पेय की बोतलबंदी, डबलरोटी और फ़र्नीचर उपभोक्ताओं के पास बनाए जाते हैं क्योंकि तैयार उत्पाद कच्चे माल से अधिक भारी-भरकम या नाज़ुक होता है। एल्युमिनियम गलाना, जो विशाल बिजली खपाता है, बॉक्साइट के बजाय बिजलीघरों के पास बैठता है। चीनी मिलें गन्ने के खेतों में बैठती हैं क्योंकि गन्ना कटने के घंटों में शर्करा खो देता है। और आधुनिक इलेक्ट्रॉनिक्स तथा सॉफ़्टवेयर, जिनके उत्पाद का भार लगभग कुछ नहीं, वहाँ बसने को स्वतंत्र हैं जहाँ कुशल लोग रहना चाहें — इसीलिए बेंगलुरु की वृद्धि का किसी खनिज से कोई संबंध नहीं था। एक ही सिद्धांत, भिन्न भौतिक तथ्यों पर लगाया गया, इन सबको समझा देता है। (ग़लत उत्तर भार-संबंध उलटते, रेल से जानबूझकर अलगाव की कल्पना करते, या उस प्रतिरूप को नकारते जो अयस्क और कोयला पट्टियों को लगभग ठीक-ठीक मानचित्रित करता है।)",
          mr: "उत्तर काय वाहावे लागते या सोप्या तुलनेवर फिरते. एक टन पोलाद बनवणे म्हणजे एक टन धातुक वितळवणे नव्हे. झोतभट्टी एक टन तयार धातू देण्यासाठी सुमारे दीड ते दोन टन लोहधातुक, जवळपास एक टन कोकिंग कोळसा, कैकशे किलोग्रॅम चुनखडी वितळक म्हणून, आणि मॅंगनीज व प्रचंड प्रमाणात पाणी वापरते. बाकी सर्व — धातुकातील निरुपयोगी खडक, कोळशाची राख आणि वायू, वितळकाचा मळी — कचरा जो खडक, धूर आणि उष्णतेच्या रूपात निघून जातो. अशा स्वरूपाच्या उद्योगाला वजन-घटवणारा म्हणतात, आणि अशा उद्योगासाठी वाहतुकीचे अंकगणित निर्णायक. प्रकल्प बाजारावर बांधला, तर शेवटी विकल्या जाणाऱ्या प्रत्येक टन पोलादासाठी चार-पाच टन जड, कमी-मोलाचा माल देशभर ओढावा लागेल. कच्च्या मालावर बांधला, तर एक टन उच्च-मोलाचा माल ओढावा लागेल. भाड्याचे बिल कैकपट वेगळे, आणि पोलाद ही अशी वस्तू जी स्पर्धात्मक बाजारात विकली जाते जिथे खर्चावरचे काही टक्के कोण टिकेल हे ठरवतात. आता ती कच्ची सामग्री कुठे एकत्र येते ते पाहा. छोटानागपूर पठार आणि झारखंड, ओडिशा, छत्तीसगड व पश्चिम बंगालमधून जाणारा पट्टा हे पृथ्वीवरील त्या थोड्या ठिकाणांपैकी जिथे उच्च-दर्जाचे लोहधातुक, कोकिंग कोळसा, चुनखडी, डोलोमाइट आणि मॅंगनीज सर्व एकमेकांच्या लहान त्रिज्येत पडलेले. दामोदर खोऱ्याची कोळसा-क्षेत्रे सिंहभूम आणि ओडिशाच्या धातुक-पट्ट्यांशेजारी. थंड करण्याचे पाणी दामोदर, सुवर्णरेखा आणि त्यांच्या उपनद्यांतून. कोळसा वाहायला वसाहती रेल्वेजाळे आधीच त्या प्रदेशातून जात होते, म्हणून वाहतूक-दुवा प्रकल्पांच्या आधीच होता. 1907 मध्ये टाटांनी स्थापलेले जमशेदपूर नेमके याच तर्कावर वसवले, आणि 1950-60 च्या दशकांतील सार्वजनिक क्षेत्रातील प्रकल्प — भिलाई, राउरकेला, दुर्गापूर, बोकारो — परदेशी तांत्रिक सहकार्यासह त्याच तर्काचे पालन करत राहिले. एक दुसरा विचार तो अधिक बळकट करत होता: स्वस्त श्रम स्थानिकरीत्या उपलब्ध होते, आणि त्या प्रदेशाच्या स्वतःच्या गरिबीने औद्योगिक रोजगार जाहीर धोरण-उद्दिष्ट बनवले होते. ही स्पष्टीकरण इतरत्र काय भाकीत करते हे लक्षात घेण्याजोगे, कारण तीच तिची कसोटी. जे उद्योग वजन-वाढवणारे वा लवकर नाश पावणारे ते उलट वागतात: शीतपेयांची बाटलीभरणी, पाव आणि फर्निचर ग्राहकांजवळ बनवले जातात कारण तयार माल कच्च्या मालाहून अधिक अवजड वा नाजूक. अ‍ॅल्युमिनियम वितळवणे, जे प्रचंड वीज वापरते, बॉक्साइटऐवजी वीजकेंद्रांजवळ बसते. साखर कारखाने उसाच्या शेतांत बसतात कारण ऊस कापल्यानंतर तासांत साखर गमावतो. आणि आधुनिक इलेक्ट्रॉनिक्स व सॉफ्टवेअर, ज्यांच्या मालाचे वजन जवळजवळ काहीच नाही, तिथे वसायला मोकळे जिथे कुशल लोक राहू इच्छितात — म्हणूनच बंगळुरूच्या वाढीचा कोणत्याही खनिजाशी संबंध नव्हता. एकच तत्त्व, वेगळ्या भौतिक तथ्यांवर लावलेले, या सर्वांचे स्पष्टीकरण देते. (चुकीची उत्तरे वजन-नाते उलटवतात, रेल्वेपासून मुद्दाम दूर राहण्याची कल्पना करतात, वा धातुक व कोळसा पट्ट्यांना जवळजवळ नेमके नकाशांकित करणारे प्रारूप नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "India receives strong sunshine over most of its territory on most days of the year, yet coal still generates the majority of its electricity — a fuel that is finite, imported in part, and the country's largest source of carbon emissions. Explain why the switch is slow, and what an honest transition would require.",
          hi: "भारत को वर्ष के अधिकांश दिनों उसके अधिकांश भूभाग पर तेज़ धूप मिलती है, फिर भी उसकी अधिकांश बिजली कोयला ही बनाता है — ऐसा ईंधन जो सीमित है, आंशिक रूप से आयातित है, और देश का सबसे बड़ा कार्बन-उत्सर्जन स्रोत है। समझाओ बदलाव धीमा क्यों है, और एक ईमानदार संक्रमण को क्या चाहिए।",
          mr: "भारताला वर्षाच्या बहुतांश दिवशी त्याच्या बहुतांश भूभागावर तीव्र ऊन मिळते, तरीही त्याची बहुतांश वीज कोळसाच निर्माण करतो — असे इंधन जे मर्यादित, अंशतः आयात केलेले, आणि देशाचा सर्वांत मोठा कार्बन-उत्सर्जन स्रोत. समजावा बदल मंद का, आणि प्रामाणिक संक्रमणाला काय लागेल.",
        },
        choices: [
          {
            en: "Because the existing system is built around coal — power stations, mines, railway freight and millions of livelihoods — and because sun and wind are intermittent, so they need storage or backup to supply a grid at night and in the monsoon. An honest transition therefore needs storage and grid investment, planned retirement of old plants, and above all a settlement for coal-district workers and states whose revenue depends on it; treating it as merely a choice between two technologies is what makes the switch stall",
            hi: "क्योंकि मौजूदा तंत्र कोयले के इर्द-गिर्द बना है — बिजलीघर, खदानें, रेल-भाड़ा और लाखों आजीविकाएँ — और क्योंकि सूर्य तथा पवन रुक-रुक कर आते हैं, अतः रात और मानसून में ग्रिड को देने के लिए उन्हें भंडारण या बैकअप चाहिए। अतः ईमानदार संक्रमण को भंडारण तथा ग्रिड में निवेश, पुराने संयंत्रों की नियोजित सेवानिवृत्ति, और सबसे बढ़कर कोयला-ज़िलों के मज़दूरों तथा उन राज्यों के लिए समझौता चाहिए जिनका राजस्व उस पर टिका है; इसे केवल दो तकनीकों के बीच का चुनाव मानना ही बदलाव को अटकाता है",
            mr: "कारण विद्यमान यंत्रणा कोळशाभोवती बांधलेली आहे — वीजकेंद्रे, खाणी, रेल्वे भाडे आणि लाखो उपजीविका — आणि कारण सूर्य व वारा खंडित येतात, म्हणून रात्री आणि मान्सूनमध्ये ग्रिडला पुरवायला त्यांना साठवण वा राखीव लागते. म्हणून प्रामाणिक संक्रमणाला साठवण व ग्रिडमध्ये गुंतवणूक, जुन्या प्रकल्पांची नियोजित निवृत्ती, आणि सर्वांत महत्त्वाचे कोळसा-जिल्ह्यांतील कामगार व ज्यांचा महसूल त्यावर अवलंबून त्या राज्यांसाठी तडजोड लागते; याला केवळ दोन तंत्रज्ञानांतील निवड मानणेच बदल अडवते",
          },
          {
            en: "Because solar panels do not work in India's climate and produce no usable electricity here",
            hi: "क्योंकि सौर पैनल भारत की जलवायु में काम नहीं करते और यहाँ कोई उपयोगी बिजली नहीं देते",
            mr: "कारण सौर पॅनेल भारताच्या हवामानात चालत नाहीत आणि इथे कोणतीही वापरण्याजोगी वीज देत नाहीत",
          },
          {
            en: "Because coal is renewable and will therefore never run out, making any transition unnecessary",
            hi: "क्योंकि कोयला नवीकरणीय है और इसलिए कभी नहीं चुकेगा, जिससे कोई संक्रमण अनावश्यक हो जाता है",
            mr: "कारण कोळसा नवीकरणीय आहे आणि म्हणून कधीच संपणार नाही, ज्याने कोणतेही संक्रमण अनावश्यक ठरते",
          },
          {
            en: "Because no country anywhere has ever changed its energy sources, so change is impossible in principle",
            hi: "क्योंकि कहीं किसी देश ने अपने ऊर्जा-स्रोत कभी नहीं बदले, अतः बदलाव सैद्धांतिक रूप से असंभव है",
            mr: "कारण कुठेही कोणत्याही देशाने आपले ऊर्जा-स्रोत कधीच बदलले नाहीत, म्हणून बदल तत्त्वतः अशक्य",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The slowness is not a failure of arithmetic — solar power is now cheap per unit generated — but of everything the arithmetic leaves out. Three obstacles matter, and only one of them is technical. The first is intermittency. A coal plant delivers a steady output on demand; the sun sets every evening and disappears behind monsoon cloud for weeks, and wind rises and falls without regard to when the country needs power. A grid must match supply to demand second by second, and the evening peak — when household lighting and cooking coincide — falls precisely when solar output is ending. Solar generation therefore cannot simply replace coal capacity megawatt for megawatt; it needs storage, or hydro and gas plants held ready as backup, or a grid large enough to move surplus from a sunny region to a cloudy one. Those additions are what make the comparison honest, and they cost money that the headline price per unit does not include. The second obstacle is sunk infrastructure. India's electricity system was built around coal over seventy years: the power stations themselves, with decades of design life remaining; the mines feeding them; the railways, whose coal freight cross-subsidises passenger fares; the transmission network laid out to carry power from the coalfields of the east to the consuming west and south. Replacing a fuel means rebuilding a system, and systems have inertia that individual technologies do not. The third obstacle is people, and it is the one most often skipped. Coal mining and the industries around it employ very large numbers directly and support far more indirectly in Jharkhand, Odisha, Chhattisgarh and West Bengal — precisely the states that are already among India's poorest. State governments there draw substantial revenue from coal royalties. A transition that simply closes mines transfers the cost of a national and global benefit onto the districts least able to bear it, which is both unjust and, practically, a guarantee of political resistance that will stall the policy. So an honest transition has to be designed rather than merely announced. It needs investment in storage and in the grid so that renewable supply can be firmed; a published schedule for retiring the oldest and dirtiest plants so that industry can plan rather than be surprised; support for the domestic manufacture of panels, batteries and turbines so that the shift creates employment instead of only importing it; and — indispensably — a settlement for coal regions: retraining, alternative industry, and a share of the new energy investment steered to the districts losing the old one. There is a further point worth making, because it changes the framing. The cheapest unit of electricity is always the one not consumed: efficient motors, better building design, LED lighting and reduced transmission losses cut demand at a fraction of the cost of new generation of any kind. And India has an argument of equity to make internationally — its per-person emissions remain far below those of the countries that burned the most carbon getting rich — while still having an interest in making the transition, because it is among the countries most exposed to the heat, drought and flooding that follow. The conclusion is not that coal must be defended or that solar is a fantasy, but that a fuel switch is a social and industrial project rather than a purchase, and that the countries which manage it will be the ones that planned for the losers as carefully as for the technology. (The wrong answers deny working solar generation, misclassify coal as renewable, or claim energy transitions never happen — contradicted by the shift from wood to coal to oil within recorded history.)",
          hi: "धीमापन अंकगणित की विफलता नहीं — प्रति उत्पन्न इकाई सौर बिजली अब सस्ती है — बल्कि उस सबकी है जो अंकगणित छोड़ देता है। तीन बाधाएँ मायने रखती हैं, और उनमें से केवल एक तकनीकी है। पहली रुक-रुक कर आना। कोयला-संयंत्र माँग पर स्थिर उत्पादन देता है; सूर्य हर शाम डूबता है और मानसून के बादलों के पीछे हफ़्तों ग़ायब रहता है, और पवन इस परवाह के बिना चढ़ती-उतरती है कि देश को बिजली कब चाहिए। ग्रिड को आपूर्ति और माँग सेकंड-दर-सेकंड मिलानी पड़ती है, और शाम का शिखर — जब घरों की रोशनी और रसोई साथ आती हैं — ठीक तब पड़ता है जब सौर उत्पादन समाप्त हो रहा होता है। अतः सौर उत्पादन कोयला-क्षमता को मेगावाट-दर-मेगावाट बस बदल नहीं सकता; उसे भंडारण चाहिए, या बैकअप के रूप में तैयार रखे जल तथा गैस संयंत्र, या इतना बड़ा ग्रिड कि धूप वाले क्षेत्र से अधिशेष बादल वाले क्षेत्र तक ले जाया जा सके। वही जोड़ तुलना को ईमानदार बनाते हैं, और उनका दाम प्रति इकाई शीर्षक-क़ीमत में शामिल नहीं होता। दूसरी बाधा गड़ा हुआ ढाँचा है। भारत की बिजली-प्रणाली सत्तर वर्षों में कोयले के इर्द-गिर्द बनी: स्वयं बिजलीघर, जिनका दशकों का रचना-जीवन शेष है; उन्हें खिलाती खदानें; रेलवे, जिसका कोयला-भाड़ा यात्री किरायों को सहायिकी देता है; और वह संचरण-जाल जो पूर्व के कोयला-क्षेत्रों से खपत करते पश्चिम तथा दक्षिण तक बिजली ले जाने को बिछाया गया। ईंधन बदलने का अर्थ प्रणाली फिर बनाना है, और प्रणालियों में वह जड़ता होती है जो अकेली तकनीकों में नहीं। तीसरी बाधा लोग हैं, और यही सबसे अधिक छोड़ी जाती है। कोयला-खनन और उसके आसपास के उद्योग झारखंड, ओडिशा, छत्तीसगढ़ तथा पश्चिम बंगाल में बहुत बड़ी संख्या को सीधे रोज़गार देते और कहीं अधिक को परोक्ष रूप से सँभालते हैं — ठीक वही राज्य जो पहले से भारत के सबसे निर्धनों में हैं। वहाँ की राज्य सरकारें कोयला रॉयल्टी से पर्याप्त राजस्व लेती हैं। जो संक्रमण बस खदानें बंद कर दे वह एक राष्ट्रीय तथा वैश्विक लाभ की लागत उन्हीं ज़िलों पर सरका देता है जो उसे सबसे कम सह सकते हैं, जो अन्यायपूर्ण भी है और व्यावहारिक रूप से ऐसे राजनीतिक प्रतिरोध की गारंटी भी जो नीति को अटका देगा। अतः ईमानदार संक्रमण घोषित नहीं, रचा जाना चाहिए। उसे भंडारण तथा ग्रिड में निवेश चाहिए ताकि नवीकरणीय आपूर्ति पक्की हो सके; सबसे पुराने और गंदे संयंत्रों की सेवानिवृत्ति की प्रकाशित समय-सारणी ताकि उद्योग चौंके नहीं बल्कि योजना बना सके; पैनल, बैटरी और टरबाइन के घरेलू निर्माण को समर्थन ताकि बदलाव रोज़गार आयात करने के बजाय पैदा करे; और — अनिवार्यतः — कोयला-क्षेत्रों के लिए समझौता: पुनर्प्रशिक्षण, वैकल्पिक उद्योग, और नई ऊर्जा में हो रहे निवेश का एक हिस्सा उन ज़िलों की ओर मोड़ना जो पुरानी खो रहे हैं। एक और बात कहने योग्य है, क्योंकि वह ढाँचा बदल देती है। बिजली की सबसे सस्ती इकाई सदा वही है जो खपाई ही न जाए: कुशल मोटरें, बेहतर भवन-रचना, एलईडी प्रकाश और घटी संचरण-हानियाँ माँग को किसी भी नए उत्पादन की लागत के अंश पर काट देती हैं। और भारत के पास अंतरराष्ट्रीय रूप से रखने को समता का तर्क है — उसका प्रति व्यक्ति उत्सर्जन उन देशों से कहीं नीचे है जिन्होंने धनी होते हुए सबसे अधिक कार्बन जलाया — फिर भी संक्रमण करने में उसका हित है, क्योंकि जो ताप, सूखा और बाढ़ें आती हैं उनके सामने वह सबसे उजागर देशों में है। निष्कर्ष यह नहीं कि कोयले का बचाव हो या सौर एक कल्पना है, बल्कि यह कि ईंधन-बदलाव ख़रीद नहीं बल्कि एक सामाजिक तथा औद्योगिक परियोजना है, और जो देश उसे सँभाल लेंगे वे वही होंगे जिन्होंने हारने वालों के लिए उतनी ही सावधानी से योजना बनाई जितनी तकनीक के लिए। (ग़लत उत्तर काम करते सौर उत्पादन को नकारते, कोयले को नवीकरणीय बताते, या दावा करते कि ऊर्जा-संक्रमण कभी होते ही नहीं — जिसका खंडन दर्ज इतिहास के भीतर लकड़ी से कोयले और कोयले से तेल तक का बदलाव करता है।)",
          mr: "मंदपणा अंकगणिताचे अपयश नाही — प्रति निर्मित एकक सौर वीज आता स्वस्त आहे — तर अंकगणित जे वगळते त्या सर्वांचे. तीन अडथळे महत्त्वाचे, आणि त्यांतील फक्त एक तांत्रिक. पहिला खंडितपणा. कोळसा-प्रकल्प मागणीनुसार स्थिर उत्पादन देतो; सूर्य प्रत्येक संध्याकाळी मावळतो आणि मान्सूनच्या ढगांमागे आठवडे नाहीसा होतो, आणि वारा देशाला वीज कधी हवी याची पर्वा न करता चढतो-उतरतो. ग्रिडला पुरवठा आणि मागणी सेकंदागणिक जुळवावी लागते, आणि संध्याकाळचे शिखर — जेव्हा घरातील दिवे आणि स्वयंपाक एकत्र येतात — नेमके तेव्हा येते जेव्हा सौर उत्पादन संपत असते. म्हणून सौर उत्पादन कोळसा-क्षमतेला मेगावॅट-दर-मेगावॅट फक्त बदलू शकत नाही; त्याला साठवण लागते, वा राखीव म्हणून तयार ठेवलेले जल व वायू प्रकल्प, वा इतके मोठे ग्रिड की सूर्यप्रकाशित प्रदेशातून अतिरिक्त ढगाळ प्रदेशात नेता येईल. तीच भर तुलना प्रामाणिक करते, आणि तिची किंमत प्रति एकक मथळा-किमतीत नसते. दुसरा अडथळा गाडलेली पायाभूत रचना. भारताची वीज-यंत्रणा सत्तर वर्षांत कोळशाभोवती बांधली: स्वतः वीजकेंद्रे, ज्यांचे दशकांचे रचना-आयुष्य शिल्लक; त्यांना पुरवणाऱ्या खाणी; रेल्वे, जिचे कोळसा-भाडे प्रवासी भाड्यांना अनुदान देते; आणि ते संक्रमण-जाळे जे पूर्वेच्या कोळसा-क्षेत्रांतून वापर करणाऱ्या पश्चिम व दक्षिणेकडे वीज न्यायला अंथरले. इंधन बदलणे म्हणजे यंत्रणा पुन्हा बांधणे, आणि यंत्रणांत ती जडता असते जी एकट्या तंत्रज्ञानांत नसते. तिसरा अडथळा माणसे, आणि तोच सर्वाधिक वगळला जातो. कोळसा खाणकाम आणि त्याभोवतीचे उद्योग झारखंड, ओडिशा, छत्तीसगड आणि पश्चिम बंगालमध्ये खूप मोठ्या संख्येला थेट रोजगार देतात आणि कितीतरी अधिकांना अप्रत्यक्ष सांभाळतात — नेमकी तीच राज्ये जी आधीच भारतातील सर्वांत गरिबांत आहेत. तिथली राज्य सरकारे कोळसा स्वामित्वशुल्कातून बराच महसूल घेतात. जे संक्रमण फक्त खाणी बंद करते ते एका राष्ट्रीय व जागतिक फायद्याचा खर्च त्याच जिल्ह्यांवर सरकवते जे तो सर्वांत कमी सोसू शकतात, जे अन्याय्यही आहे आणि व्यावहारिकदृष्ट्या अशा राजकीय प्रतिकाराची हमीही जो धोरण अडवेल. म्हणून प्रामाणिक संक्रमण जाहीर नव्हे तर रचावे लागते. त्याला साठवण व ग्रिडमध्ये गुंतवणूक लागते जेणेकरून नवीकरणीय पुरवठा पक्का होईल; सर्वांत जुन्या आणि घाण प्रकल्पांच्या निवृत्तीचे प्रकाशित वेळापत्रक जेणेकरून उद्योग चकित होण्याऐवजी नियोजन करू शकेल; पॅनेल, बॅटरी आणि टर्बाइनच्या देशी उत्पादनाला पाठिंबा जेणेकरून बदल रोजगार आयात करण्याऐवजी निर्माण करेल; आणि — अपरिहार्यपणे — कोळसा-प्रदेशांसाठी तडजोड: पुनर्प्रशिक्षण, पर्यायी उद्योग, आणि नव्या ऊर्जेतील गुंतवणुकीचा एक भाग जुनी गमावणाऱ्या जिल्ह्यांकडे वळवणे. आणखी एक सांगण्याजोगा मुद्दा, कारण तो मांडणी बदलतो. विजेचे सर्वांत स्वस्त एकक सदैव तेच जे वापरलेच जात नाही: कार्यक्षम मोटारी, चांगली इमारत-रचना, एलईडी प्रकाश आणि घटलेल्या संक्रमण-हानी मागणी कोणत्याही नव्या निर्मितीच्या खर्चाच्या अंशावर कापतात. आणि भारताकडे आंतरराष्ट्रीय पातळीवर मांडायला समतेचा युक्तिवाद आहे — त्याचे दरडोई उत्सर्जन ज्या देशांनी श्रीमंत होताना सर्वाधिक कार्बन जाळला त्यांच्याहून कितीतरी खाली — तरीही संक्रमण करण्यात त्याचे हित आहे, कारण जी उष्णता, दुष्काळ आणि पूर येतात त्यांसमोर तो सर्वाधिक उघड्या देशांपैकी. निष्कर्ष हा नाही की कोळशाचा बचाव करावा वा सौर ही कल्पना आहे, तर हा की इंधन-बदल ही खरेदी नव्हे तर सामाजिक व औद्योगिक प्रकल्प आहे, आणि जे देश तो सांभाळतील ते तेच असतील ज्यांनी हरणाऱ्यांसाठी तंत्रज्ञानाइतक्याच काळजीने नियोजन केले. (चुकीची उत्तरे चालणारी सौर निर्मिती नाकारतात, कोळशाला नवीकरणीय ठरवतात, वा ऊर्जा-संक्रमणे कधी होतच नाहीत असा दावा करतात — ज्याचे खंडन नोंदल्या इतिहासातील लाकडापासून कोळसा आणि कोळशापासून तेलापर्यंतचा बदल करतो.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Manufacturing Industries                                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-manufacturing",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 6 — Manufacturing Industries",
      hi: "अध्याय 6 — विनिर्माण उद्योग",
      mr: "प्रकरण 6 — निर्मिती उद्योग",
    },
    name: {
      en: "Manufacturing Industries",
      hi: "विनिर्माण उद्योग",
      mr: "निर्मिती उद्योग",
    },
    summary: {
      en: "Raw material turned into something worth more: why a country that only grows and digs stays poor, a mill that must stand in the cane field, the industry every other industry is built out of, factories owned by the state because nobody else would build them — and the four kinds of waste a town downstream inherits.",
      hi: "कच्चा माल किसी अधिक मूल्यवान चीज़ में बदला: जो देश केवल उगाता और खोदता है वह निर्धन क्यों रहता, वह मिल जिसे गन्ने के खेत में ही खड़ा होना है, वह उद्योग जिससे बाक़ी हर उद्योग बना है, वे कारख़ाने जो राज्य के इसलिए कि और कोई बनाता ही नहीं — और नीचे का क़स्बा जिन चार तरह के कचरों का उत्तराधिकारी बनता है।",
      mr: "कच्चा माल अधिक मोलाच्या कशात तरी बदललेला: जो देश फक्त पिकवतो आणि खणतो तो गरीब का राहतो, ती गिरणी जिला उसाच्या शेतातच उभे राहावे लागते, तो उद्योग ज्यातून बाकी प्रत्येक उद्योग बनला आहे, ते कारखाने जे राज्याचे कारण दुसरे कोणी बांधतच नाही — आणि खालचे गाव ज्या चार प्रकारच्या कचऱ्याचा वारस बनते.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "importance-of-manufacturing",
        name: {
          en: "The importance of manufacturing",
          hi: "विनिर्माण का महत्व",
          mr: "निर्मितीचे महत्त्व",
        },
        kind: "idea",
        prompt: {
          en: "Cotton sold as bales earns a little; the same cotton sold as shirts earns many times more, and employs spinners, weavers, dyers and tailors in between. Which activity adds that value and is treated as the backbone of development?",
          hi: "गाँठों में बिका कपास थोड़ा कमाता है; वही कपास कमीज़ों में बिककर कई गुना अधिक कमाता है, और बीच में कातने, बुनने, रँगने तथा सिलने वालों को रोज़गार देता है। कौन-सी गतिविधि वह मूल्य जोड़ती है और विकास की रीढ़ मानी जाती है?",
          mr: "गाठींत विकलेला कापूस थोडे कमावतो; तोच कापूस शर्टांत विकून कैकपट अधिक कमावतो, आणि मध्ये कातणारे, विणणारे, रंगवणारे व शिवणारे यांना रोजगार देतो. कोणती क्रिया ते मूल्य जोडते आणि विकासाचा कणा मानली जाते?",
        },
        statement: {
          en: "Manufacturing is the processing of raw materials into more valuable goods, and it is regarded as the backbone of development because it adds value, creates employment beyond farming and reduces dependence on imports.",
          hi: "विनिर्माण कच्चे माल का अधिक मूल्यवान वस्तुओं में प्रसंस्करण है, और उसे विकास की रीढ़ माना जाता है क्योंकि वह मूल्य जोड़ता है, खेती से परे रोज़गार रचता है और आयात पर निर्भरता घटाता है।",
          mr: "निर्मिती म्हणजे कच्च्या मालाचे अधिक मोलाच्या वस्तूंत रूपांतर, आणि तिला विकासाचा कणा मानले जाते कारण ती मूल्य जोडते, शेतीपलीकडे रोजगार निर्माण करते आणि आयातीवरील अवलंबित्व घटवते.",
        },
        detail: {
          en: "It also pulls agriculture up with it, because a farmer who can sell to a nearby mill gets a market that does not vanish when the local harvest is good.",
          hi: "यह कृषि को भी अपने साथ ऊपर खींचता है, क्योंकि जो किसान पास की मिल को बेच सकता है उसे ऐसा बाज़ार मिलता है जो स्थानीय फ़सल अच्छी होने पर ग़ायब नहीं होता।",
          mr: "ती शेतीलाही आपल्यासोबत वर ओढते, कारण जो शेतकरी जवळच्या गिरणीला विकू शकतो त्याला असा बाजार मिळतो जो स्थानिक पीक चांगले आल्यावर नाहीसा होत नाही.",
        },
        extra: {
          en: "A country that exports only ore and grain sells the cheapest stage of every chain, which is exactly why industrialisation was made a national goal after 1947.",
          hi: "जो देश केवल अयस्क और अनाज निर्यात करता है वह हर शृंखला का सबसे सस्ता चरण बेचता है, ठीक इसीलिए 1947 के बाद औद्योगीकरण राष्ट्रीय लक्ष्य बनाया गया।",
          mr: "जो देश फक्त धातुक आणि धान्य निर्यात करतो तो प्रत्येक साखळीचा सर्वांत स्वस्त टप्पा विकतो, नेमके म्हणूनच 1947 नंतर औद्योगीकरण राष्ट्रीय ध्येय बनवले गेले.",
        },
        pair: {
          left: {
            en: "Raw material turned into something worth more",
            hi: "कच्चा माल अधिक मूल्यवान वस्तु में बदला",
            mr: "कच्चा माल अधिक मोलाच्या वस्तूत बदललेला",
          },
          right: {
            en: "the importance of manufacturing",
            hi: "विनिर्माण का महत्व",
            mr: "निर्मितीचे महत्त्व",
          },
        },
      },
      {
        id: "sugar-industry",
        name: {
          en: "The sugar industry",
          hi: "चीनी उद्योग",
          mr: "साखर उद्योग",
        },
        kind: "industry",
        prompt: {
          en: "Its raw material is bulky, loses its sucrose within a day of cutting and cannot be stored, so the mill must stand among the fields rather than near the buyers. Which agro-based industry is this?",
          hi: "उसका कच्चा माल भारी-भरकम है, कटने के एक दिन में अपनी शर्करा खो देता है और भंडारित नहीं किया जा सकता, अतः मिल को ख़रीदारों के पास नहीं बल्कि खेतों के बीच खड़ा होना पड़ता है। यह कौन-सा कृषि-आधारित उद्योग है?",
          mr: "त्याचा कच्चा माल अवजड, कापल्यानंतर एका दिवसात आपली साखर गमावतो आणि साठवता येत नाही, म्हणून गिरणीला खरेदीदारांजवळ नव्हे तर शेतांमध्ये उभे राहावे लागते. हा कोणता कृषी-आधारित उद्योग?",
        },
        statement: {
          en: "The sugar industry is an agro-based industry sited in the cane-growing tracts themselves, because sugarcane is heavy to move and starts losing sucrose within hours of being cut.",
          hi: "चीनी उद्योग कृषि-आधारित उद्योग है जो स्वयं गन्ना उगाती पट्टियों में स्थित है, क्योंकि गन्ना ढोने में भारी है और कटने के घंटों में शर्करा खोने लगता है।",
          mr: "साखर उद्योग हा कृषी-आधारित उद्योग जो स्वतः ऊस पिकवणाऱ्या पट्ट्यांत वसलेला, कारण ऊस वाहायला जड आणि कापल्यानंतर तासांत साखर गमावू लागतो.",
        },
        detail: {
          en: "It is seasonal, running only through the crushing months, so mills must find other work for staff and machinery for half the year.",
          hi: "यह मौसमी है, केवल पेराई के महीनों चलता है, अतः मिलों को आधे वर्ष कर्मचारियों और मशीनरी के लिए दूसरा काम खोजना पड़ता है।",
          mr: "तो हंगामी, फक्त गाळप महिन्यांत चालतो, म्हणून गिरण्यांना अर्धे वर्ष कर्मचारी व यंत्रसामग्रीसाठी दुसरे काम शोधावे लागते.",
        },
        extra: {
          en: "Its by-products are worth as much as attention: molasses for alcohol, bagasse burnt to run the mill itself, and press mud returned to the fields as manure.",
          hi: "उसके उप-उत्पाद उतने ही ध्यान योग्य हैं: शराब के लिए शीरा, स्वयं मिल चलाने को जलाई खोई, और खाद के रूप में खेतों को लौटाया प्रेस-मड।",
          mr: "त्याचे उपपदार्थ तितकेच लक्ष देण्याजोगे: मद्यासाठी मळी, स्वतः गिरणी चालवायला जाळलेली चिपाडे, आणि खत म्हणून शेतांना परत केलेला प्रेस-मड.",
        },
        pair: {
          left: {
            en: "A mill that must stand in the cane field",
            hi: "वह मिल जिसे गन्ने के खेत में खड़ा होना है",
            mr: "ती गिरणी जिला उसाच्या शेतात उभे राहावे लागते",
          },
          right: {
            en: "the sugar industry",
            hi: "चीनी उद्योग",
            mr: "साखर उद्योग",
          },
        },
      },
      {
        id: "iron-steel-industry",
        name: {
          en: "The iron and steel industry",
          hi: "लोहा और इस्पात उद्योग",
          mr: "लोखंड आणि पोलाद उद्योग",
        },
        kind: "industry",
        prompt: {
          en: "It supplies the rails, girders, machinery, ships and tools out of which every other industry is built, and its plants stand at Bhilai, Rourkela, Durgapur, Bokaro and Vishakhapatnam. Which basic industry is this?",
          hi: "यह वे रेल-पटरियाँ, गर्डर, मशीनरी, जहाज़ और औज़ार देता है जिनसे बाक़ी हर उद्योग बना है, और उसके संयंत्र भिलाई, राउरकेला, दुर्गापुर, बोकारो तथा विशाखापत्तनम में खड़े हैं। यह कौन-सा आधारभूत उद्योग है?",
          mr: "तो त्या रेल्वेरुळ, तुळया, यंत्रसामग्री, जहाजे आणि अवजारे पुरवतो ज्यांतून बाकी प्रत्येक उद्योग बांधला आहे, आणि त्याचे प्रकल्प भिलाई, राउरकेला, दुर्गापूर, बोकारो व विशाखापट्टणम येथे उभे. हा कोणता पायाभूत उद्योग?",
        },
        statement: {
          en: "The iron and steel industry is a basic industry whose product every other manufacturing industry depends on, and its integrated plants are concentrated in the Chotanagpur and Odisha–Chhattisgarh belt near ore, coal and water.",
          hi: "लोहा और इस्पात उद्योग एक आधारभूत उद्योग है जिसके उत्पाद पर बाक़ी हर विनिर्माण उद्योग निर्भर है, और उसके एकीकृत संयंत्र अयस्क, कोयले तथा पानी के पास छोटानागपुर और ओडिशा–छत्तीसगढ़ पट्टी में केंद्रित हैं।",
          mr: "लोखंड आणि पोलाद उद्योग हा पायाभूत उद्योग ज्याच्या उत्पादनावर बाकी प्रत्येक निर्मिती उद्योग अवलंबून, आणि त्याचे एकात्मिक प्रकल्प धातुक, कोळसा व पाण्याजवळ छोटानागपूर आणि ओडिशा–छत्तीसगड पट्ट्यात केंद्रित.",
        },
        detail: {
          en: "It needs iron ore, coking coal and limestone in roughly the ratio 4:2:1, and enormous quantities of water for cooling.",
          hi: "उसे लौह अयस्क, कोकिंग कोयला और चूना-पत्थर लगभग 4:2:1 के अनुपात में चाहिए, और ठंडा करने को विशाल मात्रा में पानी।",
          mr: "त्याला लोहधातुक, कोकिंग कोळसा आणि चुनखडी सुमारे 4:2:1 प्रमाणात लागतात, आणि थंड करण्यासाठी प्रचंड प्रमाणात पाणी.",
        },
        extra: {
          en: "India is among the world's largest crude-steel producers yet its consumption per person stays low, which is itself a measure of how much building is still to come.",
          hi: "भारत विश्व के सबसे बड़े कच्चा-इस्पात उत्पादकों में है फिर भी उसकी प्रति व्यक्ति खपत कम बनी हुई है, और यही इस बात का माप है कि अभी कितना निर्माण होना बाक़ी है।",
          mr: "भारत जगातील सर्वांत मोठ्या कच्चे-पोलाद उत्पादकांपैकी तरीही त्याचा दरडोई वापर कमी राहतो, आणि हेच किती बांधकाम अजून व्हायचे आहे याचे माप.",
        },
        pair: {
          left: {
            en: "The industry every other industry is built from",
            hi: "वह उद्योग जिससे बाक़ी हर उद्योग बना है",
            mr: "तो उद्योग ज्यातून बाकी प्रत्येक उद्योग बांधला",
          },
          right: {
            en: "the iron and steel industry",
            hi: "लोहा और इस्पात उद्योग",
            mr: "लोखंड आणि पोलाद उद्योग",
          },
        },
      },
      {
        id: "automobile-industry",
        name: {
          en: "The automobile industry",
          hi: "मोटरगाड़ी उद्योग",
          mr: "वाहन उद्योग",
        },
        kind: "industry",
        prompt: {
          en: "It assembles thousands of parts from hundreds of suppliers into trucks, cars, scooters and three-wheelers, and clusters around Chennai, Pune, Gurugram and Jamshedpur. Which industry is this?",
          hi: "यह सैकड़ों आपूर्तिकर्ताओं के हज़ारों पुर्ज़े जोड़कर ट्रक, कार, स्कूटर और तिपहिया बनाता है, और चेन्नई, पुणे, गुरुग्राम तथा जमशेदपुर के आसपास गुच्छित है। यह कौन-सा उद्योग है?",
          mr: "तो शेकडो पुरवठादारांचे हजारो भाग जोडून ट्रक, मोटारी, स्कूटर आणि तीनचाकी बनवतो, आणि चेन्नई, पुणे, गुरुग्राम व जमशेदपूरभोवती गुच्छित. हा कोणता उद्योग?",
        },
        statement: {
          en: "The automobile industry assembles vehicles from thousands of components made by supplier firms, and it clusters in a few centres because assembly plants and their suppliers must sit close together.",
          hi: "मोटरगाड़ी उद्योग आपूर्तिकर्ता फ़र्मों द्वारा बने हज़ारों घटकों से वाहन जोड़ता है, और कुछ ही केंद्रों में गुच्छित होता है क्योंकि असेंबली संयंत्र और उनके आपूर्तिकर्ता पास-पास बैठने चाहिए।",
          mr: "वाहन उद्योग पुरवठादार कंपन्यांनी बनवलेल्या हजारो घटकांतून वाहने जोडतो, आणि काही मोजक्या केंद्रांत गुच्छित होतो कारण जुळणी प्रकल्प आणि त्यांचे पुरवठादार जवळजवळ बसावे लागतात.",
        },
        detail: {
          en: "One assembly plant supports a large ring of small workshops making bearings, seats, wiring and glass, so a single factory creates far more jobs outside its own gate than inside it.",
          hi: "एक असेंबली संयंत्र बेयरिंग, सीट, वायरिंग और काँच बनाती छोटी कार्यशालाओं का बड़ा घेरा सँभालता है, अतः एक ही कारख़ाना अपने फाटक के भीतर से कहीं अधिक रोज़गार बाहर रचता है।",
          mr: "एक जुळणी प्रकल्प बेअरिंग, आसने, वायरिंग आणि काच बनवणाऱ्या लहान कार्यशाळांचे मोठे कडे सांभाळतो, म्हणून एकच कारखाना आपल्या फाटकाच्या आतल्याहून कितीतरी अधिक रोजगार बाहेर निर्माण करतो.",
        },
        extra: {
          en: "Demand for it is unusually sensitive to interest rates and fuel prices, so the industry runs hot and cold with the wider economy.",
          hi: "उसकी माँग ब्याज दरों और ईंधन क़ीमतों के प्रति असामान्य रूप से संवेदनशील है, अतः यह उद्योग व्यापक अर्थव्यवस्था के साथ गरम-ठंडा होता रहता है।",
          mr: "त्याची मागणी व्याजदर आणि इंधन किमतींना असामान्यपणे संवेदनशील, म्हणून हा उद्योग व्यापक अर्थव्यवस्थेसोबत तापतो-थंडावतो.",
        },
        pair: {
          left: {
            en: "Thousands of parts assembled in a few clusters",
            hi: "कुछ ही गुच्छों में जुड़ते हज़ारों पुर्ज़े",
            mr: "काही मोजक्या गुच्छांत जुळणारे हजारो भाग",
          },
          right: {
            en: "the automobile industry",
            hi: "मोटरगाड़ी उद्योग",
            mr: "वाहन उद्योग",
          },
        },
      },
      {
        id: "public-private-sector",
        name: {
          en: "Public and private sector industries",
          hi: "सार्वजनिक और निजी क्षेत्र के उद्योग",
          mr: "सार्वजनिक आणि खासगी क्षेत्रातील उद्योग",
        },
        kind: "idea",
        prompt: {
          en: "SAIL and BHEL are owned and run by the government; Tata Steel and Bajaj by individuals and shareholders; and some firms, like Oil India, are jointly held by both. Which classification is this?",
          hi: "सेल और भेल सरकार के स्वामित्व में चलते हैं; टाटा स्टील और बजाज व्यक्तियों तथा शेयरधारकों के; और कुछ फ़र्में, जैसे ऑयल इंडिया, दोनों के संयुक्त स्वामित्व में हैं। यह कौन-सा वर्गीकरण है?",
          mr: "सेल आणि भेल सरकारच्या मालकीचे व चालवलेले; टाटा स्टील आणि बजाज व्यक्ती व भागधारकांचे; आणि काही कंपन्या, जसे ऑइल इंडिया, दोघांच्या संयुक्त मालकीच्या. हे कोणते वर्गीकरण?",
        },
        statement: {
          en: "Industries are classified by ownership into public sector, owned and operated by the government; private sector, owned by individuals or companies; joint sector, held by both together; and cooperative sector, owned by the producers themselves.",
          hi: "उद्योग स्वामित्व से वर्गीकृत होते हैं — सार्वजनिक क्षेत्र, जो सरकार का और उसी से संचालित; निजी क्षेत्र, जो व्यक्तियों या कंपनियों का; संयुक्त क्षेत्र, जो दोनों का साथ; और सहकारी क्षेत्र, जो स्वयं उत्पादकों का।",
          mr: "उद्योग मालकीनुसार वर्गीकृत होतात — सार्वजनिक क्षेत्र, जे सरकारचे व त्यानेच चालवलेले; खासगी क्षेत्र, जे व्यक्ती वा कंपन्यांचे; संयुक्त क्षेत्र, जे दोघांचे मिळून; आणि सहकारी क्षेत्र, जे स्वतः उत्पादकांचे.",
        },
        detail: {
          en: "The cooperative form matters in agro-based industry: Maharashtra's sugar mills and Gujarat's dairies are owned by the farmers who supply them.",
          hi: "सहकारी रूप कृषि-आधारित उद्योग में मायने रखता है: महाराष्ट्र की चीनी मिलें और गुजरात की डेयरियाँ उन्हीं किसानों की हैं जो उन्हें आपूर्ति करते हैं।",
          mr: "सहकारी रूप कृषी-आधारित उद्योगात महत्त्वाचे: महाराष्ट्राच्या साखर कारखान्यांची आणि गुजरातच्या दुग्धशाळांची मालकी त्यांना पुरवठा करणाऱ्या शेतकऱ्यांचीच.",
        },
        extra: {
          en: "The public sector was built where returns came slowly or not at all — steel, heavy machinery, defence — and where a backward region needed a factory more than a shareholder needed a dividend.",
          hi: "सार्वजनिक क्षेत्र वहाँ बना जहाँ प्रतिफल धीरे आता था या आता ही नहीं — इस्पात, भारी मशीनरी, रक्षा — और जहाँ किसी पिछड़े क्षेत्र को कारख़ाना उससे अधिक चाहिए था जितना शेयरधारक को लाभांश।",
          mr: "सार्वजनिक क्षेत्र तिथे उभे राहिले जिथे परतावा हळू येई वा येईच ना — पोलाद, अवजड यंत्रसामग्री, संरक्षण — आणि जिथे एखाद्या मागास प्रदेशाला कारखाना भागधारकाला लाभांशाहून अधिक हवा होता.",
        },
        pair: {
          left: {
            en: "Sorted by who owns the factory",
            hi: "कारख़ाने का स्वामी कौन, इससे छाँटे गए",
            mr: "कारखान्याचा मालक कोण यावरून विभागलेले",
          },
          right: {
            en: "public and private sector industries",
            hi: "सार्वजनिक और निजी क्षेत्र के उद्योग",
            mr: "सार्वजनिक आणि खासगी क्षेत्रातील उद्योग",
          },
        },
      },
      {
        id: "industrial-pollution",
        name: {
          en: "Industrial pollution",
          hi: "औद्योगिक प्रदूषण",
          mr: "औद्योगिक प्रदूषण",
        },
        kind: "process",
        prompt: {
          en: "Smoke and gases into the air, untreated effluent into the river, slag and fly ash on the land, and the constant din of generators and machinery — four kinds of damage from one source. What is this called?",
          hi: "हवा में धुआँ और गैसें, नदी में बिना शोधित बहिःस्राव, ज़मीन पर धातुमल तथा फ़्लाई ऐश, और जनित्रों-मशीनों का लगातार शोर — एक ही स्रोत से चार तरह की हानि। इसे क्या कहते हैं?",
          mr: "हवेत धूर आणि वायू, नदीत प्रक्रियाविना स्राव, जमिनीवर मळी व राख, आणि जनित्रे-यंत्रांचा सततचा गोंगाट — एकाच स्रोतापासून चार प्रकारची हानी. याला काय म्हणतात?",
        },
        statement: {
          en: "Industrial pollution damages air, water, land and the acoustic environment at once — through smoke and gases, untreated effluent, solid waste dumping, and the noise of machinery and generators.",
          hi: "औद्योगिक प्रदूषण एक साथ वायु, जल, भूमि तथा ध्वनि-परिवेश को हानि पहुँचाता है — धुएँ और गैसों, बिना शोधित बहिःस्राव, ठोस कचरे की डंपिंग, तथा मशीनरी और जनित्रों के शोर से।",
          mr: "औद्योगिक प्रदूषण एकाच वेळी हवा, पाणी, जमीन आणि ध्वनी-परिसराला हानी करते — धूर व वायू, प्रक्रियाविना स्राव, घनकचऱ्याचे ओतणे, आणि यंत्रसामग्री व जनित्रांच्या गोंगाटातून.",
        },
        detail: {
          en: "Thermal pollution is the least visible of these: water drawn for cooling is returned hot, and the temperature change alone kills river life.",
          hi: "तापीय प्रदूषण इनमें सबसे कम दिखता है: ठंडा करने को लिया पानी गरम लौटाया जाता है, और केवल ताप-परिवर्तन ही नदी का जीवन मार देता है।",
          mr: "औष्णिक प्रदूषण यांतील सर्वांत कमी दिसणारे: थंड करण्यासाठी घेतलेले पाणी गरम परत केले जाते, आणि केवळ तापमान-बदलच नदीचे जीवन मारतो.",
        },
        extra: {
          en: "The remedies are known and largely mechanical — treating effluent before discharge, scrubbers and electrostatic precipitators on chimneys, reusing water, and shared treatment plants for small units too small to build their own.",
          hi: "उपाय ज्ञात और अधिकांशतः यांत्रिक हैं — छोड़ने से पहले बहिःस्राव का शोधन, चिमनियों पर स्क्रबर तथा स्थिर-वैद्युत अवक्षेपक, पानी का पुनरुपयोग, और उन छोटी इकाइयों के लिए साझा शोधन संयंत्र जो अपना बनाने को बहुत छोटी हैं।",
          mr: "उपाय ज्ञात आणि बहुतांश यांत्रिक — सोडण्यापूर्वी स्रावावर प्रक्रिया, धुराड्यांवर स्क्रबर व स्थिरविद्युत अवक्षेपक, पाण्याचा पुनर्वापर, आणि स्वतःचे बांधण्याइतक्या लहान असलेल्या एककांसाठी सामायिक प्रक्रिया प्रकल्प.",
        },
        pair: {
          left: {
            en: "Air, water, land and noise from one chimney",
            hi: "एक ही चिमनी से वायु, जल, भूमि और ध्वनि",
            mr: "एकाच धुराड्यातून हवा, पाणी, जमीन आणि गोंगाट",
          },
          right: {
            en: "industrial pollution",
            hi: "औद्योगिक प्रदूषण",
            mr: "औद्योगिक प्रदूषण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Uttar Pradesh and Bihar were once the centre of Indian sugar production, but the industry has shifted steadily southwards to Maharashtra, Karnataka and Tamil Nadu. Explain the physical and organisational reasons for the move.",
          hi: "उत्तर प्रदेश और बिहार कभी भारतीय चीनी उत्पादन के केंद्र थे, पर उद्योग लगातार दक्षिण की ओर महाराष्ट्र, कर्नाटक तथा तमिलनाडु खिसकता गया है। इस स्थानांतरण के भौतिक तथा संगठनात्मक कारण समझाओ।",
          mr: "उत्तर प्रदेश आणि बिहार एकेकाळी भारतीय साखर उत्पादनाचे केंद्र होते, पण उद्योग सतत दक्षिणेकडे महाराष्ट्र, कर्नाटक व तमिळनाडूकडे सरकत गेला आहे. या स्थलांतराची भौतिक व संघटनात्मक कारणे समजावा.",
        },
        choices: [
          {
            en: "The southern cane has higher sucrose content, the cooler and longer crushing season there lets a mill run more months of the year, and the tropical climate raises yield per hectare. Organisationally, most southern mills are cooperatives owned by the growers themselves, so the farmer shares the mill's profit and has a reason to deliver cane promptly — which matters because cane starts losing sucrose within hours of cutting",
            hi: "दक्षिण के गन्ने में शर्करा-अंश अधिक है, वहाँ की ठंडी और लंबी पेराई-ऋतु मिल को वर्ष के अधिक महीने चलने देती है, और उष्णकटिबंधीय जलवायु प्रति हेक्टेयर उपज बढ़ाती है। संगठनात्मक रूप से, अधिकांश दक्षिणी मिलें स्वयं उत्पादकों के स्वामित्व वाली सहकारी हैं, अतः किसान मिल के लाभ में हिस्सेदार है और उसके पास गन्ना तुरंत पहुँचाने का कारण — जो मायने रखता है क्योंकि गन्ना कटने के घंटों में शर्करा खोने लगता है",
            mr: "दक्षिणेकडील उसात साखरेचा अंश अधिक, तिथला थंड आणि दीर्घ गाळप हंगाम गिरणीला वर्षाचे अधिक महिने चालू देतो, आणि उष्णकटिबंधीय हवामान प्रति हेक्टर उत्पादन वाढवते. संघटनात्मकदृष्ट्या, बहुतांश दक्षिणी कारखाने स्वतः उत्पादकांच्या मालकीचे सहकारी, म्हणून शेतकरी गिरणीच्या नफ्यात भागीदार आणि त्याच्याकडे ऊस तत्काळ पोहोचवण्याचे कारण — जे महत्त्वाचे कारण ऊस कापल्यानंतर तासांत साखर गमावू लागतो",
          },
          {
            en: "Because sugarcane cannot be grown north of the Vindhyas at all, so the northern mills had no raw material",
            hi: "क्योंकि विंध्य के उत्तर गन्ना उगाया ही नहीं जा सकता, अतः उत्तरी मिलों के पास कच्चा माल था ही नहीं",
            mr: "कारण विंध्याच्या उत्तरेला ऊस पिकवताच येत नाही, म्हणून उत्तरेकडील गिरण्यांकडे कच्चा मालच नव्हता",
          },
          {
            en: "Because sugar keeps better in southern warehouses, and storage rather than production determined the shift",
            hi: "क्योंकि चीनी दक्षिणी गोदामों में बेहतर टिकती है, और उत्पादन नहीं भंडारण ने स्थानांतरण तय किया",
            mr: "कारण साखर दक्षिणी गोदामांत अधिक चांगली टिकते, आणि उत्पादन नव्हे तर साठवणीने स्थलांतर ठरवले",
          },
          {
            en: "Because the shift never happened; Uttar Pradesh remains the only sugar-producing state in India",
            hi: "क्योंकि स्थानांतरण हुआ ही नहीं; उत्तर प्रदेश भारत का एकमात्र चीनी उत्पादक राज्य बना हुआ है",
            mr: "कारण स्थलांतर झालेच नाही; उत्तर प्रदेश हे भारतातील एकमेव साखर उत्पादक राज्य आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The shift is a textbook case of physical facts and institutional design pulling in the same direction. Start with the crop itself. Sugarcane is a bulky, low-value-per-tonne raw material, and — decisively — it begins losing sucrose the moment it is cut. Within twenty-four hours the recoverable sugar has fallen measurably; within a few days the cane is worth crushing only for fodder. This single property fixes the industry's geography: the mill must be in the cane, not near the customer, and the shorter the interval between cutting and crushing, the more sugar comes out of the same tonnage. Everything else follows from asking where cane grows best and where it can be crushed fastest. Now the physical differences. Cane grown in the peninsular tropics has a higher sucrose content than the same crop in the northern plains, so each tonne yields more sugar. Yields per hectare are higher too, given the longer growing season and better irrigation coverage in the western Maharashtra and Karnataka belts. Most importantly for mill economics, the crushing season in the south runs longer — the cooler, more even temperatures allow crushing over more months of the year. That matters enormously because a sugar mill is a large fixed investment that earns nothing when idle. A mill crushing for six months instead of four spreads the same capital cost over fifty per cent more output, and its unit cost falls accordingly. Now the organisational half, which is what turns an advantage into a durable one. Most southern mills, and Maharashtra's in particular, are cooperatives owned by the cane growers who supply them. This solves a problem that plagues the industry elsewhere. A privately owned mill and its farmers are in a straightforward conflict: the mill wants cheap cane and delayed payment; the farmer wants a high price and prompt cash. Disputes over arrears have repeatedly left northern farmers unpaid for a whole season, and an unpaid farmer plants something else next year — or delays delivery, and the sucrose is lost while the cane sits. In a cooperative, the farmer is the owner. The mill's profit is his profit, so he delivers cane promptly and at the right maturity, and the mill's surplus returns to the members instead of leaving the district. That alignment shows up directly in recovery rates and in the industry's continuing drift south. The general lesson is worth taking away: industrial location is not only about where raw material is, but about how quickly it must be processed, how many months the plant can run, and whether the people supplying it have a reason to make it work. (The wrong answers deny northern cane cultivation, substitute a warehousing story for a perishability one, or deny a shift that production figures record across decades.)",
          hi: "यह स्थानांतरण भौतिक तथ्यों और संस्थागत रचना के एक ही दिशा में खींचने का पाठ्य-उदाहरण है। स्वयं फ़सल से शुरू। गन्ना भारी-भरकम, प्रति टन कम मूल्य वाला कच्चा माल है, और — निर्णायक रूप से — कटते ही शर्करा खोने लगता है। चौबीस घंटों में निकालने योग्य चीनी मापने योग्य ढंग से गिर जाती है; कुछ दिनों में गन्ना केवल चारे के लायक़ रह जाता है। यह एक गुण उद्योग की भूगोल सधा देता है: मिल गन्ने में होनी चाहिए, ग्राहक के पास नहीं, और कटने तथा पेराई के बीच अंतराल जितना छोटा हो, उसी टनभार से उतनी अधिक चीनी निकलती है। बाक़ी सब यह पूछने से निकलता है कि गन्ना सबसे अच्छा कहाँ उगता है और सबसे तेज़ी से कहाँ पेरा जा सकता है। अब भौतिक भेद। प्रायद्वीपीय उष्णकटिबंध में उगे गन्ने में उत्तरी मैदानों की उसी फ़सल से अधिक शर्करा-अंश होता है, अतः हर टन अधिक चीनी देता है। प्रति हेक्टेयर उपज भी अधिक है, क्योंकि बढ़वार-ऋतु लंबी और पश्चिमी महाराष्ट्र तथा कर्नाटक पट्टियों में सिंचाई-कवरेज बेहतर है। मिल के अर्थशास्त्र के लिए सबसे महत्वपूर्ण यह कि दक्षिण में पेराई-ऋतु लंबी चलती है — ठंडे, अधिक समान ताप वर्ष के अधिक महीनों पेराई की छूट देते हैं। यह बहुत मायने रखता है क्योंकि चीनी मिल बड़ा स्थिर निवेश है जो ख़ाली रहने पर कुछ नहीं कमाता। चार के बजाय छह महीने पेरती मिल वही पूँजी-लागत पचास प्रतिशत अधिक उत्पादन पर फैलाती है, और उसकी प्रति इकाई लागत उसी अनुपात में गिरती है। अब संगठनात्मक आधा, जो एक लाभ को टिकाऊ बना देता है। अधिकांश दक्षिणी मिलें, और विशेषकर महाराष्ट्र की, उन्हीं गन्ना उत्पादकों की सहकारी हैं जो उन्हें आपूर्ति करते हैं। यह वह समस्या हल करता है जो अन्यत्र उद्योग को सताती है। निजी स्वामित्व वाली मिल और उसके किसान सीधे टकराव में हैं: मिल सस्ता गन्ना और देर से भुगतान चाहती है; किसान ऊँचा दाम और तुरंत नक़दी। बक़ाया के विवादों ने बार-बार उत्तरी किसानों को पूरी ऋतु का भुगतान न मिलने दिया, और जिस किसान को भुगतान न मिले वह अगले वर्ष कुछ और बोता है — या पहुँचाने में देर करता है, और गन्ना पड़े-पड़े शर्करा खो देता है। सहकारी में किसान ही स्वामी है। मिल का लाभ उसका लाभ है, अतः वह गन्ना तुरंत और ठीक पकाव पर पहुँचाता है, और मिल का अधिशेष ज़िले से बाहर जाने के बजाय सदस्यों को लौटता है। वह संरेखण सीधे रिकवरी दरों में और उद्योग के जारी दक्षिण-प्रवाह में दिखता है। साथ ले जाने योग्य सामान्य सबक़: औद्योगिक अवस्थिति केवल इस बारे में नहीं कि कच्चा माल कहाँ है, बल्कि इस बारे में भी कि उसे कितनी जल्दी संसाधित करना है, संयंत्र कितने महीने चल सकता है, और उसे आपूर्ति करते लोगों के पास उसे चलाने का कारण है या नहीं। (ग़लत उत्तर उत्तरी गन्ना-खेती को नकारते, नाशवानता की कहानी की जगह गोदाम की कहानी रखते, या उस स्थानांतरण को नकारते जिसे उत्पादन के आँकड़े दशकों से दर्ज करते हैं।)",
          mr: "हे स्थलांतर भौतिक तथ्ये आणि संस्थात्मक रचना एकाच दिशेने ओढण्याचे पाठ्य-उदाहरण. स्वतः पिकापासून सुरू. ऊस हा अवजड, प्रति टन कमी मोलाचा कच्चा माल, आणि — निर्णायकपणे — कापताच साखर गमावू लागतो. चोवीस तासांत काढण्याजोगी साखर मोजण्याजोगी घसरते; काही दिवसांत ऊस फक्त चाऱ्यापुरता उरतो. हा एक गुणधर्म उद्योगाचा भूगोल ठरवतो: गिरणी उसात असावी, ग्राहकाजवळ नव्हे, आणि कापणी व गाळपातील अंतर जितके कमी, त्याच टनभारातून तितकी अधिक साखर निघते. बाकी सर्व ऊस सर्वांत चांगला कुठे पिकतो आणि सर्वांत वेगाने कुठे गाळता येतो हे विचारण्यातून निघते. आता भौतिक फरक. द्वीपकल्पीय उष्णकटिबंधात पिकलेल्या उसात उत्तरेकडील मैदानांतील त्याच पिकाहून अधिक साखरेचा अंश, म्हणून प्रत्येक टन अधिक साखर देतो. प्रति हेक्टर उत्पादनही अधिक, कारण वाढीचा हंगाम दीर्घ आणि पश्चिम महाराष्ट्र व कर्नाटक पट्ट्यांत सिंचनाची व्याप्ती चांगली. गिरणीच्या अर्थशास्त्रासाठी सर्वांत महत्त्वाचे हे की दक्षिणेत गाळप हंगाम अधिक काळ चालतो — थंड, अधिक समान तापमान वर्षाच्या अधिक महिन्यांत गाळपाची मुभा देतात. हे प्रचंड महत्त्वाचे कारण साखर कारखाना ही मोठी स्थिर गुंतवणूक जी रिकामी असताना काहीच कमावत नाही. चारऐवजी सहा महिने गाळणारी गिरणी तीच भांडवली किंमत पन्नास टक्के अधिक उत्पादनावर पसरवते, आणि तिची प्रति एकक किंमत त्या प्रमाणात घसरते. आता संघटनात्मक अर्धा भाग, जो एका फायद्याला टिकाऊ करतो. बहुतांश दक्षिणी कारखाने, आणि विशेषतः महाराष्ट्रातील, त्यांना पुरवठा करणाऱ्या ऊस उत्पादकांचेच सहकारी. हे ती समस्या सोडवते जी इतरत्र उद्योगाला छळते. खासगी मालकीची गिरणी आणि तिचे शेतकरी थेट संघर्षात: गिरणीला स्वस्त ऊस आणि उशिरा भरणा हवा; शेतकऱ्याला जास्त भाव आणि तत्काळ रोख. थकबाकीच्या वादांनी वारंवार उत्तरेकडील शेतकऱ्यांना अख्ख्या हंगामाचा भरणा मिळू दिला नाही, आणि ज्या शेतकऱ्याला पैसे मिळत नाहीत तो पुढच्या वर्षी दुसरे काही पेरतो — वा पोहोचवायला उशीर करतो, आणि ऊस पडून राहताना साखर हरवते. सहकारीत शेतकरीच मालक. गिरणीचा नफा त्याचाच नफा, म्हणून तो ऊस तत्काळ आणि योग्य पक्वतेवर पोहोचवतो, आणि गिरणीचा अतिरिक्त जिल्ह्याबाहेर जाण्याऐवजी सभासदांना परततो. ते संरेखन थेट साखर-उताऱ्याच्या दरांत आणि उद्योगाच्या चालू दक्षिण-प्रवाहात दिसते. सोबत न्यायचा सामान्य धडा: औद्योगिक स्थान केवळ कच्चा माल कुठे आहे याबद्दल नाही, तर त्यावर किती लवकर प्रक्रिया करावी लागते, प्रकल्प किती महिने चालू शकतो, आणि त्याला पुरवठा करणाऱ्या लोकांकडे तो चालवण्याचे कारण आहे का याबद्दलही. (चुकीची उत्तरे उत्तरेकडील ऊस लागवड नाकारतात, नाशवंतपणाच्या कथेऐवजी गोदामाची कथा ठेवतात, वा उत्पादन आकडे दशकांपासून नोंदवत असलेले स्थलांतर नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "After 1947 India's government did not merely regulate industry — it built and owned steel plants, heavy machinery works, fertiliser plants and defence factories itself, at enormous cost, when private firms already existed in the country. Explain the reasoning, and what changed by 1991.",
          hi: "1947 के बाद भारत की सरकार ने उद्योग को केवल नियमित नहीं किया — उसने विशाल लागत पर स्वयं इस्पात संयंत्र, भारी मशीनरी कारख़ाने, उर्वरक संयंत्र और रक्षा कारख़ाने बनाए तथा उनका स्वामित्व रखा, जबकि देश में निजी फ़र्में पहले से मौजूद थीं। तर्क समझाओ, और 1991 तक क्या बदला।",
          mr: "1947 नंतर भारताच्या सरकारने उद्योगाचे केवळ नियमन केले नाही — त्याने प्रचंड खर्चाने स्वतः पोलाद प्रकल्प, अवजड यंत्रसामग्री कारखाने, खत प्रकल्प आणि संरक्षण कारखाने बांधले व त्यांची मालकी ठेवली, तर देशात खासगी कंपन्या आधीच होत्या. तर्क समजावा, आणि 1991 पर्यंत काय बदलले.",
        },
        choices: [
          {
            en: "Because these industries need enormous capital, take a decade or more before earning anything, and yield low returns — so private firms, who must answer to shareholders sooner, would not build them. Yet everything else depends on them: no steel means no machinery, railways or construction. The state also used them deliberately to place industry in backward regions and to keep strategic goods out of foreign control. By 1991 the reasoning had weakened — private capital was available, many public firms were running at a loss, and the priority shifted from building capacity to using it efficiently",
            hi: "क्योंकि इन उद्योगों को विशाल पूँजी चाहिए, कुछ भी कमाने से पहले दशक या अधिक लगते हैं, और प्रतिफल कम मिलता है — अतः निजी फ़र्में, जिन्हें शेयरधारकों को जल्दी जवाब देना है, उन्हें बनातीं ही नहीं। फिर भी बाक़ी सब उन्हीं पर निर्भर है: इस्पात नहीं तो मशीनरी, रेलवे या निर्माण नहीं। राज्य ने उनका उपयोग जानबूझकर पिछड़े क्षेत्रों में उद्योग रखने और रणनीतिक वस्तुओं को विदेशी नियंत्रण से बाहर रखने में भी किया। 1991 तक तर्क कमज़ोर पड़ चुका था — निजी पूँजी उपलब्ध थी, कई सार्वजनिक फ़र्में घाटे में चल रही थीं, और प्राथमिकता क्षमता बनाने से हटकर उसे कुशलता से इस्तेमाल करने पर आ गई",
            mr: "कारण या उद्योगांना प्रचंड भांडवल लागते, काहीही कमावण्याआधी दशक वा अधिक लागते, आणि परतावा कमी मिळतो — म्हणून खासगी कंपन्या, ज्यांना भागधारकांना लवकर उत्तर द्यावे लागते, ते बांधतच नाहीत. तरीही बाकी सर्व त्यांच्यावरच अवलंबून: पोलाद नाही तर यंत्रसामग्री, रेल्वे वा बांधकाम नाही. राज्याने त्यांचा वापर मुद्दाम मागास प्रदेशांत उद्योग ठेवायला आणि सामरिक वस्तू परकी नियंत्रणाबाहेर ठेवायलाही केला. 1991 पर्यंत तर्क दुर्बळ झाला होता — खासगी भांडवल उपलब्ध होते, अनेक सार्वजनिक कंपन्या तोट्यात चालत होत्या, आणि प्राधान्य क्षमता उभारण्यावरून ती कार्यक्षमतेने वापरण्यावर सरकले",
          },
          {
            en: "Because private industry was legally banned in India until 1991, so the state had no alternative",
            hi: "क्योंकि 1991 तक भारत में निजी उद्योग क़ानूनन प्रतिबंधित था, अतः राज्य के पास कोई विकल्प नहीं था",
            mr: "कारण 1991 पर्यंत भारतात खासगी उद्योग कायद्याने बंदी होता, म्हणून राज्याकडे पर्यायच नव्हता",
          },
          {
            en: "Because heavy industry is the most profitable of all activities, and the state simply wanted the profit",
            hi: "क्योंकि भारी उद्योग सब गतिविधियों में सबसे लाभप्रद है, और राज्य बस वह लाभ चाहता था",
            mr: "कारण अवजड उद्योग सर्व क्रियांत सर्वांत फायदेशीर, आणि राज्याला फक्त तो नफा हवा होता",
          },
          {
            en: "Because no country has ever needed steel or machinery, so the plants were built for prestige alone",
            hi: "क्योंकि किसी देश को कभी इस्पात या मशीनरी चाहिए ही नहीं थी, अतः संयंत्र केवल प्रतिष्ठा के लिए बने",
            mr: "कारण कोणत्याही देशाला कधी पोलाद वा यंत्रसामग्री लागलीच नाही, म्हणून प्रकल्प केवळ प्रतिष्ठेसाठी बांधले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The decision looks strange only if you assume the private sector will build whatever is needed. It builds what is profitable within a horizon it can survive, and in 1950 those two things were far apart. Consider what an integrated steel plant required. Capital running to hundreds of crores at the values of the time; a construction period of roughly a decade; a further stretch of years before it operated efficiently; and then, if all went well, a modest return on a very large sum. A private firm answers to shareholders and lenders who want dividends and interest well inside that period. Almost no Indian private capital of the 1950s was of the size or patience required, and foreign capital would have wanted terms the new republic was unwilling to give. So the plants either did not get built, or the state built them. That is the core of the argument, and it applies equally to heavy machinery, fertiliser, oil refining and defence production. Three further considerations reinforced it. First, these are basic industries in the strict sense: their output is other industries' input. Without domestic steel there is no machine-building, no rail expansion, no construction industry to speak of — so the whole industrial structure has a floor that must be laid before anything can stand on it. Second, location. A private firm sites a plant where it maximises profit; that logic would have concentrated industry in Bombay, Calcutta and Ahmedabad, deepening the inequality already inherited from colonial development. Public plants at Bhilai, Rourkela and Bokaro were deliberately placed to industrialise poor and largely Adivasi regions — an aim no shareholder would fund. Third, strategy. A country that has just gained independence does not wish its steel, arms and fuel supply to depend on foreign firms whose governments may take a view on its policies. Now what changed. By the late 1980s the situation had reversed on almost every point. Indian private capital was substantial and could finance large plants. The learning problem was solved: engineers, managers and technicians existed in numbers. Many public firms, protected from competition and unable to shed workers or close loss-making units, were running persistent deficits that the budget had to cover, and the licensing system meant to direct investment had become a mechanism for delay and favour. The 1991 reforms therefore narrowed the public sector to a few strategic areas, opened most industries to private and foreign investment, and shifted the policy question from how to create industrial capacity to how to make existing capacity efficient. The honest summary is that both decisions were reasonable in their own conditions. The public sector solved a problem the private sector could not solve in 1950 — building an industrial base from almost nothing — and became a burden once that base existed and competition, rather than capital, was the binding constraint. Judging either period by the other's circumstances is the usual mistake. (The wrong answers invent a ban on private industry that never existed alongside Tata and Birla, misdescribe heavy industry as highly profitable, or dismiss as vanity the inputs on which every other industry depends.)",
          hi: "यह निर्णय तभी विचित्र लगता है जब मान लो कि निजी क्षेत्र जो चाहिए वह बना ही देगा। वह वही बनाता है जो ऐसे क्षितिज के भीतर लाभप्रद हो जिसमें वह टिक सके, और 1950 में वे दो चीज़ें बहुत दूर थीं। सोचो एकीकृत इस्पात संयंत्र को क्या चाहिए था। उस समय के मूल्यों पर सैकड़ों करोड़ तक जाती पूँजी; लगभग एक दशक की निर्माण-अवधि; कुशलता से चलने से पहले और कुछ वर्ष; और फिर, सब ठीक रहा तो, बहुत बड़ी राशि पर मामूली प्रतिफल। निजी फ़र्म उन शेयरधारकों और ऋणदाताओं को जवाब देती है जो उस अवधि के भीतर ही लाभांश और ब्याज चाहते हैं। 1950 के दशक की लगभग कोई भारतीय निजी पूँजी उस आकार या धैर्य की नहीं थी, और विदेशी पूँजी ऐसी शर्तें चाहती जो नया गणराज्य देने को तैयार नहीं था। अतः संयंत्र या तो बनते ही नहीं, या राज्य उन्हें बनाता। यही तर्क का मर्म है, और वह भारी मशीनरी, उर्वरक, तेल-शोधन तथा रक्षा-उत्पादन पर समान रूप से लागू होता है। तीन और विचारों ने उसे मज़बूत किया। पहला, ये सख़्त अर्थ में आधारभूत उद्योग हैं: उनका उत्पादन दूसरे उद्योगों का कच्चा माल है। घरेलू इस्पात के बिना न मशीन-निर्माण, न रेल-विस्तार, न कहने लायक़ निर्माण-उद्योग — अतः पूरे औद्योगिक ढाँचे का एक फ़र्श है जिसे बिछाए बिना उस पर कुछ खड़ा नहीं हो सकता। दूसरा, अवस्थिति। निजी फ़र्म संयंत्र वहाँ बिठाती है जहाँ लाभ अधिकतम हो; वह तर्क उद्योग को बंबई, कलकत्ता और अहमदाबाद में केंद्रित करता, और औपनिवेशिक विकास से पहले ही मिली असमानता गहरा देता। भिलाई, राउरकेला और बोकारो के सार्वजनिक संयंत्र जानबूझकर निर्धन तथा बड़े हिस्से में आदिवासी क्षेत्रों का औद्योगीकरण करने रखे गए — ऐसा लक्ष्य जिसे कोई शेयरधारक वित्तपोषित नहीं करता। तीसरा, रणनीति। जो देश अभी-अभी स्वतंत्र हुआ है वह नहीं चाहता कि उसका इस्पात, हथियार और ईंधन ऐसी विदेशी फ़र्मों पर निर्भर हो जिनकी सरकारें उसकी नीतियों पर राय रख सकती हैं। अब क्या बदला। 1980 के दशक के अंत तक स्थिति लगभग हर बिंदु पर पलट चुकी थी। भारतीय निजी पूँजी पर्याप्त थी और बड़े संयंत्र वित्तपोषित कर सकती थी। सीखने की समस्या हल हो चुकी थी: अभियंता, प्रबंधक और तकनीशियन संख्या में मौजूद थे। कई सार्वजनिक फ़र्में, प्रतिस्पर्धा से संरक्षित और मज़दूर हटाने या घाटे की इकाइयाँ बंद करने में असमर्थ, लगातार घाटे चला रही थीं जिन्हें बजट को ढकना पड़ता था, और निवेश को दिशा देने को बना अनुज्ञप्ति-तंत्र देरी तथा कृपा का साधन बन चुका था। अतः 1991 के सुधारों ने सार्वजनिक क्षेत्र को कुछ रणनीतिक क्षेत्रों तक सीमित किया, अधिकांश उद्योग निजी तथा विदेशी निवेश को खोले, और नीति का प्रश्न औद्योगिक क्षमता बनाने से हटाकर मौजूदा क्षमता को कुशल बनाने पर ला दिया। ईमानदार सारांश यह कि दोनों निर्णय अपनी-अपनी परिस्थितियों में उचित थे। सार्वजनिक क्षेत्र ने वह समस्या हल की जो निजी क्षेत्र 1950 में हल नहीं कर सकता था — लगभग शून्य से औद्योगिक आधार खड़ा करना — और वह आधार बन जाने पर तथा पूँजी नहीं प्रतिस्पर्धा के बाध्यकारी अड़चन बन जाने पर बोझ बन गया। किसी एक दौर को दूसरे की परिस्थितियों से आँकना ही सामान्य भूल है। (ग़लत उत्तर निजी उद्योग पर ऐसा प्रतिबंध गढ़ते जो टाटा और बिड़ला के साथ-साथ कभी था ही नहीं, भारी उद्योग को अत्यधिक लाभप्रद बताते, या उन कच्चे मालों को दिखावा कहकर टालते जिन पर बाक़ी हर उद्योग निर्भर है।)",
          mr: "हा निर्णय तेव्हाच विचित्र वाटतो जेव्हा तुम्ही गृहीत धरता की खासगी क्षेत्र जे लागेल ते बांधेलच. ते तेच बांधते जे अशा क्षितिजात फायदेशीर आहे ज्यात ते टिकू शकते, आणि 1950 मध्ये त्या दोन गोष्टी खूप दूर होत्या. एकात्मिक पोलाद प्रकल्पाला काय लागत होते ते पाहा. त्या काळच्या मूल्यांनुसार शेकडो कोटींपर्यंत जाणारे भांडवल; सुमारे दशकाचा बांधकाम काळ; कार्यक्षमतेने चालण्याआधी आणखी काही वर्षे; आणि मग, सर्व ठीक गेल्यास, खूप मोठ्या रकमेवर माफक परतावा. खासगी कंपनी अशा भागधारक व सावकारांना उत्तर देते जे त्या काळातच लाभांश आणि व्याज मागतात. 1950 च्या दशकातील जवळजवळ कोणतेही भारतीय खासगी भांडवल त्या आकाराचे वा संयमाचे नव्हते, आणि परकी भांडवलाला अशा अटी हव्या असत्या ज्या नवे प्रजासत्ताक द्यायला तयार नव्हते. म्हणून प्रकल्प एकतर बांधलेच गेले नसते, वा राज्याने ते बांधले. हाच युक्तिवादाचा गाभा, आणि तो अवजड यंत्रसामग्री, खत, तेलशुद्धीकरण व संरक्षण-उत्पादनाला समानपणे लागू. आणखी तीन विचारांनी तो बळकट केला. पहिला, ही काटेकोर अर्थाने पायाभूत उद्योग: त्यांचे उत्पादन इतर उद्योगांचा कच्चा माल. देशी पोलादाविना ना यंत्रनिर्मिती, ना रेल्वेविस्तार, ना उल्लेखनीय बांधकाम उद्योग — म्हणून अख्ख्या औद्योगिक रचनेला एक जमीन आहे जी अंथरल्याविना तिच्यावर काहीही उभे राहू शकत नाही. दुसरा, स्थान. खासगी कंपनी प्रकल्प तिथे बसवते जिथे नफा सर्वाधिक; तो तर्क उद्योग मुंबई, कलकत्ता आणि अहमदाबादेत केंद्रित करता आणि वसाहती विकासातून आधीच मिळालेली विषमता खोल करता. भिलाई, राउरकेला आणि बोकारोचे सार्वजनिक प्रकल्प मुद्दाम गरीब आणि मोठ्या प्रमाणात आदिवासी प्रदेशांचे औद्योगीकरण करायला ठेवले — असे ध्येय ज्याला कोणता भागधारक अर्थपुरवठा करत नाही. तिसरा, व्यूहरचना. जो देश नुकताच स्वतंत्र झाला त्याला त्याचे पोलाद, शस्त्रे आणि इंधन अशा परकी कंपन्यांवर अवलंबून नको ज्यांची सरकारे त्याच्या धोरणांवर मत बाळगू शकतात. आता काय बदलले. 1980 च्या दशकाच्या शेवटापर्यंत स्थिती जवळजवळ प्रत्येक मुद्द्यावर पालटली होती. भारतीय खासगी भांडवल भरीव होते आणि मोठे प्रकल्प उभारू शकत होते. शिकण्याची समस्या सुटली होती: अभियंते, व्यवस्थापक आणि तंत्रज्ञ संख्येने उपलब्ध होते. अनेक सार्वजनिक कंपन्या, स्पर्धेपासून संरक्षित आणि कामगार कमी करण्यास वा तोट्याचे एकक बंद करण्यास असमर्थ, सातत्याने तोटे चालवत होत्या जे अर्थसंकल्पाला भरून काढावे लागत, आणि गुंतवणुकीला दिशा द्यायला बनवलेली परवाना-यंत्रणा विलंब व मेहरबानीचे साधन बनली होती. म्हणून 1991 च्या सुधारणांनी सार्वजनिक क्षेत्र काही सामरिक क्षेत्रांपुरते मर्यादित केले, बहुतांश उद्योग खासगी व परकी गुंतवणुकीला उघडले, आणि धोरणाचा प्रश्न औद्योगिक क्षमता निर्माण करण्यावरून विद्यमान क्षमता कार्यक्षम करण्यावर आणला. प्रामाणिक सारांश हा की दोन्ही निर्णय आपापल्या परिस्थितीत रास्त होते. सार्वजनिक क्षेत्राने ती समस्या सोडवली जी खासगी क्षेत्र 1950 मध्ये सोडवू शकत नव्हते — जवळजवळ शून्यातून औद्योगिक पाया उभारणे — आणि तो पाया तयार झाल्यावर व भांडवल नव्हे तर स्पर्धा हा बंधनकारक अडसर बनल्यावर ते ओझे बनले. एका काळाला दुसऱ्याच्या परिस्थितीने तोलणे हीच नेहमीची चूक. (चुकीची उत्तरे टाटा आणि बिर्लांसोबत कधीच नसलेली खासगी उद्योगावरील बंदी रचतात, अवजड उद्योगाला अत्यंत फायदेशीर ठरवतात, वा बाकी प्रत्येक उद्योग ज्यांवर अवलंबून त्या कच्च्या मालांना दिखावा म्हणून झटकतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Lifelines of National Economy                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-lifelines-economy",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 7 — Lifelines of National Economy",
      hi: "अध्याय 7 — राष्ट्रीय अर्थव्यवस्था की जीवन रेखाएँ",
      mr: "प्रकरण 7 — राष्ट्रीय अर्थव्यवस्थेच्या जीवनरेषा",
    },
    name: {
      en: "Lifelines of National Economy",
      hi: "राष्ट्रीय अर्थव्यवस्था की जीवन रेखाएँ",
      mr: "राष्ट्रीय अर्थव्यवस्थेच्या जीवनरेषा",
    },
    summary: {
      en: "The channels that decide whether anything produced ever reaches anyone: the road that ends at a door, the four-city expressway laid to cut a journey in half, the rail that alone can carry coal by the trainload, the buried line that moves oil without a wheel, the harbours where a country meets the world — and the ledger of what is sent out against what is bought in.",
      hi: "वे मार्ग जो तय करते हैं कि उत्पन्न कुछ भी किसी तक कभी पहुँचेगा या नहीं: वह सड़क जो दरवाज़े पर ख़त्म होती है, यात्रा आधी करने बिछा चार-नगरी द्रुतमार्ग, वह रेल जो अकेली कोयला रेलगाड़ी भर ढो सकती है, वह गड़ी लाइन जो बिना पहिये तेल चलाती है, वे बंदरगाह जहाँ देश दुनिया से मिलता है — और जो भेजा गया उसका जो ख़रीदा गया उससे मिलान करता बही-खाता।",
      mr: "ते मार्ग जे ठरवतात की निर्माण झालेले काहीही कोणापर्यंत कधी पोहोचेल की नाही: दारापाशी संपणारा रस्ता, प्रवास निम्मा करायला अंथरलेला चार-शहरी द्रुतमार्ग, एकटी कोळसा गाडीभर वाहू शकणारी ती रेल्वे, चाकाविना तेल हलवणारी ती पुरलेली वाहिनी, ती बंदरे जिथे देश जगाला भेटतो — आणि जे पाठवले त्याचा जे विकत घेतले त्याच्याशी ताळा घालणारी खतावणी.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "road-network",
        name: {
          en: "The road network",
          hi: "सड़क जाल",
          mr: "रस्ते जाळे",
        },
        kind: "structure",
        prompt: {
          en: "It costs less per kilometre to build than a railway, climbs slopes and crosses dissected terrain a train cannot, carries small consignments economically, and alone can deliver to an actual doorstep. Which network is this?",
          hi: "इसे बनाने में प्रति किलोमीटर रेलवे से कम लागत लगती है, यह ढलानें चढ़ता और कटी-फटी भूमि पार करता है जहाँ रेलगाड़ी नहीं जा सकती, छोटी खेपें किफ़ायत से ढोता है, और अकेला असली दरवाज़े तक पहुँचा सकता है। यह कौन-सा जाल है?",
          mr: "हे बांधायला प्रति किलोमीटर रेल्वेहून कमी खर्च लागतो, हे उतार चढते आणि कापल्या-तुटलेल्या भूभागातून जाते जिथे रेल्वे जाऊ शकत नाही, लहान खेपा किफायतशीरपणे वाहते, आणि एकटेच खऱ्या दारापर्यंत पोहोचवू शकते. हे कोणते जाळे?",
        },
        statement: {
          en: "India's road network is the largest carrier of both passengers and freight, built more cheaply than rail, able to cross broken and hilly country, and uniquely capable of door-to-door delivery.",
          hi: "भारत का सड़क जाल यात्रियों और माल दोनों का सबसे बड़ा वाहक है, रेल से सस्ता बना, कटी-फटी तथा पहाड़ी भूमि पार करने में सक्षम, और दरवाज़े-से-दरवाज़े पहुँचाने में अद्वितीय।",
          mr: "भारताचे रस्ते जाळे प्रवासी आणि मालवाहतूक दोन्हींचा सर्वांत मोठा वाहक, रेल्वेहून स्वस्त बांधलेले, कापल्या-तुटलेल्या व डोंगराळ भूभागातून जाण्यास सक्षम, आणि दारापासून दारापर्यंत पोहोचवण्यात अद्वितीय.",
        },
        detail: {
          en: "It is graded by who builds and maintains it — national highways, state highways, district roads, village roads, and the border roads laid in the high Himalaya.",
          hi: "यह इससे आँका जाता है कि उसे कौन बनाता और सँभालता है — राष्ट्रीय राजमार्ग, राज्य राजमार्ग, ज़िला सड़कें, ग्रामीण सड़कें, और ऊँचे हिमालय में बिछाई सीमा-सड़कें।",
          mr: "ते यावरून विभागले जाते की ते कोण बांधतो आणि सांभाळतो — राष्ट्रीय महामार्ग, राज्य महामार्ग, जिल्हा रस्ते, ग्रामीण रस्ते, आणि उंच हिमालयात अंथरलेले सीमा-रस्ते.",
        },
        extra: {
          en: "Even where rail exists, roads feed it: goods reach the station by truck and leave it by truck, so the two networks are partners rather than rivals.",
          hi: "जहाँ रेल है वहाँ भी सड़कें उसे खिलाती हैं: माल ट्रक से स्टेशन पहुँचता और ट्रक से ही निकलता है, अतः दोनों जाल प्रतिद्वंद्वी नहीं साझेदार हैं।",
          mr: "जिथे रेल्वे आहे तिथेही रस्ते तिला पुरवतात: माल ट्रकने स्थानकावर पोहोचतो आणि ट्रकनेच निघतो, म्हणून दोन्ही जाळी प्रतिस्पर्धी नव्हे तर भागीदार.",
        },
        pair: {
          left: {
            en: "Cheap to build, climbs anywhere, ends at a door",
            hi: "सस्ता निर्माण, कहीं भी चढ़े, दरवाज़े पर ख़त्म",
            mr: "स्वस्त बांधणी, कुठेही चढणारा, दारापाशी संपणारा",
          },
          right: {
            en: "the road network",
            hi: "सड़क जाल",
            mr: "रस्ते जाळे",
          },
        },
      },
      {
        id: "golden-quadrilateral",
        name: {
          en: "The Golden Quadrilateral",
          hi: "स्वर्णिम चतुर्भुज",
          mr: "सुवर्ण चतुष्कोन",
        },
        kind: "structure",
        prompt: {
          en: "A six-lane super highway was laid to link Delhi, Mumbai, Chennai and Kolkata, with north–south and east–west corridors crossing it, deliberately cutting the time and distance between the four biggest metros. What is this project called?",
          hi: "दिल्ली, मुंबई, चेन्नई और कोलकाता को जोड़ने छह-लेन का महामार्ग बिछाया गया, जिसे उत्तर–दक्षिण तथा पूर्व–पश्चिम गलियारे काटते हैं, और जिसने जानबूझकर चारों सबसे बड़े महानगरों के बीच समय तथा दूरी घटाई। यह परियोजना क्या कहलाती है?",
          mr: "दिल्ली, मुंबई, चेन्नई आणि कोलकाता जोडायला सहा-मार्गिकांचा महामार्ग अंथरला, ज्याला उत्तर–दक्षिण व पूर्व–पश्चिम मार्गिका छेदतात, आणि ज्याने मुद्दाम चारही सर्वांत मोठ्या महानगरांमधील वेळ व अंतर घटवले. हा प्रकल्प काय म्हणतात?",
        },
        statement: {
          en: "The Golden Quadrilateral is the six-lane super highway network joining Delhi, Mumbai, Chennai and Kolkata, together with the North–South and East–West corridors, built to cut travel time between India's major economic centres.",
          hi: "स्वर्णिम चतुर्भुज दिल्ली, मुंबई, चेन्नई और कोलकाता को जोड़ता छह-लेन महामार्ग जाल है, उत्तर–दक्षिण तथा पूर्व–पश्चिम गलियारों के साथ, जो भारत के प्रमुख आर्थिक केंद्रों के बीच यात्रा-समय घटाने बनाया गया।",
          mr: "सुवर्ण चतुष्कोन म्हणजे दिल्ली, मुंबई, चेन्नई आणि कोलकाता जोडणारे सहा-मार्गिकांचे महामार्ग जाळे, उत्तर–दक्षिण व पूर्व–पश्चिम मार्गिकांसह, जे भारताच्या प्रमुख आर्थिक केंद्रांतील प्रवास-वेळ घटवायला बांधले.",
        },
        detail: {
          en: "Shorter transit time is not a convenience but a cost: a truck that returns in three days instead of five earns nearly twice as much for its owner.",
          hi: "कम यात्रा-समय सुविधा नहीं, लागत है: जो ट्रक पाँच के बजाय तीन दिनों में लौटता है वह मालिक के लिए लगभग दुगुना कमाता है।",
          mr: "कमी प्रवासवेळ ही सोय नव्हे तर खर्च: जो ट्रक पाचऐवजी तीन दिवसांत परततो तो मालकासाठी जवळजवळ दुप्पट कमावतो.",
        },
        extra: {
          en: "Perishables gained most — vegetables, milk and fruit that once could not travel far enough to reach a paying market now can.",
          hi: "नाशवान वस्तुओं को सबसे अधिक लाभ हुआ — सब्ज़ियाँ, दूध और फल जो कभी दाम देते बाज़ार तक पहुँचने भर दूर नहीं जा सकते थे, अब जा सकते हैं।",
          mr: "नाशवंत वस्तूंना सर्वाधिक फायदा — भाज्या, दूध आणि फळे जी कधी पैसे देणाऱ्या बाजारापर्यंत पोहोचण्याइतकी दूर जाऊ शकत नव्हती, आता जाऊ शकतात.",
        },
        pair: {
          left: {
            en: "Six lanes joining the four biggest metros",
            hi: "चार सबसे बड़े महानगरों को जोड़ती छह लेन",
            mr: "चार सर्वांत मोठी महानगरे जोडणाऱ्या सहा मार्गिका",
          },
          right: {
            en: "the Golden Quadrilateral",
            hi: "स्वर्णिम चतुर्भुज",
            mr: "सुवर्ण चतुष्कोन",
          },
        },
      },
      {
        id: "railway-network",
        name: {
          en: "The railway network",
          hi: "रेल जाल",
          mr: "रेल्वे जाळे",
        },
        kind: "structure",
        prompt: {
          en: "It moves coal, ore, cement and grain by the trainload at a cost per tonne no truck can match, carries millions of passengers overnight across the country, and was the single largest employer in India for decades. Which network is this?",
          hi: "यह कोयला, अयस्क, सीमेंट और अनाज रेलगाड़ी भर ऐसी प्रति-टन लागत पर ढोता है जिसकी बराबरी कोई ट्रक नहीं कर सकता, रातोंरात देश भर लाखों यात्री ले जाता है, और दशकों तक भारत का सबसे बड़ा एकल नियोक्ता रहा। यह कौन-सा जाल है?",
          mr: "हे कोळसा, धातुक, सिमेंट आणि धान्य गाडीभर अशा प्रति-टन खर्चात वाहते ज्याची बरोबरी कोणता ट्रक करू शकत नाही, रात्रभरात देशभर लाखो प्रवासी नेते, आणि दशके भारताचा सर्वांत मोठा एकल नियोक्ता राहिले. हे कोणते जाळे?",
        },
        statement: {
          en: "The railway network is India's principal carrier of bulk freight and long-distance passengers, unmatched in cost per tonne-kilometre for heavy goods and central to the movement of coal, ore and foodgrain.",
          hi: "रेल जाल भारत का थोक माल और लंबी दूरी के यात्रियों का प्रमुख वाहक है, भारी वस्तुओं के लिए प्रति टन-किलोमीटर लागत में अद्वितीय और कोयले, अयस्क तथा खाद्यान्न की आवाजाही के केंद्र में।",
          mr: "रेल्वे जाळे हे भारताचे मोठ्या प्रमाणातील मालवाहतूक आणि लांब पल्ल्याच्या प्रवाशांचे प्रमुख वाहक, जड वस्तूंसाठी प्रति टन-किलोमीटर खर्चात अतुलनीय आणि कोळसा, धातुक व अन्नधान्याच्या हालचालीच्या केंद्रस्थानी.",
        },
        detail: {
          en: "Terrain shaped where it could go: the level northern plains made construction easy, while the Himalaya, the desert sands and the Sundarban swamps resisted it.",
          hi: "भूभाग ने तय किया वह कहाँ जा सकता है: समतल उत्तरी मैदानों ने निर्माण आसान किया, जबकि हिमालय, मरुस्थल की रेत और सुंदरबन के दलदलों ने उसका प्रतिरोध किया।",
          mr: "भूभागाने ठरवले ते कुठे जाऊ शकते: सपाट उत्तरेच्या मैदानांनी बांधकाम सोपे केले, तर हिमालय, वाळवंटाची वाळू आणि सुंदरबनच्या दलदलींनी त्याला विरोध केला.",
        },
        extra: {
          en: "It was built by the colonial state to move raw material to the ports and troops to the frontier, and independent India inherited a map drawn for someone else's purposes.",
          hi: "इसे औपनिवेशिक राज्य ने कच्चा माल बंदरगाहों तक और सैनिक सीमांत तक ले जाने बनाया था, और स्वतंत्र भारत को किसी और के प्रयोजनों के लिए खींचा नक़्शा विरासत में मिला।",
          mr: "ते वसाहती राज्याने कच्चा माल बंदरांपर्यंत आणि सैन्य सीमेपर्यंत नेण्यासाठी बांधले, आणि स्वतंत्र भारताला दुसऱ्याच्या हेतूंसाठी आखलेला नकाशा वारशाने मिळाला.",
        },
        pair: {
          left: {
            en: "Bulk freight by the trainload, cheapest per tonne",
            hi: "रेलगाड़ी भर थोक माल, प्रति टन सबसे सस्ता",
            mr: "गाडीभर मोठा माल, प्रति टन सर्वांत स्वस्त",
          },
          right: {
            en: "the railway network",
            hi: "रेल जाल",
            mr: "रेल्वे जाळे",
          },
        },
      },
      {
        id: "pipelines",
        name: {
          en: "Pipelines",
          hi: "पाइपलाइनें",
          mr: "नळमार्ग",
        },
        kind: "structure",
        prompt: {
          en: "Buried out of sight, they move crude oil, refined products and natural gas continuously from field to refinery to market, with almost no running cost once laid and no vehicle to load. What are these?",
          hi: "नज़र से ओझल गड़ी हुई, ये कच्चा तेल, शोधित उत्पाद और प्राकृतिक गैस लगातार क्षेत्र से शोधनशाला तक और बाज़ार तक ले जाती हैं, बिछ जाने पर लगभग बिना चालू लागत और लादने को कोई वाहन नहीं। ये क्या हैं?",
          mr: "नजरेआड पुरलेले, हे कच्चे तेल, शुद्ध उत्पादने आणि नैसर्गिक वायू सतत क्षेत्रापासून शुद्धीकरण प्रकल्पापर्यंत आणि बाजारापर्यंत नेतात, अंथरल्यावर जवळजवळ चालू खर्चाविना आणि भरायला कोणते वाहन नाही. हे काय?",
        },
        statement: {
          en: "Pipelines carry crude oil, petroleum products and natural gas overland, running continuously without vehicles or handling, with a very high cost to lay and a very low cost to operate.",
          hi: "पाइपलाइनें कच्चा तेल, पेट्रोलियम उत्पाद और प्राकृतिक गैस स्थल-मार्ग से ढोती हैं, बिना वाहनों या चढ़ाई-उतराई के लगातार चलती हैं, बिछाने में बहुत ऊँची और चलाने में बहुत कम लागत के साथ।",
          mr: "नळमार्ग कच्चे तेल, पेट्रोलियम उत्पादने आणि नैसर्गिक वायू भूमार्गे वाहतात, वाहने वा चढउतार न करता सतत चालतात, अंथरायला खूप जास्त आणि चालवायला खूप कमी खर्चात.",
        },
        detail: {
          en: "The economics is unusual: nearly all the cost is paid before a drop moves, so a pipeline only makes sense where a large flow is assured for many years.",
          hi: "अर्थशास्त्र असामान्य है: लगभग सारी लागत एक बूँद चलने से पहले चुक जाती है, अतः पाइपलाइन तभी अर्थपूर्ण है जहाँ कई वर्षों तक बड़ा प्रवाह निश्चित हो।",
          mr: "अर्थशास्त्र असामान्य: जवळजवळ अख्खा खर्च एक थेंब हलण्याआधीच होतो, म्हणून नळमार्ग तेव्हाच अर्थपूर्ण जिथे अनेक वर्षे मोठा प्रवाह खात्रीशीर.",
        },
        extra: {
          en: "They also make inland refining possible, letting a refinery stand near its market instead of at the port, since the crude can be sent to it underground.",
          hi: "वे भीतरी शोधन भी संभव बनाती हैं, शोधनशाला को बंदरगाह के बजाय अपने बाज़ार के पास खड़ा होने देती हैं, क्योंकि कच्चा तेल उस तक भूमिगत भेजा जा सकता है।",
          mr: "ते अंतर्गत शुद्धीकरणही शक्य करतात, शुद्धीकरण प्रकल्पाला बंदराऐवजी आपल्या बाजाराजवळ उभे राहू देतात, कारण कच्चे तेल त्याच्यापर्यंत भूमिगत पाठवता येते.",
        },
        pair: {
          left: {
            en: "Buried, continuous, dear to lay and cheap to run",
            hi: "गड़ी, सतत, बिछाने में महँगी और चलाने में सस्ती",
            mr: "पुरलेले, सतत, अंथरायला महाग आणि चालवायला स्वस्त",
          },
          right: {
            en: "pipelines",
            hi: "पाइपलाइनें",
            mr: "नळमार्ग",
          },
        },
      },
      {
        id: "major-ports",
        name: {
          en: "The major ports",
          hi: "प्रमुख बंदरगाह",
          mr: "प्रमुख बंदरे",
        },
        kind: "structure",
        prompt: {
          en: "Kandla built to serve a partitioned west, Mumbai the busiest natural harbour, Jawaharlal Nehru raised to relieve it, Kolkata a tidal river port needing constant dredging, Vishakhapatnam the deepest and landlocked. What are these?",
          hi: "बँटे हुए पश्चिम की सेवा को बना कांडला, सबसे व्यस्त प्राकृतिक पोताश्रय मुंबई, उसका बोझ हल्का करने खड़ा जवाहरलाल नेहरू, लगातार गाद-सफ़ाई माँगता ज्वारीय नदी-बंदरगाह कोलकाता, सबसे गहरा और भूमि-घिरा विशाखापत्तनम। ये क्या हैं?",
          mr: "फाळणी झालेल्या पश्चिमेच्या सेवेसाठी बांधलेले कांडला, सर्वांत वर्दळीचे नैसर्गिक बंदर मुंबई, त्याचा भार हलका करायला उभे जवाहरलाल नेहरू, सतत गाळ-उपसा मागणारे भरती-ओहोटीचे नदी-बंदर कोलकाता, सर्वांत खोल आणि भूवेढलेले विशाखापट्टणम. ही काय?",
        },
        statement: {
          en: "India's major ports handle the bulk of its overseas trade along a long coastline, each shaped by its own site — a natural harbour, a tidal river, a dredged channel or a landlocked basin.",
          hi: "भारत के प्रमुख बंदरगाह लंबी तटरेखा पर उसके समुद्रपार व्यापार का बड़ा हिस्सा सँभालते हैं, और हर एक अपने स्थल से गढ़ा है — प्राकृतिक पोताश्रय, ज्वारीय नदी, खोदा गया जलमार्ग या भूमि-घिरा बेसिन।",
          mr: "भारताची प्रमुख बंदरे लांब किनारपट्टीवर त्याच्या सागरापार व्यापाराचा मोठा भाग हाताळतात, आणि प्रत्येक आपल्या जागेने घडलेले — नैसर्गिक बंदर, भरती-ओहोटीची नदी, खणलेला मार्ग वा भूवेढलेले खोरे.",
        },
        detail: {
          en: "A port is worth only as much as the land behind it: without rail and road into the interior, cargo simply piles up on the quay.",
          hi: "बंदरगाह उतना ही मूल्यवान है जितनी उसके पीछे की भूमि: भीतरी इलाक़ों तक रेल और सड़क के बिना माल बस घाट पर ढेर हो जाता है।",
          mr: "बंदर तितकेच मोलाचे जितकी त्याच्यामागील भूमी: आतल्या भागापर्यंत रेल्वे आणि रस्त्याविना माल फक्त धक्क्यावर साचतो.",
        },
        extra: {
          en: "Roughly nine-tenths of India's trade by volume moves by sea, which is why a single congested harbour can raise prices across half the country.",
          hi: "आयतन के हिसाब से भारत का लगभग नौ-दसवाँ व्यापार समुद्र से चलता है, इसीलिए एक ही भीड़भाड़ वाला पोताश्रय आधे देश में क़ीमतें चढ़ा सकता है।",
          mr: "आकारमानाने भारताचा सुमारे नऊ-दशांश व्यापार समुद्रामार्गे चालतो, म्हणूनच एकच गजबजलेले बंदर अर्ध्या देशात किमती चढवू शकते.",
        },
        pair: {
          left: {
            en: "Harbours where a country meets the sea",
            hi: "वे पोताश्रय जहाँ देश समुद्र से मिलता है",
            mr: "ती बंदरे जिथे देश समुद्राला भेटतो",
          },
          right: {
            en: "the major ports",
            hi: "प्रमुख बंदरगाह",
            mr: "प्रमुख बंदरे",
          },
        },
      },
      {
        id: "international-trade",
        name: {
          en: "International trade",
          hi: "अंतरराष्ट्रीय व्यापार",
          mr: "आंतरराष्ट्रीय व्यापार",
        },
        kind: "idea",
        prompt: {
          en: "A country sends out software, gems, textiles and machinery, and buys in crude oil, electronics and gold; the difference between the two totals is watched closely by every finance minister. What exchange is this?",
          hi: "कोई देश सॉफ़्टवेयर, रत्न, वस्त्र और मशीनरी भेजता है, तथा कच्चा तेल, इलेक्ट्रॉनिक्स और सोना ख़रीदता है; दोनों कुलों का अंतर हर वित्त मंत्री ध्यान से देखता है। यह कौन-सा आदान-प्रदान है?",
          mr: "एखादा देश सॉफ्टवेअर, रत्ने, वस्त्रे आणि यंत्रसामग्री पाठवतो, आणि कच्चे तेल, इलेक्ट्रॉनिक्स व सोने विकत घेतो; दोन्ही एकूणांमधील फरक प्रत्येक अर्थमंत्री बारकाईने पाहतो. ही कोणती देवाणघेवाण?",
        },
        statement: {
          en: "International trade is the exchange of goods and services across national borders, and the balance between what a country exports and what it imports is treated as a measure of its economic health.",
          hi: "अंतरराष्ट्रीय व्यापार राष्ट्रीय सीमाओं के आर-पार वस्तुओं और सेवाओं का आदान-प्रदान है, और कोई देश जो निर्यात करता तथा जो आयात करता उनका संतुलन उसके आर्थिक स्वास्थ्य का माप माना जाता है।",
          mr: "आंतरराष्ट्रीय व्यापार म्हणजे राष्ट्रीय सीमांपलीकडे वस्तू व सेवांची देवाणघेवाण, आणि एखादा देश जे निर्यात करतो आणि जे आयात करतो त्यांतील तोल त्याच्या आर्थिक आरोग्याचे माप मानला जातो.",
        },
        detail: {
          en: "What matters is not only the size of the trade but its composition: exporting finished goods and services earns far more than exporting the ore and cotton that go into them.",
          hi: "मायने केवल व्यापार का आकार नहीं बल्कि उसकी संरचना रखती है: तैयार वस्तुएँ और सेवाएँ निर्यात करना उन अयस्क तथा कपास के निर्यात से कहीं अधिक कमाता है जो उनमें जाते हैं।",
          mr: "महत्त्व केवळ व्यापाराच्या आकाराचे नव्हे तर त्याच्या रचनेचे: तयार वस्तू व सेवा निर्यात करणे त्यांत जाणारे धातुक व कापूस निर्यात करण्याहून कितीतरी अधिक कमावते.",
        },
        extra: {
          en: "Tourism counts as an invisible export — a visitor spends foreign currency inside the country without a single crate crossing the border.",
          hi: "पर्यटन अदृश्य निर्यात गिना जाता है — कोई आगंतुक देश के भीतर विदेशी मुद्रा ख़र्च करता है और सीमा पार एक भी पेटी नहीं जाती।",
          mr: "पर्यटन अदृश्य निर्यात म्हणून गणले जाते — एखादा पाहुणा देशाच्या आत परकी चलन खर्च करतो आणि सीमेपार एकही पेटी जात नाही.",
        },
        pair: {
          left: {
            en: "What is sent out against what is bought in",
            hi: "जो भेजा गया बनाम जो ख़रीदा गया",
            mr: "जे पाठवले विरुद्ध जे विकत घेतले",
          },
          right: {
            en: "international trade",
            hi: "अंतरराष्ट्रीय व्यापार",
            mr: "आंतरराष्ट्रीय व्यापार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Roads have grown far faster than railways in India, and now carry the larger share of both passengers and freight — yet no planner proposes closing the railways, and coal, ore and foodgrain still move overwhelmingly by train. Explain both facts together.",
          hi: "भारत में सड़कें रेलवे से कहीं तेज़ी से बढ़ी हैं, और अब यात्रियों तथा माल दोनों का बड़ा हिस्सा ढोती हैं — फिर भी कोई योजनाकार रेलवे बंद करने का प्रस्ताव नहीं देता, और कोयला, अयस्क तथा खाद्यान्न अब भी अत्यधिक रूप से रेलगाड़ी से चलते हैं। दोनों तथ्य साथ समझाओ।",
          mr: "भारतात रस्ते रेल्वेहून कितीतरी वेगाने वाढले आहेत, आणि आता प्रवासी व माल दोन्हींचा मोठा वाटा वाहतात — तरीही कोणता नियोजक रेल्वे बंद करण्याचा प्रस्ताव देत नाही, आणि कोळसा, धातुक व अन्नधान्य अजूनही प्रामुख्याने गाडीनेच जातात. दोन्ही तथ्ये एकत्र समजावा.",
        },
        choices: [
          {
            en: "Roads win where flexibility matters: they cost less per kilometre to build, can climb hills and reach villages a track cannot, carry small consignments economically, and deliver door to door without transhipment. Rail wins where mass matters: for heavy bulk over long distances its cost per tonne-kilometre is far lower and no fleet of trucks can match a single train's load. So the two are complementary — roads feed and distribute, rail carries the heavy long haul",
            hi: "सड़कें वहाँ जीतती हैं जहाँ लचीलापन मायने रखता है: उन्हें बनाने में प्रति किलोमीटर कम लागत लगती है, वे पहाड़ चढ़ सकतीं और उन गाँवों तक पहुँच सकतीं जहाँ पटरी नहीं, छोटी खेपें किफ़ायत से ढोती हैं, और बिना माल बदले दरवाज़े-से-दरवाज़े पहुँचाती हैं। रेल वहाँ जीतती है जहाँ भार मायने रखता है: लंबी दूरी पर भारी थोक के लिए उसकी प्रति टन-किलोमीटर लागत कहीं कम है और ट्रकों का कोई बेड़ा एक ही रेलगाड़ी के भार की बराबरी नहीं कर सकता। अतः दोनों पूरक हैं — सड़कें खिलाती और बाँटती हैं, रेल भारी लंबी ढुलाई ढोती है",
            mr: "रस्ते तिथे जिंकतात जिथे लवचीकता महत्त्वाची: ते बांधायला प्रति किलोमीटर कमी खर्च लागतो, ते डोंगर चढू शकतात आणि रुळ जाऊ शकत नाहीत अशा गावांपर्यंत पोहोचतात, लहान खेपा किफायतशीरपणे वाहतात, आणि माल न बदलता दारापासून दारापर्यंत पोहोचवतात. रेल्वे तिथे जिंकते जिथे वस्तुमान महत्त्वाचे: लांब पल्ल्यावर जड मालासाठी तिचा प्रति टन-किलोमीटर खर्च कितीतरी कमी आणि ट्रकांचा कोणताही ताफा एकाच गाडीच्या भाराची बरोबरी करू शकत नाही. म्हणून दोन्ही पूरक — रस्ते पुरवतात व वाटतात, रेल्वे जड लांब वाहतूक वाहते",
          },
          {
            en: "Because trains are physically incapable of carrying heavy goods, which is why coal must go by road",
            hi: "क्योंकि रेलगाड़ियाँ भारी माल ढोने में भौतिक रूप से असमर्थ हैं, इसीलिए कोयला सड़क से जाना चाहिए",
            mr: "कारण गाड्या जड माल वाहण्यास भौतिकदृष्ट्या असमर्थ, म्हणूनच कोळसा रस्त्याने जावा",
          },
          {
            en: "Because roads are cheaper than rail for every purpose without exception, so rail survives only by subsidy",
            hi: "क्योंकि सड़कें हर प्रयोजन के लिए बिना अपवाद रेल से सस्ती हैं, अतः रेल केवल सब्सिडी से बची है",
            mr: "कारण रस्ते प्रत्येक हेतूसाठी अपवादाविना रेल्वेहून स्वस्त, म्हणून रेल्वे फक्त अनुदानाने टिकली",
          },
          {
            en: "Because the two networks compete for exactly the same traffic and one must eventually eliminate the other",
            hi: "क्योंकि दोनों जाल ठीक उसी यातायात के लिए प्रतिस्पर्धा करते हैं और एक को अंततः दूसरे को मिटाना ही होगा",
            mr: "कारण दोन्ही जाळी नेमक्या त्याच वाहतुकीसाठी स्पर्धा करतात आणि एकाला अखेर दुसरे संपवावेच लागेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two facts sit together comfortably once you stop treating road and rail as rivals for the same job and ask what each is physically good at. Take roads first. A road costs a fraction of a railway line per kilometre to build, needs no signalling, no gauge and no rolling stock, and can be laid on gradients and across dissected, hilly and forested country where a track cannot go at all. It can be extended to a single village at modest cost, which a branch line never could. It carries a consignment of two tonnes as readily as two hundred, so a small trader, a farmer with one truckload of vegetables, or a workshop sending parts can use it without waiting to accumulate a wagonload. Most decisively, it delivers door to door: a truck loads at the factory gate and unloads at the shop, while rail freight must be carted to the station, loaded, unloaded at the far end and carted again — each handling costing money, time and breakage. For high-value, small-volume, time-sensitive or short-distance movement, road wins every time, and that describes most of what a growing consumer economy moves. Now rail. Its advantage is mass, and it is decisive where mass is what you have. A single freight train carries the load of dozens of trucks with one crew and a fraction of the fuel per tonne, because steel wheels on steel rails have far lower rolling resistance than tyres on tarmac. For heavy, low-value bulk moving long distances — coal from the Damodar valley to a power station a thousand kilometres away, iron ore to a steel plant or a port, foodgrain from Punjab to a deficit state — the cost per tonne-kilometre by rail is a small fraction of the road figure, and no arrangement of trucks can close the gap. These cargoes are also insensitive to a day's delay, so rail's slower, scheduled movement costs them nothing. The conclusion is not that one is better but that they occupy different parts of the same system, and in practice they are joined: goods reach the railhead by truck and leave it by truck, so almost every rail journey has road at both ends. Planners therefore speak of an optimum modal mix rather than a winner. The policy question is not which to build, but whether the balance is right — and India's has drifted towards road partly for good reasons and partly because rail capacity was not expanded to match, with the consequence of heavier fuel imports, more emissions and congested highways. Dedicated freight corridors are the direct answer to that imbalance. (The wrong answers deny rail's bulk capacity, claim a universal road advantage the cost-per-tonne figures contradict, or assume two complementary networks must be rivals.)",
          hi: "दोनों तथ्य तभी सहज साथ बैठते हैं जब तुम सड़क और रेल को एक ही काम के प्रतिद्वंद्वी मानना छोड़ दो और पूछो कि हर एक भौतिक रूप से किसमें अच्छा है। पहले सड़कें। सड़क बनाने में प्रति किलोमीटर रेलवे लाइन का अंश लगता है, न सिग्नलिंग चाहिए, न गेज, न रोलिंग स्टॉक, और वह ऐसी ढलानों तथा कटी-फटी, पहाड़ी और वन-भूमि पर बिछाई जा सकती है जहाँ पटरी जा ही नहीं सकती। उसे मामूली लागत पर एक अकेले गाँव तक बढ़ाया जा सकता है, जो कोई शाखा-लाइन कभी नहीं कर सकती थी। वह दो टन की खेप उतनी ही आसानी से ढोती है जितनी दो सौ की, अतः छोटा व्यापारी, एक ट्रक भर सब्ज़ी वाला किसान, या पुर्ज़े भेजती कार्यशाला उसे बिना वैगन भर जमा होने की प्रतीक्षा किए इस्तेमाल कर सकते हैं। सबसे निर्णायक रूप से, वह दरवाज़े-से-दरवाज़े पहुँचाती है: ट्रक कारख़ाने के फाटक पर लदता और दुकान पर उतरता है, जबकि रेल-माल को स्टेशन तक ढोना, लादना, दूसरे सिरे पर उतारना और फिर ढोना पड़ता है — हर चढ़ाई-उतराई पैसा, समय और टूट-फूट माँगती है। उच्च-मूल्य, कम-आयतन, समय-संवेदी या छोटी दूरी की आवाजाही के लिए सड़क हर बार जीतती है, और यही बढ़ती उपभोक्ता अर्थव्यवस्था जो कुछ चलाती है उसका अधिकांश है। अब रेल। उसका लाभ भार है, और वह वहाँ निर्णायक है जहाँ तुम्हारे पास भार ही है। एक मालगाड़ी दर्जनों ट्रकों का भार एक ही चालक-दल और प्रति टन ईंधन के अंश पर ढोती है, क्योंकि इस्पात की पटरी पर इस्पात के पहियों का लोटन-प्रतिरोध डामर पर टायरों से कहीं कम है। भारी, कम-मूल्य थोक की लंबी दूरी की आवाजाही के लिए — दामोदर घाटी से हज़ार किलोमीटर दूर बिजलीघर तक कोयला, इस्पात संयंत्र या बंदरगाह तक लौह अयस्क, पंजाब से किसी कमी वाले राज्य तक खाद्यान्न — रेल से प्रति टन-किलोमीटर लागत सड़क के आँकड़े का छोटा अंश है, और ट्रकों की कोई व्यवस्था वह खाई नहीं पाट सकती। ये माल एक दिन की देरी के प्रति असंवेदी भी हैं, अतः रेल की धीमी, समय-सारणीबद्ध आवाजाही उन्हें कुछ नहीं पड़ती। निष्कर्ष यह नहीं कि एक बेहतर है बल्कि यह कि वे एक ही तंत्र के भिन्न हिस्सों में बैठते हैं, और व्यवहार में वे जुड़े हुए हैं: माल ट्रक से रेलहेड पहुँचता और ट्रक से ही निकलता है, अतः लगभग हर रेल-यात्रा के दोनों सिरों पर सड़क है। अतः योजनाकार विजेता के बजाय इष्टतम साधन-मिश्रण की बात करते हैं। नीति का प्रश्न यह नहीं कि कौन बनाया जाए, बल्कि यह कि संतुलन ठीक है या नहीं — और भारत का संतुलन सड़क की ओर बहा है, आंशिक रूप से अच्छे कारणों से और आंशिक रूप से इसलिए कि रेल-क्षमता उसके अनुपात में नहीं बढ़ाई गई, जिसका परिणाम भारी ईंधन आयात, अधिक उत्सर्जन और भीड़ भरे राजमार्ग हैं। समर्पित माल गलियारे उसी असंतुलन का सीधा उत्तर हैं। (ग़लत उत्तर रेल की थोक क्षमता नकारते, ऐसे सार्वभौमिक सड़क-लाभ का दावा करते जिसका खंडन प्रति-टन लागत के आँकड़े करते, या मान लेते कि दो पूरक जाल प्रतिद्वंद्वी ही होने चाहिए।)",
          mr: "दोन्ही तथ्ये तेव्हाच सहज एकत्र बसतात जेव्हा तुम्ही रस्ता आणि रेल्वेला एकाच कामाचे प्रतिस्पर्धी मानणे सोडता आणि विचारता की प्रत्येक भौतिकदृष्ट्या कशात चांगला. आधी रस्ते. रस्ता बांधायला प्रति किलोमीटर रेल्वेमार्गाचा अंश लागतो, ना सिग्नलिंग लागते, ना गेज, ना डबे, आणि तो अशा उतारांवर आणि कापल्या-तुटलेल्या, डोंगराळ व जंगली भूभागावर अंथरता येतो जिथे रूळ जाऊच शकत नाही. तो माफक खर्चात एका एकट्या गावापर्यंत वाढवता येतो, जे कोणती फाटा-लाईन कधीच करू शकत नव्हती. तो दोन टनांची खेप दोनशेइतक्याच सहजतेने वाहतो, म्हणून लहान व्यापारी, एक ट्रकभर भाज्या असलेला शेतकरी, वा भाग पाठवणारी कार्यशाळा तो वॅगनभर साचण्याची वाट न पाहता वापरू शकतात. सर्वांत निर्णायकपणे, तो दारापासून दारापर्यंत पोहोचवतो: ट्रक कारखान्याच्या फाटकावर भरतो आणि दुकानावर उतरतो, तर रेल्वेमाल स्थानकापर्यंत न्यावा, भरावा, दुसऱ्या टोकाला उतरवावा आणि पुन्हा न्यावा लागतो — प्रत्येक हाताळणी पैसा, वेळ आणि तुटफूट मागते. उच्च-मोलाच्या, कमी-आकारमानाच्या, वेळ-संवेदनशील वा कमी अंतराच्या हालचालीसाठी रस्ता प्रत्येक वेळी जिंकतो, आणि हेच वाढती ग्राहक अर्थव्यवस्था जे काही हलवते त्याचा बहुतांश. आता रेल्वे. तिचा फायदा वस्तुमान, आणि तो तिथे निर्णायक जिथे तुमच्याकडे वस्तुमानच आहे. एक मालगाडी डझनभर ट्रकांचा भार एकाच कर्मचारीवर्गासह आणि प्रति टन इंधनाच्या अंशावर वाहते, कारण पोलादी रुळांवर पोलादी चाकांचा लोळण-रोध डांबरावरील टायरांहून कितीतरी कमी. जड, कमी-मोलाच्या मालाच्या लांब पल्ल्याच्या हालचालीसाठी — दामोदर खोऱ्यातून हजार किलोमीटर दूरच्या वीजकेंद्रापर्यंत कोळसा, पोलाद प्रकल्प वा बंदरापर्यंत लोहधातुक, पंजाबातून तुटीच्या राज्यापर्यंत अन्नधान्य — रेल्वेने प्रति टन-किलोमीटर खर्च रस्त्याच्या आकड्याचा लहान अंश, आणि ट्रकांची कोणतीही मांडणी ती दरी भरू शकत नाही. हा मालही एका दिवसाच्या विलंबाला असंवेदनशील, म्हणून रेल्वेची मंद, वेळापत्रकबद्ध हालचाल त्यांना काहीच पडत नाही. निष्कर्ष हा नाही की एक चांगले तर हा की ते एकाच यंत्रणेच्या वेगळ्या भागांत बसतात, आणि व्यवहारात ते जोडलेले: माल ट्रकने रेल्वेस्थानकावर पोहोचतो आणि ट्रकनेच निघतो, म्हणून जवळजवळ प्रत्येक रेल्वे-प्रवासाच्या दोन्ही टोकांना रस्ता. म्हणून नियोजक विजेत्याऐवजी इष्टतम साधन-मिश्रणाबद्दल बोलतात. धोरणाचा प्रश्न कोणते बांधावे हा नाही, तर तोल बरोबर आहे का हा — आणि भारताचा तोल रस्त्याकडे झुकला आहे, अंशतः चांगल्या कारणांनी आणि अंशतः यामुळे की रेल्वे क्षमता त्या प्रमाणात वाढवली गेली नाही, ज्याचा परिणाम जड इंधन आयात, अधिक उत्सर्जन आणि गजबजलेले महामार्ग. समर्पित मालवाहतूक मार्गिका त्याच असमतोलाचे थेट उत्तर. (चुकीची उत्तरे रेल्वेची मोठी क्षमता नाकारतात, प्रति-टन खर्चाचे आकडे खोडून काढत असलेल्या सार्वत्रिक रस्ता-फायद्याचा दावा करतात, वा दोन पूरक जाळी प्रतिस्पर्धीच असावीत असे गृहीत धरतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "The chapter calls transport and communication the lifelines of the economy, which sounds like a metaphor. Show that it is a claim with real content by explaining what happens to production, prices and opportunity in a district that a road never reaches — and what the composition of a country's trade reveals about where it stands.",
          hi: "अध्याय परिवहन और संचार को अर्थव्यवस्था की जीवन रेखाएँ कहता है, जो एक रूपक लगता है। दिखाओ कि यह असली विषय वाला दावा है — यह समझाकर कि जिस ज़िले तक सड़क कभी नहीं पहुँची वहाँ उत्पादन, क़ीमतों और अवसर का क्या होता है — और यह कि किसी देश के व्यापार की संरचना उसकी स्थिति के बारे में क्या बताती है।",
          mr: "प्रकरण वाहतूक आणि दळणवळणाला अर्थव्यवस्थेच्या जीवनरेषा म्हणते, जे रूपक वाटते. दाखवा की हा खऱ्या आशयाचा दावा आहे — हे समजावून की ज्या जिल्ह्यापर्यंत रस्ता कधीच पोहोचला नाही तिथे उत्पादन, किमती आणि संधीचे काय होते — आणि हे की एखाद्या देशाच्या व्यापाराची रचना त्याच्या स्थानाबद्दल काय सांगते.",
        },
        choices: [
          {
            en: "Without transport a producer can sell only to neighbours, so surplus is worthless and there is no reason to grow more than the family eats; prices swing wildly because local shortage cannot be relieved from outside; and schools, hospitals and jobs stay out of reach, so the district exports its young instead of its produce. As for trade composition, a country that exports raw materials and imports finished goods is selling the cheapest stage of every chain — which is why the shift towards exporting manufactures and services is treated as a mark of development",
            hi: "परिवहन के बिना उत्पादक केवल पड़ोसियों को बेच सकता है, अतः अधिशेष निर्मूल्य है और परिवार जितना खाता उससे अधिक उगाने का कोई कारण नहीं; क़ीमतें बेतहाशा झूलती हैं क्योंकि स्थानीय कमी बाहर से नहीं पाटी जा सकती; और विद्यालय, अस्पताल तथा नौकरियाँ पहुँच से बाहर रहती हैं, अतः ज़िला अपनी उपज के बजाय अपने युवा निर्यात करता है। जहाँ तक व्यापार की संरचना, जो देश कच्चा माल निर्यात और तैयार वस्तुएँ आयात करता है वह हर शृंखला का सबसे सस्ता चरण बेच रहा है — इसीलिए विनिर्मित वस्तुओं तथा सेवाओं के निर्यात की ओर बदलाव विकास का चिह्न माना जाता है",
            mr: "वाहतुकीविना उत्पादक फक्त शेजाऱ्यांना विकू शकतो, म्हणून अतिरिक्त निर्मूल्य आणि कुटुंब जेवढे खाते त्याहून अधिक पिकवण्याचे कारण नाही; किमती प्रचंड हेलकावतात कारण स्थानिक टंचाई बाहेरून भरून काढता येत नाही; आणि शाळा, रुग्णालये व नोकऱ्या आवाक्याबाहेर राहतात, म्हणून जिल्हा आपल्या उपजेऐवजी आपले तरुण निर्यात करतो. व्यापार रचनेबाबत, जो देश कच्चा माल निर्यात आणि तयार वस्तू आयात करतो तो प्रत्येक साखळीचा सर्वांत स्वस्त टप्पा विकत आहे — म्हणूनच उत्पादित वस्तू व सेवा निर्यातीकडचा बदल विकासाचे चिन्ह मानला जातो",
          },
          {
            en: "Nothing happens; a district without roads produces and earns exactly as much as one with them",
            hi: "कुछ नहीं होता; बिना सड़कों वाला ज़िला उतना ही उत्पादन और कमाई करता है जितना सड़कों वाला",
            mr: "काहीही होत नाही; रस्त्यांविनाचा जिल्हा रस्ते असलेल्याइतकेच उत्पादन आणि कमाई करतो",
          },
          {
            en: "Transport matters only for luxury goods, since food and necessities are always produced locally everywhere",
            hi: "परिवहन केवल विलासिता की वस्तुओं के लिए मायने रखता है, क्योंकि भोजन और आवश्यक वस्तुएँ हर जगह सदा स्थानीय रूप से बनती हैं",
            mr: "वाहतूक फक्त चैनीच्या वस्तूंसाठी महत्त्वाची, कारण अन्न आणि गरजेच्या वस्तू सर्वत्र सदैव स्थानिकरीत्या तयार होतात",
          },
          {
            en: "The composition of trade is irrelevant; only its total value can tell anything about an economy",
            hi: "व्यापार की संरचना अप्रासंगिक है; केवल उसका कुल मूल्य ही अर्थव्यवस्था के बारे में कुछ बता सकता है",
            mr: "व्यापाराची रचना असंबद्ध; फक्त त्याचे एकूण मूल्यच अर्थव्यवस्थेबद्दल काही सांगू शकते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The word lifeline is doing real work, and the way to see it is to remove the transport and watch what stops. Begin with production. A farmer's decision about how much to grow is not made in isolation from the market; it is made against what can be sold. If the only buyers are the neighbours, and the neighbours grow the same crop and harvest it in the same week, then surplus has no value at all — worse, in a good year the local price collapses precisely because everyone has a surplus at once. The rational response is to grow roughly what the household eats and no more. That is what subsistence means, and it is a consequence of isolation rather than of ignorance or lack of ambition. Open a road and the calculation changes overnight: the same farmer can now grow a cash crop, or vegetables and milk that need to reach a town within hours, and specialisation becomes possible because what is not grown can be bought in. The whole gain from division of labour, which is the foundation of any developed economy, depends on being able to move things. Now prices. In an isolated district, a bad harvest cannot be relieved from outside, so scarcity translates directly into famine prices; and a good harvest cannot be exported, so abundance translates into ruin. Connect the district and both extremes are damped, because supply can flow in when local production fails and flow out when it is plentiful. Historically, the worst Indian famines were often not absolute national shortages but local failures that could not be reached in time — which is why railway expansion is part of famine history and not only of trade history. Then opportunity. Roads carry people as well as goods: to a hospital during a night emergency, to a secondary school in the next town, to a job, to a court, to a bank. A district without them exports the one thing that will walk out on its own — its young people — and keeps the poverty. Communication does the same work for information: a farmer who knows the price in three markets can refuse the first offer, and a mobile phone has repeatedly been shown to raise the price fishermen and farmers actually receive, without a single road being built. Now the second half of the question. Trade totals tell you the volume of exchange; composition tells you what a country's role in the world economy is. Selling ore, cotton and grain and buying machinery, electronics and finished goods means capturing the cheapest link of every chain — the value added by processing, design and branding accrues to somebody else, and the terms of trade tend to move against you over time because primary prices are volatile and manufactured prices are not. That is precisely the pattern colonial India was locked into, and the reason industrialisation and service exports have been treated since 1947 as the measure of progress. India's shift towards exporting software, engineering goods, pharmaceuticals and refined petroleum, rather than only raw materials, is a change in position and not merely in volume. So the metaphor is exact. Arteries do not create blood, but nothing the body produces reaches anywhere without them, and a limb they do not serve wastes while the rest of the body is healthy. That is a claim about causation, and it is why roads, rail, ports and networks are treated as investment rather than as expenditure. (The wrong answers deny an effect that connectivity studies measure directly, imagine necessities need no transport, or discard the composition of trade, which is precisely where a country's position in the world economy shows up.)",
          hi: "'जीवन रेखा' शब्द असली काम कर रहा है, और उसे देखने का तरीक़ा यह कि परिवहन हटाओ और देखो क्या रुक जाता है। उत्पादन से शुरू। किसान का यह निर्णय कि कितना उगाया जाए बाज़ार से अलग नहीं लिया जाता; वह इसके सामने लिया जाता है कि बेचा क्या जा सकता है। यदि एकमात्र ख़रीदार पड़ोसी हों, और पड़ोसी वही फ़सल उगाते और उसी हफ़्ते काटते हों, तो अधिशेष का कोई मूल्य ही नहीं — इससे बुरा यह कि अच्छे वर्ष में स्थानीय क़ीमत ठीक इसलिए ढह जाती है कि सबके पास एक साथ अधिशेष है। तर्कसंगत प्रतिक्रिया यह कि लगभग उतना उगाओ जितना घर खाता है, अधिक नहीं। निर्वाह का यही अर्थ है, और वह अज्ञान या महत्वाकांक्षा की कमी का नहीं, अलगाव का परिणाम है। सड़क खोलो और गणना रातोंरात बदल जाती है: वही किसान अब नक़दी फ़सल उगा सकता है, या ऐसी सब्ज़ियाँ और दूध जिन्हें घंटों में क़स्बे तक पहुँचना है, और विशेषीकरण संभव हो जाता है क्योंकि जो नहीं उगाया वह ख़रीदा जा सकता है। श्रम-विभाजन से मिलता पूरा लाभ, जो किसी भी विकसित अर्थव्यवस्था की नींव है, चीज़ों को हिला सकने पर निर्भर है। अब क़ीमतें। अलग-थलग ज़िले में बुरी फ़सल बाहर से नहीं पाटी जा सकती, अतः कमी सीधे अकाल-क़ीमतों में बदल जाती है; और अच्छी फ़सल निर्यात नहीं हो सकती, अतः प्रचुरता बरबादी में। ज़िले को जोड़ो और दोनों छोर मंद पड़ जाते हैं, क्योंकि स्थानीय उत्पादन विफल होने पर आपूर्ति भीतर आ सकती है और भरपूर होने पर बाहर जा सकती है। ऐतिहासिक रूप से, सबसे बुरे भारतीय अकाल अक्सर पूर्ण राष्ट्रीय कमी नहीं बल्कि ऐसी स्थानीय विफलताएँ थीं जहाँ समय पर पहुँचा नहीं जा सका — इसीलिए रेल-विस्तार व्यापार के ही नहीं, अकाल के इतिहास का भी हिस्सा है। फिर अवसर। सड़कें माल के साथ लोग भी ढोती हैं: रात की आपात स्थिति में अस्पताल तक, अगले क़स्बे के माध्यमिक विद्यालय तक, नौकरी तक, अदालत तक, बैंक तक। उनसे रहित ज़िला वह एक चीज़ निर्यात करता है जो अपने आप चल देगी — अपने युवा — और निर्धनता अपने पास रखता है। संचार सूचना के लिए वही काम करता है: जो किसान तीन बाज़ारों का दाम जानता है वह पहला प्रस्ताव ठुकरा सकता है, और मोबाइल फ़ोन ने बार-बार दिखाया है कि वह मछुआरों तथा किसानों को वास्तव में मिलता दाम बढ़ा देता है, बिना एक भी सड़क बने। अब प्रश्न का दूसरा आधा। व्यापार के कुल तुम्हें आदान-प्रदान का आयतन बताते हैं; संरचना बताती है कि विश्व अर्थव्यवस्था में देश की भूमिका क्या है। अयस्क, कपास और अनाज बेचना तथा मशीनरी, इलेक्ट्रॉनिक्स और तैयार वस्तुएँ ख़रीदना हर शृंखला की सबसे सस्ती कड़ी पकड़ना है — प्रसंस्करण, रचना तथा ब्रांडिंग से जुड़ा मूल्य किसी और को जाता है, और व्यापार की शर्तें समय के साथ तुम्हारे विरुद्ध खिसकती हैं क्योंकि प्राथमिक क़ीमतें अस्थिर हैं और विनिर्मित क़ीमतें नहीं। ठीक यही वह ढर्रा था जिसमें औपनिवेशिक भारत जकड़ा था, और यही कारण कि 1947 से औद्योगीकरण तथा सेवा-निर्यात को प्रगति का माप माना गया। भारत का केवल कच्चे माल के बजाय सॉफ़्टवेयर, अभियांत्रिकी वस्तुओं, औषधियों और शोधित पेट्रोलियम के निर्यात की ओर खिसकना स्थिति का बदलाव है, केवल आयतन का नहीं। अतः रूपक सटीक है। धमनियाँ रक्त नहीं बनातीं, पर उनके बिना शरीर जो बनाता है वह कहीं नहीं पहुँचता, और जिस अंग तक वे नहीं जातीं वह शेष शरीर के स्वस्थ रहते हुए सूख जाता है। यह कार्य-कारण का दावा है, और इसीलिए सड़कें, रेल, बंदरगाह तथा जाल व्यय नहीं, निवेश माने जाते हैं। (ग़लत उत्तर उस प्रभाव को नकारते जिसे संयोजकता के अध्ययन सीधे नापते हैं, कल्पना करते कि आवश्यक वस्तुओं को परिवहन नहीं चाहिए, या व्यापार की संरचना को फेंक देते — जो ठीक वही जगह है जहाँ विश्व अर्थव्यवस्था में देश की स्थिति दिखती है।)",
          mr: "'जीवनरेषा' हा शब्द खरे काम करत आहे, आणि ते पाहण्याचा मार्ग म्हणजे वाहतूक काढा आणि काय थांबते ते पाहा. उत्पादनापासून सुरू. शेतकऱ्याचा किती पिकवावे हा निर्णय बाजारापासून वेगळा घेतला जात नाही; तो काय विकता येईल यासमोर घेतला जातो. एकमेव खरेदीदार शेजारी असतील, आणि शेजारी तेच पीक पिकवत आणि त्याच आठवड्यात कापत असतील, तर अतिरिक्ताला काहीच मोल नाही — याहून वाईट, चांगल्या वर्षी स्थानिक किंमत नेमके यामुळे कोसळते की सर्वांकडे एकाच वेळी अतिरिक्त आहे. तर्कशुद्ध प्रतिसाद हा की घर जेवढे खाते तेवढेच पिकवा, अधिक नाही. निर्वाहाचा हाच अर्थ, आणि तो अज्ञान वा महत्त्वाकांक्षेच्या अभावाचा नव्हे तर एकाकीपणाचा परिणाम. रस्ता उघडा आणि गणित रातोरात बदलते: तोच शेतकरी आता नगदी पीक पिकवू शकतो, वा अशा भाज्या आणि दूध ज्यांना तासांत गावात पोहोचायचे आहे, आणि विशेषीकरण शक्य होते कारण जे पिकवले नाही ते विकत घेता येते. श्रमविभागणीतून मिळणारा अख्खा फायदा, जो कोणत्याही विकसित अर्थव्यवस्थेचा पाया, वस्तू हलवता येण्यावर अवलंबून. आता किमती. एकाकी जिल्ह्यात वाईट पीक बाहेरून भरून काढता येत नाही, म्हणून टंचाई थेट दुष्काळी किमतींत बदलते; आणि चांगले पीक निर्यात होऊ शकत नाही, म्हणून विपुलता नाशात. जिल्हा जोडा आणि दोन्ही टोके मंदावतात, कारण स्थानिक उत्पादन बुडाल्यास पुरवठा आत येऊ शकतो आणि भरपूर असल्यास बाहेर जाऊ शकतो. ऐतिहासिकदृष्ट्या, सर्वांत वाईट भारतीय दुष्काळ अनेकदा निरपेक्ष राष्ट्रीय टंचाई नव्हे तर अशी स्थानिक अपयशे होती जिथे वेळेत पोहोचता आले नाही — म्हणूनच रेल्वेविस्तार व्यापाराच्याच नव्हे तर दुष्काळाच्याही इतिहासाचा भाग. मग संधी. रस्ते मालासोबत माणसेही वाहतात: रात्रीच्या आणीबाणीत रुग्णालयापर्यंत, पुढच्या गावातील माध्यमिक शाळेपर्यंत, नोकरीपर्यंत, न्यायालयापर्यंत, बँकेपर्यंत. त्यांविनाचा जिल्हा ती एक गोष्ट निर्यात करतो जी स्वतःहून चालत जाईल — आपली तरुण माणसे — आणि गरिबी स्वतःकडे ठेवतो. दळणवळण माहितीसाठी तेच काम करते: जो शेतकरी तीन बाजारांतील भाव जाणतो तो पहिला प्रस्ताव नाकारू शकतो, आणि भ्रमणध्वनीने वारंवार दाखवले आहे की तो मच्छीमार व शेतकऱ्यांना प्रत्यक्ष मिळणारा भाव वाढवतो, एकही रस्ता न बांधता. आता प्रश्नाचा दुसरा अर्धा भाग. व्यापाराचे एकूण तुम्हाला देवाणघेवाणीचे आकारमान सांगतात; रचना सांगते की जागतिक अर्थव्यवस्थेत देशाची भूमिका काय. धातुक, कापूस आणि धान्य विकणे आणि यंत्रसामग्री, इलेक्ट्रॉनिक्स व तयार वस्तू विकत घेणे म्हणजे प्रत्येक साखळीचा सर्वांत स्वस्त दुवा पकडणे — प्रक्रिया, रचना व ब्रँडिंगने जोडलेले मूल्य दुसऱ्या कोणाला जाते, आणि व्यापाराच्या अटी काळाबरोबर तुमच्याविरुद्ध सरकतात कारण प्राथमिक किमती अस्थिर आणि उत्पादित किमती नाहीत. नेमके हेच ते चाकोरी होते जिच्यात वसाहती भारत अडकला होता, आणि हेच कारण की 1947 पासून औद्योगीकरण व सेवा-निर्यात प्रगतीचे माप मानले गेले. भारताचे केवळ कच्च्या मालाऐवजी सॉफ्टवेअर, अभियांत्रिकी वस्तू, औषधे आणि शुद्ध पेट्रोलियम निर्यातीकडे सरकणे हा स्थानाचा बदल, केवळ आकारमानाचा नव्हे. म्हणून रूपक अचूक. धमन्या रक्त तयार करत नाहीत, पण त्यांच्याविना शरीर जे बनवते ते कुठेही पोहोचत नाही, आणि ज्या अवयवापर्यंत त्या जात नाहीत तो उरलेले शरीर निरोगी असतानाही सुकतो. हा कार्यकारणाचा दावा, आणि म्हणूनच रस्ते, रेल्वे, बंदरे व जाळी खर्च नव्हे तर गुंतवणूक मानली जातात. (चुकीची उत्तरे जोडणी-अभ्यास थेट मोजत असलेला परिणाम नाकारतात, गरजेच्या वस्तूंना वाहतूक लागत नाही अशी कल्पना करतात, वा व्यापाराची रचना फेकून देतात — जी नेमकी तीच जागा जिथे जागतिक अर्थव्यवस्थेतील देशाचे स्थान दिसते.)",
        },
      },
    ],
  },
];
